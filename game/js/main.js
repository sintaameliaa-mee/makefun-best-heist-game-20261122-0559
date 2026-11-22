// main.js — Velvet Vault: the Meridian Gallery Heist. Boot, game loop and
// state machine. The loop is the only place that knows about time: it asks
// input what the player is doing, moves the thief, the guards and the
// cameras, feeds what they see into the alarm meter, and hands the frame
// to the renderer and the HUD.
//
// Screenshot staging: ?scene=cover|loot|alarm|win starts the game in a
// state a real playthrough reaches (mid-room, at the loot, mid-alarm, or
// the getaway screen) so the entry's screenshots can show the game itself.
// It changes only the starting state; the game plays exactly the same.

import { LEVELS, ROOM } from "./levels.js";
import { createThief, updateThief, tossCoin, puffSmoke, thiefHiddenBySmoke, nearestLoot, grabLoot, noiseRadius } from "./thief.js";
import { createGuard, updateGuard, distractGuards, guardSeesThief, guardCatchesThief, guardsHearNoise } from "./guards.js";
import { createCamera, updateCamera, cameraSeesThief } from "./cameras.js";
import { createAlarm, updateAlarm, resetAlarmSound, GUARD_FILL_RATE, CAMERA_FILL_RATE } from "./alarm.js";
import { createInput } from "./input.js";
import { renderGame } from "./render.js";
import { createHud, showOverlay, hideOverlays, showToast, updateToast, updateHud, formatScore } from "./hud.js";
import { unlockAudio, playGrab, playUnlock, playCaught, playWin, playClick, setMuted, isMuted, stopAlarmLoop } from "./audio.js";
import { pointInRect } from "./geometry.js";

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const input = createInput(canvas);
const hud = createHud();

const params = new URLSearchParams(window.location.search);
const scene = params.get("scene");

const game = {
  state: "title", // title | playing | paused | caught | levelComplete | win
  levelIndex: 0,
  level: LEVELS[0],
  thief: null,
  guards: [],
  cameras: [],
  alarm: createAlarm(),
  elapsed: 0,
  time: 0,
  seenBy: new Set(),
  bankedLoot: 0,
  ghostRun: true,
  totalLoot: 0,
};

function loadLevel(index) {
  game.levelIndex = index;
  game.level = LEVELS[index];
  // Fresh loot each time a room loads; the definition itself is never mutated.
  game.level.loot = LEVELS[index].loot.map((item) => ({ ...item, taken: false }));
  game.thief = createThief(game.level.spawn);
  game.guards = game.level.guards.map(createGuard);
  game.cameras = game.level.cameras.map(createCamera);
  game.alarm = createAlarm();
  game.seenBy = new Set();
  resetAlarmSound();
}

function startPlaying() {
  unlockAudio();
  game.state = "playing";
  hideOverlays(hud);
  playClick();
}

function retryLevel() {
  loadLevel(game.levelIndex);
  startPlaying();
  showToast(hud, "Back to the shadows — the room resets.", 3);
}

function nextLevel() {
  game.bankedLoot += game.thief.lootValue;
  if (game.levelIndex + 1 >= LEVELS.length) {
    finishHeist();
    return;
  }
  loadLevel(game.levelIndex + 1);
  startPlaying();
  showToast(hud, game.level.brief, 4);
}

function finishHeist() {
  game.totalLoot = game.bankedLoot + game.thief.lootValue;
  game.state = "win";
  stopAlarmLoop();
  playWin();
  const score = formatScore(game);
  hud.winDetail.innerHTML =
    `Loot <b>$${game.totalLoot.toLocaleString("en-US")}</b> · Time ${score.timeText}` +
    (score.ghostBonus ? ` · Ghost bonus $${score.ghostBonus.toLocaleString("en-US")}` : "") +
    ` · Speed bonus $${score.timeBonus.toLocaleString("en-US")}` +
    `<br><span class="big-score">Final take: $${score.total.toLocaleString("en-US")}</span>` +
    `<br>Rook slips into the night as the Meridian Gallery sleeps on.`;
  showOverlay(hud, "win");
}

function caughtBy(guard) {
  game.state = "caught";
  stopAlarmLoop();
  playCaught();
  hud.caughtDetail.innerHTML =
    `A guard laid a hand on Rook in <b>${game.level.name}</b>.` +
    `<br>Loot kept so far: <b>$${game.bankedLoot.toLocaleString("en-US")}</b>. The room resets — the plan does not.`;
  showOverlay(hud, "caught");
}

// Run the patrols forward a few seconds so a staged screenshot opens with
// the guards spread along their routes instead of bunched at their starts.
function warmupPatrols(seconds) {
  const step = 1 / 60;
  let t = 0;
  while (t < seconds) {
    for (const guard of game.guards) updateGuard(guard, step, game.level.solids, ROOM, null);
    for (const camera of game.cameras) updateCamera(camera, t);
    t += step;
  }
}

function applyScene() {
  if (!scene) return;
  loadLevel(0);
  if (scene === "win") {
    game.bankedLoot = 7400;
    game.thief.lootValue = 1200;
    game.elapsed = 234;
    game.ghostRun = true;
    finishHeist();
    return;
  }
  warmupPatrols(6);
  if (scene === "loot") {
    game.thief.x = 640;
    game.thief.y = 380;
    game.thief.facing = -Math.PI / 2;
    game.alarm.value = 45;
    showToast(hud, "The sapphire is right there — press E to lift it.", 6);
  } else if (scene === "alarm") {
    // Rook slipped behind the crates; the guards hunt the last place they
    // saw him, across the room — the alarm is up but nobody has him yet.
    game.thief.x = 200;
    game.thief.y = 560;
    game.thief.facing = -Math.PI / 3;
    game.alarm.value = 82;
    game.alarm.active = true;
    game.alarm.lastSeen = { x: 700, y: 200 };
    showToast(hud, "ALARM! Break line of sight and hide!", 6);
  } else {
    // cover: mid-room, mid-patrol, everything visible in one frame.
    game.thief.x = 480;
    game.thief.y = 420;
    game.thief.facing = Math.PI / 5;
  }
  game.state = "playing";
  hideOverlays(hud);
}

function updatePlaying(dt) {
  const { thief, level } = game;
  updateThief(thief, input, dt, level.solids, ROOM);
  game.elapsed += dt;

  // Tools: click tosses a coin, Space puffs smoke, E grabs loot.
  for (const click of input.takeClicks()) {
    if (click.button !== 0) continue;
    const mark = tossCoin(thief, click.x, click.y);
    if (mark) {
      distractGuards(game.guards, mark);
      showToast(hud, "Coin tossed — the guards go to look.", 2);
    } else {
      showToast(hud, "Out of coins.", 2);
    }
  }
  if (input.wasPressed("Space")) {
    if (!puffSmoke(thief)) showToast(hud, "Out of smoke.", 2);
  }
  if (input.wasPressed("KeyE")) {
    const item = nearestLoot(thief, level.loot);
    if (item) {
      grabLoot(thief, item);
      if (item.main) {
        playUnlock();
        game.alarm.value = Math.min(100, game.alarm.value + 25);
        showToast(hud, "Sapphire secured! The exit is open — run for it!", 4);
      } else {
        playGrab();
        showToast(hud, `${item.label} pocketed — $${item.value.toLocaleString("en-US")}.`, 2);
      }
    }
  }

  // Vision: guards and cameras read the thief; smoke hides them.
  const inSmoke = thiefHiddenBySmoke(thief);
  let seenRate = 0;
  game.seenBy.clear();
  for (const guard of game.guards) {
    const strength = guardSeesThief(guard, thief, level.solids, inSmoke);
    if (strength > 0) {
      game.seenBy.add(guard);
      seenRate = Math.max(seenRate, strength * GUARD_FILL_RATE);
    }
  }
  for (const camera of game.cameras) {
    const strength = cameraSeesThief(camera, thief, level.solids, inSmoke);
    if (strength > 0) seenRate = Math.max(seenRate, strength * CAMERA_FILL_RATE);
  }
  const stance = thief.sprinting ? 1.6 : thief.crouching ? 0.5 : 1;
  if (seenRate > 0) {
    game.alarm.lastSeen = { x: thief.x, y: thief.y };
    if (game.alarm.value > 50) game.ghostRun = false;
  }
  updateAlarm(game.alarm, seenRate, stance, dt);

  const huntTarget = game.alarm.active ? game.alarm.lastSeen : null;
  for (const guard of game.guards) {
    updateGuard(guard, dt, level.solids, ROOM, huntTarget);
    if (guardCatchesThief(guard, thief)) {
      caughtBy(guard);
      return;
    }
  }
  for (const camera of game.cameras) updateCamera(camera, game.time);
  guardsHearNoise(game.guards, thief, noiseRadius(thief));

  // The exit opens only once the sapphire is in the bag.
  if (thief.hasSapphire && pointInRect(thief.x, thief.y, level.exit)) {
    if (game.levelIndex + 1 >= LEVELS.length) {
      // finishHeist banks this room's loot itself; do not add it twice.
      finishHeist();
    } else {
      game.state = "levelComplete";
      playWin();
      hud.levelDetail.innerHTML =
        `${level.name} cleared — <b>$${thief.lootValue.toLocaleString("en-US")}</b> lifted from this room.` +
        `<br>Press Enter or click to move on to the next room.`;
      showOverlay(hud, "level");
    }
    return;
  }

  if (input.wasPressed("KeyP")) {
    game.state = "paused";
    showOverlay(hud, "paused");
  }
}

function updateTitle(dt) {
  // The room idles behind the title card: patrols walk, cameras sweep.
  for (const guard of game.guards) updateGuard(guard, dt, game.level.solids, ROOM, null);
  for (const camera of game.cameras) updateCamera(camera, game.time);
  if (input.wasPressed("Enter") || input.takeClicks().length > 0) startPlaying();
}

let lastNow = performance.now();

function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastNow) / 1000));
  lastNow = now;
  game.time += dt;

  if (input.wasPressed("KeyM")) {
    setMuted(!isMuted());
    showToast(hud, isMuted() ? "Sound off." : "Sound on.", 2);
  }

  if (game.state === "playing") {
    updatePlaying(dt);
  } else if (game.state === "title") {
    updateTitle(dt);
  } else if (game.state === "paused") {
    if (input.wasPressed("KeyP") || input.wasPressed("Enter")) startPlaying();
    input.takeClicks();
  } else if (game.state === "caught") {
    if (input.wasPressed("KeyR") || input.wasPressed("Enter") || input.takeClicks().length > 0) retryLevel();
  } else if (game.state === "levelComplete") {
    if (input.wasPressed("Enter") || input.takeClicks().length > 0) nextLevel();
  } else if (game.state === "win") {
    if (input.wasPressed("KeyR") || input.wasPressed("Enter")) {
      game.bankedLoot = 0;
      game.elapsed = 0;
      game.ghostRun = true;
      loadLevel(0);
      startPlaying();
    }
    input.takeClicks();
  }

  if (game.state === "playing" && input.wasPressed("KeyR")) retryLevel();

  updateToast(hud, dt);
  updateHud(hud, game);
  renderGame(ctx, game);
  input.clearPressed();
  requestAnimationFrame(frame);
}

loadLevel(0);
applyScene();
updateHud(hud, game);
requestAnimationFrame(frame);

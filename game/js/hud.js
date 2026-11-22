// hud.js — the DOM layer: alarm meter, loot and tool counts, timer,
// objective line, toast messages and the overlay screens (title, caught,
// level complete, getaway). The canvas draws the room; the HUD tells the
// player what it all means.

export function createHud() {
  const el = (id) => document.getElementById(id);
  return {
    alarmFill: el("alarm-fill"),
    alarmLabel: el("alarm-label"),
    lootValue: el("loot-value"),
    coinCount: el("coin-count"),
    smokeCount: el("smoke-count"),
    levelName: el("level-name"),
    objective: el("objective"),
    timer: el("timer"),
    toast: el("toast"),
    hint: el("hint"),
    overlays: {
      title: el("overlay-title"),
      caught: el("overlay-caught"),
      level: el("overlay-level"),
      win: el("overlay-win"),
      paused: el("overlay-paused"),
    },
    caughtDetail: el("caught-detail"),
    levelDetail: el("level-detail"),
    winDetail: el("win-detail"),
    toastTimer: 0,
  };
}

export function showOverlay(hud, name) {
  for (const [key, node] of Object.entries(hud.overlays)) {
    node.classList.toggle("visible", key === name);
  }
}

export function hideOverlays(hud) {
  showOverlay(hud, null);
}

export function showToast(hud, text, seconds) {
  hud.toast.textContent = text;
  hud.toast.classList.add("visible");
  hud.toastTimer = seconds || 3;
}

export function updateToast(hud, dt) {
  if (hud.toastTimer > 0) {
    hud.toastTimer -= dt;
    if (hud.toastTimer <= 0) hud.toast.classList.remove("visible");
  }
}

export function updateHud(hud, game) {
  const { alarm, thief, levelIndex, level, elapsed } = game;
  const pct = Math.round(alarm.value);
  hud.alarmFill.style.width = `${pct}%`;
  hud.alarmFill.className = "alarm-fill " + (alarm.active ? "alarm" : pct >= 60 ? "high" : pct >= 25 ? "rising" : "calm");
  hud.alarmLabel.textContent = alarm.active
    ? "ALARM! HIDE!"
    : pct >= 60
      ? `ALARM ${pct}% — BREAK LINE OF SIGHT`
      : pct >= 25
        ? `ALARM ${pct}% — SPOTTED`
        : `ALARM ${pct}%`;
  hud.lootValue.textContent = `$${thief.lootValue.toLocaleString("en-US")}`;
  hud.coinCount.textContent = `◉ ${thief.coins}`;
  hud.smokeCount.textContent = `☁ ${thief.smoke}`;
  hud.levelName.textContent = level.name;
  hud.objective.textContent = thief.hasSapphire
    ? "Sapphire secured — reach the EXIT!"
    : "Steal the Crimson Star Sapphire, then reach the EXIT.";
  const minutes = Math.floor(elapsed / 60);
  const seconds = Math.floor(elapsed % 60);
  hud.timer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  hud.hint.textContent = "WASD / arrows move · Shift sprint (loud) · C crouch · Click toss coin · Space smoke · E grab loot · P pause · M mute";
}

export function formatScore(game) {
  const minutes = Math.floor(game.elapsed / 60);
  const seconds = Math.floor(game.elapsed % 60);
  const timeText = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const ghostBonus = game.ghostRun ? 1500 : 0;
  const timeBonus = Math.max(0, 3000 - Math.floor(game.elapsed) * 5);
  const total = game.totalLoot + ghostBonus + timeBonus;
  return { timeText, ghostBonus, timeBonus, total };
}

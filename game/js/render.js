// render.js — everything the player sees, drawn on one canvas in 2D.
// The look is "night gallery": deep blue marble, warm gold trim, amber
// guard cones, red camera cones, and a cyan sapphire that glows. Safe cover
// is dark stone, danger is amber and red, loot is gold and cyan — readable
// at a glance. All art is drawn in code; no image files ship with the game.

import { ROOM } from "./levels.js";
import { raycastDistance } from "./geometry.js";

const CONE_RAYS = 22;

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx, time) {
  ctx.fillStyle = "#0b0e18";
  ctx.fillRect(0, 0, 1280, 664);
  // Marble tiles.
  ctx.fillStyle = "#171d2e";
  ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h);
  ctx.strokeStyle = "rgba(120, 140, 190, 0.10)";
  ctx.lineWidth = 1;
  for (let x = ROOM.x + 56; x < ROOM.x + ROOM.w; x += 56) {
    ctx.beginPath(); ctx.moveTo(x, ROOM.y); ctx.lineTo(x, ROOM.y + ROOM.h); ctx.stroke();
  }
  for (let y = ROOM.y + 56; y < ROOM.y + ROOM.h; y += 56) {
    ctx.beginPath(); ctx.moveTo(ROOM.x, y); ctx.lineTo(ROOM.x + ROOM.w, y); ctx.stroke();
  }
  // Warm pools of light from the ceiling lamps.
  for (const [lx, ly] of [[320, 160], [960, 160], [320, 500], [960, 500], [640, 330]]) {
    const glow = ctx.createRadialGradient(lx, ly, 10, lx, ly, 190);
    glow.addColorStop(0, "rgba(255, 205, 110, 0.10)");
    glow.addColorStop(1, "rgba(255, 205, 110, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(lx - 190, ly - 190, 380, 380);
  }
  // Room border: dark stone with a gold trim line.
  ctx.strokeStyle = "#3d4a6b";
  ctx.lineWidth = 10;
  ctx.strokeRect(ROOM.x - 5, ROOM.y - 5, ROOM.w + 10, ROOM.h + 10);
  ctx.strokeStyle = "rgba(212, 175, 55, 0.55)";
  ctx.lineWidth = 2;
  ctx.strokeRect(ROOM.x + 2, ROOM.y + 2, ROOM.w - 4, ROOM.h - 4);
}

function drawSolid(ctx, solid) {
  const { x, y, w, h, kind } = solid;
  if (kind === "pillar") {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, "#4a5878");
    g.addColorStop(1, "#2a3350");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(212, 175, 55, 0.7)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.beginPath();
    ctx.arc(x + w / 2 - 8, y + h / 2 - 8, w / 5, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (kind === "case") {
    ctx.fillStyle = "#232c44";
    roundedRect(ctx, x, y, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(212, 175, 55, 0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "rgba(150, 200, 255, 0.18)";
    roundedRect(ctx, x + 6, y + 6, w - 12, h - 12, 4);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 220, 130, 0.85)";
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (kind === "crate") {
    ctx.fillStyle = "#5a4632";
    roundedRect(ctx, x, y, w, h, 4);
    ctx.fill();
    ctx.strokeStyle = "#3a2d1f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + w, y + h);
    ctx.moveTo(x + w, y); ctx.lineTo(x, y + h);
    ctx.stroke();
    ctx.strokeStyle = "rgba(212, 175, 55, 0.35)";
    ctx.lineWidth = 2;
    roundedRect(ctx, x, y, w, h, 4);
    ctx.stroke();
    return;
  }
  if (kind === "pedestal") {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, "#39466a");
    g.addColorStop(1, "#232c44");
    ctx.fillStyle = g;
    roundedRect(ctx, x, y, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(212, 175, 55, 0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();
    return;
  }
  // Partition wall.
  ctx.fillStyle = "#2c3652";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(212, 175, 55, 0.45)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
}

function drawVisionCone(ctx, x, y, facing, range, halfAngle, blockers, color, edgeColor) {
  const points = [[x, y]];
  for (let i = 0; i <= CONE_RAYS; i++) {
    const a = facing - halfAngle + (2 * halfAngle * i) / CONE_RAYS;
    const d = raycastDistance(x, y, a, range, blockers, ROOM);
    points.push([x + Math.cos(a) * d, y + Math.sin(a) * d]);
  }
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  const grad = ctx.createRadialGradient(x, y, 10, x, y, range);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = edgeColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawExit(ctx, exit, unlocked, time) {
  const { x, y, w, h, label } = exit;
  const open = unlocked;
  ctx.fillStyle = open ? "#12351f" : "#3a1d1d";
  roundedRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = open ? "#3ddc78" : "#e5484d";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = open ? "#3ddc78" : "#e5484d";
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.textAlign = "center";
  const pulse = open ? 0.65 + 0.35 * Math.sin(time * 4) : 1;
  ctx.globalAlpha = pulse;
  ctx.fillText(open ? "EXIT" : "LOCKED", x + w / 2, y + h / 2 - 2);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(220, 230, 255, 0.75)";
  ctx.font = "10px system-ui, sans-serif";
  ctx.fillText(label, x + w / 2, y + h / 2 + 16);
}

function drawLoot(ctx, item, time) {
  if (item.taken) return;
  const bob = Math.sin(time * 2 + item.x) * 3;
  if (item.kind === "sapphire") {
    const glow = ctx.createRadialGradient(item.x, item.y + bob, 4, item.x, item.y + bob, 60);
    glow.addColorStop(0, "rgba(80, 220, 255, 0.55)");
    glow.addColorStop(1, "rgba(80, 220, 255, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(item.x - 60, item.y + bob - 60, 120, 120);
    // Star-cut gem: two crossed diamonds.
    ctx.fillStyle = "#6fe3ff";
    ctx.beginPath();
    ctx.moveTo(item.x, item.y + bob - 18);
    ctx.lineTo(item.x + 13, item.y + bob);
    ctx.lineTo(item.x, item.y + bob + 18);
    ctx.lineTo(item.x - 13, item.y + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#d8f6ff";
    ctx.beginPath();
    ctx.moveTo(item.x, item.y + bob - 18);
    ctx.lineTo(item.x + 6, item.y + bob - 2);
    ctx.lineTo(item.x, item.y + bob + 4);
    ctx.lineTo(item.x - 6, item.y + bob - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("★ SAPPHIRE ★", item.x, item.y + bob - 26);
    return;
  }
  if (item.kind === "gold") {
    ctx.fillStyle = "#d4af37";
    roundedRect(ctx, item.x - 14, item.y + bob - 8, 28, 16, 3);
    ctx.fill();
    ctx.fillStyle = "#f6e27a";
    ctx.fillRect(item.x - 10, item.y + bob - 6, 20, 4);
    return;
  }
  // Painting: a small framed canvas.
  ctx.fillStyle = "#8a6d2f";
  ctx.fillRect(item.x - 16, item.y + bob - 12, 32, 24);
  ctx.fillStyle = "#274b8f";
  ctx.fillRect(item.x - 12, item.y + bob - 8, 24, 16);
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(item.x - 4, item.y + bob - 2, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawGuard(ctx, guard, seesThief, time) {
  const alerted = guard.alerted || guard.state === "hunt";
  // Body: navy uniform, brass buttons, cap.
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.beginPath();
  ctx.ellipse(guard.x, guard.y + 12, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = alerted ? "#7a2b2b" : "#2b3a67";
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, guard.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = alerted ? "#ff5a5a" : "#8fa3d9";
  ctx.lineWidth = 2;
  ctx.stroke();
  // Cap brim points where the guard looks.
  const fx = guard.x + Math.cos(guard.facing) * 9;
  const fy = guard.y + Math.sin(guard.facing) * 9;
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(fx, fy, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e8ecf7";
  ctx.beginPath();
  ctx.arc(guard.x - 3, guard.y - 3, 2, 0, Math.PI * 2);
  ctx.arc(guard.x + 3, guard.y - 3, 2, 0, Math.PI * 2);
  ctx.fill();
  if (seesThief) {
    ctx.fillStyle = "#ff3b30";
    ctx.font = "bold 22px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("!", guard.x, guard.y - 24);
  } else if (guard.state === "investigate") {
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 20px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("?", guard.x, guard.y - 24);
  }
}

function drawCamera(ctx, camera, time) {
  // Wall mount + lens head that turns with the sweep.
  ctx.fillStyle = "#39466a";
  ctx.fillRect(camera.x - 8, camera.y - 6, 16, 12);
  const hx = camera.x + Math.cos(camera.angle) * 12;
  const hy = camera.y + Math.sin(camera.angle) * 12;
  ctx.strokeStyle = "#8fa3d9";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(camera.x, camera.y);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  ctx.fillStyle = "#20263a";
  ctx.beginPath();
  ctx.arc(hx, hy, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = camera.watching ? "#ff3b30" : "#8fa3d9";
  ctx.lineWidth = 2;
  ctx.stroke();
  const blink = camera.watching ? (Math.sin(time * 10) > 0 ? 1 : 0.25) : 0.8;
  ctx.globalAlpha = blink;
  ctx.fillStyle = "#ff3b30";
  ctx.beginPath();
  ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawThief(ctx, thief, time) {
  // Shadow, then the midnight coat, then the mask's pale eye slit.
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.beginPath();
  ctx.ellipse(thief.x, thief.y + 12, 13, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  const crouch = thief.crouching ? 0.85 : 1;
  ctx.fillStyle = "#10182e";
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, thief.radius * crouch, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#6fe3ff";
  ctx.lineWidth = 2;
  ctx.stroke();
  const fx = thief.x + Math.cos(thief.facing) * 7;
  const fy = thief.y + Math.sin(thief.facing) * 7;
  ctx.fillStyle = "#e8f6ff";
  ctx.beginPath();
  ctx.arc(fx, fy, 4, 0, Math.PI * 2);
  ctx.fill();
  // A soft ring so the player always spots Rook in the dark.
  ctx.strokeStyle = "rgba(111, 227, 255, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, thief.radius + 6 + Math.sin(time * 3) * 1.5, 0, Math.PI * 2);
  ctx.stroke();
}

function drawSmoke(ctx, thief) {
  for (const cloud of thief.smokeClouds) {
    const alpha = Math.min(0.75, cloud.ttl * 0.4);
    const puff = ctx.createRadialGradient(cloud.x, cloud.y, 10, cloud.x, cloud.y, cloud.radius);
    puff.addColorStop(0, `rgba(170, 180, 205, ${alpha})`);
    puff.addColorStop(1, "rgba(170, 180, 205, 0)");
    ctx.fillStyle = puff;
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCoinMarks(ctx, thief, time) {
  for (const mark of thief.coinMarks) {
    ctx.strokeStyle = `rgba(255, 209, 102, ${Math.min(1, mark.ttl)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mark.x, mark.y, 8 + Math.sin(time * 6) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.arc(mark.x, mark.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// The whole frame, in draw order: floor, exit, loot, furniture, vision
// cones, marks, people, cameras, smoke, then the night vignette.
export function renderGame(ctx, game) {
  const { level, thief, guards, cameras, alarm, time, seenBy } = game;
  const blockers = level.solids;
  drawFloor(ctx, time);
  drawExit(ctx, level.exit, thief.hasSapphire, time);
  for (const solid of level.solids) drawSolid(ctx, solid);
  // Loot draws after the furniture: the sapphire sits ON its pedestal.
  for (const item of level.loot) drawLoot(ctx, item, time);

  for (const guard of guards) {
    const hot = guard.alerted || guard.state === "hunt";
    drawVisionCone(ctx, guard.x, guard.y, guard.facing, guard.range, guard.halfAngle,
      blockers,
      hot ? "rgba(255, 70, 60, 0.34)" : "rgba(255, 190, 60, 0.30)",
      hot ? "rgba(255, 90, 80, 0.55)" : "rgba(255, 205, 100, 0.45)");
  }
  for (const camera of cameras) {
    drawVisionCone(ctx, camera.x, camera.y, camera.angle, camera.range, camera.halfAngle,
      blockers,
      camera.watching ? "rgba(255, 60, 80, 0.36)" : "rgba(255, 80, 110, 0.22)",
      "rgba(255, 100, 120, 0.4)");
  }

  drawCoinMarks(ctx, thief, time);
  for (const guard of guards) drawGuard(ctx, guard, seenBy.has(guard), time);
  for (const camera of cameras) drawCamera(ctx, camera, time);
  drawThief(ctx, thief, time);
  drawSmoke(ctx, thief);

  // Where the guards are hunting, when the alarm is up.
  if (alarm.active && alarm.lastSeen) {
    ctx.strokeStyle = "rgba(255, 60, 60, 0.8)";
    ctx.lineWidth = 2;
    const { x, y } = alarm.lastSeen;
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 10); ctx.lineTo(x + 10, y + 10);
    ctx.moveTo(x + 10, y - 10); ctx.lineTo(x - 10, y + 10);
    ctx.stroke();
  }

  // Night vignette: dark corners, readable middle.
  const vignette = ctx.createRadialGradient(640, 332, 260, 640, 332, 780);
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(2, 4, 12, 0.55)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, 1280, 664);

  // Alarm wash: the whole room reddens as the meter fills.
  if (alarm.value > 1) {
    ctx.fillStyle = `rgba(255, 30, 30, ${(alarm.value / 100) * 0.10})`;
    ctx.fillRect(0, 0, 1280, 664);
  }
}

// A small helper for the title screen: the room idles behind the card.
export function renderBackdrop(ctx, game) {
  renderGame(ctx, game);
}

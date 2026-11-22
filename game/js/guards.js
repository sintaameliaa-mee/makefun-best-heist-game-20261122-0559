// guards.js — the gallery's night watch. A guard walks a fixed patrol,
// pauses at each waypoint and looks around, and carries a vision cone.
// A coin clink or a sprinting footstep pulls a guard off patrol to
// investigate; a full alarm sends every guard to the last place the thief
// was seen. Guards never see through walls, cases or smoke.

import {
  distance, angleTo, angleDifference, hasLineOfSight, moveCircle,
} from "./geometry.js";

export const CATCH_RADIUS = 24;
export const INVESTIGATE_RADIUS = 280;

export function createGuard(def) {
  const [sx, sy] = def.route[0];
  return {
    route: def.route,
    waypointIndex: 1 % def.route.length,
    x: sx,
    y: sy,
    radius: 15,
    speed: def.speed,
    pause: def.pause,
    range: def.range,
    halfAngle: def.halfAngle,
    facing: angleTo(sx, sy, def.route[1 % def.route.length][0], def.route[1 % def.route.length][1]),
    state: "patrol", // patrol | pause | investigate | hunt
    pauseTimer: 0,
    investigateTarget: null,
    investigateTimer: 0,
    stuckTimer: 0,
    lastX: sx,
    lastY: sy,
    alerted: false, // currently chasing or investigating
  };
}

function moveToward(guard, tx, ty, dt, solids, bounds, speed) {
  const d = distance(guard.x, guard.y, tx, ty);
  if (d < 2) return true;
  const step = Math.min(d, speed * dt);
  const nx = guard.x + ((tx - guard.x) / d) * step;
  const ny = guard.y + ((ty - guard.y) / d) * step;
  const next = moveCircle(guard.x, guard.y, nx - guard.x, ny - guard.y,
    guard.radius, solids, bounds);
  guard.x = next.x;
  guard.y = next.y;
  guard.facing = angleTo(guard.x, guard.y, tx, ty);
  return distance(guard.x, guard.y, tx, ty) < 6;
}

export function updateGuard(guard, dt, solids, bounds, huntTarget) {
  // A guard that cannot reach its waypoint (furniture in the way) gives up
  // on it after a short while instead of shoving the wall forever.
  if (distance(guard.x, guard.y, guard.lastX, guard.lastY) < 1 && guard.state !== "pause") {
    guard.stuckTimer += dt;
    if (guard.stuckTimer > 1.2) {
      guard.stuckTimer = 0;
      guard.state = "patrol";
      guard.waypointIndex = (guard.waypointIndex + 1) % guard.route.length;
    }
  } else {
    guard.stuckTimer = 0;
  }
  guard.lastX = guard.x;
  guard.lastY = guard.y;

  if (huntTarget && guard.state !== "hunt") {
    guard.state = "hunt";
    guard.alerted = true;
  }
  if (!huntTarget && guard.state === "hunt") {
    guard.state = "patrol";
    guard.alerted = false;
  }

  if (guard.state === "hunt" && huntTarget) {
    const arrived = moveToward(guard, huntTarget.x, huntTarget.y, dt, solids, bounds, guard.speed * 1.45);
    if (arrived) guard.state = "patrol";
    return;
  }

  if (guard.state === "investigate") {
    guard.investigateTimer -= dt;
    const target = guard.investigateTarget;
    if (target) moveToward(guard, target.x, target.y, dt, solids, bounds, guard.speed * 1.2);
    if (guard.investigateTimer <= 0) {
      guard.state = "patrol";
      guard.investigateTarget = null;
      guard.alerted = false;
    }
    return;
  }

  if (guard.state === "pause") {
    guard.pauseTimer -= dt;
    // Look around while waiting: slow sweep left and right.
    guard.facing += Math.sin(guard.pauseTimer * 2.4) * 0.012;
    if (guard.pauseTimer <= 0) {
      guard.state = "patrol";
      guard.waypointIndex = (guard.waypointIndex + 1) % guard.route.length;
    }
    return;
  }

  const [wx, wy] = guard.route[guard.waypointIndex];
  const arrived = moveToward(guard, wx, wy, dt, solids, bounds, guard.speed);
  if (arrived) {
    guard.state = "pause";
    guard.pauseTimer = guard.pause;
  }
}

// A tossed coin pulls every guard close enough to hear it.
export function distractGuards(guards, point) {
  for (const guard of guards) {
    if (guard.state === "hunt") continue;
    if (distance(guard.x, guard.y, point.x, point.y) <= INVESTIGATE_RADIUS) {
      guard.state = "investigate";
      guard.investigateTarget = { x: point.x, y: point.y };
      guard.investigateTimer = 5;
      guard.alerted = true;
    }
  }
}

// Can this guard see the thief right now? Range, cone angle, line of sight
// and smoke all have to agree.
export function guardSeesThief(guard, thief, blockers, thiefInSmoke) {
  if (thiefInSmoke) return 0;
  const d = distance(guard.x, guard.y, thief.x, thief.y);
  if (d > guard.range) return 0;
  const toThief = angleTo(guard.x, guard.y, thief.x, thief.y);
  if (Math.abs(angleDifference(toThief, guard.facing)) > guard.halfAngle) return 0;
  if (!hasLineOfSight(guard.x, guard.y, thief.x, thief.y, blockers)) return 0;
  // Closer reads faster: 1.5x at point blank, 0.6x at the cone's edge.
  return 1.5 - (d / guard.range) * 0.9;
}

export function guardCatchesThief(guard, thief) {
  return distance(guard.x, guard.y, thief.x, thief.y) < CATCH_RADIUS + thief.radius - 6;
}

// A sprinting thief is heard: the nearest guard turns toward the noise.
export function guardsHearNoise(guards, thief, radius) {
  if (radius <= 0) return;
  let best = null;
  let bestDist = radius;
  for (const guard of guards) {
    if (guard.state === "hunt") continue;
    const d = distance(guard.x, guard.y, thief.x, thief.y);
    if (d < bestDist) {
      best = guard;
      bestDist = d;
    }
  }
  if (best && best.state === "patrol") {
    best.state = "investigate";
    best.investigateTarget = { x: thief.x, y: thief.y };
    best.investigateTimer = 3;
    best.alerted = true;
  }
}

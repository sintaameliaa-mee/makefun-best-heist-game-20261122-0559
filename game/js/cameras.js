// cameras.js — wall-mounted security cameras. Each one sweeps its arc
// slowly and steadily, so its cone is a rhythm the thief can read and time.
// A camera never moves and never chases; it only watches, and it feeds the
// same alarm meter the guards do.

import { distance, angleTo, angleDifference, hasLineOfSight } from "./geometry.js";

export function createCamera(def) {
  return {
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    speed: def.speed,
    range: def.range,
    halfAngle: def.halfAngle,
    phase: Math.random() * Math.PI * 2,
    angle: def.baseAngle,
    watching: false, // thief inside the cone this frame
  };
}

export function updateCamera(camera, time) {
  camera.angle = camera.baseAngle + Math.sin(time * camera.speed + camera.phase) * camera.sweep;
}

export function cameraSeesThief(camera, thief, blockers, thiefInSmoke) {
  camera.watching = false;
  if (thiefInSmoke) return 0;
  const d = distance(camera.x, camera.y, thief.x, thief.y);
  if (d > camera.range) return 0;
  const toThief = angleTo(camera.x, camera.y, thief.x, thief.y);
  if (Math.abs(angleDifference(toThief, camera.angle)) > camera.halfAngle) return 0;
  if (!hasLineOfSight(camera.x, camera.y, thief.x, thief.y, blockers)) return 0;
  camera.watching = true;
  return 1.3 - (d / camera.range) * 0.6;
}

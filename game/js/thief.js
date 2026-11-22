// thief.js — Rook, the player character: movement, stance and tools.
// A tool always costs something: coins and smoke are limited per room, and
// sprinting is loud. The thief never teleports and never passes through
// furniture; every move is a circle sliding against the room's solids.

import { moveCircle, distance, clamp } from "./geometry.js";
import { playStep, playCoin, playSmoke } from "./audio.js";

export const GRAB_RADIUS = 64;
export const WALK_SPEED = 150;
export const SPRINT_SPEED = 238;
export const CROUCH_SPEED = 82;

export function createThief(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    radius: 14,
    facing: -Math.PI / 2,
    moving: false,
    sprinting: false,
    crouching: false,
    stepTimer: 0,
    coins: 3,
    smoke: 2,
    smokeClouds: [], // { x, y, radius, ttl }
    coinMarks: [], // { x, y, ttl } — where a tossed coin landed
    lootValue: 0,
    lootCount: 0,
    hasSapphire: false,
    ghost: true, // stays true while the alarm never passed 50
  };
}

export function updateThief(thief, input, dt, solids, bounds) {
  const move = input.moveVector();
  thief.sprinting = input.isDown("ShiftLeft") || input.isDown("ShiftRight");
  thief.crouching = input.isDown("KeyC") || input.isDown("ControlLeft");
  thief.moving = move.x !== 0 || move.y !== 0;

  const speed = thief.crouching
    ? CROUCH_SPEED
    : thief.sprinting
      ? SPRINT_SPEED
      : WALK_SPEED;
  if (thief.moving) {
    thief.facing = Math.atan2(move.y, move.x);
    const next = moveCircle(thief.x, thief.y, move.x * speed * dt, move.y * speed * dt,
      thief.radius, solids, bounds);
    thief.x = next.x;
    thief.y = next.y;
    thief.stepTimer -= dt;
    if (thief.stepTimer <= 0) {
      if (!thief.crouching) playStep();
      thief.stepTimer = thief.sprinting ? 0.22 : 0.34;
    }
  }

  for (const cloud of thief.smokeClouds) cloud.ttl -= dt;
  thief.smokeClouds = thief.smokeClouds.filter((c) => c.ttl > 0);
  for (const mark of thief.coinMarks) mark.ttl -= dt;
  thief.coinMarks = thief.coinMarks.filter((m) => m.ttl > 0);
}

// Throw a coin at the clicked point. Guards nearby walk over to look at it.
// Returns the landing point, or null when no coins are left.
export function tossCoin(thief, x, y) {
  if (thief.coins <= 0) return null;
  thief.coins -= 1;
  const mark = { x, y, ttl: 5 };
  thief.coinMarks.push(mark);
  playCoin();
  return mark;
}

// A smoke puff around the thief. Nobody can see through it for a few seconds.
export function puffSmoke(thief) {
  if (thief.smoke <= 0) return false;
  thief.smoke -= 1;
  thief.smokeClouds.push({ x: thief.x, y: thief.y, radius: 105, ttl: 4 });
  playSmoke();
  return true;
}

export function thiefHiddenBySmoke(thief) {
  return thief.smokeClouds.some(
    (c) => distance(thief.x, thief.y, c.x, c.y) < c.radius - 10,
  );
}

// The nearest loot the thief can reach for right now, or null.
export function nearestLoot(thief, lootItems) {
  let best = null;
  let bestDist = GRAB_RADIUS;
  for (const item of lootItems) {
    if (item.taken) continue;
    const d = distance(thief.x, thief.y, item.x, item.y);
    if (d < bestDist) {
      best = item;
      bestDist = d;
    }
  }
  return best;
}

export function grabLoot(thief, item) {
  item.taken = true;
  thief.lootValue += item.value;
  thief.lootCount += 1;
  if (item.main) thief.hasSapphire = true;
}

// Noise radius: sprinting is heard, walking is not, crouching is silent.
export function noiseRadius(thief) {
  if (thief.crouching || !thief.moving) return 0;
  return thief.sprinting ? 130 : 0;
}

export function clampToRoom(thief, bounds) {
  thief.x = clamp(thief.x, bounds.x + thief.radius, bounds.x + bounds.w - thief.radius);
  thief.y = clamp(thief.y, bounds.y + thief.radius, bounds.y + bounds.h - thief.radius);
}

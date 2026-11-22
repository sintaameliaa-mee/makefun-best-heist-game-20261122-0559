// geometry.js — small math helpers for vision, movement and collision.
// Everything here is pure: no DOM, no game state. The guards, cameras and
// the thief all share these so a cone on screen means exactly what the
// detection code tests.

export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

// Smallest signed difference between two angles, in (-PI, PI].
export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

// Does the segment (x1,y1)-(x2,y2) cross the rectangle? Used for vision:
// a wall or a display case between watcher and thief breaks the line of sight.
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  if (pointInRect(x1, y1, rect) || pointInRect(x2, y2, rect)) return true;
  const edges = [
    [rect.x, rect.y, rect.x + rect.w, rect.y],
    [rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h],
    [rect.x + rect.w, rect.y + rect.h, rect.x, rect.y + rect.h],
    [rect.x, rect.y + rect.h, rect.x, rect.y],
  ];
  for (const [ex1, ey1, ex2, ey2] of edges) {
    if (segmentsCross(x1, y1, x2, y2, ex1, ey1, ex2, ey2)) return true;
  }
  return false;
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = direction(cx, cy, dx, dy, ax, ay);
  const d2 = direction(cx, cy, dx, dy, bx, by);
  const d3 = direction(ax, ay, bx, by, cx, cy);
  const d4 = direction(ax, ay, bx, by, dx, dy);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function direction(px, py, qx, qy, rx, ry) {
  return (rx - px) * (qy - py) - (ry - py) * (qx - px);
}

export function hasLineOfSight(x1, y1, x2, y2, blockers) {
  for (const rect of blockers) {
    if (segmentHitsRect(x1, y1, x2, y2, rect)) return false;
  }
  return true;
}

// Distance from (x, y) along `angle` until the ray hits a blocker or the
// room bounds, capped at maxDist. Powers the cone polygons the renderer draws.
export function raycastDistance(x, y, angle, maxDist, blockers, bounds) {
  const step = 6;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  for (let d = step; d <= maxDist; d += step) {
    const px = x + cos * d;
    const py = y + sin * d;
    if (px < bounds.x || px > bounds.x + bounds.w || py < bounds.y || py > bounds.y + bounds.h) {
      return d;
    }
    for (const rect of blockers) {
      if (pointInRect(px, py, rect)) return d;
    }
  }
  return maxDist;
}

// Circle-vs-rectangle test for the thief's body against solid furniture.
export function circleHitsRect(cx, cy, radius, rect) {
  const nearestX = clamp(cx, rect.x, rect.x + rect.w);
  const nearestY = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

// Move a circle by (dx, dy) with axis-separated sliding against solids and
// the room bounds. Returns the new position.
export function moveCircle(x, y, dx, dy, radius, solids, bounds) {
  let nx = clamp(x + dx, bounds.x + radius, bounds.x + bounds.w - radius);
  for (const rect of solids) {
    if (circleHitsRect(nx, y, radius, rect)) { nx = x; break; }
  }
  let ny = clamp(y + dy, bounds.y + radius, bounds.y + bounds.h - radius);
  for (const rect of solids) {
    if (circleHitsRect(nx, ny, radius, rect)) { ny = y; break; }
  }
  return { x: nx, y: ny };
}

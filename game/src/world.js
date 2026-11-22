// world.js — the museum floor: rooms, walls, loot, vents and the geometry helpers.
// One screen, 1280x720, no scrolling: the whole heist is visible in a single frame.
export const W = 1280;
export const H = 720;
export const TILE = 40;

export const GOAL_LOOT = 4000;
export const SPAWN = { x: 80, y: 620 };
export const EXIT = { x: 4, y: 620, w: 22, h: 64 };

// Solid rectangles {x, y, w, h}: outer walls, room dividers and display cases.
// Room dividers leave door gaps so every room has two routes in and out.
export const WALLS = [
  { x: 0, y: 0, w: 1280, h: 20 },
  { x: 0, y: 700, w: 1280, h: 20 },
  { x: 0, y: 0, w: 20, h: 720 },
  { x: 1260, y: 0, w: 20, h: 720 },
  // Divider 1 (entrance | galleries): gaps at y 180-260 and y 500-580.
  { x: 400, y: 20, w: 24, h: 160 },
  { x: 400, y: 260, w: 24, h: 240 },
  { x: 400, y: 580, w: 24, h: 120 },
  // Divider 2 (galleries | vault): same gaps.
  { x: 840, y: 20, w: 24, h: 160 },
  { x: 840, y: 260, w: 24, h: 240 },
  { x: 840, y: 580, w: 24, h: 120 },
  // Horizontal divider (Gallery A | Gallery B): gap at x 600-680.
  { x: 424, y: 320, w: 176, h: 24 },
  { x: 680, y: 320, w: 160, h: 24 },
];

// Display cases and the vault pedestal: solid, and they block line of sight.
export const CASES = [
  { x: 520, y: 120, w: 120, h: 40 },
  { x: 680, y: 120, w: 120, h: 40 },
  { x: 520, y: 560, w: 120, h: 40 },
  { x: 680, y: 560, w: 120, h: 40 },
  { x: 1060, y: 320, w: 80, h: 80 },
];

export const SOLIDS = [...WALLS, ...CASES];

// Vents: a crawl-space shortcut between the entrance and the vault.
export const VENTS = [
  { x: 60, y: 80, r: 22, to: 1 },
  { x: 1180, y: 80, r: 22, to: 0 },
];

// Loot definitions: fresh copies are made per game so a restart resets them.
export function freshLoot() {
  return [
    { x: 560, y: 58, value: 500, name: 'Duchess Portrait', kind: 'painting', taken: false },
    { x: 760, y: 58, value: 500, name: 'Midnight Landscape', kind: 'painting', taken: false },
    { x: 560, y: 662, value: 800, name: 'Gold Bars', kind: 'gold', taken: false },
    { x: 760, y: 662, value: 1200, name: 'Jade Vase', kind: 'vase', taken: false },
    { x: 1000, y: 58, value: 500, name: 'The Red Sail', kind: 'painting', taken: false },
    { x: 1000, y: 662, value: 800, name: 'Gold Bars', kind: 'gold', taken: false },
    { x: 1100, y: 360, value: 3000, name: 'Star of Meridian', kind: 'diamond', taken: false },
  ];
}

export function pointInSolids(x, y) {
  for (const s of SOLIDS) {
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return true;
  }
  return false;
}

// Circle-vs-solids movement: move one axis at a time, sliding along walls.
export function moveCircle(e, dx, dy) {
  const r = e.r;
  let nx = e.x + dx;
  if (!circleHits(nx, e.y, r)) e.x = nx;
  let ny = e.y + dy;
  if (!circleHits(e.x, ny, r)) e.y = ny;
}

export function circleHits(x, y, r) {
  for (const s of SOLIDS) {
    const cx = Math.max(s.x, Math.min(x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(y, s.y + s.h));
    const ddx = x - cx;
    const ddy = y - cy;
    if (ddx * ddx + ddy * ddy < r * r) return true;
  }
  return false;
}

// Line of sight: sample along the segment; blocked if any sample lands in a solid.
export function segmentBlocked(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (pointInSolids(x1 + dx * t, y1 + dy * t)) return true;
  }
  return false;
}

// Raycast for vision cones: walk out until a wall or the range limit.
export function castRay(x, y, angle, maxDist) {
  const step = 6;
  const cx = Math.cos(angle);
  const sy = Math.sin(angle);
  for (let d = step; d <= maxDist; d += step) {
    if (pointInSolids(x + cx * d, y + sy * d)) return d - step;
  }
  return maxDist;
}

export function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

// Smallest absolute difference between two angles, in (-PI, PI].
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

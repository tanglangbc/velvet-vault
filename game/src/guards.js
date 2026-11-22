// guards.js — patrol guards with vision cones, suspicion and chases.
import { moveCircle, segmentBlocked, dist, angleTo, angleDiff } from './world.js';
import { hiddenBySmoke } from './thief.js';
import { spottedSound, caughtSound } from './audio.js';

export const GUARD_RANGE = 250;
export const GUARD_HALF_ANGLE = 0.61; // ~35 degrees each side

export function createGuards() {
  return [
    {
      name: 'Marco',
      x: 480, y: 200, r: 14,
      waypoints: [{ x: 480, y: 200 }, { x: 780, y: 200 }, { x: 780, y: 280 }, { x: 480, y: 280 }],
      wp: 0, facing: 0, suspicion: 0, mode: 'patrol', loseTimer: 0, lastSeen: null,
    },
    {
      name: 'Ivy',
      x: 480, y: 440, r: 14,
      waypoints: [{ x: 480, y: 440 }, { x: 780, y: 440 }, { x: 780, y: 600 }, { x: 480, y: 600 }],
      wp: 0, facing: Math.PI, suspicion: 0, mode: 'patrol', loseTimer: 0, lastSeen: null,
    },
    {
      name: 'Brutus',
      x: 920, y: 140, r: 14,
      waypoints: [{ x: 920, y: 140 }, { x: 1180, y: 140 }, { x: 1180, y: 580 }, { x: 920, y: 580 }],
      wp: 0, facing: Math.PI / 2, suspicion: 0, mode: 'patrol', loseTimer: 0, lastSeen: null,
    },
  ];
}

// Can this guard see the thief right now? Range, cone, walls, smoke.
export function guardSees(guard, thief) {
  const d = dist(guard.x, guard.y, thief.x, thief.y);
  if (d > GUARD_RANGE) return false;
  const ang = angleTo(guard.x, guard.y, thief.x, thief.y);
  if (Math.abs(angleDiff(ang, guard.facing)) > GUARD_HALF_ANGLE) return false;
  if (segmentBlocked(guard.x, guard.y, thief.x, thief.y)) return false;
  if (hiddenBySmoke(thief, guard.x, guard.y, thief.x, thief.y)) return false;
  return true;
}

function moveToward(e, tx, ty, speed, dt) {
  const d = dist(e.x, e.y, tx, ty);
  if (d < 2) return true;
  const vx = (tx - e.x) / d;
  const vy = (ty - e.y) / d;
  moveCircle(e, vx * speed * dt, vy * speed * dt);
  e.facing = Math.atan2(vy, vx);
  return d < 8;
}

export function updateGuards(guards, thief, state, dt, now) {
  for (const g of guards) {
    const sees = guardSees(g, thief);
    if (sees) {
      // Sneaking halves how fast suspicion builds; standing still in the
      // open still gets you caught, just slower.
      const rate = thief.sneaking ? 0.6 : 1.2;
      const before = g.suspicion;
      g.suspicion = Math.min(1, g.suspicion + rate * dt);
      g.lastSeen = { x: thief.x, y: thief.y };
      g.loseTimer = 0;
      if (g.suspicion >= 1 && g.mode !== 'chase') {
        g.mode = 'chase';
        state.spotted = true;
        state.flash = `${g.name} spotted you!`;
        state.flashUntil = now + 1500;
        spottedSound();
      } else if (g.suspicion > 0.35 && before <= 0.35) {
        g.mode = 'suspicious';
      }
    } else {
      g.suspicion = Math.max(0, g.suspicion - 0.4 * dt);
      if (g.mode === 'chase') {
        g.loseTimer += dt;
        if (g.loseTimer > 2.5) {
          g.mode = 'patrol';
          g.suspicion = 0.45;
          g.loseTimer = 0;
        }
      } else if (g.mode === 'suspicious' && g.suspicion <= 0.1) {
        g.mode = 'patrol';
      }
    }

    if (g.mode === 'chase' && g.lastSeen) {
      moveToward(g, g.lastSeen.x, g.lastSeen.y, 115, dt);
      // Caught: the guard reaches the thief.
      if (dist(g.x, g.y, thief.x, thief.y) < 28) {
        guardCatches(g, thief, state, now);
      }
    } else if (g.mode === 'suspicious' && g.lastSeen) {
      // Walk to where the thief was glimpsed, then look around.
      const arrived = moveToward(g, g.lastSeen.x, g.lastSeen.y, 70, dt);
      if (arrived) g.facing += dt * 1.5;
    } else {
      // Patrol: walk the waypoints, facing the direction of travel.
      const wp = g.waypoints[g.wp];
      const arrived = moveToward(g, wp.x, wp.y, 55, dt);
      if (arrived) g.wp = (g.wp + 1) % g.waypoints.length;
    }

    // A chasing guard the thief can see raises the alarm fast.
    if (g.mode === 'chase' && sees) {
      state.alarm = Math.min(100, state.alarm + 25 * dt);
      state.anyDetectorSees = true;
    }
  }
}

function guardCatches(g, thief, state, now) {
  state.strikes += 1;
  state.alarm = Math.min(100, state.alarm + 30);
  state.spotted = true;
  caughtSound();
  for (const gg of state.guards) {
    gg.mode = 'patrol';
    gg.suspicion = 0;
    gg.lastSeen = null;
  }
  // The thief drops back to the entrance; the crew is down one strike.
  thief.x = 80;
  thief.y = 620;
  thief.target = null;
  state.flash = `CAUGHT by ${g.name}! Strike ${state.strikes}/3`;
  state.flashUntil = now + 2000;
  state.caughtFlashUntil = now + 1200;
  if (state.strikes >= 3) {
    state.phase = 'busted';
  }
}

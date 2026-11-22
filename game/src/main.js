// main.js — game state, the loop, input, and the win / lose rules.
// The whole museum fits on one screen: every screenshot shows the thief,
// the guards and their vision cones, the cameras, the loot and the alarm.
import { W, H, EXIT, GOAL_LOOT, freshLoot, dist } from './world.js';
import { createThief, updateThief, thiefTryGrab, thiefUseSmoke, thiefUseEmp, grabHint } from './thief.js';
import { createGuards, updateGuards } from './guards.js';
import { createCameras, updateCameras } from './cameras.js';
import { draw } from './render.js';
import { ensureAudio, winSound } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

export function freshState() {
  return {
    phase: 'title', // title | playing | paused | win | busted | lockdown
    thief: createThief(),
    guards: createGuards(),
    cameras: createCameras(),
    loot: freshLoot(),
    lootValue: 0,
    alarm: 0,
    maxAlarm: 0,
    strikes: 0,
    spotted: false,
    startedAt: 0,
    endAt: 0,
    flash: '',
    flashUntil: 0,
    caughtFlashUntil: 0,
    anyDetectorSees: false,
    hint: null,
  };
}

let state = freshState();
const keys = new Set();

function startGame() {
  state = freshState();
  state.phase = 'playing';
  state.startedAt = performance.now();
  ensureAudio();
}

function endGame(phase) {
  state.phase = phase;
  state.endAt = performance.now();
  if (phase === 'win') winSound();
}

function update(dt, now) {
  if (state.phase !== 'playing') return;
  state.anyDetectorSees = false;
  updateThief(state.thief, keys, now, dt, state);
  updateGuards(state.guards, state.thief, state, dt, now);
  updateCameras(state.cameras, state.thief, state, now, dt);
  // Alarm decays when nobody can see the thief.
  if (!state.anyDetectorSees) {
    state.alarm = Math.max(0, state.alarm - 1.5 * dt);
  }
  state.maxAlarm = Math.max(state.maxAlarm, state.alarm);
  if (state.alarm >= 100) {
    state.alarm = 100;
    endGame('lockdown');
    return;
  }
  state.hint = grabHint(state.thief, state);
  // Reaching the exit with the loot goal met ends the heist.
  if (state.lootValue >= GOAL_LOOT) {
    const t = state.thief;
    if (t.x < 60 && t.y > EXIT.y - 10 && t.y < EXIT.y + EXIT.h + 10) {
      endGame('win');
    }
  }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt, now);
  draw(ctx, state, now);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// --- Input: keyboard and mouse ---
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (k === 'enter' && (state.phase === 'title' || state.phase === 'win' || state.phase === 'busted' || state.phase === 'lockdown')) {
    startGame();
    return;
  }
  if (k === 'r' && state.phase !== 'playing' && state.phase !== 'title') {
    startGame();
    return;
  }
  if (k === 'p' && state.phase === 'playing') {
    state.phase = 'paused';
    return;
  }
  if (k === 'p' && state.phase === 'paused') {
    state.phase = 'playing';
    return;
  }
  if (state.phase !== 'playing') return;
  if (k === 'e') thiefTryGrab(state.thief, state, performance.now());
  if (k === '1') thiefUseSmoke(state.thief, performance.now());
  if (k === '2') thiefUseEmp(state.thief, state, performance.now());
  keys.add(k);
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

canvas.addEventListener('click', (e) => {
  if (state.phase !== 'playing') return;
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * W;
  const y = ((e.clientY - rect.top) / rect.height) * H;
  state.thief.target = { x, y };
  ensureAudio();
});

// --- Screenshot staging -------------------------------------------------
// stage(name) puts the game into a genuine mid-play state and lets the loop
// run from there, so screenshots are real renders of the game's own code:
//   cover  — sneaking between two patrol cones toward a painting
//   vault  — lifting the diamond as a camera sweeps past
//   chase  — a guard closing in, cones red, alarm climbing
//   win    — the getaway screen with the score breakdown
export function stage(name) {
  startGame();
  const t = state.thief;
  const now = performance.now();
  if (name === 'cover') {
    t.x = 500; t.y = 460; t.dir = -0.6;
    state.loot[0].taken = true;
    state.lootValue = 500;
    state.alarm = 35;
    // Guards placed far from the thief, walking away from it, so the
    // frame stays a tense sneak instead of turning into a catch.
    const m = state.guards[0];
    m.x = 640; m.y = 200; m.facing = -Math.PI / 2; m.wp = 1; m.suspicion = 0; m.mode = 'patrol'; m.lastSeen = null;
    const ivy = state.guards[1];
    ivy.x = 780; ivy.y = 580; ivy.facing = Math.PI / 2; ivy.wp = 2; ivy.suspicion = 0; ivy.mode = 'patrol'; ivy.lastSeen = null;
    const b = state.guards[2];
    b.x = 920; b.y = 140; b.facing = Math.PI / 2; b.wp = 1; b.suspicion = 0; b.mode = 'patrol'; b.lastSeen = null;
    state.flash = '';
  } else if (name === 'vault') {
    t.x = 1100; t.y = 420; t.dir = -Math.PI / 2;
    state.loot[0].taken = true;
    state.loot[1].taken = true;
    state.loot[2].taken = true;
    state.loot[6].taken = true; // the Star of Meridian, just lifted
    state.lootValue = 4800;
    state.alarm = 68;
    const b = state.guards[2];
    b.x = 1180; b.y = 160; b.facing = 0; b.wp = 0; b.suspicion = 0.5; b.mode = 'patrol'; b.lastSeen = null;
    state.flash = 'VAULT SENSOR TRIPPED!';
    state.flashUntil = now + 60000;
  } else if (name === 'chase') {
    t.x = 760; t.y = 420; t.dir = 0;
    state.lootValue = 1300;
    state.loot[0].taken = true;
    state.loot[2].taken = true;
    state.alarm = 55;
    // Ivy closes in from 200px away: near enough to read as a chase,
    // far enough that she cannot reach the thief before the shutter.
    const g = state.guards[1];
    g.x = 560; g.y = 420; g.facing = 0; g.mode = 'chase';
    g.suspicion = 1; g.lastSeen = { x: t.x, y: t.y };
    state.flash = 'Ivy spotted you!';
    state.flashUntil = now + 60000;
  } else if (name === 'win') {
    state.lootValue = 4800;
    for (const item of state.loot) item.taken = true;
    state.startedAt = now - 214000;
    state.strikes = 0;
    state.maxAlarm = 42;
    endGame('win');
  }
  return state;
}

// Exposed for play-testing and screenshots; the game itself never calls it.
window.__heist = { state: () => state, stage, startGame };

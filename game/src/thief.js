// thief.js — the player: movement (keys + click-to-move), sneaking, tools, looting.
import { SPAWN, VENTS, moveCircle, dist } from './world.js';
import { pickupSound, diamondSound, smokeSound, empSound } from './audio.js';

export function createThief() {
  return {
    x: SPAWN.x,
    y: SPAWN.y,
    r: 14,
    dir: 0,
    moving: false,
    sneaking: false,
    target: null, // click-to-move destination {x, y} or null
    smoke: 3,
    emp: 2,
    clouds: [], // {x, y, r, until}
    empUntil: 0,
    ventCooldownUntil: 0,
  };
}

// Keys held, as a Set of lowercase codes/keys. Mouse target set by main.js.
export function updateThief(thief, keys, now, dt, state) {
  thief.moving = false;
  thief.sneaking = keys.has('shift');
  const speed = thief.sneaking ? 80 : 150;
  let dx = 0;
  let dy = 0;
  if (keys.has('arrowup') || keys.has('w')) dy -= 1;
  if (keys.has('arrowdown') || keys.has('s')) dy += 1;
  if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d')) dx += 1;
  if (dx !== 0 || dy !== 0) {
    thief.target = null; // keys override click-to-move
    const len = Math.hypot(dx, dy);
    moveCircle(thief, (dx / len) * speed * dt, (dy / len) * speed * dt);
    thief.dir = Math.atan2(dy, dx);
    thief.moving = true;
  } else if (thief.target) {
    const d = dist(thief.x, thief.y, thief.target.x, thief.target.y);
    if (d < 6) {
      thief.target = null;
    } else {
      const vx = (thief.target.x - thief.x) / d;
      const vy = (thief.target.y - thief.y) / d;
      moveCircle(thief, vx * speed * dt, vy * speed * dt);
      thief.dir = Math.atan2(vy, vx);
      thief.moving = true;
    }
  }
  // Expire smoke clouds.
  thief.clouds = thief.clouds.filter((c) => c.until > now);
}

// Is the thief hidden from a watcher by smoke? True when the sight line
// passes through any live smoke cloud.
export function hiddenBySmoke(thief, wx, wy, tx, ty) {
  for (const c of thief.clouds) {
    // Distance from the cloud centre to the watcher->thief segment.
    const dx = tx - wx;
    const dy = ty - wy;
    const len2 = dx * dx + dy * dy;
    let t = 0;
    if (len2 > 0) t = Math.max(0, Math.min(1, ((c.x - wx) * dx + (c.y - wy) * dy) / len2));
    const px = wx + dx * t;
    const py = wy + dy * t;
    if (Math.hypot(c.x - px, c.y - py) < c.r) return true;
  }
  return false;
}

// E near loot: grab it. The diamond trips the vault sensor (+20 alarm).
export function thiefTryGrab(thief, state, now) {
  for (const item of state.loot) {
    if (item.taken) continue;
    if (dist(thief.x, thief.y, item.x, item.y) < 58) {
      item.taken = true;
      state.lootValue += item.value;
      state.flash = item.kind === 'diamond' ? 'VAULT SENSOR TRIPPED!' : `+ $${item.value} — ${item.name}`;
      state.flashUntil = now + 1600;
      if (item.kind === 'diamond') {
        state.alarm = Math.min(100, state.alarm + 20);
        diamondSound();
      } else {
        pickupSound();
      }
      return true;
    }
  }
  // E near a vent: crawl through to its pair.
  for (let i = 0; i < VENTS.length; i++) {
    const v = VENTS[i];
    if (dist(thief.x, thief.y, v.x, v.y) < 48 && now > thief.ventCooldownUntil) {
      const other = VENTS[v.to];
      thief.x = other.x;
      thief.y = other.y;
      thief.target = null;
      thief.ventCooldownUntil = now + 1000;
      state.flash = 'Through the vent…';
      state.flashUntil = now + 1200;
      smokeSound();
      return true;
    }
  }
  return false;
}

export function thiefUseSmoke(thief, now) {
  if (thief.smoke <= 0) return false;
  thief.smoke -= 1;
  thief.clouds.push({ x: thief.x, y: thief.y, r: 100, until: now + 5000 });
  smokeSound();
  return true;
}

export function thiefUseEmp(thief, state, now) {
  if (thief.emp <= 0) return false;
  thief.emp -= 1;
  thief.empUntil = now + 6000;
  state.alarm = Math.min(100, state.alarm + 8); // the pulse is loud
  state.flash = 'EMP! Cameras down 6s (+8 alarm)';
  state.flashUntil = now + 1600;
  empSound();
  return true;
}

// Nearest loot / vent in grab range, for the "Press E" prompt.
export function grabHint(thief, state) {
  for (const item of state.loot) {
    if (!item.taken && dist(thief.x, thief.y, item.x, item.y) < 58) {
      return `E — grab ${item.name} ($${item.value})`;
    }
  }
  for (const v of VENTS) {
    if (dist(thief.x, thief.y, v.x, v.y) < 48) return 'E — crawl through the vent';
  }
  return null;
}

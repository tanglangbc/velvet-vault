// render.js — every pixel of the game: the museum, vision cones, the crew,
// the loot, the HUD alarm meter and the title / win / caught screens.
import { W, H, WALLS, CASES, VENTS, EXIT, GOAL_LOOT, castRay } from './world.js';
import { GUARD_RANGE, GUARD_HALF_ANGLE, guardSees } from './guards.js';
import { CAM_RANGE, CAM_HALF_ANGLE, cameraAngle, cameraSees } from './cameras.js';

const ROOM_LABELS = [
  { x: 210, y: 360, text: 'ENTRANCE', sub: 'the front hall' },
  { x: 632, y: 170, text: 'GALLERY A', sub: 'old masters' },
  { x: 632, y: 490, text: 'GALLERY B', sub: 'gold & jade' },
  { x: 1050, y: 500, text: 'THE VAULT', sub: 'the Star of Meridian' },
];

// A vision cone as a raycast polygon: each ray stops at the first wall,
// so cones wrap around corners instead of shining through them.
function drawCone(ctx, x, y, facing, halfAngle, range, color) {
  const rays = 26;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i <= rays; i++) {
    const a = facing - halfAngle + (2 * halfAngle * i) / rays;
    const d = castRay(x, y, a, range);
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawFloor(ctx, now) {
  ctx.fillStyle = '#171a26';
  ctx.fillRect(0, 0, W, H);
  // Checkerboard marble tiles.
  for (let ty = 0; ty < 18; ty++) {
    for (let tx = 0; tx < 32; tx++) {
      if ((tx + ty) % 2 === 0) {
        ctx.fillStyle = '#1b1f2e';
        ctx.fillRect(tx * 40, ty * 40, 40, 40);
      }
    }
  }
  // Warm pools of light under the paintings.
  ctx.fillStyle = 'rgba(255, 214, 130, 0.05)';
  for (const lx of [560, 760, 1000]) {
    ctx.beginPath();
    ctx.ellipse(lx, 90, 90, 46, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const lx of [560, 760, 1000]) {
    ctx.beginPath();
    ctx.ellipse(lx, 630, 90, 46, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Room labels painted on the floor.
  ctx.textAlign = 'center';
  for (const l of ROOM_LABELS) {
    ctx.fillStyle = 'rgba(200, 205, 230, 0.16)';
    ctx.font = 'bold 26px monospace';
    ctx.fillText(l.text, l.x, l.y);
    ctx.fillStyle = 'rgba(200, 205, 230, 0.10)';
    ctx.font = '14px monospace';
    ctx.fillText(l.sub, l.x, l.y + 22);
  }
}

function drawWalls(ctx) {
  for (const w of WALLS) {
    ctx.fillStyle = '#2c3040';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#3d4258';
    ctx.fillRect(w.x, w.y, w.w, 3);
  }
  for (const c of CASES) {
    ctx.fillStyle = '#232838';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = '#4a5170';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
    ctx.fillStyle = 'rgba(140, 160, 220, 0.25)';
    ctx.fillRect(c.x + 6, c.y + 6, c.w - 12, 8);
  }
}

function drawExit(ctx, state, now) {
  const ready = state.lootValue >= GOAL_LOOT;
  const pulse = 0.55 + 0.35 * Math.sin(now / 300);
  ctx.fillStyle = ready ? `rgba(60, 220, 120, ${pulse})` : 'rgba(70, 130, 90, 0.7)';
  ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.save();
  ctx.translate(34, EXIT.y + EXIT.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = ready ? '#a9f5c6' : '#7fae92';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(ready ? 'EXIT — GO!' : 'EXIT', 0, 4);
  ctx.restore();
}

function drawVents(ctx, now) {
  for (const v of VENTS) {
    ctx.fillStyle = '#0e1018';
    ctx.beginPath();
    ctx.arc(v.x, v.y, v.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#565e7d';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = '#3a4060';
    ctx.beginPath();
    for (let i = -1; i <= 1; i++) {
      ctx.moveTo(v.x - 14, v.y + i * 8);
      ctx.lineTo(v.x + 14, v.y + i * 8);
    }
    ctx.stroke();
  }
}

function drawLoot(ctx, state, now) {
  for (const item of state.loot) {
    if (item.taken) continue;
    const glow = 0.5 + 0.3 * Math.sin(now / 240 + item.x);
    ctx.save();
    ctx.translate(item.x, item.y);
    if (item.kind === 'painting') {
      ctx.fillStyle = `rgba(255, 205, 90, ${glow * 0.55})`;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8a6a2f';
      ctx.fillRect(-22, -15, 44, 30);
      ctx.fillStyle = '#d9a441';
      ctx.fillRect(-18, -11, 36, 22);
      ctx.fillStyle = '#5d3a1a';
      ctx.beginPath();
      ctx.arc(0, 2, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.kind === 'gold') {
      ctx.fillStyle = `rgba(255, 215, 80, ${glow * 0.6})`;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd94d';
      ctx.fillRect(-16, -8, 32, 16);
      ctx.fillStyle = '#c9962a';
      ctx.fillRect(-16, 2, 32, 6);
    } else if (item.kind === 'vase') {
      ctx.fillStyle = `rgba(120, 220, 180, ${glow * 0.6})`;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3fae8a';
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7fe0c0';
      ctx.fillRect(-4, -20, 8, 8);
    } else {
      // The Star of Meridian: a sparkling diamond on its pedestal.
      const tw = 0.6 + 0.4 * Math.sin(now / 160);
      ctx.fillStyle = `rgba(150, 220, 255, ${tw * 0.7})`;
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#bfe9ff';
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(13, 0);
      ctx.lineTo(0, 16);
      ctx.lineTo(-13, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-4, -5, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(230, 220, 180, 0.85)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`$${item.value}`, item.x, item.y + 34);
  }
}

function drawGuards(ctx, state, now) {
  for (const g of state.guards) {
    const alerted = g.mode === 'chase';
    const suspicious = g.mode === 'suspicious';
    const coneColor = alerted
      ? 'rgba(255, 60, 60, 0.30)'
      : suspicious
        ? 'rgba(255, 170, 60, 0.24)'
        : 'rgba(255, 220, 90, 0.20)';
    drawCone(ctx, g.x, g.y, g.facing, GUARD_HALF_ANGLE, GUARD_RANGE, coneColor);
  }
  for (const g of state.guards) {
    // Body: a night-shift guard with a torch.
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.facing);
    ctx.fillStyle = g.mode === 'chase' ? '#c0392b' : '#3a5a8c';
    ctx.beginPath();
    ctx.arc(0, 0, g.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dfe6ff';
    ctx.beginPath();
    ctx.arc(5, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.moveTo(g.r + 2, -4);
    ctx.lineTo(g.r + 16, 0);
    ctx.lineTo(g.r + 2, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Suspicion: "?" while noticing, "!" while chasing.
    if (g.mode === 'chase') {
      ctx.fillStyle = '#ff4d4d';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 22);
    } else if (g.suspicion > 0.15) {
      ctx.fillStyle = '#ffb347';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - 22);
    }
    // Suspicion bar.
    if (g.suspicion > 0.05) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(g.x - 16, g.y - 34, 32, 5);
      ctx.fillStyle = g.suspicion > 0.6 ? '#ff4d4d' : '#ffb347';
      ctx.fillRect(g.x - 16, g.y - 34, 32 * g.suspicion, 5);
    }
    ctx.fillStyle = 'rgba(220, 225, 245, 0.7)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(g.name, g.x, g.y + 28);
  }
}

function drawCameras(ctx, state, now) {
  const empOff = now < state.thief.empUntil;
  for (const cam of state.cameras) {
    const ang = cameraAngle(cam, now);
    const color = empOff
      ? 'rgba(120, 130, 150, 0.10)'
      : cam.alert
        ? 'rgba(255, 70, 70, 0.32)'
        : 'rgba(140, 200, 255, 0.20)';
    drawCone(ctx, cam.x, cam.y, ang, CAM_HALF_ANGLE, CAM_RANGE, color);
  }
  for (const cam of state.cameras) {
    const ang = cameraAngle(cam, now);
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.rotate(ang);
    ctx.fillStyle = empOff ? '#4a5064' : cam.alert ? '#c0392b' : '#7f8ba8';
    ctx.fillRect(-7, -6, 14, 12);
    ctx.fillStyle = empOff ? '#2c3040' : cam.alert ? '#ff6b6b' : '#bfe0ff';
    ctx.beginPath();
    ctx.arc(9, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawThief(ctx, state, now) {
  const t = state.thief;
  // Smoke clouds under everything the thief does.
  for (const c of t.clouds) {
    ctx.fillStyle = 'rgba(180, 180, 200, 0.28)';
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  ctx.translate(t.x, t.y);
  // Shadow.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 10, 15, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // A faint halo + ring so the player can find the thief at a glance:
  // the dark cloak is nearly invisible on the dark floor.
  ctx.fillStyle = 'rgba(255, 214, 130, 0.10)';
  ctx.beginPath();
  ctx.arc(0, 0, 27, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 224, 150, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 17, 0, Math.PI * 2);
  ctx.stroke();
  // Cloak: a hooded figure in dark violet, facing its direction.
  ctx.rotate(t.dir);
  ctx.fillStyle = '#2e2a4d';
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-10, -11);
  ctx.lineTo(-13, 0);
  ctx.lineTo(-10, 11);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8dcc0';
  ctx.beginPath();
  ctx.arc(4, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2e2a4d';
  ctx.fillRect(2, -6, 7, 12);
  ctx.restore();
  // Loot sack grows with the haul.
  if (state.lootValue > 0) {
    ctx.fillStyle = '#8a6a2f';
    ctx.beginPath();
    ctx.arc(t.x - 12, t.y + 10, 5 + Math.min(5, state.lootValue / 1500), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHud(ctx, state, now) {
  ctx.fillStyle = 'rgba(8, 10, 18, 0.92)';
  ctx.fillRect(0, 0, W, 46);
  ctx.fillStyle = '#e8e4d2';
  ctx.font = 'bold 17px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('THE VELVET VAULT', 14, 29);
  // Alarm meter.
  const ax = 330;
  const aw = 300;
  ctx.fillStyle = '#3a3f55';
  ctx.fillRect(ax, 14, aw, 18);
  const frac = state.alarm / 100;
  ctx.fillStyle = state.alarm < 40 ? '#58c96b' : state.alarm < 70 ? '#ffb347' : '#ff4d4d';
  ctx.fillRect(ax, 14, aw * frac, 18);
  ctx.strokeStyle = '#8a90ad';
  ctx.lineWidth = 1;
  ctx.strokeRect(ax, 14, aw, 18);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('ALARM', ax - 62, 28);
  ctx.fillText(`${Math.round(state.alarm)}%`, ax + aw + 10, 28);
  // Loot, tools, strikes, timer.
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(`LOOT $${state.lootValue} / $${GOAL_LOOT}`, 790, 29);
  ctx.fillStyle = '#cfe0ff';
  ctx.font = '13px monospace';
  ctx.fillText(`SMOKE x${state.thief.smoke} [1]   EMP x${state.thief.emp} [2]`, 1010, 24);
  const strikes = '●'.repeat(state.strikes) + '○'.repeat(Math.max(0, 3 - state.strikes));
  ctx.fillStyle = state.strikes > 0 ? '#ff6b6b' : '#8a90ad';
  ctx.fillText(`STRIKES ${strikes}`, 1010, 41);
  const secs = Math.floor((now - state.startedAt) / 1000);
  ctx.fillStyle = '#e8e4d2';
  ctx.font = '13px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, W - 14, 29);
  ctx.textAlign = 'left';
}

function drawBanner(ctx, state, now) {
  // Transient flash message (grab, sensor, spotted).
  if (now < state.flashUntil && state.flash) {
    ctx.fillStyle = 'rgba(8, 10, 18, 0.85)';
    const w = ctx.measureText(state.flash).width + 36;
    ctx.fillRect((W - w) / 2, 58, w, 30);
    ctx.fillStyle = state.flash.startsWith('CAUGHT') ? '#ff6b6b' : '#ffe9a8';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(state.flash, W / 2, 79);
    ctx.textAlign = 'left';
  }
  // Caught red flash.
  if (now < state.caughtFlashUntil) {
    ctx.fillStyle = 'rgba(255, 40, 40, 0.18)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 44px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CAUGHT!', W / 2, H / 2);
    ctx.textAlign = 'left';
  }
}

function drawHint(ctx, state, hint) {
  ctx.fillStyle = 'rgba(8, 10, 18, 0.8)';
  ctx.fillRect(0, H - 26, W, 26);
  ctx.fillStyle = '#b9bed6';
  ctx.font = '13px monospace';
  ctx.textAlign = 'left';
  const left = hint || 'WASD / arrows to move · click to walk · E grab / vent · Shift sneak · 1 smoke · 2 EMP · P pause';
  ctx.fillText(left, 12, H - 8);
  ctx.textAlign = 'right';
  ctx.fillText(state.lootValue >= GOAL_LOOT ? 'Loot goal met — reach the green EXIT!' : `Steal $${GOAL_LOOT} of loot, then reach the EXIT.`, W - 12, H - 8);
  ctx.textAlign = 'left';
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(5, 7, 14, 0.82)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = accent || '#ffe9a8';
  ctx.font = 'bold 52px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(title, W / 2, 210);
  ctx.fillStyle = '#e8e4d2';
  ctx.font = '17px monospace';
  let y = 270;
  for (const line of lines) {
    ctx.fillText(line, W / 2, y);
    y += 30;
  }
  ctx.textAlign = 'left';
}

export function draw(ctx, state, now) {
  drawFloor(ctx, now);
  drawExit(ctx, state, now);
  drawVents(ctx, now);
  drawLoot(ctx, state, now);
  drawCameras(ctx, state, now);
  drawGuards(ctx, state, now);
  drawThief(ctx, state, now);
  drawHud(ctx, state, now);
  drawBanner(ctx, state, now);

  if (state.phase === 'playing') {
    drawHint(ctx, state, state.hint);
    return;
  }
  if (state.phase === 'title') {
    overlay(ctx, 'THE VELVET VAULT', [
      'Midnight at the Meridian Museum. One thief, three guards,',
      'three cameras — and the Star of Meridian diamond.',
      '',
      'Sneak past the vision cones. Grab $4,000 of loot.',
      'Then slip out the green EXIT before the alarm hits 100%.',
      '',
      'WASD / arrows move · click to walk · E grab / vent',
      'Shift sneak (harder to spot) · 1 smoke pellet · 2 EMP pulse',
      'Vents link the entrance hall to the vault.',
      '',
      'Press ENTER to begin the heist',
    ], '#ffd94d');
    return;
  }
  if (state.phase === 'paused') {
    overlay(ctx, 'PAUSED', ['Press P to keep sneaking.'], '#cfe0ff');
    return;
  }
  if (state.phase === 'win') {
    const secs = Math.floor((state.endAt - state.startedAt) / 1000);
    const timeBonus = Math.max(0, 600 - secs) * 2;
    const ghost = state.strikes === 0 && state.maxAlarm < 50 ? 500 : 0;
    overlay(ctx, 'CLEAN GETAWAY!', [
      `Loot: $${state.lootValue}    Time: ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}  (+$${timeBonus} time bonus)`,
      ghost ? 'GHOST bonus: never caught, alarm stayed under 50%  (+$500)' : `Strikes taken: ${state.strikes}    Peak alarm: ${Math.round(state.maxAlarm)}%`,
      '',
      `FINAL SCORE: $${state.lootValue + timeBonus + ghost}`,
      '',
      'Press R to run it again.',
    ], '#7dff9b');
    return;
  }
  if (state.phase === 'busted') {
    overlay(ctx, 'BUSTED!', [
      'Three strikes — the crew is in cuffs and the diamond',
      'is back behind glass.',
      '',
      `Loot grabbed: $${state.lootValue}`,
      '',
      'Press R to try again.',
    ], '#ff6b6b');
    return;
  }
  if (state.phase === 'lockdown') {
    overlay(ctx, 'LOCKDOWN!', [
      'The alarm hit 100%. Steel shutters seal the vault',
      'and the museum locks down with you inside.',
      '',
      `Loot grabbed: $${state.lootValue}`,
      '',
      'Press R to try again.',
    ], '#ff6b6b');
  }
}

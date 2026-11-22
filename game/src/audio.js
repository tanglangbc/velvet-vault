// audio.js — tiny WebAudio synth: no sound files, everything is generated.
// All sounds are optional; the game plays fine with audio unavailable.
let ctx = null;

export function ensureAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch (_e) {
    ctx = null;
  }
  return ctx;
}

function tone(freq, dur, type, gain) {
  const ac = ensureAudio();
  if (!ac) return;
  try {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain || 0.08, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.connect(g);
    g.connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + dur);
  } catch (_e) {
    /* audio is decoration; never break the game */
  }
}

export function pickupSound() {
  tone(880, 0.12, 'sine', 0.09);
  setTimeout(() => tone(1320, 0.16, 'sine', 0.09), 70);
}

export function diamondSound() {
  tone(660, 0.1, 'triangle', 0.1);
  setTimeout(() => tone(990, 0.1, 'triangle', 0.1), 90);
  setTimeout(() => tone(1480, 0.22, 'triangle', 0.1), 180);
}

export function spottedSound() {
  tone(220, 0.18, 'sawtooth', 0.07);
  setTimeout(() => tone(175, 0.25, 'sawtooth', 0.07), 120);
}

export function caughtSound() {
  tone(330, 0.3, 'square', 0.08);
  setTimeout(() => tone(165, 0.45, 'square', 0.08), 160);
}

export function winSound() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'triangle', 0.09), i * 120));
}

export function smokeSound() {
  tone(300, 0.25, 'sine', 0.05);
}

export function empSound() {
  tone(1200, 0.08, 'square', 0.05);
  setTimeout(() => tone(300, 0.2, 'square', 0.05), 60);
}

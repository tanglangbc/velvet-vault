// cameras.js — wall-mounted security cameras with sweeping vision cones.
import { segmentBlocked, dist, angleTo, angleDiff } from './world.js';
import { hiddenBySmoke } from './thief.js';

export const CAM_RANGE = 280;
export const CAM_HALF_ANGLE = 0.44; // ~25 degrees each side

export function createCameras() {
  return [
    // On divider 1, watching Gallery A (sweeps east).
    { x: 424, y: 140, base: 0, sweep: 0.78, speed: 0.55, alert: false, phase: 0 },
    // On divider 2, watching Gallery B (sweeps west).
    { x: 840, y: 520, base: Math.PI, sweep: 0.78, speed: 0.45, alert: false, phase: 2.1 },
    // Vault ceiling, watching the diamond (sweeps south).
    { x: 1100, y: 20, base: Math.PI / 2, sweep: 0.85, speed: 0.65, alert: false, phase: 4.2 },
  ];
}

export function cameraAngle(cam, now) {
  return cam.base + Math.sin(now / 1000 * cam.speed + cam.phase) * cam.sweep;
}

export function cameraSees(cam, thief, now) {
  const d = dist(cam.x, cam.y, thief.x, thief.y);
  if (d > CAM_RANGE) return false;
  const ang = angleTo(cam.x, cam.y, thief.x, thief.y);
  if (Math.abs(angleDiff(ang, cameraAngle(cam, now))) > CAM_HALF_ANGLE) return false;
  if (segmentBlocked(cam.x, cam.y, thief.x, thief.y)) return false;
  if (hiddenBySmoke(thief, cam.x, cam.y, thief.x, thief.y)) return false;
  return true;
}

// A camera that sees the thief raises the alarm; EMP shuts them all down.
export function updateCameras(cameras, thief, state, now, dt) {
  const empOff = now < thief.empUntil;
  for (const cam of cameras) {
    cam.alert = false;
    if (empOff) continue;
    if (cameraSees(cam, thief, now)) {
      cam.alert = true;
      state.alarm = Math.min(100, state.alarm + 14 * dt);
      state.anyDetectorSees = true;
    }
  }
}

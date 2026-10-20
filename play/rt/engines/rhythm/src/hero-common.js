// Shared helpers of the hero dance stages (1.24.0): movement envelope from the lane flashes and the approach of due notes, pose blending.
import { clamp } from './art.js';
import { lerp, lerp2, ease } from './figure-hero.js';

// the strength 0..1 of a movement: the strongest of the lane flash (after the strike) and the approach of the next due note (before it)
export function envOf(rt, K, keyOf) {
  const e = {};
  for (let i = 0; i < K.N; i++) { const key = keyOf[i]; if (key == null) continue; e[key] = Math.max(e[key] ?? 0, rt.flash[i] ?? 0); }
  const list = rt.list;
  if (list) for (let k = 0; k < list.length; k++) {
    const q = list[k]; if (q.state && q.state !== 'pending') continue;
    const dt = q.t - rt.clock; if (dt > 0.26 || dt < -0.02) continue;
    const key = keyOf[q.lane]; if (key == null) continue;
    e[key] = Math.max(e[key] ?? 0, 1 - dt / 0.26);
  }
  return e;
}
// the dominant movement and its strength; ties go to the first key
export function dominant(env) { let bk = null, bv = 0.04; for (const k of Object.keys(env)) if (env[k] > bv) { bv = env[k]; bk = k; } return [bk, ease(bv)]; }
// a side that flips on each new strike of a movement (so a kick alternates legs): state object + key + current strength
export function flipSide(st, key, v) { const s = (st[key] ??= { side: 1, prev: 0 }); if (v > 0.6 && s.prev <= 0.6) s.side = -s.side; s.prev = v; return s.side; }
export const mixPose = (a, b, t) => { const o = {}; for (const k of Object.keys(a)) o[k] = typeof a[k] === 'number' ? lerp(a[k], b[k] ?? a[k], t) : lerp2(a[k], b[k] ?? a[k], t); return o; };


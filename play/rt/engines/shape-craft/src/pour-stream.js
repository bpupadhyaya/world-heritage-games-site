// shape-craft `pour`: a stream of tea as a chain of slices, each integrated under gravity from dt, so the arc, the leading edge and the tail are real.
import { hash } from './geom.js';
import { clamp } from './pour-art.js';

export function createStream(grav = 7) {
  let sl = [], n = 0;
  return {
    emit(o) { sl.push({ x: o.x, y: o.y, vx: o.vx ?? 0, vy: o.vy ?? 0, vol: o.vol, q: o.q ?? 1, amp: o.amp ?? 0, ph: hash(n++, 3), age: 0, tag: o.tag }); },
    // land(s, yBefore) -> true when the slice has landed (it is then removed)
    step(h, land) {
      for (let k = sl.length - 1; k >= 0; k--) { const s = sl[k], y0 = s.y; s.age += h; s.vy += grav * h; s.x += s.vx * h; s.y += s.vy * h; if (land(s, y0) || s.y > 1.6) sl.splice(k, 1); }
    },
    list: () => sl, clear() { sl = []; }, size: () => sl.length,
    // polyline for drawStream, newest slice (nearest the spout) first; width in px = wPx * sqrt(q) * sqrt(v0 / v)
    points(X, Y, wPx, v0 = 0.5) {
      const pts = [];
      for (let k = sl.length - 1, i = 0; k >= 0; k--, i++) {
        const s = sl[k], v = Math.max(0.25, Math.hypot(s.vx, s.vy)), wob = s.amp * Math.sin(Math.PI * 2 * (s.age * 5.5 + s.ph)) * clamp(s.age / 0.18, 0, 1);
        pts.push({ x: X(s.x + wob), y: Y(s.y), w: wPx * Math.sqrt(Math.max(0.05, s.q)) * Math.sqrt(v0 / v) * (i < 3 ? 0.6 + i * 0.15 : 1), skip: false });
      }
      return pts;
    },
  };
}

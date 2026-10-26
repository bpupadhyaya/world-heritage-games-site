// Kitchen Crafts of the World, dough area: shared plumbing for the four dough games (khinkali, jiaozi, orecchiette, maamoul).
// Pure helpers: sound wrapper, the scripted "pilot" that plays Watch and learn through the same pointer code as a real player,
// stage geometry and small maths. No DOM, no Math.random, no clocks (time only arrives as dt).
import { fx as synth } from '../../../platform/engine-kit/synth.js';
import { wallBand } from './scenes.js';
import { dockRect } from './paint-ui.js';

export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sm = (t) => { const k = clamp(t, 0, 1); return k * k * (3 - 2 * k); };
export const r3 = (v) => Math.round(v * 1000) / 1000;
export const wrapPi = (a) => { let k = a % TAU; if (k > Math.PI) k -= TAU; else if (k < -Math.PI) k += TAU; return k; };
export const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
export const sd = (a) => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(mean(a.map((v) => (v - m) * (v - m)))); };

// Sound: every call goes through the shared synth (no-op without an AudioContext) and into options.soundLog when audits ask for it.
export function makeSound(env, table, prefix) {
  const F = (kind, p) => { try { return synth(env.audio, kind, p); } catch { return false; } };
  const out = {}, SL = env.options?.soundLog;
  for (const [k, fn] of Object.entries(table(F))) out[k] = SL ? (...a) => { SL.push({ kind: `${prefix}.${k}` }); return fn(...a); } : fn;
  return out;
}

// The stage: a design-unit rectangle (SW wide, SH high) fitted below the wall band of the scene and centred in the work rect.
export function stageGeom(W0, SC, SW, SH, wallShare = 0.62) {
  const full = { x: W0.x, y: W0.y, w: W0.w, h: W0.h + dockRect(W0).h };
  const band = wallBand(full, SC) * wallShare;
  const top = W0.y + band * 0.5, h = W0.h - band * 0.5 - 6;
  const s = Math.min(W0.w / SW, h / SH);
  return { ox: W0.x + (W0.w - s * SW) / 2, oy: top + Math.max(0, (h - s * SH) * 0.55), s, band, full };
}

// The pilot: plays gestures through the same pointer code as a real player (Watch and learn, and the scripted test of the same gestures).
// A gesture is { pts: [[x, y], ...], dur: seconds per segment, hold: seconds the pointer rests at the end before lifting, lead: seconds of travel from where it was }.
// pts may be a function (resolved when the gesture starts, so the layout of that moment is used).
export function createPilot() {
  const q = []; let cur = null, ptr = { x: 0, y: 0, down: false, pressed: false, released: false }, has = false;
  const start = (g) => {
    const pts = typeof g.pts === 'function' ? g.pts() : g.pts;
    if (!pts || !pts.length) return null;
    return { g, pts, i: 0, t: 0, phase: has && g.stay ? 'press' : 'lead', segT: 0, holdT: 0, from: has ? [ptr.x, ptr.y] : [pts[0][0], pts[0][1] + 60] };
  };
  return {
    busy: () => !!cur || q.length > 0,
    clear() { q.length = 0; cur = null; ptr = { ...ptr, down: false, pressed: false, released: false }; },
    push(g) { q.push(g); },
    pos: () => (has ? { x: ptr.x, y: ptr.y, down: ptr.down } : null),
    // advance by dt and return the pointer snapshot {x, y, down, pressed, released}
    step(dt) {
      ptr = { ...ptr, pressed: false, released: false };
      if (!cur && q.length) { cur = start(q.shift()); if (!cur) return ptr; }
      if (!cur) return ptr;
      const c = cur, g = c.g, p0 = c.pts[0];
      if (c.phase === 'lead') {
        const lead = g.lead ?? 0.22; c.t += dt; const k = lead <= 0 ? 1 : sm(c.t / lead);
        ptr.x = lerp(c.from[0], p0[0], k); ptr.y = lerp(c.from[1], p0[1], k); has = true;
        if (c.t >= lead) { c.phase = 'press'; c.t = 0; }
      } else if (c.phase === 'press') {
        ptr.x = p0[0]; ptr.y = p0[1]; ptr.down = true; ptr.pressed = true; has = true; c.phase = c.pts.length > 1 ? 'drag' : 'hold'; c.segT = 0; c.holdT = 0;
      } else if (c.phase === 'drag') {
        const a = c.pts[c.i], b = c.pts[c.i + 1], seg = Array.isArray(g.dur) ? g.dur[c.i] : (g.dur ?? 0.3);
        c.segT += dt; const k = seg <= 0 ? 1 : clamp(c.segT / seg, 0, 1), e = g.linear ? k : sm(k);
        ptr.x = lerp(a[0], b[0], e); ptr.y = lerp(a[1], b[1], e);
        if (k >= 1) { c.i++; c.segT = 0; if (c.i >= c.pts.length - 1) c.phase = 'hold'; }
      } else if (c.phase === 'hold') {
        const e = c.pts[c.pts.length - 1]; ptr.x = e[0]; ptr.y = e[1]; c.holdT += dt;
        if (c.holdT >= (g.hold ?? 0.05)) { ptr.down = false; ptr.released = true; cur = null; if (g.after) g.after(); }
      }
      return ptr;
    },
  };
}

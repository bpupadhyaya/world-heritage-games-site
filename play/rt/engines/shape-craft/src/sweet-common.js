// shape-craft 1.26.0 Kitchen Crafts, SWEET area: helpers shared by the two techniques `sweet-taffy` and `sweet-nerikiri`.
// Pure functions: no DOM, no Math.random, no clocks (time arrives from the caller). Design space: x in [0, ar], y in [0, 1].
import { fx as shared } from '../../../platform/engine-kit/synth.js';
import { chaikin, resample, scoreLayer } from './paint-stroke.js';
import { mix, rrect as rrect0 } from './fx.js';

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth01 = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const TAU = Math.PI * 2;

const movingAvg = (p) => p.map((q, i) => (i === 0 || i === p.length - 1 ? q : [(p[i - 1][0] + q[0] + p[i + 1][0]) / 3, (p[i - 1][1] + q[1] + p[i + 1][1]) / 3]));

// raw = [{x, y, t}] pointer positions (design units) with the time they were seen. Returns [{ x, y, t, v }]: a smooth path at 0.005 steps with
// zero lag, the time the hand was there and its speed in design units per second (smoothed over a short window).
export function smoothRaw(raw, step = 0.005) {
  if (!raw.length) return [];
  if (raw.length === 1) return [{ x: raw[0].x, y: raw[0].y, t: raw[0].t, v: 0 }];
  const P0 = raw.map((r) => [r.x, r.y]), cum = [0];
  for (let i = 1; i < P0.length; i++) cum.push(cum[i - 1] + dist(P0[i - 1], P0[i]));
  const total = cum[cum.length - 1] || 1e-6;
  const sm = chaikin(movingAvg(P0.length > 2 ? movingAvg(P0) : P0), 2), R = resample(sm, step);
  const out = [], n = R.length;
  let s = 0, j = 1;
  for (let i = 0; i < n; i++) {
    if (i) s += dist(R[i - 1], R[i]);
    out.push({ x: R[i][0], y: R[i][1], t: 0, v: 0, _s: s });
  }
  const L = out[n - 1]._s || 1e-6;
  for (const o of out) {
    const target = (o._s / L) * total;
    while (j < cum.length - 1 && cum[j] < target) j++;
    const a = cum[j - 1], b = cum[j], u = b > a ? (target - a) / (b - a) : 0;
    o.t = raw[j - 1].t + (raw[j].t - raw[j - 1].t) * clamp(u, 0, 1);
  }
  const K = 6;
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - K), b = Math.min(n - 1, i + K), dt = Math.max(1 / 90, out[b].t - out[a].t), ds = out[b]._s - out[a]._s;
    out[i].v = ds / dt;
  }
  for (const o of out) delete o._s;
  return out;
}

// scoreLayer twice: once with every line sample, once with only the good ones; a poorly made line counts for `poor` of a good one.
export function scoreSplit(prep, all, good, tol, poor = 0.4) {
  const a = scoreLayer(prep, all, tol), g = scoreLayer(prep, good, tol);
  if (a.line == null) return a;
  const raw = (r) => (r.line ?? 0) / Math.max(1e-6, 1 - 0.6 * r.stray), pen = 1 - 0.6 * a.stray;
  const line = clamp((raw(g) + poor * Math.max(0, raw(a) - raw(g))) * pen, 0, 1);
  const wl = prep.wLine ?? (a.fill == null ? 1 : 0.5), wf = a.fill == null ? 0 : (prep.wFill ?? 0.5);
  const base = (wl * line + wf * (a.fill ?? 0)) / Math.max(1e-6, wl + wf);
  return { ...a, line, goodLine: g.line, score: Math.round(100 * clamp(base, 0, 1)) };
}

// A safe sound caller that also writes the optional soundLog the other techniques write.
export function makeVoice(env, tag) {
  const log = env.options?.soundLog;
  return (kind, p = {}) => { if (log) log.push({ kind: `${tag}.${kind}` }); try { return shared(env.audio, kind, p); } catch { return false; } };
}

// a rounded rectangle that never gets a negative size or radius (a tiny live preview can leave no room at all)
export function rrect(ctx, x, y, w, h, r) {
  const W = Number.isFinite(w) ? Math.max(0, w) : 0, H = Number.isFinite(h) ? Math.max(0, h) : 0;
  rrect0(ctx, Number.isFinite(x) ? x : 0, Number.isFinite(y) ? y : 0, W, H, Math.max(0, Math.min(Number.isFinite(r) ? r : 0, W / 2, H / 2)));
}
export function fitBox(R, ar, topPad = 0) {
  const s = Math.max(4, Math.min(R.h - topPad, R.w / ar));
  return { s, ox: R.x + (R.w - s * ar) / 2, oy: R.y + topPad + (R.h - topPad - s) / 2 };
}

// index of the guide sample nearest to (x, y) within [lo, hi]; returns { i, d }
export function nearestIndex(pts, x, y, lo = 0, hi = pts.length - 1) {
  let bi = -1, bd = 9;
  for (let i = Math.max(0, lo); i <= Math.min(pts.length - 1, hi); i++) { const d = Math.hypot(pts[i][0] - x, pts[i][1] - y); if (d < bd) { bd = d; bi = i; } }
  return { i: bi, d: bd };
}
export function pointAt(pts, s) {
  let acc = 0;
  for (let i = 1; i < pts.length; i++) { const d = dist(pts[i - 1], pts[i]); if (acc + d >= s) { const t = d ? (s - acc) / d : 0; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]; } acc += d; }
  return pts[pts.length - 1];
}

// ---- hands (canvas 2D, lit from the upper left): a gripping fist and a two-finger pinch. The grasped shaft runs along +x through the origin; the arm
// leaves toward `dir` (+1 or -1). u = the width of the hand along the shaft in pixels; sleeve = the colour of the cuff.
const skin = (ctx, x0, y0, x1, y1) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, '#f4cfae'); g.addColorStop(0.5, '#dba37c'); g.addColorStop(1, '#a96c4a'); return g; };
function capsule(ctx, ax, ay, bx, by, r, fill, edge = 'rgba(80,40,20,0.45)') {
  const L = Math.hypot(bx - ax, by - ay), a = Math.atan2(by - ay, bx - ax);
  ctx.save(); ctx.translate((ax + bx) / 2, (ay + by) / 2); ctx.rotate(a);
  ctx.beginPath(); ctx.moveTo(-L / 2, -r); ctx.lineTo(L / 2, -r); ctx.arc(L / 2, 0, r, -Math.PI / 2, Math.PI / 2); ctx.lineTo(-L / 2, r); ctx.arc(-L / 2, 0, r, Math.PI / 2, Math.PI * 1.5); ctx.closePath();
  ctx.fillStyle = typeof fill === 'function' ? fill(ctx, L, r) : fill; ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = Math.max(1, r * 0.12); ctx.stroke();
  ctx.restore();
}
const sleeveOf = (ctx, dir, u, sleeve) => {
  capsule(ctx, dir * 0.5 * u, 0.05 * u, dir * 2.6 * u, 0.05 * u, 0.56 * u, (c, L, r) => { const g = c.createLinearGradient(0, -r, 0, r); g.addColorStop(0, mix(sleeve, '#ffffff', 0.3)); g.addColorStop(0.5, sleeve); g.addColorStop(1, mix(sleeve, '#000000', 0.45)); return g; }, 'rgba(0,0,0,0.4)');
  ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = Math.max(1, u * 0.04); for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(dir * (0.7 + k * 0.45) * u, -0.5 * u); ctx.lineTo(dir * (0.7 + k * 0.45) * u, 0.6 * u); ctx.stroke(); } ctx.restore();
  capsule(ctx, dir * 0.28 * u, 0.04 * u, dir * 0.62 * u, 0.04 * u, 0.4 * u, (c) => skin(c, 0, -0.4 * u, 0, 0.4 * u));
};
export function drawFist(ctx, u, dir = 1, sleeve = '#a8322a') {
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = u * 0.12; ctx.shadowOffsetY = u * 0.1;
  sleeveOf(ctx, dir, u, sleeve); ctx.shadowColor = 'transparent';
  // the palm behind, then four fingers wrapped over the shaft, then the thumb along it
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-0.5 * u, -0.42 * u, 1.0 * u, 0.84 * u, 0.2 * u) : ctx.rect(-0.5 * u, -0.42 * u, u, 0.84 * u); ctx.fillStyle = skin(ctx, -0.5 * u, -0.4 * u, 0.5 * u, 0.4 * u); ctx.fill();
  for (let k = 0; k < 4; k++) {
    const x = (-0.38 + k * 0.255) * u, len = 0.5 * u * (k === 0 || k === 3 ? 0.92 : 1);
    capsule(ctx, x, -len, x, len * 0.9, 0.118 * u, (c, L, r) => { const g = c.createLinearGradient(0, -r, 0, r); g.addColorStop(0, '#f6d3b3'); g.addColorStop(0.45, '#dca77f'); g.addColorStop(1, '#a56848'); return g; });
    ctx.fillStyle = 'rgba(255,240,225,0.55)'; ctx.beginPath(); ctx.ellipse(x - 0.03 * u, -len * 0.55, 0.035 * u, 0.1 * u, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(110,60,34,0.45)'; ctx.lineWidth = Math.max(1, u * 0.025); ctx.beginPath(); for (const f of [-0.1, 0.25]) { ctx.moveTo(x - 0.1 * u, len * f); ctx.lineTo(x + 0.1 * u, len * f); } ctx.stroke();
  }
  capsule(ctx, dir * 0.38 * u, -0.5 * u, -dir * 0.32 * u, -0.58 * u, 0.13 * u, (c) => skin(c, 0, -0.7 * u, 0, -0.4 * u));
  ctx.fillStyle = 'rgba(255,238,230,0.8)'; ctx.beginPath(); ctx.ellipse(-dir * 0.26 * u, -0.6 * u, 0.07 * u, 0.045 * u, 0, 0, TAU); ctx.fill();
  ctx.restore();
}
// A pen-style pinch: index finger above and thumb below meet the shaft; the back of the hand and the sleeve lie away toward `dir`.
export function drawPinch(ctx, u, dir = 1, sleeve = '#33466a') {
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = u * 0.12; ctx.shadowOffsetY = u * 0.1;
  sleeveOf(ctx, dir, u, sleeve); ctx.shadowColor = 'transparent';
  ctx.beginPath(); ctx.ellipse(dir * 0.95 * u, 0.0 * u, 0.42 * u, 0.4 * u, 0, 0, TAU); ctx.fillStyle = skin(ctx, 0, -0.4 * u, 0, 0.4 * u); ctx.fill(); ctx.strokeStyle = 'rgba(80,40,20,0.4)'; ctx.lineWidth = 1; ctx.stroke();
  capsule(ctx, dir * 0.95 * u, -0.3 * u, dir * 0.0 * u, -0.07 * u, 0.1 * u, (c) => skin(c, 0, -0.45 * u, 0, -0.05 * u));
  capsule(ctx, dir * 0.8 * u, 0.32 * u, dir * 0.0 * u, 0.07 * u, 0.11 * u, (c) => skin(c, 0, 0.0, 0, 0.45 * u));
  ctx.fillStyle = 'rgba(255,238,230,0.75)'; ctx.beginPath(); ctx.ellipse(dir * 0.02 * u, -0.08 * u, 0.045 * u, 0.03 * u, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(dir * 0.04 * u, 0.1 * u, 0.045 * u, 0.03 * u, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,240,225,0.35)'; ctx.beginPath(); ctx.ellipse(dir * 0.8 * u, -0.15 * u, 0.2 * u, 0.1 * u, 0, 0, TAU); ctx.fill();
  ctx.restore();
}

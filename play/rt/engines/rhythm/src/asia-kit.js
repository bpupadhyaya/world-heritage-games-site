// Shared pieces of the 1.23.0 Asian drum stages (janggu, kakko, kendang, dong son, dabakan, tavil): a bamboo or wooden stick that visits a struck spot,
// a wood fill, a wrapped rim of cord, a perspective cone. Plain canvas 2D, deterministic, no clocks.
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU } from './drum-kit.js';

export const PI = Math.PI;
export { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU };
export const lerp = (a, b, t) => a + (b - a) * t;
export const d2r = (d) => d * PI / 180;
// the largest flash among the keys of a stage (rt.flash[i] per lane)
export const fl = (K, keyOf, rt, ...ks) => { let m = 0; for (let i = 0; i < K.N; i++) if (ks.includes(keyOf[i])) m = Math.max(m, rt.flash[i]); return m; };

// wood: a horizontal gradient with a lit left side and a dark right side
export const woodH = (ctx, x0, x1, c) => hgrad(ctx, x0, x1, [[0, darker(c, 0.62)], [0.22, lighter(c, 0.32)], [0.5, c], [0.82, darker(c, 0.45)], [1, darker(c, 0.72)]]);

// a tapered stick from the grip (x,y) along `ang`, length len, width w (thick end first), with an optional knob; a = alpha. col = wood.
export function stick(ctx, x, y, ang, len, w, o = {}) {
  const { col = '#d8b27a', knob = null, a = 1, tip = 0.45 } = o;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.moveTo(0, -w / 2 + 7); ctx.lineTo(len, -w * tip / 2 + 7); ctx.lineTo(len, w * tip / 2 + 7); ctx.lineTo(0, w / 2 + 7); ctx.closePath(); ctx.fill();
  ctx.fillStyle = vgrad(ctx, -w / 2, w / 2, [[0, lighter(col, 0.45)], [0.5, col], [1, darker(col, 0.55)]]);
  ctx.beginPath(); ctx.moveTo(0, -w / 2); ctx.lineTo(len, -w * tip / 2); ctx.lineTo(len, w * tip / 2); ctx.lineTo(0, w / 2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rgba(darker(col, 0.7), 0.6); ctx.lineWidth = 1.2; ctx.stroke();
  if (o.nodes) for (const f of o.nodes) { ctx.strokeStyle = rgba(darker(col, 0.65), 0.55); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(len * f, -w * lerp(0.5, tip / 2, f)); ctx.lineTo(len * f, w * lerp(0.5, tip / 2, f)); ctx.stroke(); }
  if (knob) { ctx.fillStyle = rgrad(ctx, len, 0, 0, knob.r * 1.2, [[0, lighter(knob.col, 0.5)], [0.6, knob.col], [1, darker(knob.col, 0.55)]], len - knob.r * 0.3, -knob.r * 0.3); circ(ctx, len + knob.r * 0.35, 0, knob.r); ctx.fill(); ctx.strokeStyle = rgba(darker(knob.col, 0.7), 0.6); ctx.stroke(); }
  ctx.restore();
}

// a stick that visits a struck place: the head is at (x,y) at the instant of the stroke and withdraws along `dir` as the flash `f` fades.
export function visitStick(ctx, x, y, f, o = {}) {
  if (f < 0.05) return;
  const { dir = [0.5, -1], back = 110, len = 260, w = 12, ang = -2.0, col = '#d8b27a', knob = null, nodes = null } = o, e = 1 - Math.pow(1 - clamp(f * 1.12, 0, 1), 2);
  const d = Math.hypot(dir[0], dir[1]) || 1, hx = x + dir[0] / d * back * (1 - e), hy = y + dir[1] / d * back * (1 - e), kr = knob ? knob.r : 0;
  ctx.save(); ctx.globalAlpha = clamp(f * 3, 0, 1);
  stick(ctx, hx - Math.cos(ang) * (len + kr * 0.35), hy - Math.sin(ang) * (len + kr * 0.35), ang, len, w, { col, knob, nodes });
  ctx.restore();
}

// a wrapped cord ring round an ellipse (rim), drawn in local space with n turns
export function cordRim(ctx, rx, ry, w, col, n = 40) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = w + 3; ctx.beginPath(); ctx.ellipse(1.5, 2.5, rx, ry, 0, 0, TAU); ctx.stroke();
  ctx.strokeStyle = darker(col, 0.5); ctx.lineWidth = w; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = w * 0.68; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.stroke();
  for (let k = 0; k < n; k++) { const a = (k / n) * TAU, c = Math.cos(a), s = Math.sin(a); ctx.strokeStyle = rgba(darker(col, 0.55), 0.5); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(c * (rx - w * 0.38), s * (ry - w * 0.38)); ctx.lineTo(Math.cos(a + 0.12) * (rx + w * 0.38), Math.sin(a + 0.12) * (ry + w * 0.38)); ctx.stroke(); }
  ctx.strokeStyle = rgba(lighter(col, 0.6), 0.4); ctx.lineWidth = w * 0.18; ctx.beginPath(); ctx.ellipse(-w * 0.1, -w * 0.12, rx, ry, 0, PI * 1.05, PI * 1.7); ctx.stroke();
  ctx.restore();
}

// a rope-like thread between two points: a dark under-stroke, the thread, and a bright core. w = thread width
export function thread(ctx, x0, y0, x1, y1, w, col) {
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.36)'; ctx.lineWidth = w + 2; ctx.beginPath(); ctx.moveTo(x0 + 2, y0 + 3.5); ctx.lineTo(x1 + 2, y1 + 3.5); ctx.stroke();
  ctx.strokeStyle = darker(col, 0.5); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = w * 0.64; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = rgba(lighter(col, 0.7), 0.7); ctx.lineWidth = Math.max(1, w * 0.2); ctx.beginPath(); ctx.moveTo(x0 - w * 0.12, y0 - w * 0.14); ctx.lineTo(x1 - w * 0.12, y1 - w * 0.14); ctx.stroke();
  ctx.restore();
}

// a tassel: a knot and a fall of strands (hangs along +y in local space)
export function tassel(ctx, x, y, len, col, w = 18) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.moveTo(-w * 0.4 + 4, 4); ctx.lineTo(w * 0.4 + 4, 4); ctx.lineTo(w * 0.7 + 4, len + 4); ctx.lineTo(-w * 0.7 + 4, len + 4); ctx.closePath(); ctx.fill();
  for (let k = -5; k <= 5; k++) { ctx.strokeStyle = k % 2 ? col : darker(col, 0.3); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(k * w * 0.07, 0); ctx.lineTo(k * w * 0.13, len); ctx.stroke(); }
  ctx.fillStyle = rgrad(ctx, -w * 0.12, -w * 0.12, 0, w * 0.5, [[0, lighter(col, 0.6)], [1, darker(col, 0.5)]]); circ(ctx, 0, 0, w * 0.34); ctx.fill();
  ctx.strokeStyle = '#e6c25a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-w * 0.4, w * 0.3); ctx.lineTo(w * 0.4, w * 0.3); ctx.stroke();
  ctx.restore();
}

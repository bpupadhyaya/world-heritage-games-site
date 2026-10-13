// Small shared helpers for the three string-puppet theatres (kathputli, yoke the, bohemian). Pure canvas, deterministic.
import { mix, dark, light, alpha, poly, vgrad, hgrad, rrPath } from '../figures.js';

export const TAU = Math.PI * 2;
export const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export { mix, dark, light, alpha, poly, vgrad, hgrad, rrPath };

export function glow(ctx, x, y, r, col, a = 0.5) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, alpha(col, a)); g.addColorStop(1, alpha(col, 0));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
export function flame(ctx, x, y, r, t, ph = 0) {
  const f = 0.85 + 0.15 * Math.sin(t * 9 + ph) * Math.sin(t * 3.3 + ph * 2);
  glow(ctx, x, y - r * 0.6, r * 4.2 * f, '#ffb347', 0.55);
  ctx.fillStyle = '#ff9a2a'; ctx.beginPath(); ctx.moveTo(x - r * 0.55, y); ctx.quadraticCurveTo(x - r * 0.4, y - r * 1.4 * f, x + Math.sin(t * 6 + ph) * r * 0.2, y - r * 2.1 * f); ctx.quadraticCurveTo(x + r * 0.5, y - r * 1.1, x + r * 0.55, y); ctx.fill();
  ctx.fillStyle = '#fff0a8'; ctx.beginPath(); ctx.ellipse(x, y - r * 0.5, r * 0.28, r * 0.7 * f, 0, 0, TAU); ctx.fill();
}
// stroked limb segment with a soft highlight
export function seg(ctx, x0, y0, x1, y1, w, col) {
  ctx.lineCap = 'round'; ctx.strokeStyle = dark(col, 0.35); ctx.lineWidth = w + 1.5; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = Math.max(1, w * 0.28); ctx.beginPath(); ctx.moveTo(x0 - w * 0.15, y0); ctx.lineTo(x1 - w * 0.15, y1); ctx.stroke();
}
// two-bone arm: ang 0 hangs down, positive swings outward/up; returns [ex, ey, hx, hy]
export function arm2(ctx, sx, sy, ang, side, len, w, col, bendOut = 0.5) {
  const a = ang, ex0 = sx + side * Math.sin(a * 0.55) * len * 0.5, ey0 = sy + Math.cos(a * 0.55) * len * 0.5;
  const ex = ex0 + side * bendOut * len * 0.22, ey = ey0;
  const hx = sx + side * Math.sin(a) * len, hy = sy + Math.cos(a) * len;
  seg(ctx, sx, sy, ex, ey, w, col); seg(ctx, ex, ey, hx, hy, w * 0.92, col);
  return [ex, ey, hx, hy];
}
export function ball(ctx, x, y, r, col) {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r * 1.1);
  g.addColorStop(0, light(col, 0.35)); g.addColorStop(0.7, col); g.addColorStop(1, dark(col, 0.35));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}
// wooden painted head, frontal: returns nothing; r = radius
export function woodHead(ctx, x, y, r, skin, o = {}) {
  const w = r * (o.wide ?? 0.92), h = r * (o.tall ?? 1.08);
  const g = ctx.createRadialGradient(x - w * 0.3, y - h * 0.35, r * 0.1, x, y, h * 1.15);
  g.addColorStop(0, light(skin, 0.28)); g.addColorStop(0.7, skin); g.addColorStop(1, dark(skin, 0.3));
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, w, h, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = dark(skin, 0.55); ctx.lineWidth = Math.max(1, r * 0.07); ctx.stroke();
}
// seated musician (silhouette-with-colour) used by the orchestras: turban/cap, body, crossed legs
export function seated(ctx, x, y, s, o) {
  const body = o.body ?? '#c8452d', skin = o.skin ?? '#a8704a';
  ctx.fillStyle = vgrad(ctx, y - s, y, [[0, light(body, 0.1)], [1, dark(body, 0.4)]]);
  ctx.beginPath(); ctx.moveTo(x - s * 0.5, y); ctx.quadraticCurveTo(x - s * 0.55, y - s * 0.35, x - s * 0.22, y - s * 0.62); ctx.lineTo(x + s * 0.22, y - s * 0.62); ctx.quadraticCurveTo(x + s * 0.55, y - s * 0.35, x + s * 0.5, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(x, y - s * 0.8, s * 0.17, 0, TAU); ctx.fill();
  ctx.fillStyle = o.hat ?? '#e8742a'; ctx.beginPath(); ctx.ellipse(x, y - s * 0.93, s * 0.22, s * 0.14, 0, 0, TAU); ctx.fill();
  if (o.hatTall) { ctx.fillRect(x - s * 0.1, y - s * 1.2, s * 0.2, s * 0.25); }
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.ellipse(x - s * 0.12, y - s * 0.4, s * 0.1, s * 0.16, 0.3, 0, TAU); ctx.fill();
}

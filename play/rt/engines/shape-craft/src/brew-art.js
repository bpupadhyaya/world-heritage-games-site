// shape-craft `brew` shared drawing (1.26.0): copper and clay shading, foam and bubbles, steam puffs, embers, glows.
// Pure canvas 2D: irregularity from `hash`, motion from the time `t` (seconds, supplied by the caller). No DOM, no Math.random.
import { hash } from './geom.js';
import { tint, mix, rgba, rrect } from './fx.js';
import { lg, rg, ell, TAU } from './props.js';

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sm = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

// A horizontal cylinder gradient between x0 and x1: dark edges, a sharp specular band at `hl` (0..1), a warm bounce on the far side.
export function cyl(ctx, x0, x1, base, o = {}) {
  const hl = o.hl ?? 0.3, g = ctx.createLinearGradient(x0, 0, x1, 0), w = o.spec ?? 0.55;
  g.addColorStop(0, tint(base, -0.62)); g.addColorStop(0.1, tint(base, -0.3)); g.addColorStop(Math.max(0.12, hl - 0.12), tint(base, 0.1));
  g.addColorStop(hl - 0.03, tint(base, w)); g.addColorStop(hl, tint(base, w + 0.2)); g.addColorStop(hl + 0.04, tint(base, 0.22));
  g.addColorStop(0.55, base); g.addColorStop(0.82, tint(base, -0.38)); g.addColorStop(0.93, tint(mix(base, o.bounce ?? '#ff9a4a', 0.35), -0.05)); g.addColorStop(1, tint(base, -0.6));
  return g;
}

// A bubble: a thin translucent film, a lit upper left, a pin-point specular.
export function bubble(ctx, x, y, r, tone = '#d9a868', a = 1) {
  if (r < 0.4) return;
  ctx.save(); ctx.globalAlpha = a;
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, tint(tone, 0.55)); g.addColorStop(0.55, tone); g.addColorStop(0.9, tint(tone, -0.38)); g.addColorStop(1, tint(tone, -0.55));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = rgba(tint(tone, -0.6), 0.55); ctx.lineWidth = Math.max(0.6, r * 0.12); ctx.stroke();
  ctx.fillStyle = 'rgba(255,250,235,0.9)'; ctx.beginPath(); ctx.arc(x - r * 0.38, y - r * 0.4, Math.max(0.5, r * 0.2), 0, TAU); ctx.fill();
  ctx.restore();
}

// Foam heaped in an opening: an elliptical mouth (cx, cy, rx, ry) with a dome of bubbles rising `rise` above it (pixels). `tone` is the crema colour.
export function foam(ctx, cx, cy, rx, ry, rise, t, o = {}) {
  const tone = o.tone ?? '#c88c4e', dark = o.dark ?? '#6a3c1a', seed = o.seed ?? 3, n = o.n ?? Math.round(34 + rx * 0.9);
  // the body of the foam: a dome over the mouth (or a flat surface when rise is small)
  ctx.save();
  ctx.beginPath();
  if (rise <= 0.5) ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  else {
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI); // front half of the mouth
    ctx.bezierCurveTo(cx - rx * 1.04, cy - rise * 0.35, cx - rx * 0.62, cy - ry - rise * 1.02, cx, cy - ry - rise);
    ctx.bezierCurveTo(cx + rx * 0.62, cy - ry - rise * 1.02, cx + rx * 1.04, cy - rise * 0.35, cx + rx, cy);
  }
  ctx.closePath();
  const fg = ctx.createRadialGradient(cx - rx * 0.2, cy - rise * 0.8, 2, cx, cy - rise * 0.2, rx * 1.2 + rise);
  fg.addColorStop(0, tint(tone, 0.42)); fg.addColorStop(0.5, tone); fg.addColorStop(1, dark);
  ctx.fillStyle = fg; ctx.fill(); ctx.clip();
  // bubbles, small and many, sized by hash; they breathe slowly
  const R = (i, k) => hash(i, seed, k);
  for (let i = 0; i < n; i++) {
    const u = R(i, 1) * 2 - 1, v = R(i, 2) * 2 - 1, bx = cx + u * rx * 0.95, by = cy + v * ry * 0.8 - rise * R(i, 3) * Math.max(0, 1 - u * u) * 0.95;
    if (u * u + v * v > 1.3 && rise <= 0.5) continue;
    const r = rx * (0.022 + 0.055 * R(i, 4)) * (1 + 0.1 * Math.sin(t * 1.7 + i));
    bubble(ctx, bx, by, r, mix(tone, dark, R(i, 5) * 0.55), 0.78 + 0.2 * R(i, 6));
  }
  // a few big shining bubbles that pop (a short flash)
  for (let i = 0; i < 5; i++) {
    const ph = ((t * 0.45 + R(i, 7)) % 1), bx = cx + (R(i, 8) - 0.5) * rx * 1.4, by = cy - ry * 0.2 - rise * (0.2 + 0.7 * R(i, 9)) * (1 - Math.pow((bx - cx) / rx, 2) * 0.8), r = rx * (0.06 + 0.04 * R(i, 10));
    if (ph < 0.9) bubble(ctx, bx, by, r * (0.6 + 0.4 * ph), tone, 0.9); else { ctx.fillStyle = rgba('#fff2d0', 0.8 * (1 - (ph - 0.9) * 10)); ctx.beginPath(); ctx.arc(bx, by, r * 1.5, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
}

// Steam as soft puffs rising and widening. (x, y) is the source, h the height it climbs, w the sway; amt 0..1 strength.
export function steam(ctx, x, y, w, h, t, amt, o = {}) {
  if (amt <= 0.02) return;
  const n = o.n ?? 9, seed = o.seed ?? 1, col = o.col ?? '255,250,240';
  ctx.save();
  for (let i = 0; i < n; i++) {
    const a = (t * (o.speed ?? 0.34) + i / n + hash(i, seed) * 0.1) % 1, sway = Math.sin(a * 5.2 + i * 1.9 + t * 0.9) * w * (0.15 + a * 0.6);
    const px = x + sway + (hash(i, seed, 2) - 0.5) * w * 0.4, py = y - a * h, r = (o.r ?? w * 0.22) * (0.5 + a * 2.1), al = amt * 0.34 * Math.pow(1 - a, 1.5) * Math.min(1, a * 6);
    const g = ctx.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, `rgba(${col},${al})`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// A warm additive glow.
export function glow(ctx, x, y, r, col = '255,150,60', a = 0.5) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.5, `rgba(${col},${a * 0.35})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}

// Hammered metal: small dimples with a lit upper left and a dark lower right, drawn inside the current clip.
export function dimples(ctx, x, y, w, h, n, size, seed = 1, k = 1) {
  for (let i = 0; i < n; i++) {
    const px = x + hash(i, seed, 1) * w, py = y + hash(i, seed, 2) * h, r = size * (0.6 + hash(i, seed, 3) * 0.7);
    ctx.fillStyle = `rgba(30,8,0,${0.2 * k})`; ctx.beginPath(); ctx.ellipse(px + r * 0.28, py + r * 0.3, r, r * 0.8, -0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = `rgba(255,222,180,${0.32 * k})`; ctx.beginPath(); ctx.ellipse(px - r * 0.2, py - r * 0.22, r * 0.78, r * 0.55, -0.3, 0, TAU); ctx.fill();
  }
}

// Soft contact shadow under a standing object.
export function groundShadow(ctx, x, y, rx, ry, a = 0.5) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, rx); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.6, `rgba(0,0,0,${a * 0.5})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx); ctx.translate(-x, -y); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rx, 0, TAU); ctx.fill(); ctx.restore();
}

// Embers: a bed of small glowing coals across a rect. heat 0..1 sets brightness; flicker from t.
export function embers(ctx, x, y, w, h, t, heat, seed = 1, n = 46) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const px = x + hash(i, seed, 1) * w, py = y + hash(i, seed, 2) * h, f = 0.55 + 0.45 * Math.sin(t * (2.2 + hash(i, seed, 3) * 3) + i * 2.3), b = clamp(heat * f, 0, 1);
    const r = 1.8 + hash(i, seed, 4) * 3.6;
    ctx.fillStyle = `rgba(${Math.round(110 + 145 * b)},${Math.round(26 + 150 * b * b)},${Math.round(8 + 40 * b * b)},${0.5 + 0.5 * b})`;
    ctx.beginPath(); ctx.ellipse(px, py, r * 1.5, r, hash(i, seed, 5) * 3, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// A tiny wooden spoon / scoop lying along +x, length s.
export function spoonProp(ctx, s, c = '#a9773d') {
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = lg(ctx, 0, -s * 0.04, 0, s * 0.04, [[0, tint(c, 0.4)], [0.5, c], [1, tint(c, -0.5)]]); ctx.lineWidth = s * 0.07;
  ctx.beginPath(); ctx.moveTo(-s * 0.5, 0); ctx.lineTo(s * 0.18, 0); ctx.stroke();
  ctx.fillStyle = lg(ctx, 0, -s * 0.12, 0, s * 0.12, [[0, tint(c, 0.35)], [1, tint(c, -0.4)]]); ell(ctx, s * 0.32, 0, s * 0.17, s * 0.12); ctx.fill();
  ctx.restore();
}

export { rrect, tint, mix, rgba, lg, rg, ell, TAU, hash };

// Scene kit for the pattern engine (1.5.0): drawing primitives, environments, cell skins, tools, supplies and sounds that the
// per-craft scenes (scenes.js) are composed from. Pure canvas 2D: no DOM, no Math.random; every irregularity comes from `hash`.
import { hash, rgba, mix, shade, lum, clamp, roundRectPath, motifPath, isFilled, lineWidthOf, drawStamp } from './art.js';

export const TAU = 6.2832;
export { hash, rgba, mix, shade, lum, clamp, roundRectPath, motifPath, isFilled, lineWidthOf, drawStamp };

// ---- primitives ----------------------------------------------------------------------------------------------------------------
export function speck(ctx, r, n, cols, a, size, seed) {
  ctx.save(); ctx.globalAlpha = a;
  for (let k = 0; k < cols.length; k++) {
    ctx.fillStyle = cols[k]; ctx.beginPath();
    for (let i = k; i < n; i += cols.length) ctx.rect(r.x + hash(i, seed) * r.w, r.y + hash(i, seed + 1) * r.h, size * (0.6 + hash(i, seed + 2)), size * (0.6 + hash(i, seed + 3)));
    ctx.fill();
  }
  ctx.restore();
}
// A lit cylinder from (x1,y1) to (x2,y2): body, shadow side, highlight (light from the top left).
export function rod(ctx, x1, y1, x2, y2, w, c, cap = 'round') {
  const L = Math.hypot(x2 - x1, y2 - y1) || 1;
  let nx = -(y2 - y1) / L, ny = (x2 - x1) / L; if (nx + ny > 0) { nx = -nx; ny = -ny; }
  const line = (lw, col, o) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x1 + nx * o, y1 + ny * o); ctx.lineTo(x2 + nx * o, y2 + ny * o); ctx.stroke(); };
  ctx.save(); ctx.lineCap = cap;
  line(w, shade(c, -0.5), 0); line(w * 0.78, c, w * 0.07); line(w * 0.28, shade(c, 0.6), w * 0.22);
  ctx.restore();
}
export function ball(ctx, x, y, r, c, shadow = true) {
  if (shadow) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x + r * 0.2, y + r * 0.35, r * 1.0, r * 0.55, 0, 0, TAU); ctx.fill(); }
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, shade(c, 0.55)); g.addColorStop(0.55, c); g.addColorStop(1, shade(c, -0.45));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}
export function shadowed(ctx, S, fn, k = 1) {
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = S.cell * 0.4 * k; ctx.shadowOffsetX = S.cell * 0.12 * k; ctx.shadowOffsetY = S.cell * 0.2 * k; fn(); ctx.restore();
}
export function poly(ctx, pts, close = true) { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); if (close) ctx.closePath(); }
export function glow(ctx, x, y, r, c, a) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(c, a)); g.addColorStop(1, rgba(c, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
export function vignette(ctx, r, a) {
  const g = ctx.createRadialGradient(r.x + r.w / 2, r.y + r.h / 2, Math.min(r.w, r.h) * 0.3, r.x + r.w / 2, r.y + r.h / 2, Math.max(r.w, r.h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
}
export function lines(ctx, r, dir, step, c, a, lw, wob = 0, seed = 1) {
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); ctx.beginPath();
  if (dir === 'h') for (let y = r.y + step * 0.5, i = 0; y < r.y + r.h; y += step, i++) { ctx.moveTo(r.x, y); for (let k = 1; k <= 6; k++) ctx.lineTo(r.x + (r.w * k) / 6, y + (hash(i, k, seed) - 0.5) * wob); }
  else for (let x = r.x + step * 0.5, i = 0; x < r.x + r.w; x += step, i++) { ctx.moveTo(x, r.y); for (let k = 1; k <= 6; k++) ctx.lineTo(x + (hash(i, k, seed) - 0.5) * wob, r.y + (r.h * k) / 6); }
  ctx.strokeStyle = rgba(c, a); ctx.lineWidth = lw; ctx.stroke(); ctx.restore();
}
// Over-under woven ground (mat, cloth, basket): batched dashed lines.
export function weaveGrid(ctx, r, p, c1, c2, a = 0.5) {
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  const nx = Math.ceil(r.w / p), ny = Math.ceil(r.h / p);
  const pass = (vert, par, c, al, lw, off) => {
    ctx.beginPath();
    for (let i = par; i < (vert ? nx : ny); i += 2) { if (vert) { ctx.moveTo(r.x + i * p + p / 2, r.y); ctx.lineTo(r.x + i * p + p / 2, r.y + r.h); } else { ctx.moveTo(r.x, r.y + i * p + p / 2); ctx.lineTo(r.x + r.w, r.y + i * p + p / 2); } }
    ctx.setLineDash([p, p]); ctx.lineDashOffset = off; ctx.lineWidth = lw; ctx.strokeStyle = rgba(c, al); ctx.stroke();
  };
  pass(false, 0, c1, a, p * 0.7, 0); pass(false, 1, c1, a, p * 0.7, p); pass(true, 0, c2, a, p * 0.7, p); pass(true, 1, c2, a, p * 0.7, 0);
  ctx.restore();
}
// Dashes placed along a polyline as threads/stitches with a sheen.
export function sheenLine(ctx, pts, w, c, a = 1) {
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const path = (ox, oy) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + ox, y + oy) : ctx.moveTo(x + ox, y + oy))); };
  ctx.globalAlpha = a;
  path(w * 0.14, w * 0.2); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = w; ctx.stroke();
  path(0, 0); ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke();
  path(-w * 0.12, -w * 0.16); ctx.strokeStyle = shade(c, 0.55); ctx.lineWidth = w * 0.28; ctx.stroke();
  ctx.restore();
}

// ---- environments (fill the whole play area) -----------------------------------------------------------------------------------
export const ENV = {
  wood(ctx, S, o = {}) {
    const a = S.area, base = o.base ?? '#5a3d24', p = o.plank ?? S.cell * 1.6;
    ctx.fillStyle = base; ctx.fillRect(a.x - 12, a.y, a.w + 24, a.h);
    if (o.dir === 'v') { for (let x = a.x, i = 0; x < a.x + a.w; x += p, i++) { ctx.fillStyle = rgba(hash(i, 3) > 0.5 ? '#000' : '#fff', 0.05 + hash(i, 4) * 0.05); ctx.fillRect(x, a.y, p, a.h); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x, a.y, 1.5, a.h); } lines(ctx, a, 'v', Math.max(3, p / 7), '#000', 0.16, 1.2, p * 0.1, 3); }
    else { for (let y = a.y, i = 0; y < a.y + a.h; y += p, i++) { ctx.fillStyle = rgba(hash(i, 3) > 0.5 ? '#000' : '#fff', 0.05 + hash(i, 4) * 0.05); ctx.fillRect(a.x, y, a.w, p); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(a.x, y, a.w, 1.5); } lines(ctx, a, 'h', Math.max(3, p / 7), '#000', 0.16, 1.2, p * 0.1, 3); }
    if (o.lamp !== false) glow(ctx, a.x + a.w * (o.lx ?? 0.5), a.y + a.h * (o.ly ?? 0.35), Math.max(a.w, a.h) * 0.7, o.lampC ?? '#ffd9a0', 0.22);
    vignette(ctx, a, 0.45);
  },
  earth(ctx, S, o = {}) {
    const a = S.area, b = o.base ?? '#8a5a3a';
    const g = ctx.createLinearGradient(a.x, a.y, a.x, a.y + a.h); g.addColorStop(0, shade(b, 0.12)); g.addColorStop(1, shade(b, -0.25)); ctx.fillStyle = g; ctx.fillRect(a.x - 12, a.y, a.w + 24, a.h);
    speck(ctx, a, 520, [shade(b, -0.3), shade(b, 0.25), shade(b, -0.1)], 0.4, 2.2, 8);
    ctx.fillStyle = rgba(shade(b, -0.35), 0.5); ctx.beginPath(); for (let i = 0; i < 26; i++) { const x = a.x + hash(i, 1) * a.w, y = a.y + hash(i, 2) * a.h; ctx.moveTo(x + 3, y); ctx.ellipse(x, y, 3 + hash(i, 3) * 4, 2 + hash(i, 4) * 2.5, 0, 0, TAU); } ctx.fill();
    vignette(ctx, a, 0.4);
  },
  mat(ctx, S, o = {}) {
    const a = S.area, b = o.base ?? '#b8924f'; ctx.fillStyle = b; ctx.fillRect(a.x - 12, a.y, a.w + 24, a.h);
    weaveGrid(ctx, { x: a.x - 12, y: a.y, w: a.w + 24, h: a.h }, o.p ?? 14, shade(b, -0.35), shade(b, 0.2), 0.55);
    vignette(ctx, a, 0.4);
  },
  stone(ctx, S, o = {}) {
    const a = S.area, b = o.base ?? '#6c6a64', p = o.size ?? S.cell * 3;
    ctx.fillStyle = b; ctx.fillRect(a.x - 12, a.y, a.w + 24, a.h);
    for (let y = a.y, j = 0; y < a.y + a.h; y += p * 0.7, j++) for (let x = a.x - (j % 2) * p / 2, i = 0; x < a.x + a.w; x += p, i++) {
      const v = (hash(i, j, 5) - 0.5) * 0.18; ctx.fillStyle = shade(b, v); ctx.fillRect(x + 1.5, y + 1.5, p - 3, p * 0.7 - 3);
      ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(x + 1.5, y + 1.5, p - 3, 2);
    }
    speck(ctx, a, 260, ['#000', '#fff'], 0.1, 2, 12); vignette(ctx, a, 0.5);
  },
  cloth(ctx, S, o = {}) {
    const a = S.area, b = o.base ?? '#3b2a4a'; ctx.fillStyle = b; ctx.fillRect(a.x - 12, a.y, a.w + 24, a.h);
    for (let i = 0; i < 7; i++) { const x = a.x + (i + hash(i, 1) * 0.6) * a.w / 6, g = ctx.createLinearGradient(x - 50, 0, x + 50, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, rgba(i % 2 ? '#fff' : '#000', 0.09)); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - 50, a.y, 100, a.h); }
    weaveGrid(ctx, a, 6, '#000', '#fff', 0.05); vignette(ctx, a, 0.45);
  },
  floorTiles(ctx, S, o = {}) {
    const a = S.area, p = o.size ?? S.cell * 1.7, c1 = o.c1 ?? '#8a7a5c', c2 = o.c2 ?? '#6a5a40';
    ctx.fillStyle = c1; ctx.fillRect(a.x - 12, a.y, a.w + 24, a.h);
    for (let y = a.y, j = 0; y < a.y + a.h; y += p, j++) for (let x = a.x, i = 0; x < a.x + a.w; x += p, i++) if ((i + j) % 2) { ctx.fillStyle = c2; ctx.fillRect(x, y, p, p); }
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let y = a.y; y < a.y + a.h; y += p) { ctx.moveTo(a.x, y); ctx.lineTo(a.x + a.w, y); } for (let x = a.x; x < a.x + a.w; x += p) { ctx.moveTo(x, a.y); ctx.lineTo(x, a.y + a.h); } ctx.stroke();
    speck(ctx, a, 200, ['#000', '#fff'], 0.1, 2, 4); vignette(ctx, a, 0.5);
  },
  paper(ctx, S, o = {}) {
    const a = S.area, b = o.base ?? '#e9dfc7'; ctx.fillStyle = b; ctx.fillRect(a.x - 12, a.y, a.w + 24, a.h);
    speck(ctx, a, 380, [shade(b, -0.2), '#fff'], 0.3, 1.6, 15); lines(ctx, a, 'h', 7, shade(b, -0.3), 0.06, 1, 2, 9); vignette(ctx, a, 0.25);
  },
  plain(ctx, S, o = {}) {
    const a = S.area, b = o.base ?? '#222', t = o.top ?? shade(b, 0.2);
    const g = ctx.createLinearGradient(a.x, a.y, a.x, a.y + a.h); g.addColorStop(0, t); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(a.x - 12, a.y, a.w + 24, a.h);
    if (o.light) glow(ctx, a.x + a.w * 0.5, a.y + a.h * 0.3, Math.max(a.w, a.h) * 0.8, o.light, 0.22); vignette(ctx, a, 0.4);
  },
  hills(ctx, S, o = {}) {
    const a = S.area, g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h);
    g.addColorStop(0, o.sky ?? '#6b5a7a'); g.addColorStop(0.5, o.sky2 ?? '#d9a06a'); g.addColorStop(1, '#2a3320'); ctx.fillStyle = g; ctx.fillRect(a.x - 12, a.y, a.w + 24, a.h);
    for (let k = 0; k < 3; k++) { ctx.fillStyle = rgba(['#4a4a68', '#3a4a45', '#2a3a2a'][k], 0.95); ctx.beginPath(); ctx.moveTo(a.x - 12, a.y + a.h * (0.3 + k * 0.1)); for (let i = 0; i <= 8; i++) ctx.lineTo(a.x + (a.w * i) / 8, a.y + a.h * (0.26 + k * 0.1 - 0.05 * Math.sin(i * 1.7 + k * 2) - 0.03 * hash(i, k))); ctx.lineTo(a.x + a.w + 12, a.y + a.h); ctx.lineTo(a.x - 12, a.y + a.h); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(a.x - 12, a.y + a.h * 0.55, a.w + 24, a.h * 0.45); vignette(ctx, a, 0.4);
  },
  rope(ctx, S, o = {}) { // charpai: a cot strung with rope
    const a = S.area, b = o.base ?? '#a9845a'; ctx.fillStyle = shade(b, -0.4); ctx.fillRect(a.x - 12, a.y, a.w + 24, a.h);
    const p = o.p ?? 16; ctx.lineCap = 'round';
    for (const v of [false, true]) { ctx.beginPath(); for (let i = 0; i * p < (v ? a.w : a.h) + p; i++) { if (v) { ctx.moveTo(a.x + i * p, a.y); ctx.lineTo(a.x + i * p, a.y + a.h); } else { ctx.moveTo(a.x, a.y + i * p); ctx.lineTo(a.x + a.w, a.y + i * p); } } ctx.strokeStyle = shade(b, v ? 0 : 0.12); ctx.lineWidth = p * 0.55; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = p * 0.12; ctx.stroke(); }
    vignette(ctx, a, 0.45);
  },
};

// ---- supplies: palette-tray vessels (drawn inside the button rect) -----------------------------------------------------------------
const bx = (b) => ({ cx: b.x + b.w / 2, cy: b.y + b.h / 2, r: Math.min(b.w, b.h) / 2 });
function ring(ctx, b, on, S) { // selected outline
  ctx.save(); ctx.strokeStyle = on ? S.pal.accent : 'rgba(255,255,255,0.28)'; ctx.lineWidth = on ? 4 : 1.5; roundRectPath(ctx, b.x, b.y, b.w, b.h, 12); ctx.stroke();
  if (on) { ctx.fillStyle = S.pal.accent; ctx.beginPath(); ctx.arc(b.x + b.w - 7, b.y + 7, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x + b.w - 9.5, b.y + 7); ctx.lineTo(b.x + b.w - 7.2, b.y + 9.2); ctx.lineTo(b.x + b.w - 4, b.y + 5); ctx.stroke(); }
  ctx.restore();
}
function backing(ctx, b, c, a = 0.55) { ctx.save(); roundRectPath(ctx, b.x, b.y, b.w, b.h, 12); ctx.fillStyle = rgba(c, a); ctx.fill(); ctx.restore(); }
export const POT = {
  // a tub of liquid dye seen from above and a little in front
  vat(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; backing(ctx, b, '#1a120a', 0.5);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(cx + 2, cy + r * 0.62 + lift, r * 0.86, r * 0.3, 0, 0, TAU); ctx.fill();
    const g = ctx.createLinearGradient(cx - r, 0, cx + r, 0); g.addColorStop(0, '#8d6a46'); g.addColorStop(0.5, '#c79a63'); g.addColorStop(1, '#5a3d22');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.12 + lift, r * 0.8, r * 0.74, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3b2814'; ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.08 + lift, r * 0.7, r * 0.52, 0, 0, TAU); ctx.fill();
    const lg = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2 + lift, 1, cx, cy - r * 0.08 + lift, r * 0.6); lg.addColorStop(0, shade(col, 0.35)); lg.addColorStop(1, shade(col, -0.25));
    ctx.fillStyle = lg; ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.08 + lift, r * 0.6, r * 0.42, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(cx - r * 0.22, cy - r * 0.2 + lift, r * 0.2, r * 0.07, -0.3, 0, TAU); ctx.fill();
    ring(ctx, b, on, S);
  },
  bowl(ctx, S, b, col, on) { POT.vat(ctx, S, b, col, on); },
  spool(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), w = r * 1.0, h = r * 1.3, lift = on ? -3 : 0; backing(ctx, b, '#1d140c', 0.45);
    ctx.save(); ctx.translate(cx, cy + lift); ctx.rotate(0.12);
    ctx.fillStyle = '#c19a5f'; roundRectPath(ctx, -w * 0.62, -h / 2 - 3, w * 1.24, 7, 3); ctx.fill(); roundRectPath(ctx, -w * 0.62, h / 2 - 4, w * 1.24, 7, 3); ctx.fill();
    for (let i = 0; i < 9; i++) { ctx.fillStyle = i % 2 ? col : shade(col, -0.15); ctx.fillRect(-w / 2, -h / 2 + (h * i) / 9, w, h / 9 + 0.6); }
    const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, 'rgba(255,255,255,0.45)'); g.addColorStop(0.35, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.4)'); ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore(); ring(ctx, b, on, S);
  },
  skein(ctx, S, b, col, on) { // a twisted hank of thread
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; backing(ctx, b, '#1d140c', 0.45);
    ctx.save(); ctx.translate(cx, cy + lift); ctx.rotate(-0.5); ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) { const o = (i - 3) * r * 0.1; ctx.strokeStyle = i % 2 ? shade(col, -0.2) : shade(col, 0.1); ctx.lineWidth = r * 0.16; ctx.beginPath(); ctx.ellipse(o, 0, r * 0.5, r * 0.85, 0, 0, TAU); ctx.stroke(); }
    ctx.strokeStyle = shade(col, 0.5); ctx.globalAlpha = 0.5; ctx.lineWidth = r * 0.05; ctx.beginPath(); ctx.ellipse(-r * 0.1, 0, r * 0.5, r * 0.85, 0, 3.6, 5.4); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#f1e7d0'; ctx.fillRect(-r * 0.62, -r * 0.12, r * 1.24, r * 0.24);
    ctx.restore(); ring(ctx, b, on, S);
  },
  pot(ctx, S, b, col, on) { // a clay pot of pigment seen from above
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; backing(ctx, b, '#1b130c', 0.5);
    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3 + lift, 2, cx, cy + lift, r); g.addColorStop(0, '#c98d5a'); g.addColorStop(1, '#6a3d22');
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(cx + 2, cy + 3 + lift, r * 0.78, 0, TAU); ctx.fill();
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy + lift, r * 0.78, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a1a0e'; ctx.beginPath(); ctx.arc(cx, cy + lift, r * 0.58, 0, TAU); ctx.fill();
    const pg = ctx.createRadialGradient(cx - r * 0.15, cy - r * 0.15 + lift, 1, cx, cy + lift, r * 0.55); pg.addColorStop(0, shade(col, 0.4)); pg.addColorStop(1, shade(col, -0.2));
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(cx, cy + lift, r * 0.5, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(cx - r * 0.2, cy - r * 0.22 + lift, r * 0.16, r * 0.06, -0.5, 0, TAU); ctx.fill();
    ring(ctx, b, on, S);
  },
  heap(ctx, S, b, col, on) { // powder, sand or tesserae heaped on a tray
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; backing(ctx, b, '#14100c', 0.5);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.5 + lift, r * 0.85, r * 0.26, 0, 0, TAU); ctx.fill();
    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.4 + lift, 1, cx, cy + lift, r); g.addColorStop(0, shade(col, 0.45)); g.addColorStop(1, shade(col, -0.35));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - r * 0.85, cy + r * 0.5 + lift); ctx.quadraticCurveTo(cx - r * 0.3, cy - r * 1.0 + lift, cx, cy - r * 0.7 + lift); ctx.quadraticCurveTo(cx + r * 0.3, cy - r * 1.0 + lift, cx + r * 0.85, cy + r * 0.5 + lift); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); for (let k = 0; k < 14; k++) { const x = cx - r * 0.6 + hash(k, 1) * r * 1.2, y = cy - r * 0.5 + hash(k, 2) * r * 0.9 + lift; ctx.rect(x, y, 2, 2); } ctx.fill();
    ring(ctx, b, on, S);
  },
  tile(ctx, S, b, col, on) { // a stack of cut tiles
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; backing(ctx, b, '#14100c', 0.5);
    for (let i = 2; i >= 0; i--) { const w = r * 1.0, x = cx - w / 2 + (i - 1) * r * 0.16, y = cy - w / 2 + i * r * 0.14 - r * 0.14 + lift;
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; roundRectPath(ctx, x + 2, y + 3, w, w, 3); ctx.fill();
      const g = ctx.createLinearGradient(x, y, x + w, y + w); g.addColorStop(0, shade(col, 0.35)); g.addColorStop(1, shade(col, -0.3)); ctx.fillStyle = g; roundRectPath(ctx, x, y, w, w, 3); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.4; roundRectPath(ctx, x + 2, y + 2, w - 4, w - 4, 2); ctx.stroke(); }
    ring(ctx, b, on, S);
  },
  beads(ctx, S, b, col, on) { // a small dish of beads
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; backing(ctx, b, '#14100c', 0.5);
    ctx.fillStyle = '#8a6a44'; ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.18 + lift, r * 0.82, r * 0.6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3a2812'; ctx.beginPath(); ctx.ellipse(cx, cy + lift, r * 0.7, r * 0.46, 0, 0, TAU); ctx.fill();
    for (let k = 0; k < 15; k++) { const a = hash(k, 3) * TAU, rad = Math.sqrt(hash(k, 4)) * r * 0.5; ball(ctx, cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.62 + lift - r * 0.06, r * 0.13, col, false); }
    ring(ctx, b, on, S);
  },
  pad(ctx, S, b, col, on) { // an ink pad
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; backing(ctx, b, '#14100c', 0.5);
    ctx.fillStyle = '#6a4423'; roundRectPath(ctx, cx - r * 0.82, cy - r * 0.6 + lift, r * 1.64, r * 1.2, 6); ctx.fill();
    ctx.fillStyle = shade(col, -0.2); roundRectPath(ctx, cx - r * 0.7, cy - r * 0.48 + lift, r * 1.4, r * 0.96, 4); ctx.fill();
    const g = ctx.createLinearGradient(cx, cy - r * 0.5 + lift, cx, cy + r * 0.5 + lift); g.addColorStop(0, shade(col, 0.3)); g.addColorStop(1, col); ctx.fillStyle = g; roundRectPath(ctx, cx - r * 0.66, cy - r * 0.44 + lift, r * 1.32, r * 0.88, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(cx - r * 0.5, cy - r * 0.3 + lift, r * 0.6, r * 0.1);
    ring(ctx, b, on, S);
  },
  cone(ctx, S, b, col, on) { // a piping cone of paste, tip down
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; backing(ctx, b, '#1a1109', 0.5);
    ctx.save(); ctx.translate(cx, cy + lift); ctx.rotate(0.6);
    const g = ctx.createLinearGradient(-r * 0.5, 0, r * 0.5, 0); g.addColorStop(0, shade(col, 0.3)); g.addColorStop(0.6, col); g.addColorStop(1, shade(col, -0.4));
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; poly(ctx, [[-r * 0.46 + 2, -r * 0.8 + 3], [r * 0.46 + 2, -r * 0.8 + 3], [2, r * 0.8 + 3]]); ctx.fill();
    ctx.fillStyle = g; poly(ctx, [[-r * 0.46, -r * 0.8], [r * 0.46, -r * 0.8], [0, r * 0.8]]); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-r * 0.2, -r * 0.7); ctx.lineTo(-r * 0.04, r * 0.6); ctx.stroke();
    ctx.restore(); ring(ctx, b, on, S);
  },
  ball(ctx, S, b, col, on) { // a ball of wool wound with crossing strands
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; backing(ctx, b, '#14100c', 0.5);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(cx + 2, cy + r * 0.62 + lift, r * 0.7, r * 0.2, 0, 0, TAU); ctx.fill();
    const R = r * 0.62; const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4 + lift, R * 0.1, cx, cy + lift, R); g.addColorStop(0, shade(col, 0.45)); g.addColorStop(0.6, col); g.addColorStop(1, shade(col, -0.45));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy + lift, R, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy + lift, R, 0, TAU); ctx.clip(); ctx.strokeStyle = rgba(shade(col, -0.45), 0.5); ctx.lineWidth = 1.3;
    for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.ellipse(cx, cy + lift, R * (0.5 + hash(k, 1) * 0.6), R * (0.25 + hash(k, 2) * 0.5), hash(k, 3) * 3, 0, TAU); ctx.stroke(); }
    ctx.restore(); ring(ctx, b, on, S);
  },
  card(ctx, S, b, col, on) { // a floss card wound with thread
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; backing(ctx, b, '#14100c', 0.5);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; roundRectPath(ctx, cx - r * 0.5 + 2, cy - r * 0.8 + 3 + lift, r, r * 1.6, 3); ctx.fill();
    ctx.fillStyle = '#efe6cf'; roundRectPath(ctx, cx - r * 0.5, cy - r * 0.8 + lift, r, r * 1.6, 3); ctx.fill();
    for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? col : shade(col, -0.18); ctx.fillRect(cx - r * 0.5, cy - r * 0.55 + lift + k * r * 0.14, r, r * 0.14 + 0.5); }
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(cx - r * 0.5, cy - r * 0.55 + lift, r * 0.28, r * 1.1);
    ctx.fillStyle = 'rgba(80,60,30,0.7)'; ctx.fillRect(cx - r * 0.3, cy - r * 0.72 + lift, r * 0.6, r * 0.1);
    ring(ctx, b, on, S);
  },
  basket(ctx, S, b, col, on) { // a basket of skeins
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; backing(ctx, b, '#14100c', 0.5);
    for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? col : shade(col, -0.2); ctx.beginPath(); ctx.ellipse(cx + (k - 2) * r * 0.2, cy - r * 0.1 + lift, r * 0.22, r * 0.5, (k - 2) * 0.25, 0, TAU); ctx.fill(); }
    const g = ctx.createLinearGradient(cx - r, 0, cx + r, 0); g.addColorStop(0, '#d9b070'); g.addColorStop(0.5, '#a98040'); g.addColorStop(1, '#6a4a22');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - r * 0.8, cy + lift); ctx.lineTo(cx + r * 0.8, cy + lift); ctx.lineTo(cx + r * 0.6, cy + r * 0.7 + lift); ctx.lineTo(cx - r * 0.6, cy + r * 0.7 + lift); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(60,35,10,0.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let k = 1; k < 4; k++) { ctx.moveTo(cx - r * 0.78 + k * r * 0.02, cy + lift + k * r * 0.17); ctx.lineTo(cx + r * 0.78 - k * r * 0.02, cy + lift + k * r * 0.17); } ctx.stroke();
    ring(ctx, b, on, S);
  },
  sticks(ctx, S, b, col, on) { // a bundle of thin cut sticks
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; backing(ctx, b, '#14100c', 0.5);
    for (let k = 0; k < 9; k++) { const a = -0.5 + k * 0.12, x0 = cx - r * 0.5 + k * r * 0.1; rod(ctx, x0, cy + r * 0.7 + lift, x0 + Math.sin(a) * r * 1.2, cy - r * 0.6 + lift, Math.max(2.5, r * 0.12), shade(col, (k % 3 - 1) * 0.1), 'butt'); }
    ctx.fillStyle = '#c04a2a'; ctx.fillRect(cx - r * 0.55, cy + r * 0.05 + lift, r * 1.1, r * 0.14);
    ring(ctx, b, on, S);
  },
  feather(ctx, S, b, col, on) { // a pigment dish with a quill
    POT.pot(ctx, S, b, col, on);
  },
  cakes(ctx, S, b, col, on) { // a pan of cake pigment
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; backing(ctx, b, '#1a1109', 0.5);
    ctx.fillStyle = '#c9c3b6'; roundRectPath(ctx, cx - r * 0.8, cy - r * 0.6 + lift, r * 1.6, r * 1.2, 5); ctx.fill();
    const g = ctx.createLinearGradient(cx, cy - r * 0.5 + lift, cx, cy + r * 0.5 + lift); g.addColorStop(0, shade(col, 0.3)); g.addColorStop(1, shade(col, -0.25)); ctx.fillStyle = g; roundRectPath(ctx, cx - r * 0.66, cy - r * 0.46 + lift, r * 1.32, r * 0.92, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(cx - r * 0.5, cy - r * 0.32 + lift, r * 0.5, r * 0.08);
    ring(ctx, b, on, S);
  },
};

// ---- shared cell skins: shape-filling techniques --------------------------------------------------------------------------------
// d = { kind, col, x, y, s, key, bg }. Each skin draws the stamp `kind` of size s centred at (x, y) in the craft's own technique.
const clipShape = (ctx, d) => { motifPath(ctx, d.kind, d.x, d.y, d.s); ctx.save(); ctx.clip(); };
export const SKIN = {
  // parallel threads laid one by one (supplementary weft, satin stitch, darning): filled shapes are packed with threads, lines are couched cords
  threads(ctx, d, o = {}) {
    const { kind, col, x, y, s, key } = d, h = s / 2, fill = isFilled(kind), lw = lineWidthOf(kind, s);
    if (kind === 'knot') return drawStamp(ctx, 'weave', kind, x, y, s, col, key, d.bg);
    if (!fill) { ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = lw + 2; ctx.translate(s * 0.02, s * 0.03); ctx.stroke(); ctx.translate(-s * 0.02, -s * 0.03); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); ctx.strokeStyle = shade(col, 0.55); ctx.globalAlpha = 0.7; ctx.lineWidth = lw * 0.25; ctx.translate(-lw * 0.16, -lw * 0.16); motifPath(ctx, kind, x, y, s); ctx.stroke(); ctx.restore(); return; }
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.fillStyle = shade(col, -0.45); ctx.fill(); ctx.clip();
    const n = o.n ?? 7, p = s / n, dir = o.dir ?? 'h', dk = shade(col, -0.35), lt = shade(col, o.lt ?? 0.5);
    for (let i = 0; i <= n; i++) {
      const t = -h + i * p, sh = hash(key, i) * 0.14 - 0.07;
      ctx.lineCap = 'round'; ctx.lineWidth = p * 0.92; ctx.strokeStyle = shade(col, sh); ctx.beginPath();
      if (dir === 'h') { ctx.moveTo(x - h - 2, y + t + p / 2); ctx.lineTo(x + h + 2, y + t + p / 2); } else if (dir === 'v') { ctx.moveTo(x + t + p / 2, y - h - 2); ctx.lineTo(x + t + p / 2, y + h + 2); } else { ctx.moveTo(x - h + t - h, y - h - 2); ctx.lineTo(x + h + t + h * 0.0, y + h + 2); }
      ctx.stroke();
      ctx.lineWidth = p * 0.26; ctx.strokeStyle = lt; ctx.globalAlpha = 0.6; ctx.beginPath();
      if (dir === 'h') { ctx.moveTo(x - h, y + t + p * 0.3); ctx.lineTo(x + h, y + t + p * 0.3); } else { ctx.moveTo(x + t + p * 0.3, y - h); ctx.lineTo(x + t + p * 0.3, y + h); }
      ctx.stroke(); ctx.globalAlpha = 1;
      ctx.lineWidth = Math.max(0.7, p * 0.1); ctx.strokeStyle = dk; ctx.beginPath();
      if (dir === 'h') { ctx.moveTo(x - h, y + t + p); ctx.lineTo(x + h, y + t + p); } else { ctx.moveTo(x + t + p, y - h); ctx.lineTo(x + t + p, y + h); }
      ctx.stroke();
    }
    ctx.restore();
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.strokeStyle = rgba(dk, 0.7); ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke(); ctx.restore();
  },
  // cross stitches (X) on a counted fabric
  cross(ctx, d, o = {}) {
    const { kind, col, x, y, s, key } = d, h = s / 2, fill = isFilled(kind), lw = lineWidthOf(kind, s);
    const n = o.n ?? 4, p = s / n, w = Math.max(1.4, p * (o.w ?? 0.3));
    const X = (cx, cy, c) => {
      ctx.lineCap = 'round'; const q = p * 0.42;
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = w + 1; ctx.beginPath(); ctx.moveTo(cx - q + 0.8, cy - q + 1.2); ctx.lineTo(cx + q + 0.8, cy + q + 1.2); ctx.stroke();
      ctx.strokeStyle = shade(c, -0.12); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(cx - q, cy - q); ctx.lineTo(cx + q, cy + q); ctx.stroke();
      ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(cx + q, cy - q); ctx.lineTo(cx - q, cy + q); ctx.stroke();
      ctx.strokeStyle = shade(c, 0.5); ctx.globalAlpha = 0.55; ctx.lineWidth = w * 0.3; ctx.beginPath(); ctx.moveTo(cx + q, cy - q); ctx.lineTo(cx - q, cy + q); ctx.stroke(); ctx.globalAlpha = 1;
    };
    if (fill) {
      // stitch every sub-cell whose centre lies inside the shape
      ctx.save(); motifPath(ctx, kind, x, y, s); ctx.clip();
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) X(x - h + (i + 0.5) * p, y - h + (j + 0.5) * p, col);
      ctx.restore();
    } else {
      ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.setLineDash([p * 0.55, p * 0.45]); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = lw * 0.9 + 1; ctx.translate(0.8, 1.2); ctx.stroke(); ctx.translate(-0.8, -1.2);
      ctx.strokeStyle = col; ctx.lineWidth = lw * 0.9; ctx.stroke(); ctx.strokeStyle = shade(col, 0.5); ctx.globalAlpha = 0.5; ctx.lineWidth = lw * 0.25; ctx.translate(-lw * 0.12, -lw * 0.12); ctx.stroke(); ctx.restore();
    }
    void key;
  },
  // running stitch: dashed thread following outlines, parallel rows inside filled shapes
  running(ctx, d, o = {}) {
    const { kind, col, x, y, s } = d, h = s / 2, fill = isFilled(kind), lw = Math.max(2, s * (o.w ?? 0.075));
    const dash = [s * 0.14, s * 0.07];
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash(dash);
    const stroke = () => { ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = lw + 1; ctx.save(); ctx.translate(0.8, 1.2); ctx.stroke(); ctx.restore(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); ctx.strokeStyle = shade(col, 0.5); ctx.globalAlpha = 0.6; ctx.lineWidth = lw * 0.3; ctx.save(); ctx.translate(-lw * 0.15, -lw * 0.15); ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1; };
    if (fill) {
      motifPath(ctx, kind, x, y, s); stroke();
      ctx.save(); motifPath(ctx, kind, x, y, s); ctx.clip(); ctx.beginPath();
      const n = 4; for (let i = 1; i < n; i++) { const yy = y - h + (s * i) / n; ctx.moveTo(x - h, yy); ctx.lineTo(x + h, yy); }
      stroke(); ctx.restore();
    } else { motifPath(ctx, kind, x, y, s); stroke(); }
    ctx.restore();
  },
  // beads: glass beads packed into the shape; lines are strings of beads
  beads(ctx, d, o = {}) {
    const { kind, col, x, y, s } = d, h = s / 2, fill = isFilled(kind), r = s * (o.r ?? 0.085), pitch = r * 2.05;
    if (!fill) {
      const lw = Math.max(r * 1.9, lineWidthOf(kind, s) * 0.9);
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; motifPath(ctx, kind, x, y, s); ctx.setLineDash([0.01, pitch * 0.98]);
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = lw + 1.5; ctx.save(); ctx.translate(0.8, 1.2); ctx.stroke(); ctx.restore();
      ctx.strokeStyle = shade(col, -0.35); ctx.lineWidth = lw; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw * 0.78; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = lw * 0.2; ctx.save(); ctx.translate(-lw * 0.18, -lw * 0.2); ctx.stroke(); ctx.restore(); ctx.restore(); return;
    }
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.fillStyle = shade(col, -0.6); ctx.fill(); ctx.clip();
    const pts = []; const cols = Math.ceil(s / pitch) + 1;
    for (let j = 0; j < cols; j++) for (let i = 0; i < cols; i++) pts.push([x - h + (i + (j % 2) * 0.5) * pitch, y - h + j * pitch * 0.93]);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); for (const [bx2, by] of pts) { ctx.moveTo(bx2 + r + 0.6, by + 0.9); ctx.arc(bx2 + 0.6, by + 0.9, r, 0, TAU); } ctx.fill();
    ctx.fillStyle = shade(col, -0.3); ctx.beginPath(); for (const [bx2, by] of pts) { ctx.moveTo(bx2 + r, by); ctx.arc(bx2, by, r, 0, TAU); } ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); for (const [bx2, by] of pts) { ctx.moveTo(bx2 + r * 0.78 - r * 0.1, by - r * 0.1); ctx.arc(bx2 - r * 0.1, by - r * 0.1, r * 0.78, 0, TAU); } ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); for (const [bx2, by] of pts) { ctx.moveTo(bx2 - r * 0.3 + r * 0.2, by - r * 0.38); ctx.arc(bx2 - r * 0.3, by - r * 0.38, r * 0.2, 0, TAU); } ctx.fill();
    ctx.restore();
  },
  // cut and glazed tile: bevelled glaze with a grout line around it
  tile(ctx, d, o = {}) {
    const { kind, col, x, y, s } = d, h = s / 2, fill = isFilled(kind), lw = lineWidthOf(kind, s);
    const grout = o.grout ?? 'rgba(20,16,10,0.65)';
    if (!fill) { ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = grout; ctx.lineWidth = lw + s * 0.07; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = lw * 0.22; ctx.translate(-lw * 0.15, -lw * 0.18); ctx.stroke(); ctx.restore(); return; }
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.strokeStyle = grout; ctx.lineWidth = s * 0.1; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
    ctx.save(); motifPath(ctx, kind, x, y, s);
    const g = ctx.createLinearGradient(x - h, y - h, x + h, y + h); g.addColorStop(0, shade(col, o.hi ?? 0.35)); g.addColorStop(0.55, col); g.addColorStop(1, shade(col, -0.35));
    ctx.fillStyle = g; ctx.fill(); ctx.clip();
    motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = s * 0.07; ctx.stroke();
    ctx.save(); ctx.translate(-s * 0.03, -s * 0.03); motifPath(ctx, kind, x, y, s); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = s * 0.035; ctx.stroke(); ctx.restore();
    const gl = ctx.createLinearGradient(x - h, y - h, x, y + h * 0.4); gl.addColorStop(0, 'rgba(255,255,255,0.38)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.fillRect(x - h, y - h, s, s);
    ctx.restore();
  },
  // small irregular stones or tesserae set side by side (calçada, mosaic)
  cobble(ctx, d, o = {}) {
    const { kind, col, x, y, s, key } = d, h = s / 2, fill = isFilled(kind), n = o.n ?? 4, p = s / n, lw = lineWidthOf(kind, s);
    const pieces = (pts) => {
      ctx.fillStyle = o.joint ?? 'rgba(20,16,12,0.7)'; ctx.beginPath(); for (const [px, py, w] of pts) ctx.rect(px - w * 0.5 - p * 0.06, py - w * 0.5 - p * 0.06, w + p * 0.12, w + p * 0.12); ctx.fill();
      for (let i = 0; i < pts.length; i++) { const [px, py, w, k] = pts[i]; const c = shade(col, (hash(key, k) - 0.5) * (o.v ?? 0.22)); ctx.fillStyle = c; ctx.beginPath(); ctx.rect(px - w / 2, py - w / 2, w, w); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(px - w / 2, py - w / 2, w, Math.max(1, p * 0.1)); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(px - w / 2, py + w / 2 - Math.max(1, p * 0.1), w, Math.max(1, p * 0.1)); }
    };
    ctx.save();
    if (fill) {
      motifPath(ctx, kind, x, y, s); ctx.fillStyle = 'rgba(20,16,12,0.7)'; ctx.fill(); ctx.clip();
      const pts = []; for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) pts.push([x - h + (i + (hash(key, j * 9 + i) - 0.5) * 0.3) * p, y - h + (j + (hash(key, j * 7 + i + 50) - 0.5) * 0.3) * p, p * 0.86, j * 11 + i]);
      pieces(pts);
    } else {
      motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(20,16,12,0.7)'; ctx.lineWidth = lw + p * 0.3; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash([p * 0.8, p * 0.14]); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = lw * 0.2; ctx.translate(-lw * 0.15, -lw * 0.18); ctx.stroke();
    }
    ctx.restore();
  },
  // knitted fabric: rows of V stitches
  knit(ctx, d, o = {}) {
    const { kind, col, x, y, s } = d, h = s / 2, fill = isFilled(kind);
    const n = o.n ?? 5, p = s / n;
    const V = (cx, cy, c) => { const q = p * 0.5; ctx.beginPath(); ctx.moveTo(cx - q, cy - q * 0.9); ctx.lineTo(cx, cy + q * 0.8); ctx.lineTo(cx + q, cy - q * 0.9); ctx.lineWidth = p * 0.42; ctx.strokeStyle = shade(c, -0.3); ctx.stroke(); ctx.lineWidth = p * 0.3; ctx.strokeStyle = c; ctx.stroke(); ctx.lineWidth = p * 0.08; ctx.strokeStyle = shade(c, 0.5); ctx.save(); ctx.translate(-p * 0.04, -p * 0.07); ctx.stroke(); ctx.restore(); };
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (fill) { motifPath(ctx, kind, x, y, s); ctx.fillStyle = shade(col, -0.4); ctx.fill(); ctx.clip(); for (let j = 0; j < n + 1; j++) for (let i = 0; i < n; i++) V(x - h + (i + 0.5) * p, y - h + (j + 0.5) * p, col); }
    else { motifPath(ctx, kind, x, y, s); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = p * 0.9; ctx.stroke(); ctx.strokeStyle = shade(col, -0.2); ctx.lineWidth = p * 0.62; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = p * 0.4; ctx.setLineDash([p * 0.5, p * 0.28]); ctx.stroke(); }
    ctx.restore();
  },
  // pile: rows of knots or cut tufts
  pile(ctx, d, o = {}) {
    const { kind, col, x, y, s, key } = d, h = s / 2, fill = isFilled(kind), n = o.n ?? 6, p = s / n;
    ctx.save(); ctx.lineCap = 'butt';
    const rows = (cx, cy, w, hh) => { for (let j = 0; j < n + 1; j++) { const yy = cy - hh + j * p; ctx.beginPath(); ctx.moveTo(cx - w, yy + p / 2); ctx.lineTo(cx + w, yy + p / 2); ctx.setLineDash([p * 0.86, p * 0.14]); ctx.lineDashOffset = (j % 2) * p * 0.5; ctx.lineWidth = p * 0.92; ctx.strokeStyle = shade(col, (hash(key, j) - 0.5) * 0.18 + (j % 2 ? -0.06 : 0.04)); ctx.stroke(); } ctx.setLineDash([]); };
    if (fill) { motifPath(ctx, kind, x, y, s); ctx.fillStyle = shade(col, -0.4); ctx.fill(); ctx.clip(); rows(x, y, h + 2, h); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(x - h, y - h, s, p * 0.6); motifPath(ctx, kind, x, y, s); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = s * 0.04; ctx.stroke(); }
    else { motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = lineWidthOf(kind, s) + 2; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lineWidthOf(kind, s); ctx.setLineDash([p * 0.8, p * 0.2]); ctx.stroke(); }
    ctx.restore();
  },
  // dye / wax resist: a pooled edge with fine crackle veins
  wax(ctx, d, o = {}) {
    const { kind, col, x, y, s, key } = d, h = s / 2, fill = isFilled(kind), lw = lineWidthOf(kind, s);
    const wc = o.wax ?? '#f0e2b0';
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (fill) {
      motifPath(ctx, kind, x, y, s); ctx.strokeStyle = rgba(col, 0.2); ctx.lineWidth = s * 0.16; ctx.stroke(); ctx.fillStyle = col; ctx.globalAlpha = 0.95; ctx.fill(); ctx.globalAlpha = 1;
      ctx.save(); motifPath(ctx, kind, x, y, s); ctx.clip(); ctx.strokeStyle = rgba(shade(col, -0.55), 0.55); ctx.lineWidth = Math.max(0.8, s * 0.014); ctx.beginPath();
      for (let i = 0; i < 6; i++) { let px = x - h + hash(key, i) * s, py = y - h + hash(key, i + 9) * s; ctx.moveTo(px, py); for (let k = 0; k < 3; k++) { px += (hash(key, i, k + 3) - 0.5) * s * 0.4; py += (hash(key, i, k + 7) - 0.5) * s * 0.4; ctx.lineTo(px, py); } }
      ctx.stroke(); ctx.restore();
      motifPath(ctx, kind, x, y, s); ctx.strokeStyle = wc; ctx.lineWidth = Math.max(2, s * 0.045); ctx.stroke(); ctx.strokeStyle = rgba('#fff', 0.5); ctx.lineWidth = Math.max(1, s * 0.012); ctx.save(); ctx.translate(-s * 0.012, -s * 0.014); ctx.stroke(); ctx.restore();
    } else {
      motifPath(ctx, kind, x, y, s); ctx.strokeStyle = rgba(col, 0.3); ctx.lineWidth = lw * 1.9; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); ctx.strokeStyle = wc; ctx.lineWidth = Math.max(1.2, lw * 0.28); ctx.stroke();
    }
    ctx.restore();
  },
  // flat paint with a hard painted outline (wall paint, enamel)
  outline(ctx, d, o = {}) {
    const { kind, col, x, y, s } = d, fill = isFilled(kind), lw = lineWidthOf(kind, s), oc = o.line ?? '#111';
    ctx.save(); ctx.lineJoin = o.round ? 'round' : 'miter'; ctx.lineCap = 'round';
    if (fill) {
      motifPath(ctx, kind, x, y, s); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = s * 0.09; ctx.save(); ctx.translate(s * 0.02, s * 0.03); ctx.stroke(); ctx.restore();
      ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = oc; ctx.lineWidth = Math.max(2, s * (o.lw ?? 0.06)); ctx.stroke();
      if (o.gloss) { ctx.save(); motifPath(ctx, kind, x, y, s); ctx.clip(); const g = ctx.createLinearGradient(x - s / 2, y - s / 2, x + s * 0.1, y + s * 0.5); g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(0.5, 'rgba(255,255,255,0.08)'); g.addColorStop(1, 'rgba(0,0,0,0.18)'); ctx.fillStyle = g; ctx.fillRect(x - s / 2, y - s / 2, s, s); ctx.restore(); }
    } else { motifPath(ctx, kind, x, y, s); ctx.strokeStyle = oc; ctx.lineWidth = lw + Math.max(2, s * 0.05); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); if (o.gloss) { ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = lw * 0.22; ctx.translate(-lw * 0.15, -lw * 0.18); ctx.stroke(); } }
    ctx.restore();
  },
  // brush or stick paint with drag marks (mud, rice paste, lacquer)
  brushed(ctx, d, o = {}) {
    const { kind, col, x, y, s, key } = d, h = s / 2, fill = isFilled(kind), lw = lineWidthOf(kind, s);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (fill) {
      motifPath(ctx, kind, x, y, s); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = s * 0.05; ctx.save(); ctx.translate(s * 0.015, s * 0.025); ctx.stroke(); ctx.restore(); ctx.fillStyle = col; ctx.fill();
      ctx.save(); motifPath(ctx, kind, x, y, s); ctx.clip(); ctx.lineWidth = Math.max(1, s * 0.03); ctx.beginPath();
      for (let i = 0; i < 9; i++) { const yy = y - h + (i + hash(key, i)) * s / 9; ctx.moveTo(x - h, yy); ctx.quadraticCurveTo(x, yy + (hash(key, i + 5) - 0.5) * s * 0.1, x + h, yy + (hash(key, i + 11) - 0.5) * s * 0.08); }
      ctx.strokeStyle = rgba(shade(col, o.streak ?? -0.3), 0.35); ctx.stroke(); ctx.translate(0, s * 0.02); ctx.strokeStyle = rgba(shade(col, 0.5), 0.25); ctx.stroke();
      if (o.crack) { ctx.beginPath(); for (let i = 0; i < 5; i++) { let px = x - h + hash(key, i + 30) * s, py = y - h + hash(key, i + 40) * s; ctx.moveTo(px, py); for (let k = 0; k < 3; k++) { px += (hash(key, i, k + 3) - 0.5) * s * 0.35; py += (hash(key, i, k + 9) - 0.5) * s * 0.35; ctx.lineTo(px, py); } } ctx.strokeStyle = rgba('#000', 0.35); ctx.lineWidth = 1; ctx.stroke(); }
      ctx.restore();
      motifPath(ctx, kind, x, y, s); ctx.strokeStyle = rgba(shade(col, -0.45), 0.5); ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke();
    } else {
      motifPath(ctx, kind, x, y, s); ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = lw + 2; ctx.save(); ctx.translate(lw * 0.1, lw * 0.18); ctx.stroke(); ctx.restore(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
      ctx.strokeStyle = rgba(shade(col, 0.5), 0.5); ctx.lineWidth = lw * 0.22; ctx.save(); ctx.translate(-lw * 0.14, -lw * 0.16); ctx.stroke(); ctx.restore();
    }
    ctx.restore();
  },
  // a thick wet bead of paste or syrup (henna, sugar)
  paste(ctx, d, o = {}) {
    const { kind, col, x, y, s } = d, fill = isFilled(kind), lw = lineWidthOf(kind, s) * (o.k ?? 0.8);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (fill) {
      motifPath(ctx, kind, x, y, s); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = s * 0.05; ctx.save(); ctx.translate(s * 0.012, s * 0.02); ctx.stroke(); ctx.restore();
      ctx.fillStyle = o.alpha ? rgba(col, o.alpha) : col; ctx.fill(); ctx.strokeStyle = shade(col, -0.35); ctx.lineWidth = Math.max(1.2, s * 0.04); ctx.stroke();
      ctx.save(); motifPath(ctx, kind, x, y, s); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = Math.max(1.5, s * 0.06); ctx.translate(-s * 0.05, -s * 0.06); motifPath(ctx, kind, x, y, s); ctx.stroke(); ctx.restore();
    } else {
      motifPath(ctx, kind, x, y, s); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = lw + 2; ctx.save(); ctx.translate(lw * 0.1, lw * 0.2); ctx.stroke(); ctx.restore();
      ctx.strokeStyle = shade(col, -0.3); ctx.lineWidth = lw; ctx.stroke(); ctx.strokeStyle = o.alpha ? rgba(col, o.alpha) : col; ctx.lineWidth = lw * 0.78; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = lw * 0.2; ctx.save(); ctx.translate(-lw * 0.16, -lw * 0.2); ctx.stroke(); ctx.restore();
    }
    ctx.restore();
  },
  // inked or printed: mottled solid with unprinted flecks and a slightly squashed edge
  stamp(ctx, d, o = {}) {
    const { kind, col, x, y, s, key } = d, h = s / 2, fill = isFilled(kind), lw = lineWidthOf(kind, s);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const ox = (hash(key, 1) - 0.5) * s * 0.05, oy = (hash(key, 2) - 0.5) * s * 0.05;
    ctx.translate(ox, oy);
    if (fill) {
      motifPath(ctx, kind, x, y, s); ctx.strokeStyle = rgba(col, 0.35); ctx.lineWidth = s * 0.05; ctx.stroke(); ctx.fillStyle = col; ctx.fill();
      ctx.save(); motifPath(ctx, kind, x, y, s); ctx.clip(); ctx.fillStyle = o.fleck ?? d.bg; ctx.globalAlpha = 0.45; ctx.beginPath();
      for (let i = 0; i < 14; i++) { const px = x + (hash(key, i) - 0.5) * s, py = y + (hash(key, i + 7) - 0.5) * s, r = Math.max(0.7, s * 0.02 * (1 + hash(key, i + 3))); ctx.moveTo(px + r, py); ctx.arc(px, py, r, 0, TAU); }
      ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = rgba(shade(col, -0.5), 0.5); ctx.lineWidth = s * 0.05; motifPath(ctx, kind, x, y, s); ctx.stroke(); ctx.restore();
    } else { motifPath(ctx, kind, x, y, s); ctx.strokeStyle = rgba(col, 0.35); ctx.lineWidth = lw + 3; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); }
    ctx.restore(); void h;
  },
  // wood: inlaid or turned pieces with grain
  wood(ctx, d, o = {}) {
    const { kind, col, x, y, s, key } = d, h = s / 2, fill = isFilled(kind), lw = lineWidthOf(kind, s);
    ctx.save(); ctx.lineCap = o.cap ?? 'butt'; ctx.lineJoin = 'miter';
    if (fill) {
      motifPath(ctx, kind, x, y, s); ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = s * 0.08; ctx.save(); ctx.translate(s * 0.025, s * 0.035); ctx.stroke(); ctx.restore();
      ctx.fillStyle = col; ctx.fill(); ctx.save(); motifPath(ctx, kind, x, y, s); ctx.clip(); ctx.beginPath();
      const p = Math.max(2, s * 0.07); for (let k = -1; k < s / p + 1; k++) { const yy = y - h + k * p; ctx.moveTo(x - h, yy); ctx.bezierCurveTo(x - h * 0.3, yy + (hash(key, k) - 0.5) * p * 1.6, x + h * 0.3, yy - (hash(key, k + 11) - 0.5) * p * 1.6, x + h, yy + (hash(key, k + 5) - 0.5) * p); }
      ctx.lineWidth = Math.max(0.7, p * 0.16); ctx.strokeStyle = rgba(shade(col, -0.5), 0.35); ctx.stroke();
      ctx.restore(); motifPath(ctx, kind, x, y, s); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = Math.max(1, s * 0.025); ctx.save(); ctx.translate(-s * 0.02, -s * 0.02); ctx.stroke(); ctx.restore();
      ctx.strokeStyle = rgba('#000', 0.5); ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke();
    } else {
      motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = lw + 3; ctx.save(); ctx.translate(lw * 0.14, lw * 0.2); ctx.stroke(); ctx.restore();
      ctx.strokeStyle = shade(col, -0.35); ctx.lineWidth = lw + 1; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); ctx.strokeStyle = shade(col, 0.5); ctx.lineWidth = lw * 0.25; ctx.save(); ctx.translate(-lw * 0.16, -lw * 0.2); ctx.stroke(); ctx.restore();
    }
    ctx.restore();
  },
  // powder / flour / sugar drawn as a spill of grains
  grain(ctx, d, o = {}) {
    const { kind, col, x, y, s, key } = d, fill = isFilled(kind), lw = lineWidthOf(kind, s);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    motifPath(ctx, kind, x, y, s); ctx.strokeStyle = rgba(col, 0.22); ctx.lineWidth = (fill ? s * 0.14 : lw * 1.9); ctx.stroke();
    if (fill) { ctx.fillStyle = rgba(col, 0.92); ctx.fill(); ctx.strokeStyle = rgba(col, 0.6); ctx.lineWidth = s * 0.05; ctx.stroke(); } else { ctx.strokeStyle = rgba(col, 0.9); ctx.lineWidth = lw * 0.9; ctx.stroke(); }
    ctx.fillStyle = shade(col, 0.5); ctx.globalAlpha = 0.6; ctx.beginPath(); for (let i = 0; i < 12; i++) { const a = hash(key, i) * TAU, r = s * (0.05 + 0.42 * hash(key, i + 20)); ctx.rect(x + Math.cos(a) * r, y + Math.sin(a) * r, 1.6, 1.6); } ctx.fill();
    ctx.fillStyle = col; ctx.globalAlpha = 0.8; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = hash(key, i + 40) * TAU, r = s * (0.4 + 0.25 * hash(key, i + 60)); ctx.rect(x + Math.cos(a) * r, y + Math.sin(a) * r, 1.8, 1.8); } ctx.fill();
    ctx.restore(); void o;
  },
};

// ---- placement feedback (age 0..1 over about 0.6 s) -----------------------------------------------------------------------------
export const FX = {
  puff(ctx, S, d, age) { const u = age; ctx.fillStyle = rgba(shade(d.col, 0.5), 0.8 * (1 - u)); for (let k = 0; k < 8; k++) { const a = hash(d.i, k) * TAU + u, r = d.s * (0.2 + 0.55 * u * (0.5 + hash(d.i, k + 9))); ctx.fillRect(d.x + Math.cos(a) * r - 1, d.y + Math.sin(a) * r - 1 - u * d.s * 0.15, 2.4, 2.4); } },
  ring(ctx, S, d, age) { ctx.strokeStyle = rgba(d.col, 0.55 * (1 - age)); ctx.lineWidth = Math.max(1, d.s * 0.07 * (1 - age)); ctx.beginPath(); ctx.arc(d.x, d.y, d.s * (0.3 + 0.45 * Math.sqrt(age)), 0, TAU); ctx.stroke(); },
  thread(ctx, S, d, age) { // a glint running along the new thread, then a loose tail snapping tight
    const u = Math.min(1, age * 1.6), gx = d.x - d.s / 2 + d.s * u;
    ctx.save(); ctx.globalAlpha = (1 - age) * 0.9; const g = ctx.createLinearGradient(gx - d.s * 0.2, 0, gx + d.s * 0.2, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,248,210,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(gx - d.s * 0.2, d.y - d.s * 0.4, d.s * 0.4, d.s * 0.8); ctx.restore();
    FX.ring(ctx, S, d, age);
  },
  wax(ctx, S, d, age) { // a drip of hot wax falling from the pen and spreading
    const u = age; ctx.fillStyle = rgba('#fff3cc', 0.9 * (1 - u * u)); const dy = -d.s * 0.5 + d.s * 0.55 * Math.min(1, u * 2.2);
    ctx.beginPath(); ctx.ellipse(d.x + d.s * 0.12, d.y + dy, d.s * 0.04, d.s * 0.07, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba('#fff3cc', 0.6 * (1 - u)); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(d.x + d.s * 0.12, d.y + d.s * 0.06, d.s * (0.05 + 0.22 * u), 0, TAU); ctx.stroke();
  },
  stamp(ctx, S, d, age) { // the block presses: a squashed ink halo
    const u = age; ctx.strokeStyle = rgba(d.col, 0.5 * (1 - u)); ctx.lineWidth = d.s * 0.09 * (1 - u); ctx.strokeRect(d.x - d.s * (0.5 + 0.12 * u), d.y - d.s * (0.5 + 0.12 * u), d.s * (1 + 0.24 * u), d.s * (1 + 0.24 * u));
  },
  tile(ctx, S, d, age) { // a tap with the hammer: a flash and a ring of dust
    const u = age; ctx.fillStyle = rgba('#fff', 0.5 * Math.max(0, 1 - u * 4)); ctx.beginPath(); ctx.arc(d.x, d.y, d.s * 0.5, 0, TAU); ctx.fill(); FX.puff(ctx, S, d, age);
  },
  paint(ctx, S, d, age) { // a wet sheen drying
    ctx.save(); ctx.globalAlpha = 0.5 * (1 - age); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(d.x - d.s * 0.12, d.y - d.s * 0.14, d.s * 0.26, d.s * 0.09, -0.5, 0, TAU); ctx.fill(); ctx.restore();
  },
  drop(ctx, S, d, age) { // a bead of liquid falls from the tool and spreads
    const u = age; ctx.fillStyle = rgba(shade(d.col, 0.3), 0.9 * (1 - u)); const dy = -d.s * 0.6 + d.s * 0.6 * Math.min(1, u * 2.4);
    ctx.beginPath(); ctx.ellipse(d.x, d.y + dy, d.s * 0.035, d.s * 0.06, 0, 0, TAU); ctx.fill(); FX.ring(ctx, S, d, age);
  },
  rake(ctx, S, d, age) { // gravel lines drawn in by the rake teeth
    const u = Math.min(1, age * 1.7); ctx.save(); ctx.globalAlpha = 1 - age; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let k = -2; k <= 2; k++) { ctx.moveTo(d.x - d.s * 0.5, d.y + k * d.s * 0.12); ctx.lineTo(d.x - d.s * 0.5 + d.s * u, d.y + k * d.s * 0.12); } ctx.stroke(); ctx.restore();
    FX.puff(ctx, S, d, age);
  },
  sparkle(ctx, S, d, age) { const u = Math.sin(Math.PI * Math.min(1, age * 1.3)); const r = d.s * 0.35 * u; ctx.save(); ctx.fillStyle = rgba('#fff6d0', 0.9); ctx.translate(d.x - d.s * 0.1, d.y - d.s * 0.12); ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, rad = i % 2 ? r * 0.2 : r; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); } ctx.closePath(); ctx.fill(); ctx.restore(); },
};

// ---- sounds: small synthesised responses, tuned per craft --------------------------------------------------------------------------
export const SND = {
  default: { paint: (t, c) => { t({ freq: 210 + c * 26, to: 120, dur: 0.1, type: 'triangle', vol: 0.16 }); t({ freq: 880 + c * 90, dur: 0.035, type: 'sine', vol: 0.04 }); } },
  thread: { paint: (t, c) => { t({ freq: 1500 + c * 120, to: 700, dur: 0.12, type: 'sine', vol: 0.05 }); t({ freq: 180, to: 110, dur: 0.07, type: 'triangle', vol: 0.12 }); } },
  wood: { paint: (t, c) => { t({ freq: 320 + c * 18, to: 190, dur: 0.06, type: 'square', vol: 0.06 }); t({ freq: 140, to: 90, dur: 0.09, type: 'triangle', vol: 0.15 }); } },
  wax: { paint: (t, c) => { t({ freq: 560 + c * 40, to: 300, dur: 0.14, type: 'sine', vol: 0.07 }); t({ freq: 90, dur: 0.05, type: 'triangle', vol: 0.08 }); } },
  stamp: { paint: (t, c) => { t({ freq: 110, to: 70, dur: 0.12, type: 'triangle', vol: 0.2 }); t({ freq: 600 + c * 30, to: 420, dur: 0.04, type: 'square', vol: 0.03 }); } },
  tile: { paint: (t, c) => { t({ freq: 1300 + c * 70, to: 1000, dur: 0.05, type: 'triangle', vol: 0.08 }); t({ freq: 260, to: 150, dur: 0.07, type: 'square', vol: 0.06 }); } },
  stone: { paint: (t, c) => { t({ freq: 190 + c * 12, to: 130, dur: 0.05, type: 'sawtooth', vol: 0.05 }); t({ freq: 90, to: 60, dur: 0.08, type: 'triangle', vol: 0.14 }); } },
  gravel: { paint: (t, c) => { for (let k = 0; k < 4; k++) t({ freq: 380 + k * 90 + c * 20, to: 260, dur: 0.035, type: 'sawtooth', vol: 0.035 }); t({ freq: 150, to: 100, dur: 0.12, type: 'triangle', vol: 0.07 }); } },
  brush: { paint: (t, c) => { t({ freq: 300 + c * 25, to: 520, dur: 0.15, type: 'sawtooth', vol: 0.03 }); t({ freq: 170, to: 130, dur: 0.07, type: 'triangle', vol: 0.08 }); } },
  bead: { paint: (t, c) => { t({ freq: 1800 + c * 140, to: 1500, dur: 0.04, type: 'sine', vol: 0.07 }); t({ freq: 1200 + c * 90, dur: 0.05, type: 'triangle', vol: 0.05 }); } },
  sugar: { paint: (t, c) => { t({ freq: 900 + c * 60, to: 1400, dur: 0.09, type: 'sine', vol: 0.06 }); t({ freq: 200, dur: 0.05, type: 'triangle', vol: 0.06 }); } },
  soft: { paint: (t, c) => { t({ freq: 260 + c * 20, to: 200, dur: 0.12, type: 'sine', vol: 0.1 }); } },
  pop: { paint: (t, c) => { t({ freq: 500 + c * 50, to: 900, dur: 0.05, type: 'sine', vol: 0.1 }); t({ freq: 150, dur: 0.05, type: 'triangle', vol: 0.08 }); } },
};

// ---- reference card skins (paper, pinned swatch, wood label ...) -------------------------------------------------------------------
export function drawCardBase(ctx, c, css, o, pal) {
  const r = 14 * css / 1.85, deco = o.deco ?? 'studs', paper = o.paper ?? '#f1e7d0', edge = o.edge ?? pal.accent;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
  if (deco === 'scroll') { roundRectPath(ctx, c.x + 10, c.y, c.w - 20, c.h, 6); } else roundRectPath(ctx, c.x, c.y, c.w, c.h, deco === 'plain' ? 4 : r);
  ctx.fillStyle = paper; ctx.fill(); ctx.restore();
  const gr = ctx.createLinearGradient(c.x, c.y, c.x, c.y + c.h); gr.addColorStop(0, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(60,40,10,0.2)');
  roundRectPath(ctx, c.x, c.y, c.w, c.h, deco === 'plain' ? 4 : r); ctx.fillStyle = gr; ctx.fill();
  if (deco === 'cloth' || deco === 'wood') { // grain / weave on the card ground
    ctx.save(); roundRectPath(ctx, c.x, c.y, c.w, c.h, r); ctx.clip();
    if (deco === 'cloth') weaveGrid(ctx, c, 5, '#000', '#fff', 0.1); else lines(ctx, c, 'h', 6, '#000', 0.14, 1.2, 3, 7);
    ctx.restore();
  }
  if (deco === 'studs' || deco === 'wood') {
    ctx.strokeStyle = rgba(edge, 0.9); ctx.lineWidth = 2.5; roundRectPath(ctx, c.x + 5, c.y + 5, c.w - 10, c.h - 10, 10 * css / 1.85); ctx.stroke();
    ctx.strokeStyle = 'rgba(80,55,20,0.35)'; ctx.lineWidth = 1; roundRectPath(ctx, c.x + 10, c.y + 10, c.w - 20, c.h - 20, 7 * css / 1.85); ctx.stroke();
    ctx.fillStyle = rgba(edge, 0.95); for (const [qx, qy] of [[c.x + 5, c.y + 5], [c.x + c.w - 5, c.y + 5], [c.x + 5, c.y + c.h - 5], [c.x + c.w - 5, c.y + c.h - 5]]) { ctx.beginPath(); ctx.arc(qx, qy, 4.5, 0, TAU); ctx.fill(); }
  } else if (deco === 'pins') {
    ctx.strokeStyle = 'rgba(80,55,20,0.3)'; ctx.lineWidth = 1; roundRectPath(ctx, c.x + 8, c.y + 8, c.w - 16, c.h - 16, 4); ctx.stroke();
    for (const [qx, qy, k] of [[c.x + 10, c.y + 10, 0], [c.x + c.w - 10, c.y + 10, 1], [c.x + 10, c.y + c.h - 10, 2], [c.x + c.w - 10, c.y + c.h - 10, 3]]) { ball(ctx, qx, qy, 6, ['#c8452d', '#2d7bd6', '#e0a82e', '#3a9a5a'][k], true); }
  } else if (deco === 'tape') {
    for (const [qx, qy, rot] of [[c.x + c.w * 0.12, c.y + 2, -0.35], [c.x + c.w * 0.88, c.y + 2, 0.35]]) { ctx.save(); ctx.translate(qx, qy); ctx.rotate(rot); ctx.fillStyle = 'rgba(235,225,170,0.8)'; ctx.fillRect(-26, -9, 52, 18); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-26, -9, 52, 5); ctx.restore(); }
  } else if (deco === 'scroll') {
    for (const yy of [c.y - 2, c.y + c.h - 8]) { const g = ctx.createLinearGradient(0, yy, 0, yy + 10); g.addColorStop(0, '#8a5a30'); g.addColorStop(0.5, '#d9a86a'); g.addColorStop(1, '#5a3519'); ctx.fillStyle = g; roundRectPath(ctx, c.x, yy, c.w, 10, 5); ctx.fill(); }
  } else if (deco === 'hem') {
    ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(80,55,20,0.5)'; ctx.lineWidth = 1.6; roundRectPath(ctx, c.x + 7, c.y + 7, c.w - 14, c.h - 14, 4); ctx.stroke(); ctx.setLineDash([]);
  } else if (deco === 'clip') {
    const g = ctx.createLinearGradient(c.x, 0, c.x + 40, 0); g.addColorStop(0, '#d8d8d8'); g.addColorStop(1, '#808080'); ctx.fillStyle = g; roundRectPath(ctx, c.x + c.w / 2 - 22, c.y - 8, 44, 22, 4); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.2; ctx.stroke();
  }
}

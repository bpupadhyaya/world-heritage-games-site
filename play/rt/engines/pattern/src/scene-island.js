// Scene art, 1.12.0: island weaving. Shared helpers, tools and supply vessels for the island scenes (scenes-i.js), then lauhala and jaki-ed mats.
// Pure canvas 2D, hash-only randomness (no Math.random / Date.now), no human figures, no text.
import { hash, rgba, mix, shade, roundRectPath, rod, ball, speck, lines, glow, TAU, motifPath, isFilled, lineWidthOf, clamp, POT } from './scene-kit.js';
import { TOOLS } from './scene-tools.js';

const cellOf = (S) => Math.max(4, S.cell || 0);
export const isLand = (S) => S.area.w > S.area.h * 1.15;
const soft = (ctx, x, y, rx, ry, a = 0.3) => { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); };
const bx = (b) => ({ cx: b.x + b.w / 2, cy: b.y + b.h / 2, r: Math.min(b.w, b.h) / 2 });
function ring(ctx, S, b, on) {
  ctx.save(); ctx.strokeStyle = on ? S.pal.accent : 'rgba(255,255,255,0.28)'; ctx.lineWidth = on ? 4 : 1.5; roundRectPath(ctx, b.x, b.y, b.w, b.h, 12); ctx.stroke();
  if (on) { ctx.fillStyle = S.pal.accent; ctx.beginPath(); ctx.arc(b.x + b.w - 7, b.y + 7, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x + b.w - 9.5, b.y + 7); ctx.lineTo(b.x + b.w - 7.2, b.y + 9.2); ctx.lineTo(b.x + b.w - 4.2, b.y + 5); ctx.stroke(); }
  ctx.restore();
}
function back(ctx, b, c, a = 0.5) { ctx.save(); roundRectPath(ctx, b.x, b.y, b.w, b.h, 12); ctx.fillStyle = rgba(c, a); ctx.fill(); ctx.restore(); }

// a palm frond's shadow: a curved rib with leaflets either side, thrown from (x, y) in direction ang
export function frondShadow(ctx, x, y, ang, L, a, seed) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = `rgba(0,0,0,${a})`;
  ctx.lineCap = 'round'; ctx.strokeStyle = `rgba(0,0,0,${a})`; ctx.lineWidth = Math.max(1.5, L * 0.012); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(L * 0.5, -L * 0.07, L, L * 0.14); ctx.stroke();
  const n = 26;
  for (let k = 1; k < n; k++) {
    const t = k / n, px = L * t, py = -L * 0.07 * 2 * t * (1 - t) + L * 0.14 * t * t, len = L * 0.2 * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (0.8 + 0.3 * hash(k, seed));
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + L * 0.04, py + s * len * 0.6, px + L * 0.07 + s * 0, py + s * len); ctx.quadraticCurveTo(px + L * 0.012, py + s * len * 0.4, px, py); ctx.fill(); }
  }
  ctx.restore();
}

// ---- diagonal / straight plait (strips over and under) ---------------------------------------------------------------------------------------
// o: { p strip pitch, ang, over [over, under] counts, col (i, j, set) -> colour, gap, hi highlight 0..1, seed }
export function plait(ctx, R, o) {
  const p = o.p, ang = o.ang ?? -Math.PI / 4, cx = R.x + R.w / 2, cy = R.y + R.h / 2, n = Math.ceil(Math.hypot(R.w, R.h) / p) + 2, half = (n * p) / 2;
  const [ov, un] = o.twill ?? [2, 2], per = ov + un, gap = Math.max(0.6, p * (o.gap ?? 0.1)), seed = o.seed ?? 1, hi = o.hi ?? 0.1, w = p - gap;
  const H = [], V = [];
  for (let i = 0; i < n; i++) { H.push(o.col(i, -1, 0)); V.push(o.col(-1, i, 1)); }
  ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip(); ctx.translate(cx, cy); ctx.rotate(ang);
  const L = `rgba(255,248,220,${0.16 + hi})`, Dk = 'rgba(30,12,0,0.22)';
  // under layer: every strip in full, lit along its top (left) third and dark along the far third
  for (let i = 0; i < n; i++) { const y0 = -half + i * p + gap / 2; ctx.fillStyle = H[i]; ctx.fillRect(-half, y0, n * p, w); ctx.fillStyle = L; ctx.fillRect(-half, y0, n * p, w * 0.3); ctx.fillStyle = Dk; ctx.fillRect(-half, y0 + w * 0.7, n * p, w * 0.3); }
  for (let j = 0; j < n; j++) { const x0 = -half + j * p + gap / 2; ctx.fillStyle = V[j]; ctx.fillRect(x0, -half, w, n * p); ctx.fillStyle = L; ctx.fillRect(x0, -half, w * 0.3, n * p); ctx.fillStyle = Dk; ctx.fillRect(x0 + w * 0.7, -half, w * 0.3, n * p); }
  // over layer: the horizontal strip passes over vertical j when (i + j) % per < ov; shadow first, then the strip, its light and dark edge, a dip at the end
  for (let i = 0; i < n; i++) {
    const y0 = -half + i * p + gap / 2; let any = false;
    ctx.beginPath(); for (let j = 0; j < n; j++) if ((i + j) % per < ov) { ctx.rect(-half + j * p - p * 0.05, y0 + p * 0.07, p * 1.1, w); any = true; }
    if (!any) continue;
    ctx.fillStyle = 'rgba(20,8,0,0.3)'; ctx.fill();
    const seg = (fn) => { ctx.beginPath(); for (let j = 0; j < n; j++) if ((i + j) % per < ov) fn(-half + j * p + gap / 2); };
    ctx.fillStyle = H[i]; seg((x0) => ctx.rect(x0, y0, w, w)); ctx.fill();
    ctx.fillStyle = L; seg((x0) => ctx.rect(x0, y0, w, w * 0.3)); ctx.fill();
    ctx.fillStyle = Dk; seg((x0) => ctx.rect(x0, y0 + w * 0.72, w, w * 0.28)); ctx.fill();
    ctx.fillStyle = 'rgba(30,12,0,0.2)'; seg((x0) => ctx.rect(x0, y0, w * 0.09, w)); ctx.fill();
  }
  if (o.fibre !== false && !o.lite) {
    ctx.strokeStyle = 'rgba(70,40,10,0.13)'; ctx.lineWidth = 0.7; ctx.beginPath();
    for (let i = 0; i < n; i++) { const y = -half + i * p + p * (0.3 + 0.4 * hash(i, seed)); ctx.moveTo(-half, y); ctx.lineTo(half, y); }
    ctx.stroke();
  }
  ctx.restore();
}

// ---- tools and supplies for the island scenes ------------------------------------------------------------------------------------------------
Object.assign(TOOLS, {
  // a long flat pandanus strip held by its end, with a bone needle: the tip is where the strip goes in
  pandanusstrip(ctx, S, T) {
    const u = T.u, p = Math.max(0, 1 - T.a / 0.45), L = u * 4.6;
    soft(ctx, T.x + u * 0.7, T.y + u * 0.1, u * 1.1, u * 0.12);
    ctx.save(); ctx.translate(T.x, T.y - p * u * 0.06); ctx.rotate(-0.1);
    const path = () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(L * 0.3, -u * 0.5, L * 0.55, u * 0.4, L, -u * 0.7); };
    ctx.lineCap = 'butt'; path(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = u * 0.5; ctx.save(); ctx.translate(2, 3); ctx.stroke(); ctx.restore();
    path(); ctx.strokeStyle = shade(T.col, -0.35); ctx.lineWidth = u * 0.5; ctx.stroke(); path(); ctx.strokeStyle = T.col; ctx.lineWidth = u * 0.4; ctx.stroke();
    path(); ctx.strokeStyle = rgba(shade(T.col, 0.55), 0.6); ctx.lineWidth = u * 0.07; ctx.save(); ctx.translate(0, -u * 0.1); ctx.stroke(); ctx.restore();
    path(); ctx.setLineDash([u * 0.5, u * 0.16]); ctx.strokeStyle = rgba(shade(T.col, -0.5), 0.35); ctx.lineWidth = u * 0.4; ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
    rod(ctx, T.x - u * 0.3, T.y + u * 0.08, T.x + u * 1.1, T.y - u * 0.26, u * 0.08, '#efe4c8');
  },
  // a hand-held bark beater's cousin: a stencil pad, a wad of cloth dipped in dye, rubbed over the stencil (tip = the pad's face)
  rubpad(ctx, S, T) {
    const u = T.u, p = Math.max(0, 1 - T.a / 0.45);
    soft(ctx, T.x + u * 0.3, T.y + u * 0.2, u * 0.7, u * 0.22, 0.3);
    ctx.save(); ctx.translate(T.x + u * 0.55, T.y - u * 0.3 - p * u * 0.08); ctx.rotate(-0.25);
    const g = ctx.createLinearGradient(0, -u * 0.5, 0, u * 0.5); g.addColorStop(0, '#e3d0a2'); g.addColorStop(1, '#9a7a48'); ctx.fillStyle = g; roundRectPath(ctx, -u * 0.9, -u * 0.5, u * 1.8, u * 0.95, u * 0.4); ctx.fill();
    ctx.strokeStyle = 'rgba(60,35,10,0.5)'; ctx.lineWidth = 1; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(-u * 0.7 + k * u * 0.35, -u * 0.4); ctx.lineTo(-u * 0.6 + k * u * 0.35, u * 0.35); ctx.stroke(); }
    ctx.fillStyle = T.col; ctx.beginPath(); ctx.ellipse(-u * 0.45, u * 0.38, u * 0.5, u * 0.14, 0, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // a fibre brush: a bundle of pandanus fibre bound to a short stick, loaded with dye (tip = brush end)
  fibrebrush(ctx, S, T) {
    const u = T.u, p = Math.max(0, 1 - T.a / 0.45), a = 0.55;
    soft(ctx, T.x + u * 0.8, T.y + u * 0.1, u * 0.9, u * 0.12);
    const ex = T.x + Math.sin(a) * u * 4.2, ey = T.y - Math.cos(a) * u * 4.2 - p * u * 0.04;
    rod(ctx, T.x + Math.sin(a) * u * 0.9, T.y - Math.cos(a) * u * 0.9, ex, ey, u * 0.16, '#a87a44');
    ctx.save(); ctx.translate(T.x, T.y); ctx.rotate(a);
    ctx.fillStyle = shade(T.col, -0.1); ctx.beginPath(); ctx.moveTo(-u * 0.16, -u * 0.95); ctx.lineTo(u * 0.16, -u * 0.95); ctx.lineTo(u * 0.07, 0); ctx.lineTo(-u * 0.07, 0); ctx.fill();
    for (let k = -3; k <= 3; k++) { ctx.strokeStyle = rgba(shade(T.col, k % 2 ? 0.25 : -0.3), 0.8); ctx.lineWidth = Math.max(0.8, u * 0.03); ctx.beginPath(); ctx.moveTo(k * u * 0.04, 0); ctx.lineTo(k * u * 0.025, -u * 0.9); ctx.stroke(); }
    ctx.fillStyle = '#e9dcb8'; ctx.fillRect(-u * 0.19, -u * 1.0, u * 0.38, u * 0.1);
    ctx.restore();
  },
  // scissors-free appliqué knife: a small pair of sewing scissors with the working blades at the tip
  cutscissors(ctx, S, T) {
    const u = T.u, p = Math.max(0, 1 - T.a / 0.45), open = 0.12 + p * 0.28;
    soft(ctx, T.x + u * 0.8, T.y + u * 0.1, u * 1.0, u * 0.12);
    ctx.save(); ctx.translate(T.x, T.y); ctx.rotate(0.55);
    for (const s of [-1, 1]) { ctx.save(); ctx.rotate(s * open); const g = ctx.createLinearGradient(0, 0, u * 0.2 * s, 0); g.addColorStop(0, '#f4f6f8'); g.addColorStop(1, '#8b939c'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(u * 0.17 * s, -u * 1.3); ctx.lineTo(0, -u * 1.45); ctx.lineTo(-u * 0.02 * s, -u * 0.5); ctx.fill(); ctx.restore(); }
    ctx.strokeStyle = '#d33a3a'; ctx.lineWidth = u * 0.14; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * u * 0.42, -u * 2.3, u * 0.3, u * 0.42, s * 0.4, 0, TAU); ctx.stroke(); }
    rod(ctx, 0, -u * 1.3, -u * 0.35, -u * 2.0, u * 0.1, '#c0c6cc'); rod(ctx, 0, -u * 1.3, u * 0.35, -u * 2.0, u * 0.1, '#c0c6cc');
    ctx.restore();
  },
});

Object.assign(POT, {
  // a rolled coil of flat pandanus strips (colour = the dye): a flat spiral ribbon
  striproll(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#1a140c', 0.45);
    soft(ctx, cx + 2, cy + r * 0.55 + lift, r * 0.8, r * 0.22, 0.4);
    ctx.save(); ctx.translate(cx, cy + lift);
    for (let k = 0; k < 9; k++) { const rr = r * (0.82 - k * 0.085), g = ctx.createRadialGradient(-rr * 0.3, -rr * 0.3, 1, 0, 0, rr); g.addColorStop(0, shade(col, 0.3)); g.addColorStop(1, shade(col, -0.3)); ctx.strokeStyle = g; ctx.lineWidth = r * 0.085; ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(0, 0, rr + r * 0.042, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = shade(col, -0.45); ctx.beginPath(); ctx.arc(0, 0, r * 0.08, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = r * 0.04; ctx.beginPath(); ctx.arc(0, 0, r * 0.76, Math.PI * 1.1, Math.PI * 1.55); ctx.stroke();
    ctx.restore(); ring(ctx, S, b, on);
  },
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// LAUHALA: wide dried pandanus strips plaited on the diagonal into a mat, on warm sand in the shade of palms. Dyed strips (brown, black, red) run
// through the plait as chevrons and diamonds.
// ---------------------------------------------------------------------------------------------------------------------------------------------------
export const LAU = '#d7b56c';
export function lauhalaEnv(ctx, S) {
  const a = S.area, X0 = a.x - 12, W = a.w + 24;
  const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#e2c890'); g.addColorStop(0.5, '#cfa968'); g.addColorStop(1, '#a37c44'); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, a.h);
  speck(ctx, a, 420, ['#6e4a22', '#f4dba4', '#9c7440'], 0.35, Math.max(1.4, cellOf(S) * 0.05), 61);
  // sun-dappled sand: bright patches and long palm-frond shadows from the upper corners
  glow(ctx, a.x + a.w * 0.72, a.y + a.h * 0.25, Math.max(a.w, a.h) * 0.8, '#fff0c0', 0.3);
  ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, a.h); ctx.clip();
  const L = Math.max(a.w, a.h) * 0.8;
  frondShadow(ctx, a.x - a.w * 0.05, a.y - a.h * 0.02, 0.5, L, 0.34, 3); frondShadow(ctx, a.x + a.w * 1.05, a.y + a.h * 0.02, Math.PI - 0.55, L * 0.9, 0.3, 7); frondShadow(ctx, a.x + a.w * 0.5, a.y + a.h * 1.05, -1.2, L * 0.55, 0.24, 11);
  ctx.restore();
  vignetteTo(ctx, a, 0.32);
}
export function vignetteTo(ctx, a, k) { const v = ctx.createRadialGradient(a.x + a.w / 2, a.y + a.h / 2, Math.min(a.w, a.h) * 0.35, a.x + a.w / 2, a.y + a.h / 2, Math.max(a.w, a.h) * 0.8); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(20,10,0,${k})`); ctx.fillStyle = v; ctx.fillRect(a.x - 12, a.y, a.w + 24, a.h); }
// the mat is a little bigger than the board: unfinished strip ends fold back at the edge
export function lauhalaBase(ctx, S) {
  const r = S.rect, t = cellOf(S) * 0.34;
  ctx.save(); ctx.shadowColor = 'rgba(40,20,0,0.6)'; ctx.shadowBlur = cellOf(S) * 0.7; ctx.shadowOffsetY = cellOf(S) * 0.2; ctx.fillStyle = shade(LAU, -0.25); ctx.fillRect(r.x - t, r.y - t, r.w + 2 * t, r.h + 2 * t); ctx.restore();
  ctx.fillStyle = shade(LAU, -0.05); ctx.fillRect(r.x - t * 0.7, r.y - t * 0.7, r.w + t * 1.4, r.h + t * 1.4);
  ctx.strokeStyle = 'rgba(60,30,0,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 60; k++) { const f = k / 60, x = r.x - t + f * (r.w + 2 * t); ctx.moveTo(x, r.y - t); ctx.lineTo(x + t * 0.5, r.y - t * 0.2); ctx.moveTo(x, r.y + r.h + t); ctx.lineTo(x + t * 0.5, r.y + r.h + t * 0.2); } ctx.stroke();
}
export function lauhalaGround(ctx, S) {
  const r = S.rect, p = Math.max(5, cellOf(S) * 0.3), bg = mix(S.bg, LAU, 0.5);
  plait(ctx, r, { p, ang: -Math.PI / 4, col: (i, j, s) => mix(bg, '#fff0c4', 0.04 + 0.3 * hash(i + 7, j + 2, s)), seed: 5, lite: S.lite, twill: [2, 2], hi: 0.08 });
  // the mat is not flat: a soft ridge where it rests on the sand
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,240,190,0.2)'); g.addColorStop(0.5, 'rgba(255,240,190,0)'); g.addColorStop(1, 'rgba(60,30,0,0.26)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
}
// a dyed strip plaited in: the stamp's shape in the same diagonal twill, in the dye colour
export function lauhalaSkin(ctx, S, d) {
  const { kind, col, x, y, s, key } = d, fill = isFilled(kind), p = Math.max(4.5, cellOf(S) * 0.3);
  if (!fill) { // a dyed strip laid along the line, with the plait's ticks across it
    const lw = lineWidthOf(kind, s) * 1.5; ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(30,15,0,0.4)'; ctx.lineWidth = lw + 2; ctx.save(); ctx.translate(1, 1.8); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = shade(col, -0.4); ctx.lineWidth = lw + 0.8; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw * 0.8; ctx.stroke();
    ctx.setLineDash([p * 0.5, p * 0.5]); ctx.strokeStyle = rgba(shade(col, -0.5), 0.5); ctx.lineWidth = lw * 0.8; ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = rgba(shade(col, 0.55), 0.7); ctx.lineWidth = Math.max(0.8, lw * 0.16); ctx.save(); ctx.translate(-lw * 0.12, -lw * 0.2); ctx.stroke(); ctx.restore(); ctx.restore(); return;
  }
  const s2 = s * 1.16;
  ctx.save(); motifPath(ctx, kind, x, y, s2); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(30,15,0,0.45)'; ctx.lineWidth = s * 0.07; ctx.save(); ctx.translate(s * 0.02, s * 0.04); ctx.stroke(); ctx.restore();
  ctx.fillStyle = shade(col, -0.4); ctx.fill(); ctx.clip();
  plait(ctx, { x: x - s, y: y - s, w: s * 2, h: s * 2 }, { p, ang: -Math.PI / 4, col: (i, j, st) => (st ? shade(col, 0.07 * (hash(j + key, 3) - 0.5) * 2) : shade(col, 0.07 * (hash(i + key, 5) - 0.5) * 2)), lite: true, twill: [2, 2], fibre: false, gap: 0.12 });
  const og = ctx.createRadialGradient(x - s2 * 0.2, y - s2 * 0.25, s2 * 0.08, x, y, s2 * 0.62); og.addColorStop(0, 'rgba(255,240,200,0.16)'); og.addColorStop(0.6, 'rgba(255,240,200,0)'); og.addColorStop(1, 'rgba(20,8,0,0.34)'); ctx.fillStyle = og; ctx.fillRect(x - s2, y - s2, s2 * 2, s2 * 2);
  ctx.restore();
  ctx.save(); motifPath(ctx, kind, x, y, s2); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(shade(col, -0.6), 0.8); ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke(); ctx.restore();
}


// ---------------------------------------------------------------------------------------------------------------------------------------------------
// JAKI-ED: a very fine mat of pale pandanus plaited in tiny squares with dark strands drawing bands and diamonds; a tricoloured border and a loose
// fringe at the ends. Laid on pale coral sand in front of a lagoon.
// ---------------------------------------------------------------------------------------------------------------------------------------------------
export const JAKI = '#efe2c2';
export function jakiedEnv(ctx, S) {
  const a = S.area, X0 = a.x - 12, W = a.w + 24, land = isLand(S), hy = a.y + a.h * (land ? 0.3 : 0.2);
  const sky = ctx.createLinearGradient(0, a.y, 0, hy); sky.addColorStop(0, '#9fd3e0'); sky.addColorStop(1, '#e6f4ee'); ctx.fillStyle = sky; ctx.fillRect(X0, a.y, W, hy - a.y);
  const sea = ctx.createLinearGradient(0, hy, 0, hy + a.h * 0.2); sea.addColorStop(0, '#46bdb4'); sea.addColorStop(0.5, '#1f8f9a'); sea.addColorStop(1, '#5fc8bd'); ctx.fillStyle = sea; ctx.fillRect(X0, hy, W, a.h * 0.2);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
  for (let k = 0; k < 26; k++) { const y = hy + a.h * 0.2 * (0.06 + 0.9 * hash(k, 1)), x = a.x + hash(k, 2) * a.w, l = cellOf(S) * (0.4 + hash(k, 3)); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l, y); ctx.stroke(); }
  // a low islet with two palms, far off
  ctx.fillStyle = '#2f7a5c'; ctx.beginPath(); ctx.ellipse(a.x + a.w * 0.8, hy + 2, a.w * 0.1, a.h * 0.012, 0, Math.PI, TAU); ctx.fill();
  ctx.strokeStyle = '#27604a'; ctx.lineWidth = Math.max(1.5, cellOf(S) * 0.05); for (const dx of [0.78, 0.82]) { ctx.beginPath(); ctx.moveTo(a.x + a.w * dx, hy); ctx.quadraticCurveTo(a.x + a.w * (dx + 0.004), hy - a.h * 0.03, a.x + a.w * (dx + 0.012), hy - a.h * 0.045); ctx.stroke(); ctx.beginPath(); ctx.arc(a.x + a.w * (dx + 0.012), hy - a.h * 0.045, a.h * 0.016, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); }
  const sand = ctx.createLinearGradient(0, hy + a.h * 0.2, 0, a.y + a.h); sand.addColorStop(0, '#f3ead2'); sand.addColorStop(1, '#d8c79c'); ctx.fillStyle = sand; ctx.fillRect(X0, hy + a.h * 0.2, W, a.h);
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.moveTo(X0, hy + a.h * 0.2); for (let i = 0; i <= 24; i++) ctx.lineTo(X0 + (W * i) / 24, hy + a.h * 0.2 + Math.sin(i * 1.3) * 2 + 2); ctx.lineTo(X0 + W, hy + a.h * 0.2 - 4); ctx.lineTo(X0, hy + a.h * 0.2 - 4); ctx.fill(); // foam line
  speck(ctx, a, 300, ['#b89c68', '#fffbe8'], 0.3, Math.max(1.2, cellOf(S) * 0.04), 71);
  glow(ctx, a.x + a.w * 0.3, a.y, a.w, '#fff6d8', 0.35);
}
// the mat: pale plait with a tricoloured border and fringe. Bigger than the board.
export function jakiedBase(ctx, S) {
  const r = S.rect, t = cellOf(S) * 0.62, R = { x: r.x - t, y: r.y - t, w: r.w + 2 * t, h: r.h + 2 * t }, c = cellOf(S);
  ctx.save(); ctx.shadowColor = 'rgba(70,50,20,0.55)'; ctx.shadowBlur = c * 0.6; ctx.shadowOffsetY = c * 0.18; ctx.fillStyle = shade(JAKI, -0.1); ctx.fillRect(R.x, R.y, R.w, R.h); ctx.restore();
  // fringe: loose strands at top and bottom edges
  ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1, c * 0.025);
  for (const side of [0, 1]) for (let k = 0; k < Math.floor(R.w / (c * 0.07)); k++) { const x = R.x + (k + 0.5) * c * 0.07, y0 = side ? R.y + R.h : R.y, dir = side ? 1 : -1, l = c * (0.22 + 0.2 * hash(k, side, 3)), bend = (hash(k, 9, side) - 0.5) * c * 0.2; ctx.strokeStyle = k % 5 === 0 ? '#9a7a4e' : '#efe2c2'; ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + bend * 0.5, y0 + dir * l * 0.6, x + bend, y0 + dir * l); ctx.stroke(); }
  // border bands: dark outer line, rust band, black and cream chevrons
  const band = (ins, w, col) => { ctx.fillStyle = col; ctx.fillRect(R.x + ins, R.y + ins, R.w - 2 * ins, w); ctx.fillRect(R.x + ins, R.y + R.h - ins - w, R.w - 2 * ins, w); ctx.fillRect(R.x + ins, R.y + ins, w, R.h - 2 * ins); ctx.fillRect(R.x + R.w - ins - w, R.y + ins, w, R.h - 2 * ins); };
  band(t * 0.08, t * 0.14, '#3a2414'); band(t * 0.28, t * 0.3, '#a2552e'); band(t * 0.66, t * 0.12, '#3a2414');
  ctx.strokeStyle = 'rgba(255,240,200,0.55)'; ctx.lineWidth = Math.max(1, c * 0.03); ctx.beginPath(); for (let k = 0; k < 90; k++) { const f = k / 90, x = R.x + t * 0.3 + f * (R.w - t * 0.6); ctx.moveTo(x, R.y + t * 0.3); ctx.lineTo(x + c * 0.08, R.y + t * 0.58); ctx.moveTo(x, R.y + R.h - t * 0.3); ctx.lineTo(x + c * 0.08, R.y + R.h - t * 0.58); } ctx.stroke();
}
export function jakiedGround(ctx, S) {
  const r = S.rect, p = Math.max(3, cellOf(S) / 9);
  plait(ctx, r, { p, ang: -Math.PI / 4, twill: [1, 1], gap: 0.06, hi: 0.04, col: (i, j, st) => mix(JAKI, '#fffaf0', 0.1 + 0.25 * hash(i + 5, j + 9, st)), lite: S.lite, fibre: false });
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,255,240,0.3)'); g.addColorStop(0.5, 'rgba(255,255,240,0)'); g.addColorStop(1, 'rgba(90,60,20,0.2)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
}
// dappled light: a palm frond's shadow falls across the mat
export function dappleOver(ctx, S, a, seed) {
  const r = S.rect, L = Math.max(r.w, r.h) * 0.95; frondShadow(ctx, r.x + r.w * 1.08, r.y - r.h * 0.05, Math.PI * 0.86, L, a, seed); frondShadow(ctx, r.x - r.w * 0.1, r.y + r.h * 1.1, -0.55, L * 0.7, a * 0.8, seed + 4);
  glow(ctx, r.x + r.w * 0.28, r.y + r.h * 0.3, r.w * 0.7, '#fff6d8', 0.12);
}
export function jakiedSkin(ctx, S, d) {
  const { kind, col, x, y, s, key } = d, fill = isFilled(kind), p = Math.max(3, cellOf(S) / 9);
  if (!fill) { const lw = lineWidthOf(kind, s) * 0.95; ctx.save(); motifPath(ctx, kind, x, y, s * 1.05); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(shade(col, -0.5), 0.9); ctx.lineWidth = lw + 1.4; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); ctx.setLineDash([p * 0.9, p * 0.9]); ctx.strokeStyle = rgba(shade(col, 0.35), 0.5); ctx.lineWidth = lw * 0.9; ctx.stroke(); ctx.setLineDash([]); ctx.restore(); return; }
  const s2 = s * 1.12;
  ctx.save(); motifPath(ctx, kind, x, y, s2); ctx.fillStyle = shade(col, -0.45); ctx.fill(); ctx.clip();
  plait(ctx, { x: x - s, y: y - s, w: s * 2, h: s * 2 }, { p, ang: -Math.PI / 4, twill: [1, 1], gap: 0.06, hi: 0.04, lite: true, fibre: false, col: (i, j, st) => shade(col, 0.1 * (st ? hash(j + key, 3) : hash(i + key, 5)) - 0.04) });
  const og = ctx.createRadialGradient(x - s2 * 0.2, y - s2 * 0.25, s2 * 0.08, x, y, s2 * 0.62); og.addColorStop(0, 'rgba(255,255,230,0.2)'); og.addColorStop(1, 'rgba(10,0,0,0.3)'); ctx.fillStyle = og; ctx.fillRect(x - s2, y - s2, s2 * 2, s2 * 2);
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// MASI / bark cloth: beaten mulberry bark, joined and felted; the pattern is stencil-printed in black and rust-brown dye rubbed through cut stencils.
// ---------------------------------------------------------------------------------------------------------------------------------------------------
export const BARK = '#d8bd8c';
// beaten bark texture: long irregular fibre streaks, thin translucent patches, felted seams
export function barkTexture(ctx, R, S, m, o = {}) {
  ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip(); ctx.fillStyle = m; ctx.fillRect(R.x, R.y, R.w, R.h);
  const c = cellOf(S), n = S.lite ? 40 : 230, vert = o.vert;
  for (let k = 0; k < n; k++) { const u = hash(k, 1), v = hash(k, 2), l = c * (0.8 + 3.2 * hash(k, 3)), th = Math.max(0.8, c * (0.02 + 0.05 * hash(k, 4))), light = hash(k, 5) > 0.5; ctx.strokeStyle = rgba(light ? shade(m, 0.4) : shade(m, -0.4), 0.1 + 0.16 * hash(k, 6)); ctx.lineWidth = th; ctx.beginPath(); const x = R.x + u * R.w, y = R.y + v * R.h; if (vert) { ctx.moveTo(x, y); ctx.quadraticCurveTo(x + (hash(k, 7) - 0.5) * c * 0.3, y + l / 2, x + (hash(k, 8) - 0.5) * c * 0.2, y + l); } else { ctx.moveTo(x, y); ctx.quadraticCurveTo(x + l / 2, y + (hash(k, 7) - 0.5) * c * 0.3, x + l, y + (hash(k, 8) - 0.5) * c * 0.2); } ctx.stroke(); }
  if (!S.lite) for (let k = 0; k < 14; k++) { const x = R.x + hash(k, 11) * R.w, y = R.y + hash(k, 12) * R.h, rr = c * (0.12 + 0.25 * hash(k, 13)); const g = ctx.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, rgba(shade(m, 0.45), 0.3)); g.addColorStop(1, rgba(shade(m, 0.45), 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, rr * 1.6, rr, hash(k, 14) * 3, 0, TAU); ctx.fill(); } // thin spots
  ctx.restore();
}
export function masiEnv(ctx, S) {
  const a = S.area, X0 = a.x - 12, W = a.w + 24, c = cellOf(S);
  // a dim village floor: coarse straw mats in strips, lit from one side
  const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#4a3322'); g.addColorStop(1, '#271a10'); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, a.h);
  for (let y = a.y, j = 0; y < a.y + a.h; y += c * 0.55, j++) { ctx.fillStyle = rgba(hash(j, 3) > 0.5 ? '#c9a566' : '#7a5a34', 0.1 + 0.1 * hash(j, 4)); ctx.fillRect(X0, y, W, c * 0.55); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(X0, y, W, 1.2); }
  for (let k = 0; k < 120; k++) { const x = a.x + hash(k, 5) * a.w, y = a.y + hash(k, 6) * a.h; ctx.fillStyle = 'rgba(255,230,170,0.1)'; ctx.fillRect(x, y, c * (0.3 + hash(k, 7)), 1); }
  glow(ctx, a.x + a.w * 0.15, a.y + a.h * 0.1, Math.max(a.w, a.h) * 0.9, '#ffcf8a', 0.38); vignetteTo(ctx, a, 0.6);
  if (S.card) return;
  // a rolled length of finished bark cloth lying at the side (black and rust bands), and a banana-leaf stencil
  const r = S.rect, land = isLand(S), cw = c * 0.62;
  const roll = (x, y, len, vertical) => { ctx.save(); ctx.translate(x, y); if (vertical) ctx.rotate(Math.PI / 2); soft(ctx, len * 0.5 + 3, cw * 0.6, len * 0.55, cw * 0.4, 0.4); const gr = ctx.createLinearGradient(0, -cw / 2, 0, cw / 2); gr.addColorStop(0, shade(BARK, 0.25)); gr.addColorStop(0.5, BARK); gr.addColorStop(1, shade(BARK, -0.45)); ctx.fillStyle = gr; roundRectPath(ctx, 0, -cw / 2, len, cw, cw * 0.18); ctx.fill(); ctx.fillStyle = '#1d1612'; for (let k = 0; k < 5; k++) ctx.fillRect(len * (0.1 + k * 0.17), -cw / 2, len * 0.045, cw); ctx.fillStyle = '#a4482a'; for (let k = 0; k < 5; k++) ctx.fillRect(len * (0.165 + k * 0.17), -cw / 2, len * 0.03, cw); ctx.fillStyle = shade(BARK, -0.2); ctx.beginPath(); ctx.ellipse(len, 0, cw * 0.17, cw / 2, 0, 0, TAU); ctx.fill(); ctx.restore(); };
  if (land) { const sp = r.x - a.x; if (sp > c * 2.2) roll(a.x + sp * 0.12, a.y + a.h * 0.8, sp * 0.76, false); }
  else { const sp = a.y + a.h - (r.y + r.h); if (sp > c * 1.6) roll(a.x + a.w * 0.06, r.y + r.h + sp * 0.42, a.w * 0.88, false); }
}
export function masiBase(ctx, S) { const r = S.rect, t = cellOf(S) * 0.14; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = cellOf(S) * 0.8; ctx.shadowOffsetY = cellOf(S) * 0.22; ctx.fillStyle = shade(BARK, -0.2); ctx.beginPath(); ctx.moveTo(r.x - t, r.y - t * 0.5); for (let i = 0; i <= 24; i++) ctx.lineTo(r.x - t + (r.w + 2 * t) * i / 24, r.y - t * (0.2 + hash(i, 1, 4))); for (let i = 0; i <= 24; i++) ctx.lineTo(r.x + r.w + t * (0.2 + hash(i, 2, 4)), r.y + (r.h * i) / 24); for (let i = 24; i >= 0; i--) ctx.lineTo(r.x - t + (r.w + 2 * t) * i / 24, r.y + r.h + t * (0.2 + hash(i, 3, 4))); for (let i = 24; i >= 0; i--) ctx.lineTo(r.x - t * (0.2 + hash(i, 4, 4)), r.y + (r.h * i) / 24); ctx.fill(); ctx.restore(); }
export function masiGround(ctx, S) {
  const r = S.rect, m = mix(S.bg, BARK, 0.6); barkTexture(ctx, r, S, m);
  // joined sheets: two felted seams
  ctx.strokeStyle = 'rgba(80,50,20,0.22)'; ctx.lineWidth = Math.max(1.5, cellOf(S) * 0.07); ctx.beginPath(); ctx.moveTo(r.x + r.w * 0.5, r.y); ctx.lineTo(r.x + r.w * 0.5 + cellOf(S) * 0.05, r.y + r.h); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,240,200,0.25)'; ctx.lineWidth = Math.max(1, cellOf(S) * 0.03); ctx.beginPath(); ctx.moveTo(r.x + r.w * 0.5 + 2, r.y); ctx.lineTo(r.x + r.w * 0.5 + cellOf(S) * 0.05 + 2, r.y + r.h); ctx.stroke();
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,230,170,0.22)'); g.addColorStop(0.5, 'rgba(255,230,170,0)'); g.addColorStop(1, 'rgba(30,10,0,0.3)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
}
// stencil printing: flat matte dye rubbed through the cut paper; ties (bridges) left unprinted, fibre showing through, rough rubbed edges
export function masiSkin(ctx, S, d) {
  const { kind, col, x, y, s, key } = d, fill = isFilled(kind), c = cellOf(S), br = Math.max(1.3, s * 0.045);
  const ink = () => { ctx.fillStyle = col; ctx.strokeStyle = col; };
  if (!fill) { // a cut line: dashes with ties between
    const lw = lineWidthOf(kind, s) * 1.15; ctx.save(); motifPath(ctx, kind, x, y, s * 1.04); ctx.lineJoin = 'round'; ctx.lineCap = 'butt'; ctx.strokeStyle = rgba(col, 0.3); ctx.lineWidth = lw + 2.6; ctx.stroke();
    ctx.setLineDash([lw * 3.2, br * 1.1]); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); ctx.setLineDash([]); ctx.restore(); return;
  }
  const s2 = s * 1.3; ctx.save(); motifPath(ctx, kind, x, y, s2); ctx.fillStyle = rgba(col, 0.28); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(col, 0.28); ctx.lineWidth = s * 0.07; ctx.stroke(); ctx.fill(); // rubbed-out halo
  motifPath(ctx, kind, x, y, s2); ctx.clip(); ink(); ctx.fillRect(x - s, y - s, s * 2, s * 2);
  for (let k = 0; k < 22; k++) { const yy = y - s * 0.55 + hash(key, k, 1) * s * 1.1, xx = x - s * 0.6 + hash(key, k, 2) * s * 1.0, l = s * (0.25 + 0.5 * hash(key, k, 3)); ctx.strokeStyle = rgba(hash(k, key) > 0.5 ? shade(col, 0.5) : '#000', 0.16); ctx.lineWidth = Math.max(0.8, s * 0.02); ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + l, yy + (hash(key, k, 4) - 0.5) * s * 0.04); ctx.stroke(); } // fibre streaks through the dye
  ctx.strokeStyle = rgba(mix(S.bg, BARK, 0.6), 0.9); ctx.lineWidth = br * 0.8; // ties of the stencil: thin unprinted bridges
  const ty = kind === 'dot' ? [0.0] : [-0.18, 0.2]; for (let k = 0; k < ty.length; k++) { ctx.beginPath(); ctx.moveTo(x - s, y + ty[k] * s + (hash(key, k) - 0.5) * s * 0.1); ctx.lineTo(x + s, y + ty[k] * s + (hash(key, k + 3) - 0.5) * s * 0.1); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(x + (hash(key, 8) - 0.5) * s * 0.3, y - s); ctx.lineTo(x + (hash(key, 9) - 0.5) * s * 0.3, y + s); ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// SIAPO: pale beaten bark cloth laid on a carved wooden board; the pattern is painted freehand with a fibre brush in brown dye. Under coconut blinds
// in a open house, white coral gravel underfoot.
// ---------------------------------------------------------------------------------------------------------------------------------------------------
export const SIAPO_CLOTH = '#ecdcb6';
export function siapoEnv(ctx, S) {
  const a = S.area, X0 = a.x - 12, W = a.w + 24, c = cellOf(S);
  const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#f3ead2'); g.addColorStop(0.5, '#e2d4b2'); g.addColorStop(1, '#b8a67e'); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, a.h);
  // white coral gravel floor
  speck(ctx, a, 700, ['#ffffff', '#e8dfc4', '#9a8a64'], 0.6, Math.max(1.4, c * 0.07), 33);
  // rolled coconut-leaf blinds at the top: woven slats with cord ties; the sun comes through the gaps as long streaks
  const bh = Math.max(c * 1.1, a.h * 0.11); const bg = ctx.createLinearGradient(0, a.y, 0, a.y + bh); bg.addColorStop(0, '#6a4a22'); bg.addColorStop(1, '#9c7640'); ctx.fillStyle = bg; ctx.fillRect(X0, a.y, W, bh);
  ctx.strokeStyle = 'rgba(30,15,0,0.45)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let x = X0; x < X0 + W; x += c * 0.26) { ctx.moveTo(x, a.y); ctx.lineTo(x, a.y + bh); } ctx.stroke();
  ctx.strokeStyle = 'rgba(255,230,170,0.3)'; ctx.beginPath(); for (let y = a.y + c * 0.3; y < a.y + bh; y += c * 0.3) { ctx.moveTo(X0, y); ctx.lineTo(X0 + W, y); } ctx.stroke();
  ctx.fillStyle = '#d8c8a0'; for (let x = a.x + c; x < a.x + a.w; x += c * 3.2) ctx.fillRect(x, a.y, c * 0.1, bh + c * 0.2);
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(X0, a.y + bh, W, c * 0.12);
  ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, a.h); ctx.clip(); ctx.fillStyle = 'rgba(255,248,210,0.12)'; for (let k = 0; k < 7; k++) { const x = a.x + (k + hash(k, 2)) * a.w / 6; ctx.beginPath(); ctx.moveTo(x, a.y + bh); ctx.lineTo(x + c * 0.8, a.y + bh); ctx.lineTo(x + c * 2.8, a.y + a.h); ctx.lineTo(x + c * 1.4, a.y + a.h); ctx.fill(); } ctx.restore();
  vignetteTo(ctx, a, 0.28);
}
// the carved board (upeti): thick, with raised relief lines the cloth is rubbed against, edge dark with a lit lip
export function siapoBase(ctx, S) {
  const r = S.rect, t = cellOf(S) * 0.55, R = { x: r.x - t, y: r.y - t, w: r.w + 2 * t, h: r.h + 2 * t };
  ctx.save(); ctx.shadowColor = 'rgba(20,30,28,0.6)'; ctx.shadowBlur = cellOf(S) * 0.8; ctx.shadowOffsetY = cellOf(S) * 0.25; const g = ctx.createLinearGradient(R.x, R.y, R.x + R.w, R.y + R.h); g.addColorStop(0, '#7a4a28'); g.addColorStop(1, '#3a2010'); ctx.fillStyle = g; roundRectPath(ctx, R.x, R.y, R.w, R.h, 6); ctx.fill(); ctx.restore();
  ctx.strokeStyle = 'rgba(255,210,150,0.5)'; ctx.lineWidth = 1.5; roundRectPath(ctx, R.x + 1, R.y + 1, R.w - 2, R.h - 2, 6); ctx.stroke();
  ctx.strokeStyle = 'rgba(20,8,0,0.5)'; ctx.lineWidth = Math.max(1, cellOf(S) * 0.04); ctx.beginPath(); for (let k = 0; k < 4; k++) { const o = t * (0.15 + k * 0.17); ctx.moveTo(R.x + o, R.y + R.h - o); ctx.lineTo(R.x + o, R.y + o); ctx.lineTo(R.x + R.w - o, R.y + o); } ctx.stroke();
  ctx.strokeStyle = 'rgba(255,200,140,0.2)'; ctx.beginPath(); for (let k = 0; k < 4; k++) { const o = t * (0.15 + k * 0.17) + 1.5; ctx.moveTo(R.x + o, R.y + R.h - o); ctx.lineTo(R.x + o, R.y + o); ctx.lineTo(R.x + R.w - o, R.y + o); } ctx.stroke();
}
export function siapoGround(ctx, S) {
  const r = S.rect, m = mix(S.bg, SIAPO_CLOTH, 0.7); barkTexture(ctx, r, S, m, { vert: true });
  // painted frame lines and a dotted band, as on a finished cloth (kept inside the outer cell ring)
  { const c = cellOf(S), e = c * 0.1, dk = '#5a2e14'; ctx.strokeStyle = rgba(dk, 0.55); ctx.lineWidth = Math.max(1.4, c * 0.05); ctx.strokeRect(r.x + e, r.y + e, r.w - 2 * e, r.h - 2 * e); ctx.lineWidth = Math.max(0.9, c * 0.025); ctx.strokeRect(r.x + e * 2.1, r.y + e * 2.1, r.w - 4.2 * e, r.h - 4.2 * e); }
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,255,235,0.3)'); g.addColorStop(0.5, 'rgba(255,255,235,0)'); g.addColorStop(1, 'rgba(70,40,10,0.2)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
}
// freehand brush painting: a wobbling edge, bristle streaks along the stroke, paint heavier where the brush landed
export function siapoSkin(ctx, S, d) {
  const { kind, col, x, y, s, key } = d, fill = isFilled(kind);
  if (!fill) { const lw = lineWidthOf(kind, s) * 1.2; ctx.save(); motifPath(ctx, kind, x, y, s * 1.04); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = rgba(col, 0.25); ctx.lineWidth = lw + 3; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); ctx.strokeStyle = rgba(shade(col, 0.4), 0.35); ctx.lineWidth = Math.max(0.8, lw * 0.18); for (const o of [-0.25, 0.25]) { ctx.save(); ctx.translate(o * lw, -o * lw * 0.5); ctx.stroke(); ctx.restore(); }
    ctx.strokeStyle = rgba(shade(col, -0.5), 0.5); ctx.lineWidth = Math.max(0.8, lw * 0.14); ctx.save(); ctx.translate(lw * 0.3, lw * 0.2); ctx.stroke(); ctx.restore(); ctx.restore(); return; }
  const s2 = s * 1.3; ctx.save(); motifPath(ctx, kind, x, y, s2); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(col, 0.3); ctx.lineWidth = s * 0.09; ctx.stroke();
  ctx.fillStyle = col; ctx.fill(); ctx.clip();
  const g = ctx.createLinearGradient(x - s / 2, y - s / 2, x + s / 2, y + s / 2); g.addColorStop(0, rgba(shade(col, 0.25), 0.5)); g.addColorStop(0.6, 'rgba(0,0,0,0)'); g.addColorStop(1, rgba(shade(col, -0.45), 0.5)); ctx.fillStyle = g; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  const ang = -0.6 + (hash(key, 1) - 0.5) * 0.5, ca = Math.cos(ang), sa = Math.sin(ang);
  for (let k = -16; k <= 16; k++) { const o = k * s * 0.055, w = Math.max(0.7, s * 0.014 * (1 + hash(key, k, 2))); ctx.strokeStyle = rgba(hash(key, k, 3) > 0.5 ? shade(col, 0.5) : shade(col, -0.55), 0.2 + 0.2 * hash(key, k, 4)); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x - ca * s + sa * o, y - sa * s - ca * o); ctx.lineTo(x + ca * s + sa * o, y + sa * s - ca * o); ctx.stroke(); }
  ctx.restore();
  ctx.save(); motifPath(ctx, kind, x, y, s2); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(shade(col, -0.6), 0.55); ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke(); ctx.restore();
}

Object.assign(POT, {
  // a hank of pale plant strands tied near the top, the free ends fanning out
  fibrehank(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#12383c', 0.45); soft(ctx, cx + 2, cy + r * 0.62 + lift, r * 0.6, r * 0.14, 0.4);
    ctx.save(); ctx.translate(cx, cy + lift); ctx.lineCap = 'round';
    for (let k = 0; k < 13; k++) { const f = (k - 6) / 6, tint = (hash(k, 4) - 0.5) * 0.2; ctx.strokeStyle = shade(col, -0.25 + tint); ctx.lineWidth = Math.max(1.4, r * 0.075); ctx.beginPath(); ctx.moveTo(f * r * 0.1, -r * 0.62); ctx.bezierCurveTo(f * r * 0.35, -r * 0.1, f * r * 0.8, r * 0.2, f * r * 0.75, r * 0.7); ctx.stroke(); ctx.strokeStyle = rgba(shade(col, 0.5 + tint), 0.7); ctx.lineWidth = Math.max(0.8, r * 0.03); ctx.beginPath(); ctx.moveTo(f * r * 0.1 - 1, -r * 0.62); ctx.bezierCurveTo(f * r * 0.35 - 1, -r * 0.1, f * r * 0.8 - 1, r * 0.2, f * r * 0.75 - 1, r * 0.7); ctx.stroke(); }
    ctx.fillStyle = '#7a4a22'; roundRectPath(ctx, -r * 0.2, -r * 0.5, r * 0.4, r * 0.16, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-r * 0.18, -r * 0.49, r * 0.36, 2);
    ctx.restore(); ring(ctx, S, b, on);
  },
  // half a coconut shell holding dye
  shellcup(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#1a120a', 0.45); soft(ctx, cx + 2, cy + r * 0.55 + lift, r * 0.85, r * 0.25, 0.4);
    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3 + lift, 2, cx, cy + lift, r * 0.95); g.addColorStop(0, '#9a6a3a'); g.addColorStop(0.7, '#5a3a1c'); g.addColorStop(1, '#2a1808'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.05 + lift, r * 0.8, r * 0.7, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(20,8,0,0.45)'; ctx.lineWidth = 1; for (let k = 0; k < 9; k++) { const an = hash(k, 3) * TAU; ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * r * 0.72, cy + Math.sin(an) * r * 0.62 + lift); ctx.lineTo(cx + Math.cos(an + 0.15) * r * 0.82, cy + Math.sin(an + 0.15) * r * 0.7 + lift); ctx.stroke(); }
    ctx.fillStyle = '#2a1808'; ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.02 + lift, r * 0.64, r * 0.5, 0, 0, TAU); ctx.fill();
    const l = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.15 + lift, 1, cx, cy + lift, r * 0.55); l.addColorStop(0, shade(col, 0.35)); l.addColorStop(1, shade(col, -0.35)); ctx.fillStyle = l; ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.02 + lift, r * 0.54, r * 0.4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(cx - r * 0.2, cy - r * 0.14 + lift, r * 0.16, r * 0.06, -0.3, 0, TAU); ctx.fill(); ring(ctx, S, b, on);
  },
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// TIVAEVAE: appliqué quilt top. Large flowers and leaves are cut from coloured cotton and sewn down with tiny blind stitches on white calico; a
// scalloped coloured border. Laid on a turquoise painted floor with frangipani blossoms and leaf shadows.
// ---------------------------------------------------------------------------------------------------------------------------------------------------
export const CALICO = '#fbf8ef';
function frangipani(ctx, x, y, R, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); soft(ctx, R * 0.15, R * 0.2, R * 1.1, R * 0.95, 0.22);
  for (let k = 0; k < 5; k++) { ctx.save(); ctx.rotate((k / 5) * TAU); const g = ctx.createLinearGradient(0, 0, R, 0); g.addColorStop(0, '#f6c84a'); g.addColorStop(0.35, '#fff6e2'); g.addColorStop(1, '#ffffff'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(R * 0.3, -R * 0.55, R * 0.95, -R * 0.5, R, R * 0.12); ctx.bezierCurveTo(R * 0.6, R * 0.2, R * 0.25, R * 0.12, 0, 0); ctx.fill(); ctx.strokeStyle = 'rgba(150,110,40,0.3)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = '#f2b73a'; ctx.beginPath(); ctx.arc(0, 0, R * 0.12, 0, TAU); ctx.fill(); ctx.restore();
}
export function tivaevaeEnv(ctx, S) {
  const a = S.area, X0 = a.x - 12, W = a.w + 24, c = cellOf(S);
  ctx.fillStyle = '#2a9a98'; ctx.fillRect(X0, a.y, W, a.h);
  const pw = c * 1.05; ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, a.h); ctx.clip();
  for (let x = X0, i = 0; x < X0 + W; x += pw, i++) { ctx.fillStyle = rgba(hash(i, 4) > 0.5 ? '#ffffff' : '#00403f', 0.05 + 0.06 * hash(i, 5)); ctx.fillRect(x, a.y, pw, a.h); ctx.fillStyle = 'rgba(0,50,50,0.4)'; ctx.fillRect(x, a.y, 1.5, a.h); ctx.fillStyle = 'rgba(190,255,245,0.14)'; ctx.fillRect(x + 1.5, a.y, 1.5, a.h); }
  speck(ctx, a, 260, ['#0a4a48', '#9ff0e4'], 0.18, Math.max(1.2, c * 0.04), 5);
  const L = Math.max(a.w, a.h) * 0.72; frondShadow(ctx, a.x - a.w * 0.04, a.y + a.h * 0.02, 0.55, L, 0.22, 4); frondShadow(ctx, a.x + a.w * 1.04, a.y + a.h * 0.7, Math.PI + 0.35, L * 0.8, 0.2, 9);
  for (const [fx, fy, k] of [[0.08, 0.93, 0], [0.92, 0.12, 1], [0.88, 0.9, 2], [0.1, 0.1, 3]]) frangipani(ctx, a.x + a.w * fx, a.y + a.h * fy, c * 0.55, k * 1.3 + 0.4);
  ctx.restore(); glow(ctx, a.x + a.w * 0.7, a.y + a.h * 0.2, Math.max(a.w, a.h) * 0.8, '#fff6c8', 0.28); vignetteTo(ctx, a, 0.4);
}
// the quilt's border: coloured cotton with a scalloped edge and two rows of white stitching
export function tivaevaeBase(ctx, S) {
  const r = S.rect, t = cellOf(S) * 0.7, R = { x: r.x - t, y: r.y - t, w: r.w + 2 * t, h: r.h + 2 * t }, bc = S.colors[0] ?? '#c0282c', c = cellOf(S), sc = c * 0.42;
  ctx.save(); ctx.shadowColor = 'rgba(0,40,40,0.6)'; ctx.shadowBlur = c * 0.7; ctx.shadowOffsetY = c * 0.2; ctx.fillStyle = bc;
  ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.fill(); ctx.restore();
  ctx.fillStyle = bc; ctx.beginPath(); // scallops outside each edge
  for (let x = R.x; x + sc <= R.x + R.w + 1; x += sc) { ctx.moveTo(x, R.y); ctx.arc(x + sc / 2, R.y, sc / 2, Math.PI, TAU); ctx.moveTo(x, R.y + R.h); ctx.arc(x + sc / 2, R.y + R.h, sc / 2, 0, Math.PI); }
  for (let y = R.y; y + sc <= R.y + R.h + 1; y += sc) { ctx.moveTo(R.x, y); ctx.arc(R.x, y + sc / 2, sc / 2, Math.PI * 1.5, Math.PI * 0.5, true); ctx.moveTo(R.x + R.w, y); ctx.arc(R.x + R.w, y + sc / 2, sc / 2, Math.PI * 1.5, Math.PI * 0.5); }
  ctx.fill();
  const g = ctx.createLinearGradient(R.x, R.y, R.x + R.w, R.y + R.h); g.addColorStop(0, 'rgba(255,255,255,0.22)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.25)'); ctx.fillStyle = g; ctx.fillRect(R.x, R.y, R.w, R.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = Math.max(1, c * 0.04); ctx.setLineDash([c * 0.1, c * 0.08]); for (const o of [t * 0.22, t * 0.7]) ctx.strokeRect(R.x + o, R.y + o, R.w - 2 * o, R.h - 2 * o); ctx.setLineDash([]);
}
export function tivaevaeGround(ctx, S) {
  const r = S.rect, p = Math.max(2, cellOf(S) / 12); ctx.fillStyle = mix(S.bg, CALICO, 0.75); ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.beginPath(); for (let x = r.x; x < r.x + r.w; x += p) { ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); } ctx.strokeStyle = 'rgba(120,100,60,0.07)'; ctx.lineWidth = p * 0.4; ctx.stroke();
  ctx.beginPath(); for (let y = r.y; y < r.y + r.h; y += p) { ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); } ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.stroke();
  if (!S.lite) { ctx.strokeStyle = 'rgba(80,100,120,0.13)'; ctx.lineWidth = 1; ctx.setLineDash([3, 4]); ctx.beginPath(); const e = cellOf(S) * 0.5; for (let x = r.x + e; x < r.x + r.w; x += e) { ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); } for (let y = r.y + e; y < r.y + r.h; y += e) { ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); } ctx.stroke(); ctx.setLineDash([]); } // quilting guide
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,255,240,0.3)'); g.addColorStop(0.5, 'rgba(255,255,240,0)'); g.addColorStop(1, 'rgba(60,70,60,0.18)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
}
// a cut cotton piece: a soft shadow, flat printed colour, the turned-under edge catching light, tiny blind stitches round it
export function tivaevaeSkin(ctx, S, d) {
  const { kind, col, x, y, s, key } = d, fill = isFilled(kind), c = cellOf(S);
  if (!fill) { const lw = lineWidthOf(kind, s) * 1.05; ctx.save(); motifPath(ctx, kind, x, y, s * 1.04); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(40,40,30,0.3)'; ctx.lineWidth = lw + 2.5; ctx.save(); ctx.translate(0.8, 1.6); ctx.stroke(); ctx.restore(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); ctx.strokeStyle = rgba(shade(col, 0.5), 0.5); ctx.lineWidth = Math.max(0.8, lw * 0.18); ctx.save(); ctx.translate(-lw * 0.18, -lw * 0.2); ctx.stroke(); ctx.restore(); ctx.setLineDash([lw * 0.35, lw * 0.35]); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = Math.max(0.8, lw * 0.12); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); return; }
  const s2 = s * (kind === 'flower' ? 1.42 : kind === 'leaf' || kind === 'petal' ? 1.3 : 1.22);
  ctx.save(); motifPath(ctx, kind, x, y, s2); ctx.lineJoin = 'round'; ctx.fillStyle = 'rgba(30,30,20,0.28)'; ctx.save(); ctx.translate(s * 0.03, s * 0.05); ctx.fill(); ctx.restore();
  ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = s * 0.03; ctx.stroke(); ctx.fill();
  ctx.save(); ctx.clip();
  const g = ctx.createLinearGradient(x - s2 / 2, y - s2 / 2, x + s2 / 2, y + s2 / 2); g.addColorStop(0, 'rgba(255,255,255,0.2)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.2)'); ctx.fillStyle = g; ctx.fillRect(x - s2, y - s2, s2 * 2, s2 * 2);
  ctx.fillStyle = rgba(shade(col, 0.4), 0.3); for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc(x + (hash(key, k, 1) - 0.5) * s2 * 0.9, y + (hash(key, k, 2) - 0.5) * s2 * 0.9, Math.max(1, s * 0.03), 0, TAU); ctx.fill(); } // printed cotton: tiny flecks
  ctx.restore();
  ctx.strokeStyle = rgba(shade(col, 0.45), 0.7); ctx.lineWidth = Math.max(1, s * 0.035); ctx.save(); ctx.translate(-s * 0.012, -s * 0.014); motifPath(ctx, kind, x, y, s2 * 0.96); ctx.stroke(); ctx.restore(); // folded-under edge catching light
  motifPath(ctx, kind, x, y, s2 * 1.015); ctx.setLineDash([Math.max(1.5, s * 0.06), Math.max(1.5, s * 0.06)]); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(0.8, s * 0.016); ctx.stroke(); ctx.setLineDash([]); // blind stitches
  ctx.restore();
}
Object.assign(POT, {
  // a small stack of folded printed cotton
  clothfold(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#0f3a3a', 0.5); soft(ctx, cx + 2, cy + r * 0.55 + lift, r * 0.85, r * 0.2, 0.4);
    for (let i = 0; i < 3; i++) { const w = r * (1.2 - i * 0.07), y0 = cy + r * (0.28 - i * 0.28) + lift, cc = shade(col, (i - 1) * 0.12); ctx.fillStyle = cc; roundRectPath(ctx, cx - w / 2, y0 - r * 0.2, w, r * 0.34, 4); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(cx - w / 2 + 3, y0 - r * 0.2, w - 6, 1.5); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(cx - w / 2 + 3, y0 + r * 0.12, w - 6, 2); ctx.fillStyle = rgba(shade(cc, 0.5), 0.5); for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(cx - w / 2 + w * (0.15 + k * 0.17), y0 - r * 0.03, 1.6, 0, TAU); ctx.fill(); } }
    ring(ctx, S, b, on);
  },
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// BILUM: a bag looped from twisted plant string, row on row, without a loom. Thick loops, open gaps showing the dark inside; colours worked in rows.
// ---------------------------------------------------------------------------------------------------------------------------------------------------
export const STRING = '#cdb88c';
function loopRows(ctx, R, c, col, o = {}) { // rows of interlocking loops over rect R, loop pitch p: thick cord, open gaps
  const p = o.p ?? c / 2.2, st = p * 0.8, rows = Math.ceil(R.h / st) + 1, cols = Math.ceil(R.w / p) + 1, lw = p * 0.25;
  ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip(); ctx.lineCap = 'round';
  for (let j = 0; j < rows; j++) {
    const y = R.y + j * st, off = (j % 2) * p * 0.5, cc = typeof col === 'function' ? col(j) : col;
    const path = (dx, dy) => { ctx.beginPath(); for (let i = 0; i < cols; i++) { const x = R.x + i * p + off; ctx.moveTo(x + p * 0.3 + dx, y + dy); ctx.ellipse(x + dx, y + dy, p * 0.31, p * 0.44, 0, 0, TAU); } };
    path(0, 0); ctx.strokeStyle = 'rgba(8,3,0,0.9)'; ctx.lineWidth = lw * 1.5; ctx.stroke();
    path(0, 0); ctx.strokeStyle = shade(cc, -0.32); ctx.lineWidth = lw * 1.08; ctx.stroke();
    path(0, 0); ctx.strokeStyle = cc; ctx.lineWidth = lw * 0.8; ctx.stroke();
    path(-p * 0.025, -p * 0.05); ctx.strokeStyle = rgba(shade(cc, 0.6), 0.75); ctx.lineWidth = Math.max(0.8, lw * 0.2); ctx.stroke();
  }
  ctx.restore();
}
export function bilumEnv(ctx, S) {
  const a = S.area, X0 = a.x - 12, W = a.w + 24, c = cellOf(S);
  const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#1d2a20'); g.addColorStop(1, '#0d140f'); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, a.h);
  // a woven split-bamboo wall: vertical slats, lashed with cane ties; misty highland light from a window at the upper right
  ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, a.h); ctx.clip();
  const sw = c * 0.42; for (let x = X0, i = 0; x < X0 + W; x += sw, i++) { const t = hash(i, 3); ctx.fillStyle = rgba(t > 0.5 ? '#5b7a4a' : '#3a5236', 0.55 + 0.25 * hash(i, 4)); ctx.fillRect(x, a.y, sw - 1.5, a.h); ctx.fillStyle = 'rgba(210,235,170,0.1)'; ctx.fillRect(x, a.y, 2, a.h); }
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; for (let y = a.y + c * 1.4; y < a.y + a.h; y += c * 2.6) { ctx.fillRect(X0, y, W, c * 0.12); ctx.fillStyle = 'rgba(210,235,170,0.2)'; ctx.fillRect(X0, y + c * 0.12, W, 1.5); ctx.fillStyle = 'rgba(0,0,0,0.5)'; }
  const lg = ctx.createRadialGradient(a.x + a.w * 0.85, a.y + a.h * 0.05, 0, a.x + a.w * 0.85, a.y + a.h * 0.05, Math.max(a.w, a.h) * 0.9); lg.addColorStop(0, 'rgba(255,240,190,0.55)'); lg.addColorStop(0.5, 'rgba(255,240,190,0.12)'); lg.addColorStop(1, 'rgba(255,240,190,0)'); ctx.fillStyle = lg; ctx.fillRect(X0, a.y, W, a.h);
  ctx.restore(); vignetteTo(ctx, a, 0.6);
}
// the bag's body is wider than the board: a dark inside showing through the loops, striped rim, string handles
export function bilumBase(ctx, S) {
  const r = S.rect, t = cellOf(S) * 0.3, c = cellOf(S), R = { x: r.x - t, y: r.y - t, w: r.w + 2 * t, h: r.h + 2 * t };
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = c * 0.9; ctx.shadowOffsetY = c * 0.3; ctx.fillStyle = '#120a06'; roundRectPath(ctx, R.x, R.y, R.w, R.h, c * 0.3); ctx.fill(); ctx.restore();
  loopRows(ctx, { x: R.x, y: R.y, w: R.w, h: t }, c, STRING, { lite: true, p: c / 2.2 }); loopRows(ctx, { x: R.x, y: r.y + r.h, w: R.w, h: t }, c, mix(STRING, '#8a4a2a', 0.3), { lite: true, p: c / 2.2 });
  const cols = S.colors; loopRows(ctx, { x: R.x, y: R.y, w: t, h: R.h }, c, cols[0] ?? '#b8282a', { lite: true, p: c / 2.2 }); loopRows(ctx, { x: r.x + r.w, y: R.y, w: t, h: R.h }, c, cols[1] ?? '#2a6a8a', { lite: true, p: c / 2.2 });
}
export function bilumGround(ctx, S) {
  const r = S.rect, c = cellOf(S), bg = mix(S.bg, STRING, 0.7); ctx.fillStyle = '#120a06'; ctx.fillRect(r.x, r.y, r.w, r.h);
  loopRows(ctx, r, c, (j) => shade(bg, (hash(j, 9) - 0.5) * 0.1), { lite: S.lite });
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,245,210,0.25)'); g.addColorStop(0.5, 'rgba(255,245,210,0)'); g.addColorStop(1, 'rgba(0,0,0,0.3)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
}
export function bilumSkin(ctx, S, d) {
  const { kind, col, x, y, s } = d, fill = isFilled(kind), c = cellOf(S), p = c / 2.2;
  if (!fill) { const lw = lineWidthOf(kind, s) * 1.2; ctx.save(); motifPath(ctx, kind, x, y, s * 1.04); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(10,4,0,0.8)'; ctx.lineWidth = lw + 2.4; ctx.stroke(); ctx.strokeStyle = shade(col, -0.3); ctx.lineWidth = lw + 0.6; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw * 0.8; ctx.stroke(); ctx.setLineDash([p * 0.35, p * 0.4]); ctx.strokeStyle = rgba(shade(col, -0.5), 0.5); ctx.lineWidth = lw * 0.8; ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = rgba(shade(col, 0.55), 0.7); ctx.lineWidth = Math.max(0.8, lw * 0.15); ctx.save(); ctx.translate(-lw * 0.12, -lw * 0.2); ctx.stroke(); ctx.restore(); ctx.restore(); return; }
  const s2 = s * 1.12; ctx.save(); motifPath(ctx, kind, x, y, s2); ctx.fillStyle = '#120a06'; ctx.fill(); ctx.clip();
  loopRows(ctx, { x: x - s, y: y - s, w: s * 2, h: s * 2 }, c, col, { lite: true, p });
  ctx.restore();
}
Object.assign(TOOLS, {
  // a long steel needle with a loop of string hooked on its tip; the loop is pulled through as the player places a stitch
  loopneedle(ctx, S, T) {
    const u = T.u, p = Math.max(0, 1 - T.a / 0.45), a = 0.7;
    soft(ctx, T.x + u * 0.9, T.y + u * 0.1, u * 1.1, u * 0.12);
    const ex = T.x + Math.sin(a) * u * 4.0, ey = T.y - Math.cos(a) * u * 4.0 - p * u * 0.05;
    rod(ctx, T.x, T.y, ex, ey, u * 0.1, '#cfd6dc'); rod(ctx, T.x + Math.sin(a) * u * 3.2, T.y - Math.cos(a) * u * 3.2, ex, ey, u * 0.22, '#7a5a30');
    ctx.save(); ctx.translate(T.x, T.y); ctx.strokeStyle = shade(T.col, -0.3); ctx.lineWidth = Math.max(2, u * 0.16); ctx.beginPath(); ctx.ellipse(u * 0.05, u * 0.18, u * 0.3, u * 0.5, 0.3, 0, TAU); ctx.stroke(); ctx.strokeStyle = T.col; ctx.lineWidth = Math.max(1.4, u * 0.11); ctx.stroke(); ctx.restore();
    sheenLine2(ctx, [[T.x + u * 0.3, T.y + u * 0.4], [T.x + u * 1.2, T.y + u * 0.9], [T.x + u * 2.2, T.y + u * 0.75]], Math.max(1.4, u * 0.1), T.col);
  },
});
function sheenLine2(ctx, pts, w, c) { ctx.save(); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...pts[0]); ctx.quadraticCurveTo(...pts[1], ...pts[2]); ctx.strokeStyle = shade(c, -0.4); ctx.lineWidth = w + 1; ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke(); ctx.strokeStyle = rgba(shade(c, 0.6), 0.7); ctx.lineWidth = Math.max(0.7, w * 0.25); ctx.stroke(); ctx.restore(); }
Object.assign(POT, {
  // a ball of twisted plant string wound in crossing turns
  stringball(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#0f1a12', 0.5); soft(ctx, cx + 2, cy + r * 0.6 + lift, r * 0.7, r * 0.18, 0.4);
    ctx.save(); ctx.translate(cx, cy + lift); const R = r * 0.68, g = ctx.createRadialGradient(-R * 0.35, -R * 0.4, 2, 0, 0, R); g.addColorStop(0, shade(col, 0.4)); g.addColorStop(0.6, col); g.addColorStop(1, shade(col, -0.55)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill(); ctx.clip();
    ctx.lineWidth = Math.max(1.2, R * 0.09); for (let k = -6; k < 7; k++) { ctx.strokeStyle = rgba(k % 2 ? shade(col, -0.35) : shade(col, 0.3), 0.6); ctx.beginPath(); ctx.ellipse(0, 0, R * (0.4 + 0.07 * Math.abs(k)), R * 1.1, k * 0.22, 0, TAU); ctx.stroke(); }
    ctx.restore(); ring(ctx, S, b, on);
  },
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// MAGIMAGI: coconut-husk fibre sennit. Cord is plaited flat in rows of chevrons (herringbone), laid side by side on a lashed frame in a dark house.
// ---------------------------------------------------------------------------------------------------------------------------------------------------
export const SENNIT = '#b58c55';
function braidRows(ctx, R, h, colFn, o = {}) { // horizontal rows of plaited cord, row height h
  h = Math.max(1.5, h); const rows = Math.ceil(R.h / h) + 1; ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let j = 0; j < rows; j++) {
    const y = R.y + j * h, cc = colFn(j), g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, shade(cc, 0.25)); g.addColorStop(0.35, cc); g.addColorStop(1, shade(cc, -0.5)); ctx.fillStyle = g; ctx.fillRect(R.x, y, R.w, h - Math.max(0.6, h * 0.06));
    const step = h * 0.62; ctx.beginPath(); for (let x = R.x - step; x < R.x + R.w + step; x += step) { ctx.moveTo(x, y + h * 0.88); ctx.lineTo(x + step / 2, y + h * 0.12); ctx.lineTo(x + step, y + h * 0.88); }
    ctx.strokeStyle = rgba(shade(cc, -0.62), 0.55); ctx.lineWidth = Math.max(0.9, h * 0.1); ctx.stroke();
    ctx.save(); ctx.translate(-h * 0.04, -h * 0.07); ctx.strokeStyle = rgba(shade(cc, 0.6), 0.55); ctx.lineWidth = Math.max(0.7, h * 0.05); ctx.stroke(); ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(R.x, y + h - Math.max(0.6, h * 0.06), R.w, Math.max(0.6, h * 0.06));
  }
  void o; ctx.restore();
}
const lashing = (ctx, x, y, w, h, cols) => { // a binding of cord round a pole: bands of colour and chevrons
  const n = Math.min(60, Math.max(3, Math.round(w / Math.max(1, h * 0.5)))); ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  for (let k = 0; k < n; k++) { const x0 = x + (k * w) / n; ctx.fillStyle = cols[k % cols.length]; ctx.fillRect(x0, y, w / n + 1, h); }
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(255,255,255,0.4)'); g.addColorStop(0.3, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k <= n; k++) { const x0 = x + (k * w) / n; ctx.moveTo(x0, y); ctx.lineTo(x0 + h * 0.15, y + h); } ctx.stroke(); ctx.restore();
};
export function magimagiEnv(ctx, S) {
  const a = S.area, X0 = a.x - 12, W = a.w + 24, c = cellOf(S);
  const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#2c1a0e'); g.addColorStop(1, '#150b05'); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, a.h);
  ctx.strokeStyle = 'rgba(190,140,70,0.2)'; ctx.lineWidth = Math.max(1.2, c * 0.05); ctx.beginPath(); for (let x = X0 - a.h; x < X0 + W; x += c * 0.34) { ctx.moveTo(x, a.y + a.h); ctx.lineTo(x + a.h * 0.7, a.y); } ctx.stroke(); // thatch seen from below
  glow(ctx, S.rect.x + S.rect.w / 2, S.rect.y + S.rect.h / 2, Math.max(a.w, a.h) * 0.75, '#ff9a3a', 0.4); glow(ctx, a.x + a.w * 0.5, a.y + a.h * 1.0, a.w, '#ffb050', 0.25); vignetteTo(ctx, a, 0.6);
  if (S.card) return;
  const cols = ['#1c1410', '#a03a20', '#e2cf9c', '#1c1410'], r = S.rect, land = isLand(S), pw = c * 0.62;
  const post = (x, y, w, h) => { const gr = ctx.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, '#6a4a2a'); gr.addColorStop(0.4, '#3a2412'); gr.addColorStop(1, '#150a04'); ctx.fillStyle = gr; ctx.fillRect(x, y, w, h); };
  if (land) { for (const x of [a.x + (r.x - a.x) * 0.45 - pw / 2, r.x + r.w + (a.x + a.w - r.x - r.w) * 0.55 - pw / 2]) { post(x, a.y, pw, a.h); for (let y = a.y + c * 1.1; y < a.y + a.h - c; y += c * 3.4) { ctx.save(); ctx.translate(x, y + c); ctx.rotate(-Math.PI / 2); lashing(ctx, 0, 0, c * 1.5, pw, cols); ctx.restore(); } } }
  else { const sw = Math.max(c * 0.3, (r.x - a.x) * 0.6); for (const x of [a.x + (r.x - a.x) * 0.2 - sw / 2 + sw * 0.3, r.x + r.w + (a.x + a.w - r.x - r.w) * 0.8 - sw / 2 - sw * 0.3]) post(x, a.y, sw, a.h); }
}
export function magimagiBase(ctx, S) {
  const r = S.rect, c = cellOf(S), t = c * 0.4, cols = ['#1c1410', '#a03a20', '#e2cf9c', '#1c1410'];
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = c * 0.7; ctx.shadowOffsetY = c * 0.2; ctx.fillStyle = '#0a0503'; ctx.fillRect(r.x - t * 0.3, r.y - t, r.w + t * 0.6, r.h + 2 * t); ctx.restore();
  for (const y of [r.y - t, r.y + r.h]) { const gr = ctx.createLinearGradient(0, y, 0, y + t); gr.addColorStop(0, '#7a5230'); gr.addColorStop(0.45, '#432a14'); gr.addColorStop(1, '#1a0e06'); ctx.fillStyle = gr; roundRectPath(ctx, r.x - t, y, r.w + 2 * t, t, t * 0.4); ctx.fill(); lashing(ctx, r.x - t * 0.1, y, c * 0.8, t, cols); lashing(ctx, r.x + r.w - c * 0.7, y, c * 0.8, t, cols); }
}
export function magimagiGround(ctx, S) {
  const r = S.rect, h = cellOf(S) / 3, m = mix(S.bg, SENNIT, 0.7);
  braidRows(ctx, r, h, (j) => shade(m, (hash(j, 5) - 0.5) * 0.12));
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,225,170,0.2)'); g.addColorStop(0.5, 'rgba(255,225,170,0)'); g.addColorStop(1, 'rgba(0,0,0,0.3)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
}
export function magimagiSkin(ctx, S, d) {
  const { kind, col, x, y, s } = d, fill = isFilled(kind), h = cellOf(S) / 3;
  if (!fill) { const lw = lineWidthOf(kind, s) * 1.2; ctx.save(); motifPath(ctx, kind, x, y, s * 1.04); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = lw + 2.4; ctx.stroke(); ctx.strokeStyle = shade(col, -0.45); ctx.lineWidth = lw + 0.8; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw * 0.8; ctx.stroke(); ctx.setLineDash([h * 0.3, h * 0.3]); ctx.strokeStyle = rgba(shade(col, -0.6), 0.6); ctx.lineWidth = lw * 0.8; ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = rgba(shade(col, 0.55), 0.7); ctx.lineWidth = Math.max(0.8, lw * 0.16); ctx.save(); ctx.translate(-lw * 0.12, -lw * 0.2); ctx.stroke(); ctx.restore(); ctx.restore(); return; }
  const s2 = s * 1.1; ctx.save(); motifPath(ctx, kind, x, y, s2); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.save(); ctx.translate(s * 0.02, s * 0.04); ctx.fill(); ctx.restore(); ctx.fillStyle = shade(col, -0.5); ctx.fill(); ctx.clip();
  braidRows(ctx, { x: x - s, y: y - s, w: s * 2, h: s * 2 }, h, (j) => shade(col, (hash(j, 7) - 0.5) * 0.1));
  ctx.restore();
}
Object.assign(TOOLS, {
  // a bone fid (a pointed spike for opening the plait) with a cord threaded through its eye
  fid(ctx, S, T) {
    const u = T.u, p = Math.max(0, 1 - T.a / 0.45), a = 0.6; soft(ctx, T.x + u * 0.8, T.y + u * 0.1, u * 1.0, u * 0.12);
    const ex = T.x + Math.sin(a) * u * 4.0, ey = T.y - Math.cos(a) * u * 4.0 - p * u * 0.04;
    ctx.save(); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(T.x, T.y); ctx.lineTo(ex, ey); ctx.strokeStyle = '#8a7a58'; ctx.lineWidth = u * 0.3; ctx.stroke(); ctx.strokeStyle = '#f0e6cc'; ctx.lineWidth = u * 0.22; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = u * 0.05; ctx.save(); ctx.translate(-u * 0.05, -u * 0.05); ctx.stroke(); ctx.restore(); ctx.restore();
    ball(ctx, ex, ey, u * 0.16, '#d8cba8', false);
    sheenLine2(ctx, [[ex, ey], [ex + u * 0.9, ey + u * 1.4], [ex + u * 0.4, ey + u * 2.6]], Math.max(2, u * 0.14), T.col);
  },
});
Object.assign(POT, {
  // a coil of cord: a flat spiral of plaited cord
  cordcoil(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#150b05', 0.5); soft(ctx, cx + 2, cy + r * 0.55 + lift, r * 0.8, r * 0.2, 0.4);
    ctx.save(); ctx.translate(cx, cy + lift); ctx.lineCap = 'round';
    for (let k = 0; k < 6; k++) { const rr = r * (0.76 - k * 0.11); ctx.strokeStyle = shade(col, -0.5); ctx.lineWidth = r * 0.11; ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.stroke(); ctx.strokeStyle = shade(col, k % 2 ? 0 : 0.1); ctx.lineWidth = r * 0.08; ctx.stroke(); ctx.setLineDash([r * 0.05, r * 0.05]); ctx.strokeStyle = rgba(shade(col, -0.6), 0.6); ctx.stroke(); ctx.setLineDash([]); }
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = r * 0.04; ctx.beginPath(); ctx.arc(0, 0, r * 0.7, Math.PI * 1.1, Math.PI * 1.5); ctx.stroke();
    ctx.restore(); ring(ctx, S, b, on);
  },
});
export { rod, ball, clamp, lines };

// shape-craft `pour` (1.26.0 Kitchen Crafts): shared drawing for the tea games: glass and porcelain vessels with a level of tea and froth, the falling
// stream as a lit ribbon, steam, a brass tray, a mosaic table. Pure canvas 2D; all irregularity from `hash`, all motion from the time handed in.
import { hash } from './geom.js';
import { rgba, tint, mix, rrect } from './fx.js';
import { lg, rg, ell, TAU } from './props.js';

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sm = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

// tea colour by strength 0 (pale green-gold) .. 0.5 (amber) .. 1 (dark red-brown): [deep, body, light]
const TEA = [[0.0, ['#a89a2a', '#d4c456', '#efe68a']], [0.3, ['#b4781a', '#e0a436', '#f6cf70']], [0.55, ['#8e4a0c', '#c97a1c', '#f0a940']], [0.8, ['#5a2406', '#8a3e10', '#c06a22']], [1, ['#2c1204', '#5a260a', '#8a4416']]];
export function teaColors(k) {
  const x = clamp(k, 0, 1);
  for (let i = 1; i < TEA.length; i++) if (x <= TEA[i][0]) { const [a, A] = TEA[i - 1], [b, B] = TEA[i], t = (x - a) / (b - a); return [mix(A[0], B[0], t), mix(A[1], B[1], t), mix(A[2], B[2], t)]; }
  return TEA[TEA.length - 1][1];
}

// ---- a tapered glass vessel: base centre (x, by), size s (px for one design unit), proportions from `V` -------------------------------------
// V = { wr, wb, H } in design units (rim half width, base half width, height); f runs 0 (base) .. 1 (rim); levels map to f in [fb, ft].
export const glassOf = (x, by, s, V) => ({ x, by, s, wr: V.wr * s, wb: V.wb * s, H: V.H * s, curve: V.curve ?? 1.2, ry: V.ry ?? 0.26, fb: V.fb ?? 0.06, ft: V.ft ?? 0.95, wall: (V.wall ?? 0.0036) * s });
export const wAt = (G, f) => G.wb + (G.wr - G.wb) * Math.pow(clamp(f, 0, 1), G.curve);
export const yAt = (G, f) => G.by - f * G.H;
export const fOf = (G, level) => G.fb + clamp(level, 0, 1.2) * (G.ft - G.fb);
const ryOf = (G, w) => w * G.ry;
function outline(ctx, G, inset, f1) {
  const N = 12; ctx.beginPath(); ctx.moveTo(G.x - (wAt(G, f1) - inset), yAt(G, f1));
  for (let i = 1; i <= N; i++) { const f = f1 * (1 - i / N); ctx.lineTo(G.x - (wAt(G, f) - inset), yAt(G, f)); }
  const wb = wAt(G, 0) - inset; ctx.ellipse(G.x, G.by, wb, ryOf(G, wb), 0, Math.PI, 0, true);
  for (let i = 1; i <= N; i++) { const f = (f1 * i) / N; ctx.lineTo(G.x + (wAt(G, f) - inset), yAt(G, f)); }
  ctx.closePath();
}
// the front half of the horizontal ellipse at fraction f (inset from the wall)
const frontArc = (ctx, G, f, inset = 0, a0 = 0, a1 = Math.PI) => { const w = wAt(G, f) - inset; ctx.ellipse(G.x, yAt(G, f), Math.max(0.5, w), Math.max(0.3, ryOf(G, w)), 0, a0, a1); };

// bubbles over an elliptical surface (froth): deterministic by seed
function bubbles(ctx, cx, cy, rx, ry, n, seed, size, a = 0.9, light = '#fff8e8', dark = '#e2c88c') {
  for (let k = 0; k < n; k++) {
    const u = Math.sqrt(hash(k, seed, 1)), th = hash(k, seed, 2) * TAU, r = size * (0.45 + hash(k, seed, 3) * 0.75);
    const x = cx + Math.cos(th) * u * (rx - r * 0.6), y = cy + Math.sin(th) * u * (ry - r * 0.35);
    ctx.fillStyle = rgba(dark, a * 0.55); ell(ctx, x + r * 0.12, y + r * 0.16, r, r * 0.8); ctx.fill();
    ctx.fillStyle = rgba(light, a); ell(ctx, x, y, r * 0.92, r * 0.74); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ell(ctx, x - r * 0.28, y - r * 0.22, r * 0.26, r * 0.18); ctx.fill();
  }
}

// back layer of a vessel (everything seen through the glass behind the stream): the liquid, its colour, the froth crown.
// o: { L: tea level 0..1, F: froth thickness in level units, tea: strength 0..1, t: time, seed, steam: 0..1, tint }
export function glassBack(ctx, G, o) {
  const [deep, body, light] = teaColors(o.tea ?? 0.5), { L = 0, F = 0 } = o, fl = fOf(G, L), ft = fOf(G, L + F);
  // the empty glass shows a hint of the table through it
  ctx.save(); outline(ctx, G, 0, 1); ctx.fillStyle = 'rgba(225,238,245,0.07)'; ctx.fill(); ctx.restore();
  if (L <= 0.003 && F <= 0.003) return;
  ctx.save(); outline(ctx, G, G.wall, Math.max(fl, G.fb + 0.01)); ctx.clip();
  const yb = G.by, yt = yAt(G, fl) - ryOf(G, wAt(G, fl)), xl = G.x - G.wr, xr = G.x + G.wr;
  // liquid body: darker at the base and edges, lighter and clearer under the surface, with a bright refraction core
  ctx.fillStyle = lg(ctx, 0, yt, 0, yb + 4, [[0, light], [0.35, body], [1, deep]]); ctx.fillRect(xl - 2, yt - 2, xr - xl + 4, yb - yt + 8);
  ctx.fillStyle = lg(ctx, xl, 0, xr, 0, [[0, 'rgba(30,10,0,0.5)'], [0.22, 'rgba(30,10,0,0)'], [0.62, 'rgba(255,230,160,0.0)'], [0.74, 'rgba(255,225,150,0.28)'], [0.88, 'rgba(255,225,150,0)'], [1, 'rgba(30,10,0,0.46)']]); ctx.fillRect(xl - 2, yt - 2, xr - xl + 4, yb - yt + 8);
  // light caught at the thick base
  ctx.fillStyle = rg(ctx, G.x, yb - G.H * 0.04, 1, G.wb * 1.3, [[0, 'rgba(255,236,170,0.65)'], [1, 'rgba(255,200,90,0)']]); ctx.fillRect(xl, yb - G.H * 0.2, xr - xl, G.H * 0.24);
  // mint leaves drifting in the tea
  for (let k = 0; k < 4; k++) { const lf = fl * (0.25 + hash(k, o.seed ?? 1, 5) * 0.6), lx = G.x + (hash(k, o.seed ?? 1, 6) - 0.5) * wAt(G, lf) * 1.4, ly = yAt(G, lf); ctx.save(); ctx.translate(lx, ly); ctx.rotate(hash(k, o.seed ?? 1, 7) * 3); ctx.fillStyle = rgba('#3f7a2c', 0.55); ell(ctx, 0, 0, G.s * 0.011, G.s * 0.0045); ctx.fill(); ctx.restore(); }
  // the surface under the froth: a lighter ellipse
  const w1 = wAt(G, fl) - G.wall, ys = yAt(G, fl);
  ctx.fillStyle = lg(ctx, 0, ys - ryOf(G, w1), 0, ys + ryOf(G, w1), [[0, mix(light, '#fff', 0.3)], [1, light]]); ell(ctx, G.x, ys, w1, ryOf(G, w1)); ctx.fill();
  ctx.restore();
  // froth: a cream crown above the tea, domed, with bubbles
  if (F > 0.004) {
    const wt = wAt(G, ft) - G.wall, yTop = yAt(G, ft), rt = ryOf(G, wt), dome = Math.min(G.H * 0.1, (ft - fl) * G.H * 1.3);
    ctx.save(); outline(ctx, G, G.wall, Math.min(ft, 1.04)); ctx.clip();
    ctx.fillStyle = lg(ctx, 0, yTop - rt, 0, ys + 2, [[0, '#fff6e2'], [0.5, '#f1dcae'], [1, '#d8b878']]); ctx.fillRect(xl - 2, yTop - rt - dome - 2, xr - xl + 4, ys - yTop + rt + dome + 6);
    ctx.fillStyle = lg(ctx, xl, 0, xr, 0, [[0, 'rgba(110,60,10,0.5)'], [0.25, 'rgba(110,60,10,0)'], [0.8, 'rgba(110,60,10,0)'], [1, 'rgba(110,60,10,0.5)']]); ctx.fillRect(xl - 2, yTop - rt - dome, xr - xl + 4, ys - yTop + rt + dome + 4);
    ctx.restore();
    // domed top surface
    ctx.save(); ctx.beginPath(); ctx.ellipse(G.x, yTop - dome * 0.35, wt, rt + dome * 0.6, 0, 0, TAU); ctx.fillStyle = rg(ctx, G.x - wt * 0.2, yTop - dome - rt * 0.3, 1, wt * 1.1, [[0, '#fffdf4'], [0.55, '#f6e6c2'], [1, '#d9bd84']]); ctx.fill(); ctx.clip();
    bubbles(ctx, G.x, yTop - dome * 0.35, wt, rt + dome * 0.6, Math.round(16 + F * 200), o.seed ?? 1, Math.max(1.6, G.s * 0.0075), 0.95);
    ctx.restore();
    ctx.strokeStyle = 'rgba(140,90,30,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(G.x, yTop - dome * 0.35, wt, rt + dome * 0.6, 0, 0.1, Math.PI - 0.1); ctx.stroke();
  } else if (L > 0.02) { // a thin ring of foam at the edge of the tea
    ctx.save(); ctx.strokeStyle = 'rgba(255,244,214,0.75)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(G.x, ys, w1 - 1, ryOf(G, w1) - 0.5, 0, 0, TAU); ctx.stroke(); ctx.restore();
  }
}

// front layer: the glass wall, rim, base lens, highlights, gilt decoration, the mint sprig. o: { v: decoration 0..2, sprig: bool, seed, hot }
export function glassFront(ctx, G, o = {}) {
  const v = (o.v ?? 0) % 3, gold = ['#f2cf6a', '#e8c25a', '#f6d878'][v], enamel = ['#f6d878', '#c8321f', '#1f8a5c'][v];
  // the wall: a thin darker edge, a clear glass body with a light film
  ctx.save(); outline(ctx, G, 0, 1); ctx.strokeStyle = 'rgba(40,24,6,0.45)'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = lg(ctx, G.x - G.wr, 0, G.x + G.wr, 0, [[0, 'rgba(255,255,255,0.22)'], [0.18, 'rgba(255,255,255,0.03)'], [0.8, 'rgba(255,255,255,0.03)'], [1, 'rgba(255,255,255,0.2)']]); outline(ctx, G, 0, 1); ctx.fill(); ctx.restore();
  // thick glass base
  ctx.save(); outline(ctx, G, 0, 0.1); ctx.clip(); ctx.fillStyle = lg(ctx, 0, yAt(G, 0.1), 0, G.by + 3, [[0, 'rgba(255,255,255,0.05)'], [1, 'rgba(255,255,255,0.4)']]); ctx.fillRect(G.x - G.wr, yAt(G, 0.12), G.wr * 2, G.H * 0.14);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); frontArc(ctx, G, 0.07, G.wall * 0.6, 0.2, Math.PI - 0.2); ctx.stroke(); ctx.restore();
  // gilt decoration: bands of fine lines with a row of diamonds (or enamel dots), on the front of the glass
  const band = (f0, f1, dots) => {
    ctx.save(); outline(ctx, G, G.wall * 0.3, 1); ctx.clip();
    for (const f of [f0, f1]) { ctx.beginPath(); frontArc(ctx, G, f, 0, 0.12, Math.PI - 0.12); ctx.strokeStyle = rgba(gold, 0.95); ctx.lineWidth = Math.max(1.2, G.s * 0.0034); ctx.stroke(); }
    const fm = (f0 + f1) / 2, w = wAt(G, fm), n = 9;
    for (let k = 0; k <= n; k++) {
      const th = 0.32 + (k / n) * (Math.PI - 0.64), x = G.x - Math.cos(th) * w * 0.94, y = yAt(G, fm) + Math.sin(th) * ryOf(G, w) * 0.94, sz = G.H * (f1 - f0) * 0.38 * Math.sin(th * 0.5 + 0.9);
      ctx.fillStyle = rgba(dots ? enamel : gold, 0.95);
      if (dots) { ell(ctx, x, y, sz * 0.7, sz * 0.7); ctx.fill(); } else { ctx.beginPath(); ctx.moveTo(x, y - sz); ctx.lineTo(x + sz * 0.62, y); ctx.lineTo(x, y + sz); ctx.lineTo(x - sz * 0.62, y); ctx.closePath(); ctx.fill(); }
    }
    ctx.restore();
  };
  band(0.72, 0.88, v === 1); band(0.26, 0.36, v !== 1);
  // vertical highlights (a window reflection) and a soft rim light on the right
  ctx.save(); outline(ctx, G, G.wall * 0.5, 1); ctx.clip();
  ctx.fillStyle = lg(ctx, 0, G.by - G.H, 0, G.by, [[0, 'rgba(255,255,255,0.9)'], [0.6, 'rgba(255,255,255,0.45)'], [1, 'rgba(255,255,255,0.1)']]); rrect(ctx, G.x - G.wr * 0.7, G.by - G.H * 0.95, G.wr * 0.13, G.H * 0.78, G.wr * 0.06); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.32)'; rrect(ctx, G.x - G.wr * 0.5, G.by - G.H * 0.95, G.wr * 0.05, G.H * 0.5, 1); ctx.fill();
  ctx.fillStyle = 'rgba(255,240,200,0.32)'; rrect(ctx, G.x + G.wr * 0.62, G.by - G.H * 0.86, G.wr * 0.07, G.H * 0.62, 2); ctx.fill();
  ctx.restore();
  // rim: a bright lip, front arc bold, back arc faint
  const wr = G.wr, ry = ryOf(G, wr);
  ctx.beginPath(); ctx.ellipse(G.x, yAt(G, 1), wr, ry, 0, Math.PI, TAU); ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(G.x, yAt(G, 1), wr, ry, 0, 0, Math.PI); ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 2.2; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(G.x, yAt(G, 1) + 0.6, wr - 1.5, ry - 0.5, 0, 0.1, Math.PI - 0.1); ctx.strokeStyle = 'rgba(120,170,200,0.45)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.95)'; ell(ctx, G.x - wr * 0.78, yAt(G, 1) + ry * 0.55, 2.2, 1.2); ctx.fill();
  if (o.sprig) { // a sprig of fresh mint leaning out over the rim
    const sx = G.x + G.wr * 0.55, sy = yAt(G, 0.75), ex = sx + G.s * 0.03, ey = yAt(G, 1) - G.s * 0.058;
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = '#2f5a22'; ctx.lineWidth = Math.max(1.5, G.s * 0.0034); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + G.s * 0.006, (sy + ey) / 2, ex, ey); ctx.stroke();
    for (let k = 0; k < 6; k++) {
      const u = 0.35 + k * 0.13, px = lerp(sx, ex, u * u), py = lerp(sy, ey, u), side = k % 2 ? 1 : -1, a = -Math.PI / 2 + side * (0.85 - k * 0.07), len = G.s * (0.026 - k * 0.0012);
      ctx.save(); ctx.translate(px, py); ctx.rotate(a); ctx.fillStyle = lg(ctx, 0, -len * 0.4, 0, len * 0.4, [[0, '#7ac24c'], [1, '#2f7a2c']]); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, -len * 0.5, len, 0); ctx.quadraticCurveTo(len * 0.5, len * 0.5, 0, 0); ctx.fill(); ctx.strokeStyle = 'rgba(20,60,16,0.5)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len * 0.9, 0); ctx.stroke(); ctx.restore();
    }
    ctx.restore();
  }
}

// ---- the falling stream: pts [{x, y, w}] from the spout downward (px), colour from teaColors -------------------------------------------------
export function drawStream(ctx, pts, tea, alpha = 1, lit = 1) {
  if (pts.length < 2) return;
  const [deep, body, light] = Array.isArray(tea) ? tea : teaColors(tea);
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = alpha;
  const pass = (col, k, dx = 0) => { for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; if (a.skip || b.skip) continue; ctx.strokeStyle = col; ctx.lineWidth = Math.max(0.8, (a.w + b.w) * 0.5 * k); ctx.beginPath(); ctx.moveTo(a.x + dx * a.w, a.y); ctx.lineTo(b.x + dx * b.w, b.y); ctx.stroke(); } };
  pass(rgba(deep, 0.6), 1.0); pass(rgba(body, 0.9), 0.74); pass(rgba(light, 0.95), 0.4, 0.05); pass(`rgba(255,250,225,${0.9 * lit})`, 0.16, -0.22);
  ctx.restore();
}

// steam: soft white curls rising from a point; the caller emits particles, this draws a static wisp for objects that always steam
export function wisp(ctx, x, y, h, t, a = 0.3, seed = 1) {
  ctx.save(); ctx.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    const ph = t * 0.7 + k * 0.33 + hash(k, seed) , u = ph - Math.floor(ph), sway = Math.sin(t * 1.3 + k * 2 + seed) * h * 0.1;
    const yy = y - u * h, al = a * Math.sin(u * Math.PI);
    ctx.strokeStyle = `rgba(255,255,255,${al})`; ctx.lineWidth = h * 0.07 * (0.6 + u); ctx.beginPath(); ctx.moveTo(x + (k - 1) * h * 0.07, yy + h * 0.14); ctx.bezierCurveTo(x + sway + (k - 1) * h * 0.1, yy + h * 0.08, x - sway, yy - h * 0.06, x + sway * 0.6 + (k - 1) * h * 0.12, yy - h * 0.14); ctx.stroke();
  }
  ctx.restore();
}

// ---- a round brass tray in three quarter view: centre (cx, cy), half width rx, half height ry ---------------------------------------------------
export function brassTray(ctx, cx, cy, rx, ry, t = 0) {
  const lip = ry * 0.34;
  ctx.save();
  // cast shadow and the thickness of the rim
  ctx.fillStyle = 'rgba(20,10,0,0.5)'; ell(ctx, cx + rx * 0.03, cy + lip * 1.5, rx * 1.02, ry * 1.05); ctx.fill();
  ctx.fillStyle = lg(ctx, cx - rx, 0, cx + rx, 0, [[0, '#7a5416'], [0.4, '#d9ac48'], [0.7, '#a37a26'], [1, '#5c3c0c']]); ell(ctx, cx, cy + lip, rx, ry); ctx.fill();
  // rim top (a ring, scalloped by dots)
  ctx.fillStyle = lg(ctx, cx - rx, cy - ry, cx + rx, cy + ry, [[0, '#fbe9a4'], [0.35, '#d9ac48'], [0.7, '#b0842c'], [1, '#7a5416']]); ell(ctx, cx, cy, rx, ry); ctx.fill();
  // inner dish
  const ix = rx * 0.9, iy = ry * 0.84;
  ctx.fillStyle = lg(ctx, cx - ix, cy - iy, cx + ix * 0.9, cy + iy, [[0, '#8a6218'], [0.45, '#d4a540'], [1, '#e8c460']]); ell(ctx, cx, cy + ry * 0.04, ix, iy); ctx.fill();
  ctx.fillStyle = rg(ctx, cx - ix * 0.25, cy - iy * 0.3, 2, ix * 1.1, [[0, 'rgba(255,244,190,0.5)'], [0.6, 'rgba(255,230,150,0.08)'], [1, 'rgba(60,30,0,0.35)']]); ell(ctx, cx, cy + ry * 0.04, ix, iy); ctx.fill();
  // engraving: concentric bands, a ring of petals, a rosette
  ctx.save(); ell(ctx, cx, cy + ry * 0.04, ix, iy); ctx.clip();
  ctx.strokeStyle = 'rgba(70,40,4,0.4)'; ctx.lineWidth = 1.3;
  for (const k of [0.96, 0.84, 0.5, 0.36]) { ell(ctx, cx, cy + ry * 0.04, ix * k, iy * k); ctx.stroke(); }
  ctx.fillStyle = 'rgba(80,46,6,0.34)';
  for (let k = 0; k < 28; k++) { const a = (k / 28) * TAU, px = cx + Math.cos(a) * ix * 0.9, py = cy + ry * 0.04 + Math.sin(a) * iy * 0.9, ux = Math.cos(a), uy = Math.sin(a); ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px - ux * ix * 0.07 + -uy * ix * 0.03, py - uy * iy * 0.07 + ux * iy * 0.03, px - ux * ix * 0.12, py - uy * iy * 0.12); ctx.quadraticCurveTo(px - ux * ix * 0.07 + uy * ix * 0.03, py - uy * iy * 0.07 - ux * iy * 0.03, px, py); ctx.fill(); }
  for (let k = 0; k < 14; k++) { const a = (k / 14) * TAU + 0.1; ctx.fillStyle = 'rgba(255,236,170,0.3)'; ell(ctx, cx + Math.cos(a) * ix * 0.67, cy + ry * 0.04 + Math.sin(a) * iy * 0.67, ix * 0.016, iy * 0.022); ctx.fill(); }
  ctx.restore();
  // sheen: a diagonal glint that drifts slowly
  ctx.save(); ell(ctx, cx, cy, rx, ry); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
  const gx = cx + Math.sin(t * 0.3) * rx * 0.3; ctx.fillStyle = lg(ctx, gx - rx * 0.4, cy - ry, gx - rx * 0.1, cy + ry, [[0, 'rgba(255,240,190,0)'], [0.5, 'rgba(255,240,190,0.22)'], [1, 'rgba(255,240,190,0)']]); ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,244,200,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(cx, cy, rx - 1, ry - 0.5, 0, Math.PI * 1.05, Math.PI * 1.9); ctx.stroke();
  ctx.restore();
}

// ---- a round mosaic table (zellige): tabletop ellipse with a ring of coloured tiles and a thick edge ----------------------------------------------
export function mosaicTable(ctx, cx, cy, rx, ry, pal = ['#1f6f8a', '#e8e0cc', '#b8431f', '#2c8a5c', '#f0b83a', '#1c3f8f']) {
  const th = ry * 0.5;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, cx, cy + th + ry * 0.35, rx * 1.04, ry * 0.9); ctx.fill();
  // legs hint: a dark pedestal
  ctx.fillStyle = lg(ctx, cx - rx * 0.2, 0, cx + rx * 0.2, 0, [[0, '#2a1a0c'], [0.5, '#5a3a1c'], [1, '#2a1a0c']]); ctx.fillRect(cx - rx * 0.12, cy + th, rx * 0.24, ry * 1.6);
  // edge band
  ctx.fillStyle = lg(ctx, cx - rx, 0, cx + rx, 0, [[0, '#3a2410'], [0.3, '#8a5a2a'], [0.6, '#5a3a1a'], [1, '#2a180a']]); ell(ctx, cx, cy + th, rx, ry); ctx.fill();
  ctx.fillRect(cx - rx, cy, rx * 2, th); ctx.beginPath(); ctx.ellipse(cx, cy + th, rx, ry, 0, 0, Math.PI); ctx.fillStyle = lg(ctx, cx - rx, 0, cx + rx, 0, [[0, '#2a1a0c'], [0.3, '#8a5a2a'], [0.6, '#5a3a1a'], [1, '#22140a']]); ctx.fill();
  ctx.fillStyle = lg(ctx, cx - rx, 0, cx + rx, 0, [[0, '#6a4410'], [0.35, '#d4a840'], [0.7, '#9a7424'], [1, '#5a3a0c']]); ctx.fillRect(cx - rx, cy + th * 0.55, rx * 2, th * 0.2);
  // top: brass ring, then the mosaic
  ctx.fillStyle = lg(ctx, cx - rx, cy - ry, cx + rx, cy + ry, [[0, '#f0d078'], [0.5, '#b88a2c'], [1, '#6a4a10']]); ell(ctx, cx, cy, rx, ry); ctx.fill();
  const mx = rx * 0.95, my = ry * 0.93;
  ctx.save(); ell(ctx, cx, cy, mx, my); ctx.clip(); ctx.fillStyle = '#e6dcc0'; ctx.fillRect(cx - mx, cy - my, mx * 2, my * 2);
  const rings = 5, secs = 32;
  for (let i = 0; i < rings; i++) for (let k = 0; k < secs; k++) {
    const r0 = 0.2 + (i / rings) * 0.8, r1 = 0.2 + ((i + 0.9) / rings) * 0.8, a0 = (k / secs) * TAU, a1 = ((k + 0.9) / secs) * TAU, c = pal[(i * 2 + (k % 2) * 3 + ((k >> 1) % 2)) % pal.length];
    ctx.fillStyle = (i + k) % 5 === 0 ? '#f6efd8' : c; ctx.beginPath();
    for (const [r, a] of [[r0, a0], [r1, a0], [r1, a1], [r0, a1]]) ctx.lineTo(cx + Math.cos(a) * r * mx, cy + Math.sin(a) * r * my); ctx.closePath(); ctx.fill();
  }
  // centre star
  ctx.fillStyle = '#b8431f'; ctx.beginPath(); for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU, r = k % 2 ? 0.1 : 0.2; ctx.lineTo(cx + Math.cos(a) * r * mx, cy + Math.sin(a) * r * my); } ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.1)'; ell(ctx, cx, cy + my * 0.2, mx, my * 0.9); ctx.fill();
  ctx.fillStyle = rg(ctx, cx - mx * 0.3, cy - my * 0.4, 2, mx * 1.2, [[0, 'rgba(255,240,200,0.3)'], [1, 'rgba(255,240,200,0)']]); ell(ctx, cx, cy, mx, my); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,240,180,0.7)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(cx, cy, rx - 0.5, ry - 0.3, 0, Math.PI * 1.05, Math.PI * 1.85); ctx.stroke();
  ctx.restore();
}

// ---- a woven rug seen in perspective (far edge y0 with half-width w0, near edge y1 with half-width w1, centre x) ------------------------------------
export function rug(ctx, cx, y0, y1, w0, w1, pal = { field: '#d8c6a0', red: '#8a3422', ink: '#26325f', gold: '#c99a3c' }) {
  const P = (u, v) => [cx + (u - 0.5) * 2 * (w0 + (w1 - w0) * v), y0 + (y1 - y0) * v];
  const quad = (u0, v0, u1, v1, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(...P(u0, v0)); ctx.lineTo(...P(u1, v0)); ctx.lineTo(...P(u1, v1)); ctx.lineTo(...P(u0, v1)); ctx.closePath(); ctx.fill(); };
  const poly = (pts, col) => { ctx.fillStyle = col; ctx.beginPath(); pts.forEach(([u, v], i) => (i ? ctx.lineTo(...P(u, v)) : ctx.moveTo(...P(u, v)))); ctx.closePath(); ctx.fill(); };
  ctx.save();
  // soft shadow onto the floor and the fringe
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.moveTo(...P(-0.01, 0.0)); ctx.lineTo(...P(1.01, 0.0)); ctx.lineTo(...P(1.01, 1.03)); ctx.lineTo(...P(-0.01, 1.03)); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#efe4c6'; ctx.lineWidth = 1.6; ctx.beginPath(); for (const v of [0, 1]) for (let k = 0; k <= 46; k++) { const [x, y] = P(k / 46, v); ctx.moveTo(x, y); ctx.lineTo(x + (hash(k, v, 7) - 0.5) * 2, y + (v ? 9 : -6)); } ctx.stroke();
  quad(0, 0, 1, 1, pal.red); quad(0.035, 0.05, 0.965, 0.95, pal.ink); quad(0.05, 0.07, 0.95, 0.93, pal.field);
  // zig-zag inner border
  for (let k = 0; k < 24; k++) { const u0 = 0.05 + (k / 24) * 0.9, u1 = 0.05 + ((k + 1) / 24) * 0.9; poly([[u0, 0.07], [u1, 0.07], [(u0 + u1) / 2, 0.14]], k % 2 ? pal.red : pal.ink); poly([[u0, 0.93], [u1, 0.93], [(u0 + u1) / 2, 0.86]], k % 2 ? pal.ink : pal.red); }
  // three large diamonds with a red heart and gold dots
  for (const u of [0.2, 0.5, 0.8]) { const r = u === 0.5 ? 0.2 : 0.14; poly([[u, 0.5 - 0.3], [u + r, 0.5], [u, 0.5 + 0.3], [u - r, 0.5]], pal.ink); poly([[u, 0.5 - 0.23], [u + r * 0.78, 0.5], [u, 0.5 + 0.23], [u - r * 0.78, 0.5]], pal.field); poly([[u, 0.5 - 0.13], [u + r * 0.45, 0.5], [u, 0.5 + 0.13], [u - r * 0.45, 0.5]], pal.red); const [gx, gy] = P(u, 0.5); ctx.fillStyle = pal.gold; ell(ctx, gx, gy, Math.max(2, (w0 + w1) * 0.012), Math.max(1.2, (y1 - y0) * 0.02)); ctx.fill(); }
  for (let k = 0; k < 18; k++) { const u = 0.07 + (k / 17) * 0.86; for (const v of [0.22, 0.78]) { const [x, y] = P(u, v); ctx.fillStyle = k % 2 ? pal.red : pal.gold; ell(ctx, x, y, 2.4, 1.4); ctx.fill(); } }
  // weave and wear
  ctx.strokeStyle = 'rgba(60,30,10,0.07)'; ctx.lineWidth = 1; ctx.beginPath(); for (let v = 0; v < 1; v += 0.012) { ctx.moveTo(...P(0, v)); ctx.lineTo(...P(1, v)); } ctx.stroke();
  ctx.fillStyle = lg(ctx, 0, y0, 0, y1, [[0, 'rgba(20,8,0,0.35)'], [0.5, 'rgba(20,8,0,0)'], [1, 'rgba(255,220,150,0.08)']]); ctx.beginPath(); ctx.moveTo(...P(0, 0)); ctx.lineTo(...P(1, 0)); ctx.lineTo(...P(1, 1)); ctx.lineTo(...P(0, 1)); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ---- the room behind the work: the scene's wall drawn tall up to a horizon, a floor line, a beam of light -------------------------------------------
import { EXT } from './registry.js';
export function roomBackdrop(ctx, SC, r, hor, t) {
  const wf = EXT.walls[SC.wall]; if (!wf) return;
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, hor - r.y); ctx.clip(); wf(ctx, SC, { x: r.x, y: r.y, w: r.w, h: hor - r.y }, hor - r.y, t); ctx.restore();
  ctx.fillStyle = lg(ctx, 0, hor - 2, 0, hor + 16, [[0, 'rgba(0,0,0,0.55)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(r.x, hor - 2, r.w, 18); ctx.fillStyle = 'rgba(255,240,200,0.2)'; ctx.fillRect(r.x, hor - 3, r.w, 2);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(r.x + r.w * 0.1, r.y, r.x + r.w * 0.55, hor + 80); g.addColorStop(0, 'rgba(255,230,170,0.14)'); g.addColorStop(1, 'rgba(255,230,170,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(r.x + r.w * 0.05, r.y); ctx.lineTo(r.x + r.w * 0.38, r.y); ctx.lineTo(r.x + r.w * 0.8, hor + 120); ctx.lineTo(r.x + r.w * 0.3, hor + 120); ctx.closePath(); ctx.fill(); ctx.restore();
}

// A canvas context that clamps negative radii to zero (browsers throw on them). Used only when the work area is tiny (the About page preview),
// where insets such as a glass wall can exceed the size of what they are cut from.
export function safeCtx(ctx) {
  const m = (t, k) => {
    const f = t[k].bind(t);
    if (k === 'ellipse') return (x, y, rx, ry, ...r) => f(x, y, Math.max(0, rx), Math.max(0, ry), ...r);
    if (k === 'arc') return (x, y, rad, ...r) => f(x, y, Math.max(0, rad), ...r);
    if (k === 'arcTo') return (x1, y1, x2, y2, rad) => f(x1, y1, x2, y2, Math.max(0, rad));
    if (k === 'createRadialGradient') return (x0, y0, r0, x1, y1, r1) => f(x0, y0, Math.max(0, r0), x1, y1, Math.max(0, r1));
    return f;
  };
  return new Proxy(ctx, { get: (t, k) => (typeof t[k] === 'function' ? m(t, k) : t[k]), set: (t, k, v) => { t[k] = v; return true; } });
}
export const tinyArea = (r) => r.w < 300 || r.h < 330;

// Scene art, 1.13.0 (saris and shawls II), part 2: the Himalayan wool shawl (Kullu). A timber frame loom in a log house with a snowy pine window and an iron stove;
// napped soft wool twill with twisted tassels and stepped geometric border bands (patti). Pure canvas 2D, no Math.random, no figures, no text.
import { hash, rgba, mix, shade, lum, roundRectPath, rod, ball, speck, glow, vignette, TAU, motifPath, isFilled, lineWidthOf, clamp, sheenLine, poly, POT } from './scene-kit.js';
import { TOOLS } from './scene-tools.js';
import { beam, castShadow, thread, isLand } from './scene-loom.js';
import { insideTest } from './scene-needle.js';
import { bx, ring, back, softE, pressOf, G } from './scene-sari3.js';

const clipTo = (ctx, r) => { ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); };

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// supplies and tool
// ---------------------------------------------------------------------------------------------------------------------------------------------------
Object.assign(POT, {
  // a ball of thick wool: wound in three directions, a hairy halo and a loose tail
  woolcake(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0, R = r * 0.62; back(ctx, b, '#2a1c12', 0.5);
    ctx.save(); ctx.translate(cx, cy + lift);
    softE(ctx, R * 0.2, R * 1.0, R * 1.0, R * 0.26, 0.38);
    const g = ctx.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R * 1.05); g.addColorStop(0, shade(col, 0.4)); g.addColorStop(0.55, col); g.addColorStop(1, shade(col, -0.55)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip(); ctx.lineWidth = Math.max(1, R * 0.07);
    for (let k = 0; k < 3; k++) { ctx.strokeStyle = rgba(shade(col, -0.55), 0.5); ctx.beginPath(); for (let q = -5; q <= 5; q++) { ctx.moveTo(-R * 1.2, q * R * 0.2 + k * 3); ctx.quadraticCurveTo(0, q * R * 0.2 + R * 0.3 * (k - 1), R * 1.2, q * R * 0.2 - k * 2); } ctx.save(); ctx.rotate(k * 1.05); ctx.stroke(); ctx.restore(); }
    ctx.strokeStyle = rgba(shade(col, 0.7), 0.4); ctx.lineWidth = Math.max(0.7, R * 0.035); ctx.beginPath(); for (let q = -4; q <= 4; q++) { ctx.moveTo(-R * 1.1, q * R * 0.24 - 2); ctx.quadraticCurveTo(0, q * R * 0.24 - R * 0.2, R * 1.1, q * R * 0.24 - 3); } ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = rgba(shade(col, 0.5), 0.55); ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 46; k++) { const a = hash(k, 3) * TAU, d = R * (0.97 + hash(k, 4) * 0.08), l = R * (0.06 + hash(k, 5) * 0.1); ctx.moveTo(Math.cos(a) * d, Math.sin(a) * d); ctx.lineTo(Math.cos(a + 0.2) * (d + l), Math.sin(a + 0.2) * (d + l)); } ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, R * 0.13); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(R * 0.7, R * 0.6); ctx.quadraticCurveTo(R * 1.2, R * 0.9, R * 1.05, R * 1.25); ctx.stroke(); ctx.strokeStyle = rgba(shade(col, 0.6), 0.6); ctx.lineWidth = Math.max(0.7, R * 0.04); ctx.beginPath(); ctx.moveTo(R * 0.7, R * 0.55); ctx.quadraticCurveTo(R * 1.15, R * 0.85, R * 1.0, R * 1.2); ctx.stroke();
    ctx.restore(); ring(ctx, S, b, on);
  },
});
Object.assign(TOOLS, {
  // a long bone needle with a thick strand of wool through its eye; the point is the tip
  woolneedle(ctx, S, T) {
    const u = T.u, p = pressOf(T), lift = (1 - p) * u * 0.3, a = 0.7, L = u * 3.6;
    softE(ctx, T.x + u * 0.8, T.y + u * 0.1, u * 1.1, u * 0.09);
    ctx.save(); ctx.translate(T.x, T.y - lift); ctx.rotate(a);
    // the strand trails down from the eye, looping to the point on the cloth
    ctx.strokeStyle = T.col; ctx.lineWidth = Math.max(2, u * 0.12); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -L * 0.86); ctx.bezierCurveTo(u * 0.5, -L * 0.5 + Math.sin(T.t * 2) * u * 0.05, -u * 0.55, -L * 0.2, 0, u * 0.1); ctx.stroke();
    ctx.strokeStyle = rgba(shade(T.col, 0.6), 0.7); ctx.lineWidth = Math.max(0.7, u * 0.035); ctx.beginPath(); ctx.moveTo(-1, -L * 0.86); ctx.bezierCurveTo(u * 0.46, -L * 0.5, -u * 0.6, -L * 0.2, -1, u * 0.1); ctx.stroke();
    const g = ctx.createLinearGradient(-u * 0.1, 0, u * 0.1, 0); g.addColorStop(0, '#fffaf0'); g.addColorStop(0.5, '#e4d8bc'); g.addColorStop(1, '#8a7a56'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(u * 0.1, -L * 0.18); ctx.lineTo(u * 0.1, -L); ctx.lineTo(-u * 0.1, -L); ctx.lineTo(-u * 0.1, -L * 0.18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2a1c10'; ctx.beginPath(); ctx.ellipse(0, -L * 0.9, u * 0.045, u * 0.2, 0, 0, TAU); ctx.fill();
    ctx.restore();
  },
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// environment: a log house in the mountains. Dark timber wall, a wide window onto snow and pines, an iron stove glowing at the side, plank floor
// ---------------------------------------------------------------------------------------------------------------------------------------------------
function pine(ctx, x, yb, h, w) {
  const tiers = 4; ctx.save();
  ctx.fillStyle = '#4a3220'; ctx.fillRect(x - w * 0.04, yb - h * 0.12, w * 0.08, h * 0.14);
  for (let t = 0; t < tiers; t++) {
    const y1 = yb - h * 0.1 - (h * 0.84 * t) / tiers, y0 = y1 - (h * 0.5) / (1 + t * 0.15), tw = w * (1 - t * 0.2) * 0.5;
    const g = ctx.createLinearGradient(x - tw, 0, x + tw, 0); g.addColorStop(0, '#2f5a42'); g.addColorStop(1, '#173026'); ctx.fillStyle = g; poly(ctx, [[x, y0], [x + tw, y1], [x - tw, y1]]); ctx.fill();
    ctx.fillStyle = 'rgba(248,252,255,0.92)'; poly(ctx, [[x, y0], [x + tw * 0.62, y0 + (y1 - y0) * 0.55], [x + tw * 0.2, y0 + (y1 - y0) * 0.5], [x - tw * 0.1, y0 + (y1 - y0) * 0.66], [x - tw * 0.62, y0 + (y1 - y0) * 0.55]]); ctx.fill();
  }
  ctx.restore();
}
function stove(ctx, x, yF, c) {
  const w = c * 0.95, h = c * 1.0;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x + w * 0.1, yF + c * 0.04, w * 0.7, c * 0.13, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#17171a'; for (const dx of [-0.38, 0.38]) ctx.fillRect(x + w * dx - c * 0.05, yF - c * 0.18, c * 0.1, c * 0.2);
  const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, '#4a4a52'); g.addColorStop(0.35, '#26262b'); g.addColorStop(1, '#0e0e10'); ctx.fillStyle = g; roundRectPath(ctx, x - w / 2, yF - c * 0.18 - h, w, h, c * 0.07); ctx.fill();
  ctx.fillStyle = '#3a3a42'; roundRectPath(ctx, x - w / 2 - c * 0.04, yF - c * 0.18 - h - c * 0.06, w + c * 0.08, c * 0.1, c * 0.04); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x - w / 2, yF - c * 0.18 - h - c * 0.06, w * 0.8, Math.max(1, c * 0.025));
  // the door: a glowing slot
  const dx = x - w * 0.26, dy = yF - c * 0.18 - h * 0.7, dw = w * 0.52, dh = h * 0.42; ctx.fillStyle = '#0a0a0c'; roundRectPath(ctx, dx - c * 0.04, dy - c * 0.04, dw + c * 0.08, dh + c * 0.08, c * 0.05); ctx.fill();
  const og = ctx.createLinearGradient(0, dy, 0, dy + dh); og.addColorStop(0, '#ffd27a'); og.addColorStop(0.5, '#ff8a2a'); og.addColorStop(1, '#c4380e'); ctx.fillStyle = og; roundRectPath(ctx, dx, dy, dw, dh, c * 0.04); ctx.fill();
  ctx.fillStyle = '#17171a'; ctx.fillRect(dx + dw * 0.3, dy, c * 0.04, dh); ctx.fillRect(dx + dw * 0.66, dy, c * 0.04, dh);
  // flue pipe going up the wall, and a copper kettle on the plate
  rod(ctx, x + w * 0.2, yF - c * 0.18 - h - c * 0.06, x + w * 0.2, yF - c * 0.18 - h - c * 4, c * 0.16, '#34343a');
  const kx = x - w * 0.12, ky = yF - c * 0.18 - h - c * 0.06; const kg = ctx.createLinearGradient(kx - c * 0.22, 0, kx + c * 0.22, 0); kg.addColorStop(0, '#f0b27a'); kg.addColorStop(0.5, '#c8793a'); kg.addColorStop(1, '#6d3a14'); ctx.fillStyle = kg; ctx.beginPath(); ctx.moveTo(kx - c * 0.2, ky); ctx.quadraticCurveTo(kx - c * 0.28, ky - c * 0.28, kx - c * 0.1, ky - c * 0.34); ctx.lineTo(kx + c * 0.1, ky - c * 0.34); ctx.quadraticCurveTo(kx + c * 0.28, ky - c * 0.28, kx + c * 0.2, ky); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#c8793a'; ctx.lineWidth = Math.max(1.5, c * 0.04); ctx.beginPath(); ctx.moveTo(kx + c * 0.2, ky - c * 0.1); ctx.quadraticCurveTo(kx + c * 0.4, ky - c * 0.18, kx + c * 0.3, ky - c * 0.34); ctx.stroke(); ctx.beginPath(); ctx.arc(kx, ky - c * 0.34, c * 0.14, Math.PI, 0); ctx.stroke();
}
export function shawlEnv(ctx, S) {
  const a = S.area, B = S.box, c = S.cell, X0 = a.x - 12, W = a.w + 24, yF = B.y + B.h * 0.86;
  clipTo(ctx, { x: X0, y: a.y, w: W, h: a.h });
  // the log wall: horizontal round logs, lit along the top, shadowed below, chinked, with a few knots
  const lh = c * 0.62; ctx.fillStyle = '#2a190d'; ctx.fillRect(X0, a.y, W, a.h);
  for (let y = a.y, j = 0; y < yF + lh; y += lh, j++) {
    const tone = hash(j, 1); const g = ctx.createLinearGradient(0, y, 0, y + lh); g.addColorStop(0, shade('#8a5a32', (tone - 0.5) * 0.25)); g.addColorStop(0.28, shade('#6a4224', (tone - 0.5) * 0.25)); g.addColorStop(1, shade('#2e1a0c', (tone - 0.5) * 0.2)); ctx.fillStyle = g; ctx.fillRect(X0, y, W, lh - 1);
    ctx.fillStyle = 'rgba(255,225,170,0.2)'; ctx.fillRect(X0, y + 1, W, Math.max(1, c * 0.03));
    ctx.strokeStyle = 'rgba(30,14,4,0.38)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 4; k++) { const yy = y + lh * (0.25 + hash(j, k, 2) * 0.55), x0 = X0 + hash(j, k, 3) * W; ctx.moveTo(x0, yy); ctx.lineTo(x0 + c * (0.8 + hash(j, k, 4) * 2.5), yy + (hash(j, k, 5) - 0.5) * 2); } ctx.stroke();
    if (hash(j, 7) > 0.55) { const kx = X0 + hash(j, 8) * W, ky = y + lh * 0.5; ctx.fillStyle = 'rgba(30,14,4,0.55)'; ctx.beginPath(); ctx.ellipse(kx, ky, c * 0.1, c * 0.07, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(30,14,4,0.4)'; ctx.beginPath(); ctx.ellipse(kx, ky, c * 0.2, c * 0.13, 0, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = 'rgba(210,190,150,0.22)'; ctx.fillRect(X0, y + lh - 2.4, W, 1.4); // chinking
  }
  // the window: a wide timber-framed opening: sky, snowy peaks, a slope of pines, falling snow
  const ww = B.w * 0.9, wx = B.x + (B.w - ww) / 2, wy = B.y + c * 0.1, wh = B.h * 0.6, fr = Math.max(7, c * 0.28);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = c * 0.5; ctx.fillStyle = '#2a170a'; ctx.fillRect(wx - fr, wy - fr, ww + fr * 2, wh + fr * 1.6); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
  let g = ctx.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, '#b9c9dc'); g.addColorStop(0.55, '#e3ebf3'); g.addColorStop(1, '#f6f9fc'); ctx.fillStyle = g; ctx.fillRect(wx, wy, ww, wh);
  for (const [col, cap, base, amp, ph] of [['#aebdd3', '#fbfdff', 0.5, 0.2, 0.6], ['#8097b6', '#f0f6fc', 0.62, 0.16, 2.1]]) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(wx, wy + wh); const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12, y = wy + wh * (base - amp * Math.abs(Math.sin(t * 5.2 + ph)) * (0.5 + 0.5 * Math.sin(t * 2 + ph))); pts.push([wx + ww * t, y]); ctx.lineTo(wx + ww * t, y); } ctx.lineTo(wx + ww, wy + wh); ctx.fill();
    ctx.fillStyle = cap; for (let i = 1; i < pts.length - 1; i++) if (pts[i][1] < pts[i - 1][1] && pts[i][1] < pts[i + 1][1]) { poly(ctx, [[pts[i][0], pts[i][1]], [pts[i][0] + ww * 0.045, pts[i][1] + wh * 0.07], [pts[i][0] + ww * 0.012, pts[i][1] + wh * 0.055], [pts[i][0] - ww * 0.02, pts[i][1] + wh * 0.075], [pts[i][0] - ww * 0.05, pts[i][1] + wh * 0.06]]); ctx.fill(); }
  }
  g = ctx.createLinearGradient(0, wy + wh * 0.6, 0, wy + wh); g.addColorStop(0, '#f3f7fb'); g.addColorStop(1, '#cfdceb'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + wh * 0.74); for (let i = 0; i <= 10; i++) ctx.lineTo(wx + (ww * i) / 10, wy + wh * (0.72 + 0.04 * Math.sin(i * 1.4))); ctx.lineTo(wx + ww, wy + wh); ctx.fill();
  const np = Math.max(7, Math.round(ww / (c * 1.5))); for (let k = 0; k < np; k++) { const px = wx + ww * ((k + 0.3 + hash(k, 5) * 0.4) / np), hh = wh * (0.26 + hash(k, 6) * 0.2); pine(ctx, px, wy + wh * (0.76 + hash(k, 7) * 0.12), hh, hh * 0.5); }
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); for (let k = 0; k < 90; k++) { const x = wx + hash(k, 11) * ww, y = wy + hash(k, 12) * wh, r = 0.8 + hash(k, 13) * 1.6; ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); } ctx.fill();
  glow(ctx, wx + ww * 0.5, wy, ww * 0.6, '#ffffff', 0.35);
  ctx.restore();
  // mullions and the frame with a lit top edge; a snow-laden sill
  for (const f of [0.34, 0.66]) { rod(ctx, wx + ww * f, wy - 1, wx + ww * f, wy + wh + 1, fr * 0.62, '#6a4224', 'butt'); } rod(ctx, wx - 1, wy + wh * 0.47, wx + ww + 1, wy + wh * 0.47, fr * 0.62, '#6a4224', 'butt');
  for (const [x1, y1, x2, y2] of [[wx - fr / 2, wy - fr, wx - fr / 2, wy + wh + fr * 0.6], [wx + ww + fr / 2, wy - fr, wx + ww + fr / 2, wy + wh + fr * 0.6]]) rod(ctx, x1, y1, x2, y2, fr, '#7a4a2a', 'butt'); rod(ctx, wx - fr, wy - fr / 2, wx + ww + fr, wy - fr / 2, fr, '#7a4a2a', 'butt');
  const sy = wy + wh + fr * 0.2; g = ctx.createLinearGradient(0, sy, 0, sy + fr * 1.2); g.addColorStop(0, '#a87a4a'); g.addColorStop(1, '#4a2c14'); ctx.fillStyle = g; roundRectPath(ctx, wx - fr * 1.4, sy, ww + fr * 2.8, fr * 1.1, fr * 0.3); ctx.fill(); ctx.fillStyle = 'rgba(255,230,180,0.45)'; ctx.fillRect(wx - fr * 1.4, sy, ww + fr * 2.8, Math.max(1.4, fr * 0.1));
  // floor and the stove's glow
  g = ctx.createLinearGradient(0, yF, 0, a.y + a.h); g.addColorStop(0, '#7a4e28'); g.addColorStop(1, '#3a2210'); ctx.fillStyle = g; ctx.fillRect(X0, yF, W, a.y + a.h - yF + 12);
  ctx.strokeStyle = 'rgba(20,10,2,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let x = X0 + hash(3, 3) * c, i = 0; x < X0 + W; x += c * (1.3 + hash(i, 9) * 0.6), i++) { ctx.moveTo(x, yF); ctx.lineTo(x - c * 0.3, a.y + a.h); } ctx.stroke(); ctx.fillStyle = 'rgba(255,220,170,0.2)'; ctx.fillRect(X0, yF, W, Math.max(1.4, c * 0.04));
  const sx = isLand(S) ? B.x + B.w * 0.88 : a.x + a.w - c * 0.6; stove(ctx, sx, yF + c * 0.4, c * 0.95);
  glow(ctx, sx - c * 0.1, yF - c * 0.2, c * 4.4, '#ff8a30', 0.38); glow(ctx, sx, yF + c * 0.3, c * 3.2, '#ffb060', 0.2);
  glow(ctx, wx + ww * 0.5, wy + wh * 0.5, Math.max(ww, wh) * 0.8, '#e6f0ff', 0.1);
  vignette(ctx, a, 0.3);
  ctx.restore();
}
// ---------------------------------------------------------------------------------------------------------------------------------------------------
// the loom: two bark-rough log posts, a top beam wound with warp, two heddle shafts on cords over a roller, and a log breast beam with the finished cloth
// ---------------------------------------------------------------------------------------------------------------------------------------------------
const WOOL = '#e8dcc2', RUST = '#a8452a';
function shGeom(S) {
  const { a, r, c, m } = G(S), avail = Math.max(c * 0.9, m.t - c * 0.1), beamY = r.y - Math.max(c * 0.95, avail * 0.6);
  return { a, r, c, m, beamY, px0: r.x - c * 0.6, px1: r.x + r.w + c * 0.6, lw: Math.max(9, c * 0.36), p: Math.max(3, c / 4.4), cx: r.x + r.w / 2 };
}
function log(ctx, x1, y1, x2, y2, w, seed) { beam(ctx, x1, y1, x2, y2, w, '#7a5230', seed); ctx.save(); ctx.strokeStyle = 'rgba(30,14,4,0.6)'; ctx.lineWidth = Math.max(1, w * 0.06); ctx.beginPath(); const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L; for (let t = w * 1.5; t < L; t += w * (1.4 + hash(seed, t | 0) * 1.2)) { const px = x1 + ux * t, py = y1 + uy * t; ctx.moveTo(px - uy * w * 0.48, py + ux * w * 0.48); ctx.lineTo(px + uy * w * 0.48, py - ux * w * 0.48); } ctx.stroke(); ctx.restore(); }
export function shawlUnder(ctx, S) {
  if (S.card || S.lite) return;
  const g = shGeom(S), { r, c, p, a, beamY, lw, cx } = g, bot = a.y + a.h;
  for (const x of [g.px0, g.px1]) { castShadow(ctx, x, beamY, x, bot, lw, lw * 0.8, lw * 0.15, 0.34); log(ctx, x, beamY - lw * 0.5, x, bot, lw, Math.floor(x)); }
  // warp: thick natural wool threads with soft hairs and a rust stripe every so often
  ctx.lineCap = 'round';
  for (let x = r.x + p * 0.5, i = 0; x < r.x + r.w; x += p, i++) { const st = i % 10 < 2; thread(ctx, x, beamY, x, r.y + 2, Math.max(1.4, p * 0.62), st ? RUST : (i % 2 ? WOOL : shade(WOOL, -0.08)), 0); }
  ctx.strokeStyle = 'rgba(255,248,230,0.35)'; ctx.lineWidth = 0.8; ctx.beginPath(); for (let k = 0; k < 90; k++) { const x = r.x + hash(k, 3) * r.w, y = beamY + hash(k, 4) * (r.y - beamY); ctx.moveTo(x, y); ctx.lineTo(x + (hash(k, 5) - 0.5) * 3, y + c * 0.12); } ctx.stroke();
  castShadow(ctx, g.px0, beamY, g.px1, beamY, lw * 1.1, 1, lw * 0.5, 0.36); log(ctx, g.px0 - lw * 0.5, beamY, g.px1 + lw * 0.5, beamY, lw * 1.1, 33);
  // the warp wound on the beam
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, beamY - lw * 0.55, r.w, lw * 1.1); ctx.clip(); for (let x = r.x, i = 0; x < r.x + r.w; x += p * 0.8, i++) { ctx.fillStyle = i % 10 < 2 ? RUST : (i % 2 ? WOOL : shade(WOOL, -0.1)); ctx.fillRect(x, beamY - lw * 0.55, p * 0.78, lw * 1.1); } const wg = ctx.createLinearGradient(0, beamY - lw * 0.55, 0, beamY + lw * 0.55); wg.addColorStop(0, 'rgba(255,255,255,0.4)'); wg.addColorStop(0.4, 'rgba(255,255,255,0)'); wg.addColorStop(1, 'rgba(0,0,0,0.5)'); ctx.fillStyle = wg; ctx.fillRect(r.x, beamY - lw * 0.55, r.w, lw * 1.1); ctx.restore();
  // two heddle shafts (flat slats with cord loops) on cords that rise over a small wooden roller on the beam
  const hy = [r.y - Math.min(c * 0.34, (r.y - beamY) * 0.25), r.y - Math.min(c * 0.62, (r.y - beamY) * 0.45)];
  const rx = cx, ry = beamY + lw * 0.1; ctx.strokeStyle = '#efe6cf'; ctx.lineWidth = Math.max(1.4, c * 0.04); for (const y of hy) for (const x of [r.x + r.w * 0.12, r.x + r.w * 0.88]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, ry); ctx.stroke(); }
  for (let k = 0; k < 2; k++) { const y = hy[k]; castShadow(ctx, r.x, y, r.x + r.w, y, c * 0.12, 1, c * 0.1, 0.3); rod(ctx, r.x - c * 0.05, y, r.x + r.w + c * 0.05, y, Math.max(3, c * 0.1), k ? '#d6b27a' : '#c49a5e'); ctx.strokeStyle = 'rgba(245,238,215,0.9)'; ctx.lineWidth = Math.max(0.9, c * 0.02); ctx.beginPath(); for (let x = r.x + p * 0.9; x < r.x + r.w; x += p * 2) { ctx.moveTo(x, y); ctx.lineTo(x, y + c * 0.16 * (k ? 1 : 1.3)); } ctx.stroke(); }
  rod(ctx, rx - c * 0.5, ry, rx + c * 0.5, ry, Math.max(5, c * 0.18), '#c9a066');
}
export function shawlFrame(ctx, S) {
  if (S.card || S.lite) return;
  const g = shGeom(S), { r, c, a, m, lw } = g, bot = r.y + r.h, by = bot + c * 0.2;
  // the breast beam: a log with the finished cloth rolled on it (cream wool with the first border band showing at the ends)
  const bh = Math.min(c * 0.62, Math.max(8, m.b * 0.3)); castShadow(ctx, g.px0, by + bh * 0.3, g.px1, by + bh * 0.3, bh, 1, bh * 0.35, 0.36);
  const cg = ctx.createLinearGradient(0, by - bh / 2, 0, by + bh / 2); cg.addColorStop(0, '#f2e9d2'); cg.addColorStop(0.35, '#d9c8a6'); cg.addColorStop(1, '#6a5030'); ctx.fillStyle = cg; roundRectPath(ctx, r.x - c * 0.3, by - bh / 2, r.w + c * 0.6, bh, bh * 0.45); ctx.fill();
  ctx.strokeStyle = 'rgba(60,36,14,0.28)'; ctx.lineWidth = 1; ctx.beginPath(); for (let q = 1; q < 4; q++) { ctx.moveTo(r.x - c * 0.25, by - bh / 2 + (bh * q) / 4); ctx.lineTo(r.x + r.w + c * 0.25, by - bh / 2 + (bh * q) / 4 + 1); } ctx.stroke();
  ctx.fillStyle = RUST; ctx.fillRect(r.x + c * 0.2, by - bh * 0.5, r.w - c * 0.4, Math.max(1.6, bh * 0.07)); ctx.fillStyle = '#2f5a8a'; ctx.fillRect(r.x + c * 0.2, by - bh * 0.34, r.w - c * 0.4, Math.max(1.2, bh * 0.05));
  log(ctx, g.px0 - c * 0.15, by, g.px0 + c * 0.2, by, bh * 0.7, 51); log(ctx, g.px1 - c * 0.2, by, g.px1 + c * 0.15, by, bh * 0.7, 52);
  // twisted tassels: groups of wool ends twisted into tufts hanging from the cloth's lower edge over the roll
  const tl = clamp(m.b * 0.5, c * 0.34, c * 0.85), n = Math.max(8, Math.round(r.w / (c * 0.42))), tw = r.w / n; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = r.x + (i + 0.5) * tw, L = tl * (0.85 + hash(i, 2) * 0.25), sw = (hash(i, 3) - 0.5) * c * 0.12, col = i % 3 === 1 ? RUST : (i % 3 === 2 ? shade(WOOL, -0.1) : WOOL), y0 = bot - c * 0.02, y1 = y0 + L;
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = tw * 0.34; ctx.beginPath(); ctx.moveTo(x + 1.5, y0 + 1.5); ctx.quadraticCurveTo(x + sw + 1.5, y0 + L * 0.5, x + sw * 1.4 + 1.5, y1 + 1.5); ctx.stroke();
    ctx.strokeStyle = shade(col, -0.35); ctx.lineWidth = tw * 0.32; ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + sw, y0 + L * 0.5, x + sw * 1.4, y1); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = tw * 0.24; ctx.stroke();
    ctx.strokeStyle = rgba(shade(col, -0.45), 0.7); ctx.lineWidth = Math.max(0.8, tw * 0.05); ctx.beginPath(); for (let q = 1; q < 6; q++) { const t = q / 6, xx = x + sw * 2 * t * (1 - t) + sw * 1.4 * t * t, yy = y0 + L * t; ctx.moveTo(xx - tw * 0.14, yy - tw * 0.06); ctx.lineTo(xx + tw * 0.14, yy + tw * 0.06); } ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(0.8, tw * 0.06); ctx.beginPath(); for (let q = -2; q <= 2; q++) { ctx.moveTo(x + sw * 1.4 + q * tw * 0.04, y1 - tw * 0.02); ctx.lineTo(x + sw * 1.4 + q * tw * 0.09, y1 + tw * 0.28); } ctx.stroke();
  }
}
// ---------------------------------------------------------------------------------------------------------------------------------------------------
// the cloth: napped, soft wool twill (diagonal ridges, hairy surface) with a slim patti border band at both ends
// ---------------------------------------------------------------------------------------------------------------------------------------------------
export function shawlGround(ctx, S) {
  const r = S.rect, c = S.cell, p = Math.max(1.8, c / 9), bg = S.bg, cols = S.colors;
  clipTo(ctx, r);
  ctx.fillStyle = bg; ctx.fillRect(r.x, r.y, r.w, r.h);
  if (!S.lite) for (let k = 0; k < 12; k++) { const px = r.x + hash(k, 7) * r.w, py = r.y + hash(k, 8) * r.h, R = c * (1 + hash(k, 9) * 2), g = ctx.createRadialGradient(px, py, 0, px, py, R); g.addColorStop(0, hash(k, 4) > 0.5 ? 'rgba(255,248,230,0.1)' : 'rgba(40,20,0,0.1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(px - R, py - R, R * 2, R * 2); }
  const diag = (off, col, al, lw) => { ctx.beginPath(); for (let k = -r.h; k < r.w; k += p * 1.6) { ctx.moveTo(r.x + k + off, r.y + r.h); ctx.lineTo(r.x + k + off + r.h, r.y); } ctx.strokeStyle = rgba(col, al); ctx.lineWidth = lw; ctx.stroke(); };
  diag(0, shade(bg, -0.4), 0.2, p * 0.5); diag(p * 0.8, shade(bg, 0.4), 0.2, p * 0.4);
  // the nap: a fuzz of tiny hairs
  const nh = Math.min(900, Math.round((r.w * r.h) / (c * c) * 20)); ctx.lineWidth = 0.8; ctx.beginPath(); for (let k = 0; k < nh; k++) { const x = r.x + hash(k, 21) * r.w, y = r.y + hash(k, 22) * r.h, a = hash(k, 23) * Math.PI, l = c * (0.04 + hash(k, 24) * 0.09); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); } ctx.strokeStyle = 'rgba(255,248,232,0.3)'; ctx.stroke();
  ctx.beginPath(); for (let k = 0; k < nh * 0.6; k++) { const x = r.x + hash(k, 31) * r.w, y = r.y + hash(k, 32) * r.h, a = hash(k, 33) * Math.PI, l = c * (0.04 + hash(k, 34) * 0.08); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); } ctx.strokeStyle = 'rgba(60,34,10,0.22)'; ctx.stroke();
  // patti: a narrow band of stepped triangles in the game's colours, top and bottom, and a thin selvage
  const bh = c * 0.4, cA = cols[0] ?? '#a8262c', cB = cols[1] ?? '#efe7d6', cC = cols[2] ?? '#2f6a43', cD = cols[3] ?? '#d9a02a';
  for (const [yy, up] of [[r.y, 1], [r.y + r.h - bh, -1]]) {
    ctx.fillStyle = shade(cA, -0.2); ctx.fillRect(r.x, yy, r.w, bh);
    const q = bh / 5; ctx.fillStyle = cB; ctx.fillRect(r.x, yy + q * 0.4, r.w, q * 0.55); ctx.fillRect(r.x, yy + bh - q * 0.95, r.w, q * 0.55);
    for (let x = r.x, i = 0; x < r.x + r.w; x += q * 3, i++) { // stepped triangles pointing up and down
      for (let s = 0; s < 3; s++) { const w = q * (3 - s), xs = x + (q * 3 - w) / 2; ctx.fillStyle = i % 2 ? cD : cC; ctx.fillRect(xs, yy + q * (1.0 + s * 0.6), w, q * 0.6); }
    }
    ctx.beginPath(); for (let x = r.x + p * 0.5; x < r.x + r.w; x += p * 1.2) { ctx.moveTo(x, yy); ctx.lineTo(x + bh * 0.25, yy + bh); } ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = p * 0.4; ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(r.x, up > 0 ? yy + bh : yy - 1.4, r.w, 1.4);
  }
  ctx.fillStyle = 'rgba(70,40,15,0.35)'; ctx.fillRect(r.x, r.y, Math.max(2, c * 0.04), r.h); ctx.fillRect(r.x + r.w - Math.max(2, c * 0.04), r.y, Math.max(2, c * 0.04), r.h);
  ctx.restore();
}
export function shawlOver(ctx, S) {
  const r = S.rect, c = S.cell;
  // window light from the upper left, the stove's warm glow from the lower right, and the soft hang of the cloth at its top
  let g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(225,238,255,0.14)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,150,60,0.16)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  const e = Math.max(4, c * 0.45); g = ctx.createLinearGradient(0, r.y, 0, r.y + e); g.addColorStop(0, 'rgba(20,8,0,0.3)'); g.addColorStop(1, 'rgba(20,8,0,0)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, e);
}
// patti geometry: shapes rasterised on a coarse weave count so the edges step like woven blocks; each block is a lit patch of wool twill with a hairy rim
export function pattiSkin(ctx, S, d) {
  const { kind, col, x, y, s } = d, fill = isFilled(kind);
  ctx.lineJoin = 'miter';
  if (!fill) {
    const w = Math.max(3, lineWidthOf(kind, s) * 0.95); ctx.lineCap = 'butt';
    const pth = (dx, dy) => motifPath(ctx, kind, x + dx, y + dy, s);
    pth(w * 0.15, w * 0.3); ctx.strokeStyle = 'rgba(0,0,0,0.32)'; ctx.lineWidth = w * 1.3; ctx.stroke();
    pth(0, 0); ctx.strokeStyle = shade(col, -0.45); ctx.lineWidth = w * 1.15; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w * 0.9; ctx.stroke();
    ctx.setLineDash([w * 0.42, w * 0.42]); ctx.strokeStyle = rgba(shade(col, -0.5), 0.6); ctx.lineWidth = w * 0.9; ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = rgba(shade(col, 0.55), 0.35); ctx.lineWidth = w * 1.35; ctx.globalAlpha = 0.25; ctx.stroke(); ctx.globalAlpha = 1;
    pth(-w * 0.1, -w * 0.25); ctx.strokeStyle = rgba(shade(col, 0.6), 0.6); ctx.lineWidth = Math.max(0.7, w * 0.16); ctx.stroke();
    return;
  }
  const n = 8, q = (s * 1.12) / n, x0 = x - (n * q) / 2, y0 = y - (n * q) / 2, inside = insideTest(ctx, kind, x, y, s * 1.06), on = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) on.push(inside(x0 + (i + 0.5) * q, y0 + (j + 0.5) * q));
  const has = (i, j) => i >= 0 && j >= 0 && i < n && j < n && on[j * n + i];
  // shadow, body, shading on the lower-right edges, twill diagonals, a hairy rim
  ctx.beginPath(); for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (on[j * n + i]) ctx.rect(x0 + i * q + q * 0.1, y0 + j * q + q * 0.2, q, q); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
  ctx.beginPath(); for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (on[j * n + i]) ctx.rect(x0 + i * q - 0.4, y0 + j * q - 0.4, q + 0.8, q + 0.8); ctx.fillStyle = col; ctx.fill();
  ctx.save(); ctx.beginPath(); for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (on[j * n + i]) ctx.rect(x0 + i * q, y0 + j * q, q, q); ctx.clip();
  ctx.lineWidth = Math.max(0.7, q * 0.1); ctx.beginPath(); for (let k = -n; k < n * 2; k++) { ctx.moveTo(x0 + k * q * 0.5, y0 + n * q); ctx.lineTo(x0 + k * q * 0.5 + n * q, y0); } ctx.strokeStyle = rgba(shade(col, -0.5), 0.28); ctx.stroke();
  ctx.beginPath(); for (let k = -n; k < n * 2; k++) { ctx.moveTo(x0 + k * q * 0.5 + q * 0.22, y0 + n * q); ctx.lineTo(x0 + k * q * 0.5 + q * 0.22 + n * q, y0); } ctx.strokeStyle = rgba(shade(col, 0.6), 0.28); ctx.stroke();
  const sg = ctx.createLinearGradient(x - s / 2, y - s / 2, x + s / 2, y + s / 2); sg.addColorStop(0, 'rgba(255,248,230,0.26)'); sg.addColorStop(0.5, 'rgba(255,248,230,0)'); sg.addColorStop(1, 'rgba(0,0,0,0.32)'); ctx.fillStyle = sg; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  ctx.restore();
  // block edges: dark step line on the lower and right sides, a pale hairy glint on the upper and left sides
  ctx.lineCap = 'butt'; ctx.lineWidth = Math.max(1, q * 0.12); ctx.beginPath();
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (on[j * n + i]) { if (!has(i, j + 1)) { ctx.moveTo(x0 + i * q, y0 + (j + 1) * q); ctx.lineTo(x0 + (i + 1) * q, y0 + (j + 1) * q); } if (!has(i + 1, j)) { ctx.moveTo(x0 + (i + 1) * q, y0 + j * q); ctx.lineTo(x0 + (i + 1) * q, y0 + (j + 1) * q); } }
  ctx.strokeStyle = rgba(shade(col, -0.65), 0.75); ctx.stroke(); ctx.beginPath();
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (on[j * n + i]) { if (!has(i, j - 1)) { ctx.moveTo(x0 + i * q, y0 + j * q + 0.6); ctx.lineTo(x0 + (i + 1) * q, y0 + j * q + 0.6); } if (!has(i - 1, j)) { ctx.moveTo(x0 + i * q + 0.6, y0 + j * q); ctx.lineTo(x0 + i * q + 0.6, y0 + (j + 1) * q); } }
  ctx.strokeStyle = rgba(shade(col, 0.65), 0.6); ctx.stroke();
  ctx.lineWidth = 0.8; ctx.beginPath(); for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (on[j * n + i]) { const k = j * n + i; if (!has(i, j - 1)) for (let t = 0; t < 2; t++) { const hx = x0 + (i + hash(k, t, 1)) * q; ctx.moveTo(hx, y0 + j * q); ctx.lineTo(hx + (hash(k, t, 2) - 0.5) * q * 0.4, y0 + j * q - q * 0.18); } if (!has(i - 1, j)) for (let t = 0; t < 2; t++) { const hy = y0 + (j + hash(k, t, 3)) * q; ctx.moveTo(x0 + i * q, hy); ctx.lineTo(x0 + i * q - q * 0.18, hy + (hash(k, t, 4) - 0.5) * q * 0.4); } }
  ctx.strokeStyle = rgba(shade(col, 0.4), 0.5); ctx.stroke();
}

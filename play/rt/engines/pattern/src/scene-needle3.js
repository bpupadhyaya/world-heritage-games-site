// Needlework scene art, 1.12.0, part 3: chamba rumal (ink outline, then double-satin fill, on muslin before a mountain window) and lambani (patchwork with
// cowries, mirrors and bold interlaced stitch).
import { hash, rgba, mix, shade, roundRectPath, rod, ball, speck, lines, glow, vignette, TAU, motifPath, isFilled, POT } from './scene-kit.js';
import { cord, kindPath, clothGround, edgeShade, isLand, lightShaft } from './scene-needle.js';

// ====================================================================================================================================================
// CHAMBA RUMAL: a pale muslin square, the design first drawn in fine ink, then filled with silk in double satin stitch (the stitches show the same on both
// faces). Shown in a light mountain-town window: snow peaks, blue ridges, dark pines, a cedar sill.
// ====================================================================================================================================================
export function chambaEnv(ctx, S) {
  const a = S.area, X0 = a.x - 12, W = a.w + 24, c = S.cell, sill = a.y + a.h * 0.88;
  const g = ctx.createLinearGradient(0, a.y, 0, sill); g.addColorStop(0, '#a8cbe0'); g.addColorStop(0.7, '#e6f0ec'); g.addColorStop(1, '#f6efd8'); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, sill - a.y);
  ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, sill - a.y); ctx.clip();
  const ridge = (base, amp, seed, col, snow) => { ctx.beginPath(); ctx.moveTo(X0, sill); for (let i = 0; i <= 24; i++) { const x = X0 + (W * i) / 24, y = base - amp * (0.4 + 0.6 * Math.abs(Math.sin(i * 0.7 + seed * 2.1)) * (0.5 + hash(i, seed))); ctx.lineTo(x, y); } ctx.lineTo(X0 + W, sill); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    if (snow) { ctx.save(); ctx.clip(); const sg = ctx.createLinearGradient(0, base - amp, 0, base - amp * 0.45); sg.addColorStop(0, 'rgba(255,255,255,0.95)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sg; ctx.fillRect(X0, base - amp * 1.1, W, amp * 0.7); ctx.restore(); } };
  ridge(a.y + (sill - a.y) * 0.52, (sill - a.y) * 0.3, 1, '#9bb4c8', true); ridge(a.y + (sill - a.y) * 0.68, (sill - a.y) * 0.2, 4, '#6f94ae', false); ridge(a.y + (sill - a.y) * 0.84, (sill - a.y) * 0.13, 7, '#4a7a78', false);
  for (let i = 0; i < 28; i++) { const x = X0 + (W * (i + hash(i, 3))) / 28, h = (sill - a.y) * (0.08 + hash(i, 4) * 0.1), y = sill; ctx.fillStyle = i % 3 ? '#1f4a3a' : '#2a5a44'; ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + h * 0.22, y); ctx.lineTo(x - h * 0.22, y); ctx.fill(); }
  glow(ctx, a.x + a.w * 0.8, a.y + a.h * 0.05, Math.max(a.w, a.h) * 0.8, '#fff8d8', 0.5);
  ctx.restore();
  // cedar sill: lit lip, soft grain, the shadow of the stretcher falling on it
  const sg2 = ctx.createLinearGradient(0, sill, 0, a.y + a.h); sg2.addColorStop(0, '#f0d29a'); sg2.addColorStop(0.08, '#c8975a'); sg2.addColorStop(1, '#6a4020'); ctx.fillStyle = sg2; ctx.fillRect(X0, sill, W, a.y + a.h - sill + 12);
  ctx.strokeStyle = 'rgba(60,30,10,0.22)'; ctx.lineWidth = 1; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(X0, sill + (a.y + a.h - sill) * (k + 0.5) / 7); ctx.lineTo(X0 + W, sill + (a.y + a.h - sill) * (k + 0.5) / 7 + (hash(k, 9) - 0.5) * 3); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,240,0.6)'; ctx.fillRect(X0, sill, W, Math.max(1.4, c * 0.05));
  vignette(ctx, a, 0.18);
}
export function chambaGround(ctx, S) {
  clothGround(ctx, S, { count: 12, wa: 0.1, ka: 0.09, lit: 0.2, dark: 0.1, warp: shade(S.bg, -0.25), weft: '#ffffff' });
  const r = S.rect, c = S.cell; ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  // faint pencil guide lines of the drawing board
  ctx.strokeStyle = 'rgba(80,100,130,0.10)'; ctx.lineWidth = 1; ctx.setLineDash([c * 0.08, c * 0.08]); ctx.beginPath(); for (let i = 1; i < S.cols; i++) { ctx.moveTo(r.x + i * c, r.y); ctx.lineTo(r.x + i * c, r.y + r.h); } for (let j = 1; j < S.rows; j++) { ctx.moveTo(r.x, r.y + j * c); ctx.lineTo(r.x + r.w, r.y + j * c); } ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
}
export const chambaOver = (ctx, S) => edgeShade(ctx, S, 0.16);
const INK = '#1a1620';
export function chambaSkin(ctx, S, d) {
  const { kind, col, x, y, s, key } = d, fill = isFilled(kind), lw = Math.max(1.1, s * 0.04);
  const ink = (sc, w) => { ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; kindPath(ctx, kind, x, y, s * sc)(0.3, 0.4); ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = w * 1.8; ctx.stroke(); kindPath(ctx, kind, x, y, s * sc)(0, 0); ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.stroke(); ctx.restore(); };
  if (d.pen) { // the ink drawing: a fine line, a second thin contour inside for filled shapes (where the satin will stop)
    ink(1.0, lw * 1.1); if (fill && kind !== 'dot') { ctx.save(); ctx.globalAlpha = 0.5; ctx.setLineDash([s * 0.05, s * 0.05]); ink(0.7, lw * 0.6); ctx.restore(); } return;
  }
  if (!fill) { // a satin band
    const w = Math.max(3, s * 0.13);
    cord(ctx, kindPath(ctx, kind, x, y, s), w * 1.15, col, { dash: [0.18, 0.12] }); ink(1.0, lw * 0.7); return;
  }
  const s2 = s * 1.04;
  ctx.save(); kindPath(ctx, kind, x, y, s2)(0, 0); ctx.fillStyle = 'rgba(40,20,0,0.22)'; ctx.save(); ctx.translate(s * 0.02, s * 0.04); ctx.fill(); ctx.restore(); ctx.fillStyle = shade(col, -0.25); ctx.fill(); ctx.clip();
  // double satin: two directions of fine stitches meeting at a centre line, the light turning with them
  const p = Math.max(1.5, s / 18), ang = -0.95 + (hash(key, 3) - 0.5) * 0.3, ca = Math.cos(ang), sa = Math.sin(ang), N = Math.ceil((s * 1.5) / p);
  ctx.lineCap = 'round';
  for (let side = 0; side < 2; side++) {
    for (let k = -N; k <= N; k++) { const u = k * p * 0.92, vx = x + ca * u, vy = y + sa * u, dx = -sa * (side ? 1 : -1) * s * 0.75, dy = ca * (side ? 1 : -1) * s * 0.75; ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + dx, vy + dy); ctx.strokeStyle = shade(col, (side ? 0.26 : -0.1) + (hash(key, k) - 0.5) * 0.12); ctx.lineWidth = p; ctx.stroke(); }
  }
  ctx.strokeStyle = rgba(shade(col, 0.6), 0.5); ctx.lineWidth = Math.max(0.7, p * 0.35); ctx.beginPath(); ctx.moveTo(x - ca * s, y - sa * s); ctx.lineTo(x + ca * s, y + sa * s); ctx.stroke();
  const og = ctx.createRadialGradient(x - s * 0.2, y - s * 0.25, s * 0.06, x, y, s * 0.62); og.addColorStop(0, 'rgba(255,255,255,0.3)'); og.addColorStop(0.6, 'rgba(255,255,255,0)'); og.addColorStop(1, 'rgba(0,0,0,0.3)'); ctx.fillStyle = og; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  ctx.restore();
  ink(1.04, lw * 1.25);
}

// ====================================================================================================================================================
// LAMBANI: patchwork of dark cotton strips, couched seams, bold interlaced (herringbone and ladder) stitching, cowrie shells and tiny mirrors; seen on earth
// ground in dappled shade.
// ====================================================================================================================================================
const PATCH = ['#7a1a22', '#1e2a58', '#3a2a22', '#8a4a1c', '#5a1a48', '#1a4a46'];
export function lambaniEnv(ctx, S) {
  const a = S.area, X0 = a.x - 12, W = a.w + 24, c = S.cell;
  const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#b8885a'); g.addColorStop(1, '#7a4a28'); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, a.h);
  speck(ctx, { x: X0, y: a.y, w: W, h: a.h }, 560, ['#3a1c08', '#f0d0a0', '#7a5a38'], 0.28, 2.4, 41);
  // dappled leaf-shade: overlapping soft ellipses of shadow and bright sun spots
  ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, a.h); ctx.clip();
  for (let k = 0; k < 44; k++) { const x = a.x + hash(k, 1) * a.w, y = a.y + hash(k, 2) * a.h, R = c * (0.25 + hash(k, 3) * 0.45); ctx.fillStyle = hash(k, 4) > 0.45 ? 'rgba(40,20,0,0.14)' : 'rgba(255,232,170,0.16)'; ctx.beginPath(); ctx.ellipse(x, y, R, R * 0.6, hash(k, 5) * 3, 0, TAU); ctx.fill(); }
  ctx.restore();
  // scattered cowries and beads on the earth (not on the work)
  const r = S.rect; for (let k = 0; k < 22; k++) { const x = a.x + hash(k, 8) * a.w, y = a.y + hash(k, 9) * a.h; if (x > r.x - c * 0.7 && x < r.x + r.w + c * 0.7 && y > r.y - c * 0.7 && y < r.y + r.h + c * 0.7) continue; cowrie(ctx, x, y, c * 0.2, hash(k, 6) * 3); }
  glow(ctx, a.x + a.w * 0.3, a.y, Math.max(a.w, a.h) * 0.8, '#ffe0a0', 0.2);
  vignette(ctx, a, 0.4);
}
function cowrie(ctx, x, y, R, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(R * 0.15, R * 0.28, R * 1.15, R * 0.8, 0, 0, TAU); ctx.fill();
  const g = ctx.createRadialGradient(-R * 0.3, -R * 0.3, R * 0.1, 0, 0, R * 1.2); g.addColorStop(0, '#fffaf0'); g.addColorStop(0.6, '#efe0c4'); g.addColorStop(1, '#a8906a'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, R * 1.1, R * 0.78, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#5a4630'; ctx.lineWidth = Math.max(1, R * 0.16); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-R * 0.8, 0); ctx.quadraticCurveTo(0, R * 0.12, R * 0.8, 0); ctx.stroke();
  ctx.lineWidth = Math.max(0.7, R * 0.07); ctx.beginPath(); for (let k = -3; k <= 3; k++) { ctx.moveTo(k * R * 0.22, -R * 0.14); ctx.lineTo(k * R * 0.22, R * 0.2); } ctx.stroke();
  ctx.restore();
}
export function lambaniGround(ctx, S) {
  const r = S.rect, c = S.cell; ctx.fillStyle = S.bg; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  // patches: bands of different dark cottons in uneven widths, rotated blocks at the corners
  let y = r.y, j = 0; while (y < r.y + r.h) { const h = c * (0.9 + hash(j, 2) * 1.6); let x = r.x, i = 0; while (x < r.x + r.w) { const w = c * (0.9 + hash(i, j, 5) * 2.2); ctx.fillStyle = mix(PATCH[(i * 3 + j * 5 + ((hash(i, j, 6) * 6) | 0)) % 6], S.bg, 0.35); ctx.fillRect(x, y, w, h);
    ctx.fillStyle = `rgba(255,255,255,${0.03 + hash(i, j, 9) * 0.05})`; ctx.fillRect(x, y, w, h * 0.5); x += w; i++; } y += h; j++; }
  const p = Math.max(1.6, c / 11); ctx.beginPath(); for (let yy = r.y; yy < r.y + r.h; yy += p) { ctx.moveTo(r.x, yy); ctx.lineTo(r.x + r.w, yy); } ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = p * 0.4; ctx.stroke();
  ctx.beginPath(); for (let xx = r.x; xx < r.x + r.w; xx += p) { ctx.moveTo(xx, r.y); ctx.lineTo(xx, r.y + r.h); } ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = p * 0.35; ctx.stroke();
  // seams: a ladder of herringbone stitches in pale thread over every patch joint
  const seam = (x0, y0, x1, y1) => { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.floor(L / (c * 0.16)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L; ctx.beginPath(); for (let k = 0; k < n; k++) { const t = k / n, px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t, s2 = k % 2 ? 1 : -1; ctx.moveTo(px + nx * c * 0.07 * s2, py + ny * c * 0.07 * s2); ctx.lineTo(px + (x1 - x0) / n + nx * c * 0.07 * -s2, py + (y1 - y0) / n + ny * c * 0.07 * -s2); } ctx.strokeStyle = 'rgba(240,226,190,0.35)'; ctx.lineWidth = Math.max(1, c * 0.03); ctx.stroke(); };
  y = r.y; j = 0; while (y < r.y + r.h) { const h = c * (0.9 + hash(j, 2) * 1.6); y += h; j++; if (y < r.y + r.h - 2) seam(r.x, y, r.x + r.w, y); }
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,240,200,0.14)'); g.addColorStop(0.5, 'rgba(255,240,200,0)'); g.addColorStop(1, 'rgba(0,0,0,0.25)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.restore();
}
export const lambaniOver = (ctx, S) => edgeShade(ctx, S, 0.3);
export function lambaniSkin(ctx, S, d) {
  const { kind, col, x, y, s } = d, fill = isFilled(kind), lw = Math.max(2, s * 0.1);
  if (kind === 'dot') { cowrie(ctx, x, y, s * 0.34, 0.3); ctx.strokeStyle = rgba(col, 0.9); ctx.lineWidth = Math.max(1.2, s * 0.05); ctx.beginPath(); ctx.ellipse(x, y, s * 0.46, s * 0.34, 0.3, 0, TAU); ctx.stroke(); return; }
  const ladder = (sc, w, c2) => { cord(ctx, kindPath(ctx, kind, x, y, s * sc), w, c2, { dash: [0.4, 0.5] });
    ctx.save(); ctx.lineCap = 'butt'; ctx.setLineDash([w * 0.16, w * 0.55]); kindPath(ctx, kind, x, y, s * sc)(0, 0); ctx.strokeStyle = rgba('#f4ecd0', 0.9); ctx.lineWidth = w * 1.3; ctx.stroke(); ctx.restore(); };
  if (!fill) { ladder(1.04, lw, col); return; }
  const s2 = s * 1.06;
  ctx.save(); kindPath(ctx, kind, x, y, s2)(0, 0); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.save(); ctx.translate(s * 0.03, s * 0.05); ctx.fill(); ctx.restore(); ctx.fillStyle = shade(col, -0.4); ctx.fill(); ctx.clip();
  // herringbone rows: slanted pairs of stitches meeting in a ridge
  const p = Math.max(2, s / 9); ctx.lineCap = 'round';
  for (let j = -6; j <= 6; j++) { const yy = y + j * p * 0.9; for (let i = -6; i <= 6; i++) { const xx = x + i * p * 1.15 + (j & 1) * p * 0.57; ctx.beginPath(); ctx.moveTo(xx - p * 0.5, yy + p * 0.3); ctx.lineTo(xx, yy - p * 0.3); ctx.lineTo(xx + p * 0.5, yy + p * 0.3); ctx.strokeStyle = shade(col, ((i + j) & 1 ? 0.12 : -0.08)); ctx.lineWidth = p * 0.52; ctx.stroke(); } }
  const og = ctx.createRadialGradient(x - s * 0.2, y - s * 0.25, s * 0.06, x, y, s * 0.62); og.addColorStop(0, 'rgba(255,255,230,0.22)'); og.addColorStop(0.6, 'rgba(255,255,230,0)'); og.addColorStop(1, 'rgba(0,0,0,0.34)'); ctx.fillStyle = og; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  ctx.restore(); ladder(1.08, lw * 0.7, '#f1e6c4');
  if (kind === 'diamond' || kind === 'star' || kind === 'hexagon' || kind === 'flower') { const R = s * 0.1; ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(x + R * 0.15, y + R * 0.25, R * 1.1, 0, TAU); ctx.fill(); const mg = ctx.createLinearGradient(x - R, y - R, x + R, y + R); mg.addColorStop(0, '#fff'); mg.addColorStop(0.5, '#9aa4b0'); mg.addColorStop(1, '#2a3040'); ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill(); }
}

// ====================================================================================================================================================
// PIPILI: bold cotton cutwork appliqué. Patches of red, yellow, white and green cloth are cut out, laid in layers on a deep-blue ground and edge-stitched in
// blanket stitch; the inner cutouts show the colour underneath. Seen in a sunny courtyard under a scalloped canopy valance.
// ====================================================================================================================================================
POT.clothscrap = (ctx, S, b, col, on) => {
  const x0 = b.x + b.w / 2, y0 = b.y + b.h / 2, r = Math.min(b.w, b.h) / 2, lift = on ? -3 : 0;
  ctx.save(); roundRectPath(ctx, b.x, b.y, b.w, b.h, 12); ctx.fillStyle = 'rgba(30,10,0,0.5)'; ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(x0, y0 + lift);
  for (let k = 2; k >= 0; k--) { const o = k * r * 0.13, W = r * 1.15, H = r * 0.55, c2 = shade(col, k === 0 ? 0.08 : -0.12 * k);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-W / 2 + o + 2, -H / 2 + o * 1.4 + 3, W, H);
    ctx.fillStyle = c2; ctx.fillRect(-W / 2 + o, -H / 2 + o * 1.4, W, H); ctx.strokeStyle = 'rgba(255,248,224,0.8)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.2; ctx.strokeRect(-W / 2 + o + 3, -H / 2 + o * 1.4 + 3, W - 6, H - 6); ctx.setLineDash([]); }
  ctx.restore();
  ctx.save(); ctx.strokeStyle = on ? S.pal.accent : 'rgba(255,255,255,0.28)'; ctx.lineWidth = on ? 4 : 1.5; roundRectPath(ctx, b.x, b.y, b.w, b.h, 12); ctx.stroke();
  if (on) { ctx.fillStyle = S.pal.accent; ctx.beginPath(); ctx.arc(b.x + b.w - 7, b.y + 7, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x + b.w - 9.5, b.y + 7); ctx.lineTo(b.x + b.w - 7.2, b.y + 9); ctx.lineTo(b.x + b.w - 4.5, b.y + 5); ctx.stroke(); }
  ctx.restore();
};
export function pipiliEnv(ctx, S) {
  const a = S.area, X0 = a.x - 12, W = a.w + 24, c = S.cell;
  const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#e08a48'); g.addColorStop(0.5, '#c4602c'); g.addColorStop(1, '#8a3418'); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, a.h);
  speck(ctx, { x: X0, y: a.y, w: W, h: a.h }, 480, ['#5a2008', '#ffd8a0'], 0.2, 2.2, 47);
  // swept-earth strokes
  ctx.strokeStyle = 'rgba(255,220,170,0.1)'; ctx.lineWidth = c * 0.12; ctx.lineCap = 'round'; for (let k = 0; k < 14; k++) { const y = a.y + a.h * (0.1 + hash(k, 1) * 0.85), x = a.x + hash(k, 2) * a.w; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + c * 1.5, y - c * 0.3, x + c * 3, y + c * 0.1); ctx.stroke(); }
  // canopy valance along the top: red, yellow and blue pennants with a sewn edge, throwing striped shade
  const vh = c * 1.5, cols = ['#d8281c', '#f0c020', '#1f4aa8', '#ffffff'];
  ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, a.h); ctx.clip();
  ctx.fillStyle = 'rgba(40,10,0,0.28)'; ctx.fillRect(X0, a.y + vh, W, c * 0.9); const sg = ctx.createLinearGradient(0, a.y + vh, 0, a.y + vh + c * 3); sg.addColorStop(0, 'rgba(40,10,0,0.3)'); sg.addColorStop(1, 'rgba(40,10,0,0)'); ctx.fillStyle = sg; ctx.fillRect(X0, a.y + vh, W, c * 3);
  ctx.fillStyle = '#2a60c0'; ctx.fillRect(X0, a.y, W, vh * 0.42);
  for (let x = X0, i = 0; x < X0 + W; x += c * 1.2, i++) { ctx.fillStyle = cols[i % 4]; ctx.beginPath(); ctx.moveTo(x, a.y + vh * 0.42); ctx.lineTo(x + c * 1.2, a.y + vh * 0.42); ctx.lineTo(x + c * 0.6, a.y + vh * 1.02); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,248,224,0.7)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]); }
  ctx.restore();
  glow(ctx, a.x + a.w * 0.3, a.y + a.h * 0.4, Math.max(a.w, a.h) * 0.8, '#fff0c0', 0.22);
  vignette(ctx, a, 0.38);
}
export function pipiliGround(ctx, S) { clothGround(ctx, S, { count: 9, wa: 0.16, ka: 0.14, lit: 0.18, dark: 0.22 }); }
export const pipiliOver = (ctx, S) => edgeShade(ctx, S, 0.28);
export function pipiliSkin(ctx, S, d) {
  const { kind, col, x, y, s, key } = d, fill = isFilled(kind), w = Math.max(3, s * 0.13);
  const stitch = (sc, c2, w2) => { ctx.save(); ctx.lineCap = 'butt'; ctx.setLineDash([Math.max(1, w2 * 0.16), Math.max(2, w2 * 0.5)]); kindPath(ctx, kind, x, y, s * sc)(0, 0); ctx.strokeStyle = c2; ctx.lineWidth = w2; ctx.stroke(); ctx.restore(); };
  ctx.lineJoin = 'round';
  if (!fill) { // binding tape: flat cloth strip with edge stitches
    kindPath(ctx, kind, x, y, s * 1.04)(s * 0.03, s * 0.05); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(10,10,40,0.4)'; ctx.lineWidth = w * 1.1; ctx.stroke();
    kindPath(ctx, kind, x, y, s * 1.04)(0, 0); ctx.strokeStyle = shade(col, -0.35); ctx.lineWidth = w * 1.05; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w * 0.85; ctx.stroke();
    stitch(1.04, rgba('#fff6dc', 0.9), w * 0.95); return;
  }
  const s2 = s * 1.1;
  ctx.save(); kindPath(ctx, kind, x, y, s2)(s * 0.035, s * 0.06); ctx.fillStyle = 'rgba(10,10,40,0.42)'; ctx.fill(); ctx.restore();
  ctx.save(); kindPath(ctx, kind, x, y, s2)(0, 0); ctx.fillStyle = col; ctx.fill(); ctx.clip();
  if (!S.lite) speck(ctx, { x: x - s, y: y - s, w: s * 2, h: s * 2 }, 40, [shade(col, 0.3), shade(col, -0.3)], 0.25, Math.max(0.8, s * 0.02), 5 + (key | 0));
  const lg = ctx.createLinearGradient(x - s / 2, y - s / 2, x + s / 2, y + s / 2); lg.addColorStop(0, 'rgba(255,255,255,0.2)'); lg.addColorStop(1, 'rgba(0,0,0,0.22)'); ctx.fillStyle = lg; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  ctx.restore();
  // cutwork: a second layer visible through the cut-out (the colour underneath), pierced with small eyelets
  const under = mix(col, '#fff2cc', 0.72);
  ctx.save(); kindPath(ctx, kind, x, y, s * 0.58)(0, 0); ctx.fillStyle = shade(col, -0.45); ctx.fill(); ctx.clip(); kindPath(ctx, kind, x, y, s * 0.58)(0, 0); ctx.fillStyle = under; ctx.save(); ctx.translate(s * 0.02, s * 0.025); ctx.fill(); ctx.restore(); ctx.restore();
  ctx.fillStyle = 'rgba(30,10,30,0.7)'; const e = Math.max(1.1, s * 0.035); for (const [dx, dy] of [[-0.12, -0.1], [0.12, -0.1], [0, 0.1]]) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, e, 0, TAU); ctx.fill(); }
  kindPath(ctx, kind, x, y, s * 0.58)(0, 0); ctx.strokeStyle = rgba(shade(col, -0.6), 0.8); ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke();
  stitch(0.58, rgba('#fff6dc', 0.9), s * 0.07);
  kindPath(ctx, kind, x, y, s2)(0, 0); ctx.strokeStyle = rgba(shade(col, -0.55), 0.9); ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke(); stitch(1.03, rgba('#fff6dc', 0.95), s * 0.1);
}

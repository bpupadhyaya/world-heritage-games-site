// Scene art, 1.13.0 (stitch and thread, part 2): hardanger (whitework: kloster blocks round cut-and-drawn squares) and bargello (flame stitch on canvas).
// Pure canvas 2D, hash-only randomness, no figures, no text. Uses the counted-grid helper of scene-stitch.js.
import { hash, rgba, mix, shade, roundRectPath, rod, ball, poly, speck, glow, vignette, TAU, motifPath, isFilled, POT } from './scene-kit.js';
import { TOOLS } from './scene-tools.js';
import { edgeShade, lightShaft, isLand } from './scene-needle.js';
import { clothWeave } from './scene-y.js';
import { rasterMask, selRing, backing } from './scene-stitch.js';

const softE = (ctx, x, y, rx, ry, a = 0.3) => { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); };
const pressOf = (T) => Math.max(0, 1 - T.a / 0.45);
const bxr = (b) => ({ cx: b.x + b.w / 2, cy: b.y + b.h / 2, r: Math.min(b.w, b.h) / 2 });

// ====================================================================================================================================================
// HARDANGER: whitework on coarse even-weave linen. A stamp is a ring of kloster blocks (five satin stitches each, set square to the cut edge) round a cut-and-
// drawn square whose threads are cut away: the open square shows the table through woven bars with a dove's eye (picot) at each crossing.
// ====================================================================================================================================================
export const HARD_LINEN = '#e3d8bf';
export function hardEnv(ctx, S) {
  const a = S.area, b = S.box, r = S.rect, c = S.cell, X0 = a.x - 12, W = a.w + 24, land = isLand(S);
  const cx0 = r.x + r.w / 2, cy0 = r.y + r.h / 2, Rin = Math.hypot(r.w, r.h) / 2 + c * 0.08, tH = Math.max(8, c * 0.42), wallBot = cy0 - Rin * 0.28;
  // painted table top: slate-blue boards
  const tg = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); tg.addColorStop(0, '#6a86a2'); tg.addColorStop(1, '#3f566e'); ctx.fillStyle = tg; ctx.fillRect(X0, a.y, W, a.h);
  const bw = c * 2.2; for (let xx = X0, i = 0; xx < X0 + W; xx += bw, i++) { ctx.fillStyle = rgba(hash(i, 2) > 0.5 ? '#fff' : '#000', 0.05 + hash(i, 3) * 0.04); ctx.fillRect(xx, a.y, bw, a.h); ctx.fillStyle = 'rgba(10,20,40,0.45)'; ctx.fillRect(xx, a.y, 1.6, a.h); ctx.fillStyle = 'rgba(220,235,255,0.14)'; ctx.fillRect(xx + 1.6, a.y, 1, a.h); }
  ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, a.h); ctx.clip(); ctx.strokeStyle = 'rgba(20,34,56,0.16)'; ctx.lineWidth = 1;
  for (let i = 0; i < 60; i++) { const gx = X0 + hash(i, 5) * W, gy = a.y + hash(i, 6) * a.h, gl = c * (2 + hash(i, 7) * 4); ctx.beginPath(); ctx.moveTo(gx, gy); ctx.bezierCurveTo(gx + (hash(i, 8) - 0.5) * 4, gy + gl * 0.3, gx + (hash(i, 9) - 0.5) * 4, gy + gl * 0.7, gx + (hash(i, 10) - 0.5) * 3, gy + gl); ctx.stroke(); }
  ctx.restore();
  // log wall behind the hoop with the window at the upper left
  const wallH = Math.max(c * 3, wallBot - a.y), lh = Math.max(10, c * 0.95); ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, wallH); ctx.clip();
  for (let yy = a.y, i = 0; yy < a.y + wallH + lh; yy += lh, i++) { const g = ctx.createLinearGradient(0, yy, 0, yy + lh); g.addColorStop(0, '#e0a862'); g.addColorStop(0.5, '#b87a38'); g.addColorStop(1, '#6a4018'); ctx.fillStyle = g; ctx.fillRect(X0, yy, W, lh - 1); ctx.fillStyle = 'rgba(255,230,180,0.28)'; ctx.fillRect(X0, yy + 1, W, Math.max(1, lh * 0.08)); for (let k = 0; k < 7; k++) { ctx.strokeStyle = 'rgba(60,30,8,0.3)'; ctx.lineWidth = 1; const yy2 = yy + lh * (0.2 + hash(i, k, 3) * 0.6), x2 = X0 + hash(i, k, 4) * W; ctx.beginPath(); ctx.moveTo(x2, yy2); ctx.lineTo(x2 + c * (1 + hash(i, k, 5) * 3), yy2 + (hash(i, k, 6) - 0.5) * 2); ctx.stroke(); } }
  const ww = Math.min(land ? Math.max(c * 2.6, (b.x + b.w * 0.22) - (a.x + c)) : c * 3.4, c * 4.2), wx = land ? a.x + a.w * 0.36 - ww - c * 0.4 : b.x + c * 0.45, wy = Math.max(a.y + c * 0.5, b.y + c * 0.25), wh = Math.max(c * 1.5, Math.min(wallBot - wy - c * 0.35, ww * 1.15));
  const sky = ctx.createLinearGradient(0, wy, 0, wy + wh); sky.addColorStop(0, '#d2e8f8'); sky.addColorStop(1, '#ffffff'); ctx.fillStyle = sky; ctx.fillRect(wx, wy, ww, wh);
  ctx.fillStyle = '#7f9fbe'; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + wh * 0.62); ctx.lineTo(wx + ww * 0.25, wy + wh * 0.32); ctx.lineTo(wx + ww * 0.45, wy + wh * 0.55); ctx.lineTo(wx + ww * 0.7, wy + wh * 0.2); ctx.lineTo(wx + ww, wy + wh * 0.5); ctx.lineTo(wx + ww, wy + wh); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f8fbff'; ctx.beginPath(); ctx.moveTo(wx + ww * 0.25, wy + wh * 0.32); ctx.lineTo(wx + ww * 0.17, wy + wh * 0.42); ctx.lineTo(wx + ww * 0.33, wy + wh * 0.42); ctx.closePath(); ctx.moveTo(wx + ww * 0.7, wy + wh * 0.2); ctx.lineTo(wx + ww * 0.6, wy + wh * 0.34); ctx.lineTo(wx + ww * 0.8, wy + wh * 0.34); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2c5878'; ctx.fillRect(wx, wy + wh * 0.82, ww, wh * 0.18);
  ctx.strokeStyle = '#f6f2e8'; ctx.lineWidth = Math.max(2.5, c * 0.12); ctx.strokeRect(wx, wy, ww, wh); ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh * 0.5); ctx.lineTo(wx + ww, wy + wh * 0.5); ctx.stroke();
  if (!S.lite) {
    // a peg rail with a hanging linen runner (blue kloster band, fringe) and a shelf of pearl cotton and a jar, right of the window
    const rx0 = wx + ww + c * 0.7, rx1 = Math.min(b.x + b.w - c * 0.3, a.x + a.w - c * 0.3);
    if (rx1 - rx0 > c * 2.2) {
      const cw = Math.min(c * 2.3, (rx1 - rx0) * 0.42), cx2 = rx0 + cw * 0.1, ry = wy + c * 0.05, ch = Math.max(c * 1.1, Math.min(cy0 - Rin - tH - ry - c * 0.35, c * 3.6));
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(cx2 + 4, ry + c * 0.12, cw, ch);
      ctx.fillStyle = '#efe6d0'; ctx.fillRect(cx2, ry + c * 0.1, cw, ch); ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(cx2 + cw * 0.7, ry + c * 0.1, cw * 0.3, ch);
      ctx.fillStyle = '#2f5f8f'; ctx.fillRect(cx2, ry + ch * 0.62, cw, c * 0.16); ctx.fillRect(cx2, ry + ch * 0.62 + c * 0.3, cw, c * 0.06);
      for (let q = 0; q < 4; q++) { ctx.fillStyle = '#fbf8ee'; ctx.fillRect(cx2 + cw * (0.1 + q * 0.22), ry + ch * 0.2, cw * 0.14, cw * 0.14); ctx.fillStyle = '#241a12'; ctx.fillRect(cx2 + cw * (0.14 + q * 0.22), ry + ch * 0.2 + cw * 0.04, cw * 0.06, cw * 0.06); }
      ctx.strokeStyle = '#efe6d0'; ctx.lineWidth = 1; ctx.beginPath(); for (let q = 0; q < 14; q++) { const fx = cx2 + (q + 0.5) * cw / 14; ctx.moveTo(fx, ry + ch + c * 0.1); ctx.lineTo(fx + (hash(q, 4) - 0.5) * 2, ry + ch + c * 0.28); } ctx.stroke();
      rod(ctx, cx2 - c * 0.2, ry + c * 0.1, cx2 + cw + c * 0.2, ry + c * 0.1, c * 0.14, '#8a5a2a'); ball(ctx, cx2 - c * 0.2, ry + c * 0.1, c * 0.12, '#caa266', false); ball(ctx, cx2 + cw + c * 0.2, ry + c * 0.1, c * 0.12, '#caa266', false);
      const sx0 = cx2 + cw + c * 0.6, sw3 = Math.min(rx1 - sx0, c * 2.6), sy3 = ry + ch * 0.8;
      if (sw3 > c * 1.2) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(sx0 + 3, sy3 + 3, sw3, c * 0.16); const shg = ctx.createLinearGradient(0, sy3, 0, sy3 + c * 0.16); shg.addColorStop(0, '#e8c690'); shg.addColorStop(1, '#8a5a2a'); ctx.fillStyle = shg; ctx.fillRect(sx0, sy3, sw3, c * 0.16);
        const colsB = ['#fbf8ee', '#2f5f8f', '#b3262d']; for (let q = 0; q < 3; q++) ball(ctx, sx0 + sw3 * (0.2 + q * 0.3), sy3 - c * 0.26, c * 0.26, colsB[q], false);
        const jx2 = sx0 + sw3 * 0.5, jy2 = sy3 - c * 0.62; ctx.fillStyle = '#f4f2ea'; roundRectPath(ctx, jx2 - c * 0.3, jy2 - c * 0.62, c * 0.6, c * 0.62, 5); ctx.fill(); ctx.strokeStyle = '#2f5f8f'; ctx.lineWidth = Math.max(1.5, c * 0.06); ctx.beginPath(); ctx.moveTo(jx2 - c * 0.3, jy2 - c * 0.42); ctx.lineTo(jx2 + c * 0.3, jy2 - c * 0.42); ctx.moveTo(jx2 - c * 0.3, jy2 - c * 0.2); ctx.lineTo(jx2 + c * 0.3, jy2 - c * 0.2); ctx.stroke();
      }
    }
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(X0, a.y + wallH, W, 5); const eg = ctx.createLinearGradient(0, a.y + wallH, 0, a.y + wallH + c * 1.4); eg.addColorStop(0, 'rgba(10,20,40,0.55)'); eg.addColorStop(1, 'rgba(10,20,40,0)'); ctx.fillStyle = eg; ctx.fillRect(X0, a.y + wallH + 4, W, c * 1.4);
  // cool daylight from the window across the table
  lightShaft(ctx, a, wx - c * 0.5, ww * 1.6, a.w * 0.45, '#e6f2ff', 0.2, 1);
  glow(ctx, wx + ww * 0.5, wy + wh * 0.5, Math.max(a.w, a.h) * 0.8, '#eaf5ff', 0.3);
  if (!S.lite) {
    // sharp-pointed scissors and a birch bowl of pearl cotton balls in the table's lower corners (inside the box's free corners)
    const sx = b.x + b.w * (land ? 0.14 : 0.2), sy = Math.min(a.y + a.h - c * 0.8, b.y + b.h - c * 0.9);
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(-0.5); const k = c * 1.05;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(k * 0.2, k * 0.3, k * 1.6, k * 0.2, 0, 0, TAU); ctx.fill();
    for (const sg of [-1, 1]) { const g = ctx.createLinearGradient(0, -k * 0.1, 0, k * 0.1); g.addColorStop(0, '#f8fbff'); g.addColorStop(1, '#7c8894'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(k * 1.9, sg * k * 0.03); ctx.lineTo(0, sg * k * 0.14); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#d8b14a'; ctx.lineWidth = Math.max(2, k * 0.1); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-k * 0.5, sg * k * 0.15, -k * 0.8, sg * k * 0.42); ctx.stroke(); ctx.beginPath(); ctx.ellipse(-k * 1.0, sg * k * 0.5, k * 0.28, k * 0.2, sg * 0.5, 0, TAU); ctx.stroke(); }
    ctx.restore();
    const bx2 = b.x + b.w * (land ? 0.86 : 0.82), by2 = Math.min(a.y + a.h - c * 0.9, b.y + b.h - c * 0.9), R = c * 1.0;
    ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.ellipse(bx2 + R * 0.15, by2 + R * 0.3, R * 1.05, R * 0.55, 0, 0, TAU); ctx.fill();
    const bg = ctx.createRadialGradient(bx2 - R * 0.3, by2 - R * 0.3, R * 0.1, bx2, by2, R); bg.addColorStop(0, '#f0e2c0'); bg.addColorStop(1, '#a88a58'); ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(bx2, by2, R, R * 0.62, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4a3a24'; ctx.beginPath(); ctx.ellipse(bx2, by2 - R * 0.04, R * 0.82, R * 0.46, 0, 0, TAU); ctx.fill();
    const cols = ['#fbf8ee', '#b3262d', '#2f5f8f']; for (let q = 0; q < 3; q++) ball(ctx, bx2 + (q - 1) * R * 0.5, by2 - R * (0.12 + (q === 1 ? 0.18 : 0)), R * 0.34, cols[q], false);
  }
  void tH;
  vignette(ctx, a, 0.4);
}
// the hoop: cloth drawn out round it, an inner and an outer ring of beech with a brass tightening screw at the top
export function hardUnder(ctx, S) {
  const r = S.rect, c = S.cell, cx = r.x + r.w / 2, cy = r.y + r.h / 2, Rin = Math.hypot(r.w, r.h) / 2 + c * 0.08, t = Math.max(8, c * 0.42);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = c * 0.9; ctx.shadowOffsetX = c * 0.4; ctx.shadowOffsetY = c * 0.5; ctx.fillStyle = S.bg; ctx.beginPath(); ctx.arc(cx, cy, Rin + t + c * 0.2, 0, TAU); ctx.fill(); ctx.restore();
  ctx.fillStyle = S.bg; ctx.beginPath(); ctx.arc(cx, cy, Rin + t * 0.9, 0, TAU); ctx.fill();
  { const dg = ctx.createRadialGradient(cx - Rin * 0.4, cy - Rin * 0.5, Rin * 0.1, cx, cy, Rin + t); dg.addColorStop(0, 'rgba(255,255,250,0.35)'); dg.addColorStop(0.6, 'rgba(255,255,250,0)'); dg.addColorStop(1, 'rgba(60,44,20,0.3)'); ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(cx, cy, Rin + t * 0.9, 0, TAU); ctx.fill(); }
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, Rin + t + c * 0.2, 0, TAU); ctx.clip(); ctx.strokeStyle = 'rgba(80,60,30,0.22)'; ctx.lineWidth = Math.max(1, c * 0.04);
  for (let k = 0; k < 9; k++) { const an = hash(k, 1) * TAU; ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * (Rin + t), cy + Math.sin(an) * (Rin + t)); ctx.lineTo(cx + Math.cos(an + 0.04) * (Rin + t + c * 0.3), cy + Math.sin(an + 0.04) * (Rin + t + c * 0.3)); ctx.stroke(); }
  ctx.restore();
  const ringPass = (rad, w, col, a0, a1) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(cx, cy, rad, a0 ?? 0, a1 ?? TAU); ctx.stroke(); };
  ringPass(Rin + t * 0.5, t * 1.08, '#5a3a14'); ringPass(Rin + t * 0.5, t * 0.9, '#d2a864');
  ringPass(Rin + t * 0.5, t * 0.34, '#f0d494', Math.PI * 0.78, Math.PI * 1.7); ringPass(Rin + t * 0.5, t * 0.3, 'rgba(70,40,10,0.5)', -0.4, Math.PI * 0.55);
  ringPass(Rin + t * 0.05, Math.max(1.5, t * 0.08), 'rgba(50,30,8,0.6)');
  const sx = cx, sy = cy - Rin - t * 0.5;
  ctx.fillStyle = '#9a6a26'; roundRectPath(ctx, sx - t * 0.7, sy - t * 0.62, t * 1.4, t * 1.24, 3); ctx.fill();
  const bg = ctx.createLinearGradient(sx - t * 0.45, 0, sx + t * 0.45, 0); bg.addColorStop(0, '#f6dc7a'); bg.addColorStop(0.5, '#caa03a'); bg.addColorStop(1, '#7a5a14'); ctx.fillStyle = bg; roundRectPath(ctx, sx - t * 0.42, sy - t * 0.9, t * 0.84, t * 0.9, 3); ctx.fill();
  ctx.fillStyle = '#e8c860'; ctx.beginPath(); ctx.arc(sx, sy - t * 1.0, t * 0.42, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(70,46,8,0.7)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(sx - t * 0.3, sy - t * 1.0); ctx.lineTo(sx + t * 0.3, sy - t * 1.0); ctx.stroke();
}
export function hardGround(ctx, S) {
  const r = S.rect, c = S.cell;
  clothWeave(ctx, r, S, S.bg, { density: 20, a: 0.2, specks: 60 });
  if (c > 18) { const pp = c / 5; ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); ctx.fillStyle = 'rgba(70,52,26,0.13)'; ctx.beginPath(); const nx = Math.ceil(r.w / pp), ny = Math.ceil(r.h / pp), q = Math.max(0.7, pp * 0.07); for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { ctx.moveTo(r.x + i * pp + q, r.y + j * pp); ctx.arc(r.x + i * pp, r.y + j * pp, q, 0, TAU); } ctx.fill(); ctx.restore(); }
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(235,245,255,0.26)'); g.addColorStop(0.55, 'rgba(235,245,255,0)'); g.addColorStop(1, 'rgba(20,34,56,0.22)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
}
export function hardOver(ctx, S) { edgeShade(ctx, S, 0.18); }
// hand-set kloster bitmaps (5 x 5 blocks): a block is a cell on the edge of the shape, a cell whose four neighbours are all inside is cut away
const HB = { solid: ['XXXXX', 'XXXXX', 'XXXXX', 'XXXXX', 'XXXXX'], diamond: ['..X..', '.XXX.', 'XXXXX', '.XXX.', '..X..'], dot: ['.....', '.XXX.', '.XXX.', '.XXX.', '.....'], cross: ['..X..', '..X..', 'XXXXX', '..X..', '..X..'], star: ['X.X.X', '.XXX.', 'XXXXX', '.XXX.', 'X.X.X'], hexagon: ['.XXX.', 'XXXXX', 'XXXXX', 'XXXXX', '.XXX.'], triangle: ['.....', '..X..', '.XXX.', 'XXXXX', '.....'], checker: ['XX...', 'XX...', '..X..', '...XX', '...XX'], arch: ['.XXX.', 'XXXXX', 'XX.XX', 'XX.XX', 'XX.XX'] };
const HMASK = new Map();
function hardMask(ctx, kind) {
  let m = HMASK.get(kind); if (m) return m;
  if (HB[kind]) { const inside = new Uint8Array(25); HB[kind].forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') inside[j * 5 + i] = 1; })); m = { G: 5, inside }; }
  else m = rasterMask(ctx, kind, 5, 5, 1.25);
  HMASK.set(kind, m); return m;
}
export function hardSkin(ctx, S, d) {
  const { kind, col, x, y } = d, G = 5, pp = d.s / 4.55, m = hardMask(ctx, kind), x0 = x - (G / 2) * pp, y0 = y - (G / 2) * pp;
  const inn = (i, j) => i >= 0 && j >= 0 && i < G && j < G && m.inside[j * G + i] === 1;
  const holes = [], blocks = [];
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { if (!inn(i, j)) continue; const interior = inn(i - 1, j) && inn(i + 1, j) && inn(i, j - 1) && inn(i, j + 1); if (interior) holes.push([i, j]); else blocks.push([i, j, inn(i, j - 1) || inn(i, j + 1) ? 0 : inn(i - 1, j) || inn(i + 1, j) ? 1 : (i + j) & 1]); }
  // the square to be cut: its threads are gone, the table shows through; a cross of woven bars and a dove's eye at the centre of every opening
  if (holes.length) {
    ctx.save(); ctx.fillStyle = '#241a12'; ctx.beginPath(); for (const [i, j] of holes) ctx.rect(x0 + i * pp - 0.4, y0 + j * pp - 0.4, pp + 0.8, pp + 0.8); ctx.fill();
    const gl = ctx.createLinearGradient(x0, y0, x0 + G * pp, y0 + G * pp); gl.addColorStop(0, 'rgba(120,150,190,0.3)'); gl.addColorStop(1, 'rgba(0,0,0,0.1)'); ctx.fillStyle = gl; ctx.beginPath(); for (const [i, j] of holes) ctx.rect(x0 + i * pp, y0 + j * pp, pp, pp); ctx.fill();
    ctx.lineCap = 'round'; const bwd = Math.max(1.1, pp * 0.17);
    const bars = (dx, dy) => { ctx.beginPath(); for (const [i, j] of holes) { const cx = x0 + (i + 0.5) * pp + dx, cy = y0 + (j + 0.5) * pp + dy; ctx.moveTo(cx - pp * 0.5, cy); ctx.lineTo(cx + pp * 0.5, cy); ctx.moveTo(cx, cy - pp * 0.5); ctx.lineTo(cx, cy + pp * 0.5); } };
    bars(0.4, 0.7); ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = bwd * 1.5; ctx.stroke();
    bars(0, 0); ctx.strokeStyle = shade(col, -0.3); ctx.lineWidth = bwd * 1.35; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = bwd; ctx.stroke();
    ctx.beginPath(); for (const [i, j] of holes) { const cx = x0 + (i + 0.5) * pp, cy = y0 + (j + 0.5) * pp, R = pp * 0.2; ctx.moveTo(cx + R, cy); ctx.arc(cx, cy, R, 0, TAU); for (let k = 0; k < 4; k++) { const an = (k + 0.5) * TAU / 4; ctx.moveTo(cx + Math.cos(an) * R, cy + Math.sin(an) * R); ctx.lineTo(cx + Math.cos(an) * R * 1.9, cy + Math.sin(an) * R * 1.9); } } ctx.strokeStyle = shade(col, 0.2); ctx.lineWidth = Math.max(0.8, bwd * 0.7); ctx.stroke();
    ctx.restore();
  }
  // kloster blocks: five satin stitches, side by side, each block square to the cut edge
  if (blocks.length) {
    ctx.save(); ctx.fillStyle = 'rgba(30,20,8,0.34)'; ctx.beginPath(); for (const [i, j] of blocks) ctx.rect(x0 + i * pp + pp * 0.1, y0 + j * pp + pp * 0.16, pp, pp); ctx.fill();
    const pass = (dx, dy, lwk, style) => { ctx.beginPath(); for (const [i, j, o] of blocks) for (let k = 0; k < 5; k++) { const f = (k + 0.5) / 5; if (o === 0) { const xx = x0 + i * pp + f * pp + dx; ctx.moveTo(xx, y0 + j * pp + pp * 0.03 + dy); ctx.lineTo(xx, y0 + (j + 1) * pp - pp * 0.03 + dy); } else { const yy = y0 + j * pp + f * pp + dy; ctx.moveTo(x0 + i * pp + pp * 0.03 + dx, yy); ctx.lineTo(x0 + (i + 1) * pp - pp * 0.03 + dx, yy); } } ctx.lineWidth = Math.max(0.6, pp * lwk); ctx.strokeStyle = style; ctx.stroke(); };
    ctx.lineCap = 'round';
    pass(0, 0, 0.215, shade(col, -0.48)); pass(0, 0, 0.17, col); pass(-pp * 0.03, -pp * 0.03, 0.06, rgba(shade(col, 0.7), 0.85));
    ctx.restore();
  }
}

// ====================================================================================================================================================
// BARGELLO (Florentine, flame stitch): long upright stitches over several canvas threads, every column stepped up or down from its neighbour so the rows run in
// a zigzag, the shades of one wool graded row by row. A stamp is a flame field laid only where the shape is; the border of the canvas is worked as well.
// ====================================================================================================================================================
const SHADES = [-0.36, -0.16, 0.04, 0.24, 0.42];
const triWave = (i, per) => { const t = ((i % per) + per) % per, h = per / 2; return t < h ? t : per - t; };
// flame stitches inside the bounds: test(xc, yc) decides which stitch centres are worked
export function flameDraw(ctx, o) {
  const { x0, y0, x1, y1, w, L, step, col, test, phase = 0, per = 10, shift = 0 } = o, lev = [[], [], [], [], []], all = [];
  const n = Math.ceil((x1 - x0) / w), rowsN = Math.ceil((y1 - y0) / L) + 8;
  for (let i = 0; i < n; i++) {
    const xc = x0 + (i + 0.5) * w, off = triWave(i + phase, per) * step;
    for (let k = -4; k < rowsN; k++) { const yc = y0 + off + k * L + L * 0.5 - shift; if (yc < y0 - L || yc > y1 + L) continue; if (!test(xc, yc)) continue; const lv = (((k + (o.rowShift ?? 0)) % 5) + 5) % 5; lev[lv].push([xc, yc]); all.push([xc, yc]); }
  }
  if (!all.length) return;
  ctx.lineCap = 'round'; const hl = L / 2 - w * 0.42;
  const strokeAll = (list, dx, dy, lw, style) => { ctx.beginPath(); for (const [xc, yc] of list) { ctx.moveTo(xc + dx, yc - hl + dy); ctx.lineTo(xc + dx, yc + hl + dy); } ctx.lineWidth = lw; ctx.strokeStyle = style; ctx.stroke(); };
  strokeAll(all, w * 0.12, w * 0.22, w * 1.0, 'rgba(0,0,0,0.34)');
  for (let q = 0; q < 5; q++) { const c2 = shade(col, SHADES[q]); if (!lev[q].length) continue; strokeAll(lev[q], 0, 0, w * 1.02, shade(c2, -0.42)); strokeAll(lev[q], 0, 0, w * 0.82, c2); strokeAll(lev[q], -w * 0.17, 0, w * 0.2, rgba(shade(c2, 0.55), 0.75)); }
}
export function bargelloEnv(ctx, S) {
  const a = S.area, c = S.cell, X0 = a.x - 12, W = a.w + 24, land = isLand(S), wallH = a.h * 0.26;
  // walnut desk with a pale boxwood inlay line, a stone window above it looking over Tuscan hills
  const dg = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); dg.addColorStop(0, '#4e2a16'); dg.addColorStop(1, '#2a140a'); ctx.fillStyle = dg; ctx.fillRect(X0, a.y, W, a.h);
  ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, a.h); ctx.clip(); ctx.strokeStyle = 'rgba(10,4,0,0.35)'; ctx.lineWidth = 1.1;
  for (let i = 0; i < 70; i++) { const gy = a.y + hash(i, 5) * a.h, gx = X0 + hash(i, 6) * W, gl = c * (3 + hash(i, 7) * 6); ctx.beginPath(); ctx.moveTo(gx, gy); ctx.bezierCurveTo(gx + gl * 0.3, gy + (hash(i, 8) - 0.5) * 7, gx + gl * 0.6, gy + (hash(i, 9) - 0.5) * 7, gx + gl, gy + (hash(i, 10) - 0.5) * 5); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(224,190,120,0.7)'; ctx.lineWidth = Math.max(1.4, c * 0.05); ctx.strokeRect(a.x + c * 0.15, a.y + wallH + c * 0.6, a.w - c * 0.3, a.h - wallH - c * 0.75);
  ctx.strokeStyle = 'rgba(224,190,120,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(a.x + c * 0.28, a.y + wallH + c * 0.73, a.w - c * 0.56, a.h - wallH - c * 1.0);
  ctx.restore();
  // window: grey stone jambs, three lights onto a landscape of hills, cypresses and a pale sky
  ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, wallH + c * 0.3); ctx.clip();
  const wg = ctx.createLinearGradient(0, a.y, 0, a.y + wallH); wg.addColorStop(0, '#8a8a84'); wg.addColorStop(1, '#6a6a64'); ctx.fillStyle = wg; ctx.fillRect(X0, a.y, W, wallH + c * 0.3);
  const n = land ? 5 : 3, ww = (a.w - c * 0.6) / n;
  for (let k = 0; k < n; k++) { const wx = a.x + c * 0.3 + k * ww + ww * 0.08, wv = ww * 0.84, wy = a.y + wallH * 0.1, wh = wallH * 0.86;
    const sky = ctx.createLinearGradient(0, wy, 0, wy + wh); sky.addColorStop(0, '#a8cce0'); sky.addColorStop(1, '#f6e4be'); ctx.fillStyle = sky; ctx.fillRect(wx, wy, wv, wh);
    ctx.fillStyle = '#9ab08a'; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + wh * 0.55); for (let q = 0; q <= 6; q++) ctx.lineTo(wx + wv * q / 6, wy + wh * (0.5 + 0.08 * Math.sin(q * 1.3 + k * 2) + 0.06 * hash(q, k))); ctx.lineTo(wx + wv, wy + wh); ctx.fill();
    ctx.fillStyle = '#5e7a48'; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + wh * 0.78); for (let q = 0; q <= 6; q++) ctx.lineTo(wx + wv * q / 6, wy + wh * (0.74 + 0.05 * Math.sin(q * 1.9 + k))); ctx.lineTo(wx + wv, wy + wh); ctx.fill();
    ctx.fillStyle = '#2a4028'; const cyx = wx + wv * (0.3 + 0.4 * hash(k, 3)); ctx.beginPath(); ctx.moveTo(cyx, wy + wh * 0.42); ctx.quadraticCurveTo(cyx + wv * 0.1, wy + wh * 0.66, cyx + wv * 0.03, wy + wh * 0.8); ctx.lineTo(cyx - wv * 0.03, wy + wh * 0.8); ctx.quadraticCurveTo(cyx - wv * 0.1, wy + wh * 0.66, cyx, wy + wh * 0.42); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = Math.max(1.5, c * 0.06); ctx.strokeRect(wx, wy, wv, wh); ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(wx + 1, wy + wh); ctx.lineTo(wx + 1, wy + 1); ctx.lineTo(wx + wv, wy + 1); ctx.stroke(); }
  ctx.restore();
  const sl = ctx.createLinearGradient(0, a.y + wallH, 0, a.y + wallH + c * 0.45); sl.addColorStop(0, '#bdbdb4'); sl.addColorStop(1, '#6a6a62'); ctx.fillStyle = sl; ctx.fillRect(X0, a.y + wallH, W, c * 0.3);
  const sh = ctx.createLinearGradient(0, a.y + wallH + c * 0.3, 0, a.y + wallH + c * 1.8); sh.addColorStop(0, 'rgba(0,0,0,0.55)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = sh; ctx.fillRect(X0, a.y + wallH + c * 0.3, W, c * 1.5);
  glow(ctx, a.x + a.w * 0.3, a.y + a.h * 0.1, Math.max(a.w, a.h) * 0.9, '#ffe2a0', 0.22);
  // five hanks of one wool in graded shades lying in the desk's free margin (below the frame in portrait, beside it in landscape)
  if (!S.lite) {
    const b = S.box, r = S.rect, t = Math.max(8, c * 0.34) + c * 0.9, gapB = b.y + b.h - (r.y + r.h + t), gapR = b.x + b.w - (r.x + r.w + t);
    const cols = S.colors, hank = (hx, hy, hw, hh, col, rot) => {
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(rot + (land ? Math.PI / 2 : 0)); ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.ellipse(hw * 0.06, hh * 0.12, hw * 0.5, hh * 0.5, 0, 0, TAU); ctx.fill(); ctx.lineCap = 'round';
      for (let q = 0; q < 7; q++) { const o = (q - 3) * hh * 0.07; ctx.strokeStyle = q % 2 ? shade(col, -0.22) : shade(col, 0.1); ctx.lineWidth = hh * 0.12; ctx.beginPath(); ctx.ellipse(0, o, hw * 0.46, hh * 0.3, 0, 0, TAU); ctx.stroke(); }
      ctx.strokeStyle = rgba(shade(col, 0.6), 0.45); ctx.lineWidth = hh * 0.035; ctx.beginPath(); ctx.ellipse(-hw * 0.02, -hh * 0.1, hw * 0.4, hh * 0.22, 0, 3.4, 5.2); ctx.stroke();
      ctx.fillStyle = '#efe6d0'; ctx.fillRect(-hw * 0.1, -hh * 0.5, hw * 0.2, hh); ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(hw * 0.02, -hh * 0.5, hw * 0.08, hh); ctx.restore();
    };
    const base = cols[Math.min(1, cols.length - 1)];
    if (!land && gapB > c * 1.1) { const n = 5, hh = Math.min(gapB * 0.78, c * 1.5), hw = Math.min(b.w / n * 0.92, hh * 1.5); for (let q = 0; q < n; q++) hank(b.x + b.w * (q + 0.5) / n, r.y + r.h + t + gapB * 0.5, hw, hh, shade(base, -0.34 + q * 0.19), (hash(q, 5) - 0.5) * 0.25); }
    else if (land && gapR > c * 1.2) { // a neat pyramid of wool balls in graded shades beside the frame
      const R = Math.min(gapR * 0.2, c * 0.6), gx = r.x + r.w + t + gapR * 0.5, gy = a.y + a.h * 0.66;
      for (const [dx, dy, q] of [[-1, 0, 0], [1, 0, 1], [0, -1.55, 2]]) { const bx = gx + dx * R * 1.0, by = gy + dy * R * 0.95; ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(bx + R * 0.2, by + R * 0.8, R * 1.0, R * 0.35, 0, 0, TAU); ctx.fill(); ball(ctx, bx, by, R, shade(base, -0.3 + q * 0.25), false); ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; for (let k2 = 0; k2 < 6; k2++) { ctx.beginPath(); ctx.ellipse(bx, by, R * (0.6 + hash(k2, q) * 0.4), R * (0.25 + hash(k2, q + 5) * 0.5), hash(k2, q + 9) * 3, 0, TAU); ctx.stroke(); } }
    }
  }
  vignette(ctx, a, 0.46);
}
// scroll frame: two turned rollers, flat side stretchers, canvas laced on, a worked flame border round the open field
export function bargelloUnder(ctx, S) {
  const r = S.rect, c = S.cell, e = c * 0.64, E = { x: r.x - e, y: r.y - e, w: r.w + 2 * e, h: r.h + 2 * e }, rt = Math.max(8, c * 0.34);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = c * 0.9; ctx.shadowOffsetX = c * 0.3; ctx.shadowOffsetY = c * 0.5; ctx.fillStyle = '#d4bf8f'; ctx.fillRect(E.x, E.y, E.w, E.h); ctx.restore();
  clothWeave(ctx, E, S, '#d6c192', { density: 10, a: 0.22, specks: 30 });
  // the worked border (stitches wherever a stitch centre lies in the ring between the canvas edge and the open field)
  const pad = c * 0.1, w = c / 9, L = w * 2.6, base = S.colors[Math.min(3, S.colors.length - 1)] ?? '#a02a2a';
  ctx.save(); ctx.beginPath(); ctx.rect(E.x, E.y, E.w, E.h); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip('evenodd');
  flameDraw(ctx, { x0: E.x + pad, y0: E.y + pad, x1: E.x + E.w - pad, y1: E.y + E.h - pad, w, L, step: w * 1.15, per: 8, col: base, test: (xc, yc) => !(xc > r.x - w * 0.2 && xc < r.x + r.w + w * 0.2 && yc > r.y - L * 0.5 && yc < r.y + r.h + L * 0.5) });
  ctx.restore();
  ctx.strokeStyle = 'rgba(60,40,10,0.45)'; ctx.lineWidth = 1.3; ctx.strokeRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2);
  // flat side stretchers with pegs and lacing, rollers on top and bottom with turned ends
  const sw = Math.max(6, c * 0.22), wood = '#7a4a22';
  rod(ctx, E.x - sw * 0.55, E.y - rt * 0.4, E.x - sw * 0.55, E.y + E.h + rt * 0.4, sw, shade(wood, 0.05)); rod(ctx, E.x + E.w + sw * 0.55, E.y - rt * 0.4, E.x + E.w + sw * 0.55, E.y + E.h + rt * 0.4, sw, shade(wood, -0.18));
  ctx.strokeStyle = 'rgba(244,236,214,0.9)'; ctx.lineWidth = Math.max(1.2, c * 0.04); ctx.beginPath(); for (let k = 0; k < 14; k++) { const yy = E.y + E.h * (k + 0.5) / 14; ctx.moveTo(E.x + 2, yy); ctx.lineTo(E.x - sw * 0.5, yy + c * 0.05); ctx.moveTo(E.x + E.w - 2, yy); ctx.lineTo(E.x + E.w + sw * 0.5, yy + c * 0.05); } ctx.stroke();
  for (const yy of [E.y - rt * 0.1, E.y + E.h + rt * 0.1]) { const up = yy < r.y; rod(ctx, E.x - sw * 1.3, yy, E.x + E.w + sw * 1.3, yy, rt, up ? shade('#9a6232', 0.1) : shade('#9a6232', -0.1)); for (const xx of [E.x - sw * 1.3, E.x + E.w + sw * 1.3]) { ball(ctx, xx, yy, rt * 0.62, '#8a5428', false); } }
}
export function bargelloGround(ctx, S) {
  const r = S.rect, c = S.cell, pp = c / 12;
  clothWeave(ctx, r, S, S.bg, { density: 12, a: 0.26, specks: 40 });
  if (pp > 2.2) { ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); ctx.fillStyle = 'rgba(70,50,20,0.2)'; ctx.beginPath(); const q = Math.max(0.6, pp * 0.1), nx = Math.ceil(r.w / pp), ny = Math.ceil(r.h / pp); if (nx * ny < 5000) for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { ctx.moveTo(r.x + i * pp + q, r.y + j * pp); ctx.arc(r.x + i * pp, r.y + j * pp, q, 0, TAU); } ctx.fill(); ctx.restore(); }
  // the pencilled chart: a faint zigzag line down the canvas to count the steps from
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); ctx.strokeStyle = 'rgba(70,56,40,0.18)'; ctx.lineWidth = Math.max(1, c * 0.025); ctx.setLineDash([c * 0.1, c * 0.07]); ctx.beginPath();
  for (let y = r.y; y < r.y + r.h; y += c) { ctx.moveTo(r.x, y + c * 0.5); for (let i = 1; i <= 4 * Math.ceil(r.w / c); i++) ctx.lineTo(r.x + i * c * 0.25, y + c * (i & 1 ? 0.28 : 0.72)); } ctx.stroke(); ctx.restore();
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,240,205,0.2)'); g.addColorStop(0.55, 'rgba(255,240,205,0)'); g.addColorStop(1, 'rgba(30,14,0,0.3)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
}
export function bargelloOver(ctx, S) { edgeShade(ctx, S, 0.32); }
export function bargelloSkin(ctx, S, d) {
  const { kind, col, x, y } = d, s = d.s * 1.1, fill = isFilled(kind), w = s / 9, L = w * 3;
  ctx.save();
  if (fill) {
    motifPath(ctx, kind, x, y, s); ctx.clip();
    flameDraw(ctx, { x0: x - 4.5 * w, y0: y - 4.5 * w, x1: x + 4.5 * w, y1: y + 4.5 * w, w, L, step: w * 1.45, per: 6, col, test: () => true, phase: 1 });
    ctx.restore(); ctx.save();
    motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(shade(col, -0.55), 0.55); ctx.lineWidth = Math.max(1, w * 0.36); ctx.stroke();
  } else {
    // a line stamp is a row of stitches along the path: one stitch every step, each leaning to the path
    motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.32)'; ctx.lineWidth = w * 1.5; ctx.save(); ctx.translate(w * 0.12, w * 0.22); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = shade(col, -0.5); ctx.lineWidth = w * 1.5; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w * 1.2; ctx.stroke();
    ctx.setLineDash([w * 0.18, w * 0.28]); ctx.strokeStyle = rgba(shade(col, -0.35), 0.7); ctx.lineWidth = w * 1.2; ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = rgba(shade(col, 0.6), 0.7); ctx.lineWidth = Math.max(0.7, w * 0.26); ctx.save(); ctx.translate(-w * 0.3, -w * 0.3); ctx.stroke(); ctx.restore();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// supplies and tools
// ---------------------------------------------------------------------------------------------------------------------------------------------------
Object.assign(POT, {
  // a twisted hank of pearl cotton tied at the neck with a paper band
  pearlhank(ctx, S, b, col, on) {
    const { cx, cy, r } = bxr(b), lift = on ? -3 : 0; backing(ctx, b, '#14202c');
    ctx.save(); ctx.translate(cx, cy + lift); ctx.rotate(-0.25); softE(ctx, r * 0.12, r * 0.72, r * 0.5, r * 0.1);
    ctx.lineCap = 'round';
    for (let k = 0; k < 9; k++) { const o = (k - 4) * r * 0.075; ctx.strokeStyle = k % 2 ? shade(col, -0.22) : shade(col, 0.06); ctx.lineWidth = r * 0.13; ctx.beginPath(); ctx.moveTo(o * 0.4, -r * 0.82); ctx.bezierCurveTo(o * 2.1 + r * 0.3, -r * 0.35, o * 2.1 - r * 0.3, r * 0.35, o * 0.5, r * 0.82); ctx.stroke(); }
    ctx.strokeStyle = rgba(shade(col, 0.75), 0.55); ctx.lineWidth = r * 0.04; ctx.beginPath(); ctx.moveTo(-r * 0.22, -r * 0.7); ctx.bezierCurveTo(-r * 0.4, -r * 0.2, -r * 0.4, r * 0.3, -r * 0.2, r * 0.7); ctx.stroke();
    ctx.fillStyle = '#e9e1cc'; ctx.fillRect(-r * 0.42, -r * 0.12, r * 0.84, r * 0.24); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-r * 0.42, r * 0.04, r * 0.84, r * 0.08); ctx.fillStyle = '#2f5f8f'; ctx.fillRect(-r * 0.42, -r * 0.12, r * 0.84, r * 0.04);
    ctx.restore(); selRing(ctx, S, b, on);
  },
  // three skeins of one wool in graded shades (dark to light), the selected colour in the middle
  woolhank(ctx, S, b, col, on) {
    const { cx, cy, r } = bxr(b), lift = on ? -3 : 0; backing(ctx, b, '#1a0e08');
    ctx.save(); ctx.translate(cx, cy + lift); softE(ctx, 0, r * 0.74, r * 0.8, r * 0.12);
    ctx.lineCap = 'round';
    for (const [k, off] of [[0, -0.5], [2, 0.5], [1, 0]]) { const c2 = shade(col, [-0.34, 0.04, 0.4][k]), xx = off * r * 0.85, rot = off * 0.35; ctx.save(); ctx.translate(xx, 0); ctx.rotate(rot);
      for (let q = 0; q < 6; q++) { const o = (q - 2.5) * r * 0.06; ctx.strokeStyle = q % 2 ? shade(c2, -0.2) : shade(c2, 0.1); ctx.lineWidth = r * 0.11; ctx.beginPath(); ctx.ellipse(o, 0, r * 0.2, r * 0.7, 0, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = '#efe6d0'; ctx.fillRect(-r * 0.24, -r * 0.1, r * 0.48, r * 0.2); ctx.restore(); }
    ctx.restore(); selRing(ctx, S, b, on);
  },
});
Object.assign(TOOLS, {
  // sharp-pointed embroidery scissors with gilt loop handles: the blades snap shut at every cut
  snips(ctx, S, T, o = {}) {
    const u = T.u, p = pressOf(T), open = 0.05 + (1 - p) * 0.2, Lb = u * 2.0, th = (3 * Math.PI) / 4, px = T.x - Math.cos(th) * Lb, py = T.y - Math.sin(th) * Lb;
    softE(ctx, T.x + u * 0.4, T.y + u * 0.1, u * 1.1, u * 0.1, 0.28);
    ctx.save(); ctx.translate(px, py); ctx.rotate(th);
    for (const sg of [-1, 1]) {
      ctx.save(); ctx.rotate(sg * open);
      ctx.strokeStyle = '#d8b04a'; ctx.lineWidth = Math.max(2, u * 0.11); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-u * 0.7, sg * u * 0.1, -u * 0.95, sg * u * 0.45); ctx.stroke(); ctx.beginPath(); ctx.ellipse(-u * 1.12, sg * u * 0.58, u * 0.3, u * 0.2, sg * 0.7, 0, TAU); ctx.stroke();
      const g = ctx.createLinearGradient(0, -u * 0.1, 0, u * 0.1); g.addColorStop(0, '#fbfdff'); g.addColorStop(1, '#7c8894'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -u * 0.1 * sg); ctx.lineTo(Lb, 0); ctx.lineTo(0, u * 0.1 * sg); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#b8902c'; ctx.beginPath(); ctx.arc(0, 0, u * 0.1, 0, TAU); ctx.fill();
    ctx.restore(); void o;
  },
  // a blunt tapestry needle with a fat strand of wool that loops back to a skein
  tapneedle(ctx, S, T, o = {}) {
    const u = T.u, p = pressOf(T), a = 0.2, len = u * 4.2, dip = p * u * 0.2;
    const x1 = T.x, y1 = T.y + dip, x2 = x1 + Math.sin(a) * len, y2 = y1 - Math.cos(a) * len;
    ctx.save(); ctx.lineCap = 'round';
    const wool = (w, c, al) => { ctx.strokeStyle = rgba(c, al); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x2, y2 + u * 0.1); ctx.bezierCurveTo(x2 + u * 1.2, y2 - u * 0.2, x2 + u * 1.6, y2 + u * 1.6, x2 + u * 0.7 + Math.sin(T.t * 1.3) * u * 0.1, y2 + u * 2.4); ctx.stroke(); };
    wool(Math.max(4, u * 0.2), '#000', 0.16); wool(Math.max(3, u * 0.15), shade(T.col, -0.4), 1); wool(Math.max(2.4, u * 0.11), T.col, 1); ctx.setLineDash([u * 0.07, u * 0.09]); wool(Math.max(2, u * 0.1), shade(T.col, 0.3), 0.55); ctx.setLineDash([]);
    softE(ctx, x1 + u * 0.1, y1 + u * 0.1, u * 0.5, u * 0.08, 0.25);
    const g = ctx.createLinearGradient(x1 - u * 0.1, 0, x1 + u * 0.1, 0); g.addColorStop(0, '#f6f9fc'); g.addColorStop(1, '#7c858f'); ctx.strokeStyle = g; ctx.lineWidth = Math.max(2.4, u * 0.1); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.fillStyle = '#d8dde2'; ctx.beginPath(); ctx.arc(x1, y1, Math.max(1.2, u * 0.05), 0, TAU); ctx.fill();
    ctx.strokeStyle = '#2a2f36'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(x2, y2 + u * 0.12, u * 0.04, u * 0.17, 0, 0, TAU); ctx.stroke();
    ctx.restore(); void o;
  },
});
void mix; void poly; void speck; void motifPath; void isFilled; void roundRectPath;

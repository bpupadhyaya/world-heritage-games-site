// Scene art, 1.13.0 (stitch and thread, part 1): assisi (voided cross-stitch) and blackwork (black silk diaper fillings), plus the counted-grid helper that
// hardanger and bargello (scene-stitch2.js) share. Pure canvas 2D, hash-only randomness, no figures, no text.
import { hash, rgba, mix, shade, roundRectPath, rod, ball, poly, speck, glow, vignette, TAU, motifPath, isFilled, lineWidthOf, POT } from './scene-kit.js';
import { TOOLS } from './scene-tools.js';
import { cord, edgeShade, lightShaft, isLand } from './scene-needle.js';
import { clothWeave } from './scene-y.js';

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// counted-grid helper: which squares of a G x G lattice (square = one unit of the work's count) lie inside a stamp. Computed once per (kind, G, size) with the
// canvas' own hit test on an identity transform, then cached; `hole` marks squares that are outside the stamp but fully enclosed by it (an eye, a seed hole).
// ---------------------------------------------------------------------------------------------------------------------------------------------------
const RC = new Map();
export function rasterMask(ctx, kind, G, ratio, minW = 2.2) {
  const key = `${kind}|${G}|${Math.round(ratio * 100)}|${minW}`;
  const hit = RC.get(key); if (hit) return hit;
  const U = 100, su = ratio * U, inside = new Uint8Array(G * G), hole = new Uint8Array(G * G), fill = isFilled(kind);
  const at = (i, j) => [(i - G / 2 + 0.5) * U, (j - G / 2 + 0.5) * U];
  if (typeof ctx.isPointInPath === 'function' && typeof ctx.setTransform === 'function') {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    motifPath(ctx, kind, 0, 0, su);
    if (!fill) ctx.lineWidth = Math.max(lineWidthOf(kind, su), U * minW);
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { const [px, py] = at(i, j); inside[j * G + i] = (fill ? ctx.isPointInPath(px, py) : ctx.isPointInStroke(px, py)) ? 1 : 0; }
    ctx.restore();
  } else for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { const [px, py] = at(i, j); inside[j * G + i] = Math.hypot(px, py) < su * 0.4 ? 1 : 0; }
  // enclosed holes: outside squares that the border cannot reach through other outside squares
  const seen = new Uint8Array(G * G), stack = [];
  const push = (i, j) => { if (i < 0 || j < 0 || i >= G || j >= G) return; const k = j * G + i; if (seen[k] || inside[k]) return; seen[k] = 1; stack.push(i, j); };
  for (let t = 0; t < G; t++) { push(t, 0); push(t, G - 1); push(0, t); push(G - 1, t); }
  while (stack.length) { const j = stack.pop(), i = stack.pop(); push(i + 1, j); push(i - 1, j); push(i, j + 1); push(i, j - 1); }
  let n = 0; for (let k = 0; k < G * G; k++) { if (!inside[k] && !seen[k]) hole[k] = 1; if (inside[k]) n++; }
  const m = { G, inside, hole, n };
  RC.set(key, m); return m;
}
const isIn = (m, i, j) => i >= 0 && j >= 0 && i < m.G && j < m.G && m.inside[j * m.G + i] === 1;

// stitched thread along a path: shadow, dark underside, body, bright edge (used for outlines in several scenes)
function thread(ctx, build, w, col, o = {}) {
  ctx.lineCap = o.cap ?? 'round'; ctx.lineJoin = 'round';
  build(w * 0.18, w * 0.36); ctx.strokeStyle = `rgba(0,0,0,${o.sh ?? 0.34})`; ctx.lineWidth = w * 1.15; ctx.stroke();
  build(0, 0); ctx.strokeStyle = shade(col, -0.45); ctx.lineWidth = w; ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = w * 0.72; ctx.stroke();
  build(-w * 0.1, -w * 0.18); ctx.strokeStyle = rgba(shade(col, 0.7), o.hi ?? 0.7); ctx.lineWidth = Math.max(0.6, w * 0.2); ctx.stroke();
}

// ====================================================================================================================================================
// ASSISI: voided cross-stitch. The background is worked solid in one colour; the motif is left as bare linen and outlined in double-running (Holbein) stitch.
// The ground draws every cross; a stamp erases the crosses on the counted grid (staircase edges), outlines the void and shows its eyes as crosses.
// ====================================================================================================================================================
export const ASSISI_LINEN = '#eadfc6';
const AN = 12;                                           // crosses per cell edge (even, so a cell centre sits on a grid line)
export function assisiEnv(ctx, S) {
  const a = S.area, b = S.box, r = S.rect, c = S.cell, X0 = a.x - 12, W = a.w + 24, land = isLand(S), floorY = a.y + a.h * (land ? 0.86 : 0.9), t = Math.max(8, c * 0.42);
  // limestone wall: coursed rough blocks, pink-grey, soft light from the upper left
  const wg = ctx.createLinearGradient(0, a.y, 0, floorY); wg.addColorStop(0, '#8f7662'); wg.addColorStop(1, '#b7a089'); ctx.fillStyle = wg; ctx.fillRect(X0, a.y, W, floorY - a.y);
  ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, floorY - a.y); ctx.clip();
  let y = a.y - c * 0.3, row = 0;
  while (y < floorY) {
    const h = c * (1.15 + hash(row, 1) * 0.35); let x = X0 - hash(row, 2) * c * 2;
    while (x < X0 + W) {
      const w = c * (1.9 + hash(row, Math.floor(x), 3) * 1.6), v = (hash(row, Math.floor(x * 7), 4) - 0.5) * 0.2;
      ctx.fillStyle = shade('#a88f77', v); ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
      ctx.fillStyle = 'rgba(255,240,215,0.2)'; ctx.fillRect(x + 1, y + 1, w - 2, Math.max(1.5, c * 0.05)); ctx.fillRect(x + 1, y + 1, Math.max(1.5, c * 0.05), h - 2);
      ctx.fillStyle = 'rgba(40,24,14,0.3)'; ctx.fillRect(x + 1, y + h - 1 - Math.max(1.5, c * 0.06), w - 2, Math.max(1.5, c * 0.06));
      x += w;
    }
    y += h; row++;
  }
  speck(ctx, { x: X0, y: a.y, w: W, h: floorY - a.y }, 240, ['#3a2a1c', '#f0e0c8'], 0.16, Math.max(1.2, c * 0.04), 91);
  ctx.restore();
  // terracotta floor: square tiles under a low stone skirting
  const fg = ctx.createLinearGradient(0, floorY, 0, a.y + a.h); fg.addColorStop(0, '#a04a2a'); fg.addColorStop(1, '#6a2a14'); ctx.fillStyle = fg; ctx.fillRect(X0, floorY, W, a.y + a.h - floorY);
  const tw = c * 1.7; ctx.save(); ctx.beginPath(); ctx.rect(X0, floorY, W, a.y + a.h - floorY); ctx.clip();
  for (let j = 0, yy = floorY; yy < a.y + a.h; yy += tw * 0.5, j++) for (let x = X0 - (j % 2) * tw * 0.5, i = 0; x < X0 + W; x += tw, i++) { ctx.fillStyle = rgba(hash(i, j, 5) > 0.5 ? '#ffb080' : '#200800', 0.07 + hash(i, j, 6) * 0.06); ctx.fillRect(x, yy, tw, tw * 0.5); ctx.strokeStyle = 'rgba(30,10,4,0.45)'; ctx.lineWidth = 1.2; ctx.strokeRect(x, yy, tw, tw * 0.5); }
  ctx.restore();
  const sg = ctx.createLinearGradient(0, floorY - c * 0.5, 0, floorY + c * 0.1); sg.addColorStop(0, '#cfc0a8'); sg.addColorStop(1, '#7a6a56'); ctx.fillStyle = sg; ctx.fillRect(X0, floorY - c * 0.42, W, c * 0.5);
  if (!S.lite) {
    const gapL = r.x - t - b.x, gapR = b.x + b.w - (r.x + r.w + t), gapT = r.y - t - b.y;
    // a shuttered window in the left gap (landscape): open leaves, hills and a pale sky, with the sun it lets in
    if (land && gapL > c * 1.8) {
      const ww = Math.min(gapL * 0.62, c * 2.8), wx = b.x + gapL * 0.18, wy = a.y + a.h * 0.1, wh = Math.min(floorY - wy - c * 1.4, ww * 2.1);
      ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fillRect(wx - c * 0.18, wy - c * 0.18, ww + c * 0.36, wh + c * 0.36);
      const sky = ctx.createLinearGradient(0, wy, 0, wy + wh); sky.addColorStop(0, '#9cc4e0'); sky.addColorStop(0.7, '#f8ecc8'); sky.addColorStop(1, '#e8d8a0'); ctx.fillStyle = sky; ctx.fillRect(wx, wy, ww, wh);
      ctx.fillStyle = '#7a9a62'; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + wh * 0.64); for (let q = 0; q <= 6; q++) ctx.lineTo(wx + ww * q / 6, wy + wh * (0.6 + 0.06 * Math.sin(q * 1.4) + 0.05 * hash(q, 7))); ctx.lineTo(wx + ww, wy + wh); ctx.fill();
      ctx.fillStyle = '#4a6a3a'; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + wh * 0.8); for (let q = 0; q <= 6; q++) ctx.lineTo(wx + ww * q / 6, wy + wh * (0.76 + 0.05 * Math.sin(q * 2.1 + 1))); ctx.lineTo(wx + ww, wy + wh); ctx.fill();
      ctx.strokeStyle = '#5a3a1c'; ctx.lineWidth = Math.max(2.5, c * 0.12); ctx.strokeRect(wx, wy, ww, wh); ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.stroke();
      for (const [sx2, sd] of [[wx - ww * 0.4, -1], [wx + ww, 1]]) { const sgd = ctx.createLinearGradient(sx2, 0, sx2 + ww * 0.4, 0); sgd.addColorStop(0, shade('#5a7a62', sd < 0 ? 0.1 : -0.2)); sgd.addColorStop(1, shade('#5a7a62', sd < 0 ? -0.2 : 0.1)); ctx.fillStyle = sgd; ctx.fillRect(sx2, wy - c * 0.1, ww * 0.4, wh + c * 0.2); ctx.fillStyle = 'rgba(0,0,0,0.3)'; for (let q = 0; q < 12; q++) ctx.fillRect(sx2, wy + (q + 0.6) * (wh / 12), ww * 0.4, wh / 48); }
    }
    // a wall shelf with three cards of thread (right gap in landscape, top gap in portrait)
    const cols = S.colors;
    const shelf = (sx, sy, sw2) => {
      ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fillRect(sx + 3, sy + c * 0.5, sw2, c * 0.18);
      for (let k = 0; k < 3; k++) { const cx0 = sx + sw2 * (0.08 + k * 0.31), col = cols[(k + 1) % cols.length]; ctx.fillStyle = '#d8c7a2'; ctx.fillRect(cx0, sy - c * 0.5, sw2 * 0.25, c * 1.0); for (let q = 0; q < 8; q++) { ctx.fillStyle = q % 2 ? col : shade(col, -0.2); ctx.fillRect(cx0 + sw2 * 0.03, sy - c * 0.32 + q * c * 0.075, sw2 * 0.19, c * 0.075 + 0.4); } ctx.fillStyle = 'rgba(90,60,30,0.6)'; ctx.fillRect(cx0, sy - c * 0.5, sw2 * 0.25, c * 0.07); }
      const sh2 = ctx.createLinearGradient(0, sy + c * 0.5, 0, sy + c * 0.68); sh2.addColorStop(0, '#9a6a3a'); sh2.addColorStop(1, '#4a2c14'); ctx.fillStyle = sh2; ctx.fillRect(sx, sy + c * 0.5, sw2, c * 0.18);
    };
    if (land && gapR > c * 1.9) shelf(r.x + r.w + t + gapR * 0.12, a.y + a.h * 0.3, Math.min(gapR * 0.72, c * 3.4));
    else if (!land && gapT > c * 1.2) shelf(b.x + c * 0.5, b.y + gapT * 0.55, Math.min(c * 3.4, b.w * 0.3));
    // a terracotta jar with an olive twig standing on the floor
    const jx = a.x + a.w * (land ? 0.93 : 0.9), jy = a.y + a.h * 0.985;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(jx + c * 0.2, jy, c * 0.55, c * 0.14, 0, 0, TAU); ctx.fill();
    const jg = ctx.createLinearGradient(jx - c * 0.45, 0, jx + c * 0.45, 0); jg.addColorStop(0, '#d0703c'); jg.addColorStop(0.5, '#ec9158'); jg.addColorStop(1, '#8a3e1e'); ctx.fillStyle = jg;
    ctx.beginPath(); ctx.moveTo(jx - c * 0.28, jy - c * 1.15); ctx.quadraticCurveTo(jx - c * 0.62, jy - c * 0.5, jx - c * 0.34, jy); ctx.lineTo(jx + c * 0.34, jy); ctx.quadraticCurveTo(jx + c * 0.62, jy - c * 0.5, jx + c * 0.28, jy - c * 1.15); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#4a5a2a'; ctx.lineWidth = Math.max(1.4, c * 0.05); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(jx, jy - c * 1.1); ctx.quadraticCurveTo(jx + c * 0.2, jy - c * 1.9, jx + c * 0.1, jy - c * 2.6); ctx.stroke();
    ctx.fillStyle = '#7a8a4a'; for (let k = 0; k < 7; k++) { const q = k / 6; ctx.beginPath(); ctx.ellipse(jx + c * (0.18 * q) + (k % 2 ? c * 0.14 : -c * 0.14), jy - c * (1.4 + q * 1.2), c * 0.2, c * 0.06, k % 2 ? 0.5 : -0.5, 0, TAU); ctx.fill(); }
  }
  // window light: warm slanted shaft with mullion shadows across wall and floor
  lightShaft(ctx, a, a.x + a.w * 0.02, a.w * 0.7, a.w * 0.28, '#ffe2a8', 0.2, 2);
  glow(ctx, a.x + a.w * 0.18, a.y + a.h * 0.06, Math.max(a.w, a.h) * 0.9, '#ffd89a', 0.28);
  vignette(ctx, a, 0.42);
}
export function assisiUnder(ctx, S) {
  const r = S.rect, c = S.cell, t = Math.max(8, c * 0.42), R = { x: r.x - t, y: r.y - t, w: r.w + 2 * t, h: r.h + 2 * t }, wood = '#86582a';
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = c * 1.0; ctx.shadowOffsetX = c * 0.5; ctx.shadowOffsetY = c * 0.5; ctx.fillStyle = '#000'; ctx.fillRect(R.x, R.y, R.w, R.h); ctx.restore();
  rod(ctx, R.x + t / 2, R.y + t / 2, R.x + R.w - t / 2, R.y + t / 2, t, shade(wood, 0.12)); rod(ctx, R.x + t / 2, R.y + R.h - t / 2, R.x + R.w - t / 2, R.y + R.h - t / 2, t, shade(wood, -0.1));
  rod(ctx, R.x + t / 2, R.y, R.x + t / 2, R.y + R.h, t, shade(wood, 0.05)); rod(ctx, R.x + R.w - t / 2, R.y, R.x + R.w - t / 2, R.y + R.h, t, shade(wood, -0.18));
  // wooden pegs at the corners, lacing cord to the linen's selvedge
  for (const [x, y] of [[R.x + t / 2, R.y + t / 2], [R.x + R.w - t / 2, R.y + t / 2], [R.x + t / 2, R.y + R.h - t / 2], [R.x + R.w - t / 2, R.y + R.h - t / 2]]) ball(ctx, x, y, t * 0.26, '#caa266', false);
  ctx.strokeStyle = 'rgba(244,236,214,0.95)'; ctx.lineWidth = Math.max(1.3, c * 0.05); ctx.beginPath(); const n = 14;
  for (let k = 0; k < n; k++) { const f = (k + 0.5) / n; ctx.moveTo(r.x + r.w * f, r.y); ctx.lineTo(r.x + r.w * f, R.y + t * 0.5); ctx.moveTo(r.x + r.w * f, r.y + r.h); ctx.lineTo(r.x + r.w * f, R.y + R.h - t * 0.5); ctx.moveTo(r.x, r.y + r.h * f); ctx.lineTo(R.x + t * 0.5, r.y + r.h * f); ctx.moveTo(r.x + r.w, r.y + r.h * f); ctx.lineTo(R.x + R.w - t * 0.5, r.y + r.h * f); }
  ctx.stroke();
}
// the field of crosses: four batched passes (shadow, under stroke, top stroke, sheen); small patches fall back to a diagonal hatch
const CF = new Map();
export function crossField(ctx, r, pp, col, o = {}) {
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  const nx = Math.ceil(r.w / pp), ny = Math.ceil(r.h / pp);
  if (pp < 2.3 || nx * ny > 14000) {
    ctx.fillStyle = shade(col, -0.12); ctx.fillRect(r.x, r.y, r.w, r.h);
    const st = Math.max(1.2, pp * 1.15); ctx.lineWidth = Math.max(0.7, pp * 0.45);
    for (const [sgn, c2, a] of [[1, shade(col, -0.35), 0.8], [-1, shade(col, 0.25), 0.8]]) { ctx.beginPath(); for (let k = -Math.ceil(r.h / st); k < Math.ceil((r.w + r.h) / st); k++) { const x0 = r.x + k * st; if (sgn > 0) { ctx.moveTo(x0, r.y); ctx.lineTo(x0 + r.h, r.y + r.h); } else { ctx.moveTo(x0 + r.h, r.y); ctx.lineTo(x0, r.y + r.h); } } ctx.strokeStyle = rgba(c2, a); ctx.stroke(); }
    ctx.restore(); return;
  }
  const q = pp * 0.47, lw = Math.max(1.1, pp * (o.w ?? 0.37));
  // the two diagonal sets are built once per (size, pitch) as Path2D and only stroked afterwards (a frame costs rasterising, not 14 000 JS path calls)
  const key = `${nx}|${ny}|${Math.round(pp * 100)}`; let P = CF.get(key);
  if (!P) {
    const back = typeof Path2D === 'function' ? new Path2D() : null, fwd = back ? new Path2D() : null;
    if (back) { for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const cx = (i + 0.5) * pp, cy = (j + 0.5) * pp; back.moveTo(cx - q, cy - q); back.lineTo(cx + q, cy + q); fwd.moveTo(cx + q, cy - q); fwd.lineTo(cx - q, cy + q); } }
    P = { back, fwd }; CF.set(key, P); if (CF.size > 12) CF.delete(CF.keys().next().value);
  }
  ctx.lineCap = 'round'; ctx.translate(r.x, r.y);
  const stroke = (path, dx, dy, w, style) => { ctx.save(); ctx.translate(dx, dy); ctx.lineWidth = w; ctx.strokeStyle = style; ctx.stroke(path); ctx.restore(); };
  if (P.back) {
    stroke(P.fwd, 0.5, 0.9, lw + 0.7, 'rgba(0,0,0,0.4)'); stroke(P.back, 0.4, 0.8, lw + 0.5, 'rgba(0,0,0,0.3)');
    stroke(P.back, 0, 0, lw, shade(col, -0.34)); stroke(P.fwd, 0, 0, lw, col); stroke(P.fwd, -lw * 0.14, -lw * 0.2, Math.max(0.5, lw * 0.28), rgba(shade(col, 0.55), 0.55));
  } else { ctx.fillStyle = shade(col, -0.12); ctx.fillRect(0, 0, r.w, r.h); }
  ctx.restore();
}
export function assisiGround(ctx, S) {
  const r = S.rect, pp = S.cell / AN;
  clothWeave(ctx, r, S, ASSISI_LINEN, { density: 10, a: 0.2, specks: 40 });
  crossField(ctx, r, pp, S.bg);
}
export function assisiOver(ctx, S) {
  edgeShade(ctx, S, 0.34);
  const r = S.rect, g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,236,190,0.16)'); g.addColorStop(0.5, 'rgba(255,236,190,0)'); g.addColorStop(1, 'rgba(20,8,0,0.26)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
}
export function assisiSkin(ctx, S, d) {
  const { kind, col, x, y } = d, s = d.s * 1.14, pp = S.cell / AN, G = 2 * Math.ceil(s / pp / 2) + 2, m = rasterMask(ctx, kind, G, s / pp), x0 = x - (G / 2) * pp, y0 = y - (G / 2) * pp;
  const cells = []; for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) if (m.inside[j * G + i]) cells.push([i, j]);
  if (!cells.length) return;
  // bare linen where the crosses are left out, with a soft shadow along the edges the stitches stand proud of
  ctx.save(); ctx.fillStyle = ASSISI_LINEN; ctx.beginPath(); for (const [i, j] of cells) ctx.rect(x0 + i * pp - 0.3, y0 + j * pp - 0.3, pp + 0.6, pp + 0.6); ctx.fill();
  ctx.lineWidth = Math.max(0.5, pp * 0.26); ctx.beginPath(); for (const [i, j] of cells) { ctx.moveTo(x0 + i * pp, y0 + (j + 0.5) * pp); ctx.lineTo(x0 + (i + 1) * pp, y0 + (j + 0.5) * pp); } ctx.strokeStyle = 'rgba(120,96,56,0.34)'; ctx.stroke();
  ctx.beginPath(); for (const [i, j] of cells) { ctx.moveTo(x0 + (i + 0.5) * pp, y0 + j * pp); ctx.lineTo(x0 + (i + 0.5) * pp, y0 + (j + 1) * pp); } ctx.strokeStyle = 'rgba(255,252,238,0.55)'; ctx.stroke();
  ctx.fillStyle = 'rgba(60,36,12,0.3)'; ctx.beginPath(); const sw = Math.max(1, pp * 0.34);
  for (const [i, j] of cells) { if (!isIn(m, i, j - 1)) ctx.rect(x0 + i * pp, y0 + j * pp, pp, sw); if (!isIn(m, i - 1, j)) ctx.rect(x0 + i * pp, y0 + j * pp, sw, pp); } ctx.fill();
  // enclosed eyes are stitched as crosses in the thread colour
  const eyes = []; for (let k = 0; k < G * G; k++) if (m.hole[k]) eyes.push([k % G, Math.floor(k / G)]);
  if (eyes.length) { ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1, pp * 0.38); ctx.strokeStyle = col; ctx.beginPath(); const q = pp * 0.4; for (const [i, j] of eyes) { const cx = x0 + (i + 0.5) * pp, cy = y0 + (j + 0.5) * pp; ctx.moveTo(cx - q, cy - q); ctx.lineTo(cx + q, cy + q); ctx.moveTo(cx + q, cy - q); ctx.lineTo(cx - q, cy + q); } ctx.stroke(); }
  // Holbein (double running) outline along the staircase between linen and crosses
  const segs = (dx, dy) => { ctx.beginPath(); for (const [i, j] of cells) { const px = x0 + i * pp + dx, py = y0 + j * pp + dy;
    if (!isIn(m, i, j - 1)) { ctx.moveTo(px, py); ctx.lineTo(px + pp, py); } if (!isIn(m, i, j + 1)) { ctx.moveTo(px, py + pp); ctx.lineTo(px + pp, py + pp); }
    if (!isIn(m, i - 1, j)) { ctx.moveTo(px, py); ctx.lineTo(px, py + pp); } if (!isIn(m, i + 1, j)) { ctx.moveTo(px + pp, py); ctx.lineTo(px + pp, py + pp); } } };
  thread(ctx, segs, Math.max(1.3, pp * 0.52), col, { sh: 0.4 });
  ctx.restore();
}

// ====================================================================================================================================================
// BLACKWORK: black silk on white linen. A stamp is an outline in heavy stem stitch (a twisted cord) around a delicate geometric diaper worked in double-running
// and back stitch. Each stamp has its own diaper (trellis, scroll, rings, steps, crosses, zigzag) so the shapes read apart at a glance.
// ====================================================================================================================================================
const BW_DIAPER = { diamond: 'trellis', leaf: 'scroll', flower: 'seeds', hexagon: 'steps', star: 'crosses', bird: 'zigzag', solid: 'trellis', triangle: 'steps', cross: 'crosses', arch: 'scroll', checker: 'rings', fish: 'scroll', petal: 'scroll', kalka: 'rings' };
function diaperPath(ctx, type, x, y, s, key) {
  const a = s * 0.16, h = s / 2; ctx.beginPath();
  switch (type) {
    case 'trellis': for (let k = -8; k <= 8; k++) { ctx.moveTo(x - h + k * a, y - h); ctx.lineTo(x + h + k * a, y + h); ctx.moveTo(x + h + k * a, y - h); ctx.lineTo(x - h + k * a, y + h); } break;
    case 'scroll': for (let j = -5; j <= 5; j++) { const yy = y + j * a * 0.9, ph = (j & 1) * a; ctx.moveTo(x - h * 1.1, yy); for (let i = -6; i <= 6; i++) { const xx = x + i * a * 1.25 + ph; ctx.bezierCurveTo(xx - a * 0.3, yy - a * 0.75, xx + a * 0.55, yy - a * 0.75, xx + a * 0.6, yy); ctx.bezierCurveTo(xx + a * 0.65, yy + a * 0.45, xx + a * 0.3, yy + a * 0.4, xx + a * 0.3, yy + a * 0.15); ctx.moveTo(xx + a * 1.25, yy); } } break;
    case 'rings': for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) { const xx = x + i * a * 1.1 + (j & 1) * a * 0.55, yy = y + j * a * 0.95; ctx.moveTo(xx + a * 0.42, yy); ctx.arc(xx, yy, a * 0.42, 0, TAU); } break;
    case 'steps': for (let k = -4; k <= 4; k++) { let px = x - h * 1.2 + k * a * 2, py = y - h * 1.3; ctx.moveTo(px, py); for (let t = 0; t < 14; t++) { px += a * 0.8; ctx.lineTo(px, py); py += a * 0.8; ctx.lineTo(px, py); } } break;
    case 'seeds': for (let j = -7; j <= 7; j++) for (let i = -7; i <= 7; i++) { const xx = x + i * a * 0.62 + (j & 1) * a * 0.31, yy = y + j * a * 0.54; ctx.moveTo(xx + a * 0.1, yy); ctx.arc(xx, yy, a * 0.1, 0, TAU); } break;
    case 'crosses': for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) { const xx = x + i * a * 1.05 + (j & 1) * a * 0.52, yy = y + j * a * 0.92, q = a * 0.3; ctx.moveTo(xx - q, yy); ctx.lineTo(xx + q, yy); ctx.moveTo(xx, yy - q); ctx.lineTo(xx, yy + q); } break;
    default: for (let j = -7; j <= 7; j++) { const yy = y + j * a * 0.78; ctx.moveTo(x - h * 1.2, yy); for (let i = -9; i <= 9; i++) ctx.lineTo(x + i * a * 0.5, yy + (i & 1 ? -a * 0.3 : a * 0.3)); }
  }
  void key;
}
export function blackEnv(ctx, S) {
  const a = S.area, b = S.box, r = S.rect, c = S.cell, X0 = a.x - 12, W = a.w + 24, land = isLand(S), t = Math.max(8, c * 0.48);
  // dark oak table, planks running across, grain, a candle's warm pool
  ctx.fillStyle = '#1c1008'; ctx.fillRect(X0, a.y, W, a.h);
  const pl = c * 2.1; for (let yy = a.y, i = 0; yy < a.y + a.h; yy += pl, i++) { ctx.fillStyle = rgba(hash(i, 3) > 0.5 ? '#6a4020' : '#000', 0.1 + hash(i, 4) * 0.1); ctx.fillRect(X0, yy, W, pl); ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(X0, yy, W, 2); ctx.fillStyle = 'rgba(255,190,110,0.06)'; ctx.fillRect(X0, yy + 2, W, 1.5); }
  ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, a.h); ctx.clip(); ctx.strokeStyle = 'rgba(0,0,0,0.34)'; ctx.lineWidth = 1.1;
  for (let i = 0; i < 60; i++) { const gy = a.y + hash(i, 5) * a.h, gx = X0 + hash(i, 6) * W, gl = c * (2 + hash(i, 7) * 5); ctx.beginPath(); ctx.moveTo(gx, gy); ctx.bezierCurveTo(gx + gl * 0.3, gy + (hash(i, 8) - 0.5) * 4, gx + gl * 0.7, gy + (hash(i, 9) - 0.5) * 4, gx + gl, gy + (hash(i, 10) - 0.5) * 3); ctx.stroke(); }
  ctx.restore();
  const gapT = r.y - t - b.y, gapB = b.y + b.h - (r.y + r.h + t), gapL = r.x - t - b.x, gapR = b.x + b.w - (r.x + r.w + t);
  const cx = land ? r.x + r.w + t + gapR * 0.5 : b.x + b.w * 0.8, baseY = land ? a.y + a.h * 0.62 : b.y + gapT * 0.94, H = land ? Math.min(3.6 * c, a.h * 0.5) : Math.max(c * 1.4, Math.min(3.4 * c, gapT * 0.96));
  glow(ctx, cx, baseY - H * 0.85, Math.max(a.w * 0.55, a.h * 0.4), '#ff9a3a', 0.2); glow(ctx, cx, baseY - H * 0.85, H * 2.2, '#ffe0a0', 0.3);
  if (!S.lite) {
    // pattern sheet with quill-drawn diaper studies, a quill and an ink pot: lower gap (portrait) or left gap (landscape)
    const pw = land ? Math.min(gapL * 0.82, c * 3.4) : Math.min(b.w * 0.5, c * 4.8), ph2 = land ? c * 4.4 : Math.max(c * 1.5, Math.min(gapB * 0.92, c * 2.4));
    const px = land ? b.x + gapL * 0.5 : b.x + b.w * 0.3, py = land ? a.y + a.h * 0.52 : r.y + r.h + t + gapB * 0.5;
    ctx.save(); ctx.translate(px, py); ctx.rotate(land ? -0.1 : -0.06);
    ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = c * 0.5; ctx.shadowOffsetX = c * 0.15; ctx.shadowOffsetY = c * 0.25; ctx.fillStyle = '#e4d6b2'; ctx.fillRect(-pw / 2, -ph2 / 2, pw, ph2); ctx.shadowColor = 'transparent';
    const pg2 = ctx.createLinearGradient(-pw / 2, -ph2 / 2, pw / 2, ph2 / 2); pg2.addColorStop(0, 'rgba(255,240,200,0.4)'); pg2.addColorStop(1, 'rgba(80,50,20,0.3)'); ctx.fillStyle = pg2; ctx.fillRect(-pw / 2, -ph2 / 2, pw, ph2);
    ctx.save(); ctx.beginPath(); ctx.rect(-pw / 2, -ph2 / 2, pw, ph2); ctx.clip(); ctx.strokeStyle = 'rgba(46,30,16,0.75)'; ctx.lineWidth = Math.max(0.9, c * 0.025);
    const types = ['trellis', 'scroll', 'rings', 'steps']; const nb = land ? 4 : 2, bh = ph2 * 0.9 / nb;
    for (let k = 0; k < nb; k++) { const by = -ph2 * 0.45 + k * bh; ctx.save(); ctx.beginPath(); ctx.rect(-pw * 0.44, by + bh * 0.06, pw * 0.88, bh * 0.88); ctx.clip(); diaperPath(ctx, types[(k + (land ? 0 : 1)) % 4], 0, by + bh * 0.5, Math.min(pw, bh * 2) * 0.9, k); ctx.stroke(); ctx.restore(); ctx.strokeRect(-pw * 0.44, by + bh * 0.06, pw * 0.88, bh * 0.88); }
    ctx.restore(); ctx.restore();
    // quill lying across the sheet
    const qx = px + pw * 0.18, qy = py + ph2 * 0.34;
    ctx.save(); ctx.translate(qx, qy); ctx.rotate(land ? -0.5 : -0.25); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(c * 0.2, c * 0.22, c * 1.9, c * 0.16, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f2e9d0'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(c * 0.7, -c * 0.75, c * 1.9, -c * 0.5, c * 2.7, -c * 0.08); ctx.bezierCurveTo(c * 1.9, c * 0.1, c * 0.8, c * 0.16, 0, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(120,100,70,0.65)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(c * 2.6, -c * 0.08); ctx.stroke(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(-c * 0.25, 0); ctx.lineTo(c * 0.1, -c * 0.04); ctx.lineTo(c * 0.1, c * 0.04); ctx.fill(); ctx.restore();
    // brass candlestick: round foot, stem, drip pan, candle and a living flame
    const k = H / (3.4 * c), f = Math.max(0.5, Math.min(1.6, k)) * c, by2 = baseY;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(cx + f * 0.25, by2 + f * 0.05, f * 0.8, f * 0.2, 0, 0, TAU); ctx.fill();
    const bg = ctx.createLinearGradient(cx - f * 0.6, 0, cx + f * 0.6, 0); bg.addColorStop(0, '#8a6218'); bg.addColorStop(0.42, '#f6d878'); bg.addColorStop(1, '#5a3c0c'); ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(cx, by2 - f * 0.06, f * 0.62, f * 0.17, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - f * 0.5, by2 - f * 0.08); ctx.quadraticCurveTo(cx - f * 0.14, by2 - f * 0.32, cx - f * 0.1, by2 - f * 0.95); ctx.lineTo(cx + f * 0.1, by2 - f * 0.95); ctx.quadraticCurveTo(cx + f * 0.14, by2 - f * 0.32, cx + f * 0.5, by2 - f * 0.08); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, by2 - f * 0.98, f * 0.34, f * 0.1, 0, 0, TAU); ctx.fill();
    const ch = H - f * 1.45; ctx.fillStyle = '#efe6c8'; ctx.fillRect(cx - f * 0.13, by2 - f * 0.98 - ch * 0.62, f * 0.26, ch * 0.62); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(cx + f * 0.03, by2 - f * 0.98 - ch * 0.62, f * 0.1, ch * 0.62);
    const fy = by2 - f * 0.98 - ch * 0.62 - f * 0.28, fl = 0.88 + 0.12 * Math.sin(S.t * 9), sw = Math.sin(S.t * 5.3) * f * 0.03;
    const fg2 = ctx.createRadialGradient(cx + sw, fy, 0, cx + sw, fy, f * 0.46 * fl); fg2.addColorStop(0, 'rgba(255,250,225,1)'); fg2.addColorStop(0.45, 'rgba(255,190,70,0.92)'); fg2.addColorStop(1, 'rgba(255,120,30,0)'); ctx.fillStyle = fg2;
    ctx.beginPath(); ctx.ellipse(cx + sw, fy, f * 0.15 * fl, f * 0.4 * fl, 0, 0, TAU); ctx.fill();
  }
  vignette(ctx, a, 0.7);
}
export function blackUnder(ctx, S) {
  const r = S.rect, c = S.cell, t = Math.max(8, c * 0.48), R = { x: r.x - t, y: r.y - t, w: r.w + 2 * t, h: r.h + 2 * t }, wood = '#b8935a';
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = c * 1.1; ctx.shadowOffsetX = -c * 0.45; ctx.shadowOffsetY = c * 0.55; ctx.fillStyle = '#000'; ctx.fillRect(R.x, R.y, R.w, R.h); ctx.restore();
  // slate frame: two round rollers (top and bottom, with turned ends and pegs) and two flat side bars
  rod(ctx, R.x + t / 2, R.y, R.x + t / 2, R.y + R.h, t * 0.8, shade(wood, 0.04)); rod(ctx, R.x + R.w - t / 2, R.y, R.x + R.w - t / 2, R.y + R.h, t * 0.8, shade(wood, -0.2));
  for (const yy of [R.y + t / 2, R.y + R.h - t / 2]) { rod(ctx, R.x - t * 0.35, yy, R.x + R.w + t * 0.35, yy, t, yy < r.y ? shade(wood, 0.1) : shade(wood, -0.1)); ctx.fillStyle = 'rgba(80,50,16,0.5)'; for (const xx of [R.x - t * 0.35, R.x + R.w + t * 0.35]) { ctx.beginPath(); ctx.arc(xx, yy, t * 0.46, 0, TAU); ctx.fill(); } }
  for (const [xx, yy] of [[R.x + t / 2, R.y + t / 2], [R.x + R.w - t / 2, R.y + t / 2], [R.x + t / 2, R.y + R.h - t / 2], [R.x + R.w - t / 2, R.y + R.h - t / 2]]) ball(ctx, xx, yy, t * 0.2, '#2a2a2e', false);
  ctx.strokeStyle = 'rgba(240,232,212,0.9)'; ctx.lineWidth = Math.max(1.2, c * 0.04); ctx.beginPath(); const n = 12;
  for (let k = 0; k < n; k++) { const f = (k + 0.5) / n; ctx.moveTo(r.x, r.y + r.h * f); ctx.lineTo(R.x + t * 0.5, r.y + r.h * f); ctx.moveTo(r.x + r.w, r.y + r.h * f); ctx.lineTo(R.x + R.w - t * 0.5, r.y + r.h * f); }
  ctx.stroke();
}
export function blackGround(ctx, S) {
  const r = S.rect, c = S.cell;
  clothWeave(ctx, r, S, S.bg, { density: 12, a: 0.16, specks: 50 });
  const g = ctx.createRadialGradient(r.x + r.w * 0.8, r.y + r.h * 0.05, r.w * 0.05, r.x + r.w * 0.5, r.y + r.h * 0.5, r.w * 0.95); g.addColorStop(0, 'rgba(255,214,150,0.28)'); g.addColorStop(0.6, 'rgba(255,214,150,0.02)'); g.addColorStop(1, 'rgba(40,24,10,0.28)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  void c;
}
export function blackOver(ctx, S) { edgeShade(ctx, S, 0.3); }
export function blackSkin(ctx, S, d) {
  const { kind, col, x, y, key } = d, s = d.s * 1.12, fill = isFilled(kind), w = Math.max(1.5, s * 0.05), lw = Math.max(0.8, s * 0.026);
  if (fill) {
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.fillStyle = rgba(col, 0.07); ctx.fill(); ctx.clip();
    const type = BW_DIAPER[kind] ?? 'trellis';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    diaperPath(ctx, type, x + 0.5, y + 0.8, s, key); ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = lw + 0.5; ctx.stroke();
    diaperPath(ctx, type, x, y, s, key); ctx.strokeStyle = shade(col, -0.1); ctx.lineWidth = lw; ctx.stroke();
    if (!S.lite) { ctx.strokeStyle = rgba(shade(col, 0.75), 0.5); ctx.lineWidth = Math.max(0.4, lw * 0.3); ctx.save(); ctx.translate(-lw * 0.25, -lw * 0.3); diaperPath(ctx, type, x, y, s, key); ctx.stroke(); ctx.restore(); }
    if (type === 'trellis') { ctx.fillStyle = col; ctx.beginPath(); const a2 = s * 0.08; for (let j = -12; j <= 12; j++) for (let i = -12; i <= 12; i++) { if (!((i + j) & 1)) continue; const px = x + i * a2, py = y + j * a2; ctx.moveTo(px + lw * 1.15, py); ctx.arc(px, py, lw * 1.15, 0, TAU); } ctx.fill(); }
    ctx.restore();
    thread(ctx, (dx, dy) => motifPath(ctx, kind, x + dx, y + dy, s), w, col, { hi: 0.55 });
    ctx.save(); ctx.setLineDash([w * 0.3, w * 0.55]); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = w * 0.7; motifPath(ctx, kind, x, y, s); ctx.stroke(); ctx.restore();
    return;
  }
  const ww = Math.max(2, lineWidthOf(kind, s) * 0.55);
  thread(ctx, (dx, dy) => motifPath(ctx, kind, x + dx, y + dy, s), ww, col, { hi: 0.55 });
  ctx.save(); ctx.setLineDash([ww * 0.3, ww * 0.55]); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = ww * 0.7; motifPath(ctx, kind, x, y, s); ctx.stroke(); ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// supplies and tools of this file
// ---------------------------------------------------------------------------------------------------------------------------------------------------
const bxr = (b) => ({ cx: b.x + b.w / 2, cy: b.y + b.h / 2, r: Math.min(b.w, b.h) / 2 });
export function selRing(ctx, S, b, on) {
  ctx.save(); ctx.strokeStyle = on ? S.pal.accent : 'rgba(255,255,255,0.28)'; ctx.lineWidth = on ? 4 : 1.5; roundRectPath(ctx, b.x, b.y, b.w, b.h, 12); ctx.stroke();
  if (on) { ctx.fillStyle = S.pal.accent; ctx.beginPath(); ctx.arc(b.x + b.w - 7, b.y + 7, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x + b.w - 9.5, b.y + 7); ctx.lineTo(b.x + b.w - 7.2, b.y + 9.2); ctx.lineTo(b.x + b.w - 4, b.y + 5); ctx.stroke(); }
  ctx.restore();
}
export const backing = (ctx, b, c, a = 0.5) => { ctx.save(); roundRectPath(ctx, b.x, b.y, b.w, b.h, 12); ctx.fillStyle = rgba(c, a); ctx.fill(); ctx.restore(); };
const softE = (ctx, x, y, rx, ry, a = 0.3) => { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); };
const pressOf = (T) => Math.max(0, 1 - T.a / 0.45);
Object.assign(POT, {
  // a die-cut brown paper card with notches, wound with thread in the chosen colour
  threadcard(ctx, S, b, col, on) {
    const { cx, cy, r } = bxr(b), lift = on ? -3 : 0, w = r * 1.0, h = r * 1.55; backing(ctx, b, '#1c1410');
    ctx.save(); ctx.translate(cx, cy + lift); ctx.rotate(-0.1); softE(ctx, w * 0.1, h * 0.52, w * 0.6, h * 0.08);
    ctx.fillStyle = '#c9a874'; ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.fill();
    ctx.fillStyle = '#1c1410'; for (const sy of [-1, 1]) { ctx.beginPath(); ctx.rect(-w / 2 - 1, sy * h * 0.18 - h * 0.05, w * 0.18, h * 0.1); ctx.rect(w / 2 - w * 0.18 + 1, sy * h * 0.18 - h * 0.05, w * 0.18, h * 0.1); ctx.fill(); }
    for (let k = 0; k < 11; k++) { ctx.fillStyle = k % 2 ? col : shade(col, -0.2); ctx.fillRect(-w * 0.34, -h * 0.34 + k * h * 0.062, w * 0.68, h * 0.062 + 0.5); }
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(-w * 0.34, -h * 0.34, w * 0.2, h * 0.68);
    ctx.fillStyle = 'rgba(70,40,10,0.7)'; ctx.fillRect(-w * 0.28, -h * 0.46, w * 0.56, h * 0.06);
    ctx.restore(); selRing(ctx, S, b, on);
  },
  // a flat bone silk winder with a notched end, wound with the silk twist
  silkwinder(ctx, S, b, col, on) {
    const { cx, cy, r } = bxr(b), lift = on ? -3 : 0, w = r * 1.5, h = r * 0.82; backing(ctx, b, '#18120e');
    ctx.save(); ctx.translate(cx, cy + lift); ctx.rotate(-0.3); softE(ctx, w * 0.08, h * 0.62, w * 0.55, h * 0.12);
    const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#fbf5e4'); g.addColorStop(1, '#bfae86'); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-w / 2, -h * 0.22); ctx.lineTo(-w * 0.3, -h * 0.22); ctx.lineTo(-w * 0.22, -h / 2); ctx.lineTo(w * 0.22, -h / 2); ctx.lineTo(w * 0.3, -h * 0.22); ctx.lineTo(w / 2, -h * 0.22); ctx.lineTo(w / 2, h * 0.22); ctx.lineTo(w * 0.3, h * 0.22); ctx.lineTo(w * 0.22, h / 2); ctx.lineTo(-w * 0.22, h / 2); ctx.lineTo(-w * 0.3, h * 0.22); ctx.lineTo(-w / 2, h * 0.22); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(70,50,20,0.5)'; ctx.lineWidth = 1; ctx.stroke();
    for (let k = 0; k < 9; k++) { const xx = -w * 0.2 + k * w * 0.05; rod(ctx, xx, -h * 0.5, xx + w * 0.02, h * 0.5, Math.max(1.8, w * 0.05), k % 2 ? col : shade(col, 0.08), 'butt'); }
    ctx.restore(); selRing(ctx, S, b, on);
  },
});
Object.assign(TOOLS, {
  // a slender embroidery needle with a long tail of thread that trails to the left; it dips on every stitch
  fineneedle(ctx, S, T, o = {}) {
    const u = T.u, p = pressOf(T), a = o.lean ?? -0.9, sg = a < 0 ? -1 : 1, len = u * 3.6, dip = p * u * 0.12;
    const x1 = T.x, y1 = T.y + dip, x2 = x1 + Math.sin(a) * len, y2 = y1 - Math.cos(a) * len;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const tail = (w, c, al) => { ctx.strokeStyle = rgba(c, al); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x2, y2); ctx.bezierCurveTo(x2 + sg * u * 1.0, y2 + u * 0.1, x2 + sg * u * 1.6, y2 + u * 1.6, x2 + sg * u * 0.9 + Math.sin(T.t * 1.4) * u * 0.1, y2 + u * 2.6); ctx.stroke(); };
    tail(Math.max(3, u * 0.11), '#000', 0.16); tail(Math.max(1.8, u * 0.07), shade(T.col, -0.4), 1); tail(Math.max(1.3, u * 0.05), T.col, 1); tail(Math.max(0.7, u * 0.015), '#fff', 0.7);
    softE(ctx, x1 - u * 0.2, y1 + u * 0.1, u * 0.7, u * 0.08, 0.25);
    const g = ctx.createLinearGradient(x1, y1, x2, y2); g.addColorStop(0, '#8e98a4'); g.addColorStop(0.5, '#f8fbff'); g.addColorStop(1, '#8a949e');
    ctx.strokeStyle = g; ctx.lineWidth = Math.max(1.8, u * 0.07); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = '#2a2f36'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.ellipse(x2 - Math.sin(a) * u * 0.1, y2 + Math.cos(a) * u * 0.1, u * 0.025, u * 0.1, a, 0, TAU); ctx.stroke();
    if (o.thimble) { ctx.fillStyle = '#c8a052'; ctx.beginPath(); ctx.ellipse(x2 - sg * u * 0.1, y2 + u * 0.05, u * 0.2, u * 0.3, a, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.3)'; for (let k = 0; k < 5; k++) ctx.fillRect(x2 - sg * u * 0.2 + k * 0.5, y2 - u * 0.1 + k * 2, 1.4, 1.4); }
    ctx.restore();
  },
});
void mix; void poly;

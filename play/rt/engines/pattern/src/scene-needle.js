// Needlework scene art, 1.12.0, part 1: shared stitch helpers + kasuti (counted stitch) + kutch (chain stitch and mirrors).
// Pure canvas 2D, hash-only randomness, no figures, no text. Registered in scenes-n.js.
import { hash, rgba, mix, shade, roundRectPath, rod, ball, speck, lines, weaveGrid, glow, vignette, TAU, motifPath, isFilled, lineWidthOf, clamp } from './scene-kit.js';

export const isLand = (S) => S.area.w > S.area.h * 1.15;

// ---- shared helpers ------------------------------------------------------------------------------------------------------------------
// A thread laid along the path built by build(dx, dy): cast shadow, dark underside, body, optional dashed twist, highlight.
export function cord(ctx, build, w, col, o = {}) {
  ctx.lineCap = o.cap ?? 'round'; ctx.lineJoin = 'round';
  build(w * 0.12, w * 0.32); ctx.strokeStyle = 'rgba(0,0,0,0.34)'; ctx.lineWidth = w * 1.2; ctx.stroke();
  build(0, 0); ctx.strokeStyle = shade(col, -0.5); ctx.lineWidth = w; ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = w * 0.76; ctx.stroke();
  if (o.dash) { ctx.setLineDash(o.dash.map((v) => v * w)); ctx.strokeStyle = rgba(shade(col, -0.42), 0.6); ctx.lineWidth = w * 0.76; ctx.stroke(); ctx.setLineDash([]); }
  build(-w * 0.1, -w * 0.2); ctx.strokeStyle = rgba(shade(col, 0.72), o.hi ?? 0.8); ctx.lineWidth = Math.max(0.7, w * 0.2); ctx.stroke();
}
export const kindPath = (ctx, kind, x, y, s) => (dx = 0, dy = 0) => motifPath(ctx, kind, x + dx, y + dy, s);
// Is a point (in the current user space) inside the motif? Collect all answers before drawing: the path must stay current.
export function insideTest(ctx, kind, x, y, s) {
  motifPath(ctx, kind, x, y, s);
  const T = ctx.getTransform ? ctx.getTransform() : null, R = s * 0.4;
  return (px, py) => {
    if (!ctx.isPointInPath || !T) return Math.hypot(px - x, py - y) < R;
    return ctx.isPointInPath(T.a * px + T.c * py + T.e, T.b * px + T.d * py + T.f);
  };
}
// plain woven cotton: fine warp/weft lines, slubs, mottle, a soft light from the upper left
export function clothGround(ctx, S, o = {}) {
  const r = S.rect, c = S.cell, m = o.base ?? S.bg, p = Math.max(1.7, c / (o.count ?? 9));
  ctx.fillStyle = m; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  if (!S.lite) for (let k = 0; k < 10; k++) { const px = r.x + hash(k, 7) * r.w, py = r.y + hash(k, 8) * r.h, R = c * (1 + hash(k, 9) * 2.2), g = ctx.createRadialGradient(px, py, 0, px, py, R); g.addColorStop(0, hash(k, 4) > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(px - R, py - R, R * 2, R * 2); }
  ctx.beginPath(); for (let y = r.y; y < r.y + r.h; y += p) { ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); } ctx.strokeStyle = rgba(o.weft ?? shade(m, 0.2), o.wa ?? 0.14); ctx.lineWidth = p * 0.42; ctx.stroke();
  ctx.beginPath(); for (let x = r.x; x < r.x + r.w; x += p) { ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); } ctx.strokeStyle = rgba(o.warp ?? shade(m, -0.4), o.ka ?? 0.16); ctx.lineWidth = p * 0.36; ctx.stroke();
  if (!S.lite) speck(ctx, r, 140, [shade(m, -0.3), shade(m, 0.3)], 0.22, Math.max(1, c * 0.03), 19);
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, `rgba(255,248,225,${o.lit ?? 0.14})`); g.addColorStop(0.5, 'rgba(255,248,225,0)'); g.addColorStop(1, `rgba(0,0,0,${o.dark ?? 0.2})`); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.restore();
}
// frame edge light and shadow over the cloth
export function edgeShade(ctx, S, a = 0.3) {
  const r = S.rect, e = Math.max(5, S.cell * 0.5);
  let g = ctx.createLinearGradient(0, r.y, 0, r.y + e); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, e);
  g = ctx.createLinearGradient(r.x, 0, r.x + e, 0); g.addColorStop(0, `rgba(0,0,0,${a * 0.8})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, e, r.h);
}
// a window-light shaft falling on the floor: a parallelogram with mullion shadows
export function lightShaft(ctx, a, x, w, skew, col, al, mullions = 2) {
  ctx.save(); ctx.beginPath(); ctx.rect(a.x - 12, a.y, a.w + 24, a.h); ctx.clip();
  const g = ctx.createLinearGradient(x, a.y, x + skew, a.y + a.h); g.addColorStop(0, rgba(col, al)); g.addColorStop(1, rgba(col, al * 0.15));
  ctx.fillStyle = g;
  for (let k = 0; k <= mullions; k++) { const w0 = w / (mullions + 1) * 0.84, x0 = x + (k * w) / (mullions + 1); ctx.beginPath(); ctx.moveTo(x0, a.y); ctx.lineTo(x0 + w0, a.y); ctx.lineTo(x0 + w0 + skew, a.y + a.h); ctx.lineTo(x0 + skew, a.y + a.h); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}

// ====================================================================================================================================================
// KASUTI: counted stitch (double running, darning rows) on dark handloom cloth. Every stamp is rasterised onto the thread count: filled shapes are rows of
// small running stitches that interlock like brickwork, outlines are double-running stitch (the second pass fills the gaps), so both sides look alike.
// ====================================================================================================================================================
export function kasutiEnv(ctx, S) {
  const a = S.area, X0 = a.x - 12, W = a.w + 24, c = S.cell;
  // red-oxide floor, polished: broad square tiles with soft joints and a reflected window
  const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#9a3a22'); g.addColorStop(0.55, '#7a2816'); g.addColorStop(1, '#4a140a'); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, a.h);
  const t = c * 3.4; ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, a.h); ctx.clip();
  for (let y = a.y, j = 0; y < a.y + a.h; y += t, j++) for (let x = a.x - t * 0.5, i = 0; x < a.x + a.w + t; x += t, i++) { ctx.fillStyle = rgba(hash(i, j, 3) > 0.5 ? '#ffb090' : '#200000', 0.05 + hash(i, j, 4) * 0.05); ctx.fillRect(x, y, t, t); }
  ctx.strokeStyle = 'rgba(30,6,0,0.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let y = a.y; y < a.y + a.h; y += t) { ctx.moveTo(X0, y); ctx.lineTo(X0 + W, y); } for (let x = a.x - t * 0.5; x < a.x + a.w + t; x += t) { ctx.moveTo(x, a.y); ctx.lineTo(x, a.y + a.h); } ctx.stroke();
  ctx.restore();
  lightShaft(ctx, a, a.x + a.w * 0.05, a.w * 0.62, a.w * 0.22, '#ffe6b0', 0.2, 2);
  glow(ctx, a.x + a.w * 0.25, a.y + a.h * 0.1, Math.max(a.w, a.h) * 0.8, '#ffd090', 0.18);
  vignette(ctx, a, 0.5);
  if (isLand(S) && !S.lite && !S.card) { // a cane basket of thread balls beside the frame
    const r = S.rect, cx = Math.min(a.x + a.w - c * 1.1, r.x + r.w + (a.x + a.w - r.x - r.w) * 0.6), cy = a.y + a.h * 0.82, R = c * 0.9;
    if (cx - R > r.x + r.w + c * 0.3) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(cx + R * 0.15, cy + R * 0.3, R * 1.1, R * 0.8, 0, 0, TAU); ctx.fill();
      const bg2 = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R); bg2.addColorStop(0, '#d8b072'); bg2.addColorStop(1, '#6a4420'); ctx.fillStyle = bg2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(40,20,0,0.5)'; ctx.lineWidth = 1; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc(cx, cy, R * (0.15 + k * 0.1), 0, TAU); ctx.stroke(); }
      ctx.fillStyle = '#2a1008'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.74, 0, TAU); ctx.fill();
      const cols = S.colors; for (let k = 0; k < 4; k++) ball(ctx, cx + (k % 2 - 0.5) * R * 0.7, cy + (Math.floor(k / 2) - 0.5) * R * 0.7, R * 0.36, cols[(k + 1) % cols.length], false);
    }
  }
}
export function kasutiGround(ctx, S) {
  clothGround(ctx, S, { count: 10, wa: 0.18, ka: 0.22, lit: 0.12 });
  // every tenth thread is a slightly lighter count thread, so the player can count
  const r = S.rect, c = S.cell, p = c / 10; ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = Math.max(1, p * 0.5); ctx.beginPath(); for (let x = r.x; x <= r.x + r.w; x += c) { ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); } for (let y = r.y; y <= r.y + r.h; y += c) { ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); } ctx.stroke();
  ctx.restore();
}
export function kasutiOver(ctx, S) { edgeShade(ctx, S, 0.3); const r = S.rect; const g = ctx.createRadialGradient(r.x + r.w * 0.3, r.y + r.h * 0.2, 0, r.x + r.w * 0.3, r.y + r.h * 0.2, r.w); g.addColorStop(0, 'rgba(255,235,190,0.12)'); g.addColorStop(1, 'rgba(255,235,190,0)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h); }
export function kasutiSkin(ctx, S, d) {
  const { kind, col, x, y, s } = d, fill = isFilled(kind), p = Math.max(1.6, s / 11), lw = Math.max(1, p * 0.62), dk = shade(col, -0.5);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const run = (x0, x1, yy, off) => { // one row of running stitches: shadow, thread, sheen
    ctx.setLineDash([p * 1.15, p * 0.42]); ctx.lineDashOffset = off;
    ctx.beginPath(); ctx.moveTo(x0, yy + 0.7); ctx.lineTo(x1, yy + 0.7); ctx.strokeStyle = 'rgba(0,0,0,0.42)'; ctx.lineWidth = lw * 1.05; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.strokeStyle = dk; ctx.lineWidth = lw; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw * 0.72; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0, yy - lw * 0.2); ctx.lineTo(x1, yy - lw * 0.2); ctx.strokeStyle = rgba(shade(col, 0.7), 0.7); ctx.lineWidth = Math.max(0.5, lw * 0.18); ctx.stroke();
    ctx.setLineDash([]); ctx.lineDashOffset = 0;
  };
  if (!fill) { // double running stitch along the outline: two passes, the second fills the gaps of the first
    const ph = (dx, dy) => motifPath(ctx, kind, x + dx, y + dy, s * 1.14);
    const w = Math.max(1.4, lw * 1.25);
    for (const off of [0, p * 0.8]) { ctx.setLineDash([p * 0.8, p * 0.8]); ctx.lineDashOffset = off;
      ph(0.6, 1); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = w; ctx.stroke(); ph(0, 0); ctx.strokeStyle = dk; ctx.lineWidth = w * 0.95; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w * 0.7; ctx.stroke(); ph(-0.2, -0.4); ctx.strokeStyle = rgba(shade(col, 0.7), 0.7); ctx.lineWidth = Math.max(0.5, w * 0.16); ctx.stroke(); }
    ctx.setLineDash([]); ctx.lineDashOffset = 0; return;
  }
  const s2 = s * 1.16, inside = insideTest(ctx, kind, x, y, s2), rows = [];
  const half = Math.ceil((s2 * 0.62) / p);
  for (let j = -half; j <= half; j++) {
    const yy = y + j * p; let x0 = null;
    for (let i = -half - 1; i <= half + 1; i++) { const xx = x + i * p * 0.5, ok = inside(xx, yy + 0.01); if (ok && x0 === null) x0 = xx; if ((!ok || i === half + 1) && x0 !== null) { rows.push([x0 + p * 0.1, xx - p * 0.5 - p * 0.1, yy, j]); x0 = null; } }
  }
  for (const [x0, x1, yy, j] of rows) if (x1 - x0 > p * 0.6) run(x0, x1, yy, (j & 1) * p * 0.78);
  // the outline stitched once more in a darker thread so the shape reads at small size
  ctx.setLineDash([p * 0.8, p * 0.8]); motifPath(ctx, kind, x, y, s2); ctx.strokeStyle = rgba(dk, 0.75); ctx.lineWidth = Math.max(1, lw * 0.7); ctx.stroke(); ctx.setLineDash([]);
}

// ====================================================================================================================================================
// KUTCH: chain stitch in silk and shisha mirrors held in buttonhole frames, on dark cotton. Outlines are linked loops; filled shapes are concentric rows of
// chain; the dot stamp is a mirror with a lit face, bevel and a buttonhole ring.
// ====================================================================================================================================================
export function kutchEnv(ctx, S) {
  const a = S.area, X0 = a.x - 12, W = a.w + 24, c = S.cell;
  // night courtyard: indigo sky above, a mud-plaster wall below studded with small mirrors catching the lamp
  const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#0e1230'); g.addColorStop(0.35, '#2a1a3c'); g.addColorStop(0.36, '#8a5a3a'); g.addColorStop(1, '#3a2012'); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, a.h);
  for (let k = 0; k < 34; k++) { const x = a.x + hash(k, 1) * a.w, y = a.y + hash(k, 2) * a.h * 0.33; ctx.fillStyle = `rgba(255,248,220,${0.3 + hash(k, 3) * 0.5})`; ctx.beginPath(); ctx.arc(x, y, 0.8 + hash(k, 4) * 1.2, 0, TAU); ctx.fill(); }
  ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, a.h); ctx.clip();
  const wy = a.y + a.h * 0.36;
  speck(ctx, { x: X0, y: wy, w: W, h: a.h }, 360, ['#20100a', '#d8a070'], 0.12, 2.2, 23);
  // relief bands: raised mud circles with inset mirrors
  for (let row = 0; row < 3; row++) for (let x = a.x + c * 0.8 - (row % 2) * c * 0.9, i = 0; x < a.x + a.w + c; x += c * 1.8, i++) {
    const y = wy + c * (1.3 + row * 1.7) + (row > 1 ? a.h * 0.2 : 0), R = c * 0.42;
    if (y > a.y + a.h) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(x + R * 0.12, y + R * 0.22, R * 1.2, 0, TAU); ctx.fill();
    const rg = ctx.createRadialGradient(x - R * 0.4, y - R * 0.4, R * 0.1, x, y, R * 1.2); rg.addColorStop(0, '#d8a478'); rg.addColorStop(1, '#6a3c20'); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, R * 1.15, 0, TAU); ctx.fill();
    const mg = ctx.createLinearGradient(x - R * 0.6, y - R * 0.6, x + R * 0.6, y + R * 0.6); mg.addColorStop(0, '#f6f2e0'); mg.addColorStop(0.5, '#8a94a0'); mg.addColorStop(1, '#2a3040'); ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(x, y, R * 0.55, 0, TAU); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(X0, wy - 3, W, 5);
  glow(ctx, a.x + a.w * 0.82, a.y + a.h * 0.58, Math.max(a.w, a.h) * 0.75, '#ffb050', 0.34);
  vignette(ctx, a, 0.5);
}
export function kutchGround(ctx, S) {
  clothGround(ctx, S, { count: 8, wa: 0.1, ka: 0.16, lit: 0.1, dark: 0.26 });
}
export function kutchOver(ctx, S) { edgeShade(ctx, S, 0.32); const r = S.rect, g = ctx.createRadialGradient(r.x + r.w * 0.85, r.y + r.h * 0.6, 0, r.x + r.w * 0.85, r.y + r.h * 0.6, r.w); g.addColorStop(0, 'rgba(255,170,70,0.2)'); g.addColorStop(1, 'rgba(255,170,70,0)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h); }
// one shisha mirror with a buttonhole ring of stitches
function shisha(ctx, x, y, R, col, key) {
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(x + R * 0.12, y + R * 0.2, R * 1.05, 0, TAU); ctx.fill();
  const mg = ctx.createLinearGradient(x - R * 0.7, y - R * 0.7, x + R * 0.7, y + R * 0.7); mg.addColorStop(0, '#fffdf2'); mg.addColorStop(0.35, '#b9c4cf'); mg.addColorStop(0.7, '#5a6676'); mg.addColorStop(1, '#222a38');
  ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(x, y, R * 0.62, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(x - R * 0.2, y - R * 0.25, R * 0.2, R * 0.1, -0.7, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(20,24,34,0.7)'; ctx.lineWidth = Math.max(1, R * 0.05); ctx.beginPath(); ctx.arc(x, y, R * 0.62, 0, TAU); ctx.stroke();
  // buttonhole ring: short radial stitches round the rim, then a couched ring
  const n = 16; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.1, R * 0.12);
  for (const [w, c2, ro] of [[1.25, 'rgba(0,0,0,0.45)', 0.06], [1, shade(col, -0.5), 0], [0.72, col, 0]]) { ctx.strokeStyle = c2; ctx.lineWidth = Math.max(1, R * 0.13 * w); ctx.beginPath(); for (let k = 0; k < n; k++) { const a0 = (k / n) * TAU + 0.1; ctx.moveTo(x + Math.cos(a0) * R * 0.58 + ro * R, y + Math.sin(a0) * R * 0.58 + ro * R); ctx.lineTo(x + Math.cos(a0) * R * 0.98 + ro * R, y + Math.sin(a0) * R * 0.98 + ro * R); } ctx.stroke(); }
  ctx.strokeStyle = rgba(shade(col, 0.6), 0.75); ctx.lineWidth = Math.max(0.6, R * 0.04); ctx.beginPath(); for (let k = 0; k < n; k++) { const a0 = (k / n) * TAU + 0.1; ctx.moveTo(x + Math.cos(a0) * R * 0.62 - 0.3, y + Math.sin(a0) * R * 0.62 - 0.4); ctx.lineTo(x + Math.cos(a0) * R * 0.92 - 0.3, y + Math.sin(a0) * R * 0.92 - 0.4); } ctx.stroke();
  void key;
}
export function kutchSkin(ctx, S, d) {
  const { kind, col, x, y, s, key } = d, fill = isFilled(kind), lw = Math.max(2, s * 0.115);
  if (kind === 'dot') { shisha(ctx, x, y, s * 0.52, col, key); return; }
  const chain = (sc, c2, w) => cord(ctx, kindPath(ctx, kind, x, y, s * sc), w, c2, { dash: [0.5, 0.45] });
  if (!fill) { chain(1.04, col, lw); if (kind === 'ring') chain(0.7, shade(col, 0.12), lw * 0.8); return; }
  const rings = kind === 'solid' ? [1, 0.74, 0.48, 0.22] : [0.98, 0.72, 0.46, 0.2];
  rings.forEach((sc, i) => chain(sc, i % 2 ? shade(col, 0.14) : col, lw * (i ? 0.92 : 1)));
  if (kind === 'diamond' || kind === 'star' || kind === 'flower' || kind === 'hexagon') shisha(ctx, x, y, s * 0.21, shade(col, 0.1), key);
}

// Scene art, 1.11.0: four more textile scenes lifted (suzhou, bandhani, bobbinlace; toquilla plait lives in scene-y.js).
// Pure canvas 2D, no Math.random (hash only). Scenes in scenes-g.js / scenes-f.js reference these.
import { hash, rgba, mix, shade, roundRectPath, rod, ball, speck, lines, glow, TAU, motifPath, isFilled, lineWidthOf, clamp } from './scene-kit.js';
import { wideRect } from './scene-y.js';

const isLand = (S) => S.area.w > S.area.h * 1.15;
const cellAt = (S, c, r) => (S.cells && c >= 0 && r >= 0 && c < S.cols && r < S.rows ? S.cells[r * S.cols + c] : null);
const filledAt = (S, c, r) => { const v = cellAt(S, c, r); return !!v && v.m !== -1; };
// centre of a grid cell on the board rectangle (grid mode only)
const centreOf = (S, c, r) => ({ x: S.rect.x + (c + 0.5) * (S.rect.w / S.cols), y: S.rect.y + (r + 0.5) * (S.rect.h / S.rows) });

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// SUZHOU: silk embroidery in a redwood stretcher hung before a carved moon window; skeins and a threaded needle; stamps are satin-stitch work
// ---------------------------------------------------------------------------------------------------------------------------------------------------
const bamboo = (ctx, x, y0, y1, w, c, seed) => { // one bamboo culm with nodes, lit from the left, and a few leaf sprays
  const g = ctx.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, shade(c, 0.25)); g.addColorStop(0.45, c); g.addColorStop(1, shade(c, -0.45));
  ctx.fillStyle = g; ctx.fillRect(x - w / 2, y0, w, y1 - y0);
  ctx.fillStyle = shade(c, -0.5); const nodes = Math.max(3, Math.round((y1 - y0) / (w * 6)));
  for (let k = 1; k < nodes; k++) { const yy = y0 + ((y1 - y0) * k) / nodes + (hash(k, seed) - 0.5) * w; ctx.fillRect(x - w * 0.62, yy, w * 1.24, Math.max(1.2, w * 0.14)); }
  ctx.fillStyle = shade(c, -0.15);
  for (let k = 0; k < 6; k++) {
    const yy = y0 + (y1 - y0) * (0.1 + 0.8 * hash(k, seed, 3)), side = k % 2 ? 1 : -1, L = w * (4 + hash(k, seed, 5) * 3);
    ctx.save(); ctx.translate(x, yy); for (let j = 0; j < 3; j++) { ctx.save(); ctx.rotate(side * (0.55 + j * 0.28) + (side < 0 ? Math.PI : 0) * 0 - 1.57 * 0); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(L * 0.5 * side, -L * 0.18, L * side, L * 0.08 * (j - 1)); ctx.quadraticCurveTo(L * 0.5 * side, L * 0.1, 0, 0); ctx.fill(); ctx.restore(); }
    ctx.restore();
  }
};
// a hank of silk: a twisted loop of fine strands with a sheen and a tied band; hung from a rail (hanging) or lying on the shelf
const hank = (ctx, x, y, len, w, col, hanging, seed) => {
  ctx.save(); ctx.translate(x, y); if (!hanging) ctx.rotate(-Math.PI / 2); // lying: drawn the same way, turned
  ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.beginPath(); ctx.ellipse(w * 0.35, len * 0.52, w * 0.7, len * 0.54, 0, 0, TAU); ctx.fill();
  const g = ctx.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, shade(col, -0.5)); g.addColorStop(0.32, shade(col, 0.28)); g.addColorStop(0.55, col); g.addColorStop(1, shade(col, -0.55));
  ctx.lineCap = 'round';
  for (let k = 0; k < 9; k++) { // strands: long loops down and back, slightly spread, each with its own tint
    const o = (k - 4) * w * 0.12, tint = (hash(k, seed) - 0.5) * 0.2;
    ctx.strokeStyle = shade(col, tint - 0.1); ctx.lineWidth = Math.max(1, w * 0.17); ctx.beginPath(); ctx.moveTo(o * 0.3, 0); ctx.bezierCurveTo(o * 2.2 - w * 0.2, len * 0.3, o * 2.4 + w * 0.2, len * 0.75, o * 0.4, len); ctx.stroke();
    ctx.strokeStyle = rgba(shade(col, 0.6), 0.55); ctx.lineWidth = Math.max(0.7, w * 0.05); ctx.beginPath(); ctx.moveTo(o * 0.3 - w * 0.04, 0); ctx.bezierCurveTo(o * 2.2 - w * 0.24, len * 0.3, o * 2.4 + w * 0.16, len * 0.75, o * 0.4 - w * 0.04, len); ctx.stroke();
  }
  ctx.strokeStyle = g; ctx.lineWidth = w * 0.36; ctx.beginPath(); ctx.moveTo(0, len * 0.04); ctx.lineTo(0, len * 0.96); ctx.globalAlpha = 0.28; ctx.stroke(); ctx.globalAlpha = 1;
  ctx.fillStyle = '#efe3c4'; ctx.strokeStyle = 'rgba(40,20,0,0.55)'; ctx.lineWidth = 1; roundRectPath(ctx, -w * 0.62, len * 0.1, w * 1.24, len * 0.1, w * 0.1); ctx.fill(); ctx.stroke(); // paper band
  ctx.fillStyle = shade(col, -0.1); ctx.fillRect(-w * 0.62, len * 0.135, w * 1.24, len * 0.03);
  ctx.restore();
};
export function suzhouEnv(ctx, S) {
  const a = S.area, r = S.rect, X0 = a.x - 12, W = a.w + 24, land = isLand(S), t = Math.max(7, S.cell * 0.42);
  // plaster wall in shade: deep jade with fine tile joints
  const wg = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); wg.addColorStop(0, '#1b3d33'); wg.addColorStop(1, '#0f251f'); ctx.fillStyle = wg; ctx.fillRect(X0, a.y, W, a.h);
  lines(ctx, { x: X0, y: a.y, w: W, h: a.h }, 'h', S.cell * 1.3, '#000', 0.16, 1, 0, 3); lines(ctx, { x: X0, y: a.y, w: W, h: a.h }, 'v', S.cell * 2.6, '#000', 0.1, 1, 0, 5);
  speck(ctx, a, 220, ['#05120d', '#7fb59a'], 0.11, 1.6, 17);
  // the moon window behind the frame: stone coping, carved dark redwood ring, a bright misty garden inside
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2, R = Math.max(r.w, r.h) * (land ? 0.7 : 0.6), w = R * 0.1;
  ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, a.h); ctx.clip();
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = R * 0.16; ctx.shadowOffsetY = R * 0.04; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx, cy, R * 1.17, 0, TAU); ctx.fill(); ctx.restore();
  const cg = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R); cg.addColorStop(0, '#dfe8dc'); cg.addColorStop(0.5, '#a9b8a8'); cg.addColorStop(1, '#5d6e63'); ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, R * 1.17, 0, TAU); ctx.fill(); // coping
  ctx.strokeStyle = 'rgba(20,40,30,0.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, R * 1.17, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, R * 1.04, 0, TAU); ctx.clip(); // inside the ring: the garden
  const sg = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.35, R * 0.05, cx, cy, R * 1.05); sg.addColorStop(0, '#f4fbef'); sg.addColorStop(0.55, '#bddcc6'); sg.addColorStop(1, '#6a9a86'); ctx.fillStyle = sg; ctx.fillRect(cx - R * 1.1, cy - R * 1.1, R * 2.2, R * 2.2);
  ctx.fillStyle = 'rgba(40,86,70,0.35)'; ctx.beginPath(); ctx.moveTo(cx - R * 1.1, cy + R * 0.35); ctx.quadraticCurveTo(cx - R * 0.4, cy + R * 0.05, cx + R * 0.1, cy + R * 0.3); ctx.quadraticCurveTo(cx + R * 0.7, cy + R * 0.5, cx + R * 1.1, cy + R * 0.2); ctx.lineTo(cx + R * 1.1, cy + R * 1.1); ctx.lineTo(cx - R * 1.1, cy + R * 1.1); ctx.fill(); // far rockery
  ctx.fillStyle = 'rgba(30,60,50,0.4)'; ctx.beginPath(); ctx.moveTo(cx + R * 0.35, cy - R * 0.3); ctx.lineTo(cx + R * 0.62, cy - R * 0.44); ctx.lineTo(cx + R * 0.95, cy - R * 0.3); ctx.lineTo(cx + R * 0.9, cy - R * 0.26); ctx.lineTo(cx + R * 0.4, cy - R * 0.26); ctx.fill(); // an eave
  bamboo(ctx, cx - R * 0.72, cy - R, cy + R * 0.9, Math.max(3, R * 0.045), '#2d6b50', 3); bamboo(ctx, cx - R * 0.55, cy - R, cy + R, Math.max(2.4, R * 0.034), '#3a7e5e', 9); bamboo(ctx, cx + R * 0.78, cy - R, cy + R, Math.max(3, R * 0.04), '#2a634a', 15);
  glow(ctx, cx - R * 0.2, cy - R * 0.4, R * 1.2, '#ffffff', 0.35);
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, a.h); ctx.clip();
  const rg = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R); rg.addColorStop(0, '#9a5a3a'); rg.addColorStop(0.3, '#6a2e1e'); rg.addColorStop(1, '#1c0a06'); // the ring: carved redwood
  ctx.strokeStyle = rg; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(cx, cy, R * 1.04 - w / 2 + w * 0.0, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,214,170,0.55)'; ctx.lineWidth = Math.max(1.4, w * 0.16); ctx.beginPath(); ctx.arc(cx, cy, R * 1.04 - w * 0.2, Math.PI * 0.98, Math.PI * 1.62); ctx.stroke(); // sheen on the upper left
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = Math.max(1.2, w * 0.14); ctx.beginPath(); ctx.arc(cx, cy, R * 1.04 - w * 0.85, Math.PI * 1.9, Math.PI * 2.55); ctx.stroke();
  ctx.strokeStyle = '#d9b25a'; ctx.lineWidth = Math.max(1.2, w * 0.1); ctx.beginPath(); ctx.arc(cx, cy, R * 1.04 - w * 1.02, 0, TAU); ctx.stroke(); // gold inlay
  ctx.strokeStyle = 'rgba(30,10,4,0.55)'; ctx.lineWidth = 1; for (let k = 0; k < 24; k++) { const an = (k / 24) * TAU; ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * (R * 1.04 - w * 0.9), cy + Math.sin(an) * (R * 1.04 - w * 0.9)); ctx.lineTo(cx + Math.cos(an) * (R * 1.04 - w * 0.2), cy + Math.sin(an) * (R * 1.04 - w * 0.2)); ctx.stroke(); } // carved ticks
  ctx.restore();
  // the shelf the frame stands on (lacquered, with a lit lip) and, in landscape, a rail with hanging skeins
  const sy = Math.min(a.y + a.h - Math.max(10, S.cell * 0.5), r.y + r.h + t * 0.45);
  const sh = ctx.createLinearGradient(0, sy, 0, a.y + a.h); sh.addColorStop(0, '#4a1810'); sh.addColorStop(0.12, '#7a2c1c'); sh.addColorStop(1, '#210a06'); ctx.fillStyle = sh; ctx.fillRect(X0, sy, W, a.y + a.h - sy + 12);
  ctx.fillStyle = 'rgba(255,200,150,0.5)'; ctx.fillRect(X0, sy, W, Math.max(1.2, S.cell * 0.05));
  vignetteEdge(ctx, X0, a.y, W, a.h);
  if (land && !S.lite && !S.card) { // hanging skeins at the right of the frame, tied to a bamboo rail
    const x0 = r.x + r.w + t * 2.2, x1 = Math.min(a.x + a.w - S.cell * 0.4, x0 + S.cell * 5.5), ry = a.y + a.h * 0.16;
    if (x1 - x0 > S.cell * 2.4) {
      rod(ctx, x0 - S.cell * 0.3, ry, x1 + S.cell * 0.3, ry, Math.max(4, S.cell * 0.22), '#b98c52');
      const n = Math.min(5, Math.max(2, Math.floor((x1 - x0) / (S.cell * 1.15)))), cols = S.colors;
      for (let k = 0; k < n; k++) hank(ctx, x0 + ((k + 0.5) * (x1 - x0)) / n, ry + S.cell * 0.12, S.cell * (2.9 + hash(k, 4) * 0.8), S.cell * 0.78, cols[k % cols.length], true, k + 2);
    }
  }
}
function vignetteEdge(ctx, x, y, w, h) { const v = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.35, x + w / 2, y + h / 2, Math.max(w, h) * 0.78); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.42)'); ctx.fillStyle = v; ctx.fillRect(x, y, w, h); }
// taut silk: broad satin sheen bands, a fine warp, tension pull at the corners, window light from the upper left
export function suzhouGround(ctx, S) {
  const r = S.rect, c = S.cell, m = S.bg;
  ctx.fillStyle = mix(m, '#f4ecd2', 0.18); ctx.fillRect(r.x, r.y, r.w, r.h);
  const p = Math.max(1.6, c / 9);
  ctx.beginPath(); for (let x = r.x + p / 2; x < r.x + r.w; x += p) { ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); } ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = p * 0.45; ctx.stroke();
  ctx.beginPath(); for (let x = r.x + p; x < r.x + r.w; x += p * 2) { ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); } ctx.strokeStyle = 'rgba(30,60,50,0.05)'; ctx.lineWidth = p * 0.3; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  const g = ctx.createLinearGradient(r.x, r.y + r.h * 0.1, r.x + r.w, r.y + r.h * 0.9);
  const stops = [[0, 'rgba(255,255,248,0.05)'], [0.1, 'rgba(255,255,250,0.55)'], [0.2, 'rgba(255,255,250,0.1)'], [0.28, 'rgba(40,86,68,0.2)'], [0.38, 'rgba(255,255,250,0.1)'], [0.46, 'rgba(255,255,250,0.5)'], [0.56, 'rgba(255,255,250,0.05)'], [0.66, 'rgba(40,86,68,0.18)'], [0.78, 'rgba(255,255,250,0.32)'], [0.9, 'rgba(40,86,68,0.12)'], [1, 'rgba(255,255,250,0.06)']];
  stops.forEach(([s0, cc]) => g.addColorStop(s0, cc)); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  const d = ctx.createLinearGradient(r.x + r.w, r.y, r.x, r.y + r.h); d.addColorStop(0, 'rgba(20,50,40,0.22)'); d.addColorStop(0.45, 'rgba(20,50,40,0)'); d.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = d; ctx.fillRect(r.x, r.y, r.w, r.h);
  for (const [px, py, sx, sy2] of [[r.x, r.y, 1, 1], [r.x + r.w, r.y, -1, 1], [r.x, r.y + r.h, 1, -1], [r.x + r.w, r.y + r.h, -1, -1]]) { // the pull toward the lacing at each corner
    ctx.strokeStyle = 'rgba(40,70,58,0.1)'; ctx.lineWidth = Math.max(2, c * 0.14); ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(px + sx * c * 0.3, py + sy2 * c * (0.5 + k * 0.28)); ctx.quadraticCurveTo(px + sx * c * 1.2, py + sy2 * c * (0.9 + k * 0.28), px + sx * c * (2.4 + k * 0.4), py + sy2 * c * (1.4 + k * 0.5)); } ctx.stroke();
  }
  ctx.restore();
  if (!S.lite) suzhouLinks(ctx, S);
}
// connected sprays: a fine silk stem joins every pair of neighbouring stamps (under the stamps), so the panel reads as one embroidered branch work
function suzhouLinks(ctx, S) {
  if (S.polar || !S.cells) return;
  const c = S.cell, w = Math.max(2.2, c * 0.1), cols = S.cols, rows = S.rows;
  const link = (c0, r0, c1, r1) => {
    const A = centreOf(S, c0, r0), B = centreOf(S, c1, r1), a0 = S.cells[r0 * cols + c0], b0 = S.cells[r1 * cols + c1];
    const ca = S.colors[a0.c] ?? '#3a9a7a', cb = S.colors[b0.c] ?? '#3a9a7a', col = mix(mix(ca, cb, 0.5), '#2f7a5c', 0.55);
    const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, nx = -(B.y - A.y), ny = B.x - A.x, bow = (hash(c0 + r0 * 9, c1 + r1 * 7, 2) - 0.5) * 0.4;
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.quadraticCurveTo(mx + nx * bow, my + ny * bow, B.x, B.y);
    ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(10,30,20,0.3)'; ctx.lineWidth = w + 2; ctx.save(); ctx.translate(0.9, 1.5); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = shade(col, -0.45); ctx.lineWidth = w; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w * 0.72; ctx.stroke();
    ctx.setLineDash([w * 0.55, w * 0.42]); ctx.strokeStyle = rgba(shade(col, -0.35), 0.5); ctx.lineWidth = w * 0.72; ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = rgba(shade(col, 0.65), 0.7); ctx.lineWidth = Math.max(0.8, w * 0.22); ctx.save(); ctx.translate(-w * 0.12, -w * 0.18); ctx.stroke(); ctx.restore();
    // a small leaf on the stem (alternating side)
    const lx = mx + nx * bow * 0.5, ly = my + ny * bow * 0.5, side = hash(c0, r0, c1 + r1) > 0.5 ? 1 : -1, ang = Math.atan2(B.y - A.y, B.x - A.x) + side * 1.05, L = c * 0.36;
    ctx.save(); ctx.translate(lx, ly); ctx.rotate(ang); ctx.fillStyle = shade(col, 0.12); ctx.strokeStyle = shade(col, -0.5); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(L * 0.5, -L * 0.34, L, 0); ctx.quadraticCurveTo(L * 0.5, L * 0.3, 0, 0); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = rgba(shade(col, 0.7), 0.7); ctx.beginPath(); ctx.moveTo(L * 0.1, 0); ctx.lineTo(L * 0.85, 0); ctx.stroke(); ctx.restore();
  };
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) { if (!filledAt(S, q, r)) continue; if (filledAt(S, q + 1, r)) link(q, r, q + 1, r); if (filledAt(S, q, r + 1)) link(q, r, q, r + 1); }
}
// window light on the silk and the frame's own shadow
export function suzhouOver(ctx, S) {
  const r = S.rect, c = S.cell, e = Math.max(5, c * 0.55);
  const tg = ctx.createLinearGradient(0, r.y, 0, r.y + e); tg.addColorStop(0, 'rgba(10,30,20,0.32)'); tg.addColorStop(1, 'rgba(10,30,20,0)'); ctx.fillStyle = tg; ctx.fillRect(r.x, r.y, r.w, e);
  const lg = ctx.createLinearGradient(r.x, 0, r.x + e, 0); lg.addColorStop(0, 'rgba(10,30,20,0.26)'); lg.addColorStop(1, 'rgba(10,30,20,0)'); ctx.fillStyle = lg; ctx.fillRect(r.x, r.y, e, r.h);
  const g = ctx.createRadialGradient(r.x + r.w * 0.3, r.y + r.h * 0.25, 0, r.x + r.w * 0.3, r.y + r.h * 0.25, r.w * 0.9); g.addColorStop(0, 'rgba(255,255,240,0.14)'); g.addColorStop(1, 'rgba(255,255,240,0)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
}
// the threaded needle lying across the lower-right corner of the frame, its silk trailing to the shelf
export function suzhouFrame(ctx, S) {
  if (S.lite || S.card) return;
  const r = S.rect, c = S.cell, t = Math.max(7, c * 0.42), tip = { x: r.x + r.w - c * 0.35, y: r.y + r.h - c * 0.2 }, L = c * 2.5, ang = Math.PI * 0.8, eye = { x: tip.x + Math.cos(ang) * -L * 0.0 + L * 0.82, y: tip.y + L * 0.5 };
  void ang;
  const col = S.colors[Math.min(S.sel ? S.sel.c : 0, S.colors.length - 1)] ?? '#e0708a', a = S.area, endY = Math.min(a.y + a.h - c * 0.15, r.y + r.h + t + c * 0.75);
  // thread: from the eye, a loop on the frame and shelf
  ctx.save(); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(eye.x, eye.y); ctx.bezierCurveTo(eye.x + c * 0.9, eye.y + c * 0.1, eye.x + c * 0.2, endY - c * 0.1, eye.x - c * 0.9, endY);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = Math.max(2.2, c * 0.085) + 2; ctx.save(); ctx.translate(1, 1.8); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = shade(col, -0.45); ctx.lineWidth = Math.max(2.2, c * 0.085); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.6, c * 0.062); ctx.stroke(); ctx.strokeStyle = rgba(shade(col, 0.7), 0.8); ctx.lineWidth = Math.max(0.8, c * 0.02); ctx.save(); ctx.translate(-0.5, -0.7); ctx.stroke(); ctx.restore(); ctx.restore();
  // needle: steel, bright edge, round eye
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse((tip.x + eye.x) / 2 + 2, (tip.y + eye.y) / 2 + 3, L * 0.5, 2.4, Math.atan2(eye.y - tip.y, eye.x - tip.x), 0, TAU); ctx.fill(); ctx.restore();
  rod(ctx, tip.x, tip.y, eye.x, eye.y, Math.max(2.6, c * 0.1), '#c9d2da');
  ctx.fillStyle = '#10161a'; ctx.beginPath(); ctx.ellipse(eye.x, eye.y, Math.max(1.2, c * 0.04), Math.max(2, c * 0.075), Math.atan2(eye.y - tip.y, eye.x - tip.x) + Math.PI / 2, 0, TAU); ctx.fill();
    // lying hanks on the shelf (portrait)
  if (!isLand(S)) { const y0 = Math.min(a.y + a.h - Math.max(8, c * 0.42), r.y + r.h + t + c * 0.6), cols = S.colors, n = 3; for (let k = 0; k < n; k++) hank(ctx, r.x + c * (0.7 + k * 1.15), y0 + (k % 2) * 1.5, c * 1.0, c * 0.4, cols[(k + 1) % cols.length], false, k + 11); }
}

// satin-stitch stamps ---------------------------------------------------------------------------------------------------------------------------
const AXIS = { leaf: -0.59 };
function satinFill(ctx, kind, x, y, s, col, key) {
  const h = s / 2, p = Math.max(1.5, s / 15), lw = p * 0.95, dk = shade(col, -0.3), lt = shade(col, 0.38), N = Math.ceil(s * 1.6 / p);
  ctx.beginPath(); // stitches
  const ln = (a0, b0, a1, b1) => { ctx.moveTo(a0, b0); ctx.lineTo(a1, b1); };
  const bodies = [[], [], [], []];
  const radial = kind === 'dot' || kind === 'star' || kind === 'hexagon' || kind === 'flower';
  if (radial) {
    const n = kind === 'dot' ? 44 : 56;
    for (let k = 0; k < n; k++) { const a = (k / n) * TAU + (kind === 'star' ? 0 : 0.03), t = Math.floor(hash(key, k) * 4); bodies[t].push([x + Math.cos(a) * s * 0.06, y + Math.sin(a) * s * 0.06, x + Math.cos(a) * s * 0.62, y + Math.sin(a) * s * 0.62]); }
  } else if (kind === 'leaf') {
    const ax = AXIS.leaf, ca = Math.cos(ax), sa = Math.sin(ax);
    for (let k = 0; k < N; k++) { const u = -h * 0.9 + (k + 0.5) * (h * 1.9 / N), side = k % 2 ? 1 : -1, t = Math.floor(hash(key, k) * 4);
      const px = x + (ca * u), py = y + (sa * u), ang = ax + side * 0.95, ex = px + Math.cos(ang) * h * 0.95, ey = py + Math.sin(ang) * h * 0.95; bodies[t].push([px, py, ex, ey]); const ang2 = ax - side * 0.95; bodies[(t + 1) % 4].push([px, py, px + Math.cos(ang2) * h * 0.95, py + Math.sin(ang2) * h * 0.95]); }
  } else { // arch, diamond, solid, triangle and the rest: slanted rows, direction flips at the middle (a seam of change of light)
    for (let k = 0; k < N; k++) { const u = -h * 1.1 + k * p * 0.95, t = Math.floor(hash(key, k) * 4); bodies[t].push(kind === 'arch' ? [x + u, y + h * 1.0, x + u, y - h * 1.0] : [x + u - h, y + h, x + u + h * 0.3, y - h * 0.9]); }
  }
  ctx.lineCap = 'round';
  const tints = [-0.1, 0, 0.08, 0.15];
  for (let t = 0; t < 4; t++) { ctx.beginPath(); for (const q of bodies[t]) ln(...q); ctx.strokeStyle = shade(col, tints[t]); ctx.lineWidth = lw; ctx.stroke(); }
  ctx.beginPath(); for (const q of bodies[3]) ln(q[0] - 0.4, q[1] - 0.6, q[2] - 0.4, q[3] - 0.6); ctx.strokeStyle = rgba(lt, 0.5); ctx.lineWidth = Math.max(0.7, lw * 0.28); ctx.stroke();
  ctx.beginPath(); for (const q of bodies[0]) ln(q[0] + 0.4, q[1] + 0.6, q[2] + 0.4, q[3] + 0.6); ctx.strokeStyle = rgba(dk, 0.35); ctx.lineWidth = Math.max(0.7, lw * 0.22); ctx.stroke();
}
// a flowering vine: a couched cord stem with four satin leaves and a curled tendril
function vineSilk(ctx, x, y, s, col, key) {
  const h = s * 0.55, P = (px, py) => [x + px * h, y + py * h], dk = shade(col, -0.5), lw = Math.max(2, s * 0.07);
  const stem = () => { ctx.beginPath(); ctx.moveTo(...P(-0.9, 0.55)); ctx.bezierCurveTo(...P(-0.35, 0.8), ...P(-0.25, 0.05), ...P(0.05, -0.1)); ctx.bezierCurveTo(...P(0.35, -0.25), ...P(0.6, -0.75), ...P(0.9, -0.5)); };
  const leaves = [[-0.5, 0.62, -1.05, 0.5], [-0.16, 0.12, 1.15, 0.45], [0.3, -0.2, -0.6, 0.5], [0.62, -0.58, 0.5, 0.36]];
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  stem(); ctx.strokeStyle = 'rgba(8,20,14,0.38)'; ctx.lineWidth = lw + 2; ctx.save(); ctx.translate(0.9, 1.6); ctx.stroke(); ctx.restore();
  stem(); ctx.strokeStyle = dk; ctx.lineWidth = lw + 0.8; ctx.stroke(); ctx.strokeStyle = shade(col, -0.1); ctx.lineWidth = lw * 0.8; ctx.stroke(); ctx.setLineDash([lw * 0.3, lw * 0.34]); ctx.strokeStyle = rgba(shade(col, 0.3), 0.7); ctx.stroke(); ctx.setLineDash([]);
  leaves.forEach(([px, py, ang, L], i) => {
    const ca = Math.cos(ang), sa = Math.sin(ang), nx = -sa, ny = ca, lc = shade(col, [0.1, -0.05, 0.16, 0][i]);
    const path = () => { ctx.beginPath(); ctx.moveTo(...P(px, py)); ctx.quadraticCurveTo(...P(px + ca * L * 0.5 + nx * L * 0.34, py + sa * L * 0.5 + ny * L * 0.34), ...P(px + ca * L, py + sa * L)); ctx.quadraticCurveTo(...P(px + ca * L * 0.5 - nx * L * 0.34, py + sa * L * 0.5 - ny * L * 0.34), ...P(px, py)); ctx.closePath(); };
    path(); ctx.fillStyle = 'rgba(8,20,14,0.3)'; ctx.save(); ctx.translate(0.9, 1.5); ctx.fill(); ctx.restore();
    path(); ctx.fillStyle = shade(lc, -0.3); ctx.fill(); ctx.save(); ctx.clip();
    ctx.lineWidth = Math.max(1, s * 0.03); for (let k = 0; k < 9; k++) { const t = 0.08 + k * 0.1; ctx.strokeStyle = shade(lc, (k % 2 ? 0.12 : -0.04)); for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(...P(px + ca * L * t, py + sa * L * t)); ctx.lineTo(...P(px + ca * L * (t + 0.18) + nx * sd * L * 0.4, py + sa * L * (t + 0.18) + ny * sd * L * 0.4)); ctx.stroke(); } }
    const g = ctx.createLinearGradient(...P(px + nx * L * 0.3, py + ny * L * 0.3), ...P(px - nx * L * 0.3, py - ny * L * 0.3)); g.addColorStop(0, 'rgba(255,255,240,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0.25)'); ctx.fillStyle = g; ctx.fillRect(x - s, y - s, s * 2, s * 2); ctx.restore();
    ctx.strokeStyle = rgba(shade(lc, -0.6), 0.85); ctx.lineWidth = Math.max(1, s * 0.03); path(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(...P(px, py)); ctx.lineTo(...P(px + ca * L * 0.92, py + sa * L * 0.92)); ctx.strokeStyle = rgba(shade(lc, 0.7), 0.8); ctx.lineWidth = Math.max(0.8, s * 0.02); ctx.stroke();
  });
  ctx.beginPath(); ctx.moveTo(...P(0.05, -0.1)); ctx.bezierCurveTo(...P(-0.05, -0.45), ...P(-0.3, -0.5), ...P(-0.32, -0.3)); ctx.strokeStyle = dk; ctx.lineWidth = lw * 0.55; ctx.stroke(); ctx.strokeStyle = shade(col, 0.1); ctx.lineWidth = lw * 0.35; ctx.stroke();
}
export function suzhouSkin(ctx, S, d) {
  const { kind, col, x, y, s, key } = d, fill = isFilled(kind);
  if (kind === 'vine') { vineSilk(ctx, x, y, s * 1.12, col, key); return; }
  if (!fill) { // a couched silk cord: round, glossy, twisted ticks
    const lw = lineWidthOf(kind, s) * 1.05; ctx.save(); motifPath(ctx, kind, x, y, s * 1.08); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(10,20,14,0.38)'; ctx.lineWidth = lw + 2.5; ctx.save(); ctx.translate(0.9, 1.7); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = shade(col, -0.5); ctx.lineWidth = lw + 0.8; ctx.stroke(); ctx.strokeStyle = shade(col, -0.08); ctx.lineWidth = lw * 0.82; ctx.stroke();
    ctx.setLineDash([lw * 0.3, lw * 0.34]); ctx.strokeStyle = rgba(shade(col, 0.28), 0.7); ctx.lineWidth = lw * 0.82; ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = rgba(shade(col, 0.75), 0.85); ctx.lineWidth = Math.max(0.9, lw * 0.2); ctx.save(); ctx.translate(-lw * 0.12, -lw * 0.2); ctx.stroke(); ctx.restore(); ctx.restore(); return;
  }
  const k2 = kind === 'bird' ? 1.18 : kind === 'dot' ? 1.14 : 1.2, s2 = s * k2;
  ctx.save(); motifPath(ctx, kind, x, y, s2); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(8,20,14,0.42)'; ctx.lineWidth = s * 0.08; ctx.save(); ctx.translate(s * 0.02, s * 0.045); ctx.stroke(); ctx.restore();
  ctx.fillStyle = shade(col, -0.4); ctx.fill(); ctx.clip();
  if (kind === 'bird') birdSilk(ctx, x, y, s2, col, key); else satinFill(ctx, kind, x, y, s2, col, key);
  // modelling: darker rim, lit upper left, a sheen band, split-stitch outline
  const og = ctx.createRadialGradient(x - s2 * 0.2, y - s2 * 0.25, s2 * 0.08, x, y, s2 * 0.62); og.addColorStop(0, 'rgba(255,255,240,0.2)'); og.addColorStop(0.6, 'rgba(255,255,240,0)'); og.addColorStop(1, 'rgba(10,20,14,0.38)'); ctx.fillStyle = og; ctx.fillRect(x - s2, y - s2, s2 * 2, s2 * 2);
  const sg = ctx.createLinearGradient(x - s2 / 2, y - s2 / 2, x + s2 / 2, y + s2 / 2); sg.addColorStop(0.25, 'rgba(255,255,250,0)'); sg.addColorStop(0.42, 'rgba(255,255,250,0.34)'); sg.addColorStop(0.55, 'rgba(255,255,250,0)'); ctx.fillStyle = sg; ctx.fillRect(x - s2, y - s2, s2 * 2, s2 * 2);
  if (kind === 'leaf') { // split-stitch midrib and a few veins
    const ax = AXIS.leaf, ca = Math.cos(ax), sa = Math.sin(ax), h = s2 / 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - ca * h * 0.82, y - sa * h * 0.82); ctx.lineTo(x + ca * h * 0.95, y + sa * h * 0.95); ctx.strokeStyle = rgba(shade(col, -0.55), 0.8); ctx.lineWidth = Math.max(1.3, s * 0.05); ctx.stroke();
    ctx.setLineDash([s * 0.06, s * 0.05]); ctx.strokeStyle = rgba(shade(col, 0.75), 0.8); ctx.lineWidth = Math.max(0.8, s * 0.022); ctx.save(); ctx.translate(-0.4, -0.6); ctx.stroke(); ctx.restore(); ctx.setLineDash([]);
  }
  ctx.restore();
  ctx.save(); motifPath(ctx, kind, x, y, s2); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(shade(col, -0.6), 0.85); ctx.lineWidth = Math.max(1, s * 0.035); ctx.stroke(); ctx.setLineDash([s * 0.045, s * 0.04]); ctx.strokeStyle = rgba(shade(col, 0.55), 0.6); ctx.lineWidth = Math.max(0.7, s * 0.016); ctx.stroke(); ctx.restore();
}
// the bird stamp (art.js `bird`: head right, tail left): satin body, lighter breast, feathered wing, tail streamers, eye and beak
function birdSilk(ctx, x, y, s, col, key) {
  const h = s / 2, P = (px, py) => [x + px * h, y + py * h], p = Math.max(1.4, s / 17);
  // body stitches run head to tail
  ctx.lineCap = 'round'; ctx.lineWidth = p * 0.95; const dk = shade(col, -0.22), lt = shade(col, 0.22);
  for (let k = -22; k < 26; k++) { const u = k * p * 0.9; const t = hash(key, k); ctx.beginPath(); ctx.moveTo(x + u + h * 0.9, y - h * 1.0 - u * 0.0); ctx.lineTo(x + u - h * 0.9, y + h * 0.9); ctx.strokeStyle = shade(col, (t - 0.5) * 0.16 - (u > 0 ? 0.05 : 0)); ctx.stroke(); }
  // breast: lighter, lower right
  const bg = ctx.createLinearGradient(...P(0, -0.7), ...P(0.4, 0.55)); bg.addColorStop(0, 'rgba(0,0,0,0.12)'); bg.addColorStop(0.55, 'rgba(255,255,255,0)'); bg.addColorStop(1, rgba(lt, 0.55)); ctx.fillStyle = bg; ctx.fillRect(x - h, y - h, s, s);
  // wing: a darker shape of overlapping feather scallops
  ctx.save(); ctx.beginPath(); ctx.moveTo(...P(0.1, -0.46)); ctx.quadraticCurveTo(...P(-0.35, -0.3), ...P(-0.78, 0.5)); ctx.quadraticCurveTo(...P(-0.25, 0.42), ...P(0.3, 0.12)); ctx.quadraticCurveTo(...P(0.4, -0.2), ...P(0.1, -0.46)); ctx.closePath(); ctx.fillStyle = shade(col, -0.2); ctx.fill(); ctx.strokeStyle = rgba(shade(col, -0.62), 0.8); ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke(); ctx.clip();
  for (let k = 0; k < 6; k++) { const t = k / 5; ctx.beginPath(); ctx.arc(...P(0.22 - t * 0.78, -0.12 + t * 0.56), h * 0.2, Math.PI * 0.1, Math.PI * 0.95); ctx.strokeStyle = rgba(lt, 0.7); ctx.lineWidth = Math.max(0.9, s * 0.028); ctx.stroke(); ctx.beginPath(); ctx.arc(...P(0.22 - t * 0.78, -0.07 + t * 0.56), h * 0.2, Math.PI * 0.1, Math.PI * 0.95); ctx.strokeStyle = rgba(shade(col, -0.6), 0.45); ctx.stroke(); }
  ctx.restore();
  // tail feather lines
  ctx.strokeStyle = rgba(shade(col, -0.6), 0.55); ctx.lineWidth = Math.max(0.9, s * 0.026); for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(...P(-0.5 - k * 0.05, 0.3 + k * 0.1)); ctx.lineTo(...P(-0.9 + k * 0.03, 0.74 - k * 0.02)); ctx.stroke(); }
  // eye: white ring, dark pupil, glint; beak: gold wedge
  ctx.fillStyle = '#fbf4e0'; ctx.beginPath(); ctx.arc(...P(0.5, -0.4), h * 0.11, 0, TAU); ctx.fill(); ctx.fillStyle = '#10161a'; ctx.beginPath(); ctx.arc(...P(0.52, -0.4), h * 0.065, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(...P(0.54, -0.43), h * 0.02, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e8b030'; ctx.strokeStyle = 'rgba(70,40,0,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...P(0.8, -0.34)); ctx.lineTo(...P(1.08, -0.16)); ctx.lineTo(...P(0.82, -0.1)); ctx.closePath(); ctx.fill(); ctx.stroke();
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// BANDHANI: cloth pinched into tiny points, bound with thread, dipped in dye baths. Bound points are puckered bulbs with thread wraps and a dye halo;
// the cloth is real dyed cotton (fine weave, mottled dye, fold light); dye tubs stand inside the frame, the one in front is the selected dye.
// ---------------------------------------------------------------------------------------------------------------------------------------------------
const CREAM = '#f7ecd2';
// a clay dye tub seen from above and a little in front: glazed rim, dye surface with ripples and a lit edge, a stirring stick across it
function dyeTub(ctx, x, y, R, liquid, seed, stick) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(x + R * 0.16, y + R * 0.24, R * 1.08, R * 1.0, 0, 0, TAU); ctx.fill();
  const g = ctx.createRadialGradient(x - R * 0.4, y - R * 0.45, R * 0.1, x, y, R * 1.05); g.addColorStop(0, '#d79a62'); g.addColorStop(0.5, '#a65e30'); g.addColorStop(1, '#4a2410'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,225,180,0.55)'; ctx.lineWidth = Math.max(1, R * 0.07); ctx.beginPath(); ctx.arc(x, y, R * 0.94, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke(); // rim glaze
  ctx.fillStyle = '#1a0c06'; ctx.beginPath(); ctx.arc(x, y, R * 0.8, 0, TAU); ctx.fill(); // inner wall in shade
  const l = ctx.createRadialGradient(x - R * 0.25, y - R * 0.3, R * 0.05, x, y, R * 0.74); l.addColorStop(0, shade(liquid, 0.38)); l.addColorStop(0.5, liquid); l.addColorStop(1, shade(liquid, -0.55)); ctx.fillStyle = l; ctx.beginPath(); ctx.arc(x, y, R * 0.72, 0, TAU); ctx.fill();
  ctx.strokeStyle = rgba(shade(liquid, 0.55), 0.55); ctx.lineWidth = Math.max(0.8, R * 0.035); for (const k of [0.3, 0.5]) { ctx.beginPath(); ctx.ellipse(x + R * 0.1, y + R * 0.05, R * k, R * k * 0.85, 0.4, 0.2, 5.5); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(x - R * 0.3, y - R * 0.32, R * 0.22, R * 0.07, -0.7, 0, TAU); ctx.fill();
  if (stick) { rod(ctx, x - R * 0.9, y + R * 0.45, x + R * 1.0, y - R * 0.55, Math.max(2.4, R * 0.1), '#b98c52'); }
  for (let k = 0; k < 5; k++) { const an = hash(k, seed) * TAU, rr = R * 0.84; ctx.fillStyle = rgba(liquid, 0.8); ctx.beginPath(); ctx.arc(x + Math.cos(an) * rr, y + Math.sin(an) * rr, Math.max(1, R * 0.05), 0, TAU); ctx.fill(); } // drips on the rim
  ctx.restore();
}
export function bandhaniEnv(ctx, S, floor, sunShaft) {
  const a = S.area, b = S.box, r = S.rect, c = S.cell;
  floor(ctx, S);
  for (let k = 0; k < 36; k++) { const x = a.x + hash(k, 1) * a.w, y = a.y + hash(k, 2) * a.h; ctx.fillStyle = rgba(['#f0a020', '#e8601a'][k % 2], 0.6); ctx.beginPath(); ctx.ellipse(x, y, c * 0.1, c * 0.06, hash(k, 3) * 3, 0, TAU); ctx.fill(); }
  sunShaft(ctx, a, '#ffe8b0', 0.1, 0.4, 0.3);
  if (S.card) return;
  const cols = S.colors, sel = S.sel ? S.sel.c : 0, dyes = cols.filter((cc) => cc !== CREAM && cc.toLowerCase() !== '#f7ecd2'), dye = (i) => dyes.length ? dyes[i % dyes.length] : '#1f3f7a';
  const cur = cols[Math.min(sel, cols.length - 1)], active = cur && cur.toLowerCase() !== CREAM ? cur : dye(0);
  const fl = r.x - b.x, fr = b.x + b.w - (r.x + r.w), ft = r.y - b.y, fb = b.y + b.h - (r.y + r.h);
  if (isLand(S) && Math.min(fl, fr) > c * 1.6) { // beside the cloth
    const R = clamp(Math.min(fl, fr) * 0.4, c * 0.6, c * 1.5);
    dyeTub(ctx, b.x + fl * 0.5, r.y + r.h * 0.74, R, active, 3, true); dyeTub(ctx, r.x + r.w + fr * 0.5, r.y + r.h * 0.28, R * 0.9, dye(1 + (dyes.indexOf(active) < 0 ? 0 : dyes.indexOf(active))), 5, false);
  } else { // portrait: two tubs fully in the corners, the cloth lies over their near edge
    const R = clamp(Math.min(fl, ft, fr, fb) * 0.72, c * 0.4, c * 0.9);
    dyeTub(ctx, b.x + R + 2, b.y + b.h - R - 2, R, active, 3, true); dyeTub(ctx, b.x + b.w - R - 2, b.y + R + 2, R, dye(1 + (dyes.indexOf(active) < 0 ? 0 : dyes.indexOf(active))), 5, false);
  }
}
// dyed cotton: fine weave, mottled dye, folds, light from the upper left
export function bandhaniGround(ctx, S, weaveGrid) {
  const r = S.rect, c = S.cell, m = S.bg;
  ctx.fillStyle = m; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  if (!S.lite) for (let k = 0; k < 16; k++) { const px = r.x + hash(k, 7) * r.w, py = r.y + hash(k, 8) * r.h, R = c * (1.2 + hash(k, 9) * 2.4), gg = ctx.createRadialGradient(px, py, 0, px, py, R); gg.addColorStop(0, hash(k, 4) > 0.5 ? 'rgba(255,120,90,0.1)' : 'rgba(40,0,10,0.16)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gg; ctx.fillRect(px - R, py - R, R * 2, R * 2); }
  const p = Math.max(1.8, c / 11);
  ctx.beginPath(); for (let y = r.y; y < r.y + r.h; y += p) { ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); } ctx.strokeStyle = 'rgba(255,200,170,0.07)'; ctx.lineWidth = p * 0.4; ctx.stroke();
  ctx.beginPath(); for (let x = r.x; x < r.x + r.w; x += p) { ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); } ctx.strokeStyle = 'rgba(40,0,10,0.09)'; ctx.lineWidth = p * 0.35; ctx.stroke();
  ctx.strokeStyle = 'rgba(30,0,8,0.16)'; ctx.lineWidth = Math.max(2, c * 0.2); ctx.beginPath(); ctx.moveTo(r.x, r.y + r.h * 0.34); ctx.quadraticCurveTo(r.x + r.w * 0.5, r.y + r.h * 0.28, r.x + r.w, r.y + r.h * 0.4); ctx.moveTo(r.x + r.w * 0.28, r.y); ctx.quadraticCurveTo(r.x + r.w * 0.22, r.y + r.h * 0.5, r.x + r.w * 0.34, r.y + r.h); ctx.stroke(); // fold creases
  ctx.strokeStyle = 'rgba(255,190,160,0.09)'; ctx.lineWidth = Math.max(1.5, c * 0.1); ctx.save(); ctx.translate(2, 3); ctx.stroke(); ctx.restore();
  ctx.restore(); void weaveGrid;
}
export function bandhaniOver(ctx, S) {
  const r = S.rect, c = S.cell, e = Math.max(5, c * 0.5);
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,236,190,0.2)'); g.addColorStop(0.5, 'rgba(255,236,190,0)'); g.addColorStop(1, 'rgba(30,0,10,0.28)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  const tg = ctx.createLinearGradient(0, r.y, 0, r.y + e); tg.addColorStop(0, 'rgba(20,0,0,0.3)'); tg.addColorStop(1, 'rgba(20,0,0,0)'); ctx.fillStyle = tg; ctx.fillRect(r.x, r.y, r.w, e);
}
// one bound point: dye halo (resist edge), cloth gathered into pleats, a bulb, thread wraps round the neck, a dyed nub at the very top
function boundPoint(ctx, cx, cy, r, col, thread, key) {
  ctx.fillStyle = rgba(shade(col, -0.42), 0.55); ctx.beginPath(); ctx.arc(cx, cy, r * 1.32, 0, TAU); ctx.fill(); // dye pooled round the resist
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(cx + r * 0.2, cy + r * 0.32, r * 1.0, r * 0.86, 0, 0, TAU); ctx.fill();
  const n = 8, a0 = hash(key, 5) * 0.8;
  for (let k = 0; k < n; k++) { // pleats of cloth gathered to the tie
    const an = a0 + (k / n) * TAU; ctx.save(); ctx.translate(cx, cy); ctx.rotate(an);
    const g = ctx.createLinearGradient(0, -r * 0.3, 0, r * 0.3); g.addColorStop(0, shade(CREAM, 0.06)); g.addColorStop(1, shade(CREAM, -0.32 - 0.1 * (k % 2)));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(r * 0.2, 0); ctx.quadraticCurveTo(r * 0.7, -r * 0.46, r * 1.02, -r * 0.08); ctx.quadraticCurveTo(r * 1.08, r * 0.18, r * 0.66, r * 0.38); ctx.quadraticCurveTo(r * 0.4, r * 0.2, r * 0.2, 0); ctx.fill(); ctx.restore();
  }
  const bg = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.25, r * 0.05, cx, cy, r * 0.62); bg.addColorStop(0, '#fffdf0'); bg.addColorStop(0.55, CREAM); bg.addColorStop(1, shade(CREAM, -0.3)); ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(cx, cy, r * 0.58, 0, TAU); ctx.fill();
  ctx.lineCap = 'round'; ctx.strokeStyle = shade(thread, -0.45); ctx.lineWidth = Math.max(0.8, r * 0.17); for (const k of [0.4, 0.28]) { ctx.beginPath(); ctx.arc(cx, cy, r * k, 0, TAU); ctx.stroke(); }
  ctx.strokeStyle = thread; ctx.lineWidth = Math.max(0.6, r * 0.09); for (const k of [0.4, 0.28]) { ctx.beginPath(); ctx.arc(cx, cy, r * k, Math.PI * 1.0, Math.PI * 1.75); ctx.stroke(); }
  ctx.fillStyle = rgba(col, 0.92); ctx.beginPath(); ctx.arc(cx, cy, r * 0.14, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(cx - r * 0.3, cy - r * 0.34, Math.max(0.5, r * 0.09), 0, TAU); ctx.fill();
}
export function bandhaniSkin(ctx, S, d, o = {}) {
  const { kind, col, x, y, s, key } = d, fill = isFilled(kind), lw = lineWidthOf(kind, s), thread = o.thread ?? '#6a4424', undyed = d.pen && col.toLowerCase() === CREAM;
  if (kind === 'dot') { // one big bound point
    ctx.save(); const R = s * 0.34; if (!d.pen) { ctx.fillStyle = rgba(col, 0.9); ctx.beginPath(); ctx.arc(x, y, R * 1.18, 0, TAU); ctx.fill(); } boundPoint(ctx, x, y, R, col, thread, key); ctx.restore(); return;
  }
  if (!fill) { // a line of bound points along the path (a ring is twelve points)
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(col, 0.55); ctx.lineWidth = lw * 1.5; ctx.stroke(); ctx.restore();
    if (kind === 'ring') { const R = s * 0.32, n = 12; for (let k = 0; k < n; k++) { const an = (k / n) * TAU; boundPoint(ctx, x + Math.cos(an) * R, y + Math.sin(an) * R, s * 0.085, col, thread, key + k); } return; }
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.setLineDash([0.01, s * 0.2]); ctx.lineCap = 'round'; ctx.strokeStyle = CREAM; ctx.lineWidth = Math.max(2.4, s * 0.12); ctx.stroke(); ctx.strokeStyle = shade(thread, -0.1); ctx.lineWidth = Math.max(1, s * 0.04); ctx.stroke(); ctx.restore(); return;
  }
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(30,0,10,0.35)'; ctx.lineWidth = s * 0.07; ctx.save(); ctx.translate(s * 0.015, s * 0.03); ctx.stroke(); ctx.restore();
  ctx.fillStyle = col; ctx.fill(); ctx.clip();
  const g = ctx.createRadialGradient(x - s * 0.15, y - s * 0.15, 1, x, y, s * 0.8); g.addColorStop(0, 'rgba(255,255,255,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0.26)'); ctx.fillStyle = g; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  const n = o.n ?? 3, p = s / n, h = s / 2;
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) boundPoint(ctx, x - h + (i + (j % 2) * 0.5) * p, y - h + (j + 0.12) * p * 0.94, p * 0.3 * (0.92 + hash(key, i, j) * 0.16), col, thread, key + i * 5 + j);
  ctx.restore(); ctx.save(); motifPath(ctx, kind, x, y, s); ctx.strokeStyle = rgba(shade(col, -0.5), 0.7); ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke(); ctx.restore(); void undyed;
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// BOBBIN LACE: a pricking card pinned to a raised striped pillow, brass pins at the nodes, plaits joining the medallions, bobbins crossing below
// ---------------------------------------------------------------------------------------------------------------------------------------------------
const IVORY = '#efe3c0';
const pin = (ctx, x, y, r, head) => { // a brass pin seen from above: cast shadow, a glass or gold head with a glint
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(x + r * 0.5, y + r * 0.8, r * 1.0, r * 0.62, 0.3, 0, TAU); ctx.fill();
  ball(ctx, x, y, r, head, false); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(x - r * 0.32, y - r * 0.36, Math.max(0.5, r * 0.26), 0, TAU); ctx.fill();
};
const cordLine = (ctx, col, w) => { // the current path as a lit cord
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = w + 2; ctx.save(); ctx.translate(0.8, 1.4); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = shade(col, -0.5); ctx.lineWidth = w; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w * 0.74; ctx.stroke();
  ctx.strokeStyle = rgba(shade(col, 0.6), 0.75); ctx.lineWidth = Math.max(0.7, w * 0.2); ctx.save(); ctx.translate(-w * 0.1, -w * 0.18); ctx.stroke(); ctx.restore();
};
export function lacePillow(ctx, S) {
  const r = S.rect, c = S.cell, t = c * 1.0, tb = c * 1.05, R = { x: r.x - t, y: r.y - t * 0.85, w: r.w + 2 * t, h: r.h + t * 0.85 + tb }, rad = t * 1.05;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = c * 1.4; ctx.shadowOffsetX = c * 0.2; ctx.shadowOffsetY = c * 0.6;
  ctx.fillStyle = '#5a1828'; roundRectPath(ctx, R.x, R.y, R.w, R.h, rad); ctx.fill(); ctx.restore();
  ctx.save(); roundRectPath(ctx, R.x, R.y, R.w, R.h, rad); ctx.clip();
  const st = Math.max(4, c * 0.42); // satin stripes, each its own little cylinder of light
  for (let x = R.x, i = 0; x < R.x + R.w; x += st, i++) { const g = ctx.createLinearGradient(x, 0, x + st, 0), a = i % 2 ? '#a8384c' : '#e4d2a4'; g.addColorStop(0, shade(a, -0.22)); g.addColorStop(0.35, shade(a, 0.15)); g.addColorStop(1, shade(a, -0.3)); ctx.fillStyle = g; ctx.fillRect(x, R.y, st + 0.5, R.h); }
  const v = ctx.createLinearGradient(0, R.y, 0, R.y + R.h); v.addColorStop(0, 'rgba(255,240,230,0.42)'); v.addColorStop(0.18, 'rgba(255,240,230,0.1)'); v.addColorStop(0.55, 'rgba(0,0,0,0.05)'); v.addColorStop(1, 'rgba(10,0,6,0.62)'); ctx.fillStyle = v; ctx.fillRect(R.x, R.y, R.w, R.h);
  const h = ctx.createLinearGradient(R.x, 0, R.x + R.w, 0); h.addColorStop(0, 'rgba(10,0,6,0.5)'); h.addColorStop(0.12, 'rgba(10,0,6,0)'); h.addColorStop(0.88, 'rgba(10,0,6,0)'); h.addColorStop(1, 'rgba(10,0,6,0.55)'); ctx.fillStyle = h; ctx.fillRect(R.x, R.y, R.w, R.h);
  ctx.strokeStyle = 'rgba(255,230,200,0.5)'; ctx.lineWidth = Math.max(1.2, c * 0.05); ctx.setLineDash([c * 0.14, c * 0.1]); roundRectPath(ctx, R.x + c * 0.18, R.y + c * 0.18, R.w - c * 0.36, R.h - c * 0.36, rad * 0.8); ctx.stroke(); ctx.setLineDash([]); // piping stitch
  ctx.restore();
  // the card: a slab of blue card with a thick lit edge, pinned at the corners
  const e = Math.max(3, c * 0.12);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = c * 0.5; ctx.shadowOffsetX = c * 0.1; ctx.shadowOffsetY = c * 0.25; ctx.fillStyle = shade(S.bg, -0.1); ctx.fillRect(r.x - e, r.y - e, r.w + 2 * e, r.h + 2 * e); ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(r.x - e, r.y - e, r.w + 2 * e, Math.max(1, e * 0.4)); ctx.fillRect(r.x - e, r.y - e, Math.max(1, e * 0.4), r.h + 2 * e);
}
export function laceGround(ctx, S) {
  const r = S.rect, c = S.cell, p = Math.max(3, c / 3.4);
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, shade(S.bg, 0.12)); g.addColorStop(1, shade(S.bg, -0.14)); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  // faint net ground (the réseau the maker works) and the pricked holes
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  ctx.strokeStyle = 'rgba(190,210,255,0.1)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = -r.h; k < r.w; k += p * 2) { ctx.moveTo(r.x + k, r.y); ctx.lineTo(r.x + k + r.h, r.y + r.h); ctx.moveTo(r.x + k + r.h, r.y); ctx.lineTo(r.x + k, r.y + r.h); } ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,10,0.5)'; ctx.beginPath(); for (let y = r.y + p, j = 0; y < r.y + r.h; y += p * 2, j++) for (let x = r.x + p + (j % 2) * p; x < r.x + r.w; x += p * 2) { ctx.moveTo(x + 1.2, y); ctx.arc(x, y, 1.2, 0, TAU); } ctx.fill();
  ctx.fillStyle = 'rgba(210,225,255,0.3)'; ctx.beginPath(); for (let y = r.y + p, j = 0; y < r.y + r.h; y += p * 2, j++) for (let x = r.x + p + (j % 2) * p; x < r.x + r.w; x += p * 2) { ctx.moveTo(x + 0.7 + 0.8, y + 0.8); ctx.arc(x + 0.8, y + 0.8, 0.7, 0, TAU); } ctx.fill();
  ctx.restore();
  if (!S.lite) laceJoins(ctx, S);
}
// plaits (twisted pairs) with picots join neighbouring medallions; a pin sits where plaits meet
function laceJoins(ctx, S) {
  if (S.polar || !S.cells) return;
  const c = S.cell, w = Math.max(2.4, c * 0.12), cols = S.cols, rows = S.rows;
  const at = (q, r) => S.cells[r * cols + q];
  const plait = (A, B, col, seed) => {
    const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, per = w * 1.9, N = Math.max(8, Math.round(L / (per * 0.25))), amp = w * 0.5;
    for (const sd of [1, -1]) {
      ctx.beginPath(); for (let k = 0; k <= N; k++) { const t = k / N, o = Math.sin((t * L / per) * TAU) * amp * sd; ctx[k ? 'lineTo' : 'moveTo'](A.x + dx * t + nx * o, A.y + dy * t + ny * o); }
      cordLine(ctx, sd > 0 ? col : shade(col, -0.12), w * 0.62);
    }
    // picots: little loops on alternate sides
    const np = Math.max(1, Math.floor(L / (c * 0.5))); ctx.lineWidth = w * 0.3; for (let k = 0; k < np; k++) { const t = (k + 0.5) / np, sd = (k + seed) % 2 ? 1 : -1, px = A.x + dx * t + nx * w * 0.95 * sd, py = A.y + dy * t + ny * w * 0.95 * sd; ctx.beginPath(); ctx.arc(px + nx * w * 0.55 * sd, py + ny * w * 0.55 * sd, w * 0.5, 0, TAU); ctx.strokeStyle = rgba(shade(col, -0.45), 0.9); ctx.lineWidth = w * 0.34; ctx.stroke(); ctx.strokeStyle = shade(col, 0.1); ctx.lineWidth = w * 0.18; ctx.stroke(); }
  };
  const col = (q0, r0, q1, r1) => mix(mix(S.colors[at(q0, r0).c] ?? IVORY, S.colors[at(q1, r1).c] ?? IVORY, 0.5), IVORY, 0.55);
  const fil = (q, r) => q >= 0 && r >= 0 && q < cols && r < rows && at(q, r).m !== -1;
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
    if (!fil(q, r)) continue;
    if (fil(q + 1, r)) plait(centreOf(S, q, r), centreOf(S, q + 1, r), col(q, r, q + 1, r), q + r);
    if (fil(q, r + 1)) plait(centreOf(S, q, r), centreOf(S, q, r + 1), col(q, r, q, r + 1), q * 3 + r);
    if (fil(q + 1, r + 1) && !fil(q + 1, r) && !fil(q, r + 1)) plait(centreOf(S, q, r), centreOf(S, q + 1, r + 1), col(q, r, q + 1, r + 1), q + r);
    if (fil(q - 1, r + 1) && !fil(q - 1, r) && !fil(q, r + 1)) plait(centreOf(S, q, r), centreOf(S, q - 1, r + 1), col(q, r, q - 1, r + 1), q + r + 1);
  }
}
export function laceOver(ctx, S) {
  const r = S.rect, c = S.cell;
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,238,200,0.22)'); g.addColorStop(0.35, 'rgba(255,238,200,0)'); g.addColorStop(1, 'rgba(0,0,12,0.3)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  const lamp = ctx.createRadialGradient(r.x + r.w * 0.7, r.y + r.h * 0.08, 0, r.x + r.w * 0.7, r.y + r.h * 0.08, r.w * 0.8); lamp.addColorStop(0, 'rgba(255,220,160,0.16)'); lamp.addColorStop(1, 'rgba(255,220,160,0)'); ctx.fillStyle = lamp; ctx.fillRect(r.x, r.y, r.w, r.h);
  void c;
}
// the frame hook: brass pins at the card corners and along its edge, and bobbins in crossing pairs hanging from the lower edge with their threads
export function laceFrame(ctx, S) {
  if (S.lite) return;
  const r = S.rect, c = S.cell, pr = Math.max(2.2, c * 0.09);
  for (const [x, y] of [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]]) pin(ctx, x, y, pr * 1.4, '#e8c46a');
  const n = Math.max(6, Math.round(r.w / (c * 0.9))); for (let k = 1; k < n; k++) { const x = r.x + (r.w * k) / n; pin(ctx, x, r.y + r.h, pr, k % 2 ? '#d9534f' : '#e8e8e8'); }
  if (S.card) return;
  const pairs = Math.max(3, Math.round(r.w / (c * 1.9))), step = r.w / pairs, len = c * 1.35, y0 = r.y + r.h;
  const cols = ['#c99a5a', '#a97a3e'];
  for (let k = 0; k < pairs; k++) {
    const xc = r.x + step * (k + 0.5), items = [[-1, 0], [1, 1]];
    // threads first (they run from the pin row to each bobbin head and cross between the pair)
    for (const [sd] of items) { const hx = xc + sd * c * 0.18, hy = y0 + c * 0.42; ctx.beginPath(); ctx.moveTo(xc - sd * step * 0.18, y0); ctx.quadraticCurveTo((xc - sd * step * 0.18 + hx) / 2 + sd * c * 0.1, y0 + c * 0.24, hx, hy); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = Math.max(1.6, c * 0.05) + 1; ctx.save(); ctx.translate(0.7, 1.2); ctx.stroke(); ctx.restore(); ctx.strokeStyle = '#f4efe2'; ctx.lineWidth = Math.max(1.1, c * 0.05); ctx.stroke(); }
    for (const [sd, ci] of items) { // a bobbin leaning across its partner: turned wood, a neck, spangle beads
      const hx = xc + sd * c * 0.18, hy = y0 + c * 0.42, ang = Math.PI / 2 + sd * 0.5, ex = hx + Math.cos(ang) * len, ey = hy + Math.sin(ang) * len, wd = Math.max(3.4, c * 0.24);
      ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.ellipse((hx + ex) / 2 + c * 0.12, (hy + ey) / 2 + c * 0.12, len * 0.52, wd * 0.5, ang, 0, TAU); ctx.fill();
      rod(ctx, hx, hy, hx + Math.cos(ang) * len * 0.3, hy + Math.sin(ang) * len * 0.3, wd * 0.45, shade(cols[ci], -0.1));
      rod(ctx, hx + Math.cos(ang) * len * 0.3, hy + Math.sin(ang) * len * 0.3, ex, ey, wd, cols[ci]);
      ball(ctx, ex, ey, wd * 0.5, shade(cols[ci], 0.1), false);
      const bx = hx + Math.cos(ang) * len * 0.62, by = hy + Math.sin(ang) * len * 0.62, px = -Math.sin(ang), py = Math.cos(ang);
      for (let j = -2; j <= 2; j++) ball(ctx, bx + px * j * wd * 0.42, by + py * j * wd * 0.42, wd * 0.2, ['#e8d8a0', S.colors[1] ?? '#d9c9a2', '#f4f0e0'][Math.abs(j) % 3], false);
    }
  }
}
// the knot motif (art.js has no outline for it): two interlaced cord rings with a pin through the middle
export function laceKnot(ctx, S, d) {
  const { x, y, s, col } = d, R = s * 0.25, off = s * 0.14, w = Math.max(2.4, s * 0.1), ang = Math.acos(off / R);
  const ring = (cx, a0, a1) => { ctx.beginPath(); ctx.arc(cx, y, R, a0, a1); cordLine(ctx, col, w); };
  ring(x - off, 0, TAU); ring(x + off, 0, TAU);
  ring(x - off, -ang - 0.55, -ang + 0.55); // left ring over at the top crossing
  ring(x + off, Math.PI - ang - 0.55, Math.PI - ang + 0.55); // right ring over at the bottom crossing
  ctx.beginPath(); ctx.moveTo(x, y - R * 0.95); ctx.lineTo(x + R * 0.0, y + R * 0.95); ctx.strokeStyle = rgba(shade(col, -0.55), 0.0); ctx.stroke();
  pin(ctx, x, y, Math.max(1.8, s * 0.06), '#e8c46a');
}
export function laceSkin(ctx, S, d, SKIN) {
  if (d.kind === 'knot') { laceKnot(ctx, S, d); return; }
  SKIN.lace(ctx, d, { n: 7 });
  if (d.kind !== 'solid' && !S.lite) { const r = Math.max(1.8, d.s * 0.055); pin(ctx, d.x, d.y, r, '#e8c46a'); }
}

// Painting helpers shared by the 1.10.0 string stages (zithers, harps, tube zithers, bows, fiddles, band). Plain canvas 2D, no state.
// Conventions: `path` is a function that (re)builds the outline on ctx (ctx.beginPath ... closePath) so it can be filled, clipped and stroked.
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU } from './art.js';

export const woodGrad = (ctx, x0, x1, c) => hgrad(ctx, x0, x1, [[0, darker(c, 0.5)], [0.22, lighter(c, 0.2)], [0.5, c], [0.82, darker(c, 0.3)], [1, darker(c, 0.62)]]);

// soft cast shadow of an outline, offset down-right
export function shadow(ctx, path, dx = 7, dy = 10, a = 0.38) {
  ctx.save(); ctx.translate(dx, dy); path(); ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.fill(); ctx.restore();
}

// a wooden body: lit gradient across x, long grain, top/bottom shading, and a bevel (pale inner edge, dark outer edge)
// b = { x0, y0, x1, y1 } is the outline's bounding box
export function wood(ctx, path, b, base, o = {}) {
  const { seed = 11, n = 14, vert = true, bevel = 'rgba(255,228,170,0.55)', edge = null, shade = 0.34, hl = 0.22, grainA = 0.34 } = o;
  const w = b.x1 - b.x0, h = b.y1 - b.y0;
  path(); ctx.fillStyle = vert ? hgrad(ctx, b.x0, b.x1, [[0, darker(base, 0.5)], [0.2, lighter(base, hl)], [0.5, base], [0.82, darker(base, 0.28)], [1, darker(base, 0.62)]])
    : vgrad(ctx, b.y0, b.y1, [[0, darker(base, 0.5)], [0.2, lighter(base, hl)], [0.5, base], [0.82, darker(base, 0.28)], [1, darker(base, 0.62)]]);
  ctx.fill();
  ctx.save(); path(); ctx.clip();
  grain(ctx, b.x0, b.y0, w, h, darker(base, 0.72), grainA, seed, vert, n);
  ctx.fillStyle = vert ? vgrad(ctx, b.y0, b.y1, [[0, `rgba(0,0,0,${shade})`], [0.18, 'rgba(0,0,0,0)'], [0.82, 'rgba(0,0,0,0.04)'], [1, `rgba(0,0,0,${shade})`]])
    : hgrad(ctx, b.x0, b.x1, [[0, `rgba(0,0,0,${shade})`], [0.18, 'rgba(0,0,0,0)'], [0.82, 'rgba(0,0,0,0.04)'], [1, `rgba(0,0,0,${shade})`]]);
  ctx.fillRect(b.x0 - 4, b.y0 - 4, w + 8, h + 8);
  if (bevel) { ctx.strokeStyle = bevel; ctx.lineWidth = Math.max(5, Math.min(w, h) * 0.022); path(); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = edge ?? darker(base, 0.7); ctx.lineWidth = 3; path(); ctx.stroke();
}

// a stretched skin (parchment / hide) with fibre marks and an inner shadow
export function skin(ctx, path, b, o = {}) {
  const { c0 = '#c9b085', c1 = '#f6ecd0', c2 = '#e6d3a4', c3 = '#b99e6c', seed = 5, vein = 0.16 } = o;
  const w = b.x1 - b.x0, h = b.y1 - b.y0;
  path(); ctx.fillStyle = hgrad(ctx, b.x0, b.x1, [[0, c0], [0.35, c1], [0.68, c2], [1, c3]]); ctx.fill();
  ctx.save(); path(); ctx.clip();
  ctx.strokeStyle = `rgba(120,90,50,${vein})`; ctx.lineWidth = 1;
  for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.arc(b.x0 + w * (0.2 + hash(seed + k) * 0.6), b.y0 + h * (0.15 + 0.1 * k), w * (0.1 + 0.06 * k), hash(seed + k + 3) * 6, hash(seed + k + 3) * 6 + 2.2); ctx.stroke(); }
  ctx.fillStyle = vgrad(ctx, b.y0, b.y1, [[0, 'rgba(60,35,10,0.26)'], [0.3, 'rgba(0,0,0,0)'], [0.7, 'rgba(0,0,0,0)'], [1, 'rgba(60,35,10,0.22)']]); ctx.fillRect(b.x0, b.y0, w, h);
  ctx.restore();
}

// python skin: a diamond-scale mosaic with a dull sheen
export function pythonSkin(ctx, path, b, o = {}) {
  const { base = '#cdb98a', mark = '#4a3a22', s = 15 } = o;
  const w = b.x1 - b.x0, h = b.y1 - b.y0;
  path(); ctx.fillStyle = hgrad(ctx, b.x0, b.x1, [[0, darker(base, 0.25)], [0.4, lighter(base, 0.2)], [0.75, base], [1, darker(base, 0.35)]]); ctx.fill();
  ctx.save(); path(); ctx.clip();
  for (let r = 0; r * s * 0.8 < h + s; r++) for (let c = -1; c * s < w + s; c++) {
    const cx = b.x0 + c * s + (r % 2) * s * 0.5, cy = b.y0 + r * s * 0.8, k = hash(r * 31 + c + 4);
    ctx.fillStyle = rgba(mark, 0.1 + 0.2 * k);
    ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.46); ctx.lineTo(cx + s * 0.46, cy); ctx.lineTo(cx, cy + s * 0.46); ctx.lineTo(cx - s * 0.46, cy); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(mark, 0.32); ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.fillStyle = vgrad(ctx, b.y0, b.y1, [[0, 'rgba(30,18,6,0.4)'], [0.25, 'rgba(0,0,0,0)'], [0.75, 'rgba(0,0,0,0)'], [1, 'rgba(30,18,6,0.4)']]); ctx.fillRect(b.x0, b.y0, w, h);
  ctx.restore();
}

// a tuning pin seen from above: dark well, bright head with a highlight
export function pin(ctx, v, u, r, col = '#d9d4c4', dark = '#1a1208') {
  ctx.fillStyle = 'rgba(0,0,0,0.42)'; circ(ctx, v + 1.5, u + 2.5, r * 1.15); ctx.fill();
  ctx.fillStyle = dark; circ(ctx, v, u, r * 1.1); ctx.fill();
  ctx.fillStyle = rgrad(ctx, v, u, 0, r, [[0, lighter(col, 0.7)], [0.55, col], [1, darker(col, 0.5)]], v - r * 0.3, u - r * 0.35); circ(ctx, v, u, r); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(v - r * 0.55, u + r * 0.1); ctx.lineTo(v + r * 0.55, u - r * 0.1); ctx.stroke();
}

// a long tuning peg with a handle, seen from above, pointing along angle a
export function peg(ctx, v, u, len, wd, col, a = 0) {
  ctx.save(); ctx.translate(v, u); ctx.rotate(a);
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; rrect(ctx, -len / 2 + 2, -wd / 2 + 3, len, wd, wd / 2); ctx.fill();
  ctx.fillStyle = vgrad(ctx, -wd / 2, wd / 2, [[0, lighter(col, 0.5)], [0.5, col], [1, darker(col, 0.55)]]); rrect(ctx, -len / 2, -wd / 2, len, wd, wd / 2); ctx.fill();
  ctx.fillStyle = vgrad(ctx, -wd * 0.9, wd * 0.9, [[0, lighter(col, 0.55)], [0.5, col], [1, darker(col, 0.5)]]); rrect(ctx, len / 2 - wd * 0.9, -wd * 0.95, wd * 1.5, wd * 1.9, wd * 0.5); ctx.fill();
  ctx.restore();
}

// a small bridge: a bar (or wedge) standing across strings
export function bridgeBar(ctx, v, u, w, h, col = '#e8d3a0', a = 0) {
  ctx.save(); ctx.translate(v, u); ctx.rotate(a);
  ctx.fillStyle = 'rgba(0,0,0,0.42)'; rrect(ctx, -w / 2 + 2, -h / 2 + 3, w, h, h * 0.4); ctx.fill();
  ctx.fillStyle = vgrad(ctx, -h / 2, h / 2, [[0, lighter(col, 0.55)], [0.5, col], [1, darker(col, 0.45)]]); rrect(ctx, -w / 2, -h / 2, w, h, h * 0.4); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; rrect(ctx, -w / 2 + h * 0.3, -h / 2 + 1, w - h * 0.6, 1.6, 1); ctx.fill();
  ctx.restore();
}

// a carved rosette: stacked rings and radial cuts around a dark hole
export function rosette(ctx, cx, cy, r, o = {}) {
  const { ring = '#ead7a4', mid = '#3a2210', spokes = 10, hole = '#0c0603', cut = 'rgba(232,211,160,0.9)' } = o;
  circ(ctx, cx, cy, r * 1.5); ctx.fillStyle = ring; ctx.fill();
  circ(ctx, cx, cy, r * 1.22); ctx.fillStyle = mid; ctx.fill();
  ctx.fillStyle = rgrad(ctx, cx, cy, 0, r, [[0, '#000'], [0.75, hole], [1, '#2a180a']]); circ(ctx, cx, cy, r); ctx.fill();
  ctx.strokeStyle = cut; ctx.lineWidth = Math.max(1.4, r * 0.1);
  for (let k = 0; k < spokes; k++) { const a = (k / spokes) * TAU; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r * 1.58, cy + Math.sin(a) * r * 1.58); ctx.lineTo(cx + Math.cos(a) * r * 1.98, cy + Math.sin(a) * r * 1.98); ctx.stroke(); }
}

// a dotted or dashed inlay line following an outline
export function inlay(ctx, path, col, w = 3, dash = null, alpha = 0.85) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.lineWidth = w; if (dash) ctx.setLineDash(dash); path(); ctx.stroke(); ctx.restore();
}

// a row of studs (tacks) along a straight or elliptical rim
export function studs(ctx, pts, r, col = '#8c6a34') {
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; for (const [x, y] of pts) { circ(ctx, x + 1, y + 1.5, r); ctx.fill(); }
  ctx.fillStyle = col; for (const [x, y] of pts) { circ(ctx, x, y, r); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,240,200,0.6)'; for (const [x, y] of pts) { circ(ctx, x - r * 0.3, y - r * 0.3, r * 0.4); ctx.fill(); }
}

// a hanging silk tassel with a head bead; sway in radians
export function tassel(ctx, x, y, len, col, sway = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(sway);
  ctx.strokeStyle = darker(col, 0.4); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, len * 0.3); ctx.stroke();
  ctx.fillStyle = lighter(col, 0.35); circ(ctx, 0, len * 0.3, len * 0.1); ctx.fill();
  for (let k = -3; k <= 3; k++) {
    ctx.strokeStyle = rgba(k % 2 ? col : lighter(col, 0.3), 0.95); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(k * 0.7, len * 0.36); ctx.quadraticCurveTo(k * 3.2, len * 0.7, k * 4.4, len); ctx.stroke();
  }
  ctx.restore();
}

// a knot of cord (wrapped bundle)
export function wrap(ctx, v, u, w, h, col, turns = 5, a = 0) {
  ctx.save(); ctx.translate(v, u); ctx.rotate(a);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, -w / 2 + 2, -h / 2 + 3, w, h, 3); ctx.fill();
  ctx.fillStyle = vgrad(ctx, -h / 2, h / 2, [[0, lighter(col, 0.35)], [1, darker(col, 0.35)]]); rrect(ctx, -w / 2, -h / 2, w, h, 3); ctx.fill();
  ctx.strokeStyle = darker(col, 0.55); ctx.lineWidth = 1.2;
  for (let k = 1; k < turns; k++) { const x = -w / 2 + (w * k) / turns; ctx.beginPath(); ctx.moveTo(x, -h / 2); ctx.lineTo(x + 2, h / 2); ctx.stroke(); }
  ctx.restore();
}

// polished metal sheet gradient for jaw-harp frames and tuning pins
export const metalGrad = (ctx, x0, x1, c = '#cfd3da') => hgrad(ctx, x0, x1, [[0, darker(c, 0.55)], [0.2, lighter(c, 0.55)], [0.42, c], [0.6, darker(c, 0.35)], [0.82, lighter(c, 0.35)], [1, darker(c, 0.6)]]);

// bamboo: a vertical tube segment with nodes; x0..x1 across, y0..y1 along
export function bamboo(ctx, x0, y0, x1, y1, o = {}) {
  const { base = '#c9a24e', nodes = [], seed = 3 } = o;
  const w = x1 - x0, h = y1 - y0;
  ctx.fillStyle = 'rgba(0,0,0,0.36)'; rrect(ctx, x0 + 7, y0 + 9, w, h, w * 0.18); ctx.fill();
  ctx.fillStyle = hgrad(ctx, x0, x1, [[0, darker(base, 0.55)], [0.14, base], [0.34, lighter(base, 0.5)], [0.5, lighter(base, 0.2)], [0.74, darker(base, 0.18)], [1, darker(base, 0.62)]]);
  rrect(ctx, x0, y0, w, h, w * 0.16); ctx.fill();
  ctx.save(); rrect(ctx, x0, y0, w, h, w * 0.16); ctx.clip();
  grain(ctx, x0, y0, w, h, darker(base, 0.65), 0.3, seed, true, 12);
  // fine fibre speckle
  for (let k = 0; k < 60; k++) { ctx.fillStyle = rgba(darker(base, 0.6), 0.1 + 0.2 * hash(seed + k)); ctx.fillRect(x0 + hash(seed + k * 3) * w, y0 + hash(seed + k * 7) * h, 1.4, 4 + hash(k) * 8); }
  for (const nu of nodes) {
    ctx.fillStyle = vgrad(ctx, nu - 11, nu + 11, [[0, 'rgba(60,40,10,0)'], [0.4, 'rgba(60,40,10,0.55)'], [0.55, lighter(base, 0.25)], [1, 'rgba(60,40,10,0)']]); ctx.fillRect(x0 - 2, nu - 11, w + 4, 22);
    ctx.strokeStyle = 'rgba(40,24,6,0.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, nu); ctx.lineTo(x1, nu); ctx.stroke();
  }
  // roundness: dark falling-off at both edges, a soft specular stripe, and slightly different tones between the nodes
  ctx.fillStyle = hgrad(ctx, x0, x1, [[0, 'rgba(0,0,0,0.5)'], [0.16, 'rgba(0,0,0,0.0)'], [0.34, 'rgba(255,250,220,0.22)'], [0.4, 'rgba(255,250,220,0.0)'], [0.82, 'rgba(0,0,0,0.0)'], [1, 'rgba(0,0,0,0.55)']]); ctx.fillRect(x0, y0, w, h);
  const ns = [y0, ...nodes, y1];
  for (let k = 0; k < ns.length - 1; k++) { ctx.fillStyle = k % 2 ? 'rgba(90,60,10,0.07)' : 'rgba(255,240,170,0.06)'; ctx.fillRect(x0, ns[k], w, ns[k + 1] - ns[k]); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,240,190,0.35)'; ctx.lineWidth = 2; rrect(ctx, x0 + 1, y0 + 1, w - 2, h - 2, w * 0.16); ctx.stroke();
}

export { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU };

// Craft-material extras (1.9.0): richer cell skins and tools for white-on-white embroidery (chikankari), plaited straw (toquilla) and
// pen-drawn cloth (kalamkari). Added to the shared SKIN / TOOLS / POT tables at import time under new names, so every older scene and
// every game spec keeps working. Pure canvas: no DOM, no Math.random, no Date. `d.age` (seconds since a cell landed, undefined when the
// board is not animating) drives the stitching / plaiting / drawing animation; undefined means finished.
import { rod, ball, poly, shade, mix, rgba, hash, roundRectPath, motifPath, isFilled, lineWidthOf, sheenLine, TAU, SKIN, POT, lum } from './scene-kit.js';
import { TOOLS } from './scene-tools.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const soft = (ctx, x, y, rx, ry, a = 0.3) => { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); };
const press = (T) => Math.max(0, 1 - T.a / 0.45);
const bx = (b) => ({ cx: b.x + b.w / 2, cy: b.y + b.h / 2, r: Math.min(b.w, b.h) / 2 });
function back(ctx, b, c, a = 0.5) { ctx.save(); roundRectPath(ctx, b.x, b.y, b.w, b.h, 12); ctx.fillStyle = rgba(c, a); ctx.fill(); ctx.restore(); }
function ring(ctx, S, b, on) {
  ctx.save(); ctx.strokeStyle = on ? S.pal.accent : 'rgba(255,255,255,0.28)'; ctx.lineWidth = on ? 4 : 1.5; roundRectPath(ctx, b.x, b.y, b.w, b.h, 12); ctx.stroke();
  if (on) { ctx.fillStyle = S.pal.accent; ctx.beginPath(); ctx.arc(b.x + b.w - 7, b.y + 7, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x + b.w - 9.5, b.y + 7); ctx.lineTo(b.x + b.w - 7.2, b.y + 9.2); ctx.lineTo(b.x + b.w - 4.6, b.y + 4.8); ctx.stroke(); }
  ctx.restore();
}

// A pie-shaped wipe around the cell centre: the work appears as the needle (or pen) sweeps round it, clockwise from the top.
// Returns the head angle (radians) so a tool could follow it; progress 1 means no clip at all.
export const sweepClip = (ctx, x, y, s, prog) => {
  if (prog >= 1) return;
  const a0 = -Math.PI / 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, s * 1.2, a0, a0 + Math.max(0.0001, prog) * TAU); ctx.closePath(); ctx.clip();
};
// Runs a skin so that it appears as the needle sweeps round the cell (age undefined: drawn complete).
export const stitched = (ctx, d, fn, dur = 0.85) => { const prog = d.age == null ? 1 : clamp(d.age / dur, 0, 1); if (prog >= 1) { fn(); return; } ctx.save(); sweepClip(ctx, d.x, d.y, d.s, prog); fn(); ctx.restore(); };
export const headAngle = (T, dur = 0.85) => -Math.PI / 2 + clamp(T.a / dur, 0, 1) * TAU;

// ---- chikankari: raised white thread with a cast shadow, translucent shadow work ------------------------------------------------------
// A cord of thread laid along the current path: soft cast shadow (three widths, falling away), dark underside, body, twist ticks, highlight.
const cord = (ctx, col, w, o = {}) => {
  const sh = o.shadow ?? '#2a2012', dx = w * 0.45, dy = w * 0.9;
  ctx.save(); ctx.lineCap = o.cap ?? 'round'; ctx.lineJoin = 'round';
  for (const [k, a] of [[3.6, 0.09], [2.4, 0.16], [1.5, 0.28]]) { ctx.strokeStyle = rgba(sh, a * (o.k ?? 1)); ctx.lineWidth = w * k; ctx.save(); ctx.translate(dx, dy); ctx.stroke(); ctx.restore(); }
  ctx.strokeStyle = shade(col, -0.42); ctx.lineWidth = w * 1.08; ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = w * 0.82; ctx.stroke();
  const dash = ctx.getLineDash();
  ctx.setLineDash([w * 0.35, w * 0.55]); ctx.strokeStyle = rgba(shade(col, -0.3), 0.35); ctx.lineWidth = w * 0.82; ctx.stroke(); ctx.setLineDash(dash);
  ctx.strokeStyle = rgba('#fff', 0.85); ctx.lineWidth = Math.max(0.8, w * 0.24); ctx.save(); ctx.translate(-w * 0.16, -w * 0.24); ctx.stroke(); ctx.restore();
  ctx.restore();
};
Object.assign(SKIN, {
  chikan(ctx, d, o = {}) {
    const { kind, col, x, y, s, key } = d, fill = isFilled(kind), lw = lineWidthOf(kind, s), h = s / 2, sh = o.shadow ?? '#4a3e2a';
    const prog = d.age == null ? 1 : clamp(d.age / 0.85, 0, 1);
    ctx.save(); sweepClip(ctx, x, y, s, prog);
    if (!fill) { // a line motif: raised thread, laid in back-stitches (tiny gaps, each stitch its own cord)
      motifPath(ctx, kind, x, y, s); { const w = Math.max(1.8, lw * 0.78); ctx.setLineDash([w * 1.9, w * 0.55]); cord(ctx, col, w, { shadow: sh, cap: 'butt' }); }
      ctx.restore(); return;
    }
    // shadow work: the stitching on the back shows through the muslin as a soft milky shape. A halo that falls away, a pale body, the
    // herringbone threads as faint criss-cross lines, then the raised back-stitched outline on top.
    const body = mix(col, '#fff6e4', 0.35), pw = Math.max(1, s * 0.02);
    motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round';
    for (const [k, a] of [[0.2, 0.05], [0.13, 0.08], [0.075, 0.12]]) { ctx.strokeStyle = rgba(sh, a); ctx.lineWidth = s * k; ctx.stroke(); }
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.clip();
    const g = ctx.createRadialGradient(x - s * 0.1, y - s * 0.12, s * 0.04, x, y, s * 0.6); g.addColorStop(0, rgba(body, 0.62)); g.addColorStop(0.75, rgba(body, 0.4)); g.addColorStop(1, rgba(mix(body, sh, 0.5), 0.5)); ctx.fillStyle = g; ctx.fillRect(x - h - 2, y - h - 2, s + 4, s + 4);
    motifPath(ctx, kind, x, y, s); ctx.strokeStyle = rgba(sh, 0.2); ctx.lineWidth = s * 0.2; ctx.stroke();
    const p = s * 0.085; ctx.lineCap = 'round';
    ctx.strokeStyle = rgba(sh, 0.26); ctx.lineWidth = pw * 1.3; ctx.beginPath();
    for (let k = -8; k <= 8; k++) { const o1 = k * p; ctx.moveTo(x - h + o1, y - h); ctx.lineTo(x + h + o1, y + h); ctx.moveTo(x - h + o1, y + h); ctx.lineTo(x + h + o1, y - h); } ctx.stroke();
    ctx.strokeStyle = rgba('#fffaf0', 0.75); ctx.lineWidth = pw; ctx.save(); ctx.translate(-pw * 0.7, -pw * 0.9); ctx.stroke(); ctx.restore();
    const inner = ctx.createLinearGradient(x - h, y - h, x + h, y + h); inner.addColorStop(0, 'rgba(255,255,255,0.28)'); inner.addColorStop(0.5, 'rgba(255,255,255,0)'); inner.addColorStop(1, rgba(sh, 0.28)); ctx.fillStyle = inner; ctx.fillRect(x - h - 2, y - h - 2, s + 4, s + 4);
    ctx.restore();
    motifPath(ctx, kind, x, y, s); { const w = Math.max(1.7, s * 0.05); ctx.setLineDash([w * 1.9, w * 0.5]); cord(ctx, mix(col, '#ffffff', 0.3), w, { shadow: sh, k: 0.9, cap: 'butt' }); }
    ctx.restore(); void key;
  },
});

// A long needle with an eye and a thread: it stitches round the motif just placed (the tip follows the sweep head), dipping through the
// cloth every few degrees with the thread pulled taut, and a short stitched tail lies on the cloth behind it.
Object.assign(TOOLS, {
  chikanneedle(ctx, S, T) {
    const u = T.u, A = T.a, working = A < 0.9, r = u * 0.34;
    let tx = T.x, ty = T.y, dip = 0;
    if (working) { const th = headAngle(T, 0.85); tx += Math.cos(th) * r; ty += Math.sin(th) * r; dip = 0.5 - 0.5 * Math.cos(A * TAU * 4.2); }
    const a = 0.62, len = u * 4.6, depth = dip * u * 0.42;
    const ex = tx + Math.sin(a) * (len - depth), ey = ty - Math.cos(a) * (len - depth);       // top end of the needle
    const eyx = tx + Math.sin(a) * (len * 0.92 - depth), eyy = ty - Math.cos(a) * (len * 0.92 - depth);
    // the thread: from the eye, up and over, down to a loose hank lying off to the right; pulled straight on every dip
    const slack = (1 - dip * 0.8);
    const hx = eyx + u * 2.7, hy = eyy + u * 3.4;
    const thread = (w, c, al = 1) => { ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(c, al); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(eyx, eyy); ctx.bezierCurveTo(eyx + u * 0.7, eyy - u * 0.9 * slack, hx - u * 1.3, hy - u * 2.4 * slack, hx, hy); ctx.stroke(); ctx.restore(); };
    thread(Math.max(3, u * 0.12), '#000', 0.18);
    thread(Math.max(1.8, u * 0.075), shade(T.col, -0.35)); thread(Math.max(1.3, u * 0.055), T.col); thread(Math.max(0.8, u * 0.018), '#fff', 0.8);
    // a tail of thread lying on the cloth from the puncture back round the motif
    if (working) { ctx.save(); ctx.lineCap = 'round'; const th0 = headAngle(T, 0.85); const pts = [0.4, 0.3, 0.2, 0.1].map((q) => [T.x + Math.cos(th0 - q * 2.2) * r, T.y + Math.sin(th0 - q * 2.2) * r]); ctx.strokeStyle = rgba(shade(T.col, -0.4), 0.9); ctx.lineWidth = Math.max(1.8, u * 0.09); ctx.beginPath(); ctx.moveTo(tx, ty); pts.forEach(([px, py]) => ctx.lineTo(px, py)); ctx.stroke(); ctx.strokeStyle = T.col; ctx.lineWidth = Math.max(1.2, u * 0.055); ctx.stroke(); ctx.restore(); }
    // shadow and the steel shaft with a bright edge, a slim eye, a point
    soft(ctx, tx + u * 0.25, ty + u * 0.12, u * 0.7, u * 0.1, 0.22);
    ctx.save(); ctx.lineCap = 'round';
    const gr = ctx.createLinearGradient(tx, ty, ex, ey); gr.addColorStop(0, '#7e8894'); gr.addColorStop(0.4, '#f4f8fc'); gr.addColorStop(1, '#8a949f');
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = Math.max(3.2, u * 0.11); ctx.beginPath(); ctx.moveTo(tx + 2, ty + 3); ctx.lineTo(ex + 3, ey + 4); ctx.stroke();
    ctx.strokeStyle = gr; ctx.lineWidth = Math.max(2.2, u * 0.085); ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = Math.max(0.8, u * 0.025); ctx.beginPath(); ctx.moveTo(tx - 0.8, ty - 0.8); ctx.lineTo(ex - 0.8, ey - 0.8); ctx.stroke();
    ctx.save(); ctx.translate(eyx, eyy); ctx.rotate(a); ctx.strokeStyle = '#2a2f36'; ctx.lineWidth = Math.max(1.2, u * 0.035); ctx.beginPath(); ctx.ellipse(0, 0, u * 0.03, u * 0.13, 0, 0, TAU); ctx.stroke(); ctx.restore();
    ctx.restore();
    if (T.thimble) { ctx.save(); ctx.translate(ex + Math.sin(a) * u * 0.25, ey - Math.cos(a) * u * 0.25); ctx.rotate(a); ctx.fillStyle = '#c9a050'; ctx.beginPath(); ctx.ellipse(0, 0, u * 0.2, u * 0.34, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,240,180,0.5)'; ctx.fillRect(-u * 0.12, -u * 0.25, u * 0.05, u * 0.4); ctx.fillStyle = 'rgba(60,40,10,0.4)'; for (let k = 0; k < 5; k++) ctx.fillRect(-u * 0.1 + (k % 2) * u * 0.12, -u * 0.2 + k * u * 0.09, 1.4, 1.4); ctx.restore(); }
    if (dip > 0.7) { ctx.fillStyle = 'rgba(30,20,8,0.5)'; ctx.beginPath(); ctx.arc(tx, ty, Math.max(1.5, u * 0.06), 0, TAU); ctx.fill(); }
  },
});
// a hank of chikan thread: a twisted figure-eight skein of floss (several plies per loop), a paper band round the twist
POT.chikanhank = (ctx, S, b, col, on) => {
  const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#2a2418', 0.55);
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(cx + 2, cy + r * 0.62 + lift, r * 0.85, r * 0.16, 0, 0, TAU); ctx.fill();
  ctx.save(); ctx.translate(cx, cy + lift); ctx.lineCap = 'round';
  for (const sgn of [-1, 1]) {
    for (let k = 0; k < 6; k++) {
      const o = (k - 2.5) * r * 0.04, tint = (hash(k + 3, sgn + 5) - 0.5) * 0.2, c = shade(col, tint);
      ctx.beginPath(); ctx.moveTo(sgn * r * 0.06, -r * 0.12 + o); ctx.bezierCurveTo(sgn * r * 0.5, -r * 0.62 + o, sgn * r * 0.95, -r * 0.4 + o, sgn * r * 0.9, o); ctx.bezierCurveTo(sgn * r * 0.95, r * 0.4 + o, sgn * r * 0.5, r * 0.62 + o, sgn * r * 0.06, r * 0.12 + o);
      ctx.strokeStyle = shade(c, -0.4); ctx.lineWidth = r * 0.11; ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = r * 0.075; ctx.stroke(); ctx.strokeStyle = rgba('#fff', 0.45); ctx.lineWidth = r * 0.02; ctx.save(); ctx.translate(-r * 0.015, -r * 0.02); ctx.stroke(); ctx.restore();
    }
  }
  ctx.strokeStyle = shade(col, -0.35); ctx.lineWidth = r * 0.07; ctx.beginPath(); ctx.moveTo(-r * 0.1, -r * 0.14); ctx.lineTo(r * 0.1, r * 0.14); ctx.moveTo(r * 0.1, -r * 0.14); ctx.lineTo(-r * 0.1, r * 0.14); ctx.stroke();
  ctx.fillStyle = '#efe4c6'; roundRectPath(ctx, -r * 0.16, -r * 0.34, r * 0.32, r * 0.68, 3); ctx.fill(); ctx.strokeStyle = 'rgba(80,60,30,0.5)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = shade(col, -0.2); ctx.fillRect(-r * 0.16, -r * 0.06, r * 0.32, r * 0.12);
  ctx.restore();
  ring(ctx, S, b, on);
};

// ---- toquilla: plaited straw ------------------------------------------------------------------------------------------------------------
// A plait is a field of small quads, each a strand running either with the crown's radius ("radial", up in a cell's local frame) or round
// it, alternately over and under: the quad whose parity is even shows the radial strand on top, the odd one the round strand on top.
// Quads are batched per (parity, tint) so a whole disc is a few dozen fills.
const quadPass = (ctx, quads, fill, line, lineA) => {
  ctx.beginPath(); for (const q of quads) { ctx.moveTo(q[0], q[1]); ctx.lineTo(q[2], q[3]); ctx.lineTo(q[4], q[5]); ctx.lineTo(q[6], q[7]); ctx.closePath(); } ctx.fillStyle = fill; ctx.fill();
  if (line) { ctx.beginPath(); for (const q of quads) { ctx.moveTo(q[8], q[9]); ctx.lineTo(q[10], q[11]); } ctx.strokeStyle = rgba(line, lineA); ctx.lineWidth = q0w(quads); ctx.stroke(); }
};
const q0w = (quads) => quads.lw ?? 1;
const TINTS = [-0.07, 0.0, 0.07];
// the full plaited disc (ground of the hat): rounds of strands, count growing with the radius
export function plaitDisc(ctx, cx, cy, r0, r1, base, pitch, lite) {
  ctx.fillStyle = shade(base, -0.6); ctx.beginPath(); ctx.arc(cx, cy, r1, 0, TAU); ctx.fill();
  const bands = Math.max(1, Math.floor((r1 - r0) / pitch)), gap = Math.max(0.5, pitch * 0.07), buckets = [[], [], [], [], [], []];
  const edges = [], tw = pitch * 0.5;   // radial strands are half as wide as a round is deep: thin splints, worked in pairs
  for (let k = 0; k < bands; k++) {
    const ra = r0 + k * pitch + gap * 0.5, rb = r0 + (k + 1) * pitch - gap * 0.5, rm = (ra + rb) / 2, m = Math.max(8, Math.round((TAU * rm) / tw / 8) * 8);
    for (let j = 0; j < m; j++) {
      const par = (((j >> 1) + k) & 1);   // pairs of radial splints on top, then a round strand on top across the pair
      if (par === 1 && (j & 1)) continue;
      const jj = par === 1 ? 2 : 1, a0 = -Math.PI / 2 + (j / m) * TAU, a1 = -Math.PI / 2 + ((j + jj) / m) * TAU, da = (a1 - a0) * (par === 1 ? 0.03 : 0.1), b0 = a0 + da, b1 = a1 - da;
      const q = [cx + Math.cos(b0) * ra, cy + Math.sin(b0) * ra, cx + Math.cos(b0) * rb, cy + Math.sin(b0) * rb, cx + Math.cos(b1) * rb, cy + Math.sin(b1) * rb, cx + Math.cos(b1) * ra, cy + Math.sin(b1) * ra];
      if (par === 0) { const am = (b0 + b1) / 2; q.push(cx + Math.cos(am) * (ra + (rb - ra) * 0.1), cy + Math.sin(am) * (ra + (rb - ra) * 0.1), cx + Math.cos(am) * (rb - (rb - ra) * 0.1), cy + Math.sin(am) * (rb - (rb - ra) * 0.1)); }
      else { q.push(cx + Math.cos(b0 + (b1 - b0) * 0.08) * rm, cy + Math.sin(b0 + (b1 - b0) * 0.08) * rm, cx + Math.cos(b1 - (b1 - b0) * 0.08) * rm, cy + Math.sin(b1 - (b1 - b0) * 0.08) * rm); }
      buckets[par * 3 + Math.floor(hash(k, j, 5) * 3) % 3].push(q);
      if (par === 0) edges.push(q[6], q[7], q[0], q[1]); else edges.push(q[0], q[1], q[2], q[3]);
    }
  }
  const lw = Math.max(0.7, pitch * 0.13);
  for (let par = 0; par < 2; par++) for (let t = 0; t < 3; t++) { const arr = buckets[par * 3 + t]; arr.lw = lw; quadPass(ctx, arr, shade(base, TINTS[t] + (par === 0 ? 0.1 : -0.04)), shade(base, 0.55), par === 0 ? 0.55 : 0.4); }
  if (!lite) { ctx.beginPath(); for (let i = 0; i < edges.length; i += 4) { ctx.moveTo(edges[i], edges[i + 1]); ctx.lineTo(edges[i + 2], edges[i + 3]); } ctx.strokeStyle = 'rgba(30,18,4,0.34)'; ctx.lineWidth = Math.max(0.8, pitch * 0.16); ctx.stroke(); }
}
Object.assign(SKIN, {
  // plaited straw cell: radial and round strands over and under inside the stamp, dyed to the stamp colour (up = outward in a polar cell)
  plait(ctx, d, o = {}) {
    const { kind, col, x, y, s, key } = d, fill = isFilled(kind), lw = lineWidthOf(kind, s), h = s / 2, n = o.n ?? 6, p = s / n;
    const prog = d.age == null ? 1 : clamp(d.age / 0.5, 0, 1);
    ctx.save();
    if (prog < 1) { ctx.beginPath(); ctx.rect(x - s, y + h - prog * s * 1.1, s * 2, s * 1.2); ctx.clip(); }   // the plait grows outward, from the inner edge
    if (!fill) { // a single dyed splint laid round the shape: a braided cord
      motifPath(ctx, kind, x, y, s); ctx.lineCap = 'butt'; ctx.lineJoin = 'round'; const w = Math.max(2, lw * 0.9);
      ctx.strokeStyle = 'rgba(30,18,4,0.38)'; ctx.lineWidth = w + 1.6; ctx.save(); ctx.translate(0.8, 1.4); ctx.stroke(); ctx.restore();
      ctx.strokeStyle = shade(col, -0.4); ctx.lineWidth = w; ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = w * 0.8; ctx.setLineDash([w * 0.55, w * 0.38]); ctx.stroke();
      ctx.strokeStyle = rgba(shade(col, 0.6), 0.7); ctx.lineWidth = w * 0.22; ctx.setLineDash([w * 0.3, w * 0.63]); ctx.stroke(); ctx.restore(); return;
    }
    motifPath(ctx, kind, x, y, s); ctx.strokeStyle = 'rgba(30,18,4,0.35)'; ctx.lineWidth = s * 0.07; ctx.save(); ctx.translate(s * 0.02, s * 0.035); ctx.stroke(); ctx.restore();
    ctx.fillStyle = shade(col, -0.42); ctx.fill(); ctx.save(); ctx.clip();
    const buckets = [[], [], [], [], [], []], gapw = p * 0.07, nx = n * 2, px = s / nx, edges = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < nx; i++) {
      const par = (((i >> 1) + j) & 1); if (par === 1 && (i & 1)) continue;
      const w = par === 1 ? 2 : 1, x0 = x - h + i * px + (par === 1 ? gapw * 0.2 : gapw * 0.6), x1 = x - h + (i + w) * px - (par === 1 ? gapw * 0.2 : gapw * 0.6), y0 = y - h + j * p + gapw, y1 = y - h + (j + 1) * p - gapw;
      const q = [x0, y0, x1, y0, x1, y1, x0, y1];
      if (par === 0) q.push((x0 + x1) / 2, y0 + (y1 - y0) * 0.1, (x0 + x1) / 2, y1 - (y1 - y0) * 0.1); else q.push(x0 + (x1 - x0) * 0.08, (y0 + y1) / 2, x1 - (x1 - x0) * 0.08, (y0 + y1) / 2);
      buckets[par * 3 + Math.floor(hash(key, i, j) * 3) % 3].push(q);
      if (par === 0) edges.push(x1, y0, x1, y1); else edges.push(x0, y1, x1, y1);
    }
    for (let par = 0; par < 2; par++) for (let t = 0; t < 3; t++) { const arr = buckets[par * 3 + t]; arr.lw = Math.max(0.7, p * 0.1); quadPass(ctx, arr, shade(col, TINTS[t] + (par === 0 ? 0.1 : -0.04)), shade(col, 0.55), par === 0 ? 0.6 : 0.4); }
    ctx.beginPath(); for (let i = 0; i < edges.length; i += 4) { ctx.moveTo(edges[i], edges[i + 1]); ctx.lineTo(edges[i + 2], edges[i + 3]); } ctx.strokeStyle = 'rgba(30,18,4,0.3)'; ctx.lineWidth = Math.max(0.8, p * 0.14); ctx.stroke();
    const gl = ctx.createLinearGradient(x - h, y - h, x + h, y + h); gl.addColorStop(0, 'rgba(255,255,235,0.26)'); gl.addColorStop(0.55, 'rgba(255,255,235,0)'); gl.addColorStop(1, 'rgba(20,10,0,0.14)'); ctx.fillStyle = gl; ctx.fillRect(x - h, y - h, s, s);
    ctx.restore();
    motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(shade(col, -0.55), 0.85); ctx.lineWidth = Math.max(1, s * 0.035); ctx.stroke();
    ctx.restore();
  },
});
// a hank of straw: a bundle of long splints gathered by a tie, the free ends fanning out
POT.strawhank = (ctx, S, b, col, on) => {
  const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#3a2c14', 0.5);
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.ellipse(cx + 2, cy + r * 0.72 + lift, r * 0.8, r * 0.15, 0, 0, TAU); ctx.fill();
  ctx.save(); ctx.lineCap = 'round';
  for (let k = -5; k <= 5; k++) {
    const f = k / 5, tint = (hash(k + 9, 3) - 0.5) * 0.22, c = shade(col, tint), x0 = cx + f * r * 0.1, x1 = cx + f * r * 0.62;
    ctx.beginPath(); ctx.moveTo(x0, cy - r * 0.62 + lift); ctx.bezierCurveTo(x0 + f * r * 0.1, cy - r * 0.1 + lift, x1 - f * r * 0.2, cy + r * 0.3 + lift, x1, cy + r * 0.72 + lift);
    ctx.strokeStyle = shade(c, -0.4); ctx.lineWidth = r * 0.17; ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = r * 0.12; ctx.stroke(); ctx.strokeStyle = rgba(shade(c, 0.6), 0.6); ctx.lineWidth = r * 0.03; ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = '#7a5a32'; roundRectPath(ctx, cx - r * 0.26, cy - r * 0.5 + lift, r * 0.52, r * 0.2, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(cx - r * 0.24, cy - r * 0.49 + lift, r * 0.48, r * 0.04);
  ring(ctx, S, b, on);
};


// ---- kalamkari: pen-drawn outlines, dye poured in bath order ------------------------------------------------------------------------------
// Fine ink details inside a motif, so a leaf has veins, a blossom a seed head, a bird an eye and a wing, whatever the colour.
const inkDetails = (ctx, kind, x, y, s, ink, w) => {
  const h = s / 2, P = (px, py) => [x + px * h, y + py * h];
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineWidth = Math.max(1, w * 0.62); ctx.beginPath();
  if (kind === 'leaf') { ctx.moveTo(...P(-0.74, 0.46)); ctx.quadraticCurveTo(...P(0.0, 0.0), ...P(0.7, -0.52)); for (const t of [0.25, 0.5, 0.75]) { const px = -0.74 + 1.44 * t, py = 0.46 - 0.98 * t; ctx.moveTo(...P(px, py)); ctx.lineTo(...P(px + 0.1, py - 0.3)); ctx.moveTo(...P(px, py)); ctx.lineTo(...P(px + 0.28, py + 0.06)); } ctx.stroke(); }
  else if (kind === 'flower') { for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3 - Math.PI / 2; ctx.moveTo(...P(Math.cos(a) * 0.3, Math.sin(a) * 0.3)); ctx.lineTo(...P(Math.cos(a) * 0.72, Math.sin(a) * 0.72)); } ctx.stroke(); for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3; ctx.beginPath(); ctx.arc(...P(Math.cos(a) * 0.1, Math.sin(a) * 0.1), Math.max(0.8, w * 0.35), 0, TAU); ctx.fill(); } }
  else if (kind === 'bird') { ctx.beginPath(); ctx.arc(...P(0.4, -0.42), Math.max(1.2, w * 0.55), 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(...P(0.2, -0.05)); ctx.quadraticCurveTo(...P(-0.15, 0.05), ...P(-0.45, 0.45)); ctx.moveTo(...P(0.18, 0.1)); ctx.quadraticCurveTo(...P(-0.1, 0.2), ...P(-0.32, 0.55)); ctx.moveTo(...P(-0.55, 0.5)); ctx.lineTo(...P(-0.78, 0.78)); ctx.moveTo(...P(-0.48, 0.45)); ctx.lineTo(...P(-0.64, 0.7)); ctx.stroke(); }
  else if (kind === 'arch') { ctx.arc(...P(0, -0.1), h * 0.34 * 1.0, Math.PI, 0); ctx.moveTo(...P(-0.34, -0.1)); ctx.lineTo(...P(-0.34, 0.62)); ctx.moveTo(...P(0.34, -0.1)); ctx.lineTo(...P(0.34, 0.62)); ctx.stroke(); }
  else if (kind === 'diamond' || kind === 'star') { ctx.moveTo(...P(0, -0.42)); ctx.lineTo(...P(0.42, 0)); ctx.lineTo(...P(0, 0.42)); ctx.lineTo(...P(-0.42, 0)); ctx.closePath(); ctx.stroke(); }
  ctx.restore();
};
const PEN_LEN = { flower: 7.2, bird: 4.6, vine: 5.4, leaf: 3.6, spiral: 4.4, wave: 3.2, ring: 2.2, dot: 1.7, arch: 3.4, diamond: 3.2, star: 5.2 };
Object.assign(SKIN, {
  // kalamkari: a bamboo-pen outline in iron-black mordant (drawn stroke by stroke), then dye soaking into the cotton inside it
  penwork(ctx, d, o = {}) {
    const { kind, col, x, y, s, key } = d, fill = isFilled(kind), lw = lineWidthOf(kind, s), ink = o.line ?? '#241810', iw = Math.max(1.5, s * (o.lw ?? 0.05));
    const age = d.age == null ? 9 : d.age, penOnly = d.pen === true;
    const stroke = (full, a) => { // the outline, revealed along its length as the pen travels
      ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (!full) { const L = s * (PEN_LEN[kind] ?? 4); ctx.setLineDash([Math.max(0.01, a * L), L * 3]); }
      ctx.strokeStyle = rgba(ink, 0.22); ctx.lineWidth = iw * 2.4; ctx.stroke();            // mordant bleeding into the weave
      ctx.strokeStyle = ink; ctx.lineWidth = iw; ctx.stroke();
      ctx.strokeStyle = rgba('#7a5a3a', 0.4); ctx.lineWidth = Math.max(0.6, iw * 0.2); ctx.save(); ctx.translate(-iw * 0.2, -iw * 0.25); ctx.stroke(); ctx.restore();
      ctx.restore();
    };
    if (penOnly || !d.dye && d.dye !== undefined) { // pen only: outline (line motifs are the pen line itself)
      const pa = clamp(age / 0.9, 0, 1);
      if (!fill) { ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; const L = s * (PEN_LEN[kind] ?? 4); if (pa < 1) ctx.setLineDash([Math.max(0.01, pa * L), L * 3]); ctx.strokeStyle = rgba(ink, 0.22); ctx.lineWidth = lw * 1.5; ctx.stroke(); ctx.strokeStyle = ink; ctx.lineWidth = Math.max(iw, lw * 0.62); ctx.stroke(); ctx.restore(); }
      else { stroke(pa >= 1, pa); if (pa >= 0.95) inkDetails(ctx, kind, x, y, s, ink, iw); }
      return;
    }
    // dyed (or a plain stamp when the process is off): outline in full, dye spreading from the middle, pooled at the edge
    const prog = clamp(age / 0.7, 0, 1);
    if (!fill) { // a coloured line with black edges
      ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = rgba(ink, 0.2); ctx.lineWidth = lw * 1.9; ctx.stroke(); ctx.strokeStyle = ink; ctx.lineWidth = lw * 1.12; ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = lw * 0.72 * prog; ctx.stroke(); ctx.strokeStyle = rgba(shade(col, 0.5), 0.5); ctx.lineWidth = Math.max(0.8, lw * 0.18 * prog); ctx.save(); ctx.translate(-lw * 0.14, -lw * 0.18); ctx.stroke(); ctx.restore(); ctx.restore(); return;
    }
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.strokeStyle = rgba(col, 0.16); ctx.lineWidth = s * 0.14; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.clip();
    if (prog < 1) { ctx.beginPath(); ctx.arc(x, y, s * 0.12 + prog * s * 0.95, 0, TAU); ctx.clip(); }
    ctx.fillStyle = shade(col, -0.12); ctx.fillRect(x - s, y - s, s * 2, s * 2);
    for (let k = 0; k < 4; k++) { const px = x + (hash(key, k) - 0.5) * s * 0.9, py = y + (hash(key, k + 7) - 0.5) * s * 0.9, R = s * (0.3 + hash(key, k + 3) * 0.3), g = ctx.createRadialGradient(px, py, 0, px, py, R); g.addColorStop(0, rgba(shade(col, hash(key, k + 11) > 0.5 ? 0.22 : -0.22), 0.5)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(px - R, py - R, R * 2, R * 2); }
    motifPath(ctx, kind, x, y, s); ctx.strokeStyle = rgba(shade(col, -0.5), 0.5); ctx.lineWidth = s * 0.16; ctx.stroke();   // dye pools against the mordant line
    ctx.strokeStyle = rgba('#fff', 0.1); ctx.lineWidth = 1; ctx.beginPath(); const p = Math.max(2, s * 0.07); for (let k = -10; k <= 10; k++) { ctx.moveTo(x - s, y + k * p); ctx.lineTo(x + s, y + k * p); ctx.moveTo(x + k * p, y - s); ctx.lineTo(x + k * p, y + s); } ctx.stroke();
    ctx.restore();
    stroke(true, 1); inkDetails(ctx, kind, x, y, s, rgba(ink, 0.85), iw);
    ctx.restore();
  },
});
// The kalamkari tools: a bamboo pen with a wad of cloth holding the mordant (it travels round the motif as the outline is drawn, an ink bead
// at the tip) and a dye brush with a bound fibre tip (it dabs and swirls). Chosen by the selected colour: T.pen / T.dye.
Object.assign(TOOLS, {
  kalampen(ctx, S, T) {
    const u = T.u, A = T.a, work = A < 0.9, r = u * 0.3, a = 0.55;
    let tx = T.x, ty = T.y;
    const brush = T.dye === true;
    if (work) { if (brush) { const w = A * 14; tx += Math.cos(w) * r * 0.5; ty += Math.sin(w) * r * 0.35; } else { const th = headAngle(T, 0.9); tx += Math.cos(th) * r; ty += Math.sin(th) * r; } }
    const dip = work ? 0.5 - 0.5 * Math.cos(A * TAU * 2) : 0;
    soft(ctx, tx + u * 0.35, ty + u * 0.1, u * 0.55, u * 0.09, 0.26);
    ctx.save(); ctx.translate(tx, ty + (brush ? dip * u * 0.05 : 0)); ctx.rotate(a);
    const len = u * 4.3;
    const g = ctx.createLinearGradient(-u * 0.12, 0, u * 0.12, 0); g.addColorStop(0, '#dcc17a'); g.addColorStop(0.5, '#b99a52'); g.addColorStop(1, '#6e5424');
    ctx.fillStyle = g; ctx.fillRect(-u * 0.1, -len, u * 0.2, len - u * 0.35);
    ctx.fillStyle = 'rgba(70,45,10,0.55)'; for (const f of [0.35, 0.68]) ctx.fillRect(-u * 0.11, -len * f, u * 0.22, Math.max(1, u * 0.03));
    if (brush) { ctx.fillStyle = '#6a5030'; ctx.fillRect(-u * 0.13, -u * 1.0, u * 0.26, u * 0.4); ctx.fillStyle = T.col; ctx.beginPath(); ctx.moveTo(-u * 0.2, -u * 0.62); ctx.quadraticCurveTo(-u * 0.26, -u * 0.2, 0, 0); ctx.quadraticCurveTo(u * 0.26, -u * 0.2, u * 0.2, -u * 0.62); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-u * 0.1, -u * 0.55, u * 0.05, u * 0.4); }
    else { ctx.fillStyle = '#ebdfc6'; ctx.beginPath(); ctx.moveTo(-u * 0.2, -u * 1.0); ctx.lineTo(u * 0.2, -u * 1.0); ctx.lineTo(u * 0.1, -u * 0.28); ctx.lineTo(-u * 0.1, -u * 0.28); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#8a4a2a'; ctx.lineWidth = Math.max(1.2, u * 0.05); for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-u * 0.19, -u * (0.9 - k * 0.15)); ctx.lineTo(u * 0.19, -u * (0.82 - k * 0.15)); ctx.stroke(); }
      ctx.fillStyle = '#241810'; ctx.beginPath(); ctx.moveTo(-u * 0.1, -u * 0.28); ctx.lineTo(u * 0.1, -u * 0.28); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    if (!brush && (work || T.a < 1.4)) { ctx.fillStyle = '#241810'; ctx.beginPath(); ctx.arc(tx, ty, Math.max(1.5, u * 0.07), 0, TAU); ctx.fill(); }
  },
});


// ---- knitted yarn (lace knitting): plump V stitches, batched per layer, growing row by row as they are placed ---------------------------------
Object.assign(SKIN, {
  knitv(ctx, d, o = {}) {
    const { kind, col, x, y, s, key } = d, fill = isFilled(kind), h = s / 2, n = o.n ?? 6, p = s / n, lw0 = lineWidthOf(kind, s);
    const prog = d.age == null ? 1 : clamp(d.age / 0.8, 0, 1);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (!fill) { // a plied yarn: dark core, the colour, ply twist ticks, fuzz
      motifPath(ctx, kind, x, y, s); if (prog < 1) { ctx.setLineDash([Math.max(0.01, prog * s * 4), s * 8]); }
      ctx.strokeStyle = 'rgba(0,0,0,0.32)'; ctx.lineWidth = lw0 * 1.1 + 1.5; ctx.save(); ctx.translate(0.8, 1.4); ctx.stroke(); ctx.restore();
      ctx.strokeStyle = shade(col, -0.4); ctx.lineWidth = lw0 * 0.95; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw0 * 0.72; ctx.stroke();
      if (prog >= 1) { ctx.setLineDash([lw0 * 0.3, lw0 * 0.55]); ctx.strokeStyle = rgba(shade(col, -0.35), 0.5); ctx.lineWidth = lw0 * 0.72; ctx.stroke(); ctx.setLineDash([lw0 * 0.18, lw0 * 0.7]); ctx.strokeStyle = rgba('#fff', 0.55); ctx.lineWidth = Math.max(0.8, lw0 * 0.18); ctx.save(); ctx.translate(-lw0 * 0.12, -lw0 * 0.18); ctx.stroke(); ctx.restore(); }
      ctx.restore(); return;
    }
    motifPath(ctx, kind, x, y, s); ctx.fillStyle = shade(col, -0.62); ctx.fill(); ctx.save(); ctx.clip();
    const rows = Math.round(n * 1.25), pr = s / rows, drawn = Math.max(0, Math.min(rows, Math.ceil(prog * rows + 0.001)));
    const L = [], R = [];
    for (let j = 0; j < rows; j++) { if (rows - 1 - j >= drawn) continue; const cy = y + h - (j + 0.5) * pr, off = (j % 2) * p * 0.25;   // rows grow from the bottom up
      for (let i = -1; i <= n; i++) { const cx = x - h + (i + 0.5) * p + off, q = p * 0.5, tint = hash(key, i, j); L.push([cx - q * 0.92, cy - pr * 0.78, cx - q * 0.06, cy + pr * 0.74, tint]); R.push([cx + q * 0.92, cy - pr * 0.78, cx + q * 0.06, cy + pr * 0.74, tint]); } }
    const all = L.concat(R), lobe = (dx, dy, style, w, filter) => { ctx.beginPath(); for (const l of all) { if (filter && !filter(l)) continue; ctx.moveTo(l[0] + dx, l[1] + dy); ctx.lineTo(l[2] + dx, l[3] + dy); } ctx.strokeStyle = style; ctx.lineWidth = w; ctx.stroke(); };
    lobe(p * 0.06, p * 0.12, 'rgba(0,0,0,0.38)', p * 0.62);
    lobe(0, 0, shade(col, -0.42), p * 0.58);
    lobe(0, 0, shade(col, -0.12), p * 0.46, (l) => l[4] < 0.5); lobe(0, 0, shade(col, 0.04), p * 0.46, (l) => l[4] >= 0.5);
    lobe(-p * 0.07, -p * 0.07, rgba(shade(col, 0.6), 0.75), p * 0.12);
    ctx.beginPath(); for (const l of all) { const a = hash(key, l[0] | 0, l[1] | 0) * TAU, mx = (l[0] + l[2]) / 2, my = (l[1] + l[3]) / 2; ctx.moveTo(mx, my); ctx.lineTo(mx + Math.cos(a) * p * 0.28, my + Math.sin(a) * p * 0.28); } ctx.strokeStyle = rgba(shade(col, 0.4), 0.35); ctx.lineWidth = Math.max(0.6, p * 0.035); ctx.stroke();
    ctx.restore();
    motifPath(ctx, kind, x, y, s); ctx.strokeStyle = rgba(shade(col, -0.55), 0.7); ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke();
    ctx.restore();
  },
});

void lum; void ball; void rod; void poly; void sheenLine; void hash;

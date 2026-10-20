// Shared painting for the idiophone stages of 1.19.0 (shaken rattles, scrapers, strands of shells and bells). Plain canvas 2D, local coordinates,
// no state, no clock. Everything is lit from the upper left like the drum stages (drum-kit.js `dropShadow`).
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU, glow } from './drum-kit.js';

export { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU, glow };
export const lerp = (a, b, t) => a + (b - a) * t;

// the strongest flash among the lanes whose zone key is in `keys`
export const zoneFlash = (K, keyOf, rt, ...keys) => { let m = 0; for (let i = 0; i < K.N; i++) if (keys.includes(keyOf[i])) m = Math.max(m, rt.flash[i] ?? 0, (rt.hold?.[i] ?? 0) * 0.5); return m; };

// a lit rounded solid: fill `path` (a function that builds the path) with a radial light from the upper left, dark rim, optional
// texture speckle and a hard glint. o: { dark, light, spec (0..1), speck (0..1), seed, rimA }
export function solid(ctx, path, cx, cy, rx, ry, base, o = {}) {
  const { dark = 0.62, light = 0.5, spec = 0.55, speck = 0.0, seed = 3, rimA = 0.35 } = o;
  path(ctx); ctx.fillStyle = rgrad(ctx, cx, cy, Math.min(rx, ry) * 0.1, Math.max(rx, ry) * 1.05, [[0, lighter(base, light)], [0.45, base], [1, darker(base, dark)]], cx - rx * 0.34, cy - ry * 0.4); ctx.fill();
  ctx.save(); path(ctx); ctx.clip();
  if (speck > 0) for (let k = 0; k < 70; k++) { const a = hash(seed + k) * TAU, d = Math.sqrt(hash(seed + k + 70)); ctx.fillStyle = `rgba(30,14,4,${speck * (0.1 + 0.25 * hash(k + 3))})`; ell(ctx, cx + Math.cos(a) * d * rx * 0.95, cy + Math.sin(a) * d * ry * 0.95, 1 + 2.4 * hash(k + 5), 0.8 + 1.6 * hash(k + 9)); ctx.fill(); }
  ctx.fillStyle = rgrad(ctx, cx + rx * 0.22, cy + ry * 0.3, Math.min(rx, ry) * 0.5, Math.max(rx, ry) * 1.1, [[0, 'rgba(0,0,0,0)'], [1, `rgba(0,0,0,${rimA})`]]); ctx.fillRect(cx - rx * 1.3, cy - ry * 1.3, rx * 2.6, ry * 2.6);
  if (spec > 0) { ctx.fillStyle = `rgba(255,255,244,${0.5 * spec})`; ell(ctx, cx - rx * 0.42, cy - ry * 0.46, rx * 0.12, ry * 0.26); ctx.fill(); ctx.fillStyle = `rgba(255,255,244,${0.26 * spec})`; ell(ctx, cx - rx * 0.56, cy - ry * 0.18, rx * 0.05, ry * 0.12); ctx.fill(); }
  ctx.restore();
}

// a sheet of hammered / polished metal or brass for a path: band gradient with a long highlight, `tone` is the base colour
export function metalFill(ctx, path, x0, x1, tone = '#c9ccd2', vertical = false) {
  path(ctx);
  const st = [[0, darker(tone, 0.6)], [0.14, lighter(tone, 0.6)], [0.32, tone], [0.5, lighter(tone, 0.3)], [0.72, darker(tone, 0.4)], [0.88, lighter(tone, 0.2)], [1, darker(tone, 0.65)]];
  ctx.fillStyle = vertical ? vgrad(ctx, x0, x1, st) : hgrad(ctx, x0, x1, st); ctx.fill();
}

// a spherical brass or iron bell / bead with a lit side and a drop shadow
export function ball(ctx, x, y, r, col, o = {}) {
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; circ(ctx, x + r * 0.32, y + r * 0.45, r); ctx.fill();
  ctx.fillStyle = rgrad(ctx, x, y, 0, r * 1.05, [[0, lighter(col, o.hi ?? 0.8)], [0.45, col], [1, darker(col, 0.62)]], x - r * 0.34, y - r * 0.38); circ(ctx, x, y, r); ctx.fill();
  if (o.slit) { ctx.strokeStyle = 'rgba(30,16,2,0.85)'; ctx.lineWidth = Math.max(1.2, r * 0.13); ctx.beginPath(); ctx.moveTo(x - r * 0.62, y + r * 0.34); ctx.quadraticCurveTo(x, y + r * 0.5, x + r * 0.62, y + r * 0.34); ctx.stroke(); ctx.fillStyle = 'rgba(20,10,2,0.9)'; circ(ctx, x, y + r * 0.62, r * 0.13); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,244,0.55)'; circ(ctx, x - r * 0.36, y - r * 0.4, r * 0.2); ctx.fill();
}

// a twisted cord / rope between points (quadratic with a sag), two tones, width w
export function cord(ctx, x0, y0, x1, y1, sag, w, col, o = {}) {
  const mx = (x0 + x1) / 2 + (o.sx ?? 0), my = (y0 + y1) / 2 + sag;
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.32)'; ctx.lineWidth = w + 2; ctx.beginPath(); ctx.moveTo(x0 + 2, y0 + 3); ctx.quadraticCurveTo(mx + 2, my + 3, x1 + 2, y1 + 3); ctx.stroke();
  ctx.strokeStyle = darker(col, 0.35); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x1, y1); ctx.stroke();
  ctx.strokeStyle = lighter(col, 0.3); ctx.lineWidth = Math.max(1, w * 0.4); ctx.setLineDash([w * 1.2, w * 1.0]); ctx.beginPath(); ctx.moveTo(x0, y0 - w * 0.12); ctx.quadraticCurveTo(mx, my - w * 0.12, x1, y1 - w * 0.12); ctx.stroke();
  ctx.restore();
}
export const quad = (t, a, b, c) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;

// a few seed grains flying out of a shaken thing: o { n, r, col }
export function grains(ctx, cx, cy, spread, f, t, o = {}) {
  if (f <= 0.04) return;
  const n = o.n ?? 9, r = o.r ?? 4, col = o.col ?? '#f6e8c0';
  for (let k = 0; k < n; k++) {
    const a = hash(k * 3.1 + 1) * TAU, p = clamp((1 - f) * 1.5 + hash(k + 7) * 0.2, 0, 1), d = spread * (0.35 + 0.65 * hash(k + 11)) * (0.4 + p);
    ctx.fillStyle = rgba(col, 0.85 * f * (1 - p)); ell(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8 - 14 * p, r * (0.7 + 0.5 * hash(k + 5)), r * 0.55); ctx.fill();
  }
  void t;
}

// plaited / woven texture in a clip: crossing strands in two tones. (x,y,w,h) box, `step` strand width, angle 0 = diamond twill
export function weave(ctx, x, y, w, h, c1, c2, step = 9, o = {}) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = darker(c1, 0.45); ctx.fillRect(x, y, w, h);
  const rows = Math.ceil(h / step) + 1, cols = Math.ceil(w / step) + 1;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const on = (i + j) % 2 === 0, band = o.band ? o.band(i, j) : null, col = band ?? (on ? c1 : c2);
    const px = x + i * step, py = y + j * step, hv = hash(i * 7.3 + j * 3.1);
    ctx.fillStyle = vgrad(ctx, py, py + step, [[0, lighter(col, 0.28 + 0.1 * hv)], [0.5, col], [1, darker(col, 0.4)]]); rrect(ctx, px + 0.8, py + 0.8, step - 1.6, step - 1.6, step * 0.28); ctx.fill();
    if (on) { ctx.strokeStyle = 'rgba(40,20,4,0.28)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px + step * 0.5, py + 1.5); ctx.lineTo(px + step * 0.5, py + step - 1.5); ctx.stroke(); }
  }
  ctx.restore();
}

// painted decoration inside a clip, a band of dots / zigzag / diamonds along local x (call after clip). o: { col, col2, n }
export function paintBand(ctx, kind, x0, x1, y, h, col, col2 = null) {
  ctx.save();
  const n = Math.max(3, Math.round((x1 - x0) / (h * 0.9))), st = (x1 - x0) / n;
  for (let k = 0; k < n; k++) {
    const x = x0 + k * st;
    if (kind === 'dots') { ctx.fillStyle = k % 2 ? col : (col2 ?? col); circ(ctx, x + st / 2, y, h * 0.3); ctx.fill(); }
    else if (kind === 'zig') { ctx.strokeStyle = col; ctx.lineWidth = h * 0.22; ctx.beginPath(); ctx.moveTo(x, y + h * 0.3); ctx.lineTo(x + st / 2, y - h * 0.3); ctx.lineTo(x + st, y + h * 0.3); ctx.stroke(); }
    else if (kind === 'diamond') { ctx.fillStyle = k % 2 ? col : (col2 ?? col); ctx.beginPath(); ctx.moveTo(x + st / 2, y - h * 0.4); ctx.lineTo(x + st, y); ctx.lineTo(x + st / 2, y + h * 0.4); ctx.lineTo(x, y); ctx.closePath(); ctx.fill(); }
    else if (kind === 'tri') { ctx.fillStyle = k % 2 ? col : (col2 ?? col); ctx.beginPath(); ctx.moveTo(x, y + h * 0.4); ctx.lineTo(x + st / 2, y - h * 0.4); ctx.lineTo(x + st, y + h * 0.4); ctx.closePath(); ctx.fill(); }
  }
  ctx.restore();
}

// a wooden handle with a lit side from (x,y) of length len pointing along `ang`, width w at the grip; o { col, ring }
export function handle(ctx, x, y, ang, len, w, col = '#c89a58', o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  const path = () => { ctx.beginPath(); ctx.moveTo(0, -w * 0.42); ctx.quadraticCurveTo(len * 0.5, -w * 0.5, len, -w * 0.34); ctx.lineTo(len, w * 0.34); ctx.quadraticCurveTo(len * 0.5, w * 0.5, 0, w * 0.42); ctx.closePath(); };
  ctx.save(); ctx.translate(5, 7); path(); ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.fill(); ctx.restore();
  path(); ctx.fillStyle = vgrad(ctx, -w * 0.5, w * 0.5, [[0, lighter(col, 0.5)], [0.35, col], [0.75, darker(col, 0.4)], [1, darker(col, 0.65)]]); ctx.fill();
  ctx.save(); path(); ctx.clip(); grain(ctx, 0, -w * 0.5, len, w, darker(col, 0.7), 0.35, o.seed ?? 6, false, 8); ctx.restore();
  ctx.strokeStyle = rgba(lighter(col, 0.6), 0.4); ctx.lineWidth = 1.4; path(); ctx.stroke();
  if (o.ring) for (const q of o.ring) { ctx.fillStyle = rgba(darker(col, 0.65), 0.7); ctx.fillRect(len * q - 2.5, -w * 0.46, 5, w * 0.92); }
  ctx.restore();
}

// draws small lit seed beads that skitter inside a transparent window: used by cutaways
export function seedsIn(ctx, x, y, w, h, f, t, col = '#efe0b8') {
  for (let k = 0; k < 14; k++) { const a = t * (6 + hash(k) * 8) + k * 1.7, px = x + w * (0.1 + 0.8 * hash(k + 3)) + Math.sin(a) * w * 0.05 * f, py = y + h * (0.55 + 0.4 * hash(k + 9)) - Math.abs(Math.sin(a * 1.3)) * h * 0.35 * f; ctx.fillStyle = col; ell(ctx, px, py, 3, 2); ctx.fill(); }
}

// A scene designed standing up (x across, y down; content spans y in [0, 2*Y0]) is laid down for a wide screen with the top of it to the left:
// O(x, y) maps design points to the ref box, ES(x, y, rx, ry, o) builds an ellipse spot there (radii swapped when laid down), begin/end wrap the drawing.
export function makeOrient(tall, ref, Y0, eSpotFn) {
  const O = (x, y) => (tall ? [x, y] : [y - Y0, -x + ref.h / 2]);
  return {
    O,
    ES: (x, y, rx, ry, o) => { const [a, b] = O(x, y); return tall ? eSpotFn(a, b, rx, ry, 0, o) : eSpotFn(a, b, ry, rx, 0, o); },
    begin: (ctx) => { ctx.save(); if (!tall) { ctx.translate(-Y0, ref.h / 2); ctx.rotate(-Math.PI / 2); } },
    end: (ctx) => ctx.restore(),
  };
}

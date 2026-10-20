// Stitch and thread II, 1.13.0, part 1: shared helpers + matyo (padded satin and stem stitch) + filet (darning on knotted net).
// Pure canvas 2D, hash-only randomness, no figures, no text. Registered in scenes-t2.js.
import { hash, rgba, mix, shade, roundRectPath, rod, ball, speck, glow, vignette, TAU, motifPath, isFilled, sheenLine, POT } from './scene-kit.js';
import { TOOLS } from './scene-tools.js';
import { clothGround, edgeShade, isLand, lightShaft } from './scene-needle.js';

// ---- shared helpers of this family -----------------------------------------------------------------------------------------------------
export const bxx = (b) => ({ cx: b.x + b.w / 2, cy: b.y + b.h / 2, r: Math.min(b.w, b.h) / 2 });
export function potBack(ctx, b, c, a = 0.5) { ctx.save(); roundRectPath(ctx, b.x, b.y, b.w, b.h, 12); ctx.fillStyle = rgba(c, a); ctx.fill(); ctx.restore(); }
export function potRing(ctx, S, b, on) {
  ctx.save(); ctx.strokeStyle = on ? S.pal.accent : 'rgba(255,255,255,0.28)'; ctx.lineWidth = on ? 4 : 1.5; roundRectPath(ctx, b.x, b.y, b.w, b.h, 12); ctx.stroke();
  if (on) { ctx.fillStyle = S.pal.accent; ctx.beginPath(); ctx.arc(b.x + b.w - 7, b.y + 7, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x + b.w - 9.5, b.y + 7); ctx.lineTo(b.x + b.w - 7.2, b.y + 9); ctx.lineTo(b.x + b.w - 4.2, b.y + 4.6); ctx.stroke(); }
  ctx.restore();
}
const press = (T) => Math.max(0, 1 - T.a / 0.45);
export const softE = (ctx, x, y, rx, ry, a = 0.3) => { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); };
// a rounded-rectangle subpath (no beginPath), for evenodd rings
export function rrp(ctx, x, y, w, h, r) { const q = Math.min(r, w / 2, h / 2); ctx.moveTo(x + q, y); ctx.arcTo(x + w, y, x + w, y + h, q); ctx.arcTo(x + w, y + h, x, y + h, q); ctx.arcTo(x, y + h, x, y, q); ctx.arcTo(x, y, x + w, y, q); ctx.closePath(); }
// horizontal planks across the area: o = { h, base, alt, gap, grain, seed, wear }
export function planks(ctx, a, o = {}) {
  const X0 = a.x - 12, W = a.w + 24, h = o.h, seed = o.seed ?? 1, lite = !!o.lite;
  ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, a.h); ctx.clip();
  let j = 0;
  for (let y = a.y - h * hash(seed, 99); y < a.y + a.h; y += h, j++) {
    const base = mix(o.base, o.alt ?? o.base, hash(j, seed, 5));
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, shade(base, 0.14)); g.addColorStop(0.12, base); g.addColorStop(0.9, shade(base, -0.16)); g.addColorStop(1, shade(base, -0.4));
    ctx.fillStyle = g; ctx.fillRect(X0, y, W, h);
    if (!lite) {
      ctx.strokeStyle = rgba(o.grain ?? '#000000', 0.1); ctx.lineWidth = 1; ctx.beginPath();
      for (let k = 0; k < 7; k++) { const yy = y + h * (0.12 + 0.78 * hash(j, k, seed + 7)), ph = hash(j, k, seed + 8) * 6, am = h * 0.02 * (0.5 + hash(j, k, 3)); ctx.moveTo(X0, yy); for (let x = X0; x <= X0 + W + 24; x += 24) ctx.lineTo(x, yy + Math.sin(x * 0.011 + ph) * am); }
      ctx.stroke();
      if (o.wear) { // paint worn through to bare wood along the plank edges
        ctx.fillStyle = rgba(o.wear, 0.42); ctx.beginPath();
        for (let k = 0; k < 11; k++) { const x = X0 + hash(j, k, seed + 21) * W, top = hash(j, k, 4) > 0.5, w = h * (0.12 + hash(j, k, 6) * 0.5), hh = h * (0.025 + hash(j, k, 7) * 0.04), yy = top ? y + 0.5 : y + h - hh - 1; ctx.moveTo(x, yy + hh); ctx.quadraticCurveTo(x + w * 0.2, yy - hh * 0.4, x + w * 0.5, yy + hh * 0.3); ctx.quadraticCurveTo(x + w * 0.8, yy + hh * 1.1, x + w, yy + hh); ctx.closePath(); }
        ctx.fill();
      }
    }
    if (!lite && o.stripe) { ctx.strokeStyle = rgba(o.stripe, 0.55); ctx.lineWidth = Math.max(1.2, h * 0.025); ctx.setLineDash([h * (1.5 + hash(j, 1) * 2), h * 0.1 * (1 + hash(j, 2) * 2)]); ctx.beginPath(); ctx.moveTo(X0, y + h * 0.14); ctx.lineTo(X0 + W, y + h * 0.14); ctx.moveTo(X0, y + h * 0.84); ctx.lineTo(X0 + W, y + h * 0.84); ctx.stroke(); ctx.setLineDash([]); }
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(X0, y + h - (o.gap ?? 2), W, o.gap ?? 2);
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(X0, y + 0.5, W, 1);
  }
  ctx.restore();
}
// a rounded-square hoop of two wooden rings with a metal tightening screw. Draws OUTSIDE S.rect; returns nothing.
export function squareHoop(ctx, S, o = {}) {
  const r = S.rect, c = S.cell, t = c * (o.t ?? 0.36), wood = o.wood ?? '#c9904e', rad = c * 0.8;
  const ox = r.x - t * 1.05, oy = r.y - t * 1.05, ow = r.w + t * 2.1, oh = r.h + t * 2.1;
  // cast shadow
  ctx.save(); ctx.shadowColor = rgba('#000000', o.shadow ?? 0.55); ctx.shadowBlur = c * 0.9; ctx.shadowOffsetX = c * 0.12; ctx.shadowOffsetY = c * 0.34; ctx.fillStyle = '#000'; ctx.beginPath(); rrp(ctx, ox, oy, ow, oh, rad + t); ctx.fill(); ctx.restore();
  // outer ring body (evenodd with the inner opening)
  const g = ctx.createLinearGradient(ox, oy, ox + ow, oy + oh); g.addColorStop(0, shade(wood, 0.32)); g.addColorStop(0.45, wood); g.addColorStop(1, shade(wood, -0.42));
  ctx.beginPath(); rrp(ctx, ox, oy, ow, oh, rad + t); rrp(ctx, r.x - t * 0.05, r.y - t * 0.05, r.w + t * 0.1, r.h + t * 0.1, rad); ctx.fillStyle = g; ctx.fill('evenodd');
  if (!S.lite) {
    // wood grain following the ring
    ctx.save(); ctx.lineCap = 'butt';
    for (let k = 0; k < 4; k++) { const o2 = t * (0.15 + k * 0.22); ctx.setLineDash([c * (2 + hash(k, 3) * 4), c * (0.4 + hash(k, 4) * 1.4)]); ctx.lineDashOffset = hash(k, 5) * 100; ctx.strokeStyle = rgba(k % 2 ? '#3a1e08' : '#fff0c8', 0.16); ctx.lineWidth = Math.max(0.8, t * 0.07); ctx.beginPath(); rrp(ctx, ox + o2, oy + o2, ow - o2 * 2, oh - o2 * 2, Math.max(2, rad + t - o2)); ctx.stroke(); }
    ctx.restore();
  }
  // the inner ring: a narrower, slightly lighter lip standing proud on the inside
  ctx.beginPath(); rrp(ctx, r.x - t * 0.62, r.y - t * 0.62, r.w + t * 1.24, r.h + t * 1.24, rad + t * 0.45); rrp(ctx, r.x - t * 0.05, r.y - t * 0.05, r.w + t * 0.1, r.h + t * 0.1, rad);
  const g2 = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g2.addColorStop(0, shade(wood, 0.5)); g2.addColorStop(0.5, shade(wood, 0.12)); g2.addColorStop(1, shade(wood, -0.3)); ctx.fillStyle = g2; ctx.fill('evenodd');
  // edge lines: light on the upper left, dark seam between the rings
  ctx.lineWidth = Math.max(1, t * 0.07); ctx.strokeStyle = 'rgba(40,20,0,0.5)'; ctx.beginPath(); rrp(ctx, r.x - t * 0.62, r.y - t * 0.62, r.w + t * 1.24, r.h + t * 1.24, rad + t * 0.45); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,240,200,0.4)'; ctx.beginPath(); ctx.moveTo(ox + rad * 0.9, oy + 0.7); ctx.lineTo(ox + ow - rad * 0.9, oy + 0.7); ctx.moveTo(ox + 0.7, oy + rad * 0.9); ctx.lineTo(ox + 0.7, oy + oh - rad * 0.9); ctx.stroke();
  // tightening screw: a brass bracket across the ring, with a knurled thumb screw standing above it
  if (o.screw !== false) {
    const sx = r.x + r.w * (o.sx ?? 0.5), sy = oy, bw = t * 3.1, bh = t * 1.5, metal = o.metal ?? '#c9a24c';
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(sx - bw / 2 + t * 0.2, sy - t * 0.1, bw, bh + t * 0.35);
    const mg = ctx.createLinearGradient(sx - bw / 2, 0, sx + bw / 2, 0); mg.addColorStop(0, shade(metal, 0.6)); mg.addColorStop(0.35, metal); mg.addColorStop(1, shade(metal, -0.45));
    ctx.fillStyle = mg; roundRectPath(ctx, sx - bw / 2, sy - t * 0.35, bw, bh, t * 0.25); ctx.fill(); ctx.strokeStyle = 'rgba(30,18,0,0.55)'; ctx.lineWidth = 1; ctx.stroke();
    for (const dx of [-bw * 0.36, bw * 0.36]) { ball(ctx, sx + dx, sy + t * 0.38, t * 0.2, shade(metal, 0.2), false); }
    const kx = sx, ky = sy - t * 0.7, kr = t * 0.72; // the thumb screw knob (seen from above)
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(kx + kr * 0.2, ky + kr * 0.35, kr * 1.05, kr * 0.8, 0, 0, TAU); ctx.fill();
    ball(ctx, kx, ky, kr, shade(metal, 0.05), false);
    ctx.strokeStyle = 'rgba(40,24,0,0.5)'; ctx.lineWidth = Math.max(1, kr * 0.12); ctx.beginPath(); for (let k = 0; k < 10; k++) { const a0 = (k / 10) * TAU; ctx.moveTo(kx + Math.cos(a0) * kr * 0.55, ky + Math.sin(a0) * kr * 0.55); ctx.lineTo(kx + Math.cos(a0) * kr * 0.95, ky + Math.sin(a0) * kr * 0.95); } ctx.stroke();
    ctx.strokeStyle = 'rgba(40,24,0,0.7)'; ctx.lineWidth = Math.max(1.2, kr * 0.16); ctx.beginPath(); ctx.moveTo(kx - kr * 0.35, ky - kr * 0.1); ctx.lineTo(kx + kr * 0.35, ky + kr * 0.1); ctx.stroke();
  }
}
// soft light and shadow just inside a hoop or frame
export function innerShade(ctx, S, a = 0.4) { edgeShade(ctx, S, a); const r = S.rect, e = Math.max(5, S.cell * 0.42); let g = ctx.createLinearGradient(0, r.y + r.h, 0, r.y + r.h - e); g.addColorStop(0, `rgba(0,0,0,${a * 0.45})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y + r.h - e, r.w, e); g = ctx.createLinearGradient(r.x + r.w, 0, r.x + r.w - e, 0); g.addColorStop(0, `rgba(0,0,0,${a * 0.4})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(r.x + r.w - e, r.y, e, r.h); }
// sample a polyline into evenly spaced points with tangents
export function resample(pts, step) {
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const tot = L[L.length - 1], out = []; let j = 1;
  for (let d = 0; d <= tot + 1e-6; d += step) {
    while (j < pts.length - 1 && L[j] < d) j++;
    const f = (d - L[j - 1]) / ((L[j] - L[j - 1]) || 1), x = pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * f, y = pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * f;
    const dx = pts[j][0] - pts[j - 1][0], dy = pts[j][1] - pts[j - 1][1], l = Math.hypot(dx, dy) || 1; out.push({ x, y, tx: dx / l, ty: dy / l, d });
  }
  return { pts: out, total: tot };
}
const bez = (p0, p1, p2, p3, n) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); } return o; };
// points of the line-style motifs (the same outlines as motifPath), in the cell's own units
export function linePts(kind, x, y, s) {
  const h = s / 2, P = (px, py) => [x + px * h, y + py * h], out = [];
  switch (kind) {
    case 'ring': for (let i = 0; i <= 36; i++) { const a = (i / 36) * TAU; out.push([x + Math.cos(a) * s * 0.32, y + Math.sin(a) * s * 0.32]); } return out;
    case 'wave': for (let i = 0; i <= 24; i++) out.push([x - h * 0.85 + (i / 24) * h * 1.7, y + Math.sin((i / 24) * TAU) * h * 0.4]); return out;
    case 'zigzag': return [[-0.85, 0.35], [-0.42, -0.35], [0, 0.35], [0.42, -0.35], [0.85, 0.35]].map(([a, b]) => P(a, b));
    case 'spiral': for (let i = 0; i <= 60; i++) { const a = (i / 60) * Math.PI * 4, r = (i / 60) * h * 0.8; out.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } return out;
    case 'fret': return [[-0.8, 0.8], [-0.8, -0.8], [0.8, -0.8], [0.8, 0.3], [-0.2, 0.3], [-0.2, -0.3], [0.3, -0.3]].map(([a, b]) => P(a, b));
    case 'xstitch': return null;
    case 'vine': return [...bez(P(-0.9, 0.55), P(-0.35, 0.8), P(-0.25, 0.05), P(0.05, -0.1), 14), ...bez(P(0.05, -0.1), P(0.35, -0.25), P(0.6, -0.75), P(0.9, -0.5), 14).slice(1)];
    default: return null;
  }
}

// ====================================================================================================================================================
// MATYO: Hungarian floral embroidery of Mezokovesd. Thick padded satin stitch (fans of glossy strands, each petal lit like a pillow) and stem stitch
// (a slanted rope of overlapping short stitches) in bright silk on black cotton, in a wooden hoop, on a worn painted bench under a casement window.
// ====================================================================================================================================================
export function matyoEnv(ctx, S) {
  const a = S.area, c = S.cell, X0 = a.x - 12, W = a.w + 24;
  // worn blue-green painted bench: broad planks, paint chipped back to pine along the edges
  planks(ctx, a, { h: Math.max(c * 2.5, 46), base: '#25667f', alt: '#1b5068', grain: '#021014', wear: '#d2a468', stripe: '#e9dcb4', seed: 5, lite: S.lite });
  // window light with a casement cross falling over the bench, a little warm bounce
  const sh = (y0, h0) => lightShaft(ctx, { x: a.x, y: y0, w: a.w, h: h0 }, a.x + a.w * 0.02, a.w * 0.5, a.w * 0.3, '#fff1c8', 0.3, 1);
  sh(a.y, a.h * 0.44); sh(a.y + a.h * 0.5, a.h * 0.5);
  glow(ctx, a.x + a.w * 0.2, a.y + a.h * 0.08, Math.max(a.w, a.h) * 0.75, '#ffe9b0', 0.26);
  if (!S.lite) { // bare pine knots and nail heads
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; for (let k = 0; k < 9; k++) { const x = a.x + hash(k, 31) * a.w, y = a.y + hash(k, 32) * a.h; ctx.beginPath(); ctx.ellipse(x, y, c * 0.2, c * 0.1, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#8a6a44'; for (let k = 0; k < 14; k++) { const x = X0 + (k + 0.5) * W / 14, y = a.y + ((k * 7) % 5 + 0.4) * a.h / 5; ctx.beginPath(); ctx.arc(x, y, 1.6, 0, TAU); ctx.fill(); }
  }
  vignette(ctx, a, 0.42);
  // small silk hanks lying in the corners of the work area
  const b = S.box ?? S.rect, hk = ['#c8302b', '#2f6fb0', '#d9a82a'];
  if (!S.lite && !S.card) for (let k = 0; k < 3; k++) { const left = k === 1, x = left ? b.x + c * 0.4 : b.x + b.w - c * (0.35 + k * 0.1), y = left ? b.y + b.h - c * 0.28 : (k === 0 ? b.y + c * 0.35 : b.y + b.h - c * 0.32); matyoHank(ctx, x, y, c * 0.34, hk[k], k); }
}
function matyoHank(ctx, x, y, R, col, key) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.6 + key * 0.9);
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.ellipse(R * 0.15, R * 0.3, R * 0.7, R * 1.15, 0, 0, TAU); ctx.fill();
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) { const o = (i - 2.5) * R * 0.11; ctx.strokeStyle = i % 2 ? shade(col, -0.25) : shade(col, 0.08); ctx.lineWidth = R * 0.2; ctx.beginPath(); ctx.ellipse(o, 0, R * 0.46, R * 1.05, 0, 0, TAU); ctx.stroke(); }
  ctx.strokeStyle = rgba(shade(col, 0.7), 0.6); ctx.lineWidth = R * 0.07; ctx.beginPath(); ctx.ellipse(-R * 0.1, 0, R * 0.46, R * 1.05, 0, 3.7, 5.2); ctx.stroke();
  ctx.fillStyle = '#efe4c8'; ctx.fillRect(-R * 0.64, -R * 0.15, R * 1.28, R * 0.3); ctx.fillStyle = shade(col, -0.1); ctx.fillRect(-R * 0.64, -R * 0.04, R * 1.28, R * 0.08);
  ctx.restore();
}
export function matyoUnder(ctx, S) { squareHoop(ctx, S, { wood: '#c28a48', t: 0.34, metal: '#cfa64a' }); }
export function matyoGround(ctx, S) {
  const r = S.rect, c = S.cell;
  ctx.save(); ctx.beginPath(); rrp(ctx, r.x, r.y, r.w, r.h, c * 0.8); ctx.clip();
  clothGround(ctx, S, { count: 12, wa: 0.09, ka: 0.14, lit: 0.12, dark: 0.3 });
  // the cloth bellies a little inside the hoop: a soft sheen across the middle
  const g = ctx.createRadialGradient(r.x + r.w * 0.35, r.y + r.h * 0.3, 0, r.x + r.w * 0.35, r.y + r.h * 0.3, r.w * 0.9); g.addColorStop(0, 'rgba(255,255,255,0.1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.restore();
}
export function matyoOver(ctx, S) {
  const r = S.rect, c = S.cell; ctx.save(); ctx.beginPath(); rrp(ctx, r.x, r.y, r.w, r.h, c * 0.8); ctx.clip(); innerShade(ctx, S, 0.42); ctx.restore();
  ctx.strokeStyle = 'rgba(255,235,190,0.28)'; ctx.lineWidth = Math.max(1, c * 0.04); ctx.beginPath(); rrp(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, c * 0.8); ctx.stroke();
}

// --- stitch primitives of matyo ---------------------------------------------------------------------------------------------------------------
const gloss = (ctx, cx, cy, r, a = 0.42, b = 0.5) => { const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.42, r * 0.04, cx, cy, r * 1.08); g.addColorStop(0, `rgba(255,248,230,${a})`); g.addColorStop(0.42, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(0,0,0,${b})`); ctx.fillStyle = g; ctx.fillRect(cx - r * 1.3, cy - r * 1.3, r * 2.6, r * 2.6); };
// one fan of satin strands inside the current clip: from (bx,by) spread across [-wid..wid] at distance len, p = strand pitch
function strands(ctx, bx, by, len, wid, p, col, key) {
  const N = Math.max(3, Math.ceil((wid * 2) / p)), groups = [[], [], []];
  for (let k = 0; k <= N; k++) groups[k % 3].push(k);
  const tones = [shade(col, -0.2), col, shade(col, 0.14)];
  ctx.lineCap = 'butt';
  ctx.strokeStyle = shade(col, -0.58); ctx.lineWidth = p * 1.25; ctx.beginPath(); for (let k = 0; k <= N; k++) { const y = -wid + (2 * wid * k) / N; ctx.moveTo(bx, by); ctx.lineTo(bx + len * 1.05, by + y * 1.1); } ctx.stroke();
  groups.forEach((g, gi) => { ctx.strokeStyle = tones[gi]; ctx.lineWidth = p * 0.88; ctx.beginPath(); for (const k of g) { const y = -wid + (2 * wid * k) / N; ctx.moveTo(bx, by); ctx.lineTo(bx + len * 1.05, by + y * 1.1); } ctx.stroke(); });
  ctx.strokeStyle = rgba(mix(col, '#fff2d0', 0.5), 0.5); ctx.lineWidth = Math.max(0.5, p * 0.22); ctx.beginPath(); for (let k = 0; k <= N; k++) if (hash(k, key, 3) > 0.45) { const y = -wid + (2 * wid * k) / N - p * 0.22; ctx.moveTo(bx + len * 0.05, by + y * 0.1); ctx.lineTo(bx + len * 0.95, by + y * 1.03); } ctx.stroke();
}
// a padded satin petal: teardrop from its base outward, glossy fan of strands, lit from the upper left
export function satinPetal(ctx, ox, oy, ang, len, wid, col, key, o = {}) {
  const ca = Math.cos(ang), sa = Math.sin(ang), p = Math.max(1.15, wid / (o.fine ?? 7));
  const path = () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(len * 0.12, -wid * 1.05, len * 0.78, -wid * 0.95, len, 0); ctx.bezierCurveTo(len * 0.78, wid * 0.95, len * 0.12, wid * 1.05, 0, 0); ctx.closePath(); };
  ctx.save(); ctx.translate(ox, oy); ctx.rotate(ang);
  const sx = len * 0.05, sy = len * 0.09, lx = sx * ca + sy * sa, ly = -sx * sa + sy * ca;
  path(); ctx.save(); ctx.translate(lx, ly); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill(); ctx.restore();
  path(); ctx.fillStyle = shade(col, -0.5); ctx.fill(); ctx.save(); ctx.clip();
  strands(ctx, -len * 0.02, 0, len, wid * 0.98, p, col, key);
  // padding: the light turns with the shape (local light vector)
  const lsx = -0.55, lsy = -0.83, ux = lsx * ca + lsy * sa, uy = -lsx * sa + lsy * ca, R = Math.max(len, wid) * 0.62;
  const g = ctx.createLinearGradient(len * 0.45 + ux * R, uy * R, len * 0.45 - ux * R, -uy * R); g.addColorStop(0, 'rgba(255,244,214,0.36)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)'); ctx.fillStyle = g; ctx.fillRect(-wid, -wid * 1.4, len + wid * 2, wid * 2.8);
  path(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = wid * 0.55; ctx.lineJoin = 'round'; ctx.stroke(); // padding: the edge rolls away from the light
  // the strands gather and darken at the base
  const gb = ctx.createRadialGradient(0, 0, 0, 0, 0, len * 0.4); gb.addColorStop(0, 'rgba(0,0,0,0.45)'); gb.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gb; ctx.fillRect(-wid, -wid * 1.4, len, wid * 2.8);
  ctx.restore();
  path(); ctx.strokeStyle = shade(col, -0.62); ctx.lineWidth = Math.max(0.8, wid * 0.1); ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}
// a pointed leaf: two halves of slanted satin from a midrib
export function satinLeaf(ctx, x, y, ang, len, wid, col, key, o = {}) {
  const ca = Math.cos(ang), sa = Math.sin(ang), p = Math.max(1.15, wid / 5.5), dk = o.dk ?? 0.5, sh = o.sh ?? 0.5;
  const path = () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(len * 0.2, -wid * 1.25, len * 0.7, -wid * 0.95, len, 0); ctx.bezierCurveTo(len * 0.7, wid * 0.95, len * 0.2, wid * 1.25, 0, 0); ctx.closePath(); };
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  const sx = len * 0.05, sy = len * 0.09; path(); ctx.save(); ctx.translate(sx * ca + sy * sa, -sx * sa + sy * ca); ctx.fillStyle = `rgba(0,0,0,${sh})`; ctx.fill(); ctx.restore();
  path(); ctx.fillStyle = shade(col, -dk); ctx.fill(); ctx.save(); ctx.clip();
  ctx.lineCap = 'butt';
  for (const side of [-1, 1]) {
    const n = Math.ceil(len / p), tone = side < 0 ? 0.1 : -0.12;
    ctx.strokeStyle = shade(col, tone - dk * 0.56); ctx.lineWidth = p * 1.2; ctx.beginPath(); for (let k = 0; k <= n; k++) { const u = (k / n) * len * 0.96; ctx.moveTo(u, 0); ctx.lineTo(u + len * 0.26, side * wid * 1.5); } ctx.stroke();
    ctx.strokeStyle = shade(col, tone); ctx.lineWidth = p * 0.86; ctx.beginPath(); for (let k = 0; k <= n; k++) { const u = (k / n) * len * 0.96; ctx.moveTo(u, 0); ctx.lineTo(u + len * 0.26, side * wid * 1.5); } ctx.stroke();
    ctx.strokeStyle = rgba(shade(col, 0.7), 0.45); ctx.lineWidth = Math.max(0.5, p * 0.2); ctx.beginPath(); for (let k = 0; k <= n; k++) if (hash(k, key, side + 5) > 0.5) { const u = (k / n) * len * 0.96; ctx.moveTo(u + len * 0.02, side * 0.2); ctx.lineTo(u + len * 0.24, side * wid * 1.4); } ctx.stroke();
  }
  const g = ctx.createLinearGradient(0, -wid, 0, wid); const lx = -0.55 * ca - 0.83 * sa * 0 - 0, uy = -(-0.55) * sa + (-0.83) * ca; void lx;
  if (uy < 0) { g.addColorStop(0, 'rgba(255,248,230,0.34)'); g.addColorStop(1, 'rgba(0,0,0,0.4)'); } else { g.addColorStop(0, 'rgba(0,0,0,0.4)'); g.addColorStop(1, 'rgba(255,248,230,0.34)'); }
  ctx.fillStyle = g; ctx.fillRect(-wid, -wid * 1.4, len + wid * 2, wid * 2.8);
  ctx.restore();
  // midrib in stem stitch
  ctx.lineCap = 'round'; ctx.strokeStyle = `rgba(0,0,0,${sh * 0.8})`; ctx.lineWidth = Math.max(1.4, wid * 0.2); ctx.beginPath(); ctx.moveTo(len * 0.02, wid * 0.04); ctx.lineTo(len * 0.9, wid * 0.04); ctx.stroke();
  ctx.setLineDash([p * 1.2, p * 0.5]); ctx.strokeStyle = shade(col, 0.34); ctx.lineWidth = Math.max(1.1, wid * 0.15); ctx.beginPath(); ctx.moveTo(len * 0.02, 0); ctx.lineTo(len * 0.9, 0); ctx.stroke(); ctx.setLineDash([]);
  path(); ctx.strokeStyle = shade(col, -(dk + 0.12)); ctx.lineWidth = Math.max(0.8, wid * 0.09); ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}
// stem stitch: a slanted rope of overlapping short stitches along a polyline
export function stemStitch(ctx, pts, w, col, o = {}) {
  const L = w * (o.step ?? 0.95), { pts: P, total } = resample(pts, L); if (P.length < 2) return;
  const n = Math.max(1, P.length - 1);
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[Math.min(P.length - 1, i + 1)], nx = -a.ty, ny = a.tx;
    const x0 = a.x - a.tx * L * 0.12 + nx * w * 0.3, y0 = a.y - a.ty * L * 0.12 + ny * w * 0.3, x1 = b.x + b.tx * L * 0.62 - nx * w * 0.3, y1 = b.y + b.ty * L * 0.62 - ny * w * 0.3;
    ctx.lineCap = 'round'; const seg = (dx, dy, lw, c2) => { ctx.strokeStyle = c2; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x0 + dx, y0 + dy); ctx.lineTo(x1 + dx, y1 + dy); ctx.stroke(); };
    seg(w * 0.1, w * 0.2, w * 0.68, `rgba(0,0,0,${o.sh ?? 0.36})`); seg(0, 0, w * 0.66, shade(col, -(o.dk ?? 0.5))); seg(0, 0, w * 0.5, shade(col, i % 2 ? -0.06 : 0.04)); seg(-w * 0.04, -w * 0.12, w * 0.15, rgba(shade(col, 0.72), 0.85));
  }
  void total;
}
// the whole-cell footprint of generic filled motifs, as padded satin in one direction
function satinShape(ctx, kind, x, y, s, col, key) {
  const p = Math.max(1.2, s / 15), ang = -0.8 + (hash(key, 3) - 0.5) * 0.3, ca = Math.cos(ang), sa = Math.sin(ang), N = Math.ceil((s * 0.8) / p);
  const path = (dx = 0, dy = 0) => motifPath(ctx, kind, x + dx, y + dy, s * 1.0);
  path(s * 0.03, s * 0.05); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();
  path(); ctx.fillStyle = shade(col, -0.5); ctx.fill(); ctx.save(); ctx.clip('nonzero');
  ctx.lineCap = 'butt';
  for (const [wd, c2, off] of [[1.25, shade(col, -0.58), 0], [0.88, col, 0]]) { ctx.strokeStyle = c2; ctx.lineWidth = p * wd; ctx.beginPath(); for (let k = -N; k <= N; k++) { const u = k * p, vx = x + ca * u, vy = y + sa * u; ctx.moveTo(vx - sa * s, vy + ca * s); ctx.lineTo(vx + sa * s, vy - ca * s); } ctx.stroke(); void off; }
  ctx.strokeStyle = shade(col, 0.16); ctx.lineWidth = p * 0.88; ctx.beginPath(); for (let k = -N; k <= N; k += 3) { const u = k * p, vx = x + ca * u, vy = y + sa * u; ctx.moveTo(vx - sa * s, vy + ca * s); ctx.lineTo(vx + sa * s, vy - ca * s); } ctx.stroke();
  ctx.strokeStyle = rgba(shade(col, 0.7), 0.5); ctx.lineWidth = Math.max(0.5, p * 0.2); ctx.beginPath(); for (let k = -N; k <= N; k += 2) { const u = k * p - p * 0.2, vx = x + ca * u, vy = y + sa * u; ctx.moveTo(vx - sa * s * 0.9, vy + ca * s * 0.9); ctx.lineTo(vx + sa * s * 0.9, vy - ca * s * 0.9); } ctx.stroke();
  gloss(ctx, x, y, s * 0.55); ctx.restore();
  path(); ctx.strokeStyle = shade(col, -0.62); ctx.lineWidth = Math.max(0.8, s * 0.035); ctx.lineJoin = 'round'; ctx.stroke();
}
export function matyoSkin(ctx, S, d) {
  const { kind, col, x, y, s, key } = d, f = (v) => v * s;
  switch (kind) {
    case 'flower': { // the Matyo rose: a ring of padded petals, a smaller lighter ring above, a raised heart
      const n = 6, a0 = hash(key, 2) * 0.5;
      for (let k = 0; k < n; k++) { const a = a0 + (k / n) * TAU - 1.2; satinPetal(ctx, x + Math.cos(a) * f(0.05), y + Math.sin(a) * f(0.05), a, f(0.5), f(0.23), shade(col, -0.06), key + k); }
      for (let k = 0; k < n - 1; k++) { const a = a0 + ((k + 0.5) / (n - 1)) * TAU - 1.2 + 0.2; satinPetal(ctx, x, y, a, f(0.32), f(0.16), shade(col, 0.1), key + 9 + k, { fine: 5 }); }
      ball(ctx, x - f(0.01), y - f(0.01), f(0.11), shade(col, 0.28), true); ctx.fillStyle = rgba(shade(col, 0.75), 0.9); ctx.beginPath(); ctx.arc(x - f(0.04), y - f(0.05), f(0.025), 0, TAU); ctx.fill();
      break;
    }
    case 'petal': { // tulip: three satin petals on a stem-stitched stem
      const by = y + f(0.1), bx = x;
      stemStitch(ctx, [[bx, by + f(0.04)], [bx - f(0.05), y + f(0.3)], [bx + f(0.02), y + f(0.5)]], Math.max(2.4, s * 0.1), shade(col, -0.18));
      satinPetal(ctx, bx, by, -Math.PI / 2 - 0.62, f(0.5), f(0.22), shade(col, -0.1), key + 1);
      satinPetal(ctx, bx, by, -Math.PI / 2 + 0.62, f(0.5), f(0.22), shade(col, -0.1), key + 2);
      satinPetal(ctx, bx, by, -Math.PI / 2, f(0.6), f(0.24), shade(col, 0.06), key + 3);
      break;
    }
    case 'leaf': satinLeaf(ctx, x - f(0.46), y + f(0.24), -0.55, f(0.95), f(0.27), col, key); break;
    case 'dot': { // a berry or bud: a round padded satin button
      const R = f(0.3), p = Math.max(1.1, R / 4.2);
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.arc(x + R * 0.2, y + R * 0.3, R * 1.03, 0, TAU); ctx.fill();
      ctx.fillStyle = shade(col, -0.5); ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill(); ctx.save(); ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.clip();
      ctx.lineCap = 'butt'; for (const [wd, c2] of [[1.2, shade(col, -0.58)], [0.86, col]]) { ctx.strokeStyle = c2; ctx.lineWidth = p * wd; ctx.beginPath(); for (let k = -Math.ceil(R / p); k <= Math.ceil(R / p); k++) { ctx.moveTo(x + k * p - R * 0.5, y + R * 1.2); ctx.lineTo(x + k * p + R * 0.5, y - R * 1.2); } ctx.stroke(); }
      gloss(ctx, x, y, R, 0.6, 0.55); ctx.restore(); ctx.strokeStyle = shade(col, -0.62); ctx.lineWidth = Math.max(0.8, R * 0.1); ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.stroke();
      break;
    }
    case 'vine': {
      const pts = linePts('vine', x, y, s * 1.04), w = Math.max(2.4, s * 0.105);
      satinLeaf(ctx, x - f(0.34), y + f(0.24), -1.55, f(0.42), f(0.13), shade(col, 0.04), key + 1);
      satinLeaf(ctx, x - f(0.12), y + f(0.04), 1.0, f(0.38), f(0.12), shade(col, -0.04), key + 2);
      satinLeaf(ctx, x + f(0.18), y - f(0.1), -0.7, f(0.4), f(0.13), shade(col, 0.04), key + 3);
      stemStitch(ctx, pts, w, col);
      break;
    }
    case 'wave': case 'zigzag': case 'spiral': case 'ring': case 'fret': { const pts = linePts(kind, x, y, s * 1.04); stemStitch(ctx, pts, Math.max(2.4, s * 0.11), col); break; }
    default:
      if (isFilled(kind)) satinShape(ctx, kind, x, y, s, col, key);
      else { motifPath(ctx, kind, x, y, s); ctx.lineWidth = Math.max(2, s * 0.1); ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.stroke(); }
  }
}
// the silk skein of the tray: a glossy hank with a paper band
Object.assign(POT, {
  silkhank(ctx, S, b, col, on) {
    const { cx, cy, r } = bxx(b), lift = on ? -3 : 0; potBack(ctx, b, '#08141a', 0.55);
    ctx.save(); ctx.translate(cx, cy + lift); ctx.rotate(-0.45);
    softE(ctx, r * 0.12, r * 0.25, r * 0.62, r * 0.98, 0.35); ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) { const o = (i - 4) * r * 0.075, w = r * 0.5 + (i % 2) * r * 0.04; ctx.strokeStyle = i % 3 === 0 ? shade(col, -0.3) : i % 3 === 1 ? shade(col, 0.05) : shade(col, 0.2); ctx.lineWidth = r * 0.12; ctx.beginPath(); ctx.ellipse(o, 0, w * 0.9, r * 0.9, 0, 0, TAU); ctx.stroke(); }
    ctx.strokeStyle = rgba(shade(col, 0.8), 0.75); ctx.lineWidth = r * 0.05; ctx.beginPath(); ctx.ellipse(-r * 0.22, -r * 0.1, r * 0.5, r * 0.82, 0, 3.55, 5.1); ctx.stroke(); ctx.beginPath(); ctx.ellipse(r * 0.08, 0, r * 0.4, r * 0.8, 0, 3.7, 4.8); ctx.stroke();
    ctx.fillStyle = '#f2e8cf'; ctx.fillRect(-r * 0.72, -r * 0.14, r * 1.44, r * 0.28); ctx.fillStyle = shade(col, -0.05); ctx.fillRect(-r * 0.72, -r * 0.035, r * 1.44, r * 0.07);
    ctx.strokeStyle = 'rgba(80,60,30,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(-r * 0.72, -r * 0.14, r * 1.44, r * 0.28);
    ctx.restore(); potRing(ctx, S, b, on);
  },
});
// a long needle with a loop of thick glossy silk through a gold eye
Object.assign(TOOLS, {
  satinneedle(ctx, S, T) {
    const u = T.u, p = press(T), a = 0.8, len = u * 3.6, x2 = T.x + Math.sin(a) * len, y2 = T.y - Math.cos(a) * len;
    softE(ctx, T.x + u * 0.3, T.y + u * 0.1, u * 0.7, u * 0.1, 0.3);
    // the silk: out of the eye, a slack loop, trailing to the hoop
    const sx = x2 + u * 0.5, sy = y2 + u * 0.4 + Math.sin(T.t * 1.9) * u * 0.06;
    { const w = Math.max(2.2, u * 0.11), q = (dx, dy) => { ctx.beginPath(); ctx.moveTo(x2 + dx, y2 + dy); ctx.bezierCurveTo(x2 + u * 0.4 + dx, y2 - u * 0.05 + dy, sx + u * 0.6 + dx, sy + u * 0.2 + dy, sx + u * 0.5 + dx, sy + u * 1.1 + dy); ctx.bezierCurveTo(sx + u * 0.4 + dx, sy + u * 1.6 + dy, sx + u * 0.9 + dx, sy + u * 1.9 + dy, sx + u * 1.2 + dx, sy + u * 1.7 + dy); }; ctx.lineCap = 'round'; q(w * 0.14, w * 0.2); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = w; ctx.stroke(); q(0, 0); ctx.strokeStyle = T.col; ctx.lineWidth = w; ctx.stroke(); q(-w * 0.12, -w * 0.16); ctx.strokeStyle = shade(T.col, 0.55); ctx.lineWidth = w * 0.28; ctx.stroke(); }
    const g = ctx.createLinearGradient(T.x, T.y, x2, y2); g.addColorStop(0, '#7e8894'); g.addColorStop(0.5, '#f8fbff'); g.addColorStop(1, '#8e98a4');
    ctx.lineCap = 'round'; ctx.strokeStyle = g; ctx.lineWidth = Math.max(2, u * 0.085); ctx.beginPath(); ctx.moveTo(T.x, T.y - p * u * 0.05); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.save(); ctx.translate(x2 - Math.sin(a) * u * 0.18, y2 + Math.cos(a) * u * 0.18); ctx.rotate(a); ctx.strokeStyle = '#d9b050'; ctx.lineWidth = Math.max(1.4, u * 0.05); ctx.beginPath(); ctx.ellipse(0, 0, u * 0.05, u * 0.17, 0, 0, TAU); ctx.stroke(); ctx.restore();
    if (T.a < 0.45) { ctx.strokeStyle = rgba(T.col, 0.5 * (1 - T.a / 0.45)); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(T.x, T.y, u * (0.15 + T.a * 0.9), 0, TAU); ctx.stroke(); }
  },
});

// ====================================================================================================================================================
// FILET: lace on a knotted square-mesh net. The net is lashed into a wooden frame; the picture is made by darning cream cotton through chosen squares
// (linen stitch: a woven block) and along lines (darned ladder bands), against the open mesh and a dark night-blue wall.
// ====================================================================================================================================================
const NET = '#e8dec3';
// the night-blue linen wall: soft vertical folds, a lamp pool at the lower left, a cold glint at the upper right (same in env and in the net's openings)
function filetWall(ctx, r, S) {
  const a = S.area ?? r, c = S.cell, bg = S.bg;
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  const g = ctx.createLinearGradient(a.x, a.y, a.x + a.w * 0.2, a.y + a.h); g.addColorStop(0, shade(bg, 0.2)); g.addColorStop(0.5, bg); g.addColorStop(1, shade(bg, -0.45)); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  const gf = ctx.createLinearGradient(a.x, 0, a.x + a.w, 0), n = 18, per = Math.max(2.2, a.w / (c * 3.3));
  for (let i = 0; i <= n; i++) { const v = Math.sin((i / n) * per * TAU + 0.8) * 0.5 + Math.sin((i / n) * per * 2.3 * TAU) * 0.18; gf.addColorStop(i / n, v > 0 ? `rgba(170,200,255,${0.07 * v})` : `rgba(0,0,20,${-0.2 * v})`); }
  ctx.fillStyle = gf; ctx.fillRect(r.x, r.y, r.w, r.h);
  const gl = (x, y, R, col, al) => { const q = ctx.createRadialGradient(x, y, 0, x, y, R); q.addColorStop(0, rgba(col, al)); q.addColorStop(1, rgba(col, 0)); ctx.fillStyle = q; ctx.fillRect(r.x, r.y, r.w, r.h); };
  gl(a.x + a.w * 0.08, a.y + a.h * 0.82, Math.max(a.w, a.h) * 0.85, '#ffc470', 0.2); gl(a.x + a.w * 0.9, a.y + a.h * 0.3, Math.max(a.w, a.h) * 0.42, '#ffcf80', 0.26); gl(a.x + a.w * 0.9, a.y + a.h * 0.08, Math.max(a.w, a.h) * 0.6, '#86a8ff', 0.1);
  const p = Math.max(3, c * 0.18); ctx.strokeStyle = 'rgba(190,210,255,0.03)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = Math.floor(r.x / p) * p; x < r.x + r.w; x += p) { ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); } ctx.stroke();
  ctx.restore();
}
const FRAME_TB = 0.5, FRAME_GAP = 0.32;
export function filetEnv(ctx, S) {
  const a = S.area, c = S.cell, X0 = a.x - 12, W = a.w + 24, r = S.rect;
  filetWall(ctx, { x: X0, y: a.y, w: W, h: a.h }, S);
  vignette(ctx, a, 0.45);
  if (S.lite || S.card) return;
  const off = c * (FRAME_TB + FRAME_GAP), R = { x: r.x - off, y: r.y - off, w: r.w + 2 * off, h: r.h + 2 * off };
  // hanging cords from the top corners to a brass hook
  const ay = Math.max(a.y + c * 0.35, R.y - Math.min(c * 2.6, (R.y - a.y) * 0.85));
  if (R.y - ay > c * 0.5) {
    const hx = a.x + a.w / 2; ctx.lineCap = 'round';
    for (const [dx, dy, lw, col] of [[c * 0.08, c * 0.14, c * 0.1, 'rgba(0,0,0,0.4)'], [0, 0, c * 0.085, '#c9b48a'], [-c * 0.02, -c * 0.03, c * 0.03, '#f1e4c0']]) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(R.x + c * 0.4 + dx, R.y + dy); ctx.lineTo(hx + dx, ay + dy); ctx.lineTo(R.x + R.w - c * 0.4 + dx, R.y + dy); ctx.stroke(); }
    ball(ctx, hx, ay, c * 0.17, '#d6b25a', true); ctx.strokeStyle = '#6a4a14'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(hx, ay, c * 0.17, 0, TAU); ctx.stroke();
  }
  // in wide layouts: a lace doily pinned to the wall on the left, a brass wall lamp lit on the right
  const lf = r.x - off - a.x, rt = a.x + a.w - (r.x + r.w + off);
  if (lf > c * 1.3) { const q = Math.min(lf * 0.42, c * 1.5), dx = a.x + lf * 0.5, dy = r.y + r.h * 0.3; softE(ctx, dx + q * 0.1, dy + q * 0.16, q * 1.05, q * 1.05, 0.35); ctx.fillStyle = '#efe6cc'; ctx.beginPath(); for (let k = 0; k < 16; k++) { const aa = (k / 16) * TAU; ctx.moveTo(dx + Math.cos(aa) * q + q * 0.2, dy + Math.sin(aa) * q); ctx.arc(dx + Math.cos(aa) * q, dy + Math.sin(aa) * q, q * 0.2, 0, TAU); } ctx.arc(dx, dy, q, 0, TAU); ctx.fill(); const wc = S.bg; ctx.fillStyle = shade(wc, -0.1); ctx.beginPath(); for (let k = 0; k < 8; k++) { const aa = (k / 8) * TAU + 0.2; ctx.moveTo(dx + Math.cos(aa) * q * 0.62 + q * 0.08, dy + Math.sin(aa) * q * 0.62); ctx.arc(dx + Math.cos(aa) * q * 0.62, dy + Math.sin(aa) * q * 0.62, q * 0.08, 0, TAU); } ctx.moveTo(dx + q * 0.12, dy); ctx.arc(dx, dy, q * 0.12, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(150,130,90,0.6)'; ctx.lineWidth = Math.max(1, q * 0.04); ctx.beginPath(); for (let k = 0; k < 16; k++) { const aa = (k / 16) * TAU; ctx.moveTo(dx + Math.cos(aa) * q * 0.3, dy + Math.sin(aa) * q * 0.3); ctx.lineTo(dx + Math.cos(aa) * q * 0.8, dy + Math.sin(aa) * q * 0.8); } ctx.stroke(); ctx.strokeStyle = 'rgba(120,100,60,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(dx, dy, q * 0.4, 0, TAU); ctx.stroke(); ball(ctx, dx, dy - q * 0.95, q * 0.09, '#d9b25a', false); }
  if (rt > c * 1.3) { const lx = a.x + a.w - rt * 0.5, ly = r.y + r.h * 0.28, q = Math.min(rt * 0.25, c * 0.7); glow(ctx, lx, ly, q * 5, '#ffc870', 0.35); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(lx - q * 0.15, ly - q * 0.2, q * 0.5, q * 2.2); rod(ctx, lx - q * 1.3, ly + q * 1.5, lx, ly + q * 1.5, q * 0.18, '#b98c3a'); rod(ctx, lx, ly + q * 1.5, lx, ly + q * 0.6, q * 0.2, '#b98c3a'); const gg = ctx.createLinearGradient(lx - q * 0.5, 0, lx + q * 0.5, 0); gg.addColorStop(0, 'rgba(255,240,200,0.8)'); gg.addColorStop(0.5, 'rgba(255,210,130,0.9)'); gg.addColorStop(1, 'rgba(255,180,90,0.7)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(lx - q * 0.38, ly + q * 0.6); ctx.quadraticCurveTo(lx - q * 0.7, ly - q * 0.1, lx - q * 0.3, ly - q * 0.9); ctx.lineTo(lx + q * 0.3, ly - q * 0.9); ctx.quadraticCurveTo(lx + q * 0.7, ly - q * 0.1, lx + q * 0.38, ly + q * 0.6); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff6d0'; ctx.beginPath(); ctx.ellipse(lx, ly - q * 0.1, q * 0.14, q * 0.38, 0, 0, TAU); ctx.fill(); }
  // a narrow walnut shelf under the frame holding a spool of cotton, a netting needle and a mesh gauge
  const sy = Math.min(R.y + R.h + c * 0.28, a.y + a.h - c * 0.5);
  if (a.y + a.h - sy > c * 0.35) {
    const g = ctx.createLinearGradient(0, sy, 0, a.y + a.h); g.addColorStop(0, '#6a4426'); g.addColorStop(0.18, '#46301c'); g.addColorStop(1, '#1e140a'); ctx.fillStyle = g; ctx.fillRect(X0, sy, W, a.y + a.h - sy + 12);
    ctx.fillStyle = 'rgba(255,225,170,0.4)'; ctx.fillRect(X0, sy, W, Math.max(1.2, c * 0.04)); ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(X0, sy - c * 0.1, W, c * 0.1);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 1; k < 4; k++) { const yy = sy + (a.y + a.h - sy) * k / 4; ctx.moveTo(X0, yy); ctx.lineTo(X0 + W, yy + (hash(k, 3) - 0.5) * 3); } ctx.stroke();
    const y0 = sy + Math.min(c * 0.32, (a.y + a.h - sy) * 0.45), u = Math.min(c * 0.5, (a.y + a.h - sy) * 0.5);
    // spool
    const sx = a.x + a.w * 0.82; softE(ctx, sx + u * 0.2, y0 + u * 0.5, u * 1.3, u * 0.28, 0.45);
    ctx.fillStyle = '#c9a469'; roundRectPath(ctx, sx - u * 0.9, y0 - u * 0.62, u * 1.8, u * 0.2, 3); ctx.fill(); roundRectPath(ctx, sx - u * 0.9, y0 + u * 0.42, u * 1.8, u * 0.2, 3); ctx.fill();
    for (let k = 0; k < 9; k++) { ctx.fillStyle = k % 2 ? '#efe6cb' : '#d9cca8'; ctx.fillRect(sx - u * 0.7 + k * u * 0.155, y0 - u * 0.42, u * 0.16, u * 0.84); }
    const sg = ctx.createLinearGradient(0, y0 - u * 0.42, 0, y0 + u * 0.42); sg.addColorStop(0, 'rgba(255,255,255,0.45)'); sg.addColorStop(0.5, 'rgba(255,255,255,0)'); sg.addColorStop(1, 'rgba(0,0,0,0.4)'); ctx.fillStyle = sg; ctx.fillRect(sx - u * 0.7, y0 - u * 0.42, u * 1.4, u * 0.84);
    // gauge
    const gx = a.x + a.w * 0.14; softE(ctx, gx + u * 0.2, y0 + u * 0.3, u * 1.3, u * 0.2, 0.4); const gg = ctx.createLinearGradient(0, y0 - u * 0.2, 0, y0 + u * 0.2); gg.addColorStop(0, '#f4e2b0'); gg.addColorStop(1, '#a8884a'); ctx.fillStyle = gg; roundRectPath(ctx, gx - u * 1.2, y0 - u * 0.2, u * 2.4, u * 0.4, 3); ctx.fill(); ctx.strokeStyle = 'rgba(60,40,10,0.5)'; ctx.lineWidth = 1; ctx.stroke();
  }
}
export function filetUnder(ctx, S) {
  const r = S.rect, c = S.cell, gap = c * FRAME_GAP, tb = c * FRAME_TB, off = gap + tb, wood = '#a56f3a';
  const R = { x: r.x - off, y: r.y - off, w: r.w + 2 * off, h: r.h + 2 * off };
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = c * 1.0; ctx.shadowOffsetX = c * 0.12; ctx.shadowOffsetY = c * 0.36; ctx.fillStyle = '#000'; ctx.beginPath(); rrp(ctx, R.x, R.y, R.w, R.h, c * 0.1); ctx.fill(); ctx.restore();
  filetWall(ctx, { x: R.x, y: R.y, w: R.w, h: R.h }, S);
  // four mitred bars, light from the upper left
  const bar = (pts, g0, g1, gx, gy) => { const g = ctx.createLinearGradient(gx[0], gy[0], gx[1], gy[1]); g.addColorStop(0, g0); g.addColorStop(1, g1); ctx.fillStyle = g; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(30,14,0,0.6)'; ctx.lineWidth = 1; ctx.stroke(); };
  const X1 = R.x + R.w, Y1 = R.y + R.h;
  bar([[R.x, R.y], [X1, R.y], [X1 - tb, R.y + tb], [R.x + tb, R.y + tb]], shade(wood, 0.4), shade(wood, 0.02), [0, 0], [R.y, R.y + tb]);
  bar([[R.x, R.y], [R.x + tb, R.y + tb], [R.x + tb, Y1 - tb], [R.x, Y1]], shade(wood, 0.28), shade(wood, -0.08), [R.x, R.x + tb], [0, 0]);
  bar([[X1, R.y], [X1, Y1], [X1 - tb, Y1 - tb], [X1 - tb, R.y + tb]], shade(wood, -0.14), shade(wood, -0.5), [X1 - tb, X1], [0, 0]);
  bar([[R.x, Y1], [X1, Y1], [X1 - tb, Y1 - tb], [R.x + tb, Y1 - tb]], shade(wood, -0.2), shade(wood, -0.55), [0, 0], [Y1 - tb, Y1]);
  ctx.save(); ctx.lineCap = 'butt'; ctx.lineWidth = Math.max(0.8, tb * 0.05);
  for (let k = 0; k < 3; k++) { ctx.strokeStyle = rgba(k % 2 ? '#2a1204' : '#ffe9bb', 0.18); const o2 = tb * (0.22 + k * 0.26); ctx.setLineDash([c * (2 + hash(k, 8) * 3), c * (0.4 + hash(k, 9))]); ctx.beginPath(); ctx.moveTo(R.x + o2, R.y + o2); ctx.lineTo(X1 - o2, R.y + o2); ctx.lineTo(X1 - o2, Y1 - o2); ctx.lineTo(R.x + o2, Y1 - o2); ctx.closePath(); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(20,8,0,0.7)'; ctx.lineWidth = Math.max(1.2, c * 0.05); ctx.strokeRect(R.x + tb, R.y + tb, R.w - 2 * tb, R.h - 2 * tb);
  for (const [x, y] of [[R.x + tb / 2, R.y + tb / 2], [X1 - tb / 2, R.y + tb / 2], [R.x + tb / 2, Y1 - tb / 2], [X1 - tb / 2, Y1 - tb / 2]]) { ball(ctx, x, y, tb * 0.2, '#d9b878', false); }
  // the net threads run out to the frame and are lashed round the bars with cord
  const tw = Math.max(1.3, c * 0.07); ctx.lineCap = 'round';
  const ext = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = tw * 1.2; ctx.stroke(); ctx.strokeStyle = NET; ctx.lineWidth = tw; ctx.stroke(); };
  const nx = Math.round(r.w / c), ny = Math.round(r.h / c);
  for (let i = 0; i <= nx; i++) { const x = r.x + (i * r.w) / nx; ext(x, r.y, x, R.y + tb * 0.5); ext(x, r.y + r.h, x, Y1 - tb * 0.5); }
  for (let j = 0; j <= ny; j++) { const y = r.y + (j * r.h) / ny; ext(r.x, y, R.x + tb * 0.5, y); ext(r.x + r.w, y, X1 - tb * 0.5, y); }
  const wrap = (x, y, horiz) => { ctx.save(); ctx.translate(x, y); if (horiz) ctx.rotate(Math.PI / 2); const w = tb * 0.98, h = tb * 0.3; ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(-w / 2 + 1, -h / 2 + 1.5, w, h); const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, shade(NET, 0.3)); g.addColorStop(0.5, NET); g.addColorStop(1, shade(NET, -0.5)); ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeStyle = 'rgba(90,70,40,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-w * 0.2, -h / 2); ctx.lineTo(-w * 0.08, h / 2); ctx.moveTo(w * 0.12, -h / 2); ctx.lineTo(w * 0.24, h / 2); ctx.stroke(); ctx.restore(); };
  for (let i = 0; i <= nx; i++) { const x = r.x + (i * r.w) / nx; wrap(x, R.y + tb / 2, false); wrap(x, Y1 - tb / 2, false); }
  for (let j = 0; j <= ny; j++) { const y = r.y + (j * r.h) / ny; wrap(R.x + tb / 2, y, true); wrap(X1 - tb / 2, y, true); }
}
export function filetGround(ctx, S) {
  const r = S.rect, c = S.cell; filetWall(ctx, r, S);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  const tw = Math.max(1.3, c * 0.07), nx = Math.round(r.w / c), ny = Math.round(r.h / c);
  const xs = [], ys = []; for (let i = 0; i <= nx; i++) xs.push(r.x + (i * r.w) / nx); for (let j = 0; j <= ny; j++) ys.push(r.y + (j * r.h) / ny);
  const line = (dx, dy) => { ctx.beginPath(); for (let j = 0; j <= ny; j++) { ctx.moveTo(r.x - 2 + dx, ys[j] + dy); ctx.lineTo(r.x + r.w + 2 + dx, ys[j] + dy); } for (let i = 0; i <= nx; i++) { ctx.moveTo(xs[i] + dx, r.y - 2 + dy); ctx.lineTo(xs[i] + dx, r.y + r.h + 2 + dy); } };
  ctx.lineCap = 'round';
  line(tw * 0.6, tw * 1.1); ctx.strokeStyle = 'rgba(0,0,0,0.42)'; ctx.lineWidth = tw * 1.3; ctx.stroke();
  line(0, 0); ctx.strokeStyle = shade(NET, -0.5); ctx.lineWidth = tw; ctx.stroke(); ctx.strokeStyle = NET; ctx.lineWidth = tw * 0.72; ctx.stroke();
  line(-tw * 0.1, -tw * 0.2); ctx.strokeStyle = rgba('#ffffff', 0.55); ctx.lineWidth = Math.max(0.6, tw * 0.2); ctx.stroke();
  // sheet-bend knots at the crossings
  const kr = tw * 1.15;
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); for (const x of xs) for (const y of ys) { ctx.moveTo(x + kr * 0.6 + kr * 1.05, y + kr * 0.9); ctx.arc(x + kr * 0.6, y + kr * 0.9, kr * 1.05, 0, TAU); } ctx.fill();
  ctx.fillStyle = shade(NET, -0.45); ctx.beginPath(); for (const x of xs) for (const y of ys) { ctx.moveTo(x + kr, y); ctx.arc(x, y, kr, 0, TAU); } ctx.fill();
  ctx.fillStyle = shade(NET, -0.04); ctx.beginPath(); for (const x of xs) for (const y of ys) { ctx.moveTo(x + kr * 0.82 - kr * 0.08, y - kr * 0.08); ctx.arc(x - kr * 0.08, y - kr * 0.08, kr * 0.82, 0, TAU); } ctx.fill();
  ctx.strokeStyle = 'rgba(90,70,40,0.55)'; ctx.lineWidth = Math.max(0.6, tw * 0.22); ctx.beginPath(); for (const x of xs) for (const y of ys) { ctx.moveTo(x - kr * 0.55, y - kr * 0.35); ctx.lineTo(x + kr * 0.55, y + kr * 0.4); ctx.moveTo(x - kr * 0.2, y + kr * 0.6); ctx.lineTo(x + kr * 0.3, y - kr * 0.6); } ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); for (const x of xs) for (const y of ys) { ctx.moveTo(x - kr * 0.3 + kr * 0.22, y - kr * 0.38); ctx.arc(x - kr * 0.3, y - kr * 0.38, kr * 0.22, 0, TAU); } ctx.fill();
  ctx.restore();
}
export function filetOver(ctx, S) { const r = S.rect, e = Math.max(4, S.cell * 0.35); let g = ctx.createLinearGradient(0, r.y, 0, r.y + e); g.addColorStop(0, 'rgba(0,0,12,0.35)'); g.addColorStop(1, 'rgba(0,0,12,0)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, e); g = ctx.createLinearGradient(r.x, 0, r.x + e, 0); g.addColorStop(0, 'rgba(0,0,12,0.3)'); g.addColorStop(1, 'rgba(0,0,12,0)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, e, r.h); }
// darning: a woven block (vertical threads, horizontal thread passing over and under) clipped to the stamp; lines are darned ladder bands
export function filetSkin(ctx, S, d) {
  const { kind, col, x, y, s, key } = d, tw = Math.max(1.3, S.cell * 0.07);
  const line = linePts(kind, x, y, s * (kind === 'ring' ? 1.25 : 1.1));
  if (line && !isFilled(kind)) {
    const w = Math.max(3, s * 0.15), build = (dx, dy) => { ctx.beginPath(); line.forEach(([px, py], i) => (i ? ctx.lineTo(px + dx, py + dy) : ctx.moveTo(px + dx, py + dy))); };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    build(w * 0.14, w * 0.3); ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = w * 1.25; ctx.stroke();
    build(0, 0); ctx.strokeStyle = shade(col, -0.55); ctx.lineWidth = w * 1.05; ctx.stroke(); ctx.strokeStyle = shade(col, -0.08); ctx.lineWidth = w * 0.86; ctx.stroke();
    ctx.setLineDash([w * 0.22, w * 0.3]); ctx.lineCap = 'butt'; ctx.strokeStyle = rgba(shade(col, -0.5), 0.6); ctx.lineWidth = w * 0.86; ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'round';
    build(-w * 0.1, -w * 0.2); ctx.strokeStyle = rgba('#ffffff', 0.6); ctx.lineWidth = Math.max(0.6, w * 0.15); ctx.stroke(); return;
  }
  const q = Math.max(1.5, s / 9), half = s * 0.5, big = kind === 'solid' ? s - tw * 1.4 : s * (kind === 'dot' ? 1.15 : 1.3), pathAt = (dx = 0, dy = 0) => motifPath(ctx, kind, x + dx, y + dy, big);
  pathAt(tw * 0.3, tw * 0.6); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();
  pathAt(); ctx.fillStyle = shade(col, -0.62); ctx.fill(); ctx.save(); ctx.clip();
  const x0 = x - half - s * 0.2, y0 = y - half - s * 0.2, n = Math.ceil(s * 1.4 / q) + 1;
  ctx.lineCap = 'butt';
  ctx.strokeStyle = shade(col, -0.04); ctx.lineWidth = q * 0.8; ctx.beginPath(); for (let k = 0; k <= n; k++) { ctx.moveTo(x0 + (k + 0.5) * q, y0 - 1); ctx.lineTo(x0 + (k + 0.5) * q, y0 + s * 1.4 + 1); } ctx.stroke();
  for (const [dy, lw2, c2] of [[q * 0.16, q * 0.8, 'rgba(0,0,0,0.38)'], [0, q * 0.8, shade(col, 0.14)], [-q * 0.22, q * 0.2, rgba('#ffffff', 0.4)]]) {
    ctx.setLineDash([q * 0.94, q * 1.06]); ctx.strokeStyle = c2; ctx.lineWidth = lw2; ctx.beginPath();
    for (let j = 0; j <= n; j++) { const yy = y0 + (j + 0.5) * q + dy; ctx.moveTo(x0 + (j & 1) * q - q, yy); ctx.lineTo(x0 + s * 1.4 + q, yy); } ctx.stroke(); ctx.setLineDash([]);
  }
  const g = ctx.createLinearGradient(x - half, y - half, x + half, y + half); g.addColorStop(0, 'rgba(255,250,235,0.14)'); g.addColorStop(1, 'rgba(0,0,10,0.26)'); ctx.fillStyle = g; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  ctx.restore();
  pathAt(); ctx.strokeStyle = rgba(shade(col, -0.6), 0.8); ctx.lineWidth = Math.max(0.8, tw * 0.7); ctx.lineJoin = 'round'; ctx.stroke();
  void key;
}
// a ball of cotton: wound layers crossing, a loose end
Object.assign(POT, {
  cottonball(ctx, S, b, col, on) {
    const { cx, cy, r } = bxx(b), lift = on ? -3 : 0, R = r * 0.74; potBack(ctx, b, '#050c24', 0.6);
    softE(ctx, cx + R * 0.15, cy + lift + R * 0.85, R * 0.95, R * 0.28, 0.4);
    const g = ctx.createRadialGradient(cx - R * 0.35, cy + lift - R * 0.4, R * 0.1, cx, cy + lift, R * 1.05); g.addColorStop(0, shade(col, 0.4)); g.addColorStop(0.6, col); g.addColorStop(1, shade(col, -0.55)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy + lift, R, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy + lift, R, 0, TAU); ctx.clip(); ctx.lineWidth = Math.max(1, R * 0.06);
    for (let k = 0; k < 11; k++) { const rot = k * 0.58 + 0.2, rx = R * (0.55 + 0.55 * hash(k, 3)), ry = R * (0.9 + 0.3 * hash(k, 4)); ctx.strokeStyle = rgba(k % 2 ? shade(col, -0.45) : shade(col, 0.5), 0.45); ctx.beginPath(); ctx.ellipse(cx + (hash(k, 5) - 0.5) * R * 0.3, cy + lift + (hash(k, 6) - 0.5) * R * 0.3, rx, ry, rot, 0, TAU); ctx.stroke(); }
    const sg = ctx.createRadialGradient(cx - R * 0.4, cy + lift - R * 0.45, 0, cx - R * 0.4, cy + lift - R * 0.45, R * 0.6); sg.addColorStop(0, 'rgba(255,255,255,0.45)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sg; ctx.fillRect(cx - R, cy + lift - R, R * 2, R * 2);
    ctx.restore();
    ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = Math.max(1.6, R * 0.09); ctx.beginPath(); ctx.moveTo(cx + R * 0.62, cy + lift + R * 0.62); ctx.bezierCurveTo(cx + R * 1.0, cy + lift + R * 0.8, cx + R * 0.9, cy + lift + R * 1.1, cx + R * 1.1, cy + lift + R * 1.0); ctx.stroke(); ctx.strokeStyle = shade(col, 0.15); ctx.lineWidth = Math.max(1.2, R * 0.065); ctx.stroke();
    potRing(ctx, S, b, on);
  },
});
// a flat netting needle: two boxwood tongues carrying wound thread, a forked tip
Object.assign(TOOLS, {
  netneedle(ctx, S, T) {
    const u = T.u, p = press(T), a = 0.95;
    softE(ctx, T.x + u * 0.5, T.y + u * 0.1, u * 0.8, u * 0.1, 0.3);
    ctx.save(); ctx.translate(T.x, T.y - p * u * 0.06); ctx.rotate(a);
    const L = u * 3.4, w = u * 0.34;
    const g = ctx.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, '#f4e6c0'); g.addColorStop(0.5, '#d4b878'); g.addColorStop(1, '#8a6a30');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-w * 0.12, -u * 0.04); ctx.lineTo(-w, -u * 0.62); ctx.lineTo(-w, -L); ctx.lineTo(w, -L); ctx.lineTo(w, -u * 0.62); ctx.lineTo(w * 0.12, -u * 0.04); ctx.lineTo(0, -u * 0.5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(50,30,5,0.6)'; ctx.lineWidth = 1; ctx.stroke();
    // thread wound round the middle
    ctx.fillStyle = rgba(T.col, 1); ctx.fillRect(-w * 0.9, -L * 0.88, w * 1.8, L * 0.6);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 14; k++) { const yy = -L * 0.88 + (k / 14) * L * 0.6; ctx.moveTo(-w * 0.9, yy); ctx.lineTo(w * 0.9, yy + w * 0.2); } ctx.stroke();
    const sg = ctx.createLinearGradient(-w, 0, w, 0); sg.addColorStop(0, 'rgba(255,255,255,0.55)'); sg.addColorStop(0.4, 'rgba(255,255,255,0)'); sg.addColorStop(1, 'rgba(0,0,0,0.4)'); ctx.fillStyle = sg; ctx.fillRect(-w * 0.9, -L * 0.88, w * 1.8, L * 0.6);
    ctx.fillStyle = '#2a1a0a'; ctx.beginPath(); ctx.ellipse(0, -L * 0.94, w * 0.4, u * 0.1, 0, 0, TAU); ctx.fill();
    ctx.restore();
    sheenLine(ctx, [[T.x, T.y], [T.x - u * 0.5, T.y + u * 0.25], [T.x - u * 1.1, T.y + u * 0.15 + Math.sin(T.t * 1.7) * u * 0.05], [T.x - u * 1.7, T.y + u * 0.7]], Math.max(1.4, u * 0.06), T.col);
  },
});
export { isLand };

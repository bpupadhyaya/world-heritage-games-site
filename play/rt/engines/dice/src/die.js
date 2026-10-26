// Dice with real depth: a rounded cube drawn from its 3D orientation (orthographic camera looking down at ELEV degrees).
// Silhouette = hull of the inner cube stroked with a round pen (exact Minkowski rounding), then corner patches, edge strips
// (cylinder shading between two faces), flat faces, pips (dimples), and a Blinn-Phong sheen. All pure drawing; no state.
import { apply, dot, norm } from './math3.js';

export const ELEV = (56 * Math.PI) / 180;
const sinE = Math.sin(ELEV), cosE = Math.cos(ELEV);
export const CAM = [0, cosE, sinE];
const LIGHT = norm([-0.5, 0.38, 0.78]);
const HALF = norm([LIGHT[0] + CAM[0], LIGHT[1] + CAM[1], LIGHT[2] + CAM[2]]);

const FACES = [
  { v: 1, n: [0, 0, 1], u: [1, 0, 0], w: [0, 1, 0] },
  { v: 6, n: [0, 0, -1], u: [1, 0, 0], w: [0, -1, 0] },
  { v: 2, n: [1, 0, 0], u: [0, 1, 0], w: [0, 0, 1] },
  { v: 5, n: [-1, 0, 0], u: [0, -1, 0], w: [0, 0, 1] },
  { v: 3, n: [0, 1, 0], u: [-1, 0, 0], w: [0, 0, 1] },
  { v: 4, n: [0, -1, 0], u: [1, 0, 0], w: [0, 0, 1] },
];
const PIPS = {
  1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]],
};
const cache = new Map();
const rgb = (c) => {
  let p = cache.get(c);
  if (!p) {
    const m = /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(String(c));
    const h = m ? '' : String(c).replace('#', '');
    const f = h.length === 3 ? h.split('').map((x) => x + x).join('') : h.padEnd(6, '0');
    p = m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
    cache.set(c, p);
  }
  return p;
};
const col = (p, k, add = 0) => `rgb(${Math.max(0, Math.min(255, Math.round(p[0] * k + add)))},${Math.max(0, Math.min(255, Math.round(p[1] * k + add)))},${Math.max(0, Math.min(255, Math.round(p[2] * k + add * 0.92)))})`;
const lum = (n) => 0.44 + 0.62 * Math.max(0, dot(n, LIGHT)) + 0.1 * Math.max(0, -n[0] * 0 + n[0] * 0.5);   // warm key light + a little fill from the right
const spec = (n, gloss) => (gloss <= 0 ? 0 : Math.max(0, dot(n, HALF)) ** 46 * gloss);

function hull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  lo.pop(); up.pop();
  return lo.concat(up);
}

// d = { x, y (screen centre of the die), S (half edge in px), R (3x3 orientation) }; look = { body, pip, pip1, round, gloss }
export function drawDie(ctx, d, look) {
  const { x: cx, y: cy, S, R } = d;
  const r = look.round ?? 0.2, a = 1 - r, body = rgb(look.body), pipC = look.pip ?? '#161616';
  const P = (v) => { const w = apply(R, v); return [cx + w[0] * S, cy + (w[1] * sinE - w[2] * cosE) * S]; };
  const W = (v) => apply(R, v);
  const add = (...vs) => [vs.reduce((s, q) => s + q[0], 0), vs.reduce((s, q) => s + q[1], 0), vs.reduce((s, q) => s + q[2], 0)];
  const sc = (v, k) => [v[0] * k, v[1] * k, v[2] * k];
  const gloss = look.gloss ?? 0.6;
  const wn = FACES.map((f) => W(f.n));
  const vis = wn.map((n) => dot(n, CAM) > 0.002);

  // 1. silhouette: hull of the inner cube, round pen
  const corners = [];
  for (const sx of [-a, a]) for (const sy of [-a, a]) for (const sz of [-a, a]) corners.push(P([sx, sy, sz]));
  const h = hull(corners);
  ctx.save();
  ctx.beginPath(); ctx.moveTo(h[0][0], h[0][1]); for (let i = 1; i < h.length; i++) ctx.lineTo(h[i][0], h[i][1]); ctx.closePath();
  ctx.lineJoin = 'round'; ctx.lineWidth = 2 * r * S; ctx.fillStyle = ctx.strokeStyle = col(body, 0.5);
  ctx.fill(); ctx.stroke();

  const poly = (pts, fill, edge = fill) => {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 0.9; ctx.lineJoin = 'round'; ctx.strokeStyle = edge; ctx.stroke();
  };
  const shine = (pts, k) => { if (k > 0.015) poly(pts, `rgba(255,252,240,${Math.min(0.7, k)})`, `rgba(255,252,240,${Math.min(0.7, k)})`); };

  // 2. corner patches
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    const n1 = [sx, 0, 0], n2 = [0, sy, 0], n3 = [0, 0, sz];
    const sum = norm(W(add(n1, n2, n3)));
    if (dot(sum, CAM) <= 0.001) continue;
    const tri = [P(add(n1, sc(n2, a), sc(n3, a))), P(add(n2, sc(n1, a), sc(n3, a))), P(add(n3, sc(n1, a), sc(n2, a)))];
    poly(tri, col(body, lum(sum)));
  }
  // 3. edge strips
  for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) {
    const f1 = FACES[i], f2 = FACES[j];
    if (dot(f1.n, f2.n) !== 0) continue;
    const mid = norm(add(wn[i], wn[j]));
    if (dot(mid, CAM) <= 0.001) continue;
    const e = [f1.n[1] * f2.n[2] - f1.n[2] * f2.n[1], f1.n[2] * f2.n[0] - f1.n[0] * f2.n[2], f1.n[0] * f2.n[1] - f1.n[1] * f2.n[0]];
    const p1 = add(f1.n, sc(f2.n, a), sc(e, -a)), p2 = add(f1.n, sc(f2.n, a), sc(e, a));
    const q1 = add(f2.n, sc(f1.n, a), sc(e, -a)), q2 = add(f2.n, sc(f1.n, a), sc(e, a));
    const A = P(p1), B = P(p2), C = P(q2), D = P(q1);
    const g = ctx.createLinearGradient((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (C[0] + D[0]) / 2, (C[1] + D[1]) / 2);
    g.addColorStop(0, col(body, lum(wn[i]))); g.addColorStop(0.5, col(body, lum(mid) * 1.04)); g.addColorStop(1, col(body, lum(wn[j])));
    poly([A, B, C, D], g, col(body, lum(mid)));
    shine([A, B, C, D], spec(mid, gloss) * 0.9);
  }
  // 4. flat faces
  for (let k = 0; k < 6; k++) {
    if (!vis[k]) continue;
    const f = FACES[k], L = lum(wn[k]);
    const q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([s, t]) => P(add(f.n, sc(f.u, s * a), sc(f.w, t * a))));
    const g = ctx.createLinearGradient(q[0][0], q[0][1], q[2][0], q[2][1]);
    g.addColorStop(0, col(body, L * 1.05, 4)); g.addColorStop(1, col(body, L * 0.93));
    poly(q, g, col(body, L));
    shine(q, spec(wn[k], gloss) * 0.55);
    // 5. pips (dimples): dark disc, soft inner shadow, tiny rim light
    const one = look.pip1 && f.v === 1;
    const pr = (one ? 0.27 : 0.165) * (look.pipSize ?? 1);
    for (const [pu, pw] of PIPS[f.v]) {
      const c3 = add(f.n, sc(f.u, pu * 0.52), sc(f.w, pw * 0.52));
      const ring = [];
      for (let m = 0; m < 14; m++) { const ang = (m / 14) * 6.2832; ring.push(P(add(c3, sc(f.u, Math.cos(ang) * pr), sc(f.w, Math.sin(ang) * pr)))); }
      const c0 = P(c3);
      const col0 = one ? look.pip1 : pipC;
      poly(ring, col0, col0);
      // concave shading: lit rim on the side facing away from the light, dark crescent toward it
      const rim = [];
      for (let m = 0; m < 14; m++) { const ang = (m / 14) * 6.2832; rim.push(P(add(c3, sc(f.u, Math.cos(ang) * pr * 0.62 + pr * 0.1), sc(f.w, Math.sin(ang) * pr * 0.62 - pr * 0.12)))); }
      poly(rim, 'rgba(0,0,0,0.38)', 'rgba(0,0,0,0.38)');
      ctx.beginPath(); ctx.ellipse(c0[0] + S * pr * 0.35, c0[1] + S * pr * 0.42 * sinE, S * pr * 0.34, S * pr * 0.14, 0, 0, 6.2832); ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fill();
    }
  }
  ctx.restore();
}

// Contact + cast shadow of a die at ground point (x, groundY); z = centre height in half-edges (1 = resting).
export function drawDieShadow(ctx, x, groundY, S, z, alpha = 0.5) {
  const lift = Math.max(0, z - 1);
  const rx = S * (1.18 + 0.22 * lift), ry = rx * sinE * 0.82;
  const ox = S * (0.22 + 0.5 * lift), oy = S * (0.1 + 0.18 * lift);
  const a = alpha / (1 + 0.55 * lift);
  ctx.save();
  ctx.translate(x + ox, groundY + oy); ctx.scale(1, ry / rx);
  let g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.55, `rgba(0,0,0,${a * 0.55})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 6.2832); ctx.fill();
  ctx.restore();
  if (lift < 1.2) {   // tight contact shadow right under the die
    ctx.save();
    ctx.translate(x + S * 0.05, groundY + S * 0.06); ctx.scale(1, sinE * 0.8);
    g = ctx.createRadialGradient(0, 0, 0, 0, 0, S * 1.02);
    g.addColorStop(0, `rgba(0,0,0,${0.55 * (1 - lift / 1.2)})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, S * 1.02, 0, 6.2832); ctx.fill();
    ctx.restore();
  }
}

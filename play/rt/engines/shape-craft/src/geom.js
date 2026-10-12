// Shared geometry and drawing helpers for the shape-craft engine (pure, deterministic, no DOM).
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// Stable hash in [0,1) for per-cell texture (no rng needed at render time).
export function hash(a, b = 0, c = 0) {
  let h = (Math.imul(a + 1, 374761393) + Math.imul(b + 7, 668265263) + Math.imul(c + 13, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(clamp(f >= 0 ? v + (255 - v) * f : v * (1 + f), 0, 255)));
  return `rgb(${ch[0]},${ch[1]},${ch[2]})`;
}

// ---- vessel profiles: radius fractions bottom -> top, interpolated and quantised -------------------------
export const PROFILES = {
  vase: [0.5, 0.85, 1, 0.8, 0.45, 0.4, 0.62],
  jar: [0.55, 0.85, 1, 0.95, 0.62, 0.52, 0.56],
  bowl: [0.35, 0.5, 0.7, 0.85, 0.95, 1, 1],
  amphora: [0.3, 0.7, 1, 0.8, 0.4, 0.3, 0.46],
  bottle: [0.75, 0.82, 0.82, 0.62, 0.3, 0.24, 0.3],
  cup: [0.55, 0.68, 0.8, 0.86, 0.92, 0.96, 1],
  doll: [0.78, 1, 0.95, 0.78, 0.6, 0.72, 0.66, 0.38],
  basket: [0.5, 0.78, 0.96, 0.9, 0.72, 0.5, 0.26],
  urn: [0.4, 0.6, 0.9, 1, 0.8, 0.5, 0.58],
};
export function profileRadii(name, n, steps, jitter, rng, explicit) {
  const keys = explicit && explicit.length > 1 ? explicit : PROFILES[name] ?? PROFILES.vase;
  const k = keys.map((v) => clamp(v + (jitter ? (rng.next() - 0.5) * 2 * jitter : 0), 0.2, 1));
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1), x = t * (k.length - 1), i0 = Math.min(k.length - 2, Math.floor(x)), f = x - i0;
    const s = (1 - Math.cos(f * Math.PI)) / 2;
    out.push(clamp(Math.round((k[i0] * (1 - s) + k[i0 + 1] * s) * steps), 1, steps));
  }
  return out;
}

export function smoothThrough(ctx, pts, move = true) {
  if (move) ctx.moveTo(pts[0][0], pts[0][1]);
  if (pts.length < 3) { pts.slice(1).forEach((p) => ctx.lineTo(p[0], p[1])); return; }
  for (let i = 1; i < pts.length - 1; i++) {
    const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  const l = pts[pts.length - 1];
  ctx.lineTo(l[0], l[1]);
}

// ---- polygons ----------------------------------------------------------------------------------------------
export function inPoly(pts, x, y) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export function inConvex(pts, x, y) {
  let pos = 0, neg = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const c = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
    if (c > 1e-9) pos++; else if (c < -1e-9) neg++;
    if (pos && neg) return false;
  }
  return true;
}
// Sutherland-Hodgman against the half-plane a*x + b*y + c >= 0.
export function clipHalf(poly, [a, b, c]) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const dp = a * p[0] + b * p[1] + c, dq = a * q[0] + b * q[1] + c;
    if (dp >= 0) out.push(p);
    if ((dp >= 0) !== (dq >= 0)) { const t = dp / (dp - dq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
  }
  return out;
}
export const polyArea = (p) => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; };

// Normalised overlap: 0 = as good as the untouched start, 1 = identical to the target (a is "kept" mask, b target mask).
export function normIoU(a, b, tolerance = 0) {
  let inter = 0, uni = 0, tb = 0;
  for (let i = 0; i < a.length; i++) { const x = a[i] ? 1 : 0, y = b[i] ? 1 : 0; inter += x & y; uni += x | y; tb += y; }
  const iou = uni ? inter / uni : 1, iou0 = tb / a.length;
  const adj = Math.min(1, iou / (1 - tolerance));
  return { iou, score: Math.round(100 * clamp((adj - iou0) / Math.max(1e-6, 1 - iou0), 0, 1)) };
}
export const starsFor = (score) => (score >= 88 ? 3 : score >= 65 ? 2 : score >= 40 ? 1 : 0);

// ---- carve figures: shapes in the unit square, later shapes override earlier ones ----------------------------
const E = (x, y, rx, ry, v = 1) => ({ k: 'e', x, y, rx, ry, v });
const R = (x, y, w, h, v = 1) => ({ k: 'p', pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], v });
const Pg = (pts, v = 1) => ({ k: 'p', pts, v });
const starPts = (cx, cy, ro, ri, n = 5) => Array.from({ length: n * 2 }, (_, i) => { const a = (i * Math.PI) / n - Math.PI / 2, r = i % 2 ? ri : ro; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
export const FIGURES = {
  elephant: { mirror: false, shapes: (j) => [E(0.42, 0.5, 0.27 + j[1] * 0.02, 0.19), E(0.74, 0.42, 0.14, 0.17), Pg([[0.82, 0.48], [0.94, 0.56], [0.95 + j[2] * 0.02, 0.8 + j[0] * 0.05], [0.89, 0.82 + j[0] * 0.05], [0.88, 0.64], [0.78, 0.56]]),
    R(0.22, 0.6, 0.1, 0.3), R(0.36, 0.62, 0.1, 0.28), R(0.52, 0.62, 0.1, 0.28), R(0.62, 0.6, 0.1, 0.3), Pg([[0.17, 0.4], [0.1, 0.58], [0.13, 0.59], [0.2, 0.46]]), E(0.66, 0.3, 0.06, 0.06)] },
  bird: { mirror: false, shapes: (j) => [E(0.45, 0.52, 0.25, 0.18), E(0.72, 0.34, 0.1, 0.1), Pg([[0.8, 0.31], [0.95, 0.36 + j[0] * 0.03], [0.8, 0.4]]), Pg([[0.24, 0.5], [0.04, 0.62 + j[1] * 0.04], [0.06, 0.72], [0.28, 0.6]]), R(0.4, 0.66, 0.04, 0.22), R(0.53, 0.66, 0.04, 0.22), R(0.22, 0.86, 0.56, 0.06), E(0.75, 0.32, 0.025, 0.025, 0)] },
  fish: { mirror: false, shapes: (j) => [E(0.46, 0.5, 0.3, 0.2 + j[0] * 0.02), Pg([[0.2, 0.5], [0.02, 0.28 + j[1] * 0.04], [0.07, 0.5], [0.02, 0.72]]), Pg([[0.38, 0.34], [0.5, 0.14], [0.62, 0.34]]), Pg([[0.44, 0.66], [0.52, 0.84], [0.62, 0.66]]), E(0.66, 0.45, 0.035, 0.035, 0)] },
  mask: { mirror: true, shapes: (j) => [E(0.5, 0.56, 0.25, 0.33), Pg([[0.27, 0.3], [0.33 + j[0] * 0.02, 0.04], [0.42, 0.26]]), Pg([[0.38, 0.24], [0.5, -0.0 + j[1] * 0.02], [0.62, 0.24]]), E(0.2, 0.56, 0.05, 0.1), E(0.4, 0.49, 0.055, 0.035, 0), E(0.46, 0.62, 0.022, 0.025, 0), R(0.4, 0.75, 0.2, 0.05, 0), Pg([[0.4, 0.8], [0.36, 0.97], [0.45, 0.82]])] },
  dancer: { mirror: true, shapes: (j) => [E(0.5, 0.14, 0.09, 0.09), R(0.44, 0.2, 0.12, 0.07), Pg([[0.36, 0.25], [0.64, 0.25], [0.6, 0.56], [0.4, 0.56]]), Pg([[0.38, 0.26], [0.14, 0.08 + j[0] * 0.04], [0.1, 0.17], [0.34, 0.4]]), Pg([[0.4, 0.5], [0.6, 0.5], [0.76, 0.8], [0.24, 0.8]]), R(0.34, 0.78, 0.13, 0.19), R(0.53, 0.78, 0.13, 0.19), Pg([[0.4, 0.08], [0.5, 0.0], [0.6, 0.08]])] },
  horse: { mirror: false, shapes: (j) => [E(0.46, 0.5, 0.25, 0.14), Pg([[0.6, 0.45], [0.72, 0.18], [0.82, 0.2 + j[0] * 0.03], [0.76, 0.34], [0.68, 0.55]]), Pg([[0.74, 0.2], [0.94, 0.28], [0.93, 0.36], [0.78, 0.33]]), R(0.26, 0.58, 0.06, 0.34), R(0.36, 0.6, 0.06, 0.32), R(0.54, 0.6, 0.06, 0.32), R(0.62, 0.58, 0.06, 0.34), Pg([[0.22, 0.45], [0.1, 0.6], [0.14, 0.62], [0.25, 0.55]])] },
  star: { mirror: false, shapes: () => [Pg(starPts(0.5, 0.54, 0.44, 0.19))] },
  umbrella: { mirror: false, shapes: () => [E(0.5, 0.45, 0.42, 0.34), R(0, 0.45, 1, 0.4, 0), R(0.47, 0.45, 0.06, 0.4), E(0.4, 0.83, 0.09, 0.08), E(0.4, 0.83, 0.04, 0.04, 0), R(0.3, 0.74, 0.1, 0.13, 0), R(0.47, 0.45, 0.06, 0.38)] },
  heart: { mirror: false, shapes: () => [E(0.33, 0.38, 0.2, 0.2), E(0.67, 0.38, 0.2, 0.2), Pg([[0.14, 0.46], [0.86, 0.46], [0.5, 0.9]])] },
};
export function rasterFigure(name, cols, rows, j) {
  const fig = FIGURES[name] ?? FIGURES.elephant, shapes = fig.shapes(j);
  const out = new Array(cols * rows).fill(0);
  const hit = (s, u, v) => (s.k === 'e' ? ((u - s.x) / s.rx) ** 2 + ((v - s.y) / s.ry) ** 2 <= 1 : inPoly(s.pts, u, v));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const u = (c + 0.5) / cols, v = (r + 0.5) / rows;
    let on = 0;
    for (const s of shapes) if (hit(s, u, v) || (fig.mirror && hit(s, 1 - u, v))) on = s.v;
    out[r * cols + c] = on;
  }
  return out;
}
// Symmetric partners of a cell (square grids for rotations).
export function orbit(sym, c, r, cols, rows) {
  const mx = cols - 1 - c, my = rows - 1 - r, sq = cols === rows;
  const sets = { none: [[c, r]], 'mirror-x': [[c, r], [mx, r]], 'mirror-xy': [[c, r], [mx, r], [c, my], [mx, my]], rot4: sq ? [[c, r], [my, c], [mx, my], [r, mx]] : [[c, r], [mx, my]], 'rot4-mirror': sq ? [[c, r], [my, c], [mx, my], [r, mx], [mx, r], [c, my], [r, c], [my, mx]] : [[c, r], [mx, r], [c, my], [mx, my]] };
  const seen = new Set(), out = [];
  for (const p of sets[sym] ?? sets.none) { const k = p[0] + ',' + p[1]; if (!seen.has(k) && p[0] >= 0 && p[1] >= 0 && p[0] < cols && p[1] < rows) { seen.add(k); out.push(p); } }
  return out;
}

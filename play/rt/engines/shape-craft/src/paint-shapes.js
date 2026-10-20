// shape-craft `paint`: builders for guide strokes and fill regions used by the figure tables in src/paint-figures/.
// A stroke is { pts, col, w, closed?, style? }, a region is { pts, col, label, base?, volume? }; coordinates are design units (x 0..ar, y 0..1).
import { catmull, resample } from './paint-stroke.js';

export const TAU = Math.PI * 2;
const R = (pts) => resample(pts, 0.009);

export const stroke = (pts, o = {}) => ({ pts: R(pts), col: o.col ?? 0, w: o.w ?? 0.014, closed: !!o.closed, style: o.style, noSym: !!o.noSym });
export const curve = (ctrl, o) => stroke(catmull(ctrl, false, 12), o);
export const loop = (ctrl, o) => stroke(catmull(ctrl, true, 12), { ...o, closed: true });
// Sharp-cornered closed outline (triangles, frames, stars); `loop` rounds its corners.
export const polygon = (pts, o) => stroke([...pts, pts[0]], { ...o, closed: true });
export const line = (a, b, o) => stroke([a, b], o);
export const arc = (cx, cy, rx, ry, a0, a1, o = {}, rot = 0) => {
  const n = Math.max(8, Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry) / 0.01)), c = Math.cos(rot), s = Math.sin(rot), pts = [];
  for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n, x = Math.cos(a) * rx, y = Math.sin(a) * ry; pts.push([cx + x * c - y * s, cy + x * s + y * c]); }
  return stroke(pts, { ...o, closed: Math.abs(a1 - a0 - TAU) < 1e-6 });
};
export const ring = (cx, cy, rx, ry, o, rot = 0) => arc(cx, cy, rx, ry, 0, TAU, o, rot);
// Archimedean spiral from radius r0 to r1, `turns` turns, starting at angle a0.
export const spiral = (cx, cy, r0, r1, turns, a0, o = {}, dir = 1) => {
  const n = Math.ceil(turns * 40), pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n, r = r0 + (r1 - r0) * t, a = a0 + dir * turns * TAU * t; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return stroke(pts, o);
};
// A comma / petal stroke from p to q bowing by `bow` (fraction of length) to one side.
export const comma = (p, q, bow, o) => {
  const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, dx = q[0] - p[0], dy = q[1] - p[1];
  return curve([p, [mx - dy * bow, my + dx * bow], q], o);
};
// Lens-shaped outline between p and q, max width `wid`, with `bend` sideways curvature; returns the closed loop of control points.
export const lensPts = (p, q, wid, bend = 0, n = 10) => {
  const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const left = [], right = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, w = (wid / 2) * Math.pow(Math.sin(Math.PI * t), 0.85), b = bend * L * Math.sin(Math.PI * t);
    const bx = p[0] + dx * t + nx * b, by = p[1] + dy * t + ny * b;
    left.push([bx + nx * w, by + ny * w]); right.push([bx - nx * w, by - ny * w]);
  }
  return [...left, ...right.reverse().slice(1, -1)];
};
export const leaf = (p, q, wid, bend, o) => loop(lensPts(p, q, wid, bend, 8), o);

export const region = (pts, o = {}) => ({ pts, col: o.col ?? null, label: o.label ?? '', base: o.base, volume: !!o.volume, noSym: !!o.noSym });
export const blob = (cx, cy, rx, ry, o = {}, rot = 0, n = 44) => {
  const c = Math.cos(rot), s = Math.sin(rot), pts = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry; pts.push([cx + x * c - y * s, cy + x * s + y * c]); }
  return region(pts, o);
};
export const leafRegion = (p, q, wid, bend, o) => region(lensPts(p, q, wid, bend, 8), o);
export const poly = (pts, o) => region(pts, o);
export const smoothPoly = (ctrl, o) => region(catmull(ctrl, true, 8).slice(0, -1), o);
export const rect = (x0, y0, x1, y1, o) => region([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], o);

// small deterministic helpers for figure variety (rng is the engine's seeded generator)
export const jit = (rng, v, a) => (rng.next() * 2 - 1) * a * v;
export const pick = (rng, arr) => arr[Math.floor(rng.next() * arr.length) % arr.length];

// Round the corners of a closed polygon (Chaikin) while keeping its overall shape: wooden toys, leaves, fruit.
export const roundPoly = (pts, iters = 2) => {
  let p = pts;
  for (let it = 0; it < iters; it++) { const q = []; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } p = q; }
  return p;
};
export const rotAbout = (pts, cx, cy, a) => { const c = Math.cos(a), s = Math.sin(a); return pts.map((p) => [cx + (p[0] - cx) * c - (p[1] - cy) * s, cy + (p[0] - cx) * s + (p[1] - cy) * c]); };
export const polar = (cx, cy, r, a) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];

// ---- 1.8.0 helpers: wavy and double lines, hatch and dot fills --------------------------------------------------------------------------
export const inPoly = (pts, x, y) => {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const normals = (pts) => pts.map((p, i) => {
  const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1;
  return [-dy / m, dx / m];
});
// polyline shifted sideways by d (design units; + = left of travel)
export const offsetLine = (pts, d) => { const n = normals(pts); return pts.map((p, i) => [p[0] + n[i][0] * d, p[1] + n[i][1] * d]); };
// Two parallel strokes d either side of a smooth centre line (Madhubani double outline): returns [stroke, stroke]
export const dbl = (ctrl, d, o) => { const c = catmull(ctrl, false, 12), r = resample(c, 0.009); return [stroke(offsetLine(r, d), o), stroke(offsetLine(r, -d), o)]; };
// Two concentric outlines of a closed shape (inner one inset by gap, estimated about the centroid): returns [outer, inner]
export const dblLoop = (ctrl, gap, o) => {
  const c = catmull(ctrl, true, 12), cx = c.reduce((a, p) => a + p[0], 0) / c.length, cy = c.reduce((a, p) => a + p[1], 0) / c.length;
  const inner = c.map((p) => { const dx = p[0] - cx, dy = p[1] - cy, m = Math.hypot(dx, dy) || 1; return [p[0] - (dx / m) * gap, p[1] - (dy / m) * gap]; });
  return [stroke(c, { ...o, closed: true }), stroke(inner, { ...o, closed: true })];
};
// Closed outline wobbling sideways with the given amplitude and wavelength: the bold wavy outline of folk enamel painting
export const wavyLoop = (pts, amp, wl, o) => {
  const r = resample([...pts, pts[0]], 0.006), nm = normals(r); let s = 0;
  const out = r.map((p, i) => { if (i) s += Math.hypot(p[0] - r[i - 1][0], p[1] - r[i - 1][1]); const w = Math.sin((s / wl) * TAU) * amp; return [p[0] + nm[i][0] * w, p[1] + nm[i][1] * w]; });
  out[out.length - 1] = out[0];
  return stroke(out, { ...o, closed: true });
};
export const wavyLine = (ctrl, amp, wl, o) => {
  const r = resample(catmull(ctrl, false, 12), 0.006), nm = normals(r); let s = 0;
  return stroke(r.map((p, i) => { if (i) s += Math.hypot(p[0] - r[i - 1][0], p[1] - r[i - 1][1]); const w = Math.sin((s / wl) * TAU) * amp; return [p[0] + nm[i][0] * w, p[1] + nm[i][1] * w]; }), o);
};
// Parallel hatch strokes clipped to a polygon (each at least `min` long); angle in radians
export const hatch = (poly, gap, ang, o, min = 0.025) => {
  const c = Math.cos(ang), s = Math.sin(ang), us = poly.map(([x, y]) => x * c + y * s), vs = poly.map(([x, y]) => -x * s + y * c);
  const u0 = Math.min(...us), u1 = Math.max(...us), v0 = Math.min(...vs), v1 = Math.max(...vs), out = [];
  for (let u = u0 + gap / 2; u < u1; u += gap) {
    let run = null;
    for (let v = v0; v <= v1 + 0.003; v += 0.004) {
      const x = u * c - v * s, y = u * s + v * c, inside = inPoly(poly, x, y);
      if (inside && !run) run = [[x, y], [x, y]]; else if (inside) run[1] = [x, y];
      if ((!inside || v + 0.004 > v1) && run) { if (Math.hypot(run[1][0] - run[0][0], run[1][1] - run[0][1]) >= min) out.push(line(run[0], run[1], o)); run = null; }
    }
  }
  return out;
};
// Dots on a staggered grid inside a polygon (inset keeps them off the outline)
export const dotsIn = (poly, gap, o, inset = 0.012) => {
  const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]), out = [];
  let row = 0;
  for (let y = Math.min(...ys) + gap / 2; y < Math.max(...ys); y += gap * 0.87, row++) for (let x = Math.min(...xs) + gap / 2 + (row % 2 ? gap / 2 : 0); x < Math.max(...xs); x += gap) {
    if (inPoly(poly, x, y) && [[inset, 0], [-inset, 0], [0, inset], [0, -inset]].every(([dx, dy]) => inPoly(poly, x + dx, y + dy))) out.push(curve([[x, y], [x + 0.004, y + 0.003]], o));
  }
  return out;
};
export const mirrorPts = (pts, ar = 1) => pts.map(([x, y]) => [ar - x, y]);
export const flipX = (pts, ar = 1) => pts.map(([x, y]) => [ar - x, y]);
// scale and move a list of points about (cx, cy)
export const xform = (pts, cx, cy, k, dx = 0, dy = 0) => pts.map(([x, y]) => [cx + (x - cx) * k + dx, cy + (y - cy) * k + dy]);
// open wobbling run along a list of points (no smoothing), for outlines that are partly hidden behind a shape in front
export const wavyRun = (pts, amp, wl, o) => {
  const r = resample(pts, 0.006), nm = normals(r); let s = 0;
  return stroke(r.map((p, i) => { if (i) s += Math.hypot(p[0] - r[i - 1][0], p[1] - r[i - 1][1]); const w = Math.sin((s / wl) * TAU) * amp; return [p[0] + nm[i][0] * w, p[1] + nm[i][1] * w]; }), o);
};
// Outline strokes of a region with every stretch that lies under any of the `covers` regions left out (painter's order: later = in front)
export const visibleOutline = (r, covers, amp, wl, o) => {
  const rs = resample([...r.pts, r.pts[0]], 0.006).slice(0, -1), inside = rs.map((p) => covers.some((c) => inPoly(c.pts, p[0], p[1])));
  if (!inside.some(Boolean)) return [wavyLoop(r.pts, amp, wl, o)];
  if (inside.every(Boolean)) return [];
  let st = inside.findIndex((b) => !b);
  while (inside[(st + rs.length - 1) % rs.length] === false) st = (st + rs.length - 1) % rs.length;   // start at the beginning of a visible run
  const out = []; let run = [];
  for (let k = 0; k < rs.length; k++) { const i = (st + k) % rs.length; if (!inside[i]) run.push(rs[i]); else if (run.length) { if (run.length > 4) out.push(wavyRun(run, amp, wl, o)); run = []; } }
  if (run.length > 4) out.push(wavyRun(run, amp, wl, o));
  return out;
};

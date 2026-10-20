// shape-craft `paint` (1.6.0): stroke maths, brush model and scoring. Pure functions, no DOM, no Math.random, no clocks.
// Design space: x in [0, ar], y in [0, 1] (height 1). Every distance below is in these units.
import { inPoly } from './geom.js';
import { buildNib, buildWedge, buildPoint } from './paint-nib.js';

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const smooth01 = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const polyLen = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]); return s; };

// ---- curves ---------------------------------------------------------------------------------------------------------------------
export function resample(pts, step) {
  if (pts.length < 2) return pts.map((p) => [p[0], p[1]]);
  const out = [[pts[0][0], pts[0][1]]];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], seg = dist(a, b);
    if (seg === 0) continue;
    let d = step - carry;
    while (d <= seg) { const t = d / seg; out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); d += step; }
    carry = seg - (d - step);
  }
  const last = pts[pts.length - 1], lo = out[out.length - 1];
  if (dist(last, lo) > step * 0.3) out.push([last[0], last[1]]); else out[out.length - 1] = [last[0], last[1]];
  return out;
}
// Catmull-Rom through control points (open or closed), `per` samples per segment.
export function catmull(ctrl, closed = false, per = 10) {
  const n = ctrl.length;
  if (n < 3) return ctrl.map((p) => [p[0], p[1]]);
  const P = (i) => (closed ? ctrl[((i % n) + n) % n] : ctrl[clamp(i, 0, n - 1)]);
  const out = [], segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(closed ? [out[0][0], out[0][1]] : [ctrl[n - 1][0], ctrl[n - 1][1]]);
  return out;
}
export function chaikin(pts, iters = 2) {
  let p = pts;
  for (let it = 0; it < iters; it++) {
    if (p.length < 3) break;
    const q = [p[0]];
    for (let i = 0; i < p.length - 1; i++) { const a = p[i], b = p[i + 1]; q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); }
    q.push(p[p.length - 1]);
    p = q;
  }
  return p;
}
const movingAvg = (p) => p.map((q, i) => (i === 0 || i === p.length - 1 ? q : [(p[i - 1][0] + q[0] + p[i + 1][0]) / 3, (p[i - 1][1] + q[1] + p[i + 1][1]) / 3]));

// ---- tools -----------------------------------------------------------------------------------------------------------------------
// base = nominal line width, use = paint load used per unit length (load 1 = full), pressure = width follows speed, taper = the lift narrows the line.
export const TOOLS = {
  brush: { base: 0.018, use: 0.4, pressure: true, taper: true, label: 'Brush', held: 'brush' },
  fine: { base: 0.009, use: 0.28, pressure: true, taper: true, rin: 2, rout: 5, label: 'Fine brush', held: 'brush' },
  dab: { base: 0.045, use: 1.8, pressure: true, taper: true, rin: 0.5, rout: 2.4, label: 'Brush', held: 'brush' },
  reed: { base: 0.0085, use: 0.22, pressure: false, taper: false, label: 'Reed pen', held: 'kalam' },
  pen: { base: 0.007, use: 0.25, pressure: false, taper: false, label: 'Pen', held: 'kalam' },
  wax: { base: 0.0095, use: 0.22, pressure: false, taper: false, blob: true, label: 'Wax pen', held: 'tjanting' },
  stylus: { base: 0.0075, use: 0.22, pressure: false, taper: false, blob: true, label: 'Stylus', held: 'kistka' },
  stick: { base: 0.013, use: 0.45, pressure: false, taper: false, rough: true, label: 'Bamboo stick', held: 'ricestick' },
  dots: { base: 0.012, use: 0.35, pressure: false, taper: false, dashed: true, label: 'Dot pen', held: 'kalam' },
  // 1.25.0 lettering tools (paint-nib.js). nib: `base` is the edge length, `edge` its angle in radians (screen y down), `use` the ink used per unit length.
  nib: { base: 0.04, use: 0.3, nib: true, edge: -0.52, label: 'Broad nib', held: 'kalam' },
  nibfine: { base: 0.024, use: 0.3, nib: true, edge: -0.52, label: 'Fine nib', held: 'kalam' },
  wedge: { base: 0.026, use: 0, noDip: true, wedge: true, maxLen: 0.085, label: 'Reed stylus', held: 'reedstylus' },
  point: { base: 0.0055, use: 0, noDip: true, point: true, label: 'Bone point', held: 'pengutik' },
};
export const toolOf = (name) => TOOLS[name] ?? TOOLS.brush;

// raw = [{x, y, t}] pointer positions in design units with the time they were seen. Returns { pts: [{x,y,w,d}], len, loadEnd }.
// Zero-lag smoothing (moving average + Chaikin), width from speed (pressure), dryness from the paint load, entry and exit ramps.
export function buildSamples(raw, T, load0 = 1, scale = 1) {
  if (T.nib) return buildNib(raw, T, load0, scale);
  if (T.wedge) return buildWedge(raw, T, load0, scale);
  if (T.point) return buildPoint(raw, T, load0, scale);
  if (!raw.length) return { pts: [], len: 0, loadEnd: load0 };
  const step = 0.005;
  const base = T.base * scale;
  if (raw.length < 2 || polyLen(raw.map((r) => [r.x, r.y])) < step * 1.5) { // a tap: one dab
    const r = raw[0], w = base * (T.dashed ? 1 : 1.18) * lerp(0.6, 1, smooth01(load0 / 0.3));
    return load0 <= 0.02 ? { pts: [], len: 0, loadEnd: load0 } : { pts: [{ x: r.x, y: r.y, w, d: 0, dab: true }], len: 0, loadEnd: Math.max(0, load0 - T.use * 0.04) };
  }
  const P0 = raw.map((r) => [r.x, r.y]);
  // raw speeds along the raw arc length
  const cum = [0];
  for (let i = 1; i < P0.length; i++) cum.push(cum[i - 1] + dist(P0[i - 1], P0[i]));
  const total = cum[cum.length - 1] || 1e-6;
  const spd = raw.map((r, i) => (i === 0 ? 0 : dist(P0[i - 1], P0[i]) / Math.max(1 / 120, r.t - raw[i - 1].t)));
  spd[0] = spd[1] ?? 0;
  const speedAt = (f) => { const s = f * total; let i = 1; while (i < cum.length - 1 && cum[i] < s) i++; return spd[i]; };
  const sm = chaikin(movingAvg(P0.length > 2 ? movingAvg(P0) : P0), 2);
  const R = resample(sm, step);
  const L = polyLen(R);
  const pts = [];
  let s = 0, load = load0;
  for (let i = 0; i < R.length; i++) {
    if (i) s += dist(R[i - 1], R[i]);
    load = load0 - T.use * s;
    if (load <= 0.01 && i > 0) break;
    const f = L ? s / L : 0;
    let w = base;
    if (T.pressure) w *= 1.22 - 0.42 * clamp(speedAt(f) / 1.6, 0, 1);
    const wetK = smooth01(load / 0.35);
    w *= lerp(0.6, 1, wetK);
    w *= 0.5 + 0.5 * smooth01(s / (base * (T.rin ?? 3.5)));                                   // the brush lands
    if (T.taper) w *= 0.28 + 0.72 * smooth01((L - s) / (base * (T.rout ?? 8)));                 // and lifts
    if (T.blob && (i < 3 || i > R.length - 4)) w *= 1.3;                            // a bead of wax where the pen touches and leaves
    pts.push({ x: R[i][0], y: R[i][1], w, d: 1 - wetK });
  }
  return { pts, len: Math.min(L, s), loadEnd: Math.max(0, load0 - T.use * s) };
}

// Outline polygon of a variable-width line: left side forward, right side back.
export function ribbon(pts) {
  const n = pts.length, Lp = [], Rp = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let tx = b.x - a.x, ty = b.y - a.y; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
    const nx = -ty, ny = tx, h = pts[i].w / 2;
    Lp.push([pts[i].x + nx * h, pts[i].y + ny * h]); Rp.push([pts[i].x - nx * h, pts[i].y - ny * h]);
  }
  return { L: Lp, R: Rp };
}

// ---- symmetry --------------------------------------------------------------------------------------------------------------------
// sym = { kind: 'none' | 'mirror-x' | 'mirror-y' | 'mirror-xy' | 'rot', n } about the centre of the design box.
export function symMaps(sym, ar) {
  const cx = ar / 2, cy = 0.5, id = (p) => [p[0], p[1]], k = sym?.kind ?? 'none';
  if (k === 'mirror-x') return [id, (p) => [2 * cx - p[0], p[1]]];
  if (k === 'mirror-y') return [id, (p) => [p[0], 2 * cy - p[1]]];
  if (k === 'mirror-xy') return [id, (p) => [2 * cx - p[0], p[1]], (p) => [p[0], 2 * cy - p[1]], (p) => [2 * cx - p[0], 2 * cy - p[1]]];
  if (k === 'rot') {
    const n = sym.n ?? 4, out = [];
    for (let i = 0; i < n; i++) { const c = Math.cos((i * 2 * Math.PI) / n), s = Math.sin((i * 2 * Math.PI) / n); out.push((p) => [cx + (p[0] - cx) * c - (p[1] - cy) * s, cy + (p[0] - cx) * s + (p[1] - cy) * c]); }
    return out;
  }
  return [id];
}
const sameLine = (a, b) => {
  if (a.length !== b.length && Math.abs(a.length - b.length) > 2) return false;
  const m = (p, q) => dist(p, q) < 0.006;
  const A0 = a[0], A1 = a[a.length - 1], Am = a[a.length >> 1], B0 = b[0], B1 = b[b.length - 1], Bm = b[b.length >> 1];
  return m(Am, Bm) && ((m(A0, B0) && m(A1, B1)) || (m(A0, B1) && m(A1, B0)));
};
// All images of a polyline under the symmetry, without copies that coincide with one already present.
export function orbitLines(pts, maps) {
  const out = [];
  for (const f of maps) { const q = pts.map(f); if (!out.some((o) => sameLine(o, q))) out.push(q); }
  return out;
}

// ---- regions ---------------------------------------------------------------------------------------------------------------------
export const polyBox = (pts) => { let x0 = 9, y0 = 9, x1 = -9, y1 = -9; for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); } return { x0, y0, x1, y1 }; };
export function distToPoly(pts, x, y) {
  let m = 9;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1e-9;
    const t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / l2, 0, 1);
    m = Math.min(m, Math.hypot(x - (a[0] + dx * t), y - (a[1] + dy * t)));
  }
  return m;
}

// ---- layers prepared for play and scoring -----------------------------------------------------------------------------------------
const CELL = 0.016;
export function prepareLayer(layer, sym, ar) {
  const maps = symMaps(sym, ar);
  const guides = layer.strokes.map((g, i) => {
    const pts = resample(g.pts, 0.009);
    return { i, pts, col: g.col ?? null, w: g.w ?? 0.012, len: polyLen(pts), closed: !!g.closed, style: g.style, id: g.id };
  });
  const regions = layer.regions.map((r, i) => ({ i, pts: r.pts, col: r.col ?? null, label: r.label ?? '', box: polyBox(r.pts), base: r.base, volume: !!r.volume, under: !!r.under, id: r.id, cells: [], paint: null, at: null, holes: [] }));
  // z-order: later regions sit on top. A cell belongs to the topmost region that contains it.
  regions.forEach((r) => {
    for (let y = r.box.y0 + CELL / 2; y < r.box.y1; y += CELL) for (let x = r.box.x0 + CELL / 2; x < r.box.x1; x += CELL) {
      if (!inPoly(r.pts, x, y)) continue;
      if (regions.some((o) => o.i > r.i && o.box.x0 <= x && o.box.x1 >= x && o.box.y0 <= y && o.box.y1 >= y && inPoly(o.pts, x, y))) continue;
      r.cells.push([x, y]);
    }
    r.paint = new Int16Array(r.cells.length).fill(-1);
    regions.forEach((o) => { if (o.i > r.i && o.box.x0 >= r.box.x0 - 1e-6 && o.box.x1 <= r.box.x1 + 1e-6 && o.box.y0 >= r.box.y0 - 1e-6 && o.box.y1 <= r.box.y1 + 1e-6 && inPoly(r.pts, (o.box.x0 + o.box.x1) / 2, (o.box.y0 + o.box.y1) / 2)) r.holes.push(o.i); });
    // a point to tap: the cell nearest the middle of the box
    const mx = (r.box.x0 + r.box.x1) / 2, my = (r.box.y0 + r.box.y1) / 2;
    let best = null, bd = 9;
    for (const c of r.cells) { const d = Math.hypot(c[0] - mx, c[1] - my); if (d < bd) { bd = d; best = c; } }
    r.at = best ? [best[0], best[1]] : [mx, my];
  });
  const total = guides.reduce((s, g) => s + g.len, 0);
  // partner of every guide sample under the symmetry (for the symmetry term)
  const partner = [];
  if (maps.length > 1) {
    const all = guides.flatMap((g) => g.pts.map((p, k) => ({ g: g.i, k, p })));
    const grid = new Map(), key = (x, y) => Math.floor(x / 0.03) * 4096 + Math.floor(y / 0.03);
    all.forEach((a, ix) => { const kk = key(a.p[0], a.p[1]); (grid.get(kk) ?? grid.set(kk, []).get(kk)).push(ix); });
    guides.forEach((g) => { partner[g.i] = g.pts.map((p) => {
      const q = maps[1](p); let best = -1, bd = 0.02;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (const ix of grid.get(key(q[0] + dx * 0.03, q[1] + dy * 0.03)) ?? []) { const d = dist(all[ix].p, q); if (d < bd) { bd = d; best = ix; } }
      return best < 0 ? null : [all[best].g, all[best].k];
    }); });
  }
  return { guides, regions, total, partner, maps, wLine: layer.wLine, wFill: layer.wFill };
}

export function resetCover(prep) { for (const r of prep.regions) r.paint.fill(-1); }
export function paintCells(prep, ri, x, y, rad, col) {
  const r = prep.regions[ri];
  if (!r) return;
  const R2 = rad * rad;
  for (let k = 0; k < r.cells.length; k++) { const c = r.cells[k], dx = c[0] - x, dy = c[1] - y; if (dx * dx + dy * dy <= R2) r.paint[k] = col; }
}
export function fillCells(prep, ri, col) { prep.regions[ri]?.paint.fill(col); }
export function regionAt(prep, x, y, snap = 0.025) {
  let hit = -1;
  for (const r of prep.regions) if (r.box.x0 - 0.001 <= x && r.box.x1 + 0.001 >= x && r.box.y0 - 0.001 <= y && r.box.y1 + 0.001 >= y && inPoly(r.pts, x, y)) hit = r.i;   // topmost
  if (hit >= 0) return hit;
  let best = -1, bd = snap;
  for (const r of prep.regions) { const d = distToPoly(r.pts, x, y); if (d < bd) { bd = d; best = r.i; } }
  return best;
}

// ---- scoring ---------------------------------------------------------------------------------------------------------------------
// lines = player line samples [{x,y,col,free}] (free: not clipped into a region). Returns the parts and a total 0..100.
export function scoreLayer(prep, lines, tol) {
  const cs = Math.max(tol, 0.01) * 2.2, key = (x, y) => Math.floor(x / cs) * 8192 + Math.floor(y / cs);
  const grid = new Map();
  for (const p of lines) { const kk = key(p.x, p.y); (grid.get(kk) ?? grid.set(kk, []).get(kk)).push(p); }
  const near = (x, y, r, col) => {
    const cx = Math.floor(x / cs), cy = Math.floor(y / cs), rr = r * r;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (const p of grid.get((cx + dx) * 8192 + cy + dy) ?? []) {
      if (col != null && p.col !== col) continue;
      const ex = p.x - x, ey = p.y - y;
      if (ex * ex + ey * ey <= rr) return true;
    }
    return false;
  };
  // line accuracy: share of the guide that has the right colour laid on it
  let covLen = 0;
  const strokeCov = prep.guides.map((g) => {
    const cov = g.pts.map((p) => near(p[0], p[1], tol, g.col));
    const f = cov.filter(Boolean).length / Math.max(1, cov.length);
    covLen += f * g.len;
    return { f, cov };
  });
  // stray paint: free line samples far from every guide
  let stray = 0;
  if (prep.guides.length) {
    const gg = new Map(), gk = (x, y) => Math.floor(x / cs) * 8192 + Math.floor(y / cs);
    for (const g of prep.guides) for (const p of g.pts) { const kk = gk(p[0], p[1]); (gg.get(kk) ?? gg.set(kk, []).get(kk)).push(p); }
    const far = (x, y, r) => {
      const cx = Math.floor(x / cs), cy = Math.floor(y / cs), rr = r * r;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (const p of gg.get((cx + dx) * 8192 + cy + dy) ?? []) { const ex = p[0] - x, ey = p[1] - y; if (ex * ex + ey * ey <= rr) return false; }
      return true;
    };
    for (const p of lines) if (p.free && far(p.x, p.y, tol * 2.2)) stray += 0.005;
  }
  const line = prep.total ? clamp(covLen / prep.total, 0, 1) : null;
  const penalty = prep.total ? clamp(stray / (0.4 * prep.total), 0, 1) : 0;
  const lineScore = line == null ? null : line * (1 - 0.6 * penalty);
  // fill coverage: cells holding the right colour
  let okCells = 0, nCells = 0;
  const regionCov = prep.regions.map((r) => {
    let ok = 0;
    for (let k = 0; k < r.cells.length; k++) { const v = r.paint[k]; if (v >= 0 && (r.col == null || v === r.col)) ok++; }
    okCells += ok; nCells += r.cells.length;
    return r.cells.length ? ok / r.cells.length : 1;
  });
  const fillScore = prep.regions.length ? (prep.regions.reduce((s, r, i) => s + regionCov[i] * Math.max(1, r.cells.length), 0) / Math.max(1, nCells)) : null;
  // symmetry: do both halves carry the same share of paint? (only a bonus on top of real coverage, so doing nothing earns nothing)
  let sym = null;
  if (prep.maps.length > 1 && prep.total) {
    let mism = 0, cnt = 0;
    prep.guides.forEach((g) => g.pts.forEach((_, k) => {
      const pr = prep.partner[g.i]?.[k]; if (!pr) return;
      cnt++; if (strokeCov[g.i].cov[k] !== strokeCov[pr[0]].cov[pr[1]]) mism++;
    }));
    sym = cnt ? 1 - mism / cnt : null;
  }
  const wl = lineScore == null ? 0 : (prep.wLine ?? (fillScore == null ? 1 : 0.5)), wf = fillScore == null ? 0 : (prep.wFill ?? (lineScore == null ? 1 : 0.5));
  let base = (wl * (lineScore ?? 0) + wf * (fillScore ?? 0)) / Math.max(1e-6, wl + wf);
  if (sym != null) base *= 0.88 + 0.12 * sym;
  return { score: Math.round(100 * clamp(base, 0, 1)), line: lineScore, fill: fillScore, sym, stray: penalty, strokeCov: strokeCov.map((s) => s.f), regionCov };
}

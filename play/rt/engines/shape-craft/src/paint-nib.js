// shape-craft 1.25.0: lettering tools for the `paint` technique. Self-contained (no imports from paint-stroke.js, so there is no import cycle).
//   nib    a broad-edge pen held at a fixed angle: the mark is the nib edge swept along the path, so a stroke is thick when it runs across the edge and a
//          hairline when it runs along it (no speed or pressure involved). Used for reed-pen and quill scripts.
//   wedge  a reed stylus pressed into wet clay: a short drag leaves one triangular wedge, head where you pressed, point where you lifted.
//   point  a hard bone or metal point scratching a leaf; the scratches stay pale until the soot is rubbed in (finish 'soot').
// Design space: x in [0, ar], y in [0, 1] (height 1). Pure functions and canvas 2D, no Math.random, no clocks.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth01 = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const polyLen = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]); return s; };
const hash = (a, b = 0) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const rgba = (c, a) => { const m = /^#?([0-9a-f]{6})$/i.exec(c ?? ''); const n = m ? parseInt(m[1], 16) : 0x808080; return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
const hexOf = (c) => { const m = /^#?([0-9a-f]{6})$/i.exec(c ?? ''); const n = m ? parseInt(m[1], 16) : 0x808080; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mixc = (a, b, t) => { const A = hexOf(a), B = hexOf(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const shade = (c, t) => mixc(c, t < 0 ? '#000000' : '#ffffff', Math.abs(t));

function resampleTo(pts, step) {
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
  const last = pts[pts.length - 1];
  if (dist(last, out[out.length - 1]) > step * 0.3) out.push([last[0], last[1]]); else out[out.length - 1] = [last[0], last[1]];
  return out;
}
const avg3 = (p) => p.map((q, i) => (i === 0 || i === p.length - 1 ? q : [(p[i - 1][0] + q[0] + p[i + 1][0]) / 3, (p[i - 1][1] + q[1] + p[i + 1][1]) / 3]));
function chaikinN(pts, iters) {
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

// ---- samples ----------------------------------------------------------------------------------------------------------------------
// raw = [{x, y, t}]. Returns { pts: [{x, y, w, d}], len, loadEnd }; w is the nib length (constant), d the dryness 0..1.
export function buildNib(raw, T, load0 = 1, scale = 1) {
  const len = (T.len ?? T.base) * scale, step = 0.004;
  if (!raw.length) return { pts: [], len: 0, loadEnd: load0 };
  if (raw.length < 2 || polyLen(raw.map((r) => [r.x, r.y])) < step * 1.5) {   // a touch: the nib corner leaves a small diamond
    const r = raw[0];
    return load0 <= 0.02 ? { pts: [], len: 0, loadEnd: load0 } : { pts: [{ x: r.x, y: r.y, w: len, d: 0, dab: true }], len: 0, loadEnd: Math.max(0, load0 - T.use * 0.05) };
  }
  const P0 = raw.map((r) => [r.x, r.y]);
  const R = resampleTo(chaikinN(avg3(P0.length > 2 ? avg3(P0) : P0), 2), step);
  const pts = [];
  let s = 0;
  for (let i = 0; i < R.length; i++) {
    if (i) s += dist(R[i - 1], R[i]);
    const load = load0 - T.use * s;
    if (load <= 0.01 && i > 0) break;
    pts.push({ x: R[i][0], y: R[i][1], w: len, d: 1 - smooth01(load / 0.3) });
  }
  return { pts, len: s, loadEnd: Math.max(0, load0 - T.use * s) };
}

// A wedge runs from where the stylus went in (head) to the farthest point of the drag, at most T.maxLen away.
export function buildWedge(raw, T, load0 = 1, scale = 1) {
  const head = (T.base) * scale;
  if (!raw.length) return { pts: [], len: 0, loadEnd: load0 };
  const a = raw[0];
  let best = null, bd = 0;
  for (const r of raw) { const d = Math.hypot(r.x - a.x, r.y - a.y); if (d > bd && d <= (T.maxLen ?? 0.1) * scale * 1.6) { bd = d; best = r; } }
  if (!best || bd < head * 0.9) return { pts: [{ x: a.x, y: a.y, w: head, d: 0, dab: true }], len: 0, loadEnd: load0 };
  const L = Math.min(bd, (T.maxLen ?? 0.1) * scale), ux = (best.x - a.x) / bd, uy = (best.y - a.y) / bd;
  return { pts: [{ x: a.x, y: a.y, w: head, d: 0, wedge: true }, { x: a.x + ux * L, y: a.y + uy * L, w: head, d: 0, wedge: true }], len: L, loadEnd: load0 };
}

// A hard point: a thin even line that never runs dry.
export function buildPoint(raw, T, load0 = 1, scale = 1) {
  const w = T.base * scale, step = 0.004;
  if (!raw.length) return { pts: [], len: 0, loadEnd: load0 };
  if (raw.length < 2 || polyLen(raw.map((r) => [r.x, r.y])) < step * 1.5) return { pts: [{ x: raw[0].x, y: raw[0].y, w: w * 1.4, d: 0, dab: true }], len: 0, loadEnd: load0 };
  const P0 = raw.map((r) => [r.x, r.y]);
  const R = resampleTo(chaikinN(avg3(P0.length > 2 ? avg3(P0) : P0), 2), step);
  const pts = R.map((p) => ({ x: p[0], y: p[1], w, d: 0 }));
  return { pts, len: polyLen(R), loadEnd: Math.max(0, load0 - T.use * polyLen(R)) };
}

// ---- drawing ----------------------------------------------------------------------------------------------------------------------
const X = (V, x) => V.ox + x * V.s, Y = (V, y) => V.oy + y * V.s;

// A broad-edge stroke: the union of the nib edge at every sample (one path, nonzero fill), so thick and thin come out of the geometry.
export function drawNib(ctx, V, S, look) {
  const pts = S.pts;
  if (!pts.length) return;
  const e = S.edge ?? 0.6, h = (pts[0].w * V.s) / 2, ex = Math.cos(e) * h, ey = Math.sin(e) * h;
  const age = look.t - (S.born ?? -99), wet = clamp(1 - age / 2.4, 0, 1);
  const c0 = look.color, c = look.flat ? c0 : wet > 0 ? mixc(c0, shade(c0, -0.35), 0.3 * wet) : c0;
  ctx.save();
  ctx.lineJoin = 'round';
  const fillStyle = (b, en) => {
    if (!look.metal) return rgba(c, 0.97);
    const g = ctx.createLinearGradient(X(V, b.x), Y(V, b.y) - 20, X(V, en.x) + 30, Y(V, en.y) + 20);
    g.addColorStop(0, shade(c0, 0.55)); g.addColorStop(0.35, c0); g.addColorStop(0.6, shade(c0, 0.4)); g.addColorStop(1, shade(c0, -0.35));
    return g;
  };
  if (pts.length === 1 || pts.every((p) => p.dab)) {   // a touch: a small diamond
    const p = pts[0], x = X(V, p.x), y = Y(V, p.y), nx = -Math.sin(e) * h * 0.95, ny = Math.cos(e) * h * 0.95;
    ctx.beginPath(); ctx.moveTo(x + ex, y + ey); ctx.lineTo(x + nx, y + ny); ctx.lineTo(x - ex, y - ey); ctx.lineTo(x - nx, y - ny); ctx.closePath();
    ctx.fillStyle = fillStyle(p, p); ctx.fill();
    if (wet > 0 && !look.flat) { ctx.fillStyle = `rgba(255,255,255,${0.3 * wet})`; ctx.beginPath(); ctx.arc(x - h * 0.15, y - h * 0.22, Math.max(1, h * 0.14), 0, 6.3); ctx.fill(); }
    ctx.restore(); return;
  }
  const split = pts.findIndex((p) => p.d > 0.45), wetEnd = split < 0 ? pts.length : Math.max(2, split);
  const quadPath = (arr, k, off) => {
    ctx.beginPath();
    for (let i = 1; i < arr.length; i++) {
      const a = arr[i - 1], b = arr[i], ox = ex * off, oy = ey * off;
      ctx.moveTo(X(V, a.x) + ox + ex * k, Y(V, a.y) + oy + ey * k); ctx.lineTo(X(V, b.x) + ox + ex * k, Y(V, b.y) + oy + ey * k);
      ctx.lineTo(X(V, b.x) + ox - ex * k, Y(V, b.y) + oy - ey * k); ctx.lineTo(X(V, a.x) + ox - ex * k, Y(V, a.y) + oy - ey * k); ctx.closePath();
    }
  };
  const wetPts = pts.slice(0, wetEnd);
  if (wetPts.length >= 2) {
    if (look.bleed > 0.3) { quadPath(wetPts, 1.12, 0); ctx.fillStyle = rgba(c, 0.1); ctx.fill(); }   // ink feathering into the paper fibres
    quadPath(wetPts, 1, 0); ctx.fillStyle = fillStyle(pts[0], pts[pts.length - 1]); ctx.fill();
    if (!look.flat) {   // a lit line along the middle of the wet ink; it dries away
      ctx.save(); quadPath(wetPts, 1, 0); ctx.clip();
      ctx.beginPath(); wetPts.forEach((p, i) => { const x = X(V, p.x) - h * 0.1, y = Y(V, p.y) - h * 0.2; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      ctx.strokeStyle = `rgba(255,255,255,${look.metal ? 0.5 : 0.34 * wet})`; ctx.lineWidth = Math.max(1, h * 0.35); ctx.stroke();
      ctx.restore();
    }
  }
  if (split >= 0) {   // the ink runs out: three narrow bristle marks with gaps
    const dry = pts.slice(Math.max(0, split - 1));
    for (let b = -1; b <= 1; b++) {
      let run = [];
      const flush = () => { if (run.length >= 2) { quadPath(run, 0.3, b * 0.62); ctx.fillStyle = rgba(c, 0.85); ctx.fill(); } run = []; };
      for (let i = 0; i < dry.length; i++) { if (hash(i + (b + 2) * 17, S.seed ?? 3) > 0.1 + 0.6 * dry[i].d) run.push(dry[i]); else flush(); }
      flush();
    }
  }
  ctx.restore();
}

// One wedge pressed into clay: a deep triangular dent, dark at the head and shallow at the point; the walls facing the light are lit, the others shadowed.
export function drawWedge(ctx, V, S, look) {
  const pts = S.pts;
  if (!pts.length) return;
  const p0 = pts[0], w = p0.w * V.s, x0 = X(V, p0.x), y0 = Y(V, p0.y);
  const age = look.t - (S.born ?? -99), press = clamp(age / 0.18, 0, 1);   // the clay gives way in a moment
  ctx.save();
  if (pts.length < 2 || pts.every((p) => p.dab)) {   // a stray touch: a round dimple
    const r = w * 0.34 * (0.4 + 0.6 * press);
    const g = ctx.createRadialGradient(x0 - r * 0.2, y0 - r * 0.25, r * 0.1, x0, y0, r); g.addColorStop(0, 'rgba(25,14,6,0.9)'); g.addColorStop(1, 'rgba(25,14,6,0.35)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x0, y0, r, 0, 6.3); ctx.fill();
    ctx.strokeStyle = 'rgba(255,232,190,0.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x0 + 0.8, y0 + 1, r, 0.2, 2.4); ctx.stroke();
    ctx.restore(); return;
  }
  const p1 = pts[pts.length - 1], x1 = X(V, p1.x), y1 = Y(V, p1.y), dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const hw = (w * 0.5) * (0.5 + 0.5 * press), tip = L * (0.55 + 0.45 * press);
  const a = [x0 + nx * hw, y0 + ny * hw], b = [x0 - nx * hw, y0 - ny * hw], c = [x0 + ux * tip, y0 + uy * tip];
  // soft clay shoulder (the clay pushed up round the dent)
  ctx.beginPath(); ctx.moveTo(a[0] - ux * w * 0.12, a[1] - uy * w * 0.12); ctx.lineTo(c[0] + ux * 1.5, c[1] + uy * 1.5); ctx.lineTo(b[0] - ux * w * 0.12, b[1] - uy * w * 0.12); ctx.closePath();
  ctx.fillStyle = 'rgba(255,238,200,0.16)'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(b[0], b[1]); ctx.closePath();
  const g = ctx.createLinearGradient(x0, y0, c[0], c[1]); g.addColorStop(0, rgba(look.color, 0.92)); g.addColorStop(0.55, rgba(look.color, 0.62)); g.addColorStop(1, rgba(look.color, 0.22));
  ctx.fillStyle = g; ctx.fill();
  // walls: the light comes from the upper left
  const LX = -0.55, LY = -0.83, cx = (a[0] + b[0] + c[0]) / 3, cy = (a[1] + b[1] + c[1]) / 3;
  for (const [p, q] of [[a, c], [c, b], [b, a]]) {
    let ex = (q[1] - p[1]), ey = -(q[0] - p[0]); const m = Math.hypot(ex, ey) || 1; ex /= m; ey /= m;
    if ((p[0] + q[0]) / 2 - cx !== 0 && ex * ((p[0] + q[0]) / 2 - cx) + ey * ((p[1] + q[1]) / 2 - cy) < 0) { ex = -ex; ey = -ey; }
    const facing = ex * LX + ey * LY;
    ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]);
    if (facing > 0.1) { ctx.strokeStyle = 'rgba(12,6,0,0.62)'; ctx.lineWidth = 1.8; ctx.stroke(); }
    else if (facing < -0.1) { ctx.save(); ctx.translate(ex * 1.1, ey * 1.1); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.strokeStyle = `rgba(255,236,196,${0.7 * Math.min(1, -facing + 0.3)})`; ctx.lineWidth = 1.4; ctx.stroke(); ctx.restore(); }
  }
  ctx.restore();
}

// A scratch made with a hard point. look.soot (0..1) is how far the soot has been rubbed in: pale groove at 0, black line at 1.
export function drawPoint(ctx, V, S, look) {
  const pts = S.pts;
  if (!pts.length) return;
  const w = Math.max(1.5, pts[0].w * V.s), soot = look.soot ?? 0, col = soot > 0 ? mixc(look.color, look.sootColor ?? '#17100a', smooth01(soot)) : look.color;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const path = (dx, dy) => { ctx.beginPath(); pts.forEach((p, i) => { const x = X(V, p.x) + dx, y = Y(V, p.y) + dy; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); if (pts.length === 1) ctx.lineTo(X(V, pts[0].x) + dx + 0.1, Y(V, pts[0].y) + dy); };
  if (soot < 0.98) { path(0.9, 1.1); ctx.strokeStyle = `rgba(255,248,222,${0.5 * (1 - soot)})`; ctx.lineWidth = w; ctx.stroke(); }   // the lit lip of the groove
  path(0, 0); ctx.strokeStyle = col; ctx.lineWidth = w * (1 + 0.25 * smooth01(soot)); ctx.stroke();
  ctx.restore();
}

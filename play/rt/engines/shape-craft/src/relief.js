// relief: turn a binary cell mask into smooth closed outlines (marching squares on a blurred field), so a carved block reads as a
// rounded solid object instead of a heap of squares. Pure arithmetic, no DOM; results are cached per mask.
const cache = new Map();

function blur1d(src, dst, W, H, r, horizontal) {
  const n = 2 * r + 1;
  for (let a = 0; a < (horizontal ? H : W); a++) {
    let sum = 0;
    const at = (b) => (horizontal ? a * W + b : b * W + a), len = horizontal ? W : H;
    for (let b = -r; b <= r; b++) sum += src[at(Math.min(len - 1, Math.max(0, b)))];
    for (let b = 0; b < len; b++) {
      dst[at(b)] = sum / n;
      sum += src[at(Math.min(len - 1, b + r + 1))] - src[at(Math.max(0, b - r))];
    }
  }
}

// loops of [x, y] points in cell units (0..cols, 0..rows); the area where mask is 1 is inside (use fill 'evenodd')
export function contourLoops(mask, cols, rows, opt = {}) {
  const key = `${cols}x${rows}:${opt.k ?? 4}:${mask.join('')}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const k = opt.k ?? 4, P = 2, thr = opt.thr ?? 0.44, r = Math.max(1, Math.round(k * 0.5));
  const W = (cols + 2 * P) * k + 1, H = (rows + 2 * P) * k + 1;
  let f = new Float32Array(W * H), tmp = new Float32Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const cx = Math.min(cols - 1, Math.max(0, Math.floor(i / k - P))), cy = Math.min(rows - 1, Math.max(0, Math.floor(j / k - P)));
    f[j * W + i] = mask[cy * cols + cx] ? 1 : 0;
  }
  for (let pass = 0; pass < 2; pass++) { blur1d(f, tmp, W, H, r, true); blur1d(tmp, f, W, H, r, false); }
  for (let i = 0; i < W; i++) { f[i] = 0; f[(H - 1) * W + i] = 0; }
  for (let j = 0; j < H; j++) { f[j * W] = 0; f[j * W + W - 1] = 0; }
  // marching squares; each contour point sits on a grid edge, identified by its edge key
  const segs = new Map(); // key -> [other keys]
  const pts = new Map();  // key -> [x, y]
  const ptTop = (i, j, a, b) => { const kk = `h${i},${j}`; if (!pts.has(kk)) pts.set(kk, [i + (thr - a) / (b - a), j]); return kk; };
  const ptLeft = (i, j, a, d) => { const kk = `v${i},${j}`; if (!pts.has(kk)) pts.set(kk, [i, j + (thr - a) / (d - a)]); return kk; };
  const link = (p, q) => { if (!segs.has(p)) segs.set(p, []); if (!segs.has(q)) segs.set(q, []); segs.get(p).push(q); segs.get(q).push(p); };
  for (let j = 0; j < H - 1; j++) for (let i = 0; i < W - 1; i++) {
    const a = f[j * W + i], b = f[j * W + i + 1], c = f[(j + 1) * W + i + 1], d = f[(j + 1) * W + i];
    const idx = (a > thr ? 8 : 0) | (b > thr ? 4 : 0) | (c > thr ? 2 : 0) | (d > thr ? 1 : 0);
    if (idx === 0 || idx === 15) continue;
    const T = () => ptTop(i, j, a, b), B = () => ptTop(i, j + 1, d, c), L = () => ptLeft(i, j, a, d), R = () => ptLeft(i + 1, j, b, c);
    switch (idx) {
      case 1: case 14: link(L(), B()); break;
      case 2: case 13: link(B(), R()); break;
      case 3: case 12: link(L(), R()); break;
      case 4: case 11: link(T(), R()); break;
      case 6: case 9: link(T(), B()); break;
      case 7: case 8: link(T(), L()); break;
      case 5: if ((a + b + c + d) / 4 > thr) { link(T(), L()); link(B(), R()); } else { link(T(), R()); link(L(), B()); } break;
      case 10: if ((a + b + c + d) / 4 > thr) { link(T(), R()); link(L(), B()); } else { link(T(), L()); link(B(), R()); } break;
      default: break;
    }
  }
  const loops = [], seen = new Set();
  for (const start of segs.keys()) {
    if (seen.has(start)) continue;
    const loop = []; let prev = null, cur = start, guard = 0;
    while (cur && !seen.has(cur) && guard++ < 100000) {
      seen.add(cur);
      const [x, y] = pts.get(cur); loop.push([x / k - P, y / k - P]);
      const nb = segs.get(cur); const next = nb.find((q) => q !== prev && !seen.has(q));
      prev = cur; cur = next;
    }
    if (loop.length >= 3) loops.push(smooth(loop));
  }
  if (cache.size > 24) cache.clear();
  cache.set(key, loops);
  return loops;
}

// one Chaikin corner-cutting pass keeps the shape but removes the facets
function smooth(loop) {
  const out = [], n = loop.length;
  for (let i = 0; i < n; i++) {
    const p = loop[i], q = loop[(i + 1) % n];
    out.push([p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25], [p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75]);
  }
  return out;
}

export function tracePath(ctx, loops, x, y, cs) {
  for (const L of loops) {
    ctx.moveTo(x + L[0][0] * cs, y + L[0][1] * cs);
    for (let i = 1; i < L.length; i++) ctx.lineTo(x + L[i][0] * cs, y + L[i][1] * cs);
    ctx.closePath();
  }
}

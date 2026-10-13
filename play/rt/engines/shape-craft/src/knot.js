// knot: tie a decorative cord knot. The cord is routed through a grid of points; wherever it crosses itself it goes over
// then under alternately (drawn with real gaps). The target is a generated single closed cord on a lattice of crossings.
import { starsFor, hash } from './geom.js';
import { tint, rrect, rgba, mix, shadowed, litEdge, lum } from './fx.js';
import { wallLift } from './scenes.js';
const shade = tint;

export const KNOT_DEFAULTS = { size: 4, layout: 'square', symmetry: 'rot4', cordColor: '#c8321f', background: '#1c1410', tassel: false, density: 1, guide: true, variation: 1 };

const ID = { p: (c, r) => [c, r], d: (x, y) => [x, y] };

// Symmetry maps of a W x H node rectangle: p maps a node, d maps a direction.
function groupFor(name, W, H) {
  const mx = { p: (c, r) => [W - 1 - c, r], d: (x, y) => [-x, y] };
  const my = { p: (c, r) => [c, H - 1 - r], d: (x, y) => [x, -y] };
  const r2 = { p: (c, r) => [W - 1 - c, H - 1 - r], d: (x, y) => [-x, -y] };
  const r1 = { p: (c, r) => [W - 1 - r, c], d: (x, y) => [-y, x] };
  const r3 = { p: (c, r) => [r, H - 1 - c], d: (x, y) => [y, -x] };
  const dg = { p: (c, r) => [r, c], d: (x, y) => [y, x] };
  const ad = { p: (c, r) => [W - 1 - r, H - 1 - c], d: (x, y) => [-y, -x] };
  const sq = W === H;
  switch (name) {
    case 'mirror-x': return [ID, mx];
    case 'mirror-xy': return [ID, mx, my, r2];
    case 'rot2': return [ID, r2];
    case 'rot4': return sq ? [ID, r1, r2, r3] : [ID, r2];
    case 'rot4-mirror': return sq ? [ID, r1, r2, r3, mx, my, dg, ad] : [ID, mx, my, r2];
    default: return [ID];
  }
}
const CHAIN = { none: ['none'], 'mirror-x': ['mirror-x', 'none'], 'mirror-xy': ['mirror-xy', 'mirror-x', 'rot2', 'none'], rot4: ['rot4', 'rot2', 'none'], 'rot4-mirror': ['rot4-mirror', 'mirror-xy', 'rot2', 'none'] };

export function layoutDims(layout, size) {
  if (layout === 'pan-chang') return { m: 3, k: size + 1 + (size % 2) };
  if (layout === 'celtic') return { m: size + 2, k: size };
  return { m: size, k: size };
}

// Generate a knot: a lattice of m x k crossings inside a ring of turning points, joined into ONE closed cord.
// Returns { W, H, route (node indices of the closed cord), crossings, required, symmetry }.
function generateOnce(P, rng) {
  const { m, k } = layoutDims(P.layout, P.size);
  const W = m + 2, H = k + 2, idx = (c, r) => r * W + c, at = (n) => [n % W, (n / W) | 0];
  const ring = [];
  for (let c = 1; c <= m; c++) ring.push([c, 0]);
  for (let r = 1; r <= k; r++) ring.push([m + 1, r]);
  for (let c = m; c >= 1; c--) ring.push([c, k + 1]);
  for (let r = k; r >= 1; r--) ring.push([0, r]);
  const N = ring.length;
  const inward = ([c, r]) => (r === 0 ? [c, 1] : c === m + 1 ? [m, r] : r === k + 1 ? [c, k] : [1, r]);
  const cornerOf = (a, b) => {
    for (const q of [[a[0], b[1]], [b[0], a[1]]]) if ((q[0] === 0 || q[0] === m + 1) && (q[1] === 0 || q[1] === k + 1)) return q;
    return null;
  };
  const pairsFor = (s) => { const out = []; for (let j = s; j < N; j += 2) out.push([ring[j], ring[(j + 1) % N]]); return out; };
  const pairKey = (a, b) => { const x = idx(...a), y = idx(...b); return x < y ? `${x}-${y}` : `${y}-${x}`; };

  // choose the strongest symmetry (from the requested chain) that the ring pairing can respect
  let group = [ID], symName = 'none', pairs = pairsFor(rng.int(2));
  for (const name of CHAIN[P.symmetry] ?? CHAIN.none) {
    const g = groupFor(name, W, H);
    const order = rng.int(2) ? [0, 1] : [1, 0];
    const ok = order.find((s) => {
      const ps = pairsFor(s), keys = new Set(ps.map(([a, b]) => pairKey(a, b)));
      return g.every((f) => ps.every(([a, b]) => keys.has(pairKey(f.p(...a), f.p(...b)))));
    });
    if (ok !== undefined) { group = g; symName = name; pairs = pairsFor(ok); break; }
  }

  const base = Array.from({ length: W * H }, () => []);
  for (let r = 1; r <= k; r++) for (let c = 1; c <= m; c++) base[idx(c, r)] = [[idx(c - 1, r), idx(c + 1, r)], [idx(c, r - 1), idx(c, r + 1)]];
  for (const [a, b] of pairs) {
    const ia = idx(...inward(a)), ib = idx(...inward(b)), cr = cornerOf(a, b);
    if (cr) {
      base[idx(...a)].push([ia, idx(...cr)]); base[idx(...b)].push([ib, idx(...cr)]); base[idx(...cr)].push([idx(...a), idx(...b)]);
    } else { base[idx(...a)].push([ia, idx(...b)]); base[idx(...b)].push([ib, idx(...a)]); }
  }

  const components = (conn) => {
    const lab = conn.map((ps) => ps.map(() => -1));
    let n = 0;
    for (let node = 0; node < conn.length; node++) for (let pi = 0; pi < conn[node].length; pi++) {
      if (lab[node][pi] >= 0) continue;
      lab[node][pi] = n;
      let from = node, to = conn[node][pi][1];
      for (;;) {
        const ps = conn[to], q = ps.findIndex((p) => p[0] === from || p[1] === from);
        if (q < 0 || lab[to][q] === n) break;
        lab[to][q] = n;
        const nx = ps[q][0] === from ? ps[q][1] : ps[q][0];
        from = to; to = nx;
      }
      n++;
    }
    return { lab, n };
  };
  const isX = (conn, node) => { const ps = conn[node]; return ps.length === 2 && ps.every((p) => p[0] + p[1] === 2 * node); };
  const dirs = { L: [-1, 0], R: [1, 0], U: [0, -1], D: [0, 1] };

  const PAIRINGS = [[['L', 'R'], ['U', 'D']], [['L', 'U'], ['R', 'D']], [['L', 'D'], ['R', 'U']]];
  const typeOf = (conn, node, c, r) => {
    const nbr = (d) => idx(c + dirs[d][0], r + dirs[d][1]);
    const set = new Set(conn[node].map((q) => q.slice().sort((x, y) => x - y).join('-')));
    return PAIRINGS.findIndex((pr) => pr.every(([a, b]) => set.has([nbr(a), nbr(b)].sort((x, y) => x - y).join('-'))));
  };
  let conn = base, cur = components(conn), fails = 0, g = group, symmetric = group.length > 1;
  let pre = P.variation > 0 ? Math.max(1, Math.round((m * k * 0.12 * P.variation) / g.length)) : 0;   // variety: smooth a few crossings first, then rejoin the pieces
  for (let iter = 0; iter < 4000 && (cur.n > 1 || pre > 0); iter++) {
    const cands = [];
    for (let r = 1; r <= k; r++) for (let c = 1; c <= m; c++) {
      const n = idx(c, r);
      if (pre > 0 ? isX(conn, n) : cur.lab[n][0] !== cur.lab[n][1]) cands.push([c, r]);
    }
    if (!cands.length) break;
    const [c0, r0] = cands[rng.int(cands.length)];
    const was = typeOf(conn, idx(c0, r0), c0, r0), options = [0, 1, 2].filter((x) => x !== was), t = pre > 0 ? 1 + rng.int(2) : options[rng.int(2)];
    const next = conn.map((ps) => ps.slice());
    const want = new Map();
    let clash = false;
    for (const f of g) {
      const [pc, pr] = f.p(c0, r0), at2 = (d) => { const v = f.d(...dirs[d]); return idx(pc + v[0], pr + v[1]); };
      const passes = PAIRINGS[t].map(([a, b]) => [at2(a), at2(b)]);
      const key = passes.map((q) => q.slice().sort((x, y) => x - y).join('-')).sort().join('|'), node = idx(pc, pr);
      if (want.has(node) && want.get(node).key !== key) clash = true;
      want.set(node, { key, passes });
    }
    if (!clash) {
      for (const [node, w] of want) next[node] = w.passes;
      const after = components(next);
      if (pre > 0) { conn = next; cur = after; pre--; continue; }
      if (after.n < cur.n) { conn = next; cur = after; fails = 0; continue; }
    }
    if (++fails > 40 && g.length > 1) { g = [ID]; symmetric = false; fails = 0; }
  }

  // trace the single loop, starting on a plain ring point
  const start = idx(...ring[rng.int(N)]);
  const route = [start];
  let prev = start, here = conn[start][0][0];
  while (here !== start && route.length < W * H * 4) {
    route.push(here);
    const ps = conn[here], p = ps.find((q) => q[0] === prev || q[1] === prev), nx = p[0] === prev ? p[1] : p[0];
    prev = here; here = nx;
  }
  const crossings = [];
  for (let r = 1; r <= k; r++) for (let c = 1; c <= m; c++) if (isX(conn, idx(c, r))) crossings.push(idx(c, r));

  const need = Math.max(Math.min(3, crossings.length), Math.min(crossings.length, Math.round(P.density * crossings.length)));
  const pool = crossings.slice();
  for (let i = pool.length - 1; i > 0; i--) { const j = rng.int(i + 1); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const req = new Set(), isCross = new Set(crossings);
  const og = symmetric ? g : [ID];
  for (const n of pool) {
    if (req.size >= need) break;
    for (const f of og) { const [c, r] = f.p(...at(n)), q = idx(c, r); if (isCross.has(q)) req.add(q); }
  }
  return { W, H, m, k, route, crossings, required: [...req].sort((a, b) => a - b), symmetry: symmetric ? symName : 'none', symmetric, components: cur.n };
}

export function generateKnot(P, rng) {
  let t = null;
  for (let attempt = 0; attempt < 12; attempt++) {
    const c = generateOnce(P, rng);
    if (!t || c.symmetric) t = c;
    if (c.symmetric || P.symmetry === 'none') break;
  }
  return t;
}

// Which nodes of a (possibly open) cord are true crossings (two straight passes), and which pass is over.
export function analyseCord(route, closed) {
  const L = route.length, passes = new Map();
  for (let i = 0; i < L; i++) {
    if (!closed && (i === 0 || i === L - 1)) continue;
    const nd = route[i];
    if (!passes.has(nd)) passes.set(nd, []);
    passes.get(nd).push({ i, p: route[(i - 1 + L) % L], n: route[(i + 1) % L] });
  }
  const cross = new Set();
  for (const [nd, ps] of passes) if (ps.length === 2 && ps.every((q) => q.p + q.n === 2 * nd)) cross.add(nd);
  const over = new Array(L).fill(null), first = new Map();
  let k = 0;
  for (let i = 0; i < L; i++) {
    const nd = route[i];
    if (!cross.has(nd)) continue;
    if (!first.has(nd)) { const o = k % 2 === 0; first.set(nd, o); over[i] = o; } else over[i] = !first.get(nd);
    k++;
  }
  return { cross, over };
}

export function createKnot(P, env) {
  const { rng, audio, fx } = env;
  const SC = P.scene ?? {}, PM = SC.pitch ?? 1, WV = SC.wave ?? 'triangle';
  let clock = 0, flash = -9, flashAt = null;
  let T, route, closed, undo, done, geo = null, drag = false, snapped = false, ai = 0, acc = 0;
  const init = () => { T = generateKnot(P, rng); route = []; closed = false; undo = []; done = null; drag = false; snapped = false; ai = 0; acc = 0; };
  init();
  const adj = (a, b) => Math.abs((a % T.W) - (b % T.W)) + Math.abs(((a / T.W) | 0) - ((b / T.W) | 0)) === 1;
  const used = (a, b) => {
    for (let i = 1; i < route.length; i++) if ((route[i - 1] === a && route[i] === b) || (route[i - 1] === b && route[i] === a)) return true;
    return closed && ((route[route.length - 1] === a && route[0] === b) || (route[route.length - 1] === b && route[0] === a));
  };
  const status = () => {
    const A = analyseCord(route, closed), covered = T.required.filter((n) => A.cross.has(n)).length;
    return { A, covered, cov: T.required.length ? covered / T.required.length : 1 };
  };
  const score = () => {
    if (!route.length) return 0;
    const { cov } = status();
    return Math.floor((closed ? 100 : 39) * cov * cov);
  };
  const finish = () => {
    const s = score(), stars = starsFor(s), { covered } = status();
    done = {
      score: s, max: 100, stars,
      headline: stars === 3 ? 'A well tied knot' : stars ? 'A sound knot' : 'The cord needs retying',
      detail: `${covered} of ${T.required.length} marked crossings made; the cord is ${closed ? 'closed into one loop' : 'still open'}`,
    };
  };

  const snap = () => { if (!snapped) { undo.push({ route: route.slice(), closed }); snapped = true; } };
  const extend = (n) => {
    if (closed || done) return false;
    if (!route.length) { snap(); route.push(n); audio?.tone({ freq: 330 * PM, dur: 0.05, type: WV, vol: 0.15 }); return true; }
    const cur = route[route.length - 1];
    if (n === cur || !adj(cur, n)) return false;
    if (n === route[0]) {
      if (route.length < 4 || used(cur, n)) return false;
      snap(); closed = true; audio?.tone({ freq: 523 * PM, dur: 0.18, type: WV, vol: 0.2 }); flash = clock; sparks(); return true;
    }
    if (used(cur, n)) return false;
    snap(); route.push(n);
    audio?.tone({ freq: (240 + (route.length % 7) * 26) * PM, dur: 0.04, type: WV, vol: 0.12 });
    if (geo && fx) fx.emit('dust', geo.x + (n % T.W) * geo.cs, geo.y + ((n / T.W) | 0) * geo.cs, { count: 1, color: tint(P.cordColor, 0.4), size: geo.cs * 0.12, speed: 18, life: 0.35, gravity: -10 });
    return true;
  };

  const sparks = () => {
    if (!geo || !fx) return;
    for (let i = 0; i < route.length; i += Math.max(1, Math.floor(route.length / 14))) { const n = route[i]; fx.emit('spark', geo.x + (n % T.W) * geo.cs, geo.y + ((n / T.W) | 0) * geo.cs, { count: 1, color: '#fff4c8', size: geo.cs * 0.28, speed: 30, life: 0.8, gravity: -10 }); }
  };

  const items = () => [
    { id: 'undo', kind: 'btn', label: 'Undo', off: !undo.length },
    { id: 'reset', kind: 'btn', label: 'Reset', off: !route.length },
    { id: 'check', kind: 'btn', label: 'Check', primary: true },
  ];
  const control = (id) => {
    if (done) return;
    if (id === 'undo') { const u = undo.pop(); if (u) { route = u.route; closed = u.closed; } }
    else if (id === 'reset') { if (route.length) { undo.push({ route: route.slice(), closed }); route = []; closed = false; } }
    else if (id === 'check') finish();
  };

  const nodeAt = (p) => {
    if (!geo) return -1;
    const c = Math.round((p.x - geo.x) / geo.cs), r = Math.round((p.y - geo.y) / geo.cs);
    if (c < 0 || r < 0 || c >= T.W || r >= T.H) return -1;
    const dx = p.x - (geo.x + c * geo.cs), dy = p.y - (geo.y + r * geo.cs);
    return Math.hypot(dx, dy) <= geo.cs * 0.62 ? r * T.W + c : -1;
  };
  const work = (p) => {
    if (!geo || done) return;
    if (p.pressed) {
      snapped = false;
      const n = nodeAt(p);
      if (n >= 0) { drag = true; extend(n); }
      if (p.released && !p.down) drag = false;
      return;
    }
    if (drag && p.down) { const n = nodeAt(p); if (n >= 0) extend(n); }
    if (!p.down) drag = false;
  };

  // ---- drawing -------------------------------------------------------------------------------------------
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const cordPath = (ctx, pts, isClosed, rad) => {
    ctx.beginPath();
    const L = pts.length;
    if (L === 1) { ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[0][0] + 0.01, pts[0][1]); return; }
    if (!isClosed) {
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < L - 1; i++) ctx.arcTo(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], rad);
      ctx.lineTo(pts[L - 1][0], pts[L - 1][1]);
    } else {
      const s = mid(pts[L - 1], pts[0]);
      ctx.moveTo(s[0], s[1]);
      for (let i = 0; i < L; i++) { const a = pts[i], b = pts[(i + 1) % L]; ctx.arcTo(a[0], a[1], b[0], b[1], rad); }
      ctx.lineTo(s[0], s[1]);
    }
  };
  const tassel = (ctx, x, y, cs) => {
    const col = P.cordColor;
    ctx.lineCap = 'round';
    ctx.strokeStyle = tint(col, -0.3); ctx.lineWidth = cs * 0.18; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cs * 0.4); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = cs * 0.12; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cs * 0.4); ctx.stroke();
    const hg = ctx.createRadialGradient(x - cs * 0.06, y + cs * 0.5, 1, x, y + cs * 0.55, cs * 0.2); hg.addColorStop(0, tint(col, 0.5)); hg.addColorStop(1, tint(col, -0.35));
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(x, y + cs * 0.55, cs * 0.17, 0, Math.PI * 2); ctx.fill();
    for (let i = -6; i <= 6; i++) {
      ctx.strokeStyle = i % 2 ? tint(col, 0.15) : tint(col, -0.15); ctx.lineWidth = Math.max(1.5, cs * 0.035);
      ctx.beginPath(); ctx.moveTo(x + i * cs * 0.018, y + cs * 0.68); ctx.quadraticCurveTo(x + i * cs * 0.05, y + cs * 0.95, x + i * cs * 0.075, y + cs * 1.25); ctx.stroke();
    }
  };
  // The cord: a soft shadow on the board, a dark underside, the body with a twist of fine bands, and a light along its upper edge.
  const strokeCord = (ctx, buildPath, w) => {
    buildPath(); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = w * 1.5; ctx.translate(w * 0.18, w * 0.3); ctx.stroke(); ctx.translate(-w * 0.18, -w * 0.3);
    buildPath(); ctx.strokeStyle = tint(P.cordColor, -0.4); ctx.lineWidth = w; ctx.stroke();
    buildPath(); ctx.strokeStyle = P.cordColor; ctx.lineWidth = w * 0.78; ctx.stroke();
    buildPath(); ctx.setLineDash([w * 0.16, w * 0.34]); ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = w * 0.78; ctx.lineCap = 'butt'; ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'round';
    buildPath(); ctx.translate(-w * 0.14, -w * 0.18); ctx.strokeStyle = 'rgba(255,255,255,0.36)'; ctx.lineWidth = w * 0.18; ctx.stroke(); ctx.translate(w * 0.14, w * 0.18);
  };
  const paintCord = (ctx, R, isClosed, gx, gy, cs, A) => {
    if (!R.length) return;
    const pts = R.map((n) => [gx + (n % T.W) * cs, gy + ((n / T.W) | 0) * cs]);
    const w = cs * 0.3, rad = cs * 0.3, L = pts.length;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    strokeCord(ctx, () => cordPath(ctx, pts, isClosed, rad), w);
    // over-crossings: a soft dark halo (the gap, as a shadow on the cord below), then the cord again on top
    for (let i = 0; i < L; i++) {
      if (!A.over[i]) continue;
      const a = mid(pts[(i - 1 + L) % L], pts[i]), b = mid(pts[i], pts[(i + 1) % L]);
      const seg = () => { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); };
      seg(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = w * 1.55; ctx.stroke();
      strokeCord(ctx, seg, w);
    }
    ctx.lineCap = 'butt';
  };
  const pin = (ctx, x, y, cs) => {
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(x + cs * 0.03, y + cs * 0.05, Math.max(2, cs * 0.075), 0, Math.PI * 2); ctx.fill();
    const g = ctx.createRadialGradient(x - cs * 0.025, y - cs * 0.03, 0.5, x, y, Math.max(2.2, cs * 0.075));
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#aeb7c0'); g.addColorStop(1, '#545c64');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, Math.max(2.2, cs * 0.075), 0, Math.PI * 2); ctx.fill();
  };
  // The board the cord is worked on, per workshop: pinning cork, vellum, washi on tatami, a tarred timber.
  const boardBg = (ctx, kind, x, y, w, h, cs) => {
    const base = { cork: '#c79a62', parchment: '#e6d3a0', washi: '#f4eddc', spar: '#6a5a44' }[kind];
    shadowed(ctx, () => { rrect(ctx, x, y, w, h, 14); ctx.fillStyle = tint(base, -0.5); ctx.fill(); }, { blur: 22, dy: 11, a: 0.55 });
    const gr = ctx.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, tint(base, 0.15)); gr.addColorStop(1, tint(base, -0.22));
    rrect(ctx, x, y, w, h, 14); ctx.fillStyle = gr; ctx.fill();
    ctx.save(); rrect(ctx, x, y, w, h, 14); ctx.clip();
    if (kind === 'cork') {
      for (let k = 0; k < 260; k++) { ctx.fillStyle = k % 3 ? 'rgba(90,50,15,0.28)' : 'rgba(255,225,170,0.3)'; const q = 1.5 + hash(k, 2) * 4; ctx.beginPath(); ctx.ellipse(x + hash(k, 1) * w, y + hash(k, 3) * h, q, q * 0.7, hash(k, 4) * 3, 0, 6.2832); ctx.fill(); }
    } else if (kind === 'parchment') {
      for (let k = 0; k < 120; k++) { ctx.fillStyle = 'rgba(100,70,20,0.12)'; ctx.fillRect(x + hash(k, 1) * w, y + hash(k, 3) * h, 2 + hash(k, 2) * 4, 1.5); }
      ctx.strokeStyle = 'rgba(120,70,20,0.35)'; ctx.lineWidth = 3; ctx.strokeRect(x + 6, y + 6, w - 12, h - 12); ctx.strokeStyle = 'rgba(40,90,50,0.4)'; ctx.lineWidth = 1.5; ctx.strokeRect(x + 12, y + 12, w - 24, h - 24);
    } else if (kind === 'washi') {
      ctx.strokeStyle = 'rgba(150,120,80,0.2)'; ctx.lineWidth = 1; for (let k = 0; k < 80; k++) { const px = x + hash(k, 1) * w, py = y + hash(k, 3) * h; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 6 + hash(k, 2) * 14, py + (hash(k, 5) - 0.5) * 6); ctx.stroke(); }
    } else {
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; for (let k = 0; k < 18; k++) { const gy = y + ((k + 0.5) / 18) * h; ctx.beginPath(); ctx.moveTo(x, gy); ctx.bezierCurveTo(x + w * 0.3, gy + 3, x + w * 0.6, gy - 3, x + w, gy); ctx.stroke(); }
      for (const [bx, by] of [[x + 14, y + 14], [x + w - 14, y + 14], [x + 14, y + h - 14], [x + w - 14, y + h - 14]]) { ctx.fillStyle = rg0(ctx, bx, by); ctx.beginPath(); ctx.arc(bx, by, 6, 0, 6.2832); ctx.fill(); }
    }
    const vg = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.3, x + w / 2, y + h / 2, Math.max(w, h) * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = vg; ctx.fillRect(x, y, w, h);
    ctx.restore();
    ctx.strokeStyle = kind === 'cork' ? '#5a3a1c' : 'rgba(0,0,0,0.4)'; ctx.lineWidth = kind === 'cork' ? 8 : 2; rrect(ctx, x, y, w, h, 14); ctx.stroke();
    void cs;
  };
  const rg0 = (ctx, x, y) => { const g = ctx.createRadialGradient(x - 2, y - 2, 0.5, x, y, 7); g.addColorStop(0, '#e8e8e8'); g.addColorStop(1, '#3c3c3c'); return g; };
  const cushion = (ctx, x, y, w, h, bg, cs) => {
    if (SC.board && SC.board !== 'jig') return boardBg(ctx, SC.board, x, y, w, h, cs);
    shadowed(ctx, () => { rrect(ctx, x, y, w, h, 18); ctx.fillStyle = bg; ctx.fill(); }, { blur: 22, dy: 11, a: 0.55 });
    const gr = ctx.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, tint(bg, 0.16)); gr.addColorStop(0.5, bg); gr.addColorStop(1, tint(bg, -0.3));
    rrect(ctx, x, y, w, h, 18); ctx.fillStyle = gr; ctx.fill();
    ctx.save(); rrect(ctx, x, y, w, h, 18); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let q = -h; q < w; q += Math.max(5, cs * 0.14)) { ctx.moveTo(x + q, y); ctx.lineTo(x + q + h, y + h); }
    ctx.stroke();
    const vg = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.3, x + w / 2, y + h / 2, Math.max(w, h) * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = vg; ctx.fillRect(x, y, w, h);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.5; rrect(ctx, x + 6, y + 6, w - 12, h - 12, 14); ctx.setLineDash([cs * 0.2, cs * 0.14]); ctx.stroke(); ctx.setLineDash([]);
  };

  const draw = (g, Rt, t) => {
    const { ctx, pal } = g;
    clock = t;
    const W0 = Rt.work, lift = SC.wall ? wallLift(W0) : 0, Wk = { x: W0.x, y: W0.y + 40 + lift, w: W0.w, h: W0.h - 40 - lift };
    const extraRows = P.tassel ? 1.4 : 0;
    const cs = Math.max(8, Math.floor(Math.min((Wk.w - 20) / (T.W - 1 + 1.6), (Wk.h - 20) / (T.H - 1 + 1.6 + extraRows))));
    const gx = Math.round(Wk.x + (Wk.w - cs * (T.W - 1)) / 2), gy = Math.round(Wk.y + (Wk.h - cs * (T.H - 1 + extraRows)) / 2);
    geo = { x: gx, y: gy, cs };
    cushion(ctx, gx - cs * 0.8, gy - cs * 0.8, cs * (T.W - 1) + cs * 1.6, cs * (T.H - 1 + extraRows) + cs * 1.6, P.background, cs);
    // guide: the target cord, ghosted with a lit edge
    if (P.guide) {
      const pts = T.route.map((n) => [gx + (n % T.W) * cs, gy + ((n / T.W) | 0) * cs]);
      cordPath(ctx, pts, true, cs * 0.3); litEdge(ctx, '#e9eef5', Math.max(1.2, cs * 0.035), t);
    }
    for (let r = 0; r < T.H; r++) for (let c = 0; c < T.W; c++) pin(ctx, gx + c * cs, gy + r * cs, cs);
    const { A } = status();
    paintCord(ctx, route, closed, gx, gy, cs, A);
    if (P.tassel) tassel(ctx, gx + ((T.W - 1) * cs) / 2, gy + (T.H - 1) * cs + cs * 0.15, cs);
    // required crossings: a gold ring that fills when made
    for (const n of T.required) {
      const x = gx + (n % T.W) * cs, y = gy + ((n / T.W) | 0) * cs, ok = A.cross.has(n);
      ctx.beginPath(); ctx.arc(x, y, cs * 0.36, 0, Math.PI * 2);
      if (ok) { ctx.fillStyle = 'rgba(245,200,90,0.26)'; ctx.fill(); }
      ctx.strokeStyle = pal.accent; ctx.lineWidth = ok ? 2.2 : 3; if (!ok) ctx.setLineDash([cs * 0.12, cs * 0.1]); ctx.stroke(); ctx.setLineDash([]);
    }
    // cord ends
    if (route.length && !closed) {
      const s = route[0], e = route[route.length - 1];
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(gx + (s % T.W) * cs, gy + ((s / T.W) | 0) * cs, cs * 0.12, 0, Math.PI * 2); ctx.fill();
      const pu = 0.6 + 0.4 * Math.sin(t * 6);
      ctx.strokeStyle = rgba(pal.accent, pu); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(gx + (e % T.W) * cs, gy + ((e / T.W) | 0) * cs, cs * 0.24, 0, Math.PI * 2); ctx.stroke();
    }
    if (closed && t - flash < 0.9) { const u = (t - flash) / 0.9; ctx.strokeStyle = rgba('#fff4c8', 0.6 * (1 - u)); ctx.lineWidth = cs * 0.2; const pts = route.map((n) => [gx + (n % T.W) * cs, gy + ((n / T.W) | 0) * cs]); cordPath(ctx, pts, true, cs * 0.3); ctx.stroke(); }
    // reference
    const th = Rt.thumb, tcs = Math.max(3, Math.min((th.w - 14) / (T.W + 0.6), (th.h - 14) / (T.H + extraRows + 0.6)));
    const tx = th.x + (th.w - tcs * (T.W - 1)) / 2, ty = th.y + (th.h - tcs * (T.H - 1 + extraRows)) / 2;
    paintCord(ctx, T.route, true, tx, ty, tcs, analyseCord(T.route, true));
    if (P.tassel) tassel(ctx, tx + ((T.W - 1) * tcs) / 2, ty + (T.H - 1) * tcs + tcs * 0.15, tcs);
    g.label(ctx, closed ? 'Loop closed: press Check' : route.length ? 'Tap or drag along the points; tap the start to close' : 'Tap a plain point to begin the cord', W0.x + W0.w / 2, W0.y + 26, g.px(22), pal.ink, 'center', '600');
  };
  const titleArt = (g, S, t) => {
    const { ctx } = g;
    const extraRows = P.tassel ? 1.4 : 0;
    const cs = Math.min(S.w * 0.8 / (T.W - 1 + 1.2), S.h * 0.8 / (T.H - 1 + 1.2 + extraRows));
    const gx = S.x + (S.w - cs * (T.W - 1)) / 2, gy = S.y + (S.h - cs * (T.H - 1 + extraRows)) / 2;
    cushion(ctx, gx - cs * 0.9, gy - cs * 0.9, cs * (T.W - 1) + cs * 1.8, cs * (T.H - 1 + extraRows) + cs * 1.8, P.background, cs);
    paintCord(ctx, T.route, true, gx, gy, cs, analyseCord(T.route, true));
    if (P.tassel) tassel(ctx, gx + ((T.W - 1) * cs) / 2, gy + (T.H - 1) * cs + cs * 0.15, cs);
    void t;
  };

  const attract = (dt) => {
    if (done) return;
    acc += dt;
    if (acc < 0.045) return;
    acc = 0;
    if (ai < T.route.length) { extend(T.route[ai]); ai++; }
    else if (!closed) extend(T.route[0]);
    else finish();
  };

  return {
    init, items, control, work, draw, attract, titleArt, result: () => done,
    score,
    info: () => [`Crossings to make: ${T.required.length}`, closed ? 'Cord: closed' : route.length ? `Cord: ${route.length} points` : 'Cord: not begun'],
    caption: 'Tie this knot',
    hint() {
      if (!route.length) { const s = T.route[0]; return `Begin on a plain point, for example column ${(s % T.W) + 1}, row ${((s / T.W) | 0) + 1}.`; }
      const { A } = status(), miss = T.required.find((n) => !A.cross.has(n));
      if (miss !== undefined) return `Cross itself at column ${(miss % T.W) + 1}, row ${((miss / T.W) | 0) + 1}: the cord must pass straight through that point twice, once across and once up and down.`;
      if (!closed) return 'Every marked crossing is made: bring the cord back and tap the first point to close the loop.';
      return 'The knot is tied: press Check.';
    },
    rules: () => [
      'Lay ONE cord: tap or drag from point to point; each step goes to a neighbouring point and no stretch between two points is used twice.',
      'Where the cord crosses itself it passes over, then under, then over again, in the order you tied it; the gaps are drawn for you.',
      'A gold ring marks a crossing you must make: pass straight through that point twice, once across and once up and down.',
      'Tap the first point again to close the cord into a loop, then press Check. Score: marked crossings made, counted fully only when the cord is closed.',
    ],
    point(id) {
      if (!geo) return null;
      if (id.startsWith('node:')) { const [c, r] = id.slice(5).split(',').map(Number); return { x: geo.x + c * geo.cs, y: geo.y + r * geo.cs }; }
      return null;
    },
    state: () => ({ technique: 'knot', W: T.W, H: T.H, route: route.slice(), closed, target: T.route, required: T.required, crossings: T.crossings, symmetry: T.symmetry, symmetric: T.symmetric, components: T.components }),
  };
}

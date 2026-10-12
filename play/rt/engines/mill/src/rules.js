// mill engine rules module: morris and mill games (three, six, nine, twelve men's morris, morabaraba, dara, tsoro yematatu...).
// Pure: no DOM, no clock, no Math.random. State is plain JSON. See README.md for the params table.
// Turn structure: a turn is one placement or one step/fly/jump; a mill adds a removal sub-step (state.pend > 0), in which
// the same player chooses one opponent piece (move = { from: node, remove: true }).

const PRESETS = {
  three: { pieces: 3, effect: 'win', flyAt: 0, jumps: false },
  six: { pieces: 6, effect: 'remove', flyAt: 0, jumps: false },
  nine: { pieces: 9, effect: 'remove', flyAt: 3, jumps: false },
  twelve: { pieces: 12, effect: 'remove', flyAt: 3, jumps: false },
  tsoro: { pieces: 3, effect: 'win', flyAt: 0, jumps: true },
  grid: { pieces: 12, effect: 'remove', flyAt: 0, jumps: false, mills: 'runs', placementMills: 'none', longRun: 'illegal' },
  custom: { pieces: 3, effect: 'remove', flyAt: 0, jumps: false },
};

const gid = (c, r) => `${c},${r}`;

function ringPoints(k) {
  const lo = k, mid = 3, hi = 6 - k;
  return [[lo, lo], [mid, lo], [hi, lo], [hi, mid], [hi, hi], [mid, hi], [lo, hi], [lo, mid]];
}

// Board: { ids, xy:[[x,y]], adj:[[i]], lines:[[i]] (mill lines, length >= 3), draw:[[i]] (polylines), jumps:[[ [over,to] ]], aspect, cell, empty }
function buildBoard(P) {
  let nodes = []; // { id, x, y, gx?, gy? } with x,y in any units, normalised below
  let polylines = []; // arrays of node ids (board lines: drawn, give adjacency and mill candidates)
  let norm = true, cell = false, aspect = 1;
  const b = P.board;
  if (typeof b === 'object' && b !== null) {
    nodes = b.nodes.map((n) => ({ id: String(n.id), x: n.x, y: n.y }));
    polylines = (b.lines ?? []).map((l) => l.map(String));
    if (b.links) for (const [x, y] of b.links) polylines.push([String(x), String(y)]);
    norm = false; aspect = b.aspect ?? 1;
  } else if (b === 'grid') {
    const cols = P.cols ?? 6, rows = P.rows ?? 5;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) nodes.push({ id: gid(c, r), x: (c + 0.5) / cols, y: (r + 0.5) / rows, c, r });
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (c + 1 < cols) polylines.push([gid(c, r), gid(c + 1, r)]);
      if (r + 1 < rows) polylines.push([gid(c, r), gid(c, r + 1)]);
      if (P.gridDiagonals) {
        if (c + 1 < cols && r + 1 < rows) polylines.push([gid(c, r), gid(c + 1, r + 1)]);
        if (c > 0 && r + 1 < rows) polylines.push([gid(c, r), gid(c - 1, r + 1)]);
      }
    }
    norm = false; cell = true; aspect = cols / rows;
  } else if (b === 'three') {
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) nodes.push({ id: gid(c, r), x: c, y: r });
    for (let i = 0; i < 3; i++) { polylines.push([gid(0, i), gid(1, i), gid(2, i)]); polylines.push([gid(i, 0), gid(i, 1), gid(i, 2)]); }
    polylines.push([gid(0, 0), gid(1, 1), gid(2, 2)], [gid(2, 0), gid(1, 1), gid(0, 2)]);
  } else if (b === 'tsoro') {
    const pts = { a: [0.5, 0.12], l: [0.305, 0.5], c: [0.5, 0.5], r: [0.695, 0.5], bl: [0.11, 0.88], bc: [0.5, 0.88], br: [0.89, 0.88] };
    for (const [id, [x, y]] of Object.entries(pts)) nodes.push({ id, x, y });
    polylines = [['a', 'l', 'bl'], ['a', 'r', 'br'], ['a', 'c', 'bc'], ['l', 'c', 'r'], ['bl', 'bc', 'br']];
    norm = false;
  } else { // six, nine, twelve
    const rings = b === 'six' ? [1, 2] : [0, 1, 2];
    const seen = new Set();
    for (const k of rings) {
      const pts = ringPoints(k);
      for (const [c, r] of pts) if (!seen.has(gid(c, r))) { seen.add(gid(c, r)); nodes.push({ id: gid(c, r), x: c, y: r }); }
      for (let i = 0; i < 8; i += 2) { // each side: corner, mid, corner
        polylines.push([gid(...pts[i]), gid(...pts[(i + 1) % 8]), gid(...pts[(i + 2) % 8])]);
      }
    }
    const arms = [(k) => [3, k], (k) => [6 - k, 3], (k) => [3, 6 - k], (k) => [k, 3]];
    for (const arm of arms) polylines.push(rings.map((k) => gid(...arm(k))));
    if (b === 'twelve') {
      polylines.push([gid(0, 0), gid(1, 1), gid(2, 2)], [gid(6, 0), gid(5, 1), gid(4, 2)], [gid(0, 6), gid(1, 5), gid(2, 4)], [gid(6, 6), gid(5, 5), gid(4, 4)]);
    }
  }
  const ids = nodes.map((n) => n.id);
  const idx = new Map(ids.map((id, i) => [id, i]));
  let xy;
  if (norm) {
    const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const pad = 0.075;
    xy = nodes.map((n) => [pad + (1 - 2 * pad) * (x1 > x0 ? (n.x - x0) / (x1 - x0) : 0.5), pad + (1 - 2 * pad) * (y1 > y0 ? (n.y - y0) / (y1 - y0) : 0.5)]);
  } else xy = nodes.map((n) => [n.x, n.y]);
  const lineIdx = polylines.map((l) => l.map((id) => {
    if (!idx.has(id)) throw new Error(`mill board: line refers to unknown node ${id}`);
    return idx.get(id);
  }));
  const adjSet = ids.map(() => new Set());
  const jumps = ids.map(() => []);
  for (const l of lineIdx) {
    for (let i = 0; i + 1 < l.length; i++) { adjSet[l[i]].add(l[i + 1]); adjSet[l[i + 1]].add(l[i]); }
    for (let i = 0; i + 2 < l.length; i++) { jumps[l[i]].push([l[i + 1], l[i + 2]]); jumps[l[i + 2]].push([l[i + 1], l[i]]); }
  }
  const isDiagonal = (l) => Math.abs(xy[l[0]][0] - xy[l[1]][0]) > 1e-9 && Math.abs(xy[l[0]][1] - xy[l[1]][1]) > 1e-9;
  const millLines = lineIdx.filter((l) => l.length >= 3 && (P.diagonalMills || !isDiagonal(l)));
  const adj = adjSet.map((s) => [...s].sort((a, c) => a - c));
  const byNode = ids.map(() => []);
  millLines.forEach((l, li) => { for (const n of l) byNode[n].push(li); });
  const W = aspect >= 1 ? aspect : 1, H = aspect >= 1 ? 1 : 1 / aspect;
  let d0 = Infinity;
  for (let i = 0; i < ids.length; i++) for (const j of adj[i]) d0 = Math.min(d0, Math.hypot((xy[i][0] - xy[j][0]) * W, (xy[i][1] - xy[j][1]) * H));
  if (!Number.isFinite(d0)) d0 = 0.3;
  const gridPos = cell ? nodes.map((n) => [n.c, n.r]) : null;
  return { ids, idx, xy, adj, lines: millLines, byNode, draw: lineIdx, jumps, aspect, cell, r: cell ? d0 * 0.5 : Math.min(0.09, d0 * 0.46), gridPos, cols: P.cols ?? 6, rows: P.rows ?? 5 };
}

export function resolveParams(params = {}) {
  const board = params.board ?? 'nine';
  const key = typeof board === 'object' ? 'custom' : board;
  const base = PRESETS[key] ?? PRESETS.nine;
  const P = {
    board, cols: 6, rows: 5, gridDiagonals: false,
    placement: true, setup: null,
    mills: 'lines', millSize: 3, longRun: 'ignore', placementMills: 'count',
    effect: 'remove', removal: 'protected', doubleMill: 'one',
    diagonalMills: true, jumps: false, flyAt: 0, minPieces: 2, blocked: 'lose',
    repetition: 3, noCaptureLimit: 60, flyingDrawPlies: 20, noImmediateReclose: false, maxPlies: 600,
    ...base, ...params,
  };
  return P;
}

export function createRules(params = {}) {
  const P = resolveParams(params);
  const B = buildBoard(P);
  const N = B.ids.length;
  const runs = P.mills === 'runs' && B.gridPos;
  // grid runs: neighbour index per direction (right, down, left, up), -1 at the edge
  const nbr = [[], [], [], []];
  if (B.gridPos) {
    const at = new Map(B.gridPos.map(([c, r], i) => [c * 100 + r, i]));
    B.gridPos.forEach(([c, r], i) => {
      [[1, 0], [0, 1], [-1, 0], [0, -1]].forEach(([dc, dr], d) => { nbr[d][i] = at.get((c + dc) * 100 + r + dr) ?? -1; });
    });
  }

  // number of mills (and whether an over-long run exists) formed through node i for owner o (b already updated)
  function millInfo(b, i, o) {
    if (!runs) {
      let m = 0;
      for (const li of B.byNode[i]) { const l = B.lines[li]; let ok = true; for (let k = 0; k < l.length; k++) if (b[l[k]] !== o) { ok = false; break; } if (ok) m++; }
      return { mills: m, long: false };
    }
    let m = 0, long = false;
    for (let d = 0; d < 2; d++) {
      const nx = nbr[d][i], pv = nbr[d + 2][i];
      let len = 1;
      for (let j = nx; j >= 0 && b[j] === o; j = nbr[d][j]) len++;
      for (let j = pv; j >= 0 && b[j] === o; j = nbr[d + 2][j]) len++;
      if (len === P.millSize) m++; else if (len > P.millSize) long = true;
    }
    return { mills: m, long };
  }
  const inMill = (b, i) => { const o = b[i]; return o >= 0 && millInfo(b, i, o).mills > 0; };

  const cache = new WeakMap();
  const total = (s, p) => { let n = s.hand[p]; for (let i = 0; i < N; i++) if (s.b[i] === p) n++; return n; };
  const onBoard = (s, p) => { let n = 0; for (let i = 0; i < N; i++) if (s.b[i] === p) n++; return n; };
  const isFlying = (s, p) => P.flyAt > 0 && s.hand[p] === 0 && total(s, p) <= P.flyAt;

  function removable(s) {
    const opp = 1 - s.turn;
    const all = [], free = [];
    for (let i = 0; i < N; i++) if (s.b[i] === opp) { all.push(i); if (P.removal === 'any' || !inMill(s.b, i)) free.push(i); }
    return P.removal === 'any' ? all : free.length ? free : all;
  }

  function moves(s) {
    const hit = cache.get(s);
    if (hit) return hit;
    const out = [];
    const b = s.b, me = s.turn;
    if (s.pend > 0) {
      for (const i of removable(s)) out.push({ from: B.ids[i], remove: true, gain: 5 });
    } else if (s.hand[me] > 0) {
      const strict = P.placementMills === 'forbid';
      const run = (relax) => {
        for (let i = 0; i < N; i++) {
          if (b[i] !== -1) continue;
          b[i] = me; const info = millInfo(b, i, me); b[i] = -1;
          if (!relax && ((P.longRun === 'illegal' && info.long) || (strict && info.mills > 0))) continue;
          out.push({ to: B.ids[i], gain: info.mills > 0 && P.placementMills === 'count' ? 10 : 0 });
        }
      };
      run(false);
      if (!out.length) run(true);
    } else {
      const fly = isFlying(s, me);
      const prev = P.noImmediateReclose ? s.prev[me] : null;
      for (let i = 0; i < N; i++) {
        if (b[i] !== me) continue;
        const targets = [];
        if (fly) { for (let j = 0; j < N; j++) if (b[j] === -1) targets.push(j); }
        else {
          for (const j of B.adj[i]) if (b[j] === -1) targets.push(j);
          if (P.jumps) for (const [over, to] of B.jumps[i]) if (b[over] !== -1 && b[to] === -1) targets.push(to);
        }
        for (const j of targets) {
          if (prev && prev.mill && prev.to === B.ids[i] && prev.from === B.ids[j]) continue;
          b[i] = -1; b[j] = me; const info = millInfo(b, j, me); b[j] = -1; b[i] = me;
          if (P.longRun === 'illegal' && info.long) continue;
          out.push({ from: B.ids[i], to: B.ids[j], gain: info.mills > 0 ? 10 : 0 });
        }
      }
    }
    cache.set(s, out);
    return out;
  }

  const keyOf = (s) => s.turn + ':' + s.b.join('');

  function apply(s, move) {
    const n = { ...s, b: s.b.slice(), hand: s.hand.slice(), prev: s.prev.slice(), hist: s.hist, ply: s.ply + 1 };
    const me = s.turn;
    let movement = false, mills = 0;
    if (move.remove) {
      const i = B.idx.get(move.from);
      n.b[i] = -1; n.pend = s.pend - 1;
      n.quiet = 0; n.hist = [];
      n.last = { path: s.last ? s.last.path : [], to: s.last ? s.last.to : null, captured: [...(s.last?.captured ?? []), move.from] };
      if (n.pend > 0) { const probe = { ...n }; if (!removable(probe).length) n.pend = 0; }
    } else {
      const to = B.idx.get(move.to);
      if (move.from !== undefined) { n.b[B.idx.get(move.from)] = -1; movement = true; } else n.hand[me]--;
      n.b[to] = me;
      const info = millInfo(n.b, to, me);
      mills = movement || P.placementMills === 'count' ? info.mills : 0;
      n.prev[me] = movement ? { from: move.from, to: move.to, mill: mills > 0 } : null;
      n.last = { path: move.from !== undefined ? [move.from] : [], to: move.to, captured: [] };
      if (mills > 0) {
        if (P.effect === 'win') n.won = me;
        else if (P.effect === 'remove') {
          n.pend = P.doubleMill === 'two' && mills > 1 ? 2 : 1;
          if (!removable({ ...n }).length) n.pend = 0;
        }
      }
    }
    if (n.pend === 0 && n.won === null) {
      n.turn = 1 - me;
      if (movement) {
        n.quiet = s.quiet + 1;
        n.hist = [...s.hist, keyOf(n)];
        if (P.repetition > 0) { const k = n.hist[n.hist.length - 1]; let c = 0; for (const h of n.hist) if (h === k) c++; if (c >= P.repetition) n.draw = true; }
        let lim = P.noCaptureLimit;
        if (P.flyAt > 0 && (isFlying(n, 0) || isFlying(n, 1))) lim = Math.min(lim, P.flyingDrawPlies);
        if (lim > 0 && n.quiet >= lim) n.draw = true;
      } else if (!move.remove) { n.quiet = 0; n.hist = []; }
    }
    if (n.ply >= P.maxPlies && n.won === null) n.draw = true;
    return n;
  }

  function winner(s) {
    if (s.won !== null) return s.won;
    if (P.effect === 'remove') {
      for (let p = 0; p < 2; p++) if (s.pend === 0 && total(s, p) <= P.minPieces) return 1 - p;
    }
    if (s.draw) return 'draw';
    if (s.pend === 0 && moves(s).length === 0) {
      let empty = false; for (let i = 0; i < N; i++) if (s.b[i] === -1) { empty = true; break; }
      if (!empty || P.blocked === 'draw') return 'draw';
      return 1 - s.turn;
    }
    return null;
  }

  function init(_params, _rng) {
    const b = new Array(N).fill(-1);
    const hand = [0, 0];
    if (P.setup) {
      for (const p of [0, 1]) for (const id of P.setup[p] ?? P.setup[String(p)] ?? []) { const i = B.idx.get(String(id)); if (i !== undefined) b[i] = p; }
    }
    if (P.placement || !P.setup) { hand[0] = P.pieces - b.filter((v) => v === 0).length; hand[1] = P.pieces - b.filter((v) => v === 1).length; }
    return { turn: 0, b, hand, pend: 0, ply: 0, quiet: 0, hist: [], prev: [null, null], won: null, draw: false, last: null };
  }

  function evaluate(s, player) {
    const o = 1 - player;
    let v = 0;
    const my = total(s, player), their = total(s, o);
    if (P.effect === 'remove') v += (my - their) * 100;
    let myMob = 0, thMob = 0, myTwo = 0, thTwo = 0;
    const flyP = isFlying(s, player), flyO = isFlying(s, o);
    let empties = 0;
    for (let i = 0; i < N; i++) if (s.b[i] === -1) empties++;
    for (let i = 0; i < N; i++) {
      const c = s.b[i];
      if (c < 0) continue;
      let m = 0;
      if (c === player ? flyP : flyO) m = empties;
      else for (const j of B.adj[i]) if (s.b[j] === -1) m++;
      if (c === player) myMob += m; else thMob += m;
    }
    if (!runs) {
      for (const l of B.lines) {
        let a = 0, bb = 0, e = 0;
        for (const k of l) { const c = s.b[k]; if (c === player) a++; else if (c === o) bb++; else e++; }
        if (a === l.length - 1 && e === 1) myTwo++;
        else if (bb === l.length - 1 && e === 1) thTwo++;
      }
    }
    const twoW = P.effect === 'win' ? 40 : 6;
    v += (myMob - thMob) * 2 + (myTwo - thTwo) * twoW;
    return v;
  }

  function describe(s) {
    const nodes = B.ids.map((id, i) => ({ id, x: B.xy[i][0], y: B.xy[i][1], r: B.r, shape: B.cell ? 'cell' : 'dot', ...(B.cell ? { tone: (B.gridPos[i][0] + B.gridPos[i][1]) % 2 } : {}) }));
    const pieces = [];
    for (let i = 0; i < N; i++) if (s.b[i] >= 0) pieces.push({ node: B.ids[i], owner: s.b[i] });
    const lines = B.cell ? [] : B.draw.map((l) => l.map((i) => B.ids[i]));
    const last = s.last ? [...s.last.path, ...(s.last.to ? [s.last.to] : []), ...s.last.captured] : [];
    let status;
    if (s.pend > 0) status = `Mill! Take one opponent piece${s.pend > 1 ? ` (${s.pend})` : ''}`;
    else if (s.hand[s.turn] > 0) status = `Place a piece (${s.hand[s.turn]} in hand)`;
    else if (isFlying(s, s.turn)) status = 'Move any piece to any empty point';
    else status = null;
    return {
      aspect: B.aspect, nodes, lines, pieces, last,
      scores: [total(s, 0), total(s, 1)],
      players: [{ name: 'Red' }, { name: 'Blue' }],
      ...(status ? { status } : {}),
    };
  }

  return { id: 'mill', players: 2, init, moves, apply, winner, evaluate, describe, params: P, board: B };
}

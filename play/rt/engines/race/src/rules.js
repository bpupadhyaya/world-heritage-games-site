// Race engine rules module: dice / cowrie / throwing-stick race games on a track (Ludo, Pachisi, Ur, Senet, Goose, Snakes and Ladders).
// Two players. Every piece has a "square" number along its owner's own path: 0 = yard (not yet entered), 1..L = the path squares,
// W = off (borne off). W = L+1 normally, or L when params.goal = 'last' (landing on the last square wins that piece).
// state = { turn, pos: [[sq...],[sq...]] (sorted, pieces are interchangeable), awaiting: 'throw' | 'move', roll, streak, skip: [n, n],
//           plies, win: null|0|1|'draw', last }
// Randomness is only the throw: chance(state) lists the outcomes while awaiting 'throw'; moves(state) lists the choices while
// awaiting 'move' (a move is always available: a position with no movable piece offers one { pass: true } move).
import { clone } from '../../../platform/engine-kit/helpers.js';

export const DEFAULTS = {
  shape: 'ring', ring: 52, lane: 5, sharedLen: 8, privateIn: 4, privateOut: 2, cols: 10, rows: 10, orientation: 'wide',
  pieces: 4, throw: { type: 'dice', count: 1, sides: 6 },
  entry: 'start', enterOn: [6], extraOn: [6], voidAfter: 0, bonus: [], extraOnCapture: false, extraOnHome: false,
  capture: 'home', stacking: 'stack', blocks: 'none', blockRun: 0, protect: 'none', safe: [], safeMode: 'share',
  overshoot: 'exact', goal: 'beyond', gates: [], exitOnly: [], jumps: [], repeat: [], opening: {}, skip: [], setup: null,
  maxMoves: 1500,
};

// ---- throw device -> [{ v, p }] ---------------------------------------------------------------------------------
export function throwTable(t) {
  const out = new Map();
  const add = (v, p) => out.set(v, (out.get(v) ?? 0) + p);
  if (t.type === 'dice') {
    let dist = new Map([[0, 1]]);
    for (let i = 0; i < (t.count ?? 1); i++) {
      const next = new Map();
      for (const [s, p] of dist) for (let f = 1; f <= (t.sides ?? 6); f++) next.set(s + f, (next.get(s + f) ?? 0) + p / (t.sides ?? 6));
      dist = next;
    }
    for (const [v, p] of dist) add(v, p);
  } else if (t.type === 'binomial') {
    const n = t.count ?? 4, q = t.p ?? 0.5;
    let c = 1;
    for (let k = 0; k <= n; k++) {
      const p = c * q ** k * (1 - q) ** (n - k);
      add(t.map?.[String(k)] ?? k, p);
      c = (c * (n - k)) / (k + 1);
    }
  } else if (t.type === 'table') {
    let total = 0;
    for (const w of Object.values(t.table ?? {})) total += w;
    for (const [v, w] of Object.entries(t.table ?? {})) add(Number(v), w / total);
  } else throw new Error(`unknown throw type ${t.type}`);
  return [...out.entries()].map(([v, p]) => ({ v, p })).filter((o) => o.p > 0).sort((a, b) => a.v - b.v);
}

export function createRules(userParams = {}, texts = {}) {
  const P = { ...DEFAULTS, ...userParams };
  const TXT = {
    players: ['Red', 'Blue'],
    rolled: '{name} rolled {roll}',
    toThrow: '{name} to throw',
    captured: ', captured',
    noMove: ', no move',
    lost: ': turn lost',
    ...texts,
  };
  const fmt = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]);
  const TABLE = throwTable(P.throw);
  const pRoll = new Map(TABLE.map((o) => [o.v, o.p]));
  const grants = (v) => P.extraOn.includes(v);

  // ---- layout ---------------------------------------------------------------------------------------------------
  const L = (() => {
    const cells = []; // { gx, gy, s } grid-unit centres, s = size multiplier
    const add = (gx, gy, s = 1) => { cells.push({ gx, gy, s }); return cells.length - 1; };
    const id = (i) => `c${i}`;
    const paths = [[], []], lines = [];
    const yard = [null, null], home = [null, null];
    let gw, gh;
    if (P.shape === 'ring') {
      const N = P.ring, side = N / 4;
      const at = (i) => {
        const d = (3.5 * side + (i * 4 * side) / N) % (4 * side);
        if (d < side) return [0, side - d];
        if (d < 2 * side) return [d - side, 0];
        if (d < 3 * side) return [side, d - 2 * side];
        return [4 * side - d, side];
      };
      const rim = [];
      for (let i = 0; i < N; i++) { const [x, y] = at(i); rim.push(add(x + 0.5, y + 0.5)); }
      lines.push([...rim.map(id), id(rim[0])]);
      const start = Math.floor(N / 2), cx = side / 2 + 0.5;
      for (let p = 0; p < 2; p++) {
        for (let i = 0; i < N - 1; i++) paths[p].push(rim[(p * start + i) % N]);
        const base = cells[paths[p][N - 2]];
        // inward normal of the edge the last loop square sits on
        const e = side + 0.5, m = Math.min(base.gx, base.gy, e - base.gx, e - base.gy);
        let dx = 0, dy = 0;
        if (m === e - base.gy) dy = -1; else if (m === base.gy) dy = 1; else if (m === base.gx) dx = 1; else dx = -1;
        void cx;
        const len = 1;
        const laneIds = [];
        for (let k = 1; k <= P.lane; k++) { const c = add(base.gx + (dx / len) * k, base.gy + (dy / len) * k); paths[p].push(c); laneIds.push(id(c)); }
        home[p] = { gx: base.gx + (dx / len) * (P.lane + 1), gy: base.gy + (dy / len) * (P.lane + 1), s: 1 };
        lines.push([id(paths[p][N - 2]), ...laneIds, `h${p}`]);
        yard[p] = { gx: (p === 0 ? side * 0.25 : side * 0.75) + 0.5, gy: (p === 0 ? side * 0.75 : side * 0.25) + 0.5, s: 2 };
      }
      gw = gh = side + 1;
    } else if (P.shape === 'lanes') {
      const n = P.sharedLen, a = P.privateIn, b = P.privateOut;
      const shared = [];
      for (let c = 0; c < n; c++) shared.push(add(c + 0.5, 2.5));
      for (let p = 0; p < 2; p++) {
        const row = p === 0 ? 3.5 : 1.5;
        const inn = [], out = [];
        for (let k = 0; k < a; k++) inn.push(add(a - 1 - k + 0.5, row));
        for (let j = 0; j < b; j++) out.push(add(n - 1 - j + 0.5, row));
        paths[p] = [...inn, ...shared, ...out];
        lines.push(paths[p].map(id));
        yard[p] = { gx: a / 2, gy: p === 0 ? 4.5 : 0.5, s: 1 };
        home[p] = { gx: n - b / 2, gy: p === 0 ? 4.5 : 0.5, s: 1 };
      }
      gw = n; gh = 5;
    } else {
      const c = P.cols, r = P.rows, N = c * r, order = [];
      if (P.shape === 'serpentine') {
        for (let i = 0; i < N; i++) { const row = Math.floor(i / c), col = row % 2 === 0 ? i % c : c - 1 - (i % c); order.push([col, r - 1 - row]); }
      } else { // spiral, clockwise inwards, from the bottom-left corner along the bottom row
        const seen = new Set();
        let x = 0, y = r - 1, dx = 1, dy = 0;
        for (let i = 0; i < N; i++) {
          order.push([x, y]); seen.add(`${x},${y}`);
          let nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= c || ny >= r || seen.has(`${nx},${ny}`)) { [dx, dy] = [dy, -dx]; nx = x + dx; ny = y + dy; }
          x = nx; y = ny;
        }
      }
      const ids = order.map(([x, y]) => add(x + 0.5, y + 0.5));
      paths[0] = ids.slice(); paths[1] = ids.slice();
      lines.push(ids.map(id));
      yard[0] = { gx: 1, gy: r + 0.5, s: 1 }; yard[1] = { gx: 2.6, gy: r + 0.5, s: 1 };
      if (P.goal === 'beyond') { home[0] = { gx: c - 2.6, gy: r + 0.5, s: 1 }; home[1] = { gx: c - 1, gy: r + 0.5, s: 1 }; }
      gw = c; gh = r + 1;
    }
    // orientation: 'tall' rotates a wide board a quarter turn so progress runs bottom to top and player 0 sits on the right
    const items = [...cells, yard[0], yard[1], home[0], home[1]].filter(Boolean);
    if (P.orientation === 'tall') {
      for (const it of items) { const { gx, gy } = it; it.gx = gy; it.gy = gw - gx; }
      [gw, gh] = [gh, gw];
    }
    return { cells, paths, lines, yard, home, gw, gh };
  })();

  const nCells = L.cells.length;
  const PL = L.paths[0].length; // squares per path
  const W = P.goal === 'last' ? PL : PL + 1;
  const cellPos = [0, 1].map((p) => { const a = new Int16Array(nCells); L.paths[p].forEach((c, i) => { a[c] = i + 1; }); return a; });
  const shared = new Uint8Array(nCells);
  for (let c = 0; c < nCells; c++) shared[c] = cellPos[0][c] && cellPos[1][c] ? 1 : 0;
  const safeCell = new Uint8Array(nCells), special = new Uint8Array(nCells);
  const mark = (arr, list) => { for (let p = 0; p < 2; p++) for (const sq of list) if (sq >= 1 && sq <= PL) arr[L.paths[p][sq - 1]] = 1; };
  mark(safeCell, P.safe); mark(special, P.safe); mark(special, P.bonus); mark(special, P.gates); mark(special, P.repeat);
  mark(special, P.skip.map((s) => s.at));
  mark(special, P.jumps.flatMap((j) => [j.from, j.to]));
  const jumpTo = new Map(P.jumps.map((j) => [j.from, j.to]));
  const skipAt = new Map(P.skip.map((s) => [s.at, s.turns]));
  const mixed = P.stacking === 'stack';
  const lastCell = (p) => L.paths[p][PL - 1];
  const cellNode = (c, p) => (mixed && shared[c] ? `c${c}.${p}` : `c${c}`);
  const nodeOfSq = (p, sq) => (sq <= 0 ? `y${p}` : sq >= W ? (P.goal === 'last' ? cellNode(lastCell(p), p) : `h${p}`) : cellNode(L.paths[p][sq - 1], p));

  // ---- static description (nodes, lines) -----------------------------------------------------------------------
  const unit = Math.min(L.gw, L.gh);
  const nodes = [];
  const norm = (it) => ({ x: it.gx / L.gw, y: it.gy / L.gh });
  // snake heads (jumps down) are drawn as dark rings when pieces never sit on the cell node itself (stacking)
  const downFrom = new Set(P.jumps.filter((j) => j.to < j.from).map((j) => L.paths[0][j.from - 1]));
  L.cells.forEach((c, i) => nodes.push({ id: `c${i}`, ...norm(c), r: (0.45 * c.s) / unit, shape: P.stacking === 'stack' && downFrom.has(i) ? 'pit' : 'cell', tone: special[i] ? 1 : 0, labelDy: 0 }));
  if (mixed) {
    const off = 0.3 / L.gw;
    L.cells.forEach((c, i) => {
      if (!shared[i]) return;
      for (let p = 0; p < 2; p++) { const n = norm(c); nodes.push({ id: `c${i}.${p}`, x: n.x + (p === 0 ? -off : off), y: n.y, r: 0.46 / unit, shape: 'none' }); }
    });
  }
  for (let p = 0; p < 2; p++) {
    nodes.push({ id: `y${p}`, ...norm(L.yard[p]), r: (0.42 * L.yard[p].s) / unit, shape: 'pit', labelDy: 1.15 });
    if (L.home[p]) nodes.push({ id: `h${p}`, ...norm(L.home[p]), r: (0.42 * L.home[p].s) / unit, shape: 'pit', labelDy: 1.15 });
  }
  const jumpLines = P.jumps.filter((j) => j.to >= 1).map((j) => [`c${L.paths[0][j.from - 1]}`, `c${L.paths[0][j.to - 1]}`]);
  const staticLines = [...L.lines, ...jumpLines];
  const aspect = L.gw / L.gh;

  // ---- helpers over positions -----------------------------------------------------------------------------------
  const countAt = (arr, p, cell) => { let n = 0; for (const sq of arr) if (sq >= 1 && sq < W && L.paths[p][sq - 1] === cell) n++; return n; };
  const offCount = (arr) => { let n = 0; for (const sq of arr) if (sq >= W) n++; return n; };
  const sorted = (a) => a.sort((x, y) => x - y);

  // One piece of player p on square sq moves by throw v. Returns null when illegal, else the resulting positions + facts.
  function step(pos, p, sq, v) {
    if (v <= 0) return null;
    const q = 1 - p;
    let raw, t;
    if (sq === 0 && P.entry === 'start') {
      if (P.enterOn.length && !P.enterOn.includes(v)) return null;
      raw = t = 1;
    } else {
      raw = t = sq + v;
      if (sq === 0 && P.opening[String(v)] !== undefined) raw = t = P.opening[String(v)];
    }
    let dir = 1;
    if (t > W) {
      if (P.overshoot === 'exact') return null;
      if (P.overshoot === 'bear') t = W; else { t = 2 * W - t; dir = -1; if (t < 1) t = 1; }
    }
    if (P.exitOnly.includes(sq) && t !== W) return null;
    for (const g of P.gates) if (sq < g && raw > g) return null;
    const theirs0 = pos[q];
    if (P.blocks === 'pass') for (let s = sq + 1; s < Math.min(raw, PL + 1); s++) if (countAt(theirs0, q, L.paths[p][s - 1]) >= 2) return null;
    if (P.blockRun > 0 && theirs0.length) {
      const occ = new Uint8Array(PL + 2);
      for (let s = 1; s <= PL; s++) occ[s] = countAt(theirs0, q, L.paths[p][s - 1]) > 0 ? 1 : 0;
      const barrier = new Uint8Array(PL + 2);
      for (let s = 1; s <= PL;) {
        if (!occ[s]) { s++; continue; }
        let e = s; while (e + 1 <= PL && occ[e + 1]) e++;
        if (e - s + 1 >= P.blockRun) for (let k = s; k <= e; k++) barrier[k] = 1;
        s = e + 1;
      }
      for (let s = sq + 1; s <= Math.min(raw, PL); s++) if (barrier[s]) return null;
    }
    // working copies
    const mine = pos[p].slice(); mine.splice(mine.indexOf(sq), 1);
    const theirs = theirs0.slice();
    const st = { captured: 0, skipT: 0, bonus: false };
    const startCell = sq >= 1 ? L.paths[p][sq - 1] : -1;
    const cells = [startCell];
    // try to place the moving piece on square s (first landing: illegal when blocked; jump: only onto an empty square when single)
    const occupy = (s, fromCell, jump) => {
      if (s >= W) return true;
      const cell = L.paths[p][s - 1];
      const own = countAt(mine, p, cell), opp = countAt(theirs, q, cell);
      if (jump && P.stacking === 'single') return own + opp === 0;
      if (own > 0 && P.stacking === 'single') return false;
      if (opp > 0) {
        const safe = safeCell[cell] === 1;
        if (safe) { if (P.stacking === 'single' || P.safeMode === 'exclusive') return false; return true; }
        if (P.capture === 'none') return P.stacking !== 'single';
        if (P.blocks !== 'none' && opp >= 2) return false;
        if (P.capture === 'swap' && opp >= 2) return false;
        if (P.protect === 'adjacent') {
          const a = s >= 2 ? L.paths[p][s - 2] : -1, b = s < PL ? L.paths[p][s] : -1;
          if ((a >= 0 && countAt(theirs, q, a) > 0) || (b >= 0 && countAt(theirs, q, b) > 0)) return false;
        }
        if (P.capture === 'home') {
          for (let i = 0; i < theirs.length; i++) if (theirs[i] >= 1 && theirs[i] < W && L.paths[q][theirs[i] - 1] === cell) { theirs[i] = 0; st.captured++; }
        } else { // swap: the occupant takes the square the mover came from
          for (let i = 0; i < theirs.length; i++) if (theirs[i] >= 1 && theirs[i] < W && L.paths[q][theirs[i] - 1] === cell) { theirs[i] = fromCell >= 0 ? cellPos[q][fromCell] : 0; st.captured++; }
        }
      }
      return true;
    };
    let cur = t;
    if (!occupy(cur, startCell, false)) return null;
    for (let guard = 0; guard < 8 && cur < W; guard++) {
      cells.push(L.paths[p][cur - 1]);
      const j = jumpTo.get(cur);
      if (j !== undefined) {
        const from = L.paths[p][cur - 1];
        let dest = j;
        if (dest >= 1 && dest < W && !occupy(dest, from, true)) {
          let d = dest - 1;
          for (; d >= 1; d--) if (occupy(d, from, true)) break;
          dest = Math.max(0, d);
        }
        cur = dest;
        if (cur >= 1 && cur < W) cells.push(L.paths[p][cur - 1]);
        else cells.push(-2);
        break;
      }
      if (P.repeat.includes(cur)) {
        let nx = cur + dir * v;
        if (nx > W) { if (P.overshoot === 'exact') break; nx = P.overshoot === 'bear' ? W : 2 * W - nx; dir = -1; }
        if (nx < 1) break;
        const fromCell = L.paths[p][cur - 1];
        if (!occupy(nx, fromCell, false)) break;
        cur = nx; continue;
      }
      break;
    }
    const final = cur;
    mine.push(final);
    if (final >= 1 && final < W) {
      if (P.bonus.includes(final)) st.bonus = true;
      st.skipT = skipAt.get(final) ?? 0;
    }
    const posOut = p === 0 ? [sorted(mine), sorted(theirs)] : [sorted(theirs), sorted(mine)];
    return { pos: posOut, final, off: final >= W, cells, ...st };
  }

  // ---- state transitions -----------------------------------------------------------------------------------------
  function init(params, rng) {
    void params; void rng;
    const pos = [[], []];
    for (let p = 0; p < 2; p++) {
      const setup = P.setup?.[p] ?? [];
      for (const s of setup) pos[p].push(s);
      while (pos[p].length < P.pieces) pos[p].push(0);
      sorted(pos[p]);
    }
    return { turn: 0, pos, awaiting: 'throw', roll: null, streak: 0, skip: [0, 0], plies: 0, win: null, last: null };
  }

  const progress = (arr) => { let t = 0; for (const sq of arr) t += Math.min(sq, W) / W; return t; };

  function finishByLimit(n) {
    const a = offCount(n.pos[0]) + progress(n.pos[0]) * 0.001, b = offCount(n.pos[1]) + progress(n.pos[1]) * 0.001;
    n.win = Math.abs(a - b) < 1e-9 ? 'draw' : a > b ? 0 : 1;
  }

  function endTurn(n, p) {
    n.streak = 0;
    let t = 1 - p;
    if (n.skip[t] > 0) { n.skip = n.skip.slice(); n.skip[t]--; t = p; }
    n.turn = t;
  }

  function resolveRoll(s, v) {
    const n = { ...s, roll: v, awaiting: 'move' };
    if (grants(v) && P.voidAfter > 0 && s.streak >= P.voidAfter) {
      n.awaiting = 'throw'; n.roll = null; n.plies = s.plies + 1;
      n.last = { path: [], to: null, captured: 0, gain: 0, roll: v, p: s.turn, note: 'void' };
      endTurn(n, s.turn);
      if (n.plies >= P.maxMoves) finishByLimit(n);
    }
    return n;
  }

  function chance(s) {
    if (s.win !== null || s.awaiting !== 'throw') return null;
    return TABLE.map((o) => ({ p: o.p, state: resolveRoll(s, o.v) }));
  }

  function moves(s) {
    if (s.win !== null || s.awaiting !== 'move') return [];
    const p = s.turn, out = [], seen = new Set();
    for (const sq of s.pos[p]) {
      if (sq >= W || seen.has(sq)) continue;
      seen.add(sq);
      const r = step(s.pos, p, sq, s.roll);
      if (!r) continue;
      const gain = r.captured * 6 + (r.bonus ? 3 : 0) + (r.off ? 4 : 0) + (r.final - sq) / W + (grants(s.roll) ? 0 : 0);
      out.push({ from: nodeOfSq(p, sq), to: nodeOfSq(p, r.final), sq, roll: s.roll, gain });
    }
    if (!out.length) {
      const first = s.pos[p].find((sq) => sq < W) ?? 0;
      return [{ pass: true, from: nodeOfSq(p, first), gain: 0 }];
    }
    if (out.length === 1) delete out[0].to; // forced move: tap the piece
    return out;
  }

  function apply(s, m) {
    const p = s.turn, q = 1 - p;
    const n = { ...s, awaiting: 'throw', plies: s.plies + 1, skip: s.skip };
    let captured = 0, extra = false, path = [], to = null, gain = m.gain ?? 0, note = null;
    if (m.pass) { note = 'noMove'; }
    else {
      const r = step(s.pos, p, m.sq, s.roll);
      if (!r) throw new Error(`illegal race move ${JSON.stringify(m)}`);
      n.pos = r.pos; captured = r.captured;
      if (r.skipT) { n.skip = n.skip.slice(); n.skip[p] += r.skipT; }
      if (P.extraOnCapture && r.captured) extra = true;
      if (P.extraOnHome && r.off) extra = true;
      if (r.bonus) extra = true;
      path = r.cells.filter((c) => c >= 0).map((c) => cellNode(c, p));
      to = nodeOfSq(p, r.final);
      path.unshift(nodeOfSq(p, m.sq));
      if (r.off) path.push(to);
    }
    const granted = grants(s.roll);
    if (granted) extra = true;
    n.last = { path, to, captured, gain, roll: s.roll, p, note };
    n.roll = null;
    const done = offCount(n.pos[p]) >= P.pieces;
    if (done) { n.win = p; n.streak = 0; return n; }
    if (n.plies >= P.maxMoves) { finishByLimit(n); return n; }
    if (extra) n.streak = granted ? s.streak + 1 : 0; else endTurn(n, p);
    void q;
    return n;
  }

  function winner(s) { return s.win; }

  // ---- evaluation ------------------------------------------------------------------------------------------------
  function exposure(s, victim) {
    // expected loss for `victim`'s pieces to the other side's next throw
    if (P.capture === 'none') return 0;
    const a = 1 - victim;
    let total = 0;
    for (const sq of s.pos[victim]) {
      if (sq < 1 || sq >= W) continue;
      const cell = L.paths[victim][sq - 1];
      if (!shared[cell] || safeCell[cell]) continue;
      const target = cellPos[a][cell];
      let hit = 0;
      for (const o of s.pos[a]) {
        if (o >= W) continue;
        const d = target - o;
        if (d >= 1 && !(o === 0 && P.entry === 'start')) hit = Math.max(hit, pRoll.get(d) ?? 0);
      }
      total += hit * (0.15 + sq / W);
    }
    return total;
  }

  function evaluate(s, player) {
    const opp = 1 - player;
    let v = (progress(s.pos[player]) - progress(s.pos[opp])) * 10;
    v += (offCount(s.pos[player]) - offCount(s.pos[opp])) * 2;
    v += (exposure(s, opp) - exposure(s, player)) * 4 * (P.capture === 'home' ? 1 : 0.4);
    if (s.turn === player) v += 0.2;
    return v;
  }

  // ---- presentation ----------------------------------------------------------------------------------------------
  function describe(s) {
    const pieces = [];
    for (let p = 0; p < 2; p++) {
      const byNode = new Map();
      for (const sq of s.pos[p]) {
        const node = nodeOfSq(p, sq);
        byNode.set(node, (byNode.get(node) ?? 0) + 1);
      }
      for (const [node, count] of byNode) pieces.push({ node, owner: p, label: node.startsWith('y') || node.startsWith('h') ? undefined : count > 1 ? String(count) : undefined, count: node.startsWith('y') || node.startsWith('h') ? count : undefined });
    }
    const name = (p) => TXT.players[p];
    let status;
    if (s.win !== null) status = '';
    else if (s.awaiting === 'move') status = fmt(TXT.rolled, { name: name(s.turn), roll: s.roll });
    else if (s.last) {
      const l = s.last;
      status = fmt(TXT.rolled, { name: name(l.p), roll: l.roll }) + (l.note === 'void' ? TXT.lost : l.note === 'noMove' ? TXT.noMove : l.captured ? TXT.captured : '') + ' · ' + fmt(TXT.toThrow, { name: name(s.turn) });
    } else status = fmt(TXT.toThrow, { name: name(s.turn) });
    return {
      aspect,
      nodes,
      lines: staticLines,
      pieces,
      scores: [offCount(s.pos[0]), offCount(s.pos[1])],
      players: [{ name: name(0) }, { name: name(1) }],
      last: s.last?.path ?? [],
      status,
    };
  }

  return { id: 'race', players: 2, init, moves, apply, winner, evaluate, describe, chance, W, PL, layout: L, throwTable: TABLE, clone };
}

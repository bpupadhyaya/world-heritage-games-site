// Alignment rules module: n-in-a-row games on a grid or a small custom graph (see README for every param).
// state = { cells: number[] (-1 empty, 0/1 owner), n (stones on board), turn, placed: [a,b], caps: [a,b], plies, last, win, line, rep }
//   win: null | 0 | 1 | 'draw';  line: indices of the completing line (for highlighting);  rep: position counts (movement games)
import { gid } from '../../../platform/engine-kit/helpers.js';

export const DEFAULTS = {
  board: 'grid', cols: 3, rows: 3, nToWin: 3, lineDirs: 'both', exactN: false,
  placement: 'free', piecesPerPlayer: 0, movement: 'none', adjacency: 'orthogonal',
  misere: false, openingRestriction: 'none', capture: 'none', capturePairsToWin: 0,
  blocked: 'lose', repetition: 3, maxPlies: 300, aspect: 1, boardStyle: 'auto',
  points: null, edges: null, lines: null, start: null,
};

const DIR_SETS = { orthogonal: [[1, 0], [0, 1]], diagonal: [[1, 1], [1, -1]], both: [[1, 0], [0, 1], [1, 1], [1, -1]] };
const D8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];

export function createRules(userParams = {}) {
  const P = { ...DEFAULTS, ...userParams };
  const grid = P.board === 'grid';
  const cols = grid ? P.cols : 0, rows = grid ? P.rows : 0;
  const N = grid ? cols * rows : P.points.length;
  const gravity = grid && P.placement === 'gravity';

  // ---- topology -----------------------------------------------------------------------------------------------
  const ids = [], px = [], py = [];
  const idIndex = new Map();
  if (grid) {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { ids.push(gid(c, r)); px.push((c + 0.5) / cols); py.push((r + 0.5) / rows); }
  } else {
    P.points.forEach((p, i) => { ids.push(`n${i}`); px.push(p[0]); py.push(p[1]); });
  }
  ids.forEach((id, i) => idIndex.set(id, i));

  const adj = Array.from({ length: N }, () => []);
  const addEdge = (a, b) => { if (a !== b && !adj[a].includes(b)) { adj[a].push(b); adj[b].push(a); } };
  const windows = [];                                     // winning lines as index arrays
  if (grid) {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      if (c + 1 < cols) addEdge(i, i + 1);
      if (r + 1 < rows) addEdge(i, i + cols);
      const diag = P.adjacency === 'all' || (P.adjacency === 'even' && (c + r) % 2 === 0);
      if (diag) { if (c + 1 < cols && r + 1 < rows) addEdge(i, i + cols + 1); if (c > 0 && r + 1 < rows) addEdge(i, i + cols - 1); }
    }
    const L = P.nToWin;
    for (const [dx, dy] of DIR_SETS[P.lineDirs] ?? DIR_SETS.both) {
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const ec = c + dx * (L - 1), er = r + dy * (L - 1);
        if (ec < 0 || ec >= cols || er < 0 || er >= rows) continue;
        const w = []; for (let k = 0; k < L; k++) w.push((r + dy * k) * cols + c + dx * k);
        windows.push(w);
      }
    }
  } else {
    for (const l of P.lines ?? []) windows.push(l.slice());
    if (P.edges) for (const [a, b] of P.edges) addEdge(a, b);
    else for (const l of windows) for (let k = 0; k + 1 < l.length; k++) addEdge(l[k], l[k + 1]);
  }
  const winAt = Array.from({ length: N }, () => []);
  windows.forEach((w, wi) => { for (const q of w) winAt[q].push(wi); });

  // jumps (movement 'slideJump'): over an adjacent piece, in a straight line, to the empty point beyond
  const jumps = Array.from({ length: N }, () => []);
  if (P.movement === 'slideJump') {
    if (grid) {
      for (let i = 0; i < N; i++) {
        const c = i % cols, r = (i / cols) | 0;
        for (const [dx, dy] of D8) {
          const c1 = c + dx, r1 = r + dy, c2 = c + 2 * dx, r2 = r + 2 * dy;
          if (c2 < 0 || c2 >= cols || r2 < 0 || r2 >= rows) continue;
          const m = r1 * cols + c1, t = r2 * cols + c2;
          if (adj[i].includes(m) && adj[m].includes(t)) jumps[i].push([m, t]);
        }
      }
    } else {
      for (const l of windows) for (let k = 0; k + 2 < l.length; k++) { jumps[l[k]].push([l[k + 1], l[k + 2]]); jumps[l[k + 2]].push([l[k + 1], l[k]]); }
    }
  }

  // centre point (opening restriction)
  let centre = 0;
  { let best = Infinity; for (let i = 0; i < N; i++) { const d = (px[i] - 0.5) ** 2 + (py[i] - 0.5) ** 2; if (d < best - 1e-9) { best = d; centre = i; } } }
  const W = windows.length;
  const AI_WIDTH = 10;                                     // large boards: the AI considers the 10 best-ordered candidates
  const stoneLimit = 49;                                   // above this many points the AI and gain use locality
  const big = N > stoneLimit;

  // ---- helpers ------------------------------------------------------------------------------------------------
  const canPlace = (s, p) => P.placement !== 'none' && (P.piecesPerPlayer === 0 || s.placed[p] < P.piecesPerPlayer);
  const hasMovement = P.movement !== 'none' && P.piecesPerPlayer > 0;

  // incremental window bookkeeping: counts per window and player, heuristic value sums, near-complete window counts
  const cenW = new Float64Array(N);
  for (let i = 0; i < N; i++) cenW[i] = 1 - Math.min(1, Math.hypot(px[i] - 0.5, py[i] - 0.5) * 1.6);
  function contrib(s, wi, sign) {
    const a = s.wc[0][wi], b = s.wc[1][wi];
    if (a && b) return;
    const len = windows[wi].length;
    if (a) { s.sc[0] += sign * POW[a > 9 ? 9 : a]; if (a === len - 1) s.th[0] += sign; }
    else if (b) { s.sc[1] += sign * POW[b > 9 ? 9 : b]; if (b === len - 1) s.th[1] += sign; }
  }
  function toggle(s, q, p, dir) {                       // dir +1 stone added, -1 removed (s.wc / sc / th / cen updated in place)
    for (const wi of winAt[q]) { contrib(s, wi, -1); s.wc[p][wi] += dir; contrib(s, wi, 1); }
    s.cen += (p === 0 ? cenW[q] : -cenW[q]) * dir;
  }

  function init() {
    const cells = new Array(N).fill(-1), placed = [0, 0];
    if (P.start) P.start.forEach((list, p) => list.forEach((i) => { cells[i] = p; placed[p]++; }));
    const s = { cells, n: placed[0] + placed[1], wc: [new Array(W).fill(0), new Array(W).fill(0)], sc: [0, 0], th: [0, 0], cen: 0, turn: 0, placed, caps: [0, 0], plies: 0, last: null, win: null, line: null, rep: hasMovement ? {} : null };
    for (let i = 0; i < N; i++) if (cells[i] >= 0) toggle(s, i, cells[i], 1);
    if (s.rep) s.rep[key(s)] = 1;
    return s;
  }
  function key(s) { let k = s.turn + ':'; for (let i = 0; i < N; i++) k += s.cells[i] < 0 ? '.' : s.cells[i]; return k; }

  // the completing line through q for player p, or null
  function lineAt(cells, q, p) {
    if (!grid) {
      for (const wi of winAt[q]) { const w = windows[wi]; let ok = true; for (const x of w) if (cells[x] !== p) { ok = false; break; } if (ok) return w; }
      return null;
    }
    const c0 = q % cols, r0 = (q / cols) | 0;
    for (const [dx, dy] of DIR_SETS[P.lineDirs] ?? DIR_SETS.both) {
      const run = [q];
      for (let c = c0 + dx, r = r0 + dy; c >= 0 && c < cols && r >= 0 && r < rows && cells[r * cols + c] === p; c += dx, r += dy) run.push(r * cols + c);
      for (let c = c0 - dx, r = r0 - dy; c >= 0 && c < cols && r >= 0 && r < rows && cells[r * cols + c] === p; c -= dx, r -= dy) run.push(r * cols + c);
      if (P.exactN ? run.length === P.nToWin : run.length >= P.nToWin) return run;
    }
    return null;
  }

  function nearMask(cells, radius) {
    const mask = new Uint8Array(N); let any = false;
    for (let i = 0; i < N; i++) {
      if (cells[i] < 0) continue;
      any = true;
      if (grid) {
        const c = i % cols, r = (i / cols) | 0;
        for (let dr = -radius; dr <= radius; dr++) for (let dc = -radius; dc <= radius; dc++) {
          const cc = c + dc, rr = r + dr;
          if (cc >= 0 && cc < cols && rr >= 0 && rr < rows) mask[rr * cols + cc] = 1;
        }
      } else { mask[i] = 1; for (const j of adj[i]) mask[j] = 1; }
    }
    return { mask, any };
  }

  // move-ordering hint: finishing a line, blocking one, or building near own stones
  const POW = [0, 1, 4, 16, 64, 256, 1024, 4096, 16384, 65536];
  function gainAt(cells, q, p) {
    let g = 0;
    for (const wi of winAt[q]) {
      const w = windows[wi]; let own = 0, opp = 0;
      for (const x of w) { const v = cells[x]; if (v === p) own++; else if (v >= 0) opp++; }
      const len = w.length;
      if (opp === 0) { if (own === len - 1) g += P.misere ? -4000 : 4000; else g += POW[Math.min(own + 1, 9)]; }
      if (own === 0 && opp > 0 && opp === len - 1) g += P.misere ? 0 : 1500;
      else if (own === 0 && opp > 0) g += POW[Math.min(opp, 9)] * 0.6;
    }
    return g;
  }

  function gainCounts(s, q, p) {
    let g = 0;
    const own = s.wc[p], opp = s.wc[1 - p];
    for (const wi of winAt[q]) {
      const o = own[wi], x = opp[wi], len = windows[wi].length;
      if (x === 0) { if (o === len - 1) g += P.misere ? -4000 : 4000; else g += POW[o + 1 > 9 ? 9 : o + 1]; }
      if (o === 0 && x > 0) { if (x === len - 1) g += P.misere ? 0 : 1500; else g += POW[x > 9 ? 9 : x] * 0.6; }
    }
    return g;
  }

  function placementPoints(s, restrictToNear) {
    const p = s.turn, out = [];
    const noStones = s.n === 0;
    if (P.openingRestriction === 'centre' && s.plies === 0 && s.cells[centre] < 0) return [centre];
    if (gravity) {
      for (let c = 0; c < cols; c++) for (let r = rows - 1; r >= 0; r--) { if (s.cells[r * cols + c] < 0) { out.push(r * cols + c); break; } }
      return out;
    }
    let mask = null;
    if (P.placement === 'edge' && !noStones) mask = nearMask(s.cells, 1).mask;
    else if (restrictToNear && big && !noStones) mask = nearMask(s.cells, 2).mask;
    const noCentre = P.openingRestriction === 'noCentre' && s.plies < 2;
    for (let i = 0; i < N; i++) {
      if (s.cells[i] >= 0) continue;
      if (noCentre && i === centre) continue;
      if (mask && !mask[i]) continue;
      out.push(i);
    }
    if (!out.length && restrictToNear) return placementPoints(s, false);
    return out;
  }

  function slideMoves(s) {
    const p = s.turn, out = [];
    for (let i = 0; i < N; i++) {
      if (s.cells[i] !== p) continue;
      if (P.movement === 'fly') { for (let j = 0; j < N; j++) if (s.cells[j] < 0) out.push({ from: ids[i], to: ids[j], gain: 0 }); continue; }
      for (const j of adj[i]) if (s.cells[j] < 0) out.push({ from: ids[i], to: ids[j], gain: 0 });
      for (const [m, t] of jumps[i]) if (s.cells[m] >= 0 && s.cells[t] < 0) out.push({ from: ids[i], to: ids[t], gain: 0 });
    }
    for (const m of out) { // gain: completes a line / blocks one
      const from = idIndex.get(m.from), to = idIndex.get(m.to);
      const cells = s.cells.slice(); cells[from] = -1;
      m.gain = gainAt(cells, to, p);
    }
    return out;
  }

  // Moves are returned best-first by a cheap tactical score (finish a line, block one, build) and carry NO `gain`:
  // engine-kit's AI sorts min nodes ascending by gain, which would put the opponent's best replies last; with equal
  // gains its stable sort keeps this order at both kinds of node.
  function movesFor(s, restrictToNear = false) {
    if (s.win !== null) return [];
    const p = s.turn;
    let list;
    if (canPlace(s, p)) {
      const pts = placementPoints(s, restrictToNear);
      list = pts.map((q) => ({ m: { to: ids[q] }, g: gainCounts(s, q, p) }));
    } else if (hasMovement) {
      list = slideMoves(s).map((m) => { const g = m.gain; delete m.gain; return { m, g }; });
    } else return [];
    list.sort((a, b) => b.g - a.g);
    if (restrictToNear && list.length > AI_WIDTH) list.length = AI_WIDTH;
    return list.map((x) => x.m);
  }

  function hasAnyMove(s) {
    const p = s.turn;
    if (canPlace(s, p)) {
      if (gravity) { for (let c = 0; c < cols; c++) if (s.cells[c] < 0) return true; return false; }
      return s.n < N;
    }
    return hasMovement && slideMoves(s).length > 0;
  }

  // ---- apply ------------------------------------------------------------------------------------------------------
  function apply(state, move) {
    const p = state.turn;
    const cells = state.cells.slice(), placed = state.placed.slice(), caps = state.caps.slice();
    const acc = { wc: [state.wc[0].slice(), state.wc[1].slice()], sc: state.sc.slice(), th: state.th.slice(), cen: state.cen };
    const to = idIndex.get(move.to);
    let from = null;
    if (move.from !== undefined) { from = idIndex.get(move.from); cells[from] = -1; toggle(acc, from, p, -1); } else placed[p]++;
    cells[to] = p; toggle(acc, to, p, 1);
    const captured = [];
    if (P.capture === 'pairs' && grid) {
      const c0 = to % cols, r0 = (to / cols) | 0;
      for (const [dx, dy] of D8) {
        const at = (k) => { const c = c0 + dx * k, r = r0 + dy * k; return c >= 0 && c < cols && r >= 0 && r < rows ? r * cols + c : -1; };
        const a = at(1), b = at(2), d = at(3);
        if (a >= 0 && b >= 0 && d >= 0 && cells[a] === 1 - p && cells[b] === 1 - p && cells[d] === p) { cells[a] = -1; cells[b] = -1; toggle(acc, a, 1 - p, -1); toggle(acc, b, 1 - p, -1); captured.push(a, b); caps[p]++; }
      }
    }
    const line = lineAt(cells, to, p);
    let win = null, lineIds = null;
    if (line) { win = P.misere ? 1 - p : p; lineIds = line.map((i) => ids[i]); }
    else if (P.capturePairsToWin > 0 && caps[p] >= P.capturePairsToWin) win = p;
    const ns = { cells, wc: acc.wc, sc: acc.sc, th: acc.th, cen: acc.cen, n: state.n + (move.from === undefined ? 1 : 0) - captured.length, turn: 1 - p, placed, caps, plies: state.plies + 1, last: { from: move.from ?? null, to: move.to, captured: captured.map((i) => ids[i]), gain: captured.length / 2 }, win, line: lineIds, rep: state.rep };
    if (win === null) {
      if (ns.rep) {
        const k = key(ns); ns.rep = { ...ns.rep }; ns.rep[k] = (ns.rep[k] ?? 0) + 1;
        if (ns.rep[k] >= P.repetition) ns.win = 'draw';
      }
      if (ns.win === null) {
        if (ns.plies >= P.maxPlies) ns.win = 'draw';
        else if (!hasAnyMove(ns)) {
          const inMovePhase = hasMovement && !canPlace(ns, ns.turn);
          ns.win = inMovePhase && P.blocked === 'lose' ? 1 - ns.turn : 'draw';
        }
      }
    }
    return ns;
  }

  // moves(state): on large free-placement boards the returned ARRAY lists only the best-ordered candidate points within 2 of
  // existing stones, at most 10 (what the AI iterates, so a hard move stays fast), while its find()/some() (what the shell uses to validate a
  // tap) fall back to the complete legal set. So every empty point stays playable. Remove once engine-kit uses aiMoves.
  function moves(state) {
    if (!(big && P.placement !== 'gravity' && state.win === null && canPlace(state, state.turn))) return movesFor(state, false);
    const cand = state.n === 0 ? [{ to: ids[centre] }] : movesFor(state, true);
    let full = null;
    const all = () => full ?? (full = movesFor(state, false));
    const first = (name) => function (fn, thisArg) { const r = Array.prototype[name].call(this, fn, thisArg); return r || (name === 'find' ? undefined : r) || Array.prototype[name].call(all(), fn, thisArg); };
    Object.defineProperty(cand, 'find', { value: first('find'), enumerable: false });
    Object.defineProperty(cand, 'some', { value: first('some'), enumerable: false });
    return cand;
  }
  // explicit candidate list for engine-kit versions that support rules.aiMoves
  function aiMoves(state) { return movesFor(state, true); }
  function winner(state) { return state.win; }

  // ---- evaluate -----------------------------------------------------------------------------------------------------
    function evaluate(state, player) {
    if (state.win !== null) return state.win === 'draw' ? 0 : state.win === player ? 1e5 : -1e5;
    const cells = state.cells;
    const s0 = state.sc[0], s1 = state.sc[1];
    const placing = canPlace(state, state.turn);
    const mover = state.turn, other = 1 - mover;
    const me = player === 0 ? s0 - s1 : s1 - s0;
    const cen = player === 0 ? state.cen : -state.cen;
    const sign = (p) => (p === player ? 1 : -1);
    let v;
    if (P.misere) {
      v = -me * 0.3 + cen * 0.2;
    } else {
      v = me + cen * 3;
      const sure = (placing ? 1 : 0.35) * (gravity ? 0.08 : 1);
      if (state.th[mover] > 0) v += sign(mover) * 5e4 * sure;
      else if (state.th[other] >= 2) v += sign(other) * 4e4 * sure;
      else if (state.th[other] === 1) v += sign(other) * 600 * sure;
    }
    if (P.capture === 'pairs') v += (state.caps[player] - state.caps[1 - player]) * (P.capturePairsToWin ? 60 : 15);
    if (hasMovement && !placing) { // mobility: free neighbours of own minus opponent pieces
      let m = 0;
      for (let i = 0; i < N; i++) { const o = cells[i]; if (o < 0) continue; let f = 0; for (const j of adj[i]) if (cells[j] < 0) f++; m += (o === player ? f : -f); }
      v += m * 4;
    }
    return v;
  }

  // ---- describe ---------------------------------------------------------------------------------------------------------
  function describe(state) {
    const cells = [];
    const style = P.boardStyle === 'auto' ? (gravity ? 'cells' : 'points') : P.boardStyle;
    let aspect, r;
    const nodes = [];
    if (grid) {
      aspect = Math.min(2, Math.max(0.5, cols / rows));
      r = (aspect >= 1 ? 0.42 / rows : 0.42 / cols) * (style === 'cells' ? 1.1 : 1);
      for (let i = 0; i < N; i++) nodes.push({ id: ids[i], x: px[i], y: py[i], r, shape: style === 'cells' ? 'cell' : 'dot', ...(style === 'cells' ? {} : {}) });
    } else {
      aspect = P.aspect;
      let md = Infinity;
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) md = Math.min(md, Math.hypot((px[i] - px[j]) * Math.max(1, aspect), (py[i] - py[j]) * Math.max(1, 1 / aspect)));
      r = Math.min(0.09, 0.4 * md);
      for (let i = 0; i < N; i++) nodes.push({ id: ids[i], x: px[i], y: py[i], r, shape: 'dot' });
    }
    const lines = [];
    if (style !== 'cells') {
      for (let i = 0; i < N; i++) for (const j of adj[i]) if (i < j) lines.push([ids[i], ids[j]]);
    }
    const pieces = [];
    for (let i = 0; i < N; i++) if (state.cells[i] >= 0) pieces.push({ node: ids[i], owner: state.cells[i] });
    const last = state.last ? [state.last.to, ...(state.line ?? [])] : [];
    const d = { aspect, nodes, lines, pieces, last };
    if (P.capture === 'pairs') d.scores = state.caps.slice();
    return d;
  }

  return { id: 'alignment', players: 2, init, moves, aiMoves, apply, winner, evaluate, describe, params: P, topology: { ids, adj, windows } };
}

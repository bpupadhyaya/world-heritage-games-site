// Mancala rules module (two rows). Ring layout, counter-clockwise by default:
//   ring[0..n-1]            player 0's pits, left to right along the bottom
//   ring[n]                 player 0's store (only when params.stores)
//   ring[n+s .. n+s+n-1]   player 1's pits, right to left along the top  (s = 1 with stores, else 0)
//   ring[2n+s]             player 1's store (only when params.stores)
// state = { ring: number[], score: [a, b], turn, plies, last, over }
import { clone } from '../../../platform/engine-kit/helpers.js';
import { createRules4 } from './rules4.js';

export const DEFAULTS = { pits: 6, seeds: 4, stores: false, direction: 'ccw', sowing: 'single', skipOrigin: true, capture: 'oware', captureCounts: [2, 3], grandSlam: 'forbidden', mustFeed: true, extraTurn: false, endWhenSideEmpty: 'mover', maxPlies: 400, rows: 2, firstInOrigin: false, endSweep: 'owner', setup: 'even' };

export function createRules(userParams = {}) {
  const P = { ...DEFAULTS, ...userParams };
  if (P.rows === 4) return createRules4(P);
  const n = P.pits, S = P.stores ? 1 : 0, size = 2 * n + 2 * S;
  const pit = (p, i) => (p === 0 ? i : n + S + i);                 // ring index of player p's i-th pit
  const store = (p) => (p === 0 ? n : 2 * n + S);                  // only valid when stores
  const isStore = (idx) => S && (idx === n || idx === 2 * n + S);
  const step = P.direction === 'ccw' ? 1 : -1;
  const next = (idx) => (idx + step + size) % size;
  const sideSeeds = (ring, p) => { let t = 0; for (let i = 0; i < n; i++) t += ring[pit(p, i)]; return t; };
  const opposite = (idx) => { const p = idx < n + S ? 0 : 1; const i = p === 0 ? idx : idx - (n + S); return pit(1 - p, n - 1 - i); };

  function init() {
    const ring = new Array(size).fill(0);
    for (let p = 0; p < 2; p++) for (let i = 0; i < n; i++) ring[pit(p, i)] = P.seeds;
    return { ring, score: [0, 0], turn: 0, plies: 0, last: null, over: false };
  }

  function sow(ring, from, player) {
    // returns { ring, last, captured, extra, path }
    ring = ring.slice();
    let hand = ring[from]; ring[from] = 0;
    let idx = from, lastIdx = from, path = [from], extra = false, guard = 0;
    if (P.firstInOrigin && hand > 1) { ring[from] = 1; hand--; }   // mangala: the first seed goes back into the pit it came from
    for (;;) {
      while (hand > 0) {
        idx = next(idx);
        if (S && idx === store(1 - player)) continue;                   // never into the opponent's store
        if (P.skipOrigin && idx === from) continue;                    // oware: the origin pit is skipped on long laps
        ring[idx]++; hand--; lastIdx = idx; path.push(idx);
      }
      if (P.sowing === 'relay' && !isStore(lastIdx) && ring[lastIdx] > 1 && guard++ < 400) { hand = ring[lastIdx]; ring[lastIdx] = 0; idx = lastIdx; continue; }
      break;
    }
    if (S && lastIdx === store(player)) extra = P.extraTurn;
    return { ring, lastIdx, path, extra };
  }

  function movesFor(s) {
    const p = s.turn, out = [];
    const opponentEmpty = sideSeeds(s.ring, 1 - p) === 0;
    for (let i = 0; i < n; i++) {
      const idx = pit(p, i);
      if (s.ring[idx] === 0) continue;
      out.push({ from: `p${idx}`, pit: idx });
    }
    if (P.mustFeed && opponentEmpty && out.length) {
      const feeding = out.filter((m) => sideSeeds(sow(s.ring, m.pit, p).ring, 1 - p) > 0);
      if (feeding.length) return feeding;
    }
    return out;
  }

  function endGame(state) {
    const ring = state.ring.slice(); const score = state.score.slice();
    const emptied = P.endSweep === 'emptier' ? [0, 1].find((p) => sideSeeds(ring, p) === 0) : undefined;
    for (let p = 0; p < 2; p++) { for (let i = 0; i < n; i++) { const owner = emptied === undefined ? p : emptied; score[owner] += ring[pit(p, i)]; ring[pit(p, i)] = 0; } }
    if (S) { ring[store(0)] = score[0]; ring[store(1)] = score[1]; }
    return { ...state, ring, score, over: true };
  }

  function apply(state, move) {
    const p = state.turn;
    const r = sow(state.ring, move.pit, p);
    let ring = r.ring, score = state.score.slice(), captured = [], gain = 0;
    const lastIdx = r.lastIdx;
    if (S) { // seeds sown into stores are the score
      score = [ring[store(0)], ring[store(1)]];
    }
    const lastSide = isStore(lastIdx) ? null : lastIdx < n ? 0 : 1;
    if (P.capture === 'oware' && lastSide === 1 - p) {
      const counts = P.captureCounts;
      const take = [];
      let i = lastIdx;
      while (i !== undefined && (i < n ? 0 : 1) === 1 - p && !isStore(i) && counts.includes(ring[i])) { take.push(i); i = (i - step + size) % size; if (isStore(i)) break; }
      if (take.length) {
        const total = take.reduce((a, j) => a + ring[j], 0);
        const oppTotal = sideSeeds(ring, 1 - p);
        if (!(P.grandSlam === 'forbidden' && total === oppTotal)) {
          for (const j of take) { score[p] += ring[j]; ring[j] = 0; captured.push(j); }
          gain = total;
        }
      }
    } else if (P.capture === 'mangala' && lastSide === 1 - p && ring[lastIdx] % 2 === 0) {          // even count in an opponent pit goes to your treasury
      const total = ring[lastIdx]; ring[lastIdx] = 0; captured.push(lastIdx); ring[store(p)] += total; score[p] = ring[store(p)]; gain = total;
    } else if ((P.capture === 'kalah' || P.capture === 'mangala') && lastSide === p && ring[lastIdx] === 1) {                // last seed made an empty own pit non-empty
      const opp = opposite(lastIdx);
      if (ring[opp] > 0) {
        const total = ring[opp] + 1;
        ring[opp] = 0; ring[lastIdx] = 0; captured.push(opp, lastIdx);
        if (S) ring[store(p)] += total; score[p] += S ? 0 : total;
        if (S) score[p] = ring[store(p)];
        gain = total;
      }
    }
    if (S) { ring[store(0)] = score[0]; ring[store(1)] = score[1]; }
    let ns = { ring, score, turn: r.extra ? p : 1 - p, plies: state.plies + 1, last: { path: r.path.map((x) => `p${x}`), to: `p${lastIdx}`, captured: captured.map((x) => `p${x}`), gain, extra: r.extra }, over: false };
    const mine = sideSeeds(ns.ring, 0), theirs = sideSeeds(ns.ring, 1);
    const stuck = P.endWhenSideEmpty === 'any' ? (mine === 0 || theirs === 0) : sideSeeds(ns.ring, ns.turn) === 0 || (P.mustFeed && sideSeeds(ns.ring, 1 - ns.turn) === 0 && !movesFor(ns).length);
    if (stuck || ns.plies >= P.maxPlies) ns = endGame(ns);
    return ns;
  }

  function moves(state) {
    if (state.over) return [];
    return movesFor(state).map((m) => ({ ...m, gain: 0 }));
  }

  function winner(state) {
    if (!state.over) return null;
    const [a, b] = state.score;
    return a === b ? 'draw' : a > b ? 0 : 1;
  }

  function evaluate(state, player) {
    const me = state.score[player], opp = state.score[1 - player];
    const total = state.ring.reduce((a, x) => a + x, 0) + 1;
    return (me - opp) * 3 + (sideSeeds(state.ring, player) - sideSeeds(state.ring, 1 - player)) * 0.4 + (state.turn === player ? 0.5 : 0) + (me * 2 > total ? 50 : 0);
  }

  function describe(state) {
    const cols = n + 2 * S;
    const cw = 1 / cols;
    const rPit = Math.min(0.46 * cw, 0.2) ;
    const nodes = [], pieces = [];
    const colOf = (idx) => {
      if (isStore(idx)) return idx === store(0) ? cols - 0.5 : 0.5;
      if (idx < n) return S + idx + 0.5;                                      // p0 pits left to right
      return S + (n - 1 - (idx - (n + S))) + 0.5;                              // p1 pits right to left
    };
    const aspect = Math.max(1.4, cols / 2.3);
    for (let idx = 0; idx < size; idx++) {
      const x = colOf(idx) * cw;
      const store_ = isStore(idx);
      const y = store_ ? 0.5 : idx < n ? 0.72 : 0.28;
      const rad = 0.42 * cw * aspect;                                          // pit radius relative to min(w,h) = h = w / aspect
      nodes.push({ id: `p${idx}`, x, y, r: store_ ? 0.3 : Math.min(rad, 0.22), shape: store_ ? 'store' : 'pit', labelDy: idx < n ? 1.3 : -1.3, ...(store_ ? { w: 0.8 * cw, h: 0.68 } : {}) });
      const count = state.ring[idx];
      if (count > 0 || store_) pieces.push({ node: `p${idx}`, owner: store_ ? (idx === store(0) ? 0 : 1) : idx < n ? 0 : 1, count });
    }
    const lastNodes = state.last ? [...new Set([state.last.path[0], state.last.to, ...(state.last.captured ?? [])])] : [];
    return { aspect, nodes, lines: [], pieces, scores: state.score, last: lastNodes, players: [{ name: 'South' }, { name: 'North' }] };
  }

  return { id: 'mancala', players: 2, init, moves, apply, winner, evaluate, describe, params: P };
}

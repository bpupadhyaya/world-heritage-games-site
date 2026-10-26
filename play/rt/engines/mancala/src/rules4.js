// Four-row sowing (Omweso family). Each player owns two rows of `pits` pits (default 8), 64 seeds in all.
// Ring index = player * 2n + k, k = 0..2n-1 is the position in that player's own loop:
//   k < n   outer (back) row, seen from the board's bottom edge running left to right for player 0
//   k >= n  inner (front) row, running back the other way
// Player 1 sits across the board and the whole picture is turned half a circle, so both loops run counter-clockwise.
// state = { ring, score, turn, plies, last, over, won }
export function createRules4(P) {
  const n = P.pits > 8 ? 8 : P.pits, L = 2 * n, size = 2 * L;
  const MAX_LAPS = P.maxLaps ?? 120;
  const at = (p, k) => p * L + ((k % L) + L) % L;
  const isInner = (k) => k >= n;
  // column (0 = left on screen) of loop position k for player p
  const colOf = (p, k) => (p === 0 ? (k < n ? k : L - 1 - k) : (k < n ? n - 1 - k : k - n));
  // the two opposing pits of an inner pit (player p, position k) are the opponent's inner and outer pit of the same screen column
  const opposing = (p, k) => {
    const c = colOf(p, k), q = 1 - p;
    const inner = q === 0 ? L - 1 - c : n + c, outer = q === 0 ? c : n - 1 - c;
    return [at(q, inner), at(q, outer)];
  };
  const sideSeeds = (ring, p) => { let t = 0; for (let k = 0; k < L; k++) t += ring[at(p, k)]; return t; };

  function init() {
    const ring = new Array(size).fill(0);
    for (let p = 0; p < 2; p++) for (let k = 0; k < L; k++) {
      if (P.setup === 'outer') { if (k < n) ring[at(p, k)] = 4; } else ring[at(p, k)] = 2;
    }
    return { ring, score: [sideSeeds(ring, 0), sideSeeds(ring, 1)], turn: 0, plies: 0, last: null, over: false, won: null };
  }

  // one whole move: relay laps, columns captured and re-sown, until a lap ends in an empty pit
  function play(ring0, p, fromIdx) {
    const ring = ring0.slice(), path = [fromIdx], captured = [];
    let k = fromIdx - p * L, hand = ring[fromIdx], laps = 0, gain = 0;
    ring[fromIdx] = 0;
    let lapStart = k;
    for (;;) {
      for (let h = hand; h > 0; h--) { k = (k + 1) % L; ring[at(p, k)]++; path.push(at(p, k)); }
      const idx = at(p, k);
      if (ring[idx] <= 1 || ++laps > MAX_LAPS) break;             // ended in an empty pit (or the endless-move guard)
      if (isInner(k)) {
        const [a, b] = opposing(p, k);
        if (ring[a] > 0 && ring[b] > 0) {                          // column capture: both opposing pits taken and sown from where the lap began
          hand = ring[a] + ring[b]; gain += hand; captured.push(a, b); ring[a] = 0; ring[b] = 0;
          k = lapStart;                                           // captured seeds are sown on from the pit the capturing lap began at
          continue;
        }
      }
      hand = ring[idx]; ring[idx] = 0; lapStart = k;               // relay: carry on from this pit
    }
    return { ring, path, captured, gain, lastIdx: at(p, k) };
  }

  function moves(state) {
    if (state.over) return [];
    const p = state.turn, out = [];
    for (let k = 0; k < L; k++) { const idx = at(p, k); if (state.ring[idx] >= 2) out.push({ from: `p${idx}`, pit: idx, gain: 0 }); }
    return out;
  }

  function apply(state, move) {
    const p = state.turn, r = play(state.ring, p, move.pit);
    const score = [sideSeeds(r.ring, 0), sideSeeds(r.ring, 1)];
    let ns = { ring: r.ring, score, turn: 1 - p, plies: state.plies + 1, over: false, won: null,
      last: { path: r.path.map((x) => `p${x}`), to: `p${r.lastIdx}`, captured: r.captured.map((x) => `p${x}`), gain: r.gain, extra: false } };
    if (!moves(ns).length) ns = { ...ns, over: true, won: p };      // the player who cannot move loses
    else if (ns.plies >= (P.maxPlies ?? 400)) ns = { ...ns, over: true, won: score[0] === score[1] ? 'draw' : score[0] > score[1] ? 0 : 1 };
    return ns;
  }

  const winner = (state) => (state.over ? state.won : null);
  function evaluate(state, player) {
    if (state.over) return state.won === player ? 1000 : state.won === 'draw' ? 0 : -1000;
    const me = state.score[player], opp = state.score[1 - player];
    let mobility = 0; for (let k = 0; k < L; k++) { if (state.ring[at(player, k)] >= 2) mobility++; if (state.ring[at(1 - player, k)] >= 2) mobility--; }
    return (me - opp) * 2 + mobility * 1.5 + (state.turn === player ? 1 : 0);
  }

  function describe(state) {
    const aspect = 1.55, nodes = [], pieces = [];
    const rowY = { 1: [0.12, 0.37], 0: [0.63, 0.88] };               // [outer, inner] for each player; player 1 is at the top
    const rad = Math.min(0.42 / n * aspect, 0.2);
    for (let p = 0; p < 2; p++) for (let k = 0; k < L; k++) {
      const idx = at(p, k), c = colOf(p, k);
      nodes.push({ id: `p${idx}`, x: (c + 0.5) / n, y: rowY[p][isInner(k) ? 1 : 0], r: rad, shape: 'pit', labelDy: p === 0 ? 1.3 : -1.3 });
      if (state.ring[idx] > 0) pieces.push({ node: `p${idx}`, owner: p, count: state.ring[idx] });
    }
    const lastNodes = state.last ? [...new Set([state.last.path[0], state.last.to, ...(state.last.captured ?? [])])] : [];
    return { aspect, nodes, lines: [], pieces, scores: state.score, last: lastNodes, players: [{ name: 'South' }, { name: 'North' }] };
  }

  return { id: 'mancala', players: 2, init, moves, apply, winner, evaluate, describe, params: P };
}

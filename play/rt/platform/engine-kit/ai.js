// Deterministic game AI for turn-based abstract games. Pure: no clock, no Math.random; strength is set by a depth AND a
// node budget (so a move costs a bounded, reproducible amount of work on every device and in headless tests).
// rules interface: see docs/ENGINE-CONTRACT.md "Board-game rules module".

export const LEVELS = [
  { id: 'easy', depth: 1, budget: 400, noise: 0.35 },
  { id: 'normal', depth: 3, budget: 6000, noise: 0.08 },
  { id: 'hard', depth: 5, budget: 40000, noise: 0 },
];

const WIN = 1e6;

// Value of `state` for `player`. Terminal states use rules.winner; chance nodes are averaged (expectimax, sampled).
function search(rules, state, player, depth, alpha, beta, budget) {
  budget.n++;
  const w = rules.winner(state);
  if (w !== null && w !== undefined) return w === 'draw' ? 0 : w === player ? WIN + depth : -WIN - depth;
  if (depth <= 0 || budget.n >= budget.max) return rules.evaluate(state, player);
  const outcomes = rules.chance ? rules.chance(state) : null;
  if (outcomes) {
    let v = 0;
    for (const o of outcomes) v += o.p * search(rules, o.state, player, depth - 1, alpha, beta, budget);
    return v;
  }
  const moves = rules.aiMoves ? rules.aiMoves(state) : rules.moves(state);
  if (!moves.length) return rules.evaluate(state, player);
  const maximizing = state.turn === player;
  let best = maximizing ? -Infinity : Infinity;
  for (const m of order(rules, state, moves, player, maximizing)) {
    const v = search(rules, rules.apply(state, m), player, depth - 1, alpha, beta, budget);
    if (maximizing) { if (v > best) best = v; if (best > alpha) alpha = best; } else { if (v < best) best = v; if (best < beta) beta = best; }
    if (alpha >= beta || budget.n >= budget.max) break;
  }
  return best;
}

// Cheap move ordering: captures/extra turns first when the rules module tags them (move.gain), else evaluation of the child.
function order(rules, state, moves, player, maximizing) {
  if (moves.length < 3) return moves;
  // move.gain is "how good for the player making the move" at EVERY node, so the best replies are tried first for both sides.
  const scored = moves.map((m, i) => ({ m, i, s: m.gain ?? 0 }));
  scored.sort((a, b) => b.s - a.s || a.i - b.i);
  return scored.map((x) => x.m);
}

// Returns the chosen move (an element of rules.moves(state)), or null when there is none.
export function chooseMove(rules, state, { level = 'normal', rng = null } = {}) {
  const moves = rules.aiMoves ? rules.aiMoves(state) : rules.moves(state);   // optional reduced candidate list for big boards
  if (!moves.length) return null;
  if (moves.length === 1) return moves[0];
  const cfg = LEVELS.find((l) => l.id === level) ?? LEVELS[1];
  const player = state.turn;
  const budget = { n: 0, max: cfg.budget };
  const scored = [];
  for (let i = 0; i < moves.length; i++) {
    const child = rules.apply(state, moves[i]);
    const b = { n: 0, max: Math.max(200, Math.floor(cfg.budget / moves.length)) };
    const v = search(rules, child, player, cfg.depth - 1, -Infinity, Infinity, b);
    scored.push({ m: moves[i], v, i });
    budget.n += b.n;
  }
  const top = Math.max(...scored.map((s) => s.v));
  let pool = scored.filter((s) => s.v >= top - 1e-9);
  if (cfg.noise > 0 && rng && rng.chance(cfg.noise)) {
    // weaker levels sometimes play a near-best move
    const spread = Math.max(1, Math.abs(top) * 0.25);
    pool = scored.filter((s) => s.v >= top - spread);
  }
  return rng ? rng.pick(pool).m : pool[0].m;
}

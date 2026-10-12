// Contract checker for a board-game rules module: plays seeded random games and throws on the first violation.
// Used by engine tests and by tools/lib/engine-runner.mjs for every fixture, so an engine cannot land broken.
import { createRng } from '../kit/rng.js';

const clone = (x) => JSON.parse(JSON.stringify(x));

export function checkRules(rules, params, { games = 25, maxPlies = 800, seed = 1 } = {}) {
  const rng = createRng(seed);
  const stats = { games, plies: 0, finished: 0, draws: 0, wins: [0, 0], maxMoves: 0, minMoves: Infinity };
  for (const key of ['init', 'moves', 'apply', 'winner', 'evaluate', 'describe']) {
    if (typeof rules[key] !== 'function') throw new Error(`rules.${key} must be a function`);
  }
  for (let g = 0; g < games; g++) {
    let s = rules.init(params, rng.fork());
    if (typeof s.turn !== 'number') throw new Error('state.turn must be a number (0 or 1)');
    for (let ply = 0; ply < maxPlies; ply++) {
      const snapshot = JSON.stringify(s);
      const w = rules.winner(s);
      const d = rules.describe(s);
      if (!d || !Array.isArray(d.nodes) || !d.nodes.length) throw new Error('describe() must return { nodes: [...] }');
      const ids = new Set(d.nodes.map((n) => n.id));
      if (ids.size !== d.nodes.length) throw new Error('describe(): duplicate node ids');
      for (const p of d.pieces ?? []) if (!ids.has(p.node)) throw new Error(`describe(): piece on unknown node ${p.node}`);
      for (const l of d.lines ?? []) for (const n of l) if (!ids.has(n)) throw new Error(`describe(): line refers to unknown node ${n}`);
      if (w !== null && w !== undefined) { stats.finished++; if (w === 'draw') stats.draws++; else stats.wins[w]++; break; }
      const outcomes = rules.chance ? rules.chance(s) : null;
      if (outcomes) {
        const p = outcomes.reduce((a, o) => a + o.p, 0);
        if (Math.abs(p - 1) > 1e-6) throw new Error(`chance() probabilities sum to ${p}`);
        s = outcomes[rng.int(outcomes.length)].state; stats.plies++;
        continue;
      }
      const moves = rules.moves(s);
      if (JSON.stringify(s) !== snapshot) throw new Error('moves() mutated the state');
      if (!moves.length) throw new Error(`no legal moves but winner() is ${w}: a stuck position must be a win, loss or draw`);
      stats.maxMoves = Math.max(stats.maxMoves, moves.length); stats.minMoves = Math.min(stats.minMoves, moves.length);
      const m = moves[rng.int(moves.length)];
      const before = JSON.stringify(s);
      const next = rules.apply(s, clone(m));
      if (JSON.stringify(s) !== before) throw new Error('apply() mutated its input state');
      if (typeof next.turn !== 'number') throw new Error('apply() result has no numeric turn');
      JSON.stringify(next); // must be serialisable
      const e0 = rules.evaluate(next, 0), e1 = rules.evaluate(next, 1);
      if (!Number.isFinite(e0) || !Number.isFinite(e1)) throw new Error('evaluate() must return finite numbers');
      s = next; stats.plies++;
    }
  }
  if (stats.finished === 0) throw new Error(`no game finished within ${maxPlies} plies in ${games} games: rules never terminate (add a move limit / repetition rule)`);
  return stats;
}

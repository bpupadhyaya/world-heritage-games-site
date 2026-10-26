// Aim, throw, flick and slide activity (docs/ENGINE-CONTRACT.md "Activity engines").
// Round flow, scoring and stars live here; the three play modules (lane, face, balance) own input, physics and drawing.
import { createLane } from './laneview.js';
import { createFace } from './faceview.js';
import { createBalance } from './balanceview.js';
import { drawHero } from './hero.js';

export const DEFAULTS = {
  mode: 'lob',            // lob | slide | flick | roll (lane view), fire (face view), balance (stack view)
  controls: 'drag',       // drag (pull back and release) | meter (tap to stop the angle, then the power)
  guide: 'full',          // full (path and wind) | direction (aim line only)
  showWindow: true,       // balance: show the clean-strike window on the strength gauge
  view: 'lane',           // lane | table (top-down board with rails and pockets, mode flick)
  table: { rail: 0.28, pocketR: 0.17, cloth: '#2f6a52', wood: '#8a5a2b', line: '#f1ead2', marks: true, baseline: 0.3, cue: true },
  lane: { width: 4, length: 10, startX: 'fixed', start: { x: 0, y: 0 } },
  range: { min: 2, max: 9 },
  projectile: { r: 0.12, mass: 1, bounce: 0.5, look: 'disc', color: '#e8c34a', inner: 0.2 },
  world: { friction: 3, landRoll: 0, bias: 0, wallBounce: 0.5, sides: 'wall', ends: 'wall', wind: 0, zones: [], hazards: [], captureSpeed: 1.4 },
  skip: null,
  target: { rings: [], pots: [], pins: [], bands: [], jack: null, pinR: 0.07, pinMass: 0.6, knock: 0.35, pinScoring: 'sum' },
  face: { w: 2, h: 1.5, sway: 0.03, drop: 0.1, flight: 0.2, drawTime: 0.5, wind: 0, spread: 0, items: [] },
  stack: { blocks: 5, colors: ['#c9362b', '#e8b52e', '#3a8f4f', '#2f6db5', '#2b2b2b'], window: [0.4, 0.62], load: 0.03, weak: 0.34, strong: 0.7, settle: 0.1, headBonus: 2 },
  rounds: { throws: 5, count: 1, scoring: 'aggregate', scoreAt: 'throw', resetPins: 'throw' },
  stars: [10, 20, 30],
  attract: { angle: 0.5 },
  look: {
    surround: '#1d2a22', lane: '#c9a86a', line: '#4a3820', edge: '#6b4e2b', ringColors: ['#c8452d', '#f3ead2', '#2d6bb0', '#e0a82e'],
    pot: '#2a1c12', potRim: '#8a5a2b', potText: '#f3ead2', pin: '#e8cfa0', pinDown: '#b89c6a', pinEdge: '#4a3820', pinText: '#4a3820', jack: '#f4f1e6',
    hazard: 'rgba(60,110,70,0.85)', thrower: 'rgba(255,255,255,0.55)', guide: '#ffd24a', hudText: '#f5f1e8', float: '#ffd24a', good: '#58c27d',
    skyTop: '#7fb4d9', skyLow: '#dbe9f1', hills: '#6c8a5a', post: '#5a3d22', dart: '#fff3c4', head: '#d93b2f', mallet: '#7a5230',
  },
};

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const merge = (base, over) => {
  if (!isObj(base) || !isObj(over)) return over === undefined ? base : over;
  const out = { ...base };
  for (const k of Object.keys(over)) out[k] = merge(base[k], over[k]);
  return out;
};
export const withDefaults = (user = {}) => {
  const P = merge(DEFAULTS, user);
  if (user.skip) P.skip = merge({ rate: { max: 0.74, sweet: 0.6, loss: 1.6 }, minHop: 0.25, drift: 0.05, points: 1 }, user.skip);
  if (P.mode === 'lob' && !P.skip) P.skip = null;
  return P;
};

export function createActivity(userParams, env) {
  const P = withDefaults(userParams);
  const { rng } = env;
  const st = { round: 0, used: 0, roundPts: 0, scores: [], done: null, pause: 0, pend: null };
  const maxScore = P.maxScore ?? P.stars[2];

  const host = {
    canThrow: () => !st.done && st.pause <= 0 && !st.pend && st.used < P.rounds.throws,
    throwsLeft: () => P.rounds.throws - st.used,
    thrown: () => { st.used++; },
    settle: (gain, opts = {}) => {
      st.roundPts += gain;
      if (opts.over || st.used >= P.rounds.throws) {
        st.roundPts += mod.endGain();
        st.scores.push(st.roundPts);
        st.pend = st.round + 1 < P.rounds.count ? 'next' : 'done';
        st.pause = 1.0;
      }
    },
  };
  const mod = P.mode === 'fire' ? createFace(P, env, host) : P.mode === 'balance' ? createBalance(P, env, host) : createLane(P, env, host);
  const total = () => (P.rounds.scoring === 'best' ? Math.max(0, ...st.scores) : st.scores.reduce((a, b) => a + b, 0));

  const init = () => {
    st.round = 0; st.used = 0; st.roundPts = 0; st.scores = []; st.done = null; st.pause = 0; st.pend = null;
    mod.reset();
  };
  init();

  const advance = (dt) => {
    if (st.pause > 0) {
      st.pause -= dt;
      if (st.pause <= 0 && st.pend) {
        if (st.pend === 'next') { st.round++; st.used = 0; st.roundPts = 0; mod.reset(); }
        else {
          const score = total();
          const stars = score >= P.stars[2] ? 3 : score >= P.stars[1] ? 2 : score >= P.stars[0] ? 1 : 0;
          const heads = P.headlines ?? ['Keep practising', 'A fair throw', 'Well aimed', 'Master of the game'];
          st.done = { score, max: Math.max(maxScore, score), stars, headline: heads[stars], detail: st.scores.length > 1 ? `Rounds: ${st.scores.join(' + ')}` : `${score} points` };
        }
        st.pend = null;
      }
    }
  };

  const heroArt = P.look.titleArt ?? P.look.hero ?? null;
  return {
    init,
    titleArt: heroArt ? (g, rect) => drawHero(g, rect, heroArt, P) : undefined,
    update(dt, input) { advance(dt); if (!st.done) mod.update(dt, input); },
    attract(dt, input) { advance(dt); if (!st.done) mod.attract(dt, input); },
    render(g, area) { mod.render(g, area); },
    status() {
      const left = P.rounds.throws - st.used;
      const live = st.pend || st.done ? total() : P.rounds.scoring === 'best' ? Math.max(total(), st.roundPts) : total() + st.roundPts;
      const unit = P.mode === 'balance' ? 'strikes' : 'throws';
      return { score: live, max: Math.max(maxScore, live), label: `${P.rounds.count > 1 ? `Round ${st.round + 1} of ${P.rounds.count} · ` : ''}${left} ${unit} left` };
    },
    result: () => st.done,
    hint: () => mod.hint?.() ?? '',
    rules: () => [
      `${P.rounds.throws} ${P.mode === 'balance' ? 'strikes' : 'throws'} per round, ${P.rounds.count} round${P.rounds.count > 1 ? 's' : ''}; ${P.rounds.scoring === 'best' ? 'your best round counts' : 'rounds add up'}.`,
      `Stars at ${P.stars.join(', ')} points.`,
    ],
    point: (id) => mod.point?.(id) ?? null,
    getState: () => ({ mode: P.mode, round: st.round, used: st.used, roundPts: st.roundPts, scores: st.scores, score: st.pend || st.done ? total() : total() + st.roundPts, pend: st.pend, ...mod.state() }),
  };
}

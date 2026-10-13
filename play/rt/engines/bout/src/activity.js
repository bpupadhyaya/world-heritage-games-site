// Bout activity (docs/ENGINE-CONTRACT.md "Activity engines"): a one-on-one contest of strength, balance and timing.
//
// A bout is a series of EXCHANGES. In each exchange the rival shows a stance (the "tell", honest on the easy level, sometimes a
// feint on harder ones); you choose a move by tapping its button while the timing marker is inside the bright zone. Both moves are then
// resolved through the relationship table (`beats`), the timing quality, stamina, grip and balance; points, push-outs and falls follow.
// Everything about a tradition is data: moves, ring, scoring, rounds, timing, level, look. No injuries are shown: only balance, grip,
// push-outs, touches and falls to the mat.

import { createSport, sportOf } from './sports.js';
import { voice, fx as synthFx } from '../../../platform/engine-kit/synth.js';
import { hash, shade, rgba, venueOf, stageGeo, drawVenue, drawLight, drawBoat, drawFigure, groundShadow, drawDial, drawStance, drawFx } from './art.js';

export const DEFAULTS = {
  level: 2,
  rounds: { count: 3, time: 30 },
  exchangeTime: 3,
  scoring: { fall: 5, fallEndsRound: false, fallLabel: 'Fall', pushOut: 5, mercy: 0, stagger: 40 },
  ring: { kind: 'sand', pushOut: false, wallDamage: 6 },
  grip: { enabled: false, label: 'Grip', start: 40 },
  timing: { period: 1.5, window: 0.2, tempo: 2.8 },
  stamina: { regen: 4, rest: 12, mash: 7 },
  weapon: { front: null, back: null },
  fighters: { you: { name: 'You', color: '#d64b3c', trim: '#f2c14e', outfit: 'tunic', build: 1, skin: '#d9a679', hair: 'band' }, rival: { name: 'Rival', color: '#2d7bd6', trim: '#f5f1e8', outfit: 'tunic', build: 1, skin: '#a8714a', hair: 'none' } },
  setting: { sky: ['#bcd7ea', '#f1e7cf'], ground: '#a98b5a', backdrop: 'hills', far: '#7f9a78', ringFill: '#d9bf86', ringEdge: '#7a4a24', ringStyle: 'rope', crowd: false, water: '#3b7fa6' },
  moves: null,
};

// A generic five-move cycle used when a fixture gives no table of its own (each move beats two and loses to two) plus a rest move.
export const DEFAULT_MOVES = [
  { id: 'grip', name: 'Take hold', kind: 'grip', speed: 2, cost: 6, power: 8, gripGain: 30, beats: ['trip', 'lift'], pose: 'grip' },
  { id: 'lift', name: 'Lift and turn', kind: 'throw', speed: 1, cost: 14, power: 30, points: 3, needs: 70, beats: ['trip', 'shove'], pose: 'lift' },
  { id: 'trip', name: 'Leg trip', kind: 'throw', speed: 2, cost: 10, power: 22, points: 2, needs: 85, beats: ['shove', 'brace'], pose: 'sweep' },
  { id: 'shove', name: 'Shoulder shove', kind: 'push', speed: 3, cost: 9, power: 12, push: 0.3, beats: ['brace', 'grip'], pose: 'push' },
  { id: 'brace', name: 'Brace and turn', kind: 'guard', speed: 2, cost: 5, power: 8, steady: 8, beats: ['grip', 'lift'], pose: 'guard' },
  { id: 'breathe', name: 'Breathe', kind: 'rest', speed: 1, cost: -12, power: 0, pose: 'rest', beats: [] },
];

// Stance library. Hands are given relative to the shoulder in units of figure height (x toward the opponent, y up).
const POSES = {
  ready: { lean: 0.12, crouch: 0.14, hf: [0.22, -0.06], hb: [0.12, -0.18], sf: 0.13, sb: -0.12, stick: 25 },
  guard: { lean: 0.05, crouch: 0.2, hf: [0.2, 0.12], hb: [0.13, 0.02], sf: 0.1, sb: -0.15, stick: 80 },
  grip: { lean: 0.3, crouch: 0.26, hf: [0.3, -0.03], hb: [0.27, -0.13], sf: 0.17, sb: -0.14, stick: 30 },
  low: { lean: 0.46, crouch: 0.5, hf: [0.3, -0.22], hb: [0.25, -0.3], sf: 0.24, sb: -0.17, stick: -15 },
  push: { lean: 0.6, crouch: 0.3, hf: [0.34, -0.08], hb: [0.3, -0.14], sf: 0.23, sb: -0.2, stick: 10 },
  lift: { lean: 0.2, crouch: 0.34, hf: [0.2, 0.2], hb: [0.1, 0.3], sf: 0.08, sb: -0.12, stick: 60 },
  turn: { lean: 0.35, crouch: 0.36, hf: [0.12, -0.05], hb: [-0.1, -0.1], sf: 0.0, sb: -0.18, stick: 20 },
  sweep: { lean: 0.38, crouch: 0.48, hf: [0.28, -0.34], hb: [0.16, -0.3], sf: 0.4, sb: -0.12, stick: -25 },
  high: { lean: 0.22, crouch: 0.1, hf: [0.2, 0.36], hb: [0.05, 0.3], sf: 0.18, sb: -0.14, stick: 75 },
  side: { lean: 0.2, crouch: 0.2, hf: [0.14, 0.12], hb: [-0.02, 0.06], sf: 0.14, sb: -0.18, stick: 105 },
  thrust: { lean: 0.32, crouch: 0.2, hf: [0.4, 0.0], hb: [0.26, -0.02], sf: 0.28, sb: -0.18, stick: 0 },
  step: { lean: -0.06, crouch: 0.16, hf: [0.1, -0.1], hb: [0.04, -0.2], sf: -0.06, sb: -0.3, stick: 40 },
  rest: { lean: 0.0, crouch: 0.02, hf: [0.05, -0.36], hb: [0.0, -0.38], sf: 0.06, sb: -0.06, stick: 35 },
  recoil: { lean: -0.32, crouch: 0.1, hf: [-0.04, 0.1], hb: [-0.1, 0.0], sf: -0.06, sb: -0.26, stick: 100 },
  stagger: { lean: -0.52, crouch: 0.02, hf: [-0.1, 0.22], hb: [-0.22, 0.12], sf: 0.1, sb: -0.3, stick: 120 },
  down: { down: 1, lean: -0.3, crouch: 0.06, hf: [-0.1, 0.25], hb: [-0.2, 0.2], sf: 0.12, sb: -0.22, stick: 100 },
};
const POSE_KEYS = ['lean', 'crouch', 'sf', 'sb', 'stick', 'down'];
const poseOf = (name) => ({ down: 0, ...(POSES[name] ?? POSES.ready) });
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const blend = (cur, tgt, t) => {
  const o = { hf: [lerp(cur.hf[0], tgt.hf[0], t), lerp(cur.hf[1], tgt.hf[1], t)], hb: [lerp(cur.hb[0], tgt.hb[0], t), lerp(cur.hb[1], tgt.hb[1], t)] };
  for (const k of POSE_KEYS) o[k] = lerp(cur[k] ?? 0, tgt[k] ?? 0, t);
  return o;
};
// "Hit" pose: the same stance thrown forward at the moment of contact.
const hitPose = (name) => { const p = poseOf(name); return { ...p, lean: p.lean + 0.16, hf: [p.hf[0] + 0.14, p.hf[1] - 0.08], hb: [p.hb[0] + 0.1, p.hb[1] - 0.04], sf: p.sf + 0.06, stick: p.stick > 20 ? p.stick - 80 : p.stick }; };

const LEVELS = {
  1: { read: 0.0, noise: 16, feint: 0.1, q: [0.12, 0.43], tempoK: 1.15, hit: 0.85 },
  2: { read: 0.55, noise: 8, feint: 0.35, q: [0.35, 0.43], tempoK: 1.0, hit: 1.0 },
  3: { read: 0.9, noise: 3, feint: 0.5, q: [0.6, 0.3], tempoK: 0.9, hit: 1.2 },
};

const NONE = { id: '-', name: 'Hesitate', kind: 'none', speed: 0, cost: 0, power: 0, points: 0, push: 0, beats: [], pose: 'stagger' };

export function createActivity(userParams, env) {
  const P = {
    ...DEFAULTS, ...userParams,
    rounds: { ...DEFAULTS.rounds, ...userParams.rounds },
    scoring: { ...DEFAULTS.scoring, ...userParams.scoring },
    ring: { ...DEFAULTS.ring, ...userParams.ring },
    grip: { ...DEFAULTS.grip, ...userParams.grip },
    timing: { ...DEFAULTS.timing, ...userParams.timing },
    stamina: { ...DEFAULTS.stamina, ...userParams.stamina },
    weapon: { ...DEFAULTS.weapon, ...userParams.weapon },
    setting: { ...DEFAULTS.setting, ...userParams.setting },
    fighters: { you: { ...DEFAULTS.fighters.you, ...userParams.fighters?.you }, rival: { ...DEFAULTS.fighters.rival, ...userParams.fighters?.rival } },
  };
  const { rng } = env;
  const SP = createSport(sportOf(P, env.text?.title));
  const pal = SP ? { ...env.palette, ...SP.pal } : env.palette;
  if (SP) for (const side of ['you', 'rival']) P.fighters[side] = { ...DEFAULTS.fighters[side], ...SP.fighters[side], ...userParams.fighters?.[side] };
  const tones = (list) => { for (const o of list) env.audio?.tone(o); };
  // Natural sounds (platform/engine-kit/synth.js): the material struck depends on the tradition (stick on stick, hand on skin,
  // body on clay); the raw tone lists in sports.js stay as the fallback when the shared audio graph is missing.
  const A = env.audio, nat = !!A?.context;
  const spId = String(sportOf(P, env.text?.title) ?? '');
  const MAT = { arnis: 'wood', nguni: 'wood', silambam: 'wood', kushti: 'clay', kotta: 'skin', laamb: 'skin', moraingy: 'skin', silat: 'skin' }[spId] ?? 'skin';
  const sTick = (q) => { if (!nat) return false; synthFx(A, 'whoosh', { vel: 0.35, dur: 0.14 }); if (q === 1) synthFx(A, 'tick', { hz: MAT === 'wood' ? 1700 : 1100, vel: 0.5 }); return true; };
  const sHit = (t) => {
    if (!nat) return false;
    if (t === 'good') { synthFx(A, 'impact', { mat: MAT, vel: 0.9 }); synthFx(A, 'thud', { vel: 0.7, hz: 70, delay: 0.01 }); synthFx(A, 'ring', { hz: 1760, vel: 0.35, delay: 0.05 }); }
    else if (t === 'bad') { synthFx(A, 'thud', { vel: 0.6, hz: 62 }); synthFx(A, 'impact', { mat: MAT, vel: 0.35, hz: 160 }); }
    else synthFx(A, 'impact', { mat: MAT, vel: 0.5 });
    return true;
  };
  const L = LEVELS[clamp(Math.round(P.level), 1, 3)];
  const moves = (P.moves ?? DEFAULT_MOVES).map((m) => ({ speed: 2, cost: 8, power: 10, points: 0, push: 0, beats: [], kind: 'strike', pose: 'ready', ...m }));
  const byId = Object.fromEntries(moves.map((m) => [m.id, m]));
  const gripOn = P.grip.enabled === true;
  const need = Math.floor(P.rounds.count / 2) + 1;
  const tempo = P.timing.tempo * L.tempoK;
  const IMPACT = 0.4, ANIM = 1.1, BREAK = 2.0;

  // ---- state -------------------------------------------------------------------------------------------------------------
  let phase, round, wins, rpts, tpts, clock, c, you, rival, hist, bigram, tell, intent, rivalQ, gauge, R, X, B, done, msg, msgT, tip, stats, layout = null, T = 0, falls;
  let fx = [], fxN = 0, shakeT = 0, shakeAmp = 0, pulse = 0, pickIdx = -1, pickT = 0;
  const mkFighter = (side) => ({ side, bal: 100, stam: 100, grip: P.grip.start, pose: poseOf('ready'), target: 'ready', shown: { bal: 100, stam: 100, grip: P.grip.start }, off: 0 });
  const resetRound = () => {
    c = 0; clock = 0; rpts = { you: 0, rival: 0 };
    you.bal = rival.bal = 100; you.grip = rival.grip = P.grip.start;
    you.stam = Math.min(100, you.stam + 35); rival.stam = Math.min(100, rival.stam + 35);
    hist = []; falls = { you: 0, rival: 0 };
  };

  const init = () => {
    you = mkFighter(-1); rival = mkFighter(1);
    round = 0; wins = { you: 0, rival: 0 }; tpts = { you: 0, rival: 0 }; bigram = {}; done = null; msg = ''; msgT = 0; tip = '';
    stats = { landed: 0, taken: 0, attempts: 0, perfect: 0, good: 0, poor: 0, hesitated: 0, mash: 0, exchanges: 0, rounds: [] };
    fx = []; fxN = 0; shakeT = 0; pulse = 0; pickIdx = -1; pickT = 0;
    resetRound();
    beginExchange();
  };

  // ---- relationship table -----------------------------------------------------------------------------------------------
  // Returns { w: 'a'|'b'|null, how } for move a against move b.
  const clash = (a, b, ignoreBeats = false) => {
    const real = (m) => m.id !== '-';
    if (!real(a) && !real(b)) return { w: null, how: 'idle' };
    if (!real(a)) return b.power > 0 || b.push > 0 ? { w: 'b', how: 'free' } : { w: null, how: 'idle' };
    if (!real(b)) return a.power > 0 || a.push > 0 ? { w: 'a', how: 'free' } : { w: null, how: 'idle' };
    if (!ignoreBeats && a.beats.includes(b.id)) return { w: 'a', how: 'beats' };
    if (!ignoreBeats && b.beats.includes(a.id)) return { w: 'b', how: 'beats' };
    const ra = a.kind === 'rest', rb = b.kind === 'rest';
    if (ra && rb) return { w: null, how: 'idle' };
    if (ra) return b.power > 0 ? { w: 'b', how: 'free' } : { w: null, how: 'idle' };
    if (rb) return a.power > 0 ? { w: 'a', how: 'free' } : { w: null, how: 'idle' };
    if (a.speed > b.speed) return { w: 'a', how: 'speed' };
    if (b.speed > a.speed) return { w: 'b', how: 'speed' };
    return { w: null, how: 'clash' };
  };
  const stamFactor = (f) => 0.5 + 0.5 * Math.min(1, f.stam / 40);
  const affordable = (f, m) => f.stam >= m.cost && (!gripOn || !m.gripNeed || f.grip >= m.gripNeed);
  // Value of move a against move b for the one playing a (used by the rival's choice and by Watch and learn).
  const payoff = (a, b, att, def) => {
    const r = clash(a, b);
    const needsOK = a.needs == null || def.bal <= a.needs;
    const val = (m, ok) => m.power * (ok ? 1 : 0.35) + (m.points || 0) * 3 + (m.push || 0) * 20 + (gripOn ? (m.gripGain || 0) * 0.15 : 0);
    if (r.w === 'a') return val(a, needsOK) * (r.how === 'speed' ? 0.5 : 1);
    if (r.w === 'b') return -val(b, b.needs == null || att.bal <= b.needs) * (r.how === 'speed' ? 0.5 : 1);
    return 0;
  };
  const best = (f, other, dist, noise) => {
    let pool = moves.filter((m) => affordable(f, m));
    if (!pool.length) pool = [moves.reduce((x, y) => (y.cost < x.cost ? y : x))];
    let top = null, topV = -Infinity;
    for (const m of pool) {
      let v = 0;
      for (const [id, p] of dist) v += p * payoff(m, byId[id] ?? NONE, f, other);
      if (m.kind === 'rest') v += f.stam < 30 ? 14 : -6;
      v += noise * rng.next();
      if (v > topV) { topV = v; top = m; }
    }
    return top;
  };

  // ---- exchanges --------------------------------------------------------------------------------------------------------
  const playerDist = () => {
    const d = new Map(moves.map((m) => [m.id, 1 / moves.length]));
    if (!hist.length || L.read === 0) return d;
    const w = new Map(moves.map((m) => [m.id, 0.15]));
    hist.slice(-6).forEach((id, i, arr) => { if (w.has(id)) w.set(id, w.get(id) + 1 + i / arr.length); });
    const last = hist[hist.length - 1];
    const bg = bigram[last];
    if (bg) for (const [id, n] of Object.entries(bg)) if (w.has(id)) w.set(id, w.get(id) + n * 1.5);
    const sum = [...w.values()].reduce((a, b) => a + b, 0);
    for (const m of moves) d.set(m.id, (1 - L.read) * (1 / moves.length) + L.read * (w.get(m.id) / sum));
    return d;
  };
  function beginExchange() {
    phase = 'ready';
    const intentMove = best(rival, you, playerDist(), L.noise);
    intent = intentMove.id;
    tell = intent;
    if (rng.chance(L.feint)) { const others = moves.filter((m) => m.id !== intent); tell = rng.pick(others).id; }
    const r = rng.next();
    rivalQ = r < L.q[0] ? 1 : r < L.q[0] + L.q[1] ? 0.7 : 0.4;
    gauge = { t: 0, zone: 0.25 + rng.next() * 0.55 };
    R = { t: 0 };
    X = null;
    rival.target = byId[tell].pose; you.target = 'ready';
  }
  const gaugePos = () => { const ph = (gauge.t / P.timing.period) % 1; return ph < 0.5 ? ph * 2 : 2 - ph * 2; };
  const quality = () => {
    const d = Math.abs(gaugePos() - gauge.zone);
    if (d <= P.timing.window / 2) return 1;
    if (d <= P.timing.window * 1.2) return 0.7;
    return 0.4;
  };

  function commit(idx) {
    const m = idx < 0 ? NONE : moves[idx];
    const q = idx < 0 ? 0 : quality();
    pickIdx = idx; pickT = 0.35;
    if (idx >= 0) {
      stats.attempts++; if (q === 1) stats.perfect++; else if (q === 0.7) stats.good++; else stats.poor++;
      you.stam = clamp(you.stam - Math.max(0, m.cost), 0, 100);
      hist.push(m.id);
      const last = hist.length > 1 ? hist[hist.length - 2] : null;
      if (last) { bigram[last] = bigram[last] ?? {}; bigram[last][m.id] = (bigram[last][m.id] ?? 0) + 1; }
      if (sTick(q)) { /* natural */ } else if (SP) tones(SP.sound.tick(q)); else env.audio?.tone({ freq: q === 1 ? 660 : 420, dur: 0.06, type: 'triangle' });
    } else stats.hesitated++;
    const rm = byId[intent];
    rival.stam = clamp(rival.stam - Math.max(0, rm.cost), 0, 100);
    stats.exchanges++;
    X = { t: 0, applied: false, you: m, rival: rm, qy: q, qr: rivalQ, end: null, text: '', gain: null, tone: 'neutral' };
    phase = 'resolve';
    you.target = m.pose; rival.target = rm.pose;
  }

  const hurt = (f, amount) => { f.bal = clamp(f.bal - amount, 0, 100); };
  function land(attSide, m, q, factor, plan) {
    const att = attSide === 'you' ? you : rival, def = attSide === 'you' ? rival : you;
    const needsOK = m.needs == null || def.bal <= m.needs;
    const gripOK = !gripOn || !m.gripNeed || att.grip >= m.gripNeed;
    const eff = q ** 1.6 * factor * stamFactor(att) * (needsOK ? 1 : 0.35) * (gripOK ? 1 : 0.5) * (attSide === 'rival' ? L.hit : 1);
    const dmg = m.power * eff;
    hurt(def, dmg);
    let pts = 0;
    if (q >= 0.7 && needsOK && gripOK && factor === 1 && m.points) pts = m.points;
    if (m.steady) att.bal = clamp(att.bal + m.steady * q, 0, 100);
    const dir = attSide === 'you' ? 1 : -1;
    if (m.push) c += dir * m.push * eff * 1.4;
    if (gripOn) { att.grip = clamp(att.grip + (m.gripGain || 0) * q, 0, 100); def.grip = clamp(def.grip - (m.gripBreak || 0) * eff, 0, 100); }
    plan[attSide] = { move: m, q, dmg, pts, needsOK, gripOK, factor };
    rpts[attSide] += pts; tpts[attSide] += pts;
    return pts;
  }
  // Effects for the moment of contact: flash, block spark, dust, splash, a label, a shake and a roar from the crowd.
  const spawnImpact = (plan, ym, rm, ringOut, fell) => {
    const att = plan.you ?? plan.rival;
    const attSide = plan.you ? 'you' : plan.rival ? 'rival' : null;
    const cx = c * K;
    if (attSide) {
      const dirA = attSide === 'you' ? 1 : -1;
      const defMove = attSide === 'you' ? rm : ym;
      const heavy = att.dmg >= 16 || att.pts > 0;
      const weak = att.dmg < 6 || !att.needsOK || defMove.kind === 'guard';
      const hx = cx + dirA * 0.03;
      if (weak) spawn('block', { x: hx, y: 0.55, dir: dirA, life: 0.4 });
      else spawn('burst', { x: hx, y: 0.6, big: heavy, life: 0.38, color: attSide === 'you' ? '#fff3b0' : '#ffd0b8' });
      const defX = fighterX(attSide === 'you' ? 1 : -1);
      if (!weak) spawn('dust', { x: defX, y: 0.02, big: heavy, life: 0.7 });
      if (att.pts) spawn('text', { x: hx, y: 1.02, text: `+${att.pts}`, color: attSide === 'you' ? '#ffe38a' : '#ffb59a', life: 0.9 });
      else if (attSide === 'you' && att.q === 1) spawn('text', { x: hx, y: 1.02, text: 'Perfect', color: '#9be3a8', life: 0.8 });
      shakeT = 0.35; shakeAmp = clamp(2 + att.dmg * 0.18, 2, 8);
      if (att.pts) pulse = 1;
    }
    if (ringOut || fell) {
      const loserSide = ringOut ? (ringOut === 'you' ? 1 : -1) : (fell === 'you' ? 1 : -1);
      const lx = fighterX(loserSide);
      if (waterVenue) spawn('splash', { x: lx, y: 0.05, life: 0.9, big: true }); else spawn('dust', { x: lx, y: 0.02, big: true, life: 0.9 });
      shakeT = 0.35; shakeAmp = 9; pulse = 1;
    }
  };
  function applyExchange() {
    const plan = { you: null, rival: null };
    const ym = X.you, rm = X.rival;
    let r = clash(ym, rm);
    // a badly timed counter is not a counter: when the winning move was mistimed and the other was well timed, only speed decides
    if (r.how === 'beats' && ((r.w === 'a' && X.qy < 0.7 && X.qr >= 0.7) || (r.w === 'b' && X.qr < 0.7 && X.qy >= 0.7))) r = { ...clash(ym, rm, true), mistimed: true };
    let why = '';
    if (r.w === 'a') { land('you', ym, X.qy, r.how === 'speed' ? 0.5 : 1, plan); if (rm.id !== '-' && rm.kind !== 'rest') hurt(rival, 3); why = r.how; }
    else if (r.w === 'b') { land('rival', rm, X.qr, r.how === 'speed' ? 0.5 : 1, plan); if (ym.id !== '-' && ym.kind !== 'rest') hurt(you, 3); why = r.how; }
    else if (r.how === 'clash') { hurt(you, 2); hurt(rival, 2); why = 'clash'; }
    else why = 'idle';
    // rest moves recover stamina when they are not struck
    for (const [f, m, side] of [[you, ym, 'you'], [rival, rm, 'rival']]) {
      if (m.kind === 'rest' && !plan[side === 'you' ? 'rival' : 'you']) f.stam = clamp(f.stam - m.cost + 0, 0, 100);
      f.stam = clamp(f.stam + 2, 0, 100);
    }
    // ring
    let ringOut = null;
    if (P.ring.pushOut) { if (c >= 1) ringOut = 'you'; else if (c <= -1) ringOut = 'rival'; }
    else if (Math.abs(c) > 1) { const pushed = c > 0 ? rival : you; hurt(pushed, P.ring.wallDamage); c = clamp(c, -1, 1); }
    // drift back to the centre and natural recovery
    c *= 0.88;
    const hitYou = !!plan.rival, hitRival = !!plan.you;
    if (!hitYou) you.bal = clamp(you.bal + 4, 0, 100);
    if (!hitRival) rival.bal = clamp(rival.bal + 4, 0, 100);
    // outcome text and round end
    X.how = why; X.plan = plan; X.applied = true;
    if (plan.you) stats.landed++; if (plan.rival) stats.taken++;
    const att = plan.you ?? plan.rival;
    const attSide = plan.you ? 'you' : plan.rival ? 'rival' : null;
    let text = '';
    if (attSide) {
      const who = attSide === 'you' ? 'You' : P.fighters.rival.name;
      const p = att;
      const qual = p.q === 1 ? 'Perfect timing' : p.q === 0.7 ? 'Good' : 'Slow';
      if (!p.needsOK) text = `${att.move.name}: not enough off balance`;
      else if (p.pts) text = `${who}: ${att.move.name} +${p.pts}`;
      else text = `${who}: ${att.move.name}`;
      X.detail = attSide === 'you' ? qual : '';
      X.tone = attSide === 'you' ? 'good' : 'bad';
    } else text = why === 'clash' ? 'Locked together' : 'Both hold';
    if (ym.id === '-') { text = 'You hesitated'; X.tone = 'bad'; }
    X.text = text;
    // falls
    let fell = null;
    if (you.bal <= 0 && rival.bal <= 0) fell = you.bal <= rival.bal ? 'rival' : 'you';
    else if (rival.bal <= 0) fell = 'you';
    else if (you.bal <= 0) fell = 'rival';
    if (ringOut) {
      const loser = ringOut === 'you' ? rival : you;
      loser.target = 'down';
      rpts[ringOut] += P.scoring.pushOut; tpts[ringOut] += P.scoring.pushOut;
      X.text = ringOut === 'you' ? 'Pushed out! You win the round' : `${P.fighters.rival.name} pushes you out`;
      X.end = { winner: ringOut, why: 'out' }; X.tone = ringOut === 'you' ? 'good' : 'bad';
      falls[ringOut === 'you' ? 'rival' : 'you']++;
    } else if (fell) {
      const loser = fell === 'you' ? rival : you;
      loser.target = 'down';
      rpts[fell] += P.scoring.fall; tpts[fell] += P.scoring.fall;
      X.text = `${P.scoring.fallLabel}! ${fell === 'you' ? 'Point to you' : `Point to ${P.fighters.rival.name}`}`;
      X.tone = fell === 'you' ? 'good' : 'bad';
      if (P.scoring.fallEndsRound) X.end = { winner: fell, why: 'fall' };
      else { loser.bal = 62; c = 0; X.reset = loser === you ? 'you' : 'rival'; }
    }
    if (!X.end && P.scoring.mercy > 0 && Math.abs(rpts.you - rpts.rival) >= P.scoring.mercy) {
      const w = rpts.you > rpts.rival ? 'you' : 'rival';
      X.end = { winner: w, why: 'lead' }; X.text = w === 'you' ? 'Clear lead: you take the round' : 'Clear lead for the rival';
    }
    clock += P.exchangeTime;
    if (!X.end && clock >= P.rounds.time) {
      const sy = rpts.you * 100 + you.bal + you.stam * 0.2 + you.grip * 0.1, sr = rpts.rival * 100 + rival.bal + rival.stam * 0.2 + rival.grip * 0.1;
      const w = sy > sr ? 'you' : 'rival';
      X.end = { winner: w, why: 'time' };
      X.text += rpts.you === rpts.rival ? '  Time: decided on balance' : '  Time!';
    }
    spawnImpact(plan, ym, rm, ringOut, fell);
    msg = X.text; msgT = 0;
    if (sHit(X.tone)) { /* natural */ } else if (SP) tones(SP.sound.hit(X.tone)); else env.audio?.tone(X.tone === 'good' ? { freq: 330, to: 520, dur: 0.14, type: 'triangle' } : X.tone === 'bad' ? { freq: 260, to: 170, dur: 0.18, type: 'sawtooth', vol: 0.12 } : { freq: 300, dur: 0.08, type: 'square', vol: 0.08 });
  }

  function afterExchange() {
    if (X.reset) { (X.reset === 'you' ? you : rival).target = 'stagger'; }
    if (X.end) {
      wins[X.end.winner]++;
      stats.rounds.push({ winner: X.end.winner, why: X.end.why, you: rpts.you, rival: rpts.rival });
      const over = wins.you >= need || wins.rival >= need;
      B = { t: 0, winner: X.end.winner, why: X.end.why, over };
      phase = 'break';
      msg = X.end.winner === 'you' ? `Round ${round + 1}: you win` : `Round ${round + 1}: ${P.fighters.rival.name} wins`;
      msgT = 0;
      if (nat) { if (X.end.winner === 'you') synthFx(A, 'chime', { hz: 784, vel: 0.7 }); else synthFx(A, 'bad', { hz: 200, vel: 0.7 }); }
      else env.audio?.tone({ freq: X.end.winner === 'you' ? 523 : 262, to: X.end.winner === 'you' ? 784 : 196, dur: 0.4, type: 'triangle' });
      return;
    }
    beginExchange();
  }
  function finishMatch() {
    const played = stats.rounds.length;
    const acc = stats.attempts ? (stats.perfect + 0.6 * stats.good) / stats.attempts : 0;
    const total = tpts.you + tpts.rival;
    const control = total ? tpts.you / total : wins.you / Math.max(1, played);
    const won = wins.you >= need;
    const lost = wins.rival;
    const score = Math.round(clamp(50 * (wins.you / Math.max(1, played)) + 28 * acc + 22 * control, 0, 100));
    const stars = !won ? 0 : lost === 0 && acc >= 0.7 ? 3 : lost === 0 && acc >= 0.45 ? 2 : 1;
    done = {
      score, max: 100, stars,
      headline: won ? (lost === 0 ? 'A clean win!' : 'You win the bout') : `${P.fighters.rival.name} wins`,
      detail: `Rounds ${wins.you}-${wins.rival}  ·  timing ${Math.round(acc * 100)}%`,
    };
  }

  // ---- control ----------------------------------------------------------------------------------------------------------
  function nextRoundOrFinish() {
    if (B.over) { phase = 'over'; finishMatch(); return; }
    round++; resetRound(); you.target = rival.target = 'ready';
    you.pose = poseOf('ready'); rival.pose = poseOf('ready');
    beginExchange();
  }
  const tapMove = (idx) => {
    if (phase !== 'ready') return;
    if (!affordable(you, moves[idx])) { msg = 'Too tired for that: breathe or pick a lighter move'; msgT = 0; if (nat) synthFx(A, 'bad', { hz: 190, vel: 0.35 }); else env.audio?.tone({ freq: 180, dur: 0.08, type: 'square', vol: 0.08 }); return; }
    commit(idx);
  };
  const step = (dt, cmd) => {
    T += dt; msgT += dt;
    for (const e of fx) e.t += dt;
    if (fx.length && fx[0].t > fx[0].life) fx = fx.filter((e) => e.t <= e.life);
    shakeT = Math.max(0, shakeT - dt); pulse = Math.max(0, pulse - dt * 0.7); pickT = Math.max(0, pickT - dt);
    const ease = 1 - Math.exp(-dt * 14);
    for (const f of [you, rival]) {
      f.pose = blend(f.pose, poseOf(f.target), ease);
      for (const k of ['bal', 'stam', 'grip']) f.shown[k] = lerp(f.shown[k], f[k], 1 - Math.exp(-dt * 8));
    }
    if (phase === 'ready') {
      R.t += dt; gauge.t += dt;
      you.stam = clamp(you.stam + P.stamina.regen * dt, 0, 100);
      rival.stam = clamp(rival.stam + P.stamina.regen * dt, 0, 100);
      if (cmd.move != null) tapMove(cmd.move);
      else if (R.t >= tempo) commit(-1);
    } else if (phase === 'resolve') {
      X.t += dt;
      if (cmd.tap) { you.stam = clamp(you.stam - P.stamina.mash, 0, 100); stats.mash++; msg = 'Tapping too fast tires you'; msgT = 0; }
      if (!X.applied && X.t >= IMPACT) applyExchange();
      if (X.t >= ANIM) afterExchange();
    } else if (phase === 'break') {
      B.t += dt;
      if (B.t >= BREAK) nextRoundOrFinish();
    }
  };

  // ---- layout and drawing ------------------------------------------------------------------------------------------------
  const geometry = (area, g) => {
    const land = area.w > area.h * 1.15;
    const n = moves.length;
    let hud, stage, msgR, gaugeR, btn;
    let colsO = null, order = 'hsmgb';
    if (!land) {
      const L = SP?.layout ?? 'std';
      const hh = clamp(area.h * (L === 'big' ? 0.115 : 0.13), 88, 130);
      const gh = clamp(area.h * 0.075, 50, 72);
      const A = area;
      if (L === 'top') {
        hud = { x: A.x, y: A.y, w: A.w, h: hh };
        gaugeR = { x: A.x + 6, y: hud.y + hud.h + 6, w: A.w - 12, h: gh };
        btn = { x: A.x, y: gaugeR.y + gaugeR.h + 8, w: A.w, h: A.h * 0.3 };
        msgR = { x: A.x, y: btn.y + btn.h + 2, w: A.w, h: 38 };
        stage = { x: A.x, y: msgR.y + msgR.h + 2, w: A.w, h: A.y + A.h - (msgR.y + msgR.h + 2) };
      } else if (L === 'rail' || L === 'railL') {
        const sw = Math.floor(A.w * 0.6);
        hud = { x: A.x, y: A.y, w: A.w, h: hh };
        const sx = L === 'rail' ? A.x : A.x + A.w - sw, rx = L === 'rail' ? A.x + sw + 8 : A.x, rw = A.w - sw - 8;
        const sh = Math.min(A.h - hh - 4 - 42 - gh - 12, sw * 1.2);
        stage = { x: sx, y: hud.y + hud.h + 4, w: sw, h: sh };
        msgR = { x: sx, y: stage.y + stage.h + 2, w: sw, h: 42 };
        gaugeR = { x: sx, y: msgR.y + msgR.h + 4, w: sw, h: gh };
        btn = { x: rx, y: stage.y, w: rw, h: A.y + A.h - stage.y };
        colsO = 1;
      } else if (L === 'overlay') {
        stage = { x: A.x, y: A.y, w: A.w, h: A.h * 0.66 };
        hud = { x: A.x, y: A.y, w: A.w, h: hh };
        msgR = { x: A.x, y: stage.y + stage.h + 2, w: A.w, h: 38 };
        gaugeR = { x: A.x + 6, y: msgR.y + msgR.h + 2, w: A.w - 12, h: gh };
        btn = { x: A.x, y: gaugeR.y + gaugeR.h + 8, w: A.w, h: A.y + A.h - (gaugeR.y + gaugeR.h + 8) };
        order = 'smhgb';
      } else if (L === 'foot') {
        stage = { x: A.x, y: A.y, w: A.w, h: A.h * 0.42 };
        msgR = { x: A.x, y: stage.y + stage.h + 2, w: A.w, h: 36 };
        hud = { x: A.x, y: msgR.y + msgR.h + 2, w: A.w, h: hh };
        gaugeR = { x: A.x + 6, y: hud.y + hud.h + 6, w: A.w - 12, h: gh };
        btn = { x: A.x, y: gaugeR.y + gaugeR.h + 8, w: A.w, h: A.y + A.h - (gaugeR.y + gaugeR.h + 8) };
      } else if (L === 'wide') {
        hud = { x: A.x, y: A.y, w: A.w, h: hh };
        stage = { x: A.x, y: hud.y + hud.h + 4, w: A.w, h: A.h * 0.5 };
        msgR = { x: A.x, y: stage.y + stage.h + 2, w: A.w, h: 36 };
        gaugeR = { x: A.x + 6, y: msgR.y + msgR.h + 2, w: A.w - 12, h: gh * 0.9 };
        btn = { x: A.x, y: gaugeR.y + gaugeR.h + 8, w: A.w, h: A.y + A.h - (gaugeR.y + gaugeR.h + 8) };
        colsO = 3;
      } else if (L === 'big') {
        hud = { x: A.x, y: A.y, w: A.w, h: hh };
        stage = { x: A.x, y: hud.y + hud.h + 4, w: A.w, h: A.h * 0.5 };
        msgR = { x: A.x, y: stage.y + stage.h + 2, w: A.w, h: 36 };
        gaugeR = { x: A.x + 6, y: msgR.y + msgR.h + 2, w: A.w - 12, h: gh * 0.85 };
        btn = { x: A.x, y: gaugeR.y + gaugeR.h + 8, w: A.w, h: A.y + A.h - (gaugeR.y + gaugeR.h + 8) };
        colsO = 3;
      } else {
        hud = { x: area.x, y: area.y, w: area.w, h: hh };
        const stageH = area.h * 0.38;
        stage = { x: area.x, y: hud.y + hud.h + 4, w: area.w, h: stageH };
        msgR = { x: area.x, y: stage.y + stage.h + 2, w: area.w, h: 40 };
        gaugeR = { x: area.x + 6, y: msgR.y + msgR.h + 4, w: area.w - 12, h: gh };
        btn = { x: area.x, y: gaugeR.y + gaugeR.h + 10, w: area.w, h: area.y + area.h - (gaugeR.y + gaugeR.h + 10) };
      }
    } else {
      const lw = Math.floor(area.w * 0.58), hh = clamp(area.h * 0.17, 80, 110);
      hud = { x: area.x, y: area.y, w: lw, h: hh };
      stage = { x: area.x, y: hud.y + hud.h + 4, w: lw, h: area.h - hh - 4 - 44 };
      msgR = { x: area.x, y: stage.y + stage.h, w: lw, h: 44 };
      const rx = area.x + lw + 12, rw = area.w - lw - 12;
      gaugeR = { x: rx, y: area.y + 6, w: rw, h: clamp(area.h * 0.14, 56, 76) };
      btn = { x: rx, y: gaugeR.y + gaugeR.h + 12, w: rw, h: area.y + area.h - (gaugeR.y + gaugeR.h + 12) };
    }
    const cols = colsO ?? (n > 6 || btn.w > 900 ? 3 : 2), rows = Math.ceil(n / cols), gap = 10;
    const bw = (btn.w - gap * (cols - 1)) / cols, bh = clamp((btn.h - gap * (rows - 1)) / rows, 48, 108);
    const buttons = moves.map((m, i) => ({ i, id: `move:${m.id}`, x: btn.x + (i % cols) * (bw + gap), y: btn.y + Math.floor(i / cols) * (bh + gap), w: bw, h: bh }));
    return { land, hud, stage, msg: msgR, gauge: gaugeR, buttons, order };
  };

  // ---- drawing -----------------------------------------------------------------------------------------------------------
  const venue = venueOf(P);
  const K = 0.72, gapN = 0.24;
  const waterVenue = venue === 'boats' || venue === 'beam' || !!SP?.waterVenue;
  const bar = (g, x, y, w, h, frac, color, back) => {
    const { ctx } = g;
    g.rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = back; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1; ctx.stroke();
    if (frac > 0.01) {
      const fw = Math.max(h, w * clamp(frac, 0, 1));
      g.rr(ctx, x, y, fw, h, h / 2); ctx.fillStyle = lin(ctx, x, y, x, y + h, [[0, shade(color, 0.35)], [0.5, color], [1, shade(color, -0.3)]]); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.28)'; g.rr(ctx, x + h * 0.3, y + h * 0.14, fw - h * 0.6, h * 0.26, h * 0.13); ctx.fill();
    }
  };
  const lin = (ctx, x0, y0, x1, y1, stops) => { const gr = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, col]) => gr.addColorStop(o, col)); return gr; };

  const drawHud = (g, r) => {
    const { ctx } = g;
    const mid = 84, half = (r.w - mid) / 2;
    const rows = gripOn ? 3 : 2;
    const panel = (side, x, f, name, spec) => {
      const w = half, align = side < 0 ? 'left' : 'right';
      g.rr(ctx, x, r.y, w, r.h, 14); ctx.fillStyle = lin(ctx, 0, r.y, 0, r.y + r.h, [[0, shade(pal.panel, 0.12)], [1, shade(pal.panel, -0.25)]]); ctx.fill();
      ctx.strokeStyle = rgba(spec.color, 0.9); ctx.lineWidth = 2.5; ctx.stroke();
      // emblem: a medallion in the fighter's colours
      const ex = side < 0 ? x + 24 : x + w - 24, ey = r.y + 24;
      if (SP) SP.emblem(ctx, ex, ey, 13, spec); else {
      ctx.fillStyle = spec.color; ctx.beginPath(); ctx.arc(ex, ey, 13, 0, 7); ctx.fill();
      ctx.strokeStyle = spec.trim; ctx.lineWidth = 3; ctx.stroke();
      }
      g.label(ctx, name, side < 0 ? x + 46 : x + w - 46, ey, g.px(20), pal.ink, align, '800');
      const bx = x + 14, bw = w - 28, top = r.y + 44, bh = Math.max(14, (r.h - 52) / rows - 6);
      const items = [['Balance', f.shown.bal / 100, f.bal < 35 ? pal.bad : pal.good], ['Stamina', f.shown.stam / 100, pal.accent]];
      if (gripOn) items.push([P.grip.label, f.shown.grip / 100, '#6fb4ff']);
      items.forEach(([lab, fr, col], i) => {
        const yy = top + i * (bh + 6);
        bar(g, bx, yy, bw, bh, fr, col, 'rgba(0,0,0,0.45)');
        const lsz = Math.min(g.px(13), bh * 0.95);
        if (lsz >= g.px(0) * 0.95) g.label(ctx, lab, bx + 10, yy + bh / 2 + 0.5, lsz, '#0c141c', 'left', '800');   // bars carry colour; the word is dropped when it would be unreadable
      });
    };
    panel(-1, r.x, you, P.fighters.you.name, P.fighters.you);
    panel(1, r.x + half + mid, rival, P.fighters.rival.name, P.fighters.rival);
    const cx = r.x + r.w / 2;
    g.label(ctx, `${rpts.you} : ${rpts.rival}`, cx, r.y + r.h / 2 + 4, g.px(26), pal.accent, 'center', '900');
    g.label(ctx, 'points', cx, r.y + r.h / 2 + 4 + g.px(24), g.px(13), pal.dim, 'center', '600');
    for (let i = 0; i < P.rounds.count; i++) {
      const px0 = cx - (P.rounds.count - 1) * 10 + i * 20;
      const rr0 = stats.rounds[i];
      ctx.beginPath(); ctx.arc(px0, r.y + 16, 7, 0, 7);
      ctx.fillStyle = rr0 ? (rr0.winner === 'you' ? P.fighters.you.color : P.fighters.rival.color) : 'rgba(255,255,255,0.14)'; ctx.fill();
      ctx.strokeStyle = i === round ? pal.accent : 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.stroke();
    }
  };

  // Spawn one effect. Units: x in ring half-widths from the centre, y in fighter heights above the ground.
  const spawn = (kind, o) => {
    fxN++;
    fx.push({ kind, t: 0, life: 0.5, x: 0, y: 0.5, dir: 1, seed: hash(fxN * 7) * 6.283, seedI: fxN * 13, ...o });
    if (fx.length > 24) fx.shift();
  };
  const fighterX = (side) => (side < 0 ? c * K - gapN : c * K + gapN);

  const sceneFigure = (ctx, f, side, spec, x, gy, H, geo, title, titlePose) => {
    let pose = f.pose;
    if (title) pose = poseOf(titlePose);
    else if (phase === 'resolve' && X?.applied) {
      const mine = X.plan?.[side < 0 ? 'you' : 'rival'], theirs = X.plan?.[side < 0 ? 'rival' : 'you'];
      if (theirs && !mine && f.target !== 'down' && f.target !== 'stagger') pose = blend(f.pose, poseOf('recoil'), 0.9);
      else if (mine && f.target !== 'down') pose = blend(f.pose, hitPose((side < 0 ? X.you : X.rival).pose), 0.8);
    }
    const dir = side < 0 ? 1 : -1;
    const wob = title ? 0 : f.shown.bal < 45 ? Math.sin(T * 9 + side) * (0.45 - f.shown.bal / 100) * 0.14 : 0;
    // the one who falls into water sinks a little
    const sink = waterVenue ? pose.down * H * 0.28 : 0;
    if (sink > 0) { ctx.save(); ctx.globalAlpha = 1 - pose.down * 0.55; }
    const anc = drawFigure(ctx, pose, spec, x, gy + sink, H, dir, { T: title ? titleT : T, weapon: P.weapon, wob });
    if (SP && pose.down < 0.05) SP.adorn(ctx, anc, spec, H, dir, title ? titleT : T);
    if (sink > 0) ctx.restore();
    void geo;
  };

  let titleT = 0;
  const sceneRect = (g, s, title) => {
    const { ctx } = g, S = P.setting;
    const geo = stageGeo(s, venue);
    geo.textY = s.y + s.h * 0.93;
    const { mid, gy, rx, H } = geo;
    ctx.save(); ctx.beginPath(); ctx.rect(s.x, s.y, s.w, s.h); ctx.clip();
    if (!title && shakeT > 0) { const a = shakeAmp * (shakeT / 0.35); ctx.translate(Math.sin(T * 83) * a, Math.cos(T * 71) * a * 0.6); }
    if (SP) SP.drawVenue(ctx, s, geo, title ? titleT : T, title ? 0 : pulse); else drawVenue(ctx, s, S, geo, title ? titleT : T, title ? 0 : pulse, P);
    const lungeOf = (side) => {
      if (title || phase !== 'resolve' || !X) return 0;
      const mm = side < 0 ? X.you : X.rival;
      if (!X.plan) return X.t < IMPACT ? -0.02 : 0;
      const won = X.plan[side < 0 ? 'you' : 'rival'], lostTo = X.plan[side < 0 ? 'rival' : 'you'];
      const k = clamp((X.t - IMPACT) / 0.15, 0, 1) * (1 - clamp((X.t - IMPACT - 0.2) / 0.5, 0, 1));
      return won ? 0.07 * k * (mm.power > 0 ? 1 : 0.4) : lostTo ? -0.09 * k : 0;
    };
    const cc = title ? 0 : c;
    const gap = title ? 0.31 : gapN;
    const yd = title ? 0 : you.pose.down, rd = title ? 0 : rival.pose.down;   // a falling fighter lies out behind: keep the whole body in view
    const xs = [clamp(mid + (cc * K - gap + lungeOf(-1)) * rx, s.x + H * (0.3 + 0.62 * yd), s.x + s.w - H * 0.3), clamp(mid + (cc * K + gap - lungeOf(1)) * rx, s.x + H * 0.3, s.x + s.w - H * (0.3 + 0.62 * rd))];
    const fy = gy + (geo.ry * 0.0);
    // platforms
    if (venue === 'boats') { drawBoat(ctx, xs[0], fy + H * 0.02, H, 1, P.fighters.you.color, P.fighters.you.trim, title ? titleT : T, 0); drawBoat(ctx, xs[1], fy + H * 0.02, H, -1, P.fighters.rival.color, P.fighters.rival.trim, title ? titleT : T, 2); }
    // shadows and stance rings
    const youD = title ? 0 : you.pose.down, rivD = title ? 0 : rival.pose.down;
    if (!waterVenue) { groundShadow(ctx, xs[0], fy, H, youD); groundShadow(ctx, xs[1], fy, H, rivD); }
    if (!title) { drawStance(ctx, xs[0], fy, H, you.shown.bal / 100, T); drawStance(ctx, xs[1], fy, H, rival.shown.bal / 100, T); }
    // draw the one attacking last so they overlap the other
    const youAtt = !title && phase === 'resolve' && X?.plan?.you && !X.plan.rival;
    const tp = P.weapon.front ? ['guard', 'high'] : ['ready', 'ready'];
    const order = youAtt ? [1, 0] : [0, 1];
    const figs = [() => sceneFigure(ctx, you, -1, P.fighters.you, xs[0], fy, H, geo, title, tp[0]), () => sceneFigure(ctx, rival, 1, P.fighters.rival, xs[1], fy, H, geo, title, tp[1])];
    // rival first by default so the player's figure stands in front
    if (youAtt) { figs[1](); figs[0](); } else { figs[1](); figs[0](); }
    void order;
    if (!title) {
      for (const e of fx) { if (!(SP && SP.fx(ctx, e, geo, S))) drawFx(ctx, e, geo, S); }
    }
    drawLight(ctx, s, geo, venue);
    if (!title) {
      // balance dials above the heads
      const rD = Math.max(26, H * 0.14), dy = fy - H * 1.1;
            const cxm = (xs[0] + xs[1]) / 2, half = Math.max((xs[1] - xs[0]) / 2, rD * 1.35);
      const dx0 = clamp(cxm - half, s.x + rD * 1.3, s.x + s.w - rD * 1.3), dx1 = clamp(cxm + half, s.x + rD * 1.3, s.x + s.w - rD * 1.3);
      const dl = SP ? SP.dial : drawDial;
      dl(ctx, dx0, Math.max(s.y + rD * 1.4, dy), rD, you.shown.bal / 100, gripOn ? you.shown.grip / 100 : null, T, -1, P.fighters.you.color);
      dl(ctx, dx1, Math.max(s.y + rD * 1.4, dy), rD, rival.shown.bal / 100, gripOn ? rival.shown.grip / 100 : null, T, 1, P.fighters.rival.color);
      if (phase === 'ready') {
        // the tell: a speech tag beside the rival
        const tm = byId[tell], label = `${tm.name}?`, fsz = g.px(17);
        ctx.font = `800 ${Math.round(fsz)}px system-ui, sans-serif`;
        const tw = ctx.measureText(label).width + 26, th = fsz * 1.9;
        const tx = clamp(xs[1] + H * 0.2, s.x + 6, s.x + s.w - tw - 6), ty = Math.max(s.y + 6, fy - H * 0.82);
        g.rr(ctx, tx, ty, tw, th, th / 2); ctx.fillStyle = 'rgba(255,252,240,0.96)'; ctx.fill();
        ctx.strokeStyle = P.fighters.rival.color; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = 'rgba(255,252,240,0.96)'; ctx.beginPath(); ctx.moveTo(tx + 8, ty + th - 2); ctx.lineTo(tx - 6, ty + th + 12); ctx.lineTo(tx + 24, ty + th - 2); ctx.closePath(); ctx.fill();
        g.label(ctx, label, tx + tw / 2, ty + th / 2 + 1, fsz, '#1a1410', 'center', '800');
      }
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(s.x + 1, s.y + 1, s.w - 2, s.h - 2);
    return geo;
  };
  const drawStage = (g, s) => sceneRect(g, s, false);

  const drawGauge = (g, r) => {
    const { ctx } = g;
    g.rr(ctx, r.x, r.y, r.w, r.h, 14); ctx.fillStyle = lin(ctx, 0, r.y, 0, r.y + r.h, [[0, shade(pal.panel, 0.1)], [1, shade(pal.panel, -0.25)]]); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1.5; ctx.stroke();
    const bx = r.x + 18, bw = r.w - 36, by = r.y + r.h * 0.52, bh = Math.max(16, r.h * 0.3);
    g.label(ctx, phase === 'ready' ? 'Tap a move when the marker is in the bright zone' : phase === 'break' ? '' : 'Catch your breath', r.x + r.w / 2, r.y + r.h * 0.2, Math.max(Math.min(g.px(15), r.h * 0.26), g.px(0) * 0.95), pal.dim, 'center', '600');
    g.rr(ctx, bx, by, bw, bh, bh / 2); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.5; ctx.stroke();
    if (gauge && phase === 'ready') {
      ctx.save(); g.rr(ctx, bx, by, bw, bh, bh / 2); ctx.clip();
      const zx = bx + bw * (gauge.zone - P.timing.window * 1.2), zw = bw * P.timing.window * 2.4;
      ctx.fillStyle = 'rgba(242,193,78,0.3)'; ctx.fillRect(zx, by, zw, bh);
      const px0 = bx + bw * (gauge.zone - P.timing.window / 2), pw = bw * P.timing.window;
      ctx.fillStyle = lin(ctx, 0, by, 0, by + bh, [[0, '#fff1b0'], [0.5, pal.accent], [1, '#c8921e']]); ctx.fillRect(px0, by, pw, bh);
      ctx.restore();
      // glow around the bright zone, pulsing so it reads without colour alone
      ctx.strokeStyle = `rgba(255,236,160,${0.5 + 0.3 * Math.sin(T * 8)})`; ctx.lineWidth = 2; ctx.strokeRect(px0, by - 2, pw, bh + 4);
      const mx = bx + bw * gaugePos();
      const inZone = Math.abs(gaugePos() - gauge.zone) <= P.timing.window / 2;
      ctx.fillStyle = '#ffffff'; g.rr(ctx, mx - 3, by - 8, 6, bh + 16, 3); ctx.fill();
      ctx.fillStyle = inZone ? '#9be3a8' : '#ffffff'; ctx.beginPath(); ctx.moveTo(mx - 9, by - 14); ctx.lineTo(mx + 9, by - 14); ctx.lineTo(mx, by - 2); ctx.closePath(); ctx.fill();
      const left = clamp(1 - R.t / tempo, 0, 1);
      g.rr(ctx, bx, r.y + r.h - 9, bw * left, 4, 2); ctx.fillStyle = left < 0.25 ? pal.bad : pal.dim; ctx.fill();
    }
  };

  const drawIcon = (ctx, kind, x, y, s, col) => {
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(2, s * 0.14); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    switch (kind) {
      case 'grip': ctx.beginPath(); ctx.arc(-s * 0.2, 0, s * 0.3, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(s * 0.2, 0, s * 0.3, 0, 7); ctx.stroke(); break;
      case 'throw': ctx.beginPath(); ctx.arc(0, s * 0.1, s * 0.4, Math.PI * 1.1, Math.PI * 2.3); ctx.stroke(); ctx.beginPath(); ctx.moveTo(s * 0.5, s * 0.05); ctx.lineTo(s * 0.48, s * 0.4); ctx.lineTo(s * 0.18, s * 0.28); ctx.stroke(); break;
      case 'push': ctx.beginPath(); ctx.moveTo(-s * 0.35, -s * 0.3); ctx.lineTo(0, 0); ctx.lineTo(-s * 0.35, s * 0.3); ctx.moveTo(s * 0.05, -s * 0.3); ctx.lineTo(s * 0.4, 0); ctx.lineTo(s * 0.05, s * 0.3); ctx.stroke(); break;
      case 'guard': ctx.beginPath(); ctx.moveTo(-s * 0.35, -s * 0.35); ctx.lineTo(s * 0.35, -s * 0.35); ctx.lineTo(s * 0.35, s * 0.05); ctx.quadraticCurveTo(s * 0.3, s * 0.4, 0, s * 0.5); ctx.quadraticCurveTo(-s * 0.3, s * 0.4, -s * 0.35, s * 0.05); ctx.closePath(); ctx.stroke(); break;
      case 'rest': ctx.beginPath(); ctx.moveTo(-s * 0.35, -s * 0.3); ctx.lineTo(s * 0.1, -s * 0.3); ctx.lineTo(-s * 0.35, s * 0.1); ctx.lineTo(s * 0.1, s * 0.1); ctx.stroke(); break;
      default: ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283, rr0 = i % 2 ? s * 0.18 : s * 0.46; ctx.lineTo(Math.cos(a) * rr0, Math.sin(a) * rr0); } ctx.closePath(); ctx.stroke();
    }
    ctx.restore();
  };

  const drawButtons = (g, lay) => {
    const { ctx } = g;
    for (const b of lay.buttons) {
      const m = moves[b.i];
      const ok = affordable(you, m), live = phase === 'ready';
      const kc = { grip: pal.b, throw: pal.bad, push: pal.accent, strike: pal.bad, guard: pal.good, rest: pal.dim, sidestep: pal.good }[m.kind] ?? pal.dim;
      const picked = pickIdx === b.i && pickT > 0;
      const sc = picked ? 1 - 0.04 * (pickT / 0.35) : 1;
      ctx.save(); ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.scale(sc, sc); ctx.translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
      ctx.globalAlpha = ok && live ? 1 : 0.55;
      g.rr(ctx, b.x, b.y + 3, b.w, b.h, 15); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      g.rr(ctx, b.x, b.y, b.w, b.h, 15);
      ctx.fillStyle = lin(ctx, 0, b.y, 0, b.y + b.h, [[0, shade(picked ? kc : pal.panel, 0.18)], [1, shade(picked ? kc : pal.panel, -0.22)]]); ctx.fill();
      ctx.strokeStyle = picked ? '#fff' : rgba(kc, 0.8); ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; g.rr(ctx, b.x + 3, b.y + 3, b.w - 6, b.h * 0.34, 12); ctx.fill();
      const ir = Math.min(b.h * 0.34, 26);
      ctx.fillStyle = rgba(kc, 0.22); ctx.beginPath(); ctx.arc(b.x + 14 + ir, b.y + b.h / 2, ir, 0, 7); ctx.fill();
      drawIcon(ctx, m.kind, b.x + 14 + ir, b.y + b.h / 2, ir * 1.1, kc);
      const tx = b.x + 14 + ir * 2 + 12;
      const fs = Math.max(Math.min(g.px(20), b.h * 0.3), g.px(0) * 0.95);
      const avail = b.x + b.w - 30 - tx;
      const lines = g.wrap(ctx, m.name, avail, fs).slice(0, 2).map((ln) => {   // a single long word is cut with an ellipsis rather than leaving the card
        ctx.save(); ctx.font = `800 ${Math.round(fs)}px system-ui, sans-serif`;
        let o = ln; if (ctx.measureText(o).width > avail) { while (o.length > 2 && ctx.measureText(o + '\u2026').width > avail) o = o.slice(0, -1); o += '\u2026'; }
        ctx.restore(); return o;
      });
      lines.forEach((ln, i) => g.label(ctx, ln, tx, b.y + b.h * (lines.length > 1 ? 0.3 + i * 0.25 : 0.38), fs, pal.ink, 'left', '800'));
      const sub = m.kind === 'rest' ? `Recover ${Math.abs(m.cost)}` : `${m.kind}  ·  cost ${m.cost}`;
      const ssz = Math.min(g.px(14), b.h * 0.22);
      if (ssz >= g.px(0) * 0.95) g.label(ctx, sub, tx, b.y + b.h - Math.min(15, b.h * 0.2), ssz, pal.dim, 'left', '600');
      g.label(ctx, String(b.i + 1), b.x + b.w - 14, b.y + 16, g.px(13), pal.dim, 'right', '700');
      ctx.restore();
    }
  };

  const drawMessage = (g, r) => {
    const { ctx } = g;
    let text = msg, color = pal.ink;
    if (phase === 'ready') { text = `Round ${round + 1} of ${P.rounds.count}  ·  ${Math.max(0, Math.ceil(P.rounds.time - clock))}s left`; color = pal.dim; }
    else if (phase === 'resolve' && X && !X.applied) { text = ''; }
    else if (X && X.tone) color = X.tone === 'good' ? pal.good : X.tone === 'bad' ? pal.bad : pal.ink;
    if (phase === 'break') color = B.winner === 'you' ? pal.good : pal.bad;
    const size = g.px(phase === 'ready' ? 19 : 24);
    for (const [i, ln] of g.wrap(ctx, text, r.w - 16, size).slice(0, 2).entries()) {
      const yy = r.y + r.h * 0.5 + (i ? size : 0) - (text.length > 40 ? size * 0.5 : 0);
      if (phase !== 'ready') { ctx.font = `800 ${Math.round(size)}px system-ui, sans-serif`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineJoin = 'round'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.strokeText(ln, r.x + r.w / 2, yy); }
      g.label(ctx, ln, r.x + r.w / 2, yy, size, color, 'center', phase === 'ready' ? '600' : '800');
    }
  };

  const act = {
    init,
    point(id) {
      if (!layout) return null;
      const b = layout.buttons.find((x) => x.id === id || x.id === `move:${id}`);
      return b ? { x: b.x + b.w / 2, y: b.y + b.h / 2 } : null;
    },
    update(dt, input) {
      if (done) return;
      const cmd = { move: null, tap: false };
      if (layout) {
        const p = input.pointer;
        if (p.pressed) {
          const hit = layout.buttons.find((b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h);
          if (hit) { cmd.move = hit.i; cmd.tap = true; }
        }
      }
      const kp = input.keys?.pressed;
      if (kp) for (let i = 0; i < Math.min(9, moves.length); i++) if (kp.has(`Digit${i + 1}`)) { cmd.move = i; cmd.tap = true; }
      if (phase !== 'ready') cmd.move = null;
      step(dt, cmd);
    },
    // Watch and learn: the computer plays the player's side, answering the rival's visible stance and tapping inside the bright zone.
    attract(dt) {
      if (done) return;
      const cmd = { move: null, tap: false };
      if (phase === 'ready') {
        if (!act._pick || act._pickFor !== gauge) {
          const dist = new Map(moves.map((m) => [m.id, m.id === tell ? 1 : 0]));
          let pool = moves.filter((m) => affordable(you, m));
          if (!pool.length) pool = [moves[moves.length - 1]];
          let top = pool[0], topV = -Infinity;
          for (const m of pool) { let v = payoff(m, byId[tell], you, rival); if (m.kind === 'rest') v += you.stam < 30 ? 14 : -6; if (v > topV) { topV = v; top = m; } }
          act._pick = moves.indexOf(top); act._pickFor = gauge;
        }
        if (Math.abs(gaugePos() - gauge.zone) < P.timing.window * 0.3) cmd.move = act._pick;
      }
      step(dt, cmd);
    },
    render(g, area) {
      const { ctx } = g;
      layout = geometry(area, g);
      if (SP) { ctx.fillStyle = lin(ctx, 0, area.y, 0, area.y + area.h, [[0, SP.bg[0]], [1, SP.bg[1]]]); ctx.fillRect(area.x, area.y, area.w, area.h); }
      if (layout.order === 'smhgb') { drawStage(g, layout.stage); drawHud(g, layout.hud); } else { drawHud(g, layout.hud); drawStage(g, layout.stage); }
      drawMessage(g, layout.msg);
      drawGauge(g, layout.gauge);
      drawButtons(g, layout);
      if (phase === 'break') {
        const s = layout.stage;
        // a compact banner on the front edge of the ring so the fighters stay in view (store screenshots stay clean)
        const won = B.winner === 'you', txt = `${won ? 'Round to you' : `Round to ${P.fighters.rival.name}`}   ${wins.you} - ${wins.rival}`;
        const fs = g.px(22);
        ctx.font = `800 ${Math.round(fs)}px system-ui, sans-serif`;
        const w = ctx.measureText(txt).width + 44, h = fs * 2, x = s.x + s.w / 2 - w / 2, y = s.y + s.h * 0.86 - h / 2;
        g.rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = 'rgba(10,16,22,0.82)'; ctx.fill();
        ctx.strokeStyle = won ? pal.good : pal.bad; ctx.lineWidth = 3; ctx.stroke();
        g.label(ctx, txt, s.x + s.w / 2, y + h / 2 + 1, fs, won ? pal.good : pal.bad, 'center', '800');
      }
    },
    // Large rendering of the sport for the title screen: the venue with both competitors facing off (no HUD, no input).
    titleArt(g, rect) { titleT += 0.016; return sceneRect(g, rect, true); },
    status() {
      const lim = Math.max(0, Math.ceil(P.rounds.time - clock));
      return { score: tpts.you, label: phase === 'over' ? 'Bout finished' : `Round ${round + 1} of ${P.rounds.count}  ·  ${lim}s  ·  first to ${need}` };
    },
    result: () => done,
    hint() {
      const tm = byId[tell];
      const counters = moves.filter((m) => m.beats.includes(tell) && affordable(you, m));
      tip = counters.length ? `${P.fighters.rival.name} shows ${tm.name}. ${counters.map((m) => m.name).join(' or ')} answers it (a stance can be a feint).` : `${P.fighters.rival.name} shows ${tm.name}. Breathe and look again.`;
      return tip;
    },
    rules() {
      const out = [
        `Best of ${P.rounds.count} rounds, ${P.rounds.time} seconds each; first to ${need} wins the bout.`,
        'Your move beats the rival move listed beside it; with no answer the faster move lands lightly, equal moves lock.',
        'Tap inside the bright zone for a full-strength move; a late tap is weaker. Tapping while a move is playing out tires you.',
      ];
      for (const m of moves) if (m.beats?.length) out.push(`${m.name} beats ${m.beats.map((id) => byId[id]?.name ?? id).join(' and ')}.`);
      return out;
    },
    getState: () => ({
      phase, round, wins, rpts, tpts, clock, c: Math.round(c * 1000) / 1000, tell, intent, level: P.level,
      you: { bal: you.bal, stam: you.stam, grip: you.grip }, rival: { bal: rival.bal, stam: rival.stam, grip: rival.grip },
      gauge: gauge ? { pos: gaugePos(), zone: gauge.zone, window: P.timing.window } : null,
      moves: moves.map((m) => ({ id: m.id, kind: m.kind, cost: m.cost, power: m.power, needs: m.needs ?? null, beats: m.beats, ok: affordable(you, m) })),
      stats, over: !!done, t: Math.round(T * 100) / 100,
    }),
  };
  init();
  return act;
}

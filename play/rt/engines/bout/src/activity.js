// Bout activity (docs/ENGINE-CONTRACT.md "Activity engines"): a one-on-one contest of strength, balance and timing.
//
// A bout is a series of EXCHANGES. In each exchange the rival shows a stance (the "tell", honest on the easy level, sometimes a
// feint on harder ones); you choose a move by tapping its button while the timing marker is inside the bright zone. Both moves are then
// resolved through the relationship table (`beats`), the timing quality, stamina, grip and balance; points, push-outs and falls follow.
// Everything about a tradition is data: moves, ring, scoring, rounds, timing, level, look. No injuries are shown: only balance, grip,
// push-outs, touches and falls to the mat.

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
  fighters: { you: { name: 'You', color: '#d64b3c', trim: '#f2c14e' }, rival: { name: 'Rival', color: '#2d7bd6', trim: '#f5f1e8' } },
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
  down: { down: 1, lean: 0, crouch: 0, hf: [0, 0], hb: [0, 0], sf: 0, sb: 0, stick: 0 },
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
  const { rng, palette: pal } = env;
  const L = LEVELS[clamp(Math.round(P.level), 1, 3)];
  const moves = (P.moves ?? DEFAULT_MOVES).map((m) => ({ speed: 2, cost: 8, power: 10, points: 0, push: 0, beats: [], kind: 'strike', pose: 'ready', ...m }));
  const byId = Object.fromEntries(moves.map((m) => [m.id, m]));
  const gripOn = P.grip.enabled === true;
  const need = Math.floor(P.rounds.count / 2) + 1;
  const tempo = P.timing.tempo * L.tempoK;
  const IMPACT = 0.4, ANIM = 1.1, BREAK = 2.0;

  // ---- state -------------------------------------------------------------------------------------------------------------
  let phase, round, wins, rpts, tpts, clock, c, you, rival, hist, bigram, tell, intent, rivalQ, gauge, R, X, B, done, msg, msgT, tip, stats, layout = null, T = 0, falls;
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
    if (idx >= 0) {
      stats.attempts++; if (q === 1) stats.perfect++; else if (q === 0.7) stats.good++; else stats.poor++;
      you.stam = clamp(you.stam - Math.max(0, m.cost), 0, 100);
      hist.push(m.id);
      const last = hist.length > 1 ? hist[hist.length - 2] : null;
      if (last) { bigram[last] = bigram[last] ?? {}; bigram[last][m.id] = (bigram[last][m.id] ?? 0) + 1; }
      env.audio?.tone({ freq: q === 1 ? 660 : 420, dur: 0.06, type: 'triangle' });
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
    msg = X.text; msgT = 0;
    env.audio?.tone(X.tone === 'good' ? { freq: 330, to: 520, dur: 0.14, type: 'triangle' } : X.tone === 'bad' ? { freq: 260, to: 170, dur: 0.18, type: 'sawtooth', vol: 0.12 } : { freq: 300, dur: 0.08, type: 'square', vol: 0.08 });
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
      env.audio?.tone({ freq: X.end.winner === 'you' ? 523 : 262, to: X.end.winner === 'you' ? 784 : 196, dur: 0.4, type: 'triangle' });
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
    if (!affordable(you, moves[idx])) { msg = 'Too tired for that: breathe or pick a lighter move'; msgT = 0; env.audio?.tone({ freq: 180, dur: 0.08, type: 'square', vol: 0.08 }); return; }
    commit(idx);
  };
  const step = (dt, cmd) => {
    T += dt; msgT += dt;
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
    if (!land) {
      const hh = clamp(area.h * 0.13, 92, 130);
      hud = { x: area.x, y: area.y, w: area.w, h: hh };
      const stageH = area.h * 0.38;
      stage = { x: area.x, y: hud.y + hud.h + 4, w: area.w, h: stageH };
      msgR = { x: area.x, y: stage.y + stage.h + 2, w: area.w, h: 40 };
      gaugeR = { x: area.x + 6, y: msgR.y + msgR.h + 4, w: area.w - 12, h: clamp(area.h * 0.075, 52, 72) };
      btn = { x: area.x, y: gaugeR.y + gaugeR.h + 10, w: area.w, h: area.y + area.h - (gaugeR.y + gaugeR.h + 10) };
    } else {
      const lw = Math.floor(area.w * 0.58), hh = clamp(area.h * 0.17, 80, 110);
      hud = { x: area.x, y: area.y, w: lw, h: hh };
      stage = { x: area.x, y: hud.y + hud.h + 4, w: lw, h: area.h - hh - 4 - 44 };
      msgR = { x: area.x, y: stage.y + stage.h, w: lw, h: 44 };
      const rx = area.x + lw + 12, rw = area.w - lw - 12;
      gaugeR = { x: rx, y: area.y + 6, w: rw, h: clamp(area.h * 0.14, 56, 76) };
      btn = { x: rx, y: gaugeR.y + gaugeR.h + 12, w: rw, h: area.y + area.h - (gaugeR.y + gaugeR.h + 12) };
    }
    const cols = n > 6 || btn.w > 900 ? 3 : 2, rows = Math.ceil(n / cols), gap = 10;
    const bw = (btn.w - gap * (cols - 1)) / cols, bh = clamp((btn.h - gap * (rows - 1)) / rows, 48, 108);
    const buttons = moves.map((m, i) => ({ i, id: `move:${m.id}`, x: btn.x + (i % cols) * (bw + gap), y: btn.y + Math.floor(i / cols) * (bh + gap), w: bw, h: bh }));
    return { land, hud, stage, msg: msgR, gauge: gaugeR, buttons };
  };

  // two-bone limb: returns the middle joint for a limb from a to b of two equal segments of length s, bending toward `bend` (+1/-1 on the perpendicular)
  const joint = (ax, ay, bx, by, s, bend) => {
    const dx = bx - ax, dy = by - ay, d = Math.max(1e-3, Math.hypot(dx, dy)), h = Math.sqrt(Math.max(0, s * s - (d / 2) * (d / 2)));
    return [ax + dx / 2 + (-dy / d) * h * bend, ay + dy / 2 + (dx / d) * h * bend];
  };
  const limb = (ctx, pts, w, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
  };
  const g_rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  const drawFigure = (ctx, f, spec, x, ground, H, dir, shade) => {
    const p = f.pose, skin = '#e3b78c', dark = shade;
    const body = spec.color, trim = spec.trim;
    if (p.down > 0.5) {
      const y = ground - 0.07 * H, hx = x - dir * 0.12 * H, sx = x - dir * 0.42 * H;
      limb(ctx, [[hx, y], [x + dir * 0.0, ground - 0.26 * H], [x + dir * 0.22 * H, ground - 0.03 * H]], 0.06 * H, body);
      limb(ctx, [[sx, y - 0.01 * H], [x - dir * 0.3 * H, y + 0.02 * H], [x - dir * 0.2 * H, y]], 0.05 * H, skin);
      limb(ctx, [[hx, y], [sx, y]], 0.12 * H, body);
      limb(ctx, [[hx - dir * 0.02 * H, y], [hx + dir * 0.02 * H, y]], 0.13 * H, trim);
      ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(x - dir * 0.52 * H, y - 0.02 * H, 0.068 * H, 0, 7); ctx.fill();
      return;
    }
    const legH = 0.5 * H * (1 - p.crouch * 0.55);
    const hipX = x + dir * Math.sin(p.lean) * 0.08 * H, hipY = ground - legH;
    const a = p.lean, torso = 0.3 * H;
    const shX = hipX + dir * Math.sin(a) * torso, shY = hipY - Math.cos(a) * torso;
    const headX = shX + dir * Math.sin(a) * 0.1 * H, headY = shY - Math.cos(a) * 0.1 * H;
    const feet = [[x + dir * p.sf * H, ground], [x + dir * p.sb * H, ground]];
    const legSeg = 0.26 * H, armSeg = 0.17 * H;
    const kneeF = joint(hipX, hipY, feet[0][0], ground, legSeg, dir > 0 ? -1 : 1), kneeB = joint(hipX, hipY, feet[1][0], ground, legSeg, dir > 0 ? -1 : 1);
    const handF = [shX + dir * p.hf[0] * H, shY - p.hf[1] * H], handB = [shX + dir * p.hb[0] * H, shY - p.hb[1] * H];
    const elbF = joint(shX, shY, handF[0], handF[1], armSeg, dir > 0 ? 1 : -1), elbB = joint(shX, shY, handB[0], handB[1], armSeg, dir > 0 ? 1 : -1);
    // back arm and leg first (darker)
    limb(ctx, [[shX, shY], elbB, handB], 0.055 * H, skin);
    limb(ctx, [[hipX, hipY], kneeB, feet[1]], 0.075 * H, dark);
    limb(ctx, [[hipX, hipY], [shX, shY]], 0.13 * H, body);
    limb(ctx, [[hipX - dir * 0.01 * H, hipY - 0.02 * H], [hipX + dir * Math.sin(a) * 0.04 * H, hipY - 0.07 * H]], 0.14 * H, trim);
    limb(ctx, [[hipX, hipY], kneeF, feet[0]], 0.08 * H, body);
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(headX, headY, 0.07 * H, 0, 7); ctx.fill();
    ctx.fillStyle = trim; ctx.beginPath(); ctx.arc(headX - dir * 0.005 * H, headY - 0.018 * H, 0.071 * H, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
    // weapons
    const angle = (p.stick * Math.PI) / 180;
    const drawStick = (hand, len, w, col, ang) => { limb(ctx, [hand, [hand[0] + dir * Math.cos(ang) * len, hand[1] - Math.sin(ang) * len]], w, col); };
    const wf = P.weapon.front, wb = P.weapon.back;
    if (wb === 'stick') drawStick(handB, 0.42 * H, 0.03 * H, '#b98d52', angle * 0.6 + 0.2);
    if (wb === 'shield') { const sx = handB[0] + dir * 0.05 * H, sy = handB[1]; g_rr(ctx, sx - 0.06 * H, sy - 0.17 * H, 0.12 * H, 0.34 * H, 0.05 * H); ctx.fillStyle = '#8a5a2a'; ctx.fill(); ctx.strokeStyle = '#e8d6a8'; ctx.lineWidth = Math.max(2, 0.012 * H); ctx.stroke(); }
    limb(ctx, [[shX, shY], elbF, handF], 0.058 * H, skin);
    if (wf === 'staff') drawStick(handF, 0.8 * H, 0.032 * H, '#c9a56a', angle);
    else if (wf === 'stick') drawStick(handF, 0.5 * H, 0.03 * H, '#c9a56a', angle);
    else if (wf === 'pillow') { const e = [handF[0] + dir * Math.cos(angle) * 0.36 * H, handF[1] - Math.sin(angle) * 0.36 * H]; limb(ctx, [handF, e], 0.13 * H, '#f2ecdc'); limb(ctx, [handF, e], 0.06 * H, '#e3d5b2'); }
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(handF[0], handF[1], 0.03 * H, 0, 7); ctx.fill();
  };

  const bar = (g, x, y, w, h, frac, color, back) => {
    const { ctx } = g;
    g.rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = back; ctx.fill();
    if (frac > 0.01) { g.rr(ctx, x, y, Math.max(h, w * clamp(frac, 0, 1)), h, h / 2); ctx.fillStyle = color; ctx.fill(); }
  };

  const drawHud = (g, r) => {
    const { ctx } = g;
    const mid = 74, half = (r.w - mid) / 2;
    const rows = gripOn ? 3 : 2;
    const panel = (side, x, f, name, spec) => {
      const w = half, align = side < 0 ? 'left' : 'right';
      g.rr(ctx, x, r.y, w, r.h, 12); ctx.fillStyle = pal.panel; ctx.fill();
      ctx.fillStyle = spec.color; ctx.fillRect(side < 0 ? x : x + w - 6, r.y + 8, 6, r.h - 16);
      g.label(ctx, name, side < 0 ? x + 16 : x + w - 16, r.y + 16, g.px(19), pal.ink, align, '700');
      const bx = x + 16, bw = w - 32, top = r.y + 32, bh = Math.max(10, (r.h - 40) / rows - 6);
      const items = [['Balance', f.shown.bal / 100, f.bal < 35 ? pal.bad : pal.good], ['Stamina', f.shown.stam / 100, pal.accent]];
      if (gripOn) items.push([P.grip.label, f.shown.grip / 100, pal.b]);
      items.forEach(([lab, fr, col], i) => {
        const yy = top + i * (bh + 6);
        bar(g, bx, yy, bw, bh, fr, col, 'rgba(0,0,0,0.35)');
        g.label(ctx, lab, bx + 8, yy + bh / 2, Math.min(g.px(13), bh), '#101820', 'left', '700');
      });
    };
    panel(-1, r.x, you, P.fighters.you.name, P.fighters.you);
    panel(1, r.x + half + mid, rival, P.fighters.rival.name, P.fighters.rival);
    // score badge in the middle
    const cx = r.x + r.w / 2;
    g.label(ctx, `${rpts.you} : ${rpts.rival}`, cx, r.y + r.h / 2 + 4, g.px(22), pal.accent, 'center', '800');
    g.label(ctx, 'points', cx, r.y + r.h / 2 + 4 + g.px(20), g.px(12), pal.dim, 'center', '500');
    // round pips
    for (let i = 0; i < P.rounds.count; i++) {
      const px0 = cx - (P.rounds.count - 1) * 9 + i * 18;
      const rr = stats.rounds[i];
      ctx.beginPath(); ctx.arc(px0, r.y + 16, 6, 0, 7);
      ctx.fillStyle = rr ? (rr.winner === 'you' ? P.fighters.you.color : P.fighters.rival.color) : 'rgba(255,255,255,0.18)'; ctx.fill();
      ctx.strokeStyle = i === round ? pal.accent : 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.stroke();
    }
  };

  const drawStage = (g, s) => {
    const { ctx } = g, S = P.setting;
    ctx.save(); ctx.beginPath(); ctx.rect(s.x, s.y, s.w, s.h); ctx.clip();
    const grd = ctx.createLinearGradient(0, s.y, 0, s.y + s.h);
    grd.addColorStop(0, S.sky[0]); grd.addColorStop(1, S.sky[1]);
    ctx.fillStyle = grd; ctx.fillRect(s.x, s.y, s.w, s.h);
    const groundY = s.y + s.h * 0.8;
    // backdrop
    if (S.backdrop === 'hills') {
      ctx.fillStyle = S.far;
      ctx.beginPath(); ctx.moveTo(s.x, groundY);
      for (let i = 0; i <= 24; i++) { const xx = s.x + (s.w * i) / 24; ctx.lineTo(xx, groundY - s.h * (0.16 + 0.1 * Math.sin(i * 0.55 + 1) + 0.05 * Math.sin(i * 1.7))); }
      ctx.lineTo(s.x + s.w, groundY); ctx.closePath(); ctx.fill();
    } else if (S.backdrop === 'mountains') {
      ctx.fillStyle = S.far;
      ctx.beginPath(); ctx.moveTo(s.x, groundY);
      for (let i = 0; i <= 8; i++) { const xx = s.x + (s.w * i) / 8; ctx.lineTo(xx, groundY - s.h * (i % 2 ? 0.36 : 0.18)); }
      ctx.lineTo(s.x + s.w, groundY); ctx.closePath(); ctx.fill();
    } else if (S.backdrop === 'posts') {
      ctx.fillStyle = S.far;
      for (let i = 0; i < 6; i++) ctx.fillRect(s.x + s.w * (0.08 + i * 0.17), groundY - s.h * 0.36, 8, s.h * 0.36);
      ctx.fillRect(s.x + s.w * 0.05, groundY - s.h * 0.36, s.w * 0.9, 6);
    }
    if (S.crowd) {
      const cols = ['#c25b4a', '#e3b04a', '#4a8cc2', '#6aa56a', '#9a6ac2', '#e08a3a'];
      for (let row = 0; row < 2; row++) for (let i = 0; i < 26; i++) {
        const xx = s.x + ((i + row * 0.5) * s.w) / 25, yy = groundY - s.h * 0.1 - row * s.h * 0.075;
        ctx.fillStyle = cols[(i * 3 + row * 2) % cols.length]; ctx.beginPath(); ctx.arc(xx, yy, s.h * 0.034, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(xx - s.h * 0.034, yy + s.h * 0.02, s.h * 0.068, s.h * 0.06);
      }
    }
    ctx.fillStyle = S.ground; ctx.fillRect(s.x, groundY, s.w, s.y + s.h - groundY);
    // ring
    const Rr = s.w * 0.43, mid = s.x + s.w / 2, ringTop = groundY - s.h * 0.035, ringBot = groundY + s.h * 0.085;
    const kind = P.ring.kind;
    if (kind === 'water') {
      ctx.fillStyle = S.water ?? '#3b7fa6'; ctx.fillRect(s.x, groundY - s.h * 0.02, s.w, s.y + s.h - groundY + s.h * 0.02);
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2;
      for (let i = 0; i < 9; i++) { const yy = groundY + s.h * (0.02 + (i % 3) * 0.05); const xx = s.x + ((i * 0.13 + 0.03) % 1) * s.w; ctx.beginPath(); ctx.arc(xx, yy, 14, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
      ctx.fillStyle = S.ringFill; g.rr(ctx, mid - Rr * 0.98, groundY - s.h * 0.012, Rr * 1.96, s.h * 0.05, 8); ctx.fill();
      ctx.fillStyle = S.ringEdge; ctx.fillRect(mid - Rr * 0.98, groundY + s.h * 0.036, Rr * 1.96, 5);
    } else {
      g.rr(ctx, mid - Rr, ringTop, Rr * 2, ringBot - ringTop, (ringBot - ringTop) / 2);
      ctx.fillStyle = S.ringFill; ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = S.ringEdge; ctx.stroke();
      if (kind === 'mud' || kind === 'sawdust') {
        ctx.fillStyle = 'rgba(0,0,0,0.16)';
        for (let i = 0; i < 40; i++) { const xx = mid - Rr * 0.9 + ((i * 0.6180339) % 1) * Rr * 1.8, yy = ringTop + ((i * 0.37) % 1) * (ringBot - ringTop) * 0.9; ctx.fillRect(xx, yy, 3, 3); }
      }
      if (kind === 'circle' || kind === 'mat') {
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3;
        g.rr(ctx, mid - Rr * 0.9, ringTop + 6, Rr * 1.8, ringBot - ringTop - 12, (ringBot - ringTop) / 2 - 6); ctx.stroke();
      }
    }
    // edge posts
    ctx.fillStyle = S.ringEdge;
    for (const sx of [-1, 1]) { ctx.fillRect(mid + sx * Rr - 5, groundY - s.h * 0.1, 10, s.h * 0.12); ctx.beginPath(); ctx.arc(mid + sx * Rr, groundY - s.h * 0.1, 8, 0, 7); ctx.fill(); }
    if (S.ringStyle === 'rope') { ctx.strokeStyle = 'rgba(245,241,232,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(mid - Rr, groundY - s.h * 0.08); ctx.lineTo(mid + Rr, groundY - s.h * 0.08); ctx.stroke(); }
    // fighters
    const H = Math.min(s.h * 0.56, s.w * 0.38);
    const K = 0.72, gapN = 0.2;
    const lunge = (f, side) => {
      if (phase !== 'resolve' || !X) return 0;
      const mm = side < 0 ? X.you : X.rival;
      if (!X.plan) return X.t < IMPACT ? -0.02 : 0;
      const won = X.plan[side < 0 ? 'you' : 'rival'];
      const lostTo = X.plan[side < 0 ? 'rival' : 'you'];
      const k = clamp((X.t - IMPACT) / 0.15, 0, 1) * (1 - clamp((X.t - IMPACT - 0.2) / 0.5, 0, 1));
      return won ? 0.07 * k * (mm.power > 0 ? 1 : 0.4) : lostTo ? -0.09 * k : 0;
    };
    const xs = [mid + (c * K - gapN + lunge(you, -1)) * Rr, mid + (c * K + gapN - lunge(rival, 1)) * Rr];
    const gy = groundY + s.h * 0.04;
    // shadows
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for (const x of xs) { ctx.beginPath(); ctx.ellipse(x, gy + 3, H * 0.2, H * 0.035, 0, 0, 7); ctx.fill(); }
    const poseFor = (f, side) => {
      if (phase === 'resolve' && X?.applied) {
        const lost = X.plan?.[side < 0 ? 'rival' : 'you'] && !(X.plan?.[side < 0 ? 'you' : 'rival']);
        if (lost && f.target !== 'down' && f.target !== 'stagger') return { ...f, pose: blend(f.pose, poseOf('recoil'), 0.9) };
        if (X.plan?.[side < 0 ? 'you' : 'rival'] && f.target !== 'down') return { ...f, pose: blend(f.pose, hitPose((side < 0 ? X.you : X.rival).pose), 0.8) };
      }
      return f;
    };
    drawFigure(ctx, poseFor(rival, 1), P.fighters.rival, xs[1], gy, H, -1, '#1c2733');
    drawFigure(ctx, poseFor(you, -1), P.fighters.you, xs[0], gy, H, 1, '#1c2733');
    // tell above the rival
    if (phase === 'ready') {
      const tm = byId[tell];
      g.label(ctx, `${tm.name}?`, xs[1], s.y + s.h * 0.1, g.px(18), '#101820', 'center', '700');
    }
    ctx.restore();
    ctx.strokeStyle = pal.dim; ctx.lineWidth = 1; ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1);
  };

  const drawGauge = (g, r) => {
    const { ctx } = g;
    g.rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.fillStyle = pal.panel; ctx.fill();
    const bx = r.x + 14, bw = r.w - 28, by = r.y + r.h * 0.5 - 4, bh = Math.max(14, r.h * 0.32);
    g.label(ctx, phase === 'ready' ? 'Tap a move when the marker is in the bright zone' : phase === 'break' ? '' : 'Catch your breath', r.x + r.w / 2, r.y + 14, Math.min(g.px(15), r.h * 0.28), pal.dim, 'center', '500');
    g.rr(ctx, bx, by, bw, bh, bh / 2); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
    if (gauge && phase === 'ready') {
      const zx = bx + bw * (gauge.zone - P.timing.window * 1.2), zw = bw * P.timing.window * 2.4;
      ctx.fillStyle = 'rgba(242,193,78,0.35)'; ctx.fillRect(clamp(zx, bx, bx + bw), by, Math.min(zw, bx + bw - zx), bh);
      const px0 = bx + bw * (gauge.zone - P.timing.window / 2), pw = bw * P.timing.window;
      ctx.fillStyle = pal.accent; ctx.fillRect(clamp(px0, bx, bx + bw), by, Math.min(pw, bx + bw - px0), bh);
      const mx = bx + bw * gaugePos();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(mx - 3, by - 7, 6, bh + 14);
      // time left to decide
      const left = clamp(1 - R.t / tempo, 0, 1);
      ctx.fillStyle = left < 0.25 ? pal.bad : pal.dim; ctx.fillRect(bx, r.y + r.h - 8, bw * left, 3);
    }
  };

  const drawButtons = (g, lay) => {
    const { ctx } = g;
    for (const b of lay.buttons) {
      const m = moves[b.i];
      const ok = affordable(you, m), live = phase === 'ready';
      g.rr(ctx, b.x, b.y, b.w, b.h, 14);
      ctx.fillStyle = pal.panel; ctx.globalAlpha = ok && live ? 1 : 0.5; ctx.fill();
      ctx.strokeStyle = pal.dim; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1;
      const kc = { grip: pal.b, throw: pal.bad, push: pal.accent, strike: pal.bad, guard: pal.good, rest: pal.dim, sidestep: pal.good }[m.kind] ?? pal.dim;
      ctx.fillStyle = kc; g.rr(ctx, b.x + 8, b.y + 8, 7, b.h - 16, 3); ctx.fill();
      const fs = Math.min(g.px(20), b.h * 0.3);
      const lines = g.wrap(ctx, m.name, b.w - 40, fs).slice(0, 2);
      lines.forEach((ln, i) => g.label(ctx, ln, b.x + 26, b.y + b.h * (lines.length > 1 ? 0.28 + i * 0.26 : 0.36), fs, pal.ink, 'left', '700'));
      const sub = m.kind === 'rest' ? `Recover ${Math.abs(m.cost)}` : `${m.kind}  ·  cost ${m.cost}`;
      g.label(ctx, sub, b.x + 26, b.y + b.h - Math.min(14, b.h * 0.2), Math.min(g.px(14), b.h * 0.22), pal.dim, 'left', '500');
      g.label(ctx, String(b.i + 1), b.x + b.w - 16, b.y + 16, g.px(14), pal.dim, 'right', '600');
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
    for (const [i, ln] of g.wrap(ctx, text, r.w - 16, size).slice(0, 2).entries()) g.label(ctx, ln, r.x + r.w / 2, r.y + r.h * 0.5 + (i ? size : 0) - (text.length > 40 ? size * 0.5 : 0), size, color, 'center', phase === 'ready' ? '500' : '700');
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
      drawHud(g, layout.hud);
      drawStage(g, layout.stage);
      drawMessage(g, layout.msg);
      drawGauge(g, layout.gauge);
      drawButtons(g, layout);
      if (phase === 'break') {
        const s = layout.stage;
        ctx.fillStyle = 'rgba(10,16,22,0.72)'; g.rr(ctx, s.x + s.w * 0.12, s.y + s.h * 0.3, s.w * 0.76, s.h * 0.4, 18); ctx.fill();
        const won = B.winner === 'you';
        g.label(ctx, won ? 'Round to you' : `Round to ${P.fighters.rival.name}`, s.x + s.w / 2, s.y + s.h * 0.45, g.px(28), won ? pal.good : pal.bad, 'center', '800');
        g.label(ctx, `${wins.you} - ${wins.rival}`, s.x + s.w / 2, s.y + s.h * 0.6, g.px(30), pal.accent, 'center', '800');
      }
    },
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

// Tempo Race simulation model: pure, deterministic, no DOM. Player model per vehicle, scripted perfect-play bot,
// calibration of the reference race time, and AI rivals with deterministic pace curves.

export const VEHICLES = {
  // pads: 2 = left/right halves of the screen, 1 = one finger. drag = how quickly speed bleeds away between strokes.
  paddle: { pads: 2, topSpeed: 6.5, drag: 0.55, bpm: 76, cost: 0.06, regen: 0.075 },
  runner: { pads: 2, topSpeed: 5.5, drag: 1.4, bpm: 104, cost: 0.07, regen: 0.085 },
  skater: { pads: 1, topSpeed: 9, drag: 0.2, bpm: 50, cost: 0.06, regen: 0.075 },
  animal: { pads: 1, topSpeed: 15, drag: 0.5, bpm: 90, cost: 0.06, regen: 0.075, gallopSeconds: 16, restSeconds: 9 },
  sailor: { pads: 2, topSpeed: 5.5, drag: 0.4, bpm: 60, cost: 0, regen: 0 },
  sled: { pads: 2, topSpeed: 20, drag: 0.35, bpm: 100, cost: 0.05, regen: 0.08, startPush: 4 },
};

export const TERRAINS = {
  water: { ground: '#2a7fa6', ground2: '#4aa3c4', bank: '#3f7d4a', edge: '#d9f1f7', sky: '#d9eef3' },
  ice: { ground: '#bfe3f2', ground2: '#e7f6fc', bank: '#7f9fb4', edge: '#5b7f98', sky: '#eaf5fa' },
  sand: { ground: '#d6a860', ground2: '#e8c488', bank: '#b98a48', edge: '#fff4d6', sky: '#f6e3b8' },
  snow: { ground: '#eef3f7', ground2: '#ffffff', bank: '#2f5d46', edge: '#6c8ca3', sky: '#dfe9f1' },
  grass: { ground: '#5d9a3c', ground2: '#78b552', bank: '#3b6e2a', edge: '#f2f2e0', sky: '#cfe6c4' },
  mud: { ground: '#6b4a2c', ground2: '#8a6540', bank: '#4f7a34', edge: '#e6d9b8', sky: '#d7c9a8' },
  track: { ground: '#b5532f', ground2: '#c66a43', bank: '#4f8a3c', edge: '#ffffff', sky: '#cfe3f0' },
};

const num = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---- lead object (a cheese, hoop, ball, lure or pacemaker that runs ahead of the racers) ------------------------------
export const LEAD_KINDS = ['cheese', 'hoop', 'ball', 'pacemaker', 'lure'];
const LEAD_COLORS = { cheese: '#f2c14e', hoop: '#c8472f', ball: '#f4f1e8', pacemaker: '#f5f5f5', lure: '#e83f6f' };
const LEAD_NAMES = { cheese: 'Cheese', hoop: 'Hoop', ball: 'Ball', pacemaker: 'Pacemaker', lure: 'Lure' };
function resolveLead(l, vehicle, length) {
  const kind = LEAD_KINDS.includes(l.kind) ? l.kind : 'cheese';
  return {
    kind,
    capture: l.capture === 'catch' ? 'catch' : 'follow',
    startAhead: clamp(num(l.startAhead, 10), 2, Math.min(80, length * 0.4)),
    pace: clamp(num(l.pace, 1), 0.5, 1.5),                 // lead's average speed as a share of the perfect run's average
    bounce: clamp(num(l.bounce, 0.08), 0, 0.5),             // speed ripple (fraction) as it hops over the ground
    bounceEvery: clamp(num(l.bounceEvery, 14), 3, 80),      // metres between hops
    sway: clamp(num(l.sway, 0.25), 0, 1.5),                 // lateral wander in lane widths
    size: clamp(num(l.size, 1), 0.4, 2),
    reach: clamp(num(l.reach, 14), 4, 60),                  // within this many metres the proximity bonus counts
    color: typeof l.color === 'string' ? l.color : LEAD_COLORS[kind],
    label: typeof l.label === 'string' && l.label ? l.label.slice(0, 20) : LEAD_NAMES[kind],
  };
}

export function resolve(user = {}) {
  const vIn = user.vehicle ?? {};
  const kind = VEHICLES[vIn.kind] ? vIn.kind : 'paddle';
  const base = VEHICLES[kind];
  const cIn = user.course ?? {};
  const rIn = user.rhythm ?? {};
  const oIn = user.opponents ?? {};
  const vehicle = { kind, ...base, ...vIn, kind2: undefined };
  delete vehicle.kind2;
  vehicle.kind = kind;
  vehicle.topSpeed = clamp(num(vIn.topSpeed, base.topSpeed), 1, 60);
  const rhythm = { bpm: clamp(num(rIn.bpm, vehicle.bpm ?? base.bpm), 30, 180), window: clamp(num(rIn.window, 0.085), 0.03, 0.2), drum: rIn.drum !== false };
  const length = clamp(num(cIn.length, 600), 100, 20000);
  const terrain = TERRAINS[cIn.terrain] ? cIn.terrain : 'water';
  const course = {
    length, lanes: clamp(Math.round(num(cIn.lanes, 4)), 1, 8), shape: ['straight', 'loop', 'zigzag'].includes(cIn.shape) ? cIn.shape : 'straight',
    lapLength: clamp(num(cIn.lapLength, 200), 50, 5000), terrain, scenery: cIn.scenery ?? 'reeds',
    current: num(cIn.current, 0), slope: Array.isArray(cIn.slope) ? cIn.slope : [{ from: 0, to: length, accel: num(cIn.slope, 0) }],
    wind: { amp: num(cIn.wind?.amp, 0.7), period: num(cIn.wind?.period, 90) },
    bends: { amp: num(cIn.bends?.amp, cIn.shape === 'zigzag' ? 0.8 : 0), wavelength: num(cIn.bends?.wavelength, 140) },
    obstacles: (cIn.obstacles ?? []).filter((o) => o && o.at > 0 && o.at < length).map((o) => ({ at: o.at, kind: o.kind ?? 'gate' })).sort((a, b) => a.at - b.at),
    rough: (cIn.rough ?? []).filter((r) => r && r.to > r.from),
    visible: num(cIn.visible, 0),
  };
  const lIn = cIn.lead && typeof cIn.lead === 'object' ? cIn.lead : null;
  course.lead = lIn ? resolveLead(lIn, vehicle, length) : null;
  const opponents = { count: clamp(Math.round(num(oIn.count, 4)), 1, 7), skill: clamp(num(oIn.skill, 0.88), 0.5, 0.97), spread: clamp(num(oIn.spread, 0.025), 0, 0.1), surge: clamp(num(oIn.surge, 1), 0, 1.6), mistakes: clamp(num(oIn.mistakes, 1), 0, 3) };
  return {
    vehicle, course, rhythm, opponents,
    craft: user.craft ?? null,
    rounds: clamp(Math.round(num(user.rounds, 1)), 1, 5),
    rhythmStars: clamp(num(user.rhythmStars, 0.8), 0.2, 0.95),
    colors: { ...TERRAINS[terrain], ...(user.colors ?? {}) },
    labels: { left: 'Left', right: 'Right', tap: 'Tap', unit: 'm', ...(user.labels ?? {}) },
    obstacleQuality: clamp(num(user.obstacleQuality, 0.5), 0.1, 0.9),
  };
}

// ---- course fields -----------------------------------------------------------------------------------------------
export const slopeAt = (C, s) => { let a = 0; for (const seg of C.slope) if (s >= seg.from && s < seg.to) a += seg.accel ?? 0; return a; };
export const roughAt = (C, s) => C.rough.some((r) => s >= r.from && s < r.to);
// ideal trim for the sailor (wind shift): slow swing plus faster gust shifts, in -1..1
export const windShift = (C, s) => clamp(C.wind.amp * Math.sin((2 * Math.PI * s) / C.wind.period) + 0.25 * Math.sin((2 * Math.PI * s) / (C.wind.period / 3.1) + 1.3), -0.95, 0.95);
// ideal lean for the sled: the curve direction of the zigzag (derivative of the lateral bend), in -1..1
export const curveAt = (C, s) => Math.cos((2 * Math.PI * s) / C.bends.wavelength);
export const bendAt = (C, s) => C.bends.amp * Math.sin((2 * Math.PI * s) / C.bends.wavelength);

// The lead's trajectory: a pure function of time. It runs the course the way a perfect run does (so it accelerates down
// the slope, slows over rough ground and stalls where the hill flattens, exactly as the course physics dictate), smoothed
// over about a second and a half, sped up by `pace` (above 1 it is faster than a perfect run and cannot be caught; below
// 1 a perfect run catches it) and given a head start that fades to nothing at the line. `phase` (from rng) only shifts
// the hops and the sway. It never affects the player or the rivals.
export function createLead(P, ref, phase = 0) {
  const C = P.course, Ld = C.lead, L = C.length, dt = 1 / 60, h = 45;
  const xs = ref.traj, n = xs.length;
  const at = (i) => (i < 0 ? 0 : i >= n ? xs[n - 1] : xs[i]);
  const pre = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + xs[i];
  const sm = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0, cnt = 0;
    const lo = i - h, hi = i + h;
    if (lo < 0) { cnt += -lo; } // before the start the bot sat at 0
    const a = Math.max(0, lo), b = Math.min(n - 1, hi);
    sum += pre[b + 1] - pre[a]; cnt += b - a + 1;
    if (hi > n - 1) { sum += (hi - (n - 1)) * xs[n - 1]; cnt += hi - (n - 1); }
    sm[i] = sum / cnt;
  }
  void at;
  const tEnd = n * dt, vEnd = Math.max(0.5, (sm[n - 1] - sm[Math.max(0, n - 61)]) / Math.min(1, tEnd));
  const base = (tt) => {
    if (tt <= 0) return 0;
    if (tt >= tEnd) return sm[n - 1] + (tt - tEnd) * vEnd;
    const f = tt / dt - 1, i = Math.floor(f);
    if (i < 0) return sm[0] * (tt / dt);
    if (i >= n - 1) return sm[n - 1];
    return sm[i] + (sm[i + 1] - sm[i]) * (f - i);
  };
  const ripple = (2 * Ld.bounce * Ld.bounceEvery) / (2 * Math.PI);
  const side = Math.max(0, (C.lanes - 1) / 2);
  const centre = Math.floor(C.lanes / 2) + 0.5 - C.lanes / 2;
  return {
    x(time) {
      const u = base(time * Ld.pace);
      const head = Ld.startAhead * (1 - clamp(u / L, 0, 1));
      const wob = ripple * Math.sin((2 * Math.PI * u) / Ld.bounceEvery + phase) * Math.min(1, u / 10);
      return Math.min(L + 30, Math.max(0, u + head + wob));
    },
    // lateral wander in lane widths around the player's lane centre, kept on the track
    lat(x) { return clamp(centre + Ld.sway * Math.sin((2 * Math.PI * x) / (Ld.bounceEvery * 3.1) + phase * 1.7), -side, side); },
    // 0..1 height of the hop at this distance
    hop(x) { return Ld.bounce > 0 ? Math.pow(Math.max(0, Math.sin((2 * Math.PI * x) / Ld.bounceEvery + phase + 1.2)), 2) : 0; },
  };
}
// proximity credit 0..1: full inside a quarter of the reach, fading to nothing at the reach, either side of the lead
export const leadCredit = (gap, reach) => { const a = Math.abs(gap), near = reach * 0.25; return a <= near ? 1 : a >= reach ? 0 : 1 - (a - near) / (reach - near); };
export const CATCH_GAP = 0.8;
// share of the lead reward earned by a run (0..1)
export const leadShare = (P, prox, caught) => (P.course.lead.capture === 'catch' ? 0.7 * prox + 0.3 * (caught ? 1 : 0) : prox);
// the quality that stars and scores are graded on: rhythm alone, or rhythm blended with how well the lead was held
export const qualityOf = (P, rhythm, share) => (P.course.lead ? 0.65 * rhythm + 0.35 * share : rhythm);
// heat score (0..100): place and rhythm as before; with a lead, 45 place + 30 rhythm + 25 lead
export const heatScore = (P, place, n, rhythm, share) => (P.course.lead
  ? Math.round(0.75 * placePoints(place, n)) + Math.round(30 * rhythm) + Math.round(25 * share)
  : placePoints(place, n) + Math.round(40 * rhythm));

const GRADE_MULT = { perfect: 1.15, good: 1.07, ok: 0.85, miss: 0.08 };
const GRADE_COST = { perfect: 0.5, good: 0.8, ok: 1.2, miss: 2 };
const GRADE_Q = { perfect: 1, good: 0.8, ok: 0.45, miss: 0.05 };

// ---- player model ------------------------------------------------------------------------------------------------
// inp = { stroke: -1|0|1|2 (side struck this tick, 2 = unspecified), down, pressed, released, side: -1|0|1 }
export function createPlayer(P, lead = null) {
  const V = P.vehicle, C = P.course, R = P.rhythm, kind = V.kind;
  const T = 60 / R.bpm, W = Math.min(R.window, T / 7), top = V.topSpeed, k = V.drag;
  const J0 = (top * k * T) / 1.15;
  const m = {
    rt: 0, x: 0, v: 0, st: 1, q: 0.6, qSum: 0, qT: 0, lat: 0, lean: 0, trim: 0, lastT: -99, lastSide: 0, nextSide: -1,
    strokes: 0, perfect: 0, good: 0, ok: 0, miss: 0, stumbles: 0, clean: 0, obsI: 0, burst: 0, cool: 0, downT: 0, blown: false,
    flash: null, flashT: 0, event: null, T, W, top, J0, finished: false,
    gap: 0, credit: 0, leadSum: 0, leadT: 0, caught: false, caughtT: 0, leadEvent: null,
  };
  const note = (text, tone) => { m.flash = text; m.flashT = 0.7; m.tone = tone; };
  const startPush = () => kind === 'sled' && m.rt < V.startPush;

  const grade = (t) => {
    const ww = W * (roughAt(C, m.x) ? 0.6 : 1);
    let d;
    if (kind === 'skater') d = m.lastT < 0 ? 0 : t - m.lastT - T;
    else d = t - Math.max(1, Math.round(t / T)) * T;
    const a = Math.abs(d);
    let g = a <= ww ? 'perfect' : a <= 2 * ww ? 'good' : a <= 3.2 * ww ? 'ok' : 'miss';
    return { g, early: d < 0, rushed: t - m.lastT < 0.5 * T };
  };

  const doStroke = (side) => {
    const t = m.rt;
    let { g, early, rushed } = grade(t);
    if (rushed) {
      // a second strike inside half a beat does nothing but tire the crew
      m.st = Math.max(0, m.st - V.cost); m.q += (GRADE_Q.miss - m.q) * 0.3; m.miss++; m.strokes++; note('Too fast', 'bad'); m.event = { type: 'stroke', grade: 'miss', side };
      return;
    }
    let s = side === 2 ? (m.lastSide === -1 ? 1 : -1) : side;
    if (kind === 'runner' && s === m.lastSide && m.lastT > -50) { g = 'miss'; m.stumbles++; m.v *= 0.8; note('Same foot: stumble', 'bad'); }
    else note(g === 'perfect' ? 'Perfect!' : g === 'good' ? 'Good' : g === 'ok' ? (early ? 'A little early' : 'A little late') : 'Off the beat', g === 'miss' ? 'bad' : 'good');
    const f = 0.5 + 0.5 * Math.min(1, m.st / 0.4);
    const scale = kind === 'sled' ? 0.9 : 1;
    m.v += J0 * GRADE_MULT[g] * f * scale;
    m.st = Math.max(0, m.st - V.cost * GRADE_COST[g]);
    m.q += (GRADE_Q[g] - m.q) * 0.55;
    m[g]++; m.strokes++; m.lastT = t; m.lastSide = s; m.nextSide = s === -1 ? 1 : -1;
    if (kind === 'paddle') m.lat += s * 0.28;
    m.event = { type: 'stroke', grade: g, side: s };
  };

  const doWhip = () => {
    const t = m.rt;
    const { g } = grade(t);
    if (m.cool > 0) { m.v *= 0.9; m.st = Math.max(0, m.st - 0.08); m.miss++; m.q = Math.max(0, m.q - 0.2); note('Rest the animal', 'bad'); return; }
    if (g === 'miss') { m.v *= 0.88; m.st = Math.max(0, m.st - 0.1); m.miss++; note('Off the stride', 'bad'); m.cool = 1; }
    else { m.burst = g === 'perfect' ? 1.4 : 0.9; m.st = Math.max(0, m.st - 0.1); m.cool = 2.6; m[g]++; m.strokes++; note(g === 'perfect' ? 'Perfect!' : 'Good', 'good'); }
    m.lastT = t;
  };

  const step = (dt, inp = {}) => {
    m.rt += dt; const t = m.rt;
    m.event = null;
    if (m.flashT > 0) m.flashT -= dt;
    const rough = roughAt(C, m.x);
    let mult = 1;
    if (kind === 'paddle' || kind === 'runner' || kind === 'skater' || startPush()) {
      if (inp.stroke) doStroke(inp.stroke);
      m.st = Math.min(1, m.st + V.regen * dt);
      if (t - m.lastT > 1.4 * T && !(kind === 'sled')) m.q = Math.max(0, m.q - 0.4 * dt);
      if (kind === 'paddle') {
        m.lat *= Math.exp(-0.35 * dt);
        const a = Math.min(1.2, Math.abs(m.lat));
        mult = 1 - 0.6 * Math.min(1, a) * Math.min(1, a);
        if (Math.abs(m.lat) >= 1) { m.lat = Math.sign(m.lat) * 1.0; m.v *= Math.exp(-3 * dt); if (!m.bankHit) { note('Bank! Keep to the lane', 'bad'); m.bankHit = 0.8; } }
        if (m.bankHit) m.bankHit = Math.max(0, m.bankHit - dt);
      }
      m.v *= Math.exp(-k * (rough ? 2.2 : 1) * dt);
      if (kind === 'sled') { m.v += 0; }
    }
    if (kind === 'sled') {
      // gravity pull toward top speed; lean must follow the curve; scrub when the lean is wrong
      const c = curveAt(C, m.x);
      if (!startPush() || true) {
        const dir = inp.side ?? 0;
        if (dir) m.lean = clamp(m.lean + dir * 3.2 * dt, -1, 1);
        else m.lean -= Math.sign(m.lean) * Math.min(Math.abs(m.lean), 1.0 * dt);
        const err = Math.abs(m.lean - c);
        const qq = clamp(1 - err / 0.55, 0, 1);
        m.q += (qq - m.q) * Math.min(1, dt * 6);
        if (!startPush()) {
          m.v += top * V.drag * dt * (rough ? 0.6 : 1);
          m.v *= Math.exp(-(V.drag + 0.9 * err * err * 4) * dt);
          if (m.rt > V.startPush) m.v = Math.min(m.v, top * 1.05);
        }
      }
    }
    if (kind === 'sailor') {
      const dir = inp.side ?? 0;
      if (dir) m.trim = clamp(m.trim + dir * 0.9 * dt, -1, 1);
      const opt = windShift(C, m.x);
      const err = Math.abs(m.trim - opt);
      const qq = Math.pow(clamp(1 - err / 0.5, 0, 1), 1.2);
      m.q += (qq - m.q) * Math.min(1, dt * 5);
      const target = top * (0.3 + 0.7 * qq) * (rough ? 0.8 : 1);
      const a = target > m.v ? top / 2.2 : top / 3;
      m.v += clamp(target - m.v, -a * dt, a * dt);
      m.opt = opt;
    }
    if (kind === 'animal') {
      if (inp.down) m.downT += dt;
      const gallop = inp.down && m.downT > 0.2;
      if (inp.released) { if (m.downT < 0.22) doWhip(); m.downT = 0; }
      if (!inp.down && !inp.released) m.downT = 0;
      if (m.cool > 0) m.cool = Math.max(0, m.cool - dt);
      if (m.burst > 0) m.burst = Math.max(0, m.burst - dt);
      if (gallop && !m.blown) m.st = Math.max(0, m.st - dt / V.gallopSeconds);
      else m.st = Math.min(1, m.st + dt * (gallop ? 0.4 : 1) / V.restSeconds * (inp.down ? 0.6 : 1));
      if (m.st <= 0) m.blown = true;
      if (m.blown && m.st > 0.3) m.blown = false;
      let target = m.blown ? 0.4 * top : gallop ? top * (0.75 + 0.25 * Math.min(1, m.st / 0.25)) : 0.55 * top;
      if (m.burst > 0) target += 0.3 * top;
      if (rough) target *= 0.85;
      const a = target > m.v ? top / 2.5 : top / 1.8;
      m.v += clamp(target - m.v, -a * dt, a * dt);
      const qq = m.blown ? 0.1 : gallop ? 1 : 0.55;
      m.q += (qq - m.q) * Math.min(1, dt * 4);
      m.gallop = gallop;
    }
    m.v += slopeAt(C, m.x) * dt;
    if (m.v < 0) m.v = 0;
    const ds = Math.max(0, m.v * mult + (kind === 'animal' ? 0 : C.current)) * dt;
    const before = m.x;
    m.x += ds;
    // obstacle checks: you clear it when your rhythm (or alignment) is good as you reach it
    while (m.obsI < C.obstacles.length && before <= C.obstacles[m.obsI].at && m.x > C.obstacles[m.obsI].at - 0.0001 && m.x >= C.obstacles[m.obsI].at) {
      if (m.q >= P.obstacleQuality) { m.clean++; m.v *= 1.04; note('Clean through the ' + C.obstacles[m.obsI].kind, 'good'); m.event = { type: 'clear' }; }
      else { m.v *= 0.55; m.stumbles++; note('Clumsy: lost speed at the ' + C.obstacles[m.obsI].kind, 'bad'); m.event = { type: 'hit' }; }
      m.obsI++;
    }
    if (t > 1.5 * T) { m.qSum += m.q * dt; m.qT += dt; }
    m.leadEvent = null;
    if (lead && !m.finished) {
      const Ld = C.lead;
      const gap = m.caught ? 0 : lead.x(m.rt) - m.x;
      if (!m.caught && Ld.capture === 'catch' && gap <= CATCH_GAP && m.rt > 0.5) { m.caught = true; m.caughtT = m.rt; m.leadEvent = 'caught'; note('Caught the ' + Ld.label.toLowerCase() + '!', 'good'); }
      m.gap = m.caught ? 0 : gap;
      m.credit = m.caught ? 1 : leadCredit(gap, Ld.reach);
      m.leadSum += m.credit * dt; m.leadT += dt;
    }
    if (m.x >= C.length) m.finished = true;
  };
  const rhythm = () => (m.qT > 0 ? m.qSum / m.qT : 0);
  const proximity = () => (m.leadT > 0 ? m.leadSum / m.leadT : 0);
  return { m, step, rhythm, proximity, T, W };
}

// ---- perfect-play bot (attract mode and reference time) --------------------------------------------------------------
export function createBot(P, pl) {
  const { m, T } = pl; const kind = P.vehicle.kind, C = P.course;
  let whipAt = null, whipStage = 0, resting = false;
  return (dt) => {
    const t = m.rt + dt; // time at which this tick's input is evaluated
    const inp = { stroke: 0, down: false, pressed: false, released: false, side: 0 };
    const beat = (n) => n * T;
    const nearBeat = () => { const n = Math.max(1, Math.round(t / T)); return Math.abs(t - beat(n)) <= dt / 2 + 1e-9 && t - m.lastT > 0.5 * T; };
    if (kind === 'paddle' || kind === 'runner') {
      if (nearBeat()) inp.stroke = m.nextSide;
    } else if (kind === 'skater') {
      if (m.lastT < 0 && t >= 0.4) inp.stroke = 1;
      else if (m.lastT >= 0 && Math.abs(t - m.lastT - T) <= dt / 2 + 1e-9) inp.stroke = 1;
    } else if (kind === 'sled') {
      if (m.rt < P.vehicle.startPush - 0.3) { if (nearBeat()) inp.stroke = m.nextSide; }
      else {
        const want = curveAt(C, m.x + m.v * 0.12);
        const d = want - m.lean;
        inp.side = Math.abs(d) > 0.04 ? Math.sign(d) : 0;
        inp.down = inp.side !== 0;
      }
    } else if (kind === 'sailor') {
      const d = windShift(C, m.x + m.v * 0.5) - m.trim;
      inp.side = Math.abs(d) > 0.03 ? Math.sign(d) : 0;
      inp.down = inp.side !== 0;
    } else if (kind === 'animal') {
      if (whipStage === 1) { inp.released = true; whipStage = 0; return inp; }               // second tick of the whip tap: release
      if (m.blown || m.st < 0.1) resting = true;
      if (m.st > 0.4) resting = false;
      if (!resting && m.cool === 0 && m.st > 0.55 && m.burst === 0) {
        // plan a whip at the next beat that is at least 0.3 s away
        if (whipAt === null) { const n = Math.ceil((t + 0.3) / T); whipAt = beat(n); }
      }
      if (whipAt !== null) {
        if (Math.abs(t - whipAt) <= dt / 2 + 1e-9) { inp.pressed = true; inp.down = true; whipStage = 1; whipAt = null; return inp; }
        if (whipAt - t < 0.3) return inp;   // let go before the beat so the next press is a clean tap
      }
      inp.down = !resting;
    }
    return inp;
  };
}

const refCache = new Map();
function botRun(P, lead, trace) {
  const pl = createPlayer(P, lead), bot = createBot(P, pl), dt = 1 / 60;
  while (!pl.m.finished && pl.m.rt < 900) { pl.step(dt, bot(dt)); if (trace) trace.push(pl.m.x); }
  return pl;
}
export function reference(P) {
  const key = JSON.stringify(P);
  if (refCache.has(key)) return refCache.get(key);
  const trace = [];
  let pl = botRun(P, null, P.course.lead ? trace : null);
  const out = { time: pl.m.rt, rhythm: pl.rhythm(), quality: pl.rhythm(), lead: null, traj: null };
  if (P.course.lead) {
    out.traj = Float32Array.from(trace);
    // second run alongside the lead (phase 0): how well a perfect player holds it. The lead never affects the player.
    pl = botRun(P, createLead(P, out, 0), null);
    const prox = pl.proximity(), share = leadShare(P, prox, pl.m.caught);
    out.lead = { prox, share, caught: pl.m.caught };
    out.quality = qualityOf(P, out.rhythm, share);
  }
  refCache.set(key, out);
  return out;
}

// ---- rivals ------------------------------------------------------------------------------------------------------
const F = (a, x) => (x <= 1 ? x + (a * Math.sin(2 * Math.PI * x)) / (2 * Math.PI) : x);
export function createRivals(P, tRef, rng, heat = 0) {
  const O = P.opponents, C = P.course, L = C.length, out = [];
  const lanes = C.lanes;
  const playerLane = Math.floor(lanes / 2);
  const free = []; for (let i = 0; i < lanes; i++) if (i !== playerLane) free.push(i);
  for (let i = 0; i < O.count; i++) {
    const skill = clamp(O.skill - i * O.spread + heat * 0.012, 0.5, 0.985);
    const a = rng.range(-0.3, 0.3) * O.surge;
    const tFin = tRef / skill;
    const react = rng.range(0.05, 0.35);
    const pen = (1.1 * L) / tFin;
    const posRaw = (t) => { const x = (t - react) / tFin; return x <= 0 ? 0 : L * F(a, x); };
    const hits = C.obstacles.map((o) => {
      const mistake = rng.chance(clamp((1 - skill) * 2.4 * O.mistakes, 0, 0.6));
      let lo = 0, hi = tFin * 2;
      for (let n = 0; n < 30; n++) { const mid = (lo + hi) / 2; if (posRaw(mid) < o.at) lo = mid; else hi = mid; }
      return mistake ? lo : null;
    }).filter((v) => v !== null);
    out.push({ i, skill, a, tFin, lane: i < free.length ? free[i] : free[i % free.length], wob: rng.range(0, 6.28), fin: null,
      pos(t) { let p = posRaw(t); for (const h of hits) { const u = clamp((t - h) / 0.7, 0, 1); p -= pen * 0.9 * u * u * (3 - 2 * u); } return Math.max(0, p); } });
  }
  return out;
}

export const placePoints = (place, n) => Math.round((60 * (n + 1 - place)) / n);
export function heatStars(place, n, rhythm, thr) {
  const podium = Math.max(1, Math.min(3, Math.ceil((n + 1) / 2)));
  const good = rhythm >= thr;
  if (place === 1) return good ? 3 : 2;
  if (place === 2 && podium >= 2) return good ? 2 : 1;
  if (place <= podium) return 1;
  return 0;
}

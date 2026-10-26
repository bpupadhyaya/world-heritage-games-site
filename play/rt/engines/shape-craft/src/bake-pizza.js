// shape-craft bake mode `pizza` (1.26.0): Neapolitan pizza. A different game from the tonir, in a different kitchen:
//   stretch  press in the middle and drag outward, again and again all the way round: only an outward stroke stretches (the middle thin, the rim left puffy)
//   dress    paint the sauce from the middle out and keep it off the rim, then place the cheese and the leaves (or garlic and oregano) evenly; Undo takes the last one off
//   launch   press and hold on the oven floor: the peel pushes in; slide left or right with the pointer and let go where the floor is hot but not scorching
//   bake     the side facing the fire colours first: turn the pizza a quarter at a time so it colours evenly, and take it out when it is spotted and golden
// Score of a pizza = the stretch, the dressing, the launch and (most of all) the bake; the round is the mean of the table of pizzas.
import { registerTechnique } from './registry.js';
import { starsFor, hash } from './geom.js';
import { shadowed, rrect, rgba, mix, tint } from './fx.js';
import { hintPill, dockRect } from './paint-ui.js';
import { fx as synth } from '../../../platform/engine-kit/synth.js';
import { createPuffs, clamp, lerp, sm, r3, lin, rad, TAU } from './kc-fire-lib.js';
import { drawPizzaStage, drawPizzaHud, drawPizzaThumb } from './pizza-art.js';

const S = 18, R = 7, RIM = 6, NC = S * R;                  // the dough in polar cells: 18 sectors, 7 rings, the outer ring is the rim
const ringRho = (r) => (r + 0.5) / R, cellPhi = (s) => ((s + 0.5) * TAU) / S, AREA = Array.from({ length: R }, (_, r) => 2 * r + 1);
const TOTAL_AREA = AREA.reduce((a, b) => a + b, 0) * S;
const M_GOAL = 0.32, D_GOOD = 0.62, D_BURN = 1.15, RATE0 = 0.14;
const LAYERS = { margherita: ['sauce', 'cheese', 'basil'], marinara: ['sauce', 'garlic', 'oregano'] };
const NAMES = { margherita: 'Margherita', marinara: 'Marinara' };
const LAYER_TEXT = { sauce: 'Sauce', cheese: 'Cheese', basil: 'Basil', garlic: 'Garlic', oregano: 'Oregano' };
const MAXP = { cheese: 12, garlic: 10, basil: 5 }, WANT = { cheese: 10, garlic: 8, basil: 4 };
const FIRE = { fx: -0.7, fd: 0.7 };                       // where the fire sits on the oven floor (left, toward the back)
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
const floorHeat = (fx, fd) => 0.5 + 0.95 * Math.exp(-(((fx - FIRE.fx) ** 2) / 0.62 + ((fd - FIRE.fd) ** 2) / 0.5)) + 0.18 * fd;

function createSound(audio) {
  const F = (kind, p) => { try { return synth(audio, kind, p); } catch { return false; } };
  return {
    stretch(v) { F('scrape', { hz: 300 + v * 160, dur: 0.14, vel: 0.14 + Math.min(0.2, v * 0.08) }); },
    tear() { F('impact', { mat: 'skin', hz: 480, vel: 0.3 }); F('bad', { hz: 300, vel: 0.3, delay: 0.03 }); },
    sauce() { F('splash', { vel: 0.16 }); },
    place(k) { F('pop', { vel: 0.4 }); if (k === 'basil') F('tick', { hz: 2400, vel: 0.2, delay: 0.03 }); },
    undo() { F('pop', { vel: 0.3 }); },
    launch() { F('whoosh', { dur: 0.35, vel: 0.35, down: false }); },
    drop(q) { F('impact', { mat: 'wood', hz: 170, vel: 0.5 }); F('thud', { hz: 80, vel: 0.35 }); F(q > 0.6 ? 'good' : 'bad', { hz: q > 0.6 ? 620 : 240, vel: 0.28, delay: 0.1 }); },
    turn() { F('scrape', { hz: 1400, dur: 0.25, vel: 0.3 }); F('whoosh', { dur: 0.25, vel: 0.25 }); },
    crackle() { F('tick', { hz: 2600, vel: 0.16 }); },
    out(q) { F('scrape', { hz: 1800, dur: 0.22, vel: 0.35 }); F(q > 0.6 ? 'good' : 'bad', { hz: q > 0.6 ? 720 : 250, vel: 0.35, delay: 0.1 }); },
    burnt() { F('scrape', { hz: 900, dur: 0.35, vel: 0.3 }); F('bad', { hz: 200, vel: 0.35 }); },
    win(stars) { F('good', { hz: 660 + stars * 60, vel: 0.5 }); F('ring', { hz: 1760, dur: 1.0, vel: 0.22, delay: 0.1 }); },
  };
}

export function createPizza(P, env) {
  const { rng } = env, SC = P.scene ?? {};
  const snd = createSound(env.audio);
  if (env.options?.soundLog) for (const k of Object.keys(snd)) { const f = snd[k]; snd[k] = (...a) => { env.options.soundLog.push({ kind: `pizza.${k}` }); return f(...a); }; }
  const puffs = createPuffs(240);
  const TOTAL = Math.max(2, Math.min(5, P.pizzas ?? 3));

  let ptr, now, idx, kind, ix, th, hole, sauce, herb, pieces, d, rot, rotTo, turnAt, drop, lp, parts, results, done, hintMsg, hintT, auto, lastP, geo, phaseT, outAt, strokeSnd, crackAt, types, lumps, nTurns, state0, doughSeed;
  const stageList = () => ['stretch', ...LAYERS[kind], 'launch', 'bake'];
  const stage = () => (done ? 'done' : stageList()[ix]);

  // ---- setup -------------------------------------------------------------------------------------------------------------------------------
  const newPizza = () => {
    kind = types[idx]; ix = 0; doughSeed = idx + 1; phaseT = 0;
    lumps = Array.from({ length: 4 }, () => ({ phi: rng.range(0, TAU), rho: rng.range(0.1, 0.8), r: rng.range(0.25, 0.45), a: rng.range(0.2, 0.42) }));
    th = new Array(NC).fill(0).map((_, k) => { const r = Math.floor(k / S), s = k % S, rho = ringRho(r), phi = cellPhi(s); return r === RIM ? 1.0 : 1.0 + lumps.reduce((a, b) => a + b.a * Math.exp(-(((rho * Math.cos(phi) - b.rho * Math.cos(b.phi)) ** 2 + (rho * Math.sin(phi) - b.rho * Math.sin(b.phi)) ** 2) / (b.r * b.r))), 0) + (hash(k, doughSeed) - 0.5) * 0.06; });
    hole = new Array(NC).fill(false); sauce = new Array(NC).fill(0); herb = new Array(NC).fill(0); pieces = []; d = new Array(NC).fill(0);
    rot = 0; rotTo = 0; turnAt = -9; drop = null; lp = null; parts = { stretch: 0, layers: [], launch: 0, bake: 0 }; lastP = null; outAt = -9; nTurns = 0; state0 = 0;
  };
  const init = () => {
    ptr = null; now = 0; idx = 0; results = []; done = null; hintMsg = ''; hintT = 0; strokeSnd = -9; crackAt = -9;
    const sw = rng.int(2); types = Array.from({ length: TOTAL }, (_, i) => ((i + sw) % 2 === 1 ? 'marinara' : 'margherita'));
    auto = { wait: 0.5, k: 0, strokeT: 0, phase: 0 };
    newPizza();
    if (P.__debug) preset(P.__debug);
  };
  // QA presets for screenshots (spec.params.__debug, never set by a fixture)
  const preset = (dbg) => {
    now = dbg.now ?? 4; auto.wait = 999; ix = dbg.ix ?? 0; if (dbg.kind) { types[idx] = dbg.kind; kind = dbg.kind; }
    if (dbg.mean) th = th.map((v, k) => (Math.floor(k / S) === RIM ? v : v * (dbg.mean / interior().m)));
    if (ix >= 1) { th = th.map((v, k) => (Math.floor(k / S) === RIM ? 1.0 : 0.32 + (hash(k, 3) - 0.5) * 0.06)); }
    if (ix >= 1) sauce = sauce.map((_, k) => (Math.floor(k / S) < RIM ? 0.8 : 0));
    if (ix >= 2 && kind === 'margherita') for (let k = 0; k < 10; k++) pieces.push({ kind: 'cheese', rho: 0.15 + 0.55 * Math.sqrt((k + 0.5) / 10), phi: k * 2.4, rot: hash(k, 1) * 6, size: 0.9 + hash(k, 2) * 0.3 });
    if (ix >= 3 && kind === 'margherita') for (let k = 0; k < 4; k++) pieces.push({ kind: 'basil', rho: 0.45, phi: k * 1.57 + 0.6, rot: k, size: 1 });
    if (dbg.drop) { drop = { fx: dbg.drop[0], fd: dbg.drop[1], H0: floorHeat(dbg.drop[0], dbg.drop[1]) }; }
    if (stage() === 'bake') { if (!drop) drop = { fx: -0.2, fd: 0.5, H0: floorHeat(-0.2, 0.5) }; if (dbg.d) d = d.map((_, k) => dbg.d * (0.7 + 0.6 * hash(k, 4)) + 0.2 * Math.cos(cellPhi(k % S) - 3.14) * dbg.d); }
  };

  // ---- measuring ---------------------------------------------------------------------------------------------------------------------------
  const interior = () => { let sw = 0, s1 = 0, s2 = 0, holes = 0; for (let r = 0; r < RIM; r++) for (let s = 0; s < S; s++) { const k = r * S + s, w = AREA[r], v = th[k]; sw += w; s1 += w * v; s2 += w * v * v; if (hole[k]) holes++; } const m = s1 / sw; return { m, e: Math.sqrt(Math.max(0, s2 / sw - m * m)) / Math.max(0.05, m), holes }; };
  const rimMean = () => { let s1 = 0; for (let s = 0; s < S; s++) s1 += th[RIM * S + s]; return s1 / S; };
  const sectorBalance = () => { const ms = []; for (let s = 0; s < S; s++) { let a = 0, w = 0; for (let r = 0; r < RIM; r++) { a += AREA[r] * th[r * S + s]; w += AREA[r]; } ms.push(a / w); } const m = ms.reduce((a, b) => a + b, 0) / S; return Math.sqrt(ms.reduce((a, b) => a + (b - m) ** 2, 0) / S) / Math.max(0.05, m); };
  const stretchQ = () => {
    const { m, e, holes } = interior(), rm = rimMean(), bal = sectorBalance();
    const mQ = clamp(1 - Math.max(0, Math.abs(m - M_GOAL) - 0.05) / 0.25, 0, 1), eQ = clamp(1 - Math.max(0, e - 0.14) / 0.3, 0, 1), rQ = clamp((rm - 0.55) / 0.35, 0, 1), bQ = clamp(1 - Math.max(0, bal - 0.06) / 0.2, 0, 1);
    return (0.34 * mQ + 0.34 * eQ + 0.16 * rQ + 0.16 * bQ) * Math.pow(0.8, holes);
  };
  const sauceCover = () => { let c = 0, n = 0, rs = 0; for (let r = 0; r < RIM; r++) for (let s = 0; s < S; s++) { n += AREA[r]; if (sauce[r * S + s] >= 0.45) c += AREA[r]; } for (let s = 0; s < S; s++) if (sauce[RIM * S + s] > 0.3) rs++; return { c: c / n, rs: rs / S }; };
  const herbCover = () => { let c = 0, n = 0; for (let r = 0; r < RIM; r++) for (let s = 0; s < S; s++) { n += AREA[r]; if (herb[r * S + s] >= 0.4) c += AREA[r]; } return c / n; };
  const placed = (k) => pieces.filter((q) => q.kind === k);
  const spreadQ = (list, want) => {
    const n = list.length; if (!n) return 0;
    const bins = new Set(list.map((q) => `${Math.floor(((q.phi % TAU) + TAU) % TAU / (TAU / 4))}${q.rho < 0.55 ? 0 : 1}`)).size;
    const near = list.filter((q, i) => list.every((o, j) => i === j || Math.hypot(q.rho * Math.cos(q.phi) - o.rho * Math.cos(o.phi), q.rho * Math.sin(q.phi) - o.rho * Math.sin(o.phi)) >= 0.2)).length / n;
    const nQ = n >= want - 2 && n <= want + 2 ? 1 : clamp(1 - Math.abs(n - want) / want, 0, 1);
    return 0.4 * (bins / 8) + 0.3 * near + 0.3 * nQ + (bins >= 6 ? 0.1 : 0) * 0 + 0 + (bins / 8 >= 0.75 ? 0.0 : 0);
  };
  const leafQ = () => { const l = placed('basil'), n = l.length; if (!n) return 0; const a = l.map((q) => q.phi).sort((x, y) => x - y); let gap = TAU; for (let i = 0; i < n; i++) gap = Math.min(gap, i === n - 1 ? a[0] + TAU - a[i] : a[i + 1] - a[i]); return 0.5 * (n === WANT.basil ? 1 : n === WANT.basil - 1 || n === WANT.basil + 1 ? 0.75 : clamp(n / WANT.basil, 0, 1)) + 0.5 * clamp(gap / 1.0, 0, 1); };
  const layerQ = (k) => (k === 'sauce' ? (() => { const { c, rs } = sauceCover(); return clamp((c - 0.35) / 0.55, 0, 1) * clamp(1 - rs / 0.45, 0, 1); })() : k === 'oregano' ? clamp((herbCover() - 0.1) / 0.5, 0, 1) : k === 'basil' ? leafQ() : Math.min(1, spreadQ(placed(k), WANT[k]) * 1.08));
  const optimum = () => { // the place on the floor where the heat is right for a whole pizza: hot, but not at the fire
    let best = null, bs = 1e9; for (let i = -9; i <= 9; i++) for (let j = 0; j <= 10; j++) { const fx = i / 10, fd = 0.15 + j * 0.07, H = floorHeat(fx, fd), sc = Math.abs(H - 1.0) + 0.12 * Math.abs(fx + 0.1); if (sc < bs) { bs = sc; best = { fx, fd }; } } return best;
  };
  const dropQ = (fx, fd) => { const o = optimum(), e = Math.hypot(fx - o.fx, (fd - o.fd) * 1.4); return clamp(1 - Math.max(0, e - 0.1) / 0.45, 0, 1); };
  const meanD = () => { let a = 0; for (let r = 0; r < R; r++) for (let s = 0; s < S; s++) a += AREA[r] * d[r * S + s]; return a / TOTAL_AREA * 1; };
  const sdD = () => { const m = meanD(); let a = 0; for (let r = 0; r < R; r++) for (let s = 0; s < S; s++) a += AREA[r] * (d[r * S + s] - m) ** 2; return Math.sqrt(a / TOTAL_AREA); };
  const bakeQ = () => { const m = meanD(), dev = Math.abs(m - D_GOOD), bell = dev <= 0.07 ? 1 : Math.max(0, 1 - (dev - 0.07) / 0.35); return bell * (1 - clamp((sdD() - 0.06) / 0.25, 0, 0.6)); };
  const pizzaScore = () => { const ls = parts.layers.length ? parts.layers.reduce((a, b) => a + b, 0) / LAYERS[kind].length : 0; return Math.round(100 * (0.3 * parts.stretch + 0.2 * ls + 0.1 * parts.launch + 0.4 * parts.bake)); };

  // ---- actions -----------------------------------------------------------------------------------------------------------------------------
  const say = (m) => { hintMsg = m; hintT = now; };
  const next = () => {
    if (done) return false;
    const st = stage();
    if (st === 'stretch') { parts.stretch = stretchQ(); }
    else if (LAYERS[kind].includes(st)) { parts.layers.push(layerQ(st)); }
    else return false;
    ix++; phaseT = 0; lastP = null; snd.place('x');
    return true;
  };
  const undo = () => { const st = stage(); if (!MAXP[st]) return; const l = placed(st); if (!l.length) return; pieces.splice(pieces.lastIndexOf(l[l.length - 1]), 1); snd.undo(); };
  const startLaunch = (fx) => { if (stage() !== 'launch' || lp) return; lp = { t0: now, fx: clamp(fx, -0.95, 0.95) }; snd.launch(); };
  const releaseLaunch = () => {
    if (!lp) return; const depth = clamp((now - lp.t0) / 1.6, 0, 1), fd = 0.1 + depth * 0.85, fx = lp.fx; lp = null;
    if (depth < 0.12) return;
    const q = dropQ(fx, fd), H0 = floorHeat(fx, fd);
    parts.launch = q; drop = { fx, fd, H0 }; snd.drop(q); ix++; phaseT = 0; nTurns = 0;
    say(q > 0.8 ? 'Just the right place on the floor.' : q > 0.4 ? 'A little close to the fire or the door.' : 'Too near the fire, or too far from it.');
    if (geo) puffs.emit('flour', geo.ovenX(fx), geo.ovenY(fd), { count: 8, size: 12, speed: 40, life: 1.0, alpha: 0.4, grow: 2, drift: 10 });
  };
  const turn = () => { if (stage() !== 'bake' || now - turnAt < 0.55) return false; rotTo += Math.PI / 2; turnAt = now; nTurns++; snd.turn(); return true; };
  const takeOut = () => {
    if (stage() !== 'bake') return false;
    parts.bake = bakeQ(); const sc = pizzaScore(), m = meanD();
    results.push({ kind, score: sc, stretch: parts.stretch, dress: parts.layers.reduce((a, b) => a + b, 0) / LAYERS[kind].length, launch: parts.launch, bake: parts.bake, d: m, turns: nTurns }); outAt = now;
    snd.out(parts.bake); say(parts.bake > 0.85 ? 'Spotted and golden.' : m < D_GOOD ? 'Out too early: pale and soft.' : 'Out too late: dark.');
    if (geo) puffs.emit('steam', geo.ovenX(drop?.fx ?? 0), geo.ovenY(drop?.fd ?? 0.5), { count: 4, size: 18, speed: 30, life: 1.5, alpha: 0.35, grow: 2.2 });
    endPizza(); return true;
  };
  const endPizza = () => { idx++; if (idx >= TOTAL) finish(); else { phaseT = 0; newPizza(); } };
  const finish = () => {
    while (results.length < TOTAL) results.push({ kind: types[results.length], score: 0, stretch: 0, dress: 0, launch: 0, bake: 0, d: 0, turns: 0, lost: true });
    const s = Math.round(results.reduce((a, b) => a + b.score, 0) / TOTAL), stars = starsFor(s), W = SC.words ?? {};
    done = { score: s, max: 100, stars, headline: stars === 3 ? (W.win ?? 'Straight from the wood fire') : stars ? (W.ok ?? 'A good pizza') : (W.retry ?? 'Back to the counter'), detail: `${results.filter((r) => r.score >= 85).length} of ${TOTAL} pizzas just right`, note: 'Neapolitan pizza is stretched by hand and baked in moments in a wood-fired oven.' };
    snd.win(stars);
  };
  const control = (id) => {
    if (done) return;
    if (id === 'next') next(); else if (id === 'undo') undo(); else if (id === 'turn') turn(); else if (id === 'out') takeOut();
    else if (id === 'check') { if (stage() === 'bake') { parts.bake = bakeQ(); results.push({ kind, score: pizzaScore(), stretch: parts.stretch, launch: parts.launch, bake: parts.bake, d: meanD(), turns: nTurns }); } finish(); }
  };
  const items = () => {
    const st = stage();
    if (st === 'stretch') return [{ id: 'next', kind: 'btn', label: 'Dress it', primary: true }, { id: 'check', kind: 'btn', label: 'Finish' }];
    if (LAYERS[kind].includes(st)) { const l = LAYERS[kind], nx = l[l.indexOf(st) + 1]; return [...(MAXP[st] ? [{ id: 'undo', kind: 'btn', label: 'Undo' }] : []), { id: 'next', kind: 'btn', label: nx ? LAYER_TEXT[nx] : 'To the oven', primary: true }, { id: 'check', kind: 'btn', label: 'Finish' }]; }
    if (st === 'launch') return [{ id: 'check', kind: 'btn', label: 'Finish' }];
    return [{ id: 'turn', kind: 'btn', label: 'Turn' }, { id: 'out', kind: 'btn', label: 'Take out', primary: true }, { id: 'check', kind: 'btn', label: 'Finish' }];
  };

  // ---- time --------------------------------------------------------------------------------------------------------------------------------
  const heatOf = (s) => (drop?.H0 ?? 1) * (1 + 0.6 * Math.cos(cellPhi(s) + rot + Math.PI * 0 - fireAngle()));
  const fireAngle = () => { const dx = FIRE.fx - (drop?.fx ?? 0), dy = (FIRE.fd - (drop?.fd ?? 0.5)) * 1.4; return Math.atan2(-dy, dx); };   // direction from the pizza to the fire (screen angle, up positive)
  const tick = (dt) => {
    now += dt; phaseT += dt; puffs.update(dt);
    rot += (rotTo - rot) * Math.min(1, dt * 11);
    if (stage() === 'bake') {
      for (let r = 0; r < R; r++) for (let s = 0; s < S; s++) {
        const k = r * S + s, wa = cellPhi(s) - rot, hh = (drop?.H0 ?? 1) * (1 + 0.6 * Math.cos(wa - fireAngle())), ringF = r === RIM ? 1.3 : r === 0 ? 0.85 : 1;
        d[k] += RATE0 * hh * ringF * clamp(Math.pow(M_GOAL / Math.max(0.12, hole[k] ? 0.12 : r === RIM ? 0.7 : th[k]), 0.35), 0.8, 1.5) * dt;
      }
      if (now - crackAt > 0.9 && meanD() > 0.05) { crackAt = now; snd.crackle(); }
      if (geo && Math.floor(now * 6) !== Math.floor((now - dt) * 6)) puffs.emit('ember', geo.ovenX(FIRE.fx) + (hash(Math.floor(now * 6), 3) - 0.5) * 30, geo.ovenY(FIRE.fd) - 8, { count: 1, size: 3, speed: 30, life: 1.6, gravity: -24, color: '#ff8a2a', spread: 0.8, drift: 10 });
      if (meanD() > D_BURN) { results.push({ kind, score: 0, burnt: true, stretch: parts.stretch, launch: parts.launch, bake: 0, d: meanD(), turns: nTurns }); snd.burnt(); say('It burnt in the oven.'); endPizza(); }
    }
  };

  // ---- pointer ------------------------------------------------------------------------------------------------------------------------------
  const polar = (x, y) => { const dx = (x - geo.disc.x) / geo.disc.R, dy = (y - geo.disc.y) / geo.disc.R; return { rho: Math.hypot(dx, dy), phi: Math.atan2(dy, dx) }; };
  const arcDist = (rho, phi, r, s) => { const dphi = Math.abs(angDiff(cellPhi(s), phi)), rr = ringRho(r); return Math.hypot(rr - rho, Math.min(rr, rho + 0.08) * dphi); };
  const setPtr = (rho, phi) => { if (geo) ptr = { x: geo.disc.x + Math.cos(phi) * rho * geo.disc.R, y: geo.disc.y + Math.sin(phi) * rho * geo.disc.R, t: now }; };
  const stretchStroke = (rho, phi, vr, dt) => {
    setPtr(rho, phi);
    if (vr < 0.4 || rho > 1.1) return;
    const sf = clamp(vr / 1.6, 0, 1.7);
    for (let r = 0; r < R; r++) for (let s = 0; s < S; s++) {
      const dist = arcDist(rho, phi, r, s); if (dist >= 0.22) continue;
      const w = sm(1 - dist / 0.22), k = r * S + s;
      if (hole[k]) continue;
      if (r < RIM) { if (rho < 0.88 && th[k] > 0.22) th[k] = 0.22 + (th[k] - 0.22) * Math.exp(-30.0 * sf * w * dt); }
      else if (rho >= 0.86) th[k] *= Math.exp(-4.5 * sf * w * dt);   // pressing on the rim flattens it
      if (r < RIM && sf > 1.45 && th[k] < 0.7 && hash(k, Math.floor(now * 60), doughSeed) < (sf - 1.45) * 0.05 * w) th[k] = Math.max(0, th[k] - 0.3);   // pushed too fast: weak places and tears
      if (th[k] < 0.1) { th[k] = 0; hole[k] = true; snd.tear(); }
    }
    if (now - strokeSnd > 0.16) { strokeSnd = now; snd.stretch(sf); }
    if (geo && Math.floor(now * 12) !== Math.floor((now - dt) * 12)) puffs.emit('flour', geo.disc.x + Math.cos(phi) * rho * geo.disc.R, geo.disc.y + Math.sin(phi) * rho * geo.disc.R, { count: 1, size: 7, speed: 14, life: 0.8, alpha: 0.35, grow: 1.6, drift: 6 });
  };
  const paint = (arr, rho, phi, dt, rate) => {
    setPtr(rho, phi);
    for (let r = 0; r < R; r++) for (let s = 0; s < S; s++) { const dist = arcDist(rho, phi, r, s); if (dist >= 0.2) continue; const k = r * S + s; arr[k] = Math.min(1, arr[k] + rate * dt * sm(1 - dist / 0.2)); }
    if (now - strokeSnd > 0.2) { strokeSnd = now; snd.sauce(); }
  };
  const place = (rho, phi) => {
    const st = stage(); if (!MAXP[st]) return false;
    phi = ((phi % TAU) + TAU) % TAU;
    if (rho > 0.84) { say('Keep the rim clear.'); return false; }
    if (placed(st).length >= MAXP[st]) { say('That is plenty. Press Undo to take one off.'); return false; }
    setPtr(rho, phi);
    pieces.push({ kind: st, rho, phi, rot: hash(pieces.length, idx, 5) * TAU, size: 0.88 + hash(pieces.length, idx, 6) * 0.3 }); snd.place(st);
    if (geo) puffs.emit('flour', geo.disc.x + Math.cos(phi) * rho * geo.disc.R, geo.disc.y + Math.sin(phi) * rho * geo.disc.R, { count: 2, size: 8, speed: 18, life: 0.6, alpha: 0.25, grow: 1.5 });
    return true;
  };
  const inRect = (r, x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  const work = (p, dt = 1 / 60) => {
    if (!geo || done) return;
    const st = stage(); if (!geo.area || !inRect(geo.area, p.x, p.y) && !p.down) { if (st === 'launch' && lp && !p.down) releaseLaunch(); lastP = null; return; }
    if (st === 'stretch' || st === 'sauce' || st === 'oregano') {
      if (p.down) {
        const q = polar(p.x, p.y);
        if (st === 'stretch') { if (lastP) stretchStroke(q.rho, q.phi, (q.rho - lastP.rho) / Math.max(1e-6, dt), dt); }
        else if (q.rho < 1.0) paint(st === 'sauce' ? sauce : herb, q.rho, q.phi, dt, st === 'sauce' ? 22 : 26);
        lastP = q;
      } else lastP = null;
    } else if (MAXP[st]) {
      if (p.pressed) { const q = polar(p.x, p.y); if (q.rho <= 1.1) place(q.rho, q.phi); }
    } else if (st === 'launch') {
      const fx = (p.x - geo.oven.x) / (geo.oven.rx * 0.9);
      if (p.pressed && inRect(geo.area, p.x, p.y)) startLaunch(fx);
      if (lp) { if (p.down) lp.fx = clamp(fx, -0.95, 0.95); else releaseLaunch(); }
    } else if (st === 'bake') { if (p.pressed && inRect(geo.area, p.x, p.y)) turn(); }
  };

  // ---- attract: stretches all the way round, paints the sauce in a spiral, places the toppings evenly, launches at the right spot, turns when one side runs ahead -------------
  const attract = (dt) => {
    if (done) return;
    if (auto.wait > 0) { auto.wait -= dt; return; }
    const st = stage();
    if (st === 'stretch') {
      const { m, e, holes } = interior(); if (m <= M_GOAL + 0.03 && e < 0.24 && holes === 0 || auto.k > 160) { next(); auto.wait = 0.3; auto.k = 0; auto.strokeT = 0; return; }
      // a stroke from the middle out, 0.5 s long at 1.3 disc radii a second, then the next direction a sector round
      const T = 0.36; auto.strokeT += dt; const phi = (auto.k * 2.399963) % TAU, r00 = [0.06, 0.24, 0.42][auto.k % 3], rho = r00 + (0.8 - r00) * Math.min(1, auto.strokeT / T);
      stretchStroke(rho, phi, (0.8 - r00) / T, dt);
      if (auto.strokeT >= T) { auto.strokeT = 0; auto.k++; }
      return;
    }
    if (st === 'sauce' || st === 'oregano') {
      const arr = st === 'sauce' ? sauce : herb, goal = st === 'sauce' ? 0.55 : 0.4, c = st === 'sauce' ? sauceCover().c : herbCover();
      if (c >= goal + 0.28 || auto.strokeT > 6) { next(); auto.wait = 0.3; auto.strokeT = 0; return; }
      auto.strokeT += dt; const a = auto.strokeT * 7, rho = Math.min(0.8, 0.06 + auto.strokeT * 0.3); paint(arr, rho, a % TAU, dt, st === 'sauce' ? 22 : 26);
      return;
    }
    if (MAXP[st]) {
      const n = placed(st).length;
      if (n >= WANT[st]) { next(); auto.wait = 0.3; return; }
      // golden-angle pattern: every piece lands in its own part of the pizza
      const i = n, rho = 0.12 + 0.62 * Math.sqrt((i + 0.5) / WANT[st]), phi = i * 2.399963;
      place(rho, phi); auto.wait = 0.15; return;
    }
    if (st === 'launch') {
      if (!lp) { const o = optimum(); startLaunch(o.fx); auto.opt = o; return; }
      const depth = (now - lp.t0) / 1.6; if (0.1 + depth * 0.85 >= auto.opt.fd) { releaseLaunch(); auto.wait = 0.3; } return;
    }
    if (st === 'bake') {
      if (meanD() >= D_GOOD - 0.005) { takeOut(); auto.wait = 0.4; return; }
      // turn when the fire side runs ahead of the far side
      let hi = -1, lo = 9; for (let s = 0; s < S; s++) { let a = 0; for (let r = 0; r < R; r++) a += AREA[r] * d[r * S + s]; a /= 49; hi = Math.max(hi, a); lo = Math.min(lo, a); }
      if (hi - lo > 0.075 && now - turnAt > 0.9) { turn(); }
    }
  };

  const hint = () => {
    if (done) return '';
    if (hintMsg && now - hintT < 3.5) return hintMsg;
    const st = stage();
    if (st === 'stretch') { const { m } = interior(); return m > M_GOAL + 0.2 ? 'Press in the middle and drag outward, all the way round. Leave the rim.' : rimMean() < 0.7 ? 'The rim is flattened: keep the strokes off the edge.' : 'Thin and even: dress it.'; }
    if (st === 'sauce') return sauceCover().rs > 0.15 ? 'Sauce on the rim: keep it back from the edge.' : 'Paint the sauce from the middle outward, leaving a finger of rim.';
    if (st === 'oregano') return 'Sprinkle the oregano over the sauce by dragging.';
    if (MAXP[st]) return `Place the ${st === 'basil' ? 'leaves' : st === 'garlic' ? 'slices' : 'cheese'} evenly: ${placed(st).length} of about ${WANT[st]}.`;
    if (st === 'launch') return lp ? 'Let go where the floor is hot but not at the fire.' : 'Press and hold: the peel pushes in. Slide left or right, let go on the lit patch.';
    const m = meanD(); return m < 0.25 ? 'It is starting to rise. Turn it so the side by the fire does not run ahead.' : m < D_GOOD - 0.06 ? 'Turn it a quarter now and then to colour it evenly.' : m < D_GOOD + 0.1 ? 'Spotted and golden: take it out!' : 'It is getting dark: take it out!';
  };

  // ---- geometry ---------------------------------------------------------------------------------------------------------------------------------
  const geometry = (W0) => {
    const dock = dockRect(W0), Rpx = Math.min(W0.w * 0.37, (W0.h - 40) * 0.42), disc = { x: W0.x + W0.w * 0.5, y: W0.y + 34 + (W0.h - 40) * 0.55, R: Rpx };
    const oven = { x: W0.x + W0.w * 0.5, y: W0.y + W0.h * 0.6, rx: W0.w * 0.43, ry: W0.h * 0.2 };
    return { W0, dock, disc, oven, area: { x: W0.x, y: W0.y + 30, w: W0.w, h: W0.h - 30 }, ovenX: (fx) => oven.x + fx * oven.rx * 0.9, ovenY: (fd) => oven.y + oven.ry * (0.85 - 1.7 * fd) };
  };
  const V = () => ({ now, stage: stage(), ix, kind, th, hole, sauce, herb, pieces, d, rot, drop, lp, parts, results, TOTAL, idx, hint: hint(), done, puffs, ptr: ptr && now - ptr.t < 0.4 ? ptr : null, turnAt, outAt, meanD: meanD(), sdD: sdD(), D_GOOD, M_GOAL, interior: interior(), rim: rimMean(), cover: sauceCover(), herbC: herbCover(), floorHeat, FIRE, optimum: optimum(), fireAngle: fireAngle(), WANT, MAXP, placed, layers: LAYERS[kind], nTurns, S, R, RIM, ringRho, cellPhi, AREA, NAMES, LAYER_TEXT, heatOf });
  const draw = (g, Rt) => { const G = geometry(Rt.work); geo = G; const v = V(); drawPizzaStage(g, G, v); drawPizzaHud(g, G, v); drawPizzaThumb(g, Rt.thumb, v); };
  const titleArt = (g, S0, t) => { const G = geometry({ x: S0.x - S0.w * 0.14, y: S0.y - S0.h * 0.03, w: S0.w * 1.28, h: S0.h * 1.06 }), v = { ...V(), hint: '', now: t ?? 0, stage: 'bake', drop: { fx: -0.15, fd: 0.5, H0: 1 }, meanD: 0.55, d: new Array(NC).fill(0).map((_, k) => 0.45 + 0.25 * hash(k, 91)), sauce: new Array(NC).fill(0).map((_, k) => (Math.floor(k / S) < RIM ? 0.9 : 0)), th: new Array(NC).fill(0.32), pieces: Array.from({ length: 9 }, (_, k) => ({ kind: 'cheese', rho: 0.18 + 0.52 * Math.sqrt((k + 0.5) / 9), phi: k * 2.4, rot: hash(k, 7) * 6, size: 1 })), puffs: createPuffs(1) }; drawPizzaStage(g, G, v); };
  const state = () => { const st = stage(), it = interior(); return { technique: 'bake', mode: 'pizza', stage: st, idx, total: TOTAL, kind, turns: nTurns, interior: { mean: r3(it.m), uneven: r3(it.e), holes: it.holes }, rim: r3(rimMean()), sauce: sauceCover().c > 0 ? { cover: r3(sauceCover().c), rim: r3(sauceCover().rs) } : null, placed: { cheese: placed('cheese').length, basil: placed('basil').length, garlic: placed('garlic').length }, herb: r3(herbCover()), launch: lp ? r3(clamp((now - lp.t0) / 1.6, 0, 1)) : -1, opt: optimum(), drop, bake: st === 'bake' ? { mean: r3(meanD()), sd: r3(sdD()), sectors: Array.from({ length: S }, (_, s) => { let a = 0; for (let r = 0; r < R; r++) a += AREA[r] * d[r * S + s]; return r3(a / 49); }), fire: r3(fireAngle()), rot: r3(rotTo) } : null, results: results.map((q) => ({ kind: q.kind, score: q.score })), parts: { stretch: r3(parts.stretch), layers: parts.layers.map(r3), launch: r3(parts.launch) } }; };

  init();
  const api = {
    init, items, control, work, tick, draw, titleArt, attract, hint, state, result: () => done,
    score: () => Math.round(results.reduce((a, b) => a + b.score, 0) / TOTAL),
    info: () => [`Pizza ${Math.min(idx + 1, TOTAL)} of ${TOTAL}: ${NAMES[kind]}`, { stretch: 'Stretch the dough', sauce: 'Sauce', cheese: 'Cheese', basil: 'Basil', garlic: 'Garlic', oregano: 'Oregano', launch: 'Into the oven', bake: 'In the oven', done: '' }[stage()]],
    get caption() { return SC.words?.caption ?? 'Make this pizza'; },
    rules: () => [
      'Stretch the dough with the heels of your fingers: press in the middle and drag outward, then again in another direction, all the way round. Only an outward stroke thins the dough; keep the strokes off the edge or the puffy rim goes flat. Aim for a middle about a third of the starting thickness, the same all the way round.',
      'Dress it: paint the sauce from the middle outward and keep it off the rim, then place the cheese and the basil leaves (or the garlic slices and a sprinkle of oregano on a marinara) in a spread, not in a heap. Undo takes the last piece off.',
      'Into the oven: press and hold on the oven floor and the peel pushes in; slide left or right and let go where the floor is hot but not at the fire. The floor is hottest by the logs.',
      'Bake: the side of the pizza facing the fire colours first, so turn it a quarter at a time to colour it evenly. Take it out when the rim is spotted and golden; leave it and it burns.',
      'Score of a pizza: the stretch, the dressing, the place in the oven and, most of all, the bake. The round is the mean of the pizzas of the table. Finish stops the round now.',
    ],
    point(id) {
      if (!geo) return null;
      const [k, rest] = id.split(':');
      if (k === 'disc') { const [rho, phi] = rest.split(',').map(Number); return { x: geo.disc.x + Math.cos(phi) * rho * geo.disc.R, y: geo.disc.y + Math.sin(phi) * rho * geo.disc.R }; }
      if (k === 'floor') { const [fx, fd] = rest.split(',').map(Number); return { x: geo.ovenX(fx), y: geo.ovenY(fd) }; }
      return null;
    },
  };
  return api;
}

export { S as PIZZA_S, R as PIZZA_R, RIM as PIZZA_RIM };
void registerTechnique; void shadowed; void rrect; void rgba; void mix; void tint; void lerp; void lin; void rad; void hintPill; void dockRect;

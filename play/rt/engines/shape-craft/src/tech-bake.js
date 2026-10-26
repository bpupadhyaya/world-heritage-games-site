// shape-craft technique `bake` (1.26.0): flatbread on the hot wall of an oven. Lavash is stretched thin over a padded cushion, slapped onto the inner wall of the
// tonir (a clay-lined pit oven), watched as it blisters and browns, and hooked off at the right moment. Several sheets bake at once, so the cook stretches the next
// one while the last ones colour.
//   stretch  drag over the dough on the cushion: each pass thins what is under it (speed matters: too fast tears, too slow does nothing); even and thin is the goal
//   slap     press on the wall where the sheet should go and hold: the cushion swings back; let go inside the lit window of the swing bar to stick it cleanly
//   bake     the wall has heat zones (hot low and on the fire side, cool high); thin spots colour first; sheets cool the patch of wall they leave
//   peel     tap a sheet to hook it off: pale means raw, brown is right, black is lost
// Score per sheet = thinness and evenness, how cleanly it stuck, the colour at the pull; the round is the mean over the sheets of the order.
import { registerTechnique } from './registry.js';
import { starsFor, hash } from './geom.js';
import { dockRect } from './paint-ui.js';
import { fx as synth } from '../../../platform/engine-kit/synth.js';
import { createPuffs, clamp, lerp, sm, r3 } from './kc-fire-lib.js';
import { createPizza } from './bake-pizza.js';
import { drawBakeStage, drawBakeHud, drawBakeThumb, BAKE_LOOKS } from './bake-art.js';

export const CW = 14, CH = 9;                              // cells of the dough
const SHEET = { w: 0.24, h: 0.42 };                       // a sheet on the wall, in wall units (0..1 across, 0..1 down)
const COLS = [0.2, 0.5, 0.8], ROWS = [0.27, 0.72];
export const SLOTS = ROWS.flatMap((v) => COLS.map((u) => ({ u, v })));
const T_FULL = 1.7, WIN = 0.13, WIN2 = 0.3;                // swing bar length, clean and wrinkled windows (seconds)
const D_GOOD = 0.72, RATE0 = 0.131, D_BURN = 1.35;         // colour at the pull, base cooking rate, where a sheet falls into the embers
const HOLD_MIN = 0.55;                                      // a wall cooler than this will not hold a sheet
const M_GOAL = 0.34;                                        // target thickness (the dough starts at about 1)

function createSound(audio) {
  const F = (kind, p) => { try { return synth(audio, kind, p); } catch { return false; } };
  return {
    roll(v) { F('scrape', { hz: 380 + v * 220, dur: 0.14, vel: 0.12 + Math.min(0.22, v * 0.14) }); },
    tear() { F('impact', { mat: 'skin', hz: 520, vel: 0.35 }); F('bad', { hz: 300, vel: 0.35, delay: 0.03 }); },
    lift() { F('pop', { vel: 0.4 }); },
    swing() { F('whoosh', { dur: 0.7, vel: 0.35, down: false }); },
    slap(q) { F('impact', { mat: 'skin', hz: 190, vel: 0.7 }); F('thud', { hz: 85, vel: 0.5 }); if (q >= 1) F('ring', { hz: 880, dur: 0.4, vel: 0.12, delay: 0.04 }); },
    fall() { F('impact', { mat: 'skin', hz: 130, vel: 0.5 }); F('splash', { vel: 0.35, delay: 0.1 }); F('bad', { hz: 240, vel: 0.4, delay: 0.1 }); },
    blister(k) { F('pop', { vel: 0.22 + (k % 3) * 0.05 }); },
    peel(q) { F('scrape', { hz: 1800, dur: 0.22, vel: 0.4 }); F('whoosh', { dur: 0.25, vel: 0.3 }); F(q > 0.6 ? 'good' : 'bad', { hz: q > 0.6 ? 700 : 260, vel: 0.35, delay: 0.12 }); },
    burnt() { F('scrape', { hz: 900, dur: 0.35, vel: 0.3 }); F('bad', { hz: 200, vel: 0.35 }); },
    win(stars) { F('good', { hz: 660 + stars * 60, vel: 0.5 }); F('ring', { hz: 1760, dur: 1.0, vel: 0.22, delay: 0.1 }); },
  };
}

export function createBake(P, env) {
  const { rng } = env, SC = P.scene ?? {};
  const snd = createSound(env.audio);
  if (env.options?.soundLog) for (const k of Object.keys(snd)) { const f = snd[k]; snd[k] = (...a) => { env.options.soundLog.push({ kind: `bake.${k}` }); return f(...a); }; }
  const puffs = createPuffs(260);
  const TOTAL = Math.max(2, Math.min(6, P.sheets ?? 4));
  const LOOK = BAKE_LOOKS[P.mode] ?? BAKE_LOOKS.tonir;

  let ptr, rollX, zero, now, phase, phaseT, th, hole, weight, madeN, resolved, sheets, flying, stack, patches, uFire, fireP, nextId, swing, hintMsg, hintT, lastPtr, strokeSnd, tearSnd, done, auto, popSnd, doughSeed, lastSlap, fallen;
  let geo;

  // ---- setup ---------------------------------------------------------------------------------------------------------------------------
  const newDough = () => {
    th = new Array(CW * CH).fill(0); hole = new Array(CW * CH).fill(false); doughSeed = madeN + 1;
    const blobs = Array.from({ length: 4 }, () => ({ x: rng.range(-0.8, 0.8), y: rng.range(-0.7, 0.7), r: rng.range(0.35, 0.6), a: rng.range(0.18, 0.4) }));
    for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) {
      const nx = ((i + 0.5) / CW) * 2 - 1, ny = ((j + 0.5) / CH) * 2 - 1;
      th[j * CW + i] = 1.0 + blobs.reduce((s, b) => s + b.a * Math.exp(-(((nx - b.x) / b.r) ** 2 + ((ny - b.y) / b.r) ** 2)), 0) - 0.12 + (hash(i, j, doughSeed) - 0.5) * 0.06;
    }
    weight = 0.85 + rng.next() * 0.3; madeN++;
    phase = 'stretch'; phaseT = 0; swing = null;
  };
  const init = () => {
    ptr = null; rollX = 0; zero = new Array(CW * CH).fill(0); now = 0; resolved = 0; sheets = []; flying = []; stack = []; patches = []; madeN = 0; nextId = 1; done = null; hintMsg = ''; hintT = 0; lastPtr = null; strokeSnd = -9; tearSnd = -9; popSnd = -9; lastSlap = null; fallen = 0;
    uFire = rng.range(0.3, 0.7); fireP = [rng.range(0, 6.28), rng.range(0, 6.28)];
    auto = { wait: 0.8, row: 0, dirn: 1, y: 0, pass: 0 };
    newDough();
    if (P.__debug) preset(P.__debug);
  };
  // QA presets for screenshots (spec.params.__debug, never set by a fixture)
  const preset = (d) => {
    now = d.now ?? 3; auto.wait = 999;
    if (d.mean) { const f0 = d.mean / stats().m; th = th.map((v) => v * f0); }
    if (d.holes) for (let k = 0; k < d.holes; k++) { hole[(30 + k * 17) % (CW * CH)] = true; th[(30 + k * 17) % (CW * CH)] = 0; }
    for (const q of d.sheets ?? []) {
      const cells = new Array(CW * CH).fill(0).map((_, k) => q.d + (hash(k, 5) - 0.5) * (q.spread ?? 0.1) + (inside(k % CW, Math.floor(k / CW)) ? 0 : 0));
      sheets.push({ id: nextId++, u: q.u, v: q.v, born: -5, cells, th: new Array(CW * CH).fill(M_GOAL), hole: new Array(CW * CH).fill(false), thinQ: 0.9, stickQ: q.wrinkled ? 0.62 : 1, wrinkled: !!q.wrinkled, m: 0.34, e: 0.1, holes: 0, pops: 6, d: q.d });
    }
    if (d.stack) for (const dd of d.stack) stack.push({ score: 90, d: dd });
    madeN = d.made ?? madeN; resolved = d.resolved ?? stack.length;
    if (d.phase === 'aim') phase = 'aim';
    if (d.phase === 'swing') { phase = 'swing'; swing = { t0: now - (d.swingT ?? 0.5), u: d.u ?? 0.5, v: d.v ?? 0.7, valid: true }; }
    if (d.phase === 'wait') phase = 'wait';
  };

  // ---- the oven wall: heat, fire, depletion ----------------------------------------------------------------------------------------------------
  const fire = (t) => 1 + 0.07 * Math.sin(0.33 * t + fireP[0]) + 0.035 * Math.sin(0.87 * t + fireP[1]);
  const heatAt = (u, v, t = now) => {
    const base = 0.62 + 0.78 * sm(Math.pow(clamp(v, 0, 1), 1.25)), side = 0.84 + 0.32 * (1 - Math.abs(u - uFire) * 1.4);
    let dep = 0; for (const p of patches) dep += p.a * Math.exp(-(now - p.t0) * 0.035) * Math.exp(-((((u - p.u) / 0.22) ** 2) + (((v - p.v) / 0.26) ** 2)));
    return Math.max(0.1, fire(t) * base * side - dep);
  };
  const free = (u, v) => !sheets.some((s) => (((u - s.u) / (SHEET.w * 0.92)) ** 2 + ((v - s.v) / (SHEET.h * 0.92)) ** 2) < 1);
  const inRange = (u, v) => u >= SHEET.w / 2 - 0.02 && u <= 1 - SHEET.w / 2 + 0.02 && v >= SHEET.h / 2 - 0.04 && v <= 1 - SHEET.h / 2 + 0.02;
  const swingIdeal = () => 0.78 + (0.35 * (weight - 0.85)) / 0.3;

  // ---- dough on the cushion ----------------------------------------------------------------------------------------------------------------
  const inside = (i, j) => { const nx = ((i + 0.5) / CW) * 2 - 1, ny = ((j + 0.5) / CH) * 2 - 1; return nx * nx + ny * ny <= 1.08; };
  const stats = (arr = th, hl = hole) => {
    let n = 0, s = 0, s2 = 0, holes = 0;
    for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) if (inside(i, j)) { const v = arr[j * CW + i]; n++; s += v; s2 += v * v; if (hl[j * CW + i]) holes++; }
    const m = s / n; return { m, e: Math.sqrt(Math.max(0, s2 / n - m * m)) / Math.max(0.05, m), holes };
  };
  const brush = (nx, ny, v, dt, B) => {   // a stroke at (nx, ny) in dough widths moving v dough widths a second
    if (v < 0.25) return;
    const sf = clamp(v / 2.2, 0, 1.7), R = (B?.rx ?? 200) * 0.26, rx = B?.rx ?? 200, ry = B?.ry ?? 150;
    for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) {
      if (!inside(i, j)) continue;
      const cx = ((i + 0.5) / CW) * 2 - 1, cy = ((j + 0.5) / CH) * 2 - 1, d = Math.hypot((nx - cx) * rx, (ny - cy) * ry);
      if (d >= R) continue;
      const w = sm(1 - d / R), k = j * CW + i;
      if (hole[k]) continue;
      th[k] *= Math.exp(-4.2 * sf * w * dt * (1.15 - 0.3 * weight));
      if (sf > 1.45 && th[k] < 0.7 && hash(k, Math.floor(now * 60), doughSeed) < (sf - 1.45) * 0.05 * w) th[k] = Math.max(0, th[k] - 0.35);   // pulled too fast: weak places and tears
      if (th[k] < 0.1) { th[k] = 0; hole[k] = true; snd.tear(); }
    }
    if (now - strokeSnd > 0.15) { strokeSnd = now; snd.roll(sf); }
    if (geo && Math.floor(now * 14) !== Math.floor((now - dt) * 14)) puffs.emit('flour', geo.B.x + geo.B.w * 0.42 + nx * rx, geo.B.y + geo.B.h * 0.52 + ny * ry, { count: 1, size: 7, speed: 16, life: 0.8, alpha: 0.4, grow: 1.6, drift: 6 });
  };
  const flow = (dt) => {   // the dough slowly evens itself where it touches: forgiving, but never thins
    const nt = th.slice();
    for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) {
      const k = j * CW + i; if (!inside(i, j) || hole[k]) continue;
      let s = 0, n = 0; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = i + a, y = j + b; if (x < 0 || y < 0 || x >= CW || y >= CH || !inside(x, y) || hole[y * CW + x]) continue; s += th[y * CW + x]; n++; }
      if (n) nt[k] = th[k] + (s / n - th[k]) * Math.min(0.6, 0.55 * dt);
    }
    th = nt;
  };
  const doughQuality = (arr, hl) => {
    const { m, e, holes } = stats(arr, hl);
    const mQ = clamp(1 - Math.max(0, Math.abs(m - M_GOAL) - 0.05) / 0.25, 0, 1), eQ = clamp(1 - Math.max(0, e - 0.12) / 0.3, 0, 1);
    return { thin: (0.4 * mQ + 0.6 * eQ) * Math.pow(0.82, holes), m, e, holes };
  };

  // ---- slapping a sheet on the wall ---------------------------------------------------------------------------------------------------------
  const startSwing = (u, v) => { swing = { t0: now, u, v, valid: inRange(u, v) && free(u, v) }; snd.swing(); if (!swing.valid) say(inRange(u, v) ? 'That place is taken.' : 'Aim lower on the wall.'); };
  const say = (m) => { hintMsg = m; hintT = now; };
  const releaseSwing = () => {
    const sw = swing; swing = null; if (!sw || phase !== 'swing') { if (phase === 'swing') phase = 'aim'; return; }
    const Th = now - sw.t0;
    if (Th < 0.25) { phase = 'aim'; return; }
    if (!sw.valid) { phase = 'aim'; return; }
    placeSheet(sw.u, sw.v, Th);
  };
  const placeSheet = (u, v, Th) => {
    const err = Math.abs(Th - swingIdeal()), H = heatAt(u, v);
    let stickQ = err <= WIN ? 1 : err <= WIN2 ? 0.62 : 0;
    if (H < HOLD_MIN) stickQ = 0;
    const dq = doughQuality(th, hole);
    if (stickQ === 0) {
      snd.fall(); fallen++; resolved++;
      stack.push({ score: 0, thin: dq.thin, stick: 0, bake: 0, fell: true });
      if (geo) puffs.emit('crumb', geo.wallX(u), geo.wallY(v) + 20, { count: 8, size: 6, speed: 90, life: 0.9, gravity: 480, color: '#e8d4a6', spread: Math.PI });
      say(H < HOLD_MIN ? 'Too cool there: it would not hold.' : (Th < swingIdeal() ? 'Too early: it fell.' : 'Too late: it fell.'));
      lastSlap = { t: now, u, v, ok: false };
      afterSheet();
      return;
    }
    const cells = new Array(CW * CH).fill(0);
    sheets.push({ id: nextId++, u, v, born: now, cells, th: th.slice(), hole: hole.slice(), thinQ: dq.thin, stickQ, wrinkled: stickQ < 1, m: dq.m, e: dq.e, holes: dq.holes, pops: 0, d: 0 });
    patches.push({ u, v, a: 0.12, t0: now });
    snd.slap(stickQ); lastSlap = { t: now, u, v, ok: true, q: stickQ };
    if (geo) { puffs.emit('flour', geo.wallX(u), geo.wallY(v), { count: 9, size: 14, speed: 60, life: 1.1, alpha: 0.5, grow: 2, color: '#e6d3ac', drift: 12 }); puffs.emit('ember', geo.wallX(u), geo.wallY(v) + 10, { count: 4, size: 5, speed: 40, life: 0.9, gravity: -30, color: '#ff9a3a' }); }
    say(stickQ < 1 ? 'It stuck, but wrinkled.' : 'A clean stick.');
    afterSheet();
  };
  const afterSheet = () => {
    phase = 'slap'; phaseT = 0;
  };
  const sheetStats = (s) => { let n = 0, sm1 = 0, sm2 = 0, burnt = 0; for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) if (inside(i, j)) { const d = s.cells[j * CW + i]; n++; sm1 += d; sm2 += d * d; if (d > 1.05) burnt++; } const m = sm1 / n; return { m, sd: Math.sqrt(Math.max(0, sm2 / n - m * m)), burnt: burnt / n }; };
  const bakeQ = (s) => {
    const { m, sd, burnt } = sheetStats(s), dev = Math.abs(m - D_GOOD);
    const bell = dev <= 0.08 ? 1 : Math.max(0, 1 - (dev - 0.08) / 0.37);
    return bell * (1 - clamp((sd - 0.1) / 0.3, 0, 0.55)) * (1 - 0.6 * burnt);
  };
  const sheetScore = (s) => Math.round(100 * (0.28 * s.thinQ + 0.17 * s.stickQ + 0.55 * bakeQ(s)));
  const peel = (s, auto0 = false) => {
    const q = bakeQ(s), sc = sheetScore(s);
    snd.peel(q);
    stack.push({ score: sc, thin: s.thinQ, stick: s.stickQ, bake: q, d: s.d });
    flying.push({ id: s.id, t0: now, u: s.u, v: s.v, d: s.d, cells: s.cells.slice(), wrinkled: s.wrinkled, th: s.th, hole: s.hole, score: sc, q });
    patches.push({ u: s.u, v: s.v, a: 0.1, t0: now });
    sheets = sheets.filter((x) => x !== s); resolved++;
    say(q > 0.85 ? 'Golden and blistered.' : s.d < D_GOOD ? 'Pulled too early: pale and doughy.' : 'Pulled too late: dark.');
    if (geo) puffs.emit('steam', geo.wallX(s.u), geo.wallY(s.v) - 10, { count: 3, size: 14, speed: 30, life: 1.4, alpha: 0.35, grow: 2.2 });
    void auto0;
    checkEnd();
  };
  const checkEnd = () => { if (!done && resolved >= TOTAL) finish(); };
  const finish = () => {
    const sum = stack.reduce((a, b) => a + b.score, 0), s = Math.round(sum / TOTAL), stars = starsFor(s), W = SC.words ?? {};
    const good = stack.filter((b) => b.score >= 80).length;
    done = { score: s, max: 100, stars, headline: stars === 3 ? (W.win ?? 'Bread for the whole village') : stars ? (W.ok ?? 'Good lavash') : (W.retry ?? 'Back to the oven'), detail: `${good} of ${TOTAL} sheets baked just right, ${fallen} fell`, note: 'Lavash is baked thin on the hot wall of the tonir.' };
    phase = 'done'; snd.win(stars);
  };
  const control = (id) => {
    if (done) return;
    if (id === 'lift') {
      if (phase === 'stretch' && madeN > 0) { phase = 'aim'; snd.lift(); say('Press on the wall and hold; let go in the lit part of the bar.'); }
      else if (phase === 'aim') { phase = 'stretch'; }
    } else if (id === 'check') {
      for (const s of sheets.slice()) peel(s, true);
      if (!done) { while (resolved < TOTAL) { stack.push({ score: 0, thin: 0, stick: 0, bake: 0, fell: true }); resolved++; } finish(); }
    }
  };
  const items = () => [{ id: 'lift', kind: 'btn', label: phase === 'aim' ? 'Back to the board' : 'To the oven', primary: true, off: phase !== 'stretch' && phase !== 'aim' }, { id: 'check', kind: 'btn', label: 'Finish' }];

  // ---- time ---------------------------------------------------------------------------------------------------------------------------
  const tick = (dt) => {
    now += dt; phaseT += dt; puffs.update(dt);
    if (geo) {
      // fire: embers rise from the bed
      if (Math.floor(now * 9) !== Math.floor((now - dt) * 9) && !done) puffs.emit('ember', geo.WALL.x + geo.WALL.w * (0.25 + 0.5 * hash(Math.floor(now * 9), 3)), geo.WALL.y + geo.WALL.h * 0.96, { count: 1, size: 3.6, speed: 36, life: 1.8, gravity: -26, color: '#ff8a2a', spread: 0.8, drift: 12 });
      if (Math.floor(now * 5) !== Math.floor((now - dt) * 5)) puffs.emit('smoke', geo.Z.x + geo.Z.w * (0.34 + 0.32 * hash(Math.floor(now * 5), 4)), geo.Z.y + geo.Z.h * 0.06, { count: 1, size: geo.Z.w * 0.05, speed: 16, life: 2.6, alpha: 0.12, color: '#d8c8b8', grow: 2.6, drift: 10, spread: 0.6 });
    }
    patches = patches.filter((p) => p.a * Math.exp(-(now - p.t0) * 0.035) > 0.01);
    // baking: thin spots colour first, hot spots colour first
    for (const s of sheets.slice()) {
      let sum = 0, n = 0;
      for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) {
        if (!inside(i, j)) continue;
        const k = j * CW + i, nx = ((i + 0.5) / CW) * 2 - 1, ny = ((j + 0.5) / CH) * 2 - 1;
        const H = heatAt(s.u + (nx * SHEET.w) / 2, s.v + (ny * SHEET.h) / 2), thin = s.hole[k] ? 0.12 : s.th[k];
        s.cells[k] += RATE0 * H * clamp(Math.pow(M_GOAL / Math.max(0.1, thin), 0.6), 0.5, 2.4) * dt * (s.wrinkled ? 1 + 0.15 * hash(k, s.id) : 1);
        sum += s.cells[k]; n++;
      }
      s.d = sum / n;
      const level = Math.floor((s.d - 0.12) / 0.16);
      if (level > s.pops && s.d > 0.12 && level <= 6) { s.pops = level; if (now - popSnd > 0.1) { popSnd = now; snd.blister(level); } if (geo) puffs.emit('steam', geo.wallX(s.u), geo.wallY(s.v) - 6, { count: 2, size: 9, speed: 24, life: 1.1, alpha: 0.28, grow: 2 }); }
      if (s.d > D_BURN) {   // burnt through: it falls into the embers
        sheets = sheets.filter((x) => x !== s); resolved++; stack.push({ score: 0, thin: s.thinQ, stick: s.stickQ, bake: 0, burnt: true });
        snd.burnt(); say('It burnt and fell into the embers.');
        if (geo) puffs.emit('smoke', geo.wallX(s.u), geo.wallY(s.v), { count: 6, size: 16, speed: 40, life: 1.8, alpha: 0.3, color: '#4a4440', grow: 2.4, drift: 16 });
        checkEnd();
      }
    }
    flying = flying.filter((f) => now - f.t0 < 0.6);
    if (phase === 'slap' && phaseT >= 0.3) { if (madeN < TOTAL) { phase = 'next'; phaseT = 0; } else { phase = 'wait'; phaseT = 0; } }
    else if (phase === 'next' && phaseT >= 0.5) { newDough(); }
    if (!done && phase === 'wait' && resolved >= TOTAL) finish();
    if (phase === 'stretch' || phase === 'aim') flow(dt * (phase === 'stretch' ? 1 : 0.4));
    if (hintMsg && now - hintT > 3.5) hintMsg = '';
  };

  // ---- pointer ----------------------------------------------------------------------------------------------------------------------------
  const sheetAt = (x, y) => { if (!geo) return null; let best = null, bd = 1e9; for (const s of sheets) { const cx = geo.wallX(s.u), cy = geo.wallY(s.v), a = (SHEET.w * geo.WALL.w) / 2 * 1.1, b = (SHEET.h * geo.WALL.h) / 2 * 1.1, q = ((x - cx) / a) ** 2 + ((y - cy) / b) ** 2; if (q < 1 && q < bd) { bd = q; best = s; } } return best; };
  const toWall = (x, y) => ({ u: (x - geo.WALL.x) / geo.WALL.w, v: (y - geo.WALL.y) / geo.WALL.h });
  const inRect = (r, x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  const work = (p, dt = 1 / 60) => {
    if (!geo || done) return;
    if (p.down || p.pressed) ptr = { x: p.x, y: p.y, t: now };
    if (p.pressed) {
      const s = sheetAt(p.x, p.y);
      if (s && phase !== 'slap') { peel(s); return; }
      if (phase === 'aim' && inRect(geo.Z, p.x, p.y)) { const { u, v } = toWall(p.x, p.y); phase = 'swing'; startSwing(clamp(u, 0, 1), clamp(v, 0, 1)); return; }
      lastPtr = null;
    }
    if (phase === 'swing') {
      if (p.down && swing) { const { u, v } = toWall(p.x, p.y); swing.u = clamp(u, 0, 1); swing.v = clamp(v, 0, 1); swing.valid = inRange(swing.u, swing.v) && free(swing.u, swing.v); }
      else releaseSwing();
      return;
    }
    if (phase === 'stretch') {
      if (p.down && inRect(geo.B, p.x, p.y)) {
        const nx = (p.x - geo.dough.x) / geo.dough.rx, ny = (p.y - geo.dough.y) / geo.dough.ry;
        if (lastPtr) { const v = Math.hypot(p.x - lastPtr.x, p.y - lastPtr.y) / Math.max(1e-6, dt) / geo.dough.rx; if (nx * nx + ny * ny < 1.4) brush(nx, ny, v, dt, geo.dough); }
        if (lastPtr) rollX += Math.abs(p.x - lastPtr.x);
        lastPtr = { x: p.x, y: p.y };
      } else lastPtr = null;
    }
  };

  // ---- attract: a cook who thins the dough in even passes, slaps it in the middle of a good place at the right instant and hooks each sheet off in the golden moment -------
  const attract = (dt) => {
    if (done) return;
    if (auto.wait > 0) { auto.wait -= dt; }
    // always hook a sheet that is just right
    for (const s of sheets) if (s.d >= D_GOOD - 0.01) { peel(s); auto.wait = Math.max(auto.wait, 0.15); return; }
    if (auto.wait > 0) return;
    if (phase === 'stretch') {
      const st = stats();
      if (st.m <= M_GOAL + 0.02 && st.holes === 0) { control('lift'); auto.wait = 0.3; return; }
      // raster passes: speed 2.2 dough widths a second, rows a brush width apart
      const rows = 7, ny = -0.86 + (auto.row % rows) * (1.72 / (rows - 1)), nxMax = Math.sqrt(Math.max(0, 1 - ny * ny)) * 0.98;
      if (auto.x == null) auto.x = auto.dirn > 0 ? -nxMax : nxMax;
      const dx = auto.dirn * 2.2 * dt; auto.x += dx;
      brush(auto.x, ny, 2.2, dt, geo?.dough);
      if (geo) ptr = { x: geo.dough.x + auto.x * geo.dough.rx, y: geo.dough.y + ny * geo.dough.ry, t: now };
      if (auto.x > nxMax || auto.x < -nxMax) { auto.dirn = -auto.dirn; auto.row++; auto.x = null; if (auto.row >= rows * 4) auto.row = 0; }
      return;
    }
    if (phase === 'aim') {
      // the best free slot: heat close to 1.0, preferring a cooler patch for the slap, never a slot that will not hold
      let best = null, bs = 1e9; for (const sl of SLOTS) { if (!free(sl.u, sl.v)) continue; const H = heatAt(sl.u, sl.v), sc = Math.abs(H - 1.0) + (sheets.length ? 0.05 : 0); if (H > HOLD_MIN + 0.06 && sc < bs) { bs = sc; best = sl; } }
      if (!best) { auto.wait = 0.2; return; }
      phase = 'swing'; startSwing(best.u, best.v); auto.target = swingIdeal(); return;
    }
    if (phase === 'swing') { if (now - swing.t0 >= auto.target) { releaseSwing(); auto.row = 0; auto.x = null; auto.wait = 0.3; } return; }
    if (phase === 'wait' && !sheets.length) finish();
  };

  const hint = () => {
    if (done) return '';
    if (hintMsg && now - hintT < 3.5) return hintMsg;
    if (phase === 'stretch') { const st = stats(); return st.m > M_GOAL + 0.15 ? 'Drag over the dough in steady passes to thin it. Not too fast.' : st.e > 0.15 ? 'Even out the thick places, then take it to the oven.' : 'Thin and even: take it to the oven.'; }
    if (phase === 'aim') return 'Press on the wall where it should go and hold; let go in the lit part of the bar.';
    if (phase === 'swing') return 'Now! Let go inside the lit part of the bar.';
    if (sheets.length) { const best = sheets.reduce((a, b) => (Math.abs(a.d - D_GOOD) < Math.abs(b.d - D_GOOD) ? a : b)); return best.d < D_GOOD - 0.2 ? 'It blisters and browns. Tap a sheet to hook it off when golden.' : best.d < D_GOOD + 0.12 ? 'Golden: hook it off now!' : 'It is getting dark: hook it off!'; }
    return 'Take the next dough to the oven.';
  };

  // ---- drawing (all in bake-art.js) ----------------------------------------------------------------------------------------------------------------
  const geometry = (W0) => {
    const portrait = W0.w < W0.h * 1.45, pad = 6, top = W0.y + 34, availH = W0.h - 34 - 4;
    let Z, B;
    if (portrait) { const zh = Math.round(availH * 0.57); Z = { x: W0.x + pad, y: top, w: W0.w - 2 * pad, h: zh }; B = { x: W0.x + pad, y: top + zh + 4, w: W0.w - 2 * pad, h: availH - zh - 4 }; }
    else { const bw = Math.round(W0.w * 0.4); B = { x: W0.x + pad, y: top, w: bw - pad, h: availH }; Z = { x: W0.x + bw + pad, y: top, w: W0.w - bw - 2 * pad, h: availH }; }
    const WALL = { x: Z.x + Z.w * 0.2, y: Z.y + Z.h * 0.1, w: Z.w * 0.6, h: Z.h * 0.8 };
    const rx = Math.min(B.w * 0.36, B.h * 0.62), dough = { x: B.x + B.w * 0.42, y: B.y + B.h * 0.5, rx, ry: Math.min(B.h * 0.4, rx * 0.78) };
    return { W0, dock: dockRect(W0), Z, B, WALL, dough, portrait, wallX: (u) => WALL.x + u * WALL.w, wallY: (v) => WALL.y + v * WALL.h, stackPos: { x: B.x + B.w * 0.86, y: B.y + B.h * 0.7 } };
  };
  const view = () => ({ now, phase, phaseT, th, hole, weight, sheets, flying, stack, TOTAL, madeN, resolved, swing, swingIdeal: swingIdeal(), T_FULL, WIN, WIN2, D_GOOD, heatAt, fire: fire(now), uFire, SHEET, SLOTS, puffs, lastSlap, ptr: ptr && now - ptr.t < 1.2 ? ptr : null, rollX, zero, hint: hint(), done, stats: stats(), M_GOAL, bakeQ, sheetScore, free, inRange, mode: P.mode ?? 'tonir', LOOK, patches, fallen, CW, CH, inside });
  const draw = (g, Rt) => {
    const G = geometry(Rt.work); geo = G;
    drawBakeStage(g, G, view(), Rt);
    drawBakeHud(g, G, view());
    drawBakeThumb(g, Rt.thumb, view());
  };
  const titleArt = (g, S, t) => {
    const W0 = { x: S.x - S.w * 0.1, y: S.y - S.h * 0.02, w: S.w * 1.2, h: S.h * 1.04 }, G = geometry(W0);
    const demo = [{ u: 0.2, v: 0.27, d: 0.62 }, { u: 0.5, v: 0.27, d: 0.74 }, { u: 0.8, v: 0.72, d: 0.68 }, { u: 0.2, v: 0.72, d: 0.34 }].map((q, i) => ({ id: 20 + i, u: q.u, v: q.v, born: -9, d: q.d, pops: 6, wrinkled: false, hole: new Array(CW * CH).fill(false), th: new Array(CW * CH).fill(M_GOAL), cells: new Array(CW * CH).fill(0).map((_, k) => q.d + (hash(k, 5 + i) - 0.5) * 0.12) }));
    drawBakeStage(g, G, { ...view(), now: t ?? 0, phase: 'title', sheets: demo, flying: [], swing: null, ptr: null, stack: [{ score: 92, d: 0.7 }, { score: 90, d: 0.74 }, { score: 94, d: 0.68 }], puffs: createPuffs(1), hint: '', madeN: 3 }, { work: W0, thumb: W0 });
  };

  const state = () => {
    const st = stats();
    return { technique: 'bake', mode: P.mode ?? 'tonir', phase, made: madeN, total: TOTAL, resolved, fallen, uFire: r3(uFire), fire: r3(fire(now)), weight: r3(weight), ideal: r3(swingIdeal()), swingT: swing ? r3(now - swing.t0) : -1,
      dough: { mean: r3(st.m), uneven: r3(st.e), holes: st.holes }, sheets: sheets.map((s) => ({ id: s.id, u: r3(s.u), v: r3(s.v), d: r3(s.d), stick: s.stickQ, thin: r3(s.thinQ), q: r3(bakeQ(s)) })), stack: stack.map((b) => ({ score: b.score, fell: !!b.fell })), heat: SLOTS.map((sl) => r3(heatAt(sl.u, sl.v))) };
  };

  init();
  return {
    init, items, control, work, tick, draw, attract, titleArt, result: () => done, hint,
    score: () => Math.round(stack.reduce((a, b) => a + b.score, 0) / TOTAL),
    info: () => [`Sheet ${Math.min(madeN, TOTAL)} of ${TOTAL}${resolved ? `, ${resolved} done` : ''}`, `Dough ${(stats().m * 100).toFixed(0)}% thick (aim 34%), ${sheets.length} on the wall`],
    get caption() { return SC.words?.caption ?? 'Bake this order'; },
    rules: () => LOOK.rules(),
    point(id) {
      if (!geo) return null;
      const [k, rest] = id.split(':');
      if (k === 'slot') { const sl = SLOTS[Number(rest)]; return sl ? { x: geo.wallX(sl.u), y: geo.wallY(sl.v) } : null; }
      if (k === 'wall') { const [u, v] = rest.split(',').map(Number); return { x: geo.wallX(u), y: geo.wallY(v) }; }
      if (k === 'sheet') { const s = sheets.find((x) => x.id === Number(rest)); return s ? { x: geo.wallX(s.u), y: geo.wallY(s.v) } : null; }
      if (k === 'dough') { const [nx, ny] = rest.split(',').map(Number); return { x: geo.dough.x + nx * geo.dough.rx, y: geo.dough.y + ny * geo.dough.ry }; }
      return null;
    },
    state,
  };
}

registerTechnique('bake', { make: (P, env) => (P.mode === 'pizza' ? createPizza(P, env) : createBake(P, env)), scene: 'kc-fire-tonir', mat: 'dough' });
void lerp;

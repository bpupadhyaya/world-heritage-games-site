// shape-craft technique `sheet` (1.16.0): making a sheet of paper by hand in three steps.
//   1. FORM  (60 percent). `form: 'slosh'`: dip the mould and tilt it (drag) so the pulp runs from the thick places to the thin ones while the water drains through the
//            screen; whatever fibre is over a cell when the water has gone stays there. `form: 'spread'`: pour the pulp on a floating screen and spread it with the hand.
//            Score: how even the sheet is (1 minus the spread of its thickness).
//   2. COUCH (20 percent, `couch: true`). Drag the loaded mould to the felt or board stack and press Couch: the score is how well the sheet lands on the stack.
//   3. FINISH (20 percent). `finish: 'press'` pump the screw press in time with the gauge; `'brush'` brush the wrinkles out of the sheet on its drying board;
//            `'pound'` pound the sheet with the mallet on each zone as it lights.
// Mould looks (`mould`): 'su' bamboo ribs and chain threads, 'laid' wire lines and chain lines with a deckle, 'mesh' fine woven cloth.
import { registerTechnique } from './registry.js';
import { starsFor, hash } from './geom.js';
import { shadowed, rrect, rgba, tint, mix } from './fx.js';
import { drawTool, wallLift } from './scenes.js';
import { fx as synth } from '../../../platform/engine-kit/synth.js';
import { clamp } from './paint-stroke.js';
import { HEROES } from './sheet-heroes.js';

const TAU = Math.PI * 2;
const ell0 = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };   // a filled dot
const rg0 = (ctx, x, y, r, [c0, c1]) => { const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; };
const lgrad = (ctx, x0, y0, x1, y1, [c0, c1]) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; };
const G = 20, R = 26, ASP0 = 1.3, DRAIN_T = 9;
const FORM_W = 0.6, COUCH_W = 0.2, FIN_W = 0.2, FLAT = new Float32Array(G * R).fill(0.9);

function createSound(audio) {
  const F = (kind, p) => { try { return synth(audio, kind, p); } catch { return false; } };
  let carried = 0;
  return {
    dip() { F('splash', { vel: 0.5 }); F('whoosh', { dur: 0.5, vel: 0.3, down: true, delay: 0.05 }); },
    slosh(amt) { carried += amt; if (carried < 0.6) return; carried = 0; F('splash', { vel: 0.14 }); },
    spread(len) { carried += len; if (carried < 0.8) return; carried = 0; F('scrape', { hz: 900, dur: 0.12, vel: 0.28 }); },
    lift() { F('whoosh', { dur: 0.4, vel: 0.35, down: false }); F('pop', { vel: 0.35, delay: 0.2 }); },
    place() { F('impact', { mat: 'wood', hz: 420, vel: 0.5 }); F('scrape', { hz: 700, dur: 0.3, vel: 0.3, delay: 0.05 }); },
    pump(q) { F('impact', { mat: 'wood', hz: 260 + 120 * q, vel: 0.55 }); F('splash', { vel: 0.3 * q, delay: 0.08 }); },
    brush(len) { carried += len; if (carried < 0.7) return; carried = 0; F('scrape', { hz: 1300, dur: 0.1, vel: 0.3 }); },
    pound(hit) { F('impact', { mat: 'wood', hz: hit ? 330 : 200, vel: hit ? 0.55 : 0.25 }); },
    miss() { F('tick', { hz: 600, vel: 0.3 }); },
    step() { F('whoosh', { dur: 0.2, vel: 0.35, down: true }); },
    win(stars) { F('good', { hz: 660 + stars * 60, vel: 0.55 }); },
  };
}

export function createSheet(P, env) {
  const { rng, fx } = env, SC = P.scene ?? {};
  const HERO = P.hero ? HEROES[P.hero] ?? null : null, ASP = HERO ? HERO.asp : ASP0, BEAT = HERO?.beat ?? 'stone';   // 1.24.0: a hero picture owns the composition
  const snd = createSound(env.audio);
  if (env.options?.soundLog) for (const k of Object.keys(snd)) { const f = snd[k]; snd[k] = (...a) => { env.options.soundLog.push({ kind: `sheet.${k}` }); return f(...a); }; }
  const FORM = P.form === 'spread' ? 'spread' : P.form === 'beat' ? 'beat' : 'slosh', FIN = ['press', 'brush', 'pound'].includes(P.finish) ? P.finish : 'press', MOULD = P.mould ?? 'su', COUCH = P.couch !== false && FORM === 'slosh';
  const PULP = P.pulp ?? '#efe3c8', WATER = P.water ?? '#7f95a0';
  let ripples, ax, ay, lastU, h, D, phase, sub, tDrain, tilt, ptr, geo, done, now, formScore, couchScore, finScore, sheetPos, drag, couchTarget, wrinkles, smooth, press, zones, seq, seqAt, hits, auto, flash, dipDir, lastP, liftedAt, sheetCells;

  // ---- the pulp ------------------------------------------------------------------------------------------------------------------------
  const idx = (i, j) => j * G + i;
  const init = () => {
    ripples = []; ax = 0; ay = 0; lastU = null; h = new Float32Array(G * R); D = new Float32Array(G * R); phase = 'form'; sub = 'idle'; tDrain = 0; tilt = [0, 0]; ptr = null; geo = null; done = null; now = 0;
    formScore = 0; couchScore = 0; finScore = 0; sheetPos = [0.5, 1.28]; drag = null; couchTarget = [0.5 + (rng.next() - 0.5) * 0.3, 0.55 + (rng.next() - 0.5) * 0.12]; wrinkles = []; smooth = []; press = { n: 0, q: [], t: 0 }; zones = []; seq = []; seqAt = 0; hits = 0; flash = -9; dipDir = [rng.next() < 0.5 ? 1 : -1, rng.next() < 0.5 ? 1 : -1]; lastP = null; liftedAt = -1; sheetCells = null;
    buildAuto();
  };
  const WF = FORM_W, WC = COUCH ? COUCH_W : 0, WI = COUCH ? FIN_W : FIN_W + COUCH_W;   // without couching the finish counts for 40 percent
  const total = () => {
    if (done) return done.score;
    const f = phase === 'form' ? (sub === 'running' ? evenness(sumHD()) : 0) : formScore;
    return Math.round(100 * (f * WF + couchScore * WC + finScore * WI));
  };
  const sumHD = () => { const t = new Float32Array(G * R); for (let k = 0; k < t.length; k++) t[k] = D[k] + h[k]; return t; };
  const evenness = (f, cvmax = FORM !== 'slosh' ? 0.9 : 0.5) => { let m = 0; for (let k = 0; k < f.length; k++) m += f[k]; m /= f.length; if (m < 1e-4) return 0; let v = 0; for (let k = 0; k < f.length; k++) v += (f[k] - m) ** 2; return clamp(1 - Math.sqrt(v / f.length) / m / cvmax, 0, 1); };
  const dip = () => {
    if (sub !== 'idle') return;
    sub = 'running'; tDrain = 0; snd.dip();
    if (FORM === 'slosh') {   // the mould comes out of the vat with the pulp lying thick on one side
      let s = 0;
      for (let j = 0; j < R; j++) for (let i = 0; i < G; i++) { const wx = i / (G - 1) - 0.5, wy = j / (R - 1) - 0.5; h[idx(i, j)] = Math.max(0.15, 1 + dipDir[1] * 1.5 * wy + dipDir[0] * 0.8 * wx + (hash(i, j, 3) - 0.5) * 0.3); s += h[idx(i, j)]; }
      const k = (G * R) / s; for (let q = 0; q < h.length; q++) h[q] *= k;
    } else if (FORM === 'beat') {   // strips of soaked bark laid in a lattice: thick where they cross, thin in the gaps
      let s = 0;
      for (let j = 0; j < R; j++) for (let i = 0; i < G; i++) { const u = (i + 0.5) / G, v = (j + 0.5) / R; const a = Math.abs(((u * 5) % 1) - 0.5) < 0.42 ? 1 : 0.12, b = Math.abs(((v * 6) % 1) - 0.5) < 0.42 ? 1 : 0.12; h[idx(i, j)] = a + b + (hash(i, j, 5) - 0.5) * 0.2; s += h[idx(i, j)]; }
      const k = (G * R) / s; for (let q = 0; q < h.length; q++) h[q] *= k;
    } else {   // a heap of pulp poured on the middle of the screen
      let s = 0; const cx = (G - 1) / 2, cy = (R - 1) / 2;
      for (let j = 0; j < R; j++) for (let i = 0; i < G; i++) { const d2 = ((i - cx) / 2.6) ** 2 + ((j - cy) / 3.0) ** 2; h[idx(i, j)] = Math.exp(-d2 / 2); s += h[idx(i, j)]; }
      const k = (G * R) / s; for (let q = 0; q < h.length; q++) h[q] *= k;
    }
  };
  const step = (dt) => {
    if (phase !== 'form' || sub !== 'running') return;
    if (FORM === 'slosh') {
      // rocking the mould along an axis mixes the pulp along that axis, the faster the better; the water drains slowly at first and then quickly
      const kx = clamp(ax * 30, 0, 70), ky = clamp(ay * 30, 0, 70), ds = dt / 4;
      for (let sub2 = 0; sub2 < 4; sub2++) {
        const nh = new Float32Array(h);
        for (let j = 0; j < R; j++) for (let i = 0; i < G; i++) {
          if (i + 1 < G) { const f = kx * (h[idx(i, j)] - h[idx(i + 1, j)]) * ds * 0.5; nh[idx(i, j)] -= f; nh[idx(i + 1, j)] += f; }
          if (j + 1 < R) { const f = ky * (h[idx(i, j)] - h[idx(i, j + 1)]) * ds * 0.5; nh[idx(i, j)] -= f; nh[idx(i, j + 1)] += f; }
        }
        h = nh;
      }
      const rate = (0.02 + 0.8 * Math.pow(tDrain / DRAIN_T, 3)) * dt; for (let k = 0; k < h.length; k++) { const d = h[k] * rate; D[k] += d; h[k] -= d; }
      ax *= Math.max(0, 1 - dt * 5); ay *= Math.max(0, 1 - dt * 5);
      tDrain += dt; if (tDrain >= DRAIN_T) lift();
    } else {
      tDrain += dt; if (tDrain >= 60) lift();
    }
  };
  const lift = () => {
    if (phase !== 'form' || sub !== 'running') return;
    for (let k = 0; k < h.length; k++) { D[k] += h[k]; h[k] = 0; }
    formScore = evenness(D); sub = 'lifted'; liftedAt = now; snd.lift();
    sheetCells = D;
    if (COUCH) { phase = 'couch'; sheetPos = [0.5, 1.28]; snd.step(); } else startFinish();
  };
  const startFinish = () => {
    phase = 'finish'; snd.step(); press = { n: 0, q: [], t: 0, rot: 0 };
    if (FIN === 'brush') { wrinkles = []; for (let k = 0; k < 14; k++) wrinkles.push({ x: 0.1 + hash(k, 31) * 0.8, y: 0.08 + hash(k, 32) * 0.84 * ASP, r: 0.07 + hash(k, 33) * 0.05, a: hash(k, 34) * 3, done: false }); smooth = wrinkles.map(() => 0); }
    if (FIN === 'pound') { zones = []; for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) zones.push({ i, j, hit: false, miss: false }); seq = zones.map((_, k) => k).sort((a, b) => hash(a, 41) - hash(b, 41)); seqAt = 0; hits = 0; press.t = 0; }
  };
  const control = (id) => {
    if (done) return;
    if (id === 'dip' || id === 'pour') dip();
    else if (id === 'lift') lift();
    else if (id === 'couch') doCouch();
    else if (id === 'press') doPump();
    else if (id === 'check') finishGame();
  };
  const doCouch = () => {
    if (phase !== 'couch') return;
    const d = Math.hypot(sheetPos[0] - couchTarget[0], sheetPos[1] - couchTarget[1]);
    couchScore = clamp(1 - d / 0.24, 0, 1); snd.place(); flash = now; startFinish();
  };
  const PUMPS = 5, period = 1.2, gauge = (t) => 0.5 + 0.5 * Math.sin((t / period) * TAU - Math.PI / 2);
  const doPump = () => {
    if (phase !== 'finish' || FIN !== 'press' || press.n >= PUMPS) return;
    const b = gauge(press.t), q = clamp(1 - (1 - b) / 0.4, 0, 1); press.q.push(q); press.n++; press.rot = (press.rot ?? 0) + 0.9; snd.pump(q);
    if (geo) fx.emit('drop', geo.ox + geo.s * 0.5, geo.oy + geo.s * ASP * 0.9, { count: 4 + Math.round(6 * q), color: '#cfe0e6', size: 4, speed: 80, life: 0.7, gravity: 300, spread: 3, angle: 1.57 });
    if (press.n >= PUMPS) { finScore = press.q.reduce((a, b) => a + b, 0) / PUMPS; }
  };
  const finishGame = () => {
    if (done) return;
    if (FIN === 'pound' && finScore === 0) finScore = hits / zones.length;
    if (FIN === 'brush') finScore = smoothShare();
    if (FIN === 'press' && press.n < PUMPS) finScore = press.q.reduce((a, b) => a + b, 0) / PUMPS * (press.n / PUMPS);
    const f = phase === 'form' && sub === 'running' ? evenness(sumHD()) : formScore;
    const score = Math.round(100 * (f * WF + couchScore * WC + finScore * WI)), stars = starsFor(score), W = SC.words ?? {};
    done = { score, max: 100, stars, headline: stars === 3 ? (W.win ?? 'A sheet worth writing on') : stars ? (W.ok ?? 'A good sheet') : (W.retry ?? 'Back to the vat'), detail: `Even sheet ${Math.round(f * 100)}${COUCH ? `, couched ${Math.round(couchScore * 100)}` : ''}, finish ${Math.round(finScore * 100)} out of 100` };
    snd.win(stars);
    if (geo) fx.emit('spark', geo.ox + geo.s / 2, geo.oy + (geo.s * ASP) / 2, { count: 14, color: '#fff8e0', size: 8, speed: 150, life: 0.9, gravity: 50 });
  };
  const smoothShare = () => (wrinkles.length ? smooth.reduce((a, b) => a + clamp(b, 0, 1), 0) / wrinkles.length : 1);
  const frameRect = () => ({ x: geo.ox, y: geo.oy, w: geo.s, h: geo.s * ASP });
  const toLocal = (x, y) => [(x - geo.ox) / geo.s, (y - geo.oy) / geo.s];

  // ---- input -------------------------------------------------------------------------------------------------------------------------------
  const work = (p) => {
    if (!geo || done) return;
    ptr = { x: p.x, y: p.y, down: p.down };
    const [u, v] = toLocal(p.x, p.y);
    if (phase === 'form' && sub === 'running') {
      if (FORM === 'slosh') {
        if (p.down) { tilt = [clamp((u - 0.5) / 0.38, -1, 1), clamp((v - ASP / 2) / (0.38 * ASP), -1, 1)]; if (lastU && !p.pressed) { const dtm = Math.max(1 / 120, now - lastU[2]); ax += (Math.abs(u - lastU[0]) / dtm - ax) * 0.4; ay += (Math.abs(v - lastU[1]) / dtm - ay) * 0.4; snd.slosh(Math.hypot(ax, ay) * 0.02); } lastU = [u, v, now]; }
        else { tilt = [0, 0]; lastU = null; }
      } else if (p.down) {
        if (lastP && !p.pressed) { const dtm = Math.max(1 / 120, now - lastU), sp = Math.hypot(u - lastP[0], v - lastP[1]) / dtm; scrubAt(u, v, sp); }
        lastP = [u, v]; lastU = now;
      } else lastP = null;
      return;
    }
    if (phase === 'couch') {
      if (p.pressed && Math.hypot(u - sheetPos[0], v - sheetPos[1]) < 0.4) drag = [sheetPos[0] - u, sheetPos[1] - v];
      if (drag && p.down) sheetPos = [clamp(u + drag[0], 0.1, 0.9), clamp(v + drag[1], 0.1, ASP + 0.2)];
      if (!p.down) drag = null;
      return;
    }
    if (phase === 'finish') {
      if (FIN === 'brush' && p.down && u >= 0 && u <= 1 && v >= 0 && v <= ASP) {
        if (lastP) { const d = Math.hypot(u - lastP[0], v - lastP[1]); wrinkles.forEach((w, k) => { if (Math.hypot(u - w.x, v - w.y) < w.r + 0.05) { smooth[k] = Math.min(1.2, smooth[k] + d * 5.5); if (smooth[k] >= 1) w.done = true; } }); snd.brush(d * 4); }
        lastP = [u, v];
      } else lastP = null;
      if (FIN === 'pound' && p.pressed && seqAt < seq.length) {
        const zi = Math.min(2, Math.max(0, Math.floor(u * 3))), zj = Math.min(3, Math.max(0, Math.floor((v / ASP) * 4))), z = zones[seq[seqAt]];
        if (u >= 0 && u <= 1 && v >= 0 && v <= ASP) { const lit = press.t % 1.0 < 0.8; if (zi === z.i && zj === z.j && lit) { z.hit = true; hits++; snd.pound(true); advancePound(); } else { snd.pound(false); } }
      }
    }
  };
  const scrubAt = (u, v, speed) => {   // the hand rubs the pulp out: every cell under it moves towards the local mean (the pulp is conserved)
    const cx = u * G, cy = (v / ASP) * R, rad = 4.8, cells = []; let sw = 0, sm = 0;
    for (let j = Math.max(0, Math.floor(cy - rad)); j <= Math.min(R - 1, Math.ceil(cy + rad)); j++) for (let i = Math.max(0, Math.floor(cx - rad)); i <= Math.min(G - 1, Math.ceil(cx + rad)); i++) { const d = Math.hypot(i + 0.5 - cx, j + 0.5 - cy); if (d > rad) continue; const w = 1 - d / rad; cells.push([i, j, w]); sw += w; sm += w * h[idx(i, j)]; }
    if (!sw) return; const mean = sm / sw, gain = clamp(0.35 + speed * 0.6, 0, 0.9); let tot = 0; const dl = cells.map(([i, j, w]) => { const d = (mean - h[idx(i, j)]) * gain * w; tot += d; return d; }); const corr = tot / cells.length;
    cells.forEach(([i, j], k) => { h[idx(i, j)] = Math.max(0, h[idx(i, j)] + dl[k] - corr); });
    snd.spread(speed * 0.05);
  };
  const advancePound = () => { seqAt++; press.t = 0; if (seqAt >= seq.length) finScore = hits / zones.length; };
  const tick = (dt) => {
    now += dt;
    if (phase === 'form') { let rem = dt; while (rem > 1e-6) { const d = Math.min(rem, 1 / 30); step(d); rem -= d; } if (sub === 'lifted' && !COUCH && FIN) void 0; }
    if (phase === 'form' && sub === 'running' && FORM === 'slosh' && geo && fx && Math.hypot(ax, ay) > 2 && hash(Math.floor(now * 30), 7) < 0.25) { const sx = hash(Math.floor(now * 30), 8) < 0.5 ? geo.ox : geo.ox + geo.s; fx.emit('drop', sx, geo.oy + hash(Math.floor(now * 30), 9) * geo.s * ASP, { count: 2, color: '#e8f0f2', size: 3, speed: 120, life: 0.6, gravity: 380, spread: 2, angle: -1.57 }); }
    if (phase === 'finish' && FIN === 'press') press.t += dt;
    if (phase === 'finish' && FIN === 'pound' && seqAt < seq.length) { press.t += dt; if (press.t >= 1.0) { snd.miss(); zones[seq[seqAt]].miss = true; advancePound(); } }
    if (phase === 'finish' && FIN === 'brush' && smoothShare() >= 0.999) { /* wait for Check */ }
  };

  // ---- attract: a hand that plays the whole sheet ---------------------------------------------------------------------------------------
  function buildAuto() { auto = { t: 0, st: 'dip', w: 0.6, k: 0, bi: 0, last: null }; }
  const attract = (dt) => {
    if (done) return;
    auto.t += dt;
    if (auto.w > 0) { auto.w -= dt; return; }
    if (phase === 'form') {
      if (sub === 'idle') { dip(); auto.t = 0; auto.w = 0.4; return; }
      if (sub === 'running') {
        if (FORM === 'slosh') {
          // rock the mould in fast circles and loops: the pulp is mixed along both axes
          const t0 = auto.t, pos = (q) => [0.5 + 0.4 * Math.cos(q * TAU * 1.4), ASP / 2 + 0.4 * ASP * Math.sin(q * TAU * 1.1 + 0.6)], [u, v] = pos(t0), [pu, pv] = pos(t0 - dt);
          ax += (Math.abs(u - pu) / dt - ax) * 0.4; ay += (Math.abs(v - pv) / dt - ay) * 0.4; tilt = [clamp((u - 0.5) / 0.38, -1, 1), clamp((v - ASP / 2) / (0.38 * ASP), -1, 1)];
          ptr = { x: geo ? geo.ox + geo.s * u : 0, y: geo ? geo.oy + geo.s * v : 0, down: true };
        } else {
          // rub the heap out in spirals from the middle
          const t0 = auto.t, f = (t0 % 6) / 6, a = t0 * 9, r = 0.52 * f, u = 0.5 + Math.cos(a) * r * 0.9, v = ASP / 2 + Math.sin(a) * r * 0.9 * ASP, pu = auto.last ? auto.last[0] : u, pv = auto.last ? auto.last[1] : v;
          scrubAt(u, v, Math.hypot(u - pu, v - pv) / dt); auto.last = [u, v]; ptr = { x: geo ? geo.ox + u * geo.s : 0, y: geo ? geo.oy + v * geo.s : 0, down: true };
          if (t0 > 40) { lift(); auto.w = 0.5; }
        }
      }
      return;
    }
    if (phase === 'couch') { sheetPos = [sheetPos[0] + (couchTarget[0] - sheetPos[0]) * Math.min(1, dt * 3.4), sheetPos[1] + (couchTarget[1] - sheetPos[1]) * Math.min(1, dt * 3.4)]; if (Math.hypot(sheetPos[0] - couchTarget[0], sheetPos[1] - couchTarget[1]) < 0.0015) { doCouch(); auto.w = 0.4; } return; }
    if (phase === 'finish') {
      if (FIN === 'press') { if (press.n < PUMPS) { if (gauge(press.t) > 0.985) { doPump(); auto.w = 0.3; } } else { finishGame(); } return; }
      if (FIN === 'brush') {
        const w = wrinkles.findIndex((q, k) => smooth[k] < 1);
        if (w < 0) { finishGame(); return; }
        const q = wrinkles[w]; auto.bi += dt; const a = auto.bi * 9, pt = [q.x + Math.cos(a) * q.r * 0.9, q.y + Math.sin(a) * q.r * 0.9];
        if (auto.last) { const d = Math.hypot(pt[0] - auto.last[0], pt[1] - auto.last[1]); smooth[w] = Math.min(1.2, smooth[w] + d * 5.5); if (smooth[w] >= 1) q.done = true; snd.brush(d * 4); } auto.last = pt; ptr = { x: geo ? geo.ox + pt[0] * geo.s : 0, y: geo ? geo.oy + pt[1] * geo.s : 0, down: true };
        if (smooth[w] >= 1) auto.last = null;
        return;
      }
      if (FIN === 'pound') {
        if (seqAt < seq.length) { const z = zones[seq[seqAt]]; if (press.t > 0.15 && press.t < 0.6) { z.hit = true; hits++; snd.pound(true); advancePound(); } }
        else finishGame();
      }
    }
  };

  // ---- drawing -------------------------------------------------------------------------------------------------------------------------------
  const X = (V, u) => V.ox + u * V.s, Y = (V, v) => V.oy + v * V.s;
  const plank = (ctx, x, y, w, hh, c, vert = true) => {   // a wooden board with grain and a lit top edge
    const g = ctx.createLinearGradient(vert ? x : 0, vert ? 0 : y, vert ? x + w : 0, vert ? 0 : y + hh); g.addColorStop(0, tint(c, 0.18)); g.addColorStop(0.5, c); g.addColorStop(1, tint(c, -0.3)); ctx.fillStyle = g; ctx.fillRect(x, y, w, hh);
    ctx.strokeStyle = 'rgba(30,16,4,0.22)'; ctx.lineWidth = 1; for (let k = 0; k < Math.max(3, (vert ? hh : w) / 18); k++) { const q = (k + hash(k, 5)) / Math.max(3, (vert ? hh : w) / 18); ctx.beginPath(); if (vert) { ctx.moveTo(x, y + hh * q); ctx.lineTo(x + w, y + hh * q + (hash(k, 6) - 0.5) * 6); } else { ctx.moveTo(x + w * q, y); ctx.lineTo(x + w * q + (hash(k, 6) - 0.5) * 6, y + hh); } ctx.stroke(); }
  };
  // ---- the vat and the mould (1.20.0): four vat looks and four mould looks, chosen with params `vat` (cedar | stone | oak | amber) and `mould` (su | laid | mesh) + `rope` ----
  const VATLOOK = {
    cedar: { rim: '#c9a870', inner: '#9a7a48', water: [0.0, '#e8e4d6', 1.0, '#9aa8a8'], milk: 0.62, glint: 'rgba(255,250,235,', hoops: true },
    stone: { rim: '#8e8878', inner: '#6a6658', water: [0.0, '#7fc0b8', 1.0, '#2f6a70'], milk: 0.16, glint: 'rgba(235,250,255,', stones: true },
    oak: { rim: '#5a4026', inner: '#3a2814', water: [0.0, '#a8b4b4', 1.0, '#4a5c64'], milk: 0.4, glint: 'rgba(240,244,236,', studs: true },
    board: { rim: '#8a6a42', inner: '#5a4026', water: [0.0, '#8a6a42', 1.0, '#5a4026'], milk: 0, glint: 'rgba(255,240,200,', board: true },
    amber: { rim: '#a8702e', inner: '#7a4a1a', water: [0.0, '#e8d4a0', 1.0, '#8a7448'], milk: 0.5, glint: 'rgba(255,236,190,', lacquer: true },
  };
  const VL = VATLOOK[P.vat ?? SC.vatLook] ?? VATLOOK.cedar;
  const stoneBlocks = (ctx, x, y, w, hh, c, s) => {
    const bh = s * 0.085; ctx.fillStyle = tint(c, -0.35); ctx.fillRect(x, y, w, hh);
    for (let row = 0, yy = y; yy < y + hh; row++, yy += bh) { let xx = x - (row % 2 ? bh : 0); for (let k = 0; xx < x + w; k++) { const bw = bh * (1.6 + 1.2 * hash(row, k, 11)), sh = (hash(row, k, 12) - 0.5) * 0.3; ctx.fillStyle = tint(c, sh); ctx.fillRect(xx + 1, yy + 1, bw - 2, bh - 2); ctx.fillStyle = 'rgba(255,255,255,0.09)'; ctx.fillRect(xx + 1, yy + 1, bw - 2, 2); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(xx + 1, yy + bh - 3, bw - 2, 2); for (let q = 0; q < 4; q++) { ctx.fillStyle = hash(row, k, q) > 0.5 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.14)'; ctx.fillRect(xx + bw * hash(row, k, q + 20), yy + bh * hash(row, k, q + 30), 2, 2); } xx += bw; } }
  };
  const drawTable = (ctx, V, t) => {   // dry-land work: a plank table in the sun with a bowl of water and a bundle of strips beside it (bark cloth, flower paper)
    const s = V.s, pad = s * 0.3, x = V.ox - pad, y = V.oy - pad * 0.92, w = s + pad * 2, hh = s * ASP + pad * 1.84, vc = SC.vatC ?? VL.rim;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 10; rrect(ctx, x, y, w, hh, s * 0.03); ctx.fillStyle = tint(vc, -0.5); ctx.fill(); ctx.restore();
    ctx.save(); rrect(ctx, x, y, w, hh, s * 0.03); ctx.clip(); plank(ctx, x, y, w, hh, vc, true);
    for (let k = 0; k < 7; k++) { ctx.strokeStyle = 'rgba(30,16,4,0.4)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x + (w * (k + 1)) / 8, y); ctx.lineTo(x + (w * (k + 1)) / 8, y + hh); ctx.stroke(); ctx.strokeStyle = 'rgba(255,235,190,0.14)'; ctx.beginPath(); ctx.moveTo(x + (w * (k + 1)) / 8 + 2, y); ctx.lineTo(x + (w * (k + 1)) / 8 + 2, y + hh); ctx.stroke(); }
    for (let k = 0; k < 10; k++) { const kx = x + w * hash(k, 31), ky = y + hh * hash(k, 32); ctx.strokeStyle = 'rgba(40,20,6,0.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(kx, ky, 5 + 4 * hash(k, 33), 3, 0, 0, TAU); ctx.stroke(); }
    const wg = ctx.createLinearGradient(x, y, x + w, y + hh * 0.7); wg.addColorStop(0, 'rgba(255,236,190,0.3)'); wg.addColorStop(0.5, 'rgba(255,236,190,0.04)'); wg.addColorStop(1, 'rgba(0,0,0,0.3)'); ctx.fillStyle = wg; ctx.fillRect(x, y, w, hh);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, V.ox - s * 0.01, V.oy + s * 0.03, s * 1.1, s * ASP + s * 0.08, s * 0.03); ctx.fill();
    const bx = x + w - pad * 0.5, by = y + pad * 0.5; ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell0(ctx, bx + 3, by + 5, pad * 0.34); ctx.fillStyle = rg0(ctx, bx, by, pad * 0.34, ['#d8b08a', '#7a4a2a']); ell0(ctx, bx, by, pad * 0.34); ctx.fillStyle = rg0(ctx, bx, by, pad * 0.26, ['#aac8d0', '#5a7a86']); ell0(ctx, bx, by, pad * 0.26);
    for (let k = 0; k < 5; k++) { ctx.save(); ctx.translate(x + pad * 0.5, y + hh - pad * 0.5 + k * 1.2); ctx.rotate(-0.3 + 0.15 * k); ctx.fillStyle = k % 2 ? tint(PULP, -0.15) : PULP; ctx.fillRect(-pad * 0.32, -pad * 0.08, pad * 0.64, pad * 0.16); ctx.strokeStyle = 'rgba(40,24,8,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(-pad * 0.32, -pad * 0.08, pad * 0.64, pad * 0.16); ctx.restore(); }
    ctx.restore(); ctx.strokeStyle = 'rgba(20,10,2,0.6)'; ctx.lineWidth = 2; rrect(ctx, x, y, w, hh, s * 0.03); ctx.stroke();
  };
  const drawVat = (ctx, V, t) => {
    if (VL.board) return drawTable(ctx, V, t);
    const s = V.s, pad = s * 0.3, x = V.ox - pad, y = V.oy - pad * 0.92, w = s + pad * 2, hh = s * ASP + pad * 1.84, rim = s * 0.062, wall = s * 0.07, vc = SC.vatC && !P.vat && !SC.vatLook ? SC.vatC : VL.rim;
    // outer body: shadow on the floor, then the rim in its own material
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 10; rrect(ctx, x, y, w, hh, s * 0.05); ctx.fillStyle = tint(vc, -0.5); ctx.fill(); ctx.restore();
    ctx.save(); rrect(ctx, x, y, w, hh, s * 0.05); ctx.clip();
    if (VL.stones) stoneBlocks(ctx, x, y, w, hh, vc, s); else plank(ctx, x, y, w, hh, vc, false);
    const rg1 = ctx.createLinearGradient(x, y, x, y + rim); rg1.addColorStop(0, 'rgba(255,240,205,0.34)'); rg1.addColorStop(1, 'rgba(255,240,205,0)'); ctx.fillStyle = rg1; ctx.fillRect(x, y, w, rim);   // the lit top edge of the rim
    if (VL.lacquer) { const lg2 = ctx.createLinearGradient(x, y, x + w, y + hh); lg2.addColorStop(0, 'rgba(255,230,170,0.32)'); lg2.addColorStop(0.45, 'rgba(255,230,170,0)'); lg2.addColorStop(1, 'rgba(0,0,0,0.3)'); ctx.fillStyle = lg2; ctx.fillRect(x, y, w, hh); }
    if (VL.hoops) for (const f of [0.14, 0.86]) { const hy2 = y + hh * f; ctx.fillStyle = '#6a4a24'; ctx.fillRect(x, hy2 - 3, w, 6); ctx.fillStyle = 'rgba(255,230,170,0.35)'; ctx.fillRect(x, hy2 - 3, w, 1.4); for (let q = 0; q < 12; q++) { ctx.strokeStyle = 'rgba(30,16,4,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + w * (q + 0.5) / 12, hy2 - 3); ctx.lineTo(x + w * (q + 0.5) / 12 + 3, hy2 + 3); ctx.stroke(); } }
    if (VL.studs) { for (const f of [0.5]) { ctx.fillStyle = '#2a2018'; ctx.fillRect(x, y + hh * f - 4, w, 8); } for (let q = 0; q < 16; q++) { const sx = x + w * (q + 0.5) / 16, sy2 = y + rim * 0.5; ctx.fillStyle = rg0(ctx, sx, sy2, rim * 0.22, ['#f0d27a', '#7a5a14']); ell0(ctx, sx, sy2, rim * 0.2); ctx.fillStyle = rg0(ctx, sx, y + hh - rim * 0.5, rim * 0.22, ['#f0d27a', '#7a5a14']); ell0(ctx, sx, y + hh - rim * 0.5, rim * 0.2); } }
    ctx.restore();
    // the inner wall: four sloping faces from the rim to the water line, darker lower down and wet at the waterline
    const ix = x + rim, iy = y + rim, iw = w - rim * 2, ih = hh - rim * 2, wx0 = ix + wall, wy0 = iy + wall, ww0 = iw - wall * 2, wh0 = ih - wall * 2, wc = VL.inner;
    ctx.save(); rrect(ctx, ix, iy, iw, ih, s * 0.035); ctx.clip();
    const face = (pts, c0, c1, gx0, gy0, gx1, gy1) => { const gg = ctx.createLinearGradient(gx0, gy0, gx1, gy1); gg.addColorStop(0, c0); gg.addColorStop(1, c1); ctx.fillStyle = gg; ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill(); };
    face([[ix, iy], [ix + iw, iy], [wx0 + ww0, wy0], [wx0, wy0]], tint(wc, -0.1), tint(wc, -0.62), 0, iy, 0, wy0);
    face([[ix, iy], [wx0, wy0], [wx0, wy0 + wh0], [ix, iy + ih]], tint(wc, 0.05), tint(wc, -0.55), ix, 0, wx0, 0);
    face([[ix + iw, iy], [ix + iw, iy + ih], [wx0 + ww0, wy0 + wh0], [wx0 + ww0, wy0]], tint(wc, -0.3), tint(wc, -0.7), ix + iw, 0, wx0 + ww0, 0);
    face([[ix, iy + ih], [wx0, wy0 + wh0], [wx0 + ww0, wy0 + wh0], [ix + iw, iy + ih]], tint(wc, -0.4), tint(wc, -0.75), 0, iy + ih, 0, wy0 + wh0);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; for (const [a, b, c2, d] of [[ix, iy, wx0, wy0], [ix + iw, iy, wx0 + ww0, wy0], [ix, iy + ih, wx0, wy0 + wh0], [ix + iw, iy + ih, wx0 + ww0, wy0 + wh0]]) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c2, d); ctx.stroke(); }
    ctx.restore();
    // the water
    ctx.save(); rrect(ctx, wx0, wy0, ww0, wh0, s * 0.02); ctx.clip();
    const wcx = wx0 + ww0 / 2, wcy = wy0 + wh0 / 2, g = ctx.createRadialGradient(wcx - ww0 * 0.15, wcy - wh0 * 0.2, s * 0.05, wcx, wcy, Math.max(ww0, wh0) * 0.75); g.addColorStop(0, VL.water[1]); g.addColorStop(1, VL.water[3]); ctx.fillStyle = g; ctx.fillRect(wx0, wy0, ww0, wh0);
    if (VL.stones) for (let k = 0; k < 24; k++) { const px = wx0 + ww0 * hash(k, 41), py = wy0 + wh0 * hash(k, 42), pr = s * (0.012 + 0.02 * hash(k, 43)); ctx.fillStyle = `rgba(${90 + 60 * hash(k, 44) | 0},${100 + 40 * hash(k, 45) | 0},${95 + 30 * hash(k, 46) | 0},0.55)`; ell0(ctx, px, py, pr); }
    // pulp in the water: soft clouds that drift
    for (let k = 0; k < 16; k++) { const px = wx0 + ww0 * ((hash(k, 51) + 0.04 * Math.sin(t * 0.3 + k)) % 1), py = wy0 + wh0 * ((hash(k, 52) + 0.03 * Math.cos(t * 0.25 + k * 1.7)) % 1), pr = s * (0.1 + 0.16 * hash(k, 53)), pc = ctx.createRadialGradient(px, py, 0, px, py, pr); pc.addColorStop(0, rgba(PULP, 0.5 * VL.milk)); pc.addColorStop(1, rgba(PULP, 0)); ctx.fillStyle = pc; ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2); }
    // the window on the water, and light lines
    const sg2 = ctx.createLinearGradient(wx0, wy0, wx0 + ww0 * 0.8, wy0 + wh0 * 0.5); sg2.addColorStop(0, VL.glint + '0.4)'); sg2.addColorStop(0.5, VL.glint + '0.07)'); sg2.addColorStop(1, VL.glint + '0)'); ctx.fillStyle = sg2; ctx.fillRect(wx0, wy0, ww0, wh0);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, V.ox - s * 0.01, V.oy + s * 0.03, s * 1.1, s * ASP + s * 0.08, s * 0.05); ctx.fill();   // the shadow under the mould
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.5; for (const rp of ripples) { const k = (now - rp) / 1.6; if (k < 0 || k > 1) continue; ctx.globalAlpha = (1 - k) * 0.7; rrect(ctx, V.ox - s * 0.02 - k * pad * 0.9, V.oy - s * 0.02 - k * pad * 0.8, s * 1.04 + k * pad * 1.8, s * ASP + s * 0.04 + k * pad * 1.6, s * 0.04); ctx.stroke(); } ctx.globalAlpha = 1;
    ctx.lineWidth = 1.2; for (let k = 0; k < 14; k++) { const yy = wy0 + (wh0 * (k + 0.5)) / 14; ctx.strokeStyle = `rgba(255,252,240,${0.07 + 0.06 * Math.sin(t * 0.8 + k)})`; ctx.beginPath(); for (let q = 0; q <= 24; q++) { const xx = wx0 + (ww0 * q) / 24, yo = Math.sin(q * 0.7 + t * 0.9 + k * 1.3) * 4 + Math.sin(q * 0.31 - t * 0.5 + k) * 6; q ? ctx.lineTo(xx, yy + yo) : ctx.moveTo(xx, yy + yo); } ctx.stroke(); }
    if (P.neri) { ctx.lineWidth = 1.6; for (let k = 0; k < 9; k++) { const px = wx0 + ww0 * hash(k, 71), py = wy0 + wh0 * hash(k, 72); ctx.strokeStyle = `rgba(255,255,250,${0.32 + 0.12 * Math.sin(t + k)})`; ctx.beginPath(); ctx.moveTo(px, py); ctx.bezierCurveTo(px + 20, py - 14 + Math.sin(t * 0.6 + k) * 6, px + 38, py + 18, px + 60 + 20 * hash(k, 73), py + 4); ctx.stroke(); } }
    const vg2 = ctx.createRadialGradient(wcx, wcy, Math.min(ww0, wh0) * 0.3, wcx, wcy, Math.max(ww0, wh0) * 0.75); vg2.addColorStop(0, 'rgba(0,0,0,0)'); vg2.addColorStop(1, 'rgba(0,0,0,0.42)'); ctx.fillStyle = vg2; ctx.fillRect(wx0, wy0, ww0, wh0);
    for (let k = 0; k < 40; k++) { const fx2 = wx0 + ww0 * hash(k, 91) + Math.sin(t * 0.4 + k) * 4, fy2 = wy0 + wh0 * hash(k, 92) + Math.cos(t * 0.3 + k * 1.3) * 3, a2 = hash(k, 93) * 3.1; ctx.strokeStyle = 'rgba(255,248,226,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(fx2, fy2); ctx.quadraticCurveTo(fx2 + Math.cos(a2) * 7, fy2 + Math.sin(a2) * 7 + 2, fx2 + Math.cos(a2) * 14, fy2 + Math.sin(a2) * 14); ctx.stroke(); }
    ctx.restore(); ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1.5; rrect(ctx, wx0, wy0, ww0, wh0, s * 0.02); ctx.stroke();
    ctx.strokeStyle = 'rgba(15,8,2,0.65)'; ctx.lineWidth = 2; rrect(ctx, ix, iy, iw, ih, s * 0.035); ctx.stroke();
  };
  const drawMould = (ctx, V, tl, over) => {   // the mould from above: a wooden frame round the screen, with its own hardware (hinges, rope, deckle, tacks)
    const x = V.ox, y = V.oy, w = V.s, hh = V.s * ASP, fw = w * (MOULD === 'mesh' ? 0.045 : 0.06), wood = SC.mouldC ?? '#a8793c', sk = tl ? tl[0] * w * 0.025 : 0, sy = tl ? tl[1] * hh * 0.015 : 0;
    if (MOULD === 'bare') { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = w * 0.05; ctx.shadowOffsetY = w * 0.02; rrect(ctx, x - fw * 0.5, y - fw * 0.5, w + fw, hh + fw, w * 0.02); ctx.fillStyle = tint(wood, -0.3); ctx.fill(); ctx.restore(); const gb = ctx.createLinearGradient(x, y, x + w, y + hh); gb.addColorStop(0, tint(wood, 0.1)); gb.addColorStop(1, tint(wood, -0.35)); ctx.fillStyle = over?.bg && over.bg !== 'rgba(0,0,0,0)' ? over.bg : gb; rrect(ctx, x, y, w, hh, w * 0.015); ctx.fill(); ctx.strokeStyle = 'rgba(30,16,4,0.5)'; ctx.lineWidth = 2; ctx.stroke(); return; }
    ctx.save(); ctx.translate(sk, sy);
    const rod = (rx, ry, rw, rh, c) => { const gg = ctx.createLinearGradient(0, ry, 0, ry + rh); gg.addColorStop(0, tint(c, 0.4)); gg.addColorStop(0.45, c); gg.addColorStop(1, tint(c, -0.5)); ctx.fillStyle = gg; rrect(ctx, rx, ry, rw, rh, Math.min(rw, rh) * 0.5); ctx.fill(); ctx.strokeStyle = 'rgba(30,16,4,0.5)'; ctx.lineWidth = 1; ctx.stroke(); };
    if (!over?.bg && !over?.noHandles) {
      if (MOULD === 'su' && !P.rope) { for (const sx of [-1, 1]) { const hx = sx < 0 ? x - fw - w * 0.17 : x + w + fw; rod(hx, y + hh * 0.43, w * 0.17, w * 0.05, '#d8b878'); ctx.fillStyle = 'rgba(60,36,10,0.7)'; ctx.fillRect(hx + w * 0.17 * (sx < 0 ? 0.3 : 0.7), y + hh * 0.43, 2.4, w * 0.05); } }
      if (MOULD === 'laid') { for (const sx of [-1, 1]) { const hx = sx < 0 ? x - fw - w * 0.13 : x + w + fw; rod(hx, y + hh * 0.44, w * 0.13, w * 0.07, '#6a4a28'); ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(hx + w * 0.02, y + hh * 0.445, w * 0.09, 2); } }
      if (P.rope) {   // the mould hangs from a bamboo pole on two ropes and is swung to and fro
        const by = y - fw - w * 0.2; rod(x - fw, by - w * 0.02, w + fw * 2, w * 0.04, '#c8b078');
        for (const sx of [0.14, 0.86]) { ctx.strokeStyle = '#7a5a2c'; ctx.lineWidth = Math.max(2.4, w * 0.012); ctx.beginPath(); ctx.moveTo(x + w * sx, by + w * 0.02); ctx.lineTo(x + w * sx + (tl ? tl[0] * 2 : 0), y - fw); ctx.stroke(); ctx.strokeStyle = 'rgba(255,230,170,0.5)'; ctx.lineWidth = 1; ctx.setLineDash([3, 4]); ctx.stroke(); ctx.setLineDash([]); }
      }
    }
    ctx.fillStyle = tint(wood, -0.55); rrect(ctx, x - fw + w * 0.012, y - fw + w * 0.02, w + fw * 2, hh + fw * 2, w * 0.02); ctx.fill();   // the side wall of the frame
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = w * 0.06; ctx.shadowOffsetY = w * 0.03; ctx.shadowOffsetX = w * 0.01; rrect(ctx, x - fw, y - fw, w + fw * 2, hh + fw * 2, w * 0.02); ctx.fillStyle = wood; ctx.fill(); ctx.shadowColor = 'transparent';
    const g = ctx.createLinearGradient(x - fw, y - fw, x + w + fw, y + hh + fw); g.addColorStop(0, tint(wood, 0.34)); g.addColorStop(0.45, wood); g.addColorStop(1, tint(wood, -0.42)); rrect(ctx, x - fw, y - fw, w + fw * 2, hh + fw * 2, w * 0.02); ctx.fillStyle = g; ctx.fill();
    ctx.save(); rrect(ctx, x - fw, y - fw, w + fw * 2, hh + fw * 2, w * 0.02); ctx.clip(); ctx.strokeStyle = 'rgba(40,20,4,0.22)'; ctx.lineWidth = 1; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.moveTo(x - fw, y - fw + (fw * 2 + hh) * hash(k, 21)); ctx.lineTo(x + w + fw, y - fw + (fw * 2 + hh) * hash(k, 21) + (hash(k, 22) - 0.5) * 8); ctx.stroke(); } ctx.restore();
    ctx.strokeStyle = 'rgba(255,236,190,0.35)'; ctx.lineWidth = 1.5; rrect(ctx, x - fw + 1.5, y - fw + 1.5, w + fw * 2 - 3, hh + fw * 2 - 3, w * 0.018); ctx.stroke(); ctx.strokeStyle = 'rgba(30,16,4,0.6)'; ctx.lineWidth = 2; rrect(ctx, x - fw, y - fw, w + fw * 2, hh + fw * 2, w * 0.02); ctx.stroke();
    // hardware on the frame
    if (MOULD === 'su') { for (const sx of [0.16, 0.84]) { const hx = x + w * sx - w * 0.04; ctx.fillStyle = lgrad(ctx, hx, y - fw, hx + w * 0.08, y - fw, ['#f4d886', '#a07a1c']); ctx.fillRect(hx, y - fw * 0.82, w * 0.08, fw * 0.64); ctx.strokeStyle = 'rgba(60,40,0,0.7)'; ctx.lineWidth = 1; ctx.strokeRect(hx, y - fw * 0.82, w * 0.08, fw * 0.64); ctx.fillStyle = '#5a3c08'; ctx.beginPath(); ctx.arc(hx + w * 0.02, y - fw * 0.5, 1.8, 0, TAU); ctx.arc(hx + w * 0.06, y - fw * 0.5, 1.8, 0, TAU); ctx.fill(); } }
    if (MOULD === 'laid') { rrect(ctx, x - fw * 0.55, y - fw * 0.55, w + fw * 1.1, hh + fw * 1.1, w * 0.012); ctx.strokeStyle = 'rgba(20,10,0,0.6)'; ctx.lineWidth = 2.4; ctx.stroke(); ctx.strokeStyle = 'rgba(255,230,180,0.4)'; ctx.lineWidth = 1; rrect(ctx, x - fw * 0.55 + 2, y - fw * 0.55 + 2, w + fw * 1.1 - 4, hh + fw * 1.1 - 4, w * 0.01); ctx.stroke(); for (let q = 1; q < 8; q++) { ctx.fillStyle = rg0(ctx, x + (w * q) / 8, y - fw * 0.78, 3, ['#f2c28a', '#7a4a1e']); ell0(ctx, x + (w * q) / 8, y - fw * 0.78, 2.4); ell0(ctx, x + (w * q) / 8, y + hh + fw * 0.78, 2.4); } }
    if (MOULD === 'mesh') { for (let q = 0; q < 30; q++) { const f = q / 30; for (const [tx, ty] of [[x + w * f, y - fw * 0.5], [x + w * f, y + hh + fw * 0.5]]) { ctx.fillStyle = '#d8d8d0'; ell0(ctx, tx, ty, 1.7); } } for (let q = 0; q < 38; q++) { const f = q / 38; for (const [tx, ty] of [[x - fw * 0.5, y + hh * f], [x + w + fw * 0.5, y + hh * f]]) { ctx.fillStyle = '#d8d8d0'; ell0(ctx, tx, ty, 1.7); } } }
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, hh); ctx.clip();
    ctx.fillStyle = over?.bg ?? mix(WATER, '#0e1418', 0.5); ctx.fillRect(x, y, w, hh);
    if (MOULD === 'su') { for (let k = 0; k < 72; k++) { const bx = x + (w * (k + 0.5)) / 72, gg = ctx.createLinearGradient(bx - 2, 0, bx + 2, 0); gg.addColorStop(0, 'rgba(110,80,30,0.7)'); gg.addColorStop(0.5, 'rgba(240,214,150,0.8)'); gg.addColorStop(1, 'rgba(110,80,30,0.7)'); ctx.strokeStyle = gg; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx, y + hh); ctx.stroke(); } ctx.strokeStyle = 'rgba(30,22,10,0.85)'; ctx.lineWidth = 2.2; for (const f of [0.18, 0.5, 0.82]) { ctx.beginPath(); ctx.moveTo(x, y + hh * f); ctx.lineTo(x + w, y + hh * f); ctx.stroke(); ctx.strokeStyle = 'rgba(255,240,200,0.3)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x, y + hh * f - 2); ctx.lineTo(x + w, y + hh * f - 2); ctx.stroke(); ctx.strokeStyle = 'rgba(30,22,10,0.85)'; ctx.lineWidth = 2.2; } }
    else if (MOULD === 'laid') { for (let k = 0; k < 80; k++) { ctx.strokeStyle = k % 2 ? 'rgba(236,226,196,0.6)' : 'rgba(150,140,110,0.6)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y + (hh * (k + 0.5)) / 80); ctx.lineTo(x + w, y + (hh * (k + 0.5)) / 80); ctx.stroke(); } ctx.strokeStyle = 'rgba(30,26,20,0.8)'; ctx.lineWidth = 3; for (let k = 1; k < 8; k++) { ctx.beginPath(); ctx.moveTo(x + (w * k) / 8, y); ctx.lineTo(x + (w * k) / 8, y + hh); ctx.stroke(); ctx.strokeStyle = 'rgba(210,170,100,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + (w * k) / 8 - 1.2, y); ctx.lineTo(x + (w * k) / 8 - 1.2, y + hh); ctx.stroke(); ctx.strokeStyle = 'rgba(30,26,20,0.8)'; ctx.lineWidth = 3; } }
    else { ctx.fillStyle = 'rgba(150,170,180,0.35)'; ctx.fillRect(x, y, w, hh); ctx.lineWidth = 1.1; for (let k = 0; k < 100; k++) { ctx.strokeStyle = k % 2 ? 'rgba(220,230,216,0.45)' : 'rgba(100,116,102,0.4)'; ctx.beginPath(); ctx.moveTo(x + (w * k) / 100, y); ctx.lineTo(x + (w * k) / 100, y + hh); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y + (hh * k) / 100); ctx.lineTo(x + w, y + (hh * k) / 100); ctx.stroke(); } }
    ctx.restore(); ctx.restore();
  };
  const K = 3;   // sub-cells per grid cell when the field is drawn (bilinear)
  const smoothField = (f) => {   // bilinear 2x sample of a grid field
    const out = new Float32Array(G * K * R * K);
    for (let sj = 0; sj < R * K; sj++) for (let si = 0; si < G * K; si++) {
      const fx2 = clamp((si + 0.5) / K - 0.5, 0, G - 1), fy2 = clamp((sj + 0.5) / K - 0.5, 0, R - 1), i0 = Math.floor(fx2), j0 = Math.floor(fy2), i1 = Math.min(G - 1, i0 + 1), j1 = Math.min(R - 1, j0 + 1), tx = fx2 - i0, ty = fy2 - j0;
      out[sj * G * K + si] = (f[idx(i0, j0)] * (1 - tx) + f[idx(i1, j0)] * tx) * (1 - ty) + (f[idx(i0, j1)] * (1 - tx) + f[idx(i1, j1)] * tx) * ty;
    }
    return out;
  };
  const drawField = (ctx, V, tl, hf, Df, t) => {
    const x = V.ox + (tl ? tl[0] * V.s * 0.025 : 0), y = V.oy + (tl ? tl[1] * V.s * ASP * 0.015 : 0), cw = V.s / (G * K), ch = (V.s * ASP) / (R * K), GW = G * K;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, V.s, V.s * ASP); ctx.clip();
    if (Df) { const sd = smoothField(Df); for (let sj = 0; sj < R * K; sj++) for (let si = 0; si < GW; si++) { const d = sd[sj * GW + si]; if (d < 0.03) continue; const a = clamp(d / 1.0, 0, 1); ctx.fillStyle = rgba(PULP, 0.12 + 0.88 * Math.pow(a, 0.8)); ctx.fillRect(x + si * cw - 0.4, y + sj * ch - 0.4, cw + 0.8, ch + 0.8); } }
    if (hf) { const sh = smoothField(hf); for (let sj = 0; sj < R * K; sj++) for (let si = 0; si < GW; si++) { const v = sh[sj * GW + si] * (1 + 0.09 * Math.sin(si * 0.45 + t * 0.5) * Math.cos(sj * 0.38 - t * 0.4)); if (v < 0.03) continue; const a = clamp(v / 1.5, 0, 1), l = sh[sj * GW + Math.max(0, si - 1)], r2 = sh[sj * GW + Math.min(GW - 1, si + 1)], u2 = sh[Math.max(0, sj - 1) * GW + si], d2 = sh[Math.min(R * K - 1, sj + 1) * GW + si], shade = clamp((l - r2 + u2 - d2) * 0.35, -0.5, 0.5); const col = tint(a < 0.6 ? mix(mix(WATER, PULP, 0.25), PULP, a / 0.6) : mix(PULP, '#b8985a', (a - 0.6) / 0.4 * 0.55), shade * 0.5); ctx.fillStyle = rgba(col, clamp(0.08 + 1.05 * Math.pow(a, 0.65), 0, 0.97)); ctx.fillRect(x + si * cw - 0.4, y + sj * ch - 0.4, cw + 0.8, ch + 0.8); } }
    if (FORM === 'beat' && hf) { const ev = evenness(sumHD()), a0 = 0.5 * (1 - ev); if (a0 > 0.03) { ctx.strokeStyle = `rgba(60,36,14,${a0})`; ctx.lineWidth = 1.6; for (let k = 0; k < 5; k++) { const sx0 = x + (V.s * (k + 0.08)) / 5; rrect(ctx, sx0, y, V.s * 0.84 / 5, V.s * ASP, 4); ctx.stroke(); } for (let k = 0; k < 6; k++) { const sy0 = y + (V.s * ASP * (k + 0.08)) / 6; rrect(ctx, x, sy0, V.s, V.s * ASP * 0.84 / 6, 4); ctx.stroke(); } } }
    if (P.flowers && hf) { const FC = ['#c8283a', '#f0b82a', '#e8e0f0', '#d86aa0', '#f07a28']; for (let k = 0; k < 16; k++) { const u = 0.1 + 0.8 * hash(k, 121), v = 0.08 + 0.84 * hash(k, 122), th = hf[idx(clamp(Math.floor(u * G), 0, G - 1), clamp(Math.floor(v * R), 0, R - 1))] + (Df ? Df[idx(clamp(Math.floor(u * G), 0, G - 1), clamp(Math.floor(v * R), 0, R - 1))] : 0); if (th < 0.3) continue; ctx.save(); ctx.translate(x + u * V.s, y + v * V.s * ASP); ctx.rotate(hash(k, 123) * 6.28); ctx.globalAlpha = clamp(th, 0, 1) * 0.9; ctx.fillStyle = k % 4 === 3 ? '#4a8a3a' : FC[k % 5]; ctx.beginPath(); ctx.ellipse(0, 0, V.s * (0.018 + 0.016 * hash(k, 124)), V.s * 0.011, 0, 0, TAU); ctx.fill(); ctx.restore(); } }
    // fibres lying on top
    for (let k = 0; k < 180; k++) { const px = x + hash(k, 63) * V.s, py = y + hash(k, 64) * V.s * ASP, vv = (hf ? hf[idx(clamp(Math.floor(((px - x) / V.s) * G), 0, G - 1), clamp(Math.floor(((py - y) / (V.s * ASP)) * R), 0, R - 1))] : 0) + (Df ? Df[idx(clamp(Math.floor(((px - x) / V.s) * G), 0, G - 1), clamp(Math.floor(((py - y) / (V.s * ASP)) * R), 0, R - 1))] : 0); if (vv < 0.35) continue; const a = hash(k, 65) * 3.1; ctx.strokeStyle = rgba('#ffffff', 0.12 + 0.12 * clamp(vv, 0, 2)); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + Math.cos(a) * 8, py + Math.sin(a) * 8 + 3, px + Math.cos(a) * 17, py + Math.sin(a) * 17); ctx.stroke(); }
    if (hf && FORM === 'slosh' && sub === 'running') { const amp = Math.min(1, Math.hypot(ax, ay) * 0.25); ctx.strokeStyle = `rgba(255,255,255,${0.18 * amp})`; ctx.lineWidth = 2; for (let k = 0; k < 9; k++) { const yy = y + (V.s * ASP * (k + 0.5)) / 9, ph = t * 3 + k * 0.9; ctx.beginPath(); ctx.moveTo(x, yy + Math.sin(ph) * 8 * amp); ctx.bezierCurveTo(x + V.s * 0.3, yy + Math.cos(ph) * 14 * amp, x + V.s * 0.7, yy - Math.sin(ph * 1.3) * 14 * amp, x + V.s, yy + Math.cos(ph) * 8 * amp); ctx.stroke(); } }
    if (hf) { ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1.4; for (let k = 0; k < 6; k++) { const yy = y + (V.s * ASP * (k + 0.5)) / 6 + Math.sin(t * 2 + k) * 4; ctx.beginPath(); ctx.moveTo(x, yy); ctx.bezierCurveTo(x + V.s * 0.3, yy - 4, x + V.s * 0.6, yy + 4, x + V.s, yy); ctx.stroke(); } }
    ctx.restore();
  };
  const sheetFinished = (ctx, V, o = {}) => {   // the formed sheet alone, with fibres, thin and thick places, and the deckle edge
    const x = V.ox, y = V.oy, w = V.s, hh = V.s * ASP, cw = w / G, ch = hh / R;
    ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha; ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 5; ctx.beginPath(); for (let q = 0; q <= 30; q++) ctx.lineTo(x + (w * q) / 30, y + (hash(q, 5) - 0.5) * 2.5); for (let q = 0; q <= 38; q++) ctx.lineTo(x + w + (hash(q, 6) - 0.5) * 2.5, y + (hh * q) / 38); for (let q = 30; q >= 0; q--) ctx.lineTo(x + (w * q) / 30, y + hh + (hash(q, 7) - 0.5) * 2.5); for (let q = 38; q >= 0; q--) ctx.lineTo(x + (hash(q, 8) - 0.5) * 2.5, y + (hh * q) / 38); ctx.closePath(); ctx.fillStyle = PULP; ctx.fill(); ctx.restore();
    ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha; ctx.beginPath(); ctx.rect(x, y, w, hh); ctx.clip();
    const m = o.flat ? FLAT : (sheetCells ?? D); for (let j = 0; j < R; j++) for (let i = 0; i < G; i++) { const d = m[idx(i, j)], dev = clamp((d - 0.9) / 0.9, -1, 1); ctx.fillStyle = dev > 0 ? `rgba(255,255,255,${0.07 * dev})` : `rgba(70,80,90,${-0.24 * dev})`; ctx.fillRect(x + i * cw, y + j * ch, cw + 0.5, ch + 0.5); }
    for (let k = 0; k < 380; k++) { ctx.strokeStyle = k % 3 ? 'rgba(255,255,255,0.3)' : 'rgba(140,110,60,0.2)'; ctx.lineWidth = 0.9; const px = x + hash(k, 71) * w, py = y + hash(k, 72) * hh, a = hash(k, 73) * 3.1; ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + Math.cos(a) * 9, py + Math.sin(a) * 9 + 3, px + Math.cos(a) * 18, py + Math.sin(a) * 18); ctx.stroke(); }
    // what the mould leaves in the sheet: ribs from a bamboo screen, laid wires and chain lines (and a watermark) from a wire mould, coarse flecks of bark from a mesh
    if (MOULD === 'su') { ctx.strokeStyle = 'rgba(120,100,60,0.07)'; ctx.lineWidth = 1; for (let k = 0; k < 64; k++) { ctx.beginPath(); ctx.moveTo(x + (w * (k + 0.5)) / 64, y); ctx.lineTo(x + (w * (k + 0.5)) / 64, y + hh); ctx.stroke(); } }
    else if (MOULD === 'laid') {
      ctx.strokeStyle = 'rgba(120,110,80,0.09)'; ctx.lineWidth = 1; for (let k = 0; k < 80; k++) { ctx.beginPath(); ctx.moveTo(x, y + (hh * (k + 0.5)) / 80); ctx.lineTo(x + w, y + (hh * (k + 0.5)) / 80); ctx.stroke(); } ctx.strokeStyle = 'rgba(120,110,80,0.14)'; ctx.lineWidth = 1.6; for (let k = 1; k < 8; k++) { ctx.beginPath(); ctx.moveTo(x + (w * k) / 8, y); ctx.lineTo(x + (w * k) / 8, y + hh); ctx.stroke(); }
      const wx = x + w * 0.5, wy = y + hh * 0.4, wr = w * 0.17; ctx.strokeStyle = 'rgba(90,80,60,0.2)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(wx, wy, wr, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(wx - wr * 0.5, wy + wr * 0.4); ctx.quadraticCurveTo(wx - wr * 0.1, wy - wr * 0.9, wx + wr * 0.45, wy - wr * 0.3); ctx.quadraticCurveTo(wx + wr * 0.7, wy + wr * 0.1, wx + wr * 0.3, wy + wr * 0.5); ctx.stroke(); ctx.beginPath(); ctx.arc(wx + wr * 0.4, wy - wr * 0.3, wr * 0.12, 0, TAU); ctx.stroke();
    } else { for (let k = 0; k < 60; k++) { ctx.fillStyle = k % 2 ? 'rgba(110,80,40,0.22)' : 'rgba(255,250,235,0.35)'; ctx.beginPath(); ctx.ellipse(x + hash(k, 81) * w, y + hash(k, 82) * hh, 2 + 3 * hash(k, 83), 0.9, hash(k, 84) * 3, 0, TAU); ctx.fill(); } }
    if (MOULD === 'bare') { ctx.strokeStyle = 'rgba(60,34,12,0.16)'; ctx.lineWidth = 1; for (let k = 0; k < 90; k++) { ctx.beginPath(); ctx.moveTo(x, y + (hh * (k + 0.5)) / 90); ctx.lineTo(x + w, y + (hh * (k + 0.5)) / 90 + (hash(k, 9) - 0.5) * 2); ctx.stroke(); } ctx.strokeStyle = 'rgba(255,240,210,0.1)'; for (let k = 0; k < 90; k += 3) { ctx.beginPath(); ctx.moveTo(x, y + (hh * (k + 0.8)) / 90); ctx.lineTo(x + w, y + (hh * (k + 0.8)) / 90); ctx.stroke(); } }
    if (HERO?.art && !o.noArt) HERO.art(ctx, x, y, w, hh);   // 1.24.0: a printed pattern on the finished cloth
    if (P.flowers) { const FC = ['#c8283a', '#f0b82a', '#e8e0f0', '#d86aa0', '#f07a28'], FL = ['#3a7a3a', '#5a9a40']; for (let k = 0; k < 9; k++) { const fx2 = x + w * (0.12 + 0.76 * hash(k, 111)), fy2 = y + hh * (0.08 + 0.84 * hash(k, 112)), fr = w * (0.05 + 0.04 * hash(k, 113)), a = hash(k, 114) * 6.28; ctx.save(); ctx.translate(fx2, fy2); ctx.rotate(a); ctx.globalAlpha = 0.9; if (k % 3 === 2) { ctx.fillStyle = FL[k % 2]; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(fr * 0.8, -fr * 0.9, 0, -fr * 2); ctx.quadraticCurveTo(-fr * 0.8, -fr * 0.9, 0, 0); ctx.fill(); ctx.strokeStyle = 'rgba(20,60,20,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -fr * 1.9); ctx.stroke(); } else { for (let q = 0; q < 5; q++) { ctx.rotate(TAU / 5); ctx.fillStyle = FC[(k + q % 2) % 5]; ctx.beginPath(); ctx.ellipse(0, -fr * 0.62, fr * 0.36, fr * 0.62, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(70,20,20,0.35)'; ctx.lineWidth = 0.8; ctx.stroke(); } ctx.fillStyle = '#f6d860'; ctx.beginPath(); ctx.arc(0, 0, fr * 0.2, 0, TAU); ctx.fill(); } ctx.restore(); } }
    if (o.wrinkles) wrinkles.forEach((q, k) => { const sm = clamp(smooth[k] ?? 0, 0, 1); if (sm >= 1) return; ctx.save(); ctx.translate(x + q.x * w, y + q.y * w); ctx.rotate(q.a); const aa = 1 - sm; ctx.fillStyle = `rgba(70,50,20,${0.3 * aa})`; ctx.beginPath(); ctx.ellipse(0, 3, q.r * w * 1.05, q.r * w * 0.22, 0, 0, TAU); ctx.fill(); ctx.fillStyle = `rgba(255,255,255,${0.5 * aa})`; ctx.beginPath(); ctx.ellipse(0, -2, q.r * w * 1.0, q.r * w * 0.16, 0, 0, TAU); ctx.fill(); ctx.restore(); });
    ctx.restore();
  };
  const drawStackAt = (ctx, V, at, hl, k = 1) => {   // the post of felts and sheets the new sheet is couched on, seen from above
    const w = V.s * 0.94 * k, hh = V.s * ASP * 0.9 * k, x = X(V, at[0]) - w / 2, y = Y(V, at[1]) - hh / 2;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 8; for (let k = 5; k >= 0; k--) { ctx.fillStyle = k % 2 ? tint(SC.feltC ?? '#7a6a52', 0.14) : (SC.feltC ?? '#7a6a52'); rrect(ctx, x + k * 1.6, y + k * 1.6 + 5, w, hh, 5); ctx.fill(); ctx.shadowColor = 'transparent'; }
    ctx.restore(); ctx.save(); rrect(ctx, x, y, w, hh, 5); ctx.clip(); ctx.fillStyle = SC.feltC ?? '#7a6a52'; ctx.fillRect(x, y, w, hh); for (let k = 0; k < 500; k++) { ctx.fillStyle = k % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'; ctx.fillRect(x + hash(k, 3) * w, y + hash(k, 4) * hh, 2, 2); } ctx.restore();
    ctx.strokeStyle = hl ? 'rgba(255,230,140,0.95)' : 'rgba(255,255,255,0.55)'; ctx.setLineDash([8, 6]); ctx.lineWidth = 2.5; rrect(ctx, x, y, w, hh, 5); ctx.stroke(); ctx.setLineDash([]);
  };
  const drawPress = (ctx, V, tt) => {   // a screw press from above: the stack under a wooden frame, a wheel with spokes that turns with every pump
    const bd = V.s * 0.1, x = V.ox - bd, y = V.oy - bd, w = V.s + bd * 2, hh = V.s * ASP + bd * 2;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 8; rrect(ctx, x, y, w, hh, 8); ctx.fillStyle = '#5a4128'; ctx.fill(); ctx.restore(); plank(ctx, x, y, w, hh, '#6a4a2a', false);
    const sq = press.n / PUMPS, sc = 1 - 0.04 * sq; ctx.save(); ctx.translate(V.ox + V.s / 2, V.oy + (V.s * ASP) / 2); ctx.scale(sc, sc); ctx.translate(-(V.ox + V.s / 2), -(V.oy + (V.s * ASP) / 2));
    sheetFinished(ctx, V, {}); ctx.fillStyle = 'rgba(40,30,18,0.12)'; ctx.fillRect(V.ox, V.oy, V.s, V.s * ASP); ctx.restore();
    // the wheel
    const cx = V.ox + V.s / 2, cy = V.oy + (V.s * ASP) / 2, rr = V.s * 0.32, rot = (press.n + clamp((press.t % 1.2) / 1.2, 0, 1) * 0) * 0.9 + (press.rot ?? 0);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.globalAlpha = 0.9; ctx.strokeStyle = '#4a3018'; ctx.lineWidth = V.s * 0.045; ctx.lineCap = 'round'; for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(rr, 0); ctx.stroke(); ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.arc(rr, 0, V.s * 0.03, 0, TAU); ctx.fill(); } ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.arc(0, 0, V.s * 0.06, 0, TAU); ctx.fill(); ctx.strokeStyle = '#7a5a20'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    for (let k = 0; k < press.n * 3; k++) { ctx.fillStyle = 'rgba(160,190,205,0.55)'; ctx.beginPath(); ctx.ellipse(x + w * (0.1 + 0.8 * hash(k, 22)), y + hh - 4 + (hash(k, 23) - 0.5) * 3, 4, 2, 0, 0, TAU); ctx.fill(); }
  };
  const drawBoard = (ctx, V, kind) => {   // the drying board or stone under the sheet: a thick slab with a lit top, a dark front face, grain or chisel marks (1.20.0)
    const bd = V.s * 0.07, x = V.ox - bd, y = V.oy - bd, w = V.s + bd * 2, hh = V.s * ASP + bd * 2, th = V.s * 0.05, stone = kind === 'stone';
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 12; rrect(ctx, x, y + th, w, hh, 8); ctx.fillStyle = stone ? '#4a4a48' : '#6a4a28'; ctx.fill(); ctx.restore();
    const fg = ctx.createLinearGradient(0, y + hh, 0, y + hh + th); fg.addColorStop(0, stone ? '#6a6a66' : '#8a6234'); fg.addColorStop(1, stone ? '#3a3a38' : '#4a3018'); ctx.fillStyle = fg; rrect(ctx, x, y + th * 0.4, w, hh + th * 0.6, 8); ctx.fill();
    ctx.save(); rrect(ctx, x, y, w, hh, 8); ctx.clip();
    if (stone) {
      const g = ctx.createLinearGradient(x, y, x + w, y + hh); g.addColorStop(0, '#c2c2bc'); g.addColorStop(0.5, '#9a9a94'); g.addColorStop(1, '#6a6a66'); ctx.fillStyle = g; ctx.fillRect(x, y, w, hh);
      for (let k = 0; k < 420; k++) { ctx.fillStyle = k % 2 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'; ctx.fillRect(x + hash(k, 13) * w, y + hash(k, 14) * hh, 2, 2); }
      ctx.strokeStyle = 'rgba(40,40,38,0.22)'; ctx.lineWidth = 1.2; for (let k = 0; k < 26; k++) { const px = x + hash(k, 15) * w, py = y + hash(k, 16) * hh; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 10 + 14 * hash(k, 17), py - 5 + 10 * hash(k, 18)); ctx.stroke(); }
    } else {
      plank(ctx, x, y, w, hh, '#c09258', true);
      ctx.fillStyle = 'rgba(70,40,10,0.45)'; for (const f of [0.18, 0.5, 0.82]) ctx.fillRect(x, y + hh * f - 2, w, 4);
      for (let k = 0; k < 7; k++) { ctx.strokeStyle = 'rgba(255,230,170,0.16)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y + (hh * (k + 0.5)) / 7); ctx.lineTo(x + w, y + (hh * (k + 0.5)) / 7); ctx.stroke(); }
    }
    const lt = ctx.createLinearGradient(x, y, x + w, y + hh); lt.addColorStop(0, 'rgba(255,255,255,0.18)'); lt.addColorStop(0.4, 'rgba(255,255,255,0)'); lt.addColorStop(1, 'rgba(0,0,0,0.2)'); ctx.fillStyle = lt; ctx.fillRect(x, y, w, hh);
    ctx.restore(); ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.5; rrect(ctx, x + 1, y + 1, w - 2, hh - 2, 8); ctx.stroke();
    if (stone) {   // the wooden mallet resting at the side
      const mx = x + w + V.s * 0.02, my = y + hh * 0.72; ctx.save(); ctx.translate(mx, my); ctx.rotate(-0.5);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(4, 8, V.s * 0.12, V.s * 0.035);
      const hg = ctx.createLinearGradient(0, -V.s * 0.02, 0, V.s * 0.025); hg.addColorStop(0, '#d8a868'); hg.addColorStop(1, '#6a4420'); ctx.fillStyle = hg; rrect(ctx, 0, -V.s * 0.018, V.s * 0.2, V.s * 0.036, V.s * 0.018); ctx.fill();
      const mg = ctx.createLinearGradient(0, -V.s * 0.05, 0, V.s * 0.05); mg.addColorStop(0, '#e0b878'); mg.addColorStop(1, '#6a4420'); ctx.fillStyle = mg; rrect(ctx, V.s * 0.19, -V.s * 0.05, V.s * 0.1, V.s * 0.1, 6); ctx.fill(); ctx.strokeStyle = 'rgba(40,20,4,0.5)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    }
  };
  const draw = (g, Rt, tt) => {
    const { ctx, pal: PL } = g, W0 = Rt.work, lift = SC.wall ? wallLift(W0) * 0.3 : 0;
    const Wk = { x: W0.x, y: W0.y + 52 + lift, w: W0.w, h: W0.h - 52 - lift - 4 };
    const padk = 0.3, s = Math.min((Wk.w - 16) / (1 + padk * 0.4), (Wk.h - 4) / (ASP + padk * 0.4)) * 0.73, V = HERO ? HERO.layout({ x: W0.x, y: W0.y + 36, w: W0.w, h: W0.h - 36 }) : { ox: Wk.x + (Wk.w - s) / 2, oy: Wk.y + (Wk.h - s * ASP) / 2 + 2, s };
    const ho = HERO ? { P, SC, PULP, WATER, t: tt, now, ripples, tl: phase === 'form' && FORM === 'slosh' && sub === 'running' ? tilt : null, asp: ASP, press, sheet: sheetFinished } : null;
    geo = { ox: V.ox, oy: V.oy, s };
    if (phase === 'form') {
      const mix2 = Math.hypot(ax, ay); if (sub === 'running' && mix2 > 1.2 && now - (ripples[ripples.length - 1] ?? -9) > 0.35) { ripples.push(now); if (ripples.length > 5) ripples.shift(); }
      const tl = FORM === 'slosh' && sub === 'running' ? tilt : null;
      if (HERO) {
        HERO.back(ctx, W0, V, ho);
        const rot = HERO.rot ? HERO.rot(ho) : 0; ctx.save();
        if (rot) { const pv = HERO.pivot(W0, V); ctx.translate(pv[0], pv[1]); ctx.rotate(rot); ctx.translate(-pv[0], -pv[1]); }
        HERO.mouldBack?.(ctx, W0, V, ho);
        if (FORM === 'beat') { drawField(ctx, V, tl, sub === 'idle' ? null : h, D, tt); } else { drawMould(ctx, V, HERO.rot ? null : tl, { noHandles: true }); drawField(ctx, V, HERO.rot ? null : tl, sub === 'idle' ? null : h, D, tt); }
        HERO.front?.(ctx, W0, V, ho); ctx.restore();
      } else { drawVat(ctx, V, tt); drawMould(ctx, V, tl); drawField(ctx, V, tl, sub === 'idle' ? null : h, D, tt); }
      if (sub === 'running' && FORM === 'slosh') { const bw = V.s * 0.6, bx = V.ox + (V.s - bw) / 2, by = V.oy + V.s * ASP + V.s * 0.15; ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, bx, by, bw, 8, 4); ctx.fill(); ctx.fillStyle = PL.accent; rrect(ctx, bx, by, bw * (1 - tDrain / DRAIN_T), 8, 4); ctx.fill(); g.label(ctx, 'Water draining', V.ox + V.s / 2, by + 22, g.px(15), PL.dim, 'center', '500'); }
    } else if (phase === 'couch') {
      ctx.save(); ctx.beginPath(); ctx.rect(W0.x, W0.y, W0.w, W0.h); ctx.clip();
      if (HERO) HERO.back(ctx, W0, V, ho);
      const cs = HERO?.couchScale ?? 1;
      drawStackAt(ctx, V, couchTarget, Math.hypot(sheetPos[0] - couchTarget[0], sheetPos[1] - couchTarget[1]) < 0.06, cs);
      const sp = { ox: X(V, sheetPos[0]) - (V.s * cs) / 2, oy: Y(V, sheetPos[1]) - (V.s * cs * ASP) / 2, s: V.s * cs };
      ctx.globalAlpha = 0.93; drawMould(ctx, sp, null, { bg: 'rgba(0,0,0,0)' }); ctx.globalAlpha = 1; sheetFinished(ctx, { ox: sp.ox, oy: sp.oy, s: sp.s }, { alpha: 0.96 });
      ctx.restore();
    } else if (phase === 'finish') {
      if (HERO) { HERO.back(ctx, W0, V, ho); if (FORM === 'beat') HERO.mouldBack?.(ctx, W0, V, ho); }
      if (FIN === 'press') { if (HERO?.press) HERO.press(ctx, W0, V, ho); else drawPress(ctx, V, tt); }
      else if (HERO && FORM === 'beat') sheetFinished(ctx, V, { wrinkles: false });
      else { drawBoard(ctx, V, FIN === 'pound' ? 'stone' : 'board'); sheetFinished(ctx, V, { wrinkles: FIN === 'brush' }); }
      if (FIN === 'press') {
        const gx = V.ox + V.s * (HERO?.gaugeDx ?? 1.14); if (gx + 26 < W0.x + W0.w) { const gy = V.oy, gh = V.s * ASP; ctx.fillStyle = 'rgba(0,0,0,0.45)'; rrect(ctx, gx, gy, 22, gh, 11); ctx.fill(); ctx.fillStyle = 'rgba(90,200,120,0.4)'; rrect(ctx, gx, gy, 22, gh * 0.2, 11); ctx.fill(); const b = gauge(press.t); ctx.fillStyle = PL.accent; ctx.beginPath(); ctx.arc(gx + 11, gy + gh * (1 - b), 12, 0, TAU); ctx.fill(); }
        for (let k = 0; k < PUMPS; k++) { ctx.fillStyle = k < press.n ? PL.accent : 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(V.ox + V.s / 2 + (k - (PUMPS - 1) / 2) * 24, V.oy + V.s * ASP + V.s * 0.14, 7, 0, TAU); ctx.fill(); }
      }
      if (FIN === 'pound') {
        const zw = V.s / 3, zh = (V.s * ASP) / 4;
        zones.forEach((z, k) => { const zx = V.ox + z.i * zw, zy = V.oy + z.j * zh, cur = seqAt < seq.length && seq[seqAt] === k, lit = cur && press.t % 1.0 < 0.8;
          ctx.strokeStyle = z.hit ? 'rgba(140,220,150,0.9)' : z.miss ? 'rgba(220,120,100,0.7)' : 'rgba(60,50,40,0.35)'; ctx.lineWidth = 2; rrect(ctx, zx + 3, zy + 3, zw - 6, zh - 6, 8); ctx.stroke();
          if (lit) { ctx.fillStyle = rgba(PL.accent, 0.4 + 0.2 * Math.sin(tt * 12)); rrect(ctx, zx + 3, zy + 3, zw - 6, zh - 6, 8); ctx.fill(); ctx.strokeStyle = PL.accent; ctx.lineWidth = 4; ctx.stroke(); }
          if (z.hit) { ctx.fillStyle = 'rgba(255,255,255,0.2)'; rrect(ctx, zx + 3, zy + 3, zw - 6, zh - 6, 8); ctx.fill(); } });
        g.label(ctx, `${hits} of ${zones.length} zones`, V.ox + V.s / 2, V.oy + V.s * ASP + V.s * 0.14, g.px(16), PL.dim, 'center', '500');
      }
    }
    if (done) sheetFinished(ctx, V, {});
    const hintTxt = done ? '' : phase === 'form' ? (sub === 'idle' ? (FORM === 'slosh' ? 'Dip the mould in the vat.' : FORM === 'beat' ? 'Lay the bark strips on the board.' : 'Pour the pulp on the screen.') : FORM === 'slosh' ? 'Rock the mould fast along both axes to mix the pulp evenly.' : FORM === 'beat' ? `Beat the strips with the ${BEAT} until they are one even sheet.` : 'Rub the heap out with your hand until it lies evenly.') : phase === 'couch' ? 'Drag the mould onto the stack and press Couch.' : FIN === 'press' ? 'Press Press when the ball is in the green.' : FIN === 'brush' ? 'Brush the wrinkles flat.' : 'Pound the zone that lights.';
    if (hintTxt) { ctx.font = `600 ${Math.round(g.px(20))}px system-ui, sans-serif`; const tw = Math.min(W0.w - 16, ctx.measureText(hintTxt).width + 28), ph = g.px(20) + 14; rrect(ctx, W0.x + (W0.w - tw) / 2, W0.y + 18 - ph / 2, tw, ph, ph / 2); ctx.fillStyle = 'rgba(12,10,8,0.62)'; ctx.fill(); g.label(ctx, hintTxt, W0.x + W0.w / 2, W0.y + 18, g.px(20), '#f4efe6', 'center', '600'); }
    if (ptr && ptr.down && !done && ((phase === 'form' && sub === 'running') || (phase === 'finish' && FIN === 'brush'))) drawTool(ctx, SC, phase === 'finish' ? 'brush' : (FORM === 'slosh' ? 'sponge' : FORM === 'beat' ? (HERO?.heldTool ?? 'stone') : 'trowel'), ptr.x, ptr.y, Math.max(90, V.s * 0.3), tt);
    const th = Rt.thumb, tw = Math.min(th.w - 14, (th.h - 14) / ASP), V2 = { ox: th.x + (th.w - tw) / 2, oy: th.y + (th.h - tw * ASP) / 2, s: tw };
    sheetFinished(ctx, V2, { flat: true });
  };
  const titleArt = (g, S, t) => {
    const { ctx } = g, s = Math.min(S.w * 0.7, (S.h * 0.9) / ASP), V = { ox: S.x + (S.w - s) / 2, oy: S.y + (S.h - s * ASP) / 2, s };
    if (HERO) {
      const hv = HERO.layout(S), tt = t ?? 0, ho = { P, SC, PULP, WATER, t: tt, now, ripples: [], tl: null, asp: ASP, press: { n: 0 }, sheet: sheetFinished };
      const tmp2 = new Float32Array(G * R); for (let j = 0; j < R; j++) for (let i = 0; i < G; i++) tmp2[idx(i, j)] = 1.1 + 0.4 * Math.sin(i * 0.5 + tt * 1.4) * Math.cos(j * 0.4 - tt);
      ctx.save(); ctx.beginPath(); ctx.rect(S.x, S.y, S.w, S.h); ctx.clip(); HERO.back(ctx, S, hv, ho); HERO.mouldBack?.(ctx, S, hv, ho);
      if (FORM !== 'beat') drawMould(ctx, hv, null, { noHandles: true }); drawField(ctx, hv, null, tmp2, null, tt); HERO.front?.(ctx, S, hv, ho); ctx.restore(); return;
    }
    drawVat(ctx, V, t ?? 0); drawMould(ctx, V, [Math.sin((t ?? 0) * 0.9) * 0.5, Math.cos((t ?? 0) * 0.7) * 0.5]);
    const tmp = new Float32Array(G * R); for (let j = 0; j < R; j++) for (let i = 0; i < G; i++) tmp[idx(i, j)] = 1.1 + 0.4 * Math.sin(i * 0.5 + (t ?? 0) * 1.4) * Math.cos(j * 0.4 - (t ?? 0)); drawField(ctx, V, null, tmp, null, t ?? 0);
  };

  const items = () => {
    if (phase === 'form') return sub === 'idle' ? [{ id: FORM === 'slosh' ? 'dip' : 'pour', kind: 'btn', label: FORM === 'slosh' ? 'Dip' : FORM === 'beat' ? 'Lay' : 'Pour', primary: true }] : [{ id: 'lift', kind: 'btn', label: 'Lift', primary: true }];
    if (phase === 'couch') return [{ id: 'couch', kind: 'btn', label: 'Couch', primary: true }];
    if (FIN === 'press') return [{ id: 'press', kind: 'btn', label: 'Press', primary: press.n < PUMPS }, { id: 'check', kind: 'btn', label: 'Check', primary: press.n >= PUMPS }];
    return [{ id: 'check', kind: 'btn', label: 'Check', primary: true }];
  };
  const stepNo = () => (phase === 'form' ? 1 : phase === 'couch' ? 2 : COUCH ? 3 : 2), stepsN = COUCH ? 3 : 2;
  const state = () => ({ technique: 'sheet', form: FORM, finish: FIN, phase, sub, even: Math.round(evenness(sumHD()) * 1000) / 1000, formScore: Math.round(formScore * 1000) / 1000, couchScore: Math.round(couchScore * 1000) / 1000, finScore: Math.round(finScore * 1000) / 1000, drain: Math.round(tDrain * 100) / 100, hits, pumps: press.n, steps: stepsN });
  init();
  return {
    init, items, control, work, tick, draw, attract, titleArt, result: () => done, score: total,
    hint: () => (phase === 'form' ? (sub === 'idle' ? (FORM === 'beat' ? 'Lay the bark strips on the board.' : 'Dip the mould in the vat.') : FORM === 'slosh' ? 'Tilt toward the thin, pale places so the pulp runs there.' : FORM === 'beat' ? 'Beat the thick places where the strips cross until they match the thin ones.' : 'Push the pulp from the thick heap toward the bare edges.') : phase === 'couch' ? 'Drag the mould onto the dashed stack, then press Couch.' : FIN === 'press' ? 'Press when the ball reaches the green zone.' : FIN === 'brush' ? 'Brush over each wrinkle until it lies flat.' : 'Pound the zone that is lit, while it is lit.'),
    info: () => [`Step ${stepNo()} of ${stepsN}: ${phase === 'form' ? 'Form the sheet' : phase === 'couch' ? 'Couch' : FIN === 'press' ? 'Press' : FIN === 'brush' ? 'Brush' : 'Pound'}`, phase === 'form' && sub === 'running' ? `Evenness: ${Math.round(evenness(sumHD()) * 100)}%` : ''].filter(Boolean),
    get caption() { return SC.words?.caption ?? 'Make this sheet'; },
    rules: () => [
      FORM === 'slosh' ? 'Press Dip, then drag on the mould to tilt it: the pulp runs towards the side you tilt to. The water drains through the screen in nine seconds and the fibre stays where it lay. A sheet that is thick in one place and thin in another scores less.' : FORM === 'beat' ? `Press Lay, then drag the ${BEAT} across the strips of bark, again and again, until they have beaten together into one even sheet. Press Lift when it is even.` : 'Press Pour, then push the pulp across the floating screen with your hand, in strokes, until the fibre lies evenly. Press Lift when it is even.',
      COUCH ? 'Drag the loaded mould to the stack and press Couch: the closer the sheet lies to the stack, the better.' : 'The sheet stays on its screen to dry.',
      FIN === 'press' ? 'Pump the press five times, each time the ball is in the green zone.' : FIN === 'brush' ? 'Brush each wrinkle in the sheet flat on its board.' : 'Pound each zone of the sheet with the mallet as it lights.',
      'Score: 60 percent for the form of the sheet, 20 percent for the couching and 20 percent for the finish. Doing nothing scores nothing.',
    ],
    point(id) {
      if (!geo) return null;
      if (id === 'stack') return { x: X(geo, couchTarget[0]), y: Y(geo, couchTarget[1]) };
      if (id === 'sheetstart') return { x: X(geo, sheetPos[0]), y: Y(geo, sheetPos[1]) };
      return null;
    },
    state,
  };
}

registerTechnique('sheet', { make: (P, env) => createSheet(P, env), scene: 'washiya', mat: 'wire' });

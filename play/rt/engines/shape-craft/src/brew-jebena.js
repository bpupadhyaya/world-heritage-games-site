// shape-craft `brew`, mode "jebena" (1.26.0): coffee as it is made in Ethiopia and Eritrea, four distinct jobs in a row.
//   1 Roast   stir green beans in a pan over charcoal so the colour comes out even, and pull the pan at the right colour.
//   2 Pound   grind the roasted beans in a wooden mortar with a pestle, hitting on the beat.
//   3 Boil    keep the brew in the neck of the round clay jebena between "not yet" and "overflowing" with the fan and by setting it aside.
//   4 Pour    pour from a height in one unbroken stream along a row of small cups, evening them out without stirring up the grounds.
// Score 0-100 beyond the passive baseline: roast 25, pound 20, boil 25, pour 30.
import { starsFor } from './geom.js';
import { fx as synth } from '../../../platform/engine-kit/synth.js';
import { hintPill, dockGauge } from './paint-ui.js';
import { shadowed, rrect } from './fx.js';
import { clamp, lerp, sm, cyl, bubble, foam, steam, glow, groundShadow, embers, spoonProp, tint, mix, rgba, lg, rg, ell, TAU, hash } from './brew-art.js';
import { X, Y, bean, roastColor, jebena, sini, wovenDisc } from './brew-jebena-art.js';

const SW = 1, SH = 0.8;
const PAN = { cx: 0.42, cy: 0.4, rx: 0.3, ry: 0.115 }, FLOOR = { dy: 0.022, rx: 0.262, ry: 0.082 };
const NB = 46, HOLD_NEED = 8, CUP_V = 0.665, CUP_HALF = 0.056, SPACE = 0.115, FT0 = 0.1, FT1 = 0.7, FILL_T = 0.85, Q = 0.5, RESERVE = 0.35;
const NAMES = ['Roast', 'Pound', 'Boil', 'Pour'];
const BAND = [0.62, 0.9];

const mkSound = (audio) => {
  const F = (kind, p) => { try { return synth(audio, kind, p); } catch { return false; } };
  return {
    stir(v) { F('scrape', { hz: 900 + v * 500, dur: 0.1, vel: 0.32 }); },
    crack(i) { F('pop', { hz: 330 + (i % 5) * 60, vel: 0.35 }); F('tick', { hz: 2200 + (i % 4) * 300, vel: 0.15, delay: 0.01 }); },
    smoke() { F('whoosh', { dur: 0.4, vel: 0.2, down: false }); },
    pull() { F('whoosh', { dur: 0.3, vel: 0.3, down: true }); F('impact', { mat: 'metal', hz: 420, vel: 0.35, delay: 0.25 }); },
    pound(q, F0) { F('impact', { mat: 'wood', hz: q > 0 ? 150 + 60 * F0 : 240, vel: 0.5 + 0.3 * q }); if (q > 0) F('scrape', { hz: 1200 + 1800 * F0, dur: 0.12, vel: 0.3, delay: 0.03 }); else F('tick', { hz: 900, vel: 0.3, delay: 0.02 }); },
    full() { F('good', { hz: 560, vel: 0.4 }); },
    fan() { F('whoosh', { dur: 0.22, vel: 0.35, down: false }); F('whoosh', { dur: 0.22, vel: 0.28, down: true, delay: 0.2 }); },
    aside() { F('impact', { mat: 'clay', hz: 260, vel: 0.4 }); F('scrape', { hz: 600, dur: 0.16, vel: 0.2, delay: 0.03 }); },
    simmer(L) { F('pop', { hz: 260 + L * 480, vel: 0.1 + L * 0.1 }); },
    spill() { F('splash', { vel: 0.7 }); F('scrape', { hz: 3300, dur: 0.5, vel: 0.5, delay: 0.05 }); F('bad', { hz: 200, vel: 0.35, delay: 0.1 }); },
    ready() { F('good', { hz: 620, vel: 0.5 }); F('ring', { hz: 1480, dur: 0.8, vel: 0.22, delay: 0.1 }); },
    stream(fill) { F('scrape', { hz: 1500 + fill * 2300, dur: 0.1, vel: 0.3 }); },
    cup() { F('ring', { hz: 2000, dur: 0.4, vel: 0.15 }); },
    shake() { F('bad', { hz: 300, vel: 0.2 }); },
    win(stars) { F('good', { hz: 600 + stars * 80, vel: 0.5 }); F('ring', { hz: 1568, dur: 0.9, vel: 0.2, delay: 0.1 }); },
  };
};

export function createJebena(P, env) {
  const { rng, fx } = env, SC = P.scene ?? {}, W = SC.words ?? {};
  const snd = mkSound(env.audio);
  if (env.options?.soundLog) for (const k of Object.keys(snd)) { const f = snd[k]; snd[k] = (...a) => { env.options.soundLog.push({ kind: `jebena.${k}` }); return f(...a); }; }
  let stage, stageT, now, done, geo, msg, msgT, scores, ro, po, bo, pr, sndT, auto, ptr, tip;

  const init = () => {
    stage = 0; stageT = 0; now = 0; done = null; msg = ''; msgT = 0; scores = [null, null, null, null]; sndT = { stir: 0, simmer: 0, stream: 0, smoke: 0, shake: 0, crack: 0 }; ptr = null; tip = { nx: 0.3, ny: 0.2 };
    const hotA = rng.next() * TAU;
    ro = { rho: [], th: [], r: [], cr: [], hotA, hx: 0.5 * Math.cos(hotA), hy: 0.5 * Math.sin(hotA), E: 0, lastA: null, target: 0.64 + rng.next() * 0.1, pullT: -1, cracks: 0, ang: 0, started: false };
    for (let i = 0; i < NB; i++) { ro.rho.push(Math.sqrt(rng.next()) * 0.9); ro.th.push(rng.next() * TAU); ro.r.push(0); ro.cr.push(false); }
    po = { bpm: 74 + rng.int(18), t0: 0, grind: 0, hits: [], scatter: 0, lastT: -9, pulse: 0, full: false, fullT: 0, count: 0 };
    bo = { c: 0.4, aside: false, asideK: 0, T: 0.45, L: 0, hold: 0, spills: 0, overT: 0, fanT: -9, ready: false, readyT: 0, spillK: 0, lost: 0, t: 0, flares: [0, 1, 2, 3].map((k) => 5.5 + k * 6.5 + rng.next() * 2), flareT: -9, fi: 0 };
    const n = 4 + rng.int(2);
    pr = { n, cups: Array.from({ length: n }, () => ({ fill: 0, ripple: 0 })), vol: n * FILL_T + RESERVE, sx: 0.5, sv: 0.3, tx: 0.5, tv: 0.3, down: false, flowK: 0, hist: [], breaks: 0, was: false, started: false, waste: 0, shake: 0, deep: 0, hSum: 0, hT: 0, lastVx: 0, lastX: 0.5, landX: 0.5, pourT: 0, ci: -1 };
    auto = { st: 0, wait: 0.5, phase: 0, cup: 0, dir: 1 };
  };
  const meanR = () => ro.r.reduce((s, v) => s + v, 0) / NB;
  const stdR = () => { const m = meanR(); return Math.sqrt(ro.r.reduce((s, v) => s + (v - m) * (v - m), 0) / NB); };
  const burntR = () => ro.r.filter((v) => v > 0.9).length / NB;
  const roastScore = () => { const d = Math.abs(meanR() - ro.target), m = clamp(1 - Math.max(0, d - 0.04) / 0.2, 0, 1), ev = clamp(1 - stdR() / 0.26, 0, 1), bu = clamp(1 - burntR() * 2.5, 0, 1); return m * (0.35 + 0.65 * ev) * bu; };
  const avgQ = () => (po.hits.length ? po.hits.reduce((s, h) => s + h, 0) / po.hits.length : 0);
  const poundScore = () => { const F0 = clamp(po.grind, 0, 1); return F0 * (0.4 + 0.6 * avgQ()) * clamp(1 - po.scatter * 0.04, 0.6, 1) * (po.hits.length >= 4 ? 1 : po.hits.length / 4); };
  const boilScore = () => clamp(bo.hold / HOLD_NEED, 0, 1) * clamp(1 - 0.28 * bo.spills, 0.2, 1);
  const pourParts = () => {
    const fills = pr.cups.map((c) => c.fill), mean = fills.reduce((s, v) => s + v, 0) / fills.length;
    if (mean < 0.08) return { even: 0, waste: 0, clean: 0, cont: 0, high: 0 };
    const errs = fills.map((v) => Math.abs(v - FILL_T)), mx = Math.max(...errs), me = errs.reduce((s, v) => s + v, 0) / errs.length;
    const total = pr.n * FILL_T + RESERVE, wasteF = pr.waste / total;
    return { even: clamp(0.6 * (1 - mx / 0.3) + 0.4 * (1 - me / 0.15), 0, 1), waste: clamp(1 - wasteF * 3, 0, 1), clean: clamp(1 - (pr.shake + pr.deep) * 1.6, 0, 1), cont: clamp(1 - 0.2 * pr.breaks, 0, 1), high: pr.hT > 0.5 ? clamp((pr.hSum / pr.hT) / 0.2, 0.4, 1) : 0 };
  };
  const pourScore = () => { const q = pourParts(); return 0.42 * q.even + 0.2 * q.waste + 0.18 * q.clean + 0.12 * q.cont + 0.08 * q.high; };
  const liveScores = () => { const s = [...scores]; if (stage === 0 && s[0] == null) s[0] = roastScore() * (ro.pullT >= 0 ? 1 : 0); if (stage === 1 && s[1] == null) s[1] = poundScore(); if (stage === 2 && s[2] == null) s[2] = boilScore(); if (stage === 3 && s[3] == null) s[3] = pourScore(); return s; };
  const score = () => { const s = liveScores(); return Math.round(Math.min(100, 25 * (s[0] ?? 0) + 20 * (s[1] ?? 0) + 25 * (s[2] ?? 0) + 30 * (s[3] ?? 0))); };
  const totalScore = () => (done ? done.score : score());

  // ---- stage changes ---------------------------------------------------------------------------------------------------------------------
  const note = (m) => { msg = m; msgT = 2.4; };
  const endStage = () => {
    if (done || stageT < 0.25) return;
    if (stage === 0) { scores[0] = roastScore(); ro.pullT = now; snd.pull(); note(`Roasted: colour ${Math.round(100 * clamp(1 - Math.abs(meanR() - ro.target) / 0.3, 0, 1))} percent right, ${Math.round(100 * clamp(1 - stdR() / 0.22, 0, 1))} percent even`); }
    else if (stage === 1) { scores[1] = poundScore(); note(`Ground ${Math.round(100 * clamp(po.grind, 0, 1))} percent fine, ${Math.round(100 * avgQ())} percent on the beat`); }
    else if (stage === 2) { scores[2] = boilScore(); note(bo.spills ? `Boiled with ${bo.spills} overflow${bo.spills > 1 ? 's' : ''}` : 'Boiled without an overflow'); }
    else if (stage === 3) { scores[3] = pourScore(); finish(); return; }
    stage++; stageT = 0;
    if (stage === 1) po.t0 = now;
  };
  const finish = () => {
    if (done) return;
    const s = score(), stars = starsFor(s), sc = liveScores();
    done = { score: s, max: 100, stars, headline: stars === 3 ? (W.win ?? 'Every cup poured clear') : stars ? (W.ok ?? 'A good round of cups') : (W.retry ?? 'Back to the pan'), detail: `Roast ${Math.round(25 * (sc[0] ?? 0))} of 25, pound ${Math.round(20 * (sc[1] ?? 0))} of 20, boil ${Math.round(25 * (sc[2] ?? 0))} of 25, pour ${Math.round(30 * (sc[3] ?? 0))} of 30` };
    snd.win(stars);
    if (geo) fx.emit('spark', geo.ox + 0.5 * geo.s, geo.oy + 0.4 * geo.s, { count: 14, color: '#ffd89a', size: 7, speed: 150, life: 0.9, gravity: 160 });
  };
  const tinyView = () => (env.ui?.buttonH?.(0) ?? 0) > 150;   // a live preview about 140 css px wide: one button only, so the work area never goes negative
  const items = () => {
    const all = items0();
    return tinyView() ? all.filter((i) => i.primary) : all;
  };
  const items0 = () => {
    if (stage === 0) return [{ id: 'check', kind: 'btn', label: 'Pull the pan', primary: true }];
    if (stage === 1) return [{ id: 'pound', kind: 'btn', label: 'Pound' }, { id: 'check', kind: 'btn', label: 'Done', primary: true }];
    if (stage === 2) return [{ id: 'fan', kind: 'btn', label: 'Fan' }, { id: 'aside', kind: 'btn', label: bo.aside ? 'Put back' : 'Set aside' }, { id: 'check', kind: 'btn', label: 'Done', primary: true }];
    return [{ id: 'check', kind: 'btn', label: 'Serve', primary: true }];
  };
  const control = (id) => {
    if (done) return;
    ro.started = true;
    if (id === 'check') endStage();
    else if (id === 'pound' && stage === 1) pound();
    else if (id === 'fan' && stage === 2) fan();
    else if (id === 'aside' && stage === 2) { bo.aside = !bo.aside; snd.aside(); }
  };

  // ---- roast -----------------------------------------------------------------------------------------------------------------------------
  const applyStir = (omega, dt) => {
    ro.E += (Math.abs(omega) - ro.E) * Math.min(1, dt * 6);
    const mix_ = clamp(ro.E / 5, 0, 1);
    for (let i = 0; i < NB; i++) {
      ro.th[i] += omega * 0.55 * dt;
      const tgt = Math.sqrt(hash(i, 7, Math.floor(now * 4))) * 0.9;
      ro.rho[i] += (tgt - ro.rho[i]) * mix_ * 3.6 * dt;
    }
    if (Math.abs(omega) > 0.8 && sndT.stir <= 0) { sndT.stir = 0.12; snd.stir(Math.min(1, ro.E / 6)); }
  };
  const roastTick = (dt) => {
    ro.E = Math.max(0, ro.E - dt * 0.5);
    if (ro.pullT >= 0 || !ro.started) return;   // the pan only goes on the fire when the cook first lays a hand on it (nothing sounds before the first touch)
    for (let i = 0; i < NB; i++) {
      const x = ro.rho[i] * Math.cos(ro.th[i]), y = ro.rho[i] * Math.sin(ro.th[i]), d2 = (x - ro.hx) * (x - ro.hx) + (y - ro.hy) * (y - ro.hy);
      const h = 0.45 + 0.7 * Math.exp(-d2 / 0.3);
      ro.r[i] = Math.min(1.05, ro.r[i] + 0.15 * h * dt * (ro.r[i] > 0.85 ? 0.5 : 1));
      if (!ro.cr[i] && ro.r[i] > 0.46) {
        ro.cr[i] = true; ro.cracks++;
        if (sndT.crack <= 0) { sndT.crack = 0.09; snd.crack(i); }
        if (geo) fx.emit('spark', geo.ox + (PAN.cx + ro.rho[i] * Math.cos(ro.th[i]) * FLOOR.rx) * geo.s, geo.oy + (PAN.cy + FLOOR.dy + ro.rho[i] * Math.sin(ro.th[i]) * FLOOR.ry - 0.03) * geo.s, { count: 2, color: '#f0d9a0', size: 3, speed: 60, life: 0.35, gravity: 300 });
      }
    }
    if (burntR() > 0.04 && sndT.smoke <= 0) { sndT.smoke = 1.2; snd.smoke(); }
  };

  // ---- pound -----------------------------------------------------------------------------------------------------------------------------
  const beatPeriod = () => 60 / po.bpm;
  const beatErr = () => { const bp = beatPeriod(), ph = (((now - po.t0) % bp) + bp) % bp; return Math.min(ph, bp - ph); };
  const pound = () => {
    if (done || stage !== 1 || stageT < 0.5 || po.fullT > 0) return;
    const e = beatErr(), q = e <= 0.075 ? 1 : e <= 0.15 ? 0.7 : e <= 0.24 ? 0.35 : 0;
    po.hits.push(q); po.count++; po.lastT = now; po.pulse = 1;
    if (q > 0) po.grind += q * 0.1; else po.scatter++;
    snd.pound(q, clamp(po.grind, 0, 1));
    if (geo) fx.emit(q > 0 ? 'dust' : 'chip', X(geo, 0.5), Y(geo, 0.5), { count: q > 0 ? 6 : 5, color: q > 0 ? '#6a3a1a' : '#4a2810', size: q > 0 ? 4 : 4.5, speed: q > 0 ? 50 : 150, life: 0.5, gravity: q > 0 ? -20 : 420, spread: q > 0 ? Math.PI * 2 : 1.6, angle: -Math.PI / 2 });
    if (po.grind >= 1 && !po.full) { po.full = true; po.fullT = 0.9; snd.full(); }
  };

  // ---- boil ------------------------------------------------------------------------------------------------------------------------------
  const fan = () => { if (done || stage !== 2) return; bo.c = Math.min(1, bo.c + 0.45); bo.fanT = now; snd.fan(); if (geo) fx.emit('spark', X(geo, 0.4), Y(geo, 0.62), { count: 6, color: '#ffb060', size: 4, speed: 80, life: 0.7, gravity: -60 }); };
  const boilTick = (dt) => {
    bo.t += dt; bo.asideK = clamp(bo.asideK + (bo.aside ? 1 : -1) * dt / 0.55, 0, 1); bo.spillK = Math.max(0, bo.spillK - dt * 0.8);
    if (bo.fi < bo.flares.length && bo.t >= bo.flares[bo.fi]) { bo.fi++; bo.c = Math.min(1, bo.c + 0.25); bo.flareT = now; snd.fan(); if (geo) fx.emit('spark', X(geo, 0.4), Y(geo, 0.6), { count: 8, color: '#ffb060', size: 4, speed: 100, life: 0.8, gravity: -50 }); note('The charcoal flares up'); }
    bo.c += (0.4 - bo.c) * 0.16 * dt;
    const heatIn = (1 - Math.min(1, bo.asideK * 1.6)) * bo.c;
    bo.T += (0.3 * heatIn * (1.15 - bo.T) - 0.03 * bo.T) * dt;
    const tgt = 1.3 * sm((bo.T - 0.35) / 0.75);
    bo.L += (tgt - bo.L) * (tgt > bo.L ? 1.2 : 1.6) * dt; bo.L = Math.max(0, bo.L);
    if (bo.ready) { bo.readyT -= dt; if (bo.readyT <= 0) endStage(); return; }
    if (bo.L > 1.0) bo.overT += dt; else bo.overT = Math.max(0, bo.overT - dt);
    if (bo.overT > 0.2) {
      bo.spills++; bo.lost += 0.08; bo.overT = 0; bo.spillK = 1.2; bo.L = 0.62; bo.T = Math.max(0.45, bo.T - 0.12); bo.c = Math.max(0.1, bo.c - 0.15); snd.spill();
      if (geo) { fx.emit('drop', X(geo, 0.4), Y(geo, 0.3), { count: 12, color: '#3a1d0c', size: 5, speed: 150, life: 0.8, gravity: 600, spread: Math.PI, angle: -Math.PI / 2 }); fx.emit('dust', X(geo, 0.4), Y(geo, 0.62), { count: 6, color: '#e8e0d4', size: 6, speed: 60, life: 0.8, gravity: -50 }); }
    }
    if (bo.L >= BAND[0] && bo.L <= BAND[1]) bo.hold += dt;
    if (bo.L > 0.35 && sndT.simmer <= 0) { sndT.simmer = 0.2 - 0.1 * clamp(bo.L, 0, 1); snd.simmer(bo.L); }
    if (bo.hold >= HOLD_NEED && !bo.ready) { bo.ready = true; bo.readyT = 0.9; snd.ready(); note('The coffee is ready'); }
  };

  // ---- pour ------------------------------------------------------------------------------------------------------------------------------
  const cupX = (i) => 0.5 + (i - (pr.n - 1) / 2) * SPACE;
  const pourTick = (dt) => {
    pr.sx += (pr.tx - pr.sx) * Math.min(1, dt * 14); pr.sv += (pr.tv - pr.sv) * Math.min(1, dt * 14);
    const vx = (pr.sx - pr.lastX) / dt, ax = (vx - pr.lastVx) / dt; pr.lastX = pr.sx; pr.lastVx = vx;
    pr.hist.push(pr.sx); if (pr.hist.length > 180) pr.hist.shift();
    const want = pr.down && pr.vol > 0.001 ? 1 : 0;
    pr.flowK = clamp(pr.flowK + (want ? 1 : -1) * dt / (want ? 0.22 : 0.12), 0, 1);
    const flowing = pr.flowK > 0.05;
    if (flowing && !pr.was && pr.started) pr.breaks++;
    if (flowing) pr.started = true;
    pr.was = flowing;
    for (const c of pr.cups) c.ripple = Math.max(0, c.ripple - dt * 1.4);
    pr.pourT += flowing ? dt : 0;
    const h = Math.max(0, CUP_V - 0.04 - pr.sv), ft = FT0 + FT1 * h, back = Math.min(pr.hist.length - 1, Math.round(ft / dt));
    pr.landX = pr.hist[pr.hist.length - 1 - back] ?? pr.sx;
    if (flowing) {
      const q = Q * pr.flowK, dv = Math.min(q * dt, pr.vol);
      pr.vol -= dv; pr.hSum += h * dt; pr.hT += dt;
      let ci = -1, bd = CUP_HALF; for (let i = 0; i < pr.n; i++) { const d = Math.abs(pr.landX - cupX(i)); if (d < bd) { bd = d; ci = i; } }
      if (ci < 0) pr.waste += dv; else { const c = pr.cups[ci]; c.fill += dv; c.ripple = 1; if (c.fill > 1.0) { pr.waste += c.fill - 1.0; c.fill = 1.0; } }
      if (pr.vol < RESERVE) pr.deep += (RESERVE - pr.vol) * dv * 3.2;
      pr.ci = ci;
      if (Math.abs(ax) > 6) { pr.shake += Math.min(0.02, (Math.abs(ax) - 6) * 0.0006); if (sndT.shake <= 0) { sndT.shake = 0.4; snd.shake(); } }
      if (sndT.stream <= 0) { sndT.stream = 0.1; snd.stream(ci >= 0 ? pr.cups[ci].fill : 0.3); }
      if (geo && Math.floor(now * 12) !== Math.floor((now - dt) * 12) && ci >= 0) fx.emit('drop', X(geo, cupX(ci)), Y(geo, CUP_V - 0.06), { count: 1, color: '#4a2810', size: 2.6, speed: 40, life: 0.3, gravity: 300, spread: 1.4 });
    } else pr.ci = -1;
  };

  // ---- the pointer -----------------------------------------------------------------------------------------------------------------------
  const toLocal = (x, y) => [(x - geo.ox) / geo.s, (y - geo.oy) / geo.s];
  const work = (p, dt) => {
    if (!geo || done || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    ptr = { x: p.x, y: p.y };
    const [u, v] = toLocal(p.x, p.y);
    if (p.pressed) ro.started = true;
    if (stage === 0 && ro.pullT < 0) {
      const nx = (u - PAN.cx) / FLOOR.rx, ny = (v - (PAN.cy + FLOOR.dy)) / FLOOR.ry, r2 = nx * nx + ny * ny;
      if (p.down && r2 < 1.5) {
        tip = { nx: clamp(nx, -1.1, 1.1), ny: clamp(ny, -1.1, 1.1) };
        const a = Math.atan2(ny, nx);
        if (ro.lastA != null && r2 > 0.04) { let d = a - ro.lastA; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; applyStir(clamp(d / Math.max(dt ?? 1 / 60, 1e-3), -9, 9), dt ?? 1 / 60); }
        ro.lastA = a;
      } else ro.lastA = null;
    } else if (stage === 1) { if (p.pressed && v > 0.1 && v < 0.78) pound(); }
    else if (stage === 3) {
      pr.down = p.down;
      if (p.down) { pr.tx = clamp(u, 0.1, 0.9); pr.tv = clamp(v, 0.1, CUP_V - 0.07); }
    }
  };

  const tick = (dt) => {
    now += dt; stageT += dt; msgT = Math.max(0, msgT - dt);
    for (const k of Object.keys(sndT)) sndT[k] -= dt;
    po.pulse = Math.max(0, po.pulse - dt * 4);
    if (stage === 0) roastTick(dt);
    else if (stage === 1) { if (po.fullT > 0) { po.fullT -= dt; if (po.fullT <= 0) endStage(); } }
    else if (stage === 2) boilTick(dt);
    else if (stage === 3) pourTick(dt);
  };

  // ---- Watch and learn ---------------------------------------------------------------------------------------------------------------------
  const attract = (dt) => {
    if (done) return;
    ro.started = true;
    if (auto.wait > 0) { auto.wait -= dt; return; }
    if (stage === 0) {
      if (stageT < 0.6) return;
      auto.phase += 7 * dt; const a = auto.phase; tip = { nx: 0.62 * Math.cos(a), ny: 0.62 * Math.sin(a) }; applyStir(7, dt);
      if (meanR() >= ro.target - 0.015 && ro.pullT < 0) { endStage(); auto.wait = 0.9; auto.phase = 0; }
    } else if (stage === 1) {
      if (po.full || stageT < 0.7) return;
      const bp = beatPeriod(), ph = (((now - po.t0) % bp) + bp) % bp;
      if (ph < dt * 1.2 || ph > bp - dt * 0.6) { if (now - po.lastT > bp * 0.6) pound(); }
    } else if (stage === 2) {
      if (bo.ready) return;
      if (stageT < 0.5) return;
      if (bo.aside) { if (bo.L < 0.66) { bo.aside = false; snd.aside(); } }
      else if (bo.L > 0.86) { bo.aside = true; snd.aside(); }
      else if (bo.L < 0.25 && bo.fanT < 0 && stageT > 1.0) fan();
    } else if (stage === 3) {
      if (stageT < 0.6) return;
      const allOk = pr.cups.every((c) => c.fill >= FILL_T - 0.03);
      if (allOk || pr.vol <= RESERVE + 0.01) { pr.down = false; if (pr.flowK < 0.05) { auto.wait = 0.5; endStage(); } return; }
      // one slow sweep along the row and back: the stream lands behind the spout, so the spout leads the landing point
      const spd = 0.2, h = CUP_V - 0.04 - 0.3, ft = FT0 + FT1 * h, l0 = cupX(0) - CUP_HALF * 0.95, l1 = cupX(pr.n - 1) + CUP_HALF * 0.95;
      if (auto.land == null) { auto.land = l0; auto.dir = 1; }
      if (!pr.started && Math.abs(pr.sx - (l0 + spd * ft)) > 0.006) { pr.down = false; pr.tx = l0 + spd * ft; pr.tv = 0.3; return; }
      // the spout runs ahead of the landing point by the fall time, and turns round that long before the stream reaches the end of the row
      auto.land += auto.dir * spd * dt;
      if (auto.land >= l1) { auto.land = l1; auto.dir = -1; } else if (auto.land <= l0) { auto.land = l0; auto.dir = 1; }
      let ahead = auto.land + auto.dir * spd * ft; if (ahead > l1) ahead = 2 * l1 - ahead; else if (ahead < l0) ahead = 2 * l0 - ahead;
      pr.down = true; pr.tv = 0.3; pr.tx = ahead;
    }
  };

  // ---- drawing ---------------------------------------------------------------------------------------------------------------------------
  const chips = (ctx, g, V) => {
    // step tabs: text never under 11 css px (g.px floors it); one line when the four fit across the stage, else number over name
    const fs = g.px(14), gap = Math.max(4, V.s * 0.012);
    ctx.save(); ctx.font = `800 ${fs}px system-ui, sans-serif`;
    const tw = NAMES.map((n, i) => ctx.measureText(`${i + 1} ${n}`).width + fs * 1.4), one = Math.max(...tw) * 4 + gap * 3 <= V.s * 0.98;
    ctx.restore();
    const nw = Math.max(...NAMES.map((n) => { ctx.save(); ctx.font = `800 ${fs}px system-ui, sans-serif`; const m = ctx.measureText(n).width; ctx.restore(); return m; })) + fs * 1.2;
    const w = one ? Math.max(...tw) : Math.max(nw, fs * 2.6), h = one ? fs * 1.9 : fs * 3.1, tot = w * 4 + gap * 3, x0 = V.ox + V.s * 0.5 - tot / 2, y0 = Y(V, 0.0) + 2;
    for (let i = 0; i < 4; i++) {
      const x = x0 + i * (w + gap), cur = i === stage && !done, dn = scores[i] != null || i < stage || done, col = cur ? '#2a1608' : '#f6e8cc';
      ctx.save(); rrect(ctx, x, y0, w, h, Math.min(h / 2, fs)); ctx.fillStyle = cur ? 'rgba(240,190,110,0.92)' : dn ? 'rgba(90,150,90,0.78)' : 'rgba(14,9,6,0.55)'; ctx.fill(); ctx.strokeStyle = cur ? '#fff2cc' : 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5; ctx.stroke();
      if (one) g.label(ctx, `${i + 1} ${NAMES[i]}`, x + w / 2, y0 + h / 2 + 1, fs, col, 'center', '800');
      else { g.label(ctx, `${i + 1}`, x + w / 2, y0 + h * 0.3, fs, col, 'center', '800'); g.label(ctx, NAMES[i], x + w / 2, y0 + h * 0.72, fs, col, 'center', '800'); }
      ctx.restore();
    }
  };
  const gaugeFrame = (ctx, V) => {
    const s = V.s, gx = X(V, 0.94), gy0 = Y(V, 0.1), gy1 = Y(V, 0.52), gw = s * 0.034, gh = gy1 - gy0;
    shadowed(ctx, () => { rrect(ctx, gx - gw * 0.9, gy0 - 12, gw * 1.8, gh + 24, gw * 0.9); ctx.fillStyle = '#3a2410'; ctx.fill(); }, { blur: 8, dy: 4, a: 0.5 });
    return { gx, gy0, gy1, gw, gh };
  };

  const drawSpatula = (ctx, x, y, s, k) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(0.9 + Math.sin(now * 9) * 0.04 * k);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(4, 10, s * 0.3, 7);
    ctx.fillStyle = lg(ctx, 0, -6, 0, 6, [[0, '#d8dde2'], [0.5, '#8a9097'], [1, '#4a4e54']]); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 0.04, -s * 0.026); ctx.lineTo(s * 0.12, -s * 0.026); ctx.lineTo(s * 0.12, s * 0.026); ctx.lineTo(s * 0.04, s * 0.026); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.stroke();
    ctx.strokeStyle = lg(ctx, 0, -4, 0, 4, [[0, '#a8743a'], [1, '#4a2a10']]); ctx.lineWidth = s * 0.016; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * 0.12, 0); ctx.lineTo(s * 0.4, 0); ctx.stroke();
    ctx.restore();
  };

  const drawRoast = (ctx, g, V, t) => {
    const s = V.s, pk = ro.pullT >= 0 ? clamp((now - ro.pullT) / 0.7, 0, 1) : 0, slide = sm(pk), cx = PAN.cx, cy = PAN.cy;
    const heatK = 1 - pk * 0.6;
    // the brazier: a clay stove with a mouth full of charcoal
    const sx = X(V, PAN.cx), sy = Y(V, 0.74);
    groundShadow(ctx, sx, sy + 4, s * 0.25, s * 0.05, 0.55);
    ctx.fillStyle = cyl(ctx, sx - s * 0.2, sx + s * 0.2, '#a8573a', { hl: 0.3, spec: 0.3, bounce: '#ff9a4a' });
    ctx.beginPath(); ctx.moveTo(sx - s * 0.2, sy); ctx.bezierCurveTo(sx - s * 0.22, sy - s * 0.1, sx - s * 0.17, sy - s * 0.17, sx - s * 0.18, sy - s * 0.2); ctx.lineTo(sx + s * 0.18, sy - s * 0.2); ctx.bezierCurveTo(sx + s * 0.17, sy - s * 0.17, sx + s * 0.22, sy - s * 0.1, sx + s * 0.2, sy); ctx.ellipse(sx, sy, s * 0.2, s * 0.03, 0, 0, Math.PI); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(40,12,4,0.6)'; ctx.lineWidth = 1.6; ctx.stroke();
    const door = () => { ctx.beginPath(); ctx.moveTo(sx - s * 0.07, sy - s * 0.01); ctx.lineTo(sx - s * 0.07, sy - s * 0.1); ctx.quadraticCurveTo(sx, sy - s * 0.16, sx + s * 0.07, sy - s * 0.1); ctx.lineTo(sx + s * 0.07, sy - s * 0.01); ctx.closePath(); };
    door(); ctx.fillStyle = '#1a0c06'; ctx.fill();
    ctx.save(); door(); ctx.clip(); embers(ctx, sx - s * 0.07, sy - s * 0.12, s * 0.14, s * 0.11, t, 0.9 * heatK, 21, 26); glow(ctx, sx, sy - s * 0.05, s * 0.1, '255,110,30', 0.6 * heatK); ctx.restore();
    for (let q = 0; q < 6; q++) { ctx.fillStyle = 'rgba(20,6,2,0.7)'; ctx.beginPath(); ctx.arc(sx - s * 0.16 + q * s * 0.064, sy - s * 0.19, 2.4, 0, TAU); ctx.fill(); }
    glow(ctx, sx, sy - s * 0.2, s * 0.32, '255,120,40', 0.3 * heatK);
    // the pan (it slides off the coals when pulled)
    ctx.save(); ctx.translate(s * slide * 0.3, s * slide * 0.1);
    const pxm = X(V, cx), pym = Y(V, cy), rxp = PAN.rx * s, ryp = PAN.ry * s;
    ctx.save(); ctx.lineCap = 'round'; const hx0 = pxm + rxp * 0.82, hy0 = pym + ryp * 0.7, hx1 = pxm + s * 0.66, hy1 = pym + s * 0.28;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = s * 0.03; ctx.beginPath(); ctx.moveTo(hx0 + 3, hy0 + 8); ctx.lineTo(hx1 + 3, hy1 + 8); ctx.stroke();
    ctx.strokeStyle = lg(ctx, hx0, hy0, hx1, hy1, [[0, '#8a9097'], [0.45, '#3a3e44'], [1, '#2a2c30']]); ctx.lineWidth = s * 0.024; ctx.beginPath(); ctx.moveTo(hx0, hy0); ctx.lineTo(hx0 + (hx1 - hx0) * 0.55, hy0 + (hy1 - hy0) * 0.55); ctx.stroke();
    ctx.strokeStyle = lg(ctx, 0, hy0, 0, hy1, [[0, '#8a5a30'], [1, '#3a2210']]); ctx.lineWidth = s * 0.034; ctx.beginPath(); ctx.moveTo(hx0 + (hx1 - hx0) * 0.5, hy0 + (hy1 - hy0) * 0.5); ctx.lineTo(hx1, hy1); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,225,170,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx0 + (hx1 - hx0) * 0.55, hy0 + (hy1 - hy0) * 0.55 - 4); ctx.lineTo(hx1, hy1 - 5); ctx.stroke(); ctx.restore();
    ctx.fillStyle = lg(ctx, pxm - rxp, 0, pxm + rxp, 0, [[0, '#23262a'], [0.25, '#5c6168'], [0.4, '#8a9097'], [0.6, '#4a4e54'], [1, '#1c1e22']]);
    ctx.beginPath(); ctx.ellipse(pxm, pym, rxp, ryp, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(pxm, pym + s * 0.012, rxp * 0.97, ryp * 0.94, 0, 0, TAU); ctx.fillStyle = lg(ctx, 0, pym - ryp, 0, pym + ryp, [[0, '#3a3e44'], [0.5, '#1c1e22'], [1, '#34383e']]); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.ellipse(pxm, pym, rxp, ryp, 0, Math.PI * 1.05, Math.PI * 1.7); ctx.stroke();
    ctx.fillStyle = lg(ctx, pxm - rxp, 0, pxm + rxp, 0, [[0, '#101214'], [0.5, '#2a2c30'], [1, '#101214']]); ctx.beginPath(); ctx.ellipse(pxm, pym + s * FLOOR.dy, FLOOR.rx * s, FLOOR.ry * s, 0, 0, TAU); ctx.fill();
    glow(ctx, pxm + ro.hx * FLOOR.rx * s, pym + s * FLOOR.dy + ro.hy * FLOOR.ry * s, s * 0.17, '255,110,40', 0.34 * heatK + 0.05 * Math.sin(t * 3));
    const order = ro.r.map((_, i) => i).sort((a, b) => Math.sin(ro.th[a]) * ro.rho[a] - Math.sin(ro.th[b]) * ro.rho[b]);
    for (const i of order) {
      const bx = pxm + ro.rho[i] * Math.cos(ro.th[i]) * FLOOR.rx * s, by = pym + s * FLOOR.dy + ro.rho[i] * Math.sin(ro.th[i]) * FLOOR.ry * s;
      bean(ctx, bx, by, s * (0.036 + 0.005 * hash(i, 4)), hash(i, 5) * TAU + ro.th[i] * 0.3, ro.r[i], hash(i, 8));
    }
    ctx.restore();
    const m = meanR(), br = burntR();
    steam(ctx, pxm + s * slide * 0.3 - s * 0.05, pym - s * 0.04 + s * slide * 0.1, s * 0.2, s * 0.34, t, clamp((m - 0.25) * 1.6, 0, 0.9) * (1 - pk * 0.5), { seed: 2, n: 10, col: br > 0.04 ? '120,120,120' : '240,235,225' });
    steam(ctx, pxm - s * 0.2, pym - s * 0.02, s * 0.12, s * 0.28, t + 1.3, clamp(br * 8, 0, 0.9), { seed: 6, n: 6, col: '90,90,90' });
    if (ro.pullT < 0) { const tx = pxm + tip.nx * FLOOR.rx * s, ty = pym + s * FLOOR.dy + tip.ny * FLOOR.ry * s; drawSpatula(ctx, tx, ty, s, Math.min(1, ro.E / 4)); }
    const { gx, gy0, gy1, gw, gh } = gaugeFrame(ctx, V);
    const gg = ctx.createLinearGradient(0, gy1, 0, gy0); [0, 0.14, 0.28, 0.42, 0.58, 0.74, 0.88, 1].forEach((o) => gg.addColorStop(o, roastColor(o))); ctx.fillStyle = gg; rrect(ctx, gx - gw * 0.5, gy0, gw, gh, gw * 0.5); ctx.fill();
    const yb0 = gy1 - gh * (ro.target + 0.07), yb1 = gy1 - gh * (ro.target - 0.07); ctx.fillStyle = 'rgba(120,255,190,0.22)'; ctx.fillRect(gx - gw * 0.5, yb0, gw, yb1 - yb0); ctx.strokeStyle = 'rgba(140,255,200,0.95)'; ctx.lineWidth = 2; ctx.strokeRect(gx - gw * 0.5, yb0, gw, yb1 - yb0);
    const ym = gy1 - gh * clamp(m, 0, 1); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx - gw * 0.5 - 2, ym); ctx.lineTo(gx - gw * 0.5 - 12, ym - 6); ctx.lineTo(gx - gw * 0.5 - 12, ym + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    g.label(ctx, 'ROAST', gx, gy1 + 22, g.px(15), '#f6e4b4', 'center', '700');
  };

  const drawMortar = (ctx, g, V, t) => {
    const s = V.s, mx = X(V, 0.5), my = Y(V, 0.745), h = s * 0.36;
    wovenDisc(ctx, mx, my - 2, s * 0.32, s * 0.055, t);
    groundShadow(ctx, mx, my + 4, s * 0.2, s * 0.04, 0.55);
    const body = () => { ctx.beginPath(); ctx.moveTo(mx - s * 0.13, my); ctx.bezierCurveTo(mx - s * 0.14, my - h * 0.2, mx - s * 0.09, my - h * 0.4, mx - s * 0.095, my - h * 0.55); ctx.bezierCurveTo(mx - s * 0.1, my - h * 0.75, mx - s * 0.15, my - h * 0.85, mx - s * 0.15, my - h); ctx.lineTo(mx + s * 0.15, my - h); ctx.bezierCurveTo(mx + s * 0.15, my - h * 0.85, mx + s * 0.1, my - h * 0.75, mx + s * 0.095, my - h * 0.55); ctx.bezierCurveTo(mx + s * 0.09, my - h * 0.4, mx + s * 0.14, my - h * 0.2, mx + s * 0.13, my); ctx.ellipse(mx, my, s * 0.13, s * 0.03, 0, 0, Math.PI); ctx.closePath(); };
    body(); ctx.fillStyle = cyl(ctx, mx - s * 0.155, mx + s * 0.155, '#6e3d1c', { hl: 0.3, spec: 0.38, bounce: '#ff9a4a' }); ctx.fill();
    ctx.save(); body(); ctx.clip(); ctx.strokeStyle = 'rgba(30,12,2,0.3)'; ctx.lineWidth = 1.2;
    for (let q = 0; q < 26; q++) { const x = mx - s * 0.15 + s * 0.3 * hash(q, 1); ctx.beginPath(); ctx.moveTo(x, my - h); ctx.bezierCurveTo(x + 6, my - h * 0.7, x - 6, my - h * 0.3, x + 2, my); ctx.stroke(); }
    for (const yy of [0.22, 0.5, 0.86]) { const brx = yy < 0.5 ? s * 0.125 : yy < 0.8 ? s * 0.098 : s * 0.15; ctx.strokeStyle = 'rgba(25,10,2,0.65)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(mx, my - h * yy, brx, s * 0.026, 0, 0.05, Math.PI - 0.05); ctx.stroke(); ctx.strokeStyle = 'rgba(255,210,150,0.25)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(mx, my - h * yy + 3, brx, s * 0.026, 0, 0.05, Math.PI - 0.05); ctx.stroke(); }
    ctx.restore(); ctx.strokeStyle = 'rgba(30,12,2,0.7)'; ctx.lineWidth = 1.8; body(); ctx.stroke();
    const mouthY = my - h, mrx = s * 0.15, mry = s * 0.038, F0 = clamp(po.grind, 0, 1);
    ctx.fillStyle = lg(ctx, mx - mrx, 0, mx + mrx, 0, [[0, '#7a4a28'], [0.4, '#b8844a'], [1, '#5a3418']]); ctx.beginPath(); ctx.ellipse(mx, mouthY, mrx, mry, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a0c06'; ctx.beginPath(); ctx.ellipse(mx, mouthY + 1, mrx * 0.88, mry * 0.8, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(mx, mouthY + 1, mrx * 0.88, mry * 0.8, 0, 0, TAU); ctx.clip();
    const nB = Math.round(lerp(14, 3, F0));
    ctx.fillStyle = lg(ctx, 0, mouthY - mry, 0, mouthY + mry, [[0, tint('#3e2010', 0.1 + 0.2 * F0)], [1, '#24120a']]); ctx.fillRect(mx - mrx, mouthY - mry, mrx * 2, mry * 2);
    for (let i = 0; i < nB; i++) bean(ctx, mx + (hash(i, 31) - 0.5) * mrx * 1.4, mouthY + (hash(i, 32) - 0.5) * mry * 1.1, s * lerp(0.032, 0.012, F0), hash(i, 33) * TAU, 0.72, hash(i, 34));
    if (F0 > 0.15) { ctx.fillStyle = `rgba(66,36,18,${0.25 + 0.55 * F0})`; for (let i = 0; i < 60 * F0; i++) { ctx.beginPath(); ctx.arc(mx + (hash(i, 41) - 0.5) * mrx * 1.7, mouthY + (hash(i, 42) - 0.5) * mry * 1.5, 1.2 + hash(i, 43) * 1.6, 0, TAU); ctx.fill(); } }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,225,170,0.4)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(mx, mouthY, mrx, mry, 0, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke();
    // the beat ring closes on the mouth of the mortar at each beat
    const bp = beatPeriod(), ph = (((now - po.t0) % bp) + bp) % bp, ringK = 1 - ph / bp;
    if (stageT > 0.3 && po.fullT <= 0) {
      const rr = lerp(1, 2.1, ringK);
      ctx.save(); ctx.strokeStyle = `rgba(255,226,150,${0.2 + 0.7 * (1 - ringK)})`; ctx.lineWidth = 2 + 3 * (1 - ringK); ctx.beginPath(); ctx.ellipse(mx, mouthY, mrx * rr, mry * rr, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(120,255,190,0.55)'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.ellipse(mx, mouthY, mrx * 1.08, mry * 1.08, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
    }
    // the pestle: a heavy wooden club, thicker at the foot, dropping on the beat
    const since = now - po.lastT, lift = since < 0.07 ? (1 - since / 0.07) * 0.2 : sm(Math.min(1, (since - 0.07) / 0.22)) * 0.2;
    const py = mouthY - lift * s * 1.0 - s * 0.03 - 0.03 * s, pw = s * 0.03;
    ctx.save(); ctx.translate(mx, py);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-pw * 0.8 + 5, -s * 0.55 + 4, pw * 1.7, s * 0.55);
    ctx.fillStyle = cyl(ctx, -pw * 1.4, pw * 1.4, '#9a6a3a', { hl: 0.3, spec: 0.45 }); rrect(ctx, -pw * 0.9, -s * 0.55, pw * 1.8, s * 0.42, pw * 0.5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-pw * 0.9, -s * 0.14); ctx.bezierCurveTo(-pw * 1.9, -s * 0.12, -pw * 2.1, -s * 0.02, -pw * 1.6, s * 0.0); ctx.lineTo(pw * 1.6, s * 0.0); ctx.bezierCurveTo(pw * 2.1, -s * 0.02, pw * 1.9, -s * 0.12, pw * 0.9, -s * 0.14); ctx.closePath(); ctx.fillStyle = cyl(ctx, -pw * 2.1, pw * 2.1, '#8a5a2e', { hl: 0.3, spec: 0.4 }); ctx.fill();
    ctx.strokeStyle = 'rgba(30,12,2,0.6)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.strokeStyle = 'rgba(30,12,2,0.5)'; ctx.lineWidth = 2; for (const yy of [-0.46, -0.4, -0.3]) { ctx.beginPath(); ctx.moveTo(-pw * 0.9, s * yy); ctx.lineTo(pw * 0.9, s * yy); ctx.stroke(); }
    ctx.restore();
    steam(ctx, mx + s * 0.1, mouthY - s * 0.02, s * 0.06, s * 0.2, t, clamp(F0 * 0.6, 0, 0.5) + 0.05, { seed: 4, n: 5 });
    const { gx, gy0, gy1, gw, gh } = gaugeFrame(ctx, V);
    ctx.fillStyle = '#0e0905'; rrect(ctx, gx - gw * 0.5, gy0, gw, gh, gw * 0.5); ctx.fill();
    const gg = ctx.createLinearGradient(0, gy1, 0, gy0); gg.addColorStop(0, '#4a2810'); gg.addColorStop(1, '#c89a5a'); ctx.fillStyle = gg; rrect(ctx, gx - gw * 0.4, gy1 - gh * F0, gw * 0.8, gh * F0, gw * 0.35); ctx.fill();
    g.label(ctx, 'FINE', gx, gy1 + 22, g.px(15), '#f6e4b4', 'center', '700');
    for (let i = 0; i < 6; i++) { const q = po.hits[po.hits.length - 1 - i]; if (q == null) break; ctx.fillStyle = q >= 1 ? '#7bffb4' : q >= 0.6 ? '#ffd36a' : q > 0 ? '#ff9a4a' : '#ff5a3a'; ctx.beginPath(); ctx.arc(X(V, 0.06) + i * s * 0.034, Y(V, 0.09), s * 0.012, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.stroke(); }
  };

  const standAndCoals = (ctx, V, t, c) => {
    const s = V.s, sx = X(V, 0.4), sy = Y(V, 0.735);
    groundShadow(ctx, sx, sy + 3, s * 0.2, s * 0.04, 0.55);
    ctx.fillStyle = cyl(ctx, sx - s * 0.17, sx + s * 0.17, '#8a4a30', { hl: 0.3, spec: 0.3, bounce: '#ff9a4a' });
    ctx.beginPath(); ctx.moveTo(sx - s * 0.15, sy); ctx.bezierCurveTo(sx - s * 0.17, sy - s * 0.04, sx - s * 0.12, sy - s * 0.08, sx - s * 0.13, sy - s * 0.13); ctx.lineTo(sx - s * 0.17, sy - s * 0.15); ctx.lineTo(sx + s * 0.17, sy - s * 0.15); ctx.lineTo(sx + s * 0.13, sy - s * 0.13); ctx.bezierCurveTo(sx + s * 0.12, sy - s * 0.08, sx + s * 0.17, sy - s * 0.04, sx + s * 0.15, sy); ctx.ellipse(sx, sy, s * 0.15, s * 0.026, 0, 0, Math.PI); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(40,12,4,0.6)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = '#1a0c06'; ell(ctx, sx, sy - s * 0.15, s * 0.17, s * 0.034); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(sx, sy - s * 0.15, s * 0.16, s * 0.03, 0, 0, TAU); ctx.clip(); embers(ctx, sx - s * 0.16, sy - s * 0.18, s * 0.32, s * 0.06, t, 0.6 + 0.4 * c, 51, 40); ctx.restore();
    glow(ctx, sx, sy - s * 0.17, s * 0.2, '255,120,40', 0.2 + 0.4 * c);
    for (let q = 0; q < 6; q++) { ctx.fillStyle = 'rgba(20,6,2,0.8)'; ctx.beginPath(); ctx.arc(sx - s * 0.1 + q * s * 0.04, sy - s * 0.07, 2.6, 0, TAU); ctx.fill(); }
  };
  const fanDraw = (ctx, s) => {
    ctx.fillStyle = '#d9b878'; ctx.beginPath(); ctx.arc(0, 0, s, Math.PI * 1.1, Math.PI * 1.9); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#7a5a2a'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.strokeStyle = 'rgba(120,80,30,0.6)'; ctx.lineWidth = 1; for (let q = 0; q < 8; q++) { const a = Math.PI * (1.18 + 0.64 * (q / 7)); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s); ctx.stroke(); }
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = s * 0.08; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, s * 0.5); ctx.stroke();
  };
  const drawBoil = (ctx, g, V, t) => {
    const s = V.s, ak = sm(bo.asideK);
    wovenDisc(ctx, X(V, 0.8), Y(V, 0.72), s * 0.17, s * 0.04, t);
    standAndCoals(ctx, V, t, bo.c * (1 - ak * 0.4));
    const x = lerp(0.4, 0.8, ak), y = lerp(0.585, 0.685, ak) - Math.sin(ak * Math.PI) * 0.1;
    groundShadow(ctx, X(V, x), Y(V, lerp(0.6, 0.7, ak)), s * 0.12, s * 0.03, 0.5);
    if (bo.fanT > now - 0.6 && bo.fanT >= 0) { const k = (now - bo.fanT) / 0.6; ctx.save(); ctx.translate(X(V, 0.4), Y(V, 0.6)); ctx.rotate(Math.sin(k * 16) * 0.4); ctx.globalAlpha = 1 - k * 0.5; fanDraw(ctx, s * 0.14); ctx.restore(); }
    jebena(ctx, V, { x, y, t, L: bo.L, heat: (1 - ak) * clamp(bo.c, 0, 1), spillK: bo.spillK });
    steam(ctx, X(V, x - 0.2), Y(V, y - 0.27), s * 0.06, s * 0.3, t, clamp((bo.T - 0.4) * 1.6, 0, 1), { seed: 9, n: 8 });
    steam(ctx, X(V, x), Y(V, y - 0.4), s * 0.05, s * 0.3, t + 0.5, clamp((bo.L - 0.5) * 1.5, 0, 1), { seed: 10, n: 6 });
    const n = 8, cx = X(V, 0.06), cy = Y(V, 0.1);
    for (let i = 0; i < n; i++) { const on = bo.hold >= ((i + 1) * HOLD_NEED) / n, part = !on && bo.hold > (i * HOLD_NEED) / n; bean(ctx, cx + i * s * 0.036, cy, s * 0.03, -0.4, on ? 0.7 : part ? 0.4 : 0, 0); if (!on && !part) { ctx.fillStyle = 'rgba(14,9,6,0.55)'; ctx.beginPath(); ctx.ellipse(cx + i * s * 0.036, cy, s * 0.017, s * 0.012, -0.4, 0, TAU); ctx.fill(); } }
  };

  const drawPour = (ctx, g, V, t) => {
    const s = V.s, ty = Y(V, 0.745), stx = X(V, 0.5), stw = s * 0.4;
    groundShadow(ctx, stx, ty + s * 0.05, stw * 0.9, s * 0.05, 0.55);
    ctx.fillStyle = lg(ctx, stx - stw, 0, stx + stw, 0, [[0, '#6a4020'], [0.3, '#b88a50'], [0.7, '#9a6a34'], [1, '#4a2a10']]); rrect(ctx, stx - stw * 0.9, ty, stw * 1.8, s * 0.05, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(40,20,6,0.5)'; ctx.lineWidth = 1.5; for (let q = 0; q < 22; q++) { const x = stx - stw * 0.88 + (q / 21) * stw * 1.76; ctx.beginPath(); ctx.moveTo(x, ty + 2); ctx.lineTo(x + 3, ty + s * 0.05 - 2); ctx.stroke(); }
    wovenDisc(ctx, stx, ty, stw * 0.98, s * 0.065, t);
    for (let i = 0; i < pr.n; i++) {
      const c = pr.cups[i]; sini(ctx, X(V, cupX(i)), Y(V, CUP_V + 0.03), s * 0.15, c.fill, clamp(pr.shake * 2 + pr.deep * 2, 0, 1) * (c.fill > 0.05 ? 1 : 0), t, { ripple: c.ripple, hl: pr.ci === i, c: i % 2 ? '#f4efe4' : '#efe6d0', band: i % 2 ? '#2a6a4a' : '#b8321f' });
      if (c.fill > 0.05) steam(ctx, X(V, cupX(i)), Y(V, CUP_V - 0.1), s * 0.04, s * 0.14, t + i, 0.5, { seed: 20 + i, n: 4 });
    }
    const tiltA = 0.2 + 0.5 * pr.flowK, spx = pr.sx, spv = pr.sv, h = Math.max(0, CUP_V - 0.04 - spv), ft = FT0 + FT1 * h;
    if (pr.flowK > 0.04) {
      const K = 14, pts = [];
      for (let j = 0; j <= K; j++) { const f = j / K, idx = Math.min(pr.hist.length - 1, Math.round((ft * f) / (1 / 60))), hx = pr.hist[pr.hist.length - 1 - idx] ?? spx; pts.push([X(V, hx), Y(V, spv + 0.012 + (CUP_V - 0.04 - spv) * Math.pow(f, 1.5))]); }
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const pass = (w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); };
      pass(s * (0.006 + 0.01 * pr.flowK), '#1e0e06'); pass(s * (0.0036 + 0.006 * pr.flowK), '#5a3418'); pass(s * 0.0014, 'rgba(255,225,180,0.8)');
      ctx.restore();
      if (pr.ci < 0) { const lp = pts[pts.length - 1]; ctx.fillStyle = 'rgba(30,14,6,0.7)'; ell(ctx, lp[0], lp[1] + 6, s * 0.03, s * 0.01); ctx.fill(); }
    }
    jebena(ctx, V, { x: spx + 0.21 * 0.8, y: spv + 0.262 * 0.8, t, tilt: tiltA, L: 0, heat: 0, plug: false, sc: 0.8 });
    ctx.save(); ctx.strokeStyle = 'rgba(120,230,255,0.35)'; ctx.lineWidth = 1.4; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(X(V, 0.08), Y(V, CUP_V - 0.04 - 0.22)); ctx.lineTo(X(V, 0.92), Y(V, CUP_V - 0.04 - 0.22)); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    g.label(ctx, 'HEIGHT', X(V, 0.065), Y(V, CUP_V - 0.04 - 0.22) - 10, g.px(13), 'rgba(160,240,255,0.75)', 'center', '700');
    const { gx, gy0, gy1, gw, gh } = gaugeFrame(ctx, V), fv = clamp(pr.vol / (pr.n * FILL_T + RESERVE), 0, 1), rv = RESERVE / (pr.n * FILL_T + RESERVE);
    ctx.fillStyle = '#0e0905'; rrect(ctx, gx - gw * 0.5, gy0, gw, gh, gw * 0.5); ctx.fill();
    const gg = ctx.createLinearGradient(0, gy1, 0, gy0); gg.addColorStop(0, '#2a1408'); gg.addColorStop(1, '#8a5a2a'); ctx.fillStyle = gg; rrect(ctx, gx - gw * 0.4, gy1 - gh * fv, gw * 0.8, gh * fv, gw * 0.35); ctx.fill();
    ctx.fillStyle = 'rgba(255,90,60,0.35)'; ctx.fillRect(gx - gw * 0.5, gy1 - gh * rv, gw, gh * rv); ctx.strokeStyle = '#ff6a4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx - gw * 0.7, gy1 - gh * rv); ctx.lineTo(gx + gw * 0.7, gy1 - gh * rv); ctx.stroke();
    g.label(ctx, 'POT', gx, gy1 + 22, g.px(15), '#f6e4b4', 'center', '700');
  };

  const scene = (ctx, g, V, t) => {
    const fade = clamp(stageT / 0.5, 0, 1);
    ctx.save(); ctx.globalAlpha = 0.25 + 0.75 * fade;
    if (stage === 0) drawRoast(ctx, g, V, t); else if (stage === 1) drawMortar(ctx, g, V, t); else if (stage === 2) drawBoil(ctx, g, V, t); else drawPour(ctx, g, V, t);
    ctx.restore();
    chips(ctx, g, V);
  };
  const draw = (g, Rt) => {
    const { ctx } = g, W0 = Rt.work, Wk = { x: W0.x, y: W0.y + 38, w: W0.w, h: W0.h - 40 };
    const s = Math.min(Wk.h / SH, Wk.w / SW), V = { ox: Wk.x + (Wk.w - s * SW) / 2, oy: Wk.y + (Wk.h - s * SH) / 2, s };
    geo = { ox: V.ox, oy: V.oy, s };
    ctx.save(); ctx.beginPath(); ctx.rect(W0.x, W0.y, W0.w, W0.h + 10); ctx.clip();
    scene(ctx, g, V, now);
    ctx.restore();
    dockGauge(g, ctx, W0, { dot: stage === 0 ? roastColor(meanR()) : stage === 1 ? '#8a5a2a' : stage === 2 ? '#d7a468' : '#4a2810', fill: (x, y, wd, ht) => {
      const gr = ctx.createLinearGradient(x, 0, x + wd, 0); gr.addColorStop(0, '#3a2a22'); gr.addColorStop(1, '#c89a5a'); ctx.fillStyle = gr; ctx.globalAlpha = 0.5; rrect(ctx, x + 1, y + 1, wd - 2, ht - 2, 4); ctx.fill(); ctx.globalAlpha = 1;
      const f = stage === 0 ? clamp(meanR(), 0, 1) : stage === 1 ? clamp(po.grind, 0, 1) : stage === 2 ? clamp(bo.hold / HOLD_NEED, 0, 1) : clamp(1 - pr.vol / (pr.n * FILL_T + RESERVE), 0, 1);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2; const mx = x + wd * f; ctx.beginPath(); ctx.moveTo(mx, y + ht + 2); ctx.lineTo(mx - 5, y + ht + 10); ctx.lineTo(mx + 5, y + ht + 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    } });
    hintPill(g, ctx, W0, hint());
    const th = Rt.thumb, cx = th.x + th.w / 2, cy = th.y + th.h * 0.74, cs = Math.min(th.w, th.h) * 0.3;
    ctx.save(); ctx.beginPath(); ctx.rect(th.x, th.y, th.w, th.h); ctx.clip();
    glow(ctx, cx, th.y + th.h * 0.4, th.w * 0.6, '255,190,110', 0.2);
    wovenDisc(ctx, cx, cy + cs * 0.1, th.w * 0.46, th.h * 0.09, now);
    const Vt = { ox: th.x, oy: th.y + th.h * 0.1, s: th.w * 1.3 };
    jebena(ctx, Vt, { x: 0.2, y: 0.52, t: now, L: 0.3, heat: 0, tilt: 0 });
    for (let i = 0; i < 3; i++) { const sx = cx + (i + 0.35) * cs * 1.05; sini(ctx, sx, cy, cs, 0.92, 0, now, { c: '#f4efe4', band: i % 2 ? '#2a6a4a' : '#b8321f' }); steam(ctx, sx, cy - cs * 0.5, cs * 0.1, cs * 0.5, now + i, 0.6, { seed: 30 + i, n: 4 }); }
    ctx.restore();
  };
  const titleArt = (g, S, t) => {
    const { ctx } = g, s = Math.min(S.w / SW, S.h / SH) * 0.98, V = { ox: S.x + (S.w - s * SW) / 2, oy: S.y + (S.h - s * SH) / 2, s };
    const sb = { ...bo }, ss = stage; bo.L = 0.8; bo.T = 0.8; bo.c = 0.5; bo.asideK = 0; stage = 2;
    drawBoil(ctx, g, V, t ?? 0);
    stage = ss; Object.assign(bo, sb);
  };

  const hint = () => {
    if (done) return '';
    if (msgT > 0 && msg) return msg;
    if (stage === 0) return !ro.started ? 'Roast: press in the pan and drag round and round to turn the beans, so none sits on the hot place.' : meanR() < 0.1 ? 'Stir: drag round and round in the pan to turn the beans over, so none sits on the hot place.' : meanR() > ro.target - 0.06 ? 'Nearly the colour of the green band: pull the pan.' : 'Keep stirring: the hot place glows. Pull the pan when the colour reaches the green band.';
    if (stage === 1) return po.hits.length < 2 ? 'Pound: tap as the ring meets the mouth of the mortar.' : 'Stay with the beat. Off the beat the beans jump out.';
    if (stage === 2) return bo.L > 0.92 ? 'It is rising too high: set it aside!' : bo.L < 0.2 ? 'Let the pot heat: the brew will rise in the neck.' : bo.L < BAND[0] ? 'Rising: watch the window in the neck.' : 'In the green band: hold it there.';
    return !pr.started ? 'Pour: press and hold, then sweep slowly along the cups, high above them.' : pr.vol <= RESERVE + 0.02 ? 'Stop: the rest is grounds. Serve.' : 'Keep the stream unbroken and move smoothly; bring the low cups up.';
  };
  const r3 = (v) => Math.round(v * 1000) / 1000;
  const state = () => ({ technique: 'brew', mode: 'jebena', stage, scores: scores.map((v) => (v == null ? null : r3(v))),
    roast: { mean: r3(meanR()), std: r3(stdR()), burnt: r3(burntR()), target: r3(ro.target), E: r3(ro.E), cracks: ro.cracks, pulled: ro.pullT >= 0 },
    pound: { bpm: po.bpm, grind: r3(po.grind), hits: po.hits.length, avgQ: r3(avgQ()), scatter: po.scatter, beat: r3((((now - po.t0) % beatPeriod()) + beatPeriod()) % beatPeriod() / beatPeriod()) },
    boil: { c: r3(bo.c), aside: bo.aside, T: r3(bo.T), L: r3(bo.L), hold: r3(bo.hold), spills: bo.spills },
    pour: { n: pr.n, vol: r3(pr.vol), cups: pr.cups.map((c) => r3(c.fill)), waste: r3(pr.waste), shake: r3(pr.shake), deep: r3(pr.deep), breaks: pr.breaks, sx: r3(pr.sx), sv: r3(pr.sv), flow: r3(pr.flowK), land: r3(pr.landX), ci: pr.ci } });

  init();
  return {
    init, items, control, work, tick, draw, attract, titleArt, result: () => done, score: totalScore, hint, compact: true,
    info: () => [stage === 0 ? `Roast ${Math.round(100 * clamp(meanR(), 0, 1))} percent` : stage === 1 ? `Ground ${Math.round(100 * clamp(po.grind, 0, 1))} percent` : stage === 2 ? `Held ${bo.hold.toFixed(1)} of ${HOLD_NEED} s` : `${pr.n} cups`, `Step ${stage + 1} of 4: ${NAMES[stage]}`],
    get caption() { return SC.words?.caption ?? 'Make this coffee'; },
    rules: () => [
      'Four steps in a row. Press the lit button to finish a step; the score of each step is kept.',
      'Roast: drag in circles in the pan to turn the beans over. The glowing place is hottest: beans left on it go dark first. The gauge shows the average colour; pull the pan when it reaches the green band, with the beans an even colour and none charred.',
      'Pound: tap as the ring closes on the mouth of the mortar. A hit on the beat grinds; a hit off the beat makes the beans jump out. Fineness fills as you go.',
      'Boil: Fan brightens the charcoal, Set aside takes the pot off it. The brew rises in the window of the neck: keep it in the green band for the time shown, and never past the red mark, or it overflows. Clay holds heat for a while after you set it aside.',
      'Pour: press and hold, sweep slowly along the row of cups, keeping the spout high above them and the stream unbroken. The stream lands behind the spout. Bring every cup to the same level; stop before the grounds at the bottom, and keep the movement smooth so they stay down.',
      'Score: roast 25, pound 20, boil 25, pour 30. Nothing done scores nothing.',
    ],
    point(id) {
      if (!geo) return null;
      const P2 = (u, v) => ({ x: geo.ox + u * geo.s, y: geo.oy + v * geo.s });
      const [k, rest] = id.split(':');
      if (k === 'stir') { const a = Number(rest); return P2(PAN.cx + 0.62 * Math.cos(a) * FLOOR.rx, PAN.cy + FLOOR.dy + 0.62 * Math.sin(a) * FLOOR.ry); }
      if (k === 'mortar') return P2(0.5, 0.5);
      if (k === 'spout') { const [u, v] = rest.split(',').map(Number); return P2(u, v); }
      if (k === 'cup') return P2(cupX(Number(rest)), CUP_V);
      return null;
    },
    state,
  };
}

// shape-craft `pour` mode `gongfu` (1.26.0 Kitchen Crafts): oolong brewed in a small clay pot, a calm game of precision and timing.
// A rinse and three infusions. Each: (1) pour hot water in a slow circle round the leaves (press and circle your finger round the pot: even coverage,
// stop at the brim), (2) steep: a short bar shows the sweet spot, which moves later with each infusion; press and hold to start pouring at the right
// moment, (3) pour the whole pot out in one pass into the fairness pitcher (hold until the last drops), (4) hold the pitcher and sweep it back and
// forth over the cups so every cup gets the same, the last drops going to the lowest cups. The rinse is poured away on the tray.
// Score = steep timing (35), cups equal and full (35), even circle and brim (15), the pot emptied in one clean pass (10), a dry tray (5). Nothing done scores 0.
import { starsFor, hash } from './geom.js';
import { rrect, ease } from './fx.js';
import { hintPill, dockGauge } from './paint-ui.js';
import { createPourSound } from './pour-sound.js';
import { safeCtx, tinyArea, drawStream, wisp, roomBackdrop, clamp, lerp, sm, teaColors, glassOf } from './pour-art.js';
import { sleeveHand, clayPot, clayLid, kettle, pitcher, porcelainCup, POTSPOUT, POTGRIP, POTMOUTH, PITCHER, CUP } from './pour-pot.js';
import { createStream } from './pour-stream.js';
import { lg, rg, ell, TAU } from './props.js';

const SW = 1, SH = 0.93, GRAV = 7, H = 1 / 120;
const POT = { x: 0.62, y: 0.79, k: 1.0 }, PITCH = { x: 0.26, y: 0.79, k: 1.15 }, CUPK = 1.25, CUPY = 0.9, KET = { k: 0.88 };
const KREST = { x: 0.74, y: 0.47 }, SIDES = 8, RING = 0.056, LINE = 0.7;
const WIN = [[1.8, 4.2], [3.4, 5.8], [4.8, 7.4], [6.4, 9.2], [8.2, 11.4]];   // sweet window (s of steeping) for the rinse, then each infusion: it moves later
const STEEP_MAX = 14, FILL_S = 3.0, POUT_S = 3.2, DRIP_V = 0.045;
const LIPP = { x: -0.0773, y: -0.1545 };                                       // the pitcher's lip relative to its base centre, per design unit of scale
const rgba2 = (c) => c;
const sectorOf = (a) => Math.floor((((a % TAU) + TAU) % TAU) / TAU * SIDES) % SIDES;
const angDiff = (a, b) => ((((b - a + Math.PI) % TAU) + TAU) % TAU) - Math.PI;

export function createGongfu(P, env) {
  const { rng, fx } = env, SC = P.scene ?? {};
  const log = env.options?.soundLog, snd = createPourSound(env.audio, log, 'gongfu');
  const R = clamp(Math.round(P.infusions ?? 3), 1, 4), NC = clamp(Math.round(P.cups ?? 4), 3, 5), withRinse = P.rinse !== false;
  const rounds = (withRinse ? 1 : 0) + R, CF = NC * LINE * 1.22;                  // CF: cup level units that one full pot of tea makes (a fifth more than the cups need: some always reaches the tray between them)
  const cupX = (i) => 0.45 + (i - (NC - 1) / 2) * 0.118;
  const isRinse = () => withRinse && r === 0;
  let r, phase, t, acc, geo, done, holding, latch, ptr, off, auto, lastSnd, steamT, endWait, overT;
  let potOver = 'pitcher', aside = 0, spillBank = 0, potL, potV, open, secT, spillW, steepT, win, rec, theta, thetaT, kOn, kTilt, slide, tilt, idleT, releases, tea;
  let pitchV, pitchX, pitchVx, pitchTilt, pitchSlide, cupsL, cupSpill, cupOver, drip, serveT, puddles;
  const K = createStream(GRAV), PT = createStream(GRAV), CS = createStream(GRAV);   // kettle -> pot, pot -> pitcher or tray, pitcher -> cups

  const init = () => {
    spillBank = 0; aside = 0; slide = 0; tilt = 0; pitchSlide = 0; pitchTilt = 0; pitchX = PITCH.x; potOver = 'pitcher'; r = 0; done = null; holding = false; latch = false; ptr = null; off = 0; open = 0; puddles = []; lastSnd = -1; steamT = 0;
    win = Array.from({ length: rounds }, (_, i) => { const w = WIN[i + (withRinse ? 0 : 1)], j = (rng.next() - 0.5) * 0.7; return [w[0] + j, w[1] + j]; });
    rec = Array.from({ length: rounds }, () => ({ pour: null, steep: null, out: null, cups: null }));
    auto = { wait: 0.8, th: 0, cup: -1 }; t = 0; acc = 0;
    newRound(); K.clear(); PT.clear(); CS.clear();
  };
  const newRound = () => {
    if (typeof spillW === 'number') spillBank += spillW + cupOver;
    phase = 'water'; potL = 0; potV = 0; secT = new Array(SIDES).fill(0); spillW = 0; steepT = 0; theta = 0; thetaT = 0; kOn = 0; kTilt = 0; idleT = 0; releases = 0; overT = 0; endWait = 0;
    pitchV = 0; pitchVx = 0; cupsL = new Array(NC).fill(0); cupSpill = 0; cupOver = 0; drip = 0; serveT = 0; tea = 0.5; holding = false; latch = false;
    if (r > 0 || !withRinse) open = Math.min(1, open);
  };
  const win_ = () => win[r], rec_ = () => rec[r];
  const potBase = () => ({ x: lerp(POT.x, 0.83, ease(aside)), y: lerp(POT.y, 0.755, ease(aside)) });   // the pot is set aside to the back while the pitcher works over the cups
  const potMouth = () => { const b = potBase(); return { x: b.x + POTMOUTH.x * POT.k, y: b.y + POTMOUTH.y * POT.k }; };

  // ---- poses: where the vessels are, from the state ---------------------------------------------------------------------------------------------
  const potPose = () => { // the clay pot slides from its place over the pitcher (or over the tray for the rinse) and tips about the lip of its spout
    const u = POT.k, B = potBase(), d = { x: (POTSPOUT.x - POTGRIP.x) * u, y: (POTSPOUT.y - POTGRIP.y) * u }, restTip = { x: B.x + POTSPOUT.x * u, y: B.y + POTSPOUT.y * u };
    const over = potOver === 'tray' ? { x: 0.42, y: 0.52 } : { x: PITCH.x + 0.02, y: 0.47 }, s = ease(slide), tip = { x: lerp(restTip.x, over.x, s), y: lerp(restTip.y, over.y, s) };
    const a = tilt * 0.8, c = Math.cos(a), sn = Math.sin(a);
    return { px: tip.x - (d.x * c + d.y * sn), py: tip.y - (-d.x * sn + d.y * c), a, tip, u };
  };
  const pitcherPose = () => {
    const k = PITCH.k, lipRest = { x: PITCH.x + LIPP.x * k, y: PITCH.y + LIPP.y * k }, s = ease(pitchSlide), lip = { x: lerp(lipRest.x, pitchX, s), y: lerp(lipRest.y, 0.64, s) }, a = pitchTilt * 0.62;
    const lx = LIPP.x * k, ly = LIPP.y * k, c = Math.cos(a), sn = Math.sin(a);
    return { bx: lip.x - (lx * c + ly * sn), by: lip.y - (-lx * sn + ly * c), a, lip, k };
  };
  const kettlePose = () => { const m = potMouth(), e = ease(kOn), rt = { x: m.x + RING * Math.cos(theta), y: m.y - 0.14 + RING * 0.22 * Math.sin(theta) }; return { tip: { x: lerp(KREST.x, rt.x, e), y: lerp(KREST.y, rt.y, e) }, tilt: kTilt * 0.42 }; };

  const addPuddle = (x, y, v) => { const p = puddles.find((q) => Math.abs(q.x - x) < 0.03 && Math.abs(q.y - y) < 0.02); if (p) p.v = Math.min(1.6, p.v + v); else if (puddles.length < 20) puddles.push({ x, y, v: Math.min(1.2, v), k: hash(puddles.length + Math.floor(t * 10), 4) }); };
  const splash = (x, y, n = 2) => { if (geo && hash(Math.floor(t * 240), 1) > 0.72) fx.emit('drop', geo.ox + x * geo.s, geo.oy + y * geo.s, { count: n, color: '#d9a640', size: 2.3, speed: 75, life: 0.4, gravity: 700, spread: 1.6, angle: -Math.PI / 2 }); };

  // ---- the physics --------------------------------------------------------------------------------------------------------------------------
  const step = (h) => {
    t += h;
    for (const p of puddles) p.v = Math.max(0, p.v - h * 0.02); puddles = puddles.filter((p) => p.v > 0.004);
    kOn += ((phase === 'water' ? 1 : 0) - kOn) * Math.min(1, h * 3.5);
    aside += (((phase === 'cups' || phase === 'serve') ? 1 : 0) - aside) * Math.min(1, h * 3);
    // ---- 1 the circle pour
    if (phase === 'water') {
      theta += clamp(angDiff(theta, thetaT), -9 * h, 9 * h);
      if (holding && potL >= 0.999) { overT += h; if (overT > 1.0) holding = false; }       // the pot is full: the kettle is put down after a second of running over
      const flowing = holding && kOn > 0.8; kTilt += ((flowing ? 1 : 0) - kTilt) * Math.min(1, h * 6);
      if (flowing && kTilt > 0.5) { const kp = kettlePose(); K.emit({ x: kp.tip.x, y: kp.tip.y, vx: 0, vy: 0.15, vol: h / FILL_S, q: 1, tag: sectorOf(theta) }); }
      K.step(h, (s) => {
        const m = potMouth(); if (s.y < m.y + 0.004) return false;
        const add = Math.min(s.vol, Math.max(0, 1 - potL)); potL += add; secT[s.tag] += add;
        if (s.vol - add > 1e-9) { spillW += s.vol - add; addPuddle(m.x + (hash(Math.floor(t * 60), 3) - 0.5) * 0.22, POT.y + 0.035, s.vol - add); splash(m.x + 0.06, m.y, 2); }
        return true;
      });
      if (!holding && K.size() === 0 && potL >= 0.97) endWait += h; else endWait = 0;
      if (endWait > 0.5) finishWater();
    }
    // ---- 2 steeping
    if (phase === 'steep') {
      const t0 = steepT; steepT = Math.min(STEEP_MAX, steepT + h); open = Math.min(1, open + h * 0.05);
      const w = win_(); if (t0 < w[0] && steepT >= w[0]) snd.ding(1100);
      if (Math.floor(t0) !== Math.floor(steepT)) snd.mode();
      if ((holding || latch) && steepT > 0.35) startOut();
      latch = false;
    }
    // ---- 3 pouring the pot out in one pass
    const out = phase === 'out';
    slide += ((out ? 1 : 0) - slide) * Math.min(1, h * 5);
    if (out) {
      tilt += ((holding ? 1 : 0) - tilt) * Math.min(1, h * (holding ? 1.6 : 3)); if (!holding && potV > 0.001) idleT += h;
      const pp = potPose(); let q = 0, dripNow = false;
      if (potV > DRIP_V) q = (1 / POUT_S) * sm((tilt - 0.35) / 0.65); else if (potV > 0.0008 && tilt > 0.85) { drip += h; if (drip > 0.36) { drip = 0; dripNow = true; } }
      if (q > 0) { const vol = Math.min(potV, q * h); potV -= vol; PT.emit({ x: pp.tip.x, y: pp.tip.y, vx: -0.22, vy: 0.1, vol, q: clamp(q * POUT_S, 0.3, 1) }); }
      else if (dripNow) { const vol = Math.min(potV, 0.011); potV -= vol; PT.emit({ x: pp.tip.x, y: pp.tip.y, vx: -0.12, vy: 0.05, vol, q: 0.3 }); snd.drop(0.35 + 0.5 * pitchV, Math.floor(t * 7)); }
      potL = potV;
      const rimY = PITCH.y - PITCHER.H * PITCH.k;
      PT.step(h, (s, y0) => {
        if (isRinse()) { if (s.y >= 0.8) { addPuddle(s.x, 0.8, 0.05 * s.vol * 30); splash(s.x, 0.8, 2); return true; } return false; }
        if (y0 < rimY && s.y >= rimY) { if (Math.abs(s.x - PITCH.x) < PITCHER.wr * PITCH.k * 0.8) s.into = true; else { spillW += s.vol; addPuddle(s.x, 0.82, s.vol * 6); splash(s.x, 0.8, 2); return true; } }
        if (s.into && s.y >= PITCH.y - PITCHER.H * PITCH.k * (0.1 + 0.8 * clamp(pitchV, 0, 0.95))) { pitchV += s.vol; return true; }
        return false;
      });
      if (potV <= 0.0008 && PT.size() === 0 && tilt > 0.4) endOut();
    } else tilt += (0 - tilt) * Math.min(1, h * 4);
    // ---- 4 the cups
    pitchSlide += (((phase === 'cups') ? 1 : 0) - pitchSlide) * Math.min(1, h * (phase === 'cups' ? 5 : 3));
    if (phase === 'cups') {
      const px0 = pitchX; if (ptr && holding) pitchX += (clamp(ptr.x + off, 0.14, 0.78) - pitchX) * Math.min(1, h * 12); pitchVx += ((pitchX - px0) / h - pitchVx) * Math.min(1, h * 14);
      pitchTilt += ((holding && pitchV > 0 ? 1 : 0) - pitchTilt) * Math.min(1, h * (holding ? 2.4 : 4));
      const pp = pitcherPose(), QC = 1 / 4.6; let q = 0, dripNow = false;
      if (pitchV > DRIP_V) q = QC * sm((pitchTilt - 0.5) / 0.5); else if (pitchV > 0.0008 && pitchTilt > 0.85) { drip += h; if (drip > 0.4) { drip = 0; dripNow = true; } }
      if (q > 0) { const vol = Math.min(pitchV, q * h); pitchV -= vol; CS.emit({ x: pp.lip.x, y: pp.lip.y, vx: -0.18 + pitchVx * 0.7, vy: 0.08, vol: vol * CF, q: clamp(q / QC, 0.3, 1) }); }
      else if (dripNow) { const vol = Math.min(pitchV, 0.011); pitchV -= vol; CS.emit({ x: pp.lip.x, y: pp.lip.y, vx: -0.08 + pitchVx * 0.7, vy: 0.04, vol: vol * CF, q: 0.3 }); snd.drop(0.3 + 0.6 * Math.min(...cupsL), Math.floor(t * 9)); }
      const rimY = CUPY - CUP.H * CUPK;
      CS.step(h, (s, y0) => {
        if (y0 < rimY && s.y >= rimY) {
          let hit = -1; for (let i = 0; i < NC; i++) if (Math.abs(s.x - cupX(i)) < CUP.wr * CUPK * 1.02) hit = i;
          if (hit < 0) { cupSpill += s.vol; addPuddle(s.x, CUPY - 0.005, s.vol * 2); splash(s.x, CUPY, 2); return true; }
          s.into = hit;
        }
        if (s.into !== undefined && s.y >= CUPY - CUP.H * CUPK * (0.1 + 0.8 * clamp(cupsL[s.into], 0, 1))) {
          cupsL[s.into] += s.vol; if (cupsL[s.into] > 1) { cupOver += cupsL[s.into] - 1; addPuddle(cupX(s.into), CUPY, (cupsL[s.into] - 1) * 2); cupsL[s.into] = 1; }
          return true;
        }
        return false;
      });
      if (pitchV <= 0.0008 && CS.size() === 0 && (pitchTilt > 0.3 || (!holding && pitchSlide > 0.9))) endCups();
    } else pitchTilt += (0 - pitchTilt) * Math.min(1, h * 4);
    if (phase === 'serve') { serveT += h; if (serveT > 1.3) nextRound(); }
  };

  // ---- phase changes -----------------------------------------------------------------------------------------------------------------------
  const finishWater = () => {
    const tot = secT.reduce((a, b) => a + b, 0) || 1, tvd = secT.reduce((a, b) => a + Math.abs(b / tot - 1 / SIDES), 0) / 2;
    const even = clamp(1 - (tvd / (1 - 1 / SIDES)) * 1.15, 0, 1), fill = Math.pow(clamp(potL / 0.96, 0, 1), 3), dry = clamp(1 - spillW / 0.2, 0, 1);
    rec_().pour = { even, fill, dry, score: 0.6 * even + 0.25 * fill + 0.15 * dry };
    holding = false; kTilt = 0; potV = potL; phase = 'steep'; steepT = 0; endWait = 0; snd.set();
  };
  const startOut = () => {
    const w = win_(), e = steepT < w[0] ? w[0] - steepT : steepT > w[1] ? steepT - w[1] : 0, k = (steepT < w[0] ? 1.7 : 2.6) + (isRinse() ? 1 : 0);   // too short is better forgiven than too long
    rec_().steep = { t: steepT, err: e, score: clamp(1 - e / k, 0, 1) };
    tea = clamp(0.4 + (steepT - (w[0] + w[1]) / 2) * 0.09, 0.08, 0.95); potOver = isRinse() ? 'tray' : 'pitcher'; phase = 'out'; potV = potL; idleT = 0; releases = 0; drip = 0; snd.lift();
  };
  const endOut = () => {
    rec_().out = { score: clamp(1 - idleT / 2.4 - releases * 0.12, 0, 1) };
    PT.clear(); holding = false;
    if (isRinse()) { nextRound(); snd.set(); return; }
    phase = 'cups'; pitchX = PITCH.x + LIPP.x * PITCH.k; drip = 0; snd.lift();
  };
  const endCups = () => {
    const mean = cupsL.reduce((a, b) => a + b, 0) / NC, sp = Math.max(...cupsL) - Math.min(...cupsL);
    const even = clamp(1 - Math.max(0, sp - 0.04) / 0.3, 0, 1), fill = clamp(1 - Math.max(0, LINE * 0.9 - mean) / 0.25, 0, 1) * clamp(Math.min(...cupsL) / (LINE * 0.7), 0, 1) * clamp(1 - Math.max(0, mean - LINE * 1.2) / 0.2, 0, 1), dry = clamp(1 - cupOver / 0.12 - cupSpill / 1.2, 0, 1);
    rec_().cups = { even, fill, dry, spread: sp, score: 0.55 * even + 0.25 * fill + 0.2 * dry };
    holding = false; phase = 'serve'; serveT = 0; snd.clink(3200, 0.3); snd.clink(2700, 0.25);
    if (geo) for (let i = 0; i < NC; i++) fx.emit('spark', geo.ox + cupX(i) * geo.s, geo.oy + (CUPY - 0.07) * geo.s, { count: 3, color: '#ffe9a0', size: 5, speed: 60, life: 0.8, gravity: 80 });
  };
  const nextRound = () => { if (r >= rounds - 1) { finish(); return; } r++; newRound(); };

  // ---- score --------------------------------------------------------------------------------------------------------------------------------
  const parts = () => {
    const avg = (arr, f) => arr.reduce((s, x) => s + f(x), 0) / Math.max(1, arr.length), inf = rec.slice(withRinse ? 1 : 0);
    const steep = avg(rec, (x) => x.steep?.score ?? 0), cups = avg(inf, (x) => x.cups?.score ?? 0), pour = avg(rec, (x) => x.pour?.score ?? 0), out = avg(rec, (x) => x.out?.score ?? 0);
    const dry = rec.some((x) => x.pour) ? clamp(1 - (spillTotal() / 0.6), 0, 1) : 0;
    return { steep, cups, pour, out, dry };
  };
  const spillTotal = () => spillBank + spillW + cupOver;
  const score = () => { const p = parts(); return clamp(100 * (0.35 * p.steep + 0.35 * p.cups + 0.15 * p.pour + 0.1 * p.out + 0.05 * p.dry), 0, 100); };
  const total = () => (done ? done.score : Math.round(score()));
  const finish = () => {
    if (done) return;
    const s = Math.round(score()), stars = starsFor(s), p = parts(), W = SC.words ?? {};
    done = { score: s, max: 100, stars, headline: stars === 3 ? (W.win ?? 'Cups of even strength') : stars ? (W.ok ?? 'A good brew') : (W.retry ?? 'Brew again'),
      detail: `Steeping ${Math.round(p.steep * 100)}%, cups ${Math.round(p.cups * 100)}%, circle pour ${Math.round(p.pour * 100)}%, one clean pour ${Math.round(p.out * 100)}%` };
    snd.win(stars);
  };
  const advance = (dt) => { acc += dt; let n = 0; while (acc >= H && n < 60) { if (!done) step(H); acc -= H; n++; } if (n >= 60) acc = 0; };
  const tick = (dt) => {
    advance(dt);
    // stream sounds: a chunk every 110 ms, the pitch following the fill of the vessel that is being filled
    if (t - lastSnd > 0.11) {
      if (K.size() > 0 && kTilt > 0.4) { lastSnd = t; snd.thin(0.7, potL * 0.9); }
      else if (PT.size() > 0 && tilt > 0.4) { lastSnd = t; if (potV > DRIP_V) snd.thin(0.9, clamp(pitchV, 0, 1) * 0.8 + 0.1); }
      else if (CS.size() > 0 && pitchTilt > 0.4) { lastSnd = t; const i = CS.list()[CS.size() - 1]?.into; snd.thin(0.8, i !== undefined ? cupsL[i] : 0.3, (cupX(Math.max(0, i ?? 0)) - 0.45) * 1.4); }
    }
    steamT += dt;
    if (steamT > 0.3 && geo) { steamT = 0; const m = potMouth(); if (potL > 0.05 && (phase === 'water' || phase === 'steep')) fx.emit('dust', geo.ox + (m.x + (hash(Math.floor(t * 3), 5) - 0.5) * 0.06) * geo.s, geo.oy + (m.y - 0.02) * geo.s, { count: 1, color: '#ffffff', size: 7, speed: 10, life: 1.8, gravity: -22, spread: 0.7 }); if (phase === 'steep' && geo) { const tp = potPose(); fx.emit('dust', geo.ox + tp.tip.x * geo.s, geo.oy + (tp.tip.y - 0.01) * geo.s, { count: 2, color: '#ffffff', size: 8, speed: 14, life: 2.0, gravity: -26, spread: 0.6 }); }
 if (pitchV > 0.1 && phase !== 'water') fx.emit('dust', geo.ox + (PITCH.x + (hash(Math.floor(t * 3), 6) - 0.5) * 0.03) * geo.s, geo.oy + (PITCH.y - 0.17) * geo.s, { count: 1, color: '#ffffff', size: 6, speed: 10, life: 1.6, gravity: -22, spread: 0.7 }); }
  };

  // ---- input ---------------------------------------------------------------------------------------------------------------------------------
  const toLocal = (x, y) => [(x - geo.ox) / geo.s, (y - geo.oy) / geo.s];
  const aimTheta = (x, y) => { const m = potMouth(); thetaT = Math.atan2(y - m.y, x - m.x); };
  const onDown = (p) => { const [x, y] = toLocal(p.x, p.y); ptr = { x, y }; holding = true; latch = true; if (phase === 'water') aimTheta(x, y); if (phase === 'cups') off = pitchX - x; };
  const onMove = (p) => { const [x, y] = toLocal(p.x, p.y); ptr = { x, y }; if (phase === 'water') aimTheta(x, y); };
  const onUp = () => { if (phase === 'out' && holding && potV > 0.002) releases++; holding = false; };
  const work = (p) => { if (!geo || done) return; if (p.pressed) onDown(p); else if (p.down && holding) onMove(p); if (p.released && holding) onUp(); };
  const items = () => [{ id: 'done', kind: 'btn', label: 'Finish', primary: true }];
  const control = (id) => { if (done) return; if (id === 'done') { holding = false; finish(); } };

  // tea still falling toward cup i
  const airOf = (i) => { let v = 0; const rimY = CUPY - CUP.H * CUPK; for (const q of CS.list()) { if (q.into === i) { v += q.vol; continue; } if (q.into !== undefined || q.y >= rimY) continue; const T = (-q.vy + Math.sqrt(q.vy * q.vy + 2 * GRAV * (rimY - q.y))) / GRAV; if (Math.abs(q.x + q.vx * T - cupX(i)) < CUP.wr * CUPK * 1.02) v += q.vol; } return v; };
  // ---- the host for Watch and learn: a slow even circle, a patient wait for the sweet spot, one unbroken pour, a sweep to the lowest cup --------------------
  const attract = (dt) => {
    if (done) return;
    advance(dt * 0.8);                                    // the demonstration runs 1.8 times as fast as real time
    const a = auto; if (a.wait > 0) { a.wait -= dt; return; }
    if (phase === 'water') {
      if (!holding && potL < 0.9 && K.size() === 0) { holding = true; ptr = { x: 0, y: 0 }; a.th = theta; }
      if (holding) { a.th += (2 * TAU / FILL_S) * dt * 1.8 * 0.98; thetaT = a.th; if (potL >= 0.985) { holding = false; a.wait = 0.15; } }
    } else if (phase === 'steep') {
      const w = win_(); if (!holding && steepT >= (w[0] + w[1]) / 2 - 0.2) holding = true;
    } else if (phase === 'out') {
      holding = potV > 0.0008 || PT.size() > 0;
    } else if (phase === 'cups') {
      if (pitchSlide < 0.95) return;
      if (pitchV <= 0.0008) { holding = holding && CS.size() > 0; return; }
      if (!holding) { holding = true; ptr = { x: pitchX, y: 0 }; off = 0; }
      if (pitchV > 0.13) {   // sweep slowly back and forth along the cups, at an even speed
        const x0 = cupX(0) + 0.045 - 0.01, x1 = cupX(NC - 1) + 0.045 + 0.01;
        if (a.sx === undefined) { a.sx = x0; a.dir = 1; }
        a.sx += a.dir * 0.34 * dt * 1.8; if (a.sx > x1) { a.sx = x1; a.dir = -1; } if (a.sx < x0) { a.sx = x0; a.dir = 1; }
        ptr = { x: a.sx, y: 0 }; a.cup = -1;
      } else {   // the last drops go to the lowest cups
        const eff = cupsL.map((l, i) => l + airOf(i)); let lo = 0; for (let i = 1; i < NC; i++) if (eff[i] < eff[lo] - 1e-6) lo = i;
        if (a.cup < 0 || eff[a.cup] > eff[lo] + 0.02) a.cup = lo;
        ptr = { x: cupX(a.cup) + 0.045 - pitchVx * 0.15, y: 0 };
      }
    } else holding = false;
  };

  // ---- drawing --------------------------------------------------------------------------------------------------------------------------------
  const X = (V, x) => V.ox + x * V.s, Y = (V, y) => V.oy + y * V.s;
  const trayQ = (V, u, v) => [X(V, lerp(lerp(0.12, 0.02, v), lerp(0.8, 0.88, v), u)), Y(V, lerp(0.64, 0.95, v))];
  const tray = (ctx, V) => {
    const P4 = [[0.1, 0.62], [0.82, 0.62], [0.9, 0.97], [0.0, 0.97]].map(([x, y]) => [X(V, x), Y(V, y)]);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.moveTo(X(V, 0.04), Y(V, 0.99)); ctx.lineTo(X(V, 0.9), Y(V, 0.99)); ctx.lineTo(X(V, 0.84), Y(V, 1.03)); ctx.lineTo(X(V, 0.1), Y(V, 1.03)); ctx.fill();
    ctx.save(); ctx.beginPath(); P4.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fillStyle = lg(ctx, 0, Y(V, 0.62), 0, Y(V, 0.97), [[0, '#5a3a1c'], [1, '#3a2410']]); ctx.fill(); ctx.clip();
    const slats = 18;
    for (let k = 0; k < slats; k++) {
      const u0 = k / slats, u1 = (k + 0.86) / slats;
      ctx.beginPath(); ctx.moveTo(...trayQ(V, u0, 0)); ctx.lineTo(...trayQ(V, u1, 0)); ctx.lineTo(...trayQ(V, u1, 1)); ctx.lineTo(...trayQ(V, u0, 1)); ctx.closePath();
      ctx.fillStyle = lg(ctx, trayQ(V, u0, 0)[0], 0, trayQ(V, u1, 0)[0], 0, [[0, '#e2c27c'], [0.5, '#c8a458'], [1, '#8a6a30']]); ctx.fill();
      ctx.strokeStyle = 'rgba(255,240,190,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...trayQ(V, u0 + 0.004, 0)); ctx.lineTo(...trayQ(V, u0 + 0.004, 1)); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(90,60,20,0.35)'; ctx.lineWidth = 2; for (const v of [0.3, 0.62, 0.86]) for (let k = 0; k < slats; k += 2) { const a = trayQ(V, (k + 0.1 + hash(k, Math.round(v * 9)) * 0.5) / slats, v), b = trayQ(V, (k + 0.8) / slats, v); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
    ctx.fillStyle = lg(ctx, 0, Y(V, 0.62), 0, Y(V, 0.97), [[0, 'rgba(0,0,0,0.3)'], [0.4, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.25)']]); ctx.fillRect(X(V, 0), Y(V, 0.6), V.s, V.s * 0.4);
    ctx.restore();
    for (const p of puddles) { const w = (0.016 + Math.sqrt(p.v) * 0.05) * V.s; ctx.fillStyle = `rgba(60,28,6,${clamp(p.v * 3, 0, 0.55)})`; ell(ctx, X(V, p.x), Y(V, p.y), w, w * 0.28); ctx.fill(); ctx.fillStyle = 'rgba(255,230,170,0.4)'; ell(ctx, X(V, p.x) - w * 0.2, Y(V, p.y) - 1, w * 0.4, w * 0.07); ctx.fill(); }
    ctx.strokeStyle = '#2a1608'; ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.beginPath(); P4.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.stroke();
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = 'rgba(255,220,160,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...P4[3]); ctx.lineTo(...P4[2]); ctx.stroke();
  };
  const stove = (ctx, V, glow) => {
    const x = X(V, 0.915), y = Y(V, 0.69), w = 0.15 * V.s;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, x, y + w * 0.62, w * 0.62, w * 0.12); ctx.fill();
    ctx.fillStyle = lg(ctx, x - w / 2, 0, x + w / 2, 0, [[0, '#4a2a1a'], [0.4, '#a86a44'], [1, '#3a2012']]); ctx.beginPath(); ctx.moveTo(x - w * 0.5, y - w * 0.22); ctx.lineTo(x + w * 0.5, y - w * 0.22); ctx.lineTo(x + w * 0.4, y + w * 0.55); ctx.lineTo(x - w * 0.4, y + w * 0.55); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2a1408'; ell(ctx, x, y - w * 0.22, w * 0.5, w * 0.12); ctx.fill(); ctx.fillStyle = rg(ctx, x, y - w * 0.22, 1, w * 0.5, [[0, `rgba(255,190,80,${0.9 * glow})`], [0.6, `rgba(220,80,20,${0.7 * glow})`], [1, 'rgba(80,20,5,0.8)']]); ell(ctx, x, y - w * 0.22, w * 0.42, w * 0.09); ctx.fill();
    ctx.fillStyle = '#e8cc8a'; ctx.fillRect(x - w * 0.5, y - w * 0.3, w, w * 0.07);
  };
  const potTea = () => (phase === 'water' ? 0.25 : phase === 'steep' ? clamp(0.2 + steepT * 0.05, 0.1, 0.8) : tea);
  const drawPot = (ctx, V) => {
    const pp = potPose(), u = V.s * POT.k, B = potBase();
    ctx.save(); ctx.fillStyle = `rgba(0,0,0,${0.3 - 0.1 * ease(slide)})`; ell(ctx, X(V, B.x) + 3, Y(V, B.y + 0.008), 0.125 * V.s, 0.022 * V.s); ctx.fill();
    ctx.translate(X(V, pp.px), Y(V, pp.py)); ctx.rotate(-pp.a); ctx.translate(-POTGRIP.x * u, -POTGRIP.y * u);
    clayPot(ctx, u, { lid: phase === 'water' ? 1 : 0, water: potL, open, liquid: teaColors(potTea())[1] }); ctx.restore();
    if (slide > 0.04) { ctx.save(); ctx.globalAlpha = clamp(slide * 1.6, 0, 1); ctx.translate(X(V, pp.px), Y(V, pp.py)); sleeveHand(ctx, V.s * 0.62, { ang: 0.45, len: 1.0, sleeve: ['#8fa3b8', '#5b7088', '#3f5268', '#27364a'] }); ctx.restore(); }
    if (phase === 'water') { ctx.save(); ctx.translate(X(V, B.x + 0.165), Y(V, B.y + 0.004)); clayLid(ctx, u, { x: 0, y: 0, rot: 0.05 }); ctx.restore(); }
  };
  const drawScene = (ctx, V, t) => {
    const kp = kettlePose(), ku = V.s * KET.k;
    ctx.save(); ctx.translate(X(V, kp.tip.x), Y(V, kp.tip.y)); ctx.rotate(-kp.tilt); kettle(ctx, ku, {});
    if (kOn > 0.1) { ctx.save(); ctx.globalAlpha = clamp(kOn * 1.5, 0, 1); ctx.translate(0.17 * ku, -0.05 * ku); ctx.rotate(kp.tilt); sleeveHand(ctx, V.s * 0.62, { ang: 0.5, len: 1.0, sleeve: ['#8fa3b8', '#5b7088', '#3f5268', '#27364a'] }); ctx.restore(); }
    ctx.restore();
    wisp(ctx, X(V, kp.tip.x + 0.01), Y(V, kp.tip.y) - 4, 0.07 * V.s, t, 0.35, 5);
    const pp = pitcherPose(); const drawPitcher = () => { ctx.save();
    if (pitchSlide < 0.5) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(ctx, X(V, PITCH.x) + 3, Y(V, PITCH.y + 0.008), 0.075 * V.s, 0.015 * V.s); ctx.fill(); }
    ctx.translate(X(V, pp.lip.x), Y(V, pp.lip.y)); ctx.rotate(-pp.a); ctx.translate(-LIPP.x * pp.k * V.s, -LIPP.y * pp.k * V.s);
    pitcher(ctx, V.s * pp.k, 0, 0, { L: clamp(pitchV, 0, 1) * 0.85, F: pitchV > 0.04 ? 0.012 : 0, tea: tea });
      if (pitchSlide > 0.04) { ctx.save(); ctx.globalAlpha = clamp(pitchSlide * 1.6, 0, 1); ctx.translate(PITCHER.wr * 1.95 * pp.k * V.s, -PITCHER.H * 0.55 * pp.k * V.s); ctx.rotate(pp.a); sleeveHand(ctx, V.s * 0.62, { ang: 0.5, len: 1.0, sleeve: ['#8fa3b8', '#5b7088', '#3f5268', '#27364a'] }); ctx.restore(); }
      ctx.restore(); };
    if (pitchSlide < 0.5) drawPitcher();
    for (let i = 0; i < NC; i++) { const x = X(V, cupX(i)), by = Y(V, CUPY); ctx.fillStyle = 'rgba(0,0,0,0.28)'; ell(ctx, x + 3, by + 3, 0.04 * V.s * CUPK, 0.012 * V.s); ctx.fill(); porcelainCup(ctx, V.s * CUPK, x, by, { L: cupsL[i], tea }); }
    drawPot(ctx, V);
    if ((phase === 'steep' || phase === 'out') && potL > 0.1) { const tp = potPose(); wisp(ctx, X(V, tp.tip.x), Y(V, tp.tip.y) - 4, 0.06 * V.s, t, 0.3 + 0.2 * Math.min(1, steepT / 6), 9); }
    if (pitchSlide >= 0.5) drawPitcher();
    const kS = K.points((x) => X(V, x), (y) => Y(V, y), 0.011 * V.s, 0.2); if (kS.length > 1) drawStream(ctx, kS, 0.15, 0.9);
    const pS = PT.points((x) => X(V, x), (y) => Y(V, y), 0.016 * V.s, 0.3); if (pS.length > 1) drawStream(ctx, pS, isRinse() ? 0.1 : tea, 0.92);
    const cS = CS.points((x) => X(V, x), (y) => Y(V, y), 0.016 * V.s, 0.3); if (cS.length > 1) drawStream(ctx, cS, tea, 0.92);
    if (phase === 'water') ring(ctx, V, t);
    if (phase === 'cups') cupGuides(ctx, V);
    if (phase === 'steep' || phase === 'out') steepBar(ctx, V);
    pips(ctx, V);
  };
  const ring = (ctx, V, t) => {
    const m = potMouth(), cx = X(V, m.x), cy = Y(V, m.y), rr = RING * V.s * 1.18;
    ctx.save(); ctx.lineCap = 'butt';
    for (let i = 0; i < SIDES; i++) {
      const a0 = (i / SIDES) * TAU + 0.04, a1 = ((i + 1) / SIDES) * TAU - 0.04, v = clamp(secT[i] / (1 / SIDES), 0, 1.3);
      ctx.beginPath(); ctx.ellipse(cx, cy + 3, rr, rr * 0.3, 0, a0, a1); ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 6; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, cy + 3, rr, rr * 0.3, 0, a0, a0 + (a1 - a0) * Math.min(1, v)); ctx.strokeStyle = v > 1.08 ? 'rgba(255,170,90,0.95)' : 'rgba(140,235,160,0.95)'; ctx.lineWidth = 6; ctx.stroke();
    }
    if (!holding && potL < 0.02) { const a = t * 2.2, x = cx + Math.cos(a) * rr * 1.7, y = cy + Math.sin(a) * rr * 0.6; ctx.strokeStyle = 'rgba(255,248,220,0.45)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, rr * 1.7, rr * 0.6, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = 'rgba(255,248,220,0.95)'; ell(ctx, x, y, 7, 7); ctx.fill(); }
    ctx.restore();
  };
  const cupGuides = (ctx, V) => {
    for (let i = 0; i < NC; i++) { const G = glassOf(X(V, cupX(i)), Y(V, CUPY), V.s * CUPK, CUP), fy = G.by - G.H * (0.1 + 0.8 * LINE), w = G.wr * 0.9; ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(G.x - w, fy); ctx.lineTo(G.x + w, fy); ctx.stroke(); ctx.restore(); }
  };
  const steepBar = (ctx, V) => {
    const w = win_(), bw = 0.52 * V.s, bx = X(V, 0.12), by = Y(V, 0.085), bh = 0.026 * V.s;
    rrect(ctx, bx - 8, by - 8, bw + 16, bh + 16, (bh + 16) / 2); ctx.fillStyle = 'rgba(16,10,6,0.62)'; ctx.fill();
    rrect(ctx, bx, by, bw, bh, bh / 2); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
    const a = bw * w[0] / STEEP_MAX, b = bw * w[1] / STEEP_MAX; rrect(ctx, bx + a, by, b - a, bh, bh / 2); ctx.fillStyle = lg(ctx, 0, by, 0, by + bh, [[0, 'rgba(170,245,170,0.95)'], [1, 'rgba(70,190,100,0.95)']]); ctx.fill();
    const f = clamp(steepT / STEEP_MAX, 0, 1); rrect(ctx, bx, by, Math.max(bh, bw * f), bh, bh / 2); ctx.fillStyle = 'rgba(255,200,90,0.35)'; ctx.fill();
    // the colour the tea has reached, in a little glass dish at the end of the bar
    { const cx = bx + bw + 26, cy = by + bh / 2, [deep, body, light] = teaColors(clamp(0.2 + steepT * 0.05, 0.1, 0.8)); ctx.fillStyle = 'rgba(16,10,6,0.62)'; ctx.beginPath(); ctx.arc(cx, cy, bh * 0.95, 0, TAU); ctx.fill(); ctx.fillStyle = lg(ctx, cx, cy - bh * 0.7, cx, cy + bh * 0.7, [[0, light], [1, deep]]); ctx.beginPath(); ctx.arc(cx, cy, bh * 0.72, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(cx - bh * 0.2, cy - bh * 0.3, bh * 0.28, bh * 0.12, -0.5, 0, TAU); ctx.fill(); void body; }
    { const cx = bx + bw + 26 + bh * 2.3, cy = by + bh / 2, R = bh * 0.95, op = clamp(0.1 + steepT * 0.07 + open * 0.5, 0, 1); ctx.fillStyle = 'rgba(16,10,6,0.62)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill(); ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R * 0.78, 0, TAU); ctx.clip(); ctx.fillStyle = rgba2(teaColors(clamp(0.2 + steepT * 0.05, 0.1, 0.8))[1]); ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      for (let k = 0; k < 9; k++) { const a = hash(k, 3) * TAU, d = hash(k, 4) * R * 0.5, sz = R * (0.12 + op * 0.22); ctx.fillStyle = k % 2 ? '#7f9a3a' : '#5e7a26'; ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, sz * (0.7 + op * 0.9), sz * (0.5 + op * 0.2), a * 2, 0, TAU); ctx.fill(); } ctx.restore(); }
    const mx = bx + bw * f; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mx, by + bh + 3); ctx.lineTo(mx - 7, by + bh + 14); ctx.lineTo(mx + 7, by + bh + 14); ctx.closePath(); ctx.fill(); ctx.stroke();
  };
  const pips = (ctx, V) => {
    const x0 = X(V, 0.04), y0 = Y(V, 0.2), step = 0.034 * V.s;
    for (let i = 0; i < rounds; i++) { const on = i < r || (i === r && phase === 'serve'), cur = i === r; ctx.beginPath(); ctx.arc(x0, y0 + i * step, 7 + (cur ? 2 : 0), 0, TAU); ctx.fillStyle = on ? '#ffd36a' : cur ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)'; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.5; ctx.stroke(); if (withRinse && i === 0) { ctx.strokeStyle = 'rgba(60,40,0,0.8)'; ctx.beginPath(); ctx.arc(x0, y0, 3, 0, TAU); ctx.stroke(); } }
  };
  const draw = (g, Rt, tt) => {
    const W0 = Rt.work, ctx = tinyArea(W0) ? safeCtx(g.ctx) : g.ctx, Wk = { x: W0.x, y: W0.y + 26, w: W0.w, h: W0.h - 26 };
    if (Wk.w < 24 || Wk.h < 24) return;
    const s = Math.min(Wk.w / SW, Wk.h / SH), V = { ox: Wk.x + (Wk.w - s * SW) / 2, oy: Wk.y + (Wk.h - s * SH) / 2, s };
    geo = { ox: V.ox, oy: V.oy, s: V.s };
    ctx.save(); rrect(ctx, W0.x, W0.y, W0.w, W0.h, 12); ctx.clip();
    roomBackdrop(ctx, SC, W0, Y(V, 0.55), tt); stove(ctx, V, 0.7 + 0.3 * Math.sin(tt * 5) * Math.sin(tt * 2.3)); tray(ctx, V);
    drawScene(ctx, V, tt);
    ctx.restore();
    const w = win_(), mark = phase === 'steep' || phase === 'out' ? steepT : 0;
    dockGauge(g, ctx, W0, { dot: teaColors(tea)[1], fill: (x, y, wd, ht) => { const a = clamp(w[0] / STEEP_MAX, 0, 1), b = clamp(w[1] / STEEP_MAX, 0, 1); ctx.fillStyle = 'rgba(255,255,255,0.1)'; rrect(ctx, x + 1, y + 1, wd - 2, ht - 2, 4); ctx.fill(); ctx.fillStyle = 'rgba(140,230,150,0.75)'; rrect(ctx, x + wd * a, y + 1, wd * (b - a), ht - 2, 4); ctx.fill(); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2; const mx = x + wd * clamp(mark / STEEP_MAX, 0, 1); ctx.beginPath(); ctx.moveTo(mx, y + ht + 2); ctx.lineTo(mx - 5, y + ht + 10); ctx.lineTo(mx + 5, y + ht + 10); ctx.closePath(); ctx.fill(); ctx.stroke(); } });
    hintPill(g, ctx, W0, hint());
    const th = Rt.thumb; ctx.save(); rrect(ctx, th.x - 2, th.y - 2, th.w + 4, th.h + 4, 10); ctx.clip(); refScene(ctx, th, tt); ctx.restore();
  };
  const staticSet = (ctx, V, L, withKettle) => {
    for (let i = 0; i < NC; i++) porcelainCup(ctx, V.s * CUPK, X(V, cupX(i)), Y(V, CUPY), { L, tea: 0.5 });
    pitcher(ctx, V.s * PITCH.k, X(V, PITCH.x), Y(V, PITCH.y), { L: 0.0, F: 0, tea: 0.5 });
    ctx.save(); ctx.translate(X(V, POT.x), Y(V, POT.y)); clayPot(ctx, V.s * POT.k, { lid: 0 }); ctx.restore();
    if (withKettle) { ctx.save(); ctx.translate(X(V, KREST.x), Y(V, KREST.y)); kettle(ctx, V.s * KET.k, {}); ctx.restore(); }
  };
  const refScene = (ctx, th, tt) => {
    const ts = th.w * 1.2, V = { ox: th.x + th.w / 2 - 0.45 * ts, oy: th.y + th.h * 0.5 - 0.68 * ts, s: ts };
    ctx.save(); ctx.beginPath(); ctx.rect(th.x, th.y, th.w, th.h); ctx.clip();
    roomBackdrop(ctx, SC, th, th.y + th.h * 0.5, tt); ctx.fillStyle = '#3a2410'; ctx.fillRect(th.x, th.y + th.h * 0.5, th.w, th.h * 0.5);
    stove(ctx, V, 0.8); tray(ctx, V); staticSet(ctx, V, LINE, true);
    ctx.restore();
  };
  const titleArt = (g, S, tt) => {
    const { ctx } = g, s = Math.min(S.w / 1.0, S.h / 0.95) * 1.04, V = { ox: S.x + (S.w - s) / 2, oy: S.y + (S.h - s * 0.98) / 2 - 0.02 * s, s };
    ctx.save();
    roomBackdrop(ctx, SC, { x: S.x + S.w / 2 - S.w * 0.7, y: S.y, w: S.w * 1.4, h: S.h }, Y(V, 0.55), tt ?? 0); stove(ctx, V, 0.8); tray(ctx, V); staticSet(ctx, V, LINE, true);
    ctx.restore();
  };

  const hint = () => {
    if (done) return '';
    const w = win_();
    if (phase === 'water') return isRinse() ? (holding ? 'Keep circling slowly and evenly. Let go at the brim.' : 'Rinse first. Press and circle your finger round the pot to pour hot water over the leaves.') : holding ? 'Keep circling, slowly and evenly. Let go at the brim.' : 'Press and circle your finger round the pot: a slow, even circle.';
    if (phase === 'steep') return steepT < w[0] ? 'Wait: the leaves are opening. Press and hold when the marker enters the green.' : steepT <= w[1] ? 'Now: press and hold to pour out.' : 'Too long: press and hold to pour out before it turns bitter.';
    if (phase === 'out') return isRinse() ? 'Hold to pour the rinse away on the tray, to the last drops.' : 'Keep holding until the last drops are out: all of it into the pitcher in one pass.';
    if (phase === 'cups') return holding ? 'Sweep the pitcher slowly back and forth. The last drops go to the lowest cups.' : 'Press and hold the pitcher, then slide along the cups: fill them all to the dashed line.';
    return phase === 'serve' ? 'Served. The next infusion is stronger and takes a little longer.' : '';
  };
  const state = () => ({ technique: 'pour', mode: 'gongfu', round: r, rounds, phase, win: win_().map((v) => Math.round(v * 100) / 100), steepT: Math.round(steepT * 100) / 100, holding, potL: Math.round(potL * 1000) / 1000, potV: Math.round(potV * 1000) / 1000, theta: Math.round(theta * 100) / 100,
    sectors: secT.map((v) => Math.round(v * 1000) / 1000), pitchV: Math.round(pitchV * 1000) / 1000, pitchX: Math.round(pitchX * 1000) / 1000, pitchTilt: Math.round(pitchTilt * 100) / 100, cups: cupsL.map((v) => Math.round(v * 1000) / 1000), air: cupsL.map((_, i) => Math.round(airOf(i) * 1000) / 1000), spillW: Math.round(spillW * 1000) / 1000, cupSpill: Math.round(cupSpill * 1000) / 1000, cupOver: Math.round(cupOver * 1000) / 1000,
    streams: [K.size(), PT.size(), CS.size()], tilt: Math.round(tilt * 100) / 100, slide: Math.round(slide * 100) / 100, kOn: Math.round(kOn * 100) / 100, line: LINE, nc: NC,
    rec: rec.map((x) => ({ pour: x.pour ? Math.round(x.pour.score * 100) / 100 : null, steep: x.steep ? Math.round(x.steep.score * 100) / 100 : null, out: x.out ? Math.round(x.out.score * 100) / 100 : null, cups: x.cups ? Math.round(x.cups.score * 100) / 100 : null })) });

  init();
  return {
    init, items, control, work, tick, draw, attract, titleArt, result: () => done, score: total, hint,
    info: () => { const w = win_(), p = rec_(); return [isRinse() ? 'Rinse the leaves' : `Infusion ${r + (withRinse ? 0 : 1)} of ${R}`, phase === 'steep' || phase === 'out' ? `Steeped ${steepT.toFixed(1)} s, sweet spot ${w[0].toFixed(1)} to ${w[1].toFixed(1)} s` : p.steep ? `Steeped ${p.steep.t.toFixed(1)} s` : 'Leaves are dry']; },
    get caption() { return SC.words?.caption ?? 'Brew these cups'; },
    rules: () => [
      'Pour: press on the stage and circle your finger slowly round the pot. The kettle follows, pouring hot water round the leaves. The ring shows the water that has reached each part: keep it even, and let go at the brim.',
      'Rinse: the first pour only wakes the leaves. Steep it a moment, then pour it away on the tray.',
      'Steep: the bar shows the time. The green part is the sweet spot, and it moves later with every infusion as the leaves open. Press and hold to start pouring out when the marker is inside it: too early is thin, too late is bitter.',
      'Pour out: hold until the pot is empty, in one unbroken pass into the fairness pitcher, down to the last drops. Letting go leaves tea in the pot and it keeps steeping.',
      'Cups: press and hold the pitcher and slide it back and forth over the cups so that every cup is filled to the dashed line and they all match. The last drops go to the lowest cups. Tea that misses a cup is lost.',
      'Score: steeping time in the sweet spot (35), equal cups at the line (35), an even circle and brim (15), the pot emptied in one pass (10), a dry tray (5). Nothing done scores nothing.',
    ],
    point(id) {
      if (!geo) return null;
      const [k, rest] = id.split(':'), P2 = (x, y) => ({ x: geo.ox + x * geo.s, y: geo.oy + y * geo.s });
      if (k === 'ring') { const a = Number(rest), m = potMouth(); return P2(m.x + 0.13 * Math.cos(a), m.y + 0.13 * Math.sin(a)); }   // a circle round the mouth of the pot
      if (k === 'pot') return P2(POT.x, POT.y - 0.06);
      if (k === 'pitcher') return P2(pitchX + 0.03, 0.74);
      if (k === 'lip') return P2(pitchX, 0.74);                                        // where the pitcher's lip is now (screen x of pitchX)
      if (k === 'air') return { x: airOf(clamp(Number(rest), 0, NC - 1)) * 1000, y: 0 };   // tea in the air over cup i (x field, thousandths): lets a player judge when to move on
      if (k === 'sweep') { const i = clamp(Number(rest), 0, NC - 1); return P2(cupX(i) + 0.045, 0.74); }   // where the lip must be to pour into cup i
      return null;
    },
    state,
  };
}

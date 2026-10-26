// shape-craft `brew`, mode "cezve" (1.26.0): Turkish coffee in a copper cezve on hot sand.
// Measure water by the cup, add the coffee and the sugar, then slide the pot on and off the heat so the foam rises slowly and is lifted
// away just before it boils over, three times; then spoon the foam into every cup first and pour the coffee down the side without
// breaking the crema. Score (0-100, measured beyond the passive baseline): ingredients 15, three rises 45 (foam peak in the lit band, no
// boil-over), pour 40 (foam shared, crema kept, cups level).
import { starsFor } from './geom.js';
import { fx as synth } from '../../../platform/engine-kit/synth.js';
import { hintPill, dockGauge } from './paint-ui.js';
import { shadowed, rrect } from './fx.js';
import { clamp, lerp, sm, cyl, bubble, foam, steam, glow, dimples, groundShadow, embers, spoonProp, tint, mix, rgba, lg, rg, ell, TAU, hash } from './brew-art.js';

const SW = 1, SH = 0.8, BASE = 0.655, REST = 0.23, LIFT_H = 0.15, U_MIN = 0.16, U_MAX = 0.8, GATE = 0.45;
const BAND = [0.82, 0.97];            // foam peak that earns full marks (1.0 is the rim: over it, the coffee boils over)
const ITEMS = { water: { u: 0.13, v: 0.235 }, coffee: { u: 0.34, v: 0.235 }, sugar: { u: 0.55, v: 0.235 } };
const heatAt = (u) => sm((u - 0.42) / 0.2) * (1 - sm((u - 0.86) / 0.1));
const Q_MAX = 0.55, FOAM_FRAC = 0.3, CUP_W = 0.115, FILL_T = 0.92;

const mkSound = (audio) => {
  const F = (kind, p) => { try { return synth(audio, kind, p); } catch { return false; } };
  return {
    water(i) { F('scrape', { hz: 1500, dur: 0.5, vel: 0.35 }); F('splash', { vel: 0.3, delay: 0.25 + i * 0.01 }); },
    coffee() { F('scrape', { hz: 900, dur: 0.12, vel: 0.35 }); F('impact', { mat: 'clay', hz: 190, vel: 0.2, delay: 0.14 }); },
    sugar() { F('scrape', { hz: 4200, dur: 0.14, vel: 0.35 }); F('tick', { hz: 3000, vel: 0.15, delay: 0.16 }); },
    slide(v) { F('scrape', { hz: 520 + v * 380, dur: 0.1, vel: 0.28 }); },
    lift() { F('whoosh', { dur: 0.18, vel: 0.2, down: false }); },
    set() { F('impact', { mat: 'metal', hz: 380, vel: 0.28 }); F('scrape', { hz: 700, dur: 0.14, vel: 0.2, delay: 0.02 }); },
    simmer(f) { F('pop', { hz: 300 + f * 520, vel: 0.1 + f * 0.1 }); },
    sizzle() { F('scrape', { hz: 3600, dur: 0.22, vel: 0.28 }); },
    rise(i, q) { F('good', { hz: 520 + i * 90, vel: 0.3 + 0.35 * q }); },
    over() { F('splash', { vel: 0.7 }); F('scrape', { hz: 3000, dur: 0.5, vel: 0.5, delay: 0.05 }); F('bad', { hz: 200, vel: 0.4, delay: 0.1 }); },
    pour(fill, foamy) { F('scrape', { hz: foamy ? 1100 : 1700 + fill * 1900, dur: 0.11, vel: foamy ? 0.22 : 0.3 }); },
    cup() { F('ring', { hz: 1900, dur: 0.5, vel: 0.2 }); },
    crack() { F('pop', { hz: 190, vel: 0.35 }); },
    win(stars) { F('good', { hz: 600 + stars * 80, vel: 0.5 }); F('ring', { hz: 1568, dur: 0.9, vel: 0.2, delay: 0.1 }); },
  };
};

export function createCezve(P, env) {
  const { rng, fx } = env, SC = P.scene ?? {}, W = SC.words ?? {};
  const snd = mkSound(env.audio);
  if (env.options?.soundLog) for (const k of Object.keys(snd)) { const f = snd[k]; snd[k] = (...a) => { env.options.soundLog.push({ kind: `cezve.${k}` }); return f(...a); }; }
  const cupsN = P.cups ?? 0;
  let order, ing, phase, pot, Tm, Tl, f, curMax, armed, overT, rises, spills, lost, pour, now, done, geo, anim, sndT, auto, ptr, prepScore, pourK, sticky;

  const init = () => {
    const n = cupsN || (2 + rng.int(2));
    order = { n, sweet: P.sweet ?? rng.int(2) };          // 0 plain, 1 medium sweet: spoons per cup
    ing = { water: 0, coffee: 0, sugar: 0, log: [] };
    phase = 'prep'; pot = { u: REST, l: 0, tu: REST, tl: 0, grab: null, speed: 0 };
    Tm = 0.05; Tl = 0.05; f = 0; curMax = 0; armed = true; overT = 0; rises = []; spills = 0; lost = 0; pour = null; now = 0; done = null;
    anim = { add: [], boil: 0 }; sndT = { slide: 0, simmer: 0, pour: 0, sizzle: 0 }; auto = { st: 0, wait: 0.5, k: 0, cup: 0 }; ptr = null; prepScore = null; pourK = 0; sticky = null;
  };
  const need = () => ({ water: order.n, coffee: order.n, sugar: order.n * order.sweet });
  const total = () => ing.water + ing.coffee + ing.sugar;
  const closeness = (a, b) => (a === b ? 1 : Math.abs(a - b) === 1 ? 0.5 : 0);
  const prepPts = () => { const nd = need(); return 5 * (closeness(ing.water, nd.water) + closeness(ing.coffee, nd.coffee) + closeness(ing.sugar, nd.sugar)); };
  const riseScore = (r) => (r.over ? 0 : r.peak >= BAND[0] ? (r.peak <= BAND[1] ? 1 : 0.9) : lerp(0.3, 1, clamp((r.peak - 0.45) / (BAND[0] - 0.45), 0, 1)) * (r.peak < 0.45 ? 0 : 1));
  const risePts = () => 15 * rises.reduce((s, r) => s + riseScore(r), 0);
  const foamShare = () => (pour ? pour.vf0 / order.n : 1);
  const pourParts = () => {
    if (!pour) return { foam: 0, crema: 0, fill: 0 };
    const n = order.n, cups = pour.cups, fs = foamShare();
    const shares = cups.map((c) => (fs > 0 ? c.foam / fs : 0)), dev = shares.reduce((s, v) => s + Math.min(1.5, Math.abs(v - 1)), 0) / n;
    const foamS = clamp(1 - dev / 0.7, 0, 1);
    const crema = cups.reduce((s, c) => s + (c.foam > 0.02 ? clamp(1 - c.broke * 2.2, 0, 1) : 0), 0) / n;
    const err = cups.reduce((m, c) => Math.max(m, Math.abs(c.fill - FILL_T)), 0), mean = cups.reduce((s, c) => s + c.fill, 0) / n;
    const fillS = clamp(1 - err / 0.34, 0, 1) * clamp(1 - pour.waste * 2.2, 0.2, 1) * (mean > 0.1 ? 1 : 0);
    return { foam: foamS * (mean > 0.1 ? 1 : 0), crema: crema * (mean > 0.1 ? 1 : 0), fill: fillS };
  };
  const pourPts = () => { const q = pourParts(); return 15 * q.foam + 10 * q.crema + 15 * q.fill; };
  const score = () => Math.round(Math.min(100, (ing.log.length || phase !== 'prep' ? prepPts() : 0) + risePts() + pourPts()));
  const totalScore = () => (done ? done.score : score());

  // ---- actions -------------------------------------------------------------------------------------------------------------------------
  const addIng = (what) => {
    if (done || phase !== 'prep') return;
    const k = what; ing[k]++; ing.log.push(k);
    anim.add.push({ k, t: 0 });
    (snd[k] ?? snd.coffee)(ing[k]);
    if (geo) fx.emit('dust', geo.ox + ITEMS[k].u * geo.s, geo.oy + (ITEMS[k].v + 0.07) * geo.s, { count: 3, color: '#f4ead6', size: 3, speed: 24, life: 0.4, gravity: -10 });
  };
  const undo = () => { if (done || phase !== 'prep' || !ing.log.length) return; const k = ing.log.pop(); ing[k]--; snd.set(); };
  const startHeat = () => { phase = 'heat'; prepScore = prepPts(); };
  const startPour = () => {
    phase = 'pour';
    const vt = order.n * FILL_T * (1 - lost), ok = ing.coffee > 0 ? 1 : 0.2;
    pour = { vt0: order.n * FILL_T, vf0: vt * FOAM_FRAC * ok, vf: vt * FOAM_FRAC * ok, vl: vt - vt * FOAM_FRAC * ok, lip: 0.5, tilt: 0, tTilt: 0, tLip: 0.5, q: 0, qn: 0, waste: 0, cups: Array.from({ length: order.n }, () => ({ fill: 0, foam: 0, broke: 0 })), over: 0, lastCup: -1, grab: null };
  };
  const finish = () => {
    if (done) return;
    const s = score(), stars = starsFor(s);
    done = { score: s, max: 100, stars, headline: stars === 3 ? (W.win ?? 'A cup with a proper crown of foam') : stars ? (W.ok ?? 'A good cup') : (W.retry ?? 'Back to the sand'), detail: `Ingredients ${Math.round(prepPts())} of 15, rises ${Math.round(risePts())} of 45 (${rises.length} of 3${spills ? `, ${spills} boil-over${spills > 1 ? 's' : ''}` : ''}), pour ${Math.round(pourPts())} of 40` };
    snd.win(stars);
    if (geo) fx.emit('spark', geo.ox + 0.5 * geo.s, geo.oy + 0.45 * geo.s, { count: 14, color: '#ffd89a', size: 7, speed: 150, life: 0.9, gravity: 160 });
  };
  const tinyView = () => (env.ui?.buttonH?.(0) ?? 0) > 150;   // a live preview about 140 css px wide: one button only, so the work area never goes negative
  const items = () => {
    const all = items0();
    return tinyView() ? all.filter((i) => i.primary) : all;
  };
  const items0 = () => {
    const out = [];
    if (phase === 'prep') out.push({ id: 'undo', kind: 'btn', label: 'Undo', off: !ing.log.length });
    out.push({ id: 'check', kind: 'btn', label: phase === 'pour' ? 'Serve' : 'Check', primary: true });
    return out;
  };
  const control = (id) => { if (done) return; if (id === 'undo') undo(); else if (id === 'check') finish(); };

  // ---- the pointer ---------------------------------------------------------------------------------------------------------------------
  const toLocal = (x, y) => [(x - geo.ox) / geo.s, (y - geo.oy) / geo.s];
  const near = (u, v, c, r) => Math.hypot(u - c.u, v - c.v) < r;
  const work = (p) => {
    if (!geo || done || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    ptr = { x: p.x, y: p.y };
    const [u, v] = toLocal(p.x, p.y);
    if (p.pressed) {
      if (phase === 'prep') { for (const k of ['water', 'coffee', 'sugar']) if (near(u, v, ITEMS[k], 0.095)) { addIng(k); return; } }
      if (phase === 'pour' && pour) { const [hu, hv] = handleEnd(pour.lip, pour.tilt); pour.grab = { du: Math.abs(u - hu) < 0.5 && Math.abs(v - hv) < 0.5 ? u - hu : 0, dv: Math.abs(u - hu) < 0.5 && Math.abs(v - hv) < 0.5 ? v - hv : 0 }; }
      else if (phase !== 'pour' && u > pot.u - 0.13 && u < pot.u + 0.34 && v > BASE - pot.l * LIFT_H - 0.36 && v < BASE + 0.06) pot.grab = { du: u - pot.u, dv: v - (BASE - pot.l * LIFT_H) };
    }
    if (!p.down) { pot.grab = null; if (pour) pour.grab = null; return; }
    if (pot.grab && phase !== 'pour') { pot.tu = u - pot.grab.du; pot.tl = clamp(((BASE - (v - pot.grab.dv)) / LIFT_H), 0, 1); }
    if (pour && pour.grab) { const hv = v - pour.grab.dv, hu = u - pour.grab.du; pour.tTilt = clamp((LIP_V + 0.03 - hv) / 0.27, 0, 1); pour.tLip = clamp(hu - (0.367 * Math.cos(pour.tTilt * 0.9) + 0.03 * Math.sin(pour.tTilt * 0.9)), 0.1, 0.9); }
  };

  const qOf = (tilt, F) => { const th0 = 0.6 - 0.46 * F; return Q_MAX * Math.pow(clamp((tilt - th0) / 0.35, 0, 1), 1.2); };
  const tiltFor = (q, F) => { const th0 = 0.6 - 0.46 * F; return th0 + Math.pow(clamp(q / Q_MAX, 0, 1), 1 / 1.2) * 0.35; };
  const LIP_V = 0.34;
  const handleEnd = (lip, tilt) => { const a = tilt * 0.9; return [lip + 0.367 * Math.cos(a) + 0.03 * Math.sin(a), LIP_V - 0.367 * Math.sin(a) + 0.03 * Math.cos(a)]; };
  const cupU = (i) => (0.5 + (i - (order.n - 1) / 2) * 0.235);

  const tick = (dt) => {
    now += dt;
    for (const a of anim.add) a.t += dt; anim.add = anim.add.filter((a) => a.t < 1.1);
    anim.boil = Math.max(0, anim.boil - dt);
    for (const k of Object.keys(sndT)) sndT[k] -= dt;
    pourK = clamp(pourK + (phase === 'pour' ? 1 : -1) * dt / 0.9, 0, 1);
    if (geo && pourK < 0.5 && Math.floor(now * 5) !== Math.floor((now - dt) * 5)) { const i = Math.floor(now * 5); fx.emit('spark', geo.ox + lerp(0.5, 0.88, hash(i, 1)) * geo.s, geo.oy + lerp(0.56, 0.7, hash(i, 2)) * geo.s, { count: 1, color: '#ff9a40', size: 3, speed: 30, life: 0.9, gravity: -45, spread: 1.2 }); }
    if (phase !== 'pour') {
      // the pot follows the hand; before the water and coffee are in it will not go onto the sand
      const gateOpen = ing.water > 0 && ing.coffee > 0 || phase !== 'prep';
      const tu = clamp(pot.tu, U_MIN, phase === 'prep' && !gateOpen ? GATE - 0.07 : U_MAX), du = tu - pot.u;
      const step = clamp(du * Math.min(1, dt * 12), -1.6 * dt, 1.6 * dt);
      pot.speed = step / Math.max(dt, 1e-6);
      pot.u = clamp(pot.u + step, U_MIN, U_MAX);
      const dl = pot.tl - pot.l; pot.l = clamp(pot.l + clamp(dl * Math.min(1, dt * 12), -4 * dt, 4 * dt), 0, 1);
      if (phase === 'prep' && gateOpen && pot.u > GATE) startHeat();
      if (Math.abs(pot.speed) > 0.12 && pot.l < 0.15 && sndT.slide <= 0) { sndT.slide = 0.11; snd.slide(Math.abs(pot.speed)); }
      // heat: the sand under the pot (less when it is lifted), copper warms fast, the coffee a little behind
      const hin = heatAt(pot.u) * (1 - 0.88 * sm(pot.l / 0.55)) * (phase === 'heat' ? 1 : phase === 'prep' ? 1 : 0);
      Tm += (0.95 * hin * (1.25 - Tm) - 0.12 * Tm - (hin < 0.15 ? 0.8 * Tm * (0.5 + 1.5 * sm(pot.l)) : 0)) * dt;
      Tl += (Tm - Tl) * 1.0 * dt;
      const body = ing.coffee > 0 && ing.water > 0 ? 1 : 0.25, fStar = 1.32 * sm((Tl - 0.6) / 0.36) * body;
      f += (fStar - f) * (fStar > f ? 0.45 : 1.5) * dt; f = Math.max(0, f);
      if (phase === 'heat' && rises.length < 3) {
        const lim = 1.0 - 0.9 * Math.max(0, ing.water - order.n) / Math.max(1, order.n);
        if (f > curMax) curMax = f;
        if (armed && f > 1.0) overT += dt; else overT = Math.max(0, overT - dt);
        if (armed && overT > 0.12 && f > lim) { // boil-over: the foam crosses the rim and runs down the pot
          spills++; lost += 0.07; armed = false; overT = 0; anim.boil = 1.2; f = 0.55; Tm = Math.max(0.5, Tm - 0.12); curMax = Math.max(curMax, 1.05);
          rises.push({ peak: curMax, over: true }); snd.over();
          if (geo) fx.emit('drop', geo.ox + pot.u * geo.s, geo.oy + (BASE - 0.28) * geo.s, { count: 12, color: '#3a1d0c', size: 5, speed: 150, life: 0.7, gravity: 600, spread: Math.PI, angle: -Math.PI / 2 });
          curMax = 0;
        } else if (armed && curMax > 0.5 && f < curMax - 0.12 && f < 1.0) {   // the foam has peaked and is settling: this rise is counted
          const r = { peak: curMax, over: false }; rises.push(r); armed = false; snd.rise(rises.length, riseScore(r));
          if (geo) fx.emit('spark', geo.ox + pot.u * geo.s, geo.oy + (BASE - 0.3) * geo.s, { count: 8, color: '#ffd89a', size: 5, speed: 90, life: 0.6, gravity: 100 });
        }
        if (!armed && f < 0.25) { armed = true; curMax = 0; }
        if (phase === 'heat' && f > 0.35 && sndT.simmer <= 0) { sndT.simmer = 0.16 - 0.08 * clamp(f, 0, 1); snd.simmer(f); }
      }
      if (phase === 'heat' && Tm > 0.5 && pot.l < 0.3 && anim.boil > 0 && sndT.sizzle <= 0) { sndT.sizzle = 0.3; snd.sizzle(); }
      if (phase === 'heat' && rises.length >= 3 && f < 0.5 && (pot.l > 0.45 || pot.u < GATE)) startPour();
    } else if (pour) {
      pour.lip += clamp((pour.tLip - pour.lip), -0.9 * dt, 0.9 * dt);
      pour.tilt += clamp((pour.tTilt - pour.tilt), -2.2 * dt, 2.2 * dt);
      const F = clamp((pour.vf + pour.vl) / pour.vt0, 0, 1.2);
      const q = (pour.vf + pour.vl) > 0.001 ? qOf(pour.tilt, F) : 0, dv = Math.min(q * dt, pour.vf + pour.vl);
      pour.q = q; pour.qn = q / Q_MAX;
      const landU = pour.lip - 0.02 - 0.06 * pour.qn;
      let ci = -1; for (let i = 0; i < order.n; i++) if (Math.abs(landU - cupU(i)) < CUP_W * 0.42) ci = i;
      pour.lastCup = ci;
      if (dv > 0) {
        const isFoam = pour.vf > 0.0005, fdv = isFoam ? Math.min(dv, pour.vf) : 0, ldv = dv - fdv;
        pour.vf -= fdv; pour.vl -= ldv;
        if (ci < 0) pour.waste += dv / pour.vt0;
        else {
          const c = pour.cups[ci];
          c.foam += fdv; c.fill += dv;
          if (ldv > 0 && c.foam > 0.02 && q > 0.36) { c.broke += (q - 0.36) * 2.4 * dt; if (c.broke > 0.2 && !c.crack) { c.crack = true; snd.crack(); } }   // a hard stream breaks the crema
          if (c.fill > 1.0) { pour.waste += (c.fill - 1.0) / pour.vt0; c.fill = 1.0; }
        }
        if (sndT.pour <= 0) { sndT.pour = 0.1; snd.pour(ci >= 0 ? pour.cups[ci].fill : 0.3, isFoam); }
        if (geo && ci >= 0 && Math.floor(now * 14) !== Math.floor((now - dt) * 14)) fx.emit('drop', geo.ox + cupU(ci) * geo.s, geo.oy + 0.585 * geo.s, { count: 1, color: isFoam ? '#d7a468' : '#3a1d0c', size: 2.6, speed: 45, life: 0.35, gravity: 320, spread: 1.4 });
      }
      if (pour.vf + pour.vl <= 0.001 && !pour.finished) { pour.finished = true; snd.cup(); }
    }
  };

  // ---- Watch and learn: a barista who measures, heats on a thermostat of the eye, lifts at the right moment and pours foam first ---------
  const attract = (dt) => {
    if (done) return;
    if (auto.wait > 0) { auto.wait -= dt; return; }
    const nd = need();
    if (phase === 'prep') {
      const k = ing.water < nd.water ? 'water' : ing.coffee < nd.coffee ? 'coffee' : ing.sugar < nd.sugar ? 'sugar' : null;
      if (k) { addIng(k); auto.wait = 0.55; return; }
      pot.tu = 0.66; pot.tl = 0; return;
    }
    if (phase === 'heat') {
      // slide onto the heat; when the foam nears the rim lift the pot away and let it settle
      const hot = f > 0.72 || (curMax > 0.6 && !armed);
      if (rises.length >= 3) { pot.tl = 1; pot.tu = 0.3; return; }
      if (hot) { pot.tl = 1; pot.tu = 0.34; }
      else if (f < 0.3 && armed) { pot.tl = 0; pot.tu = Tl > 0.8 ? 0.58 : 0.7; }
      return;
    }
    if (phase === 'pour' && pour) {
      const n = order.n, fs = foamShare(), F = clamp((pour.vf + pour.vl) / pour.vt0, 0, 1.2), left = pour.vf + pour.vl;
      if (left <= 0.001) { pour.tTilt = 0; if (pour.q <= 0.001) { auto.wait = 0.6; finish(); } return; }
      const foamPhase = pour.vf > 0.0005;
      let ci = auto.cup, c = pour.cups[ci];
      if (!foamPhase) { // coffee: bring the cups up together, the lowest first, in two rounds
        const goal = pour.cups.every((cc) => cc.fill >= 0.49) ? FILL_T : 0.5;
        if (c.fill >= goal - 0.004 || auto.cupWas === 'foam') { let lo = 0; for (let i = 1; i < n; i++) if (pour.cups[i].fill < pour.cups[lo].fill - 0.003) lo = i; if (lo !== ci) { auto.cup = lo; pour.tTilt = 0; auto.travel = 0.45; } auto.cupWas = 'liq'; ci = auto.cup; c = pour.cups[ci]; }
      } else {
        auto.cupWas = 'foam';
        if (c.foam >= fs - 0.004 && ci < n - 1) { auto.cup = ci + 1; pour.tTilt = 0; auto.travel = 0.45; return; }
      }
      if (auto.travel > 0) { auto.travel -= dt; pour.tTilt = 0; pour.tLip = cupU(auto.cup) + 0.02 + 0.06 * (0.25 / Q_MAX); return; }
      const want = foamPhase ? 0.2 : 0.28, offs = 0.02 + 0.06 * (want / Q_MAX);
      pour.tLip = cupU(auto.cup) + offs;
      pour.tTilt = Math.abs(pour.lip - pour.tLip) < 0.02 ? tiltFor(want, F) : 0;
    }
  };

  // ---- drawing -------------------------------------------------------------------------------------------------------------------------
  const X = (V, u) => V.ox + u * V.s, Y = (V, v) => V.oy + v * V.s;

  const drawSandTray = (ctx, V, t, o) => {
    const s = V.s, y0 = Y(V, 0.525 + o.dy), y1 = Y(V, 0.745 + o.dy), xa = X(V, 0.085), xb = X(V, 0.915), xc = X(V, 0.045), xd = X(V, 0.955);
    ctx.save(); ctx.globalAlpha = 1 - o.fade;
    // tray body (copper), its rim and the sand surface in perspective
    shadowed(ctx, () => { ctx.beginPath(); ctx.moveTo(xa, y0); ctx.lineTo(xb, y0); ctx.lineTo(xd, y1); ctx.lineTo(xc, y1); ctx.closePath(); ctx.fillStyle = '#3a1c0c'; ctx.fill(); }, { blur: 16, dy: 10, a: 0.6 });
    ctx.beginPath(); ctx.moveTo(xc - 6, y1); ctx.lineTo(xd + 6, y1); ctx.lineTo(xd + 6, y1 + s * 0.045); ctx.lineTo(xc - 6, y1 + s * 0.045); ctx.closePath();
    ctx.fillStyle = lg(ctx, 0, y1, 0, y1 + s * 0.045, [[0, '#d98a52'], [0.35, '#a85a2c'], [1, '#4a2210']]); ctx.fill();
    ctx.fillStyle = 'rgba(255,230,190,0.45)'; ctx.fillRect(xc - 6, y1 + 1, xd - xc + 12, 2);
    const sand = lg(ctx, 0, y0, 0, y1, [[0, '#a98d62'], [0.5, '#cdb283'], [1, '#e2c898']]);
    ctx.beginPath(); ctx.moveTo(xa + 9, y0 + 6); ctx.lineTo(xb - 9, y0 + 6); ctx.lineTo(xd - 9, y1 - 6); ctx.lineTo(xc + 9, y1 - 6); ctx.closePath(); ctx.fillStyle = sand; ctx.fill();
    ctx.save(); ctx.clip();
    // grains and raked lines
    ctx.strokeStyle = 'rgba(90,60,25,0.16)'; ctx.lineWidth = 1.4;
    for (let r = 1; r < 8; r++) { const y = lerp(y0 + 8, y1 - 8, r / 8); ctx.beginPath(); ctx.moveTo(xc, y); for (let x = 0; x <= 1.001; x += 0.05) ctx.lineTo(lerp(xc, xd, x), y + Math.sin(x * 9 + r * 1.7) * 1.5); ctx.stroke(); }
    ctx.fillStyle = 'rgba(80,50,20,0.22)'; for (let i = 0; i < 160; i++) ctx.fillRect(lerp(xa, xb, hash(i, 1)), lerp(y0, y1, hash(i, 2)), 1.6, 1.6);
    ctx.fillStyle = 'rgba(255,245,220,0.35)'; for (let i = 0; i < 120; i++) ctx.fillRect(lerp(xa, xb, hash(i, 3)), lerp(y0, y1, hash(i, 4)), 1.6, 1.6);
    // the hot side: the sand is scorched dark over the coals, with fire showing through its cracks and a glow that rises with the heat
    const hx0 = X(V, 0.47), hx1 = X(V, 0.9), hy0 = y0 + 6, hy1 = y1 - 6, hc = (hx0 + hx1) / 2, hk = 0.7 + 0.3 * o.heat;
    const sc = ctx.createRadialGradient(hc, lerp(hy0, hy1, 0.5), 4, hc, lerp(hy0, hy1, 0.5), (hx1 - hx0) * 0.75); sc.addColorStop(0, 'rgba(70,24,8,0.75)'); sc.addColorStop(0.7, 'rgba(90,40,14,0.4)'); sc.addColorStop(1, 'rgba(90,40,14,0)'); ctx.fillStyle = sc; ctx.fillRect(xc, hy0, xd - xc, hy1 - hy0);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) glow(ctx, lerp(hx0, hx1, 0.1 + i * 0.2), lerp(hy0, hy1, 0.3 + 0.4 * hash(i, 3)), s * 0.17, '255,80,20', (0.22 + 0.1 * Math.sin(t * 2.3 + i * 1.7)) * hk);
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const cx = lerp(hx0, hx1, hash(i, 7)), cy = lerp(hy0 + 8, hy1 - 8, hash(i, 8)), L = 10 + hash(i, 10) * 26, a = (hash(i, 11) - 0.5) * 0.9, fl = 0.55 + 0.45 * Math.sin(t * (2 + hash(i, 12) * 3) + i * 2.1);
      ctx.strokeStyle = `rgba(255,${Math.round(90 + 110 * fl * hk)},30,${(0.5 + 0.5 * fl) * hk})`; ctx.lineWidth = 1.2 + hash(i, 9) * 1.6; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.quadraticCurveTo(cx + L * 0.5, cy + (hash(i, 13) - 0.5) * 8, cx + L * Math.cos(a), cy + L * Math.sin(a) * 0.4); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 150; i++) { const f = 0.5 + 0.5 * Math.sin(t * (2 + hash(i, 5) * 4) + i * 1.3); ctx.fillStyle = `rgba(255,${Math.round(110 + 100 * f)},40,${0.35 * f * hk})`; ctx.beginPath(); ctx.arc(lerp(hx0, hx1, hash(i, 1)), lerp(hy0, hy1, hash(i, 2)), 0.8 + 1.6 * hash(i, 4), 0, TAU); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
    // far rim, lit
    ctx.strokeStyle = 'rgba(255,200,150,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xa, y0 + 1); ctx.lineTo(xb, y0 + 1); ctx.stroke();
    ctx.restore();
  };

  // the cezve, upright or tilted about its lip. o: x,y base centre (design units), f, Tm
  const drawPot = (ctx, V, o) => {
    const k = V.s, t = o.t, px = X(V, o.x), py = Y(V, o.y), rimY = -0.285 * k, rx = 0.082 * k, ry = 0.022 * k;
    ctx.save(); ctx.translate(px, py);
    if (o.tilt) { ctx.translate(-0.082 * k, -0.285 * k); ctx.rotate(-o.tilt); ctx.translate(0.082 * k, 0.285 * k); }
    // handle behind the body: brass bar with a wooden grip, rivets and a hanging hole
    ctx.save(); ctx.lineCap = 'round';
    const hx0 = 0.06 * k, hy0 = -0.19 * k, hx1 = 0.285 * k, hy1 = -0.255 * k, ang = Math.atan2(hy1 - hy0, hx1 - hx0);
    ctx.translate(hx0, hy0); ctx.rotate(ang); const L = Math.hypot(hx1 - hx0, hy1 - hy0);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(2, 5, L, 0.014 * k);
    ctx.fillStyle = lg(ctx, 0, -0.008 * k, 0, 0.008 * k, [[0, '#f6dd94'], [0.45, '#c79a3a'], [1, '#6a4a14']]); rrect(ctx, 0, -0.0075 * k, L * 0.52, 0.015 * k, 0.005 * k); ctx.fill();
    ctx.fillStyle = lg(ctx, 0, -0.012 * k, 0, 0.012 * k, [[0, '#9c6a3a'], [0.4, '#6e4220'], [1, '#2a1608']]); rrect(ctx, L * 0.5, -0.0115 * k, L * 0.5, 0.023 * k, 0.011 * k); ctx.fill();
    ctx.strokeStyle = 'rgba(255,225,170,0.35)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(L * 0.54, -0.006 * k); ctx.lineTo(L * 0.96, -0.006 * k); ctx.stroke();
    ctx.strokeStyle = 'rgba(30,12,2,0.4)'; ctx.lineWidth = 1; for (let q = 0; q < 6; q++) { ctx.beginPath(); ctx.moveTo(L * (0.56 + q * 0.07), -0.009 * k); ctx.lineTo(L * (0.58 + q * 0.07), 0.009 * k); ctx.stroke(); }
    ctx.fillStyle = '#e8c46a'; for (const rv of [0.1, 0.34]) { ctx.beginPath(); ctx.arc(L * rv, 0, 0.0034 * k, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#1a0e06'; ctx.beginPath(); ctx.arc(L * 0.94, 0, 0.0042 * k, 0, TAU); ctx.fill();
    ctx.restore();
    // the body: copper cone, a sharp highlight, hammered dimples, soot at the foot, fire-glow from below when it sits on hot sand
    const bodyPath = () => {
      ctx.beginPath(); ctx.moveTo(-0.1 * k, 0);
      ctx.bezierCurveTo(-0.106 * k, -0.05 * k, -0.078 * k, -0.115 * k, -0.064 * k, -0.2 * k); ctx.bezierCurveTo(-0.06 * k, -0.235 * k, -0.079 * k, -0.255 * k, -0.082 * k, -0.285 * k);
      ctx.lineTo(0.082 * k, -0.285 * k); ctx.bezierCurveTo(0.079 * k, -0.255 * k, 0.06 * k, -0.235 * k, 0.064 * k, -0.2 * k); ctx.bezierCurveTo(0.078 * k, -0.115 * k, 0.106 * k, -0.05 * k, 0.1 * k, 0);
      ctx.ellipse(0, 0, 0.1 * k, 0.028 * k, 0, 0, Math.PI); ctx.closePath();
    };
    bodyPath(); ctx.fillStyle = cyl(ctx, -0.106 * k, 0.106 * k, '#c0652d', { hl: 0.27, spec: 0.5 }); ctx.fill();
    ctx.save(); bodyPath(); ctx.clip();
    dimples(ctx, -0.11 * k, -0.29 * k, 0.22 * k, 0.32 * k, 130, 0.0042 * k, 4, 0.9);
    // a lit shoulder band and the foot ring
    ctx.strokeStyle = 'rgba(255,214,160,0.3)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.ellipse(0, -0.2 * k, 0.065 * k, 0.014 * k, 0, 0.1, Math.PI - 0.1); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,12,2,0.4)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(0, -0.208 * k, 0.065 * k, 0.014 * k, 0, 0.1, Math.PI - 0.1); ctx.stroke();
    const sootG = ctx.createLinearGradient(0, -0.09 * k, 0, 0.03 * k); sootG.addColorStop(0, 'rgba(20,6,0,0)'); sootG.addColorStop(1, 'rgba(20,6,0,0.55)'); ctx.fillStyle = sootG; ctx.fillRect(-0.12 * k, -0.09 * k, 0.24 * k, 0.13 * k);
    const hotG = ctx.createLinearGradient(0, -0.06 * k, 0, 0.03 * k); hotG.addColorStop(0, 'rgba(255,110,40,0)'); hotG.addColorStop(1, `rgba(255,120,40,${0.55 * o.heat})`); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = hotG; ctx.fillRect(-0.12 * k, -0.06 * k, 0.24 * k, 0.1 * k);
    ctx.restore();
    ctx.strokeStyle = 'rgba(40,12,2,0.65)'; ctx.lineWidth = 1.6; bodyPath(); ctx.stroke();
    // a boil-over: coffee runs down the front and the side
    if (o.boil > 0) {
      const b = clamp(o.boil, 0, 1); ctx.save(); bodyPath(); ctx.clip(); ctx.fillStyle = `rgba(48,24,10,${0.92 * b})`;
      for (const [dx, len, w] of [[-0.05, 0.19, 0.016], [0.0, 0.13, 0.012], [0.045, 0.22, 0.015]]) { ctx.beginPath(); ctx.moveTo((dx - w) * k, -0.285 * k); ctx.lineTo((dx + w) * k, -0.285 * k); ctx.lineTo((dx + w * 0.6) * k, (-0.285 + len * (1.2 - b * 0.5)) * k); ctx.quadraticCurveTo(dx * k, (-0.285 + len * (1.2 - b * 0.5) + 0.012) * k, (dx - w * 0.6) * k, (-0.285 + len * (1.2 - b * 0.5)) * k); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = `rgba(255,220,170,${0.2 * b})`; ctx.fillRect(-0.04 * k, -0.28 * k, 0.012 * k, 0.15 * k); ctx.restore();
    }
    // the mouth: copper lip, tin lining, the dark inside
    ctx.strokeStyle = lg(ctx, -rx, 0, rx, 0, [[0, '#6a2e10'], [0.3, '#f6c28a'], [0.7, '#b8602a'], [1, '#4a1c08']]); ctx.lineWidth = 0.007 * k;
    ctx.beginPath(); ctx.ellipse(0, rimY, rx, ry, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = lg(ctx, 0, rimY - ry, 0, rimY + ry, [[0, '#bcc2c8'], [0.5, '#838a92'], [1, '#caced4']]); ctx.beginPath(); ctx.ellipse(0, rimY, rx - 0.004 * k, ry - 0.0015 * k, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#120804'; ctx.beginPath(); ctx.ellipse(0, rimY + 0.0015 * k, rx - 0.0095 * k, ry - 0.0055 * k, 0, 0, TAU); ctx.fill();
    // the liquid and the foam
    const fl = clamp(o.f, 0, 1.4), mr = rx - 0.0095 * k, mry = ry - 0.0055 * k, surfY = rimY + (1 - Math.min(fl, 1)) * 0.05 * k;
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, rimY + 0.0015 * k, mr, mry, 0, 0, TAU); ctx.clip();
    if (o.level > 0.02) {
      ctx.fillStyle = lg(ctx, 0, surfY - mry, 0, surfY + mry, [[0, '#2a1408'], [1, '#1a0c04']]); ctx.beginPath(); ctx.ellipse(0, surfY, mr, mry, 0, 0, TAU); ctx.fill();
      if (fl > 0.05) foam(ctx, 0, surfY, mr, mry, 0, t, { n: 46, seed: 11 });
      ctx.strokeStyle = 'rgba(255,230,190,0.35)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(0, surfY, mr * 0.98, mry * 0.98, 0, 0.2, 2.0); ctx.stroke();
    }
    ctx.restore();
    if (fl > 1) { // heaped over the rim: the dome, drawn over the lip
      const rise = (fl - 1) * 0.34 * k * (o.tilt ? 0.3 : 1);
      foam(ctx, 0, rimY + 0.002 * k, mr * 1.02, mry * 1.05, rise, t, { n: 70, seed: 13 });
    }
    // the front lip passes over the foam: re-stroke the front half of the rim
    ctx.strokeStyle = lg(ctx, -rx, 0, rx, 0, [[0, '#7a3412'], [0.3, '#ffd2a0'], [0.7, '#c4672c'], [1, '#4a1c08']]); ctx.lineWidth = 0.0065 * k;
    ctx.beginPath(); ctx.ellipse(0, rimY, rx, ry, 0, 0.05, Math.PI - 0.05); ctx.stroke();
    // the spout: the lip pinched out on the left
    ctx.fillStyle = '#b8602a'; ctx.beginPath(); ctx.moveTo(-0.082 * k, rimY - 0.001 * k); ctx.lineTo(-0.104 * k, rimY - 0.007 * k); ctx.lineTo(-0.083 * k, rimY + 0.013 * k); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(40,12,2,0.6)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  };

  const drawJug = (ctx, x, y, s, a, t) => { // a brass water ewer
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = a;
    groundShadow(ctx, 0, s * 0.43, s * 0.3, s * 0.07, 0.45);
    ctx.fillStyle = lg(ctx, -s * 0.28, 0, s * 0.28, 0, [[0, '#6a4a14'], [0.2, '#d7a843'], [0.3, '#fff0b0'], [0.45, '#d6a63c'], [0.8, '#8a5e1c'], [1, '#4a3008']]);
    ctx.beginPath(); ctx.moveTo(-s * 0.2, s * 0.42); ctx.bezierCurveTo(-s * 0.34, s * 0.3, -s * 0.3, -s * 0.05, -s * 0.12, -s * 0.16); ctx.lineTo(-s * 0.09, -s * 0.34); ctx.lineTo(-s * 0.17, -s * 0.42); ctx.lineTo(s * 0.13, -s * 0.42); ctx.lineTo(s * 0.09, -s * 0.34); ctx.lineTo(s * 0.12, -s * 0.16); ctx.bezierCurveTo(s * 0.3, -s * 0.05, s * 0.34, s * 0.3, s * 0.2, s * 0.42); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(50,28,4,0.6)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,240,190,0.5)'; ctx.lineWidth = 1.5; for (const yy of [-0.12, 0.14, 0.3]) { ctx.beginPath(); ctx.ellipse(0, s * yy, s * (0.22 - Math.abs(yy) * 0.1), s * 0.03, 0, 0.1, Math.PI - 0.1); ctx.stroke(); }
    ctx.strokeStyle = '#a07a2e'; ctx.lineWidth = s * 0.05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * 0.11, -s * 0.34); ctx.bezierCurveTo(s * 0.4, -s * 0.34, s * 0.42, s * 0.16, s * 0.24, s * 0.26); ctx.stroke(); ctx.strokeStyle = '#f2d37a'; ctx.lineWidth = s * 0.02; ctx.stroke();
    ctx.fillStyle = '#7a5418'; ell(ctx, 0, -s * 0.425, s * 0.145, s * 0.03); ctx.fill();
    ctx.restore();
  };
  const drawTin = (ctx, x, y, s, a) => { // a coffee tin with the lid beside it, a spoon in it
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = a; groundShadow(ctx, 0, s * 0.4, s * 0.3, s * 0.07, 0.45);
    ctx.fillStyle = cyl(ctx, -s * 0.24, s * 0.24, '#2f6a74', { hl: 0.3 }); rrect(ctx, -s * 0.24, -s * 0.22, s * 0.48, s * 0.62, s * 0.05); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#e9d9b0'; rrect(ctx, -s * 0.2, -s * 0.02, s * 0.4, s * 0.28, s * 0.03); ctx.fill(); ctx.strokeStyle = '#8a6a30'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#6a3a1c'; ell(ctx, 0, s * 0.09, s * 0.1, s * 0.08); ctx.fill(); ctx.fillStyle = '#e9d9b0'; ell(ctx, 0, s * 0.07, s * 0.06, s * 0.05); ctx.fill(); // a bean on the label
    ctx.fillStyle = lg(ctx, -s * 0.26, 0, s * 0.26, 0, [[0, '#8a949a'], [0.3, '#e6ecef'], [1, '#6a747a']]); ell(ctx, 0, -s * 0.22, s * 0.25, s * 0.06); ctx.fill();
    ctx.fillStyle = '#1c0e06'; ell(ctx, 0, -s * 0.225, s * 0.2, s * 0.042); ctx.fill();
    ctx.fillStyle = '#4a2810'; ell(ctx, 0, -s * 0.215, s * 0.18, s * 0.03); ctx.fill();
    ctx.save(); ctx.translate(s * 0.02, -s * 0.3); ctx.rotate(-0.5); spoonProp(ctx, s * 0.62, '#c9a05a'); ctx.restore();
    ctx.restore();
  };
  const drawBowl = (ctx, x, y, s, a) => { // sugar bowl with cubes
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = a; groundShadow(ctx, 0, s * 0.34, s * 0.32, s * 0.07, 0.45);
    ctx.fillStyle = cyl(ctx, -s * 0.3, s * 0.3, '#f2eee4', { hl: 0.28, spec: 0.2 }); ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.06); ctx.bezierCurveTo(-s * 0.3, s * 0.22, -s * 0.18, s * 0.34, 0, s * 0.34); ctx.bezierCurveTo(s * 0.18, s * 0.34, s * 0.3, s * 0.22, s * 0.3, -s * 0.06); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2b57a8'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-s * 0.29, s * 0.02); ctx.quadraticCurveTo(0, s * 0.12, s * 0.29, s * 0.02); ctx.stroke();
    for (let q = 0; q < 5; q++) { ctx.fillStyle = '#2b57a8'; ctx.beginPath(); ctx.arc(-s * 0.2 + q * s * 0.1, s * 0.1 + Math.sin(q * 1.3) * 3, 2.6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#d9d4c6'; ell(ctx, 0, -s * 0.06, s * 0.3, s * 0.07); ctx.fill();
    for (let q = 0; q < 9; q++) { const cx = (hash(q, 5) - 0.5) * s * 0.4, cy = -s * 0.1 - hash(q, 6) * s * 0.08; ctx.fillStyle = lg(ctx, cx, cy - 5, cx + 8, cy + 5, [[0, '#ffffff'], [1, '#cfd3d8']]); ctx.fillRect(cx - s * 0.04, cy - s * 0.05, s * 0.08, s * 0.08); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.8; ctx.strokeRect(cx - s * 0.04, cy - s * 0.05, s * 0.08, s * 0.08); }
    ctx.restore();
  };

  // a demitasse on its saucer; fill 0..1 (liquid), foamAmt 0..1 (crema layer on top)
  const drawCup = (ctx, x, y, s, fillV, foamV, t, hl) => {
    ctx.save(); ctx.translate(x, y);
    groundShadow(ctx, 0, s * 0.1, s * 0.62, s * 0.12, 0.5);
    // saucer
    ctx.fillStyle = lg(ctx, 0, -s * 0.06, 0, s * 0.12, [[0, '#ffffff'], [1, '#cfd2d8']]); ell(ctx, 0, s * 0.03, s * 0.56, s * 0.15); ctx.fill(); ctx.strokeStyle = 'rgba(40,50,80,0.45)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.strokeStyle = '#c7a14a'; ctx.lineWidth = 1.6; ell(ctx, 0, s * 0.03, s * 0.5, s * 0.13); ctx.stroke();
    ctx.fillStyle = '#e9ebf0'; ell(ctx, 0, s * 0.03, s * 0.27, s * 0.07); ctx.fill();
    // cup body: small, tapering to the foot, a painted band, a gold rim
    const cw = s * 0.34, ch = s * 0.42;
    ctx.beginPath(); ctx.moveTo(-cw, -ch); ctx.bezierCurveTo(-cw, -ch * 0.2, -cw * 0.7, 0, -cw * 0.5, 0.02 * s); ctx.lineTo(cw * 0.5, 0.02 * s); ctx.bezierCurveTo(cw * 0.7, 0, cw, -ch * 0.2, cw, -ch); ctx.closePath();
    ctx.fillStyle = cyl(ctx, -cw, cw, '#f4f5f8', { hl: 0.3, spec: 0.15, bounce: '#d8e4ff' }); ctx.fill(); ctx.strokeStyle = 'rgba(30,40,70,0.5)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.save(); ctx.clip(); ctx.fillStyle = '#2b57a8'; ctx.fillRect(-cw, -ch * 0.55, cw * 2, s * 0.055); ctx.fillStyle = '#c7a14a'; ctx.fillRect(-cw, -ch * 0.55 + s * 0.065, cw * 2, 1.6); ctx.fillStyle = '#c8281f'; for (let q = -3; q <= 3; q++) { ctx.beginPath(); ctx.arc(q * cw * 0.28, -ch * 0.2, 2.4, 0, TAU); ctx.fill(); } ctx.restore();
    // the handle-less cup's mouth and contents
    const my = -ch, mrx = cw, mry = s * 0.09;
    ctx.fillStyle = '#f8f9fb'; ell(ctx, 0, my, mrx, mry); ctx.fill(); ctx.strokeStyle = '#c7a14a'; ctx.lineWidth = 2; ctx.stroke();
    const level = fillV * s * 0.1 - s * 0.06; // liquid surface sits a little below the rim when empty-ish
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, my, Math.max(0.5, mrx - 2), Math.max(0.5, mry - 1.5), 0, 0, TAU); ctx.clip();
    ctx.fillStyle = '#e8e8ec'; ctx.fillRect(-mrx, my - mry, mrx * 2, mry * 2);
    if (fillV > 0.02) {
      const sy = my + mry * 0.5 - fillV * mry * 0.9;
      ctx.fillStyle = rg(ctx, 0, sy, 1, mrx, [[0, '#4a2a14'], [1, '#1c0e06']]); ell(ctx, 0, sy, Math.max(0.5, mrx - 2), Math.max(0.5, mry - 1.5)); ctx.fill();
      if (foamV > 0.03) { const fy = sy; ctx.globalAlpha = clamp(foamV * 1.4, 0, 1); foam(ctx, 0, fy, Math.max(0.5, mrx - 3), Math.max(0.5, mry - 2), 0, t, { n: 22, seed: 21 }); ctx.globalAlpha = 1; }
      ctx.strokeStyle = 'rgba(255,245,225,0.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(0, sy, Math.max(0.5, mrx - 4), Math.max(0.5, mry - 3), 0, 3.5, 5.1); ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(30,40,70,0.45)'; ctx.lineWidth = 1.2; ell(ctx, 0, my, mrx, mry); ctx.stroke();
    void level;
    if (hl) { ctx.strokeStyle = 'rgba(120,230,255,0.8)'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 5]); ell(ctx, 0, s * 0.03, s * 0.58, s * 0.18); ctx.stroke(); ctx.setLineDash([]); }
    ctx.restore();
  };

  const drawGauge = (ctx, g, V, t) => {
    const s = V.s, x = X(V, 0.935), y0 = Y(V, 0.13), y1 = Y(V, 0.5), w = s * 0.034, h = y1 - y0;
    ctx.save();
    // brass-framed glass tube
    shadowed(ctx, () => { rrect(ctx, x - w * 0.9, y0 - 14, w * 1.8, h + 28, w * 0.9); ctx.fillStyle = '#4a3010'; ctx.fill(); }, { blur: 8, dy: 4, a: 0.5 });
    ctx.fillStyle = lg(ctx, x - w, 0, x + w, 0, [[0, '#6a4a14'], [0.3, '#f0d27a'], [0.7, '#b98a2c'], [1, '#4a3008']]); rrect(ctx, x - w * 0.9, y0 - 14, w * 1.8, h + 28, w * 0.9); ctx.fill();
    ctx.fillStyle = '#0e0905'; rrect(ctx, x - w * 0.5, y0, w, h, w * 0.5); ctx.fill();
    const fl = clamp(f / 1.3, 0, 1), yf = y1 - h * fl;
    const fg = ctx.createLinearGradient(0, y1, 0, y0); fg.addColorStop(0, '#6a3c1a'); fg.addColorStop(0.7, '#c88c4e'); fg.addColorStop(1, '#f0d09a'); ctx.fillStyle = fg; rrect(ctx, x - w * 0.4, yf, w * 0.8, y1 - yf, w * 0.35); ctx.fill();
    // the lit band to stop in and the rim line beyond it
    const b0 = y1 - h * (BAND[1] / 1.3), b1 = y1 - h * (BAND[0] / 1.3);
    ctx.fillStyle = 'rgba(120,255,190,0.28)'; ctx.fillRect(x - w * 0.5, b0, w, b1 - b0); ctx.strokeStyle = 'rgba(140,255,200,0.95)'; ctx.lineWidth = 1.8; ctx.strokeRect(x - w * 0.5, b0, w, b1 - b0);
    const yr = y1 - h * (1 / 1.3); ctx.fillStyle = 'rgba(255,70,50,0.35)'; ctx.fillRect(x - w * 0.5, y0, w, yr - y0); ctx.strokeStyle = '#ff6a4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - w * 0.7, yr); ctx.lineTo(x + w * 0.7, yr); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(x - w * 0.32, y0 + 4, w * 0.12, h - 8);
    // the three rises as lamps above
    for (let i = 0; i < 3; i++) {
      const r = rises[i], cy = y0 - 28 - i * 0 , cx = x + (i - 1) * w * 1.15;
      const col = !r ? '#2a1a0e' : r.over ? '#ff5a3a' : riseScore(r) >= 0.95 ? '#7bffb4' : '#ffd36a';
      ctx.fillStyle = rg(ctx, cx, cy, 1, w * 0.5, [[0, !r ? '#4a3220' : tint(col, 0.5)], [1, col]]); ctx.beginPath(); ctx.arc(cx, cy, w * 0.42, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,230,170,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
      if (r && !r.over) glow(ctx, cx, cy, w, col === '#7bffb4' ? '120,255,180' : '255,210,110', 0.45);
    }
    ctx.restore();
    g.label(ctx, 'FOAM', x, y1 + 26, g.px(15), '#f6e4b4', 'center', '700');
  };

  const drawFlows = (ctx, V, t) => {
    // the ingredients travelling from their jar into the pot
    for (const a of anim.add) {
      const it = ITEMS[a.k], u = clamp(a.t / 0.75, 0, 1), tx = pot.u, ty = BASE - 0.285 - pot.l * LIFT_H;
      if (a.k === 'water') {
        const cx = X(V, it.u + 0.02), cy = Y(V, it.v - 0.04), ex = X(V, tx), ey = Y(V, ty);
        ctx.save(); ctx.globalAlpha = Math.sin(clamp(a.t / 0.9, 0, 1) * Math.PI) ; ctx.strokeStyle = 'rgba(190,225,255,0.85)'; ctx.lineWidth = V.s * 0.011; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.quadraticCurveTo(lerp(cx, ex, 0.5), cy - V.s * 0.05, ex, ey); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = V.s * 0.003; ctx.stroke(); ctx.restore();
      } else {
        const sx = X(V, it.u), sy = Y(V, it.v - 0.08), ex = X(V, tx), ey = Y(V, ty), px = lerp(sx, ex, u), py = lerp(sy, ey, u) - Math.sin(u * Math.PI) * V.s * 0.12;
        ctx.save(); ctx.translate(px, py); ctx.rotate(-0.4 + u * 1.2); spoonProp(ctx, V.s * 0.1, a.k === 'sugar' ? '#e6e0d0' : '#c9a05a'); ctx.restore();
        if (u > 0.82) { ctx.fillStyle = a.k === 'sugar' ? 'rgba(255,255,255,0.9)' : 'rgba(80,44,20,0.9)'; for (let q = 0; q < 6; q++) { ctx.fillRect(ex + (hash(q, 3) - 0.5) * 12, ey + (u - 0.82) * 80 * (0.4 + hash(q, 4)), 2, 2); } }
      }
    }
  };

  const drawStream = (ctx, V, t) => {
    if (!pour || pour.q <= 0.004) return;
    const tilt = pour.tilt, lipU = pour.lip, lipV = LIP_V, qn = pour.qn, ci = pour.lastCup;
    const sx = X(V, lipU - 0.012), sy = Y(V, lipV + 0.012), landU = lipU - 0.02 - 0.06 * qn, ex = X(V, landU), ey = Y(V, ci >= 0 ? 0.585 : 0.69);
    const isFoam = pour.vf > 0.0005 || (pour.foamLast ?? false);
    const w = V.s * (0.003 + 0.011 * qn);
    ctx.save(); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.bezierCurveTo(sx - V.s * 0.02, sy + V.s * 0.02, ex + V.s * 0.01, ey - V.s * 0.08, ex, ey);
    ctx.strokeStyle = isFoam ? '#c88c4e' : '#2a1408'; ctx.lineWidth = w * 1.3; ctx.stroke();
    ctx.strokeStyle = isFoam ? '#f0cf98' : '#7a4a2a'; ctx.lineWidth = w * 0.45; ctx.stroke();
    ctx.restore();
    if (ci < 0) { ctx.fillStyle = 'rgba(40,20,8,0.7)'; ell(ctx, ex, ey, V.s * 0.04, V.s * 0.012); ctx.fill(); }
  };

  const drawCupTray = (ctx, V, t, o) => {
    const s = V.s, y = Y(V, 0.745 + o.dy);
    ctx.save(); ctx.globalAlpha = 1 - o.fade;
    const x0 = X(V, 0.07), x1 = X(V, 0.93);
    shadowed(ctx, () => { rrect(ctx, x0, y - s * 0.12, x1 - x0, s * 0.13, s * 0.05); ctx.fillStyle = '#6a3a1a'; ctx.fill(); }, { blur: 14, dy: 9, a: 0.55 });
    rrect(ctx, x0, y - s * 0.12, x1 - x0, s * 0.13, s * 0.05); ctx.fillStyle = lg(ctx, 0, y - s * 0.12, 0, y + s * 0.01, [[0, '#f0b27a'], [0.2, '#c0652d'], [0.7, '#8a4018'], [1, '#4a200a']]); ctx.fill();
    rrect(ctx, x0 + 6, y - s * 0.105, x1 - x0 - 12, s * 0.095, s * 0.04); ctx.fillStyle = lg(ctx, 0, y - s * 0.105, 0, y - s * 0.01, [[0, '#7a3a14'], [1, '#c98a52']]); ctx.fill();
    ctx.save(); rrect(ctx, x0 + 6, y - s * 0.105, x1 - x0 - 12, s * 0.095, s * 0.04); ctx.clip(); dimples(ctx, x0, y - s * 0.12, x1 - x0, s * 0.13, 90, 0.0045 * s, 9, 0.7); ctx.restore();
    ctx.strokeStyle = 'rgba(255,225,180,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + s * 0.04, y - s * 0.118); ctx.lineTo(x1 - s * 0.04, y - s * 0.118); ctx.stroke();
    ctx.restore();
  };

  const scene = (ctx, V, g) => {
    const t = now, heatK = heatAt(pot.u) * (1 - 0.88 * sm(pot.l / 0.55));
    const pk = sm(pourK), dy = pk * 0.28;
    // ingredients on a board along the back (dimmed once the pot is on the sand)
    const dim = phase === 'prep' ? 1 : 0.55 - 0.3 * pk, iA = Math.max(0, dim - pk * 0.8);
    if (iA > 0.02) {
      ctx.save(); ctx.globalAlpha = iA; const by = Y(V, 0.31);
      shadowed(ctx, () => { rrect(ctx, X(V, 0.04), by, X(V, 0.66) - X(V, 0.04), V.s * 0.032, 6); ctx.fillStyle = '#3a2410'; ctx.fill(); }, { blur: 8, dy: 5, a: 0.5 });
      ctx.fillStyle = lg(ctx, 0, by, 0, by + V.s * 0.032, [[0, '#a8743a'], [1, '#5a3a1c']]); rrect(ctx, X(V, 0.04), by, X(V, 0.66) - X(V, 0.04), V.s * 0.032, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(255,225,170,0.35)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(X(V, 0.05), by + 1.5); ctx.lineTo(X(V, 0.65), by + 1.5); ctx.stroke();
      drawJug(ctx, X(V, ITEMS.water.u), Y(V, ITEMS.water.v) , V.s * 0.2, 1, t); drawTin(ctx, X(V, ITEMS.coffee.u), Y(V, ITEMS.coffee.v), V.s * 0.2, 1); drawBowl(ctx, X(V, ITEMS.sugar.u), Y(V, ITEMS.sugar.v), V.s * 0.2, 1);
      ctx.restore();
      if (phase === 'prep') for (const k of ['water', 'coffee', 'sugar']) {
        const it = ITEMS[k], cx = X(V, it.u), cy = Y(V, it.v + 0.115), nd = need()[k];
        if (nd === 0 && ing[k] === 0) continue;
        ctx.save(); rrect(ctx, cx - 26, cy - 11, 52, 22, 11); ctx.fillStyle = 'rgba(14,9,6,0.7)'; ctx.fill();
        g.label(ctx, `${ing[k]}`, cx, cy + 1, g.px(17), ing[k] === nd ? '#8ef0a8' : ing[k] > nd ? '#ff8a6a' : '#f6e4b4', 'center', '800'); ctx.restore();
      }
    }
    // the order: little cups waiting on the shelf
    if (pk < 0.9) {
      ctx.save(); ctx.globalAlpha = 1 - pk;
      const ox = X(V, 0.79), oy = Y(V, 0.335);
      for (let i = 0; i < order.n; i++) drawCup(ctx, ox + (i - (order.n - 1) / 2) * V.s * 0.085, oy, V.s * 0.095, 0, 0, t, false);
      ctx.restore();
      if (order.sweet) { ctx.save(); ctx.globalAlpha = 1 - pk; ctx.fillStyle = '#fff'; for (let i = 0; i < 2; i++) { ctx.fillRect(ox - 8 + i * 10, oy + 17, 8, 8); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.strokeRect(ox - 8 + i * 10, oy + 17, 8, 8); } ctx.restore(); }
    }
    drawSandTray(ctx, V, t, { dy, fade: pk, heat: heatK });
    if (pk > 0.02) drawCupTray(ctx, V, t, { dy: 0.28 * (1 - pk), fade: 1 - pk });
    // pot or pot-in-hand
    if (phase !== 'pour' || pk < 1) {
      const lift = pot.l * LIFT_H, x = pot.u, y = BASE - lift;
      if (pk < 0.98) {
        groundShadow(ctx, X(V, x), Y(V, BASE + 0.012), V.s * (0.13 - 0.05 * pot.l), V.s * 0.032, 0.55 * (1 - 0.5 * pot.l) * (1 - pk));
        if (heatK > 0.1 && pot.l < 0.6) glow(ctx, X(V, x), Y(V, BASE + 0.02), V.s * 0.2, '255,110,40', 0.28 * heatK);
      }
      if (phase !== 'pour') {
        drawPot(ctx, V, { x, y, f, heat: heatK * (1 - pot.l), boil: anim.boil, level: ing.water > 0 ? 1 : 0, t, tilt: 0 });
        steam(ctx, X(V, x - 0.02), Y(V, y - 0.3), V.s * 0.1, V.s * 0.3, t, clamp((Tl - 0.35) * 1.4, 0, 1) * (ing.water > 0 ? 1 : 0.2), { seed: 3 });
        // a grab ring while idle in the dock of the sand
        if (!pot.grab && !done && phase !== 'prep') { ctx.save(); ctx.strokeStyle = `rgba(120,230,255,${0.35 + 0.25 * Math.sin(t * 3)})`; ctx.lineWidth = 2.2; ctx.setLineDash([6, 5]); ell(ctx, X(V, x + 0.01), Y(V, y - 0.14), V.s * 0.145, V.s * 0.2); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
      }
    }
    if (phase === 'pour' && pour) {
      // cups
      for (let i = 0; i < order.n; i++) {
        const c = pour.cups[i], cy = Y(V, 0.695 + 0.28 * (1 - pk));
        drawCup(ctx, X(V, cupU(i)), cy, V.s * 0.2, c.fill, Math.min(1, c.foam / Math.max(0.01, foamShare())) * clamp(1 - c.broke * 1.6, 0.25, 1), t, pour.lastCup === i && pour.q > 0);
        if (pour.cups[i].fill > 0.02) steam(ctx, X(V, cupU(i)), cy - V.s * 0.1, V.s * 0.05, V.s * 0.14, t + i, 0.5, { seed: 7 + i, n: 5 });
      }
      // the pot held by its handle, tilted about its lip
      const lipV = LIP_V;
      drawStream(ctx, V, t);
      ctx.save(); ctx.translate(0, 0);
      const px = pour.lip + 0.082, py = lipV + 0.285;
      drawPot(ctx, V, { x: px, y: py, heat: 0, boil: 0, level: (pour.vf + pour.vl) / pour.vt0 > 0.02 ? 1 : 0, t, tilt: pour.tilt * 0.9, f: pour.vf0 > 0 ? (pour.vf / pour.vf0) * 0.95 : 0 });
      ctx.restore();
      steam(ctx, X(V, pour.lip + 0.08), Y(V, 0.2), V.s * 0.07, V.s * 0.2, t, clamp((pour.vf + pour.vl) / pour.vt0, 0, 1) * 0.5, { seed: 8, n: 6 });
    }
    drawFlows(ctx, V, t);
    if (phase !== 'pour') drawGauge(ctx, g, V, t);
  };

  const draw = (g, Rt) => {
    const { ctx } = g, W0 = Rt.work, Wk = { x: W0.x, y: W0.y + 38, w: W0.w, h: W0.h - 40 };
    const s = Math.min(Wk.h / SH, Wk.w / SW), V = { ox: Wk.x + (Wk.w - s * SW) / 2, oy: Wk.y + (Wk.h - s * SH) / 2, s };
    geo = { ox: V.ox, oy: V.oy, s };
    ctx.save(); ctx.beginPath(); ctx.rect(W0.x, W0.y, W0.w, W0.h + 10); ctx.clip();
    scene(ctx, V, g);
    ctx.restore();
    dockGauge(g, ctx, W0, { dot: phase === 'pour' ? '#f0cf98' : `rgb(${Math.round(80 + 175 * clamp(Tl, 0, 1))},${Math.round(60 + 60 * (1 - Math.abs(Tl - 0.7)))},40)`, fill: (x, y, wd, ht) => {
      const gr = ctx.createLinearGradient(x, 0, x + wd, 0); gr.addColorStop(0, '#3a2a22'); gr.addColorStop(0.5, '#b84a1a'); gr.addColorStop(1, '#ffc040'); ctx.fillStyle = gr; ctx.globalAlpha = 0.6; rrect(ctx, x + 1, y + 1, wd - 2, ht - 2, 4); ctx.fill(); ctx.globalAlpha = 1;
      if (phase !== 'pour') { ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2; const mx = x + wd * clamp(Tl / 1.1, 0, 1); ctx.beginPath(); ctx.moveTo(mx, y + ht + 2); ctx.lineTo(mx - 5, y + ht + 10); ctx.lineTo(mx + 5, y + ht + 10); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      else { const F = clamp((pour.vf + pour.vl) / pour.vt0, 0, 1); ctx.fillStyle = '#3a1d0c'; rrect(ctx, x + 1, y + 1, (wd - 2) * F, ht - 2, 4); ctx.fill(); }
    } });
    hintPill(g, ctx, W0, hint());
    // reference: the finished cup, foam crown and all
    const th = Rt.thumb, cx = th.x + th.w / 2, cy = th.y + th.h * 0.74, cs = Math.min(th.w, th.h) * 0.86;
    ctx.save(); ctx.beginPath(); ctx.rect(th.x, th.y, th.w, th.h); ctx.clip();
    glow(ctx, cx, th.y + th.h * 0.35, th.w * 0.6, '255,200,120', 0.22);
    drawCup(ctx, cx, cy, cs, 0.98, 1, now, false); steam(ctx, cx, cy - cs * 0.46, cs * 0.12, cs * 0.5, now, 0.7, { seed: 2, n: 6 });
    ctx.restore();
  };
  const titleArt = (g, S, t) => {
    const { ctx } = g, s = Math.min(S.w / SW, S.h / SH) * 0.98, V = { ox: S.x + (S.w - s * SW) / 2, oy: S.y + (S.h - s * SH) / 2, s };
    const sp = { ...pot }, sf = f, sTl = Tl, sph = phase; pot = { ...pot, u: 0.7, l: 0 }; f = 0.88; Tl = 0.9; phase = 'heat';
    const oi = ing; ing = { water: 2, coffee: 2, sugar: 0, log: [] };
    scene(ctx, V, g);
    pot = sp; f = sf; Tl = sTl; phase = sph; ing = oi;
    void t;
  };

  const hint = () => {
    if (done) return '';
    if (phase === 'prep') { const nd = need(); const ln = []; if (ing.water < nd.water) ln.push('water'); if (ing.coffee < nd.coffee) ln.push('coffee'); if (ing.sugar < nd.sugar) ln.push('sugar'); return ln.length ? `Order: ${order.n} cups, ${order.sweet ? 'medium sweet' : 'plain'}. Tap to add ${ln.join(', ')}.` : 'Everything is in: slide the pot onto the hot sand.'; }
    if (phase === 'heat') { if (rises.length >= 3) return 'Three rises. Lift the pot away from the sand.'; if (f > 0.74) return 'Lift it now! The foam keeps climbing a little after.'; if (f > 0.55) return 'Nearly: get ready to lift it off.'; return `Rise ${rises.length + 1} of 3: keep the pot on the sand until the foam climbs to the green band.`; }
    if (!pour) return '';
    return pour.vf > 0.0005 ? 'Foam first: hold the handle, lift it to tilt, a little foam in each cup.' : 'Now the coffee, down the side, gently. Move the pot over each cup in turn.';
  };
  const state = () => ({ technique: 'brew', mode: 'cezve', phase, order, ing: { water: ing.water, coffee: ing.coffee, sugar: ing.sugar }, pot: { u: r3(pot.u), l: r3(pot.l) }, Tm: r3(Tm), Tl: r3(Tl), f: r3(f), rises: rises.map((r) => ({ peak: r3(r.peak), over: r.over })), spills, lost: r3(lost),
    pour: pour ? { lip: r3(pour.lip), tilt: r3(pour.tilt), q: r3(pour.q), vf: r3(pour.vf), vl: r3(pour.vl), vf0: r3(pour.vf0), vt0: r3(pour.vt0), waste: r3(pour.waste), cups: pour.cups.map((c) => ({ fill: r3(c.fill), foam: r3(c.foam), broke: r3(c.broke) })) } : null,
    parts: { prep: r3(prepPts()), rises: r3(risePts()), pour: r3(pourPts()) } });
  const r3 = (v) => Math.round(v * 1000) / 1000;

  init();
  return {
    init, items, control, work, tick, draw, attract, titleArt, result: () => done, score: totalScore, hint, compact: true,
    info: () => [phase === 'prep' ? `Order: ${order.n} cups, ${order.sweet ? 'medium sweet' : 'plain'}` : phase === 'heat' ? `Rise ${Math.min(3, rises.length + 1)} of 3${spills ? `, ${spills} boil-over` : ''}` : `Pour: ${order.n} cups`, `Score ${score()}`],
    get caption() { return SC.words?.caption ?? 'Brew this coffee'; },
    rules: () => [
      'Order: the slip lists the cups and the sugar. Tap the jug once for each cup of water, the tin once for each spoon of coffee (one per cup) and the sugar bowl for plain or medium sweet. Undo takes the last one back. The pot will not go on the sand until water and coffee are in.',
      'Slide the pot onto the glowing sand to heat it; drag it up and away to lift it off the heat. Foam climbs slowly in the mouth. The gauge shows the foam: lift the pot while it is in the green band. The copper keeps its heat, so the foam climbs a little after you lift.',
      'Three rises, each one allowed to settle before the next. Foam that crosses the red line is a boil-over: that rise earns nothing, some coffee is lost, and it runs down the pot.',
      'Pouring: hold the handle, lift it to tilt (a fuller pot needs less tilt) and slide over the cups. The foam leaves first: give every cup the same share. Then pour the coffee down the side; a hard stream breaks the crema. Fill each cup nearly to the rim; a stream that misses a cup is lost.',
      'Score: ingredients 15, the three rises 45 (peak in the green band), foam shared, crema kept and cups level 40. Nothing done scores nothing.',
    ],
    point(id) {
      if (!geo) return null;
      const P2 = (u, v) => ({ x: geo.ox + u * geo.s, y: geo.oy + v * geo.s });
      const [k, rest] = id.split(':');
      if (k === 'jug') return P2(ITEMS.water.u, ITEMS.water.v);
      if (k === 'tin') return P2(ITEMS.coffee.u, ITEMS.coffee.v);
      if (k === 'bowl') return P2(ITEMS.sugar.u, ITEMS.sugar.v);
      if (k === 'pot') return P2(pot.u + 0.02, BASE - pot.l * LIFT_H - 0.13);
      if (k === 'sand') return P2(Number(rest), BASE - 0.13);     // where the grab point goes for a pot centred at u
      if (k === 'lift') return P2(Number(rest), BASE - LIFT_H - 0.13);
      if (k === 'handle') { const [lip, tl] = rest.split(',').map(Number); const h = handleEnd(lip, tl); return P2(h[0], h[1]); }   // the handle end for a lip at u and tilt 0..1
      if (k === 'cup') return P2(cupU(Number(rest)), 0.6);
      return null;
    },
    state,
  };
}

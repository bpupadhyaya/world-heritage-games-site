// shape-craft `brew`, mode "syrup" (1.26.0): Cambodian palm sugar. Sap boils in a wide wok over a wood fire.
//   Boil    keep the fire in its window (Feed and Ease), and sweep the paddle across the wok in rhythm, left then right, on the lit marks:
//           a steady stroke stops the sugar catching on the bottom. The sap thickens and darkens as it boils.
//   Test    lift a spoon and watch the thread the syrup draws: pour when the thread reaches the mark on the card.
//   Fill    ladle the syrup into the row of small bamboo moulds, each to its line, before it sets in the wok.
// Score 0-100 beyond the passive baseline: boil 50 (stir rhythm 25, fire in its window 15, nothing scorched 10), thickness at the pour 20, moulds 30.
import { starsFor } from './geom.js';
import { fx as synth } from '../../../platform/engine-kit/synth.js';
import { hintPill, dockGauge } from './paint-ui.js';
import { shadowed, rrect } from './fx.js';
import { clamp, lerp, sm, cyl, bubble, steam, glow, groundShadow, embers, tint, mix, rgba, lg, rg, ell, TAU, hash } from './brew-art.js';

const SW = 1, SH = 0.8;
const WOK = { cx: 0.46, cy: 0.4, rx: 0.31, ry: 0.088 };
const SUR = { dy: 0.012, rx: 0.268, ry: 0.066 };
const MK = 0.19;                       // marker offset from the wok centre
const WIN = [0.36, 0.72];              // the fire's window
const COLS = 5, ROWS = 2, NM = COLS * ROWS, M_R = 0.056, LINE = 0.9;
const FILL_K = 0.55;                   // size of the wok cluster while ladling

const mkSound = (audio) => {
  const F = (kind, p) => { try { return synth(audio, kind, p); } catch { return false; } };
  return {
    feed() { F('impact', { mat: 'wood', hz: 200, vel: 0.5 }); F('whoosh', { dur: 0.3, vel: 0.3, down: false, delay: 0.1 }); },
    ease() { F('impact', { mat: 'wood', hz: 150, vel: 0.35 }); F('whoosh', { dur: 0.2, vel: 0.2, down: true, delay: 0.05 }); },
    stroke(q, T) { F('scrape', { hz: 520 + 500 * (1 - T), dur: 0.22, vel: 0.35 + 0.15 * q }); if (q >= 1) F('good', { hz: 700 + 300 * T, vel: 0.15, delay: 0.02 }); },
    miss() { F('tick', { hz: 800, vel: 0.2 }); },
    bubble(T) { F('pop', { hz: 240 + 160 * (1 - T), vel: 0.1 + 0.06 * T }); },
    sizzle() { F('scrape', { hz: 3800, dur: 0.3, vel: 0.35 }); },
    scorch() { F('bad', { hz: 180, vel: 0.3 }); F('scrape', { hz: 4200, dur: 0.3, vel: 0.3, delay: 0.05 }); },
    spill() { F('splash', { vel: 0.5 }); F('bad', { hz: 220, vel: 0.3, delay: 0.1 }); },
    test() { F('whoosh', { dur: 0.25, vel: 0.25, down: false }); },
    dip() { F('splash', { vel: 0.2 }); F('impact', { mat: 'wood', hz: 330, vel: 0.2, delay: 0.1 }); },
    pour(f) { F('scrape', { hz: 600 + f * 1300, dur: 0.12, vel: 0.3 }); },
    lineHit() { F('good', { hz: 880, vel: 0.35 }); },
    win(stars) { F('good', { hz: 600 + stars * 80, vel: 0.5 }); F('ring', { hz: 1568, dur: 0.9, vel: 0.2, delay: 0.1 }); },
  };
};

const syrupColor = (T) => { const k = clamp(T, 0, 1.1); const st = [[0, '#f0d27a'], [0.3, '#e8b84a'], [0.55, '#d28a22'], [0.78, '#a85a16'], [1, '#5a2808']]; for (let i = 1; i < st.length; i++) if (k <= st[i][0]) { const [a, ca] = st[i - 1], [b, cb] = st[i]; return mix(ca, cb, (k - a) / (b - a)); } return '#5a2808'; };
const threadLen = (T) => clamp((T - 0.42) / 0.5, 0, 1.15);
const threadName = (T) => (T < 0.42 ? 'runs like water' : T < 0.55 ? 'thin ribbon' : T < 0.68 ? 'ribbon' : T < 0.78 ? 'soft thread' : T < 0.88 ? 'firm thread' : 'brittle');

export function createSyrup(P, env) {
  const { rng, fx } = env, SC = P.scene ?? {}, W = SC.words ?? {};
  const snd = mkSound(env.audio);
  if (env.options?.soundLog) for (const k of Object.keys(snd)) { const f = snd[k]; snd[k] = (...a) => { env.options.soundLog.push({ kind: `syrup.${k}` }); return f(...a); }; }
  let phase, now, pT, done, geo, bo, fl, sndT, auto, tip, ptr, msg, msgT, tgt;

  const init = () => {
    phase = 'boil'; now = 0; pT = 0; done = null; sndT = { stroke: 0, bubble: 0, sizzle: 0, pour: 0 }; ptr = null; msg = ''; msgT = 0;
    tgt = 0.74 + rng.next() * 0.08;
    bo = { F: 0.3, T: 0.1, foam: 0, S: 0, since: 0, P: 1.05 + rng.next() * 0.3, t0: 1.2, k: 0, beats: [], credited: false, boilT: 0, inWin: 0, spills: 0, testT: -9, tested: 0, testLen: 0, feedT: -9, wake: 0, lastTipU: 0.46, speed: 0, warned: false, near: false, atBeat: false, passed: false, started: false };
    tip = { u: WOK.cx, v: WOK.cy + SUR.dy, down: false };
    fl = { moulds: Array.from({ length: NM }, () => ({ f: 0, hit: false, spill: 0 })), load: 0, dip: 0, held: -1, tFill: 0, lu: 0.4, lv: 0.3, spills: 0, fillK: 0, started: false, finished: 0, pourT: 0, setK: 0 };
    auto = { wait: 0.4, read: false, pour: false };
  };
  const nextBeat = () => bo.t0 + bo.k * bo.P;
  const sideOf = (k) => (k % 2 === 0 ? -1 : 1);
  const markU = (k) => WOK.cx + sideOf(k) * MK;
  const rhythm = () => (bo.beats.length ? bo.beats.reduce((s, q) => s + q, 0) / bo.beats.length : 0);
  const boilFactor = () => clamp(bo.boilT / 9, 0, 1);
  const heatFrac = () => (bo.boilT > 1 ? clamp(bo.inWin / bo.boilT, 0, 1) : 0);
  const scorchOK = () => clamp(1 - bo.S / 0.5, 0, 1) * clamp(1 - 0.25 * bo.spills, 0, 1);
  const boilPts = () => boilFactor() * (25 * rhythm() + 15 * heatFrac() + 10 * scorchOK());
  const thickScore = () => (fl.started ? clamp(1 - Math.max(0, Math.abs(bo.T - tgt) - 0.04) / 0.16, 0, 1) : 0);
  const mouldScore = () => { const e = fl.moulds.map((m) => clamp(1 - Math.abs(m.f - LINE) / 0.25, 0, 1)); const mean = e.reduce((s, v) => s + v, 0) / NM; return mean * clamp(1 - 0.1 * fl.spills, 0.6, 1); };
  const score = () => Math.round(Math.min(100, boilPts() + 20 * thickScore() + 30 * (fl.started ? mouldScore() : 0)));
  const totalScore = () => (done ? done.score : score());

  // ---- geometry of the two layouts -------------------------------------------------------------------------------------------------------
  const ck = () => lerp(1, FILL_K, sm(fl.fillK));
  const wokC = () => { const k = sm(fl.fillK); return { cx: lerp(WOK.cx, 0.27, k), cy: lerp(WOK.cy, 0.27, k) }; };
  const clusterV = (V) => { const c = ck(), w = wokC(); return { ox: V.ox + (w.cx - WOK.cx * c) * V.s, oy: V.oy + (w.cy - WOK.cy * c) * V.s, s: V.s * c }; };
  const mouldPos = (i) => ({ u: 0.2 + 0.15 * (i % COLS), v: 0.585 + 0.125 * Math.floor(i / COLS) });

  // ---- actions ---------------------------------------------------------------------------------------------------------------------------
  const begin = () => { if (!bo.started) { bo.started = true; bo.t0 = now + 1.2; } };
  const note = (m, t = 2.2) => { msg = m; msgT = t; };
  const feed = () => { if (done || phase !== 'boil') return; bo.F = Math.min(1, bo.F + 0.3); bo.feedT = now; snd.feed(); if (geo) fx.emit('spark', geo.ox + WOK.cx * geo.s, geo.oy + 0.62 * geo.s, { count: 7, color: '#ffb060', size: 4, speed: 90, life: 0.8, gravity: -60 }); };
  const ease = () => { if (done || phase !== 'boil') return; bo.F = Math.max(0.05, bo.F - 0.3); snd.ease(); };
  const test = () => { if (done || phase !== 'boil' || bo.testT > now - 1.6 || bo.boilT < 0.5) return; bo.testT = now; bo.tested++; bo.testLen = threadLen(bo.T); snd.test(); };
  const startFill = () => { if (done || phase !== 'boil') return; phase = 'fill'; pT = 0; fl.started = true; fl.load = 3.5; fl.lu = 0.4; fl.lv = 0.3; note(`Poured at the ${threadName(bo.T)} stage`); };
  const finish = () => {
    if (done) return;
    const s = score(), stars = starsFor(s);
    done = { score: s, max: 100, stars, headline: stars === 3 ? (W.win ?? 'Golden sugar in every mould') : stars ? (W.ok ?? 'A good batch') : (W.retry ?? 'Back to the wok'), detail: `Boil ${Math.round(boilPts())} of 50 (rhythm ${Math.round(100 * rhythm())} percent, fire in its window ${Math.round(100 * heatFrac())} percent), thickness ${Math.round(20 * thickScore())} of 20, moulds ${Math.round(30 * (fl.started ? mouldScore() : 0))} of 30` };
    snd.win(stars);
    if (geo) fx.emit('spark', geo.ox + 0.5 * geo.s, geo.oy + 0.55 * geo.s, { count: 14, color: '#ffd89a', size: 7, speed: 150, life: 0.9, gravity: 160 });
  };
  const tinyView = () => (env.ui?.buttonH?.(0) ?? 0) > 150;   // a live preview about 140 css px wide: one button only, so the work area never goes negative
  const items = () => {
    const all = items0();
    return tinyView() ? all.filter((i) => i.primary) : all;
  };
  const items0 = () => {
    if (phase === 'boil') return [{ id: 'feed', kind: 'btn', label: 'Feed' }, { id: 'ease', kind: 'btn', label: 'Ease' }, { id: 'test', kind: 'btn', label: 'Test' }, { id: 'check', kind: 'btn', label: 'Ladle', primary: true }];
    return [{ id: 'check', kind: 'btn', label: 'Let it set', primary: true }];
  };
  const control = (id) => {
    if (done) return;
    begin();
    if (id === 'feed') feed(); else if (id === 'ease') ease(); else if (id === 'test') test(); else if (id === 'ladle') startFill();
    else if (id === 'check') { if (phase === 'boil') startFill(); else finish(); }
  };

  // ---- the pointer -------------------------------------------------------------------------------------------------------------------------
  const toLocal = (x, y) => [(x - geo.ox) / geo.s, (y - geo.oy) / geo.s];
  const work = (p) => {
    if (!geo || done || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    ptr = { x: p.x, y: p.y };
    const [u, v] = toLocal(p.x, p.y);
    if (p.pressed) begin();
    if (phase === 'boil') {
      tip.down = p.down;
      if (p.down) { const nx = (u - WOK.cx) / SUR.rx, ny = (v - (WOK.cy + SUR.dy)) / SUR.ry, r = Math.hypot(nx, ny), k = r > 1 ? 1 / r : 1; tip.u = WOK.cx + nx * k * SUR.rx; tip.v = WOK.cy + SUR.dy + ny * k * SUR.ry; }
    } else if (phase === 'fill') {
      let hi = -1, bd = 0.085; for (let i = 0; i < NM; i++) { const m = mouldPos(i), d = Math.hypot(u - m.u, v - m.v); if (d < bd) { bd = d; hi = i; } }
      fl.held = p.down ? hi : -1;
    }
  };

  const tick = (dt) => {
    now += dt; pT += dt; msgT = Math.max(0, msgT - dt);
    for (const k of Object.keys(sndT)) sndT[k] -= dt;
    if (phase === 'boil') boilTick(dt); else if (phase === 'fill') fillTick(dt);
  };
  const boilTick = (dt) => {
    if (!bo.started) return;   // the sap only starts to boil, and the beats only begin, at the first touch (nothing sounds before it)
    const testing = bo.testT > now - 1.6;
    bo.F += (0.2 - bo.F) * 0.12 * dt;
    bo.boilT += dt;
    if (bo.F >= WIN[0] && bo.F <= WIN[1]) bo.inWin += dt;
    // sap thickens as it boils; faster on a stronger fire
    bo.T = Math.min(1.05, bo.T + (0.016 + 0.1 * Math.pow(bo.F, 1.3)) * (1 - 0.35 * bo.T) * dt);
    // a young, thin sap froths up and over on a fire that is too strong
    if (bo.F > 0.78 && bo.T < 0.5) bo.foam += (bo.F - 0.78) * 2.2 * dt; else bo.foam = Math.max(0, bo.foam - 0.3 * dt);
    if (bo.foam > 1) { bo.foam = 0.35; bo.spills++; snd.spill(); note('The sap frothed over: ease the fire'); if (geo) fx.emit('drop', geo.ox + WOK.cx * geo.s, geo.oy + 0.3 * geo.s, { count: 10, color: '#e0a030', size: 5, speed: 120, life: 0.7, gravity: 500, spread: Math.PI, angle: -Math.PI / 2 }); }
    // the beats and the strokes: at the beat the paddle should be on the lit mark (perfect); near it a moment either side counts less
    if (!testing) bo.since += dt;
    const tk = nextBeat();
    if (!testing) {
      const mu = markU(bo.k), d = Math.hypot(tip.u - mu, tip.v - (WOK.cy + SUR.dy)), nearNow = tip.down && d < 0.075;
      if (nearNow && Math.abs(now - tk) <= 0.3 && !bo.near) { bo.near = true; bo.since = 0; if (geo) fx.emit('spark', geo.ox + mu * geo.s, geo.oy + (WOK.cy + SUR.dy) * geo.s, { count: 3, color: '#ffe8a0', size: 3, speed: 50, life: 0.4, gravity: -20 }); }
      if (!bo.passed && now >= tk) { bo.passed = true; bo.atBeat = nearNow; if (nearNow) { bo.since = 0; snd.stroke(1, bo.T); } else if (bo.near) snd.stroke(0.6, bo.T); }
      bo.credited = bo.atBeat ? 1 : bo.near ? 0.6 : false;
      if (now > tk + 0.3) { bo.beats.push(bo.atBeat ? 1 : bo.near ? 0.6 : 0); if (!bo.near && !bo.atBeat) snd.miss(); bo.near = false; bo.atBeat = false; bo.passed = false; bo.credited = false; bo.k++; }
    } else if (now > tk + 0.3) { bo.k++; bo.near = false; bo.atBeat = false; bo.passed = false; bo.credited = false; }
    // the paddle's wake
    bo.speed = Math.abs(tip.u - bo.lastTipU) / Math.max(dt, 1e-6); bo.lastTipU = tip.u; bo.wake = Math.max(0, bo.wake - dt * 1.5) + (tip.down ? Math.min(0.1, bo.speed * dt * 0.8) : 0);
    // scorching: a fire and thick sugar with nobody stirring
    const risk = bo.F * (0.4 + 0.8 * bo.T) * clamp((bo.since - 1.3) / 1.0, 0, 1);
    if (risk > 0.05) { bo.S += risk * 0.32 * dt; if (sndT.sizzle <= 0) { sndT.sizzle = 0.8; snd.sizzle(); } }
    if (bo.S > 0.25 && !bo.warned) { bo.warned = true; snd.scorch(); note('It is catching on the bottom: keep the paddle moving'); }
    if (bo.F > 0.3 && sndT.bubble <= 0) { sndT.bubble = Math.max(0.08, 0.2 + 0.25 * bo.T - 0.1 * bo.F); snd.bubble(bo.T); }
  };
  const fillTick = (dt) => {
    fl.fillK = clamp(fl.fillK + dt / 0.9, 0, 1);
    if (pT < 0.9) return;
    fl.tFill += dt;
    const setK = clamp(fl.tFill / 40, 0, 1), visc = (0.5 + 1.6 * bo.T * bo.T) * (1 + 0.02 * fl.tFill), rate = (1.25 / visc) * (1 - setK * setK);
    fl.setK = setK;
    if (fl.dip > 0) { fl.dip -= dt; fl.lu += (0.3 - fl.lu) * Math.min(1, dt * 9); fl.lv += (0.3 - fl.lv) * Math.min(1, dt * 9); if (fl.dip <= 0) fl.load = 3.5; return; }
    if (fl.load <= 0.001 && fl.held >= 0) { fl.dip = 0.8; snd.dip(); fl.held = -1; return; }
    let tu = 0.38, tv = 0.33;
    if (fl.held >= 0) { const m = mouldPos(fl.held); tu = m.u + 0.05; tv = m.v - 0.15; }
    fl.lu += (tu - fl.lu) * Math.min(1, dt * 10); fl.lv += (tv - fl.lv) * Math.min(1, dt * 10);
    if (fl.held >= 0 && Math.hypot(fl.lu - tu, fl.lv - tv) < 0.05 && fl.load > 0.001) {
      const m = fl.moulds[fl.held], dv = Math.min(rate * dt, fl.load);
      if (dv > 0.0001) {
        m.f += dv; fl.load -= dv; fl.pourT += dt;
        if (m.f > LINE - 0.015 && m.f < LINE + 0.02 && !m.hit) { m.hit = true; snd.lineHit(); }
        if (m.f > 1.0) { if (m.spill === 0) { fl.spills++; snd.spill(); } m.spill += m.f - 1.0; m.f = 1.0; }
        if (sndT.pour <= 0) { sndT.pour = 0.12; snd.pour(m.f); }
      }
    }
    if (setK >= 1 && !fl.finished) { fl.finished = 1; note('The syrup has set in the wok'); }
  };

  // ---- Watch and learn -----------------------------------------------------------------------------------------------------------------------
  const attract = (dt) => {
    if (done) return;
    begin();
    if (auto.wait > 0) { auto.wait -= dt; return; }
    if (phase === 'boil') {
      // the cook keeps the fire in its window, sweeps in time and tests the thread until it reaches the mark
      const k = bo.k, tk = nextBeat(), prevT = tk - bo.P, f = clamp((now - prevT) / bo.P, 0, 1), a = markU(k - 1), b = markU(k);
      tip.down = true; tip.u = lerp(a, b, sm(Math.min(1, f * 1.08))); tip.v = WOK.cy + SUR.dy + 0.012 * Math.sin(f * TAU);
      if (bo.F < 0.46 && now - bo.feedT > 1.5 && bo.boilT > 0.5) feed();
      if (bo.F > 0.7) ease();
      if (bo.T >= tgt - 0.2 && bo.testT < now - 1.7 && bo.boilT > 4) test();
      if (bo.testT > 0 && now - bo.testT > 1.3 && now - bo.testT < 1.5 && !auto.read) { auto.read = true; if (bo.testLen >= threadLen(tgt) - 0.2) auto.pour = true; }
      if (now - bo.testT > 1.55) auto.read = false;
      if (auto.pour && now - bo.testT > 1.55) { auto.pour = false; startFill(); auto.wait = 0.6; }
      return;
    }
    if (phase === 'fill') {
      if (pT < 1.1) return;
      if (fl.dip > 0) { fl.held = -1; return; }
      // work along the rows, holding on each mould until it is at its line, topping up the low ones
      const mi = fl.moulds.findIndex((m) => m.f < LINE - 0.012);
      if (mi < 0) { fl.held = -1; auto.wait = 0.6; finish(); return; }
      fl.held = mi;
    }
  };

  // ---- drawing -----------------------------------------------------------------------------------------------------------------------------
  const X = (V, u) => V.ox + u * V.s, Y = (V, v) => V.oy + v * V.s;

  const drawFlame = (ctx, x, y, w, h, t, seed, a = 1) => {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 5; k++) {
      const fx0 = x + (k - 2) * w * 0.22, hh = h * (0.55 + 0.45 * Math.sin(t * (5 + k) + seed + k * 1.7) * 0.5 + 0.25 * hash(k, seed)), sw = Math.sin(t * 6 + k + seed) * w * 0.05;
      ctx.fillStyle = `rgba(255,${100 + k * 18},30,${0.5 * a})`; ctx.beginPath(); ctx.moveTo(fx0 - w * 0.15, y); ctx.quadraticCurveTo(fx0 - w * 0.08 + sw, y - hh * 0.6, fx0 + sw * 1.4, y - hh); ctx.quadraticCurveTo(fx0 + w * 0.1 + sw, y - hh * 0.5, fx0 + w * 0.15, y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgba(255,235,150,${0.5 * a})`; ctx.beginPath(); ctx.moveTo(fx0 - w * 0.07, y); ctx.quadraticCurveTo(fx0 + sw * 0.6, y - hh * 0.45, fx0 + sw * 0.8, y - hh * 0.6); ctx.quadraticCurveTo(fx0 + w * 0.05, y - hh * 0.3, fx0 + w * 0.07, y); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  };
  // the earthen stove: a clay drum with a fire mouth, logs and flames; the wok sits on top
  const drawStove = (ctx, V, t) => {
    const s = V.s, sx = X(V, WOK.cx), top = Y(V, WOK.cy + 0.03), bot = Y(V, 0.745), hw = s * 0.25;
    groundShadow(ctx, sx, bot + 4, s * 0.3, s * 0.05, 0.55);
    const body = () => { ctx.beginPath(); ctx.moveTo(sx - hw * 0.92, top); ctx.bezierCurveTo(sx - hw * 1.04, top + (bot - top) * 0.4, sx - hw * 1.12, top + (bot - top) * 0.75, sx - hw * 1.1, bot); ctx.lineTo(sx + hw * 1.1, bot); ctx.bezierCurveTo(sx + hw * 1.12, top + (bot - top) * 0.75, sx + hw * 1.04, top + (bot - top) * 0.4, sx + hw * 0.92, top); ctx.closePath(); };
    body(); ctx.fillStyle = cyl(ctx, sx - hw * 1.1, sx + hw * 1.1, '#b0623a', { hl: 0.3, spec: 0.22, bounce: '#ff8a3a' }); ctx.fill();
    ctx.save(); body(); ctx.clip();
    for (let q = 0; q < 70; q++) { ctx.fillStyle = `rgba(${hash(q, 2) > 0.5 ? '255,220,180' : '40,14,4'},${0.05 + 0.08 * hash(q, 3)})`; ctx.beginPath(); ctx.arc(lerp(sx - hw * 1.1, sx + hw * 1.1, hash(q, 1)), lerp(top, bot, hash(q, 4)), 2 + hash(q, 5) * 5, 0, TAU); ctx.fill(); }
    const sg = ctx.createLinearGradient(0, top, 0, top + (bot - top) * 0.45); sg.addColorStop(0, 'rgba(20,8,2,0.55)'); sg.addColorStop(1, 'rgba(20,8,2,0)'); ctx.fillStyle = sg; ctx.fillRect(sx - hw * 1.2, top, hw * 2.4, (bot - top) * 0.5);
    ctx.restore(); ctx.strokeStyle = 'rgba(40,12,4,0.6)'; ctx.lineWidth = 1.8; body(); ctx.stroke();
    // the fire mouth
    const mw = hw * 0.62, mt = top + (bot - top) * 0.36, mb = bot - s * 0.012;
    const door = () => { ctx.beginPath(); ctx.moveTo(sx - mw, mb); ctx.lineTo(sx - mw, mt + mw * 0.7); ctx.quadraticCurveTo(sx - mw, mt, sx, mt); ctx.quadraticCurveTo(sx + mw, mt, sx + mw, mt + mw * 0.7); ctx.lineTo(sx + mw, mb); ctx.closePath(); };
    door(); ctx.fillStyle = '#120804'; ctx.fill(); ctx.strokeStyle = '#5a2a14'; ctx.lineWidth = 5; ctx.stroke();
    ctx.save(); door(); ctx.clip();
    glow(ctx, sx, mb - (mb - mt) * 0.3, mw * 1.6, '255,120,30', 0.5 * (0.4 + bo.F));
    for (const [a, o] of [[-0.3, -0.5], [0.2, 0.1], [-0.05, 0.45]]) { ctx.save(); ctx.translate(sx + o * mw * 0.8, mb - s * 0.014); ctx.rotate(a * 0.4); ctx.fillStyle = lg(ctx, 0, -s * 0.014, 0, s * 0.014, [[0, '#6a3a1a'], [0.5, '#3a1c0a'], [1, '#1a0c04']]); rrect(ctx, -mw * 0.7, -s * 0.014, mw * 1.4, s * 0.028, s * 0.014); ctx.fill(); ctx.fillStyle = `rgba(255,140,50,${0.5 * bo.F})`; ctx.fillRect(-mw * 0.7, -s * 0.014, mw * 1.4, 3); ctx.fillStyle = '#c8a070'; ell(ctx, mw * 0.7, 0, s * 0.006, s * 0.014); ctx.fill(); ctx.restore(); }
    embers(ctx, sx - mw, mb - s * 0.03, mw * 2, s * 0.03, t, 0.5 + 0.5 * bo.F, 61, 24);
    drawFlame(ctx, sx, mb - s * 0.01, mw * 1.5, (mb - mt) * (0.5 + 0.9 * bo.F), t, 3, 0.5 + 0.5 * bo.F);
    ctx.restore();
    glow(ctx, sx, mb, hw * 1.6, '255,110,30', 0.14 + 0.2 * bo.F);
  };
  const drawLogs = (ctx, V) => {
    const s = V.s, bx = X(V, 0.1), by = Y(V, 0.76);
    groundShadow(ctx, bx + s * 0.03, by + 3, s * 0.1, s * 0.02, 0.5);
    const log = (x, y, len, r, rot) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = lg(ctx, 0, -r, 0, r, [[0, '#9a6a3a'], [0.35, '#6a3a1a'], [1, '#2a1408']]); rrect(ctx, -len / 2, -r, len, r * 2, r * 0.5); ctx.fill(); ctx.strokeStyle = 'rgba(20,8,2,0.5)'; ctx.lineWidth = 1; for (let q = 0; q < 5; q++) { ctx.beginPath(); ctx.moveTo(-len / 2 + len * (0.1 + q * 0.2), -r * 0.8); ctx.lineTo(-len / 2 + len * (0.2 + q * 0.2), r * 0.8); ctx.stroke(); }
      ctx.fillStyle = lg(ctx, len / 2 - r, -r, len / 2 + r, r, [[0, '#e6c590'], [1, '#a8783a']]); ctx.beginPath(); ctx.ellipse(len / 2, 0, r * 0.45, r, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(90,50,20,0.7)'; for (let q = 1; q < 4; q++) { ctx.beginPath(); ctx.ellipse(len / 2, 0, r * 0.45 * q / 4, r * q / 4, 0, 0, TAU); ctx.stroke(); } ctx.restore(); };
    log(bx, by - s * 0.015, s * 0.19, s * 0.017, -0.03); log(bx + s * 0.004, by - s * 0.05, s * 0.18, s * 0.016, 0.04); log(bx - s * 0.006, by - s * 0.082, s * 0.17, s * 0.016, -0.05); log(bx + s * 0.02, by - s * 0.112, s * 0.15, s * 0.015, 0.03);
  };
  const drawWok = (ctx, V, t) => {
    const s = V.s, cx = X(V, WOK.cx), cy = Y(V, WOK.cy), rx = WOK.rx * s, ry = WOK.ry * s;
    ctx.fillStyle = lg(ctx, cx - rx, 0, cx + rx, 0, [[0, '#8a4a2a'], [0.3, '#c27a4a'], [1, '#6a3418']]); ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.035, rx * 0.9, ry * 0.95, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = lg(ctx, cx - rx, 0, cx + rx, 0, [[0, '#14161a'], [0.2, '#4a4e56'], [0.4, '#7a8088'], [0.55, '#3a3e44'], [1, '#0e1014']]);
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = lg(ctx, 0, cy - ry, 0, cy + ry, [[0, '#2a2c30'], [0.5, '#0e1012'], [1, '#2a2e34']]); ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.006, rx * 0.965, ry * 0.93, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, Math.PI * 1.02, Math.PI * 1.65); ctx.stroke();
    const sr = SUR.rx * s, sy = SUR.ry * s, scy = cy + SUR.dy * s, col = syrupColor(bo.T);
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, scy, sr, sy, 0, 0, TAU); ctx.clip();
    ctx.fillStyle = rg(ctx, cx - sr * 0.2, scy - sy * 0.3, 2, sr * 1.1, [[0, tint(col, 0.3)], [0.5, col], [1, tint(col, -0.45)]]); ctx.fillRect(cx - sr, scy - sy, sr * 2, sy * 2);
    if (bo.S > 0.05) { ctx.fillStyle = `rgba(20,8,2,${clamp(bo.S * 1.5, 0, 0.8)})`; for (let q = 0; q < 24; q++) { ctx.beginPath(); ctx.ellipse(cx + (hash(q, 61) - 0.5) * sr * 1.6, scy + (hash(q, 62) - 0.5) * sy * 1.5, 3 + hash(q, 63) * 6, 2 + hash(q, 64) * 3, 0, 0, TAU); ctx.fill(); } }
    const sw = clamp(bo.wake * 8, 0, 1);
    if (sw > 0.02 && phase === 'boil') { ctx.strokeStyle = `rgba(255,236,180,${0.28 * sw})`; ctx.lineWidth = 2; for (let q = 0; q < 3; q++) { ctx.beginPath(); ctx.ellipse(X(V, tip.u), Y(V, tip.v), sr * (0.2 + 0.18 * q + 0.05 * Math.sin(t * 5)), sy * (0.3 + 0.2 * q), 0, 0.3 + q, 2.6 + q); ctx.stroke(); } }
    const T = bo.T, n = Math.round(lerp(46, 14, clamp(T, 0, 1))), act = clamp(bo.F * 1.6, 0, 1);
    for (let i = 0; i < n; i++) {
      const u = hash(i, 71) * 2 - 1, v = hash(i, 72) * 2 - 1; if (u * u + v * v > 0.96) continue;
      const ph = (t * (0.25 + 0.5 * (1 - T)) * (0.4 + act) + hash(i, 73)) % 1, r = (1.8 + 4.2 * hash(i, 74) + 6 * T * hash(i, 75)) * (V.s / 640) * (0.35 + 0.8 * Math.sin(ph * Math.PI));
      bubble(ctx, cx + u * sr * 0.95, scy + v * sy * 0.92, r, tint(col, 0.25), 0.5 + 0.4 * act);
    }
    ctx.fillStyle = `rgba(255,252,235,${0.14 + 0.2 * T})`; ctx.beginPath(); ctx.ellipse(cx - sr * 0.35, scy - sy * 0.38, sr * 0.42, sy * 0.2, -0.1, 0, TAU); ctx.fill(); ctx.fillStyle = `rgba(255,236,190,${0.1 + 0.12 * T})`; ctx.beginPath(); ctx.ellipse(cx + sr * 0.3, scy + sy * 0.42, sr * 0.3, sy * 0.1, 0.08, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(255,255,245,${0.35 + 0.3 * T})`; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - sr * 0.62, scy - sy * 0.45); ctx.quadraticCurveTo(cx - sr * 0.3, scy - sy * 0.62, cx + sr * 0.05, scy - sy * 0.55); ctx.stroke();
    if (bo.foam > 0.05) { for (let i = 0; i < 18; i++) bubble(ctx, cx + (hash(i, 81) * 2 - 1) * sr * 0.92, scy + sy * (0.2 + 0.7 * hash(i, 82)) * (hash(i, 83) > 0.5 ? 1 : -1), (3 + 5 * hash(i, 84)) * bo.foam * (V.s / 640), '#f6e2a0', 0.9); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(cx, scy, sr, sy, 0, 0, TAU); ctx.stroke();
    for (const sd of [-1, 1]) { ctx.fillStyle = lg(ctx, 0, cy - 6, 0, cy + 6, [[0, '#8a9097'], [1, '#2a2c30']]); rrect(ctx, cx + sd * rx - (sd > 0 ? 0 : s * 0.034), cy - s * 0.012, s * 0.034, s * 0.022, s * 0.01); ctx.fill(); }
  };
  const drawPaddle = (ctx, V) => {
    const s = V.s, tx = X(V, tip.u), ty = Y(V, tip.v), bx = X(V, 1.02), by = Y(V, 0.76), a = Math.atan2(by - ty, bx - tx), L = Math.hypot(bx - tx, by - ty);
    ctx.save(); ctx.translate(tx, ty); ctx.rotate(a);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(4, 12, L, s * 0.02);
    ctx.fillStyle = lg(ctx, 0, -s * 0.01, 0, s * 0.01, [[0, '#d6a868'], [0.5, '#9a6a34'], [1, '#4a2a10']]); rrect(ctx, s * 0.06, -s * 0.0085, L, s * 0.017, s * 0.008); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-s * 0.004, 0); ctx.quadraticCurveTo(s * 0.01, -s * 0.034, s * 0.1, -s * 0.03); ctx.lineTo(s * 0.1, s * 0.03); ctx.quadraticCurveTo(s * 0.01, s * 0.034, -s * 0.004, 0); ctx.closePath(); ctx.fillStyle = lg(ctx, 0, -s * 0.03, 0, s * 0.03, [[0, '#e2b878'], [0.5, '#a8743a'], [1, '#5a3418']]); ctx.fill(); ctx.strokeStyle = 'rgba(40,16,4,0.55)'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = 'rgba(200,140,40,0.55)'; ctx.beginPath(); ctx.ellipse(s * 0.02, 0, s * 0.03, s * 0.022, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,235,190,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(s * 0.12, -s * 0.004); ctx.lineTo(L * 0.9, -s * 0.004); ctx.stroke();
    ctx.restore();
  };
  const drawMarks = (ctx, V) => {
    if (phase !== 'boil' || bo.boilT < 0.4 || bo.testT > now - 1.6) return;
    const tk = nextBeat(), k = bo.k, ph = clamp((tk - now) / bo.P, 0, 1);
    for (const kk of [k, k + 1]) {
      const cur = kk === k, mu = markU(kk), x = X(V, mu), y = Y(V, WOK.cy + SUR.dy), r = V.s * 0.055;
      ctx.save(); ctx.globalAlpha = cur ? 1 : 0.35;
      const ok = cur && bo.credited;
      ctx.strokeStyle = ok ? '#7bffb4' : '#ffe08a'; ctx.lineWidth = cur ? 3 : 2; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.42, 0, 0, TAU); ctx.stroke();
      if (cur && !ok) { const rr = r * (1 + 1.6 * ph); ctx.strokeStyle = `rgba(255,224,138,${0.25 + 0.5 * (1 - ph)})`; ctx.lineWidth = 2 + 3 * (1 - ph); ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.42, 0, 0, TAU); ctx.stroke(); }
      ctx.restore();
    }
  };
  const drawTestCard = (ctx, g, V, t) => {
    const k = clamp((now - bo.testT) / 1.4, 0, 1), show = bo.testT > 0 && bo.testT > now - 3.2;
    if (!show) return;
    const x = X(V, 0.82), y = Y(V, 0.22), w = V.s * 0.3, h = V.s * 0.3;
    ctx.save(); ctx.globalAlpha = clamp(Math.min(k * 4, (bo.testT + 3.2 - now) * 2), 0, 1);
    shadowed(ctx, () => { rrect(ctx, x - w / 2, y - h * 0.5, w, h, 12); ctx.fillStyle = '#efe0b8'; ctx.fill(); }, { blur: 12, dy: 6, a: 0.5 });
    ctx.fillStyle = lg(ctx, x - w / 2, 0, x + w / 2, 0, [[0, '#e8d8a8'], [1, '#d0bc84']]); rrect(ctx, x - w / 2, y - h * 0.5, w, h, 12); ctx.fill(); ctx.strokeStyle = '#8a6a30'; ctx.lineWidth = 2; ctx.stroke();
    const sx = x - w * 0.15, sy0 = y - h * 0.4, ll = h * 0.62, len = bo.testLen * ll * clamp(k * 1.6, 0, 1);
    ctx.fillStyle = '#7a4a22'; ctx.fillRect(sx - 3, sy0 - 10, 6, 22); ctx.fillStyle = lg(ctx, sx - 12, 0, sx + 12, 0, [[0, '#d0a060'], [1, '#6a4020']]); ell(ctx, sx, sy0 + 20, 16, 9); ctx.fill();
    ctx.strokeStyle = syrupColor(bo.T); ctx.lineWidth = 3.4 - 1.8 * clamp(bo.testLen, 0, 1); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, sy0 + 26); ctx.lineTo(sx + Math.sin(t * 4) * 0.6 * clamp(bo.testLen, 0, 1), sy0 + 26 + len); ctx.stroke();
    ctx.fillStyle = syrupColor(bo.T); ctx.beginPath(); ctx.ellipse(sx, sy0 + 26 + len + 3, 3.2 * (1 + 0.6 * (1 - clamp(bo.testLen, 0, 1))), 4.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(sx - 1.2, sy0 + 26, 1.4, Math.max(0, len - 4));
    const my = sy0 + 26 + threadLen(tgt) * ll; ctx.strokeStyle = '#2a8a5a'; ctx.lineWidth = 2.4; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(x - w * 0.46, my); ctx.lineTo(x + w * 0.46, my); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#2a8a5a'; ctx.beginPath(); ctx.moveTo(x + w * 0.46, my); ctx.lineTo(x + w * 0.36, my - 6); ctx.lineTo(x + w * 0.36, my + 6); ctx.closePath(); ctx.fill();
    g.label(ctx, 'THREAD', x + w * 0.2, y - h * 0.36, g.px(14), '#5a3a14', 'center', '800');
    g.label(ctx, k > 0.9 ? threadName(bo.T) : '...', x + w * 0.2, y + h * 0.36, g.px(15), '#3a2408', 'center', '700');
    ctx.restore();
  };
  const drawMould = (ctx, V, i, t) => {
    const m = fl.moulds[i], p = mouldPos(i), s = V.s, x = X(V, p.u), y = Y(V, p.v), rx = M_R * s, ry = rx * 0.42, hh = s * 0.075;
    groundShadow(ctx, x + 2, y + hh * 0.2, rx * 1.05, ry * 0.9, 0.45);
    const bodyP = () => { ctx.beginPath(); ctx.moveTo(x - rx, y - hh); ctx.lineTo(x - rx * 0.98, y); ctx.ellipse(x, y, rx * 0.98, ry * 0.95, 0, Math.PI, 0, true); ctx.lineTo(x + rx, y - hh); ctx.closePath(); };
    bodyP(); ctx.fillStyle = cyl(ctx, x - rx, x + rx, '#d2c474', { hl: 0.3, spec: 0.4, bounce: '#e8d080' }); ctx.fill();
    ctx.save(); bodyP(); ctx.clip(); const gg2 = ctx.createLinearGradient(x - rx, 0, x + rx, 0); gg2.addColorStop(0, 'rgba(90,120,40,0.45)'); gg2.addColorStop(0.25, 'rgba(90,120,40,0)'); gg2.addColorStop(0.8, 'rgba(90,120,40,0)'); gg2.addColorStop(1, 'rgba(60,90,30,0.5)'); ctx.fillStyle = gg2; ctx.fillRect(x - rx, y - hh, rx * 2, hh + ry);
    ctx.strokeStyle = 'rgba(110,90,30,0.2)'; ctx.lineWidth = 1; for (let q = 0; q < 9; q++) { const qx = x - rx * 0.9 + (rx * 1.8 * q) / 8; ctx.beginPath(); ctx.moveTo(qx, y - hh); ctx.quadraticCurveTo(qx + (hash(q, i) - 0.5) * 3, y - hh * 0.5, qx + (hash(q, i + 3) - 0.5) * 3, y); ctx.stroke(); }
    for (const [fy, lw] of [[0.4, 3], [0.9, 2]]) { ctx.strokeStyle = 'rgba(80,60,18,0.85)'; ctx.lineWidth = lw; ctx.beginPath(); ctx.ellipse(x, y - hh * fy, rx, ry * 0.95, 0, 0.05, Math.PI - 0.05); ctx.stroke(); ctx.strokeStyle = 'rgba(255,245,190,0.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(x, y - hh * fy - 2, rx, ry * 0.95, 0, 0.1, Math.PI - 0.1); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(60,40,10,0.7)'; ctx.lineWidth = 1.4; bodyP(); ctx.stroke();
    ctx.fillStyle = '#6a5a2a'; ell(ctx, x, y - hh, rx, ry); ctx.fill(); ctx.fillStyle = '#2a1c08'; ell(ctx, x, y - hh + 1, rx * 0.88, ry * 0.8); ctx.fill();
    const depth = hh * 0.8, lvl = y - hh + 2 + depth * (1 - clamp(m.f, 0, 1.05)) * 0.55, col = syrupColor(bo.T + 0.04 * (fl.tFill / 20));
    ctx.save(); ctx.beginPath(); ctx.ellipse(x, y - hh + 1, rx * 0.88, ry * 0.8, 0, 0, TAU); ctx.clip();
    if (m.f > 0.01) { ctx.fillStyle = rg(ctx, x - rx * 0.2, lvl - 2, 1, rx, [[0, tint(col, 0.35)], [0.6, col], [1, tint(col, -0.4)]]); ell(ctx, x, lvl, rx * 0.88, ry * 0.8); ctx.fill(); ctx.fillStyle = 'rgba(255,255,240,0.45)'; ell(ctx, x - rx * 0.3, lvl - ry * 0.25, rx * 0.3, ry * 0.18); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,235,170,0.5)'; ctx.lineWidth = 1.4; ell(ctx, x, y - hh, rx, ry); ctx.stroke();
    const ly = y - hh + 2 + depth * (1 - LINE) * 0.55; ctx.strokeStyle = m.f >= LINE - 0.04 && m.f <= LINE + 0.05 ? '#7bffb4' : 'rgba(120,230,255,0.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - rx * 0.88, ly); ctx.lineTo(x - rx * 0.62, ly + 1); ctx.moveTo(x + rx * 0.62, ly + 1); ctx.lineTo(x + rx * 0.88, ly); ctx.stroke();
    if (m.spill > 0) { ctx.fillStyle = rgba(col, 0.9); ctx.beginPath(); ctx.moveTo(x + rx * 0.5, y - hh + ry * 0.7); ctx.lineTo(x + rx * 0.62, y - hh * 0.2); ctx.lineTo(x + rx * 0.4, y - hh * 0.2); ctx.closePath(); ctx.fill(); }
    if (fl.held === i && fl.dip <= 0) { ctx.strokeStyle = 'rgba(120,230,255,0.8)'; ctx.lineWidth = 2.4; ctx.setLineDash([5, 4]); ell(ctx, x, y - hh * 0.4, rx * 1.3, ry * 1.5 + hh * 0.5); ctx.stroke(); ctx.setLineDash([]); }
    void t;
  };
  const drawLadle = (ctx, V, t) => {
    const s = V.s, lx = X(V, fl.lu), ly = Y(V, fl.lv), pouring = fl.held >= 0 && fl.dip <= 0 && fl.load > 0.001, tilt = pouring ? 0.7 : 0.15;
    ctx.save(); ctx.translate(lx, ly);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(ctx, s * 0.02, s * 0.14, s * 0.06, s * 0.012); ctx.fill();
    ctx.save(); ctx.rotate(-tilt);
    ctx.strokeStyle = lg(ctx, 0, -4, 0, 4, [[0, '#d8c070'], [1, '#6a5a20']]); ctx.lineWidth = s * 0.016; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * 0.03, -s * 0.01); ctx.lineTo(s * 0.48, -s * 0.18); ctx.stroke();
    ctx.strokeStyle = 'rgba(70,52,16,0.7)'; ctx.lineWidth = 2; for (const f of [0.35, 0.7]) { const px = lerp(s * 0.03, s * 0.48, f), py = lerp(-s * 0.01, -s * 0.18, f); ctx.beginPath(); ctx.moveTo(px - 3, py - s * 0.009); ctx.lineTo(px + 3, py + s * 0.009); ctx.stroke(); }
    ctx.fillStyle = lg(ctx, -s * 0.04, -s * 0.03, s * 0.04, s * 0.04, [[0, '#8a5a30'], [0.5, '#4a2a12'], [1, '#2a1408']]); ctx.beginPath(); ctx.ellipse(0, 0, s * 0.043, s * 0.036, 0, 0, Math.PI); ctx.lineTo(s * 0.043, 0); ctx.ellipse(0, 0, s * 0.043, s * 0.012, 0, 0, Math.PI, true); ctx.fill();
    ctx.fillStyle = syrupColor(bo.T); ell(ctx, 0, 0, s * 0.04, s * 0.011); ctx.fill(); ctx.fillStyle = 'rgba(255,255,230,0.6)'; ell(ctx, -s * 0.01, -s * 0.002, s * 0.012, s * 0.004); ctx.fill();
    ctx.restore(); ctx.restore();
    if (pouring && fl.pourT > 0) {
      const m = mouldPos(fl.held), mf = fl.moulds[fl.held], sx = lx - s * 0.035, sy = ly + s * 0.01, ex = X(V, m.u), ey = Y(V, m.v) - s * 0.075 + 2 + s * 0.075 * 0.8 * (1 - clamp(mf.f, 0, 1)) * 0.55;
      if (Math.hypot(sx - ex, sy - ey) < s * 0.3) {
        ctx.save(); ctx.lineCap = 'round'; const col = syrupColor(bo.T + 0.04 * (fl.tFill / 20));
        const path = () => { ctx.beginPath(); ctx.moveTo(sx, sy); ctx.bezierCurveTo(sx - s * 0.01, sy + s * 0.04, ex + s * 0.004 + Math.sin(t * 9) * 1.2, ey - s * 0.05, ex, ey); };
        path(); ctx.strokeStyle = tint(col, -0.3); ctx.lineWidth = s * 0.013; ctx.stroke(); path(); ctx.strokeStyle = col; ctx.lineWidth = s * 0.0075; ctx.stroke(); path(); ctx.strokeStyle = 'rgba(255,255,230,0.75)'; ctx.lineWidth = s * 0.002; ctx.stroke();
        ctx.restore();
      }
    }
  };
  const drawTray = (ctx, V) => {
    const s = V.s, x0 = X(V, 0.08), x1 = X(V, 0.92), y0 = Y(V, 0.5), y1 = Y(V, 0.785), k = sm(fl.fillK);
    ctx.save(); ctx.globalAlpha = 0.45 + 0.55 * k;
    shadowed(ctx, () => { rrect(ctx, x0, y0, x1 - x0, y1 - y0, s * 0.03); ctx.fillStyle = '#3a2410'; ctx.fill(); }, { blur: 14, dy: 8, a: 0.55 });
    rrect(ctx, x0, y0, x1 - x0, y1 - y0, s * 0.03); ctx.fillStyle = lg(ctx, 0, y0, 0, y1, [[0, '#c8a060'], [1, '#8a6830']]); ctx.fill();
    ctx.save(); rrect(ctx, x0, y0, x1 - x0, y1 - y0, s * 0.03); ctx.clip();
    ctx.strokeStyle = 'rgba(70,44,12,0.35)'; ctx.lineWidth = 1.6; for (let q = -20; q < 60; q++) { ctx.beginPath(); ctx.moveTo(x0 + q * 14, y0); ctx.lineTo(x0 + q * 14 + (y1 - y0), y1); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x0 + q * 14 + (y1 - y0), y0); ctx.lineTo(x0 + q * 14, y1); ctx.stroke(); }
    ctx.restore();
    rrect(ctx, x0 + 8, y0 + 8, x1 - x0 - 16, y1 - y0 - 16, s * 0.024); ctx.strokeStyle = 'rgba(60,36,8,0.7)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  };

  const scene = (ctx, g, V, t) => {
    const k = sm(fl.fillK), V2 = clusterV(V);
    if (k < 0.5) drawLogs(ctx, V2);
    drawStove(ctx, V2, t); drawWok(ctx, V2, t);
    if (phase === 'boil') { drawMarks(ctx, V2); drawPaddle(ctx, V2); }
    steam(ctx, X(V2, WOK.cx - 0.04), Y(V2, WOK.cy - 0.02), V2.s * 0.18, V2.s * 0.5, t, clamp(bo.F * 0.9 + bo.T * 0.3, 0, 0.9), { seed: 3, n: 12, col: '245,238,225' });
    if (bo.S > 0.25) steam(ctx, X(V2, WOK.cx + 0.1), Y(V2, WOK.cy - 0.02), V2.s * 0.12, V2.s * 0.4, t + 1.1, clamp(bo.S, 0, 0.9), { seed: 8, n: 7, col: '90,80,70' });
    if (phase === 'fill') { drawTray(ctx, V); for (let i = 0; i < NM; i++) drawMould(ctx, V, i, t); drawLadle(ctx, V, t); }
    if (phase === 'boil') drawTestCard(ctx, g, V, t);
    const s = V.s, gx = X(V, 0.94), gy0 = Y(V, 0.12), gy1 = Y(V, 0.5), gw = s * 0.034, gh = gy1 - gy0;
    shadowed(ctx, () => { rrect(ctx, gx - gw * 0.9, gy0 - 12, gw * 1.8, gh + 24, gw * 0.9); ctx.fillStyle = '#3a2410'; ctx.fill(); }, { blur: 8, dy: 4, a: 0.5 });
    ctx.fillStyle = '#0e0905'; rrect(ctx, gx - gw * 0.5, gy0, gw, gh, gw * 0.5); ctx.fill();
    if (phase === 'boil') {
      const gg = ctx.createLinearGradient(0, gy1, 0, gy0); gg.addColorStop(0, '#3a2410'); gg.addColorStop(0.35, '#b8400a'); gg.addColorStop(0.7, '#ff8a2a'); gg.addColorStop(1, '#ffe08a');
      ctx.fillStyle = gg; rrect(ctx, gx - gw * 0.4, gy1 - gh * bo.F, gw * 0.8, gh * bo.F, gw * 0.35); ctx.fill();
      const w0 = gy1 - gh * WIN[1], w1 = gy1 - gh * WIN[0]; ctx.fillStyle = 'rgba(120,255,190,0.25)'; ctx.fillRect(gx - gw * 0.5, w0, gw, w1 - w0); ctx.strokeStyle = 'rgba(140,255,200,0.95)'; ctx.lineWidth = 2; ctx.strokeRect(gx - gw * 0.5, w0, gw, w1 - w0);
      g.label(ctx, 'FIRE', gx, gy1 + 22, g.px(15), '#f6e4b4', 'center', '700');
    } else {
      const left = clamp(1 - fl.setK, 0, 1);
      ctx.fillStyle = lg(ctx, 0, gy1, 0, gy0, [[0, '#a85a16'], [1, '#ffe08a']]); rrect(ctx, gx - gw * 0.4, gy1 - gh * left, gw * 0.8, gh * left, gw * 0.35); ctx.fill();
      g.label(ctx, 'RUNNY', gx, gy1 + 22, g.px(15), '#f6e4b4', 'center', '700');
    }
    void k;
  };
  const thumbMould = (ctx, x, y, s, T) => {
    const rx = s * 0.9, ry = rx * 0.42, hh = s * 1.2, col = syrupColor(T);
    groundShadow(ctx, x + 2, y + hh * 0.1, rx * 1.05, ry * 0.9, 0.45);
    ctx.beginPath(); ctx.moveTo(x - rx, y - hh); ctx.lineTo(x - rx * 0.98, y); ctx.ellipse(x, y, rx * 0.98, ry * 0.95, 0, Math.PI, 0, true); ctx.lineTo(x + rx, y - hh); ctx.closePath(); ctx.fillStyle = cyl(ctx, x - rx, x + rx, '#c8b26a', { hl: 0.3, spec: 0.35 }); ctx.fill(); ctx.strokeStyle = 'rgba(60,40,10,0.7)'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = '#6a5a2a'; ell(ctx, x, y - hh, rx, ry); ctx.fill(); ctx.fillStyle = rg(ctx, x - rx * 0.2, y - hh - 1, 1, rx, [[0, tint(col, 0.35)], [0.6, col], [1, tint(col, -0.4)]]); ell(ctx, x, y - hh + 1, rx * 0.86, ry * 0.78); ctx.fill(); ctx.fillStyle = 'rgba(255,255,230,0.5)'; ell(ctx, x - rx * 0.3, y - hh - ry * 0.1, rx * 0.28, ry * 0.15); ctx.fill();
  };
  const draw = (g, Rt) => {
    const { ctx } = g, W0 = Rt.work, Wk = { x: W0.x, y: W0.y + 38, w: W0.w, h: W0.h - 40 };
    const s = Math.min(Wk.h / SH, Wk.w / SW), V = { ox: Wk.x + (Wk.w - s * SW) / 2, oy: Wk.y + (Wk.h - s * SH) / 2, s };
    geo = { ox: V.ox, oy: V.oy, s };
    ctx.save(); ctx.beginPath(); ctx.rect(W0.x, W0.y, W0.w, W0.h + 10); ctx.clip();
    scene(ctx, g, V, now);
    ctx.restore();
    dockGauge(g, ctx, W0, { dot: syrupColor(bo.T), fill: (x, y, wd, ht) => {
      const gr = ctx.createLinearGradient(x, 0, x + wd, 0); gr.addColorStop(0, '#f0d27a'); gr.addColorStop(0.5, '#d28a22'); gr.addColorStop(1, '#5a2808'); ctx.fillStyle = gr; ctx.globalAlpha = 0.65; rrect(ctx, x + 1, y + 1, wd - 2, ht - 2, 4); ctx.fill(); ctx.globalAlpha = 1;
      if (phase === 'boil') { ctx.strokeStyle = 'rgba(120,255,190,0.95)'; ctx.lineWidth = 2; ctx.strokeRect(x + wd * clamp(tgt - 0.07, 0, 0.86), y - 3, wd * 0.14, ht + 6); }
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2; const mx = x + wd * clamp(bo.T, 0, 1); ctx.beginPath(); ctx.moveTo(mx, y + ht + 2); ctx.lineTo(mx - 5, y + ht + 10); ctx.lineTo(mx + 5, y + ht + 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    } });
    hintPill(g, ctx, W0, hint());
    // reference: golden cakes of palm sugar in their bamboo moulds
    const th = Rt.thumb, cx = th.x + th.w / 2, cy = th.y + th.h * 0.62, cs = Math.min(th.w, th.h) * 0.2;
    ctx.save(); ctx.beginPath(); ctx.rect(th.x, th.y, th.w, th.h); ctx.clip();
    glow(ctx, cx, th.y + th.h * 0.35, th.w * 0.6, '255,190,90', 0.22);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) thumbMould(ctx, cx + (c - 1) * cs * 2.3, cy + (r - 0.35) * cs * 1.9, cs, tgt);
    ctx.restore();
  };
  const titleArt = (g, S, t) => {
    const { ctx } = g, s = Math.min(S.w / SW, S.h / SH) * 0.98, V = { ox: S.x + (S.w - s * SW) / 2, oy: S.y + (S.h - s * SH) / 2, s };
    const sb = { ...bo }, sp = phase, st = { ...tip }; bo.T = 0.7; bo.F = 0.5; bo.S = 0; bo.testT = -9; bo.boilT = 0; tip = { u: 0.55, v: WOK.cy + SUR.dy, down: true }; phase = 'title';
    drawStove(ctx, V, t ?? 0); drawWok(ctx, V, t ?? 0); drawPaddle(ctx, V);
    steam(ctx, X(V, WOK.cx - 0.04), Y(V, WOK.cy - 0.02), V.s * 0.18, V.s * 0.5, t ?? 0, 0.6, { seed: 3, n: 12 });
    Object.assign(bo, sb); phase = sp; tip = st;
  };

  const hint = () => {
    if (done) return '';
    if (msgT > 0 && msg) return msg;
    if (phase === 'boil') {
      if (!bo.started) return 'Boil: press in the wok and sweep the paddle left and right to each lit mark, on the beat.';
      if (bo.boilT < 1.2) return 'Boil: sweep the paddle left and right to each lit mark, on the beat. Feed the fire to keep it in the green band.';
      if (bo.S > 0.2) return 'It is catching: keep the paddle moving!';
      if (bo.F > WIN[1]) return 'The fire is too strong: Ease it.';
      if (bo.F < WIN[0]) return 'The fire is low: Feed it.';
      if (bo.T > 0.55) return 'Getting thick and dark: press Test to see the thread, and Ladle when it reaches the mark.';
      return 'Sweep in time with the lit marks. Press Test when the syrup starts to darken.';
    }
    if (fl.dip > 0) return 'Back to the wok for more syrup.';
    return fl.moulds.every((m) => m.f < 0.05) ? 'Ladle: press and hold on a mould and let go at its line. Be quick, the syrup stiffens as it cools.' : 'Fill each mould to its line; top up the low ones. Press Let it set when they are level.';
  };
  const r3 = (v) => Math.round(v * 1000) / 1000;
  const state = () => ({ technique: 'brew', mode: 'syrup', phase, target: r3(tgt),
    boil: { f: r3(clamp((now - (nextBeat() - bo.P)) / bo.P, 0, 1)), F: r3(bo.F), T: r3(bo.T), S: r3(bo.S), foam: r3(bo.foam), since: r3(bo.since), k: bo.k, beats: bo.beats.length, rhythm: r3(rhythm()), boilT: r3(bo.boilT), heat: r3(heatFrac()), spills: bo.spills, tested: bo.tested, testLen: r3(bo.testLen), P: r3(bo.P), tip: [r3(tip.u), r3(tip.v)] },
    fill: { moulds: fl.moulds.map((m) => r3(m.f)), load: r3(fl.load), held: fl.held, tFill: r3(fl.tFill), spills: fl.spills, dip: r3(fl.dip) },
    parts: { boil: r3(boilPts()), thick: r3(20 * thickScore()), moulds: r3(30 * (fl.started ? mouldScore() : 0)) } });

  init();
  return {
    init, items, control, work, tick, draw, attract, titleArt, result: () => done, score: totalScore, hint, compact: true,
    info: () => [phase === 'boil' ? `Fire ${Math.round(bo.F * 100)} percent` : `Moulds ${fl.moulds.filter((m) => Math.abs(m.f - LINE) < 0.07).length} of ${NM} at the line`, phase === 'boil' ? `Stroke rhythm ${Math.round(rhythm() * 100)} percent` : `Syrup ${Math.round((1 - fl.setK) * 100)} percent runny`],
    get caption() { return SC.words?.caption ?? 'Boil this sugar'; },
    rules: () => [
      'Boil: the sap thickens and darkens as it boils. Feed adds wood and Ease takes it away; keep the fire in the green window (too strong a fire froths thin sap over the edge).',
      'Stir: drag the paddle across the wok to each lit mark in turn, left then right, as the ring closes on it. Steady strokes keep the sugar off the bottom; if nobody stirs, a strong fire scorches it.',
      'Test: the spoon draws a thread of syrup. The longer it holds, the thicker the syrup; the green line on the card is the thread to pour at.',
      'Ladle: when it is ready, press Ladle and fill the moulds. Press and hold on a mould and let go at its line; the ladle goes back to the wok by itself for more. The syrup gets stiffer the longer it stands and sets in the end.',
      'Score: stir rhythm 25, fire in its window 15, nothing scorched 10, the thickness at the pour 20, moulds filled level 30. Nothing done scores nothing.',
    ],
    point(id) {
      if (!geo) return null;
      const P2 = (u, v) => ({ x: geo.ox + u * geo.s, y: geo.oy + v * geo.s });
      const [k, rest] = id.split(':');
      if (k === 'mark') return P2(markU(Number(rest)), WOK.cy + SUR.dy);
      if (k === 'wok') return P2(WOK.cx + Number(rest) * MK, WOK.cy + SUR.dy);
      if (k === 'mould') { const m = mouldPos(Number(rest)); return P2(m.u, m.v - 0.03); }
      return null;
    },
    state,
  };
}

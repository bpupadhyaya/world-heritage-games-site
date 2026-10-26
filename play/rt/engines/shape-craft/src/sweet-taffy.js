// shape-craft 1.26.0 technique `sweet-taffy`: maple taffy on snow (tire d'erable).
//
// The cook holds a ladle of hot maple syrup over a trough of packed snow and pours it along the lit guide lines. The speed of the hand is the
// skill: steady gives a fat, even ribbon; too slow and the syrup pools; too fast and the thread thins and breaks into drops. A ladle holds enough
// for about two strips (Refill). On the cold snow the syrup sets: hot it is clear amber and runny, cooled it turns to a pale, matte, chewy taffy.
// Then each strip is rolled up on a wooden stick: press at the end of the strip and drag along it, the strip winds onto the stick. A strip rolled
// while still hot is sticky and rolls badly. Score: pour (line on the guide, made at the right speed, little waste) 65, roll (how much of each
// poured strip is wound up, and whether it had set) 35. Files: this one; figures src/paint-figures/kitchen.js; scene src/scenes-kitchen-sweet.js.
import { registerTechnique } from './registry.js';
import { starsFor, hash } from './geom.js';
import { shadowed, shelf, rgba, tint, mix, ease } from './fx.js';
import { lg, rg, ell } from './props.js';
import { taffy } from './paint-figures/kitchen.js';
import { prepareLayer, resetCover } from './paint-stroke.js';
import * as PR from './paint-render.js';
import { hintPill, dockGauge, makeSurface, dockRect } from './paint-ui.js';
import { rrect, clamp, lerp, smooth01, dist, TAU, smoothRaw, scoreSplit, makeVoice, fitBox, nearestIndex, pointAt, drawFist } from './sweet-common.js';

export const TAFFY_DEFAULTS = { tolerance: 0.042, guideMode: 'trace', guide: true, variation: 1 };
const V0 = 0.4;            // the pace that lays an ideal ribbon, design units per second
const USE = 0.5;           // ladle load used per unit of ideal ribbon
const SET_TAU = 3.4;       // seconds for the syrup to cool to 1/e on the snow
const GUIDE_MODES = ['trace', 'faint', 'off'], GUIDE_LABEL = { trace: 'Guide', faint: 'Faint', off: 'No guide' };
const MIN_STEP = 0.0035;
const kindOf = (r) => (r < 0.55 ? 3 : r < 0.68 ? 1 : r <= 1.6 ? 0 : r <= 2.1 ? 2 : 4);   // 0 good, 1 thick, 2 thin, 3 pooled, 4 drops

export function createTaffy(P, env) {
  const { rng, fx } = env;
  const SC = P.scene ?? {};
  const voice = makeVoice(env, 'taffy');
  const tol = P.tolerance ?? 0.042;
  let D, prep, W0, load, cur, phase, pours, group, now, done, geo, ptr, gmode, auto, rolls, rollCur, covS, scoreCache, rollInfo, undoStack, round = 0, cache = null, flash = -9;

  const guides = () => prep.guides;
  const init = () => {
    round++; cache = null;
    D = taffy(rng, P.variation ?? 1); W0 = D.W0;
    prep = prepareLayer(D.layers[0], { kind: 'none' }, D.ar);
    load = 1; cur = null; phase = 'pour'; pours = []; group = 0; now = 0; done = null; ptr = null; covS = []; scoreCache = null; rollInfo = null; undoStack = [];
    gmode = P.guide === false ? 'off' : GUIDE_MODES.includes(P.guideMode) ? P.guideMode : 'trace';
    rolls = D.strips.map(() => ({ pr: 0, t0: null, age: null, started: false, done: false }));
    rollCur = null; flash = -9;
    buildAuto();
  };

  // ---- pouring ---------------------------------------------------------------------------------------------------------------------------------
  // The smoothed hand path becomes a ribbon: width from the pace, a kind (good, thick, thin, pooled, drops) per sample, load used per length.
  const buildPour = (raw, load0) => {
    const sm = smoothRaw(raw), pts = [];
    let ld = load0, ds = 0.005;
    for (let i = 0; i < sm.length; i++) {
      const p = sm[i]; if (i) ds = dist([sm[i - 1].x, sm[i - 1].y], [p.x, p.y]);
      const r = i < 2 && sm.length > 3 ? Math.max(0.25, p.v / V0) : p.v / V0;
      let k = kindOf(r), w = W0 * clamp(Math.pow(Math.max(r, 0.15), -0.7), 0.4, 2.6);
      if (k === 4) w = W0 * 0.45;
      ld -= USE * ds * (k === 4 ? 0.5 : w / W0);
      if (ld <= 0.0) { return { pts, loadEnd: 0, dry: true }; }
      if (ld < 0.1) { k = 4; w = W0 * 0.4; }
      pts.push({ x: p.x, y: p.y, w, k, t: p.t, v: p.v });
    }
    if (sm.length === 1) pts.push({ x: sm[0].x, y: sm[0].y, w: W0 * 1.3, k: 3, t: sm[0].t, v: 0 });
    return { pts, loadEnd: Math.max(0, ld), dry: false };
  };
  const tempOf = (s) => Math.exp(-Math.max(0, now - s.t) / SET_TAU);
  const toLocal = (x, y) => [(x - geo.ox) / geo.s, (y - geo.oy) / geo.s];
  const inTray = (u, v) => u >= -0.02 && u <= D.ar + 0.02 && v >= -0.02 && v <= 1.02;

  const lineSamples = (onlyGood) => {
    const out = [];
    for (const it of pours) for (const s of it.pts) if (!onlyGood || s.k === 0) out.push({ x: s.x, y: s.y, col: 0, free: true });
    return out;
  };
  const compute = () => {
    if (scoreCache) return scoreCache;
    const sc = scoreSplit(prep, lineSamples(false), lineSamples(true), tol);
    scoreCache = sc; covS = sc.strokeCov; return sc;
  };
  // roll phase bookkeeping: which guide samples carry syrup, which pour sample belongs to which guide sample, how old each strip is
  const enterRoll = () => {
    const cell = 0.08, key = (x, y) => Math.floor(x / cell) * 4096 + Math.floor(y / cell), grid = new Map();
    for (const it of pours) for (const s of it.pts) { const kk = key(s.x, s.y); (grid.get(kk) ?? grid.set(kk, []).get(kk)).push(s); }
    const cov = guides().map((g) => g.pts.map((q) => {
      let ok = false, newest = -1;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (const s of grid.get(key(q[0] + dx * cell, q[1] + dy * cell)) ?? []) if (Math.hypot(s.x - q[0], s.y - q[1]) <= tol) { ok = true; newest = Math.max(newest, s.t); }
      return ok ? newest : -1;
    }));
    // assign every pour sample to its guide sample (for hiding the part that is wound up)
    for (const it of pours) for (const s of it.pts) {
      s.gi = -1; s.gk = -1; let bd = tol * 1.6;
      guides().forEach((g, gi) => { const r = nearestIndex(g.pts, s.x, s.y); if (r.i >= 0 && r.d < bd) { bd = r.d; s.gi = gi; s.gk = r.i; } });
    }
    rollInfo = { cov, total: cov.map((c) => c.filter((v) => v >= 0).length), newest: cov.map((c) => c.reduce((a, b) => Math.max(a, b), -1)) };
  };
  const rollFraction = (gi) => { const c = rollInfo?.cov[gi]; if (!c || !rollInfo.total[gi]) return 0; let n = 0; for (let k = 0; k <= rolls[gi].pr; k++) if (c[k] >= 0) n++; return n / rollInfo.total[gi]; };
  const rollScoreOf = (gi) => {
    const r = rolls[gi]; if (!rollInfo || !rollInfo.total[gi] || !r.started) return 0;
    const age = r.age ?? 0, q = clamp(0.55 + (0.45 * (age - 1.0)) / 2.0, 0.55, 1);
    return rollFraction(gi) * q;
  };
  const rollScore = () => (guides().length ? guides().reduce((a, _, gi) => a + rollScoreOf(gi), 0) / guides().length : 0);
  const total = () => {
    if (done) return done.score;
    const pour = compute().score;
    return Math.round(pour * 0.65 + (phase === 'roll' ? 100 * rollScore() * 0.35 : 0));
  };

  // ---- input -----------------------------------------------------------------------------------------------------------------------------------
  const beginPour = (u, v) => {
    if (load <= 0.02) { voice('pop', { vel: 0.35, hz: 300 }); flash = now; return; }
    cur = { raw: [{ x: u, y: v, t: now }], load0: load, len: 0, since: 0 };
    voice('impact', { mat: 'clay', hz: 130, vel: 0.22 });
  };
  const movePour = (u, v) => {
    const a = cur.raw[cur.raw.length - 1], d = Math.hypot(u - a.x, v - a.y);
    if (d < MIN_STEP) return;
    const dt = Math.max(1 / 120, now - a.t), sp = d / dt, r = sp / V0, k = kindOf(r);
    cur.raw.push({ x: u, y: v, t: now }); cur.len += d; cur.since += d;
    if (cur.since >= 0.03) {   // the sound of the stream answers the pace: a thin high hiss when fast, a low glop when it pools
      cur.since = 0;
      voice('scrape', { hz: 700 + 1500 * clamp(r / 2.2, 0, 1), dur: 0.09, vel: 0.26 });
      if (k === 3) voice('thud', { hz: 85, vel: 0.14 });
      if (k === 4) voice('tick', { hz: 2300 + 300 * hash(Math.round(cur.len * 100), 3), vel: 0.22 });
      voice('scrape', { hz: 5200, dur: 0.035, vel: 0.07 });
    }
  };
  const endPour = () => {
    const st = cur; cur = null;
    const res = buildPour(st.raw, st.load0);
    if (!res.pts.length) { load = Math.max(0, res.loadEnd); return; }
    // a dwell (a hand that stops) leaves a pool that grows with the time spent
    const last = st.raw[st.raw.length - 1], dwell = now - last.t;
    if (dwell > 0.5) { const p = res.pts[res.pts.length - 1]; p.w = Math.min(W0 * 2.6, p.w + dwell * W0 * 0.7); p.k = 3; }
    pours.push({ id: ++group, pts: res.pts, load0: st.load0 });
    load = res.loadEnd;
    scoreCache = null; compute();
    if (res.dry) voice('bad', { hz: 260, vel: 0.3 });
    // a sparkle on each guide this pour completed
    guides().forEach((g, i) => { if ((covS[i] ?? 0) > 0.85 && geo) { const m = g.pts[g.pts.length >> 1]; fx.emit('spark', geo.ox + m[0] * geo.s, geo.oy + m[1] * geo.s, { count: 2, color: '#fff2b8', size: 5, speed: 40, life: 0.4, gravity: 30 }); } });
  };
  const beginRoll = (u, v) => {
    let best = -1, bd = 4 * tol;
    guides().forEach((g, gi) => {
      const r = rolls[gi]; if (r.done || !rollInfo.total[gi]) return;
      const d = dist(g.pts[r.pr], [u, v]); if (d < bd) { bd = d; best = gi; }
    });
    if (best < 0) { voice('tick', { hz: 700, vel: 0.2 }); return; }
    const r = rolls[best];
    if (!r.started) { r.started = true; r.t0 = now; r.age = Math.max(0, now - rollInfo.newest[best]); }
    rollCur = { gi: best, from: r.pr, since: 0 };
    voice('impact', { mat: 'wood', hz: 340, vel: 0.2 });
  };
  const moveRoll = (u, v) => {
    const r = rolls[rollCur.gi], g = guides()[rollCur.gi], n = g.pts.length;
    const res = nearestIndex(g.pts, u, v, r.pr, r.pr + 30);
    if (res.i < 0 || res.d > 3 * tol || res.i <= r.pr) return;
    const adv = (res.i - r.pr) * 0.009; r.pr = res.i; rollCur.since += adv;
    if (rollCur.since >= 0.035) { rollCur.since = 0; voice('scrape', { hz: 1900 + 500 * smooth01(r.pr / n), dur: 0.08, vel: 0.3 }); voice('tick', { hz: 800, vel: 0.12 }); }
    if (r.pr >= n - 3 && !r.done) {
      r.done = true; r.pr = n - 1; voice('good', { hz: 700 + 80 * rolls.filter((q) => q.done).length, vel: 0.5 }); voice('pop', { vel: 0.4, delay: 0.08 });
      if (geo) fx.emit('spark', geo.ox + g.pts[n - 1][0] * geo.s, geo.oy + g.pts[n - 1][1] * geo.s, { count: 6, color: '#ffe9a8', size: 6, speed: 80, life: 0.6, gravity: 40 });
    }
  };
  const endRoll = () => { if (rollCur) { undoStack.push({ kind: 'roll', gi: rollCur.gi, from: rollCur.from, wasDone: false }); rollCur = null; } };

  const work = (p) => {
    if (!geo || done) return;
    ptr = { x: p.x, y: p.y };
    const [u, v] = toLocal(p.x, p.y);
    if (p.pressed && !cur && !rollCur && inTray(u, v)) { if (phase === 'pour') beginPour(u, v); else if (phase === 'roll') beginRoll(u, v); }
    if (cur && (p.down || p.pressed)) movePour(u, v);
    if (rollCur && (p.down || p.pressed)) moveRoll(u, v);
    if (cur && (p.released || !p.down)) endPour();
    if (rollCur && (p.released || !p.down)) endRoll();
  };
  const tick = (dt) => { now += dt; };

  // ---- controls --------------------------------------------------------------------------------------------------------------------------------
  const items_ = () => {
    const out = [];
    if (phase === 'pour') out.push({ id: 'refill', kind: 'btn', label: 'Refill', primary: load < 0.35 });
    out.push({ id: 'guide', kind: 'btn', label: GUIDE_LABEL[gmode] });
    out.push({ id: 'undo', kind: 'btn', label: 'Undo', off: phase === 'pour' ? !pours.length : !undoStack.length });
    out.push({ id: 'check', kind: 'btn', label: phase === 'pour' ? 'Set' : 'Check', primary: true });
    return out;
  };
  const undo = () => {
    if (phase === 'pour') { const it = pours.pop(); if (it) { load = it.load0; scoreCache = null; compute(); voice('pop', { vel: 0.4 }); } }
    else { const u = undoStack.pop(); if (u) { const r = rolls[u.gi]; r.pr = u.from; r.done = false; if (u.from === 0) { r.started = false; r.t0 = null; r.age = null; } voice('pop', { vel: 0.4 }); } }
  };
  const finish = () => {
    const sc = compute(), pour = sc.score, roll = Math.round(rollScore() * 100), score = Math.round(pour * 0.65 + roll * 0.35), stars = starsFor(score), W = SC.words ?? {};
    done = { score, max: 100, stars, headline: stars === 3 ? (W.win ?? 'Worthy of the sugar shack') : stars ? (W.ok ?? 'Good taffy') : (W.retry ?? 'Try another batch'), detail: `Pour ${pour} percent, roll ${roll} percent` };
    cur = null; rollCur = null; voice('good', { hz: 700 + stars * 70, vel: 0.6 }); voice('sparkle', { vel: 0.5, delay: 0.1 });
    if (geo) fx.emit('spark', geo.ox + geo.bw / 2, geo.oy + geo.s * 0.5, { count: 14, color: '#fff4c8', size: 8, speed: 160, life: 0.8, gravity: 80 });
  };
  const control = (id) => {
    if (done) return;
    if (id === 'refill') { if (phase !== 'pour' || cur) return; load = 1; voice('splash', { vel: 0.5 }); voice('scrape', { hz: 600, dur: 0.2, vel: 0.35, delay: 0.1 }); if (geo) fx.emit('drop', geo.ox + geo.bw * 0.5, geo.oy - 6, { count: 3, color: '#d9871c', size: 5, speed: 40, life: 0.5, gravity: 300, angle: Math.PI / 2, spread: 1 }); }
    else if (id === 'guide') { gmode = GUIDE_MODES[(GUIDE_MODES.indexOf(gmode) + 1) % GUIDE_MODES.length]; voice('tick', { hz: 1800, vel: 0.3 }); }
    else if (id === 'undo') undo();
    else if (id === 'check') {
      if (phase === 'pour') { if (cur) endPour(); phase = 'roll'; undoStack = []; enterRoll(); voice('whoosh', { dur: 0.25, vel: 0.4, down: true }); }
      else finish();
    }
  };

  // ---- Watch and learn: a hand pours every strip at the right pace, waits for the syrup to set, then rolls each one -------------------------
  function buildAuto() {
    const q = []; let ld = 1;
    prep.guides.forEach((g, gi) => { const need = g.len * USE * 1.12; if (ld < need) { q.push({ t: 'refill' }); ld = 1; } ld -= need; q.push({ t: 'pour', gi }); });
    q.push({ t: 'wait', s: 1.2 }, { t: 'next' });
    prep.guides.forEach((_, gi) => q.push({ t: 'roll', gi }));
    q.push({ t: 'wait', s: 0.6 }, { t: 'check' });
    auto = { q, i: 0, wait: 0.35, st: null, hand: null };
  }
  const attract = (dt) => {
    if (done) return;
    if (auto.wait > 0) { auto.wait -= dt; return; }
    if (auto.st) {
      const s = auto.st, g = guides()[s.gi], wob = Math.sin(s.k * 0.21) * 0.1, step = (s.roll ? 0.9 : V0 * (1 + wob) * (P.variant === 'slow' ? 0.22 : P.variant === 'fast' ? 2.6 : 1)) * dt;   // params.variant slow / fast: Watch and learn pours at that pace (previews and tests)
      s.pos = Math.min(s.len, s.pos + step);
      const q = pointAt(g.pts, s.pos), jx = (((s.k = s.k + 1) * 2654435761) % 1000) / 1000 - 0.5;
      const qx = q[0] + jx * 0.002, qy = q[1] + jx * 0.0015;
      if (s.roll) moveRoll(qx, qy); else movePour(qx, qy);
      auto.hand = q;
      if (s.pos >= s.len) { if (s.roll) endRoll(); else endPour(); auto.st = null; auto.wait = s.roll ? 0.25 : 0.4; }
      return;
    }
    const a = auto.q[auto.i]; if (!a) return;
    auto.i++;
    if (a.t === 'refill') { control('refill'); auto.wait = 0.5; }
    else if (a.t === 'wait') auto.wait = a.s;
    else if (a.t === 'next') { control('check'); auto.wait = 0.5; }
    else if (a.t === 'check') control('check');
    else if (a.t === 'pour' || a.t === 'roll') {
      const g = guides()[a.gi], roll = a.t === 'roll';
      if (roll) beginRoll(g.pts[0][0], g.pts[0][1]); else beginPour(g.pts[0][0], g.pts[0][1]);
      auto.st = { gi: a.gi, pos: 0, len: dist(g.pts[0], g.pts[0]) + g.len, k: 0, roll }; auto.hand = g.pts[0];
    }
  };

  // ---- drawing: the trough, the snow, the syrup, the ladle, the sticks -----------------------------------------------------------------------
  const syrupColors = (T) => ({
    edge: mix('#9a6a22', '#7c3704', T), body: mix('#c8832c', '#c4610a', T), mid: mix('#e0a54e', '#e88d1c', T), core: mix('#f0cc86', '#ffc04e', T),
  });
  const trough = (ctx, V, rim) => {
    const x = V.ox - rim, y = V.oy - rim, w = D.ar * V.s + rim * 2, h = V.s + rim * 2, r = Math.max(8, rim * 0.9);
    shadowed(ctx, () => { rrect(ctx, x, y, w, h, r); ctx.fillStyle = '#3a2212'; ctx.fill(); }, { blur: V.s * 0.05, dy: V.s * 0.03, a: 0.6 });
    // rim timber: planed birch, darkened by years of sap
    rrect(ctx, x, y, w, h, r); ctx.fillStyle = lg(ctx, x, y, x + w * 0.5, y + h, [[0, '#a8743e'], [0.5, '#8a5a30'], [1, '#5c3a1c']]); ctx.fill();
    ctx.save(); rrect(ctx, x, y, w, h, r); ctx.clip();
    ctx.strokeStyle = 'rgba(40,22,8,0.22)'; ctx.lineWidth = 1.2;
    for (let k = 0; k < 16; k++) { const yy = y + (h * (k + 0.5)) / 16; ctx.beginPath(); ctx.moveTo(x, yy); for (let i = 1; i <= 12; i++) ctx.lineTo(x + (w * i) / 12, yy + Math.sin(i * 0.8 + k) * 1.4 + (hash(k, i) - 0.5) * 1.4); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,225,170,0.22)'; ctx.lineWidth = 1; for (let k = 0; k < 9; k++) { const yy = y + (h * (k + 0.2)) / 9; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy + 2); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,222,160,0.5)'; ctx.lineWidth = 1.6; rrect(ctx, x + 1, y + 1, w - 2, h - 2, r); ctx.stroke();
    // iron corner straps
    ctx.fillStyle = lg(ctx, 0, y, 0, y + rim * 1.4, [[0, '#4a4e56'], [1, '#22252a']]);
    for (const [cx, cy] of [[x, y], [x + w - rim * 1.9, y], [x, y + h - rim * 1.9], [x + w - rim * 1.9, y + h - rim * 1.9]]) { rrect(ctx, cx, cy, rim * 1.9, rim * 1.9, rim * 0.35); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(cx + rim * 0.95, cy + rim * 0.95, Math.max(1.2, rim * 0.12), 0, TAU); ctx.fill(); ctx.fillStyle = lg(ctx, 0, cy, 0, cy + rim * 1.4, [[0, '#4a4e56'], [1, '#22252a']]); }
  };
  const snowStatic = (ctx, V) => {   // the packed snow: baked once per size
    const x = V.ox, y = V.oy, w = D.ar * V.s, h = V.s;
    rrect(ctx, x, y, w, h, Math.max(5, V.s * 0.02)); ctx.save(); ctx.clip();
    ctx.fillStyle = lg(ctx, x, y, x + w * 0.55, y + h, [[0, '#f4f9ff'], [0.55, '#dfeaf6'], [1, '#bccfe6']]); ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    for (let k = 0; k < 11; k++) { const cx = x + hash(k, 5) * w, cy = y + hash(k, 6) * h, r = V.s * (0.22 + hash(k, 7) * 0.3); ctx.fillStyle = rg(ctx, cx, cy, 0, r, [[0, rgba(hash(k, 8) > 0.5 ? '#ffffff' : '#9db6d6', 0.32)], [1, 'rgba(255,255,255,0)']]); ell(ctx, cx, cy, r, r * 0.6, hash(k, 9) * 3); ctx.fill(); }
    // ripples left by the hand that packed it
    ctx.strokeStyle = 'rgba(120,150,190,0.16)'; ctx.lineWidth = Math.max(1, V.s * 0.004); for (let k = 0; k < 7; k++) { const yy = y + h * (0.1 + 0.13 * k); ctx.beginPath(); ctx.moveTo(x, yy); for (let i = 1; i <= 16; i++) ctx.lineTo(x + (w * i) / 16, yy + Math.sin(i * 0.9 + k * 1.7) * h * 0.012); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; for (let k = 0; k < 7; k++) { const yy = y + h * (0.1 + 0.13 * k) - 2; ctx.beginPath(); ctx.moveTo(x, yy); for (let i = 1; i <= 16; i++) ctx.lineTo(x + (w * i) / 16, yy + Math.sin(i * 0.9 + k * 1.7) * h * 0.012); ctx.stroke(); }
    const sp = (n, c, a, sz, seed) => { ctx.fillStyle = rgba(c, a); ctx.beginPath(); for (let k = 0; k < n; k++) ctx.rect(x + hash(k, seed) * w, y + hash(k, seed + 1) * h, sz * (0.5 + hash(k, seed + 2)), sz * (0.5 + hash(k, seed + 3))); ctx.fill(); };
    sp(900, '#ffffff', 0.8, Math.max(1.4, V.s * 0.0045), 21); sp(700, '#8aa6cc', 0.24, Math.max(1.4, V.s * 0.004), 25); sp(300, '#5a7aa8', 0.14, Math.max(1.2, V.s * 0.003), 29);
    // soft shade along the timber where the snow sits below the rim
    // low raking light from the shack side: drifts catch light on their upper left and throw a blue shadow to the lower right
    for (let k = 0; k < 9; k++) {
      const cx = x + w * (0.08 + 0.84 * hash(k, 61)), cy = y + h * (0.1 + 0.8 * hash(k, 62)), rx = w * (0.12 + 0.14 * hash(k, 63)), ry = h * (0.05 + 0.06 * hash(k, 64)), rot = (hash(k, 65) - 0.5) * 0.5;
      ctx.fillStyle = rg(ctx, cx + rx * 0.35, cy + ry * 0.6, 0, rx, [[0, 'rgba(60,90,150,0.2)'], [1, 'rgba(60,90,150,0)']]); ell(ctx, cx + rx * 0.3, cy + ry * 0.7, rx, ry * 1.1, rot); ctx.fill();
      ctx.fillStyle = rg(ctx, cx - rx * 0.3, cy - ry * 0.5, 0, rx, [[0, 'rgba(255,248,235,0.55)'], [1, 'rgba(255,248,235,0)']]); ell(ctx, cx - rx * 0.2, cy - ry * 0.4, rx * 0.9, ry * 0.8, rot); ctx.fill();
    }
    const wl = ctx.createLinearGradient(x, y, x + w, y); wl.addColorStop(0, 'rgba(70,100,170,0.16)'); wl.addColorStop(0.55, 'rgba(255,255,255,0)'); wl.addColorStop(1, 'rgba(255,196,130,0.18)'); ctx.fillStyle = wl; ctx.fillRect(x, y, w, h);
    const sh = ctx.createLinearGradient(x, y, x, y + h * 0.16); sh.addColorStop(0, 'rgba(40,70,120,0.3)'); sh.addColorStop(1, 'rgba(40,70,120,0)'); ctx.fillStyle = sh; ctx.fillRect(x, y, w, h * 0.16);
    const sl = ctx.createLinearGradient(x, y, x + w * 0.1, y); sl.addColorStop(0, 'rgba(40,70,120,0.26)'); sl.addColorStop(1, 'rgba(40,70,120,0)'); ctx.fillStyle = sl; ctx.fillRect(x, y, w * 0.1, h);
    const vg = ctx.createRadialGradient(x + w * 0.5, y + h * 0.45, h * 0.3, x + w * 0.5, y + h * 0.5, w * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(20,40,90,0.22)'); ctx.fillStyle = vg; ctx.fillRect(x, y, w, h);
    ctx.restore();
  };
  const drawBoard = (ctx, V, rim, t) => {
    const pad = Math.ceil(rim + V.s * 0.1), cw = Math.ceil(D.ar * V.s + pad * 2), ch = Math.ceil(V.s + pad * 2), key = `${round}|${Math.round(V.s)}|${Math.round(rim)}`;
    if (!cache || cache.key !== key) {
      const sf = makeSurface(ctx, cw, ch);
      if (sf) { const Vl = { ox: pad, oy: pad, s: V.s }; trough(sf.ctx, Vl, rim); snowStatic(sf.ctx, Vl); cache = { key, sf, pad }; } else cache = { key, sf: null, pad };
    }
    if (cache.sf) ctx.drawImage(cache.sf.canvas, V.ox - cache.pad, V.oy - cache.pad); else { trough(ctx, V, rim); snowStatic(ctx, V); }
    // glints in the snow: a few crystals catch the lamp and wink
    ctx.save(); rrect(ctx, V.ox, V.oy, D.ar * V.s, V.s, Math.max(5, V.s * 0.02)); ctx.clip();
    for (let k = 0; k < 26; k++) {
      const ph = Math.sin(t * (1.4 + hash(k, 2)) + k * 2.1), a = Math.max(0, ph - 0.55) * 2.2; if (a <= 0) continue;
      const gx = V.ox + hash(k, 31) * D.ar * V.s, gy = V.oy + hash(k, 32) * V.s, r = V.s * (0.006 + 0.008 * hash(k, 33));
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, a)})`; ctx.beginPath(); for (let i = 0; i < 8; i++) { const ang = (i * Math.PI) / 4, rad = i % 2 ? r * 0.25 : r * 1.6; ctx.lineTo(gx + Math.cos(ang) * rad, gy + Math.sin(ang) * rad); } ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  };

  // One ribbon of syrup. visible(s) hides the part wound up on the stick. All passes run over all segments before the next pass.
  const drawSyrup = (ctx, V, pts, opts = {}) => {
    if (!pts.length) return;
    const SEG = 3, segs = [];
    for (let i = 0; i < pts.length - 1; i += SEG) {
      const a = pts.slice(i, Math.min(pts.length, i + SEG + 1)); if (a.length < 2 || a.some((s) => s.hide)) continue;
      if (a.every((s) => s.k === 4)) continue;   // a thread that has broken into drops: the beads are drawn below
      const w = a.reduce((m, s) => m + s.w, 0) / a.length, T = a.reduce((m, s) => m + (opts.T ?? tempOf(s)), 0) / a.length;
      segs.push({ a, w: w * V.s, T });
    }
    const path = (a, dx = 0, dy = 0) => { ctx.beginPath(); ctx.moveTo(V.ox + a[0].x * V.s + dx, V.oy + a[0].y * V.s + dy); for (let i = 1; i < a.length; i++) ctx.lineTo(V.ox + a[i].x * V.s + dx, V.oy + a[i].y * V.s + dy); };
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const pass = (fn) => { for (const s of segs) fn(s); };
    pass((s) => { path(s.a); ctx.strokeStyle = `rgba(96,124,164,${0.1 + 0.14 * s.T})`; ctx.lineWidth = s.w * 1.7; ctx.stroke(); });           // wet, slushy snow round the hot syrup
    pass((s) => { path(s.a, s.w * 0.12, s.w * 0.3); ctx.strokeStyle = 'rgba(40,60,100,0.42)'; ctx.lineWidth = s.w * 1.12; ctx.stroke(); });       // its shadow
    pass((s) => { const c = syrupColors(s.T); path(s.a); ctx.strokeStyle = c.edge; ctx.lineWidth = s.w * 1.04; ctx.stroke(); });
    pass((s) => { const c = syrupColors(s.T); path(s.a); ctx.strokeStyle = c.body; ctx.lineWidth = s.w * 0.9; ctx.stroke(); });
    pass((s) => { const c = syrupColors(s.T); path(s.a, -s.w * 0.03, -s.w * 0.05); ctx.strokeStyle = c.mid; ctx.lineWidth = s.w * 0.62; ctx.stroke(); });
    pass((s) => { const c = syrupColors(s.T); path(s.a, -s.w * 0.08, -s.w * 0.12); ctx.strokeStyle = c.core; ctx.lineWidth = s.w * 0.3; ctx.stroke(); });
    pass((s) => { path(s.a, -s.w * 0.14, -s.w * 0.2); ctx.strokeStyle = `rgba(255,252,240,${0.28 + 0.5 * s.T})`; ctx.lineWidth = Math.max(1, s.w * (0.1 + 0.05 * s.T)); ctx.stroke(); });   // glossy while hot
    pass((s) => { if (s.T < 0.5) { path(s.a, -s.w * 0.05, -s.w * 0.08); ctx.strokeStyle = `rgba(255,236,190,${0.2 * (1 - s.T * 2)})`; ctx.lineWidth = s.w * 0.7; ctx.stroke(); } });    // set: a soft matte bloom
    // drops
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i], q = pts[i - 1]; acc += Math.hypot(p.x - q.x, p.y - q.y);
      if (p.k !== 4 || p.hide) continue;
      const gap = 0.03 + 0.02 * hash(i, 41);
      if (acc < gap) continue; acc = 0;
      const T = opts.T ?? tempOf(p), c = syrupColors(T), r = V.s * W0 * (0.28 + 0.2 * hash(i, 42)), x = V.ox + p.x * V.s, y = V.oy + p.y * V.s;
      ctx.fillStyle = 'rgba(40,60,100,0.4)'; ctx.beginPath(); ctx.ellipse(x + r * 0.3, y + r * 0.45, r * 1.15, r * 0.9, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = rg(ctx, x, y, 0, r, [[0, c.core], [0.5, c.mid], [1, c.edge]], x - r * 0.3, y - r * 0.3); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,250,0.85)'; ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.4, Math.max(0.8, r * 0.22), 0, TAU); ctx.fill();
    }
    ctx.restore();
  };

  const steam = (ctx, V, t, list) => {   // thin wisps rise from the hot syrup, sway and fade with height
    let n = 0;
    ctx.save(); ctx.lineCap = 'round';
    for (const it of list) for (let i = 6; i < it.pts.length && n < 22; i += 19) {
      const s = it.pts[i]; if (s.hide) continue; const T = tempOf(s); if (T < 0.3) continue;
      n++; const x0 = V.ox + s.x * V.s, y0 = V.oy + s.y * V.s - V.s * s.w * 0.3, ph = hash(i, 51) * 6.3, H = V.s * (0.13 + 0.1 * T), sway = V.s * 0.035;
      for (let u = 0; u < 9; u++) {
        const f0 = u / 9, f1 = (u + 1) / 9, X = (f) => x0 + Math.sin(t * 1.3 + ph + f * 4.2) * sway * f, Y = (f) => y0 - H * f;
        ctx.strokeStyle = `rgba(255,255,255,${(0.2 * T) * (1 - f0) * (1 - f0)})`; ctx.lineWidth = V.s * (0.012 + 0.014 * f0);
        ctx.beginPath(); ctx.moveTo(X(f0), Y(f0)); ctx.lineTo(X(f1), Y(f1)); ctx.stroke();
      }
    }
    ctx.restore();
  };

  const stickSprite = (ctx, x, y, ang, len, wd, alpha = 1) => {   // a flat wooden stick: long axis along ang; centre (x, y)
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(30,40,70,0.34)'; rrect(ctx, -len / 2 + wd * 0.3, -wd / 2 + wd * 0.55, len, wd, wd * 0.5); ctx.fill();
    rrect(ctx, -len / 2, -wd / 2, len, wd, wd * 0.5); ctx.fillStyle = lg(ctx, 0, -wd / 2, 0, wd / 2, [[0, '#f0d4a0'], [0.5, '#d4a468'], [1, '#8e6234']]); ctx.fill();
    ctx.strokeStyle = 'rgba(80,46,16,0.45)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = 'rgba(100,60,24,0.25)'; ctx.beginPath(); for (let k = -1; k <= 1; k += 2) { ctx.moveTo(-len * 0.45, k * wd * 0.15); ctx.lineTo(len * 0.45, k * wd * 0.1); } ctx.stroke();
    ctx.restore();
  };
  // the taffy wound on its stick: a cylinder whose axis runs along the stick, with the spiral of the wrapped strip
  const coilSprite = (ctx, V, x, y, ang, rolledFrac, T, spin) => {
    const L = V.s * W0 * 2.6, d = V.s * lerp(0.05, 0.16, Math.sqrt(clamp(rolledFrac, 0, 1))), c = syrupColors(T);
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = 'rgba(30,40,80,0.26)'; ctx.beginPath(); ctx.ellipse(d * 0.1, d * 0.42, L * 0.54, d * 0.5, 0, 0, TAU); ctx.fill();
    rrect(ctx, -L / 2, -d / 2, L, d, d * 0.42); ctx.fillStyle = lg(ctx, 0, -d / 2, 0, d / 2, [[0, c.edge], [0.18, c.mid], [0.4, c.core], [0.7, c.body], [1, c.edge]]); ctx.fill();
    ctx.save(); rrect(ctx, -L / 2, -d / 2, L, d, d * 0.42); ctx.clip();
    ctx.strokeStyle = rgba(c.edge, 0.55); ctx.lineWidth = Math.max(1, d * 0.07);
    for (let k = -3; k <= 3; k++) { const o = (k + ((spin * 6) % 1)) * (L / 5); ctx.beginPath(); ctx.moveTo(o - L * 0.1, -d / 2); ctx.quadraticCurveTo(o + L * 0.1, 0, o - L * 0.1, d / 2); ctx.stroke(); }
    ctx.strokeStyle = `rgba(255,250,235,${0.3 + 0.45 * T})`; ctx.lineWidth = Math.max(1, d * 0.1); ctx.beginPath(); ctx.moveTo(-L * 0.42, -d * 0.26); ctx.lineTo(L * 0.42, -d * 0.26); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = rgba(c.edge, 0.8); ctx.lineWidth = 1; rrect(ctx, -L / 2, -d / 2, L, d, d * 0.42); ctx.stroke();
    ctx.restore();
  };
  const drawLadle = (ctx, x, y, s, vel, level, t) => {   // the lip of the ladle at (x, y); the handle leaves up and to the right
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.12 + clamp(vel[0] * 0.08, -0.12, 0.12));
    const R0 = s * 0.075, bx = R0 * 0.95, by = -R0 * 0.55;
    ctx.save(); ctx.translate(bx, by);
    // handle: a long steel rod with a wooden grip
    const hl = s * 0.62; ctx.rotate(-0.78);
    ctx.fillStyle = 'rgba(0,0,0,0.0)';
    ctx.fillStyle = lg(ctx, 0, -s * 0.011, 0, s * 0.011, [[0, '#f1f5f8'], [0.45, '#aeb8c2'], [1, '#626c76']]); rrect(ctx, R0 * 0.6, -s * 0.011, hl * 0.55, s * 0.022, s * 0.011); ctx.fill();
    rrect(ctx, R0 * 0.6 + hl * 0.5, -s * 0.021, hl * 0.5, s * 0.042, s * 0.021); ctx.fillStyle = lg(ctx, 0, -s * 0.021, 0, s * 0.021, [[0, '#e8b878'], [0.5, '#a8692f'], [1, '#5a3418']]); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.save(); ctx.translate(R0 * 0.6 + hl * 0.78, 0); drawFist(ctx, s * 0.15, 1, '#a8322a'); ctx.restore();   // the cook's hand on the grip
    ctx.rotate(0.78);
    // bowl
    ctx.fillStyle = lg(ctx, -R0, -R0, R0, R0, [[0, '#f4f7fa'], [0.4, '#b2bcc6'], [1, '#4c5560']]); ctx.beginPath(); ctx.ellipse(0, 0, R0, R0 * 0.92, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(20,30,40,0.5)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#2a2018'; ctx.beginPath(); ctx.ellipse(0, -R0 * 0.08, R0 * 0.82, R0 * 0.7, 0, 0, TAU); ctx.fill();
    const lv = clamp(level, 0, 1), sc = mix('#8a4a08', '#e89a2a', lv);
    ctx.fillStyle = rg(ctx, 0, -R0 * 0.08, 0, R0 * 0.8, [[0, mix(sc, '#ffd070', 0.5)], [1, sc]], -R0 * 0.2, -R0 * 0.28); ctx.beginPath(); ctx.ellipse(0, -R0 * 0.08 + (1 - lv) * R0 * 0.18, R0 * 0.78 * (0.6 + 0.4 * lv), R0 * 0.66 * (0.5 + 0.5 * lv), 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(-R0 * 0.3, -R0 * 0.3, R0 * 0.2, R0 * 0.08, -0.5, 0, TAU); ctx.fill();
    ctx.restore();
    // the lip
    ctx.fillStyle = '#9aa4ae'; ctx.beginPath(); ctx.moveTo(-R0 * 0.18, 0); ctx.lineTo(R0 * 0.35, -R0 * 0.45); ctx.lineTo(R0 * 0.5, -R0 * 0.1); ctx.closePath(); ctx.fill();
    ctx.restore(); void t;
  };
  const pourOverlay = (ctx, V, t) => {
    if (!cur) return;
    const res = buildPour(cur.raw, cur.load0), last = cur.raw[cur.raw.length - 1];
    const x = V.ox + last.x * V.s, y = V.oy + last.y * V.s, hgt = V.s * 0.17, has = res.pts.length ? !res.dry : cur.load0 > 0.02;
    const sp = res.pts.length ? res.pts[res.pts.length - 1] : { w: W0 * 1.2, k: 3 }, vel = [res.pts.length ? clamp(sp.v ?? 0, 0, 2) * 0.5 : 0, 0];
    if (res.pts.length) { ctx.save(); ctx.beginPath(); ctx.rect(V.ox, V.oy, D.ar * V.s, V.s); ctx.clip(); drawSyrup(ctx, V, res.pts); steam(ctx, V, t, [{ pts: res.pts }]); ctx.restore(); }
    const lipX = x + V.s * 0.012 * (1 + vel[0]), lipY = y - hgt;
    if (has) {   // the thread of syrup from the lip to the snow
      const wpx = Math.max(2, sp.w * V.s * 0.34), c = syrupColors(1);
      ctx.save(); ctx.lineCap = 'round';
      const lag = clamp((sp.v ?? 0) * 6, 0, 30) * (V.s / 330);
      const stroke = (col, lw, dx) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(lipX + dx, lipY + V.s * 0.02); ctx.quadraticCurveTo(lipX - lag * 0.5 + dx, (lipY + y) / 2, x + dx, y); ctx.stroke(); };
      if (sp.k === 4) { ctx.setLineDash([wpx * 1.6, wpx * 2.4]); }
      stroke(c.edge, wpx * 1.2, 0); stroke(c.mid, wpx * 0.8, 0); stroke('rgba(255,250,230,0.8)', Math.max(1, wpx * 0.22), -wpx * 0.18);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,230,160,0.35)'; ctx.beginPath(); ctx.ellipse(x, y, wpx * 2.3, wpx * 1.1, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
    drawLadle(ctx, lipX, lipY, V.s * 1.05, vel, load > 0 ? clamp(cur.load0 - cur.len * USE, 0.08, 1) : 0, t);
  };
  const autoLadle = (ctx, V, t) => {
    if (!auto?.hand || cur || rollCur || ptr) return;
    if (auto.st && !auto.st.roll) return;
  };

  const drawRolls = (ctx, V, t, finalLook) => {
    guides().forEach((g, gi) => {
      const r = finalLook ? { pr: g.pts.length - 1, started: true, done: true } : rolls[gi], n = g.pts.length;
      if (phase === 'pour' && !finalLook) return;
      if (!finalLook && !rollInfo.total[gi]) return;
      // the stain left on the snow by the part that was wound up
      if (r.pr > 1) { ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); for (let i = 0; i <= r.pr; i++) { const q = g.pts[i], x = V.ox + q[0] * V.s, y = V.oy + q[1] * V.s; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.strokeStyle = 'rgba(214,160,86,0.2)'; ctx.lineWidth = V.s * W0 * 0.9; ctx.stroke(); ctx.strokeStyle = 'rgba(244,214,160,0.18)'; ctx.lineWidth = V.s * W0 * 0.42; ctx.stroke(); ctx.restore(); }
      const i0 = Math.min(n - 1, r.pr), q = g.pts[i0], q2 = g.pts[Math.min(n - 1, i0 + 2)], q1 = g.pts[Math.max(0, i0 - 2)];
      let tang = Math.atan2(q2[1] - q1[1], q2[0] - q1[0]); if (i0 === 0) tang = Math.atan2(g.pts[3][1] - g.pts[0][1], g.pts[3][0] - g.pts[0][0]);
      const ax = tang + Math.PI / 2, x = V.ox + q[0] * V.s, y = V.oy + q[1] * V.s;
      const frac = finalLook ? 1 : rollFraction(gi), age = finalLook ? 9 : r.started ? (r.age ?? 0) + (now - (r.t0 ?? now)) : 0, T = Math.exp(-age / SET_TAU);
      // the stick: resting across the start of the strip, then carried by the roll; its handle points toward the player (down the screen)
      const handleDir = Math.sin(ax) >= 0 ? 1 : -1, sl = V.s * 0.46;
      stickSprite(ctx, x + Math.cos(ax) * handleDir * sl * 0.28, y + Math.sin(ax) * handleDir * sl * 0.28, ax, sl, V.s * 0.024, 1);
      if (r.started || finalLook) coilSprite(ctx, V, x, y, ax, frac, T, r.pr * 0.009 / (W0 * 2));
    });
  };

  const drawFinishedBoard = (ctx, V, rim, t) => {
    drawBoard(ctx, V, rim, t);
    ctx.save(); rrect(ctx, V.ox, V.oy, D.ar * V.s, V.s, Math.max(5, V.s * 0.02)); ctx.clip();
    // the ideal tray: faint stains and three taffies on their sticks
    drawRolls(ctx, V, t, true);
    ctx.restore();
  };

  const draw = (g, Rt, t) => {
    const { ctx } = g, W0r = Rt.work;
    const rim = clamp(Math.min(W0r.w, W0r.h) * 0.04, 10, 22);
    const Hw = clamp(0.26 * (W0r.h + dockRect(W0r).h), 70, 150), top = Math.max(40, Hw * 0.8);
    const Wk = { x: W0r.x + rim + 6, y: W0r.y + top + rim, w: W0r.w - 2 * (rim + 6), h: W0r.h - top - 2 * rim - 6 };
    const f = fitBox(Wk, D.ar), V = { ox: f.ox, oy: f.oy, s: f.s };
    geo = { ox: V.ox, oy: V.oy, s: V.s, bw: V.s * D.ar };
    drawBoard(ctx, V, rim, now);
    ctx.save(); rrect(ctx, V.ox, V.oy, D.ar * V.s, V.s, Math.max(5, V.s * 0.02)); ctx.clip();
    const list = pours;
    // hide what has been wound up
    if (phase === 'roll' || done) for (const it of pours) for (const s of it.pts) s.hide = s.gi >= 0 && s.gk <= rolls[s.gi].pr && (rolls[s.gi].started || rolls[s.gi].pr > 0);
    for (const it of list) drawSyrup(ctx, V, it.pts);
    steam(ctx, V, now, list);
    if (phase === 'roll' || done) drawRolls(ctx, V, now, false);
    // guides
    if (!done && phase === 'pour') {
      let nS = -1; guides().forEach((gd, i) => { if (nS < 0 && (covS[i] ?? 0) < 0.82) nS = i; });
      PR.drawGuides(ctx, V, prep, gmode, covS, [], nS, -1, now, '#e0701a');
    } else if (!done && phase === 'roll' && gmode !== 'off') {
      guides().forEach((gd, gi) => { const r = rolls[gi]; if (r.done || !rollInfo.total[gi]) return; const p0 = gd.pts[r.pr], x = V.ox + p0[0] * V.s, y = V.oy + p0[1] * V.s, k = 0.5 + 0.5 * Math.sin(now * 5); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, V.s * (0.012 + 0.005 * k), 0, TAU); ctx.fill(); ctx.stroke(); });
    }
    ctx.restore();
    pourOverlay(ctx, V, now);
    if (auto && auto.hand && !ptr && !done && (auto.st || cur)) {
      const h = auto.hand, x = V.ox + h[0] * V.s, y = V.oy + h[1] * V.s;
      if (auto.st?.roll) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.strokeStyle = '#1b1b1b'; ctx.beginPath(); ctx.arc(x, y, V.s * 0.013, 0, TAU); ctx.fill(); ctx.stroke(); }
    }
    autoLadle(ctx, V, now);
    // dock gauge: the syrup left in the ladle
    { const shown = cur ? clamp(cur.load0 - (buildPour(cur.raw, cur.load0).loadEnd ? 0 : 0) - cur.len * USE, 0, 1) : load, low = shown < 0.2 ? 0.5 + 0.5 * Math.sin(now * 9) : 1;
      if (phase === 'pour') dockGauge(g, ctx, W0r, { dot: '#d9871c', warn: shown < 0.2 ? 'Refill' : null, fill: (x, y, w, h) => { if (shown > 0.005) { rrect(ctx, x + 1, y + 1, Math.max(8, (w - 2) * shown), h - 2, 4); ctx.fillStyle = rgba('#e89a2a', low); ctx.fill(); } } }); }
    hintPill(g, ctx, W0r, hint());
    // the finished tray
    const th = Rt.thumb, ft = fitBox({ x: th.x + 8, y: th.y + 8, w: th.w - 16, h: th.h - 16 }, D.ar), Vt = { ox: ft.ox, oy: ft.oy, s: ft.s };
    shelf(ctx, th.x + th.w / 2, th.y + th.h - 3, th.w * 0.36);
    const rimT = Math.max(3, Vt.s * 0.05);
    ctx.save(); ctx.beginPath(); ctx.rect(th.x, th.y, th.w, th.h); ctx.clip();
    const thumbSnap = now; void thumbSnap;
    const key = `${round}|${Math.round(Vt.s)}`;
    if (!thumbBake || thumbBake.key !== key) { const sf = makeSurface(ctx, Math.ceil(D.ar * Vt.s + rimT * 2 + 8), Math.ceil(Vt.s + rimT * 2 + 8)); if (sf) { const Vl = { ox: rimT + 4, oy: rimT + 4, s: Vt.s }, sav = cache; cache = null; drawFinishedBoard(sf.ctx, Vl, rimT, 3); cache = sav; thumbBake = { key, sf, pad: rimT + 4 }; } else thumbBake = { key, sf: null }; }
    if (thumbBake.sf) ctx.drawImage(thumbBake.sf.canvas, Vt.ox - thumbBake.pad, Vt.oy - thumbBake.pad); else { const sav = cache; cache = null; drawFinishedBoard(ctx, Vt, rimT, 3); cache = sav; }
    ctx.restore();
  };
  let thumbBake = null;
  const titleArt = (g, S, t) => {
    const { ctx } = g, tt = t ?? 0, rim = Math.max(8, S.w * 0.03), f = fitBox({ x: S.x + rim + S.w * 0.03, y: S.y + S.h * 0.18, w: S.w * 0.94 - rim * 2, h: S.h * 0.64 }, D.ar), V = { ox: f.ox, oy: f.oy, s: f.s };
    const sav = cache; cache = null;
    drawFinishedBoard(ctx, V, rim, tt); cache = sav;
  };

  // ---- information, rules, state ---------------------------------------------------------------------------------------------------------------
  const hint = () => {
    if (done) return '';
    if (phase === 'pour') {
      if (load < 0.1 && !cur) return 'The ladle is empty: press Refill.';
      const i = guides().findIndex((_, k) => (covS[k] ?? 0) < 0.82);
      if (i >= 0) return pours.length ? 'Pour at a steady pace along the lit line' : (D.layers[0].hint ?? '');
      return 'Every strip is poured: press Set, then roll them while the taffy is soft';
    }
    const left = rolls.filter((r, i) => !r.done && rollInfo.total[i]).length;
    return left ? 'Press at the dot and drag along the strip to roll it on the stick' : 'All rolled: press Check';
  };
  const state = () => {
    const c = compute();
    return {
      technique: 'sweet-taffy', design: D.id, phase, load: Math.round(load * 100) / 100, pours: pours.length, strips: guides().map((g) => ({ n: g.pts.length })),
      todoS: guides().map((_, k) => k).filter((k) => (covS[k] ?? 0) < 0.8), rolls: rolls.map((r) => ({ pr: r.pr, done: r.done, started: r.started })),
      todoR: rolls.map((r, k) => k).filter((k) => phase === 'roll' && rollInfo && rollInfo.total[k] && !rolls[k].done),
      parts: { line: Math.round((c.line ?? 0) * 1000) / 1000, good: Math.round((c.goodLine ?? 0) * 1000) / 1000, stray: Math.round(c.stray * 1000) / 1000, roll: Math.round(rollScore() * 1000) / 1000 }, undo: undoStack.length,
    };
  };
  init();
  return {
    init, items: items_, control, work, tick, draw, attract, titleArt, result: () => done, score: total, hint,
    info: () => { const c = compute(), a = phase === 'pour' ? `Step 1 of 2: ${D.layers[0].name}` : `Step 2 of 2: ${D.layers[1].name}`; return [a, phase === 'pour' ? `Line ${Math.round((c.line ?? 0) * 100)}%  Even ${Math.round((c.goodLine ?? 0) * 100)}%` : `Rolled ${Math.round(rollScore() * 100)}%`]; },
    get caption() { return SC.words?.caption ?? 'Pour and roll this taffy'; },
    rules: () => D.rules ?? [
      'Press and drag to pour hot syrup from the ladle along the lit lines. The pace of your hand is the skill: steady lays a fat even ribbon, too slow and the syrup pools, too fast and it thins and breaks into drops.',
      'A ladle holds enough for about two strips: press Refill when it runs low. A dry ladle pours only a thin thread.',
      'Cold snow sets the syrup: hot it runs clear amber and glossy, then it turns pale, matte and chewy. Press Set when every strip is poured.',
      'Roll each strip on a stick: press at the glowing dot at the end of a strip and drag along it, and it winds onto the stick. Leave the dot and the roll stops. Rolling a strip that is still hot is sticky and counts for less.',
      'Score: how much of each lit line carries syrup (a line made at a good pace counts in full, a pooled or broken one counts less, syrup poured off the lines is wasted) and how much of each strip you roll. Doing nothing scores nothing.',
    ],
    point(id) {
      if (!geo) return null;
      const [k, rest] = id.split(':');
      if (k === 'g' || k === 'roll') { const [gi, f] = rest.split(',').map(Number), gd = guides()[gi]; if (!gd) return null; const q = gd.pts[Math.round(clamp(f, 0, 1) * (gd.pts.length - 1))]; return { x: geo.ox + q[0] * geo.s, y: geo.oy + q[1] * geo.s }; }
      return null;
    },
    state,
    get design() { return D; },
  };
}

registerTechnique('sweet-taffy', { make: (P, env) => createTaffy({ ...TAFFY_DEFAULTS, ...P }, env), scene: 'kc-sweet-sugarshack', mat: 'clay' });
void tint; void ease; void resetCover;

// shape-craft technique `pull` (1.26.0): hand-pulled noodles (lamian). The cook holds a rope of rested dough, swings it out to arm width, folds it in half,
// dusts it and goes again; every fold doubles the strands (1, 2, 4, 8 ... 1024) and thins them. The player drags to stretch (a ghost pair of hands shows
// the pace: too fast and the dough snaps, too slow and it sags and thins in the middle), releases to fold, dusts when the dough turns sticky, and
// decides how many folds to make to match the order (belt noodles, standard, thread-fine) before dropping the strands into the boiling pot.
// One round is a table of orders (default three bowls, one of each kind, in a seeded order). Score per bowl = the right number of folds, an even pull
// (follow the ghost, reach the marks, keep the tension low), a steady rhythm (start each pull on the beat), minus snaps and glued strands.
import { registerTechnique } from './registry.js';
import { starsFor, hash } from './geom.js';
import { shadowed, rrect, rgba, mix, tint } from './fx.js';
import { hintPill, dockRect } from './paint-ui.js';
import { wallBand } from './scenes.js';
import { fx as synth } from '../../../platform/engine-kit/synth.js';
import { createPuffs, drawHand, fsz, clamp, lerp, sm, r3, lin, rad, TAU } from './kc-fire-lib.js';

// ---- the orders -----------------------------------------------------------------------------------------------------------------------
// folds = the fold counts that make this kind; strands = 2^folds; a rope of 24 mm across becomes strands of 24 / sqrt(strands) mm.
const D0_MM = 24, FOLD_CAP = 10;
export const KINDS = {
  belt: { label: 'Belt noodles', short: 'belt', folds: [2, 3], note: 'broad and chewy' },
  standard: { label: 'Standard noodles', short: 'standard', folds: [5, 6], note: 'round and springy' },
  fine: { label: 'Thread-fine noodles', short: 'thread-fine', folds: [8, 9], note: 'as fine as thread' },
};
const KIND_ORDER = ['belt', 'standard', 'fine'];
export const mmOf = (folds) => D0_MM / Math.sqrt(2 ** folds);
const fmtMm = (v) => (v >= 10 ? v.toFixed(0) : v.toFixed(1));
const strandsText = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n % 1000 ? 1 : 0)}k` : String(n));

// ---- the pull ----------------------------------------------------------------------------------------------------------------------------
const C0 = 0.5, GAIN = 1.6, V_REF = 1.4;   // chord of the folded rope (in arm widths), pointer gain, the speed (arm widths per second per unit length) at which tension is 1
const PRESS_X = 0.52;                        // where, across the hands, a pull is gripped (fraction of the arm width from the middle)

function createSound(audio) {
  const F = (kind, p) => { try { return synth(audio, kind, p); } catch { return false; } };
  return {
    grab() { F('pop', { vel: 0.35 }); },
    stretch(c, tau) { F('scrape', { hz: 520 + c * 520 + tau * 260, dur: 0.16, vel: 0.14 + Math.min(0.3, tau * 0.25) }); },
    fold(f) { F('impact', { mat: 'wood', hz: 150 + (10 - f) * 7, vel: 0.62 }); F('thud', { hz: 70, vel: 0.36, delay: 0.02 }); F('whoosh', { dur: 0.22, vel: 0.22, down: true }); },
    dust() { F('whoosh', { dur: 0.35, vel: 0.28, down: false }); F('scrape', { hz: 3600, dur: 0.3, vel: 0.2, delay: 0.05 }); },
    snap() { F('impact', { mat: 'skin', hz: 300, vel: 0.55 }); F('bad', { hz: 260, vel: 0.5, delay: 0.04 }); },
    glue() { F('scrape', { hz: 420, dur: 0.25, vel: 0.28 }); },
    pot() { F('whoosh', { dur: 0.35, vel: 0.4, down: true }); F('splash', { vel: 0.7, delay: 0.55 }); F('splash', { vel: 0.4, delay: 0.7 }); },
    win(stars) { F('good', { hz: 660 + stars * 60, vel: 0.5 }); F('ring', { hz: 1760, dur: 1.0, vel: 0.22, delay: 0.1 }); },
  };
}

export function createPull(P, env) {
  const { rng } = env, SC = P.scene ?? {};
  const snd = createSound(env.audio);
  if (env.options?.soundLog) for (const k of Object.keys(snd)) { const f = snd[k]; snd[k] = (...a) => { env.options.soundLog.push({ kind: `pull.${k}` }); return f(...a); }; }
  const puffs = createPuffs(240);
  const ORDERS = Math.max(1, Math.min(4, P.orders ?? 3));
  const pinned = KINDS[P.kind] ? P.kind : null;

  let orders, oi, bowls, bpm, beatS, D, spring;
  let now, phase, phaseT, f, N, c, ct, ell, tau, vS, tPull, x0, dir, c0, errSum, errN, tauMax, tSnap, pulls, rhythms, snaps, glue, stick, dry, flour, dustAnim, aborts;
  let neck, snapAt, lastStretchSnd, geo, done, slapped, beatFlash, pullCount, foldFrom, foldEll, auto;

  // ---- setup ---------------------------------------------------------------------------------------------------------------------------
  const newDough = () => {
    f = 0; N = 1; c = C0; ct = C0; ell = C0; tau = 0; vS = 0; tPull = 0; errSum = 0; errN = 0; tauMax = 0; tSnap = 0; x0 = 0; dir = 1; c0 = C0;
    pulls = []; rhythms = []; snaps = 0; glue = 0; stick = 0.1; dry = 0; flour = 0.1; dustAnim = -1; aborts = 0; neck = []; snapAt = -9; slapped = false; foldFrom = 1; foldEll = 1;
    phase = 'idle'; phaseT = 0; pullCount = 0;
  };
  const init = () => {
    const ks = pinned ? new Array(ORDERS).fill(pinned) : rng.shuffle(KIND_ORDER);
    orders = Array.from({ length: ORDERS }, (_, i) => { const kind = ks[i % ks.length], fl = KINDS[kind].folds; return { kind, target: fl[rng.int(fl.length)] }; });
    bpm = [76, 84, 92][rng.int(3)]; beatS = 60 / bpm; D = beatS * 1.22; spring = 0.94 + rng.next() * 0.12;
    oi = 0; bowls = []; now = 0; done = null; beatFlash = 0; lastStretchSnd = -9;
    newDough();
    auto = { wait: 0.9 };
    if (P.__debug) preset(P.__debug);
  };
  // QA presets for screenshots (spec.params.__debug, never set by a fixture): start a bowl at a given fold and phase
  const preset = (d) => {
    oi = d.order ?? 0; f = d.folds ?? 0; N = 2 ** f; stick = d.stick ?? stick; flour = d.flour ?? flour; now = d.now ?? 2.0;
    if (d.phase === 'pull') { beginPull(0); tPull = d.t ?? 0.4; ct = c = ghostAt(tPull); ell = Math.max(ell, c); tau = d.tau ?? 0.9; auto.wait = 99; }
    else if (d.phase === 'snap') { snapAt = now; phase = 'relax'; phaseT = 0.1; auto.wait = 99; }
    else if (d.phase === 'pot') { bowls.push({ kind: orders[oi].kind, target: orders[oi].target, folds: f, strands: N, score: 94, even: 95, rhythm: 90, snaps: 0, glue: 0 }); phase = 'pot'; phaseT = d.t ?? 1.0; auto.wait = 99; }
    else if (d.phase === 'fold') { foldFrom = 1; foldEll = 1; phase = 'fold'; phaseT = d.t ?? 0.3; auto.wait = 99; }
    else auto.wait = 99;
  };

  // ---- the rules of the dough ------------------------------------------------------------------------------------------------------------
  const target = () => orders[oi].target;
  const beatPhase = () => (now % beatS) / beatS;
  const ghostAt = (t) => lerp(c0, 1, sm(t / D));                       // where the hands should be t seconds after the grab
  const snapLimit = () => 1.9 - 0.075 * f - 0.5 * dry + (spring - 1) * 1.0;
  const vRef = () => V_REF * spring;

  const beginPull = (px) => {
    if (done || phase !== 'idle') return false;
    phase = 'pull'; phaseT = 0; tPull = 0; x0 = px ?? 0; c0 = c; errSum = 0; errN = 0; tauMax = 0; tSnap = 0; neck = [];
    const ph = beatPhase(), off = Math.min(ph, 1 - ph);
    rhythms.push(clamp(1 - Math.max(0, off - 0.09) / 0.24, 0, 1));
    snd.grab(); return true;
  };
  const setTarget = (v) => { if (phase === 'pull') ct = clamp(v, C0 * 0.9, 1.4); };
  const pullQuality = () => {
    const err = errN ? errSum / errN : 1;
    const qTrack = clamp(1 - Math.max(0, err - 0.02) / 0.1, 0, 1);
    const qLen = clamp(1 - Math.max(0, Math.abs(c - 1) - 0.05) / 0.2, 0, 1);
    const qTen = tauMax < 1.0 ? 1 : clamp(1 - (tauMax - 1.0) / 0.9, 0, 1);
    const qTime = clamp(1 - Math.max(0, Math.abs(tPull - (D + 0.06)) - 0.18) / 0.5, 0, 1);
    return qTrack * 0.42 + qLen * 0.2 + qTen * 0.18 + qTime * 0.2;
  };
  const endPull = () => {
    if (phase !== 'pull') return;
    if (tPull < 0.3 || c < 0.66) { aborts++; rhythms.pop(); ell = C0; ct = C0; phase = 'relax'; phaseT = 0; return; }
    pulls.push(pullQuality() * (1 - 0.35 * Math.min(1, dry)));
    foldFrom = c; foldEll = Math.max(ell, c);
    phase = 'fold'; phaseT = 0; slapped = false;
  };
  const doFold = () => {   // the slap on the board: the strands double
    slapped = true;
    if (f < FOLD_CAP) { f++; N *= 2; }
    if (stick > 0.95) { glue++; pulls[pulls.length - 1] *= 0.55; snd.glue(); }
    stick = clamp(stick + 0.3 + 0.045 * f, 0, 1.4); dry = Math.max(0, dry - 0.1); flour = Math.max(0, flour - 0.18);
    snd.fold(f);
    if (geo) puffs.emit('flour', geo.cx, geo.benchY + geo.benchH * 0.3, { count: 7, size: 16, speed: 70, life: 1.25, alpha: 0.5, spread: Math.PI * 1.7, grow: 2.2, drift: 14 });
  };
  const snap = () => {
    snaps++; snapAt = now; snd.snap();
    if (geo) { puffs.emit('flour', geo.cx, geo.handY + geo.benchH * 0.1, { count: 8, size: 14, speed: 90, life: 1, alpha: 0.5, drift: 20 }); puffs.emit('crumb', geo.cx, geo.handY, { count: 6, size: 6, speed: 90, life: 0.8, gravity: 520, color: '#e8d4a6', spread: Math.PI * 1.4 }); }
    if (f > 0) { f--; N = Math.max(1, N / 2); }
    ell = C0; ct = C0; phase = 'relax'; phaseT = 0; tau = 0; vS = 0; tSnap = 0; pulls.push(0);
  };
  const dust = () => {
    if (done || (phase !== 'idle' && phase !== 'relax')) return false;
    if (stick < 0.3) dry = Math.min(1.2, dry + 0.34);
    stick = Math.max(0, stick - 0.62); flour = 1; dustAnim = 0; snd.dust();
    if (geo) {
      const bx = geo.bowl.x, by = geo.bowl.y;
      for (let k = 0; k < 3; k++) puffs.emit('flour', bx + k * (geo.cx - bx) * 0.25, by - 14 - 22 * Math.sin(k * 1.1), { count: 4, size: 12, speed: 36, life: 1.1, alpha: 0.5, angle: -0.5, spread: 1.2, drift: 10, grow: 2 });
      puffs.emit('flour', geo.cx, geo.handY + 8, { count: 10, size: 20, speed: 40, life: 1.6, alpha: 0.48, grow: 2.4, drift: 16 });
    }
    return true;
  };

  // the bowl: scores of the order (shown when the noodles go in the pot)
  const countScore = () => [100, 52, 16, 0][Math.min(3, Math.abs(f - target()))];
  const evenScore = () => (pulls.length ? 100 * (pulls.reduce((s, v) => s + v, 0) / pulls.length) : 0);
  const rhythmScore = () => (rhythms.length ? 100 * (rhythms.reduce((s, v) => s + v, 0) / rhythms.length) : 0);
  const bowlScore = () => clamp(Math.round(0.4 * countScore() + 0.45 * evenScore() + 0.15 * rhythmScore()) - 9 * snaps - 5 * glue, 0, 100);
  const dropInPot = () => {
    if (done || (phase !== 'idle' && phase !== 'relax')) return false;
    const o = orders[oi];
    bowls.push({ kind: o.kind, target: o.target, folds: f, strands: N, score: bowlScore(), even: Math.round(evenScore()), rhythm: Math.round(rhythmScore()), snaps, glue });
    phase = 'pot'; phaseT = 0; snd.pot();
    return true;
  };
  const total = () => Math.round((bowls.reduce((s, b) => s + b.score, 0) + (phase === 'pot' || done || !pulls.length ? 0 : bowlScore())) / ORDERS);
  const finish = () => {
    const s = Math.round(bowls.reduce((a, b) => a + b.score, 0) / ORDERS), stars = starsFor(s), W = SC.words ?? {};
    const exact = bowls.filter((b) => b.folds === b.target).length;
    done = { score: s, max: 100, stars, headline: stars === 3 ? (W.win ?? 'Pulled true') : stars ? (W.ok ?? 'Good noodles') : (W.retry ?? 'Back to the board'), detail: `${exact} of ${bowls.length} bowls with the right strands, ${bowls.reduce((a, b) => a + b.snaps, 0)} snaps`, note: 'Hand-pulled noodles double their strands with every fold.' };
    snd.win(stars);
  };

  // ---- time ---------------------------------------------------------------------------------------------------------------------------
  const tick = (dt) => {
    now += dt; phaseT += dt; puffs.update(dt);
    beatFlash = Math.max(0, beatFlash - dt * 3);
    if (beatPhase() < dt / beatS + 1e-6 && !done) beatFlash = 1;
    // the steam over the pot
    if (geo && geo.potTop !== undefined && Math.floor(now * 7) !== Math.floor((now - dt) * 7)) puffs.emit('steam', geo.pot.x + (hash(Math.floor(now * 7), 3) - 0.5) * geo.pot.rx * 1.2, geo.potTop - geo.pot.ry * 0.3, { count: 1, size: geo.pot.rx * 0.34, speed: 30, life: 2.4, alpha: 0.3, color: '#f4f6f8', grow: 2.6, drift: 14, spread: 0.7 });
    if (dustAnim >= 0) { dustAnim += dt; if (dustAnim > 0.7) dustAnim = -1; }
    if (phase === 'pull') {
      tPull += dt;
      const prev = c; c += (ct - c) * Math.min(1, dt * 28);
      const v = (c - prev) / dt; vS += (v - vS) * Math.min(1, dt * 24);
      const raw = Math.max(0, vS) / (vRef() * Math.max(0.5, ell));
      tau += (raw - tau) * Math.min(1, dt * 18);
      ell = Math.max(ell, c);
      tauMax = Math.max(tauMax, tau);
      errSum += Math.abs(c - ghostAt(tPull - 0.04)); errN++;
      // tension piles up as a thin place: remember where it will give way
      if (tau > 1.15) { const j = Math.floor(hash(pullCount, f, 2) * 5) + 2; neck[j] = (neck[j] ?? 0) + (tau - 1.15) * dt * 1.6; }
      if (tPull > D + 0.5 && Math.abs(c - ct) < 0.01) neck[4] = (neck[4] ?? 0) + (tPull - D - 0.5) * 0.0012;   // held too long: it sags and thins in the middle
      if (tau > snapLimit()) tSnap += dt; else tSnap = Math.max(0, tSnap - dt * 2);
      if (tSnap > 0.08) { snap(); return; }
      if (now - lastStretchSnd > 0.13 && Math.abs(vS) > 0.25) { lastStretchSnd = now; snd.stretch(c, tau); }
    } else if (phase === 'relax') {
      c += (C0 - c) * Math.min(1, dt * 7); tau += (0 - tau) * Math.min(1, dt * 9);
      if (phaseT > 0.45) { phase = 'idle'; phaseT = 0; c = C0; ct = C0; ell = C0; neck = []; tau = 0; vS = 0; }
    } else if (phase === 'fold') {
      tau += (0 - tau) * Math.min(1, dt * 9); vS = 0;
      const u = phaseT / 0.62;
      if (u >= 0.78 && !slapped) doFold();
      if (u >= 1) { phase = 'idle'; phaseT = 0; c = C0; ct = C0; ell = C0; neck = []; pullCount++; }
    } else if (phase === 'pot') {
      if (phaseT > 0.55 && phaseT - dt <= 0.55 && geo && geo.potTop !== undefined) {
        puffs.emit('splash', geo.pot.x, geo.potTop, { count: 14, size: 7, speed: 190, life: 0.8, gravity: 620, color: '#cfe6f2', spread: Math.PI * 0.9 });
        puffs.emit('steam', geo.pot.x, geo.potTop - geo.pot.ry * 0.3, { count: 5, size: geo.pot.rx * 0.5, speed: 60, life: 2.0, alpha: 0.45, grow: 2.6, drift: 20 });
      }
      if (phaseT >= 1.9) { if (oi + 1 >= ORDERS) { phase = 'done'; finish(); } else { oi++; newDough(); phase = 'next'; phaseT = 0; } }
    } else if (phase === 'next') {
      if (phaseT >= 0.7) { phase = 'idle'; phaseT = 0; }
    } else if (phase === 'idle') { tau += (0 - tau) * Math.min(1, dt * 7); vS = 0; c = C0; ell = C0; }
  };

  // ---- pointer: grip anywhere above the dock and drag outward; the flour bowl dusts ----------------------------------------------------------------
  const work = (p) => {
    if (!geo || done) return;
    const inArea = p.x >= geo.area.x && p.x <= geo.area.x + geo.area.w && p.y >= geo.area.y && p.y <= geo.area.y + geo.area.h;
    if (p.pressed && inArea) {
      if (Math.hypot(p.x - geo.bowl.x, (p.y - geo.bowl.y) * 1.3) < geo.bowl.r * 1.25) { dust(); return; }
      if (phase === 'idle') { dir = p.x >= geo.cx ? 1 : -1; beginPull(p.x); }
    }
    if (phase === 'pull') {
      if (p.down) setTarget(c0 + (GAIN * Math.max(0, (p.x - x0) * dir)) / geo.armPx);
      else endPull();
    }
  };

  // ---- attract: a cook who dusts when the dough turns sticky, pulls on the beat along the ghost, and stops at the right fold --------------------------------
  const attract = (dt) => {
    if (done) return;
    if (phase === 'pull') {
      setTarget(ghostAt(tPull + 0.03));
      if (tPull >= D + 0.05) endPull();
      return;
    }
    if (phase !== 'idle') return;
    if (auto.wait > 0) { auto.wait -= dt; return; }
    if (stick > 0.52 && f < target()) { dust(); auto.wait = 0.55; return; }
    if (f >= target()) { dropInPot(); auto.wait = 0.4; return; }
    const ph = beatPhase();
    if (ph < 0.03 || ph > 0.985) { dir = 1; beginPull(0); auto.wait = 0.05; }
  };

  const items = () => [{ id: 'dust', kind: 'btn', label: 'Dust' }, { id: 'check', kind: 'btn', label: 'Into the pot', primary: true }];
  const control = (id) => { if (done) return; if (id === 'dust') dust(); else if (id === 'check') dropInPot(); };

  // ---- drawing ---------------------------------------------------------------------------------------------------------------------------
  const DOUGH = '#efe0bc', DOUGH_D = '#c9b186', DOUGH_L = '#fff7e0';
  const geometry = (W0) => {
    const dock = dockRect(W0), full = { x: W0.x, y: W0.y, w: W0.w, h: W0.h + dock.h };
    const benchTop = W0.y + wallBand(full, SC), benchH = W0.y + W0.h - benchTop, cx = W0.x + W0.w / 2;
    const armPx = Math.min(W0.w * 0.72, benchH * 1.5 + 80), s = armPx * 0.037;
    const handY = benchTop + benchH * 0.34;
    const pot = { x: W0.x + W0.w * 0.82, y: benchTop + Math.min(benchH * 0.1, 22), rx: Math.min(W0.w * 0.125, 74), ry: 0 }; pot.ry = pot.rx * 0.34;
    const bowl = { x: W0.x + W0.w * 0.13, y: W0.y + W0.h - Math.min(benchH * 0.16, 56), r: Math.min(W0.w * 0.085, 48) };
    return { cx, armPx, s, handY, benchTop, benchY: benchTop, benchH, pot, bowl, area: { x: W0.x, y: W0.y, w: W0.w, h: W0.h }, bottom: W0.y + W0.h, W0, dock, potTop: pot.y - pot.ry * 0.2, potH: pot.rx * 0.78 };
  };
  const sagOf = (G, cc, ee, sf) => { const chord = cc * G.armPx, len = ee * G.armPx * (1 + sf); return Math.sqrt(Math.max(0, 3 * chord * Math.max(0, len - chord)) / 8); };

  // the stove, pot and steam, behind the dough
  const drawPotBack = (ctx, G, t) => {
    const { x, y, rx, ry } = G.pot;
    // brick stove with a glowing fire mouth
    const sx0 = x - rx * 1.2, sw = rx * 2.4, sy0 = y + ry * 0.6, sh = Math.min(G.benchH * 0.34, rx * 1.5);
    ctx.fillStyle = lin(ctx, 0, sy0, 0, sy0 + sh, [[0, '#4a3a34'], [1, '#1c1412']]); rrect(ctx, sx0, sy0, sw, sh, 5); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.4; for (let r = 0; r < 4; r++) for (let k = 0; k < 7; k++) { const bx = sx0 + ((k + (r % 2) * 0.5) / 7) * sw; ctx.strokeRect(bx, sy0 + (sh * r) / 4, sw / 7, sh / 4); }
    const fl = 0.8 + 0.2 * Math.sin(t * 9) * Math.sin(t * 5.1);
    ctx.fillStyle = '#0c0706'; rrect(ctx, x - rx * 0.5, sy0 + sh * 0.3, rx, sh * 0.55, 6); ctx.fill();
    ctx.save(); rrect(ctx, x - rx * 0.5, sy0 + sh * 0.3, rx, sh * 0.55, 6); ctx.clip();
    ctx.fillStyle = rad(ctx, x, sy0 + sh * 0.85, 2, rx * 0.6, [[0, `rgba(255,${Math.round(210 * fl)},110,1)`], [0.5, 'rgba(240,100,30,0.95)'], [1, 'rgba(120,30,10,0.9)']]); ctx.fillRect(x - rx * 0.5, sy0 + sh * 0.3, rx, sh * 0.55); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rad(ctx, x, sy0 + sh * 0.6, 4, rx * 1.9, [[0, `rgba(255,150,70,${0.34 * fl})`], [1, 'rgba(255,100,30,0)']]); ctx.fillRect(x - rx * 2, sy0 - rx, rx * 4, rx * 3); ctx.restore();
    // the pot (back half: the far rim and the water)
    const top = G.potTop, hgt = G.potH;
    ctx.fillStyle = lin(ctx, x - rx, 0, x + rx, 0, [[0, '#7a838c'], [0.25, '#d2d8de'], [0.5, '#a9b1b9'], [0.8, '#59616a'], [1, '#2c3238']]);
    ctx.beginPath(); ctx.moveTo(x - rx, top); ctx.lineTo(x - rx * 0.94, top + hgt); ctx.ellipse(x, top + hgt, rx * 0.94, ry * 0.94, 0, Math.PI, 0, true); ctx.lineTo(x + rx, top); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2a2f35'; ctx.beginPath(); ctx.ellipse(x, top, rx, ry, 0, 0, TAU); ctx.fill();
    // water: rolling boil, foam and bubbles
    ctx.fillStyle = lin(ctx, 0, top - ry, 0, top + ry, [[0, '#9cc8d4'], [1, '#4c8798']]); ctx.beginPath(); ctx.ellipse(x, top + ry * 0.06, rx * 0.9, ry * 0.84, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(x, top + ry * 0.06, rx * 0.9, ry * 0.84, 0, 0, TAU); ctx.clip();
    for (let k = 0; k < 22; k++) { const a = hash(k, 3) * TAU + t * 0.4 * (hash(k, 4) - 0.5), rr = Math.sqrt(hash(k, 5)) * 0.8, bx = x + Math.cos(a) * rx * 0.84 * rr, by = top + ry * 0.06 + Math.sin(a) * ry * 0.76 * rr, ph = (t * (1.5 + hash(k, 6)) + hash(k, 7)) % 1, br = 2.5 + hash(k, 8) * 5 + ph * 3; ctx.strokeStyle = `rgba(255,255,255,${0.75 - ph * 0.6})`; ctx.fillStyle = `rgba(255,255,255,${0.35 - ph * 0.3})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.ellipse(x - rx * 0.2, top - ry * 0.25, rx * 0.5, ry * 0.18, -0.1, 0, TAU); ctx.fill();
    ctx.restore();
  };
  const drawPotFront = (ctx, G, t) => {
    const { x, rx, ry } = G.pot, top = G.potTop, hgt = G.potH;
    // the front wall of the pot (opaque: anything that has gone into the pot is hidden behind it), then the lip of the rim
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x - rx, top); ctx.ellipse(x, top, rx, ry, 0, Math.PI, 0, true); ctx.lineTo(x + rx * 0.94, top + hgt); ctx.ellipse(x, top + hgt, rx * 0.94, ry * 0.94, 0, 0, Math.PI); ctx.closePath();
    ctx.fillStyle = lin(ctx, x - rx, 0, x + rx, 0, [[0, '#7a838c'], [0.25, '#d2d8de'], [0.5, '#a9b1b9'], [0.8, '#59616a'], [1, '#2c3238']]); ctx.fill();
    ctx.clip();
    const fl = 0.7 + 0.3 * Math.sin(t * 9) * Math.sin(t * 5.1);
    ctx.fillStyle = lin(ctx, 0, top + hgt * 0.4, 0, top + hgt + ry, [[0, 'rgba(255,140,50,0)'], [1, `rgba(255,130,40,${0.6 * fl})`]]); ctx.fillRect(x - rx, top + hgt * 0.4, rx * 2, hgt * 0.8);
    ctx.fillStyle = 'rgba(255,255,255,0.34)'; ctx.fillRect(x - rx * 0.62, top + ry, rx * 0.12, hgt);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x - rx * 0.2, top + ry, rx * 0.05, hgt);
    ctx.restore();
    ctx.strokeStyle = '#e4e9ee'; ctx.lineWidth = Math.max(3, rx * 0.05); ctx.beginPath(); ctx.ellipse(x, top, rx, ry, 0, 0.02, Math.PI - 0.02); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,46,52,0.65)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.ellipse(x, top, rx, ry, 0, 0.02, Math.PI - 0.02); ctx.stroke();
    ctx.strokeStyle = '#3a4047'; ctx.lineWidth = Math.max(4, rx * 0.06); ctx.lineCap = 'round';
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sd * rx * 0.98, top + hgt * 0.12); ctx.quadraticCurveTo(x + sd * rx * 1.26, top + hgt * 0.1, x + sd * rx * 1.22, top + hgt * 0.4); ctx.stroke(); }
  };

  // the dough tray and the bowl of flour
  const drawTray = (ctx, G) => {
    const x = G.W0.x + G.W0.w * 0.15, y = G.benchTop + G.benchH * 0.16, w = Math.min(G.W0.w * 0.2, 150), h = w * 0.34;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(x, y + h * 0.6, w * 0.62, h * 0.46, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [[0, '#8a9aa6'], [1, '#4a5660']]); rrect(ctx, x - w / 2, y, w, h, 6); ctx.fill();   // enamel tray
    ctx.fillStyle = '#f0f3f5'; rrect(ctx, x - w / 2 + 3, y + 3, w - 6, h * 0.5, 4); ctx.fill();
    for (let k = 0; k < 3; k++) { // oiled dough logs resting
      const lx = x - w * 0.3 + k * w * 0.3, ly = y + h * 0.3;
      ctx.fillStyle = lin(ctx, 0, ly - h * 0.4, 0, ly + h * 0.4, [[0, tint(DOUGH, 0.15)], [0.5, DOUGH], [1, DOUGH_D]]); rrect(ctx, lx - w * 0.13, ly - h * 0.32, w * 0.26, h * 0.62, h * 0.3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(lx - w * 0.04, ly - h * 0.15, w * 0.07, h * 0.08, -0.2, 0, TAU); ctx.fill();
    }
    ctx.restore();
  };
  const drawBowl = (ctx, G, flashK) => {
    const { x, y, r } = G.bowl;
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x + 3, y + r * 0.35, r * 1.05, r * 0.4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = lin(ctx, x - r, 0, x + r, 0, [[0, '#cfd5dc'], [0.3, '#f7f9fb'], [1, '#8f98a2']]); ctx.beginPath(); ctx.moveTo(x - r, y - r * 0.28); ctx.quadraticCurveTo(x - r * 0.9, y + r * 0.55, x, y + r * 0.58); ctx.quadraticCurveTo(x + r * 0.9, y + r * 0.55, x + r, y - r * 0.28); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e2e7ec'; ctx.beginPath(); ctx.ellipse(x, y - r * 0.28, r, r * 0.3, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fbfcfd'; ctx.beginPath(); ctx.moveTo(x - r * 0.88, y - r * 0.28); ctx.quadraticCurveTo(x, y - r * 0.01, x + r * 0.88, y - r * 0.28); ctx.quadraticCurveTo(x, y - r * 0.5, x - r * 0.88, y - r * 0.28); ctx.fill();   // heaped flour
    for (let k = 0; k < 20; k++) { ctx.fillStyle = `rgba(210,215,225,${0.2 + 0.3 * hash(k, 2)})`; ctx.beginPath(); ctx.arc(x - r * 0.7 + hash(k, 3) * r * 1.4, y - r * (0.33 + hash(k, 4) * 0.08), 1.1, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#3f6fb0'; ctx.lineWidth = Math.max(2, r * 0.06); ctx.beginPath(); ctx.moveTo(x - r * 0.93, y - r * 0.12); ctx.quadraticCurveTo(x, y + r * 0.2, x + r * 0.93, y - r * 0.12); ctx.stroke();   // blue band
    ctx.strokeStyle = '#9a6a38'; ctx.lineWidth = r * 0.1; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + r * 0.3, y - r * 0.4); ctx.lineTo(x + r * 1.1, y - r * 0.9); ctx.stroke();   // a scoop
    if (flashK > 0) { ctx.strokeStyle = `rgba(255,236,150,${flashK})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y - r * 0.1, r * 1.2, r * 0.75, 0, 0, TAU); ctx.stroke(); }
    ctx.restore();
  };

  // marks on the counter: how far the arms reach
  const drawMarks = (ctx, G, beat) => {
    const y0 = G.benchTop + G.benchH * 0.62, y1 = G.bottom - 6;
    ctx.save();
    for (const sd of [-1, 1]) {
      const x = G.cx + sd * G.armPx / 2;
      ctx.strokeStyle = 'rgba(255,246,222,0.32)'; ctx.lineWidth = 2; ctx.setLineDash([7, 6]); ctx.beginPath(); ctx.moveTo(x, G.benchTop + G.benchH * 0.06); ctx.lineTo(x, y1); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = `rgba(255,236,160,${0.55 + 0.4 * beat})`; ctx.beginPath(); ctx.moveTo(x, y0 - 8); ctx.lineTo(x + 7, y0 + 4); ctx.lineTo(x - 7, y0 + 4); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  };

  // the dough: N strands between the hands
  const drawRope = (ctx, G, st) => {
    const { HL, HR, sag, Wb, strands, tens, neckF, flourK, sticky, noShadow } = st, SEG = 26;
    const pts = [];
    for (let i = 0; i <= SEG; i++) { const u = i / SEG; pts.push([lerp(HL[0], HR[0], u), lerp(HL[1], HR[1], u) + 4 * sag * u * (1 - u), u]); }
    const m = Math.min(strands, 110), fan = 1 + 0.55 * clamp(Math.log2(Math.max(1, strands)) / 9, 0, 1);
    // soft shadow of the dough on the counter
    if (!noShadow) { ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#000';
    const gy = G.handY + G.benchH * 0.5, midx = (HL[0] + HR[0]) / 2; ctx.beginPath(); ctx.ellipse(midx, gy + (sag * 0.1), Math.abs(HR[0] - HL[0]) * 0.4 + 10, 10 + Wb * 0.22, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    // the haze of fine strands behind the bundle
    if (strands >= 16) { ctx.save(); ctx.globalAlpha = 0.2; ctx.strokeStyle = DOUGH_D; ctx.lineWidth = Wb * 1.05; ctx.lineCap = 'round'; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + Wb * 0.06) : ctx.moveTo(x, y + Wb * 0.06))); ctx.stroke(); ctx.restore(); }
    const ws = clamp((Wb / Math.ceil(Math.sqrt(m))) * 1.12, 1.1, Wb);
    // draw strands from the back (top) to the front (bottom)
    const order = Array.from({ length: m }, (_, j) => j).sort((a, b) => ((a + 0.5) / m + (hash(a, 5) - 0.5) * 0.3) - ((b + 0.5) / m + (hash(b, 5) - 0.5) * 0.3));
    for (const j of order) {
      const v = ((j + 0.5) / m - 0.5) * 2 + (hash(j, 5) - 0.5) * (m > 1 ? 0.6 / m : 0), shadeK = clamp(0.5 + 0.55 * v, 0, 1);
      const path = (dy) => { ctx.beginPath(); pts.forEach(([x, y, u], i) => { const spread = (0.45 + 0.55 * Math.sin(u * Math.PI)) * (1 + 0.45 * clamp(tens, 0, 1.4) * Math.sin(u * Math.PI)) * fan; const nk = neckF(u), yy = y + v * Wb * 0.5 * spread * (1 - nk * 0.7) + dy + (hash(j, 9) - 0.5) * sag * 0.05 * Math.sin(u * Math.PI) * m / (m + 2) + Math.sin(u * 9 + j) * (m > 6 ? 0.5 : 0.8); if (i) ctx.lineTo(x, yy); else ctx.moveTo(x, yy); }); };
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      path(ws * 0.2 + 1.5); ctx.strokeStyle = 'rgba(70,45,15,0.30)'; ctx.lineWidth = ws + 1; ctx.stroke();
      path(0); ctx.strokeStyle = mix(mix(DOUGH, '#7a5a30', 0.42), mix(DOUGH, '#fff6dc', 0.12), 1 - shadeK); ctx.lineWidth = ws; ctx.stroke();
      if (ws < 3) { path(-ws * 0.3); ctx.strokeStyle = rgba(DOUGH_L, 0.42 * (1 - shadeK * 0.6)); ctx.lineWidth = Math.max(0.5, ws * 0.34); ctx.stroke(); }
      if (ws >= 3) { path(-ws * 0.22); ctx.strokeStyle = rgba(DOUGH_L, 0.55 * (1 - shadeK * 0.5)); ctx.lineWidth = ws * 0.3; ctx.stroke(); }
      if (strands === 1) { path(ws * 0.18); ctx.strokeStyle = 'rgba(120,90,50,0.22)'; ctx.lineWidth = ws * 0.35; ctx.stroke(); }
    }
    // a skin of flour, wet sheen when sticky, glassy pale places where it is stretched thin
    ctx.save(); ctx.fillStyle = rgba('#ffffff', 0.7 * flourK);
    for (let k = 0; k < 70; k++) { if (hash(k, 22) > flourK + 0.15) continue; const i = Math.min(SEG - 1, Math.floor(hash(k, 21) * SEG)), [x, y] = pts[i]; ctx.beginPath(); ctx.arc(x + (hash(k, 23) - 0.5) * 8, y + (hash(k, 24) - 0.5) * Wb * 0.9, 0.8 + hash(k, 25) * (strands > 8 ? 1 : 2.2), 0, TAU); ctx.fill(); }
    ctx.restore();
    if (sticky > 0.45) { ctx.save(); ctx.globalAlpha = clamp((sticky - 0.45) * 0.9, 0, 0.6); ctx.strokeStyle = '#fffbe8'; ctx.lineWidth = Math.max(1.5, Wb * 0.07); ctx.lineCap = 'round'; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y - Wb * 0.24) : ctx.moveTo(x, y - Wb * 0.24))); ctx.stroke(); ctx.restore(); }
    if (tens > 0.9) { ctx.save(); ctx.globalAlpha = clamp((tens - 0.9) * 0.6, 0, 0.55); ctx.strokeStyle = '#fff4d8'; ctx.lineWidth = Math.max(2, Wb * 0.2); ctx.lineCap = 'round'; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.restore(); }
  };

  const handsFor = (G, cc, lowered) => { const half = (cc * G.armPx) / 2, y = G.handY + (lowered ?? 0); return [[G.cx - half, y], [G.cx + half, y]]; };
  const bundleW = (G, e, one) => Math.max(10, G.s * 1.75 * Math.sqrt(0.5 / Math.max(0.4, e))) * (one ? 1.12 : 1);
  const neckFn = () => (u) => { let k = 0; for (let i = 0; i < neck.length; i++) if (neck[i]) { const pu = (i + 0.5) / 9, d = (u - pu) / 0.07; k += Math.min(0.8, neck[i]) * Math.exp(-d * d); } return Math.min(0.85, k); };

  // snapped dough: two halves hanging from the hands with torn, frayed ends
  const drawSnapped = (ctx, G, ts, HL, HR) => {
    const len = G.armPx * 0.3, Wb = bundleW(G, 0.8, N === 1) * 0.92, k = Math.min(1, ts * 7);
    for (const sd of [-1, 1]) {
      const H0 = sd < 0 ? HL : HR, E = [H0[0] - sd * len * 0.9 * k, H0[1] + len * 0.75 * k], pa = sd < 0 ? H0 : E, pb = sd < 0 ? E : H0;
      drawRope(ctx, G, { HL: pa, HR: pb, sag: len * 0.18 * k, Wb, strands: N, tens: 0, neckF: () => 0, flourK: 0.3, sticky: 0 });
      ctx.save(); ctx.strokeStyle = rgba(DOUGH, 0.9); ctx.lineWidth = 1.4; ctx.lineCap = 'round';
      for (let q = 0; q < 7; q++) { ctx.beginPath(); ctx.moveTo(E[0], E[1] + (q - 3) * Wb * 0.11); ctx.lineTo(E[0] - sd * (4 + hash(q, 3) * 10) * k, E[1] + (q - 3) * Wb * 0.14 + (hash(q, 5) - 0.3) * 8 * k); ctx.stroke(); }
      ctx.restore();
    }
  };

  const draw = (g, Rt) => {
    const { ctx } = g, W0 = Rt.work, G = geometry(W0), t = now;
    geo = G;
    const beat = (phase === 'idle' || phase === 'pull') && !done ? beatFlash : 0;
    ctx.save(); ctx.beginPath(); ctx.rect(W0.x, W0.y, W0.w, W0.h); ctx.clip();
    drawPotBack(ctx, G, t); drawTray(ctx, G); drawBowl(ctx, G, dustAnim >= 0 ? 1 - dustAnim / 0.7 : 0); drawMarks(ctx, G, beat);
    // where the dough and the hands are now
    let cc = c, ee = ell, lowered = 0, sf = 0.02 + 0.22 * Math.exp(-2.4 * tau), potU = -1;
    const sfRest = 0.24;
    if (phase === 'idle' || phase === 'next') { cc = C0; ee = C0; sf = sfRest * (1 + 0.1 * Math.sin(t * 1.6)); }
    if (phase === 'next') { lowered = (1 - sm(clamp(phaseT / 0.7, 0, 1))) * -G.benchH * 0.3; }
    if (phase === 'fold') {
      const u = clamp(phaseT / 0.62, 0, 1), k = sm(u);
      cc = lerp(foldFrom, C0, k); ee = lerp(foldEll, C0, k); sf = 0.38 * Math.sin(u * Math.PI) + 0.02;
      lowered = u > 0.55 ? sm(clamp((u - 0.55) / 0.23, 0, 1)) * G.benchH * 0.12 * (u > 0.78 ? 1 - sm((u - 0.78) / 0.22) : 1) : 0;
    }
    let [HL, HR] = handsFor(G, cc, lowered);
    if (phase === 'pull') { const sw = Math.sin(t * 7) * 1.2 * Math.min(1, tau), arc = -G.s * 1.6 * Math.sin(clamp((c - C0) / (1 - C0), 0, 1) * Math.PI); HL = [HL[0], HL[1] + sw + arc]; HR = [HR[0], HR[1] - sw + arc]; }   // the hands swing and rise through the pull
    else if (phase === 'idle' || phase === 'next') { const br = Math.sin(t * 1.7) * 2.2; HL = [HL[0] + br * 0.5, HL[1] + br]; HR = [HR[0] - br * 0.5, HR[1] + br * 0.8]; }
    const Wb = bundleW(G, ee, N === 1);
    const mouth = [G.pot.x, G.potTop + G.pot.ry * 0.2];
    let handAlpha = 1;
    if (phase === 'pot') {
      // the cook carries the dough to the pot, swings the strands in head first, and lets go
      const u = clamp(phaseT / 1.9, 0, 1), carry = sm(clamp(u / 0.3, 0, 1)), dive = sm(clamp((u - 0.3) / 0.28, 0, 1)), tail = sm(clamp((u - 0.46) / 0.26, 0, 1)), away = sm(clamp((u - 0.64) / 0.22, 0, 1));
      const hc = [lerp(G.cx, mouth[0] - G.armPx * 0.34, carry), lerp(G.handY, mouth[1] + G.benchH * 0.02, carry) + away * G.benchH * 0.75];
      const half = lerp(1, 0.42, carry) * G.armPx / 2 * 0.62;
      HL = [hc[0] - half, hc[1]]; HR = [hc[0] + half, hc[1]];
      const head = [lerp(HR[0], mouth[0] + 4, dive), lerp(HR[1], mouth[1] + G.pot.ry * 1.6, dive)], tl = [lerp(HL[0], mouth[0] - 4, tail), lerp(HL[1], mouth[1] + G.pot.ry * 1.3, tail)];
      if (u < 0.8) drawRope(ctx, G, { HL: tl, HR: head, sag: Math.hypot(head[0] - tl[0], head[1] - tl[1]) * 0.15 * (1 - dive * 0.5), Wb: Wb * 0.8 * (1 - 0.3 * dive), strands: N, tens: 0.3, neckF: () => 0, flourK: 0.5, sticky: 0, noShadow: true });
    } else if (phase !== 'done') {
      if (phase === 'relax' && snapAt > now - 0.6) drawSnapped(ctx, G, now - snapAt, HL, HR);
      else drawRope(ctx, G, { HL, HR, sag: sagOf(G, cc, ee, sf), Wb, strands: N, tens: tau, neckF: neckFn(), flourK: clamp(flour * 0.9, 0, 1), sticky: stick });
    }
    drawPotFront(ctx, G, t);
    // the ghost hands: where the pull should be, pulsing on the beat while waiting
    if ((phase === 'idle' || phase === 'pull') && !done) {
      const gc = phase === 'pull' ? ghostAt(tPull) : 1, [GL, GR] = handsFor(G, gc, 0), a = phase === 'pull' ? 0.9 : 0.35 + 0.5 * beat;
      ctx.save();
      for (const [P0, sd] of [[GL, -1], [GR, 1]]) {
        ctx.strokeStyle = `rgba(150,240,255,${a})`; ctx.fillStyle = `rgba(150,240,255,${a * 0.16})`; ctx.lineWidth = 2.4; ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.arc(P0[0] + sd * G.s * 0.3, P0[1] - G.s * 0.6, G.s * 2.1, 0, TAU); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
        if (phase === 'idle') { ctx.fillStyle = `rgba(150,240,255,${0.6 * a})`; const ax = P0[0] + sd * G.s * 3.6; ctx.beginPath(); ctx.moveTo(ax + sd * 8, P0[1] - G.s * 0.6); ctx.lineTo(ax - sd * 3, P0[1] - G.s * 0.6 - 7); ctx.lineTo(ax - sd * 3, P0[1] - G.s * 0.6 + 7); ctx.closePath(); ctx.fill(); }
      }
      ctx.restore();
    }
    // hands (drawn after the dough so the fingers close over it)
    if (handAlpha > 0.02 && phase !== 'done') {
      const grip = phase === 'pull' ? 1 : 0.85, hs = G.s;
      ctx.save(); ctx.globalAlpha = handAlpha;
      const ext = clamp((cc - C0) / (1 - C0), 0, 1.2);
      drawHand(ctx, { x: HL[0], y: HL[1], s: hs, side: -1, grip, dust: clamp(flour, 0, 1) * 0.7, reach: 8, dirx: -(0.55 + 0.55 * ext) });
      drawHand(ctx, { x: HR[0], y: HR[1], s: hs, side: 1, grip, dust: clamp(flour, 0, 1) * 0.7, reach: 8, dirx: 0.55 + 0.55 * ext });
      ctx.restore();
    }
    puffs.draw(ctx);
    drawResultBadge(g, ctx, G);
    ctx.restore();
    void potU;
    hintPill(g, ctx, W0, hint());
    drawHud(g, ctx, G, W0);
    drawThumb(g, ctx, Rt.thumb);
  };

  // the dock: stickiness of the dough, the strand count, the tension
  const drawHud = (g, ctx, G, W0) => {
    const d = G.dock, y = d.y, h = d.h, midY = y + h * 0.5, fs = fsz(g, 14, h * 0.3);
    ctx.save();
    const gx = W0.x + 12, gw = Math.min(140, W0.w * 0.24), sk = clamp(stick / 1.0, 0, 1), word = stick > 0.9 ? 'sticky' : stick > 0.55 ? 'tacky' : 'dry';
    g.label(ctx, `Dough: ${word}`, gx, midY - h * 0.26, fs, 'rgba(255,240,210,0.9)', 'left', '700');
    rrect(ctx, gx, midY + fs * 0.45, gw, 10, 5); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill();
    rrect(ctx, gx, midY + fs * 0.45, Math.max(8, gw * sk), 10, 5); ctx.fillStyle = sk > 0.9 ? '#e0603a' : sk > 0.6 ? '#f2b84a' : '#9ad07a'; ctx.fill();
    const mm = D0_MM / Math.sqrt(N), txt = `${strandsText(N)} strand${N > 1 ? 's' : ''}, ${fmtMm(mm)} mm`, fs2 = fsz(g, 20, h * 0.34), tw = txt.length * fs2 * 0.56 + 26, cxm = W0.x + W0.w * 0.5 + (gw - 60) * 0.15;
    shadowed(ctx, () => { rrect(ctx, cxm - tw / 2, y + h * 0.12, tw, h * 0.76, h * 0.38); ctx.fillStyle = 'rgba(12,8,6,0.66)'; ctx.fill(); }, { blur: 6, dy: 2, a: 0.4 });
    g.label(ctx, txt, cxm, midY + 1, fs2, '#fff3d0', 'center', '800');
    const tx = W0.x + W0.w - 12, tw2 = Math.min(100, W0.w * 0.18);
    g.label(ctx, 'Tension', tx - tw2, midY - h * 0.26, fs, 'rgba(255,240,210,0.9)', 'left', '700');
    rrect(ctx, tx - tw2, midY + fs * 0.45, tw2, 10, 5); ctx.fillStyle = lin(ctx, tx - tw2, 0, tx, 0, [[0, '#5aa86a'], [0.5, '#d8c24a'], [0.78, '#e08a3a'], [1, '#d6402a']]); ctx.globalAlpha = 0.55; ctx.fill(); ctx.globalAlpha = 1;
    const mk = tx - tw2 + clamp(tau / 2.2, 0, 1) * tw2, my = midY + fs * 0.45 + 12; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(mk, my); ctx.lineTo(mk - 5, my + 8); ctx.lineTo(mk + 5, my + 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  };
  // the order: a bowl with noodles of the thickness asked for, inside the display case
  const drawThumb = (g, ctx, th) => {
    const o = orders[Math.min(oi, orders.length - 1)], k = KINDS[o.kind], N2 = 2 ** o.target;
    const cx = th.x + th.w / 2, cy = th.y + th.h * 0.52, R = Math.min(th.w, th.h) * 0.4;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(cx, cy + R * 0.62, R * 1.0, R * 0.2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = lin(ctx, cx - R, 0, cx + R, 0, [[0, '#cfd5dc'], [0.3, '#f7f9fb'], [1, '#8f98a2']]); ctx.beginPath(); ctx.moveTo(cx - R, cy - R * 0.15); ctx.quadraticCurveTo(cx - R * 0.95, cy + R * 0.7, cx, cy + R * 0.72); ctx.quadraticCurveTo(cx + R * 0.95, cy + R * 0.7, cx + R, cy - R * 0.15); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#3f6fb0'; ctx.lineWidth = Math.max(2, R * 0.05); ctx.beginPath(); ctx.moveTo(cx - R * 0.9, cy + R * 0.1); ctx.quadraticCurveTo(cx, cy + R * 0.42, cx + R * 0.9, cy + R * 0.1); ctx.stroke();
    ctx.fillStyle = '#c98a3a'; ctx.beginPath(); ctx.ellipse(cx, cy - R * 0.15, R * 0.98, R * 0.3, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy - R * 0.15, R * 0.96, R * 0.29, 0, 0, TAU); ctx.clip();
    const sw = clamp(R * 0.62 / Math.sqrt(N2) * 2.2, 1.1, R * 0.2), n = Math.round(clamp(R * 2.2 / (sw * 0.95), 6, 60));
    for (let i = 0; i < n; i++) { const a0 = hash(i, 31) * TAU, rr = 0.2 + 0.7 * hash(i, 32); ctx.strokeStyle = mix('#f0dfae', '#fff4d0', hash(i, 33)); ctx.lineWidth = sw; ctx.lineCap = 'round'; ctx.beginPath(); ctx.ellipse(cx + (hash(i, 34) - 0.5) * R * 0.4, cy - R * 0.15, R * rr, R * 0.3 * rr, a0, 0, Math.PI * (0.8 + hash(i, 35) * 1.0)); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(cx, cy - R * 0.15, R, R * 0.31, 0, 0, TAU); ctx.stroke();
    ctx.restore();
    g.label(ctx, k.short, cx, th.y + th.h * 0.1, fsz(g, 15, th.h * 0.09), '#fff3d0', 'center', '800');
    g.label(ctx, `${N2} \u00b7 ${fmtMm(mmOf(o.target))} mm`, cx, th.y + th.h * 0.92, fsz(g, 14, th.h * 0.09), 'rgba(255,240,210,0.95)', 'center', '700');
  };
  const drawResultBadge = (g, ctx, G) => {
    if (phase !== 'pot' || !bowls.length) return;
    const b = bowls[bowls.length - 1], u = clamp(phaseT / 1.9, 0, 1), a = clamp((u - 0.45) * 3, 0, 1) * (1 - clamp((u - 0.9) * 10, 0, 1));
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a; const x = G.cx, y = G.benchTop + G.benchH * 0.5, w = 190, h = 58;
    shadowed(ctx, () => { rrect(ctx, x - w / 2, y - h / 2, w, h, 16); ctx.fillStyle = 'rgba(16,10,6,0.82)'; ctx.fill(); }, { blur: 12, dy: 4, a: 0.5 });
    ctx.fillStyle = b.score >= 88 ? '#ffd36a' : '#fff3d0'; ctx.font = `800 ${Math.round(fsz(g, 26, 40))}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`${b.score}`, x - w * 0.28, y);
    ctx.fillStyle = '#fff3d0'; ctx.font = `600 ${Math.round(fsz(g, 14, 22))}px system-ui, sans-serif`; ctx.fillText(`${b.strands} strands`, x + w * 0.14, y - 9); ctx.fillStyle = b.folds === b.target ? '#9ad07a' : '#f2a04a'; ctx.fillText(b.folds === b.target ? 'just right' : b.folds < b.target ? 'too thick' : 'too fine', x + w * 0.14, y + 11);
    ctx.restore();
  };

  const titleArt = (g, S, t) => {
    const { ctx } = g, W0 = { x: S.x - S.w * 0.1, y: S.y, w: S.w * 1.2, h: S.h * 0.88 }, G = geometry(W0);
    ctx.save(); ctx.beginPath(); ctx.rect(W0.x, W0.y, W0.w, S.h); ctx.clip();
    drawPotBack(ctx, G, t ?? 0); drawTray(ctx, G); drawBowl(ctx, G, 0);
    const [HL, HR] = handsFor(G, 0.92, 0);
    drawRope(ctx, G, { HL, HR, sag: sagOf(G, 0.92, 1.0, 0.05), Wb: bundleW(G, 1, false), strands: 512, tens: 0.8, neckF: () => 0, flourK: 0.7, sticky: 0 });
    drawPotFront(ctx, G, t ?? 0);
    drawHand(ctx, { x: HL[0], y: HL[1], s: G.s, side: -1, dust: 0.5, reach: 8 });
    drawHand(ctx, { x: HR[0], y: HR[1], s: G.s, side: 1, dust: 0.5, reach: 8 });
    ctx.restore();
  };

  const hint = () => {
    if (done) return '';
    if (phase === 'pot') return 'Into the boiling water.';
    if (phase === 'relax') return 'The dough settles. Go again.';
    if (phase === 'fold') return 'Slap and fold: the strands double.';
    const left = target() - f;
    if (phase === 'pull') return tau > 1.5 ? 'Easy: too fast and it snaps.' : 'Follow the ghost hands to the marks, then let go.';
    if (stick > 0.9) return 'The dough is sticky: dust it before the next fold.';
    if (left <= 0) return f > target() ? 'Too fine for this order. Into the pot anyway.' : 'That is the right fineness: into the pot.';
    if (stick > 0.55) return 'A little flour first, then pull on the beat.';
    return `Press on the beat and drag out to the marks. ${left} fold${left > 1 ? 's' : ''} to go.`;
  };

  const state = () => ({ technique: 'pull', order: oi, orders: orders.map((o) => `${o.kind}:${o.target}`), kind: orders[Math.min(oi, orders.length - 1)].kind, target: orders[Math.min(oi, orders.length - 1)].target, folds: f, strands: N, phase, bpm,
    beat: r3(beatPhase()), c: r3(c), ell: r3(ell), tau: r3(tau), stick: r3(stick), dry: r3(dry), snaps, glue, aborts, pulls: pulls.map(r3), rhythms: rhythms.map(r3), bowls: bowls.map((b) => ({ ...b })) });

  init();
  return {
    init, items, control, work, tick, draw, attract, titleArt, result: () => done, score: total, hint,
    info: () => [`Bowl ${Math.min(oi + 1, ORDERS)} of ${ORDERS}: ${KINDS[orders[Math.min(oi, ORDERS - 1)].kind].label}`, `${f} fold${f === 1 ? '' : 's'} made, ${2 ** target()} strands wanted`],
    get caption() { return SC.words?.caption ?? 'Pull this order'; },
    rules: () => [
      'Every fold doubles the strands: 1, 2, 4, 8 ... up to 1024. A rope of dough 24 mm across becomes strands 24 divided by the square root of the strand count: 12 mm at 4 strands, 3 mm at 64, about 1 mm at 512. The order on the left names the strand count to reach.',
      'Press anywhere on the board and drag outward. Two ghost hands show the pace: follow them to the marks on the board and let go; the dough then folds and the strands double. Letting go before the marks, or in less than a third of a second, only settles the dough.',
      'Pull too fast and the tension climbs; past the red end of the tension bar the dough snaps and loses its last fold. Pull too slowly, or hold it out too long, and it sags and thins in the middle. Later folds are finer, so the dough gives way sooner.',
      'Start each pull on the beat of the pulsing marks. Each fold makes the dough stickier: when the Dough gauge turns tacky, press Dust before the next fold; strands that fold while sticky glue together. Dusting dough that is already dry makes it brittle.',
      'Press Into the pot when you have made the folds the order asks for. Score of a bowl: the right strand count, an even pull (the ghost hands, the marks, low tension), a steady rhythm, minus points for each snap and each glued fold. The round is the whole table of bowls.',
    ],
    point(id) {
      if (!geo) return null;
      const [k, rest] = id.split(':');
      if (k === 'pull') { const cc = rest === undefined ? C0 : Number(rest); return { x: geo.cx + geo.armPx * PRESS_X * 0.5 + ((cc - C0) / GAIN) * geo.armPx, y: geo.handY - geo.s * 4 }; }
      if (k === 'bowl') return { x: geo.bowl.x, y: geo.bowl.y };
      return null;
    },
    state,
  };
}

registerTechnique('pull', { make: (P, env) => createPull(P, env), scene: 'kc-fire-noodle', mat: 'dough' });

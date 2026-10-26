// shape-craft `pour` mode `pull` (1.26.0 Kitchen Crafts): Hong Kong milk tea, pulled. Strong tea is poured from one enamel pot to another through a cloth strainer
// and back again, from a long way up, to smooth and mix it; evaporated milk goes in on the way. One lever: slide the finger up and the left pot rises and tips
// (it pours into the right pot), slide it down and the right pot rises and tips. The pot has to be tipped further as it empties (the lit mark on the pot's gauge),
// the cloth passes only so much tea (a bulge of tea piles up in it and runs over if you pour faster, and the cloth clogs a little with each pull), the stream sways
// if the hand moves quickly, and the longer the fall the smoother the tea. Press Milk when the pots are down. Score = how steady, high and clean each pull was (45),
// how well the milk is mixed in (25), the amount of milk against the line (20), tea kept (10). Doing nothing scores 0.
import { starsFor, hash } from './geom.js';
import { rrect, ease } from './fx.js';
import { hintPill, dockGauge } from './paint-ui.js';
import { createPourSound } from './pour-sound.js';
import { safeCtx, tinyArea, drawStream, wisp, roomBackdrop, clamp, lerp, sm, glassOf } from './pour-art.js';
import { sleeveHand, porcelainCup, CUP } from './pour-pot.js';
import { createStream } from './pour-stream.js';
import { lg, rg, ell, TAU } from './props.js';

const SW = 1, SH = 0.93, GRAV = 7, H = 1 / 120, KJ = 1.3;
const BASE = [{ x: 0.24, y: 0.8 }, { x: 0.76, y: 0.8 }];   // pot 0 sits left and pours to the right, pot 1 sits right and pours to the left
const GRIPREL = { x: 0.118 * KJ, y: -0.115 * KJ }, TIPREL = { x: -0.138 * KJ, y: -0.246 * KJ }, MOUTHY = -0.215 * KJ, CLOTHY = MOUTHY - 0.024;
const QMAX = 0.6, QC0 = 0.3, CLCAP = 0.14, RANGE = 0.3, YREF = 0.62, TARGET = 0.3;
const MILK_TIN = 0.08, FALL_FULL = 0.26;
const tau0 = (v) => 0.18 + 0.7 * (1 - clamp(v, 0, 1));          // how far the pot has to be tipped before it pours, rising as it empties

export function createPull(P, env) {
  const { rng, fx } = env, SC = P.scene ?? {};
  const log = env.options?.soundLog, snd = createPourSound(env.audio, log, 'pull');
  const NP = clamp(Math.round(P.pulls ?? 4), 3, 6);
  let missV = 0, overV = 0, L, Lt, V, cl, clTo, spill, spillPull, pullsDone, pulls, pull, milk, milkAt, mix, target, qc0, st, geo, done, ptr, holding, acc, t, lastL, sway, wob, lastSnd, steamT, milkAnim, auto, dropT, hintMsg, hintT, serving;
  const S = createStream(GRAV);

  const init = () => {
    L = 0; Lt = 0; V = [1, 0]; cl = [0, 0]; spill = 0; missV = 0; overV = 0; spillPull = 0; pullsDone = 0; pulls = []; pull = null; milk = 0; milkAt = -1; mix = 0; done = null; ptr = null; holding = false; acc = 0; t = 0; lastL = 0; sway = 0; wob = 0; lastSnd = -1; steamT = 0; milkAnim = null; dropT = 0; hintMsg = ''; hintT = 0; serving = 0;
    target = TARGET + (rng.next() - 0.5) * 0.08; qc0 = QC0 * (0.92 + 0.16 * rng.next()); auto = { wait: 0.7, dir: 1, milked: false, tapT: 0 }; S.clear();
  };
  const QC = () => qc0 * (1 - 0.05 * pullsDone);
  const rcv = () => (Lt >= 0 ? 1 : 0);

  // ---- poses ----------------------------------------------------------------------------------------------------------------------------------
  const Wd = (side, v) => ({ x: -side * v.x, y: v.y });
  const exitDir = (a) => ({ x: -0.92 * Math.cos(a) - 0.38 * Math.sin(a), y: 0.92 * Math.sin(a) - 0.38 * Math.cos(a) });   // spout direction (spout towards -x), tipped by a
  const pose = (p) => {
    const side = p === 0 ? 1 : -1, Lp = p === 0 ? Math.max(0, L) : Math.max(0, -L), a = Lp * 0.95, lift = ease(clamp(Lp / 0.17, 0, 1)) * (0.8 + 0.2 * clamp(Lp, 0, 1));
    const baseP = BASE[p], r = BASE[1 - p], restTip = { x: baseP.x + Wd(side, TIPREL).x, y: baseP.y + TIPREL.y }, mouth = { x: r.x, y: r.y + MOUTHY }, clothY = r.y + CLOTHY;
    const tipY = lerp(restTip.y, 0.2, lift), e = exitDir(a), vs = 0.28 + 0.3 * clamp(flowFrac(p), 0, 1), vx = -side * e.x * vs, vy = e.y * vs;
    const T = (-vy + Math.sqrt(vy * vy + 2 * GRAV * Math.max(0.01, clothY - tipY))) / GRAV, aimX = mouth.x - vx * T;
    const tipX = lerp(restTip.x, aimX, lift) + sway * Math.sin(t * 7.5) * lift;
    const d = { x: TIPREL.x - GRIPREL.x, y: TIPREL.y - GRIPREL.y }, dr = { x: d.x * Math.cos(a) + d.y * Math.sin(a), y: -d.x * Math.sin(a) + d.y * Math.cos(a) };
    return { side, a, lift, tip: { x: tipX, y: tipY }, G: { x: tipX + side * dr.x, y: tipY - dr.y }, vx, vy, clothY, mouth };
  };
  const flowFrac = (p) => { const Lp = p === 0 ? Math.max(0, L) : Math.max(0, -L); return clamp((Lp - tau0(V[p])) / 0.3, 0, 1); };

  // ---- physics ---------------------------------------------------------------------------------------------------------------------------------
  const step = (h) => {
    t += h;
    const dl = (Lt - L) * Math.min(1, h * 9); L += dl; const vel = Math.abs(dl) / h; sway += (clamp(vel * 0.03, 0, 0.06) - sway) * Math.min(1, h * 6); lastL = L;
    const p = L >= 0 ? 0 : 1, f = flowFrac(p), q = QMAX * sm(f) * clamp(V[p] / 0.03, 0, 1);
    if (q > 0.004 && V[p] > 0) {
      const ps = pose(p), vol = Math.min(V[p], q * h); V[p] -= vol;
      S.emit({ x: ps.tip.x, y: ps.tip.y, vx: ps.vx, vy: ps.vy, vol, q: clamp(q / QMAX * 1.3, 0.25, 1), amp: sway * 0.6, tag: 1 - p });
      if (!pull && V[p] + vol > 0.5) pull = { src: p, v0: V[p] + vol, t0: t, qs: [], falls: [], sp0: spill, nextS: t + 0.5 };
      if (pull && pull.src === p && t >= pull.nextS) { pull.nextS = t + 0.1; if (V[p] > 0.12) { pull.qs.push(q); pull.falls.push(ps.clothY - ps.tip.y); } }
    }
    S.step(h, (s, y0) => {
      const r = s.tag, c = BASE[r].y + CLOTHY;
      if (s.y >= c) { if (Math.abs(s.x - BASE[r].x) < 0.058) { cl[r] += s.vol; if (hash(Math.floor(t * 240), 7) > 0.75) splashIn(r); return true; } spill += s.vol; spillPull += s.vol; missV += s.vol; addSplash(s.x, c); return true; }
      return false;
    });
    for (let r = 0; r < 2; r++) {
      const D = QC() * clamp(cl[r] / 0.02, 0, 1) * h; if (cl[r] > 0) { const mv = Math.min(cl[r], D); cl[r] -= mv; V[r] += mv; }
      if (cl[r] > CLCAP) { const ex = cl[r] - CLCAP; cl[r] = CLCAP; spill += ex; spillPull += ex; overV += ex; addSplash(BASE[r].x + (r ? -0.06 : 0.06), BASE[r].y + CLOTHY); if (Math.floor(t * 10) !== Math.floor((t - h) * 10)) snd.splat(0.4); }
    }
    // a pull ends when the tea has been moved, or when the lever is thrown over to the other pot
    if (pull) { const emptied = V[pull.src] <= 0.02 && S.size() === 0 && cl[1 - pull.src] < 0.012, swapped = (pull.src === 0 && Lt < -0.25) || (pull.src === 1 && Lt > 0.25); if (emptied || swapped) endPull(); }
    if (milkAnim) { milkAnim.t += h; if (!milkAnim.added && milkAnim.t > 0.45) { milkAnim.added = true; addMilk(); } if (milkAnim.t > 1.1) milkAnim = null; }
    if (serving > 0) { serving += h; if (serving > 1.4) finish(); }
  };
  const addSplash = (x, y) => { if (geo && hash(Math.floor(t * 240), 9) > 0.6) fx.emit('drop', geo.ox + x * geo.s, geo.oy + y * geo.s, { count: 3, color: '#a0602a', size: 3, speed: 90, life: 0.45, gravity: 800, spread: Math.PI, angle: -Math.PI / 2 }); };
  const splashIn = (r) => { if (geo) fx.emit('drop', geo.ox + BASE[r].x * geo.s, geo.oy + (BASE[r].y + CLOTHY) * geo.s, { count: 1, color: '#c08a50', size: 2.4, speed: 50, life: 0.35, gravity: 700, spread: 1.4, angle: -Math.PI / 2 }); };
  const endPull = () => {
    const pl = pull; pull = null; if (!pl) return;
    const left = V[pl.src] / pl.v0, moved = clamp(1 - left, 0, 1), qs = pl.qs, n = qs.length || 1, mean = qs.reduce((a, b) => a + b, 0) / n, sd = Math.sqrt(qs.reduce((a, b) => a + (b - mean) ** 2, 0) / n), cv = mean > 0 ? sd / mean : 1;
    const avgFall = pl.falls.reduce((a, b) => a + b, 0) / (pl.falls.length || 1), dur = t - pl.t0;
    const steady = qs.length >= 3 ? clamp(1 - cv / 0.5, 0, 1) : 0, height = clamp(avgFall / FALL_FULL, 0, 1), clean = clamp(1 - (spill - pl.sp0) / 0.07, 0, 1), tempo = clamp(1 - Math.abs(dur - 4.2) / 3.5, 0, 1);
    const score = (0.35 * steady + 0.3 * height + 0.25 * clean + 0.1 * tempo) * clamp(moved / 0.85, 0, 1);
    pulls.push({ steady, height, clean, tempo, moved, score, dur }); if (moved >= 0.85) pullsDone++; spillPull = 0;
    if (milk >= 0.1) mix = Math.min(1, mix + (score * (moved >= 0.85 ? 1 : 0.4)) / 2.2);
    snd.ding(1000 + 140 * Math.min(4, pullsDone));
  };
  const addMilk = () => { const m = V[0] >= V[1] ? 0 : 1; V[m] += MILK_TIN; milk = Math.min(0.55, milk + MILK_TIN / (V[0] + V[1] + cl[0] + cl[1])); if (milkAt < 0) milkAt = pullsDone; snd.splat(0.35); snd.mode(); };
  const totalTea = () => V[0] + V[1] + cl[0] + cl[1];

  // ---- score ------------------------------------------------------------------------------------------------------------------------------------
  const parts = () => {
    const done_ = pulls.filter((x) => x.moved >= 0.85), avg = done_.reduce((s, x) => s + x.score, 0) / Math.max(1, done_.length), count = clamp(done_.length / NP, 0, 1);
    const pullScore = done_.length ? avg * (0.55 + 0.45 * count) : 0, milkScore = milk > 0 ? clamp(1 - Math.abs(milk - target) / 0.14, 0, 1) : 0, kept = pulls.length ? clamp(1 - spill / 0.25, 0, 1) : 0;
    return { pullScore, mix, milkScore, kept, n: done_.length };
  };
  const score = () => { const p = parts(); return clamp(100 * (0.45 * p.pullScore + 0.25 * p.mix * (p.n ? 1 : 0) + 0.2 * p.milkScore * (p.n ? 1 : 0) + 0.1 * p.kept), 0, 100); };
  const total = () => (done ? done.score : Math.round(score()));
  const finish = () => {
    if (done) return;
    const s = Math.round(score()), stars = starsFor(s), p = parts(), W = SC.words ?? {};
    done = { score: s, max: 100, stars, headline: stars === 3 ? (W.win ?? 'A smooth, silky cup') : stars ? (W.ok ?? 'A good cup') : (W.retry ?? 'Pull again'), detail: `${p.n} pulls, pulling ${Math.round(p.pullScore * 100)}%, milk mixed ${Math.round(p.mix * 100)}%, milk amount ${Math.round(p.milkScore * 100)}%` };
    snd.win(stars);
  };
  const advance = (dt) => { acc += dt; let n = 0; while (acc >= H && n < 60) { if (!done) step(H); acc -= H; n++; } if (n >= 60) acc = 0; };
  const tick = (dt) => {
    advance(dt); hintT += dt;
    if (S.size() > 0 && t - lastSnd > 0.1) { lastSnd = t; const r = S.list()[S.size() - 1]?.tag ?? 1; snd.stream(0.7, clamp(V[r] / 1.1, 0, 1), 0.8, r ? 0.3 : -0.3); }
    if (cl[0] + cl[1] > 0.01 && Math.floor(t * 6) !== Math.floor((t - dt) * 6)) { const r = cl[1] > cl[0] ? 1 : 0; snd.drop(0.5 + 0.4 * clamp(V[r], 0, 1), Math.floor(t * 6)); }
    steamT += dt;
    if (steamT > 0.35 && geo) { steamT = 0; for (let p = 0; p < 2; p++) if (V[p] > 0.1) fx.emit('dust', geo.ox + (BASE[p].x + (hash(Math.floor(t * 3), p) - 0.5) * 0.05) * geo.s, geo.oy + (BASE[p].y + MOUTHY - 0.02) * geo.s, { count: 2, color: '#ffffff', size: 9, speed: 12, life: 2.0, gravity: -26, spread: 0.8 }); }
  };

  // ---- input ---------------------------------------------------------------------------------------------------------------------------------
  const toLocal = (x, y) => [(x - geo.ox) / geo.s, (y - geo.oy) / geo.s];
  const setLever = (y) => { Lt = clamp((YREF - y) / RANGE, -1, 1); if (Math.abs(Lt) < 0.04) Lt = 0; };
  const onDown = (p) => { const [x, y] = toLocal(p.x, p.y); ptr = { x, y }; holding = true; if (!milkAnim && serving === 0) setLever(y); };
  const onMove = (p) => { const [x, y] = toLocal(p.x, p.y); ptr = { x, y }; setLever(y); };
  const work = (p) => { if (!geo || done || serving > 0) return; if (p.pressed) onDown(p); else if (p.down && holding) onMove(p); if (p.released && holding) holding = false; };
  const items = () => [{ id: 'milk', kind: 'btn', label: 'Milk' }, { id: 'serve', kind: 'btn', label: 'Serve', primary: true }];
  const control = (id) => {
    if (done || serving > 0) return;
    if (id === 'milk') { if (Math.abs(L) < 0.15 && !milkAnim && milk < 0.55) { milkAnim = { t: 0, added: false }; Lt = 0; } else { hintMsg = 'Put both pots down to add the milk.'; hintT = 0; } }
    else if (id === 'serve') { Lt = 0; serving = 0.001; }
  };

  // ---- the master for Watch and learn -----------------------------------------------------------------------------------------------------------
  const attract = (dt) => {
    if (done) return; advance(dt * 0.5); const a = auto;
    if (a.wait > 0) { a.wait -= dt; return; }
    if (milkAnim || serving > 0) return;
    const src = a.dir > 0 ? 0 : 1, dst = 1 - src;
    let want = null;
    if (V[src] > 0.02) {   // pour: tip the pot just far enough to keep the cloth about half full
      const frac = clamp(0.5 + 2.6 * (0.05 - cl[dst]), 0.05, 1); want = a.dir * clamp(tau0(V[src]) + 0.3 * frac, 0.2, 1);
    } else if (S.size() > 0 || cl[dst] > 0.012) { want = a.dir; }   // the last drops
    else {
      want = 0;
      if (Math.abs(L) < 0.06) {
        if (pullsDone >= NP) { control('serve'); return; }
        if (pullsDone >= 1 && !a.milked) { if (milk < target - 0.035) { control('milk'); a.wait = 0.3; return; } a.milked = true; }
        a.dir = -a.dir; a.wait = 0.2;
      }
    }
    if (want !== null) Lt += clamp(want - Lt, -1.3 * dt * 1.8, 1.3 * dt * 1.8);   // a smooth hand: the lever never moves faster than the stream can stand
  };

  // ---- drawing ------------------------------------------------------------------------------------------------------------------------------------
  const X = (V_, x) => V_.ox + x * V_.s, Y = (V_, y) => V_.oy + y * V_.s;
  const teaCols = () => { const m = clamp(milk * 1.7, 0, 0.8), c = (a, b) => mixc(a, b, m); return [c('#3a160a', '#a8744a'), c('#7a3c16', '#c99c6c'), c('#b8803e', '#ead2ae')]; };
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixc = (a, b, t_) => { const A = hex(a), B = hex(b); return '#' + [0, 1, 2].map((i) => Math.round(A[i] + (B[i] - A[i]) * t_).toString(16).padStart(2, '0')).join(''); };
  const counter = (ctx, V_) => {
    const q = (u, v) => [X(V_, lerp(lerp(0.02, -0.06, v), lerp(0.98, 1.06, v), u)), Y(V_, lerp(0.64, 0.97, v))];
    ctx.save(); ctx.beginPath(); ctx.moveTo(...q(0, 0)); ctx.lineTo(...q(1, 0)); ctx.lineTo(...q(1, 1)); ctx.lineTo(...q(0, 1)); ctx.closePath();
    ctx.fillStyle = lg(ctx, 0, Y(V_, 0.64), 0, Y(V_, 0.97), [[0, '#6a727a'], [0.45, '#b4bcc4'], [1, '#e8edf1']]); ctx.fill(); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; for (let k = 0; k < 60; k++) { const y = Y(V_, 0.64 + hash(k, 3) * 0.33), x0 = X(V_, hash(k, 4) * 0.8 - 0.05); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + V_.s * (0.1 + hash(k, 5) * 0.4), y + hash(k, 6) * 2 - 1); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(40,50,60,0.12)'; for (let k = 0; k < 40; k++) { const y = Y(V_, 0.64 + hash(k, 13) * 0.33), x0 = X(V_, hash(k, 14) * 0.9); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + V_.s * (0.05 + hash(k, 15) * 0.2), y); ctx.stroke(); }
    // a broad soft reflection of the room lights and a few old tea rings
    ctx.fillStyle = lg(ctx, X(V_, 0.1), 0, X(V_, 0.6), 0, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(X(V_, -0.1), Y(V_, 0.64), V_.s * 1.2, V_.s * 0.34);
    ctx.strokeStyle = 'rgba(120,70,30,0.22)'; ctx.lineWidth = 2; for (const [x, y, r] of [[0.5, 0.78, 0.03], [0.36, 0.9, 0.022], [0.64, 0.86, 0.026]]) { ctx.beginPath(); ctx.ellipse(X(V_, x), Y(V_, y), r * V_.s, r * V_.s * 0.28, 0, 0, TAU); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = lg(ctx, 0, Y(V_, 0.955), 0, Y(V_, 1.02), [[0, '#f4f7fa'], [0.3, '#9aa2aa'], [1, '#4a5058']]); ctx.beginPath(); ctx.moveTo(...q(0, 1)); ctx.lineTo(...q(1, 1)); ctx.lineTo(X(V_, 1.06), Y(V_, 1.03)); ctx.lineTo(X(V_, -0.06), Y(V_, 1.03)); ctx.closePath(); ctx.fill();
  };
  const jug = (ctx, u, o) => { // enamel pot, spout to the left (-x), handle on the right, base centre at the origin; the cloth strainer is tied over its mouth
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = '#1c1c22'; ctx.lineWidth = 0.02 * u; ctx.beginPath(); ctx.moveTo(0.062 * u, -0.19 * u); ctx.bezierCurveTo(0.16 * u, -0.2 * u, 0.16 * u, -0.05 * u, 0.074 * u, -0.04 * u); ctx.stroke();
    ctx.strokeStyle = '#4a4a54'; ctx.lineWidth = 0.013 * u; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.003 * u; ctx.beginPath(); ctx.moveTo(0.07 * u, -0.196 * u); ctx.bezierCurveTo(0.152 * u, -0.204 * u, 0.152 * u, -0.056 * u, 0.078 * u, -0.046 * u); ctx.stroke();
    const body = () => { ctx.beginPath(); ctx.moveTo(0.07 * u, 0); ctx.bezierCurveTo(0.084 * u, -0.05 * u, 0.082 * u, -0.15 * u, 0.062 * u, -0.205 * u); ctx.lineTo(0.062 * u, -0.215 * u); ctx.lineTo(-0.05 * u, -0.215 * u); ctx.quadraticCurveTo(-0.1 * u, -0.222 * u, -0.138 * u, -0.246 * u); ctx.quadraticCurveTo(-0.142 * u, -0.226 * u, -0.128 * u, -0.214 * u); ctx.quadraticCurveTo(-0.1 * u, -0.19 * u, -0.07 * u, -0.17 * u); ctx.bezierCurveTo(-0.082 * u, -0.14 * u, -0.084 * u, -0.05 * u, -0.07 * u, 0); ctx.closePath(); };
    body(); ctx.fillStyle = '#6a7078'; ctx.fill();
    ctx.save(); body(); ctx.clip();
    ctx.fillStyle = lg(ctx, -0.09 * u, 0, 0.09 * u, 0, [[0, '#b8b4a6'], [0.18, '#f6f2e6'], [0.4, '#fffdf4'], [0.75, '#e4dfcf'], [1, '#a6a294']]); ctx.fillRect(-0.13 * u, -0.24 * u, 0.26 * u, 0.25 * u);
    ctx.fillStyle = '#2a5aa8'; ctx.fillRect(-0.13 * u, -0.222 * u, 0.26 * u, 0.012 * u); ctx.fillRect(-0.13 * u, -0.014 * u, 0.26 * u, 0.014 * u); ctx.fillStyle = '#d4301f'; ctx.fillRect(-0.13 * u, -0.206 * u, 0.26 * u, 0.004 * u);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-0.04 * u, -0.2 * u, 0.012 * u, 0.17 * u);
    ctx.fillStyle = 'rgba(60,40,20,0.5)'; for (const [x, y, r] of [[0.05, -0.015, 0.004], [-0.04, -0.008, 0.003], [0.01, -0.012, 0.0025]]) { ell(ctx, x * u, y * u, r * u, r * u); ctx.fill(); }   // chipped enamel at the foot
    ctx.fillStyle = lg(ctx, 0, -0.2 * u, 0, 0, [[0, 'rgba(255,255,255,0.18)'], [1, 'rgba(60,50,30,0.2)']]); ctx.fillRect(-0.13 * u, -0.22 * u, 0.26 * u, 0.22 * u);
    // a small round emblem: a red ring with a blue dot
    ctx.strokeStyle = '#d4301f'; ctx.lineWidth = 0.004 * u; ell(ctx, 0.012 * u, -0.1 * u, 0.026 * u, 0.026 * u); ctx.stroke(); ctx.fillStyle = '#2a5aa8'; ell(ctx, 0.012 * u, -0.1 * u, 0.009 * u, 0.009 * u); ctx.fill();
    ctx.restore(); ctx.strokeStyle = 'rgba(30,30,36,0.7)'; ctx.lineWidth = 1.3; body(); ctx.stroke();
    ctx.strokeStyle = '#2a5aa8'; ctx.lineWidth = 0.007 * u; ctx.beginPath(); ctx.moveTo(-0.05 * u, -0.215 * u); ctx.quadraticCurveTo(-0.1 * u, -0.222 * u, -0.138 * u, -0.246 * u); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.002 * u; ctx.beginPath(); ctx.moveTo(-0.06 * u, -0.218 * u); ctx.quadraticCurveTo(-0.1 * u, -0.226 * u, -0.132 * u, -0.246 * u); ctx.stroke();
    // the gauge: a thin glass tube down the front with the tea in it
    rrect(ctx, 0.04 * u, -0.19 * u, 0.012 * u, 0.16 * u, 0.006 * u); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill(); ctx.strokeStyle = 'rgba(60,60,70,0.6)'; ctx.lineWidth = 1; ctx.stroke();
    const fl = clamp(o.fill, 0, 1); if (fl > 0.01) { rrect(ctx, 0.0415 * u, (-0.03 - 0.158 * fl) * u, 0.009 * u, 0.158 * fl * u, 0.004 * u); ctx.fillStyle = o.cols[1]; ctx.fill(); }
    // the cloth strainer: a skirt of gauze tied round the neck, a wire ring, the cloth bag open at the top with the tea piled in it
    const sx = 0.003 * u, sy = MOUTHY / KJ * u;
    ctx.fillStyle = lg(ctx, -0.07 * u, 0, 0.07 * u, 0, [[0, '#b9a982'], [0.4, '#efe6c8'], [1, '#a8986e']]); ctx.beginPath(); ctx.moveTo(-0.066 * u, sy); ctx.quadraticCurveTo(-0.075 * u, sy + 0.03 * u, -0.06 * u, sy + 0.05 * u); ctx.lineTo(0.06 * u, sy + 0.05 * u); ctx.quadraticCurveTo(0.075 * u, sy + 0.03 * u, 0.066 * u, sy); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(90,70,40,0.4)'; ctx.stroke();
    ctx.strokeStyle = 'rgba(90,70,40,0.3)'; ctx.lineWidth = 1; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(k * 0.018 * u, sy + 0.005 * u); ctx.quadraticCurveTo(k * 0.021 * u, sy + 0.03 * u, k * 0.016 * u, sy + 0.05 * u); ctx.stroke(); }
    ctx.strokeStyle = '#7a5a2a'; ctx.lineWidth = 0.006 * u; ctx.beginPath(); ctx.ellipse(sx, sy + 0.024 * u, 0.066 * u, 0.012 * u, 0, 0, Math.PI); ctx.stroke();
    ctx.fillStyle = '#2a1a0a'; ell(ctx, sx, sy, 0.064 * u, 0.0155 * u); ctx.fill();
    const wet = clamp(o.cl / CLCAP, 0, 1); ctx.fillStyle = lg(ctx, 0, sy - 0.014 * u, 0, sy + 0.014 * u, [[0, o.cols[2]], [1, o.cols[0]]]); ell(ctx, sx, sy + (1 - wet) * 0.004 * u, (0.05 + 0.012 * wet) * u, (0.004 + 0.011 * wet) * u); ctx.fill();
    ctx.strokeStyle = '#8a8a90'; ctx.lineWidth = 0.007 * u; ctx.beginPath(); ctx.ellipse(sx, sy, 0.066 * u, 0.0165 * u, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.0025 * u; ctx.beginPath(); ctx.ellipse(sx, sy - 0.001 * u, 0.066 * u, 0.0165 * u, 0, Math.PI * 1.1, Math.PI * 1.7); ctx.stroke();
    ctx.restore();
  };
  const drawPot = (ctx, V_, p) => {
    const ps = pose(p), u = V_.s * KJ, cols = teaCols();
    // soft shadow on the counter below
    ctx.fillStyle = `rgba(20,24,30,${0.32 - 0.15 * ps.lift})`; ell(ctx, X(V_, BASE[p].x) + 4, Y(V_, BASE[p].y + 0.01), 0.12 * V_.s, 0.02 * V_.s); ctx.fill();
    ctx.save(); ctx.translate(X(V_, ps.G.x), Y(V_, ps.G.y)); ctx.scale(ps.side === 1 ? -1 : 1, 1);
    ctx.save(); ctx.rotate(-ps.a); ctx.translate(-GRIPREL.x * V_.s, -GRIPREL.y * V_.s); jug(ctx, u / KJ * KJ, { fill: V[p] / 1.2, cl: cl[p], cols }); ctx.restore();
    sleeveHand(ctx, V_.s * 0.82, { ang: 0.62 - 0.3 * ps.lift + 0.1 * Math.sin(t * 2 + p), len: 0.7, sleeve: ['#ffffff', '#ecece4', '#cfd0c6', '#a8aaa0'] });
    ctx.restore();
  };
  const drawCan = (ctx, V_) => {
    if (!milkAnim) return; const k = milkAnim.t, m = V[0] >= V[1] ? 0 : 1, x = X(V_, BASE[m].x - 0.02), y = Y(V_, 0.16 + 0.1 * Math.sin(Math.min(1, k / 0.3) * Math.PI / 2)), a = Math.sin(Math.min(1, k / 0.35) * Math.PI / 2) * 1.2 * (k > 0.8 ? 1 - (k - 0.8) / 0.3 : 1);
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); const w = V_.s * 0.045, h = V_.s * 0.1;
    ctx.fillStyle = lg(ctx, -w, 0, w, 0, [[0, '#a8e0f0'], [0.35, '#fffdf4'], [0.8, '#d6d2c0'], [1, '#a8a494']]); rrect(ctx, -w, -h / 2, w * 2, h, 4); ctx.fill(); ctx.fillStyle = '#d4301f'; ctx.fillRect(-w, -h * 0.3, w * 2, h * 0.1); ctx.fillStyle = '#1f4aa0'; ell(ctx, 0, 0, w * 0.6, h * 0.1); ctx.fill(); ctx.restore();
    if (k > 0.1 && k < 1.0) { const sy = y + V_.s * 0.06, ey = Y(V_, BASE[m].y + CLOTHY); ctx.strokeStyle = 'rgba(255,252,240,0.95)'; ctx.lineWidth = V_.s * 0.008; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - Math.sin(a) * h * 0.4 - V_.s * 0.02, sy); ctx.lineTo(X(V_, BASE[m].x), ey); ctx.stroke(); }
  };
  const draw = (g, Rt, tt) => {
    const W0 = Rt.work, ctx = tinyArea(W0) ? safeCtx(g.ctx) : g.ctx, Wk = { x: W0.x, y: W0.y + 26, w: W0.w, h: W0.h - 26 };
    if (Wk.w < 24 || Wk.h < 24) return;
    const s = Math.min(Wk.w / SW, Wk.h / SH), V_ = { ox: Wk.x + (Wk.w - s * SW) / 2, oy: Wk.y + (Wk.h - s * SH) / 2, s };
    geo = { ox: V_.ox, oy: V_.oy, s: V_.s };
    ctx.save(); rrect(ctx, W0.x, W0.y, W0.w, W0.h, 12); ctx.clip();
    roomBackdrop(ctx, SC, W0, Y(V_, 0.58), tt); counter(ctx, V_);
    // stacked cups and a sugar jar at the back of the counter
    for (let k = 0; k < 3; k++) porcelainCup(ctx, V_.s * 1.0, X(V_, 0.11), Y(V_, 0.745 - k * 0.032), { L: 0, tea: 0.5 });
    { const jx = X(V_, 0.9), jy = Y(V_, 0.76), jw = V_.s * 0.05, jh = V_.s * 0.09; ctx.fillStyle = 'rgba(20,24,30,0.3)'; ell(ctx, jx + 3, jy + 2, jw * 1.1, jw * 0.3); ctx.fill(); ctx.fillStyle = lg(ctx, jx - jw, 0, jx + jw, 0, [[0, 'rgba(190,220,230,0.6)'], [0.3, 'rgba(250,255,255,0.8)'], [1, 'rgba(160,190,200,0.6)']]); rrect(ctx, jx - jw, jy - jh, jw * 2, jh, 6); ctx.fill(); ctx.fillStyle = '#fffdf4'; ctx.fillRect(jx - jw * 0.85, jy - jh * 0.7, jw * 1.7, jh * 0.62); ctx.fillStyle = '#9aa4ac'; rrect(ctx, jx - jw * 1.05, jy - jh - 5, jw * 2.1, 7, 3); ctx.fill(); }
    // the cup waiting on its saucer, filling once the tea is served
    const cx = X(V_, 0.5), cby = Y(V_, 0.9); ctx.fillStyle = 'rgba(20,24,30,0.3)'; ell(ctx, cx + 3, cby + 5, V_.s * 0.07, V_.s * 0.016); ctx.fill(); ctx.fillStyle = lg(ctx, cx - V_.s * 0.07, 0, cx + V_.s * 0.07, 0, [[0, '#c8d0d6'], [0.4, '#ffffff'], [1, '#9aa4ac']]); ell(ctx, cx, cby + 1, V_.s * 0.065, V_.s * 0.014); ctx.fill();
    porcelainCup(ctx, V_.s * 1.2, cx, cby, { L: serving > 0 || done ? 0.82 : 0, tea: 0.7 });
    const order = L >= 0 ? [1, 0] : [0, 1]; for (const p of order) drawPot(ctx, V_, p);
    const pts = S.points((x) => X(V_, x), (y) => Y(V_, y), 0.02 * V_.s, 0.45).map((q, i) => ({ ...q, skip: false })); if (pts.length > 1) { const cols = teaCols(); drawStream(ctx, pts, cols, 0.95); if (milk > 0.05 && mix < 0.85) { const sk = pts.map((q, i) => ({ ...q, w: q.w * 0.7, skip: ((i >> 2) & 1) === 0 })); drawStream(ctx, sk, ['#d8b88c', '#e8d0a8', '#f6e8cc'], clamp((1 - mix) * 0.85, 0, 0.8), 0.4); } }
    drawCan(ctx, V_);
    ctx.restore();
    // gauge: the milk against the line
    dockGauge(g, ctx, W0, { dot: teaCols()[1], fill: (x, y, wd, ht) => { ctx.fillStyle = 'rgba(255,255,255,0.1)'; rrect(ctx, x + 1, y + 1, wd - 2, ht - 2, 4); ctx.fill(); const a = clamp((target - 0.05) / 0.55, 0, 1), b = clamp((target + 0.05) / 0.55, 0, 1); ctx.fillStyle = 'rgba(140,230,150,0.75)'; rrect(ctx, x + wd * a, y + 1, wd * (b - a), ht - 2, 4); ctx.fill(); const mx = x + wd * clamp(milk / 0.55, 0, 1); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mx, y + ht + 2); ctx.lineTo(mx - 5, y + ht + 10); ctx.lineTo(mx + 5, y + ht + 10); ctx.closePath(); ctx.fill(); ctx.stroke(); } });
    hintPill(g, ctx, W0, hint());
    const th = Rt.thumb; ctx.save(); rrect(ctx, th.x - 2, th.y - 2, th.w + 4, th.h + 4, 10); ctx.clip(); refScene(ctx, th, tt); ctx.restore();
  };
  const refScene = (ctx, th, tt) => {
    const ts = th.w * 1.1, V_ = { ox: th.x + th.w / 2 - 0.5 * ts, oy: th.y + th.h * 0.5 - 0.62 * ts, s: ts };
    ctx.save(); ctx.beginPath(); ctx.rect(th.x, th.y, th.w, th.h); ctx.clip();
    roomBackdrop(ctx, SC, th, th.y + th.h * 0.5, tt); counter(ctx, V_);
    for (const p of [0, 1]) { ctx.save(); ctx.translate(X(V_, BASE[p].x - (p ? 0.02 : -0.0)), Y(V_, BASE[p].y)); ctx.scale(p === 0 ? -1 : 1, 1); jug(ctx, V_.s * KJ, { fill: 0.5, cl: 0, cols: ['#7a3c16', '#c99c6c', '#ead2ae'] }); ctx.restore(); }
    const cx = X(V_, 0.5), cby = Y(V_, 0.9); ctx.fillStyle = lg(ctx, cx - V_.s * 0.07, 0, cx + V_.s * 0.07, 0, [[0, '#c8d0d6'], [0.4, '#ffffff'], [1, '#9aa4ac']]); ell(ctx, cx, cby + 1, V_.s * 0.065, V_.s * 0.014); ctx.fill(); porcelainCup(ctx, V_.s * 1.2, cx, cby, { L: 0.82, tea: 0.62 });
    ctx.restore();
  };
  const titleArt = (g, S_, tt) => {
    const { ctx } = g, s = Math.min(S_.w / 1.0, S_.h / 0.95) * 1.02, V_ = { ox: S_.x + (S_.w - s) / 2, oy: S_.y + (S_.h - s * 0.98) / 2 - 0.02 * s, s };
    ctx.save();
    roomBackdrop(ctx, SC, { x: S_.x + S_.w / 2 - S_.w * 0.7, y: S_.y, w: S_.w * 1.4, h: S_.h }, Y(V_, 0.58), tt ?? 0); counter(ctx, V_);
    // pot 0 raised and tipped, pouring into pot 1
    const save = [L, Lt, V[0], V[1]]; L = 0.7; Lt = 0.7; V = [0.6, 0.4]; const cols = ['#7a3c16', '#c99c6c', '#ead2ae'];
    const ps = pose(0), pts = []; { let x = ps.tip.x, y = ps.tip.y, vx = ps.vx, vy = ps.vy; for (let k = 0; k < 90; k++) { pts.push({ x: X(V_, x), y: Y(V_, y), w: 0.014 * V_.s }); x += vx * 0.006; y += vy * 0.006; vy += GRAV * 0.006; vx += 0; if (y > ps.clothY) break; } }
    drawPot(ctx, V_, 1); drawStream(ctx, pts, cols, 0.95); drawPot(ctx, V_, 0);
    [L, Lt, V[0], V[1]] = save;
    ctx.restore();
  };
  const hint = () => {
    if (done) return '';
    if (hintMsg && hintT < 3) return hintMsg;
    const a = Math.abs(Lt);
    if (serving > 0) return 'Poured into the cup.';
    if (pullsDone === 0 && a < 0.1 && !pull) return 'Slide your finger up: the left pot rises and tips. Up further as it empties.';
    if (pull && cl[1 - pull.src] > CLCAP * 0.8) return 'Too fast: the cloth is running over. Tip back a little.';
    if (pull && cl[1 - pull.src] < 0.01 && S.size() === 0 && V[pull.src] > 0.05) return 'Tip it further: the pot needs more tilt as it empties.';
    if (pull) return 'Keep the stream thin and steady. Throw the finger across to the other side when the pot is empty.';
    if (milk < 0.1 && pullsDone >= 1) return 'Put the pots down and press Milk until the marker is in the green.';
    if (pullsDone >= NP) return 'Smooth. Press Serve to pour the cup.';
    return 'Slide down to lift the right pot and pull the tea back.';
  };
  const state = () => ({ technique: 'pour', mode: 'pull', L: Math.round(L * 1000) / 1000, Lt: Math.round(Lt * 1000) / 1000, V: V.map((v) => Math.round(v * 1000) / 1000), cl: cl.map((v) => Math.round(v * 1000) / 1000), spill: Math.round(spill * 1000) / 1000,
    pulls: pulls.map((x) => ({ score: Math.round(x.score * 100) / 100, moved: Math.round(x.moved * 100) / 100, steady: Math.round(x.steady * 100) / 100, height: Math.round(x.height * 100) / 100, clean: Math.round(x.clean * 100) / 100 })), pullsDone, NP, pulling: !!pull, milk: Math.round(milk * 1000) / 1000, target: Math.round(target * 1000) / 1000, mix: Math.round(mix * 1000) / 1000, tau0: V.map((v) => Math.round(tau0(v) * 1000) / 1000), qc: Math.round(QC() * 1000) / 1000, slices: S.size(), serving: serving > 0, missV: Math.round(missV * 1000) / 1000, overV: Math.round(overV * 1000) / 1000 });

  init();
  return {
    init, items, control, work, tick, draw, attract, titleArt, result: () => done, score: total, hint,
    info: () => { const p = parts(); return [`Pulls: ${p.n} of ${NP}`, `Milk ${milk < 0.04 ? 'not yet' : milk < target - 0.05 ? 'a little' : milk <= target + 0.05 ? 'right' : 'too much'}, mixed ${Math.round(mix * 100)}%`]; },
    get caption() { return SC.words?.caption ?? 'Pull this tea'; },
    rules: () => [
      'Slide your finger up the stage and the left pot rises and tips over the right pot; slide it down and the right pot rises and tips over the left. Higher means a longer fall, and a long fall smooths the tea.',
      'A pot needs more tilt the emptier it gets: the gauge down the pot shows how much tea is left. Pour too fast and the tea piles up in the cloth and runs over; the cloth clogs a little more with every pull.',
      'Move your hand smoothly: a quick hand makes the stream sway. When a pot is empty, throw the lever across to the other side. Each full pull should take about four seconds.',
      'Put both pots down and press Milk to add a tin of evaporated milk. Keep adding until the marker is in the green. Milk added before the pulls is mixed in; pulls after it blend it.',
      `Make at least ${NP} full pulls, then press Serve. Score: how steady, high and clean each pull was (45), how well the milk is mixed in (25), the right amount of milk (20), tea kept (10). Doing nothing scores nothing.`,
    ],
    point(id) {
      if (!geo) return null;
      const [k, rest] = id.split(':'), P2 = (x, y) => ({ x: geo.ox + x * geo.s, y: geo.oy + y * geo.s });
      if (k === 'lever') return P2(0.5, YREF - clamp(Number(rest), -1, 1) * RANGE);   // where the finger must be for lever position v (-1 right pot up, 1 left pot up)
      return null;
    },
    state,
  };
}

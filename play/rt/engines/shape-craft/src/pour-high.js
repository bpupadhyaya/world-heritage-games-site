// shape-craft `pour` mode `high` (1.26.0 Kitchen Crafts): Moroccan mint tea poured from a tall silver pot held high into small glasses on a tray.
// The player holds the pot (press and hold = tip it, drag = move it: sideways to aim, up to raise the spout), a thin stream falls with real gravity
// (every slice of tea is integrated from dt), it wobbles when the pot is moved too fast, froth builds with height and steady flow, and the pot is
// tipped back with an upward flick to cut the stream. A round fills a tray of glasses to the same line with a crown of froth and no spill.
// Score = fill and evenness, froth, no spill, a steady stream. Doing nothing scores 0.
import { starsFor, hash } from './geom.js';
import { shadowed, rrect, rgba, mix, ease } from './fx.js';
import { hintPill, dockGauge } from './paint-ui.js';
import { createPourSound } from './pour-sound.js';
import { safeCtx, tinyArea, glassOf, glassBack, glassFront, drawStream, brassTray, mosaicTable, rug, wisp, clamp, lerp, sm, teaColors, yAt, wAt, fOf } from './pour-art.js';
import { silverPot, sleeveHand, TIP } from './pour-pot.js';
import { lg, rg, ell, TAU } from './props.js';
import { EXT } from './registry.js';

// ---- geometry (design units: the stage is 1 wide and SH tall; y grows downward) -------------------------------------------------------------------
const SW = 1, SH = 0.93, GRAV = 7, KP = 0.9;                       // the pot and hand are drawn at 0.8 of their drawing units
const GLASS = { wr: 0.05, wb: 0.035, H: 0.17, ry: 0.26, curve: 1.2 };
const BASE_Y = 0.84, TRAY = { x: 0.4, y: 0.84, rx: 0.46, ry: 0.078 }, SPACING = 0.135, MOUTH = 0.047, OUTER = 0.056;
const YRIM = BASE_Y - GLASS.H;
const QMAX = 0.34, FMAX = 0.3, FK = 0.5, FGOAL = 0.14;                       // fill rate (level units per second at full tilt), froth ceiling and gain
const TIPX = TIP.x * KP, TIPY = TIP.y * KP, TILT_MAX = 0.62;
const PX_MIN = 0.3, PX_MAX = 1.06, PY_MIN = 0.15, PY_MAX = 0.5;
const H = 1 / 120;                                                // integration step for the stream and the pot (s)

export function createHigh(P, env) {
  const { rng, fx } = env, SC = P.scene ?? {};
  const log = env.options?.soundLog, snd = createPourSound(env.audio, log, 'pour');
  const nMin = clamp(Math.round(P.glasses ?? 4), 3, 6), nMax = clamp(Math.round(P.glassesMax ?? nMin), nMin, 6), lineBase = clamp(P.line ?? 0.7, 0.55, 0.8);
  let lastSnd = -1, N, line, gl, pot, tgt, holding, pressT, moved, off, tilt, flick, vUp, slices, acc, agit, puddles, spill, delivered, calm, now, done, geo, ptr, auto, potVol, potVol0, steamT, lastStream, shown, drips, hintT, stat, touched;

  const gx = (i) => 0.4 + (i - (N - 1) / 2) * SPACING;
  // ---- aiming: where does the stream cross the rim for a pivot at (px, py) with the pot tipped fully ----------------------------------------------
  const tipAt = (px, py, tl) => { const a = tl * TILT_MAX, c = Math.cos(a), s = Math.sin(a); return [px + TIPX * c + TIPY * s, py - TIPX * s + TIPY * c]; };
  const exitV = (tl, flow) => { const a = tl * TILT_MAX, ang = Math.atan2(-0.044, -0.023) - a, vs = 0.46 + 0.1 * flow; return [Math.cos(ang) * vs, Math.sin(ang) * vs]; };
  const landOffset = (py, y1 = YRIM) => { const [tx, ty] = tipAt(0, py, 1), [vx, vy] = exitV(1, 1); const A = 0.5 * GRAV, B = vy, C = ty - y1; const T = (-B + Math.sqrt(Math.max(0, B * B - 4 * A * C))) / (2 * A); return tx + vx * T; };
  const aimX = (x, py) => clamp(x - landOffset(py), PX_MIN, PX_MAX);

  const init = () => {
    N = nMin + (nMax > nMin ? Math.min(nMax - nMin, Math.floor(rng.next() * (nMax - nMin + 1))) : 0);
    line = clamp(lineBase + (rng.next() - 0.5) * 0.06, 0.5, 0.88);
    gl = Array.from({ length: N }, () => ({ L: 0, F: 0, taken: 0, seed: Math.floor(rng.next() * 997) + 1, v: Math.floor(rng.next() * 3), bump: 0 }));
    potVol0 = N * line * 1.2; potVol = potVol0;
    pot = { x: 0.7 + (rng.next() - 0.5) * 0.1, y: 0.4, vx: 0, vy: 0 }; tgt = { x: pot.x, y: pot.y };
    holding = false; pressT = 0; moved = 0; off = { x: 0, y: 0 }; tilt = 0; flick = false; vUp = 0; slices = []; acc = 0; agit = 0; puddles = []; spill = 0; delivered = 0; calm = 0; now = 0; done = null; ptr = null; steamT = 0; lastStream = -9; drips = 0; hintT = 0; touched = false;
    stat = { starts: 0, flicks: 0, rim: 0, tray: 0, over: 0 };
    auto = { i: 0, st: 'aim', wait: 0.5, t: 0, cur: -1 }; lastSnd = -1;
  };

  // ---- the physics -----------------------------------------------------------------------------------------------------------------------
  const frothGain = (v) => sm((v - 1.3) / 1.9);
  const stepOnce = () => {
    // the pot follows the target like a spring (critically damped), so the hand has weight
    const w = 12, ax = w * w * (tgt.x - pot.x) - 2 * w * pot.vx, ay = w * w * (tgt.y - pot.y) - 2 * w * pot.vy;
    pot.vx += ax * H; pot.vy += ay * H; pot.x += pot.vx * H; pot.y += pot.vy * H;
    pot.x = clamp(pot.x, PX_MIN, PX_MAX); pot.y = clamp(pot.y, PY_MIN, PY_MAX);
    agit += (Math.hypot(ax, ay) - agit) * Math.min(1, H / 0.12);
    vUp += (Math.max(0, -pot.vy) - vUp) * Math.min(1, H / 0.05);
    // the tip of the pot
    const want = holding && pressT >= 0.2 && potVol > 0.001 ? 1 : 0;
    if (want > tilt) tilt = Math.min(1, tilt + 4.2 * H); else if (want < tilt) tilt = Math.max(0, tilt - (flick ? 9 : 3.2) * H);
    const fl = clamp((tilt - 0.62) / 0.34, 0, 1), flow = QMAX * sm(fl) * clamp(potVol / 0.04, 0, 1);
    if (flow > 0.004) {
      const [tx, ty] = tipAt(pot.x, pot.y, tilt), [vx, vy] = exitV(tilt, sm(fl)), vol = flow * H;
      const amp = clamp((agit - 1.6) * 0.0032, 0, 0.045);
      slices.push({ x: tx, y: ty, vx: vx + pot.vx * 0.9, vy: vy + pot.vy * 0.9, age: 0, vol, amp, ph: hash(slices.length + Math.floor(now * 120), 3), q: sm(fl), x0: tx });
      potVol = Math.max(0, potVol - vol); lastStream = now;
    }
    // every slice falls under gravity and lands in a glass, on its rim or on the tray
    for (let k = slices.length - 1; k >= 0; k--) {
      const s = slices[k]; s.age += H; s.vy += GRAV * H; const y0 = s.y; s.x += s.vx * H; s.y += s.vy * H;
      const wob = s.amp * Math.sin(TAU * (s.age * 5.5 + s.ph)) * Math.min(1, s.age / 0.18), xe = s.x + wob;
      let gone = false;
      if (y0 < YRIM && s.y >= YRIM) { // crossing the rim line
        let hit = -1; for (let i = 0; i < N; i++) if (Math.abs(xe - gx(i)) < OUTER) { hit = i; break; }
        if (hit >= 0 && Math.abs(xe - gx(hit)) < MOUTH) { const g = gl[hit]; s.into = hit; s.v = s.vy; s.top = fOf(glassOf(0, BASE_Y, 1, GLASS), g.L + g.F); void g; }
        else if (hit >= 0) { stat.rim++; spill += s.vol; bump(xe, YRIM, s, 0.4); gone = true; }
      }
      if (s.into !== undefined) {
        const g = gl[s.into], G1 = glassOf(0, BASE_Y, 1, GLASS), surf = yAt(G1, fOf(G1, g.L + g.F));
        if (s.y >= surf) {
          const v = Math.hypot(s.vx, s.vy), ai = frothGain(v), add = s.vol, calmNow = s.amp < 0.012 ? 1 : 0;
          g.L += add; g.taken += add; delivered += add; calm += add * calmNow;
          g.F = clamp(g.F + FK * add * ai * (1 - g.F / FMAX) * (s.amp > 0.02 ? 0.7 : 1), 0, FMAX + 0.05);
          if (g.L + g.F > 1) { const ex = g.L + g.F - 1; g.F = Math.max(0, g.F - ex); if (g.F === 0 && g.L > 1) { spill += g.L - 1; g.L = 1; } else spill += ex; puddle(gx(s.into) + (hash(Math.floor(now * 60), 5) - 0.5) * 0.05, ex); }
          if (hash(Math.floor(now * 240), 9) > 0.8 - 0.1 * ai) emitSplash(xe, surf, v, s.amp);
          gone = true;
        }
      } else if (!gone && s.y >= BASE_Y + 0.004) {   // on the tray or the table
        spill += s.vol; stat.tray++; puddle(xe, s.vol); if (hash(Math.floor(now * 240), 11) > 0.85) { emitSplash(xe, BASE_Y, Math.hypot(s.vx, s.vy), 0.01, true); } gone = true;
      }
      if (gone || s.y > 1.2) slices.splice(k, 1);
    }
    for (const g of gl) { g.F = Math.max(0, g.F - 0.004 * H); }
  };
  const bump = (x, y, s, k) => { if (geo) fx.emit('drop', geo.ox + x * geo.s, geo.oy + y * geo.s, { count: 3, color: '#d9962e', size: 3 + 2 * k, speed: 90, life: 0.5, gravity: 700, spread: Math.PI * 0.9, angle: -Math.PI / 2 }); snd.rim(k); void s; };
  const emitSplash = (x, y, v, amp, tray = false) => { if (!geo) return; fx.emit('drop', geo.ox + x * geo.s, geo.oy + y * geo.s, { count: tray ? 3 : 2, color: tray ? '#c98a2a' : '#e9b04a', size: tray ? 3.4 : 2.4, speed: 40 + v * 18 + amp * 600, life: 0.45, gravity: 900, spread: Math.PI * 0.8, angle: -Math.PI / 2 }); };
  const puddle = (x, v) => { const p = puddles.find((q) => Math.abs(q.x - x) < 0.022); if (p) { p.v += v; p.x = lerp(p.x, x, 0.1); } else if (puddles.length < 24) puddles.push({ x, v, k: hash(puddles.length, 4) }); };

  const tick = (dt) => {
    now += dt; acc += dt; hintT += dt;
    if (holding) pressT += dt;
    let n = 0; while (acc >= H && n < 30) { stepOnce(); acc -= H; n++; } if (n >= 30) acc = 0;
    // the stream's sound: a chunk every 90 ms, pitch rising as the vessel under it fills
    if (slices.length && now - lastSnd > 0.09) {
      lastSnd = now;
      const head = slices[slices.length - 1], i = slices.find((s) => s.into !== undefined)?.into;
      const g = i !== undefined ? gl[i] : null, flow = clamp(head.q, 0.1, 1), v = g ? g.L + g.F : 0;
      if (i !== undefined) snd.stream(flow, clamp(v / 0.95, 0, 1), clamp((0.9 - (tipAt(pot.x, pot.y, tilt)[1])) / 0.7, 0, 1), (gx(i) - 0.4) * 1.2);
      else snd.stream(flow * 0.5, 0.1, 0.5, 0);
    }
    // steam over the tea, and a few bubbles popping in the froth
    steamT += dt;
    if (steamT > 0.35 && geo) { steamT = 0; gl.forEach((g, i) => { if (g.L > 0.05) fx.emit('dust', geo.ox + gx(i) * geo.s + (hash(i, Math.floor(now * 3), 2) - 0.5) * 12, geo.oy + (BASE_Y - GLASS.H * (0.8 + g.F)) * geo.s, { count: 1, color: '#ffffff', size: 6, speed: 12, life: 1.6, gravity: -26, spread: 0.6 }); }); }
  };

  // ---- player input ----------------------------------------------------------------------------------------------------------------------------
  const toLocal = (x, y) => [(x - geo.ox) / geo.s, (y - geo.oy) / geo.s];
  const setTarget = (x, y) => { tgt.x = clamp(x, PX_MIN, PX_MAX); tgt.y = clamp(y, PY_MIN, PY_MAX); };
  const onDown = (p) => { const [x, y] = toLocal(p.x, p.y); holding = true; touched = true; pressT = 0; moved = 0; flick = false; off = { x: tgt.x - x, y: tgt.y - y }; ptr = { x, y, sx: x, sy: y }; };
  const onMove = (p) => { const [x, y] = toLocal(p.x, p.y); moved += Math.hypot(x - ptr.x, y - ptr.y); ptr.x = x; ptr.y = y; setTarget(x + off.x, y + off.y); };
  const release = (forceFlick) => {
    const wasTipped = tilt > 0.3;
    if (pressT < 0.2 && moved < 0.03 && !forceFlick) { // a tap: bring the pot over that spot (the stream would land there)
      if (ptr) { setTarget(aimX(ptr.x, pot.y), pot.y); snd.glide(); }
    } else if (wasTipped) { flick = forceFlick || vUp > 0.22 || pot.vy < -0.18; if (flick) { stat.flicks++; snd.flick(); } else snd.lift(); }
    holding = false;
  };
  const work = (p) => {
    if (!geo || done) return;
    if (p.pressed) onDown(p); else if (p.down && holding) onMove(p);
    if (p.released && holding) release(false);
  };
  const glide = (i) => { setTarget(aimX(gx(i), pot.y), pot.y); snd.glide(); };
  // tea still falling toward glass i (it will land after the pot is tipped back): the level the glass is heading for
  const inflight = (i) => { let v = 0; for (const q of slices) { if (q.into === i) { v += q.vol; continue; } if (q.into !== undefined || q.y >= YRIM) continue; const A = 0.5 * GRAV, T = (-q.vy + Math.sqrt(Math.max(0, q.vy * q.vy + 4 * A * (YRIM - q.y)))) / (2 * A); if (Math.abs(q.x + q.vx * T - gx(i)) < OUTER) v += q.vol; } return v; };
  const nextIdx = () => { let b = -1; for (let i = 0; i < N; i++) if (gl[i].L < line - 0.03 && (b < 0 || gl[i].L < gl[b].L)) b = i; return b; };
  const items = () => [{ id: 'next', kind: 'btn', label: 'Next glass' }, { id: 'check', kind: 'btn', label: 'Serve', primary: true }];
  const control = (id) => {
    if (done) return;
    if (id === 'next') { const i = nextIdx(); if (i >= 0) { if (holding) release(true); glide(i); } }
    else if (id === 'check') { if (holding) release(true); finish(); }
  };

  // ---- score -------------------------------------------------------------------------------------------------------------------------------------
  const parts = () => {
    const fills = gl.map((g) => clamp(1 - Math.max(0, Math.abs(g.L - line) - 0.02) / 0.16, 0, 1)), meanFill = fills.reduce((a, b) => a + b, 0) / N;
    const Ls = gl.map((g) => g.L), spread = Math.max(...Ls) - Math.min(...Ls), even = clamp(1 - Math.max(0, spread - 0.03) / 0.2, 0, 1) * meanFill;
    const fill = 0.6 * meanFill + 0.4 * even;
    const froth = gl.reduce((s, g) => s + clamp(g.F / FGOAL, 0, 1) * (g.L + g.F > 0.985 ? 0.6 : 1) * clamp(g.L / (line * 0.6), 0, 1), 0) / N;
    const poured = delivered + spill, clean = poured > 0.04 ? clamp(1 - spill / (0.035 * N + 0.04), 0, 1) : 0;
    const rhythm = delivered > 0.04 ? clamp(calm / delivered, 0, 1) * clamp(1 - Math.max(0, stat.starts - N) * 0.06, 0.5, 1) : 0;
    return { fill, froth, clean, rhythm, spread, meanFill };
  };
  const score = () => { const p = parts(); return clamp(100 * (0.34 * p.fill + 0.28 * p.froth + 0.18 * p.clean + 0.2 * p.rhythm), 0, 100); };
  const total = () => (done ? done.score : Math.round(score()));
  const finish = () => {
    if (done) return;
    for (let k = 0; k < 400 && slices.length; k++) { holding = false; stepOnce(); }   // the tea still in the air lands first
    const s = Math.round(score()), stars = starsFor(s), p = parts(), W = SC.words ?? {};
    done = { score: s, max: 100, stars, headline: stars === 3 ? (W.win ?? 'Poured like a host') : stars ? (W.ok ?? 'A fine glass of tea') : (W.retry ?? 'Pour again'),
      detail: `Level ${Math.round(p.fill * 100)}%, froth ${Math.round(p.froth * 100)}%, tray ${Math.round(p.clean * 100)}% clean, steady stream ${Math.round(p.rhythm * 100)}%` };
    snd.win(stars);
    if (geo) gl.forEach((g, i) => { if (g.L > 0.1) fx.emit('spark', geo.ox + gx(i) * geo.s, geo.oy + (BASE_Y - GLASS.H * 1.05) * geo.s, { count: 6, color: '#ffe9a0', size: 6, speed: 90, life: 0.9, gravity: 120 }); });
  };

  // ---- the host who pours for Watch and learn: aims, tips, lifts as the glass fills, cuts the stream with a flick -------------------------------------
  const attract = (dt) => {
    if (done) return;
    const a = auto; a.t += dt;
    if (a.wait > 0) { a.wait -= dt; return; }
    if (a.cur === undefined || a.cur < 0 || gl[a.cur].L + inflight(a.cur) >= line - 0.008) { if (holding) { release(true); } a.cur = nextIdx(); a.st = 'aim'; a.wait = 0.35; if (a.cur < 0 || potVol < 0.01) { if (!holding && tilt < 0.05 && !slices.length) finish(); else a.cur = -1; } return; }
    const i = a.cur, g = gl[i];
    if (a.st === 'aim') {
      const py = 0.32; setTarget(aimX(gx(i), py), py); const near = Math.abs(pot.x - tgt.x) < 0.006 && Math.abs(pot.y - tgt.y) < 0.006 && Math.hypot(pot.vx, pot.vy) < 0.05;
      if (!a.snd) { snd.glide(); a.snd = true; }
      if (near && tilt < 0.05) { a.st = 'pour'; a.t = 0; a.snd = false; holding = true; touched = true; pressT = 0.2; moved = 0; flick = false; stat.starts++; }
      return;
    }
    // pouring: raise the pot as the glass fills and keep the stream centred
    const py = lerp(0.32, 0.18, ease(clamp((g.L + 0.02) / line, 0, 1)));
    setTarget(aimX(gx(i), pot.y), py);
    if (g.L + inflight(i) >= line - 0.008) { release(true); a.wait = 0.3; }
  };

  // ---- drawing ------------------------------------------------------------------------------------------------------------------------------------
  const X = (V, x) => V.ox + x * V.s, Y = (V, y) => V.oy + y * V.s;
  const potPose = () => { const a = tilt * TILT_MAX; return a; };
  const drawGlass = (ctx, V, i, front, t) => {
    const g = gl[i], G = glassOf(X(V, gx(i)), Y(V, BASE_Y), V.s, GLASS);
    if (!front) { glassBack(ctx, G, { L: g.L, F: g.F, tea: 0.5, seed: g.seed, t }); return; }
    // the fill line: a short etched mark on the glass wall
    const G1 = glassOf(X(V, gx(i)), Y(V, BASE_Y), V.s, GLASS), fy = yAt(G1, fOf(G1, line)), hw = wAt(G1, fOf(G1, line));
    glassFront(ctx, G, { v: g.v, sprig: i % 2 === 0, seed: g.seed });
    ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = `rgba(255,255,255,${g.L < line - 0.02 ? 0.8 : 0.4})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(G1.x, fy, hw, hw * GLASS.ry, 0, 0.15, Math.PI - 0.15); ctx.stroke(); ctx.restore();
  };
  const streamPts = (V) => {
    const pts = [], sorted = slices.slice().reverse(); // newest (nearest the spout) first
    for (let k = 0; k < sorted.length; k++) {
      const s = sorted[k], v = Math.max(0.3, Math.hypot(s.vx, s.vy)), wob = s.amp * Math.sin(TAU * (s.age * 5.5 + s.ph)) * Math.min(1, s.age / 0.18);
      const w = 0.022 * V.s * Math.sqrt(Math.max(0.05, s.q)) * Math.sqrt(0.55 / v) * (k < 3 ? 0.6 + k * 0.15 : 1);
      pts.push({ x: X(V, s.x + wob), y: Y(V, s.y), w, skip: s.amp > 0.03 && s.age > 0.3 && hash(Math.floor(s.age * 40), s.ph * 7) > 0.6 });
    }
    return pts;
  };
  // the room: the scene's wall drawn tall (up to the horizon behind the table) so the pot and the stream are seen against a wall, with the floor below
  const backdrop = (ctx, r, hor, t) => {
    const wf = EXT.walls[SC.wall]; if (!wf) return;
    ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, hor - r.y); ctx.clip(); wf(ctx, SC, { x: r.x, y: r.y, w: r.w, h: hor - r.y }, hor - r.y, t); ctx.restore();
    ctx.fillStyle = lg(ctx, 0, hor - 2, 0, hor + 16, [[0, 'rgba(0,0,0,0.55)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(r.x, hor - 2, r.w, 18); ctx.fillStyle = 'rgba(255,240,200,0.2)'; ctx.fillRect(r.x, hor - 3, r.w, 2);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(r.x + r.w * 0.1, r.y, r.x + r.w * 0.55, hor + 80); g.addColorStop(0, 'rgba(255,230,170,0.16)'); g.addColorStop(1, 'rgba(255,230,170,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(r.x + r.w * 0.05, r.y); ctx.lineTo(r.x + r.w * 0.38, r.y); ctx.lineTo(r.x + r.w * 0.8, hor + 120); ctx.lineTo(r.x + r.w * 0.3, hor + 120); ctx.closePath(); ctx.fill(); ctx.restore();
  };
  const drawScene = (ctx, V, o) => {
    if (o.room) backdrop(ctx, o.room, Y(V, 0.56), o.t);
    const t = o.t;
    // the table and the tray
    const tcx = X(V, 0.42), tcy = Y(V, 0.9), trx = 0.52 * V.s, try_ = 0.135 * V.s;
    rug(ctx, X(V, 0.42), Y(V, 0.55), Y(V, 1.02), 0.6 * V.s, 0.86 * V.s);
    mosaicTable(ctx, tcx, tcy, trx, try_);
    brassTray(ctx, X(V, TRAY.x), Y(V, TRAY.y), TRAY.rx * V.s, TRAY.ry * V.s, t);
    // puddles of spilt tea on the brass: dark amber with a bright edge
    for (const p of o.puddles ?? []) { const r = (0.012 + Math.sqrt(p.v) * 0.075) * V.s; ctx.fillStyle = 'rgba(86,40,6,0.78)'; ell(ctx, X(V, p.x), Y(V, TRAY.y + 0.018 + (p.k - 0.5) * 0.02), r, r * 0.34); ctx.fill(); ctx.fillStyle = 'rgba(255,214,140,0.5)'; ell(ctx, X(V, p.x) - r * 0.25, Y(V, TRAY.y + 0.014 + (p.k - 0.5) * 0.02), r * 0.45, r * 0.08); ctx.fill(); }
    // warm light thrown on the brass by each glass of tea
    for (let i = 0; i < o.N; i++) { const g = o.gl[i], x = X(V, o.gx(i)); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rg(ctx, x, Y(V, BASE_Y + 0.012), 1, 0.09 * V.s, [[0, `rgba(255,170,60,${0.18 + 0.5 * Math.min(0.9, g.L)})`], [1, 'rgba(255,130,20,0)']]); ell(ctx, x, Y(V, BASE_Y + 0.012), 0.09 * V.s, 0.03 * V.s); ctx.fill(); ctx.restore(); ctx.fillStyle = 'rgba(30,14,0,0.45)'; ell(ctx, x + 3, Y(V, BASE_Y + 0.004), 0.034 * V.s, 0.009 * V.s); ctx.fill(); }
  };
  const draw = (g, Rt, tt) => {
    const W0 = Rt.work, ctx = tinyArea(W0) ? safeCtx(g.ctx) : g.ctx, Wk = { x: W0.x, y: W0.y + 26, w: W0.w, h: W0.h - 26 };
    if (Wk.w < 24 || Wk.h < 24) return;
    const s = Math.min(Wk.w / SW, Wk.h / SH), V = { ox: Wk.x + (Wk.w - s * SW) / 2, oy: Wk.y + (Wk.h - s * SH) / 2, s };
    geo = { ox: V.ox, oy: V.oy, s: V.s, rx: Math.max(W0.x + 26, V.ox + 0.035 * V.s) };
    ctx.save(); rrect(ctx, W0.x, W0.y, W0.w, W0.h, 12); ctx.clip();
    drawScene(ctx, V, { t: now, N, gl, gx, puddles, w: Wk.w, room: W0 });
    for (let i = 0; i < N; i++) drawGlass(ctx, V, i, false, now);
    // the stream, then the front of each glass over it
    if (slices.length) drawStream(ctx, streamPts(V), 0.5, 0.95);
    for (let i = 0; i < N; i++) drawGlass(ctx, V, i, true, now);
    drawAim(ctx, V);
    drawPot(ctx, V);
    drawRuler(ctx, V);
    ctx.restore();
    // gauge in the dock: how much tea is left in the pot
    const [d, b] = teaColors(0.5), left = potVol / potVol0;
    dockGauge(g, ctx, W0, { dot: b, fill: (x, y, wd, ht) => { ctx.fillStyle = lg(ctx, x, 0, x + wd, 0, [[0, d], [1, b]]); rrect(ctx, x + 1, y + 1, Math.max(0, (wd - 2) * left), ht - 2, 4); ctx.fill(); }, warn: potVol < 0.03 ? 'Pot empty' : '' });
    hintPill(g, ctx, W0, hint());
    // reference: the tray as it should be served
    const th = Rt.thumb, ts = th.w * 1.4, Vt = { ox: th.x + th.w / 2 - 0.4 * ts, oy: th.y + th.h * 0.8 - 0.8 * ts, s: ts, room: th };
    ctx.save(); rrect(ctx, th.x - 2, th.y - 2, th.w + 4, th.h + 4, 10); ctx.clip();
    refTray(ctx, Vt, now); ctx.restore();
  };
  const refTray = (ctx, V, t) => {
    const ref = Array.from({ length: N }, (_, i) => ({ L: line, F: 0.15, seed: gl[i].seed, v: gl[i].v }));
    if (EXT.walls[SC.wall]) { const th = V.room; ctx.save(); ctx.beginPath(); ctx.rect(th.x, th.y, th.w, th.h); ctx.clip(); EXT.walls[SC.wall](ctx, SC, { x: th.x, y: th.y, w: th.w, h: th.h * 0.7 }, th.h * 0.7, t); ctx.restore(); }
    ctx.fillStyle = lg(ctx, 0, V.room.y + V.room.h * 0.66, 0, V.room.y + V.room.h, [[0, '#4a2a16'], [1, '#2a160a']]); ctx.fillRect(V.room.x, V.room.y + V.room.h * 0.66, V.room.w, V.room.h * 0.34);
    ctx.fillStyle = rg(ctx, X(V, 0.4), Y(V, 0.78), 4, V.s * 0.7, [[0, 'rgba(255,224,160,0.35)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(V.room.x, V.room.y, V.room.w, V.room.h);
    brassTray(ctx, X(V, TRAY.x), Y(V, TRAY.y), TRAY.rx * V.s, TRAY.ry * V.s, t);
    for (let i = 0; i < N; i++) { const G = glassOf(X(V, gx(i)), Y(V, BASE_Y), V.s, GLASS); glassBack(ctx, G, { ...ref[i], tea: 0.5, t }); glassFront(ctx, G, { v: ref[i].v, sprig: i % 2 === 0 }); }
  };
  const drawPot = (ctx, V) => {
    const a = potPose(), u = V.s * KP;
    ctx.save();
    // soft shadow on the table below the pot
    const sh = clamp(1 - (pot.y - PY_MIN) / 0.5, 0.1, 1);
    ctx.fillStyle = `rgba(20,8,0,${0.3 * sh})`; ell(ctx, X(V, pot.x - 0.07), Y(V, BASE_Y + 0.035), 0.14 * V.s, 0.024 * V.s); ctx.fill();
    ctx.translate(X(V, pot.x), Y(V, pot.y));
    ctx.save(); ctx.rotate(-a); silverPot(ctx, u, { t: now }); ctx.restore();
    // the sleeve and hand stay with the grip point (they do not tip with the pot)
    sleeveHand(ctx, u, { ang: 0.5 - a * 0.25, len: 0.8 });
    ctx.restore();
    // a steam wisp from the spout
    const [tx, ty] = tipAt(pot.x, pot.y, tilt); wisp(ctx, X(V, tx), Y(V, ty) - 0.01 * V.s, 0.07 * V.s, now, 0.35, 3);
    if (!touched && !holding) { const r = (0.045 + 0.008 * Math.sin(now * 4)) * V.s; ctx.strokeStyle = 'rgba(255,240,190,0.8)'; ctx.lineWidth = 2.4; ctx.setLineDash([5, 5]); ell(ctx, X(V, pot.x + 0.01), Y(V, pot.y), r, r); ctx.stroke(); ctx.setLineDash([]); }
  };
  // where the stream will land if the pot is tipped now: a ring on the rim line and a faint dotted arc from the spout
  const drawAim = (ctx, V) => {
    const k = holding || tilt > 0.1 ? 1 : 0.5, [tx, ty] = tipAt(pot.x, pot.y, 1), [vx, vy] = exitV(1, 1), A = 0.5 * GRAV, B = vy, C = ty - YRIM, T = (-B + Math.sqrt(Math.max(0, B * B - 4 * A * C))) / (2 * A), lx = tx + vx * T + (pot.x - pot.x);
    ctx.save(); ctx.setLineDash([2, 6]); ctx.lineCap = 'round'; ctx.strokeStyle = `rgba(255,255,255,${0.28 * k})`; ctx.lineWidth = 2.2; ctx.beginPath();
    for (let q = 0; q <= 14; q++) { const tt = (T * q) / 14, x = tx + vx * tt, y = ty + vy * tt + A * tt * tt; if (q) ctx.lineTo(X(V, x), Y(V, y)); else ctx.moveTo(X(V, x), Y(V, y)); } ctx.stroke(); ctx.setLineDash([]);
    const near = gl.findIndex((_, i) => Math.abs(lx - gx(i)) < MOUTH), ok = near >= 0;
    ctx.strokeStyle = ok ? `rgba(150,255,190,${0.9 * k})` : `rgba(255,190,120,${0.85 * k})`; ctx.lineWidth = 2.4; ell(ctx, X(V, lx), Y(V, YRIM), 0.014 * V.s, 0.005 * V.s); ctx.stroke();
    ctx.restore();
  };
  // the height guide: a slim ruler on the left; the lit band is the height that raises a froth, the marker is the spout
  const drawRuler = (ctx, V) => {
    const x = (geo.rx ?? X(V, 0.035)), y0 = Y(V, 0.2), y1 = Y(V, 0.66), w = 0.016 * V.s;
    rrect(ctx, x - w / 2, y0, w, y1 - y0, w / 2); ctx.fillStyle = 'rgba(30,16,8,0.32)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,240,200,0.35)'; ctx.lineWidth = 1; ctx.stroke();
    const sweetTop = Y(V, 0.24), sweetBot = Y(V, 0.42); ctx.fillStyle = lg(ctx, 0, sweetTop, 0, sweetBot, [[0, 'rgba(255,225,140,0.9)'], [1, 'rgba(255,190,80,0.7)']]); rrect(ctx, x - w / 2 + 1.5, sweetTop, w - 3, sweetBot - sweetTop, w / 2); ctx.fill();
    const tipY = tipAt(pot.x, pot.y, tilt)[1], my = clamp(Y(V, tipY), y0, y1); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + w / 2 + 2, my); ctx.lineTo(x + w / 2 + 12, my - 6); ctx.lineTo(x + w / 2 + 12, my + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  };
  const titleArt = (g, S, t) => {
    const { ctx } = g, s = Math.min(S.w / 1.0, S.h / 0.95) * 0.94, V = { ox: S.x + (S.w - s) / 2 - 0.02 * s, oy: S.y + (S.h - s * 0.98) / 2 - 0.0 * s, s };
    const tt = t ?? 0, save = { N, gl, line };
    if (!gl) init();
    drawScene(ctx, V, { t: tt, N, gl: gl.map(() => ({ L: line })), gx, puddles: [], w: S.w, room: { x: S.x + S.w / 2 - S.w * 0.7, y: S.y, w: S.w * 1.4, h: S.h } });
    for (let i = 0; i < N; i++) { const G = glassOf(X(V, gx(i)), Y(V, BASE_Y), V.s, GLASS); glassBack(ctx, G, { L: line, F: 0.15, tea: 0.5, seed: gl[i].seed }); glassFront(ctx, G, { v: gl[i].v, sprig: i % 2 === 0 }); }
    // a pot poured high, with its stream falling into the middle glass
    const m = Math.min(1, N - 1), px = aimX(gx(m), 0.2), py = 0.2, [tx, ty] = tipAt(px, py, 1), [vx, vy] = exitV(1, 1), pts = [];
    for (let q = 0; q < 40; q++) { const ts2 = q * 0.012, x = tx + vx * ts2, y = ty + vy * ts2 + 0.5 * GRAV * ts2 * ts2; if (y > BASE_Y - GLASS.H * 0.85) break; pts.push({ x: X(V, x), y: Y(V, y), w: 0.011 * V.s * (1 - q * 0.012) }); }
    drawStream(ctx, pts, 0.5, 0.95);
    ctx.save(); ctx.translate(X(V, px), Y(V, py)); ctx.rotate(-TILT_MAX); silverPot(ctx, V.s * KP, {}); ctx.restore();
    ctx.save(); ctx.translate(X(V, px), Y(V, py)); sleeveHand(ctx, V.s * KP, { ang: 0.4, len: 0.8 }); ctx.restore();
    void save;
  };

  const hint = () => {
    if (done) return '';
    if (!touched && !holding) return 'Tap a glass to bring the pot over it. Then press and hold to pour.';
    const i = nextIdx();
    if (potVol < 0.03 && i >= 0) return 'The pot is empty. Serve the tray when you are ready.';
    if (i < 0) return 'Every glass is at the line. Serve the tray.';
    if (holding && tilt > 0.5) { const g = gl[i]; return g.F < 0.05 && g.L > 0.25 ? 'Lift the pot higher to raise a froth. Keep the stream over the glass.' : g.L > line - 0.12 ? 'Nearly at the line: flick the pot upward and let go.' : 'Hold steady. Slide the pot to keep the ring over the glass.'; }
    if (agit > 3.5) return 'Move the pot slowly: a fast hand makes the stream wobble.';
    return 'Slide the pot over a glass, then press and hold to tip it. Lift as it fills.';
  };
  const state = () => ({ technique: 'pour', mode: 'high', n: N, line: Math.round(line * 1000) / 1000, pot: { x: Math.round(pot.x * 1000) / 1000, y: Math.round(pot.y * 1000) / 1000, tilt: Math.round(tilt * 100) / 100, vol: Math.round(potVol * 1000) / 1000, agit: Math.round(agit * 10) / 10 },
    glass: gl.map((g, i) => ({ x: Math.round(gx(i) * 1000) / 1000, L: Math.round(g.L * 1000) / 1000, F: Math.round(g.F * 1000) / 1000, air: Math.round(inflight(i) * 1000) / 1000 })), spill: Math.round(spill * 1000) / 1000, delivered: Math.round(delivered * 1000) / 1000, calm: Math.round(calm * 1000) / 1000,
    slices: slices.length, rimHits: stat.rim, trayHits: stat.tray, holding, flicks: stat.flicks, starts: stat.starts, touched, tgt: { x: Math.round(tgt.x * 1000) / 1000, y: Math.round(tgt.y * 1000) / 1000 }, parts: (() => { const p = parts(); return { fill: Math.round(p.fill * 100) / 100, froth: Math.round(p.froth * 100) / 100, clean: Math.round(p.clean * 100) / 100, rhythm: Math.round(p.rhythm * 100) / 100 }; })() });

  init();
  return {
    init, items, control, work, tick, draw, attract, titleArt, result: () => done, score: total, hint,
    info: () => { const p = parts(), i = nextIdx(); return [`Glasses at the line: ${gl.filter((g) => Math.abs(g.L - line) <= 0.03).length} of ${N}`, `Froth ${Math.round(p.froth * 100)}%, tray ${spill < 0.02 ? 'dry' : spill < 0.07 ? 'a few drops' : 'wet'}${i >= 0 ? '' : ', all filled'}`]; },
    get caption() { return SC.words?.caption ?? 'Pour this tray'; },
    rules: () => [
      'Press and hold to tip the pot; drag to move it. Slide it sideways to aim: the ring on the rim line shows where the stream will land, and it turns green over a glass. Raise the pot to pour from higher.',
      'The tea falls with gravity from the spout. Move the pot slowly: a quick hand makes the stream wobble and swing, and it can miss the glass and land on the tray or the rim.',
      'Froth is made by tea falling from height into the glass: the lit band on the ruler is the height that raises a good crown. As the glass fills the tea lies closer, so lift the pot as you pour.',
      'Fill every glass to the dashed line on its side, no more, no less. Tip the pot back with an upward flick to cut the stream cleanly; letting it down slowly leaves a dribble. A full glass overflows its foam onto the tray.',
      'The pot holds only a little more than the tray needs: tea spilt on the tray cannot be poured again. Tap a glass, or press Next glass, to bring the pot over it.',
      'Score: level and evenness of the glasses (34), froth crown (28), a dry tray (18), a steady unbroken stream (20). Doing nothing scores nothing.',
    ],
    point(id) {
      if (!geo) return null;
      const [k, rest] = id.split(':');
      const P2 = (x, y) => ({ x: geo.ox + x * geo.s, y: geo.oy + y * geo.s });
      if (k === 'pot') return P2(pot.x + 0.01, pot.y);
      if (k === 'tgt') return P2(tgt.x, tgt.y);
      if (k === 'glass') { const i = clamp(Number(rest), 0, N - 1); return P2(gx(i), BASE_Y - 0.05); }
      if (k === 'aim') { const [gi, py] = rest.split(',').map(Number); return P2(aimX(gx(gi), py), py); }   // where the pot's grip must be for the stream to land in glass gi at height py
      return null;
    },
    state,
  };
}

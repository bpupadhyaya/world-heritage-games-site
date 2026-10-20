// shape-craft technique `inlay` (1.7.0): metal and shell inlay.
//   mode wire  (Bidriware, India): ENGRAVE grooves with a graver, press silver WIRE into them (it follows the groove), PEEN it flat with a hammer,
//                                  then BLACKEN the zinc so only the silver shows.
//   mode shell (Najeon chilgi, Korea): CUT mother-of-pearl pieces from a sheet along their outlines, SET each piece into its recess in the
//                                  lacquer by dragging it there, POLISH the panel with a cloth until the pearl glows.
// The reference is a figure table (src/inlay-figures.js). The score is the mean of the three steps (0 to 100); doing nothing scores 0.
import { registerTechnique } from './registry.js';
import { starsFor, inPoly, hash } from './geom.js';
import { shadowed, rrect, shelf, rgba, tint, mix, ease } from './fx.js';
import { drawTool, wallLift } from './scenes.js';
import { fx as synth } from '../../../platform/engine-kit/synth.js';
import { INLAY_DESIGNS, INLAY_IDS } from './inlay-figures.js';
import { clamp, dist, polyLen, buildSamples, ribbon, prepareLayer, scoreLayer, regionAt } from './paint-stroke.js';

const TOOLS = { engrave: { base: 0.0075, use: 0, pressure: false, taper: false }, wire: { base: 0.0085, use: 0, pressure: false, taper: false }, saw: { base: 0.0042, use: 0, pressure: false, taper: false } };
const STEPS = { wire: ['Engrave the grooves', 'Press in the silver wire', 'Peen the wire flat'], shell: ['Cut the pieces from the shell', 'Set each piece in its recess', 'Polish the panel'] };
const NEXT = { wire: ['Wire it', 'Peen', 'Blacken'], shell: ['Set', 'Polish', 'Check'] };
const HELD = { wire: ['chisel', 'awl', 'mallet'], shell: ['knife', null, 'sponge'] };
const MIN_STEP = 0.0035;
const grid = (pts, cs) => { const g = new Map(); for (const p of pts) { const k = Math.floor(p.x / cs) * 8192 + Math.floor(p.y / cs); (g.get(k) ?? g.set(k, []).get(k)).push(p); } return g; };
const hasNear = (g, cs, x, y, r) => { const cx = Math.floor(x / cs), cy = Math.floor(y / cs), rr = r * r; for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (const p of g.get((cx + dx) * 8192 + cy + dy) ?? []) { const ex = p.x - x, ey = p.y - y; if (ex * ex + ey * ey <= rr) return p; } return null; };

function createInlaySound(audio, mode) {
  const F = (kind, p) => { try { return synth(audio, kind, p); } catch { return false; } };
  let carried = 0;
  return {
    engrave(len) { carried += len; if (carried < 0.02) return; carried = 0; F('scrape', { hz: 5200, dur: 0.07, vel: 0.7 }); F('tick', { hz: 3200, vel: 0.3 }); },
    wire(len) { carried += len; if (carried < 0.03) return; carried = 0; F('scrape', { hz: 3200, dur: 0.06, vel: 0.55 }); },
    saw(len) { carried += len; if (carried < 0.016) return; carried = 0; F('scrape', { hz: 6200, dur: 0.05, vel: 0.65 }); F('tick', { hz: 4200, vel: 0.25 }); },
    down() { carried = 0; F('tick', { hz: 2000, vel: 0.35 }); },
    up() { F('scrape', { hz: 3000, dur: 0.05, vel: 0.4 }); },
    peen() { F('impact', { mat: 'metal', hz: 1300, vel: 0.5 }); F('ring', { hz: 3400, dur: 0.25, vel: 0.32, delay: 0.01 }); },
    lift() { F('whoosh', { dur: 0.14, vel: 0.4, down: false }); F('pop', { vel: 0.45, delay: 0.1 }); },
    place() { F('impact', { mat: mode === 'shell' ? 'wood' : 'metal', hz: 520, vel: 0.5 }); F('ring', { hz: 2600, dur: 0.4, vel: 0.45, delay: 0.02 }); },
    wrong() { F('tick', { hz: 700, vel: 0.4 }); },
    rub(len) { carried += len; if (carried < 0.03) return; carried = 0; F('scrape', { hz: 1500, dur: 0.12, vel: 0.55 }); },
    blacken() { F('splash', { vel: 0.4 }); F('whoosh', { dur: 0.7, vel: 0.4, down: true, delay: 0.1 }); F('scrape', { hz: 900, dur: 0.6, vel: 0.35, delay: 0.3 }); },
    step() { F('whoosh', { dur: 0.2, vel: 0.4, down: true }); },
    mode() { F('tick', { hz: 1800, vel: 0.35 }); },
    undo() { F('pop', { vel: 0.4 }); },
    win(stars) { F('good', { hz: 660 + stars * 60, vel: 0.6 }); F('ring', { hz: 2093, dur: 0.9, vel: 0.35, delay: 0.1 }); },
  };
}

export function createInlay(P, env) {
  const { rng, fx } = env, SC = P.scene ?? {};
  const designId = INLAY_IDS.includes(P.design) ? P.design : INLAY_IDS.includes(SC.id) ? SC.id : 'bidri';
  const snd = createInlaySound(env.audio, INLAY_DESIGNS[designId](rng, 0).mode);
  if (env.options?.soundLog) for (const k of Object.keys(snd)) { const f = snd[k]; snd[k] = (...a) => { env.options.soundLog.push({ kind: `inlay.${k}` }); return f(...a); }; }
  const tol = P.tolerance ?? 0.032;

  let D, prep, phase, grooves, wires, taps, cuts, parts, cur, gmode, geo, done, now, scores, group, blacken, rub, rubCells, ptr, drag, hammer, auto, flash, cache, trayGeo;

  const mode = () => D.mode;
  const T = () => TOOLS[mode() === 'wire' ? ['engrave', 'wire'][phase] : 'saw'];
  const init = () => {
    D = INLAY_DESIGNS[designId](rng, P.variation ?? 1);
    prep = prepareLayer({ strokes: D.lines, regions: [] }, { kind: 'none' }, D.ar);
    phase = 0; grooves = []; wires = []; taps = []; cuts = []; cur = null; gmode = P.guide === false ? 'off' : 'trace'; geo = null; done = null; now = 0; scores = []; group = 0;
    blacken = -1; rub = []; ptr = null; drag = null; hammer = null; flash = -9; cache = null;
    parts = D.pieces.map((p, i) => ({ i, cut: false, placed: false, at: p.at.slice(), liftAt: -1, pos: null, wrong: -9 }));
    rubCells = null;
    if (mode() === 'shell') {   // cells of the pieces' homes for the polish step
      rubCells = [];
      D.pieces.forEach((p, i) => { const xs = p.pts.map((q) => q[0]), ys = p.pts.map((q) => q[1]); for (let y = Math.min(...ys) + 0.0125; y < Math.max(...ys); y += 0.025) for (let x = Math.min(...xs) + 0.0125; x < Math.max(...xs); x += 0.025) if (inPoly(p.pts, x, y)) rubCells.push({ x, y, piece: i, hit: false }); });
    }
    buildAuto();
  };

  // ---- scoring ---------------------------------------------------------------------------------------------------------------------------
  const sampleOf = (arr, only) => arr.flatMap((s) => (only && !only(s) ? [] : s.pts.map((p) => ({ x: p.x, y: p.y, col: 0, free: true }))));
  const compute = () => {
    if (cache) return cache;
    const m = mode(), s = [0, 0, 0], detail = {};
    if (m === 'wire') {
      const gs = sampleOf(grooves), wsAll = wires.flatMap((w) => w.pts.map((p) => ({ x: p.x, y: p.y, col: 0, free: true })));
      s[0] = scoreLayer(prep, gs, tol).score / 100;
      const gGrid = grid(gs, tol * 1.4), ws = wsAll.filter((p) => hasNear(gGrid, tol * 1.4, p.x, p.y, tol * 1.4));
      const w = scoreLayer(prep, ws, tol); s[1] = w.score / 100;
      const wGrid = grid(ws, tol * 1.2), tGrid = grid(taps, 0.05); let wired = 0, hit = 0;
      prep.guides.forEach((g) => g.pts.forEach((p) => { wired++; if (hasNear(wGrid, tol * 1.2, p[0], p[1], tol * 1.2) && hasNear(tGrid, 0.05, p[0], p[1], 0.032)) hit++; }));
      s[2] = wired ? hit / wired : 0; detail.cov = w.strokeCov;
    } else {
      const sc = scoreLayer(prep, sampleOf(cuts), tol); s[0] = sc.score / 100; detail.cov = sc.strokeCov;
      s[1] = parts.length ? parts.filter((p) => p.placed).length / parts.length : 0;
      const tot = rubCells.length, got = rubCells.filter((c) => c.hit && parts[c.piece].placed).length;
      s[2] = tot ? clamp(got / (tot * 0.85), 0, 1) : 0;
    }
    cache = { s, ...detail };
    return cache;
  };
  const dirty = () => { cache = null; };
  const total = () => { const c = compute(); const live = c.s.map((v, i) => (i < phase ? scores[i] : i === phase ? v : 0)); return Math.round((100 * live.reduce((a, b) => a + b, 0)) / 3); };

  // ---- strokes -----------------------------------------------------------------------------------------------------------------------------
  const toLocal = (x, y) => [(x - geo.ox) / geo.s, (y - geo.oy) / geo.s];
  const snapToGroove = (u, v) => { // the wire is pressed into the groove: it follows it where there is one
    const gp = hasNear(grooveGrid(), tol * 2.4, u, v, tol * 2.4);
    if (!gp) return [u, v];
    let best = null, bd = tol * 2.4; const gg = grooveGrid();
    const cx = Math.floor(u / (tol * 2.4)), cy = Math.floor(v / (tol * 2.4));
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (const p of gg.get((cx + dx) * 8192 + cy + dy) ?? []) { const d = Math.hypot(p.x - u, p.y - v); if (d < bd) { bd = d; best = p; } }
    return best ? [best.x, best.y] : [u, v];
  };
  let gGridCache = null, gGridN = -1;
  const grooveGrid = () => { if (gGridN !== grooves.length || !gGridCache) { gGridCache = grid(sampleOf(grooves), tol * 2.4); gGridN = grooves.length; } return gGridCache; };

  const trayPos = (n, N) => { // slot of the n-th cut piece in the tray (design units below the panel)
    const cols = Math.min(11, Math.max(1, N)), r = Math.floor(n / cols), c = n % cols;
    return [D.ar * ((c + 0.5) / cols), 1.075 + r * 0.075];
  };
  const begin = (u, v) => {
    if (done || blacken >= 0) return;
    const m = mode();
    if (m === 'wire' && phase === 2) { // peen: one hammer blow
      taps.push({ x: u, y: v }); dirty(); hammer = { x: u, y: v, t: now }; snd.peen();
      if (geo) fx.emit('spark', geo.ox + u * geo.s, geo.oy + v * geo.s, { count: 3, color: '#fff4c8', size: 5, speed: 90, life: 0.3, gravity: 120 });
      return;
    }
    if (m === 'shell' && phase === 1) { // pick a piece up, from the tray or from where it was dropped
      let hit = -1;
      for (const p of parts) { if (!p.cut || p.placed) continue; const c = partCentre(p); if (Math.hypot(c[0] - u, c[1] - v) < 0.06) hit = p.i; }
      if (hit >= 0) { drag = { i: hit, dx: partCentre(parts[hit])[0] - u, dy: partCentre(parts[hit])[1] - v }; parts[hit].pos = partCentre(parts[hit]); snd.down(); }
      return;
    }
    if (m === 'shell' && phase === 2) { cur = { raw: [{ x: u, y: v, t: now }], rub: true, len: 0 }; return; }
    cur = { raw: [{ x: u, y: v, t: now }], len: 0 };
    snd.down();
  };
  const move = (u, v) => {
    const m = mode();
    if (drag) { parts[drag.i].pos = [u + drag.dx, v + drag.dy]; return; }
    if (!cur) return;
    if (cur.rub) { const a = cur.raw[cur.raw.length - 1]; if (Math.hypot(u - a.x, v - a.y) < 0.006) return; cur.raw.push({ x: u, y: v, t: now }); cur.len += dist([a.x, a.y], [u, v]); dirtyRub(u, v); snd.rub(dist([a.x, a.y], [u, v])); return; }
    const a = cur.raw[cur.raw.length - 1], d = Math.hypot(u - a.x, v - a.y);
    if (d < MIN_STEP) return;
    const [x, y] = m === 'wire' && phase === 1 ? snapToGroove(u, v) : [u, v];
    cur.raw.push({ x, y, t: now }); cur.len += d;
    (m === 'wire' ? (phase === 0 ? snd.engrave : snd.wire) : snd.saw)(d);
    if (geo && (m === 'shell' || phase === 0) && (cur.raw.length % 4 === 0)) fx.emit(m === 'wire' ? 'curl' : 'dust', geo.ox + x * geo.s, geo.oy + y * geo.s, { count: 1, color: m === 'wire' ? '#d8dee4' : '#efe6f2', size: 4, speed: 40, life: 0.5, gravity: 120 });
  };
  const dirtyRub = (u, v) => { for (const c of rubCells) if (!c.hit && Math.hypot(c.x - u, c.y - v) < 0.05) c.hit = true; dirty(); };
  const end = () => {
    const m = mode();
    if (drag) {
      const p = parts[drag.i], c = p.pos, home = D.pieces[p.i].at;
      if (Math.hypot(c[0] - home[0], c[1] - home[1]) < 0.07) { p.placed = true; p.pos = null; snd.place(); if (geo) fx.emit('spark', geo.ox + home[0] * geo.s, geo.oy + home[1] * geo.s, { count: 6, color: '#f8f0ff', size: 6, speed: 90, life: 0.5, gravity: 40 }); }
      else { p.pos = null; p.wrong = now; snd.wrong(); }
      drag = null; dirty(); return;
    }
    if (!cur) return;
    const st = cur; cur = null;
    if (st.rub) { dirty(); return; }
    const res = buildSamples(st.raw, TOOLS[m === 'wire' ? ['engrave', 'wire'][phase] : 'saw'], 1, 1);
    if (!res.pts.length) return;
    const it = { pts: res.pts, rib: ribbon(res.pts), born: now, group: ++group, len: res.len };
    (m === 'wire' ? (phase === 0 ? grooves : wires) : cuts).push(it);
    dirty(); snd.up();
    if (m === 'shell') { // a piece whose whole outline has been cut lifts away into the tray
      const c = compute();
      prep.guides.forEach((g, i) => { const p = parts[i]; if (p && !p.cut && (c.cov?.[i] ?? 0) >= 0.8) { p.cut = true; p.liftAt = now; p.order = parts.filter((q) => q.cut).length - 1; snd.lift(); } });
    }
  };
  const undo = () => {
    const arr = mode() === 'wire' ? (phase === 0 ? grooves : phase === 1 ? wires : null) : phase === 0 ? cuts : null;
    if (!arr || !arr.length) return;
    arr.pop(); if (arr === grooves) gGridCache = null;
    if (mode() === 'shell') { // a piece that is no longer fully cut goes back into the sheet
      const c = (dirty(), compute());
      parts.forEach((p, i) => { if (p.cut && !p.placed && (c.cov?.[i] ?? 0) < 0.8) p.cut = false; });
    }
    dirty(); snd.undo();
  };
  const advance = () => {
    if (done || blacken >= 0) return;
    const c = compute(); scores[phase] = c.s[phase];
    if (phase < 2) {
      phase++; cur = null; drag = null; dirty(); snd.step();
      if (mode() === 'shell' && phase === 1) parts.forEach((p) => { if (p.cut) p.pos = null; });
      return;
    }
    // last step: blacken the plate (wire) or finish the panel (shell)
    blacken = now; if (mode() === 'wire') snd.blacken();
    const score = Math.round((100 * scores.reduce((a, b) => a + b, 0)) / 3), stars = starsFor(score), W = SC.words ?? {};
    done = { score, max: 100, stars, headline: stars === 3 ? (W.win ?? 'Worth framing') : stars ? (W.ok ?? 'A good piece') : (W.retry ?? 'Back to the bench'), detail: `${STEPS[mode()].map((n, i) => `${n.split(' ')[0]} ${Math.round(scores[i] * 100)} percent`).join(', ')}` };
    snd.win(stars);
    if (geo) fx.emit('spark', geo.ox + geo.bw / 2, geo.oy + geo.s / 2, { count: 16, color: '#f4f8ff', size: 8, speed: 170, life: 0.9, gravity: 70 });
  };
  const partCentre = (p) => (p.pos ?? (p.cut ? trayPos(p.order ?? 0, parts.filter((q) => q.cut || q.placed).length || 1) : p.at));
  const nCut = () => parts.filter((p) => p.cut).length;

  // ---- controls and input ------------------------------------------------------------------------------------------------------------------
  const items = () => [
    { id: 'guide', kind: 'btn', label: gmode === 'trace' ? 'Guide' : 'No guide' },
    { id: 'undo', kind: 'btn', label: 'Undo', off: !((mode() === 'wire' && phase < 2 && (phase === 0 ? grooves : wires).length) || (mode() === 'shell' && phase === 0 && cuts.length)) },
    { id: 'check', kind: 'btn', label: NEXT[mode()][phase], primary: true },
  ];
  const control = (id) => {
    if (done) return;
    if (id === 'guide') { gmode = gmode === 'trace' ? 'off' : 'trace'; snd.mode(); } else if (id === 'undo') undo(); else if (id === 'check') advance();
  };
  const work = (p) => {
    if (!geo || done) return;
    ptr = { x: p.x, y: p.y };
    const [u, v] = toLocal(p.x, p.y);
    if (p.pressed && u > -0.05 && u < D.ar + 0.05 && v > -0.05 && v < 1.28) begin(u, v);
    if ((cur || drag) && (p.down || p.pressed)) move(u, v);
    if ((cur || drag) && (p.released || !p.down)) end();
  };
  const tick = (dt) => { now += dt; };

  // ---- attract mode ----------------------------------------------------------------------------------------------------------------------
  function buildAuto() {
    const q = [], m = mode();
    const strokes = () => prep.guides.forEach((g, gi) => q.push({ t: 'stroke', g, gi }));
    if (m === 'wire') {
      strokes(); q.push({ t: 'next' }); strokes(); q.push({ t: 'next' });
      prep.guides.forEach((g) => { for (let s = 0; s < g.len; s += 0.05) q.push({ t: 'tap', g, s }); });
      q.push({ t: 'next' });
    } else {
      strokes(); q.push({ t: 'next' });
      D.pieces.forEach((p, i) => q.push({ t: 'place', i }));
      q.push({ t: 'next' }, { t: 'rub' }, { t: 'next' });
    }
    const total = prep.total * (m === 'wire' ? 2 : 1);
    auto = { q, i: 0, wait: 0.2, st: null, speed: Math.max(0.9, total / 24), ws: Math.min(1, 14 / Math.max(1, q.length * 0.1)), hand: null };
  }
  const along = (pts, s) => { let acc = 0; for (let i = 1; i < pts.length; i++) { const d = dist(pts[i - 1], pts[i]); if (acc + d >= s) { const t = d ? (s - acc) / d : 0; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]; } acc += d; } return pts[pts.length - 1]; };
  const attract = (dt) => {
    if (done) return;
    if (auto.wait > 0) { auto.wait -= dt; return; }
    const st = auto.st;
    if (st) {
      if (st.kind === 'stroke') {
        st.pos = Math.min(st.len, st.pos + auto.speed * dt); const q = along(st.g.pts, st.pos), j = (((st.k = (st.k ?? 0) + 1) * 2654435761) % 1000) / 1000 - 0.5;
        move(q[0] + j * 0.002, q[1] + j * 0.0015); auto.hand = q;
        if (st.pos >= st.len) { end(); auto.st = null; auto.wait = 0.1 * auto.ws; }
      } else if (st.kind === 'drag') {
        st.t = Math.min(1, st.t + dt / 0.7); const e = ease(st.t), x = st.from[0] + (st.to[0] - st.from[0]) * e, y = st.from[1] + (st.to[1] - st.from[1]) * e - Math.sin(e * Math.PI) * 0.05;
        move(x, y); auto.hand = [x, y];
        if (st.t >= 1) { end(); auto.st = null; auto.wait = 0.12 * auto.ws; }
      } else if (st.kind === 'rub') {
        st.pos = Math.min(st.len, st.pos + 1.6 * dt); const q = rubPath(st.pos); move(q[0], q[1]); auto.hand = q;
        if (st.pos >= st.len) { end(); auto.st = null; auto.wait = 0.2; }
      }
      return;
    }
    const a = auto.q[auto.i];
    if (!a) return;
    auto.i++;
    if (a.t === 'stroke') { begin(a.g.pts[0][0], a.g.pts[0][1]); auto.st = { kind: 'stroke', g: a.g, pos: 0, len: polyLen(a.g.pts), k: 0 }; auto.hand = a.g.pts[0]; }
    else if (a.t === 'tap') { const q = along(a.g.pts, a.s); begin(q[0], q[1]); auto.hand = q; auto.wait = 0.055 * auto.ws; }
    else if (a.t === 'next') { advance(); auto.wait = blacken >= 0 ? 0.1 : 0.5; }
    else if (a.t === 'place') {
      const p = parts[a.i]; if (!p.cut) { p.cut = true; p.order = nCut(); }
      const from = partCentre(p), to = D.pieces[a.i].at; begin(from[0], from[1]); auto.st = { kind: 'drag', from, to, t: 0 }; auto.hand = from;
    } else if (a.t === 'rub') { begin(0.2, 0.2); auto.st = { kind: 'rub', pos: 0, len: 22 }; }
  };
  const rubPath = (s) => { const rows = 11, per = 2.0, k = Math.floor(s / per), f = (s % per) / per; const y = 0.1 + (0.8 * Math.min(rows - 1, k)) / (rows - 1), x = (k % 2 ? 1 - f : f) * 0.8 + 0.1; return [x * D.ar, y]; };

  // ---- drawing -----------------------------------------------------------------------------------------------------------------------------
  const fitBox = (R, extra = 0) => { const s = Math.min((R.h - extra) , R.w / D.ar); return { s, ox: R.x + (R.w - s * D.ar) / 2, oy: R.y + (R.h - extra - s) / 2 }; };
  const X = (V, x) => V.ox + x * V.s, Y = (V, y) => V.oy + y * V.s;
  const pathPts = (ctx, V, pts, closed) => { ctx.beginPath(); pts.forEach((p, i) => { const x = X(V, p[0] ?? p.x), y = Y(V, p[1] ?? p.y); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); if (closed) ctx.closePath(); };
  const surfacePath = (ctx, V) => { if (D.shape === 'ellipse') { ctx.beginPath(); ctx.ellipse(X(V, D.ar / 2), Y(V, 0.5), D.ar * V.s / 2, V.s / 2, 0, 0, 6.3); } else rrect(ctx, X(V, 0), Y(V, 0), D.ar * V.s, V.s, V.s * 0.02); };
  const ribPath = (ctx, V, rib) => { ctx.beginPath(); rib.L.forEach((p, i) => { const x = X(V, p[0]), y = Y(V, p[1]); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); for (let i = rib.R.length - 1; i >= 0; i--) ctx.lineTo(X(V, rib.R[i][0]), Y(V, rib.R[i][1])); ctx.closePath(); };
  const centre = (ctx, V, pts, dx = 0, dy = 0) => { ctx.beginPath(); pts.forEach((p, i) => { const x = X(V, p.x) + dx, y = Y(V, p.y) + dy; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); };
  const pearl = (ctx, x0, y0, x1, y1) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); ['#f7f0ea', '#cfe6ee', '#ead3ef', '#f4ecd2', '#cfe9dc', '#f7f0ea'].forEach((c, i) => g.addColorStop(i / 5, c)); return g; };

  const drawPlate = (ctx, V, t, kPlate) => {
    const x = X(V, 0), y = Y(V, 0), w = D.ar * V.s, h = V.s, m = mode();
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = h * 0.05; ctx.shadowOffsetY = h * 0.025; surfacePath(ctx, V); ctx.fillStyle = '#10100e'; ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(0, Math.max(4, h * 0.016)); surfacePath(ctx, V); ctx.fillStyle = m === 'wire' ? '#3a3e42' : '#0a0806'; ctx.fill(); ctx.restore();
    ctx.save(); surfacePath(ctx, V); ctx.clip();
    if (m === 'wire') {
      const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#b8c0c4'); g.addColorStop(0.5, '#8d979b'); g.addColorStop(1, '#6b7479'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.beginPath(); for (let r = 0.02; r < 0.52; r += 0.011) { ctx.moveTo(x + w / 2 + r * w, y + h / 2); ctx.ellipse(x + w / 2, y + h / 2, r * w, r * h, 0, 0, 6.3); } ctx.stroke();
      if (kPlate > 0) { ctx.fillStyle = `rgba(14,14,16,${0.94 * kPlate})`; ctx.fillRect(x, y, w, h); const sh = ctx.createRadialGradient(x + w * 0.35, y + h * 0.3, 0, x + w * 0.5, y + h * 0.5, w * 0.7); sh.addColorStop(0, `rgba(255,255,255,${0.12 * kPlate})`); sh.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = sh; ctx.fillRect(x, y, w, h); }
    } else if (phase === 0 && !done) { // the shell sheet
      ctx.fillStyle = pearl(ctx, x, y, x + w, y + h, t); ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(120,100,140,0.08)'; for (let k = 0; k < 90; k++) ctx.fillRect(x + hash(k, 3) * w, y + hash(k, 4) * h, 1.6, 1.6);
    } else { // black lacquer
      const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#26211f'); g.addColorStop(1, '#090706'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let k = 0; k < 50; k++) { const yy = y + hash(k, 5) * h; ctx.moveTo(x, yy); ctx.lineTo(x + w, yy + (hash(k, 6) - 0.5) * 6); } ctx.stroke();
      const gl = ctx.createLinearGradient(x, y, x + w, y + h); gl.addColorStop(0, 'rgba(255,255,255,0.12)'); gl.addColorStop(0.4, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
  };
  const drawWorld = (ctx, V, o) => {
    const t = o.t, m = mode(), kPlate = o.blacken ?? 0;
    drawPlate(ctx, V, t, kPlate);
    ctx.save(); surfacePath(ctx, V); ctx.clip();
    if (m === 'wire') {
      for (const g of o.grooves) { ribPath(ctx, V, g.rib); ctx.fillStyle = `rgba(20,24,28,${0.85 * (1 - kPlate * 0.7)})`; ctx.fill(); centre(ctx, V, g.pts, 0.8, 1.2); ctx.strokeStyle = `rgba(255,255,255,${0.35 * (1 - kPlate)})`; ctx.lineWidth = 1; ctx.stroke(); }
      for (const w of o.wires) {
        const flat = o.peen?.(w) ?? 0;
        centre(ctx, V, w.pts, 1.2, 2.2); ctx.strokeStyle = `rgba(0,0,0,${0.35 * (1 - flat * 0.8)})`; ctx.lineWidth = w.pts[0].w * V.s * 1.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
        centre(ctx, V, w.pts); ctx.strokeStyle = '#8e98a2'; ctx.lineWidth = w.pts[0].w * V.s * (1.25 + flat * 0.2); ctx.stroke();
        centre(ctx, V, w.pts); ctx.strokeStyle = flat > 0.5 ? '#f4f7fa' : '#d9e0e6'; ctx.lineWidth = w.pts[0].w * V.s * 0.9; ctx.stroke();
        centre(ctx, V, w.pts, -0.6, -0.8); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(1, w.pts[0].w * V.s * 0.25); ctx.stroke();
      }
      for (const tp of o.taps) { ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(X(V, tp.x), Y(V, tp.y), Math.max(1.4, V.s * 0.0045), 0, 6.3); ctx.fill(); }
    } else {
      if (o.phase === 0) {
        for (const c of o.cuts) { ribPath(ctx, V, c.rib); ctx.fillStyle = 'rgba(20,10,30,0.85)'; ctx.fill(); }
        parts.forEach((p) => { if (p.cut) { const pts = D.pieces[p.i].pts; pathPts(ctx, V, pts, true); ctx.fillStyle = 'rgba(30,25,40,0.78)'; ctx.fill(); } });
      } else {
        D.pieces.forEach((p) => { pathPts(ctx, V, p.pts, true); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.4; ctx.stroke(); });
        parts.forEach((p) => { if (p.placed) drawPiece(ctx, V, p.i, null, t, o.shine(p.i)); });
      }
    }
    ctx.restore();
  };
  const drawPiece = (ctx, V, i, pos, t, shine = 0) => {
    const P0 = D.pieces[i], dx = pos ? pos[0] - P0.at[0] : 0, dy = pos ? pos[1] - P0.at[1] : 0, sc = pos ? pos.scale ?? 1 : 1;
    const pts = P0.pts.map((q) => [P0.at[0] + (q[0] - P0.at[0]) * sc + dx, P0.at[1] + (q[1] - P0.at[1]) * sc + dy]);
    ctx.save();
    if (pos) { ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4; }
    pathPts(ctx, V, pts, true); ctx.fillStyle = pearl(ctx, X(V, pts[0][0] - 0.1), Y(V, pts[0][1] - 0.1), X(V, pts[0][0] + 0.2), Y(V, pts[0][1] + 0.2), t + i); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.strokeStyle = 'rgba(70,50,80,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
    pathPts(ctx, V, pts, true); ctx.clip();
    ctx.fillStyle = `rgba(70,55,60,${0.34 * (1 - shine)})`; ctx.fillRect(X(V, P0.at[0] - 0.3), Y(V, P0.at[1] - 0.3), V.s * 0.6, V.s * 0.6);   // the dull film that polishing clears
    const g = ctx.createLinearGradient(X(V, P0.at[0] - 0.05), Y(V, P0.at[1] - 0.05), X(V, P0.at[0] + 0.05), Y(V, P0.at[1] + 0.05)); g.addColorStop(0, `rgba(255,255,255,${0.45 * shine})`); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(X(V, P0.at[0] - 0.3), Y(V, P0.at[1] - 0.3), V.s * 0.6, V.s * 0.6);
    ctx.restore();
  };
  const guides = (ctx, V, t, c) => {
    if (gmode === 'off' && !(mode() === 'shell' && phase === 1)) return;
    ctx.save(); surfacePath(ctx, V); ctx.clip();
    const px = Math.max(2.5, V.s * 0.0055);
    if (mode() === 'shell' && phase === 1) { /* recesses are drawn by the world */ ctx.restore(); return; }
    prep.guides.forEach((g, i) => {
      const dn = (c?.cov?.[i] ?? 0) > 0.85 && !(mode() === 'wire' && phase === 2);
      centre(ctx, V, g.pts.map((p) => ({ x: p[0], y: p[1] })));
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = dn ? 0.2 : 1;
      ctx.setLineDash([px * 2.4, px * 1.6]); ctx.strokeStyle = mode() === 'shell' && phase === 0 ? 'rgba(90,40,120,0.9)' : 'rgba(255,214,110,0.95)'; ctx.lineWidth = px * 0.85; ctx.stroke(); ctx.restore();
    });
    ctx.restore();
  };

  const draw = (g, Rt, t) => {
    const { ctx, pal: PL } = g, W0 = Rt.work, lift = SC.wall ? wallLift(W0) * 0.35 : 0, m = mode();
    const Wk = { x: W0.x, y: W0.y + 56 + lift, w: W0.w, h: W0.h - 56 - lift - 4 };
    const extra = m === 'shell' ? Math.min(Wk.h * 0.22, 130) : 14;
    const f = fitBox({ x: Wk.x + 8, y: Wk.y + 2, w: Wk.w - 16, h: Wk.h - 4 }, extra);
    const V = { ox: f.ox, oy: f.oy, s: f.s };
    geo = { ox: V.ox, oy: V.oy, s: V.s, bw: V.s * D.ar };
    const cOv = compute();
    const kB = blacken >= 0 && m === 'wire' ? ease((now - blacken) / 1.6) : 0;
    const peenOf = (w) => { const mid = w.pts[w.pts.length >> 1], tg = grid(taps, 0.05); return hasNear(tg, 0.05, mid.x, mid.y, 0.06) ? 1 : 0; };
    const polishOf = (i) => { const cells = rubCells.filter((c) => c.piece === i); return cells.length ? cells.filter((c) => c.hit).length / cells.length : 0; };
    const o = { t: now, grooves, wires, taps, cuts, phase, blacken: kB, peen: peenOf, shine: (i) => (done ? 1 : phase >= 2 ? polishOf(i) : 0) };
    drawWorld(ctx, V, o);
    if (!done) guides(ctx, V, now, cOv);
    if (cur && !cur.rub) { // the live stroke
      const res = buildSamples(cur.raw, T(), 1, 1);
      if (res.pts.length) { ctx.save(); surfacePath(ctx, V); ctx.clip(); const rib = ribbon(res.pts); ribPath(ctx, V, rib); ctx.fillStyle = m === 'wire' ? (phase === 0 ? 'rgba(20,24,28,0.9)' : '#e6ecf1') : 'rgba(20,10,30,0.9)'; ctx.fill(); ctx.restore(); }
    }
    // loose pieces: tray and the piece in hand
    if (m === 'shell' && (phase <= 1 || drag)) {
      const N = Math.max(1, parts.filter((p) => p.cut || p.placed).length);
      ctx.save(); const tx = V.ox - 4, ty = Y(V, 1.045), tw = V.s * D.ar + 8, th = extra - 8;
      if (th > 20) { rrect(ctx, tx, ty, tw, th, 10); ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.stroke(); }
      ctx.restore();
      parts.forEach((p) => {
        if (!p.cut || p.placed) return;
        const base = partCentre({ ...p, pos: null }), liftK = clamp((now - p.liftAt) / 0.5, 0, 1);
        const home = D.pieces[p.i].at, pos0 = p.pos ?? [home[0] + (base[0] - home[0]) * ease(liftK), home[1] + (base[1] - home[1]) * ease(liftK)];
        const pos = pos0.slice(); pos.scale = p.pos ? 1 : 1 - 0.55 * ease(liftK);
        drawPiece(ctx, V, p.i, pos, now);
      });
    }
    // held tool and hammer
    const hand = auto?.hand ?? null, down = cur != null || drag != null;
    const tx = ptr ? ptr.x : hand ? V.ox + hand[0] * V.s : null, ty = ptr ? ptr.y : hand ? V.oy + hand[1] * V.s : null;
    if (!done && tx != null && (down || (hand && !ptr))) { if (HELD[m][phase]) drawTool(ctx, SC, HELD[m][phase], tx, ty, Math.max(110, V.s * 0.3), now); else { ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(tx, ty, Math.max(14, V.s * 0.028), 0, 6.3); ctx.fill(); ctx.stroke(); } }
    if (hammer && now - hammer.t < 0.2) { const k = (now - hammer.t) / 0.2; ctx.save(); ctx.translate(X(V, hammer.x), Y(V, hammer.y)); ctx.rotate(-0.9 + k * 0.7); drawTool(ctx, SC, 'mallet', 0, 0, Math.max(100, V.s * 0.26), 0); ctx.restore(); }
    // step caption
    { const tl = g.wrap(ctx, hint(), W0.w - 24, g.px(21)).slice(0, 2); tl.forEach((l, i) => g.label(ctx, l, W0.x + W0.w / 2, W0.y + 14 + g.px(24) * i, g.px(21), PL.ink, 'center', '600')); }
    // reference
    const th = Rt.thumb, ft = fitBox({ x: th.x + 6, y: th.y + 6, w: th.w - 12, h: th.h - 12 }, m === 'shell' ? 0 : 0), Vt = { ox: ft.ox, oy: ft.oy, s: ft.s };
    shelf(ctx, th.x + th.w / 2, th.y + th.h - 3, th.w * 0.36);
    const saveP = phase; phase = 2;
    drawWorld(ctx, Vt, { t: 99, grooves: [], wires: idealWires(), taps: [], cuts: [], phase: 2, blacken: m === 'wire' ? 1 : 0, peen: () => 1, shine: () => 1, ideal: true });
    if (m === 'shell') parts.forEach((p, i) => drawPiece(ctx, Vt, i, null, 99, 1));
    phase = saveP;
  };
  const idealWires = () => prep.guides.map((g) => { const pts = g.pts.map((p) => ({ x: p[0], y: p[1], w: 0.0085, d: 0 })); return { pts, rib: ribbon(pts) }; });
  const titleArt = (g, S, t) => {
    const { ctx } = g, f = fitBox({ x: S.x + S.w * 0.03, y: S.y + S.h * 0.03, w: S.w * 0.94, h: S.h * 0.94 }), V = { ox: f.ox, oy: f.oy, s: f.s }, m = mode();
    const saveP = phase; phase = 2;
    drawWorld(ctx, V, { t: 99 + (t ?? 0), grooves: [], wires: idealWires(), taps: [], cuts: [], phase: 2, blacken: m === 'wire' ? 1 : 0, peen: () => 1, shine: () => 0.6 + 0.4 * Math.sin((t ?? 0) * 2) ** 2 });
    if (m === 'shell') parts.forEach((p, i) => drawPiece(ctx, V, i, null, (t ?? 0) + 99, 0.6 + 0.4 * Math.sin((t ?? 0) * 2 + i) ** 2));
    phase = saveP;
  };

  const hint = () => {
    if (done) return '';
    const m = mode(), c = compute();
    if (m === 'wire') return ['Trace each lit line with the graver to cut a groove.', 'Drag along the grooves: the silver wire is pressed into them.', 'Tap along the wire to peen it flat with the hammer.'][phase];
    return ['Trace each outline with the fretsaw. A finished piece lifts away.', `Drag each piece from the tray to its recess (${parts.filter((p) => p.placed).length} of ${nCut()} set).`, 'Rub the cloth over the panel until the pearl shines.'][phase] + (phase === 0 && nCut() ? ` ${nCut()} of ${parts.length} cut.` : '') + (c ? '' : '');
  };
  const state = () => {
    const c = compute();
    return { technique: 'inlay', design: designId, mode: mode(), phase, phases: 3, strokes: grooves.length + wires.length + cuts.length, taps: taps.length, guides: prep.guides.map((g) => ({ n: g.pts.length })), cov: (c.cov ?? []).map((v) => Math.round(v * 100) / 100),
      parts: parts.map((p) => ({ cut: p.cut, placed: p.placed })), scores: c.s.map((v) => Math.round(v * 1000) / 1000), phaseScores: scores.map((v) => Math.round(v * 1000) / 1000), rubbed: rubCells ? Math.round((100 * rubCells.filter((q) => q.hit).length) / Math.max(1, rubCells.length)) : 0, black: blacken >= 0 };
  };

  init();
  return {
    init, items, control, work, tick, draw, attract, titleArt, result: () => done, score: total, hint,
    info: () => { const c = compute(); return [`Step ${phase + 1} of 3: ${STEPS[mode()][phase]}`, `${Math.round(c.s[phase] * 100)}% of this step`]; },
    get caption() { return SC.words?.caption ?? D.name; },
    rules: () => mode() === 'wire' ? [
      'Step 1: trace each lit line with the graver to cut a groove into the plate. Only grooves cut along the lines count.',
      'Step 2: drag along the grooves. The silver wire is pressed in and follows the groove, but only where one was cut.',
      'Step 3: tap along the wire with the hammer to peen it flat; every stretch of wire should be struck. Then the plate is blackened and only the silver shows.',
      'Score: the mean of the three steps. Doing nothing scores nothing.',
    ] : [
      'Step 1: trace each outline on the shell sheet with the fretsaw. When a piece is cut all round it lifts into the tray.',
      'Step 2: drag each piece from the tray to its own recess in the black lacquer; it snaps into place when it is close enough.',
      'Step 3: rub the cloth over the panel; the dull film clears and the pearl shows its colours.',
      'Score: the mean of the three steps. Doing nothing scores nothing.',
    ],
    point(id) {
      if (!geo) return null;
      const [k, rest] = id.split(':');
      if (k === 'g') { const [gi, f] = rest.split(',').map(Number), gd = prep.guides[gi]; if (!gd) return null; const q = gd.pts[Math.round(clamp(f, 0, 1) * (gd.pts.length - 1))]; return { x: geo.ox + q[0] * geo.s, y: geo.oy + q[1] * geo.s }; }
      if (k === 'piece') { const p = parts[Number(rest)]; if (!p) return null; const c = partCentre(p); return { x: geo.ox + c[0] * geo.s, y: geo.oy + c[1] * geo.s }; }
      if (k === 'recess') { const q = D.pieces[Number(rest)]?.at; return q ? { x: geo.ox + q[0] * geo.s, y: geo.oy + q[1] * geo.s } : null; }
      if (k === 'rub') { const q = rubPath(Number(rest)); return { x: geo.ox + q[0] * geo.s, y: geo.oy + q[1] * geo.s }; }
      return null;
    },
    state,
  };
}

registerTechnique('inlay', { make: (P, env) => createInlay(P, env), scene: 'bidri', mat: 'wire' });
void regionAt; void rgba; void tint; void mix; void shadowed; void inPoly;

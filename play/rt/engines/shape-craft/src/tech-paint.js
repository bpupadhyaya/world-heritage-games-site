// shape-craft technique `paint` (1.6.0): freehand brush work and region fill for folk painting, resist dyeing and wax-resist eggs.
//
// The player loads a tool (tap a colour to dip), draws smooth strokes whose width follows speed, lift and paint load, floods outlined regions
// (the paint stops at the outline) and, in resist designs, waxes then dips the cloth or egg in dye layer by layer. The reference is a figure
// table (src/paint-figures/*.js); the score measures stroke accuracy, fill coverage and, where the tradition calls for it, symmetry.
import { registerTechnique } from './registry.js';
import { starsFor } from './geom.js';
import { shadowed, rrect, shelf, rgba, tint, mix, lum, ease } from './fx.js';
import { drawTool, wallLift } from './scenes.js';
import { buildDesign, DESIGN_IDS } from './paint-figures/index.js';
import { createPaintSound } from './paint-sound.js';
import { hintPill, dockGauge, makeSurface } from './paint-ui.js';
import * as PR from './paint-render.js';
import { clamp, smooth01, dist, polyLen, toolOf, buildSamples, ribbon, symMaps, prepareLayer, resetCover, paintCells, fillCells, regionAt, scoreLayer } from './paint-stroke.js';

export const PAINT_DEFAULTS = { design: null, ground: null, pale: false, wash: false, variant: null, guideMode: 'trace', tolerance: 0.035, snap: true, assist: false, variation: 1, guide: true };
const GUIDE_MODES = ['trace', 'faint', 'off'];
const GUIDE_LABEL = { trace: 'Guide', faint: 'Faint', off: 'No guide' };
const MIN_STEP = 0.0035;

export function createPaint(P, env) {
  const { rng, fx } = env;
  const SC = P.scene ?? {};
  const designId = DESIGN_IDS.includes(P.design) ? P.design : DESIGN_IDS.includes(SC.id) ? SC.id : 'petrykivka';
  const sound = createPaintSound(env.audio, 'brush');
  let snd = sound;
  if (env.options?.soundLog) for (const k of Object.keys(sound)) { const f = sound[k]; sound[k] = (...a) => { env.options.soundLog.push({ kind: `paint.${k}` }); return f(...a); }; }
  const tol = P.tolerance ?? 0.035;

  let D, preps, ideal, idealAll, grounds, L, items, cur, colorSel, load, mode, gmode, assistOn, done, geo, ptr, group, layerScores, lastScore, now, dyeAnim, meltAt, glossAt, covS, covR, scoreCache, auto, flash, gildAt;
  let tool = 'brush', meltPending = false, thumbBake = null, round = 0;

  // 1.25.0: a design may override a tool's numbers (nib angle and length, ink use): D.tools = { nib: { edge, base, use } }
  const TFn = (name) => { const T = toolOf(name), o = D?.tools?.[name]; return o ? { ...T, ...o } : T; };
  const TF = () => TFn(tool);
  const markOf = (T) => (T.nib ? 'nib' : T.wedge ? 'wedge' : T.point ? 'point' : undefined);
  const layer = () => D.layers[L];
  const prep = () => preps[L];
  const pal = (i) => D.palette[i] ?? D.palette[0];
  const guideModeInit = P.guide === false ? 'off' : GUIDE_MODES.includes(P.guideMode) ? P.guideMode : 'trace';

  // ---- setup -------------------------------------------------------------------------------------------------------------------------------
  const buildIdeal = () => D.layers.map((lay, li) => {
    const T = TFn(lay.tool), mark = markOf(T), out = [];
    lay.regions.forEach((r, ri) => out.push({ kind: 'fill', layer: li, region: ri, col: r.col ?? lay.colors[0], at: preps[li].regions[ri].at, under: preps[li].regions[ri].under, born: -99 }));
    lay.strokes.forEach((g) => {
      const n = g.pts.length;
      if (mark === 'nib' || mark === 'wedge' || mark === 'point') {
        const w = mark === 'point' ? T.base : (T.len ?? T.base), q = mark === 'wedge' ? [g.pts[0], g.pts[n - 1]] : g.pts;
        const pts = q.map((p) => ({ x: p[0], y: p[1], w, d: 0 }));
        out.push({ kind: 'line', layer: li, col: g.col, tool: lay.tool, mark, edge: T.edge, pts, rib: ribbon(pts), born: -99, clip: -1, seed: li * 31 + out.length });
        return;
      }
      const pts = g.pts.map((p, i) => {
        let w = g.w;
        if (T.taper) w *= 0.55 + 0.45 * smooth01(i / 4) * (0.4 + 0.6 * smooth01((n - 1 - i) / 6));
        else if (T.blob && (i < 2 || i > n - 3)) w *= 1.25;
        return { x: p[0], y: p[1], w, d: 0 };
      });
      out.push({ kind: 'line', layer: li, col: g.col, tool: lay.tool, pts: n < 3 ? [{ ...pts[0], dab: true }] : pts, rib: ribbon(pts), born: -99, clip: -1, seed: li * 31 + out.length });
    });
    return out;
  });
  const startLayer = () => {
    const lay = layer();
    colorSel = lay.colors[0]; load = 1; tool = lay.tool; snd = createPaintSound(env.audio, tool);
    if (env.options?.soundLog) for (const k of Object.keys(snd)) { const f = snd[k]; snd[k] = (...a) => { env.options.soundLog.push({ kind: `paint.${k}` }); return f(...a); }; }
    if (!TF().nib && !TF().wedge && !TF().point) { /* freehand tools keep their old defaults */ }
    mode = lay.regions.length && !lay.strokes.length ? 'fill' : 'brush';
    resetCover(prep()); cur = null; scoreCache = null;
  };
  const init = () => {
    round++; thumbBake = null; bake = null;
    D = buildDesign(designId, rng, P.variation ?? 1, { ground: P.ground, pale: P.pale, wash: P.wash, variant: P.variant });
    preps = D.layers.map((lay) => prepareLayer(lay, D.symmetry, D.ar));
    grounds = [D.ground, ...D.layers.map((l) => l.resist?.dye).filter(Boolean)];
    ideal = buildIdeal(); idealAll = ideal.flat();
    L = 0; items = []; group = 0; layerScores = []; done = null; geo = null; ptr = null; dyeAnim = null; meltAt = -1; glossAt = -1; now = 0; flash = -9; meltPending = false; gildAt = -1;
    gmode = guideModeInit; assistOn = !!P.assist || !!D.assistDefault; covS = []; covR = []; lastScore = 0;
    startLayer();
    buildAuto();
  };

  // ---- strokes -------------------------------------------------------------------------------------------------------------------------------
  const scaleOf = () => D.scale ?? 1;
  const toLocal = (x, y) => [(x - geo.ox) / geo.s, (y - geo.oy) / geo.s];
  const hasPaint = () => load > 0.02;
  const lineSamples = (li) => {
    const out = [];
    for (const s of items) if (s.layer === li && s.kind === 'line') for (const p of s.pts) out.push({ x: p.x, y: p.y, col: s.col, free: s.clip < 0 });
    for (const s of items) if (s.layer === li && s.kind === 'line' && s.mark === 'wedge' && s.pts.length === 2) for (let k = 1; k < 8; k++) { const f = k / 8; out.push({ x: s.pts[0].x + (s.pts[1].x - s.pts[0].x) * f, y: s.pts[0].y + (s.pts[1].y - s.pts[0].y) * f, col: s.col, free: s.clip < 0 }); }   // a wedge is two points: fill in the dent
    return out;
  };
  const compute = (li = L) => {
    if (li === L && scoreCache) return scoreCache;
    const sc = scoreLayer(preps[li], lineSamples(li), tol);
    if (D.ordered) { const o = orderOf(li); sc.order = o; if (o != null) sc.score = Math.round(sc.score * (0.9 + 0.1 * o)); }
    if (li === L) { scoreCache = sc; covS = sc.strokeCov; covR = sc.regionCov; }
    return sc;
  };
  const rebuildCover = () => {
    resetCover(prep());
    for (const s of items) {
      if (s.layer !== L) continue;
      if (s.kind === 'fill') fillCells(prep(), s.region, s.col);
      else if (s.clip >= 0) for (const p of s.pts) paintCells(prep(), s.clip, p.x, p.y, Math.max(p.w * 0.75, 0.012), s.col);
    }
    scoreCache = null;
  };
  // 1.25.0 stroke order (designs with `ordered: true`): which guides a stroke newly covers, and how well the order in which they were first covered matches their numbers
  const newTouched = (pts) => {
    const seen = new Set(); for (const s of items) if (s.layer === L && s.touch) for (const g of s.touch) seen.add(g);
    const dabStroke = pts.length <= 2, out = [], sample = pts.filter((_, i) => i % 3 === 0 || i === pts.length - 1), r2 = (tol * 0.9) ** 2;
    for (const g of prep().guides) {
      if (seen.has(g.i) || (g.pts.length <= 1 && !dabStroke)) continue;
      let hit = 0; for (const q of g.pts) { for (const p of sample) { const dx = p.x - q[0], dy = p.y - q[1]; if (dx * dx + dy * dy <= r2) { hit++; break; } } }
      if (hit / Math.max(1, g.pts.length) >= 0.6) out.push(g.i);
    }
    return out;
  };
  const orderOf = (li) => {
    const seq = []; for (const s of items) if (s.layer === li && s.touch) for (const g of s.touch) seq.push(g);
    if (seq.length < 2) return seq.length ? 1 : null;
    let inv = 0, pairs = 0; for (let i = 0; i < seq.length; i++) for (let j = i + 1; j < seq.length; j++) { pairs++; if (seq[i] > seq[j]) inv++; }
    return 1 - inv / pairs;
  };
  const begin = (u, v) => {
    if (done || dyeAnim) return;
    const lay = layer();
    if (mode === 'fill') {
      const ri = regionAt(prep(), u, v, 0.03);
      if (ri >= 0) {
        items.push({ kind: 'fill', layer: L, region: ri, col: colorSel, at: [u, v], under: prep().regions[ri].under, born: now, group: ++group });
        fillCells(prep(), ri, colorSel); scoreCache = null;
        snd.wash();
        const r = prep().regions[ri], b = r.box;
        if (geo) fx.emit('dust', geo.ox + u * geo.s, geo.oy + v * geo.s, { count: 5, color: pal(colorSel).color, size: geo.s * 0.012, speed: 50, life: 0.5, gravity: 0 });
        void b;
      } else snd.mode();
      return;
    }
    let clip = -1;
    if (lay.regions.length && P.snap !== false) clip = regionAt(prep(), u, v, 0.02);
    cur = { raw: [{ x: u, y: v, t: now }], col: colorSel, load0: load, clip, len: 0, spd: 0, t0: now };
    snd.down();
  };
  const liveSamples = () => buildSamples(cur.raw, TF(), cur.load0, scaleOf());
  const move = (u, v) => {
    if (!cur) return;
    const a = cur.raw[cur.raw.length - 1];
    const d = Math.hypot(u - a.x, v - a.y);
    if (d < MIN_STEP) return;
    cur.raw.push({ x: u, y: v, t: now });
    cur.len += d;
    const dt = Math.max(1 / 120, now - a.t);
    snd.stroke(d, d / dt, cur.load0 - TF().use * cur.len);
  };
  const imageStrokes = (res, st) => {
    if (!assistOn || st.clip >= 0 || D.symmetry.kind === 'none') return [res.pts];
    const maps = symMaps(D.symmetry, D.ar), outs = [];
    for (const f of maps) outs.push(res.pts.map((p) => { const q = f([p.x, p.y]); return { ...p, x: q[0], y: q[1] }; }));
    return outs;
  };
  const end = () => {
    if (!cur) return;
    const st = cur; cur = null;
    const res = buildSamples(st.raw, TF(), st.load0, scaleOf());
    load = clamp(res.loadEnd, 0, 1);
    if (!res.pts.length) { flash = now; return; }
    const gid = ++group, before = scoreCache ? covS.slice() : null;
    for (const pts of imageStrokes(res, st)) {
      const it = { kind: 'line', layer: L, col: st.col, tool, mark: markOf(TF()), edge: TF().edge, pts, rib: ribbon(pts), born: now, clip: st.clip, seed: gid * 7 + items.length, group: gid };
      if (D.ordered) it.touch = newTouched(pts);
      items.push(it);
      if (st.clip >= 0) for (const p of pts) paintCells(prep(), st.clip, p.x, p.y, Math.max(p.w * 0.75, 0.012), st.col);
    }
    scoreCache = null; compute();
    snd.up();
    if (res.pts[0].dab) snd.dab();
    // a small sparkle on each guide this stroke completed
    prep().guides.forEach((g, i) => { if ((covS[i] ?? 0) > 0.85 && (before?.[i] ?? 0) <= 0.85 && geo) { const m = g.pts[g.pts.length >> 1]; fx.emit('spark', geo.ox + m[0] * geo.s, geo.oy + m[1] * geo.s, { count: 3, color: '#fff4c8', size: 6, speed: 60, life: 0.45, gravity: 40 }); } });
  };
  const undo = () => {
    for (let i = items.length - 1; i >= 0; i--) if (items[i].layer === L) { const g = items[i].group; while (items.length && items[items.length - 1].group === g && items[items.length - 1].layer === L) items.pop(); break; }
    rebuildCover(); compute(); snd.undo();
  };

  // ---- layers and result -------------------------------------------------------------------------------------------------------------------
  const total = () => {
    const live = layer().gild ? 100 : compute().score;
    const s = layerScores.reduce((a, b) => a + b, 0) + (done ? 0 : live);
    return Math.round(s / D.layers.length);
  };
  const finish = () => {
    const sc = compute();
    layerScores.push(layer().gild ? 100 : sc.score);
    const score = Math.round(layerScores.reduce((a, b) => a + b, 0) / D.layers.length), stars = starsFor(score), W = SC.words ?? {};
    const parts = [sc.line != null ? `Line work ${Math.round(sc.line * 100)} percent` : null, sc.order != null ? `Stroke order ${Math.round(sc.order * 100)} percent` : null, sc.fill != null ? `Fill ${Math.round(sc.fill * 100)} percent` : null, sc.sym != null ? `Symmetry ${Math.round(sc.sym * 100)} percent` : null].filter(Boolean);
    done = { score, max: 100, stars, headline: stars === 3 ? (W.win ?? 'Worthy of the workshop wall') : stars ? (W.ok ?? 'A good piece') : (W.retry ?? 'Keep practising'), detail: parts.join(', ') };
    const lastResist = layer().resist;
    if (lastResist) { dyeAnim = { t0: now, from: grounds[L], to: grounds[L + 1], layer: L }; snd.dye(); }
    meltAt = D.layers.some((l) => l.resist) ? now + (lastResist ? 1.3 : 0) : -1;
    if (D.finish === 'gloss' || D.finish === 'soot') glossAt = now;
    cur = null;
    if (meltAt >= 0) setTimeoutless(); else if (glossAt >= 0) snd.gloss();
    snd.win(stars);
    fx.emit('spark', geo ? geo.ox + geo.bw / 2 : 0, geo ? geo.oy + geo.s * 0.5 : 0, { count: 14, color: '#fff4c8', size: 8, speed: 160, life: 0.8, gravity: 80 });
  };
  const setTimeoutless = () => { meltPending = true; };
  const advance = () => {
    if (done || dyeAnim) return;
    if (L >= D.layers.length - 1) { finish(); return; }
    const lay = layer(), sc = compute();
    layerScores.push(lay.gild ? 100 : sc.score);
    if (lay.gild) { gildAt = now; snd.gild(); }
    if (lay.resist) { dyeAnim = { t0: now, from: grounds[L], to: grounds[L + 1], layer: L }; snd.dye(); } else snd.mode();
    L++; startLayer();
    covS = []; covR = []; scoreCache = null; compute();
  };

  // ---- controls ---------------------------------------------------------------------------------------------------------------------------------
  const items_ = () => {
    const lay = layer(), out = [];
    if (lay.gild) return [{ id: 'check', kind: 'btn', label: 'Gild', primary: true }];   // 1.25.0: the leaf is laid by the gilder's hand: one press
    if (TFn(lay.tool).noDip) { /* a stylus or point carries no ink: no dip button */ }
    else if (lay.colors.length > 1) lay.colors.forEach((c) => out.push({ id: `color:${c}`, kind: 'swatch', color: pal(c).color, on: colorSel === c, name: pal(c).name }));
    else out.push({ id: `color:${lay.colors[0]}`, kind: 'btn', label: lay.resist ? 'Dip wax' : 'Dip' });
    if (lay.regions.length && lay.strokes.length) out.push({ id: 'mode', kind: 'btn', label: mode === 'fill' ? 'Fill' : 'Brush' });
    if (D.symmetry.kind !== 'none' && lay.strokes.length) out.push({ id: 'sym', kind: 'btn', label: assistOn ? 'Mirror on' : 'Mirror' });
    out.push({ id: 'guide', kind: 'btn', label: GUIDE_LABEL[gmode] });
    out.push({ id: 'undo', kind: 'btn', label: 'Undo', off: !items.some((s) => s.layer === L) });
    const last = L >= D.layers.length - 1;
    out.push({ id: 'check', kind: 'btn', label: last ? (D.finish === 'soot' ? 'Rub soot' : 'Check') : lay.resist ? 'Dye' : 'Next', primary: true });
    return out;
  };
  const control = (id) => {
    if (done) return;
    const [k, rest] = id.split(':');
    if (k === 'color') { const c = Number(rest); colorSel = c; load = 1; snd.dip(); flash = -9; if (geo) fx.emit('drop', geo.ox + geo.bw / 2, geo.oy - 4, { count: 3, color: pal(c).color, size: 5, speed: 40, life: 0.5, gravity: 300, angle: Math.PI / 2, spread: 1 }); }
    else if (k === 'mode') { mode = mode === 'fill' ? 'brush' : 'fill'; snd.mode(); }
    else if (k === 'sym') { assistOn = !assistOn; snd.mode(); }
    else if (k === 'guide') { gmode = GUIDE_MODES[(GUIDE_MODES.indexOf(gmode) + 1) % GUIDE_MODES.length]; snd.mode(); }
    else if (k === 'undo') undo();
    else if (k === 'check') advance();
  };

  // ---- human input -------------------------------------------------------------------------------------------------------------------------------
  const work = (p) => {
    if (!geo || done) return;
    ptr = { x: p.x, y: p.y };
    if (p.pressed && !dyeAnim) {
      const [u, v] = toLocal(p.x, p.y);
      if (u >= -0.03 && u <= D.ar + 0.03 && v >= -0.03 && v <= 1.03) begin(u, v);
    }
    if (cur && (p.down || p.pressed)) { const [u, v] = toLocal(p.x, p.y); move(u, v); }
    if (cur && (p.released || !p.down)) end();
  };
  const tick = (dt) => {
    now += dt;
    if (D.gild && gildAt >= 0 && geo && now - gildAt < (D.ar + 0.4) / 1.1) { const sx = geo.ox + (((now - gildAt) * 1.1 - 0.12)) * geo.s; for (let k = 0; k < 2; k++) fx.emit('spark', sx, geo.oy + geo.s * (0.1 + 0.8 * (((now * 977 + k * 331) % 100) / 100)), { count: 1, color: '#fff2b8', size: 5, speed: 50, life: 0.5, gravity: 30 }); }
    if (dyeAnim && now - dyeAnim.t0 > 1.3) dyeAnim = null;
    if (meltPending && now >= meltAt) { meltPending = false; snd.melt(); }
  };

  // ---- attract mode (Watch and learn): a hand that paints every guide through the same stroke pipeline ----------------------------------
  function buildAuto() {
    const q = [];
    D.layers.forEach((lay, li) => {
      const pr = preps[li];
      pr.guides.forEach((g) => { if (!TFn(lay.tool).noDip) q.push({ t: 'dip', col: g.col ?? lay.colors[0] }); q.push({ t: 'stroke', li, g }); });
      if (pr.regions.length) {
        if (lay.strokes.length) q.push({ t: 'mode', m: 'fill' });
        pr.regions.forEach((r) => { q.push({ t: 'dip', col: r.col ?? lay.colors[0] }); q.push({ t: 'fill', li, r }); });
      }
      q.push({ t: 'next' });
    });
    const totalLen = preps.reduce((a, p) => a + p.total, 0), count = q.length;
    auto = { q, i: 0, wait: 0.2, st: null, speed: Math.max(0.9, totalLen / 22), fin: false, ws: Math.min(1, 16 / Math.max(1, count * 0.4)) };
  }
  const attract = (dt) => {
    if (done) return;
    if (dyeAnim) return;
    if (auto.wait > 0) { auto.wait -= dt; return; }
    if (auto.st) {
      const s = auto.st, step = auto.speed * dt;
      s.pos = Math.min(s.len, s.pos + step);
      const q = pointAt(s.g.pts, s.pos);
      const jx = (((s.k = (s.k ?? 0) + 1) * 2654435761) % 1000) / 1000 - 0.5;
      move(q[0] + jx * 0.0025, q[1] + jx * 0.0018);
      auto.hand = q;
      if (s.pos >= s.len) { end(); auto.st = null; auto.wait = 0.12 * auto.ws; }
      return;
    }
    const a = auto.q[auto.i];
    if (!a) { if (!auto.fin) { auto.fin = true; } return; }
    auto.i++;
    if (a.t === 'dip') { control(`color:${a.col}`); auto.wait = 0.22 * auto.ws; }
    else if (a.t === 'mode') { if (L === a.li || true) mode = a.m; auto.wait = 0.1; }
    else if (a.t === 'stroke') {
      const g = a.g; if (mode !== 'brush') mode = 'brush';
      begin(g.pts[0][0], g.pts[0][1]);
      auto.st = { g, pos: 0, len: polyLen(g.pts), k: 0 };
      auto.hand = g.pts[0];
    } else if (a.t === 'fill') { mode = 'fill'; begin(a.r.at[0], a.r.at[1]); auto.hand = a.r.at; auto.wait = 0.55 * Math.max(0.22, auto.ws); }
    else if (a.t === 'next') { advance(); auto.wait = dyeAnim ? 1.4 : 0.5; mode = layer()?.regions.length && !layer().strokes.length ? 'fill' : 'brush'; }
  };
  function pointAt(pts, s) {
    let acc = 0;
    for (let i = 1; i < pts.length; i++) { const d = dist(pts[i - 1], pts[i]); if (acc + d >= s) { const t = d ? (s - acc) / d : 0; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]; } acc += d; }
    return pts[pts.length - 1];
  }

  // ---- drawing ------------------------------------------------------------------------------------------------------------------------------------
  const colorOf = (i) => pal(i).color;
  // 1.25.0 finish 'soot' (palm-leaf incision): the scratches stay pale until the soot is rubbed in; o.soot 0..1 is how far the rubbing cloth has travelled.
  const sootFor = (s, o) => { if (D.finish !== 'soot' || s.mark !== 'point') return 0; if (o.final) return 1; const g = o.soot ?? 0; if (g <= 0) return 0; return clamp((g * (D.ar + 0.3) - 0.15 - s.pts[0].x) / 0.15, 0, 1); };
  // 1.25.0 gilding: size (palette entries with `bole: true`) turns to gold leaf in a sweep from left to right once the gild step is taken (D.gild: true).
  const gildK = (s, o) => { if (!D.gild || !pal(s.col).bole) return 0; if (o.final) return 1; if (gildAt < 0) return 0; const cx = s.kind === 'fill' ? s.at[0] : s.pts[0].x; return clamp(((o.t - gildAt) * 1.1 - cx / D.ar) / 0.25, 0, 1); };
  // One call paints a finished or growing piece: surface, dye, region bases, pigment in order, fruit lighting, light. `list` = items to show.
  const piece = (ctx, V, list, o) => {
    const t = o.t, finalResist = o.melt >= 1 || o.final;
    let gi = o.groundIdx ?? 0;
    PR.drawSurface(ctx, D, V, D.ground, t);
    ctx.save(); PR.surfacePath(ctx, D, V); ctx.clip();
    // dye over the cloth (multiplied so the weave still shows)
    const tintOver = (c, a) => { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = rgba(c, a); ctx.fillRect(V.ox - 2, V.oy - 2, D.ar * V.s + 4, V.s + 4); ctx.restore(); ctx.fillStyle = rgba(c, 0.18); ctx.fillRect(V.ox - 2, V.oy - 2, D.ar * V.s + 4, V.s + 4); };
    if (gi > 0 && !o.dye) tintOver(grounds[gi], 0.92);
    if (o.dye) {
      const p = ease((t - o.dye.t0) / 1.1), y1 = V.oy + V.s * (1 - p);
      if (grounds.indexOf(o.dye.from) > 0) tintOver(o.dye.from, 0.92);
      ctx.save(); ctx.beginPath(); ctx.rect(V.ox - 2, y1, D.ar * V.s + 4, V.s + 4 - (y1 - V.oy) + 2); ctx.clip(); tintOver(o.dye.to, 0.92); ctx.restore();
      ctx.strokeStyle = rgba(tint(o.dye.to, 0.5), 0.6 * (1 - p)); ctx.lineWidth = 3; ctx.beginPath(); for (let x = 0; x <= 24; x++) { const xx = V.ox + (x / 24) * D.ar * V.s, yy = y1 + Math.sin(x * 0.9 + t * 6) * 3; if (x) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); } ctx.stroke();
    }
    const maxL = Math.max(0, ...list.map((s) => s.layer));
    for (let li = 0; li <= Math.max(maxL, o.L ?? 0); li++) preps[li].regions.forEach((r, ri) => { if (r.base) PR.drawRegionBase(ctx, V, preps[li], ri); });
    const order = finalResist && D.layers.some((l) => l.resist) ? list.slice().sort((a, b) => b.layer - a.layer) : D.fillsUnder ? [...list.filter((q) => q.kind === 'fill' && q.under), ...list.filter((q) => q.kind === 'fill' && !q.under), ...list.filter((q) => q.kind !== 'fill')] : list;
    for (const s of order) {
      const lay = D.layers[s.layer];
      const gk = gildK(s, o);
      if (s.kind === 'fill') { const c = pal(s.col); if (gk > 0) { PR.drawRegionFill(ctx, V, preps[s.layer], s, { color: mix(c.color, D.gold ?? '#dcab32', gk), foil: gk > 0.5, t, cell: D.cell }); continue; } PR.drawRegionFill(ctx, V, preps[s.layer], s, { color: c.color, metal: c.metal, foil: c.foil, wire: c.wire, twist: c.twist, enamel: c.enamel, bead: c.bead, cell: D.cell, t, dye: D.fill === 'dye' }); continue; }
      const c = pal(s.col), wax = !!lay.resist;
      const reveal = grounds[s.layer];
      if (gk > 0) { PR.drawStroke(ctx, V, s, { color: mix(c.color, D.gold ?? '#dcab32', gk), metal: gk > 0.5, flat: gk <= 0.5, bleed: 0, t, wax: false, melt: 0, reveal: '#fff' }); continue; }
      PR.drawStroke(ctx, V, s, { color: c.color, metal: c.metal, wire: c.wire, twist: c.twist, enamel: c.enamel, bead: c.bead, cell: D.cell, flat: c.flat, bleed: PR.bleedOf(D), t, wax, melt: o.melt, reveal: finalResist ? reveal : reveal, rough: s.tool === 'stick', soot: sootFor(s, o), sootColor: c.soot });
    }
    for (let li = 0; li <= Math.max(maxL, o.L ?? 0); li++) preps[li].regions.forEach((r, ri) => { if (r.volume) PR.drawVolume(ctx, V, preps[li], ri, o.gloss); });
    ctx.restore();
    PR.drawLight(ctx, D, V, t);
  };

  // ---- off-screen bake of the settled work (1.8.0) ----------------------------------------------------------------------------------------
  // Busy designs hold a hundred or more strokes and fills; redrawing them all 60 times a second is wasteful once their paint has dried. Designs
  // without wax/dye layers keep the surface, the region bases and every item older than the wet time in one off-screen canvas, appended to as
  // items dry; only the wet items, the volume lighting and the light are drawn live. Where OffscreenCanvas is missing the old full draw is used.
  const WET = 3.1;
  let bake = null;
  const canBake = () => !dyeAnim && !D.layers.some((l) => l.resist) && !(done && meltAt >= 0) && !(done && D.finish === 'soot') && !D.gild && !D.fillsUnder;
  const drawItem = (ctx, V, s, t) => {
    const lay = D.layers[s.layer], c = pal(s.col);
    if (s.kind === 'fill') { PR.drawRegionFill(ctx, V, preps[s.layer], s, { color: c.color, metal: c.metal, foil: c.foil, wire: c.wire, twist: c.twist, enamel: c.enamel, bead: c.bead, cell: D.cell, t, dye: D.fill === 'dye' }); return; }
    PR.drawStroke(ctx, V, s, { color: c.color, metal: c.metal, wire: c.wire, twist: c.twist, enamel: c.enamel, bead: c.bead, cell: D.cell, flat: c.flat, bleed: PR.bleedOf(D), t, wax: !!lay.resist, melt: 0, reveal: grounds[s.layer], rough: s.tool === 'stick' });
  };
  const fastPiece = (ctx, V, gloss) => {
    const pad = Math.ceil(V.s * 0.12), cw = Math.ceil(V.s * D.ar + pad * 2), ch = Math.ceil(V.s + pad * 2), key = `${round}|${Math.round(V.s)}|${L}`;
    const Vl = { ox: pad, oy: pad, s: V.s };
    try {
      if (!bake || bake.key !== key || bake.n > items.length || (bake.n && items[bake.n - 1] !== bake.last)) {
        const sf = makeSurface(ctx, cw, ch); if (!sf) throw new Error('no surface');
        const oc = sf.canvas, bx = sf.ctx;
        PR.drawSurface(bx, D, Vl, D.ground, now);
        bx.save(); PR.surfacePath(bx, D, Vl); bx.clip();
        for (let li = 0; li <= L; li++) preps[li].regions.forEach((r, ri) => { if (r.base) PR.drawRegionBase(bx, Vl, preps[li], ri); });
        bx.restore();
        bake = { key, oc, bx, n: 0, last: null };
      }
      let upto = bake.n;
      while (upto < items.length && now - items[upto].born > WET) upto++;
      if (upto > bake.n) {
        bake.bx.save(); PR.surfacePath(bake.bx, D, Vl); bake.bx.clip();
        for (let i = bake.n; i < upto; i++) drawItem(bake.bx, Vl, items[i], now);
        bake.bx.restore(); bake.n = upto; bake.last = items[upto - 1];
      }
    } catch { bake = null; return false; }
    ctx.drawImage(bake.oc, V.ox - pad, V.oy - pad);
    ctx.save(); PR.surfacePath(ctx, D, V); ctx.clip();
    for (let i = bake.n; i < items.length; i++) drawItem(ctx, V, items[i], now);
    for (let li = 0; li <= L; li++) preps[li].regions.forEach((r, ri) => { if (r.volume) PR.drawVolume(ctx, V, preps[li], ri, gloss); });
    ctx.restore();
    PR.drawLight(ctx, D, V, now);
    return true;
  };

  const fitBox = (R, topPad = 0) => {
    const s = Math.min(R.h - topPad, R.w / D.ar);
    return { s, ox: R.x + (R.w - s * D.ar) / 2, oy: R.y + topPad + (R.h - topPad - s) / 2 };
  };

  const draw = (g, Rt, t) => {
    const { ctx, pal: PL } = g;
    const W0 = Rt.work, lift = SC.wall ? wallLift(W0) * 0.1 : 0;
    const Wk = { x: W0.x, y: W0.y + 38 + lift, w: W0.w, h: W0.h - 38 - lift - 2 };
    const f = fitBox({ x: Wk.x + 6, y: Wk.y + 2, w: Wk.w - 12, h: Wk.h - 4 });
    const V = { ox: f.ox, oy: f.oy, s: f.s };
    geo = { ox: V.ox, oy: V.oy, s: V.s, bw: V.s * D.ar };
    const finalLook = done && meltAt >= 0;
    const melt = finalLook ? clamp((now - meltAt - 0.2) / 1.6, 0, 1) : 0;
    const list = items.slice();
    const lastDyed = grounds.length > 1 ? Math.min(L, grounds.length - 1) : 0;
    const dyeNow = dyeAnim ? { ...dyeAnim } : null;
    const gl = glossAt >= 0 ? clamp((now - glossAt) / 1.8, 0, 1.6) : 0;
    if (!(canBake() && fastPiece(ctx, V, gl))) piece(ctx, V, list, { t: now, L, groundIdx: dyeNow ? 0 : done ? grounds.length - 1 : lastDyed, dye: dyeNow ? { ...dyeNow, from: grounds[dyeNow.layer], to: grounds[dyeNow.layer + 1], t0: dyeNow.t0 } : null, melt, final: finalLook && melt >= 1, gloss: glossAt >= 0 ? clamp((now - glossAt) / 1.8, 0, 1.6) : 0, soot: D.finish === 'soot' && glossAt >= 0 ? clamp((now - glossAt) / 2.2, 0, 1) : 0 });
    if (D.finish === 'soot' && glossAt >= 0) { const g = clamp((now - glossAt) / 2.2, 0, 1); if (g > 0 && g < 1) { const bx = V.ox + (g * (D.ar + 0.3) - 0.15) * V.s, bw = 0.2 * V.s, gr = ctx.createLinearGradient(bx - bw, 0, bx + bw * 0.2, 0); gr.addColorStop(0, 'rgba(20,12,4,0)'); gr.addColorStop(1, 'rgba(20,12,4,0.5)'); ctx.save(); PR.surfacePath(ctx, D, V); ctx.clip(); ctx.fillStyle = gr; ctx.fillRect(bx - bw, V.oy, bw * 1.2, V.s); ctx.restore(); } }
    // live stroke
    ctx.save(); PR.surfacePath(ctx, D, V); ctx.clip();
    if (cur && hasPaint()) {
      const res = liveSamples();
      if (res.pts.length) {
        const c = pal(cur.col), s = { pts: res.pts, rib: ribbon(res.pts), tool, mark: markOf(TF()), edge: TF().edge, born: cur.t0, seed: 5 };
        if (cur.clip >= 0) { PR.regionClip(ctx, V, prep(), cur.clip); ctx.clip('evenodd'); }
        PR.drawStroke(ctx, V, s, { color: c.color, metal: c.metal, wire: c.wire, twist: c.twist, enamel: c.enamel, bead: c.bead, cell: D.cell, flat: c.flat, bleed: PR.bleedOf(D), t: now, wax: !!layer().resist, melt: 0, reveal: '#fff', rough: tool === 'stick' });
      }
    }
    ctx.restore();
    // guides
    if (!done) {
      let nS = -1, nR = -1;
      prep().guides.forEach((gd, i) => { if (nS < 0 && (covS[i] ?? 0) < 0.82) nS = i; });
      prep().regions.forEach((r, i) => { if (nR < 0 && (covR[i] ?? 0) < 0.82) nR = i; });
      if (layer().strokes.length) nR = -1;
      ctx.save(); PR.surfacePath(ctx, D, V); ctx.clip();
      PR.drawGuides(ctx, V, prep(), gmode, covS, covR, nS, nR, now, undefined, !!D.numbered);
      ctx.restore();
    }
    // the tool in hand, a ghost of the next start otherwise
    const hand = auto?.hand ?? null;
    const down = cur != null;
    const tipX = hand && !ptr ? V.ox + hand[0] * V.s : ptr ? ptr.x : null, tipY = hand && !ptr ? V.oy + hand[1] * V.s : ptr ? ptr.y : null;
    if ((down || (hand && !ptr)) && tipX != null && !done) {
      const T = TF();
      drawTool(ctx, SC, T.held, tipX, tipY, Math.max(110, V.s * 0.32), now, { c: colorOf(cur?.col ?? colorSel) });
    }
    // ONE palette display (1.8.0): the colour in hand and what is left on the tool, set into the dock between the tools
    if (!TF().noDip) { const shown = cur ? clamp(cur.load0 - TF().use * cur.len, 0, 1) : load, lowPulse = shown < 0.2 ? 0.5 + 0.5 * Math.sin(now * 9) : 1, col = colorOf(cur?.col ?? colorSel);
      dockGauge(g, ctx, W0, { dot: col, warn: shown < 0.2 ? 'Dip again' : null, fill: (x, y, w, h) => { if (shown > 0.005) { rrect(ctx, x + 1, y + 1, Math.max(8, (w - 2) * shown), h - 2, 4); ctx.fillStyle = rgba(col, lowPulse); ctx.fill(); } } }); }
    hintPill(g, ctx, W0, tipLine());
    // reference
    const th = Rt.thumb, ft = fitBox({ x: th.x + 6, y: th.y + 6, w: th.w - 12, h: th.h - 12 });
    const Vt = { ox: ft.ox, oy: ft.oy, s: ft.s };
    shelf(ctx, th.x + th.w / 2, th.y + th.h - 3, th.w * 0.36);
    const o = { t: 99, L: D.layers.length - 1, groundIdx: grounds.length - 1, melt: 1, final: true, gloss: D.finish === 'gloss' ? 1.5 : 0, soot: 1 };
    // The reference never changes during a round: bake it once into an off-screen canvas (1.8.0) and blit it, where the platform has one.
    const pad = Math.ceil(Vt.s * 0.12), cw = Math.ceil(Vt.s * D.ar + pad * 2), ch = Math.ceil(Vt.s + pad * 2), key = `${round}|${Math.round(Vt.s)}`;
    if (!thumbBake || thumbBake.key !== key) {
      const sf = makeSurface(ctx, cw, ch);
      if (sf) piece(sf.ctx, { ox: pad, oy: pad, s: Vt.s }, idealAll, o);
      thumbBake = { key, sf };
    }
    if (thumbBake.sf) { ctx.drawImage(thumbBake.sf.canvas, Vt.ox - pad, Vt.oy - pad); return; }
    piece(ctx, Vt, idealAll, o);
  };
  const tipLine = () => (done ? '' : SC.words?.hint && layer().hint == null ? SC.words.hint : layer().hint ?? SC.words?.hint ?? '');

  // The finished piece on its surface, slightly larger than the frame, with a slow wax-melt or gloss shimmer; never an empty board on the title screen.
  const titleArt = (g, S, t) => {
    const { ctx } = g, tt = t ?? 0;
    const f = fitBox({ x: S.x + S.w * 0.03, y: S.y + S.h * 0.03, w: S.w * 0.94, h: S.h * 0.94 }), V = { ox: f.ox, oy: f.oy, s: f.s };
    piece(ctx, V, idealAll, { t: 99 + tt, L: D.layers.length - 1, groundIdx: grounds.length - 1, melt: 1, final: true, gloss: D.finish === 'gloss' ? 0.6 + (tt * 0.5) % 1.4 : 0 });
  };

  // ---- information and state ---------------------------------------------------------------------------------------------------------------
  const hint = () => {
    if (done) return '';
    if (!hasPaint() && mode !== 'fill') return 'The brush is dry: tap a colour to dip it.';
    const lay = layer(), pr = prep();
    if (lay.gild) return lay.hint ?? 'Press Gild to lay the gold leaf.';
    if (lay.strokes.length) { const i = pr.guides.findIndex((_, k) => (covS[k] ?? 0) < 0.82); if (i >= 0) { const gd = pr.guides[i]; return colorSel !== (gd.col ?? colorSel) ? `Dip ${pal(gd.col).name}, then trace the lit line from the dot.` : 'Trace the lit line, starting at the white dot.'; } }
    if (lay.regions.length) { const i = pr.regions.findIndex((_, k) => (covR[k] ?? 0) < 0.82); if (i >= 0) { const r = pr.regions[i]; return `Fill the ${r.label || 'shape'} with ${pal(r.col ?? colorSel).name}${mode === 'fill' ? '' : ' (switch to Fill, or brush inside it)'}.`; } }
    return L >= D.layers.length - 1 ? 'Everything is painted: press Check.' : `This step is complete: press ${lay.resist ? 'Dye' : 'Next'}.`;
  };
  const state = () => ({
    technique: 'paint', design: designId, layer: L, layers: D.layers.length, tool, mode, color: colorSel, load: Math.round(load * 100) / 100, strokes: items.length, assist: assistOn, guide: gmode,
    guides: prep().guides.map((g) => ({ n: g.pts.length, col: g.col })), regions: prep().regions.map((r) => ({ col: r.col, n: r.cells.length })),
    todoS: prep().guides.map((_, k) => k).filter((k) => (covS[k] ?? 0) < 0.8), todoR: prep().regions.map((_, k) => k).filter((k) => (covR[k] ?? 0) < 0.8),
    parts: (() => { const c = compute(); return { line: c.line == null ? null : Math.round(c.line * 1000) / 1000, fill: c.fill == null ? null : Math.round(c.fill * 1000) / 1000, sym: c.sym == null ? null : Math.round(c.sym * 1000) / 1000, stray: Math.round(c.stray * 1000) / 1000 }; })(),
    layerScores: layerScores.slice(), dye: !!dyeAnim,
  });

  init();
  return {
    init, items: items_, control, work, tick, draw, attract, titleArt, result: () => done, score: total, hint,
    info: () => { const c = compute(); return [`Step ${L + 1} of ${D.layers.length}: ${layer().name}`, [c.line != null ? `Lines ${Math.round(c.line * 100)}%` : null, c.order != null && c.line > 0.2 ? `Order ${Math.round(c.order * 100)}%` : null, c.fill != null ? `Fill ${Math.round(c.fill * 100)}%` : null, c.sym != null && c.line > 0.3 ? `Symmetry ${Math.round(c.sym * 100)}%` : null].filter(Boolean).join('  ')]; },
    get caption() { return SC.words?.caption ?? `Paint this ${D.name.toLowerCase()}`; },
    rules: () => D.rules ?? [
      'Tap a colour to dip the tool in it. Press and drag to paint: a slow, steady pull lays a fat line, a quick one a thin line, and the line thins and breaks up as the paint runs out. Dip again to reload.',
      'Where a step has outlined shapes, switch to Fill and tap a shape (or brush inside it): the paint spreads to the outline and stops there.',
      'The lit lines and outlines are your guide; Guide cycles bright, faint and none. The framed picture shows the finished piece.',
      'In wax-resist work, wax keeps the cloth or egg pale wherever it lands; press Dye to dip it in the next colour, then wax again. The wax melts away at the end to show every layer.',
      'Score: how closely your lines follow the guide in the right colour, how much of each shape holds the right colour, how evenly both halves are painted where the design is symmetric, and a penalty for stray paint. Doing nothing scores nothing.',
    ],
    point(id) {
      if (!geo) return null;
      const [k, rest] = id.split(':');
      if (k === 'g') { const [gi, f] = rest.split(',').map(Number), gd = prep().guides[gi]; if (!gd) return null; const q = gd.pts[Math.round(clamp(f, 0, 1) * (gd.pts.length - 1))]; return { x: geo.ox + q[0] * geo.s, y: geo.oy + q[1] * geo.s }; }
      if (k === 'r') { const r = prep().regions[Number(rest)]; return r ? { x: geo.ox + r.at[0] * geo.s, y: geo.oy + r.at[1] * geo.s } : null; }
      return null;
    },
    state,
    get design() { return D; },
  };
}

registerTechnique('paint', { make: (P, env) => createPaint({ ...PAINT_DEFAULTS, ...P }, env), scene: 'petrykivka', mat: 'clay' });

// shape-craft 1.26.0 technique `sweet-nerikiri`: nerikiri wagashi, a seasonal flower sculpted from coloured white-bean-paste dough.
//
// Six short steps on a lacquer tray (five for the chrysanthemum): TINT the plain dough by choosing a colour and tapping each layer; WRAP the ball of
// sweet bean filling by drawing each flap of dough in from the rim with the bamboo spatula; PRESS the petal lines with the triangle stick (a slow,
// steady press cuts a clean groove, a fast one only scratches); SCRAPE the veins with the three-pronged scraper (three fine grooves in one pass);
// SIFT the heart by rubbing a fine sieve over it so that soft strands of dough push through; SET the stamens one by one with tweezers.
// Each step is scored on its own (colour and coverage of the fills, line accuracy of the strokes, how clean the pressure was); the score is the
// mean. The dough is a matte, slightly waxy paste: tool marks are crisp grooves with a lit edge and a shadowed edge. Two seasonal designs
// (camellia, chrysanthemum) live in src/paint-figures/kitchen.js; `params.design` pins one, else each round draws one by its seed.
import { registerTechnique } from './registry.js';
import { starsFor, hash } from './geom.js';
import { shadowed, shelf, rgba, tint, mix, ease } from './fx.js';
import { drawHeld, drawProp, lg, rg, ell } from './props.js';
import { camellia, kiku, NERIKIRI_IDS } from './paint-figures/kitchen.js';
import { prepareLayer, resetCover, paintCells, fillCells, regionAt, scoreLayer } from './paint-stroke.js';
import * as PR from './paint-render.js';
import { hintPill, makeSurface, dockRect } from './paint-ui.js';
import { rrect, clamp, smooth01, dist, TAU, smoothRaw, scoreSplit, makeVoice, fitBox, pointAt, drawPinch } from './sweet-common.js';

export const NERIKIRI_DEFAULTS = { tolerance: 0.04, guideMode: 'trace', guide: true, variation: 1, design: 'auto' };
const TABLE = { camellia, kiku };
const GUIDE_MODES = ['trace', 'faint', 'off'], GUIDE_LABEL = { trace: 'Guide', faint: 'Faint', off: 'No guide' };
const DOUGH = '#f3ebd7';           // plain white-bean dough
const MIN_STEP = 0.003;
const PRESS_V = 0.62;              // a press faster than this (design units per second) only scratches
const depthOf = (v) => clamp(1.25 - v / 0.9, 0.2, 1);
const TOOL_DOCK = { bera: 0, sankaku: 1, sanbon: 2, sieve: 3, tweezers: 4 };
const TOOLS = { tint: 'bera', wrap: 'bera', press: 'sankaku', scrape: 'sanbon', sieve: 'sieve', stamen: 'tweezers' };

export function createNerikiri(P, env) {
  const { rng, fx } = env;
  const SC = P.scene ?? {};
  const voice = makeVoice(env, 'nerikiri');
  const tol = P.tolerance ?? 0.04;
  let D, preps, L, items, cur, colorSel, now, done, geo, ptr, gmode, auto, layerScores, scoreCache, covS, covR, group, round = 0, domeAt, texCache = null, thumbBake = null, stageBake = null;
  const layer = () => D.layers[L], prep = () => preps[L], pal = (i) => D.palette[i] ?? D.palette[0];
  const isLines = (lay) => lay.kind === 'wrap' || lay.kind === 'press' || lay.kind === 'scrape';

  const init = () => {
    round++; thumbBake = null; texCache = null; stageBake = null;
    const pick = P.design && P.design !== 'auto' && TABLE[P.design] ? P.design : NERIKIRI_IDS[rng.int(NERIKIRI_IDS.length)];
    D = TABLE[pick](rng, P.variation ?? 1);
    preps = D.layers.map((lay) => prepareLayer(lay, { kind: 'none' }, D.ar));
    L = 0; items = []; cur = null; now = 0; done = null; ptr = null; layerScores = []; scoreCache = null; covS = []; covR = []; group = 0; domeAt = -1;
    gmode = P.guide === false ? 'off' : GUIDE_MODES.includes(P.guideMode) ? P.guideMode : 'trace';
    startLayer(); buildAuto();
  };
  const startLayer = () => { colorSel = layer().colors?.[0] ?? 0; resetCover(prep()); scoreCache = null; cur = null; };

  // ---- geometry helpers ----------------------------------------------------------------------------------------------------------------------
  const toLocal = (x, y) => [(x - geo.ox) / geo.s, (y - geo.oy) / geo.s];
  const inBox = (u, v) => u >= -0.03 && u <= D.ar + 0.03 && v >= -0.03 && v <= 1.03;
  const zoneOf = () => { const si = D.layers.findIndex((l) => l.kind === 'sieve'); const r = si >= 0 ? preps[si].regions[0] : null; return r ? { c: D.centre, r: Math.max(...r.pts.map((p) => dist(p, D.centre))) } : null; };

  // ---- scoring ---------------------------------------------------------------------------------------------------------------------------------
  const lineSamples = (li, onlyGood) => {
    const out = [];
    for (const it of items) if (it.layer === li && it.kind === 'line') for (const p of it.pts) { if (!onlyGood || p.d >= 0.55) out.push({ x: p.x, y: p.y, col: 0, free: true }); }
    return out;
  };
  const compute = (li = L) => {
    if (li === L && scoreCache) return scoreCache;
    const lay = D.layers[li], pr = preps[li];
    let sc;
    if (lay.kind === 'stamen') {   // each mark is covered by a tweezer tap; taps that miss every mark count against
      const dabs = items.filter((it) => it.layer === li && it.kind === 'dab'), cov = pr.guides.map((g) => (dabs.some((d) => dist([d.x, d.y], g.pts[0]) <= tol * 1.1) ? 1 : 0));
      const hit = cov.reduce((a, b) => a + b, 0), miss = dabs.filter((d) => !pr.guides.some((g) => dist([d.x, d.y], g.pts[0]) <= tol * 1.1)).length;
      sc = { score: Math.round(100 * clamp((hit / Math.max(1, pr.guides.length)) * (1 - 0.15 * Math.min(4, miss)), 0, 1)), line: hit / Math.max(1, pr.guides.length), goodLine: hit / Math.max(1, pr.guides.length), fill: null, stray: 0, strokeCov: cov, regionCov: [] };
    } else sc = isLines(lay) ? scoreSplit(pr, lineSamples(li, false), lineSamples(li, true), tol) : scoreLayer(pr, [], tol);
    if (li === L) { scoreCache = sc; covS = sc.strokeCov; covR = sc.regionCov; }
    return sc;
  };
  const rebuildCover = () => {
    resetCover(prep());
    for (const it of items) if (it.layer === L) {
      if (it.kind === 'fill') fillCells(prep(), it.region, it.col);
      else if (it.kind === 'rub') for (const q of it.pts) paintCells(prep(), 0, q.x, q.y, 0.028, 0);
    }
    scoreCache = null;
  };
  const total = () => {
    const live = done ? 0 : compute().score;
    return Math.round((layerScores.reduce((a, b) => a + b, 0) + live) / D.layers.length);
  };

  // ---- input -----------------------------------------------------------------------------------------------------------------------------------
  const begin = (u, v) => {
    const lay = layer();
    if (lay.kind === 'tint') {
      const ri = regionAt(prep(), u, v, 0.03);
      if (ri >= 0) {
        items.push({ kind: 'fill', layer: L, region: ri, col: colorSel, at: [u, v], born: now, group: ++group });
        fillCells(prep(), ri, colorSel); scoreCache = null; compute();
        voice('whoosh', { dur: 0.22, vel: 0.28, down: false }); voice('impact', { mat: 'clay', hz: 150, vel: 0.3, delay: 0.04 });
        if (geo) fx.emit('dust', geo.ox + u * geo.s, geo.oy + v * geo.s, { count: 4, color: pal(colorSel).color, size: geo.s * 0.012, speed: 40, life: 0.5, gravity: 0 });
      } else voice('tick', { hz: 800, vel: 0.2 });
      return;
    }
    if (lay.kind === 'stamen') {
      let best = -1, bd = 0.065;
      prep().guides.forEach((g, gi) => { if ((covS[gi] ?? 0) > 0.8) return; const d = dist(g.pts[0], [u, v]); if (d < bd) { bd = d; best = gi; } });
      const q = best >= 0 ? prep().guides[best].pts[0] : [u, v];
      items.push({ kind: 'dab', layer: L, x: q[0], y: q[1], born: now, group: ++group, gi: best }); scoreCache = null; compute();
      voice('tick', { hz: 1900, vel: 0.3 }); voice('impact', { mat: 'clay', hz: 260, vel: 0.2, delay: 0.02 });
      return;
    }
    cur = { raw: [{ x: u, y: v, t: now }], len: 0, since: 0, rubbed: [] };
    voice('tick', { hz: lay.kind === 'sieve' ? 3200 : 1200, vel: 0.25 });
  };
  const move = (u, v) => {
    if (!cur) return;
    const a = cur.raw[cur.raw.length - 1], d = Math.hypot(u - a.x, v - a.y);
    if (d < MIN_STEP) return;
    const dt = Math.max(1 / 120, now - a.t), sp = d / dt, lay = layer();
    cur.raw.push({ x: u, y: v, t: now }); cur.len += d; cur.since += d;
    if (lay.kind === 'sieve') {
      const z = zoneOf();
      if (z && Math.hypot(u - z.c[0], v - z.c[1]) <= z.r + 0.015) {
        cur.rubbed.push({ x: u, y: v });
        paintCells(prep(), 0, u, v, 0.028, 0); scoreCache = null;
        if (cur.since >= 0.02) { cur.since = 0; voice('scrape', { hz: 6500 + 600 * hash(Math.round(cur.len * 80), 2), dur: 0.05, vel: 0.2 }); if (geo) fx.emit('dust', geo.ox + u * geo.s, geo.oy + v * geo.s, { count: 1, color: D.soboro, size: geo.s * 0.006, speed: 20, life: 0.5, gravity: 120 }); }
      }
      return;
    }
    if (cur.since >= 0.02) {
      cur.since = 0;
      if (lay.kind === 'wrap') { voice('scrape', { hz: 1400, dur: 0.1, vel: 0.28 }); voice('impact', { mat: 'clay', hz: 140, vel: 0.1 }); }
      else if (lay.kind === 'press') { const good = sp <= PRESS_V; voice('impact', { mat: 'clay', hz: 170 + (good ? 0 : 90), vel: good ? 0.26 : 0.12 }); voice('scrape', { hz: good ? 2200 : 4200, dur: 0.05, vel: 0.14 }); }
      else if (lay.kind === 'scrape') { for (let k = 0; k < 3; k++) voice('scrape', { hz: 3000 + k * 420, dur: 0.05, vel: 0.16, delay: k * 0.008 }); }
    }
  };
  const end = () => {
    if (!cur) return;
    const st = cur, lay = layer(); cur = null;
    if (lay.kind === 'sieve') {
      if (st.rubbed.length) { items.push({ kind: 'rub', layer: L, pts: st.rubbed, born: now, group: ++group }); scoreCache = null; compute(); }
      return;
    }
    const sm = smoothRaw(st.raw);
    if (sm.length < 3) return;
    const pts = sm.map((p) => ({ x: p.x, y: p.y, d: lay.kind === 'wrap' ? 1 : depthOf(p.v) }));
    for (let i = 0; i < 4 && i < pts.length - 1; i++) pts[i].d = Math.max(pts[i].d, pts[Math.min(pts.length - 1, 5)].d * 0.95);   // no speed history at the start: borrow the next sample
    items.push({ kind: 'line', layer: L, tool: lay.tool, pts, born: now, group: ++group });
    const before = covS.slice(); scoreCache = null; compute();
    voice(lay.kind === 'wrap' ? 'whoosh' : 'tick', lay.kind === 'wrap' ? { dur: 0.16, vel: 0.3, down: true } : { hz: 1500, vel: 0.2 });
    prep().guides.forEach((g, i) => { if ((covS[i] ?? 0) > 0.85 && (before[i] ?? 0) <= 0.85 && geo) { const m = g.pts[g.pts.length >> 1]; fx.emit('spark', geo.ox + m[0] * geo.s, geo.oy + m[1] * geo.s, { count: 2, color: '#fff4c8', size: 5, speed: 50, life: 0.4, gravity: 30 }); } });
    if (lay.kind === 'wrap' && covS.every((c) => c > 0.8) && domeAt < 0) { domeAt = now; voice('impact', { mat: 'clay', hz: 110, vel: 0.5 }); voice('whoosh', { dur: 0.3, vel: 0.3, down: true, delay: 0.05 }); }
  };
  const work = (p) => {
    if (!geo || done) return;
    ptr = { x: p.x, y: p.y };
    const [u, v] = toLocal(p.x, p.y);
    if (p.pressed && inBox(u, v)) begin(u, v);
    if (cur && (p.down || p.pressed)) move(u, v);
    if (cur && (p.released || !p.down)) end();
  };
  const tick = (dt) => { now += dt; };

  // ---- controls --------------------------------------------------------------------------------------------------------------------------------
  const items_ = () => {
    const lay = layer(), out = [];
    if (lay.kind === 'tint') lay.colors.forEach((c) => out.push({ id: `color:${c}`, kind: 'swatch', color: pal(c).color, on: colorSel === c, name: pal(c).name }));
    out.push({ id: 'guide', kind: 'btn', label: GUIDE_LABEL[gmode] });
    out.push({ id: 'undo', kind: 'btn', label: 'Undo', off: !items.some((s) => s.layer === L) });
    out.push({ id: 'check', kind: 'btn', label: L >= D.layers.length - 1 ? 'Finish' : 'Next', primary: true });
    return out;
  };
  const undo = () => {
    for (let i = items.length - 1; i >= 0; i--) if (items[i].layer === L) { const g = items[i].group; while (items.length && items[items.length - 1].group === g && items[items.length - 1].layer === L) items.pop(); break; }
    rebuildCover(); compute();
    if (layer().kind === 'wrap' && !covS.every((c) => c > 0.8)) domeAt = -1;
    voice('pop', { vel: 0.4 });
  };
  const finish = () => {
    const sc = compute(); layerScores.push(sc.score);
    const score = Math.round(layerScores.reduce((a, b) => a + b, 0) / D.layers.length), stars = starsFor(score), W = SC.words ?? {};
    done = { score, max: 100, stars, headline: stars === 3 ? (W.win ?? 'Worthy of the tea room') : stars ? (W.ok ?? 'A fine sweet') : (W.retry ?? 'Knead again'), detail: D.layers.map((l, i) => `${l.name.split(' ')[0]} ${layerScores[i]}`).join(', ') };
    cur = null; voice('good', { hz: 660 + stars * 70, vel: 0.6 }); voice('sparkle', { vel: 0.4, delay: 0.1 });
    if (geo) fx.emit('spark', geo.ox + geo.bw / 2, geo.oy + geo.s * 0.5, { count: 14, color: '#fff4c8', size: 8, speed: 160, life: 0.8, gravity: 80 });
  };
  const advance = () => {
    if (done || cur) return;
    if (L >= D.layers.length - 1) { finish(); return; }
    const sc = compute(); layerScores.push(sc.score); L++; startLayer(); covS = []; covR = []; compute();
    voice('whoosh', { dur: 0.22, vel: 0.35, down: false });
  };
  const control = (id) => {
    if (done) return;
    const [k, rest] = id.split(':');
    if (k === 'color') { colorSel = Number(rest); voice('pop', { vel: 0.45, hz: 600 + 40 * colorSel }); voice('impact', { mat: 'clay', hz: 200, vel: 0.15, delay: 0.03 }); }
    else if (k === 'guide') { gmode = GUIDE_MODES[(GUIDE_MODES.indexOf(gmode) + 1) % GUIDE_MODES.length]; voice('tick', { hz: 1800, vel: 0.3 }); }
    else if (k === 'undo') undo();
    else if (k === 'check') advance();
  };

  // ---- Watch and learn ---------------------------------------------------------------------------------------------------------------------
  function buildAuto() {
    const q = [];
    D.layers.forEach((lay, li) => {
      const pr = preps[li];
      if (lay.kind === 'tint') pr.regions.forEach((r) => { q.push({ t: 'dip', col: r.col }); q.push({ t: 'tap', at: r.at }); });
      else if (lay.kind === 'sieve') { const z = pr.regions[0], c = D.centre, rr = z ? Math.max(...z.pts.map((p) => dist(p, c))) * 0.86 : 0.08, pts = []; for (let k = 0; k <= 40; k++) { const a = (k / 40) * TAU * 3, rad = rr * (0.35 + 0.65 * Math.abs(Math.sin(k * 0.9))); pts.push([c[0] + Math.cos(a) * rad, c[1] + Math.sin(a) * rad]); } q.push({ t: 'rub', pts }); }
      else if (lay.kind === 'stamen') pr.guides.forEach((g) => q.push({ t: 'tap', at: g.pts[0] }));
      else pr.guides.forEach((g) => q.push({ t: 'stroke', g, sp: lay.kind === 'press' ? 0.4 : lay.kind === 'scrape' ? 0.4 : 0.55 }));
      q.push({ t: 'next' });
    });
    auto = { q, i: 0, wait: 0.3, st: null, hand: null };
  }
  const attract = (dt) => {
    if (done) return;
    if (auto.wait > 0) { auto.wait -= dt; return; }
    if (auto.st) {
      const s = auto.st, step = s.sp * dt; s.pos = Math.min(s.len, s.pos + step);
      const q = pointAt(s.pts, s.pos), jx = (((s.k = s.k + 1) * 2654435761) % 1000) / 1000 - 0.5;
      move(q[0] + jx * 0.0015, q[1] + jx * 0.001); auto.hand = q;
      if (s.pos >= s.len) { end(); auto.st = null; auto.wait = 0.14; }
      return;
    }
    const a = auto.q[auto.i];
    if (!a) return;
    auto.i++;
    if (a.t === 'dip') { control(`color:${a.col}`); auto.wait = 0.25; }
    else if (a.t === 'tap') { begin(a.at[0], a.at[1]); auto.hand = a.at; auto.wait = 0.5; }
    else if (a.t === 'next') { advance(); auto.wait = 0.5; }
    else if (a.t === 'stroke') { begin(a.g.pts[0][0], a.g.pts[0][1]); auto.st = { pts: a.g.pts, pos: 0, len: a.g.len, sp: a.sp, k: 0 }; auto.hand = a.g.pts[0]; }
    else if (a.t === 'rub') { begin(a.pts[0][0], a.pts[0][1]); let len = 0; for (let i = 1; i < a.pts.length; i++) len += dist(a.pts[i - 1], a.pts[i]); auto.st = { pts: a.pts, pos: 0, len, sp: 0.9, k: 0 }; auto.hand = a.pts[0]; }
  };

  // ---- drawing ---------------------------------------------------------------------------------------------------------------------------------
  const C = () => D.centre;
  const ballPath = (ctx, V, k = 1, dx = 0, dy = 0) => { ctx.beginPath(); ctx.arc(V.ox + C()[0] * V.s + dx, V.oy + C()[1] * V.s + dy, D.R * V.s * k, 0, TAU); };
  const P2 = (V, p) => [V.ox + p[0] * V.s, V.oy + p[1] * V.s];

  const tray = (ctx, V) => {   // a black lacquer tray: depth, gloss, a red inner border, a fine gold line, a dusting of gold at the corners
    const x = V.ox, y = V.oy, w = D.ar * V.s, h = V.s, r = h * 0.05, th = Math.max(4, h * 0.022);
    shadowed(ctx, () => { rrect(ctx, x, y + th, w, h, r); ctx.fillStyle = '#050302'; ctx.fill(); }, { blur: h * 0.05, dy: h * 0.025, a: 0.6 });
    rrect(ctx, x, y + th * 0.6, w, h, r); ctx.fillStyle = '#240c08'; ctx.fill();
    rrect(ctx, x, y, w, h, r); ctx.fillStyle = lg(ctx, x, y, x + w, y + h, [[0, '#2a1a16'], [0.45, '#140a08'], [1, '#0b0504']]); ctx.fill();
    ctx.save(); rrect(ctx, x, y, w, h, r); ctx.clip();
    const g = ctx.createLinearGradient(x, y, x + w * 0.8, y + h); g.addColorStop(0, 'rgba(255,240,220,0.16)'); g.addColorStop(0.32, 'rgba(255,240,220,0.02)'); g.addColorStop(0.5, 'rgba(255,240,220,0.07)'); g.addColorStop(0.62, 'rgba(255,240,220,0)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.restore();
    ctx.strokeStyle = '#8c1c14'; ctx.lineWidth = Math.max(2, h * 0.008); rrect(ctx, x + h * 0.018, y + h * 0.018, w - h * 0.036, h - h * 0.036, r * 0.8); ctx.stroke();
    ctx.strokeStyle = 'rgba(224,182,80,0.8)'; ctx.lineWidth = Math.max(1, h * 0.003); rrect(ctx, x + h * 0.034, y + h * 0.034, w - h * 0.068, h - h * 0.068, r * 0.6); ctx.stroke();
    for (const [cx, cy, sx, sy] of [[x + h * 0.06, y + h * 0.06, 1, 1], [x + w - h * 0.06, y + h * 0.06, -1, 1], [x + h * 0.06, y + h - h * 0.06, 1, -1], [x + w - h * 0.06, y + h - h * 0.06, -1, -1]]) {
      ctx.fillStyle = 'rgba(232,190,90,0.85)'; for (let k = 0; k < 16; k++) { const a = hash(k, 7) * 1.5, rr = h * 0.05 * hash(k, 8); ctx.beginPath(); ctx.arc(cx + sx * Math.cos(a) * rr, cy + sy * Math.sin(a) * rr, Math.max(0.8, h * 0.0016 * (1 + hash(k, 9) * 2)), 0, TAU); ctx.fill(); }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.2; rrect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r); ctx.stroke();
  };
  const leaf = (ctx, x, y, len, wid, ang, c) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, -wid + wid * 0.25, len, wid * 0.25); ctx.quadraticCurveTo(len * 0.5, wid + wid * 0.25, 0, wid * 0.25); ctx.fill();
    ctx.fillStyle = lg(ctx, 0, -wid, 0, wid, [[0, tint(c, 0.28)], [0.5, c], [1, tint(c, -0.45)]]);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.45, -wid, len, 0); ctx.quadraticCurveTo(len * 0.45, wid, 0, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = rgba(tint(c, 0.5), 0.7); ctx.lineWidth = Math.max(1.2, wid * 0.06); ctx.beginPath(); ctx.moveTo(len * 0.04, 0); ctx.lineTo(len * 0.96, 0); ctx.stroke();
    ctx.strokeStyle = rgba(tint(c, -0.4), 0.45); ctx.lineWidth = 1; ctx.beginPath(); for (let k = 1; k < 6; k++) { const f = k / 6.5; ctx.moveTo(len * f, 0); ctx.lineTo(len * (f + 0.14), -wid * 0.55 * Math.sin(Math.PI * f)); ctx.moveTo(len * f, 0); ctx.lineTo(len * (f + 0.14), wid * 0.55 * Math.sin(Math.PI * f)); } ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.ellipse(len * 0.4, -wid * 0.32, len * 0.2, wid * 0.1, -0.12, 0, TAU); ctx.fill();
    ctx.restore();
  };
  const pick = (ctx, V) => {   // a black lacquer cake pick with a red end, laid on the tray
    const R = D.R * V.s, x = V.ox + V.s * 0.3, y = V.oy + V.s * 0.925, L0 = R * 1.5, h = Math.max(3, V.s * 0.011);
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.06);
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; rrect(ctx, 2, h * 0.9, L0, h, h / 2); ctx.fill();
    rrect(ctx, 0, 0, L0, h, h / 2); ctx.fillStyle = lg(ctx, 0, 0, 0, h, [[0, '#8a7868'], [0.4, '#2a1c16'], [1, '#0a0605']]); ctx.fill();
    ctx.fillStyle = '#c8301e'; rrect(ctx, 0, 0, L0 * 0.12, h, h / 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(L0 * 0.2, h * 0.2, L0 * 0.7, Math.max(1, h * 0.15));
    ctx.restore();
  };
  const deco = (ctx, V) => {
    const [cx, cy] = P2(V, C()), R = D.R * V.s; pick(ctx, V);
    if (D.deco === 'leaf') {
      leaf(ctx, cx - R * 0.1, cy + R * 0.2, R * 2.15, R * 0.62, -2.35 + D.spin * 0.04, '#2f7a42');
      leaf(ctx, cx + R * 0.1, cy + R * 0.1, R * 2.0, R * 0.56, -0.62 - D.spin * 0.04, '#26663a');
    } else if (D.deco === 'paper') {   // a folded sheet of plain paper under the sweet
      ctx.save(); ctx.translate(cx, cy + R * 0.05); ctx.rotate(0.35 + D.spin * 0.02);
      const q = R * 1.1; ctx.fillStyle = 'rgba(0,0,0,0.45)'; rrect(ctx, -q + 5, -q + 9, q * 2, q * 2, 4); ctx.fill();
      ctx.fillStyle = lg(ctx, -q, -q, q, q, [[0, '#fbf5e4'], [1, '#e2d4b2']]); rrect(ctx, -q, -q, q * 2, q * 2, 4); ctx.fill();
      ctx.strokeStyle = 'rgba(120,100,60,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-q, 0); ctx.lineTo(q, 0); ctx.moveTo(0, -q); ctx.lineTo(0, q); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.moveTo(-q, 1.5); ctx.lineTo(q, 1.5); ctx.stroke();
      ctx.restore();
    }
  };
  const texture = (ctx, V) => {   // fine pores and flecks of a waxy paste, baked once per size
    const R = D.R * V.s, n = Math.ceil(R * 2) + 4, key = `${round}|${n}`;
    if (!texCache || texCache.key !== key) {
      const sf = makeSurface(ctx, n, n);
      if (sf) { const c = sf.ctx, m = n / 2; c.fillStyle = '#fff'; for (let k = 0; k < 520; k++) { const a = hash(k, 1) * TAU, r = Math.sqrt(hash(k, 2)) * R; c.globalAlpha = 0.05 + 0.1 * hash(k, 3); c.fillRect(m + Math.cos(a) * r, m + Math.sin(a) * r, 1.2 + hash(k, 4) * 1.4, 1 + hash(k, 5) * 1.2); } for (let k = 0; k < 16; k++) { const a = hash(k, 31) * TAU, r = Math.sqrt(hash(k, 32)) * R * 0.85, br = R * (0.25 + 0.3 * hash(k, 33)), gx = m + Math.cos(a) * r, gy = m + Math.sin(a) * r, gr = c.createRadialGradient(gx, gy, 0, gx, gy, br); gr.addColorStop(0, k % 2 ? 'rgba(255,250,236,0.1)' : 'rgba(150,100,60,0.07)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.globalAlpha = 1; c.fillStyle = gr; c.fillRect(gx - br, gy - br, br * 2, br * 2); } c.fillStyle = '#8a5a30'; for (let k = 0; k < 520; k++) { const a = hash(k, 6) * TAU, r = Math.sqrt(hash(k, 7)) * R; c.globalAlpha = 0.04 + 0.08 * hash(k, 8); c.fillRect(m + Math.cos(a) * r, m + Math.sin(a) * r, 1 + hash(k, 9) * 1.4, 1 + hash(k, 10) * 1.2); } texCache = { key, sf }; } else texCache = { key, sf: null };
    }
    if (texCache.sf) { const [cx, cy] = P2(V, C()); ctx.save(); ballPath(ctx, V); ctx.clip(); ctx.drawImage(texCache.sf.canvas, cx - texCache.sf.canvas.width / 2, cy - texCache.sf.canvas.height / 2); ctx.restore(); }
  };
  // the dough with its tinted layers (no light): used for the whole disc and again for each flap that folds over the filling
  const doughFlat = (ctx, V, vm, t) => {
    ballPath(ctx, V); ctx.fillStyle = DOUGH; ctx.fill();
    for (const f of vm.fills) {
      ctx.save(); PR.regionClip(ctx, V, preps[f.layer], f.region); ctx.clip('evenodd');
      const r = preps[f.layer].regions[f.region], b = r.box, mx = Math.max(b.x1 - b.x0, b.y1 - b.y0), age = (t - f.born) / 0.5, rad = ease(age) * (mx * 1.3);
      const c = pal(f.col).color, [ax, ay] = P2(V, f.at), rp = Math.max(1, rad * V.s);
      ctx.fillStyle = rg(ctx, ax, ay, 0, rp, [[0, tint(c, 0.06)], [0.92, c], [1, c]]); ctx.beginPath(); ctx.arc(ax, ay, rp, 0, TAU); ctx.fill();
      if (f.region > 0 && age >= 1) {   // two doughs pressed together blend a little where they meet: feather the edge of the upper layer
        const under = vm.fills.find((q) => q.layer === f.layer && q.region === 0), uc = under ? pal(under.col).color : DOUGH, mid = mix(uc, c, 0.55);
        ctx.lineJoin = 'round'; const pts = preps[f.layer].regions[f.region].pts;
        for (const [wd, a] of [[0.05, 0.16], [0.032, 0.2], [0.018, 0.26]]) { ctx.beginPath(); pts.forEach((p, i) => { const [x, y] = P2(V, p); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.closePath(); ctx.strokeStyle = rgba(mid, a); ctx.lineWidth = V.s * wd; ctx.stroke(); }
      }
      ctx.restore();
    }
    texture(ctx, V);
  };
  const groovePath = (ctx, V, pts, dx, dy) => { ctx.beginPath(); pts.forEach((p, i) => { const x = V.ox + p.x * V.s + dx, y = V.oy + p.y * V.s + dy; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); };
  const offsetPts = (pts, k) => pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; let tx = b.x - a.x, ty = b.y - a.y; const m = Math.hypot(tx, ty) || 1; return { x: p.x - (ty / m) * k, y: p.y + (tx / m) * k, d: p.d }; });
  const grooves = (ctx, V, list, tm) => {
    ctx.save(); ballPath(ctx, V); ctx.clip(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const it of list) {
      const pts = it.pts; if (pts.length < 2) continue;
      const prong = it.tool === 'sanbon', offs = prong ? [-0.011, 0, 0.011] : [0], dAvg = pts.reduce((a, p) => a + p.d, 0) / pts.length;
      const w = V.s * (prong ? 0.0032 : 0.0042 + 0.0038 * dAvg), grow = ease((tm - it.born + 0.3) / 0.3);
      for (const o of offs) {
        const line = o ? offsetPts(pts, o) : pts;
        const sh = (dx, dy, col, lw) => { groovePath(ctx, V, line, dx, dy); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); };
        sh(-w * 2.2, -w * 2.8, `rgba(255,250,240,${0.12 * grow * (0.5 + 0.5 * dAvg)})`, w * 5.5);                  // the lit shoulder of the ridge
        sh(w * 2.2, w * 2.8, `rgba(110,56,30,${0.11 * grow * (0.5 + 0.5 * dAvg)})`, w * 5.5);                       // the shaded shoulder
        sh(w * 0.5, w * 0.8, `rgba(120,70,40,${0.07 * grow})`, w * 4.2);                                       // a soft pooling of shade round the cut
        sh(w * 0.4, w * 0.6, `rgba(110,58,30,${(0.2 + 0.22 * dAvg) * grow})`, w * 1.5);                       // shadow side of the cut
        sh(0, 0, `rgba(150,92,52,${(0.2 + 0.26 * dAvg) * grow})`, w * (prong ? 0.9 : 1.05));                  // the floor of the groove
        sh(-w * 0.75, -w * 0.9, `rgba(255,252,240,${(0.5 + 0.3 * dAvg) * grow})`, Math.max(0.8, w * 0.6));     // the lit lip of the cut
      }
    }
    ctx.restore();
  };
  // height shading of the petals: once the creases are cut each petal is a soft pillow, lit on its upper left and shaded on its lower right,
  // alternate petals a little deeper so that they read as separate petals
  const petalRelief = (ctx, V, k) => {
    if (k <= 0 || !D.petals) return;
    const R = D.R * V.s;
    ctx.save(); ballPath(ctx, V); ctx.clip();
    D.petals.forEach((poly, i) => {
      let mx = 0, my = 0; for (const p of poly) { mx += p[0]; my += p[1]; } mx /= poly.length; my /= poly.length;
      const [cx, cy] = P2(V, [mx, my]);
      ctx.beginPath(); poly.forEach((p, j) => { const [x, y] = P2(V, p); if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.closePath();
      const g = ctx.createLinearGradient(cx - R * 0.2, cy - R * 0.24, cx + R * 0.2, cy + R * 0.24); g.addColorStop(0, `rgba(255,252,244,${0.34 * k})`); g.addColorStop(0.55, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(96,40,20,${(0.3 + (i % 2) * 0.1) * k})`);
      ctx.fillStyle = g; ctx.fill();
      if (i % 2) { ctx.fillStyle = `rgba(110,50,30,${0.05 * k})`; ctx.fill(); }
    });
    ctx.restore();
  };
  const ankoAndFlaps = (ctx, V, vm, t) => {
    const R = D.R * V.s, [cx, cy] = P2(V, C()), ra = R * 0.6, fade = 1 - vm.dome;
    ctx.save(); ballPath(ctx, V); ctx.clip();
    // the ball of bean filling sitting on the dough: dark, grainy, matte
    ctx.fillStyle = 'rgba(40,20,20,0.4)'; ctx.beginPath(); ctx.arc(cx + ra * 0.08, cy + ra * 0.14, ra * 1.08, 0, TAU); ctx.fill();
    ctx.fillStyle = rg(ctx, cx, cy, 0, ra, [[0, '#6a3a44'], [0.55, '#43202c'], [1, '#26121a']], cx - ra * 0.3, cy - ra * 0.35); ctx.beginPath(); ctx.arc(cx, cy, ra, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(210,150,160,0.22)'; for (let k = 0; k < 90; k++) { const a = hash(k, 1) * TAU, r = Math.sqrt(hash(k, 2)) * ra * 0.95; ctx.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.4, 1.1); }
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(cx - ra * 0.3, cy - ra * 0.4, ra * 0.32, ra * 0.14, -0.6, 0, TAU); ctx.fill();
    // each flap of dough that has been drawn in slides over the filling from the rim
    const N = Math.max(1, vm.flaps.length);
    vm.flaps.forEach((f) => {
      if (f.cover <= 0) return;
      const rIn = R * (1 - ease(f.cover)), a0 = f.ang - Math.PI / N - 0.03, a1 = f.ang + Math.PI / N + 0.03;
      ctx.save();
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R * 1.03, a0, a1); ctx.closePath(); ctx.clip();
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.05, 0, TAU); ctx.moveTo(cx + rIn, cy); ctx.arc(cx, cy, Math.max(0.1, rIn), 0, TAU, true); ctx.clip('evenodd');
      doughFlat(ctx, V, vm, t);
      const sh = ctx.createLinearGradient(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R, cx + Math.cos(a1) * R, cy + Math.sin(a1) * R); sh.addColorStop(0, 'rgba(255,255,255,0.14)'); sh.addColorStop(0.5, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(90,40,20,0.2)'); ctx.fillStyle = sh; ctx.fillRect(cx - R * 1.1, cy - R * 1.1, R * 2.2, R * 2.2);
      ctx.restore();
      ctx.save(); ctx.lineCap = 'round'; ctx.globalAlpha = fade;
      for (const [a, dx] of [[a0 + 0.03, 1], [a1 - 0.03, -1]]) { ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * rIn, cy + Math.sin(a) * rIn); ctx.lineTo(cx + Math.cos(a) * R * 0.99, cy + Math.sin(a) * R * 0.99); ctx.strokeStyle = 'rgba(90,44,22,0.3)'; ctx.lineWidth = Math.max(1.4, V.s * 0.004); ctx.stroke(); ctx.save(); ctx.translate(dx * 1.4, -1.2); ctx.strokeStyle = 'rgba(255,252,240,0.45)'; ctx.lineWidth = Math.max(0.8, V.s * 0.002); ctx.stroke(); ctx.restore(); }
      ctx.restore();
    });
    ctx.restore();
  };
  // the light: the disc is flat until it is wrapped; then it rounds into a dome (k 0..1)
  const lighting = (ctx, V, k) => {
    const R = D.R * V.s, [cx, cy] = P2(V, C());
    ctx.save(); ballPath(ctx, V); ctx.clip();
    const lowK = 0.35 + 0.65 * k;
    let g = ctx.createRadialGradient(cx - R * 0.34, cy - R * 0.4, R * 0.04, cx - R * 0.2, cy - R * 0.2, R * 1.15); g.addColorStop(0, `rgba(255,255,255,${0.26 * lowK})`); g.addColorStop(0.5, `rgba(255,248,236,${0.07 * lowK})`); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    g = ctx.createRadialGradient(cx - R * 0.15, cy - R * 0.2, R * 0.5, cx, cy, R * 1.02); g.addColorStop(0, 'rgba(70,28,12,0)'); g.addColorStop(0.7, `rgba(80,34,14,${0.05 + 0.14 * k})`); g.addColorStop(1, `rgba(60,22,8,${0.22 + 0.3 * k})`); ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    g = ctx.createLinearGradient(cx - R * 0.2, cy - R * 0.4, cx + R * 0.8, cy + R); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.6, 'rgba(255,200,150,0)'); g.addColorStop(1, `rgba(255,190,140,${0.18 * k})`); ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.2 * lowK})`; ctx.beginPath(); ctx.ellipse(cx - R * 0.36, cy - R * 0.42, R * 0.34, R * 0.15, -0.65, 0, TAU); ctx.fill();   // a broad soft sheen: wax, not gloss
    ctx.restore();
    ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${0.35 * lowK})`; ctx.lineWidth = Math.max(1, V.s * 0.003); ctx.beginPath(); ctx.arc(cx, cy, R * 0.985, Math.PI * 0.95, Math.PI * 1.55); ctx.stroke();
    ctx.strokeStyle = `rgba(70,28,10,${0.3 * lowK})`; ctx.beginPath(); ctx.arc(cx, cy, R * 0.985, 0, Math.PI * 0.55); ctx.stroke(); ctx.restore();
  };
  // soft strands pushed through the sieve; they stand on the dough, so each has its own shadow and lit edge
  const strands = (ctx, V, list) => {
    ctx.save(); ctx.lineCap = 'round';
    const R = D.R * V.s;
    for (const s of list) {
      const x = V.ox + s.x * V.s, y = V.oy + s.y * V.s, a = s.a, len = s.len * R, bx = Math.cos(a + s.bend) * len * 0.55, by = Math.sin(a + s.bend) * len * 0.55, ex = Math.cos(a) * len, ey = Math.sin(a) * len - len * 0.12;
      const lw = Math.max(1.1, R * 0.011 * s.w);
      ctx.strokeStyle = 'rgba(60,30,10,0.36)'; ctx.lineWidth = lw * 1.4; ctx.beginPath(); ctx.moveTo(x + 1, y + 2); ctx.quadraticCurveTo(x + bx + 1, y + by + 2, x + ex + 1, y + ey + 2); ctx.stroke();
      ctx.strokeStyle = mix(D.soboro, '#6a4a10', s.shade * 0.5); ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + bx, y + by, x + ex, y + ey); ctx.stroke();
      ctx.strokeStyle = rgba(tint(D.soboro, 0.6), 0.75); ctx.lineWidth = Math.max(0.6, lw * 0.35); ctx.beginPath(); ctx.moveTo(x - 0.4, y - 0.5); ctx.quadraticCurveTo(x + bx - 0.4, y + by - 0.5, x + ex - 0.4, y + ey - 0.5); ctx.stroke();
    }
    ctx.restore();
  };
  const stamens = (ctx, V, list) => {
    const R = D.R * V.s;
    ctx.save(); ctx.lineCap = 'round';
    for (const s of list) {
      const x = V.ox + s.x * V.s, y = V.oy + s.y * V.s, a = Math.atan2(s.y - C()[1], s.x - C()[0]), L0 = R * 0.2, ex = x + Math.cos(a) * L0, ey = y + Math.sin(a) * L0 - R * 0.06;
      ctx.strokeStyle = 'rgba(50,24,6,0.4)'; ctx.lineWidth = Math.max(1.4, R * 0.013); ctx.beginPath(); ctx.moveTo(x + 1.5, y + 2.5); ctx.quadraticCurveTo(x + Math.cos(a) * L0 * 0.5 + 1.5, y + Math.sin(a) * L0 * 0.6 + 2.5, ex + 1.5, ey + 2.5); ctx.stroke();
      ctx.strokeStyle = tint(D.stamen, 0.25); ctx.lineWidth = Math.max(1.2, R * 0.011); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a) * L0 * 0.5, y + Math.sin(a) * L0 * 0.6 - R * 0.02, ex, ey); ctx.stroke();
      const r = Math.max(2.2, R * 0.032);
      ctx.fillStyle = 'rgba(50,24,6,0.4)'; ctx.beginPath(); ctx.ellipse(ex + r * 0.4, ey + r * 0.7, r, r * 0.8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = rg(ctx, ex, ey, 0, r, [[0, tint(D.stamen, 0.5)], [0.6, D.stamen], [1, tint(D.stamen, -0.45)]], ex - r * 0.35, ey - r * 0.35); ctx.beginPath(); ctx.arc(ex, ey, r, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(ex - r * 0.33, ey - r * 0.38, Math.max(0.7, r * 0.22), 0, TAU); ctx.fill();
    }
    ctx.restore();
  };
  const sieveZone = () => { const z = zoneOf(); return z ? z.r : 0.1; };
  const strandList = (rubs, ideal) => {   // strands from the paths of the sieve: one per short stretch of travel, radiating from the heart
    const out = [], zr = sieveZone();
    const place = (x, y, k) => { const dx = x - C()[0], dy = y - C()[1], a0 = Math.atan2(dy, dx); out.push({ x, y, a: a0 + (hash(k, 11) - 0.5) * 1.6, len: 0.08 + 0.1 * hash(k, 12) + Math.min(0.1, Math.hypot(dx, dy) / D.R), bend: (hash(k, 13) - 0.5) * 1.2, w: 0.7 + 0.7 * hash(k, 14), shade: hash(k, 15) }); };
    if (ideal) { for (let k = 0; k < 150; k++) { const a = hash(k, 21) * TAU, r = Math.sqrt(hash(k, 22)) * zr * 0.95; place(C()[0] + Math.cos(a) * r, C()[1] + Math.sin(a) * r, k); } return out; }
    let k = 0, acc = 0;
    for (const it of rubs) { let last = null; for (const p of it.pts) { if (last) acc += dist([last.x, last.y], [p.x, p.y]); last = p; if (acc >= 0.011 && out.length < 300) { acc = 0; place(p.x, p.y, k++); } } }
    return out;
  };

  // the view-model: what is on the dough at time t; ideal = the finished sweet (the picture in the frame)
  const viewModel = (ideal) => {
    const vm = { fills: [], flaps: [], lines: [], rubs: [], dabs: [], dome: ideal ? 1 : 0, ideal, relief: ideal ? 1 : 0 };
    const wi = D.layers.findIndex((l) => l.kind === 'wrap');
    if (ideal) {
      D.layers.forEach((lay, li) => {
        if (lay.kind === 'tint') lay.regions.forEach((r, ri) => vm.fills.push({ layer: li, region: ri, col: r.col, at: preps[li].regions[ri].at, born: -99 }));
        if (lay.kind === 'press' || lay.kind === 'scrape') lay.strokes.forEach((g) => vm.lines.push({ tool: lay.tool, born: -99, pts: g.pts.map((p) => ({ x: p[0], y: p[1], d: 1 })) }));
        if (lay.kind === 'stamen') lay.strokes.forEach((g) => vm.dabs.push({ x: g.pts[0][0], y: g.pts[0][1] }));
      });
      return vm;
    }
    for (const it of items) {
      if (it.kind === 'fill') vm.fills.push({ layer: it.layer, region: it.region, col: it.col, at: it.at, born: it.born });
      else if (it.kind === 'line' && (D.layers[it.layer].kind === 'press' || D.layers[it.layer].kind === 'scrape')) vm.lines.push({ tool: it.tool, born: it.born, pts: it.pts });
      else if (it.kind === 'rub') vm.rubs.push(it);
      else if (it.kind === 'dab') vm.dabs.push(it);
    }
    if (cur) {   // the stroke in progress
      const lay = layer();
      if (lay.kind === 'press' || lay.kind === 'scrape') { const live = smoothRaw(cur.raw); if (live.length > 1) vm.lines.push({ tool: lay.tool, born: -9, pts: live.map((p) => ({ x: p.x, y: p.y, d: depthOf(p.v) })) }); }
      else if (lay.kind === 'sieve' && cur.rubbed.length) vm.rubs.push({ pts: cur.rubbed });
    }
    if (wi >= 0) {   // flaps: each wrap guide covers its sector once it has been drawn (a live stroke folds its flap as it goes)
      const gs = preps[wi].guides, cs = wi === L ? covS : null;
      vm.flaps = gs.map((g, gi) => ({ ang: Math.atan2(g.pts[0][1] - C()[1], g.pts[0][0] - C()[0]), cover: wi < L || done ? 1 : Math.min(1, (cs?.[gi] ?? 0) / 0.8) }));
      if (cur && layer().kind === 'wrap') { const live = smoothRaw(cur.raw); if (live.length > 2) { const gi = nearestGuide(gs, live[0]); if (gi >= 0) vm.flaps[gi].cover = Math.max(vm.flaps[gi].cover, Math.min(1, (cur.len / Math.max(0.2, gs[gi].len)) * 1.05)); } }
    }
    { const pi = D.layers.findIndex((l) => l.kind === 'press'); vm.relief = pi < 0 ? 0 : pi < L || done ? 1 : pi === L && covS.length ? covS.filter((c) => c > 0.8).length / covS.length : 0; }
    vm.dome = domeAt >= 0 ? smooth01((now - domeAt) / 0.9) : (wi >= 0 && wi < L ? 1 : 0);
    return vm;
  };
  const nearestGuide = (gs, p) => { let b = -1, bd = 0.09; gs.forEach((g, i) => { const d = dist(g.pts[0], [p.x, p.y]); if (d < bd) { bd = d; b = i; } }); return b; };

  const renderBall = (ctx, V, vm, t) => {
    const R = D.R * V.s, [cx, cy] = P2(V, C()), k = vm.dome, th = V.s * (0.012 + 0.026 * k);
    { const out = vm.fills.find((q) => q.region === 0 && D.layers[q.layer].kind === 'tint'), oc = out ? pal(out.col).color : DOUGH;   // the gloss of the lacquer returns a faint colour under the sweet
      ctx.save(); ctx.fillStyle = rg(ctx, cx, cy + R * 1.25, 0, R * 1.1, [[0, rgba(oc, 0.2)], [1, rgba(oc, 0)]]); ctx.beginPath(); ctx.ellipse(cx, cy + R * 1.25, R * 1.1, R * 0.5, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    ctx.save(); ctx.fillStyle = rg(ctx, cx + R * 0.1, cy + R * 0.22, R * 0.5, R * 1.3, [[0, 'rgba(0,0,0,0.65)'], [0.7, 'rgba(0,0,0,0.35)'], [1, 'rgba(0,0,0,0)']]); ctx.beginPath(); ctx.ellipse(cx + R * 0.1, cy + R * 0.2 + th, R * 1.28, R * 1.18, 0, 0, TAU); ctx.fill(); ctx.restore();   // the shadow it throws on the lacquer
    ballPath(ctx, V, 1, 0, th); ctx.fillStyle = lg(ctx, 0, cy, 0, cy + R + th, [[0, '#cdbfa6'], [1, '#8f7e66']]); ctx.fill();   // the side of the dough under the top face
    doughFlat(ctx, V, vm, t);
    if (!vm.ideal && vm.dome < 1) ankoAndFlaps(ctx, V, vm, t);
    petalRelief(ctx, V, vm.relief);
    grooves(ctx, V, vm.lines, t);
    lighting(ctx, V, k);
    strands(ctx, V, vm.ideal ? strandList([], true) : strandList(vm.rubs, false));
    stamens(ctx, V, vm.dabs);
  };

  const draw = (g, Rt, t) => {
    const { ctx } = g, W0r = Rt.work, dh = dockRect(W0r).h, Hw = clamp(0.26 * (W0r.h + dh), 70, 150);
    const top = Math.max(38, Hw * 0.62), box = { x: W0r.x + 8, y: W0r.y + top, w: W0r.w - 16, h: W0r.h - top - 6 }, f = fitBox(box, D.ar), V = { ox: f.ox, oy: f.oy, s: f.s };
    geo = { ox: V.ox, oy: V.oy, s: V.s, bw: V.s * D.ar };
    seasonBranch(ctx, W0r, Hw, now);
    { const pad = Math.ceil(V.s * 0.12), key = `${round}|${Math.round(V.s)}`;   // the tray and what lies under the sweet never change: bake them once per size
      if (!stageBake || stageBake.key !== key) { const sf = makeSurface(ctx, Math.ceil(V.s * D.ar + pad * 2), Math.ceil(V.s + pad * 2)); if (sf) { const sav = texCache; tray(sf.ctx, { ox: pad, oy: pad, s: V.s }); deco(sf.ctx, { ox: pad, oy: pad, s: V.s }); texCache = sav; } stageBake = { key, sf, pad }; }
      if (stageBake.sf) ctx.drawImage(stageBake.sf.canvas, V.ox - stageBake.pad, V.oy - stageBake.pad); else { tray(ctx, V); deco(ctx, V); } }
    renderBall(ctx, V, viewModel(false), now);
    if (!done) {   // guides
      const lay = layer(), pr = prep();
      if (lay.kind === 'stamen') { if (gmode !== 'off') pr.guides.forEach((gd, i) => { if ((covS[i] ?? 0) > 0.8) return; const [x, y] = P2(V, gd.pts[0]), k = 0.5 + 0.5 * Math.sin(now * 5); ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, V.s * (0.013 + 0.004 * k), 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(x, y, V.s * 0.004, 0, TAU); ctx.fill(); }); }
      else { let nS = -1, nR = -1; pr.guides.forEach((gd, i) => { if (nS < 0 && (covS[i] ?? 0) < 0.82) nS = i; }); pr.regions.forEach((r, i) => { if (nR < 0 && (covR[i] ?? 0) < 0.82) nR = i; }); if (pr.guides.length) nR = -1; ctx.save(); PR.drawGuides(ctx, V, pr, gmode, covS, covR, nS, nR, now, '#ffd36a'); ctx.restore(); }
    }
    const hand = auto?.hand ?? null, down = cur != null, tipX = hand && !ptr ? V.ox + hand[0] * V.s : ptr ? ptr.x : null, tipY = hand && !ptr ? V.oy + hand[1] * V.s : ptr ? ptr.y : null;
    if ((down || (hand && !ptr)) && tipX != null && !done) heldTool(ctx, layer().kind, tipX, tipY, Math.max(120, V.s * 0.36), now);
    toolHighlight(ctx, W0r);
    hintPill(g, ctx, W0r, hint());
    // the picture in the frame
    const th = Rt.thumb, ft = fitBox({ x: th.x + 8, y: th.y + 8, w: th.w - 16, h: th.h - 16 }, 1), Vt = { ox: ft.ox, oy: ft.oy, s: ft.s };
    shelf(ctx, th.x + th.w / 2, th.y + th.h - 3, th.w * 0.36);
    const key = `${round}|${Math.round(Vt.s)}`, drawThumb = (c2, Vv) => { const sav = texCache; texCache = null; tray(c2, Vv); deco(c2, Vv); renderBall(c2, Vv, viewModel(true), 99); texCache = sav; };
    if (!thumbBake || thumbBake.key !== key) { const sf = makeSurface(ctx, Math.ceil(Vt.s) + 4, Math.ceil(Vt.s) + 4); if (sf) { drawThumb(sf.ctx, { ox: 2, oy: 2, s: Vt.s }); thumbBake = { key, sf }; } else thumbBake = { key, sf: null }; }
    if (thumbBake.sf) ctx.drawImage(thumbBake.sf.canvas, Vt.ox - 2, Vt.oy - 2); else drawThumb(ctx, Vt);
  };
  const heldTool = (ctx, kind, x, y, s, t) => {   // the tool at the pointer, held in two fingers of a hand in an indigo sleeve
    const name = `kc-sweet-${TOOLS[kind]}`, sieve = TOOLS[kind] === 'sieve';
    ctx.save(); ctx.translate(x, y); ctx.rotate(-2.3 + (sieve ? 0 : Math.sin(t * 22) * 0.04));
    ctx.save(); ctx.translate(sieve ? -s * 0.28 : -s / 2, 0); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 6; drawProp(ctx, name, 0, 0, s, 0); ctx.restore();
    ctx.save(); ctx.translate(sieve ? -s * 0.6 : -s * 0.55, 0); drawPinch(ctx, s * 0.38, -1, '#33466a'); ctx.restore();
    ctx.restore(); void drawHeld;
  };
  const toolHighlight = (ctx, W0r) => {
    const d = dockRect(W0r), idx = TOOL_DOCK[TOOLS[layer().kind]]; if (idx == null || done) return;
    const n = 5, x = d.x + (d.w * (idx + 0.5)) / n, y = d.y + d.h * 0.52, w = (d.w / n) * 0.94, h = d.h * 0.92, k = 0.6 + 0.4 * Math.sin(now * 4);
    ctx.save(); rrect(ctx, x - w / 2, y - h / 2, w, h, 12); ctx.strokeStyle = `rgba(255,211,106,${0.55 + 0.35 * k})`; ctx.lineWidth = 2.5; ctx.stroke(); ctx.fillStyle = 'rgba(255,211,106,0.1)'; ctx.fill(); ctx.restore();
  };
  // a seasonal branch standing in the alcove behind the tray: camellia in winter, chrysanthemum in autumn
  const seasonBranch = (ctx, W0r, Hw, t) => {
    const x = W0r.x + W0r.w * 0.86, y0 = W0r.y + Hw * 0.88, H = Hw * 0.95;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x, y0, H * 0.22, H * 0.05, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = lg(ctx, x - H * 0.14, 0, x + H * 0.14, 0, [[0, '#3a2a22'], [0.4, '#7a5a44'], [1, '#2a1c16']]); ctx.beginPath(); ctx.moveTo(x - H * 0.16, y0); ctx.quadraticCurveTo(x - H * 0.2, y0 - H * 0.2, x - H * 0.1, y0 - H * 0.3); ctx.lineTo(x + H * 0.1, y0 - H * 0.3); ctx.quadraticCurveTo(x + H * 0.2, y0 - H * 0.2, x + H * 0.16, y0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#3a5a2a'; ctx.lineWidth = Math.max(2, H * 0.025); ctx.lineCap = 'round';
    const stems = D.id === 'camellia' ? [[-0.5, 0.7], [0.2, 0.9], [0.6, 0.62]] : [[-0.4, 0.82], [0.1, 0.95], [0.5, 0.7]];
    stems.forEach(([dx, hh], i) => {
      const sx = x + dx * H * 0.18, ex = x + dx * H * 0.5 + Math.sin(t * 0.6 + i) * 1.2, ey = y0 - H * 0.3 - H * hh * 0.7;
      ctx.strokeStyle = '#3a5a2a'; ctx.lineWidth = Math.max(2, H * 0.025); ctx.beginPath(); ctx.moveTo(sx, y0 - H * 0.3); ctx.quadraticCurveTo(sx + dx * H * 0.2, (y0 - H * 0.3 + ey) / 2, ex, ey); ctx.stroke();
      const rr = H * 0.1;
      if (D.id === 'camellia') { ctx.fillStyle = '#26663a'; ell(ctx, ex - H * 0.1, ey + H * 0.08, H * 0.13, H * 0.06, -0.5); ctx.fill(); ell(ctx, ex + H * 0.1, ey + H * 0.14, H * 0.12, H * 0.055, 0.5); ctx.fill(); ctx.fillStyle = rg(ctx, ex, ey, 1, rr, [[0, '#f8d0d8'], [0.6, '#d24c6b'], [1, '#8a2038']], ex - rr * 0.3, ey - rr * 0.3); ctx.beginPath(); ctx.arc(ex, ey, rr, 0, TAU); ctx.fill(); ctx.fillStyle = '#f1c64a'; ctx.beginPath(); ctx.arc(ex, ey, rr * 0.3, 0, TAU); ctx.fill(); }
      else { for (let p = 0; p < 14; p++) { const a = (p / 14) * TAU; ctx.strokeStyle = p % 2 ? '#f5d853' : '#e8b83c'; ctx.lineWidth = Math.max(1.5, rr * 0.22); ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + Math.cos(a) * rr, ey + Math.sin(a) * rr); ctx.stroke(); } ctx.fillStyle = '#9cbb44'; ctx.beginPath(); ctx.arc(ex, ey, rr * 0.28, 0, TAU); ctx.fill(); }
    });
    ctx.restore();
  };
  const titleArt = (g, S, t) => {
    const { ctx } = g, f = fitBox({ x: S.x + S.w * 0.04, y: S.y + S.h * 0.04, w: S.w * 0.92, h: S.h * 0.92 }, 1), V = { ox: f.ox, oy: f.oy, s: f.s };
    const sav = texCache; texCache = null; tray(ctx, V); deco(ctx, V); renderBall(ctx, V, viewModel(true), 99 + (t ?? 0)); texCache = sav;
  };

  // ---- information and state ---------------------------------------------------------------------------------------------------------------
  const hint = () => {
    if (done) return '';
    const lay = layer();
    if (lay.kind === 'tint') { const i = prep().regions.findIndex((_, k) => (covR[k] ?? 0) < 0.82); if (i >= 0) { const r = prep().regions[i]; return `Pick ${pal(r.col).name.toLowerCase()} and tap the ${r.label}`; } return 'Both layers are tinted: press Next'; }
    if (lay.kind === 'sieve') return (covR[0] ?? 0) < 0.82 ? lay.hint : 'The heart is sifted: press Next';
    const i = prep().guides.findIndex((_, k) => (covS[k] ?? 0) < 0.82);
    if (i >= 0) return lay.hint;
    return L >= D.layers.length - 1 ? 'The sweet is finished: press Finish' : 'This step is complete: press Next';
  };
  const state = () => {
    const c = compute();
    return {
      technique: 'sweet-nerikiri', design: D.id, layer: L, layers: D.layers.length, kind: layer().kind, color: colorSel, strokes: items.length,
      guides: prep().guides.map((g) => ({ n: g.pts.length })), regions: prep().regions.map((r) => ({ col: r.col, n: r.cells.length })),
      todoS: prep().guides.map((_, k) => k).filter((k) => (covS[k] ?? 0) < 0.8), todoR: prep().regions.map((_, k) => k).filter((k) => (covR[k] ?? 0) < 0.8),
      parts: { line: c.line == null ? null : Math.round(c.line * 1000) / 1000, good: c.goodLine == null ? null : Math.round(c.goodLine * 1000) / 1000, fill: c.fill == null ? null : Math.round(c.fill * 1000) / 1000, stray: Math.round(c.stray * 1000) / 1000 },
      layerScores: layerScores.slice(), dome: domeAt >= 0,
    };
  };
  init();
  return {
    init, items: items_, control, work, tick, draw, attract, titleArt, result: () => done, score: total, hint,
    info: () => { const c = compute(), lay = layer(); return [`Step ${L + 1} of ${D.layers.length}: ${lay.name}`, c.line != null ? `Lines ${Math.round(c.line * 100)}%  Clean ${Math.round((c.goodLine ?? 0) * 100)}%` : `Covered ${Math.round((c.fill ?? 0) * 100)}%`]; },
    get caption() { return SC.words?.caption ?? `Sculpt this ${D.name.toLowerCase()}`; },
    rules: () => [
      'Tint: pick a dough colour, then tap the shape it belongs to. Each layer takes one colour; the wrong colour counts as not covered.',
      'Wrap: with the bamboo spatula, draw each lit stroke from the rim to the middle to fold a flap of dough over the filling. When every flap is in, the dough rounds into a ball.',
      'Press: draw the triangle stick slowly along each lit petal line to cut a clean groove. A fast stroke only scratches and counts for less.',
      'Scrape: draw the three-pronged scraper along each lit line to lay three fine grooves at once.',
      'Sift: rub the fine sieve back and forth over the lit heart until it is covered with soft strands. Set the stamens (where the design has them) by tapping each lit mark with the tweezers.',
      'Score: each step is scored on its own, by colour and coverage or by how closely and how cleanly your lines follow the guide, and the steps are averaged. Doing nothing scores nothing.',
    ],
    point(id) {
      if (!geo) return null;
      const [k, rest] = id.split(':');
      if (k === 'g') { const [gi, f] = rest.split(',').map(Number), gd = prep().guides[gi]; if (!gd) return null; const q = gd.pts[Math.round(clamp(f, 0, 1) * (gd.pts.length - 1))]; return { x: geo.ox + q[0] * geo.s, y: geo.oy + q[1] * geo.s }; }
      if (k === 'r') { const r = prep().regions[Number(rest)]; return r ? { x: geo.ox + r.at[0] * geo.s, y: geo.oy + r.at[1] * geo.s } : null; }
      if (k === 'zone') { const z = zoneOf(); if (!z) return null; const [a, rr] = rest.split(',').map(Number); return { x: geo.ox + (z.c[0] + Math.cos(a) * z.r * rr) * geo.s, y: geo.oy + (z.c[1] + Math.sin(a) * z.r * rr) * geo.s }; }
      return null;
    },
    state,
    get design() { return D; },
  };
}

registerTechnique('sweet-nerikiri', { make: (P, env) => createNerikiri({ ...NERIKIRI_DEFAULTS, ...P }, env), scene: 'kc-sweet-alcove', mat: 'clay' });

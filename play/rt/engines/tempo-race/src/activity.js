// Tempo Race activity (docs/ENGINE-CONTRACT.md "Activity engines"): real-time races where timing, rhythm and pacing decide
// the result. Model in model.js, drawing in draw.js. Deterministic: randomness only via env.rng, time only via dt.
import { resolve, createPlayer, createBot, createLead, reference, createRivals, placePoints, heatStars, heatScore, qualityOf, leadShare, windShift, curveAt, bendAt, roughAt } from './model.js';
import { hash, scenery, texture, racer, checker, leadObject } from './draw.js';

const RIVAL_COLORS = ['#e0603a', '#f2c14e', '#58c27d', '#b07be0', '#ef8fb5', '#4fc3d9', '#d8d8d8'];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ordinal = (n) => ['', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth'][n] ?? `${n}th`;
const fmtTime = (t) => (t >= 60 ? `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}` : `${t.toFixed(1)} s`);

export function createActivity(userParams, env) {
  const P = resolve(userParams);
  const { rng, palette: pal } = env;
  const C = P.course, V = P.vehicle, kind = V.kind, N = P.opponents.count, L = C.length, cols = P.colors;
  const lanes = C.lanes, playerLane = Math.floor(lanes / 2);
  let pl, bot, rivals, ref, heat, heats, phase, cd, linger, between, done, layout = null, padDown, prevKey, lastBeat, tip, lead = null, caughtFlash = 0;
  const LD = C.lead;

  const startHeat = () => {
    ref = reference(P);
    rivals = null;
    // the lead's wobble phase comes from rng only when a lead exists, so lead-free games keep their exact sequences
    lead = LD ? createLead(P, ref, rng.range(0, 6.2832)) : null;
    pl = createPlayer(P, lead); bot = createBot(P, pl); caughtFlash = 0;
    rivals = createRivals(P, ref.time, rng, heat);
    phase = 'ready'; cd = 2.6; linger = 0; between = 0; padDown = false; prevKey = false; lastBeat = 0;
    pl.m.playerFin = null;
  };
  const init = () => { heat = 0; heats = []; done = null; tip = ''; startHeat(); };
  init();

  const tone = (o) => env.audio?.tone?.(o);
  const placeNow = () => {
    const m = pl.m; let p = 1;
    for (const r of rivals) { if (r.fin !== null || r.pos(m.rt) > m.x) p++; }
    return p;
  };
  const curShare = () => (LD ? leadShare(P, pl.proximity(), pl.m.caught) : 0);
  const liveScore = () => {
    const place = phase === 'finish' || phase === 'between' ? (heats[heat]?.place ?? placeNow()) : placeNow();
    const s = heatScore(P, place, N, pl.rhythm(), curShare());
    const prior = heats.slice(0, heat).reduce((a, h) => a + h.score, 0);
    return Math.round((prior + (phase === 'ready' ? 0 : s)) / P.rounds);
  };

  const endHeat = () => {
    const h = heats[heat];
    if (heat + 1 < P.rounds) { phase = 'between'; between = 0; return; }
    const sc = Math.round(heats.reduce((a, x) => a + x.score, 0) / heats.length);
    const avg = heats.reduce((a, x) => a + x.stars, 0) / heats.length;
    const stars = avg >= 2.5 ? 3 : avg >= 1.5 ? 2 : avg >= 0.5 ? 1 : 0;
    const best = Math.min(...heats.map((x) => x.place));
    done = {
      score: sc, max: 100, stars,
      headline: P.rounds === 1 ? (h.place === 1 ? 'You won the race!' : h.time === null ? 'Did not finish' : `${ordinal(h.place)} place`) : stars === 3 ? 'Champion of the heats' : stars ? 'A good series' : 'Keep practising',
      detail: (P.rounds === 1 ? (h.time === null ? 'Keep to the beat to finish' : `${fmtTime(h.time)} · rhythm ${Math.round(h.rhythm * 100)}%`) : `${heats.length} heats · best place ${best} · rhythm ${Math.round((heats.reduce((a, x) => a + x.rhythm, 0) / heats.length) * 100)}%`)
        + (LD ? ` · ${LD.label.toLowerCase()} held ${Math.round((heats.reduce((a, x) => a + x.lead, 0) / heats.length) * 100)}%${LD.capture === 'catch' ? (heats.some((x) => x.caught) ? ` · caught ${heats.filter((x) => x.caught).length}/${heats.length}` : ' · not caught') : ''}` : ''),
    };
  };

  const finishHeat = (time) => {
    const m = pl.m;
    const place = time === null ? N + 1 : 1 + rivals.filter((r) => r.fin !== null && r.fin < time).length;
    const rhythm = pl.rhythm(), share = curShare(), quality = qualityOf(P, rhythm, share);
    const stars = time === null ? 0 : heatStars(place, N, quality, Math.min(P.rhythmStars, 0.85 * ref.quality));
    const score = time === null ? Math.round(10 * quality) : heatScore(P, place, N, rhythm, share);
    heats[heat] = { place, time, rhythm, stars, score, clean: m.clean, hits: m.stumbles, lead: share, caught: m.caught };
    phase = 'finish'; linger = 2.4;
    tone({ freq: 523, to: 784, dur: 0.3, type: 'triangle' });
  };

  const idle = { stroke: 0, down: false, pressed: false, released: false, side: 0 };

  const readInput = (input) => {
    const p = input.pointer, k = input.keys, a = layout?.area;
    const inside = a && p.x >= a.x && p.x <= a.x + a.w && p.y >= a.y && p.y <= a.y + a.h;
    const cx = a ? a.x + a.w / 2 : 360;
    const inp = { stroke: 0, down: false, pressed: false, released: false, side: 0 };
    if (p.pressed && inside) { padDown = true; inp.pressed = true; inp.stroke = p.x < cx ? -1 : 1; }
    if (!p.down) { if (padDown && p.released) inp.released = true; padDown = false; }
    const kL = k.down.has('ArrowLeft') || k.down.has('KeyA'), kR = k.down.has('ArrowRight') || k.down.has('KeyD'), kS = k.down.has('Space');
    if (k.pressed.has('ArrowLeft') || k.pressed.has('KeyA')) { inp.stroke = -1; inp.pressed = true; }
    else if (k.pressed.has('ArrowRight') || k.pressed.has('KeyD')) { inp.stroke = 1; inp.pressed = true; }
    else if (k.pressed.has('Space')) { inp.stroke = 2; inp.pressed = true; }
    const keyDown = kL || kR || kS;
    if (prevKey && !keyDown) inp.released = true;
    prevKey = keyDown;
    inp.side = padDown ? (p.x < cx ? -1 : 1) : kL && !kR ? -1 : kR && !kL ? 1 : 0;
    inp.down = padDown || keyDown;
    if (kind === 'animal' && inp.stroke) inp.stroke = 0;   // a tap is a whip (press and release), not a stroke
    return inp;
  };

  const tick = (dt, inp, auto) => {
    if (done) return;
    const m = pl.m;
    if (phase === 'ready') {
      const before = cd; cd -= dt;
      for (const mark of [1.8, 1.0, 0.2]) if (before > mark && cd <= mark) tone({ freq: 330, dur: 0.1, type: 'triangle', vol: 0.5 });
      if (cd <= 0) { phase = 'race'; tone({ freq: 660, dur: 0.25, type: 'triangle' }); }
      return;
    }
    if (phase === 'between') {
      between += dt;
      if ((auto && between > 1.8) || (!auto && inp.pressed && between > 0.4)) { heat++; startHeat(); }
      return;
    }
    const playing = phase === 'race';
    pl.step(dt, playing ? inp : idle);
    for (const r of rivals) if (r.fin === null && r.pos(m.rt) >= L) r.fin = m.rt;
    if (caughtFlash > 0) caughtFlash = Math.max(0, caughtFlash - dt);
    if (m.leadEvent === 'caught') { caughtFlash = 1.8; tone({ freq: 523, to: 1047, dur: 0.35, type: 'triangle' }); }
    if (m.event?.type === 'hit') tone({ freq: 140, dur: 0.18, type: 'sawtooth', vol: 0.5 });
    else if (m.event?.type === 'stroke') tone({ freq: m.event.grade === 'perfect' ? 620 : m.event.grade === 'miss' ? 150 : 460, dur: 0.06, type: 'triangle', vol: 0.5 });
    if (playing && P.rhythm.drum && kind !== 'sailor') {
      const b = Math.floor(m.rt / pl.T);
      if (b > lastBeat) { lastBeat = b; tone({ freq: 96, dur: 0.09, type: 'sine', vol: 0.35 }); }
    }
    if (playing) {
      if (m.finished) finishHeat(m.rt - (m.x - L) / Math.max(1, m.v));
      else if (rivals.every((r) => r.fin !== null) && m.rt > Math.max(...rivals.map((r) => r.fin)) + 0.6 * ref.time) finishHeat(null);
      else if (m.rt > ref.time * 2.2) finishHeat(null);
    } else if (phase === 'finish') {
      linger -= dt;
      if (linger <= 0) endHeat();
    }
  };

  const act = {
    init,
    update(dt, input) { tick(dt, phase === 'race' ? readInput(input) : { ...idle, pressed: input.pointer.pressed || input.keys.pressed.size > 0 }, false); },
    attract(dt) { tick(dt, phase === 'race' ? bot(dt) : { ...idle }, true); },
    point(id) {
      if (!layout) return null;
      const { pads } = layout;
      const q = id === 'left' ? pads[0] : id === 'right' ? pads[pads.length - 1] : pads[0];
      return { x: q.x + q.w / 2, y: q.y + q.h / 2 };
    },
    status() {
      const m = pl.m;
      let label;
      if (phase === 'ready') label = 'Get ready';
      else if (phase === 'between') label = `Heat ${heat + 1} done`;
      else label = `${P.rounds > 1 ? `Heat ${heat + 1}/${P.rounds} · ` : ''}Place ${placeNow()} of ${N + 1} · ${Math.max(0, Math.ceil(L - m.x))} ${P.labels.unit} to go${LD ? ` · ${m.caught ? `${LD.label.toLowerCase()} caught` : `${LD.label.toLowerCase()} ${m.gap >= 0 ? '+' : '-'}${Math.abs(Math.round(m.gap))} ${P.labels.unit}`}` : ''}`;
      return { score: liveScore(), max: 100, label };
    },
    result: () => done,
    hint() {
      const m = pl.m;
      if (LD && m.gap > LD.reach && !m.caught) return `The ${LD.label.toLowerCase()} is getting away: keep your rhythm and close the gap to within ${Math.round(LD.reach)} ${P.labels.unit}.`;
      if (kind === 'animal') return m.blown || m.st < 0.2 ? 'Let go and let the animal recover; it only gallops well with strength.' : 'Hold to gallop, tap on the stride to whip. Ration your strength for the finish.';
      if (kind === 'sailor') return 'Hold left or right to move the sail trim until the white dot sits on the gold marker.';
      if (kind === 'sled') return 'Push on the drum at the start, then hold the side the next bend turns toward.';
      if (m.st < 0.25) return 'You are tiring. Strike exactly on the beat; off-beat strokes waste strength.';
      if (kind === 'skater') return 'Push when the ring closes: even glides, never in a hurry.';
      if (kind === 'runner') return 'Alternate feet on every drum beat: same foot twice means a stumble.';
      return 'Strike when the ring meets the pad and alternate sides to stay in your lane.';
    },
    rules: () => [
      `Course: ${L} ${P.labels.unit}, ${lanes} lanes, ${C.shape} track, ${N} opponents at your side.`,
      kind === 'animal' ? 'Hold to gallop; strength drains while you gallop and returns while you ease off.' : kind === 'sailor' || kind === 'sled' ? 'Alignment with the wind or the curve sets your speed.' : `The beat is ${Math.round(P.rhythm.bpm)} per minute: strokes in the window give a boost, mashing costs strength.`,
      ...(LD ? [LD.capture === 'catch' ? `A ${LD.label.toLowerCase()} runs ahead: stay within ${Math.round(LD.reach)} ${P.labels.unit} behind it for points, and run it down for a bonus.` : `A ${LD.label.toLowerCase()} runs ahead: staying within ${Math.round(LD.reach)} ${P.labels.unit} behind it earns points.`] : []),
      'Stars: finish first with a steady rhythm for three; first alone for two; on the podium for one.',
    ],
    getState: () => {
      const m = pl.m;
      return {
        kind, phase, heat, rounds: P.rounds, rt: +m.rt.toFixed(3), T: +pl.T.toFixed(4), nextBeat: +(Math.max(1, Math.ceil(m.rt / pl.T - 1e-9)) * pl.T).toFixed(3),
        x: +m.x.toFixed(2), v: +m.v.toFixed(2), stamina: +m.st.toFixed(3), q: +m.q.toFixed(3), rhythm: +pl.rhythm().toFixed(3), place: placeNow(),
        lean: +m.lean.toFixed(2), trim: +m.trim.toFixed(2), ideal: kind === 'sailor' ? +windShift(C, m.x).toFixed(3) : kind === 'sled' ? +curveAt(C, m.x + m.v * 0.12).toFixed(3) : 0, startPush: kind === 'sled' ? V.startPush : 0, lat: +m.lat.toFixed(2), counts: { perfect: m.perfect, good: m.good, ok: m.ok, miss: m.miss, stumbles: m.stumbles, clean: m.clean },
        lead: lead ? { x: +lead.x(m.rt).toFixed(2), gap: +m.gap.toFixed(2), credit: +m.credit.toFixed(3), caught: m.caught, share: +curShare().toFixed(3), prox: +pl.proximity().toFixed(3) } : null,
        ref: +ref.time.toFixed(2), rivals: rivals.map((r) => +r.pos(m.rt).toFixed(1)), heats, nextSide: m.nextSide, lastT: +m.lastT.toFixed(3), cool: +m.cool.toFixed(2), blown: m.blown,
      };
    },
    render(g, area) { renderAll(g, area); },
  };

  // ---------------------------------------------------------------------------------------------------------------
  // drawing
  // ---------------------------------------------------------------------------------------------------------------
  const renderAll = (g, area) => {
    const { ctx } = g;
    const regH = clamp(area.h * 0.27, 150, 270), gap = 6;
    const view = { x: area.x, y: area.y, w: area.w, h: area.h - regH - gap };
    const rowH = 38, padY = area.y + view.h + gap + rowH, padH = regH - rowH;
    const two = V.pads === 2;
    const pads = two
      ? [{ x: area.x, y: padY, w: area.w / 2 - 5, h: padH }, { x: area.x + area.w / 2 + 5, y: padY, w: area.w / 2 - 5, h: padH }]
      : [{ x: area.x, y: padY, w: area.w, h: padH }];
    layout = { area, view, pads, row: { x: area.x, y: area.y + view.h + gap, w: area.w, h: rowH } };
    const m = pl.m;
    ctx.save(); ctx.beginPath(); ctx.rect(view.x, view.y, view.w, view.h); ctx.clip();
    if (C.shape === 'loop') drawLoop(g, view); else drawScroll(g, view);
    drawHud(g, view);
    ctx.restore();
    drawControls(g, area);
    void m;
  };

  const racerList = () => {
    const m = pl.m;
    const list = rivals.map((r) => ({ s: Math.min(r.pos(m.rt), L + 3), lane: r.lane, lat: Math.sin(m.rt * 1.1 + r.wob) * 0.12, color: RIVAL_COLORS[r.i % RIVAL_COLORS.length], me: false, i: r.i }));
    list.push({ s: Math.min(m.x, L + 3), lane: playerLane, lat: kind === 'paddle' ? m.lat * 0.4 : 0, color: P.colors.player ?? '#2b6fe0', me: true, i: -1 });
    return list.sort((a, b) => a.s - b.s);
  };
  const exFor = (r) => (r.me ? { lean: pl.m.lean, trim: pl.m.trim, gallop: pl.m.gallop, whip: pl.m.burst > 0, look: V.look } : { lean: Math.sin(r.s * 0.05) * 0.6, trim: Math.sin(r.s * 0.03 + r.i) * 0.5, gallop: true, whip: false, look: V.look });
  const phaseOf = (r) => r.s * (kind === 'runner' ? 1.1 : kind === 'paddle' ? 0.8 : kind === 'animal' ? 0.6 : 0.45);

  const leadPos = () => { const m = pl.m; return Math.min(L + 30, m.caught ? m.x + 1.8 : lead.x(m.rt)); };
  const leadDraw = (ctx, x, y, ang, rs, fl) => {
    const m = pl.m, lx = leadPos();
    leadObject(ctx, LD.kind, x, y, ang, rs * LD.size * (LD.kind === 'pacemaker' ? 1 : 0.8), LD.color, lx / 0.9, m.caught ? 0 : lead.hop(lx), { vehicle: kind, look: V.look, fl: m.rt * 9 + fl });
    if (m.caught && caughtFlash > 0) { ctx.strokeStyle = '#ffe38a'; ctx.lineWidth = 4; ctx.globalAlpha = caughtFlash / 1.8; ctx.beginPath(); ctx.arc(x, y, rs * (1.2 + (1.8 - caughtFlash) * 1.4), 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
  };

  const drawMarker = (ctx, x, y, s, color) => { ctx.fillStyle = color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, s * 1.55, 0, 7); ctx.globalAlpha = 0.9; ctx.stroke(); ctx.globalAlpha = 1; };

  // straight and zigzag: scrolling course, camera follows the player; forward is up (portrait) or right (landscape)
  const drawScroll = (g, V0) => {
    const { ctx } = g;
    const m = pl.m;
    const portrait = V0.h >= V0.w * 0.9;
    const along = portrait ? V0.h : V0.w, cross = portrait ? V0.w : V0.h;
    const laneW = Math.min((cross * 0.78) / lanes, along * 0.2, 150);
    const trackW = laneW * lanes;
    const visible = C.visible || V.topSpeed * 5.5;
    const ppm = along / Math.max(20, visible), anchor = along * 0.3;
    const camS = Math.min(m.x, L + 4);
    const bendPx = cross * 0.17;
    const proj = (s, off, par = 1) => {
      const sp = camS + (s - camS) * par;
      const u = anchor + (sp - camS) * ppm * (par === 1 ? 1 : 1);
      const lat = off + bendAt(C, sp) * bendPx * (par === 1 ? 1 : par);
      return portrait ? [V0.x + V0.w / 2 + lat, V0.y + V0.h - u] : [V0.x + u, V0.y + V0.h / 2 + lat];
    };
    const sBack = camS - anchor / ppm - 3, sFwd = camS + (along - anchor) / ppm + 3;
    // banks
    ctx.fillStyle = cols.bank; ctx.fillRect(V0.x, V0.y, V0.w, V0.h);
    // far parallax scenery (slower), then near
    const sp1 = 9, sp2 = 6;
    const layer = (par, spacing, off0, sizeMul, seed) => {
      const first = Math.floor((camS + (sBack - camS) / par) / spacing) - 1, last = Math.ceil((camS + (sFwd - camS) / par) / spacing) + 1;
      for (let n = first; n <= last; n++) {
        const hs = hash(n * 31 + seed), side = hash(n * 17 + seed) > 0.5 ? 1 : -1;
        const s = n * spacing + (hs - 0.5) * spacing * 0.6;
        const [x, y] = proj(s, side * (trackW / 2 + off0 + hash(n * 5 + seed) * laneW * 1.4), par);
        scenery(ctx, C.scenery, x, y, laneW * sizeMul, hs);
      }
    };
    layer(0.6, sp1, laneW * 1.4, 0.8, 11);
    // track ribbon
    const step = 10 / ppm;
    const edge = (off) => { const pts = []; for (let s = sBack; s <= sFwd; s += step) pts.push(proj(s, off)); return pts; };
    const left = edge(-trackW / 2), right = edge(trackW / 2);
    ctx.fillStyle = cols.ground; ctx.beginPath();
    left.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath(); ctx.fill();
    // texture marks
    const tsp = 4, t0 = Math.floor(sBack / tsp), t1 = Math.ceil(sFwd / tsp);
    for (let n = t0; n <= t1; n++) for (let j = 0; j < 3; j++) {
      const r = hash(n * 13 + j * 101), r2 = hash(n * 7 + j * 53);
      const [x, y] = proj(n * tsp + r * tsp, (r2 - 0.5) * trackW * 0.95);
      texture(ctx, C.terrain, x, y, laneW * 0.6, r, cols.ground2);
    }
    // rough patches
    for (const rg of C.rough) {
      if (rg.to < sBack || rg.from > sFwd) continue;
      const a = Math.max(rg.from, sBack), b = Math.min(rg.to, sFwd);
      const pts = [];
      for (let s = a; s <= b; s += step) pts.push(proj(s, -trackW / 2));
      for (let s = b; s >= a; s -= step) pts.push(proj(s, trackW / 2));
      ctx.fillStyle = 'rgba(40,30,20,0.22)'; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill();
      for (let s = Math.ceil(a / 2) * 2; s < b; s += 2) for (let j = 0; j < 2; j++) { const r = hash(Math.floor(s) * 3 + j); const [x, y] = proj(s, (r - 0.5) * trackW * 0.9); texture(ctx, C.terrain, x, y, laneW * 0.7, r, ['water', 'ice', 'snow'].includes(C.terrain) ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.28)'); }
    }
    // edges and lane lines
    ctx.lineWidth = Math.max(3, laneW * 0.07); ctx.strokeStyle = cols.edge;
    for (const side of [left, right]) { ctx.beginPath(); side.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }
    ctx.setLineDash([laneW * 0.35, laneW * 0.35]); ctx.lineDashOffset = -((camS * ppm) % (laneW * 0.7)); ctx.globalAlpha = 0.7; ctx.lineWidth = 2;
    for (let k = 1; k < lanes; k++) { const pts = edge((k - lanes / 2) * laneW); ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    // start, obstacles, finish
    const across = (s, w, fn) => { const [x1, y1] = proj(s, -trackW / 2), [x2, y2] = proj(s, trackW / 2); fn(x1, y1, x2, y2, w); };
    across(0, 10, (x1, y1, x2, y2, w) => { ctx.strokeStyle = '#fff'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); });
    for (const o of C.obstacles) {
      if (o.at < sBack || o.at > sFwd) continue;
      across(o.at, 12, (x1, y1, x2, y2) => drawObstacle(ctx, o.kind, x1, y1, x2, y2, laneW, o.at < pl.m.x));
    }
    across(L, 18, (x1, y1, x2, y2, w) => { ctx.strokeStyle = '#fff'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.strokeStyle = '#111'; ctx.setLineDash([w, w]); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]); });
    // near scenery drawn over the bank only (outside the track) on top of the ground edge
    layer(1, sp2, laneW * 0.55, 1, 23);
    // racers
    const rs = laneW * 0.5;
    for (const r of racerList()) {
      if (r.s < sBack - 2 || r.s > sFwd + 2) continue;
      const off = (r.lane + 0.5 - lanes / 2 + r.lat) * laneW;
      const [x, y] = proj(r.s, off), [x0, y0] = proj(r.s - 0.6, off), [x1, y1] = proj(r.s + 0.6, off);
      const ang = Math.atan2(y1 - y0, x1 - x0);
      if (r.me) drawMarker(ctx, x, y, rs, '#fff');
      racer(ctx, kind, x, y, ang, rs, r.color, phaseOf(r), exFor(r));
      // wake / trail
      if (r.me && pl.m.v > 0.5 * V.topSpeed) { ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3; const [bx, by] = proj(r.s - 2.5, off); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(bx, by); ctx.stroke(); }
    }
    if (lead) {
      const lx = leadPos();
      if (lx >= sBack - 2 && lx <= sFwd + 2) {
        const off = ((pl.m.caught ? 0 : lead.lat(lx)) + (pl.m.caught ? playerLane + 0.5 - lanes / 2 : 0)) * laneW;
        const [x, y] = proj(lx, off), [x0, y0] = proj(lx - 0.6, off), [x1, y1] = proj(lx + 0.6, off);
        leadDraw(ctx, x, y, Math.atan2(y1 - y0, x1 - x0), rs, 0);
      } else if (lx > sFwd) {
        // off the top (or right) of the view: a pointer with the distance
        const [x, y] = proj(sFwd - 1, (playerLane + 0.5 - lanes / 2) * laneW);
        ctx.fillStyle = LD.color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); if (portrait) { ctx.moveTo(x, y - 14); ctx.lineTo(x - 12, y + 6); ctx.lineTo(x + 12, y + 6); } else { ctx.moveTo(x + 14, y); ctx.lineTo(x - 6, y - 12); ctx.lineTo(x - 6, y + 12); } ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
    void sp1;
  };

  const drawObstacle = (ctx, okind, x1, y1, x2, y2, laneW, passed) => {
    ctx.globalAlpha = passed ? 0.45 : 1;
    const n = 6;
    switch (okind) {
      case 'hurdle': case 'log':
        ctx.strokeStyle = '#7a4e2a'; ctx.lineWidth = laneW * 0.16; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.strokeStyle = '#e8d3a0'; ctx.setLineDash([laneW * 0.2, laneW * 0.2]); ctx.lineWidth = laneW * 0.08; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]); break;
      case 'rapids': case 'waves': case 'snowdrift':
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(3, laneW * 0.07);
        for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; const x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t; ctx.beginPath(); ctx.arc(x, y, laneW * 0.28, 0.3, 2.8); ctx.stroke(); }
        break;
      case 'buoy':
        for (let i = 0; i <= 3; i++) { const t = i / 3; const x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t; ctx.fillStyle = i % 2 ? '#f2f2f2' : '#e0603a'; ctx.beginPath(); ctx.arc(x, y, laneW * 0.16, 0, 7); ctx.fill(); }
        break;
      default:
        ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = Math.max(3, laneW * 0.06); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        for (const [x, y] of [[x1, y1], [x2, y2]]) { ctx.fillStyle = '#e0603a'; ctx.beginPath(); ctx.arc(x, y, Math.min(laneW * 0.14, 16), 0, 7); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  };

  // loop: the whole oval in view, racers circle it (laps = length / lapLength)
  const drawLoop = (g, V0) => {
    const { ctx } = g;
    const m = pl.m;
    const portrait = V0.h > V0.w;
    const Wc = portrait ? V0.h : V0.w, Hc = portrait ? V0.w : V0.h;
    const laneW = Math.max(10, Math.min((Hc - 80) / 2 / lanes, 64));
    const trackW = laneW * lanes;
    const rho = Math.max(20, (Hc - trackW - 56) / 2);
    const a = Math.max(rho * 0.2, (Wc - 2 * rho - trackW - 56) / 2);
    const Lc = 4 * a + 2 * Math.PI * rho;
    const cx = V0.x + V0.w / 2, cy = V0.y + V0.h / 2;
    const toScreen = (xc, yc) => (portrait ? [cx - yc, cy + xc] : [cx + xc, cy + yc]);
    const at = (s, off) => {
      let d = (((s % C.lapLength) / C.lapLength) * Lc + a) % Lc;
      let x, y, tx, ty, nx, ny;
      if (d < 2 * a) { x = -a + d; y = rho; tx = 1; ty = 0; nx = 0; ny = 1; }
      else if ((d -= 2 * a) < Math.PI * rho) { const f = d / rho; x = a + rho * Math.sin(f); y = rho * Math.cos(f); tx = Math.cos(f); ty = -Math.sin(f); nx = Math.sin(f); ny = Math.cos(f); }
      else if ((d -= Math.PI * rho) < 2 * a) { x = a - d; y = -rho; tx = -1; ty = 0; nx = 0; ny = -1; }
      else { d -= 2 * a; const f = d / rho; x = -a - rho * Math.sin(f); y = -rho * Math.cos(f); tx = -Math.cos(f); ty = Math.sin(f); nx = -Math.sin(f); ny = -Math.cos(f); }
      x += nx * off; y += ny * off;
      const [sx, sy] = toScreen(x, y);
      const [ex, ey] = toScreen(x + tx, y + ty);
      return [sx, sy, Math.atan2(ey - sy, ex - sx)];
    };
    ctx.fillStyle = cols.bank; ctx.fillRect(V0.x, V0.y, V0.w, V0.h);
    ctx.save(); ctx.translate(cx, cy); if (portrait) ctx.rotate(Math.PI / 2);
    const stadium = (r2raw, fill, stroke, lw) => { const r2 = Math.max(1, r2raw); g.rr(ctx, -a - r2, -r2, 2 * a + 2 * r2, 2 * r2, r2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } };
    stadium(rho + trackW / 2 + 8, cols.edge); stadium(rho + trackW / 2, cols.ground);
    stadium(rho - trackW / 2, cols.bank, cols.edge, 4);
    ctx.globalAlpha = 0.6; ctx.setLineDash([laneW * 0.3, laneW * 0.3]);
    for (let k = 1; k < lanes; k++) stadium(rho + (k - lanes / 2) * laneW, null, cols.edge, 2);
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    ctx.restore();
    // texture along the track
    for (let n = 0; n < 40; n++) { const r = hash(n * 13), r2 = hash(n * 7 + 3); const [x, y] = at(r * C.lapLength, (r2 - 0.5) * trackW * 0.9); texture(ctx, C.terrain, x, y, laneW * 0.6, r, cols.ground2); }
    // obstacles on the lap
    for (const o of C.obstacles) {
      const ang = (o.at % C.lapLength);
      const [x1, y1] = at(ang, -trackW / 2), [x2, y2] = at(ang, trackW / 2);
      drawObstacle(ctx, o.kind, x1, y1, x2, y2, laneW, false);
    }
    // start/finish line
    { const [x1, y1] = at(0, -trackW / 2), [x2, y2] = at(0, trackW / 2); ctx.strokeStyle = '#fff'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.strokeStyle = '#111'; ctx.setLineDash([12, 12]); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]); }
    // scenery in the infield
    const [icx, icy] = [cx, cy];
    const laps = Math.max(1, Math.round(L / C.lapLength));
    const lapNow = Math.min(laps, Math.floor(Math.min(m.x, L - 0.01) / C.lapLength) + 1);
    const inner = Math.max(0, rho - trackW / 2);
    if (inner > laneW) { const n = Math.min(4, Math.floor((a * 2 + inner) / (laneW * 1.4))); for (let i = 0; i < n; i++) { const r = hash(i * 3 + 9); const off = (i - (n - 1) / 2) * laneW * 1.4; scenery(ctx, C.scenery, portrait ? icx : icx + off, portrait ? icy + off : icy - inner * 0.45, laneW * 0.8, r); } }
    g.label(ctx, `Lap ${lapNow} / ${laps}`, icx + (portrait ? 0 : 0), icy + (inner > laneW ? inner * 0.25 : 0), g.px(24), '#fff', 'center', '700');
    const rs = laneW * 0.62;
    for (const r of racerList()) {
      const off = (r.lane + 0.5 - lanes / 2 + r.lat) * laneW;
      const [x, y, ang] = at(r.s, off);
      if (r.me) drawMarker(ctx, x, y, rs, '#fff');
      racer(ctx, kind, x, y, ang, rs, r.color, phaseOf(r), exFor(r));
    }
    if (lead) {
      const lx = leadPos();
      const off = (pl.m.caught ? playerLane + 0.5 - lanes / 2 : lead.lat(lx)) * laneW;
      const [x, y, ang] = at(lx, off);
      leadDraw(ctx, x, y, ang, rs, 0);
    }
  };

  const drawHud = (g, V0) => {
    const { ctx } = g;
    const m = pl.m;
    // race map bar
    const bx = V0.x + 18, bw = V0.w - 36, by = V0.y + 18;
    g.rr(ctx, bx, by - 6, bw, 12, 6); ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill();
    for (const o of C.obstacles) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(bx + (o.at / L) * bw - 1, by - 6, 2, 12); }
    checker(ctx, bx + bw - 8, by - 8, 8, 16, 4);
    if (lead) { const lx = clamp(leadPos() / L, 0, 1) * bw; ctx.fillStyle = LD.color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + lx, by - 9); ctx.lineTo(bx + lx + 7, by); ctx.lineTo(bx + lx, by + 9); ctx.lineTo(bx + lx - 7, by); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    for (const r of racerList()) { ctx.fillStyle = r.color; ctx.strokeStyle = r.me ? '#fff' : 'rgba(0,0,0,0.5)'; ctx.lineWidth = r.me ? 3 : 1.5; ctx.beginPath(); ctx.arc(bx + clamp(r.s / L, 0, 1) * bw, by, r.me ? 9 : 6, 0, 7); ctx.fill(); ctx.stroke(); }
    // speed readout
    g.rr(ctx, V0.x + 10, V0.y + 34, 100, 26, 13); ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill();
    g.rr(ctx, V0.x + V0.w - 110, V0.y + 34, 100, 26, 13); ctx.fill();
    g.label(ctx, `${(m.v * 3.6).toFixed(0)} km/h`, V0.x + 60, V0.y + 47, g.px(17), '#fff', 'center', '700');
    g.label(ctx, `${fmtTime(Math.max(0, m.rt))}`, V0.x + V0.w - 60, V0.y + 47, g.px(17), '#fff', 'center', '700');
    // distance to the lead and the proximity meter
    if (lead && (phase === 'race' || phase === 'finish')) {
      const cw = 190, cx0 = V0.x + V0.w / 2 - cw / 2, cy0 = V0.y + 29;
      g.rr(ctx, cx0, cy0, cw, 34, 17); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();
      const col = m.credit > 0.66 ? '#9be3a8' : m.credit > 0.2 ? '#ffe38a' : '#ffb59a';
      const txt = m.caught ? `${LD.label}: caught!` : `${LD.label} ${Math.abs(m.gap).toFixed(0)} ${P.labels.unit} ${m.gap >= 0 ? 'ahead' : 'behind'}`;
      g.label(ctx, txt, V0.x + V0.w / 2, cy0 + 14, g.px(16), '#fff', 'center', '700');
      g.rr(ctx, cx0 + 14, cy0 + 24, cw - 28, 5, 2.5); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();
      g.rr(ctx, cx0 + 14, cy0 + 24, Math.max(5, (cw - 28) * m.credit), 5, 2.5); ctx.fillStyle = col; ctx.fill();
    }
    // feedback flash
    if (m.flashT > 0 && m.flash && phase === 'race') {
      ctx.globalAlpha = clamp(m.flashT / 0.35, 0, 1);
      g.label(ctx, m.flash, V0.x + V0.w / 2, V0.y + V0.h * 0.3 - (0.7 - m.flashT) * 30, g.px(30), m.tone === 'bad' ? '#ff9a7a' : '#ffe38a', 'center', '800');
      ctx.globalAlpha = 1;
    }
    const mid = [V0.x + V0.w / 2, V0.y + V0.h * 0.42];
    if (phase === 'ready') {
      const n = cd > 1.8 ? '3' : cd > 1.0 ? '2' : cd > 0.2 ? '1' : 'GO';
      g.label(ctx, n, mid[0], mid[1], g.px(110), '#fff', 'center', '900');
      g.label(ctx, kind === 'animal' ? 'Hold to gallop' : kind === 'sailor' || kind === 'sled' ? 'Hold a side to steer' : 'Strike with the drum', mid[0], mid[1] + g.px(80), g.px(24), '#fff', 'center', '600');
    }
    if (phase === 'finish') {
      const h = heats[heat];
      g.label(ctx, h.time === null ? 'Race over' : 'FINISH', mid[0], mid[1] - g.px(10), g.px(64), '#fff', 'center', '900');
      g.label(ctx, h.time === null ? 'Did not finish' : `${ordinal(h.place)} · ${fmtTime(h.time)}`, mid[0], mid[1] + g.px(50), g.px(32), '#ffe38a', 'center', '800');
    }
    if (phase === 'between') {
      const h = heats[heat];
      g.rr(ctx, V0.x + 30, V0.y + V0.h * 0.2, V0.w - 60, V0.h * 0.5, 22); ctx.fillStyle = 'rgba(10,16,22,0.9)'; ctx.fill(); ctx.strokeStyle = pal.accent; ctx.lineWidth = 3; ctx.stroke();
      g.label(ctx, `Heat ${heat + 1} of ${P.rounds}`, mid[0], V0.y + V0.h * 0.28, g.px(30), pal.accent, 'center', '800');
      g.label(ctx, h.time === null ? 'Did not finish' : `${ordinal(h.place)} place · ${fmtTime(h.time)}`, mid[0], V0.y + V0.h * 0.37, g.px(30), '#fff', 'center', '700');
      g.label(ctx, `Rhythm ${Math.round(h.rhythm * 100)}%${LD ? ` · ${LD.label} ${Math.round(h.lead * 100)}%` : ''} · ${'★'.repeat(h.stars)}${'☆'.repeat(3 - h.stars)}`, mid[0], V0.y + V0.h * 0.45, g.px(26), pal.dim, 'center', '600');
      g.label(ctx, 'Tap for the next heat', mid[0], V0.y + V0.h * 0.58, g.px(24), '#fff', 'center', '600');
    }
  };

  const drawControls = (g, area) => {
    const { ctx } = g;
    const m = pl.m, { pads, row } = layout;
    // status row: strength bar (stroke and animal vehicles) or alignment gauge (sail trim, lean)
    if (kind === 'sailor' || kind === 'sled') {
      const useStart = kind === 'sled' && m.rt < V.startPush;
      const ideal = kind === 'sailor' ? windShift(C, m.x + m.v * 0.3) : curveAt(C, m.x + m.v * 0.15);
      const cur = kind === 'sailor' ? m.trim : m.lean;
      const gx = row.x + 100, gw = row.w - 200, gy = row.y + row.h / 2;
      g.label(ctx, kind === 'sailor' ? 'Sail trim' : useStart ? 'Push' : 'Lean', row.x + 8, gy, g.px(18), pal.dim, 'left', '600');
      g.rr(ctx, gx, gy - 6, gw, 12, 6); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(gx + gw / 2 - 1, gy - 10, 2, 20);
      const px0 = (v) => gx + (v + 1) / 2 * gw;
      ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.moveTo(px0(ideal), gy - 15); ctx.lineTo(px0(ideal) + 10, gy); ctx.lineTo(px0(ideal), gy + 15); ctx.lineTo(px0(ideal) - 10, gy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px0(cur), gy, 9, 0, 7); ctx.fill();
      g.label(ctx, `${Math.round(m.q * 100)}%`, row.x + row.w - 8, gy, g.px(18), m.q > 0.7 ? '#9be3a8' : '#ffb59a', 'right', '700');
    } else {
      const gy = row.y + row.h / 2, gx = row.x + 100, gw = row.w - 200;
      g.label(ctx, 'Strength', row.x + 8, gy, g.px(18), pal.dim, 'left', '600');
      g.rr(ctx, gx, gy - 8, gw, 16, 8); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fill();
      g.rr(ctx, gx, gy - 8, Math.max(8, gw * m.st), 16, 8); ctx.fillStyle = m.st > 0.35 ? '#58c27d' : '#e0603a'; ctx.fill();
      g.label(ctx, `${Math.round(m.q * 100)}%`, row.x + row.w - 8, gy, g.px(18), m.q > 0.7 ? '#9be3a8' : '#ffb59a', 'right', '700');
    }
    // pads
    const names = V.pads === 2 ? [P.labels.left, P.labels.right] : [P.labels.tap];
    pads.forEach((pd, i) => {
      const side = V.pads === 2 ? (i === 0 ? -1 : 1) : 0;
      const active = padDown && (side === 0 || (side === -1) === (layout && layout.area && false));
      void active;
      g.rr(ctx, pd.x, pd.y, pd.w, pd.h, 18);
      ctx.fillStyle = side === -1 ? '#2b4a66' : side === 1 ? '#5a3a66' : '#2d4a58'; ctx.fill();
      ctx.strokeStyle = pal.dim; ctx.lineWidth = 2; ctx.stroke();
      g.label(ctx, names[i] ?? '', pd.x + pd.w / 2, pd.y + pd.h - 22, g.px(22), '#fff', 'center', '700');
    });
    // beat ring: shrinks onto the pad exactly when the stroke should land
    if (phase === 'race' || phase === 'ready') {
      let until = null, padIx = 0;
      if (kind === 'paddle' || kind === 'runner' || (kind === 'sled' && m.rt < V.startPush)) {
        const T = pl.T; until = Math.max(0.0001, Math.max(1, Math.ceil(m.rt / T - 1e-9)) * T - m.rt); padIx = m.nextSide === 1 ? 1 : 0;
        if (kind === 'sled') padIx = m.nextSide === 1 ? 1 : 0;
      } else if (kind === 'skater') { until = m.lastT < 0 ? null : Math.max(0, m.lastT + pl.T - m.rt); }
      else if (kind === 'animal' && m.cool === 0) { const T = pl.T; until = Math.max(1, Math.ceil(m.rt / T - 1e-9)) * T - m.rt; }
      const pd = pads[Math.min(padIx, pads.length - 1)];
      const R = Math.min(pd.h * 0.17, 34);
      const cx = pd.x + pd.w / 2, cy = pd.y + pd.h * 0.42;
      ctx.strokeStyle = '#ffe38a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      if (until !== null) {
        const f = clamp(until / pl.T, 0, 1);
        ctx.globalAlpha = 0.9; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, R * (1 + 1.3 * f), 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
      } else if (kind === 'skater') {
        g.label(ctx, 'Push to start', cx, cy, g.px(18), '#fff', 'center', '700');
      }
      if (kind === 'animal') g.label(ctx, m.cool === 0 ? 'urge' : '', cx, cy, g.px(18), '#fff', 'center', '700');
    }
  };

  return act;
}

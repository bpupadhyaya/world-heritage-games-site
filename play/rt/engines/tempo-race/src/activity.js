// Tempo Race activity (docs/ENGINE-CONTRACT.md "Activity engines"): real-time races where timing, rhythm and pacing decide
// the result. Model in model.js, drawing in draw.js. Deterministic: randomness only via env.rng, time only via dt.
import { resolve, createPlayer, createBot, createLead, reference, createRivals, placePoints, heatStars, heatScore, qualityOf, leadShare, windShift, curveAt, bendAt, roughAt } from './model.js';
import { hash, shade, scenery, texture, racer, checker, leadObject, trail, speedLines, gantry, confetti } from './draw.js';

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
  let finT = 0, streak = 0, streakT = 0, strokeFx = null, lastSide = 0, titleT = 0;
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
    finT = 0; streak = 0; streakT = 0; strokeFx = null;
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
    if (p.pressed && inside) { padDown = true; inp.pressed = true; inp.stroke = p.x < cx ? -1 : 1; lastSide = inp.stroke; }
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
    streakT += dt; if (strokeFx) strokeFx.t += dt;
    if (phase === 'finish' || phase === 'between') finT += dt;
    if (m.event?.type === 'stroke') {
      strokeFx = { t: 0, grade: m.event.grade, pad: m.event.side === 1 ? 1 : 0 };
      if (m.event.grade === 'perfect' || m.event.grade === 'good') { streak++; streakT = 0; } else streak = 0;
    } else if (m.event?.type === 'hit') streak = 0;
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
    // Large rendering of the sport for the title screen: the course with a few competitors in motion (no HUD, no input).
    titleArt(g, rect) {
      titleT += 0.016;
      const { ctx } = g;
      const camS = Math.min(40, L * 0.2), n = Math.min(lanes, N + 1);
      const offs = [3.5, -1, 6.5, -3.5, 1.5, 9, -6, 4];
      const racers = [];
      for (let i = 0; i < n; i++) racers.push({ s: camS + offs[i % offs.length] + Math.sin(titleT * 0.8 + i) * 0.6, lane: i, lat: 0, color: i === 0 ? (P.colors.player ?? '#2b6fe0') : RIVAL_COLORS[(i - 1) % RIVAL_COLORS.length], me: false, i: i === 0 ? -1 : i - 1, v: 0.8 });
      racers.sort((a, b) => a.s - b.s);
      ctx.save(); ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
      drawScroll(g, rect, { camS, racers });
      ctx.restore();
    },
  };

  // ---------------------------------------------------------------------------------------------------------------
  // drawing
  // ---------------------------------------------------------------------------------------------------------------
  const linG = (ctx, x0, y0, x1, y1, stops) => { const gr = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  const pill = (g, x, y, w, h, a = 0.55) => { const { ctx } = g; g.rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = linG(ctx, 0, y, 0, y + h, [[0, `rgba(30,44,58,${a})`], [1, `rgba(8,14,22,${a + 0.15})`]]); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.stroke(); };

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
    ctx.save(); ctx.beginPath(); ctx.rect(view.x, view.y, view.w, view.h); ctx.clip();
    if (C.shape === 'loop') drawLoop(g, view); else drawScroll(g, view, null);
    drawHud(g, view);
    ctx.restore();
    drawControls(g, area);
  };

  const racerList = () => {
    const m = pl.m;
    const list = rivals.map((r) => ({ s: Math.min(r.pos(m.rt), L + 3), lane: r.lane, lat: Math.sin(m.rt * 1.1 + r.wob) * 0.12, color: RIVAL_COLORS[r.i % RIVAL_COLORS.length], me: false, i: r.i, v: clamp((r.pos(m.rt + 0.15) - r.pos(m.rt)) / 0.15 / V.topSpeed, 0, 1) }));
    list.push({ s: Math.min(m.x, L + 3), lane: playerLane, lat: kind === 'paddle' ? m.lat * 0.4 : 0, color: P.colors.player ?? '#2b6fe0', me: true, i: -1, v: clamp(m.v / V.topSpeed, 0, 1) });
    return list.sort((a, b) => a.s - b.s);
  };
  const exFor = (r, t) => {
    const base = { look: V.look, v: r.v, t, id: r.i + 1, terrain: C.terrain };
    return r.me ? { ...base, lean: pl.m.lean, trim: pl.m.trim, gallop: pl.m.gallop, whip: pl.m.burst > 0 } : { ...base, lean: Math.sin(r.s * 0.05) * 0.6, trim: Math.sin(r.s * 0.03 + r.i) * 0.5, gallop: true, whip: false };
  };
  const phaseOf = (r) => r.s * (kind === 'runner' ? 1.1 : kind === 'paddle' ? 0.8 : kind === 'animal' ? 0.6 : 0.45);

  const leadPos = () => { const m = pl.m; return Math.min(L + 30, m.caught ? m.x + 1.8 : lead.x(m.rt)); };
  const leadDraw = (ctx, x, y, ang, rs, fl) => {
    const m = pl.m, lx = leadPos();
    leadObject(ctx, LD.kind, x, y, ang, rs * LD.size * (LD.kind === 'pacemaker' ? 1 : 0.8), LD.color, lx / 0.9, m.caught ? 0 : lead.hop(lx), { vehicle: kind, look: V.look, fl: m.rt * 9 + fl });
    if (m.caught && caughtFlash > 0) { ctx.strokeStyle = '#ffe38a'; ctx.lineWidth = 4; ctx.globalAlpha = caughtFlash / 1.8; ctx.beginPath(); ctx.arc(x, y, rs * (1.2 + (1.8 - caughtFlash) * 1.4), 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
  };

  const drawMarker = (ctx, x, y, s) => {
    // a soft ring under the player's racer, pulsing a little so it reads at a glance
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3; ctx.setLineDash([s * 0.5, s * 0.35]);
    ctx.beginPath(); ctx.arc(x, y, s * (1.5 + 0.06 * Math.sin(pl.m.rt * 6)), pl.m.rt * 1.2, pl.m.rt * 1.2 + 6.283); ctx.stroke(); ctx.setLineDash([]);
  };

  // straight and zigzag: scrolling course, camera follows the player; forward is up (portrait) or right (landscape).
  // S (optional) = a fixed camera for the title art: { camS, racers }.
  const drawScroll = (g, V0, S) => {
    const { ctx } = g;
    const m = pl.m;
    const title = !!S;
    const tNow = title ? titleT : m.rt;
    const portrait = V0.h >= V0.w * 0.9;
    const along = portrait ? V0.h : V0.w, cross = portrait ? V0.w : V0.h;
    const laneW = Math.min((cross * 0.78) / lanes, along * 0.2, 150);
    const trackW = laneW * lanes;
    const visible = C.visible || V.topSpeed * 5.5;
    const ppm = along / Math.max(20, visible), anchor = along * (title ? 0.45 : 0.3);
    const camS = title ? S.camS : Math.min(m.x, L + 4);
    const bendPx = cross * 0.17;
    const proj = (s, off, par = 1) => {
      const sp = camS + (s - camS) * par;
      const u = anchor + (sp - camS) * ppm;
      const lat = off + bendAt(C, sp) * bendPx * par;
      return portrait ? [V0.x + V0.w / 2 + lat, V0.y + V0.h - u] : [V0.x + u, V0.y + V0.h / 2 + lat];
    };
    const sBack = camS - anchor / ppm - 3, sFwd = camS + (along - anchor) / ppm + 3;
    // banks: grass-like ground with a soft light falloff towards the track
    ctx.fillStyle = cols.bank; ctx.fillRect(V0.x, V0.y, V0.w, V0.h);
    {
      const [lx] = proj(camS, -trackW / 2), [rx] = proj(camS, trackW / 2);
      if (portrait) {
        ctx.fillStyle = linG(ctx, V0.x, 0, lx, 0, [[0, 'rgba(0,0,0,0.25)'], [1, 'rgba(255,255,255,0.06)']]); ctx.fillRect(V0.x, V0.y, Math.max(0, lx - V0.x), V0.h);
        ctx.fillStyle = linG(ctx, rx, 0, V0.x + V0.w, 0, [[0, 'rgba(255,255,255,0.06)'], [1, 'rgba(0,0,0,0.25)']]); ctx.fillRect(rx, V0.y, Math.max(0, V0.x + V0.w - rx), V0.h);
      }
      const tuft = C.terrain === 'snow' ? 'rgba(255,255,255,0.6)' : C.terrain === 'sand' ? 'rgba(120,80,30,0.3)' : 'rgba(0,0,0,0.2)';
      const t0 = Math.floor(sBack / 3), t1 = Math.ceil(sFwd / 3);
      for (let n = t0; n <= t1; n++) for (let j = 0; j < 2; j++) {
        const side = hash(n * 3 + j * 11) > 0.5 ? 1 : -1, r = hash(n * 7 + j);
        const [x, y] = proj(n * 3 + r * 3, side * (trackW / 2 + laneW * (0.2 + hash(n * 13 + j) * 1.5)));
        texture(ctx, 'grass', x, y, laneW * 0.5, r, tuft);
      }
    }
    // far parallax scenery (smaller, slower, lighter), then the near layer after the track
    const layer = (par, spacing, off0, sizeMul, seed, haze) => {
      const first = Math.floor((camS + (sBack - camS) / par) / spacing) - 1, last = Math.ceil((camS + (sFwd - camS) / par) / spacing) + 1;
      for (let n = first; n <= last; n++) {
        const hs = hash(n * 31 + seed), side = hash(n * 17 + seed) > 0.5 ? 1 : -1;
        const s = n * spacing + (hs - 0.5) * spacing * 0.6;
        const [x, y] = proj(s, side * (trackW / 2 + off0 + hash(n * 5 + seed) * laneW * 1.4), par);
        if (haze) ctx.globalAlpha = 0.7;
        scenery(ctx, C.scenery, x, y, laneW * sizeMul * (C.scenery === 'dunes' ? 0.55 : 1), hs, tNow);
        ctx.globalAlpha = 1;
      }
    };
    layer(0.6, 6, laneW * 1.9, 0.95, 11, true);
    // track ribbon with surface character
    const step = 10 / ppm;
    const edge = (off) => { const pts = []; for (let s = sBack; s <= sFwd; s += step) pts.push(proj(s, off)); return pts; };
    const left = edge(-trackW / 2), right = edge(trackW / 2);
    const ribbon = () => { ctx.beginPath(); left.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]); ctx.closePath(); };
    // soft shadow the track casts on its banks
    ctx.save(); ctx.translate(5, 5); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ribbon(); ctx.fill(); ctx.restore();
    ribbon(); ctx.fillStyle = cols.ground; ctx.fill();
    ctx.save(); ribbon(); ctx.clip();
    {
      const [x1, y1] = proj(camS, -trackW / 2), [x2, y2] = proj(camS, trackW / 2);
      ctx.fillStyle = linG(ctx, x1, y1, x2, y2, [[0, 'rgba(0,0,0,0.2)'], [0.35, 'rgba(255,255,255,0.1)'], [0.65, 'rgba(255,255,255,0.1)'], [1, 'rgba(0,0,0,0.2)']]); ctx.fillRect(V0.x, V0.y, V0.w, V0.h);
      const bw = { grass: 8, track: 12, sand: 5, snow: 14, mud: 7, ice: 24, water: 30 }[C.terrain] ?? 10;
      const n0 = Math.floor(sBack / bw), n1 = Math.ceil(sFwd / bw);
      for (let n = n0; n <= n1; n++) {
        if (n % 2) continue;
        const a = proj(n * bw, -trackW / 2), b = proj((n + 1) * bw, -trackW / 2), c2 = proj((n + 1) * bw, trackW / 2), d = proj(n * bw, trackW / 2);
        ctx.fillStyle = C.terrain === 'water' ? 'rgba(255,255,255,0.025)' : C.terrain === 'ice' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.07)';
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c2[0], c2[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); ctx.fill();
      }
      if (C.terrain === 'ice') {
        // a long glossy sheen and fine cracks
        ctx.fillStyle = linG(ctx, V0.x, V0.y, V0.x + V0.w, V0.y + V0.h, [[0, 'rgba(255,255,255,0)'], [0.45, 'rgba(255,255,255,0.28)'], [0.55, 'rgba(255,255,255,0.05)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(V0.x, V0.y, V0.w, V0.h);
      }
    }
    // texture marks (ripples drift with the current on water)
    const drift = C.terrain === 'water' ? tNow * 1.2 * (1 + C.current * 0.2) : 0;
    const tsp = 4, t0 = Math.floor((sBack - drift) / tsp), t1 = Math.ceil((sFwd - drift) / tsp);
    for (let n = t0; n <= t1; n++) for (let j = 0; j < 3; j++) {
      const r = hash(n * 13 + j * 101), r2 = hash(n * 7 + j * 53);
      const [x, y] = proj(n * tsp + r * tsp + drift, (r2 - 0.5) * trackW * 0.95);
      texture(ctx, C.terrain, x, y, laneW * 0.6, r, C.terrain === 'water' ? 'rgba(255,255,255,0.75)' : cols.ground2, tNow);
    }
    // rough patches
    for (const rg of C.rough) {
      if (rg.to < sBack || rg.from > sFwd) continue;
      const a = Math.max(rg.from, sBack), b = Math.min(rg.to, sFwd);
      const pts = [];
      for (let s = a; s <= b; s += step) pts.push(proj(s, -trackW / 2));
      for (let s = b; s >= a; s -= step) pts.push(proj(s, trackW / 2));
      ctx.fillStyle = 'rgba(40,30,20,0.22)'; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill();
      for (let s = Math.ceil(a / 1.5) * 1.5; s < b; s += 1.5) for (let j = 0; j < 3; j++) { const r = hash(Math.floor(s * 2) * 3 + j); const [x, y] = proj(s, (r - 0.5) * trackW * 0.9); texture(ctx, C.terrain, x, y, laneW * 0.7, r, ['water', 'ice', 'snow'].includes(C.terrain) ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.32)', tNow); }
    }
    ctx.restore();
    // edges and lane lines
    for (const side of [left, right]) { ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = Math.max(5, laneW * 0.1); ctx.beginPath(); side.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }
    ctx.lineWidth = Math.max(3, laneW * 0.07); ctx.strokeStyle = cols.edge;
    for (const side of [left, right]) { ctx.beginPath(); side.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }
    ctx.setLineDash([laneW * 0.35, laneW * 0.35]); ctx.lineDashOffset = -((camS * ppm) % (laneW * 0.7)); ctx.globalAlpha = 0.55; ctx.lineWidth = 2;
    for (let k = 1; k < lanes; k++) { const pts = edge((k - lanes / 2) * laneW); ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    // start line, obstacles, finish gantry
    const across = (s, fn) => { const [x1, y1] = proj(s, -trackW / 2), [x2, y2] = proj(s, trackW / 2); fn(x1, y1, x2, y2); };
    across(0, (x1, y1, x2, y2) => { ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x1, y1 + 5); ctx.lineTo(x2, y2 + 5); ctx.stroke(); });
    for (const o of C.obstacles) {
      if (o.at < sBack || o.at > sFwd) continue;
      across(o.at, (x1, y1, x2, y2) => drawObstacle(ctx, o.kind, x1, y1, x2, y2, laneW, o.at < m.x && !title, tNow));
    }
    if (L >= sBack && L <= sFwd + 8) across(L, (x1, y1, x2, y2) => gantry(ctx, x1, y1, x2, y2, laneW * 0.32, tNow, 'FINISH'));
    // racers: trail first, then the craft, near scenery over the bank last
    const rs = laneW * (kind === 'paddle' || kind === 'sailor' ? 0.5 : kind === 'runner' || kind === 'skater' ? 0.7 : 0.58);
    const list = title ? S.racers : racerList();
    const sterns = rs * 1.4 / ppm, gapS = rs * 0.7 / ppm;
    for (const r of list) {
      if (r.s < sBack - 6 || r.s > sFwd + 2) continue;
      const off = (r.lane + 0.5 - lanes / 2 + r.lat) * laneW;
      const pts = []; for (let k = 0; k < 8; k++) pts.push(proj(r.s - sterns - k * gapS, off));
      trail(ctx, C.terrain, pts, rs * 0.55, r.v ?? 0.6, kind);
    }
    layer(1, 4.5, laneW * 0.5, 1.25, 23, false);
    for (const r of list) {
      if (r.s < sBack - 2 || r.s > sFwd + 2) continue;
      const off = (r.lane + 0.5 - lanes / 2 + r.lat) * laneW;
      const [x, y] = proj(r.s, off), [x0, y0] = proj(r.s - 0.6, off), [x1, y1] = proj(r.s + 0.6, off);
      const ang = Math.atan2(y1 - y0, x1 - x0);
      if (r.me && !title) drawMarker(ctx, x, y, rs);
      racer(ctx, kind, x, y, ang, rs, r.color, phaseOf(r) + (title ? tNow * 4 : 0), exFor(r, tNow));
    }
    if (lead && !title) {
      const lx = leadPos();
      if (lx >= sBack - 2 && lx <= sFwd + 2) {
        const off = ((m.caught ? 0 : lead.lat(lx)) + (m.caught ? playerLane + 0.5 - lanes / 2 : 0)) * laneW;
        const [x, y] = proj(lx, off), [x0, y0] = proj(lx - 0.6, off), [x1, y1] = proj(lx + 0.6, off);
        leadDraw(ctx, x, y, Math.atan2(y1 - y0, x1 - x0), rs, 0);
      } else if (lx > sFwd) {
        const [x, y] = proj(sFwd - 1, (playerLane + 0.5 - lanes / 2) * laneW);
        ctx.fillStyle = LD.color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); if (portrait) { ctx.moveTo(x, y - 14); ctx.lineTo(x - 12, y + 6); ctx.lineTo(x + 12, y + 6); } else { ctx.moveTo(x + 14, y); ctx.lineTo(x - 6, y - 12); ctx.lineTo(x - 6, y + 12); } ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
    // speed lines at the sides of the view, stronger during a burst
    const amt = title ? 0.35 : clamp((m.v / V.topSpeed - 0.55) * 2.2, 0, 1) + (m.burst > 0 ? 0.35 : 0);
    if (phase === 'race' || title) speedLines(ctx, V0, portrait ? 'up' : 'right', clamp(amt, 0, 1), title ? tNow * 0.25 : camS * 0.012, C.terrain === 'snow' || C.terrain === 'ice' ? '120,160,200' : '255,255,255');
  };

  const drawObstacle = (ctx, okind, x1, y1, x2, y2, laneW, passed, t) => {
    ctx.globalAlpha = passed ? 0.45 : 1;
    const n = 6;
    ctx.save(); ctx.translate(3, 4); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = laneW * 0.14; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
    switch (okind) {
      case 'hurdle': case 'log': {
        ctx.strokeStyle = '#7a4e2a'; ctx.lineWidth = laneW * 0.18; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.strokeStyle = '#b8884e'; ctx.lineWidth = laneW * 0.09; ctx.beginPath(); ctx.moveTo(x1, y1 - laneW * 0.04); ctx.lineTo(x2, y2 - laneW * 0.04); ctx.stroke();
        ctx.strokeStyle = '#e8d3a0'; ctx.setLineDash([laneW * 0.2, laneW * 0.2]); ctx.lineWidth = laneW * 0.05; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]); break; }
      case 'rapids': case 'waves': case 'snowdrift':
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(3, laneW * 0.07);
        for (let i = 0; i < n * 2; i++) { const tt = (i + 0.5) / (n * 2); const x = x1 + (x2 - x1) * tt, y = y1 + (y2 - y1) * tt + (i % 2 ? laneW * 0.14 : -laneW * 0.1) + Math.sin(t * 4 + i) * 2; ctx.beginPath(); ctx.arc(x, y, laneW * 0.2, 0.3, 2.8); ctx.stroke(); }
        break;
      case 'buoy':
        for (let i = 0; i <= 3; i++) { const tt = i / 3; const x = x1 + (x2 - x1) * tt, y = y1 + (y2 - y1) * tt + Math.sin(t * 2 + i) * 2; ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(x + 3, y + 4, laneW * 0.16, 0, 7); ctx.fill(); ctx.fillStyle = i % 2 ? '#f2f2f2' : '#e0603a'; ctx.beginPath(); ctx.arc(x, y, laneW * 0.16, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(x - laneW * 0.05, y - laneW * 0.05, laneW * 0.06, 0, 7); ctx.fill(); }
        break;
      default:
        ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = Math.max(3, laneW * 0.06); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        for (const [x, y] of [[x1, y1], [x2, y2]]) { ctx.fillStyle = '#e0603a'; ctx.beginPath(); ctx.arc(x, y, Math.min(laneW * 0.14, 16), 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(x - 2, y - 2, Math.min(laneW * 0.05, 6), 0, 7); ctx.fill(); }
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
    const tNow = m.rt;
    ctx.fillStyle = cols.bank; ctx.fillRect(V0.x, V0.y, V0.w, V0.h);
    ctx.fillStyle = linG(ctx, 0, V0.y, 0, V0.y + V0.h, [[0, 'rgba(255,255,255,0.08)'], [1, 'rgba(0,0,0,0.22)']]); ctx.fillRect(V0.x, V0.y, V0.w, V0.h);
    // spectators and scenery on the outer bank
    {
      const n = 26;
      for (let i = 0; i < n; i++) {
        const f = (i + 0.5) / n; const r = hash(i * 5 + 1);
        const sOut = (f * C.lapLength * 1.0);
        const [x, y] = at(sOut, trackW / 2 + laneW * (0.9 + r * 0.5));
        scenery(ctx, i % 4 === 0 ? 'crowd' : C.scenery, x, y, laneW * (i % 4 === 0 ? 0.9 : 0.8), r, tNow);
      }
    }
    ctx.save(); ctx.translate(cx, cy); if (portrait) ctx.rotate(Math.PI / 2);
    const stadium = (r2raw, fill, stroke, lw) => { const r2 = Math.max(1, r2raw); g.rr(ctx, -a - r2, -r2, 2 * a + 2 * r2, 2 * r2, r2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } };
    ctx.save(); ctx.translate(5, 6); stadium(rho + trackW / 2 + 8, 'rgba(0,0,0,0.3)'); ctx.restore();
    stadium(rho + trackW / 2 + 8, cols.edge); stadium(rho + trackW / 2, cols.ground);
    // surface sheen and bands
    ctx.save(); g.rr(ctx, -a - (rho + trackW / 2), -(rho + trackW / 2), 2 * a + 2 * (rho + trackW / 2), 2 * (rho + trackW / 2), rho + trackW / 2); ctx.clip();
    ctx.fillStyle = linG(ctx, 0, -rho - trackW / 2, 0, rho + trackW / 2, [[0, 'rgba(255,255,255,0.18)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.15)']]); ctx.fillRect(-a - rho - trackW, -rho - trackW, 2 * a + 2 * rho + 2 * trackW, 2 * rho + 2 * trackW);
    ctx.restore();
    stadium(rho - trackW / 2, cols.bank, cols.edge, 4);
    ctx.globalAlpha = 0.5; ctx.setLineDash([laneW * 0.3, laneW * 0.3]);
    for (let k = 1; k < lanes; k++) stadium(rho + (k - lanes / 2) * laneW, null, cols.edge, 2);
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    ctx.restore();
    for (let n = 0; n < 70; n++) { const r = hash(n * 13), r2 = hash(n * 7 + 3); const [x, y] = at(r * C.lapLength, (r2 - 0.5) * trackW * 0.92); texture(ctx, C.terrain, x, y, laneW * 0.6, r, cols.ground2, tNow); }
    for (const o of C.obstacles) {
      const ang = (o.at % C.lapLength);
      const [x1, y1] = at(ang, -trackW / 2), [x2, y2] = at(ang, trackW / 2);
      drawObstacle(ctx, o.kind, x1, y1, x2, y2, laneW, false, tNow);
    }
    { const [x1, y1] = at(0, -trackW / 2), [x2, y2] = at(0, trackW / 2); gantry(ctx, x1, y1, x2, y2, laneW * 0.32, tNow, 'START · FINISH'); }
    // infield
    const [icx, icy] = [cx, cy];
    const laps = Math.max(1, Math.round(L / C.lapLength));
    const lapNow = Math.min(laps, Math.floor(Math.min(m.x, L - 0.01) / C.lapLength) + 1);
    const inner = Math.max(0, rho - trackW / 2);
    if (inner > laneW) { const n = Math.min(4, Math.floor((a * 2 + inner) / (laneW * 1.4))); for (let i = 0; i < n; i++) { const r = hash(i * 3 + 9); const off = (i - (n - 1) / 2) * laneW * 1.4; scenery(ctx, i === 0 ? C.scenery : C.scenery, portrait ? icx : icx + off, portrait ? icy + off : icy - inner * 0.45, laneW * 0.8, r, tNow); } }
    g.rr(ctx, icx - 52, icy + (inner > laneW ? inner * 0.25 : 0) - 16, 104, 32, 16); ctx.fillStyle = 'rgba(8,14,22,0.55)'; ctx.fill();
    g.label(ctx, `Lap ${lapNow} / ${laps}`, icx, icy + (inner > laneW ? inner * 0.25 : 0), g.px(20), '#fff', 'center', '800');
    const rs = laneW * 0.95;
    const list = racerList();
    for (const r of list) {
      const off = (r.lane + 0.5 - lanes / 2 + r.lat) * laneW;
      const pts = []; for (let k = 1; k <= 8; k++) { const q = at(r.s - k * rs * 0.7 / (Lc / C.lapLength), off); pts.push([q[0], q[1]]); }
      trail(ctx, C.terrain, pts, rs * 0.5, r.v, kind);
    }
    for (const r of list) {
      const off = (r.lane + 0.5 - lanes / 2 + r.lat) * laneW;
      const [x, y, ang] = at(r.s, off);
      if (r.me) drawMarker(ctx, x, y, rs);
      racer(ctx, kind, x, y, ang, rs, r.color, phaseOf(r), exFor(r, tNow));
    }
    if (lead) {
      const lx = leadPos();
      const off = (m.caught ? playerLane + 0.5 - lanes / 2 : lead.lat(lx)) * laneW;
      const [x, y, ang] = at(lx, off);
      leadDraw(ctx, x, y, ang, rs, 0);
    }
  };

  const drawHud = (g, V0) => {
    const { ctx } = g;
    const m = pl.m;
    // race map bar with the obstacle ticks, finish flag and every racer
    const bx = V0.x + 18, bw = V0.w - 36, by = V0.y + 18;
    pill(g, bx - 6, by - 9, bw + 12, 18, 0.5);
    for (const o of C.obstacles) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(bx + (o.at / L) * bw - 1, by - 5, 2, 10); }
    checker(ctx, bx + bw - 8, by - 8, 8, 16, 4);
    if (lead) { const lx = clamp(leadPos() / L, 0, 1) * bw; ctx.fillStyle = LD.color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + lx, by - 9); ctx.lineTo(bx + lx + 7, by); ctx.lineTo(bx + lx, by + 9); ctx.lineTo(bx + lx - 7, by); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    for (const r of racerList()) { ctx.fillStyle = r.color; ctx.strokeStyle = r.me ? '#fff' : 'rgba(0,0,0,0.5)'; ctx.lineWidth = r.me ? 3 : 1.5; ctx.beginPath(); ctx.arc(bx + clamp(r.s / L, 0, 1) * bw, by, r.me ? 8 : 5.5, 0, 7); ctx.fill(); ctx.stroke(); }
    // speed readout and time
    pill(g, V0.x + 10, V0.y + 38, 112, 28); pill(g, V0.x + V0.w - 122, V0.y + 38, 112, 28);
    g.label(ctx, `${(m.v * 3.6).toFixed(0)} km/h`, V0.x + 66, V0.y + 52, g.px(17), '#fff', 'center', '800');
    g.label(ctx, `${fmtTime(Math.max(0, m.rt))}`, V0.x + V0.w - 66, V0.y + 52, g.px(17), '#fff', 'center', '800');
    // streak of well-timed strokes
    if (streak >= 2 && phase === 'race') {
      const sc = 1 + Math.max(0, 0.3 - streakT) * 1.2;
      ctx.save(); ctx.translate(V0.x + V0.w - 66, V0.y + 96); ctx.scale(sc, sc);
      pill(g, -50, -14, 100, 28, 0.6);
      g.label(ctx, `Streak x${streak}`, 0, 0, g.px(16), '#ffe38a', 'center', '800');
      ctx.restore();
    }
    // distance to the lead and the proximity meter
    if (lead && (phase === 'race' || phase === 'finish')) {
      const cw = 200, cx0 = V0.x + V0.w / 2 - cw / 2, cy0 = V0.y + 38;
      pill(g, cx0, cy0, cw, 38, 0.6);
      const col = m.credit > 0.66 ? '#9be3a8' : m.credit > 0.2 ? '#ffe38a' : '#ffb59a';
      const txt = m.caught ? `${LD.label}: caught!` : `${LD.label} ${Math.abs(m.gap).toFixed(0)} ${P.labels.unit} ${m.gap >= 0 ? 'ahead' : 'behind'}`;
      g.label(ctx, txt, V0.x + V0.w / 2, cy0 + 14, g.px(16), '#fff', 'center', '800');
      g.rr(ctx, cx0 + 16, cy0 + 27, cw - 32, 5, 2.5); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();
      g.rr(ctx, cx0 + 16, cy0 + 27, Math.max(5, (cw - 32) * m.credit), 5, 2.5); ctx.fillStyle = col; ctx.fill();
    }
    // feedback flash
    if (m.flashT > 0 && m.flash && phase === 'race') {
      const k = clamp(m.flashT / 0.7, 0, 1);
      ctx.globalAlpha = clamp(m.flashT / 0.35, 0, 1);
      const px = g.px(30) * (1 + (k > 0.8 ? (k - 0.8) * 1.5 : 0));
      ctx.font = `900 ${Math.round(px)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      const fy = V0.y + V0.h * 0.3 - (0.7 - m.flashT) * 30;
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(10,16,22,0.7)'; ctx.strokeText(m.flash, V0.x + V0.w / 2, fy);
      ctx.fillStyle = m.tone === 'bad' ? '#ff9a7a' : '#ffe38a'; ctx.fillText(m.flash, V0.x + V0.w / 2, fy);
      ctx.globalAlpha = 1;
    }
    const mid = [V0.x + V0.w / 2, V0.y + V0.h * 0.42];
    const bigText = (txt, y, size, color, sc = 1) => {
      ctx.save(); ctx.translate(mid[0], y); ctx.scale(sc, sc);
      ctx.font = `900 ${Math.round(size)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(6, size * 0.12); ctx.strokeStyle = 'rgba(10,16,22,0.75)'; ctx.strokeText(txt, 0, 0);
      ctx.fillStyle = color; ctx.fillText(txt, 0, 0); ctx.restore();
    };
    if (phase === 'ready') {
      const k = cd > 1.8 ? 2.6 - cd : cd > 1.0 ? 1.8 - cd : cd > 0.2 ? 1.0 - cd : 0.2 - cd;
      const n = cd > 1.8 ? '3' : cd > 1.0 ? '2' : cd > 0.2 ? '1' : 'GO';
      bigText(n, mid[1], g.px(110), n === 'GO' ? '#9be3a8' : '#fff', 1.35 - clamp(k * 1.2, 0, 0.35));
      g.label(ctx, kind === 'animal' ? 'Hold to gallop' : kind === 'sailor' || kind === 'sled' ? 'Hold a side to steer' : 'Strike with the drum', mid[0], mid[1] + g.px(80), g.px(24), '#fff', 'center', '700');
    }
    if (phase === 'finish') {
      const h = heats[heat];
      const sc = finT < 0.25 ? 0.5 + finT * 2.4 : finT < 0.45 ? 1.1 - (finT - 0.25) * 0.5 : 1;
      bigText(h.time === null ? 'Race over' : 'FINISH', mid[1] - g.px(10), g.px(64), '#fff', sc);
      bigText(h.time === null ? 'Did not finish' : `${ordinal(h.place)} · ${fmtTime(h.time)}`, mid[1] + g.px(52), g.px(32), '#ffe38a', clamp(sc, 0.8, 1.05));
    }
    if (phase === 'between') {
      const h = heats[heat];
      g.rr(ctx, V0.x + 30, V0.y + V0.h * 0.2, V0.w - 60, V0.h * 0.5, 22); ctx.fillStyle = 'rgba(10,16,22,0.92)'; ctx.fill(); ctx.strokeStyle = pal.accent; ctx.lineWidth = 3; ctx.stroke();
      g.label(ctx, `Heat ${heat + 1} of ${P.rounds}`, mid[0], V0.y + V0.h * 0.28, g.px(30), pal.accent, 'center', '800');
      g.label(ctx, h.time === null ? 'Did not finish' : `${ordinal(h.place)} place · ${fmtTime(h.time)}`, mid[0], V0.y + V0.h * 0.37, g.px(30), '#fff', 'center', '700');
      g.label(ctx, `Rhythm ${Math.round(h.rhythm * 100)}%${LD ? ` · ${LD.label} ${Math.round(h.lead * 100)}%` : ''} · ${'★'.repeat(h.stars)}${'☆'.repeat(3 - h.stars)}`, mid[0], V0.y + V0.h * 0.45, g.px(26), pal.dim, 'center', '600');
      g.label(ctx, 'Tap for the next heat', mid[0], V0.y + V0.h * 0.58, g.px(24), '#fff', 'center', '600');
    }
    // confetti over the finish
    if (phase === 'finish' || (phase === 'between' && finT < 3)) confetti(ctx, V0, finT, heats[heat] && heats[heat].place === 1 ? 1 : heats[heat] && heats[heat].place <= 3 ? 0.5 : 0.15);
  };

  const drawControls = (g, area) => {
    const { ctx } = g;
    const m = pl.m, { pads, row } = layout;
    // status row: strength bar (stroke and animal vehicles) or alignment gauge (sail trim, lean)
    const gy = row.y + row.h / 2, gx = row.x + 100, gw = row.w - 200;
    if (kind === 'sailor' || kind === 'sled') {
      const useStart = kind === 'sled' && m.rt < V.startPush;
      const ideal = kind === 'sailor' ? windShift(C, m.x + m.v * 0.3) : curveAt(C, m.x + m.v * 0.15);
      const cur = kind === 'sailor' ? m.trim : m.lean;
      g.label(ctx, kind === 'sailor' ? 'Sail trim' : useStart ? 'Push' : 'Lean', row.x + 8, gy, g.px(18), pal.dim, 'left', '700');
      g.rr(ctx, gx, gy - 7, gw, 14, 7); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(gx + gw / 2 - 1, gy - 10, 2, 20);
      const px0 = (v) => gx + (v + 1) / 2 * gw;
      ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.moveTo(px0(ideal), gy - 15); ctx.lineTo(px0(ideal) + 10, gy); ctx.lineTo(px0(ideal), gy + 15); ctx.lineTo(px0(ideal) - 10, gy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px0(cur), gy, 9, 0, 7); ctx.fill();
      g.label(ctx, `${Math.round(m.q * 100)}%`, row.x + row.w - 8, gy, g.px(18), m.q > 0.7 ? '#9be3a8' : '#ffb59a', 'right', '800');
    } else {
      g.label(ctx, 'Strength', row.x + 8, gy, g.px(18), pal.dim, 'left', '700');
      g.rr(ctx, gx, gy - 8, gw, 16, 8); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.stroke();
      const sc = m.st > 0.35 ? '#58c27d' : '#e0603a';
      g.rr(ctx, gx, gy - 8, Math.max(8, gw * m.st), 16, 8); ctx.fillStyle = linG(ctx, 0, gy - 8, 0, gy + 8, [[0, sc], [1, '#2e7a4a']]); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; g.rr(ctx, gx + 4, gy - 6, Math.max(4, gw * m.st - 8), 4, 2); ctx.fill();
      g.label(ctx, `${Math.round(m.q * 100)}%`, row.x + row.w - 8, gy, g.px(18), m.q > 0.7 ? '#9be3a8' : '#ffb59a', 'right', '800');
    }
    // pads
    const names = V.pads === 2 ? [P.labels.left, P.labels.right] : [P.labels.tap];
    pads.forEach((pd, i) => {
      const side = V.pads === 2 ? (i === 0 ? -1 : 1) : 0;
      const base = side === -1 ? '#2b4a66' : side === 1 ? '#5a3a66' : '#2d4a58';
      const lit = padDown && (side === 0 || (lastSide === side));
      g.rr(ctx, pd.x, pd.y + 3, pd.w, pd.h, 18); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      g.rr(ctx, pd.x, pd.y, pd.w, pd.h, 18);
      ctx.fillStyle = linG(ctx, 0, pd.y, 0, pd.y + pd.h, [[0, shade(base, lit ? 0.5 : 0.28)], [1, shade(base, lit ? 0 : -0.3)]]); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.stroke();
      // fine diagonal weave, like a drum skin
      ctx.save(); g.rr(ctx, pd.x, pd.y, pd.w, pd.h, 18); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
      for (let x = pd.x - pd.h; x < pd.x + pd.w; x += 14) { ctx.beginPath(); ctx.moveTo(x, pd.y + pd.h); ctx.lineTo(x + pd.h, pd.y); ctx.stroke(); }
      ctx.restore();
      g.label(ctx, names[i] ?? '', pd.x + pd.w / 2, pd.y + pd.h - 22, g.px(22), '#fff', 'center', '800');
    });
    // beat ring: shrinks onto the target exactly when the stroke should land; turns green and thick when it is time
    if (phase === 'race' || phase === 'ready') {
      let until = null, padIx = 0;
      if (kind === 'paddle' || kind === 'runner' || (kind === 'sled' && m.rt < V.startPush)) {
        const T = pl.T; until = Math.max(0.0001, Math.max(1, Math.ceil(m.rt / T - 1e-9)) * T - m.rt); padIx = m.nextSide === 1 ? 1 : 0;
      } else if (kind === 'skater') { until = m.lastT < 0 ? null : Math.max(0, m.lastT + pl.T - m.rt); }
      else if (kind === 'animal' && m.cool === 0) { const T = pl.T; until = Math.max(1, Math.ceil(m.rt / T - 1e-9)) * T - m.rt; }
      const pd = pads[Math.min(padIx, pads.length - 1)];
      const R = Math.min(pd.h * 0.17, 34);
      const cx = pd.x + pd.w / 2, cy = pd.y + pd.h * 0.42;
      const f = until !== null ? clamp(until / pl.T, 0, 1) : 1;
      const near = until !== null && f < 0.16;
      // glow and the fixed target
      ctx.fillStyle = linG(ctx, cx - R * 2, cy, cx + R * 2, cy, [[0, 'rgba(255,227,138,0)'], [0.5, `rgba(255,227,138,${near ? 0.4 : 0.15})`], [1, 'rgba(255,227,138,0)']]); ctx.beginPath(); ctx.arc(cx, cy, R * 1.9, 0, 7); ctx.fill();
      ctx.strokeStyle = near ? '#9be3a8' : '#ffe38a'; ctx.lineWidth = near ? 6 : 4; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      ctx.fillStyle = near ? 'rgba(155,227,168,0.35)' : 'rgba(255,227,138,0.18)'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.86, 0, 7); ctx.fill();
      if (until !== null) {
        ctx.strokeStyle = near ? '#ffffff' : 'rgba(255,255,255,0.92)'; ctx.lineWidth = near ? 7 : 5; ctx.beginPath(); ctx.arc(cx, cy, R * (1 + 1.4 * f), 0, 7); ctx.stroke();
        // a faint trail ring a moment behind
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R * (1 + 1.4 * Math.min(1, f + 0.12)), 0, 7); ctx.stroke();
      } else if (kind === 'skater') {
        g.label(ctx, 'Push to start', cx, cy, g.px(18), '#fff', 'center', '800');
      }
      if (kind === 'animal') g.label(ctx, m.cool === 0 ? 'urge' : '', cx, cy, g.px(18), '#fff', 'center', '800');
    }
    // hit ripple where the last stroke landed
    if (strokeFx && strokeFx.t < 0.45) {
      const pd = pads[Math.min(strokeFx.pad, pads.length - 1)], k = strokeFx.t / 0.45;
      const cx = pd.x + pd.w / 2, cy = pd.y + pd.h * 0.42, R = Math.min(pd.h * 0.17, 34);
      ctx.globalAlpha = 1 - k; ctx.strokeStyle = strokeFx.grade === 'perfect' ? '#9be3a8' : strokeFx.grade === 'good' ? '#ffe38a' : strokeFx.grade === 'miss' ? '#ff9a7a' : '#ffffff';
      ctx.lineWidth = 6 * (1 - k) + 1; ctx.beginPath(); ctx.arc(cx, cy, R * (1 + k * 1.6), 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
    }
  };

  return act;
}

// Rhythm activity: music and dance by beat and melody (docs/ENGINE-CONTRACT.md "Activity engines").
// A round is a timeline of TARGETS (strokes the player must hit) built from a song (a step list of { beat, lane, len? }).
//   learn  : the song is cut into phrases; the computer plays a phrase (lanes light up), then the player echoes it.
//   follow : the whole song falls toward a hit line (or around a cycle ring for 'circle'); hit each note on time.
//   free   : no targets; strokes are graded against the pulse grid, over a drone, with the song shown as a soft guide.
// Time comes only from dt accumulation (seconds). All windows scale with params.tolerance, tempo with params.tempo.

import { clamp as _c, mix, rgba, lighter, darker, glow, rrect, text, grain, hgrad, vgrad, rgrad, styleFor, drawBackdrop, drawHero, drawBody, bridgeScale, drumHead, gong, kerchief, bar, bell, tine, pearlButton, pipe, gem, stepIcon } from './art.js';

export const SCALES = {
  pentatonic: [0, 200, 400, 700, 900],
  'minor-pentatonic': [0, 300, 500, 700, 1000],
  heptatonic: [0, 200, 400, 500, 700, 900, 1100],
  minor: [0, 200, 300, 500, 700, 800, 1000],
  'maqam-rast': [0, 200, 350, 500, 700, 900, 1050],
  'maqam-bayati': [0, 150, 300, 500, 700, 800, 1000],
  'raga-bhupali': [0, 200, 400, 700, 900],
  'raga-yaman': [0, 200, 400, 600, 700, 900, 1100],
  slendro: [0, 240, 480, 720, 960],
  pelog: [0, 120, 270, 540, 670, 800, 950],
  'equi-heptatonic': [0, 171, 343, 514, 686, 857, 1029],
  yo: [0, 200, 500, 700, 900],
  in: [0, 100, 500, 700, 800],
  chromatic: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100],
};

// Timbre presets: how a stroke sounds. `to` is a ratio of the start frequency (pitch fall for drums).
const TIMBRES = {
  bass: { type: 'sine', to: 0.55, dur: 0.38, vol: 0.4 },
  tone: { type: 'triangle', to: 0.8, dur: 0.22, vol: 0.32 },
  slap: { type: 'sawtooth', to: 0.9, dur: 0.09, vol: 0.2 },
  rim: { type: 'square', to: 0.95, dur: 0.06, vol: 0.14 },
  pluck: { type: 'triangle', to: 0.995, dur: 0.6, vol: 0.3 },
  string: { type: 'sawtooth', to: 0.998, dur: 0.55, vol: 0.14 },
  mallet: { type: 'sine', to: 0.99, dur: 0.55, vol: 0.34 },
  bell: { type: 'sine', to: 0.99, dur: 0.8, vol: 0.28 },
  breath: { type: 'sine', to: null, dur: 0.6, vol: 0.3 },
  reed: { type: 'sawtooth', to: null, dur: 0.6, vol: 0.13 },
  stomp: { type: 'sine', to: 0.4, dur: 0.2, vol: 0.45 },
  clap: { type: 'square', to: 0.8, dur: 0.05, vol: 0.16 },
  gong: { type: 'sine', to: 0.97, dur: 1.2, vol: 0.4 },
};
const LAYOUT_TIMBRE = { pads: 'tone', strings: 'pluck', keys: 'mallet', holes: 'breath', steps: 'stomp', circle: 'bell' };

export const DEFAULTS = {
  layout: 'pads', mode: 'follow', root: 220, scale: 'pentatonic',
  lanes: [{ name: 'Low', timbre: 'bass', hz: 110 }, { name: 'Mid', timbre: 'tone', hz: 220 }, { name: 'High', timbre: 'slap', hz: 330 }],
  notes: {}, songs: [{ name: 'Basic pattern', bpm: 80, meter: 4, steps: [{ beat: 0, lane: 0 }, { beat: 1, lane: 1 }, { beat: 2, lane: 2 }, { beat: 3, lane: 1 }] }],
  song: 0, tempo: 1, tolerance: 1, leadIn: null, phrase: null, loops: 1, duration: 40, subdivision: 2,
  drone: false, pulse: null, guide: true, memory: false, colors: null,
};

const KEYS = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'];
const DIGITS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'];
const PERFECT = 0.07, GOOD = 0.16, STRAY = 15;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const PN = 96;

export function createActivity(userParams, env) {
  void _c;
  const P = { ...DEFAULTS, ...userParams };
  const { palette: pal } = env;
  const audio = env.audio;
  const scale = Array.isArray(P.scale) ? P.scale : SCALES[P.scale] ?? SCALES.pentatonic;
  const song = P.songs[clamp(P.song, 0, P.songs.length - 1)];
  const meter = Math.max(2, song.meter ?? 4);
  const spb = 60 / ((song.bpm ?? 80) * P.tempo);
  const perfectW = PERFECT * P.tolerance, goodW = GOOD * P.tolerance;
  const leadBeats = P.leadIn ?? Math.min(4, meter);
  const colors = P.colors ?? [pal.a, pal.b, '#e0a82e', '#58c27d', '#a56bd6', '#2ec4b6', '#e87fa0', '#9ac24a', '#f08a3c', '#6ea8ff'];
  const showTick = P.pulse ?? P.mode !== 'follow';

  // ---- lanes: resolved tone per lane -----------------------------------------------------------------------------
  const degreeHz = (d) => { const n = scale.length, oct = Math.floor(d / n), i = ((d % n) + n) % n; return P.root * 2 ** ((scale[i] + 1200 * oct) / 1200); };
  const lanes = P.lanes.map((l, i) => {
    const base = { ...(l.note ? P.notes[l.note] : null), ...l };
    const hz = base.hz ?? (base.cents != null ? P.root * 2 ** (base.cents / 1200) : degreeHz(base.degree ?? i));
    const tim = TIMBRES[base.timbre ?? LAYOUT_TIMBRE[P.layout]] ?? TIMBRES.tone;
    return { id: l.id ?? l.name, name: l.name ?? `${i + 1}`, hz, tim, wave: base.wave ?? tim.type, dur: base.dur ?? tim.dur, color: l.color ?? colors[(l.row ?? i) % colors.length],
      holes: l.holes ?? '', icon: l.icon ?? 'foot-l', row: l.row ?? 0 };
  });
  const N = lanes.length;
  const laneIndex = (v) => {
    if (typeof v === 'number') return clamp(Math.round(v), 0, N - 1);
    const i = lanes.findIndex((l) => l.id === v || l.name === v);
    return i < 0 ? 0 : i;
  };
  const steps = (song.steps ?? []).map((s) => ({ beat: s.beat, lane: laneIndex(s.lane), len: s.len ?? 0 })).sort((a, b) => a.beat - b.beat);
  const songBeats = song.length ?? Math.max(meter, Math.ceil(steps.reduce((m, s) => Math.max(m, s.beat + Math.max(1, s.len)), 0) / meter) * meter);
  const cycleBeats = song.cycle ?? songBeats;
  const phraseBeats = P.phrase ?? meter;

  // ---- state --------------------------------------------------------------------------------------------------------
  let clock, targets, demos, guide, sections, pts, strays, combo, maxCombo, counts, done, flash, pops, endT, nextBeat, nextDemo, lastTip;
  let free, lastSlot, droneT, layout = null, attractIdx, auto = false;
  // presentation-only state (never read by the rules or by getState)
  let anim = 0, comboPop = 0, missFlash = 0, rs = 20241012, pi = 0;
  const part = Array.from({ length: PN }, () => ({ on: false, lane: 0, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 3, color: '#ffffff', kind: 0 }));
  const rnd = () => { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 4294967296; };
  const emit = (lane, n, color, speed, kind, size = 3, life = 0.55) => {
    for (let k = 0; k < n; k++) {
      const p = part[pi++ % PN], a = rnd() * 6.2832, v = speed * (0.35 + 0.65 * rnd());
      p.on = true; p.lane = lane; p.x = 0; p.y = 0; p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v * 0.8 - speed * 0.25; p.life = life * (0.6 + 0.6 * rnd()); p.max = p.life; p.size = size * (0.6 + 0.8 * rnd()); p.color = color; p.kind = kind;
      if (kind === 1 || kind === 3) { p.vx = 0; p.vy = 0; p.life = life; p.max = life; }
    }
  };
  const S = styleFor(`${env.variant ?? ''} ${env.text?.title ?? ''}`, P.layout, P.lanes?.[0]?.timbre ?? '');

  const build = () => {
    targets = []; demos = []; guide = []; sections = [];
    if (P.mode === 'follow') {
      for (let l = 0; l < P.loops; l++) for (const s of steps) targets.push({ t: (l * songBeats + s.beat) * spb, b: l * songBeats + s.beat, lane: s.lane, len: s.len, state: 'pending' });
      endT = P.loops * songBeats * spb;
    } else if (P.mode === 'learn') {
      const phrases = Math.max(1, Math.ceil(songBeats / phraseBeats));
      for (let k = 0; k < phrases; k++) {
        const lo = k * phraseBeats, hi = lo + phraseBeats, demoStart = k * 2 * phraseBeats, echoStart = demoStart + phraseBeats;
        for (const s of steps) {
          if (s.beat < lo || s.beat >= hi) continue;
          demos.push({ t: (demoStart + s.beat - lo) * spb, lane: s.lane, len: s.len, b: s.beat, k });
          targets.push({ t: (echoStart + s.beat - lo) * spb, b: s.beat, lane: s.lane, len: s.len, state: 'pending', k });
        }
        sections.push({ k, kind: 'demo', from: demoStart * spb, to: echoStart * spb, lo });
        sections.push({ k, kind: 'echo', from: echoStart * spb, to: (echoStart + phraseBeats) * spb, lo });
      }
      endT = phrases * 2 * phraseBeats * spb;
    } else {
      const loops = Math.max(1, Math.ceil(P.duration / (songBeats * spb)));
      for (let l = 0; l < loops; l++) for (const s of steps) guide.push({ t: (l * songBeats + s.beat) * spb, b: l * songBeats + s.beat, lane: s.lane, len: s.len });
      endT = P.duration;
    }
    targets.sort((a, b) => a.t - b.t);
  };

  const init = () => {
    clock = -leadBeats * spb; pts = 0; strays = 0; combo = 0; maxCombo = 0; done = null; flash = lanes.map(() => 0); pops = [];
    comboPop = 0; missFlash = 0; anim = 0; for (const p of part) p.on = false;
    counts = { perfect: 0, good: 0, miss: 0, off: 0, strokes: 0 };
    nextBeat = -leadBeats; nextDemo = 0; lastTip = ''; droneT = 0; lastSlot = null; attractIdx = 0; auto = false;
    build();
    free = { want: Math.max(4, Math.floor((P.duration / spb) * 0.3)) };
  };
  init();

  // ---- sound ---------------------------------------------------------------------------------------------------------
  const strike = (i, len = 0) => {
    const l = lanes[i];
    if (!l || !audio) return;
    const dur = len > 0 ? Math.max(l.dur, len * spb) : l.dur;
    audio.tone({ freq: l.hz, to: l.tim.to ? l.hz * l.tim.to : null, dur, type: l.wave, vol: l.tim.vol });
  };
  const tick = (downbeat) => audio?.tone({ freq: downbeat ? 1320 : 880, dur: 0.03, type: 'square', vol: 0.06 });

  // ---- judging -------------------------------------------------------------------------------------------------------
  const pop = (i, text, color) => pops.push({ lane: i, text, color, age: 0 });
  const inStrayZone = () => {
    if (P.mode === 'follow') return targets.length > 0 && clock >= targets[0].t - spb * 0.5 && clock <= endT + spb * 0.5;
    if (P.mode === 'learn') return sections.some((s) => s.kind === 'echo' && clock >= s.from - spb * 0.5 && clock <= s.to + spb * 0.5);
    return false;
  };

  const burst = (i, perfect) => {
    const c = lanes[i].color;
    emit(i, perfect ? 18 : 10, perfect ? lighter(c, 0.4) : c, perfect ? 260 : 190, 0, perfect ? 3.4 : 2.8, 0.6);
    emit(i, 1, c, 0, 1, perfect ? 44 : 32, 0.45);
    if (perfect) emit(i, 3, '#fff7d0', 0, 3, 16, 0.4);
    if (combo > 0 && combo % 10 === 0) pop(-1, `${combo} in a row!`, pal.accent);
  };

  const hitLane = (i) => {
    strike(i);
    flash[i] = 1;
    if (clock < -spb * 0.5) return;
    if (P.mode === 'free') return judgeFree(i);
    let best = null, bestD = Infinity;
    for (const t of targets) {
      if (t.state !== 'pending' || t.lane !== i) continue;
      const d = Math.abs(t.t - clock);
      if (d <= goodW && d < bestD) { best = t; bestD = d; }
    }
    if (best) {
      const perfect = bestD <= perfectW;
      best.state = perfect ? 'perfect' : 'good';
      counts[best.state]++; counts.strokes++;
      pts += perfect ? 100 : 60;
      combo++; maxCombo = Math.max(maxCombo, combo); comboPop = 1;
      pop(i, perfect ? 'Perfect' : 'Good', perfect ? pal.accent : pal.good);
      burst(i, perfect);
    } else if (inStrayZone()) {
      strays++; combo = 0; counts.strokes++;
      pop(i, 'Off beat', pal.bad); emit(i, 4, pal.bad, 90, 2, 2.5, 0.35);
    }
  };

  const judgeFree = (i) => {
    if (clock < 0) return;
    const grid = spb / P.subdivision, k = Math.round(clock / grid), err = Math.abs(clock - k * grid);
    const pw = Math.min(grid * 0.3, grid * 0.12 * P.tolerance), gw = Math.min(grid * 0.45, grid * 0.25 * P.tolerance);
    counts.strokes++;
    if (k === lastSlot) { counts.off++; combo = 0; pop(i, 'Off beat', pal.bad); emit(i, 4, pal.bad, 90, 2, 2.5, 0.35); return; }
    if (err <= pw) { counts.perfect++; combo++; lastSlot = k; pop(i, 'Perfect', pal.accent); comboPop = 1; burst(i, true); }
    else if (err <= gw) { counts.good++; combo++; lastSlot = k; pop(i, 'Good', pal.good); comboPop = 1; burst(i, false); }
    else { counts.off++; combo = 0; pop(i, 'Off beat', pal.bad); emit(i, 4, pal.bad, 90, 2, 2.5, 0.35); }
    maxCombo = Math.max(maxCombo, combo);
  };

  const percent = () => {
    if (P.mode === 'free') {
      const acc = (counts.perfect + counts.good * 0.6) / Math.max(1, counts.strokes);
      return Math.round(100 * acc * Math.min(1, (counts.perfect + counts.good) / free.want));
    }
    const total = targets.length;
    if (!total) return 0;
    return Math.round(clamp((pts - strays * STRAY) / (100 * total), 0, 1) * 100);
  };
  const starsFor = (pct) => {
    if (P.mode === 'free') return pct >= 80 ? 3 : pct >= 60 ? 2 : pct >= 45 ? 1 : 0;
    return pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 40 ? 1 : 0;
  };
  const finish = () => {
    const pct = percent(), stars = starsFor(pct);
    const headline = stars === 3 ? 'In perfect time!' : stars === 2 ? 'Steady playing' : stars === 1 ? 'Finding the beat' : 'Listen once more';
    const detail = P.mode === 'free'
      ? `${counts.perfect} perfect, ${counts.good} good, ${counts.off} off the pulse`
      : `${counts.perfect} perfect, ${counts.good} good, ${counts.miss} missed, best run ${maxCombo}`;
    done = { score: pct, max: 100, stars, headline, detail: auto ? 'The computer played it for you' : detail };
  };

  // ---- time step -----------------------------------------------------------------------------------------------------
  const advance = (dt, presses) => {
    if (done) return;
    clock += dt;
    for (let i = 0; i < N; i++) flash[i] = Math.max(0, flash[i] - dt * 4);
    anim += dt; comboPop = Math.max(0, comboPop - dt * 3.2); missFlash = Math.max(0, missFlash - dt * 2.4);
    let w = 0;
    for (const p of pops) { p.age += dt; if (p.age < 0.8) pops[w++] = p; }
    pops.length = w;
    for (let k = 0; k < PN; k++) { const p = part[k]; if (!p.on) continue; p.life -= dt; if (p.life <= 0) { p.on = false; continue; } p.x += p.vx * dt; p.y += p.vy * dt; if (p.kind === 0) p.vy += 420 * dt; }
    
    // pulse
    while (clock >= nextBeat * spb) {
      if (showTick || nextBeat < 0) tick(((nextBeat % meter) + meter) % meter === 0);
      nextBeat++;
    }
    if (P.drone && P.mode === 'free') {
      droneT -= dt;
      if (droneT <= 0) { droneT = 2; audio?.tone({ freq: P.root / 2, dur: 2.2, type: 'sine', vol: 0.1 }); audio?.tone({ freq: (P.root / 2) * 1.5, dur: 2.2, type: 'sine', vol: 0.05 }); }
    }
    // computer demonstration in learn mode
    while (nextDemo < demos.length && demos[nextDemo].t <= clock) { const d = demos[nextDemo++]; strike(d.lane, d.len); flash[d.lane] = 1; }
    for (const i of presses) hitLane(i);
    for (const t of targets) {
      if (t.state === 'pending' && clock - t.t > goodW) { t.state = 'miss'; counts.miss++; combo = 0; pop(t.lane, 'Miss', pal.bad); missFlash = 1; emit(t.lane, 6, mix(pal.bad, '#555555', 0.3), 110, 2, 2.6, 0.5); }
    }
    if (P.mode === 'free') { if (clock >= endT) finish(); return; }
    if (clock > endT + goodW + 0.1 && targets.every((t) => t.state !== 'pending')) finish();
  };

  // ---- geometry --------------------------------------------------------------------------------------------------------
  const geometry = (a) => {
    const landscape = a.w > a.h * 1.15;
    const cw = Math.min(a.w / N, 200), x0 = a.x + (a.w - cw * N) / 2;
    let surfaceH = clamp(a.h * (landscape ? 0.36 : 0.34), 104, 300);
    if (P.layout === 'circle') surfaceH = clamp(a.h * 0.27, 120, 210);
    if (P.mode === 'learn') { // no highway: the chart takes what it needs and the instrument gets the rest
      const cols0 = Math.min(8, Math.max(2, meter)), need = Math.ceil(songBeats / cols0) * 50 + 56;
      surfaceH = clamp(a.h - need, 130, a.h * 0.5);
    }
    const hitY = a.y + a.h - surfaceH;
    const top = a.y + 36;
    return { a, landscape, cw, x0, surfaceH, hitY, top, mid: x0 + (cw * N) / 2, laneX: (i) => x0 + i * cw };
  };
  const elemRect = (L, i) => ({ x: L.laneX(i) + 4, y: L.hitY + 8, w: L.cw - 8, h: L.surfaceH - 16 });

  // ---- input -------------------------------------------------------------------------------------------------------------
  const readPresses = (input) => {
    const out = [];
    const p = input.pointer;
    if (p?.pressed && layout) {
      const L = layout;
      for (let i = 0; i < N; i++) {
        const x = L.laneX(i);
        if (p.x >= x && p.x < x + L.cw && p.y >= L.a.y && p.y <= L.a.y + L.a.h) { out.push(i); break; }
      }
    }
    const kp = input.keys?.pressed;
    if (kp && kp.size) for (let i = 0; i < Math.min(N, KEYS.length); i++) if (kp.has(KEYS[i]) || kp.has(DIGITS[i])) out.push(i);
    return out;
  };

  // ---- drawing ---------------------------------------------------------------------------------------------------------------
  const fit = (g, s, size, maxW) => Math.min(size, size * maxW / Math.max(1, s.length * size * 0.58));
  const look = clamp(spb * 4, 1.6, 3.4);
  const KP = 0.85, S1 = 1 / (1 + KP);
  const sc = (tau) => 1 / (1 + KP * Math.max(-0.2, tau));
  const beatPulse = () => { const ph = (((clock / spb) % 1) + 1) % 1; return Math.exp(-ph * 4.5); };
  const nameLabel = (g, s, x, y, size, maxW, col = '#ffffff') => text(g.ctx, s, x, y, fit(g, s, size, maxW), col, { outline: 'rgba(10,6,2,0.85)', lw: Math.max(2, size * 0.18) });

  // perspective: the highway narrows toward the horizon (`tau` = time to the line over the look-ahead)
  const yAt = (L, tau) => L.hitY - (L.hitY - L.top) * (1 - sc(tau)) / (1 - S1);
  const xAt = (L, x, tau) => L.mid + (x - L.mid) * sc(tau);
  const quad = (ctx, L, xa, xb, t0, t1) => {
    ctx.beginPath(); ctx.moveTo(xAt(L, xa, t0), yAt(L, t0)); ctx.lineTo(xAt(L, xb, t0), yAt(L, t0)); ctx.lineTo(xAt(L, xb, t1), yAt(L, t1)); ctx.lineTo(xAt(L, xa, t1), yAt(L, t1)); ctx.closePath();
  };
  const stringCol = (l) => mix('#efe8d4', l.color, 0.25);

  const anchor = (L, lane) => {
    if (P.layout === 'circle') { const r = elemRect(L, lane); return { x: r.x + r.w / 2, y: r.y + r.h * 0.4 }; }
    return { x: L.laneX(lane) + L.cw / 2, y: L.hitY };
  };

  const drawHighway = (g, L, list, soft) => {
    const { ctx } = g, N2 = N, xa = L.x0, xb = L.x0 + L.cw * N2, span = L.hitY - L.top, pul = beatPulse();
    const top = 1.04;
    // track bed
    quad(ctx, L, xa - 6, xb + 6, 0, top);
    if (P.layout === 'strings') {
      ctx.fillStyle = hgrad(ctx, xa, xb, [[0, '#120a05'], [0.5, '#2b170b'], [1, '#120a05']]); ctx.fill();
      ctx.save(); quad(ctx, L, xa - 6, xb + 6, 0, top); ctx.clip();
      grain(ctx, xa - 6, L.top, xb - xa + 12, span, '#7a4a28', 0.2, 5, true, Math.max(10, N2 * 3));
      ctx.restore();
    } else if (P.layout === 'steps') {
      ctx.fillStyle = vgrad(ctx, L.top, L.hitY, [[0, darker(S.floor, 0.5)], [1, lighter(S.floor, 0.1)]]); ctx.fill();
      ctx.save(); quad(ctx, L, xa - 6, xb + 6, 0, top); ctx.clip();
      ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 1.2;
      for (let k = 0; k <= N2 * 2; k++) { const x = xa + (k / (N2 * 2)) * (xb - xa); ctx.beginPath(); ctx.moveTo(xAt(L, x, 0), yAt(L, 0)); ctx.lineTo(xAt(L, x, top), yAt(L, top)); ctx.stroke(); }
      ctx.restore();
    } else {
      ctx.fillStyle = vgrad(ctx, L.top, L.hitY, [[0, 'rgba(8,10,14,0.55)'], [1, 'rgba(8,10,14,0.82)']]); ctx.fill();
    }
    // lane tints and dividers
    for (let i = 0; i < N2; i++) {
      const col = lanes[i].color, xl = L.laneX(i), xr = xl + L.cw;
      quad(ctx, L, xl, xr, 0, top);
      ctx.fillStyle = vgrad(ctx, L.top, L.hitY, [[0, rgba(col, 0.04)], [1, rgba(col, 0.14 + 0.16 * flash[i])]]);
      ctx.fill();
      if (flash[i] > 0.05) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; quad(ctx, L, xl, xr, 0, 0.7); ctx.fillStyle = vgrad(ctx, yAt(L, 0.7), L.hitY, [[0, rgba(col, 0)], [1, rgba(col, 0.22 * flash[i])]]); ctx.fill(); ctx.restore(); }
    }
    if (P.layout !== 'strings') {
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
      for (let i = 0; i <= N2; i++) { const x = L.x0 + i * L.cw; ctx.beginPath(); ctx.moveTo(xAt(L, x, 0), yAt(L, 0)); ctx.lineTo(xAt(L, x, top), yAt(L, top)); ctx.stroke(); }
    }
    // beat lines: frets on a neck, floor seams on a stage, light bars elsewhere
    const b0 = Math.floor(clock / spb);
    for (let b = b0; b <= b0 + Math.ceil(look / spb) + 1; b++) {
      const tau = (b * spb - clock) / look;
      if (tau < 0 || tau > top) continue;
      const y = yAt(L, tau), s = sc(tau), a = xAt(L, xa - 6, tau), z = xAt(L, xb + 6, tau), down = b % meter === 0;
      if (P.layout === 'strings') {
        ctx.fillStyle = vgrad(ctx, y - 2 * s, y + 2 * s, [[0, '#7c7466'], [0.4, down ? '#fff6dc' : '#e0dac8'], [1, '#5a5448']]); ctx.fillRect(a, y - (down ? 2.5 : 1.6) * s, z - a, (down ? 5 : 3.2) * s);
        if (down) { const mid = (a + z) / 2; circ2(ctx, mid, y - span * 0.08 * s, 5 * s, 'rgba(240,230,200,0.5)'); }
      } else {
        ctx.strokeStyle = down ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.1)'; ctx.lineWidth = (down ? 2.4 : 1.2) * s;
        ctx.beginPath(); ctx.moveTo(a, y); ctx.lineTo(z, y); ctx.stroke();
      }
    }
    // strings run the length of the neck
    if (P.layout === 'strings') {
      for (let i = 0; i < N2; i++) {
        const l = lanes[i], f = flash[i], x = L.laneX(i) + L.cw / 2, wdt = 1.3 + (1 - i / N2) * 1.7;
        const amp = 5 * f * Math.sin(anim * 85 + i * 1.7);
        const x0 = xAt(L, x, top), y0 = yAt(L, top);
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = wdt + 1.5; ctx.beginPath(); ctx.moveTo(x0 + 1.5, y0); ctx.quadraticCurveTo((x0 + x) / 2 + amp + 1.5, (y0 + L.hitY) / 2, x + 1.5, L.hitY); ctx.stroke();
        ctx.strokeStyle = f > 0.02 ? lighter(l.color, 0.6) : stringCol(l); ctx.lineWidth = wdt; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x) / 2 + amp, (y0 + L.hitY) / 2, x, L.hitY); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x0 - wdt * 0.25, y0); ctx.quadraticCurveTo((x0 + x) / 2 + amp - wdt * 0.25, (y0 + L.hitY) / 2, x - wdt * 0.25, L.hitY); ctx.stroke();
      }
    }
    if (P.layout === 'strings') {
      for (const x of [xa - 6, xb + 6]) { ctx.strokeStyle = 'rgba(240,222,180,0.75)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(xAt(L, x, 0), yAt(L, 0)); ctx.lineTo(xAt(L, x, top), yAt(L, top)); ctx.stroke(); }
    }
    // nut / horizon light
    quad(ctx, L, xa - 6, xb + 6, top, top + 0.0); ctx.strokeStyle = rgba(pal.accent, 0.35); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xAt(L, xa - 6, top), yAt(L, top)); ctx.lineTo(xAt(L, xb + 6, top), yAt(L, top)); ctx.stroke();
    // hit zone
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = vgrad(ctx, L.hitY - 22, L.hitY + 10, [[0, rgba(pal.accent, 0)], [0.8, rgba(pal.accent, 0.18 + 0.22 * pul)], [1, rgba(pal.accent, 0)]]); ctx.fillRect(xa - 8, L.hitY - 22, xb - xa + 16, 32);
    ctx.restore();
    ctx.fillStyle = hgrad(ctx, xa, xb, [[0, rgba(pal.accent, 0.1)], [0.5, rgba('#fff7d6', 0.95)], [1, rgba(pal.accent, 0.1)]]); ctx.fillRect(xa - 6, L.hitY - 1.5, xb - xa + 12, 3);
    for (let i = 0; i < N2; i++) {
      const l = lanes[i], f = flash[i], cx = L.laneX(i) + L.cw / 2, rx = Math.min(L.cw * 0.38, 40), ry = rx * 0.34;
      ctx.fillStyle = rgba(l.color, 0.12 + 0.5 * f); ctx.beginPath(); ctx.ellipse(cx, L.hitY, rx, ry, 0, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = rgba(lighter(l.color, 0.4 + 0.5 * f), 0.7 + 0.3 * f); ctx.lineWidth = 2.5 + 2 * f; ctx.stroke();
      if (pul > 0.05) { ctx.strokeStyle = rgba(l.color, 0.5 * pul); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, L.hitY, rx * (1 + 0.45 * (1 - pul)), ry * (1 + 0.45 * (1 - pul)), 0, 0, 6.2832); ctx.stroke(); }
    }
    // notes: glossy gems with trails and sustain ribbons
    ctx.save(); ctx.beginPath(); ctx.rect(L.x0 - 20, L.top - 10, L.cw * N2 + 40, span + 56); ctx.clip();
    const shape = S.gem, nb = clamp(L.cw * (shape === 'foot' ? 0.42 : 0.36), 12, shape === 'foot' ? 36 : 29);
    for (let k = list.length - 1; k >= 0; k--) {
      const t = list[k];
      if (t.state && t.state !== 'pending' && t.state !== 'miss') continue;
      const tau = (t.t - clock) / look;
      if (tau > top + 0.05 || tau < -0.2) continue;
      const lane = lanes[t.lane], s = sc(tau), x = xAt(L, L.laneX(t.lane) + L.cw / 2, tau), y = yAt(L, tau), r = nb * s;
      const miss = t.state === 'miss', a = (soft ? 0.5 : 1) * (miss ? 0.4 : 1) * clamp((top + 0.05 - tau) * 10, 0, 1) * clamp((tau + 0.2) * 8, 0, 1);
      const col = miss ? mix(lane.color, '#555555', 0.6) : lane.color;
      if (t.len) { // sustained: a glowing ribbon
        const t2 = tau + (t.len * spb) / look, yT = yAt(L, t2), xT = xAt(L, L.laneX(t.lane) + L.cw / 2, t2), w1 = r * 0.5, w2 = nb * sc(t2) * 0.5;
        ctx.globalAlpha = a * 0.85;
        ctx.fillStyle = vgrad(ctx, yT, y, [[0, rgba(col, 0.15)], [1, rgba(lighter(col, 0.2), 0.9)]]);
        ctx.beginPath(); ctx.moveTo(x - w1, y); ctx.lineTo(x + w1, y); ctx.lineTo(xT + w2, yT); ctx.lineTo(xT - w2, yT); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = rgba('#ffffff', 0.45); ctx.lineWidth = 1.2; ctx.stroke(); ctx.globalAlpha = 1;
      } else if (!miss && tau > 0.02) { // comet trail
        const yT = yAt(L, tau + 0.2), xT = xAt(L, L.laneX(t.lane) + L.cw / 2, tau + 0.2);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
        ctx.fillStyle = vgrad(ctx, yT, y, [[0, rgba(col, 0)], [1, rgba(col, 0.4)]]);
        ctx.beginPath(); ctx.moveTo(x - r * 0.6, y); ctx.lineTo(x + r * 0.6, y); ctx.lineTo(xT + r * 0.12, yT); ctx.lineTo(xT - r * 0.12, yT); ctx.closePath(); ctx.fill(); ctx.restore();
      }
      if (!miss && tau < 0.25) glow(ctx, x, y, r * (2.1 + (0.25 - tau) * 3), col, 0.28 * (1 - tau * 2) * a);
      gem(ctx, shape, x, y, r * (shape === 'foot' ? 1.15 : 1), col, a, lane.icon);
      if (r >= 9 && shape !== 'foot') nameLabel(g, lane.name, x, y + (shape === 'bead' ? 0 : 0), Math.max(9, r * 0.82), r * 1.7, miss ? '#c8c8c8' : '#ffffff');
    }
    ctx.restore();
  };
  const circ2 = (ctx, x, y, r, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x, y, Math.max(0.5, r), 0, 6.2832); ctx.fill(); };

  const drawRing = (g, L) => {
    const { ctx } = g, h = L.hitY - L.top, cx = L.a.x + L.a.w / 2, cy = L.top + h / 2 + 2, r = Math.max(30, Math.min(L.a.w * 0.42, h / 2 - 18));
    const cyc = cycleBeats, pb = clock / spb, cb = ((pb % cyc) + cyc) % cyc, ci = Math.max(0, Math.floor(pb / cyc)), pul = beatPulse();
    // bronze bezel and dark face that breathes
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(cx + 3, cy + 6, r + 16, 0, 6.2832); ctx.fill();
    ctx.fillStyle = rgrad(ctx, cx, cy, r * 0.6, r + 16, [[0, '#d7a550'], [0.5, '#8a5a1e'], [1, '#3e2408']], cx - r * 0.3, cy - r * 0.4);
    ctx.beginPath(); ctx.arc(cx, cy, r + 14, 0, 6.2832); ctx.fill();
    ctx.fillStyle = rgrad(ctx, cx, cy, 0, r + 2, [[0, mix(pal.bg, pal.accent, 0.12 + 0.08 * pul)], [1, darker(pal.bg, 0.55)]]);
    ctx.beginPath(); ctx.arc(cx, cy, r + 2, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = 'rgba(255,230,170,0.55)'; ctx.lineWidth = 2; ctx.stroke();
    const ang = (b) => -Math.PI / 2 + (b / cyc) * Math.PI * 2;
    for (let b = 0; b < cyc; b++) { const a = ang(b), big = b % meter === 0; circ2(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r, big ? 4.5 : 2.5, big ? 'rgba(255,225,150,0.95)' : 'rgba(255,255,255,0.35)'); }
    // sweeping cursor with a fading wake
    const ca = ang(clock < 0 ? 0 : cb);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 10; k++) { const a0 = ca - (k + 1) * 0.045 * (cyc > 8 ? 1 : 2), a1 = ca - k * 0.045 * (cyc > 8 ? 1 : 2); ctx.fillStyle = rgba(pal.accent, 0.2 * (1 - k / 10)); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r - 6, a0, a1); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = rgba('#fff3c8', 0.95); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ca) * (r - 4), cy + Math.sin(ca) * (r - 4)); ctx.stroke();
    circ2(ctx, cx, cy, 7, pal.accent);
    const list = P.mode === 'free' ? guide : targets;
    const mr = Math.max(10, Math.min(19, r * 0.13));
    for (const t of list) {
      if (t.b < ci * cyc || t.b >= (ci + 1) * cyc) continue;
      const a = ang(t.b - ci * cyc), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      const lit = t.state === 'perfect' || t.state === 'good';
      const col = lit ? (t.state === 'perfect' ? pal.accent : pal.good) : t.state === 'miss' ? mix(pal.bad, '#444444', 0.4) : lanes[t.lane].color;
      if (lit) glow(ctx, x, y, mr * 3, col, 0.5);
      gem(ctx, 'bead', x, y, mr, col, P.mode === 'free' ? 0.6 : 1, null);
      nameLabel(g, lanes[t.lane].name, cx + Math.cos(a) * (r - mr - 16), cy + Math.sin(a) * (r - mr - 16), g.px(15), 60, pal.ink);
    }
    text(ctx, `${Math.floor(cb) + 1} / ${cyc}`, cx, cy + r * 0.38, g.px(24), rgba(pal.ink, 0.8), { weight: '800' });
  };

  // ---- instrument surface ------------------------------------------------------------------------------------------------------
  const drawSurfaceBase = (g, L) => {
    const { ctx } = g, a = L.a, xa = L.x0, xb = L.x0 + L.cw * N, Y0 = L.hitY, Y1 = a.y + a.h;
    switch (P.layout) {
      case 'strings': {
        const X0 = Math.max(a.x + 2, xa - 18), X1 = Math.min(a.x + a.w - 2, xb + 18);
        drawBody(ctx, S, pal, X0, X1, Y0, Y1 + 10, pal.accent);
        const bs = bridgeScale(S.body), cxm = (xa + xb) / 2, by = Y0 + (Y1 - Y0) * 0.68;
        // bridge and tail
        const bw = (xb - xa) * bs + 22;
        ctx.fillStyle = 'rgba(0,0,0,0.45)'; rrect(ctx, cxm - bw / 2 + 2, by - 3, bw, 13, 5); ctx.fill();
        ctx.fillStyle = vgrad(ctx, by - 6, by + 8, [[0, '#6a4026'], [0.4, '#2c170a'], [1, '#150a04']]); rrect(ctx, cxm - bw / 2, by - 6, bw, 13, 5); ctx.fill();
        ctx.fillStyle = 'rgba(255,240,200,0.8)'; ctx.fillRect(cxm - bw / 2 + 4, by - 6, bw - 8, 2);
        for (let i = 0; i < N; i++) {
          const l = lanes[i], f = flash[i], x = L.laneX(i) + L.cw / 2, xb2 = cxm + (x - cxm) * bs, wdt = 1.3 + (1 - i / N) * 1.7;
          const amp = 7 * f * Math.sin(anim * 85 + i * 1.7), my = (Y0 + by) / 2;
          ctx.lineCap = 'round';
          ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = wdt + 1.5; ctx.beginPath(); ctx.moveTo(x + 2, Y0); ctx.quadraticCurveTo((x + xb2) / 2 + amp + 2, my, xb2 + 2, by); ctx.stroke();
          ctx.strokeStyle = f > 0.02 ? lighter(l.color, 0.6) : stringCol(l); ctx.lineWidth = wdt; ctx.beginPath(); ctx.moveTo(x, Y0); ctx.quadraticCurveTo((x + xb2) / 2 + amp, my, xb2, by); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x - 0.5, Y0); ctx.quadraticCurveTo((x + xb2) / 2 + amp - 0.5, my, xb2 - 0.5, by); ctx.stroke();
          if (f > 0.02) glow(g.ctx, (x + xb2) / 2, my, L.cw * 0.9, l.color, 0.55 * f);
        }
        break;
      }
      case 'keys': {
        if (S.key === 'bells') {
          ctx.fillStyle = vgrad(ctx, Y0, Y0 + 16, [[0, '#8a5a2a'], [1, '#3a200e']]); rrect(ctx, a.x + 4, Y0 + 2, a.w - 8, 16, 6); ctx.fill();
          ctx.fillStyle = 'rgba(255,230,180,0.35)'; ctx.fillRect(a.x + 8, Y0 + 4, a.w - 16, 2);
        } else if (S.key === 'tines' || S.key === 'buttons') {
          const bx = Math.max(a.x + 2, xa - 10), bw2 = Math.min(a.w - 4, xb - xa + 20);
          ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, bx + 3, Y0 + 7, bw2, Y1 - Y0 - 10, 18); ctx.fill();
          ctx.fillStyle = hgrad(ctx, bx, bx + bw2, [[0, darker(S.wood, 0.45)], [0.35, lighter(S.wood, 0.25)], [0.7, S.wood], [1, darker(S.wood, 0.5)]]);
          rrect(ctx, bx, Y0 + 4, bw2, Y1 - Y0 - 10, 18); ctx.fill();
          ctx.save(); rrect(ctx, bx, Y0 + 4, bw2, Y1 - Y0 - 10, 18); ctx.clip(); grain(ctx, bx, Y0 + 4, bw2, Y1 - Y0, darker(S.wood, 0.7), 0.3, 21, false, 12); ctx.restore();
          ctx.strokeStyle = 'rgba(255,225,170,0.5)'; ctx.lineWidth = 2; rrect(ctx, bx, Y0 + 4, bw2, Y1 - Y0 - 10, 18); ctx.stroke();
          if (S.key === 'tines') { ctx.fillStyle = vgrad(ctx, Y0 + (Y1 - Y0) * 0.5, Y0 + (Y1 - Y0) * 0.5 + 10, [[0, '#d8dce2'], [1, '#5a626c']]); rrect(ctx, bx + 8, Y0 + (Y1 - Y0) * 0.58, bw2 - 16, 9, 4); ctx.fill(); }
        } else { // xylophone frame: two rails with cord ties
          for (const k of [0.16, 0.8]) {
            const yy = Y0 + (Y1 - Y0) * k;
            ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, xa - 8, yy + 3, xb - xa + 16, 12, 5); ctx.fill();
            ctx.fillStyle = vgrad(ctx, yy, yy + 12, [[0, lighter('#5a3a1c', 0.2)], [1, '#2a170a']]); rrect(ctx, xa - 8, yy, xb - xa + 16, 12, 5); ctx.fill();
          }
        }
        break;
      }
      case 'steps': {
        if (S.dancer === 'kerchief') {
          const fl = flash.reduce((m, v) => Math.max(m, v), 0);
          kerchief(ctx, a.x + 16, a.y + 96, 46, lanes[0].color, anim + fl * 2, -0.3);
          kerchief(ctx, a.x + a.w - 64, a.y + 96, 46, lanes[1 % N].color, anim + 1.3 + fl * 2, -0.1);
        }
        const bx = Math.max(a.x + 2, xa - 10), bw2 = Math.min(a.w - 4, xb - xa + 20);
        ctx.fillStyle = vgrad(ctx, Y0 + 2, Y1, [[0, lighter(S.floor, 0.15)], [1, darker(S.floor, 0.45)]]); rrect(ctx, bx, Y0 + 4, bw2, Y1 - Y0 - 6, 16); ctx.fill();
        ctx.save(); rrect(ctx, bx, Y0 + 4, bw2, Y1 - Y0 - 6, 16); ctx.clip(); grain(ctx, bx, Y0, bw2, Y1 - Y0, '#1a0e06', 0.35, 31, false, 9); ctx.restore();
        ctx.strokeStyle = 'rgba(255,225,170,0.4)'; ctx.lineWidth = 2; rrect(ctx, bx, Y0 + 4, bw2, Y1 - Y0 - 6, 16); ctx.stroke();
        break;
      }
      case 'circle': {
        for (const k of [0.28, 0.62]) {
          const yy = Y0 + (Y1 - Y0) * k;
          ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(xa - 6, yy + 3); ctx.lineTo(xb + 6, yy + 3); ctx.stroke();
          ctx.strokeStyle = '#6a4220'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(xa - 6, yy); ctx.lineTo(xb + 6, yy); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,220,160,0.5)'; ctx.lineWidth = 1.2; ctx.stroke();
        }
        break;
      }
      case 'holes': {
        // a lashing board the pipes are bound to
        ctx.fillStyle = vgrad(ctx, Y0 + 2, Y1, [[0, rgba(S.wrap, 0)], [1, 'rgba(0,0,0,0.45)']]); ctx.fillRect(xa - 10, Y0 + 2, xb - xa + 20, Y1 - Y0 - 2);
        break;
      }
      default: { // drums stand on a woven mat
        const bx = Math.max(a.x + 2, xa - 10), bw2 = Math.min(a.w - 4, xb - xa + 20);
        ctx.fillStyle = vgrad(ctx, Y0 + 2, Y1, [[0, rgba(S.wood, 0.5)], [1, rgba(darker(S.wood, 0.7), 0.8)]]); rrect(ctx, bx, Y0 + 4, bw2, Y1 - Y0 - 6, 18); ctx.fill();
        ctx.strokeStyle = 'rgba(255,225,170,0.18)'; ctx.lineWidth = 1;
        for (let x = bx + 10; x < bx + bw2; x += 14) { ctx.beginPath(); ctx.moveTo(x, Y0 + 8); ctx.lineTo(x, Y1 - 4); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(255,225,170,0.35)'; ctx.lineWidth = 2; rrect(ctx, bx, Y0 + 4, bw2, Y1 - Y0 - 6, 18); ctx.stroke();
      }
    }
  };

  const drawElement = (g, i, r) => {
    const { ctx } = g, l = lanes[i], f = flash[i], c = l.color, cx = r.x + r.w / 2;
    switch (P.layout) {
      case 'strings': {
        const pw = Math.min(r.w - 2, 90), ph = g.px(15) + 10;
        ctx.fillStyle = 'rgba(14,7,3,0.8)'; rrect(ctx, cx - pw / 2, r.y + 2, pw, ph, ph / 2); ctx.fill();
        ctx.strokeStyle = rgba(f > 0.02 ? lighter(c, 0.5) : c, 0.95); ctx.lineWidth = 2; ctx.stroke();
        nameLabel(g, l.name, cx, r.y + 2 + ph / 2 + 1, g.px(15), pw - 10, '#fff4dc');
        break;
      }
      case 'keys': {
        const u = N > 1 ? i / (N - 1) : 0;
        if (S.key === 'bells') {
          const w = Math.min(r.w * (1.28 - 0.25 * u), 120), h = Math.min(w * 1.18, r.h * 0.46), row = i % 2, y = r.y + 8 + row * (r.h * 0.4);
          bell(ctx, S, cx, y, w, h, c, f, Math.sin(anim * 16 + i) * 0.2 * f);
          nameLabel(g, l.name, cx, y + h + 11, g.px(14), r.w + 6);
        } else if (S.key === 'tines') {
          const h = r.h * (0.88 - 0.4 * u);
          tine(ctx, S, cx - r.w * 0.2, r.y + 6, r.w * 0.4, h, c, f, i, Math.sin(anim * 90 + i) * 2.2 * f);
          nameLabel(g, l.name, cx, r.y + 6 + h + 14, g.px(15), r.w - 6, '#fff4dc');
        } else if (S.key === 'buttons') {
          const rr = Math.min(r.w * 0.38, r.h * 0.14);
          pearlButton(ctx, S, cx, r.y + r.h * (0.2 + 0.26 * (i % 3)), rr, c, f);
          nameLabel(g, l.name, cx, r.y + r.h * (0.2 + 0.26 * (i % 3)) + rr + 12, g.px(14), r.w - 4, '#fff4dc');
        } else {
          const maxH = Math.min(r.h * 0.8, r.w * 7), h = maxH * (0.98 - 0.34 * u), w = r.w * 0.84, y = r.y + 8 + (maxH - h) / 2;
          bar(ctx, S, cx - w / 2, y, w, h, c, f, i * 5 + 2, r.y + 8 + maxH + w * 0.45);
          nameLabel(g, l.name, cx, y + h * 0.5, g.px(18), w - 6);
        }
        break;
      }
      case 'holes': {
        const tw = Math.min(r.w * 0.64, 62), th = r.h * 0.8;
        pipe(ctx, S, cx - tw / 2, r.y + 4, tw, th, c, f, l.holes, anim, i);
        nameLabel(g, l.name, cx, r.y + r.h - 12, g.px(16), r.w - 4, '#fff4dc');
        break;
      }
      case 'steps': {
        const w = r.w * 0.92, h = r.h * 0.78, x = cx - w / 2, y = r.y + 4, s = Math.min(w * 0.4, h * 0.3) * (1 + 0.12 * f);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, x + 2, y + 4, w, h, 16); ctx.fill();
        ctx.fillStyle = vgrad(ctx, y, y + h, [[0, mix(lighter(S.floor, 0.1), c, 0.35 + 0.3 * f)], [1, mix(darker(S.floor, 0.4), c, 0.25 + 0.3 * f)]]); rrect(ctx, x, y, w, h, 16); ctx.fill();
        ctx.strokeStyle = rgba(lighter(c, 0.4 + 0.4 * f), 0.95); ctx.lineWidth = 2.5; ctx.stroke();
        glow(ctx, cx, y + h * 0.42, w * 0.7, c, 0.45 * f);
        stepIcon(ctx, l.icon, cx + 1.5, y + h * 0.42 + 2, s, 'rgba(0,0,0,0.4)', 0);
        stepIcon(ctx, l.icon, cx, y + h * 0.42, s, lighter(c, 0.82), f);
        nameLabel(g, l.name, cx, r.y + r.h - 12, g.px(16), r.w - 4, '#fff4dc');
        break;
      }
      case 'circle': {
        const st = N > 5 && r.w < r.h * 0.7, rad = st ? Math.min(r.w * 0.66, r.h * 0.26) : Math.min(r.w * 0.46, r.h * 0.36), y = st ? r.y + r.h * (0.24 + 0.34 * (i % 2)) : r.y + r.h * 0.4;
        const gcx = st ? clamp(cx, layout.a.x + rad + 3, layout.a.x + layout.a.w - rad - 3) : cx;
        gong(ctx, S, gcx, y, rad, c, f);
        nameLabel(g, l.name, gcx, y + rad + 11, g.px(14), r.w + 4, '#fff4dc');
        break;
      }
      default: {
        const st = N >= 5 && r.w < r.h * 0.6;
        const rad = st ? Math.min(r.w * 0.68, r.h * 0.23) : Math.min(r.w * 0.47, r.h * 0.43), y = st ? r.y + r.h * (0.25 + 0.42 * (i % 2)) : r.y + r.h * 0.46;
        const dcx = st ? clamp(cx, layout.a.x + rad + 3, layout.a.x + layout.a.w - rad - 3) : cx;
        drumHead(ctx, S, dcx, y, rad, c, f, anim, i * 7);
        nameLabel(g, l.name, dcx, y, g.px(st ? 18 : 22), rad * 1.5);
      }
    }
  };

  const drawParticles = (g, L) => {
    const { ctx } = g;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < PN; k++) {
      const p = part[k];
      if (!p.on) continue;
      const an = anchor(L, p.lane), u = clamp(p.life / p.max, 0, 1), x = an.x + p.x, y = an.y + p.y;
      if (p.kind === 1) { ctx.strokeStyle = rgba(p.color, 0.8 * u); ctx.lineWidth = 2 + 3 * u; ctx.beginPath(); ctx.ellipse(x, y, p.size * (1.4 - u), p.size * (1.4 - u) * 0.45, 0, 0, 6.2832); ctx.stroke(); }
      else if (p.kind === 3) { const s2 = p.size * (0.4 + u); ctx.fillStyle = rgba('#fff7d0', 0.9 * u); ctx.beginPath(); ctx.moveTo(x, y - s2); ctx.lineTo(x + s2 * 0.25, y - s2 * 0.25); ctx.lineTo(x + s2, y); ctx.lineTo(x + s2 * 0.25, y + s2 * 0.25); ctx.lineTo(x, y + s2); ctx.lineTo(x - s2 * 0.25, y + s2 * 0.25); ctx.lineTo(x - s2, y); ctx.lineTo(x - s2 * 0.25, y - s2 * 0.25); ctx.closePath(); ctx.fill(); }
      else { ctx.fillStyle = rgba(p.color, (p.kind === 2 ? 0.7 : 0.95) * u); ctx.beginPath(); ctx.arc(x, y, Math.max(0.6, p.size * (0.4 + 0.6 * u)), 0, 6.2832); ctx.fill(); }
    }
    ctx.restore();
  };

  const rank = { pending: 0, perfect: 1, good: 2, miss: 3 };
  const sheetCells = () => {
    // learn mode: one cell per beat of the song, rows of `meter` beats (a tala diagram for 16-beat cycles)
    const cells = [];
    for (let b = 0; b < songBeats; b++) cells.push({ b, names: [], state: null });
    for (const s of steps) if (cells[Math.floor(s.beat)]) cells[Math.floor(s.beat)].names.push(lanes[s.lane].name);
    return cells;
  };
  const tile = (g, x, y, w, h, fillCol, edge, glowCol, glowA, label, labelCol, size) => {
    const { ctx } = g;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, x + 1, y + 3, w, h, 12); ctx.fill();
    ctx.fillStyle = vgrad(ctx, y, y + h, [[0, lighter(fillCol, 0.18)], [0.5, fillCol], [1, darker(fillCol, 0.35)]]); rrect(ctx, x, y, w, h, 12); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; rrect(ctx, x + 3, y + 2, w - 6, h * 0.3, 9); ctx.fill();
    ctx.strokeStyle = edge; ctx.lineWidth = 2; rrect(ctx, x, y, w, h, 12); ctx.stroke();
    if (glowA > 0.02) glow(ctx, x + w / 2, y + h / 2, Math.max(w, h) * 1.1, glowCol, glowA);
    nameLabel(g, label, x + w / 2, y + h / 2 + 1, size, w - 10, labelCol);
  };
  const drawSheet = (g, L) => {
    const cells = sheetCells(), pul = beatPulse();
    const availH = L.hitY - L.top - 8, maxRows = Math.max(1, Math.floor(availH / 40));
    let cols = Math.min(8, Math.max(2, meter));
    while (Math.ceil(songBeats / cols) > maxRows && cols < 16) cols += meter;
    const rows = Math.ceil(songBeats / cols), cw = Math.min(150, (L.a.w - 16) / cols), ch = Math.min(120, availH / rows - 6);
    const x0 = L.a.x + (L.a.w - cw * cols) / 2, y0 = L.top + 4;
    const sec = sections.find((s) => clock >= s.from && clock < s.to);
    const pr = sec ? (clock - sec.from) / spb : -1;
    for (const t of targets) { const c = cells[Math.floor(t.b)]; if (c && (c.state === null || rank[t.state] > rank[c.state])) c.state = t.state; }
    cells.forEach((c, i) => {
      const x = x0 + (i % cols) * cw, y = y0 + Math.floor(i / cols) * (ch + 6);
      const inPhrase = sec && c.b >= sec.lo && c.b < sec.lo + phraseBeats;
      const cur = sec && inPhrase && Math.floor(pr) === c.b - sec.lo;
      const base = c.state === 'perfect' ? mix(pal.accent, '#000000', 0.5) : c.state === 'good' ? mix(pal.good, '#000000', 0.55) : c.state === 'miss' ? mix(pal.bad, '#000000', 0.5) : mix(pal.panel, '#000000', 0.1);
      const hide = P.memory && sec && sec.kind === 'echo' && inPhrase && !cur && c.state === null;
      const txt = hide ? '?' : c.names.length ? c.names.join('·') : '·';
      const fillCol = cur ? (sec.kind === 'demo' ? pal.accent : pal.good) : base;
      tile(g, x + 2, y, cw - 4, ch, fillCol, inPhrase ? rgba(pal.accent, 0.9) : 'rgba(255,255,255,0.18)', fillCol, cur ? 0.35 + 0.3 * pul : 0, txt, cur ? '#10161c' : pal.ink, g.px(20));
      if (c.b % meter === 0) text(g.ctx, `${c.b + 1}`, x + 14, y + 11, g.px(11), cur ? '#10161c' : pal.dim, { weight: '600' });
    });
  };

  const drawFreeCells = (g, L) => {
    const n = cycleBeats, cols = Math.min(n, 8), rows = Math.ceil(n / cols), pul = beatPulse();
    const avail = L.hitY - L.top - 8, ch = Math.min(52, avail / rows - 6), cw = Math.min(90, (L.a.w - 16) / cols);
    const x0 = L.a.x + (L.a.w - cw * cols) / 2, y0 = L.top + 4, beat = clock < 0 ? -1 : Math.floor(clock / spb) % n;
    for (let i = 0; i < n; i++) {
      const x = x0 + (i % cols) * cw, y = y0 + Math.floor(i / cols) * (ch + 6), cur = i === beat;
      tile(g, x + 2, y, cw - 4, ch, cur ? pal.accent : pal.panel, i % meter === 0 ? pal.accent : 'rgba(255,255,255,0.18)', pal.accent, cur ? 0.3 + 0.3 * pul : 0, i === 0 ? '1 ★' : `${i + 1}`, cur ? '#10161c' : pal.dim, g.px(18));
    }
  };

  const hero = (g, rect) => {
    const { ctx } = g;
    ctx.save(); ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
    drawHero(ctx, S, pal, rect, lanes.map((l) => l.color), g.t ?? 0);
    ctx.restore();
  };


  const info = () => {
    if (clock < 0) return `Count in: ${Math.ceil(-clock / spb)}`;
    if (P.mode === 'learn') {
      const s = sections.find((x) => clock >= x.from && clock < x.to);
      return s ? (s.kind === 'demo' ? `Listen: phrase ${s.k + 1} of ${Math.ceil(songBeats / phraseBeats)}` : 'Your turn: play it back') : 'Well played';
    }
    if (P.mode === 'free') return `Play freely on the pulse: ${Math.max(0, Math.ceil(endT - clock))} s`;
    return song.name ? `${song.name}` : 'Follow the notes';
  };

  // ---- the activity ----------------------------------------------------------------------------------------------------------
  const act = {
    init,
    point(id) {
      if (!layout) return null;
      const m = /^lane:(\d+)$/.exec(id);
      if (!m) return null;
      const i = Number(m[1]);
      if (i >= N) return null;
      const r = elemRect(layout, i);
      return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
    },
    update(dt, input) { advance(dt, readPresses(input)); },
    attract(dt, input) {
      // Watch and learn: the computer strikes every target (or, in free mode, the guide) exactly on time.
      const presses = [];
      auto = true;
      if (P.mode === 'free') {
        while (attractIdx < guide.length && guide[attractIdx].t <= clock + dt) { presses.push(guide[attractIdx].lane); attractIdx++; }
        advance(dt, []);
        if (!done) for (const i of presses) hitLane(i);
        return;
      }
      for (const t of targets) if (t.state === 'pending' && t.t <= clock + dt) presses.push(t.lane);
      advance(dt, presses);
      void input;
    },
    render(g, area) {
      const { ctx } = g;
      layout = geometry(area);
      const L = layout, pul = beatPulse();
      drawBackdrop(ctx, area, S, pal, pul, Math.sin(anim * 0.8));
      text(ctx, info(), area.x + area.w / 2, area.y + 16, g.px(20), pal.dim, { weight: '600', outline: 'rgba(0,0,0,0.5)', lw: 3 });
      if (P.mode === 'learn') drawSheet(g, L);
      else if (P.layout === 'circle') drawRing(g, L);
      else if (P.mode === 'free') { if (guide.length && P.guide) drawHighway(g, L, guide, true); else drawFreeCells(g, L); }
      else drawHighway(g, L, targets, false);
      // count-in numeral and streak watermark
      if (clock < 0 && !done) {
        const n = Math.ceil(-clock / spb), mid = (L.top + L.hitY) / 2;
        text(ctx, String(n), L.mid, mid, Math.min(L.hitY - L.top, 220) * 0.55 * (0.9 + 0.25 * pul), rgba(pal.accent, 0.35 + 0.5 * pul), { weight: '900', outline: 'rgba(0,0,0,0.35)', lw: 6, family: 'Georgia, serif' });
      } else if (combo >= 5) {
        text(ctx, String(combo), L.mid, (L.top + L.hitY) / 2, Math.min(L.hitY - L.top, 240) * 0.5 * (1 + 0.12 * comboPop), rgba(pal.accent, 0.07 + 0.07 * comboPop), { weight: '900', family: 'Georgia, serif' });
      }
      // instrument surface
      drawSurfaceBase(g, L);
      for (let i = 0; i < N; i++) drawElement(g, i, elemRect(L, i));
      drawParticles(g, L);
      // judgement pop-ups: spring in, drift up, fade
      for (const p of pops) {
        const big = p.lane < 0, an = big ? { x: L.mid, y: L.top + (L.hitY - L.top) * 0.45 } : anchor(L, p.lane), u = p.age / 0.8, sp = u < 0.18 ? 0.6 + 2.2 * u : 1;
        ctx.globalAlpha = clamp(1.6 - 1.6 * u, 0, 1);
        text(ctx, p.text, clamp(an.x, area.x + 50, area.x + area.w - 50), an.y - (big ? 10 : 30) - u * (big ? 30 : 46), g.px(big ? 34 : 22) * sp, p.color, { weight: '800', outline: 'rgba(0,0,0,0.75)', lw: 4 });
        ctx.globalAlpha = 1;
      }
      // streak pill
      if (combo >= 3) {
        const s = 1 + 0.18 * comboPop, w = g.px(16) * 7.2, h = g.px(16) * 2.1, x = area.x + area.w - w / 2 - 8, y = area.y + 18 + h / 2;
        ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
        ctx.fillStyle = 'rgba(8,10,14,0.7)'; rrect(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fill();
        ctx.strokeStyle = combo >= 10 ? pal.accent : pal.dim; ctx.lineWidth = 2; ctx.stroke();
        text(ctx, `${combo} in a row`, 0, 1, g.px(16), combo >= 10 ? pal.accent : pal.ink, { weight: '800' });
        ctx.restore();
      }
      // a miss reddens the edges for a moment
      if (missFlash > 0.02) {
        ctx.fillStyle = rgrad(ctx, area.x + area.w / 2, area.y + area.h / 2, Math.min(area.w, area.h) * 0.3, Math.max(area.w, area.h) * 0.7, [[0, 'rgba(224,60,40,0)'], [1, `rgba(224,60,40,${0.35 * missFlash})`]]);
        ctx.fillRect(area.x, area.y, area.w, area.h);
      }
    },
    // A large, finished rendering of the instrument or dance for the title screen (the chrome calls it when it has the room).
    titleArt(g, rect) {
      const { ctx } = g;
      ctx.save(); ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
      drawBackdrop(ctx, rect, S, pal, 0.35, 0);
      hero(g, rect);
      ctx.restore();
    },
    status() {
      return { score: percent(), max: 100, label: info() };
    },
    result: () => done,
    hint() {
      if (P.mode === 'learn') return 'Say the names in time as you play: each cell is one beat.';
      if (P.mode === 'free') return 'Strike on the beat or on the half beat; the drone is the home note.';
      const next = targets.find((t) => t.state === 'pending');
      return next ? `Next: ${lanes[next.lane].name} in ${Math.max(0, (next.t - clock) / spb).toFixed(1)} beats` : 'Hold steady to the end.';
    },
    rules: () => [
      `Tempo ${Math.round((song.bpm ?? 80) * P.tempo)} beats per minute, ${meter} beats to the bar.`,
      `Perfect: within ${Math.round(perfectW * 1000)} ms of the beat. Good: within ${Math.round(goodW * 1000)} ms.`,
      ...(P.mode === 'free' ? ['Free play: strokes close to the pulse grid score; stray taps lower your accuracy.'] : ['Extra strokes between the notes cost points, so do not rush.']),
      'Keys: A S D F G H J K L ; play the lanes from left to right (or 1 to 0).',
    ],
    getState: () => ({
      mode: P.mode, layout: P.layout, song: song.name ?? '', lanes: N, clock: Math.round(clock * 1000) / 1000, spb: Math.round(spb * 10000) / 10000,
      targets: targets.map((t) => ({ t: Math.round(t.t * 1000) / 1000, lane: t.lane, state: t.state })),
      guideCount: guide.length, guide: guide.slice(0, 120).map((g) => ({ t: Math.round(g.t * 1000) / 1000, lane: g.lane })), counts: { ...counts }, strays, combo, maxCombo, points: pts, percent: percent(), done: !!done, endT: Math.round(endT * 1000) / 1000,
    }),
  };
  return act;
}

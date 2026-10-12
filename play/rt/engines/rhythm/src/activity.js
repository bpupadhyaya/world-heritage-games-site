// Rhythm activity: music and dance by beat and melody (docs/ENGINE-CONTRACT.md "Activity engines").
// A round is a timeline of TARGETS (strokes the player must hit) built from a song (a step list of { beat, lane, len? }).
//   learn  : the song is cut into phrases; the computer plays a phrase (lanes light up), then the player echoes it.
//   follow : the whole song falls toward a hit line (or around a cycle ring for 'circle'); hit each note on time.
//   free   : no targets; strokes are graded against the pulse grid, over a drone, with the song shown as a soft guide.
// Time comes only from dt accumulation (seconds). All windows scale with params.tolerance, tempo with params.tempo.

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

const hex = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (c1, c2, t) => { const a = hex(c1), b = hex(c2); return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`; };

export function createActivity(userParams, env) {
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
      combo++; maxCombo = Math.max(maxCombo, combo);
      pop(i, perfect ? 'Perfect' : 'Good', perfect ? pal.accent : pal.good);
    } else if (inStrayZone()) {
      strays++; combo = 0; counts.strokes++;
      pop(i, 'Off beat', pal.bad);
    }
  };

  const judgeFree = (i) => {
    if (clock < 0) return;
    const grid = spb / P.subdivision, k = Math.round(clock / grid), err = Math.abs(clock - k * grid);
    const pw = Math.min(grid * 0.3, grid * 0.12 * P.tolerance), gw = Math.min(grid * 0.45, grid * 0.25 * P.tolerance);
    counts.strokes++;
    if (k === lastSlot) { counts.off++; combo = 0; pop(i, 'Off beat', pal.bad); return; }
    if (err <= pw) { counts.perfect++; combo++; lastSlot = k; pop(i, 'Perfect', pal.accent); }
    else if (err <= gw) { counts.good++; combo++; lastSlot = k; pop(i, 'Good', pal.good); }
    else { counts.off++; combo = 0; pop(i, 'Off beat', pal.bad); }
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
    for (const p of pops) p.age += dt;
    pops = pops.filter((p) => p.age < 0.7);
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
      if (t.state === 'pending' && clock - t.t > goodW) { t.state = 'miss'; counts.miss++; combo = 0; pop(t.lane, 'Miss', pal.bad); }
    }
    if (P.mode === 'free') { if (clock >= endT) finish(); return; }
    if (clock > endT + goodW + 0.1 && targets.every((t) => t.state !== 'pending')) finish();
  };

  // ---- geometry --------------------------------------------------------------------------------------------------------
  const geometry = (a) => {
    const landscape = a.w > a.h * 1.15;
    const cw = Math.min(a.w / N, 200), x0 = a.x + (a.w - cw * N) / 2;
    const surfaceH = clamp(a.h * (landscape ? 0.36 : 0.34), 120, 300);
    const hitY = a.y + a.h - surfaceH;
    const top = a.y + 36;
    return { a, landscape, cw, x0, surfaceH, hitY, top, laneX: (i) => x0 + i * cw };
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

  const drawElement = (g, i, r) => {
    const { ctx } = g, l = lanes[i], f = flash[i], c = l.color;
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const lit = mix(c, '#ffffff', 0.55 * f), body = mix(c, '#000000', 0.38 - 0.3 * f);
    const label = (y, size = 20, col = pal.ink) => g.label(ctx, l.name, cx, y, fit(g, l.name, g.px(size), r.w - 4), col, 'center', '700');
    switch (P.layout) {
      case 'strings': {
        const y1 = r.y + 26, y2 = r.y + r.h - 6, amp = 7 * f * Math.sin(clock * 90 + i);
        ctx.strokeStyle = body; ctx.lineWidth = 2 + (l.row ? 0 : 1) + (i % 3) * 0.6;
        if (f > 0.02) ctx.strokeStyle = lit;
        ctx.beginPath();
        for (let k = 0; k <= 14; k++) { const u = k / 14, x = cx + amp * Math.sin(Math.PI * u); k ? ctx.lineTo(x, y1 + (y2 - y1) * u) : ctx.moveTo(x, y1); }
        ctx.stroke();
        ctx.fillStyle = mix(c, '#000000', 0.2); g.rr(ctx, cx - Math.min(r.w * 0.4, 20), y2 - 4, Math.min(r.w * 0.8, 40), 8, 3); ctx.fill();
        ctx.fillStyle = pal.dim; ctx.beginPath(); ctx.arc(cx, y1 - 4, 4, 0, Math.PI * 2); ctx.fill();
        label(r.y + 8, 15, pal.ink);
        break;
      }
      case 'keys': {
        const u = N > 1 ? i / (N - 1) : 0, h = r.h * (0.98 - 0.32 * u), w = r.w * 0.86;
        const y = r.y + (r.h - h) / 2;
        ctx.fillStyle = mix(c, '#000000', 0.55); g.rr(ctx, cx - w * 0.2, y + h * 0.7, w * 0.4, r.h - (y - r.y) - h * 0.7, 6); ctx.fill();
        ctx.fillStyle = f > 0.02 ? lit : body; g.rr(ctx, cx - w / 2, y, w, h * 0.92, 9); ctx.fill();
        ctx.strokeStyle = mix(c, '#ffffff', 0.35); ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(cx, y + 14, 3.5, 0, Math.PI * 2); ctx.fill();
        label(y + h * 0.5, 20, '#ffffff');
        break;
      }
      case 'holes': {
        const tw = Math.min(r.w * 0.44, 46), th = r.h * 0.74, ty = r.y + 4;
        ctx.fillStyle = f > 0.02 ? lit : body; g.rr(ctx, cx - tw / 2, ty, tw, th, tw / 2); ctx.fill();
        ctx.strokeStyle = mix(c, '#ffffff', 0.4); ctx.lineWidth = 2; ctx.stroke();
        const hs = l.holes || '';
        for (let k = 0; k < hs.length; k++) {
          const hy = ty + tw * 0.7 + (k + 0.5) * ((th - tw * 1.1) / Math.max(1, hs.length));
          ctx.beginPath(); ctx.arc(cx, hy, tw * 0.26, 0, Math.PI * 2);
          if (hs[k] === '1') { ctx.fillStyle = '#10161c'; ctx.fill(); } else { ctx.strokeStyle = '#10161c'; ctx.lineWidth = 2.5; ctx.stroke(); }
        }
        label(r.y + r.h - 14, 18);
        break;
      }
      case 'steps': {
        const s = Math.min(r.w * 0.42, r.h * 0.34);
        ctx.fillStyle = f > 0.02 ? lit : body; g.rr(ctx, cx - r.w * 0.45, r.y + 2, r.w * 0.9, r.h * 0.74, 16); ctx.fill();
        ctx.strokeStyle = mix(c, '#ffffff', 0.35); ctx.lineWidth = 2; ctx.stroke();
        drawStepIcon(ctx, l.icon, cx, r.y + 2 + r.h * 0.37, s, '#10161c', f);
        label(r.y + r.h - 14, 18);
        break;
      }
      case 'circle': {
        const rad = Math.min(r.w * 0.46, r.h * 0.4), y = r.y + r.h * 0.44;
        ctx.fillStyle = f > 0.02 ? lit : body; ctx.beginPath(); ctx.arc(cx, y, rad, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = mix(c, '#ffffff', 0.45); ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, y, rad * 0.62, 0, Math.PI * 2); ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = mix(c, '#ffffff', 0.5); ctx.beginPath(); ctx.arc(cx, y, rad * 0.26, 0, Math.PI * 2); ctx.fill();
        label(r.y + r.h - 14, 18);
        break;
      }
      default: { // pads
        const rad = Math.min(r.w * 0.46, r.h * 0.42), y = r.y + r.h * 0.46;
        ctx.fillStyle = mix(c, '#000000', 0.62); ctx.beginPath(); ctx.arc(cx, y, rad + 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = f > 0.02 ? lit : body; ctx.beginPath(); ctx.arc(cx, y, rad, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = mix(c, '#ffffff', 0.4); ctx.lineWidth = 2.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, y, rad * 0.6, 0, Math.PI * 2); ctx.lineWidth = 1.5; ctx.stroke();
        if (f > 0.02) { ctx.strokeStyle = `rgba(255,255,255,${0.7 * f})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, y, rad + (1 - f) * 14, 0, Math.PI * 2); ctx.stroke(); }
        g.label(ctx, l.name, cx, y, fit(g, l.name, g.px(24), rad * 1.5), '#ffffff', 'center', '800');
      }
    }
    if (P.layout !== 'pads' && f > 0.02 && P.layout !== 'strings') {
      ctx.strokeStyle = `rgba(255,255,255,${0.5 * f})`; ctx.lineWidth = 3; g.rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.stroke();
    }
  };

  const drawStepIcon = (ctx, kind, cx, cy, s, col, f) => {
    ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 3;
    const foot = (inner) => {
      ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.2, s * 0.4, s * 0.72, 0, 0, Math.PI * 2); ctx.fill();
      const size = [0.17, 0.13, 0.12, 0.1];
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(cx + inner * (0.26 - k * 0.17) * s, cy - s * (0.66 + 0.12 * (k === 0 ? 0 : k < 3 ? 1 : 0)) - s * 0.06, s * size[k], 0, Math.PI * 2); ctx.fill(); }
    };
    if (kind === 'foot-l') foot(1);
    else if (kind === 'foot-r') foot(-1);
    else if (kind === 'stomp') {
      ctx.beginPath(); ctx.ellipse(cx, cy - s * 0.1, s * 0.5, s * 0.34, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx - s * 0.9, cy + s * 0.5); ctx.lineTo(cx + s * 0.9, cy + s * 0.5); ctx.stroke();
      for (const d of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(cx + d * s * 0.35, cy + s * 0.65 + (d ? 2 : 0)); ctx.lineTo(cx + d * s * 0.65, cy + s * 0.85); ctx.stroke(); }
    } else if (kind === 'clap') {
      ctx.beginPath(); ctx.ellipse(cx - s * 0.28, cy, s * 0.26, s * 0.6, -0.35, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + s * 0.28, cy, s * 0.26, s * 0.6, 0.35, 0, Math.PI * 2); ctx.fill();
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + d * s * 0.2, cy - s * 0.8); ctx.lineTo(cx + d * s * 0.34, cy - s * 1.05); ctx.stroke(); }
    } else { // slap: open hand on the boot
      ctx.beginPath(); ctx.arc(cx, cy + s * 0.1, s * 0.4, 0, Math.PI * 2); ctx.fill();
      for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(cx + k * s * 0.15, cy - s * 0.2); ctx.lineTo(cx + k * s * 0.19, cy - s * 0.75); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(cx - s * 0.6, cy + s * 0.75); ctx.lineTo(cx + s * 0.6, cy + s * 0.75); ctx.stroke();
    }
    void f;
  };

  const noteColor = (t) => (t.state === 'miss' ? 'rgba(224,96,58,0.45)' : lanes[t.lane].color);

  const drawHighway = (g, L, list, soft) => {
    const { ctx } = g, span = L.hitY - L.top, look = clamp(spb * 4, 1.6, 3.4);
    // lane tint and dividers
    for (let i = 0; i < N; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.05)';
      ctx.fillRect(L.laneX(i), L.top, L.cw, span);
      if (flash[i] > 0.02) { ctx.fillStyle = mix(lanes[i].color, '#000000', 0.2); ctx.globalAlpha = 0.4 * flash[i]; ctx.fillRect(L.laneX(i), L.top, L.cw, span); ctx.globalAlpha = 1; }
    }
    // beat lines
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
    const b0 = Math.floor(clock / spb);
    for (let b = b0; b <= b0 + Math.ceil(look / spb) + 1; b++) {
      const y = L.hitY - ((b * spb - clock) / look) * span;
      if (y < L.top || y > L.hitY) continue;
      ctx.strokeStyle = b % meter === 0 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)';
      ctx.beginPath(); ctx.moveTo(L.x0, y); ctx.lineTo(L.x0 + L.cw * N, y); ctx.stroke();
    }
    ctx.strokeStyle = pal.accent; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(L.x0, L.hitY); ctx.lineTo(L.x0 + L.cw * N, L.hitY); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.rect(L.x0, L.top, L.cw * N, span + 24); ctx.clip();
    const nh = Math.min(34, L.cw * 0.42, span * 0.12);
    for (const t of list) {
      if (t.state && t.state !== 'pending' && t.state !== 'miss') continue;
      const y = L.hitY - ((t.t - clock) / look) * span;
      if (y < L.top - 40 || y > L.hitY + 30) continue;
      const w = L.cw - 12, x = L.laneX(t.lane) + 6, tail = t.len ? (t.len * spb / look) * span : 0;
      ctx.globalAlpha = soft ? 0.5 : 1;
      if (tail) { ctx.fillStyle = mix(lanes[t.lane].color, '#000000', 0.35); g.rr(ctx, x + w * 0.3, y - tail, w * 0.4, tail, 6); ctx.fill(); }
      ctx.fillStyle = noteColor(t); g.rr(ctx, x, y - nh / 2, w, nh, nh / 2.4); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.globalAlpha = 1;
      g.label(ctx, lanes[t.lane].name, x + w / 2, y, fit(g, lanes[t.lane].name, g.px(15), w - 8), '#10161c', 'center', '700');
    }
    ctx.restore();
  };

  const drawRing = (g, L) => {
    const { ctx } = g, h = L.hitY - L.top, cx = L.a.x + L.a.w / 2, cy = L.top + h / 2 + 2, r = Math.max(30, Math.min(L.a.w * 0.42, h / 2 - 18));
    const cyc = cycleBeats, pb = clock / spb, cb = ((pb % cyc) + cyc) % cyc, ci = Math.max(0, Math.floor(pb / cyc));
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    const ang = (b) => -Math.PI / 2 + (b / cyc) * Math.PI * 2;
    for (let b = 0; b < cyc; b++) { const a = ang(b), big = b % meter === 0; ctx.fillStyle = big ? pal.dim : 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, big ? 4 : 2.5, 0, Math.PI * 2); ctx.fill(); }
    // cursor
    const ca = ang(clock < 0 ? 0 : cb);
    ctx.strokeStyle = pal.accent; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ca) * (r - 8), cy + Math.sin(ca) * (r - 8)); ctx.stroke();
    ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
    const list = P.mode === 'free' ? guide : targets;
    const mr = Math.max(10, Math.min(18, r * 0.12));
    for (const t of list) {
      if (t.b < ci * cyc || t.b >= (ci + 1) * cyc) continue;
      const a = ang(t.b - ci * cyc), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      const col = t.state === 'perfect' ? pal.accent : t.state === 'good' ? pal.good : t.state === 'miss' ? pal.bad : lanes[t.lane].color;
      ctx.globalAlpha = P.mode === 'free' ? 0.55 : 1;
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, mr, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1;
      g.label(ctx, lanes[t.lane].name, cx + Math.cos(a) * (r - mr - 14), cy + Math.sin(a) * (r - mr - 14), g.px(15), pal.ink, 'center', '700');
    }
    g.label(ctx, `${Math.floor(cb) + 1} / ${cyc}`, cx, cy + r * 0.35, g.px(22), pal.dim, 'center', '700');
  };

  const sheetCells = () => {
    // learn mode: one cell per beat of the song, rows of `meter` beats (a tala diagram for 16-beat cycles)
    const cells = [];
    for (let b = 0; b < songBeats; b++) cells.push({ b, names: [], state: null });
    for (const s of steps) if (cells[Math.floor(s.beat)]) cells[Math.floor(s.beat)].names.push(lanes[s.lane].name);
    return cells;
  };
  const rank = { pending: 0, perfect: 1, good: 2, miss: 3 };

  const drawSheet = (g, L) => {
    const { ctx } = g, cells = sheetCells();
    const availH = L.hitY - L.top - 8, maxRows = Math.max(1, Math.floor(availH / 40));
    let cols = Math.min(8, Math.max(2, meter));
    while (Math.ceil(songBeats / cols) > maxRows && cols < 16) cols += meter;
    const rows = Math.ceil(songBeats / cols), cw = Math.min(150, (L.a.w - 16) / cols), ch = Math.min(100, availH / rows - 6);
    const x0 = L.a.x + (L.a.w - cw * cols) / 2, y0 = L.top + 4;
    // active section
    const sec = sections.find((s) => clock >= s.from && clock < s.to);
    const pr = sec ? (clock - sec.from) / spb : -1;
    for (const t of targets) { const c = cells[Math.floor(t.b)]; if (c && (c.state === null || rank[t.state] > rank[c.state])) c.state = t.state; }
    cells.forEach((c, i) => {
      const x = x0 + (i % cols) * cw, y = y0 + Math.floor(i / cols) * (ch + 6);
      const inPhrase = sec && c.b >= sec.lo && c.b < sec.lo + phraseBeats;
      const cur = sec && inPhrase && Math.floor(pr) === c.b - sec.lo;
      const col = c.state === 'perfect' ? mix(pal.accent, '#000000', 0.45) : c.state === 'good' ? mix(pal.good, '#000000', 0.5) : c.state === 'miss' ? mix(pal.bad, '#000000', 0.45) : pal.panel;
      ctx.fillStyle = cur ? (sec.kind === 'demo' ? pal.accent : pal.good) : col;
      g.rr(ctx, x + 2, y, cw - 4, ch, 10); ctx.fill();
      ctx.strokeStyle = inPhrase ? pal.accent : 'rgba(255,255,255,0.18)'; ctx.lineWidth = inPhrase ? 2.5 : 1.5; ctx.stroke();
      const hide = P.memory && sec && sec.kind === 'echo' && inPhrase && !cur && c.state === null;
      const txt = hide ? '?' : c.names.length ? c.names.join('·') : '·';
      g.label(ctx, txt, x + cw / 2, y + ch / 2 + 2, fit(g, txt, g.px(20), cw - 10), cur ? '#10161c' : pal.ink, 'center', '700');
      if (c.b % meter === 0) g.label(ctx, `${c.b + 1}`, x + 12, y + 10, g.px(11), cur ? '#10161c' : pal.dim, 'left', '600');
    });
  };

  const drawFreeCells = (g, L) => {
    const { ctx } = g, n = cycleBeats, cols = Math.min(n, 8), rows = Math.ceil(n / cols);
    const avail = L.hitY - L.top - 8, ch = Math.min(52, avail / rows - 6), cw = Math.min(90, (L.a.w - 16) / cols);
    const x0 = L.a.x + (L.a.w - cw * cols) / 2, y0 = L.top + 4, beat = clock < 0 ? -1 : Math.floor(clock / spb) % n;
    for (let i = 0; i < n; i++) {
      const x = x0 + (i % cols) * cw, y = y0 + Math.floor(i / cols) * (ch + 6), cur = i === beat;
      ctx.fillStyle = cur ? pal.accent : pal.panel; g.rr(ctx, x + 2, y, cw - 4, ch, 10); ctx.fill();
      ctx.strokeStyle = i % meter === 0 ? pal.accent : 'rgba(255,255,255,0.18)'; ctx.lineWidth = i === 0 ? 3 : 1.5; ctx.stroke();
      g.label(ctx, i === 0 ? '1 ★' : `${i + 1}`, x + cw / 2, y + ch / 2, g.px(18), cur ? '#10161c' : pal.dim, 'center', '700');
    }
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
      const L = layout;
      g.label(ctx, info(), area.x + area.w / 2, area.y + 14, g.px(20), pal.dim, 'center', '600');
      if (P.mode === 'learn') drawSheet(g, L);
      else if (P.layout === 'circle') drawRing(g, L);
      else if (P.mode === 'free') { if (guide.length && P.guide) drawHighway(g, L, guide, true); else drawFreeCells(g, L); }
      else drawHighway(g, L, targets, false);
      // instrument surface
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; g.rr(ctx, area.x, L.hitY + 2, area.w, L.surfaceH - 2, 16); ctx.fill();
      for (let i = 0; i < N; i++) drawElement(g, i, elemRect(L, i));
      // judgement pop-ups
      for (const p of pops) {
        const x = L.laneX(p.lane) + L.cw / 2;
        ctx.globalAlpha = 1 - p.age / 0.7;
        g.label(ctx, p.text, x, L.hitY - 18 - p.age * 40, g.px(20), p.color, 'center', '800');
        ctx.globalAlpha = 1;
      }
      if (combo >= 3) g.label(ctx, `${combo} in a row`, area.x + area.w - 70, area.y + 14, g.px(16), pal.accent, 'center', '700');
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

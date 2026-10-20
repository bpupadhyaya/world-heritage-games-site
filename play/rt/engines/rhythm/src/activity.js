// Rhythm activity: music and dance by beat and melody (docs/ENGINE-CONTRACT.md "Activity engines").
// A round is a timeline of TARGETS (strokes the player must hit) built from a song (a step list of { beat, lane, len? }).
//   learn  : the song is cut into phrases; the computer plays a phrase (lanes light up), then the player echoes it.
//   follow : the whole song falls toward a hit line (or around a cycle ring for 'circle'); hit each note on time.
//   free   : no targets; strokes are graded against the pulse grid, over a drone, with the song shown as a soft guide.
// Time comes only from dt accumulation (seconds). All windows scale with params.tolerance, tempo with params.tempo.

import { clamp as _c, mix, rgba, lighter, darker, glow, rrect, text, vgrad, rgrad, styleFor, drawBackdrop } from './art.js';
import { createStage } from './stage.js';
import { setHero } from './stagekit.js';
import { voice, fx } from '../../../platform/engine-kit/synth.js';
import { evoice, startDrone } from './voices.js';
import { TIMBRES, LAYOUT_TIMBRE, LANE_VOICE_RULES, STRIKE_VOICES } from './voice-registry.js';
import './voices-ext.js';

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

export const DEFAULTS = {
  layout: 'pads', mode: 'follow', root: 220, scale: 'pentatonic',
  lanes: [{ name: 'Low', timbre: 'bass', hz: 110 }, { name: 'Mid', timbre: 'tone', hz: 220 }, { name: 'High', timbre: 'slap', hz: 330 }],
  notes: {}, songs: [{ name: 'Basic pattern', bpm: 80, meter: 4, steps: [{ beat: 0, lane: 0 }, { beat: 1, lane: 1 }, { beat: 2, lane: 2 }, { beat: 3, lane: 1 }] }],
  song: 0, tempo: 1, tolerance: 1, leadIn: null, phrase: null, loops: 1, duration: 40, subdivision: 2,
  drone: false, droneHz: null, grace: null, vocal: null, pulse: null, guide: true, memory: false, colors: null,
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
  // Everything that depends on the chosen song, the playback speed (Watch and learn / Now you try) and the mode is recomputed by
  // useSong(); a normal round uses speed 1, the game's own song and the game's own mode, exactly as before.
  let MODE = P.mode, loops = P.loops;
  let song, meter, spb, perfectW, goodW, leadBeats, showTick, look;
  let steps, songBeats, cycleBeats, phraseBeats;
  const colors = P.colors ?? [pal.a, pal.b, '#e0a82e', '#58c27d', '#a56bd6', '#2ec4b6', '#e87fa0', '#9ac24a', '#f08a3c', '#6ea8ff'];

  // ---- lanes: resolved tone per lane -----------------------------------------------------------------------------
  const degreeHz = (d) => { const n = scale.length, oct = Math.floor(d / n), i = ((d % n) + n) % n; return P.root * 2 ** ((scale[i] + 1200 * oct) / 1200); };
  const lanes = P.lanes.map((l, i) => {
    const base = { ...(l.note ? P.notes[l.note] : null), ...l };
    const hz = base.hz ?? (base.cents != null ? P.root * 2 ** (base.cents / 1200) : degreeHz(base.degree ?? i));
    const tim = TIMBRES[base.timbre ?? LAYOUT_TIMBRE[P.layout]] ?? TIMBRES.tone;
    return { id: l.id ?? l.name, name: l.name ?? `${i + 1}`, hz, tim, timName: base.timbre ?? LAYOUT_TIMBRE[P.layout], wave: base.wave ?? tim.type, dur: base.dur ?? tim.dur, color: l.color ?? colors[(l.row ?? i) % colors.length],
      holes: l.holes ?? '', icon: l.icon ?? 'foot-l', row: l.row ?? 0, string: l.string, fret: l.fret, vowel: l.vowel, reg: l.reg };
  });
  const N = lanes.length;
  const laneIndex = (v) => {
    if (typeof v === 'number') return clamp(Math.round(v), 0, N - 1);
    const i = lanes.findIndex((l) => l.id === v || l.name === v);
    return i < 0 ? 0 : i;
  };
  const useSong = (idx, spd = 1) => {
    song = P.songs[clamp(idx, 0, P.songs.length - 1)];
    meter = Math.max(2, song.meter ?? 4);
    spb = 60 / ((song.bpm ?? 80) * P.tempo * spd);
    const w = clamp(1 / spd, 0.75, 2);   // a slower tempo widens the timing windows, a faster one narrows them (in seconds)
    perfectW = PERFECT * P.tolerance * w; goodW = GOOD * P.tolerance * w;
    leadBeats = P.leadIn ?? Math.min(4, meter);
    showTick = P.pulse ?? MODE !== 'follow';
    look = clamp(spb * 4, 1.6, 3.4);
    steps = (song.steps ?? []).map((s) => ({ beat: s.beat, lane: laneIndex(s.lane), len: s.len ?? 0 })).sort((a, b) => a.beat - b.beat);
    songBeats = song.length ?? Math.max(meter, Math.ceil(steps.reduce((m, s) => Math.max(m, s.beat + Math.max(1, s.len)), 0) / meter) * meter);
    cycleBeats = song.cycle ?? songBeats;
    phraseBeats = P.phrase ?? meter;
  };
  useSong(P.song, 1);
  // Watch and learn song player: the songs flagged `watch` (heritage songs, tunes and figures), see README "Song player".
  const watchIdx = P.songs.map((s, i) => (s.watch ? i : -1)).filter((i) => i >= 0);
  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];
  const study = { on: false, trying: false, speed: 1, song: watchIdx[0] ?? 0, loop: false, playing: true, next: 0, tick: 0, touched: false, drag: false, ended: false };
  const store = env.storage ?? null;

  // ---- state --------------------------------------------------------------------------------------------------------
  let clock, targets, demos, guide, sections, pts, strays, combo, maxCombo, counts, done, flash, pops, endT, nextBeat, nextDemo, lastTip;
  let firstStroke = null;
  let free, lastSlot, droneT, layout = null, attractIdx, auto = false;
  const droneKind = typeof P.drone === 'string' && P.drone !== 'pad' ? P.drone : null;   // 1.7.0: 'reed' | 'vocal' constant drone in every mode
  let droneOn = false, droneH = null;
  let sus = [], hold = [], voices = [], ptr = { x: 0, y: 0, down: false };
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
  const instKey = P.instrument ? String(P.instrument) : `${env.variant ?? ''} ${env.text?.title ?? ''}`;
  const S = styleFor(instKey, P.layout, P.lanes?.[0]?.timbre ?? '');
  const stage = createStage(P.layout, instKey, S, lanes, P);

  const build = () => {
    targets = []; demos = []; guide = []; sections = [];
    if (MODE === 'study') { buildStudy(); return; }
    if (MODE === 'follow') {
      for (let l = 0; l < loops; l++) for (const s of steps) targets.push({ t: (l * songBeats + s.beat) * spb, b: l * songBeats + s.beat, lane: s.lane, len: s.len, state: 'pending' });
      endT = loops * songBeats * spb;
    } else if (MODE === 'learn') {
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

  const begin = () => {
    clock = -leadBeats * spb; pts = 0; strays = 0; combo = 0; maxCombo = 0; done = null; flash = lanes.map(() => 0); pops = [];
    comboPop = 0; missFlash = 0; anim = 0; for (const p of part) p.on = false;
    sus = lanes.map(() => 0); hold = lanes.map(() => 0); voices = [];
    counts = { perfect: 0, good: 0, miss: 0, off: 0, strokes: 0 };
    droneH?.stop(0.2); droneH = null; droneOn = false;
    nextBeat = -leadBeats; nextDemo = 0; lastTip = ''; droneT = 0; firstStroke = null; lastSlot = null; attractIdx = 0; auto = false;
    build();
    free = { want: Math.max(4, Math.floor((P.duration / spb) * 0.3)) };
  };
  // a new round of the game's own song in the game's own mode (the shell calls this for Play, Watch and learn and Restart)
  const init = () => {
    study.on = false; study.trying = false; MODE = P.mode; loops = P.loops;
    useSong(P.song, 1);
    begin();
  };
  init();

  // ---- sound ---------------------------------------------------------------------------------------------------------
  // Natural instrument voices from platform/engine-kit/synth.js (Karplus-Strong strings, bowed strings with vibrato, membranes,
  // tuned bars, tines, bells, gongs, breath and reed pipes, dance steps). Pitch comes from the lane data; the same strike()
  // serves Play, Watch and learn and the attract mode, so all of them sound identical and at the same level.
  const instName = `${instKey} ${stage.id ?? ''}`;
  const VEL = { vocal: 0.85, scrape: 0.85, bass: 0.9, tone: 0.8, slap: 0.65, rim: 0.55, pluck: 0.8, string: 0.75, mallet: 0.85, bell: 0.7, breath: 0.75, reed: 0.7, stomp: 0.9, clap: 0.7, gong: 0.85 };
  const later = (delay, k, o) => { voice(audio, k, { ...o, delay }); };
  const voiceKind = (i) => {
    const l = lanes[i];
    if (stage.strumLanes?.includes(i)) return 'strum';
    if (stage.voiceOf) { const v = stage.voiceOf(i); if (v) return v; }
    for (const rule of LANE_VOICE_RULES) { const v = rule(l, { stage, P, instName }); if (v) return v; }   // 1.9.0: registerLaneVoice (voice-registry.js)
    switch (l.timName) {
      case 'pluck': return 'pluck';
      case 'string': return stage.bowed ? 'bow' : P.layout === 'strings' ? 'drone' : 'bow';
      case 'mallet': return 'bar';
      case 'bell': return P.layout === 'circle' ? 'gong' : P.layout === 'pads' ? (stage.id === 'steelpan' ? 'pan' : 'drum') : stage.voice === 'tine' ? 'tine' : 'bell';
      case 'bass': return stage.id === 'mortar' ? 'wood' : stage.id === 'bandoneon' ? 'reed' : 'drum';
      case 'tone': return stage.id === 'mortar' ? 'wood' : 'drum';
      case 'rim': return stage.id === 'mortar' ? 'soft' : 'drum';
      case 'breath': return 'breath';
      case 'vocal': return stage.id === 'throat' ? 'throat' : stage.id === 'whistle' ? 'whistle' : 'vocal';
      case 'scrape': return 'scrape';
      case 'reed': return /dizi|flute|bansuri|pipe|whistle|fife|ney|quena/i.test(instName) ? 'breath' : 'reed';
      case 'gong': return 'gong';
      case 'clap': return 'clap';
      case 'slap':
        if (P.layout !== 'steps') return 'drum';
        if (/escob|brush|rasp|scrape/i.test(l.name)) return 'brush';
        if (stage.id === 'pole') return 'ribbon';
        return 'bodyslap';
      case 'stomp': return P.layout === 'steps' ? (stage.id === 'pole' ? 'ribbon' : /dabke/i.test(instName) && /stomp/i.test(l.name) ? 'stomp' : /dabke|kolo|schuh|clog|zapateado|flamenco|cueca|tap|stomp/i.test(instName) ? 'boot' : 'step') : stage.id === 'mortar' ? 'wood' : 'drum';
      default: return 'drum';
    }
  };
  const drumStyle = (l) => {
    const id = stage.id ?? '';
    if (id === 'taiko') return l.timName === 'bass' ? 'taiko' : l.timName;
    if (id === 'water') return l.timName === 'rim' ? 'rim' : 'water';
    if (id === 'bodhran') return l.timName === 'rim' ? 'rim' : 'frame';
    if (id === 'kulintang') return 'tone';
    return l.timName === 'stomp' ? 'bass' : l.timName;
  };
  const laneHz = {};
  lanes.forEach((l) => { laneHz[String(l.name).toLowerCase()] = l.hz; });
  // tabla: each bol is its own sound. Right hand (dayan): na = sharp edge ring, tin = resonant centre, ti = closed light tap.
  // Left hand (bayan): ge = open bass that rises in pitch, ka = closed slap. Dha = na + ge, dhin = tin + ge, played together.
  const tablaBol = (l, base) => {
    const n = String(l.name).toLowerCase(), hzOf = (re, d) => { for (const k of Object.keys(laneHz)) if (re.test(k)) return laneHz[k]; return d; };
    const geHz = hzOf(/^(ge|ga|ghe|gha)$/, l.hz * 0.5), naHz = hzOf(/^(na|ta|naa)$/, l.hz), tinHz = hzOf(/^(tin|tun|tu)$/, l.hz * 1.5);
    const dayan = (hz, dur, vel) => voice(audio, 'drum', { ...base, hz, style: 'dayan', dur, vel });
    const bayan = (hz, dur, vel) => voice(audio, 'drum', { ...base, hz, style: 'bayan', dur, vel });
    if (/^(dha|dhaa)$/.test(n)) { dayan(naHz, 0.3, 0.7); return bayan(geHz, 0.55, 0.9); }
    if (/^(dhin|dhi|din)$/.test(n)) { dayan(tinHz, 0.6, 0.75); return bayan(geHz, 0.55, 0.9); }
    if (/^(na|ta|naa)$/.test(n)) return dayan(naHz, 0.24, 0.85);
    if (/^(tin|tun|tu)$/.test(n)) return dayan(tinHz, 0.7, 0.9);
    if (/^(ti|te|tet|tit)$/.test(n)) return dayan(l.hz * 1.15, 0.1, 0.6);
    if (/^(ge|ga|ghe|gha)$/.test(n)) return bayan(geHz, 0.6, 0.95);
    if (/^(ka|ke|kat|kha)$/.test(n)) return voice(audio, 'drum', { ...base, hz: l.hz * 0.8, style: 'slap', dur: 0.09, vel: 0.7 });
    return voice(audio, 'drum', { ...base, style: 'dayan', dur: 0.3 });
  };
  // 1.7.0: the voice, the bagpipe reed and the rubboard (engine-local voices, see voices.js). Voice and chanter are monophonic: a new
  // note ends the previous one, which is what makes a pipe sound articulated and a yodel flip from one register to the other.
  let mono = [], lastLane = -1, lastAt = -9;
  const graceHz = (i) => {
    if (P.grace == null || P.grace === false) return 0;
    const ref = P.grace === true ? -1 : laneIndex(P.grace);
    if (ref >= 0 && ref !== i) return lanes[ref].hz;
    let best = null; lanes.forEach((q, k) => { if (k !== i && (!best || q.hz > best.hz)) best = q; });   // true: the highest other note of the instrument
    return best ? best.hz : lanes[i].hz * 1.5;
  };
  const sing = (i, l, kind, base, dur, vel, prev) => {
    const V = P.vocal ?? {}, hz = l.hz, near = prev.near;
    const note = stage.note ? stage.note(i) : { from: 0, crossed: false };
    for (const h of mono) h?.cut?.();
    mono = [];
    if (kind === 'scrape') {
      const n = String(l.name).toLowerCase(), d = /up/.test(n) ? 'up' : /tick|click|tap|dig|rim|beat|pop|clack/.test(n) ? 'tick' : 'down';
      evoice(audio, 'scrape', { hz, dir: d, vel, dur: Math.min(0.3, Math.max(0.08, dur)) });
      return;
    }
    if (kind === 'vocal') {
      const reg = stage.regOf ? stage.regOf(i) : 'chest';
      mono.push(evoice(audio, 'vocal', { hz, vel, dur: Math.max(0.25, dur), reg, vowel: l.vowel ?? V.vowel ?? 'a', from: note.crossed && near ? note.from : 0, echo: V.echo ?? 1 }));
      if (V.second) mono.push(evoice(audio, 'vocal', { hz: hz * V.second, vel: vel * 0.62, dur: Math.max(0.25, dur), reg, vowel: V.secondVowel ?? 'o', from: 0, echo: V.echo ?? 1, delay: 0.014, pan: 0.35 }));
    } else if (kind === 'throat') {
      mono.push(evoice(audio, 'throat', { hz, f0: V.fundamental ?? P.root, sub: !!V.sub, vel, dur: Math.max(0.3, dur), from: near ? note.from : 0 }));
    } else if (kind === 'whistle') {
      mono.push(evoice(audio, 'whistle', { hz, vel, dur: Math.max(0.12, dur), from: near ? note.from : 0, echo: V.echo ?? 0.8 }));
    } else {   // pipe: the chanter reed, with a short separation and an optional grace note (a "cut") on a repeated note
      const g = prev.grace;
      let delay = 0;
      if (g) { mono.push(evoice(audio, 'reedpipe', { hz: g, vel: vel * 0.8, dur: 0.03, soft: false, style: stage.reedStyle })); delay = 0.042; }
      mono.push(evoice(audio, 'reedpipe', { hz, vel, dur: Math.max(0.1, dur - 0.04), delay, style: stage.reedStyle }));
    }
  };
  let lastDrone = -9;
  const strike = (i, len = 0) => {
    const l = lanes[i];
    if (!l) return;
    const hz = l.hz, dur = len > 0 ? Math.max(l.dur, len * spb) : l.dur, kind = voiceKind(i), vel = VEL[l.timName] ?? 0.75;
    sus[i] = Math.max(sus[i] ?? 0, kind === 'bow' || kind === 'breath' || kind === 'reed' || stage.sustained ? dur : Math.min(dur, 0.7));
    // 1.7.0: what the previous note was (the break glide, the grace note on a repeated pipe note); logged for audits and tests
    const prev = { near: clock - lastAt < spb * 1.6, grace: kind === 'pipe' && lastLane === i && clock - lastAt < spb * 1.6 ? graceHz(i) : 0 };
    lastLane = i; lastAt = clock;
    if (prev.grace) env.options?.soundLog?.push({ kind: 'grace', hz: Math.round(prev.grace), lane: l.name });
    env.options?.voiceLog?.push({ lane: l.name, tim: l.timName, kind, hz: Math.round(hz), stage: stage.id, reg: stage.regOf ? stage.regOf(i) : undefined });   // audits (tools): which voice every lane triggers
    if (!audio) return;
    const base = { hz, vel, dur, inst: instName };
    let ok = true;
    if (kind === 'vocal' || kind === 'throat' || kind === 'whistle' || kind === 'pipe' || kind === 'scrape') { sing(i, l, kind, base, dur, vel, prev); return; }
    const sv = STRIKE_VOICES.get(kind);   // 1.9.0: voices added through voice-registry.js (registerStrikeVoice)
    if (sv) {
      if (sv.mono) { for (const h of mono) h?.cut?.(); mono = []; }
      const h = sv.play({ audio, lane: l, index: i, base, hz, dur, vel, prev, P, stage, env, clock, voice, evoice });
      if (sv.mono && h) mono.push(...[].concat(h));
      return;
    }
    if (stage.sound) { if (stage.sound(audio, { hz, vel, dur: Math.max(0.5, dur) }) || audio.context) return; }   // stages with their own voices (winds2.js)
    if (stage.id === 'tabla') { ok = tablaBol(l, base); if (!ok && !audio.context) audio.tone({ freq: hz, dur, type: l.wave, vol: l.tim.vol }); return; }
    if (stage.id === 'mijwiz' && audio) {   // one pipe drones on the tonic while the other carries the tune (breath is continuous)
      if (clock - lastDrone > 0.9) { lastDrone = clock; const low = Math.min(...lanes.map((q) => q.hz)); voice(audio, 'reed', { hz: low, vel: 0.2, dur: 1.2, inst: instName }); }
    }
    switch (kind) {
      case 'pluck':
        ok = /dan.?bau|monochord/i.test(instName) ? voice(audio, 'monochord', { ...base, dur: Math.max(0.8, dur) }) : voice(audio, 'pluck', { ...base, dur: Math.max(0.6, dur) });
        break;
      case 'drone': ok = voice(audio, 'pluck', { ...base, dur: Math.max(1.2, dur), vel: vel * 0.9 }); break;
      case 'strum': {
        const set = stage.strumPitches ? stage.strumPitches(i) : [hz, hz * 1.26, hz * 1.5, hz * 2];
        ok = voice(audio, 'strum', { ...base, hzs: set, vel: 0.85, gap: 0.02 });
        if (/trem/i.test(l.name)) for (let k = 1; k < 6; k++) later(k * 0.07, 'pluck', { ...base, hz, vel: 0.5, dur: 0.3 });
        break;
      }
      case 'bow': ok = voice(audio, 'bow', { ...base, dur: Math.max(0.5, dur) }); break;
      case 'bar': ok = voice(audio, 'bar', { ...base, dur: Math.max(0.4, dur), buzz: /balafon|gyil|xylo|silimba/i.test(instName) ? 0.9 : 0 }); break;
      case 'pan': ok = voice(audio, 'steelpan', { ...base, dur: Math.max(0.6, dur) }); break;
      case 'tine': ok = voice(audio, 'tine', { ...base, dur: Math.max(0.7, dur) }); break;
      case 'bell': ok = voice(audio, 'bell', { ...base, dur: 1.4 }); break;
      case 'gong': ok = voice(audio, 'gong', { ...base, dur: /agung|gong|ageng/i.test(l.name) ? 2.2 : /babandil|bandil/i.test(l.name) ? 1.1 : 0.9 }); break;
      case 'breath':
        ok = voice(audio, 'breath', { ...base, dur: Math.max(0.5, dur) });
        if (stage.id === 'dizi') voice(audio, 'reed', { ...base, vel: vel * 0.2, dur: Math.max(0.4, dur * 0.9) });   // the dimo membrane buzzes against the air column
        break;
      case 'reed':
        ok = voice(audio, 'reed', { ...base, dur: Math.max(0.5, dur) });
        if (stage.id === 'bandoneon') { voice(audio, 'reed', { ...base, hz: hz * 2.005, vel: vel * 0.4, dur: Math.max(0.5, dur) }); voice(audio, 'reed', { ...base, hz: hz * 1.004, vel: vel * 0.5, dur: Math.max(0.5, dur) }); }
        break;
      case 'step': case 'boot': case 'clap': case 'slap': case 'stomp': ok = voice(audio, kind, base); break;
      case 'bodyslap': // a hand on leather shorts, a knee, a heel: three different pitches of the same slap
        ok = voice(audio, 'drum', { ...base, style: 'slap', hz: hz * 0.9, dur: 0.12, vel: 0.85 });
        fx(audio, 'impact', { mat: /heel|boot/i.test(l.name) ? 'wood' : 'skin', hz: hz * 1.1, vel: 0.5 });
        break;
      case 'brush': ok = fx(audio, 'scrape', { hz: 2600, dur: 0.16, vel: 0.8 }); break;
      case 'ribbon': // ribbons swish past the pole while the feet patter
        ok = voice(audio, 'step', { ...base, hz: hz * 0.9, vel: vel * 0.7 });
        fx(audio, 'whoosh', { dur: 0.22, down: i % 2 === 0, vel: 0.35 });
        break;
      case 'wood': // pestle on a wooden mortar: a woody knock with a low body
        ok = fx(audio, 'impact', { mat: 'wood', hz: hz * 2.2, vel: 0.9 });
        voice(audio, 'stomp', { ...base, hz: hz * 0.8, vel: 0.6 });
        break;
      case 'soft': ok = fx(audio, 'thud', { hz: hz * 0.5, vel: 0.5 }); break;
      default: ok = voice(audio, 'drum', { ...base, style: drumStyle(l) });
    }
    if (!ok && !audio.context) audio.tone({ freq: hz, to: l.tim.to ? hz * l.tim.to : null, dur, type: l.wave, vol: l.tim.vol }); // host without the synth graph
  };
  // soft: the steady pulse is quieter than the count-in; both are logged in options.soundLog (audits)
  const tick = (downbeat, soft = false) => {
    env.options?.soundLog?.push({ kind: soft ? 'pulse' : 'countin' });
    const k = soft ? 0.6 : 1;
    if (audio && !fx(audio, 'tick', { hz: downbeat ? 1900 : 1350, vel: (downbeat ? 0.55 : 0.4) * k })) audio.tone?.({ freq: downbeat ? 1320 : 880, dur: 0.03, type: 'square', vol: 0.06 * k });
  };

  // ---- judging -------------------------------------------------------------------------------------------------------
  const pop = (i, text, color) => pops.push({ lane: i, text, color, age: 0 });
  const inStrayZone = () => {
    if (MODE === 'follow') return targets.length > 0 && clock >= targets[0].t - spb * 0.5 && clock <= endT + spb * 0.5;
    if (MODE === 'learn') return sections.some((s) => s.kind === 'echo' && clock >= s.from - spb * 0.5 && clock <= s.to + spb * 0.5);
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
    if (firstStroke === null && clock >= -spb * 0.5) { firstStroke = clock; droneT = 0; }
    strike(i);
    flash[i] = 1;
    if (clock < -spb * 0.5) return;
    if (MODE === 'free') return judgeFree(i);
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
    if (MODE === 'free') {
      const acc = (counts.perfect + counts.good * 0.6) / Math.max(1, counts.strokes);
      return Math.round(100 * acc * Math.min(1, (counts.perfect + counts.good) / free.want));
    }
    const total = targets.length;
    if (!total) return 0;
    return Math.round(clamp((pts - strays * STRAY) / (100 * total), 0, 1) * 100);
  };
  const starsFor = (pct) => {
    if (MODE === 'free') return pct >= 80 ? 3 : pct >= 60 ? 2 : pct >= 45 ? 1 : 0;
    return pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 40 ? 1 : 0;
  };
  const finish = () => {
    const pct = percent(), stars = starsFor(pct);
    const headline = stars === 3 ? 'In perfect time!' : stars === 2 ? 'Steady playing' : stars === 1 ? 'Finding the beat' : 'Listen once more';
    const detail = MODE === 'free'
      ? `${counts.perfect} perfect, ${counts.good} good, ${counts.off} off the pulse`
      : `${counts.perfect} perfect, ${counts.good} good, ${counts.miss} missed, best run ${maxCombo}`;
    done = { score: pct, max: 100, stars, headline, detail: auto ? 'The computer played it for you' : detail };
  };

  // ---- time step -----------------------------------------------------------------------------------------------------
  // presentation timers shared by play and the song player: flashes, sustain, scheduled voices, pop-ups, particles
  const ambient = (dt) => {
    for (let i = 0; i < N; i++) { flash[i] = Math.max(0, flash[i] - dt * 4); sus[i] = Math.max(0, sus[i] - dt); hold[i] = Math.min(1, sus[i] / 0.45); }
    if (voices.length) { let k = 0; for (const v of voices) { if (v.at <= clock) audio?.tone(v.o); else voices[k++] = v; } voices.length = k; }
    anim += dt; comboPop = Math.max(0, comboPop - dt * 3.2); missFlash = Math.max(0, missFlash - dt * 2.4);
    // constant drone (drone: "reed" bagpipe drones, "vocal" the throat-singing fundamental): from the moment the piece begins until it ends,
    // in every mode (follow, learn, the song player); it pauses with the song player
    if (droneKind) {
      const want = !done && clock >= -spb * 0.5 && !(study.on && !study.playing);
      if (want && !droneOn) { droneOn = true; env.options?.soundLog?.push({ kind: 'drone', style: droneKind }); }
      if (!want && droneOn) { droneOn = false; droneH?.stop(0.35); droneH = null; }
      if (want && audio && !droneH && droneOn) {
        const f0 = P.vocal?.fundamental ?? P.root;
        const hzs = P.droneHz ?? (droneKind === 'vocal' ? [f0] : [P.root / 2, (P.root / 2) * 1.0025, P.root / 4]);
        droneH = startDrone(audio, droneKind, hzs, { dur: clamp((endT - clock) * (study.on ? 3 : 1.25) + 8, 10, 400), vel: droneKind === 'vocal' ? 0.45 : 0.55 });
      }
    }
    let w = 0;
    for (const p of pops) { p.age += dt; if (p.age < 0.8) pops[w++] = p; }
    pops.length = w;
    for (let k = 0; k < PN; k++) { const p = part[k]; if (!p.on) continue; p.life -= dt; if (p.life <= 0) { p.on = false; continue; } p.x += p.vx * dt; p.y += p.vy * dt; if (p.kind === 0) p.vy += 420 * dt; }
  };
  const advance = (dt, presses) => {
    if (done) return;
    clock += dt;
    ambient(dt);
    // pulse
    while (clock >= nextBeat * spb) {
      // free play: the pulse (and the drone below) wait for the player's first stroke; the count-in is always heard (gentle)
      if (nextBeat < 0) tick(((nextBeat % meter) + meter) % meter === 0);
      else if (showTick && (MODE !== 'free' || firstStroke !== null)) tick(((nextBeat % meter) + meter) % meter === 0, true);
      nextBeat++;
    }
    if (P.drone === true && MODE === 'free' && firstStroke !== null) {   // silent until the first stroke, then fades in over 3 s at a low level
      droneT -= dt;
      if (droneT <= 0) {
        droneT = 2;
        const lv = clamp((clock - firstStroke) / 3, 0.15, 1) * 0.5;
        env.options?.soundLog?.push({ kind: 'drone' });
        if (audio) { voice(audio, 'pad', { hz: P.root / 2, dur: 2.4, vel: 0.5 * lv }); voice(audio, 'pad', { hz: (P.root / 2) * 1.5, dur: 2.4, vel: 0.3 * lv }); }
      }
    }
    // computer demonstration in learn mode
    while (nextDemo < demos.length && demos[nextDemo].t <= clock) { const d = demos[nextDemo++]; strike(d.lane, d.len); flash[d.lane] = 1; }
    for (const i of presses) hitLane(i);
    for (const t of targets) {
      if (t.state === 'pending' && clock - t.t > goodW) { t.state = 'miss'; counts.miss++; combo = 0; pop(t.lane, 'Miss', pal.bad); missFlash = 1; emit(t.lane, 6, mix(pal.bad, '#555555', 0.3), 110, 2, 2.6, 0.5); }
    }
    if (MODE === 'free') { if (clock >= endT) finish(); return; }
    if (clock > endT + goodW + 0.1 && targets.every((t) => t.state !== 'pending')) finish();
  };

  // ---- geometry --------------------------------------------------------------------------------------------------------
  const geometry = (a) => {
    const landscape = a.w > a.h * 1.15;
    const cw = Math.min(a.w / N, 200), x0 = a.x + (a.w - cw * N) / 2;
    let surfaceH = landscape ? clamp(a.h * 0.5, 104, 420) : clamp(a.h * 0.34, 104, 300);   // fluid: wide screens give the instrument more height (short side is the scarce one)
    if (P.layout === 'circle') surfaceH = landscape ? clamp(a.h * 0.46, 150, 420) : clamp(a.h * 0.27, 120, 210);   // fluid: a wide screen has the height to give the drum a real size
    if (MODE === 'learn') { // no highway: the chart takes what it needs and the instrument gets the rest
      const cols0 = Math.min(8, Math.max(2, meter)), need = Math.ceil(songBeats / cols0) * 50 + 56;
      surfaceH = clamp(a.h - need, 150, a.h * 0.74);
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
    if (p) {
      ptr.x = p.x; ptr.y = p.y; ptr.down = !!p.down;
      if (stage.pointer && layout) { // swipes, bowing and bends: extra quiet sounds only, never scored
        let sl = -1, sb = 0.05;
        for (let i = 0; i < N; i++) if (sus[i] > sb) { sb = sus[i]; sl = i; }
        const tones = stage.pointer({ x: p.x, y: p.y, down: !!p.down, pressed: !!p.pressed, clock, sounding: sl >= 0 ? { hz: lanes[sl].hz } : null });
        for (const o of tones) audio?.tone({ ...o, voice: stage.bowed ? 'bow' : 'pluck', inst: instName });
      }
    }
    if (p?.pressed && layout) {
      const i = stage.hit(p.x, p.y);
      if (i >= 0) out.push(i);
    }
    const kp = input.keys?.pressed;
    if (kp && kp.size) for (let i = 0; i < Math.min(N, KEYS.length); i++) if (kp.has(KEYS[i]) || kp.has(DIGITS[i])) out.push(i);
    return out;
  };

  // ---- drawing ---------------------------------------------------------------------------------------------------------------
  const fit = (g, s, size, maxW) => Math.min(size, size * maxW / Math.max(1, s.length * size * 0.58));
  const beatPulse = () => { const ph = (((clock / spb) % 1) + 1) % 1; return Math.exp(-ph * 4.5); };
  const nameLabel = (g, s, x, y, size, maxW, col = '#ffffff') => text(g.ctx, s, x, y, fit(g, s, size, maxW), col, { outline: 'rgba(10,6,2,0.85)', lw: Math.max(2, size * 0.18) });

  const anchor = (L, lane) => stage.anchor(lane);
  const popAt = (L, lane) => (stage.popAnchor && stage.popAnchor(lane)) || anchor(L, lane);   // 1.29.0: bursts and judgement text may sit away from the pad label

  const drawParticles = (g, L) => {
    const { ctx } = g;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < PN; k++) {
      const p = part[k];
      if (!p.on) continue;
      const an = popAt(L, p.lane), u = clamp(p.life / p.max, 0, 1), x = an.x + p.x, y = an.y + p.y;
      if (p.kind === 1) { ctx.strokeStyle = rgba(p.color, 0.8 * u); ctx.lineWidth = 2 + 3 * u; ctx.beginPath(); ctx.ellipse(x, y, p.size * (1.4 - u), p.size * (1.4 - u) * 0.45, 0, 0, 6.2832); ctx.stroke(); }
      else if (p.kind === 3) { const s2 = p.size * (0.4 + u); ctx.fillStyle = rgba('#fff7d0', 0.9 * u); ctx.beginPath(); ctx.moveTo(x, y - s2); ctx.lineTo(x + s2 * 0.25, y - s2 * 0.25); ctx.lineTo(x + s2, y); ctx.lineTo(x + s2 * 0.25, y + s2 * 0.25); ctx.lineTo(x, y + s2); ctx.lineTo(x - s2 * 0.25, y + s2 * 0.25); ctx.lineTo(x - s2, y); ctx.lineTo(x - s2 * 0.25, y - s2 * 0.25); ctx.closePath(); ctx.fill(); }
      else { ctx.fillStyle = rgba(p.color, (p.kind === 2 ? 0.7 : 0.95) * u); ctx.beginPath(); ctx.arc(x, y, Math.max(0.6, p.size * (0.4 + 0.6 * u)), 0, 6.2832); ctx.fill(); }
    }
    ctx.restore();
  };

  // a soft stage light whose position differs per instrument: gives every play screen its own composition
  const lightA = (() => { let h = 7; for (const ch of String(instKey)) h = (h * 31 + ch.charCodeAt(0)) % 9973; return (h / 9973) * 6.2832; })();
  const extraLight = (ctx, r) => { glow(ctx, r.x + r.w * (0.5 + 0.34 * Math.cos(lightA)), r.y + r.h * (0.5 + 0.3 * Math.sin(lightA)), Math.max(r.w, r.h) * 0.62, lighter(pal.accent, 0.15), 0.2); };
  const EMPTY = [];
  const rt = {};
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
    const rows = Math.ceil(songBeats / cols), cw = Math.min(150, (L.a.w - 16) / cols), ch = Math.min(60, availH / rows - 6);
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

  const info = () => {
    if (study.on) return clock < 0 ? `Count in: ${Math.ceil(-clock / spb)}` : `Bar ${Math.min(barsOf(), Math.floor(clock / spb / meter) + 1)} of ${barsOf()}`;
    if (clock < 0) return `Count in: ${Math.ceil(-clock / spb)}`;
    if (MODE === 'learn') {
      const s = sections.find((x) => clock >= x.from && clock < x.to);
      return s ? (s.kind === 'demo' ? `Listen: phrase ${s.k + 1} of ${Math.ceil(songBeats / phraseBeats)}` : 'Your turn: play it back') : 'Well played';
    }
    if (MODE === 'free') return `Play freely on the pulse: ${Math.max(0, Math.ceil(endT - clock))} s`;
    return song.name ? `${song.name}` : 'Follow the notes';
  };

  // ---- song player: Watch and learn plays a heritage song in full on the instrument ---------------------------------------
  // The computer plays the chosen song (the specs' songs flagged `watch`) note by note on the drawn instrument, each lane lighting
  // as it sounds and the upcoming notes staying visible as cues. Speed only rescales note times (pitch is untouched). Nothing here
  // reads or writes the play score; "Now you try" starts the same song as a normal follow round at the chosen speed.
  const ctl = { bar: null, inst: null, btn: {} };
  const barsOf = () => Math.max(1, Math.ceil(songBeats / meter));
  const songNote = () => String(env.text?.songNotes?.[song.id] ?? song.note ?? '');
  const buildStudy = () => {
    targets = steps.map((s) => ({ t: s.beat * spb, b: s.beat, lane: s.lane, len: s.len, state: 'pending' }));
    demos = []; guide = []; sections = [];
    endT = songBeats * spb;
  };
  const seekBeats = (beats) => {
    const b = clamp(beats, -leadBeats, songBeats);
    clock = b * spb; voices.length = 0; study.ended = false; study.tick = Math.ceil(b - 1e-9);
    study.next = targets.length;
    for (let k = targets.length - 1; k >= 0; k--) { const t = targets[k]; t.state = t.t < clock - 1e-9 ? 'perfect' : 'pending'; if (t.state === 'pending') study.next = k; }
  };
  const enterStudy = () => {
    study.on = true; study.trying = false; MODE = 'study'; loops = 1;
    useSong(study.song, study.speed);
    begin();           // resets every counter and timer; build() lays out the song for the player
    auto = true; study.playing = true; study.drag = false;
    seekBeats(-leadBeats);
  };
  const setSpeed = (v, persist = true) => {
    const nv = clamp(Math.round(v * 100) / 100, 0.25, 2);
    if (study.on) {
      const pos = clock / spb;
      study.speed = nv; useSong(study.song, nv);
      for (const t of targets) t.t = t.b * spb;
      endT = songBeats * spb; clock = pos * spb;
    } else study.speed = nv;
    if (persist) try { store?.set?.('songSpeed', nv); } catch { /* optional */ }
  };
  const setSong = (k) => {
    study.song = watchIdx[((k % watchIdx.length) + watchIdx.length) % watchIdx.length];
    useSong(study.song, study.speed); begin(); auto = true; study.ended = false;
    seekBeats(-leadBeats); study.playing = true;
  };
  const startTry = () => {
    study.on = false; study.trying = true; MODE = 'follow'; loops = 1;
    useSong(study.song, study.speed);
    begin();
  };
  const playNote = (t) => {
    t.state = 'perfect';
    strike(t.lane, t.len); flash[t.lane] = 1; burst(t.lane, true);
  };
  const inRect = (r, x, y) => r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  const scrubTo = (x) => { const r = ctl.bar; if (r) seekBeats(clamp((x - r.tx) / r.tw, 0, 1) * songBeats); };
  const control = (id) => {
    study.touched = true;
    if (id === 'sp:play') {
      if (study.ended || clock >= endT - 1e-6) { seekBeats(-leadBeats); study.playing = true; }
      else study.playing = !study.playing;
    } else if (id === 'sp:restart') { seekBeats(-leadBeats); study.playing = true; }
    else if (id === 'sp:loop') study.loop = !study.loop;
    else if (id === 'sp:song') setSong(watchIdx.indexOf(study.song) + 1);
    else if (id === 'sp:slow') setSpeed(study.speed - 0.05);
    else if (id === 'sp:fast') setSpeed(study.speed + 0.05);
    else if (id === 'sp:try') startTry();
    else { const m = /^sp:s([\d.]+)$/.exec(id); if (m) setSpeed(Number(m[1])); }
  };
  const studyTick = (dt, input) => {
    const p = input?.pointer;
    if (p) {
      if (p.pressed) {
        const id = env.ui?.hit?.(p.x, p.y);
        if (id && id.startsWith('sp:')) control(id);
        else if (inRect(ctl.bar, p.x, p.y)) { study.drag = true; study.touched = true; scrubTo(p.x); }
        else if (layout && inRect(ctl.inst, p.x, p.y)) { const i = stage.hit(p.x, p.y); if (i >= 0) { strike(i); flash[i] = 1; burst(i, false); } }
      } else if (study.drag) { if (p.down) scrubTo(p.x); else study.drag = false; }
    }
    const kp = input?.keys?.pressed;
    if (kp && kp.has('Space')) control('sp:play');
    if (study.on === false) return;
    ambient(dt);
    if (done || !study.playing || study.drag) return;
    clock += dt;
    while (study.tick < 0 && clock >= study.tick * spb) { tick(((study.tick % meter) + meter) % meter === 0); study.tick++; }
    while (study.next < targets.length && targets[study.next].t <= clock) playNote(targets[study.next++]);
    if (clock >= endT + spb * 0.5) {
      if (study.loop) seekBeats(0);
      else if (!study.touched) done = { score: 100, max: 100, stars: 3, headline: 'That is the tune', detail: `${song.name ?? 'The song'} was played in full for you`, note: song.heritage ?? undefined };
      else { study.playing = false; study.ended = true; clock = endT; }
    }
  };
  // the chosen speed is remembered per game (env.storage is handed over by engine.js)
  if (watchIdx.length && store) Promise.resolve(store.get?.('songSpeed', null)).then((v) => { if (typeof v === 'number' && v >= 0.25 && v <= 2) setSpeed(v, false); }).catch(() => {});
  const fmtSpeed = (v) => `${Math.round(v * 100) / 100}x`;

  const renderStudy = (g, area) => {
    const { ctx } = g, ui = g.ui, css = ui.css;
    layout = geometry(area);
    const pul = beatPulse();
    drawBackdrop(ctx, area, S, pal, pul, Math.sin(anim * 0.8));
    extraLight(ctx, area);
    if (env.options?.autoplay && !env.options?.songControls) {   // previews, store shots and the distinctness gate: just the instrument playing the song
      text(ctx, info(), area.x + area.w / 2, area.y + 16, g.px(20), pal.dim, { weight: '600', outline: 'rgba(0,0,0,0.5)', lw: 3 });
      ctl.inst = area; ctl.bar = null; ctl.btn = {};
      rt.demos = EMPTY; rt.list = targets; rt.soft = false; rt.clock = clock; rt.look = look; rt.spb = spb; rt.anim = anim; rt.pul = pul; rt.flash = flash; rt.hold = hold; rt.ptr = ptr; rt.pal = pal; rt.lanes = lanes;
      { const pb = clock < 0 ? 0 : clock / spb; rt.cycle = { beats: cycleBeats, meter, pos: ((pb % cycleBeats) + cycleBeats) % cycleBeats }; }
      stage.layout(area); stage.draw(g, rt);
      if (clock < 0) text(ctx, String(Math.ceil(-clock / spb)), area.x + area.w / 2, area.y + area.h * 0.4, Math.min(area.h, 220) * 0.5, rgba(pal.accent, 0.55 + 0.35 * pul), { weight: '900', outline: 'rgba(0,0,0,0.45)', lw: 6, family: 'Georgia, serif' });
      drawParticles(g, layout);
      return;
    }
    const land = area.w > area.h * 1.15;
    const m = css(10), gap = css(8), bh = Math.max(css(46), ui.buttonH(50)), barH = css(40);
    const ctlH = barH + gap * 3 + bh * 3 + m * 2 - gap;
    const colW = land ? clamp(area.w * 0.46, css(310), css(440)) : area.w;
    const colX = land ? area.x + area.w - colW : area.x;
    // text block: title, heritage line, note (the note shrinks away first when the screen is short)
    const tw = colW - 2 * m - css(8), tSize = g.px(26), hSize = g.px(16), nSize = g.px(16);
    const heritage = [song.heritage, song.kind === 'figure' ? 'teaching figure' : ''].filter(Boolean).join('  ·  ');
    const noteLines = ui.wrap(ctx, songNote(), tw, nSize, { weight: '500' });
    const availH = land ? area.h - ctlH - 3 * m : area.h - ctlH - css(190) - 3 * m;
    let nl = noteLines.length;
    const blockH = (n) => m + tSize * 1.25 + (heritage ? hSize * 1.5 : 0) + (n ? n * nSize * 1.3 + m * 0.5 : 0) + m * 0.5;
    while (nl > 0 && blockH(nl) > availH) nl--;
    const lines = noteLines.slice(0, nl);
    if (nl < noteLines.length && nl > 0) lines[nl - 1] = lines[nl - 1].replace(/[ ,.;:]+$/, '') + '…';
    const bh0 = blockH(nl);
    const tx = colX + m, ty = area.y + m;
    ui.panel(ctx, tx, ty, colW - 2 * m, bh0, { r: css(14), fill: pal.panel, alpha: 0.86 });
    let yy = ty + m + tSize * 0.6;
    const tsz = ui.fit(ctx, song.name ?? '', tw, tSize, '800', true);
    ui.text(ctx, song.name ?? '', colX + colW / 2, yy, tsz, { color: pal.accent, display: true, shadow: true });
    yy += tSize * 0.6 + hSize * 0.75;
    if (heritage) { ui.text(ctx, heritage, colX + colW / 2, yy, ui.fit(ctx, heritage, tw, hSize, '700'), { color: pal.dim, weight: '700' }); yy += hSize * 0.75 + m * 0.2; }
    lines.forEach((ln, k) => ui.text(ctx, ln, colX + colW / 2, yy + nSize * 0.65 + k * nSize * 1.3, nSize, { color: pal.ink, weight: '500' }));
    // instrument
    const inst = land ? { x: area.x, y: area.y, w: area.w - colW, h: area.h } : { x: area.x, y: ty + bh0 + m * 0.5, w: area.w, h: area.y + area.h - ctlH - 2 * m - (ty + bh0) };
    ctl.inst = inst;
    rt.demos = EMPTY; rt.list = targets; rt.soft = false; rt.clock = clock; rt.look = look; rt.spb = spb; rt.anim = anim; rt.pul = pul; rt.flash = flash; rt.hold = hold; rt.ptr = ptr; rt.pal = pal; rt.lanes = lanes;
    { const pb = clock < 0 ? 0 : clock / spb; rt.cycle = { beats: cycleBeats, meter, pos: ((pb % cycleBeats) + cycleBeats) % cycleBeats }; }
    stage.layout(inst);
    stage.draw(g, rt);
    if (clock < 0) {
      const n = Math.ceil(-clock / spb);
      text(ctx, String(n), inst.x + inst.w / 2, inst.y + inst.h * 0.45, Math.min(inst.h, 220) * 0.5 * (0.9 + 0.25 * pul), rgba(pal.accent, 0.55 + 0.35 * pul), { weight: '900', outline: 'rgba(0,0,0,0.45)', lw: 6, family: 'Georgia, serif' });
    }
    drawParticles(g, layout);
    // controls
    const cx = colX + m, cw = colW - 2 * m, cy = area.y + area.h - ctlH - m;
    ui.panel(ctx, cx, cy, cw, ctlH, { r: css(16), fill: pal.panel, alpha: 0.94 });
    const ix = cx + m, iw = cw - 2 * m;
    let y = cy + m;
    // progress bar (drag to scrub)
    {
      const pos = clamp(clock / spb, 0, songBeats), frac = songBeats ? pos / songBeats : 0;
      const bar = Math.min(barsOf(), Math.floor(pos / meter) + 1);
      const lab = clock < 0 ? `Count in ${Math.ceil(-clock / spb)}` : `Bar ${bar} of ${barsOf()}`;
      const fs = Math.max(g.px(14), css(12));
      ui.text(ctx, lab, ix, y + fs * 0.7, fs, { color: pal.ink, align: 'left', weight: '700' });
      ui.text(ctx, `${fmtSpeed(study.speed)} speed`, ix + iw, y + fs * 0.7, fs, { color: pal.accent, align: 'right', weight: '700' });
      const th = css(12), ty2 = y + barH - th - css(4), r = th / 2, kx = ix + r + (iw - 2 * r) * frac;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ui.rr(ctx, ix, ty2, iw, th, r); ctx.fill();
      if (frac > 0.001) { ctx.fillStyle = ui.vgrad(ctx, ty2, ty2 + th, [[0, ui.shade(pal.accent, 0.25)], [1, ui.shade(pal.accent, -0.15)]]); ui.rr(ctx, ix, ty2, Math.max(th, kx - ix + r), th, r); ctx.fill(); }
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ui.rr(ctx, ix, ty2, iw, th, r); ctx.stroke();
      ctx.fillStyle = '#fff6e0'; ctx.beginPath(); ctx.arc(kx, ty2 + r, r * 1.25, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = pal.accent; ctx.lineWidth = 2; ctx.stroke();
      ctl.bar = { x: ix, y, w: iw, h: barH, tx: ix + r, tw: iw - 2 * r };
    }
    y += barH + gap;
    const row = (items, yy2, weights) => {
      const tot = weights.reduce((a, b) => a + b, 0), net = iw - gap * (items.length - 1);
      let x = ix;
      items.forEach((it, k) => { const w = net * weights[k] / tot; ctl.btn[it.id] = { x, y: yy2, w, h: bh }; ui.button(ctx, it.id, it.label, x, yy2, w, bh, { primary: it.primary, icon: it.icon, size: Math.min(g.px(24), bh * 0.42) }); x += w + gap; });
    };
    const atEnd = study.ended || (clock >= endT - 1e-6 && endT > 0);
    const r1 = [{ id: 'sp:restart', label: 'Restart', icon: 'restart' }, { id: 'sp:play', label: study.playing && !atEnd ? 'Pause' : 'Play', icon: 'play', primary: true }, { id: 'sp:loop', label: study.loop ? 'Loop on' : 'Loop', primary: study.loop }];
    if (watchIdx.length > 1) r1.push({ id: 'sp:song', label: `Song ${watchIdx.indexOf(study.song) + 1}/${watchIdx.length}`, icon: 'note' });
    row(r1, y, r1.map((it) => (it.id === 'sp:play' ? 1.25 : 1)));
    y += bh + gap;
    const r2 = [{ id: 'sp:slow', label: '−' }, ...SPEEDS.map((v) => ({ id: `sp:s${v}`, label: fmtSpeed(v), primary: Math.abs(study.speed - v) < 0.004 })), { id: 'sp:fast', label: '+', icon: null }];
    row(r2, y, r2.map((it, k) => (k === 0 || k === r2.length - 1 ? 0.7 : 1)));
    y += bh + gap;
    row([{ id: 'sp:try', label: 'Now you try', icon: 'star', primary: true }], y, [1]);
  };

  // ---- the activity ----------------------------------------------------------------------------------------------------------
  const act = {
    init,
    point(id) {
      if (study.on && ctl.btn[id]) { const b = ctl.btn[id]; return { x: b.x + b.w / 2, y: b.y + b.h / 2 }; }   // song player controls (sp:play, sp:s0.5, sp:try ...)
      if (!layout) return null;
      const m = /^lane:(\d+)$/.exec(id);
      if (!m) return null;
      const i = Number(m[1]);
      if (i >= N) return null;
      const sp = stage.anchor(i);
      return sp.x || sp.y ? { x: sp.x, y: sp.y } : null;
    },
    update(dt, input) { advance(dt, readPresses(input)); },
    attract(dt, input) {
      // Watch and learn: the computer strikes every target (or, in free mode, the guide) exactly on time.
      if (watchIdx.length) {   // heritage songs are flagged: the song player (see README "Song player")
        if (study.trying) { auto = false; advance(dt, readPresses(input)); return; }
        if (!study.on) enterStudy();
        studyTick(dt, input);
        return;
      }
      const presses = [];
      auto = true;
      if (MODE === 'free') {
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
      if (study.on) { renderStudy(g, area); return; }
      layout = geometry(area);
      const L = layout, pul = beatPulse();
      drawBackdrop(ctx, area, S, pal, pul, Math.sin(anim * 0.8));
      extraLight(ctx, area);
      text(ctx, info(), area.x + area.w / 2, area.y + 16, g.px(20), pal.dim, { weight: '600', outline: 'rgba(0,0,0,0.5)', lw: 3 });
      const sheet = MODE === 'learn' || (MODE === 'free' && !(guide.length && P.guide));
      {
        let sa = area, Ls = L;
        if (sheet) {
          if (L.landscape) { const cw = Math.round(area.w * 0.38); Ls = { ...L, a: { x: area.x, y: area.y, w: cw, h: area.h }, hitY: area.y + area.h - 6 }; sa = { x: area.x + cw, y: area.y, w: area.w - cw, h: area.h }; }
          else sa = { x: area.x, y: L.hitY, w: area.w, h: area.y + area.h - L.hitY };
          if (MODE === 'learn') drawSheet(g, Ls); else drawFreeCells(g, Ls);
        }
        rt.list = MODE === 'follow' ? targets : MODE === 'free' && !sheet ? guide : EMPTY;
        rt.demos = MODE === 'learn' ? demos.slice(nextDemo, nextDemo + 6) : EMPTY; rt.soft = MODE === 'free'; rt.clock = clock; rt.look = look; rt.spb = spb; rt.anim = anim; rt.pul = pul; rt.flash = flash; rt.hold = hold; rt.ptr = ptr; rt.pal = pal; rt.lanes = lanes;
        { const pb = clock < 0 ? 0 : clock / spb; rt.cycle = { beats: cycleBeats, meter, pos: ((pb % cycleBeats) + cycleBeats) % cycleBeats }; }
        // wide screens: the shell's Menu / Hint / Restart row floats over the bottom of the play area, so the instrument keeps clear of it
        // (the floor and backdrop still run to the edge: `bleed`)
        const foot = L.landscape && P.layout !== 'strings' ? Math.round(g.px(46)) : 0;   // string instruments keep their own fit
        stage.layout(foot ? { ...sa, h: sa.h - foot, bleed: foot } : sa);
        stage.draw(g, rt);
      }
      // count-in numeral and streak watermark
      if (clock < 0 && !done) {
        const n = Math.ceil(-clock / spb), mid = (L.top + L.hitY) / 2;
        const cs = stage.countSpot ? stage.countSpot() : null;   // a stage may park the numeral where it covers no label or instrument part
        if (cs) text(ctx, String(n), cs.x, cs.y, cs.size * (0.9 + 0.25 * pul), rgba(pal.accent, 0.6 + 0.35 * pul), { weight: '900', outline: 'rgba(0,0,0,0.55)', lw: 5, family: 'Georgia, serif' });
        else text(ctx, String(n), L.mid, mid, Math.min(L.hitY - L.top, 220) * 0.55 * (0.9 + 0.25 * pul), rgba(pal.accent, 0.55 + 0.35 * pul), { weight: '900', outline: 'rgba(0,0,0,0.45)', lw: 6, family: 'Georgia, serif' });
      }
      drawParticles(g, L);
      // judgement pop-ups: spring in, drift up, fade
      for (const p of pops) {
        const big = p.lane < 0, an = big ? { x: L.mid, y: L.top + (L.hitY - L.top) * 0.45 } : popAt(L, p.lane), u = p.age / 0.8, sp = u < 0.18 ? 0.6 + 2.2 * u : 1;
        ctx.globalAlpha = clamp(1.6 - 1.6 * u, 0, 1);
        text(ctx, p.text, clamp(an.x, area.x + 50, area.x + area.w - 50), an.y - (big ? 10 : 30) - u * (big ? 30 : 46), Math.max(g.px(big ? 34 : 22) * sp, g.px(0) * 0.95), p.color, { weight: '800', outline: 'rgba(0,0,0,0.75)', lw: 4 });
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
      extraLight(ctx, rect);
      {
        const t = g.t ?? 0, fl = lanes.map((_, i) => Math.max(0, 1 - (((t * 0.9 + i * 0.41) % 3.1)) * 2.6));
        const idle = { list: EMPTY, soft: false, clock: 0, look: 2, spb: 0.5, anim: t, pul: 0.3, flash: fl, hold: fl.map((v) => v * 0.5), ptr: null, pal, lanes, cycle: { beats: cycleBeats, meter, pos: (t * 0.8) % cycleBeats } };
        const vw = stage.neck ? Math.min(rect.w, rect.h * 0.72) : rect.w;   // 1.18.0: neck instruments keep their own tall proportions in the title picture
        stage.layout(stage.neck ? { x: rect.x + (rect.w - vw) / 2, y: rect.y - 34, w: vw, h: rect.h + 38 } : { x: rect.x + (rect.w - vw) / 2, y: rect.y, w: vw, h: rect.h });
        setHero(true); stage.draw(g, idle); setHero(false);
      }
      ctx.restore();
    },
    status() {
      if (study.on) return { score: null, max: null, label: info(), frac: clamp(clock / spb / Math.max(1, songBeats), 0, 1) };
      return { score: percent(), max: 100, label: info() };
    },
    result: () => done,
    hint() {
      if (study.on) return 'Slow it down with the speed buttons, listen to a few bars, then press Now you try.';
      if (MODE === 'learn') return 'Say the names in time as you play: each cell is one beat.';
      if (MODE === 'free') return 'Strike on the beat or on the half beat; the drone is the home note.';
      const next = targets.find((t) => t.state === 'pending');
      return next ? `Next: ${lanes[next.lane].name} in ${Math.max(0, (next.t - clock) / spb).toFixed(1)} beats` : 'Hold steady to the end.';
    },
    rules: () => [
      `Tempo ${Math.round((song.bpm ?? 80) * P.tempo)} beats per minute, ${meter} beats to the bar.`,
      `Perfect: within ${Math.round(perfectW * 1000)} ms of the beat. Good: within ${Math.round(goodW * 1000)} ms.`,
      ...(MODE === 'free' ? ['Free play: strokes close to the pulse grid score; stray taps lower your accuracy.'] : ['Extra strokes between the notes cost points, so do not rush.']),
      'Keys: A S D F G H J K L ; play the lanes from left to right (or 1 to 0).',
    ],
    getState: () => ({
      mode: MODE, layout: P.layout, song: song.name ?? '', lanes: N, clock: Math.round(clock * 1000) / 1000, spb: Math.round(spb * 10000) / 10000,
      targets: targets.map((t) => ({ t: Math.round(t.t * 1000) / 1000, lane: t.lane, state: t.state })),
      study: study.on || study.trying ? { on: study.on, trying: study.trying, speed: study.speed, song: study.song, loop: study.loop, playing: study.playing, beat: Math.round((clock / spb) * 1000) / 1000, next: study.next } : null,
      guideCount: guide.length, guide: guide.slice(0, 120).map((g) => ({ t: Math.round(g.t * 1000) / 1000, lane: g.lane })), counts: { ...counts }, strays, combo, maxCombo, points: pts, percent: percent(), done: !!done, endT: Math.round(endT * 1000) / 1000,
    }),
  };
  return act;
}

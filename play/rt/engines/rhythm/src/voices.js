// Engine-local voices for the rhythm engine (1.6.0): sung voice (chest, head, break, duet), throat-singing overtones, whistle,
// the bagpipe reed (chanter and drones) and the rubboard scrape. WebAudio only, our own synthesis, no samples.
// Same plumbing and output rules as platform/engine-kit/synth.js (audio.out / audio.send / audio.noise); without a running
// AudioContext every call returns null and does nothing (headless tests). Never touches Math.random or the clock.
import { SYNTH_VOICES } from './voice-registry.js';
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const exp = (x) => Math.max(0.0001, x);
let seedCounter = 0;

function open(audio, p) {
  if (!audio || audio.muted) return null;
  const ac = audio.context;
  if (!ac || (ac.state !== 'running' && !audio.forceRun) || (audio.voices ?? 0) > 30 || !audio.out) return null;
  return { ac, t: ac.currentTime + Math.max(0, p.delay ?? 0) + 0.005 };
}
function bus(audio, ac, { gain = 1, pan = 0, wet = 0.12 } = {}) {
  const g = ac.createGain(); g.gain.value = gain;
  let last = g;
  if (pan && ac.createStereoPanner) { const sp = ac.createStereoPanner(); sp.pan.value = clamp(pan, -1, 1); g.connect(sp); last = sp; }
  last.connect(audio.out);
  if (wet > 0 && audio.send) { const w = ac.createGain(); w.gain.value = wet; last.connect(w); w.connect(audio.send); }
  return g;
}
function track(audio, src) {
  audio.voices = (audio.voices ?? 0) + 1;
  let done = false;
  src.addEventListener('ended', () => { if (!done) { done = true; audio.voices = Math.max(0, (audio.voices ?? 1) - 1); } });
}
function osc(ac, type, hz, t, dur) { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(hz, t); o.start(t); o.stop(t + dur); return o; }
function noise(audio, ac, t, dur) { const s = ac.createBufferSource(); s.buffer = audio.noise(); s.loop = true; s.start(t, (seedCounter++ * 0.37) % 1.6); s.stop(t + dur); return s; }
function filt(ac, type, f, q = 0.7, gain = 0) { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = clamp(f, 20, 18000); b.Q.value = q; b.gain.value = gain; return b; }
const level = (p, base = 1) => base * Math.pow(clamp(p.vel ?? 0.8, 0.05, 1.2), 1.15);
// a voice's own envelope gain: attack a, held until t+hold, then released over r; cut(t) ends it early (a monophonic voice or pipe)
function envelope(ac, t, peak, a, hold, r) {
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(exp(peak), t + a);
  g.gain.setValueAtTime(exp(peak), t + Math.max(a, hold)); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a, hold) + r);
  return g;
}
const cutter = (ac, g, peak, until) => ({ cut(at = ac.currentTime) { try { const t = Math.max(at, ac.currentTime); if (t > until) return; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value || peak), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045); } catch { /* audio is optional */ } } });

// vowel formants [F1, F2, F3] in Hz (adult male chest voice); the head voice raises F1 toward the pitch
export const VOWELS = { a: [730, 1090, 2440], e: [530, 1840, 2480], i: [270, 2290, 3010], o: [570, 840, 2410], u: [300, 870, 2240], ah: [800, 1200, 2500], oe: [450, 1450, 2450] };

// ---- sung voice: yodel, call, duet ----------------------------------------------------------------------------------------
// p: hz, from (previous pitch: the break), reg 'chest' | 'head', vowel, vel, dur, echo (mountain echo 0..1)
function vocal(audio, p, o) {
  const { ac, t } = o, hz = clamp(p.hz, 70, 1800), D = clamp(p.dur ?? 0.5, 0.12, 6), head = p.reg === 'head';
  const vow = VOWELS[p.vowel] ?? VOWELS.a, g0 = level(p, 0.16) * (head ? 0.85 : 1);
  const out = bus(audio, ac, { pan: p.pan, wet: 0.22 });
  const env = envelope(ac, t, g0, head ? 0.045 : 0.03, D, head ? 0.16 : 0.12);
  const src = ac.createGain(), end = t + D + 0.35;
  const saw1 = osc(ac, head ? 'triangle' : 'sawtooth', hz, t, end - t), saw2 = osc(ac, head ? 'sine' : 'sawtooth', hz, t, end - t);
  saw1.detune.value = head ? 0 : -7; saw2.detune.value = head ? 0 : 7;
  const gs = ac.createGain(); gs.gain.value = head ? 0.9 : 0.5; saw1.connect(gs); gs.connect(src);
  const g2 = ac.createGain(); g2.gain.value = head ? 0.5 : 0.5; saw2.connect(g2); g2.connect(src);
  // the break: from the previous pitch the voice flips over in about 40 ms and the tone dips for a moment (the yodel "crack")
  const from = p.from && Math.abs(p.from - hz) > 8 ? clamp(p.from, 70, 1800) : hz * (head ? 0.985 : 0.97);
  for (const s of [saw1, saw2]) {
    s.frequency.setValueAtTime(from, t);
    s.frequency.exponentialRampToValueAtTime(hz, t + (p.from ? 0.05 : 0.04));
  }
  if (p.from && Math.abs(p.from - hz) > 8) { env.gain.cancelScheduledValues(t); env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(exp(g0 * 0.3), t + 0.022); env.gain.linearRampToValueAtTime(exp(g0), t + 0.07); env.gain.setValueAtTime(exp(g0), t + Math.max(0.07, D)); env.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.07, D) + 0.16); }
  // vibrato that arrives after the onset
  const lfo = osc(ac, 'sine', 5.3, t, end - t), lg = ac.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(head ? 9 : 14, t + Math.min(0.5, D * 0.6)); lfo.connect(lg); lg.connect(saw1.detune); lg.connect(saw2.detune);
  // vowel: three parallel formant bands (the head voice raises the first one toward the sung pitch)
  const sum = ac.createGain();
  const f1 = head ? clamp(vow[0] + (hz - 300) * 0.5, vow[0], 1400) : vow[0];
  [[f1, head ? 7 : 9, 1.0], [vow[1], 10, head ? 0.35 : 0.55], [vow[2], 12, head ? 0.12 : 0.3]].forEach(([f, q, gn]) => {
    const bp = filt(ac, 'bandpass', f, q), gg = ac.createGain(); gg.gain.value = gn * 4.2; src.connect(bp); bp.connect(gg); gg.connect(sum);
  });
  // breath: falsetto is airy
  const nz = noise(audio, ac, t, end - t), nf = filt(ac, 'bandpass', f1 * 1.6, 1.4), ng = ac.createGain(); ng.gain.value = head ? 0.06 : 0.018; nz.connect(nf); nf.connect(ng); ng.connect(sum);
  const lp = filt(ac, 'lowpass', head ? 3000 : 4800, 0.7);
  sum.connect(lp); lp.connect(env); env.connect(out);
  // valley echo: one soft repeat, darker, a little later
  const echo = p.echo ?? 0;
  if (echo > 0) {
    const dl = ac.createDelay(1.5); dl.delayTime.value = p.echoDelay ?? 0.42; const fb = ac.createGain(); fb.gain.value = 0.32; const eg = ac.createGain(); eg.gain.value = 0.38 * echo;
    const elp = filt(ac, 'lowpass', 2400, 0.6); env.connect(dl); dl.connect(elp); elp.connect(fb); fb.connect(dl); elp.connect(eg); eg.connect(out);
  }
  track(audio, saw1);
  return cutter(ac, env, g0, t + D);
}

// ---- throat singing: a held low fundamental, one harmonic picked out by a very narrow resonance (the overtone melody) -------
function throat(audio, p, o) {
  const { ac, t } = o, hz = clamp(p.hz, 200, 3200), f0 = clamp(p.f0 ?? hz / 8, 55, 260), D = clamp(p.dur ?? 0.6, 0.12, 8), g0 = level(p, 0.17);
  const out = bus(audio, ac, { pan: p.pan, wet: 0.2 });
  const env = envelope(ac, t, g0, 0.05, D, 0.18), end = t + D + 0.4;
  // the throat buzz: harmonic-rich saw at the fundamental (and a sub-octave for the kargyraa style)
  const src = ac.createGain();
  const s1 = osc(ac, 'sawtooth', f0, t, end - t); s1.connect(src);
  if (p.sub) { const s2 = osc(ac, 'square', f0 / 2, t, end - t), g = ac.createGain(); g.gain.value = 0.35; s2.connect(g); g.connect(src); }
  // two narrow resonances in a row pick the harmonic nearest the lane pitch: a flute-like whistle floating above the drone
  const n = Math.max(1, Math.round(hz / f0)), pick = n * f0;
  const bp1 = filt(ac, 'bandpass', pick, 38), bp2 = filt(ac, 'bandpass', pick, 30), gp = ac.createGain(); gp.gain.setValueAtTime(7.5, t);
  // the resonance slides in from the previous overtone (the tongue moves)
  if (p.from) { bp1.frequency.setValueAtTime(clamp(p.from, 200, 3200), t); bp1.frequency.exponentialRampToValueAtTime(pick, t + 0.06); bp2.frequency.setValueAtTime(clamp(p.from, 200, 3200), t); bp2.frequency.exponentialRampToValueAtTime(pick, t + 0.06); }
  src.connect(bp1); bp1.connect(bp2); bp2.connect(gp);
  // the throat body: a low lopsided formant so the fundamental keeps its growl
  const body = filt(ac, 'lowpass', 520, 0.8), gb = ac.createGain(); gb.gain.value = 0.55; src.connect(body); body.connect(gb);
  const sum = ac.createGain(); gp.connect(sum); gb.connect(sum);
  sum.connect(env); env.connect(out);
  track(audio, s1);
  return cutter(ac, env, g0, t + D);
}

// ---- whistle (whistled speech): a clean pitch with air, quick glides between syllable pitches ------------------------------
function whistle(audio, p, o) {
  const { ac, t } = o, hz = clamp(p.hz, 300, 3600), D = clamp(p.dur ?? 0.3, 0.06, 4), g0 = level(p, 0.2);
  const out = bus(audio, ac, { pan: p.pan, wet: 0.24 });
  const env = envelope(ac, t, g0, 0.02, D, 0.09), end = t + D + 0.2;
  const sum = ac.createGain();
  const a = osc(ac, 'sine', hz, t, end - t), b = osc(ac, 'sine', hz * 2, t, end - t), gb = ac.createGain(); gb.gain.value = 0.05;
  const from = p.from && Math.abs(p.from - hz) > 8 ? clamp(p.from, 300, 3600) : hz;
  a.frequency.setValueAtTime(from, t); a.frequency.exponentialRampToValueAtTime(hz, t + 0.07);
  b.frequency.setValueAtTime(from * 2, t); b.frequency.exponentialRampToValueAtTime(hz * 2, t + 0.07);
  a.connect(sum); b.connect(gb); gb.connect(sum);
  const lfo = osc(ac, 'sine', 6.1, t, end - t), lg = ac.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(7, t + Math.min(0.4, D)); lfo.connect(lg); lg.connect(a.detune);
  const nz = noise(audio, ac, t, end - t), nf = filt(ac, 'bandpass', hz, 14), ng = ac.createGain(); ng.gain.value = 0.9; nz.connect(nf); nf.connect(ng); ng.connect(sum);
  sum.connect(env); env.connect(out);
  const echo = p.echo ?? 0;
  if (echo > 0) { const dl = ac.createDelay(1.5); dl.delayTime.value = p.echoDelay ?? 0.5; const fb = ac.createGain(); fb.gain.value = 0.28; const eg = ac.createGain(); eg.gain.value = 0.3 * echo; const elp = filt(ac, 'lowpass', 3200, 0.6); env.connect(dl); dl.connect(elp); elp.connect(fb); fb.connect(dl); elp.connect(eg); eg.connect(out); }
  track(audio, a);
  return cutter(ac, env, g0, t + D);
}

// ---- bagpipe reed: a strong, nasal, constant-volume reed with a hard onset and a short release (the bag never lets it swell) ----
// 1.19.0: chanter voicings for the parametric bagpipes (stage.reedStyle); no style = the Highland chanter exactly as before
const REEDSTYLE = {
  zampogna: { det: [-7, 8], sq: 0.3, form: [[hz => hz * 2, 3, 0.9], [1100, 4, 1.0], [2200, 5, 0.6], [3200, 6, 0.2]], lp: 4200, att: 0.016 },
  uilleann: { det: [-1, 2], sq: 0.18, form: [[hz => hz * 2, 3, 0.8], [900, 4, 1.0], [2100, 5, 0.5]], lp: 3300, att: 0.02 },
  gaita: { det: [-3, 4], sq: 0.55, form: [[hz => hz * 2, 4, 1.0], [1400, 5, 1.1], [2900, 6, 0.8], [3800, 6, 0.4]], lp: 6200, att: 0.01 },
  gaida: { det: [-5, 6], sq: 0.45, form: [[hz => hz * 2, 4, 1.0], [1200, 5, 1.0], [2400, 6, 0.7], [3600, 6, 0.4]], lp: 5000, att: 0.012, noise: 0.05 },
  tulum: { det: [-10, 9], sq: 0.35, form: [[hz => hz * 2, 3, 0.9], [1000, 4, 1.1], [2000, 5, 0.7]], lp: 4500, att: 0.014 },
  musette: { det: [-2, 3], sq: 0.12, form: [[hz => hz * 2, 3, 0.7], [850, 4, 1.0], [1800, 5, 0.5]], lp: 3000, att: 0.03 },
};
function reedpipe(audio, p, o) {
  const { ac, t } = o, hz = clamp(p.hz, 90, 2400), D = clamp(p.dur ?? 0.4, 0.03, 6), g0 = level(p, 0.15), RS = REEDSTYLE[p.style];
  const out = bus(audio, ac, { pan: p.pan, wet: 0.1 });
  const env = envelope(ac, t, g0, RS ? RS.att : p.soft ? 0.03 : 0.012, D, 0.035), end = t + D + 0.12;
  const src = ac.createGain();
  const s1 = osc(ac, 'sawtooth', hz, t, end - t), s2 = osc(ac, 'square', hz, t, end - t), g2 = ac.createGain(); g2.gain.value = RS ? RS.sq : 0.35;
  s1.detune.value = RS ? RS.det[0] : -2; s2.detune.value = RS ? RS.det[1] : 3; s1.connect(src); s2.connect(g2); g2.connect(src);
  const sum = ac.createGain();
  (RS ? RS.form.map(([f, q, gn]) => [typeof f === 'function' ? f(hz) : f, q, gn]) : [[hz * 2.0, 4, 1.0], [hz * 4.2, 4, 0.8], [1250, 5, 0.9], [2650, 6, 0.55], [3500, 6, 0.3]]).forEach(([f, q, gn]) => { const bp = filt(ac, 'bandpass', f, q), gg = ac.createGain(); gg.gain.value = gn * 2.6; src.connect(bp); bp.connect(gg); gg.connect(sum); });
  const dir = ac.createGain(); dir.gain.value = 0.5; src.connect(dir); dir.connect(sum);
  if (RS?.noise) { const nz = noise(audio, ac, t, end - t), nf = filt(ac, 'bandpass', 2400, 1.2), ng = ac.createGain(); ng.gain.value = RS.noise * 3; nz.connect(nf); nf.connect(ng); ng.connect(sum); }
  const lp = filt(ac, 'lowpass', RS ? RS.lp : 5200, 0.7);
  sum.connect(lp); lp.connect(env); env.connect(out);
  track(audio, s1);
  return cutter(ac, env, g0, t + D);
}

// ---- rubboard: a spoon or bottle opener drawn across ridged metal ---------------------------------------------------------
// p.dir 'down' (bright to dull sweep), 'up' (dull to bright), 'tick' (a single ridge); hz scales the brightness
function scrape(audio, p, o) {
  const { ac, t } = o, g0 = level(p, 0.2), out = bus(audio, ac, { pan: p.pan, wet: 0.06 });
  const dir = p.dir ?? 'down', tick = dir === 'tick', D = tick ? 0.035 : clamp(p.dur ?? 0.16, 0.06, 0.5), hz = p.hz ?? 3200;
  const nz = noise(audio, ac, t, D + 0.05), bp = filt(ac, 'bandpass', hz, 1.6), hp = filt(ac, 'highpass', 1400, 0.7);
  const hi = hz * 1.35, lo = hz * 0.7;
  bp.frequency.setValueAtTime(tick ? hz * 1.2 : dir === 'down' ? hi : lo, t); bp.frequency.exponentialRampToValueAtTime(tick ? hz * 1.1 : dir === 'down' ? lo : hi, t + D);
  // the ridges: the amplitude chops at the rate the spoon crosses them (about 90 per second, slowing as the stroke dies away)
  const chop = ac.createGain(), am = osc(ac, 'square', tick ? 40 : dir === 'down' ? 120 : 80, t, D + 0.05), ag = ac.createGain();
  am.frequency.setValueAtTime(tick ? 40 : dir === 'down' ? 130 : 70, t); am.frequency.linearRampToValueAtTime(tick ? 40 : dir === 'down' ? 70 : 125, t + D);
  ag.gain.value = tick ? 0 : 0.42; chop.gain.value = tick ? 1 : 0.58; am.connect(ag); ag.connect(chop.gain);
  const env = ac.createGain(); env.gain.setValueAtTime(0.0001, t);
  env.gain.linearRampToValueAtTime(exp(g0 * (tick ? 3.2 : 2.6)), t + (tick ? 0.002 : dir === 'down' ? 0.008 : 0.04));
  env.gain.setValueAtTime(exp(g0 * (tick ? 3.2 : 2.6)), t + D * (dir === 'down' ? 0.35 : 0.55));
  env.gain.exponentialRampToValueAtTime(0.0001, t + D + 0.03);
  nz.connect(hp); hp.connect(bp); bp.connect(chop); chop.connect(env); env.connect(out);
  // the thin metallic ring of the board
  [[2.9, 0.12], [4.3, 0.08], [6.1, 0.05]].forEach(([r, gn], k) => {
    const s = osc(ac, 'sine', hz * 0.5 * r, t, 0.2), g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(exp(g0 * gn * (tick ? 1.8 : 1)), t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + (tick ? 0.07 : 0.14) + k * 0.02); s.connect(g); g.connect(out);
  });
  track(audio, nz);
  return null;
}

for (const [k, fn] of Object.entries({ vocal, throat, whistle, reedpipe, scrape })) SYNTH_VOICES.set(k, fn);
export function evoice(audio, kind, p = {}) {
  const fn = SYNTH_VOICES.get(kind);
  if (!fn) return null;
  try { const o = open(audio, p); return o ? fn(audio, p, o) : null; } catch { return null; }
}

// ---- constant drones: stay on until stopped (or until `dur`, whichever comes first) ------------------------------------------
// kind 'reed': bagpipe drones (tenors and bass: pass every pitch in hzs); kind 'vocal': the throat-singing fundamental
export function startDrone(audio, kind, hzs, p = {}) {
  try {
    const o = open(audio, p);
    if (!o) return null;
    const { ac, t } = o, D = clamp(p.dur ?? 120, 4, 900), vel = p.vel ?? 0.5, fade = p.fade ?? (kind === 'reed' ? 1.3 : 1.5);
    const out = bus(audio, ac, { wet: 0.1 });
    const master = ac.createGain(); master.gain.setValueAtTime(0.0001, t); master.gain.linearRampToValueAtTime(exp(0.09 * vel), t + fade); master.connect(out);
    const oscs = [];
    hzs.forEach((hz, k) => {
      const src = ac.createGain();
      const a = osc(ac, 'sawtooth', hz, t, D), b = osc(ac, kind === 'reed' ? 'square' : 'sawtooth', hz, t, D), gb = ac.createGain(); gb.gain.value = kind === 'reed' ? 0.3 : 0.45;
      a.detune.value = (k % 2 ? 1 : -1) * 2.5; b.detune.value = (k % 2 ? -1 : 1) * 3.5; a.connect(src); b.connect(gb); gb.connect(src);
      if (kind === 'reed') {
        // a drone reed is soft and hollow: the 3rd, 5th and 7th harmonics are strong, the top is rounded off
        const sum = ac.createGain();
        [[hz * 3, 3, 1.0], [hz * 5, 4, 0.7], [hz * 7.2, 5, 0.4], [hz, 2, 0.5]].forEach(([f, q, gn]) => { const bp = filt(ac, 'bandpass', f, q), gg = ac.createGain(); gg.gain.value = gn * 2.2; src.connect(bp); bp.connect(gg); gg.connect(sum); });
        const lp = filt(ac, 'lowpass', 2600, 0.6); sum.connect(lp); lp.connect(master);
      } else {
        const lp = filt(ac, 'lowpass', 850, 0.9), pk = filt(ac, 'peaking', 480, 3, 7); src.connect(lp); lp.connect(pk); pk.connect(master);
      }
      oscs.push(a, b);
    });
    track(audio, oscs[0]);
    let stopped = false;
    return { stop(release = 0.4) { if (stopped) return; stopped = true; try { const now = Math.max(ac.currentTime, t); master.gain.cancelScheduledValues(now); master.gain.setValueAtTime(Math.max(0.0001, master.gain.value || 0.05), now); master.gain.exponentialRampToValueAtTime(0.0001, now + release); for (const s of oscs) s.stop(now + release + 0.05); } catch { /* audio is optional */ } } };
  } catch { return null; }
}

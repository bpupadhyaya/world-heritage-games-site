// Synthesised voices for the wind stages added in rhythm 1.6.0 (alphorn, panpipes, free-reed organs, end-blown flutes and reed pipes).
// Own WebAudio recipes, no samples. Same plumbing as platform/engine-kit/synth.js (audio.context / out / send / noise); a host without
// an AudioContext (headless tests) makes every call a silent no-op, and nothing here reads or writes game state.
import { WIND_SYNTHS } from './voice-registry.js';
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
let seed = 0;

function open(audio, p) {
  if (!audio || audio.muted) return null;
  const ac = audio.context;
  if (!ac || (ac.state !== 'running' && !audio.forceRun) || (audio.voices ?? 0) > 30 || !audio.out) return null;
  return { ac, t: ac.currentTime + Math.max(0, p.delay ?? 0) + 0.005 };
}
function bus(audio, ac, wet, pan = 0) {
  const g = ac.createGain();
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
const osc = (ac, type, hz, t, dur) => { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(hz, t); o.start(t); o.stop(t + dur); return o; };
const noise = (audio, ac, t, dur) => { const s = ac.createBufferSource(); s.buffer = audio.noise(); s.loop = true; s.start(t, (seed++ * 0.41) % 1.6); s.stop(t + dur); return s; };
const filt = (ac, type, f, q = 0.7, gain = 0) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = clamp(f, 20, 18000); b.Q.value = q; b.gain.value = gain; return b; };
const gainOf = (ac, v) => { const g = ac.createGain(); g.gain.value = v; return g; };
// attack, hold, release envelope on a gain param
function env(param, t, peak, att, D, rel) {
  param.setValueAtTime(0.0001, t);
  param.linearRampToValueAtTime(Math.max(0.0001, peak), t + att);
  param.setValueAtTime(Math.max(0.0001, peak * 0.96), t + Math.max(att + 0.01, D - 0.02));
  param.exponentialRampToValueAtTime(0.0001, t + D + rel);
}
const level = (p, base) => base * Math.pow(clamp(p.vel ?? 0.8, 0.05, 1.2), 1.1);
// pitch scoop: start `cents` flat and glide in over `dur`
const scoop = (o, hz, t, cents, dur) => { o.frequency.setValueAtTime(hz * Math.pow(2, -cents / 1200), t); o.frequency.exponentialRampToValueAtTime(hz, t + dur); };
const vibrato = (ac, targets, t, D, rate, cents, delay) => {
  const l = osc(ac, 'sine', rate, t, D + 0.4), g = ac.createGain();
  g.gain.setValueAtTime(0, t); g.gain.setValueAtTime(0, t + delay); g.gain.linearRampToValueAtTime(cents, t + delay + 0.5);
  l.connect(g); for (const x of targets) g.connect(x.detune);
};

// ---- alphorn: a long conical wooden horn; lip-buzzed, round and dark, a slow bloom, big cold air around it ----------------------
function alphorn(audio, p, o) {
  const { ac, t } = o, hz = clamp(p.hz ?? 220, 60, 900), D = clamp(p.dur ?? 1, 0.6, 5), peak = level(p, 0.2);
  const out = bus(audio, ac, 0.5, p.pan), g = ac.createGain();
  env(g.gain, t, peak, 0.2, D, 0.45);
  const sum = ac.createGain();
  const a = osc(ac, 'sawtooth', hz, t, D + 0.8), b = osc(ac, 'sawtooth', hz * 1.0035, t, D + 0.8), c = osc(ac, 'triangle', hz * 0.5, t, D + 0.8);
  scoop(a, hz, t, 60, 0.12); scoop(b, hz * 1.0035, t, 60, 0.12);
  const ga = gainOf(ac, 0.55), gb = gainOf(ac, 0.4), gc = gainOf(ac, 0.35);
  a.connect(ga); b.connect(gb); c.connect(gc); ga.connect(sum); gb.connect(sum); gc.connect(sum);
  vibrato(ac, [a, b], t, D, 0.55, 5, 0.3);
  const lp = filt(ac, 'lowpass', clamp(hz * 4.2, 700, 2100), 0.9), body = filt(ac, 'peaking', 360, 1.4, 7), dark = filt(ac, 'highshelf', 1800, 0.7, -8);
  sum.connect(lp); lp.connect(body); body.connect(dark); dark.connect(g); g.connect(out);
  const nz = noise(audio, ac, t, D + 0.6), nf = filt(ac, 'bandpass', hz * 2.3, 2.5), ng = gainOf(ac, 0.05 * peak);   // lip buzz
  nz.connect(nf); nf.connect(ng); ng.connect(g);
  track(audio, a);
}

// ---- panpipes: stopped pipes (odd harmonics), a breath jet across the rim, a quick chiff and a small pitch overshoot ----------------
const PAN = { siku: { air: 0.9, odd: 0.2, att: 0.045 }, zampona: { air: 0.9, odd: 0.2, att: 0.045 }, antara: { air: 0.75, odd: 0.18, att: 0.05 }, nai: { air: 1.15, odd: 0.1, att: 0.06 }, pan: { air: 0.95, odd: 0.15, att: 0.05 } };
function panpipes(audio, p, o) {
  const { ac, t } = o, hz = clamp(p.hz ?? 440, 150, 3000), D = clamp(p.dur ?? 0.6, 0.25, 3), style = PAN[p.style] ?? PAN.pan, peak = level(p, 0.2);
  const out = bus(audio, ac, 0.28, p.pan), g = ac.createGain();
  env(g.gain, t, peak, style.att, D, 0.14);
  const f1 = osc(ac, 'sine', hz, t, D + 0.4), f2 = osc(ac, 'sine', hz * 3, t, D + 0.4), f0 = osc(ac, 'sine', hz * 2, t, D + 0.4);
  scoop(f1, hz, t, -35, 0.05);   // the jet overshoots a little before the air column locks in
  vibrato(ac, [f1, f2, f0], t, D, 5.0, 4, 0.35);
  const sum = ac.createGain(), g2 = gainOf(ac, style.odd), g0 = gainOf(ac, 0.04);
  f1.connect(sum); f2.connect(g2); g2.connect(sum); f0.connect(g0); g0.connect(sum);
  const nz = noise(audio, ac, t, D + 0.4), nf = filt(ac, 'bandpass', hz, 28), nf2 = filt(ac, 'bandpass', hz * 2.6, 5), ng = gainOf(ac, 0.8 * style.air), ng2 = gainOf(ac, 0.22 * style.air);
  nz.connect(nf); nf.connect(ng); nz.connect(nf2); nf2.connect(ng2); ng.connect(sum); ng2.connect(sum);
  sum.connect(g); g.connect(filt(ac, 'lowpass', clamp(hz * 7, 2600, 8000), 0.5)).connect(out);
  const cz = noise(audio, ac, t, 0.1), cf = filt(ac, 'bandpass', clamp(hz * 3.2, 1200, 6500), 2.2), cg = ac.createGain();
  env(cg.gain, t, peak * 0.3, 0.008, 0.06, 0.05); cz.connect(cf); cf.connect(cg); cg.connect(out);
  track(audio, f1);
}

// ---- free reed organs: a metal tongue vibrating through the pipe, steady bright tone, fast clean attack and release ----------------
const REED = {
  lusheng: { lp: 3200, sub: 0.35, fifth: 0, oct: 0.15, formant: 700, beat: 4, att: 0.03 },
  khene: { lp: 4200, sub: 0, fifth: 0, oct: 0.3, formant: 1300, beat: 3, att: 0.025 },
  sheng: { lp: 4800, sub: 0, fifth: 0.3, oct: 0.3, formant: 1600, beat: 2, att: 0.03 },
  sho: { lp: 5200, sub: 0, fifth: 0.45, oct: 0.35, formant: 2000, beat: 1.5, att: 0.045 },
};
function freeReed(audio, p, o) {
  const { ac, t } = o, hz = clamp(p.hz ?? 330, 90, 2400), D = clamp(p.dur ?? 0.7, 0.2, 4), st = REED[p.style] ?? REED.khene, peak = level(p, 0.2);
  const out = bus(audio, ac, 0.2, p.pan), g = ac.createGain();
  env(g.gain, t, peak, st.att, D, 0.1);
  const sum = ac.createGain();
  const add = (type, mult, vol, det = 0) => { const s = osc(ac, type, hz * mult * Math.pow(2, det / 1200), t, D + 0.3); scoop(s, hz * mult * Math.pow(2, det / 1200), t, 28, 0.045); s.connect(gainOf(ac, vol)).connect(sum); return s; };
  const main = add('sawtooth', 1, 0.6), second = add('sawtooth', 1, 0.45, st.beat);   // two reeds beating slowly
  if (st.oct) add('sawtooth', 2, st.oct * 0.55, -st.beat);
  if (st.fifth) add('sawtooth', 1.5, st.fifth * 0.5);
  if (st.sub) add('triangle', 0.5, st.sub);
  void second;
  const lp = filt(ac, 'lowpass', clamp(hz * 7, 1600, st.lp), 0.8), fm = filt(ac, 'peaking', st.formant, 2.2, 7);
  sum.connect(fm); fm.connect(lp); lp.connect(g); g.connect(out);
  const nz = noise(audio, ac, t, D + 0.2), nf = filt(ac, 'bandpass', 3200, 1), ng = gainOf(ac, 0.025 * peak * 8);
  nz.connect(nf); nf.connect(ng); ng.connect(g);
  const kz = noise(audio, ac, t, 0.05), kf = filt(ac, 'bandpass', 2200, 1.5), kg = ac.createGain();
  env(kg.gain, t, peak * 0.2, 0.003, 0.03, 0.02); kz.connect(kf); kf.connect(kg); kg.connect(out);
  track(audio, main);
}

// ---- end-blown flutes and the reed pipe: slow bloom, a lot of breath, vibrato that arrives late --------------------------------
const FLUTE = {
  shakuhachi: { air: 1.1, h2: 0.12, att: 0.17, vib: [3.6, 14, 0.5], scoop: 45, lpm: 6 },
  xiao: { air: 0.8, h2: 0.1, att: 0.13, vib: [4.2, 9, 0.4], scoop: 30, lpm: 6 },
  ney: { air: 0.7, h2: 0.22, att: 0.11, vib: [5.0, 8, 0.45], scoop: 25, lpm: 8, edge: 0.3 },
  quena: { air: 0.6, h2: 0.14, att: 0.1, vib: [4.8, 10, 0.3], scoop: 35, lpm: 5 },
  kaval: { air: 0.45, h2: 0.2, att: 0.1, vib: [5.2, 9, 0.35], scoop: 20, lpm: 6 },
  fujara: { air: 0.35, h2: 0.3, att: 0.09, vib: [4.4, 6, 0.4], scoop: 15, lpm: 4 },
};
function endBlown(audio, p, o) {
  const { ac, t } = o, hz = clamp(p.hz ?? 330, 80, 2200), D = clamp(p.dur ?? 0.8, 0.3, 5), fl = FLUTE[p.style] ?? FLUTE.quena, peak = level(p, 0.18);
  const out = bus(audio, ac, 0.3, p.pan), g = ac.createGain();
  env(g.gain, t, peak, fl.att, D, 0.22);
  const f1 = osc(ac, 'sine', hz, t, D + 0.5), f2 = osc(ac, 'sine', hz * 2, t, D + 0.5), f3 = osc(ac, 'sine', hz * 3, t, D + 0.5);
  scoop(f1, hz, t, fl.scoop, 0.12);
  vibrato(ac, [f1, f2, f3], t, D, fl.vib[0], fl.vib[1], fl.vib[2]);
  const sum = ac.createGain(), g2 = gainOf(ac, fl.h2), g3 = gainOf(ac, fl.h2 * 0.35);
  f1.connect(sum); f2.connect(g2); g2.connect(sum); f3.connect(g3); g3.connect(sum);
  // breath: broad noise around the pitch (the air jet across the edge), loudest while the tone is still blooming
  const nz = noise(audio, ac, t, D + 0.5), nf = filt(ac, 'bandpass', hz * 1.9, 3.2), nf2 = filt(ac, 'bandpass', clamp(hz * 4.2, 900, 7000), 1.6), ng = ac.createGain(), ng2 = gainOf(ac, 0.18 * fl.air);
  ng.gain.setValueAtTime(0.9 * fl.air, t); ng.gain.linearRampToValueAtTime(0.5 * fl.air, t + fl.att + 0.25);
  nz.connect(nf); nf.connect(ng); ng.connect(sum); nz.connect(nf2); nf2.connect(ng2); ng2.connect(sum);
  if (fl.edge) { const e = filt(ac, 'peaking', clamp(hz * 5, 1200, 5200), 2, 5); sum.connect(e); e.connect(g); } else sum.connect(g);
  g.connect(filt(ac, 'lowpass', clamp(hz * fl.lpm, 1800, 8000), 0.5)).connect(out);
  track(audio, f1);
}
// duduk: a thick double reed, warm and nasal, with the long soft attack and vibrato of the player
function reedPipe(audio, p, o) {
  const { ac, t } = o, hz = clamp(p.hz ?? 330, 80, 1200), D = clamp(p.dur ?? 0.8, 0.3, 5), peak = level(p, 0.2);
  const out = bus(audio, ac, 0.3, p.pan), g = ac.createGain();
  env(g.gain, t, peak, 0.09, D, 0.2);
  const a = osc(ac, 'sawtooth', hz, t, D + 0.5), b = osc(ac, 'sawtooth', hz * 1.003, t, D + 0.5), c = osc(ac, 'square', hz * 0.5, t, D + 0.5);
  vibrato(ac, [a, b, c], t, D, 5.0, 9, 0.35);
  const sum = ac.createGain(); a.connect(gainOf(ac, 0.5)).connect(sum); b.connect(gainOf(ac, 0.4)).connect(sum); c.connect(gainOf(ac, 0.18)).connect(sum);
  const nasal = filt(ac, 'peaking', 950, 2.4, 8), lp = filt(ac, 'lowpass', clamp(hz * 5.5, 1200, 2300), 0.7);
  sum.connect(nasal); nasal.connect(lp); lp.connect(g); g.connect(out);
  const nz = noise(audio, ac, t, D + 0.4), nf = filt(ac, 'bandpass', 1900, 1.2), ng = gainOf(ac, 0.05 * peak * 6);
  nz.connect(nf); nf.connect(ng); ng.connect(g);
  track(audio, a);
}

for (const [k, fn] of Object.entries({ alphorn, panpipes, freereed: freeReed, endblown: endBlown, reedpipe: reedPipe })) WIND_SYNTHS.set(k, fn);
// play one note of a wind stage: kind is the stage voice, p = { hz, vel, dur, style, delay, pan }
export function windSound(audio, kind, p = {}) {
  const fn = WIND_SYNTHS.get(kind);
  if (!fn) return false;
  try {
    const o = open(audio, p);
    if (!o) return false;
    fn(audio, p, o);
    return true;
  } catch { return false; }
}
export const WIND_VOICES = [...WIND_SYNTHS.keys()];

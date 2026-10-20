// Wind synth recipes for the 1.19.0 wind stages (own WebAudio synthesis, no samples). Same plumbing as windvoice.js and silent without a running
// AudioContext; no Math.random and no clock.
//   shawm : the conical double reed (shehnai, nadaswaram, zurna, rhaita, suona, hichiriki): a buzzing saw pair, a nasal formant, vibrato or a
//           wail scoop per style, a little reed noise and a bright bell-side shelf
//   horn  : lip-buzzed horns and trumpets (kombu, narasingha, kakaki, pukaea style, vuvuzela): brassy saw stack through a bell filter
import { registerWindSynth } from './voice-registry.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
let seed = 0;
function bus(audio, ac, wet, pan = 0) {
  const g = ac.createGain(); let last = g;
  if (pan && ac.createStereoPanner) { const sp = ac.createStereoPanner(); sp.pan.value = clamp(pan, -1, 1); g.connect(sp); last = sp; }
  last.connect(audio.out);
  if (wet > 0 && audio.send) { const w = ac.createGain(); w.gain.value = wet; last.connect(w); w.connect(audio.send); }
  return g;
}
function track(audio, src) { audio.voices = (audio.voices ?? 0) + 1; let done = false; src.addEventListener('ended', () => { if (!done) { done = true; audio.voices = Math.max(0, (audio.voices ?? 1) - 1); } }); }
const osc = (ac, type, hz, t, dur) => { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(hz, t); o.start(t); o.stop(t + dur); return o; };
const noise = (audio, ac, t, dur) => { const s = ac.createBufferSource(); s.buffer = audio.noise(); s.loop = true; s.start(t, (seed++ * 0.39) % 1.6); s.stop(t + dur); return s; };
const filt = (ac, type, f, q = 0.7, gain = 0) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = clamp(f, 20, 18000); b.Q.value = q; b.gain.value = gain; return b; };
const gainOf = (ac, v) => { const g = ac.createGain(); g.gain.value = v; return g; };
function env(param, t, peak, att, D, rel) {
  param.setValueAtTime(0.0001, t); param.linearRampToValueAtTime(Math.max(0.0001, peak), t + att);
  param.setValueAtTime(Math.max(0.0001, peak * 0.96), t + Math.max(att + 0.01, D - 0.02)); param.exponentialRampToValueAtTime(0.0001, t + D + rel);
}
const level = (p, base) => base * Math.pow(clamp(p.vel ?? 0.8, 0.05, 1.2), 1.1);
const vibrato = (ac, targets, t, D, rate, cents, delay) => {
  if (!cents) return;
  const l = osc(ac, 'sine', rate, t, D + 0.4), g = ac.createGain();
  g.gain.setValueAtTime(0, t); g.gain.setValueAtTime(0, t + delay); g.gain.linearRampToValueAtTime(cents, t + delay + 0.4);
  l.connect(g); for (const x of targets) g.connect(x.detune);
};

const SHAWM = {
  shehnai: { att: 0.07, vib: [5.2, 11, 0.25], scoop: 25, lp: 3600, fm: 1100, fq: 2.2, fg: 8, beat: 1.004, sq: 0.15, noise: 0.05, shelf: -2, gain: 0.2 },
  nadaswaram: { att: 0.05, vib: [4.6, 6, 0.3], scoop: 30, lp: 5200, fm: 1500, fq: 1.8, fg: 9, beat: 1.003, sq: 0.3, noise: 0.05, shelf: 2, gain: 0.22, growl: 62 },
  zurna: { att: 0.03, vib: [0, 0, 0], scoop: 18, lp: 6200, fm: 1900, fq: 1.6, fg: 10, beat: 1.006, sq: 0.35, noise: 0.07, shelf: 3, gain: 0.2 },
  rhaita: { att: 0.04, vib: [3.8, 5, 0.4], scoop: 22, lp: 5600, fm: 1500, fq: 2.0, fg: 10, beat: 1.005, sq: 0.25, noise: 0.07, shelf: 2, gain: 0.2 },
  suona: { att: 0.035, vib: [6.0, 8, 0.2], scoop: 85, lp: 7000, fm: 2200, fq: 1.5, fg: 11, beat: 1.004, sq: 0.4, noise: 0.06, shelf: 4, gain: 0.18 },
  hichiriki: { att: 0.12, vib: [4.2, 16, 0.35], scoop: 70, lp: 2800, fm: 900, fq: 2.4, fg: 8, beat: 1.008, sq: 0.1, noise: 0.07, shelf: -3, gain: 0.2 },
};
function shawm(audio, p, o) {
  const { ac, t } = o, hz = clamp(p.hz ?? 330, 90, 1800), D = clamp(p.dur ?? 0.8, 0.25, 5), s = SHAWM[p.style] ?? SHAWM.shehnai, peak = level(p, s.gain);
  const out = bus(audio, ac, 0.26, p.pan), g = ac.createGain();
  env(g.gain, t, peak, s.att, D, 0.16);
  const a = osc(ac, 'sawtooth', hz, t, D + 0.5), b = osc(ac, 'sawtooth', hz * s.beat, t, D + 0.5), c = osc(ac, 'square', hz * 0.5, t, D + 0.5), d = osc(ac, 'sawtooth', hz * 2, t, D + 0.5);
  const f0 = (x, f) => { x.frequency.setValueAtTime(f * Math.pow(2, -s.scoop / 1200), t); x.frequency.exponentialRampToValueAtTime(f, t + 0.1); };
  f0(a, hz); f0(b, hz * s.beat); f0(d, hz * 2);
  vibrato(ac, [a, b, c, d], t, D, s.vib[0] || 5, s.vib[1], s.vib[2]);
  const sum = ac.createGain();
  a.connect(gainOf(ac, 0.5)).connect(sum); b.connect(gainOf(ac, 0.42)).connect(sum); c.connect(gainOf(ac, s.sq * 0.5)).connect(sum); d.connect(gainOf(ac, 0.14)).connect(sum);
  const nas = filt(ac, 'peaking', s.fm, s.fq, s.fg), shelf = filt(ac, 'highshelf', 3200, 0.7, s.shelf), lp = filt(ac, 'lowpass', clamp(hz * 7, 1400, s.lp), 0.7);
  sum.connect(nas); nas.connect(shelf); shelf.connect(lp);
  if (s.growl) { const am = ac.createGain(); am.gain.value = 0.84; const lf = osc(ac, 'sine', s.growl, t, D + 0.5), lg = gainOf(ac, 0.16); lf.connect(lg); lg.connect(am.gain); lp.connect(am); am.connect(g); } else lp.connect(g);
  g.connect(out);
  const nz = noise(audio, ac, t, D + 0.4), nf = filt(ac, 'bandpass', clamp(hz * 3.2, 1500, 5000), 1.2), ng = gainOf(ac, s.noise * peak * 6);
  nz.connect(nf); nf.connect(ng); ng.connect(g);
  track(audio, a);
}
registerWindSynth('shawm', shawm);

const HORN = {
  kombu: { att: 0.09, lp: 3400, fm: 760, scoop: 90, sub: 0.3, gain: 0.2, noise: 0.05 },
  kakaki: { att: 0.06, lp: 5600, fm: 1300, scoop: 55, sub: 0.15, gain: 0.18, noise: 0.05, trem: 5.5 },
  kudu: { att: 0.12, lp: 2200, fm: 480, scoop: 40, sub: 0.15, gain: 0.2, noise: 0.16 },
  vuvu: { att: 0.03, lp: 6400, fm: 1800, scoop: 14, sub: 0, gain: 0.16, noise: 0.07, buzz: 1.0 },
  siwa: { att: 0.14, lp: 2000, fm: 360, scoop: 60, sub: 0.45, gain: 0.22, noise: 0.08 },
  kajji: { att: 0.1, lp: 3000, fm: 900, scoop: 25, sub: 0.0, gain: 0.2, noise: 0.14, vib: 5.4 },
  kamba: { att: 0.11, lp: 2600, fm: 620, scoop: 30, sub: 0.1, gain: 0.2, noise: 0.18 },
  antelope: { att: 0.1, lp: 2400, fm: 520, scoop: 45, sub: 0.2, gain: 0.2, noise: 0.14 },
  trumpet: { att: 0.05, lp: 5200, fm: 1500, scoop: 50, sub: 0.1, gain: 0.18, noise: 0.05 },
  deep: { att: 0.14, lp: 1800, fm: 380, scoop: 60, sub: 0.45, gain: 0.22, noise: 0.06 },
  bright: { att: 0.04, lp: 6400, fm: 1900, scoop: 30, sub: 0, gain: 0.17, noise: 0.05 },
};
function horn(audio, p, o) {
  const { ac, t } = o, hz = clamp(p.hz ?? 220, 50, 1200), D = clamp(p.dur ?? 1, 0.3, 5), s = HORN[p.style] ?? HORN.trumpet, peak = level(p, s.gain);
  const out = bus(audio, ac, 0.34, p.pan), g = ac.createGain();
  env(g.gain, t, peak, s.att, D, 0.3);
  const a = osc(ac, 'sawtooth', hz, t, D + 0.8), b = osc(ac, 'sawtooth', hz * (s.buzz ? 1.012 : 1.004), t, D + 0.8), c = osc(ac, 'triangle', hz * 0.5, t, D + 0.8);
  for (const [x, f] of [[a, hz], [b, hz * (s.buzz ? 1.012 : 1.004)]]) { x.frequency.setValueAtTime(f * Math.pow(2, -s.scoop / 1200), t); x.frequency.exponentialRampToValueAtTime(f, t + 0.14); }
  vibrato(ac, [a, b], t, D, s.vib ?? 4.8, s.vib ? 12 : 5, 0.4);
  const sum = ac.createGain(); a.connect(gainOf(ac, 0.55)).connect(sum); b.connect(gainOf(ac, 0.4)).connect(sum); c.connect(gainOf(ac, s.sub)).connect(sum);
  const bellF = filt(ac, 'peaking', s.fm, 1.6, 8), lp = filt(ac, 'lowpass', clamp(hz * 8, 900, s.lp), 0.8);
  sum.connect(bellF); bellF.connect(lp);
  if (s.trem) { const am = ac.createGain(); am.gain.value = 0.86; const lf = osc(ac, 'sine', s.trem, t, D + 0.8), lg = gainOf(ac, 0.14); lf.connect(lg); lg.connect(am.gain); lp.connect(am); am.connect(g); } else lp.connect(g);
  g.connect(out);
  const nz = noise(audio, ac, t, D + 0.4), nf = filt(ac, 'bandpass', clamp(hz * 2.4, 600, 4000), 2.2), ng = gainOf(ac, (s.noise ?? 0.06) * peak * 5);
  nz.connect(nf); nf.connect(ng); ng.connect(g);
  track(audio, a);
}
registerWindSynth('horn', horn);

// ---- duct and vessel flutes: a sine-rich tone with a little second harmonic, a chiff at the start and breath that fades as the note settles ----------------------------------
const DUCT = {
  whistle: { att: 0.035, h2: 0.42, h3: 0.16, air: 0.32, lp: 7000, scoop: 22, vib: [0, 0], chiff: 1.0, gain: 0.2 },
  furulya: { att: 0.08, h2: 0.2, h3: 0.06, air: 0.5, lp: 3200, scoop: 30, vib: [4.4, 7], chiff: 0.5, gain: 0.2 },
  dvoyanka: { att: 0.05, h2: 0.3, h3: 0.1, air: 0.4, lp: 4800, scoop: 22, vib: [5.0, 6], chiff: 0.7, gain: 0.2, drone: 0.5 },
  ocarina: { att: 0.09, h2: 0.05, h3: 0.01, air: 0.28, lp: 2400, scoop: 18, vib: [4.6, 9], chiff: 0.3, gain: 0.24 },
};
function duct(audio, p, o) {
  const { ac, t } = o, hz = clamp(p.hz ?? 440, 120, 3200), D = clamp(p.dur ?? 0.7, 0.2, 5), s = DUCT[p.style] ?? DUCT.whistle, peak = level(p, s.gain);
  const out = bus(audio, ac, 0.3, p.pan), g = ac.createGain();
  env(g.gain, t, peak, s.att, D, 0.2);
  const f1 = osc(ac, 'sine', hz, t, D + 0.5), f2 = osc(ac, 'sine', hz * 2, t, D + 0.5), f3 = osc(ac, 'sine', hz * 3, t, D + 0.5);
  for (const [x, f] of [[f1, hz], [f2, hz * 2], [f3, hz * 3]]) { x.frequency.setValueAtTime(f * Math.pow(2, -s.scoop / 1200), t); x.frequency.exponentialRampToValueAtTime(f, t + 0.08); }
  vibrato(ac, [f1, f2, f3], t, D, s.vib[0] || 5, s.vib[1], 0.45);
  const sum = ac.createGain(); f1.connect(sum); f2.connect(gainOf(ac, s.h2)).connect(sum); f3.connect(gainOf(ac, s.h3)).connect(sum);
  if (s.drone) { const d = osc(ac, 'sine', hz * 0.667, t, D + 0.5); d.connect(gainOf(ac, s.drone * 0.5)).connect(sum); const d2 = osc(ac, 'triangle', hz * 0.668, t, D + 0.5); d2.connect(gainOf(ac, s.drone * 0.25)).connect(sum); }
  const nz = noise(audio, ac, t, D + 0.5), nf = filt(ac, 'bandpass', clamp(hz * 2.2, 800, 7000), 2.4), ng = ac.createGain();
  ng.gain.setValueAtTime(s.air * 0.9, t); ng.gain.linearRampToValueAtTime(s.air * 0.35, t + s.att + 0.2); nz.connect(nf); nf.connect(ng); ng.connect(sum);
  const lp = filt(ac, 'lowpass', clamp(hz * 7, 1800, s.lp), 0.6); sum.connect(lp); lp.connect(g); g.connect(out);
  const cz = noise(audio, ac, t, 0.1), cf = filt(ac, 'bandpass', clamp(hz * 3.4, 1500, 7000), 2.0), cg = ac.createGain();
  env(cg.gain, t, peak * 0.4 * s.chiff, 0.006, 0.05, 0.05); cz.connect(cf); cf.connect(cg); cg.connect(out);
  track(audio, f1);
}
registerWindSynth('duct', duct);

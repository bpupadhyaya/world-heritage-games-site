// Voices of the 1.27.0 paired-strike stick dances: one synthesised clash of two sticks per stroke (no samples). A stick is a hard cylinder: a very short broadband tick when the two
// surfaces meet, then the stick's own bending modes ringing for a few tens of milliseconds (fundamental plus two inharmonic overtones), a hollow tube note for bamboo, and for a pair
// of sticks a flam (the second stick lands a few milliseconds after the first, slightly higher). Each wood has its own pitch, ring and tick; each lane (across, high, low, own pair)
// shifts the pitch and length. Silent without an AudioContext; no Math.random and no clock (the grains come from audio.noise()).
import { registerSynthVoice, registerStrikeVoice } from './voice-registry.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
let seed = 0;
const ex = (x) => Math.max(0.0001, x);
const osc = (ac, type, hz, t, dur) => { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(hz, t); o.start(t); o.stop(t + dur); return o; };
const filt = (ac, type, f, q = 0.7) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = clamp(f, 20, 19000); b.Q.value = q; return b; };
const bus = (audio, ac, { pan = 0, wet = 0.08 } = {}) => {
  const g = ac.createGain(); let last = g;
  if (pan && ac.createStereoPanner) { const sp = ac.createStereoPanner(); sp.pan.value = clamp(pan, -1, 1); g.connect(sp); last = sp; }
  last.connect(audio.out);
  if (wet > 0 && audio.send) { const w = ac.createGain(); w.gain.value = wet; last.connect(w); w.connect(audio.send); }
  return g;
};
function grain(audio, ac, t, out, { f, q = 1, type = 'bandpass', dur = 0.02, gain = 0.3 }) {
  if (!audio.noise) return;
  const n = ac.createBufferSource(); n.buffer = audio.noise(); n.loop = true; n.start(t, (seed++ * 0.37) % 1.6); n.stop(t + dur + 0.05);
  const b = filt(ac, type, f, q), g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(ex(gain), t + 0.0008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(b); b.connect(g); g.connect(out);
}
// one stick surface meeting another: tick + ringing modes (+ a hollow tube note)
function hit(audio, ac, t, out, p, mul, gain) {
  const hz = clamp(p.hz * mul, 200, 5200), D = clamp(p.dur, 0.03, 0.4);
  grain(audio, ac, t, out, { f: hz * 2.6, q: p.tickQ ?? 1.4, dur: 0.011, gain: gain * (p.tick ?? 0.9) });
  const modes = p.modes ?? [[1, 1, 1], [2.76, 0.5, 0.5], [5.4, 0.22, 0.28]];
  let first = null;
  for (const [r, g, dk] of modes) {
    const o = osc(ac, 'sine', hz * r, t, D * dk + 0.04), e = ac.createGain();
    o.frequency.exponentialRampToValueAtTime(Math.max(60, hz * r * 0.985), t + D * dk);
    e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(ex(gain * g * 0.5), t + 0.0009); e.gain.exponentialRampToValueAtTime(0.0001, t + D * dk);
    o.connect(e); e.connect(out); if (!first) first = o;
  }
  if (p.hollow) grain(audio, ac, t, out, { f: hz * 0.5, q: p.hollow, dur: D * 1.1, gain: gain * 0.55 });
  if (p.thud) { const o = osc(ac, 'sine', hz * 0.42, t, 0.1), e = ac.createGain(); o.frequency.exponentialRampToValueAtTime(hz * 0.3, t + 0.08); e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(ex(gain * p.thud), t + 0.002); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); o.connect(e); e.connect(out); }
  return first;
}
registerSynthVoice('stickclack', (audio, p, o) => {
  const { ac, t } = o, vel = clamp(p.vel ?? 0.8, 0.05, 1.2), g0 = (p.gain ?? 0.5) * Math.pow(vel, 1.1);
  const out = bus(audio, ac, { wet: p.wet ?? 0.1, pan: p.pan ?? 0 });
  // tiny pitch variation from the grain counter so two clashes never sound the same
  const jit = 1 + ((seed % 7) - 3) * 0.006;
  const first = hit(audio, ac, t, out, p, (p.mul ?? 1) * jit, g0);
  if (p.flam) { hit(audio, ac, t + p.flam, out, { ...p, tick: (p.tick ?? 0.9) * 0.6 }, (p.mul ?? 1) * 1.045 * jit, g0 * 0.62); }
  if (p.bells) { for (let k = 0; k < 3; k++) { const o2 = osc(ac, 'sine', 4300 + k * 910, t + 0.004 * k, 0.16), e = ac.createGain(); e.gain.setValueAtTime(0.0001, t + 0.004 * k); e.gain.linearRampToValueAtTime(ex(g0 * p.bells * 0.12), t + 0.004 * k + 0.002); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.15 + 0.03 * k); o2.connect(e); e.connect(out); } }
  if (first) { audio.voices = (audio.voices ?? 0) + 1; let d = false; first.addEventListener('ended', () => { if (!d) { d = true; audio.voices = Math.max(0, (audio.voices ?? 1) - 1); } }); }
  return null;
});

// the woods: base pitch (Hz), ring (s), and what makes it itself
const WOODS = {
  dandiya: { hz: 1900, dur: 0.07, gain: 0.5, flam: 0.006, tick: 1.0, wet: 0.1 },                                // lacquered hardwood: a bright double tak
  rosewood: { hz: 1450, dur: 0.13, gain: 0.52, tick: 0.8, modes: [[1, 1, 1], [2.4, 0.55, 0.6], [4.9, 0.3, 0.35]], wet: 0.12 },   // dense, with a longer ring
  kolattam: { hz: 1700, dur: 0.08, gain: 0.48, flam: 0.005, bells: 1, wet: 0.1 },                               // painted wood, bells near the grips
  bamboo: { hz: 1150, dur: 0.12, gain: 0.5, hollow: 5, bells: 0.8, tick: 0.7, wet: 0.14 },                      // a hollow tube note
  cane: { hz: 1100, dur: 0.12, gain: 0.5, hollow: 5, tick: 0.7, wet: 0.14 },                                    // a short bamboo cane: a hollow tube note
  desert: { hz: 980, dur: 0.075, gain: 0.55, thud: 0.5, tick: 0.7, wet: 0.08 },                                 // thick rope-wrapped sticks: a dull thud
  ribbon: { hz: 2150, dur: 0.06, gain: 0.46, flam: 0.0045, tick: 1.1, wet: 0.1 },                              // light ash: a dry crack
  chestnut: { hz: 780, dur: 0.1, gain: 0.55, thud: 0.6, tick: 0.6, flam: 0.008, wet: 0.1 },                    // thick chestnut: a deep thock
  ash: { hz: 1380, dur: 0.085, gain: 0.5, tick: 0.9, flam: 0.0055, wet: 0.1 },
};
// lane order: 0 across, 1 high (brighter, shorter), 2 low (deeper, longer), 3 own pair (softer, flam wider)
const LANE = [{ mul: 1, d: 1, g: 1 }, { mul: 1.18, d: 0.8, g: 0.95 }, { mul: 0.82, d: 1.3, g: 1.05 }, { mul: 1.05, d: 0.9, g: 0.78, flamAdd: 0.004 }];
for (const [id, w] of Object.entries(WOODS)) LANE.forEach((l, i) => registerStrikeVoice(`stk-${id}-${i}`, (c) => c.evoice(c.audio, 'stickclack', { ...w, mul: l.mul, dur: w.dur * l.d, gain: w.gain * l.g, flam: w.flam ? w.flam + (l.flamAdd ?? 0) : l.flamAdd ? 0.007 : 0, vel: c.vel })));

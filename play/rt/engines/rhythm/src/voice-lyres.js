// Voices for the 1.18.0 lyre stages (own synthesis only). A lyre string is plucked or strummed with the fingers or a plectrum and rings over a
// resonating bowl or box; several of the family add a buzz (a bray) where the string rests, or a ring of metal bells on the foot. Tuned recipes of
// the shared pluck voice with a buzz layer (a bandpassed noise chopped at the string's own rate) and, for the nyatiti, a bell cluster.
// Silent without a running AudioContext; no Math.random, no clocks.
import { registerStrikeVoice, registerSynthVoice } from './voice-registry.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const cents = (hz, c) => hz * 2 ** (c / 1200);
let seed = 0;
function open(audio, p) {
  if (!audio || audio.muted) return null;
  const ac = audio.context;
  if (!ac || (ac.state !== 'running' && !audio.forceRun) || (audio.voices ?? 0) > 30 || !audio.out) return null;
  return { ac, t: ac.currentTime + Math.max(0, p.delay ?? 0) + 0.005 };
}
const bus = (audio, ac, wet = 0.12) => { const g = ac.createGain(); g.connect(audio.out); if (wet > 0 && audio.send) { const w = ac.createGain(); w.gain.value = wet; g.connect(w); w.connect(audio.send); } return g; };
const ex = (x) => Math.max(0.0001, x);

// a buzzing string: noise through a narrow band near the string's upper harmonics, chopped at a rate that tracks the pitch, dying quickly
registerSynthVoice('lyre-buzz', (audio, p) => {
  const o = open(audio, p); if (!o) return null;
  const { ac, t } = o, hz = clamp(p.hz, 60, 900), D = clamp(p.dur ?? 0.6, 0.2, 1.6), g0 = 0.22 * clamp(p.vel ?? 0.8, 0.05, 1.2) * (p.amt ?? 1);
  const out = bus(audio, ac, 0.08), env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(ex(g0), t + 0.006); env.gain.exponentialRampToValueAtTime(ex(g0 * 0.35), t + D * 0.3); env.gain.exponentialRampToValueAtTime(0.0001, t + D);
  const nz = ac.createBufferSource(); nz.buffer = audio.noise(); nz.loop = true; nz.start(t, (seed++ * 0.37) % 1.6); nz.stop(t + D + 0.05);
  const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = clamp(hz * (p.band ?? 7), 800, 7000); bp.Q.value = p.q ?? 1.6;
  const chop = ac.createGain(); chop.gain.value = 0.5;
  const am = ac.createOscillator(); am.type = 'square'; am.frequency.value = clamp(hz * 0.5, 40, 300); am.start(t); am.stop(t + D + 0.05);
  const ag = ac.createGain(); ag.gain.value = 0.5; am.connect(ag); ag.connect(chop.gain);
  nz.connect(bp); bp.connect(chop); chop.connect(env); env.connect(out);
  return null;
});

// a cluster of small iron bells and rings on the foot: bright inharmonic partials, a short ring, jittered start times
registerSynthVoice('toe-bell', (audio, p) => {
  const o = open(audio, p); if (!o) return null;
  const { ac, t } = o, g0 = 0.16 * clamp(p.vel ?? 0.8, 0.05, 1.2), out = bus(audio, ac, 0.16);
  const base = clamp(p.hz ?? 1500, 900, 2600);
  for (let k = 0; k < 6; k++) {
    const f = base * (1 + 0.37 * k + 0.05 * (k % 3)), at = t + k * 0.011 + (k % 2) * 0.004, dec = 0.14 + 0.05 * (k % 3);
    const s = ac.createOscillator(); s.type = 'sine'; s.frequency.value = f; s.start(at); s.stop(at + dec + 0.05);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(ex(g0 / (1 + k * 0.35)), at + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, at + dec);
    s.connect(g); g.connect(out);
  }
  return null;
});
registerStrikeVoice('toe-bell', (c) => c.evoice(c.audio, 'toe-bell', { hz: 1500, vel: c.vel }));

// one row per instrument: pluck preset, an optional doubled string, an optional body knock, an optional buzz amount
const LYRE = {
  'lyre-kissar': { preset: { t60: 1.0, bright: 0.62, pos: 0.18, body: [[180, 3, 7], [700, 2.5, 4], [1900, 2, 3]], wet: 0.12 }, hard: 0.55, thump: 160, thumpV: 0.18 },
  'lyre-tanbura': { preset: { t60: 0.9, bright: 0.5, pos: 0.2, body: [[140, 3, 8], [520, 2.5, 5]], wet: 0.1 }, hard: 0.6, thump: 120, thumpV: 0.3, buzz: 0.4 },
  'lyre-simsimiyya': { preset: { t60: 0.8, bright: 0.86, pos: 0.1, body: [[300, 3, 5], [2200, 2.5, 6], [4200, 2, 4]], wet: 0.14 }, hard: 1.0, double: 7, thump: 260, thumpV: 0.12 },
  'lyre-nyatiti': { preset: { t60: 0.7, bright: 0.74, pos: 0.12, body: [[200, 3, 6], [1100, 2.5, 6]], wet: 0.1 }, hard: 0.85, thump: 200, thumpV: 0.22, buzz: 0.7 },
  'lyre-litungu': { preset: { t60: 0.95, bright: 0.7, pos: 0.15, body: [[220, 3, 6], [1300, 2.5, 4], [2600, 2, 3]], wet: 0.12 }, hard: 0.7, double: 4 },
  'lyre-obokano': { preset: { t60: 1.3, bright: 0.4, pos: 0.22, body: [[100, 4, 9], [300, 3, 6]], wet: 0.12 }, hard: 0.5, thump: 90, thumpV: 0.3, buzz: 1.0 },
  'lyre-begena': { preset: { t60: 1.6, bright: 0.34, pos: 0.24, body: [[90, 4, 10], [260, 3, 6]], wet: 0.16 }, hard: 0.45, buzz: 1.4, octave: 0.2 },
  'lyre-greek': { preset: { t60: 1.1, bright: 0.58, pos: 0.14, body: [[240, 3, 6], [1000, 2.5, 4], [2400, 2, 3]], wet: 0.16 }, hard: 0.65, octave: 0.1 },
};
for (const [kind, r] of Object.entries(LYRE)) {
  registerStrikeVoice(kind, (c) => {
    const { audio, voice, evoice, hz, vel, dur } = c, d = Math.max(0.7, dur);
    voice(audio, 'pluck', { hz, vel, dur: d, inst: kind, preset: r.preset, hard: r.hard ?? 0.6 });
    if (r.double) voice(audio, 'pluck', { hz: cents(hz, r.double), vel: vel * 0.5, dur: d, inst: kind, preset: r.preset, hard: r.hard ?? 0.6, delay: 0.005 });
    if (r.octave) voice(audio, 'pluck', { hz: hz * 2, vel: vel * r.octave, dur: d * 0.8, inst: kind, preset: r.preset, hard: 0.5, delay: 0.004 });
    if (r.thump) voice(audio, 'drum', { hz: r.thump, vel: vel * (r.thumpV ?? 0.3), dur: 0.12, style: 'frame' });
    if (r.buzz) evoice(audio, 'lyre-buzz', { hz, vel, dur: Math.min(d, 0.9), amt: r.buzz });
  });
}

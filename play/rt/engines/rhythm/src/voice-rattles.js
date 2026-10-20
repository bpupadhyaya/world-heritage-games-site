// Voices for the 1.19.0 idiophone stages (rattles, scrapers, strands of shells and bells). Own synthesis, no samples; silent without a running
// AudioContext; no Math.random and no clock (noise grains come from audio.noise()). Two new recipes sit on the same plumbing as voice-synth2.js:
//   `ratchet`: a run of evenly spaced ticks (a toothed wheel or the notches of a scraper); p: n, spread, f, q, gain, tail, accel, hollow (a woody body under the ticks)
//   `strand`: a hanging strand of small hard things (shells, brass pellets, cocoons) swinging against each other; p: n, f, spread, gain, tail, metal (partials)
import { registerSynthVoice, registerStrikeVoice } from './voice-registry.js';
import { defVoice } from './voice-synth2.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
let seed = 0;
function open(audio, p) {
  if (!audio || audio.muted) return null;
  const ac = audio.context;
  if (!ac || (ac.state !== 'running' && !audio.forceRun) || (audio.voices ?? 0) > 30 || !audio.out) return null;
  return { ac, t: ac.currentTime + Math.max(0, p.delay ?? 0) + 0.005 };
}
void open;
const bus = (audio, ac, { pan = 0, wet = 0.08 } = {}) => {
  const g = ac.createGain(); let last = g;
  if (pan && ac.createStereoPanner) { const sp = ac.createStereoPanner(); sp.pan.value = clamp(pan, -1, 1); g.connect(sp); last = sp; }
  last.connect(audio.out);
  if (wet > 0 && audio.send) { const w = ac.createGain(); w.gain.value = wet; last.connect(w); w.connect(audio.send); }
  return g;
};
const noise = (audio, ac, t, dur) => { const s = ac.createBufferSource(); s.buffer = audio.noise(); s.loop = true; s.start(t, (seed++ * 0.47) % 1.6); s.stop(t + dur); return s; };
const filt = (ac, type, f, q = 0.7) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = clamp(f, 20, 19000); b.Q.value = q; return b; };
const ex = (x) => Math.max(0.0001, x);
const level = (p, base = 1) => base * Math.pow(clamp(p.vel ?? 0.8, 0.05, 1.2), 1.15);
function tick(audio, ac, t, out, { f, q = 2, dur = 0.02, gain = 0.3, type = 'bandpass' }) {
  const n = noise(audio, ac, t, dur + 0.04), b = filt(ac, type, f, q), g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(ex(gain), t + 0.0012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(b); b.connect(g); g.connect(out);
}

registerSynthVoice('ratchet', (audio, p, o) => {
  const { ac, t } = o, n = clamp(p.n ?? 8, 1, 30), g0 = level(p, p.gain ?? 0.3), out = bus(audio, ac, { wet: p.wet ?? 0.06, pan: p.pan ?? 0 });
  let tt = t, gap = (p.spread ?? 0.18) / Math.max(1, n - 1);
  for (let k = 0; k < n; k++) {
    const a = 1 - 0.45 * (k / n);
    tick(audio, ac, tt, out, { f: (p.f ?? 3200) * (0.96 + 0.08 * ((k * 7) % 5) / 5), q: p.q ?? 2.4, dur: p.tail ?? 0.022, gain: g0 * a });
    if (p.hollow) tick(audio, ac, tt, out, { f: p.hollow, q: 5, dur: 0.05, gain: g0 * a * 0.5 });
    tt += gap; gap *= p.accel ?? 1;
  }
  return null;
});

registerSynthVoice('strand', (audio, p, o) => {
  const { ac, t } = o, n = clamp(p.n ?? 9, 1, 24), g0 = level(p, p.gain ?? 0.2), out = bus(audio, ac, { wet: p.wet ?? 0.12, pan: p.pan ?? 0 });
  let first = null;
  for (let k = 0; k < n; k++) {
    const tt = t + (p.spread ?? 0.16) * ((k * 0.6180339) % 1) ** 1.2, f = (p.f ?? 4200) * (0.7 + 0.7 * ((k * 0.37) % 1)), a = g0 * (1 - 0.5 * (k / n));
    if (p.metal) {
      for (const [r, g, d] of [[1, 1, 1], [2.31, 0.5, 0.6], [4.1, 0.25, 0.35]]) {
        const os = ac.createOscillator(); os.type = 'sine'; os.frequency.setValueAtTime(f * r, tt); const eg = ac.createGain(), D = (p.tail ?? 0.18) * d;
        eg.gain.setValueAtTime(0.0001, tt); eg.gain.linearRampToValueAtTime(ex(a * g * 0.5), tt + 0.002); eg.gain.exponentialRampToValueAtTime(0.0001, tt + D);
        os.connect(eg); eg.connect(out); os.start(tt); os.stop(tt + D + 0.05); if (!first) first = os;
      }
    } else tick(audio, ac, tt, out, { f, q: p.q ?? 3, dur: p.tail ?? 0.05, gain: a * 1.6 });
  }
  if (first) { audio.voices = (audio.voices ?? 0) + 1; let d = false; first.addEventListener('ended', () => { if (!d) { d = true; audio.voices = Math.max(0, (audio.voices ?? 1) - 1); } }); }
  return null;
});

// ---- MARACAS: seeds inside a thin gourd shell: dry, bright, a short burst; the pair stroke is both hands together -------------------------------
defVoice('maracas-left', 'rattle', { grains: 7, spread: 0.07, f: 5600, q: 1.2, gain: 0.3, tail: 0.045, fade: 0.5 });
defVoice('maracas-right', 'rattle', { grains: 7, spread: 0.07, f: 6600, q: 1.2, gain: 0.3, tail: 0.04, fade: 0.5 });
defVoice('maracas-both', 'rattle', { grains: 14, spread: 0.2, curve: 1.3, f: 6000, q: 1.0, gain: 0.3, tail: 0.05, fade: 0.65 });

// ---- KASHAKA: a small bean-filled gourd; the spinning one gives a long whirring roll, the held one a short shake ---------------------------------
defVoice('kashaka-held', 'rattle', { grains: 5, spread: 0.05, f: 4700, q: 1.4, gain: 0.3, tail: 0.05, fade: 0.4, thump: 240, thumpGain: 0.9 });
defVoice('kashaka-spin', 'rattle', { grains: 16, spread: 0.3, curve: 1.2, f: 5200, q: 1.0, gain: 0.3, tail: 0.065, fade: 0.75 });
defVoice('kashaka-catch', 'rattle', { grains: 3, spread: 0.02, f: 3600, q: 1.8, gain: 0.34, tail: 0.04, thump: 180, thumpGain: 1.5 });

// ---- NYO: coiled fibre basket on a calabash: a soft, wide rustle; the calabash base thumps, the rim ticks -----------------------------------------
defVoice('nyo-shake', 'rattle', { grains: 10, spread: 0.14, f: 3400, q: 0.8, gain: 0.34, tail: 0.07, fade: 0.55 });
defVoice('nyo-strike', 'skin', { dur: 0.22, drop: 1.5, glide: 0.05, modes: [[1, 1, 1], [1.9, 0.35, 0.5]], click: { f: 900, gain: 0.35 }, lp: 1500, gain: 0.62 });
defVoice('nyo-tick', 'woodtok', { dur: 0.05, gain: 0.5, hollow: 1.6 });

// ---- COG RATTLE: the tongue clicks over each tooth: a quick run of wooden ticks that starts fast and slows ------------------------------------------
defVoice('cograttle-wheel', 'ratchet', { n: 16, spread: 0.3, f: 2900, q: 2.2, gain: 0.34, tail: 0.02, accel: 1.08, hollow: 210 });
defVoice('cograttle-tongue', 'ratchet', { n: 2, spread: 0.03, f: 3600, q: 3, gain: 0.46, tail: 0.02, hollow: 320 });
defVoice('cograttle-handle', 'ratchet', { n: 9, spread: 0.2, f: 2500, q: 2, gain: 0.34, tail: 0.022, accel: 1.1, hollow: 180 });

// ---- OPA: a long tube gourd, open at both ends. Beaten on the arm: a deep pitched thud; the mouth covered: a lower, softer note ---------------------
registerStrikeVoice('opa-beat', (c) => c.evoice(c.audio, 'skin', { hz: c.hz, dur: 0.34, drop: 1.4, glide: 0.06, modes: [[1, 1, 1], [2, 0.18, 0.5], [3, 0.08, 0.35]], click: { f: 700, gain: 0.35 }, shell: { f: c.hz * 2, q: 6, gain: 0.25, dur: 0.2 }, lp: 1600, gain: 0.7, vel: c.vel }));
registerStrikeVoice('opa-cover', (c) => c.evoice(c.audio, 'skin', { hz: c.hz * 0.5, dur: 0.46, drop: 1.18, glide: 0.07, modes: [[1, 1, 1], [2, 0.12, 0.5]], lp: 900, gain: 0.7, vel: c.vel }));
registerStrikeVoice('opa-open', (c) => c.evoice(c.audio, 'skin', { hz: c.hz, dur: 0.28, drop: 1.25, glide: 0.04, modes: [[1, 1, 1], [2, 0.4, 0.6], [3, 0.2, 0.4]], click: { f: 1300, gain: 0.3 }, lp: 2600, gain: 0.56, vel: c.vel }));

// ---- SCRAPERS: the length of the stroke is the number of notches it crosses; the body gives each its own colour ----------------------------------
// guiro: a hollow gourd under a stick, woody ticks over a gourd boom
defVoice('guiro-down', 'ratchet', { n: 15, spread: 0.27, f: 2300, q: 2.4, gain: 0.34, tail: 0.024, hollow: 360, accel: 1.015 });
defVoice('guiro-up', 'ratchet', { n: 10, spread: 0.17, f: 2700, q: 2.4, gain: 0.32, tail: 0.022, hollow: 400 });
defVoice('guiro-short', 'ratchet', { n: 5, spread: 0.07, f: 2900, q: 2.6, gain: 0.34, tail: 0.02, hollow: 420 });
defVoice('guiro-knock', 'woodtok', { dur: 0.08, gain: 0.55, hollow: 1.5, overtone: 2.4 });
// guira: punched steel under a stiff brush, bright and metallic with almost no body
defVoice('guira-down', 'ratchet', { n: 17, spread: 0.22, f: 6900, q: 1.5, gain: 0.3, tail: 0.016, accel: 1.0 });
defVoice('guira-up', 'ratchet', { n: 12, spread: 0.15, f: 7600, q: 1.5, gain: 0.28, tail: 0.015 });
defVoice('guira-short', 'ratchet', { n: 6, spread: 0.07, f: 8000, q: 1.6, gain: 0.3, tail: 0.014 });
defVoice('guira-knock', 'metal', { dur: 0.22, gain: 0.34, partials: [[1, 1, 1], [2.45, 0.6, 0.55], [4.6, 0.35, 0.35], [7.1, 0.2, 0.25]], hz: 1500 });
// guacharaca: fine grooves in palm-wood under a three-pronged fork, a dry, hollow rasp
defVoice('guacharaca-down', 'ratchet', { n: 22, spread: 0.3, f: 3400, q: 3, gain: 0.3, tail: 0.016, hollow: 520, accel: 1.0 });
defVoice('guacharaca-up', 'ratchet', { n: 15, spread: 0.19, f: 3700, q: 3, gain: 0.29, tail: 0.015, hollow: 560 });
defVoice('guacharaca-short', 'ratchet', { n: 7, spread: 0.08, f: 3900, q: 3, gain: 0.3, tail: 0.014, hollow: 560 });
defVoice('guacharaca-knock', 'woodtok', { dur: 0.1, gain: 0.55, hollow: 1.1, overtone: 2.1 });

// ---- STRANDS AND BANDS ----------------------------------------------------------------------------------------------------------------------------
// ekpili: halved seed shells clacking: dry, hollow, woody little clicks
defVoice('ekpili-sway', 'strand', { n: 11, f: 2300, q: 4, tail: 0.04, gain: 0.3, spread: 0.2 });
defVoice('ekpili-flick', 'strand', { n: 5, f: 2800, q: 4, tail: 0.035, gain: 0.3, spread: 0.07 });
defVoice('ekpili-clack', 'strand', { n: 16, f: 2100, q: 4, tail: 0.04, gain: 0.32, spread: 0.28 });
// yomyom: small brass pellet bells: bright, ringing; the row of bigger bells rings lower
defVoice('yomyom-high', 'strand', { n: 9, f: 5200, tail: 0.2, gain: 0.2, spread: 0.12, metal: true });
defVoice('yomyom-mid', 'strand', { n: 8, f: 3900, tail: 0.24, gain: 0.2, spread: 0.12, metal: true });
defVoice('yomyom-low', 'strand', { n: 7, f: 2800, tail: 0.3, gain: 0.22, spread: 0.12, metal: true });
// matlhowa: pebbles in silk cocoons: a dull, dry rattle; a stamp adds a soft thud of the body of the band
defVoice('matlhowa-shake', 'rattle', { grains: 11, spread: 0.16, f: 1800, q: 0.9, gain: 0.34, tail: 0.06, fade: 0.55 });
defVoice('matlhowa-stamp', 'rattle', { grains: 7, spread: 0.1, f: 1500, q: 0.9, gain: 0.34, tail: 0.07, fade: 0.5, thump: 110, thumpGain: 2.0 });
defVoice('matlhowa-flick', 'rattle', { grains: 5, spread: 0.05, f: 2200, q: 1.1, gain: 0.34, tail: 0.05, fade: 0.4 });

export { tick, bus };

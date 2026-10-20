// Synthesis recipes for the 1.11.0 hand-drum and dance stages (own synthesis only, no samples): hides, wood, metal, rattles, jingles, claps, feet.
// The stroke tables that use them live in voice-drums.js and voice-dance.js (defVoice(kind, recipe, params) binds a stroke kind to a recipe).
// WebAudio only; silent without a running AudioContext; never touches Math.random or the clock (noise grains come from audio.noise()).
// The recipes are small and parameterised; each stage's strokes are rows in the tables at the bottom (kind name -> recipe + parameters).
import { registerStrikeVoice, registerSynthVoice } from './voice-registry.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
let seed = 0;

function open(audio, p) {
  if (!audio || audio.muted) return null;
  const ac = audio.context;
  if (!ac || (ac.state !== 'running' && !audio.forceRun) || (audio.voices ?? 0) > 30 || !audio.out) return null;
  return { ac, t: ac.currentTime + Math.max(0, p.delay ?? 0) + 0.005 };
}
const bus = (audio, ac, { pan = 0, wet = 0.1 } = {}) => {
  const g = ac.createGain(); let last = g;
  if (pan && ac.createStereoPanner) { const sp = ac.createStereoPanner(); sp.pan.value = clamp(pan, -1, 1); g.connect(sp); last = sp; }
  last.connect(audio.out);
  if (wet > 0 && audio.send) { const w = ac.createGain(); w.gain.value = wet; last.connect(w); w.connect(audio.send); }
  return g;
};
const track = (audio, src) => { audio.voices = (audio.voices ?? 0) + 1; let d = false; src.addEventListener('ended', () => { if (!d) { d = true; audio.voices = Math.max(0, (audio.voices ?? 1) - 1); } }); };
const osc = (ac, type, hz, t, dur) => { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(hz, t); o.start(t); o.stop(t + dur); return o; };
const noise = (audio, ac, t, dur) => { const s = ac.createBufferSource(); s.buffer = audio.noise(); s.loop = true; s.start(t, (seed++ * 0.43) % 1.6); s.stop(t + dur); return s; };
const filt = (ac, type, f, q = 0.7) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = clamp(f, 20, 19000); b.Q.value = q; return b; };
const ex = (x) => Math.max(0.0001, x);
const level = (p, base = 1) => base * Math.pow(clamp(p.vel ?? 0.8, 0.05, 1.2), 1.15);
// a short noise burst through a band: the click of a stroke, the grain of a rattle, the slap of a hand
function burst(audio, ac, t, out, { f = 3000, q = 1, type = 'bandpass', dur = 0.03, gain = 0.3, attack = 0.001, f2 = 0 }) {
  const n = noise(audio, ac, t, dur + 0.05), b = filt(ac, type, f, q), g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(ex(gain), t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(b);
  if (f2) { const b2 = filt(ac, 'lowpass', f2, 0.7); b.connect(b2); b2.connect(g); } else b.connect(g);
  g.connect(out);
}

// ---- membrane (skin heads): inharmonic or harmonic partials with a pitch fall (or rise), a stick/hand click and a shell resonance ----
// p: hz, dur, vel, gain; modes [[ratio, gain, decayScale]]; drop (start pitch ratio, falls to 1 in `glide` s), rise (start below, rises);
//    click { f, q, gain, dur } ; shell { f, q, gain, dur } ; lp (low-pass of the sum); wet; pan
registerSynthVoice('skin', (audio, p, o) => {
  const { ac, t } = o, hz = clamp(p.hz, 35, 2400), D = clamp(p.dur ?? 0.4, 0.04, 3), g0 = level(p, p.gain ?? 0.5);
  const out = bus(audio, ac, { wet: p.wet ?? 0.1, pan: p.pan ?? 0 }), sum = ac.createGain(), lp = filt(ac, 'lowpass', p.lp ?? 9000, 0.6);
  sum.connect(lp); lp.connect(out);
  const modes = p.modes ?? [[1, 1, 1]], norm = 1 / Math.sqrt(modes.reduce((a, m) => a + m[1] * m[1], 0));
  let first = null;
  for (const [r, g, dk] of modes) {
    const f = hz * r, os = ac.createOscillator(); os.type = 'sine';
    const f0 = p.fromHz ? f * clamp(p.fromHz / hz, 0.3, 3) : p.rise ? f * p.rise : f * (p.drop ?? 1.25);
    os.frequency.setValueAtTime(f0, t); os.frequency.exponentialRampToValueAtTime(f, t + (p.glide ?? 0.045));
    const eg = ac.createGain(), Dm = D * dk;
    eg.gain.setValueAtTime(0.0001, t); eg.gain.linearRampToValueAtTime(ex(g0 * g * norm * 1.6), t + (p.attack ?? 0.002)); eg.gain.exponentialRampToValueAtTime(0.0001, t + Dm);
    os.connect(eg); eg.connect(sum); os.start(t); os.stop(t + Dm + 0.05);
    if (!first) first = os;
  }
  if (p.click) burst(audio, ac, t, sum, { f: p.click.f ?? 3000, q: p.click.q ?? 1.2, dur: p.click.dur ?? 0.025, gain: g0 * (p.click.gain ?? 0.5) });
  if (p.shell) burst(audio, ac, t, sum, { f: p.shell.f ?? 300, q: p.shell.q ?? 6, dur: p.shell.dur ?? 0.12, gain: g0 * (p.shell.gain ?? 0.4), attack: 0.002 });
  if (p.buzz) { // snare wires or a buzzing membrane: noise that follows the hit
    const n = noise(audio, ac, t, (p.buzz.dur ?? 0.2) + 0.05), hp = filt(ac, 'highpass', p.buzz.f ?? 4200, 0.7), g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(ex(g0 * (p.buzz.gain ?? 0.3)), t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + (p.buzz.dur ?? 0.2));
    n.connect(hp); hp.connect(g); g.connect(out);
  }
  track(audio, first);
  return null;
});

// ---- struck wood or bamboo: a short hollow resonance plus a click ---------------------------------------------------------------------
// p: hz, dur, vel; hollow (Q of the tube); overtone (ratio); gain
registerSynthVoice('woodtok', (audio, p, o) => {
  const { ac, t } = o, hz = clamp(p.hz, 150, 3500), D = clamp(p.dur ?? 0.09, 0.02, 0.5), g0 = level(p, p.gain ?? 0.5);
  const out = bus(audio, ac, { wet: p.wet ?? 0.08, pan: p.pan ?? 0 }), env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(ex(g0), t + 0.001); env.gain.exponentialRampToValueAtTime(0.0001, t + D);
  const a = osc(ac, 'sine', hz, t, D + 0.03), b = osc(ac, 'triangle', hz * (p.overtone ?? 2.76), t, D * 0.6 + 0.03), gb = ac.createGain(); gb.gain.value = 0.32;
  a.frequency.setValueAtTime(hz * 1.04, t); a.frequency.exponentialRampToValueAtTime(hz, t + 0.012);
  a.connect(env); b.connect(gb); gb.connect(env); env.connect(out);
  burst(audio, ac, t, out, { f: hz * 3.2, q: p.hollow ?? 1.4, dur: 0.018, gain: g0 * 0.7 });
  track(audio, a);
  return null;
});

// ---- metal: struck bell, gong, jingle disc: inharmonic partials (ratios) with their own decays ---------------------------------------------
// p: hz, dur, vel; partials [[ratio, gain, decayScale]]; wobble (Hz of the beating of a big gong); strike (click gain)
registerSynthVoice('metal', (audio, p, o) => {
  const { ac, t } = o, hz = clamp(p.hz, 120, 6000), D = clamp(p.dur ?? 0.8, 0.05, 4), g0 = level(p, p.gain ?? 0.3);
  const out = bus(audio, ac, { wet: p.wet ?? 0.16, pan: p.pan ?? 0 }), sum = ac.createGain();
  const parts = p.partials ?? [[1, 1, 1], [2.76, 0.5, 0.6], [5.4, 0.3, 0.4], [8.9, 0.15, 0.25]], norm = 1 / Math.sqrt(parts.reduce((a, m) => a + m[1] * m[1], 0));
  let first = null;
  parts.forEach(([r, g, dk], k) => {
    const os = ac.createOscillator(); os.type = 'sine'; os.frequency.setValueAtTime(hz * r * (p.bend ?? 1), t); if (p.bend) os.frequency.exponentialRampToValueAtTime(hz * r, t + 0.25);
    if (p.wobble && k < 2) { const lf = osc(ac, 'sine', p.wobble * (k + 1), t, D * dk + 0.1), lg = ac.createGain(); lg.gain.value = hz * r * 0.004; lf.connect(lg); lg.connect(os.frequency); }
    const eg = ac.createGain(), Dm = D * dk;
    eg.gain.setValueAtTime(0.0001, t); eg.gain.linearRampToValueAtTime(ex(g0 * g * norm * 1.5), t + (p.attack ?? 0.002)); eg.gain.exponentialRampToValueAtTime(0.0001, t + Dm);
    os.connect(eg); eg.connect(sum); os.start(t); os.stop(t + Dm + 0.05); if (!first) first = os;
  });
  sum.connect(out);
  if (p.strike !== 0) burst(audio, ac, t, out, { f: p.strikeF ?? hz * 3, q: 1.5, dur: 0.02, gain: g0 * (p.strike ?? 0.5) });
  track(audio, first);
  return null;
});

// ---- rattle: a handful of grains of filtered noise (seeds, beads, jingles) -----------------------------------------------------------------
// p: vel, grains, spread (s), f (band centre), q, hp, gain, tail (s per grain)
registerSynthVoice('rattle', (audio, p, o) => {
  const { ac, t } = o, n = clamp(p.grains ?? 5, 1, 16), g0 = level(p, p.gain ?? 0.2), out = bus(audio, ac, { wet: p.wet ?? 0.08, pan: p.pan ?? 0 });
  for (let k = 0; k < n; k++) {
    const tt = t + (p.spread ?? 0.1) * (k / Math.max(1, n - 1)) ** (p.curve ?? 1), a = 1 - (p.fade ?? 0.5) * (k / n);
    burst(audio, ac, tt, out, { f: (p.f ?? 5200) * (0.85 + 0.3 * ((k * 37) % 11) / 11), q: p.q ?? 1.3, type: 'bandpass', dur: p.tail ?? 0.05, gain: g0 * a, attack: 0.003 });
  }
  if (p.thump) { // a palm on the gourd: a low soft tap under the beads
    const os = osc(ac, 'sine', p.thump, t, 0.2), eg = ac.createGain(); os.frequency.exponentialRampToValueAtTime(p.thump * 0.7, t + 0.12);
    eg.gain.setValueAtTime(0.0001, t); eg.gain.linearRampToValueAtTime(ex(g0 * (p.thumpGain ?? 1.6)), t + 0.004); eg.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); os.connect(eg); eg.connect(out); track(audio, os);
  }
  return null;
});

// ---- jingles: pairs of small brass discs (platinelas, zils, cymbal pairs) clashing a little after the stroke ---------------------------------------------
// p: vel, n (discs), f (pitch of the brightest disc), spread (s), dur, gain
registerSynthVoice('jingle', (audio, p, o) => {
  const { ac, t } = o, n = clamp(p.n ?? 5, 1, 12), g0 = level(p, p.gain ?? 0.16), f = clamp(p.f ?? 3600, 800, 9000), out = bus(audio, ac, { wet: p.wet ?? 0.14, pan: p.pan ?? 0 });
  let first = null;
  for (let k = 0; k < n; k++) {
    const tt = t + (p.spread ?? 0.05) * ((k * 0.618) % 1), fk = f * (0.78 + 0.5 * ((k * 0.37) % 1)), Dk = (p.dur ?? 0.16) * (0.7 + 0.5 * ((k * 0.53) % 1));
    for (const [r, g, dk] of [[1, 1, 1], [2.34, 0.55, 0.6], [3.87, 0.3, 0.4]]) {
      const os = ac.createOscillator(); os.type = 'sine'; os.frequency.setValueAtTime(fk * r, tt); const eg = ac.createGain();
      eg.gain.setValueAtTime(0.0001, tt); eg.gain.linearRampToValueAtTime(ex(g0 * g * (1 - k / (n * 1.6))), tt + 0.002); eg.gain.exponentialRampToValueAtTime(0.0001, tt + Dk * dk);
      os.connect(eg); eg.connect(out); os.start(tt); os.stop(tt + Dk * dk + 0.05); if (!first) first = os;
    }
  }
  burst(audio, ac, t, out, { f: 8200, q: 0.8, type: 'highpass', dur: 0.03, gain: g0 * 0.5 });
  track(audio, first);
  return null;
});

// ---- hands: claps (sorda: hollow cupped palms, clara: flat sharp slap), finger snap -----------------------------------------------------------
registerSynthVoice('clap', (audio, p, o) => {
  const { ac, t } = o, g0 = level(p, p.gain ?? 0.5), out = bus(audio, ac, { wet: p.wet ?? 0.12, pan: p.pan ?? 0 });
  const kind = p.style ?? 'clara';
  if (kind === 'snap') {   // fingers against the palm: a tiny sharp pop
    burst(audio, ac, t, out, { f: 2400, q: 3.5, dur: 0.035, gain: g0 * 0.9 });
    const os = osc(ac, 'sine', 1500, t, 0.05), eg = ac.createGain(); os.frequency.exponentialRampToValueAtTime(700, t + 0.03); eg.gain.setValueAtTime(ex(g0 * 0.5), t); eg.gain.exponentialRampToValueAtTime(0.0001, t + 0.04); os.connect(eg); eg.connect(out); track(audio, os);
    return null;
  }
  const hollow = kind === 'sorda';
  // two or three micro-contacts a few ms apart (the fingers land first, then the palm)
  [[0, 0.7], [0.006, 1], [0.013, 0.5]].forEach(([dt, a], k) => burst(audio, ac, t + dt, out, { f: hollow ? 900 + 160 * k : 2300 + 400 * k, q: hollow ? 1.1 : 1.6, dur: hollow ? 0.06 : 0.028, gain: g0 * a * (hollow ? 0.9 : 0.8) }));
  if (hollow) { const os = osc(ac, 'sine', 420, t, 0.12), eg = ac.createGain(); os.frequency.exponentialRampToValueAtTime(300, t + 0.08); eg.gain.setValueAtTime(ex(g0 * 0.45), t); eg.gain.exponentialRampToValueAtTime(0.0001, t + 0.1); os.connect(eg); eg.connect(out); track(audio, os); }
  else burst(audio, ac, t + 0.004, out, { f: 5200, q: 0.9, dur: 0.02, gain: g0 * 0.45, type: 'highpass' });
  return null;
});

// ---- feet: a stamp or a hop: low body, a floor tick, and the shoe or bare skin ---------------------------------------------------------------
// p: hz, vel; floor ('wood' | 'earth' | 'stone'), shoe ('hard' | 'soft' | 'bare'), bells (ankle bells), dur
registerSynthVoice('foot', (audio, p, o) => {
  const { ac, t } = o, g0 = level(p, p.gain ?? 0.5), hz = clamp(p.hz ?? 90, 40, 300), D = clamp(p.dur ?? 0.16, 0.05, 0.5), out = bus(audio, ac, { wet: p.wet ?? 0.1, pan: p.pan ?? 0 });
  const floor = p.floor ?? 'wood', shoe = p.shoe ?? 'hard';
  const os = osc(ac, 'sine', hz * 1.6, t, D + 0.05), eg = ac.createGain();
  os.frequency.exponentialRampToValueAtTime(hz, t + 0.05);
  eg.gain.setValueAtTime(0.0001, t); eg.gain.linearRampToValueAtTime(ex(g0 * (floor === 'earth' ? 0.7 : 1)), t + 0.003); eg.gain.exponentialRampToValueAtTime(0.0001, t + D * (floor === 'earth' ? 0.7 : 1));
  os.connect(eg); eg.connect(out);
  burst(audio, ac, t, out, shoe === 'hard' ? { f: floor === 'stone' ? 3600 : 2400, q: 1.2, dur: 0.03, gain: g0 * 0.75 } : shoe === 'bare' ? { f: 700, q: 0.8, dur: 0.05, gain: g0 * 0.45 } : { f: 1300, q: 0.9, dur: 0.04, gain: g0 * 0.5 });
  if (floor === 'wood') burst(audio, ac, t, out, { f: 190, q: 7, dur: 0.14, gain: g0 * 0.4, attack: 0.002 });   // the boards ring a little under the heel
  if (p.bells) for (let k = 0; k < 7; k++) burst(audio, ac, t + 0.004 + k * 0.011, out, { f: 4300 + 380 * k, q: 6, dur: 0.07, gain: g0 * 0.22 * (1 - k / 9), attack: 0.002 });
  track(audio, os);
  return null;
});

// ---- cloth, ribbon, hankie, a swish of fabric: a band of noise that sweeps ---------------------------------------------------------------------
registerSynthVoice('swish', (audio, p, o) => {
  const { ac, t } = o, g0 = level(p, p.gain ?? 0.2), D = clamp(p.dur ?? 0.2, 0.05, 0.8), out = bus(audio, ac, { wet: 0.06, pan: p.pan ?? 0 });
  const n = noise(audio, ac, t, D + 0.05), b = filt(ac, 'bandpass', p.f0 ?? 1800, 0.9), g = ac.createGain();
  b.frequency.setValueAtTime(p.f0 ?? 1800, t); b.frequency.exponentialRampToValueAtTime(p.f1 ?? 4200, t + D);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(ex(g0), t + D * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + D);
  n.connect(b); b.connect(g); g.connect(out); track(audio, n);
  return null;
});


// bind a stroke kind (returned by a stage's voiceOf) to a recipe with parameters; the lane pitch is the default `hz`
export function defVoice(kind, recipe, params = {}) {
  registerStrikeVoice(kind, (c) => c.evoice(c.audio, recipe, { ...params, hz: params.hz ?? c.hz, vel: c.vel * (params.vel ?? 1) }));
}

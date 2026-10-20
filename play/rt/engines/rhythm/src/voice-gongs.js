// Voices for the 1.21.0 gong, chime, bell and novelty stages. Own synthesis, no samples; silent without a running AudioContext; no Math.random and no clock
// (noise grains come from audio.noise()). Recipes (used through `evoice(audio, kind, p)`):
//   `bronze`  struck metal with free low pitch (30 Hz up): inharmonic partials, a detuned twin that makes the slow beat of a real gong, an optional pitch
//             bend and a soft swell. p: hz, dur, partials [[ratio, gain, decay]], beat (Hz), bend (start ratio), swell (s), click, gain, wet
//   `glassring` a rubbed glass rim: a slow swell, a pure tone with a few faint partials and a shimmer, held for the note length. p: hz, dur, swell, shimmer, gain
//   `sawsong`  a bowed saw blade: a wavering breathy tone that slides into the note. p: hz, dur, slide, vib, gain
// plus a table of stroke kinds (`gx-*`) that bind a recipe and its parameters to a lane of one of the stages.
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
const bus = (audio, ac, { pan = 0, wet = 0.14 } = {}) => {
  const g = ac.createGain(); let last = g;
  if (pan && ac.createStereoPanner) { const sp = ac.createStereoPanner(); sp.pan.value = clamp(pan, -1, 1); g.connect(sp); last = sp; }
  last.connect(audio.out);
  if (wet > 0 && audio.send) { const w = ac.createGain(); w.gain.value = wet; last.connect(w); w.connect(audio.send); }
  return g;
};
const track = (audio, src) => { audio.voices = (audio.voices ?? 0) + 1; let d = false; src.addEventListener('ended', () => { if (!d) { d = true; audio.voices = Math.max(0, (audio.voices ?? 1) - 1); } }); };
const ex = (x) => Math.max(0.0001, x);
const level = (p, base = 1) => base * Math.pow(clamp(p.vel ?? 0.8, 0.05, 1.2), 1.15);
const filt = (ac, type, f, q = 0.7) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = clamp(f, 20, 19000); b.Q.value = q; return b; };
const noise = (audio, ac, t, dur) => { const s = ac.createBufferSource(); s.buffer = audio.noise(); s.loop = true; s.start(t, (seed++ * 0.41) % 1.6); s.stop(t + dur); return s; };
function burst(audio, ac, t, out, { f = 3000, q = 1, type = 'bandpass', dur = 0.03, gain = 0.3 }) {
  const n = noise(audio, ac, t, dur + 0.05), b = filt(ac, type, f, q), g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(ex(gain), t + 0.001); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(b); b.connect(g); g.connect(out);
}

registerSynthVoice('bronze', (audio, p, o) => {
  const { ac, t } = o, hz = clamp(p.hz, 30, 4200), D = clamp(p.dur ?? 1.4, 0.05, 6), g0 = level(p, p.gain ?? 0.3);
  const out = bus(audio, ac, { wet: p.wet ?? 0.18, pan: p.pan ?? 0 }), sum = ac.createGain(), lp = filt(ac, 'lowpass', p.lp ?? 9000, 0.5);
  sum.connect(lp); lp.connect(out);
  const parts = p.partials ?? [[1, 1, 1], [2.02, 0.5, 0.7], [2.97, 0.4, 0.6], [4.2, 0.25, 0.4], [5.6, 0.18, 0.3]], norm = 1 / Math.sqrt(parts.reduce((a, m) => a + m[1] * m[1], 0)), sw = p.swell ?? 0.003;
  let first = null;
  parts.forEach(([r, g, dk], k) => {
    for (const twin of (p.beat ? [0, 1] : [0])) {
      const f = hz * r + twin * (p.beat ?? 0) * (1 + 0.3 * k), os = ac.createOscillator(); os.type = 'sine';
      if (p.bend) { os.frequency.setValueAtTime(f * p.bend, t); os.frequency.exponentialRampToValueAtTime(f, t + (p.bendT ?? 0.18)); } else os.frequency.setValueAtTime(f, t);
      const eg = ac.createGain(), Dm = D * dk;
      eg.gain.setValueAtTime(0.0001, t); eg.gain.linearRampToValueAtTime(ex(g0 * g * norm * (p.beat ? 0.9 : 1.5)), t + sw); eg.gain.exponentialRampToValueAtTime(0.0001, t + Dm);
      os.connect(eg); eg.connect(sum); os.start(t); os.stop(t + Dm + 0.05); if (!first) first = os;
    }
  });
  if (p.click) burst(audio, ac, t, out, { f: p.click.f ?? hz * 3, q: p.click.q ?? 1.2, dur: p.click.dur ?? 0.03, gain: g0 * (p.click.gain ?? 0.4) });
  track(audio, first);
  return null;
});

registerSynthVoice('glassring', (audio, p, o) => {
  const { ac, t } = o, hz = clamp(p.hz, 120, 4000), D = clamp(p.dur ?? 1.0, 0.3, 4), g0 = level(p, p.gain ?? 0.3), sw = p.swell ?? 0.16;
  const out = bus(audio, ac, { wet: p.wet ?? 0.22, pan: p.pan ?? 0 }), env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(ex(g0), t + sw); env.gain.setValueAtTime(ex(g0 * 0.92), t + Math.max(sw + 0.01, D * 0.7)); env.gain.exponentialRampToValueAtTime(0.0001, t + D + 0.45);
  const sum = ac.createGain(); sum.connect(env); env.connect(out);
  let first = null;
  for (const [r, g] of [[1, 1], [2.0, 0.12], [3.0, 0.05], [2.756, 0.07]]) {
    for (const d of [0, (p.shimmer ?? 1.6) * (r > 1 ? 1.5 : 1)]) {
      const os = ac.createOscillator(); os.type = 'sine'; os.frequency.setValueAtTime(hz * r + d, t); const gg = ac.createGain(); gg.gain.value = g * (d ? 0.5 : 1);
      os.connect(gg); gg.connect(sum); os.start(t); os.stop(t + D + 0.6); if (!first) first = os;
    }
  }
  const lf = ac.createOscillator(); lf.frequency.value = 5.2; const lg = ac.createGain(); lg.gain.value = 0.06; lf.connect(lg); lg.connect(env.gain); lf.start(t); lf.stop(t + D + 0.6);
  burst(audio, ac, t, sum, { f: hz * 5, q: 3, type: 'bandpass', dur: 0.12, gain: 0.02 });   // the faint squeak of a wet finger
  track(audio, first);
  return { cut() { try { env.gain.cancelScheduledValues(ac.currentTime); env.gain.setValueAtTime(Math.max(0.0001, env.gain.value), ac.currentTime); env.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.12); } catch { /* done */ } } };
});

registerSynthVoice('sawsong', (audio, p, o) => {
  const { ac, t } = o, hz = clamp(p.hz, 150, 2200), D = clamp(p.dur ?? 0.8, 0.2, 4), g0 = level(p, p.gain ?? 0.2), out = bus(audio, ac, { wet: p.wet ?? 0.3 });
  const env = ac.createGain(); env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(ex(g0), t + 0.12); env.gain.setValueAtTime(ex(g0), t + Math.max(0.14, D - 0.1)); env.gain.exponentialRampToValueAtTime(0.0001, t + D + 0.25);
  const s1 = ac.createOscillator(); s1.type = 'triangle'; const s2 = ac.createOscillator(); s2.type = 'sine';
  const f0 = hz * (p.slide ?? 0.94); s1.frequency.setValueAtTime(f0, t); s1.frequency.exponentialRampToValueAtTime(hz, t + 0.14); s2.frequency.setValueAtTime(f0 * 2, t); s2.frequency.exponentialRampToValueAtTime(hz * 2, t + 0.14);
  const lf = ac.createOscillator(); lf.frequency.value = p.vibHz ?? 5.6; const lg = ac.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(hz * (p.vib ?? 0.012), t + 0.4); lf.connect(lg); lg.connect(s1.frequency); lg.connect(s2.frequency);
  const g2 = ac.createGain(); g2.gain.value = 0.28; const sum = ac.createGain(); s1.connect(sum); s2.connect(g2); g2.connect(sum);
  const bp = filt(ac, 'peaking', hz * 2.2, 1.2); bp.gain.value = 5; sum.connect(bp); bp.connect(env); env.connect(out);
  const n = noise(audio, ac, t, D + 0.4), nb = filt(ac, 'bandpass', hz * 3, 2), ng = ac.createGain(); ng.gain.value = 0.015; n.connect(nb); nb.connect(ng); ng.connect(env);
  for (const q of [s1, s2, lf]) { q.start(t); q.stop(t + D + 0.5); }
  track(audio, s1);
  return { cut() { try { env.gain.cancelScheduledValues(ac.currentTime); env.gain.setValueAtTime(Math.max(0.0001, env.gain.value), ac.currentTime); env.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.09); } catch { /* done */ } } };
});

// ---- stroke kinds: a bronze row per gong stage, struck with a padded beater ---------------------------------------------------------------------------
const bronze = (kind, p, { mono = false } = {}) => registerStrikeVoice(kind, (c) => c.evoice(c.audio, 'bronze', { ...p, hz: (p.mul ?? 1) * c.hz, vel: c.vel }), { mono });
const PAD = { f: 900, q: 0.8, dur: 0.05, gain: 0.35 };
// gong ageng: huge, low, slow to speak, a long beating tail
bronze('gx-ageng-boss', { dur: 4.2, swell: 0.02, beat: 1.3, bend: 1.02, bendT: 0.5, gain: 0.3, wet: 0.24, partials: [[1, 1, 1], [2.0, 0.55, 0.75], [2.97, 0.42, 0.6], [4.15, 0.25, 0.45], [5.6, 0.16, 0.3]], click: PAD });
bronze('gx-ageng-face', { dur: 3.0, swell: 0.012, beat: 1.8, gain: 0.3, wet: 0.2, partials: [[1, 0.7, 0.8], [2.0, 0.6, 0.8], [3.4, 0.5, 0.6], [4.8, 0.3, 0.4], [6.3, 0.18, 0.3]], click: PAD });
bronze('gx-ageng-rim', { dur: 1.6, gain: 0.34, beat: 3, wet: 0.16, partials: [[1, 0.5, 0.6], [2.5, 0.7, 0.8], [4.2, 0.6, 0.6], [6.4, 0.4, 0.4], [8.5, 0.25, 0.3]], click: { f: 3000, q: 1, dur: 0.03, gain: 0.5 } });
// bonang: kettle gongs, bright and short-lived, a hard-padded beater
bronze('gx-bonang', { dur: 1.5, beat: 0.9, gain: 0.34, wet: 0.16, partials: [[1, 1, 1], [1.5, 0.25, 0.5], [2.33, 0.4, 0.6], [3.9, 0.22, 0.35]], click: { f: 2400, q: 1, dur: 0.03, gain: 0.45 } });
// reyong: brighter and drier, the shimmer of a Balinese kettle
bronze('gx-reyong', { dur: 1.1, beat: 5.5, gain: 0.32, wet: 0.12, partials: [[1, 1, 1], [2.41, 0.5, 0.55], [4.1, 0.32, 0.4], [6.2, 0.2, 0.3]], click: { f: 3600, q: 1.3, dur: 0.025, gain: 0.5 } });
bronze('gx-reyong-damp', { dur: 0.16, beat: 0, gain: 0.3, wet: 0.05, partials: [[1, 1, 1], [2.41, 0.4, 0.8]], click: { f: 3000, q: 1, dur: 0.03, gain: 0.7 } });
// kyi waing: small tuned gongs in a ring, round and woody-bright
bronze('gx-circle', { dur: 1.0, beat: 1.4, gain: 0.34, wet: 0.2, partials: [[1, 1, 1], [2.2, 0.4, 0.6], [3.4, 0.3, 0.4], [5.2, 0.15, 0.3]], click: { f: 2200, q: 1, dur: 0.03, gain: 0.4 } });
// bianzhong: a bronze bell hung by its loop: a deep hum, an inharmonic crown of partials and a slow beat
bronze('gx-bianzhong', { dur: 2.4, swell: 0.004, beat: 1.1, gain: 0.4, wet: 0.2, partials: [[1, 1, 1], [1.2, 0.3, 0.7], [2.4, 0.45, 0.6], [3.55, 0.3, 0.45], [5.1, 0.2, 0.3]], click: { f: 1500, q: 1, dur: 0.04, gain: 0.45 } });
// pyeongyeong: stone struck with a horn mallet: a clear, short, high ring and a dry knock
bronze('gx-stone', { dur: 1.0, beat: 0, gain: 0.36, wet: 0.14, partials: [[1, 1, 1], [2.76, 0.22, 0.4], [5.4, 0.1, 0.25]], click: { f: 4200, q: 1.5, dur: 0.02, gain: 0.7 } });
// yunluo: small flat brass gongs, bright and quick
bronze('gx-yunluo', { dur: 1.2, beat: 4, gain: 0.34, wet: 0.16, partials: [[1, 1, 1], [2.32, 0.5, 0.6], [3.9, 0.32, 0.4], [5.8, 0.18, 0.3]], click: { f: 3400, q: 1.2, dur: 0.025, gain: 0.5 } });

// gankogui: forged iron bells struck with a stick: a bright, dry ring with an iron edge; the lip gives a short hard tick
const IRON = [[1, 1, 1], [2.76, 0.6, 0.5], [5.4, 0.4, 0.35], [8.0, 0.25, 0.25]];
bronze('gx-gankogui-lo', { dur: 0.75, beat: 0, gain: 0.42, wet: 0.1, partials: IRON, click: { f: 3200, q: 1.5, dur: 0.02, gain: 0.7 } });
bronze('gx-gankogui-hi', { dur: 0.6, beat: 0, gain: 0.4, wet: 0.1, partials: IRON, click: { f: 4200, q: 1.5, dur: 0.02, gain: 0.7 } });
bronze('gx-gankogui-loe', { dur: 0.2, beat: 0, gain: 0.36, wet: 0.06, mul: 1.5, partials: [[1, 1, 1], [2.4, 0.6, 0.6], [4.9, 0.4, 0.4]], click: { f: 5200, q: 1.5, dur: 0.02, gain: 0.8 } });
bronze('gx-gankogui-hie', { dur: 0.18, beat: 0, gain: 0.36, wet: 0.06, mul: 1.5, partials: [[1, 1, 1], [2.4, 0.6, 0.6], [4.9, 0.4, 0.4]], click: { f: 6200, q: 1.5, dur: 0.02, gain: 0.8 } });
// skrabalai: a wooden box struck on its side, a hollow knock that rings a moment with the clapper
defVoice('gx-skrabalai', 'woodtok', { dur: 0.17, hollow: 3, overtone: 2.4, gain: 0.7, wet: 0.12 });
// handbell: a cast brass bell rung by a swing: a bright strike over a long ringing tail
bronze('gx-handbell', { dur: 2.6, swell: 0.002, beat: 0.9, gain: 0.34, wet: 0.2, partials: [[1, 1, 1], [2.0, 0.55, 0.7], [2.76, 0.3, 0.5], [4.17, 0.22, 0.35], [5.4, 0.12, 0.25]], click: { f: 4000, q: 1.2, dur: 0.02, gain: 0.5 } });

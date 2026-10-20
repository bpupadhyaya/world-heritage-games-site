// Voices for the 1.10.0 string stages (own synthesis only, no samples). Most kinds are tuned recipes of the shared engine-kit string and bow
// voices (their `preset` override: decay, brightness, pluck position, body resonances; bow formants, vibrato, noise) with small layers on
// top (a drum-head knock, a sympathetic ring, a doubled course). The jaw harp, berimbau buzz, caxixi and band instruments are engine-local
// WebAudio recipes. Everything stays silent without a running AudioContext and never uses Math.random or the clock.
import { registerStrikeVoice, registerSynthVoice } from './voice-registry.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const cents = (hz, c) => hz * 2 ** (c / 1200);
let seed = 0;

// ---- tiny WebAudio helpers (same plumbing rules as voices.js) -------------------------------------------------------------------
function open(audio, p) {
  if (!audio || audio.muted) return null;
  const ac = audio.context;
  if (!ac || (ac.state !== 'running' && !audio.forceRun) || (audio.voices ?? 0) > 30 || !audio.out) return null;
  return { ac, t: ac.currentTime + Math.max(0, p.delay ?? 0) + 0.005 };
}
const bus = (audio, ac, { pan = 0, wet = 0.12 } = {}) => {
  const g = ac.createGain(); let last = g;
  if (pan && ac.createStereoPanner) { const sp = ac.createStereoPanner(); sp.pan.value = clamp(pan, -1, 1); g.connect(sp); last = sp; }
  last.connect(audio.out);
  if (wet > 0 && audio.send) { const w = ac.createGain(); w.gain.value = wet; last.connect(w); w.connect(audio.send); }
  return g;
};
const track = (audio, src) => { audio.voices = (audio.voices ?? 0) + 1; let d = false; src.addEventListener('ended', () => { if (!d) { d = true; audio.voices = Math.max(0, (audio.voices ?? 1) - 1); } }); };
const osc = (ac, type, hz, t, dur) => { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(hz, t); o.start(t); o.stop(t + dur); return o; };
const noise = (audio, ac, t, dur) => { const s = ac.createBufferSource(); s.buffer = audio.noise(); s.loop = true; s.start(t, (seed++ * 0.41) % 1.6); s.stop(t + dur); return s; };
const filt = (ac, type, f, q = 0.7, gain = 0) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = clamp(f, 20, 18000); b.Q.value = q; b.gain.value = gain; return b; };
const level = (p, base = 1) => base * Math.pow(clamp(p.vel ?? 0.8, 0.05, 1.2), 1.15);
const ex = (x) => Math.max(0.0001, x);
const cutter = (ac, g, peak, until) => ({ cut(at = ac.currentTime) { try { const t = Math.max(at, ac.currentTime); if (t > until) return; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value || peak), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); } catch { /* ended */ } } });

// ---- jaw harp: a buzzing tongue at the fundamental, one harmonic picked out by the mouth's resonance ----------------------------
// p: hz (the harmonic the mouth selects), f0 (the tongue's pitch), dur, vel, tone ('iron' dull and heavy | 'steel' bright and thin)
registerSynthVoice('jaw', (audio, p, o) => {
  const { ac, t } = o, steel = p.tone === 'steel', f0 = clamp(p.f0 ?? p.hz / 6, 60, 400), hz = clamp(p.hz, 120, 3600), D = clamp(p.dur ?? 0.7, 0.2, 2.2), g0 = level(p, 0.2);
  const out = bus(audio, ac, { wet: 0.14 }), env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(ex(g0), t + 0.012); env.gain.setValueAtTime(ex(g0 * 0.9), t + D * 0.45); env.gain.exponentialRampToValueAtTime(0.0001, t + D + 0.18);
  const src = ac.createGain(), s1 = osc(ac, 'sawtooth', f0, t, D + 0.3), s2 = osc(ac, 'square', f0 * 1.003, t, D + 0.3), g2 = ac.createGain(); g2.gain.value = steel ? 0.25 : 0.5;
  s1.connect(src); s2.connect(g2); g2.connect(src);
  // the tongue's pitch drifts down a hair as it dies; the buzz has a light wobble (the lips)
  s1.frequency.exponentialRampToValueAtTime(f0 * 0.996, t + D); s2.frequency.exponentialRampToValueAtTime(f0 * 0.999, t + D);
  const sum = ac.createGain();
  const n = Math.max(1, Math.round(hz / f0)), pick = n * f0;
  for (const [f, q, gn] of [[pick, steel ? 22 : 14, 5.4], [pick * 2, 18, 1.2], [f0 * 2, 6, 0.55]]) { const bp = filt(ac, 'bandpass', f, q), gg = ac.createGain(); gg.gain.value = gn; src.connect(bp); bp.connect(gg); gg.connect(sum); }
  const body = filt(ac, 'lowpass', steel ? 900 : 600, 0.8), gb = ac.createGain(); gb.gain.value = 0.28; src.connect(body); body.connect(gb); gb.connect(sum);
  sum.connect(env); env.connect(out);
  // the pluck: a click as the tongue is released
  const nz = noise(audio, ac, t, 0.04), nf = filt(ac, 'bandpass', steel ? 3400 : 2200, 1.4), ng = ac.createGain(); ng.gain.setValueAtTime(ex(g0 * 0.9), t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.03); nz.connect(nf); nf.connect(ng); ng.connect(out);
  track(audio, s1);
  return cutter(ac, env, g0, t + D);
});
for (const [kind, tone] of [['jawharp-iron', 'iron'], ['jawharp-steel', 'steel']]) {
  registerStrikeVoice(kind, (c) => c.evoice(c.audio, 'jaw', { hz: c.hz, f0: c.P.root, tone, vel: c.vel, dur: Math.max(0.5, c.dur) }), { mono: true });
}

// ---- berimbau: struck wire with a gourd that opens and closes (a "wah"), a coin for the high note, a buzz ----------------------------
registerSynthVoice('berimbau', (audio, p, o) => {
  const { ac, t } = o, hz = clamp(p.hz, 70, 700), D = clamp(p.dur ?? 0.9, 0.3, 2), g0 = level(p, 0.3), mode = p.mode ?? 'open';
  const out = bus(audio, ac, { wet: 0.12 }), env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(ex(g0), t + 0.004); env.gain.exponentialRampToValueAtTime(ex(g0 * 0.4), t + 0.12); env.gain.exponentialRampToValueAtTime(0.0001, t + D);
  const src = ac.createGain(), s1 = osc(ac, 'sawtooth', hz, t, D + 0.2), s2 = osc(ac, 'triangle', hz * 2.01, t, D + 0.2), g2 = ac.createGain(); g2.gain.value = 0.55; s1.connect(src); s2.connect(g2); g2.connect(src);
  // the wire is struck with a tiny pitch dip, as a taut wire does
  s1.frequency.setValueAtTime(hz * 1.025, t); s1.frequency.exponentialRampToValueAtTime(hz, t + 0.05); s2.frequency.setValueAtTime(hz * 2.05, t); s2.frequency.exponentialRampToValueAtTime(hz * 2.01, t + 0.05);
  // gourd resonance: a narrow band that sweeps up and down as the gourd moves against the belly
  const bp = filt(ac, 'bandpass', 360, 4.5), gb = ac.createGain(); gb.gain.value = 3.4;
  bp.frequency.setValueAtTime(mode === 'open' ? 300 : 520, t); bp.frequency.linearRampToValueAtTime(mode === 'open' ? 660 : 340, t + D * 0.5); bp.frequency.linearRampToValueAtTime(mode === 'open' ? 340 : 560, t + D);
  src.connect(bp); bp.connect(gb);
  const sum = ac.createGain(); gb.connect(sum); const dry = ac.createGain(); dry.gain.value = 0.35; src.connect(dry); dry.connect(sum);
  const lp = filt(ac, 'lowpass', mode === 'coin' ? 3600 : 2200, 0.7); sum.connect(lp);
  if (mode === 'buzz') { // the coin only touches the wire: it rattles. A fast amplitude chop plus a ring of high noise
    const chop = ac.createGain(); chop.gain.value = 0.6; const am = osc(ac, 'square', 88, t, D + 0.2), ag = ac.createGain(); ag.gain.value = 0.5; am.connect(ag); ag.connect(chop.gain); lp.connect(chop); chop.connect(env);
    const nz = noise(audio, ac, t, D), nf = filt(ac, 'bandpass', 3800, 2.2), ng = ac.createGain(); ng.gain.setValueAtTime(ex(g0 * 0.7), t); ng.gain.exponentialRampToValueAtTime(0.0001, t + D * 0.9); nz.connect(nf); nf.connect(ng); ng.connect(out);
  } else lp.connect(env);
  env.connect(out);
  const nz2 = noise(audio, ac, t, 0.03), nf2 = filt(ac, 'bandpass', 2600, 1), ng2 = ac.createGain(); ng2.gain.setValueAtTime(ex(g0 * 0.6), t); ng2.gain.exponentialRampToValueAtTime(0.0001, t + 0.025); nz2.connect(nf2); nf2.connect(ng2); ng2.connect(out);
  track(audio, s1);
  return null;
});
for (const mode of ['open', 'coin', 'buzz']) {
  registerStrikeVoice(`berimbau-${mode}`, (c) => c.evoice(c.audio, 'berimbau', { hz: mode === 'coin' ? c.hz : c.hz, mode, vel: c.vel, dur: mode === 'open' ? 1.2 : 0.9 }));
}

// ---- caxixi: seeds in a basket, three quick grains ----------------------------------------------------------------------------------
registerSynthVoice('caxixi', (audio, p, o) => {
  const { ac, t } = o, g0 = level(p, 0.16);
  for (let k = 0; k < 4; k++) {
    const tt = t + k * 0.028, nz = noise(audio, ac, tt, 0.07), bp = filt(ac, 'bandpass', 5200 + k * 400, 1.3), g = ac.createGain(), hp = filt(ac, 'highpass', 2800, 0.7);
    g.gain.setValueAtTime(0.0001, tt); g.gain.linearRampToValueAtTime(ex(g0 * (1 - k * 0.18)), tt + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.06);
    nz.connect(hp); hp.connect(bp); bp.connect(g); g.connect(bus(audio, ac, { wet: 0.08 }));
  }
  return null;
});
registerStrikeVoice('caxixi', (c) => c.evoice(c.audio, 'caxixi', { vel: c.vel }));

// ---- recipes of the shared string and bow voices -----------------------------------------------------------------------------------------
const PLUCK = {
  'zither-bright': { preset: { t60: 2.4, bright: 0.62, pos: 0.12, body: [[260, 2, 3], [1800, 2, 4]], wet: 0.2 }, shimmer: [2.003, 0.12] },
  'zither-guzheng': { preset: { t60: 2.2, bright: 0.52, pos: 0.2, body: [[200, 2, 4], [1000, 1.5, 3], [3000, 2, 3]], wet: 0.18 }, bendRe: /~|bend|slide/i },
  'zither-silk': { preset: { t60: 2.0, bright: 0.3, pos: 0.22, body: [[180, 2, 6], [700, 1.5, 3]], wet: 0.2 }, hard: 0.3 },
  dulcimer: { preset: { t60: 1.6, bright: 0.7, pos: 0.1, body: [[400, 3, 5], [2200, 2.5, 4]], wet: 0.14 }, double: 5 },
  'dulcimer-drone': { preset: { t60: 2.2, bright: 0.5, pos: 0.12, body: [[320, 3, 5], [1500, 2, 3]], wet: 0.16 }, double: 6, vel: 0.8 },
  valiha: { preset: { t60: 1.8, bright: 0.8, pos: 0.3, body: [[500, 6, 7], [1300, 4, 4]], wet: 0.18 }, tube: true },
  sasando: { preset: { t60: 1.3, bright: 0.86, pos: 0.12, body: [[700, 4, 5], [2800, 3, 5]], wet: 0.2 }, double: 7 },
  'harp-adungu': { preset: { t60: 1.0, bright: 0.55, pos: 0.3, body: [[160, 3, 6], [800, 2, 4]], wet: 0.12 }, thump: 130 },
  'harp-saung': { preset: { t60: 2.1, bright: 0.38, pos: 0.28, body: [[220, 2, 5], [900, 2, 3]], wet: 0.22 }, hard: 0.35 },
  'lute-komuz': { preset: { t60: 1.0, bright: 0.55, pos: 0.12, body: [[330, 3, 5], [1500, 2, 3]], wet: 0.1 }, thump: 180 },
  'lute-chonguri': { preset: { t60: 1.0, bright: 0.48, pos: 0.14, body: [[300, 3, 5], [1200, 2, 3]], wet: 0.12 } },
  'lute-saz': { preset: { t60: 1.2, bright: 0.66, pos: 0.1, body: [[420, 3, 6], [2000, 2.5, 3]], wet: 0.1 }, double: 4 },
  'lute-tar': { preset: { t60: 1.4, bright: 0.72, pos: 0.1, body: [[260, 3, 5], [720, 4, 7], [2400, 2, 3]], wet: 0.12 }, double: 3 },
  'lute-pipa': { preset: { t60: 0.85, bright: 0.86, pos: 0.1, body: [[500, 3, 5], [2600, 2.5, 6]], wet: 0.1 }, hard: 0.95, shimmer: [3.01, 0.08] },
  'lute-dranyen': { preset: { t60: 1.4, bright: 0.42, pos: 0.16, body: [[200, 3, 6], [900, 2, 3]], wet: 0.14 }, double: 6, thump: 110 },
  'lute-chapey': { preset: { t60: 0.9, bright: 0.46, pos: 0.14, body: [[240, 3, 5], [1100, 2, 3]], wet: 0.12 } },
  'lute-tres': { preset: { t60: 0.9, bright: 0.62, pos: 0.15, body: [[110, 4, 6], [260, 3, 4], [2400, 2, 3]], wet: 0.1 }, octave: 0.35 },
  'lute-veena': { preset: { t60: 2.6, bright: 0.58, pos: 0.1, body: [[180, 3, 6], [1000, 2, 3]], wet: 0.2 }, shimmer: [1.5, 0.05] },
  'lute-banjo': { preset: { t60: 0.55, bright: 0.84, pos: 0.18, body: [[780, 2.5, 6], [2900, 2.5, 5]], wet: 0.06 }, thump: 210, hard: 0.9 },
  'lute-banjo-drone': { preset: { t60: 0.5, bright: 0.86, pos: 0.18, body: [[780, 2.5, 6], [2900, 2.5, 5]], wet: 0.06 }, hard: 0.9, vel: 0.8 },
  'lute-sape': { preset: { t60: 1.1, bright: 0.46, pos: 0.14, body: [[260, 3, 5], [1200, 2, 3]], wet: 0.14 }, thump: 150 },
};
for (const [kind, r] of Object.entries(PLUCK)) {
  registerStrikeVoice(kind, (c) => {
    const { audio, voice, hz, vel, dur } = c, d = Math.max(0.6, dur), v = vel * (r.vel ?? 1);
    const bend = r.bendRe && r.bendRe.test(c.lane.name) ? -80 : 0;
    voice(audio, 'pluck', { hz, vel: v, dur: d, inst: kind, preset: r.preset, hard: r.hard ?? 0.6, bend });
    if (r.double) voice(audio, 'pluck', { hz: cents(hz, r.double), vel: v * 0.55, dur: d, inst: kind, preset: r.preset, hard: r.hard ?? 0.6, delay: 0.006 });
    if (r.octave) voice(audio, 'pluck', { hz: hz * 2, vel: v * r.octave, dur: d * 0.7, inst: kind, preset: r.preset, hard: 0.7, delay: 0.004 });
    if (r.shimmer) voice(audio, 'pluck', { hz: hz * r.shimmer[0], vel: v * r.shimmer[1], dur: d * 0.8, inst: kind, preset: { ...r.preset, bright: 0.3 }, delay: 0.01 });
    if (r.thump) voice(audio, 'drum', { hz: r.thump, vel: v * 0.35, dur: 0.12, style: 'frame' });
    if (r.tube) voice(audio, 'breath', { hz: hz * 0.5, vel: v * 0.05, dur: 0.18 });
  });
}

const BOW = {
  'bow-erhu': { preset: { f: [[600, 5, 9], [1700, 4, 8], [3000, 3, 4]], lp: 5800, vib: 6.0, vd: 22, att: 0.12, noise: 0.04 } },
  'bow-sarangi': { preset: { f: [[450, 5, 8], [1300, 4, 7], [2400, 3, 5]], lp: 4300, vib: 5.0, vd: 10, att: 0.14, noise: 0.09 }, sympa: 2.0 },
  'bow-fiddle': { preset: { f: [[500, 5, 8], [1600, 4, 8], [3000, 3, 4]], lp: 5600, vib: 5.4, vd: 9, att: 0.05, noise: 0.06 } },
  'bow-hardanger': { preset: { f: [[480, 5, 8], [1500, 4, 7], [2800, 3, 3]], lp: 5000, vib: 5.2, vd: 8, att: 0.07, noise: 0.05 }, sympa: 3.0 },
  'bow-masenqo': { preset: { f: [[380, 5, 9], [1000, 4, 7]], lp: 3200, vib: 5.5, vd: 16, att: 0.12, noise: 0.15 } },
  'bow-nyckel': { preset: { f: [[400, 5, 8], [1100, 4, 6], [2200, 3, 3]], lp: 3600, vib: 4.6, vd: 6, att: 0.15, noise: 0.05 }, sympa: 2.0 },
};
for (const [kind, r] of Object.entries(BOW)) {
  registerStrikeVoice(kind, (c) => {
    const { audio, voice, hz, vel, dur } = c, d = Math.max(0.5, dur);
    voice(audio, 'bow', { hz, vel, dur: d, inst: kind, preset: r.preset });
    // understrings and sympathetic strings answer softly an octave (or a twelfth) above
    if (r.sympa) voice(audio, 'pluck', { hz: hz * r.sympa, vel: vel * 0.07, dur: d * 1.4, inst: 'harp', hard: 0.2, delay: 0.03 });
  });
}

// ---- band voices ------------------------------------------------------------------------------------------------------------------------------
// trumpet: a lip-buzzed saw that scoops into the note, brightens as it swells, with the horn's two formants
registerSynthVoice('brass', (audio, p, o) => {
  const { ac, t } = o, hz = clamp(p.hz, 120, 1500), D = clamp(p.dur ?? 0.5, 0.15, 3), g0 = level(p, 0.2);
  const out = bus(audio, ac, { wet: 0.16 }), env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(ex(g0 * 0.8), t + 0.05); env.gain.linearRampToValueAtTime(ex(g0), t + 0.14); env.gain.setValueAtTime(ex(g0 * 0.95), t + Math.max(0.15, D - 0.06)); env.gain.exponentialRampToValueAtTime(0.0001, t + D + 0.09);
  const s1 = osc(ac, 'sawtooth', hz * 0.96, t, D + 0.3), s2 = osc(ac, 'square', hz, t, D + 0.3), g2 = ac.createGain(); g2.gain.value = 0.25;
  s1.frequency.exponentialRampToValueAtTime(hz, t + 0.06); s2.frequency.setValueAtTime(hz * 0.97, t); s2.frequency.exponentialRampToValueAtTime(hz, t + 0.06);
  const lfo = osc(ac, 'sine', 5.4, t, D + 0.3), lg = ac.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(7, t + Math.min(0.5, D)); lfo.connect(lg); lg.connect(s1.detune); lg.connect(s2.detune);
  const src = ac.createGain(); s1.connect(src); s2.connect(g2); g2.connect(src);
  const lp = filt(ac, 'lowpass', 900, 0.8); lp.frequency.setValueAtTime(900, t); lp.frequency.linearRampToValueAtTime(Math.min(6000, hz * 9), t + 0.18); src.connect(lp);
  const sum = ac.createGain(); lp.connect(sum);
  for (const [f, q, gn] of [[1150, 5, 1.1], [2600, 5, 0.7]]) { const bp = filt(ac, 'peaking', f, q, 8 * gn); lp.connect(bp); bp.connect(sum); }
  sum.connect(env); env.connect(out); track(audio, s1);
  return cutter(ac, env, g0, t + D);
});
registerStrikeVoice('brass', (c) => c.evoice(c.audio, 'brass', { hz: c.hz, vel: c.vel, dur: Math.max(0.3, c.dur) }), { mono: true });
// rumba box: a steel tongue on a wooden box, a round low note with a woody knock
registerSynthVoice('rumba', (audio, p, o) => {
  const { ac, t } = o, hz = clamp(p.hz, 50, 400), D = clamp(p.dur ?? 0.7, 0.3, 1.6), g0 = level(p, 0.4), out = bus(audio, ac, { wet: 0.1 });
  for (const [r, gn, dec] of [[1, 1, D], [2.76, 0.14, D * 0.35], [5.4, 0.05, D * 0.2]]) { const s = osc(ac, 'sine', hz * r, t, dec + 0.1), g = ac.createGain(); s.frequency.setValueAtTime(hz * r * 1.02, t); s.frequency.exponentialRampToValueAtTime(hz * r, t + 0.04); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(ex(g0 * gn), t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dec); s.connect(g); g.connect(out); if (r === 1) track(audio, s); }
  const nz = noise(audio, ac, t, 0.05), nf = filt(ac, 'bandpass', 700, 1.2), ng = ac.createGain(); ng.gain.setValueAtTime(ex(g0 * 0.7), t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.035); nz.connect(nf); nf.connect(ng); ng.connect(out);
  return null;
});
registerStrikeVoice('rumba', (c) => c.evoice(c.audio, 'rumba', { hz: c.hz, vel: c.vel, dur: 0.9 }));
registerStrikeVoice('bass-pluck', (c) => { const { audio, voice, hz, vel } = c; voice(audio, 'pluck', { hz, vel, dur: 1.0, inst: 'guitarron', preset: { t60: 1.1, bright: 0.4, pos: 0.2, body: [[100, 4, 8], [240, 3, 4]], wet: 0.1 }, hard: 0.7 }); voice(audio, 'drum', { hz: 90, vel: vel * 0.3, dur: 0.1, style: 'frame' }); });
registerStrikeVoice('maraca', (c) => c.evoice(c.audio, 'caxixi', { vel: c.vel * 1.1 }));

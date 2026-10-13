// Shared instrument and effect voices for every engine (WebAudio only, no samples).
//
//   import { voice, fx } from '../../../platform/engine-kit/synth.js';
//   voice(env.audio, 'pluck', { hz: 220, vel: 0.8, inst: 'charango', dur: 1 });
//   fx(env.audio, 'impact', { vel: 0.7, mat: 'wood' });
//
// Rules: audio only. It never reads or writes game state and never touches Math.random (a local LCG fills the
// excitation buffers), so the determinism tests are unaffected. Without an AudioContext (headless tests) every call is a no-op.
// Output goes to `audio.out` (compressor/limiter + master) and, lightly, to `audio.send` (reverb) from platform/kit/audio.js.
// Levels: one voice peaks around -12 dBFS (0.25); chords sum through the shared compressor. Max polyphony 30.
//
// voice kinds (p = { hz, vel 0..1, dur s, delay s, pan -1..1, inst: instrument id or title (picks body/brightness) })
//   pluck   Karplus-Strong string with pick position + body resonances (charango, balalaika, ukulele, qanun, buzuq, harp...)
//   strum   several plucks fanned out ({ hzs: [...], gap })
//   monochord  pluck with a pitch bend and a flageolet harmonic (dan bau): { bend: cents }
//   bow     bowed string: saw pair + formants + vibrato + bow noise (morin khuur, kamancha, goje...)
//   drum    membrane: { style: bass|tone|slap|rim|dayan|bayan|taiko|frame|water }
//   bar     tuned wooden bar (marimba/xylophone/balafon) { buzz: 0..1 gourd buzz }
//   tine    mbira / kalimba tine with bottle-cap buzz
//   bell    inharmonic bell / carillon / handbell
//   gong    bossed gong (kulintang), long beating decay
//   steelpan  hammered note with ringing octave and fifth
//   breath  flute family (bansuri, dizi, pan pipe): noise through resonant filter + soft attack + vibrato
//   reed    double/single reed (mijwiz, duduk, shawm): buzzy, nasal formant
//   step / clap / slap / boot / stomp   dance sounds
//   pad     soft sustained drone
// fx kinds (effects for story / bout / tempo-race / aim / crafts): pop tick thud impact splash whoosh ring chime blip
//   murmur good bad sparkle scrape
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const ln2 = Math.LN2;
let seedCounter = 0;
const lcg = (s) => () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };

// ---- plumbing -----------------------------------------------------------------------------------------------------
function open(audio, p) {
  if (!audio || audio.muted) return null;
  const ac = audio.context;
  if (!ac || (ac.state !== 'running' && !audio.forceRun) || (audio.voices ?? 0) > 30) return null;
  const out = audio.out;
  if (!out) return null;
  return { ac, t: ac.currentTime + Math.max(0, p.delay ?? 0) + 0.005 };
}
// master bus of one voice: gain -> (pan) -> dry bus, plus a reverb send
function bus(audio, ac, { gain = 1, pan = 0, wet = 0.12 } = {}) {
  const g = ac.createGain();
  g.gain.value = gain;
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
const exp = (x) => Math.max(0.0001, x);
// attack / decay envelope: 0 -> peak over `a`, exponential fall to ~0 by `a + d`
function ad(param, t, peak, a, d, curve = 'exp') {
  param.setValueAtTime(0.0001, t);
  param.linearRampToValueAtTime(exp(peak), t + Math.max(0.002, a));
  if (curve === 'exp') param.exponentialRampToValueAtTime(0.0001, t + a + d);
  else param.linearRampToValueAtTime(0.0001, t + a + d);
}
function osc(ac, type, hz, t, dur) {
  const o = ac.createOscillator();
  o.type = type; o.frequency.setValueAtTime(hz, t);
  o.start(t); o.stop(t + dur);
  return o;
}
function noise(audio, ac, t, dur) {
  const s = ac.createBufferSource();
  s.buffer = audio.noise(); s.loop = true;
  s.start(t, (seedCounter++ * 0.37) % 1.6); s.stop(t + dur);
  return s;
}
function filt(ac, type, f, q = 0.7, gain = 0) {
  const b = ac.createBiquadFilter();
  b.type = type; b.frequency.value = clamp(f, 20, 18000); b.Q.value = q; b.gain.value = gain;
  return b;
}
function chain(...nodes) { for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]); return nodes[nodes.length - 1]; }
const level = (p, base = 1) => base * Math.pow(clamp(p.vel ?? 0.8, 0.05, 1.2), 1.15);

// ---- instrument presets (by instrument id / title keywords) ---------------------------------------------------------
// strings: t60 (seconds to -60 dB), bright 0..1, pos (pluck position along the string), body [[Hz, Q, dB]], wet
const STRINGS = [
  [/charango|ronroco|cavaquinho|ukulele|tiple|cuatro|requinto/i, { t60: 0.95, bright: 0.58, pos: 0.16, body: [[420, 3, 6], [1750, 2, 3]], wet: 0.1 }],
  [/balalaika|domra|mandolin|bouzouki|saz|baglama|tanbur|dombra|komuz|panduri|chonguri/i, { t60: 1.0, bright: 0.66, pos: 0.12, body: [[520, 3, 5], [2300, 2.5, 3]], wet: 0.1 }],
  [/banjo|ngoni|gimbri|sintir|akonting|xalam/i, { t60: 0.6, bright: 0.82, pos: 0.2, body: [[780, 2.5, 6], [2900, 2.5, 5]], wet: 0.08 }],
  [/harp|kora|qanun|kanun|santur|santoor|guzheng|koto|zither|kantele|yangqin|cimbalom|psaltery|arpa|lyre|krar|bolon/i, { t60: 2.0, bright: 0.38, pos: 0.25, body: [[210, 2, 4], [950, 1.5, 3]], wet: 0.16 }],
  [/oud|buzuq|bouzouki|rabab|rebab|ghijak|tar\b|setar|sitar|sarod|veena|vina|pipa|biwa|sanxian|shamisen|tambur|ud\b/i, { t60: 1.15, bright: 0.52, pos: 0.14, body: [[190, 3, 5], [1150, 2, 3], [2600, 2, 2]], wet: 0.12 }],
  [/guitar|vihuela|guitarra|viola|cuatro|tres\b|jarana|bandurria|berimbau|dan |dan_|monochord|bau/i, { t60: 1.6, bright: 0.42, pos: 0.16, body: [[110, 4, 7], [230, 3, 4], [2200, 2, 2]], wet: 0.12 }],
];
const STRING_DEFAULT = { t60: 1.2, bright: 0.5, pos: 0.16, body: [[250, 2.5, 4], [1500, 2, 2]], wet: 0.12 };
const stringPreset = (inst) => { const s = String(inst ?? ''); for (const [re, o] of STRINGS) if (re.test(s)) return o; return STRING_DEFAULT; };
const BOWS = [
  [/morin|khuur|matouqin|horsehead/i, { f: [[420, 5, 9], [1150, 4, 6]], lp: 3000, vib: 5.0, vd: 10, att: 0.14, noise: 0.07 }],
  [/erhu|huqin|gaohu|ghijak|kamancha|kemenche|kemence|rabab|rebab|goje|goge|gusle|fiddle|violin|sarangi|lyra|kamanche/i, { f: [[480, 5, 8], [1500, 4, 7], [2800, 3, 3]], lp: 5000, vib: 5.6, vd: 14, att: 0.1, noise: 0.05 }],
];
const BOW_DEFAULT = { f: [[460, 5, 7], [1400, 4, 6], [2600, 3, 3]], lp: 4500, vib: 5.4, vd: 12, att: 0.11, noise: 0.05 };
const bowPreset = (inst) => { const s = String(inst ?? ''); for (const [re, o] of BOWS) if (re.test(s)) return o; return BOW_DEFAULT; };

// ---- Karplus-Strong buffers (cached) -----------------------------------------------------------------------------------
const ksCache = new Map();
function ksBuffer(ac, hz, secs, t60, bright, pos, hard) {
  const sr = ac.sampleRate;
  const key = `${sr}|${Math.round(hz * 4)}|${Math.round(secs * 10)}|${t60}|${bright}|${pos}|${hard}`;
  const hit = ksCache.get(key);
  if (hit) return hit;
  const L = sr / hz - 0.5, N = Math.max(4, Math.floor(L)), frac = L - N, a = (1 - frac) / (1 + frac);
  const len = Math.floor(sr * secs), buf = ac.createBuffer(1, len, sr), out = buf.getChannelData(0);
  const d = new Float32Array(N), rnd = lcg(0x51ed270b + Math.round(hz * 8));
  // excitation: noise, lowpassed (softer pluck = darker), comb for the pluck position
  let lp = 0;
  const kLp = 0.25 + 0.75 * hard;
  for (let i = 0; i < N; i++) { const r = rnd() * 2 - 1; lp += (r - lp) * kLp; d[i] = lp; }
  const pk = Math.max(1, Math.round(N * pos));
  for (let i = N - 1; i >= pk; i--) d[i] -= d[i - pk];
  let m = 0; for (let i = 0; i < N; i++) m = Math.max(m, Math.abs(d[i]));
  const sc = m > 0 ? 0.9 / m : 1; for (let i = 0; i < N; i++) d[i] *= sc;
  const f = Math.pow(0.001, 1 / (hz * Math.max(0.15, t60)));
  let prev = 0, apx = 0, apy = 0, i = 0;
  for (let n = 0; n < len; n++) {
    const cur = d[i];
    const v = f * (bright * cur + (1 - bright) * 0.5 * (cur + prev));
    prev = cur;
    const y = a * (v - apy) + apx; apx = v; apy = y;
    d[i] = y; out[n] = cur;
    if (++i >= N) i = 0;
  }
  // gentle fade at the very end so a cut buffer never clicks
  const fade = Math.min(len, Math.floor(sr * 0.05));
  for (let n = 0; n < fade; n++) out[len - 1 - n] *= n / fade;
  if (ksCache.size > 160) ksCache.clear();
  ksCache.set(key, buf);
  return buf;
}

// ---- voices ----------------------------------------------------------------------------------------------------------------
const V = {};

V.pluck = (audio, p, o) => {
  const { ac, t } = o, pr = { ...stringPreset(p.inst), ...(p.preset ?? {}) };
  const hz = clamp(p.hz ?? 220, 40, 3000);
  const T = clamp(p.dur ? Math.max(pr.t60 * 0.75, p.dur) : pr.t60, 0.25, 2.4);
  const src = ac.createBufferSource();
  src.buffer = ksBuffer(ac, hz, Math.min(2.4, T * 1.05 + 0.15), T, clamp(pr.bright + (p.bright ?? 0), 0.05, 0.95), pr.pos, clamp(p.hard ?? 0.6, 0.1, 1));
  if (p.bend) { src.playbackRate.setValueAtTime(1, t); src.playbackRate.linearRampToValueAtTime(2 ** (p.bend / 1200), t + Math.min(0.5, T * 0.4)); }
  // body: peaking resonances + a warm shelf; high strings sound thinner so roll the top off a little
  const nodes = [src];
  for (const [f, q, g] of pr.body) nodes.push(filt(ac, 'peaking', f, q, g));
  nodes.push(filt(ac, 'lowpass', clamp(hz * 14, 3500, 12000), 0.5));
  const g = ac.createGain();
  g.gain.setValueAtTime(level(p, 0.5), t);
  g.gain.setTargetAtTime(0.0001, t + T * 0.85, T * 0.08);
  nodes.push(g);
  chain(...nodes).connect(bus(audio, ac, { pan: p.pan, wet: pr.wet }));
  src.start(t); src.stop(t + Math.min(2.4, T * 1.05 + 0.15) + 0.05);
  // pick transient
  const nz = noise(audio, ac, t, 0.03), nf = filt(ac, 'bandpass', clamp(hz * 5, 1200, 5000), 1.2), ng = ac.createGain();
  ad(ng.gain, t, level(p, 0.05), 0.001, 0.02);
  chain(nz, nf, ng).connect(bus(audio, ac, { pan: p.pan, wet: 0 }));
  track(audio, src);
};

V.strum = (audio, p, o) => {
  const hzs = p.hzs ?? [p.hz ?? 220, (p.hz ?? 220) * 1.26, (p.hz ?? 220) * 1.5, (p.hz ?? 220) * 2], gap = p.gap ?? 0.018;
  hzs.forEach((hz, k) => V.pluck(audio, { ...p, hz, vel: (p.vel ?? 0.8) * (0.62 + 0.1 * (k % 2)), delay: (p.delay ?? 0) + k * gap }, open(audio, { ...p, delay: (p.delay ?? 0) + k * gap }) ?? o));
};

V.monochord = (audio, p, o) => {
  const { ac, t } = o, hz = clamp(p.hz ?? 196, 60, 1200);
  V.pluck(audio, { ...p, inst: 'monochord guitar', bend: p.bend ?? 160, vel: (p.vel ?? 0.8) }, o);
  // flageolet shimmer a twelfth above
  const s = osc(ac, 'sine', hz * 3, t, 0.9), g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  ad(g.gain, t + 0.03, level(p, 0.05), 0.01, 0.8);
  s.frequency.linearRampToValueAtTime(hz * 3 * 2 ** ((p.bend ?? 160) / 1200), t + 0.4);
  chain(s, g).connect(bus(audio, ac, { pan: p.pan, wet: 0.18 }));
};

V.bow = (audio, p, o) => {
  const { ac, t } = o, pr = { ...bowPreset(p.inst), ...(p.preset ?? {}) };
  const hz = clamp(p.hz ?? 220, 60, 1800), D = clamp(p.dur ?? 0.8, 0.25, 4), peak = level(p, 0.1);
  const reg = Math.pow(clamp(hz / 260, 0.5, 2.2), 0.35);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak * 0.55, t + pr.att * 0.5);
  g.gain.linearRampToValueAtTime(peak, t + pr.att + 0.05);
  g.gain.setValueAtTime(peak * 0.92, t + Math.max(pr.att + 0.06, D - 0.14));
  g.gain.exponentialRampToValueAtTime(0.0001, t + D + 0.12);
  const sum = ac.createGain();
  const lfo = osc(ac, 'sine', pr.vib, t, D + 0.2), lg = ac.createGain();
  lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(pr.vd, t + Math.min(0.5, D * 0.6)); // vibrato blooms in
  lfo.connect(lg);
  const mk = (det, type, amp) => {
    const s = osc(ac, type, hz, t, D + 0.25); s.detune.value = det; lg.connect(s.detune);
    const a = ac.createGain(); a.gain.value = amp; s.connect(a); a.connect(sum); return s;
  };
  const main = mk(-5, 'sawtooth', 0.5); mk(5, 'sawtooth', 0.5); mk(0, 'triangle', 0.35);
  const outG = ac.createGain();
  // formant filters in parallel
  for (const [f, q, db] of pr.f) {
    const bp = filt(ac, 'peaking', f * reg, q, db);
    sum.connect(bp); bp.connect(outG);
  }
  const lp = filt(ac, 'lowpass', Math.min(pr.lp, hz * 9), 0.6);
  sum.connect(lp); lp.connect(outG);
  // bow noise
  const nz = noise(audio, ac, t, D + 0.2), nf = filt(ac, 'bandpass', clamp(hz * 6, 1800, 5200), 0.9), ng = ac.createGain();
  ng.gain.value = pr.noise * 0.5;
  chain(nz, nf, ng).connect(sum);
  chain(outG, g).connect(bus(audio, ac, { pan: p.pan, wet: 0.14 }));
  track(audio, main);
};

// membranes -------------------------------------------------------------------------------------------------------
const DRUMS = {
  //        sweep  fall  decay  noise  nbp   modes
  bass: { sw: 1.9, sd: 0.07, d: 0.42, n: 0.35, nf: 600, nd: 0.05, modes: [1.0, 1.59, 2.14], mg: [1, 0.25, 0.1] },
  taiko: { sw: 1.7, sd: 0.08, d: 0.7, n: 0.45, nf: 900, nd: 0.07, modes: [1.0, 1.5, 2.0, 2.6], mg: [1, 0.5, 0.3, 0.15] },
  tone: { sw: 1.5, sd: 0.05, d: 0.26, n: 0.28, nf: 1500, nd: 0.04, modes: [1.0, 1.59, 2.14, 2.3], mg: [1, 0.35, 0.18, 0.1] },
  frame: { sw: 1.35, sd: 0.04, d: 0.32, n: 0.22, nf: 2200, nd: 0.035, modes: [1.0, 1.5, 2.0], mg: [1, 0.3, 0.12] },
  slap: { sw: 1.25, sd: 0.02, d: 0.12, n: 0.9, nf: 2400, nd: 0.07, modes: [1.0, 1.7], mg: [0.8, 0.3] },
  rim: { sw: 1.0, sd: 0.01, d: 0.07, n: 0.55, nf: 3200, nd: 0.025, modes: [2.6, 4.1], mg: [0.9, 0.6] },
  dayan: { sw: 1.08, sd: 0.02, d: 0.55, n: 0.18, nf: 3000, nd: 0.02, modes: [1.0, 2.0, 3.0, 4.0], mg: [1, 0.6, 0.35, 0.2] },
  bayan: { sw: 0.8, sd: 0.2, d: 0.5, n: 0.25, nf: 700, nd: 0.04, modes: [1.0, 1.5], mg: [1, 0.3], rise: 1.35 },
  water: { sw: 1.2, sd: 0.15, d: 0.5, n: 0.15, nf: 800, nd: 0.03, modes: [1.0, 1.9], mg: [1, 0.4], rise: 1.25 },
};
V.drum = (audio, p, o) => {
  const { ac, t } = o, st = DRUMS[p.style] ?? DRUMS.tone;
  const hz = clamp(p.hz ?? 110, 40, 1200), D = (p.dur ? clamp(p.dur, 0.08, 1.2) : st.d), g0 = level(p, 0.34);
  const out = bus(audio, ac, { pan: p.pan, wet: p.style === 'rim' ? 0.05 : 0.1 });
  let main = null;
  st.modes.forEach((r, k) => {
    const f = hz * r, o2 = ac.createOscillator();
    o2.type = 'sine';
    if (st.rise) { o2.frequency.setValueAtTime(f * 0.9, t); o2.frequency.exponentialRampToValueAtTime(f * st.rise, t + st.sd + 0.03); }
    else { o2.frequency.setValueAtTime(f * st.sw, t); o2.frequency.exponentialRampToValueAtTime(f, t + st.sd); }
    const a = ac.createGain();
    ad(a.gain, t, g0 * st.mg[k] * (k === 0 ? 1 : 0.8), 0.002, D / (1 + k * 0.6));
    o2.connect(a); a.connect(out); o2.start(t); o2.stop(t + D + 0.1);
    if (!main) main = o2;
  });
  // stick / palm noise
  const nz = noise(audio, ac, t, st.nd + 0.05), nf = filt(ac, 'bandpass', st.nf, 0.9), ng = ac.createGain();
  ad(ng.gain, t, g0 * st.n, 0.001, st.nd);
  chain(nz, nf, ng).connect(out);
  track(audio, main);
};

V.bar = (audio, p, o) => {
  const { ac, t } = o, hz = clamp(p.hz ?? 330, 60, 3500), D = clamp(p.dur ?? 0.7, 0.25, 1.6), g0 = level(p, 0.3);
  const out = bus(audio, ac, { pan: p.pan, wet: 0.14 });
  const ratios = p.ratios ?? [1, 3.93, 9.2], gains = [1, 0.28, 0.07];
  let main = null;
  ratios.forEach((r, k) => {
    if (hz * r > 9000) return;
    const s = osc(ac, 'sine', hz * r, t, D + 0.1), a = ac.createGain();
    ad(a.gain, t, g0 * gains[k], 0.002, D / (1 + k * 1.8));
    s.connect(a); a.connect(out); if (!main) main = s;
  });
  // mallet tick
  const nz = noise(audio, ac, t, 0.03), nf = filt(ac, 'bandpass', clamp(hz * 3, 1500, 5000), 1), ng = ac.createGain();
  ad(ng.gain, t, g0 * 0.22, 0.0008, 0.015);
  chain(nz, nf, ng).connect(out);
  if ((p.buzz ?? 0) > 0) { // balafon gourd resonator buzz: noise band AM-ed at ~110 Hz
    const bz = noise(audio, ac, t, D), bf = filt(ac, 'bandpass', 3400, 2), bg = ac.createGain(), am = osc(ac, 'sine', 110, t, D), ag = ac.createGain();
    ag.gain.value = 0.5; am.connect(ag); ag.connect(bg.gain);
    const env = ac.createGain(); ad(env.gain, t, g0 * 0.28 * p.buzz, 0.004, D * 0.9);
    chain(bz, bf, bg, env).connect(out);
  }
  track(audio, main);
};

V.tine = (audio, p, o) => {
  const { ac, t } = o, hz = clamp(p.hz ?? 330, 80, 2500), D = clamp(p.dur ?? 0.9, 0.3, 1.8), g0 = level(p, 0.26);
  const out = bus(audio, ac, { pan: p.pan, wet: 0.18 });
  const a = osc(ac, 'sine', hz, t, D + 0.1), ga = ac.createGain(); ad(ga.gain, t, g0, 0.002, D);
  const b = osc(ac, 'sine', hz * 5.95, t, 0.4), gb = ac.createGain(); ad(gb.gain, t, g0 * 0.22, 0.001, 0.25);
  const c = osc(ac, 'sine', hz * 2.01, t, 0.5), gc = ac.createGain(); ad(gc.gain, t, g0 * 0.12, 0.001, 0.3);
  chain(a, ga).connect(out); chain(b, gb).connect(out); chain(c, gc).connect(out);
  // bottle-cap buzz: short rattling noise bursts
  const nz = noise(audio, ac, t, D * 0.6), nf = filt(ac, 'bandpass', 4200, 3), ng = ac.createGain(), am = osc(ac, 'square', 70, t, D * 0.6), ag = ac.createGain();
  ag.gain.value = 0.5; am.connect(ag); ag.connect(ng.gain);
  const env = ac.createGain(); ad(env.gain, t, g0 * 0.2, 0.003, D * 0.5);
  chain(nz, nf, ng, env).connect(out);
  track(audio, a);
};

const BELL = [[0.5, 0.35, 1.0], [1, 0.9, 1.0], [1.19, 0.55, 0.8], [1.56, 0.4, 0.6], [2.0, 0.45, 0.5], [2.74, 0.28, 0.35], [3.0, 0.2, 0.3], [4.1, 0.15, 0.2], [5.4, 0.1, 0.12]];
V.bell = (audio, p, o) => {
  const { ac, t } = o, hz = clamp(p.hz ?? 440, 80, 2400), D = clamp(p.dur ?? 1.6, 0.4, 3.2), g0 = level(p, 0.2);
  const out = bus(audio, ac, { pan: p.pan, wet: 0.26 });
  let main = null;
  for (const [r, gn, dm] of BELL) {
    const f = hz * r; if (f > 10000) continue;
    const s = osc(ac, 'sine', f, t, D * dm + 0.1), a = ac.createGain();
    ad(a.gain, t, g0 * gn, 0.001, D * dm / (1 + 0.15 * r));
    s.connect(a); a.connect(out); if (!main) main = s;
  }
  const nz = noise(audio, ac, t, 0.03), nf = filt(ac, 'bandpass', 4500, 1.5), ng = ac.createGain();
  ad(ng.gain, t, g0 * 0.15, 0.0008, 0.015);
  chain(nz, nf, ng).connect(out);
  track(audio, main);
};

V.gong = (audio, p, o) => {
  const { ac, t } = o, hz = clamp(p.hz ?? 220, 60, 1400), D = clamp(p.dur ?? 1.6, 0.5, 3), g0 = level(p, 0.19);
  const out = bus(audio, ac, { pan: p.pan, wet: 0.2 });
  const parts = [[1, 1, 1], [1.004, 0.7, 0.9], [2.01, 0.38, 0.7], [2.76, 0.22, 0.5], [4.2, 0.12, 0.3], [0.5, 0.18, 0.8]];
  let main = null;
  for (const [r, gn, dm] of parts) {
    const s = osc(ac, 'sine', hz * r, t, D * dm + 0.2), a = ac.createGain();
    a.gain.setValueAtTime(0.0001, t);
    a.gain.linearRampToValueAtTime(g0 * gn, t + 0.012 + 0.01 * r); // gongs bloom a little
    a.gain.exponentialRampToValueAtTime(0.0001, t + D * dm);
    s.connect(a); a.connect(out); if (!main) main = s;
  }
  const nz = noise(audio, ac, t, 0.08), nf = filt(ac, 'bandpass', hz * 6, 1), ng = ac.createGain();
  ad(ng.gain, t, g0 * 0.12, 0.002, 0.05);
  chain(nz, nf, ng).connect(out);
  track(audio, main);
};

V.steelpan = (audio, p, o) => {
  const { ac, t } = o, hz = clamp(p.hz ?? 330, 100, 2400), D = clamp(p.dur ?? 0.9, 0.3, 1.8), g0 = level(p, 0.26);
  const out = bus(audio, ac, { pan: p.pan, wet: 0.2 });
  let main = null;
  [[1, 1, 1], [2, 0.5, 0.8], [3.01, 0.22, 0.45], [4.02, 0.1, 0.3]].forEach(([r, gn, dm]) => {
    const s = osc(ac, 'sine', hz * r * (r === 1 ? 1 : 1.002), t, D * dm + 0.1), a = ac.createGain();
    ad(a.gain, t, g0 * gn, 0.003, D * dm);
    s.connect(a); a.connect(out); if (!main) main = s;
  });
  const nz = noise(audio, ac, t, 0.03), nf = filt(ac, 'bandpass', 2800, 1), ng = ac.createGain();
  ad(ng.gain, t, g0 * 0.18, 0.001, 0.02); chain(nz, nf, ng).connect(out);
  track(audio, main);
};

V.breath = (audio, p, o) => {
  const { ac, t } = o, hz = clamp(p.hz ?? 440, 90, 2600), D = clamp(p.dur ?? 0.7, 0.2, 4), peak = level(p, 0.15);
  const out = bus(audio, ac, { pan: p.pan, wet: 0.2 });
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak * 0.7, t + 0.045);
  g.gain.linearRampToValueAtTime(peak, t + 0.11);
  g.gain.setValueAtTime(peak * 0.95, t + Math.max(0.12, D - 0.1));
  g.gain.exponentialRampToValueAtTime(0.0001, t + D + 0.1);
  const lfo = osc(ac, 'sine', 5.1, t, D + 0.2), lg = ac.createGain();
  lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(7, t + Math.min(0.6, D * 0.7));
  lfo.connect(lg);
  const tonal = ac.createGain(); tonal.gain.value = 1;
  const f1 = osc(ac, 'sine', hz, t, D + 0.2), f2 = osc(ac, 'triangle', hz * 2, t, D + 0.2), f3 = osc(ac, 'sine', hz * 3, t, D + 0.2);
  lg.connect(f1.detune); lg.connect(f2.detune); lg.connect(f3.detune);
  const g2 = ac.createGain(), g3 = ac.createGain(); g2.gain.value = 0.22; g3.gain.value = 0.06;
  f1.connect(tonal); f2.connect(g2); g2.connect(tonal); f3.connect(g3); g3.connect(tonal);
  // breath: noise through a resonant bandpass tuned to the note (the air jet exciting the tube)
  const nz = noise(audio, ac, t, D + 0.2), nf = filt(ac, 'bandpass', hz, 18), nf2 = filt(ac, 'bandpass', clamp(hz * 2, 600, 6000), 6), ng = ac.createGain();
  ng.gain.value = 0.55;
  const sumN = ac.createGain();
  nz.connect(nf); nf.connect(ng); nz.connect(nf2); nf2.connect(ng); ng.connect(sumN);
  tonal.connect(g); sumN.connect(g);
  // chiff at the attack
  const cz = noise(audio, ac, t, 0.12), cf = filt(ac, 'bandpass', clamp(hz * 2.5, 900, 5500), 2), cg = ac.createGain();
  ad(cg.gain, t, peak * 0.22, 0.01, 0.09);
  chain(cz, cf, cg).connect(out);
  chain(g, filt(ac, 'lowpass', clamp(hz * 8, 2500, 9000), 0.5)).connect(out);
  track(audio, f1);
};

V.reed = (audio, p, o) => {
  const { ac, t } = o, hz = clamp(p.hz ?? 330, 90, 1800), D = clamp(p.dur ?? 0.7, 0.2, 4), peak = level(p, 0.1);
  const out = bus(audio, ac, { pan: p.pan, wet: 0.14 });
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak * 0.8, t + 0.03);
  g.gain.linearRampToValueAtTime(peak, t + 0.09);
  g.gain.setValueAtTime(peak * 0.95, t + Math.max(0.1, D - 0.08));
  g.gain.exponentialRampToValueAtTime(0.0001, t + D + 0.08);
  const sum = ac.createGain();
  const a = osc(ac, 'sawtooth', hz, t, D + 0.2), b = osc(ac, 'square', hz * 1.004, t, D + 0.2);
  const ga = ac.createGain(), gb = ac.createGain(); ga.gain.value = 0.6; gb.gain.value = 0.25;
  a.connect(ga); ga.connect(sum); b.connect(gb); gb.connect(sum);
  const lfo = osc(ac, 'sine', 5.6, t, D + 0.2), lg = ac.createGain(); lg.gain.value = 5; lfo.connect(lg); lg.connect(a.detune); lg.connect(b.detune);
  const outF = ac.createGain();
  for (const [f, q, db] of [[hz * 3.2 > 4000 ? 1200 : 1100, 3, 8], [2400, 3, 5]]) { const bp = filt(ac, 'peaking', f, q, db); sum.connect(bp); bp.connect(outF); }
  const lp = filt(ac, 'lowpass', clamp(hz * 6, 1800, 5000), 0.6); sum.connect(lp); lp.connect(outF);
  const nz = noise(audio, ac, t, D + 0.2), nf = filt(ac, 'bandpass', 2600, 1), ng = ac.createGain(); ng.gain.value = 0.03;
  chain(nz, nf, ng).connect(outF);
  chain(outF, g).connect(out);
  track(audio, a);
};

// dance --------------------------------------------------------------------------------------------------------------------
const hit = (audio, ac, t, out, { f0, f1, d, g, nf, nq = 0.8, nd, ng, type = 'sine' }) => {
  if (g > 0) {
    const s = ac.createOscillator(); s.type = type; s.frequency.setValueAtTime(f0, t); s.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + Math.min(d, 0.12));
    const a = ac.createGain(); ad(a.gain, t, g, 0.002, d); s.connect(a); a.connect(out); s.start(t); s.stop(t + d + 0.05);
    return s;
  }
  return null;
};
V.step = (audio, p, o) => {
  const { ac, t } = o, g0 = level(p, 0.32), out = bus(audio, ac, { pan: p.pan, wet: 0.08 });
  const s = hit(audio, ac, t, out, { f0: (p.hz ?? 120) * 1.0, f1: 48, d: 0.14, g: g0 });
  const nz = noise(audio, ac, t, 0.06), nf = filt(ac, 'lowpass', 1400, 0.7), ng = ac.createGain();
  ad(ng.gain, t, g0 * 0.55, 0.001, 0.04); chain(nz, nf, ng).connect(out);
  track(audio, s);
};
V.stomp = (audio, p, o) => {
  const { ac, t } = o, g0 = level(p, 0.4), out = bus(audio, ac, { pan: p.pan, wet: 0.1 });
  const s = hit(audio, ac, t, out, { f0: (p.hz ?? 90) * 1.2, f1: 40, d: 0.22, g: g0 });
  const nz = noise(audio, ac, t, 0.1), nf = filt(ac, 'lowpass', 700, 0.7), ng = ac.createGain();
  ad(ng.gain, t, g0 * 0.7, 0.001, 0.07); chain(nz, nf, ng).connect(out);
  track(audio, s);
};
V.boot = (audio, p, o) => {
  const { ac, t } = o, g0 = level(p, 0.42), out = bus(audio, ac, { pan: p.pan, wet: 0.1 });
  const s = hit(audio, ac, t, out, { f0: (p.hz ?? 150), f1: 70, d: 0.1, g: g0 * 0.8 });
  const nz = noise(audio, ac, t, 0.06), nf = filt(ac, 'bandpass', 1800, 1.2), ng = ac.createGain();
  ad(ng.gain, t, g0 * 0.6, 0.001, 0.035); chain(nz, nf, ng).connect(out);
  const m = osc(ac, 'sine', 3400 + (p.hz ?? 150) * 3, t, 0.12), mg = ac.createGain(); ad(mg.gain, t, g0 * 0.07, 0.001, 0.09); chain(m, mg).connect(out); // spur / buckle
  track(audio, s);
};
V.clap = (audio, p, o) => {
  const { ac, t } = o, g0 = level(p, 0.45), out = bus(audio, ac, { pan: p.pan, wet: 0.14 });
  let main = null;
  [0, 0.011, 0.023].forEach((dt, k) => {
    const nz = noise(audio, ac, t + dt, 0.12), nf = filt(ac, 'bandpass', 1500 + k * 250, 1.1), ng = ac.createGain();
    ad(ng.gain, t + dt, g0 * (k === 2 ? 0.9 : 0.6), 0.001, k === 2 ? 0.09 : 0.012);
    chain(nz, nf, ng).connect(out); if (!main) main = nz;
  });
  track(audio, main);
};
V.slap = (audio, p, o) => {
  const { ac, t } = o, g0 = level(p, 0.45), out = bus(audio, ac, { pan: p.pan, wet: 0.08 });
  const nz = noise(audio, ac, t, 0.1), nf = filt(ac, 'bandpass', 800, 1.0), ng = ac.createGain();
  ad(ng.gain, t, g0, 0.001, 0.05); chain(nz, nf, ng).connect(out);
  const s = hit(audio, ac, t, out, { f0: 260, f1: 150, d: 0.07, g: g0 * 0.5 });
  track(audio, s);
};
V.pad = (audio, p, o) => {
  const { ac, t } = o, hz = clamp(p.hz ?? 110, 40, 800), D = clamp(p.dur ?? 2, 0.5, 6), g0 = level(p, 0.12);
  const out = bus(audio, ac, { pan: p.pan, wet: 0.25 });
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(g0, t + 0.25); g.gain.setValueAtTime(g0, t + Math.max(0.3, D - 0.4)); g.gain.exponentialRampToValueAtTime(0.0001, t + D);
  const a = osc(ac, 'triangle', hz, t, D + 0.1), b = osc(ac, 'sine', hz * 1.5, t, D + 0.1), c = osc(ac, 'sawtooth', hz * 1.003, t, D + 0.1), gc = ac.createGain(); gc.gain.value = 0.25;
  const gb = ac.createGain(); gb.gain.value = 0.35;
  const lp = filt(ac, 'lowpass', 900);
  a.connect(g); b.connect(gb); gb.connect(g); c.connect(gc); gc.connect(lp); lp.connect(g);
  g.connect(out);
  track(audio, a);
};

// ---- effects -----------------------------------------------------------------------------------------------------------------
const F = {};
F.pop = (audio, p, o) => { // soft wooden tap (UI)
  const { ac, t } = o, g0 = level(p, 0.3), out = bus(audio, ac, { pan: p.pan, wet: 0.06 });
  const s = osc(ac, 'sine', (p.hz ?? 520), t, 0.08); s.frequency.exponentialRampToValueAtTime((p.hz ?? 520) * 0.7, t + 0.05);
  const a = ac.createGain(); ad(a.gain, t, g0, 0.002, 0.06);
  chain(s, a).connect(out);
  const nz = noise(audio, ac, t, 0.03), nf = filt(ac, 'bandpass', 1800, 1), ng = ac.createGain(); ad(ng.gain, t, g0 * 0.3, 0.001, 0.012); chain(nz, nf, ng).connect(out);
  track(audio, s);
};
F.tick = (audio, p, o) => { // woodblock click for a metronome
  const { ac, t } = o, g0 = level(p, 0.3), out = bus(audio, ac, { pan: p.pan, wet: 0.04 });
  const hz = p.hz ?? 1500;
  const s = osc(ac, 'sine', hz, t, 0.06), a = ac.createGain(); ad(a.gain, t, g0, 0.001, 0.035);
  const s2 = osc(ac, 'sine', hz * 1.52, t, 0.04), a2 = ac.createGain(); ad(a2.gain, t, g0 * 0.4, 0.001, 0.02);
  chain(s, a).connect(out); chain(s2, a2).connect(out);
  track(audio, s);
};
F.thud = (audio, p, o) => V.stomp(audio, { ...p, hz: p.hz ?? 80 }, o);
F.impact = (audio, p, o) => { // something struck: mat wood | skin | metal | clay | stone
  const { ac, t } = o, g0 = level(p, 0.3), out = bus(audio, ac, { pan: p.pan, wet: 0.1 });
  const M = { wood: [220, 90, 0.1, 1800], skin: [140, 70, 0.14, 900], metal: [900, 600, 0.35, 5000], clay: [300, 160, 0.12, 2600], stone: [420, 250, 0.09, 3400] }[p.mat ?? 'wood'] ?? [220, 90, 0.1, 1800];
  const s = osc(ac, p.mat === 'metal' ? 'triangle' : 'sine', M[0] * (p.hz ? p.hz / 220 : 1), t, M[2] + 0.1); s.frequency.exponentialRampToValueAtTime(M[1], t + M[2]);
  const a = ac.createGain(); ad(a.gain, t, g0, 0.001, M[2]);
  chain(s, a).connect(out);
  const nz = noise(audio, ac, t, 0.08), nf = filt(ac, 'bandpass', M[3], 1), ng = ac.createGain(); ad(ng.gain, t, g0 * 0.6, 0.001, 0.04); chain(nz, nf, ng).connect(out);
  if (p.mat === 'metal') { const r = osc(ac, 'sine', 1760, t, 0.5), ra = ac.createGain(); ad(ra.gain, t, g0 * 0.25, 0.002, 0.4); chain(r, ra).connect(out); }
  track(audio, s);
};
F.splash = (audio, p, o) => {
  const { ac, t } = o, g0 = level(p, 0.45), out = bus(audio, ac, { pan: p.pan, wet: 0.16 });
  const nz = noise(audio, ac, t, 0.5), nf = filt(ac, 'bandpass', 3200, 0.9), ng = ac.createGain();
  nf.frequency.setValueAtTime(3600, t); nf.frequency.exponentialRampToValueAtTime(900, t + 0.35);
  ad(ng.gain, t, g0 * 0.8, 0.008, 0.3); chain(nz, nf, ng).connect(out);
  [0.05, 0.11, 0.19].forEach((dt, k) => { // bubbles
    const f = 500 + k * 230, s = osc(ac, 'sine', f, t + dt, 0.1), a = ac.createGain();
    s.frequency.exponentialRampToValueAtTime(f * 2, t + dt + 0.06); ad(a.gain, t + dt, g0 * 0.18, 0.004, 0.07); chain(s, a).connect(out);
  });
  track(audio, nz);
};
F.whoosh = (audio, p, o) => {
  const { ac, t } = o, g0 = level(p, 0.35), out = bus(audio, ac, { pan: p.pan, wet: 0.1 }), D = clamp(p.dur ?? 0.28, 0.1, 1.2);
  const nz = noise(audio, ac, t, D + 0.1), nf = filt(ac, 'bandpass', 500, 1.4), ng = ac.createGain();
  nf.frequency.setValueAtTime(p.down ? 2400 : 400, t); nf.frequency.exponentialRampToValueAtTime(p.down ? 350 : 2400, t + D);
  ng.gain.setValueAtTime(0.0001, t); ng.gain.linearRampToValueAtTime(g0, t + D * 0.45); ng.gain.exponentialRampToValueAtTime(0.0001, t + D);
  chain(nz, nf, ng).connect(out);
  track(audio, nz);
};
F.ring = (audio, p, o) => V.bell(audio, { ...p, hz: p.hz ?? 1320, dur: p.dur ?? 0.7, vel: (p.vel ?? 0.8) * 0.9 }, o);
F.chime = (audio, p, o) => {
  const hz = p.hz ?? 784;
  V.bell(audio, { ...p, hz, dur: 0.9, vel: (p.vel ?? 0.7) * 0.7 }, o);
  const o2 = open(audio, { ...p, delay: (p.delay ?? 0) + 0.09 });
  if (o2) V.bell(audio, { ...p, hz: hz * 1.5, dur: 0.9, vel: (p.vel ?? 0.7) * 0.55 }, o2);
};
F.good = (audio, p, o) => {
  const hz = p.hz ?? 660;
  V.bar(audio, { ...p, hz, dur: 0.35, vel: (p.vel ?? 0.7) * 0.8 }, o);
  const o2 = open(audio, { ...p, delay: (p.delay ?? 0) + 0.07 });
  if (o2) V.bar(audio, { ...p, hz: hz * 1.5, dur: 0.4, vel: (p.vel ?? 0.7) * 0.7 }, o2);
};
F.bad = (audio, p, o) => {
  const { ac, t } = o, g0 = level(p, 0.32), out = bus(audio, ac, { pan: p.pan, wet: 0.06 });
  const s = osc(ac, 'triangle', p.hz ?? 220, t, 0.28); s.frequency.exponentialRampToValueAtTime((p.hz ?? 220) * 0.62, t + 0.22);
  const lp = filt(ac, 'lowpass', 900, 0.7), a = ac.createGain(); ad(a.gain, t, g0, 0.006, 0.22);
  chain(s, lp, a).connect(out);
  track(audio, s);
};
F.sparkle = (audio, p, o) => {
  const hz = p.hz ?? 1568;
  [0, 0.05, 0.1].forEach((dt, k) => {
    const o2 = open(audio, { ...p, delay: (p.delay ?? 0) + dt });
    if (o2) V.bell(audio, { ...p, hz: hz * [1, 1.25, 1.5][k], dur: 0.45, vel: (p.vel ?? 0.6) * 0.45 }, o2);
  });
};
F.scrape = (audio, p, o) => { // chisel / brush / thread drawn over a surface
  const { ac, t } = o, g0 = level(p, 0.25), out = bus(audio, ac, { pan: p.pan, wet: 0.05 }), D = clamp(p.dur ?? 0.12, 0.04, 0.6);
  const nz = noise(audio, ac, t, D + 0.05), nf = filt(ac, 'bandpass', p.hz ?? 2400, 0.8), ng = ac.createGain();
  ng.gain.setValueAtTime(0.0001, t); ng.gain.linearRampToValueAtTime(g0, t + D * 0.3); ng.gain.exponentialRampToValueAtTime(0.0001, t + D);
  chain(nz, nf, ng).connect(out);
  track(audio, nz);
};
// speech blip: a vowel-like formant pair with a falling pitch (puppet speaking, one syllable)
F.blip = (audio, p, o) => {
  const { ac, t } = o, g0 = level(p, 0.3), out = bus(audio, ac, { pan: p.pan, wet: 0.08 });
  const f0 = p.hz ?? 180, v = (p.vowel ?? 0) % 5, D = clamp(p.dur ?? 0.09, 0.04, 0.3);
  const FORM = [[700, 1200], [500, 1900], [300, 2300], [450, 900], [320, 800]][v];
  const s = ac.createOscillator(); s.type = 'sawtooth'; s.frequency.setValueAtTime(f0 * 1.08, t); s.frequency.linearRampToValueAtTime(f0 * 0.92, t + D); s.start(t); s.stop(t + D + 0.05);
  const sum = ac.createGain();
  for (const f of FORM) { const bp = filt(ac, 'bandpass', f, 7), gg = ac.createGain(); gg.gain.value = 2.2; s.connect(bp); bp.connect(gg); gg.connect(sum); }
  const a = ac.createGain(); a.gain.setValueAtTime(0.0001, t); a.gain.linearRampToValueAtTime(g0, t + 0.012); a.gain.setValueAtTime(g0 * 0.85, t + D * 0.6); a.gain.exponentialRampToValueAtTime(0.0001, t + D + 0.02);
  chain(sum, a).connect(out);
  track(audio, s);
};
// murmur: a crowd or a muttering figure; syllabic amplitude modulation over formant-filtered noise
F.murmur = (audio, p, o) => {
  const { ac, t } = o, g0 = level(p, 0.18), out = bus(audio, ac, { pan: p.pan, wet: 0.12 }), D = clamp(p.dur ?? 0.5, 0.15, 3);
  const nz = noise(audio, ac, t, D + 0.1), f1 = filt(ac, 'bandpass', p.hz ?? 520, 4), f2 = filt(ac, 'bandpass', (p.hz ?? 520) * 2.6, 5), sum = ac.createGain();
  nz.connect(f1); nz.connect(f2); f1.connect(sum); f2.connect(sum);
  const am = osc(ac, 'sine', 5 + (p.rate ?? 0), t, D + 0.1), ag = ac.createGain(), mod = ac.createGain();
  ag.gain.value = 0.5; mod.gain.value = 0.5; am.connect(ag); ag.connect(mod.gain);
  const env = ac.createGain(); env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(g0 * 2.5, t + 0.06); env.gain.setValueAtTime(g0 * 2.5, t + Math.max(0.07, D - 0.1)); env.gain.exponentialRampToValueAtTime(0.0001, t + D);
  chain(sum, mod, env).connect(out);
  track(audio, nz);
};

// ---- public API ------------------------------------------------------------------------------------------------------------
export function voice(audio, kind, p = {}) {
  const fn = V[kind];
  if (!fn) return false;
  try {
    const o = open(audio, p);
    if (!o) return false;
    fn(audio, p, o);
    return true;
  } catch { return false; }
}
export function fx(audio, kind, p = {}) {
  const fn = F[kind];
  if (!fn) return false;
  try {
    const o = open(audio, p);
    if (!o) return false;
    fn(audio, p, o);
    return true;
  } catch { return false; }
}

// ---- automatic naturalising of plain tone() calls --------------------------------------------------------------------------
// Engines were written with audio.tone({ freq, to, dur, type, vol }). install(audio) makes the kit's tone() route every such call
// through this classifier, so ad-hoc beeps become soft wood taps, thuds, marimba notes, bell rings and whooshes instead of
// square-wave bleeps. A call can pin the voice with { voice: 'pluck'|..., inst } (rhythm does for glissando strings).
export function natural(audio, o) {
  const f = o.freq ?? 440, t = o.to ?? f, dur = o.dur ?? 0.12, type = o.type ?? 'sine', vol = o.vol ?? 0.2;
  const vel = clamp(vol / 0.4, 0.15, 1) * 0.95;
  if (o.voice && V[o.voice]) return voice(audio, o.voice, { hz: f, dur, vel, inst: o.inst });
  const falling = t < f * 0.9, rising = t > f * 1.12, harsh = type === 'square' || type === 'sawtooth';
  if (dur >= 0.3 && f >= 900 && type === 'sine') return fx(audio, 'ring', { hz: f, dur: Math.min(1.2, dur * 1.4), vel });
  if (f < 300 && falling) return harsh && dur < 0.12 ? fx(audio, 'impact', { mat: 'wood', hz: f * 1.3, vel }) : fx(audio, 'thud', { hz: f * 0.75, vel: Math.max(vel, 0.4) });
  if (harsh && dur < 0.1 && f >= 900) return fx(audio, 'tick', { hz: f * 0.85, vel: vel * 0.9 });
  if (harsh && f >= 900 && falling) return fx(audio, 'whoosh', { dur: Math.max(0.08, dur), down: true, vel });
  if (harsh && falling && dur >= 0.06) return fx(audio, 'impact', { mat: 'wood', hz: f, vel });
  if (falling && dur >= 0.1 && f >= 250 && f < 1000) return fx(audio, 'bad', { hz: f, vel });
  if (rising && dur >= 0.1 && f >= 450) return fx(audio, 'good', { hz: f, vel });
  if (dur >= 0.45 && f < 300 && type === 'sine') return voice(audio, 'pad', { hz: f, dur, vel });
  return voice(audio, 'bar', { hz: f, dur: clamp(dur * 2.5, 0.15, 0.9), vel: vel * 1.1 });
}
export function install(audio) {
  if (audio && !audio.naturalTone) audio.naturalTone = (o) => natural(audio, o);
}
export const KINDS = { voice: Object.keys(V), fx: Object.keys(F) };
// a play-through helper for offline checks (tools/synth-render.mjs): the same code on an OfflineAudioContext
export function offlineAudio(ac) {
  const out = ac.createGain(), send = ac.createGain();
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -16; comp.knee.value = 14; comp.ratio.value = 6; comp.attack.value = 0.004; comp.release.value = 0.18;
  const master = ac.createGain(); master.gain.value = 0.9;
  out.connect(comp); comp.connect(master); master.connect(ac.destination);
  const conv = ac.createConvolver(), len = Math.floor(ac.sampleRate * 1.6), buf = ac.createBuffer(2, len, ac.sampleRate);
  const r = lcg(7);
  for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (r() * 2 - 1) * Math.exp(-3.6 * i / len); }
  conv.buffer = buf; const wet = ac.createGain(); wet.gain.value = 0.22; send.connect(conv); conv.connect(wet); wet.connect(comp);
  const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), nd = nb.getChannelData(0), r2 = lcg(0x1234567);
  for (let i = 0; i < nd.length; i++) nd[i] = r2() * 2 - 1;
  return { muted: false, forceRun: true, context: ac, out, send, running: true, voices: 0, noise: () => nb, master };
}
void ln2;

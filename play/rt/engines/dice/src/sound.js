// Dice sounds, synthesised in the style of platform/engine-kit/synth.js (WebAudio only; a no-op without an AudioContext):
// the rattle of bone dice inside a leather cup, the pour, the knock of a die on felt or wood (a short noise click plus a damped
// body tone), the clack on the rail, a pencil or pen scratch, and bells for what the player achieved. Every sound belongs to an
// event on screen. Randomness comes from a local LCG seeded per call, never Math.random.
import { voice, fx } from '../../../platform/engine-kit/synth.js';

const lcg = (s) => () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
let counter = 1;
const open = (audio) => {
  if (!audio || audio.muted) return null;
  const ac = audio.context;
  if (!ac || (ac.state !== 'running' && !audio.forceRun) || (audio.voices ?? 0) > 34 || !audio.out) return null;
  return ac;
};
const clickBurst = (audio, ac, t, { hz = 3200, q = 1.2, dur = 0.02, vol = 0.3, pan = 0, body = 0, bodyDur = 0.05, type = 'sine' }) => {
  const src = ac.createBufferSource(); src.buffer = audio.noise(); src.loop = true;
  const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = hz; bp.Q.value = q;
  const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.0015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let last = g;
  src.connect(bp); bp.connect(g);
  if (pan && ac.createStereoPanner) { const sp = ac.createStereoPanner(); sp.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(sp); last = sp; }
  last.connect(audio.out);
  if (audio.send) { const w = ac.createGain(); w.gain.value = 0.1; last.connect(w); w.connect(audio.send); }
  src.start(t, (counter++ * 0.37) % 1.6); src.stop(t + dur + 0.02);
  audio.voices = (audio.voices ?? 0) + 1;
  src.addEventListener('ended', () => { audio.voices = Math.max(0, (audio.voices ?? 1) - 1); });
  if (body) {
    const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(body, t); o.frequency.exponentialRampToValueAtTime(body * 0.62, t + bodyDur);
    const og = ac.createGain(); og.gain.setValueAtTime(0.0001, t); og.gain.linearRampToValueAtTime(vol * 0.7, t + 0.002); og.gain.exponentialRampToValueAtTime(0.0001, t + bodyDur);
    o.connect(og); og.connect(last === g ? audio.out : last); o.start(t); o.stop(t + bodyDur + 0.02);
  }
};

const MAT = { felt: { hz: 1500, q: 0.8, body: 190, vol: 0.65, dur: 0.035, bodyDur: 0.07 }, wood: { hz: 3000, q: 1.1, body: 420, vol: 0.76, dur: 0.028, bodyDur: 0.055 }, cloth: { hz: 1200, q: 0.7, body: 150, vol: 0.53, dur: 0.04, bodyDur: 0.07 }, leather: { hz: 1800, q: 0.9, body: 230, vol: 0.65, dur: 0.035, bodyDur: 0.07 }, bowl: { hz: 2400, q: 1.4, body: 520, vol: 0.72, dur: 0.045, bodyDur: 0.09, type: 'triangle' } };

export const DICE_SOUND = {
  // bone dice jostling inside the cup: a dense run of tiny clicks that swells and fades
  rattle(audio, { n = 5, dur = 0.7, mat = 'leather' } = {}) {
    const ac = open(audio); if (!ac) return;
    const r = lcg(1000 + counter++), t0 = ac.currentTime + 0.01, count = 10 + n * 5;
    for (let k = 0; k < count; k++) {
      const u = k / count, t = t0 + u * dur * (0.9 + 0.1 * r());
      const swell = Math.sin(Math.min(1, u * 1.2) * Math.PI) * 0.8 + 0.2;
      clickBurst(audio, ac, t, { hz: 2600 + r() * 2600, q: 1.6, dur: 0.012 + r() * 0.01, vol: 0.1 + 0.16 * swell * r(), pan: (r() - 0.5) * 0.4, body: r() > 0.55 ? 900 + r() * 700 : 0, bodyDur: 0.02, type: 'triangle' });
    }
    // low leather hum of the cup being shaken
    fx(audio, 'scrape', { hz: 380, dur: dur * 0.9, vel: 0.12 });
  },
  pour(audio) { fx(audio, 'whoosh', { dur: 0.24, vel: 0.9 }); },
  knock(audio, { vel = 0.6, mat = 'felt', soft = false, pan = 0 } = {}) {
    const ac = open(audio); if (!ac) return;
    const m = MAT[mat] ?? MAT.felt, v = Math.max(0.12, Math.min(1, vel)) * (soft ? 0.55 : 1);
    const r = lcg(7 + counter++), t = ac.currentTime + 0.003 + r() * 0.004;
    clickBurst(audio, ac, t, { hz: m.hz * (0.85 + r() * 0.35), q: m.q, dur: m.dur, vol: m.vol * v, pan, body: m.body * (0.85 + r() * 0.4), bodyDur: m.bodyDur, type: m.type ?? 'sine' });
    if (v > 0.5 && mat !== 'felt') clickBurst(audio, ac, t + 0.004, { hz: 5200, q: 2, dur: 0.012, vol: m.vol * v * 0.5, pan });
  },
  rail(audio, { vel = 0.6, mat = 'wood' } = {}) { DICE_SOUND.knock(audio, { vel: vel * 1.1, mat: 'wood' }); fx(audio, 'impact', { mat: 'wood', hz: 260, vel: 0.7 * vel }); void mat; },
  write(audio) { fx(audio, 'scrape', { hz: 3400, dur: 0.22, vel: 0.95 }); },
  pencil(audio) { fx(audio, 'scrape', { hz: 2600, dur: 0.1, vel: 0.7 }); },
  keep(audio) { DICE_SOUND.knock(audio, { vel: 0.5, mat: 'wood', soft: true }); fx(audio, 'tick', { hz: 1200, vel: 0.8 }); },
  good(audio, k = 0) { voice(audio, 'bell', { hz: [660, 784, 988][k % 3], dur: 0.8, vel: 0.5 }); },
  great(audio) { [523, 659, 784, 1047].forEach((hz, i) => voice(audio, 'bell', { hz, delay: i * 0.09, dur: 1.1, vel: 0.5 })); fx(audio, 'sparkle', { hz: 1568, vel: 0.5, delay: 0.3 }); },
  bad(audio) { fx(audio, 'bad', { hz: 220, vel: 0.5 }); },
  bust(audio) { fx(audio, 'thud', { hz: 90, vel: 0.5 }); fx(audio, 'bad', { hz: 180, vel: 0.5, delay: 0.05 }); },
  cupDown(audio) { DICE_SOUND.knock(audio, { vel: 0.9, mat: 'leather' }); fx(audio, 'thud', { hz: 110, vel: 0.5 }); },
  cupLift(audio) { fx(audio, 'scrape', { hz: 900, dur: 0.18, vel: 0.3 }); },
};

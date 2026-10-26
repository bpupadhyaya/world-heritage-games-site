// shape-craft `pour`: sounds. Water is built from short band-passed noise chunks plus a resonance whose pitch rises with the fill level of the vessel
// (the air column above the tea gets shorter), laid end to end while a stream runs. Everything answers a player action or the stream that action
// started; nothing sounds on load or while idle. Deterministic (a local LCG fills the noise buffer); a no-op without an AudioContext.
import { fx as synth } from '../../../platform/engine-kit/synth.js';

let NOISE = null;
const noiseOf = (ac) => {
  if (NOISE && NOISE.sampleRate === ac.sampleRate) return NOISE;
  const n = Math.floor(ac.sampleRate * 1.2), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); let s = 0x2468ace;
  for (let i = 0; i < n; i++) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; d[i] = (s / 2147483648) - 1; }
  NOISE = b; return b;
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function createPourSound(audio, log, tag = 'pour') {
  const F = (kind, p) => { try { return synth(audio, kind, p); } catch { return false; } };
  const ready = () => { const ac = audio?.context; return !!(audio && !audio.muted && ac && audio.out && (ac.state === 'running' || audio.forceRun) && (audio.voices ?? 0) < 30); };
  let n = 0;
  // one chunk of falling water: noise through a resonant band-pass (the stream) and a soft sine at the vessel's air-column pitch
  const chunk = ({ hz, q = 4, vel = 0.3, dur = 0.13, tone = 0, toneVel = 0.1, pan = 0, wet = 0.1 }) => {
    if (!ready()) return false;
    try {
      const ac = audio.context, t = ac.currentTime + 0.005, src = ac.createBufferSource();
      src.buffer = noiseOf(ac); src.loop = true;
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = hz; bp.Q.value = q;
      const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel * 0.5, t + 0.025); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let last = g;
      if (pan && ac.createStereoPanner) { const sp = ac.createStereoPanner(); sp.pan.value = clamp(pan, -1, 1); g.connect(sp); last = sp; }
      src.connect(bp); bp.connect(g); last.connect(audio.out);
      if (audio.send) { const w = ac.createGain(); w.gain.value = wet; last.connect(w); w.connect(audio.send); }
      src.start(t, (n++ * 0.137) % 0.9); src.stop(t + dur + 0.04);
      audio.voices = (audio.voices ?? 0) + 1; src.addEventListener('ended', () => { audio.voices = Math.max(0, (audio.voices ?? 1) - 1); });
      if (tone > 0) {
        const o = ac.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(tone, t); o.frequency.linearRampToValueAtTime(tone * 1.012, t + dur);
        const og = ac.createGain(); og.gain.setValueAtTime(0.0001, t); og.gain.linearRampToValueAtTime(toneVel, t + 0.03); og.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(og); og.connect(audio.out); o.start(t); o.stop(t + dur + 0.04);
      }
      return true;
    } catch { return false; }
  };
  const L = (k, f) => (...a) => { log?.push({ kind: `${tag}.${k}` }); return f(...a); };
  return {
    // flow: 0..1 volume of the stream, fill: 0..1 how full the vessel is, drop: 0..1 how far it falls (brighter and breathier when far)
    stream: L('stream', (flow, fill, drop = 0.4, pan = 0) => {
      const f = clamp(fill, 0, 1), hz = 650 + 2900 * Math.pow(f, 1.25), q = 3 + 4 * f;
      chunk({ hz, q, vel: 0.22 + 0.55 * flow, dur: 0.14, tone: 210 + 780 * Math.pow(f, 1.1), toneVel: 0.03 + 0.05 * flow, pan });
      if (drop > 0.35) chunk({ hz: 4200 + 1500 * drop, q: 1.2, vel: 0.1 * flow * drop, dur: 0.1, pan });
    }),
    // a gentle thin stream (gongfu): higher, quieter, more tonal
    thin: L('thin', (flow, fill, pan = 0) => { const f = clamp(fill, 0, 1); chunk({ hz: 1500 + 3000 * f, q: 7 + 4 * f, vel: 0.12 + 0.32 * flow, dur: 0.16, tone: 420 + 1100 * f, toneVel: 0.04 + 0.05 * flow, pan }); }),
    drop: L('drop', (fill = 0.5, k = 0, pan = 0) => { const hz = 700 + 1800 * clamp(fill, 0, 1) + (k % 3) * 160; chunk({ hz, q: 12, vel: 0.28, dur: 0.1, tone: hz * 0.9, toneVel: 0.1, pan }); }),
    splat: L('splat', (v = 0.5) => F('splash', { vel: 0.3 + 0.3 * v })),
    rim: L('rim', (v = 0.5) => { F('tick', { hz: 2400, vel: 0.35 * v + 0.15 }); F('ring', { hz: 2800, dur: 0.25, vel: 0.14 * v }); }),
    glide: L('glide', () => { F('scrape', { hz: 900, dur: 0.12, vel: 0.2 }); F('impact', { mat: 'metal', hz: 700, vel: 0.12, delay: 0.1 }); }),
    lift: L('lift', () => { F('impact', { mat: 'metal', hz: 520, vel: 0.2 }); F('whoosh', { dur: 0.22, vel: 0.14, down: false }); }),
    flick: L('flick', () => { F('whoosh', { dur: 0.14, vel: 0.2, down: false }); F('tick', { hz: 2200, vel: 0.22 }); }),
    set: L('set', () => { F('impact', { mat: 'clay', hz: 280, vel: 0.28 }); F('tick', { hz: 1800, vel: 0.16, delay: 0.02 }); }),
    clink: L('clink', (hz = 3100, v = 0.3) => { F('ring', { hz, dur: 0.5, vel: v }); F('tick', { hz: hz * 0.7, vel: v * 0.6 }); }),
    mode: L('mode', () => F('tick', { hz: 1500, vel: 0.3 })),
    ding: L('ding', (hz = 1320) => F('chime', { hz, vel: 0.35 })),
    bad: L('bad', () => F('bad', { hz: 260, vel: 0.3 })),
    win: L('win', (stars) => { F('good', { hz: 660 + stars * 70, vel: 0.5 }); F('sparkle', { hz: 1500, vel: 0.4, delay: 0.1 }); }),
  };
}

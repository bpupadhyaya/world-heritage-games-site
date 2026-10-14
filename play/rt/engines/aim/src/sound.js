// Tradition-specific sounds for the aim engine: every event uses a voice that belongs to what is on screen
// (wood on wood, papier-mache and candy, iron ring on an iron wheel, a bow string and hoofbeats, a crowd).
// Uses the shared synth kit; without an AudioContext every call is a no-op. Deterministic: no Math.random.
import { voice, fx } from '../../../platform/engine-kit/synth.js';

const later = (audio, delay, kind, p) => fx(audio, kind, { ...p, delay });
const vlater = (audio, delay, kind, p) => voice(audio, kind, { ...p, delay });
const NOTES = [523, 587, 659, 784, 880, 988, 1175];

// hoofbeats: a three-beat canter (two quick, one long) repeated n times; softer and lower when far
export function hooves(audio, n = 2, vel = 0.5, start = 0) {
  const gap = 0.36;
  for (let k = 0; k < n; k++) {
    const b = start + k * gap;
    later(audio, b, 'thud', { hz: 74, vel: vel * 0.9 });
    later(audio, b + 0.1, 'thud', { hz: 82, vel: vel * 0.7 });
    later(audio, b + 0.19, 'thud', { hz: 90, vel });
  }
}
// crowd: murmur of voices with a short cheer (rising) and handclaps
export function cheer(audio, big = 0.5, delay = 0) {
  later(audio, delay, 'murmur', { hz: 640 + big * 220, dur: 0.5 + big * 0.7, vel: 0.35 + big * 0.4, rate: 2 });
  for (let k = 0; k < 2 + Math.round(big * 4); k++) vlater(audio, delay + 0.12 + k * 0.07, 'clap', { vel: 0.25 + big * 0.2, pan: ((k % 3) - 1) * 0.5 });
}
export function groan(audio, delay = 0) { later(audio, delay, 'murmur', { hz: 360, dur: 0.55, vel: 0.35, rate: -1 }); }

export const SOUND = {
  // piñata: stick whoosh, wood on papier-mache with paper tearing, candy rattling on the stones, children cheering
  pinataSwing: (a) => { fx(a, 'whoosh', { dur: 0.2, vel: 0.5 }); },
  pinataHit: (a, points, n = 0) => {
    fx(a, 'impact', { mat: 'wood', hz: 190, vel: 0.8 });
    later(a, 0.015, 'scrape', { hz: 3000, dur: 0.14, vel: 0.7 });
    for (let k = 0; k < 4 + points * 2; k++) later(a, 0.1 + k * 0.05, 'tick', { hz: 1900 + ((k * 7 + n * 5) % 9) * 260, vel: 0.35 });
    cheer(a, Math.min(1, points / 3), 0.12);
    if (points >= 3) later(a, 0.2, 'sparkle', { hz: 1568, vel: 0.5 });
  },
  pinataMiss: (a) => { fx(a, 'thud', { hz: 110, vel: 0.35 }); groan(a, 0.1); },
  // daruma otoshi: the hammer knocks, the piece skids out, the stack lands on itself with a wooden tok
  darumaSwing: (a) => { fx(a, 'whoosh', { dur: 0.1, vel: 0.35 }); },
  darumaClean: (a, power = 0.5) => {
    fx(a, 'impact', { mat: 'wood', hz: 330 + power * 80, vel: 0.95 });
    later(a, 0.03, 'tick', { hz: 2100, vel: 0.5 });
    later(a, 0.05, 'scrape', { hz: 1400, dur: 0.12, vel: 0.5 });
    later(a, 0.2, 'impact', { mat: 'wood', hz: 240, vel: 0.6 });     // the stack drops one level and lands
    later(a, 0.34, 'impact', { mat: 'wood', hz: 190, vel: 0.5 });    // the piece bounces on the tatami
  },
  darumaSoft: (a) => { fx(a, 'impact', { mat: 'wood', hz: 150, vel: 0.5 }); later(a, 0.06, 'thud', { hz: 90, vel: 0.35 }); },
  darumaHard: (a) => {
    fx(a, 'impact', { mat: 'wood', hz: 400, vel: 1 });
    for (let k = 0; k < 5; k++) later(a, 0.08 + k * 0.07, 'impact', { mat: 'wood', hz: 170 + (k % 3) * 60, vel: 0.65 - k * 0.08 });
    later(a, 0.06, 'thud', { hz: 70, vel: 0.7 });
  },
  darumaTopple: (a) => {
    for (let k = 0; k < 8; k++) later(a, k * 0.075, 'impact', { mat: 'wood', hz: 160 + ((k * 5) % 4) * 55, vel: 0.9 - k * 0.07 });
    later(a, 0.05, 'thud', { hz: 62, vel: 0.9 });
  },
  darumaHome: (a) => { fx(a, 'impact', { mat: 'wood', hz: 280, vel: 0.7 }); later(a, 0.18, 'chime', { hz: 784, vel: 0.8 }); cheer(a, 0.8, 0.3); },
  // ring tilting: hoofbeats on cobbles, iron ring clinking onto the lance, a bright ring and the street cheering
  alkaShoot: (a) => { hooves(a, 2, 0.5); fx(a, 'whoosh', { dur: 0.25, vel: 0.25, delay: 0.3 }); },
  alkaHit: (a, points) => {
    fx(a, 'impact', { mat: 'metal', hz: 1100 + points * 90, vel: 0.9 });
    later(a, 0.03, 'ring', { hz: 1760 + points * 110, dur: 0.8, vel: 0.7 });
    later(a, 0.1, 'ring', { hz: 2640, dur: 0.5, vel: 0.35 });
    cheer(a, Math.min(1, points / 4), 0.2);
  },
  alkaMiss: (a) => { fx(a, 'impact', { mat: 'wood', hz: 180, vel: 0.4 }); groan(a, 0.15); },
  // mounted archery: bow string twang, arrow hiss, hoofbeats under it; hide thud and a bright note on a hit
  archShoot: (a) => {
    voice(a, 'pluck', { hz: 147, vel: 0.9, inst: 'bow', dur: 0.4 });
    later(a, 0.02, 'whoosh', { dur: 0.3, vel: 0.3 });
    hooves(a, 2, 0.4, 0.05);
  },
  archHit: (a, points) => {
    fx(a, 'impact', { mat: 'skin', hz: 150, vel: 0.9 });
    later(a, 0.015, 'tick', { hz: 1300, vel: 0.5 });
    later(a, 0.08, 'good', { hz: NOTES[Math.min(NOTES.length - 1, 1 + points)], vel: 0.6 });
    if (points >= 4) cheer(a, 0.6, 0.18);
  },
  archMiss: (a) => { fx(a, 'thud', { hz: 95, vel: 0.35 }); later(a, 0.05, 'scrape', { hz: 1800, dur: 0.1, vel: 0.3 }); },
};

// audits (options.soundLog): every SOUND.* call is recorded when the engine was created with a log array (1.3.1)
export const soundTap = { log: null };
for (const k of Object.keys(SOUND)) { const f = SOUND[k]; SOUND[k] = (...a) => { soundTap.log?.push({ kind: k }); return f(...a); }; }

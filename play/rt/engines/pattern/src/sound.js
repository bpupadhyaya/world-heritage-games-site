// Sound of the pattern engine (1.6.0): every event is the craft's own physical sound through the shared synth voices
// (platform/engine-kit/synth.js: Karplus-Strong plucks, wooden bars, bells, filtered noise), never a bare beep.
//   - placing a stamp = the sound of that material being worked (thread pulled, wood tapped, tile set, bead dropped, brush stroke)
//     plus a soft note: each palette colour owns one degree of the tradition's scale, so a correct design plays a tune that repeats
//     with its symmetry (and a wrong colour is audibly "off the tune")
//   - choosing a colour sounds that colour's note, choosing a motif a soft tap of the material, undo/clear a short whisk
//   - checking: a rising chime for a good result, a low soft note otherwise; silence when nothing happens
// Pure audio: never reads or writes game state, never uses Math.random.
import { fx, voice, install } from '../../../platform/engine-kit/synth.js';

const SCALES = {
  major: [0, 2, 4, 7, 9, 12],          // major pentatonic (default: West Africa, Andes, India, Malay world, China)
  japan: [0, 2, 3, 7, 8, 12],          // hirajoshi (sashiko, temari, kumiko, karesansui)
  hijaz: [0, 1, 4, 5, 7, 8],           // hijaz (Persian, Arab and Palestinian crafts)
};
const SCALE_OF = [
  [/sashiko|temari|kumiko|karesansui|japan/i, 'japan'],
  [/carpet|persian|mashrabiya|zellij|tatreez|suzani|mosaic|arab|moroc/i, 'hijaz'],
];
const INST = { thread: 'harp', wax: 'harp', brush: 'harp', soft: 'harp', sugar: 'harp' };

// Material recipes. n = the colour's note (Hz), v = velocity 0..1, A = the audio object.
const RECIPE = {
  thread: (A, n, v) => { fx(A, 'scrape', { hz: 3600, dur: 0.1, vel: 0.5 * v }); voice(A, 'pluck', { hz: n, vel: 0.5 * v, inst: 'harp', dur: 0.5 }); },
  wood: (A, n, v) => { fx(A, 'impact', { mat: 'wood', hz: n * 0.8, vel: 0.7 * v }); voice(A, 'bar', { hz: n * 2, vel: 0.35 * v, dur: 0.4 }); },
  wax: (A, n, v) => { fx(A, 'scrape', { hz: 1500, dur: 0.18, vel: 0.35 * v }); fx(A, 'pop', { hz: 360, vel: 0.35 * v }); voice(A, 'pluck', { hz: n, vel: 0.35 * v, inst: 'harp', dur: 0.4 }); },
  stamp: (A, n, v) => { fx(A, 'impact', { mat: 'skin', hz: 150, vel: 0.85 * v }); fx(A, 'scrape', { hz: 2800, dur: 0.05, vel: 0.3 * v }); voice(A, 'bar', { hz: n, vel: 0.28 * v, dur: 0.35 }); },
  tile: (A, n, v) => { fx(A, 'impact', { mat: 'clay', hz: n * 1.4, vel: 0.65 * v }); fx(A, 'tick', { hz: 2600, vel: 0.35 * v }); voice(A, 'bar', { hz: n * 2, vel: 0.28 * v, dur: 0.35 }); },
  stone: (A, n, v) => { fx(A, 'impact', { mat: 'stone', hz: n * 0.7, vel: 0.8 * v }); voice(A, 'bar', { hz: n * 0.5, vel: 0.22 * v, dur: 0.3 }); },
  gravel: (A, n, v) => { fx(A, 'scrape', { hz: 2000, dur: 0.22, vel: 0.5 * v }); fx(A, 'scrape', { hz: 3400, dur: 0.14, vel: 0.3 * v, delay: 0.05 }); voice(A, 'bar', { hz: n * 0.5, vel: 0.18 * v, dur: 0.3 }); },
  brush: (A, n, v) => { fx(A, 'scrape', { hz: 1700, dur: 0.2, vel: 0.45 * v }); fx(A, 'pop', { hz: 300, vel: 0.3 * v }); voice(A, 'pluck', { hz: n, vel: 0.3 * v, inst: 'harp', dur: 0.4 }); },
  bead: (A, n, v) => { fx(A, 'tick', { hz: 3200, vel: 0.5 * v }); voice(A, 'bell', { hz: n * 4, vel: 0.35 * v, dur: 0.5 }); },
  sugar: (A, n, v) => { fx(A, 'scrape', { hz: 4200, dur: 0.12, vel: 0.3 * v }); voice(A, 'bell', { hz: n * 2, vel: 0.4 * v, dur: 0.7 }); },
  soft: (A, n, v) => { fx(A, 'scrape', { hz: 1200, dur: 0.14, vel: 0.3 * v }); voice(A, 'pluck', { hz: n, vel: 0.35 * v, inst: 'harp', dur: 0.4 }); },
  pop: (A, n, v) => { fx(A, 'pop', { hz: 520, vel: 0.5 * v }); voice(A, 'bar', { hz: n, vel: 0.3 * v, dur: 0.35 }); },
  default: (A, n, v) => { fx(A, 'impact', { mat: 'wood', hz: n * 0.8, vel: 0.6 * v }); voice(A, 'bar', { hz: n * 2, vel: 0.3 * v, dur: 0.4 }); },
};
// the sound of choosing a motif: a soft tap of the same material (no note)
const TAP = {
  thread: (A, i) => fx(A, 'scrape', { hz: 3000 + i * 160, dur: 0.05, vel: 0.35 }),
  wood: (A, i) => fx(A, 'tick', { hz: 900 + i * 70, vel: 0.5 }),
  stone: (A, i) => fx(A, 'impact', { mat: 'stone', hz: 320 + i * 20, vel: 0.35 }),
  gravel: (A, i) => fx(A, 'scrape', { hz: 2200 + i * 120, dur: 0.07, vel: 0.3 }),
  bead: (A, i) => fx(A, 'tick', { hz: 2800 + i * 120, vel: 0.35 }),
  tile: (A, i) => fx(A, 'tick', { hz: 2000 + i * 110, vel: 0.4 }),
};

export function makeSound(audio, sceneKey, sceneId = '') {
  if (audio) { try { install(audio); } catch { /* optional */ } }
  const key = RECIPE[sceneKey] ? sceneKey : 'default';
  const scaleName = (SCALE_OF.find(([re]) => re.test(sceneId)) ?? [null, 'major'])[1];
  const scale = SCALES[scaleName];
  const base = key === 'stone' || key === 'gravel' ? 130.81 : 261.63;       // lower register for heavy materials
  const note = (c) => base * 2 ** (scale[((c % scale.length) + scale.length) % scale.length] / 12);
  const A = audio;
  return {
    paint(c, vel = 1) { if (A) RECIPE[key](A, note(c), vel); },
    color(c) { if (A) voice(A, 'bar', { hz: note(c) * 2, vel: 0.45, dur: 0.35 }); },
    motif(i) { if (A) (TAP[key] ?? TAP.wood)(A, i); },
    undo() { if (A) fx(A, 'whoosh', { down: true, dur: 0.12, vel: 0.35 }); },
    clear() { if (A) fx(A, 'whoosh', { down: true, dur: 0.3, vel: 0.5 }); },
    done(stars) {
      if (!A) return;
      if (stars >= 1) { fx(A, 'good', { hz: note(0) * 2, vel: 0.8 }); if (stars >= 2) fx(A, 'chime', { hz: note(2) * 2, vel: 0.7, delay: 0.18 }); if (stars >= 3) fx(A, 'sparkle', { hz: note(4) * 4, vel: 0.7, delay: 0.4 }); }
      else fx(A, 'bad', { hz: 196, vel: 0.5 });
    },
  };
}

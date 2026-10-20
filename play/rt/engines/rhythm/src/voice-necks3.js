// Voices for the 1.17.0 Latin strings (own synthesis only): tuned recipes of the shared pluck voice (nylon and steel, plectrum tremolo, bass).
import { registerStrikeVoice } from './voice-registry.js';
const cents = (hz, c) => hz * 2 ** (c / 1200);
const PLUCK = {
  'lute-cuatro': { preset: { t60: 0.85, bright: 0.66, pos: 0.15, body: [[200, 3, 6], [900, 2.5, 4], [2400, 2, 3]], wet: 0.1 }, hard: 0.6, thump: 200, thumpV: 0.2 },
  'lute-tiple': { preset: { t60: 1.0, bright: 0.74, pos: 0.12, body: [[240, 3, 5], [1500, 2.5, 5], [3200, 2, 4]], wet: 0.14 }, hard: 0.7, double: 5, octave: 0.3 },
  'lute-bandola': { preset: { t60: 0.7, bright: 0.8, pos: 0.1, body: [[260, 3, 5], [1800, 2.5, 5]], wet: 0.1 }, hard: 0.95, double: 4 },
  'lute-jarana': { preset: { t60: 0.7, bright: 0.58, pos: 0.16, body: [[170, 3, 7], [800, 2.5, 4]], wet: 0.1 }, hard: 0.7, thump: 150, thumpV: 0.3 },
  'lute-guitarron': { preset: { t60: 1.2, bright: 0.34, pos: 0.2, body: [[90, 4, 9], [220, 3, 5]], wet: 0.12 }, hard: 0.6, thump: 80, thumpV: 0.3 },
};
for (const [kind, r] of Object.entries(PLUCK)) {
  registerStrikeVoice(kind, (c) => {
    const { audio, voice, hz, vel, dur } = c, d = Math.max(0.6, dur), v = vel * (r.vel ?? 1);
    voice(audio, 'pluck', { hz, vel: v, dur: d, inst: kind, preset: r.preset, hard: r.hard ?? 0.6 });
    if (r.double) voice(audio, 'pluck', { hz: cents(hz, r.double), vel: v * 0.55, dur: d, inst: kind, preset: r.preset, hard: r.hard ?? 0.6, delay: 0.006 });
    if (r.octave) voice(audio, 'pluck', { hz: hz * 2, vel: v * r.octave, dur: d * 0.7, inst: kind, preset: r.preset, hard: 0.7, delay: 0.004 });
    if (r.thump) voice(audio, 'drum', { hz: r.thump, vel: v * (r.thumpV ?? 0.35), dur: 0.12, style: 'frame' });
  });
}

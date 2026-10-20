// Voices for the 1.16.0 plucked lutes (own synthesis only): tuned recipes of the shared engine-kit pluck voice, one per tradition, with small
// layers (plectrum slap on a skin, doubled courses, sympathetic shimmer). Silent without an AudioContext; no Math.random, no clocks.
import { registerStrikeVoice } from './voice-registry.js';

const cents = (hz, c) => hz * 2 ** (c / 1200);
const PLUCK = {
  // Japan: the biwa is struck by a big wooden plectrum (a low, woody boom with a buzzing edge); the shamisen's plectrum slaps its skin (a bright snap);
  // the sanshin is picked with a horn nail (rounder, softer)
  'lute-biwa': { preset: { t60: 1.1, bright: 0.42, pos: 0.12, body: [[150, 3, 8], [520, 2.5, 4], [1800, 2, 3]], wet: 0.16 }, hard: 1.0, thump: 120, thumpV: 0.5, double: 3 },
  'lute-shamisen': { preset: { t60: 0.62, bright: 0.9, pos: 0.1, body: [[320, 3, 6], [1400, 2.5, 6], [3400, 2, 5]], wet: 0.1 }, hard: 1.0, thump: 340, thumpV: 0.45, shimmer: [2.01, 0.1] },
  'lute-sanshin': { preset: { t60: 0.8, bright: 0.58, pos: 0.14, body: [[260, 3, 6], [900, 2.5, 4]], wet: 0.12 }, hard: 0.7, thump: 230, thumpV: 0.25, double: 2 },
  // Vietnam and China: the moon lute rings glassy and short, doubled courses beating a hair apart
  'lute-moon': { preset: { t60: 0.7, bright: 0.84, pos: 0.1, body: [[420, 3, 4], [2600, 2.5, 6]], wet: 0.1 }, hard: 0.9, double: 4, shimmer: [3.0, 0.07] },
  // Central Asia: silk strings, a soft nasal voice with a long, quiet decay
  'lute-dutar': { preset: { t60: 1.3, bright: 0.4, pos: 0.2, body: [[240, 3, 6], [1100, 3, 5]], wet: 0.16 }, hard: 0.3, shimmer: [2.0, 0.05] },
  'lute-hasapi': { preset: { t60: 0.7, bright: 0.5, pos: 0.14, body: [[200, 3, 6], [900, 2.5, 4]], wet: 0.12 }, hard: 0.7, thump: 170, thumpV: 0.35, double: 7 },
  'lute-phin': { preset: { t60: 0.6, bright: 0.82, pos: 0.12, body: [[300, 3, 5], [2200, 2.5, 5]], wet: 0.1 }, hard: 0.85, double: 3, octave: 0.18 },
  'lute-gambus': { preset: { t60: 1.1, bright: 0.45, pos: 0.1, body: [[180, 3, 7], [700, 2.5, 4]], wet: 0.16 }, hard: 0.6, double: 6, shimmer: [2.0, 0.06] },
  'lute-tinh': { preset: { t60: 1.0, bright: 0.36, pos: 0.24, body: [[160, 3, 8], [600, 2.5, 3]], wet: 0.14 }, hard: 0.3, thump: 140, thumpV: 0.2 },
};
for (const [kind, r] of Object.entries(PLUCK)) {
  registerStrikeVoice(kind, (c) => {
    const { audio, voice, hz, vel, dur } = c, d = Math.max(0.6, dur), v = vel * (r.vel ?? 1);
    voice(audio, 'pluck', { hz, vel: v, dur: d, inst: kind, preset: r.preset, hard: r.hard ?? 0.6 });
    if (r.double) voice(audio, 'pluck', { hz: cents(hz, r.double), vel: v * 0.55, dur: d, inst: kind, preset: r.preset, hard: r.hard ?? 0.6, delay: 0.006 });
    if (r.octave) voice(audio, 'pluck', { hz: hz * 2, vel: v * r.octave, dur: d * 0.7, inst: kind, preset: r.preset, hard: 0.7, delay: 0.004 });
    if (r.shimmer) voice(audio, 'pluck', { hz: hz * r.shimmer[0], vel: v * r.shimmer[1], dur: d * 0.8, inst: kind, preset: { ...r.preset, bright: 0.3 }, delay: 0.01 });
    if (r.thump) voice(audio, 'drum', { hz: r.thump, vel: v * (r.thumpV ?? 0.35), dur: 0.12, style: 'frame' });
  });
}

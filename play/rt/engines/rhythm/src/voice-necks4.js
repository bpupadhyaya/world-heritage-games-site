// Voices for the 1.22.0 folk lutes and fiddles (own synthesis only): tuned recipes of the shared pluck and bow voices.
import { registerStrikeVoice } from './voice-registry.js';
const PLUCK = {
  'lute-ngoni': { preset: { t60: 0.55, bright: 0.5, pos: 0.18, body: [[160, 3, 7], [700, 2.5, 4]], wet: 0.08 }, hard: 0.55, thump: 130, thumpV: 0.3 },
  'lute-garaya': { preset: { t60: 0.7, bright: 0.45, pos: 0.2, body: [[120, 4, 8], [420, 3, 5]], wet: 0.1 }, hard: 0.5, thump: 110, thumpV: 0.35, jingle: true },
};
for (const [kind, r] of Object.entries(PLUCK)) {
  registerStrikeVoice(kind, (c) => {
    const { audio, voice, hz, vel, dur } = c, d = Math.max(0.5, dur);
    voice(audio, 'pluck', { hz, vel, dur: d, inst: kind, preset: r.preset, hard: r.hard });
    if (r.thump) voice(audio, 'drum', { hz: r.thump, vel: vel * r.thumpV, dur: 0.1, style: 'frame' });
    if (r.jingle) voice(audio, 'pluck', { hz: hz * 6.1, vel: vel * 0.05, dur: 0.25, inst: kind, hard: 0.9, delay: 0.01 });
  });
}
const BOW = {
  'bow-ravanahatha': { preset: { f: [[420, 5, 9], [1300, 5, 8]], lp: 4200, vib: 4.6, vd: 9, att: 0.1, noise: 0.16 } },
  'bow-jouhikko': { preset: { f: [[380, 5, 9], [1100, 5, 8], [2400, 4, 5]], lp: 3800, vib: 4.2, vd: 8, att: 0.12, noise: 0.2 }, drone: 1.5 },
  'bow-tromba': { preset: { f: [[900, 4, 8], [2600, 4, 7], [4200, 3, 6]], lp: 6500, vib: 0, vd: 0, att: 0.07, noise: 0.1 }, buzz: true },
};
for (const [kind, r] of Object.entries(BOW)) {
  registerStrikeVoice(kind, (c) => {
    const { audio, voice, hz, vel, dur } = c, d = Math.max(0.5, dur);
    voice(audio, 'bow', { hz, vel, dur: d, inst: kind, preset: r.preset });
    if (r.drone) voice(audio, 'bow', { hz: hz * 1.5, vel: vel * 0.22, dur: d, inst: kind, preset: r.preset, delay: 0.01 });
    if (r.buzz) voice(audio, 'bow', { hz: hz * 2.003, vel: vel * 0.3, dur: d, inst: kind, preset: r.preset, delay: 0.004 });
  });
}

// Voices for the 1.18.0 bowed fiddles (own synthesis only): tuned recipes of the shared bow voice (formants, vibrato, bow noise).
import { registerStrikeVoice } from './voice-registry.js';
const BOW = {
  'bow-gusle': { preset: { f: [[320, 5, 9], [900, 4, 7]], lp: 2800, vib: 3.6, vd: 6, att: 0.14, noise: 0.24 } },
  'bow-gadulka': { preset: { f: [[520, 5, 9], [1500, 5, 9], [2800, 4, 5]], lp: 5200, vib: 5.0, vd: 10, att: 0.09, noise: 0.08 }, sympa: 2.0 },
  'bow-haegeum': { preset: { f: [[700, 6, 10], [1900, 5, 9], [3200, 4, 5]], lp: 6000, vib: 5.6, vd: 22, att: 0.12, noise: 0.05 } },
};
for (const [kind, r] of Object.entries(BOW)) {
  registerStrikeVoice(kind, (c) => {
    const { audio, voice, hz, vel, dur } = c, d = Math.max(0.5, dur);
    voice(audio, 'bow', { hz, vel, dur: d, inst: kind, preset: r.preset });
    if (r.sympa) voice(audio, 'pluck', { hz: hz * r.sympa, vel: vel * 0.07, dur: d * 1.4, inst: 'harp', hard: 0.2, delay: 0.03 });
  });
}

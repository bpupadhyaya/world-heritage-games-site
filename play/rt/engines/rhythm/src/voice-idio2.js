// Voices for the 1.26.0 Bells & Log Drums stages (ekwe box slit drum, agogo forged-iron slab bells, great bell with a swinging log). Own synthesis through the
// existing `bronze` and `woodtok` recipes; silent without an AudioContext; no Math.random and no clock.
import { registerStrikeVoice } from './voice-registry.js';
import { defVoice } from './voice-synth2.js';

const bronze = (kind, p) => registerStrikeVoice(kind, (c) => c.evoice(c.audio, 'bronze', { ...p, hz: (p.mul ?? 1) * c.hz, vel: c.vel }));

// ekwe: a hollowed box of hard wood. Each tongue beside the slit has its own pitch: the thick near lip is a deep hollow knock, the thin far lip a higher
// tick with an overtone, the front of the box a dry tap and the end a hard click.
defVoice('gx-ekwe-low', 'woodtok', { dur: 0.52, gain: 0.72, hollow: 0.9, overtone: 1.7, wet: 0.1 });
defVoice('gx-ekwe-high', 'woodtok', { dur: 0.36, gain: 0.64, hollow: 1.25, overtone: 2.5, wet: 0.1 });
defVoice('gx-ekwe-body', 'woodtok', { dur: 0.2, gain: 0.55, hollow: 2.4, overtone: 2.0, wet: 0.08 });
defVoice('gx-ekwe-rim', 'woodtok', { dur: 0.11, gain: 0.5, hollow: 4, overtone: 3.1, wet: 0.06 });

// agogo: four slabs of forged iron, welded from two plates: a short, bright, dry ring with a hard tick, each one a little duller as it gets taller.
const SLAB = (k, o) => bronze(`gx-agogo-${k}`, { dur: 0.7 + o * 0.25, beat: 0.6 + o * 0.5, gain: 0.4, wet: 0.08, partials: [[1, 1, 1], [2.32, 0.55 - o * 0.1, 0.5], [4.15, 0.38, 0.32], [6.3, 0.24 - o * 0.04, 0.22]], click: { f: 3600 - o * 500, q: 1.4, dur: 0.02, gain: 0.7 } });
SLAB('a', 0); SLAB('b', 1); SLAB('c', 2); SLAB('d', 3);

// great bell: a big bronze bell struck by a hung log. Lip: a deep hum that lasts and slowly beats; waist: fuller and brighter; shoulder: higher; boss: a short bright blow.
bronze('gx-greatbell-lip', { dur: 5.2, swell: 0.02, beat: 0.7, gain: 0.42, wet: 0.3, partials: [[1, 1, 1], [2.0, 0.7, 0.9], [2.42, 0.5, 0.8], [3.0, 0.42, 0.6], [4.13, 0.3, 0.45], [5.4, 0.2, 0.3]], click: { f: 700, q: 1, dur: 0.06, gain: 0.55 } });
bronze('gx-greatbell-waist', { dur: 3.4, swell: 0.012, beat: 1.1, gain: 0.4, wet: 0.26, mul: 1.5, partials: [[1, 1, 1], [2.0, 0.6, 0.8], [2.76, 0.5, 0.6], [4.2, 0.3, 0.4], [5.8, 0.2, 0.3]], click: { f: 900, q: 1, dur: 0.05, gain: 0.5 } });
bronze('gx-greatbell-shoulder', { dur: 1.8, beat: 1.6, gain: 0.38, wet: 0.2, mul: 2, partials: [[1, 1, 1], [2.4, 0.5, 0.6], [3.9, 0.35, 0.4], [6.1, 0.2, 0.25]], click: { f: 1500, q: 1, dur: 0.04, gain: 0.5 } });
bronze('gx-greatbell-boss', { dur: 1.1, gain: 0.38, wet: 0.14, mul: 2.5, partials: [[1, 1, 1], [2.6, 0.45, 0.5], [4.4, 0.3, 0.3]], click: { f: 2600, q: 1.2, dur: 0.03, gain: 0.7 } });

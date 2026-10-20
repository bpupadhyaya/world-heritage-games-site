// Voices for the 1.27.0 stages (ikoro standing log, obrom lying log with two hollows, adomba brass cup bells). Own synthesis through the existing `woodtok` and
// `bronze` recipes; silent without an AudioContext; no Math.random and no clock.
import { registerStrikeVoice } from './voice-registry.js';
import { defVoice } from './voice-synth2.js';

const bronze = (kind, p) => registerStrikeVoice(kind, (c) => c.evoice(c.audio, 'bronze', { ...p, hz: (p.mul ?? 1) * c.hz, vel: c.vel }));

// ikoro: a tall hollow trunk: deep, long, booming knocks (a big air column); the thin lip a little higher and shorter.
defVoice('gx-ikoro-low', 'woodtok', { dur: 0.95, gain: 0.78, hollow: 0.55, overtone: 1.5, wet: 0.2 });
defVoice('gx-ikoro-high', 'woodtok', { dur: 0.7, gain: 0.7, hollow: 0.8, overtone: 1.9, wet: 0.2 });
defVoice('gx-ikoro-body', 'woodtok', { dur: 0.3, gain: 0.55, hollow: 1.6, overtone: 2.2, wet: 0.14 });
defVoice('gx-ikoro-rim', 'woodtok', { dur: 0.14, gain: 0.5, hollow: 3.4, overtone: 3.0, wet: 0.1 });

// obrom: a lying log with two hollows joined by a channel: two clear pitches that ring a little in the channel, a dry side knock, a hard end tick.
defVoice('gx-obrom-low', 'woodtok', { dur: 0.6, gain: 0.74, hollow: 0.8, overtone: 1.3, wet: 0.12 });
defVoice('gx-obrom-high', 'woodtok', { dur: 0.46, gain: 0.7, hollow: 1.1, overtone: 1.35, wet: 0.12 });
defVoice('gx-obrom-body', 'woodtok', { dur: 0.22, gain: 0.55, hollow: 2.0, overtone: 2.0, wet: 0.08 });
defVoice('gx-obrom-rim', 'woodtok', { dur: 0.1, gain: 0.5, hollow: 4.4, overtone: 3.4, wet: 0.06 });

// adomba: cast brass cup bells with a swinging iron clapper: a bright ringing strike with a clapper tick; the smaller the bell, the higher and shorter.
const CUP = (k, o) => bronze(`gx-adomba-${k}`, { dur: 1.9 - o * 0.35, beat: 2.2 + o * 0.8, gain: 0.4, wet: 0.14, mul: 1, partials: [[1, 1, 1], [2.05, 0.55, 0.7], [2.78, 0.42, 0.5], [4.4, 0.28, 0.35], [6.2, 0.18, 0.22]], click: { f: 2200 + o * 600, q: 1.3, dur: 0.03, gain: 0.7 } });
CUP('big', 0); CUP('mid', 1); CUP('small', 2); CUP('tiny', 3);

// phye ghan: a tall iron bell with a wooden paddle clapper: a dark, slow ring; the paddle alone is a dry wooden tock.
const IR = (k, o, mul) => bronze(`gx-windbell-${k}`, { dur: 2.6 - o * 0.4, beat: 1.4 + o * 0.5, gain: 0.38, wet: 0.22, mul, partials: [[1, 1, 1], [2.3, 0.5, 0.7], [3.4, 0.36, 0.5], [5.1, 0.24, 0.3]], click: { f: 1100 + o * 500, q: 1.1, dur: 0.05, gain: 0.55 } });
IR('lip', 0, 1); IR('waist', 1, 1.4); IR('shoulder', 2, 1.9);
defVoice('gx-windbell-paddle', 'woodtok', { dur: 0.16, gain: 0.55, hollow: 3.2, overtone: 2.6, wet: 0.1 });

// Stroke tables for the folk-dance stages (1.11.0): each kind is what a stage's voiceOf returns; every row is a recipe of voice-synth2.js
// (hardwood sticks, bamboo poles, bare and shod feet, ankle bells, claps, cloth, small drums). Own synthesis only.
import { registerStrikeVoice } from './voice-registry.js';
import { defVoice } from './voice-synth2.js';
import { MEM } from './voice-drums.js';

const pair = (kind, a, b, gap) => registerStrikeVoice(kind, (c) => { c.evoice(c.audio, 'woodtok', { ...a, vel: c.vel }); return c.evoice(c.audio, 'woodtok', { ...b, vel: c.vel * 0.75, delay: gap }); });

// ---- stick circle (Tharu): hardwood sticks meeting; the low meeting is a lower, heavier clack; the turn is a bare-foot stamp -----------------------------
defVoice('dance-sticks-strike', 'woodtok', { hz: 1050, dur: 0.07, gain: 0.55, hollow: 1.8, overtone: 3.1 });
pair('dance-sticks-cross', { hz: 900, dur: 0.06, gain: 0.5, hollow: 1.6 }, { hz: 1180, dur: 0.06, gain: 0.5, hollow: 1.6 }, 0.034);
defVoice('dance-sticks-low', 'woodtok', { hz: 640, dur: 0.1, gain: 0.58, hollow: 1.3, overtone: 2.6 });
defVoice('dance-sticks-turn', 'foot', { hz: 95, floor: 'earth', shoe: 'bare', gain: 0.9, dur: 0.18 });
// ---- attan: the dhol under the round dance, claps, bare steps, cloth, hops ------------------------------------------------------------------------------
defVoice('dance-attan-dhol', 'skin', { dur: 0.4, drop: 1.6, glide: 0.065, modes: [[1, 1, 1], [1.5, 0.5, 0.6], [2.1, 0.3, 0.4]], shell: { f: 150, q: 4, gain: 0.6, dur: 0.2 }, click: { f: 1400, gain: 0.4 }, lp: 1600, gain: 0.74 });
defVoice('dance-attan-clap', 'clap', { style: 'clara', gain: 1.2 });
defVoice('dance-attan-step', 'foot', { hz: 100, floor: 'earth', shoe: 'soft', gain: 0.85 });
defVoice('dance-attan-spin', 'swish', { f0: 1200, f1: 3600, dur: 0.32, gain: 0.34 });
registerStrikeVoice('dance-attan-hop', (c) => { c.evoice(c.audio, 'foot', { hz: 80, floor: 'earth', shoe: 'soft', gain: 1.0, vel: c.vel }); return c.evoice(c.audio, 'swish', { f0: 1500, f1: 3000, dur: 0.18, gain: 0.2, vel: c.vel, delay: 0.01 }); });
void MEM;

// ---- sword dance: shoes on a stage floor (the swords are silent): toe taps, heel beats, the spring and the high cut ----------------------------------------
defVoice('dance-sword-top', 'foot', { hz: 140, floor: 'wood', shoe: 'hard', gain: 0.5, dur: 0.1 });
defVoice('dance-sword-bottom', 'foot', { hz: 110, floor: 'wood', shoe: 'hard', gain: 0.55, dur: 0.12 });
defVoice('dance-sword-left', 'foot', { hz: 125, floor: 'wood', shoe: 'hard', gain: 0.52, dur: 0.11 });
defVoice('dance-sword-right', 'foot', { hz: 150, floor: 'wood', shoe: 'hard', gain: 0.52, dur: 0.11 });
registerStrikeVoice('dance-sword-center', (c) => { c.evoice(c.audio, 'foot', { hz: 90, floor: 'wood', shoe: 'hard', gain: 0.75, dur: 0.18, vel: c.vel }); return c.evoice(c.audio, 'metal', { hz: 2400, dur: 0.18, partials: [[1, 1, 1], [2.4, 0.5, 0.6], [4.1, 0.3, 0.4]], gain: 0.07, strike: 0, vel: c.vel, delay: 0.002 }); });
// ---- eskista: a small kebero skin drum answers each shoulder, chest or neck, with a cloth swish under it --------------------------------------------------------
const kebero = (kind, hz, o = {}) => registerStrikeVoice(kind, (c) => { c.evoice(c.audio, 'skin', { hz, dur: o.dur ?? 0.16, drop: 1.25, modes: [[1, 1, 1], [1.59, 0.45, 0.6], [2.14, 0.25, 0.4]], click: { f: o.click ?? 2200, gain: 0.45 }, lp: 4200, gain: o.gain ?? 0.5, vel: c.vel }); return c.evoice(c.audio, 'swish', { f0: 900, f1: 2600, dur: 0.14, gain: 0.07, vel: c.vel, delay: 0.002 }); });
kebero('dance-shoulder-ls', 150); kebero('dance-shoulder-rs', 190); kebero('dance-shoulder-ch', 110, { dur: 0.22, gain: 0.6, click: 1200 }); kebero('dance-shoulder-bk', 130, { dur: 0.12 }); kebero('dance-shoulder-nk', 260, { dur: 0.1, click: 3000 });
// ---- palmas: sorda (cupped, hollow), clara (flat, sharp), pitos (snaps), golpe (a slap on the thigh) -------------------------------------------------------------
defVoice('dance-palmas-sorda', 'clap', { style: 'sorda', gain: 1.3 });
defVoice('dance-palmas-clara', 'clap', { style: 'clara', gain: 1.3 });
defVoice('dance-palmas-pitos', 'clap', { style: 'snap', gain: 1.2 });
defVoice('dance-palmas-golpe', 'skin', { hz: 150, dur: 0.1, drop: 1.4, modes: [[1, 1, 1], [1.8, 0.3, 0.5]], click: { f: 1600, gain: 0.6 }, lp: 2400, gain: 0.5 });
// ---- kathak: bare feet on marble with ankle bells ---------------------------------------------------------------------------------------------------------------
defVoice('dance-kathak-right', 'foot', { hz: 120, floor: 'stone', shoe: 'bare', gain: 0.55, bells: true });
defVoice('dance-kathak-left', 'foot', { hz: 105, floor: 'stone', shoe: 'bare', gain: 0.5, bells: true });
defVoice('dance-kathak-heel', 'foot', { hz: 85, floor: 'stone', shoe: 'hard', gain: 0.62, bells: true, dur: 0.2 });
defVoice('dance-kathak-both', 'foot', { hz: 80, floor: 'stone', shoe: 'bare', gain: 0.75, bells: true, dur: 0.24 });

// ---- tinikling: bamboo poles on their blocks and against each other; bare feet between them -------------------------------------------------------------------
defVoice('dance-poles-tap', 'woodtok', { hz: 520, dur: 0.13, gain: 0.55, hollow: 1.1, overtone: 2.2 });
pair('dance-poles-clap', { hz: 460, dur: 0.12, gain: 0.55, hollow: 1.1, overtone: 2.2 }, { hz: 640, dur: 0.1, gain: 0.5, hollow: 1.1, overtone: 2.2 }, 0.012);
defVoice('dance-poles-in', 'foot', { hz: 150, floor: 'wood', shoe: 'bare', gain: 0.85, dur: 0.12 });
defVoice('dance-poles-out', 'foot', { hz: 180, floor: 'wood', shoe: 'bare', gain: 0.75, dur: 0.1 });
// ---- Morris: shoes on grass with shin bells, hankies flicked, hardwood sticks clashing, the caper's landing --------------------------------------------------------
defVoice('dance-morris-step', 'foot', { hz: 110, floor: 'earth', shoe: 'soft', gain: 0.85, bells: true, dur: 0.12 });
defVoice('dance-morris-hanky', 'swish', { f0: 1100, f1: 3200, dur: 0.22, gain: 0.45 });
pair('dance-morris-clash', { hz: 880, dur: 0.07, gain: 0.6, hollow: 1.8, overtone: 3.0 }, { hz: 1150, dur: 0.06, gain: 0.5, hollow: 1.8, overtone: 3.0 }, 0.008);
defVoice('dance-morris-caper', 'foot', { hz: 90, floor: 'earth', shoe: 'hard', gain: 0.75, bells: true, dur: 0.2 });
// ---- indlamu: bare feet stamped hard on the earth, a high kick, the cowhide shield, the clap ------------------------------------------------------------------------------
defVoice('dance-indlamu-stomp', 'foot', { hz: 62, floor: 'earth', shoe: 'bare', gain: 1.15, dur: 0.24 });
registerStrikeVoice('dance-indlamu-kick', (c) => { c.evoice(c.audio, 'swish', { f0: 700, f1: 2400, dur: 0.18, gain: 0.1, vel: c.vel }); return c.evoice(c.audio, 'foot', { hz: 75, floor: 'earth', shoe: 'bare', gain: 0.6, dur: 0.2, vel: c.vel, delay: 0.1 }); });
registerStrikeVoice('dance-indlamu-shield', (c) => { c.evoice(c.audio, 'skin', { hz: 140, dur: 0.14, drop: 1.3, modes: [[1, 1, 1], [1.7, 0.4, 0.5]], click: { f: 1500, gain: 0.5 }, lp: 2600, gain: 0.55, vel: c.vel }); return c.evoice(c.audio, 'woodtok', { hz: 700, dur: 0.05, gain: 0.3, vel: c.vel, delay: 0.004 }); });
defVoice('dance-indlamu-clap', 'clap', { style: 'clara', gain: 1.3 });

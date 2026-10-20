// Stroke tables for the hand-drum stages (1.11.0): each kind is what a stage's voiceOf returns; every row is a recipe of voice-synth2.js.
import { registerStrikeVoice } from './voice-registry.js';
import { defVoice } from './voice-synth2.js';

const H5 = [[1, 1, 1], [2, 0.62, 0.8], [3, 0.4, 0.6], [4, 0.24, 0.45], [5, 0.14, 0.35]];   // a paste-loaded head rings in near-harmonic overtones
const MEM = [[1, 1, 1], [1.59, 0.7, 0.7], [2.14, 0.5, 0.55], [2.3, 0.4, 0.5], [2.65, 0.3, 0.4]];   // a plain head: the inharmonic modes of a circular membrane
export { H5, MEM };

// ---- BARREL DRUMS --------------------------------------------------------------------------------------------------------------------------
// madal: left head dressed with dough = short deep bass; right head with layered black paste = ringing; edge = quick open slap; shell = knuckle knock
defVoice('barrel-madal-lc', 'skin', { dur: 0.3, drop: 1.45, glide: 0.06, modes: [[1, 1, 1], [1.6, 0.4, 0.5], [2.3, 0.2, 0.35]], shell: { f: 200, q: 5, gain: 0.5, dur: 0.14 }, click: { f: 900, gain: 0.35 }, lp: 1800, gain: 0.62 });
defVoice('barrel-madal-rc', 'skin', { dur: 0.55, drop: 1.12, glide: 0.03, modes: H5, click: { f: 2600, gain: 0.25 }, shell: { f: 340, q: 5, gain: 0.25 }, gain: 0.5 });
defVoice('barrel-madal-re', 'skin', { dur: 0.16, drop: 1.18, modes: MEM, click: { f: 3400, gain: 0.5 }, lp: 6000, gain: 0.46 });
defVoice('barrel-madal-sh', 'woodtok', { dur: 0.07, gain: 0.5, hollow: 1.6 });
// dhol: thick stick on the big head = deep, long boom; thin cane on the small head = hard, quick crack; rim = stick on the hoop
defVoice('barrel-dhol-lc', 'skin', { dur: 0.42, drop: 1.7, glide: 0.07, modes: [[1, 1, 1], [1.5, 0.5, 0.6], [2.1, 0.3, 0.4]], shell: { f: 150, q: 4, gain: 0.7, dur: 0.2 }, click: { f: 1400, gain: 0.45 }, lp: 1500, gain: 0.78 });
defVoice('barrel-dhol-rc', 'skin', { dur: 0.12, drop: 1.2, glide: 0.02, modes: MEM, click: { f: 4400, q: 1, gain: 0.8, dur: 0.02 }, lp: 8500, gain: 0.44 });
defVoice('barrel-dhol-le', 'woodtok', { dur: 0.05, gain: 0.55, hollow: 2.2, overtone: 3.4 });
defVoice('barrel-dhol-re', 'skin', { dur: 0.14, drop: 1.15, modes: MEM, click: { f: 3800, gain: 0.7 }, gain: 0.42 });
defVoice('barrel-dhol-sh', 'woodtok', { dur: 0.08, gain: 0.48, hollow: 1.4 });
// mridangam: thom = open bass on the left head with a rising bend; din = clear, long ring on the right head; ki = quick pitched tap; ta = flat slap on the rim
defVoice('barrel-mridangam-lc', 'skin', { dur: 0.55, rise: 0.8, glide: 0.12, modes: [[1, 1, 1], [2, 0.3, 0.5], [3, 0.12, 0.35]], shell: { f: 170, q: 5, gain: 0.4 }, lp: 1500, gain: 0.7 });
defVoice('barrel-mridangam-rc', 'skin', { dur: 0.1, drop: 1.05, modes: [[1, 1, 1], [2, 0.8, 0.8], [3, 0.5, 0.6], [4, 0.3, 0.5]], click: { f: 3000, gain: 0.5 }, gain: 0.45 });
defVoice('barrel-mridangam-re', 'skin', { dur: 1.0, drop: 1.03, glide: 0.02, modes: [[1, 1, 1], [2, 0.85, 0.9], [3, 0.65, 0.8], [4, 0.45, 0.7], [5, 0.3, 0.6], [6, 0.18, 0.5]], click: { f: 3200, gain: 0.25 }, gain: 0.4 });
defVoice('barrel-mridangam-rr', 'skin', { dur: 0.17, drop: 1.12, modes: [[1, 1, 1], [1.7, 0.7, 0.6], [2.6, 0.5, 0.4]], click: { f: 3600, q: 0.9, gain: 0.9 }, gain: 0.42 });
defVoice('barrel-mridangam-le', 'woodtok', { dur: 0.06, gain: 0.4 });
defVoice('barrel-mridangam-sh', 'woodtok', { dur: 0.08, gain: 0.45, hollow: 1.3 });


// ---- HOURGLASS (talking drum): the pitch glides from the previous stroke of the phrase to this one (the squeeze of the cords) --------------
const lastTalk = new WeakMap();
registerStrikeVoice('talk-squeeze', (c) => {
  const now = c.audio?.context?.currentTime ?? 0, prev = c.audio ? lastTalk.get(c.audio) : null;
  const from = prev && now - prev.t < 1.1 ? prev.hz : c.hz * 0.82;
  if (c.audio) lastTalk.set(c.audio, { hz: c.hz, t: now });
  return c.evoice(c.audio, 'skin', { hz: c.hz, fromHz: from, glide: 0.16, dur: 0.46, modes: [[1, 1, 1], [2, 0.5, 0.8], [3, 0.28, 0.6]], click: { f: 2200, gain: 0.3 }, shell: { f: 260, q: 4, gain: 0.3 }, gain: 0.5, vel: c.vel });
});
defVoice('talk-open', 'skin', { dur: 0.3, drop: 1.2, modes: [[1, 1, 1], [1.6, 0.4, 0.6], [2.3, 0.25, 0.5]], click: { f: 2800, gain: 0.5 }, lp: 5000, gain: 0.5 });

// ---- CAJON: a thin plate over a wooden box with snare wires inside the top ------------------------------------------------------------------
defVoice('cajon-bass', 'skin', { dur: 0.24, drop: 1.7, glide: 0.05, modes: [[1, 1, 1], [1.9, 0.35, 0.5]], shell: { f: 130, q: 3, gain: 0.9, dur: 0.22 }, click: { f: 700, gain: 0.5, dur: 0.03 }, lp: 1300, gain: 0.72 });
defVoice('cajon-tone', 'skin', { dur: 0.14, drop: 1.2, modes: [[1, 1, 1], [2.1, 0.45, 0.6], [3.3, 0.2, 0.4]], click: { f: 2000, gain: 0.5 }, shell: { f: 240, q: 4, gain: 0.35, dur: 0.1 }, lp: 4200, gain: 0.5 });
defVoice('cajon-slap', 'skin', { dur: 0.09, drop: 1.1, modes: MEM, click: { f: 4300, q: 0.9, gain: 1.0, dur: 0.02 }, buzz: { f: 4600, dur: 0.24, gain: 0.5 }, lp: 9000, gain: 0.46 });
defVoice('cajon-ghost', 'skin', { dur: 0.07, drop: 1.1, modes: [[1, 1, 1], [2.2, 0.4, 0.5]], click: { f: 1700, gain: 0.5 }, buzz: { f: 5200, dur: 0.1, gain: 0.18 }, lp: 3500, gain: 0.3 });
defVoice('cajon-edge', 'woodtok', { dur: 0.06, gain: 0.5, hollow: 1.2, overtone: 3.1 });

// ---- PANDEIRO: hand tambourine; every stroke has a little jingle with it, the shake is all jingle ---------------------------------------------------
import { registerSynthVoice as _unused } from './voice-registry.js';
void _unused;
const withJingle = (kind, recipe, params, j) => { // a drum stroke plus a jingle layer in one voice kind
  registerStrikeVoice(kind, (c) => { c.evoice(c.audio, recipe, { ...params, hz: c.hz, vel: c.vel }); return c.evoice(c.audio, 'jingle', { ...j, vel: c.vel * (j.vel ?? 1), delay: 0.004 }); });
};
withJingle('pandeiro-th', 'skin', { dur: 0.22, drop: 1.5, glide: 0.05, modes: [[1, 1, 1], [1.7, 0.4, 0.5]], click: { f: 800, gain: 0.35 }, lp: 1700, gain: 0.62 }, { n: 3, f: 3200, gain: 0.07, dur: 0.12 });
withJingle('pandeiro-c', 'skin', { dur: 0.2, drop: 1.25, modes: [[1, 1, 1], [1.59, 0.5, 0.6], [2.14, 0.3, 0.4]], click: { f: 1800, gain: 0.4 }, lp: 4200, gain: 0.55 }, { n: 4, f: 3400, gain: 0.09, dur: 0.14 });
withJingle('pandeiro-fi', 'skin', { dur: 0.08, drop: 1.1, modes: MEM, click: { f: 3600, gain: 0.8 }, lp: 8000, gain: 0.38 }, { n: 4, f: 3800, gain: 0.11, dur: 0.12 });
withJingle('pandeiro-sl', 'skin', { dur: 0.1, drop: 1.12, modes: MEM, click: { f: 4400, q: 0.9, gain: 1.0, dur: 0.022 }, lp: 9000, gain: 0.44 }, { n: 7, f: 4000, gain: 0.15, dur: 0.22, spread: 0.07 });
withJingle('pandeiro-rim', 'woodtok', { dur: 0.05, gain: 0.5, hollow: 1.2 }, { n: 5, f: 4300, gain: 0.12, dur: 0.16 });
defVoice('pandeiro-sh', 'jingle', { n: 11, f: 3500, gain: 0.17, dur: 0.3, spread: 0.12 });

// ---- RABANA: a big floor frame drum; the centre booms, the quarters give open and slapped strokes ---------------------------------------------------
defVoice('rabana-c', 'skin', { dur: 0.5, drop: 1.5, glide: 0.07, modes: [[1, 1, 1], [1.59, 0.4, 0.6], [2.14, 0.2, 0.4]], click: { f: 700, gain: 0.3 }, shell: { f: 110, q: 3, gain: 0.5, dur: 0.3 }, lp: 1500, gain: 0.72 });
defVoice('rabana-n', 'skin', { dur: 0.28, drop: 1.2, modes: MEM, click: { f: 2200, gain: 0.4 }, lp: 4500, gain: 0.55 });
defVoice('rabana-e', 'skin', { dur: 0.16, drop: 1.15, modes: MEM, click: { f: 3200, gain: 0.6 }, lp: 6500, gain: 0.5 });
defVoice('rabana-w', 'skin', { dur: 0.36, drop: 1.1, modes: [[1, 1, 1], [1.59, 0.6, 0.8], [2.14, 0.45, 0.7], [2.65, 0.3, 0.6]], click: { f: 2800, gain: 0.35 }, lp: 6000, gain: 0.5 });
defVoice('rabana-s', 'skin', { dur: 0.1, drop: 1.1, modes: MEM, click: { f: 4000, gain: 0.95 }, lp: 9000, gain: 0.46 });

// ---- SHEKERE: a gourd in a net of beads ------------------------------------------------------------------------------------------------------------
defVoice('shekere-shake', 'rattle', { grains: 9, spread: 0.1, f: 6400, q: 1.1, gain: 0.3, tail: 0.055, fade: 0.55 });
defVoice('shekere-slap', 'rattle', { grains: 4, spread: 0.035, f: 5400, q: 1.4, gain: 0.3, tail: 0.05, thump: 330, thumpGain: 1.5 });
defVoice('shekere-roll', 'rattle', { grains: 15, spread: 0.24, curve: 1.5, f: 5800, q: 1.0, gain: 0.32, tail: 0.06, fade: 0.7 });
defVoice('shekere-bass', 'skin', { dur: 0.28, drop: 1.55, glide: 0.06, modes: [[1, 1, 1], [1.8, 0.3, 0.5]], click: { f: 600, gain: 0.3 }, lp: 1000, shell: { f: 140, q: 3, gain: 0.5, dur: 0.18 }, gain: 0.7 });

// ---- ENSEMBLES: samulnori, candombe, bodu beru, bomba -------------------------------------------------------------------------------------------
const GONG = [[1, 1, 1], [2.32, 0.6, 0.7], [3.46, 0.45, 0.5], [5.1, 0.25, 0.35], [7.2, 0.12, 0.25]];
// samulnori: the hand gong rings bright and is damped by the hand (kak); the big gong beats slowly (wobble) and can be muted
defVoice('ens-kkwae-c', 'metal', { dur: 1.1, partials: GONG, gain: 0.3, strike: 0.5, wet: 0.2 });
defVoice('ens-kkwae-m', 'metal', { dur: 0.07, partials: GONG, gain: 0.3, strike: 0.7 });
defVoice('ens-jing-c', 'metal', { dur: 3.2, partials: [[1, 1, 1], [1.58, 0.5, 0.8], [2.4, 0.4, 0.6], [3.7, 0.2, 0.4], [5.2, 0.1, 0.3]], wobble: 3.2, bend: 1.04, gain: 0.26, strike: 0.2, wet: 0.28, attack: 0.012 });
defVoice('ens-jing-m', 'metal', { dur: 0.22, partials: [[1, 1, 1], [1.58, 0.6, 0.7], [2.4, 0.4, 0.5]], gain: 0.3, strike: 0.5 });
defVoice('ens-janggu-l', 'skin', { dur: 0.42, drop: 1.45, glide: 0.06, modes: [[1, 1, 1], [1.5, 0.4, 0.6], [2.2, 0.2, 0.4]], shell: { f: 180, q: 4, gain: 0.5, dur: 0.2 }, lp: 1600, gain: 0.7 });
defVoice('ens-janggu-r', 'skin', { dur: 0.12, drop: 1.12, modes: MEM, click: { f: 4000, gain: 0.85, dur: 0.02 }, lp: 8500, gain: 0.44 });
defVoice('ens-janggu-rim', 'woodtok', { dur: 0.05, gain: 0.5, hollow: 2, overtone: 3.2 });
defVoice('ens-buk-c', 'skin', { dur: 0.34, drop: 1.5, glide: 0.06, modes: [[1, 1, 1], [1.59, 0.45, 0.6], [2.14, 0.25, 0.4]], shell: { f: 140, q: 3, gain: 0.6, dur: 0.2 }, click: { f: 900, gain: 0.35 }, lp: 1700, gain: 0.72 });
defVoice('ens-buk-rim', 'woodtok', { dur: 0.06, gain: 0.55, hollow: 1.5 });
// candombe: three drums in three registers; each takes the stick (sharp, on the skin), the bare hand (full, open) and the shell (wood)
for (const [d, base] of [['chico', 1.0], ['repique', 0.78], ['piano', 0.58]]) {
  defVoice(`ens-${d}-stick`, 'skin', { dur: 0.1 + (1 - base) * 0.12, drop: 1.12, modes: MEM, click: { f: 3600 * base + 1000, gain: 0.9, dur: 0.02 }, lp: 8000, gain: 0.44 });
  defVoice(`ens-${d}-hand`, 'skin', { dur: 0.2 + (1 - base) * 0.3, drop: 1.3, glide: 0.04 + (1 - base) * 0.04, modes: [[1, 1, 1], [1.59, 0.5, 0.6], [2.14, 0.3, 0.4]], click: { f: 1500, gain: 0.35 }, shell: { f: 200 * base, q: 4, gain: 0.4, dur: 0.15 }, lp: 3200, gain: 0.6 + (1 - base) * 0.3 });
  defVoice(`ens-${d}-shell`, 'woodtok', { dur: 0.06 + (1 - base) * 0.04, gain: 0.5, hollow: 1.3, overtone: 2.5 });
}
// bodu beru: big log drums struck with the hands
defVoice('ens-log-c', 'skin', { dur: 0.5, drop: 1.4, glide: 0.07, modes: [[1, 1, 1], [1.59, 0.4, 0.6], [2.14, 0.2, 0.4]], shell: { f: 120, q: 3, gain: 0.7, dur: 0.3 }, click: { f: 800, gain: 0.3 }, lp: 1500, gain: 0.74 });
defVoice('ens-log-e', 'skin', { dur: 0.14, drop: 1.12, modes: MEM, click: { f: 3000, gain: 0.8 }, lp: 7000, gain: 0.46 });
defVoice('ens-small-c', 'skin', { dur: 0.22, drop: 1.25, modes: [[1, 1, 1], [1.59, 0.5, 0.6], [2.14, 0.3, 0.4]], click: { f: 1800, gain: 0.4 }, lp: 4000, gain: 0.55 });
defVoice('ens-small-e', 'skin', { dur: 0.08, drop: 1.1, modes: MEM, click: { f: 3800, gain: 0.9 }, lp: 8500, gain: 0.4 });
// bomba: two barrel drums (palm and slap), the cua (hard sticks on a wooden shell), the maraca, and the dancer's step answered by the drum
for (const [d, k] of [['bul', 1.0], ['sub', 0.7]]) {
  defVoice(`ens-${d}-c`, 'skin', { dur: 0.42 - (1 - k) * 0.1, drop: 1.5, glide: 0.06, modes: [[1, 1, 1], [1.59, 0.45, 0.6], [2.14, 0.25, 0.4]], shell: { f: 150 / k, q: 3, gain: 0.55, dur: 0.22 }, click: { f: 1000, gain: 0.3 }, lp: 1900, gain: 0.7 });
  defVoice(`ens-${d}-e`, 'skin', { dur: 0.13, drop: 1.12, modes: MEM, click: { f: 3400, gain: 0.85 }, lp: 7500, gain: 0.46 });
}
registerStrikeVoice('ens-cua-cua', (c) => { c.evoice(c.audio, 'woodtok', { hz: 1250, dur: 0.045, gain: 0.5, hollow: 2, vel: c.vel }); return c.evoice(c.audio, 'woodtok', { hz: 1420, dur: 0.04, gain: 0.4, hollow: 2, vel: c.vel * 0.8, delay: 0.011 }); });
defVoice('ens-cua-mar', 'rattle', { grains: 6, spread: 0.07, f: 4600, q: 1.2, gain: 0.38, tail: 0.05, fade: 0.5 });
registerStrikeVoice('ens-dancer-step', (c) => { c.evoice(c.audio, 'foot', { hz: c.hz, floor: 'wood', shoe: 'soft', gain: 0.5, vel: c.vel }); return c.evoice(c.audio, 'swish', { f0: 1500, f1: 3800, dur: 0.24, gain: 0.16, vel: c.vel, delay: 0.01 }); });

// ---- GOBLET DRUMS: darbuka (metal body, bright and ringing) and tombak (wooden body, warm and quick) -------------------------------------------------------------
defVoice('goblet-darbuka-c', 'skin', { dur: 0.3, drop: 1.5, glide: 0.05, modes: [[1, 1, 1], [1.5, 0.3, 0.6], [2.2, 0.15, 0.4]], shell: { f: 300, q: 6, gain: 0.45, dur: 0.18 }, click: { f: 1600, gain: 0.3 }, lp: 2600, gain: 0.7 });
defVoice('goblet-darbuka-m', 'skin', { dur: 0.1, drop: 1.12, modes: MEM, click: { f: 3800, q: 1, gain: 0.85, dur: 0.02 }, shell: { f: 1900, q: 8, gain: 0.25, dur: 0.1 }, lp: 9000, gain: 0.44 });
defVoice('goblet-darbuka-o', 'skin', { dur: 0.07, drop: 1.1, modes: MEM, click: { f: 3000, gain: 0.65 }, lp: 7000, gain: 0.3 });
defVoice('goblet-darbuka-h', 'metal', { hz: 2300, dur: 0.12, partials: [[1, 1, 1], [2.7, 0.5, 0.5], [4.2, 0.3, 0.3]], gain: 0.2, strike: 0.5 });
defVoice('goblet-darbuka-b', 'metal', { hz: 640, dur: 0.14, partials: [[1, 1, 1], [2.3, 0.5, 0.6], [3.9, 0.25, 0.4]], gain: 0.22, strike: 0.7 });
defVoice('goblet-tombak-c', 'skin', { dur: 0.24, drop: 1.4, glide: 0.045, modes: [[1, 1, 1], [1.6, 0.4, 0.6], [2.3, 0.2, 0.4]], shell: { f: 200, q: 5, gain: 0.5, dur: 0.15 }, click: { f: 1300, gain: 0.35 }, lp: 2200, gain: 0.68 });
defVoice('goblet-tombak-m', 'skin', { dur: 0.09, drop: 1.12, modes: MEM, click: { f: 3400, gain: 0.8, dur: 0.02 }, lp: 7500, gain: 0.44 });
registerStrikeVoice('goblet-tombak-o', (c) => { for (let k = 0; k < 4; k++) c.evoice(c.audio, 'skin', { hz: c.hz, dur: 0.05, drop: 1.1, modes: MEM, click: { f: 3200 + 200 * k, gain: 0.6, dur: 0.015 }, lp: 7000, gain: 0.28 * (1 - k * 0.12), vel: c.vel, delay: k * 0.022 }); return null; });
defVoice('goblet-tombak-h', 'woodtok', { hz: 900, dur: 0.05, gain: 0.5, hollow: 1.8, overtone: 3.2 });
defVoice('goblet-tombak-b', 'woodtok', { hz: 420, dur: 0.09, gain: 0.5, hollow: 1.3, overtone: 2.5 });

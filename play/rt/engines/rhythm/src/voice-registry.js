// Voice (sound) registry (1.9.0). New timbres and voices are registered from voices-ext.js; nothing here changes for existing games.
//   registerTimbre(name, preset, { layout })      a stroke preset (TIMBRES row); `layout` makes it the default for that layout
//   registerLaneVoice(rule)                       rule(lane, { stage, P, instName }) => voice kind string | null; tried before the built-in
//                                                 timbre -> kind switch of activity.js `voiceKind`, so a new kind can be bound to a timbre or stage
//   registerStrikeVoice(kind, play, { mono })     how `kind` sounds: play(ctx) with ctx = { audio, lane, index, base, hz, dur, vel, prev, P, stage,
//                                                 env, clock, voice, evoice }; mono:true cuts the previous mono voice first and keeps the returned
//                                                 handle(s) (objects with cut()) so the next note ends this one
//   registerSynthVoice(kind, fn) (voices.js)      engine-local synth recipe fn(audio, p, open) used through evoice(audio, kind, p)
//   registerWindSynth(kind, fn)  (windvoice.js)   wind recipe used through windSound(audio, kind, p)
// Spec schema: a new timbre name or layout also needs one line in spec.schema.json (definitions.timbre.enum / layout enum).

// Timbre presets: how a stroke sounds. `to` is a ratio of the start frequency (pitch fall for drums).
export const TIMBRES = {
  bass: { type: 'sine', to: 0.55, dur: 0.38, vol: 0.4 },
  tone: { type: 'triangle', to: 0.8, dur: 0.22, vol: 0.32 },
  slap: { type: 'sawtooth', to: 0.9, dur: 0.09, vol: 0.2 },
  rim: { type: 'square', to: 0.95, dur: 0.06, vol: 0.14 },
  pluck: { type: 'triangle', to: 0.995, dur: 0.6, vol: 0.3 },
  string: { type: 'sawtooth', to: 0.998, dur: 0.55, vol: 0.14 },
  mallet: { type: 'sine', to: 0.99, dur: 0.55, vol: 0.34 },
  bell: { type: 'sine', to: 0.99, dur: 0.8, vol: 0.28 },
  breath: { type: 'sine', to: null, dur: 0.6, vol: 0.3 },
  reed: { type: 'sawtooth', to: null, dur: 0.6, vol: 0.13 },
  stomp: { type: 'sine', to: 0.4, dur: 0.2, vol: 0.45 },
  clap: { type: 'square', to: 0.8, dur: 0.05, vol: 0.16 },
  gong: { type: 'sine', to: 0.97, dur: 1.2, vol: 0.4 },
  vocal: { type: 'triangle', to: null, dur: 0.5, vol: 0.28 },   // 1.7.0: sung voice (yodel, throat singing, whistle)
  scrape: { type: 'sawtooth', to: 0.9, dur: 0.16, vol: 0.15 },   // 1.7.0: a spoon drawn across a ridged board
};
export const LAYOUT_TIMBRE = { pads: 'tone', strings: 'pluck', keys: 'mallet', holes: 'breath', steps: 'stomp', circle: 'bell', voice: 'vocal' };


export const LANE_VOICE_RULES = [];
export const STRIKE_VOICES = new Map();
export const SYNTH_VOICES = new Map();
export const WIND_SYNTHS = new Map();

export function registerTimbre(name, preset, { layout } = {}) { TIMBRES[name] = preset; if (layout) LAYOUT_TIMBRE[layout] = name; }
export function registerLaneVoice(rule) { LANE_VOICE_RULES.push(rule); }
export function registerStrikeVoice(kind, play, { mono = false } = {}) { STRIKE_VOICES.set(kind, { play, mono }); }
export function registerSynthVoice(kind, fn) { SYNTH_VOICES.set(kind, fn); }
export function registerWindSynth(kind, fn) { WIND_SYNTHS.set(kind, fn); }

// Scenes, 1.13.0: stitch and thread. Registered through the scene registry (scene-registry.js). No human figures, no religious symbols, text-free art.
import { registerSceneSet } from './scene-registry.js';
import { assisiEnv, assisiUnder, assisiGround, assisiOver, assisiSkin, blackEnv, blackUnder, blackGround, blackOver, blackSkin } from './scene-stitch.js';
import { hardEnv, hardUnder, hardGround, hardOver, hardSkin, bargelloEnv, bargelloUnder, bargelloGround, bargelloOver, bargelloSkin } from './scene-stitch2.js';

const SCENES = {
  // assisi (1.13.0): voided cross-stitch: the motif is bare linen outlined in double running, the ground is solid cross-stitch; frame leaning on a stone wall
  assisi: {
    mat: 'stitch', pad: 0.087, snd: 'thread', pot: 'threadcard', tool: 'fineneedle', idle: [0.9, 0.97], place: ['thread', 'ring'], grid: false, light: false,
    card: { paper: '#f2e7cd', deco: 'tape', ink: '#5a1a18', label: 'COUNTED CHART' }, btn: { fill: '#5a1c18', primary: '#f0c070', primaryText: '#2a0c08' },
    env: (ctx, S) => assisiEnv(ctx, S), under: (ctx, S) => assisiUnder(ctx, S),
    base: () => {}, ground: (ctx, S) => assisiGround(ctx, S), over: (ctx, S) => assisiOver(ctx, S),
    cell: (ctx, S, d) => assisiSkin(ctx, S, d), frame: () => {},
  },
  // blackwork (1.13.0): black silk diaper fillings inside heavy stem-stitch outlines on white linen; slate frame on a candle-lit oak table
  blackwork: {
    mat: 'stitch', pad: 0.107, snd: 'soft', pot: 'silkwinder', tool: ['fineneedle', { lean: 0.85, thimble: true }], idle: [0.9, 0.97], place: ['thread', 'puff'], grid: false, light: false,
    card: { paper: '#efe3c8', deco: 'pins', ink: '#14110f', label: 'PATTERN SHEET' }, btn: { fill: '#17110c', primary: '#e8c46a', primaryText: '#17110c' },
    env: (ctx, S) => blackEnv(ctx, S), under: (ctx, S) => blackUnder(ctx, S),
    base: () => {}, ground: (ctx, S) => blackGround(ctx, S), over: (ctx, S) => blackOver(ctx, S),
    cell: (ctx, S, d) => blackSkin(ctx, S, d), frame: () => {},
  },
  // hardanger (1.13.0): kloster blocks round cut-and-drawn squares with woven bars and dove's eyes; white linen in a beech hoop on a painted table
  hardanger: {
    mat: 'stitch', pad: 0.337, padL: 0.197, snd: 'pop', pot: 'pearlhank', tool: 'snips', idle: [0.9, 0.97], place: ['tile', 'ring'], grid: false, light: false,
    card: { paper: '#f7f3e8', deco: 'hem', ink: '#243a56', label: 'KLOSTER CHART' }, btn: { fill: '#243a56', primary: '#f4efe0', primaryText: '#243a56' },
    env: (ctx, S) => hardEnv(ctx, S), under: (ctx, S) => hardUnder(ctx, S),
    base: () => {}, ground: (ctx, S) => hardGround(ctx, S), over: (ctx, S) => hardOver(ctx, S),
    cell: (ctx, S, d) => hardSkin(ctx, S, d), frame: () => {},
  },
  // bargello (1.13.0): upright flame stitches in stepped zigzag rows, shaded wool, on canvas in a scroll frame at a walnut desk by a stone window
  bargello: {
    mat: 'stitch', pad: 0.117, snd: 'brush', pot: 'woolhank', tool: 'tapneedle', idle: [0.9, 0.97], place: ['puff', 'thread'], grid: false, light: false,
    card: { paper: '#f3e6c8', deco: 'scroll', ink: '#4a1424', label: 'FLAME CHART' }, btn: { fill: '#3a1810', primary: '#e8b84a', primaryText: '#2a1008' },
    env: (ctx, S) => bargelloEnv(ctx, S), under: (ctx, S) => bargelloUnder(ctx, S),
    base: () => {}, ground: (ctx, S) => bargelloGround(ctx, S), over: (ctx, S) => bargelloOver(ctx, S),
    cell: (ctx, S, d) => bargelloSkin(ctx, S, d), frame: () => {},
  },
};
const LAYOUT = {
  assisi: { order: ['card', 'pal', 'board'], tone: -0.17, pad: 0.087 },
  blackwork: { order: ['pal', 'board', 'card'], tone: -0.27, pad: 0.107 },
  hardanger: { order: ['card', 'board', 'pal'], tone: 0.37, pad: 0.337 },
  bargello: { order: ['board', 'card', 'pal'], tone: 0.17, pad: 0.117 },
};
const RULES = [['assisi', /assisi/], ['blackwork', /black\s?work|schwarzstickerei/], ['hardanger', /hardanger/], ['bargello', /bargello|florentine|flame\s?stitch/]];
registerSceneSet({ scenes: SCENES, layout: LAYOUT, rules: RULES, from: 'scenes-t.js' });
export const SCENES_T = SCENES;

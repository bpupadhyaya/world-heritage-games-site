// Scenes, 1.12.0: looms and bands family. Registered through the scene registry (scene-registry.js). No human figures, no religious symbols, text-free art.
import { ENV, SKIN, hash, rgba, mix, shade, roundRectPath, rod, ball, poly, speck, lines, weaveGrid, glow, vignette, TAU } from './scene-kit.js';
import { base, ground, frame } from './scene-parts.js';
import { registerSceneSet } from './scene-registry.js';
import './scene-x.js';
import { warpweightEnv, warpweightUnder, warpweightFrame, warpweightGround, warpweightOver, twillSkin } from './scene-loom.js';
import { bandSkin, stripSkin, brocadeSkin, ragSkin, tabletEnv, tabletGround, tabletFrame, inkleEnv, inkleUnder, inkleFrame, inkleGround, pitEnv, pitUnder, pitFrame, pitGround, pitOver, drawEnv, drawUnder, drawFrame, drawGround, pegEnv, pegUnder, pegFrame, pegGround } from './scene-loom2.js';

const SCENES = {
  // warp-weighted loom: an upright loom in a timber hall, warp bunches hung from a log and tightened by rings of fired clay; twill wool
  warpweight: {
    mat: 'weave', pad: 0.22, padL: 0.12, cardWL: 0.26, snd: 'wood', pot: 'skein', tool: 'battensword', idle: [0.9, 0.97], place: ['thread', 'puff'], grid: false, light: false,
    card: { paper: '#e9dec4', deco: 'wood', ink: '#3a2418', label: 'TWILL PLAN' }, btn: { fill: '#2a1c14', primary: '#e8b04a', primaryText: '#2a1c14' },
    env: (ctx, S) => warpweightEnv(ctx, S), under: (ctx, S) => warpweightUnder(ctx, S),
    base: base.sheet({ blur: 0.4, drop: 0.12 }), ground: (ctx, S) => warpweightGround(ctx, S), over: (ctx, S) => warpweightOver(ctx, S),
    cell: (ctx, S, d) => twillSkin(ctx, d, {}), frame: (ctx, S) => warpweightFrame(ctx, S), clipRect: true,
  },
  // tablet weaving: a pale ash bench, a row of bone cards turned in sets (one per column), threads fanning to an iron hook; warp-faced band with twist
  tablet: {
    mat: 'weave', pad: 0.26, padL: 0.12, cardWL: 0.26, snd: 'bead', pot: 'tabletcard', tool: 'weftpick', idle: [0.9, 0.97], place: ['thread', 'ring'], grid: false, light: false,
    card: { paper: '#f3ead2', deco: 'hem', ink: '#2a2418', label: 'BAND CHART' }, btn: { fill: '#3a2a1a', primary: '#e8c060', primaryText: '#2a1c10' },
    env: (ctx, S) => tabletEnv(ctx, S), base: base.sheet({ blur: 0.2, drop: 0.06 }), ground: (ctx, S) => tabletGround(ctx, S),
    cell: (ctx, S, d) => bandSkin(ctx, d, { twist: true }), frame: (ctx, S) => tabletFrame(ctx, S), clipRect: true,
  },
  // inkle loom: a small maple frame with turned pegs on a green panelled wall, brass lamp; plain warp-faced band with picked-up pattern floats
  inkle: {
    mat: 'weave', pad: 0.24, padL: 0.11, cardWL: 0.26, snd: 'soft', pot: 'yarncone', tool: 'inklebeater', idle: [0.9, 0.97], place: ['thread', 'puff'], grid: false, light: false,
    card: { paper: '#efe6c8', deco: 'pins', ink: '#14301f', label: 'PICK-UP PLAN' }, btn: { fill: '#14301f', primary: '#e8c060', primaryText: '#14301f' },
    env: (ctx, S) => inkleEnv(ctx, S), under: (ctx, S) => inkleUnder(ctx, S), base: () => {}, ground: (ctx, S) => inkleGround(ctx, S),
    cell: (ctx, S, d) => bandSkin(ctx, d, { twist: false, dots: true, n: 7 }), frame: (ctx, S) => inkleFrame(ctx, S), clipRect: true,
  },
  // pit loom: a sunlit sandy courtyard, a strip of plain-weave cloth leaving the reed, the warp running to a stake, the pit with two treadles in front
  pitloom: {
    mat: 'weave', pad: 0.23, padL: 0.16, cardWL: 0.26, snd: 'wood', pot: 'pirn', tool: 'pitshuttle', idle: [0.9, 0.97], place: ['thread', 'puff'], grid: false, light: 0.9,
    card: { paper: '#f4e6c2', deco: 'tape', ink: '#3a2410', label: 'STRIP PLAN' }, btn: { fill: '#4a2c14', primary: '#f0c04a', primaryText: '#2a1608' },
    env: (ctx, S) => pitEnv(ctx, S), under: (ctx, S) => pitUnder(ctx, S), base: base.sheet({ blur: 0.3, drop: 0.1 }), ground: (ctx, S) => pitGround(ctx, S), over: (ctx, S) => pitOver(ctx, S),
    cell: (ctx, S, d) => stripSkin(ctx, d, {}), frame: (ctx, S) => pitFrame(ctx, S), clipRect: true,
  },
  // drawloom: lacquered red posts, harness cords hanging from the top beam, a lattice-window silk workshop; satin brocade with gold
  drawloom: {
    mat: 'weave', pad: 0.24, padL: 0.12, cardWL: 0.26, snd: 'thread', pot: 'silkreel', tool: 'drawcord', idle: [0.9, 0.97], place: ['thread', 'sparkle'], grid: false, light: false,
    card: { paper: '#f2e2bc', deco: 'studs', ink: '#4a0e10', label: 'FIGURE PLAN' }, btn: { fill: '#3a0c0e', primary: '#e8b84a', primaryText: '#3a0c0e' },
    env: (ctx, S) => drawEnv(ctx, S), under: (ctx, S) => drawUnder(ctx, S), base: base.sheet({ blur: 0.3, drop: 0.1 }), ground: (ctx, S) => drawGround(ctx, S),
    cell: (ctx, S, d) => brocadeSkin(ctx, d, {}), frame: (ctx, S) => drawFrame(ctx, S), clipRect: true,
  },
  // peg loom: a bright cottage floor and rag balls, a stout board with turned pegs, cord warp, chunky rag-rug loops
  pegloom: {
    mat: 'weave', pad: 0.2, padL: 0.1, cardWL: 0.26, snd: 'soft', pot: 'ragroll', tool: 'raghook', idle: [0.9, 0.97], place: ['puff', 'ring'], grid: false, light: false,
    card: { paper: '#fbf6e8', deco: 'cloth', ink: '#1e2a38', label: 'RUG PLAN' }, btn: { fill: '#2a3a4c', primary: '#f0b43a', primaryText: '#1e2a38' },
    env: (ctx, S) => pegEnv(ctx, S), under: (ctx, S) => pegUnder(ctx, S), base: base.sheet({ blur: 0.3, drop: 0.08 }), ground: (ctx, S) => pegGround(ctx, S),
    cell: (ctx, S, d) => ragSkin(ctx, d, {}), frame: (ctx, S) => pegFrame(ctx, S), clipRect: true,
  },
};
const LAYOUT = {
  warpweight: { order: ['board', 'card', 'pal'], tone: -0.12, pad: 0.22 },
  tablet: { order: ['card', 'board', 'pal'], tone: 0.1, pad: 0.26 },
  inkle: { order: ['pal', 'board', 'card'], tone: -0.1, pad: 0.24 },
  pitloom: { order: ['board', 'pal', 'card'], tone: 0.32, pad: 0.23 },
  drawloom: { order: ['card', 'pal', 'board'], tone: -0.22, pad: 0.24 },
  pegloom: { order: ['pal', 'card', 'board'], tone: 0.4, pad: 0.2 },
};
const RULES = [
  ['warpweight', /warp.?weighted|weighted loom|loom weight/], ['tablet', /tablet.?weav|card.?weav/], ['inkle', /inkle/], ['pitloom', /pit.?loom/],
  ['drawloom', /draw.?loom/], ['pegloom', /peg.?loom/],
];
registerSceneSet({ scenes: SCENES, layout: LAYOUT, rules: RULES, from: 'scenes-l.js' });
export const SCENES_L = SCENES;

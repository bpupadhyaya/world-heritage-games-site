// Scenes, 1.12.0: island weaving family. Registered through the scene registry (scene-registry.js). No human figures, no religious symbols, text-free art.
import { ENV, SKIN, hash, rgba, mix, shade, roundRectPath, rod, ball, poly, speck, lines, weaveGrid, glow, vignette, TAU } from './scene-kit.js';
import { base, ground, frame } from './scene-parts.js';
import { registerSceneSet } from './scene-registry.js';
import './scene-x.js';
import { lauhalaEnv, lauhalaBase, lauhalaGround, lauhalaSkin, jakiedEnv, jakiedBase, jakiedGround, jakiedSkin, dappleOver, masiEnv, masiBase, masiGround, masiSkin, siapoEnv, siapoBase, siapoGround, siapoSkin, tivaevaeEnv, tivaevaeBase, tivaevaeGround, tivaevaeSkin, bilumEnv, bilumBase, bilumGround, bilumSkin, magimagiEnv, magimagiBase, magimagiGround, magimagiSkin } from './scene-island.js';

const SCENES = {
  // lauhala: wide pandanus strips plaited on the slant; dyed strips are the pattern; warm sand under palm shade
  lauhala: {
    mat: 'weave', pad: 0.12, snd: 'soft', pot: 'striproll', tool: 'pandanusstrip', idle: [0.9, 0.97], place: ['puff', 'ring'], grid: false, light: 0.7,
    card: { paper: '#efe0b8', deco: 'tape', ink: '#4a2c12', label: 'PLAIT' }, btn: { fill: '#3a2410', primary: '#e8c46a', primaryText: '#3a2410' },
    env: (ctx, S) => lauhalaEnv(ctx, S), base: (ctx, S) => lauhalaBase(ctx, S), ground: (ctx, S) => lauhalaGround(ctx, S),
    cell: (ctx, S, d) => lauhalaSkin(ctx, S, d), over: (ctx, S) => dappleOver(ctx, S, 0.12, 9), frame: () => {}, clipRect: true,
  },
  // jaki-ed: a very fine pale mat with dark strands, tricoloured border and fringe, on coral sand before a lagoon
  jakied: {
    mat: 'weave', pad: 0.14, snd: 'soft', pot: 'fibrehank', tool: 'needle', idle: [0.9, 0.97], place: ['thread', 'ring'], grid: false, light: 0.6,
    card: { paper: '#f6efd8', deco: 'hem', ink: '#3a2414', label: 'MAT PLAN' }, btn: { fill: '#1f6f78', primary: '#f6efd8', primaryText: '#16444a' },
    env: (ctx, S) => jakiedEnv(ctx, S), base: (ctx, S) => jakiedBase(ctx, S), ground: (ctx, S) => jakiedGround(ctx, S),
    cell: (ctx, S, d) => jakiedSkin(ctx, S, d), over: (ctx, S) => dappleOver(ctx, S, 0.13, 5), frame: () => {}, clipRect: true,
  },
  // masi: beaten bark cloth stencil-printed in black and rust; a rolled finished length lies beside it on straw mats
  masi: {
    mat: 'print', pad: 0.09, snd: 'stamp', pot: 'shellcup', tool: 'rubpad', idle: [0.9, 0.97], place: ['stamp', 'puff'], grid: false, light: 0.7,
    card: { paper: '#e6d2a4', deco: 'tape', ink: '#2a1a10', label: 'STENCIL' }, btn: { fill: '#2a1a10', primary: '#d7852c', primaryText: '#2a1a10' },
    env: (ctx, S) => masiEnv(ctx, S), base: (ctx, S) => masiBase(ctx, S), ground: (ctx, S) => masiGround(ctx, S),
    cell: (ctx, S, d) => masiSkin(ctx, S, d), frame: () => {}, clipRect: true,
  },
  // siapo: pale bark cloth on a carved board, freehand brush painting in brown dye, open house with coconut blinds and white gravel
  siapo: {
    mat: 'paint', pad: 0.14, snd: 'brush', pot: 'bowl', tool: 'fibrebrush', idle: [0.9, 0.97], place: ['paint', 'drop'], grid: false, light: 0.8,
    card: { paper: '#f4e8c8', deco: 'plain', ink: '#3a1e0c', label: 'PAINTED DESIGN' }, btn: { fill: '#3a2010', primary: '#f0d8a0', primaryText: '#3a2010' },
    env: (ctx, S) => siapoEnv(ctx, S), base: (ctx, S) => siapoBase(ctx, S), ground: (ctx, S) => siapoGround(ctx, S),
    cell: (ctx, S, d) => siapoSkin(ctx, S, d), frame: () => {}, clipRect: true,
  },
  // tivaevae: appliqué quilt top, cut cotton flowers sewn with blind stitches on white, scalloped border, turquoise floor
  tivaevae: {
    mat: 'stitch', pad: 0.15, snd: 'soft', pot: 'clothfold', tool: 'cutscissors', idle: [0.9, 0.97], place: ['thread', 'puff'], grid: false, light: 0.7,
    card: { paper: '#fffaf0', deco: 'hem', ink: '#17504e', label: 'QUILT PLAN' }, btn: { fill: '#14504e', primary: '#ffe9a8', primaryText: '#14504e' },
    env: (ctx, S) => tivaevaeEnv(ctx, S), base: (ctx, S) => tivaevaeBase(ctx, S), ground: (ctx, S) => tivaevaeGround(ctx, S),
    cell: (ctx, S, d) => tivaevaeSkin(ctx, S, d), frame: () => {}, clipRect: true,
  },
  // bilum: looped string bag, thick twisted loops with open gaps on a dark inside, in a bamboo-walled highland house
  bilum: {
    mat: 'weave', pad: 0.08, snd: 'thread', pot: 'stringball', tool: 'loopneedle', idle: [0.9, 0.97], place: ['thread', 'ring'], grid: false, light: 0.6,
    card: { paper: '#eadfc0', deco: 'studs', ink: '#1c2a1a', label: 'BAG PLAN' }, btn: { fill: '#1c3a24', primary: '#f2b820', primaryText: '#1c2a1a' },
    env: (ctx, S) => bilumEnv(ctx, S), base: (ctx, S) => bilumBase(ctx, S), ground: (ctx, S) => bilumGround(ctx, S),
    cell: (ctx, S, d) => bilumSkin(ctx, S, d), frame: () => {}, clipRect: true,
  },
  // magimagi: coconut-fibre sennit plaited flat in chevron rows, lashed to poles in a dark thatched house
  magimagi: {
    mat: 'weave', pad: 0.11, snd: 'wood', pot: 'cordcoil', tool: 'fid', idle: [0.9, 0.97], place: ['puff', 'ring'], grid: false, light: 0.6,
    card: { paper: '#e6d2a4', deco: 'wood', ink: '#2a1408', label: 'CORD PLAN' }, btn: { fill: '#2a1408', primary: '#e0a050', primaryText: '#2a1408' },
    env: (ctx, S) => magimagiEnv(ctx, S), base: (ctx, S) => magimagiBase(ctx, S), ground: (ctx, S) => magimagiGround(ctx, S),
    cell: (ctx, S, d) => magimagiSkin(ctx, S, d), frame: () => {}, clipRect: true,
  },
};
const LAYOUT = {
  lauhala: { order: ['board', 'card', 'pal'], tone: -0.06, pad: 0.12 },
  jakied: { order: ['pal', 'card', 'board'], tone: -0.1, pad: 0.14 },
  masi: { order: ['card', 'board', 'pal'], tone: 0.1, pad: 0.09 },
  siapo: { order: ['pal', 'board', 'card'], tone: 0.02, pad: 0.14 },
  tivaevae: { order: ['card', 'pal', 'board'], tone: 0.04, pad: 0.15 },
  bilum: { order: ['board', 'pal', 'card'], tone: 0.14, pad: 0.08 },
  magimagi: { order: ['pal', 'card', 'board'], tone: 0.08, pad: 0.11 },
};
const RULES = [
  ['lauhala', /lauhala|pandanus mat/], ['jakied', /jaki.?ed/], ['masi', /masi\b|stencil.*bark/], ['siapo', /siapo/], ['tivaevae', /tivaevae/], ['bilum', /bilum/], ['magimagi', /magimagi|sennit/],
];
registerSceneSet({ scenes: SCENES, layout: LAYOUT, rules: RULES, from: 'scenes-i.js' });
export const SCENES_I = SCENES;

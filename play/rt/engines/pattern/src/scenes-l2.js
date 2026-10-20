// Scenes, 1.13.0: looms II. Registered through the scene registry (scene-registry.js). No human figures, no religious symbols, text-free art.
import { registerSceneSet } from './scene-registry.js';
import { base } from './scene-parts.js';
import { tapestrySkin, hammockSkin, strapSkin, tapEnv, tapUnder, tapFrame, tapGround, tapOver, hamEnv, hamUnder, hamFrame, hamGround, hamOver, strapEnv, strapUnder, strapFrame, strapGround, cottonSkin, seedEnv, seedUnder, seedFrame, seedGround } from './scene-loom3.js';

const SCENES = {
  // tapestry: a north-lit atelier, an upright oak loom, the painted cartoon behind the warp, wool bobbins hanging from the cloth; weft-faced wool with slit edges
  tapestry: {
    mat: 'weave', pad: 0.21, padL: 0.1, cardWL: 0.26, snd: 'soft', pot: 'woolhank', tool: 'tapbobbin', idle: [0.9, 0.97], place: ['thread', 'puff'], grid: false, light: false,
    card: { paper: '#e9eef2', deco: 'pins', ink: '#1c2a3a', label: 'CARTOON' }, btn: { fill: '#243445', primary: '#e8b86a', primaryText: '#1c2a3a' },
    env: (ctx, S) => tapEnv(ctx, S), under: (ctx, S) => tapUnder(ctx, S), base: base.sheet({ blur: 0.3, drop: 0.1 }), ground: (ctx, S) => tapGround(ctx, S), over: (ctx, S) => tapOver(ctx, S),
    cell: (ctx, S, d) => tapestrySkin(ctx, d), frame: (ctx, S) => tapFrame(ctx, S), clipRect: true,
  },
  // hammock frame: a bright beach, a painted frame with rails, cotton strands, coral ropes up to an iron ring; knotted cord mesh
  hammock: {
    mat: 'weave', pad: 0.21, padL: 0.1, cardWL: 0.26, snd: 'bead', pot: 'netball', tool: 'netneedle', idle: [0.9, 0.97], place: ['thread', 'ring'], grid: false, light: false,
    card: { paper: '#fffaf0', deco: 'tape', ink: '#0c4a58', label: 'KNOT PLAN' }, btn: { fill: '#0f7f8f', primary: '#ffd24a', primaryText: '#0c4a58' },
    env: (ctx, S) => hamEnv(ctx, S), under: (ctx, S) => hamUnder(ctx, S), base: base.sheet({ blur: 0.2, drop: 0.06 }), ground: (ctx, S) => hamGround(ctx, S), over: (ctx, S) => hamOver(ctx, S),
    cell: (ctx, S, d) => hammockSkin(ctx, d), frame: (ctx, S) => hamFrame(ctx, S), clipRect: true,
  },
  // backstrap loom: a log-walled highland house, a timber post with rope loops, shed rod, heddle rod and sword, a striped strap; picked-up weft floats
  backstrap: {
    mat: 'weave', pad: 0.21, padL: 0.1, cardWL: 0.26, snd: 'wood', pot: 'woolball', tool: 'pickstick', idle: [0.9, 0.97], place: ['thread', 'sparkle'], grid: false, light: false,
    card: { paper: '#f0e4c8', deco: 'wood', ink: '#3a1e12', label: 'BELT PLAN' }, btn: { fill: '#3a2212', primary: '#e8a92a', primaryText: '#2a1608' },
    env: (ctx, S) => strapEnv(ctx, S), under: (ctx, S) => strapUnder(ctx, S), base: base.sheet({ blur: 0.3, drop: 0.1 }), ground: (ctx, S) => strapGround(ctx, S),
    cell: (ctx, S, d) => strapSkin(ctx, d), frame: (ctx, S) => strapFrame(ctx, S), clipRect: true,
  },
  // seed-treadle loom: a bamboo-and-teak house in forest light, a heavy timber loom, cotton bobbins on the posts, treadles hung with strings of big seeds; plain cotton
  seedtreadle: {
    mat: 'weave', pad: 0.21, padL: 0.17, cardWL: 0.26, snd: 'wood', pot: 'cottonbobbin', tool: 'bamboopirn', idle: [0.9, 0.97], place: ['thread', 'puff'], grid: false, light: false,
    card: { paper: '#f1e8c4', deco: 'cloth', ink: '#2a3a14', label: 'CLOTH PLAN' }, btn: { fill: '#3a2a12', primary: '#e0a526', primaryText: '#2a1a08' },
    env: (ctx, S) => seedEnv(ctx, S), under: (ctx, S) => seedUnder(ctx, S), base: base.sheet({ blur: 0.3, drop: 0.1 }), ground: (ctx, S) => seedGround(ctx, S),
    cell: (ctx, S, d) => cottonSkin(ctx, d), frame: (ctx, S) => seedFrame(ctx, S), clipRect: true,
  },
};
const LAYOUT = {
  tapestry: { order: ['card', 'board', 'pal'], tone: -0.11, pad: 0.21 },
  hammock: { order: ['board', 'card', 'pal'], tone: -0.21, pad: 0.21 },
  backstrap: { order: ['pal', 'board', 'card'], tone: 0.11, pad: 0.21 },
  seedtreadle: { order: ['pal', 'card', 'board'], tone: 0.21, pad: 0.21 },
};
const RULES = [
  ['tapestry', /tapestr|aubusson|gobelin|kesi/], ['hammock', /hammock/], ['backstrap', /back.?strap|body.?tension|waist loom/], ['seedtreadle', /seed.?treadle|shan.*loom/],
];
registerSceneSet({ scenes: SCENES, layout: LAYOUT, rules: RULES, from: 'scenes-l2.js' });
export const SCENES_L2 = SCENES;

// Scenes, 1.13.0: saris and shawls II (Chanderi gauze, Maheshwari check, Muga golden silk, Himalayan wool shawl). Registered through the scene registry
// (scene-registry.js). No human figures, no religious symbols, text-free art.
import { registerSceneSet } from './scene-registry.js';
import { shawlEnv, shawlUnder, shawlGround, shawlOver, shawlFrame, pattiSkin } from './scene-shawl.js';
import { base } from './scene-parts.js';
import { chanderiEnv, chanderiUnder, chanderiGround, chanderiOver, chanderiFrame, gauzeSkin, maheshwariEnv, maheshwariUnder, maheshwariGround, maheshwariOver, maheshwariFrame, chatSkin, mugaEnv, mugaUnder, mugaGround, mugaOver, mugaFrame, mugaSkin } from './scene-sari3.js';

const SCENES = {
  // chanderi: sheer cotton-silk gauze with tiny zari butis laid on a pale table between bamboo rails, in sandstone window light
  chanderi: {
    mat: 'weave', pad: 0.25, padL: 0.13, cardWL: 0.26, snd: 'sugar', pot: 'threadcard', tool: 'zaribobbin', idle: [0.9, 0.97], place: ['sparkle', 'thread'], grid: false, light: 0.5,
    card: { paper: '#f7f0de', deco: 'hem', ink: '#3a3524', label: 'BUTI PLAN' }, btn: { fill: '#5b6b5e', primary: '#e8cc7a', primaryText: '#2a3028' },
    env: (ctx, S) => chanderiEnv(ctx, S), under: (ctx, S) => chanderiUnder(ctx, S), base: () => {}, ground: (ctx, S) => chanderiGround(ctx, S),
    cell: (ctx, S, d) => gauzeSkin(ctx, S, d), over: (ctx, S) => chanderiOver(ctx, S), frame: (ctx, S) => chanderiFrame(ctx, S), clipRect: true,
  },
  // maheshwari: a handloom on a river terrace under a plain sandstone fort; cotton-silk check and stripe cloth with a reversible border
  maheshwari: {
    mat: 'weave', pad: 0.25, padL: 0.12, cardWL: 0.26, snd: 'wood', pot: 'copstand', tool: 'teakshuttle', idle: [0.9, 0.97], place: ['thread', 'puff'], grid: false, light: 0.6,
    card: { paper: '#f1ead8', deco: 'tape', ink: '#1d2f55', label: 'CHECK PLAN' }, btn: { fill: '#1f3358', primary: '#f0e2b8', primaryText: '#1f3358' },
    env: (ctx, S) => maheshwariEnv(ctx, S), under: (ctx, S) => maheshwariUnder(ctx, S), base: () => {}, ground: (ctx, S) => maheshwariGround(ctx, S),
    cell: (ctx, S, d) => chatSkin(ctx, S, d), over: (ctx, S) => maheshwariOver(ctx, S), frame: (ctx, S) => maheshwariFrame(ctx, S), clipRect: true,
  },
  // muga: golden Assam silk on a bamboo and timber handloom, a stilt-house veranda above green hills; red and ivory supplementary-weft motifs
  muga: {
    mat: 'weave', pad: 0.25, padL: 0.12, cardWL: 0.26, snd: 'thread', pot: 'cocoonreel', tool: 'bamboobobbin', idle: [0.9, 0.97], place: ['sparkle', 'puff'], grid: false, light: 0.2,
    card: { paper: '#f3e9c8', deco: 'wood', ink: '#3a2a0c', label: 'MOTIF PLAN' }, btn: { fill: '#2f4a28', primary: '#f0cf6a', primaryText: '#2a3a14' },
    env: (ctx, S) => mugaEnv(ctx, S), under: (ctx, S) => mugaUnder(ctx, S), base: () => {}, ground: (ctx, S) => mugaGround(ctx, S),
    cell: (ctx, S, d) => mugaSkin(ctx, S, d), over: (ctx, S) => mugaOver(ctx, S), frame: (ctx, S) => mugaFrame(ctx, S), clipRect: true,
  },
  // shawl: a timber frame loom in a log house, snowy pines in the window, an iron stove; napped wool twill, twisted tassels, stepped geometric patti bands
  shawl: {
    mat: 'weave', pad: 0.35, padL: 0.12, cardWL: 0.26, snd: 'soft', pot: 'woolcake', tool: 'woolneedle', idle: [0.9, 0.97], place: ['puff', 'ring'], grid: false, light: 0.5,
    card: { paper: '#efe3c8', deco: 'wood', ink: '#3a2212', label: 'PATTI PLAN' }, btn: { fill: '#3a2414', primary: '#e8b04a', primaryText: '#2a1608' },
    env: (ctx, S) => shawlEnv(ctx, S), under: (ctx, S) => shawlUnder(ctx, S), base: () => {}, ground: (ctx, S) => shawlGround(ctx, S),
    cell: (ctx, S, d) => pattiSkin(ctx, S, d), over: (ctx, S) => shawlOver(ctx, S), frame: (ctx, S) => shawlFrame(ctx, S), clipRect: true,
  },
};
const LAYOUT = {
  chanderi: { order: ['card', 'pal', 'board'], tone: -0.05, pad: 0.25 },
  maheshwari: { order: ['pal', 'board', 'card'], tone: 0.05, pad: 0.25 },
  muga: { order: ['card', 'board', 'pal'], tone: -0.15, pad: 0.25 },
  shawl: { order: ['pal', 'card', 'board'], tone: 0.15, pad: 0.35 },
};
const RULES = [
  ['chanderi', /chanderi|gauze sari/],
  ['maheshwari', /maheshwari|maheshwar/],
  ['muga', /muga|mekhela|sador/],
  ['shawl', /kullu|himachal|patti shawl|wool shawl/],
];
registerSceneSet({ scenes: SCENES, layout: LAYOUT, rules: RULES, from: 'scenes-s2.js' });
export const SCENES_S2 = SCENES;

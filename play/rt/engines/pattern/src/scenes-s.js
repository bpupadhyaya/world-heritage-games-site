// Scenes, 1.13.0: saris and shawls (part 1, silk saris). Registered through the scene registry (scene-registry.js). No human figures, no religious symbols, text-free art.
import { base } from './scene-parts.js';
import { ppEnv, ppUnder, ppFrame, ppGround, ppOver, tapestrySkin, baEnv, baUnder, baFrame, baGround, baOver } from './scene-sari2.js';
import { registerSceneSet } from './scene-registry.js';
import { banEnv, banUnder, banFrame, banGround, banOver, zariSkin, kcEnv, kcUnder, kcFrame, kcGround, kcOver, korvaiSkin } from './scene-sari.js';

const SCENES = {
  // banarasi: a pit loom under a jacquard card chain with a fly-shuttle sley, on a river bank at dawn; wine satin with gold and silver zari floats
  banarasi: {
    mat: 'weave', pad: 0.23, padL: 0.12, cardWL: 0.26, snd: 'bead', pot: 'zarispool', tool: 'flyshuttle', idle: [0.56, 0.93], place: ['thread', 'sparkle'], grid: false, light: 0.55,
    card: { paper: '#efe3c6', deco: 'studs', ink: '#3a0f22', edge: '#c9a14a', label: 'KADHUA PLAN' }, btn: { fill: '#2a1a24', primary: '#e4b84e', primaryText: '#2a0f1c' },
    env: (ctx, S) => banEnv(ctx, S), under: (ctx, S) => banUnder(ctx, S), base: base.sheet({ blur: 0.3, drop: 0.1 }), ground: (ctx, S) => banGround(ctx, S), over: (ctx, S) => banOver(ctx, S),
    cell: (ctx, S, d) => zariSkin(ctx, d, {}), frame: (ctx, S) => banFrame(ctx, S), clipRect: true,
  },
  // kanchipuram: a wide handloom, heavy reed and three shuttles, in a pillared verandah with dusty ochre light; thick corded silk with zari-banded motifs
  kanchipuram: {
    mat: 'weave', pad: 0.23, padL: 0.12, cardWL: 0.26, snd: 'stamp', pot: 'silkhank', tool: 'korvaishuttle', idle: [0.5, 0.95], place: ['stamp', 'sparkle'], grid: false, light: 0.9,
    card: { paper: '#f3e2b4', deco: 'wood', ink: '#4a1030', edge: '#b3862a', label: 'BORDER PLAN' }, btn: { fill: '#3a1a14', primary: '#ecc65a', primaryText: '#3a1030' },
    env: (ctx, S) => kcEnv(ctx, S), under: (ctx, S) => kcUnder(ctx, S), base: base.sheet({ blur: 0.3, drop: 0.1 }), ground: (ctx, S) => kcGround(ctx, S), over: (ctx, S) => kcOver(ctx, S),
    cell: (ctx, S, d) => korvaiSkin(ctx, d, {}), frame: (ctx, S) => kcFrame(ctx, S), clipRect: true,
  },
  // paithani: a slim frame loom with a bobbin for every colour patch hanging from the cloth, a bright white-and-teal workshop with a garden window; smooth tapestry-weave silk
  paithani: {
    mat: 'weave', pad: 0.13, padL: 0.12, cardWL: 0.26, snd: 'pop', pot: 'tinybobbin', tool: 'bobbinswing', idle: [0.5, 0.9], place: ['puff', 'sparkle'], grid: false, light: 0.5,
    card: { paper: '#fbfdf8', deco: 'hem', ink: '#0d4048', edge: '#2a8a90', label: 'BOBBIN PLAN' }, btn: { fill: '#14585f', primary: '#f2d06a', primaryText: '#0d3a40' },
    env: (ctx, S) => ppEnv(ctx, S), under: (ctx, S) => ppUnder(ctx, S), base: base.sheet({ blur: 0.25, drop: 0.08 }), ground: (ctx, S) => ppGround(ctx, S), over: (ctx, S) => ppOver(ctx, S),
    cell: (ctx, S, d) => tapestrySkin(ctx, d, {}), frame: (ctx, S) => ppFrame(ctx, S), clipRect: true,
  },
  // baluchari: a bamboo frame and a hanging lantern in a mud-walled courtyard at dusk with terracotta pots; dark silk with long vertical silk floats
  baluchari: {
    mat: 'weave', pad: 0.13, padL: 0.12, cardWL: 0.26, snd: 'soft', pot: 'silkcone', tool: 'pickstick', idle: [0.5, 0.95], place: ['thread', 'ring'], grid: false, light: 0.5,
    card: { paper: '#e8dcc4', deco: 'tape', ink: '#2a1446', edge: '#8a6ac0', label: 'PALLU PLAN' }, btn: { fill: '#2a1a40', primary: '#e9a23b', primaryText: '#2a1446' },
    env: (ctx, S) => baEnv(ctx, S), under: (ctx, S) => baUnder(ctx, S), base: base.sheet({ blur: 0.3, drop: 0.1 }), ground: (ctx, S) => baGround(ctx, S), over: (ctx, S) => baOver(ctx, S),
    cell: (ctx, S, d) => zariSkin(ctx, d, { dir: 'v', n: 14, run: 7, shine: 0.1 }), frame: (ctx, S) => baFrame(ctx, S), clipRect: true,
  },
};
const LAYOUT = {
  banarasi: { order: ['card', 'pal', 'board'], tone: -0.03, pad: 0.23 },
  kanchipuram: { order: ['pal', 'board', 'card'], tone: 0.13, pad: 0.23 },
  paithani: { order: ['board', 'card', 'pal'], tone: -0.13, pad: 0.13 },
  baluchari: { order: ['pal', 'card', 'board'], tone: 0.23, pad: 0.13 },
};
const RULES = [
  ['banarasi', /banaras|varanasi|kadhua|fekwa/], ['kanchipuram', /kanchi|korvai/], ['paithani', /paithan/], ['baluchari', /baluchar/],
];
registerSceneSet({ scenes: SCENES, layout: LAYOUT, rules: RULES, from: 'scenes-s.js' });
export const SCENES_S = SCENES;

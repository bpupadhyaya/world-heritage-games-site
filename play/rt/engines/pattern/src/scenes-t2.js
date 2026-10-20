// Scenes, 1.13.0: stitch and thread II (European florals, net lace, eyelet and quill). Registered through the scene registry (scene-registry.js). No human figures, no religious symbols, text-free art.
import { registerSceneSet } from './scene-registry.js';
import { matyoEnv, matyoUnder, matyoGround, matyoOver, matyoSkin, filetEnv, filetUnder, filetGround, filetOver, filetSkin } from './scene-stitch3.js';
import { broderieEnv, broderieUnder, broderieGround, broderieOver, broderieSkin, federkielEnv, federkielUnder, federkielGround, federkielOver, federkielSkin } from './scene-stitch4.js';

const SCENES = {
  // matyo (1.13.0): padded satin stitch and stem stitch in bright silk on black cotton, wooden hoop on a worn painted bench under a casement window
  matyo: {
    mat: 'stitch', pad: 0.089, snd: 'thread', pot: 'silkhank', tool: 'satinneedle', idle: [0.88, 0.97], place: ['thread', 'sparkle'], grid: false, light: 0.9,
    card: { paper: '#f3e8d0', deco: 'hem', ink: '#16303a', label: 'ROSE PATTERN' }, btn: { fill: '#1b4552', primary: '#d8372c', primaryText: '#fff4e0' },
    env: (ctx, S) => matyoEnv(ctx, S), under: (ctx, S) => matyoUnder(ctx, S),
    base: () => {}, ground: (ctx, S) => matyoGround(ctx, S), over: (ctx, S) => matyoOver(ctx, S),
    cell: (ctx, S, d) => matyoSkin(ctx, S, d), frame: () => {},
  },
  // filet (1.13.0): darning on knotted square-mesh net lashed into a wooden frame, cream cotton against a night-blue wall
  filet: {
    mat: 'stitch', pad: 0.109, padL: 0.052, snd: 'wood', pot: 'cottonball', tool: 'netneedle', idle: [0.88, 0.97], place: ['thread', 'ring'], grid: false, light: false,
    card: { paper: '#e9e0c8', deco: 'pins', ink: '#101c44', label: 'NET CHART' }, btn: { fill: '#14224e', primary: '#e8dec3', primaryText: '#101c44' },
    env: (ctx, S) => filetEnv(ctx, S), under: (ctx, S) => filetUnder(ctx, S),
    base: () => {}, ground: (ctx, S) => filetGround(ctx, S), over: (ctx, S) => filetOver(ctx, S),
    cell: (ctx, S, d) => filetSkin(ctx, S, d), frame: () => {},
  },
  // broderie anglaise (1.13.0): punched eyelets edged with overcast stitches on white cotton with a scalloped edge, pale hoop on a dusty-rose cloth
  broderie: {
    mat: 'stitch', pad: 0.099, snd: 'pop', pot: 'eyeletcard', tool: 'stiletto', idle: [0.88, 0.97], place: ['puff', 'ring'], grid: false, light: 0.9,
    card: { paper: '#fffaf4', deco: 'plain', ink: '#5a2e3c', label: 'EYELET PLAN' }, btn: { fill: '#7a4252', primary: '#fff3f1', primaryText: '#5a2e3c' },
    env: (ctx, S) => broderieEnv(ctx, S), under: (ctx, S) => broderieUnder(ctx, S),
    base: () => {}, ground: (ctx, S) => broderieGround(ctx, S), over: (ctx, S) => broderieOver(ctx, S),
    cell: (ctx, S, d) => broderieSkin(ctx, S, d), frame: () => {},
  },
  // federkiel (1.13.0): split peacock quill sewn down with fine thread on dark leather, pine frame with brass tacks, sunlit Alpine bench
  federkiel: {
    mat: 'stitch', pad: 0.099, snd: 'tile', pot: 'quillbowl', tool: 'leatherawl', idle: [0.88, 0.97], place: ['thread', 'sparkle'], grid: false, light: false,
    card: { paper: '#ead9b6', deco: 'wood', ink: '#2a160c', label: 'QUILL PATTERN' }, btn: { fill: '#3a2416', primary: '#ecd9a2', primaryText: '#2a160c' },
    env: (ctx, S) => federkielEnv(ctx, S), under: (ctx, S) => federkielUnder(ctx, S),
    base: () => {}, ground: (ctx, S) => federkielGround(ctx, S), over: (ctx, S) => federkielOver(ctx, S),
    cell: (ctx, S, d) => federkielSkin(ctx, S, d), frame: () => {},
  },
};
const LAYOUT = {
  matyo: { order: ['card', 'board', 'pal'], tone: 0.09, pad: 0.089 },
  filet: { order: ['pal', 'card', 'board'], tone: 0.19, pad: 0.109 },
  broderie: { order: ['board', 'card', 'pal'], tone: -0.19, pad: 0.099 },
  federkiel: { order: ['pal', 'board', 'card'], tone: 0.09, pad: 0.099 },
};
const RULES = [['matyo', /maty[oó]|mez[oő]k[oö]vesd/], ['filet', /\bfilet\b|knotted net/], ['broderie', /broderie|eyelet/], ['federkiel', /federkiel|quill embroider/]];
registerSceneSet({ scenes: SCENES, layout: LAYOUT, rules: RULES, from: 'scenes-t2.js' });
export const SCENES_T2 = SCENES;

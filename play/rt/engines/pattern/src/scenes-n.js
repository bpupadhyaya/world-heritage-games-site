// Scenes, 1.12.0: needlework family. Registered through the scene registry (scene-registry.js). No human figures, no religious symbols, text-free art.
import { ENV, SKIN, hash, rgba, mix, shade, roundRectPath, rod, ball, poly, speck, lines, weaveGrid, glow, vignette, TAU } from './scene-kit.js';
import { base, ground, frame } from './scene-parts.js';
import { registerSceneSet } from './scene-registry.js';
import './scene-x.js';
import { kasutiEnv, kasutiGround, kasutiOver, kasutiSkin, kutchEnv, kutchGround, kutchOver, kutchSkin } from './scene-needle.js';
import { zardoziEnv, zardoziUnder, zardoziGround, zardoziOver, zardoziSkin, gotaEnv, gotaGround, gotaOver, gotaSkin } from './scene-needle2.js';
import { chambaEnv, chambaGround, chambaOver, chambaSkin, lambaniEnv, lambaniGround, lambaniOver, lambaniSkin, pipiliEnv, pipiliGround, pipiliOver, pipiliSkin } from './scene-needle3.js';

const SCENES = {
  // kasuti (1.12.0): counted double-running and darning stitch on dark handloom, red-oxide floor, bamboo stretcher, window light
  kasuti: {
    mat: 'stitch', pad: 0.093, snd: 'thread', pot: 'skein', tool: 'needle', idle: [0.88, 0.97], place: ['thread', 'ring'], grid: false, light: false,
    card: { paper: '#efe3cc', deco: 'tape', ink: '#3a1a22', label: 'THREAD COUNT' }, btn: { fill: '#3a1a1a', primary: '#e9a020', primaryText: '#2a1008' },
    env: (ctx, S) => kasutiEnv(ctx, S),
    under: (ctx, S) => frame.stretcher(ctx, S, { wood: '#c9a45a', ties: 10, tie: '#efe6c8', t: 0.4 }),
    base: () => {}, ground: (ctx, S) => kasutiGround(ctx, S), over: (ctx, S) => kasutiOver(ctx, S),
    cell: (ctx, S, d) => kasutiSkin(ctx, S, d), frame: () => {},
  },
  // kutch (1.12.0): chain stitch loops and shisha mirrors on dark cotton, a night courtyard with a mud-relief wall and a lamp
  kutch: {
    mat: 'stitch', pad: 0.117, snd: 'thread', pot: 'card', tool: 'hook', idle: [0.88, 0.97], place: ['thread', 'sparkle'], grid: false, light: false,
    card: { paper: '#efe0c6', deco: 'studs', ink: '#1c1840', label: 'EMBROIDERY PLAN' }, btn: { fill: '#1c1840', primary: '#f0a030', primaryText: '#1c1840' },
    env: (ctx, S) => kutchEnv(ctx, S),
    under: (ctx, S) => frame.stretcher(ctx, S, { wood: '#8a4a28', ties: 10, tie: '#f0e0b8', t: 0.4 }),
    base: () => {}, ground: (ctx, S) => kutchGround(ctx, S), over: (ctx, S) => kutchOver(ctx, S),
    cell: (ctx, S, d) => kutchSkin(ctx, S, d), frame: () => {},
  },
  // zardozi (1.12.0): couched gold and silver wire, spangles and stones on velvet in a teak adda frame, lamp-lit workshop
  zardozi: {
    mat: 'stitch', pad: 0.087, snd: 'bead', pot: 'wirecoil', tool: 'hook', idle: [0.88, 0.97], place: ['sparkle', 'ring'], grid: false, light: false,
    card: { paper: '#e9d8b0', deco: 'studs', ink: '#3a0c14', label: 'WIRE PLAN' }, btn: { fill: '#3a0c14', primary: '#e8b840', primaryText: '#2a0810' },
    env: (ctx, S) => zardoziEnv(ctx, S), under: (ctx, S) => zardoziUnder(ctx, S),
    base: () => {}, ground: (ctx, S) => zardoziGround(ctx, S), over: (ctx, S) => zardoziOver(ctx, S),
    cell: (ctx, S, d) => zardoziSkin(ctx, S, d), frame: () => {},
  },
  // gota patti (1.12.0): folded metallic ribbon sewn flat onto rani-pink silk, on a floor sheet under cusped arches
  gota: {
    mat: 'stitch', pad: 0.101, snd: 'soft', pot: 'ribbonroll', tool: ['needle', { thimble: true }], idle: [0.88, 0.97], place: ['sparkle', 'thread'], grid: false, light: 0.9,
    card: { paper: '#fbeee0', deco: 'tape', ink: '#7a0c3a', label: 'RIBBON PLAN' }, btn: { fill: '#7a0c3a', primary: '#f0c860', primaryText: '#3a0620' },
    env: (ctx, S) => gotaEnv(ctx, S), under: () => {},
    base: base.sheet({ blur: 0.8, drop: 0.25 }), ground: (ctx, S) => gotaGround(ctx, S), over: (ctx, S) => gotaOver(ctx, S),
    cell: (ctx, S, d) => gotaSkin(ctx, S, d), frame: () => {},
  },
  // chamba rumal (1.12.0): ink drawing first, then double-satin silk fill, on pale muslin before a mountain window (process pen-dye)
  chamba: {
    mat: 'stitch', pad: 0.123, snd: 'thread', pot: 'spool', tool: 'kalampen', idle: [0.88, 0.97], place: ['thread', 'ring'], grid: false, light: 0.9,
    card: { paper: '#fbf6e8', deco: 'plain', ink: '#1c3040', label: 'DRAWING' }, btn: { fill: '#24465a', primary: '#f0c060', primaryText: '#1c3040' },
    env: (ctx, S) => chambaEnv(ctx, S), under: (ctx, S) => frame.stretcher(ctx, S, { wood: '#d8b078', ties: 10, tie: '#fffbe8', t: 0.36 }),
    base: () => {}, ground: (ctx, S) => chambaGround(ctx, S), over: (ctx, S) => chambaOver(ctx, S),
    cell: (ctx, S, d) => chambaSkin(ctx, S, d), frame: () => {},
  },
  // lambani (1.12.0): patchwork of dark cotton, couched seams, herringbone and ladder stitch, cowries and mirrors, on dappled earth
  lambani: {
    mat: 'stitch', pad: 0.071, snd: 'bead', pot: 'beads', tool: 'needle', idle: [0.88, 0.97], place: ['thread', 'puff'], grid: false, light: false,
    card: { paper: '#ecdcc0', deco: 'tape', ink: '#3a1418', label: 'PATCH PLAN' }, btn: { fill: '#3a1418', primary: '#e8a830', primaryText: '#2a0c10' },
    env: (ctx, S) => lambaniEnv(ctx, S),
    under: (ctx, S) => { const r = S.rect, c = S.cell; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = c * 0.8; ctx.shadowOffsetY = c * 0.3; ctx.fillStyle = '#000'; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.restore(); },
    base: () => {}, ground: (ctx, S) => lambaniGround(ctx, S), over: (ctx, S) => lambaniOver(ctx, S),
    cell: (ctx, S, d) => lambaniSkin(ctx, S, d), frame: () => {},
  },
  // pipili (1.12.0): layered cutwork appliqué patches in blanket stitch on a deep-blue ground, under a sunny canopy valance
  pipili: {
    mat: 'stitch', pad: 0.109, snd: 'soft', pot: 'clothscrap', tool: 'pin', idle: [0.88, 0.97], place: ['puff', 'thread'], grid: false, light: false,
    card: { paper: '#fbf0d6', deco: 'tape', ink: '#1a2c6a', label: 'PATCH PLAN' }, btn: { fill: '#1a2c6a', primary: '#f4c430', primaryText: '#1a2c6a' },
    env: (ctx, S) => pipiliEnv(ctx, S),
    under: (ctx, S) => { const r = S.rect, c = S.cell; ctx.save(); ctx.shadowColor = 'rgba(40,10,0,0.55)'; ctx.shadowBlur = c * 0.8; ctx.shadowOffsetY = c * 0.3; ctx.fillStyle = '#000'; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.restore(); },
    base: () => {}, ground: (ctx, S) => pipiliGround(ctx, S), over: (ctx, S) => pipiliOver(ctx, S),
    cell: (ctx, S, d) => pipiliSkin(ctx, S, d), frame: () => {},
  },
};
const LAYOUT = {
  kasuti: { order: ['card', 'pal', 'board'], tone: 0.07, pad: 0.093 },
  kutch: { order: ['pal', 'board', 'card'], tone: -0.12, pad: 0.117 },
  zardozi: { order: ['board', 'card', 'pal'], tone: 0.14, pad: 0.087 },
  gota: { order: ['card', 'board', 'pal'], tone: 0.19, pad: 0.101 },
  chamba: { order: ['pal', 'card', 'board'], tone: 0.09, pad: 0.123 },
  lambani: { order: ['board', 'pal', 'card'], tone: -0.21, pad: 0.071 },
  pipili: { order: ['pal', 'board', 'card'], tone: 0.16, pad: 0.109 },
};
const RULES = [['kasuti', /kasuti/], ['kutch', /kutch/], ['zardozi', /zardozi|zardosi/], ['gota', /gota/], ['chamba', /chamba/], ['lambani', /lambani|banjara/], ['pipili', /pipili/]];
registerSceneSet({ scenes: SCENES, layout: LAYOUT, rules: RULES, from: 'scenes-n.js' });
export const SCENES_N = SCENES;

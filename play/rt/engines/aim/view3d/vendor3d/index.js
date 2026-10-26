// view3d slice used by the aim engine (vendored from platform/view3d 1.11.1 of the games repo: stage, human, rig, clips, sport clips, props).
export { createStage, webglSupported } from './stage.js';
export { loadHuman, loadClips, Human, SKIN_TONES, HAIR_COLORS } from './human.js';
export { buildClip, ease } from './author.js';
export { addSportClips, addBatClips, addThrowClips, addFieldClips } from './sportclips.js';
export { makeCricketBat, makeBall, makeStick } from './props.js';
export { addCap } from './equipment.js';
export * as THREE from './three.js';

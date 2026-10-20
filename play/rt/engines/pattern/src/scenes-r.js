// Scenes, 1.13.0: resist-dyed cloth. Registered through the scene registry (scene-registry.js). No human figures, no religious symbols, text-free art.
import { registerSceneSet } from './scene-registry.js';

const SCENES = {};
const LAYOUT = {};
const RULES = [];
registerSceneSet({ scenes: SCENES, layout: LAYOUT, rules: RULES, from: 'scenes-r.js' });
export const SCENES_R = SCENES;

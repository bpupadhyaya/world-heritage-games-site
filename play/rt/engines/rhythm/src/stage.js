// Stage dispatcher: the instrument drawn as the play surface. Routing lives in registry.js (built-ins in builtin.js, new stages in
// stages-ext.js); see README "How to add a stage".
import { buildStage } from './registry.js';
import './builtin.js';
import './stages-ext.js';

export function createStage(layout, key, S, lanes, P) { return buildStage(layout, key, S, lanes, P); }

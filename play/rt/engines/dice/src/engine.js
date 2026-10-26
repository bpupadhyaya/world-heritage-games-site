// dice engine: createEngine(spec, theme, text, options) -> { meta, createGame }  (docs/ENGINE-CONTRACT.md, activity engines)
// Dice-cup games against the computer: Generala, Ship Captain and Crew, Ten Thousand, Mia (params.game).
import { createActivityEngine } from '../../../platform/engine-kit/index.js';
import { createActivity } from './activity.js';

export const ENGINE_ID = 'dice';
export { createActivity };

export function createEngine(spec = {}, theme = {}, text = {}, options = {}) {
  return createActivityEngine({ createActivity, spec, theme, text, options });
}

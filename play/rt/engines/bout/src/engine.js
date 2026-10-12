// bout engine: createEngine(spec, theme, text, options) -> { meta, createGame }  (docs/ENGINE-CONTRACT.md, activity engines)
import { createActivityEngine } from '../../../platform/engine-kit/index.js';
import { createActivity } from './activity.js';

export const ENGINE_ID = 'bout';
export { createActivity };

export function createEngine(spec = {}, theme = {}, text = {}, options = {}) {
  return createActivityEngine({ createActivity, spec, theme, text, options });
}

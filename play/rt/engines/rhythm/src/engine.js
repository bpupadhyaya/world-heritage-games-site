// rhythm engine: createEngine(spec, theme, text, options) -> { meta, createGame }  (docs/ENGINE-CONTRACT.md, activity engines)
import { createActivityEngine } from '../../../platform/engine-kit/index.js';
import { createActivity } from './activity.js';

export const ENGINE_ID = 'rhythm';
export { createActivity };

export function createEngine(spec = {}, theme = {}, text = {}, options = {}) {
  // the spec's `variant` (e.g. charango, carillon) picks the instrument's look; rules never read it
  const make = (params, env) => createActivity(params, { ...env, variant: spec.variant ?? '' });
  return createActivityEngine({ createActivity: make, spec, theme, text, options });
}

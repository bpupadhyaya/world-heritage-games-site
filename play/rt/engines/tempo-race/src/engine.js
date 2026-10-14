// tempo-race engine: createEngine(spec, theme, text, options) -> { meta, createGame }  (docs/ENGINE-CONTRACT.md, activity engines)
import { createActivityEngine } from '../../../platform/engine-kit/index.js';
import { createActivity } from './activity.js';

export const ENGINE_ID = 'tempo-race';
export { createActivity };

export function createEngine(spec = {}, theme = {}, text = {}, options = {}) {
  // Audio start rule (1.5.1): previews and store shots (?autoplay=1 / ?shot=1) are silent; options.soundLog (an array) records
  // every sound requested (audits: nothing but the count-in may sound before the first stroke).
  const quiet = options.autoplay === true || options.shot === true;
  const wrapped = (params, env) => createActivity(params, { ...env, audio: quiet ? null : env.audio, options });
  return createActivityEngine({ createActivity: wrapped, spec, theme, text, options });
}

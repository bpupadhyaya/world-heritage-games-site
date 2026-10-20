// shape-craft engine: createEngine(spec, theme, text, options) -> { meta, createGame }  (docs/ENGINE-CONTRACT.md, activity engines)
import { createActivityEngine } from '../../../platform/engine-kit/index.js';
import { createActivity } from './activity.js';

export const ENGINE_ID = 'shape-craft';
export { createActivity };

export function createEngine(spec = {}, theme = {}, text = {}, options = {}) {
  // Audio start rule (1.4.1): previews and store shots (?autoplay=1 / ?shot=1) are silent; options.soundLog (an array) records
  // every sound the craft requests (audits: nothing may sound before the first input).
  const quiet = options.autoplay === true || options.shot === true;
  // 1.5.0: a top-level spec.scene names the workshop exactly (params.scene wins when both are given)
  const named = (params) => (spec.scene && !params.scene ? { ...params, scene: spec.scene } : params);
  const wrapped = (params, env) => createActivity(named(params), { ...env, audio: quiet ? null : env.audio, options });
  return createActivityEngine({ createActivity: wrapped, spec, theme, text, options });
}

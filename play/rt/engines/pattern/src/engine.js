// pattern engine: createEngine(spec, theme, text, options) -> { meta, createGame }  (docs/ENGINE-CONTRACT.md, activity engines)
import { createActivityEngine } from '../../../platform/engine-kit/index.js';
import { createActivity } from './activity.js';

export const ENGINE_ID = 'pattern';
export { createActivity };

export function createEngine(spec = {}, theme = {}, text = {}, options = {}) {
  // Scene routing (scenes.js routeScene): params.scene, then spec.scene (exact ids), then the words of spec.variant and the title.
  const hint = spec.variant ?? null, sceneId = spec.scene ?? null;
  const factory = hint || sceneId ? (params, env) => createActivity({ ...params, ...(hint ? { __hint: hint } : {}), ...(sceneId ? { __scene: sceneId } : {}) }, env) : createActivity;
  // Audio start rule (1.6.1): previews and store shots (?autoplay=1 / ?shot=1) are silent; options.soundLog (an array) records
  // every sound the craft requests (audits: nothing may sound before the first input).
  const quiet = options.autoplay === true || options.shot === true;
  const wrapped = (params, env) => factory(params, { ...env, audio: quiet ? null : env.audio, options });
  return createActivityEngine({ createActivity: wrapped, spec, theme, text, options });
}

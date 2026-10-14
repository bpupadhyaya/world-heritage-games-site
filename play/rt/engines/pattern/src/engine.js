// pattern engine: createEngine(spec, theme, text, options) -> { meta, createGame }  (docs/ENGINE-CONTRACT.md, activity engines)
import { createActivityEngine } from '../../../platform/engine-kit/index.js';
import { createActivity } from './activity.js';

export const ENGINE_ID = 'pattern';
export { createActivity };

export function createEngine(spec = {}, theme = {}, text = {}, options = {}) {
  // The scene table (scenes.js) is keyed by params.scene, then by spec.variant / spec.scene, then by the title; games need no changes.
  const hint = spec.scene ?? spec.variant ?? null;
  const factory = hint ? (params, env) => createActivity({ ...params, __hint: hint }, env) : createActivity;
  // Audio start rule (1.6.1): previews and store shots (?autoplay=1 / ?shot=1) are silent; options.soundLog (an array) records
  // every sound the craft requests (audits: nothing may sound before the first input).
  const quiet = options.autoplay === true || options.shot === true;
  const wrapped = (params, env) => factory(params, { ...env, audio: quiet ? null : env.audio, options });
  return createActivityEngine({ createActivity: wrapped, spec, theme, text, options });
}

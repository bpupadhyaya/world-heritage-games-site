// pattern engine: createEngine(spec, theme, text, options) -> { meta, createGame }  (docs/ENGINE-CONTRACT.md, activity engines)
import { createActivityEngine } from '../../../platform/engine-kit/index.js';
import { createActivity } from './activity.js';

export const ENGINE_ID = 'pattern';
export { createActivity };

export function createEngine(spec = {}, theme = {}, text = {}, options = {}) {
  // The scene table (scenes.js) is keyed by params.scene, then by spec.variant / spec.scene, then by the title; games need no changes.
  const hint = spec.scene ?? spec.variant ?? null;
  const factory = hint ? (params, env) => createActivity({ ...params, __hint: hint }, env) : createActivity;
  return createActivityEngine({ createActivity: factory, spec, theme, text, options });
}

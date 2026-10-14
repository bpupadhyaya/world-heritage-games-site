// rhythm engine: createEngine(spec, theme, text, options) -> { meta, createGame }  (docs/ENGINE-CONTRACT.md, activity engines)
import { createActivityEngine } from '../../../platform/engine-kit/index.js';
import { createActivity } from './activity.js';

export const ENGINE_ID = 'rhythm';
export { createActivity };

export function createEngine(spec = {}, theme = {}, text = {}, options = {}) {
  // the spec's `variant` (e.g. charango, carillon) picks the instrument's look; rules never read it
  // env.storage is not part of the activity env, so it is captured from createGame(env) and passed on (song speed is persisted)
  let storage = null;
  // Audio start rule (1.5.2): previews and store shots (?autoplay=1 / ?shot=1) get no audio graph (silent on page load);
  // options.voiceLog still records which voice every lane would trigger, options.soundLog every drone/pulse/count-in request.
  const quiet = options.autoplay === true || options.shot === true;
  const make = (params, env) => createActivity(params, { ...env, audio: quiet ? null : env.audio, variant: spec.variant ?? '', storage, options });
  const eng = createActivityEngine({ createActivity: make, spec, theme, text, options });
  return { ...eng, createGame(env) { storage = env?.storage ?? null; return eng.createGame(env); } };
}

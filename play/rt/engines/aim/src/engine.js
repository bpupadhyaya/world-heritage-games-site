// aim engine: createEngine(spec, theme, text, options) -> { meta, createGame }  (docs/ENGINE-CONTRACT.md, activity engines)
import { createActivityEngine } from '../../../platform/engine-kit/index.js';
import { createActivity } from './activity.js';
import { soundTap } from './sound.js';

export const ENGINE_ID = 'aim';
export { createActivity };

export function createEngine(spec = {}, theme = {}, text = {}, options = {}) {
  // Audio start rule (1.3.1): previews and store shots (?autoplay=1 / ?shot=1) are silent; options.soundLog (an array) records
  // every sound requested (audits: nothing may sound before the first input).
  const quiet = options.autoplay === true || options.shot === true;
  const log = Array.isArray(options.soundLog) ? options.soundLog : null;
  soundTap.log = log;
  const wrapped = (params, env) => {
    let audio = quiet ? null : env.audio;
    if (log) { const base = audio; audio = new Proxy(base ?? {}, { get: (t, k) => (k === 'tone' ? (o) => { log.push({ kind: 'tone' }); return base?.tone?.(o); } : t[k]) }); }
    return createActivity(params, { ...env, audio, options });
  };
  const holder = { figs: null };
  const eng = createActivityEngine({ createActivity: (params, env) => wrapped(params, { ...env, figs: holder.figs }), spec, theme, text, options });
  // 1.8.0 `look.figures: 'view3d'`: real 3D people are baked into sprites before the first frame (browsers with WebGL only; otherwise the vector
  // figures stay). The DOM and WebGL code lives in ../view3d (outside the pure src), loaded on demand.
  if (spec?.params?.look?.figures === 'view3d' && options.figures !== false && typeof globalThis.requestAnimationFrame === 'function') {
    const make = eng.createGame;
    eng.createGame = async (env) => {
      try { const m = await import('../view3d/figures3d.js'); holder.figs = await m.loadFigures(spec.params.look); } catch (e) { holder.figs = null; }
      return make(env);
    };
  }
  return eng;
}

// mancala engine: createEngine(spec, theme, text) -> { meta, createGame, rules }  (docs/ENGINE-CONTRACT.md)
import { createBoardEngine } from '../../../platform/engine-kit/index.js';
import { createRules } from './rules.js';

export const ENGINE_ID = 'mancala';
export { createRules };

export function createEngine(spec = {}, theme = {}, text = {}, options = {}) {
  const rules = createRules(spec.params ?? {});
  return createBoardEngine({ rules, spec, theme, text, options });
}

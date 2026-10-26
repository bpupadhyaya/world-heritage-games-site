// shape-craft technique `pour` (1.26.0 Kitchen Crafts): tea poured with gravity and timing. params.mode selects the game:
//   high   Moroccan mint tea poured from a tall pot held high into glasses on a tray (pour-high.js)
//   gongfu oolong brewed in a small clay pot: circle pour, rinse, timed infusions, fairness pitcher, equal cups (pour-gongfu.js)
//   pull   Hong Kong milk tea pulled between two pots through a cloth strainer (pour-pull.js)
// Registered here; the scenes are in scenes-kitchen-tea.js (ids kc-tea-...).
import { registerTechnique } from './registry.js';
import { createHigh } from './pour-high.js';
import { createGongfu } from './pour-gongfu.js';
import { createPull } from './pour-pull.js';

const MODES = { high: createHigh, gongfu: createGongfu, pull: createPull };
registerTechnique('pour', { make: (P, env) => (MODES[P.mode] ?? createHigh)(P, env), scene: 'kc-tea-riad', mat: 'clay' });

// shape-craft technique `brew` (1.26.0): a pot on the heat. Three modes share the file and nothing else:
//   cezve   Turkish coffee: slide a copper pot on and off hot sand so the foam rises three times and never boils over, then pour (brew-cezve.js)
//   jebena  Ethiopian and Eritrean coffee: roast, pound, boil in the clay pot, pour from a height (brew-jebena.js)
//   syrup   Cambodian palm sugar: stir the wok in rhythm, test the thread, ladle into the moulds (brew-syrup.js)
import { registerTechnique } from './registry.js';
import { createCezve } from './brew-cezve.js';
import { createJebena } from './brew-jebena.js';
import { createSyrup } from './brew-syrup.js';

const MODES = { cezve: createCezve, jebena: createJebena, syrup: createSyrup };
const SCENE_OF = { cezve: 'kc-brew-cezve', jebena: 'kc-brew-jebena', syrup: 'kc-brew-syrup' };
export function createBrew(P, env) {
  const make = MODES[P.mode] ?? createCezve;
  return make(P, env);
}
registerTechnique('brew', { make: (P, env) => createBrew(P, env), scene: 'kc-brew-cezve', mat: 'metal', defaults: { mode: 'cezve' } });
void SCENE_OF;

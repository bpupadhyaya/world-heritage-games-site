// shape-craft technique `dough` (1.26.0, Kitchen Crafts of the World): crafts worked in dough with the hands and a few tools.
// params.mode picks the craft:
//   pleat-round     khinkali: pinch and fold the rim of a round wrapper in sequence, then twist the topknot      (src/dough-khinkali.js)
//   pleat-crescent  jiaozi: fill, fold in half, pleat one way along the front edge, seal; a tray of dumplings   (src/dough-jiaozi.js)
//   orecchiette     roll a rope, cut it, drag each piece to curl it and flip it over the thumb                  (src/dough-pasta.js)
//   mould           maamoul: fill a ball of dough, press it into a carved mould, level, knock out, arrange     (src/dough-maamoul.js)
// Each game has its own kitchen (scenes-kitchen-dough.js). Watch and learn plays the same gestures through the same pointer code as a player.
import { registerTechnique } from './registry.js';
import { createKhinkali } from './dough-khinkali.js';
import { createJiaozi } from './dough-jiaozi.js';
import { createPasta } from './dough-pasta.js';
import { createMaamoul } from './dough-maamoul.js';

const MODES = { 'pleat-round': createKhinkali, 'pleat-crescent': createJiaozi, orecchiette: createPasta, mould: createMaamoul };
export const DOUGH_MODES = MODES;
const SCENE_BY_MODE = { 'pleat-round': 'kc-dough-georgia' };

registerTechnique('dough', {
  make: (P, env) => {
    const mode = MODES[P.mode] ? P.mode : 'pleat-round';
    return MODES[mode](P, env);
  },
  scene: 'kc-dough-georgia',
  mat: 'clay',
});
void SCENE_BY_MODE;

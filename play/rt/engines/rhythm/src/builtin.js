// The built-in stage routes, registered once, in the same order the pre-1.9.0 dispatchers tried them.
// Do not add new instruments here: write a new stage file and add one import line to stages-ext.js (see README "How to add a stage").
import { defineFamily, registerHook } from './registry.js';
import { createStringStage, IDS as STRING_IDS, PROF as STRING_PROF } from './strings.js';
import { createPadStage, IDS as PAD_IDS, VIEW as PAD_VIEW } from './pads.js';
import { createWindStage, IDS as WIND_IDS, LOOK as WIND_LOOK, VIEW as WIND_VIEW } from './winds.js';
import { WIND2_IDS } from './winds2.js';
import { createKeyStage, IDS as KEY_IDS } from './keys.js';
import { createGongStage, GONG_IDS } from './gongs.js';
import { createDanceStage, IDS as DANCE_IDS, DRESS as DANCE_DRESS, VIEW as DANCE_VIEW } from './dance.js';
import { createVocalStage, IDS as VOCAL_IDS } from './vocal.js';
import { createBagpipeStage, IDS as PIPE_IDS } from './bagpipe.js';

defineFamily('strings', { fallback: 'lute', ids: STRING_IDS, create: createStringStage, tables: { PROF: STRING_PROF } });
defineFamily('pads', { fallback: 'multi', ids: PAD_IDS, create: createPadStage, tables: { VIEW: PAD_VIEW } });
defineFamily('voice', { fallback: 'yodel', ids: VOCAL_IDS, create: createVocalStage });
defineFamily('holes', { fallback: 'bansuri', ids: [...WIND2_IDS, ...WIND_IDS], create: createWindStage, tables: { LOOK: WIND_LOOK, VIEW: WIND_VIEW } });
defineFamily('keys', { fallback: 'balafon', ids: KEY_IDS, create: createKeyStage });
defineFamily('circle', { fallback: 'gamelan', ids: GONG_IDS, create: createGongStage });
defineFamily('steps', { fallback: 'floor', ids: DANCE_IDS, create: createDanceStage, tables: { DRESS: DANCE_DRESS, VIEW: DANCE_VIEW } });

// the Highland bagpipe is a hook (it replaces the whole wind stage), tried before any id route
registerHook('holes', (k) => PIPE_IDS.some(([re]) => re.test(k)), (S, lanes, P) => createBagpipeStage(S, lanes, P));

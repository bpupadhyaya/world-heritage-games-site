// Stage dispatcher: the instrument drawn as the play surface (see strings.js, pads.js, winds.js, keys.js).
import { createStringStage, stringId } from './strings.js';
import { createPadStage, padId } from './pads.js';
import { createWindStage, windId } from './winds.js';
import { createKeyStage, keyId } from './keys.js';
import { createGongStage, gongId } from './gongs.js';
import { createDanceStage, danceId } from './dance.js';

export function createStage(layout, key, S, lanes, P) {
  if (layout === 'strings') return createStringStage(stringId(key), S, lanes, P);
  if (layout === 'pads') return createPadStage(padId(key), S, lanes, P);
  if (layout === 'holes') return createWindStage(windId(key), S, lanes, P);
  if (layout === 'keys') return createKeyStage(keyId(key), S, lanes, P);
  if (layout === 'circle') return createGongStage(gongId(key), S, lanes, P);
  if (layout === 'steps') return createDanceStage(danceId(key), S, lanes, P);
  return createPadStage('multi', S, lanes, P);
}

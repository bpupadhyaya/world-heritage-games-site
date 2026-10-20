// Scene registry (1.7.0). A scene file (scenes-f.js, scenes-g.js ...) calls registerSceneSet at import time; scenes.js merges every
// registered set after the built-in tables. Kept in its own module so extension files can import it without a circular import.
export const PENDING = [];

// registerSceneSet({ scenes: { id: {...} }, layout?: { id: { order, tone, pad } }, rules?: [[id, /words/, /exclusion?/]], from?: 'scenes-f.js' })
//   scenes  scene definitions (same shape as SCENES_A..E rows)
//   layout  the per-scene luminance layout (order of card/board/pal, tone, pad), merged into the scene (needed for tools/whg distinct)
//   rules   word routes used ONLY when a spec does not name its scene; extension rules are tried before the built-in ones
export function registerSceneSet(set) {
  if (!set || typeof set.scenes !== 'object') throw new Error('registerSceneSet: { scenes } is required');
  PENDING.push(set);
  return Object.keys(set.scenes);
}

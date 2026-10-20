// shape-craft registry (1.5.0). Pure data collector with NO imports, so any extension file can import it and the core modules can
// look names up lazily (geom.js, bend.js, props.js, scenes.js, sound.js, activity.js read EXT at call time, built-in tables first).
// New work = a new file that calls the register* functions below + ONE import line in ext.js. Names must be unique: a name that
// already exists (built-in or extension) throws at registration or is reported by test/registry.test.js.
export const EXT = {
  techniques: new Map(),   // id -> { make(P, env), defaults?, scene?, mat? }
  figures: {},             // carve silhouettes  (geom.js FIGURES rows: { mirror, shapes: (j) => [...] })
  bendFigures: {},         // wire figures       (bend.js BEND_FIGURES rows)
  profiles: {},            // vessel profiles    (geom.js PROFILES rows: radius fractions bottom -> top)
  scenes: {},              // workshops          (scenes.js S rows)
  rules: [],               // [scene id, regexp over title/native/alt/figure/profile/layout, optional exclusion]
  walls: {}, floorKinds: {}, floorEx: {}, litter: {}, frames: {},   // scene drawing kinds (scenes.js WALL, FLOOR_KIND, FLOOR_EX, LITTER, FRAMES)
  props: {},               // held/dock props    (props.js PROPS: (ctx, s, o) => void)
  soundMat: {},            // scene id -> material of the sound kit (sound.js MAT)
};
export const SCENE_ID_LIST = [];   // live list of scene ids (scenes.js seeds the built-ins; registerSceneSet appends)
export const TECHNIQUE_LIST = [];  // live list of technique ids (activity.js seeds the built-ins; registerTechnique appends)

const once = (table, name, what) => { if (table[name]) throw new Error(`shape-craft registry: ${what} "${name}" is already registered`); };

// registerTechnique(id, { make, scene?, mat? })
//   make(P, env) => technique instance, the same object the built-in createLathe/createCarve/... return ({ state, score, ... }); P already
//   carries the resolved scene object as P.scene. scene = default scene id when the spec names none and no word rule matches;
//   mat = sound material fallback ('wire', 'silk', 'paper', 'clay' ...).
export function registerTechnique(id, def) {
  if (EXT.techniques.has(id) || TECHNIQUE_LIST.includes(id)) throw new Error(`shape-craft registry: technique "${id}" is already registered`);
  EXT.techniques.set(id, def); TECHNIQUE_LIST.push(id); return id;
}
export function registerFigure(name, def) { once(EXT.figures, name, 'carve figure'); EXT.figures[name] = def; return name; }
export function registerBendFigure(name, def) { once(EXT.bendFigures, name, 'bend figure'); EXT.bendFigures[name] = def; return name; }
export function registerProfile(name, radii) { once(EXT.profiles, name, 'profile'); EXT.profiles[name] = radii; return name; }
export function registerProp(name, draw) { once(EXT.props, name, 'prop'); EXT.props[name] = draw; return name; }

// registerSceneSet({ scenes: { id: {...} }, rules?: [[id, /words/, /exclusion?/]], walls?, floorKinds?, floorEx?, litter?, frames?, props?, soundMat?: { id: 'wood' } })
//   scenes   workshop rows (same fields as the built-in table in scenes.js)
//   rules    word routes, used only when a spec does not name `scene`; extension rules are tried before the built-in ones
//   walls... drawing kinds the new scenes refer to (wall: 'kind', floor: 'kind', litter k, frame: 'kind'): the function signatures of the built-ins
export function registerSceneSet(set) {
  if (!set || typeof set.scenes !== 'object') throw new Error('registerSceneSet: { scenes } is required');
  for (const [id, sc] of Object.entries(set.scenes)) { once(EXT.scenes, id, 'scene'); if (SCENE_ID_LIST.includes(id)) throw new Error(`shape-craft registry: scene "${id}" is already registered`); EXT.scenes[id] = sc; SCENE_ID_LIST.push(id); }
  for (const [id, re, not] of set.rules ?? []) EXT.rules.push([re, id, not]);   // written [id, regexp, exclusion?] like the pattern engine; stored in the built-in RULES order [regexp, id]
  for (const k of ['walls', 'floorKinds', 'floorEx', 'litter', 'frames', 'props', 'soundMat']) for (const [n, v] of Object.entries(set[k] ?? {})) { once(EXT[k], n, k); EXT[k][n] = v; }
  return Object.keys(set.scenes);
}

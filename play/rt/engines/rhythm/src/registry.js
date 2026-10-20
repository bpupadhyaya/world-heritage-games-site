// Stage route registry (1.9.0). ONE place that answers "which instrument is drawn for this lane layout and this key?".
// A key is the lowercased text `instrument | variant | title` the activity builds; a layout is `strings`, `pads`, `holes`, `keys`,
// `circle`, `steps` or `voice`. Resolution order inside a layout (first hit wins, deterministic):
//   1. hooks registered with registerHook (a predicate on the key; used for stages that are not an id, e.g. the bagpipe)
//   2. extension routes (registered by new stage files, in import order of ./stages-ext.js)
//   3. built-in routes (the tables the original files exported before 1.9.0)
//   4. the layout fallback id
// So a new stage file never has to edit a built-in regex: its route is tried before the built-ins.
const families = new Map();

function fam(layout) {
  let f = families.get(layout);
  if (!f) { f = { layout, hooks: [], ext: [], builtin: [], fallback: null, create: null, builders: new Map(), tables: new Map() }; families.set(layout, f); }
  return f;
}

// the built-in family (called once per layout by builtin.js): fallback id, default factory create(id, S, lanes, P, key), shared tables
export function defineFamily(layout, { fallback, create, ids = [], tables = {} }) {
  const f = fam(layout);
  f.fallback = fallback; f.create = create; f.builtin = [...ids];
  for (const [name, obj] of Object.entries(tables)) f.tables.set(name, obj);
  return f;
}

// registerStage(layout, spec): the one entry point every family wrapper uses.
//   spec.id       stage id (also the id handed to the default factory)
//   spec.match    RegExp or array of RegExp tested against the key (omit for an id reachable only through `instrument`/hook)
//   spec.build    (S, lanes, P, { key, id }) => stage object; omit to use the family's default factory with spec.tables
//   spec.tables   { PROF: { [id]: profile }, VIEW: {...}, DRESS: {...}, LOOK: {...} }: rows added to the family's shared tables
export function registerStage(layout, spec) {
  const f = fam(layout);
  if (!spec || !spec.id) throw new Error(`registerStage(${layout}): spec.id is required`);
  const res = spec.match == null ? [] : Array.isArray(spec.match) ? spec.match : [spec.match];
  for (const re of res) f.ext.push([re, spec.id]);
  if (spec.build) f.builders.set(spec.id, spec.build);
  for (const [name, rows] of Object.entries(spec.tables ?? {})) {
    const t = f.tables.get(name);
    if (!t) throw new Error(`registerStage(${layout}): family has no shared table "${name}" (known: ${[...f.tables.keys()].join(', ') || 'none'})`);
    Object.assign(t, rows);
  }
  return spec.id;
}
// 1.19.0: { first: true } puts the hook in front of the built-in ones (the Highland pipe hook of builtin.js is a broad regex), used by the parametric bagpipes
export function registerHook(layout, match, build, o = {}) { const f = fam(layout); if (o.first) f.hooks.unshift({ match, build }); else f.hooks.push({ match, build }); }

export function stageIdFor(layout, key) {
  const f = families.get(layout);
  if (!f) return null;
  const k = String(key || '').toLowerCase();
  for (const [re, id] of f.ext) if (re.test(k)) return id;
  for (const [re, id] of f.builtin) if (re.test(k)) return id;
  return f.fallback;
}

export function buildStage(layout, key, S, lanes, P) {
  const f = families.get(layout);
  if (!f) return families.get('pads').create('multi', S, lanes, P, key);   // unknown layout: the generic disc grid, as before 1.9.0
  const k = String(key || '').toLowerCase();
  for (const h of f.hooks) if (h.match(k)) return h.build(S, lanes, P, { key, id: null });
  const id = stageIdFor(f.layout, key);
  const b = f.builders.get(id);
  if (b) return b(S, lanes, P, { key, id });
  return f.create(id, S, lanes, P, key);
}

export function routeTable(layout) { const f = families.get(layout); return f ? { hooks: f.hooks.length, ext: f.ext.map(([re, id]) => [String(re), id]), builtin: f.builtin.map(([re, id]) => [String(re), id]), fallback: f.fallback } : null; }

// family-named wrappers: new files import these, never registerStage directly
export const registerStringStage = (spec) => registerStage('strings', spec);   // lutes, fiddles, zithers, harps (tables: PROF)
export const registerDrumStage = (spec) => registerStage('pads', spec);        // drums, pads, scrape boards
export const registerWindStage = (spec) => registerStage('holes', spec);       // pipes, flutes, reeds, bagpipes
export const registerKeyStage = (spec) => registerStage('keys', spec);         // bars, tines, bells, bellows
export const registerGongStage = (spec) => registerStage('circle', spec);      // gongs and cycles
export const registerDanceStage = (spec) => registerStage('steps', spec);      // floors and dances (tables: DRESS, VIEW)
export const registerVoiceStage = (spec) => registerStage('voice', spec);      // sung, throat, whistled voice

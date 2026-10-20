// Scene table of the pattern engine (1.5.0). A scene is the craft's real context: environment, work surface, cell rendering as the
// craft, the maker's tool and its animation, supplies, placement feedback and sounds. Picked by params.scene, then by spec
// variant / scene, then by title and summary words, so game folders need no change. See docs/ENGINE-CONTRACT.md "Shared chrome".
import { SCENES_A } from './scenes-a.js';
import { SCENES_B } from './scenes-b.js';
import { SCENES_C } from './scenes-c.js';
import { SCENES_D } from './scenes-d.js';
import { SCENES_E } from './scenes-e.js';
import { PENDING } from './scene-registry.js';
import './scenes-ext.js';   // 1.7.0: extension manifest, one import line per new scenes-*.js file (see README "How to add a scene")

export const SCENES = { ...SCENES_A, ...SCENES_B, ...SCENES_C, ...SCENES_D, ...SCENES_E };

// Screen layout and ambient light per scene: the order of reference card, work and tray, the room left around the work, and how dim
// or bright the surroundings are.
// Chosen so that no two crafts of a bucket share a luminance layout (tools/whg distinct).
const LAYOUT = {
  adinkra: { order: ['card', 'board', 'pal'], tone: 0.5, pad: 0.08 },
  alebrije: { order: ['card', 'pal', 'board'], tone: -0.35, pad: 0.17 },
  blockprint: { order: ['board', 'pal', 'card'], tone: -0.35, pad: 0.15 },
  bogolan: { order: ['board', 'card', 'pal'], tone: 0.5, pad: 0.15 },
  khokhloma: { order: ['pal', 'board', 'card'], tone: -0.35, pad: 0.19 },
  kuba: { order: ['pal', 'board', 'card'], tone: 0, pad: 0.09 },
  kumiko: { order: ['board', 'card', 'pal'], tone: -0.35, pad: 0.09 },
  lukasa: { order: ['board', 'card', 'pal'], tone: 0, pad: 0.09 },
  macau: { order: ['board', 'pal', 'card'], tone: -0.35, pad: 0.08 },
  mashrabiya: { order: ['card', 'board', 'pal'], tone: -0.35, pad: 0.1 },
  mehndi: { order: ['pal', 'card', 'board'], tone: 0.5, pad: 0.05 },
  ndebele: { order: ['board', 'pal', 'card'], tone: -0.35, pad: 0.15 },
  truck: { order: ['pal', 'card', 'board'], tone: -0.35, pad: 0.17 },
  temari: { order: ['card', 'board', 'pal'], tone: -0.35, pad: 0.19 },
  warli: { order: ['board', 'pal', 'card'], tone: 0.5, pad: 0.08 },
  zulu: { order: ['pal', 'card', 'board'], tone: 0, pad: 0.1 },
  adire: { order: ['board', 'pal', 'card'], tone: -0.35, pad: 0.17 },
  batik: { order: ['pal', 'card', 'board'], tone: -0.35, pad: 0.18 },
  celtic: { order: ['board', 'card', 'pal'], tone: 0.5, pad: 0.16 },
  crossstitch: { order: ['pal', 'card', 'board'], tone: -0.35, pad: 0.1 },
  dhaka: { order: ['card', 'board', 'pal'], tone: -0.35, pad: 0.09 },
  ikat: { order: ['card', 'pal', 'board'], tone: -0.35, pad: 0.17 },
  kente: { order: ['card', 'board', 'pal'], tone: -0.35, pad: 0.13 },
  lamba: { order: ['board', 'card', 'pal'], tone: -0.35, pad: 0.17 },
  nanduti: { order: ['board', 'pal', 'card'], tone: 0.5, pad: 0.1 },
  nordic: { order: ['pal', 'card', 'board'], tone: 0.5, pad: 0.08 },
  carpet: { order: ['pal', 'board', 'card'], tone: -0.35, pad: 0.17 },
  phulkari: { order: ['board', 'pal', 'card'], tone: -0.35, pad: 0.1 },
  sashiko: { order: ['card', 'pal', 'board'], tone: -0.35, pad: 0.09 },
  songket: { order: ['card', 'board', 'pal'], tone: 0.5, pad: 0.17 },
  suzani: { order: ['pal', 'card', 'board'], tone: 0.5, pad: 0.12 },
  tartan: { order: ['board', 'pal', 'card'], tone: -0.35, pad: 0.17 },
  tatreez: { order: ['board', 'card', 'pal'], tone: -0.35, pad: 0.1 },
  karesansui: { order: ['card', 'board', 'pal'], tone: 0.5, pad: 0.09 },
  tanghua: { order: ['pal', 'board', 'card'], tone: -0.35, pad: 0.17 },
  mosaic: { order: ['card', 'pal', 'board'], tone: 0, pad: 0.16 },
  zellij: { order: ['card', 'pal', 'board'], tone: 0, pad: 0.09 },
};
for (const [id, l] of Object.entries(LAYOUT)) if (SCENES[id]) Object.assign(SCENES[id], l);

// Extension scene sets (scene-registry.js registerSceneSet): added after the built-ins; an id may be defined once.
const EXT_RULES = [];
for (const set of PENDING) {
  for (const [id, sc] of Object.entries(set.scenes)) {
    if (SCENES[id]) throw new Error(`scene "${id}" is already defined (registerSceneSet from ${set.from || 'an extension'})`);
    SCENES[id] = sc;
  }
  for (const [id, l] of Object.entries(set.layout ?? {})) if (set.scenes[id]) Object.assign(SCENES[id], l);
  for (const r of set.rules ?? []) EXT_RULES.push(r);
}

// [scene id, regular expression over "variant title", optional exclusion regexp]; the first match wins. FALLBACK ONLY: since 1.7.0 a spec that
// names its scene (params.scene or spec.scene) is routed by that id and never by these words. Extension rules (registerSceneSet) are tried first.
const RULES = [
  ['songket', /songket/], ['kente', /kente/], ['dhaka', /dhaka|jamdani/], ['lamba', /lamba/], ['tartan', /tartan/], ['kuba', /kuba/],
  ['carpet', /carpet|persian|knotting/, /felt|shyrdak|kilim/], ['ikat', /ikat/], ['batik', /batik/], ['adire', /adire/], ['bogolan', /bogolan|mud.?cloth/],
  ['adinkra', /adinkra/], ['blockprint', /block.?print/], ['tatreez', /tatreez/], ['crossstitch', /cross.?stitch/], ['phulkari', /phulkari/],
  ['suzani', /suzani/], ['sashiko', /sashiko/], ['nordic', /nordic|colourwork|knitting/, /lace|shawl|haapsalu/], ['temari', /temari/], ['nanduti', /nandut|ñandut/],
  ['warli', /warli/], ['ndebele', /ndebele/], ['alebrije', /alebrije/], ['khokhloma', /khokhloma/], ['truck', /truck/], ['mehndi', /mehndi|henna/],
  ['tanghua', /tanghua|sugar/], ['lukasa', /lukasa/], ['zulu', /zulu/], ['celtic', /celtic/], ['macau', /macau|pavement|calçada/],
  ['zellij', /zellij/], ['mosaic', /mosaic|tessellat/], ['mashrabiya', /mashrabiya/], ['kumiko', /kumiko/], ['karesansui', /karesansui|gravel garden/],
  ['kolam', /kolam/], ['rangoli', /rangoli/], ['papercut', /paper.?cut|rosette/],
  ['andean', /andean|woven band/], ['ndebele', /painted house/], ['sashiko', /stitched cloth/], ['kente', /strip cloth/],
];
const GENERIC = new Set(['generic', 'none']);   // scene: "generic" forces the plain framed work in a material
// Which scene does a game use? Order: 1. params.scene (an id) 2. spec.scene (an id; handed over as P.__scene) 3. words (spec.variant / title)
// through the rules. An explicit id that does not exist is a mistake: it gets the generic look, never a guess from the title.
export function routeScene(P, text) {
  for (const key of [P.scene !== 'auto' ? P.scene : null, P.__scene]) {
    if (!key) continue;
    if (GENERIC.has(key)) return { id: null, scene: null, via: 'explicit' };
    return SCENES[key] ? { id: key, scene: SCENES[key], via: 'explicit' } : { id: null, scene: null, via: 'unknown' };
  }
  const hay = `${P.__hint ?? ''} ${text?.title ?? ''}`.toLowerCase();
  for (const [id, re, not] of [...EXT_RULES, ...RULES]) if (SCENES[id] && re.test(hay) && !(not && not.test(hay))) return { id, scene: SCENES[id], via: 'words' };
  return { id: null, scene: null, via: 'none' };
}
export function pickScene(P, text) { return routeScene(P, text).scene; }

// Spec-selectable craft kits (tempo-race 1.6.0): params.craft = "outrigger" or { id, world, hull, sail, skins }.
// A craft carries its silhouette (crafts.js), its world (sky, water, backdrop; craft-world.js), its pad skin and its sounds.
import { CRAFTS, CRAFT_IDS } from './crafts.js';
import { WORLDS } from './craft-world.js';

export { CRAFT_IDS };
export const WORLD_IDS = Object.keys(WORLDS);
const DEFAULT_WORLD = { outrigger: 'pacific-cliffs', voyageur: 'boreal-lake', 'ice-canoe': 'ice-river', dugout: 'mangrove', mokoro: 'delta-gold', jangada: 'beach-dawn', felucca: 'nile-dusk', ngalawa: 'turquoise-cays', sloop: 'bahama-bank' };
// pad skins: [left, right] colours and the surface texture
const PADS = {
  outrigger: { colors: ['#16688a', '#0f4f73'], weave: 'ripple', radius: 40 },
  voyageur: { colors: ['#4b6a3a', '#3a5430'], weave: 'ripple', radius: 34 },
  'ice-canoe': { colors: ['#4a7a9a', '#3a6384'], weave: 'ice', radius: 30 },
  dugout: { colors: ['#6a4a2a', '#563a20'], weave: 'planks', radius: 24 },
  mokoro: { colors: ['#6a7a3a', '#55632e'], weave: 'ripple', radius: 40 },
  jangada: { colors: ['#b25c3a', '#8f4a30'], weave: 'ripple', radius: 40 },
  felucca: { colors: ['#b4703c', '#8f592e'], weave: 'ripple', radius: 40 },
  ngalawa: { colors: ['#13808f', '#0d6572'], weave: 'ripple', radius: 40 },
  sloop: { colors: ['#14829a', '#0e6a80'], weave: 'ripple', radius: 40 },
};

export function resolveCraft(c) {
  if (!c) return null;
  const spec = typeof c === 'string' ? { id: c } : c;
  const def = CRAFTS[spec.id];
  if (!def) return null;
  const wIn = spec.world;
  const baseW = WORLDS[typeof wIn === 'string' ? wIn : DEFAULT_WORLD[spec.id]] ?? WORLDS['turquoise-cays'];
  const world = typeof wIn === 'object' && wIn ? { ...baseW, ...wIn, sun: { ...baseW.sun, ...(wIn.sun ?? {}) } } : baseW;
  return { id: spec.id, def, world, view: spec.view ?? def.view ?? 'chase', hull: spec.hull ?? def.hull, sail: spec.sail, trim: spec.trim, skins: Array.isArray(spec.skins) && spec.skins.length ? spec.skins : undefined, pad: PADS[spec.id] };
}

// The kit object the activity already understands (pads, tone fallback, orientation).
export function craftKit(c) {
  return { id: c.id, orient: 'right', regF: 0.23, colors: {}, scenery: 'none', light: 0, tone: { stroke: (g) => ({ freq: g === 'perfect' ? 220 : 170, to: 120, dur: 0.1, type: 'triangle', vol: 0.4 }) }, pad: c.pad, decor: null, under: null };
}

// ---- sounds: synthesised only (platform/engine-kit/synth.js) ---------------------------------------------------------------
// Each profile: stroke(grade) / beat(accent) / mishap() / ambient(v) and the start signal.
const V = (g) => (g === 'perfect' ? 0.85 : g === 'miss' ? 0.4 : 0.65);
const PROFILES = {
  outrigger: {
    stroke: (fx, vo, A, g) => { fx(A, 'splash', { vel: V(g) * 0.55 }); fx(A, 'impact', { mat: 'wood', hz: g === 'perfect' ? 420 : 340, vel: V(g) * 0.6, delay: 0.01 }); },
    beat: (fx, vo, A, acc, L) => { vo(A, 'drum', { style: 'bass', hz: acc ? 92 : 74, vel: (acc ? 0.62 : 0.42) * L }); if (acc) fx(A, 'tick', { hz: 1300, vel: 0.2 * L, delay: 0.02 }); },
    start: (fx, vo, A) => { vo(A, 'breath', { hz: 196, vel: 0.5, dur: 1.4 }); },
  },
  voyageur: {
    stroke: (fx, vo, A, g) => { fx(A, 'impact', { mat: 'wood', hz: g === 'perfect' ? 260 : 210, vel: V(g) * 0.8 }); fx(A, 'splash', { vel: V(g) * 0.5, delay: 0.015 }); },
    beat: (fx, vo, A, acc, L) => { vo(A, 'drum', { style: 'frame', hz: acc ? 128 : 104, vel: (acc ? 0.5 : 0.34) * L }); if (acc) vo(A, 'clap', { vel: 0.3 * L, delay: 0.01 }); },
    start: (fx, vo, A) => { vo(A, 'drum', { style: 'taiko', hz: 80, vel: 0.7 }); },
  },
  'ice-canoe': {
    stroke: (fx, vo, A, g) => { fx(A, 'scrape', { hz: g === 'perfect' ? 3400 : 2800, dur: 0.15, vel: V(g) * 1.0 }); fx(A, 'splash', { vel: V(g) * 0.4, delay: 0.02 }); },
    beat: (fx, vo, A, acc, L) => { fx(A, 'tick', { hz: acc ? 1700 : 1350, vel: (acc ? 0.4 : 0.26) * L }); if (acc) vo(A, 'bell', { hz: 1318, vel: 0.12 * L }); },
    start: (fx, vo, A) => { vo(A, 'bell', { hz: 880, vel: 0.4 }); },
  },
  dugout: {
    stroke: (fx, vo, A, g) => { fx(A, 'splash', { vel: V(g) * 0.6 }); fx(A, 'impact', { mat: 'wood', hz: g === 'perfect' ? 200 : 160, vel: V(g) * 0.7, delay: 0.01 }); },
    beat: (fx, vo, A, acc, L) => { vo(A, 'drum', { style: acc ? 'slap' : 'tone', hz: acc ? 190 : 140, vel: (acc ? 0.5 : 0.4) * L }); },
    start: (fx, vo, A) => { vo(A, 'drum', { style: 'bass', hz: 70, vel: 0.7 }); },
  },
  mokoro: {
    stroke: (fx, vo, A, g) => { fx(A, 'splash', { vel: V(g) * 0.4 }); vo(A, 'drum', { style: 'water', hz: g === 'perfect' ? 300 : 240, vel: V(g) * 0.4, delay: 0.015 }); },
    beat: (fx, vo, A, acc, L) => { vo(A, 'bar', { hz: acc ? 262 : 330, vel: (acc ? 0.34 : 0.22) * L, dur: 0.5 }); },
    start: (fx, vo, A) => { vo(A, 'bar', { hz: 392, vel: 0.4 }); },
  },
  sail: {
    stroke: (fx, vo, A, g) => { fx(A, 'splash', { vel: 0.3 }); },
    beat: () => {},
    start: (fx, vo, A) => { fx(A, 'whoosh', { vel: 0.5, dur: 1.2 }); },
  },
};
for (const id of ['jangada', 'felucca', 'ngalawa', 'sloop']) PROFILES[id] = PROFILES.sail;
export function soundOf(id) { return PROFILES[id] ?? PROFILES.sail; }
// sailing ambience: bow slap and a rope creak, and the cloth filling when the trim is right
export function sailAmbience(fx, vo, A, id, v, q, tick) {
  if (tick % 2 === 0) fx(A, 'splash', { vel: 0.12 + 0.3 * v });
  if (tick % 5 === 1) fx(A, 'scrape', { hz: id === 'felucca' ? 520 : 700, dur: 0.3, vel: 0.12 });
  if (tick % 7 === 3 && q > 0.7) fx(A, 'whoosh', { vel: 0.18 * q, dur: 0.5 });
}

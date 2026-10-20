// shape-craft `paint` figure tables for jewellery (1.21.0): wire filigree on velvet and enamel cells on a metal plate.
//   tarakasi  (India, Odisha)  silver wire: a ring of twisted wire, six petals each with two curls, buds between, granules.            rot 6, velvet
//   albanian  (Albania)        gilded wire: a scalloped rim, an eight-petal rosette, a ring of granules.                              rot 8, velvet
//   chengdu   (China)          silver wire: a butterfly with scrolled wings and granules along the wing edges.                        mirror-x, velvet
//   meenakari (India)          gold cells on a gold plate, a paisley of nested bands and flowers, enamel red, green, blue and white.   none, plate
//   minakari  (Iran)           a vase of cream enamel with a flower and a band of buds, turquoise, cobalt, ruby and green.             mirror-x, plate
//   kabyle    (Algeria)        a silver brooch: a ring of triangular enamel cells (green, yellow, blue) and coral domes.                rot 6, plate
// Wire strokes use the `wire` look (a round metal wire lit from the upper left; `twist` adds the twist of two strands), granules are short wire dots
// (drawn as little balls), enamel regions use the `enamel` look (glassy fill with a gold or silver cell wall drawn round it).
import { curve, loop, polygon, ring, arc, spiral, leaf, leafRegion, blob, poly, smoothPoly, polar, roundPoly, lensPts, region, xform, TAU } from '../paint-shapes.js';

const dot = (x, y, o) => curve([[x, y], [x + 0.003, y + 0.002]], o);   // a granule: a stroke shorter than its width
const SILVER = { name: 'silver wire', color: '#d8dee6', wire: true, twist: true };
const SILVER_PLAIN = { name: 'silver wire', color: '#dfe5ec', wire: true };
const GOLDWIRE = { name: 'gold wire', color: '#e6b84a', wire: true, twist: true };
const GRAN = (c) => ({ name: 'granule', color: c, wire: true });

// ---- Tarakasi: Odisha silver filigree --------------------------------------------------------------------------------------------------------------------
export function tarakasi(rng, v = 1) {
  const C = [0.5, 0.5], a0 = -Math.PI / 2, step = Math.PI / 3, S = (o) => ({ col: 0, w: 0.011, ...o });
  const frame = [ring(0.5, 0.5, 0.455, 0.455, S({ w: 0.012, noSym: true })), ring(0.5, 0.5, 0.415, 0.415, S({ w: 0.01, noSym: true })), ring(0.5, 0.5, 0.075, 0.075, S({ noSym: true }))];
  const petals = [], granules = [];
  const p = polar(...C, 0.1, a0), q = polar(...C, 0.335, a0);
  petals.push(leaf(p, q, 0.15, 0, S({ w: 0.01 })));
  for (const s of [-1, 1]) {
    const c = polar(...polar(...C, 0.2, a0), 0.046, a0 + s * Math.PI / 2);   // curl centres either side of the midrib
    petals.push(spiral(c[0], c[1], 0.0045, 0.05, 1.4, a0 + (s > 0 ? 0.6 : 2.5), S({ w: 0.008 }), s));
  }
  petals.push(curve([polar(...C, 0.1, a0), polar(...C, 0.135, a0)], S({ w: 0.008 })));
  const b0 = a0 + step / 2;   // a bud between two petals, and a pair of small curls leaning on the outer ring
  petals.push(leaf(polar(...C, 0.28, b0), polar(...C, 0.385, b0), 0.075, 0, S({ w: 0.009 })));
  petals.push(curve([polar(...C, 0.14, b0), polar(...C, 0.2, b0 + 0.03), polar(...C, 0.255, b0)], S({ w: 0.008 })));
  granules.push(dot(...polar(...C, 0.358, a0), { col: 1, w: 0.03 }), dot(...polar(...C, 0.395, b0), { col: 1, w: 0.022 }), dot(...polar(...C, 0.2, a0), { col: 1, w: 0.018, noSym: false }), dot(...polar(...C, 0.1, b0), { col: 1, w: 0.022 }));
  granules.push(dot(0.5, 0.5, { col: 1, w: 0.04, noSym: true }));
  void v; void rng; void TAU;
  return {
    id: 'tarakasi', variant: 'medallion', name: 'Filigree medallion', ar: 1, ground: '#0e1030', cell: '#d8dee6', surface: { kind: 'velvet', shape: 'ellipse' }, symmetry: { kind: 'rot', n: 6 },
    palette: [SILVER, GRAN('#eef2f7')],
    layers: [
      { name: 'Twist the frame wire', tool: 'pen', colors: [0], strokes: frame, regions: [], hint: 'Two rings of twisted wire, then the small ring in the middle' },
      { name: 'Curl the petals', tool: 'pen', colors: [0], strokes: petals, regions: [], hint: 'A petal outline, two curls beside its midrib, then a bud between petals' },
      { name: 'Solder the granules', tool: 'pen', colors: [1], strokes: granules, regions: [], hint: 'Tap each small ball of silver where it sits' },
    ],
  };
}

// ---- Albanian filigree: gilded wire, a scalloped rim and an eight-petal rosette --------------------------------------------------------------------------------
export function albanian(rng, v = 1) {
  const C = [0.5, 0.5], n = 8, step = TAU / n, G = (o) => ({ col: 0, w: 0.011, ...o });
  const rim = [ring(0.5, 0.5, 0.375, 0.375, G({ w: 0.011, noSym: true })), ring(0.5, 0.5, 0.098, 0.098, G({ noSym: true }))];
  const scallops = [];
  for (let k = 0; k < 2; k++) { const th = k * step / 2, c = polar(...C, 0.4, th); scallops.push(arc(c[0], c[1], 0.0375, 0.0375, th - Math.PI * 0.5 - 0.35, th + Math.PI * 0.5 + 0.35, G({ w: 0.009 }))); }
  const rosette = [];
  const a = -Math.PI / 2;
  rosette.push(leaf(polar(...C, 0.1, a), polar(...C, 0.325, a), 0.14, 0, G({ w: 0.01 })));
  rosette.push(leaf(polar(...C, 0.12, a), polar(...C, 0.27, a), 0.075, 0, G({ w: 0.008 })));
  const b = a + step / 2;
  rosette.push(curve([polar(...C, 0.2, b - 0.05), polar(...C, 0.3, b), polar(...C, 0.2, b + 0.05)], G({ w: 0.008 })));
  const granules = [dot(...polar(...C, 0.355, a), { col: 1, w: 0.02 }), dot(...polar(...C, 0.33, b), { col: 1, w: 0.022 }), dot(...polar(...C, 0.4, step / 4 - 0.0), { col: 1, w: 0.014 }), dot(0.5, 0.5, { col: 1, w: 0.034, noSym: true })];
  for (let k = 0; k < 2; k++) granules.push(dot(...polar(...C, 0.4, k * step / 2 + 0.0), { col: 1, w: 0.022 }));
  void v; void rng;
  return {
    id: 'albanian', variant: 'rosette', name: 'Filigree rosette', ar: 1, ground: '#08241f', cell: '#e6b84a', surface: { kind: 'velvet', shape: 'ellipse' }, symmetry: { kind: 'rot', n },
    palette: [GOLDWIRE, GRAN('#f2d27a')],
    layers: [
      { name: 'Twist the rim wire', tool: 'pen', colors: [0], strokes: [...rim, ...scallops], regions: [], hint: 'The round frame, the small ring, then the scalloped edge' },
      { name: 'Shape the rosette', tool: 'pen', colors: [0], strokes: rosette, regions: [], hint: 'Each petal has a second, smaller petal inside it; a pair of curls sits between petals' },
      { name: 'Solder the granules', tool: 'pen', colors: [1], strokes: granules, regions: [], hint: 'Tap each ball of gold where it sits' },
    ],
  };
}

// ---- Chengdu silver filigree: a butterfly -------------------------------------------------------------------------------------------------------------------------
export function chengdu(rng, v = 1) {
  const S = (o) => ({ col: 0, w: 0.0105, ...o });
  const body = [ring(0.5, 0.5, 0.026, 0.165, S({ w: 0.011, noSym: true })), ring(0.5, 0.305, 0.034, 0.034, S({ noSym: true }))];
  const lines = [];
  lines.push(curve([[0.49, 0.275], [0.46, 0.2], [0.41, 0.155], [0.37, 0.15]], S({ w: 0.008 })), spiral(0.372, 0.172, 0.004, 0.024, 1.3, -2.2, S({ w: 0.008 }), 1));
  lines.push(leaf([0.475, 0.455], [0.1, 0.2], 0.3, 0.12, S({ w: 0.011 })));
  lines.push(leaf([0.475, 0.5], [0.15, 0.63], 0.2, -0.08, S({ w: 0.009 })));
  lines.push(leaf([0.475, 0.53], [0.22, 0.86], 0.24, 0.1, S({ w: 0.011 })));
  const inner = [spiral(0.3, 0.3, 0.005, 0.05, 1.5, 0.8, S({ w: 0.008 }), 1), spiral(0.215, 0.395, 0.005, 0.04, 1.4, 3.8, S({ w: 0.008 }), -1), curve([[0.46, 0.45], [0.36, 0.38], [0.27, 0.3]], S({ w: 0.008 })), curve([[0.46, 0.55], [0.36, 0.62], [0.28, 0.72]], S({ w: 0.008 })), spiral(0.31, 0.74, 0.005, 0.04, 1.4, 0.4, S({ w: 0.008 }), 1)];
  const granules = [];
  for (let k = 0; k < 6; k++) { const t = 0.12 + k * 0.14, x = 0.46 - 0.36 * t - 0.02, y = 0.43 - 0.24 * t; granules.push(dot(x, y, { col: 1, w: 0.024 })); }
  granules.push(dot(0.5, 0.275, { col: 1, w: 0.022, noSym: true }), dot(0.5, 0.5, { col: 1, w: 0.022, noSym: true }), dot(0.5, 0.64, { col: 1, w: 0.022, noSym: true }));
  void v; void rng;
  return {
    id: 'chengdu', variant: 'butterfly', name: 'Filigree butterfly', ar: 1, ground: '#3a0c18', cell: '#d8dee6', surface: { kind: 'velvet', shape: 'ellipse' }, symmetry: { kind: 'mirror-x' },
    palette: [SILVER_PLAIN, GRAN('#eef2f7')],
    layers: [
      { name: 'Shape the body and the wings', tool: 'pen', colors: [0], strokes: [...body, ...lines], regions: [], hint: 'Body and head first, then the long feeler and the three wing frames; the other side follows' },
      { name: 'Curl the wire inside the wings', tool: 'pen', colors: [0], strokes: inner, regions: [], hint: 'Scrolls and veins fill each wing' },
      { name: 'Solder the granules', tool: 'pen', colors: [1], strokes: granules, regions: [], hint: 'Tap the balls along the wing edge and on the body' },
    ],
  };
}

// ---- Meenakari: a paisley (mango) of enamel bands ------------------------------------------------------------------------------------------------------------------
export function meenakari() {
  const W = (o) => ({ col: 0, w: 0.0095, ...o }), c = [0.48, 0.58];
  const outer = [[0.7, 0.1], [0.77, 0.3], [0.74, 0.52], [0.64, 0.72], [0.5, 0.86], [0.33, 0.88], [0.21, 0.77], [0.2, 0.62], [0.3, 0.52], [0.42, 0.45], [0.5, 0.34], [0.58, 0.2]];
  const mid = xform(outer, c[0], c[1], 0.74), inner = xform(outer, c[0], c[1], 0.5, -0.02, 0.02);
  const outerS = loop(outer, W({ w: 0.011 })), midS = loop(mid, W()), innerS = loop(inner, W());
  const rc = [0.43, 0.66], wires = [outerS, midS, innerS], petalW = [], petalR = [];
  for (let k = 0; k < 8; k++) { const a = (k * TAU) / 8 - Math.PI / 2; petalW.push(leaf(polar(...rc, 0.022, a), polar(...rc, 0.1, a), 0.055, 0, W({ w: 0.0075 }))); petalR.push(leafRegion(polar(...rc, 0.022, a), polar(...rc, 0.1, a), 0.055, 0, { col: k % 2 ? 1 : 4, label: 'petal' })); }
  petalW.push(ring(rc[0], rc[1], 0.022, 0.022, W({ w: 0.0075 })));
  const buds = [[[0.53, 0.52], [0.585, 0.43]], [[0.585, 0.41], [0.625, 0.31]]], budW = buds.map(([p, q]) => leaf(p, q, 0.045, 0.1, W({ w: 0.0075 }))), budR = buds.map(([p, q]) => leafRegion(p, q, 0.045, 0.1, { col: 1, label: 'bud' }));
  const dots = [], n = outerS.pts.length;
  for (let k = 0; k < 11; k++) { const q = outerS.pts[Math.floor(((k + 0.5) / 11) * (n - 1))], inward = [q[0] + (c[0] - q[0]) * 0.085, q[1] + (c[1] - q[1]) * 0.085]; dots.push(dot(inward[0], inward[1], { col: 0, w: 0.022 })); }
  const bands = [smoothPoly(outer, { col: 1, label: 'outer band' }), smoothPoly(mid, { col: 3, label: 'middle band' }), smoothPoly(inner, { col: 2, label: 'inner field' }), ...petalR, ...budR, blob(rc[0], rc[1], 0.019, 0.019, { col: 3, label: 'flower heart' })];
  wires.push(...petalW, ...budW);
  return {
    id: 'meenakari', variant: 'paisley', name: 'Enamelled pendant', ar: 1, ground: '#b98c34', cell: '#e8c25a', surface: { kind: 'plate', shape: 'ellipse', metal: 'gold' }, symmetry: { kind: 'none' },
    palette: [GOLDWIRE, { name: 'ruby red', color: '#b3182c', enamel: true }, { name: 'emerald', color: '#13805a', enamel: true }, { name: 'cobalt', color: '#1a3f9a', enamel: true }, { name: 'white', color: '#f2eee2', enamel: true }],
    layers: [
      { name: 'Lay the gold cell walls', tool: 'pen', colors: [0], strokes: wires, regions: [], hint: 'The outer paisley, then the two inside it, then the rings of the flowers' },
      { name: 'Fuse the enamel', tool: 'brush', colors: [1, 2, 3, 4], strokes: [], regions: bands, hint: 'Ruby in the outer band, cobalt in the next, emerald in the middle, white for the big flower' },
      { name: 'Set the gold beads', tool: 'pen', colors: [0], strokes: dots, regions: [], hint: 'Tap a bead of gold along the rim' },
    ],
  };
}

// ---- Minakari: a vase of cream enamel with flowers ----------------------------------------------------------------------------------------------------------------
export function minakari() {
  const AR = 0.8, cx = AR / 2;
  const half = [[0.34, 0.05], [0.35, 0.18], [0.32, 0.27], [0.2, 0.37], [0.12, 0.52], [0.13, 0.68], [0.22, 0.82], [0.3, 0.9], [0.29, 0.96]];
  const full = [...half, ...half.slice(1, -1).reverse().map(([x, y]) => [AR - x, y]), ...[[0.51, 0.96]], ...[]];
  const pts = [...half.map((p) => p), [AR - 0.29, 0.96], ...half.slice(0, -1).reverse().map(([x, y]) => [AR - x, y])];
  void full;
  const shape = roundPoly(pts, 2);
  const W = (o) => ({ col: 0, w: 0.0075, ...o });
  const petals = [], petalR = [];
  const c = [cx, 0.56];
  for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + k * TAU / 6; petals.push(leaf(polar(...c, 0.035, a), polar(...c, 0.17, a), 0.1, 0, W({ noSym: true }))); petalR.push(leafRegion(polar(...c, 0.035, a), polar(...c, 0.17, a), 0.1, 0, { col: k % 2 ? 3 : 2, label: 'petal', noSym: true })); }
  petals.push(ring(c[0], c[1], 0.035, 0.035, W({ noSym: true })));
  const band = [], bandR = [];
  for (let k = 0; k < 5; k++) { const x = 0.285 + k * 0.057, y0 = 0.14 - Math.abs(k - 2) * 0.004; band.push(leaf([x, y0 + 0.085], [x, y0], 0.045, 0, W({ noSym: true }))); bandR.push(leafRegion([x, y0 + 0.085], [x, y0], 0.045, 0, { col: k % 2 ? 4 : 2, label: 'bud', noSym: true })); }
  band.push(curve([[0.27, 0.235], [0.4, 0.245], [0.53, 0.235]], W({ w: 0.007, noSym: true })));
  const vines = [], vineR = [];
  for (const s of [-1, 1]) {
    const px = (x) => cx + s * (x - cx);
    vines.push(curve([[px(0.3), 0.6], [px(0.22), 0.52], [px(0.2), 0.42]], W({ w: 0.0065, noSym: true })));
    vines.push(leaf([px(0.2), 0.43], [px(0.3), 0.36], 0.07, 0.1 * s, W({ w: 0.0065, noSym: true })));
    vineR.push(leafRegion([px(0.2), 0.43], [px(0.3), 0.36], 0.07, 0.1 * s, { col: 1, label: 'leaf', noSym: true }));
    vines.push(curve([[px(0.29), 0.68], [px(0.21), 0.74], [px(0.22), 0.8]], W({ w: 0.0065, noSym: true })));
    vines.push(leaf([px(0.22), 0.8], [px(0.3), 0.74], 0.06, -0.1 * s, W({ w: 0.0065, noSym: true })));
    vineR.push(leafRegion([px(0.22), 0.8], [px(0.3), 0.74], 0.06, -0.1 * s, { col: 3, label: 'leaf', noSym: true }));
  }
  const outline = [loop(shape.slice(0, shape.length - 1), W({ w: 0.01, noSym: true }))];
  const heart = blob(c[0], c[1], 0.028, 0.028, { col: 1, label: 'heart', noSym: true });
  return {
    id: 'minakari', variant: 'vase', name: 'Enamelled vase', ar: AR, ground: '#efe8d4', cell: '#d8a840', surface: { kind: 'plate', shape, metal: 'enamel' }, symmetry: { kind: 'none' },
    palette: [GOLDWIRE, { name: 'ruby', color: '#a8182a', enamel: true }, { name: 'turquoise', color: '#1aa0b0', enamel: true }, { name: 'cobalt', color: '#1a3f9a', enamel: true }, { name: 'green', color: '#1d7a46', enamel: true }],
    layers: [
      { name: 'Lay the gold lines', tool: 'pen', colors: [0], strokes: [...outline, ...band, ...petals, ...vines], regions: [], hint: 'The rim of the vase, the band of buds, the flower, then the two vines' },
      { name: 'Fuse the enamel', tool: 'brush', colors: [1, 2, 3, 4], strokes: [], regions: [...bandR, ...petalR, ...vineR, heart], hint: 'Turquoise and cobalt petals, a ruby heart, green leaves' },
    ],
  };
}

// ---- Kabyle brooch: a ring of triangular enamel cells and coral domes ---------------------------------------------------------------------------------------------
export function kabyle() {
  const C = [0.5, 0.5], step = Math.PI / 3, K = (o) => ({ col: 0, w: 0.0075, ...o });
  const tri = (a, r0, r1, half) => [polar(...C, r0, a - half), polar(...C, r0, a + half), polar(...C, r1, a)];
  const walls = [ring(0.5, 0.5, 0.465, 0.465, K({ w: 0.01, noSym: true })), ring(0.5, 0.5, 0.17, 0.17, K({ w: 0.008, noSym: true }))], fills = [];
  const a1 = -Math.PI / 2, a2 = a1 + step / 2;
  walls.push(polygon(tri(a1, 0.2, 0.43, 0.2), K()), polygon(tri(a2, 0.43, 0.2, 0.2), K()));
  fills.push(poly(tri(a1, 0.2, 0.43, 0.2), { col: 1, label: 'green cell' }), poly(tri(a2, 0.43, 0.2, 0.2), { col: 2, label: 'yellow cell' }));
  const cab = [blob(0.5, 0.5, 0.1, 0.1, { col: 4, label: 'coral dome', volume: true, noSym: true })];
  walls.push(ring(0.5, 0.5, 0.1, 0.1, K({ w: 0.008, noSym: true })));
  const studs = [];
  studs.push(dot(...polar(...C, 0.445, a1), { col: 0, w: 0.016 }), dot(...polar(...C, 0.445, a2), { col: 0, w: 0.016 }));
  return {
    id: 'kabyle', variant: 'brooch', name: 'Enamelled brooch', ar: 1, ground: '#a3acb6', cell: '#eef2f6', surface: { kind: 'plate', shape: 'ellipse', metal: 'silver' }, symmetry: { kind: 'rot', n: 6 },
    palette: [{ name: 'silver wire', color: '#f0f3f7', wire: true }, { name: 'green', color: '#1d8a4c', enamel: true }, { name: 'yellow', color: '#e8c02a', enamel: true }, { name: 'blue', color: '#1c4fa0', enamel: true }, { name: 'coral', color: '#d63a32', enamel: true }],
    layers: [
      { name: 'Lay the silver cell walls', tool: 'pen', colors: [0], strokes: walls, regions: [], hint: 'The rim, the inner ring and the triangular cells; they point out and in in turn' },
      { name: 'Fuse the enamel and set the coral', tool: 'brush', colors: [1, 2, 3, 4], strokes: [], regions: [...fills, ...cab], hint: 'Green and yellow cells in turn; a coral dome in the middle' },
      { name: 'Raise the studs', tool: 'pen', colors: [0], strokes: studs, regions: [], hint: 'Tap a silver stud at the tip of every cell' },
    ],
  };
}

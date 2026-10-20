// Tile painting (1.9.0): one family of figure tables on the shared `tiles` surface (a panel of glazed tiles with seams over the paint).
// azulejo (Portugal: cobalt, sky blue and ochre on white, rosette and acanthus scrolls, mirrored both ways), iznik (Turkey: tulip, carnation and
// saz leaf in cobalt, turquoise and tomato red, mirrored left to right), talavera (Mexico: a bold four-tile flower and corner quarter flowers,
// turned a quarter at a time), delft (Netherlands: a vase of tulips in a ring with fans in the corners, two blues only).
// The surface, the dock and the workshop differ per tradition (see scenes-tiles.js); the tiles and the order of work are shared.
import { curve, loop, polygon, ring, arc, spiral, comma, leaf, leafRegion, blob, smoothPoly, poly, rotAbout, wavyLoop, lensPts, polar, jit, TAU } from '../paint-shapes.js';

const circ = (cx, cy, r, n = 22) => Array.from({ length: n }, (_, i) => polar(cx, cy, r, (i / n) * TAU));
const dot = (x, y, o) => curve([[x, y], [x + 0.004, y + 0.003]], o);

export function azulejo(rng, v = 1) {
  const j = jit(rng, v, 0.018), PI = Math.PI, C = [0.5, 0.5];
  const frame = [polygon([[0.035, 0.035], [0.965, 0.035], [0.965, 0.965], [0.035, 0.965]], { col: 0, w: 0.012, noSym: true }), polygon([[0.072, 0.072], [0.928, 0.072], [0.928, 0.928], [0.072, 0.928]], { col: 1, w: 0.006, noSym: true })];
  const petals = [[PI, 0.2 + j, 0.085], [-PI / 2, 0.2 + j, 0.085], [-3 * PI / 4, 0.27 - j, 0.105]];
  const o1 = [ring(C[0], C[1], 0.055, 0.055, { col: 0, w: 0.009, noSym: true }), ...frame];
  for (const [a, r, w] of petals) o1.push(leaf(polar(...C, 0.062, a), polar(...C, r, a), w, 0, { col: 0, w: 0.01 }));
  o1.push(spiral(0.19, 0.385, 0.056, 0.01, 1.25, -0.6, { col: 0, w: 0.011 }, -1), curve([[0.325, 0.325], [0.265, 0.335], [0.2, 0.33]], { col: 0, w: 0.011 }));
  o1.push(spiral(0.385, 0.19, 0.056, 0.01, 1.25, 2.2, { col: 0, w: 0.011 }, 1), curve([[0.325, 0.325], [0.335, 0.265], [0.33, 0.2]], { col: 0, w: 0.011 }));
  o1.push(ring(0.15, 0.15, 0.02, 0.02, { col: 0, w: 0.009, noSym: false }));
  for (const a of [0, PI / 2, PI, -PI / 2]) o1.push(leaf(polar(0.15, 0.15, 0.024, a), polar(0.15, 0.15, 0.085, a), 0.05, 0, { col: 0, w: 0.009 }));
  const r2 = [blob(C[0], C[1], 0.052, 0.052, { col: 2, label: 'rosette', noSym: true })];
  for (const [a, r, w] of petals) r2.push(leafRegion(polar(...C, 0.062, a), polar(...C, r, a), w, 0, { col: 1, label: 'petal' }));
  r2.push(blob(0.15, 0.15, 0.017, 0.017, { col: 0, label: 'corner heart' }));
  for (const a of [0, PI / 2, PI, -PI / 2]) r2.push(leafRegion(polar(0.15, 0.15, 0.024, a), polar(0.15, 0.15, 0.085, a), 0.05, 0, { col: 2, label: 'corner petal' }));
  const o3 = [];
  for (const [a, r] of petals) o3.push(curve([polar(...C, 0.1, a), polar(...C, r - 0.04, a)], { col: 0, w: 0.006 }));
  for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU + 0.2; o3.push(dot(...polar(...C, 0.095, a), { col: 0, w: 0.012, noSym: false })); }
  o3.push(dot(0.5, 0.5, { col: 0, w: 0.02, noSym: true }));
  return {
    id: 'azulejo', name: 'Azulejo panel', ar: 1, ground: '#faf7ee', finish: 'gloss', surface: { kind: 'tiles', shape: 'rect', grid: 3, lift: 1 }, symmetry: { kind: 'mirror-xy' },
    palette: [{ name: 'cobalt', color: '#1b479a' }, { name: 'sky blue', color: '#6f9fe0' }, { name: 'ochre', color: '#dba335' }],
    layers: [
      { name: 'Outline the rosette and scrolls in cobalt', tool: 'fine', colors: [0, 1], strokes: o1, regions: [], hint: 'Draw the frame, then the petals and the scrolls: one pull each' },
      { name: 'Flood the petals and the corners', tool: 'brush', colors: [1, 2, 0], strokes: [], regions: r2, hint: 'Sky blue in the petals, ochre in the rosette and the corner flowers' },
      { name: 'Cobalt veins and dots', tool: 'fine', colors: [0], strokes: o3, regions: [], hint: 'A vein down each petal and a ring of dots round the rosette' },
    ],
  };
}

export function iznik(rng, v = 1) {
  const j = jit(rng, v, 0.02);
  const tulip = [[0.5, 0.1], [0.445, 0.17], [0.435, 0.29], [0.5, 0.385], [0.565, 0.29], [0.555, 0.17]];
  const sazP = [0.47, 0.9], sazQ = [0.1 + j, 0.34], carn = [0.26, 0.6 + j];
  const frame = [polygon([[0.035, 0.035], [0.965, 0.035], [0.965, 0.965], [0.035, 0.965]], { col: 0, w: 0.011, noSym: true }), polygon([[0.07, 0.07], [0.93, 0.07], [0.93, 0.93], [0.07, 0.93]], { col: 1, w: 0.006, noSym: true })];
  const o1 = [...frame, curve([[0.5, 0.93], [0.5, 0.66], [0.5, 0.385]], { col: 3, w: 0.012, noSym: true }), loop(tulip, { col: 0, w: 0.011, noSym: true })];
  o1.push(wavyLoop(circ(carn[0], carn[1], 0.1), 0.012, 0.042, { col: 0, w: 0.01 }));
  o1.push(wavyLoop(lensPts(sazP, sazQ, 0.15, 0.3, 12), 0.007, 0.04, { col: 0, w: 0.01 }));
  o1.push(ring(0.19, 0.84, 0.042, 0.042, { col: 0, w: 0.009 }));
  for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + 0.2; o1.push(leaf(polar(0.19, 0.84, 0.05, a), polar(0.19, 0.84, 0.095, a), 0.035, 0, { col: 0, w: 0.007 })); }
  o1.push(leaf([0.5, 0.72], [0.37, 0.64], 0.07, 0.1, { col: 0, w: 0.009 }));
  const r2 = [{ ...smoothPoly(tulip, { col: 2, label: 'tulip', noSym: true }) }, blob(carn[0], carn[1], 0.092, 0.092, { col: 2, label: 'carnation' }), leafRegion(sazP, sazQ, 0.15, 0.3, { col: 1, label: 'saz leaf' }), blob(0.19, 0.84, 0.038, 0.038, { col: 0, label: 'rosette' }), leafRegion([0.5, 0.72], [0.37, 0.64], 0.07, 0.1, { col: 3, label: 'leaf' })];
  const o3 = [curve([[0.46, 0.19], [0.475, 0.3]], { col: 0, w: 0.007 }), curve([[0.5, 0.14], [0.5, 0.34]], { col: 0, w: 0.007, noSym: true })];
  for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + 0.5; o3.push(curve([polar(carn[0], carn[1], 0.015, a), polar(carn[0], carn[1], 0.07, a)], { col: 0, w: 0.007 })); }
  o3.push(curve([[0.455, 0.86], [0.32, 0.65], [0.15, 0.4]], { col: 0, w: 0.007 }));
  o3.push(dot(0.19, 0.84, { col: 2, w: 0.016 }));
  return {
    id: 'iznik', name: 'Iznik panel', ar: 1, ground: '#f4f0e3', finish: 'gloss', surface: { kind: 'tiles', shape: 'rect', grid: 3 }, symmetry: { kind: 'mirror-x' },
    palette: [{ name: 'cobalt', color: '#1f46a0' }, { name: 'turquoise', color: '#25a6b6' }, { name: 'tomato red', color: '#d6402b' }, { name: 'sage', color: '#5f9a6a' }],
    layers: [
      { name: 'Draw the tulip, carnation and saz leaf', tool: 'fine', colors: [0, 3], strokes: o1, regions: [], hint: 'Cobalt outlines first; the stem is green' },
      { name: 'Flood the colours', tool: 'brush', colors: [2, 1, 0, 3], strokes: [], regions: r2, hint: 'Tomato red for tulip and carnation, turquoise for the saz leaf' },
      { name: 'Add the cobalt veins', tool: 'fine', colors: [0, 2], strokes: o3, regions: [], hint: 'Veins in the tulip and carnation, the midrib of the leaf' },
    ],
  };
}

export function talavera(rng, v = 1) {
  const j = jit(rng, v, 0.02), C = [0.5, 0.5], PI = Math.PI;
  const diamond = polygon([[0.5, 0.05], [0.95, 0.5], [0.5, 0.95], [0.05, 0.5]], { col: 0, w: 0.011, noSym: true });
  const o1 = [diamond, ring(C[0], C[1], 0.052, 0.052, { col: 0, w: 0.011, noSym: true })];
  const pa = [-PI / 4 - 0.32 + j, -PI / 4 + 0.32 - j];
  for (const a of pa) o1.push(leaf(polar(...C, 0.06, a), polar(...C, 0.215, a), 0.095, 0.08, { col: 0, w: 0.012 }));
  o1.push(arc(0, 0, 0.16, 0.16, 0, PI / 2, { col: 0, w: 0.012 }), arc(0, 0, 0.1, 0.1, 0, PI / 2, { col: 0, w: 0.009 }));
  o1.push(leaf([0.09, 0.09], [0.27, 0.27], 0.08, 0, { col: 0, w: 0.011 }));
  o1.push(comma([0.3, 0.12], [0.4, 0.2], 0.2, { col: 0, w: 0.01 }), comma([0.12, 0.3], [0.2, 0.4], -0.2, { col: 0, w: 0.01 }));
  const r2 = [blob(C[0], C[1], 0.048, 0.048, { col: 2, label: 'heart', noSym: true })];
  for (const a of pa) r2.push(leafRegion(polar(...C, 0.06, a), polar(...C, 0.215, a), 0.095, 0.08, { col: 1, label: 'petal' }));
  r2.push(leafRegion([0.09, 0.09], [0.27, 0.27], 0.08, 0, { col: 3, label: 'leaf' }));
  r2.push(smoothPoly([[0.0, 0.1], [0.03, 0.1], [0.078, 0.075], [0.1, 0.03], [0.1, 0.0], [0.0, 0.0]], { col: 2, label: 'corner' }));
  const o3 = [];
  for (const a of pa) { o3.push(curve([polar(...C, 0.1, a), polar(...C, 0.19, a)], { col: 0, w: 0.008 })); o3.push(dot(...polar(...C, 0.23, a), { col: 0, w: 0.02 })); }
  for (const t of [0.14, 0.24, 0.34, 0.44]) o3.push(dot(0.5 - t * 0.9 + 0.05, 0.05 + t * 0.9 - 0.0, { col: 2, w: 0.022 }));
  o3.push(dot(0.5, 0.5, { col: 0, w: 0.026, noSym: true }));
  return {
    id: 'talavera', name: 'Talavera tiles', ar: 1, ground: '#f6f0df', finish: 'gloss', surface: { kind: 'tiles', shape: 'rect', grid: 2 }, symmetry: { kind: 'rot', n: 4 },
    palette: [{ name: 'cobalt', color: '#1c46a8' }, { name: 'yellow', color: '#f1b81f' }, { name: 'orange', color: '#e2692a' }, { name: 'green', color: '#2f8a4a' }],
    layers: [
      { name: 'Outline the four-tile flower in cobalt', tool: 'brush', colors: [0], strokes: o1, regions: [], hint: 'The diamond, the heart, the petals and the corner quarter flowers' },
      { name: 'Flood the glaze colours', tool: 'brush', colors: [1, 2, 3], strokes: [], regions: r2, hint: 'Yellow petals, an orange heart, green leaves, orange in the corners' },
      { name: 'Dab the dots', tool: 'dab', colors: [0, 2], strokes: o3, regions: [], hint: 'A dot at the tip of every petal and a row of orange dots along the diamond' },
    ],
  };
}

// 1.10.0: a real tulip: a cup of three pointed petals (the centre one tallest), seen from the side; (cx, cy) is the base of the cup, s scales it, ang tips it (0 = upright)
const TULIP = [[0, 0], [-0.03, -0.004], [-0.054, -0.026], [-0.066, -0.062], [-0.071, -0.1], [-0.07, -0.142], [-0.064, -0.168], [-0.046, -0.14], [-0.03, -0.108], [-0.02, -0.14], [-0.01, -0.18], [0, -0.215], [0.01, -0.18], [0.02, -0.14], [0.03, -0.108], [0.046, -0.14], [0.064, -0.168], [0.07, -0.142], [0.071, -0.1], [0.066, -0.062], [0.054, -0.026], [0.03, -0.004]];
const tulipPts = (cx, cy, s, ang = 0) => rotAbout(TULIP.map(([x, y]) => [cx + x * s, cy + y * s]), cx, cy, ang);
// the lines that divide the cup into its petals and give it a belly
const tulipLines = (cx, cy, s, ang) => [[[-0.03, -0.108], [-0.036, -0.06], [-0.02, -0.014]], [[0.03, -0.108], [0.036, -0.06], [0.02, -0.014]], [[0, -0.19], [0.002, -0.1], [0, -0.03]]].map((c) => rotAbout(c.map(([x, y]) => [cx + x * s, cy + y * s]), cx, cy, ang));

export function delft(rng, v = 1) {
  const j = jit(rng, v, 0.02);
  // a tulip vase: foot, swelling body, collar and a flared mouth
  const vase = [[0.445, 0.945], [0.415, 0.91], [0.375, 0.85], [0.352, 0.78], [0.362, 0.71], [0.41, 0.665], [0.43, 0.64], [0.43, 0.615], [0.415, 0.598], [0.585, 0.598], [0.57, 0.615], [0.57, 0.64], [0.59, 0.665], [0.638, 0.71], [0.648, 0.78], [0.625, 0.85], [0.585, 0.91], [0.555, 0.945]];
  const F = [{ x: 0.5, y: 0.4 + j, s: 1.2, a: 0, noSym: true }, { x: 0.375, y: 0.47, s: 1.0, a: -0.42 }, { x: 0.245, y: 0.55, s: 0.7, a: -0.85 }];
  const o1 = [ring(0.5, 0.5, 0.44, 0.44, { col: 0, w: 0.011, noSym: true }), ring(0.5, 0.5, 0.415, 0.415, { col: 1, w: 0.006, noSym: true })];
  o1.push(loop(vase, { col: 0, w: 0.011, noSym: true }));
  o1.push(curve([[0.5, 0.6], [0.5, 0.5], [0.5, 0.4 + j]], { col: 0, w: 0.008, noSym: true }), curve([[0.475, 0.6], [0.43, 0.55], [0.375, 0.47]], { col: 0, w: 0.008 }), curve([[0.46, 0.6], [0.36, 0.6], [0.245, 0.55]], { col: 0, w: 0.008 }));
  for (const f of F) o1.push(polygon(tulipPts(f.x, f.y, f.s, f.a), { col: 0, w: 0.009, noSym: f.noSym }));
  o1.push(leaf([0.488, 0.585], [0.31, 0.7], 0.06, 0.16, { col: 0, w: 0.009 }), leaf([0.495, 0.52], [0.4, 0.375], 0.045, -0.12, { col: 0, w: 0.008 }));
  for (const k of [0, 1, 2]) o1.push(curve([[0.0 + k * 0.03, 0.12 + k * 0.03], [0.07 + k * 0.03, 0.05 + k * 0.03]], { col: 0, w: 0.008 }));
  o1.push(arc(0.0, 0.0, 0.1, 0.1, 0, TAU / 4, { col: 0, w: 0.009 }), arc(0.0, 0.0, 0.14, 0.14, 0, TAU / 4, { col: 0, w: 0.009 }));
  const r2 = [smoothPoly(vase, { col: 1, label: 'vase', noSym: true })];
  for (const f of F) r2.push(poly(tulipPts(f.x, f.y, f.s, f.a), { col: 1, label: 'tulip', noSym: f.noSym }));
  r2.push(leafRegion([0.488, 0.585], [0.31, 0.7], 0.06, 0.16, { col: 1, label: 'leaf' }), leafRegion([0.495, 0.52], [0.4, 0.375], 0.045, -0.12, { col: 1, label: 'leaf' }));
  const o3 = [curve([[0.365, 0.745], [0.5, 0.79], [0.635, 0.745]], { col: 0, w: 0.008, noSym: true }), curve([[0.383, 0.85], [0.5, 0.89], [0.617, 0.85]], { col: 0, w: 0.008, noSym: true }), curve([[0.425, 0.665], [0.5, 0.69], [0.575, 0.665]], { col: 0, w: 0.007, noSym: true })];
  for (const f of F) for (const l of tulipLines(f.x, f.y, f.s, f.a)) o3.push(curve(l, { col: 0, w: 0.007, noSym: f.noSym }));
  for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU + 0.2; o3.push(dot(...polar(0.5, 0.5, 0.385, a), { col: 0, w: 0.014, noSym: true })); }
  return {
    id: 'delft', name: 'Delft tiles', ar: 1, ground: '#fbfbf7', finish: 'gloss', surface: { kind: 'tiles', shape: 'rect', grid: 2, lift: 1 }, symmetry: { kind: 'mirror-x' },
    palette: [{ name: 'cobalt', color: '#27499f' }, { name: 'pale blue', color: '#7d9bd6' }],
    layers: [
      { name: 'Draw the ring, the vase and the tulips', tool: 'fine', colors: [0, 1], strokes: o1, regions: [], hint: 'The double ring, then the vase, the stems, the tulips and the corner fans' },
      { name: 'Wash the vase and the flowers', tool: 'brush', colors: [1, 0], strokes: [], regions: r2, hint: 'Pale blue in the vase, the tulips and the leaves' },
      { name: 'Shade with fine cobalt', tool: 'fine', colors: [0], strokes: o3, regions: [], hint: 'Bands on the vase, the folds of each tulip, dots round the ring' },
    ],
  };
}

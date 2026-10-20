// shape-craft 1.14.2 paint tables for the Painted Folk Art bucket (Europe and the Americas): hex sign (Pennsylvania), Zhostovo tray (Russia),
// Cicmany house front (Slovakia), tap-tap bus panel (Haiti), screen painting (Baltimore), Zalipie flowers (Poland), scratched egg (Opole).
import { curve, stroke, ring, arc, polygon, line, leaf, leafRegion, blob, poly, smoothPoly, rect, dotsIn, polar, jit, TAU } from '../paint-shapes.js';
import { eggOutline } from './pysanka.js';

const dot = (x, y, o) => curve([[x, y], [x + 0.004, y + 0.003]], o);
const star = (c, n, R, r, a0 = -Math.PI / 2) => Array.from({ length: n * 2 }, (_, i) => polar(c[0], c[1], i % 2 ? r : R, a0 + (i * Math.PI) / n));
const PI = Math.PI;

export function hexsign(rng, v = 1) {
  const j = jit(rng, v, 0.01), C = [0.5, 0.5], k = { red: 0, blue: 1, yellow: 2, green: 3, white: 4, black: 5 };
  const L1 = [ring(...C, 0.46, 0.46, { col: k.black, w: 0.011, noSym: true }), ring(...C, 0.415, 0.415, { col: k.blue, w: 0.012, noSym: true }), ring(...C, 0.372, 0.372, { col: k.red, w: 0.012, noSym: true }),
    polygon(star(C, 8, 0.36, 0.16), { col: k.black, w: 0.01, noSym: true }), polygon(star(C, 8, 0.2, 0.095, -PI / 2 + PI / 8), { col: k.black, w: 0.008, noSym: true })];
  for (let q = 0; q < 8; q++) L1.push(leaf(polar(...C, 0.2, PI / 8 + (q * PI) / 4), polar(...C, 0.345, PI / 8 + (q * PI) / 4), 0.085, 0, { col: k.black, w: 0.006, noSym: true }));
  const R2 = [poly(star(C, 8, 0.36, 0.16), { col: k.red, label: 'star', noSym: true }), poly(star(C, 8, 0.2, 0.095, -PI / 2 + PI / 8), { col: k.blue, label: 'inner star', noSym: true })];
  for (let q = 0; q < 8; q++) R2.push(leafRegion(polar(...C, 0.2, PI / 8 + (q * PI) / 4), polar(...C, 0.345, PI / 8 + (q * PI) / 4), 0.085, 0, { col: q % 2 ? k.yellow : k.green, label: 'petal', noSym: true }));
  R2.push(blob(...C, 0.062, 0.062, { col: k.white, label: 'heart', noSym: true }));
  const L3 = [];
  for (let q = 0; q < 24; q++) L3.push(dot(...polar(...C, 0.394, (q * TAU) / 24 + j), { col: k.white, w: 0.012, noSym: true }));
  for (let q = 0; q < 8; q++) L3.push(curve([polar(...C, 0.22, PI / 8 + (q * PI) / 4), polar(...C, 0.33, PI / 8 + (q * PI) / 4)], { col: k.black, w: 0.005, noSym: true }));
  L3.push(dot(...C, { col: k.black, w: 0.026, noSym: true }));
  for (let q = 0; q < 8; q++) L3.push(dot(...polar(...C, 0.275, (q * PI) / 4 - PI / 2), { col: k.white, w: 0.012, noSym: true }));
  return {
    id: 'hexsign', name: 'Hex sign', ar: 1, ground: '#efe3c2', surface: { kind: 'board', shape: 'ellipse' }, symmetry: { kind: 'rot', n: 8 },
    palette: [{ name: 'barn red', color: '#b3231c' }, { name: 'blue', color: '#1f4a8c' }, { name: 'yellow', color: '#e8b81c' }, { name: 'green', color: '#2f7a3a' }, { name: 'white', color: '#f6f0e0' }, { name: 'black', color: '#1c1a18' }],
    layers: [
      { name: 'Draw the rings and the star', tool: 'fine', colors: [5, 1, 0], strokes: L1, regions: [], hint: 'Three rings, then the eight-pointed star and the petals set by compass' },
      { name: 'Flood the star and the petals', tool: 'brush', colors: [0, 1, 2, 3, 4], strokes: [], regions: R2, hint: 'Red star, blue inner star, yellow and green petals, a white heart' },
      { name: 'Add the dots and the veins', tool: 'fine', colors: [4, 5], strokes: L3, regions: [], hint: 'A ring of white dots, black veins in the petals' },
    ],
  };
}

export function zhostovo(rng, v = 1) {
  const j = jit(rng, v, 0.012), k = { rose: 0, pink: 1, white: 2, green: 3, teal: 4, gold: 5, blue: 6 };
  const stems = [curve([[0.62, 0.8], [0.6, 0.66], [0.57, 0.55]], { col: k.green, w: 0.012 }), curve([[0.5, 0.82], [0.46, 0.7], [0.42, 0.6]], { col: k.green, w: 0.01 }), curve([[0.72, 0.78], [0.8, 0.66], [0.86, 0.55]], { col: k.green, w: 0.01 }), curve([[0.6, 0.82], [0.7, 0.9], [0.8, 0.92]], { col: k.green, w: 0.009 })];
  const leaves = [];
  [[-2.4, 0.2], [-1.9, 0.17], [-1.2, 0.18], [-0.6, 0.16], [0.1, 0.19], [0.7, 0.17], [1.3, 0.2], [2.2, 0.18]].forEach(([a, L], i) => leaves.push(leafRegion(polar(0.6, 0.55, 0.1, a), polar(0.6, 0.55, 0.1 + L + 0.1, a), 0.075, 0.12 * (i % 2 ? 1 : -1), { col: i % 3 === 2 ? k.teal : k.green, label: 'leaf' })));
  leaves.push(leafRegion([0.74, 0.7], [0.96, 0.62], 0.07, 0.1, { col: k.green, label: 'leaf' }), leaf0([0.45, 0.72], [0.26, 0.68]));
  function leaf0(p, q) { return leafRegion(p, q, 0.07, -0.1, { col: k.teal, label: 'leaf' }); }
  const flowers = [], rose = (cx, cy, R, n, c0, c1) => { for (let q = 0; q < n; q++) { const a = (q / n) * TAU + 0.3; flowers.push(leafRegion(polar(cx, cy, R * 0.18, a), polar(cx, cy, R, a), R * 0.78, 0.12, { col: c0, label: 'petal' })); } for (let q = 0; q < n - 2; q++) { const a = ((q + 0.5) / (n - 2)) * TAU; flowers.push(leafRegion(polar(cx, cy, R * 0.05, a), polar(cx, cy, R * 0.66, a), R * 0.5, 0.12, { col: c1, label: 'inner petal' })); } flowers.push(blob(cx, cy, R * 0.18, R * 0.18, { col: k.rose, label: 'heart' })); };
  rose(0.58 + j, 0.47, 0.15, 9, k.pink, k.rose); rose(0.4, 0.6, 0.095, 7, k.white, k.pink); rose(0.8, 0.52, 0.075, 6, k.pink, k.white);
  for (const [x, y] of [[0.74, 0.34], [0.9, 0.42], [0.3, 0.45]]) for (let q = -1; q <= 1; q++) flowers.push(leafRegion(polar(x, y, 0.01, -PI / 2 + q * 0.7), polar(x, y, 0.07, -PI / 2 + q * 0.7), 0.04, 0.1 * q, { col: k.blue, label: 'bell' }));
  const berries = [blob(0.3, 0.72, 0.02, 0.02, { col: k.gold, label: 'berry' }), blob(0.34, 0.76, 0.018, 0.018, { col: k.gold, label: 'berry' }), blob(0.9, 0.66, 0.02, 0.02, { col: k.gold, label: 'berry' }), blob(0.86, 0.7, 0.017, 0.017, { col: k.gold, label: 'berry' }), blob(0.5, 0.26, 0.016, 0.016, { col: k.gold, label: 'berry' })];
  const gold = [ring(0.65, 0.5, 0.6, 0.46, { col: k.gold, w: 0.008, noSym: true }), ring(0.65, 0.5, 0.575, 0.44, { col: k.gold, w: 0.005, noSym: true })];
  for (let q = 0; q < 40; q++) gold.push(dot(0.65 + Math.cos((q * TAU) / 40) * 0.59, 0.5 + Math.sin((q * TAU) / 40) * 0.455, { col: k.gold, w: 0.011, noSym: true }));
  for (const [x, y, r] of [[0.58, 0.47, 0.15], [0.4, 0.6, 0.095]]) for (let q = 0; q < 6; q++) gold.push(curve([polar(x, y, r * 0.35, q + 0.8), polar(x, y, r * 0.8, q + 0.9)], { col: k.white, w: 0.005, noSym: true }));
  return {
    id: 'zhostovo', name: 'Zhostovo tray', ar: 1.3, ground: '#17110f', surface: { kind: 'lacquer', shape: 'ellipse' }, symmetry: { kind: 'none' },
    palette: [{ name: 'rose red', color: '#c8283c' }, { name: 'pink', color: '#f09ab0' }, { name: 'cream', color: '#f4ecdc' }, { name: 'leaf green', color: '#2f7a3a' }, { name: 'teal', color: '#1f8a7c' }, { name: 'gold', color: '#e6b84a' }, { name: 'blue', color: '#3a5cb8' }],
    layers: [
      { name: 'Draw the stems and press the leaves', tool: 'brush', colors: [3, 4], strokes: stems, regions: leaves, hint: 'Green stems, then green and teal leaves round the bouquet' },
      { name: 'Paint the roses and the bells', tool: 'brush', colors: [0, 1, 2, 6], strokes: [], regions: flowers, hint: 'Outer petals first, then the inner ones and a deep heart' },
      { name: 'Add the berries', tool: 'dab', colors: [5], strokes: [], regions: berries, hint: 'Gold berries between the flowers' },
      { name: 'Draw the gold edge and the highlights', tool: 'fine', colors: [5, 2], strokes: gold, regions: [], hint: 'A gold ring round the tray with a string of dots; white lines on the roses' },
    ],
  };
}

export function cicmany(rng, v = 1) {
  const j = jit(rng, v, 0.008), AR = 0.8, cx = 0.4, k = { white: 0, ochre: 1 }, S = (o = {}) => ({ col: k.white, w: 0.01, noSym: true, ...o });
  const L1 = [polygon([[0.04, 0.04], [0.76, 0.04], [0.76, 0.96], [0.04, 0.96]], S({ w: 0.012 })), polygon([[0.075, 0.075], [0.725, 0.075], [0.725, 0.925], [0.075, 0.925]], S({ w: 0.007 }))];
  const zig = (y, a) => { const p = []; for (let i = 0; i <= 10; i++) p.push([0.1 + i * 0.06, y + (i % 2 ? a : 0)]); return stroke(p, S()); };
  L1.push(zig(0.12, 0.05), zig(0.19, 0.05), zig(0.81, 0.05), zig(0.88, -0.05));
  const L2 = [ring(cx, 0.46 + j, 0.2, 0.2, S({ w: 0.012 })), ring(cx, 0.46 + j, 0.15, 0.15, S({ w: 0.008 })), ring(cx, 0.46 + j, 0.04, 0.04, S({ w: 0.01 }))];
  for (let q = 0; q < 16; q++) L2.push(line(polar(cx, 0.46 + j, 0.205, (q * TAU) / 16), polar(cx, 0.46 + j, 0.275, (q * TAU) / 16), S({ w: 0.009 })));
  for (let q = 0; q < 8; q++) L2.push(line(polar(cx, 0.46 + j, 0.045, (q * TAU) / 8 + 0.2), polar(cx, 0.46 + j, 0.145, (q * TAU) / 8 + 0.2), S({ w: 0.006 })));
  const L3 = [];
  for (let q = 0; q < 6; q++) { const x0 = 0.12 + q * 0.11; L3.push(polygon([[x0, 0.72], [x0 + 0.1, 0.72], [x0 + 0.05, 0.66]], S({ w: 0.007 }))); }
  for (let q = 0; q < 5; q++) { L3.push(dot(0.15 + q * 0.125, 0.765, S({ col: k.ochre, w: 0.016 }))); }
  for (const x of [0.11, 0.69]) for (let q = 0; q < 6; q++) L3.push(curve([[x - 0.015, 0.26 + q * 0.07], [x, 0.29 + q * 0.07], [x + 0.015, 0.26 + q * 0.07]], S({ w: 0.007 })));
  for (const [x, y] of [[0.17, 0.46], [0.63, 0.46]]) L3.push(polygon([[x, y - 0.045], [x + 0.03, y], [x, y + 0.045], [x - 0.03, y]], S({ col: k.ochre, w: 0.008 })));
  return {
    id: 'cicmany', name: 'Cicmany house front', ar: AR, ground: '#2f2018', surface: { kind: 'wall', shape: 'rect' }, symmetry: { kind: 'mirror-x' },
    palette: [{ name: 'lime white', color: '#f4eee0' }, { name: 'pale ochre', color: '#dcb978' }],
    layers: [
      { name: 'Draw the frame and the zigzags', tool: 'stick', colors: [0], strokes: L1, regions: [], hint: 'Two ruled frames and bands of zigzag under the roof and above the base' },
      { name: 'Draw the sun wheel', tool: 'stick', colors: [0], strokes: L2, regions: [], hint: 'Rings, sixteen rays and spokes round a small heart' },
      { name: 'Add the triangles, chevrons and dots', tool: 'stick', colors: [0, 1], strokes: L3, regions: [], hint: 'A row of triangles, ochre dots, chevrons down the sides and two diamonds' },
    ],
  };
}

export function taptap(rng, v = 1) {
  const j = jit(rng, v, 0.01), k = { sky: 0, orange: 1, yellow: 2, red: 3, green: 4, deep: 5, white: 6, black: 7, pink: 8 };
  const AR = 1.6;
  const R1 = [smoothPoly([[0, 0.7], [0.2, 0.58], [0.42, 0.66], [0.62, 0.55], [0.9, 0.68], [1.1, 0.6], [1.35, 0.7], [1.6, 0.62], [1.6, 0.8], [0, 0.8]], { col: k.green, label: 'hills', noSym: true }),
    smoothPoly([[0, 0.78], [0.3, 0.74], [0.6, 0.8], [0.9, 0.75], [1.2, 0.8], [1.6, 0.76], [1.6, 1], [0, 1]], { col: k.deep, label: 'sea', noSym: true }),
    blob(0.34, 0.3 + j, 0.17, 0.17, { col: k.orange, label: 'sun' }), blob(0.34, 0.3 + j, 0.1, 0.1, { col: k.yellow, label: 'sun heart' }),
    blob(0.9, 0.2, 0.12, 0.05, { col: k.white, label: 'cloud' }), blob(0.98, 0.17, 0.08, 0.05, { col: k.white, label: 'cloud' }), blob(0.78, 0.22, 0.07, 0.04, { col: k.white, label: 'cloud' })];
  const R2 = [];
  for (let q = 0; q < 5; q++) { const a = -PI / 2 + (q * TAU) / 5 + 0.2; R2.push(leafRegion(polar(1.2, 0.5, 0.02, a), polar(1.2, 0.5, 0.3, a), 0.2, 0.1, { col: q % 2 ? k.red : k.pink, label: 'petal' })); }
  R2.push(blob(1.2, 0.5, 0.045, 0.045, { col: k.yellow, label: 'heart' }));
  R2.push(leafRegion([1.2, 0.78], [0.98, 0.9], 0.1, -0.1, { col: k.green, label: 'leaf' }), leafRegion([1.2, 0.78], [1.42, 0.92], 0.1, 0.1, { col: k.green, label: 'leaf' }));
  R2.push(smoothPoly([[0.55, 0.42], [0.62, 0.38], [0.7, 0.4], [0.76, 0.34], [0.72, 0.43], [0.64, 0.46]], { col: k.black, label: 'bird' }));
  const L3 = [];
  for (let q = 0; q < 14; q++) L3.push(line(polar(0.34, 0.3 + j, 0.185, (q * TAU) / 14), polar(0.34, 0.3 + j, 0.255, (q * TAU) / 14), { col: k.orange, w: 0.012 }));
  for (let w = 0; w < 4; w++) L3.push(curve([[0.05, 0.84 + w * 0.035], [0.4, 0.82 + w * 0.035], [0.8, 0.86 + w * 0.035], [1.55, 0.83 + w * 0.035]], { col: k.white, w: 0.008 }));
  for (let q = 0; q < 5; q++) { const a = -PI / 2 + (q * TAU) / 5 + 0.2; L3.push(curve([polar(1.2, 0.5, 0.05, a), polar(1.2, 0.5, 0.25, a)], { col: k.black, w: 0.006 })); }
  L3.push(ring(0.34, 0.3 + j, 0.17, 0.17, { col: k.red, w: 0.008 }));
  for (let q = 0; q < 12; q++) L3.push(dot(0.06 + q * 0.13, 0.96, { col: k.yellow, w: 0.016 }));
  return {
    id: 'taptap', name: 'Tap-tap bus panel', ar: AR, ground: '#58b6e6', surface: { kind: 'board', shape: 'rect' }, symmetry: { kind: 'none' },
    palette: [{ name: 'sky', color: '#58b6e6' }, { name: 'orange', color: '#f27a1c' }, { name: 'yellow', color: '#f6d02a' }, { name: 'red', color: '#d6202c' }, { name: 'green', color: '#2a9a4a' }, { name: 'deep blue', color: '#1c4aa8' }, { name: 'white', color: '#faf6ea' }, { name: 'black', color: '#1a1614' }, { name: 'pink', color: '#f06aa8' }],
    layers: [
      { name: 'Flood the hills, the sea and the sun', tool: 'brush', colors: [4, 5, 1, 2, 6], strokes: [], regions: R1, hint: 'Green hills, a deep blue sea, an orange sun with a yellow heart and white clouds' },
      { name: 'Paint the big flower', tool: 'brush', colors: [3, 8, 2, 4, 7], strokes: [], regions: R2, hint: 'Red and pink petals, a yellow heart, two green leaves and a black bird' },
      { name: 'Draw the rays, waves and dots', tool: 'fine', colors: [1, 6, 7, 3, 2], strokes: L3, regions: [], hint: 'Rays round the sun, white waves, veins in the petals and a string of yellow dots' },
    ],
  };
}

export function screenpaint(rng, v = 1) {
  const j = jit(rng, v, 0.01), k = { sky: 0, hill: 1, grass: 2, wall: 3, roof: 4, wood: 5, water: 6, leaf: 7, ink: 8 };
  const R1 = [rect(0, 0, 0.72, 0.42, { col: k.sky, label: 'sky' }), smoothPoly([[0, 0.42], [0.18, 0.3], [0.4, 0.36], [0.6, 0.27], [0.72, 0.34], [0.72, 0.52], [0, 0.52]], { col: k.hill, label: 'hills' }), smoothPoly([[0, 0.5], [0.3, 0.46], [0.72, 0.5], [0.72, 1], [0, 1]], { col: k.grass, label: 'meadow' }),
    smoothPoly([[0.16, 0.78], [0.26, 0.68], [0.36, 0.62], [0.42, 0.7], [0.36, 0.82], [0.46, 0.9], [0.52, 1], [0.3, 1], [0.24, 0.9]], { col: k.water, label: 'stream' })];
  const R2 = [rect(0.34, 0.4 + j, 0.62, 0.55, { col: k.wall, label: 'cottage' }), poly([[0.31, 0.405 + j], [0.48, 0.3 + j], [0.65, 0.405 + j]], { col: k.roof, label: 'roof' }), rect(0.45, 0.46, 0.51, 0.55, { col: k.wood, label: 'door' }), rect(0.37, 0.44, 0.42, 0.49, { col: k.water, label: 'window' }), rect(0.54, 0.44, 0.59, 0.49, { col: k.water, label: 'window' }), rect(0.54, 0.3, 0.58, 0.37, { col: k.roof, label: 'chimney' }),
    rect(0.095, 0.58, 0.115, 0.7, { col: k.wood, label: 'trunk' }), blob(0.105, 0.52, 0.09, 0.09, { col: k.leaf, label: 'tree' }), blob(0.07, 0.56, 0.06, 0.06, { col: k.leaf, label: 'tree' }), rect(0.6, 0.66, 0.62, 0.76, { col: k.wood, label: 'trunk' }), blob(0.61, 0.6, 0.075, 0.08, { col: k.leaf, label: 'tree' }),
    smoothPoly([[0.2, 0.86], [0.26, 0.82], [0.34, 0.78], [0.4, 0.82], [0.34, 0.85], [0.26, 0.88]], { col: k.wood, label: 'bridge' })];
  const L3 = [curve([[0.575, 0.3], [0.59, 0.24], [0.57, 0.19], [0.6, 0.14]], { col: k.ink, w: 0.007 }), line([0.34, 0.4], [0.62, 0.4], { col: k.ink, w: 0.006 }), line([0.48, 0.3], [0.48, 0.405], { col: k.ink, w: 0.005 }), line([0.395, 0.44], [0.395, 0.49], { col: k.ink, w: 0.004 }), line([0.565, 0.44], [0.565, 0.49], { col: k.ink, w: 0.004 }), dot(0.5, 0.51, { col: k.roof, w: 0.012 })];
  for (let q = 0; q < 8; q++) L3.push(curve([[0.04 + q * 0.085, 0.95], [0.045 + q * 0.085, 0.9], [0.055 + q * 0.085, 0.86]], { col: k.leaf, w: 0.006 }));
  for (const [x, y] of [[0.15, 0.1], [0.3, 0.16], [0.52, 0.08]]) L3.push(curve([[x, y], [x + 0.02, y - 0.015], [x + 0.04, y]], { col: k.ink, w: 0.005 }), curve([[x + 0.04, y], [x + 0.06, y - 0.015], [x + 0.08, y]], { col: k.ink, w: 0.005 }));
  L3.push(curve([[0.22, 0.86], [0.3, 0.81], [0.38, 0.83]], { col: k.ink, w: 0.005 }));
  return {
    id: 'screenpaint', name: 'Window screen painting', ar: 0.72, ground: '#d7cfb2', surface: { kind: 'panel', shape: 'rect' }, symmetry: { kind: 'none' },
    palette: [{ name: 'sky blue', color: '#8cc4e6' }, { name: 'hill blue-green', color: '#4a8a8a' }, { name: 'meadow', color: '#6aa84a' }, { name: 'white', color: '#f7f2e6' }, { name: 'roof red', color: '#b8302a' }, { name: 'brown', color: '#7a4a28' }, { name: 'stream blue', color: '#3a78c0' }, { name: 'leaf green', color: '#2f7a3a' }, { name: 'ink', color: '#1c1a18' }],
    layers: [
      { name: 'Paint the sky, hills, meadow and stream', tool: 'brush', colors: [0, 1, 2, 6], strokes: [], regions: R1, hint: 'The view behind the cottage, in broad flat colour' },
      { name: 'Paint the cottage, the trees and the bridge', tool: 'brush', colors: [3, 4, 5, 6, 7], strokes: [], regions: R2, hint: 'White walls, a red roof, brown doors and trunks, green trees' },
      { name: 'Add the smoke, the birds and the grass', tool: 'fine', colors: [8, 7, 4], strokes: L3, regions: [], hint: 'Smoke from the chimney, tiny birds, blades of grass and the lines of the house' },
    ],
  };
}

export function zalipie(rng, v = 1) {
  const j = jit(rng, v, 0.01), AR = 1, cx = 0.5, k = { red: 0, blue: 1, yellow: 2, green: 3, black: 4, white: 5 };
  const stems = [curve([[0.5, 0.9], [0.5, 0.6], [0.5, 0.36]], { col: k.green, w: 0.012, noSym: true }), curve([[0.5, 0.8], [0.4, 0.7], [0.3, 0.58]], { col: k.green, w: 0.01 }), curve([[0.5, 0.72], [0.4, 0.78], [0.28, 0.8]], { col: k.green, w: 0.01 })];
  const leaves = [];
  for (const [p, q, w, b] of [[[0.5, 0.68], [0.38, 0.62], 0.08, 0.1], [[0.5, 0.78], [0.36, 0.76], 0.08, -0.1], [[0.46, 0.5], [0.36, 0.44], 0.07, 0.1], [[0.42, 0.74], [0.3, 0.9], 0.07, 0.12]]) leaves.push(leafRegion(p, q, w, b, { col: k.green, label: 'leaf' }));
  const flowers = [];
  for (let q = 0; q < 5; q++) { const a = -PI / 2 + (q * TAU) / 5; flowers.push(blob(...polar(cx, 0.28 + j, 0.075, a), 0.07, 0.07, { col: k.red, label: 'petal', noSym: true })); }
  flowers.push(blob(cx, 0.28 + j, 0.05, 0.05, { col: k.black, label: 'poppy heart', noSym: true }));
  for (const sx of [1, -1]) { const x = cx - sx * 0.2, y = 0.52; for (let q = 0; q < 9; q++) flowers.push(leafRegion(polar(x, y, 0.025, (q * TAU) / 9), polar(x, y, 0.115, (q * TAU) / 9), 0.055, 0, { col: k.blue, label: 'daisy petal' })); flowers.push(blob(x, y, 0.03, 0.03, { col: k.yellow, label: 'daisy heart' })); }
  for (const sx of [1, -1]) for (let q = -1; q <= 1; q++) flowers.push(leafRegion(polar(cx - sx * 0.13, 0.82, 0.01, -PI / 2 + q * 0.6), polar(cx - sx * 0.13, 0.82, 0.1, -PI / 2 + q * 0.6), 0.05, 0.08 * q, { col: q ? k.yellow : k.red, label: 'bell' }));
  const L3 = [polygon([[0.05, 0.05], [0.95, 0.05], [0.95, 0.95], [0.05, 0.95]], { col: k.blue, w: 0.012, noSym: true })];
  for (let q = 0; q < 10; q++) { L3.push(dot(0.1 + q * 0.0889, 0.1, { col: k.red, w: 0.016, noSym: true }), dot(0.1 + q * 0.0889, 0.9, { col: k.red, w: 0.016, noSym: true })); }
  for (let q = 0; q < 7; q++) { L3.push(dot(0.1, 0.19 + q * 0.103, { col: k.red, w: 0.016, noSym: true }), dot(0.9, 0.19 + q * 0.103, { col: k.red, w: 0.016, noSym: true })); }
  L3.push(ring(cx, 0.28 + j, 0.14, 0.14, { col: k.black, w: 0.006, noSym: true }));
  for (const sx of [1, -1]) L3.push(ring(cx - sx * 0.2, 0.52, 0.13, 0.13, { col: k.black, w: 0.006, noSym: true }));
  for (let q = 0; q < 5; q++) L3.push(dot(...polar(cx, 0.28 + j, 0.035, (q * TAU) / 5), { col: k.white, w: 0.01, noSym: true }));
  return {
    id: 'zalipie', name: 'Zalipie flowers', ar: AR, ground: '#f3efe4', surface: { kind: 'wall', shape: 'rect' }, symmetry: { kind: 'mirror-x' },
    palette: [{ name: 'poppy red', color: '#d02428' }, { name: 'cornflower blue', color: '#2a58b8' }, { name: 'yellow', color: '#f0c020' }, { name: 'green', color: '#2f8a3a' }, { name: 'black', color: '#1c1a18' }, { name: 'white', color: '#faf6ee' }],
    layers: [
      { name: 'Draw the stems and press the leaves', tool: 'brush', colors: [3], strokes: stems, regions: leaves, hint: 'One tall stem, two side stems and green leaves' },
      { name: 'Paint the poppy, the daisies and the bells', tool: 'brush', colors: [0, 1, 2, 4], strokes: [], regions: flowers, hint: 'A red poppy with a black heart, two blue daisies, small bells below' },
      { name: 'Draw the border and the outlines', tool: 'fine', colors: [1, 0, 4, 5], strokes: L3, regions: [], hint: 'A blue frame with a string of red dots; black rings round the flowers' },
    ],
  };
}

export function kroszonka(rng, v = 1) {
  const j = jit(rng, v, 0.008), cx = 0.39, k = { pale: 0, gold: 1 }, S = (o = {}) => ({ col: k.pale, w: 0.008, ...o });
  const hw = (y) => 0.36 * Math.sqrt(Math.max(0, 1 - ((y - 0.52) / 0.45) ** 2)) * (1 + 0.15 * (y - 0.5));
  const belt = (y, a) => { const p = []; const n = 14; for (let i = 0; i <= n; i++) { const t = i / n, x = cx - hw(y) * 0.92 + t * hw(y) * 1.84; p.push([x, y + (i % 2 ? a : 0)]); } return stroke(p, S({ w: 0.009, noSym: true })); };
  const L1 = [belt(0.3 + j, 0.035), belt(0.38, 0.03), belt(0.64, 0.03), belt(0.72 - j, 0.035), curve([[cx, 0.1], [cx, 0.28]], S({ noSym: true })), curve([[cx, 0.74], [cx, 0.9]], S({ noSym: true }))];
  const L2 = [polygon(star(...[[cx, 0.51]], 8, 0.13, 0.055), S({ w: 0.009, noSym: true })), ring(cx, 0.51, 0.045, 0.045, S({ noSym: true }))];
  for (let q = 0; q < 4; q++) { const y = 0.14 + q * 0.04; L2.push(curve([[cx, y + 0.02], [cx - 0.06, y + 0.005], [cx - 0.1, y - 0.01 + 0.01 * q]], S({ col: k.gold, w: 0.009 })), curve([[cx, 0.9 - q * 0.04 - 0.02], [cx - 0.06, 0.9 - q * 0.04 - 0.005], [cx - 0.1, 0.9 - q * 0.04 + 0.01 - 0.01 * q]], S({ col: k.gold, w: 0.009 })));
  }
  for (const y of [0.34, 0.68]) for (let q = 0; q < 3; q++) L2.push(polygon([[cx - 0.18 + q * 0.09 - 0.03, y + 0.045], [cx - 0.18 + q * 0.09 + 0.03, y + 0.045], [cx - 0.18 + q * 0.09, y - 0.005]], S({ w: 0.007 })));
  const L3 = [];
  for (let q = 0; q < 14; q++) L3.push(dot(...polar(cx, 0.51, 0.19, (q * TAU) / 14), S({ w: 0.013, noSym: true })));
  for (let q = 0; q < 8; q++) L3.push(dot(...polar(cx, 0.51, 0.095, (q * TAU) / 8 + 0.4), S({ col: k.gold, w: 0.012, noSym: true })));
  for (const y of [0.22, 0.8]) for (let q = 0; q < 4; q++) L3.push(dot(cx - 0.15 + q * 0.06, y, S({ w: 0.012 })));
  return {
    id: 'kroszonka', name: 'Scratched egg', ar: 0.78, ground: '#6e1822', surface: { kind: 'egg', shape: eggOutline() }, symmetry: { kind: 'mirror-x' },
    palette: [{ name: 'scratch', color: '#f2e8d0' }, { name: 'gold', color: '#d8b050' }],
    layers: [
      { name: 'Scratch the belts and the stem', tool: 'pen', colors: [0], strokes: L1, regions: [], hint: 'Zigzag belts above and below the middle and a stem to each end' },
      { name: 'Scratch the star and the leaves', tool: 'pen', colors: [0, 1], strokes: L2, regions: [], hint: 'An eight-pointed star in the middle, leaves up the stem, chips along the belts' },
      { name: 'Add the dots', tool: 'dots', colors: [0, 1], strokes: L3, regions: [], hint: 'A ring of dots round the star and small dots at each end' },
    ],
  };
}

// Dala horse (Sweden), 1.8.0: a carved wooden horse with an arched neck, upswept tail and defined legs and hooves. Step 1 floods it red and the
// saddle band blue; step 2 paints the bold white, green and yellow kurbits band; step 3 adds the mane stripes, bridle, tail and hoof trim.
import { comma, curve, ring, poly, roundPoly, polar, TAU, jit, pick } from '../paint-shapes.js';

const HORSE = [[0.07, 0.24], [0.12, 0.22], [0.165, 0.3], [0.21, 0.385], [0.3, 0.41], [0.44, 0.42], [0.58, 0.41], [0.64, 0.36], [0.69, 0.27], [0.73, 0.19], [0.77, 0.12], [0.81, 0.07],
  [0.82, 0.0], [0.855, 0.055], [0.88, 0.0], [0.905, 0.065], [0.95, 0.11], [1.01, 0.19], [1.065, 0.26], [1.095, 0.3], [1.085, 0.355], [1.03, 0.355], [0.98, 0.335], [0.95, 0.375], [0.925, 0.44], [0.93, 0.53], [0.945, 0.61], [0.955, 0.69],
  [0.96, 0.78], [0.975, 0.89], [0.98, 0.95], [0.845, 0.95], [0.845, 0.9], [0.85, 0.8], [0.83, 0.74], [0.78, 0.7], [0.62, 0.7], [0.48, 0.7],
  [0.42, 0.74], [0.41, 0.82], [0.42, 0.9], [0.425, 0.95], [0.285, 0.95], [0.285, 0.9], [0.29, 0.82], [0.265, 0.76], [0.2, 0.68], [0.155, 0.6], [0.14, 0.5], [0.095, 0.42], [0.06, 0.32]];
const BAND = [[0.4, 0.46], [0.52, 0.45], [0.645, 0.445], [0.675, 0.56], [0.655, 0.665], [0.52, 0.67], [0.42, 0.665], [0.385, 0.56]];

function kurbits(s, cx, cy, r, n, a0, wid) {
  for (let k = 0; k < n; k++) { const a = a0 + (k / n) * TAU; s.push(comma(polar(cx, cy, r, a), polar(cx, cy, r * 0.28, a + 0.1), 0.1, { col: 2, w: wid })); }
  s.push(curve([[cx, cy], [cx + 0.005, cy + 0.004]], { col: 4, w: wid * 1.15 }));
}
export function dala(rng, v = 1) {
  const body = roundPoly(HORSE, 2), j = jit(rng, v, 0.25), hearts = rng.next() < 0.5;
  const horse = poly(body, { col: 0, label: 'horse', base: '#e4c487', volume: true }), band = poly(roundPoly(BAND, 2), { col: 1, label: 'saddle band' });
  const b = [];
  // bold white edging down both sides of the band, then the kurbits flower, leaves and yellow trim
  b.push(curve([[0.41, 0.49], [0.425, 0.56], [0.42, 0.64]], { col: 2, w: 0.04 }), curve([[0.64, 0.49], [0.655, 0.56], [0.64, 0.64]], { col: 2, w: 0.04 }));
  kurbits(b, 0.53, 0.555, 0.08, 7, j, 0.034);
  b.push(comma([0.53, 0.475], [0.53, 0.46], 0.0, { col: 3, w: 0.034 }), comma([0.53, 0.635], [0.53, 0.655], 0.0, { col: 3, w: 0.034 }));
  b.push(comma([0.47, 0.61], [0.45, 0.655], 0.25, { col: 3, w: 0.03 }), comma([0.59, 0.61], [0.61, 0.655], -0.25, { col: 3, w: 0.03 }));
  if (hearts) { for (const y of [0.475, 0.645]) { b.push(curve([[0.47, y], [0.474, y + 0.003]], { col: 4, w: 0.034 }), curve([[0.585, y], [0.589, y + 0.003]], { col: 4, w: 0.034 })); } }
  else { b.push(curve([[0.45, 0.475], [0.485, 0.46], [0.52, 0.475], [0.555, 0.46], [0.6, 0.475]], { col: 4, w: 0.026 })); }
  kurbits(b, 0.25, 0.56, 0.05, 6, -j, 0.026); kurbits(b, 0.885, 0.58, 0.04, 6, -j, 0.022);
  b.push(comma([0.28, 0.61], [0.3, 0.67], -0.2, { col: 3, w: 0.026 }), comma([0.9, 0.62], [0.9, 0.67], -0.2, { col: 3, w: 0.022 }));
  // mane: bold stripes across the crest, alternating white, blue and yellow; tail stripes
  [[0.655, 0.335], [0.69, 0.265], [0.725, 0.2], [0.76, 0.14], [0.795, 0.09]].forEach(([x, y], i) => b.push(curve([[x + 0.012, y + 0.01], [x + 0.065, y + 0.05]], { col: [2, 1, 4, 2, 1][i], w: 0.034 })));
  [[0.085, 0.37, 0.14, 0.34, 2], [0.1, 0.3, 0.15, 0.27, 1], [0.085, 0.26, 0.13, 0.25, 2]].forEach(([x0, y0, x1, y1, c]) => b.push(curve([[x0, y0], [x1, y1]], { col: c, w: 0.03 })));
  const t = [];
  // bridle: noseband, cheek strap and browband, the eye and the nostril; trim above every hoof; sprigs on chest and rump
  t.push(curve([[1.02, 0.27], [1.055, 0.31], [1.05, 0.345]], { col: 2, w: 0.02 }), curve([[0.945, 0.13], [0.965, 0.22], [0.995, 0.28]], { col: 4, w: 0.02 }), curve([[0.94, 0.2], [0.975, 0.25], [1.02, 0.27]], { col: 4, w: 0.016 }));
  t.push(ring(0.978, 0.2, 0.011, 0.011, { col: 5, w: 0.014 }), curve([[1.085, 0.3], [1.087, 0.303]], { col: 5, w: 0.02 }));
  for (const [x0, x1, c] of [[0.295, 0.41, 4], [0.855, 0.975, 2]]) t.push(curve([[x0, 0.88], [x1, 0.88]], { col: c, w: 0.02 }));
  t.push(comma([0.925, 0.5], [0.93, 0.58], 0.1, { col: 3, w: 0.018 }), comma([0.19, 0.5], [0.2, 0.58], -0.1, { col: 3, w: 0.018 }));
  return {
    id: 'dala', name: 'Dala horse', ar: 1.15, ground: '#e7c78f', finish: 'gloss', surface: { kind: 'carved', shape: body }, symmetry: { kind: 'none' },
    palette: [{ name: 'red', color: '#c9302c' }, { name: 'blue', color: '#2b5aa8' }, { name: 'white', color: '#f6f0e2' }, { name: 'green', color: '#3a8f4d' }, { name: 'yellow', color: '#f2c230' }, { name: 'black', color: '#1c1c1c', flat: true }],
    layers: [
      { name: 'Paint the horse red, then the blue band', tool: 'brush', colors: [0, 1], strokes: [], regions: [horse, band], hint: 'Tap the horse to flood it red, then the saddle band blue' },
      { name: 'Paint the flower band and mane', tool: 'dab', colors: [2, 1, 3, 4], strokes: b, regions: [], hint: 'White edging first, then the flower, the green leaves, the yellow trim and the mane stripes' },
      { name: 'Add the bridle and hoof trim', tool: 'brush', colors: [2, 4, 5, 3], strokes: t, regions: [], hint: 'Bridle straps on the head, the eye and nostril, then the hoof trim and sprigs' },
    ],
  };
}
void pick;

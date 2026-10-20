// Luk chup (Thailand): little fruits modelled from sweetened bean paste, painted, then dipped in agar for their shine.
import { smoothPoly, blob, leafRegion, curve, comma, ring, poly, jit } from '../paint-shapes.js';

export function lukchup(rng, v = 1) {
  const j = jit(rng, v, 0.015);
  const mango = smoothPoly([[0.12, 0.5], [0.2, 0.34 + j], [0.38, 0.3], [0.48, 0.44], [0.44, 0.62], [0.28, 0.7], [0.15, 0.64]], { col: 0, label: 'mango', base: '#efe3b8', volume: true });
  const chilli = poly([[0.58, 0.17], [0.7, 0.2], [0.82, 0.3], [0.9, 0.42], [0.93, 0.5], [0.88, 0.5], [0.78, 0.4], [0.66, 0.31], [0.57, 0.24]], { col: 1, label: 'chilli', base: '#efe3b8', volume: true });
  const orange = blob(0.7, 0.68, 0.135, 0.125, { col: 2, label: 'tangerine', base: '#efe3b8', volume: true });
  const aub = smoothPoly([[0.3, 0.74], [0.4, 0.72], [0.5, 0.78], [0.56, 0.87], [0.5, 0.94], [0.4, 0.93], [0.31, 0.84]], { col: 3, label: 'aubergine', base: '#efe3b8', volume: true });
  const stems = [
    curve([[0.3, 0.33], [0.29, 0.27], [0.33, 0.23]], { col: 7, w: 0.014 }), comma([0.3, 0.3], [0.18, 0.22], 0.2, { col: 4, w: 0.022 }),
    curve([[0.58, 0.18], [0.52, 0.14], [0.5, 0.1]], { col: 4, w: 0.012 }),
    curve([[0.7, 0.55], [0.7, 0.5]], { col: 4, w: 0.014 }), comma([0.7, 0.54], [0.8, 0.47], -0.25, { col: 4, w: 0.02 }),
    comma([0.38, 0.74], [0.3, 0.69], 0.3, { col: 4, w: 0.018 }), comma([0.42, 0.74], [0.5, 0.69], -0.3, { col: 4, w: 0.018 }),
    comma([0.22, 0.46], [0.26, 0.38], -0.3, { col: 5, w: 0.012 }), comma([0.66, 0.3], [0.76, 0.34], -0.2, { col: 5, w: 0.01 }),
    comma([0.64, 0.64], [0.66, 0.74], -0.3, { col: 5, w: 0.012 }), comma([0.36, 0.8], [0.42, 0.9], -0.2, { col: 5, w: 0.012 }),
    ring(0.7, 0.68, 0.022, 0.018, { col: 6, w: 0.005 }),
  ];
  void leafRegion;
  return {
    id: 'lukchup', name: 'Luk chup fruits', ar: 1.2, ground: '#2e6a3a', surface: { kind: 'leaf', shape: 'rect' }, symmetry: { kind: 'none' }, finish: 'gloss',
    palette: [{ name: 'mango yellow', color: '#f0b429' }, { name: 'chilli red', color: '#d62d20' }, { name: 'tangerine', color: '#f08a1e' }, { name: 'aubergine', color: '#5b2a86' }, { name: 'leaf green', color: '#2f8a3a' }, { name: 'white', color: '#fff8e8' }, { name: 'dark green', color: '#1c5a2c' }, { name: 'brown', color: '#6b3a1a' }],
    layers: [
      { name: 'Paint each fruit its colour', tool: 'brush', colors: [0, 1, 2, 3], strokes: [], regions: [mango, chilli, orange, aub], hint: 'Fill the whole pale fruit: brush inside it, or tap it to flood' },
      { name: 'Add stems, leaves and highlights', tool: 'fine', colors: [4, 5, 6, 7], strokes: stems, regions: [], hint: 'Green stalks and leaves, then white highlights' },
    ],
  };
}

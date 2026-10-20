// Warli painting (Maharashtra, India): rice-paste white on a red-ochre mud wall. Tree, birds, a hut and the sun; no figures.
import { curve, line, loop, polygon, ring, polar, jit, TAU } from '../paint-shapes.js';

export function warli(rng, v = 1) {
  const j = jit(rng, v, 0.02);
  const S = [];
  S.push(ring(0.2, 0.2, 0.065, 0.065, { col: 0, w: 0.012 }));
  for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; S.push(line(polar(0.2, 0.2, 0.09, a), polar(0.2, 0.2, 0.135, a), { col: 0, w: 0.011 })); }
  S.push(line([0.64, 0.9], [0.64, 0.42], { col: 0, w: 0.014 }));
  const br = [[[0.64, 0.7], [0.45, 0.58 + j]], [[0.64, 0.62], [0.84, 0.5]], [[0.64, 0.5], [0.52, 0.36]], [[0.64, 0.46], [0.78, 0.33]]];
  br.forEach(([a, b]) => S.push(line(a, b, { col: 0, w: 0.011 })));
  const tri = (cx, cy, s) => polygon([[cx - s, cy + s * 0.8], [cx, cy - s * 0.9], [cx + s, cy + s * 0.8]], { col: 0, w: 0.01 });
  [[0.43, 0.56], [0.86, 0.47], [0.5, 0.33], [0.8, 0.3], [0.64, 0.4]].forEach(([x, y]) => S.push(tri(x, y, 0.03)));
  // two birds: a triangle body, a round head, a beak and two legs
  const bird = (x, y, f) => [
    polygon([[x - 0.045 * f, y + 0.02], [x + 0.045 * f, y - 0.01], [x, y + 0.055]], { col: 0, w: 0.01 }),
    ring(x + 0.055 * f, y - 0.025, 0.015, 0.015, { col: 0, w: 0.01 }), line([x + 0.07 * f, y - 0.03], [x + 0.095 * f, y - 0.022], { col: 0, w: 0.008 }),
    line([x - 0.01 * f, y + 0.05], [x - 0.012 * f, y + 0.085], { col: 0, w: 0.008 }),
  ];
  S.push(...bird(0.56, 0.62, -1), ...bird(0.76, 0.42, 1));
  // hut
  S.push(polygon([[0.1, 0.7], [0.36, 0.7], [0.36, 0.86], [0.1, 0.86]], { col: 0, w: 0.011 }));
  S.push(polygon([[0.07, 0.71], [0.23, 0.55], [0.39, 0.71]], { col: 0, w: 0.011 }));
  S.push(polygon([[0.19, 0.86], [0.19, 0.76], [0.27, 0.76], [0.27, 0.86]], { col: 0, w: 0.009 }));
  S.push(curve([[0.04, 0.92], [0.22, 0.9], [0.44, 0.93], [0.66, 0.9], [0.96, 0.92]], { col: 0, w: 0.012 }));
  for (let k = 0; k < 4; k++) S.push(line([0.14 + k * 0.05, 0.64], [0.16 + k * 0.05, 0.68], { col: 0, w: 0.008 }));
  return {
    id: 'warli', name: 'Warli wall', ar: 1, ground: '#a24a2a', surface: { kind: 'wall', shape: 'rect' }, symmetry: { kind: 'none' },
    palette: [{ name: 'rice paste', color: '#f7f1e3' }],
    layers: [{ name: 'Draw with the rice paste', tool: 'stick', colors: [0], strokes: S, regions: [], hint: 'Lines and triangles only: sun, tree, birds, hut, ground' }],
  };
}

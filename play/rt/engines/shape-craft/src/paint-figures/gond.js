// Gond painting (central India): a deer filled with flat colour on a dark ground, then lined with the tradition's dotted and dashed rows.
import { blob, leafRegion, poly, roundPoly, curve, line, polar, jit, TAU } from '../paint-shapes.js';

export function gond(rng, v = 1) {
  const j = jit(rng, v, 0.012), B = '#2a2420';
  const body = blob(0.5, 0.56, 0.22, 0.12, { col: 0, label: 'body', base: B }, -0.06);
  const neck = poly(roundPoly([[0.61, 0.44], [0.72, 0.47], [0.85, 0.3 + j], [0.77, 0.22 + j]], 2), { col: 0, label: 'neck', base: B });
  const head = poly(roundPoly([[0.77, 0.25 + j], [0.8, 0.17 + j], [0.88, 0.14 + j], [0.96, 0.21 + j], [0.93, 0.26 + j], [0.84, 0.28 + j]], 2), { col: 0, label: 'head', base: B });
  const legX = [0.37, 0.45, 0.6, 0.68];
  const legs = legX.map((x) => poly(roundPoly([[x - 0.024, 0.62], [x + 0.024, 0.62], [x + 0.016, 0.76], [x + 0.022, 0.87], [x - 0.004, 0.87], [x - 0.012, 0.76]], 1), { col: 0, label: 'leg', base: B }));
  const tail = leafRegion([0.31, 0.53], [0.24, 0.44], 0.055, 0.12, { col: 0, label: 'tail', base: B });
  const sun = blob(0.17, 0.2, 0.09, 0.09, { col: 1, label: 'sun', base: B });
  const dots = [];
  [0.5, 0.55, 0.6, 0.65].forEach((y, i) => dots.push(curve([[0.34 + 0.02 * i, y + 0.01], [0.5, y - 0.02 + i * 0.006], [0.69 - 0.02 * i, y]], { col: i % 2 ? 3 : 2, w: 0.012 })));
  [0, 1].forEach((i) => dots.push(curve([[0.65 + i * 0.035, 0.49 - i * 0.04], [0.73 + i * 0.03, 0.39 - i * 0.05], [0.8 + i * 0.03, 0.28 - i * 0.04 + j]], { col: 4, w: 0.011 })));
  legX.forEach((x) => dots.push(line([x, 0.65], [x + 0.006, 0.83], { col: 5, w: 0.01 })));
  dots.push(curve([[0.85, 0.15 + j], [0.83, 0.07], [0.87, 0.0]], { col: 2, w: 0.01 }), curve([[0.84, 0.09], [0.78, 0.05]], { col: 2, w: 0.009 }), curve([[0.86, 0.04], [0.93, 0.01]], { col: 2, w: 0.009 }), curve([[0.9, 0.15 + j], [0.94, 0.08], [0.99, 0.05]], { col: 2, w: 0.01 }));
  for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; dots.push(line(polar(0.17, 0.2, 0.115, a), polar(0.17, 0.2, 0.16, a), { col: 4, w: 0.01 })); }
  dots.push(curve([[0.06, 0.92], [0.3, 0.9], [0.6, 0.93], [0.94, 0.91]], { col: 3, w: 0.011 }));
  return {
    id: 'gond', name: 'Gond deer', ar: 1, ground: '#15110f', surface: { kind: 'dark-paper', shape: 'rect' }, symmetry: { kind: 'none' },
    palette: [{ name: 'ochre', color: '#e0a030' }, { name: 'red', color: '#c8402a' }, { name: 'white', color: '#f4eedd' }, { name: 'teal', color: '#2fa39a' }, { name: 'yellow', color: '#f5d142' }, { name: 'pink', color: '#e06b8a' }],
    layers: [
      { name: 'Fill the deer and the sun with flat colour', tool: 'brush', colors: [0, 1], strokes: [], regions: [sun, body, neck, head, tail, ...legs], hint: 'Tap a shape to flood it' },
      { name: 'Draw the dotted and dashed rows', tool: 'dots', colors: [2, 3, 4, 5], strokes: dots, regions: [], hint: 'Draw each row in one pull: the dot pen lays the dashes for you' },
    ],
  };
}

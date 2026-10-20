// Rosemaling (Norway): C-scrolls and leaves around a rosette on a painted bowl. Four-fold symmetry about the bowl's centre.
import { curve, spiral, comma, ring, arc, leaf, polar, jit, TAU } from '../paint-shapes.js';

export function rosemaling(rng, v = 1) {
  const tw = jit(rng, v, 0.03), sc = 0.116;
  const base = [], flour = [];
  // one quarter, rotated three times by the engine
  for (const a of [0.39, 1.18]) base.push(leaf(polar(0.5, 0.5, 0.045, a), polar(0.5, 0.5, 0.165, a), 0.075, 0, { col: 2, w: 0.012 }));
  const sc0 = [0.74, 0.31 + tw];
  base.push(curve([[0.56, 0.41], [0.62, 0.36], [0.68, 0.30]], { col: 1, w: 0.02 }));
  base.push(spiral(sc0[0], sc0[1], sc, 0.012, 1.15, 1.9, { col: 0, w: 0.026 }, -1));
  base.push(comma([0.55, 0.30], [0.66, 0.2], -0.22, { col: 3, w: 0.022 }));
  base.push(comma([0.58, 0.36], [0.5, 0.2], 0.2, { col: 3, w: 0.02 }));
  base.push(spiral(0.64, 0.17, 0.045, 0.01, 1.0, 0.4, { col: 1, w: 0.018 }, 1));
  for (const [x, y] of [[0.8, 0.46], [0.84, 0.4], [0.88, 0.34]]) base.push(curve([[x, y], [x + 0.004, y + 0.004]], { col: 2, w: 0.026 }));
  flour.push(spiral(sc0[0], sc0[1], sc * 0.7, 0.02, 0.8, 2.0, { col: 0, w: 0.007 }, -1));
  flour.push(curve([[0.59, 0.4], [0.64, 0.35], [0.69, 0.31]], { col: 0, w: 0.006 }));
  flour.push(comma([0.55, 0.3], [0.64, 0.23], -0.2, { col: 0, w: 0.006 }));
  for (const a of [0.39, 1.18]) flour.push(curve([polar(0.5, 0.5, 0.065, a), polar(0.5, 0.5, 0.14, a)], { col: 0, w: 0.006 }));
  for (let k = 0; k < 4; k++) flour.push(curve([[0.7 + k * 0.035, 0.48 + k * 0.01], [0.7 + k * 0.035, 0.48 + k * 0.01 + 0.004]], { col: 0, w: 0.01 }));
  const rim = [arc(0.5, 0.5, 0.445, 0.445, 0, Math.PI, { col: 1, w: 0.012, noSym: true }), arc(0.5, 0.5, 0.445, 0.445, Math.PI, TAU, { col: 1, w: 0.012, noSym: true }), arc(0.5, 0.5, 0.415, 0.415, 0, Math.PI, { col: 0, w: 0.006, noSym: true }), arc(0.5, 0.5, 0.415, 0.415, Math.PI, TAU, { col: 0, w: 0.006, noSym: true })];
  const hub = [ring(0.5, 0.5, 0.022, 0.022, { col: 1, w: 0.014, noSym: true })];
  return {
    id: 'rosemaling', name: 'Rosemaling bowl', ar: 1, ground: '#2f5a63', surface: { kind: 'bowl', shape: 'ellipse' }, symmetry: { kind: 'rot', n: 4 },
    palette: [{ name: 'cream', color: '#f1e6c9' }, { name: 'ochre', color: '#d9a431' }, { name: 'madder red', color: '#b8322a' }, { name: 'green', color: '#4f9a5a' }],
    layers: [
      { name: 'Paint the scrolls and leaves', tool: 'brush', colors: [0, 1, 2, 3], strokes: [...rim.slice(0, 2), ...hub, ...base], regions: [], hint: 'Start each scroll at its thick end and let the brush lift as it curls in' },
      { name: 'Add the cream highlights', tool: 'fine', colors: [0], strokes: [...rim.slice(2), ...flour], regions: [], hint: 'Fine cream lines follow the body of each scroll' },
    ],
  };
}

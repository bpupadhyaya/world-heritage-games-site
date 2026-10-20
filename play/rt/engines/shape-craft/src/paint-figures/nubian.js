// Nubian house front (Egypt, Sudan), 1.9.0: a limewashed mud-brick wall painted in friezes, mirrored left to right. The doorway with its
// painted arch, a zigzag under the roof line, double bands, diamonds in turquoise and terracotta, and two small windows. Geometric only.
import { curve, stroke, polygon, line, smoothPoly, poly, rect, jit } from '../paint-shapes.js';

const dot = (x, y, o) => curve([[x, y], [x + 0.004, y + 0.003]], o);
export function nubian(rng, v = 1) {
  const j = jit(rng, v, 0.01), C = { blue: 0, turq: 1, ochre: 2, deep: 3, terra: 4, green: 5, black: 6 };
  const zig = []; for (let i = 0; i <= 12; i++) zig.push([0.04 + i * 0.076, i % 2 ? 0.145 : 0.075]);
  const o1 = [stroke(zig, { col: C.blue, w: 0.014, noSym: true }), line([0.03, 0.2], [0.97, 0.2], { col: C.blue, w: 0.012, noSym: true }), line([0.03, 0.235], [0.97, 0.235], { col: C.ochre, w: 0.01, noSym: true })];
  o1.push(line([0.03, 0.41], [0.97, 0.41], { col: C.blue, w: 0.012, noSym: true }));
  o1.push(curve([[0.335, 0.95], [0.335, 0.62], [0.38, 0.5], [0.5, 0.45]], { col: C.blue, w: 0.018 }));
  o1.push(curve([[0.285, 0.95], [0.285, 0.6], [0.34, 0.45], [0.5, 0.385]], { col: C.ochre, w: 0.014 }));
  o1.push(polygon([[0.1, 0.56], [0.22, 0.56], [0.22, 0.7], [0.1, 0.7]], { col: C.blue, w: 0.012 }), curve([[0.1, 0.56], [0.16, 0.5], [0.22, 0.56]], { col: C.blue, w: 0.012 }));
  const dia = [[0.42, 0], [0.26, 1], [0.1, 0]].map(([x, k]) => ({ x, col: k ? C.terra : C.turq }));
  const r2 = [smoothPoly([[0.335, 0.95], [0.335, 0.62], [0.38, 0.5], [0.5, 0.45], [0.62, 0.5], [0.665, 0.62], [0.665, 0.95]], { col: C.deep, label: 'door', noSym: true }), rect(0.105, 0.565, 0.215, 0.695, { col: C.deep, label: 'window' })];
  for (const d of dia) r2.push(poly([[d.x, 0.275], [d.x + 0.065, 0.325], [d.x, 0.375], [d.x - 0.065, 0.325]], { col: d.col, label: 'diamond' }));
  for (let i = 0; i < 12; i += 2) { const x = 0.04 + i * 0.076; if (x < 0.48) r2.push(poly([[x, 0.075], [x + 0.076, 0.145], [x + 0.152, 0.075]], { col: C.ochre, label: 'triangle' })); }
  const o3 = [];
  for (let k = 0; k < 6; k++) o3.push(dot(0.06 + k * 0.08, 0.218, { col: C.terra, w: 0.016 }));
  for (let k = 0; k < 7; k++) o3.push(curve([[0.375 + k * 0.0, 0.93 - k * 0.0], [0.375, 0.93]], { col: C.black, w: 0 }));
  o3.length = 6;
  for (const x of [0.4, 0.45]) o3.push(line([x, 0.55], [x, 0.93], { col: C.blue, w: 0.006 }));
  o3.push(dot(0.46, 0.75, { col: C.ochre, w: 0.03, noSym: false }));
  o3.push(line([0.1, 0.63], [0.22, 0.63], { col: C.blue, w: 0.008 }), line([0.16, 0.565], [0.16, 0.695], { col: C.blue, w: 0.008 }));
  for (let k = 0; k < 5; k++) o3.push(dot(0.06 + k * 0.095 + j, 0.86, { col: C.green, w: 0.02 }));
  return {
    id: 'nubian', name: 'Nubian house front', ar: 1, ground: '#eadbbd', surface: { kind: 'wall', shape: 'rect' }, symmetry: { kind: 'mirror-x' },
    palette: [{ name: 'cobalt', color: '#2a4a9a' }, { name: 'turquoise', color: '#2aa8a0' }, { name: 'ochre', color: '#d9a030' }, { name: 'deep blue', color: '#1d2f6a' }, { name: 'terracotta', color: '#c04a2a' }, { name: 'green', color: '#2f7a4a' }, { name: 'black', color: '#1e1b1a' }],
    layers: [
      { name: 'Draw the doorway and the friezes', tool: 'brush', colors: [0, 2], strokes: o1, regions: [], hint: 'The zigzag under the roof, the double bands, the arch of the door and the windows' },
      { name: 'Flood the door and the diamonds', tool: 'brush', colors: [3, 1, 4, 2], strokes: [], regions: r2, hint: 'Deep blue for the door and windows, turquoise and terracotta diamonds, ochre triangles' },
      { name: 'Add the dots and planks', tool: 'fine', colors: [4, 0, 2, 5], strokes: o3, regions: [], hint: 'Dots on the band, the planks of the door, a ring for the handle' },
    ],
  };
}

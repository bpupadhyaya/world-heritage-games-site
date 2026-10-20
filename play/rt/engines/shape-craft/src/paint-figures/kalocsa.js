// Kalocsa floral painting (Hungary), 1.9.0: a wreath on a cream panel, mirrored left to right: a big red rose made of rings of fat petals in the
// middle, three smaller roses and three clusters of violet and blue bells round it, green leaves and a stem ring first, black dots last.
// Petals, leaves and bells are flooded shapes (fat, round, like the painters' quick presses); the stem ring, dots and veins are lines.
import { curve, ring, leafRegion, blob, polar, jit, TAU } from '../paint-shapes.js';

const rose = (regs, cx, cy, n, R, r, a0, cols, wid) => {
  for (let k = 0; k < n; k++) { const a = a0 + (k / n) * TAU; regs.push(leafRegion(polar(cx, cy, r, a), polar(cx, cy, R, a), wid, 0.12, { col: cols[0], label: 'petal', noSym: true })); }
  const m = Math.max(3, n - 3);
  for (let k = 0; k < m; k++) { const a = a0 + ((k + 0.5) / m) * TAU; regs.push(leafRegion(polar(cx, cy, R * 0.12, a), polar(cx, cy, r * 0.94, a), wid * 0.6, 0.12, { col: cols[1], label: 'inner petal', noSym: true })); }
};
export function kalocsa(rng, v = 1) {
  const j = jit(rng, v, 0.03), stems = [], leaves = [], roses = [], bells = [], fine = [], C = [0.5, 0.5], PI = Math.PI;
  stems.push(ring(C[0], C[1], 0.355, 0.355, { col: 5, w: 0.014, noSym: true }));
  for (let k = 0; k < 6; k++) {
    const a = -PI / 2 + PI / 6 + (k / 6) * TAU + j * 0.2;
    leaves.push(leafRegion(polar(...C, 0.375, a - 0.03), polar(...C, 0.47, a - 0.16), 0.075, 0.18, { col: 4, label: 'leaf', noSym: true }));
    leaves.push(leafRegion(polar(...C, 0.335, a + 0.03), polar(...C, 0.24, a + 0.22), 0.06, -0.18, { col: 5, label: 'inner leaf', noSym: true }));
  }
  rose(roses, ...C, 8, 0.2, 0.1, PI / 8, [0, 1], 0.115);
  for (let k = 0; k < 3; k++) { const a = -PI / 2 + (k * 2 * PI) / 3, p = polar(...C, 0.355, a); rose(roses, p[0], p[1], 5, 0.1, 0.03, a, [k === 0 ? 0 : 1, k === 0 ? 1 : 0], 0.075); }
  for (let k = 0; k < 3; k++) {
    const a = -PI / 6 + (k * 2 * PI) / 3, p = polar(...C, 0.355, a);
    for (let q = -1; q <= 1; q++) bells.push(leafRegion(polar(p[0], p[1], 0.012, a + q * 0.5 + PI), polar(p[0], p[1], 0.085, a + PI + q * 0.5 + (q ? 0 : 0)), 0.045, 0.1 * q, { col: k === 1 ? 2 : (q === 0 ? 2 : 3), label: 'bell', noSym: true }));
  }
  for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU + 0.26, p = polar(...C, 0.49, a); fine.push(curve([p, [p[0] + 0.004, p[1] + 0.003]], { col: 6, w: 0.016, noSym: true })); }
  for (let k = 0; k < 8; k++) fine.push(curve([polar(...C, 0.03, (k / 8) * TAU), polar(...C, 0.09, (k / 8) * TAU)], { col: 6, w: 0.006, noSym: true }));
  roses.push(blob(...C, 0.026, 0.026, { col: 6, label: 'heart', noSym: true }));
  return {
    id: 'kalocsa', name: 'Kalocsa wreath', ar: 1, ground: '#f4ecdc', surface: { kind: 'panel', shape: 'rect' }, symmetry: { kind: 'mirror-x' },
    palette: [{ name: 'red', color: '#c4202c' }, { name: 'rose pink', color: '#e46380' }, { name: 'violet', color: '#6a3c9c' }, { name: 'blue', color: '#2a5cae' }, { name: 'leaf green', color: '#2f8a3a' }, { name: 'deep green', color: '#1d5a38' }, { name: 'black', color: '#1e1b1a' }],
    layers: [
      { name: 'Paint the leaves and the stem ring', tool: 'brush', colors: [4, 5], strokes: stems, regions: leaves, hint: 'Draw the green ring, then press each leaf in its green' },
      { name: 'Paint the roses', tool: 'brush', colors: [0, 1, 6], strokes: [], regions: roses, hint: 'Red outer petals, rose pink inside, a black heart' },
      { name: 'Paint the bells', tool: 'brush', colors: [2, 3], strokes: [], regions: bells, hint: 'Violet in the middle, blue at the sides' },
      { name: 'Add the dots and veins', tool: 'fine', colors: [6], strokes: fine, regions: [], hint: 'A ring of black dots round the wreath and the veins of the big rose' },
    ],
  };
}

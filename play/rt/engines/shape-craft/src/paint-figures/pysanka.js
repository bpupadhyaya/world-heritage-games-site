// Pysanka (Ukraine, wax-resist egg): wax white lines, dye yellow; wax again, dye red; wax once more, dye dark. Mirror-symmetric about the long axis.
import { curve, polygon, ring, line, polar, jit, TAU } from '../paint-shapes.js';

const hw = (y) => 0.36 * Math.sqrt(Math.max(0, 1 - ((y - 0.52) / 0.45) ** 2)) * (1 + 0.15 * (y - 0.5));
export const eggOutline = () => { const L = [], R = []; for (let i = 0; i <= 40; i++) { const y = 0.07 + (0.9 * i) / 40, w = hw(y); L.push([0.39 - w, y]); R.push([0.39 + w, y]); } return [...L, ...R.reverse()]; };

export function pysanka(rng, v = 1) {
  const j = jit(rng, v, 0.01), cx = 0.39;
  const belt = (y) => curve([[cx - hw(y) + 0.004, y + 0.012], [cx - hw(y) * 0.55, y + 0.026], [cx - 0.03, y + 0.03], [cx, y + 0.03]], { col: 0, w: 0.011 });
  const star = (r0, r1, n, a0) => polygon(Array.from({ length: n * 2 }, (_, i) => polar(cx, 0.5, i % 2 ? r0 : r1, a0 + (i * Math.PI) / n)), { col: 0, w: 0.01, noSym: true });
  const tri = (x, y, s) => polygon([[x - s, y + s], [x, y - s], [x + s, y + s]], { col: 0, w: 0.009 });
  const L1 = [belt(0.37 + j), belt(0.6 - j), star(0.05, 0.12, 8, -Math.PI / 2), curve([[cx, 0.1], [cx, 0.3]], { col: 0, w: 0.01, noSym: true }), curve([[cx, 0.7], [cx, 0.9]], { col: 0, w: 0.01, noSym: true })];
  [0.16, 0.26].forEach((x) => { L1.push(tri(x, 0.3, 0.022)); L1.push(tri(x, 0.8, 0.022)); });
  const L2 = [ring(cx, 0.5, 0.17, 0.17, { col: 0, w: 0.009, noSym: true }), star(0.03, 0.068, 8, -Math.PI / 2 + Math.PI / 8)];
  [0.14, 0.23, 0.31].forEach((x) => L2.push(curve([[x, 0.4], [x - 0.004, 0.43], [x, 0.46]], { col: 0, w: 0.009 })));
  [0.16, 0.26].forEach((x) => { L2.push(curve([[x, 0.2], [x + 0.01, 0.15], [x + 0.02, 0.2]], { col: 0, w: 0.009 })); L2.push(curve([[x, 0.88], [x + 0.01, 0.83], [x + 0.02, 0.88]], { col: 0, w: 0.009 })); });
  const L3 = [ring(cx, 0.5, 0.2, 0.2, { col: 0, w: 0.008, noSym: true })];
  for (let k = 0; k < 8; k++) L3.push(curve([polar(cx, 0.5, 0.125, k * (TAU / 8) + 0.39), polar(cx, 0.5, 0.125, k * (TAU / 8) + 0.395)], { col: 0, w: 0.014, noSym: true }));
  [0.14, 0.23, 0.31].forEach((x) => { L3.push(curve([[x, 0.12], [x, 0.125]], { col: 0, w: 0.014 })); L3.push(curve([[x, 0.92], [x, 0.925]], { col: 0, w: 0.014 })); });
  return {
    id: 'pysanka', name: 'Pysanka egg', ar: 0.78, ground: '#f5efe2', surface: { kind: 'egg', shape: eggOutline() }, symmetry: { kind: 'mirror-x' },
    palette: [{ name: 'wax', color: '#f3e2a8' }],
    layers: [
      { name: 'Wax the first lines', tool: 'stylus', colors: [0], strokes: L1, regions: [], resist: { dye: '#f1c232', label: 'Dip in yellow' }, hint: 'White stays white wherever the wax lands' },
      { name: 'Wax the next lines, dip in red', tool: 'stylus', colors: [0], strokes: L2, regions: [], resist: { dye: '#d3401a', label: 'Dip in red' }, hint: 'These lines will stay yellow' },
      { name: 'Last wax, then the dark dye', tool: 'stylus', colors: [0], strokes: L3, regions: [], resist: { dye: '#2b1710', label: 'Dip in the dark dye' }, hint: 'These dots and rings will stay red' },
    ],
  };
}

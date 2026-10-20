// Batik wax resist (Indonesia and beyond): kawung circles in wax, dye the cloth blue, wax the dots, dye it deeper. Four-fold symmetry.
import { ring, polygon, curve, comma, polar, jit } from '../paint-shapes.js';

export function batik(rng, v = 1) {
  const j = jit(rng, v, 0.01);
  const cell = [0.27, 0.27], petals = [], dots = [];
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2, c = polar(...cell, 0.075, a);
    petals.push(ring(...c, 0.082, 0.036, { col: 0, w: 0.01 }, a));
    dots.push(curve([polar(...cell, 0.08, a), polar(...cell, 0.0805, a)], { col: 0, w: 0.016 }));
    dots.push(curve([polar(...cell, 0.16 + j, a + Math.PI / 4), polar(...cell, 0.1605 + j, a + Math.PI / 4)], { col: 0, w: 0.012 }));
  }
  petals.push(ring(...cell, 0.016, 0.016, { col: 0, w: 0.01 }));
  const frames = [polygon([[0.05, 0.05], [0.95, 0.05], [0.95, 0.95], [0.05, 0.95]], { col: 0, w: 0.011, noSym: true }), polygon([[0.085, 0.085], [0.915, 0.085], [0.915, 0.915], [0.085, 0.915]], { col: 0, w: 0.007, noSym: true })];
  const second = [
    ...dots, ring(0.5, 0.5, 0.045, 0.045, { col: 0, w: 0.01, noSym: true }), curve([[0.5, 0.5], [0.5005, 0.5]], { col: 0, w: 0.02, noSym: true }),
    ring(0.125, 0.5, 0.02, 0.02, { col: 0, w: 0.009 }, 0), comma([0.5, 0.15], [0.5, 0.09], 0, { col: 0, w: 0.01 }),
  ];
  return {
    id: 'batik', name: 'Batik kawung cloth', ar: 1, ground: '#efe6cf', surface: { kind: 'cloth', shape: 'rect' }, symmetry: { kind: 'rot', n: 4 },
    palette: [{ name: 'wax', color: '#f3e2a8' }],
    layers: [
      { name: 'Wax the kawung circles', tool: 'wax', colors: [0], strokes: [...frames, ...petals], regions: [], resist: { dye: '#2f63b0', label: 'Dip in the blue dye' }, hint: 'Wax keeps the cloth pale where it lands' },
      { name: 'Wax the dots, then the deep dye', tool: 'wax', colors: [0], strokes: second, regions: [], resist: { dye: '#12285a', label: 'Dip in the deep dye' }, hint: 'Dots inside the petals and between the circles' },
    ],
  };
}

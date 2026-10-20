// Kalamkari (India), 1.8.0: pen work and mordant dyes on cream cotton. Three cloths chosen by the round's seed (or params.variant): a tree of life
// with perched birds, a peacock with a fanned tail, and a flowering vine; each framed by a leaf border band. Steps: (optional) wash the cloth with the
// myrobalan mordant, draw everything with the reed pen in flat black ink, then fill with the madder, mustard, indigo and green dyes.
import { curve, ring, leaf, leafRegion, blob, polar, TAU, jit, rect, polygon, pick } from '../paint-shapes.js';

const PALETTE = [{ name: 'iron-black ink', color: '#14100d', flat: true }, { name: 'madder red', color: '#a8322a' }, { name: 'mustard', color: '#d9a21e' }, { name: 'indigo', color: '#27468f' }, { name: 'green', color: '#3f7a46' }, { name: 'myrobalan wash', color: '#ead29a' }];

export function kalamkari(rng, v = 1, opts = {}) {
  const j = jit(rng, v, 0.012), key = ['tree', 'peacock', 'vine'].includes(opts.variant) ? opts.variant : pick(rng, ['tree', 'peacock', 'vine']);
  const ink = [], fills = [];
  const P = (o) => ({ col: 0, w: 0.0075, ...o });
  const flower = (cx, cy, r0, r1, n, a0, noSym, petalCols, hubCol, pw) => {
    ink.push(ring(cx, cy, r0, r0, P({ noSym })));
    fills.push(blob(cx, cy, r0, r0, { col: hubCol, label: 'flower centre', noSym }, 0, 24));
    for (let k = 0; k < n; k++) {
      const a = a0 + (k / n) * TAU, p = polar(cx, cy, r0 + 0.004, a), q = polar(cx, cy, r1, a);
      ink.push(leaf(p, q, pw, 0, P({ noSym }))); fills.push(leafRegion(p, q, pw, 0, { col: petalCols[k % petalCols.length], label: 'petal', noSym }));
    }
  };
  const lf = (p, q, wid, bend, col, noSym = false) => { ink.push(leaf(p, q, wid, bend, P({ noSym }))); fills.push(leafRegion(p, q, wid, bend, { col, label: 'leaf', noSym })); };
  // the border band: two ruled lines with a leaf pointing in from the outer line, all round (noSym: the whole band is drawn here)
  const border = () => {
    ink.push(polygon([[0.035, 0.035], [0.965, 0.035], [0.965, 0.965], [0.035, 0.965]], P({ w: 0.008, noSym: true })), polygon([[0.105, 0.105], [0.895, 0.105], [0.895, 0.895], [0.105, 0.895]], P({ w: 0.007, noSym: true })));
    const side = (n, f) => { for (let k = 0; k < n; k++) { const t = 0.15 + (0.7 * (k + 0.5)) / n, [p, q] = f(t); lf(p, q, 0.04, 0, k % 2 ? 1 : 4, true); } };
    side(6, (t) => [[t, 0.045], [t, 0.095]]); side(6, (t) => [[t, 0.955], [t, 0.905]]); side(5, (t) => [[0.045, t], [0.095, t]]); side(5, (t) => [[0.955, t], [0.905, t]]);
  };
  border();
  const bInk = ink.splice(0), bFill = fills.splice(0);
  if (key === 'tree') {
    ink.push(curve([[0.5, 0.88], [0.49, 0.76], [0.51, 0.62], [0.5, 0.42]], P({ w: 0.011, noSym: true })), curve([[0.34, 0.87], [0.5, 0.84], [0.66, 0.87]], P({ noSym: true })));
    ink.push(curve([[0.5, 0.72], [0.42, 0.68], [0.33, 0.7], [0.25, 0.65]], P({ w: 0.009 })), curve([[0.5, 0.56], [0.42, 0.52], [0.35, 0.45], [0.31, 0.36]], P({ w: 0.009 })), curve([[0.5, 0.44], [0.44, 0.36], [0.41, 0.26]], P({ w: 0.008 })));
    flower(0.5, 0.29, 0.032, 0.115, 6, Math.PI / 6 + 0.1 * j, true, [1, 2], 3, 0.065);
    flower(0.27, 0.3, 0.024, 0.085, 5, -0.5, false, [2, 1], 3, 0.045);
    flower(0.22, 0.64, 0.022, 0.075, 5, 0.3, false, [1, 2], 3, 0.04);
    // a bird on the lower branch: body, head, tail feathers
    ink.push(leaf([0.3, 0.6], [0.4, 0.64], 0.07, 0, P())); fills.push(leafRegion([0.3, 0.6], [0.4, 0.64], 0.07, 0, { col: 3, label: 'bird' }));
    ink.push(ring(0.285, 0.585, 0.02, 0.02, P())); fills.push(blob(0.285, 0.585, 0.02, 0.02, { col: 2, label: 'bird head' }, 0, 20));
    lf([0.39, 0.635], [0.46, 0.7], 0.045, 0.1, 1); lf([0.38, 0.63], [0.44, 0.75], 0.04, -0.1, 4);
    for (const [p, q, b] of [[[0.46, 0.7], [0.36, 0.62], 0.1], [[0.38, 0.5], [0.28, 0.5], -0.1], [[0.455, 0.5], [0.4, 0.44], 0.1], [[0.43, 0.4], [0.35, 0.4], -0.1], [[0.46, 0.82], [0.36, 0.8], -0.1], [[0.4, 0.2], [0.34, 0.18], 0.1]]) lf(p, q, 0.05, b, 4);
  } else if (key === 'peacock') {
    // a fan of eleven eyed feathers (the middle one on the axis), the body, neck, crest and head below
    const C = [0.5, 0.62];
    for (let k = 0; k <= 5; k++) {
      const a = -Math.PI / 2 - k * 0.27 + j * 0.2, p = polar(...C, 0.15, a), q = polar(...C, 0.42 - k * 0.012, a), e = polar(...C, 0.325 - k * 0.01, a), noSym = k === 0;
      ink.push(leaf(p, q, 0.095, 0, P({ noSym }))); fills.push(leafRegion(p, q, 0.095, 0, { col: k % 2 ? 4 : 3, label: 'feather', noSym }));
      ink.push(ring(...e, 0.034, 0.034, P({ noSym }))); fills.push(blob(...e, 0.034, 0.034, { col: k % 2 ? 1 : 2, label: 'eye', noSym }, 0, 24));
      ink.push(ring(...e, 0.013, 0.013, P({ noSym }))); fills.push(blob(...e, 0.013, 0.013, { col: 3, label: 'pupil', noSym }, 0, 16));
    }
    ink.push(leaf([0.5, 0.85], [0.5, 0.58], 0.17, 0, P({ w: 0.009, noSym: true }))); fills.push(leafRegion([0.5, 0.85], [0.5, 0.58], 0.17, 0, { col: 3, label: 'body', noSym: true }));
    ink.push(leaf([0.5, 0.64], [0.5, 0.46], 0.07, 0, P({ noSym: true }))); fills.push(leafRegion([0.5, 0.64], [0.5, 0.46], 0.07, 0, { col: 4, label: 'neck', noSym: true }));
    ink.push(ring(0.5, 0.435, 0.03, 0.03, P({ noSym: true }))); fills.push(blob(0.5, 0.435, 0.03, 0.03, { col: 3, label: 'head', noSym: true }, 0, 24));
    for (const s of [-1, 1]) ink.push(curve([[0.5 + s * 0.012, 0.408], [0.5 + s * 0.03, 0.375], [0.5 + s * 0.045, 0.37]], P({ w: 0.006, noSym: true })));
    ink.push(curve([[0.5, 0.45], [0.5, 0.47]], P({ w: 0.006, noSym: true })));
    for (const [p, q, b] of [[[0.45, 0.82], [0.28, 0.86], 0.15], [[0.46, 0.8], [0.3, 0.7], -0.12], [[0.4, 0.87], [0.22, 0.8], 0.1]]) lf(p, q, 0.05, b, 4);
    ink.push(curve([[0.4, 0.88], [0.5, 0.9], [0.6, 0.88]].map((p) => [p[0], p[1] - 0.02]), P({ noSym: true })));
  } else {
    ink.push(curve([[0.5, 0.88], [0.49, 0.78], [0.51, 0.64], [0.5, 0.5]], P({ w: 0.011, noSym: true })));
    flower(0.5, 0.34, 0.04, 0.15, 6, Math.PI / 6 + 0.1 * j, true, [2, 1], 3, 0.07);
    ink.push(curve([[0.5, 0.78], [0.42, 0.76], [0.33, 0.78], [0.25, 0.72], [0.22, 0.66]], P({ w: 0.009 })));
    flower(0.22, 0.58, 0.028, 0.1, 5, -0.5, false, [1, 2], 3, 0.05);
    ink.push(curve([[0.5, 0.62], [0.42, 0.57], [0.36, 0.5], [0.355, 0.43]], P({ w: 0.009 })));
    flower(0.35, 0.37, 0.024, 0.085, 4, 0.2, false, [2, 1], 3, 0.045);
    for (const [p, q, b] of [[[0.46, 0.72], [0.34, 0.66], 0.1], [[0.45, 0.86], [0.3, 0.84], -0.1], [[0.43, 0.6], [0.3, 0.55], 0.1], [[0.47, 0.84], [0.34, 0.8], -0.1]]) lf(p, q, 0.055, b, 4);
  }
  const layers = [
    { name: 'Rule the border with the reed pen', tool: 'reed', colors: [0], strokes: bInk, regions: [], hint: 'Two ruled lines first, then the leaves that run round between them' },
    { name: 'Draw the picture with the reed pen', tool: 'reed', colors: [0], strokes: ink, regions: [], hint: 'Stem first, then branches, flowers and leaves; the picture mirrors left and right' },
    { name: 'Fill with the dyes', tool: 'brush', colors: [1, 2, 3, 4], strokes: [], regions: [...fills, ...bFill], hint: 'Red and mustard petals, indigo centres, green leaves and border leaves' },
  ];
  if (opts.wash) layers.unshift({ name: 'Wash the cloth with the mordant', tool: 'brush', colors: [5], strokes: [], regions: [{ ...rect(0.0, 0.0, 1, 1, { col: 5, label: 'cloth', noSym: true }) }], hint: 'Tap the cloth to soak it in the pale myrobalan wash before drawing' });
  return { id: 'kalamkari', variant: key, fill: 'dye', name: key === 'tree' ? 'Kalamkari tree of life' : key === 'peacock' ? 'Kalamkari peacock' : 'Kalamkari vine', ar: 1, ground: '#f0e4c6', surface: { kind: 'cloth', shape: 'rect' }, symmetry: { kind: 'mirror-x' }, palette: PALETTE, layers };
}

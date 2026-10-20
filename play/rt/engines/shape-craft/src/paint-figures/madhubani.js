// Madhubani / Mithila (India), 1.8.0: double-line ink drawing, hatched and dotted bands, then natural dyes, inside a two-line leaf-and-flower frame.
// Two panels chosen by the round's seed (or params.variant): a pair of fish and a lotus. Mirror-symmetric about the middle. Steps: 1 ink outlines
// (every outline is two parallel lines), 2 hatch and dot bands, 3 colour.
import { xform, curve, ring, leaf, leafRegion, blob, smoothPoly, polygon, dbl, dblLoop, hatch, dotsIn, jit, pick, polar, TAU, stroke } from '../paint-shapes.js';
import { catmull } from '../paint-stroke.js';

const PALETTE = [{ name: 'ink', color: '#16110d', flat: true }, { name: 'madder red', color: '#b83a2a' }, { name: 'turmeric', color: '#e6a824' }, { name: 'leaf green', color: '#3d8a4a' }, { name: 'indigo', color: '#2b4a8f' }];
const INK = { col: 0, w: 0.007 };
const SIDE = [[0, 0.115, 0.13], [0, 0.03, 0.045]];

// the frame: two ruled double lines with a chain of leaves and small flowers running between them (the whole frame is drawn here, noSym)
function frame(ink, fills) {
  const rect = (a) => [[a, a], [1 - a, a], [1 - a, 1 - a], [a, 1 - a]];
  for (const a of [0.03, 0.045, 0.115, 0.13]) ink.push(polygon(rect(a), { ...INK, w: a === 0.03 || a === 0.13 ? 0.007 : 0.006, noSym: true }));
  const c = 0.0725 + 0.0075;
  const run = (n, f) => { for (let k = 0; k < n; k++) { const t = 0.16 + (0.68 * (k + 0.5)) / n, h = 0.034, [p, q] = f(t - h, t + h), [fx, fy] = f(t + 0.034 + 0.0, t + 0.034).slice(0, 1)[0]; ink.push(leaf(p, q, 0.032, 0, { ...INK, noSym: true })); fills.push(leafRegion(p, q, 0.032, 0, { col: 3, label: 'frame leaf', noSym: true })); void fx; void fy; } };
  const flowersAt = (n, f) => { for (let k = 0; k < n; k++) { const t = 0.16 + (0.68 * (k + 1)) / n; if (k === n - 1) continue; const [x, y] = f(t); ink.push(ring(x, y, 0.011, 0.011, { ...INK, noSym: true })); fills.push(blob(x, y, 0.011, 0.011, { col: k % 2 ? 1 : 2, label: 'frame flower', noSym: true }, 0, 16)); } };
  const sideH = (y) => (a, b) => [[a, y], [b, y]], sideV = (x) => (a, b) => [[x, a], [x, b]];
  run(6, sideH(c)); run(6, sideH(1 - c)); run(6, sideV(c)); run(6, sideV(1 - c));
  flowersAt(6, (t) => [t, c]); flowersAt(6, (t) => [t, 1 - c]); flowersAt(6, (t) => [c, t]); flowersAt(6, (t) => [1 - c, t]);
}

function fishPair(rng, v) {
  const j = jit(rng, v, 0.01), ink = [], hat = [], fills = [], fInk = [], fFill = [];
  // one fish in the upper-left quarter, tail left and nose to the middle; the symmetry makes the other three, facing each other in pairs
  const body = [[0.485, 0.31], [0.44, 0.245], [0.36, 0.215 + j], [0.28, 0.235], [0.225, 0.28], [0.205, 0.31], [0.225, 0.345], [0.28, 0.385], [0.36, 0.405 - j], [0.44, 0.375]];
  const tail = [[0.22, 0.31], [0.16, 0.21], [0.13, 0.25], [0.15, 0.31], [0.13, 0.37], [0.16, 0.415]];
  const dors = [[0.29, 0.232], [0.33, 0.165], [0.4, 0.2], [0.425, 0.245]];
  const fin2 = [[0.33, 0.4], [0.35, 0.46], [0.41, 0.395]];
  ink.push(...dblLoop(body, 0.02, INK), ...dblLoop(tail, 0.016, INK), ...dblLoop(dors, 0.014, INK), ...dblLoop(fin2, 0.014, INK));
  ink.push(ring(0.43, 0.29, 0.02, 0.02, INK), ring(0.43, 0.29, 0.007, 0.007, { ...INK, w: 0.009 }), curve([[0.395, 0.25], [0.385, 0.31], [0.395, 0.37]], INK), curve([[0.485, 0.31], [0.455, 0.325], [0.44, 0.325]], INK));
  const P = (c) => catmull(c, true, 8);
  hat.push(...hatch([[0.24, 0.27], [0.375, 0.24], [0.375, 0.375], [0.24, 0.35]], 0.05, 0.9, { col: 0, w: 0.006 }, 0.05));
  hat.push(...dotsIn([[0.26, 0.255], [0.37, 0.235], [0.37, 0.27], [0.26, 0.285]], 0.036, { col: 0, w: 0.011 }, 0.006), ...dotsIn([[0.26, 0.335], [0.37, 0.35], [0.37, 0.385], [0.28, 0.375]], 0.036, { col: 0, w: 0.011 }, 0.006));
  hat.push(...hatch(P(tail), 0.045, 0.3, { col: 0, w: 0.006 }, 0.04), ...hatch(P(dors), 0.045, -0.4, { col: 0, w: 0.006 }, 0.035), ...hatch(P(fin2), 0.04, 0.6, { col: 0, w: 0.006 }, 0.03));
  fills.push(smoothPoly(body, { col: 1, label: 'fish body' }), smoothPoly(tail, { col: 2, label: 'tail' }), smoothPoly(dors, { col: 3, label: 'back fin' }), smoothPoly(fin2, { col: 4, label: 'belly fin' }));
  for (const o of [...ink, ...hat, ...fills]) o.pts = xform(o.pts, 0.31, 0.31, 0.86, 0, 0.045);   // a little smaller and clear of the frame
  frame(fInk, fFill);
  return { name: 'Madhubani fish', sym: 'mirror-xy', ink, hat, fills, fInk, fFill, hint: ['Two parallel lines for every outline: the fish, the fins and the eye', 'Hatch the bands with fine strokes, then add the rows of dots', 'Body red, tail turmeric, back fin green, belly fin indigo, frame leaves green'] };
}

function lotus(rng, v) {
  const j = jit(rng, v, 0.06), ink = [], hat = [], fills = [], fInk = [], fFill = [], C = [0.5, 0.52];
  const n = 10;
  for (let k = 0; k <= n / 2; k++) {
    const a = Math.PI / 2 + k * (TAU / n) + (k && k < n / 2 ? j * 0.1 : 0), noSym = k === 0 || k === n / 2;
    const p = polar(...C, 0.1, a), q = polar(...C, 0.36 - (k === 0 ? 0.04 : 0), a);
    for (const [r0, r1, w, col, tag] of [[0.1, 0.36, 0.115, 1, 'outer petal'], [0.08, 0.235, 0.09, 2, 'inner petal']]) {
      const pp = polar(...C, r0, a), qq = polar(...C, r1 - (k === 0 ? 0.03 : 0), a), P0 = k === 0 && r1 > 0.3 ? polar(...C, r0, a) : pp;
      ink.push(...dblLoop(leafRegion(P0, qq, w, 0, {}).pts, 0.016, { ...INK, noSym }));
      fills.push(leafRegion(pp, qq, w, 0, { col, label: tag, noSym }));
      if (r1 > 0.3) hat.push(...hatch(leafRegion(pp, qq, w * 0.85, 0, {}).pts, 0.05, a + 1.2, { col: 0, w: 0.006, noSym }, 0.04));
    }
    void p; void q;
  }
  ink.push(ring(...C, 0.05, 0.05, { ...INK, noSym: true }), ring(...C, 0.036, 0.036, { ...INK, noSym: true }));
  fills.push(blob(...C, 0.036, 0.036, { col: 3, label: 'seed pod', noSym: true }, 0, 24));
  hat.push(...dotsIn(blobPts(C, 0.032), 0.028, { col: 0, w: 0.01, noSym: true }, 0.008));
  // two leaves and two buds low down (the left ones; the mirror makes the others)
  ink.push(...dblLoop(leafRegion([0.34, 0.86], [0.2, 0.78], 0.09, 0.1, {}).pts, 0.014, INK));
  fills.push(leafRegion([0.34, 0.86], [0.2, 0.78], 0.09, 0.1, { col: 3, label: 'lotus leaf' }));
  ink.push(...dblLoop(leafRegion([0.32, 0.22], [0.2, 0.3], 0.07, -0.1, {}).pts, 0.012, INK));
  fills.push(leafRegion([0.32, 0.22], [0.2, 0.3], 0.07, -0.1, { col: 3, label: 'lotus leaf' }));
  ink.push(curve([[0.5, 0.88], [0.5, 0.78]], { ...INK, noSym: true }));
  frame(fInk, fFill);
  return { name: 'Madhubani lotus', sym: 'mirror-x', ink, hat, fills, fInk, fFill, hint: ['Two parallel lines for every petal, then the seed pod and the leaves', 'Hatch the outer petals with fine strokes, dot the seed pod', 'Outer petals red, inner petals turmeric, the pod and leaves green'] };
}
const blobPts = (c, r) => Array.from({ length: 24 }, (_, i) => [c[0] + Math.cos((i / 24) * TAU) * r, c[1] + Math.sin((i / 24) * TAU) * r]);

const VARIANTS = { fish: fishPair, lotus };
export function madhubani(rng, v = 1, opts = {}) {
  const key = VARIANTS[opts.variant] ? opts.variant : pick(rng, ['fish', 'lotus']), d = VARIANTS[key](rng, v);
  return {
    id: 'madhubani', variant: key, fill: 'dye', name: d.name, ar: 1, ground: '#efe0bd', surface: { kind: 'paper', shape: 'rect' }, symmetry: { kind: d.sym }, assistDefault: true, palette: PALETTE,
    layers: [
      { name: 'Draw the two-line frame', tool: 'reed', colors: [0], strokes: d.fInk, regions: [], hint: 'Two ruled double lines, then the chain of leaves and small flowers between them' },
      { name: 'Draw the double-line outlines', tool: 'reed', colors: [0], strokes: d.ink, regions: [], hint: d.hint[0] },
      { name: 'Hatch and dot the bands', tool: 'pen', colors: [0], strokes: d.hat, regions: [], hint: d.hint[1] },
      { name: 'Colour with natural dyes', tool: 'brush', colors: [1, 2, 3, 4], strokes: [], regions: [...d.fills, ...d.fFill], hint: d.hint[2] },
    ],
  };
}
void stroke; void dbl; void SIDE;

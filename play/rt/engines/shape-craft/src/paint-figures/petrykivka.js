// Petrykivka (Ukraine), 1.8.0: three panels chosen by the round's seed (or params.variant): a bouquet, a firebird on a flowering branch, and a
// wreath. Each is built in three steps like the painters do it: leaves and stems first, then the flowers (or the bird), then the cat-whisker curls.
import { comma, curve, spiral, polar, jit, TAU, pick, blob, leafRegion, inPoly, xform } from '../paint-shapes.js';

const PALETTE = [{ name: 'cream', color: '#f6ead0' }, { name: 'sun yellow', color: '#f4b82a' }, { name: 'orange', color: '#e8602a' }, { name: 'leaf green', color: '#2f8a45' }, { name: 'deep green', color: '#1d5a38' }, { name: 'berry red', color: '#d3163e' }, { name: 'sky blue', color: '#2f6fc0' }];
const L1 = { tool: 'dab', hint: 'Press and flick the loaded brush: one dab for each leaf, the tip pointing the way it grows' };
const FINE = 'Draw each fine curl with the tip of the brush, slow and steady';

const flowerStrokes = (out, cx, cy, n, R, r, a0, cols, wid, centre) => {
  for (let k = 0; k < n; k++) { const a = a0 + (k / n) * TAU; out.push(comma(polar(cx, cy, R, a), polar(cx, cy, r, a + 0.12), 0.1, { col: cols[k % cols.length], w: wid })); }
  if (centre != null) out.push(curve([[cx, cy], [cx + 0.006, cy + 0.005]], { col: centre, w: wid * 0.85 }));
};
const berries = (out, bx, by, flip, col = 5) => [[0, 0], [0.058, 0.036], [0.022, 0.085], [-0.046, 0.064], [0.074, -0.03], [-0.02, -0.04]].forEach(([dx, dy]) => { const x = bx + dx * flip, y = by + dy; out.push(curve([[x, y], [x + 0.005, y + 0.005]], { col, w: 0.04 })); });

function bouquet(rng, v) {
  const n = 7 + Math.floor(rng.next() * 3), a0 = jit(rng, v, 0.4), cx = 0.5 + jit(rng, v, 0.02), cy = 0.36;
  const flip = rng.next() < 0.5 ? -1 : 1, leaves = [], flowers = [], fine = [];
  leaves.push(curve([[0.5, 0.97], [0.45, 0.83], [0.55, 0.66], [cx, cy + 0.11]], { col: 3, w: 0.026 }));
  const lv = [[[0.47, 0.76], [0.25, 0.68], 1], [[0.52, 0.66], [0.77, 0.6], -1], [[0.47, 0.86], [0.27, 0.88], 1], [[0.5, 0.8], [0.72, 0.82], -1], [[0.49, 0.58], [0.36, 0.52], 1], [[0.52, 0.55], [0.66, 0.5], -1]];
  for (const [p, q, s] of lv) { leaves.push(comma(p, q, 0.24 * s, { col: 3, w: 0.046 })); leaves.push(comma([p[0], p[1] + 0.015], [q[0], q[1] + 0.02], -0.2 * s, { col: 4, w: 0.036 })); }
  flowerStrokes(flowers, cx, cy, n, 0.215, 0.09, a0, [1, 2], 0.046, null);
  flowerStrokes(flowers, cx, cy, n, 0.13, 0.05, a0 + TAU / n / 2, [0, 1], 0.03, null);
  for (let k = 0; k < 3; k++) { const p = polar(cx, cy, 0.03, a0 + k * 2.1); flowers.push(curve([p, [p[0] + 0.006, p[1] + 0.006]], { col: 5, w: 0.04 })); }
  const fx2 = flip > 0 ? 0.2 : 0.8, fy2 = 0.62;
  leaves.push(curve([[0.49, 0.82], [flip > 0 ? 0.36 : 0.64, 0.76], [fx2 + 0.03 * flip, fy2 + 0.09]], { col: 4, w: 0.016 }));
  flowerStrokes(flowers, fx2, fy2, 5, 0.105, 0.035, jit(rng, v, 0.3), [0, 1], 0.042, 2);
  const bx = flip > 0 ? 0.78 : 0.22;
  berries(flowers, bx, 0.6, flip);
  leaves.push(curve([[0.5, 0.74], [bx - 0.02 * flip, 0.7], [bx, 0.62]], { col: 3, w: 0.012 }));
  for (let k = 0; k < 3; k++) fine.push(spiral(bx + (0.15 + k * 0.03) * -flip, 0.46 + k * 0.1, 0.0, 0.04, 1.35, k, { col: 0, w: 0.006 }, flip));
  for (let k = 0; k < n; k += 2) { const a = a0 + (k / n) * TAU; fine.push(spiral(...polar(cx, cy, 0.275, a), 0.0, 0.028, 1.3, a, { col: 0, w: 0.006 }, 1)); }
  for (let k = 0; k < n; k++) { const a = a0 + (k / n) * TAU + 0.02; fine.push(curve([polar(cx, cy, 0.19, a), polar(cx, cy, 0.115, a + 0.08)], { col: 0, w: 0.005 })); }
  return { name: 'Petrykivka flower', ground: '#7a1b17', parts: [leaves, flowers, fine], names: ['Dab the leaves and stems', 'Dab the flowers and berries', 'Add the cat-whisker curls'], hints: [L1.hint, 'Press and flick from the outer end of each petal in toward the centre', FINE] };
}

function bird(rng, v) {
  const flip = rng.next() < 0.5 ? -1 : 1, X = (x) => (flip > 0 ? x : 1 - x), P = (x, y) => [X(x), y], j = jit(rng, v, 0.02);
  const sb = (b) => b * flip, leaves = [], body = [], fine = [];
  leaves.push(curve([P(0.08, 0.88), P(0.3, 0.82 + j), P(0.56, 0.84), P(0.93, 0.74)], { col: 4, w: 0.016 }));
  for (const [x, y, qx, qy, b] of [[0.2, 0.84, 0.12, 0.74, 0.2], [0.42, 0.835, 0.38, 0.93, -0.2], [0.62, 0.835, 0.58, 0.95, -0.2], [0.78, 0.8, 0.86, 0.9, -0.2], [0.8, 0.78, 0.92, 0.68, 0.2]]) { leaves.push(comma(P(x, y), P(qx, qy), sb(b), { col: 3, w: 0.04 })); leaves.push(comma(P(x, y + 0.01), P(qx, qy + 0.012), sb(-b * 0.8), { col: 4, w: 0.026 })); }
  // flowering sprigs above and beside the bird
  leaves.push(curve([P(0.22, 0.84), P(0.2, 0.62), P(0.24, 0.42), P(0.22, 0.26)], { col: 3, w: 0.012 }));
  leaves.push(curve([P(0.72, 0.78), P(0.8, 0.62), P(0.84, 0.48), P(0.82, 0.4)], { col: 3, w: 0.012 }));
  leaves.push(comma(P(0.21, 0.54), P(0.1, 0.46), sb(-0.2), { col: 3, w: 0.036 })); leaves.push(comma(P(0.8, 0.58), P(0.92, 0.52), sb(0.2), { col: 3, w: 0.036 }));
  // the bird: a three-feather tail, a round body, folded wing, head, crest and beak
  body.push(comma(P(0.36, 0.52), P(0.05, 0.3), sb(-0.14), { col: 6, w: 0.05 }), comma(P(0.36, 0.55), P(0.05, 0.52), sb(-0.08), { col: 2, w: 0.052 }), comma(P(0.36, 0.58), P(0.09, 0.72), sb(0.16), { col: 1, w: 0.05 }));
  const rot = (flip > 0 ? -1 : 1) * 0.3;
  // regions in one step must be disjoint or nested (a partly overlapping pair would lower each other's coverage): the head touches the body, the wing sits inside it
  const bodyReg = blob(X(0.46), 0.54, 0.145, 0.095, { col: 6, label: 'body', volume: true }, rot);
  let wing = leafRegion(P(0.52, 0.52), P(0.4, 0.6), 0.075, sb(0.1), { col: 2, label: 'wing' });
  for (let k = 0; k < 8 && !wing.pts.every((p) => inPoly(bodyReg.pts, p[0], p[1])); k++) wing = { ...wing, pts: xform(wing.pts, ...wing.pts.reduce((c, p) => [c[0] + p[0] / wing.pts.length, c[1] + p[1] / wing.pts.length], [0, 0]), 0.88) };
  const bodyR = [bodyReg, wing, blob(X(0.665), 0.345, 0.06, 0.057, { col: 1, label: 'head' }, 0, 30)];
  body.push(comma(P(0.5, 0.5), P(0.35, 0.63), sb(0.16), { col: 2, w: 0.05 }), comma(P(0.5, 0.54), P(0.4, 0.69), sb(0.14), { col: 1, w: 0.046 }), comma(P(0.54, 0.53), P(0.47, 0.67), sb(0.12), { col: 0, w: 0.04 }));
  for (let k = 0; k < 3; k++) body.push(comma(P(0.62 + k * 0.015, 0.31), P(0.6 + k * 0.045, 0.2 - k * 0.01), sb(-0.1), { col: 5, w: 0.026 }));
  body.push(comma(P(0.69, 0.35), P(0.78, 0.4), sb(0.1), { col: 2, w: 0.03 }));
  const fl = (cx, cy, rr, n, cols, c) => { for (let k = 0; k < n; k++) { const a = j + (k / n) * TAU; body.push(comma(polar(cx, cy, rr, a), polar(cx, cy, rr * 0.35, a + 0.12), 0.1, { col: cols[k % cols.length], w: 0.04 })); } body.push(curve([[cx, cy], [cx + 0.005, cy + 0.004]], { col: c, w: 0.036 })); };
  fl(X(0.22), 0.2, 0.1, 6, [2, 1], 5); fl(X(0.82), 0.34, 0.085, 5, [0, 5], 1);
  berries(body, X(0.15), 0.9, -flip, 5);
  fine.push(curve([P(0.647, 0.335), P(0.649, 0.337)], { col: 4, w: 0.016 }));
  for (const k of [0, 1, 2]) fine.push(curve([P(0.3 - k * 0.07, 0.5 + (k - 1) * 0.07), P(0.22 - k * 0.07, 0.5 + (k - 1) * 0.1)], { col: 0, w: 0.007 }));
  for (let k = 0; k < 4; k++) fine.push(curve([P(0.43 + k * 0.03, 0.5), P(0.41 + k * 0.03, 0.57)], { col: 4, w: 0.007 }));
  fine.push(spiral(X(0.46), 0.17, 0, 0.04, 1.4, 1, { col: 0, w: 0.006 }, flip), spiral(X(0.7), 0.58, 0, 0.04, 1.4, 3, { col: 0, w: 0.006 }, -flip), spiral(X(0.1), 0.38, 0, 0.035, 1.3, 2, { col: 0, w: 0.006 }, flip));
  return { name: 'Petrykivka firebird', ground: pick(rng, ['#7a1b17', '#17110f']), parts: [leaves, [], body, fine], regions: [[], bodyR, [], []], names: ['Dab the branch and leaves', 'Fill the bird: body, wing and head', 'Dab the tail, crest, feathers and flowers', 'Add the curls and feather lines'], hints: [L1.hint, 'Tap each part of the bird to flood it with colour', 'Tail feathers, crest, beak, wing feathers, then the flowers and berries', FINE] };
}

function wreath(rng, v) {
  const a0 = jit(rng, v, 0.3), cx = 0.5, cy = 0.5, leaves = [], flowers = [], fine = [], n = 8;
  leaves.push(curve(Array.from({ length: 11 }, (_, k) => polar(cx, cy, 0.3, a0 + (k / 10) * TAU * 0.97)), { col: 3, w: 0.02 }));
  for (let k = 0; k < n; k++) { const a = a0 + (k / n) * TAU, p = polar(cx, cy, 0.29, a); leaves.push(comma(p, polar(cx, cy, 0.4, a + 0.22), 0.2, { col: k % 2 ? 3 : 4, w: 0.045 })); leaves.push(comma(p, polar(cx, cy, 0.22, a + 0.22), -0.2, { col: k % 2 ? 4 : 3, w: 0.04 })); }
  flowerStrokes(flowers, cx, cy, 8, 0.14, 0.04, a0, [1, 2], 0.05, 5);
  flowerStrokes(flowers, cx, cy, 6, 0.075, 0.02, a0 + 0.4, [0, 1], 0.03, null);
  for (let k = 0; k < 4; k++) { const a = a0 + 0.4 + (k / 4) * TAU, c = polar(cx, cy, 0.3, a); flowerStrokes(flowers, c[0], c[1], 4, 0.07, 0.025, a, k % 2 ? [0, 6] : [2, 1], 0.036, 5); }
  for (let k = 0; k < 3; k++) { const a = a0 + 1.35 + (k / 3) * TAU; berries(flowers, ...polar(cx, cy, 0.3, a).map((q, i) => (i ? q - 0.02 : q - 0.03)), 1, k % 2 ? 5 : 6); }
  for (let k = 0; k < 8; k++) { const a = a0 + 0.2 + (k / 8) * TAU; fine.push(spiral(...polar(cx, cy, 0.455, a), 0.0, 0.026, 1.3, a, { col: 0, w: 0.006 }, 1)); }
  for (let k = 0; k < 8; k++) { const a = a0 + (k / 8) * TAU; fine.push(curve([polar(cx, cy, 0.135, a), polar(cx, cy, 0.075, a + 0.1)], { col: 0, w: 0.005 })); }
  return { name: 'Petrykivka wreath', ground: pick(rng, ['#7a1b17', '#17110f']), parts: [leaves, flowers, fine], names: ['Dab the wreath of leaves', 'Dab the flowers and berries', 'Add the cat-whisker curls'], hints: [L1.hint, 'Press and flick from the outer end of each petal in toward the centre', FINE] };
}

const VARIANTS = { bouquet, bird, wreath };
export const PETRYKIVKA_VARIANTS = Object.keys(VARIANTS);
export function petrykivka(rng, v = 1, opts = {}) {
  const key = VARIANTS[opts.variant] ? opts.variant : PETRYKIVKA_VARIANTS[Math.floor(rng.next() * 3) % 3], d = VARIANTS[key](rng, v);
  return {
    id: 'petrykivka', variant: key, name: d.name, ar: 1, ground: d.ground, surface: { kind: 'panel', shape: 'rect' }, symmetry: { kind: 'none' }, palette: PALETTE, finish: 'grain',
    layers: d.parts.map((strokes, i) => {
      const fineLayer = i === d.parts.length - 1, cols = fineLayer ? [0, 4] : i === 0 ? [3, 4] : [0, 1, 2, 5, 6];
      return { name: d.names[i], tool: fineLayer ? 'fine' : strokes.length ? 'dab' : 'brush', colors: cols, strokes, regions: d.regions?.[i] ?? [], hint: d.hints[i] };
    }),
  };
}

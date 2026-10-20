// Kashmiri papier-mache (India): fine gold line work on a black lacquered plate, then colour fills. Four-fold symmetry.
import { curve, leaf, ring, leafRegion, blob, polar, TAU, polygon, roundPoly, pick } from '../paint-shapes.js';

function plate(rng, v) {
  const C = [0.5, 0.5], lines = [], fills = [];
  const petal = (a, r0, r1, wid, bend) => [polar(...C, r0, a), polar(...C, r1, a), wid, bend];
  for (const [a, col] of [[0, 1], [Math.PI / 4, 3]]) {
    const [p, q, w, b] = petal(a, 0.04, 0.17, 0.078, 0);
    lines.push(leaf(p, q, w, b, { col: 0, w: 0.008 })); fills.push(leafRegion(p, q, w, b, { col, label: col === 1 ? 'red petal' : 'cream petal' }));
  }
  const aL = Math.PI / 8;
  { const p = polar(...C, 0.215, aL), q = polar(...C, 0.375, aL); lines.push(leaf(p, q, 0.105, 0.12, { col: 0, w: 0.008 })); fills.push(leafRegion(p, q, 0.105, 0.12, { col: 2, label: 'leaf' })); }
  lines.push(curve([polar(...C, 0.18, 0), polar(...C, 0.235, 0.42), polar(...C, 0.31, 0.62), polar(...C, 0.36, 0.72)], { col: 0, w: 0.007 }));
  { const c = polar(...C, 0.315, (3 * Math.PI) / 8 + 0.2); lines.push(ring(...c, 0.022, 0.022, { col: 0, w: 0.007 })); fills.push(blob(...c, 0.022, 0.022, { col: 4, label: 'blue dot' }, 0, 20)); }
  const rim = [ring(0.5, 0.5, 0.445, 0.445, { col: 0, w: 0.009, noSym: true }), ring(0.5, 0.5, 0.41, 0.41, { col: 0, w: 0.005, noSym: true })];
  const hub = ring(0.5, 0.5, 0.018, 0.018, { col: 0, w: 0.007, noSym: true });
  void TAU;
  return {
    id: 'kashmiri', variant: 'plate', name: 'Papier-mache plate', ar: 1, ground: '#1a100d', surface: { kind: 'lacquer', shape: 'ellipse' }, symmetry: { kind: 'rot', n: 4 },
    palette: [{ name: 'gold', color: '#e2b34a', metal: true }, { name: 'vermilion', color: '#c8321f' }, { name: 'green', color: '#2f7d4e' }, { name: 'cream', color: '#efe3c6' }, { name: 'blue', color: '#2a4f9c' }],
    layers: [
      { name: 'Draw the gold lines', tool: 'reed', colors: [0], strokes: [...rim, hub, ...lines], regions: [], hint: 'Keep the pen moving slowly: gold needs a steady hand' },
      { name: 'Fill the petals and leaves', tool: 'brush', colors: [1, 2, 3, 4], strokes: [], regions: fills, hint: 'Match the colour to the petal shown in the picture' },
    ],
  };
}

// A lidded box (1.8.0): fine gold work on a black lacquered lid, a chinar (plane tree) leaf in the middle and a border of irises, mirrored left and right.
function box(rng, v) {
  const AR = 1.3, cx = AR / 2, cy = 0.5, lines = [], fills = [];
  const G = (o) => ({ col: 0, w: 0.007, ...o });
  // rim: two gold lines inset from the edge of the lid
  const rect = (a) => [[a, a], [AR - a, a], [AR - a, 1 - a], [a, 1 - a]];
  const rim = [polygon(roundPoly(rect(0.035), 4), G({ w: 0.009, noSym: true })), polygon(roundPoly(rect(0.1), 4), G({ w: 0.005, noSym: true }))];
  // the chinar leaf: five lobes round the stalk (the middle one on the axis), a vein down each lobe, a fine stalk
  const base = [cx, 0.64], lobes = [[-Math.PI / 2, 0.3, 0.1, 2, true], [-Math.PI / 2 - 0.85, 0.27, 0.095, 1, false], [-Math.PI / 2 - 1.65, 0.2, 0.085, 2, false]];
  for (const [a, len, wid, col, noSym] of lobes) {
    const p = polar(...base, 0.02, a), q = polar(...base, len, a);
    lines.push(leaf(p, q, wid, 0, G({ noSym }))); fills.push(leafRegion(p, q, wid, 0, { col, label: 'chinar lobe', noSym }));
    lines.push(curve([polar(...base, 0.05, a), polar(...base, len * 0.78, a)], G({ w: 0.0045, noSym })));
  }
  lines.push(curve([[cx, 0.64], [cx, 0.74], [cx - 0.015, 0.8]], G({ w: 0.006, noSym: true })));
  // irises along the left half of the lid (the right half mirrors them): standard, two falls and a stem
  const iris = (x, y, s, up) => {
    const d = up ? -1 : 1;
    const std = [[x, y], [x, y + d * 0.1 * s]], fl = [[x, y + d * 0.005], [x - 0.06 * s, y + d * 0.085 * s]], fr = [[x, y + d * 0.005], [x + 0.06 * s, y + d * 0.085 * s]];
    for (const [pq, w, col, tag] of [[std, 0.045 * s, 4, 'iris standard'], [fl, 0.04 * s, 3, 'iris fall'], [fr, 0.04 * s, 3, 'iris fall']]) { lines.push(leaf(pq[0], pq[1], w, 0, G())); fills.push(leafRegion(pq[0], pq[1], w, 0, { col, label: tag })); }
    lines.push(curve([[x, y], [x + 0.01, y - d * 0.07 * s], [x, y - d * 0.14 * s]], G({ w: 0.005 })));
  };
  iris(0.22, 0.34, 1.2, true); iris(0.22, 0.66, 1.2, false); iris(0.42, 0.18, 0.9, false); iris(0.42, 0.82, 0.9, true);
  const lf = (p, q, wid, b) => { lines.push(leaf(p, q, wid, b, G())); fills.push(leafRegion(p, q, wid, b, { col: 2, label: 'leaf' })); };
  lf([0.17, 0.5], [0.3, 0.5], 0.06, 0.1); lf([0.5, 0.2], [0.58, 0.28], 0.05, -0.1); lf([0.5, 0.8], [0.58, 0.72], 0.05, 0.1);
  return {
    id: 'kashmiri', variant: 'box', name: 'Papier-mache box', ar: AR, ground: '#1a100d', surface: { kind: 'lacquer', shape: roundPoly(rect(0.0), 4) }, symmetry: { kind: 'mirror-x' },
    palette: [{ name: 'gold', color: '#e2b34a', metal: true }, { name: 'vermilion', color: '#c8321f' }, { name: 'green', color: '#2f7d4e' }, { name: 'cream', color: '#efe3c6' }, { name: 'blue', color: '#2a4f9c' }],
    layers: [
      { name: 'Draw the gold lines', tool: 'reed', colors: [0], strokes: [...rim, ...lines], regions: [], hint: 'Rim first, then the chinar leaf and the irises; the lid mirrors left and right' },
      { name: 'Fill the leaf and the irises', tool: 'brush', colors: [1, 2, 3, 4], strokes: [], regions: fills, hint: 'Vermilion and green lobes, blue and cream irises, green leaves' },
    ],
  };
}

export function kashmiri(rng, v = 1, opts = {}) {
  const key = opts.variant === 'plate' || opts.variant === 'box' ? opts.variant : pick(rng, ['plate', 'box']);
  return key === 'box' ? box(rng, v) : plate(rng, v);
}

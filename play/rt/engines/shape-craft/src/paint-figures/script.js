// shape-craft 1.25.0: lettering and writing figure tables for the `paint` technique. Each design is one page, tablet or leaf written stroke by stroke:
// the strokes of a layer are listed in WRITING ORDER (the engine lights the next one, numbers them and scores the order). Letter shapes are
// hand-built from curves; they are calligraphic studies, not traced from a particular manuscript.
import { curve, line, loop, ring, spiral, leaf, polygon, stroke, region, smoothPoly, leafRegion, blob, rect, polar, TAU } from '../paint-shapes.js';
import { catmull } from '../paint-stroke.js';

// ---- Babylonian numerals on a round clay tablet (a tablet of the square and its diagonal) -------------------------------------------------------------
// A vertical wedge is 1, a corner wedge (two wedges meeting at a point) is 10. The tablet carries a square with its diagonals and four sexagesimal
// numbers: 30, and 1 24 51 10 (the square root of two to six figures).
export function babylon(rng, v = 1) {
  const P = (a, b, o = {}) => line(a, b, { col: 1, w: 0.014, ...o });
  const one = (x, y) => [P([x, y], [x, y + 0.072])];
  const ten = (x, y) => [P([x + 0.052, y - 0.036], [x, y]), P([x + 0.052, y + 0.036], [x, y])];
  const UNITS = { 1: [1], 2: [2], 3: [3], 4: [2, 2], 5: [3, 2], 6: [3, 3], 7: [4, 3], 8: [4, 4], 9: [3, 3, 3] };
  // a sexagesimal digit group with its top-left corner at (x, y): tens as corner wedges, then units as vertical wedges
  const group = (n, x, y) => {
    const out = []; let cx = x, w = 0, hmax = 0;
    const t = Math.floor(n / 10), u = n % 10;
    if (t) { const rows = t <= 3 ? [t] : [3, t - 3]; rows.forEach((c, r) => { for (let k = 0; k < c; k++) out.push(...ten(cx + k * 0.078, y + 0.036 + r * 0.095)); }); w += 0.078 * Math.min(3, t) + 0.02; cx = x + w; hmax = rows.length * 0.095; }
    if (u) { const rows = UNITS[u]; rows.forEach((c, r) => { for (let k = 0; k < c; k++) out.push(...one(cx + k * 0.044, y + r * 0.095)); }); w += 0.044 * Math.max(...rows); hmax = Math.max(hmax, rows.length * 0.095); }
    return { strokes: out, w, h: hmax };
  };
  const X0 = 0.255, X1 = 0.745, Y0 = 0.27, Y1 = 0.80;
  const rules = [
    line([X0, Y0], [X1, Y0], { col: 0, w: 0.006 }), line([X1, Y0], [X1, Y1], { col: 0, w: 0.006 }), line([X1, Y1], [X0, Y1], { col: 0, w: 0.006 }), line([X0, Y1], [X0, Y0], { col: 0, w: 0.006 }),
    line([X0, Y0], [X1, Y1], { col: 0, w: 0.006 }), line([X1, Y0], [X0, Y1], { col: 0, w: 0.006 }),
  ];
  const g30 = group(30, 0.39, 0.115), g1 = group(1, 0.30, 0.375), g24 = group(24, 0.40, 0.375), g51 = group(51, 0.30, 0.585), g10 = group(10, 0.555, 0.585);
  const wedges = [g30, g1, g24, g51, g10].flatMap((g) => g.strokes);
  return {
    id: 'babylon', name: 'tablet', ar: 1, ground: '#c4975f', ordered: false,
    surface: { kind: 'tablet', shape: 'ellipse' }, symmetry: { kind: 'none' },
    palette: [{ name: 'ruling stylus', color: '#3c2612', flat: true }, { name: 'reed stylus', color: '#2a180a' }],
    layers: [
      { name: 'Rule the square and its diagonals', tool: 'point', colors: [0], strokes: rules, regions: [], hint: 'Drag the stylus along each lit line' },
      { name: 'Press the numbers', tool: 'wedge', colors: [1], strokes: wedges, regions: [], hint: 'Press at the dot, drag toward the point, then lift' },
    ],
    tools: { point: { base: 0.007 } },
    rules: [
      'A Babylonian scribe pressed a cut reed into wet clay. Each press leaves one wedge: a deep head where the reed went in and a point where it was lifted.',
      'Press at the lit dot and drag a short way in the direction of the arrow, then lift. A vertical wedge is one; two wedges meeting at a point make ten.',
      'The first step rules a square and its two diagonals with the stylus point; the second presses the numbers. Score: how closely your marks sit on the guide.',
    ],
  };
}

// ---- Ukrainian ustav: a broad pen held at thirty degrees, three letters, then red rubrics ------------------------------------------------------------
export function ustav(rng, v = 1) {
  const y0 = 0.27, y1 = 0.57, H = y1 - y0;
  const S = (pts, o) => curve(pts, { col: 0, w: 0.04, ...o });
  const L = (a, b, o) => line(a, b, { col: 0, w: 0.04, ...o });
  const M = (a) => [L([a, y0], [a, y1]), L([a + 0.005, y0], [a + 0.115, y1 - 0.01]), L([a + 0.115, y1 - 0.01], [a + 0.225, y0 + 0.005]), L([a + 0.225, y0], [a + 0.225, y1])];
  const I = (a) => [L([a, y0], [a, y1]), L([a + 0.215, y0], [a + 0.005, y1]), L([a + 0.215, y0], [a + 0.215, y1])];
  const R = (a) => [L([a, y0], [a, y1]), S([[a + 0.005, y0 + 0.005], [a + 0.1, y0 - 0.005], [a + 0.19, y0 + 0.04], [a + 0.2, y0 + 0.1], [a + 0.12, y0 + 0.16], [a + 0.005, y0 + 0.15]])];
  const word = [...M(0.14), ...I(0.52), ...R(0.9)];
  const red = { col: 1, w: 0.04 };
  const rubrics = [
    stroke([[0.12, y1 + 0.13]], red), stroke([[0.12 + 0.11, y1 + 0.13]], red), stroke([[0.12 + 0.22, y1 + 0.13]], red),
    curve([[0.14, y0 - 0.09], [0.42, y0 - 0.13], [0.72, y0 - 0.1], [1.12, y0 - 0.15]], red),
    stroke([[1.1 - 0.22, y1 + 0.13]], red), stroke([[1.1 - 0.11, y1 + 0.13]], red), stroke([[1.1, y1 + 0.13]], red),
  ];
  return {
    id: 'ustav', name: 'page', ar: 1.3, ground: '#e7d5a6', ordered: true, numbered: true,
    surface: { kind: 'vellum', shape: 'rect', rule: [y0 - 0.02, y1 + 0.02] }, symmetry: { kind: 'none' },
    palette: [{ name: 'iron-gall ink', color: '#1b120c' }, { name: 'vermilion', color: '#c02a1c' }],
    layers: [
      { name: 'Write the word', tool: 'nib', colors: [0], strokes: word, regions: [], hint: 'Keep the nib flat: down strokes are thick, rising strokes are fine' },
      { name: 'Add the red rubrics', tool: 'nibfine', colors: [1], strokes: rubrics, regions: [], hint: 'Touch the nib for each red diamond, then draw the long line above' },
    ],
    tools: { nib: { base: 0.045, edge: -0.52, use: 0.3 }, nibfine: { base: 0.03, edge: -0.52, use: 0.3 } },
    rules: [
      'The broad nib is held at a fixed angle, about thirty degrees. A stroke across the edge is thick, and a stroke along the edge is a hairline, so the thick and thin come from the direction you move, not the speed.',
      'Follow the numbered strokes in order. Tap Dip when the nib runs dry: the ink pales and breaks up before it is gone.',
      'Score: how closely your strokes follow the guide, a little for writing them in the numbered order, and a penalty for stray ink.',
    ],
  };
}

// ---- Ottoman tughra: a sultan's monogram written with the reed pen, then illuminated in gold and lapis --------------------------------------------------
// Three tall staves (tug), the long base stroke (sere), the two oval loops at the left (beyze) and the two sweeping lines to the right (zulfe).
// The monogram here is a generic composition, not the signature of a particular ruler.
export function tughra(rng, v = 1) {
  const ink = { col: 0, w: 0.04 };
  const big = [[0.15, 0.62], [0.17, 0.43], [0.31, 0.31], [0.5, 0.32], [0.62, 0.46], [0.56, 0.62], [0.36, 0.7]];
  const small = [[0.27, 0.6], [0.28, 0.47], [0.38, 0.41], [0.49, 0.45], [0.5, 0.56], [0.38, 0.63]];
  const stave = (x, top) => curve([[x, 0.8], [x + 0.006, 0.58], [x - 0.004, 0.34], [x + 0.01, top]], ink);
  const strokes = [
    curve([[1.22, 0.54], [1.13, 0.69], [0.92, 0.79], [0.62, 0.83], [0.34, 0.81], [0.17, 0.74], [0.14, 0.62]], ink),
    stave(0.72, 0.07), stave(0.82, 0.11), stave(0.92, 0.15),
    loop(big, ink), loop(small, ink),
    curve([[0.21, 0.4], [0.5, 0.33], [0.86, 0.3], [1.1, 0.2], [1.24, 0.07]], ink),
    curve([[0.3, 0.52], [0.62, 0.5], [0.97, 0.44], [1.2, 0.31]], ink),
  ];
  const regions = [
    smoothPoly(big, { col: 1, label: 'outer loop' }), smoothPoly(small, { col: 2, label: 'inner loop' }),
    leafRegion([0.31, 0.53], [0.46, 0.53], 0.07, 0, { col: 3, label: 'leaf' }),
    blob(1.05, 0.1, 0.03, 0.03, { col: 4, label: 'bud' }), blob(1.12, 0.52, 0.026, 0.026, { col: 3, label: 'bud' }), blob(0.62, 0.74, 0.026, 0.026, { col: 4, label: 'bud' }),
  ];
  return {
    id: 'tughra', name: 'monogram', ar: 1.3, ground: '#eadcb6', ordered: true, numbered: true,
    surface: { kind: 'paper', shape: 'rect', fleck: '#d9a82e' }, symmetry: { kind: 'none' },
    palette: [{ name: 'lamp-black ink', color: '#16100c' }, { name: 'gold', color: '#dcab32', metal: true, foil: true }, { name: 'lapis blue', color: '#1f3f96' }, { name: 'turquoise', color: '#1b8a8a' }, { name: 'vermilion', color: '#b8281f' }],
    layers: [
      { name: 'Write the monogram', tool: 'nib', colors: [0], strokes, regions: [], hint: 'The long base first, then the staves, the loops and the sweeping lines' },
      { name: 'Illuminate the loops', tool: 'brush', colors: [1, 2, 3, 4], strokes: [], regions, hint: 'Gold in the outer loop, lapis in the inner loop, then the leaf and buds' },
      { name: 'Rule the gold border', tool: 'fine', colors: [1], strokes: [polygon([[0.03, 0.025], [1.27, 0.025], [1.27, 0.975], [0.03, 0.975]], { col: 1, w: 0.01 }), polygon([[0.085, 0.08], [1.215, 0.08], [1.215, 0.92], [0.085, 0.92]], { col: 1, w: 0.006 }), stroke([[0.057, 0.052]], { col: 1, w: 0.02 }), stroke([[1.243, 0.052]], { col: 1, w: 0.02 }), stroke([[0.057, 0.948]], { col: 1, w: 0.02 }), stroke([[1.243, 0.948]], { col: 1, w: 0.02 })], regions: [], hint: 'Draw the gold ruled border with the fine brush' },
    ],
    tools: { nib: { base: 0.05, edge: -0.4, use: 0.22 } },
    rules: [
      'A tughra is the monogram that stood at the head of Ottoman decrees. Its tall staves, long base line and wide loops were drawn with a reed pen in one confident movement.',
      'Follow the numbered strokes in order with the nib: strokes across the edge are thick and strokes along it are fine. Then pick a colour and tap each loop to flood it with gold or lapis.',
      'Score: how closely your strokes follow the guide, a little for stroke order, how much of each shape holds the right colour, and a penalty for stray ink.',
    ],
  };
}

// ---- Persian tazhib: a gilded headpiece. Lay the size, lay the gold leaf, then colour the ground and leaves -------------------------------------------------
// One quarter of the pattern is listed; the engine repeats it in the four quarters (mirror-xy about the middle of the page).
export function tazhib(rng, v = 1) {
  const SZ = { col: 0, w: 0.016 };
  const CX = 0.65, CY = 0.5;
  const quarter = [];   // outline strokes (size)
  const fills = [];     // regions
  const lf = (p, q, wid, bend, col, label) => { quarter.push(leaf(p, q, wid, bend, SZ)); fills.push(leafRegion(p, q, wid, bend, { col, label })); };
  // the vines: a stem that grows out of the rosette and curls up into a spiral
  quarter.push(curve([[0.77, 0.45], [0.85, 0.37], [0.96, 0.35], [1.04, 0.4]], SZ));
  quarter.push(spiral(1.02, 0.43, 0.012, 0.055, 1.25, -2.1, SZ, 1));
  quarter.push(curve([[0.68, 0.37], [0.72, 0.29], [0.8, 0.25], [0.87, 0.28]], SZ));
  quarter.push(spiral(0.86, 0.3, 0.01, 0.042, 1.2, -1.9, SZ, 1));
  lf([0.9, 0.355], [0.97, 0.27], 0.052, 0.12, 2, 'leaf');
  lf([0.83, 0.275], [0.8, 0.2], 0.045, -0.1, 3, 'leaf');
  lf([0.745, 0.3], [0.67, 0.24], 0.04, 0.1, 2, 'leaf');
  lf([0.7, 0.4], [0.9, 0.46], 0.044, -0.1, 3, 'leaf');
  // the rosette (centred, so it is listed once and never mirrored twice)
  const rosette = [ring(CX, CY, 0.135, 0.135, { ...SZ, noSym: true }), ring(CX, CY, 0.07, 0.07, { ...SZ, noSym: true })];
  const petalFills = [];
  for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU + TAU / 16, p = polar(CX, CY, 0.072, a), q = polar(CX, CY, 0.13, a); rosette.push(leaf(p, q, 0.05, 0, { ...SZ, noSym: true })); petalFills.push(leafRegion(p, q, 0.05, 0, { col: k % 2 ? 3 : 2, label: 'petal', noSym: true })); }
  const frame = [polygon([[0.07, 0.17], [1.23, 0.17], [1.23, 0.83], [0.07, 0.83]], { ...SZ, w: 0.018, noSym: true }), polygon([[0.12, 0.22], [1.18, 0.22], [1.18, 0.78], [0.12, 0.78]], { ...SZ, w: 0.012, noSym: true })];
  const buds = [stroke([[1.08, 0.3]], { ...SZ, w: 0.026 }), stroke([[0.95, 0.24]], { ...SZ, w: 0.022 }), stroke([[0.76, 0.2]], { ...SZ, w: 0.022 })];
  return {
    id: 'tazhib', name: 'headpiece', ar: 1.3, ground: '#efe2c0', ordered: false, gild: true, fillsUnder: true, assistDefault: true, gold: '#dcab32',
    surface: { kind: 'paper', shape: 'rect' }, symmetry: { kind: 'mirror-xy' },
    palette: [{ name: 'size', color: '#b4653a', bole: true, flat: true }, { name: 'lapis blue', color: '#1f3f96' }, { name: 'turquoise', color: '#1b8a8a' }, { name: 'vermilion', color: '#b8281f' }],
    layers: [
      { name: 'Lay the size', tool: 'brush', colors: [0], strokes: [...frame, ...quarter, ...rosette, ...buds], regions: [], hint: 'Draw the sticky size where the gold will go; the pattern mirrors on all four sides' },
      { name: 'Lay the gold leaf', tool: 'brush', colors: [0], strokes: [], regions: [], gild: true, hint: 'Press Gild: the gold leaf sticks to the size and the rest is brushed away' },
      { name: 'Colour the ground and leaves', tool: 'brush', colors: [1, 2, 3], strokes: [], regions: [region([[0.12, 0.22], [1.18, 0.22], [1.18, 0.78], [0.12, 0.78]], { col: 1, label: 'ground', noSym: true }), blob(CX, CY, 0.066, 0.066, { col: 2, label: 'centre', noSym: true }), ...petalFills, ...fills], hint: 'Lapis blue on the ground first, then turquoise and red on the leaves and petals' },
    ],
    rules: [
      'Tazhib is the gilding and painting of manuscript pages. The illuminator first draws the pattern in size, a sticky paint; gold leaf laid over it clings only where the size is, and the rest is brushed off.',
      'Draw every line of the pattern with the size. The pattern is mirrored on all four sides, so you only need to draw one quarter. Press Gild to lay the gold, then pick a colour and tap each shape to flood it.',
      'Score: how closely your lines follow the guide and how much of each shape holds the right colour.',
    ],
  };
}

// ---- Balinese prasi: a story incised on a strip of palm leaf with a fine point, then rubbed with soot --------------------------------------------------------
export function lontar(rng, v = 1) {
  const C = { col: 0, w: 0.0075 };
  const zig = (x0, x1, y, n, amp) => { const pts = []; for (let i = 0; i <= n; i++) pts.push([x0 + ((x1 - x0) * i) / n, y + (i % 2 ? amp : -amp)]); return stroke(pts, C); };
  const scallops = (x0, x1, y, n, amp) => { const pts = []; for (let i = 0; i < n; i++) { const xa = x0 + ((x1 - x0) * i) / n, xb = x0 + ((x1 - x0) * (i + 1)) / n; for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push([xa + (xb - xa) * t, y - Math.sin(Math.PI * t) * amp]); } } return stroke(pts, C); };
  // a serpentine hatch that fills a closed outline: one stroke that runs back and forth across the shape
  const hatch = (poly, gap, tilt = 0) => {
    const c = Math.cos(tilt), sn = Math.sin(tilt), R = poly.map((p) => [p[0] * c + p[1] * sn, -p[0] * sn + p[1] * c]);
    let y0 = 9, y1 = -9; for (const p of R) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    const out = []; let dir = 1;
    for (let y = y0 + gap; y < y1 - gap * 0.5; y += gap) {
      const xs = []; for (let i = 0; i < R.length; i++) { const a = R[i], b = R[(i + 1) % R.length]; if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0])); }
      xs.sort((u, w) => u - w); if (xs.length < 2) continue;
      const seg = dir > 0 ? [[xs[0] + gap * 0.4, y], [xs[xs.length - 1] - gap * 0.4, y]] : [[xs[xs.length - 1] - gap * 0.4, y], [xs[0] + gap * 0.4, y]];
      out.push(...seg); dir = -dir;
    }
    return stroke(out.map((p) => [p[0] * c - p[1] * sn, p[0] * sn + p[1] * c]), C);
  };
  const outline = (ctrl) => catmull(ctrl, true, 8);
  const border = [line([0.12, 0.06], [1.38, 0.06], C), zig(0.12, 1.38, 0.095, 42, 0.012), line([0.12, 0.125], [1.38, 0.125], C), line([0.12, 0.875], [1.38, 0.875], C), zig(0.12, 1.38, 0.905, 42, 0.012), line([0.12, 0.94], [1.38, 0.94], C)];
  const star = []; for (let k = 0; k < 20; k++) { const a = (k / 20) * TAU, r = k % 2 ? 0.07 : 0.125; star.push(polar(0.27, 0.3, r, a)); } star.push(star[0]);
  const sun = [stroke(star, C), ring(0.27, 0.3, 0.05, 0.05, C), hatch(outline([[0.27, 0.25], [0.32, 0.3], [0.27, 0.35], [0.22, 0.3]]), 0.012, 0.6)];
  const palm = [curve([[0.17, 0.8], [0.2, 0.64], [0.17, 0.48]], C), stroke([[0.15, 0.76], [0.2, 0.74], [0.15, 0.7], [0.21, 0.68], [0.15, 0.64], [0.2, 0.62], [0.15, 0.58], [0.2, 0.56], [0.16, 0.52]], C)];
  for (const [dx, dy, bend] of [[-0.14, 0.03, 0.12], [-0.1, 0.13, 0.1], [0.14, 0.03, -0.12], [0.1, 0.13, -0.1], [0.0, -0.13, 0]]) {
    const p = [0.17, 0.47], q = [0.17 + dx, 0.47 + dy];
    palm.push(leaf(p, q, 0.05, bend, C), curve([p, [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2 - bend * 0.15], q], C));
  }
  const sailA = [[0.71, 0.24], [0.85, 0.38], [0.87, 0.52], [0.72, 0.6]], sailB = [[0.69, 0.28], [0.57, 0.4], [0.56, 0.52], [0.69, 0.58]];
  const hillPts = [[1.0, 0.52], [1.1, 0.34], [1.2, 0.26], [1.3, 0.36], [1.38, 0.52]];
  const hill = [curve(hillPts, C), hatch([[1.02, 0.5], [1.12, 0.36], [1.2, 0.29], [1.29, 0.38], [1.36, 0.5]], 0.014, 0.0), zig(1.03, 1.35, 0.55, 12, 0.01)];
  const boat = [
    curve([[0.47, 0.62], [0.53, 0.74], [0.8, 0.74], [0.94, 0.6]], C), curve([[0.47, 0.62], [0.7, 0.65], [0.94, 0.6]], C), line([0.7, 0.65], [0.7, 0.2], C),
    loop(sailA, C), loop(sailB, C), loop([[0.7, 0.2], [0.8, 0.17], [0.72, 0.13], [0.7, 0.14]], C),
    hatch(outline([[0.72, 0.28], [0.83, 0.39], [0.84, 0.5], [0.73, 0.57]]), 0.013, 0.5), hatch(outline([[0.68, 0.31], [0.59, 0.4], [0.58, 0.5], [0.68, 0.55]]), 0.013, -0.5),
    hatch(outline([[0.52, 0.66], [0.7, 0.68], [0.9, 0.64], [0.86, 0.69], [0.6, 0.72]]), 0.011, 0),
    spiral(0.47, 0.57, 0.004, 0.04, 1.2, 1.4, C, -1), spiral(0.95, 0.56, 0.004, 0.035, 1.1, 1.8, C, 1),
    line([0.7, 0.2], [0.47, 0.61], C), line([0.7, 0.2], [0.94, 0.6], C),
  ];
  const fish = [loop([[0.26, 0.7], [0.34, 0.63], [0.44, 0.65], [0.46, 0.72], [0.36, 0.78]], C), loop([[0.26, 0.7], [0.19, 0.63], [0.19, 0.78]], C), ring(0.41, 0.69, 0.011, 0.011, C), hatch(outline([[0.3, 0.7], [0.35, 0.66], [0.4, 0.73], [0.35, 0.75]]), 0.012, 0.9), curve([[0.33, 0.64], [0.35, 0.6], [0.39, 0.64]], C)];
  const fish2 = [loop([[1.06, 0.66], [1.13, 0.6], [1.22, 0.62], [1.24, 0.68], [1.15, 0.73]], C), loop([[1.24, 0.68], [1.31, 0.62], [1.31, 0.74]], C), ring(1.1, 0.65, 0.01, 0.01, C), scallops(1.1, 1.22, 0.69, 3, 0.012)];
  const waves = [scallops(0.3, 1.0, 0.8, 11, 0.028), scallops(0.2, 1.1, 0.855, 13, 0.024), scallops(0.14, 0.44, 0.82, 4, 0.02)];
  const birds = [curve([[0.46, 0.24], [0.5, 0.19], [0.54, 0.24]], C), curve([[0.56, 0.17], [0.6, 0.12], [0.64, 0.17]], C)];
  return {
    id: 'lontar', name: 'leaf', ar: 1.5, ground: '#d3b06a', ordered: false, finish: 'soot',
    surface: { kind: 'lontar', shape: 'rect', holes: [[0.04, 0.5], [0.96, 0.5]] }, symmetry: { kind: 'none' },
    palette: [{ name: 'incised line', color: '#9c7a3e', flat: true, soot: '#17100a' }],
    layers: [{ name: 'Incise the story', tool: 'point', colors: [0], strokes: [...border, ...sun, ...palm, ...hill, ...boat, ...fish, ...fish2, ...waves, ...birds], regions: [], hint: 'Drag the point along each lit line; press lightly and keep it moving' }],
    tools: { point: { base: 0.0075 } },
    rules: [
      'A Balinese leaf-writer scratches a story into dried palm leaf with a fine steel point. The scratches are pale at first; then soot is rubbed over the leaf and wiped off, and it stays only in the scratches.',
      'Drag the point along each lit line. Press Rub soot to see the picture come out dark.',
      'Score: how closely your lines follow the guide, and a penalty for stray scratches.',
    ],
  };
}

// ---- European enluminure: a gilded initial A on vellum, with painted leaves and pen tendrils ---------------------------------------------------------------
// Steps: flood the letter with size, lay the gold leaf, paint the leaves, then draw the tendrils with the pen.
export function enluminure(rng, v = 1) {
  const legL = region([[0.57, 0.14], [0.64, 0.14], [0.37, 0.86], [0.27, 0.86]], { col: 0, label: 'left stroke' });
  const legR = region([[0.57, 0.14], [0.69, 0.14], [1.0, 0.86], [0.84, 0.86]], { col: 0, label: 'right stroke' });
  const bar = region([[0.43, 0.6], [0.86, 0.6], [0.88, 0.68], [0.4, 0.68]], { col: 0, label: 'crossbar' });
  const footL = region([[0.2, 0.84], [0.45, 0.84], [0.45, 0.9], [0.2, 0.9]], { col: 0, label: 'foot' });
  const footR = region([[0.75, 0.84], [1.05, 0.84], [1.05, 0.9], [0.75, 0.9]], { col: 0, label: 'foot' });
  const LF = [[[0.6, 0.56], [0.5, 0.36], 0.1, 0.06, 2], [[0.64, 0.56], [0.74, 0.36], 0.1, -0.06, 3], [[0.17, 0.52], [0.27, 0.3], 0.1, 0.06, 3], [[0.12, 0.72], [0.3, 0.62], 0.1, -0.06, 5], [[1.08, 0.52], [0.99, 0.3], 0.1, -0.06, 5], [[1.12, 0.72], [0.94, 0.62], 0.1, 0.06, 3], [[0.4, 0.22], [0.2, 0.13], 0.08, 0.06, 5], [[0.8, 0.22], [1.0, 0.13], 0.08, -0.06, 2]];
  const panel = { ...region([[0.08, 0.06], [1.17, 0.06], [1.17, 0.94], [0.08, 0.94]], { col: 1, label: 'blue ground' }), under: true };
  const leaves = [panel, ...LF.map(([p, q, w, b, col]) => leafRegion(p, q, w, b, { col, label: 'leaf' })), blob(0.6, 0.76, 0.03, 0.03, { col: 5, label: 'berry' }), blob(0.17, 0.33, 0.024, 0.024, { col: 3, label: 'berry' }), blob(1.1, 0.33, 0.024, 0.024, { col: 5, label: 'berry' })];
  const P = { col: 4, w: 0.011 };
  const pen = [
    ...LF.map(([p, q, w, b]) => leaf(p, q, w, b, P)),
    curve([[0.16, 0.9], [0.1, 0.8], [0.05, 0.66], [0.07, 0.5]], P), curve([[1.06, 0.9], [1.14, 0.8], [1.2, 0.66], [1.17, 0.5]], P),
    curve([[0.64, 0.14], [0.66, 0.08], [0.72, 0.05]], P), curve([[0.57, 0.14], [0.52, 0.08], [0.46, 0.05]], P),
    spiral(0.075, 0.45, 0.004, 0.03, 1.2, 1.4, P, 1), spiral(1.165, 0.45, 0.004, 0.03, 1.2, 1.7, P, -1),
    stroke([[0.76, 0.05]], P), stroke([[0.42, 0.05]], P), stroke([[0.6, 0.83]], P),
  ];
  const frame = [polygon([[0.05, 0.03], [1.2, 0.03], [1.2, 0.97], [0.05, 0.97]], { col: 0, w: 0.016, noSym: true })];
  return {
    id: 'enluminure', name: 'initial', ar: 1.25, ground: '#eadcae', ordered: true, numbered: true, gild: true, fillsUnder: true, gold: '#dcab32',
    surface: { kind: 'vellum', shape: 'rect' }, symmetry: { kind: 'none' },
    palette: [{ name: 'size', color: '#b4653a', bole: true, flat: true }, { name: 'ultramarine', color: '#23439a' }, { name: 'verdigris green', color: '#2f7a52' }, { name: 'vermilion', color: '#c02a1c' }, { name: 'shell gold ink', color: '#e8c050', flat: true }, { name: 'lead white', color: '#f3ecd8' }],
    layers: [
      { name: 'Lay the size on the letter', tool: 'brush', colors: [0], strokes: frame, regions: [legL, legR, bar, footL, footR], hint: 'Tap each part of the letter to flood it with size, then draw the frame line' },
      { name: 'Lay the gold leaf', tool: 'brush', colors: [0], strokes: [], regions: [], gild: true, hint: 'Press Gild: the leaf sticks to the size' },
      { name: 'Paint the ground and leaves', tool: 'brush', colors: [1, 2, 3, 5], strokes: [], regions: leaves, hint: 'Ultramarine on the ground, then green, red and white leaves; tap a shape to flood it' },
      { name: 'Outline and draw the tendrils', tool: 'pen', colors: [4], strokes: pen, regions: [], hint: 'Outline each leaf with the pen, then the tendrils and dots, following the numbers' },
    ],
    tools: { pen: { base: 0.011, use: 0.2 } },
    rules: [
      'A medieval illuminator built an initial letter in layers. First size, a sticky paint, is laid on the letter; gold leaf is pressed onto it and only sticks where the size is. Then the ground and leaves are painted and the pen adds the fine outlines and tendrils last.',
      'Tap each part of the letter to flood it with size, press Gild, paint the ground and leaves, then outline them and draw the numbered tendrils with the pen.',
      'Score: how much of each shape holds the right colour, how closely your pen lines follow the guide, and a little for stroke order.',
    ],
  };
}
void TAU;

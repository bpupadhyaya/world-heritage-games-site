// Tingatinga (Tanzania), 1.8.0: flat enamel on a board. Five animals chosen by the round's seed (or params.variant): bird, elephant, zebra,
// leopard, fish. Step 1 floods the background and every shape; step 2 draws the bold wavy black outline (and stripes or spots);
// step 3 adds the eye, details, the wavy border and the painter's signature.
import { blob, leafRegion, poly, rect, curve, ring, stroke, line, wavyLoop, wavyLine, visibleOutline, jit, pick } from '../paint-shapes.js';

const PALETTE = [{ name: 'sun yellow', color: '#f6c928' }, { name: 'blue', color: '#1f4fa8' }, { name: 'red', color: '#d63a2a' }, { name: 'green', color: '#2f9a4a' }, { name: 'orange', color: '#f08a1e' }, { name: 'brown', color: '#6a3d1e' }, { name: 'black', color: '#171717', flat: true },
  { name: 'white', color: '#f7f2e4' }, { name: 'turquoise', color: '#18a3b4' }, { name: 'grey', color: '#8b97a6' }, { name: 'pink', color: '#e86fa0' }];
const BG = [0.05, 0.05, 0.95, 0.95];

// a figure is { bg: [regions], parts: [regions], marks: [strokes drawn with the outline], details: [strokes drawn last] }
function bird(rng, v, F, flip) {
  const j = jit(rng, v, 0.02), bgc = pick(rng, [0, 8]);
  const bg = [rect(...BG, { col: bgc, label: 'sky', base: '#f2ecdc' }), poly([[0.05, 0.8 + j], [0.5, 0.72], [0.95, 0.76], [0.95, 0.82], [0.5, 0.78], [0.05, 0.86 + j]].map(F), { col: 5, label: 'branch' })];
  const parts = [
    leafRegion(F([0.4, 0.58]), F([0.1, 0.86]), 0.09, -0.08 * flip, { col: 3, label: 'tail feather' }), leafRegion(F([0.42, 0.6]), F([0.2, 0.9]), 0.085, 0.05 * flip, { col: 2, label: 'tail feather' }), leafRegion(F([0.44, 0.6]), F([0.34, 0.93]), 0.08, 0.04 * flip, { col: 1, label: 'tail feather' }),
    blob(F([0.52, 0])[0], 0.5, 0.23, 0.15, { col: 1, label: 'body', volume: true }, -0.55 * flip), leafRegion(F([0.36, 0.44]), F([0.62, 0.62]), 0.16, 0.12 * flip, { col: 2, label: 'wing' }),
    blob(F([0.7, 0])[0], 0.3, 0.1, 0.095, { col: 4, label: 'head', volume: true }), poly([[0.78, 0.26], [0.93, 0.34], [0.78, 0.37]].map(F), { col: 0, label: 'beak' }),
    leafRegion(F([0.1, 0.35]), F([0.3, 0.2]), 0.08, 0.1, { col: 3, label: 'leaf' }),
  ];
  const marks = [curve([[0.42, 0.5], [0.5, 0.55], [0.6, 0.58]].map(F), { col: 6, w: 0.012 }), curve([[0.44, 0.45], [0.53, 0.5], [0.62, 0.53]].map(F), { col: 6, w: 0.012 })];
  const details = [ring(F([0.73, 0])[0], 0.28, 0.026, 0.026, { col: 6, w: 0.01 }), ring(F([0.73, 0])[0], 0.28, 0.009, 0.009, { col: 6, w: 0.012 }),
    line(F([0.52, 0.64]), F([0.51, 0.73]), { col: 6, w: 0.011 }), line(F([0.58, 0.63]), F([0.59, 0.73]), { col: 6, w: 0.011 }),
    line(F([0.4, 0.62]), F([0.16, 0.84]), { col: 6, w: 0.008 }), line(F([0.43, 0.62]), F([0.26, 0.88]), { col: 6, w: 0.008 })];
  return { name: 'Tingatinga bird', bg, parts, marks, details, hint: 'Flood the sky and branch, then each tail feather, the body, wing, head and beak' };
}
const legsAt = (xs, y0, y1, w, col, F, label = 'leg') => xs.map((x) => poly([[x, y0], [x + w, y0], [x + w * 1.05, y1], [x - w * 0.05, y1]].map(F), { col, label }));

function elephant(rng, v, F, flip) {
  const j = jit(rng, v, 0.015), bgc = pick(rng, [0, 4]);
  const bg = [rect(...BG, { col: bgc, label: 'sky', base: '#f2ecdc' }), poly([[0.05, 0.82], [0.5, 0.79 + j], [0.95, 0.83], [0.95, 0.95], [0.05, 0.95]].map(F), { col: 3, label: 'grass' }), blob(F([0.2, 0])[0], 0.2, 0.09, 0.09, { col: bgc === 0 ? 4 : 0, label: 'sun' }, 0, 30)];
  const parts = [
    ...legsAt([0.26, 0.37, 0.52, 0.63], 0.64, 0.84, 0.095, 9, F),
    leafRegion(F([0.86, 0.4]), F([0.94, 0.17]), 0.075, -0.25 * flip, { col: 9, label: 'trunk' }),
    blob(F([0.46, 0])[0], 0.55, 0.27, 0.19, { col: 9, label: 'body', volume: true }, 0.02 * flip), blob(F([0.77, 0])[0], 0.43, 0.115, 0.115, { col: 9, label: 'head', volume: true }),
    leafRegion(F([0.7, 0.3]), F([0.62, 0.62]), 0.17, 0.12 * flip, { col: 8, label: 'ear' }),
    poly([[0.83, 0.52], [0.93, 0.6], [0.84, 0.57]].map(F), { col: 7, label: 'tusk' }),
  ];
  const marks = [curve([[0.2, 0.5], [0.12, 0.6], [0.14, 0.72]].map(F), { col: 6, w: 0.012 }), curve([[0.46, 0.4], [0.5, 0.55], [0.46, 0.7]].map(F), { col: 6, w: 0.009 })];
  const details = [ring(F([0.8, 0])[0], 0.4, 0.02, 0.02, { col: 6, w: 0.011 }), ring(F([0.8, 0])[0], 0.4, 0.007, 0.007, { col: 6, w: 0.012 }),
    ...[0.26, 0.37, 0.52, 0.63].map((x) => curve([[x + 0.015, 0.82], [x + 0.045, 0.835]].map(F), { col: 6, w: 0.009 })), curve([[0.865, 0.2], [0.9, 0.21], [0.935, 0.2]].map(F), { col: 6, w: 0.008 }),
    curve([[0.66, 0.4], [0.64, 0.5], [0.66, 0.58]].map(F), { col: 6, w: 0.008 })];
  return { name: 'Tingatinga elephant', bg, parts, marks, details, hint: 'Flood the sky, the grass and the sun, then the legs, body, head, ear, trunk and tusk' };
}

function zebra(rng, v, F, flip) {
  const j = jit(rng, v, 0.012), bgc = pick(rng, [4, 8, 0]);
  const bg = [rect(...BG, { col: bgc, label: 'sky', base: '#f2ecdc' }), poly([[0.05, 0.8], [0.5, 0.77 + j], [0.95, 0.8], [0.95, 0.95], [0.05, 0.95]].map(F), { col: 3, label: 'grass' })];
  const parts = [
    ...legsAt([0.27, 0.36, 0.55, 0.64], 0.58, 0.82, 0.075, 7, F),
    leafRegion(F([0.62, 0.5]), F([0.79, 0.26]), 0.15, -0.05 * flip, { col: 7, label: 'neck' }), blob(F([0.46, 0])[0], 0.5, 0.25, 0.15, { col: 7, label: 'body', volume: true }, -0.05 * flip),
    blob(F([0.83, 0])[0], 0.24, 0.1, 0.07, { col: 7, label: 'head', volume: true }, 0.45 * flip), blob(F([0.91, 0])[0], 0.285, 0.04, 0.035, { col: 9, label: 'muzzle' }),
    leafRegion(F([0.66, 0.34]), F([0.8, 0.14]), 0.045, -0.15 * flip, { col: 6, label: 'mane' }), leafRegion(F([0.22, 0.46]), F([0.1, 0.7]), 0.05, 0.12 * flip, { col: 7, label: 'tail' }),
  ];
  const marks = [];
  for (let k = 0; k < 8; k++) { const x = 0.28 + k * 0.058; marks.push(curve([[x, 0.37 + Math.abs(k - 3.5) * 0.01], [x + 0.02, 0.5], [x - 0.01, 0.63 - Math.abs(k - 3.5) * 0.008]].map(F), { col: 6, w: 0.022 })); }
  for (let k = 0; k < 3; k++) marks.push(curve([[0.64 + k * 0.045, 0.45 - k * 0.07], [0.69 + k * 0.045, 0.4 - k * 0.07]].map(F), { col: 6, w: 0.02 }));
  for (const x of [0.27, 0.36, 0.55, 0.64]) marks.push(curve([[x, 0.68], [x + 0.08, 0.69]].map(F), { col: 6, w: 0.018 }));
  marks.push(curve([[0.8, 0.2], [0.84, 0.22]].map(F), { col: 6, w: 0.018 }), curve([[0.86, 0.18], [0.88, 0.23]].map(F), { col: 6, w: 0.016 }));
  const details = [ring(F([0.84, 0])[0], 0.22, 0.014, 0.014, { col: 6, w: 0.01 }), curve([[0.915, 0.285], [0.918, 0.288]].map(F), { col: 6, w: 0.012 }), curve([[0.12, 0.66], [0.1, 0.72], [0.12, 0.76]].map(F), { col: 6, w: 0.012 })];
  return { name: 'Tingatinga zebra', bg, parts, marks, details, hint: 'Flood the sky and grass, then the legs, body, neck, head, muzzle, mane and tail' };
}

function leopard(rng, v, F, flip) {
  const j = jit(rng, v, 0.012);
  const bg = [rect(...BG, { col: pick(rng, [3, 8]), label: 'jungle', base: '#f2ecdc' }), poly([[0.05, 0.6 + j], [0.5, 0.58], [0.95, 0.62], [0.95, 0.7], [0.5, 0.66], [0.05, 0.69]].map(F), { col: 5, label: 'branch' }), blob(F([0.82, 0])[0], 0.16, 0.08, 0.08, { col: 0, label: 'sun' }, 0, 30)];
  const parts = [
    leafRegion(F([0.22, 0.46]), F([0.07, 0.15]), 0.075, 0.3 * flip, { col: 0, label: 'tail' }),
    ...legsAt([0.3, 0.38, 0.58, 0.66], 0.5, 0.66, 0.07, 0, F),
    blob(F([0.46, 0])[0], 0.43, 0.27, 0.1, { col: 0, label: 'body', volume: true }, -0.03 * flip), blob(F([0.78, 0])[0], 0.38, 0.1, 0.09, { col: 0, label: 'head', volume: true }),
    blob(F([0.72, 0])[0], 0.3, 0.03, 0.04, { col: 4, label: 'ear' }), blob(F([0.84, 0])[0], 0.3, 0.03, 0.04, { col: 4, label: 'ear' }), blob(F([0.84, 0])[0], 0.42, 0.045, 0.035, { col: 7, label: 'muzzle' }),
  ];
  const marks = [];
  [[0.28, 0.4], [0.36, 0.45], [0.44, 0.39], [0.5, 0.46], [0.58, 0.4], [0.64, 0.45], [0.33, 0.35], [0.54, 0.35], [0.4, 0.5], [0.68, 0.37], [0.24, 0.45], [0.47, 0.42]].forEach(([x, y]) => marks.push(...[ring(F([x, 0])[0], y, 0.022, 0.017, { col: 6, w: 0.011 })]));
  [[0.1, 0.34], [0.13, 0.26], [0.09, 0.2]].forEach(([x, y]) => marks.push(curve([[x, y], [x + 0.014, y + 0.01]].map(F), { col: 6, w: 0.018 })));
  [[0.31, 0.58], [0.39, 0.585], [0.59, 0.575], [0.67, 0.58]].forEach(([x, y]) => marks.push(curve([[x, y - 0.05], [x + 0.005, y - 0.045]].map(F), { col: 6, w: 0.014 })));
  const details = [ring(F([0.8, 0])[0], 0.35, 0.02, 0.016, { col: 6, w: 0.01 }), curve([[0.87, 0.4], [0.875, 0.405]].map(F), { col: 6, w: 0.014 }), curve([[0.83, 0.43], [0.86, 0.44]].map(F), { col: 6, w: 0.007 }),
    curve([[0.86, 0.38], [0.97, 0.36]].map(F), { col: 6, w: 0.005 }), curve([[0.86, 0.4], [0.97, 0.41]].map(F), { col: 6, w: 0.005 })];
  return { name: 'Tingatinga leopard', bg, parts, marks, details, hint: 'Flood the jungle, branch and sun, then the tail, legs, body, head, ears and muzzle' };
}

function fish(rng, v, F, flip) {
  const j = jit(rng, v, 0.02);
  const bg = [rect(...BG, { col: pick(rng, [8, 1]), label: 'water', base: '#f2ecdc' }), poly([[0.05, 0.9], [0.5, 0.9], [0.95, 0.9], [0.95, 0.95], [0.05, 0.95]].map(F), { col: 5, label: 'sand' }), leafRegion(F([0.15, 0.93]), F([0.12, 0.66 + j]), 0.07, 0.15, { col: 3, label: 'seaweed' }), leafRegion(F([0.86, 0.93]), F([0.9, 0.62]), 0.07, -0.15, { col: 3, label: 'seaweed' })];
  const parts = [
    poly([[0.3, 0.5], [0.12, 0.3 + j], [0.14, 0.5], [0.12, 0.7 - j]].map(F), { col: 2, label: 'tail' }),
    poly([[0.4, 0.38], [0.5, 0.2], [0.68, 0.26], [0.7, 0.4]].map(F), { col: 1, label: 'top fin' }), poly([[0.44, 0.62], [0.5, 0.78], [0.62, 0.65]].map(F), { col: 10, label: 'belly fin' }),
    leafRegion(F([0.26, 0.5]), F([0.88, 0.5]), 0.34, 0, { col: 4, label: 'body', volume: true }), blob(F([0.72, 0])[0], 0.45, 0.06, 0.06, { col: 7, label: 'eye' }, 0, 26),
    leafRegion(F([0.5, 0.45]), F([0.62, 0.58]), 0.1, 0.1, { col: 0, label: 'gill' }),
  ];
  const marks = [];
  for (let k = 0; k < 3; k++) marks.push(curve([[0.38 + k * 0.07, 0.38 + k * 0.0], [0.4 + k * 0.07, 0.5], [0.38 + k * 0.07, 0.62]].map(F), { col: 6, w: 0.02 }));
  [[0.2, 0.2], [0.82, 0.22], [0.78, 0.14], [0.2, 0.1]].forEach(([x, y]) => marks.push(ring(F([x, 0])[0], y, 0.026, 0.026, { col: 6, w: 0.011 })));
  const details = [ring(F([0.72, 0])[0], 0.45, 0.012, 0.012, { col: 6, w: 0.018 }), curve([[0.86, 0.5], [0.83, 0.54], [0.8, 0.52]].map(F), { col: 6, w: 0.01 }),
    ...[0.45, 0.55, 0.65].map((x, i) => curve([[x, 0.47 + i * 0.02], [x + 0.03, 0.5 + i * 0.02], [x, 0.53 + i * 0.02]].map(F), { col: 6, w: 0.007 }))];
  return { name: 'Tingatinga fish', bg, parts, marks, details, hint: 'Flood the water, sand and seaweed, then the tail, fins, body, eye and gill' };
}

const VARIANTS = { bird, elephant, zebra, leopard, fish };
export const TINGATINGA_VARIANTS = Object.keys(VARIANTS);
export function tingatinga(rng, v = 1, opts = {}) {
  const key = VARIANTS[opts.variant] ? opts.variant : TINGATINGA_VARIANTS[Math.floor(rng.next() * 5) % 5], flip = rng.next() < 0.5 ? -1 : 1;
  const F = flip > 0 ? (p) => p : (p) => [1 - p[0], p[1]];
  const f = VARIANTS[key](rng, v, F, flip), fills = [...f.bg, ...f.parts];
  const outlines = f.parts.flatMap((r, i) => (r.label === 'sun' ? [] : visibleOutline(r, f.parts.slice(i + 1), 0.0035, 0.05, { col: 6, w: 0.013 })));
  const frame = wavyLoop([[0.03, 0.03], [0.97, 0.03], [0.97, 0.97], [0.03, 0.97]], 0.004, 0.04, { col: 6, w: 0.007, noSym: true });
  const sig = [curve([[0.66, 0.925], [0.69, 0.9], [0.71, 0.93], [0.73, 0.9], [0.75, 0.93]], { col: 6, w: 0.008 }), curve([[0.77, 0.91], [0.8, 0.935], [0.83, 0.905], [0.87, 0.93]], { col: 6, w: 0.008 }), curve([[0.66, 0.945], [0.77, 0.94], [0.88, 0.945]], { col: 6, w: 0.006 })];
  return {
    id: 'tingatinga', variant: key, name: f.name, ar: 1, ground: '#f2ecdc', finish: 'gloss', surface: { kind: 'board', shape: 'rect' }, symmetry: { kind: 'none' }, palette: PALETTE,
    layers: [
      { name: 'Fill each shape with flat enamel', tool: 'brush', colors: [...new Set(fills.map((r) => r.col))].sort((a, b) => a - b), strokes: [], regions: fills, hint: f.hint },
      { name: 'Draw the bold wavy outline', tool: 'brush', colors: [6], strokes: [...outlines, ...f.marks], regions: [], hint: 'Follow each shape with a bold wavy black line, then the stripes, spots and markings' },
      { name: 'Add the details, border and signature', tool: 'fine', colors: [6], strokes: [...f.details, frame, ...sig], regions: [], hint: 'Eye and fine details, the wavy border, then sign your name' },
    ],
  };
}
void stroke; void wavyLine;

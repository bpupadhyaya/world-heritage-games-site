// shape-craft 1.26.0 Kitchen Crafts: figure tables for the two sweets of the SWEET area.
//   taffy     maple taffy on snow: three strips of hot syrup poured along guide curves on a trough of packed snow, then rolled on sticks
//   camellia  nerikiri wagashi, winter: a blush and rose camellia of bean-paste dough with a heart of fine strands and a stamen
//   kiku      nerikiri wagashi, autumn: a chrysanthemum in lemon and apricot dough with many fine petals and a green heart
// These tables are read by sweet-taffy.js and sweet-nerikiri.js (techniques `sweet-taffy`, `sweet-nerikiri`). They are NOT in the paint DESIGNS table on
// purpose: that table is for the `paint` technique, whose test requires every entry to have a `paint` fixture.
// Each design = { id, name, ar, ... , layers: [layer] } with the same stroke / region shapes as the paint tables (src/paint-shapes.js), in design units
// (height 1, width ar). Everything is deterministic: variation comes only from the rng passed in.
import { stroke, curve, TAU } from '../paint-shapes.js';
import { catmull, chaikin, resample } from '../paint-stroke.js';

const polar = (cx, cy, r, a) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
const discPts = (cx, cy, r, n = 56, wob = 0) => { const out = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU, q = r * (1 + wob * Math.sin(a * 5 + 1)); out.push(polar(cx, cy, q, a)); } return out; };
const shuffle = (arr, rng) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng.next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---- maple taffy ---------------------------------------------------------------------------------------------------------------------------
const AR_T = 1.6, W0 = 0.05;   // ideal width of a poured line
function strip(kind, y0, x0, x1, ph, amp) {
  const L = x1 - x0, pts = [], n = 260;
  if (kind === 'wave') { const f = 2.5 + ph * 0.8; for (let i = 0; i <= n; i++) { const u = i / n; pts.push([x0 + L * u, y0 + amp * Math.sin(TAU * f * u + ph * 3)]); } }
  else if (kind === 'loops') { const k = 3, rho = 0.082 * (0.9 + amp * 1.5); for (let i = 0; i <= n; i++) { const u = i / n, th = TAU * k * u; pts.push([x0 + L * u + rho * Math.sin(th) * 1.0, y0 - rho * Math.cos(th)]); } }
  else { const m = 7, c = []; for (let i = 0; i <= m; i++) c.push([x0 + (L * i) / m, y0 + (i % 2 ? 1 : -1) * amp * 1.15]); return chaikin(c, 3); }
  return pts;
}
export function taffy(rng, variation = 1) {
  const kinds = shuffle(['wave', 'loops', 'zigzag'], rng), lanes = [0.27, 0.52, 0.77];
  const strokes = kinds.map((kind, i) => {
    const amp = 0.05 + 0.02 * variation * rng.next(), ph = rng.next(), x0 = 0.2 + 0.04 * rng.next(), x1 = 1.42 - 0.04 * rng.next();
    let pts = resample(strip(kind, lanes[i] + (rng.next() - 0.5) * 0.02, x0, x1, ph, amp), 0.009);
    if (rng.next() < 0.4) pts = pts.slice().reverse();
    return { pts, col: 0, w: W0, kind };
  });
  return { id: 'taffy', name: 'Maple taffy', ar: AR_T, W0, strips: strokes,
    layers: [{ name: 'Pour the syrup', kind: 'pour', strokes, regions: [], hint: 'Pour steadily along the lit line: slow pools, fast breaks into drops' }, { name: 'Roll the strips', kind: 'roll', strokes: [], regions: [], hint: 'Press at the end of a set strip and drag along it to roll it up' }] };
}

// ---- nerikiri -----------------------------------------------------------------------------------------------------------------------------
const CX = 0.5, CY = 0.5, R = 0.355;   // the ball of dough on its tray
const pin = (a, r) => polar(CX, CY, r * R, a);
// a groove running from the heart to the rim and curling like a petal: r from r0 to r1 (fractions of R), the angle drifts by `curl` radians
function groove(a, r0, r1, curl, w, n = 18) {
  const pts = []; for (let i = 0; i <= n; i++) { const t = i / n; pts.push(pin(a + curl * Math.pow(t, 0.85), r0 + (r1 - r0) * t)); }
  return { pts: resample(catmull(pts, false, 6), 0.008), col: 0, w };
}
const gather = (a, r0, r1, w) => ({ pts: resample([pin(a, r0), pin(a + 0.05, (r0 + r1) / 2), pin(a, r1)], 0.008), col: 0, w });

export function camellia(rng, variation = 1) {
  const spin = rng.next() * TAU, curl = 0.85 + 0.25 * variation * rng.next(), N = 5, flip = rng.next() < 0.5 ? 1 : -1;
  const ang = (k) => spin + (k * TAU) / N;
  const longG = [], rimG = [], veins = [], tip = (k) => pin(ang(k) + flip * curl, 0.9);
  for (let k = 0; k < N; k++) {
    longG.push(groove(ang(k), 0.2, 0.9, flip * curl, 0.011));
    // the rounded top edge of each petal: from the tip of one crease, bowing out toward the rim, to the tip of the next
    const a = tip(k), b = tip((k + 1) % N), mid = pin(ang(k) + flip * curl + flip * (TAU / N) * 0.5, 0.97);
    rimG.push({ pts: resample(catmull([a, mid, b], false, 10), 0.008), col: 0, w: 0.011 });
    veins.push(groove(ang(k) + (flip * TAU) / (2 * N) * 0.9, 0.34, 0.72, flip * curl * 0.55, 0.012, 14));
  }
  const petals = longG.map((g, k) => [...g.pts, ...rimG[k].pts, ...longG[(k + 1) % N].pts.slice().reverse()]);   // the outline of each petal, for the relief shading
  const gathers = []; for (let k = 0; k < N; k++) gathers.push(gather(ang(k) + 0.31, 0.97, 0.2, 0.018));
  const stamens = []; for (let k = 0; k < 6; k++) stamens.push({ pts: [pin(spin * 2 + (k * TAU) / 6, 0.34)], col: 0, w: 0.012 });
  return {
    id: 'camellia', name: 'Camellia (tsubaki)', season: 'winter', ar: 1, R, centre: [CX, CY], spin, deco: 'leaf', soboro: '#f1c64a', stamen: '#e9a62a', petals, flip,
    palette: [{ name: 'Blush pink', color: '#f2a9bb' }, { name: 'Deep rose', color: '#d24c6b' }, { name: 'Cream', color: '#f8efd6' }, { name: 'Lilac', color: '#b9a4d8' }],
    layers: [
      { name: 'Tint the dough', kind: 'tint', colors: [0, 1, 2, 3], strokes: [], regions: [{ pts: discPts(CX, CY, R, 64), col: 0, label: 'outer dough' }, { pts: discPts(CX, CY, R * 0.6, 48, 0.04), col: 1, label: 'inner layer' }], hint: 'Pick a colour, then tap the shape it belongs to: blush outside, deep rose inside' },
      { name: 'Wrap the bean filling', kind: 'wrap', tool: 'bera', strokes: gathers, regions: [], hint: 'Bamboo spatula: drag from the rim to the middle to fold each flap over the filling' },
      { name: 'Press the petals', kind: 'press', tool: 'sankaku', strokes: [...longG, ...rimG], regions: [], hint: 'Triangle stick: press along each lit petal line, slowly enough to cut a clean groove' },
      { name: 'Scrape the veins', kind: 'scrape', tool: 'sanbon', strokes: veins, regions: [], hint: 'Three-pronged scraper: draw along each lit petal to lay three fine veins' },
      { name: 'Sift the heart', kind: 'sieve', tool: 'sieve', strokes: [], regions: [{ pts: discPts(CX, CY, R * 0.3, 32), col: 0, label: 'heart' }], hint: 'Fine sieve: rub back and forth over the heart to push out the soft strands' },
      { name: 'Set the stamens', kind: 'stamen', tool: 'tweezers', strokes: stamens, regions: [], hint: 'Tweezers: tap each lit mark to set a stamen' },
    ],
  };
}

export function kiku(rng, variation = 1) {
  const spin = rng.next() * TAU, curl = 0.45 + 0.2 * variation * rng.next(), N = 6, flip = rng.next() < 0.5 ? 1 : -1, M = 12;
  const outer = [], inner = [], lines = [];
  for (let k = 0; k < M; k++) outer.push(groove(spin + (k * TAU) / M, 0.52, 0.97, flip * curl, 0.01, 12));
  for (let k = 0; k < N; k++) inner.push(groove(spin + ((k + 0.5) * TAU) / N, 0.26, 0.5, flip * curl * 0.6, 0.01, 8));
  for (let k = 0; k < N; k++) lines.push(groove(spin + (k * TAU) / N + (flip * TAU) / (2 * M), 0.3, 0.92, flip * curl, 0.012, 14));
  const petals = outer.map((g, k) => [...g.pts, pin(spin + ((k + 0.5) * TAU) / M + flip * curl, 1.0), ...outer[(k + 1) % M].pts.slice().reverse()]);
  const buds = []; for (let k = 0; k < 6; k++) buds.push({ pts: [pin(spin * 2 + (k * TAU) / 6, 0.34)], col: 0, w: 0.012 });
  const gathers = []; for (let k = 0; k < N; k++) gathers.push(gather(spin + (k * TAU) / N + 0.2, 0.97, 0.2, 0.018));
  return {
    id: 'kiku', name: 'Chrysanthemum (kiku)', season: 'autumn', ar: 1, R, centre: [CX, CY], spin, deco: 'paper', soboro: '#a9c545', stamen: '#7fa32e', petals, flip,
    palette: [{ name: 'Lemon yellow', color: '#f5d853' }, { name: 'Apricot', color: '#ef9f3b' }, { name: 'Plum violet', color: '#9a6bb2' }, { name: 'Cream', color: '#f8efd6' }],
    layers: [
      { name: 'Tint the dough', kind: 'tint', colors: [0, 1, 2, 3], strokes: [], regions: [{ pts: discPts(CX, CY, R, 64), col: 0, label: 'outer dough' }, { pts: discPts(CX, CY, R * 0.5, 48, 0.05), col: 1, label: 'inner layer' }], hint: 'Pick a colour, then tap the shape it belongs to: lemon outside, apricot inside' },
      { name: 'Wrap the bean filling', kind: 'wrap', tool: 'bera', strokes: gathers, regions: [], hint: 'Bamboo spatula: drag from the rim to the middle to fold each flap over the filling' },
      { name: 'Press the petals', kind: 'press', tool: 'sankaku', strokes: [...outer, ...inner], regions: [], hint: 'Triangle stick: press each lit petal line, outer ring then inner ring' },
      { name: 'Scrape the fine petals', kind: 'scrape', tool: 'sanbon', strokes: lines, regions: [], hint: 'Three-pronged scraper: draw along each lit line to lay the fine petal threads' },
      { name: 'Sift the heart', kind: 'sieve', tool: 'sieve', strokes: [], regions: [{ pts: discPts(CX, CY, R * 0.3, 32), col: 0, label: 'heart' }], hint: 'Fine sieve: rub back and forth over the heart to push out the green strands' },
      { name: 'Set the centre buds', kind: 'stamen', tool: 'tweezers', strokes: buds, regions: [], hint: 'Tweezers: tap each lit mark to set a bud' },
    ],
  };
}

export const KITCHEN_SWEET_DESIGNS = { taffy, camellia, kiku };
export const NERIKIRI_IDS = ['camellia', 'kiku'];
void curve; void stroke;

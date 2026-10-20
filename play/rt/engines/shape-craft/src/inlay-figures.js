// shape-craft `inlay` figure tables: Bidriware silver wire on a blackened zinc plate (mode wire) and Najeon chilgi mother-of-pearl pieces on
// black lacquer (mode shell). Coordinates are design units (x 0..ar, y 0..1), as in the paint figure tables.
import { stroke, ring, polar, jit, TAU } from './paint-shapes.js';
import { catmull } from './paint-stroke.js';

const lens = (cx, cy, a, r0, r1, wid, n = 9) => { // closed petal outline between radius r0 and r1 at angle a
  const left = [], right = [], ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
  for (let i = 0; i <= n; i++) { const t = i / n, r = r0 + (r1 - r0) * t, w = (wid / 2) * Math.pow(Math.sin(Math.PI * t), 0.8); left.push([cx + ux * r + nx * w, cy + uy * r + ny * w]); right.push([cx + ux * r - nx * w, cy + uy * r - ny * w]); }
  return [...left, ...right.reverse().slice(1, -1)];
};
const closed = (pts) => stroke([...pts, pts[0]], { closed: true, col: null });

export function bidri(rng, v = 1) {
  const j = jit(rng, v, 0.01), C = [0.5, 0.5], lines = [];
  lines.push({ ...ring(...C, 0.055, 0.055, { col: null }), name: 'centre' });
  for (let k = 0; k < 8; k++) lines.push({ ...closed(catmullClosed(lens(...C, (k * TAU) / 8, 0.075, 0.225 + j, 0.075 + 0.015 * (k % 2)))), name: 'petal' });
  const vine = []; for (let i = 0; i <= 64; i++) { const a = (i / 64) * TAU, r = 0.335 + 0.026 * Math.sin(a * 8); vine.push(polar(...C, r, a)); }
  lines.push({ ...stroke(vine, { col: null, closed: true }), name: 'vine' });
  for (let k = 0; k < 8; k++) lines.push({ ...closed(catmullClosed(lens(...C, ((k + 0.5) * TAU) / 8, 0.36, 0.45, 0.075))), name: 'leaf' });
  lines.push({ ...ring(...C, 0.2615, 0.2615, { col: null }), name: 'inner ring' });
  lines.push({ ...ring(...C, 0.475, 0.475, { col: null }), name: 'border' });
  return { id: 'bidri', mode: 'wire', name: 'Bidri plate', ar: 1, shape: 'ellipse', lines, pieces: [] };
}
const catmullClosed = (pts) => catmull(pts, true, 4).slice(0, -1);

export function najeon(rng, v = 1) {
  const j = jit(rng, v, 0.012), C = [0.5, 0.5], pieces = [];
  const add = (pts, name) => { const pp = pts, cx = pp.reduce((s, p) => s + p[0], 0) / pp.length, cy = pp.reduce((s, p) => s + p[1], 0) / pp.length; pieces.push({ pts: pp, at: [cx, cy], name }); };
  add(Array.from({ length: 24 }, (_, i) => polar(...C, 0.055, (i / 24) * TAU)), 'centre');
  for (let k = 0; k < 8; k++) add(lens(...C, (k * TAU) / 8, 0.07, 0.17, 0.05), 'inner petal');
  for (let k = 0; k < 8; k++) add(lens(...C, ((k + 0.5) * TAU) / 8, 0.11, 0.285 + j, 0.062), 'outer petal');
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(lens(0.5 + sx * 0.36, 0.5 + sy * 0.36, Math.atan2(-sy, -sx), 0.0, 0.17, 0.085), 'leaf');
  const lines = pieces.map((p) => ({ ...closed(p.pts), name: p.name }));
  return { id: 'najeon', mode: 'shell', name: 'Najeon panel', ar: 1, shape: 'rect', lines, pieces };
}
export const INLAY_DESIGNS = { bidri, najeon };
export const INLAY_IDS = Object.keys(INLAY_DESIGNS);

// shape-craft carve silhouettes for woodcraft and stone (1.9.0). Unit square, later shapes override earlier ones, v: 0 cuts a hole.
// lovespoon (Wales) expects a tall block (cols 11, rows 22); door (Swahili coast) cols 14, rows 20; family (Shona stone) cols 14, rows 20.
import { registerFigure, registerProfile } from './registry.js';

const E = (x, y, rx, ry, v = 1) => ({ k: 'e', x, y, rx, ry, v });
const R = (x, y, w, h, v = 1) => ({ k: 'p', pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], v });
const Pg = (pts, v = 1) => ({ k: 'p', pts, v });

registerFigure('lovespoon', { mirror: true, shapes: (j) => [
  E(0.5, 0.79, 0.3, 0.2), R(0.44, 0.56, 0.12, 0.16), R(0.4, 0.1, 0.2, 0.52),
  E(0.5, 0.5, 0.2 + j[0] * 0.01, 0.055), E(0.5, 0.37, 0.2, 0.055), E(0.5, 0.25, 0.2, 0.05),
  E(0.4, 0.1, 0.15, 0.065), E(0.6, 0.1, 0.15, 0.065), Pg([[0.26, 0.13], [0.74, 0.13], [0.5, 0.25]]),
  E(0.5, 0.105, 0.05, 0.03, 0), E(0.5, 0.82, 0.19, 0.1, 0), E(0.5, 0.5, 0.11, 0.022, 0), E(0.5, 0.37, 0.11, 0.022, 0),
] });

registerFigure('door', { mirror: true, shapes: (j) => [
  R(0.08, 0.2, 0.84, 0.78), E(0.5, 0.22, 0.42, 0.2 + j[0] * 0.01),
  R(0.485, 0.3, 0.03, 0.68, 0),
  R(0.16, 0.34, 0.27, 0.18, 0), R(0.57, 0.34, 0.27, 0.18, 0), R(0.16, 0.6, 0.27, 0.28, 0), R(0.57, 0.6, 0.27, 0.28, 0),
  E(0.295, 0.43, 0.055, 0.04), E(0.705, 0.43, 0.055, 0.04), E(0.295, 0.74, 0.055, 0.04), E(0.705, 0.74, 0.055, 0.04),
] });

registerFigure('family', { mirror: false, shapes: (j) => [
  E(0.34, 0.15, 0.095, 0.075), Pg([[0.22, 0.25], [0.46, 0.25], [0.55, 0.62], [0.5, 0.96], [0.2, 0.96], [0.15, 0.6]]),
  E(0.74, 0.5 + j[0] * 0.02, 0.07, 0.055), Pg([[0.64, 0.57], [0.84, 0.57], [0.87, 0.96], [0.62, 0.96]]),
  Pg([[0.46, 0.4], [0.64, 0.5], [0.66, 0.58], [0.5, 0.52]]), E(0.34, 0.15, 0.03, 0.025, 0), E(0.54, 0.72, 0.05, 0.12, 0),
] });

// turned toy: a peg tip, a fat belly and a slim neck (Channapatna tops and rattles)
registerProfile('toptoy', [0.16, 0.52, 0.9, 1, 0.84, 0.46, 0.3]);

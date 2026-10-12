// Small builders for board geometry. Coordinates are normalised to the board rectangle (0..1 on both axes).
// Node ids are strings ("c,r" for grids) so rules modules can build them without a lookup table.

export const gid = (c, r) => `${c},${r}`;

// Intersection grid (points on lines) or cell grid (squares). cols x rows nodes.
export function gridNodes({ cols, rows, shape = 'dot', pad = 0.08, r = null, tone = false }) {
  const nodes = [];
  const sx = cols > 1 ? (1 - 2 * pad) / (cols - 1) : 0;
  const sy = rows > 1 ? (1 - 2 * pad) / (rows - 1) : 0;
  const rad = r ?? Math.min(sx || 1, sy || 1) * (shape === 'cell' ? 0.5 : 0.38);
  for (let row = 0; row < rows; row++) for (let c = 0; c < cols; c++) {
    nodes.push({ id: gid(c, row), x: pad + c * sx, y: pad + row * sy, r: rad, shape, ...(tone ? { tone: (c + row) % 2 } : {}), c, row });
  }
  return nodes;
}

// Orthogonal (and optionally diagonal) neighbour lines between grid nodes.
export function gridLines({ cols, rows, diagonals = 'none' }) {
  const lines = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (c + 1 < cols) lines.push([gid(c, r), gid(c + 1, r)]);
    if (r + 1 < rows) lines.push([gid(c, r), gid(c, r + 1)]);
    if (diagonals === 'all' || (diagonals === 'even' && (c + r) % 2 === 0)) {
      if (c + 1 < cols && r + 1 < rows) lines.push([gid(c, r), gid(c + 1, r + 1)]);
      if (c - 1 >= 0 && r + 1 < rows) lines.push([gid(c, r), gid(c - 1, r + 1)]);
    }
  }
  return lines;
}

export const inBounds = (c, r, cols, rows) => c >= 0 && r >= 0 && c < cols && r < rows;
export const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
export const DIRS8 = [...DIRS4, [1, 1], [-1, -1], [1, -1], [-1, 1]];
export const other = (p) => 1 - p;
export const clone = (x) => JSON.parse(JSON.stringify(x));

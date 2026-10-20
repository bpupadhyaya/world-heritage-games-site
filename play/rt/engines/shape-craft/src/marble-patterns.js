// shape-craft `marble` (1.16.0): the scripted patterns of paper marbling. A pattern is a list of steps in tray units (u 0..1 across, v 0..AR down, AR 1.25):
//   { t: 'drop', c: colour index, x, y, r }                       one drop of paint on the size (it pushes every earlier drop outwards)
//   { t: 'stylus', pts: [[x, y], ...] }                           a needle drawn through the paint along the path (it drags the colours with it)
//   { t: 'comb', pts: [[x, y], ...], tines, gap }                 a comb of `tines` needles `gap` apart, drawn along the path
// The same routines run the target and the player's strokes, so a player who copies the script gets the target exactly.
export const AR = 1.25;
const R = { S: 0.055, M: 0.1, L: 0.17 };
const grid = (cols, rows, x0, y0, x1, y1) => { const out = []; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) out.push([x0 + ((x1 - x0) * (i + 0.5)) / cols, y0 + ((y1 - y0) * (j + 0.5)) / rows]); return out; };

export const PATTERNS = {
  // karanfil (carnation): a field of large drops, then flowers of nested drops with a needle pulled outward and back in so the petals are scalloped
  karanfil: (variation = 0) => {
    const steps = [], v = variation * 0.02;
    grid(3, 4, 0.1, 0.12, 0.9, 1.13).forEach(([x, y], i) => { if (i === 4 || i === 7) return; steps.push({ t: 'drop', c: (i + Math.floor(i / 3)) % 2 ? 1 : 3, x, y, r: R.L }); });
    const flower = (x, y, rs, reach, n) => {
      steps.push({ t: 'drop', c: 0, x, y, r: rs[0] }, { t: 'drop', c: 2, x, y, r: rs[1] }, { t: 'drop', c: 3, x, y, r: rs[2] });
      for (let k = 0; k < n; k++) { const a = (k * 2 * Math.PI) / n + 0.2, c = Math.cos(a), s = Math.sin(a); steps.push({ t: 'stylus', pts: k % 2 ? [[x + c * reach * 1.2, y + s * reach * 1.2], [x + c * reach * 0.82, y + s * reach * 0.82]] : [[x + c * reach * 0.42, y + s * reach * 0.42], [x + c * reach * 1.05, y + s * reach * 1.05]] }); }
    };
    flower(0.5 + v, 0.63, [R.L, R.M, R.S], 0.16, 14);
    return steps;
  },
  // gel-git (to and fro): rows of big drops, then a comb drawn down and back up so the stripes swing like waves
  gelgit: (variation = 0) => {
    const steps = [], pos = grid(3, 4, 0.08, 0.1, 0.92, 1.15);
    pos.forEach(([x, y], i) => steps.push({ t: 'drop', c: Math.floor(i / 3) % 4, x, y, r: R.L }));
    steps.push({ t: 'comb', pts: [[0.5, 0.06], [0.5, 1.19]], tines: 6, gap: 0.16 });
    steps.push({ t: 'comb', pts: [[0.58, 1.19], [0.58, 0.06]], tines: 6, gap: 0.16 });
    return steps;
  },
  // battal (stone): nested drops side by side so the colours press into a mosaic of rounded cells
  battal: (variation = 0) => {
    const steps = [];
    for (const [x, y] of grid(3, 4, 0.1, 0.12, 0.9, 1.13)) steps.push({ t: 'drop', c: 0, x, y, r: R.L }, { t: 'drop', c: 1, x, y, r: R.M }, { t: 'drop', c: 2, x, y, r: R.S });
    for (const [x, y] of [[0.5, 0.375], [0.5, 0.875]]) steps.push({ t: 'drop', c: 3, x, y, r: R.M });
    return steps;
  },
};
export const PATTERN_IDS = Object.keys(PATTERNS);
export const DROP_R = R;

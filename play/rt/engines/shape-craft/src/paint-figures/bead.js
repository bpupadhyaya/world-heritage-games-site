// shape-craft `paint` figure table for beadwork (1.23.0): a flat disc collar of coloured glass beads on a leather ground (`maasai`).
// The beads are small round regions: each one is an empty dark hole until it is threaded with the right colour (tap it); the strands are stitched first.
//   maasai (Kenya)  four strands of beads round a collar: white, red and white, blue, orange with yellow; thread rings, a stitched leather edge.   none, hide
import { ring, blob, polar, TAU } from '../paint-shapes.js';

export function maasai() {
  const C = [0.5, 0.5], radii = [0.2, 0.28, 0.36, 0.44], br = 0.034, thread = [], beads = [[], [], []];
  const pal = { white: 0, red: 1, blue: 2, orange: 3, yellow: 4, green: 5, black: 6 };
  const colour = (ring_, k, n) => {
    if (ring_ === 0) return pal.white;
    if (ring_ === 1) return k % 2 ? pal.white : pal.red;
    if (ring_ === 2) return k % 6 === 0 ? pal.black : pal.blue;
    return k % 4 === 0 ? pal.yellow : k % 4 === 2 ? pal.green : pal.orange;
  };
  radii.forEach((r, i) => {
    thread.push(ring(C[0], C[1], r, r, { col: 7, w: 0.004, noSym: true }));
    const n = Math.round((TAU * r) / (br * 2 + 0.0035)), step = TAU / n, a0 = -Math.PI / 2 + (i % 2) * step * 0.5;
    const layer = i < 2 ? 0 : i - 1;
    for (let k = 0; k < n; k++) { const a = a0 + k * step, p = polar(...C, r, a); beads[layer].push(blob(p[0], p[1], br, br, { col: colour(i, k, n), label: 'bead', base: '#241810', noSym: true }, 0, 18)); }
  });
  thread.push(ring(C[0], C[1], 0.488, 0.488, { col: 7, w: 0.005, noSym: true }), ring(C[0], C[1], 0.146, 0.146, { col: 7, w: 0.005, noSym: true }));
  return {
    id: 'maasai', variant: 'collar', name: 'Beaded collar', ar: 1, ground: '#7a4a24', surface: { kind: 'hide', shape: 'ellipse' }, symmetry: { kind: 'none' },
    palette: [{ name: 'white', color: '#f6f1e6', bead: true }, { name: 'red', color: '#c4231f', bead: true }, { name: 'blue', color: '#1f4fb4', bead: true }, { name: 'orange', color: '#f08a1e', bead: true }, { name: 'yellow', color: '#f4cc2a', bead: true }, { name: 'green', color: '#1f8a46', bead: true }, { name: 'black', color: '#1a1614', bead: true }, { name: 'thread', color: '#ece4d2', flat: true }],
    layers: [
      { name: 'Stitch the strands', tool: 'pen', colors: [7], strokes: thread, regions: [], hint: 'A ring of thread for every strand, and the stitched edges' },
      { name: 'Thread the inner strands', tool: 'brush', colors: [0, 1, 2, 3, 4, 5, 6], strokes: [], regions: beads[0], hint: 'White beads in the first strand, then red and white in turn' },
      { name: 'Thread the blue strand', tool: 'brush', colors: [0, 1, 2, 3, 4, 5, 6], strokes: [], regions: beads[1], hint: 'Blue beads with a black bead at every sixth place' },
      { name: 'Thread the outer strand', tool: 'brush', colors: [0, 1, 2, 3, 4, 5, 6], strokes: [], regions: beads[2], hint: 'Orange beads with yellow at every fourth place and green between' },
    ],
  };
}

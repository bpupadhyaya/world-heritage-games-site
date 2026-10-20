// shape-craft 1.11.0 carve silhouettes on a finer grid. Authored in cell units (W x H) and scaled to the unit square, so a circle is a circle.
// lovespoon-fine W 20 x H 50 (heart finial, twin chain links, ball in a cage, bowl with a heart cut out);
// door-arched    W 24 x H 34 (rope-dot frame, zigzag lintel, arched leaves with a post, raised panels in grooves, stud sockets);
// family-fine    W 20 x H 28 (a parent with a long neck whose arm circles a child, a slit of sky between them).
import { registerFigure, EXT } from './registry.js';
const EXT_BASE = () => EXT.figures['door-arched'];

const mk = (W, H) => {
  const X = (x) => x / W, Y = (y) => y / H;
  return {
    E: (x, y, rx, ry, v = 1) => ({ k: 'e', x: X(x), y: Y(y), rx: X(rx), ry: Y(ry), v }),
    R: (x, y, w, h, v = 1) => ({ k: 'p', pts: [[X(x), Y(y)], [X(x + w), Y(y)], [X(x + w), Y(y + h)], [X(x), Y(y + h)]], v }),
    P: (pts, v = 1) => ({ k: 'p', pts: pts.map(([x, y]) => [X(x), Y(y)]), v }),
  };
};
// a heart from two circles and a point, in cell units; s scales it
const heart = (g, cx, cy, s, v = 1) => [
  g.E(cx - 0.52 * s, cy, 0.56 * s, 0.56 * s, v), g.E(cx + 0.52 * s, cy, 0.56 * s, 0.56 * s, v),
  g.P([[cx - 1.02 * s, cy + 0.3 * s], [cx + 1.02 * s, cy + 0.3 * s], [cx, cy + 1.9 * s]], v),
];

{
  const g = mk(20, 50), { E, R, P } = g;
  registerFigure('lovespoon-fine', { mirror: true, shapes: (j) => {
    const a = 19 + j[0] * 0.4, b = 26 + j[1] * 0.4;
    return [
      ...heart(g, 10, 4.2, 5.6), ...heart(g, 10, 4.9, 2.4, 0),             // heart finial with a heart cut out
      R(8.6, 10, 2.8, 6), R(4.6, 11.4, 10.8, 1.8), E(4.6, 12.3, 1.3, 1.3), E(15.4, 12.3, 1.3, 1.3),   // neck and cross-bar finial
      E(10, a, 3.4, 4.5), E(10, a, 1.6, 2.7, 0),                             // chain link one (long ring)
      E(10, b, 4.3, 3.7), E(10, b, 2.4, 1.9, 0),                             // chain link two (wide ring)
      R(8.7, 30, 2.6, 3),                                                    // stem
      E(10, 36, 3.8, 4.2), E(10, 36, 2.6, 3.0, 0), E(10, 36, 1.4, 1.5),     // cage with a ball inside
      R(8.7, 39.5, 2.6, 3),                                                  // neck of the bowl
      E(10, 45, 6.9, 4.9), ...heart(g, 10, 43.4, 3.0, 0),                    // bowl with a heart opening
    ];
  } });
}

{
  const g = mk(24, 34), { E, R, P } = g;   // use with cols 30, rows 42 (a cell is 0.8 design units)
  registerFigure('door-arched', { mirror: true, shapes: (j) => {
    const out = [
      R(0.5, 0.5, 23, 33),                                                   // frame block
      ...[2.8, 5.0, 7.2].map((x) => P([[x - 0.9, 3.7], [x + 0.9, 3.7], [x, 2.0]], 0)),   // zigzag along the lintel (mirrored)
      ...[3.9, 6.1].map((x) => P([[x - 0.9, 1.6], [x + 0.9, 1.6], [x, 3.3]], 0)),
      E(12, 3.1, 2.1, 1.7, 0), E(12, 3.1, 0.9, 0.7),                         // rosette over the arch
      // the groove round the leaves and the arch itself
      E(12, 14.0, 9.2, 7.6, 0), R(2.8, 14.0, 18.4, 20.4, 0),
      E(12, 14.0, 7.8, 6.2), R(4.2, 14.0, 15.6, 20.4),
      R(11.2, 10.5, 1.6, 24, 0),                                              // the post between the leaves
    ];
    // sunken panel grooves with raised centres (and a lozenge cut in each), stud sockets on the rails between
    for (const px of [5.2, 12.8]) for (const [py, ph] of [[14.6, 6.0], [23.6, 8.8]]) {
      out.push(R(px, py, 6.0, ph, 0), R(px + 1.1, py + 1.1, 3.8, ph - 2.2),
        P([[px + 3, py + ph / 2 - 1.5], [px + 4.0, py + ph / 2], [px + 3, py + ph / 2 + 1.5], [px + 2.0, py + ph / 2]], 0));
    }
    for (const px of [8.2, 15.8]) out.push(E(px, 22.0 + j[0] * 0.15, 0.7, 0.7, 0), E(px, 33.0, 0.7, 0.7, 0));
    out.push(E(8.0, 11.2, 0.7, 0.7, 0), E(16.0, 11.2, 0.7, 0.7, 0));
    return out;
  } });
}

{
  const g = mk(20, 28), { E, R, P } = g;   // use with cols 26, rows 36
  registerFigure('family-fine', { mirror: false, shapes: (j) => [
    E(5.6, 3.4, 2.3, 2.8),                                                   // parent's head
    R(4.8, 5.6, 1.6, 2.6),                                                   // long neck
    P([[2.0, 9.2], [5.6, 8.0], [9.2, 9.2], [9.8, 16], [9.0, 27.5], [2.4, 27.5], [1.6, 16]]),   // parent's body
    E(15.4, 11.6 + j[0] * 0.2, 2.1, 2.5),                                    // child's head
    R(14.6, 13.8, 1.6, 2.0),
    P([[12.4, 16.2], [15.4, 15.2], [18.4, 16.2], [18.8, 27.5], [12.4, 27.5]]),   // child's body
    P([[8.8, 12.4], [12.9, 15.8], [12.9, 18.2], [8.8, 15.4]]),               // the parent's arm reaching the child's shoulder
    R(2.4, 26.2, 16.4, 1.6),                                                 // one stone base
  ] });
}

// 1.14.0: a Lamu-style studded door (use cols 36, rows 50): a lintel with a row of teeth over a band of lozenges, posts with a chain of
// lozenges, a raised central post between two leaves, a concentric lozenge boss on each half leaf and rows of brass studs (params.studs).
// `studs` are [x, y, radius] in the unit square and are drawn as raised brass where the wood stays. Connected: nothing falls out.
{
  const g = mk(24, 34), { E, R, P } = g, X = (x) => x / 24, Y = (y) => y / 34;
  const diamond = (cx, cy, hx, hy, v = 0) => P([[cx - hx, cy], [cx, cy - hy], [cx + hx, cy], [cx, cy + hy]], v);
  const bosses = [[7.3, 13.2], [16.7, 13.2], [7.3, 25.4], [16.7, 25.4]];
  registerFigure('door-lamu', {
    mirror: true,
    shapes: (j) => {
      const out = [R(0.5, 0.5, 23, 33)];
      for (let k = 0; k < 7; k++) out.push(P([[1.9 + k * 3.3, 1.9], [4.1 + k * 3.3, 1.9], [3.0 + k * 3.3, 3.7]], 0));   // teeth along the lintel
      for (let k = 0; k < 7; k++) out.push(diamond(3.0 + k * 3.3, 5.3, 1.15, 0.85, 0));                                         // lozenge band under the teeth (raised on the dark)
      for (let k = 0; k < 8; k++) { const y = 9.3 + k * 3.0 + j[0] * 0.1; out.push(diamond(2.0, y, 0.75, 1.1, 0), diamond(22.0, y, 0.75, 1.1, 0)); }   // chain on the posts
      out.push(R(10.0, 7.2, 1.0, 25.6, 0), R(13.0, 7.2, 1.0, 25.6, 0));                                                   // gaps either side of the central post
      for (let k = 0; k < 8; k++) out.push(diamond(12, 9.6 + k * 3.0, 0.45, 1.0, 0));                                      // chain on the central post
      for (const [bx, by] of bosses) out.push(diamond(bx, by, 3.0, 4.1, 0), diamond(bx, by, 1.9, 2.6, 1), diamond(bx, by, 0.8, 1.15, 0));   // concentric lozenge boss
      return out;
    },
    studs: (() => {
      const out = [];
      for (const lx of [4.6, 9.0, 15.0, 19.4]) for (let y = 8.2; y < 33; y += 2.1) {
        if (bosses.some(([bx, by]) => Math.abs(lx - bx) < 3.7 && Math.abs(y - by) < 4.9)) continue;
        out.push([lx, y]);
      }
      for (const [bx, by] of bosses) for (const [dx, dy] of [[0, -5.4], [0, 5.4]]) out.push([bx, by + dy]);
      return out.map(([px, py]) => [X(px), Y(py), 0.0165]);
    })(),
  });
  void E;
}

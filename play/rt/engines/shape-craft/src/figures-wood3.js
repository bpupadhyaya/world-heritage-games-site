// shape-craft 1.14.0 carve silhouettes for the Carved Wood bucket. Authored in cell units (W x H) and scaled to the unit square.
// forcola    W 24 x H 30  (Venetian oarlock: foot, knee, a swept horn and a small rising arm; cols 32 rows 40)
// clog       W 30 x H 16  (wooden shoe in profile: raised toe, heel, the scoop for the foot; cols 48 rows 26)
// akan-stool W 26 x H 20  (seat with a hollow top, central column with openwork, curved base; cols 40 rows 30)
// zafimaniry W 24 x H 32  (house panel as a lattice of lozenges with a medallion and borders; cols 32 rows 42)
// szekler-gate W 30 x H 34 (gable roof with a sun disc, three posts with ball caps, gate leaves with rosettes; cols 38 rows 44)
// decoy      W 30 x H 16  (duck decoy in profile with feather cuts; cols 48 rows 26)
// chip-rosette W 24 x H 24 (square board with a six-petal compass rosette and a ring of triangular chips; cols 36 rows 36)
import { registerFigure as register } from './registry.js';

// every table keeps a one-cell margin so the lit outline never runs along the edge of the block
const inset = (sh) => { const f = (v) => 0.035 + v * 0.93; return sh.k === 'e' ? { ...sh, x: f(sh.x), y: f(sh.y), rx: sh.rx * 0.93, ry: sh.ry * 0.93 } : { ...sh, pts: sh.pts.map(([x, y]) => [f(x), f(y)]) }; };
export const registerFigure = (name, fig) => register(name, { ...fig, shapes: (j) => fig.shapes(j).map(inset) });

export const mk = (W, H) => {
  const X = (x) => x / W, Y = (y) => y / H;
  const P = (pts, v = 1) => ({ k: 'p', pts: pts.map(([x, y]) => [X(x), Y(y)]), v });
  // a closed Catmull-Rom curve through the points, sampled into a polygon
  const C = (pts, v = 1, n = 7) => {
    const m = pts.length, out = [];
    for (let i = 0; i < m; i++) {
      const p0 = pts[(i + m - 1) % m], p1 = pts[i], p2 = pts[(i + 1) % m], p3 = pts[(i + 2) % m];
      for (let s = 0; s < n; s++) {
        const t = s / n, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
      }
    }
    return P(out, v);
  };
  return {
    E: (x, y, rx, ry, v = 1) => ({ k: 'e', x: X(x), y: Y(y), rx: X(rx), ry: Y(ry), v }),
    R: (x, y, w, h, v = 1) => P([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], v),
    P, C,
    // a swept limb: a Catmull-Rom centreline through [x, y, r] points drawn as a chain of discs (organic horns, necks, stems)
    L: (pts, v = 1, n = 14) => {
      const out = [], m = pts.length;
      for (let i = 0; i < m - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(m - 1, i + 2)];
        for (let s = 0; s <= n; s++) {
          const t = s / n, t2 = t * t, t3 = t2 * t;
          const q = [0, 1, 2].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3));
          out.push({ k: 'e', x: X(q[0]), y: Y(q[1]), rx: X(Math.max(0.2, q[2])), ry: Y(Math.max(0.2, q[2])), v });
        }
      }
      return out;
    },
    D: (cx, cy, hx, hy, v = 1) => P([[cx - hx, cy], [cx, cy - hy], [cx + hx, cy], [cx, cy + hy]], v),
  };
};

{ // forcola: a walnut oarlock: foot plate, a stem that sweeps into a long left horn and a shorter right horn around the oar cradle, a side ring
  const { E, R, L } = mk(24, 30);
  registerFigure('forcola', { mirror: false, shapes: (j) => [
    R(5.2, 27.4, 13.6, 2.0), E(5.2, 28.4, 1.0, 1.0), E(18.8, 28.4, 1.0, 1.0),                                                       // foot plate
    ...L([[12, 28, 4.2], [12.2, 24, 3.5], [11.6, 20, 3.3], [10.4, 16.4, 3.3], [9.0, 13.0, 3.1]]),                                   // stem
    ...L([[9.0, 13.0, 3.1], [6.0, 10.0, 2.7], [3.8, 6.6, 2.4], [3.0, 3.8, 2.2], [4.6, 1.9, 2.0], [7.0 + j[0] * 0.2, 2.2, 1.6]]),     // the long left horn curling over like an ear
    ...L([[10.8, 16.0, 3.1], [13.8, 13.6, 2.8], [16.4, 10.6, 2.5], [18.2, 7.0, 2.3], [19.8, 4.0, 2.2], [21.6, 2.8, 1.8]]),           // the shorter right horn that flares outward
    E(16.0, 21.4, 3.2, 2.8), E(16.0, 21.4, 1.4, 1.2, 0),                                                                             // the ring on the side
    E(11.6, 23.2, 0.8, 2.0, 0), E(5.4, 6.6, 0.55, 1.5, 0),                                                                           // slots in the stem and horn
  ] });
}
{ // clog in profile: upturned toe, low vamp, the mouth for the foot, tall heel cup, flat sole
  const { E, P, C, D } = mk(30, 16);
  registerFigure('clog', { mirror: false, shapes: (j) => [
    C([[0.6, 5.8 + j[0] * 0.2], [2.4, 8.0], [5.6, 7.6], [9.6, 6.2], [12.8, 4.4], [15.2, 6.2], [18.4, 7.4], [21.0, 5.0], [23.4, 3.0], [26.0, 2.4], [28.0, 4.0], [28.4, 8.0], [27.8, 12.2], [26.4, 15.0], [20, 15.2], [9.0, 15.0], [4.8, 13.8], [2.2, 11.4], [0.8, 8.6]], 1, 7),
    C([[4.0, 11.0], [7.0, 9.8], [10.4, 9.8], [7.6, 11.2]], 0),                                   // a carved crescent along the toe
    D(13.4, 11.6, 0.9, 1.3, 0), D(16.6, 11.8, 0.9, 1.3, 0), D(19.8, 11.6, 0.9, 1.3, 0),           // a row of lozenges on the side
    E(25.6, 9.0, 0.7, 0.7, 0),                                                                    // a carved dot on the heel
  ] });
}
{ // akan stool
  const { E, R, P, C, D } = mk(26, 20);
  registerFigure('akan-stool', { mirror: true, shapes: (j) => [
    C([[0.6, 2.0], [2.2, 0.8], [7, 2.8], [13, 3.8], [19, 2.8], [23.8, 0.8], [25.4, 2.0], [24.4, 5.4], [13, 7.4], [1.6, 5.4]]),             // seat with a hollow top and raised ends
    C([[1.0, 17.0], [5, 18.2], [13, 17.4], [21, 18.2], [25, 17.0], [25.4, 19.2], [21, 19.8], [13, 19.2], [5, 19.8], [0.6, 19.2]]),         // curved base
    R(8.8, 6.8, 8.4, 10.8),                                                                                   // central column
    R(3.8, 6.0, 2.8, 11.6), R(19.4, 6.0, 2.8, 11.6),                                                           // side posts
    E(13, 10.6, 2.3, 2.3, 0), E(13, 10.6, 1.0, 1.0, 1), D(13, 15.4, 1.3, 1.5, 0), D(13, 7.9, 1.2, 0.9, 0),    // openwork in the column
    D(10.4, 13.6, 0.5, 1.2, 0), D(15.6, 13.6, 0.5, 1.2, 0), D(10.6, 8.8, 0.5, 0.9, 0), D(15.4, 8.8, 0.5, 0.9, 0),
  ] });
}
{ // zafimaniry panel
  const { R, P, D } = mk(24, 32);
  registerFigure('zafimaniry', { mirror: true, shapes: (j) => {
    const out = [R(0.5, 0.5, 23, 31)];
    for (let k = 0; k < 5; k++) out.push(D(2.8 + k * 4.6, 3.2, 1.5, 1.7, 0));                                // top row of lozenges
    for (let k = 0; k < 6; k++) out.push(P([[1.2 + k * 4.0, 6.6], [3.2 + k * 4.0, 6.6], [2.2 + k * 4.0, 8.4]], 0));   // hanging triangles
    out.push(D(12, 16.2, 8.2, 8.0, 0), D(12, 16.2, 6.2, 6.0, 1), D(12, 16.2, 4.4, 4.2, 0), D(12, 16.2, 2.2, 2.2, 1), D(12, 16.2, 0.9, 0.9, 0));   // a medallion of nested lozenges
    for (const [x, y] of [[3.4, 12.6], [20.6, 12.6], [3.4, 19.8], [20.6, 19.8]]) out.push(D(x, y, 1.5, 1.7, 0));   // lozenges at the corners of the medallion
    for (let k = 0; k < 6; k++) out.push(P([[1.2 + k * 4.0, 25.6], [3.2 + k * 4.0, 25.6], [2.2 + k * 4.0, 23.8]], 0));   // rising triangles
    for (let k = 0; k < 5; k++) out.push(D(2.8 + k * 4.6, 29.0 + j[0] * 0.05, 1.5, 1.5, 0));                  // bottom row
    return out;
  } });
}
{ // szekler gate
  const { E, R, P, C, D } = mk(30, 34);
  registerFigure('szekler-gate', { mirror: false, shapes: (j) => {
    const out = [
      P([[0.4, 8.8], [15, 1.4], [29.6, 8.8], [29.6, 10.4], [15, 3.2], [0.4, 10.4]]),                        // gable roof
      E(15, 6.6, 2.3, 2.3), E(15, 6.6, 1.5, 1.5, 0), E(15, 6.6, 0.7, 0.7), E(8.4, 8.0, 0.6, 0.6, 0), E(21.6, 8.0, 0.6, 0.6, 0),   // sun disc in the gable
      R(1.0, 10.6, 28, 3.6),                                                                                // the headboard under the roof
      R(1.0, 14.0, 4.0, 20), R(17.4, 14.0, 4.0, 20), R(25.6, 14.0, 3.4, 20),                                 // three posts
      E(3.0, 13.7, 2.0, 2.0), E(19.4, 13.7, 2.1, 2.1), E(27.3, 13.8, 1.7, 1.7),                              // ball caps
      E(11.2, 20.4, 6.2, 5.8, 0), R(5.0, 20.4, 12.4, 13.6, 0),                                               // the big gate opening, arched
      E(23.5, 20.4, 2.1, 2.1, 0), R(21.4, 20.4, 4.2, 13.6, 0),                                               // the small gate opening, arched
      R(7.7, 15, 0.9, 18, 1), R(10.8, 15, 0.9, 18, 1), R(13.9, 15, 0.9, 18, 1), R(5.0, 27.4, 12.4, 0.9, 1), // slats and a rail of the big gate
      R(23.1, 18, 0.8, 16, 1), R(21.4, 27.4, 4.2, 0.8, 1),                                                    // the small gate
      E(9.2, 23.4, 1.1, 1.1, 0), E(12.4, 23.4, 1.1, 1.1, 0),
    ];
    for (let k = 0; k < 6; k++) out.push(C([[2.6 + k * 4.6, 11.4], [3.5 + k * 4.6, 12.1], [3.2 + k * 4.6, 13.3], [2.6 + k * 4.6, 13.7], [2.0 + k * 4.6, 13.3], [1.7 + k * 4.6, 12.1]], 0));   // tulip fretwork in the headboard
    return out;
  } });
}
{ // decoy: a plump floating duck, round head, bill, upswept tail, wing cuts
  const { E, R, P, C, L } = mk(30, 20);
  registerFigure('decoy', { mirror: false, shapes: (j) => [
    E(13.0, 13.4, 11.8, 6.2), E(19.5, 12.6, 6.4, 6.4), R(3.4, 17.0, 17.8, 2.2),                                                       // body, breast, flat waterline
    ...L([[19.4, 11.0, 3.4], [21.4, 7.6, 2.6], [22.6, 4.6, 2.4]]),                                                                    // the neck
    E(23.2, 4.2, 3.7, 3.3),                                                                                                           // head
    P([[25.6, 2.8], [29.8, 4.2], [29.6, 6.0], [25.8, 6.4]]),                                                                          // bill
    P([[2.6, 11.0], [0.6, 6.0 + j[0] * 0.2], [1.8, 5.4], [5.4, 9.2]]),                                                                // upswept tail
    E(23.6, 3.4, 0.55, 0.55, 0),
    ...L([[7.0, 13.0, 0.45], [10.6, 11.8, 0.65], [14.6, 11.8, 0.65], [17.2, 13.0, 0.45]], 0),                                         // wing cut
    ...L([[8.6, 15.4, 0.4], [12.0, 14.6, 0.6], [15.4, 14.8, 0.5]], 0),
  ] });
}
{ // chip carving rosette
  const { R, P, D } = mk(24, 24);
  registerFigure('chip-rosette', { mirror: false, shapes: (j) => {
    const out = [R(0.6, 0.6, 22.8, 22.8)], cx = 12, cy = 12;
    const star = (R1, r1, v) => P(Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6 - Math.PI / 2, rr = i % 2 ? r1 : R1; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; }), v);
    for (let k = 0; k < 12; k++) { const a = (k * Math.PI) / 6, half = 0.2; out.push(P([[cx + Math.cos(a - half) * 10.8, cy + Math.sin(a - half) * 10.8], [cx + Math.cos(a + half) * 10.8, cy + Math.sin(a + half) * 10.8], [cx + Math.cos(a) * 8.0, cy + Math.sin(a) * 8.0]], 0)); }   // ring of triangular chips
    out.push(star(7.0, 3.6, 0), star(5.4, 2.7, 1), star(2.4, 1.4, 0), D(cx, cy, 0.8, 0.8, 1));              // a six-pointed star: groove, raised star, pocket, boss
    for (const [x, y, sx, sy] of [[1.8, 1.8, 1, 1], [22.2, 1.8, -1, 1], [1.8, 22.2, 1, -1], [22.2, 22.2, -1, -1]]) out.push(P([[x, y], [x + 3.6 * sx, y], [x, y + 3.6 * sy]], 0), P([[x + 1.2 * sx, y + 1.2 * sy], [x + 2.4 * sx, y + 1.2 * sy], [x + 1.2 * sx, y + 2.4 * sy]], 1));   // corner chips
    return out;
  } });
}

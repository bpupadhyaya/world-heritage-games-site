// shape-craft 1.14.4 carve silhouettes for more Carved Wood entries. Authored in cell units; one-cell margin like figures-wood3.
// netsuke-cat   W 24 x H 20 (a sleeping cat curled round: head, ears, tail, two cord holes; cols 36 rows 30)
// vetrunge      W 30 x H 20 (Curonian weathervane: pole, long scalloped vane with a pierced sun, forked tail; cols 45 rows 30)
// pit-boat      W 30 x H 22 (a boat carved in a fruit stone: hull, roofed cabin with windows, curled prow; cols 45 rows 33)
// bullock-cart  W 30 x H 20 (toy cart on spoked wheels with a canopy, a pole and a bullock; cols 45 rows 30)
// pith-flower   W 24 x H 24 (a flower of many petals in two rings with a ringed centre; cols 36 rows 36)
// chinar-panel  W 24 x H 30 (walnut panel with a five-lobed leaf opening, raised veins and corner leaves; cols 32 rows 40)
import { mk, registerFigure } from './figures-wood3.js';

{ // netsuke cat
  const { E, P, L } = mk(24, 20);
  registerFigure('netsuke-cat', { mirror: false, shapes: (j) => [
    E(13.0, 11.4, 9.6, 6.4), E(6.4, 10.2, 4.0, 3.6),                                                            // curled body and the head laid on the paws
    P([[3.2, 8.2], [3.8, 3.6 + j[0] * 0.2], [6.2, 6.8]]), P([[6.4, 6.6], [9.0, 3.2], [9.6, 7.6]]),                // ears
    ...L([[20.6, 14.2, 1.7], [18.0, 17.4, 1.6], [12.0, 18.2, 1.5], [7.0, 16.6, 1.3]]),                          // tail curled under the body
    E(4.6, 10.2, 0.9, 0.35, 0), E(8.0, 10.2, 0.9, 0.35, 0), P([[5.8, 11.4], [6.6, 11.4], [6.2, 12.1]], 0),       // closed eyes and nose
    E(15.4, 8.0, 0.75, 0.75, 0), E(17.4, 9.2, 0.75, 0.75, 0),                                                    // the two cord holes
    ...L([[11.4, 10.2, 0.3], [13.4, 8.8, 0.3], [14.0, 7.6, 0.3]], 0), ...L([[18.8, 11.6, 0.35], [20.6, 12.8, 0.35]], 0),   // fur strokes
  ] });
}
{ // vetrunge
  const { E, R, P, C, L } = mk(30, 20);
  registerFigure('vetrunge', { mirror: false, shapes: (j) => [
    R(2.4, 2.0, 2.2, 17.6), E(3.5, 2.0, 1.7, 1.7), R(0.8, 18.2, 5.4, 1.6),                                       // pole, ball and foot
    P([[4.6, 3.6], [12, 3.0], [20, 4.2], [28.6, 6.0], [26.4, 8.0], [28.8, 10.0], [24.6, 10.6], [24.0, 12.6], [20.0, 11.4], [16.2, 13.0], [12.2, 11.4], [8.2, 12.6], [4.6, 11.0]]),   // scalloped vane with a forked tail
    E(9.4, 7.4, 3.2, 3.2, 0), E(9.4, 7.4, 1.5, 1.5, 1),                                                          // pierced ring with a boss: the sun
    E(16.6, 7.2, 1.0, 1.0, 0), E(19.6, 7.6, 0.9, 0.9, 0), E(22.4, 7.6, 0.8, 0.8, 0),                             // small holes
    P([[25.4, 7.0], [28.0, 7.0], [26.6, 8.6]], 0),                                                               // notch in the tail
    ...L([[3.5, 1.6, 0.9], [5.6, 0.6, 0.7], [8.0, 1.0 + j[0] * 0.2, 0.5]]),                                      // a finial curl
  ] });
}
{ // fruit-stone boat
  const { E, R, P, C, L } = mk(30, 22);
  registerFigure('pit-boat', { mirror: false, shapes: (j) => [
    C([[1.2, 12.6], [5.0, 14.6 + j[0] * 0.2], [10, 17.6], [16, 18.6], [22, 17.6], [27, 14.4], [29, 11.0], [25.4, 13.0], [15, 13.6], [5.6, 13.0]], 1, 7),                                  // hull
    ...L([[1.4, 12.6, 0.9], [0.8, 9.8, 0.8], [2.2, 8.0, 0.6]]),                                                  // curled prow
    R(8.0, 7.4, 14.0, 6.0), P([[5.6, 7.8], [15, 2.8], [24.4, 7.8], [22.0, 7.6], [15, 4.4], [8.0, 7.6]]),        // cabin walls and a roof with upturned eaves
    P([[4.6, 6.4], [6.4, 7.8], [4.8, 8.0]]), P([[25.4, 6.4], [23.6, 7.8], [25.2, 8.0]]),
    R(9.4, 8.8, 2.6, 3.2, 0), R(13.7, 8.8, 2.6, 3.2, 0), R(18.0, 8.8, 2.6, 3.2, 0),                              // three windows
    R(14.7, 0.6, 0.7, 2.6), E(15.05, 0.9, 0.9, 0.9),                                                             // a lantern on the roof
    ...L([[8, 16.0, 0.35], [15, 16.8, 0.35], [22, 16.0, 0.35]], 0),
  ] });
}
{ // bullock cart toy
  const { E, R, P, C, L } = mk(30, 20);
  registerFigure('bullock-cart', { mirror: false, shapes: (j) => {
    const out = [E(8.0, 13.6, 5.6, 5.6), E(8.0, 13.6, 4.4, 4.4, 0), E(8.0, 13.6, 1.3, 1.3)];
    for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3 + 0.3; out.push(...L([[8 + Math.cos(a) * 1.2, 13.6 + Math.sin(a) * 1.2, 0.5], [8 + Math.cos(a) * 4.8, 13.6 + Math.sin(a) * 4.8, 0.5]], 1, 4)); }   // spoked wheel
    out.push(R(1.4, 8.6, 15.0, 1.6), ...L([[2.0, 8.4, 0.5], [5.0, 3.4, 0.5], [9.0, 2.2, 0.5], [13.0, 3.4, 0.5], [16.0, 8.4, 0.5]]), R(1.4, 6.8, 0.8, 2.0));   // cart bed and a canopy hoop
    out.push(...L([[16.0, 9.4, 0.5], [19.4, 10.6, 0.5], [22.0, 10.6, 0.5]]));                                                // the pole
    out.push(E(25.0, 10.4, 4.1, 3.0), E(28.4, 8.0 + j[0] * 0.2, 1.5, 1.4), P([[27.8, 6.2], [28.6, 4.2], [29.6, 6.4]]), P([[22.2, 7.6], [24.4, 6.4], [25.6, 7.8]]),   // bullock: body, head, horn, hump
      R(21.6, 12.6, 1.2, 5.6), R(23.4, 12.6, 1.2, 5.6), R(26.0, 12.6, 1.2, 5.6), R(27.6, 12.6, 1.2, 5.6), ...L([[21.0, 9.8, 0.5], [19.8, 12.4, 0.4]]));   // legs and tail
    out.push(E(28.8, 7.7, 0.35, 0.35, 0));
    return out;
  } });
}
{ // pith flower
  const { E, P } = mk(24, 24);
  registerFigure('pith-flower', { mirror: false, shapes: (j) => {
    const out = [], cx = 12, cy = 12;
    const petal = (a, r0, r1, w, v) => { const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8, r = r0 + (r1 - r0) * t, ww = Math.sin(Math.PI * Math.pow(t, 0.8)) * w; pts.push([cx + Math.cos(a) * r - Math.sin(a) * ww, cy + Math.sin(a) * r + Math.cos(a) * ww]); } for (let i = 8; i >= 0; i--) { const t = i / 8, r = r0 + (r1 - r0) * t, ww = Math.sin(Math.PI * Math.pow(t, 0.8)) * w; pts.push([cx + Math.cos(a) * r + Math.sin(a) * ww, cy + Math.sin(a) * r - Math.cos(a) * ww]); } return P(pts, v); };
    for (let k = 0; k < 12; k++) out.push(petal((k * Math.PI) / 6 - Math.PI / 2, 4, 11.2, 1.9, 1));                  // twelve long outer petals
    for (let k = 0; k < 12; k++) out.push(petal((k * Math.PI) / 6 - Math.PI / 2 + Math.PI / 12, 4, 8.4, 1.1, 1));    // twelve shorter ones between
    out.push(E(cx, cy, 4.4, 4.4, 0), E(cx, cy, 3.4, 3.4, 1), E(cx, cy, 1.6, 1.6, 0), E(cx, cy, 0.7, 0.7, 1));          // ringed centre
    return out;
  } });
}
{ // chinar leaf panel
  const { E, R, P, L } = mk(24, 30);
  registerFigure('chinar-panel', { mirror: true, shapes: (j) => {
    const cx = 12, cy = 14.4, out = [R(0.4, 0.4, 23.2, 29.2)];
    const star = (R1, r1, n, v, dy = 0) => P(Array.from({ length: n * 2 }, (_, i) => { const a = (i * Math.PI) / n - Math.PI / 2, rr = i % 2 ? r1 : R1; return [cx + Math.cos(a) * rr, cy + dy + Math.sin(a) * rr * (Math.sin(a) > 0 ? 0.9 : 1)]; }), v);
    out.push(star(10.8, 4.8, 5, 0));                                                                                  // the five-lobed leaf opening
    for (let k = 0; k < 5; k++) { const a = (k * 2 * Math.PI) / 5 - Math.PI / 2; out.push(...L([[cx, cy, 0.55], [cx + Math.cos(a) * 8.6, cy + Math.sin(a) * 8.6, 0.5]], 1, 5)); }   // raised veins
    out.push(E(cx, cy, 1.5, 1.5, 1), E(cx, cy, 0.6, 0.6, 0), R(11.2, 24.0, 1.6, 4.4, 0), E(cx, 24.0, 1.2, 1.2, 0));      // centre boss and the stalk slot
    for (const [x, y] of [[3.0, 3.4], [21.0, 3.4], [3.0, 26.6], [21.0, 26.6]]) out.push(E(x, y, 1.5, 1.5, 0), E(x, y, 0.55, 0.55, 1));   // corner rosettes
    return out;
  } });
}

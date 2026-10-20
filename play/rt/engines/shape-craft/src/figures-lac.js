// shape-craft 1.15.0 carve silhouettes for lacquerware: a carved red lacquer roundel with a peony (W 48 x H 48 cells).
// Authored in cell units; each layer of petals is preceded by a slightly larger empty gap so the layers read as separate carved forms.
import { mk, registerFigure } from './figures-wood3.js';

const TAU = Math.PI * 2;
// a broad petal: rounded at the outer end, narrow at the centre; points along the left edge out and the right edge back
const petal = (P, cx, cy, a, r0, r1, w, v, n = 12) => {
  const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux, L = [], R = [];
  for (let i = 0; i <= n; i++) { const t = i / n, r = r0 + (r1 - r0) * t, hw = (w / 2) * Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + 0.88 * t)), 0.62) * (t > 0.92 ? Math.sqrt(Math.max(0, (1 - t) / 0.08)) : 1); L.push([cx + ux * r + nx * hw, cy + uy * r + ny * hw]); R.push([cx + ux * r - nx * hw, cy + uy * r - ny * hw]); }
  return P([...L, ...R.reverse()], v);
};
{
  const { E, P, L } = mk(56, 56);
  // a curling scroll: a tapering stroke that spirals outward from radius r0 at angle a0 and ends in a hook; dir = 1 clockwise, -1 anticlockwise
  const scroll = (cx, cy, a0, dir, r0, r1, sweep, w0, w1, hook) => {
    const pts = [], N = 7;
    for (let i = 0; i <= N; i++) { const t = i / N, rho = r0 + (r1 - r0) * t, ph = a0 + dir * sweep * t; pts.push([cx + Math.cos(ph) * rho, cy + Math.sin(ph) * rho, w0 + (w1 - w0) * t]); }
    const e = pts[N], pe = pts[N - 1], tx = e[0] - pe[0], ty = e[1] - pe[1], tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl, nx = -uy * dir, ny = ux * dir;   // the hook keeps turning the same way: its centre lies to the inside of the turn
    const hc = [e[0] + nx * hook, e[1] + ny * hook], ps = Math.atan2(e[1] - hc[1], e[0] - hc[0]);
    for (let i = 1; i <= 9; i++) { const t = i / 9, ang = ps + dir * 1.9 * Math.PI * t * 0.8, rr = hook * (1 - 0.55 * t); pts.push([hc[0] + Math.cos(ang) * rr, hc[1] + Math.sin(ang) * rr, w1 * (1 - 0.35 * t)]); }
    return L(pts, 1, 6);
  };
  registerFigure('peony-roundel', { mirror: false, shapes: (j) => {
    const out = [], cx = 28, cy = 28;
    out.push(E(cx, cy, 27, 27, 1));                             // the plate
    out.push(E(cx, cy, 23.6, 23.6, 0));                         // the ground is cut back inside a raised rim
    for (let k = 0; k < 5; k++) out.push(...scroll(cx, cy, (k * TAU) / 5 + 0.2, 1, 9.0, 16.0, 1.25, 1.9, 1.5, 4.2));   // five cloud scrolls, each ending in a curl
    for (let k = 0; k < 5; k++) { const a = (k * TAU) / 5 + 0.2 - 0.5, r = 18.4; out.push(E(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.7, 1.7, 1)); }   // a pearl between the curls
    out.push(E(cx, cy, 7.4, 7.4, 1), E(cx, cy, 5.4, 5.4, 0), E(cx, cy, 4.0, 4.0, 1), E(cx, cy, 2.4, 2.4, 0), E(cx, cy, 1.4, 1.4, 1));   // the rosette at the centre: boss, groove, ring, groove, heart
    return out;
  } });
}

{
  const { E, P, L } = mk(56, 56);
  // plum blossoms on a branch in a roundel: three five-petal flowers with a boss, buds at the twig tips, a swept branch (bold forms that survive the mask blur)
  registerFigure('plum-roundel', { mirror: false, shapes: (j) => {
    const out = [], cx = 28, cy = 28;
    out.push(E(cx, cy, 27, 27, 1), E(cx, cy, 24.4, 24.4, 0));
    out.push(...L([[7, 41, 1.9], [14, 36, 1.9], [21, 31, 1.7], [29, 25, 1.6], [37, 19, 1.4], [44, 13.5, 1.2]], 1, 12));          // the main branch
    out.push(...L([[21, 31, 1.5], [22, 22, 1.3], [25, 15, 1.1]], 1, 10), ...L([[29, 25, 1.4], [33, 33, 1.3], [38, 40, 1.1]], 1, 10)); // twigs
    for (const [x, y] of [[25, 14], [38.5, 40.5], [45, 12.5]]) out.push(E(x, y, 2.3, 2.3, 1));                                       // buds
    const blossom = (bx, by, rot) => {
      out.push(E(bx, by, 8.0, 8.0, 0));
      for (let q = 0; q < 5; q++) { const a = rot + (q * TAU) / 5; out.push(E(bx + Math.cos(a) * 4.2, by + Math.sin(a) * 4.2, 3.6, 3.6, 1)); }
      out.push(E(bx, by, 3.0, 3.0, 0), E(bx, by, 1.8, 1.8, 1));
    };
    blossom(20 + j[0] * 0.6, 33, 0.3); blossom(36, 21.5 + j[1] * 0.6, 0.9); blossom(31, 40, 0.1);
    return out;
  } });
}

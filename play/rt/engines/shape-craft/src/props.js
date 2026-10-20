// shape-craft props: hand tools, supplies and workshop objects drawn with form (gradients, highlights, cast shadows).
// Every prop is drawn centred on the origin, long axis along +x, nominal length s. Pure canvas 2D: no DOM, no Math.random, no clocks
// (time arrives as an argument). Used by scenes.js for the tool dock, the wall and the tool held at the pointer.
import { hash } from './geom.js';
import { EXT } from './registry.js';
import { tint, mix, rgba, rrect } from './fx.js';

export const TAU = Math.PI * 2;
export const lg = (ctx, x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); for (const [o, c] of stops) g.addColorStop(o, c); return g; };
export const rg = (ctx, x, y, r0, r1, stops, fx = x, fy = y) => { const g = ctx.createRadialGradient(fx, fy, Math.max(0, r0), x, y, Math.max(0.1, r1)); for (const [o, c] of stops) g.addColorStop(o, c); return g; };
export const ell = (ctx, x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); };
export const cast = (ctx, x, y, rx, ry, a = 0.34) => { ctx.fillStyle = `rgba(0,0,0,${a})`; ell(ctx, x, y, rx, ry); ctx.fill(); };

const STEEL = [[0, '#f1f5f8'], [0.45, '#aeb8c2'], [1, '#626c76']];
const WOOD = (c = '#a8692f') => [[0, tint(c, 0.35)], [0.45, c], [1, tint(c, -0.45)]];
// A turned handle (vertical gradient), x0 start, length L, thickness h.
function grip(ctx, x0, L, h, c, round = 0.5) {
  rrect(ctx, x0, -h / 2, L, h, h * round); ctx.fillStyle = lg(ctx, 0, -h / 2, 0, h / 2, WOOD(c)); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x0 + h * 0.3, -h * 0.34, L - h * 0.6, Math.max(1, h * 0.1));
}
function ferrule(ctx, x, h) { ctx.fillStyle = lg(ctx, 0, -h / 2, 0, h / 2, STEEL); ctx.fillRect(x, -h / 2, h * 0.5, h); }

export const PROPS = {
  rasp(ctx, s) {
    const h = s * 0.13, hl = s * 0.3, bx = -s / 2 + hl;
    grip(ctx, -s / 2, hl, h * 1.5, '#7a4a22'); ferrule(ctx, bx - h * 0.4, h * 0.9);
    ctx.fillStyle = lg(ctx, 0, -h / 2, 0, h / 2, STEEL);
    ctx.beginPath(); ctx.moveTo(bx, -h * 0.42); ctx.lineTo(s / 2, -h * 0.3); ctx.quadraticCurveTo(s / 2 + h * 0.4, 0, s / 2, h * 0.3); ctx.lineTo(bx, h * 0.42); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(30,36,44,0.45)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let k = 0; k < 22; k++) { const xx = bx + h * 0.4 + (s / 2 - bx - h) * (k / 21); ctx.moveTo(xx, -h * 0.34); ctx.lineTo(xx - h * 0.18, h * 0.34); }
    ctx.stroke();
  },
  chisel(ctx, s) {
    const h = s * 0.1, hl = s * 0.34, bx = -s / 2 + hl;
    grip(ctx, -s / 2, hl, h * 1.7, '#8a5526'); ferrule(ctx, bx - h * 0.2, h * 1.0);
    ctx.fillStyle = lg(ctx, 0, -h / 2, 0, h / 2, STEEL);
    ctx.beginPath(); ctx.moveTo(bx + h * 0.3, -h * 0.34); ctx.lineTo(s / 2 - h * 0.7, -h * 0.4); ctx.lineTo(s / 2, -h * 0.5); ctx.lineTo(s / 2, h * 0.5); ctx.lineTo(s / 2 - h * 0.7, h * 0.4); ctx.lineTo(bx + h * 0.3, h * 0.34); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(s / 2 - h * 0.9, -h * 0.48, h * 0.9, h * 0.12);
  },
  mallet(ctx, s) { // wooden carver's mallet: a round head on a short handle
    const hh = s * 0.34, hw = s * 0.34;
    ctx.fillStyle = lg(ctx, 0, -s * 0.05, 0, s * 0.05, WOOD('#9a6a34')); ctx.fillRect(-s / 2, -s * 0.045, s * 0.62, s * 0.09);
    ctx.save(); ctx.translate(s * 0.28, 0);
    ctx.fillStyle = lg(ctx, 0, -hh / 2, 0, hh / 2, WOOD('#b07a3c')); rrect(ctx, -hw / 2, -hh / 2, hw, hh, hw * 0.22); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.stroke();
    ctx.strokeStyle = 'rgba(60,30,10,0.25)'; ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(-hw / 2, -hh * 0.3 + k * hh * 0.2); ctx.lineTo(hw / 2, -hh * 0.3 + k * hh * 0.2 + 1); } ctx.stroke();
    ctx.restore();
  },
  gouge(ctx, s) {
    const h = s * 0.1, hl = s * 0.34, bx = -s / 2 + hl;
    grip(ctx, -s / 2, hl, h * 1.7, '#6a3c1c'); ferrule(ctx, bx - h * 0.2, h);
    ctx.fillStyle = lg(ctx, 0, -h * 0.5, 0, h * 0.5, STEEL);
    ctx.beginPath(); ctx.moveTo(bx + h * 0.3, -h * 0.34); ctx.quadraticCurveTo(s / 2 - h, -h * 0.5, s / 2, -h * 0.1); ctx.lineTo(s / 2, h * 0.1); ctx.quadraticCurveTo(s / 2 - h, h * 0.5, bx + h * 0.3, h * 0.34); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.stroke();
  },
  trowel(ctx, s) { // plasterer's pointed trowel
    const bl = s * 0.6, bw = s * 0.26;
    grip(ctx, -s / 2, s * 0.26, s * 0.1, '#6d4a2a');
    ctx.strokeStyle = '#7d8791'; ctx.lineWidth = s * 0.025; ctx.beginPath(); ctx.moveTo(-s / 2 + s * 0.26, 0); ctx.lineTo(-s / 2 + s * 0.34, -s * 0.07); ctx.stroke();
    ctx.fillStyle = lg(ctx, 0, -bw / 2, 0, bw / 2, STEEL);
    ctx.beginPath(); ctx.moveTo(-s / 2 + s * 0.36, -bw * 0.5); ctx.lineTo(-s / 2 + s * 0.36 + bl * 0.4, -bw * 0.55); ctx.quadraticCurveTo(s / 2, 0, s / 2, 0); ctx.quadraticCurveTo(s / 2, 0, -s / 2 + s * 0.36 + bl * 0.4, bw * 0.55); ctx.lineTo(-s / 2 + s * 0.36, bw * 0.5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.stroke();
    ctx.fillStyle = 'rgba(196,170,140,0.8)'; ell(ctx, s * 0.28, 0, s * 0.1, bw * 0.12); ctx.fill();   // lime or mud left on the blade
  },
  pick(ctx, s) { // pointed pick / needle tool
    grip(ctx, -s / 2, s * 0.36, s * 0.07, '#a1472f');
    ctx.fillStyle = lg(ctx, 0, -2, 0, 2, STEEL); ctx.beginPath(); ctx.moveTo(-s / 2 + s * 0.36, -s * 0.018); ctx.lineTo(s / 2, 0); ctx.lineTo(-s / 2 + s * 0.36, s * 0.018); ctx.closePath(); ctx.fill();
  },
  waxloop(ctx, s) { // wax modelling tool: wooden stem with a steel loop at one end and a spatula at the other
    ctx.strokeStyle = lg(ctx, 0, -s * 0.03, 0, s * 0.03, WOOD('#a8743a')); ctx.lineWidth = s * 0.07; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-s * 0.42, 0); ctx.lineTo(s * 0.34, 0); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = '#cfd6dc'; ctx.lineWidth = s * 0.022; ctx.beginPath(); ctx.ellipse(s * 0.43, 0, s * 0.09, s * 0.06, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = lg(ctx, 0, -s * 0.04, 0, s * 0.04, STEEL); ctx.beginPath(); ctx.ellipse(-s * 0.46, 0, s * 0.06, s * 0.035, 0, 0, TAU); ctx.fill();
  },
  pliers(ctx, s) { // round-nose pliers: two red-dipped handles, a steel joint, tapering jaws
    const h = s * 0.1;
    ctx.save(); ctx.lineCap = 'round';
    for (const sg of [-1, 1]) {
      ctx.strokeStyle = '#b62d22'; ctx.lineWidth = h * 0.8; ctx.beginPath(); ctx.moveTo(-s / 2, sg * h * 1.6); ctx.quadraticCurveTo(-s * 0.2, sg * h * 0.9, -s * 0.05, sg * h * 0.25); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = h * 0.18; ctx.beginPath(); ctx.moveTo(-s / 2 + 2, sg * h * 1.6 - h * 0.22); ctx.quadraticCurveTo(-s * 0.2, sg * h * 0.9 - h * 0.2, -s * 0.07, sg * h * 0.2); ctx.stroke();
      ctx.strokeStyle = lg(ctx, 0, -h, 0, h, STEEL); ctx.lineWidth = h * 0.62; ctx.beginPath(); ctx.moveTo(-s * 0.05, sg * h * 0.25); ctx.lineTo(s / 2, sg * h * 0.04); ctx.stroke();
    }
    ctx.restore();
    const gp = rg(ctx, -s * 0.04, 0, 0, h * 0.7, [[0, '#f6f8fa'], [1, '#6c7680']]); ctx.fillStyle = gp; ell(ctx, -s * 0.04, 0, h * 0.62, h * 0.62); ctx.fill();
  },
  cutters(ctx, s) { // side cutters: handles with green grips, short steel jaws
    const h = s * 0.1;
    ctx.save(); ctx.lineCap = 'round';
    for (const sg of [-1, 1]) {
      ctx.strokeStyle = '#2b6b3a'; ctx.lineWidth = h * 0.8; ctx.beginPath(); ctx.moveTo(-s / 2, sg * h * 1.5); ctx.quadraticCurveTo(-s * 0.2, sg * h * 1.0, -s * 0.06, sg * h * 0.3); ctx.stroke();
      ctx.fillStyle = lg(ctx, 0, -h, 0, h, STEEL); ctx.beginPath(); ctx.moveTo(-s * 0.08, sg * h * 0.3); ctx.lineTo(s * 0.34, sg * h * 0.9); ctx.lineTo(s * 0.5, sg * h * 0.05); ctx.lineTo(-s * 0.02, sg * h * 0.02); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  },
  scissors(ctx, s) {
    ctx.save(); ctx.lineCap = 'round';
    for (const sg of [-1, 1]) {
      ctx.strokeStyle = '#303840'; ctx.lineWidth = s * 0.045; ell(ctx, -s * 0.36, sg * s * 0.1, s * 0.1, s * 0.07, sg * 0.5); ctx.stroke();
      ctx.fillStyle = lg(ctx, 0, -s * 0.06, 0, s * 0.06, STEEL); ctx.beginPath(); ctx.moveTo(-s * 0.26, sg * s * 0.06); ctx.lineTo(s / 2, sg * s * 0.008); ctx.lineTo(-s * 0.04, -sg * s * 0.015); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = '#d9dee3'; ell(ctx, -s * 0.12, 0, s * 0.025, s * 0.025); ctx.fill();
  },
  knife(ctx, s) { // craft knife for paper cutting
    grip(ctx, -s / 2, s * 0.52, s * 0.085, '#c8201a', 0.45);
    ctx.fillStyle = lg(ctx, 0, -s * 0.04, 0, s * 0.04, STEEL); ctx.beginPath(); ctx.moveTo(s * 0.02, -s * 0.03); ctx.lineTo(s / 2, 0); ctx.lineTo(s * 0.02, s * 0.03); ctx.closePath(); ctx.fill();
  },
  brush(ctx, s, o = {}) { // paint brush with a loaded tip
    const c = o.c ?? '#c8281f';
    ctx.strokeStyle = lg(ctx, 0, -s * 0.03, 0, s * 0.03, WOOD('#d8b070')); ctx.lineWidth = s * 0.05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-s / 2, 0); ctx.lineTo(s * 0.14, 0); ctx.stroke();
    ctx.fillStyle = lg(ctx, 0, -s * 0.04, 0, s * 0.04, STEEL); ctx.fillRect(s * 0.1, -s * 0.034, s * 0.1, s * 0.068);
    ctx.fillStyle = lg(ctx, 0, -s * 0.06, 0, s * 0.06, [[0, tint(c, 0.4)], [1, tint(c, -0.3)]]);
    ctx.beginPath(); ctx.moveTo(s * 0.2, -s * 0.045); ctx.quadraticCurveTo(s * 0.4, -s * 0.05, s / 2, 0); ctx.quadraticCurveTo(s * 0.4, s * 0.05, s * 0.2, s * 0.045); ctx.closePath(); ctx.fill();
  },
  pot(ctx, s, o = {}) { // small round pot of paint or glaze seen from the front, top slightly open
    const c = o.c ?? '#c8281f', r = s * 0.34;
    cast(ctx, 2, r * 0.8, r * 1.05, r * 0.28);
    ctx.fillStyle = lg(ctx, -r, 0, r, 0, [[0, '#f0e7d4'], [0.35, '#fff7e6'], [1, '#a9a08c']]); ctx.beginPath(); ctx.moveTo(-r * 0.9, -r * 0.3); ctx.quadraticCurveTo(-r * 1.1, r * 0.9, 0, r * 0.9); ctx.quadraticCurveTo(r * 1.1, r * 0.9, r * 0.9, -r * 0.3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.stroke();
    ell(ctx, 0, -r * 0.3, r * 0.9, r * 0.3); ctx.fillStyle = tint(c, -0.15); ctx.fill(); ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = 2; ctx.stroke();
    ell(ctx, -r * 0.2, -r * 0.34, r * 0.4, r * 0.1); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
  },
  sponge(ctx, s) {
    const r = s * 0.28; ctx.save(); cast(ctx, 2, r * 0.6, r * 1.1, r * 0.3);
    ctx.fillStyle = lg(ctx, 0, -r, 0, r, [[0, '#f0d37a'], [1, '#b8892c']]); rrect(ctx, -r * 1.1, -r * 0.7, r * 2.2, r * 1.4, r * 0.55); ctx.fill();
    ctx.fillStyle = 'rgba(90,60,10,0.4)'; for (let k = 0; k < 9; k++) { ell(ctx, (hash(k, 1) - 0.5) * r * 1.8, (hash(k, 2) - 0.5) * r * 1.0, r * 0.1, r * 0.08); ctx.fill(); }
    ctx.restore();
  },
  bowl(ctx, s, o = {}) { // bowl of water (or slip) seen from slightly above
    const r = s * 0.42, c = o.c ?? '#6aa6c4';
    cast(ctx, 3, r * 0.34, r * 1.05, r * 0.42);
    ctx.fillStyle = lg(ctx, -r, 0, r, 0, [[0, '#cfc5b4'], [0.4, '#f1e9d8'], [1, '#8f8676']]); ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.42, 0, 0, Math.PI); ctx.lineTo(r * 0.8, r * 0.1); ctx.quadraticCurveTo(0, r * 0.7, -r * 0.8, r * 0.1); ctx.closePath(); ctx.fill();
    ell(ctx, 0, 0, r, r * 0.42); ctx.fillStyle = '#f4ecd9'; ctx.fill();
    ell(ctx, 0, r * 0.02, r * 0.86, r * 0.33); ctx.fillStyle = lg(ctx, 0, -r * 0.3, 0, r * 0.3, [[0, tint(c, -0.2)], [1, tint(c, 0.15)]]); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(-r * 0.2, 0, r * 0.4, r * 0.12, 0, 3.4, 5.5); ctx.stroke();
  },
  spool(ctx, s, o = {}) { // spool of wire or cord seen from the side
    const c = o.c ?? '#d1202f', r = s * 0.3, w = s * 0.5;
    cast(ctx, 2, r * 0.95, w * 0.55, r * 0.22);
    ctx.fillStyle = lg(ctx, 0, -r, 0, r, [[0, tint(c, 0.35)], [0.5, c], [1, tint(c, -0.5)]]); rrect(ctx, -w / 2, -r * 0.8, w, r * 1.6, 4); ctx.fill();
    ctx.strokeStyle = rgba('#000000', 0.22); ctx.lineWidth = 1; ctx.beginPath(); for (let k = 1; k < 9; k++) { const xx = -w / 2 + (w * k) / 9; ctx.moveTo(xx, -r * 0.8); ctx.lineTo(xx, r * 0.8); } ctx.stroke();
    for (const sg of [-1, 1]) { ctx.fillStyle = lg(ctx, 0, -r, 0, r, [[0, '#e8dcc2'], [1, '#8d7d5c']]); rrect(ctx, sg * w / 2 - (sg > 0 ? 0 : s * 0.05), -r, s * 0.05, r * 2, 3); ctx.fill(); }
  },
  coil(ctx, s, o = {}) { // coil of wire seen from above
    const c = o.c ?? '#d9b45a', r = s * 0.34;
    cast(ctx, 2, 3, r * 1.1, r * 0.95);
    for (let k = 4; k >= 0; k--) { ctx.strokeStyle = tint(c, k % 2 ? -0.15 : 0.1); ctx.lineWidth = s * 0.06; ell(ctx, 0, 0, r * (0.45 + k * 0.14), r * (0.4 + k * 0.12)); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r * 0.78, 0, 3.6, 5.3); ctx.stroke();
    ctx.strokeStyle = tint(c, 0.1); ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.moveTo(r * 0.9, 0); ctx.quadraticCurveTo(r * 1.4, r * 0.2, r * 1.5, r * 0.7); ctx.stroke();
  },
  clampboards(ctx, s, o = {}) { // two wooden clamp boards held by a screw clamp (shibori)
    const w = s * 0.5, h = s * 0.24;
    for (const dy of [h * 0.32, -h * 0.32]) {
      cast(ctx, 2, dy + h * 0.42, w * 0.52, h * 0.1, 0.28);
      ctx.fillStyle = lg(ctx, 0, dy - h / 2, 0, dy + h / 2, WOOD(o.c ?? '#b98a50')); rrect(ctx, -w / 2, dy - h * 0.42, w, h * 0.84, 4); ctx.fill();
      ctx.strokeStyle = 'rgba(60,35,10,0.4)'; ctx.stroke();
    }
    ctx.fillStyle = lg(ctx, 0, -h, 0, h, STEEL); ctx.fillRect(w / 2 - h * 0.1, -h * 0.9, h * 0.3, h * 1.8);
    ctx.fillStyle = lg(ctx, 0, 0, 1, 0, STEEL); ctx.fillRect(w / 2 + h * 0.2, -h * 0.05, h * 0.9, h * 0.1);
    ctx.fillStyle = '#3d444c'; ell(ctx, w / 2 + h * 1.1, 0, h * 0.12, h * 0.34); ctx.fill();
  },
  vat(ctx, s, o = {}) { // indigo dye vat seen from above: a round tub with a dark blue surface and a coppery froth
    const r = s * 0.42, c = o.c ?? '#14275c';
    cast(ctx, 3, 5, r * 1.08, r * 0.58);
    ctx.fillStyle = lg(ctx, -r, 0, r, 0, [[0, '#6a4a2c'], [0.4, '#a67a46'], [1, '#4c3219']]); ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.52, 0, 0, TAU); ctx.fill();
    ell(ctx, 0, 0, r * 0.88, r * 0.43); ctx.fillStyle = rg(ctx, 0, 0, 0, r * 0.9, [[0, tint(c, 0.25)], [0.7, c], [1, tint(c, -0.4)]]); ctx.fill();
    ctx.strokeStyle = 'rgba(190,140,80,0.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(r * 0.1, 0, r * 0.5, r * 0.2, 0.1, 0.3, 2.2); ctx.stroke();
    ctx.fillStyle = 'rgba(214,232,255,0.55)'; for (let k = 0; k < 7; k++) { ell(ctx, (hash(k, 4) - 0.5) * r * 1.2, (hash(k, 5) - 0.5) * r * 0.55, r * 0.05, r * 0.035); ctx.fill(); }
  },
  stone(ctx, s, o = {}) { // finished polished stone carving: a smooth rounded piece with a bright highlight
    const c = o.c ?? '#e7c1b0', r = s * 0.34;
    cast(ctx, 2, r * 0.82, r * 1.0, r * 0.22);
    ctx.fillStyle = rg(ctx, 0, 0, 0, r * 1.2, [[0, tint(c, 0.4)], [0.55, c], [1, tint(c, -0.5)]], -r * 0.35, -r * 0.4);
    ctx.beginPath(); ctx.moveTo(-r * 0.9, r * 0.6); ctx.bezierCurveTo(-r * 1.1, -r * 0.5, -r * 0.2, -r * 1.0, r * 0.4, -r * 0.6); ctx.bezierCurveTo(r * 1.0, -r * 0.4, r * 1.1, r * 0.5, r * 0.8, r * 0.7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ell(ctx, -r * 0.35, -r * 0.4, r * 0.28, r * 0.12, -0.5); ctx.fill();
    ctx.strokeStyle = rgba(tint(c, -0.35), 0.5); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-r * 0.4, r * 0.4); ctx.quadraticCurveTo(0, r * 0.1, r * 0.5, r * 0.3); ctx.stroke();
  },
  waxblock(ctx, s, o = {}) {
    const c = o.c ?? '#e3a63c', w = s * 0.34;
    cast(ctx, 3, w * 0.4, w * 0.8, w * 0.2);
    rrect(ctx, -w / 2, -w * 0.32, w, w * 0.64, 5); ctx.fillStyle = lg(ctx, 0, -w * 0.32, 0, w * 0.32, [[0, tint(c, 0.45)], [0.5, c], [1, tint(c, -0.35)]]); ctx.fill();
    ctx.strokeStyle = rgba('#fff3c0', 0.6); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(-w * 0.4, -w * 0.26, w * 0.5, w * 0.06);
  },
  spirit(ctx, s, o = {}) { // spirit lamp or small brass wax pot with a flame
    const r = s * 0.2, t = o.t ?? 0;
    cast(ctx, 2, r * 1.0, r * 1.3, r * 0.3);
    ctx.fillStyle = lg(ctx, -r, 0, r, 0, [[0, '#7a5a1e'], [0.35, '#f0cf6a'], [1, '#6a4c16']]); ctx.beginPath(); ctx.moveTo(-r * 1.1, -r * 0.2); ctx.quadraticCurveTo(-r * 1.3, r * 0.95, 0, r * 0.95); ctx.quadraticCurveTo(r * 1.3, r * 0.95, r * 1.1, -r * 0.2); ctx.closePath(); ctx.fill();
    ell(ctx, 0, -r * 0.2, r * 1.1, r * 0.3); ctx.fillStyle = '#e8a63a'; ctx.fill(); ctx.strokeStyle = '#fbe08a'; ctx.stroke();
    const fl = 1 + 0.12 * Math.sin(t * 9) + 0.06 * Math.sin(t * 17);
    ctx.fillStyle = rg(ctx, 0, -r * 1.2, 0, r * 1.8, [[0, 'rgba(255,230,150,0.55)'], [1, 'rgba(255,170,60,0)']]); ell(ctx, 0, -r * 1.2, r * 1.8, r * 1.8); ctx.fill();
    ctx.fillStyle = '#ff9a2e'; ctx.beginPath(); ctx.moveTo(-r * 0.3, -r * 0.4); ctx.quadraticCurveTo(-r * 0.4, -r * 1.2 * fl, 0, -r * 2 * fl); ctx.quadraticCurveTo(r * 0.4, -r * 1.2 * fl, r * 0.3, -r * 0.4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff1b0'; ctx.beginPath(); ctx.moveTo(-r * 0.14, -r * 0.4); ctx.quadraticCurveTo(0, -r * 1.4 * fl, r * 0.14, -r * 0.4); ctx.closePath(); ctx.fill();
  },
  mirrors(ctx, s, o = {}) { // scatter of small mirror shards in a dish
    const c = o.c ?? '#d3e6ef', r = s * 0.36;
    cast(ctx, 2, r * 0.7, r * 1.2, r * 0.4);
    ctx.fillStyle = lg(ctx, 0, -r, 0, r, [[0, '#8a5a33'], [1, '#4c2f18']]); ctx.beginPath(); ctx.ellipse(0, 0, r * 1.15, r * 0.7, 0, 0, TAU); ctx.fill();
    for (let k = 0; k < 11; k++) {
      const a = hash(k, 3) * TAU, d = hash(k, 4) * r * 0.75, x = Math.cos(a) * d, y = Math.sin(a) * d * 0.55, q = r * (0.12 + hash(k, 5) * 0.12), rot = hash(k, 6) * TAU;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.fillStyle = lg(ctx, -q, -q, q, q, [[0, '#ffffff'], [0.5, c], [1, tint(c, -0.4)]]); ctx.beginPath(); ctx.moveTo(-q, -q * 0.6); ctx.lineTo(q, -q * 0.8); ctx.lineTo(q * 0.7, q); ctx.lineTo(-q * 0.8, q * 0.5); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  },
  mudbowl(ctx, s) { // enamel basin of wet clay and dung plaster
    const r = s * 0.4; cast(ctx, 3, r * 0.4, r * 1.05, r * 0.42);
    ctx.fillStyle = lg(ctx, -r, 0, r, 0, [[0, '#9a9488'], [0.4, '#d9d3c6'], [1, '#6c675c']]); ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.45, 0, 0, Math.PI); ctx.lineTo(r * 0.75, r * 0.05); ctx.quadraticCurveTo(0, r * 0.7, -r * 0.75, r * 0.05); ctx.closePath(); ctx.fill();
    ell(ctx, 0, 0, r, r * 0.45); ctx.fillStyle = '#e9e4d8'; ctx.fill();
    ell(ctx, 0, 0, r * 0.86, r * 0.36); ctx.fillStyle = rg(ctx, 0, 0, 0, r, [[0, '#b58a63'], [1, '#7c5636']]); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-r * 0.4, -r * 0.05); ctx.quadraticCurveTo(0, r * 0.12, r * 0.4, -r * 0.08); ctx.stroke();
  },
  folder(ctx, s) { // bone folder
    ctx.fillStyle = lg(ctx, 0, -s * 0.05, 0, s * 0.05, [[0, '#fffaf0'], [0.5, '#e4d9bf'], [1, '#a89a78']]); ctx.beginPath(); ctx.moveTo(-s / 2, 0); ctx.quadraticCurveTo(-s * 0.3, -s * 0.08, 0, -s * 0.06); ctx.lineTo(s * 0.3, -s * 0.04); ctx.quadraticCurveTo(s / 2, 0, s * 0.3, s * 0.04); ctx.lineTo(0, s * 0.06); ctx.quadraticCurveTo(-s * 0.3, s * 0.08, -s / 2, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.stroke();
  },
  paper(ctx, s, o = {}) { // stack of sheets
    const c = o.c ?? '#c8201a', w = s * 0.34;
    for (let k = 3; k >= 0; k--) { ctx.save(); ctx.translate(k * 1.2, -k * 2.4); ctx.rotate((k - 1.5) * 0.04); ctx.fillStyle = k === 0 ? c : tint(c, -0.1 * k); rrect(ctx, -w / 2, -w / 2, w, w, 2); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(-w / 2 + 3, -w / 2 + 3, w * 0.5, 3);
  },
  bead(ctx, s, o = {}) { // jade bead and tassel cord for the knot
    const c = o.c ?? '#3fa57a', r = s * 0.16;
    cast(ctx, 2, r * 0.95, r * 1.1, r * 0.3);
    ctx.fillStyle = rg(ctx, 0, 0, 0, r * 1.2, [[0, '#e8fff0'], [0.45, c], [1, tint(c, -0.55)]], -r * 0.35, -r * 0.4); ell(ctx, 0, 0, r, r); ctx.fill();
    ctx.fillStyle = '#2a1c14'; ell(ctx, 0, 0, r * 0.28, r * 0.28); ctx.fill();
    ctx.strokeStyle = '#d1202f'; ctx.lineWidth = s * 0.05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(r, 0); ctx.bezierCurveTo(s * 0.4, -r * 1.5, s * 0.3, r * 1.6, s * 0.5, r * 0.2); ctx.stroke();
  },
  awl(ctx, s) {
    grip(ctx, -s / 2, s * 0.3, s * 0.1, '#5a3a20', 0.5);
    ctx.fillStyle = lg(ctx, 0, -3, 0, 3, STEEL); ctx.beginPath(); ctx.moveTo(-s / 2 + s * 0.3, -s * 0.02); ctx.lineTo(s / 2, 0); ctx.lineTo(-s / 2 + s * 0.3, s * 0.02); ctx.closePath(); ctx.fill();
  },
  grass(ctx, s, o = {}) { // bundle of sweetgrass or palm leaf tied with a strip
    const c = o.c ?? '#c9a85a', L = s * 0.5;
    cast(ctx, 2, s * 0.1, L * 1.0, s * 0.07);
    for (let k = 0; k < 11; k++) { ctx.strokeStyle = tint(c, (hash(k, 1) - 0.5) * 0.4); ctx.lineWidth = s * 0.028; ctx.beginPath(); const y = (k - 5) * s * 0.018; ctx.moveTo(-L, y * 1.2); ctx.quadraticCurveTo(0, y * 0.6 + (hash(k, 2) - 0.5) * 3, L, y * 0.5); ctx.stroke(); }
    ctx.strokeStyle = '#7a3a22'; ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.moveTo(-L * 0.12, -s * 0.11); ctx.lineTo(-L * 0.12, s * 0.11); ctx.stroke();
  },
  caliper(ctx, s) { // wooden calipers for turning
    ctx.lineCap = 'round'; ctx.strokeStyle = lg(ctx, 0, -4, 0, 4, [[0, '#d9b676'], [1, '#7c5528']]); ctx.lineWidth = s * 0.06;
    ctx.beginPath(); ctx.moveTo(-s * 0.1, -s * 0.28); ctx.lineTo(s * 0.04, s * 0.3); ctx.moveTo(s * 0.1, -s * 0.28); ctx.lineTo(-s * 0.04, s * 0.3); ctx.stroke();
    ctx.fillStyle = '#c8cfd6'; ell(ctx, 0, -s * 0.2, s * 0.05, s * 0.05); ctx.fill();
  },
  shavings(ctx, s, o = {}) { // curls of wood
    const c = o.c ?? '#e7c98f';
    for (let k = 0; k < 7; k++) { const x = (hash(k, 7) - 0.5) * s, y = (hash(k, 8) - 0.5) * s * 0.3, r = s * (0.05 + hash(k, 9) * 0.05); ctx.strokeStyle = tint(c, (hash(k, 3) - 0.5) * 0.3); ctx.lineWidth = Math.max(1.5, s * 0.025); ctx.beginPath(); ctx.arc(x, y, r, 0.4, 5.6 + hash(k, 5)); ctx.stroke(); }
  },
  pins(ctx, s) { // box of steel pins with a few laid out
    cast(ctx, 2, s * 0.1, s * 0.3, s * 0.06);
    rrect(ctx, -s * 0.28, -s * 0.1, s * 0.56, s * 0.2, 4); ctx.fillStyle = lg(ctx, 0, -s * 0.1, 0, s * 0.1, [[0, '#f0d58a'], [1, '#a07a2c']]); ctx.fill();
    ctx.strokeStyle = '#d9dee3'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); for (let k = 0; k < 4; k++) { const y = -s * 0.16 + k * s * 0.1; ctx.moveTo(s * 0.3, y); ctx.lineTo(s * 0.5, y + 2); } ctx.stroke();
    ctx.fillStyle = '#e04a3a'; for (let k = 0; k < 4; k++) { ell(ctx, s * 0.3, -s * 0.16 + k * s * 0.1, 3.2, 3.2); ctx.fill(); }
  },
  parchment(ctx, s) { // quill and ink horn
    cast(ctx, 2, s * 0.14, s * 0.2, s * 0.05);
    ctx.fillStyle = lg(ctx, 0, -s * 0.1, 0, s * 0.1, [[0, '#4a3a2c'], [1, '#14100c']]); rrect(ctx, -s * 0.46, -s * 0.12, s * 0.2, s * 0.24, 6); ctx.fill();
    ctx.fillStyle = '#0a0806'; ell(ctx, -s * 0.36, -s * 0.12, s * 0.07, s * 0.03); ctx.fill();
    ctx.strokeStyle = '#f2ede0'; ctx.lineWidth = s * 0.02; ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.1); ctx.quadraticCurveTo(0, -s * 0.34, s * 0.46, -s * 0.2); ctx.stroke();
    ctx.fillStyle = '#e6dfd0'; ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.18); ctx.quadraticCurveTo(0, -s * 0.5, s * 0.3, -s * 0.28); ctx.quadraticCurveTo(0, -s * 0.28, -s * 0.2, -s * 0.18); ctx.fill();
  },
  marlinspike(ctx, s) { // steel spike for splicing rope
    ctx.fillStyle = lg(ctx, 0, -5, 0, 5, STEEL); ctx.beginPath(); ctx.moveTo(-s / 2, -s * 0.035); ctx.lineTo(s * 0.2, -s * 0.02); ctx.lineTo(s / 2, 0); ctx.lineTo(s * 0.2, s * 0.02); ctx.lineTo(-s / 2, s * 0.035); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2a2018'; ctx.lineWidth = s * 0.03; ctx.beginPath(); ctx.ellipse(-s * 0.46, 0, s * 0.03, s * 0.035, 0, 0, TAU); ctx.stroke();
  },
  needle(ctx, s) { // bodkin / sewing needle with thread
    ctx.strokeStyle = '#d9dee3'; ctx.lineWidth = s * 0.02; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-s / 2, 0); ctx.lineTo(s / 2, 0); ctx.stroke();
    ctx.strokeStyle = '#1a3a8a'; ctx.lineWidth = s * 0.012; ctx.beginPath(); ctx.moveTo(-s * 0.46, 0); ctx.bezierCurveTo(-s * 0.3, -s * 0.2, -s * 0.1, s * 0.16, s * 0.1, s * 0.06); ctx.stroke();
  },
  tongs(ctx, s) { // small iron tongs for hot candy / wax
    ctx.strokeStyle = lg(ctx, 0, -4, 0, 4, [[0, '#8a929a'], [1, '#3a4046']]); ctx.lineWidth = s * 0.045; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-s / 2, -s * 0.05); ctx.lineTo(s * 0.34, -s * 0.012); ctx.moveTo(-s / 2, s * 0.05); ctx.lineTo(s * 0.34, s * 0.012); ctx.stroke();
    ctx.fillStyle = '#4a5058'; ctx.beginPath(); ctx.ellipse(s * 0.38, 0, s * 0.08, s * 0.035, 0, 0, TAU); ctx.fill();
  },
  press(ctx, s) { // flat brass press disc with handle (honeycomb candy)
    cast(ctx, 2, s * 0.16, s * 0.3, s * 0.06);
    ctx.fillStyle = lg(ctx, -s * 0.3, 0, s * 0.3, 0, [[0, '#8a6420'], [0.4, '#f1d27a'], [1, '#7a5a1a']]); ell(ctx, 0, s * 0.05, s * 0.3, s * 0.12); ctx.fill();
    ctx.fillStyle = lg(ctx, 0, -s * 0.2, 0, 0, WOOD('#7a4a22')); rrect(ctx, -s * 0.05, -s * 0.2, s * 0.1, s * 0.22, 4); ctx.fill();
    ctx.fillStyle = '#d09a3e'; ell(ctx, 0, -s * 0.2, s * 0.1, s * 0.05); ctx.fill();
  },
};

// Draw a prop with its centre at (x, y), long axis rotated by rot.
export function drawProp(ctx, name, x, y, s, rot = 0, o = {}) {
  const f = PROPS[name] ?? EXT.props[name]; if (!f) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = Math.max(2, s * 0.05); ctx.shadowOffsetY = Math.max(1, s * 0.03);
  f(ctx, s, o);
  ctx.restore();
}
// Hand tools shown at the pointer: the tip sits at (x, y) and the tool leans back to the lower right.
export function drawHeld(ctx, name, x, y, s, t = 0, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-2.3 + Math.sin(t * 22) * 0.04); ctx.translate(-s / 2, 0);
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 5;
  (PROPS[name] ?? EXT.props[name] ?? PROPS.chisel)(ctx, s, o);
  ctx.restore();
}
export const PROP_NAMES = Object.keys(PROPS);
export { mix, rgba };

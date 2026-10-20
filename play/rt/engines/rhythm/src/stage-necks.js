// Neck instruments (1.10.0): data rows and new drawings for the lute and fiddle stage in strings.js, through its EXT hooks.
// Rows only (existing bodies): none. New bodies/heads/soundboards: komuz, chonguri, saz, tar, pipa, dranyen, chapey, tres cubano, veena,
// banjo, erhu, sarangi, violin (Cape Breton), Hardanger fiddle, masenqo, sape, nyckelharpa.
import { clamp, mix, rgba, lighter, darker, rrect, circ, ell, hgrad, vgrad, rgrad, hash, grain, stepIcon, TAU } from './art.js';
import { pythonSkin, skin as skinFill, rosette, inlay, studs, wrap, pin, shadow, peg as pegBar } from './instr-art.js';
import { stringLine, lerp, pill } from './stagekit.js';
import { EXT } from './strings.js';
import { registerStringStage } from './registry.js';

const mir = (ctx, w, l, pts) => { // pts: list of [kind, ...numbers] for the RIGHT half from top to bottom, mirrored to make the left; first move is [x,y]
  ctx.beginPath(); ctx.moveTo(-pts[0][0] * w, pts[0][1] * l);
  for (let i = 1; i < pts.length; i++) { const p = pts[i]; ctx.bezierCurveTo(-p[0] * w, p[1] * l, -p[2] * w, p[3] * l, -p[4] * w, p[5] * l); }
  for (let i = pts.length - 1; i >= 1; i--) { const p = pts[i], q = pts[i - 1]; ctx.bezierCurveTo(p[2] * w, p[3] * l, p[0] * w, p[1] * l, (q.length === 2 ? q[0] : q[4]) * w, (q.length === 2 ? q[1] : q[5]) * l); }
  ctx.closePath();
};

// ---- bodies (path from the top centre, local width w and length l) ------------------------------------------------------------
const B = EXT.bodies;
B.komuz = (ctx, w, l) => mir(ctx, w, l, [[0.15, 0], [0.2, l * 0 + 0.06, 0.34, 0.1, 0.33, 0.2], [0.3, 0.26, 0.5, 0.26, 0.5, 0.5], [0.5, 0.78, 0.5, 0.97, 0.3, 1.0], [0.2, 1.01, 0.1, 1.0, 0, 1.0]]);
B.chonguri = (ctx, w, l) => mir(ctx, w, l, [[0.12, 0], [0.18, 0.18, 0.5, 0.26, 0.5, 0.6], [0.5, 0.92, 0.22, 1, 0, 1]]);
B.saz = (ctx, w, l) => mir(ctx, w, l, [[0.1, 0], [0.2, 0.05, 0.5, 0.13, 0.5, 0.5], [0.5, 0.9, 0.24, 1, 0, 1]]);   // 1.15.0: a fuller, deeper bowl
B.tar = (ctx, w, l) => mir(ctx, w, l, [[0.2, 0], [0.34, 0.02, 0.36, 0.12, 0.36, 0.25], [0.36, 0.36, 0.2, 0.4, 0.2, 0.46], [0.2, 0.52, 0.5, 0.52, 0.5, 0.74], [0.5, 0.95, 0.26, 1, 0, 1]]);
B.pipa = (ctx, w, l) => mir(ctx, w, l, [[0.14, 0], [0.2, 0.15, 0.5, 0.28, 0.5, 0.58], [0.5, 0.88, 0.4, 1.0, 0.2, 1.0], [0.1, 1.0, 0.04, 1.0, 0, 1.0]]);
B.chapey = (ctx, w, l) => mir(ctx, w, l, [[0.1, 0], [0.12, 0.12, 0.5, 0.08, 0.5, 0.5], [0.5, 0.95, 0.25, 1, 0, 1]]);
B.guitar = (ctx, w, l) => mir(ctx, w, l, [[0.2, 0], [0.3, 0.04, 0.42, 0.14, 0.42, 0.26], [0.42, 0.38, 0.28, 0.42, 0.3, 0.5], [0.34, 0.6, 0.5, 0.64, 0.5, 0.82], [0.5, 0.97, 0.25, 1, 0, 1]]);
B.banjo = (ctx, w, l) => { ctx.beginPath(); ctx.ellipse(0, l / 2, w / 2, l / 2, 0, 0, TAU); ctx.closePath(); };
B.hex = (ctx, w, l) => { ctx.beginPath(); ctx.moveTo(-w * 0.27, 0); ctx.lineTo(w * 0.27, 0); ctx.lineTo(w * 0.5, l * 0.5); ctx.lineTo(w * 0.27, l); ctx.lineTo(-w * 0.27, l); ctx.lineTo(-w * 0.5, l * 0.5); ctx.closePath(); };
B.sarangi = (ctx, w, l) => mir(ctx, w, l, [[0.15, 0], [0.19, 0.1, 0.22, 0.3, 0.24, 0.45], [0.26, 0.55, 0.5, 0.52, 0.5, 0.76], [0.5, 0.94, 0.26, 1, 0, 1]]);
B.violin = (ctx, w, l) => mir(ctx, w, l, [[0.2, 0], [0.3, 0, 0.4, 0.06, 0.42, 0.18], [0.44, 0.28, 0.3, 0.34, 0.27, 0.46], [0.25, 0.56, 0.48, 0.6, 0.5, 0.78], [0.5, 0.95, 0.3, 1, 0, 1]]);
B.diamond = (ctx, w, l) => { ctx.beginPath(); ctx.moveTo(-w * 0.06, 0); ctx.lineTo(-w * 0.47, l * 0.4); ctx.quadraticCurveTo(-w * 0.52, l * 0.46, -w * 0.47, l * 0.54); ctx.lineTo(-w * 0.06, l * 0.98); ctx.quadraticCurveTo(0, l * 1.01, w * 0.06, l * 0.98); ctx.lineTo(w * 0.47, l * 0.54); ctx.quadraticCurveTo(w * 0.52, l * 0.46, w * 0.47, l * 0.4); ctx.lineTo(w * 0.06, 0); ctx.closePath(); };
B.boat = (ctx, w, l) => mir(ctx, w, l, [[0.1, 0], [0.3, 0.1, 0.5, 0.3, 0.5, 0.5], [0.5, 0.8, 0.3, 0.97, 0.05, 1]]);
B.nyck = (ctx, w, l) => mir(ctx, w, l, [[0.2, 0], [0.34, 0.02, 0.46, 0.2, 0.44, 0.36], [0.42, 0.48, 0.5, 0.58, 0.5, 0.74], [0.5, 0.94, 0.3, 1, 0, 1]]);

// ---- heads --------------------------------------------------------------------------------------------------------------------
const Hd = EXT.heads;
const sidePegs = (ctx, o, count, col, x, len = 26, wd = 8) => {
  const { headH } = o, peg = pegBar;
  for (let k = 0; k < count; k++) { const left = k % 2 === 0, row = Math.floor(k / 2), cnt = Math.ceil(count / 2); const u = headH * (0.28 + 0.6 * (cnt > 1 ? row / (cnt - 1) : 0.5)); peg(ctx, (left ? -1 : 1) * x, u, len, wd, col, 0); }
};
Hd.scroll = {
  path: (ctx, { nutU, headH, w0 }) => { const bw = Math.max(24, w0 * 0.34), r = bw * 0.78; ctx.beginPath(); ctx.moveTo(-bw * 0.55, nutU); ctx.lineTo(-bw * 0.6, headH * 0.44); ctx.arc(0, headH * 0.26, r, Math.PI * 0.95, Math.PI * 2.05); ctx.lineTo(bw * 0.55, nutU); ctx.closePath(); },
  deco: (ctx, o) => { const { headH, w0 } = o, bw = Math.max(24, w0 * 0.34), r = bw * 0.78; sidePegs(ctx, o, 4, '#2a1a10', bw * 1.0, 30, 9);
    ctx.strokeStyle = 'rgba(30,14,4,0.75)'; ctx.lineWidth = 3; ctx.beginPath(); for (let k = 0; k < 40; k++) { const a = k * 0.28, rr = r * (0.9 - k * 0.02); ctx.lineTo(Math.cos(a) * rr, headH * 0.26 + Math.sin(a) * rr); } ctx.stroke(); },
};
Hd.erhu = {
  path: (ctx, { nutU, headH }) => { ctx.beginPath(); ctx.moveTo(-8, nutU); ctx.lineTo(-9, headH * 0.5); ctx.bezierCurveTo(-12, headH * 0.22, -4, headH * 0.04, 12, headH * 0.04); ctx.bezierCurveTo(26, headH * 0.04, 28, headH * 0.2, 16, headH * 0.26); ctx.bezierCurveTo(12, headH * 0.3, 10, headH * 0.4, 9, headH * 0.5); ctx.lineTo(8, nutU); ctx.closePath(); },
  deco: (ctx, { headH }) => { pegBar(ctx, -30, headH * 0.62, 56, 11, '#2a1408', 0.06); pegBar(ctx, 30, headH * 0.74, 56, 11, '#2a1408', -0.06); },
};
const dragonPath = (ctx, { nutU, headH, w0 }, big) => {
  const s = big ? 1 : 0.85;
  ctx.beginPath(); ctx.moveTo(-14, nutU); ctx.lineTo(-16, headH * 0.55); ctx.bezierCurveTo(-18, headH * 0.3, -6, headH * 0.14, 14, headH * 0.1);
  ctx.bezierCurveTo(34 * s, headH * 0.06, 54 * s, headH * 0.1, 60 * s, headH * 0.2); ctx.bezierCurveTo(64 * s, headH * 0.27, 52 * s, headH * 0.3, 42 * s, headH * 0.3); ctx.bezierCurveTo(30 * s, headH * 0.31, 22, headH * 0.36, 18, headH * 0.5);
  ctx.lineTo(14, nutU); ctx.closePath();
};
Hd.dragon = { path: (ctx, o) => dragonPath(ctx, o, true), deco: (ctx, o) => { const { headH } = o; ctx.fillStyle = '#f2e0b0'; circ(ctx, 28, headH * 0.17, 4); ctx.fill(); ctx.fillStyle = '#120a04'; circ(ctx, 29, headH * 0.17, 2); ctx.fill(); ctx.strokeStyle = '#e8c35a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(8, headH * 0.1); ctx.quadraticCurveTo(-8, -4, -20, headH * 0.05); ctx.stroke(); for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(-12, headH * (0.2 + k * 0.1)); ctx.lineTo(-24, headH * (0.24 + k * 0.1)); ctx.stroke(); } sidePegs(ctx, o, 6, '#e8c35a', 30, 28, 8); } };
Hd.yali = { path: (ctx, o) => dragonPath(ctx, o, false), deco: (ctx, o) => { const { headH } = o; ctx.fillStyle = '#f2e0b0'; circ(ctx, 26, headH * 0.17, 4); ctx.fill(); ctx.fillStyle = '#c03020'; circ(ctx, 27, headH * 0.17, 2.4); ctx.fill(); ctx.strokeStyle = '#e8c35a'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(6, headH * 0.1); ctx.quadraticCurveTo(-4, headH * 0.02, -14, headH * 0.08); ctx.stroke(); ctx.beginPath(); ctx.arc(6, headH * 0.24, 8, 0, TAU); ctx.stroke(); sidePegs(ctx, o, 4, '#f0dfae', 30, 26, 8); } };
Hd.swan = {
  path: (ctx, { nutU, headH }) => { ctx.beginPath(); ctx.moveTo(-8, nutU); ctx.lineTo(-9, headH * 0.4); ctx.bezierCurveTo(-10, headH * 0.16, 6, headH * 0.02, 30, headH * 0.06); ctx.bezierCurveTo(52, headH * 0.1, 58, headH * 0.3, 46, headH * 0.34); ctx.bezierCurveTo(38, headH * 0.36, 34, headH * 0.28, 28, headH * 0.24); ctx.bezierCurveTo(18, headH * 0.22, 12, headH * 0.3, 9, headH * 0.42); ctx.lineTo(8, nutU); ctx.closePath(); },
  deco: (ctx, { headH }) => { pegBar(ctx, -26, headH * 0.55, 40, 9, '#f0dfae', 0); pegBar(ctx, 26, headH * 0.66, 40, 9, '#f0dfae', 0); },
};
Hd.masenqo = {   // 1.15.0: a thick neck end with one big side peg, a leather wrap and a hanging cord tassel
  path: (ctx, { nutU, headH, w0 }) => { const hw = Math.max(14, w0 * 0.2), kr = hw * 1.5, cy = Math.max(kr + 6, headH * 0.22), lean = hw * 0.55; ctx.beginPath(); ctx.moveTo(-hw, nutU); ctx.lineTo(-hw * 0.9 + lean * 0.4, (nutU + cy) / 2); ctx.lineTo(-kr * 0.8 + lean, cy + kr * 0.25); ctx.arc(lean, cy, kr, Math.PI * 0.86, Math.PI * 2.14); ctx.lineTo(hw * 0.9 + lean * 0.4, (nutU + cy) / 2); ctx.lineTo(hw, nutU); ctx.closePath(); },
  deco: (ctx, { nutU, headH, w0 }) => { const hw = Math.max(14, w0 * 0.2), pu = headH * 0.5;
    ctx.fillStyle = '#6a3a18'; for (let k = 0; k < 4; k++) { rrect(ctx, -hw * 0.98, nutU - 14 - k * 9, hw * 1.96, 6, 3); ctx.fill(); }
    pegBar(ctx, -hw * 1.7, pu, hw * 3.4, hw * 0.7, '#5a3418', Math.PI + 0.04);
    const tx = hw * 0.2, ty = nutU - 4; ctx.strokeStyle = '#b8301c'; ctx.lineWidth = 3; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(tx + k * 2, ty); ctx.quadraticCurveTo(tx + k * 5 + 4, ty + 16, tx + k * 8, ty + 30); ctx.stroke(); } },
};
Hd.sape = {
  path: (ctx, { nutU, headH }) => { ctx.beginPath(); ctx.moveTo(-14, nutU); ctx.lineTo(-18, headH * 0.35); ctx.bezierCurveTo(-24, headH * 0.1, -8, 0, 12, headH * 0.04); ctx.bezierCurveTo(30, headH * 0.06, 40, headH * 0.16, 30, headH * 0.26); ctx.bezierCurveTo(26, headH * 0.32, 20, headH * 0.34, 18, headH * 0.4); ctx.lineTo(14, nutU); ctx.closePath(); },
  deco: (ctx, o) => { const { headH } = o; ctx.fillStyle = '#b8201a'; circ(ctx, 4, headH * 0.14, 9); ctx.fill(); ctx.strokeStyle = '#1a0c06'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(4, headH * 0.14, 5, 0, TAU * 0.8); ctx.stroke();
    for (let k = 0; k < 6; k++) { ctx.strokeStyle = k % 2 ? '#f2e6c8' : '#1a0c06'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(28, headH * 0.06 + k * 5); ctx.lineTo(44 + k * 3, headH * 0.02 + k * 6 - 6); ctx.stroke(); }
    sidePegs(ctx, o, 3, '#d8c8a0', 28, 24, 8); },
};

// ---- soundboard details (ctx is translated to the body's top; G.bw x G.bl) ------------------------------------------------------
const Fc = EXT.faces;
Fc.komuz = (ctx, G, { hole, hr }) => { hole(0, G.bl * 0.26, hr * 0.8); ctx.strokeStyle = 'rgba(40,16,4,0.7)'; ctx.lineWidth = 2.4; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(0, G.bl * 0.62, G.bw * (0.14 + k * 0.07), 0.3, Math.PI - 0.3); ctx.stroke(); } };
Fc.saz = (ctx, G, { hole, hr }) => { const { bw, bl } = G;   // 1.15.0: a fan of sound holes, an inlaid rosette and the plectrum plate (pickguard) under the strings
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) hole(sx * bw * (0.33 + 0.028 * k), bl * (0.27 + 0.052 * k), hr * (0.3 - 0.03 * k), true);
  const rc = bl * 0.44, rr = bw * 0.2;
  ctx.fillStyle = 'rgba(30,14,4,0.55)'; circ(ctx, 0, rc, rr * 1.22); ctx.fill();
  for (const [k, c] of [[1.22, 'rgba(245,235,205,0.9)'], [1.0, 'rgba(60,30,10,0.9)'], [0.78, 'rgba(232,205,150,0.9)']]) { ctx.strokeStyle = c; ctx.lineWidth = 2.6; circ(ctx, 0, rc, rr * k); ctx.stroke(); }
  ctx.fillStyle = 'rgba(250,244,226,0.95)'; for (let k = 0; k < 24; k++) { const an = (k / 24) * TAU; circ(ctx, Math.cos(an) * rr * 1.11, rc + Math.sin(an) * rr * 1.11, 2.6); ctx.fill(); }
  ctx.fillStyle = '#1a0c06'; for (let k = 0; k < 8; k++) { const an = (k / 8) * TAU + 0.2; ctx.beginPath(); ctx.moveTo(Math.cos(an) * rr * 0.34, rc + Math.sin(an) * rr * 0.34); ctx.lineTo(Math.cos(an + 0.2) * rr * 0.74, rc + Math.sin(an + 0.2) * rr * 0.74); ctx.lineTo(Math.cos(an - 0.2) * rr * 0.74, rc + Math.sin(an - 0.2) * rr * 0.74); ctx.closePath(); ctx.fill(); }
  const pu = bl * 0.66, ph = bl * 0.17, pw = bw * 0.46;   // the plate: a dark teardrop with a pale edge, strings run over it
  const plate = () => { ctx.beginPath(); ctx.moveTo(-pw * 0.5, pu); ctx.bezierCurveTo(-pw * 0.62, pu + ph * 0.7, -pw * 0.3, pu + ph * 1.1, 0, pu + ph * 1.05); ctx.bezierCurveTo(pw * 0.3, pu + ph * 1.1, pw * 0.62, pu + ph * 0.7, pw * 0.5, pu); ctx.quadraticCurveTo(0, pu - ph * 0.22, -pw * 0.5, pu); ctx.closePath(); };
  ctx.save(); ctx.translate(4, 6); plate(); ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fill(); ctx.restore();
  plate(); ctx.fillStyle = vgrad(ctx, pu, pu + ph * 1.05, [[0, '#4a2a14'], [0.5, '#2a160a'], [1, '#150a04']]); ctx.fill(); ctx.strokeStyle = 'rgba(245,230,190,0.85)'; ctx.lineWidth = 2.6; ctx.stroke();
  ctx.strokeStyle = 'rgba(245,230,190,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-pw * 0.3, pu + ph * 0.4); ctx.quadraticCurveTo(0, pu + ph * 0.1, pw * 0.3, pu + ph * 0.4); ctx.stroke(); };
Fc.tar = (ctx, G) => { const { bw, bl } = G; ctx.strokeStyle = 'rgba(80,50,20,0.6)'; ctx.lineWidth = 2; for (const [cu, r] of [[bl * 0.24, bw * 0.3], [bl * 0.72, bw * 0.42]]) { ctx.beginPath(); ctx.arc(0, cu, r, 0, TAU); ctx.stroke(); } ctx.strokeStyle = 'rgba(40,20,8,0.7)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-bw * 0.46, bl * 0.46); ctx.quadraticCurveTo(0, bl * 0.4, bw * 0.46, bl * 0.46); ctx.stroke(); };
Fc.pipa = (ctx, G) => { const { bw, bl } = G; for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * bw * 0.27, bl * 0.2); ctx.rotate(s * 0.18); ctx.beginPath(); ctx.arc(0, 0, bw * 0.1, Math.PI * 0.62, Math.PI * 1.38, s > 0); ctx.arc(bw * 0.032 * -s, 0, bw * 0.095, Math.PI * 1.38, Math.PI * 0.62, s < 0); ctx.closePath(); ctx.fillStyle = '#0c0603'; ctx.fill(); ctx.strokeStyle = '#e8d3a0'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); }
  ctx.strokeStyle = 'rgba(232,200,130,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, bl * 0.58, bw * 0.28, 0, TAU); ctx.stroke(); };
Fc.veena = (ctx, G) => { const { bw, bl } = G, cu = bl * 0.5; ctx.strokeStyle = 'rgba(50,24,6,0.55)'; ctx.lineWidth = 2;
  for (let k = 1; k < 9; k++) { ctx.beginPath(); ctx.ellipse(0, cu, bw * 0.05 * k, bl * 0.05 * k, 0, 0, TAU); ctx.stroke(); }
  ctx.fillStyle = hgrad(ctx, -bw * 0.2, bw * 0.2, [[0, '#8a6a20'], [0.4, '#f4d777'], [1, '#7a5a14']]); rrect(ctx, -bw * 0.2, bl * 0.72, bw * 0.4, bl * 0.07, 6); ctx.fill(); ctx.strokeStyle = '#5a3a08'; ctx.lineWidth = 1.5; ctx.stroke(); };
Fc.banjo = (ctx, G) => { // the whole body is a drum: a metal rim over a stretched head, with the rim's bracket hooks
  const { bw, bl } = G, cx = 0, cy = bl / 2, rx = bw / 2, ry = bl / 2;
  ctx.fillStyle = hgrad(ctx, -rx, rx, [[0, '#6a6e78'], [0.25, '#f2f4f8'], [0.5, '#b5b9c4'], [0.8, '#eef0f5'], [1, '#5a5e68']]); ell(ctx, cx, cy, rx, ry); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ell(ctx, cx, cy, rx, ry); ctx.stroke();
  const ix = rx * 0.9, iy = ry * 0.9;
  ctx.fillStyle = rgrad(ctx, cx, cy, 4, rx, [[0, '#fbf6e6'], [0.7, '#ece2c6'], [1, '#c9bb96']], cx - rx * 0.2, cy - ry * 0.25); ell(ctx, cx, cy, ix, iy); ctx.fill();
  ctx.strokeStyle = 'rgba(90,70,40,0.5)'; ctx.lineWidth = 2; ell(ctx, cx, cy, ix, iy); ctx.stroke(); ell(ctx, cx, cy, ix * 0.62, iy * 0.62); ctx.strokeStyle = 'rgba(90,70,40,0.18)'; ctx.stroke();
  for (let k = 0; k < 28; k++) { const a = (k / 28) * TAU, x = Math.cos(a) * rx * 0.95, y = cy + Math.sin(a) * ry * 0.95; ctx.fillStyle = '#4a4d56'; ctx.beginPath(); ctx.arc(x, y, 3.4, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(x - 1, y - 1, 1.2, 0, TAU); ctx.fill(); }
};
Fc.erhu = (ctx, G, { out }) => { const { bw, bl } = G; ctx.save(); ctx.translate(0, bl * 0.05); ctx.scale(0.86, 0.9); out(ctx, bw, bl); ctx.clip(); pythonSkin(ctx, () => out(ctx, bw, bl), { x0: -bw / 2, y0: 0, x1: bw / 2, y1: bl }, { s: Math.max(13, bw / 11) }); ctx.restore();
  ctx.strokeStyle = 'rgba(232,200,130,0.9)'; ctx.lineWidth = 2.4; ctx.save(); ctx.translate(0, bl * 0.05); ctx.scale(0.86, 0.9); out(ctx, bw, bl); ctx.stroke(); ctx.restore(); };
Fc.sarangi = (ctx, G, { out }) => { const { bw, bl } = G;
  // the upper chamber is open: a dark hollow framed by carved ribs; the lower belly is a tight skin
  ctx.save(); out(ctx, bw, bl); ctx.clip();
  ctx.fillStyle = 'rgba(8,4,2,0.82)'; rrect(ctx, -bw * 0.17, bl * 0.04, bw * 0.34, bl * 0.4, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(232,196,120,0.8)'; ctx.lineWidth = 3; rrect(ctx, -bw * 0.17, bl * 0.04, bw * 0.34, bl * 0.4, 14); ctx.stroke();
  for (let k = 1; k < 5; k++) { ctx.strokeStyle = 'rgba(160,100,50,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-bw * 0.17, bl * (0.04 + k * 0.08)); ctx.lineTo(bw * 0.17, bl * (0.04 + k * 0.08)); ctx.stroke(); }
  skinFill(ctx, () => { ctx.beginPath(); ctx.rect(-bw, bl * 0.5, bw * 2, bl * 0.6); }, { x0: -bw / 2, y0: bl * 0.5, x1: bw / 2, y1: bl }, { seed: 6 });
  ctx.fillStyle = 'rgba(60,35,12,0.6)'; for (let k = 0; k < 14; k++) { const x = -bw * 0.5 + (k / 13) * bw; circ(ctx, x, bl * 0.505, 2.4); ctx.fill(); }
  ctx.restore(); };
Fc.violin = (ctx, G, { out }) => { const { bw, bl } = G;
  ctx.save(); ctx.translate(0, bl * 0.03); ctx.scale(0.93, 0.94); out(ctx, bw, bl); ctx.strokeStyle = 'rgba(25,12,4,0.8)'; ctx.lineWidth = 2.6; ctx.stroke(); ctx.restore();
  for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * bw * 0.17, bl * 0.54); ctx.rotate(-s * 0.1); ctx.fillStyle = '#0c0603'; ctx.beginPath(); ctx.moveTo(0, -bl * 0.075); ctx.bezierCurveTo(s * bw * 0.03, -bl * 0.05, -s * bw * 0.01, -bl * 0.01, -s * bw * 0.005, bl * 0.01); ctx.bezierCurveTo(-s * bw * 0.02, bl * 0.04, s * bw * 0.03, bl * 0.06, s * bw * 0.01, bl * 0.085); ctx.lineTo(-s * bw * 0.01, bl * 0.085); ctx.bezierCurveTo(s * bw * 0.0, bl * 0.04, -s * bw * 0.05, bl * 0.02, -s * bw * 0.03, -bl * 0.01); ctx.bezierCurveTo(-s * bw * 0.02, -bl * 0.04, s * bw * 0.01, -bl * 0.05, 0, -bl * 0.075); ctx.fill(); circ(ctx, 0, -bl * 0.08, 3.4); ctx.fill(); circ(ctx, 0, bl * 0.09, 3.4); ctx.fill(); ctx.restore(); } };
Fc.hardanger = (ctx, G, o) => { Fc.violin(ctx, G, o); const { bw, bl } = G; // black ink rosework: scrolls and vines on the top plate
  ctx.strokeStyle = 'rgba(10,6,4,0.78)'; ctx.lineWidth = 2;
  for (const [cu, r] of [[bl * 0.22, bw * 0.12], [bl * 0.78, bw * 0.17]]) for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.8, cu + Math.sin(a) * r * 0.8, r * 0.32, a, a + 4.2); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(0, bl * 0.28); for (let k = 0; k < 30; k++) ctx.lineTo(Math.sin(k * 0.7) * bw * 0.08, bl * 0.28 + k * bl * 0.014); ctx.stroke(); };
Fc.sape = (ctx, G, { out, hole, hr }) => { const { bw, bl } = G; hole(0, bl * 0.2, hr * 0.7);
  // Dayak scrollwork down the face: black and red spirals, mirrored
  ctx.save(); out(ctx, bw, bl); ctx.clip();
  for (const s of [-1, 1]) for (let k = 0; k < 5; k++) { const cu = bl * (0.36 + k * 0.12), cx = s * bw * 0.2; ctx.strokeStyle = k % 2 ? '#a8201a' : '#14080a'; ctx.lineWidth = 3.6; ctx.beginPath(); for (let t = 0; t < 26; t++) { const a = t * 0.34, rr = bw * 0.07 * (1 - t / 34); ctx.lineTo(cx + Math.cos(a * s) * rr, cu + Math.sin(a) * rr); } ctx.stroke(); }
  ctx.strokeStyle = '#14080a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, bl * 0.3); ctx.lineTo(0, bl * 0.96); ctx.stroke();
  ctx.fillStyle = '#e9d9b0'; for (let k = 0; k < 9; k++) { circ(ctx, 0, bl * (0.34 + k * 0.07), 3); ctx.fill(); }
  ctx.restore(); };
Fc.nyck = (ctx, G, o) => { Fc.violin(ctx, G, o); };
Fc.masenqo = (ctx, G) => { const { bw, bl } = G, cy = bl * 0.5;   // 1.15.0: a ring of brass studs round the skin, a stitched seam and two small sound holes
  const edge = [[0.06, 0], [0.47, 0.4], [0.47, 0.54], [0.06, 0.98]], pts = [];
  for (const sx of [1, -1]) for (let e = 0; e < 3; e++) { const [x0, y0] = edge[e], [x1, y1] = edge[e + 1], n = e === 1 ? 1 : 9; for (let k = 0; k <= n; k++) { if (k === 0 && e > 0) continue; const t = k / n, x = sx * bw * (x0 + (x1 - x0) * t) * 0.95, y = cy + (bl * (y0 + (y1 - y0) * t) - cy) * 0.95; pts.push([x, y]); } }
  studs(ctx, pts, Math.max(3, bw * 0.011), '#c9a24a');
  ctx.fillStyle = '#120a04'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(d * bw * 0.13, bl * 0.2, bw * 0.03, bw * 0.045, d * 0.5, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(240,215,160,0.8)'; ctx.lineWidth = 2; ctx.stroke(); } };
Fc.chonguri = (ctx, G, { hole, hr }) => { hole(-G.bw * 0.16, G.bl * 0.3, hr * 0.5, true); hole(G.bw * 0.16, G.bl * 0.3, hr * 0.5, true); ctx.strokeStyle = 'rgba(40,16,4,0.6)'; ctx.lineWidth = 2.4; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(0, G.bl * 0.62, G.bw * (0.12 + k * 0.08), 0.2, Math.PI - 0.2); ctx.stroke(); } };

// ---- extras -------------------------------------------------------------------------------------------------------------------
const Ex = EXT.extras;
const wAt = (G, u) => lerp(G.nutW, G.brW, (u - G.nutU) / (G.bridgeU - G.nutU)) + 26;
const footBoard = (ctx, G, rt, X) => { // Cape Breton: a plank under the fiddle and a pictogram for each foot lane
  const u0 = G.H * 0.865, h = G.H * 0.12;
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, -G.W * 0.46 + 6, u0 + 8, G.W * 0.92, h, 12); ctx.fill();
  ctx.fillStyle = hgrad(ctx, -G.W * 0.46, G.W * 0.46, [[0, '#3a2210'], [0.3, '#8a5a2c'], [0.7, '#7a4a22'], [1, '#2e1a0a']]); rrect(ctx, -G.W * 0.46, u0, G.W * 0.92, h, 12); ctx.fill();
  grain(ctx, -G.W * 0.46, u0, G.W * 0.92, h, '#1a0c04', 0.4, 3, false, 7);
  ctx.strokeStyle = 'rgba(255,225,170,0.4)'; ctx.lineWidth = 2; rrect(ctx, -G.W * 0.46, u0, G.W * 0.92, h, 12); ctx.stroke();
  ctx.restore();
  X.lanes.forEach((l, i) => { const sp = X.spots[i], f = rt.flash[i]; if (!sp || X.cls[i] !== 'tap') return;
    stepIcon(ctx, l.icon ?? (i % 2 ? 'foot-r' : 'foot-l'), sp.v, sp.u - 2, sp.r * 0.62, rgba(lighter(l.color, 0.5), 0.55), '#fff'); void f; });
};
const footLayout = (G, spots, lanes, cls) => { const feet = lanes.map((_, i) => i).filter((i) => cls[i] === 'tap'); const u = G.H * 0.925; feet.forEach((i, k) => { const v = (k - (feet.length - 1) / 2) * Math.min(G.W * 0.22, 110); const r = Math.min(30, G.W * 0.07); spots[i] = { v, u, r, dist: (lv, lu) => Math.hypot(lv - v, lu - u) / r, tap: true }; }); };
const tailpiece = (ctx, G) => { const tu = G.bridgeU + (G.tailU - G.bridgeU) * 0.7; ctx.fillStyle = vgrad(ctx, tu, tu + 50, [[0, '#2a1a10'], [1, '#0e0804']]); ctx.beginPath(); ctx.moveTo(-G.brW * 0.28, tu + 4); ctx.lineTo(G.brW * 0.28, tu + 4); ctx.lineTo(G.brW * 0.14, tu + 52); ctx.lineTo(-G.brW * 0.14, tu + 52); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,230,180,0.3)'; ctx.lineWidth = 1.5; ctx.stroke(); for (let k = 0; k < G.n; k++) { const x = lerp(-G.brW * 0.2, G.brW * 0.2, G.n > 1 ? k / (G.n - 1) : 0.5); ctx.fillStyle = '#d9b46a'; circ(ctx, x, tu + 14, 3.4); ctx.fill(); } };
Ex.violin = { layout: footLayout, under: (ctx, G, rt, X) => { tailpiece(ctx, G); if (X.prof.padF) footBoard(ctx, G, rt, X); } };
Ex.hardanger = { under: (ctx, G, rt, X) => { tailpiece(ctx, G);
  // mother-of-pearl inlay along the fingerboard
  ctx.fillStyle = 'rgba(245,238,220,0.9)'; for (let k = 0; k < 9; k++) { const u = lerp(G.nutU + 40, G.fbEnd + 60, k / 8); const w = wAt(G, u) * 0.18; ctx.beginPath(); ctx.moveTo(-w, u); ctx.lineTo(0, u - 5); ctx.lineTo(w, u); ctx.lineTo(0, u + 5); ctx.closePath(); ctx.fill(); }
  void X; } };
Ex.banjo = {
  noSympa: true,
  layout: (G, spots, lanes, cls) => { const lane5 = lanes.map((_, i) => i).filter((i) => cls[i] === 'tap'); const u = G.nutU + (G.fbEnd - G.nutU) * 0.5 + 40; lane5.forEach((i, k) => { const v = -wAt(G, u) / 2 - 36; spots[i] = { v, u: u + 56 + k * 62, r: 25, dist: (lv, lu) => Math.hypot(lv - v, lu - (u + 56 + k * 62)) / 25, thumb: true, tap: true }; }); G.thumbU = u; G.thumbV = -wAt(G, u) / 2 - 36; },
  under: (ctx, G, rt, X) => { // the short fifth string: starts at a peg on the neck's side and runs to the bridge; the tailpiece
    const u0 = G.thumbU ?? G.nutU + 150, v0 = G.thumbV ?? -wAt(G, u0) / 2 - 36, e = Math.max(0, ...X.lanes.map((_, i) => (X.cls[i] === 'tap' ? rt.flash[i] : 0)));
    ctx.fillStyle = '#d9d4c4'; circ(ctx, v0 - 12, u0 - 6, 7); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    stringLine(ctx, v0, u0 - 2, G.vBr(0) - 8, G.bridgeU, 8 * e, rt.anim * 80, 2.2, e > 0.04 ? '#fff' : '#dfe4ee', '#fff');
    const tu = G.bridgeU + G.bl * 0.22; ctx.fillStyle = hgrad(ctx, -40, 40, [[0, '#8a8e98'], [0.4, '#f0f2f6'], [1, '#6a6e78']]); rrect(ctx, -34, tu, 68, 22, 8); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    for (let k = 0; k < G.n; k++) { const x = lerp(-24, 24, G.n > 1 ? k / (G.n - 1) : 0.5); stringLine(ctx, G.vBr(k), G.bridgeU, x, tu + 4, 0, 0, 1.5, '#c8ccd6', null); }
  },
  over: (ctx, G, rt, X) => { X.lanes.forEach((l, i) => { const sp = X.spots[i]; if (!sp?.thumb) return; const f = rt.flash[i];
    ctx.strokeStyle = rgba(lighter(l.color, 0.4), 0.55 + 0.4 * f); ctx.lineWidth = 2.4; rrect(ctx, sp.v - 30, sp.u - 16, 60, 32, 16); ctx.stroke(); if (f > 0.04) X.finger(ctx, sp.v, sp.u, f);
    X.labels.push({ v: sp.v, u: sp.u, s: l.name, w: 80, col: l.color, f, o: {} }); }); },
};
Ex.veena = { under: (ctx, G) => { // the small gourd under the neck near the head, and the three side strings
  const gu = G.nutU + (G.fbEnd - G.nutU) * 0.1, gr = G.bw * 0.2, gv = Math.min(wAt(G, gu) / 2 + 34 + G.bw * 0.12, G.W / 2 - gr - 8);   // 1.15.0: the gourd sits clear of the first lanes and inside the frame
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, gv + 8, gu + 10, gr, gr * 1.1); ctx.fill();
  ctx.fillStyle = rgrad(ctx, gv, gu, 4, gr * 1.2, [[0, '#f2c36a'], [0.55, '#b4742a'], [1, '#4a2a0a']], gv - gr * 0.3, gu - gr * 0.4); ell(ctx, gv, gu, gr, gr * 1.1); ctx.fill(); ctx.strokeStyle = 'rgba(255,225,170,0.5)'; ctx.lineWidth = 2; ctx.stroke();
  for (let k = 0; k < 3; k++) { const pu = G.nutU + 30 + k * 30, pv = -wAt(G, pu) / 2 - 22; ctx.fillStyle = '#efe0b8'; circ(ctx, pv - 8, pu, 6); ctx.fill(); stringLine(ctx, pv, pu, -G.brW * 0.62 + k * 4, G.bridgeU + 4, 0, 0, 1.4, '#cfd3da', null); }
} };
Ex.erhu = {
  under: (ctx, G) => { // the "thousand-gold" loop: a cord wrapped round the neck and both strings
    const u = G.nutU + (G.bridgeU - G.nutU) * 0.2, w = wAt(G, u) * 0.6; ctx.strokeStyle = '#efe6cc'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.ellipse(0, u, w, 9, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = 'rgba(60,40,10,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
    const ru = G.bodyU - 4; ctx.fillStyle = '#e8d3a0'; rrect(ctx, -G.brW * 0.35, ru - 4, G.brW * 0.7, 8, 4); ctx.fill();
  },
  bow: (ctx, G, rt, e, av, u, X) => { X.bowDraw(ctx, G, rt, e, av, u); // the hair runs BETWEEN the strings: draw the left string again over the bow
    const sty = X.STR_COL.hair; stringLine(ctx, G.vNut(0), G.nutU, G.vBr(0), G.bridgeU, 11 * e[0], rt.anim * 80, 2.8, e[0] > 0.04 ? '#fff' : sty[0], sty[1]); },
};
Ex.nyck = {
  noSympa: true,
  under: (ctx, G, rt, X) => { // the keybox over the neck, two ranks of keys, and the sympathetic strings beside it
    const u0 = G.nutU + 12, u1 = G.fbEnd + (G.bridgeU - G.fbEnd) * 0.1 + 80, bw = wAt(G, u0) + 34;
    const box = () => rrect(ctx, -bw / 2, u0, bw, u1 - u0, 8);
    ctx.save(); ctx.translate(5, 7); box(); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill(); ctx.restore();
    ctx.fillStyle = hgrad(ctx, -bw / 2, bw / 2, [[0, '#3a2210'], [0.35, '#8a5a2c'], [0.7, '#6a3e1c'], [1, '#2a180a']]); box(); ctx.fill(); ctx.strokeStyle = 'rgba(255,225,170,0.4)'; ctx.lineWidth = 2; ctx.stroke();
    const sym = X.prof.sympa ?? 10;
    for (let k = 0; k < sym; k++) { const pu = lerp(u0 + 6, G.bridgeU - 60, k / (sym - 1)), pv = bw / 2 + 24; ctx.fillStyle = '#e8dcc0'; circ(ctx, pv + 8, pu, 4.4); ctx.fill(); ctx.strokeStyle = 'rgba(235,235,240,0.55)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(pv + 4, pu); ctx.lineTo(G.brW * 0.55 + k * 2, G.bridgeU + 4); ctx.stroke(); }
    // keys: one for every lane, in two staggered ranks, pressed keys slide in and light up
    X.lanes.forEach((l, i) => { const sp = X.spots[i]; if (!sp || X.cls[i] !== 'note') return; const f = rt.flash[i], rank = i % 2, kl = 30 + rank * 26 - 10 * f;
      const kx = -bw / 2 - kl; ctx.fillStyle = 'rgba(0,0,0,0.38)'; rrect(ctx, kx + 3, sp.u - 11 + 4, kl + 8, 22, 8); ctx.fill();
      ctx.fillStyle = vgrad(ctx, sp.u - 11, sp.u + 11, [[0, f > 0.05 ? lighter(l.color, 0.5) : '#f0dcae'], [1, f > 0.05 ? darker(l.color, 0.1) : '#9a7a40']]); rrect(ctx, kx, sp.u - 11, kl + 8, 22, 8); ctx.fill(); ctx.strokeStyle = 'rgba(60,34,10,0.8)'; ctx.lineWidth = 1.4; ctx.stroke(); });
  },
  over: (ctx, G, rt, X) => { X.lanes.forEach((l, i) => { const sp = X.spots[i]; if (!sp || X.cls[i] !== 'note') return; ctx.fillStyle = '#e8d29a'; rrect(ctx, sp.v - 15, sp.u - 2.5, 30, 5, 2); ctx.fill(); }); },
};

// ---- the rows ------------------------------------------------------------------------------------------------------------------
const row = (id, match, p) => registerStringStage({ id, match, tables: { PROF: { [id]: { type: 'lute', per: 1, hole: 'round', tag: 'finger', ...p } } } });
const fid = (id, match, p) => row(id, match, { type: 'fiddle', bow: true, ...p });

fid('nyckelharpa', /nyckelharpa|key.?fiddle|keyed.?fiddle|nyckel/, { tilt: 0, zoom: 0.96, n: 4, fr: 0, body: 'nyck', head: 'flat', pegs: 4, hole: 'nyck', wood: '#b0702e', edge: '#3a1f0c', fb: '#2a170a', headF: 0.1, neckF: 0.4, bwr: 0.82, nutW: 0.12, brW: 0.2, extra: 'nyck', sympa: 10, vk: 'bow-nyckel', skin: false, bridgeF: 0.7, fbEndF: 0.04, spread: [74, 84] });
fid('hardanger', /hardanger|hardingfele|halling/, { tilt: 0.06, dx: -0.02, zoom: 0.96, n: 4, fr: 0, body: 'violin', head: 'scroll', pegs: 4, hole: 'hardanger', wood: '#bf8638', edge: '#3a200c', fb: '#17100a', headF: 0.14, neckF: 0.3, bwr: 0.64, nutW: 0.1, brW: 0.2, extra: 'hardanger', sympa: 4, vk: 'bow-hardanger', bridgeF: 0.64, fbEndF: 0.02 });
fid('violin', /cape.?breton|violin/, { tilt: 0, dx: 0, zoom: 0.95, n: 4, fr: 0, body: 'violin', head: 'scroll', pegs: 4, hole: 'violin', wood: '#b0642a', edge: '#3a1a0a', fb: '#17100a', headF: 0.13, neckF: 0.27, bwr: 0.62, nutW: 0.1, brW: 0.2, extra: 'violin', padF: 0.17, footRe: /heel|toe|foot|step|stomp|tap\b/i, vk: 'bow-fiddle', tapVk: 'boot', bridgeF: 0.64, fbEndF: 0.02 });
fid('masenqo', /masenqo|masinko|masenko|azmari/, { tilt: -0.05, dx: 0.02, zoom: 1.0, n: 1, fr: 0, body: 'diamond', head: 'masenqo', pegs: 1, hole: 'masenqo', wood: '#8a5424', edge: '#2a1608', fb: '#2a170a', headF: 0.15, neckF: 0.33, bwr: 1.0, nutW: 0.1, brW: 0.14, skin: true, strW: 2.4, bowL: 1.05, vk: 'bow-masenqo', bridgeF: 0.7, fbEndF: 0.02 });
fid('erhu', /erhu|huqin|er.?hu\b/, { tilt: 0, zoom: 0.96, n: 2, fr: 0, body: 'hex', head: 'erhu', pegs: 2, hole: 'erhu', wood: '#4a2412', edge: '#170a04', fb: '#2a140a', headF: 0.13, neckF: 0.6, bwr: 0.92, nutW: 0.05, brW: 0.1, skin: false, extra: 'erhu', vk: 'bow-erhu', bridgeF: 0.5, fbEndF: 0.02 });
fid('sarangi', /sarangi|gandharva/, { tilt: 0.04, dx: 0.03, zoom: 0.94, n: 3, fr: 0, body: 'sarangi', head: 'wide', pegs: 3, hole: 'sarangi', wood: '#9a4a22', edge: '#2e1608', fb: '#2a140a', headF: 0.11, neckF: 0.16, bwr: 0.44, nutW: 0.1, brW: 0.18, sympa: 9, skin: false, vk: 'bow-sarangi', bridgeF: 0.78, fbEndF: 0.34, holeF: 0.2 });

row('komuz', /komuz|qopuz/, { tilt: 0.04, n: 3, fr: 0, body: 'komuz', head: 'small', pegs: 3, hole: 'komuz', wood: '#b88034', edge: '#3a1e08', fb: '#2a170a', headF: 0.1, neckF: 0.48, bwr: 0.66, nutW: 0.12, brW: 0.26, gut: true, vk: 'lute-komuz' });
row('chonguri', /chonguri|chongur/, { tilt: -0.1, dx: -0.04, zoom: 0.92, n: 4, fr: 0, body: 'chonguri', head: 'round', pegs: 4, hole: 'chonguri', wood: '#6c3a18', edge: '#22100a', fb: '#2a170a', headF: 0.11, neckF: 0.46, bwr: 0.66, nutW: 0.18, brW: 0.34, gut: true, vk: 'lute-chonguri' });
row('saz', /\bsaz\b|ba[gğ]lama|baglama/, { tilt: 0.05, zoom: 1.0, n: 3, per: 2, fr: 16, body: 'saz', head: 'small', pegs: 3, hole: 'saz', wood: '#a4602a', edge: '#321a08', fb: '#21120a', headF: 0.1, neckF: 0.45, bwr: 1.0, nutW: 0.24, brW: 0.42, frets: 'moving', vk: 'lute-saz', spread: [76, 90], gap: 72 });
row('tar', /\btar\b|mugham|azerbaijani.?tar/, { tilt: 0, zoom: 0.94, n: 3, per: 2, fr: 18, body: 'tar', head: 'wide', pegs: 6, hole: 'tar', wood: '#8a4a1e', edge: '#2c1608', fb: '#2a170a', headF: 0.13, neckF: 0.4, bwr: 0.82, nutW: 0.15, brW: 0.28, frets: 'moving', skin: true, vk: 'lute-tar', bridgeF: 0.7, fbEndF: 0.14, spread: [78, 92] });
row('pipa', /\bpipa\b/, { tilt: 0, zoom: 0.96, n: 4, fr: 24, body: 'pipa', head: 'round', pegs: 4, hole: 'pipa', wood: '#5a2410', edge: '#1c0a04', fb: '#2a140a', headF: 0.1, neckF: 0.4, bwr: 0.64, nutW: 0.2, brW: 0.32, frets: 'raised', vk: 'lute-pipa', fbEndF: 0.52, bridgeF: 0.84 });
row('dranyen', /dranyen|dramyin|dramnyen/, { tilt: 0.04, zoom: 0.9, n: 3, per: 2, fr: 0, body: 'bowl', head: 'dragon', pegs: 6, hole: 'none', wood: '#8a2a1a', edge: '#2a0c06', fb: '#6a1a10', headF: 0.2, neckF: 0.42, bwr: 0.9, nutW: 0.14, brW: 0.24, skin: true, vk: 'lute-dranyen', bridgeF: 0.76 });
row('chapey', /chapey|chapei/, { tilt: 0.06, dx: 0.04, zoom: 0.9, n: 2, per: 1, fr: 9, body: 'chapey', head: 'swan', pegs: 2, hole: 'round', wood: '#8c5a26', edge: '#2e1a0a', fb: '#2a170a', headF: 0.19, neckF: 0.46, bwr: 0.82, nutW: 0.1, brW: 0.18, frets: 'raised', vk: 'lute-chapey', spread: [84, 96], gap: 56 });
row('tres', /\btres\b|tres.?cubano/, { tilt: 0.05, zoom: 0.94, n: 3, per: 2, fr: 15, body: 'guitar', head: 'flat', pegs: 6, hole: 'round', wood: '#c07a34', edge: '#3a1c0a', fb: '#241408', headF: 0.11, neckF: 0.4, bwr: 0.8, nutW: 0.2, brW: 0.36, tag: 'mizrab', vk: 'lute-tres', bridgeF: 0.8 });
row('veena', /veena|\bvina\b/, { tilt: 0.02, zoom: 0.92, dx: -0.04, n: 4, fr: 24, body: 'bowl', head: 'yali', pegs: 4, hole: 'veena', wood: '#b87430', edge: '#3a1e08', fb: '#1e1008', headF: 0.19, neckF: 0.4, bwr: 1.0, nutW: 0.2, brW: 0.3, frets: 'raised', extra: 'veena', vk: 'lute-veena', fbEndF: 0.64, bridgeF: 0.8, spread: [74, 84] });
row('banjo', /banjo|frailing|clawhammer/, { tilt: 0.04, zoom: 0.94, n: 4, fr: 19, body: 'banjo', head: 'flat', pegs: 4, hole: 'banjo', wood: '#a05a2a', edge: '#2a1408', fb: '#241408', headF: 0.11, neckF: 0.42, bwr: 1.0, nutW: 0.2, brW: 0.3, extra: 'banjo', footRe: /thumb|5th|fifth|drone/i, vk: 'lute-banjo', tapVk: 'lute-banjo-drone', bridgeF: 0.56, fbEndF: 0.1, holeF: 0.5, spread: [74, 84] });
row('sape', /\bsape\b|sap[eè]'|boat.?lute|dayak/, { tilt: 0.02, zoom: 0.92, n: 3, per: 1, fr: 9, body: 'boat', head: 'sape', pegs: 3, hole: 'sape', wood: '#c58f4a', edge: '#3a200a', fb: '#2a170a', headF: 0.17, neckF: 0.27, bwr: 0.4, nutW: 0.2, brW: 0.34, frets: 'raised', vk: 'lute-sape', bridgeF: 0.8, fbEndF: 0.26 });

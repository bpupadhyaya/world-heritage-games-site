// Neck instruments, third wave (1.17.0): the guitar, plectrum-lute and harp-guitar families of Latin America, through the same EXT hooks as
// stage-necks.js. Each looks different on purpose: cuatro (a small honey guitar), tiple (a slim cherry guitar with triple strings), bandola
// (a pale teardrop plectrum lute), jarana (a deep boxy rosewood body), guitarron (a huge bass belly with a silver-studded guard).
import { clamp, mix, rgba, lighter, darker, rrect, circ, ell, hgrad, vgrad, rgrad, hash, TAU } from './art.js';
import { rosette, studs, peg as pegBar } from './instr-art.js';
import { lerp } from './stagekit.js';
import { EXT } from './strings.js';
import { registerStringStage } from './registry.js';

const mir = (ctx, w, l, pts) => {
  ctx.beginPath(); ctx.moveTo(-pts[0][0] * w, pts[0][1] * l);
  for (let i = 1; i < pts.length; i++) { const p = pts[i]; ctx.bezierCurveTo(-p[0] * w, p[1] * l, -p[2] * w, p[3] * l, -p[4] * w, p[5] * l); }
  for (let i = pts.length - 1; i >= 1; i--) { const p = pts[i], q = pts[i - 1]; ctx.bezierCurveTo(p[2] * w, p[3] * l, p[0] * w, p[1] * l, (q.length === 2 ? q[0] : q[4]) * w, (q.length === 2 ? q[1] : q[5]) * l); }
  ctx.closePath();
};
const B = EXT.bodies;
B.cuatro = (ctx, w, l) => mir(ctx, w, l, [[0.18, 0], [0.28, 0.02, 0.36, 0.12, 0.38, 0.26], [0.4, 0.38, 0.26, 0.42, 0.28, 0.5], [0.3, 0.6, 0.5, 0.62, 0.5, 0.8], [0.5, 0.98, 0.26, 1, 0, 1]]);
B.tiple = (ctx, w, l) => mir(ctx, w, l, [[0.2, 0], [0.3, 0.02, 0.42, 0.1, 0.42, 0.22], [0.42, 0.36, 0.2, 0.42, 0.22, 0.54], [0.24, 0.64, 0.5, 0.62, 0.5, 0.8], [0.5, 0.97, 0.28, 1, 0, 1]]);
B.bandola = (ctx, w, l) => mir(ctx, w, l, [[0.1, 0], [0.34, 0.06, 0.5, 0.28, 0.5, 0.58], [0.5, 0.88, 0.2, 1, 0, 1]]);
B.jarana = (ctx, w, l) => mir(ctx, w, l, [[0.3, 0], [0.46, 0, 0.5, 0.1, 0.5, 0.22], [0.5, 0.4, 0.43, 0.46, 0.43, 0.52], [0.43, 0.6, 0.5, 0.66, 0.5, 0.82], [0.5, 0.98, 0.4, 1, 0, 1]]);
B.guitarron = (ctx, w, l) => mir(ctx, w, l, [[0.2, 0], [0.38, 0.02, 0.5, 0.12, 0.5, 0.3], [0.5, 0.46, 0.36, 0.5, 0.38, 0.56], [0.4, 0.64, 0.52, 0.68, 0.5, 0.82], [0.48, 0.97, 0.3, 1, 0, 1]]);

const Hd = EXT.heads;
Hd.cuatro = {   // a slim pointed arch, two pegs a side
  path: (ctx, { nutU, headH, G }) => { const hw = G.nutW / 2 + 16; ctx.beginPath(); ctx.moveTo(-hw * 0.7, nutU); ctx.lineTo(-hw * 0.9, headH * 0.4); ctx.quadraticCurveTo(-hw * 0.9, headH * 0.04, 0, 0); ctx.quadraticCurveTo(hw * 0.9, headH * 0.04, hw * 0.9, headH * 0.4); ctx.lineTo(hw * 0.7, nutU); ctx.closePath(); },
  deco: (ctx, { headH, G }) => { const hw = G.nutW / 2 + 16; for (const [sx, k] of [[-1, 0.4], [1, 0.4], [-1, 0.72], [1, 0.72]]) pegBar(ctx, sx * (hw * 0.9 + 6), headH * k, 30, 9, '#f2e6c0', 0);
    ctx.strokeStyle = '#18100a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-hw * 0.4, headH * 0.16); ctx.lineTo(hw * 0.4, headH * 0.16); ctx.stroke(); },
};
Hd.tiple = {   // a rounded-square head with a scalloped crown, three pegs a side
  path: (ctx, { nutU, headH, G }) => { const hw = G.nutW / 2 + 20; ctx.beginPath(); ctx.moveTo(-hw * 0.8, nutU); ctx.lineTo(-hw, headH * 0.35); ctx.quadraticCurveTo(-hw, headH * 0.06, -hw * 0.55, headH * 0.08); ctx.quadraticCurveTo(-hw * 0.28, -headH * 0.02, 0, headH * 0.06); ctx.quadraticCurveTo(hw * 0.28, -headH * 0.02, hw * 0.55, headH * 0.08); ctx.quadraticCurveTo(hw, headH * 0.06, hw, headH * 0.35); ctx.lineTo(hw * 0.8, nutU); ctx.closePath(); },
  deco: (ctx, { headH, G }) => { const hw = G.nutW / 2 + 20; for (let k = 0; k < 6; k++) pegBar(ctx, (k % 2 ? 1 : -1) * (hw + 4), headH * (0.28 + Math.floor(k / 2) * 0.26), 28, 8, '#d8c9a4', 0);
    ctx.fillStyle = 'rgba(232,195,90,0.85)'; circ(ctx, 0, headH * 0.36, headH * 0.1); ctx.fill(); },
};
Hd.bandola = {   // a flat paddle head with a notched crown
  path: (ctx, { nutU, headH, G }) => { const hw = G.nutW / 2 + 22; ctx.beginPath(); ctx.moveTo(-hw * 0.8, nutU); ctx.lineTo(-hw, headH * 0.3); ctx.lineTo(-hw * 0.9, headH * 0.04); ctx.lineTo(-hw * 0.12, headH * 0.04); ctx.lineTo(0, headH * 0.14); ctx.lineTo(hw * 0.12, headH * 0.04); ctx.lineTo(hw * 0.9, headH * 0.04); ctx.lineTo(hw, headH * 0.3); ctx.lineTo(hw * 0.8, nutU); ctx.closePath(); },
  deco: (ctx, { headH, G }) => { const hw = G.nutW / 2 + 22; for (let k = 0; k < 8; k++) pegBar(ctx, (k % 2 ? 1 : -1) * (hw + 4), headH * (0.2 + Math.floor(k / 2) * 0.2), 26, 7, '#efe3bc', 0); },
};

const Fc = EXT.faces;
Fc.cuatro = (ctx, G, { hole, hr, out }) => { const { bw, bl } = G;
  ctx.save(); ctx.translate(0, bl * 0.02); ctx.scale(0.95, 0.96); out(ctx, bw, bl); ctx.strokeStyle = 'rgba(14,8,4,0.85)'; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
  rosette(ctx, 0, G.holeU - G.bodyU, hr * 0.8, { spokes: 16, ring: '#2a1608', mid: '#e8d3a0' });
  ctx.fillStyle = '#1a0e06'; rrect(ctx, -bw * 0.2, bl * 0.79, bw * 0.4, bl * 0.05, 5); ctx.fill(); void hole; };
Fc.tiple = (ctx, G, { hole, hr }) => { const { bw, bl } = G; const hu = G.holeU - G.bodyU;
  hole(0, hu, hr * 0.95); ctx.strokeStyle = 'rgba(245,235,205,0.9)'; ctx.lineWidth = 3; for (const k of [1.35, 1.6]) { circ(ctx, 0, hu, hr * k); ctx.stroke(); }
  ctx.fillStyle = 'rgba(245,235,205,0.85)'; for (let k = 0; k < 24; k++) { const a = (k / 24) * TAU; circ(ctx, Math.cos(a) * hr * 1.8, hu + Math.sin(a) * hr * 1.8, 2.4); ctx.fill(); }
  ctx.fillStyle = 'rgba(20,10,4,0.55)'; ctx.beginPath(); ctx.ellipse(0, bl * 0.84, bw * 0.3, bl * 0.04, 0, 0, TAU); ctx.fill(); };
Fc.bandola = (ctx, G, { out, hole, hr }) => { const { bw, bl } = G; const hu = G.holeU - G.bodyU;
  ctx.save(); out(ctx, bw, bl); ctx.clip(); ctx.strokeStyle = 'rgba(60,30,10,0.7)'; ctx.lineWidth = 8; ctx.beginPath(); for (let k = 0; k <= 24; k++) { const a = (k / 24) * Math.PI * 2; ctx.lineTo(Math.cos(a) * bw * 0.45, bl * 0.54 + Math.sin(a) * bl * 0.42); } ctx.stroke(); ctx.restore();
  hole(0, hu, hr * 0.8); ctx.strokeStyle = 'rgba(70,40,12,0.85)'; ctx.lineWidth = 3; for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * hr * 1.7, hu + Math.sin(a) * hr * 1.7, hr * 0.28, 0, TAU); ctx.stroke(); }
  const pu = bl * 0.62; ctx.fillStyle = 'rgba(40,20,8,0.9)'; ctx.beginPath(); ctx.moveTo(bw * 0.12, pu); ctx.quadraticCurveTo(bw * 0.34, pu - bl * 0.02, bw * 0.3, pu + bl * 0.12); ctx.quadraticCurveTo(bw * 0.2, pu + bl * 0.16, bw * 0.12, pu + bl * 0.08); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(240,215,150,0.7)'; ctx.lineWidth = 2; ctx.stroke(); };
Fc.jarana = (ctx, G, { hole, hr }) => { const { bw, bl } = G;
  ctx.beginPath(); ctx.ellipse(0, G.holeU - G.bodyU, bw * 0.1, bl * 0.06, 0, 0, TAU); ctx.fillStyle = '#0c0603'; ctx.fill(); ctx.strokeStyle = '#efe3bc'; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#18100a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, G.holeU - G.bodyU, bw * 0.13, bl * 0.08, 0, 0, TAU); ctx.stroke();
  for (const [x, y] of [[-0.28, 0.3], [0.28, 0.3], [-0.3, 0.66], [0.3, 0.66], [0, 0.18]]) { ctx.fillStyle = 'rgba(240,215,150,0.85)'; ctx.beginPath(); for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, r = i % 2 ? bw * 0.02 : bw * 0.045; ctx.lineTo(x * bw + Math.cos(a) * r, y * bl + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = 'rgba(14,8,4,0.7)'; rrect(ctx, -bw * 0.24, bl * 0.8, bw * 0.48, bl * 0.04, 6); ctx.fill(); void hole; void hr; };
Fc.guitarron = (ctx, G, { hole, hr }) => { const { bw, bl } = G; const hu = G.holeU - G.bodyU;
  hole(0, hu, hr * 1.1); const pu = bl * 0.58, ph = bl * 0.3;   // the big pale guard with silver studs, strings run over it
  ctx.fillStyle = vgrad(ctx, pu, pu + ph, [[0, '#f4ecd6'], [1, '#c9bc98']]); ctx.beginPath(); ctx.moveTo(-bw * 0.34, pu); ctx.quadraticCurveTo(0, pu - ph * 0.15, bw * 0.34, pu); ctx.lineTo(bw * 0.4, pu + ph * 0.9); ctx.quadraticCurveTo(0, pu + ph * 1.1, -bw * 0.4, pu + ph * 0.9); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(90,60,30,0.7)'; ctx.lineWidth = 2.4; ctx.stroke();
  const pts = []; for (let k = 0; k < 9; k++) pts.push([-bw * 0.3 + k * bw * 0.075, pu + ph * 0.12 + Math.sin(k) * 0]); for (let k = 0; k < 9; k++) pts.push([-bw * 0.34 + k * bw * 0.085, pu + ph * 0.82]);
  studs(ctx, pts, Math.max(3, bw * 0.012), '#aab1bd'); };

const row = (id, match, p) => registerStringStage({ id, match, tables: { PROF: { [id]: { type: 'lute', per: 1, hole: 'round', tag: 'finger', gut: true, ...p } } } });
row('cuatro', /cuatro/, { tilt: 0.04, zoom: 0.95, n: 4, fr: 14, body: 'cuatro', head: 'cuatro', pegs: 4, hole: 'cuatro', wood: '#c8622a', edge: '#3a1408', fb: '#1a0f08', headF: 0.12, neckF: 0.26, bwr: 0.74, nutW: 0.2, brW: 0.34, vk: 'lute-cuatro', bridgeF: 0.8, spread: [64, 72], gap: 56 });
row('tiple', /tiple/, { tilt: 0.03, zoom: 0.95, n: 4, per: 3, fr: 14, body: 'tiple', head: 'tiple', pegs: 6, hole: 'tiple', wood: '#9a3a22', edge: '#2e0e06', fb: '#1e0e08', headF: 0.14, neckF: 0.24, bwr: 0.7, nutW: 0.22, brW: 0.36, vk: 'lute-tiple', bridgeF: 0.8, spread: [66, 74], gap: 56 });
row('bandola', /bandola|bandolin/, { tilt: 0.02, zoom: 0.95, n: 4, per: 2, fr: 14, body: 'bandola', head: 'bandola', pegs: 8, hole: 'bandola', wood: '#e2c98a', edge: '#4a3414', fb: '#2a1c0c', headF: 0.14, neckF: 0.22, bwr: 0.74, nutW: 0.22, brW: 0.34, tag: 'mizrab', vk: 'lute-bandola', bridgeF: 0.8, spread: [66, 74], gap: 56 });
row('jarana', /jarana/, { tilt: 0.0, zoom: 0.95, n: 5, fr: 12, body: 'jarana', head: 'flat', pegs: 6, hole: 'jarana', wood: '#cfa868', edge: '#3a2410', fb: '#1a0d08', headF: 0.12, neckF: 0.3, bwr: 0.98, nutW: 0.26, brW: 0.4, vk: 'lute-jarana', bridgeF: 0.8, spread: [60, 68], gap: 54 });
row('guitarron', /guitarron|guitarr[oó]n/, { tilt: 0.0, zoom: 0.95, n: 6, fr: 0, body: 'guitarron', head: 'wide', pegs: 6, hole: 'guitarron', wood: '#6a1c20', edge: '#220608', fb: '#1e0c08', headF: 0.14, neckF: 0.3, bwr: 0.96, nutW: 0.3, brW: 0.46, tag: 'finger', vk: 'lute-guitarron', bridgeF: 0.8, fbEndF: 0.1, spread: [58, 64], gap: 52 });

// Bowed fiddles, second wave (1.18.0): gusle (Balkan one-string fiddle, a pear of carved maple under a goatskin, carved ram head),
// gadulka (Bulgarian: slim pear of pale wood, a row of sympathetic-string pegs down the side) and haegeum (Korean: a very slim
// two-string fiddle with a tiny bamboo-tube resonator and a hooked head). Through the same EXT hooks as stage-necks.js.
import { clamp, mix, rgba, lighter, darker, rrect, circ, ell, hgrad, vgrad, rgrad, hash, TAU } from './art.js';
import { rosette, studs, peg as pegBar } from './instr-art.js';
import { EXT } from './strings.js';
import { registerStringStage } from './registry.js';

const mir = (ctx, w, l, pts) => {
  ctx.beginPath(); ctx.moveTo(-pts[0][0] * w, pts[0][1] * l);
  for (let i = 1; i < pts.length; i++) { const p = pts[i]; ctx.bezierCurveTo(-p[0] * w, p[1] * l, -p[2] * w, p[3] * l, -p[4] * w, p[5] * l); }
  for (let i = pts.length - 1; i >= 1; i--) { const p = pts[i], q = pts[i - 1]; ctx.bezierCurveTo(p[2] * w, p[3] * l, p[0] * w, p[1] * l, (q.length === 2 ? q[0] : q[4]) * w, (q.length === 2 ? q[1] : q[5]) * l); }
  ctx.closePath();
};
const B = EXT.bodies;
B.gusle = (ctx, w, l) => mir(ctx, w, l, [[0.2, 0], [0.34, 0.02, 0.5, 0.18, 0.5, 0.42], [0.5, 0.72, 0.4, 0.98, 0, 1]]);
B.gadulka = (ctx, w, l) => mir(ctx, w, l, [[0.16, 0], [0.3, 0.02, 0.4, 0.12, 0.4, 0.3], [0.4, 0.58, 0.5, 0.66, 0.5, 0.8], [0.5, 0.96, 0.3, 1, 0, 1]]);
B.haegeum = (ctx, w, l) => { const r = w * 0.5; ctx.beginPath(); ctx.moveTo(-w * 0.5, r * 0.5); ctx.quadraticCurveTo(-w * 0.5, 0, 0, 0); ctx.quadraticCurveTo(w * 0.5, 0, w * 0.5, r * 0.5); ctx.lineTo(w * 0.5, l - r * 0.5); ctx.quadraticCurveTo(w * 0.5, l, 0, l); ctx.quadraticCurveTo(-w * 0.5, l, -w * 0.5, l - r * 0.5); ctx.closePath(); };

const Hd = EXT.heads;
Hd.gusle = {   // a carved ram's head: a heavy blob with two curled horns
  path: (ctx, { nutU, headH, G }) => { const hw = Math.max(16, G.nutW * 0.5); ctx.beginPath(); ctx.moveTo(-hw * 0.5, nutU); ctx.lineTo(-hw * 0.7, headH * 0.5); ctx.bezierCurveTo(-hw * 1.5, headH * 0.38, -hw * 1.3, headH * 0.06, 0, headH * 0.05); ctx.bezierCurveTo(hw * 1.3, headH * 0.06, hw * 1.5, headH * 0.38, hw * 0.7, headH * 0.5); ctx.lineTo(hw * 0.5, nutU); ctx.closePath(); },
  deco: (ctx, { headH, G }) => { const hw = Math.max(16, G.nutW * 0.5);
    ctx.strokeStyle = '#2a1608'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    for (const s of [-1, 1]) { ctx.beginPath(); for (let k = 0; k < 26; k++) { const a = k * 0.3, r = hw * (1.0 - k * 0.032); ctx.lineTo(s * (hw * 1.35 + Math.cos(a * s + (s > 0 ? Math.PI : 0)) * r * 0.55), headH * 0.22 + Math.sin(a) * r * 0.55); } ctx.stroke(); }
    ctx.fillStyle = '#120a04'; for (const s of [-1, 1]) { circ(ctx, s * hw * 0.5, headH * 0.26, 3.4); ctx.fill(); }
    pegBar(ctx, 0, headH * 0.58, hw * 2.6, 9, '#4a2a12', 0); },
};
Hd.gadulka = {   // a flat paddle with three pegs on the face and a row of small pegs down the side
  path: (ctx, { nutU, headH, G }) => { const hw = G.nutW * 0.5 + 10; ctx.beginPath(); ctx.moveTo(-hw * 0.7, nutU); ctx.lineTo(-hw, headH * 0.3); ctx.quadraticCurveTo(-hw, headH * 0.02, 0, headH * 0.04); ctx.quadraticCurveTo(hw, headH * 0.02, hw, headH * 0.3); ctx.lineTo(hw * 0.7, nutU); ctx.closePath(); },
  deco: (ctx, { headH, G }) => { const hw = G.nutW * 0.5 + 10; for (let k = 0; k < 3; k++) pegBar(ctx, (k % 2 ? 1 : -1) * (hw + 6), headH * (0.22 + 0.2 * k), 28, 8, '#2a1608', 0);
    for (let k = 0; k < 4; k++) { ctx.fillStyle = '#e8dcc0'; circ(ctx, hw * 0.45, headH * (0.16 + k * 0.17), 3.4); ctx.fill(); ctx.strokeStyle = 'rgba(40,20,6,0.8)'; ctx.lineWidth = 1; ctx.stroke(); } },
};
Hd.haegeum = {   // a slim neck that hooks over to the side, two long pegs
  path: (ctx, { nutU, headH }) => { ctx.beginPath(); ctx.moveTo(-6, nutU); ctx.lineTo(-7, headH * 0.55); ctx.bezierCurveTo(-8, headH * 0.2, -4, headH * 0.04, 14, headH * 0.04); ctx.bezierCurveTo(26, headH * 0.04, 30, headH * 0.16, 22, headH * 0.2); ctx.bezierCurveTo(14, headH * 0.22, 8, headH * 0.3, 7, headH * 0.55); ctx.lineTo(6, nutU); ctx.closePath(); },
  deco: (ctx, { headH }) => { pegBar(ctx, -28, headH * 0.5, 50, 9, '#c9a24a', 0.05); pegBar(ctx, 28, headH * 0.66, 50, 9, '#c9a24a', -0.05); },
};

const Fc = EXT.faces;
Fc.gusle = (ctx, G) => { const { bw, bl } = G;   // the goatskin: a laced edge and small tacks
  ctx.save(); ctx.strokeStyle = 'rgba(40,20,6,0.8)'; ctx.lineWidth = 2.4;
  for (let k = 0; k < 26; k++) { const a = Math.PI * (0.1 + 0.8 * k / 25); const x = Math.cos(a) * bw * 0.44, y = bl * 0.55 + Math.sin(a) * bl * 0.4; ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x * 0.93, y - 22); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-x, y - 8); ctx.lineTo(-x * 0.93, y - 22); ctx.stroke(); }
  ctx.restore(); ctx.fillStyle = '#120a04'; circ(ctx, 0, bl * 0.26, bw * 0.045); ctx.fill(); };
Fc.gadulka = (ctx, G, { out }) => { const { bw, bl } = G;   // two f-holes and a ring of fine purfling
  ctx.save(); ctx.translate(0, bl * 0.01); ctx.scale(0.93, 0.95); out(ctx, bw, bl); ctx.strokeStyle = 'rgba(30,14,4,0.85)'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
  ctx.fillStyle = '#100803'; for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * bw * 0.2, bl * 0.42); ctx.rotate(s * 0.15); ctx.beginPath(); ctx.moveTo(0, -bl * 0.07); ctx.quadraticCurveTo(s * 7, 0, 0, bl * 0.07); ctx.quadraticCurveTo(-s * 3, 0, 0, -bl * 0.07); ctx.fill(); ctx.restore(); } };
Fc.haegeum = (ctx, G) => { const { bw, bl } = G;   // bamboo nodes and a small round sound window on the wooden plate at the open end
  ctx.strokeStyle = 'rgba(70,44,10,0.75)'; ctx.lineWidth = 4; for (const f of [0.2, 0.78]) { ctx.beginPath(); ctx.moveTo(-bw * 0.5, bl * f); ctx.lineTo(bw * 0.5, bl * f); ctx.stroke(); }
  ctx.fillStyle = '#100803'; circ(ctx, 0, bl * 0.5, bw * 0.16); ctx.fill(); ctx.strokeStyle = '#e8d3a0'; ctx.lineWidth = 3; ctx.stroke(); };

const fid = (id, match, p) => registerStringStage({ id, match, tables: { PROF: { [id]: { type: 'fiddle', bow: true, per: 1, hole: 'round', tag: 'finger', fr: 0, ...p } } } });
fid('gusle', /gusle|guslar|gusla/, { tilt: 0, dx: -0.02, zoom: 0.96, n: 1, body: 'gusle', head: 'gusle', pegs: 1, hole: 'gusle', wood: '#8a5a2a', edge: '#2a1608', fb: '#2a170a', headF: 0.13, neckF: 0.4, bwr: 0.9, nutW: 0.08, brW: 0.12, skin: true, strW: 2.8, vk: 'bow-gusle', bridgeF: 0.7, fbEndF: 0.04 });
fid('gadulka', /gadulka|gudulka|gadulk/, { tilt: 0.03, zoom: 0.96, n: 3, body: 'gadulka', head: 'gadulka', pegs: 3, hole: 'gadulka', wood: '#c8903c', edge: '#3a200a', fb: '#1a100a', headF: 0.14, neckF: 0.38, bwr: 0.8, nutW: 0.1, brW: 0.18, sympa: 8, vk: 'bow-gadulka', bridgeF: 0.7, fbEndF: 0.04 });
fid('haegeum', /haegeum|hae.?geum/, { tilt: 0, zoom: 0.96, n: 2, body: 'haegeum', head: 'haegeum', pegs: 2, hole: 'haegeum', wood: '#8a8a3a', edge: '#2a2a0a', fb: '#2a1a0a', headF: 0.14, neckF: 0.64, bwr: 0.3, nutW: 0.04, brW: 0.08, vk: 'bow-haegeum', bridgeF: 0.56, fbEndF: 0.02 });

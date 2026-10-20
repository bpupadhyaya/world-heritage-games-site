// Neck instruments, fourth wave (1.22.0): folk lutes and fiddles whose bodies are not guitar, pear or bowl: the West African trough lute
// (ngoni), the Hausa gourd lute (garaya), the coconut-shell bamboo fiddle (ravanahatha) and the tall one-string trumpet fiddle (tromba marina).
// Same EXT hooks as stage-necks.js; nothing existing changes.
import { clamp, mix, rgba, lighter, darker, rrect, circ, ell, hgrad, vgrad, rgrad, hash, grain, TAU } from './art.js';
import { rosette, studs, wrap, peg as pegBar } from './instr-art.js';
import { EXT } from './strings.js';
import { registerStringStage } from './registry.js';

const B = EXT.bodies, Hd = EXT.heads, Fc = EXT.faces;
// ngoni: a long, narrow, shallow canoe of carved wood, rounded at both ends, covered with hide
B.ngoni = (ctx, w, l) => { const r = w * 0.5; ctx.beginPath(); ctx.moveTo(-w * 0.42, r * 0.9); ctx.bezierCurveTo(-w * 0.42, r * 0.1, -w * 0.2, 0, 0, 0); ctx.bezierCurveTo(w * 0.2, 0, w * 0.42, r * 0.1, w * 0.42, r * 0.9); ctx.lineTo(w * 0.5, l - r); ctx.bezierCurveTo(w * 0.5, l - r * 0.1, w * 0.3, l, 0, l); ctx.bezierCurveTo(-w * 0.3, l, -w * 0.5, l - r * 0.1, -w * 0.5, l - r); ctx.closePath(); };
// garaya: half a bottle gourd, a very round, deep bowl
B.garaya = (ctx, w, l) => { ctx.beginPath(); ctx.ellipse(0, l * 0.52, w * 0.5, l * 0.48, 0, 0, TAU); ctx.closePath(); };
// ravanahatha: a half coconut shell, a round bowl with a flat cut at the neck end
B.coco = (ctx, w, l) => { ctx.beginPath(); ctx.moveTo(-w * 0.2, 0); ctx.lineTo(w * 0.2, 0); ctx.bezierCurveTo(w * 0.5, l * 0.08, w * 0.56, l * 0.62, w * 0.34, l * 0.9); ctx.bezierCurveTo(w * 0.22, l * 1.02, -w * 0.22, l * 1.02, -w * 0.34, l * 0.9); ctx.bezierCurveTo(-w * 0.56, l * 0.62, -w * 0.5, l * 0.08, -w * 0.2, 0); ctx.closePath(); };
// tromba marina: a tall pyramid-shaped wooden box, narrow at the top and wide at the foot
B.tromba = (ctx, w, l) => { ctx.beginPath(); ctx.moveTo(-w * 0.1, 0); ctx.lineTo(w * 0.1, 0); ctx.lineTo(w * 0.5, l * 0.97); ctx.quadraticCurveTo(w * 0.5, l, w * 0.44, l); ctx.lineTo(-w * 0.44, l); ctx.quadraticCurveTo(-w * 0.5, l, -w * 0.5, l * 0.97); ctx.closePath(); };

// jouhikko: a flat bowed lyre carved from one block, a trapezoid with a hole cut through for the hand behind the strings
B.jouhikko = (ctx, w, l) => { ctx.beginPath(); ctx.moveTo(-w * 0.34, w * 0.04); ctx.lineTo(w * 0.34, w * 0.04); ctx.quadraticCurveTo(w * 0.36, 0, w * 0.4, w * 0.02); ctx.lineTo(w * 0.5, l - w * 0.1); ctx.quadraticCurveTo(w * 0.5, l, w * 0.38, l); ctx.lineTo(-w * 0.38, l); ctx.quadraticCurveTo(-w * 0.5, l, -w * 0.5, l - w * 0.1); ctx.lineTo(-w * 0.4, w * 0.02); ctx.quadraticCurveTo(-w * 0.36, 0, -w * 0.34, w * 0.04); ctx.closePath(); };

Hd.ngoni = {   // the neck simply ends in a rounded block; strings tie to leather rings that slide on the neck
  path: (ctx, { nutU, headH }) => { ctx.beginPath(); ctx.moveTo(-11, nutU); ctx.lineTo(-12, headH * 0.35); ctx.quadraticCurveTo(-13, headH * 0.04, 0, headH * 0.04); ctx.quadraticCurveTo(13, headH * 0.04, 12, headH * 0.35); ctx.lineTo(11, nutU); ctx.closePath(); },
  deco: (ctx, { headH, nutU }) => { ctx.strokeStyle = '#4a2810'; ctx.lineWidth = 5; for (const u of [headH * 0.34, headH * 0.62, nutU - 4]) { ctx.beginPath(); ctx.moveTo(-14, u); ctx.lineTo(14, u); ctx.stroke(); }
    ctx.fillStyle = '#f0e4c4'; for (let k = 0; k < 4; k++) { circ(ctx, -20 + k * 13.3, headH * 0.8, 3); ctx.fill(); } },
};
Hd.garaya = {   // a slim rod with a ring of tiny metal jingles
  path: (ctx, { nutU, headH }) => { ctx.beginPath(); ctx.moveTo(-8, nutU); ctx.lineTo(-9, headH * 0.3); ctx.quadraticCurveTo(-10, headH * 0.04, 0, headH * 0.04); ctx.quadraticCurveTo(10, headH * 0.04, 9, headH * 0.3); ctx.lineTo(8, nutU); ctx.closePath(); },
  deco: (ctx, { headH }) => { for (let k = 0; k < 5; k++) { const a = -0.7 + k * 0.35; ctx.strokeStyle = '#6a4a18'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, headH * 0.2); ctx.lineTo(Math.sin(a) * 34, headH * 0.2 + Math.cos(a) * 14); ctx.stroke(); ctx.fillStyle = '#d8c070'; circ(ctx, Math.sin(a) * 34, headH * 0.2 + Math.cos(a) * 14 + 4, 5); ctx.fill(); ctx.strokeStyle = 'rgba(60,40,10,0.7)'; ctx.lineWidth = 1; ctx.stroke(); } },
};
Hd.rav = {   // a bamboo pole that ends in two big carved pegs and a hanging tassel of red thread
  path: (ctx, { nutU, headH }) => { ctx.beginPath(); ctx.moveTo(-9, nutU); ctx.lineTo(-10, headH * 0.5); ctx.bezierCurveTo(-14, headH * 0.2, -8, headH * 0.04, 0, headH * 0.04); ctx.bezierCurveTo(8, headH * 0.04, 14, headH * 0.2, 10, headH * 0.5); ctx.lineTo(9, nutU); ctx.closePath(); },
  deco: (ctx, { headH }) => { pegBar(ctx, -26, headH * 0.34, 42, 10, '#3a1c0a', 0.04); pegBar(ctx, 26, headH * 0.54, 42, 10, '#3a1c0a', -0.04);
    ctx.fillStyle = '#c0301c'; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(-6 + k * 2, headH * 0.04); ctx.lineTo(-10 + k * 3.4, headH * -0.0 - 22 - (k % 2) * 6); ctx.lineTo(-4 + k * 2, headH * 0.04); ctx.fill(); } },
};
Hd.tromba = {   // a small scroll-less head with two stout pegs
  path: (ctx, { nutU, headH }) => { ctx.beginPath(); ctx.moveTo(-8, nutU); ctx.lineTo(-10, headH * 0.4); ctx.quadraticCurveTo(-10, headH * 0.06, 0, headH * 0.05); ctx.quadraticCurveTo(10, headH * 0.06, 10, headH * 0.4); ctx.lineTo(8, nutU); ctx.closePath(); },
  deco: (ctx, { headH }) => { pegBar(ctx, -22, headH * 0.4, 34, 9, '#e8d9b0', 0); pegBar(ctx, 22, headH * 0.6, 34, 9, '#e8d9b0', 0); },
};

Hd.jouhikko = {   // a short flat block carrying three stout pegs in a row
  path: (ctx, { nutU, headH }) => { ctx.beginPath(); ctx.moveTo(-30, nutU); ctx.lineTo(-34, headH * 0.3); ctx.quadraticCurveTo(-34, headH * 0.04, 0, headH * 0.04); ctx.quadraticCurveTo(34, headH * 0.04, 34, headH * 0.3); ctx.lineTo(30, nutU); ctx.closePath(); },
  deco: (ctx, { headH }) => { for (const x of [-18, 0, 18]) pegBar(ctx, x, headH * 0.34, 30, 9, '#2a1608', Math.PI / 2); },
};

Fc.ngoni = (ctx, G) => { const { bw, bl } = G;   // pale hide stretched over the trough, a row of brass tacks along both edges, a pale bridge, two tiny holes near the neck
  ctx.save(); ctx.translate(0, bl * 0.03); ctx.scale(0.86, 0.94);
  ctx.fillStyle = hgrad(ctx, -bw / 2, bw / 2, [[0, '#a8794a'], [0.4, '#d8b480'], [0.7, '#c49a64'], [1, '#8a5e34']]);
  EXT.bodies.ngoni(ctx, bw, bl); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(0, bl * 0.03); ctx.scale(0.86, 0.94); EXT.bodies.ngoni(ctx, bw, bl); ctx.clip(); ctx.fillStyle = 'rgba(70,36,12,0.22)'; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.ellipse((hash(k) - 0.5) * bw * 0.6, bl * (0.1 + k * 0.1), bw * (0.08 + 0.1 * hash(k + 4)), bl * 0.035, hash(k + 2) * 3, 0, TAU); ctx.fill(); } ctx.restore();
  ctx.fillStyle = '#d8b24a'; for (let k = 0; k < 14; k++) { const u = bl * (0.1 + k * 0.06); const wd = bw * (0.38 + 0.1 * (k / 13)); for (const s of [-1, 1]) { circ(ctx, s * wd * 0.97, u, 3.2); ctx.fill(); } }
  ctx.fillStyle = '#5a3818'; for (const s of [-1, 1]) { circ(ctx, s * bw * 0.1, bl * 0.14, 4); ctx.fill(); }
  ctx.fillStyle = '#6a4220'; rrect(ctx, -bw * 0.3, bl * 0.69, bw * 0.6, bl * 0.03, 4); ctx.fill(); };
Fc.garaya = (ctx, G) => { const { bw, bl } = G;   // a dried gourd: mottled pale skin, a hide face laced to the rim with cord, a stem scar at the neck
  const cy = bl * 0.52;
  ctx.save(); EXT.bodies.garaya(ctx, bw, bl); ctx.clip();
  ctx.fillStyle = rgrad(ctx, -bw * 0.15, bl * 0.3, 0, bl * 0.6, [[0, 'rgba(255,240,190,0.35)'], [1, 'rgba(60,30,6,0.35)']]); ctx.fillRect(-bw, 0, bw * 2, bl);
  for (let k = 0; k < 16; k++) { ctx.fillStyle = `rgba(90,52,14,${0.1 + 0.12 * hash(k + 5)})`; ctx.beginPath(); ctx.ellipse((hash(k) - 0.5) * bw * 0.95, bl * (0.08 + 0.86 * hash(k + 11)), bw * (0.03 + 0.05 * hash(k + 2)), bl * (0.02 + 0.03 * hash(k + 7)), hash(k + 3) * 3, 0, TAU); ctx.fill(); }
  ctx.restore();
  ctx.save(); ctx.translate(0, cy); ctx.scale(0.8, 0.78); ctx.translate(0, -cy); EXT.bodies.garaya(ctx, bw, bl);
  ctx.fillStyle = rgrad(ctx, -bw * 0.08, cy - bl * 0.08, 0, bl * 0.5, [[0, '#c4a070'], [0.55, '#a07c4c'], [1, '#6e4e2a']]); ctx.fill(); ctx.strokeStyle = 'rgba(40,22,8,0.7)'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
  ctx.strokeStyle = 'rgba(60,34,10,0.95)'; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.beginPath();
  for (let k = 0; k <= 36; k++) { const a = (k / 36) * TAU, o = k % 2, rx = bw * (o ? 0.405 : 0.462), ry = bl * (o ? 0.375 : 0.43); const x = Math.cos(a) * rx, y = cy + Math.sin(a) * ry; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  ctx.fillStyle = '#2a1608'; for (let k = 0; k < 18; k++) { const a = ((k * 2 + 1) / 36) * TAU; circ(ctx, Math.cos(a) * bw * 0.405, cy + Math.sin(a) * bl * 0.375, 2.6); ctx.fill(); }
  ctx.strokeStyle = 'rgba(40,22,8,0.5)'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc((hash(k) - 0.5) * bw * 0.3, cy - bl * 0.05 + k * bl * 0.05, bw * (0.1 + 0.03 * k), hash(k + 9) * 6, hash(k + 9) * 6 + 1.6); ctx.stroke(); }
  ctx.fillStyle = '#4a2c10'; ctx.beginPath(); ctx.ellipse(0, bl * 0.045, bw * 0.06, bl * 0.02, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#6a4220'; rrect(ctx, -bw * 0.12, bl * 0.72, bw * 0.24, bl * 0.03, 4); ctx.fill(); };
Fc.coco = (ctx, G) => { const { bw, bl } = G;   // coconut shell: a skin face inside a rough dark rim with fibre streaks, a big fan-shaped opening at the back edge
  ctx.save(); ctx.translate(0, bl * 0.04); ctx.scale(0.8, 0.88); EXT.bodies.coco(ctx, bw, bl);
  ctx.fillStyle = hgrad(ctx, -bw / 2, bw / 2, [[0, '#d4b888'], [0.4, '#f3e4c0'], [1, '#c8a870']]); ctx.fill(); ctx.restore();
  ctx.strokeStyle = 'rgba(30,14,4,0.5)'; ctx.lineWidth = 2; for (let k = 0; k < 18; k++) { const a = 0.2 + k * 0.16; ctx.beginPath(); ctx.moveTo(Math.cos(a) * bw * 0.46, bl * 0.5 + Math.sin(a) * bl * 0.46); ctx.lineTo(Math.cos(a) * bw * 0.52, bl * 0.5 + Math.sin(a) * bl * 0.5); ctx.stroke(); }
  ctx.fillStyle = '#3a1c0a'; ctx.beginPath(); ctx.moveTo(-bw * 0.15, bl * 0.82); ctx.lineTo(bw * 0.15, bl * 0.82); ctx.lineTo(bw * 0.2, bl * 0.9); ctx.lineTo(-bw * 0.2, bl * 0.9); ctx.fill(); };
Fc.tromba = (ctx, G) => { const { bw, bl } = G;   // pale soundboard with two small round holes, a darker lower foot panel and the bridge standing on one foot
  ctx.save(); EXT.bodies.tromba(ctx, bw * 0.9, bl * 0.97); ctx.restore();
  ctx.fillStyle = '#100803'; for (const [x, y] of [[-0.1, 0.34], [0.1, 0.34], [0, 0.5]]) { circ(ctx, x * bw, bl * y, bw * 0.03); ctx.fill(); }
  ctx.strokeStyle = 'rgba(30,14,4,0.7)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-bw * 0.17, bl * 0.01); ctx.lineTo(-bw * 0.46, bl * 0.96); ctx.moveTo(bw * 0.17, bl * 0.01); ctx.lineTo(bw * 0.46, bl * 0.96); ctx.stroke();
  ctx.fillStyle = '#2a1608'; rrect(ctx, -bw * 0.4, bl * 0.92, bw * 0.8, bl * 0.03, 4); ctx.fill(); };


Fc.jouhikko = (ctx, G) => { const { bw, bl } = G;   // the hand hole: a deep oval cut right through the block; a plain bridge and a leather tail loop below
  ctx.fillStyle = rgrad(ctx, 0, bl * 0.4, 0, bl * 0.22, [[0, '#2a3a40'], [0.7, '#162226'], [1, '#0a1012']]); ctx.beginPath(); ctx.ellipse(0, bl * 0.34, bw * 0.3, bl * 0.2, 0, 0, TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, bl * 0.34, bw * 0.3, bl * 0.2, 0, 0, TAU); ctx.clip(); ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 14; ctx.beginPath(); ctx.ellipse(0, bl * 0.34, bw * 0.3, bl * 0.2, 0, 0, TAU); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = 'rgba(70,36,10,0.6)'; ctx.lineWidth = 2; for (let k = 0; k < 7; k++) { const x = -bw * 0.3 + k * bw * 0.1; ctx.beginPath(); ctx.moveTo(x - 5, bl * 0.04); ctx.lineTo(x + 5, bl * 0.08); ctx.moveTo(x + 5, bl * 0.04); ctx.lineTo(x - 5, bl * 0.08); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(240,215,160,0.7)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = 'rgba(70,36,10,0.55)'; ctx.lineWidth = 2; for (const k of [1.13, 1.22]) { ctx.beginPath(); ctx.ellipse(0, bl * 0.34, bw * 0.3 * k, bl * 0.2 * k, 0, 0, TAU); ctx.stroke(); }
  ctx.fillStyle = 'rgba(70,36,10,0.5)'; for (let k = 0; k < 10; k++) { circ(ctx, -bw * 0.36 + k * bw * 0.08, bl * 0.9, 3); ctx.fill(); }
  ctx.strokeStyle = '#6a3a18'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-bw * 0.2, bl * 0.96); ctx.quadraticCurveTo(0, bl * 0.78, bw * 0.2, bl * 0.96); ctx.stroke(); };

const Ex = EXT.extras;
const neckHalf = (G, u) => (G.nutW + (G.brW - G.nutW) * ((u - G.nutU) / (G.bridgeU - G.nutU))) / 2;
Ex.ngoni = { over: (ctx, G) => {   // leather rings that slide on the neck and carry the strings
  for (const f of [0.18, 0.4, 0.66]) { const u = G.nutU + (G.fbEnd - G.nutU) * f, h = neckHalf(G, u) + 9;
    ctx.fillStyle = vgrad(ctx, u - 7, u + 7, [[0, '#d8b078'], [0.5, '#a8743c'], [1, '#6a4220']]); rrect(ctx, -h, u - 6, h * 2, 12, 6); ctx.fill(); ctx.strokeStyle = 'rgba(40,20,6,0.8)'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.strokeStyle = 'rgba(40,20,6,0.5)'; ctx.lineWidth = 1; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(k * h * 0.28, u - 5); ctx.lineTo(k * h * 0.28 + 3, u + 5); ctx.stroke(); } } } };
Ex.garaya = { over: (ctx, G) => {   // small metal jingles hung along the rod
  for (const f of [0.15, 0.5, 0.85]) { const u = G.nutU + (G.fbEnd - G.nutU) * f, h = neckHalf(G, u) + 5;
    for (const s of [-1, 1]) { ctx.strokeStyle = 'rgba(70,50,16,0.9)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(s * (h - 4), u); ctx.lineTo(s * (h + 8), u + 6); ctx.stroke(); ctx.fillStyle = '#e0c870'; circ(ctx, s * (h + 10), u + 9, 6); ctx.fill(); ctx.strokeStyle = 'rgba(60,40,10,0.8)'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,230,0.6)'; circ(ctx, s * (h + 8), u + 7, 2); ctx.fill(); } } } };
Ex.ravanahatha = { over: (ctx, G) => {   // bamboo nodes
  ctx.strokeStyle = 'rgba(40,50,10,0.8)'; ctx.lineWidth = 3; for (const f of [0.0, 0.3, 0.62, 0.95]) { const u = G.nutU + (G.fbEnd - G.nutU) * f + 14, h = neckHalf(G, u) + 6; ctx.beginPath(); ctx.moveTo(-h, u); ctx.lineTo(h, u); ctx.stroke(); ctx.strokeStyle = 'rgba(200,220,120,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-h, u + 2); ctx.lineTo(h, u + 2); ctx.stroke(); ctx.strokeStyle = 'rgba(40,50,10,0.8)'; ctx.lineWidth = 3; } } };
Ex.ravanahatha.bow = (ctx, G, rt, e, activeV, u) => {   // a bow hung with a string of small brass bells that shiver as it moves
  const len = Math.min(Math.max(G.bw * 1.5, 260), G.W * 0.9), hold = Math.max(...e, 0);
  const sway = Math.sin(rt.anim * 5.4) * len * 0.16 * Math.min(1, hold * 1.6);
  const x0 = -len / 2 + sway, x1 = len / 2 + sway;
  ctx.save(); ctx.translate(0, u); ctx.rotate(activeV * 0.0006);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, x0 + 4, 8, x1 - x0, 7, 3); ctx.fill();
  ctx.fillStyle = 'rgba(250,246,232,0.96)'; rrect(ctx, x0 + 14, -2, x1 - x0 - 24, 8, 3); ctx.fill();
  ctx.fillStyle = vgrad(ctx, -12, -2, [[0, '#8a4a22'], [0.5, '#5a3014'], [1, '#2a1406']]); rrect(ctx, x0, -10, x1 - x0, 7, 3.5); ctx.fill();
  for (let k = 0; k < 9; k++) { const x = x0 + 24 + (x1 - x0 - 48) * (k / 8), sw = Math.sin(rt.anim * 14 + k) * 2.4 * Math.min(1, hold * 2);
    ctx.strokeStyle = 'rgba(60,36,10,0.9)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, -3); ctx.lineTo(x + sw, 14); ctx.stroke();
    ctx.fillStyle = rgrad(ctx, x + sw - 1, 19, 0, 7, [[0, '#fff0b0'], [0.5, '#d4a838'], [1, '#7a5a14']]); circ(ctx, x + sw, 19, 6); ctx.fill(); ctx.fillStyle = 'rgba(40,24,6,0.8)'; ctx.fillRect(x + sw - 3, 19, 6, 1.4); }
  ctx.fillStyle = '#12100e'; rrect(ctx, x0 - 6, -14, 34, 16, 5); ctx.fill();
  ctx.restore(); };

const row = (id, match, type, p) => registerStringStage({ id, match, tables: { PROF: { [id]: { type, per: 1, hole: id, tag: 'finger', ...p } } } });
row('ngoni', /ngoni|n.goni/, 'lute', { tilt: 0.1, zoom: 0.96, n: 4, fr: 0, body: 'ngoni', head: 'ngoni', pegs: 0, wood: '#8a5028', edge: '#2a1408', fb: '#a8743c', headF: 0.1, neckF: 0.36, bwr: 0.5, nutW: 0.07, brW: 0.2, extra: 'ngoni', vk: 'lute-ngoni', bridgeF: 0.7, fbEndF: 0.03, gut: true, fcap: 12 });
row('garaya', /garaya|gurmi|molo|xalam|kontigi/, 'lute', { tilt: 0.0, zoom: 0.94, n: 2, fr: 0, body: 'garaya', head: 'garaya', pegs: 0, wood: '#c9b062', edge: '#5a4410', fb: '#a8743c', headF: 0.12, neckF: 0.36, bwr: 1.0, nutW: 0.06, brW: 0.14, extra: 'garaya', vk: 'lute-garaya', bridgeF: 0.72, fbEndF: 0.03, fcap: 12 });
row('ravanahatha', /ravanahatha|ravan.?hatha|ravanastron/, 'fiddle', { bow: true, tilt: 0.3, dx: -0.1, zoom: 0.92, n: 2, fr: 0, body: 'coco', head: 'rav', pegs: 2, hole: 'coco', wood: '#5a3418', edge: '#1e0e04', fb: '#8a9a3a', headF: 0.12, neckF: 0.44, bwr: 1.12, nutW: 0.05, brW: 0.12, extra: 'ravanahatha', vk: 'bow-ravanahatha', bridgeF: 0.7, fbEndF: 0.04 });
row('jouhikko', /jouhikko|jouhi|talharpa|bowed.?lyre/, 'fiddle', { bow: true, tilt: 0.0, zoom: 0.96, n: 3, fr: 0, body: 'jouhikko', head: 'jouhikko', pegs: 3, noBoard: true, wood: '#c89a58', edge: '#4a2c10', fb: '#6a4020', headF: 0.07, neckF: 0.06, bwr: 0.56, nutW: 0.16, brW: 0.26, vk: 'bow-jouhikko', bridgeF: 0.8, fbEndF: 0.62, bowL: 1.1 });
row('tromba-marina', /tromba|marine.?trumpet|trumscheit/, 'fiddle', { bow: true, tilt: 0.0, zoom: 0.96, n: 1, fr: 0, body: 'tromba', head: 'tromba', pegs: 1, hole: 'tromba', wood: '#7a4420', edge: '#24100a', fb: '#2a170a', headF: 0.07, neckF: 0.06, bwr: 0.34, nutW: 0.0, brW: 0.0, vk: 'bow-tromba', bridgeF: 0.9, fbEndF: 0.9, fcap: 36, strW: 2.4 });

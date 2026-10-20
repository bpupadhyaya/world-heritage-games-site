// shape-craft 1.15.0: lacquerware workshops on the fine lathe: engraved and gilded bowls (Wajima), engraved betel boxes (Burma).
// Fine vessels with `engrave`: after the bands (layers of lac) the player scrapes grooves through the top layer with up to three gravers (ring, scroll, leaf);
// a groove shows the layer below, or gold leaf when the scene sets `engraveFill`. Pure canvas 2D, deterministic.
import { registerSceneSet, registerProfile } from './registry.js';
import { hash } from './geom.js';
import { tint, rgba, mix, rrect } from './fx.js';
import { lg, rg, ell, cast, TAU } from './props.js';

registerProfile('owan', [0.5, 0.46, 0.62, 0.84, 0.96, 1, 1, 0.98]);                    // a soup bowl on a high foot with a wide mouth (Wajima)
registerProfile('tsugarujar', [0.44, 0.7, 0.9, 1, 0.98, 0.86, 0.66, 0.46, 0.38, 0.42, 0.56]);                    // an ovoid vase with a slim neck and a flared lip (Tsugaru)
registerProfile('chawan', [0.54, 0.5, 0.6, 0.8, 0.95, 1, 1, 0.98]);                                       // a wide tea bowl on a low foot (Hida)
registerProfile('hsun', [0.62, 0.7, 0.74, 0.74, 0.72, 0.72, 0.72, 0.74, 0.74, 0.72]);   // a tall betel box with a domed lid (Burma)

// a small bowl seen from the side, on a baseline, for the drying-cabinet shelves
function miniBowl(ctx, x, y, w, c, rim) {
  cast(ctx, x + w * 0.05, y + 1, w * 0.5, w * 0.06, 0.4);
  ctx.beginPath(); ctx.moveTo(x - w * 0.5, y - w * 0.46); ctx.quadraticCurveTo(x - w * 0.5, y - w * 0.04, x - w * 0.14, y - w * 0.1); ctx.lineTo(x - w * 0.16, y); ctx.lineTo(x + w * 0.16, y); ctx.lineTo(x + w * 0.14, y - w * 0.1); ctx.quadraticCurveTo(x + w * 0.5, y - w * 0.04, x + w * 0.5, y - w * 0.46); ctx.closePath();
  ctx.fillStyle = lg(ctx, x - w * 0.5, 0, x + w * 0.5, 0, [[0, tint(c, -0.5)], [0.3, tint(c, 0.32)], [0.55, c], [1, tint(c, -0.6)]]); ctx.fill();
  ctx.fillStyle = rim; ell(ctx, x, y - w * 0.46, w * 0.5, w * 0.08); ctx.fill(); ctx.fillStyle = '#7a1c14'; ell(ctx, x, y - w * 0.46, w * 0.44, w * 0.055); ctx.fill();
}
function miniBox(ctx, x, y, w, h, c, lid) {
  cast(ctx, x + w * 0.06, y + 1, w * 0.55, w * 0.07, 0.4);
  ctx.fillStyle = lg(ctx, x - w / 2, 0, x + w / 2, 0, [[0, tint(c, -0.5)], [0.3, tint(c, 0.28)], [0.6, c], [1, tint(c, -0.6)]]); ctx.fillRect(x - w / 2, y - h * 0.6, w, h * 0.6);
  ctx.fillStyle = lg(ctx, x - w / 2, 0, x + w / 2, 0, [[0, tint(lid, -0.5)], [0.3, tint(lid, 0.3)], [0.6, lid], [1, tint(lid, -0.6)]]); ctx.beginPath(); ctx.moveTo(x - w * 0.52, y - h * 0.58); ctx.quadraticCurveTo(x - w * 0.5, y - h * 1.2, x, y - h * 1.25); ctx.quadraticCurveTo(x + w * 0.5, y - h * 1.2, x + w * 0.52, y - h * 0.58); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e2b84a'; ctx.fillRect(x - w * 0.53, y - h * 0.62, w * 1.06, 3);
}

const walls = {
  urushi(ctx, s, r, H, t) { // Wajima: a warm plaster wall with the open drying cabinet of a lacquer workshop, shelves of black and red bowls, a paper window
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.08)], [1, tint(s.wallC, -0.3)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let k = 0; k < 36; k++) { ctx.fillStyle = `rgba(0,0,0,${0.04 + 0.05 * hash(k, 3)})`; ell(ctx, r.x + r.w * hash(k, 1), r.y + H * hash(k, 2), 10 + 22 * hash(k, 4), 3 + 6 * hash(k, 5)); ctx.fill(); }
    const cx0 = r.x + r.w * 0.04, cw = r.w * 0.62, cy0 = r.y + H * 0.06, ch = H * 0.88;
    ctx.fillStyle = '#1b130d'; ctx.fillRect(cx0, cy0, cw, ch); ctx.strokeStyle = '#6a4424'; ctx.lineWidth = 6; ctx.strokeRect(cx0, cy0, cw, ch);
    const shelves = 3;
    for (let q = 0; q < shelves; q++) { const sy = cy0 + ch * ((q + 1) / shelves) - 6; ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 6, [[0, '#9a6a3a'], [1, '#3a2412']]); ctx.fillRect(cx0 + 4, sy, cw - 8, 6);
      const n = Math.max(3, Math.round(cw / 52)); for (let k = 0; k < n; k++) miniBowl(ctx, cx0 + 8 + ((cw - 16) * (k + 0.5)) / n, sy, 40 + 8 * hash(k, q), (k + q) % 3 ? '#14100e' : '#a8231a', '#e2b84a'); }
    const wx = r.x + r.w * 0.72, ww = r.w * 0.24, wy = r.y + H * 0.14, wh = H * 0.58;
    ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#d8e4ec'], [1, '#fbf6e6']]); ctx.fillRect(wx, wy, ww, wh); ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 4; ctx.strokeRect(wx, wy, ww, wh); ctx.lineWidth = 2;
    for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(wx + (ww * k) / 3, wy); ctx.lineTo(wx + (ww * k) / 3, wy + wh); ctx.stroke(); } for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(wx, wy + (wh * k) / 5); ctx.lineTo(wx + ww, wy + (wh * k) / 5); ctx.stroke(); }
    ctx.fillStyle = 'rgba(60,90,70,0.35)'; ctx.beginPath(); ctx.moveTo(wx + 4, wy + wh - 4); ctx.bezierCurveTo(wx + ww * 0.2, wy + wh * 0.5, wx + ww * 0.45, wy + wh * 0.5, wx + ww * 0.6, wy + wh * 0.7); ctx.lineTo(wx + ww * 0.6, wy + wh - 4); ctx.fill();
  },
  yunhut(ctx, s, r, H, t) { // Bagan: a woven-bamboo wall under a thatch eave, a river window with a boat and palms, a shelf of red and black boxes
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.06)], [1, tint(s.wallC, -0.2)]]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.lineWidth = 3; for (let d = -H; d < r.w; d += 15) { ctx.strokeStyle = (d / 15) % 2 ? 'rgba(255,236,170,0.12)' : 'rgba(50,30,6,0.22)'; ctx.beginPath(); ctx.moveTo(r.x + d, r.y); ctx.lineTo(r.x + d + H, r.y + H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(r.x + d + H, r.y); ctx.lineTo(r.x + d, r.y + H); ctx.stroke(); }
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H * 0.14, [[0, '#2a1a0a'], [1, '#6a4a22']]); ctx.fillRect(r.x, r.y, r.w, H * 0.12); ctx.strokeStyle = 'rgba(255,220,140,0.3)'; ctx.lineWidth = 1.5; for (let x = r.x; x < r.x + r.w; x += 9) { ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x - 5, r.y + H * 0.12); ctx.stroke(); }
    const wx = r.x + r.w * 0.5, ww = r.w * 0.44, wy = r.y + H * 0.2, wh = H * 0.5;
    ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#f6d48a'], [0.5, '#f0a860'], [1, '#6a8aa0']]); ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = '#4a6a7c'; ctx.fillRect(wx, wy + wh * 0.62, ww, wh * 0.38); ctx.fillStyle = 'rgba(255,214,150,0.5)'; ctx.fillRect(wx, wy + wh * 0.62, ww, 3);
    ctx.fillStyle = '#3a2a1e'; ctx.beginPath(); ctx.moveTo(wx + ww * 0.3, wy + wh * 0.8); ctx.quadraticCurveTo(wx + ww * 0.5, wy + wh * 0.9, wx + ww * 0.74, wy + wh * 0.78); ctx.lineTo(wx + ww * 0.7, wy + wh * 0.74); ctx.lineTo(wx + ww * 0.34, wy + wh * 0.75); ctx.fill();
    for (const px of [0.12, 0.88]) { const x = wx + ww * px, y = wy + wh * 0.65; ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 6, y - wh * 0.3, x + 2, y - wh * 0.5); ctx.stroke(); for (let q = 0; q < 6; q++) { const a = -Math.PI * 0.95 + (q * Math.PI * 0.9) / 5; ctx.beginPath(); ctx.moveTo(x + 2, y - wh * 0.5); ctx.quadraticCurveTo(x + 2 + Math.cos(a) * 22, y - wh * 0.5 + Math.sin(a) * 14, x + 2 + Math.cos(a) * 34, y - wh * 0.5 + Math.sin(a) * 6 + 14); ctx.stroke(); } }
    ctx.strokeStyle = '#4a2e14'; ctx.lineWidth = 7; ctx.strokeRect(wx, wy, ww, wh);
    const sx0 = r.x + r.w * 0.04, sx1 = r.x + r.w * 0.46, sy = r.y + H * 0.74; ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 7, [[0, '#b58452'], [1, '#4a2c16']]); ctx.fillRect(sx0 - 4, sy, sx1 - sx0 + 8, 7);
    const n = Math.max(3, Math.min(5, Math.round((sx1 - sx0) / 44))); for (let k = 0; k < n; k++) miniBox(ctx, sx0 + ((sx1 - sx0) * (k + 0.5)) / n, sy, 30 + 6 * hash(k, 3), 26 + 8 * hash(k, 4), k % 2 ? '#a8231a' : '#14100e', k % 2 ? '#14100e' : '#a8231a');
  },
};
function mottleBowl(ctx, x, y, w, seed) { // a small bowl whose coat has been ground back to mottled colour
  cast(ctx, x + w * 0.05, y + 1, w * 0.5, w * 0.06, 0.4);
  ctx.save(); ctx.beginPath(); ctx.moveTo(x - w * 0.5, y - w * 0.46); ctx.quadraticCurveTo(x - w * 0.5, y - w * 0.04, x - w * 0.14, y - w * 0.1); ctx.lineTo(x - w * 0.16, y); ctx.lineTo(x + w * 0.16, y); ctx.lineTo(x + w * 0.14, y - w * 0.1); ctx.quadraticCurveTo(x + w * 0.5, y - w * 0.04, x + w * 0.5, y - w * 0.46); ctx.closePath(); ctx.clip();
  ctx.fillStyle = '#14100e'; ctx.fillRect(x - w, y - w, w * 2, w * 1.2); const C = ['#c8321f', '#d8a62a', '#2f7a46', '#f2eadb']; for (let k = 0; k < 14; k++) { ctx.fillStyle = rgba(C[k % 4], 0.8); ell(ctx, x - w * 0.5 + hash(k, seed) * w, y - w * 0.4 + hash(k, seed + 1) * w * 0.4, w * 0.07, w * 0.05); ctx.fill(); } ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ell(ctx, x - w * 0.2, y - w * 0.3, w * 0.05, w * 0.1); ctx.fill();
}
walls.hirosaki = function (ctx, s, r, H, t) { // Aomori: a snowy orchard through a window, a white-on-indigo stitched cloth on the wall, a shelf of mottled bowls
  ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.1)], [1, tint(s.wallC, -0.3)]]); ctx.fillRect(r.x, r.y, r.w, H);
  const cw = r.w * 0.26, cx0 = r.x + r.w * 0.05, cy0 = r.y + H * 0.1, ch = H * 0.5; ctx.fillStyle = '#1c2a5a'; ctx.fillRect(cx0, cy0, cw, ch); ctx.strokeStyle = 'rgba(240,244,250,0.85)'; ctx.lineWidth = 1.4; for (let yy = 0; yy < 7; yy++) for (let xx = 0; xx < 6; xx++) { if ((xx + yy) % 2) continue; const px = cx0 + (cw * (xx + 0.5)) / 6, py = cy0 + (ch * (yy + 0.5)) / 7; ctx.beginPath(); ctx.moveTo(px - 6, py); ctx.lineTo(px, py - 5); ctx.lineTo(px + 6, py); ctx.lineTo(px, py + 5); ctx.closePath(); ctx.stroke(); }
  const wx = r.x + r.w * 0.38, ww = r.w * 0.34, wy = r.y + H * 0.1, wh = H * 0.56; ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#cfdcea'], [1, '#f2f6fa']]); ctx.fillRect(wx, wy, ww, wh);
  for (let k = 0; k < 4; k++) { const tx = wx + ww * (0.15 + 0.23 * k), ty = wy + wh * 0.72; ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(tx, ty + wh * 0.28); ctx.lineTo(tx, ty - wh * 0.1); ctx.moveTo(tx, ty); ctx.lineTo(tx - 14, ty - 16); ctx.moveTo(tx, ty - 6); ctx.lineTo(tx + 14, ty - 20); ctx.stroke(); ctx.fillStyle = '#c8321f'; for (const [ax, ay] of [[-16, -18], [16, -22], [0, -26]]) { ctx.beginPath(); ctx.arc(tx + ax, ty + ay, 4, 0, TAU); ctx.fill(); } ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.ellipse(tx, ty - 30, 22, 7, 0, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 6; ctx.strokeRect(wx, wy, ww, wh);
  const sy = r.y + H * 0.8, sx0 = r.x + r.w * 0.04, sx1 = r.x + r.w * 0.96; ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 7, [[0, '#a8744a'], [1, '#3a2412']]); ctx.fillRect(sx0 - 4, sy, sx1 - sx0 + 8, 7); const n = Math.max(4, Math.min(9, Math.round((sx1 - sx0) / 46))); for (let k = 0; k < n; k++) mottleBowl(ctx, sx0 + ((sx1 - sx0) * (k + 0.5)) / n, sy, 38 + 8 * hash(k, 4), k * 3);
};
walls.takayama = function (ctx, s, r, H, t) { // Hida: dark timber lattice of an old merchant house, a paper lantern, a blue and white curtain, a shelf of amber trays
  ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.04)], [1, tint(s.wallC, -0.3)]]); ctx.fillRect(r.x, r.y, r.w, H);
  const lx = r.x + r.w * 0.04, lw = r.w * 0.44, ly = r.y + H * 0.08, lh = H * 0.62; ctx.fillStyle = '#e8d8a8'; ctx.fillRect(lx, ly, lw, lh); ctx.strokeStyle = '#2a1a0e'; ctx.lineWidth = 5; for (let q = 0; q <= 12; q++) { ctx.beginPath(); ctx.moveTo(lx + (lw * q) / 12, ly); ctx.lineTo(lx + (lw * q) / 12, ly + lh); ctx.stroke(); } ctx.lineWidth = 3; for (let q = 0; q <= 3; q++) { ctx.beginPath(); ctx.moveTo(lx, ly + (lh * q) / 3); ctx.lineTo(lx + lw, ly + (lh * q) / 3); ctx.stroke(); } ctx.fillStyle = 'rgba(255,230,160,0.2)'; ctx.fillRect(lx, ly, lw, lh);
  const nx = r.x + r.w * 0.56, nw = r.w * 0.4; ctx.fillStyle = '#4a2c14'; ctx.fillRect(nx, r.y + H * 0.06, nw, 6); const nn = 3; for (let k = 0; k < nn; k++) { const x = nx + (nw * k) / nn + 3; ctx.fillStyle = '#1f3a7a'; ctx.fillRect(x, r.y + H * 0.06 + 6, nw / nn - 6, H * 0.3); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(x + (nw / nn - 6) / 2, r.y + H * 0.2, (nw / nn) * 0.15, 0, TAU); ctx.fill(); }
  const sy = r.y + H * 0.8, sx0 = r.x + r.w * 0.04, sx1 = r.x + r.w * 0.96; ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 7, [[0, '#a8744a'], [1, '#3a2412']]); ctx.fillRect(sx0 - 4, sy, sx1 - sx0 + 8, 7); const n = Math.max(4, Math.min(9, Math.round((sx1 - sx0) / 50))); for (let k = 0; k < n; k++) { const x = sx0 + ((sx1 - sx0) * (k + 0.5)) / n, w2 = 36 + 6 * hash(k, 4); cast(ctx, x + 3, sy, w2 * 0.5, 3, 0.4); ctx.fillStyle = lg(ctx, x - w2 / 2, 0, x + w2 / 2, 0, [[0, '#7a3a10'], [0.35, '#e8a040'], [1, '#6a3010']]); ctx.beginPath(); ctx.ellipse(x, sy - 10, w2 / 2, 9, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,230,170,0.35)'; ctx.beginPath(); ctx.ellipse(x - w2 * 0.12, sy - 12, w2 * 0.28, 3, 0, 0, TAU); ctx.fill(); }
};
walls.tihong = function (ctx, s, r, H, t) { // Beijing: a deep red wall with a carved lattice window onto a courtyard, a rosewood shelf of round red boxes, a hanging lantern
  ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.1)], [1, tint(s.wallC, -0.35)]]); ctx.fillRect(r.x, r.y, r.w, H);
  for (let k = 0; k < 30; k++) { ctx.fillStyle = `rgba(0,0,0,${0.05 + 0.05 * hash(k, 3)})`; ell(ctx, r.x + r.w * hash(k, 1), r.y + H * hash(k, 2), 12 + 20 * hash(k, 4), 4 + 6 * hash(k, 5)); ctx.fill(); }
  const wx = r.x + r.w * 0.58, ww = r.w * 0.36, wy = r.y + H * 0.1, wh = H * 0.62;
  ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#cfe0d4'], [1, '#7fa68a']]); ctx.fillRect(wx, wy, ww, wh);
  ctx.fillStyle = '#4a6a52'; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.quadraticCurveTo(wx + ww * 0.3, wy + wh * 0.45, wx + ww * 0.6, wy + wh * 0.72); ctx.lineTo(wx + ww, wy + wh * 0.6); ctx.lineTo(wx + ww, wy + wh); ctx.fill();
  ctx.strokeStyle = '#2a1008'; ctx.lineWidth = 3; for (let k = 0; k <= 6; k++) { ctx.beginPath(); ctx.moveTo(wx + (ww * k) / 6, wy); ctx.lineTo(wx + (ww * k) / 6, wy + wh); ctx.stroke(); } for (let k = 0; k <= 8; k++) { ctx.beginPath(); ctx.moveTo(wx, wy + (wh * k) / 8); ctx.lineTo(wx + ww, wy + (wh * k) / 8); ctx.stroke(); }
  ctx.lineWidth = 6; ctx.strokeRect(wx, wy, ww, wh);
  const sx0 = r.x + r.w * 0.04, sx1 = r.x + r.w * 0.5, sy = r.y + H * 0.74; ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 8, [[0, '#7a3a22'], [1, '#2a1008']]); ctx.fillRect(sx0 - 6, sy, sx1 - sx0 + 12, 8);
  const n = Math.max(2, Math.min(5, Math.round((sx1 - sx0) / 54)));
  for (let k = 0; k < n; k++) { const x = sx0 + ((sx1 - sx0) * (k + 0.5)) / n, w2 = 40 + 8 * hash(k, 5), h2 = 22 + 6 * hash(k, 6); cast(ctx, x + 4, sy, w2 * 0.6, 4, 0.4); ctx.fillStyle = lg(ctx, x - w2 / 2, 0, x + w2 / 2, 0, [[0, '#4a0c08'], [0.35, '#d2382a'], [0.6, '#a8231a'], [1, '#3a0806']]); ctx.beginPath(); ctx.ellipse(x, sy - h2 * 0.4, w2 / 2, h2 * 0.6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#e2b84a'; ctx.fillRect(x - w2 / 2, sy - h2 * 0.5, w2, 2); }
  const lx = r.x + r.w * 0.5; ctx.strokeStyle = '#2a1008'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, r.y); ctx.lineTo(lx, r.y + H * 0.16); ctx.stroke();
  ctx.fillStyle = rg(ctx, lx, r.y + H * 0.24, 1, 26, [[0, '#ffd890'], [1, '#c02818']]); ell(ctx, lx, r.y + H * 0.24, 17, 22); ctx.fill(); ctx.fillStyle = '#e2b84a'; ctx.fillRect(lx - 9, r.y + H * 0.16, 18, 4); ctx.fillRect(lx - 9, r.y + H * 0.3, 18, 4);
};
const floorKinds = { tatamiw: 'felt', bamboomat: 'weave' };
const floorEx = {
  tatamiw(ctx, r) { ctx.strokeStyle = 'rgba(30,40,10,0.5)'; ctx.lineWidth = 3; for (let x = r.x; x < r.x + r.w; x += 170) { ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); ctx.stroke(); } ctx.strokeStyle = 'rgba(60,70,20,0.18)'; ctx.lineWidth = 1; for (let y = r.y + 6; y < r.y + r.h; y += 6) { ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke(); } },
  bamboomat(ctx, r) { ctx.lineWidth = 4; for (let y = r.y; y < r.y + r.h; y += 10) { ctx.strokeStyle = (y / 10) % 2 ? 'rgba(255,230,160,0.18)' : 'rgba(60,36,6,0.22)'; ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke(); } },
};
const litter = {};
const frames = {};

const TC = (c, h, w) => ({ caption: c, hint: h, ...(w ?? {}) });
const W = (c, shape, glaze, engrave, win, ok) => ({ caption: c, shape, glaze, engrave, win, ok, retry: 'Back to the lathe' });
const scenes = {
  wajima: { wall: 'urushi', wallC: '#5a3a24', floor: 'tatamiw', floorC: '#a8996a', light: 'lamp', litter: [{ k: 'shavings', c: '#e8d0a0' }], dock: ['gouge', 'chisel', 'brush:#a8231a', 'pot:#14100e', 'pot:#a8231a', 'pot:#d9a93a'], dockKind: 'tray', frame: 'plinth',
    rig: 'stand', standC: '#2a1a12', tool: 'gouge', top: 'open', vessel: 'fine', view: 0.34, wscale: 1, aspect: 0.8, hscale: 0.66, lipColor: '#e2b84a', inside: '#b0241c', sheen: 0.9, matt: false, motifs: ['none'], still: true,
    engraveKinds: 3, engraveFill: '#d9a93a', engraveNames: ['line', 'vine', 'bamboo leaf'],
    words: W('Turn and gild this bowl', 'Drag across the wood to set the width of the bowl', 'Tap a band to coat it with lac', 'Scrape each lit mark; gold leaf fills the groove', 'A bowl for the gold', 'A good bowl'), pitch: 0.9, wave: 'sine' },
  yun: { wall: 'yunhut', wallC: '#a8803a', floor: 'bamboomat', floorC: '#b89a58', light: 'window', litter: [{ k: 'grass', c: '#c8a860' }], dock: ['knife', 'caliper', 'brush:#a8231a', 'pot:#14100e', 'pot:#a8231a', 'pot:#d8a62a'], dockKind: 'tray', frame: 'rail',
    rig: 'stand', standC: '#5a3c22', tool: 'gouge', top: 'open', vessel: 'fine', view: 0.16, wscale: 1, aspect: 0.52, hscale: 0.7, lid: true, lidH: 0.3, lidColor: '#a8231a', sheen: 0.8, matt: false, motifs: ['none'], still: true, seams: [0.12],
    engraveKinds: 3, engraveLayers: 2, engraveNames: ['ring', 'scroll', 'leaf'],
    words: W('Turn and engrave this box', 'Drag across the wood to set the width of the box', 'Tap a band to coat it with lac', 'Scrape each lit mark: the deeper cut shows a lower layer', 'A box worth a shelf', 'A good box'), pitch: 1.0, wave: 'triangle' },
  tsugaru: { wall: 'hirosaki', wallC: '#46506a', floor: 'planks', floorC: '#6a5238', light: 'window', litter: [{ k: 'shavings', c: '#f0e2b8' }], dock: ['sponge', 'stone', 'brush:#c8321f', 'pot:#c8321f', 'pot:#d8a62a', 'pot:#2f7a46'], dockKind: 'tray', frame: 'plinth',
    rig: 'stand', standC: '#2a1a12', tool: 'sponge', top: 'open', vessel: 'fine', view: 0.14, wscale: 1, aspect: 0.56, hscale: 0.74, sheen: 0.9, matt: false, motifs: ['none'], still: true, seams: [0.3],
    engraveKinds: 2, engraveStyle: 'band', engraveNames: ['coarse stone', 'fine stone'],
    words: W('Coat and grind this vase', 'Drag across the wood to set the width of the vase', 'Tap a band to lay a coat of lac', 'Grind each lit zone with the stone to bring up the colours beneath', 'A vase worth a shelf', 'A good vase'), pitch: 0.95, wave: 'sine' },
  shunkei: { wall: 'takayama', wallC: '#5a3a22', floor: 'planks', floorC: '#7a5636', light: 'lamp', litter: [{ k: 'shavings', c: '#f2dcae' }], dock: ['gouge', 'sponge', 'brush:#a86a20', 'pot:#d89a40', 'pot:#a86a20', 'pot:#6a3a14'], dockKind: 'tray', frame: 'plinth',
    rig: 'stand', standC: '#2a1a12', tool: 'gouge', top: 'open', vessel: 'fine', view: 0.36, wscale: 1, aspect: 0.82, hscale: 0.62, glazeAlpha: 0.5, grain: true, grainAll: true, floorGrain: true, floorColor: '#e0a850', inside: '#c88a40', sheen: 0.8, matt: false, motifs: ['none'], still: true,
    words: W('Turn and coat this bowl', 'Drag across the wood to set the width of the bowl', 'Tap a band to wipe on a clear coat: the grain shows through', 'A bowl of warm grain', 'A good bowl'), pitch: 1.0, wave: 'triangle' },
  tihong: { wall: 'tihong', wallC: '#7a1a14', floor: 'planks', floorC: '#4a2c1c', light: 'lamp', hang: [], litter: [{ k: 'chips', c: '#b3231c' }], dock: ['knife', 'gouge', 'mallet', 'pot:#b3231c'], dockKind: 'tray', frame: 'plinth',
    block: 'lac', seat: 'board', tool: 'knife', cavity: 'dark', fx: { kind: 'chip', c: '#c8321e' }, strata: ['#150a0b', '#d9a42c', '#150a0b', '#8a1d16'], pitch: 0.9, wave: 'triangle', words: TC('Carve this scroll', 'Cut the lacquer away outside the lit outline', { hintBlind: 'Cut the peony out of the red lacquer' }) },
};
registerSceneSet({
  scenes: Object.fromEntries(Object.entries(scenes).map(([id, s]) => [id, { ...s, hang: [] }])),
  rules: [['tsugaru', /tsugaru/i], ['shunkei', /shunkei/i], ['tihong', /carved (red )?lacquer|tihong|diaoqi/i], ['wajima', /chinkin|wajima/i], ['yun', /burmese lacquer|yun\b|betel/i]],
  walls, floorKinds, floorEx, litter, frames,
  soundMat: { wajima: 'wood', yun: 'wood', tihong: 'wood', tsugaru: 'wood', shunkei: 'wood' },
});

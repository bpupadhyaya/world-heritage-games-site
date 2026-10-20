// shape-craft workshops for the 1.13.0 basket forms: a Nantucket shop, a Brittany orchard, a Sussex coppice shed, an Adirondack cabin, a Guangxi
// terrace and a Kerala rattan yard. Each has its own wall, floor, light, tools and palette, and none shares a room with the 1.9.0 basket scenes.
import { registerSceneSet } from './registry.js';
import { hash } from './geom.js';
import { tint, rgba, rrect } from './fx.js';
import { lg, rg, ell, TAU } from './props.js';

const grad = (ctx, r, H, a, b) => { ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, a], [1, b]]); ctx.fillRect(r.x, r.y, r.w, H); };
const speck = (ctx, x, y, w, h, n, c, a, seed, sz = 2) => { ctx.fillStyle = rgba(c, a); ctx.beginPath(); for (let k = 0; k < n; k++) ctx.rect(x + hash(k, seed) * w, y + hash(k, seed + 1) * h, sz * (0.5 + hash(k, seed + 2)), sz * (0.5 + hash(k, seed + 3))); ctx.fill(); };

const walls = {
  bknantucket(ctx, s, r, H) { // grey cedar shingles, a ship model on a shelf, a hurricane lantern, a basket mould on the wall
    grad(ctx, r, H, tint(s.wallC, 0.1), tint(s.wallC, -0.2));
    const sh = H / 7; for (let row = 0; row < 7; row++) for (let x = r.x - (row % 2) * 11; x < r.x + r.w; x += 22) { const k = hash(row, x | 0, 9); ctx.fillStyle = tint(s.wallC, (k - 0.5) * 0.22); ctx.fillRect(x + 1, r.y + row * sh, 20, sh - 1); ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x + 1, r.y + row * sh + sh - 3, 20, 2); }
    const sy = r.y + H * 0.58, sx = r.x + r.w * 0.2; ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 7, [[0, '#d0b078'], [1, '#6a4a22']]); ctx.fillRect(sx - 80, sy, 160, 7);
    ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.moveTo(sx - 56, sy - 4); ctx.lineTo(sx + 58, sy - 4); ctx.lineTo(sx + 44, sy + 0); ctx.lineTo(sx - 44, sy + 0); ctx.fill(); ctx.fillStyle = '#e8e0cc'; for (const [mx, mh] of [[-24, 40], [4, 48], [30, 34]]) { ctx.fillRect(sx + mx - 1, sy - 4 - mh, 2, mh); ctx.beginPath(); ctx.moveTo(sx + mx + 2, sy - 6); ctx.lineTo(sx + mx + 2, sy - mh); ctx.lineTo(sx + mx + 18, sy - 8); ctx.fill(); }
    const lx = r.x + r.w * 0.6, ly = r.y + H * 0.18; ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, r.y); ctx.lineTo(lx, ly); ctx.stroke();
    ctx.fillStyle = rg(ctx, lx, ly + 24, 2, 54, [[0, 'rgba(255,214,120,0.8)'], [1, 'rgba(255,170,60,0)']]); ctx.fillRect(lx - 60, ly - 30, 120, 110); ctx.fillStyle = '#1c1812'; rrect(ctx, lx - 11, ly, 22, 6, 2); ctx.fill(); rrect(ctx, lx - 11, ly + 38, 22, 6, 2); ctx.fill(); ctx.fillStyle = 'rgba(255,225,150,0.9)'; rrect(ctx, lx - 8, ly + 6, 16, 32, 4); ctx.fill(); ctx.strokeStyle = '#1c1812'; ctx.lineWidth = 1.5; ctx.stroke();
    const mx = r.x + r.w * 0.86, my = r.y + H * 0.5; ctx.fillStyle = lg(ctx, mx - 22, 0, mx + 22, 0, [[0, '#b88a4e'], [0.5, '#8a6030'], [1, '#4a3016']]); ctx.beginPath(); ctx.moveTo(mx - 18, my - 30); ctx.lineTo(mx + 18, my - 30); ctx.lineTo(mx + 24, my + 28); ctx.lineTo(mx - 24, my + 28); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(mx - 20, my - 8); ctx.lineTo(mx + 21, my - 8); ctx.moveTo(mx - 22, my + 12); ctx.lineTo(mx + 23, my + 12); ctx.stroke();
  },
  bkorchard(ctx, s, r, H) { // apple trees in fruit above a low dry-stone wall
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#a8c4cc'], [0.6, '#d8e4d0'], [1, '#98b878']]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let t = 0; t < 4; t++) { const tx = r.x + r.w * (0.1 + t * 0.27 + hash(t, 5) * 0.06), ty = r.y + H * 0.5; ctx.fillStyle = '#3a2a18'; ctx.fillRect(tx - 4, ty, 8, H * 0.4); ctx.fillStyle = ['#4a7a3a', '#5a8a44', '#3e6c32', '#5e9248'][t]; for (let b = 0; b < 7; b++) { ctx.beginPath(); ctx.arc(tx + (hash(t, b) - 0.5) * 70, ty - H * 0.06 + (hash(b, t) - 0.5) * 30, 22 + hash(b, 3) * 14, 0, TAU); ctx.fill(); } for (let a = 0; a < 9; a++) { ctx.fillStyle = '#c0322a'; ctx.beginPath(); ctx.arc(tx + (hash(t, a + 20) - 0.5) * 80, ty - H * 0.08 + (hash(a, t + 4) - 0.5) * 40, 3.6, 0, TAU); ctx.fill(); } }
    const wy = r.y + H * 0.72, ww = 30; for (let row = 0; row < 2; row++) for (let x = r.x - row * 14; x < r.x + r.w; x += ww) { const k = hash(row, x | 0, 7); ctx.fillStyle = tint('#8a8678', (k - 0.5) * 0.3); rrect(ctx, x + 1, wy + row * H * 0.14, ww - 2, H * 0.13, 4); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(r.x, wy, r.w, 4);
  },
  bkcoppice(ctx, s, r, H) { // a trug-maker's shed: cleft chestnut palings, a shaving horse, a rack of bent handles
    grad(ctx, r, H, tint(s.wallC, 0.08), tint(s.wallC, -0.25));
    for (let x = r.x; x < r.x + r.w; x += 17) { const k = hash(x | 0, 3); ctx.fillStyle = tint(s.wallC, (k - 0.5) * 0.3); ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x + 15, r.y); ctx.lineTo(x + 15 + (k - 0.5) * 3, r.y + H); ctx.lineTo(x + (k - 0.5) * 3, r.y + H); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.strokeStyle = '#2a1c10'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(r.x, r.y + H * 0.2); ctx.lineTo(r.x + r.w, r.y + H * 0.2); ctx.stroke();
    const rx = r.x + r.w * 0.66; for (let k = 0; k < 6; k++) { ctx.strokeStyle = tint('#9a6a38', (k % 3 - 1) * 0.12); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(rx - 40 + k * 16, r.y + H * 0.8); ctx.quadraticCurveTo(rx - 40 + k * 16 + 6, r.y + H * 0.1, rx - 22 + k * 16, r.y + H * 0.85); ctx.stroke(); }
    const hx = r.x + r.w * 0.2, hy = r.y + H * 0.84; ctx.fillStyle = '#4a2e14'; ctx.fillRect(hx - 50, hy - 10, 100, 9); ctx.fillRect(hx - 44, hy - 1, 7, 18); ctx.fillRect(hx + 36, hy - 1, 7, 18); ctx.save(); ctx.translate(hx + 20, hy - 12); ctx.rotate(-0.7); ctx.fillRect(0, 0, 8, 38); ctx.restore();
    ctx.fillStyle = 'rgba(255,230,160,0.12)'; ctx.fillRect(r.x + r.w * 0.3, r.y, 36, H);
  },
  bkcabin(ctx, s, r, H) { // log cabin: round logs with chinking, a paddle, a creel, a window onto the lake and pines
    for (let row = 0; row < 5; row++) { const y = r.y + (H / 5) * row, lh = H / 5; ctx.fillStyle = lg(ctx, 0, y, 0, y + lh, [[0, tint(s.wallC, 0.2)], [0.5, tint(s.wallC, -0.02)], [1, tint(s.wallC, -0.4)]]); ctx.fillRect(r.x, y, r.w, lh - 2); ctx.fillStyle = '#b8aa8a'; ctx.fillRect(r.x, y + lh - 2, r.w, 2); ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1; ctx.beginPath(); for (let q = 0; q < 6; q++) { const yy = y + 3 + q * (lh / 7); ctx.moveTo(r.x, yy + hash(row, q) * 2); ctx.lineTo(r.x + r.w, yy + hash(q, row) * 2); } ctx.stroke(); }
    const wx = r.x + r.w * 0.62, ww = Math.min(170, r.w * 0.3), wy = r.y + H * 0.12, wh = H * 0.6;
    ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#9ab8d0'], [0.6, '#d8e4e8'], [1, '#4f7a8a']]); ctx.fillRect(wx - ww / 2, wy, ww, wh);
    ctx.fillStyle = '#16301f'; for (let t = 0; t < 7; t++) { const x = wx - ww / 2 + (ww / 7) * (t + 0.5), h = wh * (0.4 + hash(t, 6) * 0.3); ctx.beginPath(); ctx.moveTo(x, wy + wh * 0.72 - h); ctx.lineTo(x + 11, wy + wh * 0.72); ctx.lineTo(x - 11, wy + wh * 0.72); ctx.fill(); }
    ctx.fillStyle = '#2f6a80'; ctx.fillRect(wx - ww / 2, wy + wh * 0.72, ww, wh * 0.28);
    ctx.fillStyle = '#3a2412'; ctx.fillRect(wx - ww / 2 - 5, wy - 5, ww + 10, 5); ctx.fillRect(wx - ww / 2 - 5, wy + wh, ww + 10, 6); ctx.fillRect(wx - ww / 2 - 5, wy, 5, wh); ctx.fillRect(wx + ww / 2, wy, 5, wh); ctx.fillRect(wx - 1.5, wy, 3, wh);
    const px = r.x + r.w * 0.16; ctx.save(); ctx.translate(px, r.y + H * 0.5); ctx.rotate(0.12); ctx.fillStyle = '#b88a4e'; ctx.fillRect(-2, -H * 0.42, 5, H * 0.84); ctx.beginPath(); ctx.moveTo(-12, H * 0.14); ctx.quadraticCurveTo(0, H * 0.5, 12, H * 0.14); ctx.lineTo(8, H * 0.1); ctx.lineTo(-8, H * 0.1); ctx.fill(); ctx.restore();
    const cx = r.x + r.w * 0.34, cy = r.y + H * 0.5; ctx.fillStyle = '#c9a868'; ctx.beginPath(); ctx.moveTo(cx - 20, cy - 12); ctx.lineTo(cx + 20, cy - 12); ctx.lineTo(cx + 16, cy + 22); ctx.lineTo(cx - 16, cy + 22); ctx.fill(); ctx.strokeStyle = 'rgba(70,45,15,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); for (let q = -2; q <= 2; q++) { ctx.moveTo(cx + q * 7, cy - 11); ctx.lineTo(cx + q * 6, cy + 21); } ctx.moveTo(cx - 18, cy + 2); ctx.lineTo(cx + 18, cy + 2); ctx.stroke(); ctx.strokeStyle = '#4a3016'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 18, cy - 12); ctx.quadraticCurveTo(cx, cy - 30, cx + 18, cy - 12); ctx.stroke();
  },
  bkkarst(ctx, s, r, H) { // limestone peaks in mist, terraced fields and bamboo
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#c8dbe0'], [0.55, '#e6eee8'], [1, '#b8cca0']]); ctx.fillRect(r.x, r.y, r.w, H);
    for (const [k, c, b] of [[0.18, '#9bb2b4', 0.7], [0.5, '#6e9096', 0.84], [0.78, '#3f6a68', 1]]) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(r.x, r.y + H * b); for (let x = 0; x <= r.w; x += 6) { const u = x / r.w; ctx.lineTo(r.x + x, r.y + H * (b - 0.5 * Math.max(0, Math.sin(u * 9 + k * 14)) ** 1.6 * (0.6 + 0.4 * k))); } ctx.lineTo(r.x + r.w, r.y + H * b); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ell(ctx, r.x + r.w * 0.4, r.y + H * 0.42, r.w * 0.26, H * 0.07); ctx.fill(); ell(ctx, r.x + r.w * 0.78, r.y + H * 0.6, r.w * 0.2, H * 0.05); ctx.fill();
    for (let t = 0; t < 4; t++) { ctx.strokeStyle = ['#a8c070', '#8aa850', '#c0cc88', '#98b45c'][t]; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(r.x, r.y + H * (0.74 + t * 0.07)); for (let x = 0; x <= r.w; x += 10) ctx.lineTo(r.x + x, r.y + H * (0.74 + t * 0.07) + Math.sin(x * 0.03 + t) * 4); ctx.stroke(); }
    for (let b = 0; b < 12; b++) { const x = r.x + r.w * (0.03 + b * 0.025), h = H * (0.5 + hash(b, 9) * 0.4); ctx.strokeStyle = '#4a6a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, r.y + H); ctx.lineTo(x + (hash(b, 2) - 0.5) * 8, r.y + H - h); ctx.stroke(); ctx.strokeStyle = '#7a9a4a'; ctx.lineWidth = 1.5; for (let q = 0; q < 4; q++) { const yy = r.y + H - h * (0.3 + q * 0.2); ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + 14, yy + 6); ctx.stroke(); } }
  },
  bkrattanyard(ctx, s, r, H) { // laterite wall, coils of rattan cane hung up, a copper steaming pot
    grad(ctx, r, H, tint(s.wallC, 0.1), tint(s.wallC, -0.2)); speck(ctx, r.x, r.y, r.w, H, 120, '#3a1a08', 0.2, 111, 5); speck(ctx, r.x, r.y, r.w, H, 60, '#f0c898', 0.12, 115, 4);
    ctx.fillStyle = '#2a1608'; ctx.fillRect(r.x, r.y, r.w, 6);
    for (const [px, c] of [[0.1, '#d8b060'], [0.24, '#c89a48'], [0.5, '#e0bc6c'], [0.74, '#b88a3c']]) { const x = r.x + r.w * px, y = r.y + H * 0.1; ctx.fillStyle = '#3a2410'; ctx.fillRect(x - 3, y, 6, 8); for (let q = 0; q < 8; q++) { ctx.strokeStyle = tint(c, (q % 2 ? 0.15 : -0.18)); ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(x, y + 18 + q * 5.5, 24 - q * 0.8, 9, 0, 0, TAU); ctx.stroke(); } }
    const bx = r.x + r.w * 0.88, by = r.y + H * 0.7; ctx.fillStyle = lg(ctx, bx - 26, 0, bx + 26, 0, [[0, '#f0a468'], [0.45, '#b8642a'], [1, '#5a2a0a']]); ctx.beginPath(); ctx.moveTo(bx - 22, by - 24); ctx.lineTo(bx + 22, by - 24); ctx.quadraticCurveTo(bx + 34, by + 4, bx + 20, by + 22); ctx.lineTo(bx - 20, by + 22); ctx.quadraticCurveTo(bx - 34, by + 4, bx - 22, by - 24); ctx.fill(); ctx.fillStyle = '#3a1a08'; ell(ctx, bx, by - 24, 22, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; for (let q = 0; q < 3; q++) { ell(ctx, bx + q * 8 - 6, by - 36 - q * 10, 7 + q * 3, 4 + q * 2); ctx.fill(); }
  },
};
const floors = {
  bkpine(ctx, r, c) { // scrubbed pine boards and a braided rag rug
    const pl = 46; for (let y = r.y + pl; y < r.y + r.h; y += pl) { ctx.strokeStyle = 'rgba(40,24,8,0.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(90,60,20,0.14)'; ctx.lineWidth = 1; for (let k = 0; k < 60; k++) { const y = r.y + hash(k, 3) * r.h, x = r.x + hash(k, 4) * r.w; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 40, y + 2, x + 90, y - 2, x + 150, y + 1); ctx.stroke(); }
    const cx = r.x + r.w * 0.84, cy = r.y + r.h * 0.84; for (let q = 5; q >= 0; q--) { ctx.strokeStyle = ['#8a2a22', '#e8dcc0', '#2a4a6a', '#e8dcc0', '#8a2a22', '#3a5a3a'][q]; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(cx, cy, 20 + q * 7, 9 + q * 3.2, 0, 0, TAU); ctx.stroke(); }
  },
  bkgrass(ctx, r, c) { // orchard grass with windfalls and dappled shade
    speck(ctx, r.x, r.y, r.w, r.h, 380, '#2a5a1e', 0.3, 121, 3); speck(ctx, r.x, r.y, r.w, r.h, 200, '#b8d868', 0.2, 125, 2);
    ctx.strokeStyle = 'rgba(30,70,20,0.35)'; ctx.lineWidth = 1.5; for (let k = 0; k < 160; k++) { const x = r.x + r.w * hash(k, 31), y = r.y + r.h * hash(k, 32); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (hash(k, 33) - 0.5) * 6, y - 8 - hash(k, 34) * 6); ctx.stroke(); }
    ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#0a2a08'; for (let k = 0; k < 10; k++) { ell(ctx, r.x + r.w * hash(k, 41), r.y + r.h * hash(k, 42), 40 + hash(k, 43) * 40, 20 + hash(k, 44) * 20); ctx.fill(); } ctx.restore();
    for (let k = 0; k < 7; k++) { const x = r.x + r.w * hash(k, 51), y = r.y + r.h * (0.35 + hash(k, 52) * 0.65); ctx.fillStyle = k % 3 ? '#b8302a' : '#d8a030'; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(x - 2, y - 2, 2, 0, TAU); ctx.fill(); }
  },
  bkshavings(ctx, r, c) { // sawdust and pale curls of chestnut
    speck(ctx, r.x, r.y, r.w, r.h, 300, '#f0d8a0', 0.2, 131, 3); speck(ctx, r.x, r.y, r.w, r.h, 160, '#3a2410', 0.2, 135, 3);
    ctx.lineCap = 'round'; for (let k = 0; k < 36; k++) { const x = r.x + r.w * hash(k, 61), y = r.y + r.h * hash(k, 62); ctx.strokeStyle = ['#e0c488', '#c8a468', '#f0dca0'][k % 3]; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 6 + hash(k, 63) * 8, hash(k, 64) * 6, hash(k, 64) * 6 + 4.2); ctx.stroke(); }
  },
  bkcabin(ctx, r, c) { // dark spruce planks with a hand-woven rug
    const pl = 52; for (let x = r.x + pl; x < r.x + r.w; x += pl) { ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,220,160,0.07)'; ctx.lineWidth = 1; for (let k = 0; k < 50; k++) { const x = r.x + hash(k, 3) * r.w, y = r.y + hash(k, 4) * r.h; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (hash(k, 5) - 0.5) * 4, y + 60 + hash(k, 6) * 80); ctx.stroke(); }
    const rx = r.x + r.w * 0.1, ry = r.y + r.h * 0.74, rw = r.w * 0.2, rh = r.h * 0.24; ctx.fillStyle = '#7a2a1c'; rrect(ctx, rx, ry, rw, rh, 4); ctx.fill(); for (let q = 0; q < 6; q++) { ctx.fillStyle = ['#2a3a52', '#d8c8a0', '#2a3a52', '#d8c8a0', '#3a5a3a', '#d8c8a0'][q]; ctx.fillRect(rx + 4, ry + 4 + q * ((rh - 8) / 6), rw - 8, (rh - 8) / 6 - 2); }
  },
  bkbamboo(ctx, r, c) { // bamboo floor poles with nodes
    const w = 30; for (let x = r.x; x < r.x + r.w; x += w) { ctx.fillStyle = lg(ctx, x, 0, x + w, 0, [[0, tint(c, 0.18)], [0.5, tint(c, -0.02)], [1, tint(c, -0.34)]]); ctx.fillRect(x, r.y, w - 2, r.h); for (let y = r.y + hash(x | 0, 2) * 90; y < r.y + r.h; y += 90 + hash(x | 0, y | 0) * 40) { ctx.fillStyle = 'rgba(60,40,10,0.5)'; ctx.fillRect(x, y, w - 2, 3); ctx.fillStyle = 'rgba(255,240,180,0.22)'; ctx.fillRect(x, y + 3, w - 2, 1.5); } }
  },
  bkcane(ctx, r, c) { // red laterite dust with a few canes lying about
    speck(ctx, r.x, r.y, r.w, r.h, 300, '#2a0e04', 0.2, 141, 3); speck(ctx, r.x, r.y, r.w, r.h, 130, '#f0b888', 0.14, 145, 2);
    for (let k = 0; k < 9; k++) { const x = r.x + r.w * hash(k, 71), y = r.y + r.h * (0.3 + hash(k, 72) * 0.7), a = (hash(k, 73) - 0.5) * 0.6; ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-60 + 2, 2, 120, 5); ctx.fillStyle = lg(ctx, 0, -3, 0, 4, [[0, '#f0d080'], [1, '#a87a30']]); rrect(ctx, -60, -3, 120, 6, 3); ctx.fill(); ctx.restore(); }
  },
};
const T = (c, h, w) => ({ caption: c, hint: h, ...(w ?? {}) });
const scenes = {
  'bk-nantucket': { wall: 'bknantucket', wallC: '#8f9ea4', floor: 'bkpine', floorC: '#c9a870', light: 'lamp', litter: [{ k: 'grass', c: '#d6b87a' }], dock: ['strip:#e0c488', 'awl', 'spool:#2a4a6a', 'scissors'], dockKind: 'ledge', frame: 'case', wood: '#5a3a1e', words: T('Weave this lightship basket', 'Rattan over each oak stave, row on row', { win: 'A basket of the island' }), pitch: 0.95 },
  'bk-orchard': { wall: 'bkorchard', wallC: '#7aa05a', floor: 'bkgrass', floorC: '#5a8a3e', light: 'window', litter: [{ k: 'scraps', c: '#c0322a' }], dock: ['strip:#b88a4e', 'awl', 'scissors', 'bowl'], dockKind: 'cloth', frame: 'niche', wood: '#6a4a24', words: T('Weave this hooped basket', 'Pass the willow over and under the hoops', { win: 'A basket for the apple harvest' }), pitch: 1.15 },
  'bk-coppice': { wall: 'bkcoppice', wallC: '#6a5238', floor: 'bkshavings', floorC: '#8a6a44', light: 'window', litter: [{ k: 'shavings', c: '#e0c488' }], dock: ['knife', 'mallet', 'strip:#d6b88a', 'pins'], dockKind: 'tray', frame: 'rail', wood: '#9a6a38', words: T('Build this trug', 'Nail each board over the one below', { win: 'A trug for the garden' }), pitch: 0.85 },
  'bk-cabin': { wall: 'bkcabin', wallC: '#8a5a32', floor: 'bkcabin', floorC: '#4a3220', light: 'lamp', litter: [{ k: 'thread', c: '#d6c088' }], dock: ['strip:#e8d4a0', 'awl', 'hank:#6b3f22', 'scissors'], dockKind: 'ledge', frame: 'peg', wood: '#5a3a1e', words: T('Weave this pack basket', 'Ash splint over and under, tight to the last row', { win: 'A basket for the trail' }), pitch: 0.75 },
  'bk-terrace': { wall: 'bkkarst', wallC: '#d8e4d8', floor: 'bkbamboo', floorC: '#d8bc78', light: 'window', litter: [{ k: 'grass', c: '#e8d890' }], dock: ['strip:#efe0a0', 'knife', 'strip:#2a3a6a', 'bowl'], dockKind: 'cloth', frame: 'mirror', wood: '#b8923e', words: T('Plait this bamboo hat', 'Split bamboo, ring by ring from the brim', { win: 'A hat for the terraces' }), pitch: 1.3 },
  'bk-rattanyard': { wall: 'bkrattanyard', wallC: '#a8582c', floor: 'bkcane', floorC: '#8a4a2a', light: 'window', litter: [{ k: 'grass', c: '#d8b060' }], dock: ['strip:#d8b060', 'knife', 'strip:#a87a30', 'awl'], dockKind: 'tray', frame: 'tile', wood: '#8a5a2a', words: T('Weave this cane stool', 'Weave the seat of rattan round and round', { win: 'A seat of cane' }), pitch: 1.05 },
};
registerSceneSet({
  scenes: Object.fromEntries(Object.entries(scenes).map(([id, sc]) => [id, { ...sc, hang: [] }])),
  walls, floorKinds: { bkpine: 'wood', bkgrass: 'felt', bkshavings: 'felt', bkcabin: 'wood', bkbamboo: 'wood', bkcane: 'felt' }, floorEx: floors,
  soundMat: { 'bk-nantucket': 'bamboo', 'bk-orchard': 'willow', 'bk-coppice': 'cane', 'bk-cabin': 'palm', 'bk-terrace': 'reed', 'bk-rattanyard': 'cord' },
});

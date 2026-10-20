// shape-craft workshops for flat mats (1.13.0): each mat is woven in its own place. The wall band is low (wallK), the rest is the floor seen
// from above, with the floor's own character (red oxide with rice-paste painting, split bamboo, granite with a kolam, a teak deck, swept earth ...).
import { registerSceneSet, registerProp } from './registry.js';
import { hash } from './geom.js';
import { tint, rgba, rrect, mix } from './fx.js';
import { lg, rg, ell, cast, TAU } from './props.js';

const grad = (ctx, r, H, a, b) => { ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, a], [1, b]]); ctx.fillRect(r.x, r.y, r.w, H); };
const post = (ctx, x, y, w, h, c) => { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 3, y, w, h); ctx.fillStyle = lg(ctx, x, 0, x + w, 0, [[0, tint(c, 0.3)], [0.5, c], [1, tint(c, -0.45)]]); ctx.fillRect(x, y, w, h); };
const speck = (ctx, x, y, w, h, n, c, a, seed, sz = 2) => { ctx.fillStyle = rgba(c, a); ctx.beginPath(); for (let k = 0; k < n; k++) ctx.rect(x + hash(k, seed) * w, y + hash(k, seed + 1) * h, sz * (0.5 + hash(k, seed + 2)), sz * (0.5 + hash(k, seed + 3))); ctx.fill(); };

const walls = {
  mtveranda(ctx, s, r, H) { // Bengal verandah: ochre mud plaster, red pillars with brackets, a lota on a peg, banana leaf shadow
    grad(ctx, r, H, tint(s.wallC, 0.12), tint(s.wallC, -0.1)); speck(ctx, r.x, r.y, r.w, H, 90, '#4a2a10', 0.12, 71, 4);
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H * 0.3, [[0, '#2a1a0e'], [1, 'rgba(42,26,14,0)']]); ctx.fillRect(r.x, r.y, r.w, H * 0.3);
    ctx.strokeStyle = 'rgba(40,25,10,0.5)'; ctx.lineWidth = 2; for (let x = r.x + 10; x < r.x + r.w; x += 16) { ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x + 4, r.y + H * 0.2); ctx.stroke(); }
    const n = Math.max(2, Math.round(r.w / 230));
    for (let k = 0; k < n; k++) { const x = r.x + (r.w * (k + 0.5)) / n; post(ctx, x - 9, r.y + H * 0.08, 18, H * 0.92, '#a3321e'); ctx.fillStyle = '#e7c35a'; for (const y of [0.34, 0.6, 0.86]) ctx.fillRect(x - 9, r.y + H * y, 18, 3); ctx.fillStyle = '#a3321e'; ctx.beginPath(); ctx.moveTo(x - 9, r.y + H * 0.2); ctx.quadraticCurveTo(x - 30, r.y + H * 0.2, x - 34, r.y + H * 0.34); ctx.lineTo(x - 9, r.y + H * 0.3); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + 9, r.y + H * 0.2); ctx.quadraticCurveTo(x + 30, r.y + H * 0.2, x + 34, r.y + H * 0.34); ctx.lineTo(x + 9, r.y + H * 0.3); ctx.fill(); }
    const lx = r.x + r.w * 0.28, ly = r.y + H * 0.5; ctx.fillStyle = lg(ctx, lx - 11, 0, lx + 11, 0, [[0, '#f0cf6a'], [0.5, '#c59a2e'], [1, '#6a4c10']]); ctx.beginPath(); ctx.arc(lx, ly, 11, 0, TAU); ctx.fill(); ctx.fillRect(lx - 4, ly - 17, 8, 8);
    ctx.save(); ctx.globalAlpha = 0.16; ctx.strokeStyle = '#1a2a14'; ctx.lineWidth = 4; for (let k = 0; k < 5; k++) { const x0 = r.x + r.w * 0.62 + k * 26; ctx.beginPath(); ctx.moveTo(x0, r.y); ctx.quadraticCurveTo(x0 + 30, r.y + H * 0.4, x0 + 12 + k * 4, r.y + H); ctx.stroke(); } ctx.restore();
  },
  mtstilt(ctx, s, r, H) { // Samar stilt house: woven bamboo wall in diamonds, capiz window, nipa eave
    grad(ctx, r, H, tint(s.wallC, 0.08), tint(s.wallC, -0.16));
    const cell = Math.max(9, H / 7);
    for (let y = r.y + H * 0.2; y < r.y + H; y += cell) for (let x = r.x; x < r.x + r.w; x += cell) { const o = ((Math.round((y - r.y) / cell) + Math.round((x - r.x) / cell)) & 1); ctx.fillStyle = o ? 'rgba(255,230,160,0.14)' : 'rgba(40,24,6,0.22)'; ctx.beginPath(); ctx.moveTo(x, y + cell / 2); ctx.lineTo(x + cell / 2, y); ctx.lineTo(x + cell, y + cell / 2); ctx.lineTo(x + cell / 2, y + cell); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H * 0.24, [[0, '#6a5a2a'], [1, '#3a2f12']]); ctx.fillRect(r.x, r.y, r.w, H * 0.24);
    ctx.strokeStyle = 'rgba(230,200,110,0.35)'; ctx.lineWidth = 1.5; for (let x = r.x; x < r.x + r.w; x += 7) { ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x - 3, r.y + H * 0.24); ctx.stroke(); }
    const wx = r.x + r.w * 0.7, ww = Math.min(150, r.w * 0.26), wy = r.y + H * 0.3, wh = H * 0.62;
    ctx.fillStyle = '#4a2f14'; ctx.fillRect(wx - 5, wy - 5, ww + 10, wh + 10);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const px = wx + (ww / 4) * i, py = wy + (wh / 3) * j; ctx.fillStyle = lg(ctx, px, py, px + ww / 4, py + wh / 3, [[0, '#fffbe8'], [0.5, '#e8f0e0'], [1, '#c4d6d0']]); ctx.fillRect(px + 1.5, py + 1.5, ww / 4 - 3, wh / 3 - 3); }
    ctx.strokeStyle = '#4a2f14'; ctx.lineWidth = 3; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(wx + (ww / 4) * i, wy); ctx.lineTo(wx + (ww / 4) * i, wy + wh); ctx.stroke(); } for (let j = 1; j < 3; j++) { ctx.beginPath(); ctx.moveTo(wx, wy + (wh / 3) * j); ctx.lineTo(wx + ww, wy + (wh / 3) * j); ctx.stroke(); }
    const hx = r.x + r.w * 0.16; ctx.strokeStyle = '#d93a7a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx, r.y + H * 0.3); ctx.lineTo(hx, r.y + H * 0.85); ctx.stroke(); ctx.strokeStyle = '#2fa45a'; ctx.beginPath(); ctx.moveTo(hx + 12, r.y + H * 0.3); ctx.lineTo(hx + 12, r.y + H * 0.8); ctx.stroke(); ctx.strokeStyle = '#e0b030'; ctx.beginPath(); ctx.moveTo(hx + 24, r.y + H * 0.3); ctx.lineTo(hx + 24, r.y + H * 0.88); ctx.stroke(); // dyed palm strips hung to dry
  },
  mthills(ctx, s, r, H) { // Kandyan porch: white plaster, timber posts, clay tile eave, open view to misty hills
    grad(ctx, r, H, '#d8dfcf', '#b9c5ac');
    const vx = r.x + r.w * 0.34, vw = r.w * 0.4, vy = r.y + H * 0.2;
    ctx.fillStyle = lg(ctx, 0, vy, 0, r.y + H, [[0, '#d9e7ea'], [0.6, '#b3cbb4'], [1, '#6f9460']]); ctx.fillRect(vx, vy, vw, r.y + H - vy);
    for (const [k, c] of [[0.5, '#a8c0aa'], [0.7, '#7fa481'], [0.9, '#4f7a4a']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(vx, r.y + H); for (let x = 0; x <= vw; x += 8) ctx.lineTo(vx + x, vy + (r.y + H - vy) * k - Math.sin(x * 0.04 + k * 9) * H * 0.1 - hash(x | 0, 3) * 2); ctx.lineTo(vx + vw, r.y + H); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ell(ctx, vx + vw * 0.3, vy + H * 0.22, vw * 0.22, H * 0.06); ctx.fill();
    post(ctx, vx - 8, r.y + H * 0.16, 16, H * 0.84, '#5a3a22'); post(ctx, vx + vw - 8, r.y + H * 0.16, 16, H * 0.84, '#5a3a22');
    ctx.fillStyle = '#4a2c18'; ctx.fillRect(vx - 14, r.y + H * 0.14, vw + 28, H * 0.07);
    for (let y = 0; y < 3; y++) for (let x = r.x; x < r.x + r.w; x += 14) { ctx.fillStyle = (x / 14 + y) % 2 ? '#a8472a' : '#c0583a'; ctx.beginPath(); ctx.moveTo(x, r.y + y * H * 0.06); ctx.lineTo(x + 14, r.y + y * H * 0.06); ctx.lineTo(x + 12, r.y + (y + 1) * H * 0.06); ctx.lineTo(x + 2, r.y + (y + 1) * H * 0.06); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(r.x, r.y + H * 0.18, r.w, 5);
    const sx = r.x + r.w * 0.12; ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx - 28, r.y + H * 0.34); ctx.lineTo(sx + 28, r.y + H * 0.34); ctx.stroke(); // yarn hung on a rail
    for (let k = 0; k < 4; k++) { ctx.fillStyle = ['#a8301f', '#e8e0cc', '#1c1c1c', '#c89a30'][k]; ctx.beginPath(); ctx.moveTo(sx - 26 + k * 16, r.y + H * 0.34); ctx.lineTo(sx - 16 + k * 16, r.y + H * 0.34); ctx.lineTo(sx - 14 + k * 16, r.y + H * 0.74); ctx.lineTo(sx - 25 + k * 16, r.y + H * 0.74); ctx.fill(); }
  },
  mtriver(ctx, s, r, H) { // Tamil porch: lime-washed wall, red and white striped plinth, barred window onto palms and the river
    grad(ctx, r, H, tint(s.wallC, 0.1), tint(s.wallC, -0.08)); speck(ctx, r.x, r.y, r.w, H, 70, '#8a7a5a', 0.1, 73, 3);
    const by = r.y + H * 0.62, n = Math.ceil(r.w / 26); for (let k = 0; k < n; k++) { ctx.fillStyle = k % 2 ? '#f4eee0' : '#b8321f'; ctx.fillRect(r.x + k * 26, by, 26, H * 0.38); }
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(r.x, by, r.w, 3);
    const wx = r.x + r.w * 0.5, ww = Math.min(190, r.w * 0.34), wy = r.y + H * 0.12, wh = H * 0.46;
    ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#bfe0e8'], [0.55, '#e8efdc'], [1, '#6fa068']]); ctx.fillRect(wx - ww / 2, wy, ww, wh);
    ctx.fillStyle = '#3a8aa0'; ctx.fillRect(wx - ww / 2, wy + wh * 0.72, ww, wh * 0.28); ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let q = 0; q < 5; q++) ctx.fillRect(wx - ww / 2 + ww * (0.1 + q * 0.18), wy + wh * (0.78 + (q % 2) * 0.08), ww * 0.1, 2);
    ctx.strokeStyle = '#2f5a22'; ctx.lineWidth = 3; for (const px of [0.2, 0.78]) { const x = wx - ww / 2 + ww * px; ctx.beginPath(); ctx.moveTo(x, wy + wh * 0.75); ctx.quadraticCurveTo(x + 4, wy + wh * 0.4, x - 2, wy + wh * 0.18); ctx.stroke(); for (let q = 0; q < 5; q++) { ctx.beginPath(); ctx.moveTo(x - 2, wy + wh * 0.18); ctx.quadraticCurveTo(x + (q - 2) * 9, wy + wh * 0.06, x + (q - 2) * 14, wy + wh * (0.22 + Math.abs(q - 2) * 0.05)); ctx.stroke(); } }
    ctx.fillStyle = '#4a2c14'; ctx.fillRect(wx - ww / 2 - 6, wy - 6, ww + 12, 6); ctx.fillRect(wx - ww / 2 - 6, wy + wh, ww + 12, 7); ctx.fillRect(wx - ww / 2 - 6, wy, 6, wh); ctx.fillRect(wx + ww / 2, wy, 6, wh);
    ctx.strokeStyle = '#4a2c14'; ctx.lineWidth = 3; for (let q = 1; q < 6; q++) { const x = wx - ww / 2 + (ww / 6) * q; ctx.beginPath(); ctx.moveTo(x, wy); ctx.lineTo(x, wy + wh); ctx.stroke(); }
    post(ctx, r.x + r.w * 0.14, r.y + H * 0.04, 20, H * 0.96, '#6a3a1a'); post(ctx, r.x + r.w * 0.86 - 20, r.y + H * 0.04, 20, H * 0.96, '#6a3a1a');
    const lx = r.x + r.w * 0.78, ly = r.y + H * 0.42; ctx.fillStyle = lg(ctx, lx - 10, 0, lx + 10, 0, [[0, '#f2d06a'], [0.5, '#c8982c'], [1, '#6a4a10']]); ctx.beginPath(); ctx.moveTo(lx - 8, ly + 18); ctx.lineTo(lx + 8, ly + 18); ctx.lineTo(lx + 12, ly); ctx.lineTo(lx - 12, ly); ctx.fill(); ctx.fillRect(lx - 3, ly - 14, 6, 14); ctx.fillStyle = 'rgba(255,200,90,0.6)'; ell(ctx, lx, ly - 18, 5, 8); ctx.fill();
  },
  mtbackwaterwall(ctx, s, r, H) { // Kerala backwater at dusk: palms, a houseboat, water
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H * 0.62, [[0, '#35527a'], [0.45, '#e08a5a'], [1, '#f6c27a']]); ctx.fillRect(r.x, r.y, r.w, H * 0.64);
    const sx = r.x + r.w * 0.3; ctx.fillStyle = rg(ctx, sx, r.y + H * 0.5, 2, H * 0.7, [[0, 'rgba(255,244,200,0.95)'], [0.3, 'rgba(255,210,140,0.5)'], [1, 'rgba(255,170,90,0)']]); ctx.fillRect(r.x, r.y, r.w, H * 0.7);
    ctx.fillStyle = lg(ctx, 0, r.y + H * 0.62, 0, r.y + H, [[0, '#e49a62'], [1, '#2c5a62']]); ctx.fillRect(r.x, r.y + H * 0.62, r.w, H * 0.38);
    ctx.strokeStyle = 'rgba(255,230,170,0.5)'; ctx.lineWidth = 1.5; for (let k = 0; k < 7; k++) { const y = r.y + H * (0.68 + k * 0.045); ctx.beginPath(); ctx.moveTo(sx - 70 + k * 7, y); ctx.lineTo(sx + 70 - k * 7, y); ctx.stroke(); }
    ctx.fillStyle = '#1a2e2a'; ctx.beginPath(); ctx.moveTo(r.x, r.y + H * 0.64); for (let x = 0; x <= r.w; x += 12) ctx.lineTo(r.x + x, r.y + H * (0.6 - 0.02 * Math.sin(x * 0.05))); ctx.lineTo(r.x + r.w, r.y + H * 0.64); ctx.fill();
    const boatX = r.x + r.w * 0.62, by = r.y + H * 0.66; ctx.fillStyle = '#1c1410'; ctx.beginPath(); ctx.moveTo(boatX - 70, by - 4); ctx.quadraticCurveTo(boatX - 50, by + 8, boatX, by + 8); ctx.quadraticCurveTo(boatX + 60, by + 6, boatX + 82, by - 8); ctx.lineTo(boatX + 70, by - 4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(boatX - 52, by - 4); ctx.quadraticCurveTo(boatX, by - 36, boatX + 56, by - 5); ctx.fill(); ctx.strokeStyle = 'rgba(255,200,110,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); for (let q = -4; q <= 4; q++) { ctx.moveTo(boatX + q * 11, by - 8 - (16 - Math.abs(q) * 3)); ctx.lineTo(boatX + q * 11, by - 5); } ctx.stroke();
    for (const [px, ph, lean] of [[0.08, 0.9, -8], [0.2, 0.75, 6], [0.9, 0.85, 10], [0.78, 0.66, -5]]) { const x = r.x + r.w * px, y0 = r.y + H, y1 = r.y + H - H * ph; ctx.strokeStyle = '#0e1a14'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + lean * 0.5, (y0 + y1) / 2, x + lean, y1); ctx.stroke(); ctx.lineWidth = 2.5; for (let q = 0; q < 7; q++) { const a = -Math.PI / 2 + (q - 3) * 0.5; ctx.beginPath(); ctx.moveTo(x + lean, y1); ctx.quadraticCurveTo(x + lean + Math.cos(a) * 22, y1 + Math.sin(a) * 14, x + lean + Math.cos(a) * 34, y1 + Math.sin(a) * 6 + 14); ctx.stroke(); } }
  },
  mthaveli(ctx, s, r, H) { // Punjab courtyard wall: mud plaster, whitewashed band, a lamp niche, coils of jute rope on pegs
    grad(ctx, r, H, tint(s.wallC, 0.12), tint(s.wallC, -0.14)); speck(ctx, r.x, r.y, r.w, H, 100, '#5a4020', 0.14, 77, 4);
    ctx.fillStyle = '#efe6d2'; ctx.fillRect(r.x, r.y + H * 0.7, r.w, H * 0.3); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(r.x, r.y + H * 0.7, r.w, 3);
    ctx.fillStyle = '#b8321f'; ctx.fillRect(r.x, r.y + H * 0.7 + 4, r.w, 5);
    const nx = r.x + r.w * 0.66, nw = 54, ny = r.y + H * 0.1, nh = H * 0.48;
    ctx.fillStyle = '#2a1a0a'; ctx.beginPath(); ctx.moveTo(nx - nw / 2, ny + nh); ctx.lineTo(nx - nw / 2, ny + nw * 0.6); ctx.quadraticCurveTo(nx - nw / 2, ny, nx, ny - 8); ctx.quadraticCurveTo(nx + nw / 2, ny, nx + nw / 2, ny + nw * 0.6); ctx.lineTo(nx + nw / 2, ny + nh); ctx.fill();
    ctx.fillStyle = rg(ctx, nx, ny + nh * 0.7, 2, nw, [[0, 'rgba(255,200,100,0.85)'], [1, 'rgba(255,150,60,0)']]); ctx.fillRect(nx - nw / 2, ny, nw, nh); ctx.fillStyle = '#c47a2a'; ell(ctx, nx, ny + nh - 8, 12, 5); ctx.fill(); ctx.fillStyle = '#ffd37a'; ell(ctx, nx + 8, ny + nh - 14, 3, 5); ctx.fill();
    for (const [px, c] of [[0.12, '#c8a860'], [0.3, '#a8884a'], [0.88, '#d8b870']]) { const x = r.x + r.w * px, y = r.y + H * 0.2; ctx.fillStyle = '#3a2410'; ctx.fillRect(x - 3, y - 6, 6, 8); for (let q = 0; q < 6; q++) { ctx.strokeStyle = tint(c, (q % 2 ? 0.2 : -0.2)); ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(x, y + 14 + q * 3.5, 18 - q, 7, 0, 0, TAU); ctx.stroke(); } }
  },
  mtneem(ctx, s, r, H) { // old brick wall in a courtyard under a neem tree
    grad(ctx, r, H, tint(s.wallC, 0.08), tint(s.wallC, -0.22));
    const bh = H / 6; for (let row = 0; row < 6; row++) { const off = row % 2 ? 22 : 0; for (let x = r.x - off; x < r.x + r.w; x += 44) { const k = hash(row, x | 0, 3); ctx.fillStyle = tint(s.wallC, (k - 0.5) * 0.25); ctx.fillRect(x + 1.5, r.y + row * bh + 1.5, 41, bh - 3); } }
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(r.x, r.y, r.w, 5);
    const tx = r.x + r.w * 0.18; ctx.fillStyle = lg(ctx, tx - 16, 0, tx + 16, 0, [[0, '#6a5038'], [1, '#2a1c10']]); ctx.beginPath(); ctx.moveTo(tx - 14, r.y + H); ctx.quadraticCurveTo(tx - 8, r.y + H * 0.5, tx - 10, r.y); ctx.lineTo(tx + 10, r.y); ctx.quadraticCurveTo(tx + 8, r.y + H * 0.5, tx + 16, r.y + H); ctx.fill();
    ctx.save(); ctx.globalAlpha = 0.24; ctx.fillStyle = '#16301a'; for (let k = 0; k < 46; k++) { const x = r.x + r.w * (0.3 + hash(k, 5) * 0.7), y = r.y + H * hash(k, 6), a = hash(k, 7) * TAU; ctx.save(); ctx.translate(x, y); ctx.rotate(a); ell(ctx, 0, 0, 9, 3.4); ctx.fill(); ctx.restore(); } ctx.restore();
    const px = r.x + r.w * 0.74; ctx.fillStyle = lg(ctx, px - 14, 0, px + 14, 0, [[0, '#f0c458'], [0.5, '#c0902a'], [1, '#5a3c0c']]); ctx.beginPath(); ctx.arc(px, r.y + H * 0.72, 15, 0, TAU); ctx.fill(); ctx.fillRect(px - 6, r.y + H * 0.72 - 24, 12, 12); ctx.strokeStyle = '#4a3a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, r.y); ctx.lineTo(px, r.y + H * 0.72 - 24); ctx.stroke();
  },
  mtlagoonwall(ctx, s, r, H) { // palm-leaf walls with a window onto a lagoon at sunrise
    grad(ctx, r, H, tint(s.wallC, 0.06), tint(s.wallC, -0.2));
    for (let x = r.x; x < r.x + r.w; x += 14) { ctx.strokeStyle = tint(s.wallC, ((x / 14) % 3 - 1) * 0.1); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x + 3, r.y + H); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(30,20,6,0.35)'; ctx.lineWidth = 2; for (const f of [0.35, 0.7]) { ctx.beginPath(); ctx.moveTo(r.x, r.y + H * f); ctx.lineTo(r.x + r.w, r.y + H * f); ctx.stroke(); }
    const wx = r.x + r.w * 0.58, ww = Math.min(240, r.w * 0.42), wy = r.y + H * 0.1, wh = H * 0.7;
    ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#7a9ec0'], [0.5, '#f2b78a'], [1, '#f6d8a0']]); ctx.fillRect(wx - ww / 2, wy, ww, wh * 0.62);
    ctx.fillStyle = lg(ctx, 0, wy + wh * 0.62, 0, wy + wh, [[0, '#e8a870'], [1, '#2f6a78']]); ctx.fillRect(wx - ww / 2, wy + wh * 0.62, ww, wh * 0.38);
    ctx.fillStyle = 'rgba(255,240,190,0.9)'; ell(ctx, wx + ww * 0.1, wy + wh * 0.52, 14, 14); ctx.fill();
    ctx.fillStyle = '#1c1a18'; ctx.beginPath(); ctx.moveTo(wx - ww * 0.3, wy + wh * 0.68); ctx.quadraticCurveTo(wx - ww * 0.15, wy + wh * 0.78, wx + ww * 0.05, wy + wh * 0.68); ctx.lineTo(wx - ww * 0.28, wy + wh * 0.66); ctx.fill(); ctx.fillRect(wx - ww * 0.1, wy + wh * 0.4, 1.8, wh * 0.27); ctx.beginPath(); ctx.moveTo(wx - ww * 0.1, wy + wh * 0.4); ctx.lineTo(wx + ww * 0.08, wy + wh * 0.62); ctx.lineTo(wx - ww * 0.1, wy + wh * 0.62); ctx.fill();
    ctx.fillStyle = '#3a2410'; ctx.fillRect(wx - ww / 2 - 6, wy - 6, ww + 12, 6); ctx.fillRect(wx - ww / 2 - 6, wy + wh, ww + 12, 7); ctx.fillRect(wx - ww / 2 - 6, wy, 6, wh); ctx.fillRect(wx + ww / 2, wy, 6, wh);
    const hx = r.x + r.w * 0.14; for (let k = 0; k < 6; k++) { ctx.strokeStyle = ['#6a8a4a', '#8aa860', '#b8c888', '#d8d0a0', '#7a9a58', '#a8b878'][k]; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(hx + k * 7, r.y + H * 0.12); ctx.lineTo(hx + k * 7 + (k % 2 ? 3 : -2), r.y + H * 0.85); ctx.stroke(); } // reeds hung up to dry
  },
};
const floors = {
  mtoxide(ctx, r, c) { // polished red oxide with a rice-paste border of petals
    ctx.fillStyle = lg(ctx, r.x, r.y, r.x + r.w, r.y + r.h, [[0, 'rgba(255,200,170,0.16)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.2)']]); ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = 'rgba(255,248,235,0.5)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    const by = r.y + r.h * 0.97, step = 34;
    for (let x = r.x + 12; x < r.x + r.w - 12; x += step) { for (let q = -1; q <= 1; q++) { ctx.beginPath(); ctx.moveTo(x, by); ctx.quadraticCurveTo(x + q * 13, by - 14, x + q * 7, by - 22); ctx.quadraticCurveTo(x + q * 2, by - 12, x, by); ctx.stroke(); } ctx.beginPath(); ctx.arc(x + step / 2, by - 3, 2, 0, TAU); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(r.x + 8, by + 4); ctx.lineTo(r.x + r.w - 8, by + 4); ctx.stroke();
    const sx = r.x + r.w * 0.5, sy = r.y + r.h * 0.34; ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(sx - r.w * 0.35, sy, r.w * 0.7, r.h * 0.18);
  },
  mtslats(ctx, r, c) { // split bamboo floor: lit slats over a dark gap through which the yard light comes
    ctx.fillStyle = '#1a0f06'; ctx.fillRect(r.x, r.y, r.w, r.h);
    const w = 19, gap = 3;
    for (let x = r.x; x < r.x + r.w; x += w + gap) { const k = hash(x | 0, 4); ctx.fillStyle = lg(ctx, x, 0, x + w, 0, [[0, tint(c, 0.15 + k * 0.1)], [0.5, tint(c, 0.02 + k * 0.08)], [1, tint(c, -0.28)]]); ctx.fillRect(x, r.y, w, r.h); ctx.fillStyle = 'rgba(255,220,140,0.3)'; ctx.fillRect(x + w, r.y, gap, r.h); }
    ctx.strokeStyle = 'rgba(40,20,0,0.3)'; ctx.lineWidth = 3; for (let y = r.y + r.h * 0.3; y < r.y + r.h; y += r.h * 0.34) { ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke(); }
  },
  mtgranite(ctx, r, c) { // granite slabs with a kolam in white rice flour
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2; const sl = 150;
    for (let x = r.x; x < r.x + r.w; x += sl) { ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); ctx.stroke(); } for (let y = r.y; y < r.y + r.h; y += sl * 0.8) { ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke(); }
    speck(ctx, r.x, r.y, r.w, r.h, 520, '#ffffff', 0.12, 83, 2); speck(ctx, r.x, r.y, r.w, r.h, 360, '#000000', 0.18, 87, 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.8;
    for (const kx of [0.1, 0.9]) { const cx = r.x + r.w * kx, cy = r.y + r.h * 0.9, d = 14; for (let i = -2; i <= 2; i++) for (let j = -2 + Math.abs(i); j <= 2 - Math.abs(i); j++) { ctx.beginPath(); ctx.arc(cx + i * d, cy + j * d, 1.9, 0, TAU); ctx.fill(); }
      ctx.beginPath(); for (let a = 0; a < 4; a++) { const ang = a * Math.PI / 2; ctx.moveTo(cx + Math.cos(ang) * d * 2.6, cy + Math.sin(ang) * d * 2.6); ctx.quadraticCurveTo(cx + Math.cos(ang + 0.8) * d * 1.2, cy + Math.sin(ang + 0.8) * d * 1.2, cx + Math.cos(ang + Math.PI / 2) * d * 2.6, cy + Math.sin(ang + Math.PI / 2) * d * 2.6); } ctx.stroke(); }
  },
  mtdeck(ctx, r, c) { // dark teak deck, wet in places, palm leaf scraps
    const pl = 38; ctx.lineWidth = 3; for (let y = r.y + pl; y < r.y + r.h; y += pl) { ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke(); ctx.strokeStyle = 'rgba(255,200,130,0.08)'; ctx.beginPath(); ctx.moveTo(r.x, y + 2); ctx.lineTo(r.x + r.w, y + 2); ctx.stroke(); }
    ctx.lineWidth = 1; for (let k = 0; k < 50; k++) { const y = r.y + hash(k, 3) * r.h, x = r.x + hash(k, 4) * r.w; ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40 + hash(k, 5) * 60, y + 1); ctx.stroke(); }
    ctx.fillStyle = 'rgba(120,180,200,0.1)'; for (let k = 0; k < 4; k++) { ell(ctx, r.x + r.w * (0.15 + 0.23 * k), r.y + r.h * (0.5 + 0.4 * hash(k, 9)), 50, 14); ctx.fill(); }
    ctx.fillStyle = lg(ctx, r.x, 0, r.x + r.w, 0, [[0, 'rgba(255,170,90,0.14)'], [0.5, 'rgba(255,170,90,0)'], [1, 'rgba(255,170,90,0.08)']]); ctx.fillRect(r.x, r.y, r.w, r.h);
  },
  mtswept(ctx, r, c) { // packed earth swept in arcs with a broom, dry leaves
    speck(ctx, r.x, r.y, r.w, r.h, 260, '#3a2410', 0.16, 91, 3); speck(ctx, r.x, r.y, r.w, r.h, 120, '#f0d8a8', 0.14, 95, 2);
    ctx.strokeStyle = 'rgba(70,45,20,0.2)'; ctx.lineWidth = 2; for (let k = 0; k < 34; k++) { const cx = r.x + r.w * hash(k, 21), cy = r.y + r.h * hash(k, 22), rr = 60 + hash(k, 23) * 90; ctx.beginPath(); ctx.arc(cx, cy, rr, 0.2 + hash(k, 24) * 3, 0.9 + hash(k, 24) * 3); ctx.stroke(); }
    ctx.fillStyle = 'rgba(150,100,40,0.5)'; for (let k = 0; k < 9; k++) { ctx.save(); ctx.translate(r.x + r.w * hash(k, 31), r.y + r.h * (0.3 + hash(k, 32) * 0.7)); ctx.rotate(hash(k, 33) * TAU); ell(ctx, 0, 0, 9, 3.4); ctx.fill(); ctx.restore(); }
  },
  mtbrick(ctx, r, c) { // old red brick laid in herringbone, moss in the joints, dappled light
    const bw = 40, bh = 16; ctx.lineWidth = 2;
    for (let y = r.y; y < r.y + r.h; y += bh * 2) for (let x = r.x; x < r.x + r.w; x += bw) { const k = hash(x | 0, y | 0, 5); ctx.fillStyle = `rgba(${Math.round(60 + k * 60)},${Math.round(20 + k * 20)},10,0.14)`; ctx.fillRect(x, y, bw, bh * 2); ctx.strokeStyle = 'rgba(30,18,10,0.5)'; ctx.strokeRect(x + 0.5, y + 0.5, bw, bh); ctx.strokeRect(x + 0.5 + bw / 2, y + 0.5 + bh, bw, bh); }
    speck(ctx, r.x, r.y, r.w, r.h, 140, '#4a6a2a', 0.2, 99, 3);
    ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = '#0a1a08'; for (let k = 0; k < 26; k++) { ctx.save(); ctx.translate(r.x + r.w * hash(k, 41), r.y + r.h * hash(k, 42)); ctx.rotate(hash(k, 43) * TAU); ell(ctx, 0, 0, 18, 7); ctx.fill(); ctx.restore(); } ctx.restore();
  },
  mtsand(ctx, r, c) { // swept coral sand with shells and the print of a broom
    speck(ctx, r.x, r.y, r.w, r.h, 420, '#ffffff', 0.26, 101, 2); speck(ctx, r.x, r.y, r.w, r.h, 220, '#6a5230', 0.2, 105, 2);
    ctx.strokeStyle = 'rgba(120,96,60,0.28)'; ctx.lineWidth = 1.5; for (let y = r.y + 40; y < r.y + r.h; y += 14) { ctx.beginPath(); ctx.moveTo(r.x, y); for (let x = 0; x <= r.w; x += 20) ctx.lineTo(r.x + x, y + Math.sin(x * 0.03 + y * 0.1) * 2.5); ctx.stroke(); }
    for (let k = 0; k < 7; k++) { const x = r.x + r.w * hash(k, 51), y = r.y + r.h * (0.3 + hash(k, 52) * 0.7); ctx.fillStyle = 'rgba(250,240,225,0.8)'; ctx.beginPath(); ctx.arc(x, y, 6, Math.PI, 0); ctx.fill(); ctx.strokeStyle = 'rgba(120,90,60,0.6)'; ctx.lineWidth = 1; for (let q = -2; q <= 2; q++) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + q * 2.4, y - 5.5); ctx.stroke(); } }
  },
};

registerProp('cane', (ctx, s, o = {}) => { // a bundle of split cane or palm strips, bound in the middle
  const c = o.c ?? '#e2c88e'; cast(ctx, 2, s * 0.14, s * 0.4, s * 0.08);
  for (let k = 0; k < 7; k++) { const y = (k - 3) * s * 0.055; ctx.fillStyle = lg(ctx, 0, y - s * 0.03, 0, y + s * 0.03, [[0, tint(c, 0.25)], [1, tint(c, -0.28)]]); ctx.beginPath(); ctx.moveTo(-s * 0.42, y + (k % 2) * 3); ctx.quadraticCurveTo(0, y + (k % 3 - 1) * 3, s * 0.42, y - (k % 2) * 2); ctx.lineTo(s * 0.42, y + s * 0.045); ctx.quadraticCurveTo(0, y + s * 0.045 + (k % 3 - 1) * 3, -s * 0.42, y + s * 0.045 + (k % 2) * 3); ctx.fill(); }
  ctx.fillStyle = '#7a3a22'; rrect(ctx, -s * 0.04, -s * 0.22, s * 0.08, s * 0.44, 2); ctx.fill();
});

const T = (c, h, w) => ({ caption: c, hint: h, ...(w ?? {}) });
const scenes = {
  'mt-verandah': { wall: 'mtveranda', wallC: '#b98a4e', wallK: 0.8, floor: 'mtoxide', floorC: '#8a3a26', light: 'window', litter: [{ k: 'grass', c: '#e6d4a0' }], dock: ['cane:#ecd9a2', 'awl', 'bowl', 'cane:#d9b878'], dockKind: 'ledge', frame: 'tile', wood: '#7a3a1e', words: T('Plait this cool mat', 'Lay each cane strip to match the lit row', { win: 'A mat cool to lie on' }), pitch: 1.0 },
  'mt-stilt': { wall: 'mtstilt', wallC: '#b89a58', wallK: 0.8, floor: 'mtslats', floorC: '#c9a05c', light: 'window', litter: [{ k: 'scraps', c: '#e0508a' }, { k: 'scraps', c: '#2fa45a' }], dock: ['cane:#d93a7a', 'cane:#2fa45a', 'scissors', 'cane:#e0b030'], dockKind: 'tray', frame: 'rail', wood: '#9a6a2e', words: T('Weave this banig', 'Over and under with dyed palm strips', { win: 'A banig for the family' }), pitch: 1.25 },
  'mt-hills': { wall: 'mthills', wallC: '#c9c8b0', wallK: 0.85, floor: 'mtoxide', floorC: '#6a3a28', light: 'window', litter: [{ k: 'thread', c: '#e8e0cc' }], dock: ['hank:#a8301f', 'strip:#d6c48a', 'scissors', 'hank:#1c1c1c'], dockKind: 'ledge', frame: 'card', wood: '#6a4426', words: T('Weave this mat', 'Pack each weft row against the last', { win: 'A mat of the hills' }), pitch: 0.85 },
  'mt-kolam': { wall: 'mtriver', wallC: '#ecdcbc', wallK: 0.85, floor: 'mtgranite', floorC: '#6a6a66', light: 'window', litter: [{ k: 'grass', c: '#cfe0a0' }], dock: ['cane:#e8e4c0', 'knife', 'cane:#f2efdc', 'bowl'], dockKind: 'cloth', frame: 'cloth', wood: '#6a3a1a', words: T('Weave this fine mat', 'Korai grass, finer than silk: row by row', { win: 'A mat fine as silk' }), pitch: 1.5 },
  'mt-backwater': { wall: 'mtbackwaterwall', wallC: '#d0a070', wallK: 0.9, floor: 'mtdeck', floorC: '#4a2e1a', light: 'lamp', litter: [{ k: 'grass', c: '#b8c878' }], dock: ['cane:#d4dc9e', 'knife', 'bowl', 'cane:#b0bc6a'], dockKind: 'tray', frame: 'niche', wood: '#5a3a1e', words: T('Plait this screw pine mat', 'Leaf strip over leaf strip, by the water', { win: 'A mat of the backwaters' }), pitch: 1.1 },
  'mt-punjab': { wall: 'mthaveli', wallC: '#c8a572', wallK: 0.85, floor: 'mtswept', floorC: '#a8825a', light: 'window', litter: [{ k: 'thread', c: '#c8a860' }], dock: ['hank:#c8a860', 'awl', 'hank:#8a6a3a', 'scissors'], dockKind: 'ledge', frame: 'peg', wood: '#7a5230', words: T('Weave this floor mat', 'Jute strip on strip, stripe by stripe', { win: 'A sturdy floor mat' }), pitch: 0.75 },
  'mt-courtyard': { wall: 'mtneem', wallC: '#a8583a', wallK: 0.85, floor: 'mtbrick', floorC: '#8a4a30', light: 'window', litter: [{ k: 'thread', c: '#c8b488' }], dock: ['hank:#d6c088', 'awl', 'hank:#a83a2a', 'scissors'], dockKind: 'ledge', frame: 'plinth', wood: '#6a3e1e', words: T('Weave this rope bed', 'Draw the rope over and under, drawing it tight', { win: 'A bed to rest on' }), pitch: 0.9 },
  'mt-lagoon': { wall: 'mtlagoonwall', wallC: '#a8863e', wallK: 0.9, floor: 'mtsand', floorC: '#d8c8a0', light: 'window', litter: [{ k: 'grass', c: '#9bb06a' }], dock: ['cane:#9bb06a', 'knife', 'bowl', 'cane:#cfc58a'], dockKind: 'cloth', frame: 'rail', wood: '#6a4a24', words: T('Weave this reed mat', 'Reed over and under, as the lagoon weavers do', { win: 'A reed mat of the shore' }), pitch: 1.2 },
};
registerSceneSet({
  scenes: Object.fromEntries(Object.entries(scenes).map(([id, s]) => [id, { ...s, hang: [] }])),
  walls, floorKinds: { mtoxide: 'felt', mtslats: 'wood', mtgranite: 'slate', mtdeck: 'wood', mtswept: 'felt', mtbrick: 'slate', mtsand: 'felt' }, floorEx: floors,
  soundMat: { 'mt-verandah': 'cane', 'mt-stilt': 'palm', 'mt-hills': 'bamboo', 'mt-kolam': 'silk', 'mt-backwater': 'reed', 'mt-punjab': 'jute', 'mt-courtyard': 'cord', 'mt-lagoon': 'willow' },
});
void mix;

// shape-craft 1.21.0: six jewellers' workshops for the `paint` figure tables of jewel.js (wire filigree and enamel). Each has its own wall, floor, light and shelf.
// Pure canvas 2D, deterministic.
import { registerSceneSet } from './registry.js';
import { hash } from './geom.js';
import { tint, rgba, rrect } from './fx.js';
import { lg, rg, ell, cast, TAU } from './props.js';

const walls = {
  tarakasi(ctx, s, r, H, t) { // Odisha: an ochre plaster wall, a lattice window, a shelf of brass pots and silver trays, a hanging oil lamp
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.1)], [1, tint(s.wallC, -0.3)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let k = 0; k < 24; k++) { ctx.fillStyle = `rgba(60,30,10,${0.04 + 0.05 * hash(k, 3)})`; ell(ctx, r.x + r.w * hash(k, 1), r.y + H * hash(k, 2), 14 + 24 * hash(k, 4), 5 + 8 * hash(k, 5)); ctx.fill(); }
    const wx = r.x + r.w * 0.04, ww = Math.min(r.w * 0.2, H * 0.7), wy = r.y + H * 0.14, wh = H * 0.5; ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#fbe9b8'], [1, '#e6c880']]); ctx.fillRect(wx, wy, ww, wh); ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 3; for (let k = 0; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(wx + (ww * k) / 4, wy); ctx.lineTo(wx + (ww * k) / 4 + (wh * 0.25) * ((k % 2) ? 1 : -1), wy + wh); ctx.stroke(); } ctx.lineWidth = 5; ctx.strokeRect(wx, wy, ww, wh);
    const sy = r.y + H * 0.8, sx0 = r.x + r.w * 0.32, sx1 = r.x + r.w * 0.98; ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 8, [[0, '#c89a60'], [1, '#4a2c14']]); ctx.fillRect(sx0, sy, sx1 - sx0, 8);
    const n = Math.max(3, Math.min(7, Math.round((sx1 - sx0) / 44)));
    for (let k = 0; k < n; k++) { const x = sx0 + ((sx1 - sx0) * (k + 0.5)) / n, h2 = H * (0.14 + 0.07 * hash(k, 6)); cast(ctx, x + 2, sy, h2 * 0.5, 2, 0.35); ctx.fillStyle = lg(ctx, x - h2 * 0.5, 0, x + h2 * 0.5, 0, [[0, '#7a5214'], [0.35, '#f0d070'], [1, '#6a4410']]); ctx.beginPath(); ctx.moveTo(x - h2 * 0.28, sy); ctx.quadraticCurveTo(x - h2 * 0.62, sy - h2 * 0.5, x - h2 * 0.2, sy - h2 * 0.9); ctx.lineTo(x + h2 * 0.2, sy - h2 * 0.9); ctx.quadraticCurveTo(x + h2 * 0.62, sy - h2 * 0.5, x + h2 * 0.28, sy); ctx.closePath(); ctx.fill(); }
    const lx = r.x + r.w * 0.28, ly = r.y + H * 0.4; ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(lx, r.y); ctx.lineTo(lx, ly - 12); ctx.stroke(); ctx.fillStyle = rg(ctx, lx, ly, 1, 36, [[0, 'rgba(255,220,130,0.6)'], [1, 'rgba(255,160,60,0)']]); ell(ctx, lx, ly, 36, 36); ctx.fill(); ctx.fillStyle = '#e8c050'; ctx.beginPath(); ctx.arc(lx, ly, 8, 0, TAU); ctx.fill();
  },
  chengduwall(ctx, s, r, H, t) { // Chengdu: deep teal panels, a carved lattice screen, a shelf of silver pieces
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.1)], [1, tint(s.wallC, -0.3)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let x = r.x; x < r.x + r.w; x += 46) { ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + H); ctx.stroke(); }
    const wx = r.x + r.w * 0.5, ww = r.w * 0.46, wy = r.y + H * 0.1, wh = H * 0.55; ctx.fillStyle = 'rgba(255,240,200,0.12)'; ctx.fillRect(wx, wy, ww, wh); ctx.strokeStyle = '#d8a040'; ctx.lineWidth = 2.5; const m = 8; for (let a = 0; a < m; a++) for (let b = 0; b < 5; b++) { const x = wx + (ww * (a + 0.5)) / m, y = wy + (wh * (b + 0.5)) / 5; ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x, y - 9); ctx.lineTo(x + 9, y); ctx.lineTo(x, y + 9); ctx.closePath(); ctx.stroke(); }
    ctx.lineWidth = 5; ctx.strokeStyle = '#5a2a14'; ctx.strokeRect(wx, wy, ww, wh);
    const sy = r.y + H * 0.82, sx0 = r.x + r.w * 0.04, sx1 = r.x + r.w * 0.46; ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 8, [[0, '#9a5a30'], [1, '#3a1a0a']]); ctx.fillRect(sx0, sy, sx1 - sx0, 8);
    const n = Math.max(2, Math.min(5, Math.round((sx1 - sx0) / 50)));
    for (let k = 0; k < n; k++) { const x = sx0 + ((sx1 - sx0) * (k + 0.5)) / n, h2 = H * 0.16; cast(ctx, x + 2, sy, h2 * 0.6, 2, 0.35); ctx.fillStyle = rg(ctx, x - h2 * 0.1, sy - h2 * 0.6, 1, h2, [[0, '#f4f7fa'], [1, '#7a8692']]); ctx.beginPath(); ctx.moveTo(x, sy - h2 * 0.55); ctx.quadraticCurveTo(x - h2 * 0.9, sy - h2 * 1.3, x - h2 * 0.7, sy - h2 * 0.2); ctx.lineTo(x, sy - h2 * 0.5); ctx.quadraticCurveTo(x + h2 * 0.9, sy - h2 * 1.3, x + h2 * 0.7, sy - h2 * 0.2); ctx.closePath(); ctx.fill(); }
  },
  kruja(ctx, s, r, H, t) { // Albania: whitewashed stone, timber shutters, a copper pan and a woven rug on the wall
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.06)], [1, tint(s.wallC, -0.2)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let y = r.y, j = 0; y < r.y + H; y += 22, j++) for (let x = r.x + (j % 2 ? 24 : 0); x < r.x + r.w; x += 48) { ctx.strokeStyle = 'rgba(70,60,50,0.22)'; ctx.lineWidth = 1.4; rrect(ctx, x, y, 46, 20, 4); ctx.stroke(); }
    const wx = r.x + r.w * 0.52, ww = r.w * 0.2, wy = r.y + H * 0.1, wh = H * 0.55; ctx.fillStyle = '#26323a'; ctx.fillRect(wx, wy, ww * 2.1, wh); for (let q = 0; q < 2; q++) { const x = wx + q * ww * 1.05; ctx.fillStyle = lg(ctx, x, 0, x + ww, 0, [[0, '#6a4020'], [1, '#4a2a12']]); ctx.fillRect(x, wy, ww, wh); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.4; for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x + (ww * k) / 5, wy); ctx.lineTo(x + (ww * k) / 5, wy + wh); ctx.stroke(); } }
    const rx = r.x + r.w * 0.05, rw = r.w * 0.3, ry = r.y + H * 0.12, rh = H * 0.5; ctx.fillStyle = '#7a1c1c'; ctx.fillRect(rx, ry, rw, rh); ctx.fillStyle = '#16100e'; for (let k = 0; k < 6; k++) { const yy = ry + (rh * (k + 0.5)) / 6; ctx.beginPath(); ctx.moveTo(rx, yy); ctx.lineTo(rx + rw * 0.5, yy - 8); ctx.lineTo(rx + rw, yy); ctx.lineTo(rx + rw * 0.5, yy + 8); ctx.closePath(); ctx.fill(); } ctx.strokeStyle = '#e8c860'; ctx.lineWidth = 3; ctx.strokeRect(rx, ry, rw, rh);
    const px = r.x + r.w * 0.86, py = r.y + H * 0.78; cast(ctx, px + 3, py + H * 0.14, H * 0.16, 3, 0.35); ctx.fillStyle = rg(ctx, px - 6, py - 6, 2, H * 0.22, [[0, '#f0a070'], [1, '#6a2e14']]); ell(ctx, px, py, H * 0.16, H * 0.16); ctx.fill(); ctx.strokeStyle = '#3a1a0a'; ctx.lineWidth = 3; ctx.stroke();
  },
  jaipur(ctx, s, r, H, t) { // Rajasthan: rose sandstone, a cusped arch niche, a glowing kiln, little pots of enamel powder
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.1)], [1, tint(s.wallC, -0.28)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let k = 0; k < 30; k++) { ctx.fillStyle = `rgba(90,40,30,${0.04 + 0.05 * hash(k, 3)})`; ctx.fillRect(r.x + r.w * hash(k, 1), r.y + H * hash(k, 2), 18 + 30 * hash(k, 4), 2); }
    const ax = r.x + r.w * 0.04, aw = Math.min(r.w * 0.3, H * 0.8), ay = r.y + H * 0.12, ah = H * 0.62; ctx.fillStyle = '#240c06'; ctx.beginPath(); ctx.moveTo(ax, ay + ah); ctx.lineTo(ax, ay + ah * 0.35); for (let q = 0; q <= 6; q++) { const f = q / 6, x = ax + aw * f, y = ay + ah * 0.12 * (1 - Math.sin(f * Math.PI)) + (q % 2 ? 6 : 0); ctx.lineTo(x, y + ah * 0.18 * (1 - Math.sin(f * Math.PI))); } ctx.lineTo(ax + aw, ay + ah * 0.35); ctx.lineTo(ax + aw, ay + ah); ctx.closePath(); ctx.fill();
    ctx.fillStyle = rg(ctx, ax + aw / 2, ay + ah * 0.78, 2, aw * 0.62, [[0, 'rgba(255,200,90,0.95)'], [0.5, 'rgba(240,100,30,0.55)'], [1, 'rgba(160,30,10,0)']]); ctx.fillRect(ax, ay, aw, ah); ctx.strokeStyle = '#e8c25a'; ctx.lineWidth = 3; ctx.strokeRect(ax, ay, aw, ah);
    const sy = r.y + H * 0.82, sx0 = r.x + r.w * 0.4, sx1 = r.x + r.w * 0.98; ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 8, [[0, '#d09a60'], [1, '#4a2410']]); ctx.fillRect(sx0, sy, sx1 - sx0, 8);
    const cols = ['#b3182c', '#13805a', '#1a3f9a', '#f2eee2', '#e8b030'], n = Math.max(3, Math.min(6, Math.round((sx1 - sx0) / 42)));
    for (let k = 0; k < n; k++) { const x = sx0 + ((sx1 - sx0) * (k + 0.5)) / n, h2 = H * 0.11; cast(ctx, x + 2, sy, h2 * 0.5, 2, 0.35); ctx.fillStyle = lg(ctx, x - h2 * 0.4, 0, x + h2 * 0.4, 0, [[0, '#d8d0c0'], [0.4, '#fff'], [1, '#9a9080']]); rrect(ctx, x - h2 * 0.42, sy - h2 * 0.8, h2 * 0.84, h2 * 0.8, 4); ctx.fill(); ctx.fillStyle = cols[k % 5]; ell(ctx, x, sy - h2 * 0.8, h2 * 0.36, h2 * 0.13); ctx.fill(); }
  },
  isfahan(ctx, s, r, H, t) { // Iran: turquoise tilework with white arabesques, a pointed arch window, a shelf of enamelled vases
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.08)], [1, tint(s.wallC, -0.3)]]); ctx.fillRect(r.x, r.y, r.w, H);
    const ts = 34; for (let y = r.y; y < r.y + H; y += ts) for (let x = r.x; x < r.x + r.w; x += ts) { ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, ts - 1, ts - 1); ctx.strokeStyle = 'rgba(240,248,255,0.5)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x + ts / 2, y + ts / 2, ts * 0.28, 0, TAU); ctx.moveTo(x + ts * 0.5, y + ts * 0.1); ctx.lineTo(x + ts * 0.5, y + ts * 0.9); ctx.moveTo(x + ts * 0.1, y + ts * 0.5); ctx.lineTo(x + ts * 0.9, y + ts * 0.5); ctx.stroke(); }
    const wx = r.x + r.w * 0.04, ww = Math.min(r.w * 0.26, H * 0.6), wy = r.y + H * 0.1, wh = H * 0.62; ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#f6e8c0'], [1, '#e8c070']]); ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + wh * 0.4); ctx.quadraticCurveTo(wx, wy, wx + ww / 2, wy - 6); ctx.quadraticCurveTo(wx + ww, wy, wx + ww, wy + wh * 0.4); ctx.lineTo(wx + ww, wy + wh); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#143a8a'; ctx.lineWidth = 5; ctx.stroke();
    const sy = r.y + H * 0.84, sx0 = r.x + r.w * 0.38, sx1 = r.x + r.w * 0.98; ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 8, [[0, '#e8d4a0'], [1, '#5a4020']]); ctx.fillRect(sx0, sy, sx1 - sx0, 8);
    const n = Math.max(3, Math.min(6, Math.round((sx1 - sx0) / 44)));
    for (let k = 0; k < n; k++) { const x = sx0 + ((sx1 - sx0) * (k + 0.5)) / n, h2 = H * (0.17 + 0.05 * hash(k, 6)); cast(ctx, x + 2, sy, h2 * 0.4, 2, 0.35); ctx.fillStyle = lg(ctx, x - h2 * 0.3, 0, x + h2 * 0.3, 0, [[0, '#cfc6ae'], [0.4, '#fbf6e6'], [1, '#a89e86']]); ctx.beginPath(); ctx.moveTo(x - h2 * 0.1, sy - h2); ctx.lineTo(x - h2 * 0.1, sy - h2 * 0.72); ctx.quadraticCurveTo(x - h2 * 0.44, sy - h2 * 0.4, x - h2 * 0.2, sy); ctx.lineTo(x + h2 * 0.2, sy); ctx.quadraticCurveTo(x + h2 * 0.44, sy - h2 * 0.4, x + h2 * 0.1, sy - h2 * 0.72); ctx.lineTo(x + h2 * 0.1, sy - h2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#1a3f9a'; ctx.fillRect(x - h2 * 0.3, sy - h2 * 0.5, h2 * 0.6, h2 * 0.08); ctx.fillStyle = '#1aa0b0'; ell(ctx, x, sy - h2 * 0.28, h2 * 0.1, h2 * 0.1); ctx.fill(); }
  },
  kabylie(ctx, s, r, H, t) { // Kabylia: whitewashed wall, an upright loom with a striped blanket, silver brooches hung on a nail board
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.05)], [1, tint(s.wallC, -0.2)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let k = 0; k < 20; k++) { ctx.fillStyle = `rgba(110,90,60,${0.03 + 0.04 * hash(k, 3)})`; ell(ctx, r.x + r.w * hash(k, 1), r.y + H * hash(k, 2), 16 + 28 * hash(k, 4), 5 + 9 * hash(k, 5)); ctx.fill(); }
    const lx = r.x + r.w * 0.04, lw2 = Math.min(r.w * 0.34, H * 0.9), ly = r.y + H * 0.06, lh = H * 0.84; ctx.fillStyle = '#5a3a1e'; ctx.fillRect(lx - 6, ly - 6, 8, lh + 12); ctx.fillRect(lx + lw2 - 2, ly - 6, 8, lh + 12); ctx.fillRect(lx - 6, ly - 6, lw2 + 12, 8);
    const stripes = ['#b3232a', '#f0e6c8', '#16100e', '#e8b030', '#b3232a', '#16100e', '#f0e6c8']; for (let k = 0; k < 14; k++) { ctx.fillStyle = stripes[k % stripes.length]; ctx.fillRect(lx + 2, ly + 2 + k * (lh * 0.7) / 14, lw2 - 4, (lh * 0.7) / 14 + 1); } ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; for (let k = 0; k < 10; k++) { ctx.beginPath(); ctx.moveTo(lx + 4 + (k * (lw2 - 8)) / 9, ly); ctx.lineTo(lx + 4 + (k * (lw2 - 8)) / 9, ly + lh); ctx.stroke(); }
    const bx = r.x + r.w * 0.56, bw = r.w * 0.4, by = r.y + H * 0.14, bh = H * 0.5; ctx.fillStyle = lg(ctx, 0, by, 0, by + bh, [[0, '#5a3a1e'], [1, '#3a2410']]); ctx.fillRect(bx, by, bw, bh); for (let k = 0; k < 6; k++) { const x = bx + (bw * (k % 3 + 0.5)) / 3, y = by + bh * (k < 3 ? 0.32 : 0.74), rr = Math.min(bw / 7, bh / 6); ctx.fillStyle = rg(ctx, x - rr * 0.3, y - rr * 0.3, 1, rr * 1.2, [[0, '#f6f8fa'], [1, '#7a8692']]); ell(ctx, x, y, rr, rr); ctx.fill(); ctx.fillStyle = ['#1d8a4c', '#e8c02a', '#1c4fa0'][k % 3]; ell(ctx, x, y, rr * 0.5, rr * 0.5); ctx.fill(); }
  },
};

const T = (c, h) => ({ caption: c, hint: h });
const scenes = {
  tarakasi: { wall: 'tarakasi', wallC: '#b0803c', floor: 'planks', floorC: '#6a4a2a', light: 'lamp', litter: [{ k: 'wire', c: '#d8dee6' }], dock: ['pliers', 'gauge', 'coil:#d8dee6'], dockKind: 'tray', frame: 'tile', words: T('Twist this medallion', 'Keep the wire moving; one pull for every curl'), pitch: 1.5, wave: 'sine' },
  chengdu: { wall: 'chengduwall', wallC: '#1c5a5a', floor: 'planks', floorC: '#4a2a1a', light: 'lamp', litter: [{ k: 'wire', c: '#d8dee6' }], dock: ['pliers', 'gauge', 'coil:#d8dee6'], dockKind: 'tray', frame: 'plinth', words: T('Shape this butterfly', 'Body first, then each wing; the other side follows'), pitch: 1.7, wave: 'sine' },
  kruja: { wall: 'kruja', wallC: '#e6dccb', floor: 'planks', floorC: '#7a5a3a', light: 'window', litter: [{ k: 'wire', c: '#f2d27a' }], dock: ['pliers', 'gauge', 'coil:#f2d27a'], dockKind: 'ledge', frame: 'rail', words: T('Twist this rosette', 'Rim first, then the petals inside petals'), pitch: 1.3, wave: 'triangle' },
  meenakari: { wall: 'jaipur', wallC: '#c0705a', floor: 'planks', floorC: '#6a3a24', light: 'lamp', litter: [{ k: 'splash', c: '#b3182c' }], dock: ['brush:#13805a', 'gauge', 'spirit'], dockKind: 'tray', frame: 'case', words: T('Enamel this pendant', 'Gold walls first, then the glass colours'), pitch: 1.4, wave: 'sine' },
  minakari: { wall: 'isfahan', wallC: '#1c8ea0', floor: 'tile', floorC: '#7a5a3a', light: 'window', litter: [{ k: 'splash', c: '#1a3f9a' }], dock: ['brush:#1a3f9a', 'gauge', 'bowl'], dockKind: 'ledge', frame: 'niche', words: T('Enamel this vase', 'Gold lines first, then turquoise, cobalt and ruby'), pitch: 1.2, wave: 'triangle' },
  kabyle: { wall: 'kabylie', wallC: '#efe6d2', floor: 'planks', floorC: '#8a6a44', light: 'window', litter: [{ k: 'wire', c: '#eef2f6' }], dock: ['brush:#1d8a4c', 'gauge', 'bowl'], dockKind: 'ledge', frame: 'rail', words: T('Enamel this brooch', 'Silver walls first, then green and yellow cells in turn'), pitch: 1.35, wave: 'triangle' },
};
registerSceneSet({
  scenes: Object.fromEntries(Object.entries(scenes).map(([id, s]) => [id, { ...s, hang: [] }])),
  rules: [['tarakasi', /tarakasi|cuttack filigree/i], ['chengdu', /chengdu/i], ['kruja', /albanian filigree|prizren/i], ['meenakari', /meenakari/i], ['minakari', /minakari/i], ['kabyle', /kabyle/i]],
  walls, floorKinds: {}, floorEx: {}, litter: {}, frames: {},
  soundMat: Object.fromEntries(Object.keys(scenes).map((id) => [id, 'clay'])),
});

// ---- 1.23.0: beadwork workshop (the Maasai collar): dusk on the grassland, an acacia, a hut, bowls of beads ----
walls.savanna = function (ctx, s, r, H, t) {
  ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H * 0.62, [[0, '#4a2a5a'], [0.5, '#d8643a'], [1, '#f6c070']]); ctx.fillRect(r.x, r.y, r.w, H * 0.62);
  ctx.fillStyle = rg(ctx, r.x + r.w * 0.78, r.y + H * 0.5, 2, 70, [[0, 'rgba(255,240,190,0.95)'], [1, 'rgba(255,200,120,0)']]); ell(ctx, r.x + r.w * 0.78, r.y + H * 0.5, 70, 70); ctx.fill();
  ctx.fillStyle = '#6a3a2a'; ctx.beginPath(); ctx.moveTo(r.x, r.y + H * 0.62); for (let k = 0; k <= 8; k++) ctx.lineTo(r.x + (r.w * k) / 8, r.y + H * (0.55 + 0.05 * Math.sin(k * 1.4 + 1))); ctx.lineTo(r.x + r.w, r.y + H); ctx.lineTo(r.x, r.y + H); ctx.fill();
  ctx.fillStyle = '#2a1810'; const ax = r.x + r.w * 0.16, ay = r.y + H * 0.62; ctx.fillRect(ax - 3, ay - H * 0.3, 6, H * 0.3); ctx.beginPath(); ctx.ellipse(ax, ay - H * 0.33, H * 0.3, H * 0.07, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(ax + H * 0.14, ay - H * 0.27, H * 0.2, H * 0.05, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a2010'; ctx.beginPath(); ctx.moveTo(r.x + r.w * 0.52, ay + H * 0.02); ctx.lineTo(r.x + r.w * 0.52, ay - H * 0.1); ctx.quadraticCurveTo(r.x + r.w * 0.6, ay - H * 0.26, r.x + r.w * 0.68, ay - H * 0.1); ctx.lineTo(r.x + r.w * 0.68, ay + H * 0.02); ctx.fill();
  const sy = r.y + H * 0.88, cols = ['#c4231f', '#1f4fb4', '#f6f1e6', '#f08a1e', '#1f8a46'], n = Math.max(3, Math.min(5, Math.round(r.w / 90)));
  for (let k = 0; k < n; k++) { const x = r.x + r.w * (0.35 + 0.13 * k); cast(ctx, x + 2, sy, 20, 4, 0.35); ctx.fillStyle = rg(ctx, x - 6, sy - 6, 2, 26, [[0, '#d8a060'], [1, '#5a3418']]); ctx.beginPath(); ctx.ellipse(x, sy - 2, 20, 9, 0, 0, TAU); ctx.fill(); for (let q = 0; q < 9; q++) { ctx.fillStyle = cols[k % 5]; ell(ctx, x - 12 + (q % 5) * 6, sy - 6 - Math.floor(q / 5) * 3, 3.2, 3.2); ctx.fill(); } }
};
scenes.maasai = { wall: 'savanna', wallC: '#8a4a2a', floor: 'earth', floorC: '#7a4a28', light: 'window', litter: [{ k: 'thread', c: '#ece4d2' }], dock: ['needle', 'gauge', 'bead:#c4231f'], dockKind: 'ledge', frame: 'rail', words: T('Bead this collar', 'Stitch the strands, then thread each bead with its colour'), pitch: 1.6, wave: 'triangle' };
registerSceneSet({ scenes: { maasai: { ...scenes.maasai, hang: [] } }, rules: [['maasai', /maasai|beadwork/i]], walls: { savanna: walls.savanna }, floorKinds: {}, floorEx: {}, litter: {}, frames: {}, soundMat: { maasai: 'clay' } });

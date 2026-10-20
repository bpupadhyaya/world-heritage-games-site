// shape-craft workshops for basketry (1.9.0): one per form, so no two baskets are woven in the same room.
// Walls are the band behind the bench (r.y .. r.y + H); each paints its own place: a painted clay wall, a river at dusk, a market stall,
// a rail of dyed sisal, a stone niche with a coffee pot, thatch, a bee house, a whitewashed courtyard.
import { registerSceneSet, registerProp } from './registry.js';
import { hash } from './geom.js';
import { tint, rgba, rrect } from './fx.js';
import { lg, rg, ell, cast, TAU } from './props.js';

const cols = (n, w) => Math.max(1, Math.round(w / n));
const walls = {
  bkimigongo(ctx, s, r, H) { // Rwandan clay wall with a painted band of black, white and red lozenges
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.18)], [1, tint(s.wallC, -0.08)]]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.fillStyle = 'rgba(80,40,20,0.08)'; for (let k = 0; k < 18; k++) { ctx.beginPath(); ctx.arc(r.x + r.w * hash(k, 31), r.y + H * hash(k, 32), 6 + hash(k, 33) * 12, 0, TAU); ctx.fill(); }
    const by = r.y + H * 0.44, bh = H * 0.5, n = cols(bh * 0.9, r.w), dw = r.w / n;
    ctx.fillStyle = '#2a211b'; ctx.fillRect(r.x, by, r.w, bh); ctx.fillStyle = '#f0e6d0'; ctx.fillRect(r.x, by + bh * 0.12, r.w, bh * 0.76);
    for (let k = 0; k < n; k++) { const cx = r.x + (k + 0.5) * dw, cy = by + bh * 0.5; ctx.fillStyle = '#a8472a'; ctx.beginPath(); ctx.moveTo(cx - dw * 0.5, cy); ctx.lineTo(cx, cy - bh * 0.36); ctx.lineTo(cx + dw * 0.5, cy); ctx.lineTo(cx, cy + bh * 0.36); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#2a211b'; ctx.beginPath(); ctx.moveTo(cx - dw * 0.2, cy); ctx.lineTo(cx, cy - bh * 0.14); ctx.lineTo(cx + dw * 0.2, cy); ctx.lineTo(cx, cy + bh * 0.14); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(r.x, by + bh, r.w, 3);
  },
  bkriverdusk(ctx, s, r, H, t) { // reeds against a low sun over the Okavango
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#2d3f5a'], [0.45, '#c8714a'], [0.8, '#f0b068'], [1, '#6a7a78']]); ctx.fillRect(r.x, r.y, r.w, H);
    const sx = r.x + r.w * 0.7, sy = r.y + H * 0.7; ctx.fillStyle = rg(ctx, sx, sy, 2, H * 0.9, [[0, 'rgba(255,240,190,0.95)'], [0.25, 'rgba(255,200,120,0.55)'], [1, 'rgba(255,160,80,0)']]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.fillStyle = 'rgba(30,50,60,0.55)'; ctx.fillRect(r.x, r.y + H * 0.82, r.w, H * 0.18);
    ctx.strokeStyle = 'rgba(255,225,170,0.4)'; ctx.lineWidth = 1.5; for (let k = 0; k < 6; k++) { const y = r.y + H * (0.84 + k * 0.025); ctx.beginPath(); ctx.moveTo(sx - 60 + k * 6, y); ctx.lineTo(sx + 60 - k * 6 + Math.sin(t + k) * 4, y); ctx.stroke(); }
    const n = Math.round(r.w / 9);
    for (let k = 0; k < n; k++) { const x = r.x + (r.w * (k + hash(k, 41))) / n, h0 = H * (0.45 + hash(k, 42) * 0.5), lean = (hash(k, 43) - 0.5) * 14; ctx.strokeStyle = k % 3 ? '#1d2a22' : '#33402a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, r.y + H); ctx.quadraticCurveTo(x + lean * 0.3, r.y + H - h0 * 0.6, x + lean, r.y + H - h0); ctx.stroke(); if (k % 4 === 0) { ctx.fillStyle = '#3a2a1e'; ell(ctx, x + lean, r.y + H - h0 - 3, 2.4, 7, lean * 0.02); ctx.fill(); } }
  },
  bkmarket(ctx, s, r, H) { // Bolga market stall: striped awning above a shelf of bright baskets
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.1)], [1, tint(s.wallC, -0.2)]]); ctx.fillRect(r.x, r.y, r.w, H);
    const n = cols(46, r.w), aw = r.w / n, ah = H * 0.26;
    for (let k = 0; k < n; k++) { ctx.fillStyle = k % 2 ? '#f0e4c8' : '#c0392b'; ctx.fillRect(r.x + k * aw, r.y, aw + 0.5, ah); ctx.beginPath(); ctx.arc(r.x + (k + 0.5) * aw, r.y + ah, aw / 2, 0, Math.PI); ctx.fill(); }
    const sy = r.y + H * 0.82; ctx.fillStyle = lg(ctx, 0, sy - 5, 0, sy + 6, [[0, '#caa06a'], [1, '#6a4524']]); ctx.fillRect(r.x, sy - 5, r.w, 11);
    const m = cols(52, r.w), cl = ['#c0392b', '#2e8b57', '#e0b030', '#2a2a2a', '#d9772a'];
    for (let k = 0; k < m; k++) { const x = r.x + (r.w * (k + 0.5)) / m, rr = 14 + hash(k, 44) * 8, c = cl[k % cl.length]; ctx.fillStyle = lg(ctx, x - rr, 0, x + rr, 0, [[0, tint(c, 0.2)], [1, tint(c, -0.35)]]); ctx.beginPath(); ctx.moveTo(x - rr * 0.8, sy - 5); ctx.lineTo(x - rr, sy - 5 - rr * 0.8); ctx.quadraticCurveTo(x, sy - 5 - rr * 1.15, x + rr, sy - 5 - rr * 0.8); ctx.lineTo(x + rr * 0.8, sy - 5); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke(); }
  },
  bkhanks(ctx, s, r, H) { // rail of dyed sisal hanks in a Kenyan workshop
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.08)], [1, tint(s.wallC, -0.18)]]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1; for (let x = r.x + 38; x < r.x + r.w; x += 38) { ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + H); ctx.stroke(); }
    const ry = r.y + H * 0.18; ctx.fillStyle = lg(ctx, 0, ry - 4, 0, ry + 5, [[0, '#d0a468'], [1, '#6a4524']]); ctx.fillRect(r.x, ry - 4, r.w, 9);
    const cl = ['#2c4a7a', '#b83a2e', '#e0b030', '#d6c096', '#3a7a4a', '#7a3a6a'], n = cols(40, r.w);
    for (let k = 0; k < n; k++) { const x = r.x + (r.w * (k + 0.5)) / n, c = cl[k % cl.length], L = H * (0.55 + hash(k, 45) * 0.25);
      ctx.fillStyle = tint(c, -0.1); ctx.beginPath(); ctx.moveTo(x - 8, ry + 4); ctx.lineTo(x + 8, ry + 4); ctx.lineTo(x + 11, ry + L); ctx.quadraticCurveTo(x, ry + L + 8, x - 11, ry + L); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = tint(c, 0.28); ctx.lineWidth = 1; for (let q = -3; q <= 3; q++) { ctx.beginPath(); ctx.moveTo(x + q * 2.2, ry + 6); ctx.lineTo(x + q * 3 + hash(q + 5, k) * 2, ry + L - 2); ctx.stroke(); }
      ctx.fillStyle = '#4a3220'; rrect(ctx, x - 5, ry + 2, 10, 7, 2); ctx.fill(); }
  },
  bkstonenook(ctx, s, r, H) { // Ethiopian stone wall with an arched niche, a coffee pot and cups
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.1)], [1, tint(s.wallC, -0.2)]]); ctx.fillRect(r.x, r.y, r.w, H);
    const bh = H / 4; ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 2;
    for (let row = 0; row < 4; row++) { const off = row % 2 ? 24 : 0; for (let x = r.x - off; x < r.x + r.w; x += 48) { ctx.strokeRect(x, r.y + row * bh, 48, bh); ctx.fillStyle = `rgba(255,255,255,${0.02 + hash(row, x | 0) * 0.05})`; ctx.fillRect(x + 1, r.y + row * bh + 1, 46, bh - 2); } }
    const nx = r.x + r.w * 0.3, nw = Math.min(r.w * 0.18, 96), ny = r.y + H * 0.08, nh = H * 0.86;
    ctx.beginPath(); ctx.moveTo(nx - nw / 2, ny + nh); ctx.lineTo(nx - nw / 2, ny + nw / 2); ctx.arc(nx, ny + nw / 2, nw / 2, Math.PI, 0); ctx.lineTo(nx + nw / 2, ny + nh); ctx.closePath();
    ctx.fillStyle = rg(ctx, nx, ny + nh * 0.6, 2, nh, [[0, '#6a4020'], [1, '#150e08']]); ctx.fill(); ctx.strokeStyle = 'rgba(255,220,160,0.35)'; ctx.lineWidth = 2; ctx.stroke();
    const py = ny + nh - 2; ctx.fillStyle = lg(ctx, nx - 20, py - 38, nx + 20, py, [[0, '#2a1a12'], [1, '#0c0806']]); // the jebena: round pot, long neck, spout
    ctx.beginPath(); ctx.arc(nx, py - 16, 16, 0, TAU); ctx.fill(); ctx.fillRect(nx - 4, py - 46, 8, 22); ctx.beginPath(); ctx.moveTo(nx + 4, py - 44); ctx.lineTo(nx + 17, py - 40); ctx.lineTo(nx + 4, py - 38); ctx.fill();
    ctx.fillStyle = 'rgba(255,220,160,0.4)'; ell(ctx, nx - 6, py - 20, 4, 7); ctx.fill();
    for (let k = 0; k < 3; k++) { ctx.fillStyle = '#e8dcc0'; rrect(ctx, nx + nw * 0.1 + k * 14 - 30, py - 7, 10, 7, 3); ctx.fill(); }
  },
  bkthatchwall(ctx, s, r, H) { // bundles of grass set upright and lashed in two courses
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.12)], [1, tint(s.wallC, -0.22)]]); ctx.fillRect(r.x, r.y, r.w, H);
    const n = Math.round(r.w / 7);
    for (let k = 0; k < n; k++) { const x = r.x + (r.w * k) / n; ctx.strokeStyle = tint(s.wallC, (hash(k, 46) - 0.5) * 0.4); ctx.lineWidth = 3 + hash(k, 47) * 2; ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x + (hash(k, 48) - 0.5) * 4, r.y + H); ctx.stroke(); }
    for (const f of [0.3, 0.72]) { ctx.fillStyle = lg(ctx, 0, r.y + H * f - 4, 0, r.y + H * f + 4, [[0, '#7a5a30'], [1, '#3a2814']]); ctx.fillRect(r.x, r.y + H * f - 4, r.w, 8); ctx.strokeStyle = 'rgba(255,230,170,0.25)'; ctx.lineWidth = 1; for (let x = r.x + 6; x < r.x + r.w; x += 14) { ctx.beginPath(); ctx.moveTo(x, r.y + H * f - 4); ctx.lineTo(x + 5, r.y + H * f + 4); ctx.stroke(); } }
  },
  bkbeehouse(ctx, s, r, H) { // weathered boards of an apiary, small flight slots, a bunch of herbs
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.1)], [1, tint(s.wallC, -0.22)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let x = r.x + 30; x < r.x + r.w; x += 30) { ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + H); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(x + 2, r.y); ctx.lineTo(x + 2, r.y + H); ctx.stroke(); }
    const n = Math.max(2, Math.round(r.w / 170));
    for (let k = 0; k < n; k++) { const x = r.x + (r.w * (k + 0.5)) / n; ctx.fillStyle = '#1c130a'; rrect(ctx, x - 22, r.y + H * 0.58, 44, 9, 4); ctx.fill(); ctx.fillStyle = lg(ctx, 0, r.y + H * 0.7, 0, r.y + H * 0.76, [[0, '#a07a44'], [1, '#4a3416']]); ctx.fillRect(x - 36, r.y + H * 0.7, 72, 6); }
    const hx = r.x + r.w * 0.12; ctx.strokeStyle = '#4a5a30'; ctx.lineWidth = 2; for (let q = -4; q <= 4; q++) { ctx.beginPath(); ctx.moveTo(hx, r.y + H * 0.14); ctx.lineTo(hx + q * 5, r.y + H * 0.62); ctx.stroke(); ctx.fillStyle = q % 2 ? '#a8a0d8' : '#d8c860'; ctx.beginPath(); ctx.arc(hx + q * 5, r.y + H * 0.62, 2.6, 0, TAU); ctx.fill(); }
  },
  bkcourtyard(ctx, s, r, H) { // whitewashed wall, tiled arch, palm shadows
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.12)], [1, tint(s.wallC, -0.1)]]); ctx.fillRect(r.x, r.y, r.w, H);
    const ax = r.x + r.w * 0.72, aw = Math.min(r.w * 0.22, 120), ay = r.y + H * 0.1, ah = H * 0.9;
    ctx.beginPath(); ctx.moveTo(ax - aw / 2, ay + ah); ctx.lineTo(ax - aw / 2, ay + aw / 2); ctx.arc(ax, ay + aw / 2, aw / 2, Math.PI, 0); ctx.lineTo(ax + aw / 2, ay + ah); ctx.closePath();
    ctx.fillStyle = lg(ctx, 0, ay, 0, ay + ah, [[0, '#3a5a78'], [1, '#14222e']]); ctx.fill(); ctx.strokeStyle = '#1f4f8a'; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#f0e8d4'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.save(); ctx.globalAlpha = 0.17; ctx.strokeStyle = '#1a2a20'; ctx.lineWidth = 3;
    for (let k = 0; k < 7; k++) { const a = -0.9 + k * 0.28, x0 = r.x + r.w * 0.18, y0 = r.y; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + Math.cos(a) * 60, y0 + 30 + k * 4, x0 + Math.cos(a) * 130, y0 + H * 0.5 + k * 8); ctx.stroke(); for (let q = 0; q < 9; q++) { const u = q / 9, px = x0 + Math.cos(a) * 130 * u, py = y0 + (H * 0.5 + k * 8) * u * 0.9; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 12, py + 14); ctx.moveTo(px, py); ctx.lineTo(px - 12, py + 14); ctx.stroke(); } }
    ctx.restore();
  },
};

registerProp('hank', (ctx, s, o = {}) => { // twisted hank of dyed fibre
  const c = o.c ?? '#2c4a7a'; cast(ctx, 2, s * 0.12, s * 0.38, s * 0.08);
  for (let k = 0; k < 9; k++) { ctx.strokeStyle = tint(c, (hash(k, 7) - 0.5) * 0.4); ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.ellipse(0, 0, s * (0.3 + k * 0.012), s * (0.16 + k * 0.006), (k - 4) * 0.05, 0, TAU); ctx.stroke(); }
  ctx.fillStyle = '#4a3220'; rrect(ctx, -s * 0.05, -s * 0.2, s * 0.1, s * 0.12, 2); ctx.fill();
});
registerProp('strip', (ctx, s, o = {}) => { // flat strips of dyed palm or straw
  const c = o.c ?? '#d6b87a'; cast(ctx, 2, s * 0.1, s * 0.4, s * 0.07);
  for (let k = 0; k < 5; k++) { const y = (k - 2) * s * 0.07; ctx.fillStyle = lg(ctx, 0, y - s * 0.03, 0, y + s * 0.03, [[0, tint(c, 0.2)], [1, tint(c, -0.25)]]); ctx.beginPath(); ctx.moveTo(-s * 0.4, y); ctx.quadraticCurveTo(0, y + (k % 2 ? 5 : -5), s * 0.4, y + 1); ctx.lineTo(s * 0.4, y + s * 0.055); ctx.quadraticCurveTo(0, y + s * 0.055 + (k % 2 ? 5 : -5), -s * 0.4, y + s * 0.055); ctx.fill(); }
});

const T = (c, h, w) => ({ caption: c, hint: h, ...(w ?? {}) });
const scenes = {
  'bk-peace': { wall: 'bkimigongo', wallC: '#d6b48a', floor: 'mud', floorC: '#a8704a', light: 'window', litter: [{ k: 'grass', c: '#c9a85a' }], dock: ['awl', 'grass:#dcb978', 'hank:#2a211b', 'scissors'], dockKind: 'ledge', frame: 'plinth', words: T('Coil this peace basket', 'Lay each stitch to match the lit row', { win: 'A basket for the gift' }), pitch: 0.9 },
  'bk-okavango': { wall: 'bkriverdusk', wallC: '#a8643a', floor: 'earth', floorC: '#b08a58', light: 'window', litter: [{ k: 'grass', c: '#b08a3a' }], dock: ['awl', 'grass:#d8bf86', 'bowl'], dockKind: 'ledge', frame: 'niche', words: T('Coil this bowl', 'Wind the palm strands row by row', { win: 'A bowl of the delta' }), pitch: 0.85 },
  'bk-bolga': { wall: 'bkmarket', wallC: '#d9a15a', floor: 'earth', floorC: '#a8502e', light: 'window', litter: [{ k: 'scraps', c: '#c0392b' }, { k: 'grass', c: '#e8d6a0' }], dock: ['strip:#c0392b', 'strip:#2e8b57', 'awl', 'scissors'], dockKind: 'tray', frame: 'rail', words: T('Plait this market basket', 'Strip over strip, as at the stall', { win: 'A market basket' }), pitch: 1.1 },
  'bk-kiondo': { wall: 'bkhanks', wallC: '#8a6240', floor: 'planks', floorC: '#7a5230', light: 'lamp', litter: [{ k: 'thread', c: '#cdb283' }], dock: ['hank:#2c4a7a', 'hank:#b83a2e', 'needle', 'scissors'], dockKind: 'tray', frame: 'case', words: T('Twine this kiondo', 'Twist each stitch in its sisal colour', { win: 'A kiondo to carry' }), pitch: 1.0 },
  'bk-mesob': { wall: 'bkstonenook', wallC: '#8a7458', floor: 'weave', floorC: '#b89a60', light: 'lamp', litter: [{ k: 'grass', c: '#e4cf99' }], dock: ['awl', 'grass:#e4cf99', 'bowl', 'scissors'], dockKind: 'cloth', frame: 'plinth', words: T('Coil this mesob', 'Bind the straw coil, then the red and green bands', { win: 'A table for the feast' }), pitch: 0.8 },
  'bk-skep': { wall: 'bkbeehouse', wallC: '#7a6a4a', floor: 'planks', floorC: '#6a5a42', light: 'window', litter: [{ k: 'grass', c: '#d9b45a' }], dock: ['awl', 'grass:#d9b45a', 'scissors', 'bowl'], dockKind: 'ledge', frame: 'rail', words: T('Lash this skep', 'Bind the straw bundle round and round', { win: 'A hive for the bees' }), pitch: 0.7 },
  'bk-tray': { wall: 'bkcourtyard', wallC: '#efe3cc', floor: 'tile', floorC: '#c0916a', light: 'window', litter: [{ k: 'grass', c: '#d6b87a' }], dock: ['strip:#d6b87a', 'strip:#a8321f', 'scissors', 'bowl'], dockKind: 'cloth', frame: 'tile', words: T('Plait this tray', 'Palm strip over and under', { win: 'A tray for the dates' }), pitch: 1.2 },
  'bk-lutsambo': { wall: 'bkthatchwall', wallC: '#b69a5a', floor: 'mat', floorC: '#5a4630', light: 'window', litter: [{ k: 'grass', c: '#c8a860' }], dock: ['awl', 'grass:#c8a860', 'hank:#5e2a4a', 'scissors'], dockKind: 'ledge', frame: 'niche', words: T('Coil this lidded basket', 'Lay the grass coil and bind it', { win: 'A basket with a lid' }), pitch: 0.95 },
};
registerSceneSet({
  scenes: Object.fromEntries(Object.entries(scenes).map(([id, s]) => [id, { ...s, hang: [] }])),
  walls, soundMat: Object.fromEntries(Object.keys(scenes).map((id) => [id, 'grass'])),
});

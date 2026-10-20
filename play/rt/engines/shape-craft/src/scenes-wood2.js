// shape-craft 1.14.0 workshops for the Carved Wood bucket: a Venetian boatyard, a Dutch clog shop, an Akan courtyard, a Zafimaniry
// highland house, a Szekler hillside, a marsh boathouse and an alpine workshop. Pure drawing, no randomness.
import { registerSceneSet } from './registry.js';
import { hash } from './geom.js';
import { tint, rgba, rrect } from './fx.js';
import { lg, rg, ell, cast, TAU } from './props.js';

const walls = {
  bkvenice(ctx, s, r, H, t) { // squero: dusk sky, canal, brick quay, a gondola prow with its iron comb
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#ef9a6a'], [0.45, '#f6d2a0'], [0.46, '#3b6f86'], [1, '#1d4458']]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let k = 0; k < 6; k++) { const x = r.x + r.w * (0.04 + k * 0.17 + hash(k, 3) * 0.04), w = 30 + hash(k, 4) * 28, h0 = H * (0.2 + hash(k, 5) * 0.2); ctx.fillStyle = ['#b8623c', '#d9a073', '#9c4a34'][k % 3]; ctx.fillRect(x, r.y + H * 0.46 - h0, w, h0); ctx.fillStyle = 'rgba(40,20,10,0.55)'; for (let q = 0; q < 2; q++) ctx.fillRect(x + w * (0.2 + q * 0.4), r.y + H * 0.46 - h0 * 0.7, w * 0.18, h0 * 0.28); }
    ctx.strokeStyle = 'rgba(255,230,190,0.35)'; ctx.lineWidth = 1.5; for (let k = 0; k < 5; k++) { const y = r.y + H * (0.55 + k * 0.08); ctx.beginPath(); ctx.moveTo(r.x, y); ctx.bezierCurveTo(r.x + r.w * 0.3, y - 4, r.x + r.w * 0.6, y + 4, r.x + r.w, y); ctx.stroke(); }
    const gx = r.x + r.w * 0.72, gy = r.y + H * 0.8; ctx.fillStyle = '#14100e'; ctx.beginPath(); ctx.moveTo(gx - 150, gy + 4); ctx.quadraticCurveTo(gx - 20, gy + 14, gx + 20, gy - 6); ctx.lineTo(gx + 26, gy - 52); ctx.lineTo(gx + 14, gy - 50); ctx.quadraticCurveTo(gx + 6, gy - 20, gx - 150, gy - 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c9c7c0'; for (let k = 0; k < 6; k++) ctx.fillRect(gx + 14 + k * 2, gy - 52 + k * 5, 14 - k, 2.5);
  },
  bkdutch(ctx, s, r, H) { // blue and white tiled wall, a window onto a windmill, a shelf of finished clogs
    ctx.fillStyle = '#f1f1ec'; ctx.fillRect(r.x, r.y, r.w, H); const ts = Math.max(26, H / 4);
    for (let y = r.y; y < r.y + H; y += ts) for (let x = r.x; x < r.x + r.w; x += ts) { ctx.strokeStyle = 'rgba(30,70,150,0.25)'; ctx.strokeRect(x, y, ts, ts); ctx.fillStyle = '#2a5db8'; const cx = x + ts / 2, cy = y + ts / 2, k = (((x - r.x) / ts) | 0) + (((y - r.y) / ts) | 0); if (k % 2) { ctx.beginPath(); for (let a = 0; a < 4; a++) { ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a * 1.5708 + 0.6) * ts * 0.28, cy + Math.sin(a * 1.5708 + 0.6) * ts * 0.28); } ctx.lineWidth = 2; ctx.strokeStyle = '#2a5db8'; ctx.stroke(); } else { ell(ctx, cx, cy, ts * 0.12, ts * 0.12); ctx.fill(); } }
    const wx = r.x + r.w * 0.58, ww = Math.min(r.w * 0.2, 150), wy = r.y + H * 0.12, wh = H * 0.62; ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#a9d4ee'], [1, '#e9f2d8']]); ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = '#6a8a3a'; ctx.fillRect(wx, wy + wh * 0.8, ww, wh * 0.2); ctx.fillStyle = '#7a3a22'; ctx.beginPath(); ctx.moveTo(wx + ww * 0.42, wy + wh * 0.82); ctx.lineTo(wx + ww * 0.5, wy + wh * 0.36); ctx.lineTo(wx + ww * 0.58, wy + wh * 0.82); ctx.fill();
    ctx.strokeStyle = '#4a2a14'; ctx.lineWidth = 3; for (let a = 0; a < 4; a++) { ctx.beginPath(); ctx.moveTo(wx + ww * 0.5, wy + wh * 0.38); ctx.lineTo(wx + ww * 0.5 + Math.cos(a * 1.5708 + 0.4) * ww * 0.36, wy + wh * 0.38 + Math.sin(a * 1.5708 + 0.4) * ww * 0.36); ctx.stroke(); }
    ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 5; ctx.strokeRect(wx, wy, ww, wh);
    ctx.fillStyle = '#8a5a30'; ctx.fillRect(r.x, r.y + H * 0.84, r.w * 0.5, 5); for (let k = 0; k < 4; k++) { const x = r.x + 30 + k * 62; ctx.fillStyle = ['#e8c060', '#d8d0b0', '#c85030', '#e8c060'][k]; ctx.beginPath(); ctx.ellipse(x, r.y + H * 0.84 - 8, 26, 9, 0, 0, TAU); ctx.fill(); }
  },
  bkkumasi(ctx, s, r, H) { // red earth wall, ochre dado, a hanging strip-woven cloth, thatch eave
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#b0583a'], [1, '#8a3e26']]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.fillStyle = '#e0b050'; ctx.fillRect(r.x, r.y + H * 0.72, r.w, H * 0.28); ctx.fillStyle = '#2a1a10'; for (let k = 0; k < r.w / 22; k++) { ctx.beginPath(); ctx.moveTo(r.x + k * 22, r.y + H * 0.72); ctx.lineTo(r.x + k * 22 + 11, r.y + H * 0.8); ctx.lineTo(r.x + k * 22 + 22, r.y + H * 0.72); ctx.fill(); }
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H * 0.2, [[0, '#5a4a22'], [1, '#8a7238']]); ctx.fillRect(r.x, r.y, r.w, H * 0.18); ctx.strokeStyle = 'rgba(40,30,10,0.4)'; for (let k = 0; k < r.w / 6; k++) { ctx.beginPath(); ctx.moveTo(r.x + k * 6, r.y); ctx.lineTo(r.x + k * 6 + 3, r.y + H * 0.18); ctx.stroke(); }
    const cx = r.x + r.w * 0.28, cw = Math.min(r.w * 0.22, 130), cols = ['#d8a020', '#1a6a3a', '#b8201c', '#101010', '#d8a020', '#2a4aa0']; for (let k = 0; k < 6; k++) { ctx.fillStyle = cols[k]; ctx.fillRect(cx + (k * cw) / 6, r.y + H * 0.24, cw / 6 + 1, H * 0.42); for (let q = 0; q < 4; q++) { ctx.fillStyle = cols[(k + q + 2) % 6]; ctx.fillRect(cx + (k * cw) / 6, r.y + H * (0.28 + q * 0.1), cw / 6 + 1, H * 0.035); } }
    ctx.fillStyle = '#2a1a10'; ctx.fillRect(cx - 4, r.y + H * 0.2, cw + 8, 4);
  },
  bkmada(ctx, s, r, H) { // dark plank house of the highlands, a window onto terraced hills, a woven mat
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#4a2c1c'], [1, '#2e1a10']]); ctx.fillRect(r.x, r.y, r.w, H); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; for (let x = r.x; x < r.x + r.w; x += 30) { ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + H); ctx.stroke(); }
    const wx = r.x + r.w * 0.5, ww = Math.min(r.w * 0.26, 170), wy = r.y + H * 0.16, wh = H * 0.62; ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#f2d8a0'], [0.5, '#bcd8a8'], [1, '#6a9a5a']]); ctx.fillRect(wx, wy, ww, wh);
    for (let k = 0; k < 4; k++) { ctx.fillStyle = ['#4a7a3a', '#6a9a4a', '#8aaa5a', '#9aba6a'][k]; ctx.beginPath(); ctx.moveTo(wx, wy + wh * (0.45 + k * 0.14)); ctx.quadraticCurveTo(wx + ww * 0.5, wy + wh * (0.3 + k * 0.14), wx + ww, wy + wh * (0.5 + k * 0.14)); ctx.lineTo(wx + ww, wy + wh); ctx.lineTo(wx, wy + wh); ctx.fill(); }
    ctx.strokeStyle = '#8a5a30'; ctx.lineWidth = 6; ctx.strokeRect(wx, wy, ww, wh);
    ctx.fillStyle = '#c8a060'; ctx.fillRect(r.x + r.w * 0.1, r.y + H * 0.3, r.w * 0.2, H * 0.46); ctx.strokeStyle = '#6a3a1c'; ctx.lineWidth = 2; for (let k = 0; k < 6; k++) for (let q = 0; q < 4; q++) { ctx.strokeRect(r.x + r.w * 0.1 + (k * r.w * 0.2) / 6, r.y + H * 0.3 + (q * H * 0.46) / 4, (r.w * 0.2) / 6, (H * 0.46) / 4); }
  },
  bksekler(ctx, s, r, H) { // green hills, haystacks, a dry sky and a plank fence
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#9ec8e8'], [0.5, '#e8efe0'], [0.5, '#7aa84a'], [1, '#4a7a30']]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.fillStyle = '#5a8a3a'; ctx.beginPath(); ctx.moveTo(r.x, r.y + H * 0.52); ctx.quadraticCurveTo(r.x + r.w * 0.3, r.y + H * 0.28, r.x + r.w * 0.6, r.y + H * 0.5); ctx.quadraticCurveTo(r.x + r.w * 0.85, r.y + H * 0.38, r.x + r.w, r.y + H * 0.5); ctx.lineTo(r.x + r.w, r.y + H * 0.6); ctx.lineTo(r.x, r.y + H * 0.6); ctx.fill();
    for (let k = 0; k < 4; k++) { const x = r.x + r.w * (0.12 + k * 0.22 + hash(k, 2) * 0.05), y = r.y + H * 0.72; ctx.fillStyle = '#d8b060'; ctx.beginPath(); ctx.moveTo(x - 28, y + 14); ctx.quadraticCurveTo(x - 24, y - 24, x, y - 34); ctx.quadraticCurveTo(x + 24, y - 24, x + 28, y + 14); ctx.fill(); ctx.strokeStyle = '#8a6a2a'; ctx.beginPath(); ctx.moveTo(x, y - 34); ctx.lineTo(x, y + 14); ctx.stroke(); }
    ctx.fillStyle = '#6a4a28'; for (let x = r.x + 4; x < r.x + r.w; x += 20) ctx.fillRect(x, r.y + H * 0.84, 12, H * 0.16); ctx.fillRect(r.x, r.y + H * 0.88, r.w, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ell(ctx, r.x + r.w * 0.2, r.y + H * 0.16, 44, 12); ctx.fill(); ell(ctx, r.x + r.w * 0.7, r.y + H * 0.24, 56, 13); ctx.fill();
  },
  bkmarsh(ctx, s, r, H) { // sunrise over a marsh, reeds, a skiff
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#f2b878'], [0.4, '#f8e2b8'], [0.55, '#9ab8b0'], [1, '#4a6a68']]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.fillStyle = 'rgba(255,240,200,0.9)'; ell(ctx, r.x + r.w * 0.3, r.y + H * 0.5, 22, 22); ctx.fill();
    ctx.strokeStyle = '#6a7a3a'; ctx.lineWidth = 2; for (let k = 0; k < r.w / 9; k++) { const x = r.x + k * 9 + hash(k, 1) * 6, h0 = H * (0.3 + hash(k, 2) * 0.3); ctx.beginPath(); ctx.moveTo(x, r.y + H); ctx.quadraticCurveTo(x + 6, r.y + H - h0 * 0.6, x + (hash(k, 3) - 0.5) * 16, r.y + H - h0); ctx.stroke(); if (k % 4 === 0) { ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x - 2, r.y + H - h0 - 10, 4, 12); } }
    ctx.fillStyle = '#2a1e16'; ctx.beginPath(); ctx.moveTo(r.x + r.w * 0.55, r.y + H * 0.7); ctx.lineTo(r.x + r.w * 0.8, r.y + H * 0.7); ctx.lineTo(r.x + r.w * 0.76, r.y + H * 0.8); ctx.lineTo(r.x + r.w * 0.58, r.y + H * 0.8); ctx.fill();
  },
  bkchalet(ctx, s, r, H) { // pale pine boards, a window onto snowy peaks, a shutter with a heart cut-out
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#d8b480'], [1, '#b8905a']]); ctx.fillRect(r.x, r.y, r.w, H); ctx.strokeStyle = 'rgba(90,50,20,0.35)'; for (let y = r.y; y < r.y + H; y += 18) { ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke(); }
    const wx = r.x + r.w * 0.4, ww = Math.min(r.w * 0.28, 190), wy = r.y + H * 0.12, wh = H * 0.7; ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#bcdcf4'], [1, '#f4f8fc']]); ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = '#e8eef6'; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx + ww * 0.3, wy + wh * 0.3); ctx.lineTo(wx + ww * 0.5, wy + wh * 0.6); ctx.lineTo(wx + ww * 0.72, wy + wh * 0.22); ctx.lineTo(wx + ww, wy + wh); ctx.fill(); ctx.fillStyle = '#7a8aa0'; ctx.beginPath(); ctx.moveTo(wx + ww * 0.3, wy + wh * 0.3); ctx.lineTo(wx + ww * 0.4, wy + wh * 0.55); ctx.lineTo(wx + ww * 0.22, wy + wh * 0.5); ctx.fill();
    ctx.strokeStyle = '#5a3418'; ctx.lineWidth = 6; ctx.strokeRect(wx, wy, ww, wh);
    const sx = wx + ww + 14, sw = ww * 0.42; ctx.fillStyle = '#3a6a4a'; ctx.fillRect(sx, wy, sw, wh); ctx.fillStyle = '#e8d8b0'; ctx.beginPath(); const hx = sx + sw / 2, hy = wy + wh * 0.3; ctx.moveTo(hx, hy + 14); ctx.bezierCurveTo(hx - 24, hy - 4, hx - 8, hy - 20, hx, hy - 6); ctx.bezierCurveTo(hx + 8, hy - 20, hx + 24, hy - 4, hx, hy + 14); ctx.fill();
  },
};
const T = (c, h, w) => ({ caption: c, hint: h, ...(w ?? {}) });
const mk = (o) => ({ hang: [], light: 'window', ...o });
const scenes = {
  venice: mk({ wall: 'bkvenice', wallC: '#b8623c', floor: 'planks', floorC: '#5a4028', litter: [{ k: 'shavings', c: '#7a4a28' }], dock: ['chisel', 'rasp', 'mallet', 'sponge'], dockKind: 'ledge', frame: 'plinth', block: 'wood', seat: 'bench', tool: 'chisel', cavity: 'dark', fx: { kind: 'chip', c: '#7a4a28' }, pitch: 0.7, wave: 'triangle', words: T('Carve this oarlock', 'Cut the walnut away outside the lit outline', { hintBlind: 'Shape the walnut into the forcola' }) }),
  dutch: mk({ wall: 'bkdutch', wallC: '#f1f1ec', floor: 'tile', floorC: '#8a7a68', litter: [{ k: 'shavings', c: '#f0e0b0' }], dock: ['gouge', 'knife', 'mallet', 'pot:#2a5db8'], dockKind: 'tray', frame: 'case', block: 'wood', seat: 'board', tool: 'gouge', cavity: 'dark', fx: { kind: 'chip', c: '#f0e0b0' }, pitch: 0.95, wave: 'triangle', words: T('Carve this clog', 'Scoop the poplar away outside the lit outline', { hintBlind: 'Hollow the block into a clog' }) }),
  kumasi: mk({ wall: 'bkkumasi', wallC: '#a8483a', floor: 'earth', floorC: '#a8643a', light: 'window', litter: [{ k: 'shavings', c: '#e8cc98' }], dock: ['chisel', 'mallet', 'gouge', 'rasp'], dockKind: 'ledge', frame: 'rail', block: 'wood', seat: 'sandbag', tool: 'gouge', cavity: 'dark', fx: { kind: 'chip', c: '#e8cc98' }, pitch: 0.8, wave: 'triangle', words: T('Carve this stool', 'Chisel the wood away outside the lit outline', { hintBlind: 'Carve the stool from one block' }) }),
  mada: mk({ wall: 'bkmada', wallC: '#4a2c1c', floor: 'planks', floorC: '#3a2414', light: 'lamp', litter: [{ k: 'shavings', c: '#c88858' }], dock: ['knife', 'chisel', 'mallet'], dockKind: 'tray', frame: 'niche', block: 'wood', seat: 'board', tool: 'knife', cavity: 'dark', fx: { kind: 'chip', c: '#c88858' }, pitch: 0.9, wave: 'triangle', words: T('Carve this panel', 'Cut away the wood outside the lit outline', { hintBlind: 'Carve the lozenges of the panel' }) }),
  szekler: mk({ wall: 'bksekler', wallC: '#7aa84a', floor: 'earth', floorC: '#8a6a40', litter: [{ k: 'shavings', c: '#e0b878' }], dock: ['mallet', 'gouge', 'chisel', 'bowl'], dockKind: 'ledge', frame: 'case', block: 'wood', seat: 'bench', tool: 'gouge', cavity: 'dark', fx: { kind: 'chip', c: '#e0b878' }, pitch: 0.75, wave: 'triangle', words: T('Carve this gate', 'Cut the oak away outside the lit outline', { hintBlind: 'Carve the gate, posts and roof' }) }),
  marsh: mk({ wall: 'bkmarsh', wallC: '#9ab8b0', floor: 'planks', floorC: '#6a5a46', litter: [{ k: 'shavings', c: '#d8b888' }], dock: ['knife', 'rasp', 'pot:#2a6a4a', 'brush:#2a6a4a'], dockKind: 'ledge', frame: 'rail', block: 'wood', seat: 'bench', tool: 'knife', cavity: 'dark', fx: { kind: 'chip', c: '#d8b888' }, pitch: 1.05, wave: 'triangle', words: T('Carve this decoy', 'Whittle the cedar away outside the lit outline', { hintBlind: 'Whittle the block into a duck' }) }),
  chalet: mk({ wall: 'bkchalet', wallC: '#d8b480', floor: 'planks', floorC: '#b8905a', litter: [{ k: 'shavings', c: '#f4e4c0' }], dock: ['knife', 'pick', 'pot:#3a6a4a'], dockKind: 'cloth', frame: 'card', block: 'wood', seat: 'board', tool: 'knife', cavity: 'dark', fx: { kind: 'chip', c: '#f4e4c0' }, pitch: 1.3, wave: 'triangle', words: T('Cut this rosette', 'Take the chips away outside the lit outline', { hintBlind: 'Cut the chips of the rosette' }) }),
};
registerSceneSet({ scenes, walls, soundMat: Object.fromEntries(Object.keys(scenes).map((k) => [k, 'wood'])) });
void rg; void cast; void rgba; void rrect; void tint;

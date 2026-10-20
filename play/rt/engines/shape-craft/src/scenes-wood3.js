// shape-craft 1.14.4 workshops for Carved Wood: a Curonian dune cottage and a Suzhou lattice studio. Pure drawing, no randomness.
import { registerSceneSet } from './registry.js';
import { hash } from './geom.js';
import { lg, ell, TAU } from './props.js';

const walls = {
  bkcuronian(ctx, s, r, H) { // grey Baltic sky, a pale dune, the sea, a drying fishing net on poles and a weathered plank wall below
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#c9d6de'], [0.42, '#eef0ee'], [0.43, '#6f93a6'], [0.62, '#4d7388'], [0.63, '#e6d3a4'], [1, '#c9b27a']]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.fillStyle = '#d8c48e'; ctx.beginPath(); ctx.moveTo(r.x, r.y + H * 0.7); ctx.quadraticCurveTo(r.x + r.w * 0.3, r.y + H * 0.46, r.x + r.w * 0.62, r.y + H * 0.64); ctx.quadraticCurveTo(r.x + r.w * 0.85, r.y + H * 0.56, r.x + r.w, r.y + H * 0.68); ctx.lineTo(r.x + r.w, r.y + H); ctx.lineTo(r.x, r.y + H); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; for (let k = 0; k < 4; k++) { const y = r.y + H * (0.46 + k * 0.045); ctx.beginPath(); ctx.moveTo(r.x, y); ctx.bezierCurveTo(r.x + r.w * 0.3, y - 3, r.x + r.w * 0.6, y + 3, r.x + r.w, y); ctx.stroke(); }
    const nx = r.x + r.w * 0.52, nw = Math.min(r.w * 0.34, 230), ny = r.y + H * 0.18, nh = H * 0.5; ctx.fillStyle = '#5a4630'; ctx.fillRect(nx - 5, ny - 6, 7, nh + 10); ctx.fillRect(nx + nw - 2, ny - 6, 7, nh + 10);
    ctx.strokeStyle = 'rgba(70,56,40,0.75)'; ctx.lineWidth = 1; for (let k = 0; k <= 12; k++) { ctx.beginPath(); ctx.moveTo(nx + (nw * k) / 12, ny); ctx.quadraticCurveTo(nx + (nw * k) / 12 + 6, ny + nh * 0.6, nx + (nw * k) / 12, ny + nh); ctx.stroke(); } for (let k = 0; k <= 9; k++) { ctx.beginPath(); ctx.moveTo(nx, ny + (nh * k) / 9); ctx.quadraticCurveTo(nx + nw / 2, ny + (nh * k) / 9 + 10, nx + nw, ny + (nh * k) / 9); ctx.stroke(); }
    ctx.fillStyle = '#e8e2d0'; for (let k = 0; k < 5; k++) { ell(ctx, nx + nw * (0.12 + k * 0.19), ny + nh * (0.2 + (k % 2) * 0.25), 6, 3); ctx.fill(); }
    ctx.fillStyle = '#7a6a56'; ctx.fillRect(r.x, r.y + H * 0.84, r.w, H * 0.16); ctx.strokeStyle = 'rgba(30,20,10,0.4)'; for (let x = r.x; x < r.x + r.w; x += 26) { ctx.beginPath(); ctx.moveTo(x, r.y + H * 0.84); ctx.lineTo(x, r.y + H); ctx.stroke(); }
  },
  bksuzhou(ctx, s, r, H) { // whitewashed wall, a moon-gate window with a lattice onto a garden rock and bamboo, a rack of tiny stones
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#f4f1e8'], [1, '#dcd8c8']]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.fillStyle = '#4a4a46'; ctx.fillRect(r.x, r.y, r.w, 6); for (let k = 0; k < r.w / 24; k++) { ctx.beginPath(); ctx.moveTo(r.x + k * 24, r.y + 6); ctx.lineTo(r.x + k * 24 + 12, r.y + 14); ctx.lineTo(r.x + k * 24 + 24, r.y + 6); ctx.fill(); }
    const cx = r.x + r.w * 0.58, cy = r.y + H * 0.5, rad = Math.min(H * 0.38, r.w * 0.16);
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, rad, 0, TAU); ctx.clip(); ctx.fillStyle = lg(ctx, 0, cy - rad, 0, cy + rad, [[0, '#cfe6d8'], [1, '#8fb89a']]); ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    ctx.fillStyle = '#7a8a86'; ctx.beginPath(); ctx.moveTo(cx - rad * 0.9, cy + rad); ctx.quadraticCurveTo(cx - rad * 0.8, cy - rad * 0.2, cx - rad * 0.3, cy + rad * 0.1); ctx.quadraticCurveTo(cx - rad * 0.1, cy + rad * 0.5, cx, cy + rad); ctx.fill();
    ctx.strokeStyle = '#3a6a3a'; ctx.lineWidth = 3; for (let k = 0; k < 5; k++) { const x = cx + rad * (0.15 + k * 0.17); ctx.beginPath(); ctx.moveTo(x, cy + rad); ctx.lineTo(x + 6, cy - rad * (0.3 + hash(k, 1) * 0.5)); ctx.stroke(); }
    ctx.restore(); ctx.strokeStyle = '#3a3a38'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, TAU); ctx.stroke(); ctx.lineWidth = 1.5; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(cx + k * rad * 0.28, cy - rad); ctx.lineTo(cx + k * rad * 0.28, cy + rad); ctx.stroke(); }
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(r.x + r.w * 0.06, r.y + H * 0.7, r.w * 0.22, 5); for (let k = 0; k < 4; k++) { ctx.fillStyle = ['#8a8a82', '#a89a86', '#6a7a72', '#b8a890'][k]; ell(ctx, r.x + r.w * (0.09 + k * 0.05), r.y + H * 0.7 - 7, 9, 7); ctx.fill(); }
  },
};
const T = (c, h, w) => ({ caption: c, hint: h, ...(w ?? {}) });
const mk = (o) => ({ hang: [], light: 'window', ...o });
const scenes = {
  curonian: mk({ wall: 'bkcuronian', wallC: '#c9d6de', floor: 'planks', floorC: '#7a6a56', litter: [{ k: 'shavings', c: '#e8d4a8' }], dock: ['knife', 'gouge', 'mallet', 'rasp'], dockKind: 'ledge', frame: 'rail', block: 'wood', seat: 'bench', tool: 'knife', cavity: 'dark', fx: { kind: 'chip', c: '#e8d4a8' }, pitch: 0.85, wave: 'triangle', words: T('Carve this weathervane', 'Cut the pine away outside the lit outline', { hintBlind: 'Cut the vane, the sun and the forked tail' }) }),
  suzhou: mk({ wall: 'bksuzhou', wallC: '#f4f1e8', floor: 'tile', floorC: '#8a8a82', litter: [{ k: 'shavings', c: '#cfc0a0' }], dock: ['knife', 'pick', 'brush:#3a3a38', 'pot:#2a2a28'], dockKind: 'tray', frame: 'case', block: 'wood', seat: 'board', tool: 'knife', cavity: 'dark', fx: { kind: 'chip', c: '#cfc0a0' }, pitch: 1.4, wave: 'sine', words: T('Carve this tiny boat', 'Take the stone away outside the lit outline', { hintBlind: 'Carve the boat, its cabin and windows' }) }),
};
registerSceneSet({ scenes, walls, soundMat: Object.fromEntries(Object.keys(scenes).map((k) => [k, 'wood'])) });

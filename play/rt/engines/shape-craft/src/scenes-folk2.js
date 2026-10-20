// shape-craft 1.14.2 paint workshops for the Painted Folk Art bucket. Scene ids equal the figure ids in src/paint-figures/folk2.js.
import { registerSceneSet } from './registry.js';
import { hash } from './geom.js';
import { tint, rgba, rrect } from './fx.js';
import { lg, rg, ell, TAU } from './props.js';

const walls = {
  hexwall(ctx, s, r, H) { // a red barn wall of boards, a stone foundation, a pasture under a big sky
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#a8281f'], [1, '#7a1a14']]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 2; for (let x = r.x; x < r.x + r.w; x += 24) { ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + H); ctx.stroke(); }
    ctx.fillStyle = '#8a8478'; ctx.fillRect(r.x, r.y + H * 0.82, r.w, H * 0.18); for (let x = r.x; x < r.x + r.w; x += 36) { ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.strokeRect(x + (hash(x | 0, 1) * 8), r.y + H * 0.82, 34, H * 0.18); }
    const cx = r.x + r.w * 0.2, cy = r.y + H * 0.4, R0 = Math.min(H * 0.28, 60); ctx.fillStyle = '#f2e8cc'; ell(ctx, cx, cy, R0, R0); ctx.fill(); ctx.strokeStyle = '#1f4a8c'; ctx.lineWidth = 4; ctx.stroke(); ctx.fillStyle = '#e8b81c'; ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8 - Math.PI / 2, rr = i % 2 ? R0 * 0.35 : R0 * 0.85; ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } ctx.closePath(); ctx.fill();
  },
  zhwall(ctx, s, r, H) { // a Russian workshop: panelled wall, a shelf of black lacquer trays on edge, a samovar
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#6a3a22'], [1, '#3e2214']]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.strokeStyle = 'rgba(255,220,160,0.12)'; ctx.lineWidth = 2; for (let x = r.x + 40; x < r.x + r.w; x += 120) ctx.strokeRect(x, r.y + 8, 100, H - 16);
    ctx.fillStyle = '#c89a5a'; ctx.fillRect(r.x, r.y + H * 0.7, r.w, 6);
    for (let k = 0; k < 4; k++) { const x = r.x + 40 + k * 78 + (k > 1 ? 120 : 0); ctx.fillStyle = '#17110f'; ell(ctx, x, r.y + H * 0.45, 28, 36); ctx.fill(); ctx.strokeStyle = '#e6b84a'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.fillStyle = ['#c8283c', '#f09ab0', '#2f7a3a', '#e6b84a'][k]; ell(ctx, x + 2, r.y + H * 0.44, 9, 9); ctx.fill(); }
    const sx = r.x + r.w * 0.84; ctx.fillStyle = lg(ctx, sx - 20, 0, sx + 20, 0, [[0, '#8a5a1c'], [0.4, '#f0cc70'], [1, '#6a4410']]); ell(ctx, sx, r.y + H * 0.5, 22, 28); ctx.fill(); ctx.fillRect(sx - 6, r.y + H * 0.2, 12, H * 0.12); ctx.fillRect(sx - 10, r.y + H * 0.7 - 12, 20, 12);
  },
  cicwall(ctx, s, r, H) { // a mountain village: log houses with white patterns, pine slopes
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#b8d0e0'], [0.55, '#e8eee8'], [0.56, '#4a6a3a'], [1, '#2e4a28']]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.fillStyle = '#7a8a9a'; ctx.beginPath(); ctx.moveTo(r.x, r.y + H * 0.56); ctx.lineTo(r.x + r.w * 0.25, r.y + H * 0.2); ctx.lineTo(r.x + r.w * 0.5, r.y + H * 0.56); ctx.fill();
    for (let k = 0; k < 3; k++) { const x = r.x + r.w * (0.1 + k * 0.3), w = Math.min(r.w * 0.2, 110), y = r.y + H * 0.5; ctx.fillStyle = '#3a2a1e'; ctx.fillRect(x, y, w, H * 0.34); ctx.fillStyle = '#8a4a2a'; ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x + w / 2, y - H * 0.18); ctx.lineTo(x + w + 8, y); ctx.fill(); ctx.strokeStyle = '#f4eee0'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 6; i++) ctx.lineTo(x + 6 + (i * (w - 12)) / 6, y + 10 + (i % 2) * 8); ctx.stroke(); ctx.strokeRect(x + w * 0.35, y + H * 0.14, w * 0.3, H * 0.2); }
  },
  taptapwall(ctx, s, r, H) { // a Port-au-Prince street: bright shopfronts, a bus parked at the kerb, a hot sky
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#ffb04a'], [0.4, '#ffe08a'], [1, '#ffd070']]); ctx.fillRect(r.x, r.y, r.w, H);
    const cols = ['#e83a6a', '#2a9ad0', '#2aa84a', '#f2c32e', '#9a3ad0']; for (let k = 0; k < 6; k++) { const x = r.x + (r.w * k) / 6, w = r.w / 6; ctx.fillStyle = cols[k % 5]; ctx.fillRect(x, r.y + H * (0.3 + hash(k, 2) * 0.15), w - 4, H); ctx.fillStyle = 'rgba(255,255,255,0.55)'; for (let q = 0; q < 2; q++) ctx.fillRect(x + 8 + q * (w * 0.4), r.y + H * 0.5, w * 0.22, H * 0.18); }
    ctx.fillStyle = '#e8281c'; rrect(ctx, r.x + r.w * 0.55, r.y + H * 0.62, r.w * 0.36, H * 0.3, 10); ctx.fill(); ctx.fillStyle = '#f6d02a'; ctx.fillRect(r.x + r.w * 0.55, r.y + H * 0.76, r.w * 0.36, 6); ctx.fillStyle = '#1a1614'; for (const f of [0.64, 0.82]) { ell(ctx, r.x + r.w * f, r.y + H * 0.93, 14, 14); ctx.fill(); }
  },
  scrwall(ctx, s, r, H) { // Baltimore rowhouses: red brick, white marble steps, a screen door
    ctx.fillStyle = '#a8503a'; ctx.fillRect(r.x, r.y, r.w, H); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; for (let y = r.y; y < r.y + H; y += 10) { ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke(); for (let x = r.x + ((y / 10) % 2) * 14; x < r.x + r.w; x += 28) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 10); ctx.stroke(); } }
    for (let k = 0; k < 3; k++) { const x = r.x + r.w * (0.06 + k * 0.32), w = Math.min(r.w * 0.2, 100); ctx.fillStyle = '#f4f0e6'; ctx.fillRect(x - 6, r.y + H * 0.1, w + 12, H * 0.5); ctx.fillStyle = lg(ctx, 0, r.y + H * 0.1, 0, r.y + H * 0.6, [[0, '#8cb8d8'], [1, '#e8f0f4']]); ctx.fillRect(x, r.y + H * 0.14, w, H * 0.42); ctx.strokeStyle = '#6a8a6a'; ctx.lineWidth = 1; for (let i = 0; i < w; i += 5) { ctx.beginPath(); ctx.moveTo(x + i, r.y + H * 0.14); ctx.lineTo(x + i, r.y + H * 0.56); ctx.stroke(); } }
    ctx.fillStyle = '#f4f0e6'; for (let q = 0; q < 3; q++) ctx.fillRect(r.x, r.y + H * (0.7 + q * 0.1), r.w * 0.5 + q * 18, H * 0.1);
  },
  zalwall(ctx, s, r, H) { // a Polish cottage: whitewashed wall with painted flowers round the window, a flowering garden
    ctx.fillStyle = '#f4f0e6'; ctx.fillRect(r.x, r.y, r.w, H); ctx.fillStyle = '#6aa84a'; ctx.fillRect(r.x, r.y + H * 0.8, r.w, H * 0.2);
    const wx = r.x + r.w * 0.5, ww = Math.min(r.w * 0.2, 110), wy = r.y + H * 0.14; ctx.fillStyle = '#9ac8e8'; ctx.fillRect(wx - ww / 2, wy, ww, H * 0.5); ctx.strokeStyle = '#2a58b8'; ctx.lineWidth = 6; ctx.strokeRect(wx - ww / 2, wy, ww, H * 0.5);
    for (let k = 0; k < 14; k++) { const a = (k / 14) * TAU, x = wx + Math.cos(a) * (ww * 0.78), y = wy + H * 0.25 + Math.sin(a) * (H * 0.36); ctx.fillStyle = ['#d02428', '#f0c020', '#2a58b8'][k % 3]; ell(ctx, x, y, 7, 7); ctx.fill(); ctx.fillStyle = '#1c1a18'; ell(ctx, x, y, 2, 2); ctx.fill(); }
    for (let k = 0; k < 9; k++) { const x = r.x + 20 + k * (r.w / 9); ctx.strokeStyle = '#2f8a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, r.y + H); ctx.lineTo(x, r.y + H * 0.84); ctx.stroke(); ctx.fillStyle = ['#d02428', '#f0c020', '#faf6ee'][k % 3]; ell(ctx, x, r.y + H * 0.82, 6, 6); ctx.fill(); }
  },
  krowall(ctx, s, r, H) { // a farmhouse kitchen: a shelf of dyed eggs in a straw basket, an embroidered cloth, blue shutters
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#e8dcc0'], [1, '#c8b890']]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.fillStyle = '#8a5a30'; ctx.fillRect(r.x, r.y + H * 0.62, r.w, 8);
    const cols = ['#7c1c26', '#1f3a6a', '#2a5a3a', '#d8a020', '#7c1c26', '#1f3a6a']; for (let k = 0; k < 6; k++) { const x = r.x + r.w * 0.1 + k * 34; ctx.fillStyle = cols[k]; ell(ctx, x, r.y + H * 0.62 - 16, 11, 15); ctx.fill(); ctx.strokeStyle = 'rgba(255,240,210,0.7)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - 9, r.y + H * 0.62 - 16); ctx.lineTo(x + 9, r.y + H * 0.62 - 16); ctx.stroke(); }
    ctx.fillStyle = '#c89a4a'; ctx.beginPath(); ctx.ellipse(r.x + r.w * 0.7, r.y + H * 0.58, 44, 20, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#2a58a0'; ctx.fillRect(r.x + r.w * 0.82, r.y + H * 0.08, r.w * 0.14, H * 0.46); ctx.strokeStyle = '#f4f0e6'; ctx.lineWidth = 3; ctx.strokeRect(r.x + r.w * 0.82, r.y + H * 0.08, r.w * 0.14, H * 0.46);
  },
};
const T = (c, h) => ({ caption: c, hint: h });
const mk = (o) => ({ light: 'window', hang: [], dockKind: 'ledge', pitch: 1.0, wave: 'triangle', ...o });
const scenes = {
  hexsign: mk({ wall: 'hexwall', wallC: '#a8281f', floor: 'planks', floorC: '#8a6a40', litter: [{ k: 'splash', c: '#b3231c' }], dock: ['brush:#b3231c', 'brush:#1f4a8c', 'gauge', 'pot:#e8b81c'], frame: 'rail', words: T('Paint this sign', 'Rings and star first, then the colours') }),
  zhostovo: mk({ wall: 'zhwall', wallC: '#6a3a22', floor: 'planks', floorC: '#4a2e1a', light: 'lamp', litter: [{ k: 'splash', c: '#e6b84a' }], dock: ['brush:#c8283c', 'brush:#2f7a3a', 'pot:#f4ecdc', 'sponge'], frame: 'niche', words: T('Paint this tray', 'Leaves first, then the roses, then the gold'), wave: 'sine', pitch: 1.1 }),
  cicmany: mk({ wall: 'cicwall', wallC: '#4a6a3a', floor: 'earth', floorC: '#8a6a44', litter: [{ k: 'dust', c: '#f4eee0' }], dock: ['pot:#f4eee0', 'brush:#f4eee0', 'bowl'], frame: 'case', words: T('Paint this house front', 'Frame and zigzags first, then the sun wheel'), pitch: 0.8 }),
  taptap: mk({ wall: 'taptapwall', wallC: '#ffe08a', floor: 'earth', floorC: '#b89a6a', litter: [{ k: 'splash', c: '#d6202c' }], dock: ['brush:#d6202c', 'brush:#2a9a4a', 'pot:#f6d02a', 'pot:#1c4aa8', 'sponge'], frame: 'rail', words: T('Paint this bus panel', 'Hills, sea and sun, then the big flower'), pitch: 1.2, wave: 'square' }),
  screenpaint: mk({ wall: 'scrwall', wallC: '#a8503a', floor: 'slab', floorC: '#d8d4c8', litter: [{ k: 'splash', c: '#3a78c0' }], dock: ['brush:#3a78c0', 'brush:#b8302a', 'pot:#f7f2e6', 'sponge'], frame: 'plinth', words: T('Paint this window screen', 'Sky and hills first, then the cottage'), pitch: 0.95 }),
  zalipie: mk({ wall: 'zalwall', wallC: '#f4f0e6', floor: 'earth', floorC: '#9a8458', litter: [{ k: 'splash', c: '#d02428' }], dock: ['brush:#d02428', 'brush:#2a58b8', 'pot:#f0c020', 'bowl'], frame: 'card', words: T('Paint these flowers', 'Stems and leaves first, then the blossoms'), pitch: 1.05 }),
  kroszonka: mk({ wall: 'krowall', wallC: '#e8dcc0', floor: 'planks', floorC: '#a07a48', light: 'window', litter: [{ k: 'dust', c: '#f2e8d0' }], dock: ['pick', 'bowl', 'sponge'], frame: 'plinth', words: T('Scratch this egg', 'Belts first, then the star and the dots'), wave: 'sine', pitch: 1.4 }),
};
registerSceneSet({ scenes, walls, soundMat: { hexsign: 'clay', zhostovo: 'clay', cicmany: 'clay', taptap: 'clay', screenpaint: 'clay', zalipie: 'clay', kroszonka: 'paper' } });
void rg; void rgba; void tint;

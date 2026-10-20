// shape-craft workshops for woodcraft and stone (1.9.0): a Welsh cottage with spoons on a rail, a Swahili coast doorway, a Zimbabwean
// kopje at dusk, and a Channapatna toy shop with lacquered tops on the shelf.
import { registerSceneSet } from './registry.js';
import { hash } from './geom.js';
import { tint, rgba, rrect } from './fx.js';
import { lg, rg, ell, cast, TAU } from './props.js';

const walls = {
  bkwelsh(ctx, s, r, H, t) { // rough stone cottage wall, an oak beam, a rail of love spoons, the glow of a hearth
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.08)], [1, tint(s.wallC, -0.2)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let row = 0; row < 5; row++) for (let x = r.x - (row % 2 ? 30 : 0); x < r.x + r.w; x += 56) { const w = 44 + hash(row, x | 0) * 22; ctx.fillStyle = `rgba(${150 + hash(x | 0, row) * 40 | 0},${140 + hash(row, x | 0) * 30 | 0},${125 + hash(x | 0, row + 3) * 25 | 0},0.5)`; rrect(ctx, x + 2, r.y + row * (H / 5) + 2, w, H / 5 - 4, 5); ctx.fill(); }
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H * 0.12, [[0, '#5a3a1c'], [1, '#2a1a0a']]); ctx.fillRect(r.x, r.y, r.w, H * 0.12);
    const n = Math.max(4, Math.round(r.w / 90));
    for (let k = 0; k < n; k++) { const x = r.x + (r.w * (k + 0.5)) / n, h0 = H * (0.5 + hash(k, 8) * 0.22), y0 = r.y + H * 0.2; ctx.strokeStyle = '#6a4220'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, r.y + H * 0.12); ctx.lineTo(x, y0); ctx.stroke(); ctx.fillStyle = lg(ctx, x - 6, 0, x + 6, 0, [[0, '#c89a5a'], [0.5, '#e8c488'], [1, '#8a5a28']]); rrect(ctx, x - 2.4, y0, 4.8, h0 * 0.7, 2); ctx.fill(); ell(ctx, x, y0 + h0 * 0.82, 7, 10); ctx.fill(); ctx.beginPath(); ctx.arc(x - 3, y0 - 1, 3, 0, TAU); ctx.arc(x + 3, y0 - 1, 3, 0, TAU); ctx.fill(); }
    ctx.fillStyle = rg(ctx, r.x + r.w * 0.9, r.y + H, 2, H * 1.2, [[0, 'rgba(255,170,70,0.4)'], [1, 'rgba(255,120,30,0)']]); ctx.fillRect(r.x, r.y, r.w, H);
  },
  bkswahili(ctx, s, r, H) { // coral-stone wall with a carved doorway and brass studs, a niche with a lamp
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.12)], [1, tint(s.wallC, -0.1)]]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1.5; for (let row = 1; row < 5; row++) { ctx.beginPath(); ctx.moveTo(r.x, r.y + (H * row) / 5); ctx.lineTo(r.x + r.w, r.y + (H * row) / 5); ctx.stroke(); }
    const dw = Math.min(r.w * 0.2, 120), dx = r.x + r.w * 0.2, dy = r.y + H * 0.06;
    ctx.fillStyle = '#e8dcc4'; ctx.fillRect(dx - 8, dy, dw + 16, H - H * 0.06); ctx.fillStyle = lg(ctx, dx, 0, dx + dw, 0, [[0, '#4a2a14'], [0.5, '#7a4824'], [1, '#3a1e0e']]); ctx.beginPath(); ctx.moveTo(dx, r.y + H); ctx.lineTo(dx, dy + dw * 0.35); ctx.quadraticCurveTo(dx + dw / 2, dy - dw * 0.1, dx + dw, dy + dw * 0.35); ctx.lineTo(dx + dw, r.y + H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,230,170,0.3)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(dx + dw / 2, dy + dw * 0.1); ctx.lineTo(dx + dw / 2, r.y + H); ctx.stroke(); ctx.fillStyle = '#d6b050';
    for (let q = 0; q < 4; q++) for (let c = 0; c < 2; c++) { ctx.beginPath(); ctx.arc(dx + dw * (0.25 + c * 0.5), dy + dw * 0.5 + q * H * 0.17, 3, 0, TAU); ctx.fill(); }
    const nx = r.x + r.w * 0.72, nw = Math.min(r.w * 0.12, 70); ctx.fillStyle = rg(ctx, nx, r.y + H * 0.75, 2, H * 0.7, [[0, '#8a5a30'], [1, '#2a1a10']]); ctx.beginPath(); ctx.moveTo(nx - nw / 2, r.y + H * 0.9); ctx.lineTo(nx - nw / 2, r.y + H * 0.3 + nw / 2); ctx.arc(nx, r.y + H * 0.3 + nw / 2, nw / 2, Math.PI, 0); ctx.lineTo(nx + nw / 2, r.y + H * 0.9); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffd890'; ell(ctx, nx, r.y + H * 0.7, 5, 7); ctx.fill();
  },
  bkkopje(ctx, s, r, H) { // granite boulders and a flat-topped tree at dusk
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#3a4a6a'], [0.5, '#d89a5a'], [1, '#f0c078']]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.fillStyle = 'rgba(255,230,170,0.85)'; ell(ctx, r.x + r.w * 0.78, r.y + H * 0.4, 10, 10); ctx.fill();
    const n = Math.max(3, Math.round(r.w / 140));
    for (let k = 0; k < n; k++) { const x = r.x + (r.w * (k + 0.3 + hash(k, 5) * 0.4)) / n, w = 60 + hash(k, 6) * 70, h0 = H * (0.35 + hash(k, 7) * 0.4); ctx.fillStyle = lg(ctx, x - w / 2, 0, x + w / 2, 0, [[0, '#6a5a52'], [0.4, '#8a7a70'], [1, '#2a2220']]); ctx.beginPath(); ctx.moveTo(x - w / 2, r.y + H); ctx.quadraticCurveTo(x - w * 0.55, r.y + H - h0 * 0.9, x - w * 0.1, r.y + H - h0); ctx.quadraticCurveTo(x + w * 0.5, r.y + H - h0 * 1.05, x + w / 2, r.y + H); ctx.closePath(); ctx.fill(); if (k % 2 === 0) { ctx.fillStyle = '#5a4a42'; ell(ctx, x + w * 0.05, r.y + H - h0 - 10, w * 0.28, 12); ctx.fill(); } }
    const tx = r.x + r.w * 0.12; ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(tx, r.y + H); ctx.quadraticCurveTo(tx + 3, r.y + H * 0.5, tx - 2, r.y + H * 0.3); ctx.stroke(); ctx.fillStyle = '#1a2a1a'; ell(ctx, tx, r.y + H * 0.28, 48, 14); ctx.fill();
  },
  bkisland(ctx, s, r, H) { // a Maldivian workshop open to the lagoon: sky, turquoise water, a leaning palm and a shelf of lacquered vases
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#7cc4e0'], [0.55, '#d8eef2'], [0.56, '#2aa8b0'], [1, '#14707c']]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; for (let k = 0; k < 5; k++) { const y = r.y + H * (0.62 + k * 0.07); ctx.beginPath(); ctx.moveTo(r.x, y); ctx.bezierCurveTo(r.x + r.w * 0.3, y - 3, r.x + r.w * 0.6, y + 3, r.x + r.w, y); ctx.stroke(); }
    const px = r.x + r.w * 0.82; ctx.strokeStyle = '#5a3a20'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(px - 10, r.y + H); ctx.quadraticCurveTo(px + 14, r.y + H * 0.55, px, r.y + H * 0.2); ctx.stroke();
    ctx.strokeStyle = '#1f6a34'; ctx.lineWidth = 4; for (let k = 0; k < 6; k++) { const a = -2.6 + k * 0.9; ctx.beginPath(); ctx.moveTo(px, r.y + H * 0.2); ctx.quadraticCurveTo(px + Math.cos(a) * 30, r.y + H * 0.2 + Math.sin(a) * 18 - 14, px + Math.cos(a) * 58, r.y + H * 0.2 + Math.sin(a) * 30 + 16); ctx.stroke(); }
    ctx.fillStyle = lg(ctx, 0, r.y + H * 0.84, 0, r.y + H, [[0, '#c89a5a'], [1, '#5a3818']]); ctx.fillRect(r.x, r.y + H * 0.84, r.w, H * 0.16);
    const cols = ['#b5241c', '#1c1612', '#e8b020'], n = Math.max(3, Math.round(r.w / 90));
    for (let k = 0; k < n; k++) { const x = r.x + (r.w * (k + 0.4)) / n, h0 = H * (0.2 + hash(k, 2) * 0.1), w = h0 * 0.6, base = r.y + H * 0.84; cast(ctx, x + 2, base, w * 0.5, 2.5, 0.3); ctx.beginPath(); ctx.moveTo(x - w * 0.4, base); ctx.quadraticCurveTo(x - w * 0.7, base - h0 * 0.5, x - w * 0.3, base - h0); ctx.lineTo(x + w * 0.3, base - h0); ctx.quadraticCurveTo(x + w * 0.7, base - h0 * 0.5, x + w * 0.4, base); ctx.closePath(); const c = cols[k % 3]; ctx.fillStyle = lg(ctx, x - w / 2, 0, x + w / 2, 0, [[0, tint(c, 0.25)], [0.5, c], [1, tint(c, -0.4)]]); ctx.fill(); ctx.strokeStyle = cols[(k + 2) % 3]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - w * 0.55, base - h0 * 0.5); ctx.lineTo(x + w * 0.55, base - h0 * 0.5); ctx.stroke(); }
  },
  bkchanna(ctx, s, r, H) { // shelves of lacquered tops, rattles and dolls in bright bands
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.1)], [1, tint(s.wallC, -0.2)]]); ctx.fillRect(r.x, r.y, r.w, H);
    const shelves = [r.y + H * 0.46, r.y + H * 0.92], cols = ['#d63a2a', '#f0b429', '#2f8a4a', '#2a5db8', '#7a2a86', '#e8602a'];
    shelves.forEach((sy, si) => { ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 7, [[0, '#caa062'], [1, '#5a3818']]); ctx.fillRect(r.x, sy, r.w, 7);
      const n = Math.max(5, Math.round(r.w / 46)); for (let k = 0; k < n; k++) { const x = r.x + (r.w * (k + 0.5)) / n, h0 = H * (0.26 + hash(k + si * 9, 3) * 0.12), w = h0 * 0.62, base = sy; cast(ctx, x + 2, base, w * 0.5, 2.5, 0.3);
        const kind = (k + si) % 3; ctx.beginPath(); if (kind === 0) { ctx.moveTo(x - w * 0.5, base); ctx.lineTo(x + w * 0.5, base); ctx.lineTo(x + w * 0.55, base - h0 * 0.62); ctx.lineTo(x + w * 0.08, base - h0); ctx.lineTo(x - w * 0.08, base - h0); ctx.lineTo(x - w * 0.55, base - h0 * 0.62); } else if (kind === 1) { ctx.ellipse(x, base - h0 * 0.42, w * 0.5, h0 * 0.42, 0, 0, TAU); ctx.rect(x - w * 0.1, base - h0, w * 0.2, h0 * 0.3); } else { ctx.moveTo(x - w * 0.5, base); ctx.quadraticCurveTo(x - w * 0.7, base - h0 * 0.5, x - w * 0.2, base - h0 * 0.8); ctx.lineTo(x + w * 0.2, base - h0 * 0.8); ctx.quadraticCurveTo(x + w * 0.7, base - h0 * 0.5, x + w * 0.5, base); }
        ctx.closePath(); const c = cols[(k * 2 + si) % cols.length]; ctx.fillStyle = lg(ctx, x - w / 2, 0, x + w / 2, 0, [[0, tint(c, 0.25)], [0.5, c], [1, tint(c, -0.4)]]); ctx.fill(); ctx.strokeStyle = cols[(k * 2 + si + 2) % cols.length]; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x - w * 0.5, base - h0 * 0.3); ctx.lineTo(x + w * 0.5, base - h0 * 0.3); ctx.stroke(); } });
  },
};
const T = (c, h, w) => ({ caption: c, hint: h, ...(w ?? {}) });
const scenes = {
  lovespoon: { wall: 'bkwelsh', wallC: '#8a8478', floor: 'planks', floorC: '#6a4a2a', light: 'lamp', hang: [], litter: [{ k: 'shavings', c: '#e6c898' }], dock: ['knife', 'gouge', 'mallet', 'sponge'], dockKind: 'ledge', frame: 'plinth',
    block: 'wood', seat: 'bench', tool: 'knife', cavity: 'dark', fx: { kind: 'chip', c: '#e0bc86' }, pitch: 0.85, wave: 'triangle', words: T('Carve this love spoon', 'Take the wood away outside the lit outline', { hintBlind: 'Whittle the block into the spoon' }) },
  swahili: { wall: 'bkswahili', wallC: '#d8c8a8', floor: 'slab', floorC: '#a89878', light: 'window', hang: [], litter: [{ k: 'shavings', c: '#a0683a' }], dock: ['chisel', 'mallet', 'gouge', 'pot:#d6b050', 'sponge'], dockKind: 'tray', frame: 'case',
    block: 'wood', seat: 'board', tool: 'chisel', cavity: 'dark', fx: { kind: 'chip', c: '#8a5a30' }, pitch: 0.75, wave: 'triangle', words: T('Carve this door', 'Chisel away the wood outside the lit outline', { hintBlind: 'Chisel the panels and the arch' }) },
  shona: { wall: 'bkkopje', wallC: '#a8643a', floor: 'earth', floorC: '#b08258', light: 'window', hang: [], litter: [{ k: 'dust', c: '#cfc8c0' }], dock: ['rasp', 'chisel', 'mallet', 'sponge', 'bowl'], dockKind: 'ledge', frame: 'plinth',
    block: 'soapstone', seat: 'sandbag', tool: 'rasp', cavity: 'dust', fx: { kind: 'dust', c: '#bfb8b0' }, pitch: 0.7, wave: 'triangle', words: T('Carve this family', 'Rasp the stone away outside the lit outline', { hintBlind: 'Rasp the stone into the family' }) },
  liyelaa: { wall: 'bkisland', wallC: '#2aa8b0', floor: 'planks', floorC: '#8a6038', light: 'window', hang: [], litter: [{ k: 'shavings', c: '#f0d8a0' }], dock: ['gouge', 'caliper', 'chisel', 'pot:#b5241c', 'pot:#e8b020', 'pot:#1c1612'], dockKind: 'tray', frame: 'rail',
    rig: 'woodlathe', tool: 'gouge', top: 'solid', glazeTool: 'brush', words: { caption: 'Turn and engrave this vase', shape: 'Drag across the wood to set the width of the vase', glaze: 'Tap a band to press a lac stick on the spinning wood', engrave: 'Scrape each lit mark through the top lac', win: 'A vase worth a shelf', ok: 'A good vase', retry: 'Back to the lathe' }, pitch: 1.0, wave: 'sawtooth' },
  channapatna: { wall: 'bkchanna', wallC: '#7a4a2a', floor: 'planks', floorC: '#8a6038', light: 'window', hang: [], litter: [{ k: 'shavings', c: '#f0d8a0' }], dock: ['gouge', 'caliper', 'pot:#d63a2a', 'pot:#f0b429', 'pot:#2f8a4a', 'brush:#2a5db8'], dockKind: 'tray', frame: 'rail',
    rig: 'woodlathe', tool: 'gouge', top: 'solid', glazeTool: 'brush', words: { caption: 'Turn this toy', shape: 'Drag across the wood to set the width of the toy', glaze: 'Tap a band to press lac on the spinning wood', win: 'A toy worth a shelf', ok: 'A good toy', retry: 'Back to the lathe' }, pitch: 1.1, wave: 'sawtooth' },
};
registerSceneSet({
  scenes: Object.fromEntries(Object.entries(scenes).map(([id, s]) => [id, { ...s, hang: s.hang ?? [] }])),
  walls, soundMat: { liyelaa: 'wood', lovespoon: 'wood', swahili: 'wood', shona: 'stone', channapatna: 'wood' },
});
void rgba;

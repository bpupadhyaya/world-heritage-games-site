// shape-craft pottery workshops (1.9.0, lathe): Marginea smoke-fired black pottery, Boleslawiec stamped stoneware, Deruta maiolica.
import { registerSceneSet, registerProfile } from './registry.js';
import { hash } from './geom.js';
import { tint, rgba, rrect } from './fx.js';
import { lg, rg, ell, cast, TAU } from './props.js';

registerProfile('tazza', [0.46, 0.38, 0.44, 0.7, 0.92, 1.02, 1]);   // wide shallow bowl on a foot (Deruta)
// 1.10.0 profiles for the fine vessel look (bottom to top; thrown on 12 rows and 12 steps they stay smooth)
registerProfile('jaipurvase', [0.42, 0.6, 0.78, 0.9, 0.97, 1, 0.98, 0.9, 0.72, 0.5, 0.4, 0.4, 0.5, 0.62]);   // round belly, slim neck, flared lip (Jaipur)
registerProfile('margjar', [0.46, 0.62, 0.84, 0.97, 1, 0.94, 0.78, 0.6, 0.54, 0.6, 0.72]);   // round-bellied jar with a short neck and open mouth (Marginea)
registerProfile('bolmug', [0.6, 0.72, 0.8, 0.82, 0.8, 0.74, 0.64, 0.56, 0.54, 0.6, 0.66]);   // swelling jug with a pinched neck and a lip (Boleslawiec)
registerProfile('tazzafoot', [0.5, 0.34, 0.28, 0.32, 0.6, 0.88, 1, 1]);   // foot, stem, shallow cup (Deruta tazza)

const walls = {
  potkiln(ctx, s, r, H, t) { // dark workshop wall, a row of smoke-black pots, the glow of a kiln mouth
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#0e0b0a'], [1, s.wallC]]); ctx.fillRect(r.x, r.y, r.w, H);
    const ky = r.y + H, kx = r.x + r.w * 0.82, kw = Math.min(r.w * 0.14, 80), fl = 0.85 + 0.15 * Math.sin(t * 6) * Math.sin(t * 2.3);
    ctx.fillStyle = '#2a2220'; ctx.beginPath(); ctx.moveTo(kx - kw, ky); ctx.quadraticCurveTo(kx - kw, ky - H * 0.9, kx, ky - H * 0.95); ctx.quadraticCurveTo(kx + kw, ky - H * 0.9, kx + kw, ky); ctx.closePath(); ctx.fill();
    ctx.fillStyle = rg(ctx, kx, ky - H * 0.2, 2, kw, [[0, `rgba(255,190,90,${0.95 * fl})`], [0.5, `rgba(220,80,20,${0.7 * fl})`], [1, 'rgba(60,10,0,0.9)']]); ctx.beginPath(); ctx.moveTo(kx - kw * 0.6, ky); ctx.quadraticCurveTo(kx - kw * 0.6, ky - H * 0.55, kx, ky - H * 0.6); ctx.quadraticCurveTo(kx + kw * 0.6, ky - H * 0.55, kx + kw * 0.6, ky); ctx.closePath(); ctx.fill();
    const sy = r.y + H * 0.62; ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 7, [[0, '#6a4a2a'], [1, '#2a1a0c']]); ctx.fillRect(r.x, sy, kx - kw * 1.3 - r.x, 7);
    const n = Math.max(3, Math.round((kx - kw * 1.4 - r.x) / 56)); for (let k = 0; k < n; k++) { const x = r.x + ((kx - kw * 1.4 - r.x) * (k + 0.5)) / n, h0 = H * (0.28 + hash(k, 5) * 0.1), w = h0 * 0.8; cast(ctx, x + 2, sy, w * 0.5, 2.5, 0.35); ctx.fillStyle = rg(ctx, x - w * 0.25, sy - h0 * 0.6, 1, w, [[0, '#6a6466'], [0.5, '#2a2628'], [1, '#0e0c0d']]); ctx.beginPath(); ctx.moveTo(x - w * 0.35, sy); ctx.quadraticCurveTo(x - w * 0.62, sy - h0 * 0.5, x - w * 0.22, sy - h0 * 0.85); ctx.lineTo(x + w * 0.22, sy - h0 * 0.85); ctx.quadraticCurveTo(x + w * 0.62, sy - h0 * 0.5, x + w * 0.35, sy); ctx.closePath(); ctx.fill(); }
  },
  potkitchen(ctx, s, r, H) { // white-tiled kitchen wall with a rail of stamped plates
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.1)], [1, tint(s.wallC, -0.1)]]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1.5; for (let x = r.x; x < r.x + r.w; x += 34) { ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + H); ctx.stroke(); } for (let y = r.y; y < r.y + H; y += 34) { ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke(); }
    const ry = r.y + H * 0.2; ctx.fillStyle = lg(ctx, 0, ry, 0, ry + 6, [[0, '#caa062'], [1, '#6a4524']]); ctx.fillRect(r.x, ry, r.w, 6);
    const n = Math.max(4, Math.round(r.w / 78)); for (let k = 0; k < n; k++) { const x = r.x + (r.w * (k + 0.5)) / n, pr = Math.min(26, H * 0.2), cy = ry + pr * 0.95; ctx.fillStyle = rg(ctx, x - pr * 0.3, cy - pr * 0.3, 1, pr * 1.4, [[0, '#ffffff'], [1, '#d4dadb']]); ell(ctx, x, cy, pr, pr); ctx.fill(); ctx.strokeStyle = '#1f4aa8'; ctx.lineWidth = 2; ctx.stroke(); for (let q = 0; q < 10; q++) { const a = (q / 10) * TAU; ctx.fillStyle = q % 2 ? '#1f4aa8' : '#2a8a5a'; ell(ctx, x + Math.cos(a) * pr * 0.62, cy + Math.sin(a) * pr * 0.62, 2.6, 2.6); ctx.fill(); } ctx.fillStyle = '#1f4aa8'; ell(ctx, x, cy, pr * 0.2, pr * 0.2); ctx.fill(); }
  },
  potumbria(ctx, s, r, H) { // a stone arch opening on olive hills
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.08)], [1, tint(s.wallC, -0.18)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let row = 0; row < 4; row++) for (let x = r.x - (row % 2 ? 30 : 0); x < r.x + r.w; x += 60) { ctx.strokeStyle = 'rgba(0,0,0,0.14)'; ctx.strokeRect(x, r.y + row * (H / 4), 60, H / 4); }
    const ax = r.x + r.w * 0.5, aw = Math.min(r.w * 0.34, 190), ay = r.y + H * 0.05;
    ctx.save(); ctx.beginPath(); ctx.moveTo(ax - aw / 2, r.y + H); ctx.lineTo(ax - aw / 2, ay + aw / 2); ctx.arc(ax, ay + aw / 2, aw / 2, Math.PI, 0); ctx.lineTo(ax + aw / 2, r.y + H); ctx.closePath(); ctx.clip();
    ctx.fillStyle = lg(ctx, 0, ay, 0, r.y + H, [[0, '#bcd8f0'], [0.55, '#f0e2b8'], [1, '#8aa05a']]); ctx.fillRect(ax - aw, ay, aw * 2, H);
    ctx.fillStyle = '#7a9a5a'; ctx.beginPath(); ctx.moveTo(ax - aw, r.y + H * 0.7); ctx.quadraticCurveTo(ax - aw * 0.2, r.y + H * 0.45, ax + aw * 0.2, r.y + H * 0.62); ctx.quadraticCurveTo(ax + aw * 0.5, r.y + H * 0.5, ax + aw, r.y + H * 0.66); ctx.lineTo(ax + aw, r.y + H); ctx.lineTo(ax - aw, r.y + H); ctx.fill();
    ctx.fillStyle = '#4a6a3a'; for (let k = 0; k < 7; k++) { ell(ctx, ax - aw * 0.4 + k * aw * 0.13, r.y + H * (0.74 + (k % 3) * 0.04), 7, 5); ctx.fill(); }
    ctx.restore(); ctx.strokeStyle = '#8a6a48'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(ax - aw / 2, r.y + H); ctx.lineTo(ax - aw / 2, ay + aw / 2); ctx.arc(ax, ay + aw / 2, aw / 2, Math.PI, 0); ctx.lineTo(ax + aw / 2, r.y + H); ctx.stroke();
  },
};
const T = (c) => ({ caption: c });
const scenes = {
  jaipur: { wall: 'shelf', wallC: '#e9e2d0', floor: 'tile', floorC: '#c9bfa6', light: 'window', shelf: [{ k: 'jar', c: '#2b5fb0' }, { k: 'plate', c: '#2b5fb0' }, { k: 'jar', c: '#3b8ad0' }], litter: [], dock: ['pot:#1f4aa8', 'pot:#2aa6a0', 'brush:#1f4aa8', 'sponge'], dockKind: 'ledge', frame: 'rail',
    rig: 'wheel', tool: 'rib', top: 'open', vessel: 'fine', view: 0.24, wscale: 0.62, motifs: ['leafband', 'flower', 'bird', 'vine', 'dots'], inkLight: ['#1d4cb0', '#17808f'], inkDark: '#f3efe4',
    words: { caption: 'Shape this vase', shape: 'Drag across the quartz clay to set its width', glaze: 'Tap a band to paint it in blue', win: 'A fine blue pot', ok: 'A good pot', retry: 'Back to the wheel' }, pitch: 1.0, wave: 'triangle' },
  marginea: { wall: 'potkiln', wallC: '#3a2c26', floor: 'earth', floorC: '#5a4a40', light: 'lamp', litter: [{ k: 'clay', c: '#3a3234' }], dock: ['bowl', 'sponge', 'pot:#1d1b1c', 'caliper'], dockKind: 'ledge', frame: 'niche',
    rig: 'kick', tool: 'rib', top: 'open', motif: 'none', vessel: 'fine', view: 0.22, wscale: 0.72, matt: true, inside: '#5a5558', motifs: ['burnish', 'wave', 'zigzag', 'burnish', 'wave'], inkLight: ['#2a2020'], inkDark: '#c9bfb2', words: { ...T('Throw this black pot'), shape: 'Drag across the clay to set its width', glaze: 'Tap a band to burnish it or leave it matte', win: 'A pot for the smoke kiln', ok: 'A good pot', retry: 'Back to the wheel' }, pitch: 0.8, wave: 'sine' },
  boleslawiec: { wall: 'potkitchen', wallC: '#ece6d8', floor: 'planks', floorC: '#a8825a', light: 'window', litter: [{ k: 'splash', c: '#1f4aa8' }], dock: ['bowl', 'sponge', 'pot:#1f4aa8', 'pot:#2a8a5a', 'brush:#1f4aa8'], dockKind: 'ledge', frame: 'rail',
    rig: 'wheel', tool: 'sponge', top: 'open', motif: 'dots', vessel: 'fine', view: 0.22, wscale: 0.62, handle: true, motifs: ['peacock', 'rosette', 'dots', 'peacock', 'rosette'], inkLight: ['#1f4aa8', '#2a8a5a', '#1f4aa8'], inkDark: '#f2ead8', words: { ...T('Throw and stamp this jug'), shape: 'Drag across the clay to set its width', glaze: 'Press a sponge stamp in a colour on a band', win: 'A jug for the kitchen', ok: 'A good jug', retry: 'Back to the wheel' }, pitch: 1.1, wave: 'triangle' },
  deruta: { wall: 'potumbria', wallC: '#c8a878', floor: 'tile', floorC: '#b86a40', light: 'window', litter: [{ k: 'clay', c: '#d8b890' }], dock: ['bowl', 'sponge', 'pot:#e0a830', 'pot:#2a5db8', 'brush:#2a5db8'], dockKind: 'ledge', frame: 'plinth',
    rig: 'kick', tool: 'rib', top: 'open', motif: 'petal', vessel: 'fine', view: 0.4, hscale: 0.66, roundel: true, inside: '#f3ead0', roundelInk: ['#2a5db8', '#d49a22'], motifs: ['dots', 'scale', 'flower', 'scale', 'dots'], inkLight: ['#2a5db8', '#2a7a4a', '#2a5db8'], inkDark: '#f6eed6', words: { ...T('Throw this maiolica bowl'), shape: 'Drag across the clay to set its width', glaze: 'Tap a band to paint it in maiolica colours', win: 'A bowl from the hill town', ok: 'A good bowl', retry: 'Back to the wheel' }, pitch: 0.95, wave: 'sine' },
};
registerSceneSet({
  scenes: Object.fromEntries(Object.entries(scenes).map(([id, s]) => [id, { ...s, hang: [] }])),
  walls, soundMat: { jaipur: 'clay', marginea: 'clay', boleslawiec: 'clay', deruta: 'clay' },
});

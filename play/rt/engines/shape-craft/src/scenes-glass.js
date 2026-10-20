// shape-craft 1.22.0: glassblowing workshops and profiles (lathe, `vessel: 'fine'`, `glass: {...}`; see glass.js).
//   `murano`  Venice: a stone arch with a glowing furnace mouth, a rack of coloured canes, marble floor.
//   `hebron`  Palestine: a limestone vault with a white-hot furnace, a shelf of blue and green bottles.
//   `bohemia` Bohemia: a timber workshop with a snowy forest window, a cutting wheel, a shelf of cut glasses.
import { registerSceneSet, registerProfile } from './registry.js';
import { hash } from './geom.js';
import { tint, rgba, rrect } from './fx.js';
import { lg, rg, ell, cast, TAU } from './props.js';

registerProfile('goblet', [0.66, 0.46, 0.09, 0.08, 0.09, 0.17, 0.09, 0.09, 0.46, 0.76, 0.92, 0.96, 0.94, 0.9]);          // a foot, a stem with a knop, a bowl (Venice)
registerProfile('hebronjug', [0.6, 0.76, 0.86, 0.88, 0.84, 0.76, 0.62, 0.44, 0.36, 0.34, 0.4, 0.54]);               // a squat belly, a narrow neck, a flared lip (Hebron)
registerProfile('crystalvase', [0.42, 0.52, 0.6, 0.66, 0.7, 0.7, 0.68, 0.66, 0.66, 0.7, 0.78, 0.9]);                // a heavy foot, a straight body, a flared mouth (Bohemia)

const glowMouth = (ctx, x, y, w, h, t) => { // a furnace mouth: an arched opening with a white-hot centre and flicker
  const k = 0.5 + 0.5 * Math.sin((t ?? 0) * 3.1);
  ctx.fillStyle = '#1a0f0a'; ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + h * 0.4); ctx.quadraticCurveTo(x, y, x + w / 2, y); ctx.quadraticCurveTo(x + w, y, x + w, y + h * 0.4); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = rg(ctx, x + w / 2, y + h * 0.62, 2, w * 0.7, [[0, 'rgba(255,252,220,1)'], [0.3, 'rgba(255,200,90,0.95)'], [0.65, 'rgba(240,100,20,0.8)'], [1, 'rgba(120,20,0,0.4)']]); ctx.fillRect(x, y, w, h);
  ctx.fillStyle = `rgba(255,255,230,${0.35 + 0.25 * k})`; ell(ctx, x + w / 2, y + h * 0.7, w * 0.22, h * 0.14); ctx.fill(); ctx.restore();
  ctx.fillStyle = rg(ctx, x + w / 2, y + h * 0.6, 2, w * 1.6, [[0, 'rgba(255,170,60,0.3)'], [1, 'rgba(255,120,20,0)']]); ctx.fillRect(x - w, y - h * 0.3, w * 3, h * 1.8);
};
const walls = {
  murano(ctx, s, r, H, t) { // a stone arch, the furnace, a rack of coloured canes, hanging blowpipes
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.06)], [1, tint(s.wallC, -0.3)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let row = 0; row < 5; row++) for (let x = r.x - (row % 2 ? 30 : 0); x < r.x + r.w; x += 60) { ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1.4; ctx.strokeRect(x, r.y + row * (H / 5), 60, H / 5); }
    const fx = r.x + r.w * 0.5, fw = Math.min(r.w * 0.3, H * 0.9); glowMouth(ctx, fx, r.y + H * 0.14, fw, H * 0.66, t);
    ctx.strokeStyle = '#7a6a58'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(fx, r.y + H * 0.8); ctx.lineTo(fx, r.y + H * 0.4); ctx.quadraticCurveTo(fx, r.y + H * 0.14, fx + fw / 2, r.y + H * 0.14); ctx.quadraticCurveTo(fx + fw, r.y + H * 0.14, fx + fw, r.y + H * 0.4); ctx.lineTo(fx + fw, r.y + H * 0.8); ctx.stroke();
    const rx = r.x + r.w * 0.04, rw = r.w * 0.36, ry = r.y + H * 0.1; ctx.fillStyle = '#4a2c14'; ctx.fillRect(rx, ry, rw, 7); ctx.fillRect(rx, ry + H * 0.5, rw, 7); const cols = ['#c8282a', '#2a4fc0', '#f6f2e8', '#2f8a46', '#e8c050', '#7a3a9a', '#1aa0b0'], n = Math.max(5, Math.min(14, Math.round(rw / 18)));
    for (let k = 0; k < n; k++) { const x = rx + 5 + ((rw - 10) * (k + 0.5)) / n; ctx.fillStyle = lg(ctx, x - 3, 0, x + 3, 0, [[0, tint(cols[k % 7], -0.3)], [0.4, tint(cols[k % 7], 0.3)], [1, tint(cols[k % 7], -0.4)]]); ctx.fillRect(x - 3, ry + 7, 6, H * (0.4 + 0.06 * hash(k, 3))); }
    for (let k = 0; k < 3; k++) { const x = r.x + r.w * (0.86 + 0.04 * k); ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, r.y + H * 0.1); ctx.lineTo(x - 18, r.y + H * 0.88); ctx.stroke(); ctx.fillStyle = '#4a4440'; ctx.fillRect(x - 3, r.y + H * 0.1, 6, 10); }
  },
  hebron(ctx, s, r, H, t) { // limestone vault, a white-hot furnace, a shelf of cobalt and green bottles
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.08)], [1, tint(s.wallC, -0.3)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let k = 0; k < 26; k++) { ctx.fillStyle = `rgba(90,60,30,${0.05 + 0.06 * hash(k, 3)})`; ell(ctx, r.x + r.w * hash(k, 1), r.y + H * hash(k, 2), 16 + 26 * hash(k, 4), 5 + 9 * hash(k, 5)); ctx.fill(); }
    ctx.strokeStyle = 'rgba(60,40,20,0.35)'; ctx.lineWidth = 3; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(r.x + (r.w * (k + 0.5)) / 4, r.y - H * 0.4, r.w / 7 + H * 0.5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
    const fx = r.x + r.w * 0.06, fw = Math.min(r.w * 0.26, H * 0.8); glowMouth(ctx, fx, r.y + H * 0.2, fw, H * 0.6, t);
    const sy = r.y + H * 0.78, sx0 = r.x + r.w * 0.42, sx1 = r.x + r.w * 0.98; ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 8, [[0, '#d8c8a0'], [1, '#6a5a3a']]); ctx.fillRect(sx0, sy, sx1 - sx0, 8);
    const cols = ['#2a4fc0', '#2f8a6a', '#1aa0b0', '#2a4fc0', '#b8c8c0'], n = Math.max(3, Math.min(8, Math.round((sx1 - sx0) / 36)));
    for (let k = 0; k < n; k++) { const x = sx0 + ((sx1 - sx0) * (k + 0.5)) / n, h2 = H * (0.18 + 0.07 * hash(k, 6)), c = cols[k % 5]; cast(ctx, x + 2, sy, h2 * 0.4, 2, 0.3); ctx.fillStyle = lg(ctx, x - h2 * 0.3, 0, x + h2 * 0.3, 0, [[0, rgba(tint(c, -0.4), 0.85)], [0.35, rgba(tint(c, 0.35), 0.7)], [1, rgba(tint(c, -0.4), 0.85)]]); ctx.beginPath(); ctx.moveTo(x - h2 * 0.08, sy - h2); ctx.lineTo(x - h2 * 0.08, sy - h2 * 0.62); ctx.quadraticCurveTo(x - h2 * 0.42, sy - h2 * 0.4, x - h2 * 0.3, sy); ctx.lineTo(x + h2 * 0.3, sy); ctx.quadraticCurveTo(x + h2 * 0.42, sy - h2 * 0.4, x + h2 * 0.08, sy - h2 * 0.62); ctx.lineTo(x + h2 * 0.08, sy - h2); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.stroke(); }
  },
  bohemia(ctx, s, r, H, t) { // timber workshop: a window onto snowy firs, a stone cutting wheel in its trough, a shelf of cut glasses
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.08)], [1, tint(s.wallC, -0.32)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let x = r.x; x < r.x + r.w; x += 36) { ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + H); ctx.stroke(); }
    const wx = r.x + r.w * 0.5, ww = r.w * 0.42, wy = r.y + H * 0.1, wh = H * 0.5; ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#a8c4de'], [1, '#eaf0f6']]); ctx.fillRect(wx, wy, ww, wh);
    for (let k = 0; k < 6; k++) { const x = wx + ww * (0.08 + 0.17 * k), y = wy + wh; ctx.fillStyle = '#1e3a2c'; ctx.beginPath(); ctx.moveTo(x, y - wh * (0.46 + 0.1 * hash(k, 3))); ctx.lineTo(x + ww * 0.07, y); ctx.lineTo(x - ww * 0.07, y); ctx.fill(); ctx.fillStyle = 'rgba(240,248,255,0.9)'; ctx.beginPath(); ctx.moveTo(x, y - wh * (0.46 + 0.1 * hash(k, 3))); ctx.lineTo(x + ww * 0.035, y - wh * 0.28); ctx.lineTo(x - ww * 0.035, y - wh * 0.28); ctx.fill(); }
    ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 6; ctx.strokeRect(wx, wy, ww, wh); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.stroke();
    const cx2 = r.x + r.w * 0.2, cy2 = r.y + H * 0.58, cr = Math.min(H * 0.22, r.w * 0.12); ctx.fillStyle = '#2a4a5a'; rrect(ctx, cx2 - cr * 1.3, cy2 + cr * 0.7, cr * 2.6, cr * 0.5, 6); ctx.fill(); ctx.fillStyle = rg(ctx, cx2 - cr * 0.3, cy2 - cr * 0.3, 2, cr * 1.2, [[0, '#d8d4cc'], [1, '#7a766e']]); ell(ctx, cx2, cy2, cr, cr); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.arc(cx2, cy2, cr * 0.25, 0, TAU); ctx.stroke();
    const sy = r.y + H * 0.84, sx0 = r.x + r.w * 0.04, sx1 = r.x + r.w * 0.4; ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 7, [[0, '#a8744a'], [1, '#3a2412']]); ctx.fillRect(sx0, sy, sx1 - sx0, 7); const n = Math.max(2, Math.min(5, Math.round((sx1 - sx0) / 30)));
    for (let k = 0; k < n; k++) { const x = sx0 + ((sx1 - sx0) * (k + 0.5)) / n, h2 = H * 0.15; ctx.fillStyle = lg(ctx, x - h2 * 0.3, 0, x + h2 * 0.3, 0, [[0, 'rgba(190,225,240,0.8)'], [0.4, 'rgba(250,255,255,0.7)'], [1, 'rgba(150,200,220,0.8)']]); ctx.beginPath(); ctx.moveTo(x - h2 * 0.32, sy - h2); ctx.lineTo(x + h2 * 0.32, sy - h2); ctx.lineTo(x + h2 * 0.24, sy - h2 * 0.3); ctx.lineTo(x + h2 * 0.04, sy - h2 * 0.1); ctx.lineTo(x + h2 * 0.04, sy); ctx.lineTo(x - h2 * 0.04, sy); ctx.lineTo(x - h2 * 0.04, sy - h2 * 0.1); ctx.lineTo(x - h2 * 0.24, sy - h2 * 0.3); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.stroke(); }
  },
};

const T = (c, shape, glaze, win, ok) => ({ caption: c, shape, glaze, win, ok, retry: 'Back to the bench' });
const scenes = {
  murano: { wall: 'murano', wallC: '#8a7a68', floor: 'slab', floorC: '#b8b0a0', light: 'lamp', litter: [{ k: 'dust', c: '#f0e8d8' }], dock: ['tongs', 'caliper', 'pot:#2a4fc0', 'pot:#7a3a9a', 'pot:#f6f2e8'], dockKind: 'tray', frame: 'niche',
    rig: 'stand', standC: '#4a4e56', standW: 0.8, tool: 'caliper', top: 'open', vessel: 'fine', view: 0.22, wscale: 1, aspect: 0.42, hscale: 0.82, still: false,
    glass: { twist: { n: 7, turns: 2.4, color: '#f6f2e8', from: 0.42, to: 0.98, w: 2.4 }, heavy: 0.05, rimGold: true, bubbles: 3 },
    words: T('Blow and colour this goblet', 'Drag across the glass to set the width of the goblet', 'Tap a band to dip it in coloured glass', 'A goblet for the table', 'A good goblet'), pitch: 1.5, wave: 'sine' },
  hebron: { wall: 'hebron', wallC: '#b8a888', floor: 'slab', floorC: '#8a7a68', light: 'lamp', litter: [{ k: 'dust', c: '#e8dcc0' }], dock: ['tongs', 'caliper', 'pot:#2a4fc0', 'pot:#2f8a6a', 'pot:#d8a030'], dockKind: 'ledge', frame: 'plinth',
    rig: 'stand', standC: '#5a5448', standW: 0.85, tool: 'caliper', top: 'open', vessel: 'fine', view: 0.22, wscale: 1, aspect: 0.62, hscale: 0.74, handle: true, still: false,
    glass: { tint: '#cfe6e0', heavy: 0.08, bubbles: 22 },
    words: T('Blow and colour this jug', 'Drag across the glass to set the width of the jug', 'Tap a band to dip it in coloured glass', 'A jug with a handle', 'A good jug'), pitch: 1.0, wave: 'triangle' },
  bohemia: { wall: 'bohemia', wallC: '#6a4a2e', floor: 'planks', floorC: '#7a5a3a', light: 'window', litter: [{ k: 'dust', c: '#eef4f8' }], dock: ['tongs', 'caliper', 'pot:#b01e2e', 'pot:#2a4fc0', 'pot:#d8eef2'], dockKind: 'tray', frame: 'rail',
    rig: 'stand', standC: '#5a4a38', standW: 0.85, tool: 'caliper', top: 'open', vessel: 'fine', view: 0.22, wscale: 1, aspect: 0.62, hscale: 0.78, still: false,
    glass: { tint: '#d8eef4', flutes: 14, flutesFrom: 0.2, flutesTo: 0.9, diamond: { n: 9, turns: 1.4, from: 0.3, to: 0.85 }, heavy: 0.1, rimGold: true },
    words: T('Blow and cut this vase', 'Drag across the crystal to set the width of the vase', 'Tap a band to flash it with colour', 'A cut crystal vase', 'A good vase'), pitch: 1.2, wave: 'triangle' },
};
registerSceneSet({
  scenes: Object.fromEntries(Object.entries(scenes).map(([id, s]) => [id, { ...s, hang: [] }])),
  rules: [['murano', /venetian|murano|goblet/i], ['hebron', /hebron|damascene/i], ['bohemia', /bohemian|crystal/i]],
  walls, floorKinds: {}, floorEx: {}, litter: {}, frames: {},
  soundMat: { murano: 'stone', hebron: 'stone', bohemia: 'wood' },
});

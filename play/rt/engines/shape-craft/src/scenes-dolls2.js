// shape-craft 1.19.0: workshops and profiles for three more folk dolls (see doll2.js): `izba` (Vanka-vstanka, Russia), `kimekomi` (Edo kimekomi, Japan), `tumbler` (Budaoweng, China).
// Each workshop has its own wall, floor, light and shelf of finished dolls of its own tradition. Pure canvas 2D, deterministic.
import { registerSceneSet, registerProfile } from './registry.js';
import { hash } from './geom.js';
import { tint, rgba } from './fx.js';
import { lg, rg, ell, cast, TAU } from './props.js';

registerProfile('vanka', [0.5, 0.76, 0.88, 0.88, 0.82, 0.74, 0.64, 0.54, 0.44, 0.38, 0.64, 0.68, 0.48, 0.2]);                // round-bottomed cone, a ruff, a round head and a pointed cap
registerProfile('kimekomi', [0.62, 0.66, 0.68, 0.68, 0.66, 0.62, 0.56, 0.5, 0.46, 0.43, 0.4, 0.34, 0.6, 0.74, 0.66]);          // a seated kimono: wide hem, narrow sash, sloping shoulders, a neck, a round head
registerProfile('budao', [0.42, 0.7, 0.88, 0.96, 0.96, 0.9, 0.8, 0.7, 0.6, 0.5, 0.46, 0.62, 0.66, 0.6]);                  // a pear-shaped tumbler with a head and a cap

const body = (ctx, x, y, w, h, c) => { ctx.fillStyle = lg(ctx, x - w, 0, x + w, 0, [[0, tint(c, -0.5)], [0.3, tint(c, 0.22)], [1, tint(c, -0.55)]]); };
function miniVanka(ctx, x, y, h, coat, cap) {
  const w = h * 0.3; cast(ctx, x + h * 0.04, y, w * 1.2, h * 0.05, 0.35);
  ctx.beginPath(); ctx.moveTo(x - w * 0.5, y); ctx.bezierCurveTo(x - w * 1.25, y - h * 0.1, x - w * 0.9, y - h * 0.5, x - w * 0.34, y - h * 0.62); ctx.lineTo(x + w * 0.34, y - h * 0.62); ctx.bezierCurveTo(x + w * 0.9, y - h * 0.5, x + w * 1.25, y - h * 0.1, x + w * 0.5, y); ctx.closePath(); body(ctx, x, y, w, h, coat); ctx.fill();
  ctx.fillStyle = '#faf4e8'; for (let k = 0; k < 6; k++) { ell(ctx, x + (hash(k, 3) - 0.5) * w * 1.2, y - h * (0.14 + 0.36 * hash(k, 4)), h * 0.022, h * 0.022); ctx.fill(); }
  ctx.fillStyle = '#faf4e8'; ell(ctx, x, y - h * 0.62, w * 0.5, h * 0.05); ctx.fill();
  const hy = y - h * 0.76; ctx.fillStyle = '#f9e2c6'; ell(ctx, x, hy, w * 0.46, w * 0.46); ctx.fill(); ctx.fillStyle = '#d83a30'; ell(ctx, x, hy + w * 0.06, w * 0.07, w * 0.07); ctx.fill();
  ctx.fillStyle = cap; ctx.beginPath(); ctx.moveTo(x - w * 0.5, hy - w * 0.1); ctx.quadraticCurveTo(x, hy - w * 0.25, x + w * 0.5, hy - w * 0.1); ctx.lineTo(x + w * 0.05, y - h); ctx.closePath(); ctx.fill();
}
function miniKime(ctx, x, y, h, cloth, obi) {
  const w = h * 0.26; cast(ctx, x + h * 0.04, y, w * 1.2, h * 0.04, 0.35);
  ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x - w * 0.55, y - h * 0.6); ctx.lineTo(x + w * 0.55, y - h * 0.6); ctx.lineTo(x + w, y); ctx.closePath(); body(ctx, x, y, w, h, cloth); ctx.fill();
  ctx.fillStyle = obi; ctx.fillRect(x - w * 0.72, y - h * 0.36, w * 1.44, h * 0.13); ctx.strokeStyle = 'rgba(20,10,4,0.7)'; ctx.lineWidth = 1; ctx.strokeRect(x - w * 0.72, y - h * 0.36, w * 1.44, h * 0.13);
  const hy = y - h * 0.74; ctx.fillStyle = '#faf2e6'; ell(ctx, x, hy, w * 0.46, w * 0.5); ctx.fill(); ctx.fillStyle = '#14100f'; ctx.beginPath(); ctx.arc(x, hy - w * 0.04, w * 0.5, Math.PI, 0); ctx.fill();
}
function miniBudao(ctx, x, y, h, robe) {
  const w = h * 0.3; cast(ctx, x + h * 0.04, y, w * 1.2, h * 0.05, 0.35);
  ctx.beginPath(); ctx.moveTo(x - w * 0.55, y); ctx.bezierCurveTo(x - w * 1.3, y - h * 0.2, x - w * 0.9, y - h * 0.55, x - w * 0.4, y - h * 0.62); ctx.lineTo(x + w * 0.4, y - h * 0.62); ctx.bezierCurveTo(x + w * 0.9, y - h * 0.55, x + w * 1.3, y - h * 0.2, x + w * 0.55, y); ctx.closePath(); body(ctx, x, y, w, h, robe); ctx.fill();
  ctx.fillStyle = '#bd2a24'; ell(ctx, x, y - h * 0.38, w * 0.3, w * 0.3); ctx.fill();
  const hy = y - h * 0.76; ctx.fillStyle = '#f8e2c4'; ell(ctx, x, hy, w * 0.44, w * 0.44); ctx.fill(); ctx.fillStyle = '#15110f'; ctx.fillRect(x - w * 0.46, hy - w * 0.62, w * 0.92, w * 0.48); ctx.fillStyle = '#e6b830'; ctx.fillRect(x - w * 0.46, hy - w * 0.26, w * 0.92, w * 0.08);
  ctx.strokeStyle = '#f2eee6'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, hy + w * 0.2); ctx.lineTo(x, hy + w * 0.7); ctx.stroke();
}

const walls = {
  izba(ctx, s, r, H, t) { // Russia: a log wall of a village house, a window with painted blue shutters and carved white trim, a shelf of painted tumblers, wooden spoons on pegs
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.1)], [1, tint(s.wallC, -0.3)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let y = r.y, k = 0; y < r.y + H; y += 26, k++) { ctx.fillStyle = lg(ctx, 0, y, 0, y + 26, [[0, tint(s.wallC, 0.14)], [0.55, tint(s.wallC, -0.02)], [1, tint(s.wallC, -0.4)]]); ctx.fillRect(r.x, y, r.w, 25); ctx.strokeStyle = 'rgba(30,14,4,0.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(r.x, y + 25.5); ctx.lineTo(r.x + r.w, y + 25.5); ctx.stroke(); for (let q = 0; q < 6; q++) { ctx.strokeStyle = 'rgba(60,30,10,0.16)'; ctx.beginPath(); const gx = r.x + r.w * hash(k * 7 + q, 2); ctx.moveTo(gx, y + 4 + 16 * hash(q, k)); ctx.lineTo(gx + 40 + 60 * hash(q, 5), y + 6 + 14 * hash(k, q)); ctx.stroke(); } }
    const wx = r.x + r.w * 0.56, ww = r.w * 0.34, wy = r.y + H * 0.1, wh = H * 0.52;
    ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#8ab4de'], [1, '#e4eef6']]); ctx.fillRect(wx, wy, ww, wh); ctx.fillStyle = '#f2f6fa'; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + wh * 0.7); ctx.quadraticCurveTo(wx + ww * 0.3, wy + wh * 0.58, wx + ww * 0.55, wy + wh * 0.72); ctx.quadraticCurveTo(wx + ww * 0.8, wy + wh * 0.6, wx + ww, wy + wh * 0.7); ctx.lineTo(wx + ww, wy + wh); ctx.fill();
    ctx.fillStyle = '#244a2c'; for (let k = 0; k < 4; k++) { const x = wx + ww * (0.12 + 0.24 * k), y = wy + wh; ctx.beginPath(); ctx.moveTo(x, y - wh * 0.42); ctx.lineTo(x + ww * 0.07, y); ctx.lineTo(x - ww * 0.07, y); ctx.fill(); }
    ctx.strokeStyle = '#f2ece0'; ctx.lineWidth = 6; ctx.strokeRect(wx, wy, ww, wh); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.stroke();
    for (const sx of [-1, 1]) { const px = sx < 0 ? wx - ww * 0.2 : wx + ww; ctx.fillStyle = lg(ctx, px, 0, px + ww * 0.2, 0, [[0, '#1f56b4'], [1, '#143a82']]); ctx.fillRect(px, wy - 4, ww * 0.2, wh + 8); ctx.fillStyle = '#e8c040'; for (let q = 0; q < 3; q++) { ell(ctx, px + ww * 0.1, wy + wh * (0.2 + 0.3 * q), ww * 0.05, ww * 0.05); ctx.fill(); } ctx.strokeStyle = '#0c2458'; ctx.lineWidth = 1.5; ctx.strokeRect(px, wy - 4, ww * 0.2, wh + 8); }
    ctx.fillStyle = '#f2ece0'; for (let q = 0; q < 14; q++) { const x = wx - ww * 0.2 + ((ww * 1.4) * (q + 0.5)) / 14; ctx.beginPath(); ctx.moveTo(x - 4, wy - 4); ctx.lineTo(x + 4, wy - 4); ctx.lineTo(x, wy + 8); ctx.fill(); }
    const sx0 = r.x + r.w * 0.04, sx1 = r.x + r.w * 0.5, sy = r.y + H * 0.7; ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 8, [[0, '#d8a860'], [1, '#4a2c12']]); ctx.fillRect(sx0 - 5, sy, sx1 - sx0 + 10, 8);
    const n = Math.max(3, Math.min(7, Math.round((sx1 - sx0) / 34))), coat = ['#c8282c', '#e0a820', '#2a7a4a', '#c8282c', '#7a3a8a'], cap = ['#2457b0', '#c8282c', '#2457b0', '#f0c23a', '#2457b0'];
    for (let k = 0; k < n; k++) miniVanka(ctx, sx0 + ((sx1 - sx0) * (k + 0.5)) / n, sy, H * (0.36 + 0.05 * hash(k, 8)), coat[k % 5], cap[k % 5]);
    for (let k = 0; k < 4; k++) { const x = r.x + r.w * (0.1 + 0.11 * k), y = r.y + H * 0.1; ctx.fillStyle = '#c8a050'; ell(ctx, x, y + 3, 3, 3); ctx.fill(); ctx.save(); ctx.translate(x, y + 6); ctx.fillStyle = k % 2 ? '#c8282c' : '#e8c040'; ctx.beginPath(); ctx.ellipse(0, 16, 7, 11, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#7a4a22'; ctx.fillRect(-2, 24, 4, 16); ctx.restore(); }
  },
  kimekomi(ctx, s, r, H, t) { // Tokyo: pale plaster, a paper window with a lattice, rolls of patterned cloth in a rack, a shelf of finished dolls
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.06)], [1, tint(s.wallC, -0.2)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let k = 0; k < 26; k++) { ctx.fillStyle = `rgba(80,60,40,${0.03 + 0.04 * hash(k, 3)})`; ell(ctx, r.x + r.w * hash(k, 1), r.y + H * hash(k, 2), 12 + 26 * hash(k, 4), 4 + 8 * hash(k, 5)); ctx.fill(); }
    const wx = r.x + r.w * 0.58, ww = r.w * 0.34, wy = r.y + H * 0.1, wh = H * 0.5; ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#fffaec'], [1, '#efe3c6']]); ctx.fillRect(wx, wy, ww, wh); ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 4; ctx.strokeRect(wx, wy, ww, wh); ctx.lineWidth = 2; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(wx + (ww * k) / 4, wy); ctx.lineTo(wx + (ww * k) / 4, wy + wh); ctx.stroke(); } for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(wx, wy + (wh * k) / 5); ctx.lineTo(wx + ww, wy + (wh * k) / 5); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,214,140,0.16)'; ell(ctx, wx + ww / 2, wy + wh * 0.5, ww * 0.8, wh * 0.7); ctx.fill();
    // cloth rack: a pole with strips of patterned cloth hanging
    const px = r.x + r.w * 0.04, pw = r.w * 0.46, py = r.y + H * 0.08; ctx.fillStyle = '#5a3a1e'; ctx.fillRect(px, py, pw, 6); const n = Math.max(4, Math.min(9, Math.round(pw / 36))), cols = [['#b3232f', '#f0d8d4'], ['#25396e', '#e8e4d4'], ['#d9a838', '#7a2a1a'], ['#2f6a56', '#f0e8d0'], ['#7a3a6a', '#f0d0e0']];
    for (let k = 0; k < n; k++) { const x = px + 4 + ((pw - 8) * k) / n, cw = (pw - 8) / n - 4, ch = H * (0.3 + 0.07 * hash(k, 6)), c = cols[k % 5]; ctx.fillStyle = lg(ctx, x, 0, x + cw, 0, [[0, tint(c[0], -0.2)], [0.5, tint(c[0], 0.12)], [1, tint(c[0], -0.3)]]); ctx.fillRect(x, py + 6, cw, ch); ctx.fillStyle = c[1]; for (let q = 0; q < 4; q++) for (let p = 0; p < 2; p++) { ell(ctx, x + cw * (0.28 + 0.44 * p), py + 6 + ch * (0.16 + 0.22 * q + (p ? 0.08 : 0)), cw * 0.12, cw * 0.12); ctx.fill(); } }
    const sx0 = r.x + r.w * 0.04, sx1 = r.x + r.w * 0.52, sy = r.y + H * 0.82; ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 7, [[0, '#c89a62'], [1, '#4a2c16']]); ctx.fillRect(sx0 - 4, sy, sx1 - sx0 + 8, 7);
    const nn = Math.max(3, Math.min(6, Math.round((sx1 - sx0) / 30))), kc = ['#b3232f', '#25396e', '#2f6a56', '#7a3a6a', '#d9a838'], oc = ['#d9a838', '#f0e8d0', '#b3232f', '#d9a838', '#25396e'];
    for (let k = 0; k < nn; k++) miniKime(ctx, sx0 + ((sx1 - sx0) * (k + 0.5)) / nn, sy, H * (0.28 + 0.04 * hash(k, 8)), kc[k % 5], oc[k % 5]);
  },
  tumbler(ctx, s, r, H, t) { // China: dark red lacquered boards, a lattice window with paper, two red lanterns, a table of tumblers
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.08)], [1, tint(s.wallC, -0.3)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let x = r.x; x < r.x + r.w; x += 30) { ctx.strokeStyle = 'rgba(0,0,0,0.32)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + H); ctx.stroke(); }
    const wx = r.x + r.w * 0.5, ww = r.w * 0.4, wy = r.y + H * 0.1, wh = H * 0.5; ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#fff4d2'], [1, '#ecd9a4']]); ctx.fillRect(wx, wy, ww, wh);
    ctx.strokeStyle = '#2a0f0c'; ctx.lineWidth = 3; const m = 6; for (let k = 0; k <= m; k++) { ctx.beginPath(); ctx.moveTo(wx + (ww * k) / m, wy); ctx.lineTo(wx + (ww * k) / m, wy + wh); ctx.moveTo(wx, wy + (wh * k) / m); ctx.lineTo(wx + ww, wy + (wh * k) / m); ctx.stroke(); }
    ctx.strokeStyle = '#2a0f0c'; ctx.lineWidth = 6; ctx.strokeRect(wx, wy, ww, wh); ctx.strokeStyle = '#d8a030'; ctx.lineWidth = 1.5; ctx.strokeRect(wx + 5, wy + 5, ww - 10, wh - 10);
    for (let k = 0; k < 2; k++) { const lx = r.x + r.w * (0.14 + 0.2 * k), ly = r.y + H * 0.3; ctx.strokeStyle = '#2a0f0c'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(lx, r.y); ctx.lineTo(lx, ly - 24); ctx.stroke(); ctx.fillStyle = rg(ctx, lx, ly, 2, 40, [[0, '#ffd890'], [0.5, '#e8402a'], [1, '#8a1410']]); ell(ctx, lx, ly, 22, 28); ctx.fill(); ctx.strokeStyle = '#6a1008'; ctx.lineWidth = 1.2; for (let q = -2; q <= 2; q++) { ctx.beginPath(); ctx.ellipse(lx, ly, 22, Math.abs(q) * 8 + 4, 0, 0, TAU); ctx.stroke(); } ctx.fillStyle = '#e8b030'; ctx.fillRect(lx - 10, ly - 30, 20, 6); ctx.fillRect(lx - 10, ly + 24, 20, 6); ctx.strokeStyle = '#e8b030'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(lx, ly + 30); ctx.lineTo(lx, ly + 52); ctx.stroke(); }
    const sx0 = r.x + r.w * 0.04, sx1 = r.x + r.w * 0.46, sy = r.y + H * 0.84; ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 8, [[0, '#7a1a14'], [1, '#2a0806']]); ctx.fillRect(sx0 - 5, sy, sx1 - sx0 + 10, 8); ctx.fillStyle = '#e8b030'; ctx.fillRect(sx0 - 5, sy, sx1 - sx0 + 10, 2);
    const n = Math.max(3, Math.min(6, Math.round((sx1 - sx0) / 32))), rb = ['#e6b830', '#2a6aa0', '#e6b830', '#2f8a66', '#c8402a'];
    for (let k = 0; k < n; k++) miniBudao(ctx, sx0 + ((sx1 - sx0) * (k + 0.5)) / n, sy, H * (0.3 + 0.04 * hash(k, 8)), rb[k % 5]);
  },
};

const T = (c, shape, glaze, touch, win, ok, btn = 'Paint face') => ({ caption: c, shape, glaze, touch, touchBtn: btn, win, ok, retry: 'Back to the lathe' });
const scenes = {
  izba: { wall: 'izba', wallC: '#a8743c', floor: 'planks', floorC: '#8a5a30', light: 'window', litter: [{ k: 'shavings', c: '#f2dcae' }], dock: ['gouge', 'caliper', 'brush:#c8282c', 'pot:#c8282c', 'pot:#2457b0', 'pot:#f0c23a'], dockKind: 'tray', frame: 'niche',
    rig: 'stand', standC: '#6a3c1c', tool: 'gouge', top: 'solid', vessel: 'fine', view: 0.1, wscale: 1, aspect: 0.58, hscale: 0.76, dome: 0.5, still: true, grain: false, deco: 'vanka', headAt: 0.2, headK: 0.82, matt: false, sheen: 0.4,
    words: T('Turn and paint this tumbler', 'Drag across the wood to set the width of the doll', 'Tap a band to paint it', 'Tap each glowing mark to paint the face', 'A tumbler that always stands up again', 'A good tumbler'), pitch: 1.15, wave: 'triangle' },
  kimekomi: { wall: 'kimekomi', wallC: '#d8c8a8', floor: 'planks', floorC: '#9a7a54', light: 'window', litter: [{ k: 'scraps', c: '#f2e6d0' }], dock: ['knife', 'caliper', 'brush:#14100f', 'pot:#b3232f', 'pot:#d9a838', 'pot:#25396e'], dockKind: 'tray', frame: 'rail',
    rig: 'stand', standC: '#5a3a22', tool: 'knife', top: 'solid', vessel: 'fine', view: 0.1, wscale: 1, aspect: 0.5, hscale: 0.78, dome: 0.9, still: true, grain: true, deco: 'kimekomi', headAt: 0.04, matt: false, sheen: 0.3,
    words: T('Carve and dress this doll', 'Drag across the wood to set the width of the doll', 'Tap a band to tuck in its cloth', 'Tap each glowing mark to paint the face', 'A doll dressed in tucked-in cloth', 'A good doll'), pitch: 0.9, wave: 'sine' },
  tumbler: { wall: 'tumbler', wallC: '#7a1c16', floor: 'planks', floorC: '#4a2a18', light: 'lamp', litter: [{ k: 'scraps', c: '#f0e6d0' }], dock: ['brush:#14100e', 'pot:#14100e', 'pot:#e6b830', 'pot:#2a6aa0', 'pot:#bd2a24', 'paper'], dockKind: 'tray', frame: 'rail',
    rig: 'stand', standC: '#2a1a12', tool: 'sponge', top: 'solid', vessel: 'fine', view: 0.1, wscale: 1, aspect: 0.58, hscale: 0.74, dome: 0.3, still: true, grain: false, deco: 'budao', headAt: 0.22, headK: 0.7, matt: false, sheen: 0.5,
    words: T('Mould and paint this tumbler', 'Drag across the clay to set its width', 'Tap a band to paint it', 'Tap each glowing mark to paint the face', 'An old man who will not fall', 'A good tumbler'), pitch: 0.85, wave: 'sine' },
};
registerSceneSet({
  scenes: Object.fromEntries(Object.entries(scenes).map(([id, s]) => [id, { ...s, hang: [] }])),
  rules: [['izba', /vanka|roly|tumbler doll/i], ['kimekomi', /kimekomi/i], ['tumbler', /budaoweng/i]],
  walls, floorKinds: {}, floorEx: {}, litter: {}, frames: {},
  soundMat: { izba: 'wood', kimekomi: 'wood', tumbler: 'clay' },
});

// shape-craft workshops for tile painting (1.9.0): Lisbon, Iznik, Puebla and Delft each get their own room, floor and supplies.
// The paint technique draws the panel itself (surface kind `tiles`); these scenes are what stands around it.
import { registerSceneSet, registerProp } from './registry.js';
import { hash } from './geom.js';
import { tint, rgba, rrect } from './fx.js';
import { lg, rg, ell, cast, TAU } from './props.js';

const walls = {
  tilelisbon(ctx, s, r, H) { // lime-washed wall, green shutters, a blue and white dado of small tiles
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.12)], [1, tint(s.wallC, -0.1)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (const fx of [0.06, 0.94]) { const w = Math.min(r.w * 0.1, 60), x = r.x + r.w * fx - (fx > 0.5 ? w : 0); ctx.fillStyle = '#2d6a4a'; ctx.fillRect(x, r.y + H * 0.06, w, H * 0.7); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.4; for (let k = 1; k < 8; k++) { ctx.beginPath(); ctx.moveTo(x, r.y + H * 0.06 + (H * 0.7 * k) / 8); ctx.lineTo(x + w, r.y + H * 0.06 + (H * 0.7 * k) / 8 - 3); ctx.stroke(); } ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(x + 2, r.y + H * 0.06 + 2, w - 4, H * 0.7 - 4); }
    const dy = r.y + H * 0.78, th = H * 0.22, n = Math.round(r.w / th);
    for (let k = 0; k < n; k++) { const x = r.x + k * (r.w / n), w = r.w / n; ctx.fillStyle = '#f6f3ea'; ctx.fillRect(x, dy, w, th); ctx.strokeStyle = '#1b479a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x + w / 2, dy + th / 2, th * 0.3, 0, TAU); ctx.moveTo(x + w / 2 - th * 0.3, dy + th / 2); ctx.lineTo(x + w / 2 + th * 0.3, dy + th / 2); ctx.moveTo(x + w / 2, dy + th * 0.2); ctx.lineTo(x + w / 2, dy + th * 0.8); ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.strokeRect(x, dy, w, th); }
  },
  tileistanbul(ctx, s, r, H, t) { // deep teal wall, a row of pointed niches edged in gold, a hanging lamp
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, -0.25)], [1, s.wallC]]); ctx.fillRect(r.x, r.y, r.w, H);
    const n = Math.max(3, Math.round(r.w / 120)), w = r.w / n;
    for (let k = 0; k < n; k++) { const x = r.x + k * w + w * 0.15, ww = w * 0.7, y0 = r.y + H * 0.94, yp = r.y + H * 0.12; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, yp + ww * 0.55); ctx.quadraticCurveTo(x + ww * 0.12, yp + ww * 0.2, x + ww / 2, yp); ctx.quadraticCurveTo(x + ww * 0.88, yp + ww * 0.2, x + ww, yp + ww * 0.55); ctx.lineTo(x + ww, y0); ctx.closePath(); ctx.fillStyle = rg(ctx, x + ww / 2, y0, 2, H, [[0, 'rgba(255,200,120,0.5)'], [1, 'rgba(10,20,30,0.85)']]); ctx.fill(); ctx.strokeStyle = '#d9b050'; ctx.lineWidth = 2.4; ctx.stroke(); }
    const lx = r.x + r.w * 0.5, ly = r.y + H * 0.2, sw = Math.sin(t * 0.9) * 2; ctx.strokeStyle = '#8a6a30'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(lx, r.y); ctx.lineTo(lx + sw, ly); ctx.stroke();
    ctx.fillStyle = lg(ctx, lx - 14, 0, lx + 14, 0, [[0, '#7a5a20'], [0.4, '#f0cf70'], [1, '#6a4a14']]); ctx.beginPath(); ctx.moveTo(lx + sw - 5, ly); ctx.lineTo(lx + sw + 5, ly); ctx.lineTo(lx + sw + 16, ly + H * 0.26); ctx.quadraticCurveTo(lx + sw, ly + H * 0.36, lx + sw - 16, ly + H * 0.26); ctx.closePath(); ctx.fill();
    ctx.fillStyle = rg(ctx, lx + sw, ly + H * 0.26, 1, 18, [[0, 'rgba(255,240,170,0.95)'], [1, 'rgba(255,200,90,0)']]); ell(ctx, lx + sw, ly + H * 0.26, 18, 18); ctx.fill();
  },
  tilepuebla(ctx, s, r, H) { // sun-yellow wall under a terracotta roof tile eave, a cobalt band, hanging pots
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.1)], [1, tint(s.wallC, -0.12)]]); ctx.fillRect(r.x, r.y, r.w, H);
    const n = Math.round(r.w / 26); for (let k = 0; k < n; k++) { const x = r.x + k * (r.w / n), w = r.w / n; ctx.fillStyle = lg(ctx, x, 0, x + w, 0, [[0, '#d27a50'], [0.5, '#b04a28'], [1, '#7a2e16']]); ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x + w, r.y); ctx.lineTo(x + w * 0.9, r.y + H * 0.16); ctx.quadraticCurveTo(x + w / 2, r.y + H * 0.24, x + w * 0.1, r.y + H * 0.16); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#1c46a8'; ctx.fillRect(r.x, r.y + H * 0.7, r.w, H * 0.09); ctx.fillStyle = '#f1b81f'; for (let x = r.x + 10; x < r.x + r.w; x += 24) { ctx.beginPath(); ctx.arc(x, r.y + H * 0.745, 3, 0, TAU); ctx.fill(); }
    const pots = [['#e2692a', 0.12], ['#2f8a4a', 0.88], ['#f1b81f', 0.2], ['#1c46a8', 0.8]]; pots.forEach(([c, f], i) => { const x = r.x + r.w * f, y = r.y + H * (0.34 + (i % 2) * 0.12), pr = Math.min(16, H * 0.12); ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, r.y + H * 0.2); ctx.lineTo(x, y - pr); ctx.stroke(); ctx.fillStyle = rg(ctx, x - pr * 0.3, y - pr * 0.3, 1, pr * 1.3, [[0, tint(c, 0.35)], [1, tint(c, -0.4)]]); ell(ctx, x, y, pr, pr * 0.95); ctx.fill(); ctx.fillStyle = '#3a2210'; ell(ctx, x, y - pr * 0.8, pr * 0.6, pr * 0.18); ctx.fill(); });
  },
  tiledelft(ctx, s, r, H) { // whitewashed wall, a mullioned window with canal light, a rail of plates
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.1)], [1, tint(s.wallC, -0.12)]]); ctx.fillRect(r.x, r.y, r.w, H);
    const ww = Math.min(r.w * 0.2, 130), wx = r.x + r.w * 0.5 - ww / 2, wy = r.y + H * 0.08, wh = H * 0.78;
    ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#f4f8ff'], [1, '#a8c4de']]); ctx.fillRect(wx, wy, ww, wh); ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 5; ctx.strokeRect(wx, wy, ww, wh); ctx.lineWidth = 2.4; ctx.beginPath(); for (let k = 1; k < 3; k++) { ctx.moveTo(wx + (ww * k) / 3, wy); ctx.lineTo(wx + (ww * k) / 3, wy + wh); } for (let k = 1; k < 4; k++) { ctx.moveTo(wx, wy + (wh * k) / 4); ctx.lineTo(wx + ww, wy + (wh * k) / 4); } ctx.stroke();
    const ry = r.y + H * 0.78; ctx.fillStyle = lg(ctx, 0, ry, 0, ry + 7, [[0, '#a8825a'], [1, '#4a3418']]); ctx.fillRect(r.x, ry, r.w, 7);
    for (const f of [0.1, 0.22, 0.78, 0.9]) { const x = r.x + r.w * f, pr = Math.min(20, H * 0.15); cast(ctx, x + 2, ry, pr * 0.9, 3, 0.25); ctx.fillStyle = rg(ctx, x - pr * 0.3, ry - pr * 1.1, 1, pr * 1.2, [[0, '#ffffff'], [1, '#cfd6d8']]); ell(ctx, x, ry - pr * 0.95, pr, pr); ctx.fill(); ctx.strokeStyle = '#27499f'; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1.4; ell(ctx, x, ry - pr * 0.95, pr * 0.55, pr * 0.55); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, ry - pr * 1.4); ctx.lineTo(x, ry - pr * 0.5); ctx.stroke(); }
    const cx = r.x + r.w * 0.34; ctx.fillStyle = rg(ctx, cx - 4, ry - 18, 1, 22, [[0, '#f0a060'], [1, '#6a2e16']]); ell(ctx, cx, ry - 12, 14, 12); ctx.fill();
  },
};
const floorEx = {
  tilechecker(ctx, r) { const t = 54; for (let y = r.y, j = 0; y < r.y + r.h; y += t, j++) for (let x = r.x, i = 0; x < r.x + r.w; x += t, i++) { ctx.fillStyle = (i + j) % 2 ? 'rgba(44,60,96,0.24)' : 'rgba(250,248,240,0.2)'; ctx.fillRect(x, y, t, t); } },   // 1.10.0: soft blue and white, quieter than the painting
  tilecalcada(ctx, r) { ctx.strokeStyle = 'rgba(0,0,0,0.14)'; ctx.lineWidth = 2; for (let y = r.y, j = 0; y < r.y + r.h; y += 22, j++) for (let x = r.x + (j % 2 ? 11 : 0); x < r.x + r.w; x += 22) { ctx.fillStyle = (hash(x | 0, y | 0) > 0.6) ? 'rgba(40,44,60,0.2)' : 'rgba(245,242,232,0.3)'; ctx.fillRect(x, y, 21, 21); ctx.strokeRect(x, y, 21, 21); } },   // 1.10.0: calmer calcada
  tilerug(ctx, r) { ctx.fillStyle = '#6a1f22'; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.strokeStyle = 'rgba(230,190,90,0.5)'; ctx.lineWidth = 3; ctx.strokeRect(r.x + 16, r.y + 16, r.w - 32, r.h - 32); ctx.strokeStyle = 'rgba(30,60,120,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(r.x + 28, r.y + 28, r.w - 56, r.h - 56); for (let k = 0; k < 360; k++) { ctx.fillStyle = `rgba(255,255,255,${0.03 + hash(k, 5) * 0.05})`; ctx.fillRect(r.x + hash(k, 6) * r.w, r.y + hash(k, 7) * r.h, 2, 2); } },
  tileterracotta(ctx, r) { const t = 66; ctx.lineWidth = 3; for (let y = r.y; y < r.y + r.h; y += t) for (let x = r.x; x < r.x + r.w; x += t) { ctx.fillStyle = `rgba(${150 + hash(x | 0, y | 0) * 50 | 0},${60 + hash(y | 0, x | 0) * 30 | 0},30,0.38)`; ctx.fillRect(x, y, t, t); ctx.strokeStyle = 'rgba(40,16,8,0.45)'; ctx.strokeRect(x, y, t, t); } },
};
registerProp('tilestack', (ctx, s, o = {}) => { // a stack of glazed tiles, painted face up
  const c = o.c ?? '#1b479a'; cast(ctx, 2, s * 0.16, s * 0.34, s * 0.07);
  for (let k = 0; k < 3; k++) { const y = (1 - k) * s * 0.085, w = s * 0.32; ctx.fillStyle = '#d9d2c0'; ctx.beginPath(); ctx.moveTo(-w, y); ctx.lineTo(0, y - s * 0.12); ctx.lineTo(w, y); ctx.lineTo(w, y + s * 0.06); ctx.lineTo(0, y - s * 0.06); ctx.lineTo(-w, y + s * 0.06); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = '#f4f1e6'; ctx.beginPath(); ctx.moveTo(-s * 0.32, -s * 0.085); ctx.lineTo(0, -s * 0.205); ctx.lineTo(s * 0.32, -s * 0.085); ctx.lineTo(0, s * 0.035); ctx.closePath(); ctx.fill();
  ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, -s * 0.15); ctx.lineTo(s * 0.14, -s * 0.085); ctx.lineTo(0, -s * 0.02); ctx.lineTo(-s * 0.14, -s * 0.085); ctx.closePath(); ctx.fill();
});

const T = (c, h) => ({ caption: c, hint: h });
const scenes = {
  azulejo: { wall: 'tilelisbon', wallC: '#efe6cf', floor: 'tilecalcada', floorC: '#8a8478', light: 'window', litter: [{ k: 'splash', c: '#1b479a' }], dock: ['brush:#1b479a', 'gauge', 'tilestack:#1b479a'], dockKind: 'ledge', frame: 'tile', words: T('Paint this azulejo panel', 'Cobalt first, then sky blue and ochre'), pitch: 1.05, wave: 'sine' },
  iznik: { wall: 'tileistanbul', wallC: '#1c5a62', floor: 'tilerug', floorC: '#6a1f22', light: 'lamp', litter: [{ k: 'splash', c: '#25a6b6' }], dock: ['brush:#1f46a0', 'gauge', 'tilestack:#25a6b6'], dockKind: 'tray', frame: 'plinth', words: T('Paint this Iznik panel', 'Outline in cobalt, then fill with turquoise and red'), pitch: 1.25, wave: 'sine' },
  talavera: { wall: 'tilepuebla', wallC: '#e6b84a', floor: 'tileterracotta', floorC: '#b5532c', light: 'window', litter: [{ k: 'splash', c: '#f1b81f' }], dock: ['brush:#1c46a8', 'gauge', 'tilestack:#f1b81f'], dockKind: 'ledge', frame: 'rail', words: T('Paint these Talavera tiles', 'Blue outline first, then yellow, orange and green'), pitch: 0.95, wave: 'triangle' },
  delft: { wall: 'tiledelft', wallC: '#f0ece0', floor: 'tilechecker', floorC: '#c9c4b8', light: 'window', litter: [{ k: 'splash', c: '#27499f' }], dock: ['brush:#27499f', 'gauge', 'tilestack:#27499f'], dockKind: 'cloth', frame: 'case', words: T('Paint these Delft tiles', 'Fine blue lines, then a pale wash'), pitch: 1.15, wave: 'sine' },
};
registerSceneSet({
  scenes: Object.fromEntries(Object.entries(scenes).map(([id, s]) => [id, { ...s, hang: [] }])),
  rules: [['azulejo', /azulejo/], ['iznik', /iznik/], ['talavera', /talavera/], ['delft', /delft/]],
  walls, floorEx, floorKinds: { tilechecker: 'slate', tilecalcada: 'slate', tilerug: 'felt', tileterracotta: 'slate' },
  soundMat: Object.fromEntries(Object.keys(scenes).map((id) => [id, 'clay'])),
});

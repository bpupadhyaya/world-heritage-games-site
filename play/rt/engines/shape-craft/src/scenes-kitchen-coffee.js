// shape-craft 1.26.0 Kitchen Crafts: the coffee and sugar kitchens for the `brew` technique. Each game has its own room, light and bench:
//   kc-brew-cezve   an Anatolian coffee house alcove: tiled dado, copper pots on a rail, a brass lantern, a marble counter
//   kc-brew-jebena  a round hut or courtyard: thatch and mud wall, rush floor, a woven stool, charcoal glow          (scenes-kitchen-coffee2.js)
//   kc-brew-syrup   a village kitchen under palms: thatch shelter, earthen stove, bamboo, smoke                      (scenes-kitchen-coffee2.js)
import { registerSceneSet, registerProp } from './registry.js';
import { hash } from './geom.js';
import { tint, mix, rgba, rrect } from './fx.js';
import { lg, rg, ell, cast, TAU } from './props.js';
import './scenes-kitchen-coffee2.js';

const speck = (ctx, x, y, w, h, n, c, a, seed, sz = 2) => { ctx.fillStyle = rgba(c, a); ctx.beginPath(); for (let k = 0; k < n; k++) ctx.rect(x + hash(k, seed) * w, y + hash(k, seed + 1) * h, sz * (0.5 + hash(k, seed + 2)), sz * (0.5 + hash(k, seed + 3))); ctx.fill(); };
const glowAt = (ctx, x, y, r, col, a) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.45, `rgba(${col},${a * 0.35})`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); };

// a small copper cezve, hanging or standing, for the wall rail and the dock
function miniCezve(ctx, s, c = '#c0652d', hang = false) {
  ctx.save();
  if (hang) { ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = Math.max(1.5, s * 0.03); ctx.beginPath(); ctx.moveTo(s * 0.34, -s * 0.5); ctx.lineTo(s * 0.34, -s * 0.34); ctx.stroke(); }
  ctx.fillStyle = lg(ctx, s * 0.22, -s * 0.34, s * 0.34, -s * 0.3, [[0, '#f6dd94'], [1, '#6a4a14']]); ctx.save(); ctx.translate(s * 0.06, -s * 0.3); ctx.rotate(-0.22); rrect(ctx, 0, -s * 0.022, s * 0.34, s * 0.044, s * 0.02); ctx.fill(); ctx.restore();
  ctx.fillStyle = lg(ctx, -s * 0.24, 0, s * 0.24, 0, [[0, tint(c, -0.62)], [0.14, tint(c, -0.25)], [0.28, tint(c, 0.7)], [0.4, tint(c, 0.15)], [0.58, c], [0.85, tint(c, -0.38)], [1, tint(c, -0.6)]]);
  ctx.beginPath(); ctx.moveTo(-s * 0.24, s * 0.34); ctx.bezierCurveTo(-s * 0.26, s * 0.12, -s * 0.17, -s * 0.1, -s * 0.15, -s * 0.2); ctx.bezierCurveTo(-s * 0.14, -s * 0.28, -s * 0.18, -s * 0.34, -s * 0.2, -s * 0.4); ctx.lineTo(s * 0.2, -s * 0.4); ctx.bezierCurveTo(s * 0.18, -s * 0.34, s * 0.14, -s * 0.28, s * 0.15, -s * 0.2); ctx.bezierCurveTo(s * 0.17, -s * 0.1, s * 0.26, s * 0.12, s * 0.24, s * 0.34); ctx.ellipse(0, s * 0.34, s * 0.24, s * 0.06, 0, 0, Math.PI); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(40,12,2,0.6)'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = '#7a8088'; ell(ctx, 0, -s * 0.4, s * 0.2, s * 0.05); ctx.fill(); ctx.fillStyle = '#140a05'; ell(ctx, 0, -s * 0.4, s * 0.17, s * 0.035); ctx.fill();
  ctx.restore();
}
function cupSaucer(ctx, s) {
  cast(ctx, 0, s * 0.3, s * 0.4, s * 0.07, 0.35);
  ctx.fillStyle = lg(ctx, 0, s * 0.18, 0, s * 0.34, [[0, '#ffffff'], [1, '#c9ccd4']]); ell(ctx, 0, s * 0.26, s * 0.42, s * 0.1); ctx.fill(); ctx.strokeStyle = 'rgba(40,50,80,0.4)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = lg(ctx, -s * 0.22, 0, s * 0.22, 0, [[0, '#b9bec9'], [0.3, '#ffffff'], [1, '#aeb4c0']]); ctx.beginPath(); ctx.moveTo(-s * 0.22, -s * 0.14); ctx.bezierCurveTo(-s * 0.2, s * 0.06, -s * 0.12, s * 0.2, -s * 0.1, s * 0.23); ctx.lineTo(s * 0.1, s * 0.23); ctx.bezierCurveTo(s * 0.12, s * 0.2, s * 0.2, s * 0.06, s * 0.22, -s * 0.14); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(40,50,80,0.45)'; ctx.stroke();
  ctx.fillStyle = '#2b57a8'; ctx.fillRect(-s * 0.2, -s * 0.02, s * 0.4, s * 0.04);
  ctx.fillStyle = '#f2f3f6'; ell(ctx, 0, -s * 0.14, s * 0.22, s * 0.055); ctx.fill(); ctx.fillStyle = '#3a1c0a'; ell(ctx, 0, -s * 0.135, s * 0.19, s * 0.04); ctx.fill(); ctx.fillStyle = '#c88c4e'; ell(ctx, 0, -s * 0.14, s * 0.15, s * 0.03); ctx.fill();
}
function beanPile(ctx, s, c = '#4a2810') {
  cast(ctx, 0, s * 0.22, s * 0.4, s * 0.07, 0.35);
  for (let k = 0; k < 26; k++) {
    const a = hash(k, 1) * TAU, d = Math.sqrt(hash(k, 2)) * s * 0.3, x = Math.cos(a) * d, y = s * 0.1 + Math.sin(a) * d * 0.4 - (1 - d / (s * 0.3)) * s * 0.1;
    ctx.save(); ctx.translate(x, y); ctx.rotate(hash(k, 3) * TAU);
    ctx.fillStyle = lg(ctx, -s * 0.06, -s * 0.04, s * 0.06, s * 0.04, [[0, tint(c, 0.5)], [0.5, c], [1, tint(c, -0.5)]]); ell(ctx, 0, 0, s * 0.065, s * 0.045); ctx.fill();
    ctx.strokeStyle = tint(c, -0.6); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-s * 0.05, 0); ctx.quadraticCurveTo(0, s * 0.012, s * 0.05, 0); ctx.stroke(); ctx.restore();
  }
}
function sugarCubes(ctx, s) {
  cast(ctx, 0, s * 0.22, s * 0.38, s * 0.07, 0.35);
  const cube = (x, y, w) => { ctx.fillStyle = lg(ctx, x, y - w, x + w, y + w * 0.2, [[0, '#ffffff'], [1, '#c9ced6']]); ctx.fillRect(x, y - w, w, w); ctx.fillStyle = '#e6e9ee'; ctx.beginPath(); ctx.moveTo(x, y - w); ctx.lineTo(x + w * 0.3, y - w * 1.25); ctx.lineTo(x + w * 1.3, y - w * 1.25); ctx.lineTo(x + w, y - w); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#b4bac4'; ctx.beginPath(); ctx.moveTo(x + w, y - w); ctx.lineTo(x + w * 1.3, y - w * 1.25); ctx.lineTo(x + w * 1.3, y - w * 0.25); ctx.lineTo(x + w, y); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.8; ctx.strokeRect(x, y - w, w, w); };
  cube(-s * 0.26, s * 0.2, s * 0.17); cube(-s * 0.06, s * 0.2, s * 0.17); cube(s * 0.1, s * 0.2, s * 0.17); cube(-s * 0.16, s * 0.03, s * 0.17); cube(s * 0.02, s * 0.03, s * 0.17);
}
registerProp('kc-brew-cezvemini', (ctx, s) => { cast(ctx, 0, s * 0.4, s * 0.3, s * 0.06, 0.4); miniCezve(ctx, s * 0.95); });
registerProp('kc-brew-cupmini', (ctx, s) => { cupSaucer(ctx, s); });
registerProp('kc-brew-beans', (ctx, s, o) => { beanPile(ctx, s, o?.c ?? '#4a2810'); });
registerProp('kc-brew-cubes', (ctx, s) => { sugarCubes(ctx, s); });

const walls = {
  kcbrewcezvewall(ctx, s, r, H, t) { // an Anatolian coffee house: ochre plaster, a tiled dado with tulips, an arched niche, a pot rail, a brass lantern
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#d2ad74'], [0.55, '#b98a50'], [1, '#8a6034']]); ctx.fillRect(r.x, r.y, r.w, H);
    speck(ctx, r.x, r.y, r.w, H * 0.6, 170, '#4a2a0c', 0.1, 31, 4); speck(ctx, r.x, r.y, r.w, H * 0.6, 90, '#fff2d0', 0.08, 35, 3);
    // the tiled dado
    const dy = r.y + H * 0.58, dh = H * 0.42, cell = Math.max(22, dh / 3.2);
    for (let row = 0; row * cell < dh + cell; row++) for (let x = r.x - (row % 2) * cell * 0.5; x < r.x + r.w; x += cell) {
      const y = dy + row * cell; if (y > r.y + H) continue; const k = hash((x / cell) | 0, row, 9);
      ctx.save(); ctx.beginPath(); ctx.rect(x + 1, y + 1, cell - 2, Math.min(cell - 2, r.y + H - y)); ctx.clip();
      ctx.fillStyle = lg(ctx, x, y, x + cell, y + cell, [[0, '#fbf6e8'], [1, '#d8d2c0']]); ctx.fillRect(x, y, cell, cell);
      ctx.strokeStyle = '#1d4fa6'; ctx.lineWidth = Math.max(1.4, cell * 0.04); ctx.strokeRect(x + cell * 0.09, y + cell * 0.09, cell * 0.82, cell * 0.82);
      const cx = x + cell / 2, cy = y + cell / 2;
      for (let p = 0; p < 4; p++) { ctx.save(); ctx.translate(cx, cy); ctx.rotate((p * Math.PI) / 2 + (k > 0.5 ? Math.PI / 4 : 0)); ctx.fillStyle = k > 0.66 ? '#d12f2f' : k > 0.33 ? '#1d4fa6' : '#139aa6'; ctx.beginPath(); ctx.moveTo(0, -cell * 0.04); ctx.quadraticCurveTo(cell * 0.2, -cell * 0.1, 0, -cell * 0.34); ctx.quadraticCurveTo(-cell * 0.2, -cell * 0.1, 0, -cell * 0.04); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(0, -cell * 0.17, cell * 0.03, 0, TAU); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = '#e0b030'; ctx.beginPath(); ctx.arc(cx, cy, cell * 0.05, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(x + 1, y + 1, cell - 2, cell * 0.18); ctx.restore();
    }
    ctx.fillStyle = 'rgba(30,18,6,0.5)'; ctx.fillRect(r.x, dy - 1, r.w, 3);
    ctx.fillStyle = lg(ctx, 0, dy - 8, 0, dy, [[0, '#1d4fa6'], [0.5, '#2f6ad0'], [1, '#143a80']]); ctx.fillRect(r.x, dy - 8, r.w, 8); ctx.fillStyle = '#e0b030'; ctx.fillRect(r.x, dy - 9, r.w, 2);
    // the niche: a pointed arch with a shelf of cups and a glowing lamp
    const nw = Math.min(r.w * 0.28, H * 0.8), nx = r.x + r.w * 0.2, ny = r.y + H * 0.1, nh = H * 0.45;
    const arch = () => { ctx.beginPath(); ctx.moveTo(nx - nw / 2, ny + nh); ctx.lineTo(nx - nw / 2, ny + nw * 0.55); ctx.quadraticCurveTo(nx - nw / 2, ny + nw * 0.1, nx, ny - nw * 0.12); ctx.quadraticCurveTo(nx + nw / 2, ny + nw * 0.1, nx + nw / 2, ny + nw * 0.55); ctx.lineTo(nx + nw / 2, ny + nh); ctx.closePath(); };
    ctx.save(); arch(); ctx.fillStyle = '#e8d6a8'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = '#1d4fa6'; ctx.stroke(); ctx.restore();
    ctx.save(); arch(); ctx.clip(); ctx.fillStyle = lg(ctx, 0, ny, 0, ny + nh, [[0, '#2a160a'], [1, '#5a3418']]); ctx.fillRect(nx - nw / 2, ny - nw, nw, nh + nw);
    ctx.fillStyle = rg(ctx, nx, ny + nh * 0.55, 2, nw * 0.8, [[0, 'rgba(255,190,100,0.55)'], [1, 'rgba(255,150,60,0)']]); ctx.fillRect(nx - nw / 2, ny - 4, nw, nh + 8);
    const sy = ny + nh * 0.62; ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 7, [[0, '#d09a5a'], [1, '#5a3818']]); ctx.fillRect(nx - nw / 2, sy, nw, 7);
    for (let q = 0; q < 3; q++) { const cx = nx - nw * 0.28 + q * nw * 0.28; ctx.save(); ctx.translate(cx, sy); ctx.scale(0.5, 0.5); ctx.translate(0, -nw * 0.12); cupSaucer(ctx, nw * 0.38); ctx.restore(); }
    ctx.save(); ctx.translate(nx, sy - nh * 0.05); miniCezve(ctx, nw * 0.5); ctx.restore();
    ctx.restore();
    // the pot rail with hanging copper
    const ry = r.y + H * 0.08, rx0 = r.x + r.w * 0.42, rx1 = r.x + r.w * 0.97;
    ctx.fillStyle = lg(ctx, 0, ry - 3, 0, ry + 4, [[0, '#f2d37a'], [1, '#6a4a14']]); ctx.fillRect(rx0, ry - 3, rx1 - rx0, 6);
    [[0.1, 0.16, '#c0652d'], [0.3, 0.2, '#b05424'], [0.53, 0.14, '#d07a3c'], [0.76, 0.19, '#c0652d']].forEach(([f, sz, c]) => { const x = rx0 + (rx1 - rx0) * f; ctx.save(); ctx.translate(x, ry + H * 0.2 + sz * H * 0.5); miniCezve(ctx, H * sz * 1.5, c, true); ctx.restore(); });
    // a brass lantern whose light pools on the wall
    const lx = r.x + r.w * 0.34, ly = r.y + H * 0.2;
    ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, r.y); ctx.lineTo(lx, ly - H * 0.1); ctx.stroke();
    glowAt(ctx, lx, ly, H * 0.9, '255,190,100', 0.42 + 0.04 * Math.sin((t ?? 0) * 2.4));
    ctx.fillStyle = lg(ctx, lx - 16, 0, lx + 16, 0, [[0, '#5a3c0c'], [0.35, '#f2d37a'], [1, '#6a4a14']]); ctx.beginPath(); ctx.moveTo(lx - 5, ly - H * 0.1); ctx.lineTo(lx + 5, ly - H * 0.1); ctx.lineTo(lx + 16, ly - H * 0.02); ctx.lineTo(lx + 11, ly + H * 0.1); ctx.lineTo(lx - 11, ly + H * 0.1); ctx.lineTo(lx - 16, ly - H * 0.02); ctx.closePath(); ctx.fill();
    ctx.fillStyle = rg(ctx, lx, ly + H * 0.02, 1, H * 0.1, [[0, '#fff6d0'], [0.5, '#ffc870'], [1, 'rgba(255,170,60,0.5)']]); ell(ctx, lx, ly + H * 0.02, 9, H * 0.07); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(r.x, r.y, r.w, 8);
  },
};

const floors = {
  kcbrewcounter(ctx, r, c) { // a dark marble counter with a brass edge and the lamp's reflection
    ctx.fillStyle = lg(ctx, r.x, r.y, r.x + r.w, r.y + r.h, [[0, '#4a3c34'], [0.5, '#2a211c'], [1, '#3a2e26']]); ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.lineCap = 'round';
    for (let k = 0; k < 14; k++) { const x = r.x + r.w * hash(k, 3), y = r.y + r.h * (0.2 + hash(k, 4) * 0.8); ctx.strokeStyle = `rgba(230,215,190,${0.05 + hash(k, 5) * 0.1})`; ctx.lineWidth = 1 + hash(k, 6) * 1.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 60, y - 30 + hash(k, 7) * 60, x + 120, y + 30 - hash(k, 8) * 60, x + 200 + hash(k, 9) * 120, y + (hash(k, 10) - 0.5) * 80); ctx.stroke(); }
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + r.h, [[0, 'rgba(255,200,130,0.1)'], [0.4, 'rgba(255,200,130,0)'], [1, 'rgba(0,0,0,0.25)']]); ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = lg(ctx, 0, r.y + r.h - 14, 0, r.y + r.h, [[0, '#b98a2c'], [1, '#6a4a14']]); ctx.fillRect(r.x, r.y + r.h - 12, r.w, 12);
  },
};

const T = (c, h, w) => ({ caption: c, hint: h, ...(w ?? {}) });
registerSceneSet({
  scenes: {
    'kc-brew-cezve': { wall: 'kcbrewcezvewall', wallC: '#b98a50', wallK: 2.3, floor: 'kcbrewcounter', floorC: '#3a2e26', light: 'lamp', litter: [{ k: 'sugar', c: '#fff8ea' }], dock: ['kc-brew-cezvemini', 'kc-brew-cupmini', '', 'kc-brew-beans', 'kc-brew-cubes'], dockKind: 'ledge', frame: 'niche', wood: '#5a3a1e', hang: [],
      words: T('Brew this coffee', 'Lift the pot before the foam reaches the rim', { win: 'A cup with a proper crown of foam', ok: 'A good cup', retry: 'Back to the sand' }), pitch: 1.0, wave: 'triangle' },
  },
  walls, floorKinds: { kcbrewcounter: 'slate' }, floorEx: floors,
  soundMat: { 'kc-brew-cezve': 'metal' },
});
void mix;

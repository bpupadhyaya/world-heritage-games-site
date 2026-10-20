// shape-craft paint workshops added in 1.9.0 (registerSceneSet): Kalocsa (Hungary), Nubian house (Egypt and Sudan).
import { registerSceneSet } from './registry.js';
import { hash } from './geom.js';
import { tint, rgba, rrect } from './fx.js';
import { lg, rg, ell, cast, TAU } from './props.js';

const walls = {
  kalwall(ctx, s, r, H) { // whitewashed farmhouse wall, a painted blue dado with little flowers, a wooden bench
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.1)], [1, tint(s.wallC, -0.1)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let k = 0; k < 40; k++) { ctx.fillStyle = rgba('#8a7a5a', 0.05); ell(ctx, r.x + hash(k, 3) * r.w, r.y + hash(k, 4) * H, 10 + hash(k, 5) * 20, 3 + hash(k, 6) * 5); ctx.fill(); }
    const dy = r.y + H * 0.58; ctx.fillStyle = '#2a5cae'; ctx.fillRect(r.x, dy, r.w, H - H * 0.58); ctx.fillStyle = '#f4ecdc'; ctx.fillRect(r.x, dy, r.w, 3);
    for (let x = r.x + 14; x < r.x + r.w - 6; x += 30) { const y = dy + (H - H * 0.58) * 0.5; for (let q = 0; q < 5; q++) { const a = (q / 5) * TAU; ctx.fillStyle = q % 2 ? '#e46380' : '#c4202c'; ell(ctx, x + Math.cos(a) * 5, y + Math.sin(a) * 5, 3.2, 3.2); ctx.fill(); } ctx.fillStyle = '#f4ecdc'; ell(ctx, x, y, 2, 2); ctx.fill(); ctx.strokeStyle = '#2f8a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 8, y); ctx.quadraticCurveTo(x + 15, y - 8, x + 22, y); ctx.stroke(); }
    const wx = r.x + r.w * 0.5, ww = Math.min(r.w * 0.16, 90); ctx.fillStyle = lg(ctx, 0, r.y + H * 0.08, 0, r.y + H * 0.5, [[0, '#f4f8ff'], [1, '#b8cfe6']]); ctx.fillRect(wx - ww / 2, r.y + H * 0.08, ww, H * 0.42); ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 4; ctx.strokeRect(wx - ww / 2, r.y + H * 0.08, ww, H * 0.42); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(wx, r.y + H * 0.08); ctx.lineTo(wx, r.y + H * 0.5); ctx.moveTo(wx - ww / 2, r.y + H * 0.29); ctx.lineTo(wx + ww / 2, r.y + H * 0.29); ctx.stroke();
    ctx.fillStyle = '#c4202c'; for (const f of [-0.5, 0.5]) { ctx.fillRect(wx + f * ww - (f < 0 ? 12 : 0), r.y + H * 0.08, 12, H * 0.42); }
  },
};
walls.nubwall = function (ctx, s, r, H, t) { // the Nile at the edge of the village: palms, a felucca sail, mud-brick domes
  ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#7ab4d8'], [0.6, '#f4e2b8'], [1, '#e8c890']]); ctx.fillRect(r.x, r.y, r.w, H);
  ctx.fillStyle = lg(ctx, 0, r.y + H * 0.62, 0, r.y + H, [[0, '#3a7aa8'], [1, '#1d4a78']]); ctx.fillRect(r.x, r.y + H * 0.62, r.w, H * 0.38);
  const sx = r.x + r.w * 0.64 + Math.sin(t * 0.3) * 4, sy = r.y + H * 0.62; ctx.fillStyle = '#f8f0dc'; ctx.beginPath(); ctx.moveTo(sx, sy - H * 0.4); ctx.lineTo(sx + 26, sy - 4); ctx.lineTo(sx - 6, sy - 4); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#5a3a1c'; ctx.fillRect(sx - 14, sy - 4, 44, 5);
  for (const f of [0.1, 0.9, 0.2]) { const x = r.x + r.w * f, h0 = H * (0.75 + (f > 0.5 ? 0.05 : 0)); ctx.strokeStyle = '#4a3418'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, r.y + H); ctx.quadraticCurveTo(x + 4, r.y + H - h0 * 0.5, x, r.y + H - h0); ctx.stroke(); ctx.strokeStyle = '#2f6a3a'; ctx.lineWidth = 3; for (let q = 0; q < 7; q++) { const a = -Math.PI + (q / 6) * Math.PI; ctx.beginPath(); ctx.moveTo(x, r.y + H - h0); ctx.quadraticCurveTo(x + Math.cos(a) * 24, r.y + H - h0 - 14 + Math.sin(a) * 6, x + Math.cos(a) * 40, r.y + H - h0 + 14 + Math.sin(a) * 10); ctx.stroke(); } }
  for (const f of [0.38, 0.5]) { const x = r.x + r.w * f, w = Math.min(r.w * 0.09, 56); ctx.fillStyle = lg(ctx, x - w / 2, 0, x + w / 2, 0, [[0, '#d8bc90'], [1, '#a88858']]); ctx.beginPath(); ctx.moveTo(x - w / 2, r.y + H); ctx.lineTo(x - w / 2, r.y + H * 0.72); ctx.quadraticCurveTo(x, r.y + H * 0.5, x + w / 2, r.y + H * 0.72); ctx.lineTo(x + w / 2, r.y + H); ctx.fill(); }
};
const T = (c, h) => ({ caption: c, hint: h });
const scenes = {
  kalocsa: { wall: 'kalwall', wallC: '#efe6d2', floor: 'planks', floorC: '#9a7448', light: 'window', litter: [{ k: 'splash', c: '#c4202c' }], dock: ['brush:#c4202c', 'gauge', 'sponge'], dockKind: 'ledge', frame: 'rail', words: T('Paint this garland', 'Leaves first, then the big roses'), pitch: 1.0, wave: 'triangle' },
};
scenes.nubian = { wall: 'nubwall', wallC: '#e6c890', floor: 'earth', floorC: '#d6b684', light: 'window', litter: [{ k: 'dust', c: '#f0e0c0' }], dock: ['brush:#2a4a9a', 'gauge', 'bowl'], dockKind: 'ledge', frame: 'niche', words: T('Paint this house front', 'Doorway and friezes first, then the colours'), pitch: 0.9, wave: 'triangle' };
registerSceneSet({
  scenes: Object.fromEntries(Object.entries(scenes).map(([id, s]) => [id, { ...s, hang: [] }])),
  rules: [['kalocsa', /kalocsa/], ['nubian', /nubian/]], walls, soundMat: { kalocsa: 'clay', nubian: 'clay' },
});

// shape-craft 1.26.0 Kitchen Crafts, SWEET area: the two workshops and their props (registerSceneSet).
//   kc-sweet-sugarshack  a Quebec sugar shack at dusk (maple taffy on snow, technique `sweet-taffy`)
//   kc-sweet-alcove      a tea room alcove with a lacquer tray and a seasonal branch (nerikiri wagashi, technique `sweet-nerikiri`)
// Each has its own wall, floor, light, tool dock and held tools; nothing is shared with another game. Pure canvas 2D, deterministic.
import { registerSceneSet } from './registry.js';
import { hash } from './geom.js';
import { tint, rgba, rrect, mix } from './fx.js';
import { lg, rg, ell, cast, TAU } from './props.js';
import './sweet-taffy.js';
import './sweet-nerikiri.js';

// ---- props -----------------------------------------------------------------------------------------------------------------------------------
const STEEL = [[0, '#f1f5f8'], [0.45, '#aeb8c2'], [1, '#626c76']];
const WOOD = (c) => [[0, tint(c, 0.38)], [0.5, c], [1, tint(c, -0.5)]];
const props = {
  'kc-sweet-kettle'(ctx, s) { // a black iron sap kettle with a bail handle, boiled syrup showing in the open top
    const r = s * 0.26; cast(ctx, r * 0.1, r * 0.95, r * 1.15, r * 0.28, 0.4);
    ctx.strokeStyle = '#2c2f34'; ctx.lineWidth = s * 0.03; ctx.beginPath(); ctx.arc(0, -r * 0.2, r * 1.0, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
    ctx.fillStyle = rg(ctx, -r * 0.3, -r * 0.2, r * 0.1, r * 1.4, [[0, '#6a6f78'], [0.35, '#34373d'], [1, '#101114']]); ctx.beginPath(); ctx.moveTo(-r * 1.05, -r * 0.35); ctx.quadraticCurveTo(-r * 1.2, r * 0.8, 0, r * 0.88); ctx.quadraticCurveTo(r * 1.2, r * 0.8, r * 1.05, -r * 0.35); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1b1c20'; ell(ctx, 0, -r * 0.35, r * 1.05, r * 0.3); ctx.fill();
    ctx.fillStyle = lg(ctx, 0, -r * 0.6, 0, -r * 0.1, [[0, '#ffc860'], [0.5, '#d9801a'], [1, '#8a3d05']]); ell(ctx, 0, -r * 0.33, r * 0.92, r * 0.24); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ell(ctx, -r * 0.3, -r * 0.4, r * 0.28, r * 0.06); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.ellipse(-r * 0.55, r * 0.15, r * 0.1, r * 0.4, 0.2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2c2f34'; ctx.beginPath(); ctx.moveTo(r * 1.0, -r * 0.05); ctx.lineTo(r * 1.4, -r * 0.4); ctx.lineTo(r * 1.45, -r * 0.3); ctx.lineTo(r * 1.04, r * 0.15); ctx.closePath(); ctx.fill();
  },
  'kc-sweet-sticks'(ctx, s) { // a bundle of flat wooden sticks tied with twine
    for (let k = 0; k < 6; k++) { const y = (k - 2.5) * s * 0.034, x0 = -s * 0.42 + (k % 2) * s * 0.03; ctx.save(); ctx.translate(0, y); rrect(ctx, x0, -s * 0.016, s * 0.84, s * 0.032, s * 0.016); ctx.fillStyle = lg(ctx, 0, -s * 0.016, 0, s * 0.016, [[0, '#f0d4a0'], [0.5, tint('#d4a468', (hash(k, 3) - 0.5) * 0.2)], [1, '#8e6234']]); ctx.fill(); ctx.strokeStyle = 'rgba(80,46,16,0.4)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); }
    ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = s * 0.02; ctx.beginPath(); ctx.moveTo(-s * 0.05, -s * 0.13); ctx.lineTo(-s * 0.05, s * 0.13); ctx.stroke(); ctx.strokeStyle = 'rgba(70,40,10,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-s * 0.035, -s * 0.13); ctx.lineTo(-s * 0.035, s * 0.13); ctx.stroke();
  },
  'kc-sweet-bera'(ctx, s) { // a flat bamboo spatula: the tip is the broad blade end (+x)
    const h = s * 0.06; rrect(ctx, -s / 2, -h * 0.35, s * 0.62, h * 0.7, h * 0.35); ctx.fillStyle = lg(ctx, 0, -h * 0.35, 0, h * 0.35, WOOD('#c9a35a')); ctx.fill(); ctx.strokeStyle = 'rgba(60,38,10,0.4)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = lg(ctx, 0, -h * 0.6, 0, h * 0.6, [[0, '#f0dba0'], [0.5, '#d4b070'], [1, '#8e6a34']]); ctx.beginPath(); ctx.moveTo(s * 0.06, -h * 0.35); ctx.lineTo(s * 0.4, -h * 0.62); ctx.quadraticCurveTo(s * 0.52, 0, s * 0.4, h * 0.62); ctx.lineTo(s * 0.06, h * 0.35); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(100,66,22,0.35)'; ctx.beginPath(); for (let k = -2; k <= 2; k++) { ctx.moveTo(s * 0.12, k * h * 0.12); ctx.lineTo(s * 0.46, k * h * 0.2); } ctx.stroke();
    ctx.fillStyle = '#4a3216'; ctx.beginPath(); ctx.arc(-s * 0.46, 0, h * 0.12, 0, TAU); ctx.fill();
  },
  'kc-sweet-sankaku'(ctx, s) { // a three-sided stick of pale wood, tapered to a ridge tip (+x)
    const h = s * 0.075; ctx.fillStyle = lg(ctx, 0, -h / 2, 0, h / 2, [[0, '#f4dfae'], [0.5, '#cfa464'], [1, '#7a5428']]); ctx.beginPath(); ctx.moveTo(-s / 2, -h * 0.48); ctx.lineTo(s * 0.2, -h * 0.48); ctx.lineTo(s / 2, 0); ctx.lineTo(s * 0.2, h * 0.48); ctx.lineTo(-s / 2, h * 0.48); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(60,38,10,0.5)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-s * 0.46, -h * 0.4, s * 0.6, h * 0.1); ctx.strokeStyle = 'rgba(90,58,20,0.4)'; ctx.beginPath(); ctx.moveTo(-s * 0.48, 0); ctx.lineTo(s * 0.4, 0); ctx.stroke();
  },
  'kc-sweet-sanbon'(ctx, s) { // a wooden handle with three thin bamboo pins (+x)
    const h = s * 0.085; rrect(ctx, -s / 2, -h / 2, s * 0.5, h, h * 0.4); ctx.fillStyle = lg(ctx, 0, -h / 2, 0, h / 2, WOOD('#9a6a34')); ctx.fill(); ctx.strokeStyle = 'rgba(40,24,6,0.45)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = lg(ctx, 0, -h * 0.6, 0, h * 0.6, STEEL); ctx.fillRect(-s * 0.02, -h * 0.52, h * 0.5, h * 1.04);
    for (let k = -1; k <= 1; k++) { ctx.fillStyle = lg(ctx, 0, k * h * 0.4 - h * 0.1, 0, k * h * 0.4 + h * 0.1, [[0, '#f0dba0'], [1, '#8e6a34']]); ctx.beginPath(); ctx.moveTo(s * 0.03, k * h * 0.4 - h * 0.1); ctx.lineTo(s * 0.5, k * h * 0.4); ctx.lineTo(s * 0.03, k * h * 0.4 + h * 0.1); ctx.closePath(); ctx.fill(); }
  },
  'kc-sweet-sieve'(ctx, s) { // a small round sieve of very fine mesh in a bamboo hoop, with a handle (the sieve is the +x end)
    const r = s * 0.2; rrect(ctx, -s / 2, -s * 0.022, s * 0.52, s * 0.044, s * 0.02); ctx.fillStyle = lg(ctx, 0, -s * 0.022, 0, s * 0.022, WOOD('#b8864a')); ctx.fill(); ctx.strokeStyle = 'rgba(40,24,6,0.45)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.save(); ctx.translate(s * 0.28, 0); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(ctx, r * 0.1, r * 0.12, r * 1.02, r * 1.02); ctx.fill();
    ctx.fillStyle = rg(ctx, 0, 0, 0, r, [[0, 'rgba(250,244,230,0.9)'], [1, 'rgba(200,184,150,0.9)']]); ell(ctx, 0, 0, r, r); ctx.fill();
    ctx.strokeStyle = 'rgba(70,56,36,0.35)'; ctx.lineWidth = 0.7; ctx.beginPath(); for (let k = -6; k <= 6; k++) { const o = (k / 6) * r * 0.95, c = Math.sqrt(Math.max(0, r * r - o * o)) * 0.97; ctx.moveTo(o, -c); ctx.lineTo(o, c); ctx.moveTo(-c, o); ctx.lineTo(c, o); } ctx.stroke();
    ctx.strokeStyle = lg(ctx, -r, -r, r, r, WOOD('#c9a35a')); ctx.lineWidth = r * 0.16; ell(ctx, 0, 0, r, r); ctx.stroke(); ctx.restore();
  },
  'kc-sweet-tweezers'(ctx, s) { // long bamboo tweezers: two slim arms meeting at the tip (+x)
    const h = s * 0.03;
    for (const k of [-1, 1]) { ctx.fillStyle = lg(ctx, 0, k * h * 2.4 - h, 0, k * h * 2.4 + h, [[0, '#f0dba0'], [1, '#8e6a34']]); ctx.beginPath(); ctx.moveTo(-s / 2, k * h * 2.6); ctx.lineTo(s * 0.34, k * h * 0.7); ctx.lineTo(s / 2, k * h * 0.12); ctx.lineTo(s * 0.34, k * h * 1.3); ctx.lineTo(-s / 2, k * h * 2.6 + h * 1.3); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(60,38,10,0.5)'; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.strokeStyle = '#6a4a22'; ctx.lineWidth = h * 0.8; ctx.beginPath(); ctx.moveTo(-s * 0.42, -h * 2.4); ctx.lineTo(-s * 0.42, h * 2.4 + h); ctx.stroke();
  },
};

// ---- walls -----------------------------------------------------------------------------------------------------------------------------------
const walls = {
  'kc-sweet-shackwall'(ctx, s, r, H, t) { // a sugar bush at dusk: sky glow, pines in snow, a lit log shack steaming from its roof vent, a tapped maple
    const g = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#101a38'], [0.45, '#34487e'], [0.78, '#c78a78'], [1, '#f0b878']]); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, H);
    ctx.fillStyle = '#fff'; for (let k = 0; k < 26; k++) { ctx.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(t * 0.8 + k)); ctx.fillRect(r.x + hash(k, 1) * r.w, r.y + hash(k, 2) * H * 0.5, 1.4, 1.4); } ctx.globalAlpha = 1;
    ctx.fillStyle = '#8aa2cc'; ctx.beginPath(); ctx.moveTo(r.x, r.y + H * 0.7); for (let i = 0; i <= 24; i++) ctx.lineTo(r.x + (r.w * i) / 24, r.y + H * (0.58 + 0.06 * Math.sin(i * 0.7) + 0.04 * Math.sin(i * 1.9))); ctx.lineTo(r.x + r.w, r.y + H); ctx.lineTo(r.x, r.y + H); ctx.fill();
    const pine = (x, b, h, c) => { ctx.fillStyle = c; for (let q = 0; q < 4; q++) { const y = b - h * (q / 4), w = h * 0.34 * (1 - q * 0.2); ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x, y - h * 0.34); ctx.lineTo(x + w, y); ctx.fill(); ctx.fillStyle = 'rgba(235,244,255,0.85)'; ctx.beginPath(); ctx.moveTo(x - w * 0.8, y - h * 0.05); ctx.lineTo(x, y - h * 0.34); ctx.lineTo(x + w * 0.2, y - h * 0.2); ctx.fill(); ctx.fillStyle = c; } };
    for (let k = 0; k < 11; k++) pine(r.x + r.w * (0.04 + 0.095 * k) + hash(k, 4) * 14, r.y + H * (0.86 + hash(k, 5) * 0.08), H * (0.36 + hash(k, 6) * 0.2), k % 2 ? '#1c3a3c' : '#223f48');
    ctx.fillStyle = 'rgba(236,244,255,0.9)'; ctx.fillRect(r.x, r.y + H * 0.93, r.w, H * 0.07);
    const sx = r.x + r.w * 0.58, sw = Math.min(r.w * 0.3, H * 1.5), sh = H * 0.42, sy = r.y + H * 0.93 - sh;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(sx - 6, sy + sh - 2, sw + 12, 5);
    ctx.fillStyle = lg(ctx, 0, sy, 0, sy + sh, [[0, '#7a4a28'], [1, '#4a2a14']]); ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeStyle = 'rgba(30,14,4,0.55)'; ctx.lineWidth = 1.4; for (let y = sy + sh / 5; y < sy + sh; y += sh / 5) { ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx + sw, y); ctx.stroke(); }
    ctx.fillStyle = '#3a1e0c'; ctx.beginPath(); ctx.moveTo(sx - sw * 0.06, sy + 1); ctx.lineTo(sx + sw * 0.5, sy - sh * 0.5); ctx.lineTo(sx + sw * 1.06, sy + 1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(240,246,255,0.95)'; ctx.beginPath(); ctx.moveTo(sx - sw * 0.06, sy + 1); ctx.lineTo(sx + sw * 0.5, sy - sh * 0.5); ctx.lineTo(sx + sw * 1.06, sy + 1); ctx.lineTo(sx + sw * 0.98, sy - sh * 0.04); ctx.quadraticCurveTo(sx + sw * 0.5, sy - sh * 0.36, sx + sw * 0.02, sy - sh * 0.04); ctx.closePath(); ctx.fill();
    const vx = sx + sw * 0.5; ctx.fillStyle = '#2a1608'; ctx.fillRect(vx - sw * 0.05, sy - sh * 0.7, sw * 0.1, sh * 0.26); ctx.fillStyle = '#3a1e0c'; ctx.beginPath(); ctx.moveTo(vx - sw * 0.08, sy - sh * 0.7); ctx.lineTo(vx, sy - sh * 0.86); ctx.lineTo(vx + sw * 0.08, sy - sh * 0.7); ctx.fill();
    ctx.save(); ctx.lineCap = 'round'; for (let p = 0; p < 3; p++) { const ph = (t * 0.22 + p / 3) % 1, a = (1 - ph) * 0.34; ctx.strokeStyle = `rgba(255,248,240,${a})`; ctx.lineWidth = 7 + ph * 12; ctx.beginPath(); ctx.moveTo(vx, sy - sh * 0.86); ctx.quadraticCurveTo(vx + Math.sin(t + p) * 8, sy - sh * (0.86 + ph * 0.8), vx + 14 + ph * 26 + Math.sin(t * 0.7 + p) * 6, sy - sh * (1.0 + ph * 1.6)); ctx.stroke(); } ctx.restore();
    const wx = sx + sw * 0.14, wy = sy + sh * 0.22, ww = sw * 0.26, wh = sh * 0.44;
    ctx.fillStyle = rg(ctx, wx + ww / 2, wy + wh / 2, 2, ww, [[0, '#ffe9a0'], [1, '#f5a63c']]); ctx.fillRect(wx, wy, ww, wh); ctx.strokeStyle = '#2a1608'; ctx.lineWidth = 2; ctx.strokeRect(wx, wy, ww, wh); ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rg(ctx, wx + ww / 2, wy + wh * 0.6, 2, sw * 0.8, [[0, 'rgba(255,190,90,0.38)'], [1, 'rgba(255,170,60,0)']]); ctx.fillRect(sx - sw * 0.4, sy - sh * 0.2, sw * 1.8, sh * 1.4); ctx.restore();
    ctx.fillStyle = '#2a1608'; ctx.fillRect(sx + sw * 0.62, sy + sh * 0.28, sw * 0.2, sh * 0.72);
    const tx = r.x + r.w * 0.09, tw = Math.max(16, H * 0.2);
    ctx.fillStyle = lg(ctx, tx, 0, tx + tw, 0, [[0, '#2a1c14'], [0.5, '#5a4636'], [1, '#2a1c14']]); ctx.beginPath(); ctx.moveTo(tx, r.y + H); ctx.lineTo(tx + tw * 0.1, r.y); ctx.lineTo(tx + tw * 0.9, r.y); ctx.lineTo(tx + tw, r.y + H); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.2; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(tx + (tw * k) / 4, r.y); ctx.lineTo(tx + (tw * k) / 4 + (hash(k, 3) - 0.5) * 4, r.y + H); ctx.stroke(); }
    ctx.strokeStyle = '#2a1c14'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(tx + tw * 0.5, r.y + H * 0.1); ctx.lineTo(tx + tw * 2.4, r.y); ctx.moveTo(tx + tw * 0.5, r.y + H * 0.3); ctx.lineTo(tx - tw * 0.8, r.y + H * 0.05); ctx.stroke();
    const bx = tx + tw * 0.5, by = r.y + H * 0.62, bw = tw * 0.9, bh = H * 0.24;
    ctx.fillStyle = lg(ctx, bx - bw / 2, 0, bx + bw / 2, 0, [[0, '#7a8590'], [0.35, '#d8e0e8'], [1, '#56606a']]); ctx.beginPath(); ctx.moveTo(bx - bw * 0.5, by); ctx.lineTo(bx + bw * 0.5, by); ctx.lineTo(bx + bw * 0.4, by + bh); ctx.lineTo(bx - bw * 0.4, by + bh); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#3a4048'; ell(ctx, bx, by, bw * 0.5, bw * 0.12); ctx.fill();
    ctx.fillStyle = '#ffd070'; ell(ctx, bx, by - bh * 0.16, 1.7, 3 + ((t * 3) % 1) * 4); ctx.fill();
  },
  'kc-sweet-alcoveWall'(ctx, s, r, H, t) { // a tea room alcove: pale plaster, a hanging scroll with an ink landscape, a natural-log post, a low shelf, a shoji window
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#d6c19c'], [1, '#b69a70']]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let k = 0; k < 40; k++) { ctx.fillStyle = `rgba(${hash(k, 1) > 0.5 ? '255,244,214' : '90,66,36'},${0.04 + 0.05 * hash(k, 2)})`; ell(ctx, r.x + hash(k, 3) * r.w, r.y + hash(k, 4) * H, 10 + hash(k, 5) * 30, 3 + hash(k, 6) * 8); ctx.fill(); }
    const sw = Math.min(r.w * 0.34, H * 1.7), sx = r.x + r.w * 0.04, sy = r.y + H * 0.1, sh = H * 0.82;
    ctx.fillStyle = lg(ctx, sx, sy, sx, sy + sh, [[0, '#fff8e8'], [1, '#e8d8b4']]); ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeStyle = '#4a321c'; ctx.lineWidth = 2.5; ctx.strokeRect(sx, sy, sw, sh); ctx.lineWidth = 1.6; ctx.beginPath(); for (let i = 1; i < 6; i++) { ctx.moveTo(sx + (sw * i) / 6, sy); ctx.lineTo(sx + (sw * i) / 6, sy + sh); } for (let j = 1; j < 3; j++) { ctx.moveTo(sx, sy + (sh * j) / 3); ctx.lineTo(sx + sw, sy + (sh * j) / 3); } ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rg(ctx, sx + sw / 2, sy + sh / 2, 2, sw * 0.9, [[0, 'rgba(255,240,200,0.3)'], [1, 'rgba(255,240,200,0)']]); ctx.fillRect(sx - sw * 0.2, sy - sh * 0.2, sw * 1.4, sh * 1.4); ctx.restore();
    const cx = r.x + r.w * 0.5, cw = Math.min(r.w * 0.16, H * 0.6), cy = r.y + 4, ch = H * 0.9;
    ctx.fillStyle = '#2e4a46'; ctx.fillRect(cx - cw * 0.58, cy, cw * 1.16, ch); ctx.fillStyle = '#e8dcc0'; ctx.fillRect(cx - cw * 0.46, cy + ch * 0.06, cw * 0.92, ch * 0.86);
    ctx.fillStyle = 'rgba(40,40,44,0.5)'; ctx.beginPath(); ctx.moveTo(cx - cw * 0.46, cy + ch * 0.75); ctx.quadraticCurveTo(cx - cw * 0.1, cy + ch * 0.3, cx + cw * 0.1, cy + ch * 0.58); ctx.quadraticCurveTo(cx + cw * 0.25, cy + ch * 0.4, cx + cw * 0.46, cy + ch * 0.8); ctx.lineTo(cx + cw * 0.46, cy + ch * 0.92); ctx.lineTo(cx - cw * 0.46, cy + ch * 0.92); ctx.fill();
    ctx.strokeStyle = 'rgba(30,30,34,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + cw * 0.3, cy + ch * 0.9); ctx.quadraticCurveTo(cx + cw * 0.25, cy + ch * 0.6, cx + cw * 0.34, cy + ch * 0.44); ctx.stroke(); ctx.fillStyle = 'rgba(30,30,34,0.6)'; ell(ctx, cx + cw * 0.36, cy + ch * 0.44, cw * 0.16, ch * 0.05); ctx.fill();
    ctx.fillStyle = '#b02a1e'; ctx.fillRect(cx - cw * 0.4, cy + ch * 0.82, cw * 0.1, cw * 0.1);
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(cx - cw * 0.66, cy + ch, cw * 1.32, 4);
    const px = r.x + r.w * 0.72, pw = Math.max(14, H * 0.14); ctx.fillStyle = lg(ctx, px, 0, px + pw, 0, [[0, '#3a2514'], [0.5, '#7a5634'], [1, '#2e1c0e']]); ctx.fillRect(px, r.y, pw, H);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(px + pw * hash(k, 7), r.y); ctx.lineTo(px + pw * hash(k, 8), r.y + H); ctx.stroke(); }
    ctx.fillStyle = lg(ctx, 0, r.y + H * 0.84, 0, r.y + H, [[0, '#8a6a42'], [1, '#4a3018']]); ctx.fillRect(r.x + r.w * 0.64, r.y + H * 0.88, r.w * 0.36, H * 0.12);
  },
};

// ---- the scenes -------------------------------------------------------------------------------------------------------------------------------
const scenes = {
  'kc-sweet-sugarshack': { light: 'lamp', hang: [], wall: 'kc-sweet-shackwall', wallC: '#1c2a4a', floor: 'planks', floorC: '#6b4a30', litter: [], dock: ['kc-sweet-kettle', 'gauge', 'kc-sweet-sticks'], dockKind: 'tray', frame: 'rail', wave: 'triangle', pitch: 1.0,
    words: { caption: 'Pour and roll this taffy', hint: 'Pour steadily along the lit line', win: 'Worthy of the sugar shack', ok: 'Good taffy', retry: 'Try another batch' } },
  'kc-sweet-alcove': { light: 'window', hang: [], wall: 'kc-sweet-alcoveWall', wallC: '#c8b088', floor: 'planks', floorC: '#c7a470', litter: [], dock: ['kc-sweet-bera', 'kc-sweet-sankaku', 'kc-sweet-sanbon', 'kc-sweet-sieve', 'kc-sweet-tweezers'], dockKind: 'cloth', frame: 'tile', wave: 'sine', pitch: 1.2,
    words: { caption: 'Sculpt this sweet', hint: 'Tint, wrap, press, scrape and sift', win: 'Worthy of the tea room', ok: 'A fine sweet', retry: 'Knead again' } },
};
registerSceneSet({ scenes, walls, props, soundMat: { 'kc-sweet-sugarshack': 'clay', 'kc-sweet-alcove': 'clay' } });
void rgba; void mix;

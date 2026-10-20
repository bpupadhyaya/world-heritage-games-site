// shape-craft 1.16.0: papermaking workshops. `ebruatelier`: an Istanbul marbling atelier (blue and white tile wall, a line of marbled sheets, jars of paint).
// Pure canvas 2D, deterministic.
import { registerSceneSet } from './registry.js';
import { hash } from './geom.js';
import { tint, rgba, rrect } from './fx.js';
import { lg, rg, ell, cast, TAU } from './props.js';

// a small marbled sheet: cream ground, nested rings and combed waves in the given colours
function miniSheet(ctx, x, y, w, h, cols, seed) {
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 3; ctx.fillStyle = '#f6efe0'; ctx.fillRect(x, y, w, h); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  for (let k = 0; k < 6; k++) { const cx = x + w * (0.15 + 0.7 * hash(k, seed)), cy = y + h * (0.12 + 0.76 * hash(k, seed + 1)); for (let q = 3; q >= 1; q--) { ctx.fillStyle = cols[(k + q) % cols.length]; ell(ctx, cx, cy, w * 0.11 * q / 1.6, h * 0.09 * q / 1.6); ctx.fill(); } }
  ctx.strokeStyle = 'rgba(255,250,235,0.55)'; ctx.lineWidth = 1.2; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x, y + (h * (k + 0.5)) / 5); ctx.bezierCurveTo(x + w * 0.3, y + (h * (k + 0.2)) / 5, x + w * 0.7, y + (h * (k + 0.8)) / 5, x + w, y + (h * (k + 0.5)) / 5); ctx.stroke(); }
  ctx.restore();
}
const walls = {
  ebruwall(ctx, s, r, H, t) { // deep teal plaster, a blue and white tile band with eight-pointed stars, a line of marbled sheets drying, a shelf of paint jars
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.1)], [1, tint(s.wallC, -0.3)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let k = 0; k < 30; k++) { ctx.fillStyle = `rgba(0,0,0,${0.04 + 0.05 * hash(k, 3)})`; ell(ctx, r.x + r.w * hash(k, 1), r.y + H * hash(k, 2), 10 + 20 * hash(k, 4), 3 + 6 * hash(k, 5)); ctx.fill(); }
    const ty = r.y + H * 0.7, th = H * 0.3, ts = Math.min(th, 38);
    for (let x = r.x; x < r.x + r.w; x += ts) for (let y = ty; y < r.y + H; y += ts) { ctx.fillStyle = '#f2f0e6'; ctx.fillRect(x, y, ts, ts); ctx.strokeStyle = '#1f4aa0'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, ts - 1, ts - 1); ctx.fillStyle = '#1f6aa8'; ctx.beginPath(); for (let q = 0; q < 16; q++) { const a = (q * TAU) / 16, rr = q % 2 ? ts * 0.16 : ts * 0.36; ctx.lineTo(x + ts / 2 + Math.cos(a) * rr, y + ts / 2 + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.fillStyle = '#c62a2a'; ctx.beginPath(); ctx.arc(x + ts / 2, y + ts / 2, ts * 0.07, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#e8b53a'; ctx.fillRect(r.x, ty - 3, r.w, 3);
    // the drying line
    const ly = r.y + H * 0.1; ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r.x, ly); ctx.quadraticCurveTo(r.x + r.w * 0.5, ly + 14, r.x + r.w, ly); ctx.stroke();
    const PALS = [['#c62a2a', '#1f9aa6', '#e8b53a'], ['#243a82', '#e8b53a', '#c62a2a'], ['#1f9aa6', '#6a2a6a', '#f2e0c0'], ['#2f7a46', '#c62a2a', '#e8b53a']];
    const n = Math.max(3, Math.min(7, Math.round(r.w / 90))); for (let k = 0; k < n; k++) { const x = r.x + 20 + ((r.w - 70) * (k + 0.2)) / n, sy = ly + 6 + Math.sin(k * 1.7) * 3 + 8 * Math.sin((k / n) * Math.PI); ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 6, sy - 5); ctx.lineTo(x + 6, sy); ctx.stroke(); miniSheet(ctx, x, sy, 42, H * 0.34, PALS[k % 4], k * 9 + 3); }
    const sx0 = r.x + r.w * 0.04, sx1 = r.x + r.w * 0.5, sy2 = r.y + H * 0.66; ctx.fillStyle = lg(ctx, 0, sy2, 0, sy2 + 7, [[0, '#a8744a'], [1, '#3a2412']]); ctx.fillRect(sx0 - 4, sy2, sx1 - sx0 + 8, 7);
    const jn = Math.max(3, Math.min(7, Math.round((sx1 - sx0) / 36)));
    for (let k = 0; k < jn; k++) { const x = sx0 + ((sx1 - sx0) * (k + 0.5)) / jn, c = ['#c62a2a', '#1f9aa6', '#e8b53a', '#243a82'][k % 4], jh = 22 + 6 * hash(k, 5); cast(ctx, x + 3, sy2, 11, 3, 0.4); ctx.fillStyle = lg(ctx, x - 9, 0, x + 9, 0, [[0, tint(c, -0.4)], [0.35, tint(c, 0.25)], [1, tint(c, -0.5)]]); rrect(ctx, x - 9, sy2 - jh, 18, jh, 4); ctx.fill(); ctx.fillStyle = '#f6efe0'; ctx.fillRect(x - 9, sy2 - jh * 0.62, 18, jh * 0.25); ctx.fillStyle = '#3a2412'; ctx.fillRect(x - 7, sy2 - jh - 4, 14, 5); }
  },
};
walls.washiya = function (ctx, s, r, H, t) { // Japan: dark cedar boards, a shoji window, drying boards leaning with white sheets, a stack of paper on a shelf
  ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.08)], [1, tint(s.wallC, -0.28)]]); ctx.fillRect(r.x, r.y, r.w, H);
  for (let x = r.x; x < r.x + r.w; x += 30) { ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + H); ctx.stroke(); }
  const wx = r.x + r.w * 0.52, ww = r.w * 0.4, wy = r.y + H * 0.1, wh = H * 0.56; ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#fff6dc'], [1, '#e8dcc0']]); ctx.fillRect(wx, wy, ww, wh); ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 4; ctx.strokeRect(wx, wy, ww, wh); ctx.lineWidth = 2; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(wx + (ww * k) / 4, wy); ctx.lineTo(wx + (ww * k) / 4, wy + wh); ctx.stroke(); } for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(wx, wy + (wh * k) / 5); ctx.lineTo(wx + ww, wy + (wh * k) / 5); ctx.stroke(); }
  const n = Math.max(3, Math.min(6, Math.round(r.w * 0.45 / 34))); for (let k = 0; k < n; k++) { const x = r.x + 10 + k * 36, bh = H * 0.62; ctx.save(); ctx.translate(x, r.y + H); ctx.rotate(-0.06 + 0.02 * k); ctx.fillStyle = '#b08a52'; ctx.fillRect(0, -bh, 30, bh); ctx.fillStyle = '#fbf6e8'; ctx.fillRect(3, -bh + 5, 24, bh - 10); ctx.strokeStyle = 'rgba(120,100,60,0.4)'; ctx.lineWidth = 1; for (let q = 0; q < 8; q++) { ctx.beginPath(); ctx.moveTo(5, -bh + 10 + q * (bh / 9)); ctx.lineTo(25, -bh + 12 + q * (bh / 9)); ctx.stroke(); } ctx.restore(); }
};
walls.himal = function (ctx, s, r, H, t) { // Nepal: a pale sky and snow peaks above a stone-and-timber wall, drying screens leaning in the sun
  ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H * 0.6, [[0, '#8fc4e6'], [1, '#e8f2f8']]); ctx.fillRect(r.x, r.y, r.w, H * 0.62);
  ctx.fillStyle = '#e8eef4'; ctx.beginPath(); ctx.moveTo(r.x, r.y + H * 0.6); for (let k = 0; k <= 8; k++) ctx.lineTo(r.x + (r.w * k) / 8, r.y + H * (0.2 + 0.28 * Math.abs(Math.sin(k * 1.3 + 0.5)))); ctx.lineTo(r.x + r.w, r.y + H * 0.6); ctx.fill(); ctx.fillStyle = 'rgba(100,130,170,0.35)'; ctx.beginPath(); ctx.moveTo(r.x + r.w * 0.3, r.y + H * 0.6); ctx.lineTo(r.x + r.w * 0.44, r.y + H * 0.28); ctx.lineTo(r.x + r.w * 0.58, r.y + H * 0.6); ctx.fill();
  ctx.fillStyle = '#5a7a4a'; ctx.beginPath(); ctx.moveTo(r.x, r.y + H * 0.66); for (let k = 0; k <= 10; k++) ctx.lineTo(r.x + (r.w * k) / 10, r.y + H * (0.6 + 0.04 * Math.sin(k * 2))); ctx.lineTo(r.x + r.w, r.y + H * 0.7); ctx.lineTo(r.x, r.y + H * 0.7); ctx.fill();
  ctx.fillStyle = lg(ctx, 0, r.y + H * 0.66, 0, r.y + H, [[0, '#a89880'], [1, '#6a5a44']]); ctx.fillRect(r.x, r.y + H * 0.66, r.w, H * 0.34);
  for (let y = r.y + H * 0.7; y < r.y + H; y += 14) for (let x = r.x + (Math.floor(y / 14) % 2) * 17; x < r.x + r.w; x += 34) { ctx.strokeStyle = 'rgba(40,30,20,0.4)'; ctx.lineWidth = 1.5; rrect(ctx, x, y, 32, 12, 3); ctx.stroke(); }
  const n = Math.max(3, Math.min(6, Math.round(r.w * 0.5 / 42))); for (let k = 0; k < n; k++) { const x = r.x + r.w * 0.06 + k * 44, bh = H * 0.5; ctx.save(); ctx.translate(x, r.y + H); ctx.rotate(-0.1 + 0.02 * k); ctx.fillStyle = '#5a3a1a'; ctx.fillRect(0, -bh, 38, bh); ctx.fillStyle = '#f4ecd6'; ctx.fillRect(3, -bh + 3, 32, bh - 6); ctx.restore(); }
};
walls.hanok = function (ctx, s, r, H, t) { // Korea: a lattice of wooden frames with warm paper panels, wooden beams and a shelf of paper rolls
  ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.05)], [1, tint(s.wallC, -0.3)]]); ctx.fillRect(r.x, r.y, r.w, H);
  const dw = Math.min(120, r.w * 0.2), n = Math.max(2, Math.floor((r.w * 0.6) / dw)); for (let k = 0; k < n; k++) { const x = r.x + r.w * 0.38 + k * (dw + 6), y = r.y + H * 0.1, hh = H * 0.8; ctx.fillStyle = lg(ctx, 0, y, 0, y + hh, [[0, '#fff3d0'], [1, '#f0d8a0']]); ctx.fillRect(x, y, dw, hh); ctx.strokeStyle = '#4a2c14'; ctx.lineWidth = 3; ctx.strokeRect(x, y, dw, hh); ctx.lineWidth = 2; for (let q = 1; q < 4; q++) { ctx.beginPath(); ctx.moveTo(x + (dw * q) / 4, y); ctx.lineTo(x + (dw * q) / 4, y + hh); ctx.stroke(); } for (let q = 1; q < 7; q++) { ctx.beginPath(); ctx.moveTo(x, y + (hh * q) / 7); ctx.lineTo(x + dw, y + (hh * q) / 7); ctx.stroke(); } ctx.fillStyle = 'rgba(255,230,170,0.15)'; ctx.fillRect(x, y, dw, hh); }
  ctx.fillStyle = '#3a2412'; ctx.fillRect(r.x, r.y, r.w, 7); ctx.fillRect(r.x, r.y + H - 6, r.w, 6);
  const sx0 = r.x + r.w * 0.03, sx1 = r.x + r.w * 0.34, sy = r.y + H * 0.7; ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 7, [[0, '#a8744a'], [1, '#3a2412']]); ctx.fillRect(sx0 - 4, sy, sx1 - sx0 + 8, 7); const nn = Math.max(2, Math.min(5, Math.round((sx1 - sx0) / 24))); for (let k = 0; k < nn; k++) { const x = sx0 + ((sx1 - sx0) * (k + 0.5)) / nn; ctx.fillStyle = lg(ctx, x - 8, 0, x + 8, 0, [[0, '#cfc0a0'], [0.4, '#fbf2dc'], [1, '#a89878']]); ctx.fillRect(x - 8, sy - 40, 16, 40); ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x - 8, sy - 40, 16, 3); ctx.fillRect(x - 8, sy - 3, 16, 3); }
};
walls.papiermolen = function (ctx, s, r, H, t) { // Netherlands: whitewashed planks, a window onto a windmill with turning sails, beams, sheets hung to dry on a line
  ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#f2ede0'], [1, '#d2c8b0']]); ctx.fillRect(r.x, r.y, r.w, H);
  for (let x = r.x; x < r.x + r.w; x += 26) { ctx.strokeStyle = 'rgba(90,70,40,0.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + H); ctx.stroke(); }
  ctx.fillStyle = '#3a2a1a'; ctx.fillRect(r.x, r.y, r.w, 9); ctx.fillRect(r.x, r.y + H * 0.64, r.w, 6);
  const wx = r.x + r.w * 0.55, ww = r.w * 0.36, wy = r.y + H * 0.14, wh = H * 0.44; ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#a8d0ee'], [1, '#e8f2f8']]); ctx.fillRect(wx, wy, ww, wh);
  ctx.fillStyle = '#6a8a4a'; ctx.fillRect(wx, wy + wh * 0.8, ww, wh * 0.2); const mx = wx + ww * 0.5, my = wy + wh * 0.8; ctx.fillStyle = '#8a3a2a'; ctx.beginPath(); ctx.moveTo(mx - 16, my); ctx.lineTo(mx - 10, my - wh * 0.45); ctx.lineTo(mx + 10, my - wh * 0.45); ctx.lineTo(mx + 16, my); ctx.fill(); ctx.fillStyle = '#4a2a1a'; ctx.beginPath(); ctx.moveTo(mx - 12, my - wh * 0.45); ctx.lineTo(mx, my - wh * 0.6); ctx.lineTo(mx + 12, my - wh * 0.45); ctx.fill();
  ctx.save(); ctx.translate(mx, my - wh * 0.42); ctx.rotate((t ?? 0) * 0.3); ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -wh * 0.5); ctx.stroke(); ctx.fillStyle = 'rgba(240,236,220,0.9)'; ctx.fillRect(-4, -wh * 0.5, 8, wh * 0.36); } ctx.restore();
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 6; ctx.strokeRect(wx, wy, ww, wh); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.stroke();
  const ly = r.y + H * 0.7; ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(r.x, ly); ctx.lineTo(r.x + r.w, ly + 4); ctx.stroke(); const n = Math.max(3, Math.min(8, Math.round(r.w / 60))); for (let k = 0; k < n; k++) { const x = r.x + 12 + ((r.w - 40) * k) / n; ctx.fillStyle = '#fbf6e8'; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 4; ctx.fillRect(x, ly + 2, 26, H * 0.24); ctx.restore(); }
};
walls.fale = function (ctx, s, r, H, t) { // Tonga: an open house under a thatched eave, a blue sea and palms beyond, lengths of patterned bark cloth hung on a line
  ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H * 0.6, [[0, '#7ec4ea'], [1, '#d8f0f6']]); ctx.fillRect(r.x, r.y, r.w, H * 0.6);
  ctx.fillStyle = lg(ctx, 0, r.y + H * 0.42, 0, r.y + H * 0.64, [[0, '#2a9ab8'], [1, '#17708a']]); ctx.fillRect(r.x, r.y + H * 0.42, r.w, H * 0.22); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.2; for (let k = 0; k < 8; k++) { const yy = r.y + H * (0.46 + 0.02 * k), off = ((t ?? 0) * 6 + k * 23) % 60; ctx.beginPath(); for (let x = r.x - 60 + off; x < r.x + r.w; x += 60) { ctx.moveTo(x, yy); ctx.quadraticCurveTo(x + 15, yy - 3, x + 30, yy); } ctx.stroke(); }
  ctx.fillStyle = '#e8d6a0'; ctx.beginPath(); ctx.moveTo(r.x, r.y + H * 0.64); ctx.quadraticCurveTo(r.x + r.w * 0.5, r.y + H * 0.58, r.x + r.w, r.y + H * 0.64); ctx.lineTo(r.x + r.w, r.y + H); ctx.lineTo(r.x, r.y + H); ctx.fill();
  for (const [fx, sc] of [[0.12, 1], [0.86, 0.85]]) { const px = r.x + r.w * fx, py = r.y + H * 0.66, ph = H * 0.5 * sc; ctx.strokeStyle = '#5a3e22'; ctx.lineWidth = 5 * sc; ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + ph * 0.1, py - ph * 0.5, px + ph * 0.05, py - ph); ctx.stroke(); ctx.strokeStyle = '#2f7a3a'; ctx.lineWidth = 3 * sc; for (let q = 0; q < 7; q++) { const a = -Math.PI / 2 + (q - 3) * 0.5, l = ph * 0.38; ctx.beginPath(); ctx.moveTo(px + ph * 0.05, py - ph); ctx.quadraticCurveTo(px + ph * 0.05 + Math.cos(a) * l * 0.6, py - ph + Math.sin(a) * l * 0.4 - 6, px + ph * 0.05 + Math.cos(a) * l, py - ph + Math.sin(a) * l * 0.6 + 12); ctx.stroke(); } }
  ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H * 0.16, [[0, '#6a4a22'], [1, '#a87a3c']]); ctx.fillRect(r.x, r.y, r.w, H * 0.14); for (let x = r.x; x < r.x + r.w; x += 9) { ctx.strokeStyle = 'rgba(40,24,6,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x + 3, r.y + H * 0.14 + 8 * hash(x, 3)); ctx.stroke(); }
  ctx.fillStyle = '#4a2e14'; ctx.fillRect(r.x, r.y, 12, H); ctx.fillRect(r.x + r.w - 12, r.y, 12, H);
  const ly = r.y + H * 0.2; ctx.strokeStyle = '#3a2610'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r.x + 12, ly); ctx.quadraticCurveTo(r.x + r.w * 0.5, ly + 12, r.x + r.w - 12, ly); ctx.stroke(); const n = Math.max(3, Math.min(6, Math.round(r.w / 100)));
  for (let k = 0; k < n; k++) { const x = r.x + 24 + ((r.w - 70) * (k + 0.1)) / n, w2 = (r.w - 70) / n - 10, hh = H * (0.28 + 0.06 * hash(k, 6)); ctx.fillStyle = k % 2 ? '#d8b888' : '#c89c6a'; ctx.fillRect(x, ly + 6, w2, hh); ctx.fillStyle = '#2a1a0c'; for (let q = 0; q < 5; q++) { const yy = ly + 6 + (hh * (q + 0.5)) / 5; if (k % 2) { for (let p = 0; p < 4; p++) { ctx.beginPath(); ctx.moveTo(x + w2 * (p + 0.5) / 4, yy - 7); ctx.lineTo(x + w2 * (p + 0.5) / 4 + 6, yy); ctx.lineTo(x + w2 * (p + 0.5) / 4, yy + 7); ctx.lineTo(x + w2 * (p + 0.5) / 4 - 6, yy); ctx.fill(); } } else { ctx.fillRect(x + 4, yy - 2, w2 - 8, 4); ctx.fillRect(x + w2 * 0.5 - 2, yy - 8, 4, 16); } } ctx.strokeStyle = 'rgba(40,20,6,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(x, ly + 6, w2, hh); }
};
walls.antaimoro = function (ctx, s, r, H, t) { // Madagascar: red-earth hills under a bright sky, a thatched house, frames of flower paper leaning in the sun
  ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H * 0.6, [[0, '#6ab2e6'], [1, '#f2e8c8']]); ctx.fillRect(r.x, r.y, r.w, H * 0.6);
  ctx.fillStyle = rg(ctx, r.x + r.w * 0.8, r.y + H * 0.14, 2, 60, [[0, 'rgba(255,248,200,0.95)'], [1, 'rgba(255,240,180,0)']]); ell(ctx, r.x + r.w * 0.8, r.y + H * 0.14, 60, 60); ctx.fill();
  for (let k = 0; k < 3; k++) { ctx.fillStyle = ['#b0522c', '#9a4420', '#7a3418'][k]; ctx.beginPath(); ctx.moveTo(r.x, r.y + H * (0.5 + 0.1 * k)); for (let q = 0; q <= 8; q++) ctx.lineTo(r.x + (r.w * q) / 8, r.y + H * (0.4 + 0.1 * k + 0.08 * Math.sin(q * 1.3 + k * 2))); ctx.lineTo(r.x + r.w, r.y + H); ctx.lineTo(r.x, r.y + H); ctx.fill(); }
  const hx = r.x + r.w * 0.12, hy = r.y + H * 0.62; ctx.fillStyle = '#c8a060'; ctx.fillRect(hx, hy - H * 0.14, r.w * 0.2, H * 0.14); ctx.fillStyle = '#7a5a2a'; ctx.beginPath(); ctx.moveTo(hx - 12, hy - H * 0.14); ctx.lineTo(hx + r.w * 0.1, hy - H * 0.3); ctx.lineTo(hx + r.w * 0.2 + 12, hy - H * 0.14); ctx.fill(); ctx.fillStyle = '#3a2410'; ctx.fillRect(hx + r.w * 0.08, hy - H * 0.09, r.w * 0.04, H * 0.09);
  for (let k = 0; k < 4; k++) { const x = r.x + r.w * (0.46 + 0.1 * k), y = r.y + H * 0.98; ctx.save(); ctx.translate(x, y); ctx.rotate(-0.1 + 0.05 * k); ctx.fillStyle = '#e8d6a0'; ctx.fillRect(0, -H * 0.4, r.w * 0.08, H * 0.4); ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 3; ctx.strokeRect(0, -H * 0.4, r.w * 0.08, H * 0.4); const FC = ['#c8283a', '#f0b82a', '#d86aa0', '#f07a28']; for (let q = 0; q < 5; q++) { ctx.fillStyle = FC[(k + q) % 4]; ell(ctx, r.w * 0.04 * (0.5 + hash(q, k)), -H * (0.06 + 0.07 * q), 5, 5); ctx.fill(); } ctx.restore(); }
  ctx.strokeStyle = '#2f7a3a'; ctx.lineWidth = 3; for (let q = 0; q < 9; q++) { const a = -Math.PI * (0.15 + 0.7 * q / 8); ctx.beginPath(); ctx.moveTo(r.x + r.w * 0.94, r.y + H * 0.98); ctx.quadraticCurveTo(r.x + r.w * 0.94 + Math.cos(a) * 40, r.y + H * 0.98 + Math.sin(a) * 60, r.x + r.w * 0.94 + Math.cos(a) * 70, r.y + H * 0.98 + Math.sin(a) * 100); ctx.stroke(); }
};
const floorKinds = {};
const W = (c, win, ok) => ({ caption: c, win, ok, retry: 'Back to the tray' });
const W2 = (c, win, ok) => ({ caption: c, win, ok, retry: 'Back to the vat' });
const scenes = {
  washiya: { wall: 'washiya', wallC: '#4a3220', floor: 'planks', floorC: '#6a5238', light: 'window', litter: [{ k: 'grass', c: '#e8dcc0' }], dock: ['sponge', 'trowel', 'paper', 'brush:#7a5a3a', 'vat'], dockKind: 'tray', frame: 'rail',
    mouldC: '#c8a468', vatC: '#5a3c22', feltC: '#d8cfba', words: W2('Make this sheet', 'A sheet worth writing on', 'A good sheet'), pitch: 1.0, wave: 'sine' },
  himal: { wall: 'himal', wallC: '#8a7a64', floor: 'slab', floorC: '#8a8070', light: 'window', litter: [{ k: 'grass', c: '#d8cc9a' }], dock: ['trowel', 'sponge', 'paper', 'stone', 'vat'], dockKind: 'ledge', frame: 'plinth',
    mouldC: '#9a7a4a', vatC: '#6a6a60', feltC: '#b8a888', words: W2('Make this sheet', 'A sheet that holds fine', 'A good sheet'), pitch: 0.9, wave: 'triangle' },
  hanok: { wall: 'hanok', wallC: '#6a4426', floor: 'planks', floorC: '#8a6a44', light: 'lamp', litter: [{ k: 'shavings', c: '#f2e6c8' }], dock: ['sponge', 'paper', 'brush:#4a3220', 'stone', 'vat'], dockKind: 'tray', frame: 'case',
    mouldC: '#b08a50', vatC: '#4a3220', feltC: '#8a8a86', words: W2('Make this sheet', 'A sheet for a window', 'A good sheet'), pitch: 0.95, wave: 'triangle' },
  papiermolen: { wall: 'papiermolen', wallC: '#d8cdb4', floor: 'planks', floorC: '#7a5a3a', light: 'window', litter: [{ k: 'scraps', c: '#f0e8d4' }], dock: ['sponge', 'paper', 'press', 'knife', 'vat'], dockKind: 'tray', frame: 'rail',
    mouldC: '#8a6a3a', vatC: '#3a2a1a', feltC: '#8a7a5a', words: W2('Make this sheet', 'A sheet for the book', 'A good sheet'), pitch: 1.1, wave: 'triangle' },
  fale: { wall: 'fale', wallC: '#a87a3c', floor: 'planks', floorC: '#9a7448', light: 'window', litter: [{ k: 'scraps', c: '#c89c6a' }], dock: ['stone', 'sponge', 'paper', 'brush:#2a1a0c', 'vat'], dockKind: 'tray', frame: 'rail',
    mouldC: '#6a4a28', vatC: '#9a7448', feltC: '#8a7a5a', words: { caption: 'Beat this cloth', win: 'A cloth for a gift', ok: 'A good cloth', retry: 'Back to the board' }, pitch: 0.8, wave: 'triangle' },
  antaimoro: { wall: 'antaimoro', wallC: '#b0522c', floor: 'planks', floorC: '#8a5a34', light: 'window', litter: [{ k: 'scraps', c: '#f0d890' }], dock: ['trowel', 'sponge', 'paper', 'brush:#7a5a3a', 'vat'], dockKind: 'tray', frame: 'rail',
    mouldC: '#b08a50', vatC: '#a0643a', feltC: '#8a7a5a', words: { caption: 'Make this sheet', win: 'A sheet with flowers in it', ok: 'A good sheet', retry: 'Back to the screen' }, pitch: 1.1, wave: 'sine' },
  ebruatelier: { wall: 'ebruwall', wallC: '#1c5a66', floor: 'planks', floorC: '#6a4a30', light: 'window', litter: [{ k: 'splash', c: '#c62a2a' }], dock: ['brush:#14100e', 'pins', 'pot:#c62a2a', 'pot:#1f9aa6', 'pot:#e8b53a', 'pot:#243a82'], dockKind: 'tray', frame: 'rail',
    trayC: '#b8742a', sizeC: '#dfe9ec', words: W('Marble this pattern', 'A sheet worth framing', 'A good print'), pitch: 1.0, wave: 'sine' },
};
registerSceneSet({
  scenes: Object.fromEntries(Object.entries(scenes).map(([id, s]) => [id, { ...s, hang: [] }])),
  rules: [['fale', /ngatu|bark ?cloth|tapa/i], ['antaimoro', /antaimoro|flower paper/i], ['ebruatelier', /ebru|marbl/i], ['washiya', /washi|nagashi|kozo|sekishu|echizen|hosokawa/i], ['himal', /lokta|dezo|tibetan|monpa/i], ['hanok', /hanji/i], ['papiermolen', /papierscheppen|paper mill|dutch/i]],
  walls, floorKinds,
  soundMat: { fale: 'wood', antaimoro: 'wood', ebruatelier: 'wood', washiya: 'wood', himal: 'stone', hanok: 'wood', papiermolen: 'wood' },
});

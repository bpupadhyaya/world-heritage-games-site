// shape-craft 1.25.0: scribes' rooms for the lettering designs of paint-figures/script.js (registerSceneSet). Each has its own wall, floor, light and
// tools, so no two writing games share a backdrop. Pure canvas 2D, deterministic.
import { registerSceneSet } from './registry.js';
import { hash } from './geom.js';
import { tint, rgba, rrect } from './fx.js';
import { lg, rg, ell, cast, TAU } from './props.js';

const props = {
  reedstylus(ctx, s) { // a cut reed whose end is trimmed to a triangle, for pressing wedges into clay
    const h = s * 0.05;
    rrect(ctx, -s / 2, -h / 2, s * 0.86, h, h / 2); ctx.fillStyle = lg(ctx, 0, -h / 2, 0, h / 2, [[0, '#d8c48c'], [0.5, '#a88a50'], [1, '#5a4624']]); ctx.fill();
    ctx.strokeStyle = 'rgba(60,40,10,0.5)'; ctx.lineWidth = 1.2; for (const f of [-0.2, 0.1]) { ctx.beginPath(); ctx.moveTo(s * f, -h / 2); ctx.lineTo(s * f, h / 2); ctx.stroke(); }
    ctx.fillStyle = lg(ctx, 0, -h / 2, 0, h / 2, [[0, '#e8d8a0'], [1, '#6a5430']]); ctx.beginPath(); ctx.moveTo(s * 0.34, -h / 2); ctx.lineTo(s / 2, -h * 0.5); ctx.lineTo(s * 0.5, h * 0.5); ctx.lineTo(s * 0.34, h / 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2a1a0a'; ctx.beginPath(); ctx.moveTo(s * 0.48, -h * 0.5); ctx.lineTo(s * 0.5, 0); ctx.lineTo(s * 0.48, h * 0.5); ctx.closePath(); ctx.fill();
  },
  pengutik(ctx, s) { // a Balinese writing knife: a short wooden handle and a fine steel point
    const h = s * 0.07;
    rrect(ctx, -s / 2, -h / 2, s * 0.62, h, h / 2); ctx.fillStyle = lg(ctx, 0, -h / 2, 0, h / 2, [[0, '#b8884a'], [0.5, '#7a4a22'], [1, '#3a2010']]); ctx.fill();
    ctx.fillStyle = lg(ctx, 0, -h * 0.3, 0, h * 0.3, [[0, '#f1f5f8'], [0.5, '#aeb8c2'], [1, '#626c76']]); ctx.beginPath(); ctx.moveTo(s * 0.12, -h * 0.28); ctx.lineTo(s * 0.5, -h * 0.03); ctx.lineTo(s * 0.5, h * 0.03); ctx.lineTo(s * 0.12, h * 0.28); ctx.closePath(); ctx.fill();
  },
  burnisher(ctx, s) { // an agate burnisher on a wooden handle: it polishes the laid leaf to a mirror
    const h = s * 0.075;
    rrect(ctx, -s / 2, -h / 2, s * 0.6, h, h / 2); ctx.fillStyle = lg(ctx, 0, -h / 2, 0, h / 2, [[0, '#b8884a'], [0.5, '#7a4a22'], [1, '#3a2010']]); ctx.fill();
    ctx.fillStyle = lg(ctx, 0, -h * 0.9, 0, h * 0.9, [[0, '#f0a070'], [0.45, '#c05a38'], [1, '#6a2a18']]); ctx.beginPath(); ctx.moveTo(s * 0.08, -h * 0.5); ctx.quadraticCurveTo(s * 0.34, -h * 1.1, s / 2, -h * 0.1); ctx.quadraticCurveTo(s * 0.34, h * 1.0, s * 0.08, h * 0.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(s * 0.28, -h * 0.35, s * 0.07, h * 0.16, -0.1, 0, TAU); ctx.fill();
  },
  inkhorn(ctx, s) { // a little horn of ink with a stopper
    const r = s * 0.22; cast(ctx, 2, r * 0.9, r * 1.0, r * 0.26);
    ctx.fillStyle = lg(ctx, -r, 0, r, 0, [[0, '#2a1c10'], [0.4, '#6a4a2a'], [1, '#1c120a']]); ctx.beginPath(); ctx.moveTo(-r * 0.9, r * 0.7); ctx.quadraticCurveTo(-r * 1.1, -r * 0.4, -r * 0.4, -r * 0.8); ctx.lineTo(r * 0.4, -r * 0.8); ctx.quadraticCurveTo(r * 1.1, -r * 0.4, r * 0.9, r * 0.7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0a0806'; ell(ctx, 0, -r * 0.8, r * 0.42, r * 0.14); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ell(ctx, -r * 0.4, -r * 0.1, r * 0.12, r * 0.32); ctx.fill();
  },
};

const walls = {
  edubba(ctx, s, r, H, t) { // a Babylonian scribal school: mud-brick courses, an arched niche of clay tablets, a hanging oil lamp
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.1)], [1, tint(s.wallC, -0.32)]]); ctx.fillRect(r.x, r.y, r.w, H);
    const bh = 24, bw = 58;
    for (let y = r.y, j = 0; y < r.y + H; y += bh, j++) for (let x = r.x - (j % 2 ? bw / 2 : 0); x < r.x + r.w; x += bw) {
      const k = hash(Math.round(x), j, 7); ctx.fillStyle = `rgba(${k > 0.5 ? '255,230,180' : '60,34,14'},${0.04 + 0.06 * k})`; ctx.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3);
      ctx.strokeStyle = 'rgba(50,28,10,0.38)'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, bw, bh);
    }
    const nx = r.x + r.w * 0.52, nw = Math.min(r.w * 0.4, H * 0.9), ny = r.y + H * 0.1, nh = H * 0.7;
    ctx.fillStyle = '#1e1008'; ctx.beginPath(); ctx.moveTo(nx, ny + nh); ctx.lineTo(nx, ny + nh * 0.3); ctx.quadraticCurveTo(nx, ny, nx + nw / 2, ny); ctx.quadraticCurveTo(nx + nw, ny, nx + nw, ny + nh * 0.3); ctx.lineTo(nx + nw, ny + nh); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#5a3a1c'; ctx.lineWidth = 4; ctx.stroke();
    for (let q = 0; q < 3; q++) { const sy = ny + nh * (0.42 + 0.22 * q); ctx.fillStyle = '#4a2e14'; ctx.fillRect(nx + 3, sy, nw - 6, 5);
      const n = 4 - (q % 2); for (let k = 0; k < n; k++) { const x = nx + nw * ((k + 0.5) / n), tw = nw / (n + 0.6), th = nh * 0.12; ctx.fillStyle = lg(ctx, x - tw / 2, sy - th, x + tw / 2, sy, [[0, '#d8b078'], [1, '#8a5e32']]); rrect(ctx, x - tw / 2, sy - th, tw, th, th * 0.3); ctx.fill(); ctx.strokeStyle = 'rgba(40,20,6,0.45)'; ctx.lineWidth = 1; ctx.stroke(); ctx.strokeStyle = 'rgba(40,20,6,0.5)'; for (let l = 1; l < 4; l++) { ctx.beginPath(); ctx.moveTo(x - tw * 0.38, sy - th + (th * l) / 4); ctx.lineTo(x + tw * 0.38, sy - th + (th * l) / 4); ctx.stroke(); } } }
    const lx = r.x + r.w * 0.2, ly = r.y + H * 0.46; ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(lx, r.y); ctx.lineTo(lx, ly - 10); ctx.stroke();
    ctx.fillStyle = rg(ctx, lx, ly, 1, 44, [[0, 'rgba(255,214,120,0.7)'], [1, 'rgba(255,150,50,0)']]); ell(ctx, lx, ly, 44, 44); ctx.fill();
    ctx.fillStyle = lg(ctx, lx - 12, 0, lx + 12, 0, [[0, '#8a5a2a'], [0.5, '#d8a060'], [1, '#6a4020']]); ctx.beginPath(); ctx.ellipse(lx, ly, 12, 6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffd36a'; ctx.beginPath(); ctx.moveTo(lx + 8, ly - 3); ctx.quadraticCurveTo(lx + 14, ly - 9, lx + 11, ly - 14); ctx.quadraticCurveTo(lx + 9, ly - 8, lx + 8, ly - 3); ctx.fill();
  },
  rushnyk(ctx, s, r, H, t) { // a Ukrainian hut: whitewashed clay wall, a blue-framed window, an embroidered towel, a clay pot of sunflowers
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.08)], [1, tint(s.wallC, -0.2)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let k = 0; k < 18; k++) { ctx.fillStyle = `rgba(120,100,70,${0.03 + 0.04 * hash(k, 3)})`; ell(ctx, r.x + r.w * hash(k, 1), r.y + H * hash(k, 2), 16 + 26 * hash(k, 4), 5 + 8 * hash(k, 5)); ctx.fill(); }
    const wx = r.x + r.w * 0.06, ww = Math.min(r.w * 0.26, H * 0.62), wy = r.y + H * 0.12, wh = H * 0.5;
    ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#cfe4f2'], [1, '#7fa6c4']]); ctx.fillRect(wx, wy, ww, wh); ctx.strokeStyle = '#2a58a8'; ctx.lineWidth = 6; ctx.strokeRect(wx, wy, ww, wh); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
    const tx = r.x + r.w * 0.5, tw = Math.min(r.w * 0.2, H * 0.34), ty = r.y + H * 0.04, th = H * 0.74;
    ctx.fillStyle = '#f6efe0'; ctx.fillRect(tx, ty, tw, th); ctx.fillStyle = '#b3232a'; for (let k = 0; k < 6; k++) { const yy = ty + th * (0.12 + 0.14 * k); ctx.beginPath(); ctx.moveTo(tx + tw / 2, yy - tw * 0.2); ctx.lineTo(tx + tw * 0.8, yy); ctx.lineTo(tx + tw / 2, yy + tw * 0.2); ctx.lineTo(tx + tw * 0.2, yy); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#16100e'; ctx.fillRect(tx, ty, tw * 0.1, th); ctx.fillRect(tx + tw * 0.9, ty, tw * 0.1, th); ctx.fillStyle = '#b3232a'; for (let k = 0; k < 8; k++) { ctx.fillRect(tx + tw * 0.02, ty + th * (k / 8), tw * 0.06, th / 16); ctx.fillRect(tx + tw * 0.92, ty + th * (k / 8), tw * 0.06, th / 16); }
    ctx.strokeStyle = '#d8c8a8'; ctx.lineWidth = 3; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(tx + (tw * k) / 4, ty + th); ctx.lineTo(tx + (tw * k) / 4, ty + th + 12); ctx.stroke(); }
    const px = r.x + r.w * 0.86, py = r.y + H * 0.84; cast(ctx, px + 3, py + H * 0.1, H * 0.13, 3, 0.35);
    ctx.fillStyle = rg(ctx, px - 5, py - 5, 2, H * 0.2, [[0, '#d8946a'], [1, '#6a3418']]); ctx.beginPath(); ctx.moveTo(px - H * 0.07, py - H * 0.08); ctx.lineTo(px + H * 0.07, py - H * 0.08); ctx.quadraticCurveTo(px + H * 0.12, py + H * 0.05, px + H * 0.05, py + H * 0.1); ctx.lineTo(px - H * 0.05, py + H * 0.1); ctx.quadraticCurveTo(px - H * 0.12, py + H * 0.05, px - H * 0.07, py - H * 0.08); ctx.fill();
    for (let k = 0; k < 3; k++) { const fx = px - H * 0.07 + k * H * 0.07, fy = py - H * 0.2 - (k % 2) * H * 0.05; ctx.strokeStyle = '#3a6a2a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(fx, py - H * 0.08); ctx.lineTo(fx, fy); ctx.stroke(); ctx.fillStyle = '#e8a820'; ell(ctx, fx, fy, H * 0.045, H * 0.045); ctx.fill(); ctx.fillStyle = '#4a2c10'; ell(ctx, fx, fy, H * 0.022, H * 0.022); ctx.fill(); }
  },
};

walls.karkhana = function (ctx, s, r, H, t) { // an illuminator's workshop: deep teal wall with a gold stencilled band, a shelf of pigment jars, a book of gold leaf
  ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.08)], [1, tint(s.wallC, -0.3)]]); ctx.fillRect(r.x, r.y, r.w, H);
  ctx.strokeStyle = 'rgba(224,178,70,0.55)'; ctx.lineWidth = 2; const ty = r.y + H * 0.12, step = 40;
  for (let x = r.x; x < r.x + r.w + step; x += step) { ctx.beginPath(); ctx.arc(x, ty + 16, 15, 0, TAU); ctx.moveTo(x - 15, ty + 16); ctx.quadraticCurveTo(x - step / 2, ty, x - step + 15, ty + 16); ctx.stroke(); }
  for (let y = ty + 44; y < r.y + H; y += 30) { ctx.strokeStyle = 'rgba(224,178,70,0.12)'; ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke(); }
  const sy = r.y + H * 0.8, sx0 = r.x + r.w * 0.04, sx1 = r.x + r.w * 0.46; ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 8, [[0, '#b88a50'], [1, '#3a2410']]); ctx.fillRect(sx0, sy, sx1 - sx0, 8);
  const cols = ['#1f3f96', '#1b8a8a', '#b8281f', '#2f7a46', '#dcab32'], n = Math.max(3, Math.min(5, Math.round((sx1 - sx0) / 40)));
  for (let k = 0; k < n; k++) { const x = sx0 + ((sx1 - sx0) * (k + 0.5)) / n, h2 = H * (0.12 + 0.02 * hash(k, 6)); cast(ctx, x + 2, sy, h2 * 0.4, 2, 0.35); ctx.fillStyle = lg(ctx, x - h2 * 0.3, 0, x + h2 * 0.3, 0, [[0, '#d8d0c0'], [0.4, '#fff'], [1, '#9a9080']]); rrect(ctx, x - h2 * 0.32, sy - h2 * 0.9, h2 * 0.64, h2 * 0.9, 5); ctx.fill(); ctx.fillStyle = cols[k % 5]; rrect(ctx, x - h2 * 0.26, sy - h2 * 0.7, h2 * 0.52, h2 * 0.3, 3); ctx.fill(); }
  const bx = r.x + r.w * 0.58, by = r.y + H * 0.36, bw = Math.min(r.w * 0.26, H * 0.5), bh = bw * 0.78;
  ctx.fillStyle = '#5a1620'; rrect(ctx, bx, by, bw, bh, 5); ctx.fill(); ctx.fillStyle = '#f2e6c4'; ctx.fillRect(bx + 5, by + 5, bw - 8, bh - 10);
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { ctx.fillStyle = lg(ctx, 0, by, 0, by + bh, [[0, '#f6dc7a'], [1, '#b8882a']]); ctx.fillRect(bx + 10 + a * (bw - 24) / 3, by + 10 + b * (bh - 26) / 3, (bw - 30) / 3, (bh - 32) / 3); }
};
walls.bale = function (ctx, s, r, H, t) { // a Balinese writer's pavilion: woven bamboo wall, a carved wooden post, banana-leaf shadows, a hanging oil lamp, a bundle of leaf strips
  ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.1)], [1, tint(s.wallC, -0.28)]]); ctx.fillRect(r.x, r.y, r.w, H);
  for (let y = r.y, j = 0; y < r.y + H; y += 14, j++) for (let x = r.x + (j % 2) * 14; x < r.x + r.w; x += 28) { ctx.strokeStyle = 'rgba(60,34,10,0.3)'; ctx.lineWidth = 1.4; ctx.strokeRect(x, y, 28, 14); ctx.fillStyle = `rgba(255,230,160,${0.03 + 0.05 * hash(Math.round(x), j, 3)})`; ctx.fillRect(x + 1, y + 1, 26, 12); }
  const px = r.x + r.w * 0.04; ctx.fillStyle = lg(ctx, px, 0, px + 34, 0, [[0, '#4a2a12'], [0.4, '#8a5a2a'], [1, '#3a2010']]); ctx.fillRect(px, r.y, 34, H); ctx.strokeStyle = 'rgba(224,178,70,0.7)'; ctx.lineWidth = 1.6; for (let k = 0; k < 6; k++) { const y = r.y + H * (0.12 + 0.13 * k); ctx.beginPath(); ctx.arc(px + 17, y, 9, 0, TAU); ctx.moveTo(px + 17, y - 9); ctx.lineTo(px + 17, y + 9); ctx.stroke(); }
  ctx.fillStyle = 'rgba(20,50,20,0.22)'; for (let k = 0; k < 4; k++) { ctx.save(); ctx.translate(r.x + r.w * (0.4 + 0.13 * k), r.y + H * 0.1); ctx.rotate(0.5 + k * 0.2); ctx.beginPath(); ctx.ellipse(0, 40, 14, 70, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  const lx = r.x + r.w * 0.22, ly = r.y + H * 0.5; ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(lx, r.y); ctx.lineTo(lx, ly - 12); ctx.stroke();
  ctx.fillStyle = rg(ctx, lx, ly, 1, 46, [[0, 'rgba(255,214,120,0.7)'], [1, 'rgba(255,150,50,0)']]); ell(ctx, lx, ly, 46, 46); ctx.fill(); ctx.fillStyle = lg(ctx, lx - 10, 0, lx + 10, 0, [[0, '#8a5a2a'], [0.5, '#d8a060'], [1, '#6a4020']]); ctx.beginPath(); ctx.ellipse(lx, ly, 10, 6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffd36a'; ctx.beginPath(); ctx.moveTo(lx + 6, ly - 3); ctx.quadraticCurveTo(lx + 12, ly - 9, lx + 9, ly - 14); ctx.quadraticCurveTo(lx + 7, ly - 8, lx + 6, ly - 3); ctx.fill();
  const bx = r.x + r.w * 0.62, by = r.y + H * 0.72; for (let k = 0; k < 6; k++) { ctx.fillStyle = lg(ctx, 0, by + k * 4, 0, by + k * 4 + 5, [[0, '#d8b66a'], [1, '#9a7a3a']]); rrect(ctx, bx, by + k * 5, r.w * 0.22, 5, 2); ctx.fill(); }
};
walls.scriptorium = function (ctx, s, r, H, t) { // a monastery scriptorium: pale stone, a round-arched window of light, a slanted desk with a book, a candle
  ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.08)], [1, tint(s.wallC, -0.3)]]); ctx.fillRect(r.x, r.y, r.w, H);
  for (let y = r.y, j = 0; y < r.y + H; y += 26, j++) for (let x = r.x - (j % 2 ? 36 : 0); x < r.x + r.w; x += 72) { ctx.strokeStyle = 'rgba(60,50,40,0.26)'; ctx.lineWidth = 1.4; ctx.strokeRect(x, y, 72, 26); }
  const wx = r.x + r.w * 0.5, ww = Math.min(r.w * 0.26, H * 0.5), wy = r.y + H * 0.08, wh = H * 0.6;
  ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#fbeec0'], [1, '#e6c070']]); ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + ww / 2); ctx.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0); ctx.lineTo(wx + ww, wy + wh); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#4a4036'; ctx.lineWidth = 5; ctx.stroke(); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh * 0.55); ctx.lineTo(wx + ww, wy + wh * 0.55); ctx.stroke();
  const dx = r.x + r.w * 0.04, dy = r.y + H * 0.58, dw = r.w * 0.34; ctx.fillStyle = lg(ctx, dx, dy, dx, dy + 14, [[0, '#9a6a3a'], [1, '#4a2c14']]); ctx.beginPath(); ctx.moveTo(dx, dy + 16); ctx.lineTo(dx + dw * 0.15, dy); ctx.lineTo(dx + dw, dy); ctx.lineTo(dx + dw * 1.05, dy + 16); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f1e6c4'; ctx.beginPath(); ctx.moveTo(dx + dw * 0.2, dy - 2); ctx.lineTo(dx + dw * 0.9, dy - 2); ctx.lineTo(dx + dw * 0.86, dy - 26); ctx.lineTo(dx + dw * 0.26, dy - 26); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(40,20,6,0.5)'; ctx.lineWidth = 1; for (let l = 0; l < 4; l++) { ctx.beginPath(); ctx.moveTo(dx + dw * 0.3, dy - 20 + l * 5); ctx.lineTo(dx + dw * 0.82, dy - 20 + l * 5); ctx.stroke(); }
  const cx = r.x + r.w * 0.9, cy = r.y + H * 0.66; ctx.fillStyle = rg(ctx, cx, cy - 16, 1, 40, [[0, 'rgba(255,224,140,0.7)'], [1, 'rgba(255,170,60,0)']]); ell(ctx, cx, cy - 16, 40, 40); ctx.fill(); ctx.fillStyle = '#f6f0dc'; ctx.fillRect(cx - 5, cy, 10, 30); ctx.fillStyle = '#ffd36a'; ctx.beginPath(); ctx.moveTo(cx, cy - 18); ctx.quadraticCurveTo(cx + 8, cy - 6, cx, cy); ctx.quadraticCurveTo(cx - 8, cy - 6, cx, cy - 18); ctx.fill();
};
walls.ottoman = function (ctx, s, r, H, t) { // an Ottoman scribe's room: blue and turquoise tile with red tulips, a latticed window, a brass lamp
  ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.1)], [1, tint(s.wallC, -0.3)]]); ctx.fillRect(r.x, r.y, r.w, H);
  const ts = 36; for (let y = r.y, j = 0; y < r.y + H; y += ts, j++) for (let x = r.x; x < r.x + r.w; x += ts) {
    ctx.strokeStyle = 'rgba(240,248,255,0.22)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, ts - 1, ts - 1);
    const cx = x + ts / 2, cy = y + ts / 2; ctx.fillStyle = '#c42a22'; ctx.beginPath(); ctx.moveTo(cx - 6, cy - 3); ctx.quadraticCurveTo(cx - 7, cy + 7, cx, cy + 8); ctx.quadraticCurveTo(cx + 7, cy + 7, cx + 6, cy - 3); ctx.lineTo(cx + 3, cy - 1); ctx.lineTo(cx, cy - 7); ctx.lineTo(cx - 3, cy - 1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#e8f2f0'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx, cy + 8); ctx.lineTo(cx, cy + 14); ctx.moveTo(cx - 8, cy + 10); ctx.quadraticCurveTo(cx, cy + 8, cx + 8, cy + 10); ctx.stroke(); }
  const wx = r.x + r.w * 0.52, ww = Math.min(r.w * 0.3, H * 0.6), wy = r.y + H * 0.1, wh = H * 0.56;
  ctx.fillStyle = '#1b2a2c'; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + wh * 0.3); ctx.quadraticCurveTo(wx, wy, wx + ww / 2, wy - 4); ctx.quadraticCurveTo(wx + ww, wy, wx + ww, wy + wh * 0.3); ctx.lineTo(wx + ww, wy + wh); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#6a4222'; ctx.lineWidth = 2.4; for (let k = -6; k <= 6; k++) { ctx.beginPath(); ctx.moveTo(wx + ww / 2 + k * 9, wy); ctx.lineTo(wx + ww / 2 + k * 9 + 24, wy + wh); ctx.moveTo(wx + ww / 2 + k * 9, wy); ctx.lineTo(wx + ww / 2 + k * 9 - 24, wy + wh); ctx.stroke(); }
  ctx.lineWidth = 5; ctx.strokeStyle = '#d8a040'; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + wh * 0.3); ctx.quadraticCurveTo(wx, wy, wx + ww / 2, wy - 4); ctx.quadraticCurveTo(wx + ww, wy, wx + ww, wy + wh * 0.3); ctx.lineTo(wx + ww, wy + wh); ctx.stroke();
  const lx = r.x + r.w * 0.2, ly = r.y + H * 0.46; ctx.strokeStyle = '#b88a30'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, r.y); ctx.lineTo(lx, ly - 18); ctx.stroke();
  ctx.fillStyle = rg(ctx, lx, ly, 1, 50, [[0, 'rgba(255,224,140,0.65)'], [1, 'rgba(255,170,60,0)']]); ell(ctx, lx, ly, 50, 50); ctx.fill();
  ctx.fillStyle = lg(ctx, lx - 16, 0, lx + 16, 0, [[0, '#8a6a20'], [0.4, '#f6dc7a'], [1, '#7a5a18']]); ctx.beginPath(); ctx.moveTo(lx - 7, ly - 16); ctx.lineTo(lx + 7, ly - 16); ctx.lineTo(lx + 15, ly + 2); ctx.quadraticCurveTo(lx, ly + 14, lx - 15, ly + 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff0b0'; ell(ctx, lx, ly - 2, 5, 7); ctx.fill();
};
const T = (c, h) => ({ caption: c, hint: h });
const scenes = {
  babylon: { wall: 'edubba', wallC: '#a8784a', floor: 'earth', floorC: '#8a5e38', light: 'lamp', litter: [{ k: 'clay', c: '#c8946a' }], dock: ['reedstylus', 'gauge', 'bowl'], dockKind: 'ledge', frame: 'plinth', words: T('Press this tablet', 'Press the stylus in at the dot and drag toward the point'), pitch: 0.9, wave: 'triangle', ar: 1 },
  tughra: { wall: 'ottoman', wallC: '#1c5f78', floor: 'tile', floorC: '#7a5a3a', light: 'lamp', litter: [{ k: 'dust', c: '#d8c8a8' }], dock: ['kalam', 'gauge', 'inkhorn'], dockKind: 'tray', frame: 'rail', words: T('Write this monogram', 'Tall staves first; keep the nib at one angle'), pitch: 1.2, wave: 'sine', ar: 1.3 },
  tazhib: { wall: 'karkhana', wallC: '#124a52', floor: 'planks', floorC: '#6a4a2c', light: 'lamp', litter: [{ k: 'dust', c: '#e8c870' }], dock: ['brush:#b4653a', 'gauge', 'burnisher'], dockKind: 'tray', frame: 'case', words: T('Gild this headpiece', 'Draw the size, then press Gild; the pattern mirrors on all four sides'), pitch: 1.3, wave: 'sine', ar: 1.3 },
  lontar: { wall: 'bale', wallC: '#a8844a', floor: 'planks', floorC: '#6a4a2c', light: 'lamp', litter: [{ k: 'dust', c: '#e0c88a' }], dock: ['pengutik', 'gauge', 'bowl'], dockKind: 'ledge', frame: 'rail', words: T('Incise this story', 'Press lightly with the point and keep it moving'), pitch: 1.6, wave: 'triangle', ar: 1.5 },
  enluminure: { wall: 'scriptorium', wallC: '#cdbf9e', floor: 'slab', floorC: '#8d7a68', light: 'window', litter: [{ k: 'dust', c: '#e8c870' }], dock: ['brush:#b4653a', 'gauge', 'burnisher'], dockKind: 'ledge', frame: 'plinth', words: T('Illuminate this initial', 'Size the letter, press Gild, then paint the leaves and draw the tendrils'), pitch: 1.0, wave: 'sine', ar: 1.25 },
  ustav: { wall: 'rushnyk', wallC: '#efe6d2', floor: 'planks', floorC: '#8a6a44', light: 'window', litter: [{ k: 'dust', c: '#d8c8a8' }], dock: ['kalam', 'gauge', 'inkhorn'], dockKind: 'ledge', frame: 'rail', words: T('Write this word', 'Keep the nib flat: down strokes are thick, rising strokes are fine'), pitch: 1.1, wave: 'triangle', ar: 1.3 },
};
registerSceneSet({
  scenes: Object.fromEntries(Object.entries(scenes).map(([id, s]) => [id, { ...s, hang: [] }])),
  rules: [['babylon', /cuneiform|babylon/i], ['ustav', /ukrainian calligraphy|ustav/i], ['tughra', /tughra|turkish calligraphy/i], ['tazhib', /tazhib|tezhip|illuminat/i], ['lontar', /prasi|lontar/i], ['enluminure', /enluminure|illuminated initial/i]],
  walls, props, floorKinds: {}, floorEx: {}, litter: {}, frames: {},
  soundMat: Object.fromEntries(Object.keys(scenes).map((id) => [id, 'clay'])),
});

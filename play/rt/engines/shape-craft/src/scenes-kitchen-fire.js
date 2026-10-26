// shape-craft 1.26.0 Kitchen Crafts (fire): three kitchens of their own. kc-fire-noodle is a noodle shop (white tile, red lanterns, a menu board, a
// butcher-block counter under warm light); kc-fire-tonir is a village bread house with a clay-lined pit oven; kc-fire-pizzeria is a wood-oven pizzeria.
// Names are prefixed kc-fire- (registry names must be unique across the engine).
import { registerSceneSet } from './registry.js';
import { hash } from './geom.js';
import { tint, rgba, rrect, mix } from './fx.js';
import { planksH, lin, rad, TAU } from './kc-fire-lib.js';

const speck = (ctx, x, y, w, h, n, c, a, seed, sz = 2) => { ctx.fillStyle = rgba(c, a); ctx.beginPath(); for (let k = 0; k < n; k++) ctx.rect(x + hash(k, seed) * w, y + hash(k, seed + 1) * h, sz * (0.5 + hash(k, seed + 2)), sz * (0.5 + hash(k, seed + 3))); ctx.fill(); };

// ---- noodle shop ----------------------------------------------------------------------------------------------------------------------
const lantern = (ctx, x, y, r, t, seed) => {
  const sway = Math.sin(t * 0.9 + seed) * 1.5;
  ctx.save(); ctx.translate(x + sway, y);
  ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -r * 1.6); ctx.lineTo(0, -r * 0.95); ctx.stroke();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rad(ctx, 0, 0, r * 0.3, r * 3.2, [[0, 'rgba(255,150,70,0.5)'], [1, 'rgba(255,100,30,0)']]); ctx.fillRect(-r * 3.2, -r * 3.2, r * 6.4, r * 6.4); ctx.restore();
  ctx.fillStyle = '#2a1a10'; ctx.fillRect(-r * 0.45, -r * 1.0, r * 0.9, r * 0.2);
  ctx.fillStyle = lin(ctx, -r, 0, r, 0, [[0, '#8a1414'], [0.35, '#e8402a'], [0.55, '#ff7a4a'], [1, '#7a1010']]);
  ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.88, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(80,10,6,0.55)'; ctx.lineWidth = 1.4; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(0, 0, Math.abs(k) * r * 0.22 + 1, r * 0.88, 0, 0, TAU); ctx.stroke(); }
  ctx.fillStyle = '#2a1a10'; ctx.fillRect(-r * 0.45, r * 0.78, r * 0.9, r * 0.2);
  ctx.strokeStyle = '#d9a23a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, r * 0.98); ctx.lineTo(0, r * 1.5); ctx.stroke();
  ctx.fillStyle = '#d9a23a'; ctx.beginPath(); ctx.moveTo(0, r * 1.15); ctx.lineTo(r * 0.14, r * 1.7); ctx.lineTo(-r * 0.14, r * 1.7); ctx.closePath(); ctx.fill();
  ctx.restore();
};

const WALLS = {
  'kc-fire-noodlewall'(ctx, s, r, H, t = 0) {
    // white tile, a dark green dado, warm light from the lanterns
    ctx.fillStyle = lin(ctx, 0, r.y, 0, r.y + H, [[0, '#d8d2c2'], [1, '#bdb6a2']]); ctx.fillRect(r.x, r.y, r.w, H);
    const th = Math.max(14, H / 8), tw = th * 1.7;
    ctx.strokeStyle = 'rgba(70,60,48,0.28)'; ctx.lineWidth = 1;
    for (let y = r.y; y < r.y + H; y += th) { ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke(); const off = (Math.round((y - r.y) / th) % 2) * tw / 2; for (let x = r.x - off; x < r.x + r.w; x += tw) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + th); ctx.stroke(); } }
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; for (let k = 0; k < 40; k++) ctx.fillRect(r.x + hash(k, 3) * r.w, r.y + hash(k, 4) * H, tw * 0.6, 1.5);
    // dado of dark green tile
    const dy = r.y + H * 0.7; ctx.fillStyle = lin(ctx, 0, dy, 0, r.y + H, [[0, '#2c5a4a'], [1, '#1c3a30']]); ctx.fillRect(r.x, dy, r.w, r.y + H - dy);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; for (let x = r.x; x < r.x + r.w; x += th) { ctx.beginPath(); ctx.moveTo(x, dy); ctx.lineTo(x, r.y + H); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(r.x, dy, r.w, 2);
    // menu board with the name of the house, hung on cords
    const bw = Math.min(r.w * 0.3, 210), bh = H * 0.5, bx = r.x + r.w * 0.34, by = r.y + H * 0.16;
    ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(bx + bw * 0.12, r.y); ctx.lineTo(bx + bw * 0.12, by); ctx.moveTo(bx + bw * 0.88, r.y); ctx.lineTo(bx + bw * 0.88, by); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(bx + 4, by + 5, bw, bh);
    ctx.fillStyle = lin(ctx, bx, by, bx + bw, by + bh, [[0, '#2a1a14'], [1, '#150c08']]); rrect(ctx, bx, by, bw, bh, 4); ctx.fill();
    ctx.strokeStyle = '#a8742e'; ctx.lineWidth = 3; rrect(ctx, bx + 2, by + 2, bw - 4, bh - 4, 3); ctx.stroke();
    ctx.fillStyle = '#f2e2b8'; ctx.font = `800 ${Math.round(bh * 0.7)}px "PingFang SC","Hiragino Sans GB","Noto Sans CJK SC","Microsoft YaHei",system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('拉面', bx + bw / 2, by + bh * 0.42);
    // shelf of blue-and-white bowls over the left
    const sx = r.x + r.w * 0.04, sw = Math.min(r.w * 0.22, 150), sy = r.y + H * 0.42;
    ctx.fillStyle = lin(ctx, 0, sy, 0, sy + 8, [[0, '#8a5a2e'], [1, '#4a2c14']]); ctx.fillRect(sx, sy, sw, 7);
    for (let k = 0; k < 4; k++) { const bxk = sx + sw * (0.12 + k * 0.24), n = 2 + (k % 2); for (let q = 0; q < n; q++) { const yy = sy - 8 - q * 7; ctx.fillStyle = lin(ctx, bxk - 14, 0, bxk + 14, 0, [[0, '#cfd8e0'], [0.4, '#fbfcfd'], [1, '#8fa0b2']]); ctx.beginPath(); ctx.ellipse(bxk, yy, 15, 4.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#2f5faa'; ctx.fillRect(bxk - 14, yy + 1, 28, 1.6); } }
    // exhaust hood over the stove at the right, with hanging ladles
    const hx = r.x + r.w * 0.68, hw = r.w * 0.31;
    ctx.fillStyle = lin(ctx, hx, 0, hx + hw, 0, [[0, '#7c868f'], [0.3, '#d8dee4'], [0.6, '#9aa4ad'], [1, '#5a636b']]);
    ctx.beginPath(); ctx.moveTo(hx + hw * 0.12, r.y); ctx.lineTo(hx + hw * 0.88, r.y); ctx.lineTo(hx + hw, r.y + H * 0.38); ctx.lineTo(hx, r.y + H * 0.38); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(30,36,42,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(hx + hw * 0.1, r.y + 3, hw * 0.12, H * 0.3);
    ctx.fillStyle = '#2a2f35'; ctx.fillRect(hx, r.y + H * 0.38, hw, 4);
    ctx.strokeStyle = '#3a4047'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(hx + hw * 0.06, r.y + H * 0.46); ctx.lineTo(hx + hw * 0.94, r.y + H * 0.46); ctx.stroke();
    for (let k = 0; k < 4; k++) { const ux = hx + hw * (0.14 + k * 0.22), ul = H * (0.28 + 0.06 * (k % 2)); ctx.strokeStyle = '#2a2f35'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ux, r.y + H * 0.46); ctx.lineTo(ux, r.y + H * 0.46 + ul); ctx.stroke(); ctx.fillStyle = k % 2 ? '#b8c0c8' : '#8a929a'; ctx.beginPath(); if (k % 2) ctx.ellipse(ux, r.y + H * 0.46 + ul + 6, 8, 7, 0, 0, TAU); else ctx.rect(ux - 6, r.y + H * 0.46 + ul - 2, 12, 12); ctx.fill(); }
    // two lanterns
    lantern(ctx, r.x + r.w * 0.2, r.y + H * 0.3, Math.min(H * 0.2, 24), t, 1); lantern(ctx, r.x + r.w * 0.6, r.y + H * 0.26, Math.min(H * 0.17, 20), t, 4);
    // warm haze from the lanterns and the stove, steam condensing against the hood
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rad(ctx, r.x + r.w * 0.45, r.y + H * 0.45, 10, r.w * 0.55, [[0, 'rgba(255,200,130,0.16)'], [1, 'rgba(255,170,90,0)']]); ctx.fillRect(r.x, r.y, r.w, H); ctx.restore();
  },
  'kc-fire-bakerywall'(ctx, s, r, H, t = 0) {
    // a village bread house: rough stone and plaster, an arched niche with clay jugs and a copper pitcher, a small barred window, herbs hung from a beam
    ctx.fillStyle = lin(ctx, 0, r.y, 0, r.y + H, [[0, '#a8957a'], [1, '#85735c']]); ctx.fillRect(r.x, r.y, r.w, H);
    const rowH = Math.max(14, H / 6);
    for (let row = 0; row * rowH < H; row++) { let x = r.x - hash(row, 3) * 40; while (x < r.x + r.w) { const sw = 34 + hash(row, Math.round(x), 4) * 46, k = hash(row, Math.round(x), 5); ctx.fillStyle = `rgba(${Math.round(120 + k * 60)},${Math.round(98 + k * 46)},${Math.round(74 + k * 34)},0.9)`; rrect(ctx, x + 1.5, r.y + row * rowH + 1.5, sw - 3, rowH - 3, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,240,210,0.14)'; ctx.fillRect(x + 3, r.y + row * rowH + 2, sw - 8, 2); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x + 3, r.y + (row + 1) * rowH - 4, sw - 6, 2); x += sw; } }
    // a beam with hanging herbs and a string of red peppers
    ctx.fillStyle = lin(ctx, 0, r.y, 0, r.y + H * 0.12, [[0, '#5a3a1e'], [1, '#2e1c0c']]); ctx.fillRect(r.x, r.y, r.w, H * 0.1);
    for (let k = 0; k < 5; k++) { const hx = r.x + r.w * (0.08 + k * 0.2) + hash(k, 8) * 20, hl = H * (0.2 + hash(k, 9) * 0.12); ctx.strokeStyle = '#3a2a14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hx, r.y + H * 0.1); ctx.lineTo(hx, r.y + H * 0.15); ctx.stroke(); ctx.fillStyle = ['#5e7a3a', '#7a8a44', '#8a6a3a', '#4e6a34', '#9a7a48'][k]; ctx.beginPath(); ctx.moveTo(hx - 3, r.y + H * 0.15); ctx.quadraticCurveTo(hx - 12, r.y + H * 0.15 + hl * 0.6, hx - 6, r.y + H * 0.15 + hl); ctx.lineTo(hx + 6, r.y + H * 0.15 + hl * 0.96); ctx.quadraticCurveTo(hx + 12, r.y + H * 0.15 + hl * 0.5, hx + 3, r.y + H * 0.15); ctx.closePath(); ctx.fill(); }
    // niche with jugs
    const nx = r.x + r.w * 0.06, nw = Math.min(r.w * 0.24, 150), ny = r.y + H * 0.26, nh = H * 0.62;
    ctx.fillStyle = '#1e1208'; ctx.beginPath(); ctx.moveTo(nx, ny + nh); ctx.lineTo(nx, ny + nh * 0.35); ctx.quadraticCurveTo(nx + nw / 2, ny - nh * 0.15, nx + nw, ny + nh * 0.35); ctx.lineTo(nx + nw, ny + nh); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#c9b48c'; ctx.lineWidth = 4; ctx.stroke();
    for (const [jx, jh, c] of [[0.28, 0.5, '#a8512a'], [0.62, 0.42, '#8a3e22'], [0.84, 0.3, '#b86a3a']]) { const x = nx + nw * jx, base = ny + nh - 2, hh = nh * jh; ctx.fillStyle = lin(ctx, x - 12, 0, x + 12, 0, [[0, tint(c, 0.25)], [0.5, c], [1, tint(c, -0.45)]]); ctx.beginPath(); ctx.moveTo(x - 6, base); ctx.bezierCurveTo(x - 16, base - hh * 0.35, x - 14, base - hh * 0.7, x - 5, base - hh * 0.85); ctx.lineTo(x - 5, base - hh); ctx.lineTo(x + 5, base - hh); ctx.lineTo(x + 5, base - hh * 0.85); ctx.bezierCurveTo(x + 14, base - hh * 0.7, x + 16, base - hh * 0.35, x + 6, base); ctx.closePath(); ctx.fill(); }
    // window with bars and the evening sky
    const wx = r.x + r.w * 0.66, ww = Math.min(r.w * 0.16, 100), wy = r.y + H * 0.3, wh = H * 0.5;
    ctx.fillStyle = lin(ctx, 0, wy, 0, wy + wh, [[0, '#d98a5a'], [0.5, '#f0c27a'], [1, '#7a8aa8']]); ctx.fillRect(wx, wy, ww, wh);
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 3; ctx.strokeRect(wx, wy, ww, wh); for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(wx + (ww * k) / 4, wy); ctx.lineTo(wx + (ww * k) / 4, wy + wh); ctx.stroke(); }
    ctx.fillStyle = 'rgba(80,60,40,0.7)'; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx + ww * 0.35, wy + wh * 0.6); ctx.lineTo(wx + ww * 0.6, wy + wh * 0.75); ctx.lineTo(wx + ww, wy + wh * 0.5); ctx.lineTo(wx + ww, wy + wh); ctx.closePath(); ctx.fill();   // far hills
    ctx.fillStyle = '#b8a888'; ctx.fillRect(wx - 5, wy + wh, ww + 10, 5);
    // flame light flickering on the plaster
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const fl = 0.8 + 0.2 * Math.sin(t * 9.1) * Math.sin(t * 5.3); ctx.fillStyle = rad(ctx, r.x + r.w * 0.5, r.y + H, 10, r.w * 0.6, [[0, `rgba(255,150,70,${0.22 * fl})`], [1, 'rgba(255,110,40,0)']]); ctx.fillRect(r.x, r.y, r.w, H); ctx.restore();
  },
  'kc-fire-pizzawall'(ctx, s, r, H, t = 0) {
    // a Naples pizzeria: white plaster, a border of red-white-green tile, a chalkboard, copper pans and a braid of garlic, a window onto the bay and the mountain
    ctx.fillStyle = lin(ctx, 0, r.y, 0, r.y + H, [[0, '#cdb894'], [1, '#a8916a']]); ctx.fillRect(r.x, r.y, r.w, H);
    speck(ctx, r.x, r.y, r.w, H, 120, '#5a4a30', 0.14, 77, 3);
    const tile = Math.max(12, H / 9), ty = r.y + H - tile * 1.6;
    for (let x = r.x, k = 0; x < r.x + r.w; x += tile, k++) { ctx.fillStyle = ['#c8281f', '#f6f1e6', '#2f7a3a'][k % 3]; ctx.fillRect(x, ty, tile, tile * 1.6); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x + 1, ty + 1, tile - 2, 2); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.strokeRect(x + 0.5, ty + 0.5, tile - 1, tile * 1.6 - 1); }
    // window onto the bay: sea, sky and the mountain
    const wx = r.x + r.w * 0.06, ww = Math.min(r.w * 0.22, 150), wy = r.y + H * 0.12, wh = H * 0.55;
    ctx.fillStyle = lin(ctx, 0, wy, 0, wy + wh, [[0, '#9ac0e0'], [0.55, '#e8d8c0'], [0.56, '#4a86b0'], [1, '#2a5a86']]); ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = '#5a6a8a'; ctx.beginPath(); ctx.moveTo(wx + ww * 0.1, wy + wh * 0.56); ctx.lineTo(wx + ww * 0.38, wy + wh * 0.18); ctx.lineTo(wx + ww * 0.5, wy + wh * 0.3); ctx.lineTo(wx + ww * 0.62, wy + wh * 0.2); ctx.lineTo(wx + ww * 0.92, wy + wh * 0.56); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 5; ctx.strokeRect(wx, wy, ww, wh); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh * 0.5); ctx.lineTo(wx + ww, wy + wh * 0.5); ctx.stroke();
    // chalkboard
    const bx = r.x + r.w * 0.36, bw = Math.min(r.w * 0.26, 190), by = r.y + H * 0.1, bh = H * 0.55;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(bx + 4, by + 5, bw, bh); ctx.fillStyle = lin(ctx, bx, by, bx + bw, by + bh, [[0, '#2a3430'], [1, '#1a2220']]); rrect(ctx, bx, by, bw, bh, 4); ctx.fill(); ctx.strokeStyle = '#8a5a30'; ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = 'rgba(245,240,225,0.9)'; ctx.font = `800 ${Math.round(bh * 0.3)}px "Georgia",serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PIZZA', bx + bw / 2, by + bh * 0.3);
    ctx.strokeStyle = 'rgba(245,240,225,0.55)'; ctx.lineWidth = 1.6; for (let k = 0; k < 3; k++) { const yy = by + bh * (0.55 + k * 0.14); ctx.beginPath(); ctx.moveTo(bx + bw * 0.14, yy); ctx.lineTo(bx + bw * (0.6 + hash(k, 3) * 0.2), yy); ctx.stroke(); ctx.beginPath(); ctx.arc(bx + bw * 0.88, yy, 2, 0, TAU); ctx.stroke(); }
    // copper pans on hooks and a braid of garlic
    for (let k = 0; k < 4; k++) { const px = r.x + r.w * (0.7 + k * 0.075), pr = H * (0.13 - k * 0.01), py = r.y + H * 0.22; ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, r.y); ctx.lineTo(px, py - pr); ctx.stroke(); ctx.fillStyle = lin(ctx, px - pr, 0, px + pr, 0, [[0, '#8a4a22'], [0.35, '#f0a070'], [1, '#6a3414']]); ctx.beginPath(); ctx.arc(px, py, pr, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(40,16,6,0.55)'; ctx.beginPath(); ctx.arc(px, py, pr * 0.72, 0, TAU); ctx.fill(); ctx.strokeStyle = '#6a3414'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px - pr * 0.1, py + pr); ctx.lineTo(px - pr * 0.1, py + pr * 1.7); ctx.stroke(); }
    const gx = r.x + r.w * 0.31; ctx.strokeStyle = '#8a7a50'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(gx, r.y); ctx.lineTo(gx, r.y + H * 0.55); ctx.stroke(); for (let k = 0; k < 7; k++) { ctx.fillStyle = k % 2 ? '#f4efdc' : '#ece4cc'; ctx.beginPath(); ctx.ellipse(gx + (k % 2 ? 5 : -5), r.y + H * (0.08 + k * 0.065), 6, 8, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(120,100,60,0.5)'; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const fl = 0.8 + 0.2 * Math.sin(t * 9.1) * Math.sin(t * 5.3); ctx.fillStyle = rad(ctx, r.x + r.w * 0.5, r.y + H, 10, r.w * 0.6, [[0, `rgba(255,150,70,${0.16 * fl})`], [1, 'rgba(255,110,40,0)']]); ctx.fillRect(r.x, r.y, r.w, H); ctx.restore();
  },
};
const FLOORS = {
  'kc-fire-butcher'(ctx, r, c) {   // a thick butcher-block counter: wide boards, knife scars, dusted flour
    planksH(ctx, r.x, r.y, r.w, r.h, c, Math.max(34, r.h / 6), 41, 1);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 26; k++) { const x = r.x + hash(k, 5) * r.w, y = r.y + r.h * (0.3 + 0.65 * hash(k, 6)), l = 14 + hash(k, 7) * 40, a = (hash(k, 8) - 0.5) * 1.2; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); } ctx.stroke();
    // flour, dusted in drifts and hand prints
    for (let k = 0; k < 7; k++) { const x = r.x + r.w * hash(k, 11), y = r.y + r.h * (0.28 + 0.7 * hash(k, 12)); ctx.fillStyle = rad(ctx, x, y, 2, 60 + hash(k, 13) * 80, [[0, 'rgba(255,252,240,0.34)'], [1, 'rgba(255,252,240,0)']]); ctx.fillRect(x - 160, y - 160, 320, 320); }
    speck(ctx, r.x, r.y, r.w, r.h, 260, '#fff8e8', 0.26, 51, 2);
    ctx.fillStyle = lin(ctx, 0, r.y + r.h * 0.9, 0, r.y + r.h, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.3)']]); ctx.fillRect(r.x, r.y + r.h * 0.9, r.w, r.h * 0.1);
  },
  'kc-fire-flags'(ctx, r, c) {   // flagstones of the bread house floor, ash and flour
    ctx.fillStyle = lin(ctx, 0, r.y, 0, r.y + r.h, [[0, tint(c, 0.1)], [1, tint(c, -0.25)]]); ctx.fillRect(r.x, r.y, r.w, r.h);
    const sh = Math.max(46, r.h / 5); let y = r.y;
    for (let row = 0; y < r.y + r.h; row++) { let x = r.x - hash(row, 5) * 60; const rh = sh * (0.8 + hash(row, 6) * 0.4); while (x < r.x + r.w) { const sw = 80 + hash(row, Math.round(x), 7) * 110, k = hash(row, Math.round(x), 8); ctx.fillStyle = `rgba(${Math.round(90 + k * 50)},${Math.round(80 + k * 40)},${Math.round(68 + k * 34)},0.92)`; rrect(ctx, x + 2, y + 2, sw - 4, rh - 4, 8); ctx.fill(); ctx.fillStyle = 'rgba(255,240,210,0.1)'; ctx.fillRect(x + 6, y + 3, sw - 14, 3); x += sw; } y += rh; }
    speck(ctx, r.x, r.y, r.w, r.h, 200, '#2a2018', 0.2, 61, 3); speck(ctx, r.x, r.y, r.w, r.h, 90, '#e8e0d0', 0.14, 65, 2);
  },
  'kc-fire-marble'(ctx, r, c) {   // a marble counter: pale with grey veins, a cool sheen, flour
    ctx.fillStyle = lin(ctx, r.x, r.y, r.x + r.w, r.y + r.h, [[0, '#a9afab'], [0.5, '#8f968f'], [1, '#737a74']]); ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.lineCap = 'round'; for (let k = 0; k < 14; k++) { const x = r.x + hash(k, 5) * r.w, y = r.y + hash(k, 6) * r.h, l = 80 + hash(k, 7) * 220; ctx.strokeStyle = hash(k, 14) > 0.4 ? `rgba(238,240,236,${0.22 + 0.3 * hash(k, 9)})` : `rgba(50,58,54,${0.2 + 0.25 * hash(k, 9)})`; ctx.lineWidth = 1 + hash(k, 10) * 2.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + l * 0.3, y + (hash(k, 11) - 0.5) * 60, x + l * 0.6, y + (hash(k, 12) - 0.5) * 60, x + l, y + (hash(k, 13) - 0.5) * 40); ctx.stroke(); }
    for (let k = 0; k < 5; k++) { const x = r.x + r.w * hash(k, 21), y = r.y + r.h * (0.2 + 0.75 * hash(k, 22)); ctx.fillStyle = rad(ctx, x, y, 2, 70 + hash(k, 23) * 90, [[0, 'rgba(255,255,255,0.22)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(x - 170, y - 170, 340, 340); }
    ctx.fillStyle = rad(ctx, r.x + r.w / 2, r.y + r.h * 0.55, r.w * 0.2, r.w * 0.75, [[0, 'rgba(255,220,170,0.0)'], [1, 'rgba(20,12,6,0.45)']]); ctx.fillRect(r.x, r.y, r.w, r.h);   // warm pool of light, dark edges
    speck(ctx, r.x, r.y, r.w, r.h, 140, '#ffffff', 0.4, 31, 2); speck(ctx, r.x, r.y, r.w, r.h, 80, '#7a7870', 0.18, 35, 2);
    ctx.fillStyle = lin(ctx, 0, r.y + r.h * 0.9, 0, r.y + r.h, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.25)']]); ctx.fillRect(r.x, r.y + r.h * 0.9, r.w, r.h * 0.1);
  },
};

const T = (c, h, w) => ({ caption: c, hint: h, ...(w ?? {}) });
const SCENES = {
  'kc-fire-tonir': { wall: 'kc-fire-bakerywall', wallC: '#a8957a', wallK: 1.0, floor: 'kc-fire-flags', floorC: '#7a6a58', light: 'lamp', litter: [], dock: [], dockKind: 'ledge', frame: 'case', wood: '#8a5a2e', words: T('The order', 'Stretch, slap, hook'), pitch: 1.0 },
  'kc-fire-pizzeria': { wall: 'kc-fire-pizzawall', wallC: '#cdb894', wallK: 1.0, floor: 'kc-fire-marble', floorC: '#8f968f', light: 'lamp', litter: [], dock: [], dockKind: 'ledge', frame: 'case', wood: '#8a5a2e', words: T('The order', 'Stretch, dress, bake', { win: 'Straight from the wood fire', ok: 'A good pizza', retry: 'Back to the counter' }), pitch: 1.0 },
  'kc-fire-noodle': { wall: 'kc-fire-noodlewall', wallC: '#d8d2c2', wallK: 1.0, floor: 'kc-fire-butcher', floorC: '#b98a52', light: 'lamp', litter: [], dock: [], dockKind: 'ledge', frame: 'case', wood: '#8a5a2e', words: T('The order', 'Pull on the beat', { win: 'Noodles as fine as thread', ok: 'Good noodles', retry: 'Back to the board' }), pitch: 1.0 },
};

registerSceneSet({
  scenes: SCENES,
  walls: WALLS, floorKinds: { 'kc-fire-butcher': 'wood', 'kc-fire-flags': 'slate', 'kc-fire-marble': 'slate' }, floorEx: FLOORS,
  rules: [['kc-fire-noodle', /lamian|hand.?pulled noodle/], ['kc-fire-tonir', /lavash|tonir|tandoor|clay oven/], ['kc-fire-pizzeria', /pizza|pizzaiolo|pizzaiuolo/]],
  soundMat: { 'kc-fire-noodle': 'wood', 'kc-fire-tonir': 'clay', 'kc-fire-pizzeria': 'stone' },
});
void tint; void mix;

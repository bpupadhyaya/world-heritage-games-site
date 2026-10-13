// Theatre: Malagasy hira gasy. An open-air highland village: red brick houses with thatch, green rice terraces,
// a baobab, a red-earth performing ring with the troupe in lambas and straw hats, a small band and a ring of seated
// listeners in striped lambas. The verses so far hang on a painted cloth banner between two bamboo poles.
import { register } from '../theatres.js';
import { mix, dark, light, alpha, poly, vgrad, hgrad } from '../figures.js';
import { place, vignette, TAU } from '../kit.js';
import { person, wrapText, hf, clampv as clamp } from './_verskit.js';

const RED = '#c8341e', GRN = '#2f8a3a', WHT = '#f6ecd2', YEL = '#e8b24a', BLU = '#2a5a8a';
const LAMBA = [RED, GRN, WHT, YEL, BLU, '#8a2a6a'];

function house(ctx, x, base, s, t) {
  const w = s * 0.55, h = s * 1.05;
  ctx.fillStyle = vgrad(ctx, base - h, base, [[0, '#c0522e'], [1, '#8a3a20']]); ctx.fillRect(x - w / 2, base - h, w, h);
  ctx.strokeStyle = 'rgba(60,20,8,0.3)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let i = 1; i < 9; i++) { const y = base - h * i / 9; ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); }
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x + w * 0.15, base - h, w * 0.35, h);
  for (const wy of [0.72, 0.32]) { // shuttered windows
    ctx.fillStyle = '#2a1008'; ctx.fillRect(x - w * 0.3, base - h * wy, w * 0.26, h * 0.18);
    ctx.fillStyle = GRN; ctx.fillRect(x - w * 0.36, base - h * wy, w * 0.07, h * 0.18); ctx.fillRect(x - w * 0.07, base - h * wy, w * 0.07, h * 0.18);
    ctx.fillStyle = WHT; ctx.fillRect(x - w * 0.37, base - h * wy - 2, w * 0.45, 2);
  }
  ctx.fillStyle = WHT; ctx.fillRect(x - w * 0.55, base - h * 0.5, w * 1.1, 3); // wooden balcony rail
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 8; i++) ctx.fillRect(x - w * 0.5 + i * w * 0.14, base - h * 0.5 + 3, 1.5, h * 0.06);
  ctx.fillStyle = vgrad(ctx, base - h * 1.5, base - h, [[0, '#e8c46a'], [1, '#a07a30']]); // steep thatch
  poly(ctx, [[x - w * 0.72, base - h + 2], [x - w * 0.05, base - h * 1.55], [x + w * 0.05, base - h * 1.55], [x + w * 0.72, base - h + 2]]); ctx.fill();
  ctx.strokeStyle = 'rgba(90,60,10,0.45)'; ctx.beginPath();
  for (let i = -5; i <= 5; i++) { ctx.moveTo(x + i * w * 0.02, base - h * 1.5); ctx.lineTo(x + i * w * 0.13, base - h + 2); }
  ctx.stroke();
  ctx.fillStyle = 'rgba(180,180,180,0.35)'; ctx.beginPath(); ctx.ellipse(x + w * 0.3 + Math.sin(t * 0.7) * 3, base - h * 1.7 - (t * 4) % 10, 4, 3, 0, 0, TAU); ctx.fill();
}

function baobab(ctx, x, base, s) {
  ctx.fillStyle = hgrad(ctx, x - s * 0.2, x + s * 0.2, [[0, '#a89070'], [0.5, '#8a7050'], [1, '#5a4430']]);
  ctx.beginPath(); ctx.moveTo(x - s * 0.1, base - s * 0.9); ctx.quadraticCurveTo(x - s * 0.28, base - s * 0.3, x - s * 0.2, base); ctx.lineTo(x + s * 0.2, base); ctx.quadraticCurveTo(x + s * 0.28, base - s * 0.3, x + s * 0.1, base - s * 0.9); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#6a5238'; ctx.lineWidth = s * 0.05; ctx.lineCap = 'round'; ctx.beginPath();
  for (const a of [-0.9, -0.4, 0.1, 0.6, 1.0]) { ctx.moveTo(x, base - s * 0.88); ctx.quadraticCurveTo(x + Math.sin(a) * s * 0.3, base - s * 1.05, x + Math.sin(a) * s * 0.5, base - s * (1.05 + 0.1 * Math.cos(a))); }
  ctx.stroke();
  ctx.fillStyle = '#4a8a3a'; for (const a of [-0.9, -0.4, 0.1, 0.6, 1.0]) { ctx.beginPath(); ctx.ellipse(x + Math.sin(a) * s * 0.5, base - s * (1.08 + 0.1 * Math.cos(a)), s * 0.12, s * 0.06, 0, 0, TAU); ctx.fill(); }
}

function jacaranda(ctx, x, base, s, t) {
  ctx.strokeStyle = '#4a2c1c'; ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x - s * 0.05, base - s * 0.5, x, base - s * 0.8); ctx.stroke();
  for (let i = 0; i < 18; i++) { ctx.fillStyle = i % 3 ? '#9a6ad0' : '#c4a0e8'; const a = hf(i + 2) * TAU, d = hf(i + 40) * s * 0.36; ctx.beginPath(); ctx.arc(x + Math.cos(a) * d * 1.2 + Math.sin(t + i) * 0.7, base - s * 0.85 + Math.sin(a) * d * 0.7, s * 0.09, 0, TAU); ctx.fill(); }
}

function band(ctx, x, y, s, who, t, flip) {
  ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
  const bob = Math.sin(t * 6 + x) * s * 0.03;
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.5, s * 0.08, 0, 0, TAU); ctx.fill();
  const man = (cx, shirt) => {
    ctx.fillStyle = shirt; ctx.beginPath(); ctx.moveTo(cx - s * 0.2, 0); ctx.quadraticCurveTo(cx - s * 0.22, -s * 0.55, cx - s * 0.1, -s * 0.7); ctx.lineTo(cx + s * 0.1, -s * 0.7); ctx.quadraticCurveTo(cx + s * 0.22, -s * 0.55, cx + s * 0.2, 0); ctx.fill();
    ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.arc(cx, -s * 0.82 + bob, s * 0.12, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d9b060'; ctx.beginPath(); ctx.ellipse(cx, -s * 0.9 + bob, s * 0.26, s * 0.05, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx, -s * 0.95 + bob, s * 0.12, s * 0.07, 0, Math.PI, TAU); ctx.fill();
  };
  if (who === 'drum') {
    man(-s * 0.1, RED);
    ctx.fillStyle = vgrad(ctx, -s * 0.5, 0, [[0, '#f0e0b0'], [1, '#c8b080']]); ctx.beginPath(); ctx.ellipse(s * 0.3, -s * 0.28, s * 0.3, s * 0.28, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = RED; ctx.lineWidth = s * 0.06; ctx.stroke();
    ctx.strokeStyle = '#4a2c14'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(s * 0.05, -s * 0.45); ctx.lineTo(s * 0.3, -s * 0.28 - Math.abs(Math.sin(t * 7)) * s * 0.12); ctx.stroke();
  } else {
    man(-s * 0.15, GRN);
    ctx.fillStyle = vgrad(ctx, -s * 0.9, -s * 0.5, [[0, '#fff2b0'], [1, '#c8902a']]); // trumpet bell
    poly(ctx, [[s * 0.1, -s * 0.5 - bob], [s * 0.65, -s * 0.78 - bob], [s * 0.65, -s * 0.42 - bob]]); ctx.fill();
    man(s * 0.38 - s * 0.55, BLU);
  }
  ctx.restore();
}

function audienceRow(ctx, R, y, s, v, row) {
  const n = Math.max(6, Math.round(R.w / (s * 1.7))), c = v.crowd ?? { cheer: 0, mood: 0 }, t = v.t;
  for (let i = 0; i < n; i++) {
    const h = hf(i * 3 + row * 17), x = R.x + R.w * (i + 0.5 + (row ? 0.5 : 0)) / (n + 0.5);
    const pop = c.mood > 0 ? c.cheer * (0.5 + 0.5 * Math.sin(t * 12 + i * 1.7)) * s * 0.18 : 0, by = y - pop;
    const col = LAMBA[(i + row * 2) % LAMBA.length], col2 = LAMBA[(i + row * 2 + 2) % LAMBA.length];
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, by + s * 0.7, s * 0.78, s * 0.8, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = col2; ctx.beginPath(); ctx.ellipse(x, by + s * 0.7, s * 0.78, s * 0.8, 0, Math.PI * 1.05, Math.PI * 1.25); ctx.lineTo(x, by + s * 0.7); ctx.fill();
    ctx.strokeStyle = alpha('#ffffff', 0.5); ctx.lineWidth = 1.5; ctx.beginPath(); for (let k = -2; k <= 2; k++) { ctx.moveTo(x + k * s * 0.3, by + s * 0.7); ctx.lineTo(x + k * s * 0.22, by + s * 0.2 + Math.abs(k) * s * 0.1); } ctx.stroke();
    ctx.fillStyle = ['#8a5a3a', '#a6704a', '#6a4028'][i % 3]; ctx.beginPath(); ctx.arc(x, by - s * 0.08, s * 0.3, 0, TAU); ctx.fill();
    if (h > 0.4) { ctx.fillStyle = '#d9b060'; ctx.beginPath(); ctx.ellipse(x, by - s * 0.26, s * 0.58, s * 0.1, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x, by - s * 0.34, s * 0.3, s * 0.18, 0, Math.PI, TAU); ctx.fill(); ctx.fillStyle = RED; ctx.fillRect(x - s * 0.3, by - s * 0.32, s * 0.6, s * 0.06); }
    else { ctx.fillStyle = '#1a0e08'; ctx.beginPath(); ctx.arc(x, by - s * 0.12, s * 0.31, Math.PI * 0.95, Math.PI * 2.05); ctx.fill(); }
    if (c.mood > 0 && c.cheer > 0.25 && i % 3 === 0) { ctx.strokeStyle = ['#8a5a3a', '#a6704a'][i % 2]; ctx.lineWidth = s * 0.16; ctx.lineCap = 'round'; const a = Math.sin(t * 14 + i) * s * 0.1; ctx.beginPath(); ctx.moveTo(x - s * 0.6, by + s * 0.4); ctx.lineTo(x - s * 0.8 + a, by - s * 0.6); ctx.moveTo(x + s * 0.6, by + s * 0.4); ctx.lineTo(x + s * 0.8 - a, by - s * 0.6); ctx.stroke(); }
  }
}

function stage(g, S0, v) {
  const { ctx } = g, t = v.t, W = S0.w, H = S0.h, L = S0.x, T0 = S0.y;
  const hy = T0 + H * 0.5;
  ctx.fillStyle = vgrad(ctx, T0, hy, [[0, '#6cb4e4'], [0.7, '#bfe0ee'], [1, '#f4efd2']]); ctx.fillRect(L, T0, W, hy - T0 + 2);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; const cx = L + ((W * (0.15 + i * 0.27) + t * (3 + i)) % (W + 120)) - 60, cy = T0 + H * (0.22 + (i % 2) * 0.1); ctx.beginPath(); ctx.ellipse(cx, cy, 36, 9, 0, 0, TAU); ctx.ellipse(cx + 18, cy - 6, 22, 9, 0, 0, TAU); ctx.fill(); }
  // hills with rice terraces
  const hill = (base, amp, seed, c1, c2) => {
    ctx.beginPath(); ctx.moveTo(L, T0 + H); for (let i = 0; i <= 30; i++) { const f = i / 30; ctx.lineTo(L + W * f, base - amp * (0.5 + 0.3 * Math.sin(f * 5 + seed) + 0.2 * Math.sin(f * 11 + seed * 2))); } ctx.lineTo(L + W, T0 + H); ctx.closePath();
    ctx.fillStyle = vgrad(ctx, base - amp, base + H * 0.15, [[0, c1], [1, c2]]); ctx.fill();
    ctx.strokeStyle = 'rgba(30,90,30,0.28)'; ctx.lineWidth = 1.2;
    for (let k = 1; k < 5; k++) { ctx.beginPath(); for (let i = 0; i <= 30; i++) { const f = i / 30, y = base - amp * (0.5 + 0.3 * Math.sin(f * 5 + seed) + 0.2 * Math.sin(f * 11 + seed * 2)) + k * H * 0.025; i ? ctx.lineTo(L + W * f, y) : ctx.moveTo(L + W * f, y); } ctx.stroke(); }
  };
  hill(hy - H * 0.02, H * 0.16, 1, '#8ec86a', '#5aa04a');
  baobab(ctx, L + W * 0.66, hy + H * 0.04, H * 0.2);
  house(ctx, L + W * 0.84, hy + H * 0.1, H * 0.2, t);
  hill(hy + H * 0.1, H * 0.1, 4, '#78bc4a', '#3e8a38');
  house(ctx, L + W * 0.12, hy + H * 0.16, H * 0.26, t);
  house(ctx, L + W * 0.3, hy + H * 0.15, H * 0.2, t);
  jacaranda(ctx, L + W * 0.46, hy + H * 0.12, H * 0.2, t);
  // paddies: green strips with sky reflections
  const py = hy + H * 0.14;
  for (let r = 0; r < 4; r++) { const y = py + r * H * 0.035; ctx.fillStyle = r % 2 ? '#7cc04a' : '#5aa83a'; ctx.fillRect(L, y, W, H * 0.035); ctx.fillStyle = 'rgba(200,235,250,0.35)'; ctx.fillRect(L + ((r * 47 + t * 6) % W) - 40, y + H * 0.01, 60, 2); }
  // red earth performing ring
  const ry = T0 + H * 0.8, rx = W * 0.5;
  ctx.fillStyle = vgrad(ctx, ry - H * 0.12, T0 + H, [[0, '#c0643a'], [1, '#8a3a1c']]); ctx.fillRect(L, py + H * 0.14, W, T0 + H - py);
  ctx.fillStyle = 'rgba(255,220,170,0.28)'; ctx.beginPath(); ctx.ellipse(L + W * 0.5, ry, rx * 0.95, H * 0.095, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,240,200,0.4)'; ctx.lineWidth = 2; ctx.stroke();
  for (let i = 0; i < 6; i++) { ctx.fillStyle = `rgba(255,225,180,${0.16 + 0.1 * Math.sin(t * 2 + i)})`; ctx.beginPath(); ctx.ellipse(L + W * (0.2 + i * 0.12) + Math.sin(t + i) * 6, ry - H * 0.03 - (t * 5 + i * 9) % 14, 14, 3, 0, 0, TAU); ctx.fill(); }
  // band on both sides of the ring
  band(ctx, L + W * 0.09, ry - H * 0.02, H * 0.15, 'drum', t, false);
  band(ctx, L + W * 0.91, ry - H * 0.02, H * 0.15, 'horn', t, true);
  // the troupe
  const floorY = T0 + H * 0.84, FH = H * 0.4;
  place(ctx, S0, floorY, FH, v, { style: 'color', noShadow: false });
  // listeners in striped lambas
  audienceRow(ctx, S0, T0 + H * 0.93, H * 0.055, v, 1);
  audienceRow(ctx, S0, T0 + H * 1.0, H * 0.07, v, 0);

  // painted banner between two bamboo poles
  const px0 = L + W * 0.06, px1 = L + W * 0.94;
  for (const px of [px0, px1]) { ctx.fillStyle = hgrad(ctx, px - 4, px + 4, [[0, '#d8c070'], [0.5, '#8a7a30'], [1, '#4a4018']]); ctx.fillRect(px - 3.5, T0 + H * 0.01, 7, H * 0.78); ctx.fillStyle = '#3a3010'; for (let k = 1; k < 8; k++) ctx.fillRect(px - 4.5, T0 + H * (0.01 + k * 0.1), 9, 2); }
  const fs = Math.round(g.px(H > 520 ? 19 : 15)), font = `700 ${fs}px Georgia, "Times New Roman", serif`, lh = fs * 1.28;
  const bw = px1 - px0 - 14, bx = px0 + 7, by = T0 + H * 0.03, maxH = H * (H > 520 ? 0.3 : 0.36);
  const real = v.poem.length === 1 && v.figs.some((f) => f.c?.name === v.poem[0]) ? [] : v.poem;
  let poem = real.slice(-(H > 520 ? 4 : 3));
  let blocks = poem.map((l) => wrapText(ctx, l, bw - 30, font));
  const need = () => blocks.reduce((a, b) => a + b.length * lh, 0) + 40;
  while (blocks.length > 1 && need() > maxH) { blocks.shift(); poem = poem.slice(1); }
  const bh = Math.max(H * 0.1, need());
  const sway = Math.sin(t * 1.3) * 2;
  const cloth = () => { ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + bw, by); for (let i = 0; i <= 20; i++) ctx.lineTo(bx + bw - bw * i / 20, by + bh + Math.sin(i * 0.9 + t * 2) * 3 + sway * (i / 20)); ctx.closePath(); };
  cloth(); ctx.fillStyle = vgrad(ctx, by, by + bh, [[0, '#fbf3dc'], [1, '#e8d8b0']]); ctx.fill();
  ctx.save(); cloth(); ctx.clip();
  for (let i = 0; i < 2; i++) { const yy = i ? by + bh - 12 : by; ctx.fillStyle = RED; ctx.fillRect(bx, yy, bw, 9); ctx.fillStyle = GRN; ctx.fillRect(bx, yy + (i ? 9 : 9), bw, 4); ctx.fillStyle = WHT; for (let k = 0; k < bw; k += 16) poly(ctx, [[bx + k, yy], [bx + k + 8, yy + 9], [bx + k + 16, yy]]), ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(bx, by, bw, bh * 0.4);
  ctx.restore();
  cloth(); ctx.strokeStyle = 'rgba(70,40,10,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let ty = by + 16 + lh * 0.55;
  blocks.forEach((b, bi) => {
    const last = bi === blocks.length - 1 && v.poem.length > 0;
    ctx.globalAlpha = last ? clamp(v.lineAge / 0.8, 0.15, 1) : 1;
    b.forEach((ln) => { ctx.font = font; ctx.fillStyle = last ? '#b01c1c' : '#3a1a10'; ctx.fillText(ln, bx + bw / 2, ty); ty += lh; });
    ctx.globalAlpha = 1;
  });
  // warm morning light and edge shading
  const lg = ctx.createLinearGradient(L, T0, L + W, T0 + H); lg.addColorStop(0, 'rgba(255,240,180,0.16)'); lg.addColorStop(1, 'rgba(60,10,0,0.12)'); ctx.fillStyle = lg; ctx.fillRect(L, T0, W, H);
  vignette(ctx, S0, 0.25);
}

function malagasyPerson(T) {
  const { c } = T, hat = c.hat ?? 'straw', woman = hat === 'none', elder = !!c.beard;
  const top = c.color ?? RED;
  return person(T, {
    wTop: woman ? 0.14 : 0.125, wHem: woman ? 0.26 : 0.15, sleeve: 0.08, cuff: alpha(c.accent ?? YEL, 0.95),
    robe: () => (woman ? top : '#f6ecd2'), sleeveCol: () => (woman ? light(top, 0.1) : top),
    shoe: '#3a1a10',
    deco(ctx, G) {
      if (!woman) { // costume jacket over white trousers, lamba worn across the chest
        ctx.fillStyle = top; ctx.fillRect(-G.wH * 1.3, G.ty, G.wH * 2.6, (G.hem - G.ty) * 0.46);
        ctx.fillStyle = alpha('#ffffff', 0.7); ctx.fillRect(-1, G.ty, 2, (G.hem - G.ty) * 0.46);
        ctx.fillStyle = YEL; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, G.ty + G.H * (0.05 + i * 0.07), 2, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#3a2418'; poly(ctx, [[-G.wH * 0.12, G.hem], [0, G.ty + (G.hem - G.ty) * 0.62], [G.wH * 0.12, G.hem]]); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.moveTo(-G.wH * 0.3, G.ty + (G.hem - G.ty) * 0.5); ctx.lineTo(-G.wH * 0.4, G.hem); ctx.moveTo(G.wH * 0.3, G.ty + (G.hem - G.ty) * 0.5); ctx.lineTo(G.wH * 0.4, G.hem); ctx.stroke();
      }
      // the lamba: striped shawl from one shoulder, ends hanging
      ctx.save(); ctx.beginPath(); ctx.moveTo(-G.wT * 1.1, G.ty - 2); ctx.lineTo(-G.wT * 0.2, G.ty - 2); ctx.lineTo(G.wT * 1.2, G.ty + G.H * 0.36); ctx.lineTo(G.wT * 0.3, G.ty + G.H * 0.42); ctx.closePath(); ctx.clip();
      for (let i = 0; i < 12; i++) { ctx.fillStyle = [WHT, RED, WHT, GRN][i % 4]; ctx.fillRect(-G.wT * 1.2 + i * G.wT * 0.22, G.ty - 4, G.wT * 0.22, G.H * 0.5); }
      ctx.restore();
      ctx.fillStyle = alpha(RED, 0.9); poly(ctx, [[G.wT * 1.2, G.ty + G.H * 0.36], [G.wT * 0.3, G.ty + G.H * 0.42], [G.wT * 0.3 + 2, G.ty + G.H * 0.62], [G.wT * 1.1, G.ty + G.H * 0.58]]); ctx.fill();
      if (woman) { ctx.strokeStyle = YEL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-G.wH * 1.1, G.hem - G.H * 0.05); ctx.lineTo(G.wH * 1.1, G.hem - G.H * 0.05); ctx.stroke(); }
    },
    headgear(ctx, hx, hy, r) {
      if (woman) { // bright headscarf over braided hair
        ctx.fillStyle = YEL; ctx.beginPath(); ctx.ellipse(hx - r * 0.05, hy - r * 0.55, r * 1.1, r * 0.62, -0.1, Math.PI, TAU); ctx.fill();
        ctx.fillStyle = RED; ctx.fillRect(hx - r * 1.05, hy - r * 0.6, r * 2.1, r * 0.16);
        ctx.fillStyle = '#1a0e08'; ctx.beginPath(); ctx.arc(hx - r * 1.05, hy + r * 0.1, r * 0.3, 0, TAU); ctx.fill();
        ctx.fillStyle = YEL; ctx.beginPath(); ctx.arc(hx + r * 0.2, hy + r * 0.85, r * 0.12, 0, TAU); ctx.fill();
      } else { // straw hat with a ribbon
        ctx.fillStyle = vgrad(ctx, hy - r * 1.4, hy - r * 0.5, [[0, '#f0d078'], [1, '#c09a40']]);
        ctx.beginPath(); ctx.ellipse(hx, hy - r * 0.62, r * 1.95, r * 0.34, -0.04, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(hx, hy - r * 0.9, r * 0.95, r * 0.6, 0, Math.PI, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(100,70,10,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = -4; i <= 4; i++) { ctx.moveTo(hx + i * r * 0.2, hy - r * 0.62 - r * 0.3); ctx.lineTo(hx + i * r * 0.4, hy - r * 0.55); } ctx.stroke();
        ctx.fillStyle = c.color ?? RED; ctx.fillRect(hx - r * 0.97, hy - r * 0.86, r * 1.94, r * 0.18);
      }
    },
    hair: (ctx, hx, hy, r) => { ctx.fillStyle = elder ? '#b8b0a0' : '#1a0e08'; ctx.beginPath(); ctx.arc(hx, hy, r * 1.02, Math.PI * 0.95, Math.PI * 1.9); ctx.lineTo(hx, hy - r * 0.2); ctx.fill(); },
  });
}

register({
  id: 'malagasy',
  look: { frame: '#7a2a1a', glow: '#d9893a', ink: '#3a1a10' },
  stage,
  puppet(T) { return T.kind === 'beast' || T.kind === 'camel' || T.kind === 'duck' || T.kind === 'croc' ? false : malagasyPerson(T); },
  skin: {
    card: { top: '#7a2418', bot: '#4a1210', edge: YEL, inner: 'rgba(255,230,170,0.25)', ink: '#fff4e0', dim: '#f0d0b0', accent: '#ffd25a', shape: 'cut', r: 14, pattern: 'diamond', patCol: '#ffffff', patA: 0.07, band: 7, bandCol: GRN, bandPat: 'zig' },
    name: { fill: '#2f8a3a', fillEnd: YEL, ink: '#ffffff', edge: 'rgba(255,255,255,0.6)', shape: 'cut' },
    plaque: { base: '#9a2a1c', hot: '#c8452a', end: YEL, ink: '#fff6e8', inkEnd: '#2a0a04', edge: 'rgba(40,6,0,0.7)', inner: 'rgba(255,230,160,0.5)', shape: 'cut', r: 12, pattern: 'zig', patCol: '#ffffff', patA: 0.14, med: 'star', medA: '#ffffff', medB: '#e8b24a', medInk: '#7a1a0c', medEdge: '#5a1408' },
    meter: { fill: '#2a0a08', edge: 'rgba(255,255,255,0.18)', bead: 'leaf', col: '#7ccf4a', ink: '#fff4e0' },
    trans: 'cloth', transCol: RED,
    snd: { root: 330, scale: [1, 1.125, 1.25, 1.5, 1.667], hit: 'pluck', voiceVol: 0.035 },
    voice: 3,
  },
});
export default null;

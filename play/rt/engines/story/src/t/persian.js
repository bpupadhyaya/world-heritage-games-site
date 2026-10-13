// Theatre: Persian bayt-bazi. An illuminated manuscript page: lapis and gold arabesque border, a pointed-arch garden
// miniature (cypress, blossom tree, tiled pavilion, rill, carpet) where the speakers sit, and the verses so far in ink.
import { register } from '../theatres.js';
import { mix, dark, light, alpha, poly, vgrad, hgrad } from '../figures.js';
import { place, vignette, TAU } from '../kit.js';
import { pattern } from '../skins.js';
import { person, sparkle, wrapText, hf, clampv as clamp } from './_verskit.js';

const LAP = '#1f3f8f', LAP2 = '#12285e', GOLD = '#e0b44a', CREAM = '#f6ead0', TURQ = '#2a9aa8';
const archPath = (ctx, x, y, w, h, keep) => {
  if (!keep) ctx.beginPath();
  ctx.moveTo(x, y + h); ctx.lineTo(x, y + h * 0.3); ctx.quadraticCurveTo(x, y + h * 0.07, x + w / 2, y);
  ctx.quadraticCurveTo(x + w, y + h * 0.07, x + w, y + h * 0.3); ctx.lineTo(x + w, y + h); ctx.closePath();
};
function rosette(ctx, x, y, r, a) {
  ctx.fillStyle = LAP2; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = GOLD;
  for (let k = 0; k < 8; k++) { const an = k * Math.PI / 4 + a; ctx.beginPath(); ctx.ellipse(x + Math.cos(an) * r * 0.58, y + Math.sin(an) * r * 0.58, r * 0.3, r * 0.14, an, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#d8403a'; ctx.beginPath(); ctx.arc(x, y, r * 0.24, 0, TAU); ctx.fill();
}
function cypress(ctx, x, base, h, t, ph) {
  const w = h * 0.11, sw = Math.sin(t * 0.8 + ph) * w * 0.15;
  ctx.fillStyle = vgrad(ctx, base - h, base, [[0, '#2a6a3a'], [1, '#0f3a22']]);
  ctx.beginPath(); ctx.moveTo(x, base); ctx.bezierCurveTo(x - w * 1.6, base - h * 0.4, x - w * 0.8 + sw, base - h * 0.8, x + sw * 2, base - h);
  ctx.bezierCurveTo(x + w * 0.8 + sw, base - h * 0.8, x + w * 1.6, base - h * 0.4, x, base); ctx.fill();
  ctx.strokeStyle = 'rgba(160,230,150,0.35)'; ctx.lineWidth = 1.2; ctx.beginPath();
  for (let i = 0; i < 5; i++) { const y = base - h * (0.2 + i * 0.16); ctx.moveTo(x - w * (0.9 - i * 0.12), y); ctx.quadraticCurveTo(x, y - h * 0.05, x + w * (0.9 - i * 0.12), y); }
  ctx.stroke();
}
function samovar(ctx, x, y, s) {
  ctx.fillStyle = hgrad(ctx, x - s * 0.3, x + s * 0.3, [[0, '#a07a22'], [0.4, '#f4d880'], [1, '#8a6218']]);
  ctx.beginPath(); ctx.ellipse(x, y - s * 0.4, s * 0.26, s * 0.38, 0, 0, TAU); ctx.fill();
  ctx.fillRect(x - s * 0.12, y - s * 0.06, s * 0.24, s * 0.1);
  ctx.beginPath(); ctx.ellipse(x, y - s * 0.78, s * 0.14, s * 0.06, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#d8403a'; ctx.beginPath(); ctx.ellipse(x, y - s * 0.95, s * 0.14, s * 0.1, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f4d880'; ctx.fillRect(x + s * 0.24, y - s * 0.42, s * 0.14, s * 0.05);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y - s * 0.4, s * 0.26, s * 0.38, 0, 0, TAU); ctx.stroke();
}

function stage(g, S0, v) {
  const { ctx } = g, t = v.t, W = S0.w, H = S0.h, m = Math.min(W, H) * 0.04;
  // paper
  ctx.fillStyle = vgrad(ctx, S0.y, S0.y + H, [[0, '#fbf1d6'], [1, '#e8d6a6']]); ctx.fillRect(S0.x, S0.y, W, H);
  ctx.fillStyle = 'rgba(140,100,40,0.09)'; for (let i = 0; i < 90; i++) ctx.fillRect(S0.x + W * hf(i), S0.y + H * hf(i + 50), 1 + (i % 3), 1);
  // lapis border band carrying a gold vine
  const o0 = m * 0.35, o1 = m * 1.65;
  ctx.save(); ctx.beginPath(); ctx.rect(S0.x + o0, S0.y + o0, W - o0 * 2, H - o0 * 2); ctx.rect(S0.x + o1, S0.y + o1, W - o1 * 2, H - o1 * 2); ctx.clip('evenodd');
  ctx.fillStyle = vgrad(ctx, S0.y, S0.y + H, [[0, LAP], [1, LAP2]]); ctx.fillRect(S0.x, S0.y, W, H);
  pattern(ctx, 'arab', S0.x, S0.y, W, H, GOLD, 0.55);
  ctx.restore();
  ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.strokeRect(S0.x + o0, S0.y + o0, W - o0 * 2, H - o0 * 2); ctx.strokeRect(S0.x + o1, S0.y + o1, W - o1 * 2, H - o1 * 2);
  for (const [cx, cy] of [[S0.x + o1, S0.y + o1], [S0.x + W - o1, S0.y + o1], [S0.x + o1, S0.y + H - o1], [S0.x + W - o1, S0.y + H - o1]]) rosette(ctx, cx, cy, m * 1.5, t * 0.15);
  // heading band
  const hbH = H * 0.06, hbY = S0.y + o1 + m * 0.9, hbX = S0.x + m * 3.2, hbW = W - m * 6.4;
  ctx.fillStyle = vgrad(ctx, hbY, hbY + hbH, [[0, LAP], [1, LAP2]]); ctx.fillRect(hbX, hbY, hbW, hbH);
  pattern(ctx, 'arab', hbX, hbY, hbW, hbH, GOLD, 0.4);
  ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5; ctx.strokeRect(hbX, hbY, hbW, hbH);
  rosette(ctx, hbX + hbW / 2, hbY + hbH / 2, hbH * 0.62, t * 0.3);
  // the miniature painting in a pointed arch
  const Pm = { x: hbX, y: hbY + hbH + m * 0.8, w: hbW, h: H * (H > 520 ? 0.56 : 0.5) };
  const base0 = Pm.y + Pm.h;
  ctx.save(); archPath(ctx, Pm.x, Pm.y, Pm.w, Pm.h); ctx.clip();
  ctx.fillStyle = vgrad(ctx, Pm.y, base0, [[0, '#d4a63a'], [0.6, '#f0d27a'], [1, '#f8e8a8']]); ctx.fillRect(Pm.x, Pm.y, Pm.w, Pm.h);
  ctx.strokeStyle = alpha(LAP, 0.55); ctx.lineWidth = 1.6;
  for (let i = 0; i < 3; i++) { const cx = Pm.x + Pm.w * (0.2 + i * 0.3) + Math.sin(t * 0.3 + i) * 4, cy = Pm.y + Pm.h * (0.2 + (i % 2) * 0.1); ctx.beginPath(); ctx.moveTo(cx - 18, cy); ctx.bezierCurveTo(cx - 8, cy - 14, cx + 8, cy - 12, cx + 20, cy - 2); ctx.bezierCurveTo(cx + 8, cy + 4, cx - 8, cy + 6, cx - 18, cy); ctx.stroke(); }
  ctx.fillStyle = '#e8a08a'; ctx.beginPath(); ctx.ellipse(Pm.x + Pm.w * 0.2, Pm.y + Pm.h * 0.55, Pm.w * 0.4, Pm.h * 0.2, 0, Math.PI, TAU); ctx.fill();
  ctx.fillStyle = '#b4c888'; ctx.beginPath(); ctx.ellipse(Pm.x + Pm.w * 0.78, Pm.y + Pm.h * 0.56, Pm.w * 0.36, Pm.h * 0.17, 0, Math.PI, TAU); ctx.fill();
  const wy = Pm.y + Pm.h * 0.52;
  ctx.fillStyle = '#f6ead0'; ctx.fillRect(Pm.x, wy, Pm.w, Pm.h * 0.12);
  for (let i = 0, n = Math.round(Pm.w / 14); i < n; i++) { ctx.fillStyle = i % 2 ? TURQ : LAP; ctx.fillRect(Pm.x + i * Pm.w / n, wy + Pm.h * 0.04, Pm.w / n - 1, Pm.h * 0.04); }
  // tiled pavilion
  const pw = Pm.w * 0.36, px = Pm.x + Pm.w * 0.5 - pw / 2, ptop = Pm.y + Pm.h * 0.22;
  ctx.fillStyle = '#f2dfb0'; ctx.fillRect(px, ptop, pw, wy - ptop);
  ctx.fillStyle = TURQ; ctx.fillRect(px + pw * 0.08, ptop + Pm.h * 0.06, pw * 0.84, wy - ptop - Pm.h * 0.06);
  ctx.fillStyle = '#10305a'; archPath(ctx, px + pw * 0.24, ptop + Pm.h * 0.1, pw * 0.52, wy - ptop - Pm.h * 0.1); ctx.fill();
  ctx.fillStyle = vgrad(ctx, ptop, ptop + Pm.h * 0.05, [[0, GOLD], [1, '#a07a22']]); ctx.fillRect(px - pw * 0.04, ptop - Pm.h * 0.03, pw * 1.08, Pm.h * 0.05);
  ctx.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(px + pw * (0.14 + i * 0.145), ptop + Pm.h * 0.095, 1.6, 0, TAU); ctx.fill(); }
  // garden
  ctx.fillStyle = vgrad(ctx, wy, base0, [[0, '#6ab058'], [1, '#2a7a40']]); ctx.fillRect(Pm.x, wy + Pm.h * 0.12, Pm.w, base0 - wy);
  for (let i = 0; i < 40; i++) { ctx.fillStyle = ['#f4a0b8', '#fff', '#f6d24a', '#d8403a'][i % 4]; ctx.beginPath(); ctx.arc(Pm.x + Pm.w * hf(i + 5), wy + Pm.h * (0.16 + 0.3 * hf(i + 20)), 1.8, 0, TAU); ctx.fill(); }
  const ry = Pm.y + Pm.h * 0.7;
  ctx.fillStyle = vgrad(ctx, ry, ry + Pm.h * 0.08, [[0, '#4ac0cc'], [1, '#1f7a8a']]); ctx.fillRect(Pm.x, ry, Pm.w, Pm.h * 0.08);
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = 0; x < Pm.w; x += 18) { const xx = Pm.x + ((x + t * 14) % Pm.w); ctx.moveTo(xx, ry + Pm.h * 0.03); ctx.lineTo(xx + 8, ry + Pm.h * 0.03); } ctx.stroke();
  ctx.fillStyle = GOLD; for (let i = 0; i < 2; i++) { const fx = Pm.x + ((i * 0.5 + 0.1 + t * 0.03) % 1) * Pm.w; ctx.beginPath(); ctx.ellipse(fx, ry + Pm.h * 0.045, 6, 2.6, 0, 0, TAU); ctx.fill(); }
  cypress(ctx, Pm.x + Pm.w * 0.08, wy + Pm.h * 0.22, Pm.h * 0.62, t, 0);
  cypress(ctx, Pm.x + Pm.w * 0.93, wy + Pm.h * 0.2, Pm.h * 0.56, t, 2);
  // blossom tree
  const tx = Pm.x + Pm.w * 0.84, tb = wy + Pm.h * 0.2;
  ctx.strokeStyle = '#4a2c1c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(tx, tb); ctx.quadraticCurveTo(tx - 6, tb - Pm.h * 0.2, tx + 4, tb - Pm.h * 0.4); ctx.moveTo(tx - 2, tb - Pm.h * 0.2); ctx.lineTo(tx - 22, tb - Pm.h * 0.32); ctx.stroke();
  for (let i = 0; i < 22; i++) { ctx.fillStyle = i % 3 ? '#f6a8c0' : '#fff0f4'; const a = hf(i) * TAU, d = hf(i + 9) * Pm.h * 0.17; ctx.beginPath(); ctx.arc(tx - 6 + Math.cos(a) * d * 1.3 + Math.sin(t + i) * 0.8, tb - Pm.h * 0.36 + Math.sin(a) * d, 3.4, 0, TAU); ctx.fill(); }
  // carpet in the foreground
  const cy0 = Pm.y + Pm.h * 0.66;
  ctx.fillStyle = '#7a1822'; poly(ctx, [[Pm.x + Pm.w * 0.06, cy0], [Pm.x + Pm.w * 0.94, cy0], [Pm.x + Pm.w * 1.02, base0], [Pm.x - Pm.w * 0.02, base0]]); ctx.fill();
  ctx.save(); poly(ctx, [[Pm.x + Pm.w * 0.06, cy0], [Pm.x + Pm.w * 0.94, cy0], [Pm.x + Pm.w * 1.02, base0], [Pm.x - Pm.w * 0.02, base0]]); ctx.clip();
  pattern(ctx, 'diamond', Pm.x, cy0, Pm.w, base0 - cy0, '#f0c860', 0.35);
  ctx.fillStyle = '#172a60'; ctx.beginPath(); ctx.ellipse(Pm.x + Pm.w / 2, cy0 + (base0 - cy0) * 0.62, Pm.w * 0.26, (base0 - cy0) * 0.3, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = CREAM; ctx.lineWidth = 3; ctx.strokeRect(Pm.x + 3, cy0 + 3, Pm.w - 6, base0 - cy0 + 4);
  ctx.restore();
  samovar(ctx, Pm.x + Pm.w * 0.1, cy0 + (base0 - cy0) * 0.62, Pm.h * 0.24);
  ctx.fillStyle = '#c0392b'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(Pm.x + Pm.w * (0.9 + (i - 1) * 0.02), cy0 + (base0 - cy0) * 0.6 - (i % 2) * 5, 6, 0, TAU); ctx.fill(); }
  // speakers seated on the carpet, with warm light
  const floorY = Pm.y + Pm.h * 0.95;
  for (const f of v.figs) { if (f.alpha < 0.05) continue; ctx.fillStyle = `rgba(20,6,10,${0.3 * f.alpha})`; ctx.beginPath(); ctx.ellipse(Pm.x + Pm.w * f.x, floorY + 2, Pm.h * 0.2, Pm.h * 0.03, 0, 0, TAU); ctx.fill(); }
  place(ctx, Pm, floorY, Pm.h * 0.9, v, { style: 'color', noShadow: true });
  const gl = ctx.createRadialGradient(Pm.x + Pm.w * 0.5, Pm.y + Pm.h * 0.3, 4, Pm.x + Pm.w * 0.5, Pm.y + Pm.h * 0.5, Pm.w * 0.7); gl.addColorStop(0, 'rgba(255,230,140,0.18)'); gl.addColorStop(1, 'rgba(60,20,0,0.22)'); ctx.fillStyle = gl; ctx.fillRect(Pm.x, Pm.y, Pm.w, Pm.h);
  ctx.restore();
  // spandrels, frame
  ctx.save(); ctx.beginPath(); ctx.rect(Pm.x - 1, Pm.y - 1, Pm.w + 2, Pm.h + 2); archPath(ctx, Pm.x, Pm.y, Pm.w, Pm.h, true); ctx.clip('evenodd');
  ctx.fillStyle = LAP2; ctx.fillRect(Pm.x - 1, Pm.y - 1, Pm.w + 2, Pm.h + 2); pattern(ctx, 'dots', Pm.x, Pm.y, Pm.w, Pm.h * 0.4, GOLD, 0.6); ctx.restore();
  archPath(ctx, Pm.x, Pm.y, Pm.w, Pm.h); ctx.strokeStyle = GOLD; ctx.lineWidth = 3; ctx.stroke();
  archPath(ctx, Pm.x + 4, Pm.y + 5, Pm.w - 8, Pm.h - 5); ctx.strokeStyle = 'rgba(255,240,180,0.5)'; ctx.lineWidth = 1; ctx.stroke();
  // verses in ink
  const fs = Math.round(g.px(H > 520 ? 20 : 16)), font = `italic 600 ${fs}px Georgia, "Times New Roman", serif`;
  const tx0 = S0.x + o1 + m * 1.6, tw = W - (o1 + m * 1.6) * 2, topY = base0 + m * 1.3, botY = S0.y + H - o1 - m * 1.2;
  ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(tx0 + tw * 0.15, base0 + m * 0.6); ctx.lineTo(tx0 + tw * 0.85, base0 + m * 0.6); ctx.stroke();
  ctx.fillStyle = GOLD; poly(ctx, [[S0.x + W / 2 - 5, base0 + m * 0.6], [S0.x + W / 2, base0 + m * 0.6 - 5], [S0.x + W / 2 + 5, base0 + m * 0.6], [S0.x + W / 2, base0 + m * 0.6 + 5]]); ctx.fill();
  const poem = (v.poem.length === 1 && v.figs.some((f) => f.c?.name === v.poem[0]) ? [] : v.poem).slice(-4);
  let blocks = poem.map((ln) => wrapText(ctx, ln, tw - fs * 1.6, font));
  const lh = fs * 1.32;
  while (blocks.length > 1 && blocks.reduce((a, b) => a + b.length * lh + fs * 0.3, 0) > botY - topY) blocks.shift();
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.font = font;
  let y = topY + lh * 0.5;
  const nb = blocks.length, start = poem.length - nb;
  blocks.forEach((b, bi) => {
    const last = start + bi === poem.length - 1;
    ctx.globalAlpha = last ? clamp(v.lineAge / 0.8, 0.15, 1) : 1;
    b.forEach((ln, k) => {
      if (k === 0) { ctx.fillStyle = last ? '#c0392b' : GOLD; poly(ctx, [[tx0 + 4, y], [tx0 + 9, y - 5], [tx0 + 14, y], [tx0 + 9, y + 5]]); ctx.fill(); }
      ctx.font = font; ctx.fillStyle = last ? '#8a1f14' : '#1b2a5a'; ctx.fillText(ln, S0.x + W / 2, y); y += lh;
    });
    y += fs * 0.3; ctx.globalAlpha = 1;
  });
  // reed pen and pen box
  const qx = S0.x + W - o1 - m * 3.6, qy = S0.y + H - o1 - m * 1.4;
  ctx.fillStyle = vgrad(ctx, qy - m, qy + m * 0.4, [[0, '#9a2a2a'], [1, '#4a1010']]); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(qx - m * 1.6, qy - m * 0.5, m * 3.2, m, 3) : ctx.rect(qx - m * 1.6, qy - m * 0.5, m * 3.2, m); ctx.fill();
  ctx.strokeStyle = GOLD; ctx.lineWidth = 1; ctx.stroke();
  ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(qx - m, qy - m * 0.3); ctx.lineTo(qx + m * 1.4, qy - m * 1.9); ctx.stroke();
  // gold leaf glints
  const gp = [[hbX + hbW * 0.2, hbY + hbH * 0.5], [hbX + hbW * 0.8, hbY + hbH * 0.5], [Pm.x + Pm.w * 0.5, Pm.y + 2], [Pm.x + 6, Pm.y + Pm.h * 0.5], [S0.x + o1, S0.y + H * 0.5], [S0.x + W - o1, S0.y + H * 0.3]];
  gp.forEach(([x, y2], i) => { const a = Math.max(0, Math.sin(t * 1.4 + i * 1.9)); sparkle(ctx, x, y2, m * (0.6 + a), a * a); });
  vignette(ctx, S0, 0.2);
}

function persianPerson(T) {
  const { c, kind } = T, hat = c.hat ?? 'cap', col = c.color ?? '#2f6a7a', gold = c.accent ?? '#e8c27a';
  const turban = hat === 'cap' && c.beard;
  return person(T, {
    seated: true, wTop: 0.17, wHem: kind === 'child' ? 0.4 : 0.44, sleeve: 0.09,
    robe: () => col, sleeveCol: () => light(col, 0.04), cuff: gold,
    deco(ctx, G) { // gold hem, neckline and scattered boteh motifs
      ctx.strokeStyle = gold; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, G.ty); ctx.lineTo(0, G.hem); ctx.stroke();
      ctx.fillStyle = alpha(gold, 0.85); ctx.fillRect(-G.wH * 1.2, G.hem - G.H * 0.06, G.wH * 2.4, G.H * 0.03);
      for (let i = 0; i < 7; i++) { const bx = (hf(i + 3) - 0.5) * G.wH * 1.5, by = G.ty + (G.hem - G.ty) * (0.35 + 0.5 * hf(i + 11)); ctx.beginPath(); ctx.ellipse(bx, by, G.H * 0.022, G.H * 0.04, 0.5, 0, TAU); ctx.fill(); }
      ctx.fillStyle = mix(col, '#ffffff', 0.5); poly(ctx, [[-G.wT * 0.5, G.ty], [G.wT * 0.5, G.ty], [0, G.ty + G.H * 0.1]]); ctx.fill();
    },
    headgear(ctx, hx, hy, r, TT, G) {
      if (hat === 'hood') { // headscarf with gold border, falling over the shoulders
        const sc = mix(col, '#ffffff', 0.3);
        ctx.fillStyle = sc; ctx.beginPath(); ctx.ellipse(hx - r * 0.12, hy - r * 0.15, r * 1.34, r * 1.38, 0, 0, TAU); ctx.ellipse(hx + r * 0.2, hy + r * 0.08, r * 0.98, r * 1.04, 0, 0, TAU); ctx.fill('evenodd');
        ctx.beginPath(); ctx.moveTo(hx - r * 1.3, hy + r * 0.3); ctx.quadraticCurveTo(hx - r * 1.6, hy + r * 2.4, hx - G.wT * 1.3, hy + r * 3.0); ctx.lineTo(hx + r * 0.4, hy + r * 2.0); ctx.quadraticCurveTo(hx - r * 0.2, hy + r * 1.3, hx - r * 0.6, hy + r * 1.0); ctx.fill();
        ctx.strokeStyle = gold; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(hx + r * 0.2, hy + r * 0.08, r * 0.98, r * 1.04, 0, Math.PI * 0.9, Math.PI * 2.1); ctx.stroke();
      } else if (turban) { // layered white turban with a gold band
        for (let i = 0; i < 3; i++) { ctx.fillStyle = i % 2 ? '#e8e0d0' : '#fbf6ea'; ctx.beginPath(); ctx.ellipse(hx - r * 0.05, hy - r * (0.5 + i * 0.3), r * (1.25 - i * 0.1), r * 0.42, -0.06, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.stroke(); }
        ctx.fillStyle = gold; ctx.fillRect(hx - r * 1.1, hy - r * 0.62, r * 2.2, r * 0.14);
      } else { // child's embroidered skull-cap with a tassel
        ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.ellipse(hx, hy - r * 0.55, r * 0.98, r * 0.62, 0, Math.PI, TAU); ctx.fill();
        ctx.fillStyle = gold; ctx.fillRect(hx - r * 0.98, hy - r * 0.6, r * 1.96, r * 0.14);
        for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(hx + i * r * 0.36, hy - r * 0.92 + Math.abs(i) * r * 0.1, r * 0.07, 0, TAU); ctx.fill(); }
        ctx.strokeStyle = gold; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(hx - r * 0.2, hy - r * 1.15); ctx.quadraticCurveTo(hx - r * 0.9, hy - r * 1.2, hx - r * 0.95, hy - r * 0.3); ctx.stroke();
      }
    },
    hair: (ctx, hx, hy, r) => { if (hat !== 'hood') { ctx.fillStyle = c.hair ?? '#2a1c14'; ctx.beginPath(); ctx.arc(hx, hy, r * 1.02, Math.PI * 0.95, Math.PI * 1.9); ctx.lineTo(hx, hy - r * 0.2); ctx.fill(); } },
  });
}

register({
  id: 'persian',
  look: { wall: '#f1e6cc', floor: '#d4b98a', ink: '#1b2a5a', frame: '#e0b44a', glow: '#e0b44a' },
  stage,
  puppet(T) { return T.kind === 'beast' || T.kind === 'camel' || T.kind === 'duck' || T.kind === 'croc' ? false : persianPerson(T); },
  skin: {
    card: { top: '#27438f', bot: '#13265c', edge: GOLD, inner: 'rgba(255,230,160,0.3)', ink: '#fbf3dc', dim: '#cdd6ee', accent: '#f0cf78', shape: 'ogee', r: 16, pattern: 'arab', patCol: GOLD, patA: 0.16 },
    name: { fill: '#b8902e', fillEnd: '#f0cf78', ink: '#14204a', edge: 'rgba(255,245,200,0.7)', shape: 'round' },
    plaque: { base: '#1d3a82', hot: '#3262c0', end: '#f0cf78', ink: '#fbf3dc', inkEnd: '#14204a', edge: 'rgba(8,16,50,0.8)', inner: 'rgba(240,207,120,0.55)', shape: 'ogee', r: 14, pattern: 'arab', patCol: GOLD, patA: 0.14, med: 'flower', medA: '#fff0b8', medB: '#c9a24a', medInk: '#14204a', medEdge: '#7a5a14' },
    meter: { fill: '#0e1b44', edge: 'rgba(240,207,120,0.3)', bead: 'star', col: '#f0cf78', ink: '#fbf3dc' },
    trans: 'page', transCol: '#f3e6c4',
    snd: { root: 293, scale: [1, 1.067, 1.25, 1.333, 1.5], hit: 'bell', voiceVol: 0.03 },
    voice: 6,
  },
});
export default null;

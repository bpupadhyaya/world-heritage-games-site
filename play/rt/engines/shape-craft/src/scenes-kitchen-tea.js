// shape-craft 1.26.0 Kitchen Crafts: tea rooms for the `pour` technique. Each game has its own room: a riad courtyard (zellige, a horseshoe arch, a brass lantern)
// for the Moroccan high pour, a Fujian tea house (carved screen, shelf of pots, bamboo) for the gongfu pour, a Hong Kong cha chaan teng (green tile, a steel urn)
// for the milk tea. Registered names are all prefixed kc-tea- / kctea.
import { registerSceneSet, registerProp } from './registry.js';
import { hash } from './geom.js';
import { tint, rgba, rrect, mix } from './fx.js';
import { lg, rg, ell, cast, TAU } from './props.js';

const grad = (ctx, r, H, a, b) => { ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, a], [1, b]]); ctx.fillRect(r.x, r.y, r.w, H); };
const speck = (ctx, x, y, w, h, n, c, a, seed, sz = 2) => { ctx.fillStyle = rgba(c, a); ctx.beginPath(); for (let k = 0; k < n; k++) ctx.rect(x + hash(k, seed) * w, y + hash(k, seed + 1) * h, sz * (0.5 + hash(k, seed + 2)), sz * (0.5 + hash(k, seed + 3))); ctx.fill(); };

// zellige: a field of square tiles with a coloured diamond and a star on each, over a thin grout
function zellige(ctx, x, y, w, h, cell, pal) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  for (let j = 0; y + j * cell < y + h; j++) for (let i = 0; x + i * cell < x + w; i++) {
    const px = x + i * cell, py = y + j * cell, a = pal[(i + j) % pal.length], b = pal[(i + 2 * j + 1) % pal.length];
    ctx.fillStyle = '#efe7d2'; ctx.fillRect(px, py, cell, cell);
    ctx.fillStyle = a; ctx.beginPath(); ctx.moveTo(px + cell / 2, py + 1); ctx.lineTo(px + cell - 1, py + cell / 2); ctx.lineTo(px + cell / 2, py + cell - 1); ctx.lineTo(px + 1, py + cell / 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = b; ctx.beginPath(); for (let k = 0; k < 8; k++) { const ang = (k / 8) * TAU - Math.PI / 8, r = k % 2 ? cell * 0.14 : cell * 0.27; ctx.lineTo(px + cell / 2 + Math.cos(ang) * r, py + cell / 2 + Math.sin(ang) * r); } ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#efe7d2'; ell(ctx, px + cell / 2, py + cell / 2, cell * 0.055, cell * 0.055); ctx.fill();
    ctx.strokeStyle = 'rgba(40,30,20,0.22)'; ctx.lineWidth = 1; ctx.strokeRect(px + 0.5, py + 0.5, cell, cell);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(px + 1, py + 1, cell - 2, cell * 0.22);
  }
  ctx.restore();
}
function lantern(ctx, x, y, s, glow = 1) { // a pierced brass lantern on a chain, lit from inside
  ctx.save(); ctx.strokeStyle = '#5a4018'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - s * 0.9); ctx.lineTo(x, y - s * 0.55); ctx.stroke();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rg(ctx, x, y, 2, s * 1.7, [[0, `rgba(255,190,90,${0.5 * glow})`], [1, 'rgba(255,150,50,0)']]); ctx.fillRect(x - s * 1.7, y - s * 1.7, s * 3.4, s * 3.4); ctx.restore();
  ctx.fillStyle = lg(ctx, x - s * 0.3, 0, x + s * 0.3, 0, [[0, '#7a5416'], [0.5, '#e8c460'], [1, '#6a4410']]); ctx.beginPath(); ctx.moveTo(x - s * 0.08, y - s * 0.55); ctx.lineTo(x + s * 0.08, y - s * 0.55); ctx.lineTo(x + s * 0.32, y - s * 0.3); ctx.lineTo(x - s * 0.32, y - s * 0.3); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - s * 0.3, y - s * 0.3); ctx.lineTo(x + s * 0.3, y - s * 0.3); ctx.lineTo(x + s * 0.22, y + s * 0.34); ctx.lineTo(x - s * 0.22, y + s * 0.34); ctx.closePath(); ctx.fillStyle = lg(ctx, 0, y - s * 0.3, 0, y + s * 0.34, [[0, '#ffe4a0'], [1, '#ffb050']]); ctx.fill();
  ctx.fillStyle = '#4a3010'; for (let k = 0; k < 3; k++) for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.moveTo(x - s * 0.18 + k * s * 0.18, y - s * 0.2 + j * s * 0.14); ctx.lineTo(x - s * 0.12 + k * s * 0.18, y - s * 0.13 + j * s * 0.14); ctx.lineTo(x - s * 0.18 + k * s * 0.18, y - s * 0.06 + j * s * 0.14); ctx.lineTo(x - s * 0.24 + k * s * 0.18, y - s * 0.13 + j * s * 0.14); ctx.fill(); }
  ctx.strokeStyle = '#8a6420'; ctx.lineWidth = 2.4; for (const q of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + q * s * 0.3, y - s * 0.3); ctx.lineTo(x + q * s * 0.22, y + s * 0.34); ctx.stroke(); }
  ctx.fillStyle = '#c9a040'; ctx.beginPath(); ctx.moveTo(x - s * 0.22, y + s * 0.34); ctx.lineTo(x + s * 0.22, y + s * 0.34); ctx.lineTo(x, y + s * 0.5); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function horseshoe(ctx, cx, top, w, h) { ctx.beginPath(); const r = w / 2 * 1.08, cy = top + r; ctx.moveTo(cx - w / 2, top + h); ctx.lineTo(cx - w / 2, cy); ctx.arc(cx, cy, r, Math.PI + 0.35, TAU - 0.35 + 0.0001, false); ctx.lineTo(cx + w / 2, top + h); ctx.closePath(); }

const walls = {
  kctearyad(ctx, s, r, H, t) { // riad courtyard wall: carved cedar cornice, pink plaster, a horseshoe arch onto a garden, a lantern, zellige dado
    grad(ctx, r, H, '#f1d3a6', '#d9a878'); speck(ctx, r.x, r.y, r.w, H * 0.7, 160, '#7a4a20', 0.08, 211, 3);
    const dado = H * 0.4, dy = r.y + H - dado;
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H * 0.17, [[0, '#3a2210'], [1, '#6a4020']]); ctx.fillRect(r.x, r.y, r.w, H * 0.17);
    ctx.fillStyle = 'rgba(240,190,110,0.5)'; for (let x = r.x + 6; x < r.x + r.w; x += 16) { ctx.beginPath(); ctx.moveTo(x, r.y + H * 0.085); ctx.lineTo(x + 5, r.y + H * 0.03); ctx.lineTo(x + 10, r.y + H * 0.085); ctx.lineTo(x + 5, r.y + H * 0.14); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(r.x, r.y + H * 0.17, r.w, 6);
    const ax = r.x + r.w * 0.27, aw = Math.min(150, r.w * 0.24), ay = r.y + H * 0.2, ah = H * 0.6;
    ctx.save(); horseshoe(ctx, ax, ay, aw, ah); ctx.clip();
    ctx.fillStyle = lg(ctx, 0, ay, 0, ay + ah, [[0, '#6ab4e0'], [0.55, '#cfeaf2'], [1, '#e8f0d0']]); ctx.fillRect(ax - aw, ay, aw * 2, ah);
    ctx.fillStyle = '#6a9a4a'; ctx.fillRect(ax - aw, ay + ah * 0.78, aw * 2, ah * 0.3);
    ctx.strokeStyle = '#3a5a22'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax + aw * 0.15, ay + ah); ctx.quadraticCurveTo(ax + aw * 0.2, ay + ah * 0.55, ax + aw * 0.1, ay + ah * 0.3); ctx.stroke();
    for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.5; ctx.beginPath(); ctx.moveTo(ax + aw * 0.1, ay + ah * 0.3); ctx.quadraticCurveTo(ax + aw * 0.1 + Math.cos(a) * 20, ay + ah * 0.3 + Math.sin(a) * 14, ax + aw * 0.1 + Math.cos(a) * 32, ay + ah * 0.3 + Math.sin(a) * 6 + 12); ctx.stroke(); }
    ctx.restore();
    ctx.save(); horseshoe(ctx, ax, ay, aw, ah); ctx.lineWidth = 7; ctx.strokeStyle = '#1f6f8a'; ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = '#f0d078'; ctx.stroke(); ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(ax - aw / 2 - 8, ay, 8, ah);
    lantern(ctx, r.x + r.w * 0.72, r.y + H * 0.42, H * 0.42, 1);
    zellige(ctx, r.x, dy, r.w, dado, Math.max(16, dado / 3), ['#1f6f8a', '#1c3f8f', '#2c8a5c', '#b8431f']);
    ctx.fillStyle = '#1c5a3a'; ctx.fillRect(r.x, dy - 6, r.w, 6); ctx.fillStyle = 'rgba(255,240,200,0.5)'; ctx.fillRect(r.x, dy - 6, r.w, 1.5);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(r.x, dy, r.w, 5);
  },
  kcteahouse(ctx, s, r, H, t) { // Fujian tea house: carved wooden lattice screen, a shelf of small pots, bamboo, a scroll
    grad(ctx, r, H, '#e8dcc2', '#cdbf9c'); speck(ctx, r.x, r.y, r.w, H, 120, '#6a5a3a', 0.07, 231, 3);
    const post = (x, w) => { ctx.fillStyle = lg(ctx, x, 0, x + w, 0, [[0, '#3a2012'], [0.5, '#6a3c1e'], [1, '#2a160a']]); ctx.fillRect(x, r.y, w, H); };
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H * 0.14, [[0, '#2a160a'], [1, '#5a3218']]); ctx.fillRect(r.x, r.y, r.w, H * 0.14);
    post(r.x + r.w * 0.04, 14); post(r.x + r.w * 0.96 - 14, 14);
    const lx = r.x + r.w * 0.08, lw = r.w * 0.34, ly = r.y + H * 0.2, lh = H * 0.72;
    ctx.fillStyle = lg(ctx, 0, ly, 0, ly + lh, [[0, '#f2e8cc'], [1, '#d8c89c']]); ctx.fillRect(lx, ly, lw, lh);
    ctx.strokeStyle = '#4a2a14'; ctx.lineWidth = 3; ctx.strokeRect(lx, ly, lw, lh);
    ctx.lineWidth = 2; const cell = lh / 5; for (let i = 1; i < lw / cell; i++) { ctx.beginPath(); ctx.moveTo(lx + i * cell, ly); ctx.lineTo(lx + i * cell, ly + lh); ctx.stroke(); } for (let j = 1; j < 5; j++) { ctx.beginPath(); ctx.moveTo(lx, ly + j * cell); ctx.lineTo(lx + lw, ly + j * cell); ctx.stroke(); }
    ctx.strokeStyle = '#7a4a22'; for (let i = 0; i < lw / cell; i++) for (let j = 0; j < 5; j++) { const cx = lx + i * cell + cell / 2, cy = ly + j * cell + cell / 2; ctx.beginPath(); ctx.moveTo(cx - cell * 0.28, cy); ctx.lineTo(cx, cy - cell * 0.28); ctx.lineTo(cx + cell * 0.28, cy); ctx.lineTo(cx, cy + cell * 0.28); ctx.closePath(); ctx.stroke(); }
    const sx = r.x + r.w * 0.5, sw = r.w * 0.28, sy = r.y + H * 0.55;
    ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 7, [[0, '#8a5a2c'], [1, '#4a2a12']]); ctx.fillRect(sx, sy, sw, 7); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(sx, sy + 7, sw, 4);
    for (let k = 0; k < 4; k++) { const px = sx + sw * (0.14 + k * 0.23), pr = H * (0.085 + hash(k, 2) * 0.02), cols = ['#8a3c1c', '#6a2a14', '#a8502a', '#5a2a1a']; ctx.fillStyle = rg(ctx, px - pr * 0.3, sy - pr * 0.9, 1, pr * 1.5, [[0, tint(cols[k], 0.4)], [1, tint(cols[k], -0.35)]]); ctx.beginPath(); ctx.ellipse(px, sy - pr * 0.75, pr, pr * 0.75, 0, 0, TAU); ctx.fill(); ctx.fillStyle = tint(cols[k], -0.3); ell(ctx, px, sy - pr * 1.5, pr * 0.34, pr * 0.2); ctx.fill(); }
    const cx = r.x + r.w * 0.86, cy = r.y + H * 0.2, cw = r.w * 0.08, ch = H * 0.7;
    ctx.fillStyle = '#7a1a14'; ctx.fillRect(cx - 3, cy - 4, cw + 6, 6); ctx.fillStyle = '#efe5c8'; ctx.fillRect(cx, cy + 2, cw, ch); ctx.fillStyle = '#7a1a14'; ctx.fillRect(cx - 3, cy + ch, cw + 6, 6);
    ctx.fillStyle = '#2a1a10'; for (let k = 0; k < 5; k++) ctx.fillRect(cx + cw * 0.32, cy + 10 + k * ch * 0.17, cw * 0.36, 4 + hash(k, 5) * 6);
    for (const [px, ph] of [[0.62, 0.9], [0.67, 0.75]]) { ctx.strokeStyle = '#5a8a3a'; ctx.lineWidth = 5; const x = r.x + r.w * px; ctx.beginPath(); ctx.moveTo(x, r.y + H); ctx.lineTo(x + 3, r.y + H * (1 - ph)); ctx.stroke(); ctx.strokeStyle = '#3a5a22'; ctx.lineWidth = 1.5; for (let q = 1; q < 5; q++) { ctx.beginPath(); ctx.moveTo(x - 3, r.y + H - q * H * ph * 0.22); ctx.lineTo(x + 5, r.y + H - q * H * ph * 0.22); ctx.stroke(); } }
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(r.x, r.y + H * 0.14, r.w, 5);
  },
  kcteacha(ctx, s, r, H, t) { // Hong Kong cha chaan teng: pale green tile, a menu board, a steel urn and a pass-through hatch
    grad(ctx, r, H, '#cfe3cf', '#a9c9ae'); const cell = Math.max(14, H / 6);
    ctx.strokeStyle = 'rgba(40,70,50,0.28)'; ctx.lineWidth = 1; for (let y = r.y; y < r.y + H; y += cell) { ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke(); } for (let x = r.x; x < r.x + r.w; x += cell) { ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + H); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let y = r.y; y < r.y + H; y += cell) ctx.fillRect(r.x, y, r.w, 2);
    const hx = r.x + r.w * 0.06, hw = r.w * 0.3, hy = r.y + H * 0.16, hh = H * 0.62;
    ctx.fillStyle = lg(ctx, 0, hy, 0, hy + hh, [[0, '#ffe9b0'], [1, '#e8a860']]); ctx.fillRect(hx, hy, hw, hh); ctx.strokeStyle = '#3a4a42'; ctx.lineWidth = 5; ctx.strokeRect(hx, hy, hw, hh);
    ctx.fillStyle = 'rgba(40,30,20,0.55)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(hx + hw * (0.15 + k * 0.23), hy + hh * 0.86, hw * 0.08, hh * 0.1, 0, 0, TAU); ctx.fill(); ctx.fillRect(hx + hw * (0.15 + k * 0.23) - hw * 0.05, hy + hh * 0.5, hw * 0.1, hh * 0.38); }
    const mx = r.x + r.w * 0.48, mw = r.w * 0.3, my = r.y + H * 0.14, mh = H * 0.66;
    ctx.fillStyle = '#1c2420'; ctx.fillRect(mx, my, mw, mh); ctx.strokeStyle = '#7a5a30'; ctx.lineWidth = 4; ctx.strokeRect(mx, my, mw, mh);
    for (let k = 0; k < 6; k++) { ctx.fillStyle = 'rgba(240,240,230,0.8)'; ctx.fillRect(mx + mw * 0.08, my + mh * (0.12 + k * 0.14), mw * (0.3 + hash(k, 3) * 0.3), 3.2); ctx.fillStyle = '#e04a3a'; ctx.fillRect(mx + mw * 0.78, my + mh * (0.12 + k * 0.14), mw * 0.12, 3.2); }
    const ux = r.x + r.w * 0.88, uy = r.y + H * 0.35, uw = H * 0.3, uh = H * 0.6;
    ctx.fillStyle = lg(ctx, ux - uw / 2, 0, ux + uw / 2, 0, [[0, '#6a727a'], [0.3, '#f2f5f8'], [0.6, '#aab4bd'], [1, '#4a525a']]); rrect(ctx, ux - uw / 2, uy, uw, uh, 8); ctx.fill(); ctx.fillStyle = '#d93a2a'; ctx.fillRect(ux - uw * 0.15, uy + uh * 0.5, uw * 0.3, uh * 0.06);
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(r.x, r.y + H - 6, r.w, 6);
  },
};
const floors = {
  kcriadfloor(ctx, r, c) { // large terracotta tiles with a dark teal star, swept clean, sun on them
    const cell = 64; ctx.save();
    for (let j = 0; r.y + j * cell < r.y + r.h + cell; j++) for (let i = 0; r.x + i * cell < r.x + r.w + cell; i++) {
      const px = r.x + i * cell, py = r.y + j * cell, k = hash(i, j, 3); ctx.fillStyle = `rgba(${Math.round(120 + k * 50)},${Math.round(60 + k * 20)},30,0.22)`; ctx.fillRect(px, py, cell, cell);
      ctx.strokeStyle = 'rgba(40,24,10,0.45)'; ctx.lineWidth = 2; ctx.strokeRect(px + 1, py + 1, cell - 2, cell - 2);
      if ((i + j) % 2 === 0) { ctx.fillStyle = 'rgba(24,80,98,0.3)'; ctx.beginPath(); for (let q = 0; q < 8; q++) { const a = (q / 8) * TAU; ctx.lineTo(px + cell / 2 + Math.cos(a) * (q % 2 ? 8 : 20), py + cell / 2 + Math.sin(a) * (q % 2 ? 8 : 20)); } ctx.closePath(); ctx.fill(); }
    }
    speck(ctx, r.x, r.y, r.w, r.h, 200, '#2a1408', 0.12, 241, 2);
    ctx.fillStyle = lg(ctx, r.x, r.y, r.x + r.w, r.y + r.h, [[0, 'rgba(255,214,140,0.2)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.25)']]); ctx.fillRect(r.x, r.y, r.w, r.h); ctx.restore();
  },
  kcteahousefloor(ctx, r, c) { // wide dark boards with a bamboo mat laid under the tea table
    const pl = 46; ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + r.h, [[0, '#6a4426'], [1, '#3a2412']]); ctx.fillRect(r.x, r.y, r.w, r.h); ctx.lineWidth = 2;
    for (let x = r.x; x < r.x + r.w; x += pl) { ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); ctx.stroke(); ctx.strokeStyle = 'rgba(255,220,160,0.06)'; ctx.beginPath(); ctx.moveTo(x + 2, r.y); ctx.lineTo(x + 2, r.y + r.h); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(20,10,4,0.2)'; ctx.lineWidth = 1; for (let k = 0; k < 60; k++) { const x = r.x + hash(k, 3) * r.w, y = r.y + hash(k, 4) * r.h; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (hash(k, 5) - 0.5) * 6, y + 30 + hash(k, 6) * 50); ctx.stroke(); }
    const mx = r.x + r.w * 0.06, mw = r.w * 0.88, my = r.y + r.h * 0.46, mh = r.h * 0.5;
    ctx.fillStyle = lg(ctx, 0, my, 0, my + mh, [[0, '#b99a5c'], [1, '#8a6e3a']]); rrect(ctx, mx, my, mw, mh, 8); ctx.fill(); ctx.strokeStyle = 'rgba(60,40,10,0.35)'; ctx.lineWidth = 1; for (let x = mx; x < mx + mw; x += 6) { ctx.beginPath(); ctx.moveTo(x, my); ctx.lineTo(x, my + mh); ctx.stroke(); }
    ctx.strokeStyle = '#5a1a14'; ctx.lineWidth = 5; rrect(ctx, mx, my, mw, mh, 8); ctx.stroke();
  },
  kcteachafloor(ctx, r, c) { // black and white chequer
    const cell = 46; for (let j = 0; r.y + j * cell < r.y + r.h; j++) for (let i = 0; r.x + i * cell < r.x + r.w; i++) { ctx.fillStyle = (i + j) % 2 ? '#2a2e2c' : '#e8e6dc'; ctx.fillRect(r.x + i * cell, r.y + j * cell, cell, cell); }
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + r.h, [[0, 'rgba(255,255,255,0.1)'], [1, 'rgba(0,0,0,0.3)']]); ctx.fillRect(r.x, r.y, r.w, r.h);
  },
};

// dock props: a bunch of mint, a cone of sugar, a tea tin, a bamboo scoop of leaves, a long spoon
registerProp('kcmint', (ctx, s, o = {}) => {
  cast(ctx, 0, s * 0.16, s * 0.36, s * 0.07);
  for (let k = 0; k < 9; k++) { const a = -Math.PI / 2 + (k - 4) * 0.2, L = s * (0.46 + hash(k, 3) * 0.1); ctx.strokeStyle = '#2f5a22'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, s * 0.15); ctx.lineTo(Math.cos(a) * L * 0.9, s * 0.15 + Math.sin(a) * L); ctx.stroke();
    for (let q = 0; q < 4; q++) { const u = 0.4 + q * 0.18, px = Math.cos(a) * L * 0.9 * u, py = s * 0.15 + Math.sin(a) * L * u; ctx.fillStyle = lg(ctx, px - 6, py, px + 6, py, [[0, '#8ed25a'], [1, '#2f7a2c']]); ctx.beginPath(); ctx.ellipse(px + (q % 2 ? 6 : -6), py, 7, 3.4, a * 0.4 + (q % 2 ? 0.6 : -0.6), 0, TAU); ctx.fill(); } }
  ctx.strokeStyle = '#c9a050'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-s * 0.05, s * 0.12); ctx.lineTo(s * 0.05, s * 0.18); ctx.stroke();
});
registerProp('kcsugar', (ctx, s, o = {}) => {
  cast(ctx, 0, s * 0.2, s * 0.26, s * 0.06);
  ctx.fillStyle = lg(ctx, -s * 0.22, 0, s * 0.22, 0, [[0, '#2a4fa8'], [0.45, '#5a86d8'], [1, '#1c3478']]); ctx.beginPath(); ctx.moveTo(0, -s * 0.34); ctx.lineTo(s * 0.22, s * 0.2); ctx.quadraticCurveTo(0, s * 0.27, -s * 0.22, s * 0.2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = lg(ctx, -s * 0.06, 0, s * 0.06, 0, [[0, '#f4f1e8'], [1, '#bcb8ac']]); ctx.beginPath(); ctx.moveTo(0, -s * 0.34); ctx.lineTo(s * 0.06, -s * 0.22); ctx.lineTo(-s * 0.06, -s * 0.22); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-s * 0.05, -s * 0.14); ctx.lineTo(-s * 0.15, s * 0.14); ctx.stroke();
});
registerProp('kcteatin', (ctx, s, o = {}) => {
  const c = o.c ?? '#a8321f'; cast(ctx, 0, s * 0.2, s * 0.24, s * 0.06);
  ctx.fillStyle = lg(ctx, -s * 0.2, 0, s * 0.2, 0, [[0, tint(c, -0.4)], [0.35, tint(c, 0.25)], [1, tint(c, -0.5)]]); rrect(ctx, -s * 0.2, -s * 0.2, s * 0.4, s * 0.4, s * 0.04); ctx.fill();
  ctx.fillStyle = '#e8c460'; ctx.fillRect(-s * 0.2, -s * 0.2, s * 0.4, s * 0.04); ctx.fillRect(-s * 0.2, s * 0.16, s * 0.4, s * 0.04); ctx.fillStyle = '#f2e8cc'; rrect(ctx, -s * 0.11, -s * 0.09, s * 0.22, s * 0.16, 4); ctx.fill(); ctx.fillStyle = c; ell(ctx, 0, -s * 0.01, s * 0.045, s * 0.045); ctx.fill();
});
registerProp('kcscoop', (ctx, s, o = {}) => {
  cast(ctx, 0, s * 0.12, s * 0.34, s * 0.05);
  ctx.fillStyle = lg(ctx, 0, -s * 0.06, 0, s * 0.06, [[0, '#d8bc7a'], [1, '#8a6a30']]); ctx.beginPath(); ctx.moveTo(-s * 0.4, -s * 0.02); ctx.lineTo(s * 0.05, -s * 0.05); ctx.quadraticCurveTo(s * 0.34, -s * 0.12, s * 0.38, 0.0); ctx.quadraticCurveTo(s * 0.34, s * 0.12, s * 0.05, s * 0.05); ctx.lineTo(-s * 0.4, s * 0.02); ctx.closePath(); ctx.fill();
  for (let k = 0; k < 10; k++) { ctx.fillStyle = k % 3 ? '#4a5a22' : '#6a7a2c'; ctx.save(); ctx.translate(s * (0.12 + hash(k, 3) * 0.22), (hash(k, 4) - 0.5) * s * 0.1); ctx.rotate(hash(k, 5) * 3); ell(ctx, 0, 0, s * 0.04, s * 0.012); ctx.fill(); ctx.restore(); }
});
registerProp('kcmilk', (ctx, s, o = {}) => { // a tin of evaporated milk: white and red label, steel ends, a ring pull
  cast(ctx, 0, s * 0.2, s * 0.22, s * 0.055);
  const w = s * 0.2, h = s * 0.34;
  ctx.fillStyle = lg(ctx, -w, 0, w, 0, [[0, '#8a9098'], [0.3, '#e8edf1'], [0.7, '#b4bcc4'], [1, '#6a7078']]); rrect(ctx, -w, -h * 0.5, w * 2, h, 4); ctx.fill();
  ctx.fillStyle = lg(ctx, -w, 0, w, 0, [[0, '#a8e0f0'], [0.35, '#fffdf4'], [0.75, '#e6e2d0'], [1, '#b8b4a4']]); ctx.fillRect(-w, -h * 0.32, w * 2, h * 0.64);
  ctx.fillStyle = '#d4301f'; ctx.fillRect(-w, -h * 0.32, w * 2, h * 0.1); ctx.fillRect(-w, h * 0.22, w * 2, h * 0.1);
  ctx.fillStyle = '#1f4aa0'; ell(ctx, 0, 0, w * 0.55, h * 0.12); ctx.fill(); ctx.fillStyle = '#fffdf4'; ell(ctx, 0, 0, w * 0.33, h * 0.06); ctx.fill();
  ctx.fillStyle = lg(ctx, -w, 0, w, 0, [[0, '#7a8088'], [0.45, '#f4f7fa'], [1, '#6a7078']]); ell(ctx, 0, -h * 0.5, w, h * 0.07); ctx.fill(); ctx.strokeStyle = '#d4d9de'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(w * 0.3, -h * 0.52, w * 0.22, h * 0.04, 0, 0, TAU); ctx.stroke();
});
registerProp('kcspoon', (ctx, s, o = {}) => {
  cast(ctx, 0, s * 0.1, s * 0.4, s * 0.04); ctx.strokeStyle = lg(ctx, 0, -2, 0, 2, [[0, '#e8edf2'], [1, '#7a838c']]); ctx.lineWidth = s * 0.025; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-s * 0.46, 0); ctx.lineTo(s * 0.2, 0); ctx.stroke();
  ctx.fillStyle = lg(ctx, 0, -s * 0.07, 0, s * 0.07, [[0, '#f4f7fa'], [1, '#79838c']]); ell(ctx, s * 0.3, 0, s * 0.12, s * 0.075); ctx.fill();
});

const T = (c, h, w) => ({ caption: c, hint: h, ...(w ?? {}) });
const scenes = {
  'kc-tea-riad': { wall: 'kctearyad', wallC: '#e0b888', wallK: 1, floor: 'kcriadfloor', floorC: '#9a5a32', light: 'window', litter: [], dock: ['kcmint', 'kcsugar'], dockKind: 'cloth', frame: 'tile', wood: '#6a4020', words: T('Pour this tray', 'Raise the pot and pour a thin stream', { win: 'A tray of tea fit for guests', ok: 'A good tray of tea', retry: 'Pour again' }), pitch: 1.0 },
  'kc-tea-house': { wall: 'kcteahouse', wallC: '#d8c8a0', wallK: 1, floor: 'kcteahousefloor', floorC: '#5a3a20', light: 'window', litter: [], dock: ['kcteatin:#a8321f', 'kcscoop'], dockKind: 'cloth', frame: 'plinth', wood: '#4a2a14', words: T('Brew these cups', 'Patience and a steady hand', { win: 'Cups of even strength', ok: 'A good brew', retry: 'Brew again' }), pitch: 1.2 },
  'kc-tea-cha': { wall: 'kcteacha', wallC: '#bcd6bc', wallK: 1, floor: 'kcteachafloor', floorC: '#7a7a74', light: 'lamp', litter: [], dock: ['kcmilk', 'kcspoon'], dockKind: 'ledge', frame: 'rail', wood: '#5a4a34', words: T('Pull this tea', 'Pull the tea between two pots', { win: 'A smooth, silky cup', ok: 'A good cup', retry: 'Pull again' }), pitch: 0.9 },
};
registerSceneSet({
  scenes: Object.fromEntries(Object.entries(scenes).map(([id, s]) => [id, { ...s, hang: [] }])),
  walls, floorKinds: { kcriadfloor: 'slate', kcteahousefloor: 'wood', kcteachafloor: 'slate' }, floorEx: floors,
  soundMat: { 'kc-tea-riad': 'clay', 'kc-tea-house': 'clay', 'kc-tea-cha': 'clay' },
});
void mix;

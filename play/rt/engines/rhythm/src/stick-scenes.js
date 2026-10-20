// Backdrops of the stick-dance stages (1.27.0). Each is drawn in the stage's design coordinates over the area A = { x0, y0, x1, y1 } (the screen rectangle seen through
// the stage's transform) with the horizon at hz; they are pure functions of (ctx, A, t, hz). No person appears in any of them.
import { clamp, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, circ, ell, hash, TAU } from './dance-kit.js';
import { glow } from './art.js';

const poly = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
// a hanging swag of garland between two points: beads of colour on a sagging curve
function swag(ctx, x0, y0, x1, y1, sag, cols, r, t, o = {}) {
  const n = o.n ?? Math.max(8, Math.round(Math.hypot(x1 - x0, y1 - y0) / (r * 1.5)));
  ctx.strokeStyle = o.cord ?? '#4a2c1c'; ctx.lineWidth = 3; ctx.beginPath(); for (let k = 0; k <= 30; k++) { const u = k / 30, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u + Math.sin(u * Math.PI) * sag; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  for (let k = 0; k <= n; k++) { const u = k / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u + Math.sin(u * Math.PI) * sag + Math.sin(t * 1.6 + k) * 1.5, c = cols[k % cols.length];
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; circ(ctx, x + 1.5, y + 3, r); ctx.fill(); ctx.fillStyle = rgrad(ctx, x - r * 0.3, y - r * 0.3, 0, r * 1.3, [[0, lighter(c, 0.4)], [0.6, c], [1, darker(c, 0.35)]]); circ(ctx, x, y, r); ctx.fill(); }
}
function lampStrand(ctx, A, y, t, cols, n = 14) {
  const W = A.x1 - A.x0; ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 2.4; ctx.beginPath(); for (let k = 0; k <= 40; k++) { const u = k / 40, x = A.x0 + u * W, yy = y + Math.sin(u * Math.PI * 3) * 14 + Math.sin(u * Math.PI) * 24; k ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); } ctx.stroke();
  for (let k = 0; k < n; k++) { const u = (k + 0.5) / n, x = A.x0 + u * W, yy = y + Math.sin(u * Math.PI * 3) * 14 + Math.sin(u * Math.PI) * 24 + 8, c = cols[k % cols.length], f = 0.8 + 0.2 * Math.sin(t * 3 + k * 1.9);
    glow(ctx, x, yy, 46, c, 0.5 * f); ctx.fillStyle = lighter(c, 0.6); circ(ctx, x, yy, 6); ctx.fill(); }
}
const floorShade = (ctx, A, hz, c0, c1) => { ctx.fillStyle = vgrad(ctx, hz, A.y1, [[0, c0], [1, c1]]); ctx.fillRect(A.x0, hz, A.x1 - A.x0, A.y1 - hz); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(A.x0, hz, A.x1 - A.x0, 4); };

export const SCENES = {
  // ---- Tamil festival pandal: red-and-white striped cloth, plantain stems, mango-leaf garland, a white rice-flour kolam on the floor -----------------------------------------
  pandal(ctx, A, t, hz) {
    const X0 = A.x0, X1 = A.x1, W = X1 - X0, Y0 = A.y0, H = A.y1, cx = (X0 + X1) / 2;
    const sw = Math.max(60, W / 12);
    for (let k = 0, x = X0; x < X1; k++, x += sw) { ctx.fillStyle = k % 2 ? '#f6efe0' : '#b3281e'; ctx.fillRect(x, Y0, sw + 1, hz - Y0); ctx.fillStyle = hgrad(ctx, x, x + sw, [[0, 'rgba(0,0,0,0.28)'], [0.35, 'rgba(255,255,255,0.1)'], [0.7, 'rgba(0,0,0,0.06)'], [1, 'rgba(0,0,0,0.3)']]); ctx.fillRect(x, Y0, sw + 1, hz - Y0); }
    ctx.fillStyle = vgrad(ctx, Y0, hz, [[0, 'rgba(20,6,2,0.55)'], [0.5, 'rgba(20,6,2,0)'], [1, 'rgba(255,200,120,0.2)']]); ctx.fillRect(X0, Y0, W, hz - Y0);
    // a gold-bordered cloth valance across the top with hanging tassels
    ctx.fillStyle = '#2f7a4a'; ctx.fillRect(X0, Y0, W, 58); ctx.fillStyle = '#e8c04a'; ctx.fillRect(X0, Y0 + 56, W, 8); ctx.fillStyle = '#e8c04a'; for (let x = X0 + 18; x < X1; x += 56) { poly(ctx, [[x - 12, Y0 + 64], [x + 12, Y0 + 64], [x, Y0 + 92]]); ctx.fill(); }
    // plantain stems with broad leaves at both sides
    for (const sx of [-1, 1]) { const bx = sx < 0 ? X0 + W * 0.04 : X1 - W * 0.04, bw = Math.min(70, W * 0.1);
      ctx.fillStyle = hgrad(ctx, bx - bw / 2, bx + bw / 2, [[0, '#4a6a30'], [0.35, '#a8c870'], [0.7, '#6e9444'], [1, '#34501e']]); rrect(ctx, bx - bw / 2, Y0 + 40, bw, hz - Y0 - 40 + 14, bw * 0.3); ctx.fill();
      ctx.strokeStyle = 'rgba(30,50,10,0.5)'; ctx.lineWidth = 2; for (let k = 0; k < 9; k++) { const y = Y0 + 80 + k * ((hz - Y0 - 60) / 9); ctx.beginPath(); ctx.moveTo(bx - bw / 2, y); ctx.lineTo(bx + bw / 2, y + 6); ctx.stroke(); }
      for (let k = 0; k < 3; k++) { const a = -0.5 - k * 0.55, ln = 150 + 40 * k, sway = Math.sin(t * 1.4 + k + sx) * 6; ctx.save(); ctx.translate(bx, Y0 + 70); ctx.rotate(sx < 0 ? a - 0.3 + sway * 0.01 : Math.PI - a + 0.3 - sway * 0.01);
        ctx.fillStyle = k % 2 ? '#2f7a30' : '#3c9040'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(ln * 0.3, -34, ln * 0.8, -30, ln, 4); ctx.bezierCurveTo(ln * 0.8, 30, ln * 0.3, 26, 0, 0); ctx.fill(); ctx.strokeStyle = 'rgba(10,50,16,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ln, 4); ctx.stroke(); ctx.restore(); } }
    // brass hanging lamps and jasmine strings down the cloth, so the tall wall is not bare
    for (const lx of [-0.34, -0.12, 0.12, 0.34]) { const x = cx + W * lx * 0.9, y0 = Y0 + 96, y1 = Y0 + 150 + (lx > 0 ? 40 : 0) + 40 * Math.abs(lx);
      ctx.strokeStyle = '#6a4a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
      ctx.fillStyle = hgrad(ctx, x - 26, x + 26, [[0, '#6a4a14'], [0.4, '#f2cf6a'], [1, '#7a5418']]); ctx.beginPath(); ctx.moveTo(x - 30, y1); ctx.quadraticCurveTo(x, y1 + 46, x + 30, y1); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(60,34,4,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
      const f = 0.85 + 0.15 * Math.sin(t * 6 + lx * 20); glow(ctx, x, y1 - 12, 70, '#ffc060', 0.5 * f); ctx.fillStyle = '#ffe49a'; ctx.beginPath(); ctx.moveTo(x - 6, y1 - 2); ctx.quadraticCurveTo(x + Math.sin(t * 9 + lx * 5) * 2, y1 - 34, x + 6, y1 - 2); ctx.fill(); }
    for (const lx of [-0.42, -0.22, 0, 0.22, 0.42]) { const x = cx + W * lx * 0.9, y0 = Y0 + 112, n = 11; for (let k = 0; k < n; k++) { const y = y0 + 150 + k * 30, sw = Math.sin(t * 1.5 + k * 0.6 + lx * 9) * 2; ctx.fillStyle = k % 3 === 2 ? '#f2a81c' : '#fffaf0'; circ(ctx, x + sw, y, 7); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.12)'; circ(ctx, x + sw + 1.5, y + 2, 7); ctx.fill(); } }
    // mango-leaf garland with marigolds
    swag(ctx, X0 + W * 0.06, Y0 + 100, X1 - W * 0.06, Y0 + 100, 56, ['#2f8a3a', '#2f8a3a', '#f2a81c', '#2f8a3a', '#e8641c'], 9, t);
    // floor: terracotta with a white kolam in perspective
    floorShade(ctx, A, hz, '#a8553a', '#6a2e20');
    ctx.fillStyle = 'rgba(255,230,190,0.06)'; for (let k = 0; k < 60; k++) ell(ctx, X0 + hash(k * 3.3) * W, hz + 10 + hash(k + 8) * (H - hz), 14 + 30 * hash(k), 3 + 5 * hash(k + 4)), ctx.fill();
    const ky = hz + (H - hz) * 0.5, kw = Math.min(W * 0.46, 380), kh = (H - hz) * 0.33;
    ctx.strokeStyle = 'rgba(255,250,236,0.92)'; ctx.fillStyle = 'rgba(255,250,236,0.92)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let r = 0; r < 3; r++) for (let k = 0; k < 12 + r * 4; k++) { const n = 12 + r * 4, a = (k / n) * TAU, rx = kw * (0.35 + r * 0.28), ry = kh * (0.35 + r * 0.28); circ(ctx, cx + Math.cos(a) * rx, ky + Math.sin(a) * ry, 4.4 - r * 0.6); ctx.fill(); }
    for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU, a2 = ((k + 1) / 12) * TAU; ctx.beginPath(); ctx.ellipse(cx + Math.cos(a + 0.26) * kw * 0.35, ky + Math.sin(a + 0.26) * kh * 0.35, kw * 0.28, kh * 0.28, 0, 0, TAU); ctx.stroke(); void a2; }
    lampStrand(ctx, { x0: X0, x1: X1 }, Y0 + 190, t, ['#ffd27a', '#ff9a50'], 8);
    ctx.fillStyle = rgrad(ctx, cx, hz + (H - hz) * 0.3, 10, W * 0.55, [[0, 'rgba(255,230,170,0.32)'], [1, 'rgba(255,230,170,0)']]); ctx.fillRect(X0, hz, W, H - hz);
    ctx.fillStyle = rgrad(ctx, cx, (hz + Y0) / 2, W * 0.2, W * 0.75, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(10,2,0,0.5)']]); ctx.fillRect(X0, Y0, W, H - Y0);
  },
};

// a floor in perspective: lines run to the vanishing point (0, vp); cross lines get closer together towards the horizon
function perspFloor(ctx, A, vp, hz, col, n = 16, cross = 12) {
  const X0 = A.x0, X1 = A.x1, W = X1 - X0, H = A.y1;
  ctx.strokeStyle = col; ctx.lineWidth = 2;
  for (let k = -n; k <= n; k++) { const xb = k * (W / n) * 0.6; ctx.beginPath(); ctx.moveTo(0 + (xb - 0) * 0.04, hz); ctx.lineTo(xb * 1.9, H); ctx.stroke(); }
  for (let r = 1; r <= cross; r++) { const u = Math.pow(r / cross, 2.1), y = hz + (H - hz) * u; ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(X1, y); ctx.stroke(); }
  void vp;
}

Object.assign(SCENES, {
  // ---- Castilian plaza at noon: whitewashed walls, green shutters, wooden balconies with red geraniums, red-and-yellow bunting, cobbles ----------------------------------------------
  castile(ctx, A, t, hz) {
    const X0 = A.x0, X1 = A.x1, W = X1 - X0, Y0 = A.y0, H = A.y1, cx = (X0 + X1) / 2;
    ctx.fillStyle = vgrad(ctx, Y0, hz, [[0, '#7ab4e0'], [0.25, '#cfe6f2'], [0.26, '#efe2c4'], [1, '#e2cfa4']]); ctx.fillRect(X0, Y0, W, hz - Y0);
    // a plastered wall with a stone plinth and two floors of windows
    const bw = Math.max(150, W / 5);
    for (let k = -1; k < W / bw + 1; k++) {
      const x = X0 + k * bw + (k % 2 ? 0 : 0), wall = k % 2 ? '#f1e6cc' : '#ead8b0';
      ctx.fillStyle = wall; ctx.fillRect(x, Y0 + 70, bw, hz - Y0 - 70); ctx.fillStyle = 'rgba(120,80,40,0.07)'; for (let q = 0; q < 14; q++) ell(ctx, x + hash(q + k * 9) * bw, Y0 + 90 + hash(q + 5 + k) * (hz - Y0 - 100), 8 + 24 * hash(q), 3 + 6 * hash(q + 3)), ctx.fill();
      ctx.fillStyle = darker(wall, 0.12); ctx.fillRect(x + bw - 3, Y0 + 70, 3, hz - Y0 - 70);
      for (let r = 0; r < 2; r++) { const wy = Y0 + 110 + r * ((hz - Y0 - 170) / 2), wx = x + bw * 0.28, ww = bw * 0.44, wh = (hz - Y0 - 170) / 2 - 56;
        ctx.fillStyle = '#2a1a10'; ctx.fillRect(wx - 4, wy - 4, ww + 8, wh + 8); ctx.fillStyle = vgrad(ctx, wy, wy + wh, [[0, '#4a6a7a'], [1, '#1a2a34']]); ctx.fillRect(wx, wy, ww, wh);
        ctx.fillStyle = '#2f7a42'; ctx.fillRect(wx - ww * 0.42, wy, ww * 0.4, wh); ctx.fillRect(wx + ww * 1.02, wy, ww * 0.4, wh); ctx.strokeStyle = 'rgba(0,30,0,0.5)'; ctx.lineWidth = 2; for (let q = 1; q < 8; q++) { ctx.beginPath(); ctx.moveTo(wx - ww * 0.42, wy + q * wh / 8); ctx.lineTo(wx - ww * 0.02, wy + q * wh / 8); ctx.moveTo(wx + ww * 1.02, wy + q * wh / 8); ctx.lineTo(wx + ww * 1.42, wy + q * wh / 8); ctx.stroke(); }
        if (r === 1) { // a wooden balcony with geraniums
          ctx.fillStyle = '#5a3418'; ctx.fillRect(wx - ww * 0.5, wy + wh + 2, ww * 2, 12); ctx.fillStyle = '#7a4a22'; for (let q = 0; q <= 10; q++) ctx.fillRect(wx - ww * 0.5 + q * (ww * 2) / 10 - 2, wy + wh + 14, 5, 34);
          for (let q = 0; q < 7; q++) { ctx.fillStyle = '#2f7a30'; circ(ctx, wx - ww * 0.4 + q * ww * 0.3, wy + wh - 2, 12); ctx.fill(); ctx.fillStyle = q % 2 ? '#d8283a' : '#f05a6a'; circ(ctx, wx - ww * 0.4 + q * ww * 0.3 + 3, wy + wh - 10 + Math.sin(t + q) * 1.5, 7); ctx.fill(); } } }
    }
    // bunting in red and yellow
    for (const [yy, dip] of [[Y0 + 40, 36], [Y0 + 150, 44]]) { ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 2.5; ctx.beginPath(); for (let q = 0; q <= 40; q++) { const u = q / 40, x = X0 + u * W, y = yy + Math.sin(u * Math.PI) * dip; q ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
      for (let q = 0; q < 24; q++) { const u = (q + 0.5) / 24, x = X0 + u * W, y = yy + Math.sin(u * Math.PI) * dip, sw = Math.sin(t * 2 + q) * 3; ctx.fillStyle = q % 2 ? '#e8b61c' : '#c0261f'; poly(ctx, [[x - 11, y], [x + 11, y], [x + sw, y + 28]]); ctx.fill(); } }
    // cobbled plaza
    floorShade(ctx, A, hz, '#c8aa7a', '#8a6c46');
    for (let r = 0; r < 16; r++) { const y = hz + 6 + r * r * 2.4 + r * 8; if (y > H) break; const sz = 22 + r * 7; for (let x = X0 - (r % 2) * sz / 2; x < X1; x += sz) { ctx.fillStyle = `rgba(${60 + 40 * hash(x + r)},${44 + 30 * hash(x)},30,0.28)`; ctx.fillRect(x + 1, y + 1, sz - 2, 10 + r * 2.4); ctx.strokeStyle = 'rgba(40,24,10,0.35)'; ctx.lineWidth = 1.6; ctx.strokeRect(x, y, sz, 12 + r * 2.4); } }
    ctx.fillStyle = rgrad(ctx, cx, hz + (H - hz) * 0.35, 10, W * 0.6, [[0, 'rgba(255,240,200,0.3)'], [1, 'rgba(255,240,200,0)']]); ctx.fillRect(X0, hz, W, H - hz);
    ctx.fillStyle = rgrad(ctx, cx, (hz + Y0) / 2, W * 0.3, W * 0.8, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(30,14,0,0.42)']]); ctx.fillRect(X0, Y0, W, H - Y0);
  },

  // ---- seen from above: a painted floor with a mandala of coloured petals, a ring of small lamps, scattered marigold petals (Gujarat) ---------------------------------------------------
  garba(ctx, A, t, hz, I) {
    const X0 = A.x0, X1 = A.x1, W = X1 - X0, Y0 = A.y0, H = A.y1, cx = 0, cy = I.cy, R = I.R * 1.0;
    ctx.fillStyle = '#1c1240'; ctx.fillRect(X0, Y0, W, H - Y0);
    for (let k = 0; k < 160; k++) { ctx.fillStyle = `rgba(${hash(k) > 0.5 ? '230,200,120' : '120,100,220'},${0.05 + 0.08 * hash(k + 3)})`; circ(ctx, X0 + hash(k * 2.3) * W, Y0 + hash(k * 1.9 + 2) * (H - Y0), 3 + 8 * hash(k + 5)); ctx.fill(); }
    for (let yy = Y0 + 20, row = 0; yy < H; yy += 54, row++) for (let xx = X0 + (row % 2) * 27; xx < X1; xx += 54) { ctx.fillStyle = (row + Math.round(xx / 54)) % 3 ? 'rgba(244,196,48,0.22)' : 'rgba(232,74,138,0.26)'; circ(ctx, xx, yy, 3.4); ctx.fill(); }
    for (const [qx, qy] of [[X0, Y0], [X1, Y0], [X0, H], [X1, H]]) for (const [rr, col] of [[300, '#e84a8a'], [240, '#f2c430'], [180, '#1fa89a'], [120, '#e8641c']]) { ctx.strokeStyle = col; ctx.globalAlpha = 0.5; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(qx, qy, rr, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; for (let k = 0; k < 18; k++) { const an = (k / 18) * TAU; ctx.fillStyle = col; ctx.globalAlpha = 0.55; circ(ctx, qx + Math.cos(an) * (rr + 22), qy + Math.sin(an) * (rr + 22), 5); ctx.fill(); ctx.globalAlpha = 1; } }
    const petals = (n, r0, r1, wd, col, rot = 0) => { for (let k = 0; k < n; k++) { const a = (k / n) * TAU + rot; ctx.save(); ctx.translate(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.rotate(a); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo((r1 - r0) * 0.5, -wd, r1 - r0, 0); ctx.quadraticCurveTo((r1 - r0) * 0.5, wd, 0, 0); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore(); } };
    ctx.fillStyle = rgrad(ctx, cx, cy, R * 0.1, R * 1.25, [[0, '#3a2468'], [0.7, '#2a1a58'], [1, '#1c1240']]); circ(ctx, cx, cy, R * 1.25); ctx.fill();
    petals(24, R * 0.86, R * 1.12, R * 0.06, '#e8a21c'); petals(24, R * 0.8, R * 1.0, R * 0.07, '#e84a8a', 0.13); petals(16, R * 0.56, R * 0.86, R * 0.1, '#1fa89a'); petals(16, R * 0.5, R * 0.72, R * 0.1, '#f2c430', 0.2); petals(12, R * 0.3, R * 0.54, R * 0.1, '#e8561f'); petals(8, R * 0.08, R * 0.34, R * 0.1, '#fff0b8', 0.3);
    ctx.strokeStyle = '#f4d060'; ctx.lineWidth = 3; for (const r of [0.3, 0.56, 0.86, 1.13]) { circ(ctx, cx, cy, R * r); ctx.stroke(); }
    // ring of lamps
    for (let k = 0; k < 28; k++) { const a = (k / 28) * TAU, x = cx + Math.cos(a) * R * 1.22, y = cy + Math.sin(a) * R * 1.22, f = 0.75 + 0.25 * Math.sin(t * 4 + k * 1.9); glow(ctx, x, y, 36, '#ffb040', 0.55 * f); ctx.fillStyle = '#7a3a10'; circ(ctx, x, y, 9); ctx.fill(); ctx.fillStyle = '#ffe08a'; circ(ctx, x, y - 1, 4.5 * f); ctx.fill(); }
    for (let k = 0; k < 70; k++) { const a = hash(k * 4.1) * TAU, r = R * (0.2 + 1.2 * hash(k + 9)), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; ctx.fillStyle = k % 3 ? '#f08a1c' : '#e8a21c'; ctx.save(); ctx.translate(x, y); ctx.rotate(k); ell(ctx, 0, 0, 6, 3.4); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = rgrad(ctx, cx, cy, R * 0.2, W * 0.75, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(6,2,20,0.6)']]); ctx.fillRect(X0, Y0, W, H - Y0);
  },

  // ---- seen from above: a swept courtyard with a round flower carpet in yellow, orange and white, banana leaves at the corners (Kerala) ---------------------------------------------
  kerala(ctx, A, t, hz, I) {
    const X0 = A.x0, X1 = A.x1, W = X1 - X0, Y0 = A.y0, H = A.y1, cx = 0, cy = I.cy, R = I.R * 1.0;
    ctx.fillStyle = vgrad(ctx, Y0, H, [[0, '#d8c08c'], [1, '#c4a874']]); ctx.fillRect(X0, Y0, W, H - Y0);
    ctx.strokeStyle = 'rgba(120,90,50,0.22)'; ctx.lineWidth = 2; for (let k = 0; k < 90; k++) { const y = Y0 + k * ((H - Y0) / 90); ctx.beginPath(); ctx.moveTo(X0, y + Math.sin(k) * 4); ctx.bezierCurveTo(X0 + W * 0.3, y - 6, X0 + W * 0.7, y + 7, X1, y + Math.cos(k) * 4); ctx.stroke(); }
    const ring = (n, r, rad, cols, sq = 1) => { for (let k = 0; k < n; k++) { const a = (k / n) * TAU, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * sq, c = cols[k % cols.length]; ctx.fillStyle = 'rgba(0,0,0,0.2)'; circ(ctx, x + 2, y + 3, rad); ctx.fill(); ctx.fillStyle = rgrad(ctx, x - rad * 0.3, y - rad * 0.3, 0, rad * 1.2, [[0, lighter(c, 0.35)], [1, c]]); circ(ctx, x, y, rad); ctx.fill(); } };
    ring(44, R * 1.0, 13, ['#f2a81c', '#e8641c']); ring(38, R * 0.86, 12, ['#fff8e8', '#f6f0d8']); ring(32, R * 0.7, 12, ['#e8b61c', '#f2d040']); ring(26, R * 0.55, 11, ['#d8341c', '#e8641c', '#fff8e8']); ring(18, R * 0.38, 11, ['#f2d040', '#fff8e8']); ring(9, R * 0.2, 12, ['#e8641c', '#d8341c']);
    ctx.fillStyle = '#f2d040'; circ(ctx, cx, cy, R * 0.09); ctx.fill();
    for (const yy of [Y0 + 6, H - 6]) for (const [n, r, rad, cols] of [[16, 120, 12, ['#f2a81c', '#e8641c']], [26, 200, 12, ['#fff8e8', '#f6f0d8']], [36, 280, 12, ['#e8b61c', '#f2d040']], [46, 360, 11, ['#d8341c', '#e8641c', '#fff8e8']]]) for (let k = 0; k < n; k++) { const an = (k / n) * TAU, x = Math.cos(an) * r, y = yy + Math.sin(an) * r, c = cols[k % cols.length]; if (y < Y0 || y > H) continue; ctx.fillStyle = 'rgba(0,0,0,0.2)'; circ(ctx, x + 2, y + 3, rad); ctx.fill(); ctx.fillStyle = c; circ(ctx, x, y, rad); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; circ(ctx, x - rad * 0.3, y - rad * 0.3, rad * 0.35); ctx.fill(); }
    for (const yy of [Y0 + 70, H - 70]) { const f = 0.85 + 0.15 * Math.sin(t * 6 + yy); glow(ctx, 0, yy - 30, 130, '#ffb050', 0.5 * f); ctx.fillStyle = '#7a5a1a'; rrect(ctx, -22, yy, 44, 26, 6); ctx.fill(); ctx.fillStyle = '#c8962a'; rrect(ctx, -34, yy - 12, 68, 18, 8); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.moveTo(-9, yy - 12); ctx.quadraticCurveTo(0 + Math.sin(t * 8) * 2, yy - 62, 9, yy - 12); ctx.fill(); }
    for (const [sx, sy, a] of [[-1, -1, 0.6], [1, -1, 2.5], [-1, 1, -0.6], [1, 1, -2.5]]) for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(sx * W * 0.5, sy < 0 ? A.y0 + 30 : A.y1 - 30); ctx.rotate(a + (k - 1) * 0.5 + Math.sin(t * 1.2 + k) * 0.03); ctx.fillStyle = k % 2 ? '#2f7a30' : '#3c9040'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(60, -40, 200, -30, 300, 8); ctx.bezierCurveTo(200, 40, 60, 28, 0, 0); ctx.fill(); ctx.strokeStyle = 'rgba(10,50,16,0.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(300, 8); ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = rgrad(ctx, cx, cy, R * 0.5, W * 0.8, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(60,30,0,0.42)']]); ctx.fillRect(X0, Y0, W, H - Y0);
  },

  // ---- Miranda plateau village lane: grey granite walls, a misty sky, setts converging to the end of the lane ------------------------------------------------------------------
  granite(ctx, A, t, hz, I) {
    const X0 = A.x0, X1 = A.x1, W = X1 - X0, Y0 = A.y0, H = A.y1, vy = I.vy, hz2 = I.hz2;
    ctx.fillStyle = vgrad(ctx, Y0, vy, [[0, '#9eb0bc'], [0.6, '#d4dce0'], [1, '#e8ece8']]); ctx.fillRect(X0, Y0, W, hz2 - Y0);
    // far hills and the end wall of the lane
    ctx.fillStyle = 'rgba(110,130,140,0.55)'; ctx.beginPath(); ctx.moveTo(X0, vy + 10); for (let i = 0; i <= 20; i++) ctx.lineTo(X0 + W * i / 20, vy - 30 - 22 * Math.sin(i * 0.9) - 10 * Math.sin(i * 2.3)); ctx.lineTo(X1, vy + 10); ctx.closePath(); ctx.fill();
    const lw = 150;
    // the two side walls in perspective: dressed granite blocks
    for (const sd of [-1, 1]) { const xo = sd < 0 ? X0 : X1, xi = sd * 120;
      ctx.fillStyle = vgrad(ctx, Y0, hz2, [[0, '#8a8f92'], [1, '#6a7074']]); ctx.beginPath(); ctx.moveTo(xo, Y0); ctx.lineTo(xi, vy - 60); ctx.lineTo(xi, vy + 40); ctx.lineTo(xo, H); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(30,34,38,0.45)'; ctx.lineWidth = 2; for (let r = 1; r < 14; r++) { const u = r / 14, y0 = Y0 + (vy - 60 - Y0) * u, y1 = H + (vy + 40 - H) * u; ctx.beginPath(); ctx.moveTo(xo + (xi - xo) * u, y0 + (y1 - y0) * 0); ctx.lineTo(xo + (xi - xo) * u, y1); ctx.stroke(); }
      for (let r = 0; r < 9; r++) { const v = r / 9; ctx.beginPath(); ctx.moveTo(xo, Y0 + (H - Y0) * v); ctx.lineTo(xi, vy - 60 + 100 * v); ctx.stroke(); }
      ctx.fillStyle = 'rgba(200,210,120,0.1)'; for (let q = 0; q < 14; q++) ell(ctx, xo + (xi - xo) * hash(q * 3 + sd), Y0 + (H - Y0) * hash(q + 8), 10 + 24 * hash(q), 5 + 9 * hash(q + 2)), ctx.fill(); ctx.restore(); }
    // setts on the floor
    ctx.fillStyle = vgrad(ctx, hz2, H, [[0, '#8a8680'], [1, '#5e5a56']]); ctx.beginPath(); ctx.moveTo(-120, hz2 - 60); ctx.lineTo(120, hz2 - 60); ctx.lineTo(X1, H); ctx.lineTo(X0, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(20,20,22,0.5)'; ctx.lineWidth = 2; for (let k = -10; k <= 10; k++) { ctx.beginPath(); ctx.moveTo(k * 12, hz2 - 60); ctx.lineTo(k * (W / 10) * 0.6, H); ctx.stroke(); } for (let r = 1; r < 16; r++) { const y = hz2 - 60 + (H - hz2 + 60) * Math.pow(r / 16, 1.9); ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(X1, y); ctx.stroke(); }
    // a slice of bright sky at the end of the lane with a chestnut tree
    ctx.fillStyle = '#c8d4d8'; ctx.fillRect(-120, vy - 60, 240, 100); ctx.fillStyle = '#4a6a3a'; ctx.beginPath(); ctx.arc(0, vy - 20, 52, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-5, vy - 22, 10, 50);
    ctx.fillStyle = rgrad(ctx, 0, hz2, 20, W * 0.7, [[0, 'rgba(255,248,230,0.26)'], [1, 'rgba(255,248,230,0)']]); ctx.fillRect(X0, Y0, W, H - Y0);
    ctx.fillStyle = rgrad(ctx, 0, (hz2 + Y0) / 2, W * 0.25, W * 0.85, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(10,14,20,0.55)']]); ctx.fillRect(X0, Y0, W, H - Y0);
  },

});

Object.assign(SCENES, {
  // ---- a night cloister seen straight on: a stone arcade of round arches on slim columns with warm lit rooms behind, red-and-gold hangings, strings of lights, paving (Catalonia) ---------------------
  cloister(ctx, A, t, hz) {
    const X0 = A.x0, X1 = A.x1, W = X1 - X0, Y0 = A.y0, H = A.y1, cx = (X0 + X1) / 2;
    ctx.fillStyle = vgrad(ctx, Y0, hz, [[0, '#0c1230'], [0.5, '#1a2650'], [1, '#2a3664']]); ctx.fillRect(X0, Y0, W, hz - Y0);
    for (let k = 0; k < 90; k++) { ctx.fillStyle = `rgba(255,248,220,${0.25 + 0.6 * hash(k + 1)})`; circ(ctx, X0 + hash(k * 3.3) * W, Y0 + hash(k * 1.7 + 4) * (hz - Y0) * 0.3, 0.8 + 1.5 * hash(k)); ctx.fill(); }
    // an upper wall with crenels and the arcade below it
    const top = Y0 + (hz - Y0) * 0.34, ah = (hz - top) * 0.92, cw = Math.max(170, W / 4.4), yb = hz - 14;
    ctx.fillStyle = '#6a604c'; ctx.fillRect(X0, top - 60, W, 60); ctx.fillStyle = '#7a705a'; for (let x = X0; x < X1; x += 56) ctx.fillRect(x + 8, top - 86, 34, 30);
    ctx.fillStyle = vgrad(ctx, top, yb, [[0, '#8e8268'], [1, '#a29476']]); ctx.fillRect(X0, top - 2, W, yb - top + 2);
    const n = Math.ceil(W / cw) + 2;
    for (let k = -1; k < n; k++) {
      const x0 = X0 + k * cw + (cw - (W % cw)) * 0.0, x1 = x0 + cw, xm = (x0 + x1) / 2, aw = cw * 0.66, ar = aw / 2, ytop = top + 34;
      // the room behind each arch: dark with a lit window and lamp
      ctx.fillStyle = '#17120e'; ctx.beginPath(); ctx.moveTo(xm - ar, yb); ctx.lineTo(xm - ar, ytop + ar); ctx.arc(xm, ytop + ar, ar, Math.PI, 0); ctx.lineTo(xm + ar, yb); ctx.closePath(); ctx.fill();
      glow(ctx, xm, ytop + ar + 70, ar * 1.7, '#ffb860', 0.45 + 0.08 * Math.sin(t * 3 + k)); ctx.fillStyle = '#ffd890'; ctx.fillRect(xm - 16, ytop + ar + 40, 32, 46); ctx.fillStyle = '#3a2410'; ctx.fillRect(xm - 1.5, ytop + ar + 40, 3, 46); ctx.fillRect(xm - 16, ytop + ar + 61, 32, 3);
      // the archivolt and the slim column with capital and base
      ctx.strokeStyle = '#c4b490'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(xm - ar, yb); ctx.lineTo(xm - ar, ytop + ar); ctx.arc(xm, ytop + ar, ar, Math.PI, 0); ctx.lineTo(xm + ar, yb); ctx.stroke();
      ctx.strokeStyle = 'rgba(40,30,16,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(xm, ytop + ar, ar + 6, Math.PI, 0); ctx.stroke();
      const colx = x1, cwid = 26; ctx.fillStyle = hgrad(ctx, colx - cwid, colx + cwid, [[0, '#6a5e46'], [0.35, '#d4c6a0'], [0.7, '#a89a76'], [1, '#54492f']]); ctx.fillRect(colx - cwid / 2, ytop + ar * 0.6, cwid, yb - ytop - ar * 0.6);
      ctx.fillStyle = '#b8a880'; ctx.fillRect(colx - cwid * 0.8, ytop + ar * 0.6 - 14, cwid * 1.6, 16); ctx.fillRect(colx - cwid * 0.8, yb - 14, cwid * 1.6, 16);
      // a hanging in red and gold between some arches
      if (k % 2 === 0) { const hx = colx, hy = top - 4; ctx.fillStyle = '#b0261c'; ctx.fillRect(hx - 20, hy, 40, ah * 0.55); ctx.fillStyle = '#e8b61c'; ctx.fillRect(hx - 20, hy, 40, 10); ctx.fillRect(hx - 20, hy + ah * 0.55 - 12, 40, 12); ctx.fillStyle = '#e8b61c'; poly(ctx, [[hx - 20, hy + ah * 0.55], [hx + 20, hy + ah * 0.55], [hx, hy + ah * 0.55 + 22]]); ctx.fill(); }
    }
    lampStrand(ctx, { x0: X0, x1: X1 }, top - 120, t, ['#ffd27a', '#ff9a50', '#fff2c0'], 18); lampStrand(ctx, { x0: X0, x1: X1 }, top + 20, t * 1.1, ['#ffd27a', '#ff8a60'], 14);
    // paving: large flagstones with a worn path of lamplight
    floorShade(ctx, A, hz, '#8e6a4e', '#4a2e22');
    ctx.strokeStyle = 'rgba(20,8,2,0.45)'; ctx.lineWidth = 2.5;
    for (let r = 1; r < 24; r++) { const y = hz + (H - hz) * Math.pow(r / 24, 1.5); ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(X1, y); ctx.stroke(); const sz = 60 + 100 * Math.pow(r / 24, 1.5); for (let x = X0 + ((r % 2) ? sz / 2 : 0); x < X1; x += sz * 1.7) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + (H - hz) * (Math.pow((r + 1) / 24, 1.5) - Math.pow(r / 24, 1.5))); ctx.stroke(); } }
    ctx.fillStyle = rgrad(ctx, cx, hz + (H - hz) * 0.4, 10, W * 0.7, [[0, 'rgba(255,196,120,0.34)'], [1, 'rgba(255,196,120,0)']]); ctx.fillRect(X0, hz, W, H - hz);
    ctx.fillStyle = rgrad(ctx, cx, (hz + Y0) / 2, W * 0.3, W * 0.9, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(2,4,14,0.55)']]); ctx.fillRect(X0, Y0, W, H - Y0);
  },

  // ---- a desert festival tent seen from below: a block-printed awning over the top, the dusk and a camp fire in the open side, a long striped rug in the foreground (Sindh) -----------------------------
  canopy(ctx, A, t, hz) {
    const X0 = A.x0, X1 = A.x1, W = X1 - X0, Y0 = A.y0, H = A.y1, cx = (X0 + X1) / 2, ah = Y0 + (hz - Y0) * 0.42;
    ctx.fillStyle = vgrad(ctx, ah, hz, [[0, '#2a1a4a'], [0.45, '#8a3a5a'], [0.8, '#f08a4a'], [1, '#ffc070']]); ctx.fillRect(X0, ah - 4, W, hz - ah + 4);
    for (let k = 0; k < 50; k++) { ctx.fillStyle = `rgba(255,248,220,${0.2 + 0.6 * hash(k + 1)})`; circ(ctx, X0 + hash(k * 3.3) * W, ah + hash(k * 1.7 + 4) * (hz - ah) * 0.4, 0.8 + 1.2 * hash(k)); ctx.fill(); }
    // dunes and a camp fire
    for (const [yo, col, amp, ph] of [[0.62, '#4a2a40', 24, 0.3], [0.8, '#2a1830', 34, 1.4]]) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(X0, hz); for (let i = 0; i <= 24; i++) ctx.lineTo(X0 + W * i / 24, ah + (hz - ah) * yo - amp * Math.sin(i * 0.5 + ph) - amp * 0.4 * Math.sin(i * 1.7)); ctx.lineTo(X1, hz); ctx.closePath(); ctx.fill(); }
    glow(ctx, cx + W * 0.18, hz - 50, 150, '#ffa040', 0.8 + 0.1 * Math.sin(t * 7)); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.moveTo(cx + W * 0.18 - 16, hz - 20); ctx.quadraticCurveTo(cx + W * 0.18 + Math.sin(t * 9) * 4, hz - 80, cx + W * 0.18 + 16, hz - 20); ctx.fill();
    // the awning: red cloth printed with indigo diamonds, a scalloped edge and hanging tassels
    ctx.fillStyle = '#9a2a20'; ctx.fillRect(X0, Y0, W, ah - Y0);
    for (let r = 0; r * 56 < ah - Y0 + 56; r++) for (let q = -1; q < W / 56 + 1; q++) { const x = X0 + q * 56 + (r % 2) * 28, y = Y0 + r * 28; ctx.fillStyle = '#1e2a6a'; poly(ctx, [[x, y - 14], [x + 22, y], [x, y + 14], [x - 22, y]]); ctx.fill(); ctx.fillStyle = '#f4ecd8'; circ(ctx, x, y, 3.2); ctx.fill(); }
    ctx.fillStyle = vgrad(ctx, Y0, ah, [[0, 'rgba(0,0,0,0.55)'], [0.6, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.3)']]); ctx.fillRect(X0, Y0, W, ah - Y0);
    for (let q = 0; q < W / 52 + 1; q++) { const x = X0 + q * 52; ctx.fillStyle = q % 2 ? '#e8c04a' : '#b8321f'; ctx.beginPath(); ctx.moveTo(x, ah - 2); ctx.arc(x + 26, ah - 2, 26, Math.PI, 0, true); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#1a1210'; ctx.fillRect(x + 25, ah + 24, 2, 26); circ(ctx, x + 26, ah + 52, 4.5); ctx.fill(); }
    // tent poles at both sides with a rope wrap
    for (const sx of [-1, 1]) { const px = sx < 0 ? X0 + W * 0.07 : X1 - W * 0.07; ctx.fillStyle = hgrad(ctx, px - 20, px + 20, [[0, '#3a2210'], [0.4, '#a2723c'], [1, '#2a180a']]); ctx.fillRect(px - 20, ah - 10, 40, hz - ah + 70); ctx.fillStyle = '#eadfc0'; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.moveTo(px - 20, ah + 20 + k * 20); ctx.lineTo(px + 20, ah + 34 + k * 20); ctx.lineTo(px + 20, ah + 40 + k * 20); ctx.lineTo(px - 20, ah + 26 + k * 20); ctx.closePath(); ctx.fill(); } }
    // the rug in the foreground: long stripes running into the tent
    ctx.fillStyle = '#7a2a20'; ctx.fillRect(X0, hz, W, H - hz);
    const cols = ['#a8382a', '#1e2a6a', '#e8c04a', '#2a7a6a', '#f4ecd8', '#a8382a'];
    for (let k = -8; k < 8; k++) { ctx.fillStyle = cols[(k + 8) % cols.length]; ctx.beginPath(); ctx.moveTo(k * 44, hz); ctx.lineTo((k + 1) * 44, hz); ctx.lineTo((k + 1) * 120, H); ctx.lineTo(k * 120, H); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 2; for (let r = 1; r < 18; r++) { const y = hz + (H - hz) * Math.pow(r / 18, 1.8); ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(X1, y); ctx.stroke(); }
    ctx.fillStyle = rgrad(ctx, cx, hz + (H - hz) * 0.35, 10, W * 0.6, [[0, 'rgba(255,170,90,0.34)'], [1, 'rgba(255,170,90,0)']]); ctx.fillRect(X0, hz, W, H - hz);
    ctx.fillStyle = rgrad(ctx, cx, (hz + Y0) / 2, W * 0.3, W * 0.9, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(10,2,10,0.55)']]); ctx.fillRect(X0, Y0, W, H - Y0);
  },

  // ---- an Odisha village at dusk: a glowing sky, palms and thatched huts with a lit door, haystacks, hanging lanterns, a plastered yard with a white lime-paste pattern (Odisha) ------------------------------------
  dusk(ctx, A, t, hz) {
    const X0 = A.x0, X1 = A.x1, W = X1 - X0, Y0 = A.y0, H = A.y1, cx = (X0 + X1) / 2;
    ctx.fillStyle = vgrad(ctx, Y0, hz, [[0, '#2a1d4e'], [0.4, '#a2406a'], [0.75, '#f08a58'], [1, '#ffd08a']]); ctx.fillRect(X0, Y0, W, hz - Y0);
    for (let k = 0; k < 60; k++) { ctx.fillStyle = `rgba(255,240,220,${0.15 + 0.5 * hash(k + 1)})`; circ(ctx, X0 + hash(k * 3.3) * W, Y0 + hash(k * 1.7 + 4) * (hz - Y0) * 0.45, 0.8 + 1.3 * hash(k)); ctx.fill(); }
    glow(ctx, cx, hz - 20, W * 0.5, '#ffd08a', 0.5);
    // palms and huts as dark silhouettes along the horizon
    ctx.fillStyle = '#2a1424'; ctx.beginPath(); ctx.moveTo(X0, hz); for (let i = 0; i <= 30; i++) ctx.lineTo(X0 + W * i / 30, hz - 26 - 14 * Math.sin(i * 0.7) - 8 * Math.sin(i * 2.1)); ctx.lineTo(X1, hz); ctx.closePath(); ctx.fill();
    const palm = (x, y, h, lean) => { ctx.strokeStyle = '#26121e'; ctx.lineWidth = h * 0.05; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + lean * h * 0.3, y - h * 0.5, x + lean * h * 0.5, y - h); ctx.stroke(); const tx = x + lean * h * 0.5, ty = y - h; ctx.lineWidth = h * 0.025; for (let k = 0; k < 9; k++) { const a = -Math.PI / 2 + (k - 4) * 0.42 + Math.sin(t * 1.2 + k) * 0.03; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx + Math.cos(a) * h * 0.2, ty + Math.sin(a) * h * 0.2 - h * 0.05, tx + Math.cos(a) * h * 0.4, ty + Math.sin(a) * h * 0.4 + h * 0.12); ctx.stroke(); } };
    for (const [fx, h, ln] of [[0.08, 330, 0.2], [0.2, 250, -0.15], [0.84, 300, -0.2], [0.94, 360, 0.12]]) palm(X0 + W * fx, hz, h, ln);
    for (const [fx, w, hh] of [[0.3, 190, 120], [0.7, 210, 130]]) { const x = X0 + W * fx, y = hz; ctx.fillStyle = '#3a2418'; ctx.fillRect(x - w / 2, y - hh * 0.55, w, hh * 0.55); ctx.fillStyle = '#4a3220'; poly(ctx, [[x - w * 0.62, y - hh * 0.5], [x + w * 0.62, y - hh * 0.5], [x + w * 0.2, y - hh * 1.2], [x - w * 0.2, y - hh * 1.2]]); ctx.fill(); ctx.strokeStyle = 'rgba(20,10,4,0.5)'; ctx.lineWidth = 2; for (let k = 1; k < 8; k++) { ctx.beginPath(); ctx.moveTo(x - w * 0.62 + k * w * 0.155, y - hh * 0.5); ctx.lineTo(x - w * 0.2 + k * w * 0.05, y - hh * 1.2); ctx.stroke(); } ctx.fillStyle = '#ffc060'; ctx.fillRect(x - 16, y - hh * 0.5, 32, hh * 0.5); glow(ctx, x, y - hh * 0.25, 70, '#ffb040', 0.55 + 0.08 * Math.sin(t * 4 + fx * 9)); }
    // hanging lanterns on two strings
    lampStrand(ctx, { x0: X0, x1: X1 }, Y0 + (hz - Y0) * 0.16, t, ['#ffb050', '#ff7a40', '#ffe08a'], 12); lampStrand(ctx, { x0: X0, x1: X1 }, Y0 + (hz - Y0) * 0.3, t * 1.2, ['#ffb050', '#ffe08a'], 10);
    // the yard: plastered mud with a white lime-paste circle pattern and sheaves
    floorShade(ctx, A, hz, '#7a4630', '#5a2c1e');
    for (let k = 0; k < 120; k++) { ctx.fillStyle = `rgba(${hash(k) > 0.5 ? '40,10,4' : '200,120,80'},${0.05 + 0.07 * hash(k + 3)})`; ell(ctx, X0 + hash(k * 2.3) * W, hz + hash(k * 1.9 + 2) * (H - hz), 16 + 50 * hash(k + 5), 6 + 20 * hash(k + 7)); ctx.fill(); }
    const py = hz + (H - hz) * 0.5, pr = Math.min(W * 0.46, (H - hz) * 0.42);
    ctx.strokeStyle = '#f4ecdc'; ctx.fillStyle = '#f4ecdc'; ctx.lineCap = 'round';
    for (const [r, lw] of [[1, 7], [0.78, 4.5], [0.4, 4.5]]) { ctx.lineWidth = lw; ctx.beginPath(); ctx.ellipse(cx, py, pr * r, pr * r * 0.5, 0, 0, TAU); ctx.stroke(); }
    ctx.lineWidth = 4; for (let k = 0; k < 24; k++) { const a = (k / 24) * TAU; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * pr * 0.78, py + Math.sin(a) * pr * 0.39); ctx.quadraticCurveTo(cx + Math.cos(a + 0.18) * pr * 0.92, py + Math.sin(a + 0.18) * pr * 0.46, cx + Math.cos(a) * pr, py + Math.sin(a) * pr * 0.5); ctx.stroke(); }
    for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU + 0.3; circ(ctx, cx + Math.cos(a) * pr * 0.6, py + Math.sin(a) * pr * 0.3, 6); ctx.fill(); }
    for (const sx of [-1, 1]) { const px = cx + sx * W * 0.4, pyy = H - 50; for (let k = 0; k < 18; k++) { const a = -Math.PI / 2 + (k - 8.5) * 0.11; ctx.strokeStyle = k % 2 ? '#d8b048' : '#c49a30'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(px, pyy); ctx.lineTo(px + Math.cos(a) * 130, pyy + Math.sin(a) * 130); ctx.stroke(); } }
    ctx.fillStyle = rgrad(ctx, cx, hz + (H - hz) * 0.4, 10, W * 0.7, [[0, 'rgba(255,190,110,0.3)'], [1, 'rgba(255,190,110,0)']]); ctx.fillRect(X0, hz, W, H - hz);
    ctx.fillStyle = rgrad(ctx, cx, (hz + Y0) / 2, W * 0.3, W * 0.9, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(20,4,10,0.5)']]); ctx.fillRect(X0, Y0, W, H - Y0);
  },
});

// ---- the pillars of the row composition: drawn at (x, yBase) at scale s, on side sd (-1 left, +1 right) ---------------------------------------------------------------------------------------
const POSTS = {
  granite(ctx, x, yb, s, sd) {
    const w = 62 * s, top = yb - 700 * s;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x - w + 14 * s, yb - 4 * s, 2 * w, 12 * s);
    ctx.fillStyle = hgrad(ctx, x - w, x + w, [[0, '#4a4e52'], [0.3, '#a2a8ac'], [0.6, '#7a8084'], [1, '#34383c']]); ctx.fillRect(x - w, top, 2 * w, yb - top);
    ctx.fillStyle = hgrad(ctx, x - w * 1.18, x + w * 1.18, [[0, '#3a3e42'], [0.4, '#8a9094'], [1, '#2a2e32']]); ctx.fillRect(x - w * 1.18, yb - 60 * s, 2.36 * w, 60 * s); ctx.fillRect(x - w * 1.12, top, 2.24 * w, 40 * s);
    ctx.strokeStyle = 'rgba(10,12,14,0.55)'; ctx.lineWidth = 2; for (let r = 1; r < 9; r++) { const y = top + (yb - top) * r / 9; ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x + w, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(190,200,90,0.22)'; for (let q = 0; q < 8; q++) ell(ctx, x + (hash(q + sd) - 0.5) * w * 1.4, top + (yb - top) * hash(q * 2 + 1), 8 * s + 14 * s * hash(q), 5 * s + 7 * s * hash(q + 4)), ctx.fill();
    ctx.fillStyle = hgrad(ctx, x - w, x + w, [[0, 'rgba(0,0,0,0.35)'], [0.18, 'rgba(255,255,255,0.1)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.4)']]); ctx.fillRect(x - w, top, 2 * w, yb - top);
  },
  arch(ctx, x, yb, s, sd) {
    const w = 58 * s, top = yb - 700 * s, cap = top + 20 * s;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x - w + 14 * s, yb - 4 * s, 2 * w, 12 * s);
    ctx.fillStyle = hgrad(ctx, x - w, x + w, [[0, '#6a5c48'], [0.3, '#cdbd98'], [0.62, '#a8987a'], [1, '#4a3e2c']]); ctx.fillRect(x - w, cap, 2 * w, yb - cap);
    ctx.fillStyle = hgrad(ctx, x - w * 1.3, x + w * 1.3, [[0, '#5a4c38'], [0.4, '#d8c8a2'], [1, '#4a3e2c']]); rrect(ctx, x - w * 1.3, yb - 46 * s, w * 2.6, 46 * s, 6 * s); ctx.fill(); rrect(ctx, x - w * 1.35, cap - 18 * s, w * 2.7, 38 * s, 8 * s); ctx.fill();
    // the arch springs from the capital towards the middle of the aisle
    ctx.strokeStyle = hgrad(ctx, x, x - sd * 300 * s, [[0, '#b8a880'], [1, '#6a5c44']]); ctx.lineWidth = 46 * s; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.arc(x - sd * 150 * s, cap - 18 * s, 150 * s, sd < 0 ? Math.PI * 1.0 : 0, sd < 0 ? Math.PI * 1.5 : -Math.PI * 0.5, sd < 0 ? false : true); ctx.stroke();
    ctx.fillStyle = hgrad(ctx, x - w, x + w, [[0, 'rgba(0,0,0,0.3)'], [0.2, 'rgba(255,255,255,0.1)'], [0.55, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.42)']]); ctx.fillRect(x - w, cap, 2 * w, yb - cap);
  },
  tentpole(ctx, x, yb, s, sd, t) {
    const w = 22 * s, top = yb - 700 * s;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x - w + 10 * s, yb - 3 * s, 2 * w + 6 * s, 8 * s);
    ctx.fillStyle = hgrad(ctx, x - w, x + w, [[0, '#3a2210'], [0.35, '#a87a46'], [0.65, '#7a5230'], [1, '#2a1608']]); ctx.fillRect(x - w, top, 2 * w, yb - top);
    ctx.strokeStyle = '#d8c8a0'; ctx.lineWidth = 6 * s; for (let r = 0; r < 5; r++) { const y = yb - (80 + r * 34) * s; ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x + w, y + 8 * s); ctx.stroke(); }
    // a cloth hanging from the top, swaying a little
    ctx.fillStyle = '#9a2a20'; ctx.beginPath(); ctx.moveTo(x - w * 2.2, top + 20 * s); ctx.lineTo(x + w * 2.2, top + 20 * s); ctx.lineTo(x + w * 2.8 + Math.sin(t * 1.5) * 4 * s, top + 330 * s); ctx.lineTo(x - w * 2.8 + Math.sin(t * 1.5) * 4 * s, top + 330 * s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1e2a6a'; for (let q = 0; q < 5; q++) { const yy = top + (70 + q * 52) * s; poly(ctx, [[x - w * 1.4, yy], [x, yy + 22 * s], [x + w * 1.4, yy], [x, yy - 22 * s]]); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + (sd < 0 ? w * 0.3 : -w * 2.6), top + 20 * s, w * 2.3, 310 * s);
  },
};
export const postFor = (id) => POSTS[id] ?? POSTS.granite;
export const sceneFor = (id) => SCENES[id] ?? SCENES.pandal;

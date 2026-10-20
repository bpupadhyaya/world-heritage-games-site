// shape-craft 1.24.0: each papermaking and bark-cloth craft gets its own hero picture for technique `sheet` (param `hero`).
// A hero owns the whole work area behind the playing surface (backdrop, vat or log, frames, ropes, tools) and the place of the sheet in it.
// The game logic of `sheet` is untouched: the hero only says WHERE the sheet is (layout), WHAT stands round it (back / mouldBack / front) and, for the
// finishing step, how the press or the board looks (press / board). Pure canvas 2D, deterministic.
import { hash } from './geom.js';
import { tint, rrect, rgba, mix } from './fx.js';

const TAU = Math.PI * 2;
const lg = (ctx, x0, y0, x1, y1, st) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); for (const [o, c] of st) g.addColorStop(o, c); return g; };
const rg = (ctx, x, y, r0, r1, st) => { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); for (const [o, c] of st) g.addColorStop(o, c); return g; };
const ell = (ctx, x, y, rx, ry) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); };
const poly = (ctx, pts) => { ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); };
const line = (ctx, x0, y0, x1, y1, c, w) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };

// a wooden bar or board with a lit top edge and grain; vertical grain when `vert`
function wood(ctx, x, y, w, h, c, vert = false, seed = 1) {
  ctx.fillStyle = vert ? lg(ctx, x, 0, x + w, 0, [[0, tint(c, 0.2)], [0.5, c], [1, tint(c, -0.4)]]) : lg(ctx, 0, y, 0, y + h, [[0, tint(c, 0.25)], [0.45, c], [1, tint(c, -0.42)]]);
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(30,16,4,0.2)'; ctx.lineWidth = 1;
  const n = Math.max(2, Math.round((vert ? w : h) / 7));
  for (let k = 0; k < n; k++) { const q = (k + hash(k, seed)) / n; ctx.beginPath(); if (vert) { ctx.moveTo(x + w * q, y); ctx.lineTo(x + w * q + (hash(k, seed + 1) - 0.5) * 3, y + h); } else { ctx.moveTo(x, y + h * q); ctx.lineTo(x + w, y + h * q + (hash(k, seed + 1) - 0.5) * 3); } ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,240,200,0.22)'; if (vert) ctx.fillRect(x, y, 1.5, h); else ctx.fillRect(x, y, w, 1.5);
}
// a staved tub seen from the front: vertical staves, shaded round, with hoops
function staves(ctx, x, y, w, h, c, n, hoops, hoopC) {
  const sw = w / n;
  for (let k = 0; k < n; k++) { ctx.fillStyle = tint(c, (k % 2 ? 0.05 : -0.04) + (hash(k, 3) - 0.5) * 0.08); ctx.fillRect(x + k * sw, y, sw + 0.6, h); ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x + k * sw, y, 1.2, h); }
  ctx.fillStyle = lg(ctx, x, 0, x + w, 0, [[0, 'rgba(0,0,0,0.5)'], [0.22, 'rgba(255,240,200,0.12)'], [0.5, 'rgba(0,0,0,0)'], [0.82, 'rgba(0,0,0,0.2)'], [1, 'rgba(0,0,0,0.55)']]); ctx.fillRect(x, y, w, h);
  for (const f of hoops) { const hy = y + h * f, hh = Math.max(5, h * 0.045); ctx.fillStyle = lg(ctx, 0, hy, 0, hy + hh, [[0, tint(hoopC, 0.3)], [1, tint(hoopC, -0.4)]]); ctx.fillRect(x, hy, w, hh); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x, hy + hh, w, 2); }
}
// a drop shadow ellipse on the water under a mould
function shade(ctx, cx, cy, rx, ry, a) { ctx.fillStyle = `rgba(0,0,0,${a})`; ell(ctx, cx, cy, rx, ry); ctx.fill(); }
function rope(ctx, x0, y0, x1, y1, w, c) {
  line(ctx, x0, y0, x1, y1, tint(c, -0.35), w + 1.5); line(ctx, x0, y0, x1, y1, c, w);
  ctx.save(); ctx.strokeStyle = 'rgba(40,24,6,0.55)'; ctx.lineWidth = 1; ctx.setLineDash([2.5, 3.5]); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore();
}
function ripples(ctx, o, cx, cy, rx, ry) {
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5;
  for (const rp of o.ripples) { const k = (o.now - rp) / 1.6; if (k < 0 || k > 1) continue; ctx.globalAlpha = (1 - k) * 0.7; ell(ctx, cx, cy, rx * (0.7 + 0.5 * k), ry * (0.7 + 0.5 * k)); ctx.stroke(); }
  ctx.globalAlpha = 1;
}
// milky water in an elliptical opening: clouds of pulp, wavy light lines
function pond(ctx, cx, cy, rx, ry, o, [c0, c1], milk) {
  ctx.save(); ell(ctx, cx, cy, rx, ry); ctx.clip();
  ctx.fillStyle = rg(ctx, cx - rx * 0.2, cy - ry * 0.3, ry * 0.1, rx * 0.9, [[0, c0], [1, c1]]); ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  for (let k = 0; k < 10; k++) { const px = cx + rx * (hash(k, 51) * 2 - 1) * 0.85 + Math.sin(o.t * 0.3 + k) * 5, py = cy + ry * (hash(k, 52) * 2 - 1) * 0.8, pr = rx * (0.15 + 0.2 * hash(k, 53)); ctx.fillStyle = rg(ctx, px, py, 0, pr, [[0, rgba(o.PULP, 0.5 * milk)], [1, rgba(o.PULP, 0)]]); ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2); }
  ctx.lineWidth = 1.2; for (let k = 0; k < 7; k++) { const yy = cy - ry + (ry * 2 * (k + 0.5)) / 7; ctx.strokeStyle = `rgba(255,252,240,${0.08 + 0.07 * Math.sin(o.t * 0.8 + k)})`; ctx.beginPath(); for (let q = 0; q <= 20; q++) { const xx = cx - rx + (rx * 2 * q) / 20, yo = Math.sin(q * 0.8 + o.t * 0.9 + k * 1.3) * 2.5; q ? ctx.lineTo(xx, yy + yo) : ctx.moveTo(xx, yy + yo); } ctx.stroke(); }
  ctx.restore();
}
function blocks(ctx, x, y, w, h, c, bh, seed) {   // courses of stone blocks
  ctx.fillStyle = tint(c, -0.4); ctx.fillRect(x, y, w, h);
  for (let row = 0, yy = y; yy < y + h; row++, yy += bh) { let xx = x - (row % 2 ? bh : 0); for (let k = 0; xx < x + w; k++) { const bw = bh * (1.5 + 1.2 * hash(row, k, seed)), sh = (hash(row, k, seed + 1) - 0.5) * 0.3; ctx.fillStyle = tint(c, sh); ctx.fillRect(xx + 1, yy + 1, bw - 2, bh - 2); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(xx + 1, yy + 1, bw - 2, 2); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(xx + 1, yy + bh - 3, bw - 2, 2); xx += bw; } }
}
const place = (W, a) => { const s = Math.min(W.w * a.fw, (W.h * a.fh) / a.asp); return { ox: W.x + W.w * a.cx - s / 2, oy: W.y + W.h * a.cy - (s * a.asp) / 2, s }; };

export const HEROES = {
  // ---- Japan: a mould hung from a beam by cords over a wide pale cedar tub seen from the front, a dark timber workshop with one tall shoji window -----------------------------
  washi: {
    asp: 1.3, fw: 0.56, fh: 0.58, cx: 0.5, cy: 0.5, tilt: true, couchScale: 0.72,
    layout(W) { return place(W, this); },
    back(ctx, W, V, o) {
      const { x, y, w, h } = W, s = V.s, hh = s * o.asp, cx = V.ox + s / 2;
      ctx.fillStyle = lg(ctx, 0, y, 0, y + h * 0.6, [[0, '#2a1c11'], [1, '#4a3220']]); ctx.fillRect(x, y, w, h * 0.6);
      for (let k = 0; k < w / 34; k++) line(ctx, x + k * 34, y, x + k * 34, y + h * 0.6, 'rgba(0,0,0,0.35)', 1.6);
      const sx0 = x + w * 0.72, sx1 = x + w * 0.94, sy0 = y + h * 0.12, sy1 = y + h * 0.54;   // one tall shoji window with a shaft of light
      ctx.fillStyle = lg(ctx, 0, sy0, 0, sy1, [[0, '#fffaf0'], [1, '#f0e2c0']]); ctx.fillRect(sx0, sy0, sx1 - sx0, sy1 - sy0);
      ctx.strokeStyle = '#1c120a'; ctx.lineWidth = 4; ctx.strokeRect(sx0, sy0, sx1 - sx0, sy1 - sy0); for (let k = 1; k < 3; k++) line(ctx, sx0 + ((sx1 - sx0) * k) / 3, sy0, sx0 + ((sx1 - sx0) * k) / 3, sy1, '#1c120a', 2.4); for (let k = 1; k < 6; k++) line(ctx, sx0, sy0 + ((sy1 - sy0) * k) / 6, sx1, sy0 + ((sy1 - sy0) * k) / 6, '#1c120a', 2.4);
      ctx.fillStyle = 'rgba(255,238,190,0.2)'; ctx.beginPath(); ctx.moveTo(sx0, sy1); ctx.lineTo(sx1, sy1); ctx.lineTo(x + w * 0.55, y + h); ctx.lineTo(x + w * 0.1, y + h); ctx.fill();
      const lx = x + w * 0.05; for (let k = 0; k < 4; k++) { ctx.save(); ctx.translate(lx + k * 34, y + h * 0.6); ctx.rotate(-0.07 + 0.03 * k); ctx.fillStyle = '#b08a52'; ctx.fillRect(0, -h * 0.34, 30, h * 0.34); ctx.fillStyle = '#fbf6e8'; ctx.fillRect(3, -h * 0.34 + 5, 24, h * 0.34 - 10); ctx.restore(); }   // drying boards with white sheets
      ctx.fillStyle = lg(ctx, 0, y + h * 0.6, 0, y + h, [[0, '#d8c08c'], [1, '#a88a56']]); ctx.fillRect(x, y + h * 0.6, w, h * 0.4);   // pale boards of the floor
      for (let k = 0; k < 9; k++) line(ctx, x, y + h * (0.62 + 0.045 * k), x + w, y + h * (0.62 + 0.045 * k), 'rgba(70,44,10,0.3)', 1.5);
      wood(ctx, x, y, w, h * 0.06, '#1c120a', false, 4);
      // the tub: a wide, pale cedar vat in front view, with a bright rim and milky water
      const ty = V.oy + hh * 0.6, rx = s * 0.95, ry = s * 0.24, bot = y + h + 4;
      shade(ctx, cx, bot - 6, rx * 1.05, ry * 0.5, 0.3);
      staves(ctx, cx - rx, ty, rx * 2, bot - ty, '#e0bc84', 18, [0.22, 0.64], '#7a5a30');
      ctx.fillStyle = '#f0d8a0'; ell(ctx, cx, ty, rx, ry); ctx.fill(); ctx.strokeStyle = 'rgba(60,34,8,0.6)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#9a7a48'; ell(ctx, cx, ty + 1, rx * 0.94, ry * 0.9); ctx.fill();
      pond(ctx, cx, ty + ry * 0.12, rx * 0.92, ry * 0.82, o, ['#fbf8ec', '#aebab8'], 0.7);
      shade(ctx, cx, ty + ry * 0.3, s * 0.52, ry * 0.5, 0.25);
      ripples(ctx, o, cx, ty + ry * 0.15, rx * 0.72, ry * 0.6);
      if (o.P.neri) { ctx.strokeStyle = 'rgba(255,255,250,0.55)'; ctx.lineWidth = 1.8; for (let k = 0; k < 6; k++) { const px = cx - rx * 0.7 + rx * 1.4 * hash(k, 71), py = ty + ry * (0.1 + 0.5 * hash(k, 72)); ctx.beginPath(); ctx.moveTo(px, py); ctx.bezierCurveTo(px + 14, py - 6, px + 26, py + 8, px + 44, py + 2); ctx.stroke(); } }
    },
    mouldBack(ctx, W, V, o) {   // the beam, two cords and a bamboo handle bar above the mould
      const s = V.s, by = W.y + W.h * 0.06, barY = V.oy - s * 0.13;
      for (const f of [0.12, 0.88]) { rope(ctx, V.ox + s * f, by, V.ox + s * f, barY, Math.max(2.6, s * 0.012), '#c8a868'); rope(ctx, V.ox + s * f, barY + s * 0.02, V.ox + s * (f < 0.5 ? 0.14 : 0.86), V.oy - s * 0.04, Math.max(2, s * 0.009), '#c8a868'); }
      wood(ctx, V.ox - s * 0.05, barY - s * 0.025, s * 1.1, s * 0.05, '#d8c080', false, 9);
      for (const f of [0.12, 0.5, 0.88]) line(ctx, V.ox + s * f, barY - s * 0.025, V.ox + s * f, barY + s * 0.025, 'rgba(70,46,10,0.8)', 2.5);
    },
  },

  // ---- Korea: a mould on a rope bridle from a pulley, swung by hand over a round amber tub, a dark lamp-lit room ----------------------------------------------------
  hanji: {
    asp: 1.3, fw: 0.5, fh: 0.5, cx: 0.5, cy: 0.54, tilt: true, couchScale: 0.72,
    layout(W) { return place(W, this); },
    pivot(W) { return [W.x + W.w / 2, W.y + W.h * 0.08]; },
    rot(o) { return o.tl ? o.tl[0] * 0.055 : 0; },
    back(ctx, W, V, o) {
      const { x, y, w, h } = W, s = V.s, hh = s * o.asp, cx = V.ox + s / 2;
      ctx.fillStyle = lg(ctx, 0, y, 0, y + h, [[0, '#2e2218'], [1, '#17100b']]); ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rg(ctx, x + w * 0.5, y + h * 0.1, 0, Math.max(w, h) * 0.7, [[0, 'rgba(255,205,128,0.5)'], [0.5, 'rgba(255,190,110,0.12)'], [1, 'rgba(255,190,110,0)']]); ctx.fillRect(x, y, w, h);
      for (const fx of [0.02, 0.8]) { const px = x + w * fx, pw = w * 0.18, py = y + h * 0.18, ph = h * 0.5; ctx.fillStyle = 'rgba(236,200,140,0.32)'; ctx.fillRect(px, py, pw, ph); ctx.strokeStyle = 'rgba(80,50,24,0.8)'; ctx.lineWidth = 2.5; ctx.strokeRect(px, py, pw, ph); for (let q = 1; q < 3; q++) { line(ctx, px + (pw * q) / 3, py, px + (pw * q) / 3, py + ph, 'rgba(80,50,24,0.7)', 2); } for (let q = 1; q < 6; q++) line(ctx, px, py + (ph * q) / 6, px + pw, py + (ph * q) / 6, 'rgba(80,50,24,0.7)', 2); }
      wood(ctx, x, y + h * 0.03, w, h * 0.05, '#5a3c20', false, 6);
      { const lx = x + w * 0.84, ly = y + h * 0.16; line(ctx, lx, y + h * 0.08, lx, ly - 18, '#7a5a30', 2); ctx.fillStyle = rg(ctx, lx, ly, 2, 40, [[0, 'rgba(255,214,130,0.55)'], [1, 'rgba(255,214,130,0)']]); ctx.fillRect(lx - 42, ly - 42, 84, 84); ctx.fillStyle = lg(ctx, lx - 14, 0, lx + 14, 0, [[0, '#c88a3a'], [0.5, '#ffe2a0'], [1, '#b87a2c']]); rrect(ctx, lx - 14, ly - 20, 28, 40, 12); ctx.fill(); ctx.strokeStyle = 'rgba(90,50,12,0.6)'; ctx.lineWidth = 1; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(lx - 14, ly - 20 + k * 10); ctx.lineTo(lx + 14, ly - 20 + k * 10); ctx.stroke(); } }
      const px = x + w / 2, py = y + h * 0.08;   // pulley on the beam
      ctx.strokeStyle = 'rgba(255,225,170,0.18)'; ctx.setLineDash([3, 6]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px, py, V.oy - py + hh * 0.45, Math.PI / 2 - 0.5, Math.PI / 2 + 0.5); ctx.stroke(); ctx.setLineDash([]);
      // the tub: round, amber lacquer, wide and low
      const ty = V.oy + hh * 0.93, rx = s * 0.9, ry = s * 0.26, bot = y + h + 4;
      shade(ctx, cx, bot - 6, rx * 1.1, ry * 0.45, 0.4);
      ctx.fillStyle = lg(ctx, cx - rx, 0, cx + rx, 0, [[0, '#4a2a0c'], [0.3, '#b8762a'], [0.5, '#d8923a'], [0.75, '#9a5e1e'], [1, '#3a2008']]); ctx.fillRect(cx - rx, ty, rx * 2, bot - ty);
      ctx.fillStyle = 'rgba(255,235,180,0.3)'; ctx.fillRect(cx - rx * 0.45, ty, rx * 0.06, bot - ty);
      ctx.fillStyle = tint('#c8842c', 0.1); ell(ctx, cx, ty, rx, ry); ctx.fill(); ctx.strokeStyle = 'rgba(30,14,2,0.7)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#5a3410'; ell(ctx, cx, ty + 1, rx * 0.93, ry * 0.88); ctx.fill();
      pond(ctx, cx, ty + ry * 0.12, rx * 0.9, ry * 0.8, o, ['#e8d4a0', '#7a6a40'], 0.55);
      ripples(ctx, o, cx, ty + ry * 0.2, rx * 0.7, ry * 0.6);
    },
    mouldBack(ctx, W, V, o) {   // the bridle: two ropes from the mould's top corners to the pulley, and a rope up to the beam
      const s = V.s, px = W.x + W.w / 2, py = W.y + W.h * 0.08;
      rope(ctx, px, W.y + W.h * 0.04, px, py, 3, '#c8a868');
      rope(ctx, px, py, V.ox + s * 0.06, V.oy - s * 0.02, Math.max(2.6, s * 0.012), '#c8a868'); rope(ctx, px, py, V.ox + s * 0.94, V.oy - s * 0.02, Math.max(2.6, s * 0.012), '#c8a868');
      ctx.fillStyle = rg(ctx, px, py, 1, 9, [[0, '#e8c070'], [1, '#6a4a14']]); ell(ctx, px, py, 8, 8); ctx.fill(); ctx.strokeStyle = 'rgba(30,18,4,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
    },
  },

  // ---- Nepal: a floating screen in a stone tank, snow peaks above, cool blues and greys ---------------------------------------------------------------------------
  lokta: {
    asp: 1.3, fw: 0.56, fh: 0.5, cx: 0.5, cy: 0.62, tilt: false,
    layout(W) { return place(W, this); },
    back(ctx, W, V, o) {
      const { x, y, w, h } = W, s = V.s, hh = s * o.asp;
      ctx.fillStyle = lg(ctx, 0, y, 0, y + h * 0.42, [[0, '#5ea6dc'], [1, '#e6f2f8']]); ctx.fillRect(x, y, w, h * 0.42);
      ctx.fillStyle = '#e8eef4'; ctx.beginPath(); ctx.moveTo(x, y + h * 0.4); for (let k = 0; k <= 9; k++) ctx.lineTo(x + (w * k) / 9, y + h * (0.1 + 0.26 * Math.abs(Math.sin(k * 1.37 + 0.6)))); ctx.lineTo(x + w, y + h * 0.4); ctx.fill();
      ctx.fillStyle = 'rgba(90,120,170,0.38)'; ctx.beginPath(); ctx.moveTo(x + w * 0.22, y + h * 0.4); ctx.lineTo(x + w * 0.36, y + h * 0.1); ctx.lineTo(x + w * 0.52, y + h * 0.4); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + w * 0.62, y + h * 0.4); ctx.lineTo(x + w * 0.78, y + h * 0.16); ctx.lineTo(x + w * 0.96, y + h * 0.4); ctx.fill();
      ctx.fillStyle = '#4e7a48'; ctx.beginPath(); ctx.moveTo(x, y + h * 0.42); for (let k = 0; k <= 10; k++) ctx.lineTo(x + (w * k) / 10, y + h * (0.36 + 0.04 * Math.sin(k * 1.9))); ctx.lineTo(x + w, y + h * 0.48); ctx.lineTo(x, y + h * 0.48); ctx.fill();
      // the terrace and the drying screens against the back wall
      const ty = y + h * 0.4;
      blocks(ctx, x, ty, w, h * 0.12, '#8a8272', Math.max(12, w * 0.028), 11);
      for (let k = 0; k < 4; k++) { const sx = k < 2 ? x + w * (0.03 + 0.07 * k) : x + w * (0.8 + 0.07 * (k - 2)), sw = w * 0.06, sh = h * 0.17; ctx.save(); ctx.translate(sx, ty + h * 0.02); ctx.rotate((k < 2 ? -1 : 1) * 0.07); ctx.fillStyle = '#6a4a28'; ctx.fillRect(0, -sh, sw, sh); ctx.fillStyle = '#f1e8d0'; ctx.fillRect(3, -sh + 3, sw - 6, sh - 6); ctx.restore(); }
      ctx.fillStyle = lg(ctx, 0, y + h * 0.52, 0, y + h, [[0, '#9a9484'], [1, '#585448']]); ctx.fillRect(x, y + h * 0.52, w, h * 0.48);
      // the tank in three-quarter view: stone walls and water narrowing to the back
      const bw = w * 0.84, fw = w * 0.99, by = y + h * 0.43, fy = y + h * 0.96, cx = V.ox + s / 2;
      poly(ctx, [[cx - bw / 2 - 18, by - 6], [cx + bw / 2 + 18, by - 6], [cx + fw / 2 + 30, fy + 8], [cx - fw / 2 - 30, fy + 8]]); ctx.fillStyle = '#6a6658'; ctx.fill();
      ctx.save(); poly(ctx, [[cx - bw / 2 - 18, by - 6], [cx + bw / 2 + 18, by - 6], [cx + bw / 2, by + h * 0.09], [cx - bw / 2, by + h * 0.09]]); ctx.clip(); blocks(ctx, cx - bw / 2 - 20, by - 8, bw + 40, h * 0.12, '#8e8878', Math.max(11, w * 0.024), 21); ctx.restore();   // the back wall of the tank
      ctx.save(); poly(ctx, [[cx - bw / 2 - 18, by - 6], [cx - bw / 2, by + h * 0.09], [cx - fw / 2, fy], [cx - fw / 2 - 30, fy + 8]]); ctx.clip(); blocks(ctx, cx - fw / 2 - 32, by - 8, 60 + (fw - bw) / 2, h, '#7a7666', Math.max(11, w * 0.024), 31); ctx.restore();
      ctx.save(); poly(ctx, [[cx + bw / 2 + 18, by - 6], [cx + bw / 2, by + h * 0.09], [cx + fw / 2, fy], [cx + fw / 2 + 30, fy + 8]]); ctx.clip(); blocks(ctx, cx + bw / 2 - 20, by - 8, 60 + (fw - bw) / 2, h, '#6e6a5c', Math.max(11, w * 0.024), 41); ctx.restore();
      ctx.save(); poly(ctx, [[cx - bw / 2, by + h * 0.09], [cx + bw / 2, by + h * 0.09], [cx + fw / 2, fy], [cx - fw / 2, fy]]); ctx.clip();
      ctx.fillStyle = lg(ctx, 0, by, 0, fy, [[0, '#2f6a70'], [0.6, '#4aa0a0'], [1, '#7fc8bc']]); ctx.fillRect(cx - fw / 2, by, fw, fy - by);
      for (let k = 0; k < 12; k++) { const py = by + h * 0.09 + (fy - by - h * 0.09) * (k / 12), sw = 12 + 40 * (k / 12); ctx.strokeStyle = `rgba(235,250,255,${0.1 + 0.08 * Math.sin(o.t * 0.9 + k)})`; ctx.lineWidth = 1.4; ctx.beginPath(); for (let q = 0; q <= 16; q++) { const xx = cx - fw / 2 + (fw * q) / 16, yo = Math.sin(q * 0.9 + o.t + k) * (1.5 + sw * 0.05); q ? ctx.lineTo(xx, py + yo) : ctx.moveTo(xx, py + yo); } ctx.stroke(); }
      for (let k = 0; k < 14; k++) { const px = cx - fw / 2 + fw * hash(k, 41), py = by + (fy - by) * hash(k, 42); ctx.fillStyle = `rgba(${90 + 60 * hash(k, 44) | 0},${110 + 40 * hash(k, 45) | 0},${105 + 30 * hash(k, 46) | 0},0.4)`; ell(ctx, px, py, 8 + 14 * hash(k, 43), 4 + 6 * hash(k, 43)); ctx.fill(); }
      shade(ctx, V.ox + s / 2 + 6, V.oy + hh / 2 + 10, s * 0.58, hh * 0.56, 0.28);
      ripples(ctx, o, V.ox + s / 2, V.oy + hh / 2, s * 0.62, hh * 0.58);
      ctx.restore();
    },
  },

  // ---- Netherlands: a timber press frame round the vat, whitewashed wall, felt pile and screw press -------------------------------------------------------------------
  dutch: {
    asp: 1.3, fw: 0.46, fh: 0.54, cx: 0.5, cy: 0.5, tilt: true, gaugeDx: 1.3, couchScale: 0.72,
    layout(W) { return place(W, this); },
    back(ctx, W, V, o) {
      const { x, y, w, h } = W, s = V.s, hh = s * o.asp, cx = V.ox + s / 2;
      ctx.fillStyle = lg(ctx, 0, y, 0, y + h, [[0, '#f6f0e2'], [1, '#d4c9b0']]); ctx.fillRect(x, y, w, h);
      for (let k = 0; k < w / 26; k++) line(ctx, x + k * 26, y, x + k * 26, y + h, 'rgba(90,70,40,0.16)', 1.5);
      const wx = x + w * 0.05, wy = y + h * 0.16, ww = w * 0.17, wh = h * 0.3; ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#a8d0ee'], [1, '#e8f2f8']]); ctx.fillRect(wx, wy, ww, wh);   // a window onto a windmill
      ctx.fillStyle = '#6a8a4a'; ctx.fillRect(wx, wy + wh * 0.8, ww, wh * 0.2); ctx.fillStyle = '#8a3a2a'; ctx.beginPath(); ctx.moveTo(wx + ww * 0.3, wy + wh * 0.8); ctx.lineTo(wx + ww * 0.4, wy + wh * 0.4); ctx.lineTo(wx + ww * 0.6, wy + wh * 0.4); ctx.lineTo(wx + ww * 0.7, wy + wh * 0.8); ctx.fill();
      ctx.save(); ctx.translate(wx + ww / 2, wy + wh * 0.42); ctx.rotate(o.t * 0.3); ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -wh * 0.42); ctx.stroke(); ctx.fillStyle = 'rgba(240,236,220,0.9)'; ctx.fillRect(-3, -wh * 0.42, 6, wh * 0.3); } ctx.restore();
      ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 5; ctx.strokeRect(wx, wy, ww, wh);
      // sheets hung to dry
      const ly = y + h * 0.1; line(ctx, x + w * 0.24, ly, x + w * 0.74, ly + 4, '#5a4a3a', 1.5); for (let k = 0; k < 4; k++) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 4; ctx.fillStyle = '#fbf6e8'; ctx.fillRect(x + w * (0.3 + 0.1 * k), ly + 2, 22, h * 0.12); ctx.restore(); }
      // the oak vat, square, in front view with brass studs
      const vx = V.ox - s * 0.1, vw = s * 1.2, vy = V.oy + hh * 0.7, bot = y + h + 4;
      shade(ctx, cx, bot - 4, vw * 0.6, 12, 0.3);
      wood(ctx, vx, vy, vw, bot - vy, '#4a3420', false, 12); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(vx, vy + (bot - vy) * 0.5, vw, 6);
      for (let k = 0; k < 14; k++) { const sx = vx + vw * (k + 0.5) / 14; ctx.fillStyle = rg(ctx, sx, vy + 9, 0, 4, [[0, '#f4dc88'], [1, '#6a4a10']]); ell(ctx, sx, vy + 9, 3.4, 3.4); ctx.fill(); }
      ctx.fillStyle = '#6a8088'; poly(ctx, [[vx + 8, vy], [vx + vw - 8, vy], [vx + vw - 20, vy - hh * 0.16], [vx + 20, vy - hh * 0.16]]); ctx.fill(); ctx.fillStyle = rg(ctx, cx, vy - hh * 0.08, 0, vw * 0.6, [[0, 'rgba(210,225,230,0.7)'], [1, 'rgba(60,80,90,0.2)']]); ctx.fill();
      for (let k = 0; k < 6; k++) { ctx.fillStyle = rgba(o.PULP, 0.18); ell(ctx, vx + vw * hash(k, 3), vy - hh * (0.03 + 0.1 * hash(k, 4)), 20 + 30 * hash(k, 5), 5); ctx.fill(); }
      ripples(ctx, o, cx, vy - hh * 0.08, vw * 0.45, hh * 0.08);
      // the posts of the press, a pile of felts
      const px0 = V.ox - s * 0.34, px1 = V.ox + s * 1.2, pw = s * 0.14;
      wood(ctx, px0, y, pw, h + 4, '#5a3e24', true, 14); wood(ctx, px1, y, pw, h + 4, '#5a3e24', true, 15);
      wood(ctx, px0 - s * 0.04, y, px1 - px0 + pw + s * 0.08, h * 0.1, '#4a3220', false, 16);
      for (let k = 0; k < 5; k++) { for (const sx of [px0 + pw * 0.5, px1 + pw * 0.5]) { ctx.fillStyle = rg(ctx, sx, y + h * (0.2 + 0.18 * k), 0, 4, [[0, '#f4dc88'], [1, '#6a4a10']]); ell(ctx, sx, y + h * (0.2 + 0.18 * k), 3.2, 3.2); ctx.fill(); } }
      ctx.fillStyle = '#2a1c10'; rrect(ctx, cx - s * 0.07, y + h * 0.03, s * 0.14, h * 0.07, 6); ctx.fill();
      const fx0 = x + w * 0.76, fy0 = y + h * 0.86;   // felts and sheets piled up beside
      for (let k = 0; k < 7; k++) { ctx.fillStyle = k % 2 ? '#8a7a5a' : '#f0e8d4'; rrect(ctx, fx0 + k * 0.8, fy0 - k * 6, w * 0.17, 7, 2); ctx.fill(); }
    },
    mouldBack(ctx, W, V, o) {   // the spindle and the platen of the press hang above the mould
      const s = V.s, cx = V.ox + s / 2;
      wood(ctx, cx - s * 0.05, W.y + W.h * 0.1, s * 0.1, V.oy - s * 0.18 - (W.y + W.h * 0.1), '#7a5a30', true, 18);
      wood(ctx, V.ox - s * 0.03, V.oy - s * 0.18, s * 1.06, s * 0.1, '#6a4a28', false, 19);
    },
    press(ctx, W, V, o) {   // the finishing step: the platen comes down on the sheet as the screw turns
      const s = V.s, hh = s * o.asp, cx = V.ox + s / 2, sq = o.press.n / 5, top = W.y + W.h * 0.1;
      wood(ctx, V.ox - s * 0.06, V.oy + hh * 0.9, s * 1.12, s * 0.07 + 6, '#5a3e24', false, 21);   // the bed under the pile
      for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? '#8a7a5a' : '#f0e8d4'; ctx.fillRect(V.ox - s * 0.02, V.oy + hh * 0.9 - 4 - k * 3, s * 1.04, 3); }
      o.sheet(ctx, V, {});
      ctx.fillStyle = 'rgba(40,30,18,0.1)'; ctx.fillRect(V.ox, V.oy, s, hh);
      const py = V.oy - s * 0.18 + sq * s * 0.1;
      wood(ctx, cx - s * 0.05, top, s * 0.1, py - top, '#7a5a30', true, 18); wood(ctx, V.ox - s * 0.03, py, s * 1.06, s * 0.1, '#6a4a28', false, 19);
      const rot = o.press.rot ?? 0, L = s * 0.5, d = Math.cos(rot) * L, bar = top + (py - top) * 0.25;   // the lever bar: foreshortened as it turns
      wood(ctx, cx - d, bar - s * 0.018, d * 2, s * 0.036, '#4a3018', false, 22);
      for (const sg of [-1, 1]) { ctx.fillStyle = rg(ctx, cx + sg * d, bar, 0, s * 0.045, [[0, '#d8b068'], [1, '#6a4a20']]); ell(ctx, cx + sg * d, bar, s * 0.04, s * 0.04); ctx.fill(); }
      for (let k = 0; k < o.press.n * 3; k++) { ctx.fillStyle = 'rgba(160,190,205,0.6)'; ell(ctx, V.ox + s * (0.05 + 0.9 * hash(k, 22)), V.oy + hh * 0.95 + (hash(k, 23) - 0.5) * 4, 4, 2); ctx.fill(); }
    },
  },

  // ---- Tonga: a long log anvil on a plaited mat, beaters lying beside it, palm shadows ----------------------------------------------------------------------------------
  ngatu: {
    asp: 0.8, fw: 0.74, fh: 0.5, cx: 0.5, cy: 0.5, tilt: false, beat: 'wooden beater', heldTool: 'mallet',
    layout(W) { return place(W, this); },
    back(ctx, W, V, o) {
      const { x, y, w, h } = W, s = V.s, hh = s * o.asp;
      ctx.fillStyle = '#d6b27a'; ctx.fillRect(x, y, w, h);   // the plaited mat
      const cell = Math.max(14, w / 28);
      for (let j = 0; j * cell < h + cell; j++) for (let i = 0; i * cell < w + cell; i++) { const a = (i + j) % 2; ctx.fillStyle = a ? 'rgba(120,70,20,0.2)' : 'rgba(255,235,190,0.28)'; ctx.beginPath(); ctx.moveTo(x + i * cell, y + j * cell); ctx.lineTo(x + (i + 1) * cell, y + (j + (a ? 0 : 1)) * cell); ctx.lineTo(x + (i + 1) * cell, y + (j + 1) * cell); ctx.lineTo(x + i * cell, y + (j + (a ? 1 : 0)) * cell); ctx.fill(); }
      for (let j = 0; j * cell < h; j++) line(ctx, x, y + j * cell, x + w, y + j * cell, 'rgba(90,50,10,0.22)', 1);
      ctx.fillStyle = '#5a1e14'; ctx.fillRect(x, y, w, h * 0.04); ctx.fillRect(x, y + h * 0.96, w, h * 0.04);   // red-brown borders of the mat
      for (let k = 0; k < 6; k++) { ctx.fillStyle = 'rgba(20,10,0,0.2)'; ctx.beginPath(); const lx = x + w * (0.1 + 0.18 * k), ly = y + h * (0.05 + 0.04 * k); ctx.moveTo(lx, ly); ctx.quadraticCurveTo(lx + 80, ly + 110, lx + 30 + 40 * hash(k, 3), ly + 220); ctx.quadraticCurveTo(lx + 20, ly + 100, lx, ly); ctx.fill(); }   // the shadow of palm fronds
      // the log: a long cylinder under the sheet, end grain at the left
      const lx0 = x + w * 0.02, lx1 = x + w * 0.98, ly0 = V.oy - hh * 0.2, ly1 = V.oy + hh * 1.22, r = (ly1 - ly0) / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.38)'; rrect(ctx, lx0 + 10, ly0 + 14, lx1 - lx0, ly1 - ly0, r * 0.35); ctx.fill();
      ctx.fillStyle = lg(ctx, 0, ly0, 0, ly1, [[0, '#a8743c'], [0.3, '#7a4c24'], [0.8, '#4a2c14'], [1, '#2e1a0a']]); rrect(ctx, lx0 + r * 0.3, ly0, lx1 - lx0 - r * 0.3, ly1 - ly0, r * 0.3); ctx.fill();
      for (let k = 0; k < 26; k++) { const gy = ly0 + (ly1 - ly0) * hash(k, 5), gx = lx0 + r * 0.4 + (lx1 - lx0 - r) * hash(k, 6); ctx.strokeStyle = 'rgba(30,16,4,0.3)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + 30 + 50 * hash(k, 7), gy + (hash(k, 8) - 0.5) * 4); ctx.stroke(); }
      ctx.fillStyle = '#c89860'; ell(ctx, lx0 + r * 0.32, (ly0 + ly1) / 2, r * 0.32, r); ctx.fill(); ctx.strokeStyle = 'rgba(40,20,4,0.6)'; ctx.lineWidth = 2; ctx.stroke();
      for (let k = 1; k < 6; k++) { ctx.strokeStyle = `rgba(80,44,12,${0.5 - 0.06 * k})`; ctx.lineWidth = 1.3; ell(ctx, lx0 + r * 0.32, (ly0 + ly1) / 2, r * 0.32 * (1 - k / 6), r * (1 - k / 6)); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,230,180,0.18)'; ctx.fillRect(lx0 + r * 0.5, ly0 + 3, lx1 - lx0 - r * 0.7, 5);
      // beaters (ike): four-sided mallets with a narrow handle, a bowl of water, a roll of bark
      const beater = (bx, by, ang, len) => { ctx.save(); ctx.translate(bx, by); ctx.rotate(ang); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(4, 8, len, len * 0.12); ctx.fillStyle = lg(ctx, 0, -len * 0.06, 0, len * 0.08, [[0, '#d8a868'], [1, '#6a4420']]); ctx.fillRect(0, -len * 0.04, len * 0.4, len * 0.08); ctx.fillStyle = lg(ctx, 0, -len * 0.08, 0, len * 0.1, [[0, '#e0b476'], [1, '#5a3818']]); rrect(ctx, len * 0.38, -len * 0.085, len * 0.62, len * 0.17, 5); ctx.fill(); ctx.strokeStyle = 'rgba(40,20,4,0.5)'; ctx.lineWidth = 1; ctx.stroke(); for (let k = 0; k < 6; k++) line(ctx, len * (0.42 + 0.09 * k), -len * 0.08, len * (0.42 + 0.09 * k), len * 0.09, 'rgba(60,30,6,0.35)', 1); ctx.restore(); };
      beater(x + w * 0.08, y + h * 0.86, -0.12, w * 0.34); beater(x + w * 0.56, y + h * 0.9, 0.1, w * 0.3);
      const bx = x + w * 0.9, by = y + h * 0.13; ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, bx + 4, by + 6, w * 0.06, w * 0.06); ctx.fill(); ctx.fillStyle = rg(ctx, bx, by, 0, w * 0.06, [[0, '#7a4a28'], [1, '#2e1a0c']]); ell(ctx, bx, by, w * 0.06, w * 0.06); ctx.fill(); ctx.fillStyle = rg(ctx, bx, by, 0, w * 0.045, [[0, '#d8c8a0'], [1, '#8a7a54']]); ell(ctx, bx, by, w * 0.045, w * 0.045); ctx.fill();
      for (let k = 0; k < 4; k++) { ctx.save(); ctx.translate(x + w * 0.1, y + h * 0.12 + k * 4); ctx.rotate(-0.2 + 0.1 * k); ctx.fillStyle = k % 2 ? '#c8a06a' : '#b98a52'; rrect(ctx, -w * 0.07, -7, w * 0.14, 14, 7); ctx.fill(); ctx.strokeStyle = 'rgba(60,34,10,0.5)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); }
      ctx.fillStyle = '#8a5e32'; ctx.fillRect(V.ox - 4, V.oy - 4, s + 8, hh + 8);   // the damp cloth under the strips
    },
    art(ctx, x, y, w, h) {   // a rubbed and painted pattern in two browns: bands with a zigzag at top and bottom, rows of diamonds and leaves between
      ctx.save(); const dk = 'rgba(52,22,10,0.82)', rd = 'rgba(138,44,22,0.78)';
      for (const by of [y + h * 0.04, y + h * 0.84]) { ctx.fillStyle = dk; ctx.fillRect(x + w * 0.03, by, w * 0.94, h * 0.05); ctx.fillStyle = rd; ctx.beginPath(); const n = 22; ctx.moveTo(x + w * 0.03, by + h * 0.1); for (let k = 0; k <= n; k++) ctx.lineTo(x + w * (0.03 + 0.94 * k / n), by + h * (k % 2 ? 0.065 : 0.12)); ctx.lineTo(x + w * 0.97, by + h * 0.12); ctx.lineTo(x + w * 0.03, by + h * 0.12); ctx.fill(); }
      const rows = 3, cols = 6; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const cx = x + w * (0.1 + (0.8 * (i + 0.5)) / cols), cy = y + h * (0.24 + (0.52 * (j + 0.5)) / rows), r = Math.min(w / cols, h / rows) * 0.34; ctx.fillStyle = (i + j) % 2 ? dk : rd; ctx.beginPath(); if ((i + j) % 2) { ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r * 0.7, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r * 0.7, cy); } else { ctx.moveTo(cx, cy - r); ctx.quadraticCurveTo(cx + r * 0.9, cy - r * 0.2, cx, cy + r); ctx.quadraticCurveTo(cx - r * 0.9, cy - r * 0.2, cx, cy - r); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(250,226,170,0.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, cy - r * 0.6); ctx.lineTo(cx, cy + r * 0.6); ctx.stroke(); }
      ctx.strokeStyle = dk; ctx.lineWidth = 2; for (const f of [0.19, 0.8]) { ctx.beginPath(); ctx.moveTo(x + w * 0.03, y + h * f); ctx.lineTo(x + w * 0.97, y + h * f); ctx.stroke(); }
      ctx.restore();
    },
  },

  // ---- Madagascar: an easel rack in the sun with flowers laid in a screen, red hills and a bright sky ------------------------------------------------------------------------
  antaimoro: {
    asp: 1.3, fw: 0.5, fh: 0.58, cx: 0.6, cy: 0.48, tilt: false,
    layout(W) { return place(W, this); },
    back(ctx, W, V, o) {
      const { x, y, w, h } = W, s = V.s, hh = s * o.asp, cx = V.ox + s / 2;
      ctx.fillStyle = lg(ctx, 0, y, 0, y + h * 0.6, [[0, '#a8502e'], [0.55, '#e8913e'], [1, '#f8d890']]); ctx.fillRect(x, y + 0, w, h * 0.6);
      ctx.fillStyle = rg(ctx, x + w * 0.82, y + h * 0.12, 2, h * 0.18, [[0, 'rgba(255,248,200,0.95)'], [1, 'rgba(255,240,180,0)']]); ell(ctx, x + w * 0.82, y + h * 0.12, h * 0.18, h * 0.18); ctx.fill();
      for (let k = 0; k < 3; k++) { ctx.fillStyle = ['#c0603a', '#a24c24', '#7a3418'][k]; ctx.beginPath(); ctx.moveTo(x, y + h * (0.46 + 0.1 * k)); for (let q = 0; q <= 8; q++) ctx.lineTo(x + (w * q) / 8, y + h * (0.38 + 0.1 * k + 0.05 * Math.sin(q * 1.3 + k * 2))); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.fill(); }
      ctx.fillStyle = '#c8a060'; ctx.fillRect(x + w * 0.04, y + h * 0.38, w * 0.2, h * 0.12); ctx.fillStyle = '#7a5a2a'; ctx.beginPath(); ctx.moveTo(x + w * 0.02, y + h * 0.38); ctx.lineTo(x + w * 0.14, y + h * 0.26); ctx.lineTo(x + w * 0.26, y + h * 0.38); ctx.fill(); ctx.strokeStyle = 'rgba(40,24,6,0.45)'; ctx.lineWidth = 1.2; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.moveTo(x + w * (0.02 + 0.027 * k), y + h * 0.38); ctx.lineTo(x + w * (0.14 + 0.002 * (k - 4)), y + h * 0.265); ctx.stroke(); } ctx.fillStyle = '#3a2410'; ctx.fillRect(x + w * 0.12, y + h * 0.42, w * 0.045, h * 0.08);   // a thatched house on the hill
      ctx.fillStyle = lg(ctx, 0, y + h * 0.7, 0, y + h, [[0, '#7a3418'], [1, '#4a1e0c']]); ctx.fillRect(x, y + h * 0.7, w, h * 0.3);
      // the easel: two legs behind the screen, a cross-bar, the screen on a thick frame
      const gy = y + h + 4;
      for (const sg of [-1, 1]) { ctx.strokeStyle = '#3a2410'; ctx.lineWidth = s * 0.06; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx, V.oy - hh * 0.04); ctx.lineTo(cx + sg * s * 0.78, gy); ctx.stroke(); ctx.strokeStyle = '#8a5e30'; ctx.lineWidth = s * 0.045; ctx.beginPath(); ctx.moveTo(cx - 1, V.oy - hh * 0.04); ctx.lineTo(cx + sg * s * 0.78 - 1, gy); ctx.stroke(); }
      ctx.lineCap = 'butt'; wood(ctx, cx - s * 0.58, V.oy + hh * 1.0, s * 1.16, s * 0.07, '#7a5228', false, 33);
      shade(ctx, cx, gy - 6, s * 0.9, 10, 0.3);
      // baskets of petals
      const basket = (bx, by, r, cols) => { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, bx + 3, by + 6, r, r * 0.45); ctx.fill(); ctx.fillStyle = lg(ctx, bx - r, 0, bx + r, 0, [[0, '#6a4a22'], [0.4, '#c8a060'], [1, '#5a3a18']]); ell(ctx, bx, by, r, r * 0.5); ctx.fill(); for (let k = 0; k < 14; k++) { ctx.fillStyle = cols[k % cols.length]; ell(ctx, bx + (hash(k, 7) - 0.5) * r * 1.5, by - r * 0.1 + (hash(k, 8) - 0.5) * r * 0.5, r * 0.13, r * 0.09); ctx.fill(); } };
      basket(x + w * 0.14, y + h * 0.9, w * 0.09, ['#c8283a', '#f0b82a', '#d86aa0']); basket(x + w * 0.86, y + h * 0.88, w * 0.08, ['#f07a28', '#e8e0f0', '#c8283a']);
      for (let k = 0; k < 20; k++) { ctx.fillStyle = ['#c8283a', '#f0b82a', '#d86aa0', '#f07a28', '#e8e0f0'][k % 5]; ell(ctx, x + w * hash(k, 91), y + h * (0.78 + 0.2 * hash(k, 92)), 4, 2.6); ctx.fill(); }
    },
    board(ctx, W, V, o) { return false; },
  },
};

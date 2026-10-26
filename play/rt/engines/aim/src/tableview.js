// Table view for the aim engine (1.4.0): a top-down board with raised wooden rails, corner pockets with nets, a cloth with painted
// marks, coloured object discs, a shooter disc and a cue whose tip draws back and strikes. Novuss, carrom-like and finger-billiard
// games. Pure canvas, deterministic. The physics is the lane physics (lane.js); this file is the camera and the drawing.
import { mix, dark, light, alpha, vgrad, hgrad, poly, rrect, clamp, hash } from './scenery.js';

const TAU = Math.PI * 2;
const ell = (ctx, x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.4, rx), Math.max(0.4, ry), rot, 0, TAU); };

// a flat top-down camera: the board is a square, the shooter's baseline is at the bottom
export function makeTableLayout(P, area) {
  const bar = 40, size = P.lane.width, rail = P.table.rail;
  const availH = area.h - bar - 8, availW = area.w * 0.96;
  const outer = Math.min(availW, availH * 0.98);
  const k = outer / (size + 2 * rail);                      // pixels per world unit
  const cx = area.x + area.w / 2, top = area.y + (availH - outer) / 2 + 4;
  const fieldBottom = top + outer - rail * k;               // screen y of world y = 0
  const sy = (y) => fieldBottom - y * k;
  const tr = (x, y, z = 0) => ({ x: cx + x * k, y: sy(y) - z * k * 0.8, s: k });
  const inv = (px, py) => ({ x: (px - cx) / k, y: (fieldBottom - py) / k });
  return { area, bar, k, cx, top, outer, size, rail, fieldBottom, hy: top, yBottom: fieldBottom, sy, sc: () => k, fs: () => 1, tr, inv, d2w: (dx, dy) => ({ x: dx, y: -dy }), w2d: (x, y) => ({ x, y: -y }), nearY: 0, back: 0 };
}

// 1.6.0 finished room: oak planks, a patterned rug under the board, a panelled wall with a window and frames, stools, a warm pendant light
export function fancyRoom(ctx, area, LK, L) {
  const s = LK.surround ?? '#241812', oak = LK.floor ?? '#8a5a34', rug = LK.rug ?? '#7a2a2a', trim = LK.rugTrim ?? '#e8d6a8';
  const x0 = area.x, W = area.w, y0 = area.y, H = area.h;
  // planks (vertical, varied tone)
  const pw = Math.max(26, W / 14);
  for (let i = 0, x = x0; x < x0 + W; i++, x += pw) { ctx.fillStyle = mix(oak, hash(i * 7) > 0.5 ? '#ffffff' : '#000000', 0.04 + 0.08 * hash(i)); ctx.fillRect(x, y0, pw + 1, H); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x, y0, 1.5, H); }
  for (let i = 0; i < 70; i++) { const x = x0 + hash(i * 3.3) * W, y = y0 + hash(i * 5.1) * H; ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (hash(i) - 0.5) * 6, y + 20 + hash(i + 2) * 40); ctx.stroke(); }
  // rug under the board
  const m = L.rail * L.k * 1.9 + 22, wideRoom = W > L.outer * 1.5, rw = wideRoom ? Math.min(W * 0.94, L.outer * 2.3) : L.outer + 2 * m, rx = L.cx - rw / 2, ry = L.top - m, rh = L.outer + 2 * m;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, rx + 6, ry + 10, rw, rh, 16); ctx.fill();
  ctx.fillStyle = rug; rrect(ctx, rx, ry, rw, rh, 14); ctx.fill();
  ctx.fillStyle = hgrad(ctx, rx, rx + rw, [[0, 'rgba(255,255,255,0.08)'], [1, 'rgba(0,0,0,0.18)']]); rrect(ctx, rx, ry, rw, rh, 14); ctx.fill();
  ctx.strokeStyle = trim; ctx.lineWidth = 3; rrect(ctx, rx + 9, ry + 9, rw - 18, rh - 18, 9); ctx.stroke();
  ctx.lineWidth = 1.5; rrect(ctx, rx + 17, ry + 17, rw - 34, rh - 34, 6); ctx.stroke();
  ctx.fillStyle = alpha(trim, 0.8);
  for (let t = 0; t < 2 * (rw + rh) / 26; t++) { const d = t * 26 + 13; let px, py; if (d < rw) { px = rx + d; py = ry + 13; } else if (d < rw + rh) { px = rx + rw - 13; py = ry + d - rw; } else if (d < 2 * rw + rh) { px = rx + rw - (d - rw - rh); py = ry + rh - 13; } else { px = rx + 13; py = ry + rh - (d - 2 * rw - rh); } poly(ctx, [[px, py - 5], [px + 5, py], [px, py + 5], [px - 5, py]]); ctx.fill(); }
  ctx.fillStyle = alpha(trim, 0.6); for (let t = 0; t < rw / 8; t++) { ctx.fillRect(rx + t * 8 + 2, ry - 6, 3, 6); ctx.fillRect(rx + t * 8 + 2, ry + rh, 3, 6); }
  // wall at the top with a window and frames
  const wh = Math.max(0, Math.min(L.top - y0 - 70, H * 0.2));
  if (wh > 40) {
    ctx.fillStyle = vgrad(ctx, y0, y0 + wh, [[0, dark(s, 0.1)], [1, mix(s, '#6a4a2a', 0.5)]]); ctx.fillRect(x0, y0, W, wh);
    for (let x = x0; x < x0 + W; x += wh * 0.34) { ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x, y0, 2, wh); ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(x + 2, y0, 2, wh); }
    ctx.fillStyle = '#c8a46a'; ctx.fillRect(x0, y0 + wh - 5, W, 5); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x0, y0 + wh, W, 6);
    const wx = x0 + W * 0.62, ww = Math.min(W * 0.26, wh * 1.4), wy = y0 + wh * 0.14, wH = wh * 0.64;
    ctx.fillStyle = '#2a1a10'; ctx.fillRect(wx - 5, wy - 5, ww + 10, wH + 10); ctx.fillStyle = vgrad(ctx, wy, wy + wH, [[0, '#3a4a78'], [1, '#e8a86a']]); ctx.fillRect(wx, wy, ww, wH);
    ctx.fillStyle = '#2a1a10'; ctx.fillRect(wx + ww / 2 - 2, wy, 4, wH); ctx.fillRect(wx, wy + wH / 2 - 2, ww, 4);
    for (const [fx, fw, col] of [[0.08, 0.14, '#c8a46a'], [0.27, 0.12, '#6a8a9a']]) { const bx = x0 + W * fx, bw = Math.min(W * fw, wh * 0.9); ctx.fillStyle = '#c8a46a'; ctx.fillRect(bx, wy + 4, bw, wH - 8); ctx.fillStyle = dark(col, 0.2); ctx.fillRect(bx + 4, wy + 8, bw - 8, wH - 16); ctx.fillStyle = alpha('#ffffff', 0.25); ctx.beginPath(); ctx.arc(bx + bw * 0.5, wy + wH * 0.5, bw * 0.18, 0, TAU); ctx.fill(); }
  }
  // stools at the lower corners
  const sy2 = L.top + L.outer + m + 40;
  if (sy2 < y0 + H - 70) for (const sx2 of [L.cx - L.outer * 0.42, L.cx + L.outer * 0.42]) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ell(ctx, sx2 + 5, sy2 + 8, 34, 30); ctx.fill(); const g = ctx.createRadialGradient(sx2 - 8, sy2 - 8, 4, sx2, sy2, 34); g.addColorStop(0, '#9a3a2a'); g.addColorStop(1, '#4a1a12'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx2, sy2, 32, 0, TAU); ctx.fill(); ctx.strokeStyle = '#c8a46a'; ctx.lineWidth = 3; ctx.stroke(); }
  if (wideRoom) {
    // landscape: a round side table with a glass and a lamp on each side of the rug, and an armchair
    for (const sgn of [-1, 1]) {
      const tx = L.cx + sgn * (rw / 2 + (W - rw) / 4), ty = L.top + L.outer * 0.28;
      if (Math.abs(tx - L.cx) < W / 2 - 24) {
        ctx.fillStyle = 'rgba(0,0,0,0.38)'; ell(ctx, tx + 5, ty + 9, 34, 30); ctx.fill();
        const g = ctx.createRadialGradient(tx - 8, ty - 8, 3, tx, ty, 34); g.addColorStop(0, '#b98a50'); g.addColorStop(1, '#6a4422'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(tx, ty, 32, 0, TAU); ctx.fill(); ctx.strokeStyle = '#d6aa6a'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(tx - 8, ty + 4, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8a63a'; ctx.beginPath(); ctx.arc(tx - 8, ty + 4, 6, 0, TAU); ctx.fill();
        const lg2 = ctx.createRadialGradient(tx + 10, ty - 10, 1, tx + 10, ty - 10, 70); lg2.addColorStop(0, 'rgba(255,214,150,0.4)'); lg2.addColorStop(1, 'rgba(255,214,150,0)'); ctx.fillStyle = lg2; ctx.fillRect(tx - 70, ty - 80, 140, 140);
        ctx.fillStyle = '#f4e6b8'; poly(ctx, [[tx + 3, ty - 4], [tx + 17, ty - 4], [tx + 14, ty - 20], [tx + 6, ty - 20]]); ctx.fill();
        const ay = L.top + L.outer * 0.74; ctx.fillStyle = 'rgba(0,0,0,0.38)'; rrect(ctx, tx - 38, ay - 24, 80, 66, 18); ctx.fill(); ctx.fillStyle = vgrad(ctx, ay - 30, ay + 34, [[0, '#9a3a2a'], [1, '#5a1e14']]); rrect(ctx, tx - 42, ay - 30, 80, 64, 18); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.15)'; rrect(ctx, tx - 34, ay - 24, 64, 20, 10); ctx.fill();
      }
    }
  }
  // warm pendant light pool and vignette
  const cy = L.top + L.outer * 0.5, lg = ctx.createRadialGradient(L.cx, cy, L.outer * 0.2, L.cx, cy, Math.max(W, H) * 0.7); lg.addColorStop(0, 'rgba(255,214,150,0.22)'); lg.addColorStop(0.5, 'rgba(255,190,110,0.06)'); lg.addColorStop(1, 'rgba(10,6,4,0.5)');
  ctx.fillStyle = lg; ctx.fillRect(x0, y0, W, H);
}

function drawRoom(ctx, area, LK, L, t) {
  const g = ctx.createRadialGradient(L.cx, L.top + L.outer * 0.5, L.outer * 0.2, L.cx, L.top + L.outer * 0.5, Math.max(area.w, area.h) * 0.8);
  const s = LK.surround ?? '#1d2a22';
  g.addColorStop(0, light(s, 0.18)); g.addColorStop(1, dark(s, 0.45));
  ctx.fillStyle = g; ctx.fillRect(area.x, area.y, area.w, area.h);
  // floor boards
  ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = area.x - ((area.y * 0) % 60); x < area.x + area.w; x += 46) { ctx.moveTo(x, area.y); ctx.lineTo(x, area.y + area.h); }
  ctx.stroke();
  void t;
}

function woodGrain(ctx, x, y, w, h, base, seed, vertical) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.strokeStyle = alpha(dark(base, 0.5), 0.35); ctx.lineWidth = 1;
  const n = Math.round((vertical ? w : h) / 3);
  for (let i = 0; i < n; i++) {
    const o = (i + hash(seed + i) * 0.7) * 3, wob = hash(seed + i * 3) * 6;
    ctx.beginPath();
    if (vertical) { ctx.moveTo(x + o, y); ctx.bezierCurveTo(x + o + wob, y + h * 0.33, x + o - wob, y + h * 0.66, x + o, y + h); }
    else { ctx.moveTo(x, y + o); ctx.bezierCurveTo(x + w * 0.33, y + o + wob, x + w * 0.66, y + o - wob, x + w, y + o); }
    ctx.stroke();
  }
  ctx.restore();
}

export function drawBoard(ctx, L, T, LK, hw, len, pocketR) {
  const { k, cx, top, outer, rail } = L, left = cx - outer / 2, wood = T.wood, cloth = T.cloth;
  const fx0 = left + rail * k, fy0 = top + rail * k, fw = outer - 2 * rail * k;
  // drop shadow and the frame
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, left + 6, top + 10, outer, outer, 16); ctx.fill();
  const fg = ctx.createLinearGradient(left, top, left + outer, top + outer); fg.addColorStop(0, light(wood, 0.28)); fg.addColorStop(0.5, wood); fg.addColorStop(1, dark(wood, 0.45));
  ctx.fillStyle = fg; rrect(ctx, left, top, outer, outer, 14); ctx.fill();
  woodGrain(ctx, left, top, outer, rail * k, wood, 3, false); woodGrain(ctx, left, top + outer - rail * k, outer, rail * k, wood, 9, false);
  woodGrain(ctx, left, top, rail * k, outer, wood, 15, true); woodGrain(ctx, left + outer - rail * k, top, rail * k, outer, wood, 21, true);
  // bevel: lit top-left edges, dark bottom-right
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(left + 14, top + 1); ctx.lineTo(left + outer - 14, top + 1); ctx.moveTo(left + 1, top + 14); ctx.lineTo(left + 1, top + outer - 14); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.moveTo(left + 14, top + outer - 1); ctx.lineTo(left + outer - 14, top + outer - 1); ctx.moveTo(left + outer - 1, top + 14); ctx.lineTo(left + outer - 1, top + outer - 14); ctx.stroke();
  // inner raised lip (cushion) then the cloth
  const lip = Math.max(5, rail * k * 0.28);
  ctx.fillStyle = dark(wood, 0.55); rrect(ctx, fx0 - lip, fy0 - lip, fw + lip * 2, fw + lip * 2, 6); ctx.fill();
  ctx.fillStyle = hgrad(ctx, fx0 - lip, fx0, [[0, light(wood, 0.1)], [1, dark(wood, 0.3)]]); ctx.fillRect(fx0 - lip, fy0, lip, fw);
  ctx.fillStyle = vgrad(ctx, fy0 - lip, fy0, [[0, light(wood, 0.1)], [1, dark(wood, 0.3)]]); ctx.fillRect(fx0, fy0 - lip, fw, lip);
  const cg = ctx.createRadialGradient(cx, fy0 + fw * 0.45, fw * 0.1, cx, fy0 + fw * 0.5, fw * 0.85); cg.addColorStop(0, light(cloth, 0.16)); cg.addColorStop(1, dark(cloth, 0.3));
  ctx.fillStyle = cg; ctx.fillRect(fx0, fy0, fw, fw);
  // cloth weave
  ctx.save(); ctx.beginPath(); ctx.rect(fx0, fy0, fw, fw); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.045)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let i = 0; i < fw; i += 4) { ctx.moveTo(fx0 + i, fy0); ctx.lineTo(fx0 + i, fy0 + fw); ctx.moveTo(fx0, fy0 + i); ctx.lineTo(fx0 + fw, fy0 + i); }
  ctx.stroke();
  // painted marks: diagonals into the pockets, a centre circle, the baseline with its ticks
  if (T.marks) {
    const ml = alpha(T.line, 0.55);
    ctx.strokeStyle = ml; ctx.lineWidth = Math.max(1.5, k * 0.018);
    ctx.beginPath(); ctx.moveTo(fx0, fy0); ctx.lineTo(fx0 + fw * 0.22, fy0 + fw * 0.22); ctx.moveTo(fx0 + fw, fy0); ctx.lineTo(fx0 + fw * 0.78, fy0 + fw * 0.22); ctx.moveTo(fx0, fy0 + fw); ctx.lineTo(fx0 + fw * 0.22, fy0 + fw * 0.78); ctx.moveTo(fx0 + fw, fy0 + fw); ctx.lineTo(fx0 + fw * 0.78, fy0 + fw * 0.78); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, fy0 + fw / 2, fw * 0.17, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, fy0 + fw / 2, fw * 0.035, 0, TAU); ctx.fillStyle = ml; ctx.fill();
    const by = L.sy(T.baseline);
    ctx.beginPath(); ctx.moveTo(fx0 + fw * 0.12, by); ctx.lineTo(fx0 + fw * 0.88, by); ctx.stroke();
    for (let i = 0; i <= 8; i++) { const x = fx0 + fw * (0.12 + (0.76 * i) / 8); ctx.beginPath(); ctx.moveTo(x, by - 4); ctx.lineTo(x, by + 4); ctx.stroke(); }
  }
  ctx.restore();
  // corner pockets: a brass ring, a dark netted hole
  for (const [px, py] of [[-hw, 0], [hw, 0], [-hw, len], [hw, len]]) {
    const c = L.tr(px, py), r = pocketR * k;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.arc(c.x + 1, c.y + 2, r * 1.28, 0, TAU); ctx.fill();
    const bg = ctx.createLinearGradient(c.x - r, c.y - r, c.x + r, c.y + r); bg.addColorStop(0, '#f2d58a'); bg.addColorStop(0.5, '#b98a3a'); bg.addColorStop(1, '#6a4a1c');
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(c.x, c.y, r * 1.2, 0, TAU); ctx.fill();
    const hg = ctx.createRadialGradient(c.x - r * 0.2, c.y - r * 0.2, r * 0.1, c.x, c.y, r); hg.addColorStop(0, '#1a1410'); hg.addColorStop(1, '#000000');
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(210,190,140,0.35)'; ctx.lineWidth = 1;
    ctx.save(); ctx.beginPath(); ctx.arc(c.x, c.y, r * 0.98, 0, TAU); ctx.clip();
    for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(c.x + i * r * 0.28 - r, c.y - r); ctx.lineTo(c.x + i * r * 0.28 + r, c.y + r); ctx.moveTo(c.x + i * r * 0.28 + r, c.y - r); ctx.lineTo(c.x + i * r * 0.28 - r, c.y + r); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, TAU); ctx.stroke();
  }
  void LK;
}

// a flat disc seen from above: soft shadow, a lit rim, a groove and a printed centre
export function drawDisc(ctx, c, r, col, o = {}) {
  const lift = (o.lift ?? 0) * r;
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.arc(c.x + r * 0.18 + lift * 0.5, c.y + r * 0.26 + lift, r * 1.02, 0, TAU); ctx.fill();
  const rim = ctx.createLinearGradient(c.x - r, c.y - r, c.x + r, c.y + r); rim.addColorStop(0, light(col, 0.5)); rim.addColorStop(0.5, col); rim.addColorStop(1, dark(col, 0.55));
  ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(c.x, c.y - lift * 0.4, r, 0, TAU); ctx.fill();
  const cy = c.y - lift * 0.4;
  const fg = ctx.createRadialGradient(c.x - r * 0.3, cy - r * 0.35, r * 0.05, c.x, cy, r * 0.82); fg.addColorStop(0, light(col, 0.35)); fg.addColorStop(1, dark(col, 0.18));
  ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(c.x, cy, r * 0.82, 0, TAU); ctx.fill();
  ctx.strokeStyle = alpha(dark(col, 0.55), 0.7); ctx.lineWidth = Math.max(1, r * 0.07); ctx.beginPath(); ctx.arc(c.x, cy, r * 0.58, 0, TAU); ctx.stroke();
  if (o.mark) { ctx.fillStyle = alpha(dark(col, 0.6), 0.55); ctx.beginPath(); ctx.arc(c.x, cy, r * 0.2, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ell(ctx, c.x - r * 0.38, cy - r * 0.44, r * 0.24, r * 0.12, -0.7); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(c.x, cy, r, 0, TAU); ctx.stroke();
}

// the cue: a tapered shaft with a ferrule, a chalked tip and a leather wrap, pointing from the back toward the disc.
// (tipX, tipY) is the tip; ang is the screen direction the cue points; length in px
export function drawCue(ctx, tipX, tipY, ang, len, thick, o = {}) {
  const dx = Math.cos(ang), dy = Math.sin(ang), bx = tipX - dx * len, by = tipY - dy * len, nx = -dy, ny = dx;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  poly(ctx, [[tipX + nx * thick * 0.25 + 4, tipY + ny * thick * 0.25 + 6], [bx + nx * thick * 0.7 + 4, by + ny * thick * 0.7 + 6], [bx - nx * thick * 0.7 + 4, by - ny * thick * 0.7 + 6], [tipX - nx * thick * 0.25 + 4, tipY - ny * thick * 0.25 + 6]]); ctx.fill();
  const seg = (t0, t1, w0, w1, c0, c1) => {
    const a = { x: tipX - dx * len * t0, y: tipY - dy * len * t0 }, b = { x: tipX - dx * len * t1, y: tipY - dy * len * t1 };
    const gx = ctx.createLinearGradient(a.x + nx * w1, a.y + ny * w1, a.x - nx * w1, a.y - ny * w1); gx.addColorStop(0, c0); gx.addColorStop(0.45, c1); gx.addColorStop(1, dark(c1, 0.5));
    ctx.fillStyle = gx; poly(ctx, [[a.x + nx * w0 / 2, a.y + ny * w0 / 2], [b.x + nx * w1 / 2, b.y + ny * w1 / 2], [b.x - nx * w1 / 2, b.y - ny * w1 / 2], [a.x - nx * w0 / 2, a.y - ny * w0 / 2]]); ctx.fill();
  };
  const wood = o.wood ?? '#d8b072';
  seg(0.02, 0.62, thick * 0.5, thick * 0.78, light(wood, 0.4), wood);
  seg(0.62, 1, thick * 0.78, thick * 1.1, light(o.butt ?? '#3a2418', 0.3), o.butt ?? '#3a2418');
  seg(0.5, 0.58, thick * 0.74, thick * 0.78, '#f4f0e4', '#e2dccb');
  seg(0.08, 0.1, thick * 0.55, thick * 0.55, '#d8d8d8', '#b8b8b8');
  seg(0.0, 0.02, thick * 0.46, thick * 0.5, '#6aa0d8', '#3a6ab0');
  ctx.restore();
}

// a bridge hand resting on the cloth just behind the tip
export function drawBridge(ctx, x, y, ang, size, skin) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, size * 0.15, size * 0.5, size * 0.95, size * 0.45); ctx.fill();
  const g = ctx.createLinearGradient(0, -size, 0, size); g.addColorStop(0, light(skin, 0.18)); g.addColorStop(1, dark(skin, 0.3));
  ctx.fillStyle = g; ell(ctx, 0, 0, size * 0.9, size * 0.5); ctx.fill();
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.ellipse(size * 0.85, i * size * 0.3, size * 0.45, size * 0.14, i * 0.12, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(70,35,15,0.35)'; ctx.lineWidth = 0.8; ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(size * 0.1, -size * 0.5, size * 0.5, size * 0.17, -0.5, 0, TAU); ctx.fill();
  ctx.restore();
}

// the whole table scene. S = the live state handed over by the lane module
export function drawTable(ctx, g, S) {
  const { P, L, LK, T, w, area, aim, flying, clock, meter, swing, drops, host, ph, DEAD, MAXPULL, hw, len } = S;
  if (LK.finish) { const lay = S.roomCache?.(ctx, area, (c2) => fancyRoom(c2, area, LK, L), `${L.k}`); if (lay) ctx.drawImage(lay, area.x - 20, area.y, area.w + 40, area.h); else fancyRoom(ctx, area, LK, L); } else drawRoom(ctx, area, LK, L, clock);
  drawBoard(ctx, L, T, LK, hw, len, T.pocketR);
  // a wooden tray above the board collects the discs that have been pocketed
  const trayH = Math.min(54, L.top - area.y - 16), discsAll = w.bodies.filter((b) => b.kind === 'disc');
  if (trayH >= 30 && discsAll.length) {
    const n = discsAll.length, tw = Math.min(L.outer, n * trayH * 0.92 + 24), tx = L.cx - tw / 2, ty = L.top - trayH - 12;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, tx + 3, ty + 5, tw, trayH, 12); ctx.fill();
    ctx.fillStyle = vgrad(ctx, ty, ty + trayH, [[0, light(T.wood, 0.2)], [1, dark(T.wood, 0.4)]]); rrect(ctx, tx, ty, tw, trayH, 12); ctx.fill();
    ctx.fillStyle = dark(T.wood, 0.6); rrect(ctx, tx + 5, ty + 5, tw - 10, trayH - 10, 9); ctx.fill();
    const sunk = discsAll.filter((b) => b.st === 'sunk').sort((a, b) => a.id - b.id), step = (tw - 24) / n, rr = Math.min(step * 0.42, trayH * 0.36);
    for (let i = 0; i < n; i++) {
      const cx2 = tx + 12 + step * (i + 0.5), cy2 = ty + trayH / 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx2, cy2, rr, 0, TAU); ctx.stroke();
      if (sunk[i]) drawDisc(ctx, { x: cx2, y: cy2 }, rr, sunk[i].color ?? '#e8dcc4', { mark: true });
    }
  }
  const PR = P.projectile, k = L.k;
  // discs falling into pockets
  for (const d of drops) {
    const q = clamp(d.t / 0.3, 0, 1), c = L.tr(d.x + (d.px - d.x) * q, d.y + (d.py - d.y) * q);
    ctx.globalAlpha = 1 - q * 0.8; drawDisc(ctx, c, d.r * k * (1 - 0.55 * q), d.color); ctx.globalAlpha = 1;
  }
  // resting and moving pieces: object discs first, then the shooter
  const live = w.bodies.filter((b) => b.st !== 'out' && b.st !== 'sunk');
  for (const b of live) if (b.kind === 'disc') drawDisc(ctx, L.tr(b.x, b.y), b.r * k, b.color ?? '#e8dcc4', { mark: true });
  const sxNow = aim ? aim.sx : P.lane.start.x, sp = L.tr(sxNow, P.lane.start.y);
  // the baseline ring where the shooter will start
  if (host.canThrow() && flying === null) {
    ctx.strokeStyle = alpha(LK.guide, 0.5 + 0.3 * Math.sin(clock * 3)); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sp.x, sp.y, PR.r * k * 1.5, 0, TAU); ctx.stroke();
  }
  for (const b of live) if (b.kind === 'proj') drawDisc(ctx, L.tr(b.x, b.y), b.r * k, PR.color, { lift: (b.z ?? 0) * 0.3 });
  if (flying === null && host.canThrow()) drawDisc(ctx, sp, PR.r * k, PR.color, { lift: 0.05 + 0.03 * Math.sin(clock * 3) });
  // aim guide: the shooter's path including what it hits
  const guide = (dirw, power, sx) => {
    const a = L.tr(sx, P.lane.start.y);
    if (P.guide === 'full') {
      const gw = ph.clone(w); gw.trail = [];
      for (const b of gw.bodies) if (b.kind === 'proj') b.st = 'out';
      ph.launch(gw, sx, dirw.x, dirw.y, power);
      ph.settle(gw, 4);
      const tl = gw.trail;
      for (let i = 0; i < tl.length; i += 5) { const q = L.tr(tl[i].x, tl[i].y), kk = i / tl.length; ctx.fillStyle = alpha(LK.guide, 0.95 - kk * 0.6); ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(1.8, k * 0.03), 0, TAU); ctx.fill(); }
    } else {
      const d = P.range.min + power * (P.range.max - P.range.min), far = L.tr(sx + dirw.x * d, P.lane.start.y + dirw.y * d);
      ctx.strokeStyle = LK.guide; ctx.lineWidth = 3; ctx.setLineDash([3, 9]); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(far.x, far.y); ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'butt';
    }
  };
  let dir = { x: 0, y: 1 }, pw = 0, aimOn = false;
  if (aim && host.canThrow()) {
    aimOn = true;
    if (aim.ai) { dir = aim.dir; pw = aim.power; }
    else {
      const dd = L.d2w(aim.ax - aim.cx, aim.ay - aim.cy), pull = Math.hypot(aim.ax - aim.cx, aim.ay - aim.cy);
      if (pull > DEAD && dd.y > 0) { const n = Math.hypot(dd.x, dd.y); dir = { x: dd.x / n, y: dd.y / n }; pw = clamp((pull - DEAD) / (MAXPULL - DEAD), 0, 1); }
      else { aimOn = false; }
    }
    if (aimOn && pw > 0.02) guide(dir, pw, aim.sx);
  } else if (P.controls === 'meter' && flying === null && host.canThrow()) {
    dir = { x: Math.sin(meter.angle), y: Math.cos(meter.angle) }; pw = meter.stage === 1 ? meter.power : 0.4; aimOn = true; guide(dir, pw, P.lane.start.x);
  }
  // the cue: behind the shooter along the aim, drawn back with the pull, thrusting through on release
  if (T.cue) {
    const sx2 = aimOn ? (aim?.sx ?? P.lane.start.x) : P.lane.start.x, c0 = L.tr(sx2, P.lane.start.y);
    const sd = L.w2d(dir.x, dir.y), ang = Math.atan2(sd.y, sd.x);           // screen direction the cue points
    const g0 = PR.r * k * 1.2, ease = (u) => 1 - (1 - u) * (1 - u);
    let off;
    if (swing.t < 0.08) off = (g0 + -swing.from * k * 0.9) * (1 - swing.t / 0.08) + g0 * 0.1 * (swing.t / 0.08);
    else if (swing.t < 0.4) off = g0 * 0.1 + (g0 + k * 0.35 - g0 * 0.1) * ease((swing.t - 0.08) / 0.32);
    else off = g0 + (aimOn ? pw * k * 0.9 : flying !== null || !host.canThrow() ? k * 0.35 : 0);
    const tipX = c0.x - Math.cos(ang) * off, tipY = c0.y - Math.sin(ang) * off, cl = outerLen(L);
    { drawCue(ctx, tipX, tipY, ang, cl, k * 0.22, { wood: LK.cue ?? '#d8b072', butt: LK.cueButt }); drawBridge(ctx, tipX - Math.cos(ang) * k * 0.42 + Math.cos(ang + Math.PI / 2) * k * 0.3, tipY - Math.sin(ang) * k * 0.42 + Math.sin(ang + Math.PI / 2) * k * 0.3, ang, k * 0.2, LK.skin ?? '#d6a077'); }
    swing.v = aimOn ? -pw : 0;
  }
  // power ring on the shooter
  if (aimOn && host.canThrow()) {
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(sp.x, sp.y, PR.r * k * 2.2, 0, TAU); ctx.stroke();
    ctx.strokeStyle = pw > 0.85 ? '#ff7a4a' : LK.guide; ctx.beginPath(); ctx.arc(sp.x, sp.y, PR.r * k * 2.2, -Math.PI / 2, -Math.PI / 2 + TAU * pw); ctx.stroke();
  }
}
const outerLen = (L) => L.outer * 0.75;

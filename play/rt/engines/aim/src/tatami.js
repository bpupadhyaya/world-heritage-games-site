// Daruma otoshi room: a tatami floor, a tokonoma alcove with a hanging scroll, sliding doors, an andon lantern, a lacquered
// stand on a cushion, lacquered pieces with gold rims and a small wooden mallet held by a kimono sleeve.
import { mix, dark, light, vgrad, hgrad, poly, rrect, clamp, hash } from './scenery.js';
const TAU = Math.PI * 2;
const ell = (ctx, x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rot, 0, TAU); };

export function isTatami(P, title) { return P.mode === 'balance' && (/daruma|otoshi/i.test(`${title ?? ''}`) || P.scene === 'tatami'); }

export function drawRoom(ctx, c) {
  const { A, hy, bottom, cx, baseY, t } = c;
  // wall: warm plaster with a dark wood beam above and a tokonoma alcove (left) and shoji (right)
  ctx.fillStyle = vgrad(ctx, A.y, hy, [[0, '#3a2c24'], [0.12, '#c9b48c'], [1, '#b39a6e']]); ctx.fillRect(A.x - 10, A.y, A.w + 20, hy - A.y);
  ctx.fillStyle = '#2b1c12'; ctx.fillRect(A.x - 10, A.y, A.w + 20, (hy - A.y) * 0.1);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(A.x - 10, A.y + (hy - A.y) * 0.1, A.w + 20, 2);
  const ah = (hy - A.y) * 0.72, ay = hy - ah - (hy - A.y) * 0.05, aw = A.w * 0.34, ax = A.x + A.w * 0.06;
  ctx.fillStyle = vgrad(ctx, ay, ay + ah, [[0, '#6a5438'], [1, '#8a7048']]); ctx.fillRect(ax, ay, aw, ah);
  ctx.fillStyle = '#3a2412'; ctx.fillRect(ax - 7, ay - 7, aw + 14, 7); ctx.fillRect(ax - 7, ay, 7, ah + 6); ctx.fillRect(ax + aw, ay, 7, ah + 6);
  ctx.fillStyle = '#4a3018'; ctx.fillRect(ax, ay + ah - 8, aw, 8);              // raised floor board
  // hanging scroll: brushed mountains on silk
  const sx0 = ax + aw * 0.22, sw = aw * 0.34, sh = ah * 0.68;
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(sx0 - 3, ay + 4, sw + 6, sh + 6);
  ctx.fillStyle = '#e9ddb8'; ctx.fillRect(sx0, ay + 8, sw, sh - 4);
  ctx.fillStyle = 'rgba(40,40,50,0.75)'; poly(ctx, [[sx0, ay + sh], [sx0 + sw * 0.3, ay + sh * 0.5], [sx0 + sw * 0.5, ay + sh * 0.75], [sx0 + sw * 0.75, ay + sh * 0.4], [sx0 + sw, ay + sh]]); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ell(ctx, sx0 + sw * 0.5, ay + sh * 0.42, sw * 0.4, sh * 0.05); ctx.fill();
  ctx.fillStyle = '#b8322a'; ctx.fillRect(sx0 + sw * 0.78, ay + sh * 0.12, 6, 6);
  // flower vase with a bare branch
  const vx = ax + aw * 0.78, vy = ay + ah - 8;
  ctx.fillStyle = hgrad(ctx, vx - 9, vx + 9, [[0, '#2f6a78'], [0.5, '#6aa6b0'], [1, '#1f4650']]); poly(ctx, [[vx - 5, vy - 26], [vx + 5, vy - 26], [vx + 10, vy], [vx - 10, vy]]); ctx.fill();
  ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(vx, vy - 26); ctx.quadraticCurveTo(vx + 14, vy - 50, vx + 28, vy - 62); ctx.moveTo(vx + 12, vy - 46); ctx.lineTo(vx + 4, vy - 62); ctx.stroke();
  ctx.fillStyle = '#f2a5b8'; for (const [dx, dy] of [[28, -62], [4, -62], [18, -54], [22, -70]]) { ctx.beginPath(); ctx.arc(vx + dx, vy + dy, 3.5, 0, TAU); ctx.fill(); }
  // sliding paper doors on the right, a lattice and a soft glow
  const dx0 = A.x + A.w * 0.5, dw = A.w * 0.5 + 10, dh = (hy - A.y) * 0.88, dy0 = hy - dh;
  const glow = ctx.createLinearGradient(dx0, 0, dx0 + dw, 0); glow.addColorStop(0, '#f6ecd0'); glow.addColorStop(1, '#fff8e0');
  ctx.fillStyle = glow; ctx.fillRect(dx0, dy0, dw, dh);
  ctx.strokeStyle = '#2f1e10'; ctx.lineWidth = 3; ctx.strokeRect(dx0, dy0, dw, dh);
  ctx.lineWidth = 2; ctx.beginPath(); const cols = 4, rows = 4;
  for (let i = 1; i < cols; i++) { ctx.moveTo(dx0 + dw * i / cols, dy0); ctx.lineTo(dx0 + dw * i / cols, hy); }
  for (let j = 1; j < rows; j++) { ctx.moveTo(dx0, dy0 + dh * j / rows); ctx.lineTo(dx0 + dw, dy0 + dh * j / rows); } ctx.stroke();
  ctx.fillStyle = 'rgba(60,90,50,0.35)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(dx0 + dw * (0.2 + i * 0.3), dy0 + dh * 0.5 + Math.sin(t * 0.7 + i) * 4, 22, 5, 0.5, 0, TAU); ctx.fill(); }   // bamboo shadow
  // andon lantern on the floor, right
  const lx = A.x + A.w * 0.9, ly = hy + (bottom - hy) * 0.14;
  const lg = ctx.createRadialGradient(lx, ly - 24, 4, lx, ly - 24, A.w * 0.4); lg.addColorStop(0, 'rgba(255,200,110,0.4)'); lg.addColorStop(1, 'rgba(255,200,110,0)');
  // tatami floor: mats with dark cloth borders in perspective
  const fh = bottom + 40 - hy;
  ctx.fillStyle = vgrad(ctx, hy, bottom + 40, [[0, '#a8a060'], [0.4, '#b9b068'], [1, '#7c7440']]); ctx.fillRect(A.x - 10, hy, A.w + 20, fh);
  const vp = cx;
  const row = (u0, u1, k) => {
    const y0 = hy + fh * u0, y1 = hy + fh * u1;
    const wdiv = (A.w * 0.5) * 0.9 * (k % 2 ? 1.0 : 1.0);
    ctx.fillStyle = k % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'; ctx.fillRect(A.x - 10, y0, A.w + 20, y1 - y0);
    ctx.strokeStyle = 'rgba(40,50,30,0.8)'; ctx.lineWidth = 2 + u1 * 4;
    ctx.beginPath(); ctx.moveTo(A.x - 10, y1); ctx.lineTo(A.x + A.w + 10, y1); ctx.stroke();
    // rush weave: fine lines along the mat
    ctx.strokeStyle = 'rgba(90,80,30,0.18)'; ctx.lineWidth = 1;
    ctx.beginPath(); for (let i = 1; i < 6; i++) { const y = y0 + (y1 - y0) * i / 6; ctx.moveTo(A.x - 10, y); ctx.lineTo(A.x + A.w + 10, y); } ctx.stroke();
    void wdiv;
    // vertical joints between mats converge to the vanishing point
    ctx.strokeStyle = 'rgba(40,50,30,0.8)'; ctx.lineWidth = 2 + u1 * 3;
    const off = (k % 2) * 0.5;
    ctx.beginPath();
    for (let j = -3; j <= 3; j++) { const f0 = (j + off) * 0.38, xa = vp + f0 * A.w * (0.3 + u0 * 1.0), xb = vp + f0 * A.w * (0.3 + u1 * 1.0); ctx.moveTo(xa, y0); ctx.lineTo(xb, y1); }
    ctx.stroke();
  };
  const us = [0, 0.1, 0.24, 0.42, 0.66, 1];
  for (let k = 0; k < us.length - 1; k++) row(us[k], us[k + 1], k);
  // lantern drawn after floor
  ctx.fillStyle = lg; ctx.fillRect(lx - A.w * 0.4, ly - 24 - A.w * 0.4, A.w * 0.8, A.w * 0.8);
  ctx.fillStyle = '#2b1c12'; ctx.fillRect(lx - 14, ly - 4, 28, 5);
  ctx.fillStyle = '#ffe3a0'; rrect(ctx, lx - 12, ly - 44, 24, 40, 3); ctx.fill();
  ctx.strokeStyle = '#2b1c12'; ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.moveTo(lx - 12, ly - 24); ctx.lineTo(lx + 12, ly - 24); ctx.moveTo(lx, ly - 44); ctx.lineTo(lx, ly - 4); ctx.stroke();
  ctx.fillStyle = '#2b1c12'; poly(ctx, [[lx - 16, ly - 44], [lx + 16, ly - 44], [lx + 8, ly - 52], [lx - 8, ly - 52]]); ctx.fill();
  // zabuton cushion and a lacquered stand under the stack
  const cw = Math.min(A.w * 0.5, 280);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, cx, baseY + 24, cw * 0.55, 14); ctx.fill();
  ctx.fillStyle = hgrad(ctx, cx - cw / 2, cx + cw / 2, [[0, '#6a1f2a'], [0.5, '#a63446'], [1, '#5a1822']]); rrect(ctx, cx - cw / 2, baseY + 6, cw, 24, 9); ctx.fill();
  ctx.strokeStyle = '#e0b04a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - cw / 2 + 12, baseY + 18); ctx.lineTo(cx + cw / 2 - 12, baseY + 18); ctx.stroke();
}

export function drawBlock(ctx, x, y, w, h, col, sel) {
  const r = h * 0.22;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, x + 3, y + 5, w, h - 2, r); ctx.fill();
  ctx.fillStyle = hgrad(ctx, x, x + w, [[0, dark(col, 0.35)], [0.12, light(col, 0.45)], [0.35, col], [0.8, dark(col, 0.35)], [1, dark(col, 0.6)]]);
  rrect(ctx, x, y + 1, w, h - 2, r); ctx.fill();
  // lacquer: deep gloss band and mirrored sky glint
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; rrect(ctx, x + w * 0.08, y + h * 0.13, w * 0.84, h * 0.17, h * 0.08); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.14)'; rrect(ctx, x + w * 0.08, y + h * 0.62, w * 0.5, h * 0.1, h * 0.05); ctx.fill();
  // gold rim lines
  ctx.strokeStyle = '#e8c35a'; ctx.lineWidth = Math.max(1.5, h * 0.045);
  ctx.beginPath(); ctx.moveTo(x + w * 0.05, y + h * 0.06); ctx.lineTo(x + w * 0.95, y + h * 0.06); ctx.moveTo(x + w * 0.05, y + h * 0.94); ctx.lineTo(x + w * 0.95, y + h * 0.94); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; rrect(ctx, x, y + 1, w, h - 2, r); ctx.stroke();
  if (sel) { ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 4; rrect(ctx, x - 4, y - 2, w + 8, h + 2, r + 3); ctx.stroke(); }
}

// small wooden hammer (kozuchi): cylinder head with end grain, thin handle, a kimono sleeve and hand
export function drawMallet(ctx, bh, ang, col) {
  // origin at the hammer face; handle extends to the left
  ctx.save(); ctx.rotate(ang);
  const hl = bh * 0.9, hr = bh * 0.34;
  // sleeve and arm
  ctx.fillStyle = '#26406a'; poly(ctx, [[-170, -28], [-110, -14], [-110, 18], [-170, 44]]); ctx.fill();
  ctx.fillStyle = '#f2ecd8'; poly(ctx, [[-176, -30], [-166, -26], [-166, 42], [-176, 46]]); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; poly(ctx, [[-168, -26], [-112, -12], [-112, -4], [-168, -14]]); ctx.fill();
  // handle
  ctx.fillStyle = hgrad(ctx, -120, -50, [[0, light(col, 0.2)], [1, dark(col, 0.25)]]); rrect(ctx, -120, -4, 78, 8, 3); ctx.fill();
  ctx.fillStyle = '#d9a679'; ctx.beginPath(); ctx.ellipse(-112, 2, 12, 11, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-108, -3); ctx.lineTo(-104, 7); ctx.moveTo(-114, -5); ctx.lineTo(-110, 8); ctx.stroke();
  // head: a short barrel seen from the side, with banded iron-free joins
  ctx.fillStyle = vgrad(ctx, -hr, hr, [[0, light(col, 0.45)], [0.5, col], [1, dark(col, 0.5)]]); rrect(ctx, -hl * 0.55 - 40, -hr, hl * 0.9 + 4, hr * 2, 9); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-hl * 0.55 - 34, -hr * 0.7, hl * 0.78, 4);
  ctx.fillStyle = dark(col, 0.2); ell(ctx, -hl * 0.55 - 36 + hl * 0.9, 0, hr * 0.22, hr * 0.92); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.stroke();
  ctx.restore();
}

export function drawDaruma(ctx, hr, red, t) {
  // a rounded doll: a deep red body with a pale face mask, thick brows, moustache curls, gold trim, blank eyes
  const gr = ctx.createRadialGradient(-hr * 0.35, -hr * 0.4, hr * 0.1, 0, 0, hr * 1.2);
  gr.addColorStop(0, light(red, 0.4)); gr.addColorStop(0.6, red); gr.addColorStop(1, dark(red, 0.5));
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, hr, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#f6efde'; ctx.beginPath(); ctx.moveTo(-hr * 0.62, -hr * 0.1); ctx.quadraticCurveTo(-hr * 0.7, -hr * 0.62, 0, -hr * 0.62); ctx.quadraticCurveTo(hr * 0.7, -hr * 0.62, hr * 0.62, -hr * 0.1); ctx.quadraticCurveTo(hr * 0.5, hr * 0.5, 0, hr * 0.5); ctx.quadraticCurveTo(-hr * 0.5, hr * 0.5, -hr * 0.62, -hr * 0.1); ctx.fill();
  ctx.strokeStyle = '#161616'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(2.5, hr * 0.13);
  ctx.beginPath(); ctx.moveTo(-hr * 0.55, -hr * 0.2); ctx.quadraticCurveTo(-hr * 0.3, -hr * 0.52, -hr * 0.04, -hr * 0.22); ctx.moveTo(hr * 0.55, -hr * 0.2); ctx.quadraticCurveTo(hr * 0.3, -hr * 0.52, hr * 0.04, -hr * 0.22); ctx.stroke();
  ctx.fillStyle = '#fff'; for (const sx of [-1, 1]) { ell(ctx, sx * hr * 0.27, -hr * 0.02, hr * 0.15, hr * 0.1); ctx.fill(); ctx.strokeStyle = '#161616'; ctx.lineWidth = 1.5; ctx.stroke(); }
  ctx.lineWidth = Math.max(2, hr * 0.09); ctx.strokeStyle = '#161616';
  ctx.beginPath(); ctx.moveTo(0, hr * 0.12); ctx.quadraticCurveTo(-hr * 0.3, hr * 0.14, -hr * 0.42, hr * 0.34); ctx.moveTo(0, hr * 0.12); ctx.quadraticCurveTo(hr * 0.3, hr * 0.14, hr * 0.42, hr * 0.34); ctx.stroke();
  ctx.strokeStyle = '#e8c35a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, hr * 0.92, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
  ctx.lineCap = 'butt'; void t;
}

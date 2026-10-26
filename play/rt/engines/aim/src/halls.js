// Finished venues for the aim engine (1.4.0): a sports hall and a playground, painted floor lines, and "courtyard" scenery that
// fills the band between the horizon and the far wall of the lane view so no empty ground shows. Pure canvas, deterministic.
import { streetBackdrop } from './street.js';
import { drawBackdrop, mix, dark, light, alpha, vgrad, hgrad, poly, rrect, clamp, hash } from './scenery.js';

const TAU = Math.PI * 2;
const ELL = (ctx, x, y, rx, ry) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, TAU); };
const SKIN = ['#e2b48c', '#c68642', '#8d5524', '#f1c27d', '#ffdbac', '#a0673a'];
const SHIRT = ['#d8453a', '#2d6bb0', '#e8b52e', '#3a9a5a', '#f4f0e0', '#7a4aa8', '#e8743a', '#2b2b30'];

// seated spectators in tiers: x0..x1, bottom y, tier count, tier height
export function stands(ctx, x0, x1, yBottom, tiers, th, seed, wood) {
  for (let r = tiers - 1; r >= 0; r--) {
    const y = yBottom - (r + 1) * th, w = x1 - x0;
    ctx.fillStyle = vgrad(ctx, y, y + th, [[0, light(wood, 0.12)], [1, dark(wood, 0.3)]]);
    ctx.fillRect(x0 - r * 3, y + th * 0.55, w + r * 6, th * 0.5);
    const step = Math.max(8, th * 0.62);
    for (let i = 0, x = x0 + step * 0.5; x < x1; i++, x += step) {
      const h = hash(seed + r * 31 + i * 7);
      if (h < 0.18) continue;
      const sk = SKIN[Math.floor(hash(seed + i * 3 + r) * SKIN.length)], sh = SHIRT[Math.floor(hash(seed + i * 11 + r * 5) * SHIRT.length)];
      const bw = step * 0.62, by = y + th * 0.6;
      ctx.fillStyle = dark(sh, 0.12); rrect(ctx, x - bw / 2, by - th * 0.62, bw, th * 0.66, bw * 0.3); ctx.fill();
      ctx.fillStyle = sk; ctx.beginPath(); ctx.arc(x, by - th * 0.8, Math.max(2, step * 0.2), 0, TAU); ctx.fill();
      if (hash(seed + i * 17 + r) > 0.75) { ctx.fillStyle = dark(sh, 0.12); ctx.fillRect(x + bw * 0.4, by - th * 0.98, Math.max(2, step * 0.12), th * 0.36); }
    }
  }
}

function lamps(ctx, R, y, n, w, glowH) {
  for (let i = 0; i < n; i++) {
    const x = R.x + R.w * ((i + 0.5) / n);
    const g = ctx.createRadialGradient(x, y, 1, x, y, glowH); g.addColorStop(0, 'rgba(255,244,214,0.55)'); g.addColorStop(1, 'rgba(255,244,214,0)');
    ctx.fillStyle = g; ctx.fillRect(x - glowH, y - 4, glowH * 2, glowH * 1.4);
    ctx.fillStyle = '#fff6dc'; rrect(ctx, x - w / 2, y - 3, w, 6, 3); ctx.fill();
    ctx.fillStyle = '#4a4e58'; ctx.fillRect(x - w / 2 - 2, y - 7, w + 4, 3);
  }
}

// ---- the sports hall far wall (above the horizon) -----------------------------------------------------------------------
export function hallBackdrop(ctx, R, hy, pal, t, pan, LK = {}) {
  const x0 = R.x, W = R.w, y0 = R.y, H = hy - R.y;
  const wall = pal.skyTop, wallLow = pal.skyLow, team = LK.jersey ?? '#2d4a7a';
  ctx.fillStyle = vgrad(ctx, y0, hy, [[0, wall], [1, wallLow]]); ctx.fillRect(x0, y0, W, H + 2);
  // roof beams and trusses
  ctx.fillStyle = '#2b3140'; ctx.fillRect(x0, y0, W, H * 0.13);
  ctx.strokeStyle = '#3c4354'; ctx.lineWidth = 2;
  ctx.beginPath(); for (let i = 0; i <= 14; i++) { const x = x0 + (W * i) / 14; ctx.moveTo(x, y0); ctx.lineTo(x + W / 28, y0 + H * 0.13); ctx.lineTo(x + W / 14, y0); } ctx.stroke();
  lamps(ctx, R, y0 + H * 0.13, 5, Math.max(16, W * 0.06), H * 0.5);
  // clerestory windows with sun streaks
  const wy = y0 + H * 0.2, wh = H * 0.2, n = 7;
  for (let i = 0; i < n; i++) {
    const x = x0 + W * ((i + 0.5) / n) - W / n * 0.34 + pan * 0.25, w = (W / n) * 0.68;
    ctx.fillStyle = vgrad(ctx, wy, wy + wh, [[0, '#bfe0f4'], [1, '#eaf6fc']]); ctx.fillRect(x, wy, w, wh);
    ctx.strokeStyle = '#5a6272'; ctx.lineWidth = 2; ctx.strokeRect(x, wy, w, wh);
    ctx.beginPath(); ctx.moveTo(x + w / 2, wy); ctx.lineTo(x + w / 2, wy + wh); ctx.moveTo(x, wy + wh / 2); ctx.lineTo(x + w, wy + wh / 2); ctx.stroke();
  }
  // painted stripe, a banner of pennants and the padded wall mats
  ctx.fillStyle = alpha(team, 0.9); ctx.fillRect(x0, y0 + H * 0.5, W, H * 0.045);
  ctx.fillStyle = '#f4f0e0'; ctx.fillRect(x0, y0 + H * 0.545, W, H * 0.012);
  const by = y0 + H * 0.28 + H * 0.2;
  void by;
  const mats = Math.max(14, H * 0.24);
  ctx.fillStyle = vgrad(ctx, hy - mats, hy, [[0, light(team, 0.1)], [1, dark(team, 0.35)]]); ctx.fillRect(x0, hy - mats, W, mats);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.2; ctx.beginPath();
  for (let x = x0; x < x0 + W; x += Math.max(26, W / 14)) { ctx.moveTo(x, hy - mats); ctx.lineTo(x, hy); }
  ctx.moveTo(x0, hy - mats * 0.5); ctx.lineTo(x0 + W, hy - mats * 0.5); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x0, hy - mats, W, 2);
  // hanging banner
  const bw = Math.min(W * 0.34, 170), bx = x0 + W * 0.5 - bw / 2 + pan * 0.4, bt = y0 + H * 0.58, bh = Math.max(20, (hy - mats - bt) * 0.9);
  if (bh > 16) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(bx + 3, bt + 3, bw, bh);
    ctx.fillStyle = vgrad(ctx, bt, bt + bh, [[0, light(LK.jersey ?? '#d8453a', 0.1)], [1, dark(LK.jersey ?? '#d8453a', 0.25)]]); ctx.fillRect(bx, bt, bw, bh);
    ctx.fillStyle = '#f4f0e0'; for (let i = 0; i < 6; i++) poly(ctx, [[bx + bw * (i / 6) + 3, bt + bh], [bx + bw * ((i + 1) / 6) - 3, bt + bh], [bx + bw * ((i + 0.5) / 6), bt + bh * 0.7]]), ctx.fill();
    ctx.strokeStyle = '#f4d98a'; ctx.lineWidth = 2; ctx.strokeRect(bx + 4, bt + 4, bw - 8, bh * 0.5);
    ctx.fillStyle = '#f4d98a'; ctx.beginPath(); ctx.arc(bx + bw / 2, bt + 4 + bh * 0.25, Math.min(bh, bw) * 0.14, 0, TAU); ctx.fill();
  }
  if (LK.finish) hallExtras(ctx, x0, W, y0, H, hy, mats, team, pan, t);
  // pull-out bleachers with spectators at both ends
  const sw = W * 0.26, th = Math.min(24, Math.max(10, mats * 0.5));
  stands(ctx, x0 + 6, x0 + sw, hy - 2, 2, th, 3, '#b88a4e');
  stands(ctx, x0 + W - sw, x0 + W - 6, hy - 2, 2, th, 9, '#b88a4e');
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x0, hy - 3, W, 3);
}


// 1.6.0: wall bars, hanging banners, a scoreboard and light shafts for the hall
function hallExtras(ctx, x0, W, y0, H, hy, mats, team, pan, t) {
  // light shafts from the clerestory windows
  const n = 7;
  for (let i = 1; i < n; i += 2) {
    const x = x0 + W * ((i + 0.5) / n) + pan * 0.25, w = (W / n) * 0.5, top = y0 + H * 0.4, bot = hy - mats;
    const g = ctx.createLinearGradient(x, top, x + W * 0.1, bot); g.addColorStop(0, 'rgba(255,246,214,0.22)'); g.addColorStop(1, 'rgba(255,246,214,0)');
    ctx.fillStyle = g; poly(ctx, [[x - w / 2, top], [x + w / 2, top], [x + w / 2 + W * 0.12, bot], [x - w / 2 + W * 0.12, bot]]); ctx.fill();
  }
  // hanging banners between windows
  const bt = y0 + H * 0.14, bh = H * 0.3;
  const cols = [team, '#e8b52e', team, '#e8b52e'];
  for (let i = 0; i < 4; i++) {
    const x = x0 + W * (0.16 + i * 0.22) + pan * 0.3, bw = Math.min(W * 0.045, 30);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x - bw / 2 + 3, bt + 3, bw, bh);
    ctx.fillStyle = vgrad(ctx, bt, bt + bh, [[0, light(cols[i], 0.15)], [1, dark(cols[i], 0.3)]]); poly(ctx, [[x - bw / 2, bt], [x + bw / 2, bt], [x + bw / 2, bt + bh], [x, bt + bh * 0.88], [x - bw / 2, bt + bh]]); ctx.fill();
    ctx.fillStyle = '#f4f0e0'; ctx.beginPath(); ctx.arc(x, bt + bh * 0.35, bw * 0.28, 0, TAU); ctx.fill(); ctx.fillRect(x - bw * 0.4, bt + bh * 0.6, bw * 0.8, bh * 0.05);
  }
  // scoreboard
  const sw = Math.min(W * 0.3, 190), sh = Math.min(sw * 0.34, H * 0.12), sx = x0 + W * 0.5 - sw / 2 + pan * 0.4, sy = y0 + H * 0.42;
  ctx.fillStyle = '#16181f'; rrect(ctx, sx, sy, sw, sh, 5); ctx.fill(); ctx.strokeStyle = '#8a929e'; ctx.lineWidth = 2; ctx.stroke();
  const seg = (cx, cy, k, col) => { const a = sh * 0.2, b = sh * 0.34; ctx.fillStyle = col; const on = [[1,1,1,0,1,1,1],[0,0,1,0,0,1,0],[1,0,1,1,1,0,1],[1,0,1,1,0,1,1],[0,1,1,1,0,1,0],[1,1,0,1,0,1,1]][k % 6]; const r = [[-a / 2, -b, a, 3],[-a / 2 - 4, -b / 2 - 2, 3, b / 2],[a / 2 + 1, -b / 2 - 2, 3, b / 2],[-a / 2, -1.5, a, 3],[-a / 2 - 4, 2, 3, b / 2],[a / 2 + 1, 2, 3, b / 2],[-a / 2, b - 3, a, 3]]; r.forEach((q, i) => { if (on[i]) ctx.fillRect(cx + q[0], cy + q[1], q[2], q[3]); }); };
  for (const [fx, col, k] of [[0.18, '#ffb02e', 1], [0.34, '#ffb02e', 2], [0.66, '#ff5a3a', 3], [0.82, '#ff5a3a', 0]]) seg(sx + sw * fx, sy + sh * 0.5, k, col);
  ctx.fillStyle = '#ffb02e'; ctx.fillRect(sx + sw * 0.49, sy + sh * 0.36, 3, 3); ctx.fillRect(sx + sw * 0.49, sy + sh * 0.6, 3, 3);
  ctx.fillStyle = '#2a2e38'; ctx.fillRect(sx + sw * 0.2, sy - 10, 2, 10); ctx.fillRect(sx + sw * 0.8, sy - 10, 2, 10);
  // wall bars at both sides
  for (const bx of [x0 + W * 0.03, x0 + W * 0.905]) {
    const bw = W * 0.07, top = y0 + H * 0.55, bot = hy - mats;
    if (bot - top < 20) continue;
    ctx.fillStyle = '#b98a50'; ctx.fillRect(bx, top, 4, bot - top); ctx.fillRect(bx + bw - 4, top, 4, bot - top);
    ctx.strokeStyle = '#d6aa6a'; ctx.lineWidth = 2; ctx.beginPath(); for (let y = top + 6; y < bot; y += 9) { ctx.moveTo(bx, y); ctx.lineTo(bx + bw, y); } ctx.stroke();
  }
}

// 1.6.0: a long low wall with ivy, lamp posts, a bike rack and far-off players for the school yard
function playExtras(ctx, x0, W, y0, H, hy, bx, bw, bh, pan, LK) {
  // low wall in front of the building
  ctx.fillStyle = vgrad(ctx, hy - H * 0.14, hy, [[0, '#b8a888'], [1, '#8a7c62']]); ctx.fillRect(x0, hy - H * 0.14, W, H * 0.14);
  ctx.fillStyle = '#d6c8a6'; ctx.fillRect(x0, hy - H * 0.15, W, 4);
  ctx.fillStyle = 'rgba(46,110,52,0.9)'; for (let i = 0; i < 26; i++) { const x = x0 + W * hash(i * 3.7), r = H * (0.025 + 0.025 * hash(i + 4)); ctx.beginPath(); ctx.arc(x, hy - H * 0.13 + hash(i + 9) * H * 0.04, r, 0, TAU); ctx.fill(); }
  // lamp posts
  for (const fx of [0.1, 0.9]) { const x = x0 + W * fx; ctx.fillStyle = '#4a5058'; ctx.fillRect(x - 2, hy - H * 0.5, 4, H * 0.36); ctx.fillStyle = '#2f343c'; rrect(ctx, x - 9, hy - H * 0.54, 18, 9, 4); ctx.fill(); ctx.fillStyle = 'rgba(255,240,190,0.9)'; ctx.fillRect(x - 6, hy - H * 0.54 + 7, 12, 3); }
  // bike rack
  const rx = x0 + W * 0.76 + pan * 0.4;
  ctx.strokeStyle = '#3a3e46'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { const x = rx + i * 22; ctx.beginPath(); ctx.arc(x, hy - H * 0.04, 8, Math.PI, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(x - 6, hy - H * 0.02, 5, 0, TAU); ctx.arc(x + 6, hy - H * 0.02, 5, 0, TAU); ctx.stroke(); }
  void bx; void bw; void bh; void LK;
}

// 1.6.0: a courtyard for the face view (cuju): tiled wall with a moon gate, lantern strings and pines in front of the pagodas
export function courtExtras(ctx, x0, W, y0, H, hz, pan, t) {
  const u = H / 10;
  // wall with tiled cap along the horizon
  const wh = u * 1.5, wy = hz - wh;
  ctx.fillStyle = vgrad(ctx, wy, hz, [[0, '#f4ecd8'], [1, '#d6c8a8']]); ctx.fillRect(x0, wy, W, wh);
  ctx.fillStyle = '#2b2e34'; ctx.fillRect(x0, wy - u * 0.28, W, u * 0.3); for (let x = x0; x < x0 + W; x += u * 0.3) { ctx.fillStyle = '#3a3e46'; ctx.fillRect(x, wy - u * 0.4, u * 0.2, u * 0.16); }
  ctx.fillStyle = '#a8321f'; ctx.fillRect(x0, wy + u * 0.04, W, u * 0.08);
  const gx = x0 + W * 0.5 + pan * 0.2, gr = wh * 0.46;
  ctx.fillStyle = '#d9a441'; ctx.beginPath(); ctx.arc(gx, hz - gr * 1.05, gr + 4, 0, TAU); ctx.fill(); ctx.fillStyle = vgrad(ctx, hz - gr * 2, hz, [[0, '#9cc4a8'], [1, '#4a7a58']]); ctx.beginPath(); ctx.arc(gx, hz - gr * 1.05, gr, 0, TAU); ctx.fill();
  // pines at both sides
  for (const [fx, sc] of [[0.07, 1.2], [0.93, 1.1], [0.2, 0.8], [0.8, 0.85]]) {
    const x = x0 + W * fx + pan * 0.3, b = hz - u * 0.1; ctx.fillStyle = '#5a3d22'; ctx.fillRect(x - u * 0.08, b - u * 2.4 * sc, u * 0.16, u * 2.4 * sc);
    for (let k = 0; k < 4; k++) { const cx = x + (k % 2 ? 0.5 : -0.45) * u * sc, cy = b - u * (1.5 + k * 0.6) * sc, r = u * 0.95 * sc; const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r); g.addColorStop(0, '#4f9a68'); g.addColorStop(1, '#1f5a3a'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); }
  }
  // lantern string across the top
  const ly = y0 + H * 0.1;
  ctx.strokeStyle = 'rgba(40,24,16,0.7)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x0, ly); ctx.quadraticCurveTo(x0 + W / 2, ly + u * 1.2, x0 + W, ly); ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const f = (i + 0.5) / 7, x = x0 + W * f, y = ly + u * 2.4 * f * (1 - f) * 2 + Math.sin(t * 1.6 + i) * 0.8;
    const g = ctx.createRadialGradient(x, y + u * 0.45, 1, x, y + u * 0.45, u * 1.0); g.addColorStop(0, 'rgba(255,190,110,0.45)'); g.addColorStop(1, 'rgba(255,190,110,0)'); ctx.fillStyle = g; ctx.fillRect(x - u, y - u * 0.4, u * 2, u * 2);
    ctx.fillStyle = vgrad(ctx, y, y + u * 0.9, [[0, '#e8453a'], [1, '#a8321f']]); ctx.beginPath(); ctx.ellipse(x, y + u * 0.45, u * 0.34, u * 0.44, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d9a441'; ctx.fillRect(x - u * 0.16, y, u * 0.32, u * 0.07); ctx.fillRect(x - u * 0.16, y + u * 0.83, u * 0.32, u * 0.07); ctx.fillRect(x - 1, y + u * 0.9, 2, u * 0.4);
  }
}

// ---- the playground far side (above the horizon) ---------------------------------------------------------------------------
export function playBackdrop(ctx, R, hy, pal, t, pan, LK = {}) {
  const x0 = R.x, W = R.w, y0 = R.y, H = hy - R.y;
  ctx.fillStyle = vgrad(ctx, y0, hy, [[0, pal.skyTop], [1, pal.skyLow]]); ctx.fillRect(x0, y0, W, H + 2);
  // sun and clouds
  const sx = x0 + W * 0.8 + pan * 0.1, sy = y0 + H * 0.25;
  const sg = ctx.createRadialGradient(sx, sy, 2, sx, sy, H * 0.6); sg.addColorStop(0, 'rgba(255,248,210,0.9)'); sg.addColorStop(0.2, 'rgba(255,240,190,0.35)'); sg.addColorStop(1, 'rgba(255,240,190,0)');
  ctx.fillStyle = sg; ctx.fillRect(x0, y0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (let i = 0; i < 3; i++) { const cx = x0 + ((W * (0.15 + i * 0.33) + t * (3 + i) + pan * 0.25) % (W + 160)) - 40, cy = y0 + H * (0.15 + (i % 2) * 0.18); ctx.beginPath(); ctx.ellipse(cx, cy, 34, 9, 0, 0, TAU); ctx.ellipse(cx + 20, cy - 5, 22, 8, 0, 0, TAU); ctx.ellipse(cx - 20, cy - 3, 20, 7, 0, 0, TAU); ctx.fill(); }
  // trees behind
  for (let i = 0; i < 10; i++) {
    const x = x0 + W * (0.02 + i * 0.105) + pan * 0.4, h = H * (0.42 + (i % 3) * 0.1), col = mix(pal.mid, pal.skyLow, 0.2 + (i % 2) * 0.1);
    ctx.fillStyle = '#5a3d22'; ctx.fillRect(x - h * 0.03, hy - h * 0.4, h * 0.06, h * 0.4);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, hy - h * 0.62, h * 0.28, 0, TAU); ctx.arc(x - h * 0.17, hy - h * 0.48, h * 0.2, 0, TAU); ctx.arc(x + h * 0.18, hy - h * 0.48, h * 0.2, 0, TAU); ctx.fill();
  }
  // school building
  const bx = x0 + W * 0.18 + pan * 0.5, bw = W * 0.5, bh = H * 0.5, bt = hy - bh;
  ctx.fillStyle = vgrad(ctx, bt, hy, [[0, '#c4694a'], [1, '#a04e36']]); ctx.fillRect(bx, bt, bw, bh);
  ctx.fillStyle = '#4a3a34'; poly(ctx, [[bx - 6, bt], [bx + bw + 6, bt], [bx + bw - 10, bt - bh * 0.18], [bx + 10, bt - bh * 0.18]]); ctx.fill();
  const cols = 6, rows = 2;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const wx = bx + bw * (0.07 + c * 0.155), wy = bt + bh * (0.12 + r * 0.42), ww = bw * 0.1, wh = bh * 0.3;
    ctx.fillStyle = '#e8f4fa'; ctx.fillRect(wx, wy, ww, wh); ctx.strokeStyle = '#f4efe0'; ctx.lineWidth = 2; ctx.strokeRect(wx, wy, ww, wh);
    ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
  }
  ctx.fillStyle = '#3a2a22'; ctx.fillRect(bx + bw * 0.46, hy - bh * 0.34, bw * 0.08, bh * 0.34);
  if (LK.finish) playExtras(ctx, x0, W, y0, H, hy, bx, bw, bh, pan, LK);
  // bunting
  ctx.strokeStyle = 'rgba(40,30,20,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y0 + H * 0.2); ctx.quadraticCurveTo(x0 + W / 2, y0 + H * 0.38, x0 + W, y0 + H * 0.2); ctx.stroke();
  const cols2 = [LK.jersey ?? '#d8453a', '#f4f0e0', '#2d6bb0', '#e8b52e'];
  for (let i = 0; i < 16; i++) { const f = (i + 0.5) / 16, x = x0 + W * f, y = y0 + H * 0.2 + H * 0.18 * 4 * f * (1 - f) + Math.sin(t * 2 + i) * 0.8; ctx.fillStyle = cols2[i % 4]; poly(ctx, [[x - 6, y], [x + 6, y], [x, y + 12]]); ctx.fill(); }
}

// ---- fills the band between the horizon and the far wall of the lane view -------------------------------------------------
export function courtyardBand(ctx, kind, R, y0, y1, pal, LK = {}, t = 0) {
  const h = y1 - y0; if (h < 3) return;
  const x0 = R.x, W = R.w;
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, W, h); ctx.clip();
  const team = LK.jersey ?? '#2d4a7a';
  if (kind === 'hallwall') {
    ctx.fillStyle = vgrad(ctx, y0, y1, [[0, pal.skyLow], [1, mix(pal.skyLow, '#8a94a4', 0.35)]]); ctx.fillRect(x0, y0, W, h);
    stands(ctx, x0 + W * 0.04, x0 + W * 0.3, y1, Math.max(1, Math.round(h / 22)), Math.min(24, h / 2), 5, '#b88a4e');
    stands(ctx, x0 + W * 0.7, x0 + W * 0.96, y1, Math.max(1, Math.round(h / 22)), Math.min(24, h / 2), 13, '#b88a4e');
    ctx.fillStyle = alpha(team, 0.85); ctx.fillRect(x0, y0 + h * 0.18, W, Math.max(3, h * 0.07));
    ctx.fillStyle = '#f4f0e0'; ctx.fillRect(x0, y0 + h * 0.25, W, Math.max(1.5, h * 0.018));
  } else if (kind === 'fence') {
    ctx.fillStyle = vgrad(ctx, y0, y1, [[0, mix(pal.mid, pal.skyLow, 0.4)], [1, dark(pal.mid, 0.1)]]); ctx.fillRect(x0, y0, W, h);
    for (let i = 0; i < 12; i++) { const x = x0 + W * ((i + 0.5) / 12), r = h * (0.28 + 0.1 * hash(i + 4)); ctx.fillStyle = mix(pal.mid, pal.skyLow, 0.1 + 0.2 * hash(i)); ctx.beginPath(); ctx.arc(x, y1 - r * 0.9, r, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = 'rgba(210,215,220,0.55)'; ctx.lineWidth = 1;
    const m = Math.max(7, h * 0.16);
    ctx.beginPath(); for (let k = -h; k < W + h; k += m) { ctx.moveTo(x0 + k, y0); ctx.lineTo(x0 + k + h, y1); ctx.moveTo(x0 + k + h, y0); ctx.lineTo(x0 + k, y1); } ctx.stroke();
    ctx.fillStyle = '#8a929a'; for (let x = x0 + 10; x < x0 + W; x += Math.max(60, W / 7)) ctx.fillRect(x - 2, y0, 4, h);
    ctx.fillStyle = '#a6aeb6'; ctx.fillRect(x0, y0, W, 3);
  } else if (kind === 'hedge') {
    ctx.fillStyle = vgrad(ctx, y0, y1, [[0, mix(pal.mid, '#ffffff', 0.12)], [1, dark(pal.mid, 0.35)]]); ctx.fillRect(x0, y0, W, h);
    const lc = alpha(light(pal.mid, 0.28), 0.5), dc = alpha(dark(pal.mid, 0.45), 0.4);
    for (let pass = 0; pass < 2; pass++) { ctx.fillStyle = pass ? lc : dc; ctx.beginPath(); for (let i = pass; i < (W * h) / 260; i += 2) { const x = x0 + hash(i * 1.37 + 3) * W, yy = y0 + hash(i * 2.91 + 11) * h, r = 4 + hash(i * 5.3) * 8; ctx.moveTo(x + r, yy); ctx.arc(x, yy, r, 0, TAU); } ctx.fill(); }
  } else if (kind === 'brick') {
    const base = LK.wall ?? '#a8614a', bh = Math.max(5, h / 9), bw = bh * 2.3;
    ctx.fillStyle = base; ctx.fillRect(x0, y0, W, h);
    for (let r = 0, y = y0; y < y1; r++, y += bh) for (let x = x0 - (r % 2) * bw / 2; x < x0 + W; x += bw) { ctx.fillStyle = mix(base, hash(r * 31 + x) > 0.5 ? '#ffffff' : '#000000', 0.04 + 0.08 * hash(x * 0.3 + r)); ctx.fillRect(x + 1, y + 1, bw - 2, bh - 2); }
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x0, y0, W, 4);
    ctx.fillStyle = vgrad(ctx, y0, y1, [[0, 'rgba(255,255,255,0.12)'], [1, 'rgba(0,0,0,0.25)']]); ctx.fillRect(x0, y0, W, h);
  } else if (kind === 'trees') {
    ctx.fillStyle = vgrad(ctx, y0, y1, [[0, mix(pal.far, pal.skyLow, 0.45)], [1, dark(pal.mid, 0.25)]]); ctx.fillRect(x0, y0, W, h);
    // two rows of trees: a pale distant row, then darker trunks and crowns in front
    for (const row of [0, 1]) {
      const n = row ? 11 : 15;
      for (let i = 0; i < n; i++) {
        const x = x0 + W * ((i + 0.2 + hash(i + row * 31) * 0.6) / n), r = h * (row ? 0.2 + 0.12 * hash(i + 9) : 0.16 + 0.1 * hash(i + 4)), base = y1 - (row ? 0 : h * 0.18);
        const col = row ? pal.mid : mix(pal.mid, pal.skyLow, 0.35);
        ctx.fillStyle = dark('#5a3d22', row ? 0 : 0.2); ctx.fillRect(x - r * 0.08, base - r * 1.2, r * 0.16, r * 1.2);
        for (const [dx, dy, k] of [[0, 1.55, 1], [-0.55, 1.25, 0.75], [0.55, 1.25, 0.75], [0.1, 2.0, 0.7]]) {
          const g = ctx.createRadialGradient(x + (dx - 0.2) * r, base - dy * r - r * 0.2, r * 0.1, x + dx * r, base - dy * r, r * k * 1.05);
          g.addColorStop(0, light(col, row ? 0.3 : 0.2)); g.addColorStop(1, dark(col, row ? 0.3 : 0.12));
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + dx * r, base - dy * r, r * k, 0, TAU); ctx.fill();
        }
      }
    }
  } else if (kind === 'stands') {
    ctx.fillStyle = vgrad(ctx, y0, y1, [[0, '#2a3040'], [1, '#3a4256']]); ctx.fillRect(x0, y0, W, h);
    stands(ctx, x0 + 4, x0 + W - 4, y1, Math.max(2, Math.round(h / 20)), Math.min(22, h / 2.2), 21, '#8a6a44');
  } else if (kind === 'turf') {
    ctx.fillStyle = vgrad(ctx, y0, y1, [[0, mix(pal.ground, pal.skyLow, 0.5)], [1, dark(pal.ground, 0.12)]]); ctx.fillRect(x0, y0, W, h);
    for (let k = 0, y = y0; y < y1; k++) { const hh = Math.max(2, (y1 - y0) * (0.08 + k * 0.012)); ctx.fillStyle = k % 2 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'; ctx.fillRect(x0, y, W, hh); y += hh; }
  }
  ctx.restore();
}

// ---- floor of the face view (looking down the hall or playground) ------------------------------------------------------------
export function floorFace(ctx, setting, area, hz, bottom, baseY, cx, pal, LK, marks, s, t) {
  const x0 = area.x - 20, W = area.w + 40, gnd = LK.ground ?? pal.ground;
  const lineCol = LK.lines ?? (setting === 'sports-hall' ? '#f6f2e6' : '#f6f2e6');
  ctx.fillStyle = vgrad(ctx, hz, bottom + 40, [[0, mix(gnd, pal.skyLow, setting === 'sports-hall' ? 0.28 : 0.4)], [0.35, gnd], [1, dark(gnd, 0.32)]]);
  ctx.fillRect(x0, hz, W, bottom - hz + 42);
  if (setting === 'sports-hall') {
    // maple planks running toward the far wall, with staggered joints and soft lamp reflections
    ctx.strokeStyle = 'rgba(80,50,20,0.2)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let j = -14; j <= 14; j++) { ctx.moveTo(cx + j * 5, hz); ctx.lineTo(cx + j * area.w * 0.11, bottom + 40); }
    ctx.stroke();
    for (let i = 0; i < 10; i++) {
      const u = Math.pow((i + 1) / 10, 1.9), y = hz + (bottom - hz) * u;
      ctx.strokeStyle = 'rgba(80,50,20,0.1)'; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + W, y); ctx.stroke();
    }
    for (let k = -2; k <= 2; k++) {
      const g = ctx.createLinearGradient(0, hz, 0, bottom); g.addColorStop(0, 'rgba(255,248,220,0)'); g.addColorStop(0.5, 'rgba(255,248,220,0.14)'); g.addColorStop(1, 'rgba(255,248,220,0)');
      ctx.fillStyle = g; poly(ctx, [[cx + k * area.w * 0.16 - 6, hz], [cx + k * area.w * 0.16 + 6, hz], [cx + k * area.w * 0.55 + 40, bottom], [cx + k * area.w * 0.55 - 40, bottom]]); ctx.fill();
    }
  } else {
    // asphalt: speckle and a faint sheen
    for (let i = 0; i < 90; i++) { const u = Math.pow(hash(i * 1.7), 1.4), y = hz + (bottom - hz) * u, x = x0 + hash(i * 2.3 + 5) * W; ctx.fillStyle = hash(i) > 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.09)'; ctx.fillRect(x, y, 2 + u * 4, 1 + u * 1.5); }
  }
  // painted lines: the baseline, and a circle around every post or screen
  ctx.strokeStyle = alpha(lineCol, 0.78); ctx.lineWidth = Math.max(2, s * 0.018); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, baseY + s * 0.05); ctx.lineTo(x0 + W, baseY + s * 0.05); ctx.stroke();
  for (const m of marks) {
    ctx.beginPath(); ctx.ellipse(m, baseY, s * 0.42, s * 0.095, 0, 0, TAU); ctx.stroke();
  }
  // the near line, where the shooter stands
  const ny = bottom - (bottom - baseY) * 0.12;
  ctx.strokeStyle = alpha('#f4d34a', 0.6); ctx.lineWidth = Math.max(2, s * 0.02); ctx.beginPath(); ctx.moveTo(x0, ny); ctx.lineTo(x0 + W, ny); ctx.stroke();
  ctx.lineCap = 'butt';
  void t;
}

// ---- painted lines on the lane view floor ------------------------------------------------------------------------------------
export function floorLinesLane(ctx, tr, setting, hw, len, LK) {
  const col = LK.lines ?? '#f6f2e6', lw = (p) => Math.max(1.5, p.s * 0.05);
  const seg = (a, b) => { const p = tr(a[0], a[1]), q = tr(b[0], b[1]); ctx.lineWidth = lw(p); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); };
  ctx.save(); ctx.lineCap = 'round';
  const xo = hw + 1.4;
  ctx.strokeStyle = alpha(col, 0.8);
  seg([-xo, -2], [-xo, len + 0.7]); seg([xo, -2], [xo, len + 0.7]); seg([-xo, len + 0.7], [xo, len + 0.7]);
  // the "D" near the far wall, and a halfway line
  ctx.beginPath();
  for (let i = 0; i <= 28; i++) { const a = (i / 28) * Math.PI, p = tr(Math.cos(a) * hw * 1.1, len + 0.7 - Math.sin(a) * hw * 1.1 * 0.9); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }
  const pm = tr(0, len * 0.5); ctx.lineWidth = Math.max(1.5, pm.s * 0.05); ctx.stroke();
  ctx.strokeStyle = alpha('#f4d34a', 0.6); seg([-xo, len * 0.5], [xo, len * 0.5]);
  ctx.beginPath(); for (let i = 0; i <= 28; i++) { const a = (i / 28) * TAU, p = tr(Math.cos(a) * hw * 0.35, len * 0.5 + Math.sin(a) * hw * 0.35); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); } ctx.stroke();
  ctx.restore();
  void setting;
}

// one entry point for both views: the new settings are drawn here, the rest by scenery.js
export function backdrop(ctx, setting, R, hy, pal, t, pan, LK) {
  if (setting === 'sports-hall') return hallBackdrop(ctx, R, hy, pal, t, pan, LK);
  if (setting === 'playground') return playBackdrop(ctx, R, hy, pal, t, pan, LK);
  if (setting === 'street') return streetBackdrop(ctx, R, hy, pal, t, pan, LK);
  return drawBackdrop(ctx, setting, R, hy, pal, t, pan);
}

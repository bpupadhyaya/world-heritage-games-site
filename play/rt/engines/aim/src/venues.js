// Venues for the aim engine's lane view (1.6.0): the painted band between the near ground and the far end of the lane for each
// sport family. Each venue is composed for the visible band (width W, height H, bottom y1) so it fills it at any camera. Pure canvas.
import { stands } from './halls.js';
import { mix, dark, light, alpha, vgrad, hgrad, poly, rrect, hash } from './scenery.js';

const TAU = Math.PI * 2;
const circ = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, Math.max(0.5, r), 0, TAU); ctx.fill(); };
const blob = (ctx, x, y, r, col, hi = 0.25, lo = 0.25) => {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.05); g.addColorStop(0, light(col, hi)); g.addColorStop(1, dark(col, lo));
  ctx.fillStyle = g; circ(ctx, x, y, r);
};
function skyFill(ctx, x0, W, y0, y1, pal, hzFrac = 0.6) {
  ctx.fillStyle = vgrad(ctx, y0, y1, [[0, pal.skyTop], [hzFrac, pal.skyLow], [1, mix(pal.skyLow, pal.ground, 0.4)]]); ctx.fillRect(x0, y0, W, y1 - y0);
}
function treeRow(ctx, x0, W, base, r0, col, seed, n, dens = 1) {
  for (let i = 0; i < n; i++) {
    const x = x0 + W * ((i + 0.3 + hash(seed + i) * 0.5) / n), r = r0 * (0.8 + 0.5 * hash(seed + i * 3));
    ctx.fillStyle = dark('#5a3d22', 0.2); ctx.fillRect(x - r * 0.06, base - r * 0.9, r * 0.12, r * 0.9);
    blob(ctx, x, base - r * 1.25, r, col, 0.25, 0.28); blob(ctx, x - r * 0.6, base - r * 0.95, r * 0.7, col, 0.2, 0.3); blob(ctx, x + r * 0.6, base - r * 0.95, r * 0.72, col, 0.2, 0.3);
    void dens;
  }
}
function pennants(ctx, x0, x1, y, sag, n, cols, t) {
  ctx.strokeStyle = 'rgba(30,24,20,0.65)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo((x0 + x1) / 2, y + sag * 2, x1, y); ctx.stroke();
  for (let i = 0; i < n; i++) {
    const f = (i + 0.5) / n, x = x0 + (x1 - x0) * f, yy = y + sag * 4 * f * (1 - f) + Math.sin(t * 2 + i) * 0.7, w = (x1 - x0) / n * 0.34;
    ctx.fillStyle = cols[i % cols.length]; poly(ctx, [[x - w, yy], [x + w, yy], [x, yy + w * 2.1]]); ctx.fill();
  }
}
function flag(ctx, x, y, h, col, t) {
  ctx.fillStyle = '#e8e8e2'; ctx.fillRect(x - 1, y - h, 2, h);
  const w = h * 0.55, wv = Math.sin(t * 4 + x) * h * 0.04;
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x + 1, y - h); ctx.quadraticCurveTo(x + w * 0.5, y - h + wv, x + w, y - h + h * 0.06); ctx.lineTo(x + w, y - h * 0.68); ctx.quadraticCurveTo(x + w * 0.5, y - h * 0.7 + wv, x + 1, y - h * 0.68); ctx.closePath(); ctx.fill();
}
const window2 = (ctx, x, y, w, h, frame = '#f6f3ea', glass = '#9cc4de') => {
  ctx.fillStyle = frame; ctx.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);
  ctx.fillStyle = vgrad(ctx, y, y + h, [[0, light(glass, 0.35)], [1, glass]]); ctx.fillRect(x, y, w, h);
  ctx.fillStyle = frame; ctx.fillRect(x + w / 2 - 1, y, 2, h); ctx.fillRect(x, y + h / 2 - 1, w, 2);
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; poly(ctx, [[x, y + h], [x + w * 0.4, y], [x + w * 0.65, y], [x + w * 0.25, y + h]]); ctx.fill();
};

// ---- croquet and lawn clubs: pavilion with striped awning, flower beds, white pickets, bunting ------------------------------------
function pavilion(ctx, x0, W, y0, y1, pal, LK, t) {
  const H = y1 - y0, u = H / 10;
  skyFill(ctx, x0, W, y0, y1, pal, 0.55);
  // distant hills and an avenue of trees
  ctx.fillStyle = mix(pal.far, pal.skyLow, 0.45); ctx.beginPath(); ctx.moveTo(x0, y1 - u * 3.6); for (let x = 0; x <= W; x += W / 18) ctx.lineTo(x0 + x, y1 - u * (3.8 + 0.8 * Math.sin(x * 0.011) + 0.4 * Math.sin(x * 0.027))); ctx.lineTo(x0 + W, y1); ctx.lineTo(x0, y1); ctx.fill();
  treeRow(ctx, x0, W, y1 - u * 1.9, u * 1.3, mix(pal.mid, pal.far, 0.3), 5, 9);
  // clubhouse
  const bw = Math.min(W * 0.62, u * 9), bx = x0 + W * 0.58 - bw / 2, by = y1 - u * 2.3, bh = u * 3.1;
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(bx - 4, by - 1, bw + 10, u * 0.3);
  ctx.fillStyle = vgrad(ctx, by - bh, by, [[0, '#fbf6e8'], [1, '#e2d9c0']]); ctx.fillRect(bx, by - bh, bw, bh);
  ctx.fillStyle = hgrad(ctx, bx, bx + bw, [[0, 'rgba(255,255,255,0.15)'], [0.7, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.15)']]); ctx.fillRect(bx, by - bh, bw, bh);
  const rc = '#3c6e49'; ctx.fillStyle = vgrad(ctx, by - bh - u * 1.4, by - bh, [[0, light(rc, 0.1)], [1, dark(rc, 0.3)]]);
  poly(ctx, [[bx - u * 0.5, by - bh + 2], [bx + bw + u * 0.5, by - bh + 2], [bx + bw - u * 0.7, by - bh - u * 1.4], [bx + u * 0.7, by - bh - u * 1.4]]); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(bx - u * 0.5, by - bh, bw + u, 3);
  const nw = 4; for (let i = 0; i < nw; i++) window2(ctx, bx + bw * (0.1 + i * 0.23), by - bh * 0.88, bw * 0.14, bh * 0.4);
  // verandah awning: green and white stripes
  const ay = by - bh * 0.36, ah = bh * 0.2, ns = 16;
  for (let i = 0; i < ns; i++) { ctx.fillStyle = i % 2 ? '#f6f3ea' : '#2f6b45'; poly(ctx, [[bx + (bw * i) / ns, ay], [bx + (bw * (i + 1)) / ns, ay], [bx + (bw * (i + 1)) / ns + u * 0.14, ay + ah], [bx + (bw * i) / ns - u * 0.14, ay + ah]]); ctx.fill(); }
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(bx, ay + ah, bw, u * 0.08);
  for (const px of [0.02, 0.34, 0.66, 0.98]) { ctx.fillStyle = '#f2eee0'; ctx.fillRect(bx + bw * px - 2, ay + ah, 4, by - ay - ah); }
  ctx.fillStyle = 'rgba(40,30,20,0.55)'; ctx.fillRect(bx, ay + ah + u * 0.08, bw, by - ay - ah - u * 0.08);
  // chairs and tables on the verandah
  for (let i = 0; i < 4; i++) { const cx = bx + bw * (0.12 + i * 0.25); ctx.fillStyle = '#a8763a'; ctx.fillRect(cx - u * 0.3, by - u * 0.45, u * 0.6, u * 0.08); ctx.fillRect(cx - u * 0.28, by - u * 0.95, u * 0.06, u * 0.5); }
  flag(ctx, bx + bw * 0.5, by - bh - u * 1.3, u * 1.5, '#c8392e', t);
  // hedge, flower beds, white picket fence
  const hh = u * 1.15;
  ctx.fillStyle = vgrad(ctx, y1 - hh - u * 0.6, y1 - u * 0.4, [[0, light(pal.mid, 0.1)], [1, dark(pal.mid, 0.4)]]); ctx.fillRect(x0, y1 - hh - u * 0.6, W, hh + u * 0.2);
  for (let i = 0; i < W / (u * 0.45); i++) { const x = x0 + i * u * 0.45 + hash(i) * u * 0.3, y = y1 - hh - u * 0.5 + hash(i + 7) * hh; ctx.fillStyle = alpha(light(pal.mid, 0.3), 0.4); circ(ctx, x, y, u * 0.3); }
  const FL = ['#e8453a', '#f2c230', '#f4f0e6', '#d870b8', '#7a58c8', '#f08a3a'];
  for (let i = 0; i < W / (u * 0.34); i++) { const x = x0 + i * u * 0.34 + hash(i * 2) * u * 0.2, y = y1 - u * 0.8 + hash(i + 3) * u * 0.28; ctx.fillStyle = FL[Math.floor(hash(i * 5) * FL.length)]; circ(ctx, x, y, u * 0.13); }
  const pk = u * 0.28; ctx.fillStyle = '#f4f2ea';
  for (let x = x0; x < x0 + W; x += pk * 1.6) { poly(ctx, [[x, y1], [x + pk, y1], [x + pk, y1 - u * 0.62], [x + pk / 2, y1 - u * 0.78], [x, y1 - u * 0.62]]); ctx.fill(); }
  ctx.fillStyle = '#e4e0d2'; ctx.fillRect(x0, y1 - u * 0.5, W, u * 0.08); ctx.fillRect(x0, y1 - u * 0.2, W, u * 0.08);
  pennants(ctx, x0 - 10, x0 + W + 10, y0 + u * 0.7, u * 0.9, 18, ['#c8392e', '#f6f3ea', '#2f6b45', '#f2c230'], t);
}

// ---- clay court club (nohejbal, tennis-like): windscreens with banners, stands, poplars, floodlights ----------------------------------
function clayclub(ctx, x0, W, y0, y1, pal, LK, t) {
  const H = y1 - y0, u = H / 10;
  skyFill(ctx, x0, W, y0, y1, pal, 0.5);
  treeRow(ctx, x0, W, y1 - u * 3.4, u * 1.9, mix(pal.mid, '#2f6a3a', 0.4), 11, 8);
  // tall poplars
  for (let i = 0; i < 5; i++) { const x = x0 + W * (0.08 + i * 0.21 + hash(i) * 0.04), h = u * (4.4 + hash(i + 2)); ctx.fillStyle = vgrad(ctx, y1 - u * 2 - h, y1 - u * 2, [[0, light('#3f7a3e', 0.1)], [1, dark('#2c5a2e', 0.2)]]); ctx.beginPath(); ctx.ellipse(x, y1 - u * 2 - h * 0.5, u * 0.55, h * 0.5, 0, 0, TAU); ctx.fill(); }
  // stands
  ctx.fillStyle = '#2a3040'; ctx.fillRect(x0, y1 - u * 4.2, W, u * 2.2);
  stands(ctx, x0 + W * 0.03, x0 + W * 0.97, y1 - u * 2.0, 2, u * 1.05, 31, '#8a6a44');
  // floodlight masts
  for (const fx of [0.06, 0.94]) { const x = x0 + W * fx; ctx.fillStyle = '#6a707a'; ctx.fillRect(x - 2, y1 - u * 8.6, 4, u * 6.6); ctx.fillStyle = '#2a2e36'; ctx.fillRect(x - u * 0.6, y1 - u * 9.2, u * 1.2, u * 0.7); ctx.fillStyle = '#fff6d8'; for (let k = 0; k < 4; k++) circ(ctx, x - u * 0.45 + k * u * 0.3, y1 - u * 8.85, u * 0.1); }
  // windscreen with sponsor panels (colour blocks and stripes: no lettering)
  const wy = y1 - u * 2.1; ctx.fillStyle = vgrad(ctx, wy, y1, [[0, '#2a5a3a'], [1, '#1c3f2a']]); ctx.fillRect(x0, wy, W, u * 2.1);
  const PAN = ['#e8453a', '#f2c230', '#2d6bb0', '#f4f0e6', '#3a9a5a', '#e8743a'];
  const pw = u * 3.2;
  for (let i = 0, x = x0 + u * 0.3; x < x0 + W; i++, x += pw + u * 0.2) {
    const c = PAN[i % PAN.length]; ctx.fillStyle = c; rrect(ctx, x, wy + u * 0.35, pw, u * 1.2, u * 0.08); ctx.fill();
    ctx.fillStyle = alpha('#ffffff', 0.85); ctx.fillRect(x + pw * 0.12, wy + u * 0.62, pw * 0.5, u * 0.14); ctx.fillRect(x + pw * 0.12, wy + u * 0.9, pw * 0.7, u * 0.1); ctx.fillStyle = alpha('#000000', 0.18); ctx.fillRect(x + pw * 0.72, wy + u * 0.55, pw * 0.2, u * 0.6);
  }
  ctx.fillStyle = '#d8dce2'; ctx.fillRect(x0, wy - 2, W, 3);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x0, y1 - u * 0.15, W, u * 0.15);
}

// ---- village pitch (faustball): church, farm roofs, poplars, hay, bench spectators -----------------------------------------------------
function village(ctx, x0, W, y0, y1, pal, LK, t) {
  const H = y1 - y0, u = H / 10;
  skyFill(ctx, x0, W, y0, y1, pal, 0.55);
  ctx.fillStyle = mix(pal.far, pal.skyLow, 0.5); ctx.beginPath(); ctx.moveTo(x0, y1 - u * 3); for (let x = 0; x <= W; x += W / 14) ctx.lineTo(x0 + x, y1 - u * (3.4 + 1.1 * Math.sin(x * 0.009 + 1))); ctx.lineTo(x0 + W, y1); ctx.lineTo(x0, y1); ctx.fill();
  // church
  const cx = x0 + W * 0.3, cb = y1 - u * 2.4; ctx.fillStyle = '#efe6d2'; ctx.fillRect(cx - u * 0.9, cb - u * 3.4, u * 1.8, u * 3.4); ctx.fillStyle = '#d8cdb4'; ctx.fillRect(cx + u * 0.4, cb - u * 3.4, u * 0.5, u * 3.4);
  ctx.fillStyle = '#a8412e'; poly(ctx, [[cx - u * 1.1, cb - u * 3.4], [cx + u * 1.1, cb - u * 3.4], [cx, cb - u * 5.6]]); ctx.fill();
  ctx.fillStyle = '#3a3026'; rrect(ctx, cx - u * 0.25, cb - u * 2.8, u * 0.5, u * 0.9, u * 0.25); ctx.fill(); ctx.fillStyle = '#f2c230'; circ(ctx, cx, cb - u * 1.1 - u * 3.0 + u * 0.1, u * 0.3);
  ctx.fillStyle = '#efe6d2'; ctx.fillRect(cx - u * 2.6, cb - u * 1.8, u * 1.7, u * 1.8); ctx.fillStyle = '#b0503a'; poly(ctx, [[cx - u * 2.8, cb - u * 1.8], [cx - u * 0.8, cb - u * 1.8], [cx - u * 1.8, cb - u * 2.8]]); ctx.fill();
  // farm houses
  for (const [fx, fw, col] of [[0.62, 2.4, '#f4e4c0'], [0.78, 2.0, '#e8d0a8'], [0.9, 1.7, '#f0dcb8']]) {
    const x = x0 + W * fx, w = u * fw, b = y1 - u * 2.3; ctx.fillStyle = col; ctx.fillRect(x - w / 2, b - u * 1.4, w, u * 1.4); ctx.fillStyle = '#b8563a'; poly(ctx, [[x - w * 0.6, b - u * 1.4], [x + w * 0.6, b - u * 1.4], [x + w * 0.35, b - u * 2.3], [x - w * 0.35, b - u * 2.3]]); ctx.fill();
    ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x - w * 0.1, b - u * 0.8, w * 0.2, u * 0.8); ctx.fillStyle = '#9cc4de'; ctx.fillRect(x + w * 0.18, b - u * 1.1, w * 0.18, u * 0.4); ctx.fillRect(x - w * 0.36, b - u * 1.1, w * 0.18, u * 0.4);
  }
  treeRow(ctx, x0, W, y1 - u * 1.4, u * 1.3, mix('#3f7a3e', pal.mid, 0.4), 9, 12);
  // meadow with sunflowers and hay bales
  ctx.fillStyle = vgrad(ctx, y1 - u * 1.7, y1, [[0, mix(pal.ground, pal.skyLow, 0.2)], [1, dark(pal.ground, 0.15)]]); ctx.fillRect(x0, y1 - u * 1.7, W, u * 1.7);
  for (let i = 0; i < 6; i++) { const x = x0 + W * (0.05 + i * 0.17 + hash(i) * 0.05), y = y1 - u * 0.95; ctx.fillStyle = '#d9b44a'; ctx.beginPath(); ctx.ellipse(x, y, u * 0.55, u * 0.42, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#a88a30'; ctx.lineWidth = 1; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.arc(x, y, u * (0.1 + 0.1 * Math.abs(k)), 0, TAU); ctx.stroke(); } }
  for (let i = 0; i < W / (u * 0.9); i++) { const x = x0 + i * u * 0.9 + hash(i * 3) * u * 0.4, y = y1 - u * 0.3 - hash(i) * u * 0.9; ctx.strokeStyle = '#3a7a30'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + u * 0.5); ctx.lineTo(x, y); ctx.stroke(); ctx.fillStyle = '#f2c230'; circ(ctx, x, y, u * 0.16); ctx.fillStyle = '#5a3a1a'; circ(ctx, x, y, u * 0.07); }
  // wooden rail with pennants
  ctx.fillStyle = '#8a6a44'; ctx.fillRect(x0, y1 - u * 0.5, W, u * 0.1); for (let x = x0 + 6; x < x0 + W; x += u * 1.5) ctx.fillRect(x, y1 - u * 0.7, u * 0.12, u * 0.7);
  pennants(ctx, x0 - 10, x0 + W + 10, y1 - u * 0.75, u * 0.2, 22, ['#f2c230', '#2d6bb0', '#e8453a', '#f6f3ea'], t);
}

// ---- pub garden (bat and trap): timbered pub front, hanging sign, window boxes, string lights, barrels ----------------------------------
function pubgarden(ctx, x0, W, y0, y1, pal, LK, t) {
  const H = y1 - y0, u = H / 10;
  skyFill(ctx, x0, W, y0, y1, pal, 0.4);
  const base = LK.wall ?? '#8a4a38', wy = y1 - u * 1.4;
  // pub front
  const px = x0 + W * 0.12, pw = W * 0.76, pb = y1 - u * 1.2, ph = u * 4.6;
  ctx.fillStyle = vgrad(ctx, pb - ph, pb, [[0, '#f4ecd6'], [1, '#d8ccac']]); ctx.fillRect(px, pb - ph, pw, ph);
  ctx.fillStyle = '#2a211c'; ctx.fillRect(px, pb - ph, pw, u * 0.2); ctx.fillRect(px, pb - ph * 0.52, pw, u * 0.18);
  for (let x = px; x <= px + pw; x += pw / 8) ctx.fillRect(x - 2, pb - ph, 4, ph);
  ctx.fillStyle = '#3a2a22'; poly(ctx, [[px - u * 0.6, pb - ph + 2], [px + pw + u * 0.6, pb - ph + 2], [px + pw - u * 0.8, pb - ph - u * 1.7], [px + u * 0.8, pb - ph - u * 1.7]]); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(px + u * 0.8, pb - ph - u * 1.5, pw - u * 1.6, u * 0.1);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = '#8a3a2a'; ctx.fillRect(px + pw * (0.1 + i * 0.075), pb - ph - u * 2.4 + (i % 2) * u * 0.3, u * 0.4, u * 0.9); }
  for (let i = 0; i < 5; i++) { const wx = px + pw * (0.07 + i * 0.185), wyy = pb - ph * 0.88; ctx.fillStyle = '#2a211c'; ctx.fillRect(wx - 2, wyy - 2, pw * 0.13 + 4, ph * 0.32 + 4); ctx.fillStyle = i === 2 ? '#2a211c' : vgrad(ctx, wyy, wyy + ph * 0.3, [[0, '#ffe9a8'], [1, '#e8b25a']]); ctx.fillRect(wx, wyy, pw * 0.13, ph * 0.3); ctx.fillStyle = '#2a211c'; ctx.fillRect(wx + pw * 0.065 - 1, wyy, 2, ph * 0.3); ctx.fillRect(wx, wyy + ph * 0.15 - 1, pw * 0.13, 2); ctx.fillStyle = '#e8453a'; if (i !== 2) for (let k = 0; k < 6; k++) circ(ctx, wx + pw * 0.13 * (k + 0.5) / 6, wyy + ph * 0.32 + u * 0.05, u * 0.12); }
  // hanging sign
  const sx = px + pw * 0.5, sy = pb - ph * 0.6; ctx.fillStyle = '#2a211c'; ctx.fillRect(sx - u * 1.6, sy - u * 0.15, u * 1.2, 3); ctx.strokeStyle = '#2a211c'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx - u * 1.1, sy); ctx.lineTo(sx - u * 1.1, sy + u * 0.3); ctx.moveTo(sx - u * 0.6, sy); ctx.lineTo(sx - u * 0.6, sy + u * 0.3); ctx.stroke();
  ctx.fillStyle = '#c8392e'; rrect(ctx, sx - u * 1.35, sy + u * 0.3, u * 1.0, u * 0.9, u * 0.1); ctx.fill(); ctx.fillStyle = '#f2c230'; circ(ctx, sx - u * 0.85, sy + u * 0.75, u * 0.28);
  // door
  ctx.fillStyle = '#3a2a22'; rrect(ctx, sx + u * 0.4, pb - u * 2.2, u * 1.2, u * 2.2, u * 0.12); ctx.fill(); ctx.fillStyle = '#d9a441'; circ(ctx, sx + u * 1.4, pb - u * 1.1, u * 0.07);
  // garden wall in front, with barrels and benches
  ctx.fillStyle = vgrad(ctx, wy, y1, [[0, light(base, 0.1)], [1, dark(base, 0.3)]]); ctx.fillRect(x0, wy, W, u * 1.4);
  const bh = u * 0.28; ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1; for (let y = wy + bh; y < y1; y += bh) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + W, y); ctx.stroke(); }
  for (let r = 0, y = wy; y < y1; r++, y += bh) for (let x = x0 + (r % 2) * u * 0.4; x < x0 + W; x += u * 0.8) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + bh); ctx.stroke(); }
  ctx.fillStyle = '#c8a878'; ctx.fillRect(x0, wy - u * 0.12, W, u * 0.14);
  for (const bx of [0.04, 0.93]) { const x = x0 + W * bx; ctx.fillStyle = hgrad(ctx, x - u * 0.5, x + u * 0.5, [[0, '#c8944a'], [0.5, '#a8743a'], [1, '#6a4a22']]); rrect(ctx, x - u * 0.5, wy - u * 1.15, u, u * 1.1, u * 0.3); ctx.fill(); ctx.fillStyle = '#2a211c'; ctx.fillRect(x - u * 0.5, wy - u * 0.9, u, u * 0.07); ctx.fillRect(x - u * 0.5, wy - u * 0.4, u, u * 0.07); }
  // string lights
  pennants(ctx, x0 - 10, x0 + W + 10, y0 + u * 0.5, u * 1.1, 16, ['#ffe9a8', '#ffd27a', '#ffe9a8', '#ffc86a'], t);
}

// ---- moon gate courtyard (chuiwan): tiled garden wall, round gate to a pine garden, lanterns, bamboo -------------------------------------
function moongate(ctx, x0, W, y0, y1, pal, LK, t) {
  const H = y1 - y0, u = H / 10;
  skyFill(ctx, x0, W, y0, y1, pal, 0.5);
  // mountains and pagodas
  ctx.fillStyle = mix('#7a9a9a', pal.skyLow, 0.5); ctx.beginPath(); ctx.moveTo(x0, y1 - u * 3); for (let x = 0; x <= W; x += W / 12) ctx.lineTo(x0 + x, y1 - u * (4.6 + 2 * Math.abs(Math.sin(x * 0.006 + 0.6)))); ctx.lineTo(x0 + W, y1); ctx.lineTo(x0, y1); ctx.fill();
  const pag = (x, b, w) => { for (let i = 0; i < 3; i++) { const y = b - i * w * 0.5, ww = w * (1 - i * 0.2); ctx.fillStyle = '#a8321f'; ctx.fillRect(x - ww * 0.36, y - w * 0.36, ww * 0.72, w * 0.36); ctx.fillStyle = '#2b2e34'; ctx.beginPath(); ctx.moveTo(x - ww * 0.65, y - w * 0.32); ctx.quadraticCurveTo(x - ww * 0.3, y - w * 0.34, x, y - w * 0.58); ctx.quadraticCurveTo(x + ww * 0.3, y - w * 0.34, x + ww * 0.65, y - w * 0.32); ctx.quadraticCurveTo(x, y - w * 0.3, x - ww * 0.65, y - w * 0.32); ctx.fill(); } };
  pag(x0 + W * 0.2, y1 - u * 2.6, u * 2.6); pag(x0 + W * 0.82, y1 - u * 2.6, u * 2.1);
  // pine trees
  for (const [fx, s] of [[0.06, 1], [0.4, 0.8], [0.62, 1.1], [0.95, 0.9]]) { const x = x0 + W * fx, b = y1 - u * 2.2; ctx.fillStyle = '#5a3d22'; ctx.fillRect(x - u * 0.08, b - u * 2 * s, u * 0.16, u * 2 * s); for (let k = 0; k < 4; k++) { blob(ctx, x + (k % 2 ? 0.45 : -0.4) * u * s, b - u * (1.3 + k * 0.45) * s, u * 0.8 * s, '#2f6a44', 0.2, 0.3); } }
  // wall with tiled cap
  const wy = y1 - u * 2.4; ctx.fillStyle = vgrad(ctx, wy, y1, [[0, '#f4ecd8'], [1, '#d8cbae']]); ctx.fillRect(x0, wy, W, u * 2.4);
  ctx.fillStyle = '#2b2e34'; ctx.fillRect(x0, wy - u * 0.35, W, u * 0.4); for (let x = x0; x < x0 + W; x += u * 0.35) { ctx.fillStyle = '#3a3e46'; ctx.fillRect(x, wy - u * 0.5, u * 0.22, u * 0.2); }
  ctx.fillStyle = '#a8321f'; ctx.fillRect(x0, wy + u * 0.05, W, u * 0.1);
  // moon gate
  const gx = x0 + W * 0.5, gy = y1 - u * 1.15, gr = u * 1.15;
  ctx.fillStyle = '#d9a441'; circ(ctx, gx, gy, gr + u * 0.14); ctx.fillStyle = '#a8321f'; circ(ctx, gx, gy, gr + u * 0.05);
  ctx.fillStyle = vgrad(ctx, gy - gr, gy + gr, [[0, '#9cc4a8'], [1, '#4a7a58']]); circ(ctx, gx, gy, gr);
  ctx.fillStyle = '#2f6a44'; circ(ctx, gx - gr * 0.25, gy + gr * 0.2, gr * 0.5); ctx.fillStyle = '#e8b0b8'; for (let k = 0; k < 8; k++) circ(ctx, gx + (hash(k) - 0.5) * gr * 1.2, gy + (hash(k + 5) - 0.5) * gr * 0.9, u * 0.1);
  // lanterns
  for (const fx of [0.12, 0.3, 0.7, 0.88]) { const x = x0 + W * fx, y = wy + u * 0.45; ctx.strokeStyle = '#4a2a1a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, wy); ctx.lineTo(x, y); ctx.stroke(); const g = ctx.createRadialGradient(x, y + u * 0.4, 1, x, y + u * 0.4, u * 0.9); g.addColorStop(0, 'rgba(255,200,120,0.5)'); g.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = g; ctx.fillRect(x - u, y - u * 0.4, u * 2, u * 2); ctx.fillStyle = vgrad(ctx, y, y + u * 0.8, [[0, '#e8453a'], [1, '#a8321f']]); ctx.beginPath(); ctx.ellipse(x, y + u * 0.4, u * 0.3, u * 0.4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#d9a441'; ctx.fillRect(x - u * 0.15, y - u * 0.02, u * 0.3, u * 0.06); ctx.fillRect(x - u * 0.15, y + u * 0.76, u * 0.3, u * 0.06); }
}

// ---- school yard (four square): brick school with a clock, hoop on a pole, chain-link, trees --------------------------------------------
function schoolyard(ctx, x0, W, y0, y1, pal, LK, t) {
  const H = y1 - y0, u = H / 10;
  skyFill(ctx, x0, W, y0, y1, pal, 0.5);
  treeRow(ctx, x0, W, y1 - u * 2.2, u * 1.4, pal.mid, 41, 8);
  const bx = x0 + W * 0.1, bw = W * 0.8, bb = y1 - u * 1.9, bh = u * 4.6;
  ctx.fillStyle = vgrad(ctx, bb - bh, bb, [[0, '#b45a40'], [1, '#8a3e2c']]); ctx.fillRect(bx, bb - bh, bw, bh);
  const bhh = u * 0.2; ctx.strokeStyle = 'rgba(0,0,0,0.14)'; ctx.lineWidth = 1; for (let y = bb - bh; y < bb; y += bhh) { ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx + bw, y); ctx.stroke(); }
  ctx.fillStyle = '#e8dfc8'; ctx.fillRect(bx - u * 0.2, bb - bh - u * 0.3, bw + u * 0.4, u * 0.4); ctx.fillRect(bx, bb - bh * 0.5, bw, u * 0.15);
  const cols = Math.max(4, Math.round(bw / (u * 1.5)));
  for (let r = 0; r < 2; r++) for (let i = 0; i < cols; i++) { const wx = bx + bw * ((i + 0.2) / cols), ww = bw / cols * 0.6; window2(ctx, wx, bb - bh * (r ? 0.46 : 0.9) + u * 0.2, ww, bh * 0.34, '#f4efe0', '#a8cce4'); }
  ctx.fillStyle = '#e8dfc8'; poly(ctx, [[bx + bw / 2 - u * 1.5, bb - bh - u * 0.3], [bx + bw / 2 + u * 1.5, bb - bh - u * 0.3], [bx + bw / 2, bb - bh - u * 1.6]]); ctx.fill();
  ctx.fillStyle = '#f6f3ea'; circ(ctx, bx + bw / 2, bb - bh - u * 0.75, u * 0.38); ctx.strokeStyle = '#2a2a30'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx + bw / 2, bb - bh - u * 0.75); ctx.lineTo(bx + bw / 2, bb - bh - u * 1.0); ctx.moveTo(bx + bw / 2, bb - bh - u * 0.75); ctx.lineTo(bx + bw / 2 + u * 0.16, bb - bh - u * 0.7); ctx.stroke();
  ctx.fillStyle = '#4a2e22'; rrect(ctx, bx + bw / 2 - u * 0.6, bb - u * 1.5, u * 1.2, u * 1.5, u * 0.1); ctx.fill();
  // basketball hoop on a pole at the right
  const hx = x0 + W * 0.9; ctx.fillStyle = '#6a707a'; ctx.fillRect(hx - 3, y1 - u * 5, 6, u * 5); ctx.fillStyle = '#f4f4ee'; ctx.fillRect(hx - u * 0.9, y1 - u * 5.3, u * 1.5, u * 1.1); ctx.strokeStyle = '#d8453a'; ctx.lineWidth = 2; ctx.strokeRect(hx - u * 0.55, y1 - u * 4.7, u * 0.7, u * 0.5); ctx.strokeStyle = '#e8743a'; ctx.beginPath(); ctx.ellipse(hx - u * 0.2, y1 - u * 4.1, u * 0.4, u * 0.1, 0, 0, TAU); ctx.stroke();
  // chain-link fence
  const fy = y1 - u * 1.9; ctx.fillStyle = 'rgba(40,46,54,0.18)'; ctx.fillRect(x0, fy, W, u * 1.9); ctx.strokeStyle = 'rgba(200,206,214,0.55)'; ctx.lineWidth = 1; const m = Math.max(6, u * 0.28);
  ctx.beginPath(); for (let k = -u * 2; k < W + u * 2; k += m) { ctx.moveTo(x0 + k, fy); ctx.lineTo(x0 + k + u * 1.9, y1); ctx.moveTo(x0 + k + u * 1.9, fy); ctx.lineTo(x0 + k, y1); } ctx.stroke();
  ctx.fillStyle = '#8a929a'; for (let x = x0 + 8; x < x0 + W; x += Math.max(70, W / 6)) ctx.fillRect(x - 2.5, fy - u * 0.1, 5, u * 2); ctx.fillStyle = '#a6aeb6'; ctx.fillRect(x0, fy - u * 0.1, W, 4);
  pennants(ctx, x0 - 10, x0 + W + 10, y0 + u * 0.6, u * 0.8, 20, ['#d8453a', '#f2c230', '#2d6bb0', '#3a9a5a', '#f4f0e6'], t);
}

export const VENUES = { pavilion, clayclub, village, pubgarden, moongate, schoolyard };
export const VENUE_KINDS = Object.keys(VENUES);
export function drawVenue(ctx, kind, R, y0, y1, pal, LK, t) {
  const f = VENUES[kind]; if (!f || y1 - y0 < 20) return false;
  ctx.save(); ctx.beginPath(); ctx.rect(R.x, y0, R.w, y1 - y0); ctx.clip();
  f(ctx, R.x, R.w, y0, y1, pal, LK, t);
  ctx.restore();
  return true;
}

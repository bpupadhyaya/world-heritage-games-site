// Theatre: Aragoz (Cairo). A tall narrow khayamiya-cloth booth in a lane at dusk; glove puppets pop up in its window.
import { register } from '../theatres.js';
import { drawFigure, mix, dark, light, alpha, poly, vgrad, hgrad } from '../figures.js';
import { TAU, clamp, vignette, lantern, tassel } from '../kit.js';
import { pattern } from '../skins.js';

const hs = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---- the glove puppet: wooden head, cloth body, no legs -------------------------------------------------------
function puppet(T) {
  const { ctx, c, o, kind, s, t, talk, breath, hands, shoulders, knees, head } = T;
  if (['beast', 'camel', 'duck', 'croc', 'monkey'].includes(kind)) return false;
  const nm = `${c.name ?? ''}`.toLowerCase();
  const who = /aragoz/.test(nm) ? 'aragoz' : /constable|police/.test(nm) ? 'cop' : /loud/.test(nm) ? 'loud' : /layla|aunt|woman|girl|mother/.test(nm) ? 'woman' : kind === 'trader' ? 'vendor' : kind === 'child' ? 'boy' : kind === 'clown' ? 'aragoz' : 'man';
  const fat = who === 'loud' ? 1.28 : who === 'boy' ? 0.8 : who === 'cop' ? 1.08 : 1;
  const hr = s * (who === 'boy' ? 0.165 : who === 'aragoz' ? 0.2 : who === 'loud' ? 0.2 : 0.18);
  const body = c.color ?? '#9a5b3a', acc = c.accent ?? '#e6b84a';
  const skinC = c.skin ?? (who === 'woman' ? '#e4b48e' : who === 'aragoz' ? '#d9a066' : '#d3a074');
  const op = Math.abs(talk);
  const sy = -s * 0.5 - (o.speaking ? op * s * 0.012 : 0) - breath * s * 0.004;
  const wT = s * 0.2 * fat, w0 = s * 0.34 * fat;
  ctx.save();
  ctx.rotate((o.lean ?? 0) * 0.5);
  // galabeya: a bell of cloth
  ctx.beginPath(); ctx.moveTo(-w0, s * 0.1); ctx.lineTo(-w0, 0); ctx.bezierCurveTo(-w0 * 0.95, sy * 0.5, -wT * 1.2, sy * 0.8, -wT, sy);
  ctx.quadraticCurveTo(0, sy - s * 0.05, wT, sy); ctx.bezierCurveTo(wT * 1.2, sy * 0.8, w0 * 0.95, sy * 0.5, w0, 0); ctx.lineTo(w0, s * 0.1); ctx.closePath();
  const bc = who === 'cop' ? '#cfc6a6' : who === 'vendor' ? '#e8e2cc' : body;
  ctx.fillStyle = hgrad(ctx, -w0, w0, [[0, light(bc, 0.22)], [0.5, bc], [1, dark(bc, 0.42)]]); ctx.fill();
  ctx.save(); ctx.clip();
  if (who === 'aragoz') { const cols = ['#c0392b', '#f1c40f', '#2e8b57', '#f4e6c0']; for (let i = -6; i < 6; i++) { ctx.fillStyle = alpha(cols[(i + 6) % 4], 0.85); ctx.fillRect(i * w0 / 3.2, sy - s * 0.1, w0 / 3.2, s * 0.7); } }
  else if (who === 'woman') { ctx.fillStyle = alpha(acc, 0.9); poly(ctx, [[-wT * 0.5, sy], [wT * 0.5, sy], [wT * 0.25, -s * 0.12], [-wT * 0.25, -s * 0.12]]); ctx.fill(); ctx.fillStyle = '#fff3c4'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(0, sy + s * (0.05 + i * 0.07), s * 0.014, 0, TAU); ctx.fill(); } }
  else if (who === 'vendor') { ctx.fillStyle = '#f7f1dd'; ctx.fillRect(-w0 * 0.55, sy + s * 0.12, w0 * 1.1, s * 0.5); ctx.fillStyle = alpha(acc, 0.8); ctx.fillRect(-w0 * 0.55, sy + s * 0.12, w0 * 1.1, s * 0.03); }
  else if (who === 'cop') { ctx.fillStyle = '#2a2a30'; ctx.fillRect(-w0, -s * 0.3, w0 * 2, s * 0.04); for (let i = 0; i < 3; i++) { ctx.fillStyle = '#e8c04a'; ctx.beginPath(); ctx.arc(0, sy + s * (0.07 + i * 0.1), s * 0.017, 0, TAU); ctx.fill(); } }
  else if (who === 'loud') { for (let i = -4; i < 4; i++) { ctx.fillStyle = 'rgba(0,0,0,0.13)'; ctx.fillRect(i * w0 / 2.5, sy, w0 / 5, s); } }
  else if (who === 'boy') { ctx.fillStyle = alpha(acc, 0.8); ctx.fillRect(-w0, sy + s * 0.1, w0 * 2, s * 0.07); }
  ctx.fillStyle = alpha(acc, 0.9); ctx.fillRect(-w0, -s * 0.05, w0 * 2, s * 0.05);
  ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(-wT * 0.6, sy, wT * 0.35, s * 0.6);
  ctx.restore();
  ctx.strokeStyle = dark(bc, 0.6); ctx.lineWidth = Math.max(1, s * 0.012); ctx.stroke();
  // sleeves and mitten hands
  const arm = (side, ang) => {
    const sx = side * wT * 0.92, sy2 = sy + s * 0.04, len = s * 0.3;
    const hx = sx + side * Math.sin(ang) * len, hy = sy2 + Math.cos(ang) * len * 0.9;
    ctx.lineCap = 'round'; ctx.strokeStyle = dark(bc, 0.6); ctx.lineWidth = s * 0.14 + 2; ctx.beginPath(); ctx.moveTo(sx, sy2); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.strokeStyle = who === 'cop' ? '#bdb48f' : dark(bc, 0.1); ctx.lineWidth = s * 0.125; ctx.stroke();
    ctx.fillStyle = skinC; ctx.beginPath(); ctx.arc(hx, hy, s * 0.062, 0, TAU); ctx.fill(); ctx.strokeStyle = dark(skinC, 0.5); ctx.lineWidth = 1; ctx.stroke();
    return [hx, hy];
  };
  const h1 = arm(-1, o.a1 ?? 0.1), h2 = arm(1, o.a2 ?? 0.1);
  // right-hand prop
  const pr = c.prop && c.prop !== 'none' ? c.prop : '';
  if (who === 'cop' || who === 'aragoz' || /stick|staff|club/.test(pr)) {
    ctx.strokeStyle = who === 'cop' ? '#2a1a10' : '#c8923a'; ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.moveTo(h2[0] - s * 0.03, h2[1] + s * 0.08); ctx.lineTo(h2[0] + s * 0.16, h2[1] - s * 0.34); ctx.stroke();
  } else if (who === 'vendor' || /tray|basket|bag/.test(pr)) {
    ctx.fillStyle = '#b8892f'; ctx.beginPath(); ctx.ellipse(h2[0], h2[1] - s * 0.01, s * 0.17, s * 0.04, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#e0457b', '#f5a623', '#7ac143', '#f7f0d0'][i]; ctx.beginPath(); ctx.arc(h2[0] + (i - 1.5) * s * 0.07, h2[1] - s * 0.045, s * 0.032, 0, TAU); ctx.fill(); }
  }
  // head
  const hy = sy - hr * 0.88;
  ctx.fillStyle = dark(skinC, 0.35); ctx.fillRect(-hr * 0.3, sy - hr * 0.2, hr * 0.6, hr * 0.4);
  for (const e of [-1, 1]) { ctx.fillStyle = dark(skinC, 0.12); ctx.beginPath(); ctx.ellipse(e * hr * 0.98, hy + hr * 0.05, hr * (who === 'boy' ? 0.3 : 0.18), hr * 0.3, 0, 0, TAU); ctx.fill(); }
  const hg = ctx.createRadialGradient(-hr * 0.35, hy - hr * 0.4, hr * 0.1, 0, hy, hr * 1.2); hg.addColorStop(0, light(skinC, 0.38)); hg.addColorStop(0.6, skinC); hg.addColorStop(1, dark(skinC, 0.42));
  ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(0, hy, hr * 1.02, hr * 1.05, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = dark(skinC, 0.62); ctx.lineWidth = Math.max(1, s * 0.012); ctx.stroke();
  // hats first for hair-line reading, then face
  const topY = hy - hr * 0.95;
  if (who === 'aragoz') { // tall drooping cone with bands and a tassel
    const ax = hr * 0.25 + Math.sin(t * 2.2) * s * 0.025 + (o.speaking ? talk * s * 0.02 : 0), ay = topY - s * 0.36;
    ctx.fillStyle = vgrad(ctx, ay, topY, [[0, '#d63a2b'], [1, '#8f1d17']]); ctx.beginPath(); ctx.moveTo(-hr * 0.98, topY + hr * 0.3); ctx.quadraticCurveTo(-hr * 0.4, topY - s * 0.1, ax, ay); ctx.quadraticCurveTo(hr * 0.5, topY - s * 0.12, hr * 0.98, topY + hr * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.moveTo(-hr * 0.92, topY + hr * 0.22); ctx.quadraticCurveTo(0, topY + hr * 0.02, hr * 0.92, topY + hr * 0.22); ctx.lineTo(hr * 0.98, topY + hr * 0.4); ctx.quadraticCurveTo(0, topY + hr * 0.2, -hr * 0.98, topY + hr * 0.4); ctx.fill();
    ctx.fillStyle = '#2e8b57'; ctx.beginPath(); ctx.arc(ax, ay, s * 0.04, 0, TAU); ctx.fill();
  } else if (who === 'woman') { // tarha: a coloured headscarf falling to the shoulders
    ctx.fillStyle = vgrad(ctx, topY, sy + s * 0.1, [[0, light(acc, 0.1)], [1, dark(acc, 0.4)]]); ctx.beginPath(); ctx.moveTo(0, topY - hr * 0.2);
    ctx.bezierCurveTo(hr * 1.5, topY, hr * 1.35, hy + hr * 0.7, hr * 1.5, sy + s * 0.06); ctx.lineTo(hr * 0.9, sy + s * 0.08); ctx.lineTo(hr * 0.85, hy + hr * 0.1); ctx.quadraticCurveTo(0, hy - hr * 0.8, -hr * 0.85, hy + hr * 0.1); ctx.lineTo(-hr * 0.9, sy + s * 0.08); ctx.lineTo(-hr * 1.5, sy + s * 0.06);
    ctx.bezierCurveTo(-hr * 1.35, hy + hr * 0.7, -hr * 1.5, topY, 0, topY - hr * 0.2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff3c4'; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.arc(i * hr * 0.3, topY + hr * 0.1 + Math.abs(i) * hr * 0.1, s * 0.012, 0, TAU); ctx.fill(); }
  } else if (who === 'loud') { // white wrapped turban over a fez
    ctx.fillStyle = vgrad(ctx, topY - hr * 0.6, topY + hr * 0.4, [[0, '#ffffff'], [1, '#c9c2ae']]); ctx.beginPath(); ctx.ellipse(0, topY - hr * 0.1, hr * 1.18, hr * 0.62, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(80,70,50,0.45)'; ctx.lineWidth = 1.5; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * hr * 0.45, topY - hr * 0.62); ctx.quadraticCurveTo(i * hr * 0.6, topY - hr * 0.1, i * hr * 0.5, topY + hr * 0.45); ctx.stroke(); }
  } else if (who === 'boy') { ctx.fillStyle = '#f4efe0'; ctx.beginPath(); ctx.ellipse(0, topY + hr * 0.35, hr * 0.92, hr * 0.62, 0, Math.PI, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,0.12)'; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * hr * 0.28, topY + hr * 0.3); ctx.lineTo(i * hr * 0.25, topY - hr * 0.15); ctx.stroke(); }
  } else { // tarboosh (a taller dark one with a badge for the constable)
    const cop = who === 'cop', th = s * (cop ? 0.2 : 0.15), tw = hr * 0.9;
    ctx.fillStyle = vgrad(ctx, topY - th, topY + hr * 0.2, [[0, cop ? '#4a4a52' : '#d23b2f'], [1, cop ? '#1c1c22' : '#8f1d17']]);
    poly(ctx, [[-tw, topY + hr * 0.25], [-tw * 0.84, topY - th], [tw * 0.84, topY - th], [tw, topY + hr * 0.25]]); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#141414'; ctx.lineWidth = 2; const sw = Math.sin(t * 3 + s) * s * 0.02; ctx.beginPath(); ctx.moveTo(0, topY - th); ctx.quadraticCurveTo(tw * 0.8 + sw, topY - th - s * 0.02, tw * 0.9 + sw, topY + hr * 0.05); ctx.stroke();
    ctx.fillStyle = '#141414'; ctx.beginPath(); ctx.arc(tw * 0.9 + sw, topY + hr * 0.12, s * 0.025, 0, TAU); ctx.fill();
    if (cop) { ctx.fillStyle = '#e8c04a'; ctx.beginPath(); ctx.arc(0, topY - th * 0.4, s * 0.034, 0, TAU); ctx.fill(); }
  }
  // face
  const ey = hy - hr * 0.1, ex = hr * 0.4;
  for (const e of [-1, 1]) {
    ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.ellipse(e * ex, ey, hr * 0.22, hr * 0.19, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = dark(skinC, 0.6); ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#1c130e'; ctx.beginPath(); ctx.arc(e * ex + hr * 0.07, ey, hr * 0.1, 0, TAU); ctx.fill();
    ctx.strokeStyle = who === 'woman' ? '#1c130e' : dark(c.hair ?? '#2a1c14', 0.2); ctx.lineWidth = Math.max(2, hr * (who === 'aragoz' || who === 'cop' ? 0.16 : 0.1));
    ctx.beginPath(); ctx.moveTo(e * ex - hr * 0.26, ey - hr * 0.3 - (who === 'aragoz' ? e * hr * 0.05 : 0)); ctx.lineTo(e * ex + hr * 0.26, ey - hr * 0.3 + (who === 'aragoz' ? e * hr * 0.05 : 0)); ctx.stroke();
    ctx.fillStyle = 'rgba(214,70,60,0.3)'; ctx.beginPath(); ctx.arc(e * hr * 0.66, hy + hr * 0.35, hr * 0.2, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = dark(skinC, 0.22); ctx.beginPath(); ctx.ellipse(hr * 0.06, hy + hr * 0.18, hr * (who === 'aragoz' ? 0.2 : 0.15), hr * 0.2, 0, 0, TAU); ctx.fill();
  if (who === 'aragoz') { ctx.fillStyle = '#d6352a'; ctx.beginPath(); ctx.arc(hr * 0.06, hy + hr * 0.2, hr * 0.17, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(hr * 0.02, hy + hr * 0.14, hr * 0.05, 0, TAU); ctx.fill();
  if (['man', 'vendor', 'cop', 'loud'].includes(who)) { // moustache
    ctx.fillStyle = who === 'loud' ? '#141010' : '#2a1c14'; const mw = hr * (who === 'loud' ? 0.78 : 0.55);
    for (const e of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, hy + hr * 0.4); ctx.quadraticCurveTo(e * mw * 0.6, hy + hr * 0.3, e * mw, hy + hr * (0.5 - (who === 'cop' ? 0.2 : 0))); ctx.quadraticCurveTo(e * mw * 0.5, hy + hr * 0.56, 0, hy + hr * 0.5); ctx.fill(); }
  }
  const mo = 0.1 + (o.speaking ? op * 0.55 : 0) + (who === 'loud' ? 0.12 : 0), mw2 = hr * (who === 'aragoz' ? 0.62 : 0.4);
  ctx.fillStyle = '#5a0f0c'; ctx.beginPath(); ctx.ellipse(0, hy + hr * 0.68, mw2, hr * mo, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f7f0dc'; ctx.fillRect(-mw2 * 0.7, hy + hr * 0.68 - hr * mo * 0.9, mw2 * 1.4, hr * mo * 0.4);
  if (who === 'woman') { ctx.strokeStyle = '#e8c04a'; ctx.lineWidth = 2; for (const e of [-1, 1]) { ctx.beginPath(); ctx.arc(e * hr * 1.0, hy + hr * 0.55, hr * 0.17, 0, TAU); ctx.stroke(); } }
  if (who === 'woman') { ctx.fillStyle = '#c14a5a'; ctx.beginPath(); ctx.ellipse(0, hy + hr * 0.68, mw2 * 0.9, hr * 0.06, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
  hands.push([h1[0], h1[1]], [h2[0], h2[1]]); shoulders.push([-wT, sy], [wT, sy]); knees.push([-w0 * 0.4, -s * 0.1], [w0 * 0.4, -s * 0.1]);
  head.x = 0; head.y = hy; head.r = hr;
  return true;
}

// ---- the lane at dusk and the booth ----------------------------------------------------------------------------
function khayamiyaMedallion(ctx, cx, cy, r) {
  const cols = ['#0e0e12', '#f1c40f', '#2e8b57', '#c0392b', '#1e3f8a', '#f4e6c0'];
  for (let i = 0; i < cols.length; i++) { const rr = r * (1 - i * 0.15); ctx.fillStyle = cols[i]; ctx.beginPath(); for (let k = 0; k < 16; k++) { const a = -Math.PI / 2 + k * Math.PI / 8, q = k % 2 ? rr * 0.72 : rr; k ? ctx.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q) : ctx.moveTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } ctx.closePath(); ctx.fill(); }
}
function mashrabiya(ctx, x, y, w, h, t, seed) {
  ctx.fillStyle = '#3a2412'; ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#ffcf70'); g.addColorStop(1, '#d9782a'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#4a2a14'; ctx.lineWidth = 1.5; ctx.beginPath();
  const n = Math.max(3, Math.round(w / 9)), m = Math.max(4, Math.round(h / 9));
  for (let i = 0; i <= n; i++) { ctx.moveTo(x + w * i / n, y); ctx.lineTo(x + w * i / n, y + h); }
  for (let j = 0; j <= m; j++) { ctx.moveTo(x, y + h * j / m); ctx.lineTo(x + w, y + h * j / m); }
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) if ((i + j + seed) % 2 === 0) { const cx = x + w * (i + 0.5) / n, cy = y + h * (j + 0.5) / m; ctx.moveTo(cx - w / n / 2, cy); ctx.lineTo(cx, cy - h / m / 2); ctx.lineTo(cx + w / n / 2, cy); ctx.lineTo(cx, cy + h / m / 2); ctx.closePath(); }
  ctx.stroke();
  ctx.fillStyle = '#5a3418'; ctx.fillRect(x - 5, y + h + 3, w + 10, 5); ctx.fillRect(x - 5, y - 8, w + 10, 5);
}
function crowd(ctx, R, v, base) {
  const r = R.w * 0.036, n = Math.ceil(R.w / (r * 2.5)), c = v.crowd ?? { cheer: 0, mood: 0 };
  for (let row = 0; row < 2; row++) for (let i = 0; i < n; i++) {
    const h = hs(i * 3 + row * 41), x = R.x + R.w * ((i + 0.5 + (row ? 0.5 : 0)) / (n + 0.5)), rr = r * (0.8 + h * 0.4);
    const pop = c.mood > 0 ? c.cheer * (0.5 + 0.5 * Math.sin(v.t * 12 + i * 1.7)) * rr * 0.8 : 0;
    const y = base - row * rr * 0.9 - pop, lit = (i + row) % 4 === 0;
    ctx.fillStyle = row ? '#1a0e18' : '#0c060c'; ctx.beginPath(); ctx.ellipse(x, y + rr * 1.9, rr * 1.6, rr * 1.5, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = lit ? '#b87a4c' : (row ? '#1a0e18' : '#0c060c'); ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill();
    if (lit) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(x, y, rr, Math.PI * 0.2, Math.PI * 1.1); ctx.lineTo(x, y); ctx.fill(); }
    if (h > 0.55) { ctx.fillStyle = lit ? '#b3261e' : '#3a0c10'; poly(ctx, [[x - rr * 0.7, y - rr * 0.6], [x - rr * 0.55, y - rr * 1.6], [x + rr * 0.55, y - rr * 1.6], [x + rr * 0.7, y - rr * 0.6]]); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,190,110,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, rr, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    if (c.mood > 0 && c.cheer > 0.25 && i % 3 === 0 && !row) { ctx.strokeStyle = '#0c060c'; ctx.lineWidth = rr * 0.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - rr * 1.2, y + rr * 1.5); ctx.lineTo(x - rr * 1.6, y - rr * 1.2); ctx.moveTo(x + rr * 1.2, y + rr * 1.5); ctx.lineTo(x + rr * 1.6, y - rr * 1.2); ctx.stroke(); }
  }
}

function stage(g, S0, v) {
  const { ctx } = g, t = v.t, x0 = S0.x, y0 = S0.y, W = S0.w, Hh = S0.h;
  const gy = y0 + Hh * 0.87, cx = x0 + W / 2;
  // dusk sky, stars
  ctx.fillStyle = vgrad(ctx, y0, gy, [[0, '#17173e'], [0.4, '#4c2766'], [0.72, '#c8545a'], [1, '#f6ad5a']]); ctx.fillRect(x0, y0, W, Hh);
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 16; i++) { ctx.globalAlpha = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * 2 + i * 1.7)); ctx.fillRect(x0 + W * hs(i * 5), y0 + Hh * 0.3 * hs(i * 5 + 1), 1.6, 1.6); }
  ctx.globalAlpha = 1;
  // far skyline: flat roofs, water tanks and lit windows
  for (let i = 0; i < 9; i++) {
    const bw = W * (0.1 + 0.05 * hs(i)), bx = x0 + (W * i) / 8.2 - bw * 0.4, bh = Hh * (0.18 + 0.16 * hs(i + 9)), by = gy - bh - Hh * 0.04;
    ctx.fillStyle = i % 2 ? '#2b1838' : '#38203f'; ctx.fillRect(bx, by, bw, bh + Hh * 0.05);
    ctx.fillRect(bx + bw * 0.2, by - Hh * 0.02, bw * 0.22, Hh * 0.02);
    for (let k = 0; k < 4; k++) { if (hs(i * 7 + k) > 0.45) { ctx.fillStyle = '#ffc860'; ctx.fillRect(bx + bw * (0.12 + 0.22 * k), by + bh * (0.2 + 0.3 * hs(i + k)), bw * 0.1, bh * 0.1); } }
  }
  // framing house walls with mashrabiya bays
  const ww = W * 0.17;
  for (const side of [-1, 1]) {
    const wx = side < 0 ? x0 : x0 + W - ww;
    ctx.fillStyle = hgrad(ctx, wx, wx + ww, side < 0 ? [[0, '#6a3f22'], [1, '#a8693a']] : [[0, '#a8693a'], [1, '#5a3319']]); ctx.fillRect(wx, y0, ww, gy - y0 + Hh * 0.02);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let r = 0; r < 9; r++) ctx.fillRect(wx, y0 + (gy - y0) * r / 9, ww, 1.5);
    mashrabiya(ctx, wx + ww * 0.18, y0 + Hh * (side < 0 ? 0.26 : 0.36), ww * 0.64, Hh * 0.14, t, side > 0 ? 1 : 0);
    if (side < 0) mashrabiya(ctx, wx + ww * 0.25, y0 + Hh * 0.56, ww * 0.5, Hh * 0.1, t, 1);
  }
  // bunting and fanous lanterns across the lane
  const bY = y0 + Hh * 0.1;
  ctx.strokeStyle = 'rgba(30,14,8,0.8)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x0 + ww * 0.8, bY); ctx.quadraticCurveTo(cx, bY + Hh * 0.16, x0 + W - ww * 0.8, bY); ctx.stroke();
  for (let i = 1; i < 14; i++) { const f = i / 14, bx = x0 + ww * 0.8 + (W - ww * 1.6) * f, by = bY + Hh * 0.16 * 2 * f * (1 - f) * 0.5; ctx.fillStyle = ['#e0453a', '#f5c542', '#2e8b57', '#2f6fb3'][i % 4]; poly(ctx, [[bx - W * 0.018, by], [bx + W * 0.018, by], [bx, by + Hh * 0.04 + Math.sin(t * 2 + i) * 1.5]]); ctx.fill(); }
  lantern(ctx, x0 + W * 0.3, bY + Hh * 0.09, Hh * 0.03, '#d6452d', t, 0.4);
  lantern(ctx, x0 + W * 0.72, bY + Hh * 0.1, Hh * 0.034, '#2e8b57', t, 2.1);
  // ground: packed earth with cobble rows and the pool of window light
  ctx.fillStyle = vgrad(ctx, gy, y0 + Hh, [[0, '#6a4a2e'], [1, '#2a1a10']]); ctx.fillRect(x0, gy - Hh * 0.01, W, Hh * 0.14);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let r = 0; r < 4; r++) for (let i = 0; i < 12; i++) { const y = gy + Hh * (0.01 + r * 0.03); ctx.beginPath(); ctx.ellipse(x0 + W * ((i + 0.5 * (r % 2)) / 11.5), y, W * 0.03 * (1 + r * 0.3), Hh * 0.008, 0, 0, TAU); ctx.fill(); }
  // booth geometry
  const bt = y0 + Hh * 0.05, bH = gy - bt, bW = Math.min(W * 0.6, bH * 0.6), eaveY = bt + bH * 0.17;
  const edge = (y) => { const k = clamp((y - eaveY) / (gy - eaveY), 0, 1), hw = bW * 0.5 * (0.88 + 0.12 * k); return [cx - hw, cx + hw]; };
  const glow = ctx.createRadialGradient(cx, gy, 4, cx, gy, W * 0.55); glow.addColorStop(0, 'rgba(255,190,100,0.35)'); glow.addColorStop(1, 'rgba(255,190,100,0)');
  ctx.save(); ctx.translate(0, gy); ctx.scale(1, 0.22); ctx.translate(0, -gy); ctx.fillStyle = glow; ctx.fillRect(x0, gy - W * 0.55, W, W * 1.1); ctx.restore();
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(cx, gy + 2, bW * 0.62, Hh * 0.02, 0, 0, TAU); ctx.fill();
  // cloth body
  const [l0, r0] = edge(eaveY), [l1, r1] = edge(gy);
  ctx.save(); poly(ctx, [[l0, eaveY], [r0, eaveY], [r1, gy], [l1, gy]]); ctx.clip();
  ctx.fillStyle = '#a3221d'; ctx.fillRect(x0, eaveY, W, gy - eaveY);
  ctx.fillStyle = '#10100f'; ctx.fillRect(l1 - 2, eaveY, bW * 0.14, gy - eaveY); ctx.fillRect(r1 - bW * 0.12 + 2, eaveY, bW * 0.14, gy - eaveY);
  pattern(ctx, 'dots', l1, eaveY, bW * 0.13, gy - eaveY, '#f5c542', 0.9); pattern(ctx, 'dots', r1 - bW * 0.12, eaveY, bW * 0.13, gy - eaveY, '#f5c542', 0.9);
  ctx.fillStyle = '#2e8b57'; ctx.fillRect(l1 + bW * 0.13, eaveY, bW * 0.035, gy - eaveY); ctx.fillRect(r1 - bW * 0.165, eaveY, bW * 0.035, gy - eaveY);
  // front panel under the window: appliqué medallion
  const pY = eaveY + bH * 0.5, pH = gy - pY - bH * 0.07;
  ctx.fillStyle = '#1e3f8a'; ctx.fillRect(l1 + bW * 0.2, pY, bW * 0.6, pH); pattern(ctx, 'diamond', l1 + bW * 0.2, pY, bW * 0.6, pH, '#f5c542', 0.35);
  khayamiyaMedallion(ctx, cx, pY + pH / 2, Math.min(bW * 0.27, pH * 0.46));
  // hem teeth
  for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? '#f1c40f' : '#2e8b57'; const hx = l1 + (r1 - l1) * i / 12; poly(ctx, [[hx, gy - bH * 0.05], [hx + (r1 - l1) / 12, gy - bH * 0.05], [hx + (r1 - l1) / 24, gy]]); ctx.fill(); }
  ctx.fillStyle = hgrad(ctx, l1, r1, [[0, 'rgba(0,0,0,0.35)'], [0.2, 'rgba(255,255,255,0.06)'], [0.5, 'rgba(0,0,0,0.0)'], [0.8, 'rgba(255,255,255,0.06)'], [1, 'rgba(0,0,0,0.4)']]); ctx.fillRect(l1, eaveY, r1 - l1, gy - eaveY);
  ctx.restore();
  // window: dark interior, the puppets, drapes, sill
  const ww2 = bW * 0.6, wh = ww2 * 0.8, wx = cx - ww2 / 2, wy = eaveY + bH * 0.08;
  const wpath = () => { ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + wh * 0.25); ctx.quadraticCurveTo(wx, wy, cx, wy - wh * 0.05); ctx.quadraticCurveTo(wx + ww2, wy, wx + ww2, wy + wh * 0.25); ctx.lineTo(wx + ww2, wy + wh); ctx.closePath(); };
  ctx.save(); wpath(); ctx.clip();
  ctx.fillStyle = vgrad(ctx, wy, wy + wh, [[0, '#2a1450'], [1, '#6a2a58']]); ctx.fillRect(wx, wy - 4, ww2, wh + 4);
  pattern(ctx, 'dots', wx, wy, ww2, wh, '#ffd777', 0.35);
  const lg = ctx.createRadialGradient(cx, wy + wh * 0.3, 2, cx, wy + wh * 0.3, ww2 * 0.8); lg.addColorStop(0, 'rgba(255,225,150,0.38)'); lg.addColorStop(1, 'rgba(255,225,150,0)'); ctx.fillStyle = lg; ctx.fillRect(wx, wy, ww2, wh);
  const sill = wy + wh, ph = wh * 0.88;
  for (const f of v.figs) {
    if (f.alpha < 0.02 || !f.c) continue;
    const fx = cx + (f.x - 0.5) * ww2 * 1.15, rise = (1 - clamp(f.alpha, 0, 1)) * ph * 0.7, bob = Math.sin(t * 3.1 + f.x * 9) * ph * 0.018 + (f.speaking ? Math.abs(Math.sin(t * 7 + f.x)) * ph * 0.025 : 0);
    drawFigure(ctx, f.c, fx, sill + ph * 0.06 + rise - bob, ph, { t, pose: f.pose, speaking: f.speaking, flip: f.flip, a1: f.a1, a2: f.a2, lean: f.lean, walk: f.walk, alpha: 1, style: 'glove', trad: 'aragoz', noShadow: true });
  }
  ctx.restore();
  wpath(); ctx.strokeStyle = '#f5c542'; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = '#2a1008'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = vgrad(ctx, sill, sill + bH * 0.04, [[0, '#d9a45a'], [1, '#6a4020']]); ctx.fillRect(wx - bW * 0.04, sill - 1, ww2 + bW * 0.08, bH * 0.035);
  for (const e of [-1, 1]) { // little tied curtains
    const dx = cx + e * ww2 / 2;
    ctx.fillStyle = hgrad(ctx, dx - 14, dx + 14, [[0, '#f1c40f'], [0.5, '#c8872a'], [1, '#f1c40f']]);
    ctx.beginPath(); ctx.moveTo(dx, wy + wh * 0.15); ctx.quadraticCurveTo(dx - e * ww2 * 0.15, wy + wh * 0.5, dx - e * ww2 * 0.02, sill); ctx.lineTo(dx + e * ww2 * 0.1, sill); ctx.quadraticCurveTo(dx + e * ww2 * 0.04, wy + wh * 0.5, dx + e * ww2 * 0.06, wy + wh * 0.1); ctx.fill();
    tassel(ctx, dx + e * ww2 * 0.01, wy + wh * 0.55, bW * 0.02, '#e0453a');
  }
  for (let i = 0; i < 7; i++) { const vx = wx - bW * 0.04 + (ww2 + bW * 0.08) * i / 7; ctx.fillStyle = i % 2 ? '#2e8b57' : '#c0392b'; ctx.beginPath(); ctx.moveTo(vx, wy - wh * 0.02); ctx.lineTo(vx + (ww2 + bW * 0.08) / 7, wy - wh * 0.02); ctx.lineTo(vx + (ww2 + bW * 0.08) / 14, wy + wh * 0.1); ctx.fill(); }
  // peaked tent roof with striped gores, tassels and a flag
  const ex = bW * 0.62, cols = ['#c0392b', '#f4e6c0', '#2e8b57', '#f1c40f', '#1e3f8a', '#f4e6c0'];
  for (let i = 0; i < 6; i++) {
    const a = cx - ex + (ex * 2 * i) / 6, b = cx - ex + (ex * 2 * (i + 1)) / 6;
    ctx.fillStyle = vgrad(ctx, bt, eaveY, [[0, light(cols[i], 0.2)], [1, dark(cols[i], 0.3)]]);
    ctx.beginPath(); ctx.moveTo(cx, bt); ctx.quadraticCurveTo((cx + a) / 2 - 2, (bt + eaveY) / 2 + 2, a, eaveY + 2); ctx.quadraticCurveTo((a + b) / 2, eaveY + bH * 0.05, b, eaveY + 2); ctx.quadraticCurveTo((cx + b) / 2 + 2, (bt + eaveY) / 2 + 2, cx, bt); ctx.fill();
    tassel(ctx, a, eaveY + 2, bW * 0.014, cols[(i + 2) % 6]);
  }
  ctx.fillStyle = '#e8c04a'; ctx.beginPath(); ctx.arc(cx, bt - 2, bW * 0.03, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#e8c04a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, bt - 2); ctx.lineTo(cx, bt - bH * 0.06); ctx.stroke();
  ctx.fillStyle = '#d6352a'; poly(ctx, [[cx, bt - bH * 0.06], [cx + bW * 0.14 + Math.sin(t * 4) * 3, bt - bH * 0.045], [cx, bt - bH * 0.03]]); ctx.fill();
  crowd(ctx, S0, v, y0 + Hh * 1.005);
  vignette(ctx, S0, 0.3);
}

register({
  id: 'aragoz',
  look: { wall: '#2b1838', frame: '#5a3418', curtain: '#c0392b', glow: '#ffd777' },
  stage, puppet,
  skin: {
    card: { top: '#5a1a16', bot: '#2a0e14', edge: '#f5c542', inner: 'rgba(245,197,66,0.4)', ink: '#fff4dc', accent: '#ffd777', shape: 'cut', r: 14, pattern: 'zig', patCol: '#f5c542', patA: 0.13, band: 7, bandCol: '#1f6a46', bandPat: 'zig' },
    name: { fill: '#1e3f8a', fillEnd: '#c8872a', ink: '#fff4dc', edge: '#f5c542', shape: 'cut' },
    plaque: { base: '#1d3a78', hot: '#2e7a5a', end: '#e8b23a', ink: '#fff6e0', inkEnd: '#2a1008', edge: '#10100f', inner: 'rgba(245,197,66,0.55)', shape: 'cut', r: 12, pattern: 'diamond', patCol: '#f5c542', patA: 0.12, med: 'diamond', medA: '#fff0b8', medB: '#d6452d', medInk: '#2a0e08', medEdge: '#10100f' },
    meter: { fill: '#2a1030', edge: 'rgba(245,197,66,0.35)', bead: 'diamond', col: '#f5c542', ink: '#fff4dc' },
    trans: 'curtainV', transCol: '#b3261e',
    snd: { root: 300, scale: [1, 1.067, 1.333, 1.5, 1.6], hit: 'buzz', voiceWave: 'sawtooth', voiceVol: 0.04 },
    voice: 3,
  },
});
export default null;

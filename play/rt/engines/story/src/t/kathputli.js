// Theatre: kathputli (Rajasthan string puppets). Saffron-and-magenta street tent, printed cloth backdrop with mirror-work,
// marigold garlands, dholak and harmonium players, brass lamps, durrie on the ground. Legless cloth puppets with painted
// wooden heads, a gathered skirt with gold gota border, one string at the head and strings to the hands.
import { register } from '../theatres.js';
import { place, audience, spot, vignette, TAU } from '../kit.js';
import { glow, flame, arm2, ball, woodHead, seated, mix, dark, light, alpha, poly, vgrad, hgrad, rrPath } from './_stringkit.js';

const CHOLI = ['#c42a58', '#e8892a', '#2e8b57', '#6a2a9a'];

function puppet(T) {
  const { ctx, c, o, kind, s, t, phase, talk } = T;
  if (kind === 'beast' || kind === 'camel' || kind === 'croc' || kind === 'duck') return false;
  const child = kind === 'child', woman = kind === 'person' && c.robe && !c.beard, trader = kind === 'trader' || kind === 'ruler';
  const hs = s * (child ? 0.82 : 1) * (c.build && c.build < 1.3 ? c.build : 1);
  const col = c.color ?? '#2b6f8a', acc = c.accent ?? '#f2c14e', skin = c.skin ?? '#d9a070';
  const choli = CHOLI[((c.name ?? 'x').length + (kind === 'clown' ? 1 : 0)) % 4];
  const sway = Math.sin(t * 1.7 + phase) * hs * 0.01 + (o.walk ? Math.sin(t * 9 + phase) * hs * 0.025 : 0);
  const waistY = -hs * 0.4, shY = -hs * 0.62, headY = -hs * (child ? 0.73 : 0.75), hr = hs * (child ? 0.105 : 0.088);
  const lean = (o.lean ?? 0) + Math.sin(t * 1.3 + phase) * 0.018 + (o.speaking ? talk * 0.02 : 0);
  const cs = Math.cos(lean), sn = Math.sin(lean);
  const toL = (px, py) => [px * cs - (py - waistY) * sn, waistY + px * sn + (py - waistY) * cs];
  // ---- the gathered skirt (ghagra) with print and gota border
  const hw = hs * 0.215, ww = hs * 0.065;
  const skirt = () => {
    ctx.beginPath(); ctx.moveTo(-ww, waistY);
    ctx.bezierCurveTo(-ww * 1.5, waistY + hs * 0.12, -hw * 0.9 + sway, -hs * 0.14, -hw + sway, -hs * 0.015);
    for (let i = 0; i <= 8; i++) ctx.lineTo(-hw + sway + (hw * 2 * i) / 8, -hs * 0.015 + (i % 2 ? hs * 0.022 : 0) + Math.sin(t * 2 + i + phase) * hs * 0.004);
    ctx.bezierCurveTo(hw * 0.9 + sway, -hs * 0.14, ww * 1.5, waistY + hs * 0.12, ww, waistY); ctx.closePath();
  };
  ctx.save();
  skirt(); ctx.fillStyle = hgrad(ctx, -hw, hw, [[0, dark(col, 0.35)], [0.2, light(col, 0.1)], [0.4, dark(col, 0.2)], [0.6, light(col, 0.18)], [0.8, dark(col, 0.2)], [1, dark(col, 0.4)]]); ctx.fill();
  ctx.save(); skirt(); ctx.clip();
  const motif = mix(acc, '#ffffff', 0.35);
  for (let r = 0; r < 4; r++) for (let i = -3; i <= 3; i++) {
    const px = (i + (r % 2) * 0.5) * hw * 0.3 * (0.55 + r * 0.22) + sway * r * 0.2, py = waistY + hs * (0.07 + r * 0.075);
    ctx.fillStyle = alpha(motif, 0.55); ctx.beginPath(); ctx.moveTo(px, py - hs * 0.025); ctx.quadraticCurveTo(px + hs * 0.03, py, px, py + hs * 0.028); ctx.quadraticCurveTo(px - hs * 0.03, py, px, py - hs * 0.025); ctx.fill();
  }
  ctx.fillStyle = vgrad(ctx, -hs * 0.075, -hs * 0.01, [[0, '#ffe08a'], [1, '#b8860b']]); ctx.fillRect(-hw * 1.2 + sway, -hs * 0.075, hw * 2.4, hs * 0.075);
  ctx.fillStyle = dark(col, 0.2); for (let i = -6; i <= 6; i++) { const x = i * hs * 0.032 + sway; poly(ctx, [[x - hs * 0.012, -hs * 0.075], [x + hs * 0.012, -hs * 0.075], [x, -hs * 0.045]]); ctx.fill(); }
  ctx.fillStyle = alpha(acc, 0.9); ctx.fillRect(-hw * 1.2 + sway, -hs * 0.2, hw * 2.4, hs * 0.012);
  ctx.restore();
  ctx.strokeStyle = dark(col, 0.6); ctx.lineWidth = Math.max(1, hs * 0.011); skirt(); ctx.stroke();
  ctx.restore();
  // ---- upper body, rotated about the waist
  ctx.save(); ctx.translate(0, waistY); ctx.rotate(lean); ctx.translate(0, -waistY);
  const tw = hs * 0.105;
  ctx.fillStyle = hgrad(ctx, -tw, tw, [[0, dark(choli, 0.3)], [0.4, light(choli, 0.12)], [1, dark(choli, 0.35)]]);
  ctx.beginPath(); ctx.moveTo(-tw, shY); ctx.quadraticCurveTo(0, shY - hs * 0.03, tw, shY); ctx.lineTo(ww * 1.2, waistY + hs * 0.02); ctx.lineTo(-ww * 1.2, waistY + hs * 0.02); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = dark(choli, 0.55); ctx.lineWidth = Math.max(1, hs * 0.01); ctx.stroke();
  ctx.fillStyle = '#ffd24a'; ctx.fillRect(-ww * 1.25, waistY - hs * 0.012, ww * 2.5, hs * 0.03);
  ctx.beginPath(); ctx.arc(0, shY + hs * 0.045, hs * 0.016, 0, TAU); ctx.fill();
  // arms: soft cloth tubes in the choli colour, wooden hands, bangles
  const sl = hs * 0.26, aw = hs * 0.052;
  const hnd = [];
  for (const [side, ang] of [[-1, o.a1 ?? 0.12], [1, o.a2 ?? 0.12]]) {
    const r = arm2(ctx, side * tw * 0.95, shY + hs * 0.02, ang + Math.sin(t * 2 + phase + side) * 0.04, side, sl, aw, choli, 0.25);
    ball(ctx, r[2], r[3], hs * 0.032, skin);
    ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = Math.max(1.5, hs * 0.009); ctx.beginPath(); ctx.arc(r[2], r[3], hs * 0.036, 0, TAU); ctx.stroke();
    hnd.push([r[2], r[3]]);
  }
  if (c.prop === 'bag' || c.prop === 'basket') { // woven basket on the right hand
    const [bx, by] = hnd[1];
    ctx.fillStyle = vgrad(ctx, by, by + hs * 0.2, [[0, '#d9b26a'], [1, '#8a5a24']]);
    poly(ctx, [[bx - hs * 0.1, by + hs * 0.02], [bx + hs * 0.1, by + hs * 0.02], [bx + hs * 0.07, by + hs * 0.2], [bx - hs * 0.07, by + hs * 0.2]]); ctx.fill();
    ctx.strokeStyle = 'rgba(60,30,8,0.45)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 1; i < 4; i++) { ctx.moveTo(bx - hs * 0.09, by + hs * (0.02 + i * 0.045)); ctx.lineTo(bx + hs * 0.09, by + hs * (0.02 + i * 0.045)); } ctx.stroke();
    ctx.strokeStyle = '#8a5a24'; ctx.lineWidth = hs * 0.018; ctx.beginPath(); ctx.arc(bx, by + hs * 0.02, hs * 0.09, Math.PI, TAU); ctx.stroke();
  } else if (c.prop === 'staff') { ctx.strokeStyle = '#6a3f1a'; ctx.lineWidth = hs * 0.03; ctx.beginPath(); ctx.moveTo(hnd[1][0], hnd[1][1] + hs * 0.22); ctx.lineTo(hnd[1][0], hnd[1][1] - hs * 0.4); ctx.stroke(); }
  // ---- head
  ctx.fillStyle = dark(skin, 0.2); ctx.fillRect(-hr * 0.35, headY + hr * 0.7, hr * 0.7, hs * 0.07);
  if (woman) { // veil behind the face, falling over the shoulders
    const vc = c.hatColor ?? '#c42a58';
    ctx.fillStyle = vgrad(ctx, headY - hr, shY + hs * 0.12, [[0, light(vc, 0.1)], [1, dark(vc, 0.3)]]);
    ctx.beginPath(); ctx.moveTo(0, headY - hr * 1.5); ctx.bezierCurveTo(hr * 2.3, headY - hr * 1.1, hr * 2.2, shY, tw * 1.7, shY + hs * 0.12); ctx.lineTo(-tw * 1.7, shY + hs * 0.12); ctx.bezierCurveTo(-hr * 2.2, shY, -hr * 2.3, headY - hr * 1.1, 0, headY - hr * 1.5); ctx.fill();
    ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = Math.max(1.5, hs * 0.012); ctx.stroke();
  }
  woodHead(ctx, 0, headY, hr, skin, { wide: 0.9, tall: 1.1 });
  const ex = hr * 0.42, ey = headY - hr * 0.1;
  for (const sd of [-1, 1]) { // large almond eyes with kohl
    ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.moveTo(sd * ex - hr * 0.32, ey); ctx.quadraticCurveTo(sd * ex, ey - hr * 0.3, sd * ex + hr * 0.32, ey - hr * 0.05); ctx.quadraticCurveTo(sd * ex, ey + hr * 0.22, sd * ex - hr * 0.32, ey); ctx.fill();
    ctx.fillStyle = '#1c130e'; ctx.beginPath(); ctx.arc(sd * ex, ey - hr * 0.02, hr * 0.13, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#120a06'; ctx.lineWidth = Math.max(1.2, hr * 0.1); ctx.beginPath(); ctx.moveTo(sd * ex - hr * 0.34, ey); ctx.quadraticCurveTo(sd * ex, ey - hr * 0.34, sd * ex + hr * 0.38, ey - hr * 0.08); ctx.stroke();
    ctx.lineWidth = Math.max(1.5, hr * 0.13); ctx.beginPath(); ctx.moveTo(sd * ex - hr * 0.4, ey - hr * 0.52); ctx.quadraticCurveTo(sd * ex, ey - hr * 0.72, sd * ex + hr * 0.42, ey - hr * 0.48); ctx.stroke();
    ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(sd * hr * 0.9, headY + hr * 0.55, hr * 0.12, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = dark(skin, 0.2); poly(ctx, [[0, headY - hr * 0.1], [hr * 0.17, headY + hr * 0.35], [-hr * 0.17, headY + hr * 0.35]]); ctx.fill();
  ctx.fillStyle = 'rgba(210,70,60,0.28)'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * hr * 0.6, headY + hr * 0.38, hr * 0.2, 0, TAU); ctx.fill(); }
  const mo = 0.05 + (o.speaking ? Math.abs(talk) * 0.14 : 0);
  ctx.fillStyle = '#b3201e'; ctx.beginPath(); ctx.ellipse(0, headY + hr * 0.62, hr * 0.24, hr * mo * 1.2 + 1, 0, 0, TAU); ctx.fill();
  if (woman) { ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(-hr * 0.2, headY + hr * 0.42, hr * 0.12, 0, TAU); ctx.stroke(); }
  else if (!child) { // bold curled moustache
    ctx.fillStyle = '#16100c'; ctx.beginPath(); ctx.moveTo(0, headY + hr * 0.4);
    ctx.bezierCurveTo(hr * 0.5, headY + hr * 0.3, hr * 0.95, headY + hr * 0.45, hr * 1.0, headY + hr * 0.15); ctx.bezierCurveTo(hr * 0.8, headY + hr * 0.62, hr * 0.4, headY + hr * 0.58, 0, headY + hr * 0.5);
    ctx.bezierCurveTo(-hr * 0.4, headY + hr * 0.58, -hr * 0.8, headY + hr * 0.62, -hr * 1.0, headY + hr * 0.15); ctx.bezierCurveTo(-hr * 0.95, headY + hr * 0.45, -hr * 0.5, headY + hr * 0.3, 0, headY + hr * 0.4); ctx.fill();
  }
  // headgear
  const hc = c.hatColor ?? (child ? col : '#e8742a');
  if (child) { // embroidered round topi
    ctx.fillStyle = hgrad(ctx, -hr, hr, [[0, light(hc, 0.25)], [1, dark(hc, 0.3)]]);
    ctx.beginPath(); ctx.ellipse(0, headY - hr * 0.7, hr * 1.05, hr * 0.62, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(-hr * 1.05, headY - hr * 0.78, hr * 2.1, hr * 0.24);
    ctx.fillStyle = '#fff'; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(i * hr * 0.4, headY - hr * 0.66, hr * 0.07, 0, TAU); ctx.fill(); }
  } else if (!woman) { // layered turban with tail and a sarpech jewel
    const tr = trader ? 1.3 : 1.18;
    ctx.fillStyle = hgrad(ctx, -hr * tr, hr * tr, [[0, dark(hc, 0.25)], [0.4, light(hc, 0.2)], [1, dark(hc, 0.35)]]);
    ctx.beginPath(); ctx.ellipse(0, headY - hr * 0.95, hr * tr, hr * 0.95, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = alpha('#000000', 0.25); ctx.lineWidth = Math.max(1, hr * 0.1);
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-hr * tr * 0.95, headY - hr * (0.5 + i * 0.28)); ctx.quadraticCurveTo(0, headY - hr * (0.25 + i * 0.3), hr * tr * 0.95, headY - hr * (0.9 + i * 0.1)); ctx.stroke(); }
    ctx.fillStyle = dark(hc, 0.1); ctx.beginPath(); ctx.moveTo(hr * tr * 0.8, headY - hr * 0.7); ctx.quadraticCurveTo(hr * tr * 1.6, headY - hr * 0.1, hr * tr * 1.1, headY + hr * 0.9); ctx.lineTo(hr * tr * 0.7, headY + hr * 0.7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.moveTo(0, headY - hr * 1.2); ctx.quadraticCurveTo(hr * 0.3, headY - hr * 0.9, 0, headY - hr * 0.62); ctx.quadraticCurveTo(-hr * 0.3, headY - hr * 0.9, 0, headY - hr * 1.2); ctx.fill();
    ctx.fillStyle = '#d6262e'; ctx.beginPath(); ctx.arc(0, headY - hr * 0.9, hr * 0.1, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#f4efe2'; ctx.lineWidth = Math.max(1.5, hr * 0.1); ctx.beginPath(); ctx.moveTo(0, headY - hr * 1.15); ctx.quadraticCurveTo(hr * 0.5, headY - hr * 2, hr * 0.9, headY - hr * 1.7); ctx.stroke();
  }
  ctx.restore();
  T.hands.push(toL(hnd[0][0], hnd[0][1]), toL(hnd[1][0], hnd[1][1]));
  const hp = toL(0, headY - hr * 0.9); T.head.x = hp[0]; T.head.y = hp[1]; T.head.r = hr * 1.1;
  return true;
}

function stage(g, S0, v) {
  const { ctx } = g, t = v.t, W = S0.w, Hh = S0.h, X = (f) => S0.x + W * f, Y = (f) => S0.y + Hh * f;
  const floorY = Y(0.745);
  // dusk sky, fort and dunes seen beyond the open sides
  ctx.fillStyle = vgrad(ctx, S0.y, floorY, [[0, '#2e1048'], [0.45, '#b02a5a'], [0.8, '#ff9a3c'], [1, '#ffd27a']]); ctx.fillRect(S0.x, S0.y, W, floorY - S0.y);
  glow(ctx, X(0.84), Y(0.5), W * 0.32, '#ffd27a', 0.5);
  ctx.fillStyle = '#3a1038'; ctx.beginPath(); ctx.moveTo(S0.x, floorY); ctx.lineTo(S0.x, Y(0.58));
  for (let i = 0; i <= 14; i++) ctx.lineTo(X(i / 14), Y(i % 3 === 0 ? 0.5 : 0.56) - (i % 5 === 2 ? Hh * 0.06 : 0)); ctx.lineTo(S0.x + W, floorY); ctx.fill();
  // backdrop: block-printed cloth between two poles
  const cx0 = X(0.07), cw = W * 0.86, cTop = Y(0.07), cH = floorY - cTop;
  ctx.fillStyle = vgrad(ctx, cTop, floorY, [[0, '#e8892a'], [0.5, '#d4306a'], [1, '#8a1450']]); ctx.fillRect(cx0, cTop, cw, cH);
  const bu = Math.max(24, cw / 9);
  for (let r = 0; r < Math.ceil(cH / bu); r++) for (let i = 0; i < Math.ceil(cw / bu) + 1; i++) {
    const px = cx0 + i * bu + (r % 2) * bu / 2, py = cTop + bu * (r + 0.5), sw = Math.sin(t * 0.8 + r + i) * 1.2;
    if (px > cx0 + cw) continue;
    ctx.fillStyle = (r + i) % 2 ? 'rgba(255,230,150,0.32)' : 'rgba(40,120,70,0.38)';
    ctx.beginPath(); ctx.moveTo(px + sw, py - bu * 0.3); ctx.bezierCurveTo(px + bu * 0.3, py - bu * 0.1, px + bu * 0.28, py + bu * 0.28, px, py + bu * 0.28); ctx.bezierCurveTo(px - bu * 0.25, py + bu * 0.25, px - bu * 0.2, py - bu * 0.1, px + sw, py - bu * 0.3); ctx.fill();
  }
  // painted arch with mirror-work
  const ax = X(0.5), aw = Math.min(W * 0.4, cH * 0.5), ay = floorY, ah = cH * 0.78;
  ctx.fillStyle = '#1d5a58'; ctx.beginPath(); ctx.moveTo(ax - aw, ay); ctx.lineTo(ax - aw, ay - ah * 0.55); ctx.quadraticCurveTo(ax - aw, ay - ah * 0.85, ax, ay - ah); ctx.quadraticCurveTo(ax + aw, ay - ah * 0.85, ax + aw, ay - ah * 0.55); ctx.lineTo(ax + aw, ay); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 3; ctx.stroke();
  glow(ctx, ax, ay - ah * 0.45, aw * 1.3, '#ffe0a0', 0.22);
  for (let i = 0; i < 46; i++) {
    const a = Math.PI + (i / 45) * Math.PI, rr = aw * 0.88, mx = ax + Math.cos(a) * rr, my = ay - ah * 0.55 + Math.sin(a) * ah * 0.42, tw = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7);
    ctx.fillStyle = `rgba(255,${Math.round(230 + tw * 25)},200,${0.55 + tw * 0.4})`; ctx.beginPath(); ctx.arc(mx, my, Math.max(2, aw * 0.035), 0, TAU); ctx.fill();
  }
  // bottom border band (green with white zigzag)
  ctx.fillStyle = '#1d6a3a'; ctx.fillRect(cx0, floorY - Hh * 0.05, cw, Hh * 0.05);
  ctx.strokeStyle = '#f6efd8'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = 0; x <= cw; x += 12) ctx.lineTo(cx0 + x, floorY - Hh * ((x / 12) % 2 ? 0.015 : 0.04)); ctx.stroke();
  // poles, marigold swags, banner
  for (const px of [cx0, cx0 + cw]) { ctx.fillStyle = hgrad(ctx, px - 4, px + 4, [[0, '#d9a52a'], [1, '#6a4a10']]); ctx.fillRect(px - 4, S0.y, 8, floorY - S0.y + 4); ball(ctx, px, cTop - 2, 6, '#ffd24a'); }
  for (let k = 0; k < 3; k++) for (let i = 0; i <= 12; i++) {
    const f = i / 12, x = cx0 + cw * (k + f) / 3, y = Y(0.2) + Math.sin(f * Math.PI) * Hh * 0.05 + Math.sin(t * 1.2 + k + i);
    ctx.fillStyle = i % 2 ? '#f08a1c' : '#ffbf2a'; ctx.beginPath(); ctx.arc(x, y, Math.max(3, W * 0.012), 0, TAU); ctx.fill();
  }
  const bx = cx0 + 6, by = Y(0.24), bw = Math.sin(t * 1.4) * 3;
  ctx.fillStyle = '#f08a1c'; poly(ctx, [[bx, by], [bx + W * 0.1 + bw, by + Hh * 0.04], [bx, by + Hh * 0.1]]); ctx.fill();
  ctx.fillStyle = '#ffd24a'; ctx.fillRect(bx, by, 3, Hh * 0.1);
  // durrie: striped woven rug in perspective
  const fl = Hh - (floorY - S0.y);
  ctx.fillStyle = vgrad(ctx, floorY, S0.y + Hh, [[0, '#7a1a3a'], [1, '#3a0a20']]); ctx.fillRect(S0.x, floorY, W, fl);
  const cols = ['#e8892a', '#1d6a3a', '#f6efd8', '#c42a58'];
  for (let i = 0; i < 7; i++) { const y0 = floorY + fl * Math.pow(i / 7, 1.5), y1 = floorY + fl * Math.pow((i + 1) / 7, 1.5); ctx.fillStyle = alpha(cols[i % 4], i % 2 ? 0.5 : 0.28); ctx.fillRect(S0.x, y0, W, Math.max(1, (y1 - y0) * 0.4)); }
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(S0.x, floorY, W, 3);
  if (v.spotX != null) spot(ctx, S0, S0.x + W * v.spotX, Y(0.16), floorY, '#ffe0a0', 0.18);
  // musicians: harmonium (left) and dholak (right), seated on the rug
  const ms = Hh * 0.17, my = Y(0.955), nod = Math.sin(t * 5) * 0.8;
  seated(ctx, X(0.1), my, ms, { body: '#2e8b57', hat: '#f6efd8', skin: '#a0663a' });
  ctx.fillStyle = vgrad(ctx, my - ms * 0.4, my, [[0, '#8a5a24'], [1, '#3a210e']]); rrPath(ctx, X(0.1) - ms * 0.05, my - ms * 0.38, ms * 0.7, ms * 0.3, 3); ctx.fill();
  ctx.fillStyle = '#f6efd8'; for (let i = 0; i < 6; i++) ctx.fillRect(X(0.1) + ms * (0.02 + i * 0.1), my - ms * 0.38, ms * 0.06, ms * 0.1);
  seated(ctx, X(0.9), my + nod * 0.3, ms, { body: '#e8892a', hat: '#c42a58', skin: '#9a5e36' });
  ctx.fillStyle = vgrad(ctx, my - ms * 0.45, my - ms * 0.1, [[0, '#b8742c'], [1, '#5a3412']]); ctx.beginPath(); ctx.ellipse(X(0.9), my - ms * 0.28, ms * 0.36, ms * 0.14, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#d93a2a'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = -2; i <= 2; i++) { ctx.moveTo(X(0.9) + i * ms * 0.13, my - ms * 0.4); ctx.lineTo(X(0.9) + i * ms * 0.13 + 3, my - ms * 0.16); } ctx.stroke();
  // brass lamps at the front
  for (const f of [0.3, 0.7]) { const lx = X(f), ly = Y(0.9); ctx.fillStyle = vgrad(ctx, ly, ly + 8, [[0, '#ffd24a'], [1, '#8a5a10']]); ctx.beginPath(); ctx.ellipse(lx, ly + 4, 11, 5, 0, 0, TAU); ctx.fill(); flame(ctx, lx, ly, 4.5, t, f * 9); }
  // figures: strings run up under the valance to the hidden puppeteer
  const H = Math.min(Hh * 0.5, W * 0.62);
  place(ctx, S0, floorY + 2, H, v, { style: 'color', stringsY: Y(0.1) });
  // scalloped valance and the dark of the tent roof above the puppeteer
  ctx.fillStyle = vgrad(ctx, S0.y, Y(0.14), [[0, '#14060e'], [1, '#2a0a1a']]); ctx.fillRect(S0.x, S0.y, W, Y(0.14) - S0.y);
  const n = Math.max(8, Math.round(W / 38)), vy = Y(0.13), vh = Hh * 0.06;
  for (let i = 0; i < n; i++) {
    const x0 = S0.x + W * i / n, x1 = S0.x + W * (i + 1) / n, col = ['#d4306a', '#e8892a', '#1d6a3a', '#f6efd8'][i % 4];
    ctx.fillStyle = vgrad(ctx, S0.y, vy + vh * 1.2, [[0, light(col, 0.12)], [1, dark(col, 0.3)]]);
    ctx.beginPath(); ctx.moveTo(x0, S0.y); ctx.lineTo(x1, S0.y); ctx.lineTo(x1, vy); ctx.quadraticCurveTo((x0 + x1) / 2, vy + vh * 1.5, x0, vy); ctx.fill();
    ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x1, vy); ctx.quadraticCurveTo((x0 + x1) / 2, vy + vh * 1.5, x0, vy); ctx.stroke();
    ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc((x0 + x1) / 2, vy + vh * 0.92, 2.2, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(S0.x, vy + vh * 0.2, W, 4);
  for (const f of [0.3, 0.7]) glow(ctx, X(f), Y(0.9), W * 0.3, '#ff9a3c', 0.14);
  audience(ctx, S0, v, S0.y + Hh * 1.01);
  vignette(ctx, S0, 0.3);
}

register({
  id: 'kathputli',
  look: { wall: '#7a1646', floor: '#a8452a', curtain: '#c42a58', frame: '#ffd24a', glow: '#ffd777', far: '#4a0e2c', near: '#7a1a44' },
  stage, puppet,
  skin: {
    card: { top: '#7a1646', bot: '#3e0a26', edge: 'rgba(255,210,74,0.8)', inner: 'rgba(255,214,120,0.35)', ink: '#fff4dc', accent: '#ffd24a', shape: 'cut', r: 12, pattern: 'mirror', patCol: '#ffe08a', patA: 0.2 },
    name: { fill: '#e8892a', fillEnd: '#ffbf2a', ink: '#2a0a14', shape: 'cut', edge: 'rgba(255,230,160,0.7)' },
    plaque: { base: '#a8184a', hot: '#c4381e', end: '#ffbf2a', ink: '#ffffff', inkEnd: '#2a0a14', shape: 'cut', r: 12, pattern: 'scallop', patCol: '#ffd24a', patA: 0.16, med: 'flower', medA: '#fff0b8', medB: '#e8892a', medInk: '#3a0a1c', medEdge: '#7a3a08' },
    meter: { fill: '#3a0c24', bead: 'diamond', col: '#ffbf2a', ink: '#fff4dc' },
    trans: 'cloth', transCol: '#c42a58',
    snd: { root: 293, scale: [1, 1.125, 1.25, 1.5, 1.667], hit: 'tabla', voiceWave: 'sawtooth', voiceVol: 0.03 },
    voice: 5,
  },
});
export default null;

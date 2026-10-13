// Theatre: bohemian (Czech marionettes). A miniature carved-walnut baroque theatre box in a dark blue room: velvet curtain with
// gold fringe, painted town drop with spired towers, candle footlights, puppeteers' bridge with visible controllers and hands,
// children watching. Puppets: carved wooden marionettes with hinged joints, painted cheeks and felt/cloth clothes.
import { register } from '../theatres.js';
import { place, vignette, TAU } from '../kit.js';
import { drawBackdrop } from '../figures.js';
import { hash, glow, flame, seg, arm2, ball, woodHead, mix, dark, light, alpha, poly, vgrad, hgrad, rrPath } from './_stringkit.js';

const WOOD = '#c9955a', HAIR = ['#5a3a1c', '#2a1c14', '#8a5a2a'];

function goose(T) {
  const { ctx, c, o, s, t, phase } = T;
  const wob = o.walk ? Math.sin(t * 8 + phase) * s * 0.02 : Math.sin(t * 1.5 + phase) * s * 0.005, white = c.color ?? '#f4efe2', or = c.accent ?? '#e8a030';
  for (const [x, d] of [[-0.06, 1], [0.07, -1]]) { ctx.strokeStyle = or; ctx.lineWidth = s * 0.022; ctx.beginPath(); ctx.moveTo(x * s, -s * 0.2); ctx.lineTo(x * s + d * wob, 0); ctx.lineTo(x * s + d * wob + s * 0.06, 0); ctx.stroke(); }
  ctx.fillStyle = hgrad(ctx, -s * 0.22, s * 0.22, [[0, dark(white, 0.15)], [0.5, white], [1, dark(white, 0.3)]]);
  ctx.beginPath(); ctx.ellipse(0, -s * 0.3, s * 0.22, s * 0.13, -0.15, 0, TAU); ctx.fill(); ctx.strokeStyle = dark(white, 0.5); ctx.lineWidth = 1.2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.34); ctx.quadraticCurveTo(-s * 0.32, -s * 0.34, -s * 0.34, -s * 0.42); ctx.quadraticCurveTo(-s * 0.2, -s * 0.36, -s * 0.12, -s * 0.38); ctx.fill();
  ctx.fillStyle = dark(white, 0.1); ctx.beginPath(); ctx.ellipse(-s * 0.02, -s * 0.31, s * 0.12, s * 0.07, -0.25 + Math.sin(t * 6 + phase) * (o.speaking ? 0.2 : 0.02), 0, TAU); ctx.fill(); ctx.stroke();
  const nx = s * 0.16, sw = Math.sin(t * 1.8 + phase) * s * 0.012;
  ctx.strokeStyle = white; ctx.lineWidth = s * 0.06; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * 0.14, -s * 0.34); ctx.bezierCurveTo(s * 0.28, -s * 0.36, s * 0.14 + sw, -s * 0.52, nx + s * 0.04, -s * 0.62); ctx.stroke();
  ctx.fillStyle = white; ctx.beginPath(); ctx.arc(nx + s * 0.06, -s * 0.64, s * 0.05, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = or; poly(ctx, [[nx + s * 0.1, -s * 0.665], [nx + s * 0.2, -s * 0.645 + (o.speaking ? Math.sin(t * 9) * s * 0.01 : 0)], [nx + s * 0.1, -s * 0.625]]); ctx.fill();
  ctx.fillStyle = '#120a06'; ctx.beginPath(); ctx.arc(nx + s * 0.075, -s * 0.655, s * 0.009, 0, TAU); ctx.fill();
  ball(ctx, nx + s * 0.04, -s * 0.62, s * 0.012, WOOD);
  T.head.x = nx + s * 0.06; T.head.y = -s * 0.66; T.head.r = s * 0.05;
  T.shoulders.push([-s * 0.1, -s * 0.38], [s * 0.1, -s * 0.38]);
  return true;
}

function puppet(T) {
  const { ctx, c, o, kind, s, t, phase, talk } = T;
  if (kind === 'duck') return goose(T);
  if (kind === 'camel' || kind === 'croc' || kind === 'beast') return false;
  const child = kind === 'child', clown = kind === 'clown', mayor = kind === 'ruler', clerk = kind === 'person';
  const hs = s * (child ? 0.82 : 1);
  const col = c.color ?? '#2f6f9a', acc = c.accent ?? '#f0d070', cloth2 = clown ? (c.hatColor ?? '#d9a52a') : col;
  const hair = HAIR[((c.name ?? 'x').length) % 3];
  const bd = mayor ? 1.4 : child ? 0.8 : 1;
  const stp = o.walk ? Math.sin(t * 8 + phase) : 0;
  const hipY = -hs * 0.38, shY = -hs * 0.65, hr = hs * 0.09, headY = -hs * 0.79;
  const lean = o.lean ?? 0, W = hs * 0.12 * bd;
  // legs: straight wooden limbs in stockings with visible knee hinges and black shoes
  const hose = clown ? (stp > 0 ? '#c8452d' : cloth2) : '#2a2a38';
  for (const side of [-1, 1]) {
    const sw = stp * side * hs * 0.07, kx = side * hs * 0.045 + sw * 0.5, ky = hipY * 0.5 + (o.walk ? -Math.max(0, stp * side) * hs * 0.02 : 0), fx = side * hs * 0.05 + sw, fy = o.walk ? -Math.max(0, stp * side) * hs * 0.05 : 0;
    seg(ctx, side * hs * 0.045, hipY, kx, ky, hs * 0.062, clown && side > 0 ? cloth2 : hose);
    seg(ctx, kx, ky, fx, fy - hs * 0.02, hs * 0.052, clown && side > 0 ? cloth2 : hose);
    ball(ctx, kx, ky, hs * 0.03, WOOD);
    ctx.fillStyle = '#1c130e'; rrPath(ctx, fx - hs * 0.04, fy - hs * 0.035, hs * 0.14, hs * 0.045, hs * 0.02); ctx.fill();
    T.knees.push([kx, ky]);
  }
  ctx.save(); ctx.translate(0, hipY); ctx.rotate(lean); ctx.translate(0, -hipY);
  if (child) { // bell skirt over the legs
    ctx.fillStyle = hgrad(ctx, -hs * 0.2, hs * 0.2, [[0, dark(col, 0.3)], [0.4, light(col, 0.12)], [1, dark(col, 0.4)]]);
    ctx.beginPath(); ctx.moveTo(-W * 0.8, hipY - hs * 0.05); ctx.quadraticCurveTo(-hs * 0.24, hipY + hs * 0.08, -hs * 0.2, hipY + hs * 0.15); ctx.lineTo(hs * 0.2, hipY + hs * 0.15); ctx.quadraticCurveTo(hs * 0.24, hipY + hs * 0.08, W * 0.8, hipY - hs * 0.05); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f6efd8'; ctx.fillRect(-hs * 0.2, hipY + hs * 0.12, hs * 0.4, hs * 0.03);
  }
  // torso: stiff carved-block shape under cloth
  const tcol = mayor ? col : clerk ? '#3a4a3a' : col;
  ctx.fillStyle = hgrad(ctx, -W, W, [[0, dark(tcol, 0.35)], [0.35, light(tcol, 0.1)], [1, dark(tcol, 0.4)]]);
  if (mayor) { ctx.beginPath(); ctx.ellipse(0, (shY + hipY) / 2, W * 1.05, (hipY - shY) * 0.62, 0, 0, TAU); ctx.fill(); }
  else { rrPath(ctx, -W, shY, W * 2, hipY - shY + hs * 0.04, hs * 0.04); ctx.fill(); }
  ctx.strokeStyle = dark(tcol, 0.6); ctx.lineWidth = Math.max(1, hs * 0.01); ctx.stroke();
  if (clown) { ctx.save(); rrPath(ctx, -W, shY, W * 2, hipY - shY + hs * 0.04, hs * 0.04); ctx.clip(); ctx.fillStyle = cloth2; ctx.fillRect(0, shY, W, hs * 0.4); ctx.fillStyle = acc; for (let i = 0; i < 3; i++) { poly(ctx, [[-W, shY + i * hs * 0.1], [0, shY + hs * 0.05 + i * hs * 0.1], [W, shY + i * hs * 0.1]]); ctx.fill(); } ctx.restore(); }
  if (clerk) { ctx.fillStyle = '#e8e0cc'; rrPath(ctx, -W * 0.7, shY + hs * 0.08, W * 1.4, hipY - shY + hs * 0.02, hs * 0.03); ctx.fill(); ctx.strokeStyle = '#8a8470'; ctx.stroke(); }
  if (child) { ctx.fillStyle = '#f6efd8'; rrPath(ctx, -W * 0.55, shY + hs * 0.07, W * 1.1, hipY - shY - hs * 0.05, hs * 0.03); ctx.fill(); }
  ctx.fillStyle = '#d9b25a'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, shY + hs * 0.07 + i * hs * 0.07, hs * 0.012, 0, TAU); ctx.fill(); }
  if (mayor) { ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = hs * 0.02; ctx.beginPath(); ctx.arc(0, shY - hs * 0.02, W * 0.75, 0.15, Math.PI - 0.15); ctx.stroke(); ball(ctx, 0, shY + W * 0.7, hs * 0.03, '#ffd24a'); }
  if (clown || mayor || clerk) { ctx.fillStyle = '#f6efd8'; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.arc(i * hs * 0.026, shY - hs * 0.005, hs * 0.02, 0, TAU); ctx.fill(); } }
  // arms with hinged elbows and mitten hands
  const hand = [];
  for (const [side, ang] of [[-1, o.a1 ?? 0.1], [1, o.a2 ?? 0.1]]) {
    const r = arm2(ctx, side * W, shY + hs * 0.03, ang + Math.sin(t * 2 + side + phase) * 0.04, side, hs * 0.26, hs * 0.05, clown && side > 0 ? cloth2 : tcol, 0.3);
    ball(ctx, r[0], r[1], hs * 0.026, WOOD);
    ball(ctx, r[2], r[3], hs * 0.033, WOOD);
    hand.push([r[2], r[3]]);
  }
  if (c.prop === 'staff') { ctx.strokeStyle = '#5a3a14'; ctx.lineWidth = hs * 0.026; ctx.beginPath(); ctx.moveTo(hand[1][0], hand[1][1] + hs * 0.25); ctx.lineTo(hand[1][0], hand[1][1] - hs * 0.38); ctx.stroke(); }
  // head: carved wood, rosy cheeks, painted eyes, hinged jaw
  ball(ctx, 0, shY - hs * 0.03, hs * 0.03, WOOD);
  woodHead(ctx, 0, headY, hr, clown ? '#f0d4b0' : '#e8c49a', { wide: 0.92, tall: 1.05 });
  for (const sd of [-1, 1]) {
    ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.ellipse(sd * hr * 0.38, headY - hr * 0.1, hr * 0.2, hr * 0.15, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1c130e'; ctx.beginPath(); ctx.arc(sd * hr * 0.4, headY - hr * 0.1, hr * 0.09, 0, TAU); ctx.fill();
    ctx.strokeStyle = dark(hair, 0.2); ctx.lineWidth = Math.max(1.2, hr * 0.09); ctx.beginPath(); ctx.moveTo(sd * hr * 0.15, headY - hr * 0.4); ctx.quadraticCurveTo(sd * hr * 0.4, headY - hr * 0.55, sd * hr * 0.65, headY - hr * 0.35); ctx.stroke();
    ctx.fillStyle = 'rgba(214,80,70,0.42)'; ctx.beginPath(); ctx.arc(sd * hr * 0.58, headY + hr * 0.3, hr * 0.22, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = clown ? '#d6452d' : dark('#e8c49a', 0.15); ctx.beginPath(); ctx.arc(0, headY + hr * 0.12, hr * (clown ? 0.22 : 0.12), 0, TAU); ctx.fill();
  const mo = (o.speaking ? Math.abs(talk) : 0) * 0.3;
  ctx.fillStyle = '#7a1f18'; ctx.beginPath(); ctx.ellipse(0, headY + hr * 0.55 + mo * hr * 0.3, hr * (clown ? 0.4 : 0.2), hr * (0.06 + mo), 0, 0, TAU); ctx.fill();
  if (mayor) { ctx.fillStyle = '#3a2418'; ctx.beginPath(); ctx.moveTo(0, headY + hr * 0.35); ctx.bezierCurveTo(hr * 0.6, headY + hr * 0.3, hr * 0.8, headY + hr * 0.55, hr * 0.85, headY + hr * 0.3); ctx.bezierCurveTo(hr * 0.6, headY + hr * 0.6, hr * 0.2, headY + hr * 0.5, 0, headY + hr * 0.45); ctx.bezierCurveTo(-hr * 0.2, headY + hr * 0.5, -hr * 0.6, headY + hr * 0.6, -hr * 0.85, headY + hr * 0.3); ctx.bezierCurveTo(-hr * 0.8, headY + hr * 0.55, -hr * 0.6, headY + hr * 0.3, 0, headY + hr * 0.35); ctx.fill(); }
  if (c.beard || clerk) { ctx.fillStyle = '#d8d2c4'; ctx.beginPath(); ctx.moveTo(-hr * 0.8, headY + hr * 0.25); ctx.quadraticCurveTo(0, headY + hr * 2.3, hr * 0.8, headY + hr * 0.25); ctx.quadraticCurveTo(0, headY + hr * 0.7, -hr * 0.8, headY + hr * 0.25); ctx.fill(); }
  if (clerk) { ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 1.5; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * hr * 0.4, headY - hr * 0.1, hr * 0.3, 0, TAU); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-hr * 0.1, headY - hr * 0.1); ctx.lineTo(hr * 0.1, headY - hr * 0.1); ctx.stroke(); }
  // hair, cap or hat
  const top = headY - hr * 0.7;
  ctx.fillStyle = hair;
  if (child) { // braids and a dotted kerchief
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * hr * 1.0, headY + hr * 0.7, hr * 0.2, hr * 0.7, sd * 0.1, 0, TAU); ctx.fill(); ctx.fillStyle = '#d6262e'; ctx.beginPath(); ctx.arc(sd * hr * 1.0, headY + hr * 1.4, hr * 0.15, 0, TAU); ctx.fill(); ctx.fillStyle = hair; }
    ctx.fillStyle = '#c8302a'; ctx.beginPath(); ctx.ellipse(0, top - hr * 0.1, hr * 1.12, hr * 0.8, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.arc(i * hr * 0.3, top - hr * 0.35 - Math.abs(i) * hr * 0.03, hr * 0.06, 0, TAU); ctx.fill(); }
  } else if (clown) { // Kasparek: long pointed cap with a bell
    ctx.fillStyle = acc; poly(ctx, [[-hr * 1.05, top + hr * 0.15], [hr * 1.05, top + hr * 0.15], [hr * 1.3 + Math.sin(t * 2.5 + phase) * hr * 0.5, top - hr * 2.3]]); ctx.fill();
    ctx.fillStyle = '#d6262e'; poly(ctx, [[-hr * 1.05, top + hr * 0.15], [0, top + hr * 0.15], [hr * 0.6, top - hr * 1.2]]); ctx.fill();
    ball(ctx, hr * 1.3 + Math.sin(t * 2.5 + phase) * hr * 0.5, top - hr * 2.3, hr * 0.22, '#ffd24a');
  } else if (mayor) { // tricorne with plume
    ctx.fillStyle = '#1c1820'; poly(ctx, [[-hr * 1.6, top + hr * 0.1], [0, top - hr * 0.9], [hr * 1.6, top + hr * 0.1], [0, top + hr * 0.35]]); ctx.fill(); ctx.strokeStyle = '#d9b25a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = '#f6efd8'; ctx.lineWidth = hr * 0.22; ctx.beginPath(); ctx.moveTo(hr * 0.8, top - hr * 0.4); ctx.bezierCurveTo(hr * 2, top - hr * 1.8, hr * 2.6, top - hr * 1.2, hr * 1.9, top - hr * 0.5); ctx.stroke();
  } else { // flat cap over grey hair
    ctx.fillStyle = hair; ctx.beginPath(); ctx.ellipse(0, headY - hr * 0.35, hr * 1.02, hr * 0.8, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#4a5a3a'; ctx.beginPath(); ctx.ellipse(0, top - hr * 0.1, hr * 1.1, hr * 0.6, 0, Math.PI, TAU); ctx.fill(); ctx.fillRect(-hr * 1.3, top - hr * 0.1, hr * 2.6, hr * 0.2);
  }
  ctx.restore();
  const cs = Math.cos(lean), sn = Math.sin(lean), toL = (px, py) => [px * cs - (py - hipY) * sn, hipY + px * sn + (py - hipY) * cs];
  T.hands.push(toL(hand[0][0], hand[0][1]), toL(hand[1][0], hand[1][1]));
  T.shoulders.push(toL(-W, shY), toL(W, shY));
  const hp = toL(0, headY - hr * 0.6); T.head.x = hp[0]; T.head.y = hp[1]; T.head.r = hr * 1.2;
  return true;
}

function stage(g, S0, v) {
  const { ctx } = g, t = v.t, W = S0.w, Hh = S0.h, X = (f) => S0.x + W * f, Y = (f) => S0.y + Hh * f;
  // dark blue room with faint striped paper and a warm pool of candle light on the box
  ctx.fillStyle = vgrad(ctx, S0.y, S0.y + Hh, [[0, '#0c1230'], [1, '#1a2048']]); ctx.fillRect(S0.x, S0.y, W, Hh);
  ctx.fillStyle = 'rgba(120,150,255,0.05)'; for (let x = 0; x < W; x += 22) ctx.fillRect(S0.x + x, S0.y, 9, Hh);
  const bx = X(0.045), bw = W * 0.91, fr = Math.max(12, bw * 0.065), top = Y(0.035), bot = Y(0.87);
  const ox = bx + fr, ow = bw - fr * 2, oTop = Y(0.15), floorY = Y(0.72);
  glow(ctx, X(0.5), Y(0.45), W * 0.8, '#ffb347', 0.16);
  // painted drop: night sky, stars, town with spired towers
  ctx.save(); ctx.beginPath(); ctx.rect(ox, oTop, ow, bot - oTop); ctx.clip();
  const town = v.bg === 'market' || v.bg === 'street' || v.bg === 'stage';
  ctx.fillStyle = vgrad(ctx, oTop, floorY, [[0, '#1c2a5e'], [0.7, '#4a5a9a'], [1, '#e8b87a']]); ctx.fillRect(ox, oTop, ow, floorY - oTop);
  ctx.fillStyle = '#fff6c0'; for (let i = 0; i < 18; i++) { const sp = 0.5 + 0.5 * Math.sin(t * 2 + i * 1.9); ctx.globalAlpha = 0.4 + sp * 0.5; ctx.fillRect(ox + ow * hash(i + 3), oTop + (floorY - oTop) * 0.5 * hash(i + 9), 2, 2); }
  ctx.globalAlpha = 1; ctx.fillStyle = '#f6e7a8'; ctx.beginPath(); ctx.arc(ox + ow * 0.82, oTop + (floorY - oTop) * 0.24, ow * 0.045, 0, TAU); ctx.fill();
  const ch = floorY - oTop;
  if (v.bg === 'market') drawBackdrop(ctx, 'market', { x: ox, y: oTop, w: ow, h: ch }, floorY, { far: '#2a3060', near: '#6a5a8a', glow: '#ffd777', sky: false }, t);
  else { // gothic town: tall towers with pointed roofs and lit windows
    for (let i = 0; i < 7; i++) {
      const tx = ox + ow * (0.06 + i * 0.145), tw = ow * (0.06 + 0.02 * hash(i + 1)), th = ch * (0.35 + 0.35 * hash(i + 5)), wall = i % 2 ? '#3a3560' : '#2a2650';
      ctx.fillStyle = vgrad(ctx, floorY - th, floorY, [[0, light(wall, 0.15)], [1, dark(wall, 0.3)]]); ctx.fillRect(tx - tw, floorY - th, tw * 2, th);
      ctx.fillStyle = '#5a2a30'; poly(ctx, [[tx - tw * 1.25, floorY - th], [tx + tw * 1.25, floorY - th], [tx, floorY - th - th * (town ? 0.6 : 0.4)]]); ctx.fill();
      ctx.fillStyle = '#ffd777'; for (let k = 0; k < 3; k++) if (hash(i * 4 + k) > 0.35) ctx.fillRect(tx - tw * 0.25, floorY - th * (0.8 - k * 0.22), tw * 0.5, th * 0.1);
    }
  }
  ctx.restore();
  // plank floor in perspective
  ctx.fillStyle = vgrad(ctx, floorY, bot, [[0, '#4a2c14'], [1, '#8a5a2c']]); ctx.fillRect(ox, floorY, ow, bot - floorY);
  ctx.strokeStyle = 'rgba(20,10,4,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = -8; i <= 8; i++) { ctx.moveTo(X(0.5) + i * ow * 0.04, floorY); ctx.lineTo(X(0.5) + i * ow * 0.12, bot); } ctx.stroke();
  if (v.spotX != null) glow(ctx, X(0.1 + v.spotX * 0.8), floorY, Hh * 0.35, '#ffe0a0', 0.2);
  const H = Math.min((floorY - oTop) * 0.85, W * 0.55), figFloor = floorY + (bot - floorY) * 0.45, barY = oTop + Hh * 0.115;
  place(ctx, S0, figFloor, H, v, { style: 'color', stringsY: barY });
  // velvet curtains swept to the sides, valance with gold fringe
  for (const [x0, d] of [[ox, 1], [ox + ow, -1]]) {
    const w = ow * 0.2;
    ctx.fillStyle = hgrad(ctx, x0, x0 + d * w, [[0, '#4a0a14'], [0.3, '#a82234'], [0.55, '#6a1020'], [0.8, '#b02a3a'], [1, '#5a0c18']]);
    ctx.beginPath(); ctx.moveTo(x0, oTop); ctx.lineTo(x0 + d * w, oTop); ctx.bezierCurveTo(x0 + d * w, oTop + ch * 0.4, x0 + d * w * 0.3, oTop + ch * 0.5, x0 + d * w * 0.3, floorY); ctx.lineTo(x0, bot); ctx.fill();
    ctx.fillStyle = '#d9b25a'; ctx.beginPath(); ctx.arc(x0 + d * w * 0.34, oTop + ch * 0.5, 4, 0, TAU); ctx.fill();
  }
  const vh = Hh * 0.075;
  ctx.fillStyle = hgrad(ctx, ox, ox + ow, [[0, '#6a0e1c'], [0.5, '#b82a3c'], [1, '#6a0e1c']]); ctx.fillRect(ox, oTop - vh * 0.2, ow, vh);
  for (let i = 0; i < 9; i++) { const x0 = ox + ow * i / 9, x1 = ox + ow * (i + 1) / 9; ctx.fillStyle = i % 2 ? '#8a1a2a' : '#a02234'; ctx.beginPath(); ctx.moveTo(x0, oTop + vh * 0.7); ctx.quadraticCurveTo((x0 + x1) / 2, oTop + vh * 1.5, x1, oTop + vh * 0.7); ctx.fill(); ctx.strokeStyle = '#d9b25a'; ctx.lineWidth = 1.5; ctx.stroke(); }
  // puppeteers' hands gripping the controller poles
  for (const f of v.figs) {
    if (!f.c || f.alpha < 0.05) continue;
    const fx = X(f.x), sc = (f.c.scale ?? 1) * H, gy = barY - sc * 0.2;
    ctx.strokeStyle = '#0a0e22'; ctx.lineWidth = W * 0.05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(fx + W * 0.09, top + Hh * 0.01); ctx.lineTo(fx + 1, gy); ctx.stroke();
    ctx.fillStyle = '#e8c49a'; ctx.beginPath(); ctx.ellipse(fx, gy, W * 0.022, W * 0.018, 0, 0, TAU); ctx.fill();
  }
  // carved walnut box: posts, cornice and base with gilt
  const wood = (x, y, w, h) => { ctx.fillStyle = hgrad(ctx, x, x + w, [[0, '#2a160a'], [0.4, '#6a4222'], [1, '#2a160a']]); ctx.fillRect(x, y, w, h); };
  wood(bx, top, fr, bot - top + Hh * 0.02); wood(bx + bw - fr, top, fr, bot - top + Hh * 0.02);
  ctx.strokeStyle = '#d9b25a'; ctx.lineWidth = 1.5; ctx.beginPath(); for (const x0 of [bx + fr / 2, bx + bw - fr / 2]) for (let y = top + 6; y < bot; y += 11) { ctx.moveTo(x0 - fr * 0.3, y); ctx.quadraticCurveTo(x0, y + 6, x0 + fr * 0.3, y); } ctx.stroke();
  wood(bx, top, bw, oTop - top - vh * 0.2); ctx.fillStyle = '#d9b25a'; ctx.fillRect(bx, oTop - vh * 0.2 - 3, bw, 3);
  ctx.fillStyle = '#d9b25a'; ctx.beginPath(); ctx.arc(X(0.5), top + (oTop - top) * 0.45, (oTop - top) * 0.3, 0, TAU); ctx.fill(); ctx.fillStyle = '#6a0e1c'; ctx.beginPath(); ctx.arc(X(0.5), top + (oTop - top) * 0.45, (oTop - top) * 0.22, 0, TAU); ctx.fill();
  ctx.fillStyle = '#d9b25a'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(X(0.5) + sd * (oTop - top) * 0.07, top + (oTop - top) * 0.4, 1.8, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#d9b25a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(0.5), top + (oTop - top) * 0.5, (oTop - top) * 0.1, 0.2, Math.PI - 0.2); ctx.stroke();
  wood(bx - 3, bot, bw + 6, Hh * 0.03); ctx.fillStyle = '#d9b25a'; ctx.fillRect(bx - 3, bot, bw + 6, 2);
  // candle footlights
  for (let i = 0; i < 7; i++) flame(ctx, ox + ow * (i + 0.5) / 7, bot - 3, Math.max(2.5, W * 0.008), t, i * 1.7);
  glow(ctx, X(0.5), bot, W * 0.5, '#ffb347', 0.15);
  // children watching: rows of heads with caps and ribbons, a few faces lit by the candles
  const cheer = v.crowd ? v.crowd.cheer : 0, n = Math.max(7, Math.round(W / 46));
  for (let row = 0; row < 2; row++) for (let i = 0; i < n; i++) {
    const hv = hash(i * 3 + row * 17), x = X((i + 0.5 + row * 0.5) / (n + 0.5)), r = W * (row ? 0.034 : 0.042) * (0.85 + hv * 0.3);
    const y = S0.y + Hh * (row ? 0.95 : 1.0) - Math.max(0, Math.sin(t * 9 + i * 1.7)) * cheer * r * 0.5;
    ctx.fillStyle = row ? '#0a0e22' : '#05071a'; ctx.beginPath(); ctx.ellipse(x, y + r * 1.9, r * 1.7, r * 1.5, 0, Math.PI, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    if (hv > 0.55) { ctx.fillStyle = 'rgba(255,190,110,0.5)'; ctx.beginPath(); ctx.arc(x + r * 0.1, y + r * 0.1, r * 0.85, 0, TAU); ctx.fill(); ctx.fillStyle = ['#a82234', '#2f6f9a', '#d9a52a'][i % 3]; ctx.beginPath(); ctx.ellipse(x, y - r * 0.55, r * 0.95, r * 0.5, 0, Math.PI, TAU); ctx.fill(); }
    else { ctx.strokeStyle = 'rgba(255,200,120,0.3)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
  }
  vignette(ctx, S0, 0.42);
}

register({
  id: 'bohemian',
  look: { wall: '#2f2a4a', floor: '#7a5430', curtain: '#8a1f2a', frame: '#d9a52a', glow: '#ffd777', far: '#262040', near: '#4a4270' },
  stage, puppet,
  skin: {
    card: { top: '#3a2a1c', bot: '#1a0f08', edge: 'rgba(217,178,90,0.85)', inner: 'rgba(217,178,90,0.35)', ink: '#f6ead2', accent: '#f0c870', shape: 'round', r: 10, pattern: 'arab', patCol: '#d9b25a', patA: 0.09 },
    name: { fill: '#7a1624', fillEnd: '#e6b84a', ink: '#f8e6b0', shape: 'cut', edge: 'rgba(217,178,90,0.8)' },
    plaque: { base: '#7a1624', hot: '#a82234', end: '#e6b84a', ink: '#fff2dc', inkEnd: '#2a1206', shape: 'round', r: 12, pattern: 'dots', patCol: '#f0c870', patA: 0.14, med: 'star', medA: '#f6e2a0', medB: '#b8892a', medInk: '#3a1c06', medEdge: '#5a3a08' },
    meter: { fill: '#10182e', bead: 'lamp', col: '#ffc860', ink: '#f6ead2' },
    trans: 'curtainV', transCol: '#8a1426',
    snd: { root: 392, scale: [1, 1.125, 1.25, 1.333, 1.5, 1.667], hit: 'bell', voiceWave: 'sine', voiceVol: 0.03 },
    voice: 5,
  },
});
export default null;

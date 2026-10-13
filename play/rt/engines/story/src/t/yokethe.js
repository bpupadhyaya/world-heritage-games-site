// Theatre: yoke thé (Burmese marionettes). A red-lacquer and gold palace theatre with a tiered pyatthat spire, carved posts,
// painted backdrop and sheer white curtains; the hsaing waing orchestra (drum circle, gong circle, oboe, clappers) sits in
// front. Puppets: gilded jointed marionettes with flared hem panels and shoulder fans, painted white faces, tall crowns.
import { register } from '../theatres.js';
import { place, vignette, TAU } from '../kit.js';
import { hash, glow, flame, seg, arm2, ball, woodHead, seated, mix, dark, light, alpha, poly, vgrad, hgrad, rrPath } from './_stringkit.js';

const GOLD = '#f2c14e';
const goldG = (ctx, x0, x1) => hgrad(ctx, x0, x1, [[0, '#a8741a'], [0.35, '#ffe49a'], [0.6, '#e8b73c'], [1, '#8a5a10']]);

function elephant(T) {
  const { ctx, c, o, s, t, phase } = T;
  const bob = Math.sin(t * 2 + phase) * s * 0.008, st = o.walk ? Math.sin(t * 6 + phase) * s * 0.04 : Math.sin(t * 1.3 + phase) * s * 0.008;
  const grey = c.color ?? '#8a8a96', cx = 0;
  const legs = (xs, col) => { for (const [x, d] of xs) { ctx.fillStyle = hgrad(ctx, x - s * 0.05, x + s * 0.05, [[0, light(col, 0.15)], [1, dark(col, 0.4)]]); rrPath(ctx, x - s * 0.045 + d * st, -s * 0.26, s * 0.09, s * 0.26, s * 0.03); ctx.fill(); ctx.fillStyle = GOLD; ctx.fillRect(x - s * 0.047 + d * st, -s * 0.06, s * 0.094, s * 0.025); } };
  legs([[-0.16 * s, -1], [0.1 * s, 1]], dark(grey, 0.25));
  // body
  ctx.fillStyle = hgrad(ctx, -s * 0.3, s * 0.3, [[0, light(grey, 0.15)], [0.6, grey], [1, dark(grey, 0.4)]]);
  ctx.beginPath(); ctx.ellipse(cx, -s * 0.38 + bob, s * 0.27, s * 0.17, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = dark(grey, 0.5); ctx.lineWidth = 1.5; ctx.stroke();
  legs([[-0.1 * s, 1], [0.17 * s, -1]], grey);
  // gold caparison with red border and tassels
  ctx.fillStyle = goldG(ctx, -s * 0.22, s * 0.22); rrPath(ctx, -s * 0.2, -s * 0.5 + bob, s * 0.4, s * 0.22, s * 0.04); ctx.fill();
  ctx.strokeStyle = '#a8261c'; ctx.lineWidth = Math.max(2, s * 0.02); ctx.stroke();
  ctx.fillStyle = '#a8261c'; for (let i = 0; i < 5; i++) { const x = -s * 0.14 + i * s * 0.07; poly(ctx, [[x - s * 0.02, -s * 0.28 + bob], [x + s * 0.02, -s * 0.28 + bob], [x, -s * 0.2 + bob]]); ctx.fill(); }
  ctx.fillStyle = '#fff6d0'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(-s * 0.15 + i * s * 0.06, -s * 0.42 + bob + Math.sin(i + t * 3) * 1, s * 0.012, 0, TAU); ctx.fill(); }
  // head, ear, trunk, tusks
  const hx = s * 0.3, hy = -s * 0.5 + bob;
  ctx.strokeStyle = grey; ctx.lineCap = 'round'; ctx.lineWidth = s * 0.075;
  const sw = Math.sin(t * 1.6 + phase) * s * 0.04;
  ctx.beginPath(); ctx.moveTo(hx + s * 0.08, hy + s * 0.04); ctx.bezierCurveTo(hx + s * 0.2 + sw, hy + s * 0.1, hx + s * 0.22 + sw, hy + s * 0.28, hx + s * 0.12, hy + s * 0.34); ctx.stroke();
  ctx.fillStyle = hgrad(ctx, hx - s * 0.1, hx + s * 0.12, [[0, light(grey, 0.2)], [1, dark(grey, 0.3)]]); ctx.beginPath(); ctx.ellipse(hx, hy, s * 0.1, s * 0.12, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = dark(grey, 0.15); ctx.beginPath(); ctx.ellipse(hx - s * 0.06, hy + s * 0.01, s * 0.07, s * 0.12, 0.2, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#fff3d0'; ctx.lineWidth = s * 0.028; ctx.beginPath(); ctx.moveTo(hx + s * 0.05, hy + s * 0.07); ctx.quadraticCurveTo(hx + s * 0.18, hy + s * 0.14, hx + s * 0.2, hy + s * 0.04); ctx.stroke();
  ctx.fillStyle = '#a8261c'; poly(ctx, [[hx - s * 0.06, hy - s * 0.1], [hx + s * 0.07, hy - s * 0.1], [hx + s * 0.04, hy - s * 0.02], [hx - s * 0.03, hy - s * 0.02]]); ctx.fill();
  ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#120a06'; ctx.beginPath(); ctx.arc(hx + s * 0.04, hy - s * 0.01, s * 0.01, 0, TAU); ctx.fill();
  T.head.x = hx; T.head.y = hy - s * 0.1; T.head.r = s * 0.07;
  T.shoulders.push([-s * 0.12, -s * 0.52 + bob], [s * 0.14, -s * 0.52 + bob]);
  return true;
}

function puppet(T) {
  const { ctx, c, o, kind, s, t, phase, talk, walk } = T;
  if (kind === 'camel' || kind === 'croc' || kind === 'duck') return false;
  if (kind === 'beast') return elephant(T);
  const child = kind === 'child', king = c.hat === 'crown' || kind === 'ruler', commoner = c.hat === 'straw' || kind === 'child' && false;
  const hs = s * (child ? 0.8 : 1), bd = kind === 'clown' ? 1.18 : (c.build ?? 1);
  const col = c.color ?? '#a8261c', acc = c.accent ?? GOLD;
  const skin = mix(c.skin ?? '#e7c29b', '#fff8e8', 0.6);
  const bob = Math.sin(t * 2.2 + phase) * hs * 0.008 + (o.speaking ? Math.abs(talk) * hs * 0.008 : 0);
  const hipY = -hs * 0.4 + bob, shY = -hs * 0.66 + bob, headY = -hs * 0.8 + bob, hr = hs * 0.068;
  const lean = o.lean ?? 0, W = hs * 0.115 * bd;
  // legs: stiff dancing stance with out-turned knees
  const trou = commoner ? dark(col, 0.2) : mix(col, '#8a1410', 0.4);
  for (const side of [-1, 1]) {
    const stp = o.walk ? Math.sin(t * 9 + phase) * side : 0;
    const fx = side * hs * 0.1 + stp * hs * 0.07, fy = o.walk ? -Math.max(0, stp) * hs * 0.04 : 0, kx = side * hs * 0.16 + stp * hs * 0.03, ky = -hs * 0.2;
    seg(ctx, side * hs * 0.06, hipY, kx, ky, hs * 0.075, trou);
    seg(ctx, kx, ky, fx, fy - hs * 0.015, hs * 0.062, mix(trou, GOLD, 0.25));
    ctx.fillStyle = goldG(ctx, fx - hs * 0.06, fx + hs * 0.08); ctx.beginPath(); ctx.moveTo(fx - hs * 0.06, fy); ctx.quadraticCurveTo(fx + hs * 0.02, fy - hs * 0.045, fx + hs * 0.09, fy - hs * 0.07); ctx.quadraticCurveTo(fx + hs * 0.1, fy - hs * 0.01, fx + hs * 0.04, fy); ctx.fill();
    ball(ctx, kx, ky, hs * 0.028, GOLD);
    T.knees.push([kx, ky]);
  }
  ctx.save(); ctx.translate(0, hipY); ctx.rotate(lean); ctx.translate(0, -hipY);
  // flared hem panels (stiff upturned pleats)
  if (!commoner) {
    for (let i = -4; i <= 4; i++) {
      const a = i * 0.34, r0 = hs * 0.05, r1 = hs * (0.27 - Math.abs(i) * 0.01), lift = Math.abs(i) * hs * 0.012;
      const x1 = Math.sin(a) * r1, y1 = hipY + Math.cos(a) * r1 * 0.5 - lift, w = hs * 0.06;
      ctx.fillStyle = i % 2 ? goldG(ctx, x1 - w, x1 + w) : mix('#d9a52a', col, 0.2);
      poly(ctx, [[Math.sin(a) * r0 - w * 0.5, hipY - hs * 0.02], [Math.sin(a) * r0 + w * 0.5, hipY - hs * 0.02], [x1 + w, y1], [x1 - w, y1]]); ctx.fill();
      ctx.strokeStyle = '#6a3a08'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#fff3c0'; ctx.beginPath(); ctx.arc(x1, y1 - hs * 0.01, hs * 0.008, 0, TAU); ctx.fill();
    }
  }
  // shoulder fans
  if (!commoner) for (const side of [-1, 1]) for (let k = 0; k < 4; k++) {
    const a = 0.5 + k * 0.3, L = hs * (0.2 - k * 0.02), sx = side * W * 0.9, w = hs * 0.05;
    const tx = sx + side * Math.sin(a) * L, ty = shY - Math.cos(a) * L * 0.6 + hs * 0.02;
    ctx.fillStyle = k % 2 ? goldG(ctx, sx, tx) : mix('#d9a52a', '#8a3a10', 0.2); poly(ctx, [[sx, shY + hs * 0.02], [sx + side * w, shY - hs * 0.02], [tx, ty], [tx - side * w * 0.2, ty + w]]); ctx.fill();
    ctx.strokeStyle = '#6a3a08'; ctx.lineWidth = 1; ctx.stroke();
  }
  // tunic
  ctx.fillStyle = hgrad(ctx, -W, W, [[0, dark(col, 0.35)], [0.35, light(col, 0.12)], [1, dark(col, 0.4)]]);
  ctx.beginPath(); ctx.moveTo(-W, shY); ctx.quadraticCurveTo(0, shY - hs * 0.03, W, shY); ctx.lineTo(W * 0.8, hipY + hs * 0.02); ctx.lineTo(-W * 0.8, hipY + hs * 0.02); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = dark(col, 0.6); ctx.lineWidth = Math.max(1, hs * 0.01); ctx.stroke();
  if (!commoner) {
    ctx.fillStyle = goldG(ctx, -W * 0.3, W * 0.3); ctx.fillRect(-W * 0.22, shY, W * 0.44, hipY - shY);
    ctx.fillStyle = '#fff3c0'; for (let i = 0; i < 5; i++) { const sp = 0.5 + 0.5 * Math.sin(t * 4 + i * 2 + phase); ctx.globalAlpha = 0.5 + sp * 0.5; ctx.beginPath(); ctx.arc(0, shY + hs * 0.04 + i * hs * 0.045, hs * 0.009, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
    poly(ctx, [[-W, shY], [0, shY + hs * 0.07], [W, shY], [W * 0.6, shY - hs * 0.015], [-W * 0.6, shY - hs * 0.015]]); ctx.fillStyle = goldG(ctx, -W, W); ctx.fill();
  }
  // arms with elbows, gilded cuffs and white hands
  const hand = [];
  for (const [side, ang] of [[-1, o.a1 ?? 0.2], [1, o.a2 ?? 0.2]]) {
    const r = arm2(ctx, side * W * 0.95, shY + hs * 0.02, Math.max(0.35, ang) + Math.sin(t * 2.2 + side + phase) * 0.05, side, hs * 0.27, hs * 0.058, col, 0.9);
    ball(ctx, r[0], r[1], hs * 0.026, GOLD);
    ctx.fillStyle = goldG(ctx, r[2] - hs * 0.04, r[2] + hs * 0.04); ctx.beginPath(); ctx.arc(r[2], r[3], hs * 0.045, 0, TAU); ctx.fill();
    ball(ctx, r[2], r[3] + hs * 0.02, hs * 0.03, skin);
    hand.push([r[2], r[3]]);
  }
  if (c.prop === 'fan') { const [fx, fy] = hand[1]; ctx.fillStyle = goldG(ctx, fx - hs * 0.15, fx + hs * 0.15); ctx.beginPath(); ctx.moveTo(fx, fy); ctx.arc(fx, fy, hs * 0.17, -Math.PI * 0.95, -Math.PI * 0.05); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#a8261c'; ctx.lineWidth = 1.5; ctx.stroke(); }
  if (c.prop === 'staff') { ctx.strokeStyle = '#5a3a14'; ctx.lineWidth = hs * 0.028; ctx.beginPath(); ctx.moveTo(hand[1][0], hand[1][1] + hs * 0.25); ctx.lineTo(hand[1][0], hand[1][1] - hs * 0.38); ctx.stroke(); }
  // head: painted white face
  ctx.fillStyle = dark(skin, 0.2); ctx.fillRect(-hr * 0.3, headY + hr * 0.7, hr * 0.6, hs * 0.05);
  woodHead(ctx, 0, headY, hr, skin, { wide: 0.88, tall: 1.12 });
  const ey = headY - hr * 0.08;
  for (const sd of [-1, 1]) {
    ctx.strokeStyle = '#1a100a'; ctx.lineWidth = Math.max(1.2, hr * 0.09); ctx.beginPath(); ctx.moveTo(sd * hr * 0.15, ey - hr * 0.42); ctx.quadraticCurveTo(sd * hr * 0.5, ey - hr * 0.68, sd * hr * 0.8, ey - hr * 0.3); ctx.stroke();
    ctx.fillStyle = '#1a100a'; ctx.beginPath(); ctx.moveTo(sd * hr * 0.2, ey); ctx.quadraticCurveTo(sd * hr * 0.5, ey - hr * 0.2, sd * hr * 0.8, ey); ctx.quadraticCurveTo(sd * hr * 0.5, ey + hr * 0.13, sd * hr * 0.2, ey); ctx.fill();
    ctx.fillStyle = 'rgba(230,100,90,0.35)'; ctx.beginPath(); ctx.arc(sd * hr * 0.55, headY + hr * 0.4, hr * 0.2, 0, TAU); ctx.fill();
    ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(sd * hr * 0.86, headY + hr * 0.2, hr * 0.12, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = dark(skin, 0.18); poly(ctx, [[0, ey + hr * 0.05], [hr * 0.12, headY + hr * 0.38], [-hr * 0.12, headY + hr * 0.38]]); ctx.fill();
  const grin = kind === 'clown' ? 1.8 : 1;
  ctx.fillStyle = '#b3201e'; ctx.beginPath(); ctx.ellipse(0, headY + hr * 0.62, hr * 0.22 * grin, hr * (0.07 + (o.speaking ? Math.abs(talk) * 0.15 : 0)), 0, 0, TAU); ctx.fill();
  if (kind === 'clown') { ctx.fillStyle = '#d6452d'; ctx.beginPath(); ctx.arc(0, headY + hr * 0.25, hr * 0.2, 0, TAU); ctx.fill(); }
  if (c.beard) { ctx.strokeStyle = '#d8d2c4'; ctx.lineWidth = Math.max(1.5, hr * 0.12); ctx.beginPath(); ctx.moveTo(-hr * 0.3, headY + hr * 0.85); ctx.quadraticCurveTo(0, headY + hr * 1.7, hr * 0.3, headY + hr * 0.85); ctx.stroke(); }
  // headdress
  const top = headY - hr * 0.55;
  if (king) { // tall tiered gilded crown with ear fins
    for (const sd of [-1, 1]) { ctx.fillStyle = goldG(ctx, 0, sd * hr * 2); poly(ctx, [[sd * hr * 0.8, headY - hr * 0.2], [sd * hr * 2.1, headY - hr * 1.0], [sd * hr * 1.5, headY + hr * 0.2], [sd * hr * 0.9, headY + hr * 0.5]]); ctx.fill(); ctx.strokeStyle = '#6a3a08'; ctx.lineWidth = 1; ctx.stroke(); }
    for (let i = 0; i < 4; i++) {
      const w = hr * (1.1 - i * 0.22), y0 = top - i * hr * 0.75, y1 = y0 - hr * 0.85;
      ctx.fillStyle = goldG(ctx, -w, w); poly(ctx, [[-w, y0], [w, y0], [w * 0.78, y1], [-w * 0.78, y1]]); ctx.fill(); ctx.strokeStyle = '#6a3a08'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = i % 2 ? '#d6262e' : '#2e8b57'; ctx.beginPath(); ctx.arc(0, (y0 + y1) / 2, hr * 0.12, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = goldG(ctx, -hr * 0.3, hr * 0.3); poly(ctx, [[-hr * 0.38, top - hr * 3], [hr * 0.38, top - hr * 3], [0, top - hr * 4.2]]); ctx.fill();
  } else if (c.hat === 'straw') { // farmer's wide conical hat
    ctx.fillStyle = vgrad(ctx, top - hr * 1.5, top, [[0, '#e8d08a'], [1, '#a88a44']]); poly(ctx, [[-hr * 2.1, top + hr * 0.1], [hr * 2.1, top + hr * 0.1], [0, top - hr * 1.6]]); ctx.fill(); ctx.strokeStyle = '#6a5018'; ctx.lineWidth = 1; ctx.stroke();
  } else if (kind === 'clown') { // headcloth with a stiff tuft and a bell
    ctx.fillStyle = hgrad(ctx, -hr, hr, [[0, '#f4efe2'], [1, '#b8ae98']]); ctx.beginPath(); ctx.ellipse(0, top - hr * 0.1, hr * 1.05, hr * 0.7, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = col; poly(ctx, [[-hr * 0.4, top - hr * 0.6], [hr * 0.4, top - hr * 0.6], [hr * 0.9 + Math.sin(t * 3 + phase) * hr * 0.2, top - hr * 2], [0, top - hr * 1.0]]); ctx.fill();
    ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(hr * 0.9, top - hr * 2, hr * 0.2, 0, TAU); ctx.fill();
  } else { // gaung baung: silk headcloth with a folded peak and a gold band
    const hc = c.hatColor ?? acc;
    ctx.fillStyle = hgrad(ctx, -hr, hr, [[0, dark(hc, 0.25)], [0.4, light(hc, 0.2)], [1, dark(hc, 0.35)]]);
    ctx.beginPath(); ctx.ellipse(0, top - hr * 0.2, hr * 1.1, hr * 0.8, 0, Math.PI * 0.95, TAU * 1.03); ctx.fill();
    poly(ctx, [[hr * 0.3, top - hr * 0.6], [hr * 1.4, top - hr * 1.5], [hr * 1.1, top - hr * 0.3]]); ctx.fill();
    ctx.fillStyle = goldG(ctx, -hr, hr); ctx.fillRect(-hr * 1.08, top - hr * 0.22, hr * 2.16, hr * 0.2);
  }
  ctx.restore();
  const cs = Math.cos(lean), sn = Math.sin(lean), toL = (px, py) => [px * cs - (py - hipY) * sn, hipY + px * sn + (py - hipY) * cs];
  T.hands.push(toL(hand[0][0], hand[0][1]), toL(hand[1][0], hand[1][1]));
  T.shoulders.push(toL(-W, shY), toL(W, shY));
  const hp = toL(0, headY - hr * 0.5); T.head.x = hp[0]; T.head.y = hp[1]; T.head.r = hr * 1.3;
  return true;
}

function drumCircle(ctx, x, y, r, t, cheer) {
  const ry = r * 0.42;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x, y + ry * 0.2, r * 1.15, ry * 1.2, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = vgrad(ctx, y - ry, y + ry, [[0, '#d9a52a'], [1, '#6a4a10']]); ctx.beginPath(); ctx.ellipse(x, y, r * 1.08, ry * 1.1, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#7a1410'; ctx.beginPath(); ctx.ellipse(x, y, r * 0.98, ry * 0.98, 0, 0, TAU); ctx.fill();
  const drum = (i, sz, hb) => {
    const a = Math.PI * 0.5 + (i / 11) * TAU, dx = x + Math.cos(a) * r, dy = y + Math.sin(a) * ry;
    ctx.fillStyle = hgrad(ctx, dx - sz, dx + sz, [[0, '#f2c14e'], [0.5, '#a8261c'], [1, '#5a0c08']]); rrPath(ctx, dx - sz * 0.8, dy - sz * 1.5 - hb, sz * 1.6, sz * 1.7, sz * 0.5); ctx.fill();
    ctx.fillStyle = '#f4e8c4'; ctx.beginPath(); ctx.ellipse(dx, dy - sz * 1.5 - hb, sz * 0.8, sz * 0.3, 0, 0, TAU); ctx.fill();
  };
  for (let i = 0; i < 11; i++) if (Math.sin(Math.PI * 0.5 + (i / 11) * TAU) < 0) drum(i, r * 0.17, 0);
  seated(ctx, x, y + ry * 0.35, r * 0.62, { body: '#2e8b6a', hat: '#f2c14e', skin: '#b87a4a' });
  for (let i = 0; i < 11; i++) if (Math.sin(Math.PI * 0.5 + (i / 11) * TAU) >= 0) drum(i, r * 0.2, Math.abs(Math.sin(t * 6 + i)) * cheer * 2);
}

function stage(g, S0, v) {
  const { ctx } = g, t = v.t, W = S0.w, Hh = S0.h, X = (f) => S0.x + W * f, Y = (f) => S0.y + Hh * f;
  const floorY = Y(0.64), oy = Y(0.86), post = Math.max(14, W * 0.075);
  const ox = S0.x + post, ow = W - post * 2, oTop = Y(0.17);
  // red lacquer wall with gold diamond lattice
  ctx.fillStyle = vgrad(ctx, S0.y, S0.y + Hh, [[0, '#4a0806'], [1, '#7a1410']]); ctx.fillRect(S0.x, S0.y, W, Hh);
  ctx.strokeStyle = 'rgba(242,193,78,0.12)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = -Hh; k < W + Hh; k += 22) { ctx.moveTo(S0.x + k, S0.y); ctx.lineTo(S0.x + k + Hh, S0.y + Hh); ctx.moveTo(S0.x + k, S0.y + Hh); ctx.lineTo(S0.x + k + Hh, S0.y); } ctx.stroke();
  // the opening: painted backdrop by scene
  ctx.save(); ctx.beginPath(); ctx.rect(ox, oTop, ow, floorY - oTop); ctx.clip();
  const forest = v.bg === 'forest' || v.bg === 'village' || v.bg === 'river', night = v.bg === 'night' || v.bg === 'camp';
  ctx.fillStyle = vgrad(ctx, oTop, floorY, night ? [[0, '#101a3a'], [1, '#3a2a58']] : forest ? [[0, '#1d5a48'], [1, '#e8c86a']] : [[0, '#e8a43a'], [1, '#fbe29a']]); ctx.fillRect(ox, oTop, ow, floorY - oTop);
  for (let L = 0; L < 2; L++) { // layered hills and trees in gold-outlined green
    ctx.fillStyle = L ? '#2a6a3a' : '#3f8a58'; ctx.beginPath(); ctx.moveTo(ox, floorY);
    for (let i = 0; i <= 10; i++) ctx.lineTo(ox + ow * i / 10, floorY - (floorY - oTop) * (0.22 + L * 0.08 + 0.1 * Math.sin(i * 1.7 + L * 2)));
    ctx.lineTo(ox + ow, floorY); ctx.fill(); ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5; ctx.stroke();
  }
  if (!forest) { // palace: tiered golden roofs
    const px = ox + ow * 0.5, base = floorY - (floorY - oTop) * 0.18;
    for (let i = 0; i < 4; i++) { const w = ow * (0.22 - i * 0.04), y = base - i * (floorY - oTop) * 0.12; ctx.fillStyle = goldG(ctx, px - w, px + w); poly(ctx, [[px - w, y], [px + w, y], [px + w * 0.7, y - (floorY - oTop) * 0.1], [px - w * 0.7, y - (floorY - oTop) * 0.1]]); ctx.fill(); ctx.strokeStyle = '#8a3a10'; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.fillStyle = '#7a1410'; ctx.fillRect(px - ow * 0.17, base, ow * 0.34, (floorY - oTop) * 0.18);
  } else for (let i = 0; i < 5; i++) { const tx = ox + ow * (0.1 + i * 0.2), th = (floorY - oTop) * (0.55 + 0.12 * Math.sin(i * 2)); ctx.fillStyle = '#6a4a1c'; ctx.fillRect(tx - 3, floorY - th * 0.5, 6, th * 0.5); ctx.fillStyle = '#2e8a52'; ctx.beginPath(); ctx.ellipse(tx, floorY - th * 0.62, ow * 0.07, th * 0.3, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = GOLD; ctx.lineWidth = 1.2; ctx.stroke(); }
  ctx.restore();
  // lacquered stage floor with lamp reflections and sequin glints
  ctx.fillStyle = vgrad(ctx, floorY, oy, [[0, '#5a0c08'], [0.5, '#a8261c'], [1, '#5a0c08']]); ctx.fillRect(ox, floorY, ow, oy - floorY);
  for (let i = 0; i < 18; i++) { const sp = 0.5 + 0.5 * Math.sin(t * 2.5 + i * 2.3); ctx.fillStyle = `rgba(255,236,170,${0.25 * sp})`; ctx.fillRect(ox + ow * hash(i), floorY + (oy - floorY) * hash(i + 40), 2.5, 2.5); }
  ctx.fillStyle = goldG(ctx, ox, ox + ow); ctx.fillRect(ox, floorY - 2, ow, 4);
  // sheer white curtains gathered at the sides
  for (const [x0, d] of [[ox, 1], [ox + ow, -1]]) {
    const w = ow * 0.13; ctx.fillStyle = hgrad(ctx, x0, x0 + d * w, [[0, 'rgba(255,255,255,0.7)'], [0.5, 'rgba(255,255,255,0.28)'], [1, 'rgba(255,255,255,0.04)']]);
    ctx.beginPath(); ctx.moveTo(x0, oTop); ctx.lineTo(x0 + d * w, oTop); ctx.quadraticCurveTo(x0 + d * w * 0.4, (oTop + floorY) / 2, x0 + d * w * 0.2, floorY); ctx.lineTo(x0, floorY); ctx.fill();
  }
  // figures
  if (v.spotX != null) { glow(ctx, X(0.1 + v.spotX * 0.8), floorY - Hh * 0.2, Hh * 0.35, '#ffe9a8', 0.22); }
  const H = Math.min((floorY - oTop) * 0.9, W * 0.5);
  place(ctx, { x: ox, y: S0.y, w: ow, h: Hh }, floorY + Hh * 0.04, H, v, { style: 'color', stringsY: oTop + Hh * 0.01 });
  // pyatthat pelmet (three tiers, spire) and lintel
  const lin = vgrad(ctx, oTop - Hh * 0.1, oTop, [[0, '#d9a52a'], [1, '#7a4a10']]);
  ctx.fillStyle = lin; ctx.fillRect(S0.x, oTop - Hh * 0.04, W, Hh * 0.05);
  for (let i = 0; i < 3; i++) {
    const hw = W * (0.46 - i * 0.12), y1 = oTop - Hh * (0.04 + i * 0.06), y0 = y1 - Hh * 0.075;
    ctx.fillStyle = vgrad(ctx, y0, y1, [[0, '#c93a22'], [1, '#6a0e08']]); poly(ctx, [[X(0.5) - hw, y1], [X(0.5) + hw, y1], [X(0.5) + hw * 0.82, y0], [X(0.5) - hw * 0.82, y0]]); ctx.fill();
    ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = GOLD; for (let k = 0; k < 9; k++) { const x = X(0.5) - hw * 0.8 + hw * 1.6 * k / 8; poly(ctx, [[x - 4, y1], [x + 4, y1], [x, y1 + 6]]); ctx.fill(); }
  }
  ctx.fillStyle = goldG(ctx, X(0.5) - 8, X(0.5) + 8); poly(ctx, [[X(0.5) - 7, oTop - Hh * 0.2], [X(0.5) + 7, oTop - Hh * 0.2], [X(0.5), S0.y + 2]]); ctx.fill();
  // carved posts
  for (const x0 of [S0.x, S0.x + W - post]) {
    ctx.fillStyle = hgrad(ctx, x0, x0 + post, [[0, '#8a1410'], [0.5, '#d9362a'], [1, '#5a0c08']]); ctx.fillRect(x0, oTop - Hh * 0.04, post, oy - oTop + Hh * 0.04);
    ctx.fillStyle = alpha(GOLD, 0.9); for (let k = 0; k < 8; k++) { const y = oTop + k * (oy - oTop) / 8; ctx.beginPath(); ctx.ellipse(x0 + post / 2, y + (oy - oTop) / 16, post * 0.3, (oy - oTop) / 20, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = GOLD; ctx.fillRect(x0 + (x0 > S0.x ? 0 : post - 3), oTop, 3, oy - oTop);
  }
  // orchestra on the lacquered floor in front
  ctx.fillStyle = vgrad(ctx, oy, S0.y + Hh, [[0, '#3a0806'], [1, '#1a0403']]); ctx.fillRect(S0.x, oy, W, S0.y + Hh - oy);
  ctx.fillStyle = goldG(ctx, S0.x, S0.x + W); ctx.fillRect(S0.x, oy - 3, W, 5);
  const cheer = v.crowd ? v.crowd.cheer : 0, r = Math.min(W * 0.17, (S0.y + Hh - oy) * 0.62);
  drumCircle(ctx, X(0.2), oy + (S0.y + Hh - oy) * 0.5, r, t, cheer);
  // gong circle (kyi waing): low ring with graduated bossed gongs
  const gx = X(0.79), gy = oy + (S0.y + Hh - oy) * 0.5;
  ctx.fillStyle = vgrad(ctx, gy - r * 0.5, gy + r * 0.4, [[0, '#d9a52a'], [1, '#5a3a08']]); ctx.beginPath(); ctx.ellipse(gx, gy, r * 1.05, r * 0.46, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#7a1410'; ctx.beginPath(); ctx.ellipse(gx, gy, r * 0.93, r * 0.38, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < 13; i++) { const a = Math.PI + (i / 12) * Math.PI * 1.0 - 0.0, sz = r * (0.1 + 0.005 * i), px = gx + Math.cos(a) * r * 0.95, py = gy + Math.sin(a) * r * 0.4 + r * 0.05, ring = Math.max(0, Math.sin(t * 8 + i) * cheer);
    ctx.fillStyle = goldG(ctx, px - sz, px + sz); ctx.beginPath(); ctx.arc(px, py, sz * (1 + ring * 0.1), 0, TAU); ctx.fill(); ctx.fillStyle = '#7a4a10'; ctx.beginPath(); ctx.arc(px, py, sz * 0.4, 0, TAU); ctx.fill(); }
  seated(ctx, gx, gy + r * 0.3, r * 0.6, { body: '#2f8a6a', hat: '#f4efe2', skin: '#a8704a' });
  // oboe (hne) player between the circles, and clappers
  const ob = X(0.5), oyy = oy + (S0.y + Hh - oy) * 0.72;
  seated(ctx, ob, oyy, r * 0.62, { body: '#2f4a8a', hat: '#f2c14e', skin: '#b07a4a' });
  ctx.fillStyle = goldG(ctx, ob, ob + r * 0.5); poly(ctx, [[ob + r * 0.05, oyy - r * 0.42], [ob + r * 0.32, oyy - r * 0.72], [ob + r * 0.42, oyy - r * 0.64], [ob + r * 0.1, oyy - r * 0.36]]); ctx.fill();
  const cl = Math.sin(t * 7) * cheer * 3;
  ctx.strokeStyle = '#e8c27a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(0.92) - 6, oyy - r * 0.2 + cl); ctx.lineTo(X(0.92) + 6, oyy - r * 0.2 - cl); ctx.stroke();
  // oil lamps on the stage edge
  for (const f of [0.22, 0.5, 0.78]) { const lx = X(f), ly = oy - 6; ctx.fillStyle = goldG(ctx, lx - 8, lx + 8); ctx.beginPath(); ctx.ellipse(lx, ly + 3, 9, 4, 0, 0, TAU); ctx.fill(); flame(ctx, lx, ly, 4, t, f * 11); }
  glow(ctx, X(0.5), floorY, W * 0.6, '#ffc060', 0.12);
  vignette(ctx, S0, 0.35);
}

register({
  id: 'yokethe',
  look: { wall: '#3a1a14', floor: '#7a4a22', curtain: '#8a1f1c', frame: '#d9a52a', glow: '#ffc95a', far: '#241008', near: '#a8672c' },
  stage, puppet,
  skin: {
    card: { top: '#8a1410', bot: '#3e0806', edge: 'rgba(242,193,78,0.9)', inner: 'rgba(242,193,78,0.4)', ink: '#fff1c8', accent: '#f5d27a', shape: 'cut', r: 14, pattern: 'diamond', patCol: '#f2c14e', patA: 0.13, band: 6, bandCol: '#c8962a', bandPat: 'dots' },
    name: { fill: '#c8962a', fillEnd: '#f5d27a', ink: '#2a0806', shape: 'cut', edge: 'rgba(255,240,180,0.8)' },
    plaque: { base: '#a01c14', hot: '#c22a1a', end: '#f5d27a', ink: '#fff6e0', inkEnd: '#2a0806', shape: 'cut', r: 12, pattern: 'scallop', patCol: '#f5d27a', patA: 0.16, med: 'seal', medA: '#fff0b8', medB: '#c8962a', medInk: '#3a0a06', medEdge: '#6a3a08' },
    meter: { fill: '#3a0806', bead: 'coin', col: '#f5c84a', ink: '#fff1c8' },
    trans: 'curtainH', transCol: '#c8962a',
    snd: { root: 220, scale: [1, 1.12, 1.31, 1.5, 1.74], hit: 'gong' },
    voice: 6,
  },
});
export default null;

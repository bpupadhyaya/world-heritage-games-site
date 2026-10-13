// Theatre: Vietnam (mua roi nuoc). A jade pond, a red-gold pavilion with a bamboo screen, lacquered puppets on poles,
// a cheo orchestra on the shore and a crowd in conical hats.
import { register } from '../theatres.js';
import { mix, dark, light, alpha, poly, vgrad, hgrad } from '../figures.js';
import { TAU, clamp, vignette, lantern, place } from '../kit.js';
import { pattern } from '../skins.js';

const hs = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---- lacquered wooden puppets -------------------------------------------------------------------------------------
function puppet(T) {
  const { ctx, c, o, kind, s, t, phase, talk, breath, hands, shoulders, knees, head } = T;
  const nm = `${c.name ?? ''}`.toLowerCase();
  const op = Math.abs(talk), speak = !!o.speaking;
  const gloss = (x, y, rx, ry, a = 0.35) => { ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, -0.5, 0, TAU); ctx.fill(); };
  const lac = (col, x0, x1) => hgrad(ctx, x0, x1, [[0, light(col, 0.3)], [0.45, col], [1, dark(col, 0.45)]]);
  const line = Math.max(1, s * 0.012);
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (kind === 'beast') { // lacquered water buffalo with swept-back horns and a nose rope
    if (!/buffalo|trau|ox|bull|cow/.test(nm) && c.species && c.species !== 'buffalo') { ctx.restore(); return false; }
    const bob = Math.sin(t * 2 + phase) * s * 0.01, col = c.color ?? '#2a2f3a', L = s * 0.4, by = -s * 0.2 + bob;
    ctx.strokeStyle = dark(col, 0.3); ctx.lineWidth = s * 0.06;
    for (const lx of [-0.7, -0.35, 0.4, 0.7]) { ctx.beginPath(); ctx.moveTo(lx * L, by); ctx.lineTo(lx * L, 0); ctx.stroke(); }
    ctx.strokeStyle = col; ctx.lineWidth = s * 0.03; ctx.beginPath(); ctx.moveTo(-L, by - s * 0.02); ctx.quadraticCurveTo(-L * 1.4, by + s * 0.05, -L * 1.25, by + s * 0.2 + Math.sin(t * 3 + phase) * s * 0.03); ctx.stroke();
    ctx.fillStyle = lac(col, -L, L); ctx.beginPath(); ctx.ellipse(0, by, L, s * 0.17, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = dark(col, 0.7); ctx.lineWidth = line; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(L * 0.55, by - s * 0.07, s * 0.14, s * 0.12, 0, 0, TAU); ctx.fillStyle = lac(col, L * 0.3, L * 0.8); ctx.fill();
    gloss(-L * 0.2, by - s * 0.09, L * 0.55, s * 0.03, 0.3);
    const hx = L * 1.05, hy = by - s * 0.02;
    ctx.fillStyle = lac(col, hx - s * 0.1, hx + s * 0.15); ctx.beginPath(); ctx.ellipse(hx, hy, s * 0.15, s * 0.1, 0.3, 0, TAU); ctx.fill(); ctx.strokeStyle = dark(col, 0.7); ctx.stroke();
    ctx.strokeStyle = '#d8cfb0'; ctx.lineWidth = s * 0.035; ctx.beginPath(); ctx.moveTo(hx - s * 0.04, hy - s * 0.07); ctx.bezierCurveTo(hx - s * 0.2, hy - s * 0.1, hx - s * 0.32, hy - s * 0.02, hx - s * 0.34, hy - s * 0.2); ctx.stroke();
    ctx.fillStyle = dark(col, 0.2); ctx.beginPath(); ctx.ellipse(hx - s * 0.1, hy - s * 0.03, s * 0.05, s * 0.025, -0.6, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#c0301f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx + s * 0.13, hy + s * 0.04); ctx.quadraticCurveTo(hx + s * 0.1, hy + s * 0.2, hx - s * 0.1, hy + s * 0.18); ctx.stroke();
    ctx.fillStyle = '#fff6e0'; ctx.beginPath(); ctx.arc(hx + s * 0.04, hy - s * 0.03, s * 0.015, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8c04a'; ctx.beginPath(); ctx.arc(hx + s * 0.04, hy - s * 0.03, s * 0.007, 0, TAU); ctx.fill();
    ctx.restore();
    head.x = hx; head.y = hy; head.r = s * 0.1; hands.push([hx, hy], [L * 0.4, by]); shoulders.push([L * 0.5, by], [L * 0.6, by]); knees.push([-L * 0.5, by], [L * 0.5, by]);
    return true;
  }
  if (!['person', 'ruler', 'clown', 'trader', 'child'].includes(kind)) { ctx.restore(); return false; }
  const teu = kind === 'clown', boy = kind === 'child';
  const who = teu ? 'teu' : boy ? 'boy' : /aunt|lan|mother|woman|auntie/.test(nm) ? 'aunt' : kind === 'ruler' ? 'mandarin' : 'fisher';
  const skinC = c.skin ?? (who === 'aunt' ? '#e8b48a' : '#d99a66');
  const sh = -s * (boy ? 0.6 : 0.68) - breath * s * 0.004, hip = -s * (boy ? 0.3 : 0.34);
  const hr = s * (teu ? 0.125 : boy ? 0.115 : 0.1);
  const wob = Math.sin(t * 2.6 + phase) * s * 0.012;
  ctx.rotate((o.lean ?? 0) * 0.4 + wob / s);
  const body = c.color ?? (who === 'aunt' ? '#6a3a1c' : who === 'fisher' ? '#4a3220' : '#b83222'), acc = c.accent ?? '#e8c04a';
  // legs and trousers
  const pc = who === 'aunt' ? '#2a1a14' : who === 'boy' ? '#c0301f' : who === 'teu' ? '#b3261e' : '#c9b48a';
  ctx.fillStyle = lac(pc, -s * 0.2, s * 0.2);
  if (who === 'aunt' || who === 'mandarin') poly(ctx, [[-s * 0.2, 0], [-s * 0.13, hip], [s * 0.13, hip], [s * 0.2, 0]]);
  else poly(ctx, [[-s * 0.13, 0], [-s * 0.11, hip], [s * 0.11, hip], [s * 0.13, 0]]);
  ctx.fill(); ctx.strokeStyle = dark(pc, 0.6); ctx.lineWidth = line; ctx.stroke();
  // torso
  let bw = s * (teu ? 0.19 : 0.12);
  if (teu) { // round naked belly with a red cloth bib
    ctx.fillStyle = lac(skinC, -bw, bw); ctx.beginPath(); ctx.ellipse(0, (sh + hip) / 2 + s * 0.03, bw, s * 0.22, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = dark(skinC, 0.55); ctx.stroke();
    gloss(-bw * 0.35, (sh + hip) / 2 - s * 0.08, bw * 0.25, s * 0.08, 0.4);
    ctx.fillStyle = '#c0301f'; poly(ctx, [[-bw * 0.5, sh + s * 0.02], [bw * 0.5, sh + s * 0.02], [bw * 0.3, sh + s * 0.2], [0, sh + s * 0.3], [-bw * 0.3, sh + s * 0.2]]); ctx.fill(); ctx.strokeStyle = dark('#c0301f', 0.6); ctx.stroke();
    ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(0, (sh + hip) / 2 + s * 0.06, s * 0.012, 0, TAU); ctx.fill();
  } else {
    const tc = who === 'boy' ? skinC : body;
    ctx.fillStyle = lac(tc, -bw, bw); poly(ctx, [[-bw, sh], [bw, sh], [bw * (who === 'aunt' ? 1.5 : 1.15), hip + s * 0.04], [-bw * (who === 'aunt' ? 1.5 : 1.15), hip + s * 0.04]]); ctx.fill(); ctx.strokeStyle = dark(tc, 0.6); ctx.stroke();
    if (who === 'aunt') { ctx.fillStyle = '#f0c040'; poly(ctx, [[-bw * 0.3, sh], [bw * 0.3, sh], [bw * 0.45, hip], [-bw * 0.45, hip]]); ctx.fill(); ctx.fillStyle = '#c0301f'; ctx.fillRect(-bw * 1.3, hip - s * 0.03, bw * 2.6, s * 0.035); }
    else if (who === 'fisher') { ctx.fillStyle = acc; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, sh + s * (0.06 + i * 0.07), s * 0.012, 0, TAU); ctx.fill(); } }
    else if (who === 'mandarin') { ctx.fillStyle = '#f0c040'; ctx.fillRect(-bw, sh + s * 0.1, bw * 2, s * 0.05); }
    gloss(-bw * 0.4, sh + s * 0.1, bw * 0.15, s * 0.07, 0.3);
  }
  // arms: jointed wood
  const arm = (side, ang) => {
    const sx = side * bw * 0.95, sy = sh + s * 0.04, len = s * 0.27;
    const ex = sx + side * Math.sin(ang) * len * 0.55, ey = sy + Math.cos(ang) * len * 0.55;
    const hx = sx + side * Math.sin(ang) * len, hy = sy + Math.cos(ang) * len;
    const sleeve = who === 'teu' || who === 'boy' ? skinC : body;
    ctx.lineWidth = s * 0.07; ctx.strokeStyle = dark(sleeve, 0.55); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.lineWidth = s * 0.055; ctx.strokeStyle = light(sleeve, 0.08); ctx.stroke();
    ctx.fillStyle = skinC; ctx.beginPath(); ctx.arc(hx, hy, s * 0.04, 0, TAU); ctx.fill(); ctx.strokeStyle = dark(skinC, 0.6); ctx.lineWidth = 1; ctx.stroke();
    if (teu) { ctx.strokeStyle = acc; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx - side * Math.sin(ang) * s * 0.03, hy - Math.cos(ang) * s * 0.03, s * 0.036, 0, TAU); ctx.stroke(); }
    return [hx, hy];
  };
  const h1 = arm(-1, o.a1 ?? 0.15), h2 = arm(1, o.a2 ?? 0.15);
  if (who === 'fisher') { // bamboo rod with a float
    ctx.strokeStyle = '#8a6a2a'; ctx.lineWidth = s * 0.02; ctx.beginPath(); ctx.moveTo(h2[0] - s * 0.04, h2[1] + s * 0.06); ctx.lineTo(h2[0] + s * 0.32, h2[1] - s * 0.5); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(h2[0] + s * 0.32, h2[1] - s * 0.5); ctx.quadraticCurveTo(h2[0] + s * 0.4, h2[1] - s * 0.1, h2[0] + s * 0.38, h2[1] + s * 0.1 + Math.sin(t * 2) * 2); ctx.stroke();
    ctx.fillStyle = '#d6352a'; ctx.beginPath(); ctx.arc(h2[0] + s * 0.38, h2[1] + s * 0.1, s * 0.02, 0, TAU); ctx.fill();
  } else if (who === 'aunt') { ctx.fillStyle = '#b8892f'; ctx.beginPath(); ctx.ellipse(h2[0] + s * 0.02, h2[1] - s * 0.02, s * 0.1, s * 0.05, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#5a3a10'; ctx.stroke(); ctx.fillStyle = '#e0457b'; ctx.beginPath(); ctx.arc(h2[0], h2[1] - s * 0.06, s * 0.03, 0, TAU); ctx.fill(); }
  else if (who === 'boy' && (c.prop && c.prop !== 'none' || speak)) { ctx.strokeStyle = '#d8b050'; ctx.lineWidth = s * 0.025; ctx.beginPath(); ctx.moveTo(h2[0] - s * 0.04, h2[1] + s * 0.03); ctx.lineTo(h2[0] + s * 0.16, h2[1] - s * 0.1); ctx.stroke(); }
  // head
  const hy = sh - hr * 1.0, ny = hy - hr * 0.1;
  ctx.fillStyle = dark(skinC, 0.3); ctx.fillRect(-hr * 0.3, sh - hr * 0.3, hr * 0.6, hr * 0.5);
  if (who === 'boy') { ctx.fillStyle = '#1a1210'; for (const e of [-1, 1]) { ctx.beginPath(); ctx.arc(e * hr * 0.95, hy - hr * 0.55, hr * 0.32, 0, TAU); ctx.fill(); } }
  for (const e of [-1, 1]) { ctx.fillStyle = dark(skinC, 0.1); ctx.beginPath(); ctx.ellipse(e * hr * 1.0, hy + hr * 0.05, hr * 0.17, hr * 0.28, 0, 0, TAU); ctx.fill(); }
  const hg = ctx.createRadialGradient(-hr * 0.35, hy - hr * 0.4, hr * 0.1, 0, hy, hr * 1.2); hg.addColorStop(0, light(skinC, 0.45)); hg.addColorStop(0.6, skinC); hg.addColorStop(1, dark(skinC, 0.4));
  ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0, hy, hr, 0, TAU); ctx.fill(); ctx.strokeStyle = dark(skinC, 0.65); ctx.lineWidth = line; ctx.stroke();
  // hair, hat, headscarf
  if (who === 'teu') { ctx.fillStyle = '#1a1210'; ctx.beginPath(); ctx.arc(0, hy - hr * 1.15, hr * 0.38, 0, TAU); ctx.fill(); ctx.fillStyle = '#c0301f'; ctx.fillRect(-hr * 0.4, hy - hr * 0.95, hr * 0.8, hr * 0.14); ctx.fillStyle = '#1a1210'; ctx.beginPath(); ctx.arc(0, hy, hr * 1.02, Math.PI * 1.1, Math.PI * 1.9); ctx.fill(); }
  else if (who === 'boy') { ctx.fillStyle = '#1a1210'; ctx.beginPath(); ctx.arc(0, hy, hr * 1.03, Math.PI * 1.02, Math.PI * 1.98); ctx.fill(); }
  else if (who === 'aunt') { // crow's-beak headscarf
    ctx.fillStyle = '#15110f'; ctx.beginPath(); ctx.arc(0, hy - hr * 0.05, hr * 1.12, Math.PI * 0.95, TAU + 0.15); ctx.lineTo(hr * 1.4, hy - hr * 0.2); ctx.lineTo(hr * 1.0, hy - hr * 0.55); ctx.closePath(); ctx.fill();
    poly(ctx, [[hr * 0.6, hy - hr * 1.0], [hr * 1.9, hy - hr * 1.15], [hr * 0.9, hy - hr * 0.6]]); ctx.fill(); gloss(-hr * 0.2, hy - hr * 0.9, hr * 0.4, hr * 0.1, 0.25);
  } else if (who === 'mandarin') { ctx.fillStyle = '#1a1210'; ctx.beginPath(); ctx.ellipse(0, hy - hr * 0.95, hr * 1.1, hr * 0.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = acc; ctx.fillRect(-hr * 1.1, hy - hr * 0.95, hr * 2.2, hr * 0.12); }
  else { // conical non la hat with a chin strap
    ctx.fillStyle = vgrad(ctx, hy - hr * 2.0, hy - hr * 0.4, [[0, '#f0d58a'], [1, '#b8924a']]);
    poly(ctx, [[0, hy - hr * 2.0], [hr * 1.9, hy - hr * 0.5], [-hr * 1.9, hy - hr * 0.5]]); ctx.fill(); ctx.strokeStyle = '#7a5a20'; ctx.stroke();
    ctx.strokeStyle = 'rgba(110,80,20,0.5)'; ctx.beginPath(); for (let i = 1; i < 5; i++) { const y = hy - hr * 0.5 - i * hr * 0.3; const w = hr * 1.9 * (y - (hy - hr * 2.0)) / (hr * 1.5); ctx.moveTo(-w, y); ctx.lineTo(w, y); } ctx.stroke();
    ctx.strokeStyle = '#c0301f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-hr * 1.1, hy - hr * 0.6); ctx.lineTo(-hr * 0.7, hy + hr * 0.9); ctx.moveTo(hr * 1.1, hy - hr * 0.6); ctx.lineTo(hr * 0.7, hy + hr * 0.9); ctx.stroke();
  }
  // happy face: crescent eyes, round cheeks, a wide smile
  ctx.strokeStyle = '#1c130e'; ctx.lineWidth = Math.max(1.5, hr * 0.1);
  for (const e of [-1, 1]) { ctx.beginPath(); ctx.arc(e * hr * 0.4 + hr * 0.05, hy - hr * 0.12, hr * 0.15, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); ctx.fillStyle = 'rgba(224,70,60,0.5)'; ctx.beginPath(); ctx.arc(e * hr * 0.58, hy + hr * 0.28, hr * 0.2, 0, TAU); ctx.fill(); }
  if (who === 'fisher' || who === 'mandarin') { ctx.strokeStyle = '#2a1c14'; ctx.lineWidth = Math.max(1.5, hr * 0.12); ctx.beginPath(); ctx.moveTo(-hr * 0.4, hy + hr * 0.25); ctx.quadraticCurveTo(0, hy + hr * 0.1, hr * 0.4, hy + hr * 0.25); ctx.stroke(); }
  const mo = hr * (0.1 + (speak ? op * 0.38 : 0));
  ctx.fillStyle = '#6a0f0c'; ctx.beginPath(); ctx.ellipse(0, hy + hr * 0.52, hr * 0.38, mo + hr * 0.04, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = '#f7f0dc'; ctx.fillRect(-hr * 0.28, hy + hr * 0.5, hr * 0.56, hr * 0.06);
  ctx.fillStyle = dark(skinC, 0.2); ctx.beginPath(); ctx.arc(hr * 0.06, hy + hr * 0.12, hr * 0.1, 0, TAU); ctx.fill();
  gloss(-hr * 0.4, hy - hr * 0.5, hr * 0.28, hr * 0.12, 0.45);
  ctx.restore();
  hands.push([h1[0], h1[1]], [h2[0], h2[1]]); shoulders.push([-bw, sh], [bw, sh]); knees.push([-s * 0.1, hip + s * 0.15], [s * 0.1, hip + s * 0.15]);
  head.x = 0; head.y = hy; head.r = hr;
  return true;
}

// ---- stage ------------------------------------------------------------------------------------------------------------
function musician(ctx, x, y, r, i, t, col) {
  ctx.fillStyle = dark(col, 0.1); poly(ctx, [[x - r * 1.3, y], [x - r * 0.8, y - r * 2.4], [x + r * 0.8, y - r * 2.4], [x + r * 1.3, y]]); ctx.fill();
  ctx.fillStyle = '#d9a070'; ctx.beginPath(); ctx.arc(x, y - r * 3.1, r, 0, TAU); ctx.fill();
  ctx.fillStyle = '#17110f'; ctx.beginPath(); ctx.ellipse(x, y - r * 3.7, r * 1.05, r * 0.55, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = dark(col, 0.2); ctx.lineWidth = r * 0.55; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - r * 0.7, y - r * 2.2);
  const a = Math.sin(t * 6 + i * 2);
  if (i === 0) { // dan bau: a long single-string zither with a bending rod
    ctx.lineTo(x + r * 1.4, y - r * 1.1 + a * r * 0.2); ctx.stroke();
    ctx.fillStyle = '#6a3a18'; ctx.fillRect(x + r * 0.2, y - r * 0.9, r * 4.4, r * 0.6);
    ctx.strokeStyle = '#d8c070'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + r * 0.2, y - r * 0.9); ctx.lineTo(x + r * 4.6, y - r * 0.9); ctx.stroke();
    ctx.strokeStyle = '#b8924a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + r * 4.4, y - r * 0.9); ctx.quadraticCurveTo(x + r * 5, y - r * 2.6 + a * r * 0.5, x + r * 4.8, y - r * 3.3); ctx.stroke();
  } else if (i === 1) { // barrel drum and stick
    ctx.lineTo(x + r * 1.7, y - r * 1.5 - Math.abs(a) * r * 1.5); ctx.stroke();
    ctx.fillStyle = '#9c1f14'; ctx.beginPath(); ctx.ellipse(x + r * 2.2, y - r * 0.9, r * 1.4, r * 0.9, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#e8c04a'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#e8d8a8'; ctx.beginPath(); ctx.ellipse(x + r * 2.2, y - r * 1.5, r * 1.2, r * 0.35, 0, 0, TAU); ctx.fill();
  } else { // bamboo flute
    ctx.lineTo(x + r * 1.1, y - r * 2.9); ctx.stroke(); ctx.strokeStyle = '#d8b050'; ctx.lineWidth = r * 0.28; ctx.beginPath(); ctx.moveTo(x + r * 0.2, y - r * 3.0); ctx.lineTo(x + r * 3.2, y - r * 2.6); ctx.stroke();
  }
}
function stage(g, S0, v) {
  const { ctx } = g, t = v.t, x0 = S0.x, y0 = S0.y, W = S0.w, H = S0.h;
  const wy = y0 + H * 0.5, bot = y0 + H;
  // night-blue evening sky and bamboo groves
  ctx.fillStyle = vgrad(ctx, y0, wy, [[0, '#0b1f2a'], [1, '#2f4a46']]); ctx.fillRect(x0, y0, W, H);
  for (let i = 0; i < 14; i++) { const bx = x0 + W * (i < 7 ? i * 0.025 : 0.82 + (i - 7) * 0.03), bh = H * (0.3 + 0.2 * hs(i)); ctx.strokeStyle = '#0a2216'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx, wy); ctx.quadraticCurveTo(bx + 6, wy - bh * 0.5, bx + 14 * (hs(i + 2) - 0.5), wy - bh); ctx.stroke(); }
  // pavilion
  const px = x0 + W * 0.1, pw = W * 0.82, roofTop = y0 + H * 0.05, eaveY = y0 + H * 0.2, fy = wy;
  const wall = ctx.createLinearGradient(0, eaveY, 0, fy); wall.addColorStop(0, '#8a1c14'); wall.addColorStop(1, '#4a0c0a'); ctx.fillStyle = wall; ctx.fillRect(px, eaveY, pw, fy - eaveY);
  // bamboo screens left and right of the stage door
  const dw = pw * 0.34, dx = px + (pw - dw) / 2;
  for (const sx of [px + pw * 0.04, dx + dw + pw * 0.01]) { const sw = pw * 0.29; ctx.fillStyle = '#b8924a'; ctx.fillRect(sx, eaveY + (fy - eaveY) * 0.12, sw, (fy - eaveY) * 0.82); pattern(ctx, 'bamboo', sx, eaveY + (fy - eaveY) * 0.12, sw, (fy - eaveY) * 0.82, '#4a2e0a', 0.55); ctx.strokeStyle = '#e8c04a'; ctx.lineWidth = 2; ctx.strokeRect(sx, eaveY + (fy - eaveY) * 0.12, sw, (fy - eaveY) * 0.82); }
  // the stage door: dark with a glow and a drawn red curtain
  const dy = eaveY + (fy - eaveY) * 0.14;
  ctx.fillStyle = vgrad(ctx, dy, fy, [[0, '#120806'], [1, '#4a2210']]); ctx.beginPath(); ctx.moveTo(dx, fy); ctx.lineTo(dx, dy + dw * 0.3); ctx.quadraticCurveTo(dx, dy, dx + dw / 2, dy - dw * 0.1); ctx.quadraticCurveTo(dx + dw, dy, dx + dw, dy + dw * 0.3); ctx.lineTo(dx + dw, fy); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#e8c04a'; ctx.lineWidth = 3; ctx.stroke();
  for (const e of [0, 1]) { ctx.fillStyle = hgrad(ctx, dx, dx + dw * 0.25, [[0, '#c0301f'], [1, '#7a1410']]); ctx.beginPath(); const sx = e ? dx + dw : dx, dir = e ? -1 : 1; ctx.moveTo(sx, dy); ctx.lineTo(sx + dir * dw * 0.2, dy); ctx.quadraticCurveTo(sx + dir * dw * 0.12, (dy + fy) / 2, sx + dir * dw * 0.22, fy); ctx.lineTo(sx, fy); ctx.fill(); }
  // pillars with gold couplet bands
  for (const f of [0, 0.34, 0.66, 0.98]) { const cx2 = px + pw * f; ctx.fillStyle = hgrad(ctx, cx2 - 7, cx2 + 7, [[0, '#d03a2a'], [0.5, '#9c1a12'], [1, '#4a0a08']]); ctx.fillRect(cx2 - 7, eaveY - 4, 14, fy - eaveY + 6); ctx.fillStyle = '#e8c04a'; ctx.fillRect(cx2 - 3, eaveY + (fy - eaveY) * 0.25, 6, (fy - eaveY) * 0.4); }
  // curved tiled roof with up-turned dragon tails
  ctx.beginPath(); ctx.moveTo(px - pw * 0.07, eaveY - H * 0.06); ctx.quadraticCurveTo(px - pw * 0.02, eaveY + H * 0.04, px + pw * 0.12, eaveY + H * 0.01); ctx.lineTo(px + pw * 0.88, eaveY + H * 0.01); ctx.quadraticCurveTo(px + pw * 1.02, eaveY + H * 0.04, px + pw * 1.07, eaveY - H * 0.06);
  ctx.quadraticCurveTo(px + pw * 0.98, eaveY - H * 0.04, px + pw * 0.9, eaveY - H * 0.08); ctx.lineTo(px + pw * 0.8, roofTop); ctx.lineTo(px + pw * 0.2, roofTop); ctx.lineTo(px + pw * 0.1, eaveY - H * 0.08); ctx.quadraticCurveTo(px + pw * 0.02, eaveY - H * 0.04, px - pw * 0.07, eaveY - H * 0.06); ctx.closePath();
  ctx.fillStyle = vgrad(ctx, roofTop, eaveY + H * 0.04, [[0, '#c0562f'], [1, '#6a2412']]); ctx.fill();
  ctx.save(); ctx.clip(); pattern(ctx, 'scallop', x0, roofTop, W, eaveY - roofTop + H * 0.05, '#2a0a04', 0.45); ctx.restore();
  ctx.strokeStyle = '#e8c04a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px + pw * 0.2, roofTop); ctx.lineTo(px + pw * 0.8, roofTop); ctx.stroke();
  ctx.fillStyle = '#e8c04a'; ctx.beginPath(); ctx.arc(px + pw * 0.5, roofTop - 4, pw * 0.025, 0, TAU); ctx.fill(); poly(ctx, [[px + pw * 0.5 - 5, roofTop], [px + pw * 0.5, roofTop - pw * 0.06], [px + pw * 0.5 + 5, roofTop]]); ctx.fill();
  ctx.fillStyle = '#e8c04a'; ctx.fillRect(px - pw * 0.02, eaveY + H * 0.005, pw * 1.04, 4);
  for (const f of [0.18, 0.5, 0.82]) lantern(ctx, px + pw * f, eaveY + H * 0.1, H * 0.03, '#d6352a', t, f * 7);
  // jade water with ripples and the reflection of the pavilion
  ctx.fillStyle = vgrad(ctx, wy, bot, [[0, '#3d9a8f'], [0.35, '#1d6a68'], [1, '#08262c']]); ctx.fillRect(x0, wy, W, bot - wy);
  ctx.save(); ctx.beginPath(); ctx.rect(x0, wy, W, bot - wy); ctx.clip(); ctx.globalAlpha = 0.28; ctx.translate(0, wy * 2); ctx.scale(1, -1);
  ctx.fillStyle = '#8a1c14'; ctx.fillRect(px, eaveY, pw, fy - eaveY); ctx.fillStyle = '#c0562f'; ctx.fillRect(px - pw * 0.05, eaveY - H * 0.05, pw * 1.1, H * 0.06); ctx.restore();
  for (const f of [0.18, 0.5, 0.82]) { const lx = px + pw * f; ctx.fillStyle = 'rgba(255,170,70,0.22)'; for (let i = 0; i < 6; i++) ctx.fillRect(lx - 8 + Math.sin(t * 2 + i) * 3, wy + 4 + i * H * 0.03, 16 - i * 1.5, 2); }
  ctx.fillStyle = 'rgba(190,240,230,0.16)'; for (let i = 0; i < 16; i++) { const y = wy + 6 + i * (bot - wy) / 17, xx = x0 + (((i * 61 + t * 14 * (i % 2 ? 1 : -1)) % W) + W) % W; ctx.fillRect(xx - W * 0.1, y, W * 0.2, 1.3); }
  // orchestra on the shore: deck, red cloth, gong frame and three players
  const dkx = x0, dkw = W * 0.34, dkt = wy + H * 0.0, dkf = wy + H * 0.13;
  ctx.fillStyle = '#7a1410'; ctx.fillRect(dkx, dkt - H * 0.12, dkw, H * 0.12); pattern(ctx, 'diamond', dkx, dkt - H * 0.12, dkw, H * 0.12, '#e8c04a', 0.25);
  ctx.fillStyle = '#e8c04a'; ctx.beginPath(); ctx.arc(dkx + dkw * 0.84, dkt - H * 0.07, H * 0.045 + Math.sin(t * 5) * 0.4, 0, TAU); ctx.fill(); ctx.strokeStyle = '#6a4a10'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = vgrad(ctx, dkt, dkf, [[0, '#8a5a2a'], [1, '#3a2010']]); ctx.fillRect(dkx, dkt, dkw, dkf - dkt);
  ctx.fillStyle = '#c0301f'; ctx.fillRect(dkx, dkt + (dkf - dkt) * 0.5, dkw, (dkf - dkt) * 0.5); pattern(ctx, 'scallop', dkx, dkt + (dkf - dkt) * 0.5, dkw, (dkf - dkt) * 0.5, '#e8c04a', 0.5);
  const mr = H * 0.021;
  musician(ctx, dkx + dkw * 0.12, dkt + (dkf - dkt) * 0.5, mr, 0, t, '#4a6a8a'); musician(ctx, dkx + dkw * 0.45, dkt + (dkf - dkt) * 0.5, mr, 1, t, '#7a5a2a'); musician(ctx, dkx + dkw * 0.72, dkt + (dkf - dkt) * 0.5, mr, 2, t, '#5a7a4a');
  // puppets in the pond (and their reflections)
  const floorY = wy + (bot - wy) * 0.46, figH = Math.min(H * 0.33, W * 0.42);
  ctx.save(); ctx.beginPath(); ctx.rect(x0, wy, W, bot - wy); ctx.clip(); ctx.globalAlpha = 0.17; ctx.translate(0, floorY * 2 + 3); ctx.scale(1, -1);
  place(ctx, S0, floorY, figH, v, { style: 'color', noShadow: true, alpha: 0.2 }); ctx.restore();
  for (const f of v.figs) {
    if (f.alpha < 0.05) continue;
    const fx = x0 + W * f.x;
    for (let k = 0; k < 3; k++) { const ph = (t * 0.6 + k / 3 + f.x) % 1; ctx.strokeStyle = `rgba(255,255,255,${0.45 * (1 - ph)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(fx, floorY + 1, W * 0.05 + ph * W * 0.1, H * 0.014 + ph * H * 0.025, 0, 0, TAU); ctx.stroke(); }
  }
  place(ctx, S0, floorY, figH, v, { style: 'color', noShadow: true, bob: H * 0.008 });
  for (const f of v.figs) { // water laps over the foot of each pole, spray flicks up
    if (f.alpha < 0.05) continue;
    const fx = x0 + W * f.x;
    ctx.fillStyle = vgrad(ctx, floorY - H * 0.03, floorY + H * 0.02, [[0, 'rgba(40,150,140,0)'], [0.5, 'rgba(40,150,140,0.75)'], [1, 'rgba(30,110,110,0.9)']]); ctx.fillRect(fx - W * 0.1, floorY - H * 0.03, W * 0.2, H * 0.05);
    ctx.fillStyle = 'rgba(235,255,250,0.8)';
    for (let k = 0; k < 6; k++) { const ph = (t * 1.3 + k * 0.17 + f.x) % 1, a = (k - 2.5) * 0.5; ctx.beginPath(); ctx.arc(fx + Math.sin(a) * W * 0.05 * ph * 2, floorY - Math.sin(ph * Math.PI) * H * 0.04, 1.6, 0, TAU); ctx.fill(); }
  }
  // lotus, firecracker smoke at the opening, crowd of conical hats
  for (const [fxp, fyp, r, fl] of [[0.4, 0.9, 0.05, 1], [0.93, 0.86, 0.06, 0], [0.7, 0.95, 0.04, 1]]) {
    const x = x0 + W * fxp, y = y0 + H * fyp, rr = W * r;
    ctx.fillStyle = vgrad(ctx, y - rr * 0.3, y + rr * 0.3, [[0, '#4a9a4a'], [1, '#1f5a2c']]); ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.33, 0, 0.12, TAU - 0.12); ctx.lineTo(x, y); ctx.fill();
    if (fl) { ctx.fillStyle = '#f8c8d8'; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(x + k * rr * 0.14, y - rr * 0.35, rr * 0.13, rr * 0.3, k * 0.35, 0, TAU); ctx.fill(); } }
  }
  if (v.opening) for (let k = 0; k < 7; k++) { const ph = (t * 0.35 + k * 0.14) % 1, xx = x0 + W * (k % 2 ? 0.12 + k * 0.01 : 0.9 - k * 0.01) + Math.sin(k + t) * 8; ctx.fillStyle = `rgba(230,225,215,${0.35 * (1 - ph)})`; ctx.beginPath(); ctx.arc(xx, wy - ph * H * 0.2, 6 + ph * 22, 0, TAU); ctx.fill(); if (k < 3) { ctx.fillStyle = `rgba(255,${80 + k * 40},40,${1 - ph})`; ctx.fillRect(xx + Math.sin(k * 9 + t * 3) * 14, wy - ph * H * 0.25 - 8, 3, 3); } }
  const cr = W * 0.034, n = Math.ceil(W / (cr * 2.3)), cw = v.crowd ?? { cheer: 0, mood: 0 };
  for (let i = 0; i < n; i++) {
    const h = hs(i + 7), x = x0 + W * ((i + 0.5) / n), r = cr * (0.85 + h * 0.3), pop = cw.mood > 0 ? cw.cheer * (0.5 + 0.5 * Math.sin(t * 12 + i)) * r * 0.7 : 0, y = bot + r * 0.3 - pop;
    ctx.fillStyle = '#071014'; ctx.beginPath(); ctx.ellipse(x, y + r * 1.8, r * 1.6, r * 1.4, 0, Math.PI, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x, y, r * 0.85, 0, TAU); ctx.fill();
    ctx.fillStyle = '#152a2a'; poly(ctx, [[x - r * 1.6, y - r * 0.2], [x, y - r * 1.9], [x + r * 1.6, y - r * 0.2]]); ctx.fill();
    ctx.strokeStyle = 'rgba(240,200,120,0.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - r * 1.5, y - r * 0.25); ctx.lineTo(x, y - r * 1.85); ctx.stroke();
  }
  vignette(ctx, S0, 0.32);
}

register({
  id: 'vietnam',
  look: { wall: '#7a2a1c', floor: '#2a6f86', curtain: '#b3261e', glow: '#f5d27a' },
  stage, puppet,
  skin: {
    card: { top: '#5a1410', bot: '#2a0a0a', edge: '#e8c04a', inner: 'rgba(232,192,74,0.35)', ink: '#fff3d6', accent: '#ffd777', shape: 'cut', r: 14, pattern: 'bamboo', patCol: '#e8c04a', patA: 0.09 },
    name: { fill: '#9c1a12', fillEnd: '#e8c04a', ink: '#fff3d6', edge: '#e8c04a', shape: 'cut' },
    plaque: { base: '#8a1a14', hot: '#b3301f', end: '#e8b23a', ink: '#fff6e0', inkEnd: '#2a0a04', edge: '#2a0604', inner: 'rgba(232,192,74,0.6)', shape: 'arch', r: 14, pattern: 'bamboo', patCol: '#e8c04a', patA: 0.09, med: 'flower', medA: '#fff0b8', medB: '#d6a020', medInk: '#4a0a04', medEdge: '#6a3a08' },
    meter: { fill: '#0e3036', edge: 'rgba(120,230,210,0.3)', bead: 'drop', col: '#6fe0cc', ink: '#eafff8' },
    trans: 'ripple', transCol: '#0e3a3c',
    snd: { root: 330, scale: [1, 1.125, 1.25, 1.5, 1.667], hit: 'pluck', voiceWave: 'sine', voiceVol: 0.04 },
    voice: 4,
  },
});
export default null;

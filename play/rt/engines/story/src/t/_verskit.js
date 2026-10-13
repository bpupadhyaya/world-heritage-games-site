// Helpers shared by the sahel, persian and malagasy theatres: smooth animation state, italic text wrapping and a
// parametric standing/seated person (the tradition supplies the costume through callbacks).
import { mix, dark, light, alpha, vgrad, hgrad } from '../figures.js';

export const TAU = Math.PI * 2;
export const hf = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const clampv = (v, a, b) => Math.max(a, Math.min(b, v));

// frame-to-frame smoothing keyed by name (time comes only from the view clock, so replays are identical)
const STATE = new Map();
export function smooth(key, target, t, rate = 3) {
  let s = STATE.get(key);
  if (!s || t < s.t) s = { t, v: target };
  const dt = clampv(t - s.t, 0, 0.1);
  s.v += (target - s.v) * Math.min(1, dt * rate); s.t = t;
  STATE.set(key, s);
  return s.v;
}

export function wrapText(ctx, text, maxW, font) {
  ctx.font = font;
  const out = []; let cur = '';
  for (const w of String(text).split(/\s+/)) {
    const tr = cur ? `${cur} ${w}` : w;
    if (cur && ctx.measureText(tr).width > maxW) { out.push(cur); cur = w; } else cur = tr;
  }
  if (cur) out.push(cur);
  return out;
}

export function sparkle(ctx, x, y, r, a, col = '#fff6c8') {
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.beginPath();
  ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r);
  ctx.moveTo(x - r * 0.5, y - r * 0.5); ctx.lineTo(x + r * 0.5, y + r * 0.5); ctx.moveTo(x + r * 0.5, y - r * 0.5); ctx.lineTo(x - r * 0.5, y + r * 0.5);
  ctx.stroke(); ctx.restore();
}

// ---- a person: robe or wrap, jointed arms, profile face; D supplies the tradition's costume ---------------------
// D: { seated, wTop, wHem, head, sleeve, robe(ctx, G) -> fill colour, deco(ctx, G), headgear(ctx, hx, hy, r, T, G),
//      veil, hairless, feet }
export function person(T, D) {
  const { ctx, c, o, kind, s, t, phase, talk, breath, walk, bodyC, accC, skinC, hands, knees, shoulders, head, eye } = T;
  const child = kind === 'child', k = child ? 0.8 : 1;
  const H = s * k * (D.seated ? 0.7 : 1);
  const fat = c.build ?? 1;
  const hipY = -H * (D.seated ? 0.2 : 0.44), shY = -H * 0.74, hr = H * 0.088 * (child ? 1.15 : 1) * (D.head ?? 1);
  const wT = H * (D.wTop ?? 0.14) * fat, wH = H * (D.wHem ?? 0.2) * fat;
  const lean = o.lean ?? 0;
  const sway = breath * H * 0.006 + (o.speaking ? Math.abs(talk) * H * 0.01 : 0) + (o.walk ? Math.abs(walk) * H * 0.012 : 0);
  const step = o.walk ? walk : 0;
  const G = { H, hipY, shY, hr, wT, wH, fat, t, bodyC, accC, skinC, c };
  // feet
  if (!D.seated) {
    for (const sd of [-1, 1]) {
      const fx = sd * H * 0.07 + (o.walk ? sd * step * H * 0.07 : 0), lift = o.walk ? Math.max(0, sd * step) * H * 0.04 : 0;
      ctx.fillStyle = D.shoe ?? '#2a1a10'; ctx.beginPath(); ctx.ellipse(fx + H * 0.03, -H * 0.012 - lift, H * 0.065, H * 0.028, 0, 0, TAU); ctx.fill();
    }
  }
  knees.push([-H * 0.06, -H * (D.seated ? 0.1 : 0.2)], [H * 0.06, -H * (D.seated ? 0.1 : 0.2)]);
  ctx.save(); ctx.translate(0, hipY + sway); ctx.rotate(lean);
  const ty = shY - hipY, hem = -hipY - H * 0.005, hy2 = ty - hr * 1.55;
  // body
  const body = () => {
    ctx.beginPath(); ctx.moveTo(-wT, ty); ctx.quadraticCurveTo(0, ty - H * 0.025, wT, ty);
    if (D.seated) { ctx.bezierCurveTo(wT * 1.4, ty * 0.2, wH * 1.0, hem * 0.4, wH, hem); ctx.quadraticCurveTo(0, hem + H * 0.05, -wH, hem); ctx.bezierCurveTo(-wH * 1.0, hem * 0.4, -wT * 1.4, ty * 0.2, -wT, ty); }
    else { ctx.bezierCurveTo(wT * 1.1, ty * 0.3, wH * 0.9, hem * 0.55, wH, hem); ctx.quadraticCurveTo(0, hem + H * 0.03 + (o.walk ? Math.abs(walk) * H * 0.012 : 0), -wH, hem); ctx.bezierCurveTo(-wH * 0.9, hem * 0.55, -wT * 1.1, ty * 0.3, -wT, ty); }
    ctx.closePath();
  };
  const col = D.robe ? D.robe(ctx, G) : bodyC;
  body(); ctx.fillStyle = hgrad(ctx, -wH, wH, [[0, light(col, 0.2)], [0.5, col], [1, dark(col, 0.34)]]); ctx.fill();
  ctx.save(); body(); ctx.clip();
  if (D.deco) D.deco(ctx, { ...G, ty, hem, hy2 });
  ctx.fillStyle = vgrad(ctx, ty, hem, [[0, 'rgba(255,255,255,0.1)'], [0.4, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.22)']]); ctx.fillRect(-wH * 1.2, ty, wH * 2.4, hem - ty);
  ctx.strokeStyle = 'rgba(0,0,0,0.14)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let i = -2; i <= 2; i++) { ctx.moveTo(i * wT * 0.5, ty * 0.3); ctx.quadraticCurveTo(i * wH * 0.55, hem * 0.5, i * wH * 0.78, hem); }
  ctx.stroke(); ctx.restore();
  ctx.strokeStyle = dark(col, 0.5); ctx.lineWidth = Math.max(1, H * 0.01); body(); ctx.stroke();
  if (D.seated) { // crossed knees showing through the pooled robe
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(-wH * 0.45, hem - H * 0.06, wH * 0.42, H * 0.06, 0.1, 0, TAU); ctx.ellipse(wH * 0.45, hem - H * 0.06, wH * 0.42, H * 0.06, -0.1, 0, TAU); ctx.fill();
  }
  // arms
  const reach = H * 0.3, sleeveC = D.sleeveCol ? D.sleeveCol(ctx, G) : dark(col, 0.1);
  const arm = (side, ang) => {
    const sx = side * wT * 0.92, sy = ty + H * 0.03;
    const tx = sx + Math.sin(ang) * reach * side * 0.98, tyy = sy + Math.cos(ang) * reach * 0.98;
    const ex = (sx + tx) / 2 + side * H * 0.05, ey = (sy + tyy) / 2 + H * 0.01;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = dark(sleeveC, 0.35); ctx.lineWidth = H * (D.sleeve ?? 0.075) + 2; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(tx, tyy); ctx.stroke();
    ctx.strokeStyle = sleeveC; ctx.lineWidth = H * (D.sleeve ?? 0.075); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(tx, tyy); ctx.stroke();
    ctx.fillStyle = D.cuff ?? alpha(accC, 0.9); ctx.beginPath(); ctx.arc(tx, tyy, H * (D.sleeve ?? 0.075) * 0.62, 0, TAU); ctx.fill();
    ctx.fillStyle = skinC; ctx.beginPath(); ctx.arc(tx + side * H * 0.005, tyy + H * 0.018, H * 0.036, 0, TAU); ctx.fill();
    return [tx, tyy + H * 0.015];
  };
  const h1 = arm(-1, o.a1 ?? 0.12);
  // neck and head
  ctx.fillStyle = dark(skinC, 0.12); ctx.fillRect(-H * 0.024, ty - H * 0.045, H * 0.048, H * 0.07);
  const hg = ctx.createRadialGradient(-hr * 0.3, hy2 - hr * 0.35, hr * 0.1, 0, hy2, hr * 1.15);
  hg.addColorStop(0, light(skinC, 0.3)); hg.addColorStop(0.7, skinC); hg.addColorStop(1, dark(skinC, 0.28));
  ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0, hy2, hr, 0, TAU); ctx.fill();
  ctx.strokeStyle = dark(skinC, 0.5); ctx.lineWidth = Math.max(1, H * 0.01); ctx.stroke();
  if (D.hair && !D.noHair) D.hair(ctx, 0, hy2, hr, G);
  // face (profile facing +x)
  ctx.strokeStyle = dark(c.hair ?? '#2a1c14', 0.1); ctx.lineWidth = Math.max(1, hr * 0.1);
  ctx.beginPath(); ctx.moveTo(hr * 0.1, hy2 - hr * 0.42); ctx.lineTo(hr * 0.72, hy2 - hr * 0.46); ctx.stroke();
  eye(hr * 0.45, hy2 - hr * 0.16, hr * 0.12);
  ctx.fillStyle = dark(skinC, 0.15); ctx.beginPath(); ctx.moveTo(hr * 0.78, hy2 - hr * 0.05); ctx.lineTo(hr * 1.12, hy2 + hr * 0.18); ctx.lineTo(hr * 0.78, hy2 + hr * 0.22); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(216,86,74,0.3)'; ctx.beginPath(); ctx.arc(hr * 0.4, hy2 + hr * 0.32, hr * 0.17, 0, TAU); ctx.fill();
  if (!D.veil) { ctx.fillStyle = '#8a2e26'; ctx.beginPath(); ctx.ellipse(hr * 0.7, hy2 + hr * 0.52, hr * 0.17, hr * (0.04 + Math.abs(talk) * 0.13), 0, 0, TAU); ctx.fill(); }
  if (c.beard && !D.veil) {
    ctx.fillStyle = c.beardColor ?? '#d8d2c4'; ctx.beginPath(); ctx.moveTo(-hr * 0.2, hy2 + hr * 0.3); ctx.quadraticCurveTo(hr * 0.5, hy2 + hr * 2.0 + Math.abs(talk) * hr * 0.1, hr * 0.95, hy2 + hr * 0.3); ctx.quadraticCurveTo(hr * 0.6, hy2 + hr * 0.6, -hr * 0.2, hy2 + hr * 0.3); ctx.fill();
  }
  if (D.headgear) D.headgear(ctx, 0, hy2, hr, T, G);
  if (D.veil) { // cloth drawn across the lower face, eyes left clear
    ctx.fillStyle = D.veil; ctx.beginPath(); ctx.moveTo(-hr * 1.02, hy2 + hr * 0.05); ctx.quadraticCurveTo(hr * 0.5, hy2 - hr * 0.02, hr * 1.04, hy2 + hr * 0.02); ctx.lineTo(hr * 0.95, hy2 + hr * 1.0); ctx.quadraticCurveTo(0, hy2 + hr * 1.5, -hr * 0.9, hy2 + hr * 0.9); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.moveTo(-hr * 0.7, hy2 + hr * 0.4); ctx.quadraticCurveTo(0, hy2 + hr * 0.7, hr * 0.8, hy2 + hr * 0.3); ctx.stroke();
  }
  const h2 = arm(1, o.a2 ?? 0.12);
  if (c.prop && c.prop !== 'none') {
    const [px, py] = h2;
    if (c.prop === 'staff' || c.prop === 'stick') {
      ctx.strokeStyle = '#4a2c14'; ctx.lineWidth = Math.max(2, H * 0.022); ctx.beginPath(); ctx.moveTo(px + H * 0.02, py - H * 0.2); ctx.lineTo(px + H * 0.02, -hipY + H * 0.0); ctx.stroke();
      ctx.fillStyle = D.staffTop ?? accC; ctx.beginPath(); ctx.arc(px + H * 0.02, py - H * 0.2, H * 0.026, 0, TAU); ctx.fill();
    } else if (c.prop === 'cup') {
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.moveTo(px - H * 0.025, py - H * 0.05); ctx.lineTo(px + H * 0.025, py - H * 0.05); ctx.lineTo(px + H * 0.018, py + H * 0.02); ctx.lineTo(px - H * 0.018, py + H * 0.02); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#8a2a1a'; ctx.fillRect(px - H * 0.02, py - H * 0.035, H * 0.04, H * 0.045);
      ctx.strokeStyle = '#e8c27a'; ctx.lineWidth = 1; ctx.stroke();
    }
  }
  const cs = Math.cos(lean), sn = Math.sin(lean);
  const toL = ([x, y]) => [x * cs - y * sn, hipY + sway + x * sn + y * cs];
  hands.push(toL(h1), toL(h2)); shoulders.push(toL([-wT, ty]), toL([wT, ty]));
  const hp = toL([0, hy2]); head.x = hp[0]; head.y = hp[1]; head.r = hr;
  ctx.restore();
  return true;
}

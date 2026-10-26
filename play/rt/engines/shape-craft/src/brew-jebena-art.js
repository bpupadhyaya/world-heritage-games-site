// shape-craft `brew`, mode "jebena": the drawing (1.26.0). Four stages, four pictures: the roasting pan over charcoal, the wooden mortar, the clay jebena
// on its charcoal stand, and the row of small cups with the jebena held high. Pure canvas 2D, time from the caller, no randomness.
import { rrect, shadowed } from './fx.js';
import { clamp, lerp, sm, cyl, bubble, foam, steam, glow, groundShadow, embers, tint, mix, rgba, lg, rg, ell, TAU, hash } from './brew-art.js';

export const X = (V, u) => V.ox + u * V.s;
export const Y = (V, v) => V.oy + v * V.s;

// roast colour of a bean 0 (green) .. 1 (charred)
const STOPS = [[0, '#86a548'], [0.14, '#aab862'], [0.28, '#cfae5e'], [0.42, '#aa7234'], [0.58, '#74401a'], [0.74, '#47230e'], [0.88, '#24120a'], [1, '#0c0605']];
export const roastColor = (r) => { const k = clamp(r, 0, 1); for (let i = 1; i < STOPS.length; i++) if (k <= STOPS[i][0]) { const [a, ca] = STOPS[i - 1], [b, cb] = STOPS[i]; return mix(ca, cb, (k - a) / (b - a)); } return '#0c0605'; };

export function bean(ctx, x, y, w, rot, r, k = 0) {
  const c = roastColor(r), h = w * 0.68;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(w * 0.06, h * 0.32, w * 0.5, h * 0.4, 0, 0, TAU); ctx.fill();
  const g = ctx.createRadialGradient(-w * 0.15, -h * 0.25, w * 0.04, 0, 0, w * 0.6); g.addColorStop(0, tint(c, 0.38 + 0.2 * clamp((r - 0.6) * 2, 0, 1))); g.addColorStop(0.5, c); g.addColorStop(1, tint(c, -0.5));
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, w * 0.5, h * 0.5, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = tint(c, -0.62); ctx.lineWidth = Math.max(0.8, w * 0.07); ctx.beginPath(); ctx.moveTo(-w * 0.42, 0); ctx.quadraticCurveTo(0, h * (0.18 + 0.12 * k), w * 0.42, 0); ctx.stroke();
  if (r > 0.62) { ctx.fillStyle = `rgba(255,236,200,${0.12 + 0.35 * clamp((r - 0.62) * 3, 0, 0.8)})`; ctx.beginPath(); ctx.ellipse(-w * 0.14, -h * 0.2, w * 0.14, h * 0.07, -0.3, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// a clay jebena at (x, y) = centre of its base; tilt about the spout tip when pouring; coffee level L (0..1.3) shows in the neck window
export function jebena(ctx, V, o) {
  const k = V.s * (o.sc ?? 1), px = X(V, o.x), py = Y(V, o.y), t = o.t ?? 0;
  ctx.save(); ctx.translate(px, py);
  if (o.tilt) { ctx.translate(-0.205 * k, -0.255 * k); ctx.rotate(-o.tilt); ctx.translate(0.205 * k, 0.255 * k); }
  const clay = '#3a2314', clay2 = '#6a3e22';
  // handle: a strap of clay from the neck to the belly
  ctx.strokeStyle = '#1e110a'; ctx.lineWidth = 0.034 * k; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0.032 * k, -0.34 * k); ctx.bezierCurveTo(0.17 * k, -0.34 * k, 0.17 * k, -0.15 * k, 0.095 * k, -0.12 * k); ctx.stroke();
  ctx.strokeStyle = lg(ctx, 0, -0.34 * k, 0, -0.12 * k, [[0, '#7a4a2a'], [1, '#3a2010']]); ctx.lineWidth = 0.026 * k; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,220,180,0.3)'; ctx.lineWidth = 0.006 * k; ctx.beginPath(); ctx.moveTo(0.034 * k, -0.345 * k); ctx.bezierCurveTo(0.16 * k, -0.345 * k, 0.16 * k, -0.17 * k, 0.1 * k, -0.135 * k); ctx.stroke();
  // spout: a cone rising from the shoulder on the left
  ctx.fillStyle = lg(ctx, -0.22 * k, -0.2 * k, -0.1 * k, -0.15 * k, [[0, '#7a4a2a'], [0.5, clay2], [1, '#2a170c']]);
  ctx.beginPath(); ctx.moveTo(-0.078 * k, -0.16 * k); ctx.lineTo(-0.2 * k, -0.27 * k); ctx.lineTo(-0.218 * k, -0.255 * k); ctx.lineTo(-0.105 * k, -0.085 * k); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = '#140a05'; ctx.beginPath(); ctx.ellipse(-0.21 * k, -0.262 * k, 0.012 * k, 0.017 * k, 0.9, 0, TAU); ctx.fill();
  // belly and neck in one outline
  const body = () => { ctx.beginPath(); ctx.moveTo(-0.075 * k, 0); ctx.bezierCurveTo(-0.15 * k, -0.01 * k, -0.15 * k, -0.17 * k, -0.045 * k, -0.225 * k); ctx.bezierCurveTo(-0.04 * k, -0.27 * k, -0.046 * k, -0.34 * k, -0.056 * k, -0.375 * k); ctx.lineTo(0.056 * k, -0.375 * k); ctx.bezierCurveTo(0.046 * k, -0.34 * k, 0.04 * k, -0.27 * k, 0.045 * k, -0.225 * k); ctx.bezierCurveTo(0.15 * k, -0.17 * k, 0.15 * k, -0.01 * k, 0.075 * k, 0); ctx.closePath(); };
  body(); ctx.fillStyle = cyl(ctx, -0.14 * k, 0.14 * k, clay, { hl: 0.3, spec: 0.42, bounce: '#ff8a3a' }); ctx.fill();
  ctx.save(); body(); ctx.clip();
  // fired-clay character: a lighter ochre band with incised zigzag, soot, fingerprints of the potter
  ctx.fillStyle = lg(ctx, -0.14 * k, 0, 0.14 * k, 0, [[0, 'rgba(160,100,50,0)'], [0.3, 'rgba(210,150,80,0.55)'], [0.6, 'rgba(160,100,50,0.4)'], [1, 'rgba(60,30,10,0)']]); ctx.fillRect(-0.15 * k, -0.115 * k, 0.3 * k, 0.045 * k);
  ctx.strokeStyle = 'rgba(40,20,8,0.7)'; ctx.lineWidth = 1.3; ctx.beginPath(); for (let q = -6; q <= 6; q++) { ctx.moveTo((q * 0.0235) * k, -0.113 * k); ctx.lineTo((q * 0.0235 + 0.012) * k, -0.07 * k); ctx.lineTo((q * 0.0235 + 0.0235) * k, -0.113 * k); } ctx.stroke();
  for (let i = 0; i < 70; i++) { ctx.fillStyle = `rgba(${hash(i, 2) > 0.5 ? '255,220,170' : '10,4,0'},${0.05 + 0.08 * hash(i, 3)})`; ctx.beginPath(); ctx.arc(lerp(-0.15, 0.15, hash(i, 1)) * k, lerp(-0.37, 0, hash(i, 4)) * k, (0.002 + 0.004 * hash(i, 5)) * k, 0, TAU); ctx.fill(); }
  const hotG = ctx.createLinearGradient(0, -0.08 * k, 0, 0.0 * k); hotG.addColorStop(0, 'rgba(255,110,40,0)'); hotG.addColorStop(1, `rgba(255,120,40,${0.5 * (o.heat ?? 0)})`); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = hotG; ctx.fillRect(-0.15 * k, -0.08 * k, 0.3 * k, 0.09 * k);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = lg(ctx, 0, -0.03 * k, 0, 0.0, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.5)']]); ctx.fillRect(-0.15 * k, -0.03 * k, 0.3 * k, 0.04 * k);
  // the sight window: a slit in the neck through which the brew shows, with the band to hold marked beside it
  const wx = -0.0195 * k, wy = -0.352 * k, ww = 0.039 * k, wh = 0.112 * k, L = clamp(o.L ?? 0, 0, 1.4);
  ctx.fillStyle = '#0c0603'; rrect(ctx, wx - 3, wy - 3, ww + 6, wh + 6, ww * 0.5); ctx.fill();
  ctx.fillStyle = '#1c0f06'; rrect(ctx, wx, wy, ww, wh, ww * 0.45); ctx.fill();
  ctx.save(); rrect(ctx, wx, wy, ww, wh, ww * 0.45); ctx.clip();
  const ly = wy + wh - wh * clamp(L / 1.3, 0, 1);
  ctx.fillStyle = lg(ctx, 0, ly, 0, wy + wh, [[0, '#d7a468'], [0.15, '#a8683a'], [1, '#2a1408']]); ctx.fillRect(wx, ly, ww, wy + wh - ly + 2);
  for (let i = 0; i < 9; i++) { const by = wy + wh - (wy + wh - ly) * (0.08 + 0.9 * ((hash(i, 6) + t * 0.35 * (0.4 + hash(i, 7))) % 1)); bubble(ctx, wx + ww * (0.25 + 0.5 * hash(i, 8)), by, ww * (0.09 + 0.1 * hash(i, 9)), '#e0b072', 0.9); }
  ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(wx + ww * 0.12, wy + 3, ww * 0.16, wh - 6);
  ctx.restore();
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.lineWidth = 1.6; body(); ctx.stroke();
  // band marks beside the window
  const b0 = wy + wh - wh * (0.9 / 1.3), b1 = wy + wh - wh * (0.62 / 1.3), r1 = wy + wh - wh * (1 / 1.3);
  ctx.fillStyle = 'rgba(120,255,190,0.9)'; ctx.fillRect(wx + ww + 5, b0, 7, b1 - b0); ctx.fillRect(wx - 12, b0, 7, b1 - b0);
  ctx.fillStyle = '#ff6a4a'; ctx.fillRect(wx + ww + 5, r1 - 1.5, 11, 3); ctx.fillRect(wx - 16, r1 - 1.5, 11, 3);
  // the neck rim, a plug of straw, and foam breaking out when it overflows
  ctx.fillStyle = lg(ctx, -0.06 * k, 0, 0.06 * k, 0, [[0, '#2a170c'], [0.3, '#8a5a34'], [1, '#2a170c']]); ell(ctx, 0, -0.376 * k, 0.058 * k, 0.014 * k); ctx.fill();
  ctx.fillStyle = '#0c0603'; ell(ctx, 0, -0.376 * k, 0.042 * k, 0.009 * k); ctx.fill();
  if (o.plug !== false) { ctx.strokeStyle = '#d7c07a'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; for (let q = 0; q < 11; q++) { const a = (q - 5) * 0.2; ctx.strokeStyle = q % 2 ? '#d7c07a' : '#b89a52'; ctx.beginPath(); ctx.moveTo(Math.sin(a) * 0.012 * k, -0.376 * k); ctx.quadraticCurveTo(Math.sin(a) * 0.03 * k, -0.4 * k, Math.sin(a) * 0.05 * k, -(0.405 + 0.01 * Math.cos(q)) * k); ctx.stroke(); } }
  if (L > 1.0 && o.spillK > 0) { const b = clamp(o.spillK, 0, 1); ctx.fillStyle = `rgba(60,34,14,${0.9 * b})`; for (const [dx, len] of [[-0.03, 0.14], [0.02, 0.2], [0.035, 0.1]]) { ctx.beginPath(); ctx.moveTo((dx - 0.012) * k, -0.372 * k); ctx.lineTo((dx + 0.012) * k, -0.372 * k); ctx.lineTo((dx + 0.01) * k, (-0.372 + len * b) * k); ctx.quadraticCurveTo(dx * k, (-0.365 + len * b) * k, (dx - 0.01) * k, (-0.372 + len * b) * k); ctx.closePath(); ctx.fill(); } foam(ctx, 0, -0.385 * k, 0.045 * k, 0.012 * k, 0.04 * k * (L - 1) * 3, t, { n: 24, seed: 5 }); }
  ctx.restore();
}

// a handleless cup (sini): tall, tapering, a glazed rim band; fill 0..1.1 liquid, grounds 0..1 speckle, foam 0..1
export function sini(ctx, x, y, s, fill, grounds, t, o = {}) {
  ctx.save(); ctx.translate(x, y); groundShadow(ctx, 0, s * 0.03, s * 0.52, s * 0.12, 0.5);
  const cw = s * 0.36, ch = s * 0.5, my = -ch, mrx = cw, mry = s * 0.1;
  ctx.beginPath(); ctx.moveTo(-cw, my); ctx.bezierCurveTo(-cw * 1.02, -ch * 0.35, -cw * 0.7, -s * 0.03, -cw * 0.55, 0); ctx.lineTo(cw * 0.55, 0); ctx.bezierCurveTo(cw * 0.7, -s * 0.03, cw * 1.02, -ch * 0.35, cw, my); ctx.closePath();
  ctx.fillStyle = cyl(ctx, -cw, cw, o.c ?? '#f4efe4', { hl: 0.3, spec: 0.12, bounce: '#ffd9a8' }); ctx.fill(); ctx.strokeStyle = 'rgba(60,40,20,0.5)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.fillStyle = o.band ?? '#b8321f'; ctx.fillRect(-cw, my + s * 0.02, cw * 2, s * 0.045); ctx.fillStyle = '#e0b030'; ctx.fillRect(-cw, my + s * 0.07, cw * 2, 1.6);
  ctx.strokeStyle = o.band ?? '#b8321f'; ctx.lineWidth = 1.4; for (let q = -3; q <= 3; q++) { ctx.beginPath(); ctx.moveTo(q * cw * 0.28, -ch * 0.62); ctx.lineTo(q * cw * 0.28 + cw * 0.1, -ch * 0.34); ctx.lineTo(q * cw * 0.28 + cw * 0.2, -ch * 0.62); ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = '#fbf8ef'; ell(ctx, 0, my, mrx, mry); ctx.fill(); ctx.strokeStyle = '#c89a38'; ctx.lineWidth = 1.8; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, my, Math.max(0.5, mrx - 2), Math.max(0.5, mry - 1.5), 0, 0, TAU); ctx.clip();
  ctx.fillStyle = '#e9e5da'; ctx.fillRect(-mrx, my - mry, mrx * 2, mry * 2);
  if (fill > 0.02) {
    const sy = my + mry * 0.55 - clamp(fill, 0, 1.1) * mry * 0.95;
    ctx.fillStyle = rg(ctx, 0, sy, 1, mrx, [[0, '#5a3418'], [1, '#1e0e06']]); ell(ctx, 0, sy, Math.max(0.5, mrx - 2), Math.max(0.5, mry - 1.5)); ctx.fill();
    if (grounds > 0.03) { ctx.fillStyle = `rgba(20,10,4,${clamp(grounds, 0, 1) * 0.9})`; for (let q = 0; q < 12; q++) { ctx.beginPath(); ctx.arc((hash(q, 1) - 0.5) * mrx * 1.5, sy + (hash(q, 2) - 0.5) * mry, 1.5 + hash(q, 3) * 1.6, 0, TAU); ctx.fill(); } }
    ctx.strokeStyle = 'rgba(255,240,215,0.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(0, sy, Math.max(0.5, mrx - 4), Math.max(0.5, mry - 3), 0, 3.5, 5.1); ctx.stroke();
    if (o.ripple > 0) { ctx.strokeStyle = `rgba(255,235,200,${0.5 * o.ripple})`; ctx.lineWidth = 1.2; ell(ctx, 0, sy, (Math.max(0.5, mrx - 4)) * (0.35 + 0.6 * (1 - o.ripple)), (Math.max(0.5, mry - 3)) * (0.35 + 0.6 * (1 - o.ripple))); ctx.stroke(); }
    if (fill > 0.6) { ctx.globalAlpha = 0.7; foam(ctx, 0, sy, Math.max(0.5, mrx - 3), Math.max(0.5, mry - 2), 0, t, { n: 10, seed: 31, tone: '#b8783a' }); ctx.globalAlpha = 1; }
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(60,40,20,0.5)'; ctx.lineWidth = 1.2; ell(ctx, 0, my, mrx, mry); ctx.stroke();
  if (o.hl) { ctx.strokeStyle = 'rgba(120,230,255,0.85)'; ctx.lineWidth = 2.4; ctx.setLineDash([5, 4]); ell(ctx, 0, -s * 0.02, s * 0.5, s * 0.14); ctx.stroke(); ctx.setLineDash([]); }
  ctx.restore();
}

// a woven round tray or mat: concentric coils of dyed grass
export function wovenDisc(ctx, x, y, rx, ry, t, cols = ['#d9b878', '#b8321f', '#2a6a4a', '#e0b030']) {
  ctx.save(); ctx.translate(x, y);
  shadowed(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 3, rx, ry, 0, 0, TAU); ctx.fillStyle = '#3a2410'; ctx.fill(); }, { blur: 12, dy: 6, a: 0.5 });
  const n = 9;
  for (let i = n; i >= 1; i--) { const f = i / n; ctx.fillStyle = cols[(i + (i > 7 ? 1 : 0)) % 2 === 0 ? 0 : (i % 4 === 1 ? 1 : i % 4 === 3 ? 2 : 3)]; ctx.fillStyle = i % 3 === 0 ? cols[1] : i === 5 ? cols[2] : i % 2 ? cols[0] : tint(cols[0], -0.12); ctx.beginPath(); ctx.ellipse(0, 0, rx * f, ry * f, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(60,35,10,0.45)'; ctx.lineWidth = 1.2; ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,240,200,0.18)'; ctx.lineWidth = 1; for (let q = 0; q < 70; q++) { const a = (q / 70) * TAU, f = 0.2 + 0.8 * hash(q, 3); ctx.beginPath(); ctx.moveTo(Math.cos(a) * rx * f, Math.sin(a) * ry * f); ctx.lineTo(Math.cos(a) * rx * (f + 0.1), Math.sin(a) * ry * (f + 0.1)); ctx.stroke(); }
  ctx.restore();
}

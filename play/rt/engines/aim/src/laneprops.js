// Props and people for the lane view (1.4.0): posts, cones, low boxes, arches and croquet hoops, a striped peg, a pin and flag in
// every hole, and a small thrower figure with a visible club, mallet, bat, cue, boot or throwing hand. Pure canvas.
import { mix, dark, light, alpha, vgrad, hgrad, poly, rrect, clamp } from './scenery.js';
import { drawBall } from './props.js';
import { drawHydrant } from './street.js';

const TAU = Math.PI * 2;
const ell = (ctx, x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.4, rx), Math.max(0.4, ry), rot, 0, TAU); };

export const STRIKERS = ['club', 'mallet', 'bat', 'cue', 'foot', 'hand', 'none'];
export const PROP_KINDS = ['post', 'stake', 'cone', 'box', 'bench', 'arch', 'net', 'rope', 'manhole', 'hydrant'];

// ---- pin and flag --------------------------------------------------------------------------------------------------------
export function drawFlag(ctx, c, color, t, k = 1) {
  const s = c.s, top = c.y - s * 1.0 * k, w = s * 0.46 * k, wave = Math.sin(t * 5 + c.x * 0.05);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = Math.max(2, s * 0.045); ctx.beginPath(); ctx.moveTo(c.x + 1.5, c.y + 1); ctx.lineTo(c.x + 1.5, top + 1); ctx.stroke();
  ctx.strokeStyle = '#f2f2ee'; ctx.lineWidth = Math.max(1.6, s * 0.035); ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x, top); ctx.stroke();
  ctx.fillStyle = vgrad(ctx, top, top + w * 0.6, [[0, light(color, 0.2)], [1, dark(color, 0.25)]]);
  ctx.beginPath(); ctx.moveTo(c.x, top);
  ctx.quadraticCurveTo(c.x + w * 0.5, top + w * (0.04 + 0.05 * wave), c.x + w + wave * s * 0.03, top + w * 0.26);
  ctx.quadraticCurveTo(c.x + w * 0.5, top + w * (0.44 + 0.04 * wave), c.x, top + w * 0.5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#d6b85a'; ctx.beginPath(); ctx.arc(c.x, top - 1, Math.max(1.6, s * 0.03), 0, TAU); ctx.fill();
}

// ---- props -----------------------------------------------------------------------------------------------------------------
function cyl(ctx, c, r, h, col) {
  // an upright cylinder standing on the ground at c (r, h in world units)
  const s = c.s, rr = r * s, hh = h * s * 1.8, f = c.f;
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ell(ctx, c.x + rr * 0.4, c.y + 1, rr * 1.4, rr * f * 1.1); ctx.fill();
  ctx.fillStyle = hgrad(ctx, c.x - rr, c.x + rr, [[0, light(col, 0.4)], [0.45, col], [1, dark(col, 0.5)]]);
  ctx.beginPath(); ctx.moveTo(c.x - rr, c.y); ctx.lineTo(c.x - rr, c.y - hh); ctx.ellipse(c.x, c.y - hh, rr, rr * f, 0, Math.PI, 0, true); ctx.lineTo(c.x + rr, c.y); ctx.ellipse(c.x, c.y, rr, rr * f, 0, 0, Math.PI); ctx.closePath(); ctx.fill();
  ctx.fillStyle = light(col, 0.25); ell(ctx, c.x, c.y - hh, rr, rr * f); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke();
}
function slab(ctx, tr, fs, x, y, w, d, h, col) {
  // a low box on the ground: top face, front face and one side, lit from the left
  const A = tr(x - w / 2, y - d / 2), B = tr(x + w / 2, y - d / 2), C = tr(x + w / 2, y + d / 2), D = tr(x - w / 2, y + d / 2);
  const lift = (p) => ({ x: p.x, y: p.y - h * p.s * 1.8 });
  const A2 = lift(A), B2 = lift(B), C2 = lift(C), D2 = lift(D);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; poly(ctx, [[A.x + 6, A.y + 2], [B.x + 6, B.y + 2], [C.x + 6, C.y], [D.x + 6, D.y]]); ctx.fill();
  ctx.fillStyle = dark(col, 0.2); poly(ctx, [[A.x, A.y], [B.x, B.y], [B2.x, B2.y], [A2.x, A2.y]]); ctx.fill();          // face toward the thrower
  ctx.fillStyle = dark(col, 0.45); poly(ctx, [[B.x, B.y], [C.x, C.y], [C2.x, C2.y], [B2.x, B2.y]]); ctx.fill();
  ctx.fillStyle = light(col, 0.18); poly(ctx, [[A2.x, A2.y], [B2.x, B2.y], [C2.x, C2.y], [D2.x, D2.y]]); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke();
  void fs;
}
// 1.6.0 tube hoop: a thick steel or painted wire with a specular line, a contact shadow, ground sockets and a coloured band on each leg
export function drawTubeHoop(ctx, tr, x, y, w, h, col, thick = 0.035, band = '#d8453a', lit = false) {
  const L = tr(x - w / 2, y), R = tr(x + w / 2, y), s = L.s, th = Math.max(5, thick * s * 3.4), hh = h * s * 1.8, f = 0.28;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, (L.x + R.x) / 2 + th * 0.9, L.y + 2, (R.x - L.x) / 2 + th * 1.5, Math.max(2, th * 0.55)); ctx.fill();
  for (const P of [L, R]) { ctx.fillStyle = '#1a1a1a'; ell(ctx, P.x, P.y, th * 0.95, th * f * 1.4); ctx.fill(); ctx.fillStyle = '#5a5a60'; ell(ctx, P.x, P.y, th * 0.7, th * f); ctx.fill(); }
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const path = () => { ctx.beginPath(); ctx.moveTo(L.x, L.y); ctx.lineTo(L.x, L.y - hh * 0.55); ctx.bezierCurveTo(L.x, L.y - hh * 1.04, R.x, R.y - hh * 1.04, R.x, R.y - hh * 0.55); ctx.lineTo(R.x, R.y); };
  ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = th + 3; path(); ctx.stroke();
  const g = ctx.createLinearGradient(L.x - th, 0, R.x + th, 0); g.addColorStop(0, dark(col, 0.1)); g.addColorStop(0.18, light(col, 0.55)); g.addColorStop(0.5, col); g.addColorStop(1, dark(col, 0.5));
  ctx.strokeStyle = g; ctx.lineWidth = th; path(); ctx.stroke();
  ctx.save(); ctx.translate(-th * 0.18, -th * 0.2); ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = Math.max(1.2, th * 0.22); path(); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = Math.max(1, th * 0.2); ctx.save(); ctx.translate(th * 0.28, th * 0.2); path(); ctx.stroke(); ctx.restore();
  for (const P of [L, R]) { ctx.strokeStyle = band; ctx.lineWidth = th * 1.04; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(P.x, P.y - hh * 0.12); ctx.lineTo(P.x, P.y - hh * 0.26); ctx.stroke(); }
  if (lit) { ctx.strokeStyle = alpha('#ffe27a', 0.8); ctx.lineWidth = th * 0.45; ctx.lineCap = 'round'; path(); ctx.stroke(); }
  ctx.lineCap = 'butt';
}
export function drawArch(ctx, tr, x, y, w, h, col, thick = 0.035, lit = false) {
  // a croquet hoop: two legs and a rounded crown, seen from the thrower's side
  const L = tr(x - w / 2, y), R = tr(x + w / 2, y), s = L.s, th = Math.max(2.5, thick * s * 2.2), hh = h * s * 1.8;
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(ctx, (L.x + R.x) / 2 + 3, L.y + 1, (R.x - L.x) / 2 + 3, Math.max(1.5, s * 0.05)); ctx.fill();
  const g = ctx.createLinearGradient(L.x, 0, R.x, 0); g.addColorStop(0, light(col, 0.5)); g.addColorStop(0.5, col); g.addColorStop(1, dark(col, 0.45));
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = th + 2;
  const path = () => { ctx.beginPath(); ctx.moveTo(L.x, L.y); ctx.lineTo(L.x, L.y - hh * 0.55); ctx.bezierCurveTo(L.x, L.y - hh * 1.02, R.x, R.y - hh * 1.02, R.x, R.y - hh * 0.55); ctx.lineTo(R.x, R.y); };
  path(); ctx.stroke();
  ctx.strokeStyle = g; ctx.lineWidth = th; path(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = Math.max(1, th * 0.25); ctx.beginPath(); ctx.moveTo(L.x - th * 0.18, L.y - hh * 0.1); ctx.lineTo(L.x - th * 0.18, L.y - hh * 0.5); ctx.stroke();
  if (lit) { ctx.strokeStyle = alpha('#ffe27a', 0.8); ctx.lineWidth = th * 0.45; path(); ctx.stroke(); }
  ctx.lineCap = 'butt';
}
export function drawPeg(ctx, c, r, h, cols, t) {
  // a striped finishing peg
  const s = c.s, rr = Math.max(2.5, r * s), hh = h * s * 1.8, f = c.f, n = cols.length;
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ell(ctx, c.x + rr * 0.5, c.y + 1, rr * 2.2, rr * f * 1.2); ctx.fill();
  for (let i = 0; i < n; i++) {
    const y1 = c.y - (hh * i) / n, y0 = c.y - (hh * (i + 1)) / n, col = cols[i];
    ctx.fillStyle = hgrad(ctx, c.x - rr, c.x + rr, [[0, light(col, 0.4)], [0.5, col], [1, dark(col, 0.5)]]); ctx.fillRect(c.x - rr, y0, rr * 2, y1 - y0 + 0.5);
  }
  ctx.fillStyle = '#f4f0e2'; ell(ctx, c.x, c.y - hh, rr, rr * f); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.stroke();
  void t;
}
export function drawProp(ctx, p, tr, fs, LK, pal) {
  const c0 = tr(p.x, p.y), c = { ...c0, f: c0.f ?? fs(p.y) }, col = p.color;
  if (p.kind === 'post') cyl(ctx, c, p.r ?? 0.06, p.h ?? 0.75, col ?? LK.post);
  else if (p.kind === 'stake') {
    const h = p.h ?? 0.6, r = p.r ?? 0.03, rr = Math.max(2, r * c.s), hh = h * c.s * 1.8;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(ctx, c.x + rr, c.y + 1, rr * 2.2, rr * c.f); ctx.fill();
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#f4f0e2' : (col ?? '#d8453a'); ctx.fillRect(c.x - rr, c.y - (hh * (i + 1)) / 6, rr * 2, hh / 6 + 0.5); }
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(c.x - rr * 0.6, c.y - hh, rr * 0.5, hh);
  } else if (p.kind === 'cone') {
    const r = p.r ?? 0.12, h = p.h ?? 0.32, rr = r * c.s, hh = h * c.s * 1.8;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(ctx, c.x + rr * 0.4, c.y + 1, rr * 1.2, rr * c.f); ctx.fill();
    ctx.fillStyle = col ?? '#ee7a2a'; poly(ctx, [[c.x - rr, c.y], [c.x + rr, c.y], [c.x + rr * 0.12, c.y - hh], [c.x - rr * 0.12, c.y - hh]]); ctx.fill();
    ctx.fillStyle = '#f4f0e2'; poly(ctx, [[c.x - rr * 0.64, c.y - hh * 0.38], [c.x + rr * 0.64, c.y - hh * 0.38], [c.x + rr * 0.4, c.y - hh * 0.62], [c.x - rr * 0.4, c.y - hh * 0.62]]); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; poly(ctx, [[c.x + rr * 0.1, c.y - hh], [c.x + rr * 0.12, c.y - hh], [c.x + rr, c.y], [c.x + rr * 0.2, c.y]]); ctx.fill();
    ctx.fillStyle = dark(col ?? '#ee7a2a', 0.35); ell(ctx, c.x, c.y, rr * 1.1, rr * c.f * 1.1); ctx.globalCompositeOperation = 'destination-over'; ctx.fill(); ctx.globalCompositeOperation = 'source-over';
  } else if (p.kind === 'box' || p.kind === 'bench') slab(ctx, tr, fs, p.x, p.y, p.w ?? (p.kind === 'bench' ? 1.2 : 0.6), p.d ?? (p.kind === 'bench' ? 0.3 : 0.4), p.h ?? (p.kind === 'bench' ? 0.35 : 0.25), col ?? (p.kind === 'bench' ? '#a5763d' : LK.edge));
  else if (p.kind === 'hydrant') drawHydrant(ctx, c, p.h ?? 0.6, p.r ?? 0.13, col ?? '#d8352b');
  else if (p.kind === 'arch') drawArch(ctx, tr, p.x, p.y, p.w ?? 0.5, p.h ?? 0.45, col ?? '#f2f2ee', p.r ?? 0.035);
  void pal;
}

// a boot or trainer from behind/above with a sole, upper, laces, accent stripe and highlights (1.6.0). rot rotates it; flat = standing view
export function drawShoe(ctx, x, y, size, rot, col, accent, flat = false) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const w = size, h = flat ? size * 0.62 : size * 1.7;
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ell(ctx, w * 0.1, h * 0.1, w * 0.78, h * 0.3); ctx.fill();
  // sole
  ctx.fillStyle = '#f2f0ea'; rrect(ctx, -w * 0.62, -h * 0.58, w * 1.24, h * 1.1, w * 0.5); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.stroke();
  // upper
  const g = ctx.createLinearGradient(-w * 0.6, -h * 0.5, w * 0.6, h * 0.4); g.addColorStop(0, light(col, 0.5)); g.addColorStop(0.45, col); g.addColorStop(1, dark(col, 0.45));
  ctx.fillStyle = g; rrect(ctx, -w * 0.55, -h * 0.55, w * 1.1, h * 0.98, w * 0.46); ctx.fill();
  if (!flat) {
    ctx.strokeStyle = alpha('#ffffff', 0.85); ctx.lineWidth = Math.max(1, w * 0.09); ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const yy = -h * 0.32 + i * h * 0.16; ctx.beginPath(); ctx.moveTo(-w * 0.3, yy - w * 0.08); ctx.lineTo(w * 0.3, yy + w * 0.08); ctx.moveTo(w * 0.3, yy - w * 0.08); ctx.lineTo(-w * 0.3, yy + w * 0.08); ctx.stroke(); }
    ctx.lineCap = 'butt';
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ell(ctx, 0, h * 0.34, w * 0.34, h * 0.1); ctx.fill();
  }
  ctx.fillStyle = accent; ctx.fillRect(-w * 0.55, -h * 0.08, w * 0.16, h * 0.28); ctx.fillRect(w * 0.39, -h * 0.08, w * 0.16, h * 0.28);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ell(ctx, -w * 0.18, -h * 0.28, w * 0.14, h * 0.2, 0.3); ctx.fill();
  ctx.restore();
}

// ---- a small thrower and the tool in their hands ------------------------------------------------------------------------------
const lerp = (a, b, t) => a + (b - a) * t;
// th = thrower spot on screen {x, y, s}; sw: -1 full back-swing ... 0 rest ... +1 follow-through; aimDir: screen angle of the throw
export function drawStriker(ctx, th, kind, sw, o = {}) {
  if (!kind || kind === 'none') return;
  const u = th.s * (o.scale ?? 1), jersey = o.jersey ?? '#d8453a', skin = o.skin ?? '#d6a077', pants = o.pants ?? '#2b3140', wood = o.wood ?? '#a5763d';
  const fx = th.x + (o.side ?? -1) * u * 0.78 * (o.sideMul ?? 1), fy = th.y + u * 0.42;           // feet of the figure, beside the ball, a little nearer
  const H = u * 1.55;                                                          // figure height in px
  const idle = o.fancy && sw === 0 ? Math.sin((o.t ?? 0) * 1.4) : 0;
  const lean = (sw < 0 ? sw * 0.06 : sw * 0.1) + idle * 0.012;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, fx + u * 0.2, fy + 3, u * 0.55, u * 0.12); ctx.fill();
  const hip = { x: fx + lean * H * 0.3, y: fy - H * 0.46 }, sh = { x: fx + lean * H, y: fy - H * 0.8 }, head = { x: fx + lean * H * 1.2, y: fy - H * 0.92 };
  const grad = (c1, x0, x1) => hgrad(ctx, x0, x1, [[0, light(c1, 0.2)], [0.55, c1], [1, dark(c1, 0.45)]]);
  // legs and shoes (a kicking foot is drawn separately)
  const legW = H * 0.11;
  for (const dx of [-0.1, 0.1]) {
    if (kind === 'foot' && dx > 0) continue;
    ctx.fillStyle = grad(pants, fx + (dx - 0.07) * H, fx + (dx + 0.07) * H);
    rrect(ctx, fx + dx * H - legW / 2, fy - H * 0.5, legW, H * 0.5, legW * 0.4); ctx.fill();
    if (o.fancy) drawShoe(ctx, fx + dx * H, fy - legW * 0.1, legW * 0.95, 0, o.shoes ?? '#1a1a20', o.shoeAccent ?? '#e8453a', true);
    else { ctx.fillStyle = o.shoes ?? '#1a1a20'; ell(ctx, fx + dx * H, fy - 1, legW * 0.75, legW * 0.42); ctx.fill(); }
  }
  // torso from behind, with a number panel
  ctx.fillStyle = vgrad(ctx, sh.y, hip.y, [[0, light(jersey, 0.15)], [1, dark(jersey, 0.3)]]);
  ctx.beginPath(); ctx.moveTo(sh.x - H * 0.2, sh.y); ctx.lineTo(sh.x + H * 0.2, sh.y); ctx.lineTo(hip.x + H * 0.14, hip.y + H * 0.04); ctx.lineTo(hip.x - H * 0.14, hip.y + H * 0.04); ctx.closePath(); ctx.fill();
  ctx.fillStyle = alpha('#ffffff', 0.85); rrect(ctx, sh.x - H * 0.09, sh.y + H * 0.08, H * 0.18, H * 0.14, H * 0.02); ctx.fill();
  if (o.fancy) {
    // 1.6.0 body: rounded shoulders, side shading, a collar, a neck, a belt and a hem
    for (const sgn of [-1, 1]) { const g = ctx.createRadialGradient(sh.x + sgn * H * 0.19 - sgn * H * 0.02, sh.y - H * 0.01, 1, sh.x + sgn * H * 0.19, sh.y + H * 0.01, H * 0.1); g.addColorStop(0, light(jersey, 0.15)); g.addColorStop(1, jersey); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sh.x + sgn * H * 0.185, sh.y + H * 0.015, H * 0.06, 0, TAU); ctx.fill(); }
    ctx.fillStyle = hgrad(ctx, sh.x - H * 0.2, sh.x + H * 0.2, [[0, 'rgba(255,255,255,0.1)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.3)']]);
    ctx.beginPath(); ctx.moveTo(sh.x - H * 0.2, sh.y); ctx.lineTo(sh.x + H * 0.2, sh.y); ctx.lineTo(hip.x + H * 0.14, hip.y + H * 0.04); ctx.lineTo(hip.x - H * 0.14, hip.y + H * 0.04); ctx.closePath(); ctx.fill();
    ctx.fillStyle = dark(skin, 0.1); rrect(ctx, head.x - H * 0.04, head.y + H * 0.05, H * 0.08, H * 0.075, H * 0.02); ctx.fill();
    ctx.fillStyle = dark(jersey, 0.25); ctx.beginPath(); ctx.ellipse(sh.x, sh.y - H * 0.005, H * 0.07, H * 0.028, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(hip.x - H * 0.14, hip.y - H * 0.012, H * 0.28, H * 0.022); ctx.fillStyle = alpha('#ffffff', 0.18); ctx.fillRect(sh.x - H * 0.2, sh.y + H * 0.005, H * 0.4, H * 0.008);
  }
  // head and hair
  if (o.fancy) { ctx.fillStyle = dark(skin, 0.12); ell(ctx, head.x - H * 0.088, head.y + H * 0.005, H * 0.018, H * 0.03); ctx.fill(); ell(ctx, head.x + H * 0.088, head.y + H * 0.005, H * 0.018, H * 0.03); ctx.fill(); }
  ctx.fillStyle = skin; ell(ctx, head.x, head.y, H * 0.085, H * 0.1); ctx.fill();
  ctx.fillStyle = o.hair ?? '#2a1a12'; ctx.beginPath(); ctx.ellipse(head.x, head.y - H * 0.02, H * 0.09, H * 0.09, 0, Math.PI * 1.02, TAU * 1.0); ctx.fill(); ell(ctx, head.x, head.y + H * 0.005, H * 0.085, H * 0.075); ctx.fill();
  if (o.fancy && o.hairStyle) {
    // 1.6.5 hair from behind: long (falls to the shoulders), pony (a tail that swings), bun, curly (clusters), bald
    const hc = o.hair ?? '#2a1a12', sw2 = Math.sin((o.t ?? 0) * 2.2) * H * 0.012;
    if (o.hairStyle === 'long') { ctx.fillStyle = hgrad(ctx, head.x - H * 0.1, head.x + H * 0.1, [[0, light(hc, 0.15)], [1, dark(hc, 0.3)]]); ctx.beginPath(); ctx.moveTo(head.x - H * 0.095, head.y - H * 0.02); ctx.quadraticCurveTo(head.x - H * 0.13, head.y + H * 0.14, head.x - H * 0.08, sh.y + H * 0.1); ctx.lineTo(head.x + H * 0.08, sh.y + H * 0.1); ctx.quadraticCurveTo(head.x + H * 0.13, head.y + H * 0.14, head.x + H * 0.095, head.y - H * 0.02); ctx.closePath(); ctx.fill(); }
    else if (o.hairStyle === 'pony') { ctx.strokeStyle = hc; ctx.lineWidth = H * 0.045; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(head.x, head.y - H * 0.04); ctx.quadraticCurveTo(head.x + H * 0.05 + sw2, head.y + H * 0.06, head.x + H * 0.03 + sw2 * 2, sh.y + H * 0.04); ctx.stroke(); ctx.lineCap = 'butt'; ctx.fillStyle = '#e8453a'; ctx.beginPath(); ctx.arc(head.x, head.y - H * 0.035, H * 0.014, 0, TAU); ctx.fill(); }
    else if (o.hairStyle === 'bun') { ctx.fillStyle = hc; ctx.beginPath(); ctx.arc(head.x, head.y - H * 0.115, H * 0.04, 0, TAU); ctx.fill(); ctx.fillStyle = alpha('#ffffff', 0.18); ctx.beginPath(); ctx.arc(head.x - H * 0.01, head.y - H * 0.125, H * 0.014, 0, TAU); ctx.fill(); }
    else if (o.hairStyle === 'curly') { ctx.fillStyle = hc; for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI; ctx.beginPath(); ctx.arc(head.x + Math.cos(a) * H * 0.08, head.y - H * 0.02 + Math.sin(a) * H * 0.085, H * 0.034, 0, TAU); ctx.fill(); } ctx.fillStyle = alpha('#ffffff', 0.12); ctx.beginPath(); ctx.arc(head.x - H * 0.03, head.y - H * 0.08, H * 0.02, 0, TAU); ctx.fill(); }
    else if (o.hairStyle === 'bald') { ctx.fillStyle = skin; ell(ctx, head.x, head.y, H * 0.085, H * 0.1); ctx.fill(); ctx.fillStyle = alpha('#ffffff', 0.2); ell(ctx, head.x - H * 0.03, head.y - H * 0.04, H * 0.025, H * 0.03); ctx.fill(); }
  }
  if (o.hat === 'cap') {
    // a baseball cap worn forwards: from behind you see the crown, the strap and a hint of the brim at the temples
    const hc = o.hatColor ?? jersey;
    ctx.fillStyle = hgrad(ctx, head.x - H * 0.1, head.x + H * 0.1, [[0, light(hc, 0.18)], [0.6, hc], [1, dark(hc, 0.4)]]);
    ctx.beginPath(); ctx.ellipse(head.x, head.y - H * 0.03, H * 0.098, H * 0.092, 0, Math.PI * 0.98, TAU * 1.0); ctx.lineTo(head.x + H * 0.098, head.y + H * 0.012); ctx.lineTo(head.x - H * 0.098, head.y + H * 0.012); ctx.closePath(); ctx.fill();
    ctx.fillStyle = dark(hc, 0.3); ctx.fillRect(head.x - H * 0.098, head.y + H * 0.006, H * 0.196, H * 0.012);
    ctx.fillStyle = light(hc, 0.3); ctx.beginPath(); ctx.arc(head.x, head.y - H * 0.118, H * 0.011, 0, TAU); ctx.fill();
    ctx.fillStyle = dark(hc, 0.45); ell(ctx, head.x - H * 0.1, head.y - H * 0.0, H * 0.018, H * 0.008); ctx.fill(); ell(ctx, head.x + H * 0.1, head.y - H * 0.0, H * 0.018, H * 0.008); ctx.fill();
  } else if (o.hat === 'beanie') {
    const hc = o.hatColor ?? jersey;
    ctx.fillStyle = hgrad(ctx, head.x - H * 0.1, head.x + H * 0.1, [[0, light(hc, 0.2)], [0.6, hc], [1, dark(hc, 0.4)]]);
    ctx.beginPath(); ctx.ellipse(head.x, head.y - H * 0.035, H * 0.1, H * 0.098, 0, Math.PI, TAU); ctx.lineTo(head.x + H * 0.1, head.y - H * 0.012); ctx.lineTo(head.x - H * 0.1, head.y - H * 0.012); ctx.closePath(); ctx.fill();
    ctx.fillStyle = dark(hc, 0.18); rrect(ctx, head.x - H * 0.105, head.y - H * 0.03, H * 0.21, H * 0.04, H * 0.014); ctx.fill();
    ctx.fillStyle = light(hc, 0.25); ctx.beginPath(); ctx.arc(head.x, head.y - H * 0.135, H * 0.022, 0, TAU); ctx.fill();
  }
  // the tool: anchored at the hands, working toward the ball
  const hand = { x: lerp(sh.x, th.x, 0.55) + (o.side ?? -1) * -u * 0.02, y: sh.y + H * 0.3 + sw * H * 0.04 };
  const ball = { x: th.x, y: th.y - u * 0.05 };
  const back = { x: ball.x + u * 0.55 * (-Math.min(0, sw)), y: ball.y + u * 0.9 * (-Math.min(0, sw)) };       // head of the tool at full back-swing: down and toward the thrower
  const thru = { x: ball.x - u * 0.2 * Math.max(0, sw), y: ball.y - u * 0.55 * Math.max(0, sw) };            // follow-through: past the ball, up the lane
  const tip = { x: ball.x + (back.x - ball.x) + (thru.x - ball.x), y: ball.y + (back.y - ball.y) + (thru.y - ball.y) };
  const armPlain = (a, b, col, w) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.lineCap = 'butt'; };
  const arm = !o.fancy ? armPlain : (a, b, col, w) => {
    // tapered sleeve with a slight elbow, a lit edge and a lighter cuff
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, bend = Math.min(L * 0.08, w * 0.9) * (a.x < th.x ? -1 : 1);
    const e = { x: a.x + dx * 0.52 + nx * bend, y: a.y + dy * 0.52 + ny * bend };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = dark(col, 0.45); ctx.lineWidth = w * 1.16; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(e.x, e.y); ctx.stroke(); ctx.lineWidth = w * 0.92; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(e.x, e.y); ctx.stroke(); ctx.lineWidth = w * 0.8; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.strokeStyle = alpha('#ffffff', 0.2); ctx.lineWidth = Math.max(1, w * 0.22); ctx.beginPath(); ctx.moveTo(a.x - nx * w * 0.2, a.y - ny * w * 0.2); ctx.lineTo(e.x - nx * w * 0.2, e.y - ny * w * 0.2); ctx.lineTo(b.x - nx * w * 0.16, b.y - ny * w * 0.16); ctx.stroke();
    ctx.strokeStyle = light(col, 0.6); ctx.lineWidth = w * 0.86; ctx.beginPath(); ctx.moveTo(b.x - dx / L * w * 0.35, b.y - dy / L * w * 0.35); ctx.lineTo(b.x - dx / L * w * 0.12, b.y - dy / L * w * 0.12); ctx.stroke();
    ctx.lineCap = 'butt';
  };
  const shaft = (from, to, w0, w1, col) => {
    const dx = to.x - from.x, dy = to.y - from.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    ctx.fillStyle = hgrad(ctx, Math.min(from.x, to.x) - w0, Math.max(from.x, to.x) + w0, [[0, light(col, 0.3)], [1, dark(col, 0.4)]]);
    poly(ctx, [[from.x + nx * w0 / 2, from.y + ny * w0 / 2], [to.x + nx * w1 / 2, to.y + ny * w1 / 2], [to.x - nx * w1 / 2, to.y - ny * w1 / 2], [from.x - nx * w0 / 2, from.y - ny * w0 / 2]]); ctx.fill();
  };
  const ang = Math.atan2(tip.y - hand.y, tip.x - hand.x);
  if (kind === 'foot') {
    const foot = { x: lerp(th.x - u * 0.3, th.x + u * 0.5, -Math.min(0, sw)) - u * 0.2 * Math.max(0, sw), y: ball.y + u * 0.6 * -Math.min(0, sw) - u * 0.4 * Math.max(0, sw) + u * 0.25 };
    arm(hip, foot, o.fancy ? pants : grad(pants, 0, 1), legW * 1.05);
    if (o.fancy) arm({ x: hip.x - legW * 0.18, y: hip.y }, { x: foot.x - legW * 0.18, y: foot.y }, light(pants, 0.18), legW * 0.3);
    if (o.fancy) drawShoe(ctx, foot.x, foot.y, legW * 1.15, Math.atan2(ball.y - foot.y, ball.x - foot.x) + Math.PI / 2, o.shoes ?? '#1a1a20', o.shoeAccent ?? '#e8453a');
    else { ctx.fillStyle = o.shoes ?? '#1a1a20'; ctx.save(); ctx.translate(foot.x, foot.y); ctx.rotate(Math.atan2(ball.y - foot.y, ball.x - foot.x) + Math.PI / 2); rrect(ctx, -legW * 0.62, -legW * 0.8, legW * 1.24, legW * 1.9, legW * 0.5); ctx.fill(); ctx.restore(); }
    arm({ x: sh.x - H * 0.19, y: sh.y + H * 0.04 }, { x: sh.x - H * 0.3, y: hip.y }, jersey, H * 0.07); arm({ x: sh.x + H * 0.19, y: sh.y + H * 0.04 }, { x: sh.x + H * 0.3, y: hip.y }, jersey, H * 0.07);
  } else if (kind === 'hand') {
    const hpos = { x: lerp(ball.x - u * 0.15, ball.x + u * 0.3, -Math.min(0, sw)), y: ball.y + u * 0.2 + u * 0.7 * -Math.min(0, sw) - u * 0.5 * Math.max(0, sw) };
    arm({ x: sh.x + H * 0.19, y: sh.y + H * 0.05 }, hpos, jersey, H * 0.075);
    arm({ x: sh.x - H * 0.19, y: sh.y + H * 0.05 }, { x: sh.x - H * 0.28, y: hip.y }, jersey, H * 0.07);
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(hpos.x, hpos.y, H * 0.05, 0, TAU); ctx.fill();
  } else {
    // two hands on the handle (club, mallet, bat) or a bridge hand and a pulling hand (cue)
    const reach = Math.hypot(tip.x - hand.x, tip.y - hand.y), len = kind === 'cue' ? reach + u * 0.05 : reach;
    const dir = { x: Math.cos(ang), y: Math.sin(ang) }, end = { x: hand.x + dir.x * len, y: hand.y + dir.y * len };
    arm({ x: sh.x - H * 0.19, y: sh.y + H * 0.04 }, hand, jersey, H * 0.07); arm({ x: sh.x + H * 0.19, y: sh.y + H * 0.04 }, hand, jersey, H * 0.07);
    if (kind === 'cue') {
      shaft({ x: hand.x - dir.x * u * 0.5, y: hand.y - dir.y * u * 0.5 }, end, u * 0.065, u * 0.02, '#c8a060');
      ctx.fillStyle = '#4a7ab0'; ell(ctx, end.x, end.y, u * 0.016, u * 0.016); ctx.fill();
    } else if (kind === 'mallet') {
      shaft(hand, end, u * 0.05, u * 0.04, wood);
      ctx.save(); ctx.translate(end.x, end.y); ctx.rotate(ang);
      ctx.fillStyle = hgrad(ctx, -u * 0.12, u * 0.12, [[0, light(wood, 0.35)], [0.5, wood], [1, dark(wood, 0.5)]]); rrect(ctx, -u * 0.07, -u * 0.2, u * 0.34, u * 0.4, u * 0.05); ctx.fill();
      ctx.fillStyle = o.band ?? '#2d6bb0'; ctx.fillRect(-u * 0.07 + u * 0.05, -u * 0.2, u * 0.05, u * 0.4); ctx.fillRect(-u * 0.07 + u * 0.22, -u * 0.2, u * 0.05, u * 0.4);
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(-u * 0.07, -u * 0.2, u * 0.34, u * 0.4);
      ctx.restore();
    } else if (kind === 'bat') {
      shaft(hand, { x: hand.x + dir.x * len * 0.4, y: hand.y + dir.y * len * 0.4 }, u * 0.05, u * 0.05, '#2a2a30');
      ctx.save(); ctx.translate(hand.x + dir.x * len * 0.4, hand.y + dir.y * len * 0.4); ctx.rotate(ang);
      ctx.fillStyle = vgrad(ctx, -u * 0.17, u * 0.17, [[0, light('#e3c38a', 0.25)], [1, dark('#d2a966', 0.35)]]);
      ctx.beginPath(); ctx.moveTo(0, -u * 0.03); ctx.lineTo(u * 0.1, -u * 0.15); ctx.lineTo(u * 0.7, -u * 0.17); ctx.quadraticCurveTo(u * 0.75, 0, u * 0.7, u * 0.17); ctx.lineTo(u * 0.1, u * 0.15); ctx.lineTo(0, u * 0.03); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(80,50,20,0.5)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    } else {
      shaft(hand, end, u * 0.04, u * 0.03, '#b8bcc4');
      ctx.save(); ctx.translate(end.x, end.y); ctx.rotate(ang);
      ctx.fillStyle = vgrad(ctx, -u * 0.1, u * 0.1, [[0, '#d0d4da'], [1, '#6a6e78']]); ctx.beginPath(); ctx.moveTo(-u * 0.04, -u * 0.04); ctx.lineTo(u * 0.22, -u * 0.12); ctx.quadraticCurveTo(u * 0.26, 0, u * 0.22, u * 0.12); ctx.lineTo(-u * 0.04, u * 0.04); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.stroke(); ctx.restore();
    }
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(hand.x, hand.y, H * 0.045, 0, TAU); ctx.fill();
  }
  ctx.restore();
  void drawBall; void mix;
}

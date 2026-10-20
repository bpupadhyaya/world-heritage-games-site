// Craft art for the tempo-race "chase view": every vessel is drawn in side profile (bow to the right), at hero scale, in
// its own proportions, with lit hulls, a seated or standing crew made of simple silhouettes (capsule limbs, two-bone arms,
// no faces), paddles/poles/sails that follow the stroke or the trim. Pure canvas, no assets, deterministic.
// All crafts share one local frame: origin = centre of the hull at the waterline, x along the hull (S px = hull length), y down.

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (k) => k * k * (3 - 2 * k);
export const hash = (n) => { let h = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };

// ---- colour helpers ---------------------------------------------------------------------------------------------------
export const parseC = (c) => {
  if (typeof c !== 'string') return [128, 128, 128];
  if (c[0] === '#') { const h = c.slice(1), f = h.length === 3 ? h.split('').map((x) => x + x).join('') : h.padEnd(6, '0'); return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)]; }
  const m = c.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [128, 128, 128];
};
export const mix = (a, b, k) => { const p = parseC(a), q = parseC(b); return `rgb(${p.map((v, i) => Math.round(v + (q[i] - v) * k)).join(',')})`; };
export const lit = (c, k) => mix(c, '#ffffff', k);
export const dim = (c, k) => mix(c, '#000000', k);
export const alpha = (c, a) => { const [r, g, b] = parseC(c); return `rgba(${r},${g},${b},${a})`; };

// ---- path helpers -----------------------------------------------------------------------------------------------------
// smooth polyline through points (quadratic midpoints); open path continues the current sub-path
export function smooth(ctx, pts, move = true) {
  if (pts.length < 3) { pts.forEach(([x, y], i) => (i || !move ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); return; }
  if (move) ctx.moveTo(pts[0][0], pts[0][1]); else ctx.lineTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); }
  const l = pts[pts.length - 1]; ctx.lineTo(l[0], l[1]);
}
const sc = (S, pts) => pts.map(([x, y]) => [x * S, y * S]);
export function capsule(ctx, x0, y0, x1, y1, w, fill) {
  ctx.strokeStyle = fill; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
}
const lg = (ctx, x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };

// ---- people: silhouettes with lit volume, never faces -------------------------------------------------------------------
export const SKINS = ['#c98f62', '#a96f46', '#8a5636', '#d9a57a', '#6f4429'];
export const SHIRTS = ['#e8453a', '#f2c14e', '#2d7bd6', '#f4f0e4', '#3fa856', '#c25b9a', '#e8873a', '#1d9aa8'];
function ik(sx, sy, hx, hy, a, b, dir) {   // elbow point for a two-bone arm; dir = +1 / -1 picks the bend side
  let dx = hx - sx, dy = hy - sy, d = Math.hypot(dx, dy) || 1;
  const reach = a + b;
  if (d > reach * 0.98) { a = a * d / (reach * 0.98); b = b * d / (reach * 0.98); }
  const x = (d * d + a * a - b * b) / (2 * d), h = Math.sqrt(Math.max(0, a * a - x * x));
  return [sx + (dx / d) * x - (dy / d) * h * dir, sy + (dy / d) * x + (dx / d) * h * dir];
}
export function head(ctx, hx, hy, r, skin, hat, hatCol, face = 1) {
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(hx, hy, r, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.arc(hx - r * 0.25 * face, hy + r * 0.2, r * 0.9, 0.2, 3.0); ctx.fill();
  ctx.fillStyle = lit(skin, 0.25); ctx.beginPath(); ctx.arc(hx + r * 0.3 * face, hy - r * 0.35, r * 0.3, 0, TAU); ctx.fill();
  switch (hat) {
    case 'band': ctx.fillStyle = '#2a1c14'; ctx.beginPath(); ctx.arc(hx - r * 0.12 * face, hy - r * 0.15, r * 1.02, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); ctx.fill(); ctx.fillStyle = hatCol; ctx.fillRect(hx - r * 1.0, hy - r * 0.42, r * 2, r * 0.32); break;
    case 'cap': ctx.fillStyle = hatCol; ctx.beginPath(); ctx.arc(hx, hy - r * 0.1, r * 1.08, Math.PI, TAU); ctx.fill(); ctx.fillRect(hx - r * 1.08, hy - r * 0.16, r * 2.16, r * 0.2); ctx.fillStyle = dim(hatCol, 0.3); ctx.fillRect(hx + (face > 0 ? r * 0.7 : -r * 1.5), hy - r * 0.12, r * 0.8, r * 0.14); break;
    case 'toque': ctx.fillStyle = hatCol; ctx.beginPath(); ctx.arc(hx, hy - r * 0.18, r * 1.1, Math.PI, TAU); ctx.fill(); ctx.fillStyle = lit(hatCol, 0.35); ctx.fillRect(hx - r * 1.1, hy - r * 0.34, r * 2.2, r * 0.3); ctx.fillStyle = '#f4f0e4'; ctx.beginPath(); ctx.arc(hx, hy - r * 1.28, r * 0.34, 0, TAU); ctx.fill(); break;
    case 'straw': ctx.fillStyle = '#d6b86a'; ctx.beginPath(); ctx.ellipse(hx, hy - r * 0.55, r * 2.1, r * 0.4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8cf86'; ctx.beginPath(); ctx.arc(hx, hy - r * 0.6, r * 0.85, Math.PI, TAU); ctx.fill(); ctx.fillStyle = hatCol; ctx.fillRect(hx - r * 0.85, hy - r * 0.78, r * 1.7, r * 0.2); break;
    case 'wrap': ctx.fillStyle = hatCol; ctx.beginPath(); ctx.ellipse(hx - r * 0.1 * face, hy - r * 0.3, r * 1.15, r * 0.95, 0, Math.PI, TAU); ctx.closePath(); ctx.fill(); ctx.fillStyle = lit(hatCol, 0.3); ctx.fillRect(hx - r * 1.1, hy - r * 0.5, r * 2.2, r * 0.2); break;
    default: ctx.fillStyle = '#20150f'; ctx.beginPath(); ctx.arc(hx - r * 0.15 * face, hy - r * 0.2, r * 1.04, Math.PI * 1.02, Math.PI * 2.0); ctx.closePath(); ctx.fill();
  }
}
// torso as a lit capsule from hip to shoulder
export function torso(ctx, hx, hy, sx, sy, w, col) {
  const g = lg(ctx, hx - w, hy, hx + w, hy, [[0, dim(col, 0.28)], [0.45, col], [1, lit(col, 0.28)]]);
  capsule(ctx, hx, hy, sx, sy, w, g);
}
export function arm(ctx, sx, sy, hx, hy, w, sleeve, skin, dirB, u) {
  const [ex, ey] = ik(sx, sy, hx, hy, u * 0.66, u * 0.66, dirB);
  capsule(ctx, sx, sy, ex, ey, w, sleeve); capsule(ctx, ex, ey, hx, hy, w * 0.86, skin);
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(hx, hy, w * 0.58, 0, TAU); ctx.fill();
}

// a paddle: shaft from top hand T to the tip, a lit blade at the end
export function paddleDraw(ctx, tx, ty, qx, qy, ang, lb, u, blade, wood = '#d9b57a') {
  const dx = Math.sin(ang), dy = Math.cos(ang);
  const ex = qx + dx * lb, ey = qy + dy * lb;
  capsule(ctx, tx, ty, ex - dx * u * 0.95, ey - dy * u * 0.95, u * 0.12, wood);
  const bx = ex - dx * u * 0.95, by = ey - dy * u * 0.95;
  ctx.save(); ctx.translate((bx + ex) / 2, (by + ey) / 2); ctx.rotate(Math.atan2(dy, dx) - Math.PI / 2 + Math.PI);
  const g = lg(ctx, -u * 0.2, 0, u * 0.2, 0, [[0, dim(blade, 0.25)], [0.5, lit(blade, 0.15)], [1, dim(blade, 0.15)]]);
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, u * 0.21, u * 0.52, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
  return [ex, ey];
}

// Seated paddler. x,gun: hip x and gunwale y in px; fraction of the stroke phi (0..1); returns the blade tip.
export function paddler(ctx, x, gun, u, phi, o) {
  const power = phi < 0.55, k = power ? phi / 0.55 : (phi - 0.55) / 0.45;
  const e = ease(k);
  const th = power ? lerp(0.5, -0.55, e) : lerp(-0.55, 0.5, e);       // blade angle, forward positive
  const lean = power ? lerp(0.5, -0.12, e) : lerp(-0.12, 0.5, e);
  const hy = gun + u * (o.seat ?? 0.2), hx = x;
  const sx = hx + Math.sin(lean) * u * 1.0, sy = hy - Math.cos(lean) * u * 1.0;
  const skin = o.skin, shirt = o.shirt;
  // torso and head first (the hull's near side overlaps the hips afterwards)
  torso(ctx, hx, hy, sx, sy, u * 0.6, shirt);
  head(ctx, sx + Math.sin(lean) * u * 0.42 + u * 0.06, sy - Math.cos(lean) * u * 0.42, u * 0.3, skin, o.hat, o.hatCol ?? shirt);
  return { hx, hy, sx, sy, th, lean, power, k, draw2: () => {
    const qx = sx + u * 0.5, qy = gun - u * 0.18;
    const topx = qx - Math.sin(th) * u * 1.05, topy = qy - Math.cos(th) * u * 1.05;
    // the blade stays in the water on the power stroke and lifts clear on the recovery
    const water = o.water, lift = power ? 0.02 * u : u * (0.45 * Math.sin(Math.PI * k) + 0.2);
    const lb = clamp((water - lift - qy) / Math.max(0.35, Math.cos(th)), u * 1.2, u * 2.7);
    arm(ctx, sx, sy, topx, topy, u * 0.19, o.sleeve ?? shirt, skin, -1, u);
    const tip = paddleDraw(ctx, topx, topy, qx, qy, th, lb, u, o.blade, o.wood);
    arm(ctx, sx + u * 0.05, sy + u * 0.05, qx, qy, u * 0.19, o.sleeve ?? shirt, skin, 1, u);
    return tip;
  } };
}

// Standing figure that poles (mokoro): feet at (x, deckY); the pole is planted behind on the power phase
export function poler(ctx, x, deckY, u, phi, o) {
  const power = phi < 0.6, k = power ? phi / 0.6 : (phi - 0.6) / 0.4, e = ease(k);
  const th = power ? lerp(0.42, -0.5, e) : lerp(-0.5, 0.42, e);       // pole angle, bottom forward positive
  const lean = power ? lerp(0.32, -0.04, e) : lerp(-0.04, 0.32, e);
  const hipx = x, hipy = deckY - u * 1.5;
  const stride = power ? lerp(-0.2, 0.15, e) : 0;
  // legs
  capsule(ctx, hipx - u * 0.1, hipy, x - u * 0.32 + stride * u, deckY, u * 0.3, o.trousers);
  capsule(ctx, hipx + u * 0.1, hipy, x + u * 0.34 + stride * u, deckY, u * 0.3, dim(o.trousers, 0.15));
  const sx = hipx + Math.sin(lean) * u * 1.25, sy = hipy - Math.cos(lean) * u * 1.25;
  torso(ctx, hipx, hipy, sx, sy, u * 0.66, o.shirt);
  head(ctx, sx + Math.sin(lean) * u * 0.4 + u * 0.05, sy - Math.cos(lean) * u * 0.42, u * 0.32, o.skin, o.hat, o.hatCol);
  return { th, power, k, draw2: () => {
    const hx1 = sx + u * 0.5, hy1 = sy + u * 0.45, dx = Math.sin(th), dy = Math.cos(th);
    const topx = hx1 - dx * u * 1.7, topy = hy1 - dy * u * 1.7;
    const water = o.water, lift = power ? 0 : u * 0.7 * Math.sin(Math.PI * k);
    const len = clamp((water - lift - hy1) / Math.max(0.4, dy), u * 1.5, u * 6);
    const ex = hx1 + dx * len, ey = hy1 + dy * len;
    capsule(ctx, topx, topy, ex, ey, u * 0.13, o.wood ?? '#a88458');
    ctx.fillStyle = '#4a3320'; ctx.beginPath(); ctx.arc(ex, ey, u * 0.12, 0, TAU); ctx.fill();
    arm(ctx, sx, sy, topx + dx * u * 0.2, topy + dy * u * 0.2, u * 0.2, o.shirt, o.skin, -1, u);
    arm(ctx, sx + u * 0.05, sy + u * 0.1, hx1, hy1, u * 0.2, o.shirt, o.skin, 1, u);
    return [ex, ey];
  } };
}

// Sitting passenger or steersman: torso and head only
export function sitter(ctx, x, y, u, o, lean = 0.12) {
  const sx = x + Math.sin(lean) * u, sy = y - Math.cos(lean) * u;
  torso(ctx, x, y, sx, sy, u * 0.6, o.shirt);
  head(ctx, sx + u * 0.08, sy - u * 0.42, u * 0.3, o.skin, o.hat, o.hatCol ?? o.shirt);
  return [sx, sy];
}

// ---- hulls --------------------------------------------------------------------------------------------------------------
// top/bottom: polylines in hull units from stern to bow (top) and bow to stern (bottom)
export function hullShape(ctx, S, top, bottom, base, o = {}) {
  const T = sc(S, top), B = sc(S, bottom);
  const ys = [...T, ...B].map((p) => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
  ctx.beginPath(); smooth(ctx, T, true); smooth(ctx, B, false); ctx.closePath();
  ctx.fillStyle = lg(ctx, 0, y0, 0, y1, [[0, lit(base, 0.28)], [0.35, base], [1, dim(base, 0.42)]]); ctx.fill();
  ctx.strokeStyle = 'rgba(15,10,6,0.55)'; ctx.lineWidth = Math.max(1, S * 0.003); ctx.stroke();
  if (o.stripe) {   // a painted band just below the gunwale
    const d = (o.stripeDrop ?? 0.016) * S, w = (o.stripeW ?? 0.014) * S;
    ctx.save(); ctx.clip();
    ctx.strokeStyle = o.stripe; ctx.lineWidth = w; ctx.beginPath(); smooth(ctx, T.map(([x, y]) => [x, y + d]), true); ctx.stroke();
    ctx.restore();
  }
  // gunwale highlight
  ctx.strokeStyle = o.rail ?? lit(base, 0.55); ctx.lineWidth = Math.max(1.6, S * 0.006); ctx.lineCap = 'round'; ctx.beginPath(); smooth(ctx, T, true); ctx.stroke();
  return { T, B };
}
// the hull's near side occludes the crew's hips: redraw a thin lower strip of the top edge over them
export function waterEdge(ctx, S, x0, x1, y, a = 0.7) {
  ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = Math.max(1.4, S * 0.005); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0 * S, y * S); ctx.quadraticCurveTo(0, (y + 0.006) * S, x1 * S, y * S); ctx.stroke();
}

// ---- sails --------------------------------------------------------------------------------------------------------------
// Triangular or claw sail: points in hull units (tack, peak, clew), billow = bulge fraction, flutter = luffing wobble.
export function sailTri(ctx, S, tack, peak, clew, col, o = {}) {
  const t = o.t ?? 0, b = (o.billow ?? 0.05) * S, fl = (o.flutter ?? 0) * S;
  const A = [tack[0] * S, tack[1] * S], P = [peak[0] * S, peak[1] * S], C = [clew[0] * S, clew[1] * S];
  const w = (k) => Math.sin(t * 9 + k * 4) * fl;
  ctx.beginPath(); ctx.moveTo(A[0], A[1]);
  ctx.quadraticCurveTo((A[0] + P[0]) / 2 + b * 0.25 + w(1), (A[1] + P[1]) / 2, P[0], P[1]);
  ctx.quadraticCurveTo((P[0] + C[0]) / 2 - b + w(2), (P[1] + C[1]) / 2 + b * 0.1, C[0], C[1]);
  ctx.quadraticCurveTo((C[0] + A[0]) / 2 + w(3) * 0.3, (C[1] + A[1]) / 2 + b * 0.35, A[0], A[1]);
  ctx.closePath();
  const gx = lg(ctx, C[0], 0, A[0], 0, [[0, dim(col, 0.18)], [0.5, lit(col, 0.12)], [1, col]]);
  ctx.fillStyle = gx; ctx.fill();
  ctx.save(); ctx.clip();
  // seams, a soft shadow fold from the peak and light coming through the cloth
  ctx.strokeStyle = 'rgba(40,24,12,0.22)'; ctx.lineWidth = Math.max(1, S * 0.0025);
  const n = o.seams ?? 6;
  for (let i = 1; i < n; i++) { const k = i / n; ctx.beginPath(); ctx.moveTo(lerp(A[0], C[0], k), lerp(A[1], C[1], k)); ctx.lineTo(lerp(A[0], P[0], k * 0.15) + (P[0] - A[0]) * 0.0, lerp(A[1], P[1], 0.96)); ctx.stroke(); }
  ctx.fillStyle = lg(ctx, C[0], P[1], C[0], A[1], [[0, 'rgba(255,255,255,0.18)'], [0.6, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.14)']]); ctx.fillRect(-S, -S * 1.2, S * 2, S * 1.6);
  if (o.patches) for (let i = 0; i < o.patches.length; i++) {
    const [u, v, w, h, pc] = o.patches[i];
    const px = lerp(C[0], A[0], u) + (P[0] - lerp(C[0], A[0], u)) * (1 - v) * 0.0, py = lerp(A[1], P[1], v);
    ctx.fillStyle = alpha(pc, 0.78); ctx.fillRect(lerp(C[0] * 0.5 + P[0] * 0.5, A[0], u) - w * S / 2 - (1 - v) * (A[0] - C[0]) * 0.35, py, w * S, h * S);
    void px;
  }
  if (o.band) { ctx.fillStyle = o.band; const bh = S * 0.022; ctx.beginPath(); ctx.moveTo(A[0], A[1] - bh); ctx.lineTo(C[0], C[1] - bh); ctx.lineTo(C[0], C[1]); ctx.lineTo(A[0], A[1]); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(30,18,8,0.5)'; ctx.lineWidth = Math.max(1, S * 0.003); ctx.stroke();
  return { A, P, C };
}
export function spar(ctx, x0, y0, x1, y1, w, col = '#5a3a1e') {
  capsule(ctx, x0, y0, x1, y1, w, col);
  capsule(ctx, x0 + w * 0.15, y0 - w * 0.15, x1 + w * 0.15, y1 - w * 0.15, w * 0.35, lit(col, 0.35));
}

// pennant flapping from a point
export function flag(ctx, x, y, len, h, col, t, ph = 0) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - len * 0.5, y + h * 0.1 + Math.sin(t * 8 + ph) * h * 0.35, x - len, y + h * 0.5 + Math.sin(t * 8 + ph + 1) * h * 0.4);
  ctx.quadraticCurveTo(x - len * 0.5, y + h * 0.9 + Math.sin(t * 8 + ph + 2) * h * 0.2, x, y + h); ctx.closePath(); ctx.fill();
}

export { TAU, clamp, lerp, ease, lg, sc };

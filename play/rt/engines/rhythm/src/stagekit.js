// Shared plumbing for the instrument stages (strings, pads, holes, keys, gongs, dance floors).
// A stage draws the REAL instrument as the play surface: each lane owns a spot (a string position, a drum zone, a hole, a bar).
// Stages work in a local frame: u runs along the instrument's long axis (0 = top / head end), v across (0 = centre line).
// Portrait: u points down the screen; landscape: u points right (the instrument lies across the screen).
import { clamp, mix, rgba, lighter, darker, rrect, text, vgrad } from './art.js';

export const HALF_PI = Math.PI / 2;

export function makeFrame(area, o = {}) {
  const top = o.top ?? 38, bottom = o.bottom ?? 8, side = o.side ?? 10;
  const wide = area.w > area.h * 1.15;
  const lying = o.lying && !wide;          // a portrait screen may still show the instrument lying across (1: head left, -1: head right)
  if (lying) {
    const W = area.h - top - bottom, H = area.w - 2 * side, ox = area.x + side, oy = area.y + top;
    if (o.lying > 0) return { landscape: true, W, H, ox, oy: oy + W / 2, map: (v, u) => [ox + u, oy + W / 2 - v], inv: (x, y) => [oy + W / 2 - y, x - ox], area, apply: (ctx) => { ctx.translate(ox, oy + W / 2); ctx.rotate(-HALF_PI); } };
    return { landscape: true, W, H, ox, oy, map: (v, u) => [ox + H - u, oy + W / 2 + v], inv: (x, y) => [y - oy - W / 2, ox + H - x], area, apply: (ctx) => { ctx.translate(ox + H, oy + W / 2); ctx.rotate(HALF_PI); } };
  }
  if (!wide) {
    let W = area.w - 2 * side, H = area.h - top - bottom;
    const cx = area.x + area.w / 2, cy = area.y + top;
    const th = o.tilt || 0;
    if (!th && !o.dx && !o.zoom) return { landscape: false, W, H, ox: cx, oy: cy, map: (v, u) => [cx + v, cy + u], inv: (x, y) => [x - cx, y - cy], apply: (ctx) => ctx.translate(cx, cy), area };
    const c = Math.cos(th), sn = Math.sin(th), ac = Math.abs(c), as = Math.abs(sn);
    const k = Math.min(W / (W * ac + H * as), H / (W * as + H * ac)) * (o.zoom || 1);
    W *= k; H *= k;
    const mx = cx + (o.dx || 0) * area.w, my = cy + (area.h - top - bottom) / 2;      // rotate about the middle of the area
    return { landscape: false, W, H, ox: mx, oy: my, area,
      map: (v, u) => { const p = v, q = u - H / 2; return [mx + p * c - q * sn, my + p * sn + q * c]; },
      inv: (x, y) => { const dx = x - mx, dy = y - my; return [dx * c + dy * sn, -dx * sn + dy * c + H / 2]; },
      apply: (ctx) => { ctx.translate(mx, my); ctx.rotate(th); ctx.translate(0, -H / 2); } };
  }
  const W = area.h - top - bottom, H = area.w - 2 * side, ox = area.x + side, oy = area.y + top + W / 2;
  return { landscape: true, W, H, ox, oy, map: (v, u) => [ox + u, oy - v], inv: (x, y) => [oy - y, x - ox], area, apply: (ctx) => { ctx.translate(ox, oy); ctx.rotate(-HALF_PI); } };
}

// a fixed design box (refW x refH design units) scaled uniformly to fit the area and centred: drums, keys, gongs (no rotation)
export function makeBox(area, refW, refH, o = {}) {
  const top = o.top ?? 38, bottom = o.bottom ?? 8, side = o.side ?? 10, maxS = o.maxScale ?? 2.4;
  const availW = area.w - 2 * side, availH = area.h - top - bottom;
  const wide = area.w > area.h * 1.15;
  const th = wide ? 0 : o.tilt || 0, c = Math.cos(th), sn = Math.sin(th), ac = Math.abs(c), as = Math.abs(sn);
  if (wide) { o = { ...o, dx: 0, dy: 0 }; }
  const s = Math.min(availW / (refW * ac + refH * as), availH / (refW * as + refH * ac), maxS) * (o.zoom || 1);
  let mx = area.x + area.w / 2 + (o.dx || 0) * area.w, my = area.y + top + availH / 2 + (o.dy || 0) * area.h;
  // composition offsets and tilts may nudge the instrument but never push any part of it past the edges of its area
  const hx = (refW * ac + refH * as) * s / 2, hy = (refW * as + refH * ac) * s / 2;
  if (2 * hx <= availW + 0.5) mx = Math.min(Math.max(mx, area.x + side + hx), area.x + area.w - side - hx);
  if (2 * hy <= availH + 0.5) my = Math.min(Math.max(my, area.y + top + hy), area.y + top + availH - hy);
  // design point (v,u) with the box centre at (0, refH/2) maps to the screen centre (mx,my), rotated by th
  const map = (v, u) => { const p = v * s, q = (u - refH / 2) * s; return [mx + p * c - q * sn, my + p * sn + q * c]; };
  const inv = (x, y) => { const dx = x - mx, dy = y - my; return [(dx * c + dy * sn) / s, (-dx * sn + dy * c) / s + refH / 2]; };
  return { box: true, scale: s, W: refW, H: refH, ox: mx, oy: my, area, map, inv, apply: (ctx) => { ctx.translate(mx, my); ctx.rotate(th); ctx.scale(s, s); ctx.translate(0, -refH / 2); } };
}

// a lane's spot: local position (v,u), screen anchor (x,y) filled by finish(), and a normalised distance test (<= 1 inside)
export function circleSpot(v, u, r, extra = {}) {
  return { v, u, r, dist: (lv, lu) => Math.hypot(lv - v, lu - u) / r, ...extra };
}
export function rectSpot(v, u, hw, hh, extra = {}) {
  return { v, u, r: Math.min(hw, hh), hw, hh, dist: (lv, lu) => Math.max(Math.abs(lv - v) / hw, Math.abs(lu - u) / hh), ...extra };
}
export function ellipseSpot(v, u, rv, ru, extra = {}) {
  return { v, u, r: Math.min(rv, ru), dist: (lv, lu) => Math.hypot((lv - v) / rv, (lu - u) / ru), ...extra };
}
// annulus around (cv,cu): between r0 and r1 (an angular window a0..a1 in radians may narrow it); anchor at the middle
export function ringSpot(cv, cu, r0, r1, extra = {}) {
  const rm = (r0 + r1) / 2, ry = extra.squash ?? 1;
  return { v: cv, u: cu + rm * ry * (extra.dir ?? -1), r: (r1 - r0) / 2, dist: (lv, lu) => { const d = Math.hypot(lv - cv, (lu - cu) / ry); return d < r0 ? 1 + (r0 - d) / (r1 - r0) * 2 : d > r1 ? 1 + (d - r1) / (r1 - r0) * 2 : Math.abs(d - rm) / ((r1 - r0) / 2) * 0.9; }, ...extra };
}

export function finishSpots(F, spots) {
  for (const s of spots) if (s) { const [x, y] = F.map(s.v, s.u); s.x = x; s.y = y; }
}

// pick the lane whose spot contains the point (smallest normalised distance); a little slop outside is forgiven
export function hitSpots(F, spots, x, y) {
  const [lv, lu] = F.inv(x, y);
  let best = -1, bd = 1.0;
  for (let i = 0; i < spots.length; i++) { const s = spots[i]; if (!s) continue; const d = s.dist(lv, lu); if (d <= bd) { bd = d; best = i; } }
  if (best >= 0) return best;
  bd = 1.7;
  for (let i = 0; i < spots.length; i++) { const s = spots[i]; if (!s) continue; const d = s.dist(lv, lu); if (d <= bd) { bd = d; best = i; } }
  return best;
}

export function fitSize(ctx, s, maxW, size, weight = '800', minSize = 9) {
  ctx.font = `${weight} ${Math.round(size)}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  const w = ctx.measureText(String(s)).width;
  return w > maxW ? Math.max(minSize, size * maxW / w) : size;
}

// a name pill (screen space): rounded, dark, lane-coloured rim that lights when struck
let heroMode = false;
export const setHero = (v) => { heroMode = !!v; };
export function pill(ctx, s, cx, cy, maxW, size, col, f = 0, o = {}) {
  if (heroMode) return { w: 0, h: 0 };
  const fs = fitSize(ctx, s, maxW - 10, size, '800', size * 0.96);   // never below ~11 css px (size is >= 12 css px)
  ctx.font = `800 ${Math.round(fs)}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  const tw = ctx.measureText(String(s)).width, w = Math.max(o.minW ?? 0, tw + 14), h = fs + 9;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; rrect(ctx, cx - w / 2 + 1, cy - h / 2 + 3, w, h, h / 2); ctx.fill();
  ctx.fillStyle = vgrad(ctx, cy - h / 2, cy + h / 2, [[0, f > 0.02 ? lighter(col, 0.35 + 0.3 * f) : o.top ?? 'rgba(34,24,16,0.92)'], [1, f > 0.02 ? darker(col, 0.15) : o.bot ?? 'rgba(10,6,3,0.92)']]);
  rrect(ctx, cx - w / 2, cy - h / 2, w, h, h / 2); ctx.fill();
  ctx.strokeStyle = rgba(f > 0.02 ? lighter(col, 0.6) : col, 0.95); ctx.lineWidth = 2 + f; ctx.stroke();
  ctx.restore();
  text(ctx, s, cx, cy + 1, fs, f > 0.4 ? '#14100a' : '#fff6e0', { weight: '800' });
  return { w, h };
}

// a drawn string: n-segment polyline with a standing-wave displacement across v (amp in units), ends fixed
export function stringLine(ctx, v0, u0, v1, u1, amp, phase, width, col, hi = null, harm = 0.35) {
  const du = u1 - u0, dv = v1 - v0, len = Math.hypot(dv, du) || 1, nv = -du / len, nu = dv / len;
  const segs = amp > 0.25 ? 22 : 1;
  ctx.beginPath();
  for (let k = 0; k <= segs; k++) {
    const s = k / segs, d = amp * (Math.sin(Math.PI * s) * Math.cos(phase) + harm * Math.sin(2 * Math.PI * s) * Math.cos(phase * 2.1 + 1));
    const x = v0 + dv * s + nv * d, y = u0 + du * s + nu * d;
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.42)'; ctx.lineWidth = width + 1.6; ctx.save(); ctx.translate(1.6, 1.4); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = col; ctx.lineWidth = width; ctx.stroke();
  if (hi) { ctx.strokeStyle = hi; ctx.lineWidth = Math.max(0.7, width * 0.38); ctx.save(); ctx.translate(-width * 0.2, 0); ctx.stroke(); ctx.restore(); }
}

export const easeIn = (t) => t * t;
export const lerp = (a, b, t) => a + (b - a) * t;
export { clamp, mix };

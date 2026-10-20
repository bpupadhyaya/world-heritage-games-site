// Hero figures (1.24.0): the primitives of the dance stage v2. A standing, costumed figure seen from the front, authored around x = 0 in a box about
// 0..800 high (head centre y ~ 92, shoulders y ~ 205, hips y ~ 430, ground y ~ 760), posed by joint targets and solved with two-bone IK so that arms and legs
// always have honest lengths. Pure drawing in the caller's design space; every animation is a function of the arguments (no clock reads, no state).
// Used by stage-dance-hero.js (hopak, gumboot, highland sword, tinikling, kathak); the older stages in figures-front.js are untouched.
import { clamp, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, circ, ell, TAU } from './art.js';
import { face } from './figures-front.js';
import { hand } from './dancers.js';

export const lerp = (a, b, t) => a + (b - a) * t;
export const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export const ease = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

// two-bone IK: root (ax,ay) to target (tx,ty) with segment lengths l1, l2; the middle joint is the solution nearest the preference point pref
export function ik2(ax, ay, tx, ty, l1, l2, pref) {
  let dx = tx - ax, dy = ty - ay, d = Math.hypot(dx, dy);
  const max = l1 + l2 - 0.5, min = Math.abs(l1 - l2) + 1;
  if (d > max) { dx *= max / d; dy *= max / d; d = max; tx = ax + dx; ty = ay + dy; }
  if (d < min) d = min;
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const ux = dx / (d || 1), uy = dy / (d || 1), mx = ax + ux * a, my = ay + uy * a;
  const s1 = [mx - uy * h, my + ux * h], s2 = [mx + uy * h, my - ux * h];
  const k = pref ? (Math.hypot(s1[0] - pref[0], s1[1] - pref[1]) <= Math.hypot(s2[0] - pref[0], s2[1] - pref[1]) ? s1 : s2) : s1;
  return { mid: k, end: [tx, ty] };
}

// a lit, tapered cloth (or skin) segment between two points with round ends: shadow, dark rim, body with a cross-shading that puts the light on the upper left,
// a soft highlight, optional fold strokes
export function taper(ctx, x0, y0, x1, y1, w0, w1, col, o = {}) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const lit = (nx * -0.6 + ny * -0.8) >= 0 ? 1 : -1;    // the side of the segment that faces the key light
  const poly = (k, ox = 0, oy = 0) => {
    ctx.beginPath();
    ctx.moveTo(x0 + nx * w0 * k / 2 + ox, y0 + ny * w0 * k / 2 + oy); ctx.lineTo(x1 + nx * w1 * k / 2 + ox, y1 + ny * w1 * k / 2 + oy);
    ctx.lineTo(x1 - nx * w1 * k / 2 + ox, y1 - ny * w1 * k / 2 + oy); ctx.lineTo(x0 - nx * w0 * k / 2 + ox, y0 - ny * w0 * k / 2 + oy); ctx.closePath();
    ctx.moveTo(x0 + ox + w0 * k / 2, y0 + oy); ctx.arc(x0 + ox, y0 + oy, w0 * k / 2, 0, TAU);
    ctx.moveTo(x1 + ox + w1 * k / 2, y1 + oy); ctx.arc(x1 + ox, y1 + oy, w1 * k / 2, 0, TAU);
  };
  ctx.save();
  if (o.shadow !== false) { poly(1, w0 * 0.14, w0 * 0.18); ctx.fillStyle = 'rgba(0,0,0,0.26)'; ctx.fill(); }
  poly(1); ctx.fillStyle = darker(col, o.rim ?? 0.3); ctx.fill();
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, wm = (w0 + w1) / 2;
  const g = ctx.createLinearGradient(mx + nx * wm * 0.5 * lit, my + ny * wm * 0.5 * lit, mx - nx * wm * 0.5 * lit, my - ny * wm * 0.5 * lit);
  g.addColorStop(0, lighter(col, 0.3)); g.addColorStop(0.28, lighter(col, 0.1)); g.addColorStop(0.62, col); g.addColorStop(1, darker(col, 0.32));
  poly(0.9); ctx.fillStyle = g; ctx.fill();
  if (o.fold) { ctx.save(); poly(0.9); ctx.clip(); ctx.strokeStyle = rgba(darker(col, 0.5), 0.3); ctx.lineWidth = Math.max(1.5, wm * 0.03); for (let k = 1; k <= o.fold; k++) { const t = k / (o.fold + 1), ox = (t - 0.5) * wm * 0.8; ctx.beginPath(); ctx.moveTo(x0 + nx * ox, y0 + ny * ox); ctx.quadraticCurveTo((x0 + x1) / 2 + nx * ox * 1.2 + ny * wm * 0.05, (y0 + y1) / 2 + ny * ox * 1.2 - nx * wm * 0.05, x1 + nx * ox * 0.7, y1 + ny * ox * 0.7); ctx.stroke(); } ctx.restore(); }
  if (o.hl !== false) { ctx.strokeStyle = rgba(lighter(col, 0.6), 0.28); ctx.lineWidth = Math.max(2, wm * 0.1); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0 + nx * w0 * 0.26 * lit, y0 + ny * w0 * 0.26 * lit); ctx.lineTo(x1 + nx * w1 * 0.26 * lit, y1 + ny * w1 * 0.26 * lit); ctx.stroke(); }
  ctx.restore();
}


// a smooth cloth tube through three or more points with a width at each (trousers, sleeves): the outline is a quadratic spline of the offset points, so a knee or an
// elbow bends without a seam. o: { shadow, rim, fold (number of soft fold lines), hl }
export function ribbon(ctx, pts, ws, col, o = {}) {
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    L.push([pts[i][0] - dy * ws[i] / 2, pts[i][1] + dx * ws[i] / 2]); R.push([pts[i][0] + dy * ws[i] / 2, pts[i][1] - dx * ws[i] / 2]);
  }
  const path = (ox = 0, oy = 0, k = 1) => {
    const l = L.map((p, i) => [pts[i][0] + (p[0] - pts[i][0]) * k + ox, pts[i][1] + (p[1] - pts[i][1]) * k + oy]), r = R.map((p, i) => [pts[i][0] + (p[0] - pts[i][0]) * k + ox, pts[i][1] + (p[1] - pts[i][1]) * k + oy]);
    ctx.beginPath(); ctx.moveTo(l[0][0], l[0][1]);
    for (let i = 1; i < n; i++) { const m = [(l[i - 1][0] + l[i][0]) / 2, (l[i - 1][1] + l[i][1]) / 2]; ctx.quadraticCurveTo(l[i - 1][0], l[i - 1][1], m[0], m[1]); }
    ctx.lineTo(l[n - 1][0], l[n - 1][1]);
    { const a1 = Math.atan2(l[n - 1][1] - pts[n - 1][1], l[n - 1][0] - pts[n - 1][0]), a2 = Math.atan2(r[n - 1][1] - pts[n - 1][1], r[n - 1][0] - pts[n - 1][0]), da = Math.atan2(pts[n - 1][1] - pts[n - 2][1], pts[n - 1][0] - pts[n - 2][0]); ctx.arc(pts[n - 1][0] + ox, pts[n - 1][1] + oy, ws[n - 1] * k / 2, a1, a2, Math.cos(a1 + Math.PI / 2 - da) < 0); }
    for (let i = n - 2; i >= 0; i--) { const m = [(r[i + 1][0] + r[i][0]) / 2, (r[i + 1][1] + r[i][1]) / 2]; ctx.quadraticCurveTo(r[i + 1][0], r[i + 1][1], m[0], m[1]); }
    ctx.lineTo(r[0][0], r[0][1]); ctx.closePath();
  };
  const wmax = Math.max(...ws), dx = pts[n - 1][0] - pts[0][0], dy = pts[n - 1][1] - pts[0][1], dl = Math.hypot(dx, dy) || 1, nx = -dy / dl, ny = dx / dl, lit = (nx * -0.6 + ny * -0.8) >= 0 ? 1 : -1;
  const mx = (pts[0][0] + pts[n - 1][0]) / 2, my = (pts[0][1] + pts[n - 1][1]) / 2;
  ctx.save();
  if (o.shadow !== false) { path(ws[0] * 0.1, ws[0] * 0.14); ctx.fillStyle = 'rgba(0,0,0,0.26)'; ctx.fill(); }
  path(); ctx.fillStyle = darker(col, o.rim ?? 0.3); ctx.fill();
  const g = ctx.createLinearGradient(mx + nx * wmax * 0.5 * lit, my + ny * wmax * 0.5 * lit, mx - nx * wmax * 0.5 * lit, my - ny * wmax * 0.5 * lit);
  g.addColorStop(0, lighter(col, 0.3)); g.addColorStop(0.3, lighter(col, 0.1)); g.addColorStop(0.65, col); g.addColorStop(1, darker(col, 0.34));
  path(0, 0, 0.93); ctx.fillStyle = g; ctx.fill();
  if (o.fold) { ctx.save(); path(0, 0, 0.93); ctx.clip(); ctx.strokeStyle = rgba(darker(col, 0.5), 0.22); ctx.lineWidth = Math.max(2, wmax * 0.035); ctx.lineCap = 'round';
    for (let k = 1; k <= o.fold; k++) { const f = (k / (o.fold + 1) - 0.5) * 1.6; ctx.beginPath(); for (let i = 0; i < n; i++) { const x = pts[i][0] + (L[i][0] - pts[i][0]) * f, y = pts[i][1] + (L[i][1] - pts[i][1]) * f; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); } ctx.restore(); }
  ctx.restore();
}

// a head seen from the front, centred at (x, y), half sizes rx, ry: ear, shaded skull, face (shared calm face), optional hair callbacks drawn behind / in front.
// o: { skin, turn, tilt, hairBack(ctx), hairFront(ctx), ears (true), jaw (0..1, 0 = round, 1 = squarer) , stubble }
export function headFront(ctx, x, y, rx, ry, o = {}) {
  const skin = o.skin ?? '#c98e63';
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.tilt ?? 0);
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ell(ctx, rx * 0.12, ry * 0.18, rx * 1.05, ry * 1.04); ctx.fill();
  if (o.hairBack) o.hairBack(ctx);
  if (o.ears !== false) for (const d of [-1, 1]) { ctx.fillStyle = rgrad(ctx, d * rx * 0.95, ry * 0.1, 1, rx * 0.3, [[0, lighter(skin, 0.1)], [1, darker(skin, 0.3)]]); ell(ctx, d * rx * 0.96, ry * 0.1, rx * 0.15, ry * 0.2); ctx.fill(); }
  const j = o.jaw ?? 0.3;
  ctx.beginPath(); ctx.moveTo(-rx, -ry * 0.1); ctx.bezierCurveTo(-rx, -ry * 0.95, rx, -ry * 0.95, rx, -ry * 0.1); ctx.bezierCurveTo(rx, ry * (0.5 + 0.2 * j), rx * (0.62 + 0.2 * j), ry, 0, ry); ctx.bezierCurveTo(-rx * (0.62 + 0.2 * j), ry, -rx, ry * (0.5 + 0.2 * j), -rx, -ry * 0.1); ctx.closePath();
  ctx.fillStyle = rgrad(ctx, -rx * 0.3, -ry * 0.35, 4, rx * 1.7, [[0, lighter(skin, 0.18)], [0.62, skin], [1, darker(skin, 0.38)]]); ctx.fill();
  ctx.strokeStyle = rgba(darker(skin, 0.6), 0.4); ctx.lineWidth = 1.6; ctx.stroke();
  face(ctx, rx, ry, { skin, turn: o.turn ?? 0.2, smile: o.smile });
  if (o.hairFront) o.hairFront(ctx);
  ctx.restore();
}

// a boot or shoe seen from the front: shaft from (kx,ky) down to the ankle (ax,ay), a foot ellipse with a toe cap and a sole; o: { col, hi, sole, turn (-1..1 toe direction), cuff, bare (skin) }
export function footFront(ctx, ax, ay, o = {}) {
  const col = o.col ?? '#16100c', sole = o.sole ?? '#0a0604', turn = o.turn ?? 0, s = o.s ?? 1, lift = o.lift ?? 0;
  ctx.save(); ctx.translate(ax, ay); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 6 + turn * 8, 30 + lift * 14, 38 - lift * 10, 10 - lift * 3); ctx.fill();
  const fx = turn * 12;
  ctx.fillStyle = sole; ell(ctx, fx, 30, 34, 13); ctx.fill();
  ctx.fillStyle = rgrad(ctx, fx - 12, 12, 2, 46, [[0, lighter(col, 0.4)], [0.5, col], [1, darker(col, 0.4)]]); ell(ctx, fx, 20, 32, 17); ctx.fill();
  ctx.strokeStyle = rgba(darker(col, 0.5), 0.8); ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.26)'; ell(ctx, fx - 10, 14, 11, 5); ctx.fill();
  ctx.restore();
}

// a hand drawn from the front with its palm toward the camera (a fist/open mitt that reads at small size): palm, four fingers, thumb, cuff colour optional
export function handFront(ctx, x, y, ang, s, o = {}) {
  hand(ctx, x, y, ang, s, { skin: o.skin ?? '#c98e63', open: o.open ?? 0.25, curl: o.curl ?? 0.2, side: o.side ?? 1 });
}

// a ground contact shadow and a soft light pool under a figure
export function groundPool(ctx, x, y, rx, ry, a = 0.4) { ctx.fillStyle = `rgba(0,0,0,${a})`; ell(ctx, x, y, rx, ry); ctx.fill(); ctx.fillStyle = rgrad(ctx, x, y, 2, rx, [[0, `rgba(0,0,0,${a})`], [1, 'rgba(0,0,0,0)']]); ell(ctx, x, y, rx * 1.15, ry * 1.2); ctx.fill(); }

// cross-stitch embroidery along a straight band (x0,y0)-(x1,y1): diamonds and dots in two colours
export function stitchBand(ctx, x0, y0, x1, y1, w, c1, c2, base = null) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux, n = Math.max(2, Math.floor(L / (w * 1.15)));
  ctx.save();
  if (base) { ctx.strokeStyle = base; ctx.lineWidth = w; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n, cx = x0 + dx * t, cy = y0 + dy * t, r = w * 0.34;
    ctx.fillStyle = k % 2 ? c2 : c1; ctx.beginPath(); ctx.moveTo(cx + nx * r, cy + ny * r); ctx.lineTo(cx + ux * r, cy + uy * r); ctx.lineTo(cx - nx * r, cy - ny * r); ctx.lineTo(cx - ux * r, cy - uy * r); ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = c1; ctx.lineWidth = Math.max(1.2, w * 0.07);
  for (const o of [-w * 0.46, w * 0.46]) { ctx.beginPath(); ctx.moveTo(x0 + nx * o, y0 + ny * o); ctx.lineTo(x1 + nx * o, y1 + ny * o); ctx.stroke(); }
  ctx.restore();
}

// brass ankle or boot bells on a strap around a leg segment end (x,y), width w
export function jingleRing(ctx, x, y, w, shake, t) {
  ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(x, y, w / 2, 7, 0, 0, TAU); ctx.stroke();
  for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI + 0.15, bx = x + Math.cos(a) * w / 2 * -1 + Math.sin(t * 70 + k * 2) * shake * 2.6, by = y + 8 + Math.sin(a) * 8 + Math.cos(t * 60 + k) * shake * 2.6;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, bx + 1.2, by + 2, 5.2); ctx.fill(); ctx.fillStyle = rgrad(ctx, bx - 1.5, by - 1.5, 0, 6.5, [[0, '#fff3b0'], [0.55, '#d4a43a'], [1, '#6a4a14']]); circ(ctx, bx, by, 5.2); ctx.fill(); }
}

// a smooth arm (1.25.0): shoulder -> elbow -> wrist as one tapered cloth or skin tube, widths ws = [shoulder, elbow, wrist], a soft elbow disc so the bend has no
// pinch, an optional cuff band at the wrist and a shoulder cap. o: { rim, fold, shadow, cuff: colour, cap: colour, shine }
export function limb(ctx, sh, el, wr, ws, col, o = {}) {
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const w = [ws[0], (ws[0] + ws[1]) / 2, ws[1], (ws[1] + ws[2]) / 2, ws[2]];
  if (o.cap) { ctx.fillStyle = rgrad(ctx, sh[0] - ws[0] * 0.2, sh[1] - ws[0] * 0.25, 1, ws[0] * 0.8, [[0, lighter(o.cap, 0.1)], [1, darker(o.cap, 0.12)]]); circ(ctx, sh[0], sh[1], ws[0] * 0.44); ctx.fill(); }
  ribbon(ctx, [sh, mid(sh, el), el, mid(el, wr), wr], w, col, { rim: o.rim ?? 0.3, fold: o.fold, shadow: o.shadow });
  if (o.joint !== false) { ctx.fillStyle = rgrad(ctx, el[0] - ws[1] * 0.18, el[1] - ws[1] * 0.2, 1, ws[1] * 0.62, [[0, lighter(col, 0.05)], [1, darker(col, 0.08)]]); circ(ctx, el[0], el[1], ws[1] * 0.36); ctx.fill(); }
  if (o.cuff) {
    const a = Math.atan2(wr[1] - el[1], wr[0] - el[0]), cw = ws[2] * 1.18, cl = ws[2] * 0.62;
    ctx.save(); ctx.translate(wr[0], wr[1]); ctx.rotate(a); ctx.fillStyle = darker(o.cuff, 0.32); rrect(ctx, -cl * 0.9, -cw / 2 + 2, cl, cw, cw * 0.18); ctx.fill();
    ctx.fillStyle = hgrad(ctx, -cl, 0, [[0, lighter(o.cuff, 0.15)], [1, o.cuff]]); rrect(ctx, -cl * 0.95, -cw / 2, cl, cw - 3, cw * 0.18); ctx.fill(); ctx.restore();
  }
}
// elbow position for a hand target: IK with the elbow pulled toward a preference point (down and out by default)
export function armIK(sh, hd, ua, fa, sx, drop = 80) { return ik2(sh[0], sh[1], hd[0], hd[1], ua, fa, [sh[0] + sx * 150, Math.max(sh[1] + drop, (sh[1] + hd[1]) / 2 + 50)]); }

void hgrad; void vgrad; void rrect;

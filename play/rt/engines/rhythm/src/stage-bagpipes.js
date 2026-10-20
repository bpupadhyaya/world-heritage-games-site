// Parametric bagpipes (1.19.0): zampogna, uilleann pipes, Galician gaita, Bulgarian gaida, tulum and musette. One builder (layout `holes`, a hook tried before the
// Highland pipe of bagpipe.js) draws a bag (cloth-covered sack, whole animal skin or an embroidered pouch), a stock, bellows or a blowpipe, a chanter
// with its finger holes and the drone pipes, each instrument with its own bag, pipe count, horn bells, mounts and colours. No piper, no hands: the covered
// holes glow and the bag gives on every note. Lanes carry a `holes` string (front holes from the top; 1 = covered); the drone is the usual `drone: "reed"`.
import { registerHook } from './registry.js';
import { clamp, mix, rgba, lighter, darker, glow, rrect, grain, hgrad, vgrad, rgrad, hash, ell, circ, TAU } from './art.js';
import { makeFrame, circleSpot, finishSpots, hitSpots, pill, lerp, isHero } from './stagekit.js';
import { setting, instrumentBox } from './set.js';

export const MATCH = /zampogna|zampogne|uilleann|union pipes|gaita galega|galician|gaida|kaba gaida|tulum|musette|cornemuse du centre/;
const STYLE_RE = { zampogna: /zampogn/, uilleann: /uilleann|union pipes/, gaita: /gaita|galician/, gaida: /gaida/, tulum: /tulum/, musette: /musette|cornemuse/ };
const styleOf = (key) => { const k = String(key || '').toLowerCase(); for (const [n, re] of Object.entries(STYLE_RE)) if (re.test(k)) return n; return 'gaita'; };

// ---- small painting helpers (local coordinates) ----------------------------------------------------------------------------------
// a tapered tube from a to b with half-widths w0, w1: lathe-turned shading across it, drop shadow
function rod(ctx, ax, ay, bx, by, w0, w1, base, o = {}) {
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  const mx = (ax + bx) / 2, my = (ay + by) / 2, wm = (w0 + w1) / 2;
  const gr = ctx.createLinearGradient(mx - nx * wm, my - ny * wm, mx + nx * wm, my + ny * wm);
  for (const [s, c] of o.stops ?? [[0, darker(base, 0.3)], [0.2, lighter(base, 0.55)], [0.42, base], [0.75, darker(base, 0.38)], [1, darker(base, 0.2)]]) gr.addColorStop(s, c);
  ctx.beginPath(); ctx.moveTo(ax + nx * w0, ay + ny * w0); ctx.lineTo(bx + nx * w1, by + ny * w1); ctx.lineTo(bx - nx * w1, by - ny * w1); ctx.lineTo(ax - nx * w0, ay - ny * w0); ctx.closePath();
  if (o.shadow !== false) { ctx.save(); ctx.translate(6, 8); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill(); ctx.restore(); }
  ctx.fillStyle = gr; ctx.fill();
  if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
}
// a turned ring (ferrule, mount, cap) at t along a->b
function ring(ctx, ax, ay, bx, by, t, wHalf, thick, col, o = {}) {
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, cx = ax + dx * t, cy = ay + dy * t;
  rod(ctx, cx - ux * thick / 2, cy - uy * thick / 2, cx + ux * thick / 2, cy + uy * thick / 2, wHalf, wHalf * (o.taper ?? 1), col, { shadow: false, stops: [[0, darker(col, 0.4)], [0.22, lighter(col, 0.7)], [0.5, col], [0.8, darker(col, 0.4)], [1, darker(col, 0.65)]] });
}
// a horn bell: a curved cone from (x,y) heading `ang`, flaring from w0 to w1 over len, bending sideways by `bend`
function horn(ctx, x, y, ang, len, w0, w1, bend, col, o = {}) {
  const pts = []; const n = 24;
  for (let k = 0; k <= n; k++) { const t = k / n, a = ang + bend * t * t, px = k ? pts[k - 1].x + Math.cos(a) * len / n : x, py = k ? pts[k - 1].y + Math.sin(a) * len / n : y; pts.push({ x: px, y: py, a, w: lerp(w0, w1, Math.pow(t, 1.9)) }); }
  const path = (c) => { c.beginPath(); for (const p of pts) c.lineTo(p.x - Math.sin(p.a) * p.w, p.y + Math.cos(p.a) * p.w); for (let k = n; k >= 0; k--) { const p = pts[k]; c.lineTo(p.x + Math.sin(p.a) * p.w, p.y - Math.cos(p.a) * p.w); } c.closePath(); };
  ctx.save(); ctx.translate(6, 8); path(ctx); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill(); ctx.restore();
  const e = pts[n], mid = pts[(n / 2) | 0];
  const g = ctx.createLinearGradient(mid.x - Math.sin(mid.a) * w1, mid.y + Math.cos(mid.a) * w1, mid.x + Math.sin(mid.a) * w1, mid.y - Math.cos(mid.a) * w1);
  for (const [s, c] of [[0, darker(col, 0.45)], [0.2, lighter(col, 0.45)], [0.45, col], [0.8, darker(col, 0.4)], [1, darker(col, 0.65)]]) g.addColorStop(s, c);
  path(ctx); ctx.fillStyle = g; ctx.fill();
  ctx.save(); path(ctx); ctx.clip();
  if (o.rings) for (let k = 1; k < 9; k++) { const p = pts[Math.round(k / 9 * n)]; ctx.strokeStyle = 'rgba(40,20,4,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x - Math.sin(p.a) * p.w, p.y + Math.cos(p.a) * p.w); ctx.lineTo(p.x + Math.sin(p.a) * p.w, p.y - Math.cos(p.a) * p.w); ctx.stroke(); }
  if (o.tip) { const p = pts[Math.round(n * 0.2)]; ctx.fillStyle = rgba(o.tip, 0.65); ctx.fillRect(-9999, -9999, 0, 0); void p; }
  ctx.restore();
  ctx.strokeStyle = rgba(darker(col, 0.8), 0.85); ctx.lineWidth = 2.4; path(ctx); ctx.stroke();
  ctx.fillStyle = '#0a0503'; ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.a); ctx.beginPath(); ctx.ellipse(0, 0, Math.max(3, e.w * 0.28), e.w, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = rgba(lighter(col, 0.6), 0.7); ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
}
function tassel(ctx, x, y, len, col, sway) {
  ctx.strokeStyle = darker(col, 0.3); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sway * 0.4, y + len * 0.3); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x + sway * 0.4 - 6, y + len * 0.3); ctx.lineTo(x + sway * 0.4 + 6, y + len * 0.3); for (let k = 0; k <= 6; k++) ctx.lineTo(x + sway + 8 - k * 2.7, y + len + (k % 2) * 4); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = darker(col, 0.45); ctx.lineWidth = 1; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x + sway * 0.4 - 4 + k * 2, y + len * 0.35); ctx.lineTo(x + sway + 6 - k * 3, y + len); ctx.stroke(); }
}

// ---- the bag ----------------------------------------------------------------------------------------------------------------------
// cloth-covered sack (rounded), embroidered or plain, with a braided cord round the edge
function clothBag(ctx, cx, cy, rx, ry, o) {
  const sq = o.sq ?? 0, w = rx * (1 + 0.035 * sq), h = ry * (1 - 0.1 * sq);
  const path = (c) => { c.beginPath(); for (let k = 0; k <= 60; k++) { const t = (k / 60) * TAU; c.lineTo(cx + Math.cos(t) * w * (1 + 0.05 * Math.sin(t * 3 + 1)), cy + Math.sin(t) * h * (1 + 0.04 * Math.sin(t * 2))); } c.closePath(); };
  ctx.save(); ctx.translate(12, 16); path(ctx); ctx.fillStyle = 'rgba(0,0,0,0.36)'; ctx.fill(); ctx.restore();
  path(ctx); ctx.fillStyle = rgrad(ctx, cx, cy, h * 0.1, w * 1.05, [[0, lighter(o.col, 0.4)], [0.5, o.col], [1, darker(o.col, 0.62)]], cx - w * 0.3, cy - h * 0.4); ctx.fill();
  ctx.save(); path(ctx); ctx.clip();
  if (o.nap) for (let k = 0; k < 260; k++) { const a = hash(k) * TAU, d = Math.sqrt(hash(k + 90)); ctx.strokeStyle = `rgba(255,255,255,${0.04 + 0.08 * hash(k + 4)})`; ctx.lineWidth = 1; ctx.beginPath(); const x = cx + Math.cos(a) * d * w, y = cy + Math.sin(a) * d * h; ctx.moveTo(x, y); ctx.lineTo(x + 4, y + 2); ctx.stroke(); }
  if (o.emb) { // gold embroidery: a scatter of small flowers and leaf sprays
    for (let k = 0; k < 22; k++) { const a = hash(k * 2.3) * TAU, d = 0.25 + 0.65 * Math.sqrt(hash(k + 5)), x = cx + Math.cos(a) * d * w, y = cy + Math.sin(a) * d * h; ctx.fillStyle = rgba(o.emb, 0.85); ctx.beginPath(); for (let q = 0; q < 10; q++) { const aa = (q / 10) * TAU, r = q % 2 ? 4 : 9; ctx.lineTo(x + Math.cos(aa) * r, y + Math.sin(aa) * r); } ctx.closePath(); ctx.fill(); ctx.fillStyle = darker(o.emb, 0.4); circ(ctx, x, y, 2.2); ctx.fill(); }
  }
  if (o.stripe) for (let k = -4; k <= 4; k++) { ctx.fillStyle = rgba(o.stripe, 0.5); ctx.fillRect(cx + k * w * 0.22 - 6, cy - h * 1.2, 12, h * 2.4); }
  ctx.fillStyle = rgrad(ctx, cx - w * 0.3, cy - h * 0.45, 0, w * 0.9, [[0, 'rgba(255,248,224,0.32)'], [1, 'rgba(255,248,224,0)']]); ctx.fillRect(cx - w, cy - h, 2 * w, 2 * h);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 3; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(cx - w * 0.9 + k * w * 0.45, cy - h * 0.9); ctx.quadraticCurveTo(cx - w * 0.6 + k * w * 0.4, cy, cx - w * 0.9 + k * w * 0.42, cy + h * 0.9); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = rgba(darker(o.col, 0.8), 0.8); ctx.lineWidth = 3; path(ctx); ctx.stroke();
  if (o.straps) { ctx.save(); path(ctx); ctx.clip(); for (const f of [-0.45, 0.4]) { ctx.fillStyle = 'rgba(70,40,16,0.9)'; ctx.fillRect(cx + w * f - 9, cy - h * 0.98, 18, h * 1.96); ctx.fillStyle = '#d4b25a'; rrect(ctx, cx + w * f - 13, cy - 8, 26, 22, 4); ctx.fill(); ctx.fillStyle = '#6a4a14'; ctx.fillRect(cx + w * f - 6, cy - 1, 12, 8); } ctx.restore(); }
  if (o.cord) { ctx.strokeStyle = o.cord; ctx.lineWidth = 7; ctx.setLineDash([9, 5]); ctx.lineCap = 'round'; path(ctx); ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = rgba(lighter(o.cord, 0.5), 0.6); ctx.lineWidth = 2; path(ctx); ctx.stroke(); }
}
// a whole animal skin: an irregular torso with four tapered leg stubs tied off with cord, stitched seam, fur or wool; stubs at [dx, dy, angle] of the torso
function skinBag(ctx, cx, cy, rx, ry, o) {
  const sq = o.sq ?? 0, w = rx * (1 + 0.035 * sq), h = ry * (1 - 0.1 * sq);
  const stubs = o.stubs ?? [[-0.74, -0.6, -2.3], [0.74, -0.6, -0.8], [-0.7, 0.68, 2.4], [0.7, 0.68, 0.7]];
  const rad = (t) => 1 + 0.06 * Math.sin(t * 2 + 0.5) + 0.05 * Math.cos(t * 3 + 1) + 0.035 * Math.sin(t * 5);
  const body = (c) => { c.beginPath(); for (let k = 0; k <= 80; k++) { const t = (k / 80) * TAU; c.lineTo(cx + Math.cos(t) * w * rad(t), cy + Math.sin(t) * h * rad(t)); } c.closePath(); };
  ctx.save(); ctx.translate(12, 16); body(ctx); ctx.fillStyle = 'rgba(0,0,0,0.36)'; ctx.fill(); ctx.restore();
  for (const [sx, sy, ang] of stubs) {
    const x = cx + sx * w, y = cy + sy * h, l = o.stubLen ?? rx * 0.34, wd = o.stubW ?? rx * 0.16;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(0, -wd * 1.2); ctx.lineTo(l, -wd * 0.7); ctx.quadraticCurveTo(l + wd * 0.5, 0, l, wd * 0.7); ctx.lineTo(0, wd * 1.2); ctx.closePath();
    ctx.fillStyle = vgrad(ctx, -wd * 1.2, wd * 1.2, [[0, lighter(o.col, 0.25)], [0.5, o.col], [1, darker(o.col, 0.55)]]); ctx.fill(); ctx.strokeStyle = rgba(darker(o.col, 0.8), 0.85); ctx.lineWidth = 2; ctx.stroke();
    // the tied end: a wrapped cord, a knot and two loose tails
    ctx.strokeStyle = o.tie ?? '#d8c08a'; ctx.lineWidth = 5; for (let q = 0; q < 3; q++) { ctx.beginPath(); ctx.moveTo(l * (0.62 + q * 0.07), -wd * 0.85); ctx.lineTo(l * (0.62 + q * 0.07) + 3, wd * 0.85); ctx.stroke(); }
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(l * 0.86, wd * 0.7); ctx.quadraticCurveTo(l * 0.96, wd * 1.8, l * 0.8, wd * 2.2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(l * 0.86, -wd * 0.7); ctx.quadraticCurveTo(l * 1.0, -wd * 1.6, l * 0.84, -wd * 2.0); ctx.stroke();
    ctx.restore();
  }
  body(ctx); ctx.fillStyle = rgrad(ctx, cx, cy, h * 0.1, w * 1.1, [[0, lighter(o.col, 0.35)], [0.5, o.col], [1, darker(o.col, 0.6)]], cx - w * 0.3, cy - h * 0.4); ctx.fill();
  ctx.save(); body(ctx); ctx.clip();
  // mottled patches of the hide
  for (let k = 0; k < 26; k++) { const a = hash(k + 7) * TAU, d = Math.sqrt(hash(k + 31)) * 0.9; ctx.fillStyle = `rgba(${hash(k) > 0.5 ? '20,10,0' : '255,240,210'},${0.05 + 0.09 * hash(k + 3)})`; ell(ctx, cx + Math.cos(a) * d * w, cy + Math.sin(a) * d * h, w * (0.12 + 0.22 * hash(k + 5)), h * (0.1 + 0.2 * hash(k + 9))); ctx.fill(); }
  if (o.wool) { for (let k = 0; k < 150; k++) { const a = hash(k + 3) * TAU, d = Math.sqrt(hash(k + 40)) * 0.96; ctx.fillStyle = rgba(hash(k + 11) > 0.45 ? lighter(o.fur ?? '#efe2c0', 0.2) : darker(o.fur ?? '#efe2c0', 0.25), 0.16 + 0.22 * hash(k + 2)); circ(ctx, cx + Math.cos(a) * d * w, cy + Math.sin(a) * d * h, 4 + 6 * hash(k + 6)); ctx.fill(); } for (let k = 0; k < 90; k++) { const a = hash(k + 71) * TAU, d = 0.55 + 0.45 * Math.sqrt(hash(k + 5)), x = cx + Math.cos(a) * d * w, y = cy + Math.sin(a) * d * h; ctx.strokeStyle = 'rgba(70,50,20,0.28)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 4 + 4 * hash(k), 0.2, 3.6); ctx.stroke(); } }
  else for (let k = 0; k < 280; k++) { const a = hash(k + 3) * TAU, d = 0.35 + 0.65 * Math.sqrt(hash(k + 40)); ctx.strokeStyle = rgba(o.fur ?? lighter(o.col, 0.35), 0.1 + 0.28 * hash(k + 8)); ctx.lineWidth = 1.6; ctx.beginPath(); const x = cx + Math.cos(a) * d * w, y = cy + Math.sin(a) * d * h; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a + 0.4) * 11, y + Math.sin(a + 0.4) * 11); ctx.stroke(); }
  // folds of the hide running from each leg stub into the body: a dark crease with a light lip beside it
  for (const [sx, sy] of stubs) {
    const x0 = cx + sx * w, y0 = cy + sy * h;
    for (let q = -2; q <= 2; q++) {
      const ex = lerp(x0, cx, 0.62) + q * w * 0.07, ey = lerp(y0, cy, 0.62) - q * h * 0.05, mx = lerp(x0, ex, 0.5) + q * 9, my = lerp(y0, ey, 0.5) - q * 7;
      ctx.strokeStyle = 'rgba(10,4,0,0.34)'; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke();
      ctx.strokeStyle = rgba(lighter(o.col, 0.6), 0.22); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x0 + 3, y0 + 3); ctx.quadraticCurveTo(mx + 3, my + 3, ex + 3, ey + 3); ctx.stroke();
    }
  }
  // a stitched seam down the middle
  ctx.strokeStyle = o.tie ?? '#d8c08a'; ctx.lineWidth = 3; ctx.setLineDash([7, 6]); ctx.beginPath(); ctx.moveTo(cx + w * 0.05, cy - h * 0.82); ctx.bezierCurveTo(cx - w * 0.08, cy - h * 0.3, cx + w * 0.1, cy + h * 0.3, cx - w * 0.02, cy + h * 0.82); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = rgrad(ctx, cx - w * 0.3, cy - h * 0.45, 0, w * 0.9, [[0, 'rgba(255,244,214,0.38)'], [1, 'rgba(255,244,214,0)']]); ctx.fillRect(cx - w, cy - h, 2 * w, 2 * h);
  ctx.fillStyle = 'rgba(255,250,235,0.34)'; ell(ctx, cx - w * 0.38, cy - h * 0.42, w * 0.22, h * 0.09); ctx.fill(); ctx.fillStyle = 'rgba(255,250,235,0.2)'; ell(ctx, cx - w * 0.52, cy - h * 0.14, w * 0.06, h * 0.12); ctx.fill();
  ctx.restore();
  // the hair or wool standing out at the edge of the hide: a fringe that makes the silhouette read as a skin
  const hl = o.hair ?? 14;
  for (let k = 0; k < 420; k++) {
    const t = (k / 420) * TAU + hash(k) * 0.02, px = cx + Math.cos(t) * w * rad(t), py = cy + Math.sin(t) * h * rad(t), nx = Math.cos(t), ny = Math.sin(t), L = hl * (0.5 + hash(k + 9)), sw = (hash(k + 4) - 0.5) * 0.7;
    if (o.wool) { ctx.fillStyle = rgba(hash(k + 11) > 0.5 ? lighter(o.fur ?? '#efe2c0', 0.25) : (o.fur ?? '#efe2c0'), 0.55 + 0.4 * hash(k + 6)); circ(ctx, px + nx * L * 0.35, py + ny * L * 0.35, L * 0.42 + 2); ctx.fill(); }
    else { ctx.strokeStyle = rgba(hash(k + 5) > 0.5 ? lighter(o.fur ?? o.col, 0.15) : darker(o.col, 0.3), 0.55); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(px - nx * 2, py - ny * 2); ctx.lineTo(px + (nx + sw * -ny) * L, py + (ny + sw * nx) * L); ctx.stroke(); }
  }
  ctx.strokeStyle = rgba(darker(o.col, 0.8), 0.5); ctx.lineWidth = 2; body(ctx); ctx.stroke();
}
function rrectPath(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
// leather bellows: two boards hinged at one end with pleated leather between them, a nozzle at the hinge and a strap; (x, y) is the hinge
function bellows(ctx, x, y, w, h, o) {
  const open = 0.34 + 0.12 * (o.open ?? 0), L = w, T = h * 0.13;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? 0);
  const P = (d, side, off = 0) => { const a = side * open / 2; return [d * Math.cos(a) - off * Math.sin(a) * side, d * Math.sin(a) + off * Math.cos(a)]; };
  ctx.save(); ctx.translate(9, 13); ctx.fillStyle = 'rgba(0,0,0,0.34)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(...P(L, -1)); ctx.lineTo(...P(L, 1)); ctx.closePath(); ctx.fill(); ctx.restore();
  // the leather between the boards: pleats fanning from the hinge
  const sA = P(L * 0.92, -1), sB = P(L * 0.92, 1);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(...sA); ctx.lineTo(...sB); ctx.closePath(); ctx.fillStyle = darker(o.leather, 0.25); ctx.fill();
  for (let k = 1; k < 8; k++) { const t = k / 8, a = P(L * 0.92, -1), b = P(L * 0.92, 1), ex = lerp(a[0], b[0], t), ey = lerp(a[1], b[1], t); ctx.strokeStyle = k % 2 ? rgba(lighter(o.leather, 0.4), 0.55) : rgba('#000', 0.45); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(L * 0.08, (ey / L) * L * 0.08); ctx.lineTo(ex, ey); ctx.stroke(); }
  for (const side of [-1, 1]) {
    const a0 = P(L * 0.04, side), a1 = P(L, side), nx = -Math.sin(side * open / 2) * side, ny = Math.cos(side * open / 2);
    ctx.beginPath(); ctx.moveTo(a0[0] - nx * T / 2 * side, a0[1] - ny * T / 2 * side); ctx.lineTo(a1[0] - nx * T / 2 * side, a1[1] - ny * T / 2 * side); ctx.lineTo(a1[0] + nx * T / 2 * side, a1[1] + ny * T / 2 * side); ctx.lineTo(a0[0] + nx * T / 2 * side, a0[1] + ny * T / 2 * side); ctx.closePath();
    ctx.fillStyle = hgrad(ctx, 0, L, [[0, darker(o.wood, 0.4)], [0.5, lighter(o.wood, 0.3)], [1, o.wood]]); ctx.fill(); ctx.strokeStyle = rgba(darker(o.wood, 0.7), 0.85); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = rgba(o.band ?? '#d4b25a', 0.9); ctx.beginPath(); ctx.arc(a1[0], a1[1], T * 0.36, 0, TAU); ctx.fill();
  }
  ctx.strokeStyle = o.strap ?? '#7a4a22'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...P(L * 0.62, -1, T)); ctx.quadraticCurveTo(L * 0.6, 0, ...P(L * 0.62, 1, -T)); ctx.stroke();
  ctx.fillStyle = hgrad(ctx, -34, 4, [[0, darker(o.band ?? '#d4b25a', 0.5)], [0.4, lighter(o.band ?? '#d4b25a', 0.4)], [1, darker(o.band ?? '#d4b25a', 0.5)]]); rrectPath(ctx, -34, -9, 40, 18, 7); ctx.fill();
  ctx.restore();
}

// ---- the instruments -----------------------------------------------------------------------------------------------------------------
// design space: v across (-280..280), u down (0..900). `bag` {kind, cx, cy, rx, ry, ...}; `chanter` {v, top, foot, w, col, bell, bellCol, rings}; `drones`: pipes from the stock
const B = {
  zampogna: { tilt: 0.06, dx: 0.0, set: { kind: 'earth', base: '#3a2a1c', light: '#ffe0a8', rug: 'stripes', rugBase: '#2a3a2a', rugA: '#d8b45a', rugB: '#8a2a1e' },
    bag: { kind: 'skin', cx: 0, cy: 190, rx: 190, ry: 118, col: '#a0784a', fur: '#efe0bc', wool: true, hair: 17, tie: '#d8c08a', stubLen: 42, stubW: 20 },
    stock: { v: 0, u: 305, w: 100, col: '#5a3a1c' },
    chanters: [{ v: -52, top: 312, foot: 790, w: 17, col: '#7a4a24', bell: 'horn', bellCol: '#c9a05a', bellBend: -0.5, rings: [[0.02, '#d8b45a'], [0.2, '#efe4c6']], main: true }, { v: 52, top: 312, foot: 690, w: 16, col: '#7a4a24', bell: 'horn', bellCol: '#c9a05a', bellBend: 0.5, rings: [[0.02, '#d8b45a']], dim: true }],
    drones: [{ v: -128, ang: 0.07, top: 316, foot: 640, w: 12, col: '#6a3e1e', bell: 'horn', bellCol: '#c9a05a', bend: -0.6 }, { v: 128, ang: -0.07, top: 316, foot: 600, w: 12, col: '#6a3e1e', bell: 'horn', bellCol: '#c9a05a', bend: 0.6 }], blow: { from: [-98, 120], to: [-150, 20], col: '#8a6a3a' }, drone: 0.0 },
  uilleann: { tilt: -0.1, dx: 0.08, set: { kind: 'planks', base: '#2e2018', light: '#ffe0b0', rug: 'diamond', rugBase: '#1c3226', rugA: '#d0a858', rugB: '#6a1e22' },
    bag: { kind: 'cloth', cx: -26, cy: 250, rx: 124, ry: 98, col: '#2f5a3a', cord: '#d4b25a', tassel: '#c8a040', nap: true, stripe: '#1a3a24', straps: true },
    bellows: { x: -66, y: 372, w: 240, h: 180, rot: 2.75, wood: '#8a5a2c', leather: '#7a4426', band: '#d4b25a' },
    stock: { v: -26, u: 336, w: 62, col: '#c9a040', brass: true },
    chanters: [{ v: -26, top: 346, foot: 780, w: 17, col: '#5a3a1e', bell: 'flare', bellCol: '#d4b25a', rings: [[0.0, '#d4b25a'], [0.14, '#efe4c6'], [0.5, '#d4b25a']], keys: true, main: true }],
    drones: [{ v: 105, ang: -1.28, top: 292, foot: 150, w: 13, col: '#5a3a1e', bell: 'none', rings: [[0.5, '#d4b25a'], [1, '#efe4c6']], lie: true }, { v: 125, ang: -1.38, top: 318, foot: 60, w: 11.5, col: '#5a3a1e', bell: 'none', rings: [[0.5, '#d4b25a']], lie: true }, { v: 142, ang: -1.5, top: 338, foot: 20, w: 10.5, col: '#5a3a1e', bell: 'none', rings: [[0.5, '#d4b25a']], lie: true }] },
  gaita: { tilt: 0.0, dx: -0.08, set: { kind: 'cloth', base: '#1d2c40', accent: '#d8b45a', light: '#ffe2b0' },
    bag: { kind: 'cloth', cx: 0, cy: 250, rx: 150, ry: 120, col: '#a8222a', cord: '#e0b860', nap: true, emb: '#e0b860', tassel: '#e0b860' },
    stock: { v: 0, u: 358, w: 70, col: '#3a2410' },
    chanters: [{ v: 6, top: 366, foot: 800, w: 17, col: '#8a5a2a', bell: 'flare', bellCol: '#b9a070', rings: [[0.02, '#c9ccd2'], [0.22, '#c9ccd2'], [0.6, '#c9ccd2']], main: true }],
    drones: [{ v: -78, ang: -0.28, top: 188, foot: 20, w: 13, col: '#7a4a24', bell: 'none', rings: [[0.5, '#c9ccd2'], [0.95, '#d4b25a']], long: true }, { v: -22, ang: -0.18, top: 170, foot: 90, w: 11, col: '#7a4a24', bell: 'none', rings: [[0.5, '#c9ccd2']] }, { v: 40, ang: 0.12, top: 170, foot: 150, w: 10, col: '#7a4a24', bell: 'none', rings: [[0.5, '#c9ccd2']] }], blow: { from: [118, 220], to: [250, 140], col: '#7a4a24' } },
  gaida: { tilt: 0.1, dx: -0.06, set: { kind: 'earth', base: '#34261c', light: '#ffe0b0', rug: 'zigzag', rugBase: '#20301e', rugA: '#d8b45a', rugB: '#a8321e' },
    bag: { kind: 'skin', cx: 0, cy: 270, rx: 175, ry: 130, col: '#6a4528', fur: '#b09468', hair: 12, tie: '#d8c08a', stubLen: 38, stubW: 21 },
    stock: { v: 0, u: 372, w: 66, col: '#3a2410' },
    chanters: [{ v: 0, top: 380, foot: 810, w: 16, col: '#5a3a1e', bell: 'flare', bellCol: '#3a2410', rings: [[0.02, '#d8c08a'], [0.14, '#d8c08a'], [0.7, '#d8c08a']], main: true }],
    drones: [{ v: -112, ang: -0.14, top: 232, foot: 96, w: 15, col: '#4a2c14', bell: 'horn', bellCol: '#caa860', bend: 2.5, tall: true, rings: [[0.35, '#d8c08a'], [0.7, '#d8c08a']] }], blow: { from: [150, 250], to: [250, 200], col: '#6a4a2a' } },
  tulum: { tilt: -0.08, dx: 0.1, set: { kind: 'earth', base: '#2e261e', light: '#ffe0b0', rug: 'stripes', rugBase: '#22302a', rugA: '#d0b060', rugB: '#8a3a22' },
    bag: { kind: 'skin', cx: 0, cy: 205, rx: 150, ry: 96, col: '#34261a', fur: '#7a6a4c', hair: 13, tie: '#c9a868', stubLen: 36, stubW: 19, stubs: [[-0.8, -0.55, -2.3], [0.8, -0.55, -0.8], [-0.7, 0.72, 2.4], [0.72, 0.72, 0.7]] },
    stock: { v: 0, u: 290, w: 84, col: '#c9a868' },
    chanters: [{ v: -32, top: 298, foot: 820, w: 16, col: '#d0a458', bell: 'none', rings: [[0.02, '#4a2c14'], [0.3, '#4a2c14'], [0.66, '#4a2c14']], main: true, bore: true }, { v: 32, top: 298, foot: 820, w: 16, col: '#d0a458', bell: 'none', rings: [[0.02, '#4a2c14'], [0.3, '#4a2c14'], [0.66, '#4a2c14']], dim: true, bore: true }],
    drones: [], blow: { from: [-130, 170], to: [-230, 70], col: '#d0a458' } },
  musette: { tilt: 0.12, dx: -0.1, set: { kind: 'cloth', base: '#2a1a2e', accent: '#e8c878', light: '#fff0c8' },
    bag: { kind: 'cloth', cx: -20, cy: 220, rx: 128, ry: 108, col: '#8a1a3a', cord: '#f0d070', nap: true, emb: '#f4d878', tassel: '#f0d070' },
    bellows: { x: 150, y: 285, w: 170, h: 140, rot: 0.55, wood: '#e8d8a8', leather: '#b0283a', band: '#f0d070', strap: '#a8283a' },
    stock: { v: -20, u: 316, w: 80, col: '#efe4c6' },
    chanters: [{ v: -20, top: 326, foot: 790, w: 17, col: '#efe4c6', bell: 'flare', bellCol: '#d4b25a', rings: [[0.02, '#d4b25a'], [0.12, '#d4b25a'], [0.3, '#d4b25a'], [0.5, '#d4b25a'], [0.78, '#d4b25a']], main: true }],
    drones: [{ v: -92, ang: -0.1, top: 330, foot: 120, w: 15, col: '#efe4c6', bell: 'none', rings: [[0.3, '#d4b25a'], [0.7, '#d4b25a'], [1, '#d4b25a']], chest: true }, { v: 52, ang: 0.1, top: 330, foot: 150, w: 15, col: '#efe4c6', bell: 'none', rings: [[0.3, '#d4b25a'], [0.7, '#d4b25a'], [1, '#d4b25a']], chest: true }] },
};

export function createBagpipe2(S, lanes, style, P) {
  const N = lanes.length, L0 = B[style] ?? B.gaita;
  L0.set = { ...L0.set, ...(P?.set ?? {}) };
  const st = { id: 'bagpipe2', style, kind: 'winds', spots: new Array(N).fill(null), voice: 'reed', sustained: true, F: null, G: null };
  const spots = st.spots;
  st.reedStyle = style;
  st.voiceOf = () => 'pipe';
  const nHoles = clamp(Math.max(0, ...lanes.map((l) => (l.holes || '').length)) || 7, 4, 9);
  const first = lanes.map((l) => { const h = l.holes || ''; if (!h) return null; let c = 0; while (c < h.length && h[c] === '1') c++; return c; });
  const byPitch = lanes.map((_, i) => i).sort((a, b) => lanes[a].hz - lanes[b].hz);
  byPitch.forEach((i, rank) => { if (first[i] == null) first[i] = clamp(nHoles - rank, 0, nHoles); });
  const fingerOf = (i) => Array.from({ length: nHoles }, (_, k) => k < first[i]);
  const fing = new Array(nHoles).fill(1);
  const main = L0.chanters.find((c) => c.main);
  let lastAnim = 0, sq = 0;
  const DW = 560, DH = 900;
  st.layout = (area) => {
    const F = makeFrame(area, { top: 40, bottom: 10, side: 14, tilt: L0.tilt || 0, dx: L0.dx || 0, zoom: 1 }); st.F = F;
    const { W, H } = F, k = Math.min(W / DW, H / DH), u0 = (H - DH * k) / 2;
    const G = { W, H, k, u0 };
    G.map = (v, u) => [v * k, u0 + u * k];
    const hz0 = lerp(main.top, main.foot, 0.17), hz1 = lerp(main.top, main.foot, 0.9);
    G.holeAt = (i) => hz0 + (i + 0.5) * (hz1 - hz0) / nHoles;
    G.step = (hz1 - hz0) / nHoles;
    st.G = G;
    const R = clamp(G.step * k * 0.5, 16, 34), used = new Map();
    lanes.forEach((_, i) => {
      const c = first[i], uu = c >= nHoles ? main.foot - 6 : G.holeAt(c), n = used.get(c) ?? 0; used.set(c, n + 1);
      const [pv, pu] = G.map(main.v + n * 56, uu);
      spots[i] = circleSpot(pv, pu, R + (n ? 4 : 0), { first: c, dup: n });
      if (!n) { const [pl] = G.map(main.v - (main.w + 70), uu), sp = spots[i], own = sp.dist; sp.pillV = pl; sp.dist = (lv, lu) => Math.min(own(lv, lu), Math.hypot(lv - pl, lu - sp.u) / (R * 0.9)); }
    });
    finishSpots(F, spots);
  };
  st.hit = (x, y) => (st.F ? hitSpots(st.F, spots, x, y) : -1);
  st.anchor = (i) => ({ x: spots[i]?.x ?? 0, y: spots[i]?.y ?? 0 });
  st.countSpot = () => {
    const F = st.F, G = st.G;
    if (!F || !G) return null;
    const [x, y] = F.landscape ? F.map(F.W * 0.3, G.H * 0.12) : F.map(-F.W * 0.3, G.H * 0.08);
    return { x, y, size: clamp(Math.min(F.W, G.H) * 0.16, 48, 100) };
  };
  st.draw = (g, rt) => {
    const { ctx } = g, F = st.F;
    if (!F) return;
    const G = st.G, k = G.k;
    const dtv = clamp(rt.anim - lastAnim, 0, 0.1); lastAnim = rt.anim;
    let act = -1, best = 0.02, loud = 0;
    lanes.forEach((_, i) => { const v = rt.flash[i] + (rt.hold[i] ?? 0) * 0.6; if (v > best) { best = v; act = i; } loud = Math.max(loud, rt.flash[i]); });
    sq += (loud - sq) * clamp(dtv * 14, 0, 1);
    const tgt = act >= 0 ? fingerOf(act) : new Array(nHoles).fill(true);
    for (let q = 0; q < nHoles; q++) fing[q] += ((tgt[q] ? 1 : 0) - fing[q]) * clamp(dtv * 18, 0, 1);
    const col = act >= 0 ? lanes[act].color : '#ffd9a0', live = act >= 0 ? best : 0;
    setting(ctx, F, L0.set.kind, S, rt, { ...L0.set, rugKind: L0.set.rug || null, rugPad: 0.04, rugTall: 0.4, bbox: instrumentBox(F) });
    ctx.save(); F.apply(ctx);
    ctx.translate(0, G.u0); ctx.scale(k, k);
    const bag = L0.bag, bg = { ...bag, sq };
    // blowpipe behind the bag
    if (L0.blow) { const { from, to, col: bc } = L0.blow; rod(ctx, from[0], from[1], to[0], to[1], 11, 9, bc); ring(ctx, from[0], from[1], to[0], to[1], 0.92, 13, 22, '#efe4c6'); ring(ctx, from[0], from[1], to[0], to[1], 0.0, 14, 10, '#d4b25a'); }
    // drones: behind the bag where they rise over it; lying drones are drawn after
    const drawDrone = (d, idx) => {
      const sh = Math.sin(rt.anim * 24 + idx) * 0.8 * (live > 0 ? 1 : 0.25), x0 = d.v, y0 = d.top, x1 = d.v + Math.sin(d.ang) * (d.top - d.foot), y1 = d.foot;
      if (d.bell === 'horn') { const ang = Math.atan2(y1 - y0, x1 - x0); rod(ctx, x0, y0, x1 + sh, y1 + (d.tall ? 0 : 0), d.w, d.w * 0.82, d.col); ring(ctx, x0, y0, x1, y1, 0.12, d.w * 1.2, 14, '#d8c08a'); horn(ctx, x1 + sh, y1, ang, 96, d.w * 0.8, d.w * 2.4, d.bend ?? 0, d.bellCol, { rings: true }); }
      else { rod(ctx, x0, y0, x1 + sh, y1, d.w, d.w * 0.84, d.col); for (const [t, c] of d.rings ?? []) ring(ctx, x0, y0, x1 + sh, y1, t, d.w * 1.2, 11, c); ring(ctx, x0, y0, x1, y1, 0.0, d.w * 1.3, 16, '#efe4c6'); ring(ctx, x0, y0, x1 + sh, y1, 1, d.w * 1.4, 18, '#d8c08a', { taper: 0.7 }); if (d.chest) ring(ctx, x0, y0, x1, y1, 0.04, d.w * 1.5, 26, '#d4b25a'); }
      if (live > 0.05) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba('#fff2c0', 0.1 + 0.08 * Math.sin(rt.anim * 6 + idx)); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 - d.w * 0.4, y0); ctx.lineTo(x1 - d.w * 0.4 + sh, y1); ctx.stroke(); ctx.restore(); }
    };
    const rising = L0.drones.filter((d) => !d.lie), lying = L0.drones.filter((d) => d.lie);
    rising.forEach((d, i) => { if (d.v > bag.cx - 40 && !d.long) return; drawDrone(d, i); });
    if (L0.bellows) bellows(ctx, L0.bellows.x, L0.bellows.y, L0.bellows.w, L0.bellows.h, { ...L0.bellows, open: sq });
    // pipes hang from the stock: the chanter(s)
    const pipeW = (c) => c.w;
    for (const c of [...L0.chanters].sort((a, b) => (a.main ? 1 : 0) - (b.main ? 1 : 0))) {
      const x = c.v, y0 = c.top, y1 = c.foot, w = pipeW(c), flareStart = c.bell === 'flare' ? 0.93 : 1;
      rod(ctx, x, y0, x, y1 * flareStart + (1 - flareStart) * y0, w, w * 1.08, c.col);
      ctx.save(); ctx.beginPath(); ctx.rect(x - w, y0, 2 * w, (y1 * flareStart + (1 - flareStart) * y0) - y0); ctx.clip(); grain(ctx, x - w, y0, 2 * w, y1 - y0, darker(c.col, 0.7), 0.4, 3 + ((x + 50) | 0), true, 10); for (let k = 0; k < 5; k++) { ctx.fillStyle = rgba(darker(c.col, 0.7), 0.4); ell(ctx, x + (hash(k + x) - 0.5) * w, lerp(y0, y1, hash(k + 3)), 3, 5); ctx.fill(); } ctx.fillStyle = hgrad(ctx, x - w * 0.5, x - w * 0.1, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,250,230,0.3)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(x - w * 0.5, y0, w * 0.4, y1 - y0); ctx.restore();
      for (const [t, rc] of c.rings ?? []) ring(ctx, x, y0, x, y1, t, w * 1.22, t === 0 ? 20 : 12, rc);
      if (c.bell === 'flare') { rod(ctx, x, y1 * flareStart + (1 - flareStart) * y0 - 4, x, y1 + 12, w * 1.08, w * 2.0, c.bellCol, { shadow: false }); ring(ctx, x, y1 - 24, x, y1 + 14, 0.6, w * 2.1, 14, '#d4b25a'); ctx.fillStyle = '#080403'; ell(ctx, x, y1 + 12, w * 1.6, 6); ctx.fill(); }
      else if (c.bell === 'horn') { horn(ctx, x, y1 - 8, Math.PI / 2, 96, w * 1.0, w * 2.6, c.bellBend ?? 0, c.bellCol, { rings: true }); }
      else { ctx.fillStyle = '#100803'; ell(ctx, x, y1, w * 0.9, 5); ctx.fill(); }
      if (c.keys) for (const [dv, u] of [[-34, 0.3], [34, 0.45], [-34, 0.6], [34, 0.7]]) { const yy = lerp(y0, y1, u); ctx.strokeStyle = '#d4b25a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + dv * 0.5, yy); ctx.lineTo(x + dv, yy); ctx.stroke(); ctx.fillStyle = '#e8c870'; circ(ctx, x + dv, yy, 8); ctx.fill(); ctx.strokeStyle = '#6a4a14'; ctx.lineWidth = 2; ctx.stroke(); }
      // finger holes: bored, with a bright rim; dim chanters show theirs unlit
      const hz0 = lerp(c.top, c.foot, 0.17), hz1 = lerp(c.top, c.foot, 0.9), stp = (hz1 - hz0) / nHoles, r = Math.min(w * 0.46, stp * 0.24);
      for (let q = 0; q < nHoles; q++) {
        const u = hz0 + (q + 0.5) * stp, cvv = fing[q];
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, x + 2, u + 3, r + 2, r + 2); ctx.fill();
        ctx.fillStyle = rgrad(ctx, x, u, 0, r * 1.1, [[0, '#000'], [0.7, '#0c0a0a'], [1, '#2a2420']]); ell(ctx, x, u, r, r); ctx.fill();
        ctx.strokeStyle = rgba('#d9a93a', 0.9); ctx.lineWidth = 2; ctx.stroke();
        if (c.main && cvv > 0.05 && !isHero()) { const pr = r * 1.6, padA = 0.22 + 0.78 * Math.min(1, live * 1.4); ctx.fillStyle = rgba(lighter(col, 0.3), 0.18 + 0.6 * padA * cvv); circ(ctx, x, u, pr); ctx.fill(); ctx.strokeStyle = rgba(lighter(col, 0.65), (0.3 + 0.7 * padA) * cvv); ctx.lineWidth = 2.5; ctx.stroke(); if (live > 0.03) glow(ctx, x, u, pr * 2.6, col, 0.3 * cvv * live); }
      }
    }
    // the stock block that holds the pipes
    const sk = L0.stock;
    rrectPath(ctx, sk.v - sk.w / 2, sk.u - 16, sk.w, 40, 12);
    ctx.fillStyle = hgrad(ctx, sk.v - sk.w / 2, sk.v + sk.w / 2, [[0, darker(sk.col, 0.55)], [0.25, lighter(sk.col, 0.5)], [0.6, sk.col], [1, darker(sk.col, 0.6)]]); ctx.fill(); ctx.strokeStyle = rgba(darker(sk.col, 0.75), 0.85); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.strokeStyle = '#d8c08a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(sk.v - sk.w * 0.4, sk.u + 2); ctx.lineTo(sk.v + sk.w * 0.4, sk.u + 2); ctx.stroke();
    // the bag, over the stock and the drone roots
    if (bag.kind === 'skin') skinBag(ctx, bag.cx, bag.cy, bag.rx, bag.ry, bg); else clothBag(ctx, bag.cx, bag.cy, bag.rx, bag.ry, bg);
    if (bag.tassel) tassel(ctx, bag.cx - bag.rx * 0.62, bag.cy + bag.ry * 0.78, 54, bag.tassel, Math.sin(rt.anim * 3) * 3 + loud * 6 * Math.sin(rt.anim * 28));
    // drones that stand in front of the bag, and lying drones
    rising.forEach((d, i) => { if (d.v > bag.cx - 40 && !d.long) drawDrone(d, i + 5); });
    lying.forEach((d, i) => {
      const x0 = bag.cx + bag.rx * 0.5 + 6 + i * 6, y0 = bag.cy - bag.ry * (0.15 - i * 0.2), x1 = x0 + 214 - i * 34, y1 = y0 - 54 + i * 52;
      rod(ctx, x0, y0, x1, y1, d.w, d.w * 0.86, d.col); for (const [t, c] of d.rings ?? []) ring(ctx, x0, y0, x1, y1, t, d.w * 1.2, 11, c);
      ring(ctx, x0, y0, x1, y1, 0, d.w * 1.4, 16, '#d4b25a'); ring(ctx, x0, y0, x1, y1, 1, d.w * 1.4, 16, '#d8c08a', { taper: 0.7 });
    });
    // air and breath: from the stock down the chanter to the first open hole
    lanes.forEach((l, i) => {
      const f = rt.flash[i] + (rt.hold[i] ?? 0) * 0.5; if (f <= 0.03) return;
      const u = first[i] >= nHoles ? main.foot - 6 : G.holeAt(first[i]);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = vgrad(ctx, main.top, u, [[0, rgba(l.color, 0.45 * f)], [1, rgba(l.color, 0.1 * f)]]); rrect(ctx, main.v - 8, main.top, 16, Math.max(4, u - main.top), 8); ctx.fill(); ctx.restore();
      glow(ctx, main.v, u, 60, l.color, 0.4 * Math.min(1, f));
    });
    ctx.restore();
    // cues and markers are in screen-mapped local space so they follow the spots
    ctx.save(); F.apply(ctx);
    const topM = G.map(main.v, main.top);
    for (let q = rt.list.length - 1; q >= 0; q--) {
      const t = rt.list[q];
      if (t.state && t.state !== 'pending' && t.state !== 'miss') continue;
      const tau = (t.t - rt.clock) / rt.look;
      if (tau > 1.0 || tau < -0.25) continue;
      const sp = spots[t.lane], l = lanes[t.lane], miss = t.state === 'miss', a = (rt.soft ? 0.5 : 1) * (miss ? 0.35 : 1) * clamp((1.05 - tau) * 8, 0, 1) * clamp((tau + 0.25) * 6, 0, 1), c2 = miss ? mix(l.color, '#555555', 0.6) : l.color, p = clamp(1 - tau, 0, 1.05);
      const x = lerp(topM[0], sp.v, p), y = lerp(topM[1], sp.u, p);
      ctx.save(); ctx.globalAlpha = a; glow(ctx, x, y, 40 + 30 * p, c2, 0.4); ctx.fillStyle = rgba(lighter(c2, 0.6), 0.95); circ(ctx, x, y, 12 + 4 * p); ctx.fill(); ctx.strokeStyle = rgba(c2, 1); ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = rgba(lighter(c2, 0.45), 0.9); ctx.lineWidth = 2.5; circ(ctx, sp.v, sp.u, sp.r * (1 + 0.9 * clamp(tau, 0, 1)) * 0.95); ctx.stroke(); ctx.restore();
    }
    if (!isHero()) lanes.forEach((l, i) => {
      const sp = spots[i], f = rt.flash[i] ?? 0;
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 4; circ(ctx, sp.v + 1, sp.u + 2, sp.r * 0.95); ctx.stroke();
      ctx.strokeStyle = rgba(lighter(l.color, 0.4), 0.55 + 0.45 * f); ctx.lineWidth = 2.5; circ(ctx, sp.v, sp.u, sp.r * 0.95); ctx.stroke();
      if (sp.pillV !== undefined) { ctx.strokeStyle = rgba(l.color, 0.45); ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(sp.pillV + 34, sp.u); ctx.lineTo(sp.v - sp.r * 0.95, sp.u); ctx.stroke(); ctx.setLineDash([]); }
    });
    ctx.restore();
    const size = g.px(15);
    lanes.forEach((l, i) => { const sp = spots[i], [x, y] = F.map(sp.pillV !== undefined ? sp.pillV : sp.v, sp.u); pill(ctx, l.name, x, y, 74, size, l.color, rt.flash[i]); });
  };
  return st;
}

registerHook('holes', (k) => MATCH.test(k), (S, lanes, P, { key }) => createBagpipe2(S, lanes, styleOf(key), P), { first: true });

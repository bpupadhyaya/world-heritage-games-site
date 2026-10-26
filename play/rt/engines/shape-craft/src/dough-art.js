// Kitchen Crafts of the World, dough area: shared drawing. Dough that looks like dough (matte, a little translucent where thin, flour dusted,
// dented by fingers), wooden boards, tools, steam, and a believable shaded hand (tapered fingers with nails, knuckle creases, sleeve).
// Pure canvas 2D; irregularity comes from hash, motion from the time argument. No DOM, no Math.random, no clocks.
import { hash } from './geom.js';
import { tint, mix, rgba, rrect } from './fx.js';
import { makeSurface } from './paint-ui.js';
import { lg, rg, ell, cast, TAU } from './props.js';

export { lg, rg, ell, cast, TAU, tint, mix, rgba, rrect, hash };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---- baked layers -------------------------------------------------------------------------------------------------------------------
// Static art (a kitchen wall, the grain of a board) is drawn once into an off-screen canvas and blitted every frame, so phones are not asked to redraw
// a hundred tiles at sixty frames a second. The layer is redrawn when its size or the screen scale changes. Without a canvas factory (headless tests)
// the caller draws directly. Drawing is identical either way (the layer only caches pixels), so nothing here touches game state or determinism.
const BAKED = new Map();
export function bake(ctx, key, w, h, draw, maxSc = 3) {
  let sc = 1; try { const m = ctx.getTransform(); const v = Math.hypot(m.a, m.b); if (v > 0 && Number.isFinite(v)) sc = Math.min(v, maxSc, 700 / Math.max(w, h)); } catch { /* no transform: 1 */ }
  const W = Math.max(1, Math.ceil(w * sc)), H = Math.max(1, Math.ceil(h * sc)), id = `${W}x${H}`;
  let e = BAKED.get(key);
  if (!e || e.id !== id) {
    let surf = null; try { surf = makeSurface(ctx, W, H); } catch { surf = null; }
    if (!surf) { BAKED.set(key, { id, none: true }); return null; }
    surf.ctx.save(); surf.ctx.scale(sc, sc); const info = draw(surf.ctx); surf.ctx.restore();
    e = { id, surf, info, sc }; BAKED.delete(key); BAKED.set(key, e);
    while (BAKED.size > 28) BAKED.delete(BAKED.keys().next().value);   // a resized window leaves old sizes behind: keep the newest layers only
  }
  if (e.none) return null;
  return { canvas: e.surf.canvas, info: e.info };
}

// ---- skin tones and dough colours -----------------------------------------------------------------------------------------------
export const SKIN = { warm: '#e3b08a', olive: '#d6a27a', fair: '#eec4a4', tan: '#c98e66', deep: '#a8704c' };

// ---- flour and crumbs ---------------------------------------------------------------------------------------------------------------
// Specks of flour in an ellipse: n specks, density falls off to the edge; seed keeps the pattern fixed.
export function flour(ctx, cx, cy, rx, ry, n, seed, alpha = 0.5, size = 1.8, color = '#fffaf0') {
  ctx.save(); ctx.fillStyle = rgba(color, alpha); ctx.beginPath();
  for (let k = 0; k < n; k++) {
    const a = hash(k, seed, 1) * TAU, d = Math.pow(hash(k, seed, 2), 0.7), s = size * (0.45 + hash(k, seed, 3) * 1.1);
    ctx.rect(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, s, s * (0.7 + hash(k, seed, 4) * 0.6));
  }
  ctx.fill(); ctx.restore();
}
// A soft cloud of flour (bench dusting): a few big faint radial blobs plus fine specks.
export function flourCloud(ctx, cx, cy, rx, ry, seed, alpha = 0.35, color = '#fffaf0') {
  ctx.save();
  for (let k = 0; k < 5; k++) {
    const x = cx + (hash(k, seed, 7) - 0.5) * rx * 1.1, y = cy + (hash(k, seed, 8) - 0.5) * ry * 1.1, r = (0.35 + hash(k, seed, 9) * 0.45) * Math.max(rx, ry);
    ctx.fillStyle = rg(ctx, x, y, 1, r, [[0, rgba(color, alpha * 0.45)], [1, rgba(color, 0)]]); ctx.beginPath(); ctx.ellipse(x, y, r, r * (ry / rx), 0, 0, TAU); ctx.fill();
  }
  flour(ctx, cx, cy, rx, ry, 70, seed + 3, alpha * 1.3, 1.5, color); ctx.restore();
}

// ---- steam (rises from x, y; w wide, h high; t seconds) -----------------------------------------------------------------------------
export function steam(ctx, x, y, w, h, t, a = 0.5, seed = 1, color = '#ffffff') {
  ctx.save();
  for (let k = 0; k < 6; k++) {
    const ph = ((t * 0.16 + hash(k, seed, 1) * 3.1) % 1), py = y - ph * h, drift = Math.sin(t * 0.9 + k * 1.7 + seed) * w * 0.28 * ph, r = w * (0.16 + ph * 0.3) * (0.7 + hash(k, seed, 2) * 0.6);
    const al = a * Math.sin(Math.PI * ph) * 0.9, px = x + (hash(k, seed, 3) - 0.5) * w * 0.5 + drift;
    ctx.fillStyle = rg(ctx, px, py, 0, r, [[0, rgba(color, al)], [1, rgba(color, 0)]]); ctx.beginPath(); ctx.ellipse(px, py, r, r * 1.15, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// ---- wood ---------------------------------------------------------------------------------------------------------------------------------
// A thick wooden board seen from above with a lit edge: rectangle (rounded) or ellipse. Returns nothing; draws grain and a soft cast shadow.
function boardDraw(ctx, x, y, w, h, o = {}) {
  const c = o.c ?? '#b98a55', thick = o.thick ?? Math.max(6, Math.min(w, h) * 0.035), round = o.round ?? false, seed = o.seed ?? 3;
  ctx.save();
  // cast shadow on the table
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = thick * 3.2; ctx.shadowOffsetY = thick * 1.7; ctx.shadowOffsetX = thick * 0.5; ctx.fillStyle = '#000';
  if (round) { ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2 + thick, w / 2, h / 2, 0, 0, TAU); ctx.fill(); } else { rrect(ctx, x, y + thick, w, h, o.r ?? 14); ctx.fill(); }
  ctx.restore();
  // the board's side (thickness), then the top
  const edge = mix(c, '#000', 0.5);
  if (round) { ctx.fillStyle = edge; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2 + thick, w / 2, h / 2, 0, 0, TAU); ctx.fill(); } else { rrect(ctx, x, y + thick, w, h, o.r ?? 14); ctx.fillStyle = edge; ctx.fill(); }
  const top = () => { if (round) { ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, TAU); } else rrect(ctx, x, y, w, h, o.r ?? 14); };
  top(); ctx.fillStyle = lg(ctx, x, y, x + w * 0.7, y + h, [[0, tint(c, 0.16)], [0.55, c], [1, tint(c, -0.2)]]); ctx.fill();
  ctx.save(); top(); ctx.clip();
  // grain: long wavering lines along the board
  const lines = Math.round((o.vertical ? w : h) / 7);
  for (let k = 0; k < lines; k++) {
    const f = (k + hash(k, seed, 1) * 0.6) / lines, dark = hash(k, seed, 2);
    ctx.strokeStyle = rgba(mix(c, '#2a1608', 0.55), (0.1 + dark * 0.14) * (o.grain ?? 1)); ctx.lineWidth = 0.8 + hash(k, seed, 3) * 1.1; ctx.beginPath();
    if (o.vertical) { const px = x + f * w; ctx.moveTo(px, y); for (let s = 1; s <= 8; s++) ctx.lineTo(px + Math.sin(s * 0.9 + k) * 2.2 + (hash(k, s, 4) - 0.5) * 1.4, y + (h * s) / 8); } else { const py = y + f * h; ctx.moveTo(x, py); for (let s = 1; s <= 10; s++) ctx.lineTo(x + (w * s) / 10, py + Math.sin(s * 0.7 + k * 1.3) * 2.2 + (hash(k, s, 4) - 0.5) * 1.4); }
    ctx.stroke();
  }
  if (o.knots !== false) for (let k = 0; k < 2; k++) { const kx = x + w * (0.15 + hash(k, seed, 20) * 0.7), ky = y + h * (0.2 + hash(k, seed, 21) * 0.6); for (let q = 0; q < 3; q++) { ctx.strokeStyle = rgba('#3a1e08', 0.16); ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(kx, ky, 5 + q * 4, 3 + q * 2.4, 0, 0, TAU); ctx.stroke(); } }
  // worn centre, knife scars and a few stains: a board that has been used
  if (o.worn !== false) {
    ctx.fillStyle = rg(ctx, x + w * 0.5, y + h * 0.5, 4, Math.max(w, h) * 0.5, [[0, 'rgba(255,240,205,0.2)'], [1, 'rgba(255,240,205,0)']]); ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(70,40,12,0.22)'; ctx.lineWidth = 0.9;
    for (let k = 0; k < 16; k++) { const sx = x + w * (0.1 + hash(k, seed, 30) * 0.8), sy = y + h * (0.1 + hash(k, seed, 31) * 0.8), a = hash(k, seed, 32) * TAU, l = 8 + hash(k, seed, 33) * 26; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(a) * l, sy + Math.sin(a) * l * 0.5); ctx.stroke(); }
    for (let k = 0; k < 3; k++) { const sx = x + w * (0.15 + hash(k, seed, 34) * 0.7), sy = y + h * (0.15 + hash(k, seed, 35) * 0.7); ctx.fillStyle = rg(ctx, sx, sy, 1, 20 + hash(k, seed, 36) * 24, [[0, 'rgba(90,50,12,0.12)'], [1, 'rgba(90,50,12,0)']]); ctx.beginPath(); ctx.ellipse(sx, sy, 34, 22, hash(k, seed, 37) * 3, 0, TAU); ctx.fill(); }
    const eg = ctx.createLinearGradient(x, y, x, y + h); eg.addColorStop(0, 'rgba(255,240,205,0.12)'); eg.addColorStop(0.12, 'rgba(255,240,205,0)'); eg.addColorStop(0.9, 'rgba(0,0,0,0)'); eg.addColorStop(1, 'rgba(40,20,4,0.22)'); ctx.fillStyle = eg; ctx.fillRect(x, y, w, h);
  }
  // lit rim and glare
  ctx.restore();
  top(); ctx.strokeStyle = 'rgba(255,240,210,0.28)'; ctx.lineWidth = 1.5; ctx.stroke();
  top(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
}

export function board(ctx, x, y, w, h, o = {}) {
  const thick = o.thick ?? Math.max(6, Math.min(w, h) * 0.035), pad = Math.ceil(thick * 6) + 4;
  const key = `board|${Math.round(w)}|${Math.round(h)}|${o.c}|${o.round}|${o.seed}|${o.vertical}|${o.knots}|${o.worn}|${o.r}|${Math.round(thick)}|${o.grain}`;
  const b = bake(ctx, key, w + pad * 2, h + pad * 2 + thick, (c2) => { boardDraw(c2, pad, pad, w, h, o); });
  if (b) ctx.drawImage(b.canvas, x - pad, y - pad, w + pad * 2, h + pad * 2 + thick);
  else boardDraw(ctx, x, y, w, h, o);
}

// A rolling pin lying at (cx, cy), length len, angle ang. kind 'dowel' (thin straight pin) or 'handled' (turned handles).
export function pin(ctx, cx, cy, len, ang, th, o = {}) {
  const c = o.c ?? '#c89a5a';
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = th * 0.9; ctx.shadowOffsetY = th * 0.55; ctx.shadowOffsetX = th * 0.25;
  const body = (x0, x1, hh) => { rrect(ctx, x0, -hh / 2, x1 - x0, hh, hh * 0.5); ctx.fillStyle = lg(ctx, 0, -hh / 2, 0, hh / 2, [[0, tint(c, 0.38)], [0.3, tint(c, 0.1)], [0.62, c], [1, tint(c, -0.5)]]); ctx.fill(); };
  if (o.kind === 'handled') { body(-len * 0.31, len * 0.31, th * 1.5); body(-len * 0.5, -len * 0.3, th * 0.7); body(len * 0.3, len * 0.5, th * 0.7); } else body(-len / 2, len / 2, th);
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = Math.max(1, th * 0.08); ctx.beginPath(); ctx.moveTo(-len * 0.4, -th * 0.22); ctx.lineTo(len * 0.4, -th * 0.22); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-len * 0.3, th * 0.02, len * 0.6, Math.max(1, th * 0.05));   // flour on the pin
  ctx.restore();
}

// ---- the hand ---------------------------------------------------------------------------------------------------------------------------
// A tapered limb along a centreline (local units), full widths ws. Returns the outline sampled so callers can add detail.
const sample = (pts, ws, n = 10) => {
  // Catmull-Rom through the points, widths interpolated; returns [{x, y, w, nx, ny}]
  const out = [], P = (i) => pts[clamp(i, 0, pts.length - 1)];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let s = 0; s < n; s++) {
      const t = s / n, t2 = t * t, t3 = t2 * t;
      const x = 0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
      const y = 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
      out.push({ x, y, w: ws[i] + (ws[i + 1] - ws[i]) * t });
    }
  }
  const last = pts[pts.length - 1]; out.push({ x: last[0], y: last[1], w: ws[ws.length - 1] });
  for (let i = 0; i < out.length; i++) { const a = out[Math.max(0, i - 1)], b = out[Math.min(out.length - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1; out[i].nx = -dy / l; out[i].ny = dx / l; out[i].tx = dx / l; out[i].ty = dy / l; }
  return out;
};
const limbPath = (ctx, sm) => {
  const s0 = sm[0], e = sm[sm.length - 1];
  ctx.beginPath();
  ctx.moveTo(s0.x + s0.nx * s0.w / 2, s0.y + s0.ny * s0.w / 2);
  for (const p of sm) ctx.lineTo(p.x + p.nx * p.w / 2, p.y + p.ny * p.w / 2);
  const ae = Math.atan2(e.ny, e.nx); ctx.arc(e.x, e.y, e.w / 2, ae, ae - Math.PI, true);
  for (let i = sm.length - 1; i >= 0; i--) { const p = sm[i]; ctx.lineTo(p.x - p.nx * p.w / 2, p.y - p.ny * p.w / 2); }
  ctx.closePath();
};
function limb(ctx, sm, skin, L, o = {}) {
  limbPath(ctx, sm);
  const mid = sm[sm.length >> 1], w = mid.w;
  let nx = mid.nx, ny = mid.ny; if (nx * L[0] + ny * L[1] < 0) { nx = -nx; ny = -ny; }
  ctx.fillStyle = lg(ctx, mid.x + nx * w * 0.62, mid.y + ny * w * 0.62, mid.x - nx * w * 0.62, mid.y - ny * w * 0.62, [[0, tint(skin, 0.1)], [0.2, tint(skin, 0.2)], [0.5, skin], [0.82, tint(skin, -0.2)], [1, tint(skin, -0.42)]]);
  ctx.fill();
  if (o.stroke !== false) { limbPath(ctx, sm); ctx.strokeStyle = rgba(mix(skin, '#3a1608', 0.7), 0.5); ctx.lineWidth = 1; ctx.stroke(); }
}
const nailAt = (ctx, p, ang, w, h, skin, L) => {
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang);
  ctx.fillStyle = lg(ctx, 0, -h / 2, 0, h / 2, [[0, mix('#f6d6cc', skin, 0.15)], [1, mix('#d89c92', skin, 0.35)]]); rrect(ctx, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.45); ctx.fill();
  ctx.strokeStyle = rgba(mix(skin, '#3a1608', 0.6), 0.5); ctx.lineWidth = 0.9; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(-w * 0.1 + L[0] * 0, -h * 0.18, w * 0.28, h * 0.12, 0, 0, TAU); ctx.fill();
  ctx.restore();
};

// drawHand(ctx, x, y, { rot, k, skin, sleeve, pose, open })
//   (x, y) is the point the fingertips touch; rot is the direction FROM the tip TOWARD the wrist, k the size in px per local unit
//   (a finger is about 20 units wide). pose: 'pinch' (thumb and index close on a pinch of dough), 'press' (the thumb pad presses),
//   'drag' (index finger drags). open 0..1 opens the pinch (the gap between the tips).
// Soft shading: every part is filled in its shadow colour, then its own shape shifted toward the light is laid over it in the lit colour with a feathered edge,
// so each finger reads as a rounded volume lit from the upper left. Nails, a blush at the tips, a few creases and flour finish it.
const FINGER_W = [16.5, 19.5, 21, 19.8, 23.5, 23, 26];
const smooth = (pts, closed = false, n = 8) => {   // Catmull-Rom through pts, as a list of points
  const out = [], m = pts.length, P = (i) => (closed ? pts[((i % m) + m) % m] : pts[clamp(i, 0, m - 1)]);
  for (let i = 0; i < (closed ? m : m - 1); i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2); for (let s = 0; s < n; s++) { const t = s / n, t2 = t * t, t3 = t2 * t; out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } }
  if (!closed) out.push(pts[m - 1]);
  return out;
};
const polyPath = (ctx, pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };
function softPart(ctx, path, skin, L, depth, o = {}) {
  const dark = mix(skin, '#8a3a24', 0.5), lit = tint(skin, o.lift ?? 0.07);
  ctx.save(); path(); ctx.fillStyle = tint(dark, -0.08); ctx.fill();
  ctx.save(); path(); ctx.clip();
  ctx.translate(L[0] * depth, L[1] * depth); ctx.shadowColor = lit; ctx.shadowBlur = depth * (o.feather ?? 1.4); path(); ctx.fillStyle = lit; ctx.fill();
  ctx.restore();
  // a small bright core on the lit side, for form
  ctx.save(); path(); ctx.clip(); ctx.translate(L[0] * depth * 1.6, L[1] * depth * 1.6); ctx.shadowColor = tint(skin, 0.22); ctx.shadowBlur = depth * 2.2; ctx.globalAlpha = 0.45; path(); ctx.fillStyle = tint(skin, 0.2); ctx.fill(); ctx.restore();
  if (o.stroke !== false) { path(); ctx.strokeStyle = rgba(mix(skin, '#3a1608', 0.75), 0.42); ctx.lineWidth = 0.9; ctx.stroke(); }
  ctx.restore();
}
export function drawHand(ctx, x, y, o = {}) {
  const rot = o.rot ?? 0.7, k = o.k ?? 1.2, skin = o.skin ?? SKIN.warm, sleeve = o.sleeve ?? '#efe9dc', pose = o.pose ?? 'pinch', open = clamp(o.open ?? 0, 0, 1);
  const lx = -0.6, ly = -0.8, c = Math.cos(-rot), s = Math.sin(-rot), L = [lx * c - ly * s, lx * s + ly * c];   // toward the light (upper left on screen), in the local frame
  const gap = open * 16, wx = 200;
  let thumb, index;
  if (pose === 'press') {
    thumb = sample([[0, 6], [16, 10], [38, 20], [62, 34], [88, 50], [124, 68]], [22, 26, 28, 30, 32, 35]);
    index = sample([[50, -40], [70, -38], [92, -36], [116, -34]], [19, 21, 23, 25]);
  } else if (pose === 'drag') {
    thumb = sample([[40, 30], [62, 34], [88, 46], [124, 66]], [23, 27, 30, 34]);
    index = sample([[0, -1], [16, -3], [36, -5], [54, -9], [76, -15], [98, -22], [126, -30]], FINGER_W);
  } else {
    thumb = sample([[1, 11 + gap], [14, 15 + gap * 0.9], [32, 22 + gap * 0.6], [52, 33 + gap * 0.3], [74, 47], [100, 62], [132, 74]], [19, 23, 26, 25, 29, 32, 36]);
    index = sample([[0.5, -6 - gap * 0.3], [14, -8 - gap * 0.4], [34, -12 - gap * 0.3], [52, -16 - gap * 0.2], [72, -21], [94, -27], [122, -34]], FINGER_W);
  }
  const curled = pose === 'press' ? [] : [[110, -98, 21, 50], [108, -78, 24, 58], [110, -57, 25, 64]];
  const backPts = smooth([[90, -46], [124, -58], [162, -54], [200, -42], [212, 0], [200, 50], [168, 68], [132, 82], [102, 80], [90, 52], [84, 0]], true, 6);
  const armPath = () => { ctx.beginPath(); ctx.moveTo(wx - 20, -42); ctx.bezierCurveTo(wx + 60, -40, wx + 140, -48, 700, -58); ctx.lineTo(700, 62); ctx.bezierCurveTo(wx + 140, 56, wx + 60, 50, wx - 20, 56); ctx.closePath(); };
  const capsule = (cx0, cy0, len, w, ang = 0) => () => { ctx.beginPath(); ctx.save(); ctx.translate(cx0, cy0); ctx.rotate(ang); rrect(ctx, -len, -w / 2, len + 8, w, w / 2); ctx.restore(); };
  const pass = (shadow) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
    if (shadow) { armPath(); ctx.fill(); polyPath(ctx, backPts); ctx.fill(); for (const [px, py, pw, pl] of curled) { rrect(ctx, px - pl, py - pw / 2, pl + 8, pw, pw / 2); ctx.fill(); } limbPath(ctx, thumb); ctx.fill(); limbPath(ctx, index); ctx.fill(); ctx.restore(); return; }
    softPart(ctx, armPath, skin, L, 14, { stroke: false, feather: 2.4 });
    // sleeve: a cuff with folds
    const cx0 = 300; const sl = () => { ctx.beginPath(); ctx.moveTo(cx0, -62); ctx.bezierCurveTo(cx0 + 14, -22, cx0 + 14, 24, cx0 - 4, 68); ctx.lineTo(700, 74); ctx.lineTo(700, -70); ctx.closePath(); };
    softPart(ctx, sl, sleeve, L, 12, { stroke: true, feather: 2, lift: 0.04 });
    ctx.strokeStyle = rgba(mix(sleeve, '#000', 0.4), 0.2); ctx.lineWidth = 1; for (let q = 0; q < 7; q++) { ctx.beginPath(); ctx.moveTo(cx0 + 22 + q * 26, -66); ctx.quadraticCurveTo(cx0 + 34 + q * 26, 0, cx0 + 20 + q * 26, 70); ctx.stroke(); }
    softPart(ctx, () => polyPath(ctx, backPts), skin, L, 13, { feather: 2.4 });
    // tendons and knuckles on the back of the hand
    ctx.strokeStyle = 'rgba(120,64,36,0.22)'; ctx.lineWidth = 1.4; ctx.lineCap = 'round'; for (const ty of [-30, -10, 12]) { ctx.beginPath(); ctx.moveTo(118, ty); ctx.quadraticCurveTo(156, ty + 4, 190, ty * 0.5); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,240,225,0.2)'; for (const ky of [-36, -14, 8]) { ctx.beginPath(); ctx.ellipse(108, ky, 8, 7, 0, 0, TAU); ctx.fill(); }
    for (const [px, py, pw, pl] of curled) softPart(ctx, capsule(px, py, pl, pw), skin, L, 8, { feather: 1.7 });
    ctx.strokeStyle = 'rgba(100,50,26,0.3)'; ctx.lineWidth = 1; for (const [px, py, pw, pl] of curled) { ctx.beginPath(); ctx.moveTo(px - pl * 0.5, py - pw * 0.38); ctx.quadraticCurveTo(px - pl * 0.44, py, px - pl * 0.5, py + pw * 0.38); ctx.stroke(); }
    // thumb rises from a thenar bulge, the index finger lies over the knuckle
    softPart(ctx, () => { ctx.beginPath(); ctx.ellipse(146, 52, 48, 32, -0.55, 0, TAU); }, skin, L, 10, { stroke: false, feather: 2.2 });
    softPart(ctx, () => limbPath(ctx, thumb), skin, L, 9, { feather: 1.7 });
    softPart(ctx, () => limbPath(ctx, index), skin, L, 8, { feather: 1.7 });
    // warm blush at the tips, creases on the joints, nails
    const blush = (sm, f0, f1) => { const a = sm[Math.floor(sm.length * f0)], b = sm[Math.floor(sm.length * f1)]; ctx.fillStyle = 'rgba(224,120,100,0.22)'; ctx.beginPath(); ctx.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, Math.hypot(b.x - a.x, b.y - a.y) / 2 + a.w * 0.3, a.w * 0.48, Math.atan2(b.y - a.y, b.x - a.x), 0, TAU); ctx.fill(); };
    blush(index, 0, 0.14); blush(thumb, 0, 0.14);
    const crease = (sm, f) => { const p = sm[Math.min(sm.length - 1, Math.floor(sm.length * f))]; ctx.strokeStyle = 'rgba(100,50,24,0.26)'; ctx.lineWidth = 0.9; for (let q = -1; q <= 1; q++) { const o2 = q * 2.8; ctx.beginPath(); ctx.moveTo(p.x + p.nx * p.w * 0.38 + p.tx * o2, p.y + p.ny * p.w * 0.38 + p.ty * o2); ctx.quadraticCurveTo(p.x + p.tx * (o2 + 1.4), p.y + p.ty * (o2 + 1.4), p.x - p.nx * p.w * 0.38 + p.tx * o2, p.y - p.ny * p.w * 0.38 + p.ty * o2); ctx.stroke(); } };
    if (pose !== 'press') { crease(index, 0.34); crease(index, 0.62); crease(index, 0.9); }
    crease(thumb, 0.55);
    const ix = index[Math.floor(index.length * 0.1)], tx = thumb[1];
    if (pose !== 'press') nailAt(ctx, { x: ix.x + 7.5, y: ix.y }, Math.atan2(ix.ty, ix.tx), 15, 12.5, skin, L);
    nailAt(ctx, pose === 'press' ? { x: thumb[1].x + 9, y: thumb[1].y - 2 } : { x: tx.x + 6, y: tx.y + 3 }, Math.atan2(tx.ty, tx.tx) + (pose === 'press' ? 0 : 0.5), pose === 'press' ? 16 : 9, pose === 'press' ? 13 : 7, skin, L);
    // flour on the fingertips and the back of the hand
    ctx.fillStyle = 'rgba(255,252,244,0.65)'; ctx.beginPath(); for (let q = 0; q < 16; q++) ctx.rect(-1 + hash(q, 7, 1) * 22, -9 + hash(q, 7, 2) * 24, 1.5, 1.3); ctx.fill();
    ctx.fillStyle = 'rgba(255,250,240,0.4)'; ctx.beginPath(); for (let q = 0; q < 24; q++) ctx.rect(98 + hash(q, 5, 1) * 100, -44 + hash(q, 5, 2) * 110, 1.6, 1.4); ctx.fill();
    ctx.restore();
  };
  // soft shadow of the whole hand on the work surface (silhouette drawn off-screen, only its shadow lands on screen), then the hand
  const OFF = 4000;
  ctx.save(); ctx.translate(-OFF, 0); ctx.shadowColor = 'rgba(30,14,0,0.24)'; ctx.shadowBlur = 20 * k; ctx.shadowOffsetX = OFF + 6 * k; ctx.shadowOffsetY = 10 * k; ctx.fillStyle = '#000'; pass(true); ctx.restore();
  pass(false);
}

// An expanding ring where something just happened (a pleat set, a cut made, a knock): drawn in the current coordinates, fades in half a second.
export function drawPulses(ctx, pulses, now, scale = 1) {
  for (let i = pulses.length - 1; i >= 0; i--) {
    const p = pulses[i], age = now - p.t; if (age > 0.55) { pulses.splice(i, 1); continue; } if (age < 0) continue;
    const u = age / 0.55, r = (0.012 + u * 0.085) * scale;
    ctx.save(); ctx.strokeStyle = rgba(p.col ?? '#fffaf0', 0.7 * (1 - u) * (1 - u)); ctx.lineWidth = 0.006 * scale * (1 - u * 0.6); ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke(); ctx.restore();
  }
}

// ---- dough surface touches -----------------------------------------------------------------------------------------------------------------
// A pressed dimple (finger impression) at (x, y): a darker rim lit on the far side and a lit inner edge.
export function dimple(ctx, x, y, r, a = 1) {
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = rg(ctx, x, y, r * 0.1, r, [[0, 'rgba(90,60,20,0.28)'], [0.7, 'rgba(90,60,20,0.14)'], [1, 'rgba(90,60,20,0)']], x + r * 0.15, y + r * 0.2); ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.9, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.38)'; ctx.lineWidth = Math.max(1, r * 0.1); ctx.beginPath(); ctx.arc(x, y, r * 0.88, 0.2, 1.7); ctx.stroke();
  ctx.restore();
}

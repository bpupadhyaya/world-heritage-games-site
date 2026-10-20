// Side-view drum drawing kit (1.20.0): upright and lying shells seen from slightly above, so every head is a flattened ellipse. Shared by the
// stages in stage-drums3.js (bongo, timbales, naqareh, conga, surdo, riq, udu, ...). Plain canvas 2D, deterministic, no clocks.
// Heads are drawn through the old skinHead/hoop helpers in a squashed local space, so the shading and the shiver rings stay the same.
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU, skinHead, hoop, dropShadow } from './drum-kit.js';

const PI = Math.PI;
export { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU, skinHead, hoop, dropShadow };

// a flat soft shadow on the floor
export function floorShadow(ctx, x, y, rx, ry, a = 0.45) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
  ctx.fillStyle = rgrad(ctx, 0, 0, 0, rx, [[0, `rgba(0,0,0,${a})`], [0.6, `rgba(0,0,0,${a * 0.5})`], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(-rx, -rx, 2 * rx, 2 * rx);
  ctx.restore();
}

// chrome / steel gradient across a width
export const chromeH = (ctx, x0, x1, c = '#c9ced6') => hgrad(ctx, x0, x1, [[0, darker(c, 0.62)], [0.18, lighter(c, 0.7)], [0.4, c], [0.66, darker(c, 0.4)], [0.86, lighter(c, 0.35)], [1, darker(c, 0.68)]]);

// a metal tube along a path: soft shadow, dark rim, body, bright core line. pathFn(ctx) only adds segments (it begins the path itself)
export function tube(ctx, pathFn, w, c = '#c9ced6', shadowOff = 7) {
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.34)'; ctx.lineWidth = w + 3; ctx.save(); ctx.translate(shadowOff * 0.5, shadowOff); pathFn(ctx); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = darker(c, 0.6); ctx.lineWidth = w; pathFn(ctx); ctx.stroke();
  ctx.strokeStyle = c; ctx.lineWidth = w * 0.72; pathFn(ctx); ctx.stroke();
  ctx.strokeStyle = lighter(c, 0.8); ctx.lineWidth = Math.max(1.2, w * 0.2); ctx.save(); ctx.translate(-w * 0.14, -w * 0.14); pathFn(ctx); ctx.stroke(); ctx.restore();
  ctx.restore();
}

// a tapered upright shell: top ellipse centre (cx, yTop) radius rTop, bottom radius rBot at yBot, ry = r * ryk. o: { col, staves, seed, gloss, stripe }
// The top ellipse is left for the head/rim to cover.
export function taperBody(ctx, cx, yTop, rTop, yBot, rBot, ryk, o = {}) {
  const { col = '#b5602a', staves = 0, seed = 3, gloss = 0.5, dark = 1, grainA = 0.35 } = o;
  const path = () => { ctx.beginPath(); ctx.moveTo(cx - rTop, yTop); ctx.lineTo(cx - rBot, yBot); ctx.ellipse(cx, yBot, rBot, rBot * ryk, 0, PI, 0, true); ctx.lineTo(cx + rTop, yTop); ctx.closePath(); };
  ctx.save(); path();
  if (o.metal) {   // polished metal: bright core bands, a dark reflected horizon across the middle, bead rings
    ctx.fillStyle = chromeH(ctx, cx - rTop, cx + rTop, col); ctx.fill(); ctx.save(); ctx.clip();
    const H0 = yBot - yTop; ctx.fillStyle = vgrad(ctx, yTop, yBot + rBot * ryk, [[0, 'rgba(255,255,255,0.18)'], [0.34, 'rgba(255,255,255,0.05)'], [0.46, 'rgba(10,14,28,0.46)'], [0.6, 'rgba(10,14,28,0.34)'], [0.78, 'rgba(255,255,255,0.1)'], [1, 'rgba(0,0,0,0.4)']]); ctx.fillRect(cx - rTop - 4, yTop, 2 * rTop + 8, H0 + rBot + 4);
    for (const f of (o.beads ?? [0.26, 0.74])) { const yy = yTop + H0 * f, rr = rTop + (rBot - rTop) * f; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, yy + 2, rr, rr * ryk, 0, 0, PI); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(cx, yy - 1, rr, rr * ryk, 0, 0.1, PI - 0.1); ctx.stroke(); }
    ctx.restore(); ctx.restore(); ctx.save(); path(); ctx.strokeStyle = rgba(darker(col, 0.85), 0.7); ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); return;
  }
  ctx.fillStyle = hgrad(ctx, cx - rTop, cx + rTop, [[0, darker(col, 0.66 * dark)], [0.1, darker(col, 0.34 * dark)], [0.28, lighter(col, 0.34 * gloss + 0.05)], [0.4, lighter(col, 0.12 * gloss)], [0.62, col], [0.86, darker(col, 0.46 * dark)], [1, darker(col, 0.72 * dark)]]); ctx.fill();
  ctx.clip(); path(); ctx.clip();
  const H = yBot - yTop, W = Math.max(rTop, rBot) * 2;
  grain(ctx, cx - W / 2, yTop, W, H + rBot * ryk, darker(col, 0.72), grainA, seed, true, 26);
  if (staves) {
    for (let k = 1; k < staves; k++) {
      const f = (k / staves) * 2 - 1, xa = cx + f * rTop * 0.97, xb = cx + f * rBot * 0.97;
      const cosA = Math.sqrt(Math.max(0, 1 - f * f)); if (cosA < 0.16) continue;
      ctx.strokeStyle = rgba(darker(col, 0.8), 0.5 * cosA); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(xa, yTop); ctx.lineTo(xb, yBot + rBot * ryk * Math.sqrt(Math.max(0, 1 - f * f))); ctx.stroke();
      ctx.strokeStyle = rgba(lighter(col, 0.6), 0.16 * cosA); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xa + 2, yTop); ctx.lineTo(xb + 2, yBot + rBot * ryk * cosA); ctx.stroke();
    }
  }
  // lacquer streak and the shade just under the rim
  ctx.fillStyle = hgrad(ctx, cx - rTop, cx + rTop, [[0.22, 'rgba(255,255,255,0)'], [0.31, `rgba(255,250,230,${0.34 * gloss})`], [0.38, 'rgba(255,255,255,0)']]); ctx.fillRect(cx - W, yTop, 2 * W, H + rBot);
  ctx.fillStyle = vgrad(ctx, yTop, yTop + H * 0.22, [[0, 'rgba(0,0,0,0.42)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(cx - W, yTop, 2 * W, H * 0.22);
  ctx.fillStyle = vgrad(ctx, yBot - H * 0.2, yBot + rBot * ryk, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.38)']]); ctx.fillRect(cx - W, yBot - H * 0.2, 2 * W, H * 0.2 + rBot * ryk + 2);
  ctx.restore();
  ctx.save(); path(); ctx.strokeStyle = rgba(darker(col, 0.85), 0.7); ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
}

// the top of a drum: a metal rim with a visible band, then the skin as a flattened ellipse. o: { rim, band, tint, edge, seed, wear, paste, w (hoop width), lugs, rimKind }
export function headSide(ctx, cx, cy, rx, ryk, o = {}, vib = 0) {
  const w = o.w ?? Math.max(8, rx * 0.1), band = o.band ?? Math.max(10, rx * 0.12), rim = o.rim ?? '#c9ced6', R = rx + w;
  // the band of the rim seen from the side
  ctx.save();
  ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx - R, cy + band); ctx.ellipse(cx, cy + band, R, R * ryk, 0, PI, 0, true); ctx.lineTo(cx + R, cy); ctx.closePath();
  ctx.fillStyle = o.rimKind === 'wood' ? hgrad(ctx, cx - R, cx + R, [[0, darker(rim, 0.6)], [0.3, lighter(rim, 0.25)], [0.6, rim], [1, darker(rim, 0.6)]]) : chromeH(ctx, cx - R, cx + R, rim); ctx.fill();
  ctx.strokeStyle = rgba(darker(rim, 0.8), 0.6); ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.translate(cx, cy); ctx.scale(1, ryk);
  hoop(ctx, rx, rx, w, { kind: o.rimKind === 'wood' ? 'wood' : 'metal', col: rim });
  ctx.fillStyle = 'rgba(0,0,0,0.32)'; ell(ctx, 0, 0, rx + 2, rx + 2); ctx.fill();
  skinHead(ctx, rx, rx, { tint: o.tint, edge: o.edge, seed: o.seed ?? 4, vib, wear: o.wear ?? 0.7, paste: o.paste });
  ctx.restore();
  // rim shine on the near edge
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy + band * 0.5, R - 2, (R - 2) * ryk, 0, PI * 0.15, PI * 0.85); ctx.stroke(); ctx.restore();
  // tension lugs: bolt heads in brackets standing off the rim band
  if (o.lugs) {
    for (let k = 0; k < o.lugs; k++) {
      const a = PI * (0.08 + 0.84 * (o.lugs > 1 ? k / (o.lugs - 1) : 0.5)), x = cx + Math.cos(a) * (R + 2), y = cy + band * 0.5 + Math.sin(a) * (R + 2) * ryk, s = Math.max(4, rx * 0.04), len = o.lugLen ?? band * 1.9;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, x - s * 0.5 + 2, y + 2, s * 1.3, len, s * 0.5); ctx.fill();
      ctx.fillStyle = chromeH(ctx, x - s, x + s, o.lugCol ?? '#d9dde4'); rrect(ctx, x - s * 0.6, y - s * 0.4, s * 1.2, len, s * 0.5); ctx.fill();
      ctx.fillStyle = rgrad(ctx, x - s * 0.3, y - s * 0.5, 0, s * 1.5, [[0, '#ffffff'], [0.5, o.lugCol ?? '#d9dde4'], [1, darker(o.lugCol ?? '#d9dde4', 0.6)]]); circ(ctx, x, y, s); ctx.fill();
      ctx.strokeStyle = 'rgba(40,40,50,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - s * 0.5, y); ctx.lineTo(x + s * 0.5, y); ctx.stroke();
    }
  }
}

// a rubber foot / cap
export function foot(ctx, x, y, r = 9) {
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ell(ctx, x + 2, y + 3, r * 1.2, r * 0.5); ctx.fill();
  ctx.fillStyle = hgrad(ctx, x - r, x + r, [[0, '#141414'], [0.35, '#4a4a4e'], [1, '#101010']]); rrect(ctx, x - r, y - r * 0.9, 2 * r, r * 1.4, r * 0.5); ctx.fill();
}

// a bolt head
export function bolt(ctx, x, y, r, c = '#d9dde4') {
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; circ(ctx, x + r * 0.25, y + r * 0.4, r); ctx.fill();
  ctx.fillStyle = rgrad(ctx, x - r * 0.3, y - r * 0.35, 0, r * 1.4, [[0, '#ffffff'], [0.45, c], [1, darker(c, 0.62)]]); circ(ctx, x, y, r); ctx.fill();
}

// the shiver of a struck head in screen-space design coords (called by stages with their own head ellipse)
export function shiver(ctx, cx, cy, rx, ry, vib, col = '255,248,226') {
  if (vib <= 0.03) return;
  for (let k = 0; k < 3; k++) { const p = clamp((1 - vib) * 1.4 - k * 0.2, 0, 1); if (p <= 0) continue; ctx.strokeStyle = `rgba(${col},${0.5 * (1 - p) * vib})`; ctx.lineWidth = 3; ell(ctx, cx, cy, rx * (0.2 + 0.8 * p), ry * (0.2 + 0.8 * p)); ctx.stroke(); }
}

// ---- backdrop helpers (screen space) -----------------------------------------------------------------------------------------------
// irregular blob polygon (peeling plaster, patches): centre, radius, points, roughness
export function blob(ctx, cx, cy, r, seed, n = 14, rough = 0.45) {
  ctx.beginPath();
  for (let k = 0; k <= n; k++) { const a = (k / n) * TAU, rr = r * (1 - rough * 0.5 + rough * hash(seed + (k % n) * 3.7)); const x = cx + Math.cos(a) * rr * 1.25, y = cy + Math.sin(a) * rr * 0.8; if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
  ctx.closePath();
}
export function speckle(ctx, x, y, w, h, n, col, a, seed, r0 = 0.6, r1 = 1.6) {
  for (let k = 0; k < n; k++) { ctx.fillStyle = rgba(col, a * (0.3 + 0.7 * hash(seed + k * 5))); circ(ctx, x + hash(seed + k * 2.1) * w, y + hash(seed + k * 3.3 + 1) * h, r0 + (r1 - r0) * hash(seed + k)); ctx.fill(); }
}
// a soft hanging bulb with a warm glow
export function bulb(ctx, x, y, r, col = '#ffd890') {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rgrad(ctx, x, y, 0, r * 5, [[0, rgba(col, 0.55)], [0.3, rgba(col, 0.16)], [1, rgba(col, 0)]]); ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10); ctx.restore();
  ctx.fillStyle = rgrad(ctx, x - r * 0.3, y - r * 0.3, 0, r * 1.2, [[0, '#ffffff'], [0.5, col], [1, darker(col, 0.3)]]); circ(ctx, x, y, r); ctx.fill();
}

// a barrel-shaped upright shell (conga): top radius rTop, widest rMid about 40% down, rBot at the foot. Left and right sides are quadratic curves.
export function barrelBody(ctx, cx, yTop, yBot, rTop, rMid, rBot, ryk, o = {}) {
  const { col = '#8f2a22', staves = 0, seed = 3, gloss = 0.8, grainA = 0.3 } = o, H = yBot - yTop, cy = yTop + H * 0.46;
  const side = (s) => [cx + s * rMid * 1.0, cy];   // control points of the sides
  const path = () => { ctx.beginPath(); ctx.moveTo(cx - rTop, yTop); ctx.quadraticCurveTo(cx - rMid * 1.12, cy, cx - rBot, yBot); ctx.ellipse(cx, yBot, rBot, rBot * ryk, 0, PI, 0, true); ctx.quadraticCurveTo(cx + rMid * 1.12, cy, cx + rTop, yTop); ctx.closePath(); };
  void side;
  ctx.save(); path();
  ctx.fillStyle = hgrad(ctx, cx - rMid, cx + rMid, [[0, darker(col, 0.7)], [0.1, darker(col, 0.36)], [0.27, lighter(col, 0.38 * gloss + 0.04)], [0.38, lighter(col, 0.12 * gloss)], [0.62, col], [0.86, darker(col, 0.5)], [1, darker(col, 0.76)]]); ctx.fill();
  ctx.save(); ctx.clip();
  grain(ctx, cx - rMid, yTop, rMid * 2, H + rBot * ryk, darker(col, 0.74), grainA, seed, true, 30);
  if (staves) for (let k = 1; k < staves; k++) {
    const f = (k / staves) * 2 - 1, cosA = Math.sqrt(Math.max(0, 1 - f * f)); if (cosA < 0.16) continue;
    ctx.strokeStyle = rgba(darker(col, 0.8), 0.5 * cosA); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx + f * rTop * 0.97, yTop); ctx.quadraticCurveTo(cx + f * rMid * 1.12, cy, cx + f * rBot * 0.97, yBot + rBot * ryk * cosA); ctx.stroke();
    ctx.strokeStyle = rgba(lighter(col, 0.6), 0.14 * cosA); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx + f * rTop * 0.97 + 2, yTop); ctx.quadraticCurveTo(cx + f * rMid * 1.12 + 2, cy, cx + f * rBot * 0.97 + 2, yBot + rBot * ryk * cosA); ctx.stroke();
  }
  ctx.fillStyle = hgrad(ctx, cx - rMid, cx + rMid, [[0.2, 'rgba(255,255,255,0)'], [0.29, `rgba(255,248,226,${0.38 * gloss})`], [0.37, 'rgba(255,255,255,0)']]); ctx.fillRect(cx - rMid * 2, yTop, rMid * 4, H + rBot);
  ctx.fillStyle = vgrad(ctx, yTop, yTop + H * 0.18, [[0, 'rgba(0,0,0,0.45)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(cx - rMid * 2, yTop, rMid * 4, H * 0.18);
  ctx.fillStyle = vgrad(ctx, yBot - H * 0.14, yBot + rBot * ryk, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.42)']]); ctx.fillRect(cx - rMid * 2, yBot - H * 0.14, rMid * 4, H * 0.14 + rBot * ryk + 2);
  ctx.restore(); ctx.restore();
  ctx.save(); path(); ctx.strokeStyle = rgba(darker(col, 0.85), 0.7); ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  return { cy, rAt: (t) => { const u = 1 - t; return rTop * u * u + 2 * rMid * 1.12 * u * t * 0.5 + rBot * t * t + (rMid * 1.12 - (rTop + rBot) / 2) * 2 * u * t * 0.5; } };
}

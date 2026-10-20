// Room backdrops for the 1.21.0 stages (screen space, drawn once into a cached layer by `staticLayer`): a wall with a floor under it, a light pool and a
// vignette. Each stage picks a wall kind, a floor kind, colours and an optional ornament callback, so a bucket of look-alike instruments still differs in
// its room. Plain canvas 2D, deterministic.
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU } from './drum-kit.js';
import { pool, vignette } from './set.js';

export const WALLS = {
  // painted plaster with soft patches
  plaster(ctx, A, b, o) {
    ctx.fillStyle = vgrad(ctx, A.y, b, [[0, darker(o.c1, 0.25)], [0.6, o.c1], [1, o.c2 ?? lighter(o.c1, 0.12)]]); ctx.fillRect(A.x, A.y, A.w, b - A.y);
    for (let k = 0; k < 16; k++) { const x = A.x + A.w * hash(k * 3 + 1 + (o.seed ?? 0)), y = A.y + (b - A.y) * hash(k * 5 + 2), r = A.w * (0.06 + 0.1 * hash(k + 9)); ctx.fillStyle = rgrad(ctx, x, y, 0, r, [[0, rgba(hash(k) > 0.5 ? lighter(o.c1, 0.3) : darker(o.c1, 0.4), 0.14)], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
    for (let k = 0; k < 220; k++) { ctx.fillStyle = `rgba(0,0,0,${0.1 * hash(k + 4)})`; circ(ctx, A.x + hash(k * 2.1) * A.w, A.y + hash(k * 3.3 + 1) * (b - A.y), 0.6 + 1.2 * hash(k)); ctx.fill(); }
  },
  // tall lacquered panels split by gilt rails
  panel(ctx, A, b, o) {
    const n = Math.max(3, Math.round(A.w / (o.pw ?? 150))), pw = A.w / n;
    for (let k = 0; k < n; k++) {
      const x = A.x + k * pw; ctx.fillStyle = vgrad(ctx, A.y, b, [[0, darker(o.c1, 0.3)], [0.5, o.c1], [1, darker(o.c1, 0.2)]]); ctx.fillRect(x, A.y, pw, b - A.y);
      ctx.fillStyle = hgrad(ctx, x, x + pw, [[0, 'rgba(0,0,0,0.3)'], [0.12, 'rgba(255,255,255,0.05)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.3)']]); ctx.fillRect(x, A.y, pw, b - A.y);
      ctx.strokeStyle = rgba(o.accent ?? '#e8c260', 0.55); ctx.lineWidth = 2; ctx.strokeRect(x + pw * 0.14, A.y + (b - A.y) * 0.14, pw * 0.72, (b - A.y) * 0.72);
      ctx.strokeStyle = rgba(o.accent ?? '#e8c260', 0.28); ctx.lineWidth = 1; ctx.strokeRect(x + pw * 0.18, A.y + (b - A.y) * 0.18, pw * 0.64, (b - A.y) * 0.64);
      if (o.motif !== false) { ctx.fillStyle = rgba(o.accent ?? '#e8c260', 0.3); circ(ctx, x + pw / 2, A.y + (b - A.y) * 0.5, pw * 0.13); ctx.fill(); ctx.strokeStyle = rgba(o.accent ?? '#e8c260', 0.4); ctx.lineWidth = 1.6; circ(ctx, x + pw / 2, A.y + (b - A.y) * 0.5, pw * 0.2); ctx.stroke(); }
    }
  },
  // courses of round logs
  timber(ctx, A, b, o) {
    const rows = Math.max(5, Math.round((b - A.y) / (o.log ?? 70))), lh = (b - A.y) / rows;
    for (let r = 0; r < rows; r++) {
      const y = A.y + r * lh, c = mix(o.c1, o.c2 ?? '#b88a50', hash(r * 3.3 + 1) * 0.5);
      ctx.fillStyle = vgrad(ctx, y, y + lh, [[0, lighter(c, 0.28)], [0.35, c], [0.8, darker(c, 0.5)], [1, darker(c, 0.7)]]); ctx.fillRect(A.x, y, A.w, lh);
      ctx.save(); ctx.beginPath(); ctx.rect(A.x, y, A.w, lh); ctx.clip(); grain(ctx, A.x, y + lh * 0.1, A.w, lh * 0.8, darker(c, 0.7), 0.4, r * 5 + 2, false, 5); ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(A.x, y + lh - 2, A.w, 3);
    }
  },
  // mud wall with painted bands and finger-smoothed streaks
  mud(ctx, A, b, o) {
    ctx.fillStyle = vgrad(ctx, A.y, b, [[0, darker(o.c1, 0.3)], [0.6, o.c1], [1, lighter(o.c1, 0.1)]]); ctx.fillRect(A.x, A.y, A.w, b - A.y);
    for (let k = 0; k < 46; k++) { const x = A.x + A.w * hash(k * 1.7), w = A.w * (0.01 + 0.03 * hash(k + 2)); ctx.fillStyle = `rgba(${hash(k) > 0.5 ? '255,230,180' : '60,30,10'},${0.05 + 0.07 * hash(k + 3)})`; ctx.fillRect(x, A.y, w, b - A.y); }
    const bh = (b - A.y) * 0.07; for (const [y0, c] of [[0.3, o.accent ?? '#f0e4c8'], [0.36, o.accent2 ?? '#2a1a12']]) { ctx.fillStyle = c; ctx.fillRect(A.x, A.y + (b - A.y) * y0, A.w, bh * (c === (o.accent ?? '#f0e4c8') ? 1 : 0.5)); }
    const tri = bh * 0.9, n = Math.round(A.w / (tri * 1.6)); ctx.fillStyle = o.accent2 ?? '#2a1a12'; for (let k = 0; k < n; k++) { const x = A.x + (k + 0.5) * (A.w / n), y = A.y + (b - A.y) * 0.44; ctx.beginPath(); ctx.moveTo(x - tri * 0.7, y); ctx.lineTo(x + tri * 0.7, y); ctx.lineTo(x, y + tri); ctx.closePath(); ctx.fill(); }
  },
  // pierced wooden lattice with warm light behind
  lattice(ctx, A, b, o) {
    ctx.fillStyle = vgrad(ctx, A.y, b, [[0, darker(o.c1, 0.5)], [1, o.c1]]); ctx.fillRect(A.x, A.y, A.w, b - A.y);
    ctx.fillStyle = rgrad(ctx, A.x + A.w / 2, A.y + (b - A.y) * 0.5, 0, A.w * 0.7, [[0, rgba(o.light ?? '#ffcf86', 0.8)], [1, rgba(o.light ?? '#ffcf86', 0.2)]]); ctx.fillRect(A.x, A.y, A.w, b - A.y);
    const g = o.cell ?? 56; ctx.strokeStyle = o.frame ?? '#3a1a0c'; ctx.lineWidth = Math.max(5, g * 0.12);
    for (let x = A.x - g; x < A.x + A.w + g; x += g) for (let y = A.y - g; y < b + g; y += g) {
      ctx.beginPath(); ctx.moveTo(x, y + g / 2); ctx.lineTo(x + g / 2, y); ctx.lineTo(x + g, y + g / 2); ctx.lineTo(x + g / 2, y + g); ctx.closePath(); ctx.stroke();
    }
    ctx.strokeStyle = rgba(lighter(o.frame ?? '#3a1a0c', 0.4), 0.35); ctx.lineWidth = 1.3;
    for (let x = A.x - g; x < A.x + A.w + g; x += g) for (let y = A.y - g; y < b + g; y += g) { ctx.beginPath(); ctx.moveTo(x, y + g / 2 - 3); ctx.lineTo(x + g / 2, y - 3); ctx.stroke(); }
  },
  // drapery with vertical folds
  curtain(ctx, A, b, o) {
    ctx.fillStyle = o.c1; ctx.fillRect(A.x, A.y, A.w, b - A.y);
    const n = Math.round(A.w / 46);
    for (let k = 0; k < n; k++) { const x = A.x + k * (A.w / n), w = A.w / n; ctx.fillStyle = hgrad(ctx, x, x + w, [[0, 'rgba(0,0,0,0.42)'], [0.35, 'rgba(255,255,255,0.12)'], [0.6, 'rgba(255,255,255,0.02)'], [1, 'rgba(0,0,0,0.4)']]); ctx.fillRect(x, A.y, w, b - A.y); }
    ctx.fillStyle = vgrad(ctx, A.y, b, [[0, 'rgba(0,0,0,0.5)'], [0.35, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.3)']]); ctx.fillRect(A.x, A.y, A.w, b - A.y);
  },
  // ashlar stone
  stone(ctx, A, b, o) {
    const bh = o.bh ?? 56, bw = bh * 2; ctx.fillStyle = darker(o.c1, 0.5); ctx.fillRect(A.x, A.y, A.w, b - A.y);
    for (let r = 0; r * bh < b - A.y + bh; r++) for (let c = -1; c * bw < A.w + bw; c++) {
      const x = A.x + c * bw + (r % 2 ? bw / 2 : 0), y = A.y + r * bh, t = hash(r * 9 + c * 3 + (o.seed ?? 0)), col = mix(o.c1, o.c2 ?? lighter(o.c1, 0.2), t);
      ctx.fillStyle = vgrad(ctx, y, y + bh, [[0, lighter(col, 0.15)], [1, darker(col, 0.25)]]); rrect(ctx, x + 2, y + 2, bw - 4, bh - 4, 5); ctx.fill();
    }
  },
  // bamboo screen: tall canes with nodes
  canes(ctx, A, b, o) {
    ctx.fillStyle = vgrad(ctx, A.y, b, [[0, darker(o.c1, 0.4)], [1, o.c1]]); ctx.fillRect(A.x, A.y, A.w, b - A.y);
    const w = o.cw ?? 34, n = Math.ceil(A.w / w) + 1;
    for (let k = 0; k < n; k++) { const x = A.x + k * w, c = mix(o.c1, o.c2 ?? '#c8b070', hash(k * 2.3) * 0.6); ctx.fillStyle = hgrad(ctx, x, x + w, [[0, darker(c, 0.5)], [0.3, lighter(c, 0.3)], [0.6, c], [1, darker(c, 0.6)]]); ctx.fillRect(x, A.y, w - 2, b - A.y); for (let j = 0; j < 4; j++) { const y = A.y + (b - A.y) * (0.12 + 0.24 * j + 0.1 * hash(k * 3 + j)); ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fillRect(x, y, w - 2, 3); ctx.fillStyle = 'rgba(255,255,230,0.16)'; ctx.fillRect(x, y + 3, w - 2, 1.5); } }
  },
};

export const FLOORS = {
  planks(ctx, A, y0, o) {
    const ph = o.ph ?? 52; ctx.fillStyle = o.c1; ctx.fillRect(A.x, y0, A.w, A.y + A.h - y0);
    for (let r = 0; r * ph < A.y + A.h - y0 + ph; r++) { const y = y0 + r * ph, c = mix(o.c1, o.c2 ?? lighter(o.c1, 0.2), hash(r * 3.7 + 2)); ctx.fillStyle = vgrad(ctx, y, y + ph, [[0, lighter(c, 0.12)], [1, darker(c, 0.3)]]); ctx.fillRect(A.x, y, A.w, ph - 2); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(A.x, y + ph - 2, A.w, 2); for (let k = 0; k < 3; k++) { ctx.strokeStyle = rgba(darker(c, 0.7), 0.2); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(A.x, y + ph * (0.2 + 0.25 * k)); ctx.bezierCurveTo(A.x + A.w * 0.3, y + ph * (0.2 + 0.25 * k) + 3, A.x + A.w * 0.6, y + ph * (0.2 + 0.25 * k) - 3, A.x + A.w, y + ph * (0.2 + 0.25 * k)); ctx.stroke(); } }
  },
  tiles(ctx, A, y0, o) {
    const s = o.size ?? 70, h = s * 0.5; ctx.fillStyle = darker(o.c1, 0.6); ctx.fillRect(A.x, y0, A.w, A.y + A.h - y0);
    for (let r = 0; r * h < A.y + A.h - y0 + h; r++) for (let c = -1; c * s < A.w + s; c++) { const x = A.x + c * s + (o.stagger && r % 2 ? s / 2 : 0), y = y0 + r * h, col = (r + c) % 2 ? o.c1 : (o.c2 ?? lighter(o.c1, 0.14)); ctx.fillStyle = vgrad(ctx, y, y + h, [[0, lighter(col, 0.1)], [1, darker(col, 0.25)]]); ctx.fillRect(x + 1.5, y + 1.5, s - 3, h - 3); }
  },
  mat(ctx, A, y0, o) {
    const s = o.size ?? 34; ctx.fillStyle = o.c1; ctx.fillRect(A.x, y0, A.w, A.y + A.h - y0);
    for (let k = 0; k * s < A.w + s; k++) { const x = A.x + k * s, c = k % 2 ? o.c1 : (o.c2 ?? darker(o.c1, 0.16)); ctx.fillStyle = hgrad(ctx, x, x + s, [[0, darker(c, 0.2)], [0.4, lighter(c, 0.14)], [1, darker(c, 0.25)]]); ctx.fillRect(x, y0, s - 1, A.y + A.h - y0); }
    for (let r = 0; r * s * 0.9 < A.y + A.h - y0; r++) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(A.x, y0 + r * s * 0.9, A.w, 2); }
  },
  stone(ctx, A, y0, o) { FLOORS.tiles(ctx, A, y0, { ...o, stagger: true, size: o.size ?? 90 }); },
  linen(ctx, A, y0, o) {   // a tablecloth: pale linen with a faint weave, a soft fold line and a lace edge near the front
    const h = A.y + A.h - y0; ctx.fillStyle = vgrad(ctx, y0, A.y + A.h, [[0, lighter(o.c1, 0.1)], [1, darker(o.c1, 0.18)]]); ctx.fillRect(A.x, y0, A.w, h);
    for (let k = 0; k < A.w / 5; k++) { ctx.fillStyle = `rgba(120,100,80,${0.03 + 0.04 * hash(k)})`; ctx.fillRect(A.x + k * 5, y0, 1.4, h); } for (let k = 0; k < h / 5; k++) { ctx.fillStyle = `rgba(120,100,80,${0.025 + 0.03 * hash(k + 3)})`; ctx.fillRect(A.x, y0 + k * 5, A.w, 1.2); }
    for (const fx of [0.18, 0.5, 0.82]) { ctx.fillStyle = hgrad(ctx, A.x + A.w * fx - 60, A.x + A.w * fx + 60, [[0, 'rgba(0,0,0,0)'], [0.5, 'rgba(0,0,0,0.1)'], [1, 'rgba(255,255,255,0.08)']]); ctx.fillRect(A.x + A.w * fx - 60, y0, 120, h); }
  },
  earth(ctx, A, y0, o) { ctx.fillStyle = vgrad(ctx, y0, A.y + A.h, [[0, o.c1], [1, darker(o.c1, 0.35)]]); ctx.fillRect(A.x, y0, A.w, A.y + A.h - y0); for (let k = 0; k < 160; k++) { ctx.fillStyle = `rgba(${hash(k) > 0.5 ? '255,235,190' : '40,20,6'},${0.05 + 0.09 * hash(k + 3)})`; ell(ctx, A.x + hash(k * 2.7) * A.w, y0 + hash(k * 1.3 + 4) * (A.y + A.h - y0), 3 + 12 * hash(k + 5), 1.5 + 4 * hash(k + 6)); ctx.fill(); } },
};

// the whole room. o { wall: {kind,c1,...}, floor: {kind,c1,...}, rail (colour of the skirting), light, orn(ctx, A, wallB, rt) }
export function room(ctx, F, rt, scene, o) {
  const A = F.area, wallB = clamp(F.map(0, scene.wallU)[1], A.y + A.h * 0.3, A.y + A.h - 40);
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
  (WALLS[o.wall.kind] ?? WALLS.plaster)(ctx, A, wallB, o.wall);
  if (o.orn) o.orn(ctx, A, wallB, rt);
  const rh = Math.max(10, (A.y + A.h - wallB) * 0.08);
  ctx.fillStyle = vgrad(ctx, wallB - rh, wallB, [[0, o.rail ?? '#3a2412'], [1, darker(o.rail ?? '#3a2412', 0.4)]]); ctx.fillRect(A.x, wallB - rh, A.w, rh);
  (FLOORS[o.floor.kind] ?? FLOORS.planks)(ctx, A, wallB, o.floor);
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(A.x, wallB, A.w, 5);
  ctx.fillStyle = vgrad(ctx, wallB, A.y + A.h, [[0, 'rgba(0,0,0,0.05)'], [1, 'rgba(0,0,0,0.55)']]); ctx.fillRect(A.x, wallB, A.w, A.y + A.h - wallB);
  ctx.restore();
  pool(ctx, A.x + A.w / 2, wallB, A.w * 0.55, A.h * 0.34, o.light ?? '#ffe0b0', 0.28);
  vignette(ctx, A, o.vig ?? 0.52);
}

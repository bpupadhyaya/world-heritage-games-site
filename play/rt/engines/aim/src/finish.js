// Finishing passes for the aim engine (1.6.0): mown stripes, ground detail, depth haze, vignette and light. Pure canvas, deterministic.
// All of it is opt-in through `look.finish` so every earlier game renders as before.
import { dark, light, alpha, vgrad, poly, hash, rrect } from './scenery.js';

const TAU = Math.PI * 2;

// lengthwise stripes in perspective across [xa, xb] from y0 to y1 (world units), alternating light and dark
export function mowStripes(ctx, tr, xa, xb, y0, y1, step, aLight = 0.07, aDark = 0.07, phase = 0) {
  const n = Math.ceil((xb - xa) / step);
  for (let i = 0; i < n; i++) {
    const a = xa + i * step, b = Math.min(xb, a + step);
    const p = tr(a, y0), q = tr(b, y0), r = tr(b, y1), s = tr(a, y1);
    ctx.fillStyle = (i + phase) % 2 ? `rgba(255,255,255,${aLight})` : `rgba(0,20,0,${aDark})`;
    poly(ctx, [[p.x, p.y], [q.x, q.y], [r.x, r.y], [s.x, s.y]]); ctx.fill();
  }
}

// small ground marks that scale with depth: tufts and daisies (lawn), pebbles (clay), cracks and chalk (asphalt), grains (sand)
export function groundDetail(ctx, tr, kind, xa, xb, y0, y1, count, seed = 1) {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = xa + hash(seed + i * 1.7) * (xb - xa), y = y0 + Math.pow(hash(seed + i * 3.1 + 5), 1.25) * (y1 - y0);
    const c = tr(x, y), s = c.s, r = Math.max(0.8, s * 0.016 * (0.6 + hash(i + seed * 9)));
    if (kind === 'lawn') {
      ctx.strokeStyle = 'rgba(20,70,20,0.4)'; ctx.lineWidth = Math.max(1, s * 0.012);
      ctx.beginPath(); for (let k = -1; k <= 1; k++) { ctx.moveTo(c.x + k * r * 0.8, c.y); ctx.lineTo(c.x + k * r * 1.5, c.y - r * 2.2); } ctx.stroke();
      if (hash(i * 5 + seed) > 0.86) { ctx.fillStyle = '#fff8e0'; ctx.beginPath(); ctx.arc(c.x, c.y - r * 2.2, Math.max(1.2, r * 0.9), 0, TAU); ctx.fill(); ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.arc(c.x, c.y - r * 2.2, Math.max(0.6, r * 0.38), 0, TAU); ctx.fill(); }
    } else if (kind === 'clay') {
      ctx.fillStyle = hash(i + seed) > 0.5 ? 'rgba(255,230,200,0.28)' : 'rgba(80,30,10,0.22)'; ctx.beginPath(); ctx.ellipse(c.x, c.y, r * 1.1, r * 0.5, 0, 0, TAU); ctx.fill();
    } else if (kind === 'asphalt') {
      if (hash(i * 2 + seed) > 0.6) { ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = Math.max(1, s * 0.012); ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + s * 0.18 * (hash(i) - 0.5), c.y - s * 0.03); ctx.lineTo(c.x + s * 0.3 * (hash(i + 3) - 0.4), c.y - s * 0.02); ctx.stroke(); }
      else { ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(c.x, c.y, Math.max(1.5, r), Math.max(1, r * 0.4)); }
    } else if (kind === 'sand') {
      ctx.fillStyle = hash(i + seed) > 0.5 ? 'rgba(255,255,255,0.3)' : 'rgba(120,80,30,0.2)'; ctx.fillRect(c.x, c.y, Math.max(1, r * 0.7), Math.max(1, r * 0.4));
    }
  }
  ctx.restore();
}

// rake lines across a clay court: faint arcs in perspective
export function rakeLines(ctx, tr, hw, y0, y1, n = 10) {
  ctx.save(); ctx.strokeStyle = 'rgba(255,235,210,0.1)'; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const y = y0 + ((i + 0.5) / n) * (y1 - y0), a = tr(-hw, y), b = tr(hw, y);
    ctx.lineWidth = Math.max(1, a.s * 0.02); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo((a.x + b.x) / 2, a.y - a.s * 0.05, b.x, b.y); ctx.stroke();
  }
  ctx.restore();
}

// depth haze: the far ground melts into the sky colour
export function haze(ctx, area, hy, col, k = 0.35, depth = 0.3) {
  const y0 = Math.max(area.y, hy), y1 = Math.min(area.y + area.h, y0 + area.h * depth);
  if (y1 <= y0) return;
  ctx.fillStyle = vgrad(ctx, y0, y1, [[0, alpha(col, k)], [1, alpha(col, 0)]]);
  ctx.fillRect(area.x - 20, y0, area.w + 40, y1 - y0);
}

// soft darkening at the edges and a warm light from the upper left
export function vignette(ctx, area, k = 0.35, warm = 0.1) {
  const cx = area.x + area.w / 2, cy = area.y + area.h * 0.5, R = Math.hypot(area.w, area.h) * 0.62;
  const g = ctx.createRadialGradient(cx, cy, R * 0.42, cx, cy, R);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(8,6,14,${k})`);
  ctx.fillStyle = g; ctx.fillRect(area.x - 20, area.y, area.w + 40, area.h);
  if (warm > 0) {
    const w = ctx.createRadialGradient(area.x + area.w * 0.15, area.y, 4, area.x + area.w * 0.15, area.y, area.h * 0.9);
    w.addColorStop(0, `rgba(255,236,190,${warm})`); w.addColorStop(1, 'rgba(255,236,190,0)');
    ctx.fillStyle = w; ctx.fillRect(area.x - 20, area.y, area.w + 40, area.h);
  }
}

// a person standing or sitting beside the lane: back view, simple shapes with shading
export function drawBystander(ctx, c, o = {}, t = 0) {
  const u = c.s * (o.scale ?? 1), shirt = o.shirt ?? '#d8453a', pants = o.pants ?? '#2b3140', skin = o.skin ?? '#d6a077', H = u * 1.55;
  const x = c.x, y = c.y, sway = Math.sin(t * 1.6 + (o.x ?? 0) * 3) * u * 0.012;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(x + u * 0.1, y + 1, u * 0.34, u * 0.08, 0, 0, TAU); ctx.fill();
  if (o.front) {
    // facing the thrower: legs, shorts or trousers, a shirt with a number, ready arms, a face
    const sk2 = dark(skin, 0.12);
    for (const dx of [-0.08, 0.08]) { ctx.fillStyle = dark(pants, dx < 0 ? 0 : 0.2); ctx.fillRect(x + dx * H - H * 0.055, y - H * 0.47, H * 0.11, H * 0.47); ctx.fillStyle = '#f2f0ea'; ctx.fillRect(x + dx * H - H * 0.06, y - H * 0.04, H * 0.12, H * 0.04); ctx.fillStyle = '#1c1c22'; ctx.fillRect(x + dx * H - H * 0.062, y - H * 0.02, H * 0.124, H * 0.02); }
    ctx.fillStyle = o.shorts ? shirt : pants; if (o.shorts) { ctx.fillStyle = dark(pants, 0.05); ctx.fillRect(x - H * 0.14, y - H * 0.55, H * 0.28, H * 0.11); }
    const ty = y - H * 0.84, tb = y - H * 0.46;
    ctx.fillStyle = vgrad(ctx, ty, tb, [[0, light(shirt, 0.18)], [1, dark(shirt, 0.28)]]);
    ctx.beginPath(); ctx.moveTo(x - H * 0.17, ty + H * 0.03); ctx.quadraticCurveTo(x - H * 0.17, ty, x - H * 0.1, ty); ctx.lineTo(x + H * 0.1, ty); ctx.quadraticCurveTo(x + H * 0.17, ty, x + H * 0.17, ty + H * 0.03); ctx.lineTo(x + H * 0.13, tb); ctx.lineTo(x - H * 0.13, tb); ctx.closePath(); ctx.fill();
    ctx.fillStyle = alpha('#ffffff', 0.9); ctx.fillRect(x - H * 0.035, ty + H * 0.1, H * 0.07, H * 0.1);
    ctx.fillStyle = sk2; ctx.beginPath(); ctx.moveTo(x - H * 0.05, ty); ctx.lineTo(x + H * 0.05, ty); ctx.lineTo(x, ty + H * 0.05); ctx.closePath(); ctx.fill();
    const up = o.armUp ? 1 : 0, ready = o.ready ? 1 : 0;
    ctx.strokeStyle = shirt; ctx.lineWidth = H * 0.07; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - H * 0.17, ty + H * 0.04); ctx.lineTo(x - H * (0.24 + 0.06 * ready), y - H * (0.58 - 0.1 * ready)); ctx.moveTo(x + H * 0.17, ty + H * 0.04); ctx.lineTo(x + H * (0.24 + 0.06 * ready + 0.04 * up), y - H * (0.58 + 0.3 * up - 0.1 * ready)); ctx.stroke();
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(x - H * (0.24 + 0.06 * ready), y - H * (0.58 - 0.1 * ready), H * 0.04, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x + H * (0.24 + 0.06 * ready + 0.04 * up), y - H * (0.58 + 0.3 * up - 0.1 * ready), H * 0.04, 0, TAU); ctx.fill(); ctx.lineCap = 'butt';
    const hy = ty - H * 0.1;
    ctx.fillStyle = sk2; ctx.fillRect(x - H * 0.03, ty - H * 0.03, H * 0.06, H * 0.04);
    ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(x + sway, hy, H * 0.08, H * 0.095, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = sk2; ctx.beginPath(); ctx.ellipse(x - H * 0.08 + sway, hy, H * 0.014, H * 0.025, 0, 0, TAU); ctx.ellipse(x + H * 0.08 + sway, hy, H * 0.014, H * 0.025, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = o.hair ?? '#2a1a12'; ctx.beginPath(); ctx.ellipse(x + sway, hy - H * 0.035, H * 0.085, H * 0.065, 0, Math.PI, TAU); ctx.fill();
    if (o.hairStyle === 'long') { ctx.beginPath(); ctx.moveTo(x - H * 0.085 + sway, hy - H * 0.02); ctx.quadraticCurveTo(x - H * 0.11, hy + H * 0.12, x - H * 0.08, ty + H * 0.06); ctx.lineTo(x - H * 0.05, hy + H * 0.02); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + H * 0.085 + sway, hy - H * 0.02); ctx.quadraticCurveTo(x + H * 0.11, hy + H * 0.12, x + H * 0.08, ty + H * 0.06); ctx.lineTo(x + H * 0.05, hy + H * 0.02); ctx.closePath(); ctx.fill(); }
    else if (o.hairStyle === 'bald') { ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(x + sway, hy - H * 0.03, H * 0.082, H * 0.062, 0, Math.PI, TAU); ctx.fill(); }
    else if (o.hairStyle === 'bun') { ctx.beginPath(); ctx.arc(x + sway, hy - H * 0.115, H * 0.04, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#1c1812'; ctx.beginPath(); ctx.arc(x - H * 0.03 + sway, hy - H * 0.005, H * 0.011, 0, TAU); ctx.arc(x + H * 0.03 + sway, hy - H * 0.005, H * 0.011, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#8a3a2a'; ctx.lineWidth = Math.max(1, H * 0.01); ctx.beginPath(); ctx.arc(x + sway, hy + H * 0.025, H * 0.026, 0.2, Math.PI - 0.2); ctx.stroke();
    if (o.cap) { ctx.fillStyle = o.cap; ctx.beginPath(); ctx.ellipse(x + sway, hy - H * 0.05, H * 0.088, H * 0.05, 0, Math.PI, TAU); ctx.fill(); ctx.fillRect(x - H * 0.09 + sway, hy - H * 0.052, H * 0.18, H * 0.012); ctx.fillStyle = dark(o.cap, 0.3); ctx.beginPath(); ctx.ellipse(x + sway, hy - H * 0.045, H * 0.07, H * 0.018, 0, 0, Math.PI); ctx.fill(); }
    ctx.restore();
    return;
  }
  if (o.sit) {
    ctx.fillStyle = dark(pants, 0.1); ctx.fillRect(x - H * 0.14, y - H * 0.3, H * 0.28, H * 0.14);
    ctx.fillStyle = vgrad(ctx, y - H * 0.7, y - H * 0.3, [[0, light(shirt, 0.15)], [1, dark(shirt, 0.3)]]); ctx.fillRect(x - H * 0.15, y - H * 0.64, H * 0.3, H * 0.36);
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(x + sway, y - H * 0.76, H * 0.1, 0, TAU); ctx.fill();
  } else {
    for (const dx of [-0.07, 0.07]) { ctx.fillStyle = dark(pants, dx < 0 ? 0 : 0.2); ctx.fillRect(x + dx * H - H * 0.05, y - H * 0.5, H * 0.1, H * 0.5); ctx.fillStyle = '#1c1c22'; ctx.fillRect(x + dx * H - H * 0.055, y - H * 0.03, H * 0.11, H * 0.03); }
    ctx.fillStyle = vgrad(ctx, y - H * 0.82, y - H * 0.46, [[0, light(shirt, 0.15)], [1, dark(shirt, 0.3)]]);
    ctx.beginPath(); ctx.moveTo(x - H * 0.16 + sway, y - H * 0.8); ctx.lineTo(x + H * 0.16 + sway, y - H * 0.8); ctx.lineTo(x + H * 0.12, y - H * 0.44); ctx.lineTo(x - H * 0.12, y - H * 0.44); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = dark(shirt, 0.2); ctx.lineWidth = H * 0.06; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - H * 0.16, y - H * 0.76); ctx.lineTo(x - H * 0.2, y - H * 0.5); ctx.moveTo(x + H * 0.16, y - H * 0.76); ctx.lineTo(x + H * (o.armUp ? 0.26 : 0.2), y - H * (o.armUp ? 0.95 : 0.5)); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(x + sway, y - H * 0.9, H * 0.09, 0, TAU); ctx.fill();
    ctx.fillStyle = o.hair ?? '#2a1a12'; ctx.beginPath(); ctx.arc(x + sway, y - H * 0.915, H * 0.092, Math.PI, TAU); ctx.fill();
  }
  ctx.restore();
}

// static scene layer painted once into an offscreen canvas and blitted every frame; paint(ctx, pan, clock) draws it. Falls back to null
// (the caller paints directly) when no offscreen canvas is available.
export function makeStaticCache() {
  let canvas = null, key = '';
  const mk = (w, h) => { try { if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h); const d = globalThis.document; if (d?.createElement) { const c = d.createElement('canvas'); c.width = w; c.height = h; return c; } } catch { /* no canvas */ } return null; };
  return (ctx, area, paint, extra = '') => {
    let S = 1; try { S = Math.min(2, Math.max(1, ctx.getTransform?.()?.a || 1)); } catch { S = 1; }
    const k = `${area.x}|${area.y}|${area.w}|${area.h}|${S}|${extra}`;
    if (canvas && key === k) return canvas;
    const W = Math.ceil((area.w + 40) * S), H = Math.ceil(area.h * S), c = mk(W, H);
    if (!c) return null;
    const c2 = c.getContext('2d'); if (!c2) return null;
    c2.setTransform(S, 0, 0, S, -(area.x - 20) * S, -area.y * S);
    c2.save(); c2.beginPath(); c2.rect(area.x - 20, area.y, area.w + 40, area.h); c2.clip();
    paint(c2, 0, 0);
    c2.restore();
    canvas = c; key = k;
    return canvas;
  };
}

// ---- ground decals (1.7.0): chalk games, puddles, mats, shade and flowers painted on the ground in perspective --------------------------
const ringPts = (tr, x, y, rx, ry, n = 28, rot = 0) => { const pts = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU, px = Math.cos(a) * rx, py = Math.sin(a) * ry; const q = tr(x + px * Math.cos(rot) - py * Math.sin(rot), y + px * Math.sin(rot) + py * Math.cos(rot)); pts.push([q.x, q.y]); } return pts; };
const rectPts = (tr, x, y, w, d) => [[x - w / 2, y - d / 2], [x + w / 2, y - d / 2], [x + w / 2, y + d / 2], [x - w / 2, y + d / 2]].map(([a, b]) => { const q = tr(a, b); return [q.x, q.y]; });
export function drawDecal(ctx, tr, d, hash2 = hash) {
  const col = d.color ?? '#f4efe0';
  ctx.save();
  if (d.kind === 'shade') {
    const c = tr(d.x, d.y); poly(ctx, ringPts(tr, d.x, d.y, d.rx ?? 1.6, d.ry ?? 1.0, 24, d.rot ?? 0));
    const g = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, (d.rx ?? 1.6) * c.s); g.addColorStop(0, `rgba(10,30,10,${d.alpha ?? 0.22})`); g.addColorStop(1, 'rgba(10,30,10,0)'); ctx.fillStyle = g; ctx.fill();
  } else if (d.kind === 'puddle') {
    const c = tr(d.x, d.y); poly(ctx, ringPts(tr, d.x, d.y, d.rx ?? 0.7, d.ry ?? 0.4, 24, d.rot ?? 0));
    ctx.fillStyle = vgrad(ctx, c.y - c.s * 0.5, c.y + c.s * 0.5, [[0, 'rgba(210,230,245,0.55)'], [1, 'rgba(120,150,175,0.4)']]); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); const a = tr(d.x - (d.rx ?? 0.7) * 0.4, d.y - (d.ry ?? 0.4) * 0.2), b = tr(d.x + (d.rx ?? 0.7) * 0.2, d.y - (d.ry ?? 0.4) * 0.3); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  } else if (d.kind === 'mat') {
    poly(ctx, rectPts(tr, d.x, d.y, d.w ?? 1, d.d ?? 0.6)); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
    const c = tr(d.x, d.y); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; poly(ctx, rectPts(tr, d.x, d.y, (d.w ?? 1) * 0.86, (d.d ?? 0.6) * 0.8)); ctx.stroke(); void c;
  } else if (d.kind === 'hopscotch') {
    const n = d.n ?? 8, bw = d.w ?? 0.5, y0 = d.y;
    ctx.strokeStyle = alpha(col, 0.9); ctx.lineWidth = Math.max(1.5, tr(d.x, d.y).s * 0.025); ctx.lineJoin = 'round';
    for (let i = 0; i < n; i++) {
      const single = i < 3 || i === n - 1 || i % 3 === 0, yy = y0 + i * bw;
      if (single) poly(ctx, rectPts(tr, d.x, yy + bw / 2, bw, bw)); else { poly(ctx, rectPts(tr, d.x - bw / 2, yy + bw / 2, bw, bw)); ctx.stroke(); poly(ctx, rectPts(tr, d.x + bw / 2, yy + bw / 2, bw, bw)); }
      ctx.stroke();
    }
  } else if (d.kind === 'chalk') {
    // a chalk drawing: a sun with rays, a flower, a smiling face or a stick figure
    const c = tr(d.x, d.y), r = (d.r ?? 0.4) * c.s; ctx.strokeStyle = alpha(col, 0.85); ctx.lineWidth = Math.max(1.4, c.s * 0.022); ctx.lineCap = 'round';
    const k = d.art ?? 'sun', f = c.f;
    ctx.save(); ctx.translate(c.x, c.y); ctx.scale(1, Math.max(0.25, f));
    if (k === 'sun' || k === 'face') { ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, TAU); ctx.stroke(); if (k === 'sun') for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.65, Math.sin(a) * r * 0.65); ctx.lineTo(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95); ctx.stroke(); } else { ctx.beginPath(); ctx.arc(-r * 0.18, -r * 0.12, r * 0.04, 0, TAU); ctx.arc(r * 0.18, -r * 0.12, r * 0.04, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, r * 0.05, r * 0.25, 0.2, Math.PI - 0.2); ctx.stroke(); } }
    else if (k === 'flower') { for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4 - r * 0.4, r * 0.22, 0, TAU); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(0, -r * 0.4 + r * 0.22); ctx.quadraticCurveTo(r * 0.2, r * 0.3, 0, r * 0.8); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(0, -r * 0.7, r * 0.18, 0, TAU); ctx.moveTo(0, -r * 0.52); ctx.lineTo(0, r * 0.1); ctx.moveTo(-r * 0.3, -r * 0.3); ctx.lineTo(r * 0.3, -r * 0.35); ctx.moveTo(0, r * 0.1); ctx.lineTo(-r * 0.25, r * 0.6); ctx.moveTo(0, r * 0.1); ctx.lineTo(r * 0.25, r * 0.6); ctx.stroke(); }
    ctx.restore(); ctx.lineCap = 'butt';
  } else if (d.kind === 'flowers') {
    const n = d.n ?? 26, cols = d.colors ?? ['#e8453a', '#f2c230', '#f4f0e6', '#d870b8', '#7a58c8'];
    for (let i = 0; i < n; i++) { const x = d.x + (hash2(i * 1.9 + (d.seed ?? 3)) - 0.5) * (d.w ?? 1.2), y = d.y + (hash2(i * 2.7 + 9) - 0.5) * (d.d ?? 0.6), c = tr(x, y), r = Math.max(1.2, c.s * 0.028); ctx.strokeStyle = 'rgba(30,90,30,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x, c.y - r * 2.4); ctx.stroke(); ctx.fillStyle = cols[i % cols.length]; ctx.beginPath(); ctx.arc(c.x, c.y - r * 2.4, r, 0, TAU); ctx.fill(); ctx.fillStyle = '#f9e27a'; ctx.beginPath(); ctx.arc(c.x, c.y - r * 2.4, r * 0.35, 0, TAU); ctx.fill(); }
  } else if (d.kind === 'circle') {
    poly(ctx, ringPts(tr, d.x, d.y, d.r ?? 1, d.r ?? 1, 32)); ctx.strokeStyle = alpha(col, d.alpha ?? 0.8); ctx.lineWidth = Math.max(1.5, tr(d.x, d.y).s * (d.line ?? 0.04)); ctx.stroke();
    if (d.fill) { ctx.fillStyle = alpha(d.fill, d.fillAlpha ?? 0.25); ctx.fill(); }
  } else if (d.kind === 'rect') {
    poly(ctx, rectPts(tr, d.x, d.y, d.w ?? 1, d.d ?? 1)); if (d.fill) { ctx.fillStyle = alpha(d.fill, d.fillAlpha ?? 0.35); ctx.fill(); } ctx.strokeStyle = alpha(col, d.alpha ?? 0.85); ctx.lineWidth = Math.max(1.5, tr(d.x, d.y).s * (d.line ?? 0.04)); ctx.stroke();
  }
  ctx.restore();
}

// ---- face-view props (1.7.0): things standing on the ground line or hanging in the sky, positions in face units --------------------------
export function drawFaceProp(ctx, p, X, Y, s, t = 0) {
  // X, Y = screen position of the prop's base (Y is the ground line for ground props, the centre for sky props); s = pixels per face unit
  const k = (p.scale ?? 1) * s, col = p.color ?? '#c8392e';
  ctx.save();
  if (p.kind === 'bench') {
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(X + k * 0.02, Y + k * 0.01, k * 0.2, k * 0.025, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(X - k * 0.17, Y - k * 0.07, k * 0.02, k * 0.07); ctx.fillRect(X + k * 0.15, Y - k * 0.07, k * 0.02, k * 0.07);
    ctx.fillStyle = vgrad(ctx, Y - k * 0.1, Y - k * 0.06, [[0, '#d6aa6a'], [1, '#9a7240']]); rrect(ctx, X - k * 0.2, Y - k * 0.1, k * 0.4, k * 0.035, k * 0.01); ctx.fill();
    ctx.fillStyle = col; rrect(ctx, X - k * 0.12, Y - k * 0.125, k * 0.1, k * 0.03, k * 0.012); ctx.fill();
  } else if (p.kind === 'bag') {
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(X, Y + k * 0.004, k * 0.09, k * 0.014, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = vgrad(ctx, Y - k * 0.07, Y, [[0, light(col, 0.2)], [1, dark(col, 0.3)]]); rrect(ctx, X - k * 0.085, Y - k * 0.07, k * 0.17, k * 0.07, k * 0.03); ctx.fill();
    ctx.strokeStyle = dark(col, 0.5); ctx.lineWidth = Math.max(1, k * 0.008); ctx.beginPath(); ctx.moveTo(X - k * 0.085, Y - k * 0.035); ctx.lineTo(X + k * 0.085, Y - k * 0.035); ctx.stroke(); ctx.beginPath(); ctx.arc(X, Y - k * 0.07, k * 0.04, Math.PI, TAU); ctx.stroke();
  } else if (p.kind === 'cones') {
    for (let i = 0; i < (p.n ?? 4); i++) { const x = X + i * k * 0.07; ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, Y, k * 0.03, k * 0.008, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ee7a2a'; poly(ctx, [[x - k * 0.028, Y], [x + k * 0.028, Y], [x + k * 0.006, Y - k * 0.07], [x - k * 0.006, Y - k * 0.07]]); ctx.fill(); ctx.fillStyle = '#f4f0e2'; ctx.fillRect(x - k * 0.017, Y - k * 0.038, k * 0.034, k * 0.011); }
  } else if (p.kind === 'ballrack') {
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(X, Y + k * 0.004, k * 0.14, k * 0.016, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#4a505a'; ctx.lineWidth = Math.max(1.5, k * 0.012); ctx.beginPath(); ctx.moveTo(X - k * 0.12, Y - k * 0.17); ctx.lineTo(X - k * 0.12, Y - k * 0.02); ctx.moveTo(X + k * 0.12, Y - k * 0.17); ctx.lineTo(X + k * 0.12, Y - k * 0.02); ctx.moveTo(X - k * 0.12, Y - k * 0.09); ctx.lineTo(X + k * 0.12, Y - k * 0.09); ctx.stroke();
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#f2c230' : '#f4f0e6'; ctx.beginPath(); ctx.arc(X - k * 0.08 + i * k * 0.053, Y - k * 0.125, k * 0.026, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.fillStyle = '#2a2e36'; ctx.beginPath(); ctx.arc(X - k * 0.1, Y - k * 0.012, k * 0.014, 0, TAU); ctx.arc(X + k * 0.1, Y - k * 0.012, k * 0.014, 0, TAU); ctx.fill();
  } else if (p.kind === 'flag') {
    const h = k * 0.9, w = k * 0.3, wv = Math.sin(t * 3 + X) * k * 0.012;
    ctx.fillStyle = '#d8dce2'; ctx.fillRect(X - k * 0.004, Y - h, k * 0.008, h); ctx.fillStyle = '#d9a441'; ctx.beginPath(); ctx.arc(X, Y - h, k * 0.012, 0, TAU); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(X + k * 0.004, Y - h + k * 0.01); ctx.quadraticCurveTo(X + w * 0.5, Y - h + k * 0.01 + wv, X + w, Y - h + k * 0.03); ctx.lineTo(X + w, Y - h + k * 0.17); ctx.quadraticCurveTo(X + w * 0.5, Y - h + k * 0.18 + wv, X + k * 0.004, Y - h + k * 0.17); ctx.closePath(); ctx.fill();
    ctx.fillStyle = alpha('#ffffff', 0.85); ctx.beginPath(); ctx.arc(X + w * 0.4, Y - h + k * 0.095, k * 0.03, 0, TAU); ctx.fill();
  } else if (p.kind === 'lamp') {
    const h = k * 1.1; ctx.fillStyle = '#6a707a'; ctx.fillRect(X - k * 0.008, Y - h, k * 0.016, h); ctx.fillStyle = '#2a2e36'; rrect(ctx, X - k * 0.07, Y - h - k * 0.035, k * 0.14, k * 0.05, k * 0.01); ctx.fill();
    ctx.fillStyle = '#fff6d8'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(X - k * 0.05 + i * k * 0.033, Y - h - k * 0.01, k * 0.011, 0, TAU); ctx.fill(); }
    const g = ctx.createRadialGradient(X, Y - h, 2, X, Y - h, k * 0.5); g.addColorStop(0, 'rgba(255,244,214,0.35)'); g.addColorStop(1, 'rgba(255,244,214,0)'); ctx.fillStyle = g; ctx.fillRect(X - k * 0.5, Y - h - k * 0.5, k, k);
  } else if (p.kind === 'birds') {
    ctx.strokeStyle = 'rgba(40,50,64,0.7)'; ctx.lineWidth = Math.max(1.2, k * 0.008); ctx.lineCap = 'round';
    for (let i = 0; i < (p.n ?? 7); i++) { const bx = X + (i - 3) * k * 0.09 + Math.sin(i * 2.1) * k * 0.03 + Math.sin(t * 0.4) * k * 0.02, by = Y + Math.abs(i - 3) * k * 0.03 + Math.sin(i * 1.7) * k * 0.015, fl = Math.sin(t * 5 + i * 1.3) * k * 0.012; ctx.beginPath(); ctx.moveTo(bx - k * 0.03, by - k * 0.012 - fl); ctx.quadraticCurveTo(bx - k * 0.012, by + fl * 0.5, bx, by); ctx.quadraticCurveTo(bx + k * 0.012, by + fl * 0.5, bx + k * 0.03, by - k * 0.012 - fl); ctx.stroke(); }
    ctx.lineCap = 'butt';
  } else if (p.kind === 'balloons') {
    for (let i = 0; i < (p.n ?? 5); i++) { const bx = X + (i - 2) * k * 0.07, by = Y - Math.abs(i - 2) * k * 0.03 - (i % 2) * k * 0.04, c = ['#e8453a', '#f2c230', '#2d6bb0', '#3a9a5a', '#d870b8'][i % 5]; ctx.strokeStyle = 'rgba(40,30,20,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx, by + k * 0.045); ctx.quadraticCurveTo(bx + k * 0.01, by + k * 0.12, X, Y + k * 0.22); ctx.stroke(); const g = ctx.createRadialGradient(bx - k * 0.012, by - k * 0.012, 1, bx, by, k * 0.05); g.addColorStop(0, light(c, 0.5)); g.addColorStop(1, dark(c, 0.2)); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(bx, by, k * 0.035, k * 0.045, 0, 0, TAU); ctx.fill(); }
  } else if (p.kind === 'cloud') {
    ctx.fillStyle = 'rgba(255,255,255,0.78)'; for (const [dx, dy, r] of [[0, 0, 0.07], [0.08, 0.01, 0.055], [-0.08, 0.012, 0.05], [0.03, -0.035, 0.05]]) { ctx.beginPath(); ctx.arc(X + dx * k + Math.sin(t * 0.1) * k * 0.05, Y + dy * k, r * k, 0, TAU); ctx.fill(); }
  } else if (p.kind === 'beam') {
    const g = ctx.createLinearGradient(X, Y, X + k * 0.4, Y + k * 1.2); g.addColorStop(0, 'rgba(255,246,214,0.22)'); g.addColorStop(1, 'rgba(255,246,214,0)'); ctx.fillStyle = g; poly(ctx, [[X - k * 0.06, Y], [X + k * 0.06, Y], [X + k * 0.5, Y + k * 1.2], [X + k * 0.34, Y + k * 1.2]]); ctx.fill();
  } else if (p.kind === 'poolglow') {
    const g = ctx.createRadialGradient(X, Y, 2, X, Y, k * 0.5); g.addColorStop(0, 'rgba(255,236,190,0.35)'); g.addColorStop(1, 'rgba(255,236,190,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(X, Y, k * 0.5, k * 0.12, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

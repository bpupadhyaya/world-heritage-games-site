// The chase view: a lit sky, a perspective water (or snow) plane, a backdrop with parallax, hero-scale craft in depth rows,
// wake, bow wave, spray and glitter. Every world is data: sky, sun, water colours, a backdrop id and extras. Pure canvas.
import { CRAFTS } from './crafts.js';
import { hash, lit, dim, mix, alpha, smooth, lg, capsule, TAU, clamp, lerp } from './craft-art.js';

export const vn = (x) => { const i = Math.floor(x), f = x - i, s = f * f * (3 - 2 * f); return hash(i) * (1 - s) + hash(i + 1) * s; };
export const noise = (x, seed) => vn(x + seed * 37.7) * 0.62 + vn(x * 2.3 + seed * 11.1) * 0.28 + vn(x * 5.1 + seed * 3.3) * 0.1;

// ---- worlds: sky, sun, water, backdrop --------------------------------------------------------------------------------------
export const WORLDS = {
  'pacific-cliffs': { sky: ['#5fa6e0', '#f6e6c4'], sun: { x: 0.74, y: 0.5, r: 0.06, c: '#fff4d0' }, water: ['#58b5c8', '#0a5d8a', '#06365a'], haze: '#cde6ee', backdrop: 'pali', clouds: 0.8, glints: '#ffffff' },
  'boreal-lake': { sky: ['#86b5d2', '#f4e0c4'], sun: { x: 0.2, y: 0.45, r: 0.05, c: '#fff0cc' }, water: ['#6fa3b4', '#2b6379', '#123a4c'], haze: '#d4e4e8', backdrop: 'boreal', clouds: 0.5, glints: '#fff8e0' },
  'ice-river': { sky: ['#b9c9dc', '#f4efe8'], sun: { x: 0.8, y: 0.62, r: 0.045, c: '#fff6e8' }, water: ['#7f9db4', '#3b5b75', '#1d3347'], haze: '#e6edf4', backdrop: 'winter', clouds: 0.6, glints: '#ffffff', floes: true },
  'beach-dawn': { sky: ['#f0845f', '#ffe3a6'], sun: { x: 0.28, y: 0.62, r: 0.09, c: '#fff2b8' }, water: ['#f0a070', '#26748f', '#0e3f58'], haze: '#ffd9a8', backdrop: 'beach', clouds: 0.4, glints: '#fff0c0' },
  'nile-dusk': { sky: ['#6b86c4', '#f6c58a'], sun: { x: 0.66, y: 0.66, r: 0.075, c: '#ffe2a0' }, water: ['#e0a878', '#4a7a8a', '#1e3f50'], haze: '#f3cfa0', backdrop: 'nile', clouds: 0.3, glints: '#fff0c8' },
  'delta-gold': { sky: ['#e9a86c', '#ffeab8'], sun: { x: 0.5, y: 0.66, r: 0.08, c: '#fff6c8' }, water: ['#e8c08a', '#6a8f78', '#2a4a3a'], haze: '#ffe0b0', backdrop: 'delta', clouds: 0.25, glints: '#fff4c8', lilies: true, ground: ['#6f8a3e', '#4a6a2a'], mapWater: ['#9fd0b0', '#58a088', '#34705f'] },
  'turquoise-cays': { sky: ['#4aa6e8', '#e8f6fb'], sun: { x: 0.8, y: 0.3, r: 0.04, c: '#ffffff' }, water: ['#7fe0d6', '#12a0b8', '#0a5a86'], haze: '#d6f2f4', backdrop: 'cays', clouds: 1, glints: '#ffffff' },
  'bahama-bank': { sky: ['#2c78d2', '#c4e8f6'], sun: { x: 0.82, y: 0.34, r: 0.035, c: '#ffffff' }, water: ['#c4f4ea', '#62dccf', '#2bbac6'], haze: '#e4f8f6', backdrop: 'cays', clouds: 1, glints: '#ffffff' },
  mangrove: { sky: ['#8cb89a', '#f2e6b8'], sun: { x: 0.35, y: 0.5, r: 0.05, c: '#fff6c0' }, water: ['#9aa878', '#4a6a4a', '#20382c'], haze: '#dfe6c0', backdrop: 'mangrove', clouds: 0.4, glints: '#fff6c8' },
};

// ---- backdrops ------------------------------------------------------------------------------------------------------------
export function ridge(ctx, o, { amp, freq, par, col, seed, lift = 0, step = 6 }) {
  const off = o.off * par;
  ctx.beginPath(); ctx.moveTo(o.x0, o.hz + 2);
  for (let x = o.x0; x <= o.x0 + o.w + step; x += step) ctx.lineTo(x, o.hz - lift - amp * noise((x + off) * freq, seed));
  ctx.lineTo(o.x0 + o.w + step, o.hz + 2); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
}
export function ridgeAt(o, x, { amp, freq, par, seed, lift = 0 }) { return o.hz - lift - amp * noise((x + o.off * par) * freq, seed); }
export function pine(ctx, x, y, h, col, snow) {
  const w = h * 0.34;
  for (let i = 0; i < 4; i++) { const k = i / 4, yy = y - h * (0.16 + k * 0.76), ww = w * (1 - k * 0.78); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - ww, yy + h * 0.22); ctx.lineTo(x, yy - h * 0.22); ctx.lineTo(x + ww, yy + h * 0.22); ctx.closePath(); ctx.fill(); if (snow) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.moveTo(x - ww * 0.62, yy + h * 0.02); ctx.lineTo(x, yy - h * 0.22); ctx.lineTo(x + ww * 0.62, yy + h * 0.02); ctx.closePath(); ctx.fill(); } }
  ctx.fillStyle = dim(col, 0.5); ctx.fillRect(x - h * 0.02, y, h * 0.04, h * 0.1);
}
export function palm(ctx, x, y, h, col, lean = 0.2, t = 0, ph = 0) {
  const tx = x + h * lean, ty = y - h;
  ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.5, h * 0.05); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + h * lean * 0.1, y - h * 0.55, tx, ty); ctx.stroke();
  const sw = Math.sin(t * 1.3 + ph) * 0.06;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.05 + i * 0.15) + sw, L = h * (0.45 + (i % 2) * 0.08);
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx + Math.cos(a) * L * 0.6, ty + Math.sin(a) * L * 0.6 - L * 0.12, tx + Math.cos(a) * L, ty + Math.sin(a) * L + L * 0.28); ctx.lineWidth = Math.max(1.4, h * 0.07); ctx.stroke();
  }
}
function building(ctx, x, y, w, h, col, win) {
  ctx.fillStyle = col; ctx.fillRect(x, y - h, w, h); ctx.fillStyle = dim(col, 0.18); ctx.fillRect(x, y - h, w, h * 0.08);
  if (win) { ctx.fillStyle = win; for (let i = 0; i < 2; i++) ctx.fillRect(x + w * (0.2 + i * 0.4), y - h * 0.6, w * 0.16, h * 0.22); }
}
export function clouds(ctx, o, w, amount, t) {
  const n = Math.round(4 + amount * 5);
  for (let i = 0; i < n; i++) {
    const par = 0.015 + (i % 3) * 0.008, base = hash(i * 7 + 2) * (o.w + 400);
    const x = ((base - o.off * par - t * (3 + i)) % (o.w + 400) + o.w + 400) % (o.w + 400) - 200 + o.x0;
    const y = o.hz - o.H * (0.35 + hash(i * 5 + 1) * 0.55), s = o.w * (0.07 + hash(i * 13) * 0.07);
    for (let j = 0; j < 5; j++) {
      const cx = x + (j - 2) * s * 0.55, cy = y + Math.abs(j - 2) * s * 0.07, r = s * (0.5 - Math.abs(j - 2) * 0.09);
      const g = ctx.createRadialGradient(cx, cy - r * 0.2, r * 0.1, cx, cy, r); g.addColorStop(0, `rgba(255,255,255,${0.55 * amount})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.4, r * 0.62, 0, 0, TAU); ctx.fill();
    }
  }
}
export const BACKDROPS = {
  pali(ctx, o, W) {   // sea cliffs: fluted green ridges, a pale far island, surf and a palm beach
    ridge(ctx, o, { amp: o.H * 0.55, freq: 0.0035, par: 0.012, col: mix(W.haze, '#7aa6b8', 0.45), seed: 1, lift: o.H * 0.05 });
    const m = { amp: o.H * 0.78, freq: 0.005, par: 0.03, seed: 4, lift: 0 };
    ridge(ctx, o, { ...m, col: '#2f6b4f' });
    ctx.save(); ctx.beginPath(); ctx.rect(o.x0, o.hz - o.H * 1.2, o.w, o.H * 1.2); ctx.clip();
    ctx.strokeStyle = 'rgba(8,40,30,0.38)'; ctx.lineWidth = 2;
    for (let x = o.x0; x < o.x0 + o.w; x += 7) { const top = ridgeAt(o, x, m), len = (o.hz - top) * (0.35 + hash(Math.floor((x + o.off * 0.03) / 7) * 3) * 0.6); ctx.beginPath(); ctx.moveTo(x, top + 2); ctx.lineTo(x + 3, top + len); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(190,230,200,0.25)'; for (let x = o.x0 + 3; x < o.x0 + o.w; x += 13) { const top = ridgeAt(o, x, m), len = (o.hz - top) * 0.4; ctx.beginPath(); ctx.moveTo(x, top + 2); ctx.lineTo(x - 2, top + len); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = '#e9d9ae'; ctx.fillRect(o.x0, o.hz - 5, o.w, 7);
    const sp = 66, n0 = Math.floor((o.off * 0.06) / sp);
    for (let k = n0 - 1; k < n0 + o.w / sp + 3; k++) { const x = o.x0 + k * sp - o.off * 0.06 + hash(k) * 30; if (hash(k * 3 + 1) > 0.35) palm(ctx, x, o.hz - 3, o.H * (0.28 + hash(k * 5) * 0.2), '#244a2a', 0.3 * (hash(k) - 0.4), o.t, k); }
  },
  boreal(ctx, o, W) {
    ridge(ctx, o, { amp: o.H * 0.5, freq: 0.004, par: 0.01, col: mix(W.haze, '#8aa8b4', 0.5), seed: 7, lift: o.H * 0.04 });
    const rows = [{ par: 0.02, h: o.H * 0.42, sp: 22, col: '#4f7a78', seed: 2 }, { par: 0.04, h: o.H * 0.6, sp: 28, col: '#2b5a4c', seed: 3 }, { par: 0.07, h: o.H * 0.8, sp: 38, col: '#1d4638', seed: 5 }];
    for (const r of rows) { const n0 = Math.floor((o.off * r.par) / r.sp); for (let k = n0 - 1; k < n0 + o.w / r.sp + 3; k++) { const x = o.x0 + k * r.sp - o.off * r.par + hash(k + r.seed) * r.sp * 0.8; if (hash(k * 7 + r.seed) < 0.18) continue; pine(ctx, x, o.hz - 2, r.h * (0.7 + hash(k * 11 + r.seed) * 0.5), r.col, false); } }
    for (let k = 0; k < 14; k++) { const sx = ((hash(k * 3) * (o.w + 300) - o.off * 0.12) % (o.w + 300) + o.w + 300) % (o.w + 300) - 100 + o.x0, rw = o.H * (0.2 + hash(k * 5) * 0.3); ctx.fillStyle = k % 2 ? '#8a8a8c' : '#a09a94'; ctx.beginPath(); ctx.ellipse(sx, o.hz + 2, rw, rw * 0.32, 0, Math.PI, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(sx - rw * 0.2, o.hz - rw * 0.1, rw * 0.5, rw * 0.12, 0, Math.PI, TAU); ctx.fill(); }
  },
  winter(ctx, o, W) {
    ridge(ctx, o, { amp: o.H * 0.4, freq: 0.004, par: 0.01, col: mix(W.haze, '#9fb4c8', 0.5), seed: 8, lift: o.H * 0.05 });
    // a small town across the river
    const sp = 48; const n0 = Math.floor((o.off * 0.03) / sp);
    for (let k = n0 - 1; k < n0 + o.w / sp + 3; k++) { const x = o.x0 + k * sp - o.off * 0.03 + hash(k) * 20; if (hash(k * 3 + 1) < 0.45) { const w = sp * (0.4 + hash(k * 5) * 0.3), h = o.H * (0.18 + hash(k * 7) * 0.2); building(ctx, x, o.hz - o.H * 0.1, w, h, mix('#8a6a5a', '#c9b8a8', hash(k)), '#ffd98a'); ctx.fillStyle = '#f4f8fc'; ctx.beginPath(); ctx.moveTo(x - 2, o.hz - o.H * 0.1 - h); ctx.lineTo(x + w / 2, o.hz - o.H * 0.1 - h - o.H * 0.1); ctx.lineTo(x + w + 2, o.hz - o.H * 0.1 - h); ctx.fill(); } }
    const rows = [{ par: 0.03, h: o.H * 0.5, sp: 30, col: '#5d7d76', seed: 2 }, { par: 0.06, h: o.H * 0.85, sp: 44, col: '#2f5a4c', seed: 3 }];
    for (const r of rows) { const n0b = Math.floor((o.off * r.par) / r.sp); for (let k = n0b - 1; k < n0b + o.w / r.sp + 3; k++) { const x = o.x0 + k * r.sp - o.off * r.par + hash(k + r.seed) * r.sp * 0.8; if (hash(k * 7 + r.seed) < 0.3) continue; pine(ctx, x, o.hz - 2, r.h * (0.7 + hash(k * 11 + r.seed) * 0.5), r.col, true); } }
    ctx.fillStyle = '#eef4fa'; ctx.beginPath(); ctx.moveTo(o.x0, o.hz + 3); for (let x = o.x0; x <= o.x0 + o.w + 8; x += 8) ctx.lineTo(x, o.hz - 3 - 6 * noise((x + o.off * 0.1) * 0.02, 9)); ctx.lineTo(o.x0 + o.w + 8, o.hz + 3); ctx.fill();
  },
  beach(ctx, o, W) {
    ridge(ctx, o, { amp: o.H * 0.2, freq: 0.003, par: 0.012, col: mix(W.haze, '#c98a6a', 0.35), seed: 12, lift: o.H * 0.02 });
    ridge(ctx, o, { amp: o.H * 0.16, freq: 0.006, par: 0.03, col: '#e7bf8a', seed: 13 });
    const sp = 52, n0 = Math.floor((o.off * 0.05) / sp);
    for (let k = n0 - 1; k < n0 + o.w / sp + 3; k++) { const x = o.x0 + k * sp - o.off * 0.05 + hash(k) * 40; if (hash(k * 3 + 1) > 0.25) palm(ctx, x, o.hz - 2, o.H * (0.3 + hash(k * 5) * 0.3), '#2a3a2a', 0.25 * (hash(k * 7) - 0.4), o.t, k); }
    for (let k = 0; k < 5; k++) { const sx = ((hash(k + 40) * o.w * 1.5 - o.off * 0.01) % (o.w * 1.5) + o.w * 1.5) % (o.w * 1.5) - o.w * 0.2 + o.x0, s = o.H * (0.1 + hash(k) * 0.08); ctx.fillStyle = '#fff5e0'; ctx.beginPath(); ctx.moveTo(sx, o.hz - s * 1.6); ctx.lineTo(sx + s * 0.7, o.hz - s * 0.15); ctx.lineTo(sx - s * 0.3, o.hz - s * 0.15); ctx.fill(); }
  },
  nile(ctx, o, W) {
    ridge(ctx, o, { amp: o.H * 0.55, freq: 0.0032, par: 0.012, col: mix(W.haze, '#c8895a', 0.5), seed: 21, lift: o.H * 0.03 });
    ridge(ctx, o, { amp: o.H * 0.3, freq: 0.005, par: 0.03, col: '#b9824f', seed: 22 });
    const sp = 40, n0 = Math.floor((o.off * 0.05) / sp);
    for (let k = n0 - 1; k < n0 + o.w / sp + 3; k++) {
      const x = o.x0 + k * sp - o.off * 0.05 + hash(k) * 20, r = hash(k * 3 + 1);
      if (r < 0.3) { const w = sp * (0.5 + hash(k * 5) * 0.5), h = o.H * (0.14 + hash(k * 7) * 0.16); building(ctx, x, o.hz - 1, w, h, mix('#c9a074', '#e8cba0', hash(k * 9)), '#4a3220'); }
      else if (r < 0.85) palm(ctx, x, o.hz - 1, o.H * (0.35 + hash(k * 5) * 0.35), '#1f3f22', 0.15 * (hash(k * 7) - 0.5), o.t, k);
    }
    ctx.fillStyle = '#3f6a34'; ctx.fillRect(o.x0, o.hz - 3, o.w, 5);
  },
  delta(ctx, o, W) {
    ridge(ctx, o, { amp: o.H * 0.2, freq: 0.004, par: 0.012, col: mix(W.haze, '#8a9a5a', 0.4), seed: 31, lift: o.H * 0.02 });
    // umbrella thorn trees on the far bank
    const sp = 150, n0 = Math.floor((o.off * 0.03) / sp);
    for (let k = n0 - 1; k < n0 + o.w / sp + 3; k++) { if (hash(k * 9) < 0.35) continue; const x = o.x0 + k * sp - o.off * 0.03 + hash(k) * 90, h = o.H * (0.22 + hash(k * 3) * 0.16); ctx.strokeStyle = '#2a2418'; ctx.lineWidth = Math.max(2, h * 0.05); ctx.beginPath(); ctx.moveTo(x, o.hz); ctx.lineTo(x + h * 0.05, o.hz - h * 0.7); ctx.stroke(); ctx.fillStyle = '#3a4a28'; ctx.beginPath(); ctx.ellipse(x + h * 0.05, o.hz - h * 0.78, h * 0.62, h * 0.17, 0, 0, TAU); ctx.fill(); }
    // papyrus: dense curved stems with feathered heads
    for (const L of [{ par: 0.04, h: o.H * 0.4, sp: 10, col: '#6a8a3a', seed: 1 }, { par: 0.07, h: o.H * 0.6, sp: 14, col: '#3f5f26', seed: 2 }]) {
      const n0b = Math.floor((o.off * L.par) / L.sp);
      for (let k = n0b - 1; k < n0b + o.w / L.sp + 3; k++) {
        if (hash(k * 5 + L.seed) < 0.1) continue;
        const x = o.x0 + k * L.sp - o.off * L.par, h = L.h * (0.6 + hash(k * 7 + L.seed) * 0.6), lean = (hash(k * 3 + L.seed) - 0.5) * h * 0.3 + Math.sin(o.t * 0.8 + k) * h * 0.02;
        ctx.strokeStyle = L.col; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, o.hz + 1); ctx.quadraticCurveTo(x + lean * 0.4, o.hz - h * 0.6, x + lean, o.hz - h); ctx.stroke();
        for (let j = 0; j < 6; j++) { const a = -Math.PI * (0.1 + j * 0.16); ctx.beginPath(); ctx.moveTo(x + lean, o.hz - h); ctx.lineTo(x + lean + Math.cos(a) * h * 0.16, o.hz - h + Math.sin(a) * h * 0.1 + h * 0.05); ctx.stroke(); }
      }
    }
  },
  cays(ctx, o, W) {
    for (let k = 0; k < 6; k++) {   // low sand and palm islands
      const cx = ((hash(k + 70) * o.w * 1.6 - o.off * 0.02) % (o.w * 1.6) + o.w * 1.6) % (o.w * 1.6) - o.w * 0.3 + o.x0, w = o.w * (0.12 + hash(k) * 0.14);
      ctx.fillStyle = '#f2e6c4'; ctx.beginPath(); ctx.ellipse(cx, o.hz + 1, w, o.H * 0.05, 0, Math.PI, TAU); ctx.fill();
      ctx.fillStyle = '#3f7a44'; ctx.beginPath(); ctx.ellipse(cx, o.hz - o.H * 0.03, w * 0.8, o.H * 0.06, 0, Math.PI, TAU); ctx.fill();
      for (let j = 0; j < 3; j++) palm(ctx, cx + (j - 1) * w * 0.4, o.hz - o.H * 0.03, o.H * (0.2 + hash(k * 3 + j) * 0.2), '#1f4a28', 0.2 * (j - 1), o.t, k + j);
    }
    for (let k = 0; k < 4; k++) { const sx = ((hash(k + 90) * o.w * 1.4 - o.off * 0.015) % (o.w * 1.4) + o.w * 1.4) % (o.w * 1.4) - o.w * 0.2 + o.x0, s = o.H * (0.12 + hash(k) * 0.06); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(sx, o.hz - s * 1.8); ctx.lineTo(sx + s * 0.5, o.hz - s * 0.1); ctx.lineTo(sx - s * 0.2, o.hz - s * 0.1); ctx.fill(); ctx.fillStyle = '#d6e6ee'; ctx.beginPath(); ctx.moveTo(sx - s * 0.3, o.hz - s * 1.4); ctx.lineTo(sx - s * 0.3, o.hz - s * 0.1); ctx.lineTo(sx - s * 0.9, o.hz - s * 0.1); ctx.fill(); }
  },
  mangrove(ctx, o, W) {
    ridge(ctx, o, { amp: o.H * 0.4, freq: 0.004, par: 0.012, col: mix(W.haze, '#6a8a5a', 0.5), seed: 51, lift: o.H * 0.03 });
    ridge(ctx, o, { amp: o.H * 0.3, freq: 0.008, par: 0.035, col: '#2f5a34', seed: 52 });
    ridge(ctx, o, { amp: o.H * 0.2, freq: 0.012, par: 0.06, col: '#1d3f26', seed: 53, lift: -o.H * 0.04 });
    ctx.strokeStyle = '#2a2a1a'; ctx.lineWidth = 1.5;
    for (let x = o.x0; x < o.x0 + o.w; x += 9) { const kx = Math.floor((x + o.off * 0.06) / 9), h = o.H * (0.06 + hash(kx * 3) * 0.1); ctx.beginPath(); ctx.moveTo(x, o.hz - h); ctx.quadraticCurveTo(x + (hash(kx) - 0.5) * 8, o.hz - h * 0.4, x + (hash(kx * 5) - 0.5) * 14, o.hz + 2); ctx.stroke(); }
  },
};

// ---- water ------------------------------------------------------------------------------------------------------------------
export function waterPlane(ctx, o, W, ice) {
  const { x0, w, hz, bot, h } = o;
  const g = ctx.createLinearGradient(0, hz, 0, o.y0 + h);
  g.addColorStop(0, W.water[0]); g.addColorStop(0.35, W.water[1]); g.addColorStop(1, W.water[2]);
  ctx.fillStyle = g; ctx.fillRect(x0, hz, w, o.y0 + h - hz);
  // the sun's glitter path and the reflected sky near the horizon
  const sx = x0 + w * W.sun.x - o.off * 0.01;
  const gg = ctx.createLinearGradient(0, hz, 0, hz + (bot - hz) * 0.5); gg.addColorStop(0, alpha(W.haze, 0.55)); gg.addColorStop(1, alpha(W.haze, 0));
  ctx.fillStyle = gg; ctx.fillRect(x0, hz, w, (bot - hz) * 0.5);
  ctx.save(); ctx.beginPath(); ctx.rect(x0, hz, w, o.y0 + h - hz); ctx.clip(); ctx.translate(sx, hz + 2); ctx.scale(1, (bot - hz) * 0.9 / (w * 0.34));
  const r = ctx.createRadialGradient(0, 0, 2, 0, 0, w * 0.34); r.addColorStop(0, alpha(W.sun.c, 0.55)); r.addColorStop(0.5, alpha(W.sun.c, 0.14)); r.addColorStop(1, alpha(W.sun.c, 0));
  ctx.fillStyle = r; ctx.fillRect(-w, -w, w * 2, w * 2); ctx.restore();
  // crests: perspective lines scrolling with the course (nearer lines move faster and are longer)
  const K = 26;
  for (let k = 0; k < K; k++) {
    const d = (k + 0.5) / K, sc = 0.05 + d * d * 1.25, y = hz + (o.bot - hz) * sc;
    if (y > o.y0 + h) break;
    const spacing = (w * 0.16) * sc * 0.9 + 16, sp = o.ppm * sc, tcur = o.t * (o.current * 0.4 + 0.25) * sp;
    const ofs = o.camS * sp - tcur, n0 = Math.floor(ofs / spacing);
    ctx.lineWidth = Math.max(1, sc * 2.2); ctx.lineCap = 'round';
    for (let j = 0; j * spacing < w + spacing * 2; j++) {
      const key = n0 + j, x = x0 + (key * spacing - ofs) + 0, hh = hash(key * 31 + k * 7);
      if (hh < 0.35) continue;
      const len = spacing * (0.25 + hh * 0.45), near = Math.abs(x - sx) < w * 0.12 * (0.4 + sc);
      ctx.strokeStyle = alpha(near ? W.sun.c : '#ffffff', (0.12 + 0.26 * hh) * (0.5 + sc * 0.5) + (near ? 0.2 : 0));
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + len / 2, y - sc * 2.4, x + len, y); ctx.stroke();
    }
  }
  // glitter flecks around the sun
  for (let k = 0; k < 46; k++) {
    const d = hash(k * 3 + 1), sc = 0.04 + d * d * 0.9, y = hz + (o.bot - hz) * sc;
    const x = sx + (hash(k * 5 + 2) - 0.5) * w * 0.22 * (0.3 + sc), tw = 0.5 + 0.5 * Math.sin(o.t * (2 + hash(k) * 3) + k * 1.7);
    ctx.fillStyle = alpha(W.glints, 0.55 * tw * (1 - sc * 0.4)); ctx.fillRect(x, y, 2 + sc * 14 * hash(k + 9), 1 + sc * 1.4);
  }
  if (ice) { ctx.fillStyle = 'rgba(220,240,255,0.06)'; ctx.fillRect(x0, hz, w, o.y0 + h - hz); }
}
export function floe(ctx, x, y, s, seed, t) {
  const n = 7, pts = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU + hash(seed + i) * 0.5, r = s * (0.7 + hash(seed * 3 + i) * 0.5); pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 0.22]); }
  ctx.beginPath(); smooth(ctx, [...pts, pts[0]], true); ctx.closePath();
  ctx.fillStyle = '#e9f2f8'; ctx.fill();
  ctx.fillStyle = 'rgba(95,140,175,0.5)'; ctx.beginPath(); ctx.ellipse(x, y + s * 0.1, s * 0.85, s * 0.1, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x - s * 0.1, y - s * 0.05, s * 0.55, s * 0.08, 0, 0, TAU); ctx.fill();
  void t;
}
export function lily(ctx, x, y, s, seed, flower) {
  ctx.fillStyle = hash(seed) > 0.5 ? '#3f7a34' : '#58903c'; ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.24, 0, 0.25, TAU - 0.05); ctx.lineTo(x, y); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(x - s * 0.15, y - s * 0.04, s * 0.45, s * 0.07, 0, 0, TAU); ctx.fill();
  if (flower) { ctx.fillStyle = '#f2a6c4'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(x + (i - 2) * s * 0.07, y - s * 0.13 - Math.abs(i - 2) * s * -0.02, s * 0.06, s * 0.12, (i - 2) * 0.3, 0, TAU); ctx.fill(); } ctx.fillStyle = '#ffe58a'; ctx.beginPath(); ctx.arc(x, y - s * 0.1, s * 0.05, 0, TAU); ctx.fill(); }
}

// ---- effects ----------------------------------------------------------------------------------------------------------------
export function wake(ctx, S, st, def, t, ice) {
  const v = clamp(st.v, 0, 1.05);
  if (v < 0.08) return;
  const stern = def.stern * S, bow = def.bow * S, wl = 0.012 * S;
  const col = ice ? '235,246,255' : '255,255,255';
  // stern wake: a spreading V of foam streaks
  for (let k = 0; k < 11; k++) {
    const f = k / 10, x = stern - f * S * (0.35 + 0.5 * v), spread = (0.012 + f * 0.05) * S * (0.5 + v), a = (1 - f) * 0.5 * Math.min(1, v * 1.5);
    ctx.fillStyle = `rgba(${col},${a})`; ctx.beginPath(); ctx.ellipse(x, wl + Math.sin(t * 2 + k) * 0.7, S * 0.05 * (1 + f), Math.max(1.2, spread * 0.22), 0, 0, TAU); ctx.fill();
    for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x - S * 0.02, wl + sgn * spread * 0.55, S * 0.04, Math.max(0.8, spread * 0.06), 0, 0, TAU); ctx.fill(); }
  }
  // bow wave
  const bh = S * 0.018 * (0.4 + v * 1.1);
  ctx.fillStyle = `rgba(${col},${0.5 + 0.3 * v})`;
  ctx.beginPath(); ctx.moveTo(bow - S * 0.04, wl); ctx.quadraticCurveTo(bow + S * 0.02, wl - bh * 1.5, bow + S * (0.03 + 0.05 * v), wl - bh * 0.2); ctx.quadraticCurveTo(bow + S * 0.02, wl + bh * 0.5, bow - S * 0.06, wl + bh * 0.5); ctx.closePath(); ctx.fill();
  for (let k = 0; k < 4; k++) { ctx.strokeStyle = `rgba(${col},${0.35 - k * 0.06})`; ctx.lineWidth = Math.max(1, S * 0.003); ctx.beginPath(); ctx.ellipse(bow + S * 0.02 + k * S * 0.014, wl + S * 0.002, S * (0.02 + k * 0.02), S * (0.006 + k * 0.006), 0, -1.2, 1.2); ctx.stroke(); }
  // hull-side foam line
  ctx.strokeStyle = `rgba(${col},0.55)`; ctx.lineWidth = Math.max(1.4, S * 0.005); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(stern * 0.92, wl + 1); ctx.quadraticCurveTo(0, wl + S * 0.006, bow * 0.95, wl); ctx.stroke();
}
export function splash(ctx, S, st, tips, t) {
  if (!tips || !tips.length) return;
  const power = st.v;
  tips.forEach(([x, y], i) => {
    const cyc = ((st.ph / TAU + i * 0.037) % 1 + 1) % 1;
    if (cyc > 0.14 && cyc < 0.62) { // the blade is in the water: a ring and a trailing swirl
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = Math.max(1, S * 0.003); ctx.beginPath(); ctx.ellipse(x, y + S * 0.004, S * 0.022, S * 0.006, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(x - S * 0.03 * (cyc - 0.1) * 6, y + S * 0.004, S * 0.03 * (cyc - 0.1) * 5 + 4, S * 0.005, 0, 0, TAU); ctx.fill();
    }
    const e = (cyc - 0.55) / 0.2;   // the lift-off: droplets flung off the blade
    if (e > 0 && e < 1) for (let d = 0; d < 6; d++) {
      const a = 0.4 + hash(i * 9 + d) * 1.0, sp = S * (0.02 + hash(d * 3 + 1) * 0.03) * (0.6 + power), px = x - Math.cos(a) * sp * e * 3, py = y - Math.sin(a) * sp * e * 4 + e * e * S * 0.03;
      ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - e)})`; ctx.beginPath(); ctx.arc(px, py, Math.max(1, S * 0.004 * (1 - e * 0.5)), 0, TAU); ctx.fill();
    }
    void t;
  });
}

// ---- obstacles and lines ----------------------------------------------------------------------------------------------------
export function buoy(ctx, x, y, s, col, passed, t, flagged) {
  ctx.globalAlpha = passed ? 0.4 : 1;
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(x, y + s * 0.02, s * 0.2, s * 0.05, 0, 0, TAU); ctx.fill();
  const b = Math.sin(t * 2 + x * 0.03) * s * 0.02;
  if (flagged) { ctx.strokeStyle = '#4a3320'; ctx.lineWidth = Math.max(1.5, s * 0.03); ctx.beginPath(); ctx.moveTo(x, y - s * 0.05 + b); ctx.lineTo(x, y - s * 0.62 + b); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - s * 0.62 + b); ctx.lineTo(x + s * 0.22, y - s * 0.52 + b); ctx.lineTo(x, y - s * 0.42 + b); ctx.fill(); }
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y - s * 0.07 + b, s * 0.13, s * 0.15, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(x - s * 0.13, y - s * 0.09 + b, s * 0.26, s * 0.04);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(x - s * 0.04, y - s * 0.12 + b, s * 0.04, s * 0.06, 0, 0, TAU); ctx.fill();
  ctx.globalAlpha = 1;
}
export function crestBand(ctx, x, y, s, t, passed) {
  ctx.globalAlpha = passed ? 0.35 : 0.9; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.5, s * 0.03); ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x + (i - 1.5) * s * 0.22, y - s * 0.02 + Math.sin(t * 4 + i) * 2, s * 0.14, 3.3, 6.1); ctx.stroke(); }
  ctx.globalAlpha = 1;
}
export function logItem(ctx, x, y, s, passed) {
  ctx.globalAlpha = passed ? 0.4 : 1;
  ctx.fillStyle = '#6a4424'; ctx.beginPath(); ctx.ellipse(x, y - s * 0.02, s * 0.36, s * 0.07, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#8a6034'; ctx.beginPath(); ctx.ellipse(x - s * 0.04, y - s * 0.05, s * 0.28, s * 0.03, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x - s * 0.38, y, s * 0.76, 2);
  ctx.globalAlpha = 1;
}

// ---- the chase view ---------------------------------------------------------------------------------------------------------
// o = { craft:{id,def,world,colors}, t, camS, L, racers:[{s,lane,lat,color,me,v,ph,q,trim,heel,id}], playerLane, obstacles, rough, current, title, hitT, ppmGain }
export function drawChase(ctx, V0, o) {
  const def = o.craft.def, W = o.craft.world, ice = !!(def.ice || W.floes);
  const t = o.t, w = V0.w, h = V0.h, x0 = V0.x, y0 = V0.y;
  const wide = w / h > 1.4;
  const C = o.cfg ?? {};
  const hz = y0 + h * (wide ? (C.hzW ?? 0.3) : (C.hz ?? 0.355)), bot = y0 + h * (wide ? (C.botW ?? 0.86) : (C.bot ?? 0.9));
  const hMax = bot - (y0 + (o.title ? 8 : 92));
  const S1 = Math.min(w * (wide ? (C.heroWW ?? 0.58) : (C.heroW ?? 0.66)), (hMax * 0.92) / Math.max(0.3, def.h), (bot - hz) * (wide ? 2.3 : 1.75) * (C.depth ?? 1));
  const ppm = S1 / def.len;
  const anchor = x0 + w * (o.title ? 0.46 : (wide ? (C.anchorW ?? C.anchor ?? 0.4) : (C.anchor ?? 0.4)));
  const camS = o.camS;
  const rows = [], mine = o.racers.find((r) => r.me);
  const others = o.racers.filter((r) => !r.me).sort((a, b) => a.lane - b.lane);
  const n = others.length + 1;
  const scFar = wide ? (C.scFarW ?? 0.4) : C.scFar ?? (n <= 2 ? 0.64 : n <= 4 ? 0.52 : 0.44);
  const scOf = (r) => (n === 1 ? 1 : scFar + (1 - scFar) * Math.pow(r / (n - 1), 1.12));
  others.forEach((rc, i) => rows.push({ rc, r: i }));
  if (mine) rows.push({ rc: mine, r: n - 1 });
  const geo = { x0, w, hz, bot, y0, h, ppm, camS, t, off: camS * ppm, current: o.current ?? 0 };
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
  // sky
  const sg = ctx.createLinearGradient(0, y0, 0, hz); sg.addColorStop(0, W.sky[0]); sg.addColorStop(1, W.sky[1]); ctx.fillStyle = sg; ctx.fillRect(x0, y0, w, hz - y0 + 1);
  const sx = x0 + w * W.sun.x - geo.off * 0.01, sy = hz - (hz - y0) * W.sun.y * 0.6, sr = Math.min(w, h) * W.sun.r;
  const sgl = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 7); sgl.addColorStop(0, alpha(W.sun.c, 0.75)); sgl.addColorStop(0.15, alpha(W.sun.c, 0.35)); sgl.addColorStop(1, alpha(W.sun.c, 0));
  ctx.fillStyle = sgl; ctx.fillRect(x0, y0, w, hz - y0 + 1);
  ctx.fillStyle = W.sun.c; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();
  const bd = { x0, w, hz, H: Math.min(h * 0.2, hz - y0 - 12), t, off: geo.off };
  clouds(ctx, bd, w, W.clouds, t);
  (C.backdrop ?? BACKDROPS[W.backdrop] ?? BACKDROPS.cays)(ctx, bd, W);
  // haze where water meets land
  const hh = ctx.createLinearGradient(0, hz - bd.H * 0.35, 0, hz + 3); hh.addColorStop(0, alpha(W.haze, 0)); hh.addColorStop(1, alpha(W.haze, 0.55)); ctx.fillStyle = hh; ctx.fillRect(x0, hz - bd.H * 0.35, w, bd.H * 0.35 + 3);
  if (C.water) C.water(ctx, { ...geo, ppm }, W, o); else waterPlane(ctx, { ...geo, ppm }, W, ice);
  // a far fleet near the horizon: small craft of the same kind drifting by, for depth and life
  for (let k = 0; k < (C.fleet ?? 4); k++) {
    const sc = 0.1 + 0.035 * k, Sf = S1 * sc, wsp = (w * 1.3) / Math.max(0.1, 1), px = x0 + ((hash(k * 19 + 3) * wsp - camS * ppm * sc * 0.9 - t * (4 + k)) % wsp + wsp) % wsp - w * 0.15;
    if (px < x0 - Sf || px > x0 + w + Sf) continue;
    ctx.save(); ctx.translate(px, hz + (bot - hz) * sc + 2); const st0 = { t, ph: px * 0.05 + k, v: 0.4, color: ['#e8453a', '#f2c14e', '#2d7bd6', '#f4f0e4'][k % 4], q: 0.7, trim: 0.3, heel: 0.03, id: k + 5, hull: o.craft.hull, sail: o.craft.sail, skins: o.craft.skins };
    ctx.globalAlpha = 0.9; def.draw(ctx, Sf, st0); ctx.globalAlpha = 1;
    ctx.restore();
  }
  // rough water
  for (const rg of o.rough ?? []) {
    const a = (s, sc) => anchor + (s - camS) * ppm * sc;
    const fa = a(rg.from, 0.2), fb = a(rg.to, 0.2), na = a(rg.from, 1.2), nb = a(rg.to, 1.2);
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.moveTo(fa, hz + 4); ctx.lineTo(fb, hz + 4); ctx.lineTo(nb, y0 + h); ctx.lineTo(na, y0 + h); ctx.closePath(); ctx.fill();
  }
  // start and finish lines drawn between the first and last row
  const ySc = (sc) => hz + (bot - hz) * sc;
  const xRow = (s, sc) => anchor + (s - camS) * ppm * sc;
  const lineAt = (s, col, lw, post) => {
    const xa = xRow(s, scOf(0) * 0.9), xb = xRow(s, 1.08), ya = ySc(scOf(0) * 0.9), yb = ySc(1.08);
    if (Math.max(xa, xb) < x0 - 40 || Math.min(xa, xb) > x0 + w + 40) return;
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xb, yb); ctx.stroke();
    if (post) {
      const ph = S1 * 0.4;
      for (const [x, y, sc] of [[xa, ya, scOf(0) * 0.9], [xb, yb, 1.08]]) { ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = Math.max(2, 5 * sc); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - ph * sc); ctx.stroke(); }
      // checkered banner between the posts
      const fy = (sc) => ySc(sc) - ph * sc * 0.96;
      const N = 14;
      for (let i = 0; i < N; i++) {
        const u0 = i / N, u1 = (i + 1) / N, X = (u) => lerp(xa, xb, u), Y = (u) => lerp(fy(scOf(0) * 0.9), fy(1.08), u), bh = (u) => ph * 0.12 * lerp(scOf(0) * 0.9, 1.08, u);
        for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#fff' : '#1a1a1a'; ctx.beginPath(); ctx.moveTo(X(u0), Y(u0) + bh(u0) * j / 2); ctx.lineTo(X(u1), Y(u1) + bh(u1) * j / 2); ctx.lineTo(X(u1), Y(u1) + bh(u1) * (j + 1) / 2); ctx.lineTo(X(u0), Y(u0) + bh(u0) * (j + 1) / 2); ctx.closePath(); ctx.fill(); }
      }
    }
  };
  lineAt(0, 'rgba(255,255,255,0.8)', 4, false);
  if (o.L - camS < (w / ppm) * 1.2 && o.L - camS > -w / ppm) lineAt(o.L, 'rgba(255,255,255,0.9)', 5, true);
  // rows far to near
  const list = rows.map((rw) => ({ ...rw, sc: scOf(rw.r) }));
  for (const rw of list) {
    const { rc, sc } = rw, S = S1 * sc, y = ySc(sc) + (rc.lat ?? 0) * S * 0.05;
    const x = xRow(rc.s, sc);
    // decorations living in this depth row: floes, lilies
    const lane = (key, spacing, fn) => {
      const wsp = spacing * ppm * sc, ofs = camS * ppm * sc, n0 = Math.floor(ofs / wsp);
      for (let j = -1; j * wsp < w + wsp; j++) { const key2 = n0 + j; const px = x0 + key2 * wsp - ofs + (hash(key2 * 3 + rw.r * 17) - 0.5) * wsp * 0.5; if (hash(key2 * 7 + rw.r * 5 + key) > 0.55) fn(px, y + (hash(key2 * 11 + rw.r) - 0.5) * S * 0.18, key2); }
    };
    if (W.floes) lane(1, 7, (px, py, k) => floe(ctx, px, py, S * (0.1 + hash(k) * 0.22), k + rw.r * 13, t));
    if (W.lilies) lane(2, 5, (px, py, k) => lily(ctx, px, py, S * (0.05 + hash(k) * 0.07), k, hash(k * 5) > 0.7));
    // obstacles in this row
    for (const ob of o.obstacles ?? []) {
      const ox = xRow(ob.at, sc);
      if (ox < x0 - 40 || ox > x0 + w + 40) continue;
      const passed = ob.at < (mine ? mine.s : 0) && !o.title;
      const kind = ob.kind;
      if (kind === 'waves' || kind === 'rapids' || kind === 'snowdrift') crestBand(ctx, ox, y, S * 0.5, t, passed);
      else if (kind === 'log' || kind === 'hurdle') logItem(ctx, ox, y, S * 0.5, passed);
      else buoy(ctx, ox, y, S * 0.5, rw.r % 2 ? '#e8453a' : '#f2c14e', passed, t, kind === 'gate' || kind === 'buoy');
    }
    const bob = Math.sin(t * 1.9 + rw.r * 1.7 + (rc.id ?? 0)) * S * 0.004 * (0.4 + (rc.v ?? 0)) + (o.hitT && rc.me ? Math.sin(t * 40) * S * 0.006 * o.hitT : 0);
    const pitch = Math.sin(t * 1.3 + rw.r) * 0.006 + (rc.v ?? 0) * -0.012;
    // hull shadow in the water and the reflection
    if (C.shadow) C.shadow(ctx, x, y, S, rc); else { ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, y + S * 0.03, S * 0.46, S * 0.026, 0, 0, TAU); ctx.fill(); }
    let reflect = false;
    ctx.save(); ctx.translate(x, y + bob); ctx.rotate(pitch);
    wake(ctx, S, { v: rc.v ?? 0 }, def, t, ice);
    reflect = true;
    ctx.save(); ctx.beginPath(); ctx.rect(-S, -S * 1.6, S * 2, S * 1.6 + S * def.below * 0.0 + S * 0.012); ctx.restore();
    const st = { t, ph: rc.ph ?? 0, v: rc.v ?? 0, color: rc.color, q: rc.q ?? 0.7, trim: rc.trim ?? 0, heel: rc.heel ?? 0, id: rc.id ?? 0, hull: o.craft.hull, sail: o.craft.sail, trim2: o.craft.trim, skins: o.craft.skins };
    if (reflect && !C.noReflect) {   // a soft mirrored copy on the water
      ctx.save(); ctx.beginPath(); ctx.rect(-w, S * 0.014, w * 2, S * 0.9); ctx.clip(); ctx.translate(0, S * 0.014); ctx.scale(1, -0.3); ctx.globalAlpha = 0.17; def.draw(ctx, S, st); ctx.restore();
    }
    const out = def.draw(ctx, S, st);
    splash(ctx, S, st, out?.tips, t);
    ctx.restore();
    if (rc.me && !o.title && o.marker) o.marker(ctx, x, y - S * 0.4, S);
  }
  if (C.fg) C.fg(ctx, { ...geo, S1, anchor, rows: list, w, h }, W, o);
  // fog of distance on the far row and a gentle dark vignette for depth
  const vg = ctx.createLinearGradient(0, y0 + h * 0.72, 0, y0 + h); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, C.vig !== undefined ? `rgba(0,10,20,${C.vig})` : C.fg ? 'rgba(0,10,20,0.1)' : 'rgba(0,10,20,0.3)'); ctx.fillStyle = vg; ctx.fillRect(x0, y0 + h * 0.72, w, h * 0.28);
  const vt = ctx.createLinearGradient(0, y0, 0, y0 + h * 0.3); vt.addColorStop(0, 'rgba(0,10,25,0.38)'); vt.addColorStop(1, 'rgba(0,10,25,0)'); ctx.fillStyle = vt; ctx.fillRect(x0, y0, w, h * 0.3);
  ctx.restore();
  return { S1, ppm, hz, bot };
}

export { CRAFTS };

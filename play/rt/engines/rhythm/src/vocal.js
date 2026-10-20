// The human voice as a play surface (layout "voice"): yodel, throat singing and whistled speech.
// There is NO singer and no face. The voice is drawn as what it does in the landscape: a ladder of pitch bands (chest register
// below, head register above, a break marker between), a resonance glyph on every band (an open vowel disc with rings that
// leave it), and the landscape answering: the valley echo of a yodel, the overtone lines and the narrow resonance lens of throat
// singing over a steady fundamental, and the sound of a whistled message crossing a ravine to the far hillside.
// Lanes: tap a band to sing that pitch. Echo ghosts (the far side answering a moment later) are presentation only.
import { clamp, mix, rgba, lighter, darker, glow, rrect, grain, hgrad, vgrad, rgrad, hash, ell, circ, text, TAU } from './art.js';
import { stageIdFor } from './registry.js';
import { makeBox, rectSpot, finishSpots, hitSpots, pill } from './stagekit.js';

export const IDS = [[/throat|khoomei|khoomii|khoomi|overtone|kargyraa|sygyt|xoomei|diphonic/, 'throat'], [/whistl|silbo|sfyria|kuskoy|gomera|relay/, 'whistle']];
export const vocalId = (key) => stageIdFor('voice', key);   // routes live in registry.js; new voices: registerVoiceStage

const smooth = (t) => t * t * (3 - 2 * t);
const vnoise = (x, seed) => { const i = Math.floor(x), f = x - i; return hash(i + seed * 31.7) * (1 - smooth(f)) + hash(i + 1 + seed * 31.7) * smooth(f); };
const fbm = (x, seed, o = 4) => { let a = 0.5, s = 0, f = 1; for (let k = 0; k < o; k++) { s += a * vnoise(x * f, seed + k * 7); a *= 0.5; f *= 2.05; } return s / 0.9375; };
const ridged = (x, seed) => 1 - Math.abs(2 * fbm(x, seed, 3) - 1);

// a mountain ridge across the area: returns the sampled skyline so snow, trees and houses can sit on it
function ridge(ctx, A, base, amp, freq, seed, top, bot, o = {}) {
  const pts = [], step = Math.max(3, A.w / 120);
  for (let x = A.x - step; x <= A.x + A.w + step; x += step) {
    const n = o.sharp ? ridged((x - A.x) * freq + (o.shift ?? 0), seed) : fbm((x - A.x) * freq + (o.shift ?? 0), seed);
    pts.push([x, A.y + A.h * base - amp * A.h * n]);
  }
  ctx.beginPath(); ctx.moveTo(pts[0][0], A.y + A.h + 4);
  for (const p of pts) ctx.lineTo(p[0], p[1]);
  ctx.lineTo(pts[pts.length - 1][0], A.y + A.h + 4); ctx.closePath();
  ctx.fillStyle = vgrad(ctx, A.y + A.h * (base - amp), A.y + A.h * (base + 0.2), [[0, top], [1, bot]]); ctx.fill();
  if (o.snow) {
    // snow lies between the crest and a ragged snow line; the left faces are lit, the right faces in blue shade
    const line = A.y + A.h * (base - amp * o.snow), bot = (k) => Math.max(pts[k][1], line + A.h * 0.07 * (fbm((pts[k][0] - A.x) * 0.012 + seed, seed + 9) - 0.5) * 2 + 7 * Math.abs(Math.sin(pts[k][0] * 0.31 + seed)) + (hash(k + seed) - 0.5) * 8);
    ctx.save();
    ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    for (let k = pts.length - 1; k >= 0; k--) ctx.lineTo(pts[k][0], bot(k));
    ctx.closePath();
    ctx.fillStyle = vgrad(ctx, A.y + A.h * (base - amp), line + 20, [[0, '#ffffff'], [1, o.snowShade ?? '#dfe8f6']]); ctx.fill();
    // couloirs: narrow tongues of snow running down the rock below the snow line
    ctx.fillStyle = 'rgba(245,250,255,0.85)';
    for (let k = 3; k < pts.length - 3; k += 3) {
      if (pts[k][1] >= line || hash(k * 1.7 + seed) > 0.4) continue;
      const x = pts[k][0], y0 = bot(k), len = A.h * (0.012 + 0.035 * hash(k + 4 + seed));
      ctx.beginPath(); ctx.moveTo(x - 3, y0 - 2); ctx.lineTo(x + 2 + hash(k) * 4, y0 + len); ctx.lineTo(x + 5, y0 - 2); ctx.closePath(); ctx.fill();
    }
    ctx.clip();
    for (let k = 2; k < pts.length - 2; k++) { // shade the right-hand slope of every crest
      if (pts[k][1] < pts[k - 1][1] && pts[k][1] <= pts[k + 1][1] && pts[k][1] < line) {
        const [x, y] = pts[k], span = Math.max(14, A.w * 0.045);
        ctx.fillStyle = 'rgba(90,120,170,0.28)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + span, bot(Math.min(pts.length - 1, k + 4)) + 4); ctx.lineTo(x, line + 30); ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
  }
  if (o.edge) { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.strokeStyle = o.edge; ctx.lineWidth = 1.6; ctx.stroke(); }
  return pts;
}
const trees = (ctx, pts, A, col, size, seed, density = 0.5) => {
  ctx.fillStyle = col;
  for (let k = 0; k < pts.length; k++) {
    if (hash(k * 3.1 + seed) > density) continue;
    const [x, y] = pts[k], s = size * (0.7 + 0.6 * hash(k + seed));
    ctx.beginPath(); ctx.moveTo(x, y - s * 1.9); ctx.lineTo(x + s * 0.5, y + 2); ctx.lineTo(x - s * 0.5, y + 2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, y - s * 1.2); ctx.lineTo(x + s * 0.62, y + 2); ctx.lineTo(x - s * 0.62, y + 2); ctx.closePath(); ctx.fill();
  }
};
const cloud = (ctx, x, y, s, a) => {
  ctx.save(); ctx.globalAlpha = a;
  for (const [dx, dy, r] of [[0, 0, 1], [0.8, -0.2, 0.8], [-0.8, 0.1, 0.7], [1.5, 0.15, 0.55]]) { ctx.fillStyle = rgrad(ctx, x + dx * s, y + dy * s, 0, s * r, [[0, 'rgba(255,255,255,0.95)'], [1, 'rgba(255,255,255,0)']]); circ(ctx, x + dx * s, y + dy * s, s * r); ctx.fill(); }
  ctx.restore();
};
const chalet = (ctx, x, y, s, lit) => {
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, x + s * 0.1, y + 2, s * 0.8, s * 0.12); ctx.fill();
  ctx.fillStyle = vgrad(ctx, y - s * 0.6, y, [[0, '#8a5a30'], [1, '#5a3418']]); ctx.fillRect(x - s * 0.55, y - s * 0.6, s * 1.1, s * 0.6);
  ctx.strokeStyle = 'rgba(40,20,8,0.5)'; ctx.lineWidth = 1; for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x - s * 0.55, y - s * 0.12 * k); ctx.lineTo(x + s * 0.55, y - s * 0.12 * k); ctx.stroke(); }
  ctx.fillStyle = '#3a2210'; ctx.beginPath(); ctx.moveTo(x - s * 0.75, y - s * 0.55); ctx.lineTo(x, y - s * 1.1); ctx.lineTo(x + s * 0.75, y - s * 0.55); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f4f0e6'; ctx.fillRect(x - s * 0.75, y - s * 0.6, s * 1.5, s * 0.05);
  ctx.fillStyle = lit ? '#ffd27a' : '#e8c070'; ctx.fillRect(x - s * 0.3, y - s * 0.42, s * 0.22, s * 0.2);
  if (lit) glow(ctx, x - s * 0.2, y - s * 0.32, s * 0.7, '#ffcf70', 0.35);
  ctx.fillStyle = '#2a1608'; ctx.fillRect(x + s * 0.15, y - s * 0.38, s * 0.22, s * 0.38);
};
const ger = (ctx, x, y, s, lit, t) => {
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, x + s * 0.1, y + 3, s * 1.0, s * 0.14); ctx.fill();
  ctx.fillStyle = vgrad(ctx, y - s * 0.55, y, [[0, '#f4efe0'], [1, '#c8bfa4']]); rrect(ctx, x - s * 0.8, y - s * 0.55, s * 1.6, s * 0.55, 4); ctx.fill();
  ctx.fillStyle = vgrad(ctx, y - s * 1.05, y - s * 0.5, [[0, '#fbf6e8'], [1, '#d6ccb0']]);
  ctx.beginPath(); ctx.moveTo(x - s * 0.9, y - s * 0.5); ctx.quadraticCurveTo(x, y - s * 1.35, x + s * 0.9, y - s * 0.5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#a02a22'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - s * 0.9, y - s * 0.5); ctx.lineTo(x + s * 0.9, y - s * 0.5); ctx.stroke();
  ctx.strokeStyle = '#2a3a8a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - s * 0.8, y - s * 0.25); ctx.lineTo(x + s * 0.8, y - s * 0.25); ctx.stroke();
  ctx.fillStyle = '#b02a22'; rrect(ctx, x - s * 0.14, y - s * 0.4, s * 0.28, s * 0.4, 3); ctx.fill();
  ctx.fillStyle = '#d8a030'; ctx.fillRect(x - s * 0.1, y - s * 0.34, s * 0.2, s * 0.05);
  ctx.fillStyle = '#4a3a2a'; ctx.fillRect(x + s * 0.3, y - s * 1.2, s * 0.06, s * 0.35);
  if (lit) glow(ctx, x, y - s * 0.2, s * 0.9, '#ffb060', 0.28);
  ctx.strokeStyle = 'rgba(210,200,190,0.35)'; ctx.lineWidth = 6; ctx.beginPath(); for (let k = 0; k < 8; k++) { const q = (t * 0.3 + k * 0.125) % 1; ctx.lineTo(x + s * 0.33 + Math.sin(q * 7 + k) * s * 0.1 * q, y - s * 1.2 - q * s * 1.1); } ctx.globalAlpha = 0.45; ctx.stroke(); ctx.globalAlpha = 1;
};

// ---- the three landscapes (screen space, whole area) ----------------------------------------------------------------------------
function skyAlps(ctx, A, t, echo) {
  ctx.fillStyle = vgrad(ctx, A.y, A.y + A.h, [[0, '#1d3f78'], [0.35, '#4f86c4'], [0.62, '#f2c2a0'], [0.8, '#f6d9b0'], [1, '#7aa66a']]); ctx.fillRect(A.x, A.y, A.w, A.h);
  glow(ctx, A.x + A.w * 0.74, A.y + A.h * 0.5, A.h * 0.5, '#ffd8a0', 0.65);
  cloud(ctx, A.x + ((t * 6) % (A.w + 300)) - 150, A.y + A.h * 0.2, A.h * 0.07, 0.8); cloud(ctx, A.x + ((t * 4 + 300) % (A.w + 300)) - 150, A.y + A.h * 0.31, A.h * 0.055, 0.6);
  const far = ridge(ctx, A, 0.62, 0.42, 0.011, 3, '#8aa6d0', '#c9d6ec', { sharp: true, snow: 0.55, snowShade: '#cfdcf2', shift: 40 });
  ridge(ctx, A, 0.7, 0.22, 0.016, 8, '#4b6e9a', '#8fb0c8', { sharp: true, snow: 0.8, snowShade: '#c3d3ea', shift: 3 });
  // valley mist
  ctx.fillStyle = vgrad(ctx, A.y + A.h * 0.6, A.y + A.h * 0.78, [[0, 'rgba(255,240,225,0)'], [0.6, 'rgba(255,240,225,0.5)'], [1, 'rgba(255,240,225,0)']]); ctx.fillRect(A.x, A.y + A.h * 0.6, A.w, A.h * 0.18);
  const mid = ridge(ctx, A, 0.8, 0.13, 0.02, 14, '#3a6a52', '#1f4a38', { shift: 9 });
  trees(ctx, mid, A, '#183c2c', A.h * 0.018, 5, 0.6);
  const near = ridge(ctx, A, 0.93, 0.07, 0.012, 21, '#6cae4e', '#2f6a30', { shift: 70 });
  ctx.fillStyle = 'rgba(255,230,120,0.7)'; for (let k = 0; k < 40; k++) { const p = near[Math.floor(hash(k) * near.length)]; if (!p) continue; circ(ctx, p[0] + hash(k + 3) * 6, p[1] + 8 + hash(k + 9) * A.h * 0.05, 1.8); ctx.fill(); }
  ctx.fillStyle = 'rgba(240,120,150,0.8)'; for (let k = 0; k < 22; k++) { const p = near[Math.floor(hash(k + 77) * near.length)]; if (!p) continue; circ(ctx, p[0] + hash(k + 5) * 6, p[1] + 10 + hash(k + 19) * A.h * 0.05, 2.1); ctx.fill(); }
  chalet(ctx, A.x + A.w * 0.12, A.y + A.h * 0.935, clamp(A.h * 0.075, 36, 70), echo > 0.1);
  // the far peaks light up softly when the echo returns
  if (echo > 0.02) { ctx.save(); ctx.globalAlpha = echo * 0.5; for (let k = 0; k < far.length; k += 6) { const p = far[k]; glow(ctx, p[0], p[1] + 8, A.h * 0.09, '#fff2d0', 0.4); } ctx.restore(); }
}
function skySteppe(ctx, A, t, echo) {
  ctx.fillStyle = vgrad(ctx, A.y, A.y + A.h, [[0, '#101a3a'], [0.4, '#3a3a78'], [0.62, '#c46a58'], [0.74, '#f0a868'], [1, '#2a3a22']]); ctx.fillRect(A.x, A.y, A.w, A.h);
  for (let k = 0; k < 46; k++) { const x = A.x + hash(k) * A.w, y = A.y + hash(k + 50) * A.h * 0.5, tw = 0.5 + 0.5 * Math.sin(t * 1.6 + k); ctx.fillStyle = `rgba(255,255,240,${0.25 + 0.4 * tw * hash(k + 9)})`; circ(ctx, x, y, 0.8 + hash(k + 3) * 1.2); ctx.fill(); }
  glow(ctx, A.x + A.w * 0.3, A.y + A.h * 0.66, A.h * 0.55, '#ffc080', 0.7);
  ctx.fillStyle = rgrad(ctx, A.x + A.w * 0.3, A.y + A.h * 0.64, 0, A.h * 0.07, [[0, '#fff6d8'], [1, '#ffb868']]); circ(ctx, A.x + A.w * 0.3, A.y + A.h * 0.64, A.h * 0.07); ctx.fill();
  ridge(ctx, A, 0.7, 0.3, 0.012, 31, '#6a6a9a', '#c08a8a', { sharp: true, snow: 0.6, snowShade: '#f0c0b8', shift: 11 });
  ridge(ctx, A, 0.78, 0.1, 0.018, 36, '#4a4a68', '#6a4a50', { shift: 5 });
  ridge(ctx, A, 0.86, 0.06, 0.016, 41, '#3a4a2c', '#2a3a1e', { shift: 20 });
  const near = ridge(ctx, A, 0.94, 0.05, 0.014, 47, '#586a2e', '#1f2c14', { shift: 33 });
  ctx.strokeStyle = 'rgba(200,210,120,0.4)'; ctx.lineWidth = 1.2;
  for (let k = 0; k < 70; k++) { const p = near[Math.floor(hash(k + 3) * near.length)]; if (!p) continue; const y = p[1] + 6 + hash(k) * A.h * 0.05; ctx.beginPath(); ctx.moveTo(p[0], y); ctx.lineTo(p[0] + Math.sin(t * 1.5 + k) * 2, y - 8 - hash(k + 4) * 8); ctx.stroke(); }
  ger(ctx, A.x + A.w * 0.86, A.y + A.h * 0.93, clamp(A.h * 0.1, 44, 90), true, t);
  if (echo > 0.02) { ctx.save(); ctx.globalAlpha = echo * 0.4; glow(ctx, A.x + A.w * 0.5, A.y + A.h * 0.7, A.h * 0.5, '#ffd8a0', 0.4); ctx.restore(); }
}
function skyRavine(ctx, A, t, echo, relay) {
  ctx.fillStyle = vgrad(ctx, A.y, A.y + A.h, [[0, '#3a82c8'], [0.5, '#9ccbe8'], [0.74, '#e8eed8'], [1, '#6a9a58']]); ctx.fillRect(A.x, A.y, A.w, A.h);
  glow(ctx, A.x + A.w * 0.2, A.y + A.h * 0.12, A.h * 0.35, '#fff6d0', 0.7);
  cloud(ctx, A.x + ((t * 5) % (A.w + 300)) - 150, A.y + A.h * 0.16, A.h * 0.06, 0.85);
  // far side of the ravine: steep terraced hill with white houses
  const W = A.w, H = A.h, X = (f) => A.x + W * f, Y = (f) => A.y + H * f;
  ridge(ctx, A, 0.5, 0.14, 0.01, 52, '#b0c4d8', '#d8e4ea', { shift: 17 });
  ctx.beginPath(); ctx.moveTo(X(1.02), Y(0.18)); ctx.bezierCurveTo(X(0.82), Y(0.2), X(0.72), Y(0.5), X(0.5), Y(0.98)); ctx.lineTo(X(1.02), Y(1.02)); ctx.closePath();
  ctx.fillStyle = hgrad(ctx, X(0.5), X(1), [[0, '#6e9a5a'], [0.5, '#7aa660'], [1, '#4f7a42']]); ctx.fill();
  ctx.save(); ctx.clip();
  ctx.strokeStyle = 'rgba(30,60,24,0.35)'; ctx.lineWidth = 2;
  for (let k = 0; k < 14; k++) { ctx.beginPath(); ctx.moveTo(X(1.02), Y(0.22 + k * 0.055)); ctx.bezierCurveTo(X(0.86), Y(0.24 + k * 0.055), X(0.76 - k * 0.012), Y(0.4 + k * 0.05), X(0.62 - k * 0.006), Y(0.62 + k * 0.026)); ctx.stroke(); }
  for (let k = 0; k < 9; k++) { const q = hash(k * 4.3), x = X(0.78 + q * 0.2), y = Y(0.27 + hash(k + 8) * 0.34), s = H * 0.022; ctx.fillStyle = '#f4f0e8'; ctx.fillRect(x, y, s * 1.5, s); ctx.fillStyle = '#c4582e'; ctx.fillRect(x - 1, y - s * 0.28, s * 1.5 + 2, s * 0.3); if (k === 4) { ctx.fillStyle = echo > 0.05 ? '#ffe9a0' : '#406a98'; ctx.fillRect(x + s * 0.5, y + s * 0.3, s * 0.4, s * 0.4); } }
  ctx.restore();
  // the ravine floor in haze
  ctx.fillStyle = vgrad(ctx, Y(0.6), Y(0.95), [[0, 'rgba(235,242,236,0)'], [0.55, 'rgba(235,242,236,0.78)'], [1, 'rgba(235,242,236,0.2)']]); ctx.fillRect(A.x, Y(0.6), W, H * 0.35);
  // near side: the whistler's hill, dark and steep, with agave and palms
  ctx.beginPath(); ctx.moveTo(X(-0.02), Y(0.4)); ctx.bezierCurveTo(X(0.2), Y(0.46), X(0.3), Y(0.74), X(0.46), Y(1.02)); ctx.lineTo(X(-0.02), Y(1.02)); ctx.closePath();
  ctx.fillStyle = hgrad(ctx, X(0), X(0.5), [[0, '#2f5a2a'], [1, '#4a7a3a']]); ctx.fill();
  ctx.save(); ctx.clip();
  ctx.strokeStyle = 'rgba(15,40,12,0.4)'; ctx.lineWidth = 2;
  for (let k = 0; k < 10; k++) { ctx.beginPath(); ctx.moveTo(X(-0.02), Y(0.48 + k * 0.06)); ctx.bezierCurveTo(X(0.12), Y(0.5 + k * 0.06), X(0.2), Y(0.62 + k * 0.05), X(0.34 + k * 0.012), Y(0.88 + k * 0.01)); ctx.stroke(); }
  for (const [fx, fy] of [[0.07, 0.5], [0.16, 0.6], [0.04, 0.72], [0.22, 0.78]]) { const x = X(fx), y = Y(fy), s = H * 0.03; ctx.strokeStyle = '#1f3a1a'; ctx.lineWidth = 3; for (let q = -3; q <= 3; q++) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + q * s * 0.4, y - s * 1.3, x + q * s * 0.9, y - s * (1.6 - Math.abs(q) * 0.2)); ctx.stroke(); } }
  ctx.restore();
  // a relay: the whistle crosses the ravine as an arc to the far side, a lit window answers
  if (relay) {
    const a = relay.p, x0 = relay.ox ?? X(0.1), y0 = relay.oy ?? Y(0.45), x1 = X(0.9), y1 = Y(0.34), cx = (x0 + x1) / 2, cy = Math.min(y0, y1) - H * 0.36;
    ctx.save(); ctx.lineCap = 'round';
    for (let q = 0; q < 14; q++) { const s = clamp(a * 1.0 - q * 0.04, 0, 1); if (s <= 0 || s >= 1) continue; const px = (1 - s) * (1 - s) * x0 + 2 * (1 - s) * s * cx + s * s * x1, py = (1 - s) * (1 - s) * y0 + 2 * (1 - s) * s * cy + s * s * y1; ctx.fillStyle = rgba('#fff6d0', 0.85 * (1 - q / 14)); circ(ctx, px, py, 9 - q * 0.5); ctx.fill(); }
    for (let q = 0; q < 3; q++) { const e = clamp(a * 1.1 - q * 0.12, 0, 1); if (e <= 0 || e >= 1) continue; ctx.strokeStyle = rgba('#ffffff', 0.5 * (1 - e)); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x0, y0, 14 + e * 90, -1.2, 1.2); ctx.stroke(); }
    ctx.strokeStyle = rgba('#ffffff', 0.16 * relay.k); ctx.lineWidth = 2; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
  }
}

export function createVocalStage(id, S, lanes, P) {
  const N = lanes.length;
  const V = P.vocal ?? {};
  const st = { id, kind: 'voice', spots: new Array(N).fill(null), voice: 'vocal', sustained: true, F: null };
  const spots = st.spots;
  const f0 = V.fundamental ?? P.root ?? 110;
  const breakHz = V.breakHz ?? lanes.reduce((m, l) => m + l.hz, 0) / Math.max(1, N) * 1.0;
  const head = (i) => (lanes[i].reg ? lanes[i].reg === 'head' : lanes[i].hz >= breakHz);
  const order = lanes.map((_, i) => i).sort((a, b) => lanes[b].hz - lanes[a].hz);   // highest at the top
  const hasBreak = id === 'yodel' && order.some((i) => head(i)) && order.some((i) => !head(i));
  const lastHit = new Array(N).fill(-9), prevFlash = new Array(N).fill(0);
  let lastLane = -1, lens = 0, lensY = null, F = null, ref = { w: 640, h: 900 }, tall = true, geom = null;
  const hit = (rt, i) => rt.anim - lastHit[i];

  st.layout = (area) => {
    tall = area.h > area.w * 1.05;
    const rows = Math.max(1, N), gap = 10;
    const rowH = clamp(tall ? (area.h * 0.76) / (rows + (hasBreak ? 0.7 : 0.2)) / (area.w / 645 < 1 ? 1 : 1) : (area.h * 0.8) / (rows + 0.6), 40, 98);
    const wh = id === 'whistle';
    const bw = wh ? (tall ? 262 : 330) : tall ? 408 : 500, rh = tall ? Math.min(88, (780 - (hasBreak ? 58 : 0)) / rows - gap) : Math.min(66, (500 - (hasBreak ? 58 : 0)) / rows - gap);
    void rowH;
    const foot = id === 'throat' ? 46 : 0;
    ref = tall ? { w: wh ? bw + 80 : 640, h: rows * (rh + gap) + (hasBreak ? 58 : 0) + 70 + foot } : { w: wh ? bw + 80 : 980, h: rows * (rh + gap) + (hasBreak ? 58 : 0) + 60 + foot };
    // whistled speech: a slim, see-through ladder stands on the whistler's hill (left); the ravine, the whistle arc and the far village stay open
    // (a wide screen ignores dx in makeBox, so the ladder is fitted into the left part of the area and the frame keeps the whole area)
    F = makeBox(wh && !tall ? { ...area, w: area.w * 0.56 } : area, ref.w, ref.h, wh ? { top: 36, bottom: 10, side: 8, maxScale: 1.0, dx: tall ? -0.2 : 0, dy: tall ? 0.06 : 0 } : { top: 36, bottom: 10, side: 8, maxScale: 2.0 });
    F.area = area;
    st.F = F;
    // row centres, high to low; the break sits between the lowest head band and the highest chest band
    let u = 34 + rh / 2, prevHead = null;
    const rowsPos = [];
    order.forEach((i) => {
      const hd = head(i);
      if (hasBreak && prevHead === true && hd === false) u += 58 - gap;
      prevHead = hd;
      spots[i] = rectSpot(0, u, bw / 2, rh / 2, { head: hd, rh, bw, row: rowsPos.length });
      rowsPos.push(u);
      u += rh + gap;
    });
    geom = { bw, rh, rows: rowsPos, foot };
    finishSpots(F, spots);
  };
  // the count-in numeral parks where it covers no band: above the ladder when there is room, else beside it (sky, for whistled speech)
  st.countSpot = () => {
    if (!F || !geom) return null;
    const A = F.area, [lx, ty] = F.map(-geom.bw / 2 - 28, Math.min(...geom.rows) - geom.rh / 2 - 22), [rx] = F.map(geom.bw / 2 + 28, 0);
    if (id === 'whistle') return { x: A.x + A.w * (tall ? 0.64 : 0.52), y: A.y + A.h * (tall ? 0.76 : 0.72), size: clamp(Math.min(A.w, A.h) * 0.18, 56, 110) };   // the ravine floor: clear of the ladder, the whistle arc and the village
    const gapTop = ty - A.y - 6;
    if (gapTop >= 78) return { x: A.x + A.w / 2, y: A.y + 6 + gapTop / 2, size: clamp(gapTop * 0.62, 44, 110) };
    const left = lx - A.x, right = A.x + A.w - rx;
    if (right > left) return { x: rx + right / 2, y: A.y + A.h / 2, size: clamp(right * 0.5, 40, 120) };
    return { x: A.x + left / 2, y: A.y + A.h / 2, size: clamp(left * 0.5, 40, 120) };
  };
  st.hit = (x, y) => (F ? hitSpots(F, spots, x, y) : -1);
  st.anchor = (i) => ({ x: spots[i]?.x ?? 0, y: spots[i]?.y ?? 0 });
  st.voiceOf = () => (id === 'throat' ? 'throat' : id === 'whistle' ? 'whistle' : 'vocal');
  st.regOf = (i) => (head(i) ? 'head' : 'chest');

  // one voice at a time: the pitch it left (for the break glide), kept here so audio and picture agree
  st.note = (i, rt) => { const from = lastLane >= 0 ? lanes[lastLane].hz : 0, prevReg = lastLane >= 0 ? head(lastLane) : null; lastLane = i; return { from, crossed: prevReg !== null && prevReg !== head(i) }; };

  const wave = (ctx, x0, x1, y, amp, cyc, ph, col, w = 3) => {
    ctx.beginPath();
    for (let k = 0; k <= 48; k++) { const s = k / 48, e = Math.sin(Math.PI * s); const xx = x0 + (x1 - x0) * s, yy = y + Math.sin(s * cyc * TAU + ph) * amp * (0.35 + 0.65 * e); if (k) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = w + 2; ctx.save(); ctx.translate(1, 2); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  };

  st.draw = (g, rt) => {
    const { ctx } = g, A = F?.area;
    if (!F || !A) return;
    const t = rt.anim;
    // landscape state: when the last note was struck and how loud the echo is now
    let echoK = 0, relay = null, newest = -1, nt = 99;
    for (let i = 0; i < N; i++) { if (rt.flash[i] > prevFlash[i] + 0.4) lastHit[i] = t; prevFlash[i] = rt.flash[i]; const e = hit(rt, i); if (e < nt) { nt = e; newest = i; } }
    if (newest >= 0 && nt < 2) {
      const delay = id === 'whistle' ? 0.9 : 0.42;
      echoK = clamp(1 - Math.abs(nt - delay - 0.2) / 0.5, 0, 1);
      if (id === 'whistle') { const [ox, oy] = F.map(geom.bw / 2 + 22, spots[newest].u); relay = { p: clamp(nt / 0.9, 0, 1.2), k: clamp(1 - nt / 1.8, 0, 1), ox, oy }; }
    }
    ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
    if (id === 'throat') skySteppe(ctx, A, t, echoK); else if (id === 'whistle') skyRavine(ctx, A, t, echoK, relay); else skyAlps(ctx, A, t, echoK);
    ctx.fillStyle = 'rgba(8,12,26,0.18)'; ctx.fillRect(A.x, A.y, A.w, A.h);
    ctx.restore();

    const cueScreen = [];
    ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip(); F.apply(ctx);
    const { bw, rh, rows, foot } = geom;
    const cold = '#9fd4ff', warm = '#f6b867';
    // the dark glass panel behind the ladder keeps the bands legible over the scenery
    const top = Math.min(...rows) - rh / 2 - 22, bot = Math.max(...rows) + rh / 2 + 22 + foot;
    const pa = id === 'whistle' ? 0.5 : 1;   // panel opacity: the whistled-speech ladder is mostly glass so the ravine shows through
    ctx.fillStyle = `rgba(0,0,0,${0.3 * pa})`; rrect(ctx, -bw / 2 - 24 + 4, top + 7, bw + 48, bot - top, 26); ctx.fill();
    ctx.fillStyle = vgrad(ctx, top, bot, [[0, `rgba(14,22,44,${0.5 * (pa < 1 ? 0.5 : 1)})`], [1, `rgba(8,12,26,${0.58 * (pa < 1 ? 0.5 : 1)})`]]); rrect(ctx, -bw / 2 - 24, top, bw + 48, bot - top, 26); ctx.fill();
    ctx.strokeStyle = `rgba(255,240,210,${id === 'whistle' ? 0.26 : 0.34})`; ctx.lineWidth = 2.5; rrect(ctx, -bw / 2 - 24, top, bw + 48, bot - top, 26); ctx.stroke();

    // register brace (yodel): CHEST below, HEAD above, with the break between
    if (id === 'yodel') {
      const heads = order.filter(head), chests = order.filter((i) => !head(i));
      const brace = (list, col, label) => {
        if (!list.length) return;
        const y0 = spots[list[0]].u - rh / 2, y1 = spots[list[list.length - 1]].u + rh / 2, x = -bw / 2 - 17;
        ctx.strokeStyle = rgba(col, 0.9); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 6, y0 + 4); ctx.lineTo(x, y0 + 12); ctx.lineTo(x, y1 - 12); ctx.lineTo(x + 6, y1 - 4); ctx.stroke();
        ctx.save(); ctx.translate(x - 7, (y0 + y1) / 2); ctx.rotate(-Math.PI / 2); text(ctx, label, 0, 0, 15, col, { weight: '800', outline: 'rgba(0,0,0,0.6)', lw: 3 }); ctx.restore();
      };
      brace(heads, cold, 'HEAD'); brace(chests, warm, 'CHEST');
    }

    // throat singing: a faint harmonic comb at the side, and the resonance lens that slides to the sounding overtone
    const sounding = (() => { let b = -1, bv = 0.03; for (let i = 0; i < N; i++) { const v = rt.flash[i] + (rt.hold[i] ?? 0) * 0.7; if (v > bv) { bv = v; b = i; } } return b; })();

    order.forEach((i) => {
      const sp = spots[i], l = lanes[i], hd = sp.head, f = rt.flash[i], hold = rt.hold[i] ?? 0, on = clamp(f * 0.8 + hold, 0, 1);
      const x0 = -bw / 2, y = sp.u, h = rh;
      const tint = id === 'yodel' ? (hd ? cold : warm) : id === 'throat' ? '#e0c890' : '#d8ecff';
      // the band
      ctx.fillStyle = 'rgba(0,0,0,0.34)'; rrect(ctx, x0 + 3, y - h / 2 + 6, bw, h, h * 0.3); ctx.fill();
      const ba = id === 'whistle' ? 0.84 : 0.96;
      ctx.fillStyle = vgrad(ctx, y - h / 2, y + h / 2, [[0, rgba(mix(tint, '#10182c', 0.78 - 0.22 * on), ba)], [1, rgba(mix(tint, '#05080f', 0.82 - 0.2 * on), ba)]]);
      rrect(ctx, x0, y - h / 2, bw, h, h * 0.3); ctx.fill();
      ctx.strokeStyle = rgba(mix(l.color, tint, 0.4), 0.55 + 0.45 * on); ctx.lineWidth = 2.5 + 2 * on; rrect(ctx, x0, y - h / 2, bw, h, h * 0.3); ctx.stroke();
      if (on > 0.03) { ctx.save(); rrect(ctx, x0, y - h / 2, bw, h, h * 0.3); ctx.clip(); ctx.fillStyle = rgba(l.color, 0.2 * on); ctx.fillRect(x0, y - h / 2, bw, h); glow(ctx, x0 + h / 2, y, h * 1.2, l.color, 0.5 * on); ctx.restore(); }
      // the glyph disc: vowel (yodel, whistle) or harmonic number (throat singing)
      const dr = h * 0.4, dx = x0 + h * 0.58;
      ctx.fillStyle = rgrad(ctx, dx, y, 0, dr, [[0, rgba(lighter(l.color, 0.3), 0.55 + 0.4 * on)], [1, rgba(darker(l.color, 0.55), 0.95)]], dx - dr * 0.3, y - dr * 0.3); circ(ctx, dx, y, dr); ctx.fill();
      ctx.strokeStyle = rgba(lighter(l.color, 0.5), 0.9); ctx.lineWidth = 2; circ(ctx, dx, y, dr); ctx.stroke();
      const glyph = id === 'throat' ? `H${Math.max(1, Math.round(l.hz / f0))}` : (l.vowel ?? V.vowel ?? 'a');
      text(ctx, glyph, dx, y + 1, dr * (glyph.length > 2 ? 0.8 : 1.1), '#fff9ea', { weight: '800', outline: 'rgba(0,0,0,0.55)', lw: 3 });
      // breath / resonance rings leaving the disc
      for (let r = 0; r < 3; r++) { const p = clamp(((t * 1.4 + r / 3) % 1), 0, 1) * (hold > 0.05 ? 1 : 0); if (p <= 0) continue; ctx.strokeStyle = rgba(l.color, 0.5 * (1 - p) * hold); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(dx, y, dr * (1.1 + p * 1.1), -0.9, 0.9); ctx.stroke(); }
      // the voice line on the band: at rest a hair, when sounding a standing wave whose density follows the pitch
      const wx0 = dx + dr + 128, wx1 = x0 + bw - h * 0.35, cyc = clamp(l.hz / (id === 'throat' ? 700 : 200), 0.8, 8) + 1.2;
      if (id === 'throat') {
        // the harmonic line itself: a thin glowing string with beads at every harmonic position
        ctx.strokeStyle = rgba(l.color, 0.4 + 0.6 * on); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(wx0, y); ctx.lineTo(wx1, y); ctx.stroke();
        for (let k = 0; k <= 6; k++) { const bx = wx0 + (wx1 - wx0) * (k / 6); ctx.fillStyle = rgba(lighter(l.color, 0.4), 0.35 + 0.5 * on); circ(ctx, bx, y, 2.4); ctx.fill(); }
      }
      if (id !== 'whistle') wave(ctx, wx0, wx1, y, h * (0.05 + 0.26 * on), cyc, t * (6 + cyc), rgba(lighter(l.color, 0.45), 0.5 + 0.5 * on), 2.2 + 1.5 * on);
      // echo ghost: the far side answers a moment later (mountain echo, relayed whistle)
      const e = hit(rt, i), ed = id === 'whistle' ? 0.9 : 0.42;
      if (e > ed && e < ed + 1.0) {
        const k = 1 - (e - ed) / 1.0, gx = x0 + bw + 52 + (1 - k) * 14;
        ctx.save(); ctx.globalAlpha = 0.55 * k; ctx.fillStyle = rgba(l.color, 0.45); circ(ctx, gx, y, dr * 0.8); ctx.fill(); ctx.strokeStyle = rgba(lighter(l.color, 0.6), 0.9); ctx.lineWidth = 2; circ(ctx, gx, y, dr * 0.8); ctx.stroke();
        ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(x0 + bw + 6, y); ctx.lineTo(gx - dr, y); ctx.stroke(); ctx.setLineDash([]);
        text(ctx, glyph, gx, y + 1, dr * 0.9, '#fff9ea', { weight: '800' });
        ctx.restore();
      }
    });

    // yodel: the break marker (a zigzag crack with a flip arrow) between the registers
    if (hasBreak) {
      const hs = order.filter(head), cs = order.filter((i) => !head(i));
      const yb = (spots[hs[hs.length - 1]].u + spots[cs[0]].u) / 2, k = Math.max(0, ...hs.concat(cs).map((i) => rt.flash[i]));
      ctx.strokeStyle = rgba('#fff0c0', 0.7 + 0.3 * k); ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.beginPath();
      for (let x = -bw / 2 + 20, j = 0; x < bw / 2 - 20; x += 22, j++) ctx.lineTo(x, yb + (j % 2 ? 10 : -10));
      ctx.stroke();
      ctx.fillStyle = 'rgba(8,12,26,0.92)'; rrect(ctx, -52, yb - 15, 104, 30, 15); ctx.fill(); ctx.strokeStyle = rgba('#fff0c0', 0.95); ctx.lineWidth = 2; rrect(ctx, -52, yb - 15, 104, 30, 15); ctx.stroke();
      text(ctx, 'BREAK', 0, yb + 1, 16, '#fff0c0', { weight: '800' });
      // arrows showing the flip
      ctx.fillStyle = rgba(cold, 0.9); ctx.beginPath(); ctx.moveTo(-72, yb - 8); ctx.lineTo(-62, yb + 4); ctx.lineTo(-82, yb + 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = rgba(warm, 0.9); ctx.beginPath(); ctx.moveTo(72, yb + 8); ctx.lineTo(82, yb - 4); ctx.lineTo(62, yb - 4); ctx.closePath(); ctx.fill();
    }

    // throat singing: the held fundamental across the bottom (a thick living wave) and the resonance lens
    if (id === 'throat') {
      const yb = bot + 6 + 0;
      void yb;
      const ly = Math.max(...rows) + rh / 2 + 30, amp = 7 + 3 * Math.sin(t * 2.2);
      wave(ctx, -bw / 2 + 6, bw / 2 - 6, ly, amp, 9, t * 9, 'rgba(255,196,110,0.95)', 5);
      text(ctx, 'FUNDAMENTAL (the held drone)', 0, ly + 26, 13, 'rgba(255,224,170,0.9)', { weight: '800', outline: 'rgba(0,0,0,0.6)', lw: 3 });
      const ty = sounding >= 0 ? spots[sounding].u : null;
      if (ty != null) { lensY = lensY == null ? ty : lensY + (ty - lensY) * 0.35; } else if (lensY != null) lensY += 0;
      if (lensY != null) {
        const a = sounding >= 0 ? 1 : 0.45, lx = bw / 2 + 4;
        ctx.save(); ctx.globalAlpha = a;
        const lg = ctx.createLinearGradient(0, lensY - rh, 0, lensY + rh); lg.addColorStop(0, 'rgba(255,230,160,0)'); lg.addColorStop(0.5, 'rgba(255,230,160,0.55)'); lg.addColorStop(1, 'rgba(255,230,160,0)');
        ctx.fillStyle = lg; ctx.fillRect(-bw / 2 - 20, lensY - rh, bw + 40, rh * 2);
        ctx.strokeStyle = 'rgba(255,240,190,0.95)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx + 18, lensY - rh * 0.8); ctx.quadraticCurveTo(lx - 4, lensY - rh * 0.1, lx - 4, lensY); ctx.quadraticCurveTo(lx - 4, lensY + rh * 0.1, lx + 18, lensY + rh * 0.8); ctx.stroke();
        ctx.restore();
      }
    }
    // approach cues: one frame closes on the band that is about to be sung (the nearest note); the notes behind it only breathe a ring on
    // their glyph disc, so a busy phrase stays readable
    const cues = [];
    for (let k = rt.list.length - 1; k >= 0; k--) {
      const tg = rt.list[k];
      if (tg.state && tg.state !== 'pending' && tg.state !== 'miss') continue;
      const tau = (tg.t - rt.clock) / rt.look;
      if (tau > 1.0 || tau < -0.25) continue;
      cues.push({ tg, tau });
    }
    let nearest = null;
    for (const c of cues) if (c.tg.state !== 'miss' && c.tau > -0.25 && (!nearest || c.tau < nearest.tau)) nearest = c;
    for (const c of cues) {
      const { tg, tau } = c;
      const miss = tg.state === 'miss', a = (rt.soft ? 0.5 : 1) * (miss ? 0.35 : 1) * clamp((1.05 - tau) * 8, 0, 1) * clamp((tau + 0.25) * 6, 0, 1);
      const sp = spots[tg.lane], col = miss ? mix(lanes[tg.lane].color, '#555555', 0.6) : lanes[tg.lane].color, kk = 1 - clamp(tau, 0, 1);
      const dxx = -bw / 2 + rh * 0.58, drr = rh * 0.4, lead = c === nearest && tau <= 0.55;
      ctx.save(); ctx.globalAlpha = a;
      if (!lead) {
        ctx.strokeStyle = rgba(lighter(col, 0.5), 0.8); ctx.lineWidth = 3; circ(ctx, dxx, sp.u, drr * (1.2 + 0.25 * Math.max(0, tau - 0.5))); ctx.stroke();
      } else {
        const g2 = id === 'whistle' ? 2 + 7 * (tau / 0.55) : 3 + 22 * (tau / 0.55);
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 8; rrect(ctx, -bw / 2 - g2 + 1.5, sp.u - rh / 2 - g2 + 2, bw + 2 * g2, rh + 2 * g2, rh * 0.3 + g2); ctx.stroke();
        ctx.strokeStyle = rgba(lighter(col, 0.5), 0.98); ctx.lineWidth = 4.5; rrect(ctx, -bw / 2 - g2, sp.u - rh / 2 - g2, bw + 2 * g2, rh + 2 * g2, rh * 0.3 + g2); ctx.stroke();
        if (id !== 'whistle') { ctx.strokeStyle = rgba(col, 0.5); ctx.lineWidth = 10; ctx.stroke(); }
      }
      glow(ctx, dxx, sp.u, rh * (0.9 + kk), col, 0.2 + 0.45 * kk);
      ctx.restore();
      if (id === 'whistle' && lead) cueScreen.push({ sp, col, tau, a });
    }
    ctx.restore();
    // whistled speech: the coming note is an inbound whistle resonance, arcs that close over the valley onto the band's edge
    for (const c of cueScreen) {
      const [px, py] = F.map(bw / 2 + 24, c.sp.u), k = clamp(c.tau / 0.9, 0, 1), s0 = Math.max(0.6, F.scale);
      ctx.save(); ctx.lineCap = 'round';
      for (let q = 0; q < 3; q++) {
        const r = (30 + q * 34) * s0 + k * 190 * s0 * (1 + q * 0.18);
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 7 - q; ctx.beginPath(); ctx.arc(px + 1.5, py + 2, r, -0.9, 0.9); ctx.stroke();
        ctx.strokeStyle = rgba(lighter(c.col, 0.55), c.a * (0.95 - q * 0.22)); ctx.lineWidth = 4.5 - q; ctx.beginPath(); ctx.arc(px, py, r, -0.9, 0.9); ctx.stroke();
      }
      ctx.restore();
    }
    // names sit in the bands (never colour alone)
    const size = g.px(21);
    order.forEach((i) => { const sp = spots[i]; const f = rt.flash[i]; pill(ctx, lanes[i].name, ...F.map(-geom.bw / 2 + rh * 0.58 + rh * 0.4 + 14 + 62, sp.u), Math.max(70, F.scale * 128), size, lanes[i].color, f); });
    void lens; void grain; void darker; void hgrad;
  };
  return st;
}

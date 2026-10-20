// Asian drums, second half (1.23.0): the Dong Son bronze drum (Vietnam), the dabakan (Philippines) and the tavil (south India). A bronze kettle drum with a
// sun-star face by a misty river at dawn; a tall lashed goblet drum standing on a woven mat; a barrel drum seen head-on, its leather straps fanning out
// behind a festival awning. No performer, no hands: a padded mallet or a stick visits the struck place.
import { registerDrumStage } from './registry.js';
import { createDrumStage, eSpot, eRing, eSector, rectSpot, assignZones, staticLayer, rot2 } from './drum-kit.js';
import { defVoice } from './voice-synth2.js';
import { pool, vignette } from './set.js';
import { floorShadow, bolt, blob, speckle, bulb, skinHead, hoop, chromeH } from './drum-side.js';
import { PI, TAU, clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, lerp, d2r, fl, woodH, stick, visitStick, thread, tassel } from './asia-kit.js';
import { visit } from './stage-gongs.js';
import { wallBottom, withLayer } from './stage-asia1.js';

// ======================================================================================================================================================
// DONG SON BRONZE DRUM: an ancient kettle drum of cast bronze, the wide face seen from above and in front: a many-pointed sun in the middle, bands of
// birds and ornament round it, four small frogs on the rim, flat loop handles on the chest and a flaring foot. Room: a river at dawn under layered hills,
// a long boat far off, a wet stone landing in front. Struck with a padded mallet.
// ======================================================================================================================================================
const DS = [['star', /star|sun|centre|center|boss/], ['band', /band|bird|inner|ring/], ['edge', /edge|outer|frog|rim/], ['side', /side|body|waist|shell|foot/]];
function dawnRiver(ctx, F, rt, S, scene) {
  const A = F.area, wallB = wallBottom(F, scene), wallH = wallB - A.y, hz = A.y + wallH * 0.7;
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
  ctx.fillStyle = vgrad(ctx, A.y, hz, [[0, '#0b2c3a'], [0.45, '#1f6470'], [0.8, '#d8a060'], [1, '#f6cf88']]); ctx.fillRect(A.x, A.y, A.w, hz - A.y);
  const sx = A.x + A.w * 0.3, sr = Math.min(A.w, wallH) * 0.11;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgrad(ctx, sx, hz - sr * 0.3, 0, sr * 5.5, [[0, 'rgba(255,230,160,0.8)'], [0.35, 'rgba(255,190,110,0.32)'], [1, 'rgba(255,170,90,0)']]); ctx.fillRect(A.x, A.y, A.w, hz - A.y + 4); ctx.restore();
  ctx.fillStyle = rgrad(ctx, sx, hz - sr * 0.4, sr * 0.2, sr, [[0, '#fffbe6'], [1, '#ffdc8a']]); circ(ctx, sx, hz - sr * 0.5, sr); ctx.fill();
  for (let k = 0; k < 60; k++) { ctx.fillStyle = `rgba(230,250,255,${0.3 + 0.5 * hash(k)})`; circ(ctx, A.x + A.w * hash(k * 3 + 1), A.y + (hz - A.y) * 0.45 * hash(k * 7 + 2), 0.6 + hash(k + 9) * 1.1); ctx.fill(); }
  // hills in three layers, each one paler: rolling ridges with a lip of mist
  const ridge = (y0, amp, col, seed, a) => { ctx.fillStyle = col; ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(A.x, hz + 4); for (let k = 0; k <= 40; k++) { const t = k / 40, x = A.x + A.w * t, y = y0 - amp * (0.5 + 0.5 * Math.sin(t * 7 + seed) * 0.6 + 0.5 * Math.sin(t * 17 + seed * 2) * 0.4 + 0.3 * Math.sin(t * 3 + seed)); ctx.lineTo(x, y); } ctx.lineTo(A.x + A.w, hz + 4); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; };
  ridge(hz - wallH * 0.06, wallH * 0.3, '#5a9a96', 1, 0.7); ridge(hz - wallH * 0.02, wallH * 0.24, '#2e7c7c', 3, 0.85); ridge(hz + 2, wallH * 0.16, '#164e56', 5, 1);
  for (let k = 0; k < 4; k++) { ctx.fillStyle = rgrad(ctx, A.x + A.w * (0.15 + 0.25 * k), hz - wallH * 0.03, 0, A.w * 0.3, [[0, 'rgba(255,244,220,0.34)'], [1, 'rgba(255,244,220,0)']]); ctx.fillRect(A.x, hz - wallH * 0.2, A.w, wallH * 0.24); }
  // the river
  ctx.fillStyle = vgrad(ctx, hz, wallB, [[0, '#e6b878'], [0.25, '#4a8e92'], [1, '#0e3a48']]); ctx.fillRect(A.x, hz, A.w, wallB - hz);
  for (let k = 0; k < 42; k++) { const y = hz + (wallB - hz) * Math.pow(hash(k * 3 + 1), 1.5), x = A.x + A.w * hash(k * 5 + 2), w = 20 + 80 * hash(k + 4) * (0.3 + (y - hz) / (wallB - hz)); ctx.strokeStyle = rgba(hash(k) > 0.5 ? '#ffe8b0' : '#0a2c34', 0.14 + 0.14 * hash(k + 7)); ctx.lineWidth = 1.5 + 2 * (y - hz) / (wallB - hz); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke(); }
  ctx.fillStyle = vgrad(ctx, hz, hz + (wallB - hz) * 0.6, [[0, 'rgba(255,214,140,0.55)'], [1, 'rgba(255,214,140,0)']]); ctx.beginPath(); ctx.moveTo(sx - sr * 0.9, hz); ctx.lineTo(sx + sr * 0.9, hz); ctx.lineTo(sx + sr * 2.8, wallB); ctx.lineTo(sx - sr * 2.8, wallB); ctx.closePath(); ctx.fill();
  // a long boat far off: a slim hull, tall bow and stern, upright banners
  { const bx = A.x + A.w * 0.7, by = hz + (wallB - hz) * 0.16, bl = Math.min(A.w * 0.3, 280); ctx.fillStyle = '#0c2830'; ctx.beginPath(); ctx.moveTo(bx - bl / 2, by - 14); ctx.quadraticCurveTo(bx - bl * 0.45, by + 6, bx - bl * 0.3, by + 6); ctx.lineTo(bx + bl * 0.3, by + 6); ctx.quadraticCurveTo(bx + bl * 0.45, by + 6, bx + bl / 2, by - 12); ctx.quadraticCurveTo(bx + bl * 0.3, by - 2, bx, by - 3); ctx.quadraticCurveTo(bx - bl * 0.3, by - 2, bx - bl / 2, by - 14); ctx.closePath(); ctx.fill();
    for (let k = 0; k < 5; k++) { const x = bx - bl * 0.3 + k * bl * 0.15; ctx.strokeStyle = '#0c2830'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, by - 2); ctx.lineTo(x, by - 22 - 6 * (k % 2)); ctx.stroke(); ctx.fillStyle = '#0c2830'; ctx.beginPath(); ctx.moveTo(x, by - 22 - 6 * (k % 2)); ctx.lineTo(x + 8, by - 18 - 6 * (k % 2)); ctx.lineTo(x, by - 14 - 6 * (k % 2)); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(10,40,50,0.4)'; ctx.fillRect(bx - bl / 2, by + 6, bl, 6); }
  // bamboo clumps at the edges, dark against the glow
  for (const [bx0, dir] of [[A.x + A.w * 0.03, 1], [A.x + A.w * 0.97, -1]]) for (let k = 0; k < 5; k++) { const x = bx0 + dir * k * A.w * 0.022, top = A.y + wallH * (0.04 + 0.08 * hash(k * 3 + dir)), lean = dir * (14 + k * 8); ctx.strokeStyle = k % 2 ? '#0a2a2a' : '#0e3636'; ctx.lineWidth = 7 - k * 0.5; ctx.beginPath(); ctx.moveTo(x, wallB); ctx.quadraticCurveTo(x + lean * 0.3, A.y + wallH * 0.5, x + lean, top); ctx.stroke();
    for (let j = 0; j < 7; j++) { const t = (j + 1) / 8, px = x + lean * t * t * 1.1, py = lerp(wallB, top, t); ctx.fillStyle = '#071e20'; ctx.fillRect(px - 5, py - 2, 10, 4); }
    for (let j = 0; j < 8; j++) { const t = 0.3 + 0.7 * hash(k * 9 + j), px = x + lean * t * t, py = lerp(wallB, top, t), a = dir * (-0.4 - 0.9 * hash(j + k)), L = 54 + 40 * hash(j + 3 * k); ctx.fillStyle = '#0a2a2c'; ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + Math.cos(a) * L * 0.5, py + Math.sin(a) * L * 0.5 - 8, px + Math.cos(a) * L, py + Math.sin(a) * L + 6); ctx.quadraticCurveTo(px + Math.cos(a) * L * 0.5, py + Math.sin(a) * L * 0.5 + 6, px, py + 3); ctx.fill(); } }
  // the wet stone landing: slabs with worn joints and puddle gleams
  const fh = A.y + A.h - wallB;
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(A.x, wallB - 2, A.w, 6);
  ctx.fillStyle = vgrad(ctx, wallB, A.y + A.h, [[0, '#4a5a56'], [0.4, '#2e3c3a'], [1, '#141e1e']]); ctx.fillRect(A.x, wallB, A.w, fh);
  for (let k = 1; k < 6; k++) { const yy = wallB + fh * Math.pow(k / 6, 1.45); ctx.strokeStyle = 'rgba(0,10,10,0.55)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(A.x, yy); ctx.lineTo(A.x + A.w, yy); ctx.stroke(); }
  for (let k = -8; k <= 8; k++) { ctx.strokeStyle = 'rgba(0,10,10,0.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(A.x + A.w / 2 + k * A.w * 0.035, wallB); ctx.lineTo(A.x + A.w / 2 + k * A.w * 0.19, A.y + A.h); ctx.stroke(); }
  speckle(ctx, A.x, wallB, A.w, fh, 220, '#9ad0b8', 0.12, 4, 0.8, 2.6);
  ctx.restore();
  ctx.fillStyle = rgrad(ctx, sx, A.y + wallH * 0.7, 0, A.w * 0.7, [[0, 'rgba(255,200,120,0.12)'], [1, 'rgba(255,200,120,0)']]); ctx.fillRect(A.x, A.y, A.w, A.h);
  vignette(ctx, A, 0.5);
}
function frog(ctx, x, y, s, ang, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; ell(ctx, 3, 5, 15, 8); ctx.fill();
  const g = hgrad(ctx, -14, 14, [[0, darker(col, 0.5)], [0.35, lighter(col, 0.5)], [0.7, col], [1, darker(col, 0.6)]]);
  ctx.fillStyle = g; ctx.strokeStyle = darker(col, 0.8); ctx.lineWidth = 1.6;
  for (const [lx, ly, a] of [[-7, -8, -0.7], [-7, 8, 0.7], [9, -8, 0.5], [9, 8, -0.5]]) { ctx.save(); ctx.translate(lx, ly); ctx.rotate(a); ell(ctx, 0, 0, 8, 3.6); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ell(ctx, 0, 0, 13, 8); ctx.fill(); ctx.stroke(); ell(ctx, 12, 0, 6.5, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = lighter(col, 0.8); circ(ctx, 14, -3.4, 2); ctx.fill(); circ(ctx, 14, 3.4, 2); ctx.fill();
  ctx.restore();
}
function bird(ctx, x, y, s, ang, col) {   // a long-necked wading bird in flight, wings up, as the drum's cast frieze shows them
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s); ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(-14, 1); ctx.quadraticCurveTo(-4, -3, 6, -1); ctx.quadraticCurveTo(12, -2, 17, -6); ctx.lineTo(18, -4); ctx.quadraticCurveTo(12, 1, 5, 2); ctx.quadraticCurveTo(-4, 4, -14, 1); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-2, -1); ctx.quadraticCurveTo(0, -11, 8, -13); ctx.quadraticCurveTo(3, -7, 4, -1); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-2, 2); ctx.quadraticCurveTo(0, 10, 7, 12); ctx.quadraticCurveTo(3, 6, 4, 2); ctx.fill();
  ctx.restore();
}
registerDrumStage({
  id: 'dongson', match: /dong.?son|bronze.?drum|trong.?dong|kettle.?bronze|heger/,
  build: (S, lanes, P) => { const zoneOf = []; return createDrumStage('dongson', S, lanes, P, {
    heroClean: true,
    dress: withLayer(dawnRiver),
    voiceOf: (i) => `dongson-${zoneOf[i] ?? 'star'}`,
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 960 } : { w: 1040, h: 580 }, keyOf = assignZones(K, DS.map(([key, re]) => ({ key, re })));
      for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const R = tall ? 262 : 206, ryk = tall ? 0.4 : 0.38, cy = tall ? 360 : 170, th = tall ? 26 : 22, H = tall ? 318 : 236, by = {};
      const yT = cy + th, yB = yT + H;
      by.star = eSpot(0, cy, R * 0.3, R * 0.3 * ryk, 0, { apk: 0.95 });
      by.band = eRing(0, cy, R, R * ryk, 0, 0.36, 0.7, PI / 2);
      by.edge = eRing(0, cy, R, R * ryk, 0, 0.74, 0.99, -PI / 2);
      by.side = rectSpot(0, yT + H * 0.42, R * 0.44, H * 0.13, 0, { rad: 12 });
      const spots = new Array(K.N).fill(null); for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
      const prof = [[0, 0.93], [0.1, 0.86], [0.3, 0.78], [0.5, 0.6], [0.62, 0.56], [0.8, 0.74], [1, 0.9]];
      const rAt = (t) => { for (let k = 1; k < prof.length; k++) if (t <= prof[k][0]) { const [t0, r0] = prof[k - 1], [t1, r1] = prof[k], u = (t - t0) / (t1 - t0), s = u * u * (3 - 2 * u); return R * lerp(r0, r1, s); } return R * prof[prof.length - 1][1]; };
      const layer = staticLayer(), brz = '#b4783a', pat = '#3f9f8f';
      const paintBody = (ctx) => {
        const N = 36, path = () => { ctx.beginPath(); for (let k = 0; k <= N; k++) { const t = k / N; ctx.lineTo(-rAt(t), yT + H * t); } ctx.ellipse(0, yB, rAt(1), rAt(1) * ryk, 0, PI, 0, true); for (let k = N; k >= 0; k--) { const t = k / N; ctx.lineTo(rAt(t), yT + H * t); } ctx.closePath(); };
        ctx.save(); ctx.translate(14, 18); path(); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill(); ctx.restore();
        path(); ctx.fillStyle = hgrad(ctx, -R, R, [[0, '#2a1608'], [0.14, '#6a3c18'], [0.3, '#d2924a'], [0.42, '#a8682a'], [0.62, '#7a4418'], [0.86, '#3a1e0a'], [1, '#1c0e04']]); ctx.fill();
        ctx.save(); path(); ctx.clip();
        // verdigris: green-blue crust gathering in the hollows
        for (let k = 0; k < 40; k++) { const x = -R + 2 * R * hash(k * 3 + 1), y = yT + H * hash(k * 7 + 2); blob(ctx, x, y, 12 + 40 * hash(k + 5), k * 5 + 2, 12, 0.6); ctx.fillStyle = rgba(hash(k) > 0.4 ? '#3f9f8f' : '#2a7a6c', 0.1 + 0.12 * hash(k + 9)); ctx.fill(); }
        // cast bands: dentils, zigzag, spirals and a frieze of long boats round the chest
        const band = (t0, t1, fn) => { const y0 = yT + H * t0, y1 = yT + H * t1; ctx.save(); ctx.strokeStyle = 'rgba(40,20,6,0.8)'; ctx.lineWidth = 3; for (const y of [y0, y1]) { ctx.beginPath(); ctx.ellipse(0, y, rAt(t0 === y0 ? t0 : t1) * 1.0, rAt(t0) * ryk, 0, 0.0, PI); ctx.stroke(); } ctx.restore(); fn(y0, y1); };
        const around = (tm, n, fn) => { for (let k = 0; k < n; k++) { const th2 = -PI / 2 + PI * (k + 0.5) / n, r = rAt(tm), x = Math.sin(th2) * r, c = Math.cos(th2), y = yT + H * tm + Math.sin(th2 + PI / 2) * 0 + (1 - c) * 0; fn(x, y + r * ryk * c * 0.9, c, th2); } };
        around(0.2, 9, (x, y, c) => { ctx.save(); ctx.translate(x, y); ctx.scale(c, 1); ctx.fillStyle = 'rgba(50,24,6,0.85)'; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.quadraticCurveTo(0, 12, 18, 0); ctx.lineTo(14, -4); ctx.quadraticCurveTo(0, 5, -14, -4); ctx.closePath(); ctx.fill(); for (let j = -1; j <= 1; j++) { ctx.fillRect(j * 8 - 1, -16, 2, 14); ctx.beginPath(); ctx.moveTo(j * 8, -16); ctx.lineTo(j * 8 + 5, -18); ctx.lineTo(j * 8, -10); ctx.fill(); } ctx.restore(); });
        around(0.36, 14, (x, y, c) => { ctx.save(); ctx.translate(x, y); ctx.scale(c, 1); ctx.strokeStyle = 'rgba(50,24,6,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, 5); ctx.lineTo(-3, -5); ctx.lineTo(3, 5); ctx.lineTo(8, -5); ctx.stroke(); ctx.restore(); });
        around(0.7, 12, (x, y, c) => { ctx.save(); ctx.translate(x, y); ctx.scale(c, 1); ctx.strokeStyle = 'rgba(50,24,6,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); for (let t = 0; t < 22; t++) { const a = t * 0.5, r = 1 + t * 0.7; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.stroke(); ctx.restore(); });
        around(0.93, 16, (x, y, c) => { ctx.save(); ctx.translate(x, y); ctx.scale(c, 1); ctx.fillStyle = 'rgba(50,24,6,0.8)'; ctx.beginPath(); ctx.moveTo(-8, 5); ctx.lineTo(0, -6); ctx.lineTo(8, 5); ctx.closePath(); ctx.fill(); ctx.restore(); });
        void band;
        for (const t of [0.07, 0.29, 0.46, 0.84, 0.985]) { ctx.strokeStyle = 'rgba(40,20,6,0.8)'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.ellipse(0, yT + H * t, rAt(t), rAt(t) * ryk, 0, 0, PI); ctx.stroke(); ctx.strokeStyle = 'rgba(255,214,150,0.4)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(0, yT + H * t + 3.4, rAt(t), rAt(t) * ryk, 0, 0.1, PI - 0.1); ctx.stroke(); }
        ctx.fillStyle = vgrad(ctx, yT, yB, [[0, 'rgba(0,0,0,0.35)'], [0.1, 'rgba(0,0,0,0)'], [0.9, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.4)']]); ctx.fillRect(-R, yT, 2 * R, H + 30);
        ctx.fillStyle = hgrad(ctx, -R, R, [[0.2, 'rgba(255,255,255,0)'], [0.3, 'rgba(255,238,200,0.28)'], [0.4, 'rgba(255,255,255,0)']]); ctx.fillRect(-R, yT, 2 * R, H + 30);
        ctx.restore(); path(); ctx.strokeStyle = 'rgba(30,14,4,0.9)'; ctx.lineWidth = 2.8; ctx.stroke();
        // the flat loop handles on the chest, two seen from the front
        for (const sx of [-1, 1]) { const x = sx * rAt(0.2) * 0.98, y = yT + H * 0.2; ctx.save(); ctx.translate(x, y); ctx.scale(sx, 1);
          ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, 4, -34, 36, 74, 16); ctx.fill();
          ctx.fillStyle = hgrad(ctx, -4, 34, [[0, '#7a4418'], [0.4, '#d6964c'], [1, '#4a2808']]); rrect(ctx, -2, -36, 36, 72, 16); ctx.fill(); ctx.strokeStyle = 'rgba(30,14,4,0.9)'; ctx.lineWidth = 2.4; ctx.stroke();
          ctx.fillStyle = '#1c0e06'; rrect(ctx, 8, -22, 14, 44, 7); ctx.fill();
          ctx.strokeStyle = 'rgba(50,24,6,0.7)'; ctx.lineWidth = 2; for (let j = -3; j <= 3; j++) { ctx.beginPath(); ctx.moveTo(23, j * 9 - 4); ctx.lineTo(32, j * 9 + 2); ctx.stroke(); }
          ctx.restore(); }
      };
      const paintFace = (ctx) => {
        // the thick rim, the overhang, then the face in squashed circle space
        const rim = () => { ctx.beginPath(); ctx.moveTo(-R, cy); ctx.lineTo(-R, cy + th); ctx.ellipse(0, cy + th, R, R * ryk, 0, PI, 0, true); ctx.lineTo(R, cy); ctx.closePath(); };
        rim(); ctx.fillStyle = hgrad(ctx, -R, R, [[0, '#2a1608'], [0.16, '#7a4a1e'], [0.32, '#e0a458'], [0.5, '#9a5e24'], [0.8, '#4a2a0e'], [1, '#1e1006']]); ctx.fill(); ctx.strokeStyle = 'rgba(24,12,4,0.9)'; ctx.lineWidth = 2.6; ctx.stroke();
        ctx.save(); rim(); ctx.clip(); ctx.strokeStyle = 'rgba(50,24,6,0.7)'; ctx.lineWidth = 2.2; for (let k = 0; k < 44; k++) { const a = PI * (k + 0.5) / 44, x = Math.cos(a) * R * 0.98, y = cy + th * 0.5 + Math.sin(a) * R * ryk * 0.98; ctx.beginPath(); ctx.moveTo(x - 4, y - th * 0.3); ctx.lineTo(x + 4, y + th * 0.35); ctx.stroke(); } ctx.restore();
        ctx.save(); ctx.translate(0, cy); ctx.scale(1, ryk);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; circ(ctx, 0, 0, R + 3); ctx.fill();
        ctx.fillStyle = rgrad(ctx, -R * 0.3, -R * 0.4, 0, R * 1.2, [[0, '#f0b868'], [0.35, '#c88a3e'], [0.75, '#8a5420'], [1, '#4a2a0c']]); circ(ctx, 0, 0, R * 0.985); ctx.fill();
        ctx.save(); circ(ctx, 0, 0, R * 0.985); ctx.clip();
        for (let k = 0; k < 44; k++) { const a = hash(k * 3) * TAU, d = Math.sqrt(hash(k * 5 + 1)) * R; blob(ctx, Math.cos(a) * d, Math.sin(a) * d, 12 + 40 * hash(k + 7), k * 5 + 3, 12, 0.6); ctx.fillStyle = rgba('#3f9f8f', 0.08 + 0.12 * hash(k + 9)); ctx.fill(); }
        // concentric bands separated by raised lines
        const line = (r, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; circ(ctx, 0, 0, r * R); ctx.stroke(); };
        for (const r of [0.31, 0.345, 0.515, 0.55, 0.585, 0.715, 0.75, 0.865, 0.9, 0.955]) { line(r, 4.2, 'rgba(48,22,6,0.85)'); line(r, 1.6, 'rgba(255,222,160,0.55)'); }
        // sun star: fourteen long rays with a hollow centre
        { const n = 14, r0 = 0.07 * R, r1 = 0.3 * R; for (let k = 0; k < n; k++) { const a = (k / n) * TAU - PI / 2, a2 = a + PI / n; ctx.fillStyle = k % 2 ? '#e8b060' : '#d49a48'; ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.16) * r0, Math.sin(a - 0.16) * r0); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.lineTo(Math.cos(a + 0.16) * r0, Math.sin(a + 0.16) * r0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(40,18,4,0.85)'; ctx.lineWidth = 2.6; ctx.stroke(); void a2; }
          ctx.fillStyle = rgrad(ctx, -4, -4, 0, r0 * 1.5, [[0, '#ffe2a0'], [1, '#8a5420']]); circ(ctx, 0, 0, r0 * 0.9); ctx.fill(); ctx.strokeStyle = 'rgba(40,18,4,0.85)'; ctx.lineWidth = 2.6; ctx.stroke(); }
        // frieze bands: small circles with a dot, flying birds, dentils, feathered rays, birds again
        for (let k = 0; k < 40; k++) { const a = (k / 40) * TAU; ctx.fillStyle = 'rgba(48,22,6,0.8)'; circ(ctx, Math.cos(a) * 0.33 * R, Math.sin(a) * 0.33 * R, R * 0.01); ctx.fill(); }
        for (let k = 0; k < 14; k++) { const a = (k / 14) * TAU; bird(ctx, Math.cos(a) * 0.435 * R, Math.sin(a) * 0.435 * R, R / 330, a + PI / 2, 'rgba(48,22,6,0.88)'); }
        for (let k = 0; k < 56; k++) { const a = (k / 56) * TAU; ctx.fillStyle = 'rgba(48,22,6,0.8)'; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 0.55 * R, Math.sin(a) * 0.55 * R); ctx.lineTo(Math.cos(a + 0.056) * 0.585 * R, Math.sin(a + 0.056) * 0.585 * R); ctx.lineTo(Math.cos(a + 0.112) * 0.55 * R, Math.sin(a + 0.112) * 0.55 * R); ctx.fill(); }
        for (let k = 0; k < 36; k++) { const a = (k / 36) * TAU; ctx.strokeStyle = 'rgba(48,22,6,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 0.72 * R, Math.sin(a) * 0.72 * R); ctx.lineTo(Math.cos(a + 0.05) * 0.745 * R, Math.sin(a + 0.05) * 0.745 * R); ctx.stroke(); ctx.beginPath(); ctx.moveTo(Math.cos(a + 0.09) * 0.72 * R, Math.sin(a + 0.09) * 0.72 * R); ctx.lineTo(Math.cos(a + 0.14) * 0.745 * R, Math.sin(a + 0.14) * 0.745 * R); ctx.stroke(); }
        for (let k = 0; k < 18; k++) { const a = (k / 18) * TAU; bird(ctx, Math.cos(a) * 0.81 * R, Math.sin(a) * 0.81 * R, R / 270, a - PI / 2, 'rgba(48,22,6,0.88)'); }
        for (let k = 0; k < 72; k++) { const a = (k / 72) * TAU; ctx.fillStyle = 'rgba(48,22,6,0.78)'; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 0.9 * R, Math.sin(a) * 0.9 * R); ctx.lineTo(Math.cos(a + 0.04) * 0.952 * R, Math.sin(a + 0.04) * 0.952 * R); ctx.lineTo(Math.cos(a + 0.087) * 0.9 * R, Math.sin(a + 0.087) * 0.9 * R); ctx.fill(); }
        ctx.fillStyle = rgrad(ctx, -R * 0.3, -R * 0.38, 0, R * 0.9, [[0, 'rgba(255,240,200,0.4)'], [1, 'rgba(255,240,200,0)']]); ctx.fillRect(-R, -R, 2 * R, 2 * R);
        ctx.restore(); ctx.restore();
      };
      return { ref, spots, wallU: yB + R * 0.9 * ryk + (tall ? 44 : 20), draw(ctx, rt) {
        const vs = fl(K, keyOf, rt, 'star'), vb = fl(K, keyOf, rt, 'band'), ve = fl(K, keyOf, rt, 'edge'), vd = fl(K, keyOf, rt, 'side');
        floorShadow(ctx, 8, yB + rAt(1) * ryk * 0.9, R * 1.22, R * 0.2, 0.62);
        layer(ctx, { x: -R - 70, y: cy - R * ryk - 40, w: 2 * R + 140, h: H + R * ryk * 2 + 110 }, (g) => { paintBody(g); paintFace(g); });
        // four frogs sit on the rim, turned the same way round it
        for (const a of [d2r(35), d2r(145), d2r(-40), d2r(-140)]) { const x = Math.cos(a) * R * 0.91, y = cy + Math.sin(a) * R * ryk * 0.91; frog(ctx, x, y, R / 300, a + PI / 2 + (Math.sin(a) < 0 ? 0 : 0), '#c88a3e'); }
        // strike light on the ring that was hit
        const gl = (f, r0, r1) => { if (f < 0.05) return; ctx.save(); ctx.translate(0, cy); ctx.scale(1, ryk); ctx.globalCompositeOperation = 'lighter'; ctx.beginPath(); ctx.arc(0, 0, r1 * R, 0, TAU); ctx.arc(0, 0, r0 * R, 0, TAU, true); ctx.fillStyle = `rgba(255,226,150,${0.5 * f})`; ctx.fill('evenodd'); ctx.restore(); };
        gl(vs, 0, 0.3); gl(vb, 0.36, 0.7); gl(ve, 0.74, 0.99);
        if (vd > 0.05) { ctx.fillStyle = `rgba(255,226,160,${0.25 * vd})`; rrect(ctx, -R * 0.44, yT + H * 0.42 - H * 0.13, R * 0.88, H * 0.26, 12); ctx.fill(); }
        const mall = (f, x, y, dir) => visit(ctx, x, y, f, { dir, back: 100, len: tall ? 300 : 220, hr: tall ? 22 : 17, ang: dir[0] > 0 ? 2.55 : 0.6, pad: '#e8d8b8', wood: '#a8743a' });
        mall(vs, 0, cy, [0.7, -0.8]); mall(vb, 0, cy + R * ryk * 0.52, [-0.7, -0.8]); mall(ve, 0, cy - R * ryk * 0.86, [0.7, -0.7]); mall(vd, 0, yT + H * 0.42, [-0.7, -0.7]);
        void bolt; void skinHead; void hoop; void chromeH; void mix; void clamp; void rgba; void lighter; void darker; void grain; void hash; void woodH; void stick; void visitStick; void thread; void tassel; void rot2; void eSector; void bulb; void pool; void brz; void pat; void ell;
      } };
    },
  }); },
});
// a dull, wide ring with a slow beat: the face rings long, the band a shorter drone, the edge a bright tick, the chest a hollow knock
defVoice('dongson-star', 'metal', { dur: 1.6, partials: [[1, 1, 1.1], [1.52, 0.7, 0.8], [2.4, 0.5, 0.6], [3.7, 0.3, 0.4], [5.2, 0.2, 0.3]], wobble: 2.2, gain: 0.42, strike: 0.5, wet: 0.26 });
defVoice('dongson-band', 'metal', { dur: 0.9, partials: [[1, 1, 1], [1.6, 0.6, 0.7], [2.7, 0.45, 0.5], [4.1, 0.3, 0.35]], wobble: 3, gain: 0.4, strike: 0.7, wet: 0.2 });
defVoice('dongson-edge', 'metal', { dur: 0.45, partials: [[1, 1, 1], [2.1, 0.7, 0.6], [3.6, 0.5, 0.45], [5.4, 0.3, 0.3]], gain: 0.34, strike: 0.9, wet: 0.14 });
defVoice('dongson-side', 'woodtok', { dur: 0.14, gain: 0.55, hollow: 1.2, overtone: 2.2 });

// ======================================================================================================================================================
// DABAKAN: a tall single-headed drum, narrow at the foot, bound with rattan in a diamond lattice, standing on a bright woven mat. Room: a bamboo-walled
// house with hanging woven cloths and, in the shade behind, a rack of small gongs. Two slim sticks lie beside it.
// ======================================================================================================================================================
const DAB = [['c', /centre|center|^open|^dum|^low|boom/], ['e', /edge|ring|slap|^tak|^high/], ['r', /rim|hoop|click|ping/], ['b', /body|shell|knock|side|wood|foot/]];
function bambooHouse(ctx, F, rt, S, scene) {
  const A = F.area, wallB = wallBottom(F, scene), wallH = wallB - A.y;
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
  // woven bamboo wall: a diagonal over-and-under plait in two tones, lit from a window at the right
  ctx.fillStyle = vgrad(ctx, A.y, wallB, [[0, '#6a4a1c'], [1, '#a47a34']]); ctx.fillRect(A.x, A.y, A.w, wallH);
  const sw = 26;
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, wallH); ctx.clip();
  for (let dir = -1; dir <= 1; dir += 2) for (let k = -Math.ceil(wallH / sw); k < (A.w + wallH) / sw + 2; k++) {
    const x0 = A.x + k * sw, c = (k + (dir > 0 ? 1 : 0)) % 2 ? '#d8b868' : '#b4893c';
    ctx.fillStyle = rgba(c, dir > 0 ? 0.75 : 0.85); ctx.beginPath(); ctx.moveTo(x0, A.y); ctx.lineTo(x0 + sw * 0.62, A.y); ctx.lineTo(x0 + sw * 0.62 + dir * wallH, A.y + wallH); ctx.lineTo(x0 + dir * wallH, A.y + wallH); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(40,24,4,0.35)'; ctx.lineWidth = 1.4; ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = vgrad(ctx, A.y, wallB, [[0, 'rgba(20,10,0,0.55)'], [0.4, 'rgba(20,10,0,0.1)'], [1, 'rgba(20,10,0,0.3)']]); ctx.fillRect(A.x, A.y, A.w, wallH);
  // a post at each side, a lintel, and the sun slanting in
  const pw = Math.min(A.w * 0.07, 56);
  for (const px of [A.x + pw * 0.5, A.x + A.w - pw * 0.5]) { ctx.fillStyle = hgrad(ctx, px - pw / 2, px + pw / 2, [[0, '#2a1606'], [0.3, '#8a5a24'], [0.6, '#5a3412'], [1, '#1e0e04']]); ctx.fillRect(px - pw / 2, A.y, pw, wallH); }
  ctx.fillStyle = vgrad(ctx, A.y, A.y + wallH * 0.06, [[0, '#2a1606'], [1, '#5a3412']]); ctx.fillRect(A.x, A.y, A.w, wallH * 0.06);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(A.x + A.w, A.y, A.x + A.w * 0.3, wallB); g.addColorStop(0, 'rgba(255,224,150,0.5)'); g.addColorStop(1, 'rgba(255,224,150,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(A.x + A.w, A.y + wallH * 0.06); ctx.lineTo(A.x + A.w * 0.72, A.y + wallH * 0.06); ctx.lineTo(A.x + A.w * 0.12, wallB); ctx.lineTo(A.x + A.w * 0.5, wallB); ctx.closePath(); ctx.fill(); ctx.restore();
  // hanging woven cloths with geometric bands
  const cloth = (x, y, w, h, cols, seed) => { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 7, y + 6, w, h); ctx.fillStyle = cols[0]; ctx.fillRect(x, y, w, h); let yy = y + h * 0.06; for (let k = 0; k < 9; k++) { const bh = h * (0.04 + 0.05 * hash(seed + k)), c = cols[1 + k % (cols.length - 1)]; ctx.fillStyle = c; ctx.fillRect(x, yy, w, bh); if (k % 2) { ctx.fillStyle = cols[0]; for (let xx = x + 6; xx < x + w - 6; xx += 14) { ctx.beginPath(); ctx.moveTo(xx, yy + bh); ctx.lineTo(xx + 6, yy + 1); ctx.lineTo(xx + 12, yy + bh); ctx.closePath(); ctx.fill(); } } yy += bh + h * 0.045; } ctx.strokeStyle = '#2a1606'; ctx.lineWidth = 5; ctx.strokeRect(x, y, w, h); for (let xx = x + 6; xx < x + w; xx += 10) { ctx.strokeStyle = cols[1]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xx, y + h); ctx.lineTo(xx + (hash(xx) - 0.5) * 3, y + h + 18); ctx.stroke(); } };
  const cw = Math.min(A.w * 0.2, 150), ch = wallH * 0.52;
  cloth(A.x + A.w * 0.12, A.y + wallH * 0.1, cw, ch, ['#7a1c1c', '#f0c84a', '#1f8a7a', '#efe4c8', '#232b6a'], 3);
  cloth(A.x + A.w * 0.88 - cw, A.y + wallH * 0.12, cw, ch * 0.9, ['#1c5a56', '#e8b030', '#c8321e', '#f2e8cc', '#3a2a7a'], 9);
  // a rack of small gongs lying in a row, in the shade behind the drum
  { const gy = A.y + wallH * 0.86, gx0 = A.x + A.w * 0.3, gx1 = A.x + A.w * 0.78; ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(gx0, gy + 8, gx1 - gx0, 18); ctx.fillStyle = vgrad(ctx, gy, gy + 18, [[0, '#7a4a20'], [1, '#2a1606']]); ctx.fillRect(gx0, gy, gx1 - gx0, 16); for (let k = 0; k < 8; k++) { const r = (18 + (7 - k) * 1.5) * Math.min(1.5, A.w / 700), x = gx0 + (k + 0.6) * (gx1 - gx0) / 8; ctx.fillStyle = rgrad(ctx, x - r * 0.3, gy - r * 0.9, 0, r * 1.3, [[0, '#f4d676'], [0.55, '#a8761c'], [1, '#3a2206']]); circ(ctx, x, gy - r * 0.2, r); ctx.fill(); ctx.strokeStyle = '#2a1604'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#f9e49a'; circ(ctx, x, gy - r * 0.2, r * 0.3); ctx.fill(); } }
  // floor: split-bamboo slats and the shade of the house
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(A.x, wallB - 2, A.w, 6);
  const fh = A.y + A.h - wallB; ctx.fillStyle = vgrad(ctx, wallB, A.y + A.h, [[0, '#8a6428'], [1, '#3a2408']]); ctx.fillRect(A.x, wallB, A.w, fh);
  for (let k = -12; k <= 12; k++) { ctx.fillStyle = k % 2 ? 'rgba(255,230,160,0.1)' : 'rgba(0,0,0,0.16)'; ctx.beginPath(); ctx.moveTo(A.x + A.w / 2 + k * A.w * 0.025, wallB); ctx.lineTo(A.x + A.w / 2 + (k + 1) * A.w * 0.025, wallB); ctx.lineTo(A.x + A.w / 2 + (k + 1) * A.w * 0.13, A.y + A.h); ctx.lineTo(A.x + A.w / 2 + k * A.w * 0.13, A.y + A.h); ctx.closePath(); ctx.fill(); }
  for (let k = 1; k < 6; k++) { const yy = wallB + fh * Math.pow(k / 6, 1.5); ctx.strokeStyle = 'rgba(20,10,0,0.45)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(A.x, yy); ctx.lineTo(A.x + A.w, yy); ctx.stroke(); }
  ctx.restore();
  pool(ctx, A.x + A.w * 0.5, wallB + fh * 0.2, A.w * 0.5, A.h * 0.28, '#ffd890', 0.3); vignette(ctx, A, 0.52);
}
function woven(ctx, x, y, w, h) {   // a bright woven mat with zigzag bands
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, x + 8, y + 10, w, h, 6); ctx.fill(); rrect(ctx, x, y, w, h, 6); ctx.clip(); ctx.fillStyle = '#e8c04a'; ctx.fillRect(x, y, w, h);
  const bands = [['#c8321e', '#f4ecd0'], ['#1f8a7a', '#f4ecd0'], ['#2a3a8a', '#e8c04a']]; const bh = h / 7;
  for (let b = 0; b < 7; b++) { const [c1, c2] = bands[b % 3], y0 = y + b * bh; ctx.fillStyle = c1; ctx.fillRect(x, y0, w, bh * 0.7); const n = Math.ceil(w / (bh * 0.8)); for (let k = 0; k < n; k++) { ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(x + k * bh * 0.8, y0 + bh * 0.7); ctx.lineTo(x + k * bh * 0.8 + bh * 0.4, y0); ctx.lineTo(x + (k + 1) * bh * 0.8, y0 + bh * 0.7); ctx.closePath(); ctx.fill(); } }
  for (let k = 0; k < w / 4; k++) { ctx.fillStyle = `rgba(0,0,0,${0.04 + 0.05 * hash(k)})`; ctx.fillRect(x + k * 4, y, 1.6, h); }
  ctx.restore(); ctx.strokeStyle = '#3a2208'; ctx.lineWidth = 4; rrect(ctx, x, y, w, h, 6); ctx.stroke();
}
registerDrumStage({
  id: 'dabakan', match: /dabakan|dabakin|dabaken/,
  build: (S, lanes, P) => { const zoneOf = []; return createDrumStage('dabakan', S, lanes, P, {
    heroClean: true,
    dress: withLayer(bambooHouse),
    voiceOf: (i) => `dabakan-${zoneOf[i] ?? 'c'}`,
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 960 } : { w: 1040, h: 580 }, keyOf = assignZones(K, DAB.map(([key, re]) => ({ key, re })));
      for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const Rt = tall ? 172 : 138, Rf = Rt * 0.46, ryk = 0.38, yT = tall ? 230 : 124, H = tall ? 560 : 376, cx = tall ? 0 : -120, yB = yT + H, by = {};
      by.c = eSpot(cx, yT, Rt * 0.46, Rt * 0.46 * ryk, 0, { apk: 0.95 });
      by.e = eRing(cx, yT, Rt, Rt * ryk, 0, 0.58, 0.96, PI / 2);
      by.r = eSector(cx, yT, Rt, Rt * ryk, 0, 1.02, 1.26, d2r(190), d2r(350), { cueR: Rt * 0.1 });
      by.b = rectSpot(cx, yT + H * 0.34, Rt * 0.46, H * 0.085, 0, { rad: 12 });
      const spots = new Array(K.N).fill(null); for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
      const rAt = (t) => lerp(Rt * 0.97, Rf, Math.pow(t, 0.8)) + (t > 0.86 ? (t - 0.86) / 0.14 * Rf * 0.22 : 0);
      const col = '#a8561e';
      return { ref, spots, wallU: yB + 10 + (tall ? 20 : 0), draw(ctx, rt) {
        const vc = fl(K, keyOf, rt, 'c'), ve = fl(K, keyOf, rt, 'e', 'r'), vb = fl(K, keyOf, rt, 'b');
        // the mat
        woven(ctx, cx - (tall ? 300 : 300), yB - (tall ? 20 : 8), tall ? 600 : 600, tall ? 150 : 100);
        floorShadow(ctx, cx + 10, yB + 6, Rt * 1.1, 20, 0.6);
        const N = 36, path = () => { ctx.beginPath(); for (let k = 0; k <= N; k++) { const t = k / N; ctx.lineTo(cx - rAt(t), yT + H * t); } ctx.ellipse(cx, yB, rAt(1), rAt(1) * ryk, 0, PI, 0, true); for (let k = N; k >= 0; k--) { const t = k / N; ctx.lineTo(cx + rAt(t), yT + H * t); } ctx.closePath(); };
        ctx.save(); ctx.translate(12, 12); path(); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill(); ctx.restore();
        path(); ctx.fillStyle = hgrad(ctx, cx - Rt, cx + Rt, [[0, darker(col, 0.66)], [0.14, darker(col, 0.3)], [0.3, lighter(col, 0.4)], [0.42, lighter(col, 0.1)], [0.62, col], [0.88, darker(col, 0.5)], [1, darker(col, 0.78)]]); ctx.fill();
        ctx.save(); path(); ctx.clip(); grain(ctx, cx - Rt, yT, 2 * Rt, H + 30, '#1c0a02', 0.45, 6, true, 28);
        // a carved band of leaf scrolls round the shoulder and a row of diamonds near the foot
        for (let k = 0; k < 9; k++) { const th2 = -PI / 2 + PI * (k + 0.5) / 9, c = Math.cos(th2), x = cx + Math.sin(th2) * rAt(0.2); ctx.save(); ctx.translate(x, yT + H * 0.2 + 5); ctx.scale(Math.max(0.15, c), 1); ctx.strokeStyle = 'rgba(30,12,2,0.8)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.bezierCurveTo(-14, -16, 8, -16, 8, -2); ctx.bezierCurveTo(8, 8, -4, 6, -2, -2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(14, 6); ctx.bezierCurveTo(16, -4, 6, 12, 10, 14); ctx.stroke(); ctx.restore(); }
        for (let k = 0; k < 11; k++) { const th2 = -PI / 2 + PI * (k + 0.5) / 11, c = Math.cos(th2), x = cx + Math.sin(th2) * rAt(0.86); ctx.save(); ctx.translate(x, yT + H * 0.86); ctx.scale(Math.max(0.15, c), 1); ctx.fillStyle = 'rgba(30,12,2,0.7)'; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(7, 0); ctx.lineTo(0, 9); ctx.lineTo(-7, 0); ctx.closePath(); ctx.fill(); ctx.restore(); }
        ctx.fillStyle = hgrad(ctx, cx - Rt, cx + Rt, [[0.2, 'rgba(255,255,255,0)'], [0.31, 'rgba(255,236,200,0.3)'], [0.4, 'rgba(255,255,255,0)']]); ctx.fillRect(cx - Rt, yT, 2 * Rt, H + 30);
        ctx.restore(); path(); ctx.strokeStyle = 'rgba(30,12,2,0.9)'; ctx.lineWidth = 2.6; ctx.stroke();
        // rattan lashing: two bands of diagonal cord wrapped round the body, crossing in a lattice
        const lash = (t0, t1, n) => { for (let k = 0; k < n; k++) { const f0 = -1 + 2 * (k + 0.5) / n; for (const [a, b] of [[f0, f0 + 2 / n * 0.9], [f0 + 2 / n * 0.9, f0]]) { if (Math.abs(a) > 0.96 && Math.abs(b) > 0.96) continue; const xa = cx + a * rAt(t0) * 0.97, xb = cx + b * rAt(t1) * 0.97; thread(ctx, xa, yT + H * t0 + Math.sqrt(1 - Math.min(1, a * a)) * rAt(t0) * ryk * 0.6, xb, yT + H * t1 + Math.sqrt(1 - Math.min(1, b * b)) * rAt(t1) * ryk * 0.6, 4.4, '#d8b068'); } } };
        lash(0.4, 0.78, 12);
        for (const t of [0.4, 0.78]) { ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(cx, yT + H * t, rAt(t) * 1.01, rAt(t) * ryk * 1.01, 0, 0.02, PI - 0.02); ctx.stroke(); ctx.strokeStyle = '#c89a50'; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(cx, yT + H * t, rAt(t) * 1.01, rAt(t) * ryk * 1.01, 0, 0.02, PI - 0.02); ctx.stroke(); ctx.strokeStyle = 'rgba(255,240,190,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, yT + H * t - 2, rAt(t) * 1.01, rAt(t) * ryk * 1.01, 0, 0.3, PI - 0.3); ctx.stroke(); }
        // the head: a rattan hoop and a pale stretched hide
        ctx.save(); ctx.translate(cx, yT); ctx.scale(1, ryk);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, 6, 10, Rt + 16, Rt + 16); ctx.fill();
        hoop(ctx, Rt, Rt, Rt * 0.1, { kind: 'rope', col: '#b88a48' });
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 0, 0, Rt + 1, Rt + 1); ctx.fill();
        skinHead(ctx, Rt, Rt, { tint: '#e8d4a0', edge: '#a88444', seed: 14, vib: vc * 0.8 + ve * 0.6, wear: 0.9 });
        ctx.restore();
        if (vb > 0.05) { ctx.fillStyle = `rgba(255,230,170,${0.28 * vb})`; rrect(ctx, cx - Rt * 0.46, yT + H * 0.34 - H * 0.085, Rt * 0.92, H * 0.17, 12); ctx.fill(); }
        // two slim sticks lie on the mat; one flies in to strike
        stick(ctx, cx + Rt * 0.6, yB + (tall ? 36 : 14), -0.02, tall ? 250 : 200, 9, { col: '#cfae6a', nodes: [0.3, 0.62] }); stick(ctx, cx + Rt * 0.78, yB + (tall ? 62 : 32), 0.01, tall ? 240 : 196, 9, { col: '#c29a52', nodes: [0.3, 0.62] });
        visitStick(ctx, cx - Rt * 0.1, yT + 4, Math.max(vc, ve), { ang: 2.5, dir: [0.7, -0.7], back: 120, len: tall ? 250 : 190, w: 9, col: '#d6b668', nodes: [0.3, 0.62] });
        void bolt; void chromeH; void mix; void clamp; void lighter; void woodH; void tassel; void rot2; void bulb; void pool; void blob; void speckle;
      } };
    },
  }); },
});
defVoice('dabakan-c', 'skin', { dur: 0.36, drop: 1.14, glide: 0.04, modes: [[1, 1, 1], [1.65, 0.5, 0.55], [2.4, 0.3, 0.4]], shell: { f: 190, q: 6, gain: 0.45, dur: 0.2 }, click: { f: 1900, gain: 0.35 }, lp: 3400, gain: 0.68 });
defVoice('dabakan-e', 'skin', { dur: 0.13, drop: 1.07, glide: 0.02, modes: [[1, 1, 1], [2.2, 0.6, 0.55], [3.3, 0.4, 0.4]], click: { f: 3600, gain: 0.8, dur: 0.02 }, lp: 8000, gain: 0.5 });
defVoice('dabakan-r', 'woodtok', { dur: 0.07, gain: 0.5, hollow: 2.0, overtone: 3.8 });
defVoice('dabakan-b', 'woodtok', { dur: 0.13, gain: 0.55, hollow: 1.3, overtone: 2.5 });

// ======================================================================================================================================================
// TAVIL: the big barrel drum of south Indian processions, seen head-on from the stick side: a thick ring of leather round a skin with a black paste at the
// middle, and a fan of broad leather straps running back from the hoop. Room: the striped awning of a festival ground, marigold garlands and lamps, pale
// stone underfoot. A thin wooden stick strikes the skin.
// ======================================================================================================================================================
const TAV = [['c', /paste|centre|center|^low|boom|^tha|^dhin/], ['m', /open|mid|^tom|^din/], ['o', /slap|outer|^high|^ta?k|^ki/], ['r', /rim|hoop|click|ring/], ['s', /strap|leather|lace|^s$/]];
function festivalAwning(ctx, F, rt, S, scene) {
  const A = F.area, wallB = wallBottom(F, scene), wallH = wallB - A.y;
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
  // evening sky and warm haze behind the awning
  ctx.fillStyle = vgrad(ctx, A.y, wallB, [[0, '#0e2c44'], [0.55, '#3a5a6a'], [1, '#e8a060']]); ctx.fillRect(A.x, A.y, A.w, wallH);
  // the awning: vertical stripes of turquoise, cream and saffron with a scalloped hem, swagged between two poles
  const aw = A.w, ah = wallH * 0.36, n = Math.round(aw / 54), sw = aw / n, cols = ['#1aa0a0', '#f4e8c4', '#f2a424', '#f4e8c4'];
  for (let k = 0; k < n; k++) { const x = A.x + k * sw; ctx.fillStyle = hgrad(ctx, x, x + sw, [[0, darker(cols[k % 4], 0.3)], [0.5, cols[k % 4]], [1, darker(cols[k % 4], 0.3)]]); ctx.beginPath(); ctx.moveTo(x, A.y); ctx.lineTo(x + sw, A.y); ctx.lineTo(x + sw, A.y + ah); ctx.quadraticCurveTo(x + sw / 2, A.y + ah + sw * 0.55, x, A.y + ah); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = vgrad(ctx, A.y, A.y + ah, [[0, 'rgba(0,0,0,0.5)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.2)']]); ctx.fillRect(A.x, A.y, A.w, ah + sw * 0.5);
  for (let k = 0; k < n; k++) { const x = A.x + (k + 0.5) * sw; ctx.fillStyle = '#e8c260'; circ(ctx, x, A.y + ah + sw * 0.28, 3.4); ctx.fill(); }
  // marigold garlands looping from the awning to the poles, and hanging oil lamps
  const garland = (x0, y0, x1, y1, sag, seed) => { const m = 34; for (let k = 0; k <= m; k++) { const t = k / m, x = lerp(x0, x1, t), y = lerp(y0, y1, t) + sag * Math.sin(PI * t); for (const [c, r, dy] of [['#d86a10', 11, 0], ['#f4a820', 9, -1], ['#ffd04a', 5.4, -1]]) { ctx.fillStyle = c; circ(ctx, x + (hash(seed + k) - 0.5) * 3, y + dy + (hash(seed + k + 7) - 0.5) * 3, r); ctx.fill(); } } };
  garland(A.x + 8, A.y + ah * 0.9, A.x + A.w * 0.5, A.y + ah * 1.25 + 8, wallH * 0.12, 1); garland(A.x + A.w * 0.5, A.y + ah * 1.25 + 8, A.x + A.w - 8, A.y + ah * 0.9, wallH * 0.12, 9);
  for (const fx of [0.14, 0.86]) { const x = A.x + A.w * fx, y0 = A.y + ah + sw * 0.5 + 10; ctx.strokeStyle = '#1a0e06'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + wallH * 0.1); ctx.stroke(); ctx.fillStyle = hgrad(ctx, x - 16, x + 16, [[0, '#6a4410'], [0.4, '#f4d676'], [0.75, '#a87a1c'], [1, '#4a2c08']]); ctx.beginPath(); ctx.moveTo(x - 14, y0 + wallH * 0.1); ctx.quadraticCurveTo(x, y0 + wallH * 0.1 + 24, x + 14, y0 + wallH * 0.1); ctx.lineTo(x + 9, y0 + wallH * 0.1 - 4); ctx.lineTo(x - 9, y0 + wallH * 0.1 - 4); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(40,20,4,0.8)'; ctx.lineWidth = 2; ctx.stroke(); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgrad(ctx, x, y0 + wallH * 0.1 - 10, 0, 62, [[0, 'rgba(255,200,100,0.6)'], [1, 'rgba(255,200,100,0)']]); ctx.fillRect(x - 62, y0 + wallH * 0.1 - 72, 124, 124); ctx.restore(); ctx.fillStyle = '#fff2b0'; ell(ctx, x, y0 + wallH * 0.1 - 9, 3.6, 7); ctx.fill(); }
  // a distant crowd of lights and a low wall of the ground
  for (let k = 0; k < 18; k++) bulb(ctx, A.x + A.w * (0.05 + 0.9 * hash(k * 5 + 1)), A.y + wallH * (0.52 + 0.22 * hash(k * 3 + 2)), 3, '#ffcf80');
  ctx.fillStyle = 'rgba(30,18,10,0.9)'; ctx.fillRect(A.x, A.y + wallH * 0.82, A.w, wallH * 0.18);
  // the platform: pale stone slabs with a worn red border, light from the lamps
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(A.x, wallB - 2, A.w, 6);
  const fh = A.y + A.h - wallB; ctx.fillStyle = vgrad(ctx, wallB, A.y + A.h, [[0, '#d8c8a8'], [1, '#8a7a5c']]); ctx.fillRect(A.x, wallB, A.w, fh);
  for (let k = 1; k < 6; k++) { const yy = wallB + fh * Math.pow(k / 6, 1.45); ctx.strokeStyle = 'rgba(60,40,20,0.35)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(A.x, yy); ctx.lineTo(A.x + A.w, yy); ctx.stroke(); }
  for (let k = -7; k <= 7; k++) { ctx.strokeStyle = 'rgba(60,40,20,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(A.x + A.w / 2 + k * A.w * 0.05, wallB); ctx.lineTo(A.x + A.w / 2 + k * A.w * 0.22, A.y + A.h); ctx.stroke(); }
  speckle(ctx, A.x, wallB, A.w, fh, 150, '#4a3a20', 0.2, 6, 0.8, 2.4);
  ctx.restore();
  pool(ctx, A.x + A.w * 0.5, wallB + fh * 0.15, A.w * 0.55, A.h * 0.28, '#ffd890', 0.36); vignette(ctx, A, 0.5);
}
registerDrumStage({
  id: 'tavil', match: /tavil|thavil|thavil|tavil.?drum/,
  build: (S, lanes, P) => { const zoneOf = []; return createDrumStage('tavil', S, lanes, P, {
    heroClean: true,
    dress: withLayer(festivalAwning),
    voiceOf: (i) => `tavil-${zoneOf[i] ?? 'c'}`,
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 960 } : { w: 1040, h: 580 }, keyOf = assignZones(K, TAV.map(([key, re]) => ({ key, re })));
      for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const R = tall ? 190 : 138, cx = tall ? -70 : -100, cy = tall ? 540 : 262, ryk = 0.97, rot = -0.08, by = {};
      by.c = eSpot(cx, cy, R * 0.22, R * 0.22 * ryk, rot, { apk: 0.95 });
      by.m = eSector(cx, cy, R, R * ryk, rot, 0.34, 0.62, d2r(45), d2r(135), { cueR: R * 0.13 });
      by.o = eSector(cx, cy, R, R * ryk, rot, 0.68, 0.97, d2r(215), d2r(325), { cueR: R * 0.13 });
      by.r = eSector(cx, cy, R, R * ryk, rot, 1.02, 1.2, d2r(150), d2r(235), { cueR: R * 0.09 });
      by.s = eSector(cx, cy, R, R * ryk, rot, 1.28, 1.72, d2r(-8), d2r(62), { cueR: R * 0.13 });
      const spots = new Array(K.N).fill(null); for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
      return { ref, spots, wallU: cy + R * 1.34, draw(ctx, rt) {
        const vc = fl(K, keyOf, rt, 'c'), vm = fl(K, keyOf, rt, 'm'), vo = fl(K, keyOf, rt, 'o'), vr = fl(K, keyOf, rt, 'r'), vs = fl(K, keyOf, rt, 's');
        floorShadow(ctx, cx + R * 0.3, cy + R * 1.5, R * 1.7, R * 0.2, 0.6);
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
        // the barrel behind: the body shows as a crescent of dark wood below and to the right of the head, and broad leather straps run from the hoop to
        // the far hoop across it
        const ox = R * 0.58, oy = R * 0.3, Rb = R * 1.14;
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, ox + 14, oy + 22, Rb); ctx.fill();
        const barrel = () => { ctx.beginPath(); ctx.arc(ox, oy, Rb, 0, TAU); };
        barrel(); ctx.fillStyle = rgrad(ctx, ox - Rb * 0.2, oy - Rb * 0.3, Rb * 0.3, Rb * 1.3, [[0, '#8a5026'], [0.5, '#4a2810'], [1, '#1c0e06']]); ctx.fill();
        ctx.save(); barrel(); ctx.clip(); grain(ctx, ox - Rb, oy - Rb, 2 * Rb, 2 * Rb, '#0a0402', 0.5, 4, false, 40);
        const ang0 = Math.atan2(oy, ox);
        for (let k = 0; k < 4; k++) { ctx.strokeStyle = k % 2 ? 'rgba(232,194,96,0.8)' : 'rgba(10,4,2,0.7)'; ctx.lineWidth = k % 2 ? 3 : 4; ctx.beginPath(); ctx.arc(ox, oy, Rb * (0.9 - k * 0.075), 0, TAU); ctx.stroke(); }
        ctx.restore(); barrel(); ctx.strokeStyle = 'rgba(10,4,2,0.9)'; ctx.lineWidth = 3; ctx.stroke();
        const nS = 22;
        for (let k = 0; k < nS; k++) { const a = (k / nS) * TAU, a2 = a + TAU / nS * 0.8; if (Math.cos(a - ang0) < -0.1 && Math.cos(a2 - ang0) < -0.1) continue;
          const x0 = Math.cos(a) * R * 1.19, y0 = Math.sin(a) * R * 1.19, x1 = ox + Math.cos(a2) * Rb * 0.97, y1 = oy + Math.sin(a2) * Rb * 0.97;
          for (const [w, c, dx] of [[R * 0.08, 'rgba(0,0,0,0.4)', 3], [R * 0.07, '#2e160a', 0], [R * 0.052, '#8a4c26', 0], [R * 0.012, 'rgba(255,214,160,0.5)', -R * 0.012]]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0 + dx, y0 + dx); ctx.lineTo(x1 + dx, y1 + dx); ctx.stroke(); } }
        for (let k = 0; k < 22; k++) { const a = (k / 22) * TAU + 0.1; if (Math.cos(a - ang0) < 0) continue; const bx = ox + Math.cos(a) * Rb * 0.97, by2 = oy + Math.sin(a) * Rb * 0.97; ctx.fillStyle = rgrad(ctx, bx - 2, by2 - 2, 0, 7, [[0, '#fff0b0'], [1, '#8a6014']]); circ(ctx, bx, by2, 4.4); ctx.fill(); }
        ctx.strokeStyle = '#b8986a'; ctx.lineWidth = R * 0.07; ctx.beginPath(); ctx.arc(ox, oy, Rb * 1.0, ang0 - 1.5, ang0 + 1.5); ctx.stroke();
        if (vs > 0.05) { ctx.save(); barrel(); ctx.clip(); ctx.fillStyle = `rgba(255,214,150,${0.3 * vs})`; ctx.fillRect(ox - Rb, oy - Rb, 2 * Rb, 2 * Rb); ctx.restore(); }
        // the carrying sling: a broad woven strap of saffron and crimson looped over the hoop and hanging to the floor, a tassel at its end
        { const a = d2r(200), x0 = Math.cos(a) * R * 1.14, y0 = Math.sin(a) * R * 1.14, x1 = -R * 1.52, y1 = R * 0.35, x2 = -R * 1.28, y2 = R * 1.42;
          const strap = (w, c, dx) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(x0 + dx, y0 + dx); ctx.bezierCurveTo(x0 - R * 0.5 + dx, y0 - R * 0.35 + dx, x1 + dx, y1 - R * 0.5 + dx, x1 + dx, y1 + dx); ctx.bezierCurveTo(x1 + dx, y1 + R * 0.5 + dx, x2 + dx, y2 - R * 0.5 + dx, x2 + dx, y2 + dx); ctx.stroke(); };
          strap(R * 0.2, 'rgba(0,0,0,0.38)', 6); strap(R * 0.19, '#8a1c18', 0); strap(R * 0.15, '#e8a020', 0);
          ctx.save(); ctx.setLineDash([R * 0.05, R * 0.05]); strap(R * 0.07, '#8a1c18', 0); ctx.restore(); strap(R * 0.012, 'rgba(255,240,200,0.5)', -R * 0.05);
          tassel(ctx, x2, y2, R * 0.2, '#c8302a', R * 0.2); }
        // the hoop: a wide ring of dark wood bound in cloth, then the thick leather rim, then the skin with its black paste
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, 8, 12, R * 1.22); ctx.fill();
        hoop(ctx, R * 1.0, R * 1.0, R * 0.2, { kind: 'rope', col: '#8a5a2c' });
        ctx.save(); ctx.setLineDash([R * 0.09, R * 0.09]); ctx.strokeStyle = 'rgba(26,160,160,0.85)'; ctx.lineWidth = R * 0.07; ctx.beginPath(); ctx.arc(0, 0, R * 1.1, 0, TAU); ctx.stroke(); ctx.restore();
        ctx.strokeStyle = '#e8c260'; ctx.lineWidth = 3; circ(ctx, 0, 0, R * 1.2); ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.32)'; circ(ctx, 0, 0, R * 1.0 + 1); ctx.fill();
        skinHead(ctx, R, R, { tint: '#efdcae', edge: '#a8844a', seed: 11, vib: Math.max(vm, vo) * 0.9 + vc * 0.4, wear: 0.9 });
        ctx.fillStyle = rgrad(ctx, -R * 0.04, -R * 0.06, 0, R * 0.26, [[0, '#2a2420'], [0.7, '#14100e'], [1, '#080606']]); circ(ctx, 0, 0, R * 0.25); ctx.fill(); ctx.strokeStyle = 'rgba(255,240,210,0.3)'; ctx.lineWidth = 2; circ(ctx, 0, 0, R * 0.25); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.16)'; ell(ctx, -R * 0.08, -R * 0.1, R * 0.08, R * 0.04); ctx.fill();
        ctx.strokeStyle = 'rgba(80,50,20,0.4)'; ctx.lineWidth = 2; circ(ctx, 0, 0, R * 0.64); ctx.stroke();
        if (vr > 0.05) { ctx.beginPath(); ctx.arc(0, 0, R * 1.2, 0, TAU); ctx.arc(0, 0, R * 1.0, 0, TAU, true); ctx.fillStyle = `rgba(255,220,160,${0.35 * vr})`; ctx.fill('evenodd'); }
        ctx.restore();
        stick(ctx, cx + R * 0.62, cy + R * 1.38, -0.05, tall ? 260 : 210, 11, { col: '#d0a868', tip: 0.5, nodes: [0.4] });
        visitStick(ctx, cx - R * 0.1, cy - R * 0.1, Math.max(vc, vm, vo), { ang: 2.45, dir: [0.7, -0.75], back: 130, len: tall ? 300 : 240, w: 13, col: '#d6b070', tip: 0.5 });
        void bolt; void chromeH; void mix; void clamp; void lighter; void darker; void rgba; void woodH; void thread; void tassel; void rot2; void pool; void blob; void hgrad; void rgrad; void d2r;
      } };
    },
  }); },
});
defVoice('tavil-c', 'skin', { dur: 0.3, drop: 1.12, glide: 0.04, modes: [[1, 1, 1], [1.5, 0.55, 0.6], [2.0, 0.3, 0.45]], shell: { f: 170, q: 6, gain: 0.4, dur: 0.18 }, click: { f: 1500, gain: 0.35 }, lp: 2600, gain: 0.72 });
defVoice('tavil-m', 'skin', { dur: 0.22, drop: 1.1, glide: 0.03, modes: [[1, 1, 1], [1.8, 0.6, 0.55], [2.7, 0.4, 0.45]], click: { f: 2800, gain: 0.6, dur: 0.02 }, shell: { f: 400, q: 6, gain: 0.25, dur: 0.12 }, lp: 6500, gain: 0.56 });
defVoice('tavil-o', 'skin', { dur: 0.11, drop: 1.06, glide: 0.015, modes: [[1, 1, 1], [2.3, 0.65, 0.55], [3.5, 0.45, 0.4]], click: { f: 4200, q: 1, gain: 1.0, dur: 0.018 }, lp: 10000, gain: 0.48 });
defVoice('tavil-r', 'woodtok', { dur: 0.07, gain: 0.5, hollow: 2.0, overtone: 3.8 });
defVoice('tavil-s', 'woodtok', { dur: 0.1, gain: 0.46, hollow: 1.1, overtone: 2.2 });

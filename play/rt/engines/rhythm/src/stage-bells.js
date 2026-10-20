// Bell stages (1.21.0): the gankogui (a double iron bell hung on a hook, struck with a stick), the skrabalai (tuned wooden bell-boxes with clappers on a
// timber rack) and a set of handbells (brass bells standing on a padded table in two ranks, like piano keys). Each is its own picture, room and voice.
// No performer and no hands: a stick visits the struck iron bell, a mallet visits the struck wooden box, a handbell rocks and its clapper swings.
import { eSpot, rSpot } from './drum-kit.js';
import { mkGong, visit } from './stage-gongs.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU, PI, lerp, glow, hangCord, beam, scrollBand, rings, padBeater } from './gong-kit.js';

const rock = (ctx, px, py, a, fn) => { ctx.save(); ctx.translate(px, py); ctx.rotate(a); ctx.translate(-px, -py); fn(); ctx.restore(); };

// ============================================================ GANKOGUI (double iron bell) ======================================================
function ironCone(ctx, cx, y0, y1, rx, col, o = {}) {   // a conical iron bell, narrow at the top, an open mouth at the bottom (seen from slightly above)
  const { f = 0, seed = 3, ryk = 0.2 } = o, rt = rx * 0.2, ry = rx * ryk;
  const side = (g) => { g.beginPath(); g.moveTo(cx - rt, y0); g.bezierCurveTo(cx - rt * 1.5, y0 + (y1 - y0) * 0.5, cx - rx * 0.85, y0 + (y1 - y0) * 0.8, cx - rx, y1); g.ellipse(cx, y1, rx, ry, 0, PI, 0, true); g.bezierCurveTo(cx + rx * 0.85, y0 + (y1 - y0) * 0.8, cx + rt * 1.5, y0 + (y1 - y0) * 0.5, cx + rt, y0); g.closePath(); };
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.36)'; ctx.save(); ctx.translate(12, 14); side(ctx); ctx.fill(); ctx.restore();
  // the dark inside of the mouth, then the outer wall over it
  ctx.fillStyle = '#0c0806'; ell(ctx, cx, y1, rx, ry); ctx.fill();
  side(ctx); ctx.fillStyle = hgrad(ctx, cx - rx, cx + rx, [[0, darker(col, 0.62)], [0.16, lighter(col, 0.32)], [0.34, lighter(col, 0.06)], [0.58, col], [0.84, darker(col, 0.5)], [1, darker(col, 0.72)]]); ctx.fill();
  ctx.save(); side(ctx); ctx.clip();
  for (let k = 0; k < 26; k++) { const t = hash(seed + k), y = y0 + (y1 - y0) * t, w = rt + (rx - rt) * Math.pow(t, 1.2); ctx.fillStyle = `rgba(${120 + 60 * hash(k)},${60 + 30 * hash(k + 3)},20,${0.1 + 0.16 * hash(k + 7)})`; ell(ctx, cx + (hash(seed + k * 3) - 0.5) * w * 1.4, y, w * (0.1 + 0.2 * hash(k + 9)), (y1 - y0) * (0.02 + 0.04 * hash(k + 5))); ctx.fill(); }   // rust
  for (let k = 0; k < 40; k++) { const t = 0.05 + 0.9 * hash(seed + k * 2.3), y = y0 + (y1 - y0) * t, w = rt + (rx - rt) * Math.pow(t, 1.2), x = cx + (hash(seed + k * 4.1) - 0.5) * w * 1.7; ctx.fillStyle = 'rgba(0,0,0,0.16)'; ell(ctx, x + 1, y + 1.5, 4, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,230,190,0.13)'; ell(ctx, x - 1, y - 1, 3, 2); ctx.fill(); }   // hammer dents
  for (const t of [0.34, 0.62]) { const y = y0 + (y1 - y0) * t, w = rt + (rx - rt) * Math.pow(t, 1.2); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, y, w, w * ryk * 0.9, 0, 0.05, PI - 0.05); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(30,18,10,0.55)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(cx + rx * 0.28, y0 + 14); ctx.quadraticCurveTo(cx + rx * 0.36, (y0 + y1) / 2, cx + rx * 0.56, y1 - 6); ctx.stroke();   // the forged seam
  ctx.fillStyle = hgrad(ctx, cx - rx, cx + rx, [[0.1, 'rgba(255,255,255,0)'], [0.2, 'rgba(255,244,222,0.55)'], [0.3, 'rgba(255,255,255,0)'], [0.62, 'rgba(255,255,255,0)'], [0.7, 'rgba(255,236,208,0.2)'], [0.78, 'rgba(255,255,255,0)']]); ctx.fillRect(cx - rx, y0, 2 * rx, y1 - y0);
  ctx.restore();
  side(ctx); ctx.strokeStyle = rgba(darker(col, 0.8), 0.8); ctx.lineWidth = 2; ctx.stroke();
  // the thick lip of the mouth
  ctx.strokeStyle = rgba(lighter(col, 0.45), 0.8); ctx.lineWidth = 3.4; ctx.beginPath(); ctx.ellipse(cx, y1, rx, ry, 0, 0.05, PI - 0.05); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, y1, rx * 0.97, ry * 0.9, 0, PI, TAU); ctx.stroke();
  if (f > 0.05) { ctx.globalCompositeOperation = 'lighter'; side(ctx); ctx.fillStyle = `rgba(255,214,140,${0.4 * f})`; ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
  ctx.restore();
}
mkGong('gankogui', /gankogui|gangokui|double.?(iron.?)?bell|double.?gong|ogene/, {
  wall: { kind: 'mud', c1: '#b0663a', accent: '#f0e4c8', accent2: '#2a1a12' }, floor: { kind: 'earth', c1: '#8a5a34' }, rail: '#5a3418', light: '#ffc888', vig: 0.55,
  zones: [['loe', /low.*(edge|rim|lip)/], ['hie', /high.*(edge|rim|lip)/], ['lo', /low|big|large|deep/], ['hi', /high|small|bright/]],
  voice: null,
  build: (K) => {
    const tall = K.tall, ref = tall ? { w: 700, h: 900 } : { w: 1040, h: 600 }, by = {};
    const L = tall ? { x: -128, top: 250, bot: 740, rx: 114 } : { x: -150, top: 150, bot: 540, rx: 120 }, H = tall ? { x: 132, top: 270, bot: 640, rx: 82 } : { x: 150, top: 168, bot: 450, rx: 88 };
    by.lo = eSpot(L.x, (L.top + L.bot) / 2 + 30, L.rx * 0.62, (L.bot - L.top) * 0.3, 0, { apk: 0.9 }); by.hi = eSpot(H.x, (H.top + H.bot) / 2 + 30, H.rx * 0.62, (H.bot - H.top) * 0.3, 0, { apk: 0.9 });
    by.loe = eSpot(L.x, L.bot - 6, L.rx * 0.95, 34, 0, { apk: 0.9 }); by.hie = eSpot(H.x, H.bot - 6, H.rx * 0.95, 30, 0, { apk: 0.9 });
    const postX = tall ? 280 : 400, armY = tall ? 120 : 52, floorY = tall ? 830 : 566;
    return { ref, by, wallU: floorY - 50,
      draw(ctx, rt, fl) {
        const flo = Math.max(fl('lo'), fl('loe')), fhi = Math.max(fl('hi'), fl('hie'));
        // a wooden gallows post and arm with an iron hook; the bell hangs from the hook
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ell(ctx, postX + 20, floorY + 8, 120, 18); ctx.fill();
        beam(ctx, postX - 28, armY - 8, 56, floorY - armY + 4, '#6a4222', { vertical: true, round: 10 }); beam(ctx, postX - 70, floorY - 30, 140, 36, '#5a3418', { round: 10 });
        beam(ctx, -30, armY - 28, postX + 14, 48, '#6a4222', { round: 12 }); ctx.fillStyle = '#2a1a10'; for (const [x, y] of [[postX, armY - 4], [postX - 34, armY]]) { circ(ctx, x, y, 7); ctx.fill(); }
        // brace
        ctx.strokeStyle = '#5a3418'; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(postX - 14, armY + 150); ctx.lineTo(postX - 190, armY + 14); ctx.stroke(); ctx.strokeStyle = rgba('#b88a5a', 0.35); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(postX - 16, armY + 144); ctx.lineTo(postX - 188, armY + 12); ctx.stroke();
        const sway = Math.sin(rt.anim * 14) * Math.max(flo, fhi) * 0.018;
        rock(ctx, 0, armY + 24, sway, () => {
          ctx.strokeStyle = '#1c1208'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, armY + 16); ctx.lineTo(0, armY + 68); ctx.stroke();
          ctx.strokeStyle = '#3a2c20'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(L.x, L.top + 8); ctx.bezierCurveTo(L.x, armY + 70, -20, armY + 58, 0, armY + 70); ctx.bezierCurveTo(20, armY + 58, H.x, armY + 80, H.x, H.top + 8); ctx.stroke();
          ctx.strokeStyle = '#7a6a58'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(L.x - 3, L.top + 8); ctx.bezierCurveTo(L.x - 3, armY + 70, -20, armY + 54, 0, armY + 66); ctx.bezierCurveTo(20, armY + 54, H.x - 3, armY + 76, H.x - 3, H.top + 8); ctx.stroke();
          ironCone(ctx, L.x, L.top, L.bot, L.rx, '#5c4c44', { f: flo, seed: 4 });
          ironCone(ctx, H.x, H.top, H.bot, H.rx, '#645448', { f: fhi, seed: 9 });
        });
        if (flo > 0.05) { rings(ctx, L.x, (L.top + L.bot) / 2 + 40, L.rx * 0.9, flo); glow(ctx, L.x, (L.top + L.bot) / 2, L.rx * 1.8, '#ffb870', 0.26 * flo); }
        if (fhi > 0.05) { rings(ctx, H.x, (H.top + H.bot) / 2 + 40, H.rx * 0.9, fhi); glow(ctx, H.x, (H.top + H.bot) / 2, H.rx * 1.8, '#ffb870', 0.26 * fhi); }
        const tgt = flo >= fhi ? [L.x + L.rx * 0.3, (L.top + L.bot) / 2 + 80, flo] : [H.x + H.rx * 0.3, (H.top + H.bot) / 2 + 80, fhi];
        visit(ctx, tgt[0], tgt[1], tgt[2], { dir: [0.7, 0.5], back: 100, len: 240, hr: 11, ang: -2.55, pad: '#5a3a1e', wood: '#a87a46' });
        if (!(tgt[2] > 0.06)) padBeater(ctx, -postX * 0.55, floorY - 6, -0.04, 250, 11, { pad: '#5a3a1e', wood: '#a87a46' });
      } };
  },
});

// ============================================================ SKRABALAI (wooden bell-boxes with clappers) ======================================
function woodBox(ctx, cx, y0, w, h, col, o = {}) {
  const { f = 0, seed = 3 } = o, tw = w * 0.74, ry = w * 0.13;
  const body = (g) => { g.beginPath(); g.moveTo(cx - tw / 2, y0 + 6); g.quadraticCurveTo(cx - tw / 2, y0, cx - tw / 2 + 12, y0); g.lineTo(cx + tw / 2 - 12, y0); g.quadraticCurveTo(cx + tw / 2, y0, cx + tw / 2, y0 + 6); g.lineTo(cx + w / 2, y0 + h); g.ellipse(cx, y0 + h, w / 2, ry, 0, 0, PI); g.lineTo(cx - w / 2, y0 + h); g.closePath(); };
  ctx.save();
  // the clapper hangs out of the open mouth
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.save(); ctx.translate(9, 12); body(ctx); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#1a0e06'; ell(ctx, cx, y0 + h, w / 2, ry); ctx.fill();
  const swing = Math.sin(o.t * 26 + seed) * f * 9;
  ctx.strokeStyle = '#6a4220'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx, y0 + h - 8); ctx.lineTo(cx + swing, y0 + h + w * 0.2); ctx.stroke();
  ctx.fillStyle = rgrad(ctx, cx + swing - 3, y0 + h + w * 0.18, 0, 12, [[0, lighter(col, 0.4)], [1, darker(col, 0.5)]]); circ(ctx, cx + swing, y0 + h + w * 0.22, 9); ctx.fill();
  body(ctx); ctx.fillStyle = hgrad(ctx, cx - w / 2, cx + w / 2, [[0, darker(col, 0.55)], [0.2, lighter(col, 0.3)], [0.5, col], [0.82, darker(col, 0.4)], [1, darker(col, 0.68)]]); ctx.fill();
  ctx.save(); body(ctx); ctx.clip(); grain(ctx, cx - w / 2, y0, w, h, darker(col, 0.7), 0.42, seed, true, 9);
  // chip-carved zigzag band and a row of notches
  const by = y0 + h * 0.62, n = 6; ctx.strokeStyle = rgba(darker(col, 0.75), 0.75); ctx.lineWidth = 2.2; ctx.beginPath(); for (let k = 0; k <= n * 2; k++) { const x = cx - w * 0.5 + (w * k) / (n * 2), y = by + (k % 2 ? 7 : -7); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke();
  ctx.strokeStyle = rgba(lighter(col, 0.5), 0.4); ctx.lineWidth = 1.2; ctx.beginPath(); for (let k = 0; k <= n * 2; k++) { const x = cx - w * 0.5 + (w * k) / (n * 2), y = by + 2 + (k % 2 ? 7 : -7); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke();
  for (const q of [0.28, 0.86]) { ctx.fillStyle = 'rgba(0,0,0,0.26)'; ctx.fillRect(cx - w, y0 + h * q, 2 * w, 3); }
  ctx.fillStyle = hgrad(ctx, cx - w / 2, cx + w / 2, [[0.16, 'rgba(255,255,255,0)'], [0.26, 'rgba(255,244,214,0.3)'], [0.36, 'rgba(255,255,255,0)']]); ctx.fillRect(cx - w, y0, 2 * w, h);
  ctx.fillStyle = vgrad(ctx, y0 + h - 22, y0 + h + ry, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.42)']]); ctx.fillRect(cx - w, y0 + h - 22, 2 * w, 30);
  ctx.restore(); body(ctx); ctx.strokeStyle = rgba(darker(col, 0.8), 0.8); ctx.lineWidth = 1.8; ctx.stroke();
  ctx.strokeStyle = rgba(lighter(col, 0.4), 0.5); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, y0 + h, w / 2, ry, 0, 0.05, PI - 0.05); ctx.stroke();
  // the leather strap
  ctx.fillStyle = '#4a2a14'; rrect(ctx, cx - 7, y0 - 20, 14, 26, 4); ctx.fill(); ctx.fillStyle = 'rgba(255,220,170,0.3)'; ctx.fillRect(cx - 5, y0 - 18, 3, 22);
  if (f > 0.05) { ctx.globalCompositeOperation = 'lighter'; body(ctx); ctx.fillStyle = `rgba(255,214,150,${0.3 * f})`; ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
  ctx.restore();
}
mkGong('skrabalai', /skrabalai|wooden.?(cow)?bell|bell.?box|clapper.?box/, {
  voice: 'gx-skrabalai',
  wall: { kind: 'timber', c1: '#7a5028', c2: '#a87844', log: 76 }, floor: { kind: 'planks', c1: '#6a4424', c2: '#8a5c30', ph: 60 }, rail: '#3a2410', light: '#ffe2b0', vig: 0.55,
  orn(ctx, A, wallB) {
    // a linen runner with a red cross-stitch band hung on the logs
    const x0 = A.x + A.w * 0.1, w = A.w * 0.8, y0 = A.y + (wallB - A.y) * 0.06, h = (wallB - A.y) * 0.36;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x0 + 6, y0 + 8, w, h); ctx.fillStyle = vgrad(ctx, y0, y0 + h, [[0, '#efe6d2'], [1, '#d8cdb4']]); ctx.fillRect(x0, y0, w, h);
    for (let k = 0; k < w / 4; k++) { ctx.fillStyle = `rgba(150,130,100,${0.05 + 0.06 * hash(k)})`; ctx.fillRect(x0 + k * 4, y0, 1.5, h); }
    const s = Math.max(8, h / 8); for (const [yy, c] of [[0.3, '#b8302a'], [0.62, '#2a3a6a']]) { for (let k = 0; k * s < w; k++) { const x = x0 + k * s, y = y0 + h * yy + (k % 2 ? s * 0.5 : 0); ctx.strokeStyle = c; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s * 0.5, y + s * 0.5); ctx.moveTo(x + s * 0.5, y); ctx.lineTo(x, y + s * 0.5); ctx.stroke(); } }
    ctx.fillStyle = '#b8302a'; ctx.fillRect(x0, y0 + h - 8, w, 8); for (let k = 0; k < w / 8; k++) { ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x0 + k * 8 + 1, y0 + h, 3, 14); }
  },
  zones: Array.from({ length: 10 }, (_, i) => [`k${i}`, null]),
  build: (K) => {
    const tall = K.tall, N = Math.min(K.N, 10), perRow = Math.ceil(N / 2), ref = tall ? { w: 700, h: 860 } : { w: 1080, h: 600 }, by = {}, boxes = [];
    const gap = (ref.w - (tall ? 150 : 330)) / perRow, x0 = -gap * (perRow - 1) / 2;
    const rows = tall ? [{ y: 170, w: 90, h: 128 }, { y: 460, w: 112, h: 168 }] : [{ y: 110, w: 100, h: 144 }, { y: 360, w: 124, h: 176 }];
    for (let i = 0; i < N; i++) {
      const low = i < perRow, r = low ? rows[1] : rows[0], c = low ? i : i - perRow, nn = low ? perRow : N - perRow, k = 1 - 0.26 * (nn > 1 ? c / (nn - 1) : 0);
      const b = { x: x0 + c * gap, y: r.y, w: r.w * k, h: r.h * k, row: low ? 1 : 0, tone: ['#c89050', '#b8844a', '#d49c58', '#a87840'][i % 4] }; boxes.push(b);
      by[`k${i}`] = eSpot(b.x, b.y + b.h * 0.52, b.w * 0.56, b.h * 0.56, 0, { apk: 0.85 });
    }
    const xa = x0 - gap * 0.55 - 36, xb = x0 + gap * (perRow - 1) + gap * 0.55 + 36, floorY = tall ? 770 : 560;
    return { ref, by, wallU: floorY - 60,
      draw(ctx, rt, fl) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ell(ctx, 12, floorY + 8, (xb - xa) / 2 + 30, 22); ctx.fill();
        for (const sx of [xa, xb - 30]) { beam(ctx, sx - 12, floorY - 30, 54, 36, '#4a2c14', { round: 8 }); beam(ctx, sx, rows[0].y - 66, 30, floorY - rows[0].y + 44, '#6a4222', { vertical: true, round: 10 }); ctx.fillStyle = rgrad(ctx, sx + 15, rows[0].y - 74, 0, 20, [[0, lighter('#a87844', 0.4)], [1, darker('#6a4222', 0.3)]]); circ(ctx, sx + 15, rows[0].y - 70, 17); ctx.fill(); }
        for (const r of rows) beam(ctx, xa, r.y - 44, xb - xa, 26, '#7a4e26', { round: 8 });
        boxes.forEach((b, i) => { const f = fl(`k${i}`), a = Math.sin(rt.anim * 22 + i) * f * 0.07; rock(ctx, b.x, rows[b.row].y - 20, a, () => woodBox(ctx, b.x, b.y, b.w, b.h, b.tone, { f, seed: 3 + i, t: rt.anim }));
          if (f > 0.05) { rings(ctx, b.x, b.y + b.h * 0.55, b.w * 0.6, f); glow(ctx, b.x, b.y + b.h * 0.5, b.w * 1.4, '#ffd9a0', 0.22 * f); } });
        const lit = boxes.map((b, i) => ({ b, f: fl(`k${i}`) })).filter((q) => q.f > 0.06).sort((a, b2) => b2.f - a.f).slice(0, 1);
        lit.forEach((q) => visit(ctx, q.b.x + q.b.w * 0.2, q.b.y + q.b.h * 0.5, q.f, { dir: [0.8, 0.5], back: 100, len: 230, hr: 17, ang: -2.6, pad: '#b88a50', wood: '#c89a58' }));
        if (!lit.length) padBeater(ctx, xb - 280, floorY - 8, -0.08, 240, 17, { pad: '#b88a50', wood: '#c89a58' });
      } };
  },
});

// ============================================================ HANDBELLS (brass bells in two ranks on a padded table) ============================
function handBell(ctx, cx, baseY, w, h, col, o = {}) {
  const { f = 0, tilt = 0, seed = 3 } = o, rt = w * 0.2, topY = baseY - h, ry = w * 0.1;
  const body = (g) => { g.beginPath(); g.moveTo(cx - rt, topY + 8); g.bezierCurveTo(cx - rt * 1.25, topY + h * 0.5, cx - w * 0.24, baseY - h * 0.3, cx - w * 0.36, baseY - h * 0.13); g.bezierCurveTo(cx - w * 0.4, baseY - h * 0.08, cx - w * 0.5, baseY - h * 0.1, cx - w * 0.5, baseY); g.ellipse(cx, baseY, w / 2, ry, 0, PI, 0, true); g.bezierCurveTo(cx + w * 0.5, baseY - h * 0.1, cx + w * 0.4, baseY - h * 0.08, cx + w * 0.36, baseY - h * 0.13); g.bezierCurveTo(cx + w * 0.24, baseY - h * 0.3, cx + rt * 1.25, topY + h * 0.5, cx + rt, topY + 8); g.quadraticCurveTo(cx, topY - 6, cx - rt, topY + 8); g.closePath(); };
  ctx.save(); ctx.translate(cx, baseY); ctx.rotate(tilt); ctx.translate(-cx, -baseY);
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ell(ctx, cx + w * 0.12, baseY + ry * 0.4, w * 0.56, ry * 1.2); ctx.fill();
  // the leather handle: a stem and a stitched grip
  const gh = h * 0.5; ctx.fillStyle = '#2a1a12'; rrect(ctx, cx - w * 0.07, topY - gh * 0.5, w * 0.14, gh * 0.7, 6); ctx.fill();
  const grip = (g) => rrect(g, cx - w * 0.16, topY - gh, w * 0.32, gh * 0.6, w * 0.1); grip(ctx); ctx.fillStyle = hgrad(ctx, cx - w * 0.16, cx + w * 0.16, [[0, '#120a06'], [0.3, '#6a4a34'], [0.6, '#2a1a12'], [1, '#0a0604']]); ctx.fill();
  ctx.strokeStyle = 'rgba(230,200,150,0.55)'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(cx - w * 0.1, topY - gh * 0.9); ctx.lineTo(cx - w * 0.1, topY - gh * 0.5); ctx.moveTo(cx + w * 0.1, topY - gh * 0.9); ctx.lineTo(cx + w * 0.1, topY - gh * 0.5); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = hgrad(ctx, cx - w * 0.17, cx + w * 0.17, [[0, darker(col, 0.5)], [0.4, lighter(col, 0.5)], [1, darker(col, 0.6)]]); rrect(ctx, cx - w * 0.17, topY - gh * 0.5, w * 0.34, 7, 3); ctx.fill();
  // the brass body
  ctx.fillStyle = '#120a06'; ell(ctx, cx, baseY, w / 2, ry); ctx.fill();
  body(ctx); ctx.fillStyle = hgrad(ctx, cx - w / 2, cx + w / 2, [[0, darker(col, 0.6)], [0.14, lighter(col, 0.7)], [0.3, lighter(col, 0.25)], [0.52, col], [0.78, darker(col, 0.42)], [0.92, lighter(col, 0.25)], [1, darker(col, 0.7)]]); ctx.fill();
  ctx.save(); body(ctx); ctx.clip();
  ctx.strokeStyle = 'rgba(0,0,0,0.24)'; ctx.lineWidth = 1.6; for (const t of [0.5, 0.72, 0.84]) { const y = topY + h * t; ctx.beginPath(); ctx.ellipse(cx, y, w * (0.18 + 0.32 * t), w * 0.03, 0, 0.02, PI - 0.02); ctx.stroke(); }
  ctx.fillStyle = hgrad(ctx, cx - w / 2, cx + w / 2, [[0.1, 'rgba(255,255,255,0)'], [0.2, 'rgba(255,252,232,0.55)'], [0.28, 'rgba(255,255,255,0)']]); ctx.fillRect(cx - w, topY, 2 * w, h);
  ctx.restore(); body(ctx); ctx.strokeStyle = rgba(darker(col, 0.8), 0.7); ctx.lineWidth = 1.6; ctx.stroke();
  ctx.strokeStyle = rgba(lighter(col, 0.6), 0.7); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(cx, baseY, w / 2, ry, 0, 0.1, PI - 0.1); ctx.stroke();
  if (f > 0.05) { ctx.globalCompositeOperation = 'lighter'; body(ctx); ctx.fillStyle = `rgba(255,230,160,${0.4 * f})`; ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
  void seed; ctx.restore();
}
const HB = [['c', /^c4?$|^c$/i], ['d', /^d4?$|^d$/i], ['e', /^e4?$|^e$/i], ['f', /^f4?$|^f$/i], ['g', /^g4?$|^g$/i], ['a', /^a4?$|^a$/i], ['b', /^b4?$|^b$/i], ['cs', /^c#|^db/i], ['ds', /^d#|^eb/i], ['fs', /^f#|^gb/i]];
mkGong('handbell', /hand.?bell|bell.?chime|bell.?set/, {
  voice: 'gx-handbell',
  wall: { kind: 'panel', c1: '#e4d8c0', accent: '#b8924a', pw: 200, motif: false }, floor: { kind: 'planks', c1: '#9a7248', c2: '#b88a58', ph: 64 }, rail: '#6a4a2a', light: '#fff0d0', vig: 0.4,
  zones: HB,
  build: (K) => {
    const tall = K.tall, ref = tall ? { w: 740, h: 800 } : { w: 1100, h: 560 }, by = {}, bells = [];
    const nat = ['c', 'd', 'e', 'f', 'g', 'a', 'b'], gap = tall ? 96 : 140, x0 = -gap * 3, yF = tall ? 600 : 420, yB = tall ? 380 : 270;
    nat.forEach((k, i) => { const t = i / 6, w = lerp(tall ? 98 : 120, tall ? 66 : 84, t), h = lerp(tall ? 118 : 124, tall ? 84 : 88, t); bells.push({ k, x: x0 + i * gap, y: yF, w, h }); });
    [['cs', 0.5, 0.85], ['ds', 1.5, 0.72], ['fs', 3.5, 0.5]].forEach(([k, pos, t]) => { const w = lerp(tall ? 98 : 120, tall ? 66 : 84, t) * 0.92, h = lerp(118, 84, t) * 0.92; bells.push({ k, x: x0 + pos * gap, y: yB, w, h, back: true }); });
    for (const b of bells) by[b.k] = eSpot(b.x, b.y - b.h * 0.42, b.w * 0.55, b.h * 0.55, 0, { apk: 0.85 });
    const padW = gap * 7 + 40, padT = yB - 175, padB = yF + 40;
    return { ref, by, wallU: padT - 30,
      draw(ctx, rt, fl) {
        // the table: dark cloth over a table with a grey foam pad
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, -padW / 2 + 10, padT + 16, padW, padB - padT, 20); ctx.fill();
        ctx.fillStyle = vgrad(ctx, padT, padB, [[0, '#2a0e14'], [1, '#14060a']]); rrect(ctx, -padW / 2, padT, padW, padB - padT, 20); ctx.fill();
        ctx.fillStyle = vgrad(ctx, padT + 12, padB - 12, [[0, '#3a3c44'], [1, '#24262c']]); rrect(ctx, -padW / 2 + 14, padT + 14, padW - 28, padB - padT - 28, 14); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 2; const gs = 24; ctx.save(); rrect(ctx, -padW / 2 + 14, padT + 14, padW - 28, padB - padT - 28, 14); ctx.clip(); for (let x = -padW / 2; x < padW / 2; x += gs) for (let y = padT; y < padB; y += gs * 0.8) { ctx.fillStyle = 'rgba(255,255,255,0.05)'; ell(ctx, x + gs / 2, y + gs * 0.4, gs * 0.36, gs * 0.28); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ell(ctx, x + gs / 2 + 2, y + gs * 0.4 + 2, gs * 0.3, gs * 0.22); ctx.fill(); } ctx.restore();
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-padW / 2, padB, padW, 10); ctx.fillStyle = '#2a0e14'; ctx.fillRect(-padW / 2, padB - 4, padW, 14);
        const draw = (back) => bells.forEach((b) => { if (!!b.back !== back) return; const f = fl(b.k), a = Math.sin(rt.anim * 20 + b.x) * f * 0.1;
          handBell(ctx, b.x, b.y, b.w, b.h, ['#d8aa3c', '#cf9f34', '#dcb246'][Math.round(b.x / 50) % 3 < 0 ? 0 : Math.abs(Math.round(b.x / 50)) % 3], { f, tilt: a });
          if (f > 0.05) { rings(ctx, b.x, b.y - b.h * 0.4, b.w * 0.6, f); glow(ctx, b.x, b.y - b.h * 0.4, b.w * 1.5, '#ffe0a0', 0.3 * f); } });
        draw(true); draw(false);
      } };
  },
});
void mix; void rSpot; void clamp; void hangCord; void scrollBand; void lighter; void TAU;

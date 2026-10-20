// Chime stages (1.21.0): the bianzhong (two tiers of bronze chime bells on a lacquered frame), the pyeongyeong (L-shaped stone chimes hung in two rows)
// and the yunluo (ten small flat gongs in a lacquered frame on a stand). Each hangs its pieces from cords and shows a padded or horn beater visiting the
// struck piece. No performer and no hands. Lane names or pitch order give the zones (see stage-gongs.js); the pitch comes from the lane's hz.
import { eSpot, rSpot } from './drum-kit.js';
import { mkGong, visit } from './stage-gongs.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, circ, ell, hash, TAU, PI, lerp, glow, discGong, hangCord, beam, scrollBand, lamp, rings, padBeater } from './gong-kit.js';

const swingAbout = (ctx, px, py, a, fn) => { ctx.save(); ctx.translate(px, py); ctx.rotate(a); ctx.translate(-px, -py); fn(); ctx.restore(); };
// a bronze spiral disc (the cloud-and-thunder motif), used as finials
function spiralDisc(ctx, x, y, r, col) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; circ(ctx, x + 3, y + 5, r); ctx.fill();
  ctx.fillStyle = rgrad(ctx, x - r * 0.3, y - r * 0.3, 0, r * 1.1, [[0, lighter(col, 0.5)], [0.5, col], [1, darker(col, 0.55)]]); circ(ctx, x, y, r); ctx.fill();
  ctx.strokeStyle = rgba(darker(col, 0.7), 0.8); ctx.lineWidth = Math.max(1.5, r * 0.1); ctx.beginPath(); for (let k = 0; k <= 40; k++) { const t = k / 40, a = t * TAU * 1.6, rr = r * (0.15 + 0.7 * t); const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.stroke();
}

// ============================================================ BIANZHONG (two tiers of bronze bells) ===========================================
function bianBell(ctx, cx, y0, w, h, o = {}) {
  const { col = '#8a6a30', f = 0, seed = 3, tilt = 0 } = o, tw = w * 0.62, y1 = y0 + h;
  const body = (g) => { g.beginPath(); g.moveTo(-tw / 2, y0); g.quadraticCurveTo(-(tw + w) / 4 - w * 0.06, (y0 + y1) / 2, -w / 2, y1); g.quadraticCurveTo(0, y1 - h * 0.24, w / 2, y1); g.quadraticCurveTo((tw + w) / 4 + w * 0.06, (y0 + y1) / 2, tw / 2, y0); g.closePath(); };
  ctx.save(); ctx.translate(cx, 0); if (tilt) { ctx.translate(0, y0 - h * 0.3); ctx.rotate(tilt); ctx.translate(0, -(y0 - h * 0.3)); }
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.save(); ctx.translate(10, 14); body(ctx); ctx.fill(); ctx.restore();
  body(ctx); ctx.fillStyle = hgrad(ctx, -w / 2, w / 2, [[0, darker(col, 0.62)], [0.14, lighter(col, 0.4)], [0.34, lighter(col, 0.1)], [0.55, col], [0.82, darker(col, 0.5)], [1, darker(col, 0.72)]]); ctx.fill();
  ctx.save(); body(ctx); ctx.clip();
  // verdigris and wear
  for (let k = 0; k < 30; k++) { const x = (hash(seed + k) - 0.5) * w, y = y0 + hash(seed + k + 40) * h; ctx.fillStyle = `rgba(${60 + 40 * hash(k)},${150 + 40 * hash(k + 2)},${120 + 30 * hash(k + 4)},${0.16 + 0.24 * hash(k + 9)})`; ell(ctx, x, y, w * (0.04 + 0.1 * hash(k + 7)), h * (0.02 + 0.06 * hash(k + 5))); ctx.fill(); }
  // raised bands and rows of studs
  for (const [fy, th] of [[0.12, 0.04], [0.74, 0.05], [0.9, 0.04]]) { const y = y0 + h * fy; ctx.fillStyle = vgrad(ctx, y, y + h * th, [[0, lighter(col, 0.5)], [1, darker(col, 0.5)]]); ctx.fillRect(-w, y, 2 * w, h * th); }
  for (const fy of [0.3, 0.46]) for (const fx of [-0.24, 0, 0.24]) { const x = fx * w * (0.62 + 0.4 * fy), y = y0 + h * fy; ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, x + 1.5, y + 2.5, w * 0.052); ctx.fill(); ctx.fillStyle = rgrad(ctx, x - 2, y - 2, 0, w * 0.06, [[0, lighter(col, 0.8)], [0.6, col], [1, darker(col, 0.5)]]); circ(ctx, x, y, w * 0.05); ctx.fill(); }
  ctx.strokeStyle = rgba(darker(col, 0.75), 0.6); ctx.lineWidth = Math.max(1.4, w * 0.014); for (let k = 0; k < 3; k++) { const x = (k - 1) * w * 0.26; ctx.beginPath(); ctx.moveTo(x, y0 + h * 0.58); ctx.bezierCurveTo(x - w * 0.07, y0 + h * 0.64, x + w * 0.07, y0 + h * 0.68, x, y0 + h * 0.72); ctx.stroke(); }
  ctx.fillStyle = vgrad(ctx, y1 - h * 0.18, y1, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.45)']]); ctx.fillRect(-w, y1 - h * 0.18, 2 * w, h * 0.2);
  ctx.fillStyle = hgrad(ctx, -w / 2, w / 2, [[0.1, 'rgba(255,255,255,0)'], [0.2, 'rgba(255,248,224,0.3)'], [0.3, 'rgba(255,255,255,0)']]); ctx.fillRect(-w, y0, 2 * w, h);
  ctx.restore(); body(ctx); ctx.strokeStyle = rgba(darker(col, 0.8), 0.8); ctx.lineWidth = 2; ctx.stroke();
  // the flat crown and the hanging loop
  ctx.fillStyle = vgrad(ctx, y0 - 9, y0 + 2, [[0, lighter(col, 0.3)], [1, darker(col, 0.5)]]); rrect(ctx, -tw / 2 - 3, y0 - 9, tw + 6, 12, 4); ctx.fill();
  ctx.strokeStyle = darker(col, 0.45); ctx.lineWidth = Math.max(5, w * 0.07); ctx.beginPath(); ctx.arc(0, y0 - 18, w * 0.1, PI * 0.9, PI * 2.1); ctx.stroke();
  ctx.strokeStyle = lighter(col, 0.35); ctx.lineWidth = Math.max(2, w * 0.03); ctx.beginPath(); ctx.arc(0, y0 - 18, w * 0.1, PI * 1.0, PI * 1.6); ctx.stroke();
  if (f > 0.05) { ctx.globalCompositeOperation = 'lighter'; body(ctx); ctx.fillStyle = `rgba(255,224,150,${0.38 * f})`; ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
  ctx.restore();
}
mkGong('bianzhong', /bianzhong|chime.?bells|bronze.?chime/, {
  voice: 'gx-bianzhong',
  wall: { kind: 'stone', c1: '#2e3d44', c2: '#3a4c52', bh: 60, seed: 2 }, floor: { kind: 'tiles', c1: '#26292c', c2: '#33383b', size: 90 }, rail: '#1a1410', light: '#ffe2b0', vig: 0.62,
  orn(ctx, A, wallB, rt) { for (const fx of [0.12, 0.88]) { const x = A.x + A.w * fx, y = A.y + (wallB - A.y) * 0.16; ctx.strokeStyle = '#8a6a30'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, A.y); ctx.lineTo(x, y - 16); ctx.stroke(); lamp(ctx, x, y, Math.max(11, A.w * 0.017), rt?.anim ?? 0, '#ffb870'); } },
  zones: Array.from({ length: 12 }, (_, i) => [`b${i}`, null]),
  build: (K) => {
    const tall = K.tall, N = Math.min(K.N, 12), perTier = Math.ceil(N / 2), ref = tall ? { w: 700, h: 880 } : { w: 1100, h: 600 };
    const by = {}, bells = [], gap = (ref.w - (tall ? 120 : 330)) / perTier, x0 = -gap * (perTier - 1) / 2;
    const tiers = tall ? [{ y: 130, bw: 84, bh: 134 }, { y: 400, bw: 108, bh: 186 }] : [{ y: 76, bw: 98, bh: 150 }, { y: 330, bw: 124, bh: 196 }];   // upper tier: small bells (high); lower: big (low)
    for (let i = 0; i < N; i++) {
      const lower = i < perTier, t = lower ? tiers[1] : tiers[0], c = lower ? i : i - perTier, nn = lower ? perTier : N - perTier;
      const k = 1 - 0.28 * (nn > 1 ? c / (nn - 1) : 0), w = t.bw * k, h = t.bh * k;
      bells.push({ x: x0 + c * gap + (lower ? 0 : gap * 0.0), y: t.y, w, h, tier: lower ? 1 : 0 });
      by[`b${i}`] = eSpot(x0 + c * gap, t.y + h * 0.55, w * 0.58, h * 0.52, 0, { apk: 0.85 });
    }
    const xa = x0 - gap * 0.55 - 50, xb = x0 + gap * (perTier - 1) + gap * 0.55 + 50, floorY = tall ? 760 : 560;
    return { ref, by, wallU: floorY - 70,
      draw(ctx, rt, fl) {
        ctx.fillStyle = 'rgba(0,0,0,0.42)'; ell(ctx, 14, floorY + 8, (xb - xa) / 2 + 40, 24); ctx.fill();
        // two upright posts on feet, two crossbars, bronze spiral finials
        for (const sx of [xa, xb - 36]) { beam(ctx, sx - 14, floorY - 34, 64, 40, '#1e1410', { round: 10, grain: false }); beam(ctx, sx, tiers[0].y - 56, 36, floorY - tiers[0].y + 40, '#2a1812', { vertical: true, round: 12, grain: false }); ctx.fillStyle = rgba('#b82a22', 0.8); ctx.fillRect(sx + 14, tiers[0].y - 40, 8, floorY - tiers[0].y - 40); spiralDisc(ctx, sx + 18, tiers[0].y - 66, 24, '#9a7a38'); }
        for (const t of tiers) { const yb = t.y - 26; beam(ctx, xa, yb - 12, xb - xa, 30, '#2a1812', { round: 12, grain: false }); ctx.fillStyle = rgba('#b82a22', 0.85); ctx.fillRect(xa + 14, yb - 2, xb - xa - 28, 5); scrollBand(ctx, xa + 40, xb - 40, yb + 8, 12, '#b8924a', { dots: false }); }
        // the bells, hung by loops from the bars; each one swings a little when struck
        bells.forEach((b, i) => { const f = fl(`b${i}`), a = Math.sin(rt.anim * 15 + i) * f * 0.05, yb = tiers[b.tier].y - 26;
          swingAbout(ctx, b.x, yb + 12, a, () => bianBell(ctx, b.x, tiers[b.tier].y, b.w, b.h, { col: ['#6e4e22', '#645230', '#7a5626'][i % 3], f, seed: 3 + i })); if (f > 0.05) { rings(ctx, b.x, tiers[b.tier].y + b.h * 0.6, b.w * 0.7, f); glow(ctx, b.x, tiers[b.tier].y + b.h * 0.6, b.w * 1.5, '#ffd27a', 0.28 * f); } });
        const lit = bells.map((b, i) => ({ b, f: fl(`b${i}`) })).filter((q) => q.f > 0.06).sort((a, b2) => b2.f - a.f).slice(0, 1);
        lit.forEach((q) => visit(ctx, q.b.x, q.b.y + q.b.h * 0.62, q.f, { dir: [0.9, 0.4], back: 120, len: 250, hr: 20, ang: -2.7, pad: '#cdb48a', wood: '#7a4a24' }));
        if (!lit.length) padBeater(ctx, xb - 250, floorY - 20, -0.9, 250, 20, { pad: '#cdb48a', wood: '#7a4a24' });
      } };
  },
});

// ============================================================ PYEONGYEONG (L-shaped stone chimes) ==============================================
function lStone(ctx, x, y, L, t, drop, col, o = {}) {   // hung by the corner at (x,y): a long arm runs down-left, a short arm down-right (a thick bent bar)
  const { f = 0, seed = 3 } = o, pts = [[x - L * 0.94, y + L * 0.36], [x, y], [x + drop * 0.42, y + drop * 0.9]];
  const poly = (g) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); g.lineTo(pts[1][0], pts[1][1]); g.lineTo(pts[2][0], pts[2][1]); };
  ctx.save(); ctx.lineJoin = 'miter'; ctx.miterLimit = 3; ctx.lineCap = 'butt';
  ctx.save(); ctx.translate(8, 12); poly(ctx); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = t; ctx.stroke(); ctx.restore();
  poly(ctx); ctx.strokeStyle = darker(col, 0.5); ctx.lineWidth = t + 4; ctx.stroke();
  poly(ctx); ctx.strokeStyle = col; ctx.lineWidth = t; ctx.stroke();
  poly(ctx); ctx.strokeStyle = lighter(col, 0.3); ctx.lineWidth = t * 0.5; ctx.save(); ctx.translate(-t * 0.1, -t * 0.16); ctx.stroke(); ctx.restore();
  poly(ctx); ctx.strokeStyle = 'rgba(255,255,244,0.4)'; ctx.lineWidth = Math.max(2, t * 0.12); ctx.save(); ctx.translate(-t * 0.28, -t * 0.34); ctx.stroke(); ctx.restore();
  ctx.save(); poly(ctx); ctx.strokeStyle = 'rgba(0,0,0,0)'; for (let k = 0; k < 14; k++) { const u = hash(seed + k), ax = lerp(pts[0][0], pts[1][0], u), ay = lerp(pts[0][1], pts[1][1], u); ctx.strokeStyle = `rgba(60,80,70,${0.18 + 0.2 * hash(seed + k + 5)})`; ctx.lineWidth = 1 + 1.6 * hash(k + 2); ctx.beginPath(); ctx.moveTo(ax - 5, ay - t * 0.3); ctx.lineTo(ax + 7, ay + t * 0.35); ctx.stroke(); } ctx.restore();
  ctx.fillStyle = darker(col, 0.65); circ(ctx, x, y + t * 0.22, 5); ctx.fill();   // the hole the cord passes through
  if (f > 0.05) { ctx.globalCompositeOperation = 'lighter'; poly(ctx); ctx.strokeStyle = `rgba(220,255,236,${0.5 * f})`; ctx.lineWidth = t; ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; }
  ctx.restore();
}
mkGong('pyeongyeong', /pyeongyeong|stone.?chime|lithophone|sounding.?stone|bianqing/, {
  voice: 'gx-stone',
  wall: { kind: 'plaster', c1: '#e6dcc4', c2: '#d8caa8', seed: 8 }, floor: { kind: 'planks', c1: '#8a5a30', c2: '#a97840', ph: 62 }, rail: '#3a5a4a', light: '#fff0cc', vig: 0.4,
  orn(ctx, A, wallB, rt) {
    // a painted eave band in blue, green, red and ochre; two paper lanterns
    const bh = (wallB - A.y) * 0.17; ctx.fillStyle = '#1f3a5a'; ctx.fillRect(A.x, A.y, A.w, bh);
    const n = Math.round(A.w / (bh * 0.9)), st = A.w / n; for (let k = 0; k < n; k++) { const x = A.x + k * st; ctx.fillStyle = ['#2f7a5a', '#b8352a', '#e0b040', '#2f7a5a'][k % 4]; ctx.beginPath(); ctx.moveTo(x + st / 2, A.y + bh * 0.1); ctx.lineTo(x + st * 0.92, A.y + bh * 0.5); ctx.lineTo(x + st / 2, A.y + bh * 0.9); ctx.lineTo(x + st * 0.08, A.y + bh * 0.5); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,240,200,0.7)'; ctx.lineWidth = 1.5; ctx.stroke(); }
    ctx.fillStyle = '#b8352a'; ctx.fillRect(A.x, A.y + bh, A.w, bh * 0.22); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(A.x, A.y + bh + bh * 0.22, A.w, 6);
    for (const fx of [0.1, 0.9]) { const x = A.x + A.w * fx, y = A.y + (wallB - A.y) * 0.4, r = Math.max(16, A.w * 0.03); ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, A.y + bh * 1.25); ctx.lineTo(x, y - r); ctx.stroke(); glow(ctx, x, y, r * 3.5, '#ffb060', 0.35); ctx.fillStyle = rgrad(ctx, x - r * 0.3, y - r * 0.3, 0, r * 1.2, [[0, '#fff0c0'], [0.5, '#f0a040'], [1, '#a8522a']]); ell(ctx, x, y, r * 0.82, r); ctx.fill(); ctx.strokeStyle = 'rgba(120,40,10,0.55)'; ctx.lineWidth = 1.4; for (const q of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.ellipse(x, y, r * 0.82 * Math.abs(q) + 0.5, r, 0, 0, TAU); ctx.stroke(); } }
    void rt;
  },
  zones: Array.from({ length: 12 }, (_, i) => [`s${i}`, null]),
  build: (K) => {
    const tall = K.tall, N = Math.min(K.N, 12), perRow = Math.ceil(N / 2), ref = tall ? { w: 700, h: 860 } : { w: 1100, h: 600 };
    const by = {}, st = [], gap = (ref.w - (tall ? 160 : 360)) / perRow, x0 = -gap * (perRow - 1) / 2;
    const rows = tall ? [{ y: 150, L: 112, t0: 30, d0: 120 }, { y: 440, L: 124, t0: 36, d0: 132 }] : [{ y: 90, L: 128, t0: 32, d0: 134 }, { y: 340, L: 140, t0: 38, d0: 146 }];
    for (let i = 0; i < N; i++) {
      const low = i < perRow, r = low ? rows[1] : rows[0], c = low ? i : i - perRow, nn = low ? perRow : N - perRow;
      const k = 1 - 0.26 * (nn > 1 ? c / (nn - 1) : 0), L = r.L * k * 0.92, t = r.t0 * (0.8 + 0.4 * (1 - (nn > 1 ? c / (nn - 1) : 0))), d = r.d0 * k;   // low stones are thicker and longer
      const x = x0 + c * gap + L * 0.46; st.push({ x, y: r.y + 76, L, t, d, row: low ? 1 : 0, ry: r.y });
      by[`s${i}`] = rSpot(x - L * 0.38, r.y + 76 + L * 0.2, L * 0.55, Math.max(t, d * 0.4), 0, { apk: 0.8 });
    }
    const xa = x0 - gap * 0.5 - 70, xb = x0 + gap * (perRow - 1) + gap * 0.5 + 70, floorY = tall ? 760 : 560;
    return { ref, by, wallU: floorY - 64,
      draw(ctx, rt, fl) {
        ctx.fillStyle = 'rgba(0,0,0,0.38)'; ell(ctx, 14, floorY + 8, (xb - xa) / 2 + 40, 22); ctx.fill();
        for (const sx of [xa, xb - 40]) { beam(ctx, sx - 14, floorY - 34, 68, 40, '#7a1e18', { round: 10, grain: false }); beam(ctx, sx, rows[0].y - 70, 40, floorY - rows[0].y + 54, '#a3281e', { vertical: true, round: 12, grain: false }); ctx.save(); ctx.beginPath(); ctx.rect(sx, rows[0].y, 40, floorY - rows[0].y - 60); ctx.clip(); ctx.translate(sx + 20, 0); ctx.rotate(PI / 2); scrollBand(ctx, rows[0].y + 10, floorY - 60, 0, 22, '#e8c260'); ctx.restore(); ctx.fillStyle = rgrad(ctx, sx + 20, rows[0].y - 84, 0, 22, [[0, '#fff0b0'], [0.5, '#e0b040'], [1, '#6a4a10']], sx + 12, rows[0].y - 92); circ(ctx, sx + 20, rows[0].y - 78, 20); ctx.fill(); }
        for (const r of rows) { const yb = r.y + 4; beam(ctx, xa, yb - 10, xb - xa, 34, '#a3281e', { round: 12, grain: false }); scrollBand(ctx, xa + 46, xb - 46, yb + 7, 18, '#e8c260'); ctx.fillStyle = '#1f6a52'; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.moveTo(xa + 50 + k * ((xb - xa - 100) / 8) - 9, yb + 24); ctx.lineTo(xa + 50 + k * ((xb - xa - 100) / 8) + 9, yb + 24); ctx.lineTo(xa + 50 + k * ((xb - xa - 100) / 8), yb + 33); ctx.closePath(); ctx.fill(); } }
        st.forEach((s, i) => { const f = fl(`s${i}`), a = Math.sin(rt.anim * 18 + i) * f * 0.05;
          hangCord(ctx, s.x, s.ry + 24, s.x, s.y + 4, { w: 5, col: '#c8302a' });
          swingAbout(ctx, s.x, s.ry + 30, a, () => lStone(ctx, s.x, s.y, s.L, s.t, s.d, ['#8aa496', '#97ae9e', '#7e9a8c'][i % 3], { f, seed: 5 + i }));
          if (f > 0.05) { rings(ctx, s.x - s.L * 0.4, s.y + s.L * 0.18, s.L * 0.4, f); glow(ctx, s.x - s.L * 0.35, s.y + s.L * 0.2, s.L * 0.9, '#bfffe0', 0.3 * f); } });
        const lit = st.map((s, i) => ({ s, f: fl(`s${i}`) })).filter((q) => q.f > 0.06).sort((a, b) => b.f - a.f).slice(0, 1);
        lit.forEach((q) => visit(ctx, q.s.x - q.s.L * 0.5, q.s.y + q.s.L * 0.2, q.f, { dir: [-0.6, 0.9], back: 110, len: 250, hr: 9, ang: -0.95, pad: '#e8e0cc', wood: '#e8dcc0' }));
        if (!lit.length) padBeater(ctx, xb - 290, floorY - 8, -0.1, 260, 9, { pad: '#e8e0cc', wood: '#e8dcc0' });
      } };
  },
});

// ============================================================ YUNLUO (ten small flat gongs in a lacquered frame) ================================
mkGong('yunluo', /yunluo|cloud.?gong|yun.?luo|gong.?frame/, {
  voice: 'gx-yunluo',
  wall: { kind: 'lattice', c1: '#2a1408', light: '#ffc878', cell: 64, frame: '#2a1208' }, floor: { kind: 'planks', c1: '#3a2010', c2: '#5a341a', ph: 60 }, rail: '#1e0e06', light: '#ffd9a0', vig: 0.6,
  zones: Array.from({ length: 10 }, (_, i) => [`y${i}`, null]),
  build: (K) => {
    const tall = K.tall, N = Math.min(K.N, 10), ref = tall ? { w: 640, h: 860 } : { w: 1040, h: 600 };
    const rowsN = [3, 4, 3], rowsY = tall ? [270, 470, 670] : [170, 330, 490], R = tall ? 58 : 56, gx = tall ? 134 : 148, by = {}, gongs = [];
    let idx = 0; const order = [];
    // low notes at the bottom: lanes (sorted by pitch) fill the bottom row first, left to right, then the middle, then the top
    for (const r of [2, 1, 0]) for (let c = 0; c < rowsN[r]; c++) order.push([r, c]);
    for (const [r, c] of order) { if (idx >= N) break; const x = (c - (rowsN[r] - 1) / 2) * gx, y = rowsY[r]; gongs.push({ x, y, r }); by[`y${idx}`] = eSpot(x, y, R, R, 0, { apk: 0.85 }); idx++; }
    const hw = gx * 1.5 + R + 40, top = rowsY[0] - R - 60, bot = rowsY[2] + R + 50, floorY = bot + (tall ? 120 : 40);
    return { ref, by, wallU: floorY - 60,
      draw(ctx, rt, fl) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ell(ctx, 10, floorY + 12, hw * 0.9, 20); ctx.fill();
        // a post and a foot under the frame
        beam(ctx, -22, bot, 44, floorY - bot, '#7a1a16', { vertical: true, round: 10, grain: false }); beam(ctx, -hw * 0.5, floorY - 14, hw, 26, '#5a1410', { round: 10, grain: false });
        // the frame: a lacquered box open at the front with three crossbars, gilt corners
        const fr = (o, col, lw) => { ctx.strokeStyle = col; ctx.lineWidth = lw; rrect(ctx, -hw + o, top + o, 2 * hw - 2 * o, bot - top - 2 * o, 18); ctx.stroke(); };
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, -hw + 10, top + 14, 2 * hw, bot - top, 20); ctx.fill();
        ctx.fillStyle = vgrad(ctx, top, bot, [[0, '#2a0c0a'], [1, '#1a0806']]); rrect(ctx, -hw, top, 2 * hw, bot - top, 20); ctx.fill();
        fr(0, '#a3281e', 22); fr(11, '#d8403a', 4); fr(24, rgba('#e8c260', 0.8), 3);
        for (const [x, y] of [[-hw, top], [hw, top], [-hw, bot], [hw, bot]]) { ctx.fillStyle = rgrad(ctx, x - 4, y - 4, 0, 22, [[0, '#fff0b0'], [0.5, '#e0b040'], [1, '#6a4a10']]); circ(ctx, x, y, 18); ctx.fill(); }
        for (const ry of rowsY) { const yb = ry - R - 12; hangCord(ctx, -hw + 14, yb, hw - 14, yb, { w: 7, col: '#c8302a' }); }
        gongs.forEach((g, i) => { const f = fl(`y${i}`), a = Math.sin(rt.anim * 20 + i) * f * 0.05, yb = rowsY[g.r] - R - 12;
          hangCord(ctx, g.x - 14, yb, g.x - R * 0.5, g.y - R * 0.8, { w: 4, col: '#e8d6a0' }); hangCord(ctx, g.x + 14, yb, g.x + R * 0.5, g.y - R * 0.8, { w: 4, col: '#e8d6a0' });
          swingAbout(ctx, g.x, yb, a, () => { ctx.fillStyle = 'rgba(0,0,0,0.38)'; circ(ctx, g.x + 7, g.y + 10, R); ctx.fill(); discGong(ctx, g.x, g.y, R, { col: ['#d4a64a', '#c89a3e', '#dcb256'][i % 3], boss: 0.15, rimW: 0.09, hammer: 0.3, rings: 3, f: f * 0.7, flat: true, bossCol: '#ecc062' }); });
          if (f > 0.05) { rings(ctx, g.x, g.y, R * 1.05, f); glow(ctx, g.x, g.y, R * 1.8, '#ffd27a', 0.3 * f); } });
        const lit = gongs.map((g, i) => ({ g, f: fl(`y${i}`) })).filter((q) => q.f > 0.06).sort((a, b) => b.f - a.f).slice(0, 1);
        lit.forEach((q) => visit(ctx, q.g.x, q.g.y, q.f, { dir: [0.7, 0.8], back: 90, len: 210, hr: 12, ang: -2.2, pad: '#e8dcc0' }));
        if (!lit.length) padBeater(ctx, hw + 20, bot + 10, -1.5, 240, 12, { pad: '#e8dcc0' });
      } };
  },
});
void mix; void lerp; void clamp;

// Odd instruments I (1.21.0): musical glasses (wine glasses tuned with water), the glass harmonica (nested glass bowls on a spindle) and the musical saw
// (a bowed saw blade bent in an S). Each has its own picture, room and voice (`glassring`, `sawsong` in voice-gongs.js). No performer and no hands:
// a rim glows and shimmers where a wet fingertip would circle, the bow rides the blade edge. Lane names or pitch order give the zones.
import { eSpot } from './drum-kit.js';
import { mkGong } from './stage-gongs.js';
import { registerStrikeVoice } from './voice-registry.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU, PI, lerp, glow, beam, rings, lamp } from './gong-kit.js';

// ============================================================ MUSICAL GLASSES =================================================================
function wineGlass(ctx, cx, topY, w, h, level, o = {}) {
  const { f = 0, tint = '#9ad0e8', t = 0, seed = 3 } = o, rx = w / 2, ry = w * 0.1, db = h * 0.56, half = (u) => rx * Math.sqrt(Math.max(0, 1 - u * u)) * (1 - 0.06 * u);
  const bowl = (g, tt = 1) => { g.beginPath(); for (let k = 0; k <= 30; k++) { const u = (k / 30) * tt; g.lineTo(cx - half(u), topY + db * u); } for (let k = 30; k >= 0; k--) { const u = (k / 30) * tt; g.lineTo(cx + half(u), topY + db * u); } g.closePath(); };
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, cx + w * 0.1, topY + h + 4, w * 0.36, w * 0.07); ctx.fill();
  // foot and stem
  const fy = topY + h * 0.95, sy = topY + db;
  ctx.fillStyle = 'rgba(214,236,246,0.5)'; ell(ctx, cx, fy, w * 0.33, w * 0.06); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.6; ell(ctx, cx, fy, w * 0.33, w * 0.06); ctx.stroke();
  ctx.fillStyle = hgrad(ctx, cx - 5, cx + 5, [[0, 'rgba(160,200,220,0.55)'], [0.4, 'rgba(255,255,255,0.8)'], [1, 'rgba(120,170,200,0.5)']]); ctx.beginPath(); ctx.moveTo(cx - 3, sy - 4); ctx.lineTo(cx - 5, fy - 4); ctx.lineTo(cx + 5, fy - 4); ctx.lineTo(cx + 3, sy - 4); ctx.closePath(); ctx.fill();
  // the glass bowl, then the water inside it
  bowl(ctx); ctx.fillStyle = hgrad(ctx, cx - rx, cx + rx, [[0, 'rgba(200,230,245,0.34)'], [0.3, 'rgba(255,255,255,0.14)'], [0.7, 'rgba(180,214,232,0.12)'], [1, 'rgba(210,236,248,0.34)']]); ctx.fill();
  const wu = 1 - level, wy = topY + db * wu, wh = half(wu);
  ctx.save(); bowl(ctx); ctx.clip();
  ctx.fillStyle = vgrad(ctx, wy, topY + db, [[0, rgba(lighter(tint, 0.2), 0.55)], [1, rgba(darker(tint, 0.3), 0.7)]]); ctx.fillRect(cx - rx, wy, w, db);
  ctx.fillStyle = hgrad(ctx, cx - rx, cx + rx, [[0.15, 'rgba(255,255,255,0)'], [0.25, 'rgba(255,255,255,0.4)'], [0.36, 'rgba(255,255,255,0)']]); ctx.fillRect(cx - rx, wy, w, db);
  ctx.restore();
  // the water surface shivers with concentric rings when the glass sings
  ctx.fillStyle = rgba(lighter(tint, 0.5), 0.6); ell(ctx, cx, wy, wh, wh * 0.18); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.4; ell(ctx, cx, wy, wh, wh * 0.18); ctx.stroke();
  if (f > 0.05) for (let k = 0; k < 3; k++) { const p = clamp(((t * 3 + k * 0.33) % 1), 0, 1); ctx.strokeStyle = `rgba(255,255,255,${0.7 * f * (1 - p)})`; ctx.lineWidth = 1.6; ell(ctx, cx, wy, wh * (0.15 + 0.85 * p), wh * 0.18 * (0.15 + 0.85 * p)); ctx.stroke(); }
  // the rim and the glints
  bowl(ctx); ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = 'rgba(214,236,246,0.22)'; ell(ctx, cx, topY, rx, ry); ctx.fill(); ctx.strokeStyle = `rgba(255,255,255,${0.8 + 0.2 * f})`; ctx.lineWidth = 2.4 + 2 * f; ell(ctx, cx, topY, rx, ry); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.ellipse(cx, topY + db * 0.35, half(0.35) * 0.82, db * 0.42, 0, PI * 0.78, PI * 1.02); ctx.stroke();
  if (f > 0.05) {   // a bright arc travels round the rim where the fingertip circles
    const a = (t * 7 + seed) % TAU; ctx.strokeStyle = `rgba(255,248,214,${0.95 * f})`; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.ellipse(cx, topY, rx, ry, 0, a, a + 1.5); ctx.stroke();
    glow(ctx, cx + Math.cos(a + 0.75) * rx, topY + Math.sin(a + 0.75) * ry, w * 0.5, '#fff0c0', 0.5 * f);
  }
  ctx.restore();
}
mkGong('glasses', /musical.?glasses|wine.?glass|glass.?harp\b|verrophone|glasses/, {
  voice: 'gx-glass',
  wall: { kind: 'curtain', c1: '#3a1520' }, floor: { kind: 'linen', c1: '#e8dcc6' }, rail: '#5a3a22', light: '#ffe6b8', vig: 0.55,
  orn(ctx, A, wallB, rt) { for (let k = 0; k < 18; k++) { const x = A.x + A.w * hash(k * 1.7 + 1), y = A.y + (wallB - A.y) * (0.1 + 0.7 * hash(k * 2.9 + 4)), r = 6 + 16 * hash(k + 3); glow(ctx, x, y, r * 3, hash(k) > 0.5 ? '#ffd890' : '#ffb0a0', 0.18); } void rt; },
  zones: Array.from({ length: 10 }, (_, i) => [`g${i}`, null]),
  build: (K) => {
    const tall = K.tall, N = Math.min(K.N, 10), perRow = tall ? Math.ceil(N / 2) : N, ref = tall ? { w: 700, h: 880 } : { w: 1100, h: 560 }, by = {}, gl = [];
    const gap = tall ? (ref.w - 80) / perRow : (ref.w - 100) / perRow, x0 = -gap * (perRow - 1) / 2, base = tall ? [330, 650] : [330];
    for (let i = 0; i < N; i++) {
      const row = tall ? (i < perRow ? 1 : 0) : 0, c = tall ? (i < perRow ? i : i - perRow) : i, nrow = tall ? (i < perRow ? perRow : N - perRow) : N, t = nrow > 1 ? c / (nrow - 1) : 0;
      const w = lerp(tall ? 96 : 92, tall ? 76 : 70, t) * (row ? 1 : 0.93), h = lerp(tall ? 224 : 232, tall ? 200 : 205, t) * (row ? 1 : 0.93), level = lerp(0.8, 0.22, t * 0.9 + (row ? 0 : 0.05)), x = x0 + c * gap + (row || !tall ? 0 : gap * 0.0), y = base[tall ? (row ? 1 : 0) : 0] - h;
      gl.push({ x, y, w, h, level, row }); by[`g${i}`] = eSpot(x, y + h * 0.3, w * 0.6, h * 0.36, 0, { apk: 0.85 });
    }
    const tableY = tall ? 590 : 380;
    return { ref, by, wallU: tall ? 240 : 270,
      draw(ctx, rt, fl) {
        const order = gl.map((g, i) => i).sort((a, b) => gl[a].y + gl[a].h - (gl[b].y + gl[b].h));
        order.forEach((i) => { const g = gl[i], f = fl(`g${i}`); wineGlass(ctx, g.x, g.y, g.w, g.h, g.level, { f, t: rt.anim, seed: i, tint: ['#8fc8e6', '#9ad0c0', '#b0a8e0'][i % 3] });
          if (f > 0.05) glow(ctx, g.x, g.y + g.h * 0.3, g.w * 1.5, '#fff0c0', 0.18 * f); });
      } };
  },
});
registerStrikeVoice('gx-glass', (c) => c.evoice(c.audio, 'glassring', { hz: c.hz, dur: Math.max(0.6, Math.min(1.4, c.dur)), vel: c.vel }));

// ============================================================ GLASS HARMONICA (nested glass bowls on a spindle) =================================
const BOWLCOL = ['#c8302a', '#e07a2a', '#e6c42a', '#3aa84a', '#2a8ad0', '#4a3ab0', '#8a3ab0', '#c8302a', '#e07a2a', '#e6c42a'];
mkGong('armonica', /glass.?harmonica|armonica|glass.?armonica/, {
  voice: 'gx-glass',
  wall: { kind: 'panel', c1: '#1e2a3a', accent: '#c8a860', pw: 190, motif: false }, floor: { kind: 'planks', c1: '#3a2616', c2: '#5a3c22', ph: 56 }, rail: '#1a1008', light: '#ffe4b0', vig: 0.58,
  orn(ctx, A, wallB, rt) { for (const fx of [0.2, 0.8]) { ctx.strokeStyle = '#6a5a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(A.x + A.w * fx, A.y); ctx.lineTo(A.x + A.w * fx, A.y + (wallB - A.y) * 0.18); ctx.stroke(); lamp(ctx, A.x + A.w * fx, A.y + (wallB - A.y) * 0.18, Math.max(10, A.w * 0.014), rt?.anim ?? 0); } },
  zones: Array.from({ length: 10 }, (_, i) => [`b${i}`, null]),
  build: (K) => {
    const tall = K.tall, N = Math.min(K.N, 10), ref = tall ? { w: 760, h: 760 } : { w: 1180, h: 580 }, by = {}, bowls = [];
    const span = ref.w - (tall ? 190 : 340), x0 = -span / 2, cy = tall ? 330 : 270, Rmax = tall ? 200 : 190, Rmin = tall ? 80 : 76;
    for (let i = 0; i < N; i++) { const t = i / Math.max(1, N - 1), R = lerp(Rmax, Rmin, Math.pow(t, 0.9)), x = x0 + span * Math.pow(t, 0.95) * 0.9 + (tall ? 120 : 120); bowls.push({ x, R, i, col: BOWLCOL[i] }); by[`b${i}`] = eSpot(x + 8, cy - R * 0.55, 20, Math.max(34, R * 0.34), 0, { apk: 0.9 }); }
    return { ref, by, wallU: cy + Rmax + (tall ? 10 : 6),
      draw(ctx, rt, fl) {
        // the cabinet and the spindle
        const cabY = cy + Rmax * 0.62, cabW = span + 240;
        ctx.fillStyle = 'rgba(0,0,0,0.38)'; rrect(ctx, -cabW / 2 + 10, cabY + 16, cabW, tall ? 120 : 110, 16); ctx.fill();
        beam(ctx, -cabW / 2, cabY, cabW, tall ? 120 : 110, '#5a3a1e', { round: 16 }); ctx.fillStyle = 'rgba(255,220,160,0.25)'; ctx.fillRect(-cabW / 2 + 10, cabY + 8, cabW - 20, 3);
        for (const fx of [-0.4, 0.4]) { beam(ctx, fx * cabW - 20, cabY + 100, 40, (tall ? 90 : 80), '#3a2410', { vertical: true, round: 8 }); }
        ctx.fillStyle = hgrad(ctx, 0, 1, [[0, '#888']]); ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0 - 70, cy); ctx.lineTo(x0 + span + 60, cy); ctx.stroke(); ctx.strokeStyle = '#a89a80'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x0 - 70, cy - 2); ctx.lineTo(x0 + span + 60, cy - 2); ctx.stroke();
        // bowls from the largest (left) to the smallest (right): a lens of glass with a coloured rim band on its open edge
        bowls.forEach((b) => { const f = fl(`b${b.i}`), R = b.R, rx = 22, x = b.x, d = R * 0.62;
          const lens = (g) => { g.beginPath(); g.ellipse(x, cy, rx, R, 0, 0, TAU); };
          const cup = (g) => { g.beginPath(); g.ellipse(x, cy, d, R, 0, PI * 0.5, PI * 1.5); g.closePath(); };
          ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.save(); ctx.translate(12, 14); cup(ctx); ctx.fill(); ctx.restore();
          // the bowl: a deep cup of glass opening toward the right, its rim a thin ellipse
          cup(ctx); ctx.fillStyle = hgrad(ctx, x - d, x, [[0, 'rgba(90,150,190,0.55)'], [0.5, 'rgba(190,226,244,0.42)'], [1, 'rgba(230,248,255,0.5)']]); ctx.fill();
          ctx.save(); cup(ctx); ctx.clip(); ctx.fillStyle = vgrad(ctx, cy - R, cy + R, [[0, 'rgba(255,255,255,0.4)'], [0.3, 'rgba(255,255,255,0)'], [1, 'rgba(20,50,80,0.25)']]); ctx.fillRect(x - d, cy - R, d, 2 * R); ctx.restore();
          ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.8; cup(ctx); ctx.stroke();
          lens(ctx); ctx.fillStyle = 'rgba(210,240,255,0.28)'; ctx.fill();
          ctx.strokeStyle = rgba(b.col, 0.96); ctx.lineWidth = 8; lens(ctx); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, cy, rx - 3, R - 3, 0, PI * 1.08, PI * 1.5); ctx.stroke();
          if (f > 0.05) { glow(ctx, x, cy - R * 0.5, R * 0.8, '#fff0c0', 0.42 * f); const a = (rt.anim * 6 + b.i) % TAU; ctx.strokeStyle = `rgba(255,248,214,${0.95 * f})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(x, cy, rx, R, 0, a, a + 1.2); ctx.stroke(); rings(ctx, x, cy, R * 0.5, f); } });
        // a flywheel hub at the left end of the spindle
        ctx.fillStyle = rgrad(ctx, x0 - 90, cy - 6, 0, 36, [[0, '#d8c8a0'], [0.6, '#8a7a50'], [1, '#3a3020']]); circ(ctx, x0 - 80, cy, 30); ctx.fill(); ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 3; circ(ctx, x0 - 80, cy, 30); ctx.stroke();
      } };
  },
});

// ============================================================ MUSICAL SAW =====================================================================
mkGong('saw', /musical.?saw|singing.?saw|bowed.?saw/, {
  voice: 'gx-saw',
  wall: { kind: 'timber', c1: '#6a4a2c', c2: '#8a6238', log: 64 }, floor: { kind: 'planks', c1: '#4a3018', c2: '#6a4426', ph: 58 }, rail: '#2a1a0c', light: '#ffe0a8', vig: 0.55,
  orn(ctx, A, wallB) { const x = A.x + A.w * 0.5, y = A.y + (wallB - A.y) * 0.2; ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x - 70, y - 4, 150, 100); ctx.fillStyle = '#d8c8a0'; ctx.fillRect(x - 74, y - 10, 150, 100); ctx.fillStyle = '#8a1f1a'; ctx.fillRect(x - 74, y - 10, 150, 10); },
  zones: Array.from({ length: 10 }, (_, i) => [`n${i}`, null]),
  build: (K) => {
    const tall = K.tall, N = Math.min(K.N, 10), ref = tall ? { w: 700, h: 900 } : { w: 1120, h: 540 }, by = {}, notes = [];
    const Lb = tall ? 760 : 900, u0 = -Lb / 2, hb0 = tall ? 150 : 138, hb1 = tall ? 70 : 62;
    // blade space: u along the blade (handle at u0), v across (down). tall: the blade stands up, wide: it lies across
    const toD = (u, v) => (tall ? [v, u + (ref.h / 2 - 20)] : [u, v + ref.h * 0.42]);
    const yc = (u) => 14 * Math.sin(((u - u0) / Lb) * TAU * 1.1 + 0.4) * (tall ? 1 : 1.1);
    const hb = (u) => lerp(hb0, hb1, (u - u0) / Lb);
    for (let i = 0; i < N; i++) { const u = u0 + Lb * (0.14 + 0.78 * (i / Math.max(1, N - 1))); notes.push({ u, i }); const [x, y] = toD(u, yc(u) - hb(u) * 0.5 + 6); by[`n${i}`] = eSpot(x, y, tall ? 48 : 36, tall ? 34 : 50, 0, { apk: 0.9 }); }
    return { ref, by, wallU: tall ? 420 : 250,
      draw(ctx, rt, fl) {
        ctx.save(); const [ox, oy] = toD(0, 0); ctx.translate(ox, oy); if (tall) ctx.rotate(PI / 2); if (tall) ctx.translate(0, 0);
        const O = tall ? 1 : 1;   // in blade space the picture is the same; the rotation does the rest
        void O;
        const top = (u) => yc(u) - hb(u) * 0.5, bot = (u) => yc(u) + hb(u) * 0.5;
        // stands: two heavy wooden blocks with iron clamps hold the handle end and the tip
        const clamp2 = (u, w, hgt, flip) => { ctx.fillStyle = 'rgba(0,0,0,0.38)'; rrect(ctx, u - w / 2 + 10, top(u) - 20 + 14, w, hgt, 12); ctx.fill(); beam(ctx, u - w / 2, top(u) - 20, w, hgt, '#4a2c14', { round: 12 }); ctx.fillStyle = '#6a6e78'; for (const k of [0.25, 0.75]) { circ(ctx, u - w / 2 + w * k, top(u) - 4, 5); ctx.fill(); } void flip; };
        // blade polygon: the smooth spine on top, the toothed edge below
        const NB = 60; const blade = (g) => { g.beginPath(); for (let k = 0; k <= NB; k++) { const u = u0 + (Lb * k) / NB; if (k) g.lineTo(u, top(u)); else g.moveTo(u, top(u)); } for (let k = NB; k >= 0; k--) { const u = u0 + (Lb * k) / NB; g.lineTo(u, bot(u)); } g.closePath(); };
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.save(); ctx.translate(12, 18); blade(ctx); ctx.fill(); ctx.restore();
        blade(ctx); ctx.fillStyle = vgrad(ctx, -hb0, hb0, [[0, '#9aa2ac'], [0.3, '#dce2ea'], [0.55, '#a8b0ba'], [1, '#5a626c']]); ctx.fill();
        ctx.save(); blade(ctx); ctx.clip();
        // the S bend: soft bands of light that change along the length
        for (let k = 0; k < 14; k++) { const u = u0 + Lb * (k / 14), a = 0.12 + 0.12 * Math.sin(k * 0.9 + 0.7); ctx.fillStyle = k % 2 ? `rgba(255,255,255,${a})` : `rgba(20,30,46,${a})`; ctx.fillRect(u, -hb0, Lb / 14, 2 * hb0); }
        ctx.fillStyle = hgrad(ctx, u0, u0 + Lb, [[0, 'rgba(255,255,255,0.1)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.12)']]); ctx.fillRect(u0, -hb0, Lb, 2 * hb0);
        ctx.strokeStyle = 'rgba(30,40,56,0.35)'; ctx.lineWidth = 1.6; for (let k = 0; k < 3; k++) { ctx.beginPath(); for (let j = 0; j <= 30; j++) { const u = u0 + 30 + (Lb - 60) * (j / 30); const v = yc(u) + (k - 1) * hb(u) * 0.2; if (j) ctx.lineTo(u, v); else ctx.moveTo(u, v); } ctx.stroke(); }   // etched lines
        ctx.restore(); blade(ctx); ctx.strokeStyle = 'rgba(30,38,50,0.7)'; ctx.lineWidth = 2; ctx.stroke();
        // teeth along the lower edge
        ctx.fillStyle = '#5a626c'; const nt = Math.round(Lb / 14); for (let k = 0; k < nt; k++) { const u = u0 + (Lb * k) / nt, u2 = u0 + (Lb * (k + 1)) / nt; ctx.beginPath(); ctx.moveTo(u, bot(u)); ctx.lineTo(u2, bot(u2)); ctx.lineTo(u + (u2 - u) * 0.3, bot(u) + 9); ctx.closePath(); ctx.fill(); }
        // note ticks on the spine
        notes.forEach((n) => { const f = fl(`n${n.i}`), u = n.u, v = top(u) + 14; ctx.fillStyle = f > 0.05 ? '#fff0b0' : '#2a3240'; circ(ctx, u, v, 4.2 + 2 * f); ctx.fill(); if (f > 0.05) glow(ctx, u, v, 44, '#ffe090', 0.5 * f); });
        // the wooden handle at the left end and a small knob at the tip
        const hx = u0 - 56; ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, hx + 8, yc(u0) - 54 + 12, 78, 108, 26); ctx.fill(); ctx.fillStyle = hgrad(ctx, hx, hx + 78, [[0, '#4a2a14'], [0.3, '#b87a3c'], [0.7, '#8a5a28'], [1, '#3a2010']]); rrect(ctx, hx, yc(u0) - 54, 78, 108, 26); ctx.fill(); ctx.fillStyle = vgrad(ctx, yc(u0) - 30, yc(u0) + 30, [[0, '#1a0e06'], [1, '#2a1a0c']]); rrect(ctx, hx + 14, yc(u0) - 30, 50, 60, 16); ctx.fill();
        for (const q of [-38, 38]) { ctx.fillStyle = '#c8c0a0'; circ(ctx, u0 + 4, yc(u0) + q, 5); ctx.fill(); }
        clamp2(u0 + 34, 56, 130, false); clamp2(u0 + Lb - 30, 56, 110, true);
        // the bow rides the spine at the note being played
        const act = notes.map((n) => ({ n, f: fl(`n${n.i}`) })).sort((a, b) => b.f - a.f)[0];
        const bu = act && act.f > 0.05 ? act.n.u : u0 + Lb * 0.5, bf = act && act.f > 0.05 ? act.f : 0, bx = bu + Math.sin(rt.anim * 18) * 22 * bf;
        ctx.save(); ctx.translate(bx, top(bu) + 6); ctx.rotate(-0.14 * 0 + 0.08);
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(7, -250); ctx.lineTo(7, 240); ctx.stroke();
        ctx.strokeStyle = '#3a1c0c'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, -250); ctx.quadraticCurveTo(-18, 0, 0, 240); ctx.stroke(); ctx.strokeStyle = '#a8683a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-2, -250); ctx.quadraticCurveTo(-20, 0, -2, 240); ctx.stroke();
        ctx.strokeStyle = '#f0ece0'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(14, -236); ctx.lineTo(14, 226); ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(17, -236); ctx.lineTo(17, 226); ctx.stroke();
        ctx.fillStyle = '#1c1008'; rrect(ctx, -9, 214, 30, 36, 6); ctx.fill(); ctx.restore();
        if (bf > 0.05) { ctx.strokeStyle = `rgba(255,236,170,${0.6 * bf})`; ctx.lineWidth = 3; ctx.beginPath(); for (let j = 0; j <= 20; j++) { const u = bu - 130 + 260 * (j / 20), v = top(u) - 18 * bf * Math.sin((j / 20) * PI) * Math.cos(rt.anim * 40 + j); if (j) ctx.lineTo(u, v); else ctx.moveTo(u, v); } ctx.stroke(); }
        ctx.restore();
      } };
  },
});
registerStrikeVoice('gx-saw', (c) => c.evoice(c.audio, 'sawsong', { hz: c.hz, dur: Math.max(0.7, c.dur), vel: c.vel }), { mono: true });
void mix; void lerp; void grain; void TAU;

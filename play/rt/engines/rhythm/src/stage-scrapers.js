// Scraped idiophones (1.19.0): the guiro (notched gourd), the guira (punched metal cylinder with a steel brush) and the guacharaca (notched palm-wood
// tube with a three-pronged fork). A stroke drags the scraper along the notches (Down / Up), a Scratch is a short rasp in the middle and a Knock
// strikes the end. The scraper on the drawing travels while the lane's flash decays. No performer and no hands.
import { eSpot, dropShadow } from './drum-kit.js';
import { mkRattle } from './stage-rattles.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU, glow, lerp, solid, metalFill, handle, makeOrient } from './rattle-kit.js';

const ZONES = [['down', /down|long|sweep|draw|forward/], ['up', /\bup\b|back|return|reverse/], ['short', /short|scratch|rasp|flick|chick|quick/], ['knock', /knock|end|rim|beat|click|strike/]];

// a scraper position 0..1 along the ridges that follows the lanes' flashes: Down runs 0 -> 1 as its flash decays, Up 1 -> 0, Scratch shivers in the middle
const scraperPos = () => {
  let pos = 0.15, last = 0;
  return (rt, fl) => {
    const dt = clamp(rt.anim - last, 0, 0.1); last = rt.anim;
    const d = fl('down'), u = fl('up'), s = fl('short');
    const tgt = d > 0.04 ? 1 - d : u > 0.04 ? u : s > 0.04 ? 0.5 + 0.1 * Math.sin(rt.anim * 70) : pos;
    pos += (tgt - pos) * clamp(dt * (d > 0.04 || u > 0.04 ? 30 : 12), 0, 1);
    return { pos, active: Math.max(d, u, s) };
  };
};
const dust = (ctx, x, y, f, t, col = '#f4e0b0') => { if (f <= 0.05) return; for (let k = 0; k < 7; k++) { const a = hash(k + Math.floor(t * 30)) * TAU, d = 14 + 26 * hash(k + 3) * (1 - f * 0.5); ctx.fillStyle = rgba(col, 0.55 * f); circ(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6 - 6, 2 + 2 * hash(k)); ctx.fill(); } };

// ============================================================ GUIRO ======================================================
mkRattle('guiro', /g[uü][ií]ro|guicharo|gu[ií]charo|notched.?gourd/, {
  dress: () => ({ kind: 'cloth', base: '#26523c', accent: '#e8d089', rugKind: 'zigzag', rugBase: '#173a2a', rugA: '#f0c868', rugB: '#c0442a', light: '#ffe8b0' }),
  zones: ZONES,
  build: (K) => {
    const tall = K.tall, ref = tall ? { w: 920, h: 360 } : { w: 1000, h: 460 }, view = tall ? { tilt: -1.0, zoom: 1.08 } : {};
    const L = 800, cx = 0, cy = ref.h * 0.56, W = 178;
    const half = (t) => W * 0.5 * Math.pow(Math.sin(Math.PI * (0.02 + 0.96 * t)), 0.3) * (1 - 0.22 * t * t);
    const bow = (t) => -30 * Math.sin(Math.PI * t) + 22 * t;
    const X = (t) => cx - L / 2 + L * t, Y = (t) => cy + bow(t);
    const by = {};
    by.down = eSpot(X(0.36), Y(0.36) - 4, L * 0.26, W * 0.52, 0, { apk: 0.9 });
    by.up = eSpot(X(0.7), Y(0.7) - 4, L * 0.17, W * 0.52, 0, { apk: 0.9 });
    by.short = eSpot(X(0.53), Y(0.53) + 8, W * 0.34, W * 0.42, 0, { apk: 0.9 });
    by.knock = eSpot(X(0.07), Y(0.07), W * 0.46, W * 0.52, 0, { apk: 0.9 });
    const sp = scraperPos();
    return { ref, view, by,
      draw(ctx, rt, fl) {
        const { pos, active } = sp(rt, fl), kn = fl('knock');
        const body = (g) => { g.beginPath(); for (let k = 0; k <= 60; k++) { const t = k / 60; g.lineTo(X(t), Y(t) - half(t)); } for (let k = 60; k >= 0; k--) { const t = k / 60; g.lineTo(X(t), Y(t) + half(t) * 0.92); } g.closePath(); };
        dropShadow(ctx, body, 16, 24, 0.42);
        // dry gourd skin, cream and ochre, mottled, lit along the upper edge
        ctx.fillStyle = vgrad(ctx, cy - W * 0.7, cy + W * 0.6, [[0, '#8a6a30'], [0.18, '#f0d89a'], [0.4, '#dcb868'], [0.72, '#b88a3c'], [1, '#6a4a1c']]); body(ctx); ctx.fill();
        ctx.save(); body(ctx); ctx.clip();
        for (let k = 0; k < 220; k++) { const t = hash(k); ctx.fillStyle = `rgba(80,46,12,${0.05 + 0.13 * hash(k + 3)})`; ell(ctx, X(t), Y(t) + (hash(k + 60) - 0.5) * W * 0.9, 3 + 10 * hash(k + 9), 1.6 + 4 * hash(k + 4)); ctx.fill(); }
        // the notches: a field of short parallel cuts across the playing face, each a dark slit with a lit lip
        const n = 26, t0 = 0.14, t1 = 0.88;
        for (let k = 0; k < n; k++) {
          const t = lerp(t0, t1, k / (n - 1)), x = X(t), y = Y(t), h = half(t) * 0.62, near = Math.exp(-(((t - lerp(t0, t1, pos)) / 0.05) ** 2)) * active;
          ctx.fillStyle = 'rgba(30,14,2,0.78)'; ctx.beginPath(); ctx.moveTo(x - 4.5, y - h); ctx.lineTo(x + 3, y - h); ctx.lineTo(x + 1.5, y + h); ctx.lineTo(x - 6, y + h); ctx.closePath(); ctx.fill();
          ctx.fillStyle = rgba('#fff0c8', 0.55 + 0.4 * near); ctx.fillRect(x + 3, y - h, 2.4, 2 * h);
          ctx.fillStyle = 'rgba(20,8,0,0.35)'; ctx.fillRect(x - 8, y - h, 2.4, 2 * h);
        }
        // burnt bands near both ends
        for (const t of [0.05, 0.095, 0.93]) { ctx.fillStyle = 'rgba(52,24,6,0.7)'; ctx.fillRect(X(t), Y(t) - W, 7, 2 * W); }
        ctx.fillStyle = vgrad(ctx, cy - W * 0.7, cy + W * 0.7, [[0, 'rgba(255,250,224,0.42)'], [0.22, 'rgba(255,250,224,0)'], [0.72, 'rgba(0,0,0,0)'], [1, 'rgba(24,8,0,0.4)']]); ctx.fillRect(X(0) - 20, cy - W * 1.2, L + 40, W * 2.4);
        if (kn > 0.04) { ctx.fillStyle = rgba('#fff4cc', 0.5 * kn); ell(ctx, X(0.07), Y(0.07), W * 0.5, W * 0.56); ctx.fill(); }
        ctx.restore();
        ctx.strokeStyle = 'rgba(34,14,2,0.65)'; ctx.lineWidth = 3; body(ctx); ctx.stroke();
        // the stem end: a small dark curl, and a cord loop to hang it by
        ctx.strokeStyle = '#4a2c10'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(X(0.985), Y(0.985)); ctx.quadraticCurveTo(X(1) + 34, Y(1) - 6, X(1) + 30, Y(1) - 40); ctx.stroke();
        ctx.strokeStyle = '#d8c08a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(X(0.2), Y(0.2) - half(0.2) - 12, 22, 16, 0, Math.PI, TAU); ctx.stroke();
        // the scraper: a slim wooden stick held at an angle, its tip riding the notches
        const tx = X(lerp(t0, t1, pos)), ty = Y(lerp(t0, t1, pos)) - half(0.5) * 0.15, ang = -0.72 + 0.1 * Math.sin(rt.anim * 60) * active, sl = 380;
        ctx.save(); ctx.translate(tx, ty); ctx.rotate(ang);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(sl, 12); ctx.lineTo(sl, 22); ctx.lineTo(0, 11); ctx.fill();
        ctx.fillStyle = hgrad(ctx, 0, sl, [[0, '#3a2210'], [0.1, '#7a4e26'], [0.5, '#a8743a'], [1, '#6a4220']]); ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(sl, -11); ctx.lineTo(sl, 11); ctx.lineTo(0, 4); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,230,180,0.35)'; ctx.fillRect(10, -3, sl - 30, 2);
        ctx.restore();
        dust(ctx, tx, ty, active, rt.anim);
      } };
  },
});

// ============================================================ GUIRA ======================================================
mkRattle('guira', /g[uü][ií]ra\b|\bguira\b|metal.?scraper|grater/, {
  dress: () => ({ kind: 'tiles', base: '#2a4a64', accent: '#e0b858', rugKind: null, light: '#fff0c8' }),
  zones: ZONES,
  build: (K) => {
    const tall = K.tall, ref = tall ? { w: 560, h: 780 } : { w: 900, h: 470 }, Y0 = 380;
    const OR = makeOrient(tall, ref, Y0, eSpot);
    const cx = 0, top = 70, bot = 600, R = 120, by = {};
    by.down = OR.ES(cx - R * 0.35, top + (bot - top) * 0.4, R * 0.62, (bot - top) * 0.3, { apk: 0.9 });
    by.up = OR.ES(cx + R * 0.5, top + (bot - top) * 0.45, R * 0.4, (bot - top) * 0.28, { apk: 0.9 });
    by.short = OR.ES(cx, top + (bot - top) * 0.82, R * 0.8, (bot - top) * 0.1, { apk: 0.9 });
    by.knock = OR.ES(cx, top + 10, R * 0.9, 30, { apk: 0.9 });
    const sp = scraperPos();
    return { ref, by,
      draw(ctx, rt, fl) {
        const { pos, active } = sp(rt, fl), kn = fl('knock');
        OR.begin(ctx);
        const body = (g) => rrect(g, cx - R, top, 2 * R, bot - top, 16);
        dropShadow(ctx, body, 16, 22, 0.42);
        metalFill(ctx, body, cx - R, cx + R, '#c9ccd2'); ctx.fill();
        ctx.save(); body(ctx); ctx.clip();
        // rows of punched burrs: little raised lenses, staggered, lit on the upper edge and dark under; the scraper polishes the ones it passes
        const rows = 31, cols = 9;
        for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
          const x = cx - R * 0.88 + (i + (j % 2) * 0.5) * (R * 1.76 / cols), y = top + 36 + j * ((bot - top - 70) / rows), near = Math.exp(-(((x - (cx - R + 2 * R * pos)) / 26) ** 2)) * active;
          ctx.fillStyle = 'rgba(34,40,52,0.62)'; ell(ctx, x + 1, y + 2.4, 8, 3.8); ctx.fill();
          ctx.fillStyle = rgba(near > 0.2 ? '#fff6d8' : '#f2f5fa', 0.9); ell(ctx, x, y, 7.2, 3.1); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.75)'; ell(ctx, x - 2, y - 1, 2.6, 1.0); ctx.fill();
        }
        ctx.fillStyle = hgrad(ctx, cx - R, cx + R, [[0, 'rgba(0,0,0,0.45)'], [0.16, 'rgba(255,255,255,0.24)'], [0.34, 'rgba(255,255,255,0)'], [0.78, 'rgba(0,0,0,0.1)'], [1, 'rgba(0,0,0,0.5)']]); ctx.fillRect(cx - R, top, 2 * R, bot - top);
        if (kn > 0.05) { ctx.fillStyle = rgba('#fff4cc', 0.5 * kn); ctx.fillRect(cx - R, top, 2 * R, 50); }
        ctx.restore();
        ctx.strokeStyle = 'rgba(30,36,48,0.8)'; ctx.lineWidth = 3; body(ctx); ctx.stroke();
        // rolled rims top and bottom, with a seam down the back edge
        for (const y of [top, bot - 22]) { ctx.fillStyle = hgrad(ctx, cx - R, cx + R, [[0, '#6a6e78'], [0.2, '#f4f6fa'], [0.45, '#b0b4be'], [0.8, '#7a7e88'], [1, '#4a4e58']]); rrect(ctx, cx - R - 6, y, 2 * R + 12, 22, 10); ctx.fill(); ctx.strokeStyle = 'rgba(20,26,36,0.7)'; ctx.lineWidth = 2; ctx.stroke(); }
        // the brush scraper: a wooden grip and a fan of stiff steel prongs resting on the surface at pos
        const sx = cx - R + 2 * R * pos, sy = top + (bot - top) * 0.5, sw = Math.sin(rt.anim * 80) * 6 * active;
        ctx.save(); ctx.translate(sx, sy + sw); ctx.rotate(0.38);
        for (let k = -4; k <= 4; k++) { ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(k * 9 + 3, -80 + 4); ctx.lineTo(k * 9 + 3, 50 + 5); ctx.stroke(); ctx.strokeStyle = k % 2 ? '#dfe3ea' : '#a9aeb8'; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(k * 9, -80); ctx.lineTo(k * 9, 50); ctx.stroke(); }
        ctx.fillStyle = vgrad(ctx, -92, -66, [[0, '#d8dce2'], [1, '#6a6e78']]); rrect(ctx, -52, -92, 104, 22, 8); ctx.fill();
        handle(ctx, 0, -90, -Math.PI / 2, 230, 36, '#8a5a30', { ring: [0.15, 0.85], seed: 12 });
        ctx.restore();
        dust(ctx, sx, sy, active, rt.anim, '#ffffff');
        OR.end(ctx);
      } };
  },
});

// ============================================================ GUACHARACA ================================================
mkRattle('guacharaca', /guacharaca|palm.?scraper|notched.?tube/, {
  dress: () => ({ kind: 'earth', base: '#4a3220', rugKind: 'stripes', rugBase: '#16322a', rugA: '#e8b84a', rugB: '#c8422a', light: '#ffe2a8' }),
  zones: ZONES,
  build: (K) => {
    const tall = K.tall, ref = tall ? { w: 520, h: 860 } : { w: 960, h: 430 }, Y0 = 430, view = tall ? { dx: -0.12 } : undefined;
    const OR = makeOrient(tall, ref, Y0, eSpot);
    const cx = 0, top = 40, bot = 800, R = 54, by = {};
    by.down = OR.ES(cx, top + (bot - top) * 0.32, R * 1.5, (bot - top) * 0.2, { apk: 0.9 });
    by.up = OR.ES(cx, top + (bot - top) * 0.6, R * 1.5, (bot - top) * 0.16, { apk: 0.9 });
    by.short = OR.ES(cx, top + (bot - top) * 0.46, R * 1.6, 44, { apk: 0.9 });
    by.knock = OR.ES(cx, bot - 50, R * 1.1, 60, { apk: 0.9 });
    const sp = scraperPos();
    return { ref, view, by,
      draw(ctx, rt, fl) {
        const { pos, active } = sp(rt, fl), kn = fl('knock');
        OR.begin(ctx);
        const body = (g) => { g.beginPath(); g.moveTo(cx - R, top); g.lineTo(cx - R * 0.92, bot); g.quadraticCurveTo(cx, bot + 24, cx + R * 0.92, bot); g.lineTo(cx + R, top); g.quadraticCurveTo(cx, top - 18, cx - R, top); g.closePath(); };
        dropShadow(ctx, body, 16, 22, 0.42);
        // the palm-wood tube: long dark red-brown fibres, rings where it was cut, a darker end plug
        ctx.fillStyle = hgrad(ctx, cx - R, cx + R, [[0, '#2a1208'], [0.16, '#9a5a30'], [0.34, '#b4703c'], [0.62, '#7a4222'], [0.88, '#3a1c0c'], [1, '#22100a']]); body(ctx); ctx.fill();
        ctx.save(); body(ctx); ctx.clip();
        grain(ctx, cx - R, top, 2 * R, bot - top, '#1c0a04', 0.5, 31, true, 40);
        for (let k = 0; k < 90; k++) { ctx.fillStyle = `rgba(250,206,150,${0.05 + 0.1 * hash(k)})`; ctx.fillRect(cx - R + hash(k + 5) * 2 * R, top + hash(k + 9) * (bot - top), 1.5, 14 + 40 * hash(k + 3)); }
        // the scraped face: a flat band of fine grooves across the front, worn pale where the fork rides
        const g0 = top + (bot - top) * 0.15, g1 = top + (bot - top) * 0.83, n = 42;
        ctx.fillStyle = hgrad(ctx, cx - R * 0.62, cx + R * 0.62, [[0, 'rgba(210,150,90,0.0)'], [0.5, 'rgba(240,190,130,0.34)'], [1, 'rgba(210,150,90,0)']]); ctx.fillRect(cx - R * 0.62, g0, R * 1.24, g1 - g0);
        for (let k = 0; k < n; k++) {
          const y = lerp(g0, g1, k / (n - 1)), near = Math.exp(-(((y - lerp(g0, g1, pos)) / 22) ** 2)) * active;
          ctx.fillStyle = 'rgba(18,6,0,0.78)'; ctx.fillRect(cx - R * 0.6, y, R * 1.2, 3.4);
          ctx.fillStyle = rgba('#ffe8b8', 0.5 + 0.4 * near); ctx.fillRect(cx - R * 0.6, y + 3.4, R * 1.2, 1.6);
        }
        // rings of bound fibre at both ends
        for (const y of [top + 8, top + 22, bot - 26, bot - 12]) { ctx.fillStyle = 'rgba(214,176,100,0.75)'; ctx.fillRect(cx - R, y, 2 * R, 6); ctx.fillStyle = 'rgba(40,20,6,0.5)'; ctx.fillRect(cx - R, y + 6, 2 * R, 3); }
        ctx.fillStyle = hgrad(ctx, cx - R, cx + R, [[0, 'rgba(0,0,0,0.35)'], [0.22, 'rgba(255,240,210,0.16)'], [0.45, 'rgba(255,240,210,0)'], [1, 'rgba(0,0,0,0.4)']]); ctx.fillRect(cx - R, top, 2 * R, bot - top);
        if (kn > 0.05) { ctx.fillStyle = rgba('#fff0c0', 0.45 * kn); ctx.fillRect(cx - R, bot - 110, 2 * R, 110); }
        ctx.restore();
        ctx.strokeStyle = 'rgba(24,8,0,0.7)'; ctx.lineWidth = 3; body(ctx); ctx.stroke();
        ctx.fillStyle = '#0c0502'; ell(ctx, cx, top - 2, R * 0.82, 13); ctx.fill(); ctx.strokeStyle = rgba('#e0a868', 0.7); ctx.lineWidth = 2; ctx.stroke();   // the open top
        // the fork: a wooden grip and three thin steel prongs set in a cross-bar, resting on the grooves at `pos`
        const fy = lerp(g0, g1, pos), sw = Math.sin(rt.anim * 80) * 4 * active;
        ctx.save(); ctx.translate(cx, fy + sw); ctx.rotate(0.0);
        for (const k of [-1, 0, 1]) { ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(R * 0.4 + 3, k * 16 + 4); ctx.lineTo(R * 1.35 + 3, k * 16 + 4); ctx.stroke(); ctx.strokeStyle = '#d8dce2'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-R * 0.55, k * 16); ctx.lineTo(R * 1.35, k * 16); ctx.stroke(); }
        ctx.fillStyle = vgrad(ctx, -30, 30, [[0, '#d8dce2'], [1, '#6a6e78']]); rrect(ctx, R * 1.2, -32, 22, 64, 6); ctx.fill();
        handle(ctx, R * 1.3, 0, 0, 230, 34, '#6a4220', { ring: [0.1, 0.9], seed: 4 });
        ctx.restore();
        dust(ctx, cx - R * 0.5, fy, active, rt.anim);
        OR.end(ctx);
      } };
  },
});

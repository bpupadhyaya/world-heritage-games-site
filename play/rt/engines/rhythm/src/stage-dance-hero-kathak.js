// Kathak tatkar, hero stage (1.24.0): a dancer in a scarlet and gold lehenga, a green choli and a sheer teal dupatta stands on a polished marble floor in a hall of
// cusped arches. The lehenga's hem rises as a foot is lifted and falls with the stamp; strings of brass bells (ghungroo) ring on both ankles. Ta is the right foot,
// Thei the left foot, Tat the quick pair of heel taps and Dha the spring on both feet with the arms flung wide. The marble mirrors the dancer faintly.
import { registerDanceStage } from './registry.js';
import { createSceneStage, eSpot, assignZones, areaInDesign } from './dance-kit.js';
import { clamp, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, circ, ell, hash, TAU } from './dance-kit.js';
import { glow } from './art.js';
import { pad, laneIcon } from './dance-pad.js';
import { envOf, dominant, mixPose } from './hero-common.js';
import { ik2, ribbon, headFront, footFront, handFront, groundPool, lerp, ease } from './figure-hero.js';

const KA = { skin: '#b9774e', red: '#b3141f', gold: '#e6b440', green: '#1f6a52', teal: '#2fa7a0', alta: '#c4201c' };
const SHY = 206, UA = 142, FA = 132;
const IDLE = { fl: [-46, 742], fr: [46, 742], hl: [-130, 520], hr: [130, 520], up: 0, lean: 0 };
function pose(key, side) {
  switch (key) {
    case 'ta': return { ...IDLE, fr: [64, 706], fl: [-46, 742], hl: [-190, 250], hr: [118, 470], lean: -0.02 };   // right foot stamps, left hand raised in a mudra
    case 'thei': return { ...IDLE, fl: [-64, 706], fr: [46, 742], hr: [190, 250], hl: [-118, 470], lean: 0.02 };
    case 'tat': return { ...IDLE, fl: [-50, 724], fr: [50, 724], hl: [-52, 330], hr: [52, 330] };
    case 'dha': return { ...IDLE, fl: [-50, 676], fr: [50, 676], hl: [-246, 262], hr: [246, 262], up: 1 };
    default: return IDLE;
  }
  void side;
}

function dancer(ctx, P, t, key, v) {
  const hy = 430 - P.up * 70 * v, hx = 0;
  // the skirt first (feet and bells show under its hem)
  const ty = hy - 36, sw = Math.sin(t * 3.6) * 4;
  const hemL = 706 - Math.max(0, (742 - P.fl[1])) * 1.4 + (P.up ? 0 : 0), hemR = 706 - Math.max(0, (742 - P.fr[1])) * 1.4;
  const hemY = (side) => (side < 0 ? hemL : hemR) - P.up * 70 * v;
  // feet and ankle bells
  for (const sx of [-1, 1]) {
    const ft = sx < 0 ? P.fl : P.fr, fy = ft[1] - P.up * 70 * v;
    ctx.fillStyle = 'rgba(0,0,0,0.34)'; ell(ctx, ft[0] + 8, 758, 44, 10); ctx.fill();
    // lower leg
    ribbon(ctx, [[ft[0] * 0.8, fy - 150], [ft[0] * 0.95, fy - 70], [ft[0], fy - 18]], [50, 40, 32], KA.skin, { shadow: false });
    footFront(ctx, ft[0], fy - 2, { col: KA.skin, sole: KA.alta, turn: sx * 0.5, s: 0.9, lift: clamp((742 - fy) / 80, 0, 1) });
    ctx.strokeStyle = KA.alta; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(ft[0], fy + 16, 30, 11, 0, 0.1, Math.PI - 0.1); ctx.stroke();
    // ankle bells: two strands of brass, shaking with the stamp
    const sh = key === 'ta' && sx > 0 || key === 'thei' && sx < 0 || key === 'tat' || key === 'dha' ? v : 0.15;
    for (let q = 0; q < 2; q++) { ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(ft[0], fy - 22 - q * 14, 22, 7, 0, 0, Math.PI); ctx.stroke();
      for (let b = 0; b < 8; b++) { const a = (b + 0.5) / 8 * Math.PI, bx = ft[0] - Math.cos(a) * 22 + Math.sin(t * 70 + b * 2 + q) * sh * 2.4, by = fy - 22 - q * 14 + Math.sin(a) * 7 + 5 + Math.cos(t * 60 + b) * sh * 2.4;
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, bx + 1, by + 2, 4.6); ctx.fill(); ctx.fillStyle = rgrad(ctx, bx - 1.4, by - 1.4, 0, 6, [[0, '#fff3b0'], [0.55, '#d4a43a'], [1, '#6a4a14']]); circ(ctx, bx, by, 4.6); ctx.fill(); } }
  }
  // lehenga: a bell of scarlet silk with a broad gold border and woven motifs, hem lifted on a raised side
  ctx.save();
  const lh = (side) => hemY(side);
  ctx.beginPath(); ctx.moveTo(-76, ty); ctx.lineTo(76, ty); ctx.bezierCurveTo(112, ty + 120, 190 + sw, lh(1) - 150, 252 + sw, lh(1) - 10); ctx.bezierCurveTo(170, lh(1) + 22, 70, lh(1) + 6, 0, lh(0) + 12); ctx.bezierCurveTo(-70, lh(-1) + 6, -170, lh(-1) + 22, -252 - sw, lh(-1) - 10); ctx.bezierCurveTo(-190 - sw, lh(-1) - 150, -112, ty + 120, -76, ty); ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.save(); ctx.translate(10, 12); ctx.fill(); ctx.restore();
  ctx.save(); ctx.clip();
  ctx.fillStyle = hgrad(ctx, -260, 260, [[0, '#6a0a14'], [0.28, '#d02a30'], [0.55, KA.red], [0.8, '#8a0c18'], [1, '#580810']]); ctx.fillRect(-270, ty - 4, 540, 400);
  for (let q = -12; q <= 12; q++) { ctx.strokeStyle = q % 2 ? 'rgba(0,0,0,0.16)' : 'rgba(255,190,190,0.1)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(q * 7, ty); ctx.quadraticCurveTo(q * 15 + sw * q * 0.1, ty + 160, q * 22 + sw * q * 0.2, hy + 300); ctx.stroke(); }
  // woven gold motifs in rows and the wide border at the hem
  for (let r = 0; r < 4; r++) for (let c = -6; c <= 6; c++) { const yy = ty + 90 + r * 62, xx = c * (30 + r * 10) + (r % 2) * 14; ctx.fillStyle = rgba(KA.gold, 0.8); ctx.beginPath(); ctx.moveTo(xx, yy - 7); ctx.lineTo(xx + 6, yy); ctx.lineTo(xx, yy + 7); ctx.lineTo(xx - 6, yy); ctx.closePath(); ctx.fill(); }
  const by0 = Math.min(lh(-1), lh(1)) - 56;
  ctx.fillStyle = hgrad(ctx, -260, 260, [[0, '#8a6410'], [0.3, '#f2d070'], [0.6, KA.gold], [1, '#8a6410']]); ctx.fillRect(-270, by0, 540, 46);
  ctx.strokeStyle = '#7a1018'; ctx.lineWidth = 3; for (let c = -14; c <= 14; c++) { ctx.beginPath(); ctx.moveTo(c * 20, by0 + 4); ctx.quadraticCurveTo(c * 20 + 10, by0 + 22, c * 20 + 20, by0 + 4); ctx.stroke(); }
  ctx.fillStyle = hgrad(ctx, -260, 260, [[0, 'rgba(0,0,0,0.3)'], [0.3, 'rgba(255,255,255,0.1)'], [0.7, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.35)']]); ctx.fillRect(-270, ty, 540, 420);
  ctx.restore();
  ctx.strokeStyle = 'rgba(40,0,6,0.55)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
  // waist band, bare midriff and the choli
  const sy = SHY + (hy - 430) * 0.92;
  ctx.fillStyle = KA.skin; ctx.beginPath(); ctx.moveTo(-66, ty - 56); ctx.lineTo(66, ty - 56); ctx.lineTo(70, ty + 2); ctx.lineTo(-70, ty + 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ell(ctx, 0, ty - 22, 4, 6); ctx.fill();
  ctx.fillStyle = hgrad(ctx, -76, 76, [[0, '#8a6410'], [0.4, '#f2d070'], [1, '#8a6410']]); rrect(ctx, -78, ty - 8, 156, 18, 6); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-84, sy); ctx.bezierCurveTo(-40, sy - 18, 40, sy - 18, 84, sy); ctx.bezierCurveTo(88, sy + 40, 74, ty - 80, 66, ty - 58); ctx.lineTo(-66, ty - 58); ctx.bezierCurveTo(-74, ty - 80, -88, sy + 40, -84, sy); ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.26)'; ctx.save(); ctx.translate(6, 8); ctx.fill(); ctx.restore();
  ctx.fillStyle = hgrad(ctx, -90, 90, [[0, '#0c3a2c'], [0.3, '#2a8a68'], [0.65, KA.green], [1, '#0a3024']]); ctx.fill(); ctx.strokeStyle = KA.gold; ctx.lineWidth = 3; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.strokeStyle = rgba(KA.gold, 0.7); ctx.lineWidth = 2; for (let q = 0; q < 5; q++) { ctx.beginPath(); ctx.arc(0, sy - 2, 28 + q * 9, 0.25, Math.PI - 0.25); ctx.stroke(); } ctx.fillStyle = KA.gold; for (let q = -3; q <= 3; q++) { circ(ctx, q * 20, ty - 70, 3); ctx.fill(); } ctx.restore();
  // arms: bare, with gold bangles; the hands in mudra
  for (const sx of [-1, 1]) {
    const sh = [sx * 80, sy + 16], hd = sx < 0 ? P.hl : P.hr;
    const rr = ik2(sh[0], sh[1], hd[0], hd[1], UA, FA, [sx * 190, Math.max(sh[1] + 60, (sh[1] + hd[1]) / 2 + 40)]);
    ribbon(ctx, [sh, [(sh[0] + rr.mid[0]) / 2, (sh[1] + rr.mid[1]) / 2], rr.mid, [(rr.mid[0] + rr.end[0]) / 2, (rr.mid[1] + rr.end[1]) / 2], rr.end], [56, 54, 50, 44, 36], KA.skin, { shadow: false });
    const ang = Math.atan2(rr.end[1] - rr.mid[1], rr.end[0] - rr.mid[0]);
    ctx.save(); ctx.translate(rr.end[0], rr.end[1]); ctx.rotate(ang); for (let q = 0; q < 4; q++) { ctx.strokeStyle = q % 2 ? KA.gold : '#a82a30'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-6 - q * 6, -17 + q); ctx.lineTo(-6 - q * 6, 17 - q); ctx.stroke(); } ctx.restore();
    handFront(ctx, rr.end[0] + Math.cos(ang) * 24, rr.end[1] + Math.sin(ang) * 24, ang, 66, { skin: KA.skin, open: 0.7, curl: 0.0, side: sx });
  }
  // sheer dupatta: from the left shoulder across the chest, a free end streaming behind with the dance
  ctx.save(); ctx.globalAlpha = 0.62;
  const wave = Math.sin(t * 2.6) * 14 + (key ? 18 * v : 0);
  ctx.beginPath(); ctx.moveTo(-90, sy - 6); ctx.bezierCurveTo(-20, sy + 40, 40, sy + 100, 92, ty - 10); ctx.lineTo(112, ty + 40); ctx.bezierCurveTo(130 + wave, ty + 130, 150 + wave * 1.5, ty + 230, 120 + wave, hy + 330); ctx.lineTo(70 + wave, hy + 330); ctx.bezierCurveTo(90 + wave, ty + 200, 66, ty + 100, 20, sy + 80); ctx.bezierCurveTo(-30, sy + 40, -70, sy + 20, -90, sy + 20); ctx.closePath();
  ctx.fillStyle = hgrad(ctx, -90, 150, [[0, '#9be8e0'], [0.5, KA.teal], [1, '#1d7a78']]); ctx.fill(); ctx.strokeStyle = KA.gold; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
  // neck, jewellery, head
  const ny = (hy - 430) * 0.92;
  ctx.save(); ctx.translate(hx, ny);
  ctx.fillStyle = rgrad(ctx, 0, 176, 0, 60, [[0, lighter(KA.skin, 0.1)], [1, darker(KA.skin, 0.35)]]); rrect(ctx, -19, 130, 38, 74, 13); ctx.fill();
  for (let q = 0; q < 3; q++) { ctx.strokeStyle = q === 1 ? '#f2d070' : KA.gold; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 146 - q * 4, 38 + q * 8, 0.35, Math.PI - 0.35); ctx.stroke(); }
  ctx.fillStyle = '#c0261f'; circ(ctx, 0, 196, 8); ctx.fill();
  headFront(ctx, 0, 92, 46, 57, {
    skin: KA.skin, turn: 0.2, jaw: 0.1,
    hairBack: (c) => { c.fillStyle = '#0e0808'; ell(c, 0, -2, 52, 62); c.fill(); c.strokeStyle = '#0e0808'; c.lineWidth = 26; c.lineCap = 'round'; c.beginPath(); c.moveTo(44, 10); c.quadraticCurveTo(68, 80, 54, 160); c.stroke(); c.strokeStyle = 'rgba(214,176,140,0.3)'; c.lineWidth = 2; for (let q = 0; q < 9; q++) { c.beginPath(); c.moveTo(50 + q, 30 + q * 14); c.lineTo(64, 40 + q * 14); c.stroke(); } c.fillStyle = KA.gold; circ(c, 54, 164, 7); c.fill(); },
    hairFront: (c) => {
      c.fillStyle = '#0e0808'; c.beginPath(); c.moveTo(-52, 6); c.bezierCurveTo(-56, -52, -24, -64, 0, -62); c.bezierCurveTo(24, -64, 56, -52, 52, 6); c.bezierCurveTo(48, -16, 20, -34, 4, -32); c.lineTo(-4, -32); c.bezierCurveTo(-20, -34, -48, -16, -52, 6); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 6; c.beginPath(); c.arc(-8, -22, 40, Math.PI * 1.1, Math.PI * 1.5); c.stroke();
      c.strokeStyle = KA.gold; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -32); c.lineTo(0, -12); c.stroke(); c.fillStyle = KA.gold; ell(c, 0, -6, 6, 9); c.fill(); c.fillStyle = '#c0261f'; circ(c, 0, -6, 3); c.fill();   // maang tikka
      c.fillStyle = '#c0261f'; circ(c, 0, 4, 3.6); c.fill();   // bindi
      for (const d of [-1, 1]) { c.strokeStyle = KA.gold; c.lineWidth = 3; c.beginPath(); c.moveTo(d * 48, 22); c.lineTo(d * 50, 36); c.stroke(); c.fillStyle = KA.gold; c.beginPath(); c.arc(d * 50, 44, 9, 0, Math.PI); c.fill(); }
    },
  });
  ctx.restore();
}

function hall(ctx, A, t, hz, gy) {
  const X0 = A.x0, X1 = A.x1, W = X1 - X0, Y0 = A.y0, H = A.y1, cx = (X0 + X1) / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0, W, H - Y0); ctx.clip();
  ctx.fillStyle = vgrad(ctx, Y0, hz, [[0, '#3a1810'], [1, '#6a3a22']]); ctx.fillRect(X0, Y0, W, hz - Y0);
  // a row of cusped arches in carved sandstone with deep recesses and teal inlay
  const aw = 250, n = Math.ceil(W / aw) + 1, x00 = cx - (n * aw) / 2;
  for (let k = 0; k < n; k++) {
    const ax = x00 + k * aw + aw / 2, top = Y0 + 70, base = hz - 6, hw = aw / 2 - 26;
    ctx.beginPath(); ctx.moveTo(ax - hw, base); ctx.lineTo(ax - hw, top + 150); for (let q = 0; q <= 5; q++) { const a = Math.PI + q / 5 * Math.PI, rx = hw, ry = 150; const cxp = ax + Math.cos(a) * rx, cyp = top + 150 + Math.sin(a) * ry; ctx.lineTo(cxp, cyp); if (q < 5) { const a2 = Math.PI + (q + 0.5) / 5 * Math.PI; ctx.quadraticCurveTo(ax + Math.cos(a2) * rx * 0.86, top + 150 + Math.sin(a2) * ry * 0.86, ax + Math.cos(a + Math.PI / 5) * rx, top + 150 + Math.sin(a + Math.PI / 5) * ry); } } ctx.lineTo(ax + hw, base); ctx.closePath();
    ctx.fillStyle = vgrad(ctx, top, base, [[0, '#1a0c08'], [0.5, '#3a1a10'], [1, '#2a1410']]); ctx.fill(); ctx.strokeStyle = '#d8a060'; ctx.lineWidth = 8; ctx.stroke(); ctx.strokeStyle = '#8a4a28'; ctx.lineWidth = 3; ctx.stroke();
    glow(ctx, ax, top + 220, 120, '#ffb060', 0.22);
    ctx.fillStyle = hgrad(ctx, ax - aw / 2, ax + aw / 2, [[0, '#a87a4a'], [0.5, '#e0b27a'], [1, '#a87a4a']]); ctx.fillRect(ax - aw / 2, top + 20, 22, base - top - 20 + 6);
    ctx.fillStyle = KA.teal; for (let q = 0; q < 6; q++) { ctx.fillRect(ax - aw / 2 + 6, top + 50 + q * 44, 10, 22); }
  }
  // hanging brass lamps
  for (const lx of [cx - 190, cx + 190, cx]) { const sway = Math.sin(t * 1.2 + lx) * 3; ctx.strokeStyle = '#6a4a14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, Y0); ctx.lineTo(lx + sway, Y0 + 54); ctx.stroke(); const fl = 0.85 + 0.15 * Math.sin(t * 8 + lx); glow(ctx, lx + sway, Y0 + 86, 80, '#ffc060', 0.5 * fl); ctx.fillStyle = hgrad(ctx, lx + sway - 18, lx + sway + 18, [[0, '#7a5410'], [0.4, '#f0cc60'], [1, '#6a4810']]); ctx.beginPath(); ctx.moveTo(lx + sway - 8, Y0 + 54); ctx.lineTo(lx + sway + 8, Y0 + 54); ctx.lineTo(lx + sway + 20, Y0 + 90); ctx.lineTo(lx + sway - 20, Y0 + 90); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffe9a0'; ell(ctx, lx + sway, Y0 + 80, 6, 9 * fl); ctx.fill(); }
  // marble floor: white slabs with grey veins, a dark border of inlay, a lamp reflection
  ctx.fillStyle = vgrad(ctx, hz, H, [[0, '#c8c2b8'], [1, '#e8e2d6']]); ctx.fillRect(X0, hz, W, H - hz);
  ctx.strokeStyle = 'rgba(90,80,70,0.38)'; ctx.lineWidth = 2.4; for (let k = -12; k <= 12; k++) { ctx.beginPath(); ctx.moveTo(cx + k * 60, hz); ctx.lineTo(cx + k * 210, H); ctx.stroke(); } for (let y = hz + 20, d = 22; y < H; y += d, d *= 1.34) { ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(X1, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(120,110,100,0.22)'; ctx.lineWidth = 1.6; for (let k = 0; k < 18; k++) { const x = X0 + hash(k * 3.7) * W, y = hz + hash(k * 5.1) * (H - hz); ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 40, y + 20, x + 20, y + 50, x + 90, y + 60); ctx.stroke(); }
  ctx.fillStyle = 'rgba(40,20,10,0.55)'; ctx.fillRect(X0, hz, W, 7);
  // inlaid medallion under the dancer
  const my = gy; ctx.save(); ctx.translate(0, my); ctx.scale(1, 0.26); for (let r = 0; r < 3; r++) { ctx.strokeStyle = [KA.red, KA.gold, KA.green][r]; ctx.lineWidth = 7; circ(ctx, 0, 0, 250 - r * 34); ctx.stroke(); } for (let q = 0; q < 12; q++) { ctx.save(); ctx.rotate(q / 12 * TAU); ctx.fillStyle = q % 2 ? KA.red : KA.teal; ctx.beginPath(); ctx.moveTo(150, 0); ctx.lineTo(188, 14); ctx.lineTo(210, 0); ctx.lineTo(188, -14); ctx.closePath(); ctx.fill(); ctx.restore(); } ctx.restore();
  ctx.fillStyle = rgrad(ctx, cx, hz + (H - hz) * 0.4, 10, W * 0.5, [[0, 'rgba(255,214,150,0.32)'], [1, 'rgba(255,214,150,0)']]); ctx.fillRect(X0, hz, W, H - hz);
  ctx.restore();
}

const ZONES = [['ta', /^ta$|^ta\b/], ['thei', /thei|thai|dhin/], ['tat', /tat|heel/], ['dha', /dha|jump|spring/]];
registerDanceStage({
  id: 'kathak-hero', match: /kathak.*dancer|dancer.*kathak|tatkar.*dancer/,
  build: (S, lanes, P) => createSceneStage('kathak-hero', S, lanes, P, {
    tallRatio: 0.85,
    dress: () => ({ kind: 'tiles', base: '#c8c2b8', accent: '#e0b27a', light: '#ffe6b0' }),
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 960 } : { w: 1180, h: 600 };
      const keyOf = assignZones(K, ZONES.map(([key, re]) => ({ key, re }))); const spots = new Array(K.N).fill(null);
      const k = tall ? 0.96 : 0.7, fy = tall ? 52 : 18, hz = tall ? 540 : 330, PR = tall ? 62 : 62;
      const by = tall ? { ta: [-290, 898], thei: [-100, 898], tat: [100, 898], dha: [290, 898] } : { ta: [490, 170], thei: [-490, 170], tat: [-490, 360], dha: [490, 360] };
      for (let i = 0; i < K.N; i++) { const p = by[keyOf[i]]; if (p) spots[i] = eSpot(p[0], p[1], PR, PR, 0, { apk: 1, extra: { noFill: true } }); }
      return { ref, spots,
        draw(ctx, rt, g) {
          const t = rt.anim; hall(ctx, areaInDesign(ctx, g.F, ref), t, hz, fy + 748 * k);
          const env = envOf(rt, K, keyOf), [key, v] = dominant(env);
          const P0 = key ? mixPose(IDLE, pose(key), v) : { ...IDLE, hl: [-130 - 6 * Math.sin(t * 2), 520], hr: [130, 520 + 4 * Math.sin(t * 2.2)] };
          const bob = key ? 0 : 3 * Math.sin(t * 5);
          // faint mirror image in the marble
          ctx.save(); ctx.translate(0, fy + 744 * k + 6); ctx.scale(k, -k * 0.28); ctx.translate(0, -742); ctx.globalAlpha = 0.12; dancer(ctx, { ...P0, up: 0 }, t, key, v); ctx.restore();
          ctx.save(); ctx.translate(0, fy + bob); ctx.scale(k, k);
          groundPool(ctx, 6, 764, 200, 22, 0.28);
          dancer(ctx, { ...P0, up: key === 'dha' ? 1 : 0 }, t, key, v);
          if ((key === 'ta' || key === 'thei' || key === 'tat') && v > 0.6) for (const sx of key === 'tat' ? [-1, 1] : [key === 'ta' ? 1 : -1]) glow(ctx, sx * 52, 756, 70, '#ffe0a0', 0.5 * v);
          ctx.restore();
          lanes.forEach((l, i) => { if (spots[i]) pad(ctx, l, spots[i], rt.flash[i], laneIcon(l)); });
        } };
    },
  }),
});
void lerp; void ease; void darker;

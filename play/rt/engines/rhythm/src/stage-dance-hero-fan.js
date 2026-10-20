// Korean fan dance, hero stage (1.25.0): a dancer in a short pink jacket with long sleeves and a high-waisted full skirt holds two large painted folding fans and answers each
// lane with a fan figure: Open (both fans thrown wide), Sweep (one fan high, one low, the sides swapping on each stroke), Bloom (the two fans meet in front of the chest
// like the petals of one flower), Close (the fans snap shut, hands together low). The fans are the second hero: ribs, painted peonies, a tassel, an opening angle that
// follows the movement. A night stage: indigo curtain, a painted folding screen, a polished floor with a pool of light.
import { registerDanceStage } from './registry.js';
import { createSceneStage, eSpot, assignZones, areaInDesign } from './dance-kit.js';
import { clamp, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, circ, ell, hash, TAU } from './dance-kit.js';
import { glow } from './art.js';
import { pad, laneIcon } from './dance-pad.js';
import { envOf, dominant, mixPose, flipSide } from './hero-common.js';
import { groundPool, ease, lerp } from './figure-hero.js';
import { drawFigure } from './figure-hero2.js';

const HB = { skin: '#efc3a0', jacket: '#f2a8bd', jacketD: '#b8607c', collar: '#fbf3e6', skirt: '#17728a', skirtD: '#0c3e52', ribbon: '#a8203a', gold: '#e8c25a', hair: '#12090a' };
const IDLE = { hip: [0, 432], fl: [-60, 742], fr: [60, 742], hl: [-176, 430], hr: [176, 430], lean: 0, sp: 0.4, fa: [2.4, 0.74] };   // fa: absolute fan angles [left, right]; the left one lives in 1.57..4.3 and the right one in -1.2..1.4, so blending never sweeps through the body
const FAN = { paper: '#fbe9ee', paperD: '#e8a8bb', rib: '#8a4a28', rim: '#d9365a', peony: '#e24a72', leaf: '#3f8a5a' };

function pose(key, v, side) {
  let T = IDLE;
  if (key === 'open') T = { ...IDLE, hl: [-244, 150], hr: [244, 150], fl: [-84, 742], fr: [84, 742], sp: 1.0, fa: [3.98, -0.84] };
  else if (key === 'sweep') T = side > 0 ? { ...IDLE, hl: [-256, 120], hr: [250, 470], sp: 0.95, fa: [3.78, 0.5], lean: 0.05 } : { ...IDLE, hl: [-250, 470], hr: [256, 120], sp: 0.95, fa: [2.64, -0.64], lean: -0.05 };
  else if (key === 'bloom') T = { ...IDLE, hl: [-70, 300], hr: [70, 300], sp: 1.15, fa: [4.28, -1.14], fl: [-70, 742], fr: [70, 742] };
  else if (key === 'close') T = { ...IDLE, hl: [-48, 470], hr: [48, 470], sp: 0.06, fa: [1.78, 1.36] };
  return mixPose(IDLE, T, v);
}

// one big folding fan: pivot (px,py), centre direction `a`, opening `sp` (0 closed .. 1.2 almost a half circle), radius R
function fan(ctx, px, py, a, sp, R, seed, t) {
  const half = sp * 0.5 * Math.PI * 0.9 + 0.03, a0 = a - half, a1 = a + half, r0 = R * 0.16, n = 13;
  ctx.save();
  // handle: a short stick to the grip behind the pivot
  ctx.strokeStyle = FAN.rib; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px - Math.cos(a) * 34, py - Math.sin(a) * 34); ctx.lineTo(px, py); ctx.stroke();
  const sector = (r, k = 1) => { ctx.beginPath(); ctx.moveTo(px + Math.cos(a0) * r0, py + Math.sin(a0) * r0); ctx.arc(px, py, r * k, a0, a1); ctx.lineTo(px + Math.cos(a1) * r0, py + Math.sin(a1) * r0); ctx.arc(px, py, r0, a1, a0, true); ctx.closePath(); };
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.save(); ctx.translate(7, 10); sector(R); ctx.fill(); ctx.restore();
  sector(R); ctx.fillStyle = rgrad(ctx, px + Math.cos(a) * R * 0.6, py + Math.sin(a) * R * 0.6, 4, R * 0.9, [[0, FAN.paper], [0.7, lighter(FAN.paperD, 0.2)], [1, FAN.paperD]], px + Math.cos(a) * R * 0.5, py + Math.sin(a) * R * 0.5); ctx.fill();
  ctx.save(); sector(R); ctx.clip();
  // painted peonies and leaves, placed along the fan's radial grid so they fold with it
  if (sp > 0.25) for (let k = 0; k < 5; k++) {
    const rr = R * (0.38 + 0.5 * hash(seed + k * 3.1)), aa = a + (hash(seed + k * 7.7) - 0.5) * 2 * half * 0.8, fx = px + Math.cos(aa) * rr, fy = py + Math.sin(aa) * rr, s = R * (0.1 + 0.07 * hash(seed + k));
    ctx.fillStyle = FAN.leaf; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(fx + d * s * 1.5, fy + s * 0.5, s * 1.4, s * 0.55, d * 0.6 + aa, 0, TAU); ctx.fill(); }
    for (let p = 0; p < 7; p++) { const b = p / 7 * TAU + k; ctx.fillStyle = p % 2 ? FAN.peony : lighter(FAN.peony, 0.2); ctx.beginPath(); ctx.ellipse(fx + Math.cos(b) * s * 0.55, fy + Math.sin(b) * s * 0.55, s * 0.62, s * 0.4, b, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#f4c850'; circ(ctx, fx, fy, s * 0.22); ctx.fill();
  }
  // ribs: fine lines for the folds, shaded alternately
  for (let k = 0; k <= n; k++) { const ang = lerp(a0, a1, k / n); ctx.strokeStyle = k % 2 ? 'rgba(110,50,60,0.16)' : 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px + Math.cos(ang) * r0, py + Math.sin(ang) * r0); ctx.lineTo(px + Math.cos(ang) * R, py + Math.sin(ang) * R); ctx.stroke(); }
  ctx.restore();
  // a red band along the outer edge and bamboo ribs at both edges with brass pivot
  ctx.strokeStyle = FAN.rim; ctx.lineWidth = R * 0.05; ctx.beginPath(); ctx.arc(px, py, R * 0.975, a0, a1); ctx.stroke();
  ctx.strokeStyle = FAN.rib; ctx.lineWidth = 7; for (const ang of [a0, a1]) { ctx.beginPath(); ctx.moveTo(px + Math.cos(ang) * r0 * 0.6, py + Math.sin(ang) * r0 * 0.6); ctx.lineTo(px + Math.cos(ang) * (R + 6), py + Math.sin(ang) * (R + 6)); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, R * 0.7, a0 + 0.05, a1 - 0.05); ctx.stroke();
  ctx.fillStyle = rgrad(ctx, px - 3, py - 3, 0, 14, [[0, '#fff3b0'], [1, '#a07818']]); circ(ctx, px, py, 11); ctx.fill();
  // tassel
  const sway = Math.sin(t * 3 + seed) * 0.12; ctx.strokeStyle = '#c0283c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(px, py + 10); ctx.quadraticCurveTo(px + Math.sin(sway) * 30, py + 40, px + Math.sin(sway) * 44, py + 70); ctx.stroke();
  ctx.fillStyle = '#e8c25a'; circ(ctx, px + Math.sin(sway) * 44, py + 72, 7); ctx.fill();
  ctx.restore();
}

function dancer(ctx, P, t, key, v, sway) {
  const lt = { hip: P.hip };
  void lt;
  const fig = {
    skin: HB.skin,
    legs: { upper: HB.skirt, lower: '#f6f2ea', w: [70, 64, 56, 46, 38], sep: 36, shoe: { col: '#fbf7ee', sole: '#bcb6a8', s: 0.8, turn: 0.9 } },
    skirt: { col: HB.skirt, top: P.hip[1] - 126, hem: P.hip[1] + 314, w0: 74, w1: 228, sway, dip: 30, trim: HB.skirtD,
      pattern: (c, W, top, hem) => { c.strokeStyle = 'rgba(8,40,56,0.35)'; c.lineWidth = 3; for (let q = -9; q <= 9; q++) { c.beginPath(); c.moveTo(q * 8, top); c.quadraticCurveTo(q * 20 + sway * q * 0.1, (top + hem) / 2, q * 26, hem); c.stroke(); } c.fillStyle = 'rgba(255,255,255,0.1)'; c.beginPath(); c.ellipse(-70, hem - 70, 90, 28, 0.1, 0, TAU); c.fill(); } },
    torso: { col: HB.jacket, col2: HB.jacketD, sh: 80, ch: 64, wa: 56, hi: 62, top: 198, bot: -122,
      detail: (c, g) => {
        c.fillStyle = HB.collar; c.beginPath(); c.moveTo(-44, g.sy - 10); c.lineTo(0, g.sy + 62); c.lineTo(44, g.sy - 10); c.lineTo(32, g.sy - 14); c.lineTo(0, g.sy + 34); c.lineTo(-32, g.sy - 14); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(184,96,124,0.8)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-34, g.sy - 6); c.lineTo(0, g.sy + 52); c.lineTo(34, g.sy - 6); c.stroke();
        c.fillStyle = HB.skin; c.beginPath(); c.moveTo(-22, g.sy - 14); c.lineTo(0, g.sy + 22); c.lineTo(22, g.sy - 14); c.closePath(); c.fill();
      } },
    arm: { col: HB.jacket, w: [70, 78, 58], ua: 130, fa: 122, cuff: '#fbf3e6', cap: null, joint: false, hand: 70, fold: 1,
      pref: (sx, sh, hd) => [sh[0] + sx * 140, Math.max(sh[1] + 70, (sh[1] + hd[1]) / 2 + 40)] },
    head: { rx: 46, ry: 57, jaw: 0.1, turn: 0.2, neck: 36,
      hairBack: (c) => { c.fillStyle = HB.hair; ell(c, 0, -4, 50, 56); c.fill(); },
      hairFront: (c) => { c.fillStyle = HB.hair; c.beginPath(); c.moveTo(-52, 6); c.bezierCurveTo(-56, -50, -24, -62, 0, -60); c.bezierCurveTo(24, -62, 56, -50, 52, 6); c.bezierCurveTo(46, -22, 22, -34, 0, -34); c.bezierCurveTo(-22, -34, -46, -22, -52, 6); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(214,176,160,0.4)'; c.lineWidth = 1.6; for (let q = -5; q <= 5; q++) { c.beginPath(); c.moveTo(q * 4, -34); c.quadraticCurveTo(q * 9, -48, q * 10, -60); c.stroke(); }
        c.strokeStyle = HB.gold; c.lineWidth = 5; c.beginPath(); c.moveTo(-40, -50); c.lineTo(40, -50); c.stroke(); c.fillStyle = '#d8365a'; circ(c, 40, -50, 7); c.fill(); circ(c, -40, -50, 7); c.fill(); } },
    // the goreum: two long ribbons knotted at the chest, falling over the skirt
    afterTorso: (c, g) => {
      const sy = g.sy + 56; c.fillStyle = HB.ribbon; for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * 4, sy); c.quadraticCurveTo(d * (24 + sway * 0.6), sy + 120, d * (34 + sway), sy + 250); c.lineTo(d * (50 + sway), sy + 246); c.quadraticCurveTo(d * 36, sy + 120, d * 14, sy + 8); c.closePath(); c.fill(); }
      c.beginPath(); c.moveTo(0, sy - 6); c.quadraticCurveTo(-36, sy - 16, -34, sy + 10); c.quadraticCurveTo(-10, sy + 6, 0, sy - 2); c.quadraticCurveTo(10, sy + 6, 34, sy + 10); c.quadraticCurveTo(36, sy - 16, 0, sy - 6); c.fill(); circ(c, 0, sy, 8); c.fill();
    },
  };
  return fig;
}

function stageBack(ctx, A, t, hz) {
  const X0 = A.x0, X1 = A.x1, W = X1 - X0, Y0 = A.y0, H = A.y1, cx = (X0 + X1) / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0, W, H - Y0); ctx.clip();
  ctx.fillStyle = vgrad(ctx, Y0, hz, [[0, '#0a0d26'], [1, '#1a2352']]); ctx.fillRect(X0, Y0, W, hz - Y0);
  // the folding screen: panels of deep blue silk, gold frame, painted peonies and pine
  const sx0 = X0 + W * 0.04, sx1 = X1 - W * 0.04, sy0 = Y0 + (hz - Y0) * 0.1, sy1 = hz - 6, n = W > 900 ? 8 : 6, pw = (sx1 - sx0) / n;
  for (let k = 0; k < n; k++) {
    const x = sx0 + k * pw;
    ctx.fillStyle = k % 2 ? '#1a3f66' : '#1f4a78'; ctx.fillRect(x, sy0, pw, sy1 - sy0);
    ctx.save(); ctx.beginPath(); ctx.rect(x, sy0, pw, sy1 - sy0); ctx.clip();
    for (let q = 0; q < 3; q++) { const fx = x + pw * (0.3 + 0.4 * hash(k * 5 + q)), fy = sy0 + (sy1 - sy0) * (0.25 + 0.25 * q + 0.1 * hash(k + q * 3)), s = Math.min(pw * (0.2 + 0.08 * hash(k * 2 + q)), (sy1 - sy0) * 0.07);
      ctx.strokeStyle = 'rgba(232,194,90,0.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx, fy + s * 2); ctx.quadraticCurveTo(fx + pw * 0.2, fy + s * 3, fx + pw * 0.1 * (k % 2 ? 1 : -1), sy1); ctx.stroke();
      ctx.fillStyle = 'rgba(70,150,100,0.8)'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(fx + d * s * 1.3, fy + s * 1.2, s * 1.3, s * 0.5, d * 0.5, 0, TAU); ctx.fill(); }
      for (let p = 0; p < 8; p++) { const b = p / 8 * TAU; ctx.fillStyle = p % 2 ? 'rgba(255,214,226,0.92)' : 'rgba(250,170,196,0.92)'; ctx.beginPath(); ctx.ellipse(fx + Math.cos(b) * s * 0.6, fy + Math.sin(b) * s * 0.6, s * 0.7, s * 0.45, b, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#f4c850'; circ(ctx, fx, fy, s * 0.22); ctx.fill(); }
    ctx.fillStyle = hgrad(ctx, x, x + pw, [[0, 'rgba(0,0,0,0.38)'], [0.12, 'rgba(0,0,0,0)'], [0.88, 'rgba(255,255,255,0.04)'], [1, 'rgba(0,0,0,0.42)']]); ctx.fillRect(x, sy0, pw, sy1 - sy0);
    ctx.restore();
    ctx.strokeStyle = '#d8b050'; ctx.lineWidth = 4; ctx.strokeRect(x, sy0, pw, sy1 - sy0);
  }
  ctx.strokeStyle = '#a07820'; ctx.lineWidth = 8; ctx.strokeRect(sx0, sy0, sx1 - sx0, sy1 - sy0);
  // curtain valance with pleats and gold fringe
  ctx.fillStyle = vgrad(ctx, Y0, Y0 + 56, [[0, '#4a0c1c'], [1, '#2a0610']]); ctx.fillRect(X0, Y0, W, 44);
  for (let x = X0; x < X1; x += 36) { ctx.fillStyle = 'rgba(190,40,70,0.28)'; ctx.fillRect(x, Y0, 10, 44); ctx.fillStyle = '#e8c25a'; ctx.fillRect(x + 4, Y0 + 44, 3, 8); }
  // polished floor with a long sheen and a pool of light
  ctx.fillStyle = vgrad(ctx, hz, H, [[0, '#2a1618'], [1, '#4c2a28']]); ctx.fillRect(X0, hz, W, H - hz);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2; for (let y = hz + 10; y < H; y += 22 + (y - hz) * 0.12) { ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(X1, y); ctx.stroke(); }
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(X0, hz, W, 6);
  ctx.fillStyle = rgrad(ctx, cx, hz + (H - hz) * 0.42, 6, W * 0.46, [[0, 'rgba(255,226,170,0.42)'], [0.5, 'rgba(255,190,140,0.12)'], [1, 'rgba(255,190,140,0)']]); ctx.fillRect(X0, hz, W, H - hz);
  const cone = ctx.createLinearGradient(0, Y0, 0, hz + 80); cone.addColorStop(0, 'rgba(255,240,210,0.16)'); cone.addColorStop(1, 'rgba(255,240,210,0)');
  ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(cx - 40, Y0); ctx.lineTo(cx + 40, Y0); ctx.lineTo(cx + W * 0.28, hz + 90); ctx.lineTo(cx - W * 0.28, hz + 90); ctx.closePath(); ctx.fill();
  void t;
  ctx.restore();
}

const ZONES = [['open', /open|spread|wide/], ['sweep', /sweep|wave|swing/], ['bloom', /bloom|flower|petal/], ['close', /close|shut|fold/]];
registerDanceStage({
  id: 'fan-hero', match: /(buchae|fan).*dancer|dancer.*fan|fan dancer/,
  build: (S, lanes, P) => createSceneStage('fan-hero', S, lanes, P, {
    tallRatio: 0.85,
    dress: () => ({ kind: 'planks', base: '#2a1618', light: '#ffe0b0' }),
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 960 } : { w: 1180, h: 600 };
      const keyOf = assignZones(K, ZONES.map(([key, re]) => ({ key, re }))); const spots = new Array(K.N).fill(null);
      const k = tall ? 0.8 : 0.66, fy = tall ? 70 : 34, hz = tall ? 560 : 340, PR = tall ? 58 : 62;
      const by = tall ? { open: [-300, 886], sweep: [-100, 886], bloom: [100, 886], close: [300, 886] } : { open: [-470, 150], sweep: [-470, 420], bloom: [470, 150], close: [470, 420] };
      for (let i = 0; i < K.N; i++) { const p = by[keyOf[i]]; if (p) spots[i] = eSpot(p[0], p[1], PR, PR, 0, { apk: 1, extra: { noFill: true } }); }
      const st = {};
      return { ref, spots,
        draw(ctx, rt, g) {
          const t = rt.anim; stageBack(ctx, areaInDesign(ctx, g.F, ref), t, hz);
          const env = envOf(rt, K, keyOf), [key, v] = dominant(env), side = flipSide(st, 'sweep', env.sweep ?? 0);
          const bob = key ? 0 : 4 * Math.sin(t * 2.4), P0 = pose(key, v, side), sway = Math.sin(t * 3.2) * 3 + (key ? 10 * v : 0);
          ctx.save(); ctx.translate(0, fy); ctx.scale(k, k);
          groundPool(ctx, 6, 764, 250, 26, 0.42);
          const Pp = { ...P0, hip: [P0.hip[0], P0.hip[1] + bob] };
          const fig = dancer(ctx, Pp, t, key, v, sway);
          fig.armBack = null;
          const shown = []; fig.hand = (c, sx, end, ang, tt) => { shown.push([sx, end, ang, tt]); };
          drawFigure(ctx, Pp, fig, t);
          // the fans are drawn over the hands: the pivot a little beyond the grip, the opening and the direction from the pose
          for (const [sx, end, ang] of shown) {
            const fa = sx < 0 ? Pp.fa[0] : Pp.fa[1], a = Number.isFinite(fa) ? fa : ang, px = end.hx + Math.cos(ang) * 4, py = end.hy + Math.sin(ang) * 4;
            fan(ctx, px, py, a, Pp.sp, tall ? 214 : 226, sx * 3.1 + 1, t);
          }
          ctx.restore();
          lanes.forEach((l, i) => { if (spots[i]) pad(ctx, l, spots[i], rt.flash[i], laneIcon(l)); });
        } };
    },
  }),
});
void rgba; void ease; void darker; void rrect; void glow;

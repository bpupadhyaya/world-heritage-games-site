// Dance stage v2 (1.24.0): one costumed hero figure, seen from the front, on a dressed set. The figure is the play surface: each lane is a movement of the
// dance, the figure rises into that movement as the ring closes and holds it through the strike (envelope = anticipation + the lane flash), the rings stand
// beside or below the figure with a pad per movement. No bust and no mask: a whole person, drawn with two-bone IK from figure-hero.js.
// Routes (instrument contains "dancer"): hopak, gumboot, sword, tinikling, kathak. The older stages in stage-dance-folk.js / -solo.js / -line.js are untouched.
import { registerDanceStage } from './registry.js';
import { createSceneStage, eSpot, assignZones } from './dance-kit.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, circ, ell, hash, TAU } from './dance-kit.js';
import { glow } from './art.js';
import { areaInDesign } from './dance-kit.js';
import { pad, laneIcon } from './dance-pad.js';
import { envOf, dominant, flipSide, mixPose } from './hero-common.js';
import { ik2, ribbon, taper, headFront, footFront, handFront, groundPool, stitchBand, lerp, lerp2, ease } from './figure-hero.js';

// ================================================================================================================================================
// HOPAK: a Cossack dancer in a white embroidered shirt, a red sash, wide red trousers tucked into black boots and a tall black fur cap with a red top.
// ================================================================================================================================================
const HOP = { skin: '#d9a77c', shirt: '#f6f0e2', red: '#b8221e', sash: '#c0261f', boot: '#17110d', fur: '#1a1512', top: '#b8201c', stitch: '#b8201c', stitch2: '#1c1c22' };
const HIP = [0, 430], SH = 106, SHY = 208, UA = 150, FA = 140, TH = 165, SK = 150;
const HOP_IDLE = { hip: [0, 410], lean: 0, hl: [-96, 372], hr: [96, 372], fl: [-74, 742], fr: [74, 742], lu: 0, ru: 0, tilt: 0, jump: 0 };

function hopakPose(key, v, side) {
  const I = HOP_IDLE;
  if (!key) return I;
  let T;
  if (key === 'left' || key === 'right') {
    const s = key === 'left' ? -1 : 1;
    // a stamping step: the lifted leg rises with the knee out, the free arm swings wide, the other hand on the hip, the body leans a little over the standing leg
    T = { ...I, hip: [-s * 20, 418], lean: -s * 0.05, tilt: s * 0.06, fl: [s < 0 ? -150 : -74, s < 0 ? 636 : 742], fr: [s > 0 ? 150 : 74, s > 0 ? 636 : 742],
      hl: s < 0 ? [-262, 292] : [-96, 388], hr: s > 0 ? [262, 292] : [96, 388], lu: s < 0 ? 1 : 0, ru: s > 0 ? 1 : 0 };
  } else if (key === 'kick') {
    // the squat kick (prysiadka): deep on one leg, the other thrown out along the floor, arms folded on the chest, the back straight
    const s = side;
    T = { ...I, hip: [-s * 70, 610], lean: s * 0.07, tilt: s * 0.04, fl: [-176, 742], fr: [176, 742], hl: [58, 318], hr: [-58, 330], jump: 0 };
    if (s > 0) { T.fl = [-440, 742]; T.fr = [150, 742]; } else { T.fl = [-150, 742]; T.fr = [440, 742]; }
  } else {
    // the leap with a clap: the body in the air, knees out, feet apart, hands meeting above the head
    T = { ...I, hip: [0, 336], lean: 0, tilt: 0, fl: [-186, 640], fr: [186, 640], hl: [-16, 262], hr: [16, 262], jump: 1 };
  }
  return mixPose(I, T, v);
}

// legs (wide trousers into boots), then torso, sash, arms, head
function hopakFigure(ctx, P, t, key, v) {
  const hx = P.hip[0], hy = P.hip[1];
  const jump = (HOP_IDLE.hip[1] - hy > 40 && !key) ? 0 : 0;
  void jump;
  const air = key === 'clap' ? v : 0;
  // ground shadow stays on the floor while the body rises
  groundPool(ctx, 8, 772, 230 - 40 * air, 30 - 6 * air, 0.45 - 0.15 * air);
  ctx.fillStyle = darker(HOP.red, 0.15); ell(ctx, hx, hy + 6, 112, 52); ctx.fill();
  const legs = [[-1, P.fl], [1, P.fr]];
  for (const [sx, ft] of legs) {
    const ax = hx + sx * 52, ay = hy;
    const r = ik2(ax, ay, ft[0], ft[1] - 22, TH + 8, SK + 6, [ax + sx * 160, (ay + ft[1]) / 2 + 10]);
    const kn = r.mid, an = r.end;
    const bt = [lerp(kn[0], an[0], 0.5), lerp(kn[1], an[1], 0.5)];
    const mid = [(ax + kn[0]) / 2 + sx * 18, (ay + kn[1]) / 2];
    ribbon(ctx, [[ax, ay + 6], mid, kn, bt], [136, 150, 138, 104], HOP.red, { fold: 3 });
    ctx.fillStyle = darker(HOP.red, 0.35); ell(ctx, bt[0], bt[1] + 4, 56, 15); ctx.fill();
    ctx.fillStyle = HOP.red; ell(ctx, bt[0], bt[1] - 1, 54, 13); ctx.fill();
    taper(ctx, bt[0], bt[1], an[0], an[1], 64, 52, HOP.boot, { rim: 0.2, shadow: false });
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bt[0] - 10, bt[1] + 16); ctx.lineTo(an[0] - 8, an[1] - 6); ctx.stroke();
    footFront(ctx, an[0], an[1] - 2, { col: HOP.boot, turn: sx * 0.6, lift: clamp((742 - ft[1]) / 100, 0, 1) });
  }
  // torso: embroidered linen shirt, wide at the shoulder, gathered into the sash
  ctx.save(); ctx.translate(hx, 0);
  const lean = P.lean, ty = hy - 36;
  ctx.translate(0, ty); ctx.rotate(lean); ctx.translate(0, -ty);
  const sy = SHY + (hy - 430) * 0.92;
  ctx.beginPath(); ctx.moveTo(-SH, sy); ctx.bezierCurveTo(-SH * 0.5, sy - 22, SH * 0.5, sy - 22, SH, sy); ctx.bezierCurveTo(SH + 6, sy + 90, 90, ty - 60, 86, ty + 2); ctx.lineTo(-86, ty + 2); ctx.bezierCurveTo(-90, ty - 60, -SH - 6, sy + 90, -SH, sy); ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.save(); ctx.translate(9, 10); ctx.fill(); ctx.restore();
  ctx.fillStyle = hgrad(ctx, -SH, SH, [[0, '#bfb7a2'], [0.28, '#fffaee'], [0.62, HOP.shirt], [1, '#b0a68e']]); ctx.fill();
  ctx.strokeStyle = 'rgba(110,92,64,0.5)'; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.save(); ctx.clip();
  ctx.strokeStyle = 'rgba(120,100,70,0.25)'; ctx.lineWidth = 2; for (let k = -4; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(k * 26, sy + 20); ctx.quadraticCurveTo(k * 30 + 4, (sy + ty) / 2, k * 24, ty); ctx.stroke(); }
  // the placket and collar embroidery, red and black cross-stitch
  stitchBand(ctx, 0, sy + 6, 0, sy + 120 + (hy - 430) * 0.2, 26, HOP.stitch, HOP.stitch2, '#f4ecd8');
  for (const d of [-1, 1]) stitchBand(ctx, d * 52, sy + 20, d * 74, sy + 130, 14, HOP.stitch, HOP.stitch2);
  ctx.restore();
  // stand collar
  ctx.fillStyle = '#f2ead8'; rrect(ctx, -40, sy - 22, 80, 22, 8); ctx.fill(); stitchBand(ctx, -34, sy - 11, 34, sy - 11, 12, HOP.stitch, HOP.stitch2);
  // sash: broad red cloth with gold ends, a knot on the left hip and two tails
  const sw = 40;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, -100, ty - sw + 12, 200, sw + 8, 10); ctx.fill();
  ctx.fillStyle = hgrad(ctx, -100, 100, [[0, darker(HOP.sash, 0.35)], [0.3, lighter(HOP.sash, 0.2)], [0.7, HOP.sash], [1, darker(HOP.sash, 0.4)]]); rrect(ctx, -100, ty - sw + 6, 200, sw + 6, 10); ctx.fill();
  ctx.strokeStyle = '#e8c04a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-98, ty - sw + 14); ctx.lineTo(98, ty - sw + 14); ctx.moveTo(-98, ty + 2); ctx.lineTo(98, ty + 2); ctx.stroke();
  const sw1 = Math.sin(t * 3.2) * 6 + (hy - 430) * 0.0;
  for (const [dx, ln] of [[-72, 100], [-50, 124]]) { ctx.fillStyle = hgrad(ctx, dx - 14, dx + 14, [[0, darker(HOP.sash, 0.3)], [0.5, lighter(HOP.sash, 0.15)], [1, darker(HOP.sash, 0.35)]]); ctx.beginPath(); ctx.moveTo(dx - 14, ty - 4); ctx.lineTo(dx + 14, ty - 4); ctx.lineTo(dx + 16 + sw1, ty + ln); ctx.lineTo(dx - 12 + sw1, ty + ln); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#e8c04a'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(dx - 12 + sw1, ty + ln - 5); ctx.lineTo(dx + 16 + sw1, ty + ln - 5); ctx.stroke(); }
  ctx.fillStyle = rgrad(ctx, -64, ty - 12, 2, 24, [[0, lighter(HOP.sash, 0.3)], [1, darker(HOP.sash, 0.3)]]); ell(ctx, -62, ty - 14, 22, 18); ctx.fill();
  // arms: full white sleeves gathered into embroidered cuffs
  for (const sx of [-1, 1]) {
    const sh = [sx * (SH - 10), sy + 10], hd = sx < 0 ? P.hl : P.hr;
    const rr = ik2(sh[0], sh[1], hd[0], hd[1], UA, FA, [sx * 230, Math.max(sh[1] + 90, (sh[1] + hd[1]) / 2 + 60)]);
    ribbon(ctx, [sh, [(sh[0] + rr.mid[0]) / 2, (sh[1] + rr.mid[1]) / 2 + 4], rr.mid, [(rr.mid[0] + rr.end[0]) / 2, (rr.mid[1] + rr.end[1]) / 2], rr.end], [74, 80, 78, 70, 46], HOP.shirt, { rim: 0.2, fold: 2 });
    const ang = Math.atan2(rr.end[1] - rr.mid[1], rr.end[0] - rr.mid[0]);
    ctx.save(); ctx.translate(rr.end[0], rr.end[1]); ctx.rotate(ang); stitchBand(ctx, -6, -24, -6, 24, 12, HOP.stitch, HOP.stitch2, '#f4ecd8'); ctx.restore();
    handFront(ctx, rr.end[0] + Math.cos(ang) * 26, rr.end[1] + Math.sin(ang) * 26, ang, 70, { skin: HOP.skin, open: 0.15 + 0.3 * (v > 0.5 && key === 'clap' ? 0.4 : 0), curl: 0.25, side: sx });
  }
  ctx.restore();
  // neck and head with the big fur cap and drooping moustache
  const nx = hx + P.lean * 20, ny = (hy - 430) * 0.92;
  ctx.save(); ctx.translate(nx, ny); ctx.rotate(P.tilt + P.lean * 0.4);
  ctx.fillStyle = rgrad(ctx, 0, 176, 0, 60, [[0, lighter(HOP.skin, 0.1)], [1, darker(HOP.skin, 0.35)]]); rrect(ctx, -26, 130, 52, 74, 14); ctx.fill();
  headFront(ctx, 0, 92, 50, 60, {
    skin: HOP.skin, turn: 0.1, jaw: 0.5,
    hairBack: (c) => { c.fillStyle = '#3a2418'; ell(c, 0, 12, 56, 64); c.fill(); },
    hairFront: (c) => {
      // moustache: two long drooping tails
      c.fillStyle = '#2a1a10';
      for (const d of [-1, 1]) { c.beginPath(); c.moveTo(0, 28); c.bezierCurveTo(d * 10, 18, d * 34, 20, d * 40, 34); c.bezierCurveTo(d * 44, 52, d * 40, 66, d * 32, 74); c.bezierCurveTo(d * 36, 56, d * 24, 40, 0, 36); c.closePath(); c.fill(); }
      c.strokeStyle = 'rgba(200,160,110,0.35)'; c.lineWidth = 1.4; for (const d of [-1, 1]) for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(d * 6, 26 + k); c.quadraticCurveTo(d * (22 + k * 3), 28 + k * 3, d * (34 + k), 56 + k * 4); c.stroke(); }
      // the tall fur cap: a dark fur band over the brow, a cloth top that falls to one side with a gold cross-stitch
      c.save();
      const top = -86;
      c.fillStyle = 'rgba(0,0,0,0.3)'; ell(c, 6, -34, 70, 30); c.fill();
      c.fillStyle = hgrad(c, -66, 66, [[0, '#0a0806'], [0.3, '#3a302a'], [0.7, HOP.fur], [1, '#0a0806']]);
      c.beginPath(); c.moveTo(-64, -26); c.bezierCurveTo(-72, -78, -50, top - 22, 0, top - 24); c.bezierCurveTo(50, top - 22, 72, -78, 64, -26); c.bezierCurveTo(52, -10, 30, -22, 0, -20); c.bezierCurveTo(-30, -22, -52, -10, -64, -26); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,240,220,0.18)'; c.lineWidth = 1.5; for (let k = 0; k < 40; k++) { const a = hash(k * 3.3) * 3 - 0.2, rx = (hash(k) - 0.5) * 120, ry = -30 - hash(k * 7) * 52; c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + 5 * Math.cos(a), ry - 8); c.stroke(); }
      c.fillStyle = hgrad(c, -40, 60, [[0, darker(HOP.top, 0.3)], [0.5, lighter(HOP.top, 0.15)], [1, darker(HOP.top, 0.3)]]);
      c.beginPath(); c.moveTo(-34, top - 18); c.bezierCurveTo(-10, top - 36, 40, top - 30, 74, top + 12); c.bezierCurveTo(74, top + 40, 56, top + 54, 44, top + 40); c.bezierCurveTo(30, top + 8, 0, top - 4, -34, top - 8); c.closePath(); c.fill();
      c.strokeStyle = '#e8c04a'; c.lineWidth = 3; c.beginPath(); c.moveTo(-22, top - 14); c.bezierCurveTo(8, top - 24, 46, top - 14, 68, top + 14); c.stroke();
      c.restore();
    },
  });
  ctx.restore();
}

const HOP_ZONES = [['clap', /clap|palm|leap|jump/], ['left', /left|izq/], ['right', /right|der/], ['kick', /kick|stomp|squat|stamp/]];

function hopYard(ctx, ref, t, tall, hz, A) {
  const X0 = A.x0, X1 = A.x1, W = X1 - X0, Y0 = A.y0, H = A.y1, cx = (X0 + X1) / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0, W, H - Y0); ctx.clip();
  // whitewashed wall with a blue painted dado, a window with a hand-towel and a thatch eave
  ctx.fillStyle = vgrad(ctx, Y0, hz, [[0, '#d8cdb4'], [1, '#efe6d0']]); ctx.fillRect(X0, Y0, W, hz - Y0);
  for (let k = 0; k < 90; k++) { const x = X0 + hash(k * 2.1) * W, y = Y0 + hash(k * 5.3 + 1) * (hz - Y0); ctx.fillStyle = `rgba(130,110,80,${0.04 + 0.06 * hash(k + 3)})`; ell(ctx, x, y, 8 + 20 * hash(k), 3 + 5 * hash(k + 4)); ctx.fill(); }
  ctx.fillStyle = vgrad(ctx, Y0, Y0 + 70, [[0, '#8a6a34'], [1, '#c8a45a']]); ctx.fillRect(X0, Y0, W, 64);
  ctx.strokeStyle = 'rgba(70,48,18,0.5)'; ctx.lineWidth = 2; for (let x = X0; x < W / 2; x += 9) { ctx.beginPath(); ctx.moveTo(x, Y0); ctx.lineTo(x + 3, Y0 + 62); ctx.stroke(); }
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(X0, Y0 + 62, W, 10);
  const dy = hz - 72; ctx.fillStyle = '#2f58a8'; ctx.fillRect(X0, dy, W, 72); ctx.fillStyle = '#1f3f82'; ctx.fillRect(X0, dy, W, 6);
  for (let x = X0 + 30; x < W / 2; x += 70) { ctx.strokeStyle = '#f4ecd8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, dy + 56); ctx.quadraticCurveTo(x + 10, dy + 14, x + 35, dy + 40); ctx.stroke(); ctx.fillStyle = '#e8b84a'; circ(ctx, x + 35, dy + 40, 6); ctx.fill(); ctx.fillStyle = '#c0261f'; circ(ctx, x + 10, dy + 22, 4); ctx.fill(); }
  const wy = Math.max(Y0 + 100, 104) - 0; for (const wx of tall ? [-250, 250] : [-270, 270]) {
    ctx.fillStyle = '#1c1a22'; rrect(ctx, wx - 54, wy, 108, 120, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,214,140,0.45)'; rrect(ctx, wx - 46, wy + 8, 92, 104, 4); ctx.fill();
    ctx.strokeStyle = '#2f58a8'; ctx.lineWidth = 7; ctx.strokeRect(wx - 54, wy, 108, 120); ctx.fillStyle = '#2f58a8'; ctx.fillRect(wx - 3, wy, 6, 120); ctx.fillRect(wx - 54, wy + 56, 108, 6);
    ctx.fillStyle = '#2f58a8'; ctx.fillRect(wx - 90, wy - 4, 30, 128); ctx.fillRect(wx + 60, wy - 4, 30, 128);
    ctx.fillStyle = '#f4ecd8'; ctx.fillRect(wx - 46, wy + 8, 22, 90); stitchBand(ctx, wx - 35, wy + 14, wx - 35, wy + 94, 10, '#b8201c', '#1c1c22');
  }
  // sunflowers along the foot of the wall
  const n = Math.floor(W / 120) + 1;
  for (let k = 0; k < n; k++) { const x = X0 + 70 + k * 120 + (k % 2) * 16, y = hz - 6 + (k % 3) * 6, r = 36 + (k % 3) * 6, sw = Math.sin(t * 1.3 + k) * 3;
    ctx.strokeStyle = '#2f5a24'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x, y + 60); ctx.quadraticCurveTo(x + sw, y + 20, x + sw, y - r * 0.2); ctx.stroke();
    ctx.fillStyle = '#3f7a30'; ell(ctx, x + 20, y + 36, 22, 9); ctx.fill();
    for (let q = 0; q < 16; q++) { const a = q / 16 * TAU; ctx.fillStyle = q % 2 ? '#f2b41c' : '#e89a10'; ctx.beginPath(); ctx.ellipse(x + sw + Math.cos(a) * r * 0.82, y - r * 0.2 + Math.sin(a) * r * 0.82, r * 0.34, r * 0.15, a, 0, TAU); ctx.fill(); }
    ctx.fillStyle = rgrad(ctx, x + sw - 4, y - r * 0.2 - 4, 2, r * 0.6, [[0, '#6a4220'], [1, '#2a1608']]); circ(ctx, x + sw, y - r * 0.2, r * 0.52); ctx.fill(); }
  // trodden earth, straw, a warm pool of light
  ctx.fillStyle = vgrad(ctx, hz, H, [[0, '#6a5030'], [1, '#8a6a3c']]); ctx.fillRect(X0, hz, W, H - hz);
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(X0, hz, W, 5);
  for (let k = 0; k < 90; k++) { const x = X0 + hash(k * 2.7) * W, y = hz + 12 + hash(k * 5.1 + 3) * (H - hz - 12), a = hash(k + 1) * TAU; ctx.strokeStyle = `rgba(232,200,120,${0.18 + 0.3 * hash(k + 6)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 18, y + Math.sin(a) * 6); ctx.stroke(); }
  ctx.fillStyle = rgrad(ctx, cx, hz + (H - hz) * 0.45, 10, W * 0.5, [[0, 'rgba(255,226,160,0.28)'], [1, 'rgba(255,226,160,0)']]); ctx.fillRect(X0, hz, W, H - hz);
  ctx.restore();
}

registerDanceStage({
  id: 'hopak-hero', match: /hopak.*dancer|dancer.*hopak/,
  build: (S, lanes, P) => createSceneStage('hopak-hero', S, lanes, P, {
    tallRatio: 0.85,
    dress: () => ({ kind: 'earth', base: '#8a6a3a', light: '#fff0c8' }),
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 960 } : { w: 1180, h: 600 };
      const keyOf = assignZones(K, HOP_ZONES.map(([key, re]) => ({ key, re }))); const spots = new Array(K.N).fill(null);
      const PR = tall ? 68 : 66, k = tall ? 0.96 : 0.74, fy = tall ? 60 : 36, hz = tall ? 560 : 330;
      const by = tall ? { left: [-270, 886], kick: [-90, 886], clap: [90, 886], right: [270, 886] } : { left: [-470, 170], kick: [-470, 410], right: [470, 170], clap: [470, 410] };
      for (let i = 0; i < K.N; i++) { const p = by[keyOf[i]]; if (p) spots[i] = eSpot(p[0], p[1], PR, PR, 0, { apk: 1, extra: { noFill: true } }); }
      const st = {};
      return { ref, spots,
        draw(ctx, rt, g) {
          const t = rt.anim; hopYard(ctx, ref, t, tall, hz, areaInDesign(ctx, g.F, ref));
          const env = envOf(rt, K, keyOf), [key, v] = dominant(env);
          const side = key ? flipSide(st, key, env[key]) : 1;
          const pose = hopakPose(key, v, side), bob = 5 * Math.sin(t * 6.3) * (key ? 0.3 : 1);
          ctx.save(); ctx.translate(0, fy); ctx.scale(k, k);
          const P2 = { ...pose, hip: [pose.hip[0], pose.hip[1] + (key ? 0 : bob)] };
          hopakFigure(ctx, P2, t, key, v);
          ctx.restore();
          lanes.forEach((l, i) => { if (spots[i]) pad(ctx, l, spots[i], rt.flash[i], laneIcon(l)); });
        } };
    },
  }),
});

void mix; void rgba; void glow; void vgrad;

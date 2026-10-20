// Frevo umbrella dance, hero stage (1.25.0): a carnival dancer in a bright striped shirt, blue shorts and white shoes with a small many-coloured umbrella. Lanes: Twirl
// (the umbrella thrown up and spun overhead), Kick (one leg flung out in the scissor step, the umbrella held out the other way), Crouch (the low sitting step with the legs
// wide), Leap (both feet off the ground, the umbrella high). The umbrella is the second hero: eight gores, a bright rim, a shaft and a crook, spinning with a speed that
// follows the movement. A street of pastel hillside houses with bunting and drifting confetti, seen at the end of the afternoon.
import { registerDanceStage } from './registry.js';
import { createSceneStage, eSpot, assignZones, areaInDesign } from './dance-kit.js';
import { clamp, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, circ, ell, hash, TAU } from './dance-kit.js';
import { glow } from './art.js';
import { pad, laneIcon } from './dance-pad.js';
import { envOf, dominant, mixPose, flipSide } from './hero-common.js';
import { groundPool, ease } from './figure-hero.js';
import { drawFigure } from './figure-hero2.js';

const FV = { skin: '#a9683f', shirt: '#f7c52a', stripeR: '#e23a2e', stripeG: '#2aa05a', short: '#2c6fe0', shortD: '#173f94', shoe: '#fbfaf5', hair: '#1a100c' };
const GORE = ['#e8352f', '#f7c52a', '#2aa05a', '#2c6fe0', '#f08a2a', '#d83aa0', '#1fb5c9', '#f4f0e6'];
const IDLE = { hip: [0, 432], fl: [-62, 742], fr: [62, 742], hl: [-150, 440], hr: [150, 330], lean: 0, tilt: 0, um: [150, 330], ua: -1.2, spin: 1 };

function pose(key, v, side, tallG) {
  let T = IDLE;
  if (key === 'twirl') T = { ...IDLE, hip: [0, 424], hr: [196, tallG ? 130 : 175], hl: [-196, 250], fl: [-70, 742], fr: [70, 742], ua: -1.2, spin: 4, lean: 0.02 };
  else if (key === 'kick') T = side > 0 ? { ...IDLE, hip: [-18, 440], fr: [236, 640], fl: [-96, 742], hr: [-210, 250], hl: [196, 300], ua: -2.4, spin: 2.2, lean: -0.1 } : { ...IDLE, hip: [18, 440], fl: [-236, 640], fr: [96, 742], hr: [236, 250], hl: [-196, 300], ua: -0.7, spin: 2.2, lean: 0.1 };
  else if (key === 'crouch') T = { ...IDLE, hip: [0, 580], fl: [-206, 742], fr: [120, 742], hl: [-250, 440], hr: [258, 420], ua: -0.9, spin: 2.6, lean: 0.04 };
  else if (key === 'leap') T = { ...IDLE, hip: [0, 360], fl: [-120, 640], fr: [120, 600], hl: [-230, 170], hr: [190, 90], ua: -1.35, spin: 3.4, lean: 0 };
  return mixPose(IDLE, T, v);
}

// the umbrella: tip at the top, a rim ellipse, eight gores that turn with `ph`, a shaft and a crook; (x,y) = the grip, `ang` = direction of the shaft from the grip
function umbrella(ctx, x, y, ang, ph, R, tilt = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang + Math.PI / 2);
  const sh = R * 1.3, ry = R * (0.44 + 0.1 * Math.sin(tilt)), rimY = -sh, apex = -sh - R * 0.72;
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.save(); ctx.translate(6, 8); ctx.beginPath(); ctx.ellipse(0, rimY, R, ry, 0, 0, TAU); ctx.fill(); ctx.restore();
  // shaft and crook
  ctx.strokeStyle = '#4a2c1c'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 26); ctx.lineTo(0, apex + R * 0.2); ctx.stroke();
  ctx.strokeStyle = '#8a5a34'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-2, 26); ctx.lineTo(-2, rimY); ctx.stroke();
  ctx.strokeStyle = '#4a2c1c'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, 26); ctx.quadraticCurveTo(0, 50, 22, 44); ctx.stroke();
  const n = GORE.length, gore = (k, front) => {
    const a0 = ph + k / n * TAU, a1 = ph + (k + 1) / n * TAU, mid = (a0 + a1) / 2;
    if ((Math.sin(mid) >= 0) !== front) return;
    const p0 = [Math.cos(a0) * R, rimY + Math.sin(a0) * ry], p1 = [Math.cos(a1) * R, rimY + Math.sin(a1) * ry];
    ctx.beginPath(); ctx.moveTo(0, apex); ctx.quadraticCurveTo(p0[0] * 0.7, (apex + p0[1]) / 2 - R * 0.1, p0[0], p0[1]); ctx.ellipse(0, rimY, R, ry, 0, a0, a1); ctx.quadraticCurveTo(p1[0] * 0.7, (apex + p1[1]) / 2 - R * 0.1, 0, apex); ctx.closePath();
    const c = GORE[k % n], sn = Math.cos(mid);   // light from the upper left: gores turning left are lit
    ctx.fillStyle = hgrad(ctx, Math.min(p0[0], p1[0]), Math.max(p0[0], p1[0]) + 1, [[0, lighter(c, 0.12 + 0.12 * sn)], [1, darker(c, 0.26 - 0.1 * sn)]]); ctx.fill();
    ctx.strokeStyle = 'rgba(40,20,10,0.35)'; ctx.lineWidth = 1.6; ctx.stroke();
  };
  for (let k = 0; k < n; k++) gore(k, false);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, rimY, R * 0.98, ry * 0.98, 0, 0, Math.PI); ctx.fill();
  for (let k = 0; k < n; k++) gore(k, true);
  ctx.strokeStyle = '#fff8e8'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.ellipse(0, rimY, R, ry, 0, 0.02, Math.PI - 0.02); ctx.stroke();
  ctx.fillStyle = '#f4d060'; circ(ctx, 0, apex, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.ellipse(-R * 0.3, rimY + ry * 0.3, R * 0.2, ry * 0.3, 0.4, 0, TAU); ctx.fill();
  ctx.restore();
}

function costume(P, t, key, v) {
  return {
    skin: FV.skin,
    legs: { upper: FV.short, lower: FV.skin, w: [96, 90, 80, 56, 46], sep: 40, th: 150, sk: 156, ankle: 26, shoe: { col: FV.shoe, sole: '#d83a2a', s: 1.0, turn: 0.5 } },
    torso: { col: FV.shirt, col2: '#b98a10', sh: 88, ch: 80, wa: 64, hi: 76, top: 208, bot: -8, hem: 22,
      detail: (c, g) => { for (let x = -120; x < 120; x += 36) { c.fillStyle = x % 72 ? FV.stripeG : FV.stripeR; c.globalAlpha = 0.85; c.fillRect(x, g.sy, 12, g.ty - g.sy + 20); } c.globalAlpha = 1;
        c.fillStyle = FV.stripeR; c.beginPath(); c.moveTo(-34, g.sy - 14); c.lineTo(0, g.sy + 30); c.lineTo(34, g.sy - 14); c.lineTo(22, g.sy - 18); c.lineTo(0, g.sy + 8); c.lineTo(-22, g.sy - 18); c.closePath(); c.fill(); },
      belt: { col: '#2a1a14', h: 18, buckle: '#f2c24a' } },
    arm: { w: [64, 52, 40], ua: 128, fa: 120, bare: false, sleeve: { col: FV.shirt, len: 0.62, trim: FV.stripeR }, hand: 78, joint: false, open: 0.6, curl: 0.3 },
    head: { rx: 47, ry: 58, jaw: 0.35, turn: 0.15, smile: 1.15,
      hairBack: (c) => { c.fillStyle = FV.hair; ell(c, 0, -10, 52, 56); c.fill(); },
      hairFront: (c) => { c.fillStyle = FV.hair; c.beginPath(); c.moveTo(-52, 4); c.bezierCurveTo(-60, -52, -26, -66, 0, -64); c.bezierCurveTo(26, -66, 60, -52, 52, 4); c.bezierCurveTo(46, -22, 22, -32, 0, -32); c.bezierCurveTo(-22, -32, -46, -22, -52, 4); c.closePath(); c.fill();
        for (let q = -4; q <= 4; q++) { circ(c, q * 12, -54 + Math.abs(q) * 3, 12); c.fill(); }
        c.fillStyle = FV.stripeR; c.fillRect(-50, -30, 100, 12); c.fillStyle = '#f7c52a'; c.fillRect(-50, -26, 100, 4); } },
  };
}

function street(ctx, A, t, hz) {
  const X0 = A.x0, X1 = A.x1, W = X1 - X0, Y0 = A.y0, H = A.y1, cx = (X0 + X1) / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0, W, H - Y0); ctx.clip();
  ctx.fillStyle = vgrad(ctx, Y0, hz, [[0, '#f59a6c'], [0.55, '#fcc890'], [1, '#ffe3b4']]); ctx.fillRect(X0, Y0, W, hz - Y0);
  // a sun low behind the houses
  glow(ctx, cx + W * 0.18, hz - 90, 360, '#fff0c0', 0.5);
  // two rows of pastel houses climbing the hill
  const pal = ['#f4a0b4', '#f7d36a', '#7ccbc0', '#f0f0e6', '#f58a5a', '#9ab6ea', '#c7a0e0'], roof = '#b4532f';
  const rowH = (hz - Y0) * 0.62, n = Math.max(5, Math.round(W / 150)), hw = W / n;
  for (let row = 0; row < 2; row++) for (let k = -1; k <= n; k++) {
    const bx = X0 + k * hw + (row ? hw * 0.5 : 0), top = hz - rowH * (row ? 1.0 : 0.66) - hash(k * 3 + row * 11) * rowH * 0.12, c = pal[(k + row * 3 + 14) % pal.length], bw = hw * 0.96;
    ctx.fillStyle = row ? darker(c, 0.16) : c; ctx.fillRect(bx, top, bw, hz - top);
    ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(bx - 6, top + 2); ctx.lineTo(bx + bw / 2, top - bw * 0.2); ctx.lineTo(bx + bw + 6, top + 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.moveTo(bx + bw / 2, top - bw * 0.2); ctx.lineTo(bx + bw + 6, top + 2); ctx.lineTo(bx + bw / 2, top + 2); ctx.closePath(); ctx.fill();
    const wr = Math.max(1, Math.floor((hz - top) / 120)), wc = 2;
    for (let r = 0; r < wr; r++) for (let q = 0; q < wc; q++) { const wx = bx + bw * (0.2 + q * 0.45), wy = top + 24 + r * 96; ctx.fillStyle = '#fdf6e2'; ctx.fillRect(wx - 3, wy - 3, bw * 0.26 + 6, 50); ctx.fillStyle = hash(k + r * 5 + q) > 0.5 ? '#ffd27a' : '#40506a'; ctx.fillRect(wx, wy, bw * 0.26, 44); ctx.fillStyle = '#2a7a5a'; ctx.fillRect(wx - 6, wy - 3, 6, 50); ctx.fillRect(wx + bw * 0.26, wy - 3, 6, 50); }
    if (!row) { ctx.fillStyle = '#6a3a22'; ctx.fillRect(bx + bw * 0.38, hz - 58, bw * 0.24, 58); }
  }
  // bunting
  for (const [yy, dip] of [[Y0 + 26, 40], [Y0 + 96, 52]]) {
    ctx.strokeStyle = '#4a2c1c'; ctx.lineWidth = 3; ctx.beginPath(); for (let q = 0; q <= 40; q++) { const u = q / 40, x = X0 + u * W, y = yy + Math.sin(u * Math.PI) * dip + Math.sin(u * Math.PI * 4) * 6; if (q) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke();
    for (let q = 0; q < 26; q++) { const u = (q + 0.5) / 26, x = X0 + u * W, y = yy + Math.sin(u * Math.PI) * dip + Math.sin(u * Math.PI * 4) * 6, sw = Math.sin(t * 2 + q) * 4; ctx.fillStyle = GORE[(q + (yy > Y0 + 50 ? 3 : 0)) % 7]; ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + 14, y); ctx.lineTo(x + sw, y + 34); ctx.closePath(); ctx.fill(); }
  }
  // cobbled street with a warm pool of light
  ctx.fillStyle = vgrad(ctx, hz, H, [[0, '#8a6a52'], [1, '#5a4034']]); ctx.fillRect(X0, hz, W, H - hz);
  for (let r = 0; r < 14; r++) { const y = hz + 8 + r * r * 3.2 + r * 10; if (y > H) break; const sz = 28 + r * 6; for (let x = X0 - (r % 2) * sz / 2; x < X1; x += sz) { ctx.strokeStyle = 'rgba(30,16,8,0.4)'; ctx.lineWidth = 2; ctx.strokeRect(x, y, sz, 14 + r * 3); ctx.fillStyle = `rgba(255,${200 + hash(x + r) * 40},${150 + hash(r * 3 + x) * 30},0.06)`; ctx.fillRect(x + 2, y + 2, sz - 4, 10 + r * 3); } }
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(X0, hz, W, 5);
  ctx.fillStyle = rgrad(ctx, cx, hz + (H - hz) * 0.4, 8, W * 0.5, [[0, 'rgba(255,224,160,0.4)'], [1, 'rgba(255,224,160,0)']]); ctx.fillRect(X0, hz, W, H - hz);
  // drifting confetti
  for (let q = 0; q < 46; q++) { const fx = X0 + ((hash(q * 1.7) * W + t * (10 + hash(q) * 18)) % W), fy = Y0 + ((hash(q * 2.9) * (H - Y0) + t * (22 + hash(q + 3) * 30)) % (H - Y0)); ctx.save(); ctx.translate(fx, fy); ctx.rotate(t * 2 + q); ctx.fillStyle = GORE[q % 7]; ctx.globalAlpha = 0.85; ctx.fillRect(-5, -3, 10, 6); ctx.restore(); }
  ctx.restore();
}

const ZONES = [['twirl', /twirl|spin|turn/], ['kick', /kick|scissor|fling/], ['crouch', /crouch|squat|low|sit/], ['leap', /leap|jump|hop/]];
registerDanceStage({
  id: 'umbrella-hero', match: /(frevo|umbrella).*dancer|dancer.*umbrella|umbrella dancer/,
  build: (S, lanes, P) => createSceneStage('umbrella-hero', S, lanes, P, {
    tallRatio: 0.85,
    dress: () => ({ kind: 'stone', base: '#8a6a52', accent: '#6a4a38', size: 120, light: '#ffe0b0' }),
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 960 } : { w: 1180, h: 600 };
      const keyOf = assignZones(K, ZONES.map(([key, re]) => ({ key, re }))); const spots = new Array(K.N).fill(null);
      const k = tall ? 0.86 : 0.62, fy = tall ? 122 : 74, hz = tall ? 600 : 360, PR = tall ? 58 : 62;
      const by = tall ? { twirl: [-300, 892], kick: [-100, 892], crouch: [100, 892], leap: [300, 892] } : { twirl: [-480, 150], kick: [-480, 420], crouch: [480, 150], leap: [480, 420] };
      for (let i = 0; i < K.N; i++) { const p = by[keyOf[i]]; if (p) spots[i] = eSpot(p[0], p[1], PR, PR, 0, { apk: 1, extra: { noFill: true } }); }
      const st = { ph: 0, lastT: null };
      return { ref, spots,
        draw(ctx, rt, g) {
          const t = rt.anim; street(ctx, areaInDesign(ctx, g.F, ref), t, hz);
          const env = envOf(rt, K, keyOf), [key, v] = dominant(env), side = flipSide(st, 'kick', env.kick ?? 0);
          const P0 = pose(key, v, side, g.tall), dtt = st.lastT == null ? 0 : clamp(t - st.lastT, 0, 0.1); st.lastT = t; st.ph += dtt * (3 + (P0.spin ?? 1) * 5);
          const hop = key === 'leap' ? v : 0;
          ctx.save(); ctx.translate(0, fy); ctx.scale(k, k);
          groundPool(ctx, 6, 764, 230 - 60 * hop, 24, 0.44 - 0.2 * hop);
          const Pp = { ...P0, hip: [P0.hip[0], P0.hip[1] + (key ? 0 : 5 * Math.sin(t * 5.2))] };
          const fig = costume(Pp, t, key, v); let grip = null; fig.hand = (c, sx, end) => { if (sx > 0) grip = end; };
          const out = drawFigure(ctx, Pp, fig, t);
          if (grip) umbrella(ctx, grip.hx, grip.hy, Pp.ua ?? -1.2, st.ph, tall ? 118 : 106, Math.sin(st.ph * 0.5));
          void out;
          ctx.restore();
          lanes.forEach((l, i) => { if (spots[i]) pad(ctx, l, spots[i], rt.flash[i], laneIcon(l)); });
        } };
    },
  }),
});
void rgba; void ease; void rrect; void ell;

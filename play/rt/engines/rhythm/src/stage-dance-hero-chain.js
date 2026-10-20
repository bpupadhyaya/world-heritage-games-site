// Chain dance, hero stage (1.25.0): a line of six dancers curving away from the camera, hands joined at shoulder height, led by a dancer at the front who waves a white
// handkerchief. A different composition from the solo dances: the line itself is the hero. Lanes: Step (the sideways travelling step), Cross (the crossing step), Lift
// (a knee lifted, alternating), Turn (the leader turns under the raised kerchief while the line sways). The costumes differ along the line (a pleated white kilt and short
// jacket for the leader, long embroidered dresses with aprons and head scarves, dark waistcoats and baggy trousers). A whitewashed island square at night: blue shutters,
// bougainvillea, bulbs on a string, the sea behind.
import { registerDanceStage } from './registry.js';
import { createSceneStage, eSpot, assignZones, areaInDesign } from './dance-kit.js';
import { clamp, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, circ, ell, hash, TAU } from './dance-kit.js';
import { glow } from './art.js';
import { pad, laneIcon } from './dance-pad.js';
import { envOf, dominant, flipSide } from './hero-common.js';
import { groundPool, ease, lerp } from './figure-hero.js';
import { drawFigure } from './figure-hero2.js';

const SK = ['#e2b08a', '#d49a74', '#e8bc98', '#c98e66', '#dca680', '#d8a07a'];
const KIND = ['kilt', 'dress', 'vest', 'dress', 'vest', 'dress'];
const DRESS = [['#b8242e', '#6a0e14'], ['#1e4a9a', '#0e2458'], ['#2a7a56', '#124a34'], ['#7a3a88', '#3e1a48']];

function costume(i, P, t, sway, kerchief) {
  const kind = KIND[i], skin = SK[i], dc = DRESS[(i >> 1) % 4];
  const f = { skin, arm: { w: [60, 50, 38], ua: 128, fa: 118, joint: false, hand: 80, open: 0.2, curl: 0.5 },
    head: { rx: 46, ry: 57, jaw: 0.2, turn: 0.2, smile: 1.0 } };
  const hairDark = ['#1c120e', '#2a1a12', '#120c0a'][i % 3];
  if (kind === 'kilt') {
    f.legs = { upper: '#f6f3ea', lower: '#f6f3ea', w: [70, 64, 56, 48, 42], sep: 38, shoe: { col: '#1c1410', sole: '#0c0806', s: 0.95, turn: 0.4 } };
    f.skirt = { col: '#f8f5ec', top: P.hip[1] - 46, hem: P.hip[1] + 170, w0: 80, w1: 128, sway, dip: 18, trim: '#d8d2c0', pattern: (c, W, top, hem) => { c.strokeStyle = 'rgba(120,110,90,0.35)'; c.lineWidth = 2.4; for (let q = -12; q <= 12; q++) { c.beginPath(); c.moveTo(q * 7, top); c.lineTo(q * 11, hem + 8); c.stroke(); } } };
    f.torso = { col: '#1e2a52', col2: '#0c1430', sh: 90, ch: 84, wa: 70, hi: 80, top: 210, bot: -30, detail: (c, g) => { c.strokeStyle = '#e8c25a'; c.lineWidth = 3; for (let y = g.sy + 20; y < g.ty - 4; y += 22) { c.beginPath(); c.moveTo(-56, y); c.lineTo(-10, y + 10); c.moveTo(56, y); c.lineTo(10, y + 10); c.stroke(); } c.fillStyle = '#f4f0e6'; c.beginPath(); c.moveTo(-22, g.sy - 14); c.lineTo(0, g.sy + 50); c.lineTo(22, g.sy - 14); c.closePath(); c.fill(); }, belt: { col: '#b8242e', h: 16 } };
    f.arm.col = '#f6f3ea'; f.arm.cuff = '#f6f3ea'; f.arm.w = [62, 58, 42]; f.arm.cap = '#1e2a52';
    f.head.hairBack = (c) => { c.fillStyle = hairDark; ell(c, 0, -10, 51, 54); c.fill(); };
    f.head.hairFront = (c) => { c.fillStyle = hairDark; c.beginPath(); c.moveTo(-52, 6); c.bezierCurveTo(-58, -50, -26, -62, 0, -60); c.bezierCurveTo(26, -62, 58, -50, 52, 6); c.bezierCurveTo(46, -20, 22, -30, 0, -30); c.bezierCurveTo(-22, -30, -46, -20, -52, 6); c.closePath(); c.fill(); c.fillStyle = '#b8242e'; c.fillRect(-50, -32, 100, 10); };
  } else if (kind === 'vest') {
    f.legs = { upper: '#242a3c', lower: '#242a3c', w: [88, 76, 62, 50, 42], sep: 40, shoe: { col: '#1a1210', sole: '#0a0604', s: 0.95, turn: 0.4 } };
    f.torso = { col: '#171a24', col2: '#08090e', sh: 90, ch: 84, wa: 72, hi: 82, top: 210, bot: -8, detail: (c, g) => { c.fillStyle = '#f6f3ea'; c.beginPath(); c.moveTo(-26, g.sy - 14); c.lineTo(0, g.sy + 70); c.lineTo(26, g.sy - 14); c.closePath(); c.fill(); c.strokeStyle = '#d8b050'; c.lineWidth = 3; for (let y = g.sy + 30; y < g.ty - 6; y += 24) { c.beginPath(); c.moveTo(-40, y); c.lineTo(-8, y + 8); c.moveTo(40, y); c.lineTo(8, y + 8); c.stroke(); } }, belt: { col: dc[0], h: 18 } };
    f.arm.col = '#f6f3ea'; f.arm.cuff = '#f6f3ea'; f.arm.w = [60, 54, 40]; f.arm.cap = '#171a24';
    f.head.hairBack = (c) => { c.fillStyle = hairDark; ell(c, 0, -10, 51, 54); c.fill(); };
    f.head.hairFront = (c) => { c.fillStyle = hairDark; c.beginPath(); c.moveTo(-52, 4); c.bezierCurveTo(-58, -48, -26, -60, 0, -58); c.bezierCurveTo(26, -60, 58, -48, 52, 4); c.bezierCurveTo(46, -18, 22, -28, 0, -28); c.bezierCurveTo(-22, -28, -46, -18, -52, 4); c.closePath(); c.fill(); };
  } else {
    f.legs = { upper: dc[0], lower: skin, w: [70, 64, 56, 46, 38], sep: 36, shoe: { col: '#2a1c18', sole: '#0a0604', s: 0.85, turn: 0.5 } };
    f.skirt = { col: dc[0], top: P.hip[1] - 70, hem: P.hip[1] + 300, w0: 70, w1: 150, sway, dip: 20, trim: '#e8c25a',
      pattern: (c, W, top, hem) => { c.strokeStyle = 'rgba(0,0,0,0.22)'; c.lineWidth = 3; for (let q = -9; q <= 9; q++) { c.beginPath(); c.moveTo(q * 7, top); c.quadraticCurveTo(q * 14, (top + hem) / 2, q * 17, hem); c.stroke(); }
        c.fillStyle = '#f6f3ea'; c.beginPath(); c.moveTo(-44, top + 30); c.lineTo(44, top + 30); c.lineTo(66, hem); c.lineTo(-66, hem); c.closePath(); c.fill(); c.strokeStyle = '#e8c25a'; c.lineWidth = 6; c.beginPath(); c.moveTo(-60, hem - 36); c.lineTo(60, hem - 36); c.stroke(); for (let x = -50; x <= 50; x += 20) { c.fillStyle = dc[1]; c.beginPath(); c.moveTo(x, hem - 30); c.lineTo(x + 10, hem - 8); c.lineTo(x - 10, hem - 8); c.closePath(); c.fill(); } } };
    f.torso = { col: dc[0], col2: dc[1], sh: 84, ch: 70, wa: 58, hi: 64, top: 210, bot: -70, detail: (c, g) => { c.fillStyle = '#f6f3ea'; c.beginPath(); c.moveTo(-26, g.sy - 14); c.lineTo(0, g.sy + 40); c.lineTo(26, g.sy - 14); c.closePath(); c.fill(); c.strokeStyle = '#e8c25a'; c.lineWidth = 4; c.beginPath(); c.moveTo(-44, g.sy + 30); c.lineTo(44, g.sy + 30); c.stroke(); } };
    f.arm.col = '#f6f3ea'; f.arm.cuff = dc[0]; f.arm.w = [62, 58, 42]; f.arm.cap = dc[0];
    const sc = ['#f6f3ea', '#e8c25a', '#d8e4f4'][i % 3];
    f.head.hairBack = (c) => { c.fillStyle = hairDark; ell(c, 0, -6, 50, 55); c.fill(); };
    f.head.hairFront = (c) => { c.fillStyle = sc; c.beginPath(); c.moveTo(-56, 14); c.bezierCurveTo(-64, -50, -26, -66, 0, -64); c.bezierCurveTo(26, -66, 64, -50, 56, 14); c.bezierCurveTo(50, -20, 24, -34, 0, -34); c.bezierCurveTo(-24, -34, -50, -20, -56, 14); c.closePath(); c.fill(); c.strokeStyle = 'rgba(120,90,40,0.5)'; c.lineWidth = 2; c.stroke(); c.fillStyle = dc[0]; for (let q = -4; q <= 4; q++) { circ(c, q * 11, -40 + Math.abs(q) * 1.5, 3); c.fill(); } };
  }
  void t; void kerchief;
  return f;
}

// a white handkerchief held at (x,y): a square that ripples, fringe at the free end
function kerchiefAt(ctx, x, y, ang, t, s) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  const w1 = Math.sin(t * 9) * 12, w2 = Math.sin(t * 9 + 2) * 12;
  ctx.beginPath(); ctx.moveTo(0, -14); ctx.bezierCurveTo(50, -34 + w1, 100, -6 + w2, 150, -22 + w1); ctx.lineTo(158, 28 + w2); ctx.bezierCurveTo(104, 40 + w1, 56, 18 + w2, 0, 16); ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.save(); ctx.translate(6, 8); ctx.fill(); ctx.restore();
  ctx.fillStyle = hgrad(ctx, 0, 160, [[0, '#ffffff'], [0.5, '#f4efe4'], [1, '#d8d0be']]); ctx.fill(); ctx.strokeStyle = 'rgba(150,130,90,0.55)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = '#d8b050'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(14, -6); ctx.bezierCurveTo(56, -22 + w1, 98, 0 + w2, 140, -12 + w1); ctx.stroke();
  for (let q = 0; q < 8; q++) { const u = q / 7; ctx.strokeStyle = '#f4efe4'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(158 - 4, -22 + 50 * u + w1 * (1 - u) + w2 * u); ctx.lineTo(172, -22 + 50 * u + 2 * Math.sin(t * 12 + q) + w1 * (1 - u) + w2 * u); ctx.stroke(); }
  ctx.restore();
}

function square(ctx, A, t, hz) {
  const X0 = A.x0, X1 = A.x1, W = X1 - X0, Y0 = A.y0, H = A.y1, cx = (X0 + X1) / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0, W, H - Y0); ctx.clip();
  ctx.fillStyle = vgrad(ctx, Y0, hz, [[0, '#0b1c46'], [0.6, '#1d4a86'], [1, '#4a86b8']]); ctx.fillRect(X0, Y0, W, hz - Y0);
  for (let q = 0; q < 40; q++) { ctx.fillStyle = `rgba(255,255,240,${0.3 + 0.5 * hash(q + 2)})`; circ(ctx, X0 + hash(q * 3.3) * W, Y0 + hash(q * 5.1) * (hz - Y0) * 0.55, 1 + hash(q) * 1.6); ctx.fill(); }
  // sea and a small boat light
  const sy = hz - (hz - Y0) * 0.3; ctx.fillStyle = vgrad(ctx, sy, hz, [[0, '#2a5a8c'], [1, '#14305a']]); ctx.fillRect(X0, sy, W, hz - sy); ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 2; for (let q = 0; q < 9; q++) { ctx.beginPath(); const y = sy + 8 + q * (hz - sy) / 10; ctx.moveTo(X0 + hash(q) * 80, y); ctx.lineTo(X0 + 100 + hash(q) * 160 + q * 20, y); ctx.stroke(); }
  // whitewashed houses with blue doors and shutters on both sides, a low wall behind the dancers
  const wallTop = hz - (hz - Y0) * 0.34;
  const house = (x, w, top, door) => {
    ctx.fillStyle = vgrad(ctx, top, hz, [[0, '#f8f6ee'], [1, '#dcd8cc']]); ctx.fillRect(x, top, w, hz - top);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x + w - 8, top, 8, hz - top); ctx.fillStyle = '#e8e4d8'; ctx.fillRect(x - 4, top - 8, w + 8, 10);
    const wy = top + 30; ctx.fillStyle = '#1a58b0'; ctx.fillRect(x + w * 0.14, wy, w * 0.26, 70); ctx.fillStyle = '#ffd890'; ctx.fillRect(x + w * 0.2, wy + 6, w * 0.14, 58); ctx.fillStyle = '#1a58b0'; ctx.fillRect(x + w * 0.6, wy, w * 0.26, 70); ctx.fillStyle = '#1c2a4a'; ctx.fillRect(x + w * 0.66, wy + 6, w * 0.14, 58);
    if (door) { ctx.fillStyle = '#1a58b0'; rrect(ctx, x + w * 0.35, hz - 92, w * 0.3, 92, 8); ctx.fill(); ctx.fillStyle = '#f0c85a'; circ(ctx, x + w * 0.58, hz - 46, 4); ctx.fill(); }
  };
  house(X0 - 20, W * 0.3, wallTop - 70, true); house(X1 - W * 0.3 + 20, W * 0.3, wallTop - 110, true); house(cx - W * 0.12, W * 0.22, wallTop - 20, false);
  // bougainvillea tumbling over the walls
  for (let q = 0; q < 44; q++) { const bx = (q < 22 ? X0 + hash(q * 2.1) * W * 0.3 : X1 - hash(q * 2.1) * W * 0.3), by = wallTop - 60 + hash(q * 3.7) * 150, s = 12 + hash(q) * 16; ctx.fillStyle = ['#d8247e', '#e84a9a', '#b81a68'][q % 3]; circ(ctx, bx, by, s); ctx.fill(); }
  for (let q = 0; q < 18; q++) { const bx = X0 + hash(q * 4.1 + 9) * W, by = hz - 4 - hash(q * 7) * 16; ctx.fillStyle = '#2a7a4a'; ell(ctx, bx, by, 20, 8); ctx.fill(); }
  // bulbs on a string
  ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 2.4; ctx.beginPath(); for (let q = 0; q <= 30; q++) { const u = q / 30, x = X0 + u * W, y = Y0 + 36 + Math.sin(u * Math.PI) * 40; if (q) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke();
  const nb = Math.max(7, Math.floor(W / 100)); for (let q = 0; q < nb; q++) { const u = (q + 0.5) / nb, x = X0 + u * W, y = Y0 + 36 + Math.sin(u * Math.PI) * 40 + 7, fl = 0.85 + 0.15 * Math.sin(t * 5 + q * 2); glow(ctx, x, y + 6, 70, '#ffd070', 0.5 * fl); ctx.fillStyle = '#fff0b8'; circ(ctx, x, y + 6, 6); ctx.fill(); }
  // paved square with a pale pattern and a pool of light
  ctx.fillStyle = vgrad(ctx, hz, H, [[0, '#b8b0a0'], [1, '#7e786c']]); ctx.fillRect(X0, hz, W, H - hz);
  for (let r = 0; r < 12; r++) { const y = hz + 6 + r * r * 3.4 + r * 8; if (y > H) break; const sz = 40 + r * 9; ctx.strokeStyle = 'rgba(40,36,30,0.3)'; ctx.lineWidth = 2; for (let x = X0 - (r % 2) * sz / 2; x < X1; x += sz) ctx.strokeRect(x, y, sz, 16 + r * 4); }
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(X0, hz, W, 5);
  ctx.fillStyle = rgrad(ctx, cx, hz + (H - hz) * 0.35, 8, W * 0.55, [[0, 'rgba(255,214,140,0.4)'], [1, 'rgba(255,214,140,0)']]); ctx.fillRect(X0, hz, W, H - hz);
  ctx.restore();
}

const ZONES = [['step', /step|side|travel/], ['cross', /cross|weave/], ['lift', /lift|kick|knee|hop/], ['turn', /turn|twirl|wave/]];
registerDanceStage({
  id: 'chain-hero', match: /(chain|line|kalamatian|halay).*dancer|dancer.*chain|chain dancer/,
  build: (S, lanes, P) => createSceneStage('chain-hero', S, lanes, P, {
    tallRatio: 0.85,
    dress: () => ({ kind: 'stone', base: '#9a9486', accent: '#7e786c', size: 120, light: '#ffe0b0' }),
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 960 } : { w: 1180, h: 600 };
      const keyOf = assignZones(K, ZONES.map(([key, re]) => ({ key, re }))); const spots = new Array(K.N).fill(null);
      const hz = tall ? 470 : 262, PR = tall ? 58 : 62;
      // the line, front (the leader) to back: ground point (x, y), scale
      const line = tall ? [[196, 812, 0.78], [72, 732, 0.68], [-42, 676, 0.6], [-142, 634, 0.54], [-232, 600, 0.49], [-314, 574, 0.45]]
        : [[312, 556, 0.64], [168, 496, 0.57], [32, 452, 0.5], [-92, 420, 0.45], [-206, 398, 0.41], [-310, 380, 0.38]];
      const by = tall ? { step: [-300, 892], cross: [-100, 892], lift: [100, 892], turn: [300, 892] } : { step: [-520, 150], cross: [-520, 420], lift: [520, 150], turn: [520, 420] };
      for (let i = 0; i < K.N; i++) { const p = by[keyOf[i]]; if (p) spots[i] = eSpot(p[0], p[1], PR, PR, 0, { apk: 1, extra: { noFill: true } }); }
      const st = {};
      return { ref, spots,
        draw(ctx, rt, g) {
          const t = rt.anim, env = envOf(rt, K, keyOf), [key, v] = dominant(env), side = flipSide(st, 'lift', env.lift ?? 0), sideS = flipSide(st, 'step', env.step ?? 0);
          square(ctx, areaInDesign(ctx, g.F, ref), t, hz);
          const n = line.length, wy = (i, ly) => line[i][1] + (ly - 742) * line[i][2];
          // the joined hands: the midpoint of the two neighbours at hand height
          const joint = []; for (let i = 0; i < n - 1; i++) { const a = [line[i][0], wy(i, 320)], b = [line[i + 1][0], wy(i + 1, 320)]; joint.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 6]); }
          // back to front so nearer dancers cover the ones behind
          for (let i = n - 1; i >= 0; i--) {
            const [x, y, s] = line[i], ph = i * 0.9, bob = key ? 0 : 5 * Math.sin(t * 5 + ph);
            const loc = (w) => [(w[0] - x) / s, 742 + (w[1] - y) / s];
            const left = i < n - 1 ? loc(joint[i]) : [-150, 470], right = i > 0 ? loc(joint[i - 1]) : null;   // joint[i]: with the next dancer back (screen left)
            // the leader's free hand is up with the kerchief
            let hl = left, hr = right ?? [150, 220];
            const P0 = { hip: [0, 432 + bob], fl: [-62, 742], fr: [62, 742], hl, hr, lean: 0 };
            const w = key ? ease(v) : 0;
            if (key === 'step') { const d = sideS * 70 * w; P0.fl = [-62 + d, 742]; P0.fr = [62 + d * 0.4, 742 - 18 * w]; P0.hip = [d * 0.5, 432 + bob]; P0.lean = sideS * 0.04 * w; }
            else if (key === 'cross') { P0.fl = [70 * w, 742 - 10 * w]; P0.fr = [62 - 30 * w, 742]; P0.hip = [-12 * w, 436]; }
            else if (key === 'lift') { const ft = side > 0 ? 'fr' : 'fl'; P0[ft] = [side * 70, 742 - 150 * w]; P0.hip = [-side * 14 * w, 426]; }
            else if (key === 'turn') { P0.lean = Math.sin(t * 7 + ph) * 0.06 * w; P0.hip = [Math.sin(t * 7 + ph) * 12 * w, 432]; }
            if (i === 0) { const up = key === 'turn' ? w : 0.55; P0.hr = [lerp(150, 70, up), lerp(250, 120, up)]; }
            if (i === n - 1) P0.hl = [-122, 450];
            const sway = Math.sin(t * 3 + ph) * 3 + (key ? 7 * w : 0);
            ctx.save(); ctx.translate(x, y - 742 * s); ctx.scale(s, s);
            groundPool(ctx, 6, 764, 150, 18, 0.4);
            const fig = costume(i, P0, t, sway);
            let tip = null; if (i === 0) fig.hand = (c, sx, end, ang) => { if (sx > 0) tip = [end.hx, end.hy, ang]; };
            drawFigure(ctx, P0, fig, t);
            if (tip) kerchiefAt(ctx, tip[0], tip[1], key === 'turn' ? -0.5 + Math.sin(t * 8) * 0.5 : -1.15 + Math.sin(t * 4) * 0.3, t, 0.85);
            ctx.restore();
          }
          lanes.forEach((l, i) => { if (spots[i]) pad(ctx, l, spots[i], rt.flash[i], laneIcon(l)); });
        } };
    },
  }),
});
void rgba; void darker; void lighter; void rrect;

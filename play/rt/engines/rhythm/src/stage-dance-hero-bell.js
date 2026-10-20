// Leg-bell dance, hero stage (1.25.0): a dancer in a cream tunic, a wrapped checked cloth to the knee, a beaded headband and necklace, with a column of small iron bells
// bound around one shin (the dance rings the bells by stamping). Lanes: Stamp (the belled leg lifts and comes down hard, dust at the heel), Step (a wide side step),
// Sway (the body leans and the arms open), Shake (shoulders and arms raised, the bells trembling). The bells are the second hero: three columns of iron cups on a strap,
// each swinging on its own phase, shaking with the movement. An evening on dry grassland: low sun, acacia, hills, a ring of packed earth with a long shadow.
import { registerDanceStage } from './registry.js';
import { createSceneStage, eSpot, assignZones, areaInDesign } from './dance-kit.js';
import { clamp, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, circ, ell, hash, TAU } from './dance-kit.js';
import { glow } from './art.js';
import { pad, laneIcon } from './dance-pad.js';
import { envOf, dominant, mixPose, flipSide } from './hero-common.js';
import { groundPool, ease, lerp } from './figure-hero.js';
import { drawFigure } from './figure-hero2.js';

const KB = { skin: '#7a4a2e', tunic: '#efe5cc', cloth: '#b8321f', clothD: '#5a1410', ind: '#23306a', bead: ['#d8322a', '#f4eedc', '#2a58b8', '#e8b84a'], hair: '#140c08' };
const IDLE = { hip: [0, 432], fl: [-64, 742], fr: [64, 742], hl: [-150, 470], hr: [150, 470], lean: 0, tilt: 0, shake: 0.15 };

function pose(key, v, side) {
  let T = IDLE;
  if (key === 'stamp') T = { ...IDLE, hip: [14, 440], fl: [-120, 640], fr: [80, 742], hl: [-200, 380], hr: [200, 380], lean: 0.04, shake: 1 };
  else if (key === 'step') T = side > 0 ? { ...IDLE, hip: [60, 440], fl: [-20, 742], fr: [170, 742], hl: [-230, 420], hr: [250, 340], lean: 0.08, shake: 0.5 } : { ...IDLE, hip: [-60, 440], fl: [-170, 742], fr: [20, 742], hl: [-250, 340], hr: [230, 420], lean: -0.08, shake: 0.5 };
  else if (key === 'sway') T = { ...IDLE, hip: [-16, 446], fl: [-96, 742], fr: [110, 742], hl: [-262, 330], hr: [250, 400], lean: -0.14, tilt: -0.08, shake: 0.4 };
  else if (key === 'shake') T = { ...IDLE, hip: [0, 452], fl: [-84, 742], fr: [84, 742], hl: [-168, 140], hr: [168, 140], shake: 1, lean: 0.02 };
  return mixPose(IDLE, T, v);
}

// iron bells on a strap along a shin: three columns of dark cups with a bright lip and a hanging clapper, each on its own phase
function ironBells(ctx, a, b, shake, t) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, rows = 7;
  ctx.save();
  for (const k of [0.04, 0.5, 0.96]) { const x = a[0] + dx * k, y = a[1] + dy * k; ctx.strokeStyle = '#2a1a12'; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(x, y, 34, 9, Math.atan2(ny, nx) + Math.PI / 2, 0, TAU); ctx.stroke(); }
  for (let r = 0; r < rows; r++) for (let c = -1; c <= 1; c++) {
    const u = (r + 0.5 + (c ? 0.3 : 0)) / (rows + 0.3), j = Math.sin(t * 58 + r * 1.9 + c * 2.3) * shake * 4, x = a[0] + dx * u + nx * c * 22 + ux * j + nx * j * 0.4, y = a[1] + dy * u + ny * c * 22 + uy * j + ny * j * 0.4, s = 10.5 - Math.abs(c) * 1.4;
    ctx.fillStyle = 'rgba(0,0,0,0.38)'; circ(ctx, x + 2, y + 3, s); ctx.fill();
    ctx.fillStyle = rgrad(ctx, x - s * 0.35, y - s * 0.4, 0, s * 1.3, [[0, '#9aa0aa'], [0.45, '#4a4e58'], [1, '#1a1c22']]); circ(ctx, x, y, s); ctx.fill();
    ctx.strokeStyle = 'rgba(200,205,215,0.65)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, s * 0.82, 0.3, Math.PI - 0.3); ctx.stroke();
    ctx.fillStyle = '#1a1210'; ctx.beginPath(); ctx.ellipse(x, y + s * 0.55, s * 0.5, s * 0.18, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function costume(P, t, key, v, bellsShake) {
  return {
    skin: KB.skin,
    legs: { upper: KB.skin, lower: KB.skin, w: [84, 74, 62, 50, 40], sep: 40, th: 165, sk: 150, ankle: 24, shoe: { col: darker(KB.skin, 0.1), sole: '#3a2418', s: 0.9, turn: 0.7 },
      after: (c, r, sx, lift, tt) => {
        // the belled shin on the dancer's right (screen left); a beaded band on the other ankle
        if (sx < 0) ironBells(c, [r.mid[0] + (r.end[0] - r.mid[0]) * 0.1, r.mid[1] + (r.end[1] - r.mid[1]) * 0.1], [r.end[0] - (r.end[0] - r.mid[0]) * 0.06, r.end[1] - (r.end[1] - r.mid[1]) * 0.06], bellsShake, tt);
        else { for (let q = 0; q < 8; q++) { const u = 0.82 + (q % 2) * 0.04, x = lerp(r.mid[0], r.end[0], u) + (q - 3.5) * 6, y = lerp(r.mid[1], r.end[1], u) + Math.abs(q - 3.5) * 1.2; c.fillStyle = KB.bead[q % 4]; circ(c, x, y, 5); c.fill(); } }
      } },
    skirt: { col: KB.cloth, top: P.hip[1] - 52, hem: P.hip[1] + 128, w0: 82, w1: 112, sway: Math.sin(t * 4) * 3 + 8 * v, dip: 16, trim: KB.clothD,
      pattern: (c, W, top, hem) => { c.fillStyle = KB.clothD; for (let x = -140; x < 140; x += 32) c.fillRect(x, top - 4, 9, hem - top + 30); for (let y = top; y < hem + 20; y += 32) c.fillRect(-140, y, 280, 9); c.fillStyle = KB.ind; for (let x = -124; x < 140; x += 64) c.fillRect(x, top - 4, 6, hem - top + 30); c.fillStyle = '#f2e6c8'; for (let x = -140; x < 140; x += 32) for (let y = top + 12; y < hem + 20; y += 32) c.fillRect(x + 14, y, 4, 4); } },
    torso: { col: KB.tunic, col2: '#a8987a', sh: 92, ch: 82, wa: 64, hi: 78, top: 210, bot: -26,
      detail: (c, g) => { c.fillStyle = '#c0392b'; c.fillRect(-120, g.sy + 110, 240, 14); c.fillStyle = KB.ind; c.fillRect(-120, g.sy + 124, 240, 8); for (let x = -110; x < 120; x += 22) { c.fillStyle = KB.bead[(x / 22 + 20 | 0) % 4]; c.beginPath(); c.moveTo(x, g.sy + 112); c.lineTo(x + 11, g.sy + 136); c.lineTo(x + 22, g.sy + 112); c.closePath(); c.fill(); }
        c.fillStyle = darker(KB.skin, 0.2); c.beginPath(); c.moveTo(-26, g.sy - 14); c.lineTo(0, g.sy + 40); c.lineTo(26, g.sy - 14); c.closePath(); c.fill(); },
      belt: { col: '#2a1a14', h: 16, buckle: '#d8b050' } },
    arm: { w: [62, 50, 38], ua: 130, fa: 120, bare: true, joint: false, hand: 80, open: 0.6, curl: 0.25 },
    head: { rx: 47, ry: 58, jaw: 0.35, turn: 0.15, smile: 1.1, neck: 44,
      hairBack: (c) => { c.fillStyle = KB.hair; ell(c, 0, -10, 51, 55); c.fill(); },
      hairFront: (c) => { c.fillStyle = KB.hair; c.beginPath(); c.moveTo(-51, 6); c.bezierCurveTo(-58, -50, -26, -62, 0, -60); c.bezierCurveTo(26, -62, 58, -50, 51, 6); c.bezierCurveTo(46, -20, 22, -30, 0, -30); c.bezierCurveTo(-22, -30, -46, -20, -51, 6); c.closePath(); c.fill();
        c.fillStyle = '#c0392b'; c.fillRect(-50, -32, 100, 13); for (let q = 0; q < 9; q++) { c.fillStyle = KB.bead[q % 4]; circ(c, -42 + q * 10.5, -25.5, 4); c.fill(); } } },
    afterTorso: (c, g) => { for (let q = 0; q < 17; q++) { const a = 0.2 + q / 16 * (Math.PI - 0.4), x = Math.cos(a) * 46 * -1, y = g.sy + 2 + Math.sin(a) * 40; c.fillStyle = KB.bead[q % 4]; circ(c, x, y, 5.5); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 1; c.stroke(); } },
  };
}

function savanna(ctx, A, t, hz, key, v) {
  const X0 = A.x0, X1 = A.x1, W = X1 - X0, Y0 = A.y0, H = A.y1, cx = (X0 + X1) / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0, W, H - Y0); ctx.clip();
  ctx.fillStyle = vgrad(ctx, Y0, hz, [[0, '#3a2a6a'], [0.35, '#a8467a'], [0.7, '#f08a4a'], [1, '#ffd078']]); ctx.fillRect(X0, Y0, W, hz - Y0);
  const sxp = cx - W * 0.2, syp = hz - (hz - Y0) * 0.22;
  glow(ctx, sxp, syp, 420, '#ffe0a0', 0.65); ctx.fillStyle = '#fff2c8'; circ(ctx, sxp, syp, 62); ctx.fill();
  for (let q = 0; q < 3; q++) { ctx.fillStyle = `rgba(255,240,210,${0.18 - q * 0.05})`; ctx.fillRect(X0, syp - 3 + q * 6, W, 2); }
  // far hills in two layers and a few birds
  for (const [c, amp, off] of [['#7a3a5a', 36, 0.0], ['#4a2448', 54, 0.6]]) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(X0, hz); for (let q = 0; q <= 24; q++) { const u = q / 24; ctx.lineTo(X0 + u * W, hz - 24 - amp * (0.5 + 0.5 * Math.sin(u * 7 + off * 5)) - 10 * Math.sin(u * 19 + off)); } ctx.lineTo(X1, hz); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle = '#2a1030'; ctx.lineWidth = 2.4; for (const [bx, by] of [[X0 + W * 0.7, Y0 + 90], [X0 + W * 0.76, Y0 + 70], [X0 + W * 0.62, Y0 + 60]]) { ctx.beginPath(); ctx.moveTo(bx - 14, by); ctx.quadraticCurveTo(bx - 6, by - 10, bx, by); ctx.quadraticCurveTo(bx + 6, by - 10, bx + 14, by); ctx.stroke(); }
  // an acacia with a flat crown
  const ax = X0 + W * 0.8, ay = hz - 4; ctx.fillStyle = '#1c0e22'; ctx.beginPath(); ctx.moveTo(ax - 8, ay); ctx.quadraticCurveTo(ax - 4, ay - 70, ax - 40, ay - 130); ctx.lineTo(ax - 30, ay - 134); ctx.quadraticCurveTo(ax + 4, ay - 86, ax + 8, ay); ctx.closePath(); ctx.fill();
  for (const [ox, oy, rx, ry] of [[0, -150, 150, 26], [-80, -128, 90, 18], [90, -134, 80, 16], [-30, -170, 100, 18]]) { ctx.fillStyle = '#1c0e22'; ell(ctx, ax + ox - 30, ay + oy, rx, ry); ctx.fill(); }
  // dry grass ground with an earth ring and a long shadow
  ctx.fillStyle = vgrad(ctx, hz, H, [[0, '#b0642e'], [1, '#6a3a1e']]); ctx.fillRect(X0, hz, W, H - hz);
  for (let q = 0; q < 90; q++) { const gx = X0 + hash(q * 2.3) * W, gy = hz + 8 + hash(q * 4.1) * (H - hz - 8), h = 10 + hash(q) * 22 * (0.4 + (gy - hz) / (H - hz)); ctx.strokeStyle = `rgba(${220 + hash(q + 3) * 30},${170 + hash(q + 7) * 30},${80},0.5)`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.quadraticCurveTo(gx + 4 + Math.sin(t + q) * 2, gy - h * 0.6, gx + 7 + Math.sin(t * 1.3 + q) * 3, gy - h); ctx.stroke(); }
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(X0, hz, W, 4);
  const ry0 = hz + (H - hz) * 0.5; ctx.fillStyle = 'rgba(240,190,120,0.34)'; ell(ctx, cx, ry0 + 10, W * 0.42, (H - hz) * 0.34); ctx.fill(); ctx.strokeStyle = 'rgba(110,60,30,0.5)'; ctx.lineWidth = 6; ell(ctx, cx, ry0 + 10, W * 0.42, (H - hz) * 0.34); ctx.stroke();
  // stamp dust drifting out from the dancer's feet
  if (key === 'stamp' && v > 0.2) for (let q = 0; q < 9; q++) { const a = q / 9 * Math.PI, d = 30 + (1 - v) * 130; ctx.fillStyle = `rgba(214,170,120,${0.5 * v})`; circ(ctx, cx + (q % 2 ? 1 : -1) * 70 + Math.cos(a) * d, ry0 + 30 - Math.sin(a) * d * 0.32, 14 * v + 5); ctx.fill(); }
  ctx.fillStyle = rgrad(ctx, cx, hz + (H - hz) * 0.4, 8, W * 0.45, [[0, 'rgba(255,200,130,0.32)'], [1, 'rgba(255,200,130,0)']]); ctx.fillRect(X0, hz, W, H - hz);
  ctx.restore();
}

const ZONES = [['stamp', /stamp|stomp|bell/], ['step', /step|side|walk/], ['sway', /sway|lean|turn/], ['shake', /shake|rattle|ring/]];
registerDanceStage({
  id: 'bell-hero', match: /(bell|musya).*dancer|dancer.*bell|bell dancer/,
  build: (S, lanes, P) => createSceneStage('bell-hero', S, lanes, P, {
    tallRatio: 0.85,
    dress: () => ({ kind: 'planks', base: '#8a4a28', light: '#ffd0a0' }),
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 960 } : { w: 1180, h: 600 };
      const keyOf = assignZones(K, ZONES.map(([key, re]) => ({ key, re }))); const spots = new Array(K.N).fill(null);
      const k = tall ? 0.9 : 0.74, fy = tall ? 70 : 34, hz = tall ? 500 : 300, PR = tall ? 58 : 62;
      const by = tall ? { stamp: [-300, 892], step: [-100, 892], sway: [100, 892], shake: [300, 892] } : { stamp: [-480, 150], step: [-480, 420], sway: [480, 150], shake: [480, 420] };
      for (let i = 0; i < K.N; i++) { const p = by[keyOf[i]]; if (p) spots[i] = eSpot(p[0], p[1], PR, PR, 0, { apk: 1, extra: { noFill: true } }); }
      const st = {};
      return { ref, spots,
        draw(ctx, rt, g) {
          const t = rt.anim, env = envOf(rt, K, keyOf), [key, v] = dominant(env), side = flipSide(st, 'step', env.step ?? 0);
          savanna(ctx, areaInDesign(ctx, g.F, ref), t, hz, key, v);
          const P0 = pose(key, v, side), bellsShake = clamp(0.18 + (P0.shake ?? 0.15) * 0.9 + (key === 'stamp' || key === 'shake' ? v : 0), 0, 1.3);
          ctx.save(); ctx.translate(0, fy); ctx.scale(k, k);
          // the long shadow thrown to the left by the low sun
          ctx.save(); ctx.fillStyle = 'rgba(40,10,30,0.3)'; ctx.beginPath(); ctx.ellipse(-190, 770, 250, 15, 0, 0, TAU); ctx.fill(); ctx.restore();
          groundPool(ctx, 6, 764, 170, 20, 0.4);
          const Pp = { ...P0, hip: [P0.hip[0], P0.hip[1] + (key ? 0 : 4 * Math.sin(t * 5.6))] };
          drawFigure(ctx, Pp, costume(Pp, t, key, v, bellsShake), t);
          ctx.restore();
          lanes.forEach((l, i) => { if (spots[i]) pad(ctx, l, spots[i], rt.flash[i], laneIcon(l)); });
        } };
    },
  }),
});
void rgba; void ease; void rrect; void hgrad; void lighter;

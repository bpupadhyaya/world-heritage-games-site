// Gumboot dance, hero stage (1.24.0): a miner in a blue boiler suit, yellow hard hat with a lamp and tall white rubber boots, seen from the front, answering each
// lane with its movement: the stomp (a squat on both boots with a puff of earth), a slap on the left or the right boot (the leg is raised sideways and the opposite
// hand comes down on it), a clap (a small hop, hands meeting at the chest), a thigh slap. A mine yard behind: corrugated wall, work lamps, barrels, packed earth.
import { registerDanceStage } from './registry.js';
import { createSceneStage, eSpot, assignZones, areaInDesign } from './dance-kit.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, circ, ell, hash, TAU } from './dance-kit.js';
import { glow } from './art.js';
import { pad, laneIcon } from './dance-pad.js';
import { envOf, dominant, mixPose } from './hero-common.js';
import { ik2, ribbon, taper, headFront, footFront, handFront, groundPool, jingleRing, limb, armIK, lerp } from './figure-hero.js';

const GB = { skin: '#8f5a36', suit: '#3a5c92', suitD: '#243c66', boot: '#f3f2ec', hat: '#f2c01c', glove: '#d9a42a' };
const IDLE = { hip: [0, 432], lean: 0, hl: [-128, 470], hr: [128, 470], fl: [-76, 742], fr: [76, 742], tilt: 0 };
const TH = 165, SK = 150, SHY = 210, UA = 150, FA = 140;

function pose(key, v) {
  if (!key) return IDLE;
  let T = IDLE;
  if (key === 'stomp') T = { ...IDLE, hip: [0, 486], fl: [-120, 742], fr: [120, 742], hl: [-150, 420], hr: [150, 420], lean: 0 };
  else if (key === 'lb') T = { ...IDLE, hip: [34, 436], lean: -0.05, tilt: 0.05, fl: [-196, 616], fr: [84, 742], hl: [-262, 352], hr: [-176, 566] };
  else if (key === 'rb') T = { ...IDLE, hip: [-34, 436], lean: 0.05, tilt: -0.05, fr: [196, 616], fl: [-84, 742], hr: [262, 352], hl: [176, 566] };
  else if (key === 'thigh') T = { ...IDLE, hip: [0, 450], hr: [96, 528], hl: [-190, 430], fl: [-90, 742], fr: [112, 700], lean: 0.03 };
  else if (key === 'clap') T = { ...IDLE, hip: [0, 392], fl: [-66, 706], fr: [66, 706], hl: [-18, 292], hr: [18, 292] };
  return mixPose(IDLE, T, v);
}

function minerFigure2(ctx, P, t, key, v) {
  const hx = P.hip[0], hy = P.hip[1];
  groundPool(ctx, 8, 772, 220, 28, 0.5);
  // boots and trouser legs
  for (const sx of [-1, 1]) {
    const ft = sx < 0 ? P.fl : P.fr, ax = hx + sx * 50, ay = hy;
    const r = ik2(ax, ay, ft[0], ft[1] - 24, TH + 4, SK + 4, [ax + sx * 140, (ay + ft[1]) / 2 + 20]);
    const kn = r.mid, an = r.end, bt = [lerp(kn[0], an[0], 0.28), lerp(kn[1], an[1], 0.28)];
    ribbon(ctx, [[ax, ay + 4], [(ax + kn[0]) / 2, (ay + kn[1]) / 2], kn, bt], [104, 100, 92, 82], GB.suit, { fold: 2 });
    // the boot: tall white rubber from below the knee, a rolled cuff, a bright rim light
    ribbon(ctx, [bt, [lerp(bt[0], an[0], 0.55), lerp(bt[1], an[1], 0.55)], an], [88, 80, 72], GB.boot, { rim: 0.26, shadow: false });
    ctx.fillStyle = darker(GB.boot, 0.3); ell(ctx, bt[0], bt[1], 48, 14); ctx.fill();
    ctx.fillStyle = hgrad(ctx, bt[0] - 48, bt[0] + 48, [[0, '#b8bac0'], [0.35, '#ffffff'], [1, '#a4a8b0']]); ell(ctx, bt[0], bt[1] - 4, 46, 12); ctx.fill();
    ctx.fillStyle = '#d8402a'; ell(ctx, lerp(bt[0], an[0], 0.5), lerp(bt[1], an[1], 0.5), 36, 7); ctx.fill();
    jingleRing(ctx, lerp(bt[0], an[0], 0.78), lerp(bt[1], an[1], 0.78), 70, key === 'stomp' || key === 'clap' ? v : (sx < 0 ? key === 'lb' : key === 'rb') ? v : 0.1, t);
    footFront(ctx, an[0], an[1] - 2, { col: GB.boot, sole: '#26262c', turn: sx * 0.7, s: 1.12, lift: clamp((742 - ft[1]) / 100, 0, 1) });
  }
  // torso: boiler suit with reflective bands
  ctx.save(); ctx.translate(hx, 0);
  ctx.translate(0, hy - 30); ctx.rotate(P.lean); ctx.translate(0, -(hy - 30));
  const sy = SHY + (hy - 432) * 0.92, ty = hy - 8;
  ctx.beginPath(); ctx.moveTo(-90, sy + 8); ctx.bezierCurveTo(-46, sy - 28, 46, sy - 28, 90, sy + 8); ctx.bezierCurveTo(102, sy + 38, 96, sy + 78, 84, (sy + ty) / 2 + 6); ctx.bezierCurveTo(72, ty - 48, 74, ty - 12, 86, ty + 14); ctx.lineTo(-86, ty + 14); ctx.bezierCurveTo(-74, ty - 12, -72, ty - 48, -84, (sy + ty) / 2 + 6); ctx.bezierCurveTo(-96, sy + 78, -102, sy + 38, -90, sy + 8); ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.save(); ctx.translate(8, 10); ctx.fill(); ctx.restore();
  ctx.fillStyle = hgrad(ctx, -104, 104, [[0, GB.suitD], [0.3, lighter(GB.suit, 0.18)], [0.68, GB.suit], [1, GB.suitD]]); ctx.fill();
  ctx.strokeStyle = 'rgba(10,20,40,0.55)'; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.save(); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 2; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(k * 30, sy + 24); ctx.quadraticCurveTo(k * 34 + 4, (sy + ty) / 2, k * 28, ty); ctx.stroke(); }
  for (const yy of [sy + 112, sy + 136]) { ctx.fillStyle = '#d8dce2'; ctx.fillRect(-110, yy, 220, 10); ctx.fillStyle = 'rgba(255,255,170,0.8)'; ctx.fillRect(-110, yy + 3, 220, 3); }
  ctx.strokeStyle = '#aab4c4'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, sy - 6); ctx.lineTo(0, ty); ctx.stroke();
  ctx.fillStyle = darker(GB.suit, 0.2); rrect(ctx, 34, sy + 34, 44, 40, 5); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#3a2a1c'; rrect(ctx, -92, ty - 22, 184, 24, 7); ctx.fill(); ctx.fillStyle = '#d4a43a'; rrect(ctx, -17, ty - 25, 34, 30, 5); ctx.fill(); ctx.strokeStyle = '#6a4a14'; ctx.lineWidth = 2; ctx.stroke();
  // collar
  ctx.fillStyle = darker(GB.suit, 0.1); ctx.beginPath(); ctx.moveTo(-40, sy - 12); ctx.lineTo(0, sy + 24); ctx.lineTo(40, sy - 12); ctx.lineTo(30, sy - 22); ctx.lineTo(0, sy + 4); ctx.lineTo(-30, sy - 22); ctx.closePath(); ctx.fill();
  // arms: suit sleeves with a shoulder cap, a bent elbow, a leather cuff and a gloved hand with spread fingers
  for (const sx of [-1, 1]) {
    const sh = [sx * 86, sy + 20], hd = sx < 0 ? P.hl : P.hr;
    const rr = armIK(sh, hd, UA, FA, sx, 70);
    limb(ctx, sh, rr.mid, rr.end, [62, 50, 38], GB.suit, { cap: GB.suit, joint: false, cuff: darker(GB.glove, 0.15), fold: 1 });
    const ang = Math.atan2(rr.end[1] - rr.mid[1], rr.end[0] - rr.mid[0]);
    handFront(ctx, rr.end[0] + Math.cos(ang) * 30, rr.end[1] + Math.sin(ang) * 30, ang, 84, { skin: GB.glove, open: 0.5, curl: 0.22, side: sx });
  }
  ctx.restore();
  // neck and head
  const nx = hx + P.lean * 20, ny = (hy - 432) * 0.92;
  ctx.save(); ctx.translate(nx, ny); ctx.rotate(P.tilt + P.lean * 0.4);
  ctx.fillStyle = rgrad(ctx, 0, 176, 0, 60, [[0, lighter(GB.skin, 0.1)], [1, darker(GB.skin, 0.4)]]); rrect(ctx, -26, 130, 52, 74, 14); ctx.fill();
  headFront(ctx, 0, 92, 50, 60, {
    skin: GB.skin, turn: 0.15, jaw: 0.45, smile: 1,
    hairFront: (c) => {
            // hard hat: a yellow dome with a ridge, a brim and a lamp that glows
      c.fillStyle = 'rgba(0,0,0,0.3)'; ell(c, 8, -28, 80, 22); c.fill();
      c.fillStyle = hgrad(c, -76, 76, [[0, '#a07810'], [0.3, '#ffd23a'], [0.7, GB.hat], [1, '#8a6a10']]);
      c.beginPath(); c.moveTo(-70, -26); c.bezierCurveTo(-70, -96, 70, -96, 70, -26); c.closePath(); c.fill();
      c.fillStyle = hgrad(c, -90, 90, [[0, '#9a7410'], [0.4, '#f6c42a'], [1, '#8a6a10']]); rrect(c, -88, -34, 176, 20, 10); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.42)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-50, -52); c.quadraticCurveTo(-20, -76, 14, -76); c.stroke();
      c.fillStyle = '#6a5008'; rrect(c, -6, -80, 12, 44, 3); c.fill();
      c.fillStyle = '#fff8c8'; circ(c, 0, -42, 14); c.fill(); c.strokeStyle = '#6a5008'; c.lineWidth = 3; c.stroke();
      c.fillStyle = rgba('#fff8c8', 0.26 + 0.2 * Math.sin(t * 4)); circ(c, 0, -42, 30); c.fill();
    },
  });
  ctx.restore();
}

function mineYard(ctx, A, t, hz) {
  const X0 = A.x0, X1 = A.x1, W = X1 - X0, Y0 = A.y0, H = A.y1, cx = (X0 + X1) / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0, W, H - Y0); ctx.clip();
  ctx.fillStyle = vgrad(ctx, Y0, hz, [[0, '#1a1e26'], [1, '#363c48']]); ctx.fillRect(X0, Y0, W, hz - Y0);
  for (let x = X0; x < X1; x += 24) { ctx.fillStyle = hgrad(ctx, x, x + 24, [[0, 'rgba(255,255,255,0.12)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.32)']]); ctx.fillRect(x, Y0, 24, hz - Y0); }
  ctx.fillStyle = 'rgba(14,18,24,0.92)'; for (const px of [X0 + 34, X1 - 34]) ctx.fillRect(px - 14, Y0, 28, hz - Y0 + 40);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 7; const by = Y0 + (hz - Y0) * 0.5; ctx.beginPath(); ctx.moveTo(X0, by); ctx.lineTo(X1, by); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X0, by - 5); ctx.lineTo(X1, by - 5); ctx.stroke();
  // a headframe silhouette (wheel and cage) in the wall's haze
  ctx.strokeStyle = 'rgba(8,10,14,0.7)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(cx - 220, hz); ctx.lineTo(cx - 100, Y0 + 70); ctx.lineTo(cx + 100, Y0 + 70); ctx.lineTo(cx + 220, hz); ctx.stroke(); circ(ctx, cx, Y0 + 90, 44); ctx.stroke();
  ctx.save(); ctx.translate(cx, Y0 + 90); ctx.rotate(t * 0.6); for (let k = 0; k < 6; k++) { ctx.rotate(TAU / 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(44, 0); ctx.stroke(); } ctx.restore();
  // work lamps on a string
  ctx.strokeStyle = '#0c0c10'; ctx.lineWidth = 3; ctx.beginPath(); for (let k = 0; k <= 30; k++) { const x = X0 + k / 30 * W, y = Y0 + 36 + Math.sin(k / 30 * Math.PI) * 34; if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
  const nb = Math.max(5, Math.floor(W / 150));
  for (let k = 0; k < nb; k++) { const u = (k + 0.5) / nb, x = X0 + u * W, y = Y0 + 36 + Math.sin(u * Math.PI) * 34 + 8, fl = 0.85 + 0.15 * Math.sin(t * 7 + k * 2.3); glow(ctx, x, y + 8, 90, '#ffd27a', 0.4 * fl); ctx.fillStyle = '#ffe9a8'; circ(ctx, x, y + 8, 7); ctx.fill(); ctx.fillStyle = '#4a4a52'; rrect(ctx, x - 6, y - 8, 12, 9, 3); ctx.fill(); }
  // barrels and a crate
  for (const [bx, sc] of [[X0 + 100, 1], [X0 + 175, 0.8], [X1 - 110, 1]]) { const by2 = hz + 6; ctx.fillStyle = 'rgba(0,0,0,0.4)'; ell(ctx, bx + 6, by2 + 6, 52 * sc, 12 * sc); ctx.fill(); ctx.fillStyle = hgrad(ctx, bx - 40 * sc, bx + 40 * sc, [[0, '#4a3020'], [0.35, '#8a5a34'], [1, '#3a2418']]); rrect(ctx, bx - 40 * sc, by2 - 80 * sc, 80 * sc, 82 * sc, 12 * sc); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 3; for (const yy of [by2 - 62 * sc, by2 - 16 * sc]) { ctx.beginPath(); ctx.moveTo(bx - 40 * sc, yy); ctx.lineTo(bx + 40 * sc, yy); ctx.stroke(); } }
  // packed earth with stones, a wet sheen and a pool of light under the miner
  ctx.fillStyle = vgrad(ctx, hz, H, [[0, '#4e443a'], [1, '#2a241e']]); ctx.fillRect(X0, hz, W, H - hz);
  for (let k = 0; k < 70; k++) { const x = X0 + hash(k * 3.1) * W, y = hz + 14 + hash(k * 5.3 + 2) * (H - hz - 14), r = 3 + hash(k) * 7; ctx.fillStyle = `rgba(${150 + 60 * hash(k + 4)},${130 + 40 * hash(k + 8)},${100 + 30 * hash(k + 1)},0.22)`; ell(ctx, x, y, r * 1.6, r); ctx.fill(); }
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(X0, hz, W, 5);
  ctx.fillStyle = rgrad(ctx, cx, hz + (H - hz) * 0.4, 10, W * 0.5, [[0, 'rgba(255,214,140,0.32)'], [1, 'rgba(255,214,140,0)']]); ctx.fillRect(X0, hz, W, H - hz);
  ctx.restore();
}

const ZONES = [['stomp', /stomp|heel|ground|foot/], ['lb', /left/], ['rb', /right/], ['clap', /clap|hand|palm/], ['thigh', /thigh|knee|slap/]];
registerDanceStage({
  id: 'gumboot-hero', match: /gumboot.*dancer|dancer.*gumboot|isicathulo.*dancer/,
  build: (S, lanes, P) => createSceneStage('gumboot-hero', S, lanes, P, {
    tallRatio: 0.85,
    dress: () => ({ kind: 'stone', base: '#4a4844', accent: '#6a665e', size: 130, light: '#ffe6b8' }),
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 960 } : { w: 1180, h: 600 };
      const keyOf = assignZones(K, ZONES.map(([key, re]) => ({ key, re }))); const spots = new Array(K.N).fill(null);
      const k = tall ? 1.0 : 0.76, fy = tall ? 40 : 30, hz = tall ? 520 : 318, PR = tall ? 62 : 64;
      const row = tall ? [-300, -150, 0, 150, 300] : null;
      const present = ['stomp', 'lb', 'rb', 'clap', 'thigh'].filter((q) => keyOf.includes(q));
      const by = {};
      if (tall) present.forEach((q, i) => { by[q] = [(i - (present.length - 1) / 2) * (present.length > 4 ? 150 : 180), 890]; });
      else Object.assign(by, { clap: [-470, 150], lb: [-470, 420], thigh: [470, 150], rb: [470, 420], stomp: [-300, 500] }, present.length < 5 ? { stomp: [470, 420], rb: [470, 150] } : {});
      void row;
      for (let i = 0; i < K.N; i++) { const p = by[keyOf[i]]; if (p) spots[i] = eSpot(p[0], p[1], PR, PR, 0, { apk: 1, extra: { noFill: true } }); }
      const st = { dust: 0, last: 0 };
      return { ref, spots,
        draw(ctx, rt, g) {
          const t = rt.anim; mineYard(ctx, areaInDesign(ctx, g.F, ref), t, hz);
          const env = envOf(rt, K, keyOf), [key, v] = dominant(env);
          const bob = key ? 0 : 5 * Math.sin(t * 6.1), P0 = pose(key, v);
          ctx.save(); ctx.translate(0, fy); ctx.scale(k, k);
          minerFigure2(ctx, { ...P0, hip: [P0.hip[0], P0.hip[1] + bob] }, t, key, v);
          if (key === 'stomp' && v > 0.5) for (const sx of [-1, 1]) for (let q = 0; q < 6; q++) { const a = q / 6 * Math.PI, d = 40 + (1 - v) * 90; ctx.fillStyle = `rgba(190,170,130,${0.5 * v})`; circ(ctx, sx * 120 + Math.cos(a) * d * sx, 760 - Math.sin(a) * d * 0.5, 12 * v + 4); ctx.fill(); }
          ctx.restore();
          lanes.forEach((l, i) => { if (spots[i]) pad(ctx, l, spots[i], rt.flash[i], laneIcon(l)); });
        } };
    },
  }),
});
void mix; void taper;

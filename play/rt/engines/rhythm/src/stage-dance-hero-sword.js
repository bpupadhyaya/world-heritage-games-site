// Highland sword dance, hero stage (1.24.0): a dancer in a tartan kilt, black doublet, white hose and ghillie brogues stands over two swords laid crossed on a
// polished floor (seen a little from above, so the cross is a flattened X and the four spaces between the blades are four places). A lane is a place: Back (the
// dancer's start), Left, Right, Front, and Cross (the spring over the blades). The working foot lands in its place with the toe pointed, the other foot rises to the
// knee, and one arm arches overhead as in the Highland fling; the body travels between places with a small depth scale. Hall behind: panelled wall, tartan banner,
// a window on misty hills, candle sconces.
import { registerDanceStage } from './registry.js';
import { createSceneStage, eSpot, assignZones, areaInDesign } from './dance-kit.js';
import { clamp, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, circ, ell, hash, TAU } from './dance-kit.js';
import { glow } from './art.js';
import { pad, laneIcon } from './dance-pad.js';
import { envOf, dominant, mixPose } from './hero-common.js';
import { ik2, ribbon, headFront, footFront, handFront, groundPool, lerp, ease } from './figure-hero.js';

const SC = { skin: '#e2b08c', coat: '#14141c', hose: '#efe8d6', kiltA: '#9b1b24', kiltB: '#1d4a2e', kiltC: '#1c2c64', shoe: '#150f0c' };
const TH = 165, SK = 150, SHY = 208, UA = 148, FA = 138;
const CY = 770;   // the floor line of the cross (figure space)
// body offsets and foot targets per place (local figure space; the body is translated by off)
const IDLE = { off: [0, -38], hip: [0, 414], fl: [-56, 742], fr: [56, 742], hl: [-92, 400], hr: [92, 400], lean: 0, up: 0 };

function pose(key, v, side) {
  if (!key) return IDLE;
  let T = IDLE;
  const s = side;   // which arm arches (flips each strike)
  const arms = s > 0 ? { hl: [-96, 402], hr: [78, 6] } : { hl: [-78, 6], hr: [96, 402] };
  if (key === 'back') T = { ...IDLE, ...arms, off: [0, -44], fl: [-40, 742], fr: [30, 604], lean: 0.02 };
  else if (key === 'front') T = { ...IDLE, ...arms, off: [0, 96], fl: [38, 742], fr: [-36, 604], hip: [0, 416], lean: -0.02 };
  else if (key === 'left') T = { ...IDLE, ...arms, off: [-100, 24], fl: [-30, 742], fr: [-40, 606], hip: [-8, 416], lean: 0.04 };
  else if (key === 'right') T = { ...IDLE, ...arms, off: [100, 24], fr: [30, 742], fl: [40, 606], hip: [8, 416], lean: -0.04 };
  else if (key === 'cross') T = { ...IDLE, hl: [-78, 6], hr: [78, 6], off: [0, -40], up: 120, fl: [-52, 650], fr: [52, 650] };
  return mixPose(IDLE, T, v);
}

function tartan(ctx, x0, y0, x1, y1, step) {
  ctx.fillStyle = SC.kiltA; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.globalAlpha = 0.85; ctx.fillStyle = SC.kiltB; for (let x = x0; x < x1; x += step * 2) ctx.fillRect(x, y0, step * 0.8, y1 - y0); for (let y = y0; y < y1; y += step * 2) ctx.fillRect(x0, y, x1 - x0, step * 0.8);
  ctx.globalAlpha = 0.7; ctx.fillStyle = SC.kiltC; for (let x = x0 + step * 1.1; x < x1; x += step * 2) ctx.fillRect(x, y0, step * 0.35, y1 - y0); for (let y = y0 + step * 1.1; y < y1; y += step * 2) ctx.fillRect(x0, y, x1 - x0, step * 0.35);
  ctx.globalAlpha = 0.8; ctx.fillStyle = '#e8c84a'; for (let x = x0 + step * 0.5; x < x1; x += step * 2) ctx.fillRect(x, y0, 1.6, y1 - y0); for (let y = y0 + step * 0.5; y < y1; y += step * 2) ctx.fillRect(x0, y, x1 - x0, 1.6);
  ctx.globalAlpha = 1;
}

function dancer(ctx, P, t, key, v) {
  const hx = P.hip[0], hy = P.hip[1] - P.up * (key === 'cross' ? v : 0);
  // legs: bare knee above white hose
  for (const sx of [-1, 1]) {
    const ft = sx < 0 ? P.fl : P.fr, ax = hx + sx * 44, ay = hy, up = key === 'cross' ? P.up * v : 0;
    const r = ik2(ax, ay, ft[0], ft[1] - 24 - 0, TH + 6, SK + 4, [ax + sx * 120, (ay + ft[1]) / 2 + 20]);
    const kn = r.mid, an = r.end;
    ribbon(ctx, [[ax, ay], [(ax + kn[0]) / 2, (ay + kn[1]) / 2], kn], [78, 72, 62], SC.skin, { shadow: false });
    const k0 = [lerp(kn[0], an[0], 0.18), lerp(kn[1], an[1], 0.18)];
    ribbon(ctx, [k0, [lerp(k0[0], an[0], 0.5), lerp(k0[1], an[1], 0.5)], an], [64, 54, 44], SC.hose, { rim: 0.28 });
    // diced pattern and red garter flash on the hose
    ctx.save(); ctx.strokeStyle = 'rgba(190,40,50,0.42)'; ctx.lineWidth = 3;
    for (let q = 1; q < 7; q++) { const tt = q / 7, x = lerp(k0[0], an[0], tt), y = lerp(k0[1], an[1], tt), w = lerp(60, 42, tt) / 2; ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x + w, y + 8); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = '#b8201c'; const gx = lerp(k0[0], an[0], 0.14), gy = lerp(k0[1], an[1], 0.14); ctx.save(); ctx.translate(gx - sx * 30, gy + 4); ctx.rotate(0.3 * sx); rrect(ctx, -9, -4, 18, 40, 4); ctx.fill(); ctx.restore();
    footFront(ctx, an[0], an[1] - 2, { col: SC.shoe, sole: '#0a0605', turn: sx * 0.35, s: 0.98, lift: clamp((742 - ft[1]) / 100, 0, 1) });
    // pointed toe and crossed laces up the ankle
    ctx.strokeStyle = '#f4ecd8'; ctx.lineWidth = 2.4; for (let q = 0; q < 4; q++) { const yy = an[1] - 30 + q * 11; ctx.beginPath(); ctx.moveTo(an[0] - 14, yy); ctx.lineTo(an[0] + 14, yy + 8); ctx.moveTo(an[0] + 14, yy); ctx.lineTo(an[0] - 14, yy + 8); ctx.stroke(); }
    void up;
  }
  // the kilt: pleated tartan from the waist to just above the knee, swinging with the body
  const ty = hy - 36, sw = Math.sin(t * 4) * 3;
  ctx.save(); ctx.translate(hx, 0); ctx.translate(0, hy - 30); ctx.rotate(P.lean); ctx.translate(0, -(hy - 30));
  ctx.beginPath(); ctx.moveTo(-84, ty - 4); ctx.lineTo(84, ty - 4); ctx.bezierCurveTo(100, ty + 60, 122 + sw, ty + 100, 128 + sw, ty + 150); ctx.quadraticCurveTo(0, ty + 176, -128 - sw, ty + 150); ctx.bezierCurveTo(-122 - sw, ty + 100, -100, ty + 60, -84, ty - 4); ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.save(); ctx.translate(8, 10); ctx.fill(); ctx.restore();
  ctx.save(); ctx.clip(); tartan(ctx, -140, ty - 6, 140, ty + 180, 13);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2.4; for (let q = -9; q <= 9; q++) { ctx.beginPath(); ctx.moveTo(q * 9.4, ty); ctx.lineTo(q * 14 + sw * q * 0.06, ty + 170); ctx.stroke(); }
  ctx.fillStyle = hgrad(ctx, -140, 140, [[0, 'rgba(0,0,0,0.35)'], [0.3, 'rgba(255,255,255,0.1)'], [0.7, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.4)']]); ctx.fillRect(-140, ty - 6, 280, 190);
  ctx.restore();
  ctx.strokeStyle = 'rgba(10,6,4,0.6)'; ctx.lineWidth = 2; ctx.stroke();
  // belt and buckle
  ctx.fillStyle = '#1a1210'; rrect(ctx, -88, ty - 22, 176, 20, 5); ctx.fill(); ctx.fillStyle = '#c8cdd6'; rrect(ctx, -16, ty - 24, 32, 24, 4); ctx.fill();
  // doublet: black velvet, silver buttons, a white jabot at the neck, cutaway front
  const sy = SHY + (hy - 430) * 0.92;
  ctx.beginPath(); ctx.moveTo(-100, sy); ctx.bezierCurveTo(-46, sy - 24, 46, sy - 24, 100, sy); ctx.bezierCurveTo(106, sy + 80, 92, ty - 70, 86, ty - 20); ctx.lineTo(-86, ty - 20); ctx.bezierCurveTo(-92, ty - 70, -106, sy + 80, -100, sy); ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.save(); ctx.translate(8, 10); ctx.fill(); ctx.restore();
  ctx.fillStyle = hgrad(ctx, -104, 104, [[0, '#07070c'], [0.28, '#2a2a38'], [0.66, SC.coat], [1, '#050508']]); ctx.fill();
  ctx.strokeStyle = 'rgba(120,120,150,0.4)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.save(); ctx.clip();
  ctx.fillStyle = '#f2eee2'; ctx.beginPath(); ctx.moveTo(-26, sy - 4); ctx.lineTo(26, sy - 4); ctx.lineTo(20, sy + 120); ctx.lineTo(-20, sy + 120); ctx.closePath(); ctx.fill();   // white shirt front
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1.5; for (let q = -2; q <= 2; q++) { ctx.beginPath(); ctx.moveTo(q * 8, sy); ctx.lineTo(q * 7, sy + 118); ctx.stroke(); }
  ctx.restore();
  for (let q = 0; q < 5; q++) { const by = sy + 22 + q * 24; ctx.fillStyle = rgrad(ctx, -34, by - 2, 0, 8, [[0, '#ffffff'], [1, '#8a909c']]); circ(ctx, -36, by, 6); ctx.fill(); circ(ctx, 36, by, 6); ctx.fill(); }
  // jabot cascade
  ctx.fillStyle = '#fbf8ef'; ctx.beginPath(); ctx.moveTo(-24, sy - 8); ctx.quadraticCurveTo(0, sy + 18, 24, sy - 8); ctx.quadraticCurveTo(28, sy + 56, 0, sy + 74); ctx.quadraticCurveTo(-28, sy + 56, -24, sy - 8); ctx.fill(); ctx.strokeStyle = 'rgba(120,110,90,0.5)'; ctx.lineWidth = 1.6; ctx.stroke();
  for (let q = 0; q < 4; q++) { ctx.beginPath(); ctx.moveTo(-18 + q * 3, sy + 8 + q * 14); ctx.quadraticCurveTo(0, sy + 18 + q * 14, 18 - q * 3, sy + 8 + q * 14); ctx.stroke(); }
  // sporran on a chain at the front of the kilt
  const sp = [Math.sin(t * 4) * 3 + (v > 0.3 ? -P.lean * 60 : 0), ty + 52];
  ctx.strokeStyle = '#b8bcc6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-60, ty - 6); ctx.quadraticCurveTo(0, ty + 26, 60, ty - 6); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, sp[0] + 5, sp[1] + 12, 34, 40); ctx.fill();
  ctx.fillStyle = rgrad(ctx, sp[0] - 8, sp[1] - 4, 2, 44, [[0, '#dcd2bc'], [0.6, '#9a8e78'], [1, '#4a4234']]); ell(ctx, sp[0], sp[1] + 10, 30, 38); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.4; for (let q = 0; q < 14; q++) { const a = q / 14 * Math.PI + 0.1; ctx.beginPath(); ctx.moveTo(sp[0] + Math.cos(a) * 8, sp[1] + 2); ctx.lineTo(sp[0] + Math.cos(a) * 28, sp[1] + 2 + Math.sin(a) * 40); ctx.stroke(); }
  ctx.fillStyle = rgrad(ctx, sp[0] - 6, sp[1] - 14, 1, 30, [[0, '#f4f6fa'], [1, '#7a808c']]); ctx.beginPath(); ctx.moveTo(sp[0] - 24, sp[1] - 18); ctx.lineTo(sp[0] + 24, sp[1] - 18); ctx.quadraticCurveTo(sp[0] + 26, sp[1] + 12, sp[0], sp[1] + 16); ctx.quadraticCurveTo(sp[0] - 26, sp[1] + 12, sp[0] - 24, sp[1] - 18); ctx.fill();
  // arms: black sleeves with white cuffs, hands raised in the fling
  for (const sx of [-1, 1]) {
    const sh = [sx * 94, sy + 12], hd = sx < 0 ? P.hl : P.hr;
    const rr = ik2(sh[0], sh[1], hd[0], hd[1], UA, FA, [sx * 190, Math.max(sh[1] + 40, (sh[1] + hd[1]) / 2 + (hd[1] < sh[1] ? -30 : 50))]);
    ribbon(ctx, [sh, [(sh[0] + rr.mid[0]) / 2, (sh[1] + rr.mid[1]) / 2], rr.mid, [(rr.mid[0] + rr.end[0]) / 2, (rr.mid[1] + rr.end[1]) / 2], rr.end], [60, 60, 56, 52, 44], SC.coat, { rim: 0.5, hl: false });
    const ang = Math.atan2(rr.end[1] - rr.mid[1], rr.end[0] - rr.mid[0]);
    ctx.save(); ctx.translate(rr.end[0], rr.end[1]); ctx.rotate(ang); ctx.fillStyle = '#fbf8ef'; rrect(ctx, -14, -26, 24, 52, 7); ctx.fill(); ctx.strokeStyle = 'rgba(120,110,90,0.5)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
    handFront(ctx, rr.end[0] + Math.cos(ang) * 28, rr.end[1] + Math.sin(ang) * 28, ang, 70, { skin: SC.skin, open: 0.3, curl: 0.2, side: sx });
  }
  ctx.restore();
  // neck and head with the bonnet
  const nx = hx + P.lean * 20, ny = (hy - 430) * 0.92;
  ctx.save(); ctx.translate(nx, ny); ctx.rotate(P.lean * 0.5);
  ctx.fillStyle = rgrad(ctx, 0, 176, 0, 60, [[0, lighter(SC.skin, 0.08)], [1, darker(SC.skin, 0.3)]]); rrect(ctx, -24, 130, 48, 72, 14); ctx.fill();
  headFront(ctx, 0, 92, 48, 58, {
    skin: SC.skin, turn: 0.1, jaw: 0.4,
    hairBack: (c) => { c.fillStyle = '#7a3a1a'; ell(c, 0, 8, 54, 62); c.fill(); },
    hairFront: (c) => {
      // red-brown sideburns, then a Glengarry bonnet: dark blue, a diced band, a red toorie and two black ribbon tails
      c.fillStyle = '#7a3a1a'; for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * 44, -20); c.quadraticCurveTo(d * 54, 8, d * 46, 34); c.lineTo(d * 38, 30); c.quadraticCurveTo(d * 44, 4, d * 38, -14); c.closePath(); c.fill(); }
      c.fillStyle = 'rgba(0,0,0,0.3)'; ell(c, 6, -30, 66, 20); c.fill();
      c.fillStyle = hgrad(c, -60, 60, [[0, '#0a1230'], [0.35, '#2a3c80'], [0.7, '#1c2c64'], [1, '#080e26']]);
      c.beginPath(); c.moveTo(-58, -26); c.bezierCurveTo(-60, -76, -20, -86, 8, -80); c.bezierCurveTo(46, -76, 62, -60, 58, -26); c.bezierCurveTo(30, -18, -30, -18, -58, -26); c.closePath(); c.fill();
      c.save(); c.clip(); c.fillStyle = '#b8201c'; c.fillRect(-60, -34, 120, 12); c.fillStyle = '#f2ecd8'; for (let q = -6; q < 6; q++) c.fillRect(q * 10 + 2, -34, 5, 6); for (let q = -6; q < 6; q++) c.fillRect(q * 10 + 7, -28, 5, 6); c.restore();
      c.fillStyle = rgrad(c, 6, -86, 0, 14, [[0, '#ff7a5a'], [1, '#8a1c10']]); circ(c, 6, -84, 12); c.fill();
      c.fillStyle = '#d8dce4'; circ(c, -34, -44, 7); c.fill();
      c.strokeStyle = '#0a0a10'; c.lineWidth = 9; c.lineCap = 'round'; for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * 52, -24); c.quadraticCurveTo(d * 64, 0, d * 56 + d * Math.sin(t * 4) * 4, 28); c.stroke(); }
    },
  });
  ctx.restore();
}

// a claymore seen on the floor: long tapered blade with a fuller, a basket hilt at one end (drawn in a flattened frame)
function blade(ctx, ang, len, sq, f) {
  ctx.save(); ctx.scale(1, sq); ctx.rotate(ang);
  const w = 20, x0 = -len / 2, x1 = len / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.moveTo(x0 + 80, -w / 2 + 14); ctx.lineTo(x1, 14); ctx.lineTo(x0 + 80, w / 2 + 14); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x0 + 80, -w / 2); ctx.lineTo(x1 - 50, -w * 0.4); ctx.lineTo(x1, 0); ctx.lineTo(x1 - 50, w * 0.4); ctx.lineTo(x0 + 80, w / 2); ctx.closePath();
  ctx.fillStyle = vgrad(ctx, -w / 2, w / 2, [[0, '#f8fafc'], [0.28, '#c8cdd6'], [0.55, '#8a909c'], [0.8, '#d6dbe3'], [1, '#6a707c']]); ctx.fill();
  ctx.strokeStyle = 'rgba(30,34,44,0.7)'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + 92, 0); ctx.lineTo(x1 - 60, 0); ctx.stroke();
  ctx.save(); ctx.translate(x0, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; ell(ctx, 46, 12, 44, 34); ctx.fill();
  ctx.fillStyle = vgrad(ctx, -34, 34, [[0, '#6a4a14'], [0.5, '#d6b04a'], [1, '#5a3a0c']]); ell(ctx, 42, 0, 42, 34); ctx.fill();
  ctx.fillStyle = rgrad(ctx, 42, 0, 4, 34, [[0, '#0c0a08'], [1, '#2a2218']]); ell(ctx, 42, 0, 33, 25); ctx.fill();
  ctx.strokeStyle = '#e0bc58'; ctx.lineWidth = 4; for (let q = -3; q <= 3; q++) { ctx.beginPath(); ctx.moveTo(10, q * 7); ctx.quadraticCurveTo(42, q * 10, 74, q * 7); ctx.stroke(); }
  ctx.fillStyle = '#4a2a14'; rrect(ctx, -40, -6, 50, 12, 6); ctx.fill(); ctx.fillStyle = '#e0bc58'; circ(ctx, -44, 0, 10); ctx.fill();
  ctx.restore();
  if (f > 0.05) { ctx.strokeStyle = `rgba(255,255,230,${0.8 * f})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-len * 0.25, 0); ctx.lineTo(len * 0.38, 0); ctx.stroke(); }
  ctx.restore();
}

function hall(ctx, A, t, hz, tall) {
  const X0 = A.x0, X1 = A.x1, W = X1 - X0, Y0 = A.y0, H = A.y1, cx = (X0 + X1) / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0, W, H - Y0); ctx.clip();
  // panelled wall: dark oak with raised panels and a plate rail
  ctx.fillStyle = vgrad(ctx, Y0, hz, [[0, '#241810'], [1, '#3a2616']]); ctx.fillRect(X0, Y0, W, hz - Y0);
  const pw = 150; for (let x = X0 + 20; x < X1; x += pw) { ctx.fillStyle = 'rgba(255,220,170,0.06)'; rrect(ctx, x, Y0 + 150, pw - 24, hz - Y0 - 190, 8); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = 'rgba(255,220,170,0.12)'; ctx.lineWidth = 1.6; ctx.strokeRect(x + 8, Y0 + 158, pw - 40, hz - Y0 - 206); }
  ctx.fillStyle = '#1a100a'; ctx.fillRect(X0, Y0 + 138, W, 14);
  // a window onto misty hills (arched), a tartan banner on each side
  const wx = cx, wy = Y0 + 40, ww = tall ? 220 : 260, wh = 290;
  ctx.save(); ctx.beginPath(); ctx.moveTo(wx - ww / 2, wy + wh); ctx.lineTo(wx - ww / 2, wy + 90); ctx.arc(wx, wy + 90, ww / 2, Math.PI, 0); ctx.lineTo(wx + ww / 2, wy + wh); ctx.closePath(); ctx.clip();
  ctx.fillStyle = vgrad(ctx, wy, wy + wh, [[0, '#9fb4c8'], [0.6, '#d8dfe4'], [1, '#c8d0d4']]); ctx.fillRect(wx - ww / 2, wy, ww, wh);
  for (const [c, y, a] of [['#8a9aaa', 150, 0.8], ['#6a7e8e', 190, 0.9], ['#4a6070', 226, 1]]) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(wx - ww / 2, wy + wh); ctx.lineTo(wx - ww / 2, wy + y); for (let q = 0; q <= 8; q++) ctx.lineTo(wx - ww / 2 + q / 8 * ww, wy + y - 30 * Math.sin(q * 1.3 + y) * a); ctx.lineTo(wx + ww / 2, wy + wh); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = '#120a06'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(wx - ww / 2, wy + wh); ctx.lineTo(wx - ww / 2, wy + 90); ctx.arc(wx, wy + 90, ww / 2, Math.PI, 0); ctx.lineTo(wx + ww / 2, wy + wh); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(wx, wy + 90 - ww / 2); ctx.lineTo(wx, wy + wh); ctx.moveTo(wx - ww / 2, wy + 170); ctx.lineTo(wx + ww / 2, wy + 170); ctx.lineWidth = 7; ctx.stroke();
  for (const bx of [cx - (tall ? 290 : 470), cx + (tall ? 290 : 470)]) {
    if (bx < X0 + 40 || bx > X1 - 40) continue;
    ctx.save(); ctx.beginPath(); ctx.moveTo(bx - 52, wy); ctx.lineTo(bx + 52, wy); ctx.lineTo(bx + 52, wy + 300); ctx.lineTo(bx, wy + 340); ctx.lineTo(bx - 52, wy + 300); ctx.closePath(); ctx.clip(); tartan(ctx, bx - 56, wy, bx + 56, wy + 344, 16); ctx.restore();
    ctx.strokeStyle = '#e8c04a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(bx - 56, wy); ctx.lineTo(bx + 56, wy); ctx.stroke();
  }
  // wall sconces with candle glow
  for (const sx of [-1, 1]) for (const dx of tall ? [150] : [180, 380]) { const x = cx + sx * (tall ? 200 : dx + 100), y = Y0 + 170; if (x < X0 + 20 || x > X1 - 20) continue; const fl = 0.8 + 0.2 * Math.sin(t * 9 + x); glow(ctx, x, y, 90, '#ffc878', 0.5 * fl); ctx.fillStyle = '#c8a040'; rrect(ctx, x - 5, y + 4, 10, 30, 3); ctx.fill(); ctx.fillStyle = '#fff4d0'; rrect(ctx, x - 4, y - 14, 8, 20, 2); ctx.fill(); ctx.fillStyle = '#ffd24a'; ell(ctx, x, y - 20, 4, 8 * fl); ctx.fill(); }
  // polished floor: planks running away to the wall with a warm reflection
  ctx.fillStyle = vgrad(ctx, hz, H, [[0, '#2a1a10'], [1, '#5a3a20']]); ctx.fillRect(X0, hz, W, H - hz);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 3;
  for (let k = -14; k <= 14; k++) { ctx.beginPath(); ctx.moveTo(cx + k * 34, hz); ctx.lineTo(cx + k * 130, H); ctx.stroke(); }
  for (let y = hz + 30, d = 30; y < H; y += d, d *= 1.28) { ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(X1, y); ctx.stroke(); }
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(X0, hz, W, 6);
  ctx.fillStyle = rgrad(ctx, cx, hz + (H - hz) * 0.5, 10, W * 0.55, [[0, 'rgba(255,214,150,0.34)'], [1, 'rgba(255,214,150,0)']]); ctx.fillRect(X0, hz, W, H - hz);
  ctx.restore();
}

const ZONES = [['cross', /cross|centre|center|spring|high/], ['back', /back|behind/], ['left', /left/], ['front', /front|forward/], ['right', /right/]];
registerDanceStage({
  id: 'sword-hero', match: /sword.*dancer|dancer.*sword|gillie|ghillie.*dancer/,
  build: (S, lanes, P) => createSceneStage('sword-hero', S, lanes, P, {
    tallRatio: 0.85,
    dress: () => ({ kind: 'planks', base: '#4a2c18', light: '#ffe0b0' }),
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 960 } : { w: 1180, h: 600 };
      const keyOf = assignZones(K, ZONES.map(([key, re]) => ({ key, re }))); const spots = new Array(K.N).fill(null);
      const k = tall ? 0.95 : 0.66, fy = tall ? 46 : 4, hz = tall ? 500 : 300, PR = tall ? 54 : 60;
      const by = tall ? { back: [-300, 906], left: [-150, 906], cross: [0, 906], front: [150, 906], right: [300, 906] } : { back: [-480, 150], left: [-480, 310], cross: [-480, 470], front: [480, 150], right: [480, 310] };
      for (let i = 0; i < K.N; i++) { const p = by[keyOf[i]]; if (p) spots[i] = eSpot(p[0], p[1], PR, PR, 0, { apk: 1, extra: { noFill: true } }); }
      const st = {};
      return { ref, spots,
        draw(ctx, rt, g) {
          const t = rt.anim, A = areaInDesign(ctx, g.F, ref); hall(ctx, A, t, hz, tall);
          const env = envOf(rt, K, keyOf), [key, v] = dominant(env);
          const flip = (st.flip ??= { side: 1, prev: 0 }); const ev = key ? env[key] : 0; if (ev > 0.6 && flip.prev <= 0.6) flip.side = -flip.side; flip.prev = ev;
          const P0 = pose(key, v, flip.side), bob = key ? 0 : 4 * Math.sin(t * 5.4);
          const fl = (n) => { let m = 0; for (let i = 0; i < K.N; i++) if (keyOf[i] === n) m = Math.max(m, rt.flash[i]); return m; };
          ctx.save(); ctx.translate(0, fy); ctx.scale(k, k);
          // the crossed swords on the floor (flattened), under the dancer
          groundPool(ctx, 0, CY + 6, 360, 70, 0.3);
          ctx.save(); ctx.translate(0, CY); blade(ctx, 0.62, 700, 0.3, fl('cross')); blade(ctx, Math.PI - 0.62, 700, 0.3, fl('cross')); ctx.restore();
          const body = key === 'cross' ? lerp(0, 1, v) : 0;
          const oy = P0.off[1] + (key ? 0 : bob), sc = 1 + oy * 0.0006;
          ctx.save(); ctx.translate(P0.off[0], oy - (key === 'cross' ? 90 * ease(body) : 0)); ctx.translate(0, 742); ctx.scale(sc, sc); ctx.translate(0, -742);
          groundPool(ctx, 6, 770, 120, 18, 0.3);
          dancer(ctx, { ...P0, up: 0 }, t, key, v);
          ctx.restore();
          ctx.restore();
          lanes.forEach((l, i) => { if (spots[i]) pad(ctx, l, spots[i], rt.flash[i], laneIcon(l)); });
        } };
    },
  }),
});
void rgba; void hash; void TAU;

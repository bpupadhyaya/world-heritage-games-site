// Tinikling, hero stage (1.24.0): two long bamboo poles lie across the floor on two wooden blocks, held at the ends by two players who beat them on the blocks (Tap,
// Tap) and slide them together (Clap) in a three-beat bar. A dancer in a bright plaid skirt and a stiff butterfly-sleeved top hops between the poles: In (feet in
// the gap), Out (a hop to the front of the near pole), and a spring over the poles as they close. Seen from the front and a little above, so the gap between the poles
// is a visible stripe of floor that opens and closes; the poles are driven by the bar's beat (clock / spb), never by the real time.
import { registerDanceStage } from './registry.js';
import { createSceneStage, eSpot, assignZones, areaInDesign } from './dance-kit.js';
import { clamp, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, circ, ell, hash, TAU } from './dance-kit.js';
import { glow } from './art.js';
import { pad, laneIcon } from './dance-pad.js';
import { envOf, dominant, mixPose } from './hero-common.js';
import { ik2, ribbon, headFront, footFront, handFront, groundPool, stitchBand, limb, lerp, ease } from './figure-hero.js';

const TK = { skin: '#c98e63', top: '#f6f0e4', gold: '#e8b84a', red: '#c0261f', blk: '#1a1218', ylw: '#f0b41c' };
const TH = 165, SK = 150, SHY = 208, UA = 128, FA = 118;
const IDLE = { hip: [0, 430], fl: [-52, 742], fr: [52, 742], hl: [-146, 436], hr: [146, 436], lean: 0 };
function pose(key, hop) {
  let T = IDLE;
  if (key === 'in') T = { ...IDLE, fl: [-40, 742], fr: [40, 742], hl: [-224, 330], hr: [224, 330] };
  else if (key === 'out') T = { ...IDLE, hl: [-236, 300], hr: [236, 300], fl: [-60, 742], fr: [60, 742] };
  else if (key === 'tap') T = { ...IDLE, hl: [-176, 420], hr: [176, 420] };
  else if (key === 'clap') T = { ...IDLE, hl: [-230, 310], hr: [230, 310] };
  return T;
}

function bamboo(ctx, x0, x1, y, th, t, hi) {
  const L = x1 - x0;
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; rrect(ctx, x0 + 6, y - th / 2 + th * 0.55, L, th, th / 2); ctx.fill();
  ctx.fillStyle = vgrad(ctx, y - th / 2, y + th / 2, [[0, '#f2e6a0'], [0.2, '#d8c66a'], [0.55, '#a8922e'], [0.85, '#6a5a14'], [1, '#4a3c0c']]); rrect(ctx, x0, y - th / 2, L, th, th / 2); ctx.fill();
  ctx.strokeStyle = 'rgba(60,44,6,0.7)'; ctx.lineWidth = 1.6; ctx.stroke();
  const n = 5; for (let k = 0; k <= n; k++) { const x = x0 + (k + 0.5) * L / (n + 1) + (k % 2) * 8; ctx.fillStyle = 'rgba(60,44,6,0.55)'; ctx.fillRect(x - 3, y - th / 2 + 1, 6, th - 2); ctx.fillStyle = 'rgba(255,240,170,0.5)'; ctx.fillRect(x - 3, y - th / 2 + 1, 2, th - 2); }
  ctx.fillStyle = 'rgba(255,255,230,0.55)'; rrect(ctx, x0 + 12, y - th / 2 + th * 0.14, L - 24, th * 0.14, th * 0.07); ctx.fill();
  if (hi > 0.05) { ctx.strokeStyle = `rgba(255,248,210,${0.8 * hi})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x0 + 8, y); ctx.lineTo(x1 - 8, y); ctx.stroke(); }
  void t;
}

function dancer(ctx, P, t, hop) {
  const hx = P.hip[0], hy = P.hip[1];
  const lift = hop * 0.9, hopN = hop / 84;
  for (const sx of [-1, 1]) {
    const ft = sx < 0 ? P.fl : P.fr, ax = hx + sx * 38, ay = hy;
    const r = ik2(ax, ay, ft[0], ft[1] - 22 - lift, TH + 6, SK + 4, [ax + sx * 90, (ay + ft[1]) / 2 + 30]);
    ribbon(ctx, [[ax, ay], [(ax + r.mid[0]) / 2, (ay + r.mid[1]) / 2], r.mid, [(r.mid[0] + r.end[0]) / 2, (r.mid[1] + r.end[1]) / 2], r.end], [72, 68, 58, 44, 36], TK.skin, { shadow: false });
    footFront(ctx, r.end[0], r.end[1] - 2, { col: darker(TK.skin, 0.1), sole: '#8a5a3a', turn: sx * 0.5, s: 0.84, lift: clamp(lift / 80, 0, 1) });
    ctx.strokeStyle = '#e8b84a'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.ellipse(r.end[0], r.end[1] - 4, 17, 6, 0, 0, TAU); ctx.stroke();
  }
  // plaid skirt to the knee
  const ty = hy - 30, sw = Math.sin(t * 5) * 3 + hopN * 10;
  ctx.save(); ctx.translate(hx, 0);
  ctx.beginPath(); ctx.moveTo(-70, ty); ctx.lineTo(70, ty); ctx.bezierCurveTo(100, ty + 70, 138 + sw, ty + 140, 148 + sw, ty + 200); ctx.quadraticCurveTo(0, ty + 228 + hopN * 14, -148 - sw, ty + 200); ctx.bezierCurveTo(-138 - sw, ty + 140, -100, ty + 70, -70, ty); ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.save(); ctx.translate(8, 10); ctx.fill(); ctx.restore();
  ctx.save(); ctx.clip();
  ctx.fillStyle = TK.red; ctx.fillRect(-160, ty - 4, 320, 250);
  ctx.globalAlpha = 0.85; ctx.fillStyle = TK.blk; for (let x = -160; x < 160; x += 30) ctx.fillRect(x, ty - 4, 11, 250); for (let y = ty; y < ty + 240; y += 30) ctx.fillRect(-160, y, 320, 11);
  ctx.globalAlpha = 0.9; ctx.fillStyle = TK.ylw; for (let x = -146; x < 160; x += 30) ctx.fillRect(x, ty - 4, 3.2, 250); for (let y = ty + 14; y < ty + 240; y += 30) ctx.fillRect(-160, y, 320, 3.2);
  ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 2.4; for (let q = -8; q <= 8; q++) { ctx.beginPath(); ctx.moveTo(q * 8.5, ty); ctx.lineTo(q * 17 + sw * q * 0.05, ty + 230); ctx.stroke(); }
  ctx.fillStyle = hgrad(ctx, -150, 150, [[0, 'rgba(0,0,0,0.35)'], [0.3, 'rgba(255,255,255,0.12)'], [0.7, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.4)']]); ctx.fillRect(-160, ty - 4, 320, 250);
  ctx.restore();
  ctx.strokeStyle = 'rgba(20,6,6,0.6)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = TK.gold; ctx.fillRect(-150 - sw, ty + 188, 300 + 2 * sw, 7);
  // top and sash
  const sy = SHY + (hy - 430) * 0.92;
  ctx.beginPath(); ctx.moveTo(-86, sy); ctx.bezierCurveTo(-40, sy - 20, 40, sy - 20, 86, sy); ctx.bezierCurveTo(90, sy + 80, 76, ty - 60, 70, ty + 2); ctx.lineTo(-70, ty + 2); ctx.bezierCurveTo(-76, ty - 60, -90, sy + 80, -86, sy); ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.26)'; ctx.save(); ctx.translate(7, 9); ctx.fill(); ctx.restore();
  ctx.fillStyle = hgrad(ctx, -90, 90, [[0, '#bdb4a0'], [0.3, '#fffaf0'], [0.65, TK.top], [1, '#b2a690']]); ctx.fill(); ctx.strokeStyle = 'rgba(110,90,60,0.4)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(230,184,74,0.7)'; ctx.lineWidth = 2; for (let q = 0; q < 6; q++) { ctx.beginPath(); ctx.arc(0, sy + 4, 34 + q * 9, 0.15, Math.PI - 0.15); ctx.stroke(); } ctx.restore();
  ctx.fillStyle = TK.red; rrect(ctx, -76, ty - 22, 152, 24, 8); ctx.fill(); ctx.fillStyle = TK.gold; for (let q = -6; q <= 6; q++) { ctx.beginPath(); ctx.moveTo(q * 11, ty - 20); ctx.lineTo(q * 11 + 5, ty - 12); ctx.lineTo(q * 11, ty - 4); ctx.lineTo(q * 11 - 5, ty - 12); ctx.closePath(); ctx.fill(); }
  // butterfly sleeves: stiff gauze wings that stand out from the shoulders
  for (const sx of [-1, 1]) {
    const hd = sx < 0 ? P.hl : P.hr, sh = [sx * 84, sy + 8];
    const up = clamp((sh[1] - hd[1]) / 200, 0, 1);
    ctx.save(); ctx.translate(sh[0], sh[1]); ctx.scale(sx, 1);
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.bezierCurveTo(34, -40 - 30 * up, 100, -50 - 40 * up, 138, -6 - 30 * up); ctx.bezierCurveTo(150, 30, 120, 74, 84, 62); ctx.bezierCurveTo(50, 54, 20, 40, 0, 26); ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.save(); ctx.translate(6, 8); ctx.fill(); ctx.restore();
    ctx.fillStyle = rgrad(ctx, 40, 0, 4, 160, [[0, 'rgba(255,255,250,0.97)'], [0.7, 'rgba(244,238,226,0.93)'], [1, 'rgba(214,204,184,0.9)']]); ctx.fill(); ctx.strokeStyle = TK.gold; ctx.lineWidth = 3; ctx.stroke();
    ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(232,184,74,0.55)'; ctx.lineWidth = 1.8; for (let q = 0; q < 6; q++) { ctx.beginPath(); ctx.moveTo(4, 14); ctx.quadraticCurveTo(60, -20 + q * 14 - 30 * up, 140, 4 + q * 10 - 30 * up); ctx.stroke(); } ctx.restore();
    ctx.restore();
  }
  // arms: slim bare arms with a bent elbow coming out from under the gauze wings, hands open with spread fingers
  for (const sx of [-1, 1]) {
    const sh = [sx * 78, sy + 22], hd = sx < 0 ? P.hl : P.hr;
    const rr = ik2(sh[0], sh[1], hd[0], hd[1], UA, FA, [sx * 150, Math.max(sh[1] + 110, (sh[1] + hd[1]) / 2 + 70)]);
    limb(ctx, sh, rr.mid, rr.end, [38, 30, 22], TK.skin, { shadow: false, rim: 0.34 });
    ctx.strokeStyle = TK.gold; ctx.lineWidth = 4; ctx.beginPath(); { const a = Math.atan2(rr.end[1] - rr.mid[1], rr.end[0] - rr.mid[0]), px = rr.end[0] - Math.cos(a) * 6, py = rr.end[1] - Math.sin(a) * 6; ctx.ellipse(px, py, 15, 5, a + Math.PI / 2, 0, TAU); } ctx.stroke();
    const ang = Math.atan2(rr.end[1] - rr.mid[1], rr.end[0] - rr.mid[0]);
    handFront(ctx, rr.end[0] + Math.cos(ang) * 26, rr.end[1] + Math.sin(ang) * 26, ang, 74, { skin: TK.skin, open: 0.55, curl: 0.1, side: sx });
  }
  ctx.restore();
  // neck and head: hair in a bun with white flowers and a gold comb
  const nx = hx, ny = (hy - 430) * 0.92;
  ctx.save(); ctx.translate(nx, ny);
  ctx.fillStyle = rgrad(ctx, 0, 176, 0, 60, [[0, lighter(TK.skin, 0.1)], [1, darker(TK.skin, 0.35)]]); rrect(ctx, -20, 130, 40, 72, 14); ctx.fill();
  headFront(ctx, 0, 92, 46, 58, {
    skin: TK.skin, turn: 0.2, jaw: 0.1,
    hairBack: (c) => { c.fillStyle = '#120c0a'; ell(c, 0, -8, 51, 54); c.fill(); c.fillStyle = rgrad(c, -6, -76, 0, 30, [[0, '#3a2c28'], [1, '#0c0806']]); circ(c, 0, -62, 30); c.fill(); },
    hairFront: (c) => {
      c.fillStyle = '#120c0a'; c.beginPath(); c.moveTo(-54, 8); c.bezierCurveTo(-58, -50, -26, -64, 0, -62); c.bezierCurveTo(26, -64, 58, -50, 54, 8); c.bezierCurveTo(46, -20, 26, -30, 0, -30); c.bezierCurveTo(-26, -30, -46, -20, -54, 8); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(214,176,140,0.35)'; c.lineWidth = 1.6; for (let q = -5; q <= 5; q++) { c.beginPath(); c.moveTo(q * 4, -30); c.quadraticCurveTo(q * 9, -48, q * 10, -62); c.stroke(); }
      for (let q = 0; q < 5; q++) { const a = -0.4 - q * 0.5, fx = Math.cos(a) * 34 - 4, fy = -62 + Math.sin(a) * 16 - 4; for (let p = 0; p < 5; p++) { const b = p / 5 * TAU; c.fillStyle = '#fffdf4'; ell(c, fx + Math.cos(b) * 7, fy + Math.sin(b) * 7, 5, 3); c.fill(); } c.fillStyle = '#f0c040'; circ(c, fx, fy, 3); c.fill(); }
      c.strokeStyle = TK.gold; c.lineWidth = 5; c.beginPath(); c.moveTo(-36, -46); c.quadraticCurveTo(0, -62, 36, -46); c.stroke();
      for (const d of [-1, 1]) { c.fillStyle = TK.gold; circ(c, d * 48, 26, 5); c.fill(); }
    },
  });
  ctx.restore();
}

// a kneeling pole holder (1.25.0): the whole person sits back on the heels at one end of the poles: a draped red cloth over the folded legs with the knees showing, a cream
// embroidered shirt, shoulders, a head with a calm face, and two bent arms down to the pole ends. Drawn in a local frame (ground at 0, up is negative) scaled by s;
// the hand targets arrive in world coordinates and are converted.
function kneeler(ctx, bx, gy, sx, s, yFar, yNear, span, skin, hat) {
  ctx.save(); ctx.translate(bx, gy); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.32)'; ell(ctx, 8, 6, 124, 20); ctx.fill();
  // folded legs under a wrapped cloth: a low mound with two lit knees and fold lines
  ctx.beginPath(); ctx.moveTo(-112, -2); ctx.bezierCurveTo(-122, -52, -92, -104, -60, -124); ctx.lineTo(60, -124); ctx.bezierCurveTo(92, -104, 122, -52, 112, -2); ctx.quadraticCurveTo(0, 20, -112, -2); ctx.closePath();
  ctx.fillStyle = hgrad(ctx, -120, 120, [[0, '#4a1210'], [0.3, '#b02a22'], [0.65, '#9a2018'], [1, '#3c0e0c']]); ctx.fill(); ctx.strokeStyle = 'rgba(30,6,6,0.6)'; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#1a1018'; for (let x = -130; x < 130; x += 26) ctx.fillRect(x, -130, 8, 140); for (let y = -124; y < 20; y += 26) ctx.fillRect(-130, y, 260, 8); ctx.globalAlpha = 0.7; ctx.fillStyle = '#f0b41c'; for (let x = -118; x < 130; x += 26) ctx.fillRect(x, -130, 2.4, 140); ctx.globalAlpha = 1;
  for (const d of [-1, 1]) { ctx.fillStyle = rgrad(ctx, d * 58 - 10, -78, 2, 56, [[0, 'rgba(255,214,190,0.34)'], [1, 'rgba(0,0,0,0.26)']]); ell(ctx, d * 58, -62, 46, 42); ctx.fill(); }
  ctx.strokeStyle = 'rgba(20,4,4,0.4)'; ctx.lineWidth = 2.4; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * 20, -118); ctx.quadraticCurveTo(d * 36, -60, d * 28, 2); ctx.stroke(); }
  ctx.restore();
  // bare feet peeping out at the sides of the cloth
  for (const d of [-1, 1]) { ctx.fillStyle = rgrad(ctx, d * 108 - 4, -4, 1, 26, [[0, lighter(skin, 0.1)], [1, darker(skin, 0.4)]]); ell(ctx, d * 110, -4, 24, 11); ctx.fill(); }
  // arms: cream sleeves with an elbow, each ending at a pole end. The far-pole arm is drawn before the torso (its upper part hides behind the shirt, only the forearm
  // shows), the near-pole arm over it.
  const loc = (wx, wy) => [(wx - bx) / s, (wy - gy) / s];
  const arm = (ds) => {
    const yy = ds > 0 ? yNear : yFar, sh = [ds > 0 ? sx * 50 : -sx * 30, ds > 0 ? -238 : -226], hd = loc(sx * (span - (ds < 0 ? 85 * s : 0)), yy);
    const rr = ik2(sh[0], sh[1], hd[0], hd[1], 112, 106, ds < 0 ? [-sx * 40, -150] : [sh[0] + Math.sign(sh[0]) * 90, (sh[1] + hd[1]) / 2 + 20]);
    limb(ctx, sh, rr.mid, rr.end, [48, 38, 30], '#f4ecd8', { rim: 0.3, cap: ds > 0 ? '#f4ecd8' : null, cuff: '#e8d6b0' });
  };
  arm(-1);
  // torso: cream shirt, narrower at the waist, a red sash
  ctx.beginPath(); ctx.moveTo(-68, -246); ctx.bezierCurveTo(-30, -272, 30, -272, 68, -246); ctx.bezierCurveTo(76, -206, 62, -166, 56, -122); ctx.lineTo(-56, -122); ctx.bezierCurveTo(-62, -166, -76, -206, -68, -246); ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.26)'; ctx.save(); ctx.translate(6, 8); ctx.fill(); ctx.restore();
  ctx.fillStyle = hgrad(ctx, -76, 76, [[0, '#b8ae98'], [0.3, '#fbf5e6'], [0.7, '#eee4cc'], [1, '#a89e86']]); ctx.fill(); ctx.strokeStyle = 'rgba(110,92,64,0.45)'; ctx.lineWidth = 2; ctx.stroke();
  stitchBand(ctx, 0, -250, 0, -134, 16, '#c0261f', '#1c2c64', '#f4ecd8');
  ctx.fillStyle = '#c0261f'; rrect(ctx, -58, -136, 116, 18, 6); ctx.fill(); ctx.fillStyle = '#e8b84a'; for (let q = -4; q <= 4; q++) { ctx.beginPath(); ctx.moveTo(q * 13, -132); ctx.lineTo(q * 13 + 4, -127); ctx.lineTo(q * 13, -122); ctx.lineTo(q * 13 - 4, -127); ctx.closePath(); ctx.fill(); }
  // neck and head
  ctx.fillStyle = rgrad(ctx, 0, -270, 0, 40, [[0, lighter(skin, 0.1)], [1, darker(skin, 0.35)]]); rrect(ctx, -13, -290, 26, 44, 9); ctx.fill();
  ctx.save(); ctx.translate(0, -322); ctx.scale(0.72, 0.72);
  headFront(ctx, 0, 0, 46, 56, { skin, turn: -sx * 0.5, jaw: 0.4, hairBack: (c) => { c.fillStyle = '#16100c'; ell(c, 0, -6, 50, 56); c.fill(); },
    hairFront: (c) => { c.fillStyle = '#16100c'; c.beginPath(); c.moveTo(-50, 4); c.bezierCurveTo(-54, -48, -22, -62, 0, -60); c.bezierCurveTo(22, -62, 54, -48, 50, 4); c.bezierCurveTo(44, -20, 22, -32, 0, -30); c.bezierCurveTo(-22, -32, -44, -20, -50, 4); c.closePath(); c.fill();
      if (hat) { c.fillStyle = '#e8d49a'; ell(c, 0, -54, 74, 18); c.fill(); c.fillStyle = '#d8c078'; c.beginPath(); c.moveTo(-40, -54); c.quadraticCurveTo(0, -104, 40, -54); c.closePath(); c.fill(); c.strokeStyle = '#8a3a1c'; c.lineWidth = 5; c.beginPath(); c.moveTo(-40, -58); c.quadraticCurveTo(0, -50, 40, -58); c.stroke(); } } });
  ctx.restore();
  arm(1);
  ctx.restore();
}
// a hand closed around a pole end: palm, four fingers wrapped over the bamboo, thumb on top
function grip(ctx, x, y, sx) {
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, x + 3, y + 12, 26, 14); ctx.fill();
  ctx.fillStyle = rgrad(ctx, x - 8, y - 10, 2, 40, [[0, '#d8a47c'], [1, '#8a5a3a']]); rrect(ctx, x - 20, y - 14, 40, 28, 12); ctx.fill();
  for (let q = 0; q < 4; q++) { const fx = x - 18 + q * 12; ctx.fillStyle = rgrad(ctx, fx - 2, y - 4, 1, 14, [[0, '#dcaa82'], [1, '#8a5a3a']]); rrect(ctx, fx - 2, y - 16, 11, 34, 5); ctx.fill(); ctx.strokeStyle = 'rgba(60,30,10,0.55)'; ctx.lineWidth = 1.4; ctx.stroke(); }
  ctx.fillStyle = '#d0986c'; ell(ctx, x + sx * 18, y - 8, 11, 8); ctx.fill(); ctx.strokeStyle = 'rgba(60,30,10,0.5)'; ctx.stroke();
}
function hands(ctx, x, y, side) { grip(ctx, x, y, side); }

function floorScene(ctx, A, t, hz, cypc) {
  const X0 = A.x0, X1 = A.x1, W = X1 - X0, Y0 = A.y0, H = A.y1, cx = (X0 + X1) / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0, W, H - Y0); ctx.clip();
  // nipa-hut wall of woven sawali (a diamond weave), bamboo posts, hanging lanterns, banana leaves
  ctx.fillStyle = vgrad(ctx, Y0, hz, [[0, '#6a5a2c'], [1, '#a8924a']]); ctx.fillRect(X0, Y0, W, hz - Y0);
  ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0, W, hz - Y0); ctx.clip(); ctx.strokeStyle = 'rgba(60,44,10,0.4)'; ctx.lineWidth = 3; for (let k = -40; k < 60; k++) { ctx.beginPath(); ctx.moveTo(X0 + k * 34, Y0); ctx.lineTo(X0 + k * 34 + (hz - Y0), hz); ctx.stroke(); ctx.beginPath(); ctx.moveTo(X0 + k * 34 + (hz - Y0), Y0); ctx.lineTo(X0 + k * 34, hz); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,235,160,0.14)'; ctx.lineWidth = 1.6; for (let k = -40; k < 60; k++) { ctx.beginPath(); ctx.moveTo(X0 + k * 34 + 3, Y0); ctx.lineTo(X0 + k * 34 + 3 + (hz - Y0), hz); ctx.stroke(); } ctx.restore();
  for (const px of [X0 + 50, cx, X1 - 50]) { ctx.fillStyle = hgrad(ctx, px - 16, px + 16, [[0, '#4a3c0c'], [0.35, '#d8c66a'], [1, '#4a3c0c']]); ctx.fillRect(px - 16, Y0, 32, hz - Y0 + 20); for (let y = Y0 + 80; y < hz; y += 130) { ctx.fillStyle = 'rgba(40,28,4,0.6)'; ctx.fillRect(px - 17, y, 34, 6); } }
  for (const lx of [X0 + 170, X1 - 170, cx - 230, cx + 230]) { if (lx < X0 + 70 || lx > X1 - 70) continue; const sway = Math.sin(t * 1.4 + lx) * 4; ctx.strokeStyle = '#2a1a08'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, Y0); ctx.lineTo(lx + sway, Y0 + 70); ctx.stroke(); glow(ctx, lx + sway, Y0 + 100, 90, '#ffb040', 0.5); ctx.fillStyle = hgrad(ctx, lx + sway - 22, lx + sway + 22, [[0, '#a02010'], [0.4, '#f05a28'], [1, '#a02010']]); ell(ctx, lx + sway, Y0 + 100, 22, 30); ctx.fill(); ctx.fillStyle = '#e8b84a'; ctx.fillRect(lx + sway - 12, Y0 + 66, 24, 6); ctx.fillRect(lx + sway - 12, Y0 + 126, 24, 6); }
  for (const [lx, dir] of [[X0, 1], [X1, -1]]) for (let q = 0; q < 5; q++) { ctx.save(); ctx.translate(lx, hz - 40 - q * 50); ctx.rotate(dir * (-0.6 - q * 0.18) + Math.sin(t * 1.2 + q) * 0.04); ctx.fillStyle = q % 2 ? '#2f7a34' : '#3a9040'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(dir * 120, -26, dir * 230, 10); ctx.quadraticCurveTo(dir * 120, 30, 0, 12); ctx.fill(); ctx.strokeStyle = 'rgba(10,50,10,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(dir * 220, 8); ctx.stroke(); ctx.restore(); }
  // the floor: a woven banig mat in red, yellow and green diamonds
  ctx.fillStyle = vgrad(ctx, hz, H, [[0, '#6a3a18'], [1, '#8a5a2c']]); ctx.fillRect(X0, hz, W, H - hz);
  ctx.save(); const mx0 = cx - 360, mx1 = cx + 360, my0 = hz + 26, my1 = H - 24; ctx.beginPath(); ctx.moveTo(mx0 + 30, my0); ctx.lineTo(mx1 - 30, my0); ctx.lineTo(mx1 + 40, my1); ctx.lineTo(mx0 - 40, my1); ctx.closePath(); ctx.clip();
  ctx.fillStyle = '#d8b864'; ctx.fillRect(mx0 - 60, my0, 840, my1 - my0);
  const cols = ['#c0261f', '#f0b41c', '#2a8a40', '#1c2c64'];
  for (let r = 0; r < 12; r++) for (let c = -2; c < 14; c++) { const x = mx0 + c * 60 + (r % 2) * 30, y = my0 + 12 + r * ((my1 - my0) / 12) * 1.0, hh = (my1 - my0) / 12 * 0.5; ctx.fillStyle = cols[(r + c) % 4]; ctx.beginPath(); ctx.moveTo(x, y - hh); ctx.lineTo(x + 26, y); ctx.lineTo(x, y + hh); ctx.lineTo(x - 26, y); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle = 'rgba(60,34,8,0.28)'; ctx.lineWidth = 1.4; for (let y = my0; y < my1; y += 8) { ctx.beginPath(); ctx.moveTo(mx0 - 60, y); ctx.lineTo(mx1 + 60, y); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(mx0 - 60, my0, 840, (my1 - my0) * 0.35);
  ctx.restore();
  ctx.strokeStyle = '#3a1a08'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(cx - 330, hz + 26); ctx.lineTo(cx + 330, hz + 26); ctx.lineTo(cx + 400, H - 24); ctx.lineTo(cx - 400, H - 24); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(X0, hz, W, 5);
  ctx.fillStyle = rgrad(ctx, cx, cypc, 10, W * 0.5, [[0, 'rgba(255,214,150,0.3)'], [1, 'rgba(255,214,150,0)']]); ctx.fillRect(X0, hz, W, H - hz);
  ctx.restore();
}

const ZONES = [['tap', /tap|beat|strike/], ['clap', /clap|close/], ['in', /^in\b|inside|between/], ['out', /^out\b|outside/]];
registerDanceStage({
  id: 'poles-hero', match: /(tinikling|pole|bamboo).*dancer|dancer.*(tinikling|pole)/,
  build: (S, lanes, P) => createSceneStage('poles-hero', S, lanes, P, {
    tallRatio: 0.85,
    dress: () => ({ kind: 'planks', base: '#5a3a1c', light: '#ffe0b0' }),
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 960 } : { w: 1180, h: 600 };
      const keyOf = assignZones(K, ZONES.map(([key, re]) => ({ key, re }))); const spots = new Array(K.N).fill(null);
      const k = tall ? 0.9 : 0.62, CYP = tall ? 706 : 410, fy = CYP - 742 * k, hz = tall ? 330 : 200, PR = tall ? 56 : 50;
      const gapMax = tall ? 88 : 70, span = tall ? 212 : 330, blk = tall ? 150 : 230, hs = tall ? 0.88 : 0.8, holderOff = tall ? 52 : 46;
      const by = tall ? { tap: [-300, 902], clap: [-100, 902], in: [100, 902], out: [300, 902] } : { tap: [-500, 100], clap: [-500, 208], in: [500, 100], out: [500, 208] };
      for (let i = 0; i < K.N; i++) { const p = by[keyOf[i]]; if (p) spots[i] = eSpot(p[0], p[1], PR, PR, 0, { apk: 1, extra: { noFill: true } }); }
      return { ref, spots,
        draw(ctx, rt, g) {
          const t = rt.anim, A = areaInDesign(ctx, g.F, ref); floorScene(ctx, A, t, hz, CYP);
          const env = envOf(rt, K, keyOf), [key, v] = dominant(env);
          const ph = rt.spb > 0 ? (((rt.clock / rt.spb) % 3) + 3) % 3 : 0;
          // the poles: apart for most of the bar, sliding together towards the third beat, clap at 2.0, then open again
          const gapf = ph < 1.55 ? 1 : ph < 2 ? 1 - ease((ph - 1.55) / 0.45) : ph < 2.3 ? ease((ph - 2) / 0.3) : 1;
          const gap = (0.08 + 0.92 * gapf) * gapMax;
          const tapF = Math.max(env.tap ?? 0, ph > 0.0 && ph < 0.14 || ph > 1.0 && ph < 1.14 ? 0.9 : 0), clapF = Math.max(env.clap ?? 0, ph > 2 && ph < 2.16 ? 0.9 : 0);
          // blocks
          for (const bx of [-blk, blk]) { const by0 = CYP - gapMax / 2 - 36, hgt = gapMax + 72 + 10; ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, bx - 26 + 8, by0 + 10, 56, hgt, 8); ctx.fill(); ctx.fillStyle = hgrad(ctx, bx - 28, bx + 28, [[0, '#5a3a1c'], [0.3, '#b88a52'], [1, '#4a2e14']]); rrect(ctx, bx - 28, by0, 56, hgt, 8); ctx.fill(); ctx.strokeStyle = 'rgba(30,16,4,0.6)'; ctx.lineWidth = 2; ctx.stroke(); }
          const yFar = CYP - gap / 2, yNear = CYP + gap / 2;
          for (const sx of [-1, 1]) kneeler(ctx, sx * (span + holderOff), CYP + (tall ? 80 : 70), sx, hs, yFar, yNear, span, sx < 0 ? '#b07a52' : '#a26e48', sx > 0);
          bamboo(ctx, -span, span, yFar, 24, t, clapF);
          hands(ctx, -span + 85 * hs, yFar, -1); hands(ctx, span - 85 * hs, yFar, 1);
          // the dancer: in the gap, or out in front of the near pole; she springs as the poles close
          const hop = ease(clamp(Math.sin(Math.PI * clamp((ph - 1.55) / 0.85, 0, 1)), 0, 1)) + 0.18 * Math.abs(Math.sin(Math.PI * ph)) + (key === 'in' || key === 'out' ? 0.25 * v : 0);
          const hp = Math.min(hop, 1.05) * 84;
          const outF = key === 'out' ? v : 0, oy = outF * (gapMax * 0.5 + 66);
          const near = (a) => { bamboo(ctx, -span, span, yNear, 28, t, clapF); hands(ctx, -span, yNear, -1); hands(ctx, span, yNear, 1); void a; };
          if (outF > 0.5) near();
          ctx.save(); ctx.translate(0, fy + oy - hp * 0.55 * k); ctx.scale(k, k);
          groundPool(ctx, 6, 764, 150, 20, 0.42 - 0.2 * Math.min(1, hp / 80));
          dancer(ctx, { ...mixPose(IDLE, pose(key, hp), key ? ease(v) : 0), hip: [0, 430] }, t, hp);
          ctx.restore();
          if (outF <= 0.5) near();
          // clack sparks where the poles meet or strike the blocks
          if (tapF > 0.3) for (const bx of [-blk, blk]) { glow(ctx, bx, yFar, 70, '#ffe8a0', 0.5 * tapF); glow(ctx, bx, yNear, 70, '#ffe8a0', 0.5 * tapF); }
          if (clapF > 0.3) for (const bx of [-blk * 0.6, 0, blk * 0.6]) glow(ctx, bx, CYP, 80, '#fff4c0', 0.5 * clapF);
          lanes.forEach((l, i) => { if (spots[i]) pad(ctx, l, spots[i], rt.flash[i], laneIcon(l)); });
        } };
    },
  }),
});
void rgba; void hash; void lighter; void lerp;

// Front and three-quarter figures (1.13.0) for the dances that cannot be read from above: eskista (shoulder isolation) and the gumboot miner.
// Pure drawing in the caller's design space, authored around x = 0; every animation is a function of the arguments.
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, circ, ell, TAU } from './art.js';
import { hand } from './dancers.js';

// a lit cloth capsule between two points (sleeve, trouser leg): shadow, dark rim, body, highlight
export function cloth(ctx, x0, y0, x1, y1, w, col, o = {}) {
  ctx.save(); ctx.lineCap = 'round';
  if (o.shadow !== false) { ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0 + w * 0.16, y0 + w * 0.2); ctx.lineTo(x1 + w * 0.16, y1 + w * 0.2); ctx.stroke(); }
  ctx.strokeStyle = darker(col, o.rim ?? 0.28); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = w * 0.78; ctx.beginPath(); ctx.moveTo(x0 - w * 0.06, y0); ctx.lineTo(x1 - w * 0.06, y1); ctx.stroke();
  ctx.strokeStyle = lighter(col, 0.35); ctx.lineWidth = w * 0.22; ctx.beginPath(); ctx.moveTo(x0 - w * 0.22, y0); ctx.lineTo(x1 - w * 0.22, y1); ctx.stroke();
  ctx.restore();
}

// a calm, lit face for a head of half-width rx and half-height ry at (0,0), turned a little (turn -1..1: which way she looks); no expression beyond rest
export function face(ctx, rx, ry, o = {}) {
  const turn = o.turn ?? 0.4, fx = turn * rx * 0.22, sk = o.skin ?? '#c98e63', ink = o.ink ?? '#2a1810';
  // cheek and brow shading
  ctx.fillStyle = rgba('#d86a5a', 0.16); ell(ctx, fx - rx * 0.5, ry * 0.3, rx * 0.2, ry * 0.12); ctx.fill(); ell(ctx, fx + rx * 0.52, ry * 0.3, rx * 0.2, ry * 0.12); ctx.fill();
  // brows
  ctx.strokeStyle = rgba(ink, 0.85); ctx.lineCap = 'round'; ctx.lineWidth = ry * 0.05;
  for (const d of [-1, 1]) { const ex = fx + d * rx * 0.42; ctx.beginPath(); ctx.moveTo(ex - d * rx * 0.2, -ry * 0.2); ctx.quadraticCurveTo(ex, -ry * 0.31, ex + d * rx * 0.22, -ry * 0.18); ctx.stroke(); }
  // eyes (soft downcast lids with lashes: the dancer looks calmly ahead)
  for (const d of [-1, 1]) {
    const ex = fx + d * rx * 0.4, ey = -ry * 0.04;
    ctx.fillStyle = '#f4ece0'; ell(ctx, ex, ey, rx * 0.2, ry * 0.075); ctx.fill();
    ctx.fillStyle = '#3a2418'; circ(ctx, ex + d * rx * 0.02 + turn * rx * 0.04, ey, ry * 0.07); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; circ(ctx, ex - rx * 0.02, ey - ry * 0.02, ry * 0.02); ctx.fill();
    ctx.strokeStyle = rgba(ink, 0.9); ctx.lineWidth = ry * 0.035; ctx.beginPath(); ctx.moveTo(ex - rx * 0.22, ey - ry * 0.01); ctx.quadraticCurveTo(ex, ey - ry * 0.11, ex + rx * 0.22, ey - ry * 0.01); ctx.stroke();
  }
  // nose and mouth
  ctx.strokeStyle = rgba(darker(sk, 0.5), 0.55); ctx.lineWidth = ry * 0.03; ctx.beginPath(); ctx.moveTo(fx + rx * 0.05, ry * 0.02); ctx.quadraticCurveTo(fx + rx * 0.12, ry * 0.25, fx - rx * 0.02, ry * 0.32); ctx.stroke();
  ctx.fillStyle = rgba(darker(sk, 0.55), 0.5); ell(ctx, fx - rx * 0.08, ry * 0.34, rx * 0.06, ry * 0.025); ctx.fill(); ell(ctx, fx + rx * 0.1, ry * 0.34, rx * 0.06, ry * 0.025); ctx.fill();
  if (o.smile) {   // 1.25.0 opt-in: an open, warm smile (a lit teeth crescent inside soft lips); the default mouth below is untouched
    const mx = fx + rx * 0.02, my = ry * 0.52, w = rx * 0.3 * o.smile;
    ctx.beginPath(); ctx.moveTo(mx - w, my); ctx.quadraticCurveTo(mx, my + ry * 0.04, mx + w, my); ctx.quadraticCurveTo(mx + w * 0.8, my + ry * 0.24, mx, my + ry * 0.25); ctx.quadraticCurveTo(mx - w * 0.8, my + ry * 0.24, mx - w, my); ctx.closePath();
    ctx.fillStyle = '#5a1e1a'; ctx.fill(); ctx.strokeStyle = rgba('#7a2a28', 0.95); ctx.lineWidth = ry * 0.035; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.save(); ctx.clip(); ctx.fillStyle = '#f6f0e4'; ctx.fillRect(mx - w, my, w * 2, ry * 0.075); ctx.restore();
    ctx.strokeStyle = rgba(darker(sk, 0.45), 0.5); ctx.lineWidth = ry * 0.025; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(mx + d * (w + rx * 0.06), my - ry * 0.05); ctx.quadraticCurveTo(mx + d * (w + rx * 0.1), my + ry * 0.04, mx + d * (w + rx * 0.05), my + ry * 0.1); ctx.stroke(); }
    return;
  }
  ctx.fillStyle = rgrad(ctx, fx, ry * 0.56, 0, rx * 0.26, [[0, '#b04a40'], [1, '#7a2a28']]); ctx.beginPath(); ctx.moveTo(fx - rx * 0.22, ry * 0.55); ctx.quadraticCurveTo(fx, ry * 0.5, fx + rx * 0.22, ry * 0.55); ctx.quadraticCurveTo(fx, ry * 0.66, fx - rx * 0.22, ry * 0.55); ctx.fill();
  ctx.strokeStyle = rgba('#3a1410', 0.6); ctx.lineWidth = ry * 0.02; ctx.beginPath(); ctx.moveTo(fx - rx * 0.22, ry * 0.55); ctx.quadraticCurveTo(fx, ry * 0.58, fx + rx * 0.22, ry * 0.55); ctx.stroke();
}

// ---- eskista ------------------------------------------------------------------------------------------------------------------------------------
// The dancer in a white cotton dress with a woven border, seen from the front and a little from her right. Authored in a box ~ 0..780 high, centred on x = 0:
// head centre (0, 70), shoulders y ~ 190, waist y ~ 360, hem y ~ 700. s: { L, R, C, B, N (0..1 strike strengths), t (clock), dir (+1/-1 neck slide) }.
const GREEN = '#2a7a4a', GOLD = '#e8b84a', RED = '#b8302a', BLUE = '#2a58b8';
function band(ctx, x0, x1, y, w, cols, wave = 18) {
  let yy = y;
  for (const [h, c] of cols) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.quadraticCurveTo((x0 + x1) / 2, yy + wave, x1, yy); ctx.lineTo(x1, yy + h); ctx.quadraticCurveTo((x0 + x1) / 2, yy + h + wave, x0, yy + h); ctx.closePath(); ctx.fill(); yy += h; }
  void w;
}
function weave(ctx, x, y, w, h, t = 0) {
  // a cross-stitched panel of small diamonds (the woven tilet)
  ctx.save(); rrect(ctx, x, y, w, h, 4); ctx.clip();
  ctx.fillStyle = '#f4ecd8'; ctx.fillRect(x, y, w, h);
  const n = Math.max(1, Math.floor(h / 22));
  for (let k = 0; k < n; k++) { const cy = y + 11 + k * 22, c = [GREEN, GOLD, RED][k % 3]; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x + w / 2, cy - 8); ctx.lineTo(x + w / 2 + 8, cy); ctx.lineTo(x + w / 2, cy + 8); ctx.lineTo(x + w / 2 - 8, cy); ctx.closePath(); ctx.fill(); ctx.fillStyle = k % 2 ? BLUE : '#fff'; circ(ctx, x + 7, cy, 2.6); ctx.fill(); circ(ctx, x + w - 7, cy, 2.6); ctx.fill(); }
  ctx.fillStyle = GREEN; ctx.fillRect(x, y, 3, h); ctx.fillRect(x + w - 3, y, 3, h);
  ctx.restore(); void t;
}

export function eskistaFigure(ctx, s) {
  const { L = 0, R = 0, C = 0, B = 0, N = 0, t = 0, dir = 1 } = s;
  const skin = '#c98e63', skinD = '#9a6640', white = '#f6f1e4';
  const sl = [-116 + 12 * B - 4 * L, 192 - 64 * L + 8 * C + 6 * B], sr = [116 - 12 * B + 4 * R, 192 - 64 * R + 8 * C + 6 * B];
  const chest = 1 + 0.1 * C - 0.05 * B;
  // ground shadow and the bare feet below the hem
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; ell(ctx, 10, 716, 250, 34); ctx.fill();
  for (const d of [-1, 1]) { ctx.fillStyle = rgrad(ctx, d * 56 - 6, 700, 2, 40, [[0, '#dca77a'], [1, skinD]]); ell(ctx, d * 56, 706, 30, 17); ctx.fill(); ctx.fillStyle = '#e8b84a'; circ(ctx, d * 56 + d * 8, 700, 4); ctx.fill(); }
  // skirt of the dress: an A-line from the waist to a wave of hem, folds, a woven centre panel and the border bands
  ctx.save();
  const sway = Math.sin(t * 3.5) * 4;
  ctx.beginPath(); ctx.moveTo(-94, 352); ctx.lineTo(94, 352); ctx.bezierCurveTo(130 + sway, 480, 190 + sway, 600, 224, 694); ctx.quadraticCurveTo(0, 724, -224, 694); ctx.bezierCurveTo(-190 - sway, 600, -130 - sway, 480, -94, 352); ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.save(); ctx.translate(12, 12); ctx.fill(); ctx.restore();
  ctx.fillStyle = hgrad(ctx, -224, 224, [[0, '#b9b09c'], [0.3, '#fffaf0'], [0.62, white], [1, '#aca08a']]); ctx.fill();
  ctx.clip();
  ctx.strokeStyle = 'rgba(110,92,64,0.26)'; ctx.lineWidth = 2.2; for (let k = -7; k <= 7; k++) { ctx.beginPath(); ctx.moveTo(k * 12, 360); ctx.quadraticCurveTo(k * 22 + sway * 0.5, 540, k * 33, 700); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; for (let k = -5; k <= 5; k++) { ctx.beginPath(); ctx.moveTo(k * 15 - 4, 360); ctx.quadraticCurveTo(k * 26, 540, k * 38 - 4, 700); ctx.stroke(); }
  band(ctx, -240, 240, 640 + 0, 0, [[10, GREEN], [8, GOLD], [10, RED], [5, BLUE], [6, '#fffaf0'], [8, GREEN]], 22);
  weave(ctx, -28, 372, 56, 262);
  ctx.restore();
  // arms: sleeves that hang from the shoulders, hands at the hips; a lifted shoulder lifts the arm with it
  for (const [sg, sh, f] of [[-1, sl, L], [1, sr, R]]) {
    const el = [sg * (162 + 6 * f), 336 - 14 * f + 4 * C], hd = [sg * (150 + 2 * f), 452 - 10 * f];
    cloth(ctx, sh[0] + sg * 6, sh[1] + 22, el[0], el[1], 58, white);
    cloth(ctx, el[0], el[1], hd[0], hd[1] - 12, 46, white);
    ctx.strokeStyle = GOLD; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hd[0] - 22, hd[1] - 10); ctx.lineTo(hd[0] + 22, hd[1] - 10); ctx.stroke();
    ctx.strokeStyle = GREEN; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hd[0] - 22, hd[1] - 2); ctx.lineTo(hd[0] + 22, hd[1] - 2); ctx.stroke();
    hand(ctx, hd[0], hd[1] - 2, Math.PI / 2, 86, { skin, open: 0.2, side: -sg, curl: 0.35 });
  }
  // bodice: the shoulders are the corners of this shape, so a struck shoulder visibly rises and rolls forward; the chest pops as a whole
  ctx.save(); ctx.translate(0, 270); ctx.scale(1 + 0.02 * C, 1); ctx.translate(0, -270);
  ctx.beginPath(); ctx.moveTo(sl[0], sl[1]); ctx.bezierCurveTo(sl[0] * 0.72, sl[1] - 16, -42, 178, 0, 180); ctx.bezierCurveTo(42, 178, sr[0] * 0.72, sr[1] - 16, sr[0], sr[1]);
  ctx.bezierCurveTo(sr[0] + 10, 250, 100, 310, 90, 362); ctx.lineTo(-90, 362); ctx.bezierCurveTo(-100, 310, sl[0] - 10, 250, sl[0], sl[1]); ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.26)'; ctx.save(); ctx.translate(8, 10); ctx.fill(); ctx.restore();
  ctx.fillStyle = hgrad(ctx, -130, 130, [[0, '#bdb4a0'], [0.3, '#fffaf0'], [0.62, white], [1, '#b2a690']]); ctx.fill();
  ctx.strokeStyle = 'rgba(110,90,60,0.5)'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.clip();
  // the chest: a soft mass that swells forward on a Chest strike, lit from the upper left
  ctx.save(); ctx.translate(0, 290); ctx.scale(chest, 1 + 0.06 * (chest - 1) * 4); ctx.translate(0, -290);
  ctx.fillStyle = rgrad(ctx, -24, 270, 0, 100, [[0, 'rgba(255,255,255,0.55)'], [1, 'rgba(255,255,255,0)']]); ell(ctx, 0, 285, 96, 64); ctx.fill();
  ctx.fillStyle = rgrad(ctx, 30, 330, 0, 90, [[0, 'rgba(90,70,40,0.28)'], [1, 'rgba(90,70,40,0)']]); ell(ctx, 0, 330, 96, 50); ctx.fill();
  ctx.restore();
  // shoulder caps and fold lines that follow the lifted shoulder
  for (const [sh, f, sg] of [[sl, L, -1], [sr, R, 1]]) { ctx.fillStyle = rgrad(ctx, sh[0] - sg * 10, sh[1] + 6, 0, 64, [[0, 'rgba(255,255,255,0.5)'], [1, 'rgba(255,255,255,0)']]); circ(ctx, sh[0], sh[1] + 10, 56); ctx.fill();
    ctx.strokeStyle = 'rgba(110,92,64,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sh[0] - sg * 36, sh[1] + 36); ctx.quadraticCurveTo(sh[0] - sg * 10, sh[1] + 60 - f * 14, sh[0] + sg * 22, sh[1] + 88); ctx.stroke(); }
  // woven yoke across the chest and the V of the neckline with the vertical panel
  ctx.save(); ctx.beginPath(); ctx.rect(-140, 180, 280, 220); ctx.clip();
  band(ctx, -150, 150, 222 + 8 * C - 0, 0, [[9, GREEN], [7, GOLD], [9, RED]], 30);
  ctx.restore();
  weave(ctx, -26, 208 + 8 * C, 52, 154);
  ctx.restore();
  // a woven belt at the waist
  band(ctx, -92, 92, 346, 0, [[7, GOLD], [9, GREEN], [6, RED]], 6);
  // motion arcs round a struck shoulder, so the isolation reads at a glance
  for (const [sh, f, sg] of [[sl, L, -1], [sr, R, 1]]) if (f > 0.2) { ctx.strokeStyle = `rgba(255,236,190,${0.8 * f})`; ctx.lineWidth = 4; ctx.lineCap = 'round'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(sh[0], sh[1] + 30, 70 + k * 18, sg < 0 ? Math.PI * 1.05 : -Math.PI * 0.05 - 0.9, sg < 0 ? Math.PI * 1.05 + 0.9 : -Math.PI * 0.05); ctx.globalAlpha = 1 - k * 0.3; ctx.stroke(); } ctx.globalAlpha = 1; }
  // neck, then the head that slides sideways on a Neck strike (the neck isolation) with plaits falling behind the shoulders
  const hx = N * 38 * dir, tilt = N * 0.1 * dir;
  ctx.save();
  ctx.fillStyle = rgrad(ctx, 0, 150, 0, 70, [[0, '#d9a074'], [1, '#a2704a']]);
  ctx.beginPath(); ctx.moveTo(-26, 182); ctx.lineTo(-24 + hx * 0.5, 120); ctx.lineTo(24 + hx * 0.5, 120); ctx.lineTo(26, 182); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ell(ctx, hx * 0.3, 176, 34, 10); ctx.fill();
  ctx.translate(hx, 92); ctx.rotate(tilt);
  // hair behind: two plaits down past the shoulders and the mass of the head
  for (const d of [-1, 1]) { ctx.strokeStyle = '#150e0a'; ctx.lineCap = 'round'; ctx.lineWidth = 24; ctx.beginPath(); ctx.moveTo(d * 44, 8); ctx.quadraticCurveTo(d * 70, 70, d * 62, 132); ctx.stroke();
    ctx.strokeStyle = 'rgba(210,170,130,0.35)'; ctx.lineWidth = 2; for (let k = 0; k < 9; k++) { const yy = 16 + k * 13, xx = d * (50 + 14 * Math.sin(k * 0.35)); ctx.beginPath(); ctx.moveTo(xx - 8, yy); ctx.lineTo(xx + 8, yy + 7); ctx.stroke(); }
    ctx.fillStyle = GOLD; circ(ctx, d * 62, 136, 6); ctx.fill(); }
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ell(ctx, 6, 10, 56, 68); ctx.fill();
  ctx.fillStyle = rgrad(ctx, -16, -20, 4, 80, [[0, '#e0aa7e'], [0.7, skin], [1, '#8a5a3a']]); ell(ctx, 0, 6, 50, 62); ctx.fill();
  face(ctx, 50, 62, { skin, turn: 0.45 });
  // hair on top: parted and pulled back in rows of fine plaits, a sheen, a gold band across the crown
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, 6, 52, 64, 0, 0, TAU); ctx.clip();
  ctx.fillStyle = rgrad(ctx, -18, -50, 2, 90, [[0, '#6a5044'], [0.5, '#2a1c16'], [1, '#100a08']]); ctx.beginPath(); ctx.moveTo(-60, -8); ctx.bezierCurveTo(-52, -52, -20, -72, 0, -72); ctx.bezierCurveTo(20, -72, 52, -52, 60, -8); ctx.bezierCurveTo(46, -30, 28, -38, 10, -34); ctx.quadraticCurveTo(0, -30, -10, -34); ctx.bezierCurveTo(-28, -38, -46, -30, -60, -8); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(214,176,140,0.55)'; ctx.lineWidth = 1.8; for (let k = -6; k <= 6; k++) { ctx.beginPath(); ctx.moveTo(k * 4 + 1, -34 + Math.abs(k) * 1.2); ctx.quadraticCurveTo(k * 9, -52, k * 11, -70); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(-6, -28, 40, Math.PI * 1.08, Math.PI * 1.5); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = GOLD; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-48, -26); ctx.quadraticCurveTo(0, -46, 48, -26); ctx.stroke();
  for (const d of [-1, 1]) { ctx.strokeStyle = GOLD; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(d * 50, 26, 8, 0, TAU); ctx.stroke(); }
  ctx.restore();
}

// ---- gumboot miner ------------------------------------------------------------------------------------------------------------------------------
// A miner in boiler suit and white wellington boots, hard hat with a lamp; front view, authored ~ 0..760 high. s: { slapL, slapR (boot slaps), thigh, clap, stomp, t }.
// The boots are the point: tall white rubber with a rolled cuff, lifted and slapped.
export function minerFigure(ctx, s) {
  const { slapL = 0, slapR = 0, thigh = 0, clap = 0, stomp = 0, t = 0 } = s;
  const skin = '#a8683e', suit = '#3f5f8c', suitD = '#243a5c', boot = '#f4f2ea';
  const sq = stomp * 12, bob = (slapL + slapR + clap) * 3 + stomp * 5;
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ell(ctx, 8, 742, 190, 24); ctx.fill();
  // legs and boots
  for (const d of [-1, 1]) {
    const f = d < 0 ? slapL : slapR, lift = f * 64, x = d * 62 + d * 8 * f, y0 = 372 + sq * 0.4;
    // trouser leg
    cloth(ctx, d * 54, y0 + 20, x, y0 + 190 - lift * 0.5, 84, suit);
    // boot: tall white rubber, a rolled cuff, a thick sole, bright rim light
    const by = 540 - lift + sq * 0.5;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, x + 10, 738, 62 - 6 * f, 12); ctx.fill();
    ctx.save(); ctx.translate(x, by); ctx.scale(d, 1);
    const sole = 204 - sq * 0.5;
    ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(40, 0); ctx.lineTo(42, 140); ctx.quadraticCurveTo(46, 172, 62, 178); ctx.quadraticCurveTo(96, 178, 98, 196); ctx.lineTo(98, sole); ctx.lineTo(-42, sole); ctx.lineTo(-42, 140); ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,0.26)'; ctx.save(); ctx.translate(9, 10); ctx.fill(); ctx.restore();
    ctx.fillStyle = hgrad(ctx, -46, 46, [[0, '#a8aab0'], [0.3, '#ffffff'], [0.7, boot], [1, '#9a9ea6']]); ctx.fill();
    ctx.strokeStyle = 'rgba(60,64,72,0.5)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = hgrad(ctx, -48, 48, [[0, '#b8bac0'], [0.35, '#ffffff'], [1, '#a4a8b0']]); rrect(ctx, -46, -6, 92, 34, 14); ctx.fill(); ctx.strokeStyle = 'rgba(60,64,72,0.45)'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; rrect(ctx, -30, 36, 14, 96, 7); ctx.fill();
    ctx.fillStyle = '#2a2a30'; rrect(ctx, -44, sole - 14, 144, 16, 6); ctx.fill();
    ctx.restore();
  }
  // torso: boiler suit with reflective stripes, belt
  const ty = 150 + bob;
  ctx.fillStyle = 'rgba(0,0,0,0.26)'; rrect(ctx, -112 + 10, ty + 12, 224, 252, 52); ctx.fill();
  ctx.fillStyle = hgrad(ctx, -112, 112, [[0, suitD], [0.34, lighter(suit, 0.15)], [0.7, suit], [1, suitD]]); rrect(ctx, -112, ty, 224, 250, 52); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(k * 30, ty + 30); ctx.quadraticCurveTo(k * 34 + 4, ty + 130, k * 28, ty + 240); ctx.stroke(); }
  for (const yy of [ty + 150, ty + 172]) { ctx.fillStyle = '#d8dce2'; ctx.fillRect(-110, yy, 220, 9); ctx.fillStyle = 'rgba(255,255,160,0.7)'; ctx.fillRect(-110, yy + 2, 220, 3); }
  ctx.fillStyle = '#2a2018'; rrect(ctx, -108, ty + 218, 216, 22, 6); ctx.fill(); ctx.fillStyle = '#d4a43a'; rrect(ctx, -16, ty + 214, 32, 30, 5); ctx.fill();
  // arms: slapping the knees and thighs, clapping in front
  const sh = [[-110, ty + 34], [110, ty + 34]];
  for (const [d, k] of [[-1, 0], [1, 1]]) {
    const hit = d < 0 ? Math.max(clap, slapL * 0.0) : Math.max(clap, thigh);
    const hx = d * (130 - 118 * clap - 40 * (d > 0 ? thigh : 0) * 0) , hy = 400 - 130 * clap + (d > 0 ? -60 * thigh : 0) - (d < 0 ? slapL * 60 : 0) - (d > 0 ? slapR * 60 : 0);
    const el = [d * 168, (sh[k][1] + hy) / 2 + 10];
    cloth(ctx, sh[k][0], sh[k][1], el[0], el[1], 62, suit); cloth(ctx, el[0], el[1], hx, hy, 52, suit);
    ctx.fillStyle = '#f0b020'; rrect(ctx, hx - 28, hy - 34 * (hy > el[1] ? 1 : -1) * 0.2 - 12, 56, 12, 5); ctx.fill();   // work-glove cuff
    ctx.fillStyle = rgrad(ctx, hx - 8, hy - 8, 0, 40, [[0, '#f6c64a'], [1, '#c4881a']]); circ(ctx, hx, hy, 32); ctx.fill(); ctx.strokeStyle = 'rgba(80,50,6,0.5)'; ctx.lineWidth = 2; ctx.stroke();
    void hit;
  }
  // neck, head, face and the hard hat with a lamp
  const hy = 70 + bob * 0.8;
  ctx.fillStyle = rgrad(ctx, 0, ty - 6, 0, 50, [[0, '#c78a5a'], [1, '#8a5430']]); rrect(ctx, -26, ty - 24, 52, 40, 12); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ell(ctx, 6, hy + 12, 56, 62); ctx.fill();
  ctx.save(); ctx.translate(0, hy);
  ctx.fillStyle = rgrad(ctx, -16, -14, 4, 82, [[0, '#cc905f'], [0.7, skin], [1, '#6a3e22']]); ell(ctx, 0, 8, 52, 62); ctx.fill();
  face(ctx, 52, 62, { skin, turn: 0.2 });
  ctx.fillStyle = '#4a2a18'; ell(ctx, 0, 52, 30, 6); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.translate(0, hy - 22);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(8, 22, 82, 22, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = hgrad(ctx, -76, 76, [[0, '#a07810'], [0.3, '#ffd23a'], [0.7, '#f2b81c'], [1, '#8a6a10']]);
  ctx.beginPath(); ctx.moveTo(-70, 12); ctx.bezierCurveTo(-70, -50, 70, -50, 70, 12); ctx.closePath(); ctx.fill();
  ctx.fillStyle = hgrad(ctx, -90, 90, [[0, '#9a7410'], [0.4, '#f6c42a'], [1, '#8a6a10']]); rrect(ctx, -88, 6, 176, 20, 10); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-50, -14); ctx.quadraticCurveTo(-20, -34, 12, -34); ctx.stroke();
  ctx.fillStyle = '#6a5008'; rrect(ctx, -6, -34, 12, 38, 3); ctx.fill();   // ridge
  ctx.fillStyle = '#fff8c8'; circ(ctx, 0, -2, 14); ctx.fill(); ctx.strokeStyle = '#6a5008'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = rgba('#fff8c8', 0.28 + 0.2 * Math.sin(t * 4)); circ(ctx, 0, -2, 28); ctx.fill();
  ctx.restore();
}
void clamp; void mix; void vgrad; void rgrad;

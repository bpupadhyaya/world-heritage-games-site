// Illustrated dancers for the dance stages. People are seen from above and slightly in front (so no faces are needed):
// a shaded torso with sleeves, a head with hair or a hat, arms that link, wave or hold ribbons, skirts and trousers with feet that step.
// Pure drawing in the stage's design space; every animation is a function of the arguments.
import { clamp, mix, rgba, lighter, darker, hash, ell, circ, rrect, TAU, hgrad, vgrad, rgrad } from './art.js';

// a limb as a lit capsule (sleeve or leg) in design space
function limb(ctx, x0, y0, x1, y1, w, col, shadow = true) {
  ctx.save(); ctx.lineCap = 'round';
  if (shadow) { ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0 + w * 0.18, y0 + w * 0.3); ctx.lineTo(x1 + w * 0.18, y1 + w * 0.3); ctx.stroke(); }
  ctx.strokeStyle = darker(col, 0.35); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = w * 0.76; ctx.beginPath(); ctx.moveTo(x0 - w * 0.05, y0 - w * 0.05); ctx.lineTo(x1 - w * 0.05, y1 - w * 0.05); ctx.stroke();
  ctx.strokeStyle = lighter(col, 0.4); ctx.lineWidth = w * 0.25; ctx.beginPath(); ctx.moveTo(x0 - w * 0.2, y0 - w * 0.2); ctx.lineTo(x1 - w * 0.2, y1 - w * 0.2); ctx.stroke();
  ctx.restore();
}
const shoe = (ctx, x, y, rx, ry, rot, col = '#1c140e', lift = 0) => {
  ctx.save(); ctx.translate(x, y - lift * ry * 0.6); ctx.rotate(rot);
  ctx.fillStyle = `rgba(0,0,0,${0.32 - lift * 0.15})`; ell(ctx, rx * 0.2 + lift * rx * 0.5, ry * 0.3 + lift * ry * 0.9, rx, ry); ctx.fill();
  ctx.fillStyle = rgrad(ctx, 0, 0, 1, ry * 1.3, [[0, lighter(col, 0.5)], [0.6, col], [1, darker(col, 0.5)]], -rx * 0.3, -ry * 0.4); ell(ctx, 0, 0, rx, ry); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ell(ctx, -rx * 0.25, -ry * 0.35, rx * 0.4, ry * 0.18); ctx.fill();
  ctx.restore();
};

// o: { face (radians, where the dancer looks; -PI/2 = up the screen), skin, hair, shirt, bottom, skirt, hat, trim, step (-1..1), bob (0..1),
//      handL: [x,y] | null, handR: [x,y] | null (design-space hand targets), wave (0..1) }
export function dancerTop(ctx, x, y, s, o = {}) {
  const face = o.face ?? -Math.PI / 2, skin = o.skin ?? '#d49a6c', hair = o.hair ?? '#2a1a12', shirt = o.shirt ?? '#c0392b', bottom = o.bottom ?? '#2a2a3a', trim = o.trim ?? '#f0d060';
  const step = o.step ?? 0, bob = o.bob ?? 0;
  ctx.save(); ctx.translate(x, y - bob * s * 0.06);
  // ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.34)'; ell(ctx, s * 0.12, s * 0.22, s * (o.skirt ? 0.78 : 0.62), s * 0.5); ctx.fill();
  ctx.save(); ctx.rotate(face + Math.PI / 2);
  // feet and legs / skirt
  const fx = s * 0.17, fy = -s * 0.42;
  const f1 = fy - step * s * 0.2, f2 = fy + step * s * 0.2, lift1 = clamp(step, 0, 1), lift2 = clamp(-step, 0, 1);
  if (o.skirt) {
    shoe(ctx, -fx, f1, s * 0.11, s * 0.17, 0, o.shoe ?? '#2a1810', lift1); shoe(ctx, fx, f2, s * 0.11, s * 0.17, 0, o.shoe ?? '#2a1810', lift2);
    const sw = s * (0.62 + 0.05 * Math.sin(step * 2));
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ell(ctx, s * 0.04, s * 0.08, sw, sw * 0.9); ctx.fill();
    ctx.fillStyle = rgrad(ctx, 0, 0, s * 0.1, sw, [[0, lighter(bottom, 0.35)], [0.6, bottom], [1, darker(bottom, 0.5)]], -sw * 0.25, -sw * 0.3); circ(ctx, 0, 0, sw); ctx.fill();
    ctx.strokeStyle = rgba(darker(bottom, 0.6), 0.5); ctx.lineWidth = 1.5;
    for (let k = 0; k < 14; k++) { const a = (k / 14) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * sw * 0.25, Math.sin(a) * sw * 0.25); ctx.lineTo(Math.cos(a) * sw * 0.98, Math.sin(a) * sw * 0.98); ctx.stroke(); }
    ctx.strokeStyle = rgba(trim, 0.85); ctx.lineWidth = s * 0.05; circ(ctx, 0, 0, sw * 0.92); ctx.stroke();
  } else {
    limb(ctx, -fx, 0, -fx, f1, s * 0.2, bottom, true); limb(ctx, fx, 0, fx, f2, s * 0.2, bottom, true);
    shoe(ctx, -fx, f1 - s * 0.04, s * 0.12, s * 0.17, 0, o.shoe ?? '#1c140e', lift1); shoe(ctx, fx, f2 - s * 0.04, s * 0.12, s * 0.17, 0, o.shoe ?? '#1c140e', lift2);
  }
  // torso: rounded shoulders seen from above
  const tw = s * 0.98, th = s * 0.52;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, -tw / 2 + s * 0.06, -th / 2 + s * 0.1, tw, th, th * 0.5); ctx.fill();
  ctx.fillStyle = hgrad(ctx, -tw / 2, tw / 2, [[0, darker(shirt, 0.45)], [0.28, lighter(shirt, 0.25)], [0.6, shirt], [1, darker(shirt, 0.5)]]); rrect(ctx, -tw / 2, -th / 2, tw, th, th * 0.5); ctx.fill();
  ctx.strokeStyle = rgba(lighter(shirt, 0.55), 0.45); ctx.lineWidth = 1.6; ctx.stroke();
  if (o.vest) { ctx.fillStyle = rgba(o.vest, 0.92); rrect(ctx, -tw * 0.36, -th * 0.42, tw * 0.72, th * 0.84, th * 0.3); ctx.fill(); }
  ctx.fillStyle = trim; ctx.fillRect(-1.5, -th * 0.5, 3, th);
  ctx.restore();
  // arms (design space): shoulders are at +-tw/2 along the dancer's right/left
  const cs = Math.cos(face + Math.PI / 2), sn = Math.sin(face + Math.PI / 2);
  const shL = [-s * 0.5 * cs, -s * 0.5 * sn], shR = [s * 0.5 * cs, s * 0.5 * sn];
  const fw = [Math.cos(face), Math.sin(face)];
  const wave = o.wave ?? 0;
  const oy = -bob * s * 0.06;   // the figure is lifted by `bob`; hand targets are given in absolute design coordinates
  const hl = o.handL ? [o.handL[0] - x, o.handL[1] - y - oy] : [shL[0] + fw[0] * s * 0.4 - cs * s * 0.2, shL[1] + fw[1] * s * 0.4 - sn * s * 0.2];
  const hr = o.handR ? [o.handR[0] - x, o.handR[1] - y - oy] : [shR[0] + fw[0] * s * 0.4 + cs * s * 0.2, shR[1] + fw[1] * s * 0.4 + sn * s * 0.2];
  const sleeve = o.sleeve ?? shirt;
  for (const [sh, h] of [[shL, hl], [shR, hr]]) {
    const ex = (sh[0] + h[0]) / 2 + (fw[1]) * s * 0.12 * (sh === shL ? 1 : -1), ey = (sh[1] + h[1]) / 2 - (fw[0]) * s * 0.12 * (sh === shL ? 1 : -1);
    limb(ctx, sh[0], sh[1], ex, ey, s * 0.22, sleeve, true);
    limb(ctx, ex, ey, h[0], h[1], s * 0.17, o.bareArms ? skin : sleeve, false);
    ctx.fillStyle = rgrad(ctx, h[0], h[1], 0, s * 0.14, [[0, lighter(skin, 0.3)], [1, darker(skin, 0.3)]], h[0] - s * 0.04, h[1] - s * 0.04); circ(ctx, h[0], h[1], s * 0.1); ctx.fill();
  }
  void wave;
  // head: skin disc, hair covering the back, a hat or scarf on top
  const hx = 0, hy = -s * 0.04, hrad = s * 0.27;
  ctx.save(); ctx.rotate(face + Math.PI / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; circ(ctx, hx + s * 0.05, hy + s * 0.08, hrad); ctx.fill();
  ctx.fillStyle = rgrad(ctx, hx, hy, 1, hrad * 1.2, [[0, lighter(skin, 0.3)], [0.7, skin], [1, darker(skin, 0.4)]], hx - hrad * 0.3, hy - hrad * 0.3); circ(ctx, hx, hy, hrad); ctx.fill();
  for (const d of [-1, 1]) { ctx.fillStyle = darker(skin, 0.15); ell(ctx, d * hrad * 0.98, hy + hrad * 0.05, hrad * 0.13, hrad * 0.22); ctx.fill(); }
  const hat = o.hat ?? 'hair';
  if (hat === 'hair' || hat === 'scarf') {
    ctx.fillStyle = hat === 'scarf' ? (o.hatCol ?? '#c0392b') : hair;
    ctx.beginPath(); ctx.ellipse(hx, hy + hrad * 0.18, hrad * 1.02, hrad * 0.9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = rgba('#ffffff', 0.18); ell(ctx, hx - hrad * 0.3, hy - hrad * 0.15, hrad * 0.4, hrad * 0.2); ctx.fill();
    if (hat === 'scarf') { ctx.strokeStyle = rgba(trim, 0.8); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx, hy + hrad * 0.15, hrad * 0.75, 0.3, Math.PI - 0.3); ctx.stroke(); }
  } else if (hat === 'chupalla' || hat === 'sombrero') { // wide flat brim, low crown
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(ctx, hx + s * 0.06, hy + s * 0.08, hrad * 1.9, hrad * 1.9); ctx.fill();
    ctx.fillStyle = rgrad(ctx, hx, hy, hrad * 0.3, hrad * 1.9, [[0, lighter(o.hatCol ?? '#d8c070', 0.2)], [1, darker(o.hatCol ?? '#d8c070', 0.35)]], hx - hrad * 0.4, hy - hrad * 0.4); circ(ctx, hx, hy, hrad * 1.85); ctx.fill();
    ctx.strokeStyle = rgba(darker(o.hatCol ?? '#d8c070', 0.5), 0.5); ctx.lineWidth = 1.5; for (let k = 1; k < 4; k++) { circ(ctx, hx, hy, hrad * (0.8 + k * 0.3)); ctx.stroke(); }
    ctx.fillStyle = rgrad(ctx, hx, hy, 0, hrad * 0.9, [[0, lighter(o.hatCol ?? '#d8c070', 0.4)], [1, o.hatCol ?? '#d8c070']], hx - hrad * 0.2, hy - hrad * 0.25); circ(ctx, hx, hy, hrad * 0.85); ctx.fill();
    ctx.strokeStyle = o.trim ?? '#a82a22'; ctx.lineWidth = 4; circ(ctx, hx, hy, hrad * 0.85); ctx.stroke();
  } else if (hat === 'felt') { // Bavarian hat with a tuft
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(ctx, hx + s * 0.05, hy + s * 0.07, hrad * 1.5, hrad * 1.5); ctx.fill();
    ctx.fillStyle = rgrad(ctx, hx, hy, hrad * 0.3, hrad * 1.5, [[0, lighter('#3a5a38', 0.2)], [1, '#1c3220']], hx - hrad * 0.3, hy - hrad * 0.3); circ(ctx, hx, hy, hrad * 1.45); ctx.fill();
    ctx.fillStyle = '#2f4a2c'; circ(ctx, hx, hy, hrad * 0.8); ctx.fill();
    ctx.strokeStyle = '#e8d8a8'; ctx.lineWidth = 3; circ(ctx, hx, hy, hrad * 0.82); ctx.stroke();
    ctx.strokeStyle = '#f2eee0'; ctx.lineWidth = 2.5; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(hx + hrad * 0.5, hy - hrad * 0.2); ctx.lineTo(hx + hrad * (1.1 + 0.15 * k), hy - hrad * (0.5 - 0.1 * k)); ctx.stroke(); }
  } else if (hat === 'kufiya') { // checked headcloth
    ctx.fillStyle = '#f2f0ea'; ctx.beginPath(); ctx.ellipse(hx, hy + hrad * 0.2, hrad * 1.1, hrad * 1.0, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#a82a22'; ctx.lineWidth = 1.5; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(hx + k * hrad * 0.4, hy - hrad * 0.7); ctx.lineTo(hx + k * hrad * 0.4, hy + hrad * 1.1); ctx.moveTo(hx - hrad, hy + k * hrad * 0.4 + hrad * 0.2); ctx.lineTo(hx + hrad, hy + k * hrad * 0.4 + hrad * 0.2); ctx.stroke(); }
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(hx, hy + hrad * 0.1, hrad * 0.9, 0.2, Math.PI - 0.2); ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

// painted floor mark under a lane: a lacquered disc with a lit rim, an icon and a ripple when struck
export function bunting(ctx, x0, y0, x1, y1, n, cols, sag = 24, t = 0) {
  ctx.save();
  ctx.strokeStyle = 'rgba(20,12,6,0.9)'; ctx.lineWidth = 2; ctx.beginPath();
  const pt = (k) => { const u = k / n, y = y0 + (y1 - y0) * u + Math.sin(u * Math.PI) * sag; return [x0 + (x1 - x0) * u, y]; };
  for (let k = 0; k <= 24; k++) { const u = k / 24, p = pt(u * n); if (k === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); }
  ctx.stroke();
  for (let k = 0; k < n; k++) {
    const p = pt(k + 0.5), c = cols[k % cols.length], sw = Math.sin(t * 1.6 + k) * 2.5;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.moveTo(p[0] - 16 + 4, p[1] + 5); ctx.lineTo(p[0] + 16 + 4, p[1] + 5); ctx.lineTo(p[0] + 4 + sw, p[1] + 36); ctx.closePath(); ctx.fill();
    ctx.fillStyle = hgrad(ctx, p[0] - 16, p[0] + 16, [[0, lighter(c, 0.3)], [1, darker(c, 0.3)]]); ctx.beginPath(); ctx.moveTo(p[0] - 16, p[1]); ctx.lineTo(p[0] + 16, p[1]); ctx.lineTo(p[0] + sw, p[1] + 34); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
export { limb };
void mix; void vgrad; void hash;

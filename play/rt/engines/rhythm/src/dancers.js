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


// a hand seen from above: palm, thumb and four fingers pointing along `ang` (radians), lit from the upper left; `open` 0..1 spreads the fingers,
// `curl` 0..1 cups them (sorda clap), `sk` the skin colour
export function hand(ctx, x, y, ang, s, o = {}) {
  const sk = o.skin ?? '#d49a6c', open = o.open ?? 0.35, curl = o.curl ?? 0, side = o.side ?? 1;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = 'rgba(0,0,0,0.26)'; ell(ctx, s * 0.06, s * 0.1, s * 0.5, s * 0.28); ctx.fill();
  const pw = s * 0.27, pl = s * 0.3;
  // fingers (index to little), each a two-joint capsule that fans out and curls
  for (let k = 0; k < 4; k++) {
    const t = (k - 1.5) / 1.5, fa = t * open * 0.5 * side, ln = s * (0.3 - Math.abs(t) * 0.04 + (k === 1 ? 0.02 : 0)), cx0 = s * 0.2, cy0 = t * pw * 0.78;
    const bend = curl * 0.9, j1x = cx0 + Math.cos(fa) * ln * 0.55, j1y = cy0 + Math.sin(fa) * ln * 0.55, j2x = j1x + Math.cos(fa + bend * side) * ln * 0.5, j2y = j1y + Math.sin(fa + bend * side) * ln * 0.5;
    for (const [w, c, dx, dy] of [[s * 0.115, darker(sk, 0.4), s * 0.01, s * 0.015], [s * 0.095, sk, 0, 0], [s * 0.03, lighter(sk, 0.4), -s * 0.015, -s * 0.02]]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx0 + dx, cy0 + dy); ctx.lineTo(j1x + dx, j1y + dy); ctx.lineTo(j2x + dx, j2y + dy); ctx.stroke(); }
  }
  // thumb
  const ta = -side * (0.7 + open * 0.5 - curl * 0.35);
  for (const [w, c, dx, dy] of [[s * 0.13, darker(sk, 0.4), s * 0.01, s * 0.015], [s * 0.105, sk, 0, 0], [s * 0.03, lighter(sk, 0.4), -s * 0.015, -s * 0.02]]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * 0.06 + dx, -side * pw * 0.52 + dy); ctx.lineTo(s * 0.06 + Math.cos(ta) * s * 0.26 + dx, -side * pw * 0.52 + Math.sin(ta) * s * 0.26 + dy); ctx.stroke(); }
  // palm
  ctx.fillStyle = rgrad(ctx, s * 0.02, -s * 0.05, 1, s * 0.34, [[0, lighter(sk, 0.32)], [0.65, sk], [1, darker(sk, 0.4)]], s * 0.02, -s * 0.06);
  rrect(ctx, -s * 0.12, -pw * 0.62, pl + s * 0.04, pw * 1.24, s * 0.12); ctx.fill();
  ctx.strokeStyle = rgba(darker(sk, 0.55), 0.35); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(s * 0.0, -pw * 0.2); ctx.quadraticCurveTo(s * 0.1, 0, s * 0.02, pw * 0.3); ctx.stroke();
  ctx.restore();
}

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
  let f1 = fy - step * s * 0.2, f2 = fy + step * s * 0.2, lift1 = clamp(step, 0, 1), lift2 = clamp(-step, 0, 1), fxl = -fx, fxr = fx;
  if (o.feet) {   // 1.13.0 pose: feet placed explicitly (x across, y forward = negative, in units of s) with their own lift
    const q = o.feet; fxl = q.l[0] * s; f1 = q.l[1] * s; fxr = q.r[0] * s; f2 = q.r[1] * s; lift1 = q.liftL ?? 0; lift2 = q.liftR ?? 0;
  }
  if (o.noLegs) {
    // legs hidden (a long skirt drawn by the caller covers them)
  } else if (o.skirt) {
    if (!o.noShoes) {
    if (o.hose) { limb(ctx, -fx * 0.5, 0, fxl, f1, s * 0.17, o.hose, true); limb(ctx, fx * 0.5, 0, fxr, f2, s * 0.17, o.hose, true); }   // 1.13.0: stockings under a kilt
    shoe(ctx, fxl, f1, s * 0.11 * (o.shoeS ?? 1), s * 0.17 * (o.shoeS ?? 1), 0, o.shoe ?? '#2a1810', lift1); shoe(ctx, fxr, f2, s * 0.11 * (o.shoeS ?? 1), s * 0.17 * (o.shoeS ?? 1), 0, o.shoe ?? '#2a1810', lift2);
    }
    const sw = s * (o.skirtR ?? 0.62) * (1 + 0.08 * Math.sin(step * 2));
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ell(ctx, s * 0.04, s * 0.08, sw, sw * 0.9); ctx.fill();
    if (!o.fur) { ctx.fillStyle = rgrad(ctx, 0, 0, s * 0.1, sw, [[0, lighter(bottom, 0.35)], [0.6, bottom], [1, darker(bottom, 0.5)]], -sw * 0.25, -sw * 0.3); circ(ctx, 0, 0, sw); ctx.fill(); }
    ctx.strokeStyle = rgba(darker(bottom, 0.6), 0.5); ctx.lineWidth = 1.5;
    if (!o.fur) for (let k = 0; k < 14; k++) { const a = (k / 14) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * sw * 0.25, Math.sin(a) * sw * 0.25); ctx.lineTo(Math.cos(a) * sw * 0.98, Math.sin(a) * sw * 0.98); ctx.stroke(); }
    if (o.fur) {   // a kilt of hide strips (amabheshu): tapered pelts, dark and pale, hanging round the waist, with a fringe at the tips
      const nf = 22;
      for (let k = 0; k < nf; k++) { const a = k / nf * TAU, dk = k % 3 === 0, base = dk ? '#3a2418' : k % 3 === 1 ? '#c8a67a' : '#8a6038', ln = sw * (0.98 + 0.08 * Math.sin(k * 2.3 + step * 3));
        ctx.save(); ctx.rotate(a); ctx.fillStyle = rgrad(ctx, ln * 0.55, 0, 0, ln * 0.5, [[0, lighter(base, 0.3)], [1, darker(base, 0.35)]]); ctx.beginPath(); ctx.moveTo(sw * 0.2, -s * 0.07); ctx.quadraticCurveTo(ln * 0.8, -s * 0.1, ln, 0); ctx.quadraticCurveTo(ln * 0.8, s * 0.1, sw * 0.2, s * 0.07); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = rgba(darker(base, 0.6), 0.5); ctx.lineWidth = 1; ctx.stroke(); ctx.strokeStyle = rgba(lighter(base, 0.5), 0.5); ctx.beginPath(); ctx.moveTo(sw * 0.3, -s * 0.02); ctx.lineTo(ln * 0.95, -s * 0.005); ctx.stroke(); ctx.restore(); }
      ctx.fillStyle = rgrad(ctx, 0, 0, 0, sw * 0.35, [[0, darker(bottom, 0.2)], [1, darker(bottom, 0.5)]]); circ(ctx, 0, 0, sw * 0.3); ctx.fill();
    }
    ctx.strokeStyle = rgba(trim, 0.85); ctx.lineWidth = s * 0.05; if (!o.fur) { circ(ctx, 0, 0, sw * 0.92); ctx.stroke(); }
  } else {
    limb(ctx, -fx, 0, fxl, f1, s * 0.2, bottom, true); limb(ctx, fx, 0, fxr, f2, s * 0.2, bottom, true);
    shoe(ctx, fxl, f1 - s * 0.04, s * 0.12, s * 0.17, 0, o.shoe ?? '#1c140e', lift1); shoe(ctx, fxr, f2 - s * 0.04, s * 0.12, s * 0.17, 0, o.shoe ?? '#1c140e', lift2);
  }
  if (o.twist) ctx.rotate(o.twist);   // 1.13.0 pose: shoulders turn against the hips
  // torso: rounded shoulders seen from above
  const tw = s * 0.98, th = s * 0.52;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, -tw / 2 + s * 0.06, -th / 2 + s * 0.1, tw, th, th * 0.5); ctx.fill();
  ctx.fillStyle = hgrad(ctx, -tw / 2, tw / 2, [[0, darker(shirt, 0.45)], [0.28, lighter(shirt, 0.25)], [0.6, shirt], [1, darker(shirt, 0.5)]]); rrect(ctx, -tw / 2, -th / 2, tw, th, th * 0.5); ctx.fill();
  ctx.strokeStyle = rgba(lighter(shirt, 0.55), 0.45); ctx.lineWidth = 1.6; ctx.stroke();
  if (o.vest) { ctx.fillStyle = rgba(o.vest, 0.92); rrect(ctx, -tw * 0.36, -th * 0.42, tw * 0.72, th * 0.84, th * 0.3); ctx.fill(); }
  // cloth: a back seam, a yoke line across the shoulders, soft folds from the armpits, a neck opening that lets the skin show, a lit shoulder cap
  ctx.save(); rrect(ctx, -tw / 2, -th / 2, tw, th, th * 0.5); ctx.clip();
  ctx.strokeStyle = rgba(darker(shirt, 0.7), 0.4); ctx.lineWidth = 1.6;
  for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * tw * 0.4, -th * 0.2); ctx.quadraticCurveTo(d * tw * 0.26, th * 0.05, d * tw * 0.16, th * 0.4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(d * tw * 0.34, -th * 0.34); ctx.quadraticCurveTo(d * tw * 0.2, -th * 0.02, d * tw * 0.3, th * 0.3); ctx.stroke(); }
  ctx.strokeStyle = rgba(lighter(shirt, 0.5), 0.35); ctx.beginPath(); ctx.moveTo(-tw * 0.46, -th * 0.18); ctx.quadraticCurveTo(0, -th * 0.5, tw * 0.46, -th * 0.18); ctx.stroke();
  ctx.fillStyle = rgrad(ctx, -tw * 0.32, -th * 0.28, 0, th * 0.55, [[0, 'rgba(255,255,255,0.3)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-tw / 2, -th / 2, tw, th);
  ctx.fillStyle = rgrad(ctx, tw * 0.34, th * 0.34, 0, th * 0.7, [[0, 'rgba(0,0,0,0.28)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(-tw / 2, -th / 2, tw, th);
  ctx.restore();
  if (!o.skirt || o.neck !== false) { ctx.fillStyle = rgrad(ctx, 0, -th * 0.08, 0, s * 0.2, [[0, lighter(skin, 0.15)], [1, darker(skin, 0.3)]]); ell(ctx, 0, -th * 0.04, s * 0.17, s * 0.13); ctx.fill(); }
  ctx.fillStyle = trim; ctx.fillRect(-1.2, -th * 0.5, 2.4, th * 0.28); ctx.fillRect(-1.2, th * 0.22, 2.4, th * 0.28);
  ctx.restore();
  // arms (design space): shoulders are at +-tw/2 along the dancer's right/left
  const cs = Math.cos(face + Math.PI / 2 + (o.twist ?? 0)), sn = Math.sin(face + Math.PI / 2 + (o.twist ?? 0));
  const shL = [-s * 0.5 * cs, -s * 0.5 * sn], shR = [s * 0.5 * cs, s * 0.5 * sn];
  const fw = [Math.cos(face + (o.twist ?? 0)), Math.sin(face + (o.twist ?? 0))];
  const wave = o.wave ?? 0;
  const oy = -bob * s * 0.06;   // the figure is lifted by `bob`; hand targets are given in absolute design coordinates
  const hl = o.handL ? [o.handL[0] - x, o.handL[1] - y - oy] : [shL[0] + fw[0] * s * 0.4 - cs * s * 0.2, shL[1] + fw[1] * s * 0.4 - sn * s * 0.2];
  const hr = o.handR ? [o.handR[0] - x, o.handR[1] - y - oy] : [shR[0] + fw[0] * s * 0.4 + cs * s * 0.2, shR[1] + fw[1] * s * 0.4 + sn * s * 0.2];
  const sleeve = o.sleeve ?? shirt;
  for (const [sh, h] of [[shL, hl], [shR, hr]]) {
    const ex = (sh[0] + h[0]) / 2 + (fw[1]) * s * 0.12 * (sh === shL ? 1 : -1), ey = (sh[1] + h[1]) / 2 - (fw[0]) * s * 0.12 * (sh === shL ? 1 : -1);
    limb(ctx, sh[0], sh[1], ex, ey, s * 0.22, sleeve, true);
    limb(ctx, ex, ey, h[0], h[1], s * 0.17, o.bareArms ? skin : sleeve, false);
    { const dxh = h[0] - ex, dyh = h[1] - ey, ah = Math.atan2(dyh, dxh), sd = sh === shL ? -1 : 1;
      // a cuff in the trim colour, then the hand continuing the line of the forearm
      ctx.strokeStyle = rgba(darker(trim, 0.2), 0.95); ctx.lineWidth = s * 0.05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(h[0] - Math.cos(ah) * s * 0.07 - Math.sin(ah) * s * 0.085, h[1] - Math.sin(ah) * s * 0.07 + Math.cos(ah) * s * 0.085); ctx.lineTo(h[0] - Math.cos(ah) * s * 0.07 + Math.sin(ah) * s * 0.085, h[1] - Math.sin(ah) * s * 0.07 - Math.cos(ah) * s * 0.085); ctx.stroke();
      hand(ctx, h[0] - Math.cos(ah) * s * 0.05, h[1] - Math.sin(ah) * s * 0.05, ah, s * 0.5, { skin, open: o.fingers ?? 0.1, side: sd, curl: o.grip ?? 0.3 }); }
  }
  void wave;
  // head: skin disc, hair covering the back, a hat or scarf on top
  const hx = 0, hy = -s * 0.04, hrad = s * 0.27;
  ctx.save(); ctx.rotate(face + Math.PI / 2 + (o.twist ?? 0) * 0.6);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; circ(ctx, hx + s * 0.05, hy + s * 0.08, hrad); ctx.fill();
  ctx.fillStyle = rgrad(ctx, hx, hy, 1, hrad * 1.2, [[0, lighter(skin, 0.3)], [0.7, skin], [1, darker(skin, 0.4)]], hx - hrad * 0.3, hy - hrad * 0.3); circ(ctx, hx, hy, hrad); ctx.fill();
  for (const d of [-1, 1]) { ctx.fillStyle = darker(skin, 0.15); ell(ctx, d * hrad * 0.98, hy + hrad * 0.05, hrad * 0.13, hrad * 0.22); ctx.fill(); }
  const hat = o.hat ?? 'hair';
  if (hat === 'hair' || hat === 'scarf') {
    ctx.fillStyle = hat === 'scarf' ? (o.hatCol ?? '#c0392b') : rgrad(ctx, hx - hrad * 0.25, hy - hrad * 0.1, 0, hrad * 1.1, [[0, lighter(hair, 0.42)], [0.55, lighter(hair, 0.12)], [1, darker(hair, 0.3)]]);
    ctx.beginPath(); ctx.ellipse(hx, hy + hrad * 0.18, hrad * 1.02, hrad * 0.9, 0, 0, TAU); ctx.fill();
    // strands from the crown, a parting, a sheen band and the style at the back of the head (bun, braid, long, short)
    if (hat === 'hair') {
      const hs = o.hairStyle ?? 'short', hb = darker(hair, 0.35), hl = lighter(hair, 0.55);
      if (hs === 'braid' || hs === 'long') {
        const len = hs === 'long' ? hrad * 2.2 : hrad * 2.1;
        for (const [w, c, dx] of [[hrad * (hs === 'long' ? 1.5 : 0.62), hb, hrad * 0.05], [hrad * (hs === 'long' ? 1.35 : 0.5), lighter(hair, 0.12), 0]]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx + dx, hy + hrad * 0.7); ctx.quadraticCurveTo(hx + dx + Math.sin(step * 3) * hrad * 0.3, hy + hrad * 1.6, hx + dx, hy + len); ctx.stroke(); }
        if (hs === 'braid') { ctx.strokeStyle = rgba(hb, 0.8); ctx.lineWidth = 1.6; for (let k = 1; k < 7; k++) { const yy = hy + hrad * 0.9 + k * hrad * 0.3; ctx.beginPath(); ctx.moveTo(hx - hrad * 0.2, yy); ctx.lineTo(hx + hrad * 0.2, yy + hrad * 0.12); ctx.stroke(); } ctx.fillStyle = '#c0392b'; circ(ctx, hx, hy + len + hrad * 0.05, hrad * 0.2); ctx.fill(); ctx.fillStyle = '#e8b84a'; circ(ctx, hx, hy + len + hrad * 0.28, hrad * 0.12); ctx.fill(); }
      }
      if (hs === 'bun') { ctx.fillStyle = 'rgba(0,0,0,0.3)'; circ(ctx, hx + 3, hy + hrad * 1.18, hrad * 0.5); ctx.fill(); ctx.fillStyle = rgrad(ctx, hx - hrad * 0.1, hy + hrad * 1.05, 0, hrad * 0.55, [[0, hl], [0.5, hair], [1, hb]]); circ(ctx, hx, hy + hrad * 1.15, hrad * 0.46); ctx.fill(); }
      ctx.strokeStyle = rgba(hb, 0.55); ctx.lineWidth = 1.3; for (let k = 0; k < 18; k++) { const a = Math.PI * 0.12 + k / 17 * Math.PI * 0.76; ctx.beginPath(); ctx.moveTo(hx + Math.cos(a) * hrad * 0.12, hy + hrad * 0.05 + Math.sin(a) * hrad * 0.12); ctx.lineTo(hx + Math.cos(a + 0.12) * hrad * 0.98, hy + hrad * 0.18 + Math.sin(a + 0.12) * hrad * 0.86); ctx.stroke(); }
      ctx.strokeStyle = rgba(hl, 0.7); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(hx - hrad * 0.05, hy + hrad * 0.12, hrad * 0.62, Math.PI * 1.08, Math.PI * 1.62); ctx.stroke();
      ctx.strokeStyle = rgba(skin, 0.7); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(hx, hy - hrad * 0.62); ctx.lineTo(hx + hrad * 0.04, hy + hrad * 0.2); ctx.stroke();
    }
    ctx.fillStyle = rgba('#ffffff', 0.14); ell(ctx, hx - hrad * 0.3, hy - hrad * 0.15, hrad * 0.4, hrad * 0.2); ctx.fill();
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


// ---- poses (1.13.0): a dancer's visible reaction to a cue --------------------------------------------------------------------------------------
// dancePose(kind, f, o) -> options to spread into dancerTop: { handL, handR, feet, twist }.
//   kind: clap | step | hop | spin | kick | squat | idle        f: 0..1 how strongly the cue just struck (the lane flash)
//   o: { x, y, s, face, sg (+1/-1: which side leads), ph (0..1 phase for the idle sway) }
// Figures are authored facing "forward" = -y in the dancer's frame; (lx, ly) are in units of s and are turned by the dancer's facing.
export function dancePose(kind, f, o = {}) {
  const { x = 0, y = 0, s = 100, face = -Math.PI / 2, sg = 1, ph = 0 } = o, a = face + Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a);
  const P = (lx, ly) => [x + (lx * ca - ly * sa) * s, y + (lx * sa + ly * ca) * s];
  const L = (u, v, t) => u + (v - u) * t;
  let hl = [-0.64, -0.4], hr = [0.64, -0.4], fl = [-0.17, -0.42], fr = [0.17, -0.42], liftL = 0, liftR = 0, twist = 0;
  if (kind === 'idle') { const w = Math.sin(ph * 6.283); fl = [-0.17, -0.42 - 0.1 * w]; fr = [0.17, -0.42 + 0.1 * w]; liftL = Math.max(0, w) * 0.5; liftR = Math.max(0, -w) * 0.5; hl = [-0.66, -0.36 + 0.08 * w]; hr = [0.66, -0.36 - 0.08 * w]; }
  else if (kind === 'clap') {
    hl = [L(-0.64, -0.06, f), L(-0.4, -0.66, f)]; hr = [L(0.64, 0.06, f), L(-0.4, -0.66, f)];
    fl = [-0.2, -0.42]; fr = [0.2, -0.42]; twist = 0.05 * sg * f;
  } else if (kind === 'step') {
    hl = [L(-0.64, -0.78 * sg, f), L(-0.4, -0.78, f)]; hr = [L(0.64, 0.8 * sg, f), L(-0.4, 0.0, f)];
    if (sg > 0) { fl = [-0.2, L(-0.42, -0.88, f)]; fr = [0.17, L(-0.42, -0.12, f)]; liftL = f; } else { fr = [0.2, L(-0.42, -0.88, f)]; fl = [-0.17, L(-0.42, -0.12, f)]; liftR = f; }
    twist = 0.22 * sg * f;
  } else if (kind === 'hop') {
    hl = [L(-0.64, -1.0, f), L(-0.4, -0.5, f)]; hr = [L(0.64, 1.0, f), L(-0.4, -0.5, f)];
    fl = [-0.13, L(-0.42, -0.5, f)]; fr = [0.13, L(-0.42, -0.5, f)]; liftL = f; liftR = f;
  } else if (kind === 'spin') {
    hl = [L(-0.64, -1.22, f), L(-0.4, 0.05, f)]; hr = [L(0.64, 1.22, f), L(-0.4, 0.05, f)];
    fl = [-0.24, L(-0.42, -0.36, f)]; fr = [0.1, L(-0.42, -0.5, f)]; liftR = 0.6 * f; twist = 0.5 * sg * f;
  } else if (kind === 'kick') {   // one leg thrown out in front, arms folded on the chest
    hl = [L(-0.64, -0.2, f), L(-0.4, -0.3, f)]; hr = [L(0.64, 0.2, f), L(-0.4, -0.3, f)];
    if (sg > 0) { fl = [L(-0.17, -0.5, f), L(-0.42, -1.12, f)]; liftL = f; fr = [0.2, -0.38]; } else { fr = [L(0.17, 0.5, f), L(-0.42, -1.12, f)]; liftR = f; fl = [-0.2, -0.38]; }
  } else if (kind === 'squat') {  // low squat with the legs thrown wide, arms across the chest
    hl = [L(-0.64, 0.12, f), L(-0.4, -0.36, f)]; hr = [L(0.64, -0.12, f), L(-0.4, -0.46, f)];
    fl = [L(-0.17, -0.62, f), L(-0.42, -0.62, f)]; fr = [L(0.17, 0.62, f), L(-0.42, -0.62, f)];
  }
  return { handL: P(hl[0], hl[1]), handR: P(hr[0], hr[1]), feet: { l: fl, r: fr, liftL, liftR }, twist };
}

// ease an angle (radians) towards a target along the shortest way; st is the caller's own state object
export function smoothAngle(st, anim, target, rate = 8) {
  const dt = st.t == null ? 0 : Math.min(0.1, Math.max(0, anim - st.t)); st.t = anim;
  if (st.a == null) { st.a = target; return target; }
  let d = ((target - st.a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  st.a += d * (1 - Math.exp(-rate * dt)); return st.a;
}

// Costumed hero figure builder (1.25.0): one parametric standing figure for the prop dances (fan, umbrella, bells, chain line). It composes the 1.24 primitives of
// figure-hero.js (two-bone IK, smooth cloth tubes, front head and hand) into legs, an optional skirt, a torso, two bent arms and a head, driven by joint targets
// and a costume record. Authored around x = 0 in a box about 0..800 high (head centre y ~ 92, shoulders y ~ 205, hips y ~ 430, ground y ~ 760); pure drawing, every
// animation is a function of the arguments. The caller draws props from the returned hand ends (out.hands) or from the hooks in the costume.
//   P: { hip:[x,y], fl:[x,y], fr:[x,y] (foot targets), hl:[x,y], hr:[x,y] (hand targets), lean (radians), tilt }
//   f: { skin, legs:{ upper, lower, w, th, sk, sep, ankle, shoe:{col,sole,s,turn} },
//        skirt:{ col, col2, top, hem, w0, w1, sway, pattern(ctx, W, top, hem), trim },
//        torso:{ col, col2, sh, ch, wa, hi, top, bot, detail(ctx, g), belt:{ col, h, buckle } },
//        arm:{ col, w:[3], ua, fa, cuff, cap, bare }, head:{ rx, ry, jaw, smile, turn, hairBack, hairFront },
//        before, afterLegs, afterTorso, hand(ctx, side, end, ang, t), afterHead }
import { clamp, rgrad, hgrad, vgrad, rrect, circ, ell, darker, lighter } from './art.js';
import { ik2, ribbon, headFront, footFront, handFront, limb, lerp } from './figure-hero.js';

export function drawFigure(ctx, P, f, t = 0) {
  const hx = P.hip[0], hy = P.hip[1], L = f.legs ?? {}, T = f.torso ?? {}, A = f.arm ?? {}, Hd = f.head ?? {}, skin = f.skin ?? '#c98e63';
  const out = { hands: [], legs: [] };
  f.before?.(ctx, P, out);
  // ---- legs: cloth to the knee or to the ankle, skin below, a shoe or a bare foot
  for (const sx of [-1, 1]) {
    const ft = sx < 0 ? P.fl : P.fr, ax = hx + sx * (L.sep ?? 42), ay = hy, lift = clamp((742 - ft[1]) / 100, 0, 1);
    const r = ik2(ax, ay, ft[0], ft[1] - (L.ankle ?? 24), L.th ?? 165, L.sk ?? 150, [ax + sx * 130, (ay + ft[1]) / 2 + 20]);
    const m1 = [(ax + r.mid[0]) / 2, (ay + r.mid[1]) / 2], m2 = [(r.mid[0] + r.end[0]) / 2, (r.mid[1] + r.end[1]) / 2], w = L.w ?? [84, 76, 66, 54, 44];
    ribbon(ctx, [[ax, ay], m1, r.mid], [w[0], w[1], w[2]], L.upper ?? skin, { fold: L.fold, rim: 0.3 });
    ribbon(ctx, [r.mid, m2, r.end], [w[2] * 0.96, w[3], w[4]], L.lower ?? skin, { fold: L.fold ? 1 : 0, rim: 0.3, shadow: false });
    if (L.kneeDisc) { ctx.fillStyle = rgrad(ctx, r.mid[0] - 6, r.mid[1] - 6, 1, w[2] * 0.5, [[0, lighter(L.upper ?? skin, 0.06)], [1, darker(L.upper ?? skin, 0.1)]]); circ(ctx, r.mid[0], r.mid[1], w[2] * 0.36); ctx.fill(); }
    f.legs?.after?.(ctx, r, sx, lift, t);
    if (!L.noShoe) footFront(ctx, r.end[0], r.end[1] - 2, { col: L.shoe?.col ?? darker(skin, 0.1), sole: L.shoe?.sole ?? '#6a4630', turn: sx * (L.shoe?.turn ?? 0.6), s: L.shoe?.s ?? 0.9, lift });
    out.legs.push({ sx, ...r, lift });
  }
  f.afterLegs?.(ctx, P, out, t);
  // ---- skirt: a bell from the waist to the hem
  if (f.skirt) {
    const S = f.skirt, sw = S.sway ?? 0, top = S.top ?? hy - 40, hem = S.hem ?? hy + 300;
    ctx.save(); ctx.translate(hx, 0);
    const skirtPath = () => {
      ctx.beginPath(); ctx.moveTo(-S.w0, top); ctx.lineTo(S.w0, top); ctx.bezierCurveTo(S.w0 * 1.25, top + (hem - top) * 0.35, S.w1 + sw, top + (hem - top) * 0.7, S.w1 + sw, hem);
    ctx.quadraticCurveTo(0, hem + (S.dip ?? 26), -S.w1 - sw, hem); ctx.bezierCurveTo(-S.w1 - sw, top + (hem - top) * 0.7, -S.w0 * 1.25, top + (hem - top) * 0.35, -S.w0, top); ctx.closePath();
    };
    skirtPath();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.save(); ctx.translate(8, 10); ctx.fill(); ctx.restore();
    ctx.fillStyle = hgrad(ctx, -S.w1, S.w1, [[0, darker(S.col, 0.34)], [0.28, lighter(S.col, 0.16)], [0.62, S.col], [1, darker(S.col, 0.4)]]); ctx.fill();
    ctx.save(); ctx.clip();
    if (S.pattern) S.pattern(ctx, S.w1 + sw + 20, top, hem);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 2.4; for (let q = -7; q <= 7; q++) { ctx.beginPath(); ctx.moveTo(q * S.w0 / 7.5, top); ctx.quadraticCurveTo(q * (S.w0 + S.w1) / 8 + sw * q * 0.04, (top + hem) / 2, q * (S.w1 + sw) / 7, hem + 10); ctx.stroke(); }
    ctx.fillStyle = hgrad(ctx, -S.w1, S.w1, [[0, 'rgba(0,0,0,0.3)'], [0.3, 'rgba(255,255,255,0.1)'], [0.7, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.36)']]); ctx.fillRect(-S.w1 - 40, top - 4, 2 * S.w1 + 80, hem - top + 60);
    ctx.restore();
    skirtPath(); ctx.strokeStyle = 'rgba(20,6,6,0.55)'; ctx.lineWidth = 2; ctx.stroke();
    if (S.trim) { ctx.fillStyle = S.trim; ctx.beginPath(); ctx.moveTo(-S.w1 - sw, hem - 10); ctx.quadraticCurveTo(0, hem + (S.dip ?? 26) - 10, S.w1 + sw, hem - 10); ctx.lineTo(S.w1 + sw, hem); ctx.quadraticCurveTo(0, hem + (S.dip ?? 26), -S.w1 - sw, hem); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  // ---- torso (rotates about the waist by the lean), arms, then neck and head
  ctx.save(); ctx.translate(hx, 0); ctx.translate(0, hy - 30); ctx.rotate(P.lean ?? 0); ctx.translate(0, -(hy - 30));
  const sy = (T.top ?? 210) + (hy - 430) * 0.92, ty = hy + (T.bot ?? -8), sh0 = T.sh ?? 92, ch = T.ch ?? 88, wa = T.wa ?? 70, hi = T.hi ?? 82;
  if (f.torsoBack) f.torsoBack(ctx, sy, ty);
  const torsoPath = () => {
    ctx.beginPath(); ctx.moveTo(-sh0, sy + 8); ctx.bezierCurveTo(-sh0 * 0.5, sy - 26, sh0 * 0.5, sy - 26, sh0, sy + 8); ctx.bezierCurveTo(ch + 8, sy + 38, ch + 4, sy + 78, wa + 14, (sy + ty) / 2 + 6); ctx.bezierCurveTo(wa, ty - 48, hi - 8, ty - 12, hi, ty + 14);
  ctx.quadraticCurveTo(0, ty + 14 + (T.hem ?? 0), -hi, ty + 14); ctx.bezierCurveTo(-hi + 8, ty - 12, -wa, ty - 48, -wa - 14, (sy + ty) / 2 + 6); ctx.bezierCurveTo(-ch - 4, sy + 78, -ch - 8, sy + 38, -sh0, sy + 8); ctx.closePath();
  };
  torsoPath();
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.save(); ctx.translate(8, 10); ctx.fill(); ctx.restore();
  ctx.fillStyle = hgrad(ctx, -sh0 - 8, sh0 + 8, [[0, darker(T.col2 ?? T.col ?? '#fff', 0.32)], [0.28, lighter(T.col ?? '#fff', 0.14)], [0.66, T.col ?? '#fff'], [1, darker(T.col2 ?? T.col ?? '#fff', 0.3)]]); ctx.fill();
  ctx.strokeStyle = 'rgba(20,16,12,0.5)'; ctx.lineWidth = 2.2; ctx.stroke();
  torsoPath(); ctx.save(); ctx.clip();
  ctx.fillStyle = vgrad(ctx, sy, ty + 14, [[0, 'rgba(255,255,255,0.1)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.2)']]); ctx.fillRect(-hi - 40, sy - 30, 2 * hi + 80, ty - sy + 60);
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * (ch * 0.72), sy + 52); ctx.quadraticCurveTo(d * (wa * 0.82), (sy + ty) / 2, d * (wa * 0.8), ty - 26); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-sh0 * 0.9, sy + 16); ctx.quadraticCurveTo(-ch, sy + 60, -wa, (sy + ty) / 2); ctx.stroke();
  ctx.restore();
  if (T.detail) { torsoPath(); ctx.save(); ctx.clip(); T.detail(ctx, { sy, ty, sh: sh0, wa, hi, t }); ctx.restore(); }
  if (T.belt) { const B = T.belt; ctx.fillStyle = B.col; rrect(ctx, -hi - 2, ty - B.h - 2, 2 * hi + 4, B.h, 6); ctx.fill(); ctx.strokeStyle = rgba2(B.col); ctx.lineWidth = 2; ctx.stroke(); if (B.buckle) { ctx.fillStyle = B.buckle; rrect(ctx, -16, ty - B.h - 4, 32, B.h + 4, 5); ctx.fill(); } }
  f.afterTorso?.(ctx, { sy, ty, sh: sh0, wa, hi }, t);
  // arms: sleeves with a cap, an elbow and a cuff, a hand with spread fingers, then the costume's own prop hook
  for (const sx of [-1, 1]) {
    const sh = [sx * (sh0 - 6), sy + 20], hd = sx < 0 ? P.hl : P.hr, ua = A.ua ?? 128, fa = A.fa ?? 118;
    const rr = ik2(sh[0], sh[1], hd[0], hd[1], ua, fa, A.pref ? A.pref(sx, sh, hd) : [sh[0] + sx * 150, Math.max(sh[1] + 90, (sh[1] + hd[1]) / 2 + 50)]);
    const ang = Math.atan2(rr.end[1] - rr.mid[1], rr.end[0] - rr.mid[0]), w = A.w ?? [58, 46, 34];
    if (f.armBack) f.armBack(ctx, sx, sh, rr, ang, t);
    if (A.sleeve) { limb(ctx, sh, rr.mid, rr.end, [w[0] * 0.8, w[1] * 0.7, w[2] * 0.85], skin, { rim: 0.3, joint: false, shadow: false }); const se = [lerp(sh[0], rr.mid[0], A.sleeve.len ?? 0.6), lerp(sh[1], rr.mid[1], A.sleeve.len ?? 0.6)]; ribbon(ctx, [sh, [(sh[0] + se[0]) / 2, (sh[1] + se[1]) / 2], se], [w[0] * 1.05, w[0] * 0.98, w[1] * 0.98], A.sleeve.col, { rim: 0.3, shadow: false }); if (A.sleeve.trim) { const a2 = Math.atan2(se[1] - sh[1], se[0] - sh[0]); ctx.save(); ctx.translate(se[0], se[1]); ctx.rotate(a2); ctx.fillStyle = A.sleeve.trim; rrect(ctx, -9, -w[1] * 0.5, 12, w[1], 4); ctx.fill(); ctx.restore(); } }
    else limb(ctx, sh, rr.mid, rr.end, w, A.bare ? skin : A.col, { rim: 0.3, cap: A.cap === undefined ? (A.bare ? skin : A.col) : A.cap, cuff: A.cuff, fold: A.fold, shadow: A.bare ? false : undefined, joint: A.joint });
    const hsz = A.hand ?? 76, hxp = rr.end[0] + Math.cos(ang) * hsz * 0.36, hyp = rr.end[1] + Math.sin(ang) * hsz * 0.36;
    if (!A.noHand) handFront(ctx, hxp, hyp, ang, hsz, { skin, open: A.open ?? 0.5, curl: A.curl ?? 0.22, side: sx });
    out.hands.push({ sx, x: rr.end[0], y: rr.end[1], ang, hx: hxp, hy: hyp, mid: rr.mid, sh });
    f.hand?.(ctx, sx, { x: rr.end[0], y: rr.end[1], hx: hxp, hy: hyp }, ang, t);
  }
  ctx.restore();
  // neck and head
  const nx = hx + (P.lean ?? 0) * 20, ny = (hy - 430) * 0.92;
  ctx.save(); ctx.translate(nx, ny); ctx.rotate((P.tilt ?? 0) + (P.lean ?? 0) * 0.4);
  const nw = Hd.neck ?? 40;
  ctx.fillStyle = rgrad(ctx, 0, 176, 0, 60, [[0, lighter(skin, 0.1)], [1, darker(skin, 0.4)]]); rrect(ctx, -nw / 2, 136, nw, 70, 14); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ell(ctx, 0, 156, nw * 0.62, 16); ctx.fill();
  headFront(ctx, 0, Hd.y ?? 104, Hd.rx ?? 47, Hd.ry ?? 58, { skin, turn: Hd.turn ?? 0.2, jaw: Hd.jaw ?? 0.3, smile: Hd.smile, hairBack: Hd.hairBack, hairFront: Hd.hairFront });
  f.afterHead?.(ctx, t);
  ctx.restore();
  return out;
}
const rgba2 = (c) => darker(c, 0.5);
void lerp; void ell;

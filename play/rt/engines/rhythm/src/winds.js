// Wind instruments as the play surface: the real pipe is drawn large with its blowing hole, finger holes and the player's hands.
// A note is tapped where the highest open hole is (all holes covered = the foot); the breath travels down the tube to it.
// The player's head sits at the mouthpiece, hands and forearms cover the holes; the instrument stands on a dressed surface (set.js).
import { clamp, mix, rgba, lighter, darker, glow, rrect, grain, hgrad, vgrad, rgrad, hash, ell, circ, TAU } from './art.js';
import { makeFrame, circleSpot, finishSpots, hitSpots, pill, lerp } from './stagekit.js';
import { bust } from './performer.js';
import { setting, instrumentBox } from './set.js';

const IDS = [[/dizi|di\b/, 'dizi'], [/mijwiz|mizmar|arghul|clarinet|double/, 'mijwiz'], [/bansuri|flute|fujara|shakuhachi|ney|duduk|khene|siku|alphorn/, 'bansuri']];
const VIEW = { bansuri: { tilt: 0.6, dx: -0.1, zoom: 1.0 }, dizi: { tilt: -0.25, dx: 0.1, zoom: 0.9 }, mijwiz: { tilt: 0.0 } };
export function windId(key) { const k = String(key || '').toLowerCase(); for (const [re, id] of IDS) if (re.test(k)) return id; return 'bansuri'; }

const SKIN = '#e2a577';
const LOOK = {
  bansuri: { set: { kind: 'cloth', base: '#2a5a5a', accent: '#e8c070', light: '#ffd9a0' }, shirt: '#c0562a', hc: '#f0e0b8', hw: 'wrap', skin: '#c88a5a' },
  dizi: { set: { kind: 'cloth', base: '#27402c', accent: '#d8c070', light: '#e8ffd0' }, shirt: '#a02a2a', hc: '#1a1a1a', hw: 'hair', skin: '#e8b890' },
  mijwiz: { set: { kind: 'tiles', base: '#3a5a6a', accent: '#d8b45a', light: '#ffe0a8' }, shirt: '#e8e0cc', hc: '#c03a2a', hw: 'wrap', skin: '#d29a70' },
};

export function createWindStage(id, S, lanes, P) {
  const N = lanes.length;
  const st = { id, kind: 'winds', spots: new Array(N).fill(null), voice: id === 'mijwiz' ? 'reed' : 'breath', F: null, G: null };
  const spots = st.spots;
  const look = LOOK[id] ?? LOOK.bansuri;
  const nHoles = clamp(Math.max(0, ...lanes.map((l) => (l.holes || '').length)) || 6, 3, 9);
  const first = lanes.map((l, i) => {
    const h = l.holes || '';
    if (!h) return null;
    let c = 0; while (c < h.length && h[c] === '1') c++;
    return c;
  });
  const byPitch = lanes.map((_, i) => i).sort((a, b) => lanes[a].hz - lanes[b].hz);
  byPitch.forEach((i, rank) => { if (first[i] == null) first[i] = clamp(nHoles - rank, 0, nHoles); });
  const reg = new Array(N).fill(0);
  const groups = new Map();
  byPitch.forEach((i) => { const key = first[i]; groups.set(key, [...(groups.get(key) ?? []), i]); });
  groups.forEach((list) => list.forEach((i, r) => { reg[i] = r; }));
  const fingerOf = (i) => { const h = lanes[i].holes || ''; return Array.from({ length: nHoles }, (_, k) => (h ? h[k] === '1' : k < first[i])); };

  const fing = new Array(nHoles).fill(1);   // 1 = covered (finger down); eased toward the sounding note's fingering
  let lastAnim = 0;

  st.layout = (area) => {
    const portrait = area.h >= area.w * 1.15;
    const F = makeFrame(area, { top: id === 'mijwiz' && portrait ? 150 : 40, bottom: 10, side: 16, ...(VIEW[id] ?? {}) });
    st.F = F;
    const { W, H } = F;
    const twin = id === 'mijwiz';
    const pw = clamp(Math.min(W * 0.2, 118), 60, 118) * (twin ? 0.6 : 1);
    const mouthU = H * 0.05, footU = H * 0.95, holeU0 = H * (id === 'dizi' ? 0.36 : 0.32), holeU1 = H * 0.86;
    const step = (holeU1 - holeU0) / nHoles;
    const G = { W, H, pw, twin, mouthU, footU, holeU0, holeU1, step, regGap: clamp(W * 0.22, 70, 150), pipeV: twin ? -pw * 0.62 : 0 };
    G.holeAt = (k) => holeU0 + (k + 0.5) * step;
    st.G = G;
    const R = clamp(step * 0.5, 26, 40);
    lanes.forEach((_, i) => {
      const c = first[i], u = c >= nHoles ? footU + 4 : G.holeAt(c), v = G.pipeV + (reg[i] ? (pw * 0.5 + G.regGap * 0.6) * (twin ? 1.2 : 1) + (reg[i] - 1) * G.regGap * 0.9 : 0);
      spots[i] = circleSpot(v, u, R + (reg[i] ? 6 : 0), { first: c, reg: reg[i] });
    });
    finishSpots(F, spots);
  };
  st.hit = (x, y) => (st.F ? hitSpots(st.F, spots, x, y) : -1);
  st.anchor = (i) => ({ x: spots[i]?.x ?? 0, y: spots[i]?.y ?? 0 });

  const pipeBody = (ctx, v, w, u0, u1, body, wrap) => {
    ctx.fillStyle = 'rgba(0,0,0,0.34)'; rrect(ctx, v - w / 2 + 9, u0 + 12, w, u1 - u0, w * 0.3); ctx.fill();
    ctx.fillStyle = hgrad(ctx, v - w / 2, v + w / 2, [[0, darker(body, 0.6)], [0.2, lighter(body, 0.55)], [0.42, body], [0.8, darker(body, 0.4)], [1, darker(body, 0.7)]]);
    rrect(ctx, v - w / 2, u0, w, u1 - u0, w * 0.3); ctx.fill();
    ctx.save(); rrect(ctx, v - w / 2, u0, w, u1 - u0, w * 0.3); ctx.clip();
    grain(ctx, v - w / 2, u0, w, u1 - u0, darker(body, 0.7), 0.4, 7, true, 12);
    // bamboo freckles
    for (let k = 0; k < 60; k++) { ctx.fillStyle = 'rgba(40,24,8,0.28)'; ell(ctx, v - w / 2 + hash(k) * w, u0 + hash(k + 40) * (u1 - u0), 1.2 + hash(k + 9) * 1.6, 0.6 + hash(k + 11) * 0.8); ctx.fill(); }
    for (const q of [0.2, 0.58, 0.84]) { const u = lerp(u0, u1, q); ctx.fillStyle = rgba(darker(body, 0.65), 0.7); ctx.fillRect(v - w / 2, u, w, 6); ctx.fillStyle = rgba(lighter(body, 0.6), 0.45); ctx.fillRect(v - w / 2, u + 6, w, 2.5); }
    // long specular streak
    ctx.fillStyle = hgrad(ctx, v - w * 0.34, v - w * 0.1, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,240,0.38)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(v - w * 0.34, u0 + 6, w * 0.24, u1 - u0 - 12);
    ctx.restore();
    ctx.strokeStyle = rgba(lighter(body, 0.7), 0.45); ctx.lineWidth = 2; rrect(ctx, v - w / 2, u0, w, u1 - u0, w * 0.3); ctx.stroke();
    // lashings at both ends: thread wrapped in two colours
    for (const [a, b] of [[u0 + 16, u0 + 16 + w * 0.5], [u1 - 16 - w * 0.5, u1 - 16]]) {
      ctx.fillStyle = vgrad(ctx, a, b, [[0, lighter(wrap, 0.25)], [1, darker(wrap, 0.3)]]); ctx.fillRect(v - w / 2 - 2, a, w + 4, b - a);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; for (let y = a; y < b; y += 5) { ctx.beginPath(); ctx.moveTo(v - w / 2 - 2, y); ctx.lineTo(v + w / 2 + 2, y); ctx.stroke(); }
      ctx.fillStyle = 'rgba(232,200,110,0.55)'; for (let y = a + 3; y < b; y += 10) ctx.fillRect(v - w / 2 - 2, y, w + 4, 2);
    }
  };

  st.draw = (g, rt) => {
    const { ctx } = g, F = st.F, G = st.G;
    if (!F) return;
    const { pw, mouthU, footU, step } = G;
    // fingering follows the sounding note (the loudest lane), eased
    let act = -1, best = 0.02;
    lanes.forEach((_, i) => { const v = rt.flash[i] + (rt.hold[i] ?? 0) * 0.6; if (v > best) { best = v; act = i; } });
    const dtv = clamp(rt.anim - lastAnim, 0, 0.1); lastAnim = rt.anim;
    const tgt = act >= 0 ? fingerOf(act) : new Array(nHoles).fill(true);
    for (let k = 0; k < nHoles; k++) fing[k] += ((tgt[k] ? 1 : 0) - fing[k]) * clamp(dtv * 18, 0, 1);
    const body = id === 'dizi' ? '#8fae4e' : id === 'mijwiz' ? '#d4b982' : '#dbaa4c';
    const wrap = id === 'dizi' ? '#b3262a' : id === 'mijwiz' ? '#2e6a7a' : '#7a3a1c';

    // surface and the player's head and shoulders at the mouthpiece
    setting(ctx, F, look.set.kind, S, rt, { ...look.set, rugKind: null, bbox: instrumentBox(F) });
    {
      const mouth = F.map(G.pipeV, mouthU + (id === 'mijwiz' ? -20 : pw * 1.55)), out = F.map(G.pipeV, mouthU - 100), side = F.map(G.pipeV - 100, mouthU + pw * 1.55);
      const ax = out[0] - F.map(G.pipeV, mouthU)[0], ay = out[1] - F.map(G.pipeV, mouthU)[1], al = Math.hypot(ax, ay) || 1;
      const sx = side[0] - mouth[0], sy = side[1] - mouth[1], sl = Math.hypot(sx, sy) || 1;
      const hr = clamp(pw * 0.85, 30, 84);
      // the head sits beside the blowing hole (flutes held across) or straight beyond the reeds (double clarinet)
      const dir = id === 'mijwiz' ? [ax / al, ay / al] : [sx / sl * 0.9 + ax / al * 0.3, sy / sl * 0.9 + ay / al * 0.3];
      const dl = Math.hypot(dir[0], dir[1]) || 1;
      const cx = mouth[0] + (dir[0] / dl) * hr * 1.0, cy = mouth[1] + (dir[1] / dl) * hr * 1.0;
      // the reeds of the double clarinet point away from the head (it follows the pipe); a flute player sits upright beside the blowing hole
      const ang = 0;
      ctx.save(); ctx.beginPath(); ctx.rect(F.area.x, F.area.y, F.area.w, F.area.h); ctx.clip();
      bust(ctx, cx, cy, hr, ang, { skin: look.skin, shirt: look.shirt, hw: look.hw, hc: look.hc, puff: id === 'mijwiz' ? 0.14 + 0.1 * Math.max(0, ...lanes.map((_, i) => rt.hold[i] ?? 0)) : 0 });
      ctx.restore();
    }

    ctx.save(); F.apply(ctx);
    const pipes = G.twin ? [G.pipeV, G.pipeV + pw * 1.12] : [G.pipeV];
    pipes.forEach((pv, pi) => {
      const u1 = pi === 1 ? footU - H_SHORT(F) : footU;
      pipeBody(ctx, pv, pw, mouthU, u1, body, wrap);
      if (!G.twin) {
        if (id === 'bansuri' || id === 'dizi') { // side blowing hole near the sealed end, with a lip plate
          ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, pv + 3, mouthU + pw * 1.55 + 4, pw * 0.3, pw * 0.4); ctx.fill();
          ctx.fillStyle = '#150a04'; ell(ctx, pv, mouthU + pw * 1.55, pw * 0.2, pw * 0.3); ctx.fill();
          ctx.strokeStyle = rgba(lighter(body, 0.7), 0.8); ctx.lineWidth = 2.5; ctx.stroke();
          ctx.fillStyle = '#0a0402'; ell(ctx, pv, mouthU + 6, pw * 0.5, 9); ctx.fill();
        }
      } else {
        ctx.fillStyle = vgrad(ctx, mouthU - 36, mouthU + 6, [[0, '#f0dfa4'], [1, '#a07a30']]); rrect(ctx, pv - pw * 0.28, mouthU - 36, pw * 0.56, 46, 6); ctx.fill();
        ctx.fillStyle = '#2a1608'; ctx.fillRect(pv - 1.5, mouthU - 30, 3, 22);
      }
      if (id === 'dizi') { // the membrane hole between the embouchure and the finger holes, covered with thin paper
        const mu = mouthU + (G.holeU0 - mouthU) * 0.5;
        ctx.fillStyle = '#0c0603'; ell(ctx, pv, mu, pw * 0.2, pw * 0.2); ctx.fill();
        ctx.fillStyle = 'rgba(255,248,230,0.78)'; ell(ctx, pv, mu, pw * 0.18, pw * 0.18); ctx.fill();
        ctx.strokeStyle = 'rgba(120,90,50,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      for (let k = 0; k < nHoles; k++) {
        const u = G.holeAt(k), r = Math.min(pw * 0.2, step * 0.22);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, pv + 2, u + 3, r + 2, r * 1.05 + 2); ctx.fill();
        ctx.fillStyle = rgrad(ctx, pv, u, 0, r * 1.1, [[0, '#000000'], [0.7, '#140a04'], [1, '#2a1608']]); ell(ctx, pv, u, r, r * 1.05); ctx.fill();
        ctx.strokeStyle = rgba(lighter(body, 0.65), 0.9); ctx.lineWidth = 2; ctx.stroke();
      }
    });
    if (id === 'dizi') { // tassel at the foot
      ctx.strokeStyle = '#b3262a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(G.pipeV + pw * 0.3, footU - 12); ctx.quadraticCurveTo(G.pipeV + pw * 0.9, footU + 10, G.pipeV + pw * 0.6, footU + 30); ctx.stroke();
      for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(G.pipeV + pw * 0.6, footU + 30); ctx.lineTo(G.pipeV + pw * 0.6 + (k - 2.5) * 5, footU + 56); ctx.stroke(); }
    }
    // the air column: lit while the note sounds, from the mouth to the first open hole
    lanes.forEach((l, i) => {
      const sp = spots[i], hv = Math.max(rt.flash[i] * 0.9, (rt.hold[i] ?? 0) * 0.8);
      if (hv <= 0.03) return;
      const u1 = sp.u;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const col = l.color, v0 = G.pipeV;
      ctx.fillStyle = vgrad(ctx, mouthU, u1, [[0, rgba(col, 0.55 * hv)], [1, rgba(col, 0.12 * hv)]]); rrect(ctx, v0 - pw * 0.22, mouthU + 6, pw * 0.44, Math.max(4, u1 - mouthU - 6), pw * 0.2); ctx.fill();
      ctx.restore();
      const ex = sp.v, ey = sp.u;
      ctx.strokeStyle = rgba('#ffffff', 0.6 * hv); ctx.lineWidth = 3;
      for (let q = 0; q < 3; q++) { const p = ((rt.anim * 1.7 + q / 3) % 1); ctx.globalAlpha = (1 - p) * hv; ctx.beginPath(); ctx.arc(ex + (sp.reg ? 0 : pw * 0.5), ey, 14 + 40 * p, -0.9, 0.9); ctx.stroke(); }
      ctx.globalAlpha = 1;
      glow(ctx, ex, ey, 70, col, 0.5 * hv);
    });
    // hands: three fingers of each hand across the holes (palm and sleeve come in from the left), lifting away when a hole opens
    const perHand = Math.ceil(nHoles / 2);
    for (let h = 0; h < 2; h++) {
      const k0 = h * perHand, k1 = Math.min(nHoles, k0 + perHand);
      if (k1 <= k0) continue;
      const pv = G.pipeV, fw = Math.min(step * 0.5, pw * 0.46), len = pw * 0.9 + 50;
      const uTop = G.holeAt(k0) - fw * 0.6, uBot = G.holeAt(k1 - 1) + fw * 0.6;
      const open = 1 - (fing.slice(k0, k1).reduce((a, b) => a + b, 0) / (k1 - k0));
      const px = pv - len - 8 - open * 12;
      // sleeve running off to the left, then the palm
      const sleeve = look.shirt, pad = Math.max(fw * 0.7, (uBot - uTop) * 0.16);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, px - 170 + 8, uTop - pad + 10, 170, uBot - uTop + 2 * pad, pad); ctx.fill();
      ctx.fillStyle = vgrad(ctx, uTop - pad, uBot + pad, [[0, lighter(sleeve, 0.22)], [0.5, sleeve], [1, darker(sleeve, 0.45)]]); rrect(ctx, px - 170, uTop - pad, 160, uBot - uTop + 2 * pad, pad); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(px - 20, uTop - pad, 6, uBot - uTop + 2 * pad);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, px - 12 + 6, uTop - fw * 0.35 + 8, 70, uBot - uTop + fw * 0.7, fw * 0.5); ctx.fill();
      ctx.fillStyle = vgrad(ctx, uTop - fw * 0.4, uBot + fw * 0.4, [[0, lighter(SKIN, 0.35)], [0.5, SKIN], [1, darker(SKIN, 0.4)]]); rrect(ctx, px - 14, uTop - fw * 0.4, 72, uBot - uTop + fw * 0.8, fw * 0.5); ctx.fill();
      ctx.strokeStyle = 'rgba(100,50,20,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    for (let k = 0; k < nHoles; k++) {
      const u = G.holeAt(k), c = fing[k], pv = G.pipeV, fw = Math.min(step * 0.5, pw * 0.46), len = pw * 0.9 + 50;
      const x1 = pv + 4 - (1 - c) * (pw * 0.5 + 34), y = u - (1 - c) * 6;
      ctx.save(); ctx.globalAlpha = 0.5 + 0.5 * c;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, x1 - len + 6, y - fw / 2 + 8, len, fw, fw / 2); ctx.fill();
      ctx.fillStyle = vgrad(ctx, y - fw / 2, y + fw / 2, [[0, lighter(SKIN, 0.4)], [0.5, SKIN], [1, darker(SKIN, 0.35)]]); rrect(ctx, x1 - len, y - fw / 2, len, fw, fw / 2); ctx.fill();
      ctx.strokeStyle = 'rgba(100,50,20,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
      // knuckle creases and a nail
      ctx.strokeStyle = 'rgba(100,50,20,0.3)'; for (const q of [0.35, 0.6]) { ctx.beginPath(); ctx.moveTo(x1 - len * q, y - fw * 0.3); ctx.lineTo(x1 - len * q, y + fw * 0.3); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,230,210,0.55)'; rrect(ctx, x1 - fw * 0.65, y - fw * 0.25, fw * 0.5, fw * 0.5, fw * 0.2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ell(ctx, x1 - fw * 0.5, y - fw * 0.16 - fw * 0.0, fw * 0.36, fw * 0.12); ctx.fill();
      ctx.restore();
    }
    // approach cues: a breath bead travels down the tube to the hole where the note is made
    for (let k = rt.list.length - 1; k >= 0; k--) {
      const t = rt.list[k];
      if (t.state && t.state !== 'pending' && t.state !== 'miss') continue;
      const tau = (t.t - rt.clock) / rt.look;
      if (tau > 1.0 || tau < -0.25) continue;
      const sp = spots[t.lane], l = lanes[t.lane], miss = t.state === 'miss';
      const a = (rt.soft ? 0.5 : 1) * (miss ? 0.35 : 1) * clamp((1.05 - tau) * 8, 0, 1) * clamp((tau + 0.25) * 6, 0, 1);
      const col = miss ? mix(l.color, '#555555', 0.6) : l.color, p = clamp(1 - tau, 0, 1.05);
      const x = lerp(G.pipeV, sp.v, p), y = lerp(mouthU + 10, sp.u, p);
      ctx.save(); ctx.globalAlpha = a * 0.55; ctx.strokeStyle = rgba(col, 0.9); ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(G.pipeV, mouthU + 10); ctx.lineTo(x, y); ctx.stroke(); ctx.restore();
      glow(ctx, x, y, 40 + 30 * p, col, 0.4 * a);
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = rgba(lighter(col, 0.6), 0.95); circ(ctx, x, y, 12 + 4 * p); ctx.fill(); ctx.strokeStyle = rgba(col, 1); ctx.lineWidth = 3; ctx.stroke();
      const sc = 1 + 0.9 * clamp(tau, 0, 1);
      ctx.strokeStyle = rgba(lighter(col, 0.45), 0.9); ctx.lineWidth = 2.5; rrect(ctx, sp.v - 34 * sc, sp.u - 18 * sc, 68 * sc, 36 * sc, 18 * sc); ctx.stroke(); ctx.restore();
    }
    lanes.forEach((l, i) => {
      const sp = spots[i], f = rt.flash[i];
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 4; rrect(ctx, sp.v - 32 + 1, sp.u - 17 + 2, 64, 34, 17); ctx.stroke();
      ctx.strokeStyle = rgba(lighter(l.color, 0.4), 0.6 + 0.4 * f); ctx.lineWidth = 2.5; rrect(ctx, sp.v - 32, sp.u - 17, 64, 34, 17); ctx.stroke();
      if (sp.reg) {
        ctx.strokeStyle = rgba(l.color, 0.4); ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.moveTo(sp.v, sp.u); ctx.lineTo(G.pipeV + pw * 0.5, sp.u); ctx.stroke(); ctx.setLineDash([]);
      }
    });
    ctx.restore();
    const size = g.px(15);
    lanes.forEach((l, i) => { const sp = spots[i], [x, y] = F.map(sp.v, sp.u); pill(ctx, l.name, x, y, 74, size, l.color, rt.flash[i]); });
  };
  return st;
}
const H_SHORT = (F) => F.H * 0.04;

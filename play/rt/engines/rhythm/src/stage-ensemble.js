// Drum ensemble stages (1.11.0): several instruments on one stage, each lane `row` (0..3) belonging to one instrument of the group.
//   samulnori (Korea):  hand gong (kkwaenggwari), large gong (jing), hourglass drum (janggu), barrel drum (buk)
//   candombe (Uruguay): chico, repique and piano: three tall tapered drums, each struck with a stick and the bare hand
//   bodu-beru (Maldives): two big log drums played with the hands, and a small drum
//   bomba (Puerto Rico): buleador and subidor (two upright barrel drums), cua sticks on a wooden shell with maraca, and the dancer
// Cells: 2 x 2 on a portrait screen, a row on a landscape one (three instruments: one wide cell above two in portrait). No player is drawn;
// the bomba dancer is a ruffled skirt seen from above. Lane names pick the zone of an instrument, otherwise its lanes take the zones low to high.
import { registerDrumStage } from './registry.js';
import { createDrumStage, eSpot, eRing, eSector, beater, rectSpot, rot2, skinHead, hoop, tubeShade, barrelPath, vStraps, dropShadow, studRing } from './drum-kit.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU } from './drum-kit.js';
import { text } from './art.js';
import { dancerTop, hand } from './dancers.js';

const lerp = (a, b, t) => a + (b - a) * t;
const NAMES = { kkwae: 'Kkwaenggwari', jing: 'Jing', janggu: 'Janggu', buk: 'Buk', chico: 'Chico', repique: 'Repique', piano: 'Piano', log: 'Bodu beru', small: 'Small drum', bul: 'Buleador', sub: 'Subidor', cua: 'Cua and maraca', dancer: 'Dancer' };

// ---- the painters: each draws in the cell's local frame (origin = cell centre, hw/hh = half sizes) and lists its zones -----------------------------
const brassGrad = (ctx, r) => rgrad(ctx, 0, 0, r * 0.05, r, [[0, '#fff0b0'], [0.35, '#e8c25a'], [0.75, '#b88a2a'], [1, '#6a4a10']], -r * 0.3, -r * 0.35);

function gongFace(ctx, r, f, o = {}) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, r * 0.1 + 10, r * 0.16 + 14, r); ctx.fill();
  ctx.fillStyle = darker(o.rim ?? '#8a6418', 0.1); circ(ctx, 0, 0, r); ctx.fill();
  ctx.fillStyle = brassGrad(ctx, r); circ(ctx, 0, 0, r * 0.93); ctx.fill();
  ctx.strokeStyle = 'rgba(70,40,6,0.35)'; ctx.lineWidth = 1.6; for (let k = 1; k < 9; k++) { circ(ctx, 0, 0, r * 0.93 * k / 9); ctx.stroke(); }   // spun rings
  ctx.strokeStyle = 'rgba(255,248,200,0.35)'; ctx.lineWidth = 1.2; for (let k = 1; k < 9; k++) { ctx.beginPath(); ctx.arc(0, 0, r * 0.93 * (k + 0.4) / 9, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke(); }
  ctx.fillStyle = rgrad(ctx, 0, 0, 0, r * (o.boss ?? 0.3), [[0, '#fff6c0'], [0.5, '#d9a93a'], [1, '#8a6414']], -r * 0.08, -r * 0.1); circ(ctx, 0, 0, r * (o.boss ?? 0.3)); ctx.fill();
  ctx.strokeStyle = 'rgba(255,248,200,0.5)'; ctx.lineWidth = 2; circ(ctx, 0, 0, r * 0.93); ctx.stroke();
  if (f > 0.05) { for (let k = 0; k < 3; k++) { const p = clamp((1 - f) * 1.3 - k * 0.2, 0, 1); if (p <= 0) continue; ctx.strokeStyle = `rgba(255,248,210,${0.55 * (1 - p)})`; ctx.lineWidth = 2.5; circ(ctx, 0, 0, r * (0.4 + 0.55 * p)); ctx.stroke(); } }
  ctx.restore();
}

function skinDrumFace(ctx, rx, ry, f, o = {}) {
  hoop(ctx, rx, ry, o.hw ?? 16, { kind: o.hoopKind ?? 'wood', col: o.hoopCol ?? '#b8864a', seed: o.seed ?? 3 });
  skinHead(ctx, rx, ry, { tint: o.tint ?? '#efe0bb', edge: o.edge ?? '#b89a64', seed: o.seed ?? 5, vib: f, wear: 0.7, paste: o.paste ?? [] });
}

const PAINT = {
  kkwae: {
    zones: [['c', /kwa|ring|open|gwang/], ['m', /kak|mute|damp|tap|rim/]],
    spots: (c) => ({ c: eSpot(c.cx, c.cy + 6, c.R * 0.45, c.R * 0.45, 0, { apk: 1 }), m: eRing(c.cx, c.cy + 6, c.R * 0.95, c.R * 0.95, 0, 0.62, 1.0, -Math.PI * 0.2) }),
    size: (hw, hh) => Math.min(hw, hh) * 0.62,
    draw(ctx, c, f) { const r = c.R; ctx.save(); ctx.translate(0, 6);
      ctx.strokeStyle = '#6a3a1c'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-r * 0.2, -r * 0.92); ctx.quadraticCurveTo(0, -r * 1.35, r * 0.2, -r * 0.92); ctx.stroke();   // the cord to hold it by
      gongFace(ctx, r, f.c ?? 0, { boss: 0.26 });
      // the wooden mallet lying near the rim
      ctx.save(); ctx.translate(r * 0.95, r * 0.78); ctx.rotate(-0.9); ctx.fillStyle = vgrad(ctx, -6, 6, [[0, '#e8c58e'], [1, '#8a5a2a']]); rrect(ctx, 0, -5, r * 0.9, 10, 5); ctx.fill(); ctx.fillStyle = '#c28a4a'; ell(ctx, r * 0.95, 0, 11, 9); ctx.fill(); ctx.restore();
      ctx.restore(); },
  },
  jing: {
    zones: [['c', /jing|open|boss|centre|center/], ['m', /mute|damp|edge|stop/]],
    spots: (c) => ({ c: eSpot(c.cx, c.cy + 10, c.R * 0.4, c.R * 0.4, 0, { apk: 1 }), m: eRing(c.cx, c.cy + 10, c.R, c.R, 0, 0.62, 0.96, Math.PI * 0.2) }),
    size: (hw, hh) => Math.min(hw * 0.74, hh * 0.72),
    draw(ctx, c, f) { const r = c.R; ctx.save(); ctx.translate(0, 10);
      // wooden frame
      ctx.fillStyle = hgrad(ctx, -r * 1.2, -r * 1.05, [[0, '#2a1608'], [0.5, '#7a4a22'], [1, '#2a1608']]); rrect(ctx, -r * 1.18, -r * 1.3, r * 0.14, r * 2.3, 6); ctx.fill();
      ctx.fillStyle = hgrad(ctx, r * 1.05, r * 1.2, [[0, '#2a1608'], [0.5, '#7a4a22'], [1, '#2a1608']]); rrect(ctx, r * 1.04, -r * 1.3, r * 0.14, r * 2.3, 6); ctx.fill();
      ctx.fillStyle = vgrad(ctx, -r * 1.32, -r * 1.18, [[0, '#a8683a'], [1, '#4a2a10']]); rrect(ctx, -r * 1.24, -r * 1.34, r * 2.48, r * 0.16, 6); ctx.fill();
      ctx.strokeStyle = '#d8c8a0'; ctx.lineWidth = 4; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * r * 0.5, -r * 1.2); ctx.lineTo(d * r * 0.72, -r * 0.7); ctx.stroke(); }
      gongFace(ctx, r, f.c ?? 0, { boss: 0.24, rim: '#6a4a10' });
      ctx.restore(); },
  },
  janggu: {
    zones: [['l', /gung|low|left|mallet|dung|bass/], ['r', /deok|duk|right|high|thin|stick|ttak/], ['rim', /rim|gi\b|kung|click/]],
    size: (hw, hh) => Math.min(hw * 0.44, hh * 0.4),
    spots(c) { const R = c.R, L = c.hw * 1.5, rx = R * 0.42, a = c.jt ?? 0, Pt = (x, y) => { const [u, v] = rot2(x, y, a); return [c.cx + u, c.cy + v]; }, [lx, ly] = Pt(-L / 2, 0), [rx0, ry0] = Pt(L / 2, 0);
      return { l: eSpot(lx, ly, rx * 0.65, R * 0.55, a, { apk: 1 }), r: eSpot(rx0, ry0, rx * 0.65, R * 0.55, a, { apk: 1 }), rim: eRing(rx0, ry0, rx, R, a, 1.0, 1.28, -Math.PI * 0.3) }; },
    draw(ctx, c, f) { const R = c.R, L = c.hw * 1.5, rx = R * 0.42, xL = -L / 2, xR = L / 2, waist = R * 0.3, rAt = (t) => lerp(waist, R * 1.02, Math.pow(Math.abs(2 * t - 1), 1.6)) + 3;
      ctx.save(); ctx.rotate(c.jt ?? 0);
      const body = barrelPath(xL + rx * 0.2, xR - rx * 0.2, rAt, 50); dropShadow(ctx, body, 10, 16, 0.4);
      tubeShade(ctx, body, R + 8, '#9a5a2c', { hl: 0.3, dark: 0.34, spec: 0.28 });
      ctx.save(); body(ctx); ctx.clip(); grain(ctx, xL, -R, L, 2 * R, '#3a1c08', 0.4, 5, false, 18); ctx.restore();
      vStraps(ctx, { xL, xR, rAt, n: 6, col: '#c8452f', w: 6.5, rL: R + 5, rR: R + 5, aL: rx * 0.1, aR: rx * 0.1 });
      for (const [x, face, fv, tint] of [[xL, -1, f.l ?? 0, '#e4cc9a'], [xR, 1, Math.max(f.r ?? 0, f.rim ?? 0), '#f2e6c4']]) { ctx.save(); ctx.translate(x, 0); skinDrumFace(ctx, rx, R, fv, { hw: 10, hoopKind: 'wood', hoopCol: '#c8a068', tint, seed: 7 + face }); ctx.restore(); }
      ctx.restore();
      beater(ctx, -c.hw * 0.7, R * 0.95, -0.12, R * 1.15, 9, { wood: '#d8b27a', head: '#c8452f' }); beater(ctx, -c.hw * 0.55, R * 1.1, 0.08, R * 0.95, 8, { wood: '#c89a5a' }); },
  },
  buk: {
    zones: [['c', /dung|centre|center|bass|boom/], ['rim', /dak|ttak|rim|wood|edge/]],
    size: (hw, hh) => Math.min(hw, hh) * 0.6,
    spots: (c) => ({ c: eSpot(c.cx, c.cy, c.R * 0.5, c.R * 0.5, 0, { apk: 1 }), rim: eSector(c.cx, c.cy, c.R, c.R, 0, 1.0, 1.3, -Math.PI * 0.42, -Math.PI * 0.08, { cueR: 28 }) }),
    draw(ctx, c, f) { const R = c.R;
      // stand legs and the barrel behind the head
      ctx.fillStyle = hgrad(ctx, -R, R, [[0, '#2a1608'], [0.5, '#7a4a22'], [1, '#2a1608']]); ctx.save(); ctx.translate(0, R * 0.95); ctx.rotate(0.28); rrect(ctx, -R * 0.55, 0, 16, R * 0.5, 5); ctx.fill(); ctx.restore(); ctx.save(); ctx.translate(0, R * 0.95); ctx.rotate(-0.28); rrect(ctx, R * 0.55 - 16, 0, 16, R * 0.5, 5); ctx.fill(); ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,0.38)'; circ(ctx, 12, 18, R * 1.22); ctx.fill();
      ctx.fillStyle = rgrad(ctx, -R * 0.2, -R * 0.2, R * 0.6, R * 1.25, [[0, '#a8683a'], [0.7, '#6a3a1c'], [1, '#2a1408']]); circ(ctx, 0, 0, R * 1.2); ctx.fill();
      ctx.strokeStyle = 'rgba(20,8,2,0.45)'; ctx.lineWidth = 2; for (let k = 0; k < 14; k++) { const a = k / 14 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * R * 1.05, Math.sin(a) * R * 1.05); ctx.lineTo(Math.cos(a) * R * 1.2, Math.sin(a) * R * 1.2); ctx.stroke(); }
      studRing(ctx, R * 1.1, R * 1.1, 28, 4.2, '#e8c868', 0.12);
      skinDrumFace(ctx, R, R, Math.max(f.c ?? 0, (f.rim ?? 0) * 0.6), { hw: 12, hoopKind: 'wood', hoopCol: '#8a5a2c', seed: 11 });
      beater(ctx, -R * 1.5, R * 0.9, -0.35, R * 1.0, 11, { wood: '#d8b27a' }); beater(ctx, -R * 1.45, R * 1.05, -0.2, R * 0.95, 11, { wood: '#c89a5a' }); },
  },
  tall: {
    zones: [['stick', /palo|stick|baqueta|tak/], ['hand', /mano|hand|palm|open|tum/], ['shell', /madera|shell|wood|knock|body/]],
    size: (hw, hh, c) => (c.tilt ? Math.min(hw * 0.4, hh * 0.8) : Math.min(hw * 0.62, hh * 0.38)) * (c.scale ?? 1),
    spots(c) {
      const R = c.R, a = c.tilt ?? 0, hy = -c.hh * 0.42 + R * 0.34, ry = R * 0.5, base = c.tilt ? -R * 1.55 : hy;
      const Pt = (x, y) => { const [u, v] = rot2(x, y, a); return [c.cx + u, c.cy + v]; };
      const top = c.tilt ? -R * 1.65 : hy, [hx, hyy] = Pt(0, top), [sx, sy] = Pt(0, top + R * 1.18);
      void base;
      return { hand: eSpot(hx, hyy, R * 0.46, ry * 0.5, a, { apk: 1 }), stick: eRing(hx, hyy, R, ry, a, 0.7, 1.02, 0.6), shell: rectSpot(sx, sy, R * 0.62, R * 0.62, a, { rad: 18 }) };
    },
    draw(ctx, c, f) {
      const R = c.R, a = c.tilt ?? 0, hy = c.tilt ? -R * 1.65 : -c.hh * 0.42 + R * 0.34, rx = R, ry = R * 0.5, bot = c.tilt ? hy + R * 3.3 : Math.min(c.hh * 0.94, hy + R * 2.9), rb = R * (c.tilt ? 0.64 : 0.8), col = c.paint ?? '#c8452f';
      ctx.save(); ctx.rotate(a);
      const body = () => { ctx.beginPath(); ctx.moveTo(-rx, hy); ctx.bezierCurveTo(-rx * 1.02, hy + R, -rb, bot - R * 0.6, -rb, bot); ctx.quadraticCurveTo(0, bot + ry * 0.6, rb, bot); ctx.bezierCurveTo(rb, bot - R * 0.6, rx * 1.02, hy + R, rx, hy); ctx.closePath(); };
      dropShadow(ctx, body, 10, 14, 0.4); body(); ctx.fillStyle = hgrad(ctx, -rx, rx, [[0, darker(col, 0.55)], [0.22, lighter(col, 0.3)], [0.5, col], [0.82, darker(col, 0.35)], [1, darker(col, 0.65)]]); ctx.fill();
      ctx.save(); body(); ctx.clip(); grain(ctx, -rx, hy, rx * 2, bot - hy, darker(col, 0.7), 0.3, 6, true, 14); ctx.restore();
      // the open foot: a dark hollow in a lit lip
      ctx.fillStyle = hgrad(ctx, -rb, rb, [[0, darker(col, 0.6)], [0.5, lighter(col, 0.2)], [1, darker(col, 0.6)]]); ell(ctx, 0, bot, rb, ry * 0.42); ctx.fill();
      ctx.fillStyle = rgrad(ctx, 0, bot, 2, rb, [[0, '#050302'], [1, '#2a1a10']]); ell(ctx, 0, bot, rb * 0.88, ry * 0.34); ctx.fill();
      // painted bands (cream and dark) round the body, then the rope bracing in zigzag (black cord) and two iron hoops
      ctx.save(); body(); ctx.clip(); for (const [t0, t1, cc] of [[0.1, 0.16, '#f4eedc'], [0.2, 0.23, '#120c08'], [0.8, 0.86, '#f4eedc']]) { const ya = lerp(hy, bot, t0), yb = lerp(hy, bot, t1); ctx.fillStyle = cc; ctx.globalAlpha = 0.8; ctx.fillRect(-rx * 1.2, ya, rx * 2.4, yb - ya); } ctx.globalAlpha = 1; ctx.restore();
      ctx.strokeStyle = '#120c08'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath(); for (let k = 0; k <= 12; k++) { const t = k / 12, y = lerp(hy + 10, bot - 14, t), w = lerp(rx * 0.96, rb * 0.96, t), x = (k % 2 ? 1 : -1) * w * 0.9; if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.3; ctx.stroke();
      for (const t of [0.72, 0.9]) { const y = lerp(hy, bot, t), w = lerp(rx, rb, t); ctx.strokeStyle = '#2a2a2e'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(0, y, w, ry * 0.4, 0, 0, Math.PI); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.4; ctx.stroke(); }
      ctx.save(); ctx.translate(0, hy); skinDrumFace(ctx, rx, ry, Math.max(f.hand ?? 0, f.stick ?? 0), { hw: 12, hoopKind: 'metal', hoopCol: '#9aa0a8', tint: '#e8d4a8', edge: '#a88a58', seed: c.seed ?? 3 }); studRing(ctx, rx + 6, ry + 6, 12, 3.6, '#e0e2e8', 0.3); ctx.restore();
      // the cuerda's name painted along the shell in white block letters, and the leather shoulder strap looped over two brass rings
      if (c.label) { ctx.save(); ctx.translate(rx * 0.0, lerp(hy, bot, 0.5)); ctx.rotate(-Math.PI / 2); ctx.font = `900 ${Math.round(R * 0.36)}px "Arial Black", Impact, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = R * 0.07; ctx.strokeText(c.label, 0, 0); ctx.fillStyle = '#f6f0dc'; ctx.fillText(c.label, 0, 0); ctx.restore(); }
      { const sy0 = lerp(hy, bot, 0.18), sy1 = lerp(hy, bot, 0.62), sx = rx * 0.98;
        ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 15; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx + 3, sy0 + 4); ctx.bezierCurveTo(sx + R * 0.7, sy0, sx + R * 0.7, sy1, sx + 3, sy1 + 4); ctx.stroke();
        ctx.strokeStyle = '#2a1608'; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(sx, sy0); ctx.bezierCurveTo(sx + R * 0.7, sy0, sx + R * 0.7, sy1, sx, sy1); ctx.stroke();
        ctx.strokeStyle = '#8a5a2c'; ctx.lineWidth = 8; ctx.stroke(); ctx.strokeStyle = 'rgba(255,224,170,0.5)'; ctx.lineWidth = 1.6; ctx.setLineDash([6, 5]); ctx.stroke(); ctx.setLineDash([]);
        for (const yy of [sy0, sy1]) { ctx.fillStyle = rgrad(ctx, sx - 2, yy - 2, 0, 9, [[0, '#fff0b0'], [0.6, '#c9a045'], [1, '#6a4a14']]); circ(ctx, sx, yy, 7.5); ctx.fill(); } }
      // the stick lying across the foot
      ctx.save(); ctx.translate(-rx * 1.0, bot + ry * (c.tilt ? 0.9 : 0.35)); ctx.rotate(-0.1); ctx.fillStyle = vgrad(ctx, -5, 5, [[0, '#f0d9a8'], [1, '#8a6a3a']]); rrect(ctx, 0, -4.5, rx * 2.0, 9, 4.5); ctx.fill(); ctx.restore();
      ctx.restore(); },
  },
  log: {
    zones: [['c', /boom|bass|dum|tum|centre|center|low/], ['e', /slap|tak|edge|rim|high|clap/]],
    size: (hw, hh) => Math.min(hw * 0.46, hh * 0.5),
    spots(c) { const R = c.R, L = c.hw * 1.45, rx = R * 0.5, cxh = c.cx + L / 2 - rx * 0.2; return { c: eSpot(cxh, c.cy, rx * 0.5, R * 0.52, 0, { apk: 1 }), e: eRing(cxh, c.cy, rx, R, 0, 0.7, 1.02, -Math.PI * 0.3) }; },
    draw(ctx, c, f) { const R = c.R, L = c.hw * 1.45, rx = R * 0.5, xL = -L / 2, xR = L / 2 - rx * 0.2, rAt = (t) => lerp(R * 0.86, R * 1.0, t) + R * 0.05 * Math.sin(Math.PI * t);
      const body = barrelPath(xL, xR, rAt, 40); dropShadow(ctx, body, 10, 16, 0.4);
      tubeShade(ctx, body, R + 6, c.wood ?? '#5a3a22', { hl: 0.3, dark: 0.4, spec: 0.26 });
      ctx.save(); body(ctx); ctx.clip(); grain(ctx, xL, -R, L, 2 * R, '#1a0c04', 0.45, 4, false, 18);
      ctx.strokeStyle = 'rgba(255,224,170,0.25)'; ctx.lineWidth = 1.5; for (const t of [0.1, 0.2]) { ctx.beginPath(); ctx.ellipse(lerp(xL, xR, t), 0, rAt(t) * 0.1, rAt(t), 0, 0, TAU); ctx.stroke(); }
      // a carved band of zigzag and diamonds near the foot, painted cream and red, and a ring of brass nails behind the head
      for (const [t0, t1] of [[0.3, 0.38], [0.5, 0.56]]) { const xa = lerp(xL, xR, t0), xb = lerp(xL, xR, t1); ctx.fillStyle = 'rgba(244,236,214,0.88)'; ctx.fillRect(xa, -R * 1.2, xb - xa, R * 2.4); ctx.fillStyle = '#a8322a'; for (let k = -6; k <= 6; k++) { ctx.beginPath(); ctx.moveTo((xa + xb) / 2, k * R * 0.17 - R * 0.07); ctx.lineTo(xb, k * R * 0.17); ctx.lineTo((xa + xb) / 2, k * R * 0.17 + R * 0.07); ctx.lineTo(xa, k * R * 0.17); ctx.closePath(); ctx.fill(); } }
      ctx.restore();
      // a rope ring round the foot and V-lacing from it to the head hoop
      const xr = xL + L * 0.2; ctx.strokeStyle = '#d9c9a0'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(xr, 0, rAt(0.2) * 0.1 + 3, rAt(0.2) + 2, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      vStraps(ctx, { xL: xr, xR, rAt: (t) => rAt(0.2 + 0.8 * t), n: 7, col: '#d9c9a0', w: 5.5, rL: rAt(0.2) + 3, rR: R + 10, aL: 1, aR: rx * 0.1 });
      ctx.save(); ctx.translate(xR, 0); skinDrumFace(ctx, rx, R, Math.max(f.c ?? 0, f.e ?? 0), { hw: 14, hoopKind: 'rope', hoopCol: '#7a5a34', tint: '#e2cfa4', edge: '#a88a58', seed: 9 }); ctx.restore();
      ctx.fillStyle = '#1a0c04'; ell(ctx, xL, 0, rx * 0.4, R * 0.86); ctx.fill(); },
  },
  barrelup: {
    zones: [['c', /centre|center|palm|open|bass|bulea|subidor|low/], ['e', /slap|edge|tak|high/]],
    size: (hw, hh, c) => Math.min(hw * 0.62, hh * 0.4) * (c.scale ?? 1),
    spots(c) { const R = c.R, hy = c.cy - c.hh * 0.32 + R * 0.4; return { c: eSpot(c.cx, hy, R * 0.5, R * 0.34, 0, { apk: 1 }), e: eRing(c.cx, hy, R, R * 0.66, 0, 0.66, 1.0, 0.4) }; },
    draw(ctx, c, f) { const R = c.R, hy = -c.hh * 0.32 + R * 0.4, ry = R * 0.66, bot = Math.min(c.hh * 0.92, hy + R * 2.2), rb = R * 0.9;
      const body = () => { ctx.beginPath(); ctx.moveTo(-R, hy); ctx.bezierCurveTo(-R * 1.12, hy + R * 0.9, -R * 1.1, bot - R * 0.6, -rb, bot); ctx.quadraticCurveTo(0, bot + ry * 0.5, rb, bot); ctx.bezierCurveTo(R * 1.1, bot - R * 0.6, R * 1.12, hy + R * 0.9, R, hy); ctx.closePath(); };
      dropShadow(ctx, body, 10, 14, 0.4); body(); ctx.fillStyle = hgrad(ctx, -R, R, [[0, '#3a1c08'], [0.22, '#b8743a'], [0.5, '#8a4a22'], [0.8, '#5a2c12'], [1, '#2a1004']]); ctx.fill();
      ctx.save(); body(); ctx.clip(); ctx.strokeStyle = 'rgba(20,8,2,0.5)'; ctx.lineWidth = 2; for (let k = -9; k <= 9; k++) { ctx.beginPath(); ctx.moveTo(k * R * 0.11, hy); ctx.lineTo(k * rb * 0.11, bot); ctx.stroke(); } ctx.restore();
      for (const t of [0.35, 0.7]) { const y = lerp(hy, bot, t), w = lerp(R * 1.07, rb * 1.07, t); ctx.strokeStyle = '#6a6a72'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(0, y, w, ry * 0.38, 0, 0, Math.PI); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.6; ctx.stroke(); }
      ctx.save(); ctx.translate(0, hy); skinDrumFace(ctx, R, ry, Math.max(f.c ?? 0, f.e ?? 0), { hw: 12, hoopKind: 'metal', hoopCol: '#a8aab0', tint: '#efdfb8', edge: '#b4965e', seed: c.seed ?? 4 });
      studRing(ctx, R + 6, ry + 6, 14, 3.4, '#cfd3da', 0.2); ctx.restore(); },
  },
  cua: {
    zones: [['cua', /cu[aá]|wood|stick|shell/], ['mar', /mara|shake|rattle/]],
    size: (hw, hh) => Math.min(hw * 0.5, hh * 0.5),
    spots: (c) => ({ cua: rectSpot(c.cx - c.R * 0.1, c.cy + c.R * 0.1, c.R * 0.95, c.R * 0.36, -0.08, { rad: 16 }), mar: eSpot(c.cx + c.R * 0.1, c.cy - c.R * 0.78, c.R * 0.34, c.R * 0.34, 0, { apk: 1 }) }),
    draw(ctx, c, f) { const R = c.R;
      // the cua: a wooden shell with two sticks across it
      ctx.save(); ctx.translate(-R * 0.1, R * 0.1); ctx.rotate(-0.08);
      const sh = barrelPath(-R * 0.95, R * 0.95, () => R * 0.36, 8); dropShadow(ctx, sh, 8, 12, 0.4); tubeShade(ctx, sh, R * 0.4, '#a8683a', { hl: 0.3, dark: 0.35, spec: 0.3 });
      ctx.save(); sh(ctx); ctx.clip(); grain(ctx, -R, -R * 0.4, R * 2, R * 0.8, '#3a1c08', 0.4, 8, false, 10); ctx.restore();
      ctx.fillStyle = '#1a0c04'; ell(ctx, R * 0.95, 0, R * 0.12, R * 0.34); ctx.fill();
      const hit = f.cua ?? 0; for (const [k, d] of [[0, -1], [1, 1]]) { ctx.save(); ctx.translate(-R * 0.5 + k * R * 0.2, -R * 0.1 + d * R * 0.24 - hit * 6 * (k ? 1 : -1)); ctx.rotate(0.3 * d + 0.9); ctx.fillStyle = vgrad(ctx, -5, 5, [[0, '#f6e2b0'], [1, '#9a7a46']]); rrect(ctx, 0, -4.5, R * 0.9, 9, 4.5); ctx.fill(); ctx.restore(); }
      ctx.restore();
      // the maraca: gourd head on a wooden handle
      ctx.save(); ctx.translate(R * 0.1, -R * 0.78); ctx.rotate(0.2 + Math.sin(c.anim * 40) * (f.mar ?? 0) * 0.25);
      ctx.fillStyle = vgrad(ctx, 0, R * 0.7, [[0, '#d8b27a'], [1, '#7a5a2c']]); rrect(ctx, -6, R * 0.28, 12, R * 0.7, 6); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, 6, 10, R * 0.34, R * 0.38); ctx.fill();
      ctx.fillStyle = rgrad(ctx, 0, 0, 0, R * 0.4, [[0, '#f0c25a'], [0.5, '#c8452f'], [1, '#6a1c10']], -R * 0.12, -R * 0.14); ell(ctx, 0, 0, R * 0.32, R * 0.38); ctx.fill();
      ctx.strokeStyle = 'rgba(255,238,190,0.6)'; ctx.lineWidth = 3; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.arc(0, 0, R * 0.14 * (k + 3), -0.8, 0.8); ctx.stroke(); }
      ctx.restore(); },
  },
  dancer: {
    zones: [['step', /piquete|step|dance|foot|skirt/]],
    size: (hw, hh) => Math.min(hw, hh) * 0.72,
    spots: (c) => ({ step: eSpot(c.cx, c.cy, c.R * 0.42, c.R * 0.42, 0, { apk: 1, oy: c.R * 0.62 }) }),
    draw(ctx, c, f) { const R = c.R, sp = (f.step ?? 0), a0 = c.anim * 1.2 + sp * 3.2;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, R * 0.08, R * 0.14, R * 1.02, R * 0.92); ctx.fill();
      // the skirt: three tiers of scalloped ruffle, lace-edged, flung wide by a step
      for (const [k, rr, col] of [[0, 1.0 + 0.1 * sp, '#f4eee0'], [1, 0.76 + 0.05 * sp, '#fffdf6'], [2, 0.5, '#fff6e0']]) {
        const sc = 18 + k * 4, rot = a0 * (k % 2 ? -1 : 1) * 0.25;
        ctx.fillStyle = rgrad(ctx, 0, 0, R * 0.2, R * rr, [[0, darker(col, 0.05)], [0.7, col], [1, darker(col, 0.28)]], -R * 0.1, -R * 0.12);
        ctx.beginPath(); for (let i = 0; i <= 240; i++) { const a = i / 240 * TAU, w = 1 - 0.035 * Math.abs(Math.sin((a + rot) * sc / 2)) + 0.025 * Math.sin(a * 3 + a0); ctx.lineTo(Math.cos(a) * R * rr * w, Math.sin(a) * R * rr * w * 0.94); } ctx.closePath(); ctx.fill();
        ctx.strokeStyle = k === 0 ? '#c8452f' : 'rgba(200,170,120,0.7)'; ctx.lineWidth = k === 0 ? 3.5 : 2; ctx.stroke();
        ctx.strokeStyle = 'rgba(120,90,60,0.26)'; ctx.lineWidth = 1.4; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU + rot * 0.5; ctx.beginPath(); ctx.moveTo(Math.cos(a) * R * rr * 0.3, Math.sin(a) * R * rr * 0.28); ctx.lineTo(Math.cos(a) * R * rr * 0.95, Math.sin(a) * R * rr * 0.9); ctx.stroke(); } }
      // the dancer from above: white blouse with a red trim, bare forearms and two hands that lift the skirt hem, a red headwrap, big hoops
      const sw = Math.sin(a0 * 1.1) * 0.35 + sp * 0.6, hs = R * 0.86, ss = R * 0.86;
      dancerTop(ctx, 0, -R * 0.02, ss, { face: -Math.PI / 2 + Math.sin(a0 * 0.7) * 0.25, shirt: '#c8452f', bottom: '#fbf6ea', trim: '#fbf6ea', hat: 'scarf', hatCol: '#f0b82e', skin: '#a8683f', hair: '#1a1210', bareArms: true, sleeve: '#c8452f', neck: true, noLegs: true, step: sp * 0.0, bob: sp * 0.6,
        handL: [-hs * (0.95 + sw * 0.2), hs * (0.2 - sw * 0.4)], handR: [hs * (0.95 - sw * 0.2), hs * (0.2 + sw * 0.4)], fingers: 0.5, grip: 0.1 });
      ctx.fillStyle = '#e8b84a'; for (const d of [-1, 1]) { ctx.strokeStyle = '#e8b84a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(d * ss * 0.3, ss * 0.06, ss * 0.09, 0, TAU); ctx.stroke(); } },
  },
};
PAINT.chico = PAINT.tall; PAINT.repique = PAINT.tall; PAINT.piano = PAINT.tall;
PAINT.small = { ...PAINT.log, size: (hw, hh) => Math.min(hw * 0.42, hh * 0.42), zones: [['c', /small|centre|center|tum|boom|low|bass/], ['e', /edge|tak|slap|rim|high|clap/]] };
PAINT.bul = PAINT.barrelup; PAINT.sub = PAINT.barrelup;

const GROUPS = {
  samulnori: { match: /samul|nongak|pungmul|four.?instrument|korean percussion/, rows: ['kkwae', 'jing', 'janggu', 'buk'], paint: {}, dress: { kind: 'planks', base: '#3a2a1e', rugKind: 'diamond', rugBase: '#2a1c2e', rugA: '#c9a050', rugB: '#1f3a5a', light: '#ffe2ac' }, floor: '#f0c860' },
  candombe: { stack: true, tilt: 1.46, match: /candombe|tamboril/, rows: ['chico', 'repique', 'piano'], paint: { chico: { paint: '#c8452f', scale: 0.82, seed: 3, label: 'CHICO' }, repique: { paint: '#e0a82e', scale: 0.92, seed: 7, label: 'REPIQUE' }, piano: { paint: '#2a58b8', scale: 1.0, seed: 11, label: 'PIANO' } }, dress: { kind: 'asphalt', base: '#34303a', light: '#ffd9a0' }, floor: '#e8d8b0' },
  'bodu-beru': { match: /bodu.?beru|boduberu|maldiv/, rows: ['log', 'log', 'small'], paint: { log: { wood: '#5a3a22' } }, dress: { kind: 'earth', base: '#c8b088', light: '#fff0c8' }, floor: '#f0e0b8' },
  bomba: { match: /bomba|buleador|subidor/, rows: ['bul', 'sub', 'cua', 'dancer'], paint: { bul: { scale: 1.0, seed: 4 }, sub: { scale: 0.86, seed: 6 } }, dress: { kind: 'planks', base: '#5a3e24', rugKind: 'stripes', rugBase: '#2a1a14', rugA: '#c85a2a', rugB: '#1f5a4a', light: '#ffe0a8' }, floor: '#ffe0a8' },
};

const layoutCells = (n, tall, W, H, stack = false) => {
  const cells = [];
  if (stack) { for (let k = 0; k < n; k++) cells.push({ cx: 0, cy: H / n * (k + 0.5), hw: W / 2 - 6, hh: H / n / 2 - 4 }); return cells; }
  if (!tall) { const cw = W / n; for (let k = 0; k < n; k++) cells.push({ cx: -W / 2 + cw * (k + 0.5), cy: H / 2, hw: cw / 2 - 6, hh: H / 2 - 4 }); return cells; }
  if (n === 4) { for (let k = 0; k < 4; k++) cells.push({ cx: (k % 2 ? 1 : -1) * W / 4, cy: H / 4 + (k >> 1) * H / 2, hw: W / 4 - 6, hh: H / 4 - 4 }); return cells; }
  if (n === 3) { cells.push({ cx: 0, cy: H / 4, hw: W / 2 - 6, hh: H / 4 - 4 }); cells.push({ cx: -W / 4, cy: H * 0.75, hw: W / 4 - 6, hh: H / 4 - 4 }); cells.push({ cx: W / 4, cy: H * 0.75, hw: W / 4 - 6, hh: H / 4 - 4 }); return cells; }
  for (let k = 0; k < n; k++) cells.push({ cx: 0, cy: H / n * (k + 0.5), hw: W / 2 - 6, hh: H / n / 2 - 4 });
  return cells;
};

for (const [gid, G] of Object.entries(GROUPS)) {
  registerDrumStage({
    id: gid, match: G.match,
    build: (S, lanes, P) => { const kindOf = []; return createDrumStage(gid, S, lanes, P, {
      dress: () => G.dress,
      voiceOf: (i) => kindOf[i] ?? null,
      build: (K) => {
        const tall = K.tall, W = tall ? 720 : 1160, H = tall ? 980 : 560, ref = { w: W, h: H };
        // the group has the rows its fixture uses (at least up to the highest row)
        const maxRow = Math.max(0, ...lanes.map((l) => clamp(l.row ?? 0, 0, 3))), n = Math.min(G.rows.length, maxRow + 1);
        const stack = tall && G.stack, cells = (stack ? layoutCells(n, true, W, H, true) : layoutCells(n, tall, W, H)).map((c, k) => ({ ...c, kind: G.rows[k], k, tilt: stack && G.tilt ? G.tilt : 0 }));
        const spots = new Array(K.N).fill(null), cellOf = [];
        cells.forEach((c) => {
          const P2 = PAINT[c.kind], cfg = G.paint[c.kind] ?? {};
          c.jt = tall && c.kind === 'janggu' ? -0.5 : 0; c.R = P2.size(c.hw, c.hh, { ...cfg, tilt: c.tilt }); c.scale = cfg.scale; c.paint = cfg.paint; c.label = cfg.label; c.seed = cfg.seed; c.wood = cfg.wood;
          const mine = K.order.filter((i) => clamp(lanes[i].row ?? 0, 0, 3) === c.k), used = new Set(), keyOf = {};
          for (const i of mine) { const z = P2.zones.find(([key, re]) => re.test(K.nm(i)) && !used.has(key)); if (z) { keyOf[i] = z[0]; used.add(z[0]); } }
          const free = P2.zones.filter(([key]) => !used.has(key));
          for (const i of mine) if (!keyOf[i]) { const z = free.shift(); if (z) { keyOf[i] = z[0]; used.add(z[0]); } }
          const sp = P2.spots(c);
          for (const i of mine) { spots[i] = sp[keyOf[i]] ?? null; kindOf[i] = `ens-${c.kind}-${keyOf[i] ?? P2.zones[0][0]}`; cellOf[i] = c; }
          c.keyOf = keyOf; c.mine = mine;
        });
        return { ref, spots, view: { top: 36 },
          draw(ctx, rt) {
            cells.forEach((c) => {
              const f = {}; for (const i of c.mine) f[c.keyOf[i]] = Math.max(f[c.keyOf[i]] ?? 0, rt.flash[i]);
              ctx.save(); rrect(ctx, c.cx - c.hw - 2, c.cy - c.hh, 2 * c.hw + 4, 2 * c.hh, 22);
              ctx.fillStyle = rgrad(ctx, c.cx, c.cy - c.hh * 0.1, c.hh * 0.1, Math.max(c.hw, c.hh) * 1.25, [[0, 'rgba(255,226,170,0.2)'], [0.6, 'rgba(255,226,170,0.05)'], [1, 'rgba(0,0,0,0.38)']]); ctx.fill();
              ctx.strokeStyle = 'rgba(255,224,160,0.22)'; ctx.lineWidth = 2; ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.2; rrect(ctx, c.cx - c.hw + 1, c.cy - c.hh + 3, 2 * c.hw - 2, 2 * c.hh - 6, 20); ctx.stroke();
              ctx.beginPath(); rrect(ctx, c.cx - c.hw - 2, c.cy - c.hh, 2 * c.hw + 4, 2 * c.hh, 22); ctx.clip();
              ctx.translate(c.cx, c.cy);
              PAINT[c.kind].draw(ctx, { ...c, cx: 0, cy: 0, anim: rt.anim }, f);
              ctx.restore();
              { const nm = NAMES[c.kind], pw = Math.max(110, nm.length * 11 + 40); ctx.save(); rrect(ctx, c.cx - pw / 2, c.cy + c.hh - 31, pw, 24, 12); ctx.fillStyle = vgrad(ctx, c.cy + c.hh - 31, c.cy + c.hh - 7, [[0, 'rgba(120,84,30,0.9)'], [1, 'rgba(50,32,10,0.92)']]); ctx.fill(); ctx.strokeStyle = 'rgba(255,224,150,0.6)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore(); }
              text(ctx, NAMES[c.kind], c.cx, c.cy + c.hh - 19, 15, 'rgba(255,240,205,0.95)', { weight: '700', outline: 'rgba(0,0,0,0.5)', lw: 3 });
            });
          } };
      },
    }); },
  });
}
void mix; void rgba; void rot2; void eRing; void hash; void hand;

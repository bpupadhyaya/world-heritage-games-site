// shape-craft `pour`: the silver teapot, a sleeved hand on its handle, and (gongfu) the clay pot, glass pitcher, porcelain cups and the iron kettle.
// Every function draws in LOCAL units (one design unit = `u` px) around a stated origin, so the caller only translates and rotates.
import { hash } from './geom.js';
import { rgba, tint, mix, rrect } from './fx.js';
import { lg, rg, ell, TAU } from './props.js';
import { clamp, lerp, teaColors, glassOf, glassBack, glassFront, wAt, yAt, fOf } from './pour-art.js';

// ---- the Moroccan silver teapot -----------------------------------------------------------------------------------------------------------
// origin = the grip point on the handle. Spout tip is at (TIP.x, TIP.y) with the pot upright. Body centre x = BX.
export const TIP = { x: -0.245, y: -0.056 };
export const BX = -0.105;
const BODY = [[0.078, 0.112], [0.09, 0.098], [0.094, 0.06], [0.084, 0.015], [0.066, -0.025], [0.051, -0.058], [0.048, -0.072], [0.057, -0.081]];
const bodyPath = (ctx, u, grow = 0) => {
  ctx.beginPath(); const P = (hw, y, s) => [(BX + s * (hw + grow)) * u, y * u];
  let p = P(...BODY[0], -1); ctx.moveTo(...p);
  for (let i = 1; i < BODY.length; i++) { const q = P(...BODY[i], -1), m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]); p = q; }
  ctx.lineTo(...p);
  const top = P(...BODY[BODY.length - 1], 1); ctx.lineTo(top[0], top[1]); p = top;
  for (let i = BODY.length - 2; i >= 0; i--) { const q = P(...BODY[i], 1), m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]); p = q; }
  ctx.lineTo(...p); ctx.closePath();
};
const SILVER = (x0, x1, ctx) => ctx.createLinearGradient(x0, 0, x1, 0);
export function silverPot(ctx, u, o = {}) {
  const t = o.t ?? 0, tx = TIP.x * u, ty = TIP.y * u;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // spout: a swan neck from the lower left of the body to the tip, as a tapering tube (three strokes: shade, metal, glint)
  const sp = [[-0.188, 0.074], [-0.255, 0.082], [-0.222, -0.012], [TIP.x, TIP.y]];
  const spout = (w0, w1, style) => { for (let k = 0; k < 28; k++) { const a = k / 28, b = (k + 1) / 28; const pt = (q) => { const m = 1 - q; return [(m ** 3 * sp[0][0] + 3 * m * m * q * sp[1][0] + 3 * m * q * q * sp[2][0] + q ** 3 * sp[3][0]) * u, (m ** 3 * sp[0][1] + 3 * m * m * q * sp[1][1] + 3 * m * q * q * sp[2][1] + q ** 3 * sp[3][1]) * u]; }; const A = pt(a), B = pt(b); ctx.strokeStyle = typeof style === 'function' ? style(a) : style; ctx.lineWidth = lerp(w0, w1, (a + b) / 2) * u; ctx.beginPath(); ctx.moveTo(...A); ctx.lineTo(...B); ctx.stroke(); } };
  spout(0.052, 0.022, '#3c434c'); spout(0.044, 0.017, (a) => mix('#8d96a0', '#d4dae0', 0.5 + 0.5 * Math.sin(a * 5))); spout(0.016, 0.006, 'rgba(255,255,255,0.8)');
  // the lip: a small flared cup at the tip with a hinged lid
  ctx.fillStyle = lg(ctx, tx - 0.02 * u, 0, tx + 0.02 * u, 0, [[0, '#f2f5f8'], [0.5, '#9aa3ad'], [1, '#515a63']]); ctx.beginPath(); ctx.ellipse(tx, ty, 0.017 * u, 0.0085 * u, -0.5, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(30,36,44,0.55)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = 'rgba(20,12,4,0.85)'; ctx.beginPath(); ctx.ellipse(tx - 0.002 * u, ty - 0.001 * u, 0.009 * u, 0.0042 * u, -0.5, 0, TAU); ctx.fill();
  // handle: an ebony loop with brass studs, attached at the shoulder and the belly
  const hs = [[-0.04, -0.07], [0.034, -0.062], [0.032, 0.05], [-0.02, 0.072]];
  ctx.strokeStyle = '#17100c'; ctx.lineWidth = 0.025 * u; ctx.beginPath(); ctx.moveTo(hs[0][0] * u, hs[0][1] * u); ctx.bezierCurveTo(hs[1][0] * u, hs[1][1] * u, hs[2][0] * u, hs[2][1] * u, hs[3][0] * u, hs[3][1] * u); ctx.stroke();
  ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 0.017 * u; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,230,190,0.35)'; ctx.lineWidth = 0.004 * u; ctx.beginPath(); ctx.moveTo((hs[0][0] + 0.006) * u, (hs[0][1] - 0.006) * u); ctx.bezierCurveTo((hs[1][0]) * u, (hs[1][1] - 0.005) * u, (hs[2][0] - 0.005) * u, hs[2][1] * u, hs[3][0] * u, (hs[3][1] - 0.006) * u); ctx.stroke();
  for (const [x, y] of [[0.0, -0.066], [0.032, -0.03], [0.034, 0.02], [0.005, 0.07]]) { ctx.fillStyle = lg(ctx, (x - 0.008) * u, 0, (x + 0.008) * u, 0, [[0, '#f6e08a'], [1, '#9a7420']]); ell(ctx, x * u, y * u, 0.008 * u, 0.008 * u); ctx.fill(); }
  // body: a polished cylinder of silver; engraved bands, pointed arches, a bright streak
  bodyPath(ctx, u, 0.002); ctx.fillStyle = '#2a3038'; ctx.fill();
  bodyPath(ctx, u); ctx.save(); ctx.clip();
  const x0 = (BX - 0.1) * u, x1 = (BX + 0.1) * u;
  let g = SILVER(x0, x1, ctx); [[0, '#5c6772'], [0.08, '#aeb8c2'], [0.2, '#f4f7fa'], [0.3, '#cdd4db'], [0.5, '#8a95a1'], [0.7, '#cdd4db'], [0.84, '#f0f3f6'], [0.93, '#9aa4af'], [1, '#434c56']].forEach(([s, c]) => g.addColorStop(s, c)); ctx.fillStyle = g; ctx.fillRect(x0, -0.09 * u, x1 - x0, 0.21 * u);
  // reflections of the court: warm on the lower belly, cool sky at the shoulder
  ctx.fillStyle = lg(ctx, 0, -0.08 * u, 0, 0.115 * u, [[0, 'rgba(120,190,215,0.35)'], [0.35, 'rgba(120,190,215,0)'], [0.7, 'rgba(255,170,70,0)'], [1, 'rgba(255,170,70,0.5)']]); ctx.fillRect(x0, -0.09 * u, x1 - x0, 0.21 * u);
  // engraving
  ctx.strokeStyle = 'rgba(40,48,58,0.55)'; ctx.lineWidth = Math.max(1, 0.0025 * u);
  for (const y of [0.093, 0.078, 0.032, 0.02, -0.042, -0.05]) { ctx.beginPath(); ctx.moveTo(x0, y * u); ctx.quadraticCurveTo(BX * u, (y + 0.006) * u, x1, y * u); ctx.stroke(); }
  for (let k = 0; k < 12; k++) { const th = (k + 0.5) / 12, xx = (BX - 0.088 + th * 0.176) * u, sc = Math.sin(th * Math.PI); ctx.beginPath(); ctx.moveTo(xx - 0.0075 * u * sc, 0.078 * u); ctx.quadraticCurveTo(xx - 0.0075 * u * sc, 0.054 * u, xx, 0.046 * u); ctx.quadraticCurveTo(xx + 0.0075 * u * sc, 0.054 * u, xx + 0.0075 * u * sc, 0.078 * u); ctx.stroke(); }
  ctx.fillStyle = 'rgba(40,48,58,0.55)'; for (let k = 0; k < 16; k++) { const th = (k + 0.5) / 16, xx = (BX - 0.08 + th * 0.16) * u, sc = Math.sin(th * Math.PI); ctx.beginPath(); ctx.moveTo(xx, 0.026 * u); ctx.lineTo(xx + 0.004 * u * sc, 0.0 + 0.026 * u); ctx.lineTo(xx, 0.026 * u - 0.01 * u); ctx.lineTo(xx - 0.004 * u * sc, 0.026 * u); ctx.fill(); }
  // glints
  ctx.fillStyle = lg(ctx, 0, -0.07 * u, 0, 0.1 * u, [[0, 'rgba(255,255,255,0.95)'], [0.55, 'rgba(255,255,255,0.55)'], [1, 'rgba(255,255,255,0.1)']]); rrect(ctx, (BX - 0.046) * u, -0.062 * u, 0.012 * u, 0.15 * u, 0.006 * u); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; rrect(ctx, (BX + 0.056) * u, -0.02 * u, 0.006 * u, 0.1 * u, 0.003 * u); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(20,26,32,0.7)'; ctx.lineWidth = 1.3; bodyPath(ctx, u); ctx.stroke();
  // collar ring and the domed lid with its finial
  ctx.fillStyle = lg(ctx, (BX - 0.06) * u, 0, (BX + 0.06) * u, 0, [[0, '#6a747e'], [0.25, '#f4f7fa'], [0.55, '#a5afb9'], [1, '#4a535c']]); rrect(ctx, (BX - 0.06) * u, -0.092 * u, 0.12 * u, 0.017 * u, 0.006 * u); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo((BX - 0.05) * u, -0.092 * u); ctx.bezierCurveTo((BX - 0.05) * u, -0.125 * u, (BX - 0.02) * u, -0.14 * u, BX * u, -0.142 * u); ctx.bezierCurveTo((BX + 0.02) * u, -0.14 * u, (BX + 0.05) * u, -0.125 * u, (BX + 0.05) * u, -0.092 * u); ctx.closePath();
  g = SILVER((BX - 0.05) * u, (BX + 0.05) * u, ctx); [[0, '#5c6772'], [0.2, '#e8edf1'], [0.4, '#b4bdc6'], [0.75, '#dfe4e9'], [1, '#434c56']].forEach(([s, c]) => g.addColorStop(s, c)); ctx.fillStyle = g; ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse((BX - 0.02) * u, -0.121 * u, 0.012 * u, 0.006 * u, -0.4, 0, TAU); ctx.fill();
  ctx.fillStyle = lg(ctx, (BX - 0.012) * u, 0, (BX + 0.012) * u, 0, [[0, '#fafcfe'], [0.5, '#a0aab4'], [1, '#4c555e']]); ell(ctx, BX * u, -0.152 * u, 0.0115 * u, 0.0115 * u); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#7e8791'; ctx.fillRect((BX - 0.004) * u, -0.145 * u, 0.008 * u, 0.007 * u);
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ell(ctx, (BX - 0.004) * u, -0.155 * u, 0.0035 * u, 0.0025 * u); ctx.fill();
  void t;
  ctx.restore();
}

// ---- the sleeved hand on the handle: origin = the grip point on the handle. `ang` is the direction the arm comes from (radians, 0 = from the right) ----
export function sleeveHand(ctx, u, o = {}) {
  const ang = o.ang ?? 0.55, len = o.len ?? 0.5, HS = 1.3, ha = ang * 0.55;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const skin = ['#f0c8a6', '#d4a07c', '#a2704e'], line = 'rgba(90,50,26,0.28)';
  // the hand, drawn in its own frame (wrist along +x), scaled up a little so the fingers read at play size
  ctx.save(); ctx.translate(0.046 * u, 0.004 * u); ctx.rotate(ha); ctx.scale(HS, HS);
  const wx = 0.1;
  const back = () => { ctx.beginPath(); ctx.moveTo(0.014 * u, -0.046 * u); ctx.bezierCurveTo(0.045 * u, -0.056 * u, 0.08 * u, -0.044 * u, wx * u, -0.03 * u); ctx.lineTo(wx * u, 0.032 * u); ctx.bezierCurveTo(0.075 * u, 0.056 * u, 0.04 * u, 0.062 * u, 0.014 * u, 0.05 * u); ctx.closePath(); };
  // forearm cuff and sleeve first (behind the hand)
  ctx.save(); ctx.translate((wx - 0.012) * u, 0.0); ctx.rotate(ang - ha);
  const L = (len / HS) * u, w0 = 0.036 * u, w1 = 0.06 * u;
  ctx.beginPath(); ctx.moveTo(0, -w0); ctx.bezierCurveTo(L * 0.25, -w0 * 1.3, L * 0.6, -w1 * 1.0, L, -w1 * 1.1); ctx.lineTo(L, w1 * 1.1); ctx.bezierCurveTo(L * 0.6, w1 * 1.1, L * 0.25, w0 * 1.4, 0, w0); ctx.closePath();
  ctx.fillStyle = lg(ctx, 0, -w1, 0, w1, [[0, (o.sleeve ?? [])[0] ?? '#5a7cc4'], [0.35, (o.sleeve ?? [])[1] ?? '#2f4f98'], [0.75, (o.sleeve ?? [])[2] ?? '#1f3678'], [1, (o.sleeve ?? [])[3] ?? '#14224f']]); ctx.fill();
  ctx.save(); ctx.clip();
  ctx.strokeStyle = 'rgba(10,20,60,0.5)'; ctx.lineWidth = 0.005 * u; for (const k of [-0.55, -0.15, 0.3, 0.7]) { ctx.beginPath(); ctx.moveTo(0.02 * u, k * w0); ctx.bezierCurveTo(L * 0.3, k * w1 * 0.9, L * 0.6, k * w1 * 1.2, L, k * w1 * 1.35); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(200,215,250,0.35)'; ctx.lineWidth = 0.006 * u; ctx.beginPath(); ctx.moveTo(0.02 * u, -w0 * 0.78); ctx.bezierCurveTo(L * 0.3, -w1 * 0.7, L * 0.6, -w1 * 0.85, L, -w1 * 0.95); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = lg(ctx, 0, -w0, 0, w0, [[0, '#f1e8d2'], [0.6, '#d8cbaa'], [1, '#a89a74']]); rrect(ctx, -0.006 * u, -w0 * 1.1, 0.04 * u, w0 * 2.2, 0.012 * u); ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#c9a040'; ctx.fillRect(0.03 * u, -w0 * 1.1, 0.004 * u, w0 * 2.2);
  ctx.restore();
  back(); ctx.fillStyle = lg(ctx, 0, -0.056 * u, 0, 0.062 * u, [[0, skin[0]], [0.5, skin[1]], [1, skin[2]]]); ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.stroke();
  ctx.save(); back(); ctx.clip();
  ctx.strokeStyle = 'rgba(120,64,30,0.32)'; ctx.lineWidth = 1.1; for (const k of [-0.032, -0.011, 0.011, 0.034]) { ctx.beginPath(); ctx.moveTo(0.02 * u, k * u); ctx.quadraticCurveTo(0.055 * u, (k * 0.85) * u, 0.098 * u, k * 0.45 * u); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,238,215,0.5)'; ell(ctx, 0.055 * u, -0.035 * u, 0.026 * u, 0.008 * u); ctx.fill();
  ctx.fillStyle = 'rgba(80,36,12,0.25)'; ell(ctx, 0.06 * u, 0.05 * u, 0.04 * u, 0.01 * u); ctx.fill();
  ctx.restore();
  // four curled fingers, each a tapered capsule with a crease and a highlight; the gaps between them are in shadow
  for (const [y, w, l] of [[-0.033, 0.0175, 0.058], [-0.0115, 0.0185, 0.064], [0.0105, 0.0185, 0.06], [0.0315, 0.016, 0.05]]) {
    ctx.save(); ctx.translate(0.024 * u, y * u);
    ctx.beginPath(); ctx.moveTo(0.008 * u, -w * u / 2); ctx.lineTo(-l * u * 0.8, -w * u * 0.47); ctx.quadraticCurveTo(-l * u * 1.0, 0, -l * u * 0.8, w * u * 0.47); ctx.lineTo(0.008 * u, w * u / 2); ctx.closePath();
    ctx.fillStyle = lg(ctx, 0, -w * u / 2, 0, w * u / 2, [[0, skin[0]], [0.4, skin[1]], [1, skin[2]]]); ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(255,242,226,0.6)'; rrect(ctx, -l * u * 0.7, -w * u * 0.38, l * u * 0.72, w * u * 0.17, 1.2); ctx.fill();
    ctx.strokeStyle = 'rgba(110,56,24,0.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-l * u * 0.32, -w * u * 0.46); ctx.lineTo(-l * u * 0.32, w * u * 0.46); ctx.moveTo(-l * u * 0.6, -w * u * 0.44); ctx.lineTo(-l * u * 0.6, w * u * 0.44); ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(255,236,210,0.8)'; for (const y of [-0.033, -0.0115, 0.0105, 0.0315]) { ell(ctx, 0.03 * u, (y - 0.003) * u, 0.0066 * u, 0.0046 * u); ctx.fill(); }
  // the thumb along the top of the handle, with a nail
  ctx.save(); ctx.translate(0.014 * u, -0.052 * u); ctx.rotate(-0.12);
  ctx.beginPath(); ctx.moveTo(0.05 * u, -0.012 * u); ctx.quadraticCurveTo(0.0, -0.016 * u, -0.05 * u, -0.007 * u); ctx.quadraticCurveTo(-0.066 * u, 0.0, -0.05 * u, 0.009 * u); ctx.quadraticCurveTo(0.0, 0.016 * u, 0.05 * u, 0.014 * u); ctx.closePath();
  ctx.fillStyle = lg(ctx, 0, -0.014 * u, 0, 0.014 * u, [[0, skin[0]], [0.6, skin[1]], [1, skin[2]]]); ctx.fill(); ctx.strokeStyle = line; ctx.stroke();
  ctx.fillStyle = 'rgba(255,244,232,0.92)'; ctx.beginPath(); ctx.moveTo(-0.05 * u, -0.005 * u); ctx.quadraticCurveTo(-0.03 * u, -0.008 * u, -0.02 * u, -0.004 * u); ctx.lineTo(-0.02 * u, 0.005 * u); ctx.quadraticCurveTo(-0.03 * u, 0.008 * u, -0.05 * u, 0.005 * u); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(120,64,30,0.4)'; ctx.stroke();
  ctx.restore();
  ctx.restore();
  ctx.restore();
}

// ---- gongfu: the Yixing clay pot, origin = centre of its base; width ~0.23 ----------------------------------------------------------------------------
// o: { lid: 0 (on) .. 1 (off, shown beside it by the caller with clayLid), water: 0..1 level in the open mouth, open: 0..1 how far the leaves have unfurled, liquid, t, col }
export const CLAY = ['#a8502e', '#7a3418', '#3e1808', '#d8845a'];
export const POTSPOUT = { x: -0.146, y: -0.1 };      // the lip of the spout, pot upright
export const POTGRIP = { x: 0.15, y: -0.065 };       // where the hand holds the ear
export const POTMOUTH = { x: 0, y: -0.116, rx: 0.062, ry: 0.0155 };
export function clayLid(ctx, u, o = {}) {
  const col = o.col ?? CLAY;
  ctx.save(); ctx.translate((o.x ?? 0) * u, (o.y ?? 0) * u); ctx.rotate(o.rot ?? 0);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0.004 * u, 0.004 * u, 0.066 * u, 0.012 * u, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-0.064 * u, 0); ctx.bezierCurveTo(-0.06 * u, -0.036 * u, -0.025 * u, -0.042 * u, 0, -0.042 * u); ctx.bezierCurveTo(0.025 * u, -0.042 * u, 0.06 * u, -0.036 * u, 0.064 * u, 0); ctx.closePath();
  ctx.fillStyle = lg(ctx, -0.064 * u, 0, 0.064 * u, 0, [[0, col[2]], [0.25, col[3]], [0.5, col[0]], [1, col[2]]]); ctx.fill(); ctx.strokeStyle = 'rgba(30,10,2,0.7)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = lg(ctx, -0.016 * u, 0, 0.016 * u, 0, [[0, col[3]], [0.6, col[1]], [1, col[2]]]); ell(ctx, 0, -0.048 * u, 0.0135 * u, 0.0115 * u); ctx.fill(); ctx.stroke();
  ctx.restore();
}
export function clayPot(ctx, u, o = {}) {
  const col = o.col ?? CLAY;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // spout: short, rising from the shoulder at the left; handle: an ear on the right
  ctx.strokeStyle = '#2e1206'; ctx.lineWidth = 0.034 * u; ctx.beginPath(); ctx.moveTo(-0.07 * u, -0.045 * u); ctx.quadraticCurveTo(-0.13 * u, -0.05 * u, -0.145 * u, -0.095 * u); ctx.stroke();
  ctx.strokeStyle = col[1]; ctx.lineWidth = 0.026 * u; ctx.stroke(); ctx.strokeStyle = rgba(col[3], 0.55); ctx.lineWidth = 0.007 * u; ctx.beginPath(); ctx.moveTo(-0.07 * u, -0.054 * u); ctx.quadraticCurveTo(-0.128 * u, -0.058 * u, -0.142 * u, -0.1 * u); ctx.stroke();
  ctx.fillStyle = col[2]; ctx.beginPath(); ctx.ellipse(-0.146 * u, -0.098 * u, 0.0135 * u, 0.007 * u, -0.9, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#2e1206'; ctx.lineWidth = 0.03 * u; ctx.beginPath(); ctx.moveTo(0.075 * u, -0.1 * u); ctx.bezierCurveTo(0.17 * u, -0.12 * u, 0.17 * u, -0.01 * u, 0.082 * u, -0.025 * u); ctx.stroke();
  ctx.strokeStyle = col[1]; ctx.lineWidth = 0.022 * u; ctx.stroke(); ctx.strokeStyle = rgba(col[3], 0.5); ctx.lineWidth = 0.006 * u; ctx.beginPath(); ctx.moveTo(0.078 * u, -0.108 * u); ctx.bezierCurveTo(0.158 * u, -0.124 * u, 0.162 * u, -0.025 * u, 0.086 * u, -0.036 * u); ctx.stroke();
  // body: a squat sphere with a flat foot (matte, slightly speckled clay)
  const body = () => { ctx.beginPath(); ctx.moveTo(-0.062 * u, 0); ctx.bezierCurveTo(-0.115 * u, -0.004 * u, -0.118 * u, -0.098 * u, -0.07 * u, -0.116 * u); ctx.lineTo(0.07 * u, -0.116 * u); ctx.bezierCurveTo(0.118 * u, -0.098 * u, 0.115 * u, -0.004 * u, 0.062 * u, 0); ctx.closePath(); };
  body(); ctx.fillStyle = col[2]; ctx.fill();
  ctx.save(); body(); ctx.clip();
  ctx.fillStyle = lg(ctx, -0.12 * u, 0, 0.12 * u, 0, [[0, col[2]], [0.2, col[0]], [0.34, col[3]], [0.55, col[1]], [1, col[2]]]); ctx.fillRect(-0.13 * u, -0.12 * u, 0.26 * u, 0.13 * u);
  ctx.fillStyle = lg(ctx, 0, -0.12 * u, 0, 0, [[0, 'rgba(255,200,150,0.25)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.3)']]); ctx.fillRect(-0.13 * u, -0.12 * u, 0.26 * u, 0.13 * u);
  for (let k = 0; k < 60; k++) { ctx.fillStyle = k % 3 ? 'rgba(30,10,2,0.25)' : 'rgba(255,200,150,0.22)'; ctx.fillRect((hash(k, 3) - 0.5) * 0.2 * u, -hash(k, 4) * 0.115 * u, 1.3, 1.3); }
  ctx.fillStyle = 'rgba(255,215,170,0.5)'; ctx.beginPath(); ctx.ellipse(-0.04 * u, -0.07 * u, 0.012 * u, 0.04 * u, 0.25, 0, TAU); ctx.fill();
  ctx.restore(); ctx.strokeStyle = 'rgba(30,10,2,0.7)'; ctx.lineWidth = 1.2; body(); ctx.stroke();
  const M = POTMOUTH, my = M.y * u;
  if ((o.lid ?? 0) > 0.5) { // the open mouth: dark inside, the leaves, and the water level
    ctx.fillStyle = '#1c0c04'; ctx.beginPath(); ctx.ellipse(0, my, M.rx * u, M.ry * u, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, my, M.rx * u * 0.97, M.ry * u * 0.95, 0, 0, TAU); ctx.clip();
    const op = clamp(o.open ?? 0, 0, 1), wl = clamp(o.water ?? 0, 0, 1);
    // rolled oolong leaves, a heap in the middle; they unfurl and darken as the tea steeps
    for (let k = 0; k < 26; k++) { const a = hash(k, 5) * TAU, r = Math.sqrt(hash(k, 6)) * M.rx * u * 0.7, x = Math.cos(a) * r, y = my + Math.sin(a) * r * 0.26 + M.ry * u * 0.1, sz = (0.0075 + op * 0.006 + hash(k, 7) * 0.004) * u;
      ctx.fillStyle = lg(ctx, x - sz, y - sz, x + sz, y + sz, [[0, op > 0.4 ? '#8a9a3c' : '#6a7a2c'], [1, '#2c3a10']]); ctx.beginPath(); ctx.ellipse(x, y, sz * (1 + op * 0.8), sz * (0.6 + op * 0.2), hash(k, 8) * 3, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,200,0.25)'; ctx.fillRect(x - sz * 0.3, y - sz * 0.4, sz * 0.5, 1); }
    if (wl > 0.02) { // water over the leaves
      const wy = my + (1 - wl) * M.ry * u * 0.6;
      ctx.fillStyle = rgba(o.liquid ?? '#d6a03a', 0.5 + 0.35 * wl); ctx.beginPath(); ctx.ellipse(0, wy, M.rx * u * (0.55 + 0.45 * wl), M.ry * u * (0.9 * wl + 0.1), 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.beginPath(); ctx.ellipse(-0.02 * u, wy - 0.003 * u, 0.026 * u, 0.0026 * u, 0, 0, TAU); ctx.fill();
      if (wl > 0.9) for (let k = 0; k < 7; k++) { ctx.fillStyle = 'rgba(255,248,230,0.8)'; ell(ctx, (hash(k, 11) - 0.5) * M.rx * u * 1.5, wy + (hash(k, 12) - 0.5) * M.ry * u * 0.8, 1.2 + hash(k, 13) * 1.6, 1); ctx.fill(); }
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,200,150,0.55)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(0, my, M.rx * u, M.ry * u, 0, Math.PI * 0.05, Math.PI * 0.95); ctx.stroke();
  } else {
    ctx.save(); ctx.translate(0, 0); clayLid(ctx, u, { x: 0, y: -0.116, col });
    ctx.restore();
  }
  ctx.restore();
}

// ---- gongfu: a glass fairness pitcher (gong dao bei): origin = centre of its base --------------------------------------------------------------------
export const PITCHER = { wr: 0.056, wb: 0.044, H: 0.15, ry: 0.22, curve: 0.9, fb: 0.05, ft: 0.94, wall: 0.003 };
export function pitcher(ctx, s, x, by, o = {}) {
  const G = glassOf(x, by, s, PITCHER);
  ctx.save(); ctx.lineCap = 'round';
  // handle on the right: a glass loop; spout lip on the left
  ctx.strokeStyle = 'rgba(190,220,235,0.7)'; ctx.lineWidth = 0.011 * s; ctx.beginPath(); ctx.moveTo(x + G.wr * 0.98, by - G.H * 0.85); ctx.bezierCurveTo(x + G.wr * 2.0, by - G.H * 0.9, x + G.wr * 2.0, by - G.H * 0.25, x + G.wr * 0.94, by - G.H * 0.2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.0035 * s; ctx.beginPath(); ctx.moveTo(x + G.wr * 1.0, by - G.H * 0.86); ctx.bezierCurveTo(x + G.wr * 1.9, by - G.H * 0.9, x + G.wr * 1.9, by - G.H * 0.28, x + G.wr * 0.96, by - G.H * 0.22); ctx.stroke();
  glassBack(ctx, G, { L: o.L ?? 0, F: o.F ?? 0.01, tea: o.tea ?? 0.5, seed: 7 });
  // spout: a small triangular lip at the left of the rim
  ctx.fillStyle = 'rgba(225,238,245,0.3)'; ctx.beginPath(); ctx.moveTo(x - G.wr * 0.9, by - G.H); ctx.lineTo(x - G.wr * 1.38, by - G.H * 1.03); ctx.lineTo(x - G.wr * 1.0, by - G.H * 0.94); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.6; ctx.stroke();
  // measure marks etched on the glass
  glassFront(ctx, G, { v: 1, sprig: false });
  ctx.restore();
  return G;
}

// ---- gongfu: a small porcelain cup (white, a thin blue line, celadon inside lit by the tea); base centre (x, by), width ~0.07 ----------------------------
export const CUP = { wr: 0.037, wb: 0.021, H: 0.05, ry: 0.3, curve: 0.8, fb: 0.1, ft: 0.9, wall: 0.003 };
export function porcelainCup(ctx, s, x, by, o = {}) {
  const G = glassOf(x, by, s, CUP), [deep, body, light] = teaColors(o.tea ?? 0.5), L = clamp(o.L ?? 0, 0, 1.1);
  ctx.save();
  // foot ring and shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, x + 2, by + 2, G.wb * 1.25, G.wb * 0.34); ctx.fill();
  const wallPath = () => { ctx.beginPath(); ctx.moveTo(x - G.wr, by - G.H); ctx.bezierCurveTo(x - G.wr * 1.02, by - G.H * 0.4, x - G.wb * 1.3, by - G.H * 0.08, x - G.wb, by); ctx.ellipse(x, by, G.wb, G.wb * 0.3, 0, Math.PI, 0, true); ctx.bezierCurveTo(x + G.wb * 1.3, by - G.H * 0.08, x + G.wr * 1.02, by - G.H * 0.4, x + G.wr, by - G.H); ctx.ellipse(x, by - G.H, G.wr, G.wr * G.ry, 0, 0, Math.PI, false); ctx.closePath(); };
  wallPath(); ctx.fillStyle = lg(ctx, x - G.wr, 0, x + G.wr, 0, [[0, '#cbd3d8'], [0.18, '#fbfdfe'], [0.55, '#eef2f5'], [0.85, '#c9d1d7'], [1, '#9aa6ae']]); ctx.fill();
  ctx.save(); wallPath(); ctx.clip();
  ctx.strokeStyle = 'rgba(40,80,150,0.7)'; ctx.lineWidth = Math.max(1, 0.0022 * s); for (const f of [0.68, 0.14]) { ctx.beginPath(); ctx.ellipse(x, by - G.H * f, wAt(G, f) * 1.0, wAt(G, f) * G.ry, 0, 0.1, Math.PI - 0.1); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; rrect(ctx, x - G.wr * 0.7, by - G.H * 0.92, G.wr * 0.12, G.H * 0.6, 2); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(70,84,96,0.55)'; ctx.lineWidth = 1; wallPath(); ctx.stroke();
  // the tea in the cup, seen from above the rim: an ellipse sunk below the lip
  const sy = by - G.H * (0.9 - (1 - L) * 0.3), sw = G.wr * (0.93 - (1 - L) * 0.1);
  ctx.fillStyle = '#d8e2e6'; ell(ctx, x, by - G.H, G.wr, G.wr * G.ry); ctx.fill();
  ctx.save(); ell(ctx, x, by - G.H + 0.5, G.wr * 0.93, G.wr * G.ry * 0.9); ctx.clip();
  ctx.fillStyle = L > 0.03 ? lg(ctx, 0, by - G.H - G.wr * G.ry, 0, by - G.H + G.wr * G.ry, [[0, light], [1, body]]) : '#b8c6cc'; ctx.fillRect(x - G.wr, by - G.H - G.wr * G.ry, G.wr * 2, G.wr * G.ry * 2);
  if (L > 0.03) { ctx.fillStyle = 'rgba(255,255,255,0.4)'; ell(ctx, x - sw * 0.3, by - G.H - G.wr * G.ry * 0.3, sw * 0.4, G.wr * G.ry * 0.18); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(x, by - G.H, G.wr, G.wr * G.ry, 0, 0, Math.PI); ctx.stroke();
  void deep; void sy;
  ctx.restore();
  return G;
}

// ---- gongfu: the iron kettle (tetsubin shape with a bail handle); origin = the spout tip, kettle to the right and up -----------------------------------
export function kettle(ctx, u, o = {}) {
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // spout out of the left shoulder, ending at the origin
  ctx.strokeStyle = '#161316'; ctx.lineWidth = 0.032 * u; ctx.beginPath(); ctx.moveTo(0.075 * u, 0.06 * u); ctx.quadraticCurveTo(0.03 * u, 0.07 * u, 0.0, 0.0); ctx.stroke();
  ctx.strokeStyle = '#3a363c'; ctx.lineWidth = 0.024 * u; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 0.005 * u; ctx.beginPath(); ctx.moveTo(0.07 * u, 0.052 * u); ctx.quadraticCurveTo(0.028 * u, 0.062 * u, 0.0, -0.006 * u); ctx.stroke();
  // body
  const cx = 0.17 * u, cy = 0.085 * u, rx = 0.105 * u, ry = 0.085 * u;
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.fillStyle = rg(ctx, cx - rx * 0.4, cy - ry * 0.5, 2, rx * 1.5, [[0, '#7c7886'], [0.35, '#3c3844'], [1, '#0e0c10']]); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
  // arare (small raised studs) in rows, and a band
  ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.clip();
  for (let r = 0; r < 6; r++) for (let k = 0; k < 14; k++) { const a = ((k + (r % 2) * 0.5) / 14) * TAU, px = cx + Math.cos(a) * rx * 0.86 * Math.sin(r * 0.55 + 0.4), py = cy - ry * 0.8 + r * ry * 0.3; if (Math.cos(a) < -0.1) continue; ctx.fillStyle = 'rgba(190,186,200,0.35)'; ell(ctx, cx + Math.cos(a) * rx * (0.3 + r * 0.1) * 1.1, py, 1.7, 1.2); ctx.fill(); void px; }
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.ellipse(cx - rx * 0.45, cy - ry * 0.35, rx * 0.12, ry * 0.4, 0.5, 0, TAU); ctx.fill();
  // lid and its knob, bail handle
  ctx.fillStyle = lg(ctx, cx - rx * 0.5, 0, cx + rx * 0.5, 0, [[0, '#6a6674'], [0.4, '#2a262e'], [1, '#0e0c10']]); ctx.beginPath(); ctx.ellipse(cx, cy - ry * 0.98, rx * 0.5, ry * 0.2, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#b8862c'; ell(ctx, cx, cy - ry * 1.14, rx * 0.1, rx * 0.1); ctx.fill();
  ctx.strokeStyle = '#16121a'; ctx.lineWidth = 0.014 * u; ctx.beginPath(); ctx.moveTo(cx - rx * 0.92, cy - ry * 0.35); ctx.bezierCurveTo(cx - rx * 0.9, cy - ry * 2.0, cx + rx * 0.9, cy - ry * 2.0, cx + rx * 0.92, cy - ry * 0.35); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 0.003 * u; ctx.beginPath(); ctx.moveTo(cx - rx * 0.88, cy - ry * 0.45); ctx.bezierCurveTo(cx - rx * 0.86, cy - ry * 1.9, cx + rx * 0.86, cy - ry * 1.9, cx + rx * 0.88, cy - ry * 0.45); ctx.stroke();
  void o;
  ctx.restore();
}
export { glassFront, glassBack, fOf, yAt };

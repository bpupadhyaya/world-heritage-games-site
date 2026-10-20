// Stick kit (1.27.0): drawing primitives of the paired-strike stick-dance stages. No person is drawn: only forearms in cloth sleeves (bangles, a gripping fist), the
// painted sticks, their tassels, bells and ribbons, and the spark of the clash. Everything is a pure function of its arguments (time arrives as `t` from the stage's rt.anim).
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, circ, ell, hash, TAU } from './dance-kit.js';
import { glow } from './art.js';
import { ik2, ribbon } from './figure-hero.js';

export const lerpN = (a, b, t) => a + (b - a) * t;

// ---- stick styles -------------------------------------------------------------------------------------------------------------------
// base colour; bands (colours cycled along the stick, bw = band length); spiral = barber-pole stripes; rings = brass rings; node = bamboo joints; cap = metal end caps;
// tassel = thread colours hanging from the grip end; bells = a ring of small bells near the grip; ribbons = streamers; burn = burnt chevrons; thick = girth multiplier
export const STICK_STYLES = {
  dandiya: { base: '#d03a2c', bands: ['#f4c430', '#1f9d6e', '#e83e8c', '#2d6fdb'], bw: 30, spiral: true, cap: '#d8ac48', tassel: ['#e83e8c', '#f4c430', '#1f9d6e', '#e8561f'], rings: 3 },
  rosewood: { base: '#4a2212', bands: ['#d6a23a'], bw: 120, cap: '#d8ac48', rings: 4, gloss: 1 },
  kolattam: { base: '#b5231c', bands: ['#1f8f4e', '#f4c430', '#ffffff'], bw: 26, cap: '#e0b84a', tassel: ['#f4c430', '#1f8f4e', '#c8201f'], bells: 1 },
  bamboo: { base: '#dcc660', node: true, wraps: ['#b8321f', '#1f6f6a'], cap: null, bells: 1 },
  cane: { base: '#d8c468', node: true, wraps: ['#b8321f', '#1f6f6a'], cap: null },
  desert: { base: '#a4723c', rope: '#eadfc0', cap: '#7a4a24', ringsDark: 3 },
  ribbon: { base: '#c89a58', cap: '#8a5a2a', ribbons: ['#c8201f', '#f4c430', '#1f4f9d'], wrapCol: '#c8201f' },
  chestnut: { base: '#6a3b1d', burn: true, thick: 1.28, cap: '#2e1a0c' },
  ash: { base: '#d4b078', cap: '#8a5a2a', leather: '#5a3418', wrapCol: '#7a2a18' },
};

// a stick from the grip (x, y) in direction ang; len along, w across. o: { t (time), hit 0..1, tassel sway, shade (0..1 darken for far sticks) }
export function drawStick(ctx, x, y, ang, len, w, styleId, o = {}) {
  const S = STICK_STYLES[styleId] ?? STICK_STYLES.dandiya, th = w * (S.thick ?? 1), t = o.t ?? 0, hit = o.hit ?? 0, flip = Math.cos(ang) < 0 ? -1 : 1, u = th / 26;
  // cast shadow on whatever is behind
  ctx.save(); ctx.translate(x + th * 0.45, y + th * 0.7); ctx.rotate(ang); ctx.fillStyle = 'rgba(0,0,0,0.26)'; rrect(ctx, -th * 0.5, -th / 2, len + th, th, th / 2); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); if (flip < 0) ctx.scale(1, -1);
  const body = () => rrect(ctx, 0, -th / 2, len, th, th * 0.46);
  body(); ctx.fillStyle = S.base; ctx.fill();
  ctx.save(); body(); ctx.clip();
  if (S.bands) {
    const n = Math.ceil(len / S.bw);
    for (let k = 0; k < n; k++) {
      const c = S.bands[k % S.bands.length], x0 = k * S.bw;
      if (S.spiral) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x0, -th / 2 - 2); ctx.lineTo(x0 + S.bw * 0.5, -th / 2 - 2); ctx.lineTo(x0 + S.bw * 0.5 + th * 0.9, th / 2 + 2); ctx.lineTo(x0 + th * 0.9, th / 2 + 2); ctx.closePath(); ctx.fill(); }
      else if (k % 2 === 0) { ctx.fillStyle = c; ctx.fillRect(x0, -th / 2 - 1, S.bw * (S.bands.length === 1 ? 0.18 : 0.55), th + 2); }
    }
  }
  if (S.node) {
    ctx.fillStyle = 'rgba(70,52,10,0.5)'; for (let k = 1; k < 4; k++) { const xx = len * (k / 4) + (k % 2) * 6; ctx.fillRect(xx - 2.5, -th / 2, 5, th); ctx.fillStyle = 'rgba(255,244,170,0.55)'; ctx.fillRect(xx - 2.5, -th / 2, 1.8, th); ctx.fillStyle = 'rgba(70,52,10,0.5)'; }
    for (let k = 0; k < 3; k++) { ctx.fillStyle = S.wraps[k % 2]; ctx.fillRect(len * (0.1 + k * 0.28), -th / 2, 11, th); }
  }
  if (S.rope) { ctx.fillStyle = S.rope; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(k * 9, -th / 2); ctx.lineTo(k * 9 + 8, th / 2); ctx.lineTo(k * 9 + 12, th / 2); ctx.lineTo(k * 9 + 4, -th / 2); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(60,34,12,0.35)'; for (let k = 0; k < 14; k++) ell(ctx, len * hash(k * 3 + 1), (hash(k + 7) - 0.5) * th * 0.8, 6 + 14 * hash(k), 1.5), ctx.fill(); }
  if (S.burn) { ctx.strokeStyle = 'rgba(20,10,4,0.75)'; ctx.lineWidth = 3; for (let k = 0; k < 10; k++) { const xx = len * (0.18 + k * 0.07); ctx.beginPath(); ctx.moveTo(xx, -th * 0.32); ctx.lineTo(xx + th * 0.22, 0); ctx.lineTo(xx, th * 0.32); ctx.stroke(); }
    ctx.fillStyle = 'rgba(230,200,150,0.35)'; ctx.fillRect(len * 0.1, -th * 0.5, len * 0.04, th); }
  if (S.leather) { ctx.fillStyle = S.leather; ctx.fillRect(0, -th / 2, len * 0.2, th); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.4; for (let k = 1; k < 6; k++) { ctx.beginPath(); ctx.moveTo(len * 0.2 * k / 6, -th / 2); ctx.lineTo(len * 0.2 * k / 6 + 4, th / 2); ctx.stroke(); } }
  if (S.rings) for (let k = 0; k < S.rings; k++) { const xx = len * (0.22 + k * 0.17); ctx.fillStyle = hgrad(ctx, xx, xx + 7, [[0, '#7a5a14'], [0.5, '#f6dc7a'], [1, '#7a5a14']]); ctx.fillRect(xx, -th / 2, 7, th); }
  if (S.ringsDark) for (let k = 0; k < S.ringsDark; k++) { ctx.fillStyle = 'rgba(40,20,8,0.7)'; ctx.fillRect(len * (0.55 + k * 0.1), -th / 2, 5, th); }
  if (S.wrapCol) { ctx.fillStyle = S.wrapCol; ctx.fillRect(len * 0.04, -th / 2, len * 0.12, th); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.4; for (let k = 1; k < 7; k++) { const xx = len * 0.04 + len * 0.12 * k / 7; ctx.beginPath(); ctx.moveTo(xx, -th / 2); ctx.lineTo(xx + 3, th / 2); ctx.stroke(); } }
  // cylinder shading: dark edge below, a lit shoulder above, a thin specular line
  ctx.fillStyle = vgrad(ctx, -th / 2, th / 2, [[0, 'rgba(255,255,255,0.4)'], [0.25, 'rgba(255,255,255,0.14)'], [0.55, 'rgba(0,0,0,0.04)'], [0.85, 'rgba(0,0,0,0.32)'], [1, 'rgba(0,0,0,0.55)']]); ctx.fillRect(0, -th / 2, len, th);
  ctx.strokeStyle = `rgba(255,255,255,${S.gloss ? 0.7 : 0.45})`; ctx.lineWidth = Math.max(2, th * 0.09); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(len * 0.04, -th * 0.24); ctx.lineTo(len * 0.96, -th * 0.24); ctx.stroke();
  if (o.shade) { ctx.fillStyle = `rgba(0,0,0,${0.4 * o.shade})`; ctx.fillRect(0, -th / 2, len, th); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(12,6,2,0.8)'; ctx.lineWidth = 2; body(); ctx.stroke();
  if (S.cap) { for (const [cx0, cw] of [[len - th * 0.55, th * 0.55], [0, th * 0.5]]) { ctx.fillStyle = hgrad(ctx, cx0, cx0 + cw, [[0, darker(S.cap, 0.4)], [0.4, lighter(S.cap, 0.45)], [1, darker(S.cap, 0.35)]]); rrect(ctx, cx0, -th / 2 - 1, cw, th + 2, th * 0.3); ctx.fill(); ctx.strokeStyle = 'rgba(30,16,2,0.7)'; ctx.lineWidth = 1.4; ctx.stroke(); } }
  else { ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, len - th * 0.35, -th / 2, th * 0.35, th, th * 0.4); ctx.fill(); }
  // a ring of small brass bells near the grip
  if (S.bells) for (let k = 0; k < 4; k++) { const bx = len * (0.1 + k * 0.012), by = th / 2 + 4 + k * 1.5, jig = Math.sin(t * 28 + k * 2) * (2 + 8 * hit) * u; ctx.fillStyle = rgrad(ctx, bx - 2, by - 2 + jig * 0.3, 0, 7 * u, [[0, '#fff3b0'], [0.5, '#d4a43a'], [1, '#6a4a14']]); circ(ctx, bx + k * 8 * u, by + jig * 0.5, 6.2 * u); ctx.fill(); ctx.strokeStyle = 'rgba(60,36,6,0.8)'; ctx.lineWidth = 1; ctx.stroke(); }
  ctx.restore();
  // tassel and streamers hang from the grip end, swaying with the movement; drawn in world space so they hang down
  const swayAmp = (5 + 26 * hit) * u;
  const hang = (c, k, n, lenH, wd) => {
    const gx = x - Math.cos(ang) * 6, gy = y - Math.sin(ang) * 6, sw = Math.sin(t * 6 + k * 1.7) * swayAmp * 0.5 + Math.cos(ang) * 8 + (k - n / 2) * 4;
    ctx.strokeStyle = c; ctx.lineWidth = wd; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.bezierCurveTo(gx + sw * 0.3, gy + lenH * 0.35, gx + sw * 0.9, gy + lenH * 0.6, gx + sw * 0.6 + Math.sin(t * 9 + k) * swayAmp * 0.3, gy + lenH); ctx.stroke();
  };
  if (S.tassel) { const n = S.tassel.length * 2; for (let k = 0; k < n; k++) hang(S.tassel[k % S.tassel.length], k, n, (66 + 10 * (k % 3)) * u, 5 * u); ctx.fillStyle = '#d8ac48'; circ(ctx, x - Math.cos(ang) * 6, y - Math.sin(ang) * 6 + 4, 7 * u); ctx.fill(); }
  if (S.ribbons) for (let k = 0; k < S.ribbons.length; k++) hang(S.ribbons[k], k, 3, (120 + 18 * k) * u, 9 * u);
}

// ---- the forearm and hand (1.29.0) ---------------------------------------------------------------------------------------------------
// A real, tapered forearm: thick above the elbow, narrowing to a slim wrist, with a muscle line and a wrist bone; over it a cloth sleeve that flares from the shoulder and
// gathers at a cuff, with drape lines, cross wrinkles at the elbow and creases at the cuff. The hand is two parts: the back of the hand with tendons and four knuckles
// (drawn with the arm, under the stick) and the four curled fingers with joints and a thumb (drawn over the stick). The grip point is computed from the arm, so the hand
// always continues the forearm. No faces and no bodies anywhere.
const unit = (a, b) => { const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / d, (b[1] - a[1]) / d]; };
// samples along the polyline sh-el-wr (smoothed at the elbow): [{ x, y, nx, ny, u }]
function armSamples(sh, el, wr, n = 34) {
  const L1 = Math.hypot(el[0] - sh[0], el[1] - sh[1]), L2 = Math.hypot(wr[0] - el[0], wr[1] - el[1]), LT = (L1 + L2) || 1;
  const raw = [];
  for (let i = 0; i <= n; i++) { const d = (i / n) * LT; raw.push(d <= L1 ? [sh[0] + (el[0] - sh[0]) * (d / (L1 || 1)), sh[1] + (el[1] - sh[1]) * (d / (L1 || 1))] : [el[0] + (wr[0] - el[0]) * ((d - L1) / (L2 || 1)), el[1] + (wr[1] - el[1]) * ((d - L1) / (L2 || 1))]); }
  const sm = raw.map((p, i) => { let x = 0, y = 0, c = 0; for (let j = -3; j <= 3; j++) { const q = raw[clamp(i + j, 0, n)]; x += q[0]; y += q[1]; c++; } return [x / c, y / c]; });
  sm[0] = raw[0]; sm[n] = raw[n];
  return sm.map((p, i) => { const a = sm[Math.max(0, i - 1)], b = sm[Math.min(n, i + 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d; return { x: p[0], y: p[1], nx: -dy, ny: dx, dx, dy, u: i / n }; });
}
const lerpW = (stops, u) => { for (let i = 1; i < stops.length; i++) if (u <= stops[i][0]) { const a = stops[i - 1], b = stops[i], f = (u - a[0]) / ((b[0] - a[0]) || 1); return a[1] + (b[1] - a[1]) * f; } return stops[stops.length - 1][1]; };
// polygon of the samples between u0 and u1 with half-width wf(u)*k
function tube(ctx, S, u0, u1, wf, k = 1, ox = 0, oy = 0) {
  const P = S.filter((s) => s.u >= u0 - 1e-6 && s.u <= u1 + 1e-6);
  ctx.beginPath();
  P.forEach((s, i) => { const w = wf(s.u) * k / 2; const x = s.x + s.nx * w + ox, y = s.y + s.ny * w + oy; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
  for (let i = P.length - 1; i >= 0; i--) { const s = P[i], w = wf(s.u) * k / 2; ctx.lineTo(s.x - s.nx * w + ox, s.y - s.ny * w + oy); }
  ctx.closePath();
}
const shadeGrad = (ctx, S, wmax, col, rim = 0.34) => {
  const a = S[0], b = S[S.length - 1], dx = b.x - a.x, dy = b.y - a.y, dl = Math.hypot(dx, dy) || 1, nx = -dy / dl, ny = dx / dl, lit = (nx * -0.6 + ny * -0.8) >= 0 ? 1 : -1, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const g = ctx.createLinearGradient(mx + nx * wmax * 0.55 * lit, my + ny * wmax * 0.55 * lit, mx - nx * wmax * 0.55 * lit, my - ny * wmax * 0.55 * lit);
  g.addColorStop(0, lighter(col, 0.34)); g.addColorStop(0.28, lighter(col, 0.1)); g.addColorStop(0.62, col); g.addColorStop(1, darker(col, rim));
  return { g, lit };
};
const line = (ctx, S, f, wf, u0, u1, wob = 0, ph = 0) => { let first = true; for (const s of S) { if (s.u < u0 || s.u > u1) continue; const w = wf(s.u) / 2 * f + Math.sin(s.u * 11 + ph) * wob; const x = s.x + s.nx * w, y = s.y + s.ny * w; if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y); } };

// o: { skin, cloth, trim, sleeve (0..1 of the arm length covered by cloth), loose (0..1 flare), bangles, w, side (+1 elbow below the line, -1 above), pl (palm length factor) }
// sh = shoulder (off screen), gr = where the stick is gripped. Returns { grip, d, wrist, elbow, W } for the stick and the fingers.
export function arm(ctx, sh, gr, o = {}) {
  const W = o.w ?? 80, skin = o.skin ?? '#b9784a', cloth = o.cloth ?? '#f4eedc', trim = o.trim ?? '#c8201f', pl = (o.pl ?? 1.12) * W, f = o.sleeve ?? 0.7, loose = o.loose ?? 0.8;
  const d0 = unit(sh, gr), dist = Math.hypot(gr[0] - sh[0], gr[1] - sh[1]);
  const wt = [gr[0] - d0[0] * pl, gr[1] - d0[1] * pl];
  const dw = Math.hypot(wt[0] - sh[0], wt[1] - sh[1]), r = ik2(sh[0], sh[1], wt[0], wt[1], dw * 0.512, dw * 0.512, [(sh[0] + wt[0]) / 2 + (o.bend ? o.bend[0] : 0), (sh[1] + wt[1]) / 2 + (o.bend ? o.bend[1] : (o.side ?? 1) * 200)]);
  const el = r.mid, wr = r.end, S = armSamples(sh, el, wr), dd = unit(wr, gr), grip = [wr[0] + dd[0] * pl, wr[1] + dd[1] * pl];
  // skin: thick at the shoulder, a slight bulge below the elbow, a slim wrist
  const skinW = (u) => W * lerpW([[0, 1.3], [0.34, 1.2], [0.5, 1.02], [0.64, 1.0], [0.84, 0.76], [1, 0.62]], u);
  const wmax = W * 1.35;
  { tube(ctx, S, 0, 1, skinW, 1, W * 0.07, W * 0.1); ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fill(); }
  { tube(ctx, S, 0, 1, skinW); ctx.fillStyle = darker(skin, 0.34); ctx.fill(); const { g } = shadeGrad(ctx, S, wmax, skin); tube(ctx, S, 0, 1, skinW, 0.92); ctx.fillStyle = g; ctx.fill(); }
  { ctx.save(); tube(ctx, S, 0, 1, skinW, 0.92); ctx.clip(); ctx.lineCap = 'round';
    ctx.strokeStyle = rgba(lighter(skin, 0.5), 0.34); ctx.lineWidth = W * 0.09; ctx.beginPath(); line(ctx, S, 0.36, skinW, 0.5, 0.95, W * 0.012); ctx.stroke();   // the muscle line
    ctx.strokeStyle = rgba(darker(skin, 0.55), 0.3); ctx.lineWidth = W * 0.05; ctx.beginPath(); line(ctx, S, -0.3, skinW, 0.52, 0.93, W * 0.01, 2); ctx.stroke();
    const s = S[Math.round(S.length * 0.5)]; ctx.strokeStyle = rgba(darker(skin, 0.5), 0.35); ctx.lineWidth = W * 0.04; for (const q of [-0.18, 0.02, 0.2]) { ctx.beginPath(); ctx.arc(s.x + s.dx * W * 0.25, s.y + s.dy * W * 0.25 + q * W, W * 0.2, 0, 3.1); ctx.stroke(); } ctx.restore(); }
  // the wrist bone
  { const s = S[S.length - 3], w = skinW(s.u) / 2; ctx.fillStyle = rgba(lighter(skin, 0.45), 0.5); ctx.beginPath(); ctx.ellipse(s.x + s.nx * w * 0.5 * -1, s.y + s.ny * w * 0.5 * -1, W * 0.1, W * 0.07, Math.atan2(s.dy, s.dx), 0, TAU); ctx.fill(); }
  // the back of the hand: from the wrist widening to the knuckles, with tendons and four knuckle bumps
  { const a = Math.atan2(dd[1], dd[0]); ctx.save(); ctx.translate(wr[0], wr[1]); ctx.rotate(a);
    const hp = () => { ctx.beginPath(); ctx.moveTo(-W * 0.06, -W * 0.34); ctx.bezierCurveTo(pl * 0.35, -W * 0.44, pl * 0.7, -W * 0.56, pl * 1.0, -W * 0.54); ctx.lineTo(pl * 1.0, W * 0.54); ctx.bezierCurveTo(pl * 0.7, W * 0.56, pl * 0.35, W * 0.44, -W * 0.06, W * 0.34); ctx.closePath(); };
    hp(); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.save(); ctx.translate(2, 4); ctx.fill(); ctx.restore();
    hp(); ctx.fillStyle = darker(skin, 0.36); ctx.fill();
    ctx.save(); ctx.scale(1, 1); hp(); ctx.fillStyle = vgrad(ctx, -W * 0.5, W * 0.5, [[0, lighter(skin, 0.28)], [0.5, skin], [1, darker(skin, 0.3)]]); ctx.fill(); ctx.clip();
    ctx.strokeStyle = rgba(darker(skin, 0.5), 0.34); ctx.lineWidth = W * 0.035; ctx.lineCap = 'round'; for (let k = 0; k < 4; k++) { const v = (k - 1.5) * W * 0.2; ctx.beginPath(); ctx.moveTo(W * 0.1, v * 0.4); ctx.lineTo(pl * 0.95, v); ctx.stroke(); }
    ctx.restore();
    for (let k = 0; k < 4; k++) { const v = (k - 1.5) * W * 0.235; ctx.fillStyle = rgba(lighter(skin, 0.5), 0.55); ctx.beginPath(); ctx.ellipse(pl * 0.93, v - W * 0.02, W * 0.07, W * 0.09, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = rgba(darker(skin, 0.5), 0.55); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(pl * 0.98, v + W * 0.11, W * 0.05, 3.3, 6.1); ctx.stroke(); }
    ctx.restore(); }
  // the cloth sleeve
  if (f > 0) {
    const cw = (u) => { const t = Math.min(1, u / f); return W * (loose > 0.5 ? lerpW([[0, 2.05], [0.35, 1.85], [0.7, 1.55], [1, 1.2]], t) : lerpW([[0, 1.5], [0.5, 1.3], [1, 1.04]], t)); };
    tube(ctx, S, 0, f, cw, 1, W * 0.08, W * 0.12); ctx.fillStyle = 'rgba(0,0,0,0.26)'; ctx.fill();
    tube(ctx, S, 0, f, cw); ctx.fillStyle = darker(cloth, 0.3); ctx.fill();
    const { g } = shadeGrad(ctx, S, W * 2.1, cloth, 0.2); tube(ctx, S, 0, f, cw, 0.93); ctx.fillStyle = g; ctx.fill();
    ctx.save(); tube(ctx, S, 0, f, cw, 0.93); ctx.clip(); ctx.lineCap = 'round';
    // long drape lines
    for (const [fo, ph] of [[-0.62, 1], [-0.22, 3], [0.18, 5], [0.58, 7]]) { ctx.strokeStyle = rgba(darker(cloth, 0.55), 0.2); ctx.lineWidth = W * 0.055; ctx.beginPath(); line(ctx, S, fo, cw, 0.02, f, W * 0.05, ph); ctx.stroke(); ctx.strokeStyle = rgba(lighter(cloth, 0.6), 0.22); ctx.lineWidth = W * 0.03; ctx.beginPath(); line(ctx, S, fo + 0.1, cw, 0.02, f, W * 0.05, ph); ctx.stroke(); }
    // cross wrinkles where the sleeve bends at the elbow and gathers at the cuff
    const cross = (u, n) => { const i = Math.round(u * (S.length - 1)), s = S[i], w = cw(s.u) / 2; for (let k = 0; k < n; k++) { const uu = u + (k - n / 2) * 0.028, j = Math.round(clamp(uu, 0, 1) * (S.length - 1)), q = S[j], ww = cw(q.u) / 2; ctx.strokeStyle = rgba(darker(cloth, 0.55), 0.17); ctx.lineWidth = W * 0.04; ctx.beginPath(); ctx.moveTo(q.x - q.nx * ww * 0.95, q.y - q.ny * ww * 0.95); ctx.quadraticCurveTo(q.x + q.dx * ww * 0.5 * ((k % 2) ? 1 : -1), q.y + q.dy * ww * 0.5 * ((k % 2) ? 1 : -1), q.x + q.nx * ww * 0.95, q.y + q.ny * ww * 0.95); ctx.stroke(); } void w; };
    cross(0.5, 3); cross(Math.min(0.95 * f, 0.9), 3);
    ctx.restore();
    // the cuff: a band in the trim colour
    const ci = Math.round(f * (S.length - 1)), c0 = S[Math.max(0, ci - 3)], c1 = S[ci], cwh = cw(f) * 0.5;
    const band = (k, col, ox = 0, oy = 0) => { ctx.beginPath(); ctx.moveTo(c0.x + c0.nx * cwh * k + ox, c0.y + c0.ny * cwh * k + oy); ctx.lineTo(c1.x + c1.nx * cwh * k + ox, c1.y + c1.ny * cwh * k + oy); ctx.lineTo(c1.x - c1.nx * cwh * k + ox, c1.y - c1.ny * cwh * k + oy); ctx.lineTo(c0.x - c0.nx * cwh * k + ox, c0.y - c0.ny * cwh * k + oy); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };
    band(1.04, 'rgba(0,0,0,0.3)', 3, 4); band(1.04, darker(trim, 0.4)); ctx.save(); band(1.0, trim); ctx.clip(); ctx.strokeStyle = rgba(lighter(trim, 0.6), 0.5); ctx.lineWidth = W * 0.05; ctx.beginPath(); ctx.moveTo(c0.x + c0.nx * cwh * 0.6, c0.y + c0.ny * cwh * 0.6); ctx.lineTo(c1.x + c1.nx * cwh * 0.6, c1.y + c1.ny * cwh * 0.6); ctx.stroke(); ctx.restore();
    ctx.fillStyle = 'rgba(255,230,150,0.8)'; for (let k = -2; k <= 2; k++) { circ(ctx, (c0.x + c1.x) / 2 + c1.nx * cwh * 0.3 * k, (c0.y + c1.y) / 2 + c1.ny * cwh * 0.3 * k, W * 0.035); ctx.fill(); }
  }
  // bangles on the wrist
  const bg = o.bangles ?? [];
  bg.forEach((c, k) => { const i = Math.round((0.93 - k * 0.035) * (S.length - 1)), s = S[i], bw = skinW(s.u) * 0.86, a = Math.atan2(s.dy, s.dx), bt = W * 0.1; ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(a);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, -bt * 0.3, -bw / 2 + 3, bt, bw, 3); ctx.fill(); ctx.fillStyle = hgrad(ctx, -bt / 2, bt / 2, [[0, darker(c, 0.35)], [0.45, lighter(c, 0.45)], [1, darker(c, 0.3)]]); rrect(ctx, -bt / 2, -bw / 2, bt, bw, bt * 0.45); ctx.fill(); ctx.strokeStyle = 'rgba(60,36,4,0.7)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); });
  return { grip, d: dd, wrist: wr, elbow: el, W };
}

// the four curled fingers and the thumb over the stick; `g` is arm()'s return value. side: which side the thumb lies on.
export function fingers(ctx, g, skin = '#b9784a', side = 1) {
  const W = g.W, a = Math.atan2(g.d[1], g.d[0]), dk = darker(skin, 0.42);
  ctx.save(); ctx.translate(g.grip[0], g.grip[1]); ctx.rotate(a);
  const fing = (v, lenF, wd) => {
    const x0 = -W * 0.36, x1 = W * (0.3 + lenF);
    ctx.fillStyle = 'rgba(0,0,0,0.32)'; rrect(ctx, x0 + 3, v - wd / 2 + 4, x1 - x0, wd, wd * 0.5); ctx.fill();
    ctx.fillStyle = darker(skin, 0.4); rrect(ctx, x0, v - wd / 2, x1 - x0, wd, wd * 0.5); ctx.fill();
    ctx.fillStyle = hgrad(ctx, v - wd / 2 + 0, v + wd / 2, [[0, lighter(skin, 0.3)], [0.5, skin], [1, darker(skin, 0.28)]]);   // placeholder, replaced below by a vertical-in-frame gradient
    const gr = ctx.createLinearGradient(0, v - wd / 2, 0, v + wd / 2); gr.addColorStop(0, lighter(skin, 0.3)); gr.addColorStop(0.5, skin); gr.addColorStop(1, darker(skin, 0.3));
    ctx.fillStyle = gr; rrect(ctx, x0 + 1.5, v - wd / 2 + 1.5, x1 - x0 - 3, wd - 3, wd * 0.46); ctx.fill();
    ctx.strokeStyle = rgba(dk, 0.7); ctx.lineWidth = 1.6; ctx.stroke();
    // the joints: two creases and a knuckle highlight at the base
    ctx.strokeStyle = rgba(dk, 0.6); ctx.lineWidth = Math.max(1.6, W * 0.025); ctx.lineCap = 'round';
    for (const xx of [W * 0.04, W * (0.2 + lenF * 0.35)]) { ctx.beginPath(); ctx.moveTo(xx, v - wd * 0.36); ctx.quadraticCurveTo(xx + wd * 0.1, v, xx, v + wd * 0.36); ctx.stroke(); }
    ctx.fillStyle = rgba(lighter(skin, 0.6), 0.45); ctx.beginPath(); ctx.ellipse(-W * 0.14, v - wd * 0.12, W * 0.08, wd * 0.24, 0, 0, TAU); ctx.fill();
  };
  const lens = [0.02, 0.1, 0.1, 0.04], wd = W * 0.245;
  for (let k = 0; k < 4; k++) fing((k - 1.5) * W * 0.235, lens[k], wd);
  // the thumb: a capsule lying across the fingers from the palm side, with a nail
  const tv = side * W * 0.6, tv1 = side * W * 0.18, tw = W * 0.29;
  const thumb = (c0) => { ctx.beginPath(); ctx.moveTo(-W * 0.62, tv); ctx.lineTo(W * 0.12, tv1); ctx.lineWidth = tw; ctx.lineCap = 'round'; ctx.strokeStyle = c0; ctx.stroke(); };
  ctx.save(); ctx.translate(2, 4); thumb('rgba(0,0,0,0.3)'); ctx.restore(); thumb(darker(skin, 0.4)); ctx.save(); ctx.translate(-0.6, -0.8); ctx.beginPath(); ctx.moveTo(-W * 0.62, tv); ctx.lineTo(W * 0.1, tv1); ctx.lineWidth = tw * 0.86; ctx.lineCap = 'round'; ctx.strokeStyle = lighter(skin, 0.08); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = rgba(lighter(skin, 0.55), 0.5); ctx.lineWidth = tw * 0.2; ctx.beginPath(); ctx.moveTo(-W * 0.5, tv - side * tw * 0.22); ctx.lineTo(W * 0.04, tv1 - side * tw * 0.22); ctx.stroke();
  ctx.fillStyle = rgba('#fbe6d4', 0.8); ctx.beginPath(); ctx.ellipse(W * 0.08, tv1, W * 0.07, tw * 0.3, 0.3 * side, 0, TAU); ctx.fill(); ctx.strokeStyle = rgba(dk, 0.5); ctx.lineWidth = 1.2; ctx.stroke();
  ctx.restore();
}

// the strike: ONE light. A soft round glow, a four-point flare that flashes white, a single thin ring and a few chips of wood. f 1 -> 0 after the strike.
export function clashFx(ctx, x, y, f, o = {}) {
  if (f < 0.04) return;
  const p = 1 - f, col = o.col ?? '#fff0b8', s = o.s ?? 1;
  glow(ctx, x, y, (110 + 120 * f) * s, col, 0.55 * f);
  glow(ctx, x, y, 46 * s * (0.5 + f), '#ffffff', 0.9 * f);
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha = Math.min(1, f * 1.4); ctx.fillStyle = '#ffffff';
  const L = (80 + 90 * f) * s, w = 9 * s * f + 2;
  for (const rot of [0, Math.PI / 2]) { ctx.save(); ctx.rotate(rot + 0.25); ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(0, -w); ctx.lineTo(L, 0); ctx.lineTo(0, w); ctx.closePath(); ctx.fill(); ctx.restore(); }
  ctx.restore();
  ctx.strokeStyle = rgba('#ffffff', 0.7 * f); ctx.lineWidth = 4 * s * f + 1; ctx.beginPath(); ctx.arc(x, y, (24 + 120 * p) * s, 0, TAU); ctx.stroke();
  for (let k = 0; k < 6; k++) { const a = -0.4 - hash(k + 20) * 2.4, d = (30 + 100 * p * (0.6 + hash(k + 5))) * s, fy = 150 * p * p * s; ctx.fillStyle = rgba(o.chip ?? '#d8b078', 0.9 * f); ctx.save(); ctx.translate(x + Math.cos(a) * d, y + Math.sin(a) * d + fy); ctx.rotate(k + p * 5); ctx.fillRect(-5 * s, -2 * s, 10 * s, 4 * s); ctx.restore(); }
}

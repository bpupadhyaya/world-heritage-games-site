// Dance kit (1.11.0): helpers for the folk-dance stages (stage-dance-ring, stage-dance-solo, stage-dance-line). The stages are scenes on top of
// drum-kit's createDrumStage (zones, cues, strike glow, pills); dancers come from dancers.js (seen from above, no faces).
// Everything here is presentation only: a function of the runtime object `rt` (clock, flash, anim, list), never of the real time.
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU } from './drum-kit.js';
export * from './drum-kit.js';
export { createDrumStage as createSceneStage } from './drum-kit.js';
export { dancerTop, dancePose, smoothAngle } from './dancers.js';

// the lane that is next due (state pending, due now or soon): the dancer moves towards that lane's place before the step falls due
export function nextLane(rt) {
  if (!rt?.list) return -1;
  let best = null;
  for (const t of rt.list) { if (t.state && t.state !== 'pending') continue; if (t.t < rt.clock - 0.12) continue; if (!best || t.t < best.t) best = t; }
  return best ? best.lane : -1;
}
// seconds until the next due step (large when none)
export function untilNext(rt) {
  if (!rt?.list) return 9;
  let best = 9;
  for (const t of rt.list) { if (t.state && t.state !== 'pending') continue; if (t.t < rt.clock - 0.12) continue; best = Math.min(best, t.t - rt.clock); }
  return best;
}
// a presentation-only smoother for positions: follower(rt.anim, target, rate) eases towards target; state is the object's own
export function follow(st, anim, tx, ty, rate = 9) {
  const dt = st.t == null ? 0 : clamp(anim - st.t, 0, 0.1); st.t = anim;
  if (st.x == null) { st.x = tx; st.y = ty; return st; }
  const k = 1 - Math.exp(-rate * dt); st.x += (tx - st.x) * k; st.y += (ty - st.y) * k; return st;
}
export const maxFlash = (rt, idx) => { let m = 0; for (const i of idx) m = Math.max(m, rt.flash[i] ?? 0); return m; };
export const beatPhase = (rt) => (rt.spb > 0 ? rt.clock / rt.spb : 0);

// puffs of dust or spark ring at a point when struck (f 0..1 flash)
export function dust(ctx, x, y, f, col = '#d8c49a', r = 40) {
  if (f <= 0.05) return;
  for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + k, d = r * (0.3 + (1 - f) * 1.1), rr = r * 0.22 * (1 - (1 - f) * 0.4); ctx.fillStyle = rgba(col, 0.38 * f); circ(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, rr); ctx.fill(); }
}

// soft ground shadow ellipse
export function groundShadow(ctx, x, y, rx, ry, a = 0.34) { ctx.fillStyle = `rgba(0,0,0,${a})`; ell(ctx, x, y, rx, ry); ctx.fill(); }

// a wooden stick (round, lit) between two points; thickness w; hit adds a bright flash cap
export function rod(ctx, x0, y0, x1, y1, w, col = '#c89a58', hi = 0) {
  const ang = Math.atan2(y1 - y0, x1 - x0), len = Math.hypot(x1 - x0, y1 - y0);
  ctx.save(); ctx.translate(x0, y0); ctx.rotate(ang);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, 2, w * 0.35, len, w, w / 2); ctx.fill();
  ctx.fillStyle = vgrad(ctx, -w / 2, w / 2, [[0, lighter(col, 0.5)], [0.4, col], [1, darker(col, 0.55)]]); rrect(ctx, 0, -w / 2, len, w, w / 2); ctx.fill();
  ctx.strokeStyle = rgba(darker(col, 0.7), 0.6); ctx.lineWidth = 1; ctx.stroke();
  if (hi > 0.05) { ctx.fillStyle = `rgba(255,248,220,${0.8 * hi})`; circ(ctx, len, 0, w * (0.7 + hi)); ctx.fill(); }
  ctx.restore();
}

// plaid / tartan fill inside the current path region: stripes of two colours over a base (call after setting clip)
export function tartan(ctx, x0, y0, x1, y1, base, a, b, step = 14) {
  ctx.fillStyle = base; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.globalAlpha = 0.6; ctx.fillStyle = a; for (let x = x0; x < x1; x += step * 2.4) ctx.fillRect(x, y0, step * 0.5, y1 - y0); for (let y = y0; y < y1; y += step * 2.4) ctx.fillRect(x0, y, x1 - x0, step * 0.5);
  ctx.globalAlpha = 0.5; ctx.fillStyle = b; for (let x = x0 + step; x < x1; x += step * 2.4) ctx.fillRect(x, y0, 2, y1 - y0); for (let y = y0 + step; y < y1; y += step * 2.4) ctx.fillRect(x0, y, x1 - x0, 2);
  ctx.globalAlpha = 1;
}

// head wear drawn over a dancerTop head: turban, flat cap, straw hat, flower crown. (x,y) = dancer position, s = dancer scale
export function headwear(ctx, kind, x, y, s, col = '#f2efe6', col2 = '#c0392b', bob = 0, o2 = {}) {
  const hx = x, hy = y - s * 0.04 - bob * s * 0.06, hr = s * 0.28;
  ctx.save();
  if (kind === 'turban') {
    for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? darker(col, 0.12) : col; ctx.beginPath(); ctx.ellipse(hx + (k - 1.5) * hr * 0.05, hy - hr * 0.02, hr * (1.25 - k * 0.08), hr * (1.1 - k * 0.08), k * 0.35, 0, TAU); ctx.fill(); ctx.strokeStyle = rgba(darker(col, 0.5), 0.45); ctx.lineWidth = 1.4; ctx.stroke(); }
    ctx.fillStyle = rgrad(ctx, hx - hr * 0.2, hy - hr * 0.3, 0, hr, [[0, lighter(col, 0.35)], [1, col]]); circ(ctx, hx, hy, hr * 0.66); ctx.fill();
    ctx.fillStyle = col2; ctx.beginPath(); ctx.ellipse(hx + hr * 1.0, hy + hr * 0.7, hr * 0.5, hr * 0.2, 0.7, 0, TAU); ctx.fill();   // the tail of the cloth
  } else if (kind === 'cap') {
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; circ(ctx, hx + 3, hy + 4, hr * 1.05); ctx.fill();
    ctx.fillStyle = rgrad(ctx, hx - hr * 0.25, hy - hr * 0.3, 0, hr * 1.1, [[0, lighter(col, 0.3)], [1, darker(col, 0.35)]]); circ(ctx, hx, hy, hr * 1.02); ctx.fill();
    ctx.strokeStyle = rgba(col2, 0.9); ctx.lineWidth = 3; circ(ctx, hx, hy, hr * 0.86); ctx.stroke();
  } else if (kind === 'straw') {
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ell(ctx, hx + 4, hy + 6, hr * 1.9, hr * 1.9); ctx.fill();
    ctx.fillStyle = rgrad(ctx, hx - hr * 0.3, hy - hr * 0.3, hr * 0.2, hr * 1.9, [[0, '#f0dc9a'], [1, '#b8944a']]); circ(ctx, hx, hy, hr * 1.85); ctx.fill();
    ctx.strokeStyle = 'rgba(120,90,40,0.4)'; ctx.lineWidth = 1.2; for (let k = 1; k < 7; k++) { circ(ctx, hx, hy, hr * (0.4 + k * 0.22)); ctx.stroke(); }
    ctx.fillStyle = rgrad(ctx, hx - hr * 0.2, hy - hr * 0.25, 0, hr * 0.9, [[0, '#f6e8b0'], [1, '#c8a458']]); circ(ctx, hx, hy, hr * 0.78); ctx.fill();
    ctx.strokeStyle = col2; ctx.lineWidth = 4; circ(ctx, hx, hy, hr * 0.8); ctx.stroke();
  } else if (kind === 'flowers') {
    // an open crown of flowers and green leaves round the head: the hair stays visible inside it
    for (let k = 0; k < 14; k++) { const a = k / 14 * TAU + 0.2; ctx.fillStyle = k % 2 ? '#3f8a3a' : '#2f6a2c'; ell(ctx, hx + Math.cos(a) * hr * 0.9, hy + Math.sin(a) * hr * 0.9, hr * 0.26, hr * 0.12); ctx.fill(); }
    for (let k = 0; k < 9; k++) { const a = k / 9 * TAU; const fx = hx + Math.cos(a) * hr * 0.9, fy = hy + Math.sin(a) * hr * 0.9, c = k % 3 === 0 ? col2 : k % 3 === 1 ? '#ffe27a' : '#f8f4ea';
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; circ(ctx, fx + 1.5, fy + 2, hr * 0.2); ctx.fill(); for (let q = 0; q < 5; q++) { const b = q / 5 * TAU; ctx.fillStyle = c; circ(ctx, fx + Math.cos(b) * hr * 0.13, fy + Math.sin(b) * hr * 0.13, hr * 0.1); ctx.fill(); } ctx.fillStyle = '#c8802a'; circ(ctx, fx, fy, hr * 0.07); ctx.fill(); }
  } else if (kind === 'bonnet') {
    // Highland bonnet: a dark blue flat top with a diced band, a red toorie and a ribbon with a silver badge
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; circ(ctx, hx + 4, hy + 6, hr * 1.12); ctx.fill();
    ctx.fillStyle = rgrad(ctx, hx - hr * 0.3, hy - hr * 0.3, 0, hr * 1.2, [[0, lighter(col, 0.25)], [1, darker(col, 0.35)]]); circ(ctx, hx, hy, hr * 1.08); ctx.fill();
    ctx.save(); circ(ctx, hx, hy, hr * 1.08); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1.2; for (let k = -6; k <= 6; k++) { ctx.beginPath(); ctx.moveTo(hx + k * hr * 0.18, hy - hr); ctx.lineTo(hx + k * hr * 0.18, hy + hr); ctx.stroke(); ctx.beginPath(); ctx.moveTo(hx - hr, hy + k * hr * 0.18); ctx.lineTo(hx + hr, hy + k * hr * 0.18); ctx.stroke(); } ctx.restore();
    ctx.strokeStyle = col2; ctx.lineWidth = hr * 0.16; circ(ctx, hx, hy, hr * 0.92); ctx.stroke();
    ctx.strokeStyle = '#f4eedc'; ctx.lineWidth = hr * 0.07; circ(ctx, hx, hy, hr * 0.92); ctx.setLineDash([hr * 0.14, hr * 0.14]); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; circ(ctx, hx + 2, hy + 3, hr * 0.2); ctx.fill(); ctx.fillStyle = rgrad(ctx, hx - 2, hy - 2, 0, hr * 0.22, [[0, '#ff7a5a'], [1, '#8a1c10']]); circ(ctx, hx, hy, hr * 0.2); ctx.fill();
    ctx.strokeStyle = '#1c2a58'; ctx.lineWidth = hr * 0.14; ctx.beginPath(); ctx.moveTo(hx + hr * 0.85, hy + hr * 0.2); ctx.lineTo(hx + hr * 1.4, hy + hr * 0.9); ctx.stroke(); ctx.fillStyle = '#d8dce4'; circ(ctx, hx + hr * 0.95, hy + hr * 0.28, hr * 0.13); ctx.fill();
  } else if (kind === 'band') {
    // a beaded headband with an ostrich plume streaming back
    if (o2.plume) { // three ostrich feathers fanned back from the band, with barbs
      ctx.save(); ctx.translate(hx, hy); ctx.rotate((o2.face ?? -Math.PI / 2) + Math.PI / 2);
      for (const [k, sw0, ln] of [[-1, -0.5, 1.5], [0, 0.0, 1.8], [1, 0.5, 1.5]]) {
        const ex = Math.sin(sw0) * hr * ln, ey = Math.cos(sw0) * hr * ln + hr * 0.7, cx1 = ex * 0.4 + k * hr * 0.35, cy1 = hr * 1.5;
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = hr * 0.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hr * 0.1, hr * 0.7 + 5); ctx.quadraticCurveTo(cx1 + 4, cy1 + 6, ex + 4, ey + 7); ctx.stroke();
        ctx.strokeStyle = k === 0 ? '#f4eedc' : '#e8dcc0'; ctx.lineWidth = hr * 0.5; ctx.beginPath(); ctx.moveTo(0, hr * 0.7); ctx.quadraticCurveTo(cx1, cy1, ex, ey); ctx.stroke();
        ctx.strokeStyle = 'rgba(120,100,70,0.55)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, hr * 0.7); ctx.quadraticCurveTo(cx1, cy1, ex, ey); ctx.stroke();
        for (let b = 1; b < 9; b++) { const tt = b / 9, px = (1 - tt) * (1 - tt) * 0 + 2 * (1 - tt) * tt * cx1 + tt * tt * ex, py = (1 - tt) * (1 - tt) * hr * 0.7 + 2 * (1 - tt) * tt * cy1 + tt * tt * ey; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - hr * 0.26, py + hr * 0.06); ctx.moveTo(px, py); ctx.lineTo(px + hr * 0.26, py + hr * 0.06); ctx.stroke(); } }
      ctx.restore(); }
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = hr * 0.36; circ(ctx, hx + 1.5, hy + 2, hr * 0.78); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = hr * 0.3; circ(ctx, hx, hy, hr * 0.78); ctx.stroke();
    for (let k = 0; k < 18; k++) { const a = k / 18 * TAU; ctx.fillStyle = [col2, '#f4eedc', '#2a58b8', '#e8b84a'][k % 4]; circ(ctx, hx + Math.cos(a) * hr * 0.78, hy + Math.sin(a) * hr * 0.78, hr * 0.09); ctx.fill(); }
  }
  ctx.restore();
}

// shin or ankle bells: a strap of small brass bells drawn along a segment, jingling with `shake` (0..1)
export function bellStrap(ctx, x0, y0, x1, y1, n, shake, anim, r = 4.6) {
  ctx.save(); ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, jx = Math.sin(anim * 90 + k * 2.1) * shake * 2.4, jy = Math.cos(anim * 80 + k) * shake * 2.4, x = x0 + (x1 - x0) * t + jx, y = y0 + (y1 - y0) * t + jy;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, x + 1.2, y + 2, r); ctx.fill(); ctx.fillStyle = rgrad(ctx, x - r * 0.3, y - r * 0.3, 0, r * 1.2, [[0, '#fff3b0'], [0.55, '#d4a43a'], [1, '#6a4a14']]); circ(ctx, x, y, r); ctx.fill();
    ctx.strokeStyle = 'rgba(60,36,6,0.85)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - r * 0.6, y + r * 0.1); ctx.lineTo(x + r * 0.6, y + r * 0.1); ctx.stroke(); }
  ctx.restore();
}
void mix; void hgrad; void grain; void hash;

// Orientation: scenes that run along one axis (poles, lines of dancers) are authored in a PORTRAIT frame (x across in -W/2..W/2, y along in 0..H) and
// turned a quarter round on a wide screen. pt maps an authored point to the design box (W x H portrait, H x W wide); apply sets the canvas transform.
export function orient(tall, W, H) {
  if (tall) return { ref: { w: W, h: H }, pt: (x, y) => [x, y], apply: () => {}, face: (a) => a };
  return { ref: { w: H, h: W }, pt: (x, y) => [y - H / 2, -x + W / 2], apply: (ctx) => { ctx.translate(0, W / 2); ctx.rotate(-Math.PI / 2); ctx.translate(0, -H / 2); }, face: (a) => a };
}

// The stage area (the screen rectangle the scene is fitted into) in the scene's design coordinates, so a floor can run to the edges of the play area
// on wide screens instead of stopping at the design box. F.area is in screen (virtual) units, the canvas transform maps virtual units to device pixels
// (scale = devicePixelRatio * fit), so the area goes through the frame's base transform first (1.25.2: before, device pixels were assumed to equal virtual units and a
// backdrop covered only 1/devicePixelRatio of the screen). Falls back to the design box when the context cannot report its transform.
export function areaInDesign(ctx, F, ref) {
  const fb = { x0: -ref.w / 2, y0: 0, x1: ref.w / 2, y1: ref.h };
  try {
    const A = F?.area; if (!A) return fb;
    const cur = ctx.getTransform().inverse(), m = F.base ? cur.multiply(F.base) : cur, pts = [[A.x, A.y], [A.x + A.w, A.y], [A.x, A.y + A.h + (A.bleed ?? 0)], [A.x + A.w, A.y + A.h + (A.bleed ?? 0)]].map(([x, y]) => { const p = m.transformPoint({ x, y }); return [p.x, p.y]; });
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
  } catch { return fb; }
}

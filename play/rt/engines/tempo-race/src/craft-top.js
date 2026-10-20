// Two views of the craft races that are not the low chase camera (tempo-race 1.7.0):
//   map   a top-down river-bend map: the river winds across the screen, boats are seen from above and turned along the stream
//   rear  over the shoulder: the crew's backs in the foreground, the canoe narrowing to the horizon, rivals ahead of you
// Both read the same race state as the chase view (racers {s, lane, lat, v, ph, q, trim, color, me}, obstacles, rough, L, camS).
import { BACKDROPS, noise, clouds } from './craft-world.js';
import { hash, lit, dim, mix, alpha, lg, capsule, arm, SKINS, TAU, clamp, lerp } from './craft-art.js';

const frac = (x) => x - Math.floor(x);
const pick = (a, i) => a[((i % a.length) + a.length) % a.length];

// ============================================================================================================================
// MAP
// ============================================================================================================================
// planform of a boat, origin = hull centre, bow towards +x, S = hull length in px
function hullPts(S, B, k = 2.4) {
  const top = [], bot = [];
  for (let i = 0; i <= 26; i++) { const x = -0.5 + i / 26, hw = B * S * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x) * 2, k)), 0.62); top.push([x * S, -hw]); bot.push([x * S, hw]); }
  return [top, bot.reverse()];
}
function hullPath(ctx, S, B, k) {
  const [a, b] = hullPts(S, B, k);
  ctx.beginPath(); a.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); b.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.closePath();
}
function hullFill(ctx, S, B, base, k) {
  hullPath(ctx, S, B, k);
  ctx.fillStyle = lg(ctx, 0, -B * S, 0, B * S, [[0, lit(base, 0.3)], [0.5, base], [1, dim(base, 0.32)]]); ctx.fill();
  ctx.strokeStyle = dim(base, 0.45); ctx.lineWidth = Math.max(1, S * 0.006); ctx.stroke();
  hullPath(ctx, S * 0.94, B * 0.68, k + 0.4);   // inner hollow
  ctx.fillStyle = lg(ctx, 0, -B * S * 0.7, 0, B * S * 0.7, [[0, dim(base, 0.7)], [1, dim(base, 0.5)]]); ctx.fill();
}
function topHead(ctx, x, y, r, skin, hat, hatCol) {
  ctx.fillStyle = '#1c1410'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  if (hat === 'straw') { ctx.fillStyle = '#d8bb70'; ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#ecd592'; ctx.beginPath(); ctx.arc(x - r * 0.2, y - r * 0.2, r * 1.5, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(120,84,30,0.5)'; ctx.lineWidth = Math.max(1, r * 0.12); ctx.beginPath(); ctx.arc(x, y, r * 1.2, 0, TAU); ctx.stroke(); ctx.fillStyle = hatCol; ctx.beginPath(); ctx.arc(x, y, r * 0.85, 0, TAU); ctx.fill(); }
  else if (hat) { ctx.fillStyle = hatCol; ctx.beginPath(); ctx.arc(x, y, r * 0.98, 0, TAU); ctx.fill(); ctx.fillStyle = lit(hatCol, 0.35); ctx.beginPath(); ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.4, 0, TAU); ctx.fill(); }
  void skin;
}
function topShoulders(ctx, x, y, len, wid, shirt) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = lg(ctx, 0, -wid, 0, wid, [[0, lit(shirt, 0.25)], [1, dim(shirt, 0.3)]]); ctx.beginPath(); ctx.ellipse(0, 0, len, wid, 0, 0, TAU); ctx.fill();
  ctx.restore();
}
function planBoat(ctx, S, st, def) {
  const id = def.id ?? 'x', ph = frac(st.ph / TAU), skin = (i) => pick(SKINS, st.id * 3 + i * 5 + 1);
  const base = st.hull ?? def.hull ?? '#c9a26a', shirt = st.color;
  if (id === 'mokoro') {
    hullFill(ctx, S, 0.085, base, 2.0);
    topShoulders(ctx, S * 0.05, 0, S * 0.026, S * 0.058, lit(shirt, 0.35)); topHead(ctx, S * 0.05, 0, S * 0.03, skin(1), 'wrap', '#f4f0e4');
    ctx.fillStyle = '#c88a3a'; ctx.beginPath(); ctx.ellipse(S * 0.22, 0, S * 0.05, S * 0.04, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#8a5a20'; ctx.lineWidth = 1; ctx.stroke();
    // the poler stands at the stern and pushes a long pole planted beside the hull
    const power = ph < 0.6, k = power ? ph / 0.6 : (ph - 0.6) / 0.4, e = k * k * (3 - 2 * k);
    const px = -S * 0.3, tipX = px + S * (power ? lerp(0.34, -0.32, e) : lerp(-0.32, 0.34, e)), tipY = S * 0.2;
    capsule(ctx, px + S * 0.02, S * 0.05, tipX, tipY, Math.max(2, S * 0.014), '#8a6a40');
    ctx.fillStyle = '#4a3320'; ctx.beginPath(); ctx.arc(tipX, tipY, Math.max(2, S * 0.014), 0, TAU); ctx.fill();
    if (power) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(1, S * 0.006); for (let r = 1; r <= 2; r++) { ctx.beginPath(); ctx.ellipse(tipX, tipY, S * 0.03 * r, S * 0.022 * r, 0, 0, TAU); ctx.stroke(); } }
    topShoulders(ctx, px, 0, S * 0.03, S * 0.07, shirt); topHead(ctx, px, 0, S * 0.034, skin(0), 'straw', shirt);
    return;
  }
  const seats = id === 'ice-canoe' ? 4 : 5;
  if (id === 'outrigger') {   // the float and its two booms first, on the lee side
    ctx.strokeStyle = '#6a4424'; ctx.lineWidth = Math.max(2, S * 0.014); for (const x of [-0.14, 0.17]) { ctx.beginPath(); ctx.moveTo(x * S, 0); ctx.lineTo(x * S + S * 0.02, S * 0.2); ctx.stroke(); }
    ctx.save(); ctx.translate(0, S * 0.2); hullFill(ctx, S * 0.78, 0.035, mix(base, st.color, 0.3), 2.2); ctx.restore();
  }
  hullFill(ctx, S, id === 'voyageur' || id === 'ice-canoe' ? 0.1 : 0.07, base, 2.1);
  for (let i = 0; i < seats; i++) {
    const x = (-0.3 + (0.6 * i) / (seats - 1)) * S, side = id === 'outrigger' ? -1 : i % 2 ? 1 : -1, p2 = frac(ph + (hash(st.id * 11 + i) - 0.5) * 0.06);
    const power = p2 < 0.55, k = power ? p2 / 0.55 : (p2 - 0.55) / 0.45, e = k * k * (3 - 2 * k), sw = (power ? lerp(0.05, -0.05, e) : lerp(-0.05, 0.05, e)) * S;
    const sh = id === 'voyageur' ? pick(['#c8372d', '#f4f0e4', '#2a5da8', '#e8b84a'], i + st.id) : lit(shirt, i % 2 ? 0.15 : 0);
    const tip = [x + sw, side * S * 0.17];
    capsule(ctx, x, side * S * 0.03, tip[0], tip[1], Math.max(1.5, S * 0.008), '#d9b57a');
    ctx.save(); ctx.translate(tip[0], tip[1]); ctx.rotate(Math.PI / 2); ctx.fillStyle = st.color; ctx.beginPath(); ctx.ellipse(0, 0, S * 0.022, S * 0.05, 0, 0, TAU); ctx.fill(); ctx.restore();
    if (power) { ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = Math.max(1, S * 0.005); ctx.beginPath(); ctx.ellipse(tip[0] - S * 0.02, tip[1] + side * S * 0.01, S * 0.03, S * 0.016, 0, 0, TAU); ctx.stroke(); }
    topShoulders(ctx, x, 0, S * 0.026, S * 0.058, sh); topHead(ctx, x, 0, S * 0.03, skin(i), i % 2 ? 'band' : 'cap', i % 2 ? '#c8372d' : lit(shirt, 0.25));
  }
}
function planWake(ctx, S, v, t) {
  if (v < 0.08) return;
  const L = S * (0.35 + 0.5 * v), spread = S * 0.16 * (0.5 + v);
  ctx.lineCap = 'round';
  for (const sg of [-1, 1]) { ctx.strokeStyle = `rgba(255,255,255,${0.2 * Math.min(1, v * 1.4)})`; ctx.lineWidth = Math.max(1.2, S * 0.008); ctx.beginPath(); ctx.moveTo(-S * 0.5, sg * S * 0.04); ctx.lineTo(-S * 0.5 - L, sg * spread); ctx.stroke(); ctx.lineWidth = Math.max(1, S * 0.006); ctx.beginPath(); ctx.moveTo(-S * 0.5, sg * S * 0.04); ctx.lineTo(-S * 0.5 - L * 0.8, sg * spread * 0.6); ctx.stroke(); }
  for (let k = 0; k < 12; k++) { const f = k / 12; ctx.fillStyle = `rgba(255,255,255,${(1 - f) * 0.45 * Math.min(1, v * 1.5)})`; ctx.beginPath(); ctx.ellipse(-S * 0.5 - f * L * 0.9, Math.sin(t * 3 + k) * S * 0.012, S * 0.045 * (1 - f * 0.4), S * 0.013, 0, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = Math.max(1, S * 0.006); ctx.beginPath(); ctx.arc(S * 0.5, 0, S * 0.05 + v * S * 0.03, -1.1, 1.1); ctx.stroke();
}

export function drawMap(ctx, V0, o) {
  const { x: x0, y: y0, w, h } = V0, W = o.craft.world, def = o.craft.def, t = o.t, camS = o.camS;
  const horiz = w / h > 1.4, along = horiz ? w : h, cross = horiz ? h : w;
  const mine = o.racers.find((r) => r.me);
  const S = Math.min(cross * 0.4, along * 0.3), ppm = S / def.len;
  const Wr = cross * (horiz ? 0.6 : 0.74), A = cross * 0.12, Lw = S * 7.5;
  const aCam = camS * ppm, aAnch = horiz ? w * 0.3 : h * 0.66;
  const c0 = (a) => A * (Math.sin((a / Lw) * TAU) + 0.5 * Math.sin((a / Lw) * TAU * 2.3 + 1.3));
  const P = (a, c) => (horiz ? [x0 + aAnch + (a - aCam), y0 + cross / 2 + c] : [x0 + cross / 2 + c, y0 + aAnch - (a - aCam)]);
  const aLo = aCam - (horiz ? aAnch : along - aAnch) - 30, aHi = aCam + (horiz ? along - aAnch : aAnch) + 30;
  const dirAt = (a) => { const d = (c0(a + 2) - c0(a - 2)) / 4; return horiz ? Math.atan2(d, 1) : Math.atan2(-1, d); };
  const G = W.ground ?? ['#5b7b3a', '#3d5c2a'];
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
  ctx.fillStyle = lg(ctx, x0, y0, x0 + w * 0.3, y0 + h, [[0, G[0]], [1, G[1]]]); ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = 'rgba(20,50,20,0.22)'; ctx.lineWidth = 1.2;
  for (let k = 0; k < 160; k++) { const a = aLo + ((hash(k * 3) * (aHi - aLo)) % (aHi - aLo)), ca = (hash(k * 7) - 0.5) * cross * 1.3; const [sx, sy] = P(Math.round(a / 40) * 40 + hash(k) * 30, ca); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 2, sy - 5); ctx.stroke(); }
  // trees (top-down canopies) on both banks, fixed in the world
  const cell = S * 0.34, i0 = Math.floor(aLo / cell), i1 = Math.ceil(aHi / cell);
  for (let i = i0; i <= i1; i++) for (let j = 0; j < 3; j++) for (const side of [-1, 1]) {
    const hh = hash(i * 13 + j * 5 + (side > 0 ? 71 : 3)); if (hh < 0.18) continue;
    const a = (i + hash(i * 3 + j + side * 9)) * cell, c = c0(a) + side * (Wr / 2 + cell * 0.45 + hash(i * 7 + j * 11 + side) * cross * 0.34), r = cell * (0.55 + hash(i * 5 + j * 17) * 0.55), hv = hash(i + j * 31 + side);
    const [sx, sy] = P(a, c); if (sx < x0 - r * 2 || sx > x0 + w + r * 2 || sy < y0 - r * 2 || sy > y0 + h + r * 2) continue;
    ctx.fillStyle = 'rgba(8,24,10,0.35)'; ctx.beginPath(); ctx.arc(sx + r * 0.3, sy + r * 0.38, r * 1.02, 0, TAU); ctx.fill();
    const col = mix('#2f5a2a', '#6a8a30', hv); ctx.fillStyle = dim(col, 0.2); ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(sx - r * 0.12, sy - r * 0.14, r * 0.82, 0, TAU); ctx.fill();
    ctx.fillStyle = lit(col, 0.28); ctx.beginPath(); ctx.arc(sx - r * 0.28, sy - r * 0.3, r * 0.42, 0, TAU); ctx.fill();
  }
  // the river: banks, shallows, water
  const step = 9, pts = [];
  for (let a = aLo; a <= aHi + step; a += step) { const cc = c0(a), wl = Wr / 2 * (1 + 0.07 * noise(a * 0.011, 3)), wr = Wr / 2 * (1 + 0.07 * noise(a * 0.011, 8)); pts.push([a, cc - wl, cc + wr, cc]); }
  const edge = (side) => pts.map((p) => P(p[0], side < 0 ? p[1] : p[2]));
  const river = () => { const L = edge(-1), R = edge(1).reverse(); ctx.beginPath(); L.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); R.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.closePath(); };
  river(); ctx.lineWidth = 16; ctx.strokeStyle = '#a89868'; ctx.lineJoin = 'round'; ctx.stroke(); ctx.lineWidth = 7; ctx.strokeStyle = '#d5c88e'; ctx.stroke();
  const MW = W.mapWater ?? [mix(W.water[1], '#ffffff', 0.28), W.water[1], W.water[2]];
  river(); ctx.fillStyle = MW[0]; ctx.fill();
  ctx.save(); river(); ctx.clip();
  for (const [wd, col] of [[Wr * 0.62, alpha(MW[1], 0.6)], [Wr * 0.3, alpha(MW[2], 0.4)]]) { ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.lineJoin = 'round'; ctx.lineCap = 'butt'; ctx.beginPath(); pts.forEach((p, i) => { const [x, y] = P(p[0], p[3]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); }
  for (const rg of o.rough ?? []) {   // a shoal where the sand shows through
    const a0 = rg.from * ppm, a1 = rg.to * ppm; if (a1 < aLo || a0 > aHi) continue;
    ctx.fillStyle = 'rgba(236,214,150,0.5)'; ctx.beginPath(); const q = []; for (let a = Math.max(a0, aLo); a <= Math.min(a1, aHi); a += step) q.push(P(a, c0(a) - Wr)); for (let a = Math.min(a1, aHi); a >= Math.max(a0, aLo); a -= step) q.push(P(a, c0(a) + Wr)); q.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill();
    for (let k = 0; k < 60; k++) { const a = lerp(a0, a1, hash(k * 3)), [sx, sy] = P(a, c0(a) + (hash(k * 5) - 0.5) * Wr); ctx.fillStyle = k % 2 ? 'rgba(255,248,214,0.7)' : 'rgba(150,120,70,0.5)'; ctx.beginPath(); ctx.arc(sx, sy, 1.6 + hash(k) * 2.2, 0, TAU); ctx.fill(); }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.24)'; ctx.lineWidth = 1.6; ctx.setLineDash([16, 30]);   // flow lines
  const aS = Math.floor(aLo / 46) * 46;
  for (const f of [-0.34, -0.1, 0.16, 0.36]) { ctx.lineDashOffset = ((aS - aLo) % 46) + t * 5; ctx.beginPath(); for (let a = aS; a <= aHi; a += step) { const [x, y] = P(a, c0(a) + f * Wr); a === aS ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
  ctx.setLineDash([]);
  for (let i = i0; i <= i1; i++) for (let j = 0; j < 2; j++) {   // lilies
    const hh = hash(i * 19 + j * 7 + 400); if (hh < 0.4) continue;
    const a = (i + hash(i * 3 + j)) * cell, c = c0(a) + (hash(i * 5 + j * 3) - 0.5) * Wr * 0.85, r = cell * (0.1 + hash(i * 11 + j) * 0.16), [sx, sy] = P(a, c);
    ctx.fillStyle = hh > 0.6 ? '#3f7a34' : '#58903c'; ctx.beginPath(); ctx.arc(sx, sy, r, 0.4, TAU - 0.1); ctx.lineTo(sx, sy); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(sx - r * 0.2, sy - r * 0.2, r * 0.5, 0, TAU); ctx.fill();
    if (hh > 0.8) { ctx.fillStyle = '#f2a6c4'; for (let q = 0; q < 6; q++) { const an = q * 1.047; ctx.beginPath(); ctx.arc(sx + Math.cos(an) * r * 0.28, sy + Math.sin(an) * r * 0.28, r * 0.2, 0, TAU); ctx.fill(); } ctx.fillStyle = '#ffe58a'; ctx.beginPath(); ctx.arc(sx, sy, r * 0.14, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
  for (let k = 0; k < (aHi - aLo) / 18; k++) {   // reeds along both banks
    const a = aLo + k * 18 + hash(k * 7) * 12, side = hash(k * 3) > 0.5 ? 1 : -1, hh = hash(k * 11); if (hh < 0.35) continue;
    const p = pts[Math.min(pts.length - 1, Math.max(0, Math.round((a - aLo) / step)))], c = side < 0 ? p[1] : p[2]; const [sx, sy] = P(a, c + side * 3);
    ctx.strokeStyle = hh > 0.7 ? '#8aa84a' : '#4f7a2e'; ctx.lineWidth = 1.5; for (let q = 0; q < 5; q++) { const an = -1.2 + q * 0.6 + hash(k + q) * 0.3; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(an) * 9 * (0.6 + hh), sy + Math.sin(an) * 9 * (0.6 + hh)); ctx.stroke(); }
  }
  const lanes = [...new Set(o.racers.map((r) => r.lane))].sort((a, b) => a - b), nl = Math.max(1, lanes.length);
  const laneC = (lane) => ((lanes.indexOf(lane) - (nl - 1) / 2) / Math.max(1, nl - 1 + 0.6)) * Wr * 0.74;
  const across = (s, col, post) => {
    const a = s * ppm; if (a < aLo - 40 || a > aHi + 40) return; const cc = c0(a), [ax, ay] = P(a, cc - Wr * 0.54), [bx, by] = P(a, cc + Wr * 0.54);
    const n = 14, dx = (bx - ax) / n, dy = (by - ay) / n;
    for (let i = 0; i < n; i++) { ctx.strokeStyle = i % 2 ? '#fff' : (post ? '#1a1a1a' : 'rgba(255,255,255,0.4)'); ctx.lineWidth = post ? 9 : 5; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(ax + dx * i, ay + dy * i); ctx.lineTo(ax + dx * (i + 1), ay + dy * (i + 1)); ctx.stroke(); }
    if (post) for (const [px, py] of [[ax, ay], [bx, by]]) { ctx.fillStyle = '#5a3a1e'; ctx.beginPath(); ctx.arc(px, py, 7, 0, TAU); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 22, py - 8 + Math.sin(t * 5) * 3); ctx.lineTo(px + 2, py - 18); ctx.fill(); }
  };
  across(0, '#fff', false); across(o.L, '#e8453a', true);
  for (const ob of o.obstacles ?? []) {
    const a = ob.at * ppm; if (a < aLo - 30 || a > aHi + 30) continue; const passed = mine && ob.at < mine.s && !o.title;
    for (const ln of lanes) {
      const [sx, sy] = P(a, c0(a) + laneC(ln)); ctx.globalAlpha = passed ? 0.4 : 1;
      if (ob.kind === 'waves' || ob.kind === 'rapids') { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.4; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(sx + (horiz ? i * 6 : 0), sy + (horiz ? 0 : i * 6), 11, 0, Math.PI); ctx.stroke(); } }
      else if (ob.kind === 'log' || ob.kind === 'hurdle') {
        const ang = dirAt(a) + Math.PI / 2; ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang + 0.15 * (hash(ln * 5) - 0.5)); const len = (Wr / nl) * 0.55;
        ctx.fillStyle = 'rgba(0,20,30,0.3)'; ctx.fillRect(-len / 2 + 3, -1, len, 12); ctx.fillStyle = '#6a4424'; ctx.fillRect(-len / 2, -6, len, 12); ctx.fillStyle = '#8a6034'; ctx.fillRect(-len / 2, -6, len, 4);
        ctx.fillStyle = '#c9a070'; ctx.beginPath(); ctx.ellipse(len / 2, 0, 3, 6, 0, 0, TAU); ctx.fill(); ctx.restore();
      } else { ctx.fillStyle = 'rgba(0,20,30,0.3)'; ctx.beginPath(); ctx.arc(sx + 2, sy + 3, 8, 0, TAU); ctx.fill(); ctx.fillStyle = lanes.indexOf(ln) % 2 ? '#e8453a' : '#f2c14e'; ctx.beginPath(); ctx.arc(sx, sy, 8, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx, sy, 3.4, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
  }
  const list = [...o.racers].sort((a, b) => (a.me ? 1 : 0) - (b.me ? 1 : 0) || a.s - b.s);
  for (const rc of list) {
    const a = rc.s * ppm, c = c0(a) + laneC(rc.lane) + (rc.lat ?? 0) * Wr * 0.12, [sx, sy] = P(a, c), th = dirAt(a) + (rc.lat ?? 0) * 0.15;
    if (sx < x0 - S || sx > x0 + w + S || sy < y0 - S || sy > y0 + h + S) continue;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(th);
    planWake(ctx, S, rc.v ?? 0, t);
    ctx.save(); ctx.translate(S * 0.03, S * 0.05); ctx.globalAlpha = 0.28; hullPath(ctx, S, 0.085, 2.0); ctx.fillStyle = '#021a22'; ctx.fill(); ctx.restore();
    if (rc.me) { ctx.setLineDash([S * 0.06, S * 0.05]); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, S * 0.62, S * 0.2, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
    planBoat(ctx, S, { t, ph: rc.ph ?? 0, v: rc.v ?? 0, color: rc.color, id: rc.id ?? 0, hull: o.craft.hull }, { ...def, id: o.craft.id });
    ctx.restore();
  }
  const vg = ctx.createRadialGradient(x0 + w / 2, y0 + h * 0.55, Math.min(w, h) * 0.45, x0 + w / 2, y0 + h * 0.55, Math.max(w, h) * 0.8); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,10,0,0.38)'); ctx.fillStyle = vg; ctx.fillRect(x0, y0, w, h);
  ctx.restore();
  return { S1: S, ppm, hz: y0, bot: y0 + h };
}

// ============================================================================================================================
// REAR
// ============================================================================================================================
// Perspective: camera on the axis of the hero canoe, CH metres above the water, looking along the course.
// A point at (lateral x m, height y m, distance z m) is at sx = cx + f*x/z, sy = hz + f*(CH - y)/z.
const CH = 3.1;

function rearHead(ctx, x, y, r, skin, hat, hatCol) {
  ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(x, y + r * 0.9, r * 0.5, r * 0.45, 0, 0, TAU); ctx.fill();   // neck
  ctx.fillStyle = '#1c1410'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(x - r * 1.0, y + r * 0.1, r * 0.16, r * 0.26, 0, 0, TAU); ctx.ellipse(x + r * 1.0, y + r * 0.1, r * 0.16, r * 0.26, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.4, 0, TAU); ctx.fill();
  if (hat === 'band') { ctx.fillStyle = hatCol; ctx.fillRect(x - r, y - r * 0.45, r * 2, r * 0.3); }
  else if (hat === 'cap') { ctx.fillStyle = hatCol; ctx.beginPath(); ctx.arc(x, y - r * 0.1, r * 1.04, Math.PI * 1.02, Math.PI * 1.98); ctx.closePath(); ctx.fill(); ctx.fillStyle = lit(hatCol, 0.3); ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.6, r * 0.28, 0, TAU); ctx.fill(); }
  else if (hat === 'wrap') { ctx.fillStyle = hatCol; ctx.beginPath(); ctx.ellipse(x, y - r * 0.25, r * 1.12, r * 0.85, 0, Math.PI, TAU); ctx.fill(); }
}

// one paddler seen from behind. (hx,hy) hip centre on the seat, u = pixels per metre at this depth. Returns the blade tip.
function rearPaddler(ctx, hx, hy, u, phi, o) {
  const power = phi < 0.55, k = power ? phi / 0.55 : (phi - 0.55) / 0.45, e = k * k * (3 - 2 * k);
  const reach = power ? lerp(0.9, -0.5, e) : lerp(-0.5, 0.9, e);          // blade travel along the hull, forward positive (m)
  const lift = power ? 0 : 0.35 * Math.sin(Math.PI * k);                   // blade height clear of the water on the recovery
  const side = o.side ?? 1;
  const shY = hy - u * 0.62, shx = hx, shW = u * 0.27;
  const tipX = hx + side * u * 0.82, tipY = hy + u * 0.28 - reach * u * 0.07 - u * lift * 0.8;
  const topX = hx + side * u * 0.22, topY = shY - u * 0.5 - u * reach * 0.06;
  ctx.fillStyle = dim(o.shirt, 0.55); ctx.fillRect(hx - u * 0.22, hy - u * 0.12, u * 0.44, u * 0.18);   // hips
  const lw = u * 0.2;
  ctx.fillStyle = lg(ctx, hx - shW, 0, hx + shW, 0, [[0, dim(o.shirt, 0.28)], [0.55, o.shirt], [1, lit(o.shirt, 0.2)]]);
  ctx.beginPath(); ctx.moveTo(hx - lw, hy - u * 0.08); ctx.lineTo(shx - shW, shY + u * 0.05); ctx.quadraticCurveTo(shx, shY - u * 0.12, shx + shW, shY + u * 0.05); ctx.lineTo(hx + lw, hy - u * 0.08); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = Math.max(1, u * 0.012); ctx.beginPath(); ctx.moveTo(hx, shY + u * 0.12); ctx.lineTo(hx, hy - u * 0.08); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.ellipse(hx - u * 0.1, shY + u * 0.22, u * 0.07, u * 0.12, 0.3, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(hx + u * 0.1, shY + u * 0.22, u * 0.07, u * 0.12, -0.3, 0, TAU); ctx.fill();
  rearHead(ctx, hx, shY - u * 0.3, u * 0.17, o.skin, o.hat, o.hatCol);
  capsule(ctx, topX, topY, tipX, tipY, Math.max(1.5, u * 0.05), o.wood ?? '#d9b57a');
  const angle = Math.atan2(tipY - topY, tipX - topX);
  ctx.save(); ctx.translate(tipX, tipY); ctx.rotate(angle); ctx.fillStyle = lg(ctx, 0, -u * 0.1, 0, u * 0.1, [[0, dim(o.blade, 0.25)], [0.5, lit(o.blade, 0.15)], [1, dim(o.blade, 0.2)]]); ctx.beginPath(); ctx.ellipse(u * 0.06, 0, u * 0.28, u * 0.1, 0, 0, TAU); ctx.fill(); ctx.restore();
  const hand1 = [topX, topY], hand2 = [hx + side * u * 0.5, shY + u * 0.42];
  arm(ctx, shx + side * shW * 0.95, shY + u * 0.06, hand2[0], hand2[1], u * 0.1, o.sleeve ?? o.shirt, o.skin, side, u * 0.55);
  arm(ctx, shx - side * shW * 0.95, shY + u * 0.06, hand1[0], hand1[1], u * 0.1, o.sleeve ?? o.shirt, o.skin, -side, u * 0.55);
  return [tipX, tipY];
}

export function drawRear(ctx, V0, o) {
  const { x: x0, y: y0, w, h } = V0, W = o.craft.world, def = o.craft.def, t = o.t, camS = o.camS;
  const wide = w / h > 1.4;
  const hz = y0 + h * (wide ? 0.3 : 0.34), f = h * (wide ? 0.74 : 0.6), cx = x0 + w * 0.5;
  const Y = (z, yy) => hz + (f * (CH - yy)) / z, X = (z, xx) => cx + (f * xx) / z, U = (z) => f / z;
  const mine = o.racers.find((r) => r.me) ?? o.racers[0];
  const bot = y0 + h;
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
  const sg = ctx.createLinearGradient(0, y0, 0, hz); sg.addColorStop(0, W.sky[0]); sg.addColorStop(1, W.sky[1]); ctx.fillStyle = sg; ctx.fillRect(x0, y0, w, hz - y0 + 1);
  const sx = x0 + w * (1 - W.sun.x), sy = hz - (hz - y0) * W.sun.y * 0.7, sr = Math.min(w, h) * W.sun.r;
  const sgl = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 7); sgl.addColorStop(0, alpha(W.sun.c, 0.75)); sgl.addColorStop(0.15, alpha(W.sun.c, 0.35)); sgl.addColorStop(1, alpha(W.sun.c, 0));
  ctx.fillStyle = sgl; ctx.fillRect(x0, y0, w, hz - y0 + 1); ctx.fillStyle = W.sun.c; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();
  const bd = { x0, w, hz, H: Math.min(h * 0.2, hz - y0 - 12), t, off: camS * 30, h };
  clouds(ctx, bd, w, W.clouds, t);
  (BACKDROPS[W.backdrop] ?? BACKDROPS.cays)(ctx, bd, W);
  const hh = ctx.createLinearGradient(0, hz - bd.H * 0.35, 0, hz + 3); hh.addColorStop(0, alpha(W.haze, 0)); hh.addColorStop(1, alpha(W.haze, 0.55)); ctx.fillStyle = hh; ctx.fillRect(x0, hz - bd.H * 0.35, w, bd.H * 0.35 + 3);
  const wg = ctx.createLinearGradient(0, hz, 0, bot); wg.addColorStop(0, W.water[0]); wg.addColorStop(0.35, W.water[1]); wg.addColorStop(1, W.water[2]); ctx.fillStyle = wg; ctx.fillRect(x0, hz, w, bot - hz);
  const pg = ctx.createLinearGradient(sx, hz, sx, bot); pg.addColorStop(0, alpha(W.sun.c, 0.28)); pg.addColorStop(1, alpha(W.sun.c, 0)); ctx.fillStyle = pg; ctx.beginPath(); ctx.moveTo(sx - sr * 0.8, hz); ctx.lineTo(sx + sr * 0.8, hz); ctx.lineTo(cx + (sx - cx) * 2 + w * 0.3, bot); ctx.lineTo(cx + (sx - cx) * 2 - w * 0.3, bot); ctx.closePath(); ctx.fill();
  // crests rolling towards the camera
  const flow = camS * 0.05 + t * 0.04;
  for (let k = 0; k < 34; k++) {
    const d = frac(k / 34 + flow), z = 2.2 + 70 * d * d * d, y = Y(z, 0), sc = U(z) * 0.02; if (y > bot + 4) continue;
    const row = Math.floor(k / 34 + flow);
    for (let j = 0; j < 9; j++) {
      const hhh = hash(k * 31 + j * 7 + row * 5); if (hhh < 0.3) continue;
      const wx = (j - 4 + (hhh - 0.5) * 1.4) * 5.2, L = (0.6 + hhh) * 3, px = X(z, wx), len = Math.max(2, U(z) * L * 0.5);
      const near = Math.abs(px - sx) < w * 0.14 * (0.5 + y / h);
      ctx.strokeStyle = alpha(near ? W.sun.c : '#fff', (0.1 + 0.3 * hhh) * clamp(sc * 12, 0.2, 1) + (near ? 0.18 : 0)); ctx.lineWidth = Math.max(1, sc * 14); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(px, y); ctx.quadraticCurveTo(px + len / 2, y - sc * 20 - 1, px + len, y); ctx.stroke();
    }
  }
  const inRough = (o.rough ?? []).some((rg) => mine.s >= rg.from - 6 && mine.s <= rg.to);
  if (inRough) for (let k = 0; k < 30; k++) { const d = frac(hash(k) + flow * 6), z = 3 + 40 * d * d, px = X(z, (hash(k * 3) - 0.5) * 22), y = Y(z, 0); ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - d)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, y, U(z) * 0.35, 3.4, 6); ctx.stroke(); }
  const zOf = (gap) => 13 + gap * 0.9;
  const ahead = [];
  if (o.L - mine.s > -4) ahead.push({ k: 'fin', gap: o.L - mine.s });
  for (const ob of o.obstacles ?? []) if (ob.at - mine.s > -2 && ob.at - mine.s < 50 && !o.title) ahead.push({ k: ob.kind, gap: ob.at - mine.s });
  const lanes = [...new Set(o.racers.map((r) => r.lane))].sort((a, b) => a - b), myLane = mine.lane;
  const latOf = (lane) => (lane - myLane) * 3.2;
  const items = [];
  for (const rc of o.racers) { const gap = rc.s - mine.s; items.push({ type: 'boat', rc, z: rc.me ? 2.0 : Math.max(2.4, zOf(gap) - 6), lat: rc.me ? (rc.lat ?? 0) * 0.5 : latOf(rc.lane) + (rc.lat ?? 0) * 1.2 }); }
  for (const a of ahead) items.push({ type: a.k, z: zOf(a.gap) + 2, gap: a.gap });
  items.sort((a, b) => b.z - a.z);
  const cid = o.craft.id, hullH = def.rearHull ?? { hw: cid === 'voyageur' ? 0.52 : cid === 'ice-canoe' ? 0.5 : cid === 'dugout' ? 0.55 : 0.32, len: 11 };
  for (const it of items) {
    if (it.type === 'boat') drawRearBoat(ctx, it, { X, Y, U, def, o, hullH, w });
    else if (it.type === 'fin') {
      const z = it.z, top = 3.4;
      if (z > 90) continue;
      for (const g of [-7, 7]) { ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = Math.max(2, U(z) * 0.22); ctx.beginPath(); ctx.moveTo(X(z, g), Y(z, 0)); ctx.lineTo(X(z, g), Y(z, top)); ctx.stroke(); }
      const n = 16; for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#fff' : '#1a1a1a'; const xa = lerp(-7, 7, i / n), xb = lerp(-7, 7, (i + 1) / n), ya = top - j * 0.45, yb = top - (j + 1) * 0.45; ctx.beginPath(); ctx.moveTo(X(z, xa), Y(z, ya)); ctx.lineTo(X(z, xb), Y(z, ya)); ctx.lineTo(X(z, xb), Y(z, yb)); ctx.lineTo(X(z, xa), Y(z, yb)); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(X(z, -7), Y(z, 0) - 1, X(z, 7) - X(z, -7), 2);
    } else if (it.type === 'log' || it.type === 'hurdle') {
      for (const ln of lanes) { const z = it.z, px = X(z, latOf(ln)), py = Y(z, 0), s = U(z); ctx.fillStyle = '#6a4424'; ctx.beginPath(); ctx.ellipse(px, py - s * 0.05, s * 1.1, s * 0.12, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#8a6034'; ctx.beginPath(); ctx.ellipse(px, py - s * 0.12, s * 0.9, s * 0.05, 0, 0, TAU); ctx.fill(); }
    } else if (it.type === 'waves' || it.type === 'rapids' || it.type === 'snowdrift') {
      for (let i = 0; i < 12; i++) { const z = it.z - 1 + (i % 3) * 0.6, px = X(z, (i - 5.5) * 1.7), py = Y(z, 0); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(1.5, U(z) * 0.07); ctx.beginPath(); ctx.arc(px, py - U(z) * 0.03, U(z) * 0.45, 3.3, 6.1); ctx.stroke(); }
    } else {
      for (const ln of lanes) { const z = it.z, px = X(z, latOf(ln) + 1.6), py = Y(z, 0), s = U(z); ctx.strokeStyle = '#4a3320'; ctx.lineWidth = Math.max(1.5, s * 0.05); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - s * 1.1); ctx.stroke(); ctx.fillStyle = lanes.indexOf(ln) % 2 ? '#e8453a' : '#f2c14e'; ctx.beginPath(); ctx.moveTo(px, py - s * 1.1); ctx.lineTo(px + s * 0.55, py - s * 0.95); ctx.lineTo(px, py - s * 0.8); ctx.fill(); ctx.beginPath(); ctx.ellipse(px, py - s * 0.1, s * 0.22, s * 0.2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(px - s * 0.22, py - s * 0.13, s * 0.44, s * 0.05); }
    }
  }
  const vg = ctx.createLinearGradient(0, y0 + h * 0.8, 0, bot); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,10,20,0.28)'); ctx.fillStyle = vg; ctx.fillRect(x0, y0 + h * 0.8, w, h * 0.2);
  const vt = ctx.createLinearGradient(0, y0, 0, y0 + h * 0.25); vt.addColorStop(0, 'rgba(0,10,25,0.34)'); vt.addColorStop(1, 'rgba(0,10,25,0)'); ctx.fillStyle = vt; ctx.fillRect(x0, y0, w, h * 0.25);
  ctx.restore();
  return { S1: f, ppm: 1, hz, bot };
}

// a canoe seen from behind: its hull narrowing away, a row of backs, paddles dipping on one side, a float on the other
function drawRearBoat(ctx, it, G) {
  const { X, Y, U, def, o, hullH, w } = G, rc = it.rc, z0 = it.z, lat = it.lat, id = o.craft.id;
  const seatsN = id === 'ice-canoe' ? 4 : 5, spacing = 1.45, len = hullH.len, hw = hullH.hw;
  const hullCol = o.craft.hull ?? def.hull ?? '#f4efe4';
  const zS = z0 - 0.6, zB = z0 + len - 1;
  if (zS > 90) return;
  const v = clamp(rc.v ?? 0, 0, 1.05);
  if (X(z0, lat) < -w * 0.5 || X(z0, lat) > w * 1.5) return;
  const col = rc.color;
  const half = (z) => hw * (z > zB - 2.2 ? 0.2 + (0.8 * (zB - z)) / 2.2 : z < zS + 0.8 ? 0.7 + (0.3 * (z - zS)) / 0.8 : 1);
  const edge = (side, yy, zz) => [X(zz, lat + side * half(zz)), Y(zz, yy)];
  const K = 14;
  const strip = (yTop, yBot, fill) => { ctx.beginPath(); for (let i = 0; i <= K; i++) { const z = lerp(zS, zB, i / K), [x, y] = edge(-1, yTop, z); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } for (let i = K; i >= 0; i--) { const z = lerp(zS, zB, i / K), [x, y] = edge(1, yBot, z); ctx.lineTo(x, y); } ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };
  for (const sg of [-1, 1]) for (let k = 0; k < 8; k++) { const z = lerp(zS + 0.5, zB - 1, k / 8), px = X(z, lat + sg * (half(z) + 0.1 + 0.05 * k * v)), py = Y(z, 0); ctx.fillStyle = `rgba(255,255,255,${0.1 + 0.3 * v * (1 - k / 10)})`; ctx.beginPath(); ctx.ellipse(px, py, Math.max(2, U(z) * (0.18 + 0.05 * k * v)), Math.max(1, U(z) * 0.045), 0, 0, TAU); ctx.fill(); }
  if (id === 'outrigger') {   // the float on the left, with two booms
    const fl = lat - 1.7, z1 = zS + 1.5, z2 = zB - 2, hf = (i) => 0.12 * Math.sin(Math.PI * (0.1 + (0.8 * i) / 10)) + 0.03;
    ctx.fillStyle = mix(hullCol, col, 0.35); ctx.beginPath(); for (let i = 0; i <= 10; i++) { const z = lerp(z1, z2, i / 10); i ? ctx.lineTo(X(z, fl - hf(i)), Y(z, 0.1)) : ctx.moveTo(X(z, fl - hf(i)), Y(z, 0.1)); } for (let i = 10; i >= 0; i--) { const z = lerp(z1, z2, i / 10); ctx.lineTo(X(z, fl + hf(i)), Y(z, 0.1)); } ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1, U(z0) * 0.02); ctx.stroke();
    for (const zb of [zS + 3.2, zS + 6.6]) { ctx.strokeStyle = '#6a4424'; ctx.lineWidth = Math.max(2, U(zb) * 0.07); ctx.beginPath(); ctx.moveTo(X(zb, lat), Y(zb, 0.4)); ctx.lineTo(X(zb, fl), Y(zb, 0.18)); ctx.stroke(); ctx.strokeStyle = '#c9a56a'; ctx.lineWidth = Math.max(1, U(zb) * 0.025); ctx.stroke(); }
  }
  strip(0.5, 0.0, dim(hullCol, 0.22));      // outside of the hull, between gunwale and waterline
  strip(0.5, 0.5, mix(dim(hullCol, 0.7), '#4a2c14', 0.45));      // dark wooden floor between the gunwales
  for (let i = 0; i < seatsN; i++) { const z = z0 + 0.4 + i * spacing, hwz = half(z) * 0.98; ctx.strokeStyle = lit('#8a5a30', 0.1); ctx.lineWidth = Math.max(1.5, U(z) * 0.07); ctx.beginPath(); ctx.moveTo(X(z, lat - hwz), Y(z, 0.3)); ctx.lineTo(X(z, lat + hwz), Y(z, 0.3)); ctx.stroke(); }
  for (const sg of [-1, 1]) { ctx.strokeStyle = sg < 0 ? lit(hullCol, 0.15) : lit(hullCol, 0.4); ctx.lineWidth = Math.max(1.5, U(z0) * 0.055); ctx.beginPath(); for (let i = 0; i <= K; i++) { const z = lerp(zS, zB, i / K), [x, y] = edge(sg, 0.5, z); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
  ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, U(z0) * 0.035); ctx.beginPath(); for (let i = 0; i <= K; i++) { const z = lerp(zS, zB, i / K), [x, y] = edge(1, 0.25, z); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  const tips = [];
  for (let i = seatsN - 1; i >= 0; i--) {   // the paddler farthest from the camera first
    const z = z0 + 1.1 + i * spacing, u = U(z), hx = X(z, lat), hy = Y(z, 0.32);
    const p = frac(rc.ph / TAU + (hash((rc.id ?? 0) * 17 + i) - 0.5) * 0.06);
    const shirt = id === 'voyageur' ? pick(['#c8372d', '#f4f0e4', '#2a5da8', '#e8b84a'], i + (rc.id ?? 0)) : lit(col, i % 2 ? 0.14 : 0);
    const tip = rearPaddler(ctx, hx, hy, u, p, { skin: pick(SKINS, (rc.id ?? 0) * 3 + i * 5 + 1), shirt, hat: i % 2 ? 'band' : 'cap', hatCol: i % 2 ? '#c8372d' : lit(col, 0.3), blade: id === 'ice-canoe' ? '#e8eef4' : col, side: 1 });
    tips.push([tip, p, u]);
  }
  for (const [[tx, ty], p, u] of tips) {   // splashes where the blades are in the water
    if (p < 0.5) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(1, u * 0.03); ctx.beginPath(); ctx.ellipse(tx, ty + u * 0.02, u * 0.34, u * 0.08, 0, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(tx, ty + u * 0.02, u * 0.18, u * 0.04, 0, 0, TAU); ctx.fill(); }
    else if (p < 0.75) for (let d = 0; d < 5; d++) { const e = (p - 0.5) / 0.25; ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - e)})`; ctx.beginPath(); ctx.arc(tx + (hash(d * 5) - 0.3) * u * 0.5, ty - e * u * (0.2 + hash(d) * 0.3) + e * e * u * 0.2, Math.max(1, u * 0.025), 0, TAU); ctx.fill(); }
  }
  { const zz = zB, px = X(zz, lat), py = Y(zz, 0); ctx.strokeStyle = `rgba(255,255,255,${0.35 + 0.4 * v})`; ctx.lineWidth = Math.max(1, U(zz) * 0.04); ctx.beginPath(); ctx.ellipse(px, py, U(zz) * (0.3 + 0.2 * v), U(zz) * 0.05, 0, Math.PI, TAU); ctx.stroke(); }
}

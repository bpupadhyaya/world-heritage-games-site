// The "street" setting (1.5.0): a city block seen down the road. Brick tenements with fire escapes and stoops flank the lane,
// cars are parked at the curb, lamps line the pavement, and a cross building closes the far end. Also the flat manhole cover and the
// hydrant props. Pure canvas, deterministic (hash-based), no assets. Day by default; `look.street.dusk` lights the windows.
import { mix, dark, light, alpha, vgrad, poly, clamp, hash } from './scenery.js';

const TAU = Math.PI * 2;
const BRICKS = ['#9a4a38', '#8d5a42', '#a8664a', '#7e4a44', '#b07a56', '#6f4f46'];
const CARS = ['#2f5f9a', '#b8362e', '#d9d4c4', '#3a3f48', '#4a7a5a', '#c89a2a', '#7a3a58'];

export const streetOpts = (LK = {}) => {
  const S = LK.street ?? {};
  return {
    dusk: !!S.dusk, gutter: S.gutter ?? 1.25, walk: S.walk ?? 1.5, height: S.height ?? 5.4, cars: S.cars !== false, lamps: S.lamps !== false,
    stoops: S.stoops !== false, escapes: S.escapes !== false, laundry: !!S.laundry, brick: S.brick ?? BRICKS, trim: S.trim ?? '#dccfb4',
    asphalt: S.asphalt, walkColor: S.walkColor ?? '#a9a59a',
  };
};
export const streetX = (hw, S) => hw + S.gutter + S.walk;

// ---- sky and skyline (above the horizon) ----------------------------------------------------------------------------------
export function streetBackdrop(ctx, R, hy, pal, t, pan, LK = {}) {
  const S = streetOpts(LK), x0 = R.x, W = R.w, y0 = R.y, H = hy - R.y;
  const customSky = LK.skyTop && LK.skyTop !== '#7fb4d9';
  const top = customSky ? LK.skyTop : S.dusk ? '#2b2457' : pal.skyTop, low = LK.skyLow && LK.skyLow !== '#dbe9f1' ? LK.skyLow : S.dusk ? '#f0875a' : pal.skyLow;
  ctx.fillStyle = vgrad(ctx, y0, hy, [[0, top], [1, low]]); ctx.fillRect(x0, y0, W, H + 2);
  // sun low in the haze, or a moon-bright glow at dusk, and a few clouds
  const sx = x0 + W * 0.5 + pan * 0.08, sy = hy - H * 0.12;
  const sg = ctx.createRadialGradient(sx, sy, 2, sx, sy, H * 0.9); sg.addColorStop(0, S.dusk ? 'rgba(255,196,120,0.75)' : 'rgba(255,248,214,0.7)'); sg.addColorStop(0.35, S.dusk ? 'rgba(255,150,100,0.25)' : 'rgba(255,240,200,0.22)'); sg.addColorStop(1, 'rgba(255,200,140,0)');
  ctx.fillStyle = sg; ctx.fillRect(x0, y0, W, H);
  ctx.fillStyle = S.dusk ? 'rgba(255,196,170,0.28)' : 'rgba(255,255,255,0.55)';
  for (let i = 0; i < 4; i++) { const cx = x0 + ((W * (0.1 + i * 0.27) + t * (2 + i) + pan * 0.2) % (W + 200)) - 60, cy = y0 + H * (0.16 + (i % 2) * 0.2); ctx.beginPath(); ctx.ellipse(cx, cy, 42, 8, 0, 0, TAU); ctx.ellipse(cx + 24, cy - 5, 26, 8, 0, 0, TAU); ctx.fill(); }
  // two layers of distant roofs with water towers and chimneys
  for (let layer = 0; layer < 2; layer++) {
    const base = hy + 1, col = mix(S.dusk ? '#3a2a4a' : '#8a8f9c', low, layer ? 0.1 : 0.42), n = 16;
    for (let i = 0; i < n; i++) {
      const bw = (W / n) * (0.9 + 0.4 * hash(i * 3.1 + layer * 17)), bx = x0 + (W * i) / n - 8 + pan * (0.15 + layer * 0.15), bh = H * (0.16 + 0.34 * hash(i * 1.7 + layer * 5) - layer * 0.08);
      ctx.fillStyle = col; ctx.fillRect(bx, base - bh, bw, bh);
      if (hash(i * 7.3 + layer) > 0.7) { ctx.fillRect(bx + bw * 0.2, base - bh - H * 0.07, bw * 0.12, H * 0.07); }
      if (hash(i * 9.9 + layer) > 0.82 && layer === 0) { ctx.fillStyle = dark(col, 0.2); ctx.fillRect(bx + bw * 0.3, base - bh - H * 0.09, bw * 0.38, H * 0.07); poly(ctx, [[bx + bw * 0.26, base - bh - H * 0.09], [bx + bw * 0.72, base - bh - H * 0.09], [bx + bw * 0.5, base - bh - H * 0.14]]); ctx.fill(); ctx.fillStyle = col; }
      if (S.dusk) { ctx.fillStyle = 'rgba(255,214,130,0.55)'; for (let k = 0; k < 6; k++) if (hash(i * 13 + k + layer) > 0.55) ctx.fillRect(bx + 3 + (k % 3) * (bw / 3.4), base - bh + 5 + Math.floor(k / 3) * 9, 3, 4); }
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x0, hy - 2, W, 3);
}

// ---- a building front: m(u, z, dx) maps a position along the front, a height and a distance out from the wall to the screen ---
function building(ctx, m, ua, ub, H, o) {
  const { S, i, haze, seed } = o, col = mix(S.brick[i % S.brick.length], o.haze > 0 ? o.hazeCol : '#ffffff', haze), trim = mix(S.trim, o.hazeCol, haze * 0.8);
  const wall = (u0, u1, z0, z1, dx = 0) => [m(u0, z0, dx), m(u1, z0, dx), m(u1, z1, dx), m(u0, z1, dx)].map((q) => [q.x, q.y]);
  const fl = Math.max(3, Math.round(H / 1.2)), fh = H / fl;
  const dim = S.dusk ? 0.32 : 0;
  // wall with brick courses and a soft shadow at the foot
  const base = S.dusk ? dark(col, 0.18) : col;
  poly(ctx, wall(ua, ub, 0, H)); ctx.fillStyle = base; ctx.fill();
  ctx.strokeStyle = alpha('#000', 0.07 + 0.03 * (1 - haze)); ctx.lineWidth = 1; ctx.beginPath();
  for (let z = 0.22; z < H; z += 0.22) { const a = m(ua, z, 0), b = m(ub, z, 0); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.16)'; poly(ctx, wall(ua, ub, 0, 0.45)); ctx.fill();
  // corner pilasters and the cornice
  ctx.fillStyle = alpha(dark(trim, 0.15), 0.9); poly(ctx, wall(ua, ua + 0.12, 0, H)); ctx.fill(); poly(ctx, wall(ub - 0.12, ub, 0, H)); ctx.fill();
  const cz = H - 0.18;
  poly(ctx, [m(ua, cz, 0), m(ub, cz, 0), m(ub, H + 0.12, 0.3), m(ua, H + 0.12, 0.3)].map((q) => [q.x, q.y])); ctx.fillStyle = dark(trim, 0.28); ctx.fill();
  poly(ctx, [m(ua, H + 0.12, 0.3), m(ub, H + 0.12, 0.3), m(ub, H + 0.16, 0), m(ua, H + 0.16, 0)].map((q) => [q.x, q.y])); ctx.fillStyle = light(trim, 0.2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); { const a = m(ua, cz, 0), b = m(ub, cz, 0); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); } ctx.stroke();
  // windows (bays) and the door on the ground floor
  const wb = 1.3, nb = Math.max(1, Math.floor((ub - ua) / wb)), step = (ub - ua) / nb, doorBay = Math.floor(hash(seed + 4.2) * nb);
  for (let f = 0; f < fl; f++) {
    for (let k = 0; k < nb; k++) {
      const uc = ua + (k + 0.5) * step, ww = Math.min(0.62, step * 0.5);
      if (f === 0 && k === doorBay) continue;
      const z0 = f * fh + (f === 0 ? fh * 0.32 : fh * 0.2), z1 = z0 + fh * (f === 0 ? 0.42 : 0.56);
      const lit = S.dusk && hash(seed * 3.7 + f * 11 + k * 5.3) > 0.5;
      // sill and lintel
      poly(ctx, [m(uc - ww / 2 - 0.05, z0 - 0.05, 0.1), m(uc + ww / 2 + 0.05, z0 - 0.05, 0.1), m(uc + ww / 2 + 0.05, z0, 0), m(uc - ww / 2 - 0.05, z0, 0)].map((q) => [q.x, q.y])); ctx.fillStyle = trim; ctx.fill();
      poly(ctx, wall(uc - ww / 2 - 0.05, uc + ww / 2 + 0.05, z1, z1 + 0.07)); ctx.fillStyle = dark(trim, 0.1); ctx.fill();
      poly(ctx, wall(uc - ww / 2, uc + ww / 2, z0, z1));
      if (lit) { ctx.fillStyle = vgrad(ctx, m(uc, z1, 0).y, m(uc, z0, 0).y, [[0, '#ffe3a0'], [1, '#ffb858']]); }
      else { ctx.fillStyle = vgrad(ctx, m(uc, z1, 0).y, m(uc, z0, 0).y, [[0, mix('#6f93ad', o.hazeCol, haze * 0.7)], [1, mix('#2f4658', o.hazeCol, haze * 0.7)]]); }
      ctx.fill();
      if (!lit && hash(seed * 5.1 + f * 3 + k) > 0.55) { ctx.fillStyle = alpha(['#e8e0cc', '#c8d8b0', '#e0b8b0'][Math.floor(hash(seed + k + f) * 3)], 0.8); poly(ctx, wall(uc - ww / 2, uc + ww / 2, z0 + (z1 - z0) * 0.45, z1)); ctx.fill(); }
      ctx.strokeStyle = alpha('#f4efe0', 0.9); ctx.lineWidth = Math.max(1, m(uc, z0, 0).s * 0.025); poly(ctx, wall(uc - ww / 2, uc + ww / 2, z0, z1)); ctx.stroke();
      ctx.beginPath(); { const a = m(uc, z0, 0), b = m(uc, z1, 0), c2 = m(uc - ww / 2, (z0 + z1) / 2, 0), d = m(uc + ww / 2, (z0 + z1) / 2, 0); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.moveTo(c2.x, c2.y); ctx.lineTo(d.x, d.y); } ctx.stroke();
    }
  }
  if (S.dusk && dim) { ctx.fillStyle = `rgba(30,18,50,${dim * 0.35})`; poly(ctx, wall(ua, ub, 0, H)); ctx.fill(); }
  // stoop and door
  if (S.stoops) {
    const uc = ua + (doorBay + 0.5) * step, dw = Math.min(0.72, step * 0.55), dz = fh * 0.78;
    poly(ctx, wall(uc - dw / 2 - 0.07, uc + dw / 2 + 0.07, 0, dz + 0.1)); ctx.fillStyle = trim; ctx.fill();
    poly(ctx, wall(uc - dw / 2, uc + dw / 2, 0, dz)); ctx.fillStyle = vgrad(ctx, m(uc, dz, 0).y, m(uc, 0, 0).y, [[0, '#4a3226'], [1, '#2a1c16']]); ctx.fill();
    poly(ctx, wall(uc - dw / 2 + 0.06, uc + dw / 2 - 0.06, dz * 0.55, dz - 0.07)); ctx.fillStyle = alpha('#000', 0.18); ctx.fill();
    const tr0 = wall(uc - dw / 2, uc + dw / 2, dz + 0.1, dz + 0.3); poly(ctx, tr0); ctx.fillStyle = S.dusk ? '#ffd27a' : mix('#9ab8cc', o.hazeCol, haze * 0.7); ctx.fill();
    // three stone steps, outermost lowest, with iron rails
    const sw = dw + 0.5;
    for (let q = 0; q < 3; q++) {
      const dxq = 0.95 - q * 0.3, zt = (q + 1) * 0.15, u0 = uc - sw / 2, u1 = uc + sw / 2;
      const st = mix('#b7b0a2', o.hazeCol, haze * 0.7);
      poly(ctx, [m(u0, zt, 0), m(u1, zt, 0), m(u1, zt, dxq), m(u0, zt, dxq)].map((p) => [p.x, p.y])); ctx.fillStyle = light(st, 0.16); ctx.fill();
      poly(ctx, [m(u0, 0, dxq), m(u1, 0, dxq), m(u1, zt, dxq), m(u0, zt, dxq)].map((p) => [p.x, p.y])); ctx.fillStyle = dark(st, 0.12); ctx.fill();
      poly(ctx, [m(u0, 0, 0), m(u0, 0, dxq), m(u0, zt, dxq), m(u0, zt, 0)].map((p) => [p.x, p.y])); ctx.fillStyle = dark(st, 0.38); ctx.fill();
    }
    ctx.strokeStyle = '#1d1f24'; ctx.lineWidth = Math.max(1.2, m(uc, 0, 0).s * 0.03); ctx.lineCap = 'round'; ctx.beginPath();
    for (const u of [uc - sw / 2 + 0.03, uc + sw / 2 - 0.03]) { const a = m(u, 0.15, 0.95), b = m(u, 0.62, 0.95), c = m(u, 0.62 + 0.45, 0.1), d = m(u, 0.15 + 0.45, 0.95); void d; ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.moveTo(m(u, 0.45, 0.1).x, m(u, 0.45, 0.1).y); ctx.lineTo(c.x, c.y); }
    ctx.stroke(); ctx.lineCap = 'butt';
  }
  // fire escape on some buildings: platforms, railings, zig-zag stairs and a drop ladder
  if (S.escapes && hash(seed + 9.1) > 0.35 && nb >= 2) {
    const ue0 = ua + step * (nb >= 3 ? 0.9 : 0.25), ue1 = ue0 + Math.min(2.2, step * 1.55), pd = 0.58, ink = o.dusk ? '#14151a' : '#22252b';
    ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineCap = 'round';
    const sx = m(ue0, 1, 0).s;
    for (let f = 1; f < fl; f++) {
      const z = f * fh;
      poly(ctx, [m(ue0, z, 0), m(ue1, z, 0), m(ue1, z, pd), m(ue0, z, pd)].map((p) => [p.x, p.y])); ctx.fillStyle = alpha(ink, 0.75); ctx.fill();
      ctx.lineWidth = Math.max(1.6, sx * 0.045); ctx.beginPath(); { const a = m(ue0, z, pd), b = m(ue1, z, pd); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); } ctx.stroke();
      ctx.lineWidth = Math.max(1, sx * 0.025); ctx.beginPath();
      { const a = m(ue0, z + 0.5, pd), b = m(ue1, z + 0.5, pd); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        for (let q = 0; q <= 5; q++) { const u = ue0 + ((ue1 - ue0) * q) / 5, p0 = m(u, z, pd), p1 = m(u, z + 0.5, pd); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); }
        const l0 = m(ue0, z + 0.5, pd), l1 = m(ue0, z + 0.5, 0), r0 = m(ue1, z + 0.5, pd), r1 = m(ue1, z + 0.5, 0); ctx.moveTo(l0.x, l0.y); ctx.lineTo(l1.x, l1.y); ctx.moveTo(r0.x, r0.y); ctx.lineTo(r1.x, r1.y); }
      ctx.stroke();
      if (f > 1) { // stairs from this platform down to the one below, alternating ends
        const dirR = f % 2 === 0, uA = dirR ? ue0 + 0.15 : ue1 - 0.15, uB = dirR ? ue1 - 0.15 : ue0 + 0.15;
        ctx.lineWidth = Math.max(1.6, sx * 0.045); ctx.beginPath(); const a = m(uA, z, pd * 0.55), b = m(uB, z - fh, pd * 0.55); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.lineWidth = Math.max(1, sx * 0.022); ctx.beginPath(); for (let q = 1; q < 6; q++) { const t2 = q / 6, p0 = m(uA + (uB - uA) * t2, z - fh * t2, pd * 0.2), p1 = m(uA + (uB - uA) * t2, z - fh * t2, pd * 0.9); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); } ctx.stroke();
      }
    }
    ctx.lineWidth = Math.max(1, sx * 0.025); ctx.beginPath(); { const a = m(ue1 - 0.2, fh, pd * 0.9), b = m(ue1 - 0.2, 0.55, pd * 0.9); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); const a2 = m(ue1 - 0.45, fh, pd * 0.9), b2 = m(ue1 - 0.45, 0.55, pd * 0.9); ctx.moveTo(a2.x, a2.y); ctx.lineTo(b2.x, b2.y); for (let q = 0; q < 5; q++) { const z = fh - (q * (fh - 0.55)) / 4, p0 = m(ue1 - 0.2, z, pd * 0.9), p1 = m(ue1 - 0.45, z, pd * 0.9); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); } } ctx.stroke();
    ctx.lineCap = 'butt';
  }
  if (S.dusk) { ctx.fillStyle = vgrad(ctx, m(ua, H, 0).y, m(ua, 0, 0).y, [[0, 'rgba(255,140,90,0.10)'], [1, 'rgba(20,10,40,0.18)']]); poly(ctx, wall(ua, ub, 0, H)); ctx.fill(); }
}

// ---- the whole street: pavements, far cross building and the two rows of tenements --------------------------------------------
export function streetWorld(ctx, L, o) {
  const { tr, sy, sc } = L, { hw, len, LK, pal } = o, S = streetOpts(LK), X = streetX(hw, S), wy = len + 0.9, ymin = -3, G = hw + S.gutter;
  const hazeCol = mix(pal.skyLow, '#c8a890', 0.3);
  const haze = (y) => clamp((y / Math.max(8, len)) * 0.38, 0, 0.42);
  // far cross building, then side rows far to near
  const Hend = S.height * 0.95;
  building(ctx, (u, z, dx) => tr(u, wy - dx, z), -X, X, Hend, { S, i: 3, haze: 0.4, hazeCol, seed: 41.7, dusk: S.dusk });
  for (const sgn of [-1, 1]) {
    // pavement: slabs, curb face and a shadow along the building foot
    const gW = (y0, y1, xa, xb, z = 0) => [tr(xa, y0, z), tr(xb, y0, z), tr(xb, y1, z), tr(xa, y1, z)].map((q) => [q.x, q.y]);
    poly(ctx, gW(ymin, wy, sgn * G, sgn * X)); ctx.fillStyle = S.dusk ? dark(S.walkColor, 0.28) : S.walkColor; ctx.fill();
    ctx.strokeStyle = alpha('#000', 0.14); ctx.lineWidth = 1; ctx.beginPath();
    for (let y = ymin; y <= wy; y += 1.1) { const a = tr(sgn * G, y), b = tr(sgn * X, y); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
    ctx.stroke();
    poly(ctx, [tr(sgn * G, ymin, 0), tr(sgn * G, wy, 0), tr(sgn * G, wy, 0.13), tr(sgn * G, ymin, 0.13)].map((q) => [q.x, q.y])); ctx.fillStyle = S.dusk ? '#585660' : '#cfcabd'; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.stroke();
    poly(ctx, gW(ymin, wy, sgn * G, sgn * (G + 0.1), 0.13)); ctx.fillStyle = S.dusk ? '#7a7884' : '#e4dfd2'; ctx.fill();
  }
  // buildings: split each side into lots of 3-4.6 units
  for (const sgn of [-1, 1]) {
    const lots = [];
    for (let y = ymin - (sgn > 0 ? 1.2 : 0); y < wy - 0.2;) { const w = 3.1 + 1.5 * hash(y * 2.3 + sgn * 9); lots.push([y, Math.min(wy, y + w)]); y += w; }
    for (let k = lots.length - 1; k >= 0; k--) {
      const [ya, yb] = lots[k];
      building(ctx, (u, z, dx) => tr(sgn * (X - dx), u, z), ya, yb, S.height - 0.5 * hash(k * 3 + sgn * 17) + (hash(k * 5.7 + sgn) > 0.7 ? 0.9 : 0), { S, i: k + (sgn > 0 ? 3 : 0), haze: haze((ya + yb) / 2), hazeCol, seed: k * 7.9 + sgn * 31, dusk: S.dusk });
    }
  }
  void sy; void sc;
}

// ---- standing things in the street, to be drawn in depth order with the balls ---------------------------------------------------------------
function carShape(ctx, tr, c, y0, sgn, o) {
  const S = o.S, Lc = 2.7, xs = sgn * (o.hw + S.gutter * 0.5 - sgn * 0.0) - sgn * 0.47; // the side facing the lane
  const body = c.color, P = (y, z) => tr(xs, y0 + y, z), pts = (a) => a.map(([y, z]) => { const q = P(y, z); return [q.x, q.y]; });
  const sh = tr(sgn * (o.hw + S.gutter * 0.5), y0 + Lc / 2, 0), sw = Math.max(3, sh.s * 0.5);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; poly(ctx, [tr(sgn * (o.hw + S.gutter * 0.5 - 0.7), y0 - 0.1), tr(sgn * (o.hw + S.gutter * 0.5 + 0.8), y0 - 0.1), tr(sgn * (o.hw + S.gutter * 0.5 + 0.8), y0 + Lc + 0.1), tr(sgn * (o.hw + S.gutter * 0.5 - 0.7), y0 + Lc + 0.1)].map((q) => [q.x, q.y])); ctx.fill(); void sw;
  const dusk = S.dusk, bc = dusk ? dark(body, 0.25) : body;
  // side profile
  poly(ctx, pts([[0, 0.14], [0, 0.4], [0.12, 0.5], [0.6, 0.53], [0.98, 0.84], [1.62, 0.88], [2.0, 0.56], [2.5, 0.5], [2.7, 0.4], [2.7, 0.14]]));
  ctx.fillStyle = bc; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.stroke();
  poly(ctx, pts([[0.05, 0.3], [2.65, 0.3], [2.65, 0.4], [2.5, 0.5], [0.12, 0.5], [0.05, 0.4]])); ctx.fillStyle = alpha('#fff', 0.1); ctx.fill();
  poly(ctx, pts([[0.0, 0.14], [2.7, 0.14], [2.7, 0.22], [0, 0.22]])); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
  // windows
  poly(ctx, pts([[1.06, 0.58], [1.04, 0.8], [1.6, 0.84], [1.92, 0.58]])); ctx.fillStyle = dusk ? '#3a4660' : '#9fc0d8'; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.stroke();
  poly(ctx, pts([[0.7, 0.58], [0.98, 0.8], [1.0, 0.58]])); ctx.fillStyle = dusk ? '#3a4660' : '#9fc0d8'; ctx.fill(); ctx.stroke();
  // wheels
  for (const wy2 of [0.55, 2.1]) {
    ctx.beginPath(); for (let a = 0; a <= 20; a++) { const q = P(wy2 + Math.cos((a / 20) * TAU) * 0.26, 0.26 + Math.sin((a / 20) * TAU) * 0.26); if (a) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); } ctx.closePath(); ctx.fillStyle = '#17181c'; ctx.fill();
    ctx.beginPath(); for (let a = 0; a <= 16; a++) { const q = P(wy2 + Math.cos((a / 16) * TAU) * 0.13, 0.26 + Math.sin((a / 16) * TAU) * 0.13); if (a) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); } ctx.closePath(); ctx.fillStyle = '#b8bcc4'; ctx.fill();
  }
  ctx.fillStyle = alpha('#fff', 0.35); poly(ctx, pts([[0.7, 0.5], [2.0, 0.5], [2.0, 0.53], [0.7, 0.53]])); ctx.fill();
  // rear face: the end toward the thrower
  const xa = sgn * (o.hw + S.gutter * 0.5) - 0.47, xb = sgn * (o.hw + S.gutter * 0.5) + 0.47, R = (x, z) => { const q = tr(x, y0, z); return [q.x, q.y]; };
  poly(ctx, [R(xa, 0.14), R(xb, 0.14), R(xb, 0.5), R(xa, 0.5)]); ctx.fillStyle = dark(bc, 0.12); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.stroke();
  poly(ctx, [R(xa + 0.07, 0.5), R(xb - 0.07, 0.5), R(xb - 0.16, 0.82), R(xa + 0.16, 0.82)]); ctx.fillStyle = dusk ? '#3a4660' : '#9fc0d8'; ctx.fill(); ctx.stroke();
  poly(ctx, [R(xa + 0.1, 0.5), R(xb - 0.1, 0.5), R(xb - 0.12, 0.58), R(xa + 0.12, 0.58)]); ctx.fillStyle = dark(bc, 0.25); ctx.fill();
  for (const xx of [xa + 0.06, xb - 0.2]) { poly(ctx, [R(xx, 0.34), R(xx + 0.14, 0.34), R(xx + 0.14, 0.42), R(xx, 0.42)]); ctx.fillStyle = dusk ? '#ff5a4a' : '#d83a2e'; ctx.fill(); }
  poly(ctx, [R(xa, 0.14), R(xb, 0.14), R(xb, 0.2), R(xa, 0.2)]); ctx.fillStyle = '#2a2c32'; ctx.fill();
  poly(ctx, [R(sgn * (o.hw + S.gutter * 0.5) - 0.12, 0.24), R(sgn * (o.hw + S.gutter * 0.5) + 0.12, 0.24), R(sgn * (o.hw + S.gutter * 0.5) + 0.12, 0.3), R(sgn * (o.hw + S.gutter * 0.5) - 0.12, 0.3)]); ctx.fillStyle = '#e8e8e0'; ctx.fill();
}

function lamp(ctx, tr, x, y, S, t) {
  const b = tr(x, y, 0), top = tr(x, y, 3.1), s = b.s, w = Math.max(2.5, s * 0.06), arm = x > 0 ? -1 : 1;
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(b.x + w, b.y + 1, w * 2, Math.max(1, w * 0.45), 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#1c1e22'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(top.x, top.y); ctx.stroke();
  ctx.lineWidth = w * 0.7; ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.quadraticCurveTo(top.x + arm * s * 0.1, top.y - s * 0.25, top.x + arm * s * 0.5, top.y - s * 0.08); ctx.stroke();
  const lx = top.x + arm * s * 0.5, ly = top.y - s * 0.04;
  if (S.dusk) { const g = ctx.createRadialGradient(lx, ly, 1, lx, ly, s * 1.6); g.addColorStop(0, 'rgba(255,214,130,0.75)'); g.addColorStop(1, 'rgba(255,214,130,0)'); ctx.fillStyle = g; ctx.fillRect(lx - s * 1.6, ly - s * 1.6, s * 3.2, s * 3.2); }
  ctx.fillStyle = S.dusk ? '#fff0c0' : '#e8e4d0'; ctx.beginPath(); ctx.ellipse(lx, ly, s * 0.13, s * 0.06, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#1c1e22'; ctx.fillRect(lx - s * 0.15, ly - s * 0.09, s * 0.3, s * 0.045);
  void t;
}

export function streetObjs(L, o, ctx, clock) {
  const { tr } = L, S = streetOpts(o.LK), { hw, len } = o, out = [], hyd = (o.props ?? []).filter((p) => p.kind === 'hydrant');
  for (const sgn of [-1, 1]) {
    if (S.cars) {
      let y = 1.1 + 2.4 * hash(sgn * 13.3);
      for (let k = 0; y < len - 2.2; k++) {
        const col = CARS[Math.floor(hash(k * 3.3 + sgn * 7.1) * CARS.length)], y0 = y;
        const blocked = hyd.some((p) => Math.sign(p.x) === sgn && p.y > y0 - 0.5 && p.y < y0 + 3.2);
        if (!blocked && hash(k * 1.9 + sgn * 2.2) > 0.2) out.push({ y: y0, d: () => carShape(ctx, tr, { color: col }, y0, sgn, { S, hw }) });
        y += 2.7 + 0.8 + 3.2 * hash(k * 6.1 + sgn * 5.4);
      }
    }
    if (S.lamps) for (let y = 3 + sgn * 0.8; y < len + 0.5; y += 7.5) { const yy = y; out.push({ y: yy, d: () => lamp(ctx, tr, sgn * (hw + S.gutter + 0.22), yy, S, clock) }); }
  }
  if (S.laundry) {
    const X = streetX(hw, S);
    for (const [y, z] of [[len * 0.5, 3.7], [len * 0.84, 3.9]]) {
      out.push({ y, d: () => {
        const N = 16, pts = []; for (let i = 0; i <= N; i++) { const u = i / N, q = tr(-X + 0.3 + (2 * X - 0.6) * u, y, z - Math.sin(Math.PI * u) * 0.34 + Math.sin(clock * 1.6 + u * 4) * 0.01); pts.push(q); }
        ctx.strokeStyle = 'rgba(30,24,20,0.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.stroke();
        const cl = ['#f2f0e6', '#d8453a', '#e8c26a', '#6aa6c8', '#f4a9bd'];
        for (let i = 2; i < N - 1; i += 2) { const q = pts[i], w2 = Math.max(4, q.s * 0.22), h2 = Math.max(6, q.s * 0.3) + Math.sin(clock * 2 + i) * 1.2; ctx.fillStyle = cl[(i / 2) % cl.length | 0]; ctx.globalAlpha = 0.92; poly(ctx, [[q.x - w2 / 2, q.y], [q.x + w2 / 2, q.y], [q.x + w2 / 2 + 1, q.y + h2], [q.x - w2 / 2 - 1, q.y + h2]]); ctx.fill(); ctx.globalAlpha = 1; }
      } });
    }
  }
  return out;
}

// ---- manhole cover (flat on the road) and fire hydrant -------------------------------------------------------------------------------------
export function drawManhole(ctx, tr, fs, x, y, r = 0.42, col = '#3a3d43') {
  const c = tr(x, y), f = fs(y), rr = Math.max(3, r * c.s);
  ctx.save(); ctx.translate(c.x, c.y); ctx.scale(1, f);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(0, 0, rr * 1.12, 0, TAU); ctx.fill();            // the frame in the road
  ctx.fillStyle = dark(col, 0.25); ctx.beginPath(); ctx.arc(0, 0, rr * 1.04, 0, TAU); ctx.fill();
  const g = ctx.createRadialGradient(-rr * 0.3, -rr * 0.35, rr * 0.1, 0, 0, rr); g.addColorStop(0, light(col, 0.22)); g.addColorStop(1, dark(col, 0.18));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rr * 0.94, 0, TAU); ctx.fill();
  ctx.strokeStyle = alpha('#000', 0.55); ctx.lineWidth = Math.max(1, rr * 0.05); for (const k of [0.94, 0.8, 0.46]) { ctx.beginPath(); ctx.arc(0, 0, rr * k, 0, TAU); ctx.stroke(); }
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, rr * 0.78, 0, TAU); ctx.clip();
  ctx.strokeStyle = alpha('#000', 0.45); ctx.lineWidth = Math.max(1, rr * 0.045); ctx.beginPath();                      // a diamond grid
  for (let k = -6; k <= 6; k++) { const o2 = (k * rr) / 3.4; ctx.moveTo(o2 - rr, -rr); ctx.lineTo(o2 + rr, rr); ctx.moveTo(o2 + rr, -rr); ctx.lineTo(o2 - rr, rr); }
  ctx.stroke();
  ctx.strokeStyle = alpha('#fff', 0.14); ctx.lineWidth = Math.max(1, rr * 0.03); ctx.beginPath();
  for (let k = -6; k <= 6; k++) { const o2 = (k * rr) / 3.4 + rr * 0.06; ctx.moveTo(o2 - rr, -rr); ctx.lineTo(o2 + rr, rr); }
  ctx.stroke(); ctx.restore();
  ctx.fillStyle = dark(col, 0.2); ctx.beginPath(); ctx.arc(0, 0, rr * 0.3, 0, TAU); ctx.fill(); ctx.strokeStyle = alpha('#fff', 0.2); ctx.lineWidth = 1; ctx.stroke();
  ctx.strokeStyle = alpha('#fff', 0.3); ctx.lineWidth = Math.max(1, rr * 0.06); ctx.beginPath(); ctx.arc(0, 0, rr * 1.0, Math.PI * 1.05, Math.PI * 1.45); ctx.stroke();   // sheen on the rim
  ctx.restore();
}

export function drawHydrant(ctx, c, h = 0.6, r = 0.13, col = '#d8352b') {
  const s = c.s, rr = Math.max(3, r * s), hh = h * s * 1.8, f = c.f ?? 0.4;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(c.x + rr * 0.6, c.y + 1, rr * 2.1, Math.max(1.5, rr * f * 1.0), 0, 0, TAU); ctx.fill();
  const gr = (x0, x1) => { const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, light(col, 0.4)); g.addColorStop(0.45, col); g.addColorStop(1, dark(col, 0.5)); return g; };
  // base flange, barrel, collar
  ctx.fillStyle = gr(c.x - rr * 1.35, c.x + rr * 1.35); ctx.fillRect(c.x - rr * 1.3, c.y - hh * 0.1, rr * 2.6, hh * 0.1);
  ctx.fillStyle = gr(c.x - rr, c.x + rr); ctx.fillRect(c.x - rr, c.y - hh * 0.78, rr * 2, hh * 0.7);
  ctx.fillStyle = gr(c.x - rr * 1.2, c.x + rr * 1.2); ctx.fillRect(c.x - rr * 1.18, c.y - hh * 0.78, rr * 2.36, hh * 0.07); ctx.fillRect(c.x - rr * 1.18, c.y - hh * 0.2, rr * 2.36, hh * 0.06);
  // side nozzles with chained caps
  for (const sg of [-1, 1]) {
    ctx.fillStyle = gr(c.x - rr * 2, c.x + rr * 2); ctx.fillRect(sg < 0 ? c.x - rr * 1.75 : c.x + rr * 0.95, c.y - hh * 0.52, rr * 0.8, hh * 0.17);
    ctx.fillStyle = light(col, 0.12); ctx.beginPath(); ctx.ellipse(c.x + sg * rr * 1.78, c.y - hh * 0.435, rr * 0.2, hh * 0.1, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.stroke();
  }
  // the steamer nozzle faces the viewer
  ctx.fillStyle = dark(col, 0.18); ctx.beginPath(); ctx.arc(c.x, c.y - hh * 0.42, rr * 0.62, 0, TAU); ctx.fill();
  ctx.fillStyle = light(col, 0.1); ctx.beginPath(); ctx.arc(c.x, c.y - hh * 0.42, rr * 0.46, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = dark(col, 0.45); ctx.beginPath(); ctx.arc(c.x, c.y - hh * 0.42, rr * 0.17, 0, TAU); ctx.fill();
  // dome and nut
  ctx.fillStyle = gr(c.x - rr, c.x + rr); ctx.beginPath(); ctx.moveTo(c.x - rr * 0.95, c.y - hh * 0.78); ctx.quadraticCurveTo(c.x, c.y - hh * 1.22, c.x + rr * 0.95, c.y - hh * 0.78); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.stroke();
  ctx.fillStyle = '#c8b050'; ctx.fillRect(c.x - rr * 0.3, c.y - hh * 1.04, rr * 0.6, hh * 0.08);
  ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(c.x - rr * 0.7, c.y - hh * 0.72, rr * 0.25, hh * 0.6);
}

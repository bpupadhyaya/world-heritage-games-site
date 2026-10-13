// Shared helpers for the shadow-family theatres (wayang kulit, karagoz): outlines, two-bone arms, perforation grids.
export const TAU = Math.PI * 2;
export const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// polygon (points in unit space, scaled by sc, offset ox/oy); smooth = closed curve through the edge midpoints
export function outline(ctx, pts, sc = 1, ox = 0, oy = 0, smooth = false) {
  ctx.beginPath();
  const P = pts.map(([x, y]) => [ox + x * sc, oy + y * sc]);
  if (!smooth) { P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); return; }
  const n = P.length, m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const s0 = m(P[n - 1], P[0]);
  ctx.moveTo(s0[0], s0[1]);
  for (let i = 0; i < n; i++) { const e = m(P[i], P[(i + 1) % n]); ctx.quadraticCurveTo(P[i][0], P[i][1], e[0], e[1]); }
  ctx.closePath();
}

// two-bone limb from (sx,sy) toward angle ang (0 hangs down, + swings forward and up). Returns [hx, hy, ex, ey].
export function arm2(ctx, sx, sy, ang, l1, l2, w, col, rim, bendUp = 1) {
  const R = (l1 + l2) * 0.97;
  let tx = sx + Math.sin(ang) * R, ty = sy + Math.cos(ang) * R;
  const dx = tx - sx, dy = ty - sy, d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01) || 0.01;
  const ux = dx / d, uy = dy / d;
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  let ex = sx + ux * a - uy * h * bendUp, ey = sy + uy * a + ux * h * bendUp;
  const ex2 = sx + ux * a + uy * h * bendUp, ey2 = sy + uy * a - ux * h * bendUp;
  if (ey2 > ey) { ex = ex2; ey = ey2; }
  const hx = sx + ux * d, hy = sy + uy * d;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (rim) { ctx.strokeStyle = rim; ctx.lineWidth = w * 1.5; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke(); }
  ctx.strokeStyle = col; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
  ctx.lineWidth = w * 0.72; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
  return [hx, hy, ex, ey];
}

// grid of small perforations clipped to the current path (call after ctx.save + clip)
export function holes(ctx, x, y, w, h, step, r, col, kind = 'dot') {
  ctx.fillStyle = col;
  let row = 0;
  for (let yy = y; yy < y + h; yy += step, row++) {
    for (let xx = x + (row % 2 ? step / 2 : 0); xx < x + w; xx += step) {
      ctx.beginPath();
      if (kind === 'dia') { ctx.moveTo(xx, yy - r); ctx.lineTo(xx + r * 0.7, yy); ctx.lineTo(xx, yy + r); ctx.lineTo(xx - r * 0.7, yy); ctx.closePath(); } else ctx.arc(xx, yy, r, 0, TAU);
      ctx.fill();
    }
  }
}

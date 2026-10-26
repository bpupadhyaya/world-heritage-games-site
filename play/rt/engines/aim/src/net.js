// Nets and ropes across the lane (1.5.0): two posts, a see-through mesh with a white top tape (net) or a cord with pennants (rope).
// Drawn in the lane's perspective; a ripple travels along it when a ball hits it. Pure canvas, deterministic.
import { dark, light, alpha, poly, clamp } from './scenery.js';

const TAU = Math.PI * 2;

export const netGeom = (p, L) => ({ x: p.x ?? 0, y: p.y, w: p.w ?? L.width + 0.8, h: p.h ?? 1 });

// ripple r = { t, x } (seconds since the hit, world x of the hit) or null
function sway(r, x, xc) {
  if (!r) return 0;
  const d = Math.abs(x - r.x), t = r.t - d * 0.1;
  if (t < 0) return 0;
  return Math.sin(t * 24) * Math.exp(-t * 3.2) / (1 + d * 1.4);
}

function post(ctx, tr, x, y, h, col, cap) {
  const b = tr(x, y, 0), t = tr(x, y, h), w = Math.max(3, b.s * 0.075);
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(b.x + w * 1.2, b.y + 1, w * 2.2, Math.max(1.2, w * 0.5), 0, 0, TAU); ctx.fill();
  const g = ctx.createLinearGradient(b.x - w, 0, b.x + w, 0); g.addColorStop(0, light(col, 0.35)); g.addColorStop(0.5, col); g.addColorStop(1, dark(col, 0.5));
  ctx.fillStyle = g; ctx.fillRect(b.x - w / 2, t.y, w, b.y - t.y);
  if (cap) { ctx.fillStyle = light(col, 0.2); ctx.beginPath(); ctx.arc(b.x, t.y, w * 0.62, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.stroke(); }
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.strokeRect(b.x - w / 2, t.y, w, b.y - t.y);
}

// kind: 'net' | 'rope'. p: the prop. rip: ripple state. t: clock
export function drawNet(ctx, tr, p, G, rip, t) {
  const xa = G.x - G.w / 2, xb = G.x + G.w / 2, y = G.y, h = G.h;
  const pc = p.post ?? (p.kind === 'rope' ? '#8a6a44' : '#c9ced6');
  const sagAt = (u, depth) => Math.sin(Math.PI * u) * (p.kind === 'rope' ? 0.07 : 0.035) * (1 - depth * 0.4);
  const N = 18;
  // point on the net surface: u across (0..1), v down from the top (0..1) of depth d
  if (p.kind === 'rope') {
    const colr = p.color ?? '#efe9d2';
    post(ctx, tr, xa, y, h + 0.22, pc, true); post(ctx, tr, xb, y, h + 0.22, pc, true);
    const pts = [];
    for (let i = 0; i <= N; i++) { const u = i / N, x = xa + (xb - xa) * u, zz = h - sagAt(u, 0) + sway(rip, x) * 0.07; pts.push(tr(x, y, zz)); }
    const s0 = pts[Math.floor(N / 2)].s;
    // pennants hanging from the cord
    const cols = p.flags ?? ['#d8453a', '#f6f4ec', '#2d6bb0', '#f2c230'];
    for (let i = 1; i < N; i++) {
      const a = pts[i], b = pts[i + 1] ?? pts[i], wv = Math.sin(t * 3 + i) * 0.5 + sway(rip, xa + (xb - xa) * (i / N)) * 3, fw = Math.max(3, a.s * 0.17), fh = Math.max(5, a.s * 0.3);
      ctx.fillStyle = cols[i % cols.length]; poly(ctx, [[a.x, a.y], [b.x, b.y], [(a.x + b.x) / 2 + wv, (a.y + b.y) / 2 + fh]]); ctx.fill();
      void fw;
    }
    ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = Math.max(2.5, s0 * 0.045);
    ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y + 1.2) : ctx.moveTo(q.x, q.y + 1.2))); ctx.stroke();
    ctx.strokeStyle = colr; ctx.lineWidth = Math.max(1.6, s0 * 0.03);
    ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.stroke(); ctx.lineCap = 'butt';
    return;
  }
  // ---- mesh net ----
  const depth = p.depth ?? Math.min(h * 0.55, 0.8), tape = p.tape ?? 0.09, mesh = p.mesh ?? '#161a22', tcol = p.color ?? '#f6f4ec';
  const cols = Math.max(8, Math.round(G.w / 0.13)), rows = Math.max(4, Math.round(depth / 0.1));
  const P = (u, v) => { const x = xa + (xb - xa) * u; return tr(x + sway(rip, x) * 0.05 * v, y, h - v * depth - sagAt(u, v) + sway(rip, x) * 0.05 * (1 - v)); };
  // ground shadow of the tape
  const a0 = tr(xa, y + 0.12, 0), b0 = tr(xb, y + 0.12, 0);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = Math.max(2, a0.s * 0.06); ctx.beginPath(); ctx.moveTo(a0.x, a0.y); ctx.lineTo(b0.x, b0.y); ctx.stroke();
  post(ctx, tr, xa, y, h + 0.14, pc, false); post(ctx, tr, xb, y, h + 0.14, pc, false);
  // a faint veil so the mesh reads as a surface, then the cords
  const top = [], bot = [];
  for (let i = 0; i <= N; i++) { top.push(P(i / N, 0)); bot.push(P(i / N, 1)); }
  ctx.fillStyle = alpha(mesh, 0.1); ctx.beginPath(); top.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); for (let i = N; i >= 0; i--) ctx.lineTo(bot[i].x, bot[i].y); ctx.closePath(); ctx.fill();
  const s0 = top[Math.floor(N / 2)].s;
  ctx.strokeStyle = alpha(mesh, 0.78); ctx.lineWidth = Math.max(0.7, s0 * 0.011);
  ctx.beginPath();
  for (let j = 0; j <= rows; j++) { const v = j / rows; for (let i = 0; i <= N; i++) { const q = P(i / N, v); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); } }
  for (let c = 0; c <= cols; c++) { const u = c / cols; for (let j = 0; j <= 4; j++) { const q = P(u, j / 4); if (j) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); } }
  ctx.stroke();
  // bottom cord and side tapes
  ctx.strokeStyle = alpha(dark(mesh, 0.1), 0.95); ctx.lineWidth = Math.max(1.4, s0 * 0.026);
  ctx.beginPath(); bot.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.stroke();
  ctx.strokeStyle = tcol; ctx.lineWidth = Math.max(1.5, s0 * 0.03);
  for (const u of [0, 1]) { const a = P(u, 0), b = P(u, 1); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
  // the white top tape: a band along the top edge, a little shaded underneath
  const up = [];
  for (let i = 0; i <= N; i++) { const q = top[i]; up.push({ x: q.x, y: q.y - tape * q.s * 1.8 }); }
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); top.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y + 1.6) : ctx.moveTo(q.x, q.y + 1.6))); for (let i = N; i >= 0; i--) ctx.lineTo(top[i].x, top[i].y - 0.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = tcol; ctx.beginPath(); up.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); for (let i = N; i >= 0; i--) ctx.lineTo(top[i].x, top[i].y); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); up.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); up.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y + 1) : ctx.moveTo(q.x, q.y + 1))); ctx.stroke();
  // post tops above the tape
  for (const x of [xa, xb]) { const q = tr(x, y, h + 0.14); ctx.fillStyle = light(pc, 0.15); ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(2, q.s * 0.045), 0, TAU); ctx.fill(); }
  void clamp;
}

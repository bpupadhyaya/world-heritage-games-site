// Scene art, 1.13.0 (silk saris), part 2: paithani (tapestry-weave silk with many hanging bobbins, bright window workshop) and
// baluchari (dark silk with vertical silk floats, bamboo frame, mud courtyard at dusk). Pure canvas 2D, no Math.random (hash only).
// No human figures, no religious symbols, no places of worship, text-free art.
import { hash, rgba, mix, shade, lum, roundRectPath, rod, ball, speck, lines, glow, vignette, TAU, motifPath, isFilled, lineWidthOf, clamp, sheenLine, POT } from './scene-kit.js';
import { TOOLS } from './scene-tools.js';
import { beam, castShadow, thread, isLand } from './scene-loom.js';
import { geo, hbar, vbar, ringSel, backTile, zariSkin } from './scene-sari.js';

const softE = (ctx, x, y, rx, ry, a = 0.3) => { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); };
const pressOf = (T) => Math.max(0, 1 - T.a / 0.45);
const bx = (b) => ({ cx: b.x + b.w / 2, cy: b.y + b.h / 2, r: Math.min(b.w, b.h) / 2 });

// ===================================================================================================================================================
// PAITHANI: a slim frame loom, the motif built bobbin by bobbin (a small bobbin hangs for every colour patch), in a bright white-and-teal workshop with a big window
// ===================================================================================================================================================
const PP_WOOD = '#d9b679';
function ppDims(S) {
  const { a, r, c, m, land, b } = geo(S), pw = Math.max(8, c * 0.34), inset = Math.max(pw * 0.9, Math.min(m.l, m.r) * 0.5);
  const lx = Math.max(a.x + pw * 0.6, r.x - inset), rx = Math.min(a.x + a.w - pw * 0.6, r.x + r.w + inset);
  const H = r.y - b.y, ty = b.y + Math.max(c * 0.2, Math.min(c * 0.4, H * 0.18)), bot = r.y + r.h;
  const by = bot + Math.max(c * 1.15, Math.min(m.b * 0.62, c * 2.2));
  return { a, r, c, m, land, b, pw, lx, rx, ty, bot, by, H };
}
export function ppEnv(ctx, S) {
  const a = S.area, b = S.box, c = S.cell, X0 = a.x - 12, W = a.w + 24, t = S.t || 0, land = isLand(S), top = a.y, bottom = a.y + a.h;
  const fy = b.y + b.h * (land ? 0.86 : 0.9);
  // bright lime-washed wall with a cool green cast and a teal dado
  let g = ctx.createLinearGradient(0, top, 0, fy); g.addColorStop(0, '#f2f8f4'); g.addColorStop(1, '#d3e6df'); ctx.fillStyle = g; ctx.fillRect(X0, top, W, fy - top + 1);
  const dado = fy - (fy - top) * 0.2; g = ctx.createLinearGradient(0, dado, 0, fy); g.addColorStop(0, '#1d7f86'); g.addColorStop(1, '#125a62'); ctx.fillStyle = g; ctx.fillRect(X0, dado, W, fy - dado + 1);
  ctx.fillStyle = '#f4faf6'; ctx.fillRect(X0, dado - Math.max(2, c * 0.08), W, Math.max(2, c * 0.08)); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(X0, dado, W, Math.max(1, c * 0.05));
  // the big window: white frame, glass showing sky and a green garden in full sun
  const wy0 = Math.max(top + c * 0.2, b.y - c * 0.6), wy1 = b.y + b.h * (land ? 0.66 : 0.72), wx0 = X0 + W * 0.02, wx1 = X0 + W * 0.98;
  g = ctx.createLinearGradient(0, wy0, 0, wy1); g.addColorStop(0, '#9fd8ec'); g.addColorStop(0.6, '#e6f6f4'); g.addColorStop(1, '#fbfffb'); ctx.fillStyle = g; ctx.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
  ctx.save(); ctx.beginPath(); ctx.rect(wx0, wy0, wx1 - wx0, wy1 - wy0); ctx.clip();
  glow(ctx, X0 + W * 0.8, wy0 + (wy1 - wy0) * 0.12, W * 0.6, '#ffffff', 0.9);
  const cols = ['#2a6f46', '#3f8f52', '#69b05c', '#a2d27a'];
  for (let layer = 0; layer < 4; layer++) { ctx.fillStyle = cols[layer]; ctx.beginPath(); const yb = wy1 - (wy1 - wy0) * (0.05 + (3 - layer) * 0.12); for (let x = wx0 - 10; x < wx1 + 20; x += c * (1.1 - layer * 0.12)) { const yy = yb - hash(Math.floor(x / 4), layer) * (wy1 - wy0) * 0.1, rr = c * (0.9 + hash(Math.floor(x / 3), layer, 2) * 0.9) * (1 - layer * 0.1); ctx.moveTo(x + rr, yy); ctx.arc(x, yy, rr, 0, TAU); } ctx.lineTo(wx1 + 20, wy1 + 10); ctx.lineTo(wx0 - 10, wy1 + 10); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,230,0.5)'; ctx.beginPath(); for (let k = 0; k < 40; k++) { const px = wx0 + hash(k, 1) * (wx1 - wx0), py = wy1 - hash(k, 2) * (wy1 - wy0) * 0.5, rr = c * (0.06 + hash(k, 3) * 0.08); ctx.moveTo(px + rr, py); ctx.arc(px, py, rr, 0, TAU); } ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.moveTo(wx0 + W * 0.1, wy0); ctx.lineTo(wx0 + W * 0.2, wy0); ctx.lineTo(wx0 + W * 0.05, wy1); ctx.lineTo(wx0 - W * 0.05, wy1); ctx.closePath(); ctx.fill();
  ctx.restore();
  // white frame and mullions, sill
  const fw = Math.max(4, c * 0.22); ctx.fillStyle = '#fbfdfb'; ctx.fillRect(wx0 - fw, wy0 - fw, wx1 - wx0 + fw * 2, fw); ctx.fillRect(wx0 - fw, wy0, fw, wy1 - wy0); ctx.fillRect(wx1, wy0, fw, wy1 - wy0);
  const nm = land ? 5 : 3; for (let k = 1; k < nm; k++) { const x = wx0 + (wx1 - wx0) * k / nm; ctx.fillStyle = '#fbfdfb'; ctx.fillRect(x - fw * 0.4, wy0, fw * 0.8, wy1 - wy0); ctx.fillStyle = 'rgba(0,60,60,0.18)'; ctx.fillRect(x + fw * 0.4, wy0, 1.2, wy1 - wy0); }
  const my = wy0 + (wy1 - wy0) * 0.45; ctx.fillStyle = '#fbfdfb'; ctx.fillRect(wx0, my - fw * 0.35, wx1 - wx0, fw * 0.7);
  ctx.fillStyle = '#e9f2ee'; ctx.fillRect(wx0 - fw * 1.6, wy1, wx1 - wx0 + fw * 3.2, fw * 1.1); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(wx0 - fw * 1.6, wy1 + fw * 1.1, wx1 - wx0 + fw * 3.2, Math.max(2, c * 0.1));
  g = ctx.createLinearGradient(0, wy1 + fw * 1.2, 0, wy1 + fw * 1.2 + c * 1.6); g.addColorStop(0, 'rgba(0,50,50,0.22)'); g.addColorStop(1, 'rgba(0,50,50,0)'); ctx.fillStyle = g; ctx.fillRect(X0, wy1 + fw * 1.2, W, c * 1.6);
  // pale floor with window light patches
  g = ctx.createLinearGradient(0, fy, 0, bottom); g.addColorStop(0, '#d8e3da'); g.addColorStop(1, '#a9bcb0'); ctx.fillStyle = g; ctx.fillRect(X0, fy, W, bottom - fy + 12);
  ctx.fillStyle = '#0f5058'; ctx.fillRect(X0, fy - Math.max(3, c * 0.14), W, Math.max(3, c * 0.14));
  ctx.strokeStyle = 'rgba(40,70,60,0.18)'; ctx.lineWidth = 1.1; ctx.beginPath(); for (let k = 1, y = fy; y < bottom; k++) { y = fy + c * 0.5 * k * (1 + k * 0.25); ctx.moveTo(X0, y); ctx.lineTo(X0 + W, y); } ctx.stroke();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,252,225,0.22)';
  for (let k = 0; k < nm; k++) { const x = wx0 + (wx1 - wx0) * (k + 0.15) / nm, w = (wx1 - wx0) / nm * 0.7, sk = (bottom - fy) * 0.9; ctx.beginPath(); ctx.moveTo(x + sk * 0.5, fy + (bottom - fy) * 0.05); ctx.lineTo(x + w + sk * 0.5, fy + (bottom - fy) * 0.05); ctx.lineTo(x + w + sk * 0.9, bottom); ctx.lineTo(x + sk * 0.9, bottom); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  vignette(ctx, a, 0.14);
}
export function ppUnder(ctx, S) {
  if (S.card || S.lite) return;
  const D = ppDims(S), { r, c, lx, rx, ty, pw } = D, th = Math.max(8, c * 0.36);
  for (const x of [lx, rx]) { castShadow(ctx, x, ty, x, D.a.y + D.a.h, pw, pw * 0.8, 0, 0.26); beam(ctx, x, ty - c * 0.1, x, D.a.y + D.a.h, pw, PP_WOOD, Math.floor(x) + 5); }
  castShadow(ctx, lx, ty, rx, ty, th, 2, th * 0.5, 0.32); beam(ctx, lx - pw * 0.5, ty, rx + pw * 0.5, ty, th, '#e3c28a', 41);
  for (let x = lx + c * 0.4; x < rx; x += c * 1.1) { ctx.fillStyle = '#9a6e36'; ctx.beginPath(); ctx.arc(x, ty + th * 0.1, Math.max(1.4, th * 0.09), 0, TAU); ctx.fill(); }
  // fine silk warp, pairs of teal and ivory ends, with a heddle rod and its loops near the top
  const p = Math.max(2.4, c / 4.8), hy = ty + th + Math.min(c * 0.5, (r.y - ty) * 0.25);
  for (let x = r.x + p * 0.5, i = 0; x < r.x + r.w; x += p, i++) thread(ctx, x, ty + th * 0.4, x, r.y + 2, Math.max(0.9, p * 0.26), i % 4 < 2 ? '#f4f0e0' : '#7fc4c2', 0);
  rod(ctx, lx + pw * 0.3, hy, rx - pw * 0.3, hy, Math.max(4, c * 0.15), '#f1d9a4');
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let x = r.x + p; x < r.x + r.w; x += p * 3) ctx.fillRect(x, hy - 1, 1.2, Math.max(4, c * 0.2));
}
// a small bobbin hanging by its thread: tapered winding of colour between a wooden head and a pointed tail
function bobbin(ctx, x, y, h, col, ang, seed) {
  const w = h * 0.34; ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  softE(ctx, w * 0.3, h * 1.02, w * 0.9, h * 0.07, 0.22);
  ctx.fillStyle = '#9a6a34'; roundRectPath(ctx, -w * 0.6, 0, w * 1.2, h * 0.14, h * 0.05); ctx.fill(); ctx.fillStyle = 'rgba(255,230,180,0.5)'; ctx.fillRect(-w * 0.5, h * 0.02, w, Math.max(1, h * 0.03));
  ctx.beginPath(); ctx.moveTo(-w * 0.55, h * 0.14); ctx.lineTo(w * 0.55, h * 0.14); ctx.lineTo(w * 0.42, h * 0.72); ctx.quadraticCurveTo(0, h * 0.8, -w * 0.42, h * 0.72); ctx.closePath(); ctx.save(); ctx.clip();
  ctx.fillStyle = shade(col, -0.2); ctx.fillRect(-w, 0, w * 2, h);
  for (let k = 0; k < 9; k++) { ctx.fillStyle = k % 2 ? shade(col, 0.12) : shade(col, -0.06); ctx.fillRect(-w, h * 0.14 + k * h * 0.07, w * 2, h * 0.065); }
  const g = ctx.createLinearGradient(-w * 0.55, 0, w * 0.55, 0); g.addColorStop(0, 'rgba(255,255,255,0.05)'); g.addColorStop(0.28, 'rgba(255,255,255,0.6)'); g.addColorStop(0.42, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.42)'); ctx.fillStyle = g; ctx.fillRect(-w, 0, w * 2, h); ctx.restore();
  ctx.fillStyle = '#8a5a2a'; ctx.beginPath(); ctx.moveTo(-w * 0.3, h * 0.72); ctx.lineTo(w * 0.3, h * 0.72); ctx.lineTo(0, h * 1.0); ctx.closePath(); ctx.fill();
  ctx.restore(); void seed;
}
export function ppFrame(ctx, S) {
  if (S.card || S.lite) return;
  const D = ppDims(S), { r, c, lx, rx, bot, by, pw, m, a } = D, t = S.t || 0, cols = S.colors || ['#c2185b', '#79b82c', '#e3a61c', '#f4ecd6', '#1b7fa6'];
  // MANY hanging bobbins: one per colour patch, hanging on their threads from the lower edge of the cloth, each swinging a little
  const n = clamp(Math.round(r.w / (c * 0.6)), 8, 18), hmax = Math.max(c * 0.5, by - bot - c * 0.25);
  for (let k = 0; k < n; k++) {
    const x = r.x + r.w * (k + 0.5) / n + (hash(k, 3) - 0.5) * c * 0.1, len = c * (0.35 + hash(k, 4) * 0.5), bh = Math.min(c * 0.7, hmax * 0.52), tl = Math.min(len, hmax - bh);
    const col = cols[k % cols.length], ang = Math.sin(t * 1.3 + k * 1.7) * (0.05 + 0.02 * hash(k, 6));
    const x0 = x, y0 = bot - c * 0.3, x1 = x + Math.sin(ang) * (tl + bh), y1 = bot + tl;
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = Math.max(1.2, c * 0.05); ctx.beginPath(); ctx.moveTo(x0 + 1, y0 + 1); ctx.lineTo(x1 + 1, y1 + 1); ctx.stroke();
    ctx.strokeStyle = shade(col, -0.1); ctx.lineWidth = Math.max(1, c * 0.04); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.strokeStyle = rgba(shade(col, 0.6), 0.8); ctx.lineWidth = Math.max(0.6, c * 0.014); ctx.beginPath(); ctx.moveTo(x0 - 0.6, y0); ctx.lineTo(x1 - 0.6, y1); ctx.stroke();
    bobbin(ctx, x1, y1, bh, col, ang, k);
  }
  // the cloth beam below: a slim pale beam with the finished silk rolled on it
  const bh2 = Math.max(7, c * 0.36); castShadow(ctx, lx, by + bh2 * 0.5, rx, by + bh2 * 0.5, bh2, 2, bh2 * 0.3, 0.3);
  hbar(ctx, lx - pw * 0.5, by, rx + pw * 0.5, bh2, '#e6c58c', 3);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, by - bh2 * 0.3, r.w, bh2 * 1.1); ctx.clip(); const rg = ctx.createLinearGradient(0, by - bh2 * 0.3, 0, by + bh2 * 0.8); rg.addColorStop(0, shade(S.bg, 0.2)); rg.addColorStop(1, shade(S.bg, -0.5)); ctx.fillStyle = rg; ctx.fillRect(r.x, by - bh2 * 0.3, r.w, bh2 * 1.1); ctx.fillStyle = '#e4b84e'; ctx.fillRect(r.x, by + bh2 * 0.1, r.w, Math.max(1.5, bh2 * 0.12)); ctx.restore();
  const fy2 = by + bh2 + Math.min(c * 0.5, Math.max(0, a.y + a.h - by - bh2) * 0.4);
  if (a.y + a.h - fy2 > c * 0.7) hbar(ctx, lx - pw * 0.4, fy2, rx + pw * 0.4, Math.max(7, c * 0.3), '#c9a064', 3);
  void m;
}
export function ppGround(ctx, S) {
  // tapestry silk: smooth, fine weft rows with a quiet sheen, tiny gold butis at the cell corners, interlocked gold borders top and bottom
  const r = S.rect, c = S.cell, bg = S.bg, p = Math.max(1.4, c / 11);
  ctx.fillStyle = bg; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  ctx.beginPath(); for (let y = r.y; y < r.y + r.h; y += p * 2) ctx.rect(r.x, y, r.w, p * 0.7); ctx.fillStyle = rgba(shade(bg, 0.3), 0.12); ctx.fill();
  ctx.beginPath(); for (let y = r.y + p; y < r.y + r.h; y += p * 2) ctx.rect(r.x, y, r.w, p * 0.45); ctx.fillStyle = rgba(shade(bg, -0.5), 0.16); ctx.fill();
  ctx.fillStyle = rgba('#e8c260', 0.65); ctx.beginPath(); const br = Math.max(0.9, c * 0.03);
  for (let x = r.x + c; x < r.x + r.w - 1; x += c) for (let y = r.y + c; y < r.y + r.h - 1; y += c) { ctx.moveTo(x + br, y); ctx.arc(x, y, br, 0, TAU); } ctx.fill();
  const sg = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); sg.addColorStop(0.2, 'rgba(255,255,240,0)'); sg.addColorStop(0.4, 'rgba(255,255,240,0.2)'); sg.addColorStop(0.56, 'rgba(255,255,240,0)'); sg.addColorStop(0.8, 'rgba(255,255,240,0.1)'); sg.addColorStop(1, 'rgba(255,255,240,0)'); ctx.fillStyle = sg; ctx.fillRect(r.x, r.y, r.w, r.h);
  const bw = Math.max(3, c * 0.2);
  for (const y of [r.y, r.y + r.h - bw]) { const gg = ctx.createLinearGradient(0, y, 0, y + bw); gg.addColorStop(0, '#f3d070'); gg.addColorStop(0.5, '#d6a73a'); gg.addColorStop(1, '#a87a22'); ctx.fillStyle = gg; ctx.fillRect(r.x, y, r.w, bw); ctx.fillStyle = 'rgba(70,40,0,0.45)'; ctx.beginPath(); for (let x = r.x; x < r.x + r.w; x += bw * 0.9) { ctx.moveTo(x, y + bw); ctx.lineTo(x + bw * 0.45, y + bw * 0.1); ctx.lineTo(x + bw * 0.9, y + bw); } ctx.fill(); }
  ctx.restore();
}
export function ppOver(ctx, S) {
  const r = S.rect, c = S.cell, e = Math.max(5, c * 0.35);
  const tg = ctx.createLinearGradient(0, r.y, 0, r.y + e); tg.addColorStop(0, 'rgba(0,30,40,0.26)'); tg.addColorStop(1, 'rgba(0,30,40,0)'); ctx.fillStyle = tg; ctx.fillRect(r.x, r.y, r.w, e);
  const lg = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); lg.addColorStop(0, 'rgba(255,255,235,0.1)'); lg.addColorStop(0.5, 'rgba(255,255,235,0)'); lg.addColorStop(1, 'rgba(0,20,30,0.2)'); ctx.fillStyle = lg; ctx.fillRect(r.x, r.y, r.w, r.h);
}
// tapestry skin: smooth weft-faced blocks (no floats), the colour patches meeting in small interlocking steps, with a fine gold line round the motif
export function tapestrySkin(ctx, d, o = {}) {
  const { kind, col, x, y, s, key } = d, fill = isFilled(kind), h = s / 2, n = o.n ?? 14, p = s / n, lw = lineWidthOf(kind, s);
  if (!fill) {
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,20,30,0.38)'; ctx.lineWidth = lw + 2; ctx.save(); ctx.translate(lw * 0.1, lw * 0.2); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = shade(col, -0.35); ctx.lineWidth = lw; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw * 0.75; ctx.stroke();
    ctx.strokeStyle = rgba('#f1cd68', 0.9); ctx.lineWidth = Math.max(0.8, lw * 0.18); ctx.stroke(); ctx.strokeStyle = rgba(shade(col, 0.7), 0.7); ctx.lineWidth = Math.max(0.6, lw * 0.12); ctx.save(); ctx.translate(-lw * 0.14, -lw * 0.2); ctx.stroke(); ctx.restore(); ctx.restore(); return;
  }
  ctx.save(); ctx.translate(s * 0.02, s * 0.03); motifPath(ctx, kind, x, y, s); ctx.fillStyle = 'rgba(0,25,35,0.3)'; ctx.fill(); ctx.restore();
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.fillStyle = shade(col, -0.05); ctx.fill(); ctx.clip();
  const lo = [], hi = [];
  for (let j = 0; j <= n; j++) { const yy = y - h + j * p; lo.push([x - h - 1, yy + p * 0.62, s + 2, p * 0.38]); if (j % 2) hi.push([x - h - 1, yy, s + 2, p * 0.32]); }
  ctx.fillStyle = rgba(shade(col, -0.45), 0.2); ctx.beginPath(); for (const q of lo) ctx.rect(q[0], q[1], q[2], q[3]); ctx.fill();
  ctx.fillStyle = rgba(shade(col, 0.4), 0.16); ctx.beginPath(); for (const q of hi) ctx.rect(q[0], q[1], q[2], q[3]); ctx.fill();
  // weft turning back at the colour change: a stepped zigzag just inside the edge
  motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'miter'; ctx.setLineDash([p * 0.8, p * 0.8]); ctx.strokeStyle = rgba(shade(col, -0.55), 0.5); ctx.lineWidth = p * 1.7; ctx.stroke(); ctx.setLineDash([p * 0.8, p * 0.8]); ctx.lineDashOffset = p * 0.8; ctx.strokeStyle = rgba(shade(col, 0.45), 0.35); ctx.lineWidth = p * 1.1; ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
  const sg = ctx.createLinearGradient(x - h, y - h, x + h, y + h); sg.addColorStop(0.2, 'rgba(255,255,245,0)'); sg.addColorStop(0.42, 'rgba(255,255,245,0.26)'); sg.addColorStop(0.58, 'rgba(255,255,245,0)'); ctx.fillStyle = sg; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  const og = ctx.createRadialGradient(x - s * 0.2, y - s * 0.25, s * 0.08, x, y, s * 0.68); og.addColorStop(0, 'rgba(255,255,240,0.1)'); og.addColorStop(1, 'rgba(0,20,30,0.3)'); ctx.fillStyle = og; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  ctx.restore();
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba('#6a4a10', 0.7); ctx.lineWidth = Math.max(1.6, s * 0.052); ctx.stroke(); ctx.strokeStyle = '#f0cc66'; ctx.lineWidth = Math.max(1, s * 0.034); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,250,215,0.75)'; ctx.lineWidth = Math.max(0.6, s * 0.012); ctx.save(); ctx.translate(-s * 0.01, -s * 0.012); ctx.stroke(); ctx.restore(); ctx.restore(); void key;
}

// ===================================================================================================================================================
// BALUCHARI: a bamboo frame and a hanging lantern in a mud-walled courtyard at dusk, terracotta pots by the wall; dark silk with vertical silk floats
// ===================================================================================================================================================
const BO = '#b9a94c';
function bambooV(ctx, x, y1, w, y2, nodeStep, seed) {
  vbar(ctx, x, y1, w, y2, BO, 3);
  for (let y = y1 + nodeStep * (0.3 + hash(seed, 1) * 0.5); y < y2; y += nodeStep) { ctx.fillStyle = 'rgba(70,56,10,0.7)'; ctx.fillRect(x - w * 0.04, y, w * 1.08, Math.max(2, w * 0.14)); ctx.fillStyle = 'rgba(255,245,170,0.5)'; ctx.fillRect(x + w * 0.1, y - 1, w * 0.3, 1.5); }
}
function bambooH(ctx, x1, y, x2, h, nodeStep, seed) {
  hbar(ctx, x1, y, x2, h, BO, 3);
  for (let x = x1 + nodeStep * (0.3 + hash(seed, 2) * 0.5); x < x2; x += nodeStep) { ctx.fillStyle = 'rgba(70,56,10,0.7)'; ctx.fillRect(x, y - h * 0.04, Math.max(2, h * 0.14), h * 1.08); }
}
function lash(ctx, x, y, w, h) { // cord wraps at a joint
  ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = Math.max(1.3, Math.min(w, h) * 0.12); ctx.beginPath(); for (let k = 0; k < 5; k++) { ctx.moveTo(x - w / 2, y - h / 2 + (k + 0.3) * h / 5); ctx.lineTo(x + w / 2, y - h / 2 + (k + 0.7) * h / 5); } ctx.stroke();
  ctx.strokeStyle = 'rgba(255,214,150,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 5; k++) { ctx.moveTo(x - w / 2, y - h / 2 + (k + 0.3) * h / 5 - 1); ctx.lineTo(x + w / 2, y - h / 2 + (k + 0.7) * h / 5 - 1); } ctx.stroke();
}
// a plain round terracotta water pot (narrow neck, rolled rim, a few incised rings), seen from the front
function claypot(ctx, x, yb, r, seed, lit = 1) {
  softE(ctx, x + r * 0.2, yb + r * 0.04, r * 0.95, r * 0.14, 0.4);
  const g = ctx.createLinearGradient(x - r, 0, x + r, 0); g.addColorStop(0, shade('#d9855a', 0.2 * lit)); g.addColorStop(0.35, '#b85a34'); g.addColorStop(1, '#4e2214');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - r * 0.3, yb - r * 1.78); ctx.bezierCurveTo(x - r * 0.34, yb - r * 1.55, x - r * 1.0, yb - r * 1.5, x - r * 0.98, yb - r * 0.75); ctx.bezierCurveTo(x - r * 0.95, yb - r * 0.1, x - r * 0.5, yb, x, yb); ctx.bezierCurveTo(x + r * 0.5, yb, x + r * 0.95, yb - r * 0.1, x + r * 0.98, yb - r * 0.75); ctx.bezierCurveTo(x + r * 1.0, yb - r * 1.5, x + r * 0.34, yb - r * 1.55, x + r * 0.3, yb - r * 1.78); ctx.closePath(); ctx.fill();
  ctx.fillStyle = shade('#c0663a', 0.1); ctx.beginPath(); ctx.ellipse(x, yb - r * 1.8, r * 0.38, r * 0.1, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a0f06'; ctx.beginPath(); ctx.ellipse(x, yb - r * 1.8, r * 0.27, r * 0.06, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(60,20,8,0.45)'; ctx.lineWidth = Math.max(1, r * 0.04); for (const f of [0.95, 1.12, 1.3]) { ctx.beginPath(); ctx.ellipse(x, yb - r * f, r * (0.95 - Math.abs(f - 1.05) * 0.2), r * 0.06, 0, 0.1, Math.PI - 0.1); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,225,190,0.35)'; ctx.beginPath(); ctx.ellipse(x - r * 0.5, yb - r * 0.95, r * 0.09, r * 0.45, 0.25, 0, TAU); ctx.fill(); void seed;
}
export function baEnv(ctx, S) {
  const a = S.area, b = S.box, c = S.cell, X0 = a.x - 12, W = a.w + 24, t = S.t || 0, land = isLand(S), top = a.y, bottom = a.y + a.h;
  const fy = b.y + b.h * (land ? 0.84 : 0.87), wt = top + a.h * 0.08;
  // a strip of dusk sky above the wall
  let g = ctx.createLinearGradient(0, top, 0, wt + 4); g.addColorStop(0, '#3b3466'); g.addColorStop(1, '#b4707e'); ctx.fillStyle = g; ctx.fillRect(X0, top, W, wt - top + 4);
  // mud wall: cool lilac dusk on the shaded side, warm where the lantern reaches
  g = ctx.createLinearGradient(0, wt, 0, fy); g.addColorStop(0, '#7a6270'); g.addColorStop(0.5, '#8c6a58'); g.addColorStop(1, '#6a4c3a'); ctx.fillStyle = g; ctx.fillRect(X0, wt, W, fy - wt + 1);
  for (let k = 0; k < 16; k++) { const px = a.x + hash(k, 1) * a.w, py = wt + hash(k, 2) * (fy - wt), pr = c * (2 + hash(k, 3) * 4); glow(ctx, px, py, pr, hash(k, 4) > 0.5 ? '#c49a76' : '#3a2a30', 0.16); }
  // layers of rammed mud and hairline cracks
  ctx.strokeStyle = 'rgba(40,22,14,0.22)'; ctx.lineWidth = Math.max(1, c * 0.04); ctx.beginPath(); for (let y = wt + c * 1.6, i = 0; y < fy; y += c * (1.5 + hash(i, 5) * 1.2), i++) { ctx.moveTo(X0, y); for (let x = X0; x < X0 + W; x += c * 2) ctx.lineTo(x + c * 2, y + (hash(i, Math.floor(x)) - 0.5) * c * 0.15); } ctx.stroke();
  ctx.strokeStyle = 'rgba(30,16,10,0.3)'; ctx.beginPath(); for (let k = 0; k < 12; k++) { let x = a.x + hash(k, 8) * a.w, y = wt + hash(k, 9) * (fy - wt) * 0.8; ctx.moveTo(x, y); for (let q = 0; q < 4; q++) { x += (hash(k, q, 3) - 0.5) * c * 0.8; y += c * (0.3 + hash(k, q, 4) * 0.6); ctx.lineTo(x, y); } } ctx.stroke();
  speck(ctx, { x: X0, y: wt, w: W, h: fy - wt }, 260, ['#2a1a14', '#e0c8a8', '#b49060'], 0.12, Math.max(1, c * 0.05), 5);
  // low thatched eave: straw bands hanging over the top of the wall
  const eh = c * 0.9; g = ctx.createLinearGradient(0, wt - c * 0.2, 0, wt + eh); g.addColorStop(0, '#c3a05a'); g.addColorStop(1, '#6e5228'); ctx.fillStyle = g; ctx.fillRect(X0, wt - c * 0.2, W, eh + c * 0.2);
  ctx.strokeStyle = 'rgba(40,26,8,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = X0; x < X0 + W; x += Math.max(3, c * 0.14)) { ctx.moveTo(x, wt - c * 0.2); ctx.lineTo(x + (hash(Math.floor(x), 1) - 0.5) * 3, wt + eh * (0.7 + hash(Math.floor(x), 2) * 0.35)); } ctx.stroke();
  ctx.fillStyle = 'rgba(20,10,10,0.35)'; ctx.fillRect(X0, wt + eh, W, c * 0.12); g = ctx.createLinearGradient(0, wt + eh, 0, wt + eh + c * 1.4); g.addColorStop(0, 'rgba(20,10,20,0.4)'); g.addColorStop(1, 'rgba(20,10,20,0)'); ctx.fillStyle = g; ctx.fillRect(X0, wt + eh, W, c * 1.4);
  // swept earth floor with broom arcs
  g = ctx.createLinearGradient(0, fy, 0, bottom); g.addColorStop(0, '#7b5a42'); g.addColorStop(1, '#3f2c20'); ctx.fillStyle = g; ctx.fillRect(X0, fy, W, bottom - fy + 12);
  ctx.fillStyle = 'rgba(255,200,150,0.2)'; ctx.fillRect(X0, fy, W, Math.max(1.4, c * 0.05));
  ctx.strokeStyle = 'rgba(255,225,190,0.12)'; ctx.lineWidth = Math.max(1, c * 0.04); ctx.beginPath(); for (let k = 0; k < 16; k++) { const cx = a.x + hash(k, 11) * a.w, cy = fy + (bottom - fy) * (0.1 + hash(k, 12) * 0.85), rr = c * (1.5 + hash(k, 13) * 2); ctx.moveTo(cx + rr, cy); ctx.arc(cx, cy, rr, 0, Math.PI * (0.5 + hash(k, 14) * 0.4)); } ctx.stroke();
  speck(ctx, { x: X0, y: fy, w: W, h: bottom - fy }, 140, ['#1e1410', '#d8bd98'], 0.12, Math.max(1, c * 0.04), 12);
  // terracotta pots along the foot of the wall
  const pots = [[0.07, 1.0], [0.16, 0.72], [0.93, 0.95], [0.84, 0.68]];
  for (let k = 0; k < pots.length; k++) { const [fx, sc] = pots[k]; claypot(ctx, a.x + a.w * fx, fy + c * (0.35 + 0.35 * (k % 2)), c * 0.9 * sc, k); }
  vignette(ctx, a, 0.42);
}
function baDims(S) {
  const { a, r, c, m, land, b } = geo(S), pw = Math.max(9, c * 0.4), inset = Math.max(pw * 0.9, Math.min(m.l, m.r) * 0.5);
  const lx = Math.max(a.x + pw * 0.6, r.x - inset), rx = Math.min(a.x + a.w - pw * 0.6, r.x + r.w + inset);
  const H = r.y - b.y, ty = b.y + Math.max(c * 0.22, Math.min(c * 0.42, H * 0.16)), bot = r.y + r.h;
  return { a, r, c, m, land, b, pw, lx, rx, ty, bot, H };
}
export function baUnder(ctx, S) {
  if (S.card || S.lite) return;
  const D = baDims(S), { r, c, lx, rx, ty, pw } = D, th = Math.max(8, c * 0.36);
  for (const x of [lx, rx]) { castShadow(ctx, x - pw / 2, ty, x - pw / 2, D.a.y + D.a.h, pw, pw * 0.8, 0, 0.3); bambooV(ctx, x - pw / 2, ty - c * 0.15, pw, D.a.y + D.a.h, c * 2.3, Math.floor(x)); lash(ctx, x, ty + th * 0.4, pw * 1.2, th * 1.4); }
  castShadow(ctx, lx, ty, rx, ty, th, 2, th * 0.5, 0.35); bambooH(ctx, lx - pw * 0.7, ty, rx + pw * 0.7, th, c * 2.6, 3);
  // dark silk warp with a blue-black sheen, pairs of ends
  const p = Math.max(2.4, c / 4.8);
  for (let x = r.x + p * 0.5, i = 0; x < r.x + r.w; x += p, i++) thread(ctx, x, ty + th * 0.4, x, r.y + 2, Math.max(1, p * 0.3), i % 5 === 0 ? '#5d4f93' : i % 2 ? '#2f2152' : '#3b2c66', 0);
}
export function baFrame(ctx, S) {
  if (S.card || S.lite) return;
  const D = baDims(S), { r, c, lx, rx, ty, bot, pw, m, a, b } = D, t = S.t || 0, th = Math.max(8, c * 0.36);
  // the pattern sheet (a graph of coloured blocks, no writing) hung on the left post, and a peg bar of silk skeins on the right
  const sw = Math.min(c * 1.3, Math.max(0, r.x - (lx + pw * 0.6)) + c * 0.1);
  // the lantern: a tin frame with glowing glass hangs from the top bamboo on a cord
  const lxp = rx - c * 1.0, lyp = ty + th * 0.8, lw = c * 0.62, lh = c * 1.0, sway = Math.sin(t * 0.8) * c * 0.04;
  ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = Math.max(1.3, c * 0.04); ctx.beginPath(); ctx.moveTo(lxp, ty + th * 0.5); ctx.lineTo(lxp + sway, lyp + c * 0.25); ctx.stroke();
  ctx.save(); ctx.translate(lxp + sway, lyp + c * 0.25);
  glow(ctx, 0, lh * 0.5, c * 3.4, '#ffb347', 0.5);
  ctx.fillStyle = '#25160e'; roundRectPath(ctx, -lw * 0.55, 0, lw * 1.1, lh * 0.12, 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(-lw * 0.55, 0); ctx.lineTo(0, -lh * 0.22); ctx.lineTo(lw * 0.55, 0); ctx.closePath(); ctx.fill();
  const gg = ctx.createLinearGradient(0, lh * 0.12, 0, lh * 0.9); gg.addColorStop(0, '#fff6c8'); gg.addColorStop(0.55, '#ffc44a'); gg.addColorStop(1, '#e68a1c'); ctx.fillStyle = gg; ctx.fillRect(-lw * 0.45, lh * 0.12, lw * 0.9, lh * 0.76);
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-lw * 0.18, lh * 0.2, lw * 0.12, lh * 0.5);
  ctx.strokeStyle = '#25160e'; ctx.lineWidth = Math.max(1.2, c * 0.035); ctx.strokeRect(-lw * 0.45, lh * 0.12, lw * 0.9, lh * 0.76); ctx.beginPath(); ctx.moveTo(0, lh * 0.12); ctx.lineTo(0, lh * 0.88); ctx.stroke();
  ctx.fillStyle = '#25160e'; roundRectPath(ctx, -lw * 0.55, lh * 0.88, lw * 1.1, lh * 0.12, 2); ctx.fill();
  ctx.restore();
  // lower bamboo cross-bar (the cloth beam) with lashings, a few silk skeins resting on it
  const by = bot + Math.min(c * 0.35, m.b * 0.2), bh = Math.max(8, c * 0.36);
  castShadow(ctx, lx, by + bh * 0.5, rx, by + bh * 0.5, bh, 2, bh * 0.3, 0.35); bambooH(ctx, lx - pw * 0.7, by, rx + pw * 0.7, bh, c * 2.6, 9);
  for (const x of [lx, rx]) lash(ctx, x, by + bh * 0.5, pw * 1.2, bh * 1.4);
  const sk = ['#e9a23b', '#c9475f', '#f2e8d2', '#4f9a52'];
  for (let k = 0; k < 4; k++) { const x = r.x + r.w * (0.18 + 0.2 * k), rr = Math.min(c * 0.5, Math.max(4, m.b * 0.2)); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x + 2, by + 1, rr * 1.1, rr * 0.3, 0, 0, TAU); ctx.fill(); for (let q = 0; q < 6; q++) { ctx.strokeStyle = q % 2 ? shade(sk[k], 0.25) : shade(sk[k], -0.15); ctx.lineWidth = Math.max(1.2, rr * 0.2); ctx.beginPath(); ctx.ellipse(x, by - rr * 0.3, rr * (1 - q * 0.08), rr * 0.55, 0, Math.PI, TAU); ctx.stroke(); } }
  void sw; void a; void b;
}
export function baGround(ctx, S) {
  // dark silk: long warp floats make a deep blue-black satin with a lilac sheen
  const r = S.rect, c = S.cell, bg = S.bg, p = Math.max(1.6, c / 12);
  ctx.fillStyle = bg; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  ctx.beginPath(); for (let x = r.x + p * 0.5, i = 0; x < r.x + r.w; x += p * 2, i++) { ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); } ctx.strokeStyle = rgba(mix(bg, '#9a86e0', 0.4), 0.3); ctx.lineWidth = p * 0.8; ctx.stroke();
  ctx.beginPath(); for (let x = r.x + p * 1.5; x < r.x + r.w; x += p * 2) { ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); } ctx.strokeStyle = rgba('#000', 0.28); ctx.lineWidth = p * 0.6; ctx.stroke();
  for (const [u, w, al] of [[0.3, 0.18, 0.22], [0.78, 0.1, 0.1]]) { const sg = ctx.createLinearGradient(r.x + r.w * (u - w), r.y, r.x + r.w * (u + w) + r.h * 0.2, r.y + r.h); sg.addColorStop(0, 'rgba(190,170,255,0)'); sg.addColorStop(0.5, `rgba(190,170,255,${al})`); sg.addColorStop(1, 'rgba(190,170,255,0)'); ctx.fillStyle = sg; ctx.fillRect(r.x, r.y, r.w, r.h); }
  // narrow border panels at both selvedges: cream and rose floats in short dashes
  const bw = Math.max(4, c * 0.2);
  for (const x of [r.x, r.x + r.w - bw]) { ctx.fillStyle = rgba(shade(bg, 0.2), 0.9); ctx.fillRect(x, r.y, bw, r.h); ctx.fillStyle = '#e9d8ae'; ctx.fillRect(x + bw * 0.14, r.y, Math.max(1, bw * 0.12), r.h); ctx.fillRect(x + bw * 0.74, r.y, Math.max(1, bw * 0.12), r.h); ctx.fillStyle = '#c9475f'; ctx.beginPath(); for (let y = r.y; y < r.y + r.h; y += bw * 1.2) ctx.rect(x + bw * 0.34, y, bw * 0.32, bw * 0.7); ctx.fill(); }
  ctx.restore();
}
export function baOver(ctx, S) {
  const r = S.rect, c = S.cell, a = S.area, e = Math.max(5, c * 0.4);
  const tg = ctx.createLinearGradient(0, r.y, 0, r.y + e); tg.addColorStop(0, 'rgba(0,0,10,0.34)'); tg.addColorStop(1, 'rgba(0,0,10,0)'); ctx.fillStyle = tg; ctx.fillRect(r.x, r.y, r.w, e);
  // lantern light pooling from the upper right
  const g = ctx.createRadialGradient(r.x + r.w * 0.9, r.y, c, r.x + r.w * 0.9, r.y, Math.max(r.w, r.h) * 1.2); g.addColorStop(0, 'rgba(255,190,90,0.26)'); g.addColorStop(0.5, 'rgba(255,170,80,0.07)'); g.addColorStop(1, 'rgba(10,0,30,0.3)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h); void a;
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// supplies and tools
// ---------------------------------------------------------------------------------------------------------------------------------------------------
Object.assign(POT, {
  // a tiny wooden bobbin with a tapered winding of silk, as hangs from the cloth
  tinybobbin(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; backTile(ctx, b, '#0e3a42', 0.6);
    ctx.save(); ctx.translate(cx, cy + lift - r * 0.62); softE(ctx, r * 0.1, r * 1.5, r * 0.5, r * 0.09);
    ctx.strokeStyle = shade(col, 0.1); ctx.lineWidth = Math.max(1.2, r * 0.05); ctx.beginPath(); ctx.moveTo(0, -r * 0.14); ctx.quadraticCurveTo(r * 0.25, -r * 0.05, r * 0.5, -r * 0.18); ctx.stroke();
    bobbin(ctx, 0, 0, r * 1.5, col, 0.12, 2); ctx.restore(); ringSel(ctx, S, b, on);
  },
  // a cone of dark-dyed silk on a bamboo spindle: stacked diagonal winding with a bright side
  silkcone(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; backTile(ctx, b, '#150c24', 0.6);
    ctx.save(); ctx.translate(cx, cy + lift); softE(ctx, r * 0.1, r * 0.8, r * 0.5, r * 0.09);
    ctx.fillStyle = BO; ctx.fillRect(-r * 0.07, -r * 0.88, r * 0.14, r * 1.7);
    ctx.beginPath(); ctx.moveTo(-r * 0.2, -r * 0.7); ctx.lineTo(r * 0.2, -r * 0.7); ctx.lineTo(r * 0.52, r * 0.7); ctx.lineTo(-r * 0.52, r * 0.7); ctx.closePath(); ctx.save(); ctx.clip();
    ctx.fillStyle = shade(col, -0.2); ctx.fillRect(-r, -r, r * 2, r * 2); for (let k = 0; k < 16; k++) { ctx.strokeStyle = k % 2 ? shade(col, 0.2) : shade(col, -0.1); ctx.lineWidth = r * 0.085; ctx.beginPath(); ctx.moveTo(-r, -r * 0.7 + k * r * 0.1 - r * 0.2); ctx.lineTo(r, -r * 0.7 + k * r * 0.1 + r * 0.2); ctx.stroke(); }
    const g = ctx.createLinearGradient(-r * 0.5, 0, r * 0.5, 0); g.addColorStop(0, 'rgba(255,255,255,0.05)'); g.addColorStop(0.3, 'rgba(255,255,255,0.55)'); g.addColorStop(0.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)'); ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2); ctx.restore();
    ctx.fillStyle = '#6a4a22'; roundRectPath(ctx, -r * 0.58, r * 0.66, r * 1.16, r * 0.16, 3); ctx.fill();
    ctx.restore(); ringSel(ctx, S, b, on);
  },
});
Object.assign(TOOLS, {
  // a hanging bobbin: the thread comes down from the touched cell and the bobbin swings, settling after each placement
  bobbinswing(ctx, S, T) {
    const u = T.u, k = Math.exp(-T.a * 3.2), ang = Math.sin(T.a * 11) * 0.55 * k + Math.sin(T.t * 1.6) * 0.03, L = u * 0.85, bh = u * 0.95;
    const x1 = T.x + Math.sin(ang) * L, y1 = T.y + Math.cos(ang) * L * 0.3 + u * 0.15;
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = Math.max(1.3, u * 0.05); ctx.beginPath(); ctx.moveTo(T.x + 1, T.y + 1); ctx.lineTo(x1 + 1, y1 + 1 + L * 0.7); ctx.stroke();
    ctx.strokeStyle = shade(T.col, -0.1); ctx.lineWidth = Math.max(1.1, u * 0.04); ctx.beginPath(); ctx.moveTo(T.x, T.y); ctx.lineTo(x1, y1 + L * 0.7); ctx.stroke(); ctx.strokeStyle = rgba(shade(T.col, 0.6), 0.8); ctx.lineWidth = Math.max(0.6, u * 0.015); ctx.beginPath(); ctx.moveTo(T.x - 0.7, T.y); ctx.lineTo(x1 - 0.7, y1 + L * 0.7); ctx.stroke();
    bobbin(ctx, x1, y1 + L * 0.7, bh, T.col, ang * 0.8, 1);
  },
  // a flat bamboo pick-up stick with a pointed tip and a loop of silk, slid under the floats
  pickstick(ctx, S, T) {
    const u = T.u, p = pressOf(T), Lg = u * 3.0, H = u * 0.2, lift = p * u * 0.1;
    softE(ctx, T.x + Lg * 0.45 + 3, T.y + u * 0.12, Lg * 0.46, H * 0.55);
    ctx.save(); ctx.translate(T.x + Lg * 0.5, T.y - H * 0.5 - lift); ctx.rotate(-0.1 + p * 0.04);
    const g = ctx.createLinearGradient(0, -H, 0, H); g.addColorStop(0, '#f1e090'); g.addColorStop(0.5, '#b9a94c'); g.addColorStop(1, '#6a5a1a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-Lg / 2, 0); ctx.lineTo(-Lg * 0.38, -H * 0.5); ctx.lineTo(Lg / 2, -H * 0.6); ctx.lineTo(Lg / 2, H * 0.6); ctx.lineTo(-Lg * 0.38, H * 0.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(70,56,10,0.7)'; ctx.fillRect(Lg * 0.12, -H * 0.6, Math.max(2, u * 0.06), H * 1.2); ctx.fillStyle = 'rgba(255,248,190,0.6)'; ctx.fillRect(-Lg * 0.3, -H * 0.4, Lg * 0.7, Math.max(1, H * 0.15));
    ctx.strokeStyle = T.col; ctx.lineWidth = Math.max(1.4, u * 0.06); ctx.beginPath(); ctx.arc(Lg * 0.36, 0, u * 0.2, 0, TAU); ctx.stroke();
    ctx.restore();
    sheenLine(ctx, [[T.x, T.y - H * 0.4], [T.x - u * 0.5, T.y - H * 0.1 + Math.sin(T.t * 3) * u * 0.03], [T.x - u * 1.0, T.y + u * 0.14]], Math.max(1.3, u * 0.05), T.col);
  },
});
void zariSkin;

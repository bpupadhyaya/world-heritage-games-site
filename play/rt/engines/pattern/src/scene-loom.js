// Scene art, 1.12.0 (looms and bands): shared loom helpers, tools, supply vessels and woven cell skins.
// Pure canvas 2D, no Math.random (hash only). Scene objects live in scenes-l.js.
import { hash, rgba, mix, shade, roundRectPath, rod, ball, speck, lines, glow, TAU, motifPath, isFilled, lineWidthOf, clamp, sheenLine, poly, SKIN, POT } from './scene-kit.js';
import { TOOLS } from './scene-tools.js';

export const isLand = (S) => S.area.w > S.area.h * 1.15;
// frame margins: free room between the board and its box
export const margins = (S) => { const b = S.box, r = S.rect; return { l: r.x - b.x, r: b.x + b.w - (r.x + r.w), t: r.y - b.y, b: b.y + b.h - (r.y + r.h) }; };

// a lit wooden beam from (x1,y1) to (x2,y2) with grain, a bright top edge and a dark underside
export function beam(ctx, x1, y1, x2, y2, w, wood, seed = 1) {
  rod(ctx, x1, y1, x2, y2, w, wood);
  const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L, nx = -uy, ny = ux;
  ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = rgba(shade(wood, -0.55), 0.4); ctx.lineWidth = Math.max(0.7, w * 0.035);
  ctx.beginPath();
  for (let k = 0; k < 6; k++) {
    const off = (hash(k, seed) - 0.5) * w * 0.7;
    let t = hash(k, seed, 4) * 0.2;
    while (t < 0.95) { const len = (0.1 + hash(k, seed, Math.floor(t * 40)) * 0.35) * L; const a = Math.min(L, t * L), b = Math.min(L, t * L + len); ctx.moveTo(x1 + ux * a + nx * off, y1 + uy * a + ny * off); ctx.lineTo(x1 + ux * b + nx * (off + (hash(k, seed, 9) - 0.5) * w * 0.05), y1 + uy * b + ny * (off + (hash(k, seed, 9) - 0.5) * w * 0.05)); t += len / L + 0.08 + hash(k, seed, 7) * 0.2; }
  }
  ctx.stroke(); ctx.restore();
}
// a soft cast shadow of a long object
export function castShadow(ctx, x1, y1, x2, y2, w, dx, dy, a = 0.3) {
  ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = `rgba(0,0,0,${a})`; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1 + dx, y1 + dy); ctx.lineTo(x2 + dx, y2 + dy); ctx.stroke(); ctx.restore();
}
// one taut thread: shadow, body, bright highlight
export function thread(ctx, x1, y1, x2, y2, w, col, sh = 1) {
  if (sh) { ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = w * 1.2; ctx.beginPath(); ctx.moveTo(x1 + w * 0.5, y1 + w * 0.8); ctx.lineTo(x2 + w * 0.5, y2 + w * 0.8); ctx.stroke(); ctx.restore(); }
  ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = shade(col, -0.25); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = w * 0.62; ctx.beginPath(); ctx.moveTo(x1 - w * 0.1, y1 - w * 0.1); ctx.lineTo(x2 - w * 0.1, y2 - w * 0.1); ctx.stroke();
  ctx.strokeStyle = rgba(shade(col, 0.7), 0.7); ctx.lineWidth = Math.max(0.6, w * 0.2); ctx.beginPath(); ctx.moveTo(x1 - w * 0.25, y1 - w * 0.25); ctx.lineTo(x2 - w * 0.25, y2 - w * 0.25); ctx.stroke(); ctx.restore();
}
export const rect3 = (ctx, x, y, w, h, c, r = 0) => { const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, shade(c, 0.22)); g.addColorStop(0.5, c); g.addColorStop(1, shade(c, -0.4)); ctx.fillStyle = g; if (r) { roundRectPath(ctx, x, y, w, h, r); ctx.fill(); } else ctx.fillRect(x, y, w, h); };

// ===================================================================================================================================================
// WARP-WEIGHTED LOOM: an upright loom, warp threads hung in bunches from a log and kept taut by rings of fired clay
// ===================================================================================================================================================
export const WW_WOOL = '#e4d9bf';
// a ring-shaped loom weight of clay, hanging by its bunch of threads (seen face on, lit from the upper left)
function clayWeight(ctx, x, y, w, h, seed) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.ellipse(w * 0.14, h * 0.58, w * 0.52, h * 0.1, 0, 0, TAU); ctx.fill();
  const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, '#e0a27a'); g.addColorStop(0.45, '#b56a44'); g.addColorStop(1, '#5a2a18');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-w * 0.34, -h * 0.5); ctx.lineTo(w * 0.34, -h * 0.5); ctx.quadraticCurveTo(w * 0.62, 0, w * 0.5, h * 0.5); ctx.lineTo(-w * 0.5, h * 0.5); ctx.quadraticCurveTo(-w * 0.62, 0, -w * 0.34, -h * 0.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1c0e08'; ctx.beginPath(); ctx.ellipse(0, -h * 0.14, w * 0.15, h * 0.12, 0, 0, TAU); ctx.fill(); // the hole the cord goes through
  ctx.strokeStyle = 'rgba(255,225,190,0.5)'; ctx.lineWidth = Math.max(1, w * 0.05); ctx.beginPath(); ctx.moveTo(-w * 0.4, -h * 0.4); ctx.quadraticCurveTo(-w * 0.52, 0, -w * 0.42, h * 0.38); ctx.stroke();
  ctx.fillStyle = 'rgba(40,12,4,0.28)'; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.arc((hash(k, seed) - 0.5) * w * 0.7, (hash(k, seed, 2) - 0.3) * h * 0.8, Math.max(0.7, w * 0.03), 0, TAU); ctx.fill(); } // grit
  ctx.restore();
}
function wwGeom(S) {
  const a = S.area, b = S.box, r = S.rect, c = S.cell, m = margins(S), pwid = Math.max(8, c * 0.42), inset = Math.max(pwid * 0.9, Math.min(m.l, m.r) * 0.6);
  const lx = Math.max(a.x + pwid * 0.6, r.x - inset), rx = Math.min(a.x + a.w - pwid * 0.6, r.x + r.w + inset);
  const top = Math.max(a.y, b.y), bottom = Math.min(a.y + a.h, b.y + b.h + c * 0.35);
  const logw = Math.max(9, Math.min(c * 0.42, m.t * 0.5)), ty = Math.max(top + logw * 0.6, r.y - Math.max(c * 0.5, m.t * 0.7));
  const n = clamp(Math.round(r.w / (c * 1.2)), 3, 7), ht = clamp(m.b * 0.8, c * 0.8, c * 1.7), wd = Math.min(r.w / n * 0.8, ht * 0.85);
  return { lx, rx, top, bottom, pwid, logw, ty, n, ht, wd, yb: r.y + r.h + Math.max(c * 0.5, m.b * 0.3) };
}
export function warpweightEnv(ctx, S) {
  const a = S.area, X0 = a.x - 12, W = a.w + 24, c = S.cell;
  // timber hall at dusk: vertical planks, a banked hearth glow low on the left, packed-earth floor
  const wg = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); wg.addColorStop(0, '#271d17'); wg.addColorStop(1, '#3a2a1e'); ctx.fillStyle = wg; ctx.fillRect(X0, a.y, W, a.h);
  const pw = c * 1.55;
  for (let x = X0, i = 0; x < X0 + W; x += pw, i++) { ctx.fillStyle = rgba(hash(i, 3) > 0.5 ? '#000' : '#fff', 0.05 + hash(i, 4) * 0.04); ctx.fillRect(x, a.y, pw, a.h); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x, a.y, 1.6, a.h); }
  lines(ctx, { x: X0, y: a.y, w: W, h: a.h }, 'v', c * 0.2, '#000', 0.12, 1, 3, 5);
  const fy = a.y + a.h * 0.88; const fg = ctx.createLinearGradient(0, fy, 0, a.y + a.h); fg.addColorStop(0, '#47321f'); fg.addColorStop(1, '#241810'); ctx.fillStyle = fg; ctx.fillRect(X0, fy, W, a.y + a.h - fy + 12);
  ctx.fillStyle = 'rgba(255,200,140,0.2)'; ctx.fillRect(X0, fy, W, Math.max(1.4, c * 0.05));
  glow(ctx, a.x + a.w * 0.08, a.y + a.h * 0.95, Math.max(a.w, a.h) * 0.75, '#ff9a4a', 0.34); glow(ctx, a.x + a.w * 0.5, a.y, a.w * 0.7, '#ffe2b0', 0.1);
  speck(ctx, a, 160, ['#000', '#d8b68a'], 0.08, 1.6, 9);
  if (S.card) return;
  const g = wwGeom(S);
  for (const [x, lean] of [[g.lx, 0.02], [g.rx, -0.02]]) { castShadow(ctx, x, g.top, x - lean * (g.bottom - g.top), g.bottom, g.pwid, g.pwid * 0.8, g.pwid * 0.2, 0.3); beam(ctx, x, g.top, x - lean * (g.bottom - g.top), g.bottom, g.pwid, '#a2734a', Math.floor(x)); }
}
export function warpweightUnder(ctx, S) {
  if (S.card || S.lite) return;
  const r = S.rect, c = S.cell, g = wwGeom(S), p = Math.max(2.6, c / 4.6);
  for (let x = r.x + p * 0.5, i = 0; x < r.x + r.w; x += p, i++) { const col = i % 7 < 3 ? '#efe6cc' : i % 7 < 5 ? '#d9cca8' : '#c8b98f'; thread(ctx, x, g.ty, x, r.y + 2, Math.max(1.1, p * 0.34), col, 0); }
}
export function warpweightFrame(ctx, S) {
  if (S.card || S.lite) return;
  const r = S.rect, c = S.cell, g = wwGeom(S), p = Math.max(2.6, c / 4.6), bot = r.y + r.h;
  castShadow(ctx, g.lx, g.ty, g.rx, g.ty, g.logw, 2, g.logw * 0.5, 0.35);
  beam(ctx, g.lx - g.pwid * 0.5, g.ty, g.rx + g.pwid * 0.5, g.ty, g.logw, '#b78554', 3);
  ctx.fillStyle = shade(WW_WOOL, -0.05); ctx.fillRect(r.x, g.ty + g.logw * 0.35, r.w, Math.max(2, g.logw * 0.25));
  // heddle rod across the warp just below the cloth, then the hanging bunches with their clay rings
  const hy = bot + Math.max(4, c * 0.14);
  for (let k = 0; k < g.n; k++) {
    const x = r.x + (k + 0.5) * (r.w / g.n), yb = g.yb + (k % 2 ? g.ht * 0.1 : 0);
    for (let j = -3; j <= 3; j++) thread(ctx, x + j * p * 0.4, bot, x + j * p * 0.05, yb, Math.max(1, p * 0.26), j % 2 ? '#e8ddc2' : '#cfc09a', 0);
    ctx.strokeStyle = '#5a3e22'; ctx.lineWidth = Math.max(2, p * 0.5); ctx.beginPath(); ctx.moveTo(x, yb - g.ht * 0.1); ctx.lineTo(x, yb + g.ht * 0.06); ctx.stroke();
    clayWeight(ctx, x, yb + g.ht * 0.4, g.wd, g.ht * 0.7, k);
  }
  rod(ctx, g.lx, hy, g.rx, hy, Math.max(5, c * 0.18), '#c9a064');
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; for (let x = r.x + p * 2; x < r.x + r.w; x += p * 5) ctx.fillRect(x, hy - 1, 1.4, Math.max(4, c * 0.2));
}
export function warpweightGround(ctx, S) {
  // tapestry wool: weft rows packed side by side, a twilled shine, a soft fuzz at the top edge
  const r = S.rect, c = S.cell, m = S.bg, p = Math.max(1.8, c / 8);
  ctx.fillStyle = m; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  for (let y = r.y, j = 0; y < r.y + r.h; y += p, j++) { ctx.fillStyle = rgba(j % 2 ? '#fff' : '#3a2a14', 0.06 + hash(j, 2) * 0.03); ctx.fillRect(r.x, y, r.w, p * 0.55); }
  ctx.beginPath(); for (let x = r.x + p * 0.5; x < r.x + r.w; x += p * 1.1) { ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); } ctx.strokeStyle = 'rgba(60,40,15,0.06)'; ctx.lineWidth = p * 0.3; ctx.stroke();
  if (!S.lite) speck(ctx, r, 260, ['#5a4020', '#fff'], 0.12, Math.max(1, c * 0.03), 11);
  ctx.restore();
}
export function warpweightOver(ctx, S) {
  const r = S.rect, c = S.cell;
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,214,150,0.16)'); g.addColorStop(0.5, 'rgba(255,214,150,0)'); g.addColorStop(1, 'rgba(10,0,0,0.3)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  const e = Math.max(5, c * 0.4), tg = ctx.createLinearGradient(0, r.y, 0, r.y + e); tg.addColorStop(0, 'rgba(0,0,0,0.3)'); tg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = tg; ctx.fillRect(r.x, r.y, r.w, e);
}

// ===================================================================================================================================================
// woven cell skins (each loom has its own real look)
// ===================================================================================================================================================
// diagonal twill: wool packed in slanted ridges, with a tight selvedge; line motifs are plied cords
export function twillSkin(ctx, d, o = {}) {
  const { kind, col, x, y, s, key } = d, fill = isFilled(kind), h = s / 2, n = o.n ?? 9, p = s / n, lw = lineWidthOf(kind, s);
  if (!fill) {
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.38)'; ctx.lineWidth = lw + 2; ctx.stroke(); ctx.strokeStyle = shade(col, -0.35); ctx.lineWidth = lw; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw * 0.78; ctx.stroke();
    ctx.setLineDash([lw * 0.35, lw * 0.4]); ctx.strokeStyle = rgba(shade(col, 0.4), 0.65); ctx.lineWidth = lw * 0.78; ctx.stroke(); ctx.setLineDash([]); ctx.restore(); return;
  }
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.fillStyle = shade(col, -0.4); ctx.fill(); ctx.clip();
  const lt = o.light ?? 0.3;
  for (let k = -n * 2; k <= n * 2; k++) { // slanted ridges, each lit on one side
    const x0 = x - h + k * p, t = hash(key, k);
    ctx.strokeStyle = shade(col, (t - 0.5) * 0.14); ctx.lineWidth = p * 0.62; ctx.beginPath(); ctx.moveTo(x0 - h * 0.0, y + h * 1.1); ctx.lineTo(x0 + s * 1.1, y - h * 1.1); ctx.stroke();
    ctx.strokeStyle = rgba(shade(col, lt), 0.55); ctx.lineWidth = p * 0.16; ctx.beginPath(); ctx.moveTo(x0 - p * 0.18, y + h * 1.1); ctx.lineTo(x0 + s * 1.1 - p * 0.18, y - h * 1.1); ctx.stroke();
    ctx.strokeStyle = rgba(shade(col, -0.55), 0.4); ctx.lineWidth = p * 0.14; ctx.beginPath(); ctx.moveTo(x0 + p * 0.3, y + h * 1.1); ctx.lineTo(x0 + s * 1.1 + p * 0.3, y - h * 1.1); ctx.stroke();
  }
  const g = ctx.createRadialGradient(x - s * 0.2, y - s * 0.25, s * 0.05, x, y, s * 0.7); g.addColorStop(0, 'rgba(255,240,210,0.16)'); g.addColorStop(1, 'rgba(10,0,0,0.3)'); ctx.fillStyle = g; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  ctx.restore();
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(shade(col, -0.65), 0.7); ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke(); ctx.restore();
}

// ---- tools -----------------------------------------------------------------------------------------------------------------------------------------
const pressOf = (T) => Math.max(0, 1 - T.a / 0.45);
const softE = (ctx, x, y, rx, ry, a = 0.3) => { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); };
Object.assign(TOOLS, {
  // a bone weaving comb: a flat handle with long teeth that beat the weft up; teeth tip is the working point
  bonecomb(ctx, S, T) {
    const u = T.u, p = pressOf(T), tw = u * 1.0, th = u * 0.8, y0 = T.y - p * u * 0.12;
    softE(ctx, T.x + u * 0.2, T.y + u * 0.06, tw * 0.6, u * 0.08);
    ctx.save(); ctx.translate(T.x, y0); ctx.rotate(0.08);
    const g = ctx.createLinearGradient(-tw / 2, -th, tw / 2, 0); g.addColorStop(0, '#f6f0dc'); g.addColorStop(1, '#bba886');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-tw / 2, -th); ctx.lineTo(tw / 2, -th); ctx.lineTo(tw / 2, -th * 0.36); for (let k = 5; k >= 0; k--) { const xx = -tw / 2 + (k / 5) * tw; ctx.lineTo(xx, k % 1 === 0 ? 0 : 0); ctx.lineTo(xx - tw / 12, 0); ctx.lineTo(xx - tw / 12, -th * 0.36); ctx.lineTo(xx - tw / 6, -th * 0.36); } ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(70,50,20,0.5)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(90,60,20,0.5)'; ctx.beginPath(); ctx.arc(0, -th * 0.72, u * 0.07, 0, TAU); ctx.fill();
    ctx.restore();
  },
});

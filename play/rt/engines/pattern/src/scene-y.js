// Scene art, 1.10.0: the five textile-craft scenes lifted to String Music level (lefkara, haapsalu, chikankari, toquilla, kantha).
// Environments, apparatus and cell skins live here; scenes-g.js / scenes-f.js reference them. Pure canvas 2D, no Math.random (hash only).
import { SKIN, hash, rgba, mix, shade, roundRectPath, rod, ball, speck, lines, glow, TAU, motifPath, isFilled, lineWidthOf, clamp } from './scene-kit.js';

// ---- lefkara: a sun-warmed terrace: shaded whitewash wall, blue louvred shutters, stone sill, terracotta floor, light through the slats ----
const louvres = (ctx, x, y, w, h, c, lit) => { // one shutter leaf: a blue frame, slanted slats, hinges
  const g = ctx.createLinearGradient(x, y, x + w, y); g.addColorStop(0, shade(c, lit ? 0.12 : -0.05)); g.addColorStop(1, shade(c, lit ? -0.2 : -0.35));
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = Math.max(4, w * 0.12); ctx.shadowOffsetX = w * 0.05; ctx.shadowOffsetY = w * 0.05; ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.restore();
  const st = Math.max(4, w * 0.13), fw = Math.max(2, w * 0.1);
  ctx.save(); ctx.beginPath(); ctx.rect(x + fw, y + fw, w - 2 * fw, h - 2 * fw); ctx.clip();
  for (let yy = y + fw; yy < y + h - fw; yy += st) {
    ctx.fillStyle = 'rgba(0,0,20,0.5)'; ctx.fillRect(x, yy + st * 0.55, w, st * 0.45); ctx.fillStyle = 'rgba(180,215,255,0.34)'; ctx.fillRect(x, yy, w, Math.max(1, st * 0.14));
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,10,40,0.55)'; ctx.lineWidth = Math.max(1, fw * 0.5); ctx.strokeRect(x + fw * 0.5, y + fw * 0.5, w - fw, h - fw);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x, y, Math.max(1.5, fw * 0.5), h);
  ctx.fillStyle = '#2a2622'; for (const f of [0.18, 0.5, 0.82]) { ctx.beginPath(); ctx.arc(lit ? x + w - fw * 0.5 : x + fw * 0.5, y + h * f, Math.max(1.5, fw * 0.45), 0, TAU); ctx.fill(); }
};
export function lefkaraEnv(ctx, S) {
  const a = S.area, b = S.box, c = S.cell, r = S.rect, X0 = a.x - 12, W = a.w + 24, wallH = a.h * 0.6, sillY = a.y + wallH;
  // floor: terracotta flags in perspective, dark so white linen stands out
  const fg = ctx.createLinearGradient(0, sillY, 0, a.y + a.h); fg.addColorStop(0, '#4a3326'); fg.addColorStop(1, '#6a4a36'); ctx.fillStyle = fg; ctx.fillRect(X0, sillY, W, a.y + a.h - sillY);
  ctx.save(); ctx.beginPath(); ctx.rect(X0, sillY, W, a.y + a.h - sillY); ctx.clip(); ctx.strokeStyle = 'rgba(15,8,4,0.55)'; ctx.lineWidth = Math.max(1, c * 0.05); ctx.beginPath();
  const vx = a.x + a.w * 0.5, vy = a.y - a.h * 0.9, rowsN = 7; let yy = sillY, step = (a.y + a.h - sillY) / 14;
  for (let k = 0; k < rowsN + 8 && yy < a.y + a.h + 4; k++) { ctx.moveTo(X0, yy); ctx.lineTo(X0 + W, yy); yy += step; step *= 1.22; }
  for (let k = -9; k <= 9; k++) { const x1 = vx + k * (a.w * 0.2); ctx.moveTo(vx + (x1 - vx) * ((sillY - vy) / (a.y + a.h - vy)) , sillY); ctx.lineTo(x1, a.y + a.h); }
  ctx.stroke(); ctx.restore();
  speck(ctx, { x: X0, y: sillY, w: W, h: a.y + a.h - sillY }, 90, ['#2a1a10', '#a07a58'], 0.2, Math.max(1.2, c * 0.05), 61);
  // wall: whitewash in shade, warm falling light
  const wg = ctx.createLinearGradient(0, a.y, 0, sillY); wg.addColorStop(0, '#6c5f4f'); wg.addColorStop(1, '#a29075'); ctx.fillStyle = wg; ctx.fillRect(X0, a.y, W, wallH);
  for (let i = 0; i < 12; i++) { const px = a.x + hash(i, 1) * a.w, py = a.y + hash(i, 2) * wallH, R = c * (1.5 + hash(i, 3) * 3), g = ctx.createRadialGradient(px, py, 0, px, py, R); g.addColorStop(0, hash(i, 4) > 0.5 ? 'rgba(255,240,210,0.1)' : 'rgba(30,20,10,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(px - R, py - R, R * 2, R * 2); }
  speck(ctx, { x: X0, y: a.y, w: W, h: wallH }, 160, ['#2a2016', '#e8dcc0'], 0.18, Math.max(1.2, c * 0.04), 71);
  // the window: open shutter leaves left and right of the work, a dark interior and a lintel between them
  const gapL = Math.max(0, r.x - b.x), gapR = Math.max(0, b.x + b.w - (r.x + r.w)), lw = clamp(Math.min(gapL, gapR) * 0.9, a.w * 0.045, a.w * 0.2), top = a.y + wallH * 0.07, hh = wallH * 0.86;
  const wx0 = b.x + lw * 0.55, wx1 = b.x + b.w - lw * 0.55; ctx.fillStyle = '#17110c'; ctx.fillRect(wx0, top, wx1 - wx0, hh);
  const sky = ctx.createLinearGradient(0, top, 0, top + hh); sky.addColorStop(0, 'rgba(120,170,210,0.55)'); sky.addColorStop(1, 'rgba(255,230,170,0.18)'); ctx.fillStyle = sky; ctx.fillRect(wx0, top, wx1 - wx0, hh);
  louvres(ctx, b.x - lw * 0.2, top - wallH * 0.02, lw, hh * 1.04, '#2c76bd', true); louvres(ctx, b.x + b.w - lw * 0.8, top - wallH * 0.02, lw, hh * 1.04, '#2c76bd', false);
  // stone sill and its shadow on the terrace
  const sh = Math.max(5, c * 0.5); const sg = ctx.createLinearGradient(0, sillY - sh, 0, sillY + sh * 0.4); sg.addColorStop(0, '#d9ccb2'); sg.addColorStop(0.5, '#b8a98c'); sg.addColorStop(1, '#6e6150'); ctx.fillStyle = sg; ctx.fillRect(X0, sillY - sh * 0.6, W, sh);
  ctx.fillStyle = 'rgba(255,248,225,0.5)'; ctx.fillRect(X0, sillY - sh * 0.6, W, Math.max(1, sh * 0.1)); const ss = ctx.createLinearGradient(0, sillY + sh * 0.4, 0, sillY + sh * 2.4); ss.addColorStop(0, 'rgba(0,0,0,0.5)'); ss.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = ss; ctx.fillRect(X0, sillY + sh * 0.4, W, sh * 2);
  // light through the slats: warm slanted bars across wall and floor, a pool of sun on the left
  ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, a.h); ctx.clip(); ctx.fillStyle = 'rgba(255,214,140,0.1)'; const bw = c * 0.7;
  for (let k = -3; k < 14; k++) { const x0 = a.x + (k * a.w) / 9; ctx.beginPath(); ctx.moveTo(x0, a.y); ctx.lineTo(x0 + bw, a.y); ctx.lineTo(x0 + bw + a.h * 0.55, a.y + a.h); ctx.lineTo(x0 + a.h * 0.55, a.y + a.h); ctx.closePath(); ctx.fill(); }
  ctx.restore(); glow(ctx, a.x + a.w * 0.12, a.y + a.h * 0.35, a.w * 1.1, '#ffd89a', 0.34);
  // terracotta pot with geranium on the sill side
  const px = a.x + a.w * 0.07, py = a.y + a.h * 0.945; ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(px + c * 0.35, py + c * 0.12, c * 0.9, c * 0.25, 0, 0, TAU); ctx.fill();
  const pg = ctx.createLinearGradient(px - c * 0.6, 0, px + c * 0.6, 0); pg.addColorStop(0, '#d0703c'); pg.addColorStop(0.5, '#e98a50'); pg.addColorStop(1, '#8a3e1e'); ctx.fillStyle = pg; ctx.beginPath(); ctx.moveTo(px - c * 0.62, py - c * 0.5); ctx.lineTo(px + c * 0.62, py - c * 0.5); ctx.lineTo(px + c * 0.44, py + c * 0.05); ctx.lineTo(px - c * 0.44, py + c * 0.05); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2f6a34'; ctx.beginPath(); for (let k = 0; k < 7; k++) { const an = -Math.PI + (k / 6) * Math.PI; ctx.moveTo(px, py - c * 0.5); ctx.ellipse(px + Math.cos(an) * c * 0.5, py - c * 0.5 + Math.sin(an) * c * 0.55, c * 0.3, c * 0.2, an, 0, TAU); } ctx.fill();
  ctx.fillStyle = '#d8303c'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(px + (k - 1.5) * c * 0.26, py - c * (0.88 + 0.08 * (k % 2)), c * 0.14, 0, TAU); ctx.fill(); }
}
// the frame: dark waxed wood standing on the terrace, its shadow thrown right and down by the window light, white cord lacing
export function lefkaraUnder(ctx, S) {
  const r = wideRect(S, 0.84), c = S.cell, t = Math.max(7, c * 0.4), R = { x: r.x - t, y: r.y - t, w: r.w + 2 * t, h: r.h + 2 * t }, wood = '#7c5630';
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.62)'; ctx.shadowBlur = c * 1.1; ctx.shadowOffsetX = c * 0.9; ctx.shadowOffsetY = c * 0.55; ctx.fillStyle = '#000'; ctx.fillRect(R.x, R.y, R.w, R.h); ctx.restore();
  ctx.fillStyle = '#000'; ctx.fillRect(R.x, R.y, R.w, R.h);
  rod(ctx, R.x + t / 2, R.y + t / 2, R.x + R.w - t / 2, R.y + t / 2, t, shade(wood, 0.08)); rod(ctx, R.x + t / 2, R.y + R.h - t / 2, R.x + R.w - t / 2, R.y + R.h - t / 2, t, shade(wood, -0.1));
  rod(ctx, R.x + t / 2, R.y, R.x + t / 2, R.y + R.h, t, shade(wood, 0.04)); rod(ctx, R.x + R.w - t / 2, R.y, R.x + R.w - t / 2, R.y + R.h, t, shade(wood, -0.16));
  ctx.fillStyle = '#d6b36a'; for (const [x, y] of [[R.x + t / 2, R.y + t / 2], [R.x + R.w - t / 2, R.y + t / 2], [R.x + t / 2, R.y + R.h - t / 2], [R.x + R.w - t / 2, R.y + R.h - t / 2]]) { ctx.beginPath(); ctx.arc(x, y, t * 0.2, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = 'rgba(248,242,222,0.92)'; ctx.lineWidth = Math.max(1.4, c * 0.05); ctx.beginPath(); const n = 12; for (let k = 0; k < n; k++) { const f = (k + 0.5) / n; ctx.moveTo(r.x + r.w * f, r.y); ctx.lineTo(r.x + r.w * f, R.y + t * 0.5); ctx.moveTo(r.x + r.w * f, r.y + r.h); ctx.lineTo(r.x + r.w * f, R.y + R.h - t * 0.5); ctx.moveTo(r.x, r.y + r.h * f); ctx.lineTo(R.x + t * 0.5, r.y + r.h * f); ctx.moveTo(r.x + r.w, r.y + r.h * f); ctx.lineTo(R.x + R.w - t * 0.5, r.y + r.h * f); } ctx.stroke();
}
// light over the linen: sun from the upper left, slat shadows, the frame's own shadow along the top and left edges
export function lefkaraOver(ctx, S) {
  const r = wideRect(S, 0.84), c = S.cell;
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,232,180,0.2)'); g.addColorStop(0.5, 'rgba(255,232,180,0)'); g.addColorStop(1, 'rgba(30,20,10,0.3)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = 'rgba(40,24,8,0.05)'; const bw = c * 0.8; for (let k = -2; k < 9; k++) { const x0 = r.x + (k * r.w) / 6; ctx.beginPath(); ctx.moveTo(x0, r.y); ctx.lineTo(x0 + bw, r.y); ctx.lineTo(x0 + bw + r.h * 0.55, r.y + r.h); ctx.lineTo(x0 + r.h * 0.55, r.y + r.h); ctx.closePath(); ctx.fill(); }
  const e = Math.max(5, c * 0.5), tg = ctx.createLinearGradient(0, r.y, 0, r.y + e); tg.addColorStop(0, 'rgba(20,10,0,0.42)'); tg.addColorStop(1, 'rgba(20,10,0,0)'); ctx.fillStyle = tg; ctx.fillRect(r.x, r.y, r.w, e);
  const lg = ctx.createLinearGradient(r.x, 0, r.x + e, 0); lg.addColorStop(0, 'rgba(20,10,0,0.34)'); lg.addColorStop(1, 'rgba(20,10,0,0)'); ctx.fillStyle = lg; ctx.fillRect(r.x, r.y, e, r.h);
}
void motifPath; void isFilled; void lineWidthOf; void ball; void lines; void rgba; void mix; void roundRectPath; void SKIN;

// ---- wide sheets (1.10.0): on a landscape screen the cloth runs out to the edges of the work area (the grid is the middle of it), so the work
// fills about half the screen width instead of a small square. Portrait, title art and swatches get the plain grid rectangle back.
export function wideRect(S, frac = 1) {
  const r = S.rect, b = S.box, a = S.area;
  if (S.polar || S.lite || !(a.w > a.h * 1.15) || !(b.w > r.w * 1.22)) return r;
  const m = Math.max(4, S.cell * 0.5) + (b.w * (1 - frac)) / 2;
  return { x: b.x + m, y: r.y, w: Math.max(r.w, b.w - 2 * m), h: r.h };
}
// linen / muslin weave texture on any rectangle
export function clothWeave(ctx, R, S, m, o = {}) {
  const p = Math.max(1.8, S.cell / (o.density ?? 11));
  ctx.fillStyle = m; ctx.fillRect(R.x, R.y, R.w, R.h);
  lines(ctx, R, 'v', p, shade(m, 0.3), o.a ?? 0.3, p * 0.5, 0.35, 3); lines(ctx, R, 'h', p, shade(m, -0.28), o.a ?? 0.3, p * 0.45, 0.35, 5);
  if (!S.lite) speck(ctx, R, o.specks ?? 140, [shade(m, -0.25), shade(m, 0.4)], 0.3, Math.max(1.2, S.cell * 0.04), 41);
}

// ---- chikankari: white thread on a mid-tone dyed muslin so the thread reads; block-print guide in blue wash, hemmed edge ----
export const CHIKAN_MUSLIN = '#6a82a0';
export function chikanMuslin(S) { return mix(S.bg, CHIKAN_MUSLIN, 0.82); }
export function chikanEnv(ctx, S) {
  const a = S.area, st = S.cell * 1.3, X0 = a.x - 12, W = a.w + 24;
  const bg = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); bg.addColorStop(0, '#3a3128'); bg.addColorStop(1, '#2a231c'); ctx.fillStyle = bg; ctx.fillRect(X0, a.y, W, a.h);
  ctx.save(); ctx.fillStyle = 'rgba(255,226,160,0.07)';   // the carved screen's lattice, seen as a faint repeated jali
  for (let y = a.y - st; y < a.y + a.h + st; y += st) for (let x = a.x - st + ((Math.round((y - a.y) / st)) % 2) * st / 2; x < a.x + a.w + st; x += st) { ctx.beginPath(); ctx.moveTo(x, y - st * 0.42); ctx.quadraticCurveTo(x + st * 0.12, y, x + st * 0.42, y); ctx.quadraticCurveTo(x + st * 0.12, y, x, y + st * 0.42); ctx.quadraticCurveTo(x - st * 0.12, y, x - st * 0.42, y); ctx.quadraticCurveTo(x - st * 0.12, y, x, y - st * 0.42); ctx.fill(); }
  ctx.restore();
  glow(ctx, a.x + a.w * 0.15, a.y + a.h * 0.12, a.w * 0.95, '#ffd89a', 0.3);
}
export function chikanUnder(ctx, S, frameFn) { frameFn(ctx, { ...S, rect: wideRect(S) }, { wood: '#8a6234', t: 0.36, ties: 11, tie: '#efe3c4' }); }
export function chikanBase(ctx, S) { const R = wideRect(S); ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = S.cell * 0.6; ctx.shadowOffsetY = S.cell * 0.16; ctx.fillStyle = chikanMuslin(S); ctx.fillRect(R.x, R.y, R.w, R.h); ctx.restore(); }
export function chikanGround(ctx, S) {
  const R = wideRect(S), r = S.rect, m = chikanMuslin(S), c = S.cell;
  clothWeave(ctx, R, S, m);
  const g = ctx.createRadialGradient(R.x + R.w * 0.36, R.y + R.h * 0.3, R.w * 0.04, R.x + R.w * 0.5, R.y + R.h * 0.5, R.w * 0.8); g.addColorStop(0, 'rgba(255,248,228,0.3)'); g.addColorStop(0.6, 'rgba(255,248,228,0)'); g.addColorStop(1, 'rgba(30,24,16,0.38)'); ctx.fillStyle = g; ctx.fillRect(R.x, R.y, R.w, R.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = Math.max(2, c * 0.2); ctx.beginPath(); ctx.moveTo(R.x, R.y + R.h * 0.62); ctx.quadraticCurveTo(R.x + R.w * 0.5, R.y + R.h * 0.5, R.x + R.w, R.y + R.h * 0.7); ctx.stroke();
  if (S.lite || R === r) return;
  // landscape margins: the block printer's fugitive blue guide (buti outlines) and a hemmed edge in white back-stitch
  ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(40,72,128,0.34)'; ctx.lineWidth = Math.max(1.2, c * 0.05);
  const kinds = ['flower', 'leaf', 'vine', 'leaf']; let n = 0;
  for (const [x0, x1] of [[R.x, r.x], [r.x + r.w, R.x + R.w]]) for (let x = x0 + c * 0.9, i = 0; x < x1 - c * 0.5; x += c * 1.5, i++) for (let y = R.y + c * 0.9, j = 0; y < R.y + R.h - c * 0.5; y += c * 1.5, j++, n++) { ctx.setLineDash([c * 0.12, c * 0.08]); motifPath(ctx, kinds[(i + j * 2) % 4], x, y, c * 0.95); ctx.stroke(); }
  ctx.restore();
  const e = c * 0.28; ctx.save(); ctx.lineCap = 'round'; ctx.setLineDash([c * 0.16, c * 0.07]); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = Math.max(1.6, c * 0.07); ctx.translate(0.6, 1.1); ctx.strokeRect(R.x + e, R.y + e, R.w - 2 * e, R.h - 2 * e); ctx.translate(-0.6, -1.1);
  ctx.strokeStyle = '#f6f1e4'; ctx.lineWidth = Math.max(1.4, c * 0.06); ctx.strokeRect(R.x + e, R.y + e, R.w - 2 * e, R.h - 2 * e); ctx.restore();
}

// Lefkara linen: warm, bright, fine weave; a pulled-thread hem band round the sheet (hemstitched slits between wrapped bars)
export function lefkaraGround(ctx, S) {
  const R = wideRect(S, 0.84), c = S.cell, m = S.bg;
  clothWeave(ctx, R, S, m, { density: 9, a: 0.2, specks: 90 });
  const g = ctx.createRadialGradient(R.x + R.w * 0.3, R.y + R.h * 0.25, R.w * 0.05, R.x + R.w * 0.5, R.y + R.h * 0.5, R.w * 0.85); g.addColorStop(0, 'rgba(255,250,235,0.34)'); g.addColorStop(1, 'rgba(120,96,60,0.14)'); ctx.fillStyle = g; ctx.fillRect(R.x, R.y, R.w, R.h);
  if (S.lite || R === S.rect) return;
  const e = c * 0.3, w = c * 0.34; ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip();
  ctx.strokeStyle = 'rgba(28,56,90,0.6)'; ctx.lineWidth = w; ctx.strokeRect(R.x + e + w / 2, R.y + e + w / 2, R.w - 2 * e - w, R.h - 2 * e - w);
  ctx.strokeStyle = '#faf6ea'; ctx.lineWidth = w * 0.9; ctx.setLineDash([c * 0.1, c * 0.18]); ctx.lineCap = 'butt'; ctx.strokeRect(R.x + e + w / 2, R.y + e + w / 2, R.w - 2 * e - w, R.h - 2 * e - w);
  ctx.setLineDash([]); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(1, c * 0.025); ctx.strokeRect(R.x + e - 1, R.y + e - 1, R.w - 2 * e + 2, R.h - 2 * e + 2);
  ctx.restore();
}

// ---- kantha: pale old-sari cloth, quilted all over in rows of running stitch that ripple across it; motifs are the same stitch in thread colour ----
export const KANTHA_CLOTH = '#ddd3bd';
const kRow = (c, x, k) => c * 0.085 * Math.sin((x / c) * 1.45 + k * 0.21);   // x measured from the grid's left edge, k = row index: a soft diagonal ripple
export function kanthaEnv(ctx, S) {
  const a = S.area, c = S.cell, X0 = a.x - 12, W = a.w + 24, b = '#4e3b2c';
  const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, shade(b, 0.1)); g.addColorStop(1, shade(b, -0.35)); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, a.h);
  speck(ctx, a, 420, ['#1c120a', '#8a6e52', '#3a2a1c'], 0.35, 2, 9);
  for (let k = 0; k < 6; k++) { ctx.save(); ctx.translate(a.x + a.w * hash(k, 1), a.y + a.h * (0.05 + hash(k, 2) * 0.9)); ctx.rotate(-0.5 + hash(k, 3)); ctx.fillStyle = 'rgba(10,30,10,0.2)'; ctx.beginPath(); ctx.ellipse(0, 0, a.w * 0.26, a.w * 0.03, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  glow(ctx, a.x + a.w * 0.15, a.y + a.h * 0.1, a.w * 1.0, '#ffe2a8', 0.32);
  const v = ctx.createRadialGradient(a.x + a.w / 2, a.y + a.h / 2, Math.min(a.w, a.h) * 0.3, a.x + a.w / 2, a.y + a.h / 2, Math.max(a.w, a.h) * 0.78); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)'); ctx.fillStyle = v; ctx.fillRect(X0, a.y, W, a.h);
  void c;
}
export function kanthaUnder(ctx, S) { // two older saris peeking out under the top layer, each faded a different colour, hems stitched
  const E = wideRect(S), c = S.cell, cx = E.x + E.w / 2, cy = E.y + E.h / 2;
  for (const [k, col] of [[2, '#8c3a30'], [1, '#d2a44e']]) {
    const t = c * (0.3 + k * 0.26), w = E.w + 2 * t, h = E.h + 2 * t;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(k === 2 ? 0.032 : -0.022);
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = c * 0.6; ctx.shadowOffsetY = c * 0.22; ctx.fillStyle = col; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowColor = 'transparent';
    const lg = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); lg.addColorStop(0, 'rgba(255,255,255,0.18)'); lg.addColorStop(1, 'rgba(0,0,0,0.2)'); ctx.fillStyle = lg; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.setLineDash([c * 0.14, c * 0.09]); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = Math.max(1.4, c * 0.07); ctx.strokeRect(-w / 2 + c * 0.13, -h / 2 + c * 0.14, w - c * 0.26, h - c * 0.26);
    ctx.strokeStyle = shade(col, 0.55); ctx.lineWidth = Math.max(1.2, c * 0.055); ctx.strokeRect(-w / 2 + c * 0.12, -h / 2 + c * 0.12, w - c * 0.24, h - c * 0.24);
    ctx.restore();
  }
}
export function kanthaGround(ctx, S) {
  const R = wideRect(S), r = S.rect, c = S.cell, ry = c * 0.21, m = KANTHA_CLOTH;
  clothWeave(ctx, R, S, m, { density: 10, a: 0.18, specks: 100 });
  ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip();
  const rows = Math.ceil(R.h / ry) + 1, k0 = Math.floor((R.y - r.y) / ry), step = Math.max(c * 0.3, 4);
  const trace = (dy) => { ctx.beginPath(); for (let k = k0; k < k0 + rows; k++) { const y0 = r.y + (k + 0.5) * ry + dy; for (let x = R.x - step, i = 0; x <= R.x + R.w + step; x += step, i++) { const px = x, yy = y0 + kRow(c, px - r.x, k); if (i) ctx.lineTo(px, yy); else ctx.moveTo(px, yy); } ctx.moveTo(R.x, y0); } };
  // puckered relief: light ridges and dark valleys that follow the rows
  trace(-ry * 0.2); ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = ry * 0.55; ctx.stroke(); trace(ry * 0.32); ctx.strokeStyle = 'rgba(60,40,20,0.12)'; ctx.lineWidth = ry * 0.5; ctx.stroke();
  // the running stitch itself, self-coloured thread with its own shadow
  ctx.lineCap = 'round'; ctx.setLineDash([c * 0.15, c * 0.085]);
  trace(0.9); ctx.strokeStyle = 'rgba(40,24,8,0.3)'; ctx.lineWidth = Math.max(1.3, c * 0.065); ctx.stroke();
  trace(0); ctx.strokeStyle = '#b8aa90'; ctx.lineWidth = Math.max(1.2, c * 0.055); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = Math.max(0.7, c * 0.02); ctx.save(); ctx.translate(-0.3, -0.5); ctx.stroke(); ctx.restore();
  ctx.setLineDash([]); ctx.restore();
  // soft folds and light: warm from the upper left, falling into the lower right
  const lg = ctx.createLinearGradient(R.x, R.y, R.x + R.w, R.y + R.h); for (let i = 0; i <= 8; i++) lg.addColorStop(i / 8, i % 2 ? 'rgba(255,248,225,0.1)' : 'rgba(60,40,20,0.08)'); ctx.fillStyle = lg; ctx.fillRect(R.x, R.y, R.w, R.h);
  const g = ctx.createRadialGradient(R.x + R.w * 0.3, R.y + R.h * 0.25, R.w * 0.05, R.x + R.w * 0.5, R.y + R.h * 0.5, R.w * 0.85); g.addColorStop(0, 'rgba(255,246,222,0.3)'); g.addColorStop(1, 'rgba(40,24,8,0.34)'); ctx.fillStyle = g; ctx.fillRect(R.x, R.y, R.w, R.h);
}
// a stamp in kantha: the area is filled with dense rows of running stitch in the thread colour, rows aligned with (and rippling like) the cloth's own rows;
// contour rows echo the outline inside. Line motifs are a doubled running stitch. d.age animates through the `stitched` needle wipe.
export function kanthaSkin(ctx, S, d) {
  const { kind, col, x, y, s } = d, fill = isFilled(kind), c = S && S.cell ? S.cell : s / 0.9, ry = c * 0.21, lw = Math.max(1.5, c * 0.075), dash = [c * 0.15, c * 0.085];
  const contour = (sc, colr, w, a = 1) => { ctx.save(); motifPath(ctx, kind, x, y, s * sc); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash(dash);
    ctx.strokeStyle = 'rgba(30,18,6,0.34)'; ctx.lineWidth = w + 1; ctx.save(); ctx.translate(0.7, 1.2); ctx.stroke(); ctx.restore();
    ctx.globalAlpha = a; ctx.strokeStyle = colr; ctx.lineWidth = w; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = Math.max(0.7, w * 0.28); ctx.save(); ctx.translate(-0.3, -0.5); ctx.stroke(); ctx.restore(); ctx.restore(); };
  if (!fill) { contour(1, col, lw * 1.15); if (kind === 'ring' || kind === 'spiral') contour(0.72, shade(col, 0.2), lw * 0.9, 0.9); return; }
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(30,18,6,0.3)'; ctx.lineWidth = lw * 1.8; ctx.save(); ctx.translate(0.8, 1.4); ctx.stroke(); ctx.restore();
  ctx.fillStyle = mix(col, KANTHA_CLOTH, 0.5); ctx.fill(); ctx.clip();
  const T = ctx.getTransform ? ctx.getTransform() : null;
  if (T && ctx.setTransform) { const k = Math.hypot(T.a, T.b); ctx.setTransform(k, 0, 0, k, T.e, T.f); }   // rows stay level and in step with the cloth, whatever the stamp's orientation
  const gxc = ((d.c ?? 0) + 0.5) * c, gyc = ((d.r ?? 0) + 0.5) * c, k0 = Math.floor((gyc - s * 0.6) / ry), k1 = Math.ceil((gyc + s * 0.6) / ry), stp = Math.max(s / 8, 3);
  const rowsPath = (dy) => { ctx.beginPath(); for (let k = k0; k <= k1; k++) { const yl = y + (k + 0.5) * ry - gyc + dy; for (let i = 0, lx = x - s * 0.62; lx <= x + s * 0.62; lx += stp, i++) { const yy = yl + kRow(c, gxc + (lx - x), k); if (i) ctx.lineTo(lx, yy); else ctx.moveTo(lx, yy); } } };
  ctx.lineCap = 'round'; ctx.setLineDash(dash);
  rowsPath(0.9); ctx.strokeStyle = 'rgba(30,18,6,0.34)'; ctx.lineWidth = lw * 1.5; ctx.stroke();
  rowsPath(0); ctx.strokeStyle = shade(col, -0.32); ctx.lineWidth = lw * 1.45; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw * 1.08; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = Math.max(0.7, lw * 0.28); ctx.save(); ctx.translate(-0.3, -0.5); ctx.stroke(); ctx.restore();
  ctx.restore();
  contour(1, shade(col, -0.34), lw * 1.05); contour(0.66, shade(col, 0.32), lw * 0.8, 0.9);
}

// ---- haapsalu: a gossamer lace shawl pinned out on a dark blocking mat: ivory knit field with a lattice of yarn-over eyelets (the mat shows through them);
// a motif is an openwork patch of the same knit in the yarn colour, bigger eyelets and a raised edge; the knot (nupp) is a cluster of raised beads ----
export const LACE_IVORY = '#ece7da';
const vRows = (ctx, R, p, col, cols2) => { // rows of knit V stitches over a rectangle, two tints, one shadow pass and one highlight pass
  const nx = Math.ceil(R.w / p) + 1, ny = Math.ceil(R.h / (p * 0.78)) + 1, A = [[], []], q = p * 0.5;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const cx = R.x + (i + 0.5) * p, cy = R.y + (j + 0.5) * p * 0.78, t = (i * 7 + j * 3) % 2; A[t].push(cx, cy); }
  const legs = (arr, dx, dy, w, st) => { ctx.beginPath(); for (let k = 0; k < arr.length; k += 2) { const cx = arr[k] + dx, cy = arr[k + 1] + dy; ctx.moveTo(cx - q * 0.9, cy - p * 0.42); ctx.lineTo(cx - q * 0.04, cy + p * 0.4); ctx.moveTo(cx + q * 0.9, cy - p * 0.42); ctx.lineTo(cx + q * 0.04, cy + p * 0.4); } ctx.strokeStyle = st; ctx.lineWidth = w; ctx.stroke(); };
  ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip(); ctx.lineCap = 'round';
  ctx.fillStyle = shade(col, -0.5); ctx.fillRect(R.x, R.y, R.w, R.h);
  for (let t = 0; t < 2; t++) { legs(A[t], p * 0.05, p * 0.1, p * 0.6, 'rgba(30,24,16,0.38)'); legs(A[t], 0, 0, p * 0.54, shade(col, cols2[t] - 0.2)); legs(A[t], 0, 0, p * 0.4, shade(col, cols2[t])); legs(A[t], -p * 0.07, -p * 0.08, p * 0.1, rgba(shade(col, 0.6), 0.7)); }
  ctx.restore();
}
const hole = (ctx, cx, cy, rx, ry, dark, rim, w) => { // an eyelet: a dark opening with a raised yarn rim
  ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = rim; ctx.lineWidth = w; ctx.stroke();
};
export function haapsaluGround(ctx, S) {
  const r = S.rect, c = S.cell, p = Math.max(2.8, c / (S.lite ? 2.8 : 3.7)), dark = shade(S.bg, -0.55);
  vRows(ctx, r, p, LACE_IVORY, [-0.07, 0.05]);
  // the eyelet lattice: yarn-over holes on a diamond net, the blocking mat dark behind them
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  const gx = p * 3, gy = p * 2.34, nx = Math.ceil(r.w / gx) + 1, ny = Math.ceil(r.h / gy) + 1;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const cx = r.x + (i + (j % 2 ? 0.5 : 0.0) + 0.25) * gx, cy = r.y + (j + 0.5) * gy; hole(ctx, cx, cy, p * 0.26, p * 0.4, mix(dark, LACE_IVORY, 0.2), 'rgba(255,252,240,0.85)', Math.max(0.8, p * 0.14)); }
  ctx.restore();
  if (!S.lite) { // the shawl's edge: a garter band with a row of eyelets, the picot edge outside it
    ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); const e = c * 0.3, st = p * 2.3;
    ctx.strokeStyle = 'rgba(255,252,240,0.7)'; ctx.lineWidth = Math.max(1, p * 0.2); ctx.strokeRect(r.x + e * 1.9, r.y + e * 1.9, r.w - e * 3.8, r.h - e * 3.8); ctx.strokeStyle = 'rgba(60,50,36,0.3)'; ctx.lineWidth = Math.max(1, p * 0.16); ctx.strokeRect(r.x + e * 1.9 + 1, r.y + e * 1.9 + 1.2, r.w - e * 3.8, r.h - e * 3.8);
    for (let x = r.x + st * 0.5; x < r.x + r.w; x += st) for (const y of [r.y + e, r.y + r.h - e]) hole(ctx, x, y, p * 0.3, p * 0.3, dark, 'rgba(255,252,240,0.9)', Math.max(0.8, p * 0.13));
    for (let y = r.y + st * 0.5; y < r.y + r.h; y += st) for (const x of [r.x + e, r.x + r.w - e]) hole(ctx, x, y, p * 0.3, p * 0.3, dark, 'rgba(255,252,240,0.9)', Math.max(0.8, p * 0.13));
    ctx.restore();
  }
  const g = ctx.createRadialGradient(r.x + r.w * 0.34, r.y + r.h * 0.3, r.w * 0.05, r.x + r.w * 0.5, r.y + r.h * 0.5, r.w * 0.85); g.addColorStop(0, 'rgba(255,255,248,0.34)'); g.addColorStop(1, 'rgba(50,60,60,0.2)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
}
export function haapsaluSkin(ctx, S, d) {
  const { kind, col, x, y, s, key } = d, c = S && S.cell ? S.cell : s / 0.9, p = Math.max(2.4, c / 4.8), dark = shade((S && S.bg) || '#35595c', -0.55), fill = isFilled(kind), lw = Math.max(2, c * 0.1);
  if (kind === 'knot') { // nupps: five tiny knots worked into one stitch, standing proud of the lace
    const R = s * 0.15, pts = [[0, 0], [-1.7, -0.9], [1.7, -0.9], [-1.1, 1.5], [1.1, 1.5]];
    ctx.save(); ctx.fillStyle = 'rgba(20,16,10,0.34)'; ctx.beginPath(); ctx.ellipse(x + R * 0.4, y + R * 0.8, R * 3.4, R * 2.8, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = shade(col, -0.25); ctx.lineWidth = R * 0.8; ctx.lineCap = 'round'; ctx.beginPath(); for (const [px, py] of pts) { ctx.moveTo(x, y); ctx.lineTo(x + px * R, y + py * R); } ctx.stroke(); ctx.restore();
    for (const [px, py] of pts) { const bx = x + px * R * 1.05, by = y + py * R * 1.05; ball(ctx, bx, by, R * 1.12, col, false); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(bx - R * 0.35, by - R * 0.4, R * 0.28, 0, TAU); ctx.fill(); ctx.strokeStyle = rgba(shade(col, -0.5), 0.6); ctx.lineWidth = Math.max(0.8, R * 0.12); ctx.beginPath(); ctx.arc(bx, by, R * 1.12, 0, TAU); ctx.stroke(); }
    void key; return;
  }
  if (!fill) { // a chain of eyelets worked along a line, with a plied cord of yarn beside it
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([0.01, p * 2.2]); ctx.strokeStyle = 'rgba(20,16,10,0.4)'; ctx.lineWidth = p * 1.5; ctx.save(); ctx.translate(0.6, 1.1); ctx.stroke(); ctx.restore();
    ctx.setLineDash([]); ctx.strokeStyle = 'rgba(30,24,16,0.34)'; ctx.lineWidth = lw * 0.8; ctx.save(); ctx.translate(0.7, 1.2); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = shade(col, -0.32); ctx.lineWidth = lw * 0.8; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw * 0.58; ctx.stroke(); ctx.strokeStyle = rgba(shade(col, 0.6), 0.8); ctx.lineWidth = Math.max(0.8, lw * 0.14); ctx.save(); ctx.translate(-0.3, -0.5); ctx.stroke(); ctx.restore();
    ctx.setLineDash([0.01, p * 2.2]); ctx.strokeStyle = dark; ctx.lineWidth = p * 1.1; ctx.stroke(); ctx.setLineDash([0.01, p * 2.2]); ctx.strokeStyle = 'rgba(255,252,240,0.9)'; ctx.lineWidth = p * 1.1; ctx.stroke(); ctx.setLineDash([0.01, p * 2.2]); ctx.strokeStyle = dark; ctx.lineWidth = p * 0.7; ctx.stroke(); ctx.restore(); return;
  }
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(20,16,10,0.5)'; ctx.lineWidth = lw * 2; ctx.save(); ctx.translate(0.9, 1.7); ctx.stroke(); ctx.restore();
  ctx.fillStyle = shade(col, -0.4); ctx.fill(); ctx.clip();
  vRows(ctx, { x: x - s * 0.62, y: y - s * 0.62, w: s * 1.24, h: s * 1.24 }, p, col, [-0.05, 0.05]);
  const q = s / 4.2; ctx.save(); // a coarse net of larger eyelets across the patch
  for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const cx = x + (i + (j % 2 ? 0.5 : 0)) * q, cy = y + j * q * 0.86; hole(ctx, cx, cy, q * 0.26, q * 0.34, dark, 'rgba(255,252,240,0.9)', Math.max(1, q * 0.1)); }
  ctx.restore();
  const g = ctx.createLinearGradient(x - s / 2, y - s / 2, x + s / 2, y + s / 2); g.addColorStop(0, 'rgba(255,255,255,0.3)'); g.addColorStop(0.55, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(20,24,30,0.2)'); ctx.fillStyle = g; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  ctx.restore();
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = shade(col, -0.38); ctx.lineWidth = lw * 0.75; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw * 0.5; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = Math.max(0.8, lw * 0.13); ctx.save(); ctx.translate(-0.3, -0.5); ctx.stroke(); ctx.restore(); ctx.restore();
}

// ---- toquilla: a straw hat on its wooden block, seen from above and in front. The straw is a diagonal over-under plait (twill) that spirals out from the crown;
// the crown (inner rings) is raised on a plaited wall above the brim; a dyed stamp is the same strands in another colour, aligned with the plait so it reads as
// woven in, not pasted on. Interaction geometry follows the view (scene.tilt, see activity.js). ----
export const TOQ_TILT = { sy: 0.74, crown: 2, lift: 0.1 };
const TQ_NB = 2;
const tqBand = (B, rays, k) => { const pitch = B.thick / TQ_NB, ra = B.R0 + k * pitch, rb = ra + pitch, rm = (ra + rb) / 2, q = Math.max(1, Math.round((rm * TAU) / rays / (pitch * 1.45))); return { pitch, ra, rb, m: rays * q, q }; };
// one strand piece: a diagonal band across its cell, from the lower left to the upper right; (u0,u1) the angle (or arc) span, (v0,v1) radius (or height) span.
// o = 0: the strand passes over here (full width), o = 1: it dives under (narrower, so the dark gap between strands shows). Corners A B C D in order.
const tqPiece = (map, u0, u1, v0, v1, o) => {
  const L = u1 - u0, w = L * (o ? 0.42 : 0.62), e = u1 + L * 0.38;
  return [map(u0, v0), map(u0 + w, v0), map(e, v1), map(e - w, v1)];
};
// over/under in a 2 over 2 under twill: neighbouring pieces along a strand alternate in pairs, so the lit ridges run diagonally across the plait
const tqOver = (j, k) => ((((j - k) + ((j + k) >> 2)) % 4) + 4) % 4 < 2 ? 0 : 1;
// batch strand pieces by (over/under, tint) and draw them: body, shaded lower edge, lit ridge on the over strands, two fibre lines along every strand
const tqDraw = (ctx, pieces, base, lw) => {
  const B6 = [[], [], [], [], [], []];
  for (const pc of pieces) B6[pc.t * 3 + pc.h].push(pc.p);
  const path = (arr) => { ctx.beginPath(); for (const q of arr) { ctx.moveTo(q[0][0], q[0][1]); ctx.lineTo(q[1][0], q[1][1]); ctx.lineTo(q[2][0], q[2][1]); ctx.lineTo(q[3][0], q[3][1]); ctx.closePath(); } };
  for (let ty = 1; ty >= 0; ty--) for (let h = 0; h < 3; h++) {
    const arr = B6[ty * 3 + h]; if (!arr.length) continue;
    path(arr); ctx.fillStyle = shade(base, [-0.03, 0.02, 0.05][h] + (ty === 0 ? 0.05 : -0.13)); ctx.fill();
  }
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let ty = 0; ty < 2; ty++) {
    const all = [...B6[ty * 3], ...B6[ty * 3 + 1], ...B6[ty * 3 + 2]]; if (!all.length) continue;
    ctx.beginPath(); for (const q of all) { ctx.moveTo(q[1][0], q[1][1]); ctx.lineTo(q[2][0], q[2][1]); } ctx.strokeStyle = rgba(shade(base, -0.75), ty === 0 ? 0.5 : 0.35); ctx.lineWidth = lw * (ty === 0 ? 1.5 : 1.0); ctx.stroke();   // shade side (B-C)
    if (ty === 0) { ctx.beginPath(); for (const q of all) { ctx.moveTo((q[0][0] * 2 + q[1][0]) / 3, (q[0][1] * 2 + q[1][1]) / 3); ctx.lineTo((q[3][0] * 2 + q[2][0]) / 3, (q[3][1] * 2 + q[2][1]) / 3); } ctx.strokeStyle = rgba(shade(base, 0.6), 0.62); ctx.lineWidth = lw * 1.1; ctx.stroke(); }  // lit ridge
    ctx.beginPath(); for (const q of all) for (const f of [0.35, 0.68]) { ctx.moveTo(q[0][0] + (q[1][0] - q[0][0]) * f, q[0][1] + (q[1][1] - q[0][1]) * f); ctx.lineTo(q[3][0] + (q[2][0] - q[3][0]) * f, q[3][1] + (q[2][1] - q[3][1]) * f); } ctx.strokeStyle = rgba(shade(base, -0.55), 0.22); ctx.lineWidth = Math.max(0.5, lw * 0.5); ctx.stroke();   // palm fibres
  }
};
const tqPolar = (B, k, j, m, base, mapXY) => { const a0 = -Math.PI / 2 + (j / m) * TAU, a1 = a0 + TAU / m, o = tqOver(j, k); return { p: tqPiece(mapXY, a0, a1, 0, 1, o), t: o, h: Math.floor(hash(k, j, 5) * 3) % 3 }; };
// rings [r0, r1) of the whole plaited disc, in flat disc coordinates (the caller sets the view transform)
function tqField(ctx, B, rays, ring0, ring1, base) {
  const pieces = []; let lw = 1;
  for (let k = ring0 * TQ_NB; k < ring1 * TQ_NB; k++) {
    const { ra, rb, m, pitch } = tqBand(B, rays, k); lw = Math.max(0.7, pitch * 0.09);
    for (let j = 0; j < m; j++) { const mapXY = (a, v) => { const rr = ra + (rb - ra) * v; return [B.cx + Math.cos(a) * rr, B.cy + Math.sin(a) * rr]; }; pieces.push(tqPolar(B, k, j, m, base, mapXY)); }
  }
  ctx.fillStyle = shade(base, -0.55); ctx.beginPath(); ctx.arc(B.cx, B.cy, B.R0 + ring1 * B.thick, 0, TAU); if (ring0 > 0) ctx.arc(B.cx, B.cy, B.R0 + ring0 * B.thick, 0, TAU, true); ctx.fill('evenodd');
  tqDraw(ctx, pieces, base, lw);
}
const tqSkin = (S) => mix(S.bg, '#e4d09a', 0.7);
const tqT = (ctx, B, crown) => { ctx.translate(B.cx, B.cy - (crown ? TOQ_TILT.lift * B.R : 0)); ctx.scale(1, TOQ_TILT.sy); ctx.translate(-B.cx, -B.cy); };
export function toquillaEnv(ctx, S) {
  const a = S.area, X0 = a.x - 12, W = a.w + 24, g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#6e5636'); g.addColorStop(1, '#4a3720'); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, a.h);
  lines(ctx, { x: X0, y: a.y, w: W, h: a.h }, 'h', S.cell * 0.9, '#000', 0.08, 1, S.cell * 0.2, 7); speck(ctx, a, 260, ['#2a1c0c', '#a88a58'], 0.2, 2, 13);
  for (let k = 0; k < 6; k++) { ctx.save(); ctx.translate(a.x + a.w * (0.05 + hash(k, 1) * 0.9), a.y + a.h * (0.05 + hash(k, 2) * 0.9)); ctx.rotate(0.9 + (hash(k, 3) - 0.5) * 0.8); ctx.fillStyle = 'rgba(20,14,4,0.2)'; ctx.beginPath(); ctx.ellipse(0, 0, a.w * 0.2, a.w * 0.024, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  glow(ctx, a.x + a.w * 0.2, a.y + a.h * 0.08, a.w * 0.95, '#ffe6b0', 0.36);
  const v = ctx.createRadialGradient(a.x + a.w / 2, a.y + a.h / 2, Math.min(a.w, a.h) * 0.25, a.x + a.w / 2, a.y + a.h / 2, Math.max(a.w, a.h) * 0.8); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)'); ctx.fillStyle = v; ctx.fillRect(X0, a.y, W, a.h);
}
export function toquillaUnder(ctx, S) { // the hat's shadow on the table and the turned wooden block under the brim
  const B = S.B; if (!B || !B.R0) return;
  const R = B.R, sy = TOQ_TILT.sy, th = R * 0.075, cx = B.cx, front = B.cy + R * sy + th, w = R * 0.5, bot = front + R * 0.3;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = R * 0.3; ctx.shadowOffsetX = R * 0.12; ctx.shadowOffsetY = R * 0.12; ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(B.cx, B.cy + th, R, R * sy, 0, 0, TAU); ctx.fill(); ctx.restore();
  const g = ctx.createLinearGradient(cx - w, 0, cx + w, 0); g.addColorStop(0, '#5a3818'); g.addColorStop(0.35, '#c48e52'); g.addColorStop(0.6, '#a06c36'); g.addColorStop(1, '#4a2c12');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - w * 0.74, front - R * 0.1); ctx.lineTo(cx + w * 0.74, front - R * 0.1); ctx.lineTo(cx + w, bot - R * 0.05); ctx.quadraticCurveTo(cx + w, bot + R * 0.02, cx + w * 0.88, bot + R * 0.02); ctx.lineTo(cx - w * 0.88, bot + R * 0.02); ctx.quadraticCurveTo(cx - w, bot + R * 0.02, cx - w, bot - R * 0.05); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(30,14,2,0.55)'; ctx.lineWidth = 1.2; for (let k = 1; k < 4; k++) { const y = front + (bot - front) * k / 4; ctx.beginPath(); ctx.moveTo(cx - w * (0.84 + 0.04 * k), y); ctx.lineTo(cx + w * (0.84 + 0.04 * k), y); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,230,180,0.25)'; ctx.fillRect(cx - w * 0.5, front - R * 0.1, w * 0.14, bot - front + R * 0.1);
}
export function toquillaBase(ctx, S) { // the brim's edge thickness (a plaited wall below the front of the ellipse)
  const B = S.B; if (!B || !B.R0) return; const R = B.R, sy = TOQ_TILT.sy, th = R * 0.075, base = tqSkin(S);
  ctx.save(); ctx.fillStyle = shade(base, -0.55); ctx.beginPath(); ctx.ellipse(B.cx, B.cy + th, R + S.cell * 0.05, R * sy + S.cell * 0.05, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,238,190,0.3)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(B.cx, B.cy + th * 0.5, R + S.cell * 0.05, R * sy + S.cell * 0.05, 0, 0.12 * Math.PI, 0.88 * Math.PI); ctx.stroke(); ctx.restore();
  ctx.fillStyle = shade(base, -0.5); ctx.beginPath(); ctx.ellipse(B.cx, B.cy, R + S.cell * 0.05, R * sy + S.cell * 0.05, 0, 0, TAU); ctx.fill();
}
export function toquillaGround(ctx, S) {
  const B = S.B; if (!B || !B.R0 || S.polar === false) { ctx.fillStyle = S.bg; ctx.fillRect(S.rect.x, S.rect.y, S.rect.w, S.rect.h); return; }
  const rays = S.cols, rings = S.rows, base = tqSkin(S), cr = TOQ_TILT.crown, rc = B.R0 + cr * B.thick, Hw = TOQ_TILT.lift * B.R, sy = TOQ_TILT.sy;
  // brim: the outer rings, flat on the table plane
  ctx.save(); tqT(ctx, B, false); tqField(ctx, B, rays, cr, rings, base); ctx.restore();
  // crown base shadow on the brim, thrown right and down
  ctx.save(); tqT(ctx, B, false); ctx.beginPath(); ctx.arc(B.cx, B.cy, B.R0 + (cr + 1) * B.thick, 0, TAU); ctx.arc(B.cx, B.cy, rc, 0, TAU, true); ctx.clip('evenodd'); const sg = ctx.createRadialGradient(B.cx + rc * 0.12, B.cy + rc * 0.1, rc * 0.9, B.cx + rc * 0.12, B.cy + rc * 0.1, rc * 1.5); sg.addColorStop(0, 'rgba(20,10,0,0.5)'); sg.addColorStop(1, 'rgba(20,10,0,0)'); ctx.fillStyle = sg; ctx.fillRect(B.cx - B.R, B.cy - B.R, B.R * 2, B.R * 2); ctx.restore();
  // crown wall: the front half of a plaited cylinder, strands slanting the same way up as on the brim
  const nz = 3, cols2 = Math.max(16, rays * 2), pieces = [], ww = Hw / nz;
  for (let k = 0; k < nz; k++) for (let j = 0; j < cols2; j++) { const a0 = (j / cols2) * Math.PI, a1 = a0 + Math.PI / cols2, map = (a, v) => [B.cx + Math.cos(a) * rc, B.cy + sy * Math.sin(a) * rc - (k + v) * ww]; const type = tqOver(j, k); pieces.push({ p: tqPiece(map, a0, a1, 0, 1, type), t: type, h: Math.floor(hash(k, j, 9) * 3) % 3 }); }
  ctx.save(); ctx.beginPath(); ctx.moveTo(B.cx - rc, B.cy); ctx.ellipse(B.cx, B.cy, rc, rc * sy, 0, Math.PI, 0, true); ctx.lineTo(B.cx + rc, B.cy - Hw); ctx.ellipse(B.cx, B.cy - Hw, rc, rc * sy, 0, 0, Math.PI, false); ctx.closePath(); ctx.clip();
  ctx.fillStyle = shade(base, -0.62); ctx.fillRect(B.cx - rc, B.cy - Hw - rc * sy, rc * 2, Hw + rc * sy * 2 + 2); tqDraw(ctx, pieces, shade(base, -0.06), Math.max(0.7, ww * 0.12));
  const cg = ctx.createLinearGradient(B.cx - rc, 0, B.cx + rc, 0); cg.addColorStop(0, 'rgba(10,4,0,0.55)'); cg.addColorStop(0.28, 'rgba(255,240,190,0.12)'); cg.addColorStop(0.6, 'rgba(0,0,0,0.12)'); cg.addColorStop(1, 'rgba(10,4,0,0.62)'); ctx.fillStyle = cg; ctx.fillRect(B.cx - rc, B.cy - Hw - rc * sy, rc * 2, Hw + rc * sy * 2 + 2);
  ctx.restore();
  // crown top, raised
  ctx.save(); tqT(ctx, B, true); tqField(ctx, B, rays, 0, cr, base); ctx.restore();
  ctx.strokeStyle = 'rgba(30,18,4,0.55)'; ctx.lineWidth = Math.max(1.2, S.cell * 0.05); ctx.beginPath(); ctx.ellipse(B.cx, B.cy - Hw, rc, rc * sy, 0, 0, TAU); ctx.stroke();
}
export function toquillaOver(ctx, S) { // light: the crown top lit from the upper left, the wall dark at its edges, the brim catching light near its rim
  const B = S.B; if (!B || !B.R0) return; const R = B.R, rc = B.R0 + TOQ_TILT.crown * B.thick;
  ctx.save(); tqT(ctx, B, false); ctx.beginPath(); ctx.arc(B.cx, B.cy, R, 0, TAU); ctx.arc(B.cx, B.cy, rc, 0, TAU, true); ctx.clip('evenodd');
  const lg = ctx.createLinearGradient(B.cx - R, B.cy - R, B.cx + R, B.cy + R); lg.addColorStop(0, 'rgba(255,244,205,0.22)'); lg.addColorStop(0.5, 'rgba(255,244,205,0)'); lg.addColorStop(1, 'rgba(25,12,0,0.4)'); ctx.fillStyle = lg; ctx.fillRect(B.cx - R, B.cy - R, R * 2, R * 2);
  const rg = ctx.createRadialGradient(B.cx, B.cy, R * 0.6, B.cx, B.cy, R); rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(0.8, 'rgba(255,240,190,0.07)'); rg.addColorStop(1, 'rgba(20,10,0,0.45)'); ctx.fillStyle = rg; ctx.fillRect(B.cx - R, B.cy - R, R * 2, R * 2); ctx.restore();
  ctx.save(); tqT(ctx, B, true); ctx.beginPath(); ctx.arc(B.cx, B.cy, rc, 0, TAU); ctx.clip();
  const tg = ctx.createRadialGradient(B.cx - rc * 0.35, B.cy - rc * 0.4, 0, B.cx - rc * 0.1, B.cy - rc * 0.1, rc * 1.1); tg.addColorStop(0, 'rgba(255,248,215,0.4)'); tg.addColorStop(0.5, 'rgba(255,248,215,0.06)'); tg.addColorStop(1, 'rgba(25,12,0,0.34)'); ctx.fillStyle = tg; ctx.fillRect(B.cx - rc, B.cy - rc, rc * 2, rc * 2); ctx.restore();
}
export function toquillaFrame(ctx, S) { // the braided finishing rope round the brim and the start spiral of the crown
  const B = S.B; if (!B || !B.R0) return; const R = B.R + S.cell * 0.05, sy = TOQ_TILT.sy, w = Math.max(4, S.cell * 0.2), Hw = TOQ_TILT.lift * B.R;
  ctx.save(); ctx.translate(B.cx, B.cy); ctx.scale(1, sy); ctx.lineCap = 'butt';
  ctx.strokeStyle = 'rgba(30,18,4,0.55)'; ctx.lineWidth = w + 2; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
  ctx.strokeStyle = '#a98a4c'; ctx.lineWidth = w; ctx.stroke(); ctx.strokeStyle = '#d6c088'; ctx.lineWidth = w * 0.8; ctx.setLineDash([w * 0.5, w * 0.34]); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,250,220,0.75)'; ctx.lineWidth = w * 0.22; ctx.setLineDash([w * 0.24, w * 0.6]); ctx.stroke(); ctx.restore();
  const hr = B.R0 * 0.82; ctx.save(); ctx.translate(B.cx, B.cy - Hw); ctx.scale(1, sy); ctx.strokeStyle = 'rgba(30,18,4,0.6)'; ctx.lineWidth = 1.4; ctx.fillStyle = mix(tqSkin(S), '#e6d29a', 0.5); ctx.beginPath(); ctx.arc(0, 0, hr, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.lineWidth = Math.max(1, hr * 0.14); for (let k = 1; k <= 2; k++) { ctx.beginPath(); ctx.arc(0, 0, hr * k / 3, 0, TAU); ctx.stroke(); } ctx.restore();
}
// does the point (u, v), in units of the stamp size from its centre, lie inside the motif? (strand pieces are kept or dropped whole, so a stamp has the
// stepped edge of dyed straw, not a cut-out)
const tqPoly = (pts, u, v) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > v) !== (yj > v) && u < ((xj - xi) * (v - yi)) / (yj - yi) + xi) c = !c; } return c; };
const TQ_STAR = Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4 - Math.PI / 2, r = i % 2 ? 0.19 : 0.46; return [Math.cos(a) * r, Math.sin(a) * r]; });
const tqInside = (kind, u, v) => {
  switch (kind) {
    case 'solid': return Math.abs(u) < 0.46 && Math.abs(v) < 0.46;
    case 'diamond': return Math.abs(u) + Math.abs(v) < 0.46;
    case 'dot': return u * u + v * v < 0.27 * 0.27;
    case 'star': return tqPoly(TQ_STAR, u, v);
    case 'stripe-v': { const m = ((u + 0.5) % 0.3 + 0.3) % 0.3; return Math.abs(v) < 0.44 && Math.abs(u) < 0.5 && Math.abs(Math.round(u / 0.3) * 0.3 - u) < 0.1; void m; }
    case 'stripe-h': return Math.abs(u) < 0.44 && Math.abs(v) < 0.5 && Math.abs(Math.round(v / 0.3) * 0.3 - v) < 0.1;
    case 'cross': return (Math.abs(u) < 0.14 && Math.abs(v) < 0.42) || (Math.abs(v) < 0.14 && Math.abs(u) < 0.42);
    case 'triangle': return v > -0.43 && v < 0.36 && Math.abs(u) < (v + 0.43) * 0.55;
    case 'hexagon': return Math.abs(v) < 0.4 && Math.abs(u) < 0.43 - Math.abs(v) * 0.5;
    case 'checker': return (u < 0 && v < 0 && u > -0.4 && v > -0.4) || (u > 0 && v > 0 && u < 0.4 && v < 0.4);
    default: return u * u + v * v < 0.38 * 0.38;
  }
};
export function toquillaSkin(ctx, S, d) {
  const { kind, col, x, y, s } = d, fill = isFilled(kind), B = S && S.B, lw = lineWidthOf(kind, s);
  if (!fill) { // a single dyed splint laid round the shape: a braided cord
    const w = Math.max(2, lw * 0.9); ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(30,18,4,0.38)'; ctx.lineWidth = w + 1.6; ctx.save(); ctx.translate(0.8, 1.4); ctx.stroke(); ctx.restore(); ctx.strokeStyle = shade(col, -0.4); ctx.lineWidth = w; ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = w * 0.8; ctx.setLineDash([w * 0.55, w * 0.38]); ctx.stroke(); ctx.restore(); return;
  }
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(25,14,2,0.3)'; ctx.lineWidth = s * 0.07; ctx.save(); ctx.translate(s * 0.012, s * 0.03); ctx.stroke(); ctx.restore();
  ctx.fillStyle = shade(col, -0.4); ctx.fill(); ctx.clip();
  const T = ctx.getTransform ? ctx.getTransform() : null; if (T && T.a * T.d - T.b * T.c < 0) ctx.scale(-1, 1);   // undo a mirror so the strands keep the plait's own slant
  const pieces = []; let lw2 = 1;
  const keep = () => true;   // the motif clips the strands; the stamp is the plait itself, dyed
  if (B && B.R0 && S.cols > 1) {
    const rays = S.cols, c = d.c, r = d.r, Rc = B.R0 + (r + 0.5) * B.thick, phc = -Math.PI / 2 + (c + 0.5) * ((2 * Math.PI) / rays);
    for (let b = 0; b < TQ_NB; b++) { const k = r * TQ_NB + b, { ra, rb, m, q, pitch } = tqBand(B, rays, k); lw2 = Math.max(0.7, pitch * 0.09);
      for (let j = c * q - 1; j < (c + 1) * q + 1; j++) { const mapXY = (a, v) => { const rr = ra + (rb - ra) * v, dl = a - phc; return [x + rr * Math.sin(dl), y - (rr * Math.cos(dl) - Rc)]; }; const pc = tqPolar(B, k, ((j % m) + m) % m, m, col, mapXY); if (keep(pc.p)) pieces.push(pc); } }
  } else { // the tray swatch: a flat patch of the same twill
    const n = 6, p = s / n, f = (px, py) => [x - s / 2 + px * p, y - s / 2 + py * p]; lw2 = Math.max(0.7, p * 0.09);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const o = tqOver(i, j), map = (u, v) => f(u, v + j), pc = { p: tqPiece(map, i, i + 1, 0, 1, o), t: o, h: Math.floor(hash(i, j, 9) * 3) % 3 }; if (keep(pc.p)) pieces.push(pc); }
  }
  tqDraw(ctx, pieces, col, lw2);
  const gl = ctx.createLinearGradient(x - s / 2, y - s / 2, x + s / 2, y + s / 2); gl.addColorStop(0, 'rgba(255,255,235,0.1)'); gl.addColorStop(1, 'rgba(20,10,0,0.16)'); ctx.fillStyle = gl; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  ctx.restore();
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(shade(col, -0.6), 0.45); ctx.lineWidth = Math.max(0.8, s * 0.02); ctx.stroke(); ctx.restore();
}

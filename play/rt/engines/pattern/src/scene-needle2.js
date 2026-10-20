// Needlework scene art, 1.12.0, part 2: zardozi (couched gold wire on velvet in an adda frame) and gota patti (folded metallic ribbon sewn onto silk).
import { hash, rgba, mix, shade, roundRectPath, rod, ball, speck, lines, glow, vignette, TAU, motifPath, isFilled, POT } from './scene-kit.js';
import { cord, kindPath, clothGround, edgeShade, isLand, lightShaft } from './scene-needle.js';

// ---- supply pots of this family ----------------------------------------------------------------------------------------------------
const bxx = (b) => ({ cx: b.x + b.w / 2, cy: b.y + b.h / 2, r: Math.min(b.w, b.h) / 2 });
function potBack(ctx, b, c, a = 0.5) { ctx.save(); roundRectPath(ctx, b.x, b.y, b.w, b.h, 12); ctx.fillStyle = rgba(c, a); ctx.fill(); ctx.restore(); }
function potRing(ctx, S, b, on) {
  ctx.save(); ctx.strokeStyle = on ? S.pal.accent : 'rgba(255,255,255,0.28)'; ctx.lineWidth = on ? 4 : 1.5; roundRectPath(ctx, b.x, b.y, b.w, b.h, 12); ctx.stroke();
  if (on) { ctx.fillStyle = S.pal.accent; ctx.beginPath(); ctx.arc(b.x + b.w - 7, b.y + 7, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x + b.w - 9.5, b.y + 7); ctx.lineTo(b.x + b.w - 7.2, b.y + 9); ctx.lineTo(b.x + b.w - 4.5, b.y + 5); ctx.stroke(); }
  ctx.restore();
}
const metal = (ctx, x0, y0, x1, y1, col) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, shade(col, 0.55)); g.addColorStop(0.3, shade(col, 0.05)); g.addColorStop(0.5, shade(col, 0.5)); g.addColorStop(0.75, shade(col, -0.35)); g.addColorStop(1, shade(col, -0.05)); return g; };
// a coil of wire: concentric turns on a card, lit
POT.wirecoil = (ctx, S, b, col, on) => {
  const { cx, cy, r } = bxx(b), lift = on ? -3 : 0; potBack(ctx, b, '#2a0c10', 0.6);
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(cx + 2, cy + r * 0.12 + lift + r * 0.5, r * 0.8, r * 0.3, 0, 0, TAU); ctx.fill();
  ctx.save(); ctx.translate(cx, cy + lift); ctx.lineCap = 'round';
  for (let k = 0; k < 7; k++) { const R = r * (0.78 - k * 0.095); ctx.strokeStyle = metal(ctx, -R, -R, R, R, col); ctx.lineWidth = r * 0.1; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = r * 0.02; ctx.beginPath(); ctx.arc(0, 0, R - r * 0.05, 0, TAU); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = r * 0.03; ctx.beginPath(); ctx.arc(0, 0, r * 0.7, Math.PI * 1.1, Math.PI * 1.55); ctx.stroke();
  ctx.restore(); potRing(ctx, S, b, on);
};
// a roll of flat ribbon seen from its end, the loose end lying out
POT.ribbonroll = (ctx, S, b, col, on) => {
  const { cx, cy, r } = bxx(b), lift = on ? -3 : 0; potBack(ctx, b, '#3a0a22', 0.55);
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(cx + 2, cy + r * 0.62 + lift, r * 0.85, r * 0.2, 0, 0, TAU); ctx.fill();
  ctx.save(); ctx.translate(cx - r * 0.1, cy + lift);
  const g = ctx.createLinearGradient(-r * 0.7, 0, r * 0.7, 0); g.addColorStop(0, shade(col, -0.45)); g.addColorStop(0.3, shade(col, 0.4)); g.addColorStop(0.65, col); g.addColorStop(1, shade(col, -0.5)); ctx.fillStyle = g; roundRectPath(ctx, -r * 0.7, -r * 0.5, r * 1.4, r * 1.0, r * 0.1); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; for (let k = 1; k < 6; k++) { ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.5 + k * r * 0.1667); ctx.lineTo(r * 0.7, -r * 0.5 + k * r * 0.1667); ctx.stroke(); }
  ctx.fillStyle = shade(col, 0.2); ctx.beginPath(); ctx.ellipse(-r * 0.7, 0, r * 0.14, r * 0.5, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = shade(col, -0.5); ctx.lineWidth = 1.2; ctx.stroke(); ctx.beginPath(); ctx.ellipse(-r * 0.7, 0, r * 0.07, r * 0.25, 0, 0, TAU); ctx.stroke();
  ctx.fillStyle = shade(col, 0.1); ctx.beginPath(); ctx.moveTo(r * 0.7, r * 0.5); ctx.lineTo(r * 1.0, r * 0.7); ctx.lineTo(r * 0.6, r * 0.78); ctx.lineTo(r * 0.7, r * 0.2); ctx.fill();
  ctx.restore(); potRing(ctx, S, b, on);
};

// ====================================================================================================================================================
// ZARDOZI: gold and silver wire couched on velvet in an adda frame. The cloth is deep velvet with a brushed pile; wire is coiled with tiny ties across it;
// filled stamps are metallic plates built from concentric wire, with a spangle; the dot is a faceted stone in a claw.
// ====================================================================================================================================================
export function zardoziEnv(ctx, S) {
  const a = S.area, X0 = a.x - 12, W = a.w + 24, c = S.cell;
  const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#3a0c14'); g.addColorStop(0.6, '#240810'); g.addColorStop(1, '#10040a'); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, a.h);
  // draped velvet behind: vertical folds, each with a lit ridge
  ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, a.h); ctx.clip();
  for (let i = 0; i < 9; i++) { const x = a.x + (i + hash(i, 1) * 0.5) * a.w / 8, w = c * (1.2 + hash(i, 2)), gg = ctx.createLinearGradient(x - w, 0, x + w, 0); gg.addColorStop(0, 'rgba(0,0,0,0)'); gg.addColorStop(0.45, `rgba(255,130,120,${0.06 + hash(i, 3) * 0.08})`); gg.addColorStop(0.6, 'rgba(0,0,0,0.3)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gg; ctx.fillRect(x - w, a.y, w * 2, a.h); }
  ctx.restore();
  glow(ctx, a.x + a.w * 0.82, a.y + a.h * 0.08, Math.max(a.w, a.h) * 0.9, '#ffc070', 0.32);
  glow(ctx, a.x + a.w * 0.1, a.y + a.h * 0.95, Math.max(a.w, a.h) * 0.5, '#ff8040', 0.12);
  // gold dust glints on the floor of the workshop
  for (let k = 0; k < 40; k++) { const x = a.x + hash(k, 5) * a.w, y = a.y + hash(k, 6) * a.h; ctx.fillStyle = `rgba(255,210,120,${0.08 + hash(k, 7) * 0.3})`; ctx.beginPath(); ctx.arc(x, y, 0.7 + hash(k, 8) * 1.3, 0, TAU); ctx.fill(); }
  vignette(ctx, a, 0.55);
}
// the adda: a heavy teak frame, turned knobs at the corners, the velvet laced to the side bars with cord
export function zardoziUnder(ctx, S) {
  const r = S.rect, c = S.cell, t = Math.max(9, c * 0.55), R = { x: r.x - t, y: r.y - t, w: r.w + 2 * t, h: r.h + 2 * t };
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = c * 1.2; ctx.shadowOffsetY = c * 0.45; ctx.fillStyle = '#000'; ctx.fillRect(R.x, R.y, R.w, R.h); ctx.restore();
  const teak = '#6a3a1a', bar = (x0, y0, w, h, vert) => { const g = vert ? ctx.createLinearGradient(x0, 0, x0 + w, 0) : ctx.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, shade(teak, 0.28)); g.addColorStop(0.35, teak); g.addColorStop(1, shade(teak, -0.5)); ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h);
    ctx.strokeStyle = 'rgba(20,6,0,0.35)'; ctx.lineWidth = 1; for (let k = 1; k < 5; k++) { ctx.beginPath(); if (vert) { ctx.moveTo(x0 + (w * k) / 5, y0); ctx.lineTo(x0 + (w * k) / 5 + (hash(k, 3) - 0.5) * 3, y0 + h); } else { ctx.moveTo(x0, y0 + (h * k) / 5); ctx.lineTo(x0 + w, y0 + (h * k) / 5 + (hash(k, 4) - 0.5) * 3); } ctx.stroke(); } };
  bar(R.x, R.y, R.w, t, false); bar(R.x, R.y + R.h - t, R.w, t, false); bar(R.x, R.y, t, R.h, true); bar(R.x + R.w - t, R.y, t, R.h, true);
  ctx.fillStyle = 'rgba(255,200,140,0.35)'; ctx.fillRect(R.x, R.y, R.w, Math.max(1, t * 0.08)); ctx.fillRect(R.x, R.y, Math.max(1, t * 0.08), R.h);
  for (const [kx, ky] of [[R.x, R.y], [R.x + R.w, R.y], [R.x, R.y + R.h], [R.x + R.w, R.y + R.h]]) { ball(ctx, kx, ky, t * 0.58, '#8a5028', false); ctx.fillStyle = 'rgba(255,214,160,0.5)'; ctx.beginPath(); ctx.arc(kx - t * 0.2, ky - t * 0.2, t * 0.16, 0, TAU); ctx.fill(); }
  // lacing between the cloth and the side bars
  ctx.strokeStyle = '#e8d8b0'; ctx.lineWidth = Math.max(1.4, c * 0.05); ctx.lineCap = 'round'; ctx.beginPath();
  for (let y = r.y + c * 0.3; y < r.y + r.h; y += c * 0.55) { ctx.moveTo(r.x + 2, y); ctx.lineTo(R.x + t * 0.6, y - c * 0.2); ctx.moveTo(r.x + r.w - 2, y); ctx.lineTo(R.x + R.w - t * 0.6, y - c * 0.2); }
  ctx.stroke();
}
export function zardoziGround(ctx, S) {
  const r = S.rect, c = S.cell, m = S.bg;
  ctx.fillStyle = m; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  // velvet pile: brushed in broad directions (lighter where the pile leans toward the lamp), with fine speckle
  for (let k = 0; k < 9; k++) { const px = r.x + hash(k, 1) * r.w, py = r.y + hash(k, 2) * r.h, R = c * (2 + hash(k, 3) * 3), g = ctx.createRadialGradient(px, py, 0, px, py, R); g.addColorStop(0, hash(k, 4) > 0.4 ? 'rgba(255,120,110,0.12)' : 'rgba(0,0,0,0.2)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(px - R, py - R, R * 2, R * 2); }
  if (!S.lite) { speck(ctx, r, 520, [shade(m, 0.45), shade(m, -0.6)], 0.22, Math.max(0.8, c * 0.02), 31); lines(ctx, r, 'h', Math.max(2, c / 14), shade(m, 0.3), 0.06, 1, 0.5, 3); }
  const g = ctx.createLinearGradient(r.x + r.w, r.y, r.x, r.y + r.h); g.addColorStop(0, 'rgba(255,150,120,0.22)'); g.addColorStop(0.5, 'rgba(255,150,120,0)'); g.addColorStop(1, 'rgba(0,0,0,0.3)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.restore();
}
export const zardoziOver = (ctx, S) => edgeShade(ctx, S, 0.4);
// a faceted stone in a claw setting
function stone(ctx, x, y, R, col) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.arc(x + R * 0.12, y + R * 0.22, R * 1.08, 0, TAU); ctx.fill();
  ctx.fillStyle = metal(ctx, x - R, y - R, x + R, y + R, '#d9a830'); ctx.beginPath(); ctx.arc(x, y, R * 1.02, 0, TAU); ctx.fill();
  for (let k = 0; k < 8; k++) { const a0 = (k / 8) * TAU + 0.2; ctx.fillStyle = shade('#d9a830', k % 2 ? 0.3 : -0.2); ctx.beginPath(); ctx.arc(x + Math.cos(a0) * R * 0.92, y + Math.sin(a0) * R * 0.92, R * 0.12, 0, TAU); ctx.fill(); }
  const n = 8; for (let k = 0; k < n; k++) { // facets
    const a0 = (k / n) * TAU - Math.PI / 2, a1 = ((k + 1) / n) * TAU - Math.PI / 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, R * 0.76, a0, a1); ctx.closePath();
    const lit = Math.cos((a0 + a1) / 2 + 2.4); ctx.fillStyle = shade(col, 0.25 * lit - (k % 2 ? 0.1 : 0)); ctx.fill(); ctx.strokeStyle = rgba(shade(col, -0.5), 0.6); ctx.lineWidth = 0.8; ctx.stroke(); }
  ctx.fillStyle = shade(col, 0.5); ctx.beginPath(); ctx.arc(x, y, R * 0.26, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.ellipse(x - R * 0.3, y - R * 0.34, R * 0.16, R * 0.09, -0.7, 0, TAU); ctx.fill();
}
export function zardoziSkin(ctx, S, d) {
  const { kind, col, x, y, s } = d, fill = isFilled(kind), lw = Math.max(2.2, s * 0.095);
  if (kind === 'dot') { stone(ctx, x, y, s * 0.4, col); return; }
  const wire = (sc, w, c2) => {
    cord(ctx, kindPath(ctx, kind, x, y, s * sc), w, c2, { dash: [0.55, 0.1], hi: 0.9 });
    // couching ties: short dark crossings
    ctx.save(); ctx.lineCap = 'butt'; ctx.setLineDash([w * 0.16, w * 1.15]); kindPath(ctx, kind, x, y, s * sc)(0, 0); ctx.strokeStyle = 'rgba(70,0,16,0.75)'; ctx.lineWidth = w * 1.1; ctx.stroke(); ctx.restore();
  };
  if (!fill) { wire(1.04, lw, col); return; }
  // plate: a thin metallic base, then the wire laid in concentric turns, and a spangle at the heart
  ctx.save(); kindPath(ctx, kind, x, y, s * 1.04)(0, 0); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.save(); ctx.translate(s * 0.03, s * 0.06); ctx.fill(); ctx.restore(); ctx.fillStyle = metal(ctx, x - s / 2, y - s / 2, x + s / 2, y + s / 2, col); ctx.fill(); ctx.restore();
  [0.98, 0.72, 0.46].forEach((sc, i) => wire(sc, lw * (i ? 0.85 : 1), i % 2 ? shade(col, 0.12) : col));
  const R = s * 0.15; ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(x + R * 0.12, y + R * 0.2, R, 0, TAU); ctx.fill();
  ctx.fillStyle = metal(ctx, x - R, y - R, x + R, y + R, shade(col, 0.1)); ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a0810'; ctx.beginPath(); ctx.arc(x, y, R * 0.25, 0, TAU); ctx.fill();
}

// ====================================================================================================================================================
// GOTA PATTI: small pieces of metallic ribbon folded into diamonds and triangles and sewn flat onto bright silk. A filled stamp is ribbon pressed into the
// shape: a metallic face with 45-degree fold creases, a stitched edge; a line stamp is a flat band with pleat ticks.
// ====================================================================================================================================================
export function gotaEnv(ctx, S) {
  const a = S.area, X0 = a.x - 12, W = a.w + 24, c = S.cell;
  // pink sandstone wall with a cusped-arch window; white cotton floor-sheet below, window light thrown across it
  const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#d98a72'); g.addColorStop(0.55, '#c0654e'); g.addColorStop(1, '#8a3a2c'); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, a.h);
  ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, a.h); ctx.clip();
  const bh = c * 1.1, bw = c * 2.2; for (let y = a.y, j = 0; y < a.y + a.h; y += bh, j++) for (let x = a.x - (j % 2) * bw / 2 - bw, i = 0; x < a.x + a.w + bw; x += bw, i++) { ctx.fillStyle = rgba(hash(i, j, 2) > 0.5 ? '#ffd8c0' : '#4a1008', 0.04 + hash(i, j, 3) * 0.05); ctx.fillRect(x + 1, y + 1, bw - 2, bh - 2); }
  ctx.strokeStyle = 'rgba(70,20,10,0.35)'; ctx.lineWidth = 1.2; for (let y = a.y; y < a.y + a.h; y += bh) { ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(X0 + W, y); ctx.stroke(); }
  // cusped arch openings (a row of them), a pale sky inside
  const aw = c * 3.2, ah = c * 4.2, y1 = a.y + a.h * 0.02;
  for (let x = a.x + aw * 0.15, i = 0; x < a.x + a.w; x += aw * 1.5, i++) {
    const ax = x, top = y1 + c * 0.2;
    ctx.save(); ctx.beginPath(); ctx.moveTo(ax, top + ah); ctx.lineTo(ax, top + ah * 0.36);
    const cu = 4; for (let k = 0; k < cu; k++) { const x0 = ax + (aw * k) / cu, x1 = ax + (aw * (k + 1)) / cu; ctx.quadraticCurveTo((x0 + x1) / 2, top + ah * 0.36 - ah * 0.16 - (k === 1 || k === 2 ? ah * 0.16 : 0), x1, top + ah * 0.36 - (k === 1 ? ah * 0.12 : k === 2 ? ah * 0.12 : 0) + (k === 3 ? 0 : 0)); }
    ctx.lineTo(ax + aw, top + ah); ctx.closePath(); ctx.fillStyle = '#6a2418'; ctx.fill(); ctx.clip();
    const sg = ctx.createLinearGradient(0, top, 0, top + ah); sg.addColorStop(0, '#f8f0d8'); sg.addColorStop(1, '#f0b878'); ctx.fillStyle = sg; ctx.fillRect(ax, top, aw, ah); ctx.fillStyle = 'rgba(60,20,10,0.35)'; ctx.fillRect(ax, top, aw * 0.12, ah); ctx.restore();
  }
  ctx.restore();
  // floor sheet
  const fy = a.y + a.h * 0.34; const fg = ctx.createLinearGradient(0, fy, 0, a.y + a.h); fg.addColorStop(0, '#d8c8b0'); fg.addColorStop(0.15, '#f4ece0'); fg.addColorStop(1, '#cfc0aa'); ctx.fillStyle = fg; ctx.fillRect(X0, fy, W, a.y + a.h - fy);
  ctx.strokeStyle = 'rgba(90,60,40,0.12)'; ctx.lineWidth = 1; for (let y = fy + c * 0.3; y < a.y + a.h; y += c * 0.4) { ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(X0 + W, y); ctx.stroke(); }
  ctx.fillStyle = 'rgba(60,30,20,0.35)'; ctx.fillRect(X0, fy - 2, W, 4);
  lightShaft(ctx, { x: a.x, y: fy, w: a.w, h: a.y + a.h - fy }, a.x + a.w * 0.1, a.w * 0.5, a.w * 0.3, '#fff4c8', 0.3, 3);
  vignette(ctx, a, 0.35);
}
export function gotaGround(ctx, S) { clothGround(ctx, S, { count: 8, wa: 0.2, ka: 0.1, lit: 0.22, dark: 0.18 }); const r = S.rect; ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = Math.max(1, S.cell * 0.05); for (let k = -4; k < 12; k++) { ctx.beginPath(); ctx.moveTo(r.x + (k * r.w) / 6, r.y); ctx.lineTo(r.x + (k * r.w) / 6 + r.h * 0.5, r.y + r.h); ctx.stroke(); } ctx.restore(); }
export const gotaOver = (ctx, S) => edgeShade(ctx, S, 0.25);
export function gotaSkin(ctx, S, d) {
  const { kind, col, x, y, s } = d, fill = isFilled(kind), w = Math.max(3, s * 0.15), edge = '#fff4d8';
  const sew = (sc) => { ctx.save(); ctx.setLineDash([s * 0.07, s * 0.06]); ctx.lineCap = 'round'; kindPath(ctx, kind, x, y, s * sc)(0, 0); ctx.strokeStyle = rgba(edge, 0.85); ctx.lineWidth = Math.max(0.9, s * 0.028); ctx.stroke(); ctx.restore(); };
  if (!fill) { // a flat band with pleat ticks and sewn edges
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    kindPath(ctx, kind, x, y, s * 1.04)(s * 0.02, s * 0.04); ctx.strokeStyle = 'rgba(40,0,20,0.4)'; ctx.lineWidth = w * 1.3; ctx.stroke();
    kindPath(ctx, kind, x, y, s * 1.04)(0, 0); ctx.strokeStyle = shade(col, -0.45); ctx.lineWidth = w * 1.15; ctx.stroke(); ctx.strokeStyle = shade(col, 0.15); ctx.lineWidth = w * 0.92; ctx.stroke();
    ctx.save(); ctx.lineCap = 'butt'; ctx.setLineDash([w * 0.14, w * 0.5]); ctx.strokeStyle = rgba(shade(col, -0.5), 0.7); ctx.lineWidth = w * 0.92; ctx.stroke(); ctx.restore();
    kindPath(ctx, kind, x, y, s * 1.04)(-w * 0.12, -w * 0.18); ctx.strokeStyle = rgba('#fffbe8', 0.8); ctx.lineWidth = Math.max(0.8, w * 0.16); ctx.stroke(); return;
  }
  const s2 = s * 1.08;
  ctx.save(); kindPath(ctx, kind, x, y, s2)(0, 0); ctx.lineJoin = 'round'; ctx.save(); ctx.fillStyle = 'rgba(40,0,20,0.4)'; ctx.translate(s * 0.03, s * 0.07); ctx.fill(); ctx.restore();
  ctx.fillStyle = metal(ctx, x - s2 / 2, y - s2 / 2, x + s2 / 2, y + s2 / 2, col); ctx.fill(); ctx.clip();
  // folds: diagonal creases at 45 degrees, light on one flank and dark on the other of each, so the ribbon reads as folded squares
  const p = Math.max(3, s / 5.5); ctx.lineCap = 'butt';
  for (let k = -12; k < 13; k++) {
    const o = k * p; ctx.beginPath(); ctx.moveTo(x - s + o, y + s); ctx.lineTo(x + s + o, y - s); ctx.strokeStyle = 'rgba(40,10,0,0.38)'; ctx.lineWidth = Math.max(0.9, p * 0.14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s + o + p * 0.18, y + s); ctx.lineTo(x + s + o + p * 0.18, y - s); ctx.strokeStyle = rgba(shade(col, 0.7), 0.55); ctx.lineWidth = Math.max(0.7, p * 0.1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s + o, y - s); ctx.lineTo(x + s + o, y + s); ctx.strokeStyle = rgba(shade(col, -0.35), 0.3); ctx.lineWidth = Math.max(0.7, p * 0.1); ctx.stroke();
  }
  const og = ctx.createRadialGradient(x - s * 0.2, y - s * 0.25, s * 0.08, x, y, s * 0.62); og.addColorStop(0, 'rgba(255,255,240,0.25)'); og.addColorStop(0.6, 'rgba(255,255,240,0)'); og.addColorStop(1, 'rgba(40,10,0,0.35)'); ctx.fillStyle = og; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  ctx.restore();
  kindPath(ctx, kind, x, y, s2)(0, 0); ctx.strokeStyle = rgba(shade(col, -0.6), 0.85); ctx.lineWidth = Math.max(1, s * 0.03); ctx.lineJoin = 'round'; ctx.stroke();
  sew(1.0);
}

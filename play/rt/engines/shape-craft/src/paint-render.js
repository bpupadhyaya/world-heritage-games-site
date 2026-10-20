// shape-craft `paint` look: surfaces (paper, cloth, mud wall, painted board, bowl, lacquer, carved wood, banana leaf, egg), pigment with bleed,
// wet and dry states and dry-brush, wax resist, flat enamel fills with pooled edges, fruit/object lighting, guides. Pure canvas 2D, deterministic.
import { hash } from './geom.js';
import { tint, mix, rgba, rrect, shadowed, litEdge, ease } from './fx.js';
import { smooth01, clamp } from './paint-stroke.js';
import { drawNib, drawWedge, drawPoint } from './paint-nib.js';

// V = { ox, oy, s }: design (x, y) -> screen (ox + x*s, oy + y*s)
export const X = (V, x) => V.ox + x * V.s;
export const Y = (V, y) => V.oy + y * V.s;
const pt = (V, p) => [X(V, p[0]), Y(V, p[1])];

export function polyPath(ctx, V, pts) { ctx.beginPath(); pts.forEach((p, i) => { const [x, y] = pt(V, p); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.closePath(); }
export function surfacePath(ctx, D, V) {
  const sh = D.surface.shape;
  if (Array.isArray(sh)) { polyPath(ctx, V, sh); return; }
  const x = X(V, 0), y = Y(V, 0), w = D.ar * V.s, h = V.s;
  if (sh === 'ellipse') { ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.closePath(); return; }
  rrect(ctx, x, y, w, h, Math.max(4, h * 0.012));
}
const KIND_BLEED = { paper: 0.7, cloth: 1, wall: 0.25, 'dark-paper': 0.2, leaf: 0.1 };
export const bleedOf = (D) => KIND_BLEED[D.surface.kind] ?? 0;

const speck = (ctx, x, y, w, h, n, c, a, seed, sz) => {
  ctx.fillStyle = rgba(c, a); ctx.beginPath();
  for (let k = 0; k < n; k++) ctx.rect(x + hash(k, seed) * w, y + hash(k, seed + 1) * h, sz * (0.5 + hash(k, seed + 2)), sz * (0.5 + hash(k, seed + 3)));
  ctx.fill();
};
const fibres = (ctx, x, y, w, h, n, c, a, seed, len) => {
  ctx.strokeStyle = rgba(c, a); ctx.lineWidth = 1; ctx.beginPath();
  for (let k = 0; k < n; k++) { const px = x + hash(k, seed) * w, py = y + hash(k, seed + 1) * h, ang = hash(k, seed + 2) * 6.28, l = len * (0.4 + hash(k, seed + 3)); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + Math.cos(ang) * l * 0.5 + 2, py + Math.sin(ang) * l * 0.5 - 2, px + Math.cos(ang) * l, py + Math.sin(ang) * l); }
  ctx.stroke();
};

// ---- the painted surface ------------------------------------------------------------------------------------------------------------------
export function drawSurface(ctx, D, V, ground, t) {
  const kind = D.surface.kind, x = X(V, 0), y = Y(V, 0), w = D.ar * V.s, h = V.s;
  const thick = ['panel', 'board', 'carved', 'bowl', 'lacquer', 'egg', 'tiles', 'plate', 'hide', 'tablet', 'lontar'].includes(kind) ? Math.max(4, h * 0.016) : 0;
  // cast shadow and thickness
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = h * 0.04; ctx.shadowOffsetY = h * 0.018;
  surfacePath(ctx, D, V); ctx.fillStyle = tint(ground, -0.55); ctx.fill();
  ctx.restore();
  if (thick) { ctx.save(); ctx.translate(0, thick); surfacePath(ctx, D, V); ctx.fillStyle = kind === 'carved' ? '#a07a42' : tint(ground, -0.6); ctx.fill(); ctx.restore(); }
  ctx.save(); surfacePath(ctx, D, V); ctx.clip();
  const g = ctx.createLinearGradient(x, y, x + w * 0.7, y + h);
  const lift = kind === 'tiles' ? D.surface.lift ?? 0 : 0;   // 1.10.0: a bright white glaze keeps its own colour (lift 1): gentler falloff, no grey cast
  g.addColorStop(0, tint(ground, lift ? 0.04 : 0.12)); g.addColorStop(1, tint(ground, lift ? -0.05 : -0.16)); ctx.fillStyle = g; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  if (kind === 'paper') {
    fibres(ctx, x, y, w, h, 340, '#ffffff', 0.35, 31, h * 0.03); fibres(ctx, x, y, w, h, 260, '#5a4020', 0.12, 41, h * 0.025);
    if (D.surface.fleck) speck(ctx, x, y, w, h, 260, D.surface.fleck, 0.75, 161, Math.max(1.4, h * 0.0035));   // 1.25.0: gold-flecked paper
    for (let k = 0; k < 7; k++) { const cx = x + hash(k, 5) * w, cy = y + hash(k, 6) * h, r = h * (0.12 + hash(k, 7) * 0.2); const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, rgba(hash(k, 8) > 0.5 ? '#ffffff' : '#8a6a30', 0.1)); rg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = rg; ctx.fillRect(cx - r, cy - r, r * 2, r * 2); }
  } else if (kind === 'dark-paper') {
    fibres(ctx, x, y, w, h, 380, '#ffffff', 0.07, 33, h * 0.03); speck(ctx, x, y, w, h, 260, '#ffffff', 0.05, 35, 1.6);
  } else if (kind === 'cloth') {
    const s = Math.max(3, h / 150); ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0,0,0,0.075)'; ctx.beginPath(); for (let yy = y; yy < y + h; yy += s) { ctx.moveTo(x, yy + (hash(yy | 0, 2) - 0.5) * 0.8); ctx.lineTo(x + w, yy); } ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); for (let xx = x; xx < x + w; xx += s) { ctx.moveTo(xx, y); ctx.lineTo(xx + (hash(xx | 0, 3) - 0.5) * 0.8, y + h); } ctx.stroke();
    fibres(ctx, x, y, w, h, 80, '#ffffff', 0.15, 36, h * 0.012);
    const fold = ctx.createLinearGradient(x, y, x + w, y + h * 0.3); fold.addColorStop(0, 'rgba(255,255,255,0.08)'); fold.addColorStop(0.35, 'rgba(0,0,0,0.06)'); fold.addColorStop(0.7, 'rgba(255,255,255,0.05)'); fold.addColorStop(1, 'rgba(0,0,0,0.1)'); ctx.fillStyle = fold; ctx.fillRect(x, y, w, h);
  } else if (kind === 'wall') {
    for (let k = 0; k < 14; k++) { const cx = x + hash(k, 11) * w, cy = y + hash(k, 12) * h, r = h * (0.12 + hash(k, 13) * 0.22), dark = hash(k, 14) > 0.5; const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, rgba(dark ? '#3a160a' : '#e0a070', 0.16)); rg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = rg; ctx.fillRect(cx - r, cy - r, r * 2, r * 2); }
    ctx.strokeStyle = 'rgba(60,24,10,0.2)'; ctx.lineWidth = Math.max(2, h * 0.004); ctx.lineCap = 'round';
    for (let k = 0; k < 22; k++) { const cx = x + hash(k, 15) * w, cy = y + hash(k, 16) * h, r = h * (0.05 + hash(k, 17) * 0.09); ctx.beginPath(); ctx.arc(cx, cy, r, 0.3 + hash(k, 18), 2.2 + hash(k, 18)); ctx.stroke(); }
    speck(ctx, x, y, w, h, 700, '#2a1008', 0.2, 51, 2.2); speck(ctx, x, y, w, h, 420, '#f2c9a0', 0.16, 53, 1.8);
    ctx.strokeStyle = 'rgba(40,16,8,0.4)'; ctx.lineWidth = 1.4; ctx.beginPath();
    for (let k = 0; k < 3; k++) { let px = x + hash(k, 19) * w, py = y + hash(k, 20) * h * 0.4; ctx.moveTo(px, py); for (let q = 0; q < 6; q++) { px += (hash(k, 21 + q) - 0.4) * h * 0.04; py += h * 0.035; ctx.lineTo(px, py); } }
    ctx.stroke();
  } else if (kind === 'panel' || kind === 'board') {
    ctx.strokeStyle = rgba(kind === 'panel' ? '#000000' : '#8a7a58', 0.09); ctx.lineWidth = 1.2; ctx.beginPath();
    for (let k = 0; k < 80; k++) { const yy = y + hash(k, 61) * h, x0 = x + hash(k, 62) * w * 0.5; ctx.moveTo(x0, yy); ctx.lineTo(x0 + w * (0.25 + hash(k, 63) * 0.5), yy + (hash(k, 64) - 0.5) * 3); }
    ctx.stroke();
    if (kind === 'board') speck(ctx, x, y, w, h, 500, '#6a5a3a', 0.1, 65, 1.6);
  } else if (kind === 'bowl') {
    // turned wooden bowl seen from above: rim, wall, floor
    const cx = x + w / 2, cy = y + h / 2;
    const rim = ctx.createRadialGradient(cx - w * 0.12, cy - h * 0.14, w * 0.1, cx, cy, w * 0.52); rim.addColorStop(0, 'rgba(255,255,255,0.0)'); rim.addColorStop(0.84, 'rgba(0,0,0,0.0)'); rim.addColorStop(0.9, 'rgba(0,0,0,0.3)'); rim.addColorStop(1, 'rgba(0,0,0,0.5)'); ctx.fillStyle = rim; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,240,200,0.18)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, w * 0.48, h * 0.48, 0, 0, 6.3); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1; ctx.beginPath(); for (let r = 0.1; r < 0.47; r += 0.045) { ctx.moveTo(cx + w * r, cy); ctx.ellipse(cx, cy, w * r, h * r, 0, 0, 6.3); } ctx.stroke();
  } else if (kind === 'lacquer') {
    const cx = x + w / 2, cy = y + h / 2;
    const rg = ctx.createRadialGradient(cx - w * 0.15, cy - h * 0.2, 0, cx, cy, w * 0.6); rg.addColorStop(0, 'rgba(255,230,200,0.14)'); rg.addColorStop(1, 'rgba(0,0,0,0.35)'); ctx.fillStyle = rg; ctx.fillRect(x, y, w, h);
    if (D.surface.shape === 'ellipse') { ctx.strokeStyle = 'rgba(226,179,74,0.5)'; ctx.lineWidth = Math.max(1.5, h * 0.004); ctx.beginPath(); ctx.ellipse(cx, cy, w * 0.488, h * 0.488, 0, 0, 6.3); ctx.stroke(); }
  } else if (kind === 'carved') {
    ctx.strokeStyle = 'rgba(110,70,20,0.28)'; ctx.lineWidth = 1.4; ctx.beginPath();
    for (let k = 0; k < 70; k++) { const yy = y + hash(k, 71) * h, x0 = x + hash(k, 72) * w * 0.4; ctx.moveTo(x0, yy); ctx.bezierCurveTo(x0 + w * 0.2, yy + (hash(k, 73) - 0.5) * 6, x0 + w * 0.4, yy + (hash(k, 74) - 0.5) * 6, x0 + w * (0.35 + hash(k, 75) * 0.5), yy + (hash(k, 76) - 0.5) * 4); }
    ctx.stroke();
  } else if (kind === 'leaf') {
    ctx.strokeStyle = 'rgba(210,255,200,0.17)'; ctx.lineWidth = 1.4; ctx.beginPath();
    for (let q = -h; q < w + h; q += Math.max(9, h * 0.022)) { ctx.moveTo(x + q, y); ctx.lineTo(x + q + h * 0.5, y + h); } ctx.stroke();
    ctx.strokeStyle = 'rgba(10,50,20,0.25)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, y + h * 0.5); ctx.lineTo(x + w, y + h * 0.5); ctx.stroke();
    const sh = ctx.createLinearGradient(x, y, x + w, y + h); sh.addColorStop(0.2, 'rgba(255,255,255,0.14)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.22)'); ctx.fillStyle = sh; ctx.fillRect(x, y, w, h);
  } else if (kind === 'egg') {
    fibres(ctx, x, y, w, h, 80, '#ffffff', 0.2, 81, h * 0.02);
  } else if (kind === 'velvet') {   // 1.21.0: a jeweller's velvet pad: short nap, a soft pool of light, fine specks
    fibres(ctx, x, y, w, h, 1100, '#ffffff', 0.05, 121, h * 0.012); fibres(ctx, x, y, w, h, 600, '#000000', 0.18, 123, h * 0.012); speck(ctx, x, y, w, h, 500, '#ffffff', 0.07, 125, 1.2);
    const rgv = ctx.createRadialGradient(x + w * 0.35, y + h * 0.3, 0, x + w * 0.4, y + h * 0.4, w * 0.75); rgv.addColorStop(0, 'rgba(255,255,255,0.2)'); rgv.addColorStop(0.5, 'rgba(255,255,255,0.04)'); rgv.addColorStop(1, 'rgba(0,0,0,0.35)'); ctx.fillStyle = rgv; ctx.fillRect(x, y, w, h);
    const cxv = x + w / 2, cyv = y + h / 2; ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = Math.max(1.5, h * 0.004); ctx.beginPath(); ctx.ellipse(cxv, cyv, w * 0.49, h * 0.49, 0, 0, 6.3); ctx.stroke();
  } else if (kind === 'hide') {   // 1.23.0: tanned hide: pores, small wrinkles, a pool of light and a stitched edge
    speck(ctx, x, y, w, h, 900, '#2a1608', 0.18, 141, 1.6); speck(ctx, x, y, w, h, 500, '#f0c890', 0.12, 143, 1.4);
    ctx.strokeStyle = 'rgba(40,20,8,0.22)'; ctx.lineWidth = 1.2; for (let k = 0; k < 26; k++) { const px = x + hash(k, 145) * w, py = y + hash(k, 146) * h; ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + 20 * (hash(k, 147) - 0.5), py + 12, px + 30 * (hash(k, 148) - 0.5), py + 26 * hash(k, 149)); ctx.stroke(); }
    const rgh = ctx.createRadialGradient(x + w * 0.35, y + h * 0.3, 0, x + w * 0.45, y + h * 0.45, w * 0.7); rgh.addColorStop(0, 'rgba(255,230,190,0.2)'); rgh.addColorStop(1, 'rgba(0,0,0,0.32)'); ctx.fillStyle = rgh; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(240,220,180,0.7)'; ctx.lineWidth = Math.max(1.5, h * 0.004); ctx.setLineDash([h * 0.014, h * 0.012]); ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, w * 0.495, h * 0.495, 0, 0, 6.3); ctx.stroke(); ctx.setLineDash([]);
  } else if (kind === 'plate') {   // 1.21.0: a polished metal plate (gold, silver) or cream enamel: brushed lines, broad reflections, a bevelled edge
    const gl = D.surface.metal === 'enamel';
    ctx.strokeStyle = gl ? 'rgba(160,140,100,0.08)' : 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 90; k++) { const yy = y + hash(k, 131) * h; ctx.moveTo(x, yy); ctx.lineTo(x + w, yy + (hash(k, 132) - 0.5) * 6); } ctx.stroke();
    const br = ctx.createLinearGradient(x, y + h * 0.1, x + w, y + h * 0.9); br.addColorStop(0, 'rgba(255,255,255,0.28)'); br.addColorStop(0.22, 'rgba(255,255,255,0)'); br.addColorStop(0.5, 'rgba(0,0,0,0.1)'); br.addColorStop(0.72, 'rgba(255,255,255,0.14)'); br.addColorStop(0.8, 'rgba(255,255,255,0)'); br.addColorStop(1, 'rgba(0,0,0,0.32)'); ctx.fillStyle = br; ctx.fillRect(x, y, w, h);
  } else if (kind === 'vellum') {   // 1.25.0: scraped skin: soft stains, hair follicles, faint veins, a ruled margin
    for (let k = 0; k < 10; k++) { const cx = x + hash(k, 151) * w, cy = y + hash(k, 152) * h, r = h * (0.1 + hash(k, 153) * 0.22), rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, rgba(hash(k, 154) > 0.55 ? '#fff6dc' : '#8a5a20', 0.1)); rg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = rg; ctx.fillRect(cx - r, cy - r, r * 2, r * 2); }
    speck(ctx, x, y, w, h, 320, '#6a4a20', 0.16, 155, 1.5); speck(ctx, x, y, w, h, 160, '#fffbe8', 0.18, 157, 1.3);
    ctx.strokeStyle = 'rgba(110,70,25,0.07)'; ctx.lineWidth = 2; for (let k = 0; k < 6; k++) { ctx.beginPath(); let px = x + hash(k, 159) * w, py = y; ctx.moveTo(px, py); for (let q = 1; q <= 6; q++) { px += (hash(k, 160 + q) - 0.5) * h * 0.08; py = y + (q / 6) * h; ctx.lineTo(px, py); } ctx.stroke(); }
    if (D.surface.rule) { ctx.strokeStyle = 'rgba(130,100,70,0.35)'; ctx.lineWidth = 1; for (const q of D.surface.rule) { ctx.beginPath(); ctx.moveTo(x + w * 0.04, y + h * q); ctx.lineTo(x + w * 0.96, y + h * q); ctx.stroke(); } }
  } else if (kind === 'tablet') {   // 1.25.0: a pillow of wet clay: grit, fingerprints of the smoothing hand, ruled lines for the rows
    speck(ctx, x, y, w, h, 900, '#6a4a28', 0.22, 171, 1.7); speck(ctx, x, y, w, h, 700, '#f0d8a8', 0.18, 173, 1.5); speck(ctx, x, y, w, h, 120, '#2a1a0a', 0.3, 175, 2.2);
    for (let k = 0; k < 8; k++) { const cx = x + hash(k, 177) * w, cy = y + hash(k, 178) * h, r = h * (0.08 + hash(k, 179) * 0.14), rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, rgba(hash(k, 180) > 0.5 ? '#ffe9bf' : '#5a3a18', 0.12)); rg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = rg; ctx.fillRect(cx - r, cy - r, r * 2, r * 2); }
    for (const q of D.surface.rules ?? []) { ctx.strokeStyle = 'rgba(40,24,10,0.55)'; ctx.lineWidth = Math.max(1.2, h * 0.0035); ctx.beginPath(); ctx.moveTo(x + w * 0.05, y + h * q); ctx.lineTo(x + w * 0.95, y + h * q); ctx.stroke(); ctx.strokeStyle = 'rgba(255,236,196,0.4)'; ctx.beginPath(); ctx.moveTo(x + w * 0.05, y + h * q + 1.6); ctx.lineTo(x + w * 0.95, y + h * q + 1.6); ctx.stroke(); }
    for (const q of D.surface.cols ?? []) { ctx.strokeStyle = 'rgba(40,24,10,0.5)'; ctx.lineWidth = Math.max(1.2, h * 0.0035); ctx.beginPath(); ctx.moveTo(x + w * q, y + h * 0.06); ctx.lineTo(x + w * q, y + h * 0.94); ctx.stroke(); ctx.strokeStyle = 'rgba(255,236,196,0.38)'; ctx.beginPath(); ctx.moveTo(x + w * q + 1.6, y + h * 0.06); ctx.lineTo(x + w * q + 1.6, y + h * 0.94); ctx.stroke(); }
  } else if (kind === 'lontar') {   // 1.25.0: a strip of dried palm leaf: lengthwise ribs, worn ends, two cord holes
    ctx.lineWidth = 1; for (let k = 0; k < 70; k++) { const yy = y + (k / 70) * h + (hash(k, 191) - 0.5) * 3; ctx.strokeStyle = hash(k, 192) > 0.5 ? 'rgba(90,56,16,0.2)' : 'rgba(255,236,170,0.2)'; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy + (hash(k, 193) - 0.5) * 4); ctx.stroke(); }
    speck(ctx, x, y, w, h, 260, '#4a2c08', 0.2, 195, 1.6);
    for (const hole of D.surface.holes ?? []) { const hx = x + w * hole[0], hy = y + h * hole[1], r = h * 0.03; ctx.fillStyle = 'rgba(20,12,4,0.9)'; ctx.beginPath(); ctx.arc(hx, hy, r, 0, 6.3); ctx.fill(); ctx.strokeStyle = 'rgba(255,240,190,0.45)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(hx + 0.8, hy + 1, r, 0.2, 2.6); ctx.stroke(); }
  } else if (kind === 'tiles') { // 1.9.0: tin-glazed tiles: each tile a shade of its own, hairline crazing, pinholes
    const n = D.surface.grid ?? 3, tw = w / n, th = h / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const k = hash(i, j, 91); ctx.fillStyle = k > 0.5 ? rgba('#ffffff', 0.05 + (k - 0.5) * 0.12) : rgba('#6a5a3a', (0.02 + (0.5 - k) * 0.08) * (lift ? 0.4 : 1)); ctx.fillRect(x + i * tw, y + j * th, tw, th); }
    ctx.strokeStyle = 'rgba(90,70,40,0.1)'; ctx.lineWidth = 0.7; ctx.beginPath();
    for (let k = 0; k < 46; k++) { let px = x + hash(k, 92) * w, py = y + hash(k, 93) * h; ctx.moveTo(px, py); for (let q = 0; q < 4; q++) { px += (hash(k, 94 + q) - 0.5) * h * 0.05; py += (hash(k, 98 + q) - 0.5) * h * 0.05; ctx.lineTo(px, py); } }
    ctx.stroke(); speck(ctx, x, y, w, h, 160, '#4a3a20', 0.12, 103, 1.3);
  }
  ctx.restore();
}
// Light that falls over the finished surface (after the paint): sphere shading on the egg, gloss on lacquer and enamel, a soft vignette elsewhere.
export function drawLight(ctx, D, V, t) {
  const kind = D.surface.kind, x = X(V, 0), y = Y(V, 0), w = D.ar * V.s, h = V.s;
  ctx.save(); surfacePath(ctx, D, V); ctx.clip();
  if (kind === 'egg') {
    const cx = x + w * 0.5, cy = y + h * 0.5;
    const sph = ctx.createRadialGradient(cx - w * 0.16, cy - h * 0.2, h * 0.02, cx, cy, h * 0.58); sph.addColorStop(0, 'rgba(255,255,255,0.32)'); sph.addColorStop(0.3, 'rgba(255,255,255,0.05)'); sph.addColorStop(0.7, 'rgba(0,0,0,0.12)'); sph.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = sph; ctx.fillRect(x, y, w, h);
    { const hl = ctx.createRadialGradient(cx - w * 0.17, cy - h * 0.25, 0, cx - w * 0.17, cy - h * 0.25, h * 0.09); hl.addColorStop(0, 'rgba(255,255,255,0.5)'); hl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = hl; ctx.fillRect(cx - w * 0.4, cy - h * 0.45, w * 0.5, h * 0.4); }
  } else if (kind === 'lacquer' || kind === 'board' || kind === 'panel' || kind === 'bowl') {
    const sweep = (t * 0.08) % 1;
    const gl = ctx.createLinearGradient(x, y, x + w, y + h); const a = kind === 'lacquer' ? 0.2 : kind === 'bowl' ? 0.12 : 0.1;
    gl.addColorStop(0, `rgba(255,255,255,${a})`); gl.addColorStop(0.35, 'rgba(255,255,255,0)'); gl.addColorStop(0.62, `rgba(255,255,255,${a * 0.4})`); gl.addColorStop(0.7, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.fillRect(x, y, w, h);
    void sweep;
  } else if (kind === 'tiles') { // grout seams over the paint, a bevelled edge and a glaze highlight on every tile
    const n = D.surface.grid ?? 3, tw = w / n, th = h / n, gap = Math.max(1.4, h * 0.0055), lift = D.surface.lift ?? 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const tx = x + i * tw, ty = y + j * th;
      const gl = ctx.createLinearGradient(tx, ty, tx + tw, ty + th); gl.addColorStop(0, 'rgba(255,255,255,0.17)'); gl.addColorStop(0.34, 'rgba(255,255,255,0.02)'); gl.addColorStop(0.7, 'rgba(0,0,0,0)'); gl.addColorStop(1, lift ? 'rgba(20,40,80,0.04)' : 'rgba(0,0,0,0.12)'); ctx.fillStyle = gl; ctx.fillRect(tx, ty, tw, th);
      const sw = ctx.createLinearGradient(tx, ty, tx + tw * 0.7, ty + th * 0.2); sw.addColorStop(0, 'rgba(255,255,255,0)'); sw.addColorStop(0.5, 'rgba(255,255,255,0.1)'); sw.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sw; ctx.fillRect(tx, ty, tw, th * 0.3);
    }
    for (let i = 1; i < n; i++) {
      ctx.fillStyle = lift ? 'rgba(40,30,20,0.4)' : 'rgba(40,30,20,0.62)'; ctx.fillRect(x + i * tw - gap / 2, y, gap, h); ctx.fillRect(x, y + i * th - gap / 2, w, gap);
      ctx.fillStyle = 'rgba(255,255,255,0.42)'; ctx.fillRect(x + i * tw + gap / 2, y, gap * 0.55, h); ctx.fillRect(x, y + i * th + gap / 2, w, gap * 0.55);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x + i * tw - gap * 1.6, y, gap * 0.9, h); ctx.fillRect(x, y + i * th - gap * 1.6, w, gap * 0.9);
    }
  } else if (kind === 'plate') {   // a bevelled edge: light on the upper left, dark on the lower right
    ctx.lineWidth = Math.max(2.5, h * 0.011); ctx.save(); ctx.translate(h * 0.003, h * 0.004); surfacePath(ctx, D, V); ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(-h * 0.003, -h * 0.004); surfacePath(ctx, D, V); ctx.strokeStyle = 'rgba(255,250,235,0.55)'; ctx.stroke(); ctx.restore();
    const gl = ctx.createLinearGradient(x, y, x + w, y + h); gl.addColorStop(0, 'rgba(255,255,255,0.16)'); gl.addColorStop(0.33, 'rgba(255,255,255,0)'); gl.addColorStop(0.62, 'rgba(255,255,255,0.06)'); gl.addColorStop(0.7, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.fillRect(x, y, w, h);
  } else if (kind === 'carved') {
    ctx.strokeStyle = 'rgba(255,240,200,0.5)'; ctx.lineWidth = Math.max(1.5, h * 0.004); surfacePath(ctx, D, V); ctx.stroke();
    const vg = ctx.createLinearGradient(x, y, x + w, y + h); vg.addColorStop(0, 'rgba(255,255,255,0.1)'); vg.addColorStop(1, 'rgba(0,0,0,0.2)'); ctx.fillStyle = vg; ctx.fillRect(x, y, w, h);
  }
  const vg = ctx.createRadialGradient(x + w / 2, y + h * 0.45, h * 0.35, x + w / 2, y + h / 2, Math.max(w, h) * 0.78); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, kind === 'tiles' && D.surface.lift ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.3)'); ctx.fillStyle = vg; ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.save(); surfacePath(ctx, D, V); ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
}

// ---- pigment ------------------------------------------------------------------------------------------------------------------------------
const ribPath = (ctx, V, rib) => {
  ctx.beginPath();
  rib.L.forEach((p, i) => { const [x, y] = pt(V, p); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
  for (let i = rib.R.length - 1; i >= 0; i--) { const [x, y] = pt(V, rib.R[i]); ctx.lineTo(x, y); }
  ctx.closePath();
};
const centreLine = (ctx, V, pts, dx = 0, dy = 0) => { ctx.beginPath(); pts.forEach((p, i) => { const x = X(V, p.x) + dx, y = Y(V, p.y) + dy; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); };
const normalAt = (pts, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; let tx = b.x - a.x, ty = b.y - a.y; const m = Math.hypot(tx, ty) || 1; return [-ty / m, tx / m]; };

// ---- wire (1.21.0): a round metal wire lit from the upper left; `twist` adds the diagonal ticks of two twisted strands; a stroke shorter than its width is a granule ----
function wirePasses(ctx, path, wm, c0, twistTicks) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.translate(wm * 0.14, wm * 0.26); path(); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = wm * 1.2; ctx.stroke(); ctx.translate(-wm * 0.14, -wm * 0.26);
  path(); ctx.strokeStyle = tint(c0, -0.58); ctx.lineWidth = wm * 1.08; ctx.stroke();
  path(); ctx.strokeStyle = c0; ctx.lineWidth = wm * 0.8; ctx.stroke();
  path(); ctx.strokeStyle = tint(c0, 0.22); ctx.lineWidth = wm * 0.5; ctx.stroke();
  ctx.translate(-wm * 0.13, -wm * 0.2); path(); ctx.strokeStyle = rgba(tint(c0, 0.85), 0.9); ctx.lineWidth = Math.max(1, wm * 0.2); ctx.stroke(); ctx.translate(wm * 0.13, wm * 0.2);
  if (twistTicks) { ctx.beginPath(); for (const [ax, ay, bx, by] of twistTicks) { ctx.moveTo(ax, ay); ctx.lineTo(bx, by); } ctx.strokeStyle = rgba(tint(c0, -0.75), 0.6); ctx.lineWidth = Math.max(0.8, wm * 0.13); ctx.stroke(); }
  ctx.restore();
}
const ticksAlong = (P, wm) => {
  const out = [], step = wm * 0.62; let acc = step * 0.5;
  for (let i = 1; i < P.length; i++) {
    const dx = P[i][0] - P[i - 1][0], dy = P[i][1] - P[i - 1][1], d = Math.hypot(dx, dy); if (!d) continue;
    const tx = dx / d, ty = dy / d, nx = -ty, ny = tx;
    for (let u = step - acc; u <= d; u += step) { const px = P[i - 1][0] + tx * u, py = P[i - 1][1] + ty * u; out.push([px - nx * wm * 0.4 - tx * wm * 0.28, py - ny * wm * 0.4 - ty * wm * 0.28, px + nx * wm * 0.4 + tx * wm * 0.28, py + ny * wm * 0.4 + ty * wm * 0.28]); }
    acc = (acc + d) % step;
  }
  return out;
};
function drawWire(ctx, V, S, look) {
  const pts = S.pts; if (!pts.length) return;
  const wm = (pts.reduce((a, p) => a + p.w, 0) / pts.length) * V.s, c0 = look.color, P = pts.map((p) => [X(V, p.x), Y(V, p.y)]);
  let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
  if (L < wm * 1.7) {   // a granule: a little ball of metal
    const x = (P[0][0] + P[P.length - 1][0]) / 2, y = (P[0][1] + P[P.length - 1][1]) / 2, r = Math.max(2.4, wm * 0.56);
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(x + r * 0.28, y + r * 0.5, r * 1.02, r * 0.75, 0, 0, 6.3); ctx.fill();
    const g = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.05, x, y, r * 1.05); g.addColorStop(0, tint(c0, 0.9)); g.addColorStop(0.35, c0); g.addColorStop(1, tint(c0, -0.62)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(x - r * 0.38, y - r * 0.4, Math.max(0.8, r * 0.17), 0, 6.3); ctx.fill(); ctx.restore(); return;
  }
  wirePasses(ctx, () => { ctx.beginPath(); P.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); }, wm, c0, look.twist ? ticksAlong(P, wm) : null);
}
// the gold or silver wall round an enamel cell (the outline of the region, raised)
function wirePoly(ctx, V, pts, wm, c0) {
  const P = pts.map((p) => pt(V, p)); P.push(P[0]);
  wirePasses(ctx, () => { ctx.beginPath(); P.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); }, wm, c0, null);
}

// One stroke of pigment. S = { pts: [{x,y,w,d}], rib, col, tool, born, seed }; look = { color, metal, bleed, t, wax, melt, reveal }
export function drawStroke(ctx, V, S, look) {
  const pts = S.pts;
  if (!pts.length) return;
  if (S.mark === 'nib') { drawNib(ctx, V, S, look); return; }
  if (S.mark === 'wedge') { drawWedge(ctx, V, S, look); return; }
  if (S.mark === 'point') { drawPoint(ctx, V, S, look); return; }
  const wpx = (p) => p.w * V.s;
  if (look.wire) { drawWire(ctx, V, S, look); return; }
  if (look.wax) { drawWax(ctx, V, S, look); return; }
  const age = look.t - (S.born ?? -99), wet = clamp(1 - age / 3, 0, 1);
  const c0 = look.color, c = look.flat ? c0 : wet > 0 ? mix(c0, tint(c0, -0.35), 0.35 * wet) : tint(c0, 0.03);
  const dashed = S.tool === 'dots';
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (pts.length === 1 || pts.every((p) => p.dab)) { // a dab
    const p = pts[0], r = wpx(p) / 2 * 1.05, x = X(V, p.x), y = Y(V, p.y);
    if (look.bleed) { ctx.fillStyle = rgba(c, 0.14); ctx.beginPath(); ctx.arc(x, y, r * (1 + look.bleed * 0.35), 0, 6.3); ctx.fill(); }
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r); g.addColorStop(0, tint(c, 0.25 * wet + 0.04)); g.addColorStop(1, c); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill();
    if (wet > 0) { ctx.fillStyle = `rgba(255,255,255,${0.45 * wet})`; ctx.beginPath(); ctx.ellipse(x - r * 0.3, y - r * 0.35, r * 0.28, r * 0.18, -0.6, 0, 6.3); ctx.fill(); }
    ctx.restore(); return;
  }
  if (dashed) { // dots-and-dashes pen
    let acc = 0, on = true; const dash = 0.03, gap = 0.016;
    ctx.strokeStyle = c; ctx.fillStyle = c;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], dl = Math.hypot(b.x - a.x, b.y - a.y); acc += dl;
      if (on) { ctx.lineWidth = wpx(b); ctx.beginPath(); ctx.moveTo(X(V, a.x), Y(V, a.y)); ctx.lineTo(X(V, b.x), Y(V, b.y)); ctx.stroke(); }
      if (acc >= (on ? dash : gap)) { acc = 0; on = !on; }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = Math.max(1, wpx(pts[0]) * 0.18); acc = 0; on = true;
    for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; acc += Math.hypot(b.x - a.x, b.y - a.y); if (on) { ctx.beginPath(); ctx.moveTo(X(V, a.x) - 1, Y(V, a.y) - 1.5); ctx.lineTo(X(V, b.x) - 1, Y(V, b.y) - 1.5); ctx.stroke(); } if (acc >= (on ? dash : gap)) { acc = 0; on = !on; } }
    ctx.restore(); return;
  }
  // bleed halo into paper or cloth
  if (look.bleed) { const k = look.flat ? 1.5 : 1; ribPath(ctx, V, S.rib); ctx.strokeStyle = rgba(c, Math.min(0.3, 0.13 * k * (0.5 + look.bleed * 0.5))); ctx.lineWidth = Math.max(2, wpx(pts[pts.length >> 1]) * (0.5 + look.bleed * 0.55 * k)); ctx.stroke(); }
  // body: wet part solid, dry part as bristle streaks
  const split = pts.findIndex((p) => p.d > 0.45);
  const wetEnd = split < 0 ? pts.length : Math.max(2, split);
  const wetPts = pts.slice(0, wetEnd);
  if (wetPts.length >= 2) {
    const rib = wetEnd === pts.length ? S.rib : { L: S.rib.L.slice(0, wetEnd), R: S.rib.R.slice(0, wetEnd) };
    ribPath(ctx, V, rib);
    if (look.metal) {
      const b = pts[0], e = pts[pts.length - 1], gr = ctx.createLinearGradient(X(V, b.x), Y(V, b.y) - 20, X(V, e.x) + 30, Y(V, e.y) + 20);
      gr.addColorStop(0, tint(c0, 0.55)); gr.addColorStop(0.35, c0); gr.addColorStop(0.6, tint(c0, 0.4)); gr.addColorStop(1, tint(c0, -0.35)); ctx.fillStyle = gr;
    } else ctx.fillStyle = rgba(c, 0.97);
    ctx.fill();
    for (const e of [wetPts[0], wetPts[wetPts.length - 1]]) { ctx.beginPath(); ctx.arc(X(V, e.x), Y(V, e.y), Math.max(0.6, wpx(e) / 2), 0, 6.3); ctx.fill(); }   // round brush ends
    ribPath(ctx, V, rib);
    if (!look.flat) { ctx.strokeStyle = rgba(tint(c, -0.4), 0.35); ctx.lineWidth = 1; ctx.stroke(); }           // pigment pools at the edge (flat ink does not)
    if (S.tool === 'stick' || look.rough) { for (let i = 0; i < wetPts.length; i += 2) { const p = wetPts[i], [nx, ny] = normalAt(wetPts, i), o = ((hash(i, S.seed ?? 1) - 0.5) * 2) * wpx(p) * 0.7; ctx.fillStyle = rgba(c, 0.55); ctx.beginPath(); ctx.arc(X(V, p.x) + nx * o, Y(V, p.y) + ny * o, Math.max(0.8, wpx(p) * 0.12), 0, 6.3); ctx.fill(); } }
  }
  if (split >= 0) {
    const dry = pts.slice(Math.max(0, split - 1));
    for (let b = 0; b < 4; b++) {
      const off = (b - 1.5) / 3;
      ctx.strokeStyle = rgba(c, 0.75); ctx.lineCap = 'butt';
      let run = false;
      for (let i = 0; i < dry.length; i++) {
        const p = dry[i], [nx, ny] = normalAt(dry, i), keep = hash(i + b * 17, S.seed ?? 3) > 0.12 + 0.6 * p.d;
        const x = X(V, p.x) + nx * off * wpx(p), y = Y(V, p.y) + ny * off * wpx(p);
        if (keep) { if (!run) { ctx.beginPath(); ctx.moveTo(x, y); run = true; } else ctx.lineTo(x, y); ctx.lineWidth = Math.max(1, wpx(p) * 0.3); }
        if ((!keep || i === dry.length - 1) && run) { ctx.stroke(); run = false; }
      }
    }
  }
  // wet sheen
  if ((wet > 0 || look.metal) && !look.flat) {
    const k = look.metal ? 0.75 : 0.5 * wet;
    const wm = pts[pts.length >> 1].w * V.s;
    ctx.save(); ribPath(ctx, V, S.rib); ctx.clip();                                    // the sheen stays inside the line
    centreLine(ctx, V, wetPts.length > 1 ? wetPts : pts, -wm * 0.16, -wm * 0.2);
    ctx.strokeStyle = `rgba(255,255,255,${k})`; ctx.lineWidth = Math.max(1, wm * 0.3); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

// Wax: a translucent bead that keeps the cloth (or egg) pale; when it is melted away (melt 1) it shows the colour it protected.
function drawWax(ctx, V, S, look) {
  const pts = S.pts, melt = look.melt ?? 0, rev = look.reveal ?? '#ffffff';
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const body = mix('#f4e3a6', rev, ease(melt));
  const draw = (fill, dx = 0, dy = 0, grow = 1, stroke = false, lw = 1) => {
    if (pts.length === 1 || pts.every((p) => p.dab)) { const p = pts[0]; ctx.beginPath(); ctx.arc(X(V, p.x) + dx, Y(V, p.y) + dy, p.w * V.s * 0.5 * grow, 0, 6.3); if (stroke) { ctx.strokeStyle = fill; ctx.lineWidth = lw; ctx.stroke(); } else { ctx.fillStyle = fill; ctx.fill(); } return; }
    ctx.save(); ctx.translate(dx, dy); ribPath(ctx, V, S.rib); ctx.restore(); ctx.fillStyle = fill; ctx.fill();
  };
  if (melt < 0.98) {
    ctx.globalAlpha = 1 - ease(melt) * 0.15;
    draw('rgba(40,22,5,0.32)', 1.2, 2.4, 1.15);
    draw(rgba(body, 0.95), 0, 0, 1);
    if (pts.length > 1 && !pts.every((p) => p.dab)) { ribPath(ctx, V, S.rib); ctx.strokeStyle = 'rgba(110,70,10,0.4)'; ctx.lineWidth = 1; ctx.stroke(); centreLine(ctx, V, pts, -pts[0].w * V.s * 0.1, -pts[0].w * V.s * 0.18); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(1, pts[pts.length >> 1].w * V.s * 0.2); ctx.stroke(); }
    else { const p = pts[0]; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(X(V, p.x) - p.w * V.s * 0.14, Y(V, p.y) - p.w * V.s * 0.17, Math.max(1, p.w * V.s * 0.13), 0, 6.3); ctx.fill(); }
  } else {
    draw(rgba(rev, 1), 0, 0, 1.0);
  }
  ctx.restore();
}

// ---- regions -------------------------------------------------------------------------------------------------------------------------------
// path of the region with the higher regions that sit inside it cut out (even-odd), so an outer fill never covers an inner shape
export function regionClip(ctx, V, prep, ri) {
  const r = prep.regions[ri];
  ctx.beginPath();
  const add = (pts) => pts.forEach((p, i) => { const [x, y] = pt(V, p); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
  add(r.pts); ctx.closePath();
  for (const h of r.holes) { add(prep.regions[h].pts); ctx.closePath(); }
}
export function drawRegionBase(ctx, V, prep, ri) {
  const r = prep.regions[ri];
  if (!r.base) return;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = V.s * 0.025; ctx.shadowOffsetY = V.s * 0.012; ctx.shadowOffsetX = V.s * 0.004;
  polyPath(ctx, V, r.pts); ctx.fillStyle = r.base; ctx.fill();
  ctx.restore();
  ctx.save(); polyPath(ctx, V, r.pts); ctx.clip();
  const b = r.box, x0 = X(V, b.x0), y0 = Y(V, b.y0), w = (b.x1 - b.x0) * V.s, h = (b.y1 - b.y0) * V.s;
  speck(ctx, x0, y0, w, h, 90, '#8a7040', 0.16, ri * 7 + 91, 1.6);
  ctx.restore();
}
// A fill: pigment spreads from the tap and stops at the outline; pooled edge, brush streaks, wet sheen.
export function drawRegionFill(ctx, V, prep, F, look) {
  const r = prep.regions[F.region], age = look.t - F.born, p = ease(age / 0.55), wet = clamp(1 - age / 3, 0, 1);
  if (p <= 0) return;
  const c = look.color, cc = mix(c, tint(c, -0.3), 0.3 * wet);
  const [ax, ay] = pt(V, F.at), maxR = Math.hypot(Math.max(Math.abs(X(V, r.box.x0) - ax), Math.abs(X(V, r.box.x1) - ax)), Math.max(Math.abs(Y(V, r.box.y0) - ay), Math.abs(Y(V, r.box.y1) - ay))) + 6;
  ctx.save();
  regionClip(ctx, V, prep, F.region); ctx.clip('evenodd');
  if (p < 1) { ctx.beginPath(); ctx.arc(ax, ay, maxR * p, 0, 6.3); ctx.clip(); }
  const b = r.box, x0 = X(V, b.x0), y0 = Y(V, b.y0), w = (b.x1 - b.x0) * V.s, h = (b.y1 - b.y0) * V.s;
  if (look.bead) {   // 1.23.0: a glass bead: a lit sphere with a specular spot, a dark rim and the thread hole showing at the sides
    const cxm = x0 + w / 2, cym = y0 + h / 2, rad = Math.max(w, h) * 0.56, bg = ctx.createRadialGradient(cxm - rad * 0.3, cym - rad * 0.36, rad * 0.04, cxm, cym, rad * 1.05);
    bg.addColorStop(0, tint(c, 0.78)); bg.addColorStop(0.28, tint(c, 0.22)); bg.addColorStop(0.66, c); bg.addColorStop(1, tint(c, -0.58)); ctx.fillStyle = bg; ctx.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.beginPath(); ctx.ellipse(cxm - rad * 0.3, cym - rad * 0.36, rad * 0.2, rad * 0.12, -0.7, 0, 6.3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.ellipse(cxm + rad * 0.34, cym + rad * 0.4, rad * 0.14, rad * 0.07, -0.7, 0, 6.3); ctx.fill();
    regionClip(ctx, V, prep, F.region); ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = Math.max(1.5, V.s * 0.004); ctx.stroke();
    ctx.restore(); return;
  }
  if (look.foil) {   // 1.25.0: gold leaf laid over size: a diagonal sweep of light, crinkles, a few sparkles and a darker rim where it was burnished into the edge
    const fg = ctx.createLinearGradient(x0, y0, x0 + w, y0 + h);
    fg.addColorStop(0, tint(c, 0.6)); fg.addColorStop(0.28, c); fg.addColorStop(0.5, tint(c, 0.42)); fg.addColorStop(0.78, tint(c, -0.12)); fg.addColorStop(1, tint(c, -0.4));
    ctx.fillStyle = fg; ctx.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
    ctx.lineWidth = 1; for (let k = 0; k < 46; k++) { const px = x0 + hash(k, F.region + 11) * w, py = y0 + hash(k, F.region + 12) * h, a = hash(k, F.region + 13) * 3.14, l = 3 + 7 * hash(k, F.region + 14); ctx.strokeStyle = hash(k, F.region + 15) > 0.5 ? 'rgba(255,248,210,0.35)' : 'rgba(110,70,10,0.25)'; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); ctx.stroke(); }
    for (let k = 0; k < 5; k++) { const px = x0 + hash(k, F.region + 21) * w, py = y0 + hash(k, F.region + 22) * h, r = 1.2 + 1.8 * hash(k, F.region + 23); ctx.fillStyle = 'rgba(255,255,240,0.85)'; ctx.beginPath(); ctx.arc(px, py, r, 0, 6.3); ctx.fill(); }
    regionClip(ctx, V, prep, F.region); ctx.strokeStyle = rgba(tint(c, -0.55), 0.7); ctx.lineWidth = Math.max(2, V.s * 0.006); ctx.stroke();
    ctx.restore(); return;
  }
  if (look.enamel) {   // 1.21.0: glassy enamel: depth towards the middle, a dark rim where it meets the wall, a gloss streak, a specular spot and a few bubbles
    const cxm = x0 + w / 2, cym = y0 + h / 2, rad = Math.max(w, h) * 0.66, eg = ctx.createRadialGradient(cxm - w * 0.16, cym - h * 0.2, rad * 0.05, cxm, cym, rad);
    eg.addColorStop(0, tint(c, 0.34)); eg.addColorStop(0.5, c); eg.addColorStop(1, tint(c, -0.4)); ctx.fillStyle = eg; ctx.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
    regionClip(ctx, V, prep, F.region); ctx.strokeStyle = rgba(tint(c, -0.62), 0.6); ctx.lineWidth = Math.max(6, V.s * 0.03); ctx.stroke();
    const sh = ctx.createLinearGradient(x0, y0, x0 + w * 0.8, y0 + h * 0.8); sh.addColorStop(0, 'rgba(255,255,255,0.4)'); sh.addColorStop(0.3, 'rgba(255,255,255,0.08)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); ctx.fillStyle = sh; ctx.fillRect(x0, y0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(x0 + w * 0.3, y0 + h * 0.27, Math.max(2, w * 0.09), Math.max(1.5, h * 0.045), -0.6, 0, 6.3); ctx.fill();
    for (let k = 0; k < 7; k++) { ctx.fillStyle = `rgba(255,255,255,${0.12 + 0.12 * hash(k, F.region)})`; ctx.beginPath(); ctx.arc(x0 + w * (0.15 + 0.7 * hash(k, F.region + 3)), y0 + h * (0.15 + 0.7 * hash(k, F.region + 5)), 1 + 1.4 * hash(k, 9), 0, 6.3); ctx.fill(); }
    ctx.restore();
    if (look.cell && p > 0.2) { ctx.save(); ctx.globalAlpha = Math.min(1, p * 1.2); wirePoly(ctx, V, r.pts, V.s * 0.0085, look.cell); ctx.restore(); }
    return;
  }
  const g = ctx.createLinearGradient(x0, y0, x0 + w, y0 + h); g.addColorStop(0, tint(cc, 0.06)); g.addColorStop(1, tint(cc, -0.1));
  if (look.dye) ctx.globalCompositeOperation = 'multiply';                          // translucent dye: the ink line under it still shows
  ctx.fillStyle = look.metal ? tint(c, 0.1) : g; ctx.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
  ctx.globalCompositeOperation = 'source-over';
  const ang = hash(F.region, 5) * 1.2 - 0.6; ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1.4; ctx.beginPath();
  for (let q = 0; q < 26; q++) { const yy = y0 + (q / 26) * h; ctx.moveTo(x0, yy); ctx.lineTo(x0 + w, yy + Math.tan(ang) * w * 0.15); } ctx.stroke();
  if (wet > 0) { const sh = ctx.createLinearGradient(x0, y0, x0 + w * 0.8, y0 + h * 0.8); sh.addColorStop(0, `rgba(255,255,255,${0.32 * wet})`); sh.addColorStop(0.4, 'rgba(255,255,255,0)'); ctx.fillStyle = sh; ctx.fillRect(x0, y0, w, h); }
  // pooled edge: the pigment gathers where it meets the outline
  regionClip(ctx, V, prep, F.region); ctx.strokeStyle = rgba(tint(c, -0.45), 0.5); ctx.lineWidth = Math.max(3, V.s * 0.01); ctx.stroke();
  if (p < 1) { ctx.beginPath(); ctx.arc(ax, ay, maxR * p, 0, 6.3); ctx.strokeStyle = rgba(tint(c, 0.4), 0.55); ctx.lineWidth = 3; ctx.stroke(); }
  ctx.restore();
}
// round, modelled objects (fruit): light from the upper left over whatever is painted, plus the agar gloss sweep
export function drawVolume(ctx, V, prep, ri, glossT) {
  const r = prep.regions[ri];
  if (!r.volume) return;
  const b = r.box, cx = X(V, (b.x0 + b.x1) / 2), cy = Y(V, (b.y0 + b.y1) / 2), rad = Math.max(b.x1 - b.x0, b.y1 - b.y0) * V.s * 0.62;
  ctx.save(); polyPath(ctx, V, r.pts); ctx.clip();
  const rg = ctx.createRadialGradient(cx - rad * 0.35, cy - rad * 0.4, rad * 0.05, cx, cy, rad);
  rg.addColorStop(0, 'rgba(255,255,255,0.34)'); rg.addColorStop(0.4, 'rgba(255,255,255,0.03)'); rg.addColorStop(1, 'rgba(20,0,0,0.42)'); ctx.fillStyle = rg; ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
  if (glossT > 0) { // dipped in agar: a clear glaze with a travelling highlight
    ctx.fillStyle = `rgba(255,255,255,${0.1 * Math.min(1, glossT)})`; ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    const sw = (glossT * 0.9) % 1.4 - 0.2, gx = cx - rad + sw * rad * 2.4;
    const gl = ctx.createLinearGradient(gx - rad * 0.3, cy - rad, gx + rad * 0.1, cy + rad); gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(0.5, `rgba(255,255,255,${0.5 * Math.min(1, glossT)})`); gl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.75 * Math.min(1, glossT)})`; ctx.beginPath(); ctx.ellipse(cx - rad * 0.38, cy - rad * 0.42, rad * 0.16, rad * 0.08, -0.7, 0, 6.3); ctx.fill();
  }
  ctx.restore();
}

// ---- guides ------------------------------------------------------------------------------------------------------------------------------
export function drawGuides(ctx, V, prep, mode, covS, covR, nextS, nextR, t, tone = '#ffd36a', numbered = false) {
  const px = Math.max(2.5, V.s * 0.0055);
  if (mode === 'off') { // memory mode: only a whisper of each fill outline
    for (const r of prep.regions) { if ((covR?.[r.i] ?? 0) > 0.82) continue; polyPath(ctx, V, r.pts); ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = px * 0.6; ctx.setLineDash([px, px * 2.4]); ctx.stroke(); ctx.restore(); }
    return;
  }
  for (const g of prep.guides) {
    const done = (covS?.[g.i] ?? 0) > 0.82, isNext = g.i === nextS;
    ctx.beginPath(); g.pts.forEach((p, i) => { const x = X(V, p[0]), y = Y(V, p[1]); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
    if (mode === 'faint') { ctx.save(); ctx.lineCap = 'round'; ctx.setLineDash([px * 1.2, px * 2.2]); ctx.strokeStyle = `rgba(255,255,255,${done ? 0.12 : 0.34})`; ctx.lineWidth = px * 0.8; ctx.stroke(); ctx.restore(); }
    else if (mode === 'trace') { ctx.save(); ctx.globalAlpha = done ? 0.22 : 1; litEdge(ctx, tone, px * 0.8, t, isNext); ctx.restore(); }
    if (numbered && !done && mode !== 'off' && !isNext) {   // 1.25.0: stroke order badges
      const p = g.pts[0], x = X(V, p[0]), y = Y(V, p[1]), r = px * 2.6;
      ctx.fillStyle = 'rgba(20,14,8,0.82)'; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(r * 1.25)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(g.i + 1), x, y + 0.5);
    }
    if (isNext) {
      const p = g.pts[0], x = X(V, p[0]), y = Y(V, p[1]), k = 0.6 + 0.4 * Math.sin(t * 5);
      ctx.fillStyle = `rgba(255,255,255,${0.9})`; ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, px * (2.4 + k), 0, 6.3); ctx.fill(); ctx.stroke();
      const q = g.pts[Math.min(g.pts.length - 1, 4)], ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
      if (numbered) { ctx.fillStyle = '#1b1b1b'; ctx.font = `700 ${Math.round(px * 3.4)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(g.i + 1), x, y + 0.5); }
      ctx.fillStyle = tone; ctx.beginPath(); ctx.moveTo(x + Math.cos(ang) * px * 6, y + Math.sin(ang) * px * 6); ctx.lineTo(x + Math.cos(ang + 2.5) * px * 3.4, y + Math.sin(ang + 2.5) * px * 3.4); ctx.lineTo(x + Math.cos(ang - 2.5) * px * 3.4, y + Math.sin(ang - 2.5) * px * 3.4); ctx.closePath(); ctx.fill();
    }
  }
  for (const r of prep.regions) {
    const done = (covR?.[r.i] ?? 0) > 0.82, isNext = r.i === nextR;
    polyPath(ctx, V, r.pts);
    ctx.save(); ctx.globalAlpha = done ? 0.3 : 1;
    if (mode === 'trace') litEdge(ctx, tone, px * 0.7, t, isNext);
    else { ctx.setLineDash([px * 1.4, px * 1.6]); ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = px * 0.7; ctx.stroke(); }
    ctx.restore();
  }
}

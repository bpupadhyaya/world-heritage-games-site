// Scene art, 1.13.0 (looms II): tapestry, hammock frame and backstrap loom. Pure canvas 2D, no Math.random (hash only), no figures, no text.
import { hash, rgba, mix, shade, roundRectPath, rod, ball, speck, glow, vignette, TAU, motifPath, isFilled, lineWidthOf, clamp, sheenLine, poly, POT } from './scene-kit.js';
import { TOOLS } from './scene-tools.js';
import { beam, castShadow, thread, margins, isLand } from './scene-loom.js';

const bx = (b) => ({ cx: b.x + b.w / 2, cy: b.y + b.h / 2, r: Math.min(b.w, b.h) / 2 });
function ring(ctx, S, b, on) {
  ctx.save(); ctx.strokeStyle = on ? S.pal.accent : 'rgba(255,255,255,0.28)'; ctx.lineWidth = on ? 4 : 1.5; roundRectPath(ctx, b.x, b.y, b.w, b.h, 12); ctx.stroke();
  if (on) { ctx.fillStyle = S.pal.accent; ctx.beginPath(); ctx.arc(b.x + b.w - 7, b.y + 7, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x + b.w - 9.5, b.y + 7); ctx.lineTo(b.x + b.w - 7.2, b.y + 9.2); ctx.lineTo(b.x + b.w - 4.6, b.y + 4.8); ctx.stroke(); }
  ctx.restore();
}
function back(ctx, b, c, a = 0.5) { ctx.save(); roundRectPath(ctx, b.x, b.y, b.w, b.h, 12); ctx.fillStyle = rgba(c, a); ctx.fill(); ctx.restore(); }
const softE = (ctx, x, y, rx, ry, a = 0.3) => { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); };
const pressOf = (T) => Math.max(0, 1 - T.a / 0.45);
const L = (S) => ({ a: S.area, r: S.rect, c: S.cell, m: margins(S), land: isLand(S), b: S.box });

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// supplies and tools
// ---------------------------------------------------------------------------------------------------------------------------------------------------
Object.assign(POT, {
  // a twisted hank of dyed wool hanging from a wooden peg, the loop tied with a cord
  woolhank(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#1b2631', 0.6);
    ctx.save(); ctx.translate(cx, cy + lift);
    softE(ctx, r * 0.12, r * 0.8, r * 0.5, r * 0.09);
    rod(ctx, -r * 0.35, -r * 0.8, r * 0.35, -r * 0.8, r * 0.14, '#b98a52');
    for (let k = 0; k < 9; k++) { const o = (k - 4) * r * 0.075, g = ctx.createLinearGradient(o - r * 0.06, 0, o + r * 0.06, 0); g.addColorStop(0, shade(col, 0.35)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -0.45)); ctx.strokeStyle = g; ctx.lineWidth = r * 0.085; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(o * 0.7, -r * 0.78); ctx.bezierCurveTo(o * 1.3, -r * 0.2, o * 1.5, r * 0.3, o * 0.9 + Math.sin(k) * 2, r * 0.7); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 9; k++) { const y = -r * 0.6 + k * r * 0.15; ctx.moveTo(-r * 0.3, y); ctx.lineTo(r * 0.3, y + r * 0.06); } ctx.stroke();
    ctx.strokeStyle = '#efe6cf'; ctx.lineWidth = r * 0.07; ctx.beginPath(); ctx.moveTo(-r * 0.3, -r * 0.5); ctx.lineTo(r * 0.3, -r * 0.45); ctx.stroke();
    ctx.restore(); ring(ctx, S, b, on);
  },
  // a ball of bright cotton cord with a loose end, wound crosswise
  netball(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#0c4a58', 0.55);
    ctx.save(); ctx.translate(cx, cy + lift); softE(ctx, r * 0.12, r * 0.66, r * 0.7, r * 0.12);
    const R = r * 0.62, g = ctx.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R); g.addColorStop(0, shade(col, 0.5)); g.addColorStop(0.55, col); g.addColorStop(1, shade(col, -0.5)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip(); ctx.strokeStyle = rgba(shade(col, -0.45), 0.5); ctx.lineWidth = Math.max(1, R * 0.07);
    for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.ellipse(0, 0, R * 1.05, R * (0.25 + k * 0.1), 0.5 + k * 0.45, 0, TAU); ctx.stroke(); }
    ctx.strokeStyle = rgba(shade(col, 0.6), 0.5); ctx.lineWidth = Math.max(0.8, R * 0.03); for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.ellipse(-1, -1, R * 1.05, R * (0.25 + k * 0.1), 0.5 + k * 0.45, 0.2, 1.4); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, R * 0.12); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(R * 0.6, R * 0.6); ctx.bezierCurveTo(R * 1.2, R * 0.7, R * 0.9, R * 1.2, R * 1.3, R * 1.1); ctx.stroke();
    ctx.restore(); ring(ctx, S, b, on);
  },
  // a smooth ball of wool yarn, criss-cross wound, with a strand trailing off
  woolball(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#241810', 0.55);
    ctx.save(); ctx.translate(cx, cy + lift); softE(ctx, r * 0.14, r * 0.66, r * 0.72, r * 0.12);
    const R = r * 0.64, g = ctx.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R); g.addColorStop(0, shade(col, 0.4)); g.addColorStop(0.6, col); g.addColorStop(1, shade(col, -0.5)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip(); ctx.lineWidth = Math.max(0.9, R * 0.05);
    for (let k = 0; k < 16; k++) { ctx.strokeStyle = rgba(shade(col, k % 2 ? -0.5 : 0.3), 0.4); ctx.beginPath(); ctx.moveTo(-R * 1.1, (k - 8) * R * 0.14); ctx.quadraticCurveTo(0, (k - 8) * R * 0.14 + R * (hash(k, 3) - 0.5) * 0.9, R * 1.1, (k - 8) * R * 0.2); ctx.stroke(); }
    ctx.restore(); ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.6, R * 0.09); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(R * 0.55, R * 0.7); ctx.bezierCurveTo(R * 0.9, R * 1.0, R * 1.4, R * 0.7, R * 1.5, R * 1.1); ctx.stroke();
    ctx.restore(); ring(ctx, S, b, on);
  },
});

Object.assign(TOOLS, {
  // a tapestry bobbin: a pointed wooden spindle with a fat winding of wool, the point is the tip
  tapbobbin(ctx, S, T) {
    const u = T.u, p = pressOf(T), lift = (1 - p) * u * 0.3;
    softE(ctx, T.x + u * 0.9, T.y + u * 0.12, u * 1.1, u * 0.1);
    ctx.save(); ctx.translate(T.x, T.y - lift); ctx.rotate(-0.55);
    const w = u * 0.26; ctx.fillStyle = '#c99a5c'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-w * 0.9 + u * 0.5, -w * 0.5); ctx.lineTo(u * 0.9, -w * 0.6); ctx.lineTo(u * 0.9, w * 0.6); ctx.lineTo(u * 0.5, w * 0.5); ctx.closePath(); ctx.fill();
    rod(ctx, u * 0.8, 0, u * 3.0, 0, w * 1.15, '#a8743c');
    const x0 = u * 1.0, x1 = u * 2.1, gg = ctx.createLinearGradient(0, -u * 0.5, 0, u * 0.5); gg.addColorStop(0, shade(T.col, 0.4)); gg.addColorStop(0.5, T.col); gg.addColorStop(1, shade(T.col, -0.5));
    ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(x0, -w * 0.5); ctx.quadraticCurveTo((x0 + x1) / 2, -u * 0.52, x1, -w * 0.5); ctx.lineTo(x1, w * 0.5); ctx.quadraticCurveTo((x0 + x1) / 2, u * 0.52, x0, w * 0.5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(shade(T.col, -0.55), 0.55); ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 9; k++) { const x = x0 + (k + 0.5) * (x1 - x0) / 9; ctx.moveTo(x, -u * 0.46); ctx.lineTo(x + u * 0.05, u * 0.46); } ctx.stroke();
    ctx.restore();
    sheenLine(ctx, [[T.x, T.y - lift], [T.x - u * 0.6, T.y + u * 0.05 + Math.sin(T.t * 3) * u * 0.04], [T.x - u * 1.2, T.y + u * 0.12]], Math.max(1.4, u * 0.06), T.col);
  },
  // a netting needle: a flat wooden shuttle with a forked end loaded with cord
  netneedle(ctx, S, T) {
    const u = T.u, p = pressOf(T), lift = (1 - p) * u * 0.3;
    softE(ctx, T.x + u * 0.8, T.y + u * 0.12, u * 1.2, u * 0.09);
    ctx.save(); ctx.translate(T.x, T.y - lift); ctx.rotate(-0.3);
    const g = ctx.createLinearGradient(0, -u * 0.3, 0, u * 0.3); g.addColorStop(0, '#f0d49a'); g.addColorStop(1, '#a8743c'); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, -u * 0.05); ctx.lineTo(-u * 0.22, -u * 0.26); ctx.lineTo(u * 0.7, -u * 0.26); ctx.lineTo(u * 2.6, -u * 0.22); ctx.quadraticCurveTo(u * 3.0, 0, u * 2.6, u * 0.22); ctx.lineTo(u * 0.7, u * 0.26); ctx.lineTo(-u * 0.22, u * 0.26); ctx.lineTo(0, u * 0.05); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(70,40,10,0.6)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#6a4424'; roundRectPath(ctx, u * 0.5, -u * 0.08, u * 1.9, u * 0.16, u * 0.08); ctx.fill();
    ctx.fillStyle = T.col; for (let k = 0; k < 8; k++) ctx.fillRect(u * (0.7 + k * 0.2), -u * 0.2, u * 0.15, u * 0.4);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(u * 0.7, -u * 0.2, u * 1.6, u * 0.07);
    ctx.restore();
    sheenLine(ctx, [[T.x, T.y - lift], [T.x - u * 0.7, T.y + u * 0.1 + Math.sin(T.t * 3) * u * 0.05], [T.x - u * 1.3, T.y + u * 0.2]], Math.max(1.6, u * 0.07), T.col);
  },
  // a pick-up stick: a slim polished bamboo blade lifting the pattern threads, a loop of the thread at its point
  pickstick(ctx, S, T) {
    const u = T.u, p = pressOf(T), lift = (1 - p) * u * 0.35;
    softE(ctx, T.x + u * 0.8, T.y + u * 0.1, u * 1.2, u * 0.08);
    ctx.save(); ctx.translate(T.x, T.y - lift); ctx.rotate(-0.42);
    const g = ctx.createLinearGradient(0, -u * 0.15, 0, u * 0.15); g.addColorStop(0, '#f6e0a6'); g.addColorStop(1, '#a8803c'); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(u * 0.8, -u * 0.13); ctx.lineTo(u * 3.2, -u * 0.13); ctx.quadraticCurveTo(u * 3.4, 0, u * 3.2, u * 0.13); ctx.lineTo(u * 0.8, u * 0.13); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(80,50,10,0.55)'; ctx.lineWidth = 1; ctx.stroke(); ctx.strokeStyle = 'rgba(80,50,10,0.5)'; ctx.beginPath(); for (let k = 1; k < 4; k++) { ctx.moveTo(u * (0.9 + k * 0.7), -u * 0.13); ctx.lineTo(u * (0.9 + k * 0.7), u * 0.13); } ctx.stroke();
    ctx.strokeStyle = '#c0392b'; ctx.lineWidth = u * 0.05; ctx.beginPath(); ctx.moveTo(u * 2.7, -u * 0.13); ctx.lineTo(u * 2.7, u * 0.13); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = T.col; ctx.lineWidth = Math.max(1.6, u * 0.08); ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(T.x, T.y - lift + u * 0.02, u * 0.12, 0, TAU); ctx.stroke();
  },
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// cell skins
// ---------------------------------------------------------------------------------------------------------------------------------------------------
// tapestry: weft-faced wool, rows packed tight with the twist of the yarn showing; shapes meet in toothed slit/hachure edges; line motifs are couched wool cord
export function tapestrySkin(ctx, d) {
  const { kind, col, x, y, s, key } = d, fill = isFilled(kind), h = s / 2, n = 10, p = s / n, lw = lineWidthOf(kind, s);
  if (!fill) {
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = lw + 2; ctx.stroke(); ctx.strokeStyle = shade(col, -0.4); ctx.lineWidth = lw; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw * 0.78; ctx.stroke();
    ctx.setLineDash([lw * 0.28, lw * 0.34]); ctx.strokeStyle = rgba(shade(col, -0.55), 0.7); ctx.lineWidth = lw * 0.78; ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = rgba(shade(col, 0.55), 0.6); ctx.lineWidth = Math.max(0.8, lw * 0.16); ctx.translate(-lw * 0.12, -lw * 0.22); ctx.stroke(); ctx.restore(); return;
  }
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.fillStyle = shade(col, -0.5); ctx.fill(); ctx.clip();
  for (let j = 0; j <= n; j++) { // one weft pass per row: lit crest, shaded underside
    const yy = y - h + j * p, t = (hash(key, j) - 0.5) * 0.1, gg = ctx.createLinearGradient(0, yy, 0, yy + p);
    gg.addColorStop(0, shade(col, 0.2 + t)); gg.addColorStop(0.5, shade(col, t)); gg.addColorStop(1, shade(col, -0.38 + t)); ctx.fillStyle = gg; ctx.fillRect(x - h - 2, yy, s + 4, p * 0.94);
  }
  ctx.lineWidth = Math.max(0.7, p * 0.13); ctx.strokeStyle = rgba(shade(col, -0.62), 0.55); ctx.beginPath();
  for (let j = 0; j < n; j++) for (let k = 0; k < n * 2 + 1; k++) { const xx = x - h + (k + (j % 2) * 0.5) * p * 0.52; ctx.moveTo(xx, y - h + (j + 0.9) * p); ctx.lineTo(xx + p * 0.34, y - h + (j + 0.12) * p); }
  ctx.stroke(); ctx.strokeStyle = rgba(shade(col, 0.6), 0.35); ctx.beginPath();
  for (let j = 0; j < n; j++) for (let k = 0; k < n * 2 + 1; k++) { const xx = x - h + (k + (j % 2) * 0.5) * p * 0.52 - 0.8; ctx.moveTo(xx, y - h + (j + 0.9) * p); ctx.lineTo(xx + p * 0.34, y - h + (j + 0.12) * p); }
  ctx.stroke();
  const og = ctx.createRadialGradient(x - s * 0.2, y - s * 0.25, s * 0.06, x, y, s * 0.68); og.addColorStop(0, 'rgba(235,245,255,0.14)'); og.addColorStop(1, 'rgba(0,10,20,0.34)'); ctx.fillStyle = og; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  ctx.restore();
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(shade(col, -0.75), 0.75); ctx.lineWidth = Math.max(1.2, s * 0.045); ctx.stroke(); // the slit edge
  ctx.setLineDash([p * 0.55, p * 0.55]); ctx.strokeStyle = rgba(shade(col, 0.45), 0.55); ctx.lineWidth = Math.max(1, s * 0.022); ctx.stroke(); ctx.restore(); // hachure teeth
}
// hammock: a knotted mesh of cotton cord, cord squares with a knot at every crossing, the dark backing showing through the gaps
export function hammockSkin(ctx, d) {
  const { kind, col, x, y, s, key } = d, fill = isFilled(kind), h = s / 2, n = 5, p = s / n, lw = lineWidthOf(kind, s);
  if (!fill) {
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,30,40,0.4)'; ctx.lineWidth = lw * 1.4 + 2; ctx.stroke(); ctx.strokeStyle = shade(col, -0.4); ctx.lineWidth = lw * 1.4; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
    ctx.setLineDash([lw * 0.5, lw * 0.5]); ctx.strokeStyle = rgba(shade(col, -0.5), 0.55); ctx.lineWidth = lw; ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = rgba(shade(col, 0.6), 0.6); ctx.lineWidth = Math.max(1, lw * 0.2); ctx.translate(-lw * 0.2, -lw * 0.3); ctx.stroke(); ctx.restore(); return;
  }
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.fillStyle = shade(col, -0.72); ctx.fill(); ctx.clip();
  const t = p * 0.4, cord = (x1, y1, x2, y2) => { ctx.strokeStyle = shade(col, -0.45); ctx.lineWidth = t * 1.15; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = t * 0.78; ctx.beginPath(); ctx.moveTo(x1 - t * 0.08, y1 - t * 0.08); ctx.lineTo(x2 - t * 0.08, y2 - t * 0.08); ctx.stroke(); ctx.strokeStyle = rgba(shade(col, 0.65), 0.7); ctx.lineWidth = Math.max(0.7, t * 0.2); ctx.beginPath(); ctx.moveTo(x1 - t * 0.22, y1 - t * 0.22); ctx.lineTo(x2 - t * 0.22, y2 - t * 0.22); ctx.stroke(); };
  for (let k = 0; k <= n; k++) cord(x - h + (k + 0.5 - 0.5) * p + p * 0.0, y - h - 2, x - h + k * p, y + h + 2);
  for (let j = 0; j <= n; j++) cord(x - h - 2, y - h + j * p, x + h + 2, y - h + j * p + (hash(key, j) - 0.5) * p * 0.12);
  for (let j = 0; j <= n; j++) for (let k = 0; k <= n; k++) { const kx = x - h + k * p, ky = y - h + j * p, r = t * 0.74; ctx.fillStyle = 'rgba(0,25,35,0.4)'; ctx.beginPath(); ctx.ellipse(kx + r * 0.25, ky + r * 0.4, r, r * 0.8, 0, 0, TAU); ctx.fill(); const g = ctx.createRadialGradient(kx - r * 0.35, ky - r * 0.4, r * 0.1, kx, ky, r); g.addColorStop(0, shade(col, 0.6)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -0.5)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(kx, ky, r, 0, TAU); ctx.fill(); }
  ctx.restore();
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(shade(col, -0.7), 0.6); ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke(); ctx.restore();
}
// backstrap pick-up: brick-laid weft floats standing proud of a warp-faced ground, each float a polished pill, ends tucked at the shape edge
export function strapSkin(ctx, d) {
  const { kind, col, x, y, s, key } = d, fill = isFilled(kind), h = s / 2, n = 7, p = s / n, lw = lineWidthOf(kind, s);
  if (!fill) {
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = lw + 2; ctx.stroke(); ctx.strokeStyle = shade(col, -0.45); ctx.lineWidth = lw; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw * 0.72; ctx.stroke();
    ctx.setLineDash([lw * 0.9, lw * 0.35]); ctx.strokeStyle = rgba(shade(col, 0.4), 0.7); ctx.lineWidth = lw * 0.5; ctx.stroke(); ctx.setLineDash([]); ctx.restore(); return;
  }
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.fillStyle = shade(col, -0.62); ctx.fill(); ctx.clip();
  ctx.strokeStyle = rgba(shade(col, -0.2), 0.8); ctx.lineWidth = Math.max(0.8, p * 0.22); ctx.beginPath(); for (let k = 0; k < n * 3; k++) { const xx = x - h + (k + 0.5) * p / 3; ctx.moveTo(xx, y - h - 1); ctx.lineTo(xx, y + h + 1); } ctx.stroke();
  for (let j = 0; j < n; j++) for (let k = -1; k < n; k += 2) {
    const fx = x - h + (k + (j % 2) + 0.05) * p, fy = y - h + j * p + p * 0.14, fw = p * 1.9, fh = p * 0.72, t = (hash(key, j, k) - 0.5) * 0.14;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; roundRectPath(ctx, fx + p * 0.05, fy + p * 0.14, fw, fh, fh * 0.5); ctx.fill();
    const g = ctx.createLinearGradient(0, fy, 0, fy + fh); g.addColorStop(0, shade(col, 0.4 + t)); g.addColorStop(0.45, shade(col, t)); g.addColorStop(1, shade(col, -0.42 + t)); ctx.fillStyle = g; roundRectPath(ctx, fx, fy, fw, fh, fh * 0.5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(fx + fh * 0.4, fy + fh * 0.16, fw - fh * 0.8, Math.max(0.8, fh * 0.1));
  }
  const og = ctx.createRadialGradient(x - s * 0.2, y - s * 0.25, s * 0.06, x, y, s * 0.68); og.addColorStop(0, 'rgba(255,235,200,0.1)'); og.addColorStop(1, 'rgba(20,8,0,0.34)'); ctx.fillStyle = og; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  ctx.restore();
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(shade(col, -0.75), 0.7); ctx.lineWidth = Math.max(1, s * 0.035); ctx.stroke(); ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// TAPESTRY: an atelier with a north window; an upright oak loom, the painted cartoon behind the warp, wool bobbins hanging from the cloth
// ---------------------------------------------------------------------------------------------------------------------------------------------------
export function tapEnv(ctx, S) {
  const a = S.area, c = S.cell, X0 = a.x - 12, W = a.w + 24;
  const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#7f909c'); g.addColorStop(0.7, '#5a6874'); g.addColorStop(1, '#3f4a54'); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, a.h);
  speck(ctx, a, 500, ['#ffffff', '#1c2630'], 0.07, 1.8, 7);
  // tall north window, cold daylight, with mullions and a long soft beam falling across the room
  const gm = tapGeom(S), land = a.w > a.h * 1.15, ww = land ? c * 2.3 : Math.min(a.w * 0.5, c * 4.2), wh = Math.min(a.h * (land ? 0.5 : 0.34), c * 6), wx = land ? gm.rx + gm.pw * 1.2 : a.x + a.w * 0.04, wy = a.y + a.h * (land ? 0.1 : 0.02);
  const wg = ctx.createLinearGradient(0, wy, 0, wy + wh); wg.addColorStop(0, '#f3f9ff'); wg.addColorStop(1, '#bfd6e8'); ctx.fillStyle = wg; ctx.fillRect(wx, wy, ww, wh);
  ctx.strokeStyle = '#2b3640'; ctx.lineWidth = Math.max(3, c * 0.12); ctx.strokeRect(wx, wy, ww, wh); ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh * 0.36); ctx.lineTo(wx + ww, wy + wh * 0.36); ctx.moveTo(wx, wy + wh * 0.68); ctx.lineTo(wx + ww, wy + wh * 0.68); ctx.stroke();
  ctx.save(); ctx.globalAlpha = 0.13; ctx.fillStyle = '#e8f3ff'; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx + ww, wy + wh); ctx.lineTo(wx + ww * 2.6, a.y + a.h); ctx.lineTo(wx + ww * 0.6, a.y + a.h); ctx.fill(); ctx.restore();
  glow(ctx, wx + ww / 2, wy + wh * 0.5, Math.max(a.w, a.h) * 0.55, '#dcecff', 0.3);
  // wooden floor and a skirting board
  const fy = a.y + a.h * 0.93, fg = ctx.createLinearGradient(0, fy, 0, a.y + a.h); fg.addColorStop(0, '#4a3322'); fg.addColorStop(1, '#2a1c12'); ctx.fillStyle = fg; ctx.fillRect(X0, fy, W, a.y + a.h - fy + 12); ctx.fillStyle = 'rgba(255,230,190,0.3)'; ctx.fillRect(X0, fy, W, Math.max(1.4, c * 0.05));
  // a rail on the wall with hanks of dyed wool
  const ry = a.y + a.h * 0.5; ctx.fillStyle = '#6a4a2c'; ctx.fillRect(X0, ry, W, Math.max(3, c * 0.1)); const cs = S.colors;
  for (let k = 0; k < 9; k++) { const x = a.x + a.w * (0.08 + k * 0.105); if (x > gm.lx - c * 0.5 && x < gm.rx + c * 0.5) continue; const col = cs[k % cs.length], hl = c * (0.9 + hash(k, 5) * 0.5); const gg = ctx.createLinearGradient(x - c * 0.14, 0, x + c * 0.14, 0); gg.addColorStop(0, shade(col, 0.3)); gg.addColorStop(1, shade(col, -0.45)); ctx.fillStyle = gg; roundRectPath(ctx, x - c * 0.14, ry + c * 0.06, c * 0.28, hl, c * 0.1); ctx.fill(); }
  vignette(ctx, a, 0.4);
}
function tapGeom(S) {
  const { a, r, c, m } = L(S), pw = Math.max(9, c * 0.4);
  const lx = Math.max(a.x + pw * 0.6, r.x - clamp(m.l * 0.55, c * 0.5, c * 0.85)), rx = Math.min(a.x + a.w - pw * 0.6, r.x + r.w + clamp(m.r * 0.55, c * 0.5, c * 0.85));
  const ty = Math.max(a.y + c * 0.3, r.y - clamp(m.t * 0.8, c * 0.55, c * 1.3)), bot = r.y + r.h, by = bot + Math.max(c * 0.16, 3);
  return { a, r, c, m, pw, lx, rx, ty, bot, by, bl: clamp(m.b * 0.5, c * 0.3, c * 1.0) };
}
export function tapUnder(ctx, S) {
  if (S.card || S.lite) return;
  const g = tapGeom(S), { r, c, pw, lx, rx, ty } = g, a = g.a, cs = S.colors;
  for (const x of [lx, rx]) { castShadow(ctx, x, a.y, x, a.y + a.h, pw, pw * 0.8, pw * 0.2, 0.3); beam(ctx, x, a.y, x, a.y + a.h, pw, '#9a6a3a', Math.floor(x)); }
  // the cartoon: painted paper pinned behind the warp, between the warp beam and the cloth
  const px0 = r.x - c * 0.15, pw2 = r.w + c * 0.3, py0 = ty + c * 0.12, ph = r.y - py0;
  if (ph > 4) {
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = c * 0.3; ctx.fillStyle = '#efe6cf'; ctx.fillRect(px0, py0, pw2, ph); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(px0, py0, pw2, ph); ctx.clip();
    for (let k = 0; k < 7; k++) { const x = px0 + pw2 * (0.08 + hash(k, 1) * 0.84), y = py0 + ph * (0.2 + hash(k, 2) * 0.6), R = c * (0.35 + hash(k, 3) * 0.4); ctx.fillStyle = rgba(cs[k % cs.length], 0.7); ctx.beginPath(); ctx.ellipse(x, y, R, R * 0.7, hash(k, 4) * 3, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(40,25,10,0.7)'; ctx.lineWidth = Math.max(1, c * 0.03); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = '#d9cfb0'; for (const x of [px0 + c * 0.14, px0 + pw2 - c * 0.14]) { ball(ctx, x, py0 + c * 0.1, Math.max(2, c * 0.07), '#c0392b', false); }
  }
  // warp threads from the warp beam, running down through the shed
  const p = Math.max(2.4, c / 4.8);
  for (let x = r.x + p * 0.5; x < r.x + r.w; x += p) thread(ctx, x, ty + c * 0.1, x, r.y + 2, Math.max(1, p * 0.3), '#efe6cf', 0);
  // top warp beam with the turns of warp wound on, and a leash rod below it
  const bw = Math.max(8, c * 0.3); castShadow(ctx, lx, ty, rx, ty, bw, 2, bw * 0.6, 0.35); beam(ctx, lx - pw * 0.4, ty, rx + pw * 0.4, ty, bw, '#b07a44', 17);
  ctx.fillStyle = '#efe6cf'; for (let x = r.x; x < r.x + r.w; x += p * 1.4) ctx.fillRect(x, ty - bw * 0.3, Math.max(1, p * 0.55), bw * 0.7);
  const sy = r.y - Math.max(c * 0.28, 4); rod(ctx, r.x - c * 0.25, sy, r.x + r.w + c * 0.25, sy, Math.max(4, c * 0.12), '#d6b27a');
  ctx.strokeStyle = 'rgba(250,240,215,0.9)'; ctx.lineWidth = 1; for (let x = r.x + p * 1.3; x < r.x + r.w; x += p * 3) { ctx.beginPath(); ctx.arc(x, sy + c * 0.07, c * 0.05, 0, TAU); ctx.stroke(); }
}
export function tapFrame(ctx, S) {
  if (S.card || S.lite) return;
  const g = tapGeom(S), { r, c, lx, rx, by, bl, pw } = g, cols = S.cols, cw = r.w / cols, cs = S.colors, bw = Math.max(7, c * 0.26);
  // the lower beam, tapestry rolled over it
  castShadow(ctx, lx, by, rx, by, bw, 2, bw * 0.6, 0.35); beam(ctx, lx - pw * 0.4, by, rx + pw * 0.4, by, bw, '#a8723c', 19);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x - 1, by - bw * 0.5, r.w + 2, bw); ctx.clip(); const rg = ctx.createLinearGradient(0, by - bw * 0.5, 0, by + bw * 0.5);
  rg.addColorStop(0, shade(cs[0], 0.3)); rg.addColorStop(0.5, cs[0]); rg.addColorStop(1, shade(cs[0], -0.5)); ctx.fillStyle = rg; ctx.fillRect(r.x - 1, by - bw * 0.5, r.w + 2, bw);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = r.x; x < r.x + r.w; x += c * 0.14) { ctx.moveTo(x, by - bw * 0.5); ctx.lineTo(x + 2, by + bw * 0.5); } ctx.stroke(); ctx.restore();
  // wool bobbins hanging from the cloth on their own threads, the pointed wooden spindles with a wound belly of colour
  for (let i = 0; i < cols; i++) {
    const x = r.x + (i + 0.5) * cw + (hash(i, 8) - 0.5) * cw * 0.3, len = bl * (0.55 + hash(i, 9) * 0.45), col = cs[(i * 3) % cs.length], y0 = by + bw * 0.5, y1 = y0 + len, sw = Math.min(c * 0.17, cw * 0.2);
    thread(ctx, x, y0, x, y1, Math.max(1, c * 0.035), col, 0);
    softE(ctx, x + sw * 0.4, y1 + sw * 2.3, sw * 0.9, sw * 0.28, 0.3);
    ctx.fillStyle = '#c99a5c'; ctx.beginPath(); ctx.moveTo(x - sw * 0.5, y1); ctx.lineTo(x + sw * 0.5, y1); ctx.lineTo(x + sw * 0.28, y1 + sw * 2.6); ctx.lineTo(x, y1 + sw * 3.0); ctx.lineTo(x - sw * 0.28, y1 + sw * 2.6); ctx.closePath(); ctx.fill();
    const gg = ctx.createLinearGradient(x - sw, 0, x + sw, 0); gg.addColorStop(0, shade(col, 0.4)); gg.addColorStop(0.5, col); gg.addColorStop(1, shade(col, -0.5)); ctx.fillStyle = gg; roundRectPath(ctx, x - sw * 0.95, y1 + sw * 0.1, sw * 1.9, sw * 1.7, sw * 0.6); ctx.fill();
    ctx.strokeStyle = rgba(shade(col, -0.55), 0.5); ctx.lineWidth = 1; ctx.beginPath(); for (let k = 1; k < 5; k++) { ctx.moveTo(x - sw * 0.9, y1 + sw * (0.1 + k * 0.34)); ctx.lineTo(x + sw * 0.9, y1 + sw * (0.1 + k * 0.34)); } ctx.stroke();
  }
}
export function tapGround(ctx, S) {
  const r = S.rect, c = S.cell, m = S.bg, p = Math.max(1.8, c / 9);
  ctx.fillStyle = shade(m, -0.3); ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  for (let y = r.y, j = 0; y < r.y + r.h; y += p, j++) { const g = ctx.createLinearGradient(0, y, 0, y + p); g.addColorStop(0, shade(m, 0.08 + (hash(j, 2) - 0.5) * 0.08)); g.addColorStop(1, shade(m, -0.34)); ctx.fillStyle = g; ctx.fillRect(r.x, y, r.w, p * 0.92); }
  if (!S.lite) { ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = r.x + p * 1.5; x < r.x + r.w; x += p * 3) { ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); } ctx.stroke(); }
  ctx.restore();
}
export function tapOver(ctx, S) {
  const r = S.rect, c = S.cell; ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(225,240,255,0.2)'); g.addColorStop(0.45, 'rgba(225,240,255,0)'); g.addColorStop(1, 'rgba(0,10,25,0.3)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  const e = Math.max(4, c * 0.3), tg = ctx.createLinearGradient(0, r.y, 0, r.y + e); tg.addColorStop(0, 'rgba(0,0,0,0.32)'); tg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = tg; ctx.fillRect(r.x, r.y, r.w, e);
  ctx.fillStyle = '#e9e0c6'; ctx.fillRect(r.x, r.y, Math.max(2, c * 0.07), r.h); ctx.fillRect(r.x + r.w - Math.max(2, c * 0.07), r.y, Math.max(2, c * 0.07), r.h); // selvedge
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// HAMMOCK FRAME: bright tropical light, a painted frame with two end posts and two rails, cotton strands in groups, ropes up to an iron ring
// ---------------------------------------------------------------------------------------------------------------------------------------------------
const PAINT = '#1b9aa6', CORAL = '#f0675a';
export function hamEnv(ctx, S) {
  const a = S.area, c = S.cell, X0 = a.x - 12, W = a.w + 24;
  const sky = ctx.createLinearGradient(0, a.y, 0, a.y + a.h * 0.42); sky.addColorStop(0, '#6fd4e6'); sky.addColorStop(1, '#c9f1f2'); ctx.fillStyle = sky; ctx.fillRect(X0, a.y, W, a.h * 0.42);
  const hz = a.y + a.h * 0.2, sea = ctx.createLinearGradient(0, hz, 0, a.y + a.h * 0.46); sea.addColorStop(0, '#0f9bb5'); sea.addColorStop(1, '#4fd0d0'); ctx.fillStyle = sea; ctx.fillRect(X0, hz, W, a.h * 0.26);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.4; for (let k = 0; k < 14; k++) { const y = hz + a.h * 0.01 + k * a.h * 0.018, x = a.x + hash(k, 2) * a.w; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + c * 0.5, y - 2, x + c, y); ctx.stroke(); }
  const sd = ctx.createLinearGradient(0, a.y + a.h * 0.44, 0, a.y + a.h); sd.addColorStop(0, '#f6e6b4'); sd.addColorStop(1, '#dcc185'); ctx.fillStyle = sd; ctx.beginPath(); ctx.moveTo(X0, a.y + a.h * 0.46); ctx.quadraticCurveTo(a.x + a.w * 0.5, a.y + a.h * 0.42, X0 + W, a.y + a.h * 0.47); ctx.lineTo(X0 + W, a.y + a.h + 12); ctx.lineTo(X0, a.y + a.h + 12); ctx.fill();
  speck(ctx, { x: a.x, y: a.y + a.h * 0.5, w: a.w, h: a.h * 0.5 }, 500, ['#b8955a', '#fff8dc'], 0.4, 2, 4);
  // palm fronds across the top corners, light and shadow
  for (const [ox, dir] of [[a.x - c * 0.3, 1], [a.x + a.w + c * 0.3, -1]]) { for (let k = 0; k < 7; k++) { ctx.save(); ctx.translate(ox, a.y - c * 0.4); ctx.rotate(dir * (0.5 + k * 0.2)); ctx.fillStyle = k % 2 ? '#1f8a4a' : '#2ba35a'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(c * 2.5 * dir, -c * 0.7, c * 5.5 * dir, c * 0.4); ctx.quadraticCurveTo(c * 2.5 * dir, c * 0.5, 0, 0); ctx.fill(); ctx.restore(); } }
  glow(ctx, a.x + a.w * 0.8, a.y + a.h * 0.1, Math.max(a.w, a.h) * 0.7, '#fffbe0', 0.45);
  vignette(ctx, a, 0.18);
}
function hamGeom(S) {
  const { a, r, c, m } = L(S), pw = Math.max(9, c * 0.4), bot = r.y + r.h;
  const lx = Math.max(a.x + pw * 0.6, r.x - clamp(m.l * 0.6, c * 0.55, c * 0.9)), rx = Math.min(a.x + a.w - pw * 0.6, r.x + r.w + clamp(m.r * 0.6, c * 0.55, c * 0.9));
  const gap = clamp(Math.min(m.t, m.b) * 0.5, c * 0.28, c * 0.7), ty = r.y - gap, by = bot + gap, top = Math.max(a.y + c * 0.25, ty - clamp(m.t * 0.55, c * 0.2, c * 1.3));
  return { a, r, c, m, pw, lx, rx, ty, by, top, gap, bot };
}
export function hamUnder(ctx, S) {
  if (S.card || S.lite) return;
  const g = hamGeom(S), { r, c, pw, lx, rx, ty, by, top } = g, cols = S.cols, cw = r.w / cols, cs = S.colors;
  // ropes from the rail ends to a ring at the top, rope: coral and cream twisted
  const hx = r.x + r.w / 2;
  if (ty - top > c * 0.35) for (const x of [lx, rx]) { const L2 = Math.hypot(hx - x, ty - top); castShadow(ctx, x, ty, hx, top, c * 0.16, 2, 3, 0.25); ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = shade(CORAL, -0.4); ctx.lineWidth = c * 0.15; ctx.beginPath(); ctx.moveTo(x, ty); ctx.lineTo(hx, top); ctx.stroke(); ctx.strokeStyle = CORAL; ctx.lineWidth = c * 0.1; ctx.stroke(); ctx.setLineDash([c * 0.06, c * 0.1]); ctx.strokeStyle = '#fff2dc'; ctx.lineWidth = c * 0.1; ctx.stroke(); ctx.restore(); void L2; }
  if (ty - top > c * 0.35) { ctx.strokeStyle = '#2a2a2e'; ctx.lineWidth = Math.max(3, c * 0.1); ctx.beginPath(); ctx.arc(hx, top - c * 0.02, c * 0.18, 0, TAU); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(hx, top - c * 0.02, c * 0.18, 3.6, 5.2); ctx.stroke(); }
  // strands from each rail into the work, in a group per column
  for (let i = 0; i < cols; i++) for (let k = 0; k < 3; k++) { const x = r.x + (i + 0.2 + k * 0.3) * cw, xr = r.x + (i + 0.5) * cw + (k - 1) * cw * 0.1; thread(ctx, xr, ty, x, r.y + 1, Math.max(1.2, c * 0.04), '#fff6e2', 0); thread(ctx, x, r.y + r.h - 1, xr, by, Math.max(1.2, c * 0.04), '#fff6e2', 0); }
  // posts standing on the sand
  for (const x of [lx, rx]) { softE(ctx, x + pw * 0.8, by + c * 0.5, pw * 1.2, pw * 0.35, 0.3); rod(ctx, x, ty - c * 0.2, x, by + c * 0.45, pw, PAINT); rod(ctx, x, ty - c * 0.2, x, ty - c * 0.05, pw * 1.05, '#fff6e2'); rod(ctx, x, by + c * 0.3, x, by + c * 0.45, pw * 1.05, '#fff6e2'); }
  // rails
  const bw = Math.max(7, c * 0.24);
  for (const y of [ty, by]) { castShadow(ctx, lx, y, rx, y, bw, 1.5, bw * 0.6, 0.3); rod(ctx, lx - pw * 0.4, y, rx + pw * 0.4, y, bw, '#f3d8a0'); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(r.x, y - bw * 0.36, r.w, Math.max(1, bw * 0.1)); for (let i = 0; i < cols; i++) { ball(ctx, r.x + (i + 0.5) * cw, y, bw * 0.55, cs[i % cs.length], false); } }
}
export function hamFrame(ctx, S) {
  if (S.card || S.lite) return;
  const g = hamGeom(S), { r, c } = g, e = Math.max(4, c * 0.15);
  for (const x of [r.x - e * 0.2, r.x + r.w - e * 0.8]) { ctx.save(); ctx.lineCap = 'butt'; ctx.strokeStyle = shade(CORAL, -0.45); ctx.lineWidth = e; ctx.beginPath(); ctx.moveTo(x + e / 2, r.y); ctx.lineTo(x + e / 2, r.y + r.h); ctx.stroke(); ctx.strokeStyle = CORAL; ctx.lineWidth = e * 0.78; ctx.stroke(); ctx.setLineDash([e * 0.45, e * 0.45]); ctx.strokeStyle = '#fff2dc'; ctx.lineWidth = e * 0.78; ctx.stroke(); ctx.restore(); }
}
export function hamGround(ctx, S) {
  const r = S.rect, c = S.cell, m = S.bg, p = c / 5, t = Math.max(1.6, p * 0.5);
  ctx.fillStyle = shade(m, -0.62); ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  const pass = (lw, col, off) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); for (let x = r.x + p * 0.5; x < r.x + r.w; x += p) { ctx.moveTo(x + off, r.y); ctx.lineTo(x + off, r.y + r.h); } for (let y = r.y + p * 0.5; y < r.y + r.h; y += p) { ctx.moveTo(r.x, y + off); ctx.lineTo(r.x + r.w, y + off); } ctx.stroke(); };
  pass(t * 1.1, shade(m, -0.5), 0.8); pass(t * 0.78, m, 0); pass(Math.max(0.6, t * 0.2), 'rgba(255,255,255,0.7)', -t * 0.22);
  if (!S.lite) { ctx.fillStyle = shade(m, -0.1); ctx.beginPath(); for (let x = r.x + p * 0.5; x < r.x + r.w; x += p) for (let y = r.y + p * 0.5; y < r.y + r.h; y += p) { ctx.moveTo(x + t * 0.55, y); ctx.arc(x, y, t * 0.55, 0, TAU); } ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); for (let x = r.x + p * 0.5; x < r.x + r.w; x += p) for (let y = r.y + p * 0.5; y < r.y + r.h; y += p) { ctx.moveTo(x - t * 0.15 + t * 0.2, y - t * 0.2); ctx.arc(x - t * 0.15, y - t * 0.2, t * 0.2, 0, TAU); } ctx.fill(); }
  ctx.restore();
}
export function hamOver(ctx, S) {
  const r = S.rect; const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,255,230,0.18)'); g.addColorStop(0.5, 'rgba(255,255,230,0)'); g.addColorStop(1, 'rgba(0,50,60,0.22)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// BACKSTRAP LOOM: a log-walled highland house; the warp hangs from a timber post by rope loops, shed rod, heddle rod and a slim batten, a woven strap at the foot
// ---------------------------------------------------------------------------------------------------------------------------------------------------
export function strapEnv(ctx, S) {
  const a = S.area, c = S.cell, X0 = a.x - 12, W = a.w + 24, lh = c * 0.95;
  const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#5e4029'); g.addColorStop(1, '#3a2515'); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, a.h);
  for (let y = a.y, j = 0; y < a.y + a.h; y += lh, j++) { // round logs: lit crest, dark joint
    const lg = ctx.createLinearGradient(0, y, 0, y + lh); lg.addColorStop(0, 'rgba(255,220,170,0.2)'); lg.addColorStop(0.35, 'rgba(255,220,170,0.04)'); lg.addColorStop(1, 'rgba(0,0,0,0.45)'); ctx.fillStyle = lg; ctx.fillRect(X0, y, W, lh); ctx.fillStyle = rgba(hash(j, 4) > 0.5 ? '#000' : '#a86a3a', 0.07); ctx.fillRect(X0, y, W, lh);
    ctx.strokeStyle = 'rgba(30,15,5,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 5; k++) { const yy = y + lh * (0.2 + hash(j, k) * 0.6); ctx.moveTo(X0 + hash(j, k, 2) * W, yy); ctx.lineTo(X0 + hash(j, k, 2) * W + c * (1 + hash(j, k, 3) * 2), yy + 1); } ctx.stroke();
  }
  // a narrow window with warm low sun, the light falling in a slanted beam
  const land = a.w > a.h * 1.15, ww = c * 1.6, wh = c * 2.6, wx = land ? a.x + a.w * 0.62 : a.x + a.w * 0.76, wy = a.y + a.h * 0.07;
  const wg = ctx.createLinearGradient(0, wy, 0, wy + wh); wg.addColorStop(0, '#ffe9b0'); wg.addColorStop(1, '#f0a850'); ctx.fillStyle = wg; ctx.fillRect(wx, wy, ww, wh); ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + wh * 0.72); ctx.quadraticCurveTo(wx + ww * 0.3, wy + wh * 0.6, wx + ww * 0.6, wy + wh * 0.74); ctx.quadraticCurveTo(wx + ww * 0.85, wy + wh * 0.66, wx + ww, wy + wh * 0.7); ctx.lineTo(wx + ww, wy + wh); ctx.fill();
  ctx.strokeStyle = '#2a1608'; ctx.lineWidth = Math.max(3, c * 0.12); ctx.strokeRect(wx, wy, ww, wh); ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh * 0.45); ctx.lineTo(wx + ww, wy + wh * 0.45); ctx.stroke();
  ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = '#ffe2a0'; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx + ww, wy + wh); ctx.lineTo(wx - c * 3, a.y + a.h); ctx.lineTo(wx - c * 6, a.y + a.h); ctx.fill(); ctx.restore();
  glow(ctx, wx + ww / 2, wy + wh / 2, Math.max(a.w, a.h) * 0.5, '#ffcf80', 0.3);
  // pegs on the wall with a looped rope and a striped woven strap hung over one
  const px = a.x + a.w * 0.12, py = a.y + a.h * 0.55; rod(ctx, px, py, px + c * 0.5, py, Math.max(4, c * 0.12), '#c9a064');
  for (let k = 0; k < 5; k++) { ctx.fillStyle = ['#a8202a', '#e8c060', '#1f3a6a', '#f1e8d0', '#a8202a'][k]; ctx.fillRect(px + c * 0.18 + (k - 2) * c * 0.04 - c * 0.02, py, c * 0.08, c * (1.1 + k % 2 * 0.1)); }
  const fy = a.y + a.h * 0.93, fg = ctx.createLinearGradient(0, fy, 0, a.y + a.h); fg.addColorStop(0, '#6a655e'); fg.addColorStop(1, '#2e2b27'); ctx.fillStyle = fg; ctx.fillRect(X0, fy, W, a.y + a.h - fy + 12); ctx.fillStyle = 'rgba(255,230,180,0.25)'; ctx.fillRect(X0, fy, W, Math.max(1.4, c * 0.05));
  vignette(ctx, a, 0.4);
}
function strapGeom(S) {
  const { a, r, c, m } = L(S), pw = Math.max(9, c * 0.38), bot = r.y + r.h;
  const top = Math.max(a.y + c * 0.35, r.y - clamp(m.t * 0.95, c * 1.0, c * 1.9)), H = r.y - top;
  const by = bot + Math.max(c * 0.18, 4), sagY = by + clamp(m.b * 0.7, c * 0.35, c * 1.0);
  return { a, r, c, m, pw, top, H, bot, by, sagY, wb: top + H * 0.28, shed: r.y - H * 0.34, hed: r.y - H * 0.58, sword: r.y - H * 0.12 };
}
export function strapUnder(ctx, S) {
  if (S.card || S.lite) return;
  const g = strapGeom(S), { r, c, H, pw, top } = g, cx = r.x + r.w / 2, p = Math.max(2.4, c / 5), cs = S.colors, ex = r.x - c * 0.35, ex2 = r.x + r.w + c * 0.35;
  // the timber post across the top, ends carved round, wrapped with rope
  const tw = Math.max(9, c * 0.4); castShadow(ctx, ex - c * 0.3, top, ex2 + c * 0.3, top, tw, 2, tw * 0.6, 0.35); beam(ctx, ex - c * 0.3, top, ex2 + c * 0.3, top, tw, '#8a5a30', 41);
  ctx.strokeStyle = '#d8b87a'; ctx.lineWidth = Math.max(2, c * 0.07); for (const x of [r.x + r.w * 0.2, r.x + r.w * 0.5, r.x + r.w * 0.8]) { ctx.beginPath(); ctx.moveTo(x - c * 0.1, top - tw * 0.5); ctx.lineTo(x + c * 0.1, top + tw * 0.5); ctx.stroke(); }
  // rope loops tie the far warp bar to the post; the warp runs down from the bar
  for (const x of [r.x + r.w * 0.2, r.x + r.w * 0.5, r.x + r.w * 0.8]) { ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = shade('#d8b87a', -0.4); ctx.lineWidth = Math.max(3, c * 0.1); ctx.beginPath(); ctx.moveTo(x, top + tw * 0.4); ctx.lineTo(x, g.wb); ctx.stroke(); ctx.strokeStyle = '#e6cc92'; ctx.lineWidth = Math.max(2, c * 0.07); ctx.stroke(); ctx.setLineDash([c * 0.06, c * 0.08]); ctx.strokeStyle = 'rgba(80,50,10,0.5)'; ctx.stroke(); ctx.restore(); }
  rod(ctx, ex, g.wb, ex2, g.wb, Math.max(5, c * 0.16), '#c9a064');
  for (let x = r.x + p * 0.5, i = 0; x < r.x + r.w; x += p, i++) thread(ctx, x, g.wb, x, r.y + 2, Math.max(1, p * 0.3), cs[(Math.floor(i / 3)) % cs.length] === '#f1ead6' ? '#f1ead6' : i % 4 === 0 ? cs[2 % cs.length] : '#efe3c2', 0);
  // shed rod, heddle rod with a row of string loops, and the slim sword batten lying across the warp
  const lw = Math.max(1.2, c * 0.04); rod(ctx, ex, g.shed, ex2, g.shed, Math.max(4, c * 0.13), '#a67a48');
  rod(ctx, ex, g.hed, ex2, g.hed, Math.max(4, c * 0.13), '#8a5a30'); ctx.strokeStyle = '#f1e8d0'; ctx.lineWidth = lw; for (let x = r.x + p * 1.5; x < r.x + r.w; x += p * 3.2) { ctx.beginPath(); ctx.moveTo(x - p * 0.35, g.hed); ctx.lineTo(x - p * 0.35, g.hed + c * 0.16); ctx.arc(x, g.hed + c * 0.16, p * 0.35, Math.PI, 0, true); ctx.lineTo(x + p * 0.35, g.hed); ctx.stroke(); }
  const sy = g.sword; castShadow(ctx, ex, sy, ex2, sy + 3, c * 0.2, 1.5, 3, 0.3);
  const sg = ctx.createLinearGradient(0, sy - c * 0.11, 0, sy + c * 0.11); sg.addColorStop(0, '#e8c58a'); sg.addColorStop(1, '#8a5a2a'); ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(ex - c * 0.2, sy + 1); ctx.lineTo(ex + c * 0.2, sy - c * 0.1); ctx.lineTo(ex2 - c * 0.2, sy - c * 0.1 + 3); ctx.lineTo(ex2 + c * 0.2, sy + 4); ctx.lineTo(ex2 - c * 0.2, sy + c * 0.1 + 3); ctx.lineTo(ex + c * 0.2, sy + c * 0.1); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(60,30,5,0.6)'; ctx.lineWidth = 1; ctx.stroke();
  void cx; void H; void pw;
}
export function strapFrame(ctx, S) {
  if (S.card || S.lite) return;
  const g = strapGeom(S), { r, c, by, sagY, pw } = g, ex = r.x - c * 0.35, ex2 = r.x + r.w + c * 0.35, cs = S.colors;
  // the breast bar below the cloth, the woven strap sagging below it, and cords between
  const bw = Math.max(6, c * 0.2); castShadow(ctx, ex, by, ex2, by, bw, 1.5, bw * 0.6, 0.35); beam(ctx, ex - c * 0.1, by, ex2 + c * 0.1, by, bw, '#a8723c', 43);
  const sw = Math.max(10, c * 0.44);
  ctx.save(); ctx.lineCap = 'butt'; const path = () => { ctx.beginPath(); ctx.moveTo(ex - c * 0.05, by + bw); ctx.bezierCurveTo(r.x + r.w * 0.2, sagY + c * 0.35, r.x + r.w * 0.8, sagY + c * 0.35, ex2 + c * 0.05, by + bw); };
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = sw + 3; ctx.save(); ctx.translate(2, 3); path(); ctx.stroke(); ctx.restore();
  path(); ctx.strokeStyle = '#2a1608'; ctx.lineWidth = sw; ctx.stroke(); path(); ctx.strokeStyle = cs[0]; ctx.lineWidth = sw * 0.84; ctx.stroke();
  ctx.setLineDash([sw * 0.5, sw * 0.5]); path(); ctx.strokeStyle = cs[1 % cs.length]; ctx.lineWidth = sw * 0.84; ctx.stroke(); ctx.setLineDash([sw * 0.5, sw * 0.5]); ctx.lineDashOffset = -sw * 0.25; path(); ctx.strokeStyle = cs[2 % cs.length]; ctx.lineWidth = sw * 0.3; ctx.stroke(); ctx.lineDashOffset = 0; ctx.setLineDash([]); path(); ctx.strokeStyle = '#f1e8d0'; ctx.lineWidth = sw * 0.12; ctx.stroke(); path(); ctx.strokeStyle = shade(cs[0], 0.1); ctx.lineWidth = sw * 0.12; ctx.save(); ctx.translate(0, sw * 0.33); ctx.stroke(); ctx.translate(0, -sw * 0.66); ctx.stroke(); ctx.restore();
  path(); ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = Math.max(1, sw * 0.12); ctx.translate(0, -sw * 0.32); ctx.stroke(); ctx.restore();
  for (const x of [ex + c * 0.1, ex2 - c * 0.1]) { ctx.strokeStyle = '#e6cc92'; ctx.lineWidth = Math.max(2, c * 0.07); ctx.beginPath(); ctx.moveTo(x, by + bw * 0.3); ctx.lineTo(x + (x < r.x + r.w / 2 ? 2 : -2), by + bw * 1.5); ctx.stroke(); }
  void pw;
}
export function strapGround(ctx, S) {
  const r = S.rect, c = S.cell, m = S.bg, p = Math.max(1.8, c / 9), cs = S.colors;
  ctx.fillStyle = shade(m, -0.4); ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  for (let x = r.x, i = 0; x < r.x + r.w; x += p, i++) { const w = Math.floor(r.w / p), edge = i < 3 || i >= w - 3, pin = i % 14 === 6 || i % 14 === 7; ctx.fillStyle = edge ? shade(cs[1 % cs.length], -0.1) : pin ? shade(cs[1 % cs.length], 0.05) : shade(m, -0.22 + (hash(i, 7) - 0.5) * 0.1); ctx.fillRect(x, r.y, p * 0.88, r.h); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x, r.y, Math.max(0.7, p * 0.2), r.h); }
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,225,170,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0.25)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// SEED-TREADLE LOOM (Shan hills): a heavy ground-level loom in a bamboo-and-teak house; cotton bobbins on the two posts, treadles hung with strings of big seeds
// ---------------------------------------------------------------------------------------------------------------------------------------------------
Object.assign(POT, {
  // a bamboo bobbin wound with soft hand-spun cotton, matte and slightly fuzzy
  cottonbobbin(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#2a2410', 0.55);
    ctx.save(); ctx.translate(cx, cy + lift); ctx.rotate(0.35); softE(ctx, r * 0.1, r * 0.8, r * 0.7, r * 0.1);
    rod(ctx, 0, -r * 0.82, 0, r * 0.82, r * 0.16, '#cfae62');
    const g = ctx.createLinearGradient(-r * 0.42, 0, r * 0.42, 0); g.addColorStop(0, shade(col, 0.3)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -0.5)); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-r * 0.2, -r * 0.5); ctx.quadraticCurveTo(-r * 0.5, 0, -r * 0.2, r * 0.5); ctx.lineTo(r * 0.2, r * 0.5); ctx.quadraticCurveTo(r * 0.5, 0, r * 0.2, -r * 0.5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(shade(col, -0.5), 0.45); ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 11; k++) { const y = -r * 0.46 + k * r * 0.092; ctx.moveTo(-r * 0.42, y); ctx.lineTo(r * 0.42, y + 2); } ctx.stroke();
    ctx.restore(); ring(ctx, S, b, on);
  },
});
Object.assign(TOOLS, {
  // a boat-shaped bamboo shuttle with a bobbin of cotton showing in its belly
  bamboopirn(ctx, S, T) {
    const u = T.u, p = pressOf(T), Lg = u * 2.9, H = u * 0.42, lift = p * u * 0.08;
    softE(ctx, T.x + Lg * 0.5 + 3, T.y + u * 0.14, Lg * 0.5, H * 0.45);
    ctx.save(); ctx.translate(T.x + Lg * 0.5, T.y - H * 0.3 - lift); ctx.rotate(-0.05);
    const g = ctx.createLinearGradient(0, -H, 0, H); g.addColorStop(0, '#e9d28a'); g.addColorStop(0.5, '#b8963e'); g.addColorStop(1, '#5a4414'); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-Lg / 2, 0); ctx.quadraticCurveTo(-Lg * 0.2, -H * 1.05, Lg / 2, 0); ctx.quadraticCurveTo(-Lg * 0.2, H * 1.05, -Lg / 2, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(60,40,5,0.55)'; ctx.lineWidth = 1; ctx.beginPath(); for (const k of [-0.28, 0.05, 0.34]) { ctx.moveTo(Lg * k, -H * 0.8); ctx.lineTo(Lg * k, H * 0.8); } ctx.stroke();
    ctx.fillStyle = T.col; ctx.beginPath(); ctx.ellipse(-Lg * 0.04, 0, Lg * 0.2, H * 0.36, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-Lg * 0.2, -H * 0.3, Lg * 0.3, H * 0.1);
    ctx.restore();
    sheenLine(ctx, [[T.x, T.y - H * 0.3], [T.x - u * 0.7, T.y - H * 0.2 + Math.sin(T.t * 3) * u * 0.05], [T.x - u * 1.4, T.y + u * 0.05]], Math.max(1.4, u * 0.06), T.col);
  },
});
// plain cotton, hand-spun: a real over-under weave of fine threads with the odd slub, light along one edge
export function cottonSkin(ctx, d) {
  const { kind, col, x, y, s, key } = d, fill = isFilled(kind), h = s / 2, n = 12, p = s / n, lw = lineWidthOf(kind, s);
  if (!fill) {
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = lw * 0.9 + 2; ctx.stroke(); ctx.strokeStyle = shade(col, -0.4); ctx.lineWidth = lw * 0.9; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw * 0.62; ctx.stroke();
    ctx.setLineDash([lw * 0.18, lw * 0.22]); ctx.strokeStyle = rgba(shade(col, -0.5), 0.5); ctx.lineWidth = lw * 0.62; ctx.stroke(); ctx.setLineDash([]); ctx.restore(); return;
  }
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.fillStyle = shade(col, -0.5); ctx.fill(); ctx.clip();
  ctx.fillStyle = col; ctx.fillRect(x - h - 1, y - h - 1, s + 2, s + 2);
  const x0 = x - h, y0 = y - h;
  for (let par = 0; par < 2; par++) { // weft threads (horizontal), dashes alternate so each passes over and under the warp
    ctx.beginPath(); for (let j = par; j <= n; j += 2) { ctx.moveTo(x0, y0 + (j + 0.5) * p); ctx.lineTo(x0 + s, y0 + (j + 0.5) * p); }
    ctx.setLineDash([p, p]); ctx.lineDashOffset = par ? 0 : p; ctx.strokeStyle = shade(col, 0.2); ctx.lineWidth = p * 0.78; ctx.stroke(); ctx.lineDashOffset = par ? 0 : p; ctx.strokeStyle = rgba(shade(col, 0.6), 0.45); ctx.lineWidth = Math.max(0.7, p * 0.2); ctx.save(); ctx.translate(0, -p * 0.2); ctx.stroke(); ctx.restore();
  }
  for (let par = 0; par < 2; par++) { // warp threads (vertical)
    ctx.beginPath(); for (let k = par; k <= n; k += 2) { ctx.moveTo(x0 + (k + 0.5) * p, y0); ctx.lineTo(x0 + (k + 0.5) * p, y0 + s); }
    ctx.setLineDash([p, p]); ctx.lineDashOffset = par ? p : 0; ctx.strokeStyle = shade(col, -0.18); ctx.lineWidth = p * 0.74; ctx.stroke(); ctx.lineDashOffset = par ? p : 0; ctx.strokeStyle = rgba(shade(col, -0.6), 0.4); ctx.lineWidth = Math.max(0.7, p * 0.16); ctx.save(); ctx.translate(p * 0.28, 0); ctx.stroke(); ctx.restore();
  }
  ctx.setLineDash([]);
  ctx.strokeStyle = rgba(shade(col, 0.55), 0.7); ctx.lineWidth = Math.max(1, p * 0.34); ctx.lineCap = 'round'; ctx.beginPath(); for (let k = 0; k < 5; k++) { const sx = x0 + hash(key, k) * s, sy = y0 + hash(key, k, 2) * s; ctx.moveTo(sx, sy); ctx.lineTo(sx + p * (0.8 + hash(key, k, 3)), sy + p * 0.05); } ctx.stroke(); // slubs
  const og = ctx.createRadialGradient(x - s * 0.2, y - s * 0.25, s * 0.06, x, y, s * 0.68); og.addColorStop(0, 'rgba(255,248,225,0.14)'); og.addColorStop(1, 'rgba(10,5,0,0.32)'); ctx.fillStyle = og; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  ctx.restore();
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(shade(col, -0.7), 0.6); ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke(); ctx.restore();
}
export function seedEnv(ctx, S) {
  const a = S.area, c = S.cell, X0 = a.x - 12, W = a.w + 24;
  // woven bamboo wall (herringbone mat) in forest light, teak floor boards
  const wg = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); wg.addColorStop(0, '#d8c47a'); wg.addColorStop(1, '#a98f48'); ctx.fillStyle = wg; ctx.fillRect(X0, a.y, W, a.h);
  const sz = c * 0.62; ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, a.h * 0.9); ctx.clip();
  for (let j = 0; j * sz < a.h * 0.9; j++) for (let i = 0; i * sz < W; i++) { const up = (i + j) % 2, t = hash(i, j, 9); ctx.fillStyle = rgba(up ? '#fff3b8' : '#4a3a10', 0.06 + t * 0.1); ctx.save(); ctx.translate(X0 + i * sz, a.y + j * sz); ctx.beginPath(); if (up) { ctx.moveTo(0, sz); ctx.lineTo(sz, 0); ctx.lineTo(sz, sz * 0.5); ctx.lineTo(sz * 0.5, sz); } else { ctx.moveTo(0, 0); ctx.lineTo(sz, sz); ctx.lineTo(sz * 0.5, sz); ctx.lineTo(0, sz * 0.5); } ctx.closePath(); ctx.fill(); ctx.restore(); }
  ctx.strokeStyle = 'rgba(70,50,10,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); for (let j = 0; j * sz < a.h; j++) { ctx.moveTo(X0, a.y + j * sz); ctx.lineTo(X0 + W, a.y + j * sz); } for (let i = 0; i * sz < W; i++) { ctx.moveTo(X0 + i * sz, a.y); ctx.lineTo(X0 + i * sz, a.y + a.h); } ctx.stroke(); ctx.restore();
  // slanted bars of forest sun through the eaves, green-tinged
  ctx.save(); ctx.globalAlpha = 0.14; ctx.fillStyle = '#f4ffb8'; for (let k = 0; k < 4; k++) { const x = a.x + a.w * (-0.1 + k * 0.3); ctx.beginPath(); ctx.moveTo(x, a.y); ctx.lineTo(x + c * 1.2, a.y); ctx.lineTo(x + c * 4.2, a.y + a.h); ctx.lineTo(x + c * 3, a.y + a.h); ctx.fill(); } ctx.restore();
  const fy = a.y + a.h * 0.9, fg = ctx.createLinearGradient(0, fy, 0, a.y + a.h); fg.addColorStop(0, '#6a4524'); fg.addColorStop(1, '#2e1c0e'); ctx.fillStyle = fg; ctx.fillRect(X0, fy, W, a.y + a.h - fy + 12);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.4; ctx.beginPath(); for (let x = X0; x < X0 + W; x += c * 1.3) { ctx.moveTo(x, fy); ctx.lineTo(x - c * 0.4, a.y + a.h); } ctx.stroke(); ctx.fillStyle = 'rgba(255,220,160,0.35)'; ctx.fillRect(X0, fy, W, Math.max(1.4, c * 0.05));
  glow(ctx, a.x + a.w * 0.15, a.y, Math.max(a.w, a.h) * 0.7, '#e8ffc0', 0.3); vignette(ctx, a, 0.38);
}
function seedGeom(S) {
  const { a, r, c, m } = L(S), pw = Math.max(10, c * 0.44), bot = r.y + r.h;
  const lx = Math.max(a.x + pw * 0.6, r.x - clamp(m.l * 0.55, c * 0.6, c * 1.0)), rx = Math.min(a.x + a.w - pw * 0.6, r.x + r.w + clamp(m.r * 0.55, c * 0.6, c * 1.0));
  const ty = Math.max(a.y + c * 0.3, r.y - clamp(m.t * 0.8, c * 0.55, c * 1.3)), by = bot + Math.max(c * 0.16, 3), ey = Math.max(by + c * 0.5, Math.min(a.y + a.h - c * 0.3, by + c * 1.7));
  return { a, r, c, m, pw, lx, rx, ty, by, ey, bot };
}
function seedStr(ctx, x, y1, y2, c, n, seed) { // a string of big flat seeds, glossy mahogany, each pierced and threaded
  ctx.strokeStyle = '#e8dcc0'; ctx.lineWidth = Math.max(1.2, c * 0.04); ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
  const sh = (y2 - y1) / n;
  for (let k = 0; k < n; k++) { const y = y1 + (k + 0.5) * sh, rx2 = Math.min(c * 0.2, sh * 0.62), ry = Math.min(c * 0.26, sh * 0.5) * (0.9 + hash(k, seed) * 0.2), a0 = (hash(k, seed, 2) - 0.5) * 0.5;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a0); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(rx2 * 0.2, ry * 0.2, rx2, ry, 0, 0, TAU); ctx.fill();
    const g = ctx.createRadialGradient(-rx2 * 0.35, -ry * 0.35, rx2 * 0.1, 0, 0, ry * 1.1); g.addColorStop(0, '#d98a5a'); g.addColorStop(0.45, '#7a2e1a'); g.addColorStop(1, '#2a0e08'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, rx2, ry, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,150,0.55)'; ctx.lineWidth = Math.max(0.8, rx2 * 0.12); ctx.beginPath(); ctx.ellipse(0, 0, rx2 * 0.7, ry * 0.75, 0, 3.6, 5.0); ctx.stroke(); ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.arc(0, 0, rx2 * 0.14, 0, TAU); ctx.fill(); ctx.restore(); }
}
export function seedUnder(ctx, S) {
  if (S.card || S.lite) return;
  const g = seedGeom(S), { r, c, pw, lx, rx, ty } = g, a = g.a, p = Math.max(2.4, c / 4.6);
  for (const x of [lx, rx]) { castShadow(ctx, x, a.y, x, a.y + a.h, pw, pw * 0.9, pw * 0.2, 0.32); beam(ctx, x, a.y, x, a.y + a.h, pw, '#7a4a26', Math.floor(x)); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x - pw * 0.05, a.y, pw * 0.5, a.h);
    // bobbins hung on pegs round the post
    for (let k = 0; k < 4; k++) { const yy = ty + c * 0.6 + k * Math.max(c * 0.9, (g.by - ty - c) / 4), dir = x < r.x ? -1 : 1; if (yy > g.by) break; const bxx = x + dir * pw * 0.5, col = S.colors[(k + (x < r.x ? 0 : 2)) % S.colors.length];
      rod(ctx, x, yy, bxx + dir * pw * 0.3, yy, Math.max(3, pw * 0.14), '#c9a064'); const bw = Math.min(c * 0.24, pw * 0.5), bh = c * 0.42, gg = ctx.createLinearGradient(bxx - bw, 0, bxx + bw, 0); gg.addColorStop(0, shade(col, 0.3)); gg.addColorStop(0.5, col); gg.addColorStop(1, shade(col, -0.5)); ctx.fillStyle = gg; roundRectPath(ctx, bxx + dir * pw * 0.3 - bw, yy, bw * 2, bh, bw * 0.6); ctx.fill(); ctx.strokeStyle = rgba(shade(col, -0.5), 0.4); ctx.lineWidth = 1; ctx.beginPath(); for (let q = 1; q < 6; q++) { ctx.moveTo(bxx + dir * pw * 0.3 - bw, yy + bh * q / 6); ctx.lineTo(bxx + dir * pw * 0.3 + bw, yy + bh * q / 6); } ctx.stroke(); }
  }
  for (let x = r.x + p * 0.5, i = 0; x < r.x + r.w; x += p, i++) thread(ctx, x, ty + c * 0.1, x, r.y + 2, Math.max(1, p * 0.3), i % 9 === 4 ? '#243a6e' : '#efe6cf', 0);
  const bw2 = Math.max(10, c * 0.38); castShadow(ctx, lx, ty, rx, ty, bw2, 2, bw2 * 0.6, 0.35); beam(ctx, lx - pw * 0.4, ty, rx + pw * 0.4, ty, bw2, '#8a5a30', 61);
  ctx.fillStyle = '#efe6cf'; for (let x = r.x; x < r.x + r.w; x += p * 1.5) ctx.fillRect(x, ty - bw2 * 0.3, Math.max(1, p * 0.6), bw2 * 0.7);
}
export function seedFrame(ctx, S) {
  if (S.card || S.lite) return;
  const g = seedGeom(S), { r, c, lx, rx, by, ey, pw } = g, bw = Math.max(8, c * 0.3);
  castShadow(ctx, lx, by, rx, by, bw, 2, bw * 0.6, 0.35); beam(ctx, lx - pw * 0.4, by, rx + pw * 0.4, by, bw, '#9a6a3a', 63);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x - 1, by - bw * 0.5, r.w + 2, bw); ctx.clip(); const cg = ctx.createLinearGradient(0, by - bw * 0.5, 0, by + bw * 0.5); cg.addColorStop(0, '#fbf3dc'); cg.addColorStop(1, '#a89c78'); ctx.fillStyle = cg; ctx.fillRect(r.x - 1, by - bw * 0.5, r.w + 2, bw); ctx.fillStyle = '#243a6e'; for (let x = r.x + c * 0.3; x < r.x + r.w; x += c * 1.4) ctx.fillRect(x, by - bw * 0.5, c * 0.14, bw); ctx.restore();
  // two treadle bars under the loom, each hung from the beam by a string of seeds; the seeds are what the toes pass between
  const n = Math.max(2, Math.floor((ey - by - bw * 0.3) / (c * 0.5)));
  for (const [x, s] of [[r.x + r.w * 0.28, 1], [r.x + r.w * 0.72, 2]]) { rod(ctx, x - c * 0.6, ey + c * 0.05, x + c * 0.6, ey + c * 0.05, Math.max(5, c * 0.2), '#c9a064'); seedStr(ctx, x - c * 0.3, by + bw * 0.4, ey, c, n, s); seedStr(ctx, x + c * 0.3, by + bw * 0.4, ey, c, n, s + 5); }
}
export function seedGround(ctx, S) {
  const r = S.rect, c = S.cell, m = S.bg, p = Math.max(1.8, c / 10);
  ctx.fillStyle = shade(m, -0.1); ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  for (let y = r.y, j = 0; y < r.y + r.h; y += p, j++) { ctx.fillStyle = rgba(j % 2 ? '#fff' : '#3a2a10', 0.07); ctx.fillRect(r.x, y, r.w, p * 0.55); }
  for (let x = r.x + p * 0.5, i = 0; x < r.x + r.w; x += p, i++) { ctx.fillStyle = rgba(i % 2 ? '#fff' : '#3a2a10', 0.05); ctx.fillRect(x, r.y, p * 0.5, r.h); }
  // loom-woven cotton: faint stripes across the strip
  for (const [t, col, a2] of [[0.1, '#243a6e', 0.18], [0.14, '#243a6e', 0.12], [0.5, '#a8352a', 0.1], [0.86, '#243a6e', 0.12], [0.9, '#243a6e', 0.18]]) { ctx.fillStyle = rgba(col, a2); ctx.fillRect(r.x, r.y + r.h * t, r.w, Math.max(2, c * 0.08)); }
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,250,220,0.2)'); g.addColorStop(1, 'rgba(60,30,0,0.22)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.restore();
}

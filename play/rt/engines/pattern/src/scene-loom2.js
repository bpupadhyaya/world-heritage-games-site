// Scene art, 1.12.0 (looms and bands), part 2: tablet weaving, inkle loom, pit loom, drawloom, peg loom. Pure canvas 2D, no Math.random.
import { hash, rgba, mix, shade, roundRectPath, rod, ball, speck, lines, glow, vignette, TAU, motifPath, isFilled, lineWidthOf, clamp, sheenLine, poly, POT, ENV } from './scene-kit.js';
import { TOOLS } from './scene-tools.js';
import { beam, castShadow, thread, margins, isLand } from './scene-loom.js';

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// shared bits for supplies and tools
// ---------------------------------------------------------------------------------------------------------------------------------------------------
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

Object.assign(POT, {
  // a tablet: a small square card of bone with four holes, each carrying a thread end of the chosen colour
  tabletcard(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0, w = r * 1.28; back(ctx, b, '#1c242c');
    ctx.save(); ctx.translate(cx, cy + lift); ctx.rotate(-0.22);
    softE(ctx, w * 0.12, w * 0.6, w * 0.62, w * 0.1);
    const g = ctx.createLinearGradient(-w / 2, -w / 2, w / 2, w / 2); g.addColorStop(0, '#f7f1e0'); g.addColorStop(1, '#b8a780'); ctx.fillStyle = g; roundRectPath(ctx, -w / 2, -w / 2, w, w, w * 0.12); ctx.fill();
    ctx.strokeStyle = 'rgba(70,50,20,0.55)'; ctx.lineWidth = 1.2; ctx.stroke();
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const hx = sx * w * 0.27, hy = sy * w * 0.27; ctx.fillStyle = '#20140a'; ctx.beginPath(); ctx.arc(hx, hy, w * 0.1, 0, TAU); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, w * 0.07); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + sx * w * 0.2, hy + sy * w * 0.34); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(hx, hy, w * 0.055, 0, TAU); ctx.fill(); }
    ctx.restore(); ring(ctx, S, b, on);
  },
  // a cone of fine wool on a paper tube
  yarncone(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#101c16');
    ctx.save(); ctx.translate(cx, cy + lift);
    softE(ctx, r * 0.1, r * 0.72, r * 0.7, r * 0.12);
    const g = ctx.createLinearGradient(-r * 0.6, 0, r * 0.6, 0); g.addColorStop(0, shade(col, 0.3)); g.addColorStop(0.45, col); g.addColorStop(1, shade(col, -0.5));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-r * 0.22, -r * 0.7); ctx.lineTo(r * 0.22, -r * 0.7); ctx.lineTo(r * 0.64, r * 0.62); ctx.lineTo(-r * 0.64, r * 0.62); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 11; k++) { const t = k / 11, y = -r * 0.66 + t * r * 1.26, w = r * (0.22 + t * 0.42); ctx.moveTo(-w, y); ctx.lineTo(w, y + 2); } ctx.stroke();
    ctx.fillStyle = '#ecdfbd'; roundRectPath(ctx, -r * 0.7, r * 0.6, r * 1.4, r * 0.14, 3); ctx.fill(); ctx.fillStyle = '#d6c79c'; ctx.fillRect(-r * 0.2, -r * 0.78, r * 0.4, r * 0.1);
    ctx.restore(); ring(ctx, S, b, on);
  },
  // a pirn: a small wooden quill wound with weft yarn
  pirn(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#2a1f12', 0.55);
    ctx.save(); ctx.translate(cx, cy + lift); ctx.rotate(-0.6);
    softE(ctx, r * 0.1, r * 0.6, r * 0.9, r * 0.12);
    rod(ctx, -r * 0.82, 0, r * 0.82, 0, r * 0.16, '#d7b877');
    for (let k = 0; k < 12; k++) { const x = -r * 0.5 + k * r * 0.085, h = r * (0.2 + 0.3 * Math.sin((k / 11) * Math.PI)); ctx.fillStyle = k % 2 ? col : shade(col, -0.18); ctx.fillRect(x, -h, r * 0.09, h * 2); }
    const g = ctx.createLinearGradient(0, -r * 0.5, 0, r * 0.5); g.addColorStop(0, 'rgba(255,255,255,0.45)'); g.addColorStop(0.4, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.4)'); ctx.fillStyle = g; ctx.fillRect(-r * 0.5, -r * 0.5, r * 1.0, r * 1.0);
    ctx.restore(); ring(ctx, S, b, on);
  },
  // a reel of reeled silk, glossy, on a lacquered bobbin
  silkreel(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#1e0a0a', 0.6);
    ctx.save(); ctx.translate(cx, cy + lift);
    softE(ctx, r * 0.1, r * 0.78, r * 0.55, r * 0.1);
    ctx.fillStyle = '#7a1414'; roundRectPath(ctx, -r * 0.58, -r * 0.8, r * 1.16, r * 0.14, 3); ctx.fill(); roundRectPath(ctx, -r * 0.58, r * 0.66, r * 1.16, r * 0.14, 3); ctx.fill();
    ctx.fillStyle = '#d9b24a'; ctx.fillRect(-r * 0.58, -r * 0.74, r * 1.16, r * 0.03); ctx.fillRect(-r * 0.58, r * 0.66, r * 1.16, r * 0.03);
    for (let k = 0; k < 14; k++) { const y = -r * 0.66 + k * r * 0.095; ctx.fillStyle = k % 2 ? shade(col, 0.12) : shade(col, -0.12); ctx.fillRect(-r * 0.46, y, r * 0.92, r * 0.1); }
    const g = ctx.createLinearGradient(-r * 0.46, 0, r * 0.46, 0); g.addColorStop(0, 'rgba(255,255,255,0.1)'); g.addColorStop(0.28, 'rgba(255,255,255,0.65)'); g.addColorStop(0.4, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.45)'); ctx.fillStyle = g; ctx.fillRect(-r * 0.46, -r * 0.66, r * 0.92, r * 1.32);
    ctx.restore(); ring(ctx, S, b, on);
  },
  // a rolled strip of old cloth, wound like a roll of ribbon with a frayed end
  ragroll(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#2a3034', 0.45);
    ctx.save(); ctx.translate(cx, cy + lift);
    softE(ctx, r * 0.12, r * 0.62, r * 0.8, r * 0.13);
    const R = r * 0.66; const g = ctx.createRadialGradient(-R * 0.3, -R * 0.35, R * 0.1, 0, 0, R); g.addColorStop(0, shade(col, 0.35)); g.addColorStop(0.6, col); g.addColorStop(1, shade(col, -0.45)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba(shade(col, -0.5), 0.55); ctx.lineWidth = Math.max(1, R * 0.06); for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.arc(0, 0, R * (k / 5), 0.3, 6.0); ctx.stroke(); }
    ctx.strokeStyle = rgba(shade(col, 0.55), 0.5); ctx.lineWidth = Math.max(0.8, R * 0.03); for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.arc(-1, -1, R * (k / 5) + R * 0.05, 3.6, 5.2); ctx.stroke(); }
    ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.arc(0, 0, R * 0.12, 0, TAU); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, R * 0.2); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(R * 0.7, R * 0.6); ctx.quadraticCurveTo(R * 1.1, R * 0.95, R * 1.0, R * 1.2); ctx.stroke();
    ctx.strokeStyle = shade(col, 0.2); ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 5; k++) { ctx.moveTo(R * 1.0 + (k - 2) * 2, R * 1.2); ctx.lineTo(R * 1.0 + (k - 2) * 3.2, R * 1.2 + R * 0.18); } ctx.stroke();
    ctx.restore(); ring(ctx, S, b, on);
  },
});

Object.assign(TOOLS, {
  // a flat bone pick that slides the weft along the shed
  weftpick(ctx, S, T) {
    const u = T.u, p = pressOf(T), lift = (1 - p) * u * 0.3;
    softE(ctx, T.x + u * 0.8, T.y + u * 0.1, u * 1.3, u * 0.09);
    ctx.save(); ctx.translate(T.x, T.y - lift); ctx.rotate(-0.16);
    const g = ctx.createLinearGradient(0, -u * 0.2, 0, u * 0.2); g.addColorStop(0, '#fbf6e6'); g.addColorStop(1, '#b9a57c'); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(u * 0.25, -u * 0.22, u * 0.8, -u * 0.22); ctx.lineTo(u * 2.6, -u * 0.18); ctx.quadraticCurveTo(u * 2.9, 0, u * 2.6, u * 0.18); ctx.lineTo(u * 0.8, u * 0.22); ctx.quadraticCurveTo(u * 0.25, u * 0.22, 0, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(80,55,20,0.6)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#20140a'; ctx.beginPath(); ctx.arc(u * 2.35, 0, u * 0.06, 0, TAU); ctx.fill();
    ctx.strokeStyle = T.col; ctx.lineWidth = Math.max(1.4, u * 0.05); ctx.beginPath(); ctx.moveTo(u * 2.35, 0); ctx.lineTo(u * 1.2, u * 0.08); ctx.stroke();
    ctx.restore();
  },
  // a pegged beater: a short wooden dagger with a bone tip, packing the weft
  inklebeater(ctx, S, T) {
    const u = T.u, p = pressOf(T), lift = (1 - p) * u * 0.35;
    softE(ctx, T.x + u * 0.5, T.y + u * 0.1, u * 1.0, u * 0.08);
    ctx.save(); ctx.translate(T.x, T.y - lift); ctx.rotate(-0.25);
    rod(ctx, 0, 0, u * 2.4, 0, u * 0.26, '#d6b27a'); ctx.fillStyle = '#f1e8d0'; poly(ctx, [[0, -u * 0.11], [-u * 0.34, 0], [0, u * 0.11]]); ctx.fill();
    ctx.strokeStyle = '#7a3c24'; ctx.lineWidth = u * 0.08; ctx.beginPath(); ctx.moveTo(u * 2.0, -u * 0.13); ctx.lineTo(u * 2.0, u * 0.13); ctx.moveTo(u * 2.16, -u * 0.13); ctx.lineTo(u * 2.16, u * 0.13); ctx.stroke();
    ctx.restore();
  },
  // a boat shuttle in dark hardwood with the weft yarn trailing
  pitshuttle(ctx, S, T) {
    const u = T.u, p = pressOf(T), Lg = u * 3.0, H = u * 0.46, lift = p * u * 0.1;
    softE(ctx, T.x + Lg * 0.5 + 3, T.y + u * 0.14, Lg * 0.5, H * 0.45);
    ctx.save(); ctx.translate(T.x + Lg * 0.5, T.y - H * 0.3 - lift); ctx.rotate(-0.06);
    const g = ctx.createLinearGradient(0, -H, 0, H); g.addColorStop(0, '#b8794a'); g.addColorStop(0.5, '#7a4526'); g.addColorStop(1, '#2e1608');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-Lg / 2, 0); ctx.quadraticCurveTo(-Lg * 0.2, -H * 1.1, Lg / 2, 0); ctx.quadraticCurveTo(-Lg * 0.2, H * 1.1, -Lg / 2, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c9a050'; ctx.beginPath(); ctx.arc(Lg / 2 - 3, 0, u * 0.06, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(-Lg / 2 + 3, 0, u * 0.06, 0, TAU); ctx.fill();
    ctx.fillStyle = T.col; ctx.beginPath(); ctx.ellipse(0, 0, Lg * 0.22, H * 0.4, 0, 0, TAU); ctx.fill();
    ctx.restore();
    sheenLine(ctx, [[T.x, T.y - H * 0.3], [T.x - u * 0.7, T.y - H * 0.2 + Math.sin(T.t * 3) * u * 0.05], [T.x - u * 1.4, T.y + u * 0.05]], Math.max(1.4, u * 0.06), T.col);
  },
  // the draw-cord: a silk cord ending in a lacquered handle with a tassel; the tip is the knot
  drawcord(ctx, S, T) {
    const u = T.u, p = pressOf(T), lift = (1 - p) * u * 0.3;
    softE(ctx, T.x + u * 0.2, T.y + u * 0.1, u * 0.5, u * 0.07);
    ctx.save(); ctx.translate(T.x, T.y - lift);
    ctx.strokeStyle = '#a81e1e'; ctx.lineWidth = u * 0.1; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(u * 0.3, -u * 1.1, u * 0.1, -u * 2.2); ctx.stroke();
    ctx.strokeStyle = '#f1c250'; ctx.lineWidth = u * 0.035; ctx.beginPath(); ctx.moveTo(-u * 0.02, -u * 0.1); ctx.quadraticCurveTo(u * 0.28, -u * 1.1, u * 0.08, -u * 2.1); ctx.stroke();
    ball(ctx, 0, 0, u * 0.17, '#e0b040', false);
    for (let k = -3; k <= 3; k++) { ctx.strokeStyle = k % 2 ? '#c42a2a' : '#8a1414'; ctx.lineWidth = u * 0.045; ctx.beginPath(); ctx.moveTo(k * u * 0.03, u * 0.1); ctx.lineTo(k * u * 0.09, u * 0.55); ctx.stroke(); }
    ctx.restore();
  },
  // a rug hook: a long wooden handle with a steel crochet hook that pulls the rag through
  raghook(ctx, S, T) {
    const u = T.u, p = pressOf(T), lift = (1 - p) * u * 0.35;
    softE(ctx, T.x + u * 0.4, T.y + u * 0.1, u * 0.9, u * 0.08);
    ctx.save(); ctx.translate(T.x, T.y - lift); ctx.rotate(0.5);
    rod(ctx, 0, 0, 0, -u * 0.9, u * 0.07, '#c9d0d8'); ctx.strokeStyle = '#c9d0d8'; ctx.lineWidth = u * 0.07; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(u * 0.06, -u * 0.02, u * 0.08, 2.4, 5.2); ctx.stroke();
    rod(ctx, 0, -u * 0.9, 0, -u * 2.9, u * 0.3, '#c0392b'); rod(ctx, 0, -u * 0.95, 0, -u * 1.15, u * 0.34, '#d6dde3');
    ctx.restore();
  },
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// cell skins
// ---------------------------------------------------------------------------------------------------------------------------------------------------
// warp-faced band: dense warp threads run up and down; tablet turns throw them into diagonal twist lines
export function bandSkin(ctx, d, o = {}) {
  const { kind, col, x, y, s, key } = d, fill = isFilled(kind), h = s / 2, n = o.n ?? 9, p = s / n, lw = lineWidthOf(kind, s), twist = o.twist ?? true, dots = o.dots ?? false;
  if (!fill) {
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.38)'; ctx.lineWidth = lw + 2; ctx.stroke(); ctx.strokeStyle = shade(col, -0.35); ctx.lineWidth = lw; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw * 0.7; ctx.stroke();
    ctx.setLineDash([lw * 0.25, lw * 0.3]); ctx.strokeStyle = rgba(shade(col, 0.55), 0.7); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); return;
  }
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.fillStyle = shade(col, -0.45); ctx.fill(); ctx.clip();
  for (let k = 0; k < n; k++) { // one warp thread each: rounded, lit on the left
    const x0 = x - h + (k + 0.5) * p, t = hash(key, k);
    ctx.strokeStyle = shade(col, -0.2 + (t - 0.5) * 0.1); ctx.lineWidth = p * 0.96; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(x0, y - h * 1.05); ctx.lineTo(x0, y + h * 1.05); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = p * 0.66; ctx.beginPath(); ctx.moveTo(x0 - p * 0.06, y - h * 1.05); ctx.lineTo(x0 - p * 0.06, y + h * 1.05); ctx.stroke();
    ctx.strokeStyle = rgba(shade(col, 0.6), 0.65); ctx.lineWidth = Math.max(0.6, p * 0.16); ctx.beginPath(); ctx.moveTo(x0 - p * 0.24, y - h * 1.05); ctx.lineTo(x0 - p * 0.24, y + h * 1.05); ctx.stroke();
  }
  if (twist) { // the twist of the turned cards: short slanted ticks between warp threads
    ctx.strokeStyle = rgba(shade(col, -0.6), 0.55); ctx.lineWidth = Math.max(0.8, p * 0.2); ctx.beginPath();
    for (let j = 0; j < n; j++) for (let k = 0; k < n; k += 2) { const x0 = x - h + (k + (j % 2)) * p, y0 = y - h + (j + 0.5) * p; ctx.moveTo(x0, y0 + p * 0.3); ctx.lineTo(x0 + p * 0.9, y0 - p * 0.3); }
    ctx.stroke(); ctx.strokeStyle = rgba(shade(col, 0.5), 0.35); ctx.beginPath();
    for (let j = 0; j < n; j++) for (let k = 0; k < n; k += 2) { const x0 = x - h + (k + (j % 2)) * p, y0 = y - h + (j + 0.5) * p; ctx.moveTo(x0, y0 + p * 0.3 - 1); ctx.lineTo(x0 + p * 0.9, y0 - p * 0.3 - 1); }
    ctx.stroke();
  }
  if (dots) { // pick-up floats: little raised beads of the pattern thread standing proud of the band
    for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) if ((j + k) % 2 === 0) { const x0 = x - h + (k + 0.5) * p, y0 = y - h + (j + 0.5) * p; ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x0 + 0.6, y0 + p * 0.34, p * 0.42, p * 0.18, 0, 0, TAU); ctx.fill(); ctx.fillStyle = shade(col, 0.22); roundRectPath(ctx, x0 - p * 0.42, y0 - p * 0.2, p * 0.84, p * 0.4, p * 0.2); ctx.fill(); ctx.fillStyle = rgba(shade(col, 0.75), 0.6); ctx.fillRect(x0 - p * 0.3, y0 - p * 0.14, p * 0.5, Math.max(0.8, p * 0.08)); }
  }
  const g = ctx.createLinearGradient(x - h, y, x + h, y); g.addColorStop(0, 'rgba(255,240,210,0.18)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.3)'); ctx.fillStyle = g; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  ctx.restore();
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(shade(col, -0.7), 0.7); ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke(); ctx.restore();
}
// plain-weave strip: a tidy checker of over-under thread squares
export function stripSkin(ctx, d, o = {}) {
  const { kind, col, x, y, s, key } = d, fill = isFilled(kind), h = s / 2, n = o.n ?? 6, p = s / n, lw = lineWidthOf(kind, s);
  if (!fill) {
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = lw + 2; ctx.stroke(); ctx.strokeStyle = shade(col, -0.3); ctx.lineWidth = lw; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw * 0.7; ctx.stroke();
    ctx.setLineDash([lw * 0.5, lw * 0.35]); ctx.strokeStyle = rgba(shade(col, 0.45), 0.6); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); return;
  }
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.fillStyle = shade(col, -0.5); ctx.fill(); ctx.clip();
  for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) { // alternate: warp passes over (vertical bar) or weft passes over (horizontal bar)
    const x0 = x - h + k * p, y0 = y - h + j * p, over = (j + k) % 2 === 0, t = (hash(key, j, k) - 0.5) * 0.1;
    const gg = over ? ctx.createLinearGradient(x0, 0, x0 + p, 0) : ctx.createLinearGradient(0, y0, 0, y0 + p);
    gg.addColorStop(0, shade(col, 0.3 + t)); gg.addColorStop(0.5, shade(col, t)); gg.addColorStop(1, shade(col, -0.4 + t)); ctx.fillStyle = gg;
    if (over) roundRectPath(ctx, x0 + p * 0.1, y0 - p * 0.15, p * 0.8, p * 1.3, p * 0.3); else roundRectPath(ctx, x0 - p * 0.15, y0 + p * 0.1, p * 1.3, p * 0.8, p * 0.3); ctx.fill();
  }
  ctx.restore();
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(shade(col, -0.7), 0.65); ctx.lineWidth = Math.max(1, s * 0.028); ctx.stroke(); ctx.restore();
}
// satin brocade: long glossy floats of silk with a bright sheen band, tiny tie-down dots, gold glints on light colours
export function brocadeSkin(ctx, d, o = {}) {
  const { kind, col, x, y, s, key } = d, fill = isFilled(kind), h = s / 2, n = o.n ?? 12, p = s / n, lw = lineWidthOf(kind, s);
  if (!fill) {
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(30,0,0,0.45)'; ctx.lineWidth = lw + 2; ctx.stroke(); ctx.strokeStyle = shade(col, -0.45); ctx.lineWidth = lw; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw * 0.72; ctx.stroke();
    ctx.setLineDash([lw * 0.3, lw * 0.3]); ctx.strokeStyle = rgba('#ffe8a0', 0.7); ctx.lineWidth = lw * 0.5; ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = rgba(shade(col, 0.7), 0.8); ctx.lineWidth = Math.max(0.8, lw * 0.16); ctx.save(); ctx.translate(-lw * 0.12, -lw * 0.2); ctx.stroke(); ctx.restore(); ctx.restore(); return;
  }
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.fillStyle = shade(col, -0.5); ctx.fill(); ctx.clip();
  for (let j = 0; j <= n; j++) { const yy = y - h + j * p, t = (hash(key, j) - 0.5) * 0.12; ctx.fillStyle = shade(col, t - 0.02); ctx.fillRect(x - h - 2, yy, s + 4, p * 0.9); ctx.fillStyle = rgba(shade(col, 0.5), 0.35); ctx.fillRect(x - h - 2, yy, s + 4, p * 0.22); ctx.fillStyle = rgba(shade(col, -0.6), 0.3); ctx.fillRect(x - h - 2, yy + p * 0.78, s + 4, p * 0.12); }
  ctx.fillStyle = rgba(shade(col, -0.65), 0.55); for (let j = 0; j < n; j++) for (let k = 0; k < n; k += 3) ctx.fillRect(x - h + (k + (j % 3)) * p, y - h + j * p + p * 0.38, Math.max(1, p * 0.2), Math.max(1, p * 0.2));
  const sg = ctx.createLinearGradient(x - h, y - h, x + h, y + h); sg.addColorStop(0.2, 'rgba(255,255,250,0)'); sg.addColorStop(0.42, 'rgba(255,255,250,0.5)'); sg.addColorStop(0.58, 'rgba(255,255,250,0)'); ctx.fillStyle = sg; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  const og = ctx.createRadialGradient(x - s * 0.2, y - s * 0.25, s * 0.08, x, y, s * 0.66); og.addColorStop(0, 'rgba(255,240,220,0.12)'); og.addColorStop(1, 'rgba(20,0,0,0.38)'); ctx.fillStyle = og; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  ctx.restore();
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba('#e8c060', 0.85); ctx.lineWidth = Math.max(1.2, s * 0.04); ctx.stroke(); ctx.strokeStyle = rgba(shade(col, -0.7), 0.7); ctx.lineWidth = Math.max(0.8, s * 0.014); ctx.stroke(); ctx.restore();
}
// rag-rug loops: thick rolled strips of cloth, packed row on row, ends frayed
export function ragSkin(ctx, d, o = {}) {
  const { kind, col, x, y, s, key } = d, fill = isFilled(kind), h = s / 2, n = o.n ?? 5, p = s / n, lw = lineWidthOf(kind, s);
  if (!fill) {
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = lw * 1.5 + 2; ctx.stroke(); ctx.strokeStyle = shade(col, -0.4); ctx.lineWidth = lw * 1.5; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw * 1.05; ctx.stroke();
    ctx.setLineDash([lw * 0.9, lw * 0.5]); ctx.strokeStyle = rgba(shade(col, -0.35), 0.5); ctx.lineWidth = lw * 1.05; ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = rgba(shade(col, 0.6), 0.55); ctx.lineWidth = Math.max(1, lw * 0.22); ctx.save(); ctx.translate(-lw * 0.2, -lw * 0.32); ctx.stroke(); ctx.restore(); ctx.restore(); return;
  }
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.fillStyle = shade(col, -0.55); ctx.fill(); ctx.clip();
  for (let j = 0; j < n; j++) { // each row is one thick rag, slightly wavy, with a fold highlight and a shaded lower edge
    const yy = y - h + (j + 0.5) * p, wob = (hash(key, j) - 0.5) * p * 0.2;
    const gg = ctx.createLinearGradient(0, yy - p * 0.55, 0, yy + p * 0.55); gg.addColorStop(0, shade(col, 0.32)); gg.addColorStop(0.45, shade(col, (hash(key, j, 2) - 0.5) * 0.12)); gg.addColorStop(1, shade(col, -0.42)); ctx.fillStyle = gg;
    ctx.beginPath(); ctx.moveTo(x - h - 3, yy - p * 0.5 + wob); for (let k = 0; k <= 8; k++) ctx.lineTo(x - h + (k / 8) * (s + 6) - 3, yy - p * 0.5 + wob + Math.sin(k + j * 1.7) * p * 0.05); for (let k = 8; k >= 0; k--) ctx.lineTo(x - h + (k / 8) * (s + 6) - 3, yy + p * 0.5 + wob + Math.sin(k * 1.3 + j) * p * 0.05); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(shade(col, -0.6), 0.45); ctx.lineWidth = Math.max(0.8, p * 0.07); ctx.beginPath(); for (let k = 0; k < 7; k++) { const xx = x - h + hash(key, j, k) * s; ctx.moveTo(xx, yy - p * 0.34); ctx.lineTo(xx + p * 0.3, yy + p * 0.3); } ctx.stroke();
  }
  ctx.restore();
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(shade(col, -0.7), 0.6); ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke(); ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// TABLET WEAVING: a pale ash bench, a row of square cards (one per column of the band) turned in sets, threads fanning to a hook; the band grows below
// ---------------------------------------------------------------------------------------------------------------------------------------------------
export function tabletEnv(ctx, S) {
  const a = S.area, c = S.cell, X0 = a.x - 12, W = a.w + 24;
  ENV.wood(ctx, S, { base: '#cbb48b', plank: c * 2.1, dir: 'h', lampC: '#fff3d6', lx: 0.2, ly: 0.1 });
  const g = ctx.createLinearGradient(X0, a.y, X0 + W, a.y + a.h); g.addColorStop(0, 'rgba(255,248,230,0.16)'); g.addColorStop(0.5, 'rgba(255,248,230,0)'); g.addColorStop(1, 'rgba(30,20,10,0.22)'); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, a.h);
  // a window's light bars falling across the bench
  ctx.save(); ctx.globalAlpha = 0.1; ctx.fillStyle = '#fff'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(a.x + a.w * (0.0 + k * 0.28), a.y); ctx.lineTo(a.x + a.w * (0.1 + k * 0.28), a.y); ctx.lineTo(a.x + a.w * (0.45 + k * 0.28), a.y + a.h); ctx.lineTo(a.x + a.w * (0.33 + k * 0.28), a.y + a.h); ctx.fill(); } ctx.restore();
  if (S.card || S.lite) return;
  const r = S.rect, m = margins(S);
  // a stitched leather belt pad under the band and the iron hook it hangs from
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = c * 0.6; ctx.shadowOffsetY = c * 0.2; ctx.fillStyle = '#6a3a22'; roundRectPath(ctx, r.x - c * 0.5, r.y - c * 0.3, r.w + c, r.h + c * 0.6, c * 0.2); ctx.fill(); ctx.restore();
  ctx.strokeStyle = 'rgba(240,210,160,0.55)'; ctx.setLineDash([c * 0.12, c * 0.1]); ctx.lineWidth = 1.2; roundRectPath(ctx, r.x - c * 0.4, r.y - c * 0.2, r.w + c * 0.8, r.h + c * 0.4, c * 0.15); ctx.stroke(); ctx.setLineDash([]);
  void m;
}
export function tabletGround(ctx, S) {
  const r = S.rect, c = S.cell, m = S.bg, p = Math.max(1.8, c / 9);
  ctx.fillStyle = shade(m, -0.35); ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  for (let x = r.x, i = 0; x < r.x + r.w; x += p, i++) { ctx.fillStyle = shade(m, -0.3 + (hash(i, 3) - 0.5) * 0.12); ctx.fillRect(x, r.y, p * 0.86, r.h); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(x, r.y, Math.max(0.8, p * 0.18), r.h); }
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,255,255,0.16)'); g.addColorStop(1, 'rgba(0,0,0,0.2)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.restore();
}
export function tabletFrame(ctx, S) {
  if (S.card || S.lite) return;
  const { a, r, c, m } = L(S), cols = S.cols, cw = r.w / cols, cols2 = S.colors;
  const top = Math.max(a.y + c * 0.15, r.y - Math.max(c * 1.5, Math.min(m.t, c * 2.2)));
  const hook = { x: r.x + r.w / 2, y: top + c * 0.05 };
  const cardY = r.y - c * 0.42, ch = Math.min(c * 0.9, cw * 1.02);
  // threads from the cards up to the iron hook
  for (let i = 0; i < cols; i++) {
    const cx = r.x + (i + 0.5) * cw, tilt = 0.5 + (hash(i, 2) - 0.5) * 0.25;
    for (let k = 0; k < 4; k++) { const col = cols2[(i + k * 2) % cols2.length], ox = ((k % 2) - 0.5) * cw * 0.5; thread(ctx, cx + ox, cardY - ch * 0.4, hook.x + (cx - hook.x) * 0.06 + (k - 1.5) * 1.2, hook.y + c * 0.18, Math.max(1, c * 0.05), col, 0); }
    void tilt;
  }
  // the cards, each turned by its own quarter: bone squares with four threaded holes
  for (let i = 0; i < cols; i++) {
    const cx = r.x + (i + 0.5) * cw, ang = (hash(i, 7) > 0.5 ? 1 : -1) * 0.38 + (hash(i, 3) - 0.5) * 0.12;
    ctx.save(); ctx.translate(cx, cardY); ctx.rotate(ang);
    softE(ctx, ch * 0.1, ch * 0.62, ch * 0.5, ch * 0.08, 0.3);
    const w = Math.min(ch, cw * 0.88), g = ctx.createLinearGradient(-w / 2, -w / 2, w / 2, w / 2); g.addColorStop(0, '#fbf5e4'); g.addColorStop(0.55, '#d9c9a0'); g.addColorStop(1, '#8f7b52');
    ctx.fillStyle = g; roundRectPath(ctx, -w / 2, -w / 2, w, w, w * 0.1); ctx.fill(); ctx.strokeStyle = 'rgba(60,40,10,0.7)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-w / 2 + 2, -w / 2 + 2, w * 0.6, 1.5);
    for (let k = 0; k < 4; k++) { const hx = (k % 2 ? 1 : -1) * w * 0.27, hy = (k < 2 ? -1 : 1) * w * 0.27, col = cols2[(i + k * 2) % cols2.length]; ctx.fillStyle = '#1c1008'; ctx.beginPath(); ctx.arc(hx, hy, w * 0.1, 0, TAU); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(hx, hy, w * 0.062, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(hx - w * 0.02, hy - w * 0.02, w * 0.02, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  // the far end of the warp: tied to a small pouch of pebbles that gives the tension
  const px = r.x + r.w / 2, bt = r.y + r.h, pr = Math.min(c * 0.45, (r.w / cols) * 0.8, m.b * 0.28), py = bt + Math.max(c * 0.7, m.b * 0.55);
  for (let i = 0; i < cols; i++) { const x = r.x + (i + 0.5) * cw; thread(ctx, x, bt - 1, px + (x - px) * 0.08, py - pr * 0.6, Math.max(1, c * 0.045), cols2[i % cols2.length], 0); }
  softE(ctx, px + pr * 0.25, py + pr * 0.85, pr * 1.0, pr * 0.28, 0.35);
  const pg = ctx.createRadialGradient(px - pr * 0.3, py - pr * 0.2, pr * 0.1, px, py + pr * 0.1, pr * 1.1); pg.addColorStop(0, '#b98a58'); pg.addColorStop(1, '#4a2c14'); ctx.fillStyle = pg; ctx.beginPath(); ctx.moveTo(px - pr * 0.3, py - pr * 0.7); ctx.quadraticCurveTo(px - pr * 1.1, py + pr * 0.2, px - pr * 0.6, py + pr * 0.8); ctx.lineTo(px + pr * 0.6, py + pr * 0.8); ctx.quadraticCurveTo(px + pr * 1.1, py + pr * 0.2, px + pr * 0.3, py - pr * 0.7); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#2a1608'; ctx.lineWidth = Math.max(1.5, pr * 0.1); ctx.beginPath(); ctx.moveTo(px - pr * 0.3, py - pr * 0.62); ctx.lineTo(px + pr * 0.3, py - pr * 0.62); ctx.stroke();
  // the iron hook
  ctx.save(); ctx.strokeStyle = '#2a2a2e'; ctx.lineWidth = Math.max(3, c * 0.12); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hook.x, hook.y - c * 0.25); ctx.lineTo(hook.x, hook.y + c * 0.12); ctx.arc(hook.x + c * 0.14, hook.y + c * 0.12, c * 0.14, Math.PI, Math.PI * 0.2, true); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(hook.x - 1.5, hook.y - c * 0.22); ctx.lineTo(hook.x - 1.5, hook.y + c * 0.1); ctx.stroke(); ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// INKLE LOOM: a small maple frame with pegs, a green parlour wall with a brass lamp; the band grows between the pegs
// ---------------------------------------------------------------------------------------------------------------------------------------------------
export function inkleEnv(ctx, S) {
  const a = S.area, c = S.cell, X0 = a.x - 12, W = a.w + 24;
  const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#1f4a38'); g.addColorStop(1, '#10281e'); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, a.h);
  // wainscot panelling: raised rails and stiles in a deeper green
  ctx.strokeStyle = 'rgba(0,0,0,0.38)'; ctx.lineWidth = 2; for (let x = X0 + c * 2; x < X0 + W; x += c * 5) { ctx.strokeRect(x, a.y + a.h * 0.1, c * 3.6, a.h * 0.8); }
  ctx.strokeStyle = 'rgba(160,230,190,0.07)'; for (let x = X0 + c * 2; x < X0 + W; x += c * 5) { ctx.strokeRect(x + 2, a.y + a.h * 0.1 + 2, c * 3.6, a.h * 0.8); }
  lines(ctx, { x: X0, y: a.y, w: W, h: a.h }, 'v', c * 0.35, '#000', 0.06, 1, 2, 3);
  glow(ctx, a.x + a.w * 0.88, a.y + a.h * 0.05, Math.max(a.w, a.h) * 0.8, '#ffd58a', 0.4);
  const sy = a.y + a.h * 0.9, sg = ctx.createLinearGradient(0, sy, 0, a.y + a.h); sg.addColorStop(0, '#5a3a22'); sg.addColorStop(1, '#2a180c'); ctx.fillStyle = sg; ctx.fillRect(X0, sy, W, a.y + a.h - sy + 12); ctx.fillStyle = 'rgba(255,220,170,0.4)'; ctx.fillRect(X0, sy, W, Math.max(1.4, c * 0.05));
  vignette(ctx, a, 0.4);
}
function inkleGeom(S) {
  const { a, r, c, m, b } = L(S), th = clamp(Math.min(m.l, m.r, m.t, m.b) * 0.34, 6, c * 0.42);
  const ex = isLand(S) ? Math.min(b.w / 2, r.w / 2 + c * 1.9) : b.w / 2, cx = r.x + r.w / 2, fx = Math.max(a.x + 2, b.x, cx - ex), fw = Math.min(a.w - 4, b.w, ex * 2);
  return { fx, fy: Math.max(a.y + 2, b.y), fw, fh: Math.min(a.h - 4, b.h), th, r, c };
}
export function inkleUnder(ctx, S) {
  if (S.card || S.lite) return;
  const g = inkleGeom(S), { fx, fy, fw, fh, c } = g;
  // the frame stands free in front of the wall: a soft shadow of its rails on the panelling behind
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(fx + c * 0.14, fy + c * 0.18, fw, fh); ctx.restore();
  const bg = ctx.createLinearGradient(fx, fy, fx, fy + fh); bg.addColorStop(0, '#133124'); bg.addColorStop(1, '#0a1c14'); ctx.fillStyle = bg; ctx.fillRect(fx, fy, fw, fh);
  ctx.strokeStyle = 'rgba(120,200,160,0.07)'; ctx.lineWidth = 2; for (let x = fx + c * 1.2; x < fx + fw; x += c * 1.8) { ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(x, fy + fh); ctx.stroke(); }
}
export function inkleFrame(ctx, S) {
  if (S.card || S.lite) return;
  const g = inkleGeom(S), { fx, fy, fw, fh, th, r, c } = g, wood = '#e3bb7a';
  // warp loop: threads leave the band's edges and fan out to the pegs on the frame, one set at the top, one below
  const pegs = [[fx + fw * 0.12, fy + th], [fx + fw * 0.88, fy + th], [fx + fw * 0.12, fy + fh - th], [fx + fw * 0.88, fy + fh - th]];
  const cols = S.colors;
  for (let k = 0; k < 7; k++) { const t = (k + 0.5) / 7, x = r.x + t * r.w; for (const [side, py, ey] of [[0, pegs[0][1], r.y + 1], [1, pegs[2][1], r.y + r.h - 1]]) { const px = (k < 3.5 ? pegs[side * 2][0] : pegs[side * 2 + 1][0]); thread(ctx, x, ey, px + (k < 3.5 ? 1 : -1) * (k % 2) * 3, py, Math.max(1.1, c * 0.05), cols[k % cols.length], 0); } }
  // four frame rails with grain and a bright top edge, pegs with turned heads
  beam(ctx, fx, fy + th / 2, fx + fw, fy + th / 2, th, wood, 5); beam(ctx, fx, fy + fh - th / 2, fx + fw, fy + fh - th / 2, th, wood, 6);
  beam(ctx, fx + th / 2, fy, fx + th / 2, fy + fh, th, shade(wood, -0.06), 7); beam(ctx, fx + fw - th / 2, fy, fx + fw - th / 2, fy + fh, th, shade(wood, -0.06), 8);
  for (const [px, py] of pegs) { softE(ctx, px + th * 0.2, py + th * 0.4, th * 0.55, th * 0.3, 0.35); ball(ctx, px, py, th * 0.8, '#f0cd8e', false); ctx.strokeStyle = 'rgba(110,60,20,0.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(px, py, th * 0.5, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(80,40,10,0.45)'; ctx.beginPath(); ctx.arc(px, py, th * 0.18, 0, TAU); ctx.fill(); }
  // the string heddle loops across the top of the band
  ctx.strokeStyle = 'rgba(245,235,205,0.9)'; ctx.lineWidth = 1.2; for (let k = 0; k < 7; k++) { const x = r.x + ((k + 0.5) / 7) * r.w; ctx.beginPath(); ctx.arc(x, r.y - c * 0.14, c * 0.1, 0, TAU); ctx.stroke(); }
}
export function inkleGround(ctx, S) {
  const r = S.rect, c = S.cell, m = S.bg, p = Math.max(1.8, c / 7.5);
  ctx.fillStyle = shade(m, -0.4); ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  for (let x = r.x, i = 0; x < r.x + r.w; x += p, i++) { ctx.fillStyle = shade(m, -0.28 + (hash(i, 9) - 0.5) * 0.1); ctx.fillRect(x, r.y, p * 0.88, r.h); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(x, r.y, Math.max(0.8, p * 0.2), r.h); }
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,240,200,0.2)'); g.addColorStop(1, 'rgba(0,0,0,0.25)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// PIT LOOM (1.13.0 polish): a sunlit courtyard. From the weaver: the cloth, the reed in its batten at the fell, two heddle frames hung on pulleys from a cross
// beam, the warp running on to a driven stake; in front a pit with two treadles whose cords climb to the frames at the sides of the cloth.
// ---------------------------------------------------------------------------------------------------------------------------------------------------
const ADOBE = '#b98652';
export function pitEnv(ctx, S) {
  const a = S.area, c = S.cell, X0 = a.x - 12, W = a.w + 24;
  const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#efd7a0'); g.addColorStop(1, '#cfa86c'); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, a.h);
  speck(ctx, a, 900, ['#a67c44', '#f8e6bc', '#8f6a38'], 0.34, 2, 5);
  // ripples of wind-blown sand
  ctx.strokeStyle = 'rgba(120,80,30,0.16)'; ctx.lineWidth = 1.6; for (let k = 0; k < 18; k++) { const y = a.y + a.h * (0.1 + k * 0.05), x0 = a.x + hash(k, 1) * a.w * 0.6; ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo(x0 + c * 1.6, y - c * 0.14, x0 + c * 3.2, y); ctx.stroke(); }
  // mud-brick compound wall along the back: courses of bricks, a crumbled top, a deep shadow where it meets the sand
  const wh = Math.min(a.h * 0.16, c * 1.5), bh = Math.max(5, c * 0.3), bw = bh * 2.1;
  const wg = ctx.createLinearGradient(0, a.y, 0, a.y + wh); wg.addColorStop(0, '#d29c62'); wg.addColorStop(1, '#a97a48'); ctx.fillStyle = wg; ctx.beginPath(); ctx.moveTo(X0, a.y);
  ctx.lineTo(X0 + W, a.y); ctx.lineTo(X0 + W, a.y + wh); ctx.lineTo(X0, a.y + wh); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, wh); ctx.clip();
  for (let j = 0; j * bh < wh; j++) for (let x = X0 - (j % 2) * bw * 0.5, i = 0; x < X0 + W; x += bw, i++) { const t = hash(i, j, 3); ctx.fillStyle = rgba(t > 0.5 ? '#fff0c8' : '#5a3410', 0.05 + t * 0.08); ctx.fillRect(x + 1, a.y + j * bh + 1, bw - 2, bh - 2); }
  ctx.strokeStyle = 'rgba(70,40,12,0.4)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let j = 1; j * bh < wh; j++) { ctx.moveTo(X0, a.y + j * bh); ctx.lineTo(X0 + W, a.y + j * bh); } ctx.stroke();
  const sg = ctx.createLinearGradient(0, a.y + wh * 0.4, 0, a.y + wh); sg.addColorStop(0, 'rgba(40,20,0,0)'); sg.addColorStop(1, 'rgba(40,20,0,0.5)'); ctx.fillStyle = sg; ctx.fillRect(X0, a.y, W, wh);
  ctx.restore();
  // palm shade: long leaf shadows across the corner
  ctx.save(); ctx.fillStyle = 'rgba(70,40,10,0.24)'; for (let k = 0; k < 10; k++) { const ang = -0.3 + k * 0.1, ox = a.x + a.w * 1.04, oy = a.y - c * 0.5; ctx.save(); ctx.translate(ox, oy); ctx.rotate(Math.PI * 0.5 + ang); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(c * 2.6, -c * 0.8, c * 7.5, 0); ctx.quadraticCurveTo(c * 2.6, c * 0.45, 0, 0); ctx.fill(); ctx.restore(); } ctx.restore();
  glow(ctx, a.x + a.w * 0.2, a.y + a.h * 0.25, a.w * 0.8, '#fff2c8', 0.26);
  vignette(ctx, a, 0.28);
}
function pitGeom(S) {
  const { a, r, c, m } = L(S), p = Math.max(2.6, c / 5);
  const top = Math.max(a.y + c * 0.3, r.y - m.t + c * 0.15), H = Math.max(c * 0.9, r.y - top), pw = Math.max(6, c * 0.26);
  const lx = Math.max(a.x + pw * 0.8, r.x - clamp(m.l * 0.5, c * 0.62, c * 0.95)), rx = Math.min(a.x + a.w - pw * 0.8, r.x + r.w + clamp(m.r * 0.5, c * 0.62, c * 0.95));
  const bot = r.y + r.h, pitY = bot + Math.max(c * 0.42, m.b * 0.2);
  const pitH = clamp(Math.min(m.b * 0.62, a.y + a.h - pitY - c * 0.12), c * 0.7, c * 1.7);
  return { a, r, c, m, p, top, H, pw, lx, rx, bot, pitY, pitH, reedY: r.y, fA: r.y - H * 0.3, fB: r.y - H * 0.5, beamY: r.y - H * 0.7, stakeY: top + c * 0.25 };
}
export function pitUnder(ctx, S) {
  if (S.card || S.lite) return;
  const g = pitGeom(S), { r, c, p, H, pw, lx, rx } = g, sx = r.x + r.w / 2;
  // long shadows of the posts and the stake on the sand, falling right and down
  ctx.save(); ctx.fillStyle = 'rgba(70,40,10,0.2)'; for (const x of [lx, rx]) { ctx.beginPath(); ctx.moveTo(x - pw * 0.4, g.beamY); ctx.lineTo(x + pw * 0.4, g.beamY); ctx.lineTo(x + pw * 0.4 + c * 1.1, g.bot + c * 0.3); ctx.lineTo(x - pw * 0.4 + c * 1.1, g.bot + c * 0.3); ctx.closePath(); ctx.fill(); } ctx.restore();
  // warp beyond the heddles, running to the driven stake with a stone tied to it
  for (let x = r.x + p * 0.5, i = 0; x < r.x + r.w; x += p, i++) thread(ctx, x, r.y + 2, sx + (x - sx) * 0.1, g.stakeY + c * 0.2, Math.max(1.1, p * 0.3), i % 5 === 0 ? '#c0392b' : i % 7 === 3 ? '#27406e' : '#efe3c2', 0);
  // the two forked posts and the cross beam
  for (const x of [lx, rx]) { castShadow(ctx, x, g.beamY - H * 0.12, x, g.bot + c * 0.45, pw, pw * 0.5, pw * 0.2, 0.28); beam(ctx, x, g.beamY - H * 0.12, x, g.bot + c * 0.45, pw, '#8a5a30', Math.floor(x)); ctx.fillStyle = '#5a3a1c'; ctx.beginPath(); ctx.arc(x, g.beamY - H * 0.12, pw * 0.34, 0, TAU); ctx.fill(); }
  const bw = Math.max(5, c * 0.2); castShadow(ctx, lx, g.beamY, rx, g.beamY, bw, 1.5, bw * 0.6, 0.32); beam(ctx, lx - pw * 0.4, g.beamY, rx + pw * 0.4, g.beamY, bw, '#a6713f', 71);
  // pulleys under the beam, a cord over each; the heddle frames hang from the two ends of the cord
  const fh = Math.max(5, H * 0.1), fw = r.w + c * 0.56, fx = r.x - c * 0.28;
  const frame = (y, wood) => {
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(fx + 1.5, y + 2.5, fw, fh);
    ctx.strokeStyle = 'rgba(250,244,222,0.9)'; ctx.lineWidth = Math.max(0.7, p * 0.1); ctx.beginPath(); for (let x = fx + p * 0.6; x < fx + fw; x += p * 1.1) { ctx.moveTo(x, y + fh * 0.15); ctx.lineTo(x, y + fh * 0.95); } ctx.stroke(); ctx.fillStyle = '#7a5a30'; for (let x = fx + p * 0.6; x < fx + fw; x += p * 1.1) ctx.fillRect(x - 0.7, y + fh * 0.5 - 1, 1.6, 2.4);
    beam(ctx, fx, y, fx + fw, y, Math.max(3.5, fh * 0.4), wood, 5); beam(ctx, fx, y + fh, fx + fw, y + fh, Math.max(3.5, fh * 0.4), wood, 6);
    for (const x of [fx, fx + fw]) beam(ctx, x, y, x, y + fh, Math.max(3.5, fh * 0.4), wood, 7);
  };
  const px = [r.x + r.w * 0.3, r.x + r.w * 0.7], rad = Math.max(3, c * 0.13);
  for (const x of px) {
    ctx.strokeStyle = '#efe3c2'; ctx.lineWidth = Math.max(1.2, c * 0.04);
    ctx.beginPath(); ctx.moveTo(x - rad, g.fA); ctx.lineTo(x - rad, g.beamY + rad * 1.4); ctx.moveTo(x + rad, g.fB); ctx.lineTo(x + rad, g.beamY + rad * 1.4); ctx.stroke();
  }
  frame(g.fB, '#7e5430'); frame(g.fA, '#946238');
  for (const x of px) { ctx.fillStyle = '#6a4424'; ctx.beginPath(); ctx.arc(x, g.beamY + rad * 1.4, rad * 1.1, 0, TAU); ctx.fill(); ctx.fillStyle = '#d9b078'; ctx.beginPath(); ctx.arc(x - rad * 0.2, g.beamY + rad * 1.4 - rad * 0.2, rad * 0.75, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a1608'; ctx.beginPath(); ctx.arc(x, g.beamY + rad * 1.4, rad * 0.3, 0, TAU); ctx.fill(); }
  // the stake and its stone
  softE(ctx, sx + c * 0.2, g.stakeY + c * 0.5, c * 0.5, c * 0.14, 0.35); rod(ctx, sx, g.stakeY - c * 0.2, sx, g.stakeY + c * 0.48, Math.max(6, c * 0.26), '#7a4a26'); ball(ctx, sx + c * 0.08, g.stakeY - c * 0.26, Math.max(5, c * 0.2), '#a39888', false);
}
export function pitFrame(ctx, S) {
  if (S.card || S.lite) return;
  const g = pitGeom(S), { r, c, p, pw, lx, rx } = g, bot = g.bot, cx = r.x + r.w / 2;
  // the reed at the fell of the cloth: a batten of two cane bars with the dents between them
  const rh = Math.max(5, c * 0.34), ry = r.y - rh * 1.0, bw = Math.max(2.5, rh * 0.28);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(r.x - c * 0.12 + 1.5, ry + 2.5, r.w + c * 0.24, rh);
  ctx.fillStyle = '#e8d29a'; ctx.fillRect(r.x, ry, r.w, rh); ctx.strokeStyle = 'rgba(70,45,10,0.75)'; ctx.lineWidth = Math.max(0.8, p * 0.12); ctx.beginPath(); for (let x = r.x + p * 0.3; x < r.x + r.w; x += p * 0.55) { ctx.moveTo(x, ry + bw * 0.6); ctx.lineTo(x, ry + rh - bw * 0.6); } ctx.stroke();
  beam(ctx, r.x - c * 0.12, ry + bw / 2, r.x + r.w + c * 0.12, ry + bw / 2, bw, '#c9995a', 11); beam(ctx, r.x - c * 0.12, ry + rh - bw / 2, r.x + r.w + c * 0.12, ry + rh - bw / 2, bw, '#b5834a', 12);
  // the cloth beam below the cloth: finished cloth wound round a rod
  const cy = bot + Math.max(3, c * 0.1), cr = Math.max(4, c * 0.16);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(r.x - c * 0.1 + 1, cy + cr * 0.6, r.w + c * 0.2, cr * 0.9);
  rod(ctx, r.x - c * 0.3, cy, r.x + r.w + c * 0.3, cy, cr * 2.1, '#d6bd86'); ctx.fillStyle = '#f3e8c8'; ctx.fillRect(r.x, cy - cr, r.w, cr * 1.6); ctx.strokeStyle = 'rgba(120,90,40,0.28)'; ctx.lineWidth = 0.8; ctx.beginPath(); for (let x = r.x + p * 0.5; x < r.x + r.w; x += p * 0.9) { ctx.moveTo(x, cy - cr); ctx.lineTo(x, cy + cr * 0.6); } ctx.stroke(); ctx.fillStyle = '#25386a'; ctx.fillRect(r.x, cy - cr, c * 0.12, cr * 1.6); ctx.fillRect(r.x + r.w - c * 0.12, cy - cr, c * 0.12, cr * 1.6);
  const cg = ctx.createLinearGradient(0, cy - cr, 0, cy + cr * 0.7); cg.addColorStop(0, 'rgba(255,255,255,0.35)'); cg.addColorStop(0.5, 'rgba(0,0,0,0)'); cg.addColorStop(1, 'rgba(60,30,0,0.4)'); ctx.fillStyle = cg; ctx.fillRect(r.x, cy - cr, r.w, cr * 1.7);
  // the pit: a rectangular opening in the packed sand, timber-lipped, with the earth wall at the back lit, the floor dark
  const px0 = r.x - c * 0.55, pwid = r.w + c * 1.1, py = g.pitY, ph = g.pitH, lip = Math.max(3, c * 0.12);
  ctx.save(); ctx.shadowColor = 'rgba(80,50,20,0.55)'; ctx.shadowBlur = c * 0.35; ctx.fillStyle = '#6a4424'; roundRectPath(ctx, px0 - lip, py - lip, pwid + lip * 2, ph + lip * 2, c * 0.12); ctx.fill(); ctx.restore();
  const pg = ctx.createLinearGradient(0, py, 0, py + ph); pg.addColorStop(0, '#6e4a2a'); pg.addColorStop(0.2, '#2a190c'); pg.addColorStop(1, '#0d0603'); ctx.fillStyle = pg; roundRectPath(ctx, px0, py, pwid, ph, c * 0.08); ctx.fill();
  ctx.save(); roundRectPath(ctx, px0, py, pwid, ph, c * 0.08); ctx.clip(); ctx.strokeStyle = 'rgba(255,220,150,0.1)'; ctx.lineWidth = 1; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.moveTo(px0, py + ph * (0.06 + 0.03 * k)); ctx.lineTo(px0 + pwid, py + ph * (0.06 + 0.03 * k)); ctx.stroke(); } ctx.restore();
  for (const [t, k] of [[0, 0], [1, 1]]) { // lip planks
    const x = px0 - lip + t * (pwid + lip) - (t ? 0 : 0); void x; void k;
  }
  ctx.strokeStyle = '#d9b078'; ctx.lineWidth = lip * 0.5; roundRectPath(ctx, px0 - lip * 0.5, py - lip * 0.5, pwid + lip, ph + lip, c * 0.1); ctx.stroke();
  ctx.strokeStyle = 'rgba(40,20,5,0.55)'; ctx.lineWidth = 1; for (let x = px0 + c * 0.9; x < px0 + pwid - c * 0.5; x += c * 1.7) { ctx.beginPath(); ctx.moveTo(x, py - lip); ctx.lineTo(x, py); ctx.stroke(); }
  // the treadles: boards hinged on a rod at the back wall, one pressed lower; a foot-worn patch on each; cords to the outer ends
  const hy = py + ph * 0.2; rod(ctx, px0 + c * 0.15, hy, px0 + pwid - c * 0.15, hy, Math.max(3.5, c * 0.12), '#a67a48');
  for (const k of [0, 1]) {
    const w = pwid * 0.3, x0 = px0 + pwid * (k ? 0.58 : 0.12), y0 = hy + c * 0.06, hh = ph * (k ? 0.52 : 0.64), th = Math.max(4, c * 0.2);
    castShadow(ctx, x0 + w * 0.05, y0 + hh + th * 0.4, x0 + w * 0.95, y0 + hh + th * 0.4, th * 0.9, 1, 3, 0.45);
    ctx.save(); const gg = ctx.createLinearGradient(x0, y0, x0 + w, y0 + hh); gg.addColorStop(0, k ? '#d9a468' : '#e1ad70'); gg.addColorStop(1, '#8a5a30'); ctx.fillStyle = gg; roundRectPath(ctx, x0, y0, w, hh, th * 0.35); ctx.fill();
    ctx.strokeStyle = 'rgba(50,25,5,0.5)'; ctx.lineWidth = 1; ctx.stroke(); ctx.strokeStyle = 'rgba(255,235,190,0.55)'; ctx.beginPath(); ctx.moveTo(x0 + th * 0.3, y0 + 2); ctx.lineTo(x0 + w - th * 0.3, y0 + 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,240,200,0.18)'; ctx.beginPath(); ctx.ellipse(x0 + w * 0.5, y0 + hh * 0.62, w * 0.26, hh * 0.22, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(60,30,8,0.4)'; ctx.lineWidth = Math.max(0.8, th * 0.08); ctx.beginPath(); for (let q = 1; q < 4; q++) { ctx.moveTo(x0 + w * q / 4, y0 + hh * 0.08); ctx.lineTo(x0 + w * q / 4, y0 + hh * 0.92); } ctx.stroke(); ctx.restore();
    const ax = k ? x0 + w * 0.9 : x0 + w * 0.1, ay = y0 + hh * 0.9, sx = k ? rx - lx : 0; void sx;
    const ox = k ? r.x + r.w + c * 0.28 : r.x - c * 0.28, topy = k ? g.fB + Math.max(5, g.H * 0.1) : g.fA + Math.max(5, g.H * 0.1);
    ctx.strokeStyle = '#efe3c2'; ctx.lineWidth = Math.max(1.4, c * 0.045); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(ox, ay, ox, py - lip); ctx.lineTo(ox, topy); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#3a2210'; ctx.beginPath(); ctx.arc(ax, ay, Math.max(1.6, c * 0.05), 0, TAU); ctx.fill();
  }
  // a plank to sit on lies across the front lip, with a clay water jar beside it
  void cx; void bot; void lx;
}
export function pitGround(ctx, S) {
  const r = S.rect, c = S.cell, m = S.bg, p = Math.max(2, c / 6);
  ctx.fillStyle = m; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  for (let y = r.y, j = 0; y < r.y + r.h; y += p, j++) for (let x = r.x + ((j % 2) * p) / 2, i = 0; x < r.x + r.w; x += p, i++) { if ((i + j) % 2) continue; ctx.fillStyle = rgba(shade(m, -0.3), 0.2); ctx.fillRect(x, y, p * 0.96, p * 0.5); }
  if (!S.lite) { ctx.fillStyle = 'rgba(255,255,255,0.1)'; for (let x = r.x + p; x < r.x + r.w; x += p * 2) ctx.fillRect(x, r.y, Math.max(0.7, p * 0.14), r.h); }
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,250,220,0.2)'); g.addColorStop(1, 'rgba(70,30,0,0.2)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.restore();
}
// selvedge stripes down both edges of the strip, the reed's shadow at the top and the roll's curve at the bottom
export function pitOver(ctx, S) {
  const r = S.rect, c = S.cell, e = Math.max(3, c * 0.13);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  for (const x of [r.x, r.x + r.w - e * 2.4]) { ctx.fillStyle = '#25386a'; ctx.fillRect(x, r.y, e * 0.9, r.h); ctx.fillStyle = '#f2ead6'; ctx.fillRect(x + e * 0.9, r.y, e * 0.5, r.h); ctx.fillStyle = '#a8452a'; ctx.fillRect(x + e * 1.4, r.y, e * 0.5, r.h); ctx.fillStyle = '#25386a'; ctx.fillRect(x + e * 1.9, r.y, e * 0.5, r.h); }
  const tg = ctx.createLinearGradient(0, r.y, 0, r.y + c * 0.5); tg.addColorStop(0, 'rgba(30,15,0,0.4)'); tg.addColorStop(1, 'rgba(30,15,0,0)'); ctx.fillStyle = tg; ctx.fillRect(r.x, r.y, r.w, c * 0.5);
  const bg = ctx.createLinearGradient(0, r.y + r.h - c * 0.5, 0, r.y + r.h); bg.addColorStop(0, 'rgba(30,15,0,0)'); bg.addColorStop(1, 'rgba(30,15,0,0.3)'); ctx.fillStyle = bg; ctx.fillRect(r.x, r.y + r.h - c * 0.5, r.w, c * 0.5);
  const lg = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); lg.addColorStop(0, 'rgba(255,240,190,0.14)'); lg.addColorStop(0.5, 'rgba(255,240,190,0)'); lg.addColorStop(1, 'rgba(60,20,0,0.18)'); ctx.fillStyle = lg; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// DRAWLOOM: lacquered posts, a harness of cords hanging from the top beam to the pattern threads; a silk workshop with a lattice window
// ---------------------------------------------------------------------------------------------------------------------------------------------------
export function drawEnv(ctx, S) {
  const a = S.area, c = S.cell, X0 = a.x - 12, W = a.w + 24;
  const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#3a0f12'); g.addColorStop(1, '#1c0608'); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, a.h);
  // lattice screen: warm paper panes lit from outside, dark wood mullions
  const sz = c * 1.5; ctx.fillStyle = '#f0cf8e'; ctx.fillRect(X0, a.y, W, a.h * 0.92); glow(ctx, a.x + a.w * 0.5, a.y + a.h * 0.3, Math.max(a.w, a.h) * 0.7, '#fff6d8', 0.5);
  const vg = ctx.createLinearGradient(0, a.y, 0, a.y + a.h * 0.92); vg.addColorStop(0, 'rgba(90,20,10,0.5)'); vg.addColorStop(0.5, 'rgba(90,20,10,0.12)'); vg.addColorStop(1, 'rgba(60,10,6,0.45)'); ctx.fillStyle = vg; ctx.fillRect(X0, a.y, W, a.h * 0.92);
  ctx.strokeStyle = '#3a1208'; ctx.lineWidth = Math.max(3, c * 0.12); for (let y = a.y; y < a.y + a.h * 0.92; y += sz) { ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(X0 + W, y); ctx.stroke(); } for (let x = X0; x < X0 + W; x += sz) { ctx.beginPath(); ctx.moveTo(x, a.y); ctx.lineTo(x, a.y + a.h * 0.92); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,200,120,0.4)'; ctx.lineWidth = 1; for (let y = a.y; y < a.y + a.h * 0.92; y += sz) { ctx.beginPath(); ctx.moveTo(X0, y + 2); ctx.lineTo(X0 + W, y + 2); ctx.stroke(); }
  const sy = a.y + a.h * 0.92, sg = ctx.createLinearGradient(0, sy, 0, a.y + a.h); sg.addColorStop(0, '#2a0c08'); sg.addColorStop(1, '#100404'); ctx.fillStyle = sg; ctx.fillRect(X0, sy, W, a.y + a.h - sy + 12); ctx.fillStyle = 'rgba(255,190,120,0.28)'; ctx.fillRect(X0, sy, W, Math.max(1.4, c * 0.05));
  vignette(ctx, a, 0.45);
  if (S.card) return;
  const r = S.rect, m = margins(S), pw = Math.max(9, c * 0.46), lx = Math.max(a.x + pw * 0.6, r.x - clamp(Math.min(m.l, m.r) * 0.6, pw, c * 1.1)), rx = Math.min(a.x + a.w - pw * 0.6, r.x + r.w + clamp(Math.min(m.l, m.r) * 0.6, pw, c * 1.1));
  for (const x of [lx, rx]) { castShadow(ctx, x, a.y, x, a.y + a.h, pw, pw * 0.6, 0, 0.35); beam(ctx, x, a.y, x, a.y + a.h, pw, '#a8261c', Math.floor(x)); ctx.fillStyle = '#e3b648'; for (const f of [0.2, 0.55, 0.9]) ctx.fillRect(x - pw * 0.5, a.y + a.h * f, pw, Math.max(2, pw * 0.1)); }
}
export function drawUnder(ctx, S) {
  if (S.card || S.lite) return;
  const { a, r, c, m } = L(S), pw = Math.max(9, c * 0.46), lx = Math.max(a.x + pw * 0.6, r.x - clamp(Math.min(m.l, m.r) * 0.6, pw, c * 1.1)), rx = Math.min(a.x + a.w - pw * 0.6, r.x + r.w + clamp(Math.min(m.l, m.r) * 0.6, pw, c * 1.1));
  const ty = Math.max(a.y + c * 0.35, r.y - Math.max(c * 0.9, m.t * 0.8));
  // the top beam and a comb-board that holds the harness cords
  castShadow(ctx, lx, ty, rx, ty, c * 0.4, 2, c * 0.2, 0.4); beam(ctx, lx - pw * 0.5, ty, rx + pw * 0.5, ty, Math.max(8, c * 0.34), '#8a1c14', 31);
  const p = Math.max(2.6, c / 4);
  for (let x = r.x + p * 0.5, i = 0; x < r.x + r.w; x += p, i++) thread(ctx, x, ty + c * 0.1, x, r.y + 3, Math.max(1.1, p * 0.26), i % 4 === 0 ? '#e9c25a' : '#c9392a', 0);
  void m;
}
export function drawFrame(ctx, S) {
  if (S.card || S.lite) return;
  const { a, r, c, m } = L(S), pw = Math.max(9, c * 0.46), lx = Math.max(a.x + pw * 0.6, r.x - clamp(Math.min(m.l, m.r) * 0.6, pw, c * 1.1)), rx = Math.min(a.x + a.w - pw * 0.6, r.x + r.w + clamp(Math.min(m.l, m.r) * 0.6, pw, c * 1.1));
  const ty = Math.max(a.y + c * 0.35, r.y - Math.max(c * 0.9, m.t * 0.8)), p = Math.max(2.6, c / 4), bot = r.y + r.h;
  // harness: lingoes (small weights) on knotted bunches hanging in front of the warp, just above the cloth
  const hy = r.y - Math.min(c * 0.5, m.t * 0.4);
  ctx.fillStyle = '#1c0a06'; roundRectPath(ctx, r.x - c * 0.1, hy - c * 0.1, r.w + c * 0.2, c * 0.2, c * 0.06); ctx.fill(); ctx.strokeStyle = '#e3b648'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = '#e3b648'; for (let x = r.x + p * 1.2; x < r.x + r.w; x += p * 4) { ctx.beginPath(); ctx.arc(x, hy, Math.max(1.4, c * 0.04), 0, TAU); ctx.fill(); }
  // the figure-harness: thick cords gathered in bunches that rise to the beam on the right and hang with tassels beside the right post
  const gx = rx - c * 0.2;
  for (let k = 0; k < 5; k++) { ctx.strokeStyle = k % 2 ? '#c42a2a' : '#e3b648'; ctx.lineWidth = Math.max(1.6, c * 0.06); ctx.beginPath(); ctx.moveTo(r.x + r.w * (0.2 + 0.15 * k), hy); ctx.quadraticCurveTo(r.x + r.w * (0.5 + 0.1 * k), ty + c * 0.4, gx - k * 3, ty + c * 0.5); ctx.stroke(); }
  // lingoes: small brass weights hanging on the harness cords above the cloth, and silk tassels at the right post
  for (let x = r.x + p * 2; x < r.x + r.w; x += p * 4.5) { ctx.strokeStyle = 'rgba(240,210,120,0.9)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(x, hy + c * 0.08); ctx.lineTo(x, r.y - 1); ctx.stroke(); ball(ctx, x, hy + c * 0.12, Math.max(1.8, c * 0.06), '#e0b040', false); }
  for (let k = 0; k < 3; k++) { const tx = rx - c * 0.5 - k * c * 0.34, ty0 = ty + c * 0.4 + k * c * 0.12; ctx.strokeStyle = '#c42a2a'; ctx.lineWidth = Math.max(2, c * 0.07); ctx.beginPath(); ctx.moveTo(tx, ty + c * 0.2); ctx.lineTo(tx, ty0); ctx.stroke(); ball(ctx, tx, ty0 + c * 0.06, c * 0.1, '#e0b040', false); for (let q = -3; q <= 3; q++) { ctx.strokeStyle = q % 2 ? '#d83a3a' : '#8a1414'; ctx.lineWidth = Math.max(1, c * 0.03); ctx.beginPath(); ctx.moveTo(tx + q * c * 0.012, ty0 + c * 0.14); ctx.lineTo(tx + q * c * 0.04, ty0 + c * 0.5); ctx.stroke(); } }
  // breast beam with the cloth roll below the board
  castShadow(ctx, lx, bot + c * 0.2, rx, bot + c * 0.2, c * 0.4, 2, c * 0.2, 0.4);
  beam(ctx, lx - pw * 0.5, bot + c * 0.22, rx + pw * 0.5, bot + c * 0.22, Math.max(8, c * 0.36), '#7a1810', 33);
  // treadle bar and a pair of foot pedals in front
  const pyd = Math.min(a.y + a.h - c * 0.45, bot + c * 0.75 + Math.max(0, m.b * 0.45));
  const sw = Math.max(8, c * 0.3), sty = Math.min(a.y + a.h - sw, pyd + c * 0.42);
  if (sty > pyd + c * 0.2) { // the weaver's bench: a thick plank on two stout legs, a red cushion strip on top
    castShadow(ctx, lx + c * 0.3, sty + sw * 0.6, rx - c * 0.3, sty + sw * 0.6, sw, 2, 4, 0.4); beam(ctx, lx + c * 0.3, sty, rx - c * 0.3, sty, sw, '#7a4a28', 51);
    ctx.fillStyle = '#9a1c1c'; roundRectPath(ctx, lx + c * 0.9, sty - sw * 0.7, rx - lx - c * 1.8, sw * 0.5, sw * 0.2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(lx + c * 1.0, sty - sw * 0.66, rx - lx - c * 2.0, 1.5);
  }
  for (const k of [0, 1]) { const x0 = r.x + r.w * (0.14 + 0.44 * k), pw2 = r.w * 0.34; castShadow(ctx, x0, pyd + c * 0.12, x0 + pw2, pyd + c * 0.12, Math.max(6, c * 0.22), 1, 3, 0.4); beam(ctx, x0, pyd, x0 + pw2, pyd + (k ? -2 : 2), Math.max(7, c * 0.26), k ? '#c78a4e' : '#b8763c', 40 + k); ctx.strokeStyle = '#e3b648'; ctx.lineWidth = Math.max(1.5, c * 0.05); ctx.beginPath(); ctx.moveTo(x0 + pw2 * 0.5, pyd); ctx.lineTo(x0 + pw2 * 0.5, bot + c * 0.4); ctx.stroke(); }
  void m;
}
export function drawGround(ctx, S) {
  const r = S.rect, c = S.cell, m = S.bg, p = Math.max(1.8, c / 9);
  ctx.fillStyle = m; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  for (let y = r.y, j = 0; y < r.y + r.h; y += p, j++) { ctx.fillStyle = rgba(j % 2 ? '#fff' : '#300', 0.06); ctx.fillRect(r.x, y, r.w, p * 0.5); }
  const sg = ctx.createLinearGradient(r.x, r.y + r.h * 0.2, r.x + r.w, r.y + r.h * 0.8); sg.addColorStop(0.2, 'rgba(255,248,230,0)'); sg.addColorStop(0.4, 'rgba(255,248,230,0.34)'); sg.addColorStop(0.55, 'rgba(255,248,230,0)'); sg.addColorStop(0.8, 'rgba(255,248,230,0.2)'); sg.addColorStop(1, 'rgba(255,248,230,0)'); ctx.fillStyle = sg; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// PEG LOOM: a bright cottage floor, a stout board with two rows of turned pegs, cord warp looped between them, rag rug woven across
// ---------------------------------------------------------------------------------------------------------------------------------------------------
export function pegEnv(ctx, S) {
  const a = S.area, c = S.cell, X0 = a.x - 12, W = a.w + 24;
  ENV.wood(ctx, S, { base: '#d9c8a6', plank: c * 1.5, dir: 'v', lampC: '#ffffff', lx: 0.5, ly: 0.1 });
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(X0, a.y, W, a.h);
  // a wicker basket of rag strips and a pair of scissors in the free floor beside the board, loose rag balls in the corners
  const g = pegGeom(S), gl = g.bx0 - a.x, gr = a.x + a.w - g.bx1, cs = ['#c0502e', '#2f6a9a', '#d0a030', '#4a8a5a', '#f1ead6'];
  const basket = (x, y, R) => {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x + R * 0.1, y + R * 0.9, R * 1.1, R * 0.28, 0, 0, TAU); ctx.fill();
    for (let k = 0; k < 9; k++) { const t = (k - 4) / 4, col = cs[k % 5]; ctx.strokeStyle = shade(col, -0.35); ctx.lineWidth = R * 0.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + t * R * 0.5, y - R * 0.2); ctx.quadraticCurveTo(x + t * R * 1.1, y - R * (0.9 + hash(k, 2) * 0.45), x + t * R * 1.4 + R * 0.2, y - R * 0.3 + hash(k, 3) * R * 0.2); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = R * 0.14; ctx.stroke(); }
    const bg = ctx.createLinearGradient(x - R, 0, x + R, 0); bg.addColorStop(0, '#d9b070'); bg.addColorStop(0.55, '#b88848'); bg.addColorStop(1, '#6a4420'); ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(x - R, y - R * 0.2); ctx.lineTo(x + R, y - R * 0.2); ctx.lineTo(x + R * 0.78, y + R * 0.9); ctx.lineTo(x - R * 0.78, y + R * 0.9); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(70,40,10,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = -6; k < 12; k++) { ctx.moveTo(x - R + k * R * 0.22, y - R * 0.2); ctx.lineTo(x - R + k * R * 0.22 + R * 0.7, y + R * 0.9); ctx.moveTo(x + R - k * R * 0.22 + R * 0.7 - R * 0.7, y - R * 0.2); ctx.lineTo(x + R - k * R * 0.22 - R * 0.7, y + R * 0.9); } ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#e0bd80'; ctx.beginPath(); ctx.ellipse(x, y - R * 0.2, R, R * 0.2, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(70,40,10,0.5)'; ctx.stroke();
  };
  const scissors = (x, y, R) => { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.5); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(R * 0.1, R * 0.12, R * 1.5, R * 0.1); ctx.strokeStyle = '#cfd6dc'; ctx.lineWidth = R * 0.14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-R * 0.2, -R * 0.05); ctx.lineTo(R * 1.5, R * 0.06); ctx.moveTo(-R * 0.2, R * 0.05); ctx.lineTo(R * 1.5, -R * 0.02); ctx.stroke(); ctx.strokeStyle = '#c0392b'; ctx.lineWidth = R * 0.12; ctx.beginPath(); ctx.ellipse(-R * 0.5, -R * 0.2, R * 0.28, R * 0.2, 0, 0, TAU); ctx.ellipse(-R * 0.5, R * 0.22, R * 0.28, R * 0.2, 0, 0, TAU); ctx.stroke(); ctx.restore(); };
  if (gl > c * 1.5) basket(a.x + gl * 0.5, a.y + a.h * 0.7, clamp(gl * 0.34, c * 0.6, c * 1.25));
  if (gr > c * 1.5) { scissors(g.bx1 + gr * 0.3, a.y + a.h * 0.55, clamp(gr * 0.22, c * 0.5, c * 0.9)); ball(ctx, a.x + a.w - gr * 0.4, a.y + a.h * 0.78, clamp(gr * 0.16, c * 0.3, c * 0.6), cs[1], true); ball(ctx, a.x + a.w - gr * 0.62, a.y + a.h * 0.84, clamp(gr * 0.12, c * 0.25, c * 0.5), cs[2], true); }
  for (let k = 0; k < 4; k++) { const R = Math.max(5, c * 0.22); ball(ctx, k % 2 ? a.x + a.w - R * 1.3 : a.x + R * 1.3, a.y + a.h - R * (1.5 + (k > 1 ? 2.4 : 0)), R, cs[k], true); }
}
function pegGeom(S) {
  const { a, r, c, m, b } = L(S), th = clamp(Math.min(m.t, m.b) * 0.5, 8, c * 0.7);
  return { a, r, c, m, b, th, bx0: r.x - clamp(m.l * 0.5, c * 0.45, c * 0.9), bx1: r.x + r.w + clamp(m.r * 0.5, c * 0.45, c * 0.9), by0: r.y - clamp(m.t * 0.7, c * 0.8, c * 1.15), by1: r.y + r.h + clamp(m.b * 0.7, c * 0.8, c * 1.15) };
}
export function pegUnder(ctx, S) {
  if (S.card || S.lite) return;
  const g = pegGeom(S), { c } = g;
  // the loom board: a thick plank with a rounded edge and cast shadow
  ctx.save(); ctx.shadowColor = 'rgba(40,20,0,0.55)'; ctx.shadowBlur = c * 0.7; ctx.shadowOffsetY = c * 0.3; const bg = ctx.createLinearGradient(g.bx0, g.by0, g.bx1, g.by1); bg.addColorStop(0, '#6a4630'); bg.addColorStop(1, '#2e1c10'); ctx.fillStyle = bg; roundRectPath(ctx, g.bx0, g.by0, g.bx1 - g.bx0, g.by1 - g.by0, c * 0.2); ctx.fill(); ctx.restore();
  lines(ctx, { x: g.bx0, y: g.by0, w: g.bx1 - g.bx0, h: g.by1 - g.by0 }, 'h', 6, '#000', 0.25, 1.2, 3, 8);
  ctx.strokeStyle = 'rgba(255,225,170,0.4)'; ctx.lineWidth = 1.4; roundRectPath(ctx, g.bx0 + 1, g.by0 + 1, g.bx1 - g.bx0 - 2, g.by1 - g.by0 - 2, c * 0.2); ctx.stroke();
  for (const [x, y] of [[g.bx0 + c * 0.18, g.by0 + c * 0.18], [g.bx1 - c * 0.18, g.by0 + c * 0.18], [g.bx0 + c * 0.18, g.by1 - c * 0.18], [g.bx1 - c * 0.18, g.by1 - c * 0.18]]) { ball(ctx, x, y, Math.max(3, c * 0.1), '#e0b84a', false); ctx.strokeStyle = 'rgba(60,40,0,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - c * 0.06, y - c * 0.02); ctx.lineTo(x + c * 0.06, y + c * 0.02); ctx.stroke(); }
}
export function pegFrame(ctx, S) {
  if (S.card || S.lite) return;
  const g = pegGeom(S), { r, c, m } = g, cols = S.cols, cw = r.w / cols, cols2 = S.colors;
  // rows of turned pegs along the top and bottom of the board with cord warp running to them
  const py0 = r.y - clamp(m.t * 0.4, c * 0.42, c * 0.6), py1 = r.y + r.h + clamp(m.b * 0.4, c * 0.42, c * 0.6), pr = Math.max(7, Math.min(cw * 0.42, c * 0.46));
  for (let i = 0; i <= cols; i++) {
    const x = r.x + i * cw; thread(ctx, x, py0, x, r.y + 2, Math.max(1.6, c * 0.07), '#efe6cf', 0); thread(ctx, x, r.y + r.h - 2, x, py1, Math.max(1.6, c * 0.07), '#efe6cf', 0);
    for (const y of [py0, py1]) { // a turned peg: foot ring, shaft with a groove, round head with a bright spot
      softE(ctx, x + pr * 0.5, y + pr * 0.85, pr * 1.0, pr * 0.42, 0.42); rod(ctx, x, y + pr * 0.62, x, y - pr * 0.05, pr * 1.0, '#c78e4e', 'butt'); rod(ctx, x - pr * 0.6, y + pr * 0.55, x + pr * 0.6, y + pr * 0.55, pr * 0.28, '#8a5a2a');
      ball(ctx, x, y - pr * 0.18, pr * 0.78, '#ecbd80', false);       ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(x - pr * 0.28, y - pr * 0.45, pr * 0.2, pr * 0.12, -0.6, 0, TAU); ctx.fill(); }
    void cols2;
  }
}
export function pegGround(ctx, S) {
  const r = S.rect, c = S.cell, m = S.bg, p = Math.max(2.4, c / 3.6), JUTE = '#c7a46e';
  ctx.fillStyle = '#2a1a0c'; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  for (let x = r.x, i = 0; x < r.x + r.w; x += p, i++) { // each warp cord: a twisted jute rope, lit on the left, dark on the right, a dyed cord now and then
    const base = i % 6 === 3 ? mix(JUTE, m, 0.6) : JUTE, g2 = ctx.createLinearGradient(x, 0, x + p, 0); g2.addColorStop(0, shade(base, 0.25)); g2.addColorStop(0.45, base); g2.addColorStop(1, shade(base, -0.55));
    ctx.fillStyle = g2; ctx.fillRect(x, r.y, p * 0.9, r.h);
    if (!S.lite) { ctx.strokeStyle = 'rgba(60,35,10,0.42)'; ctx.lineWidth = Math.max(0.8, p * 0.12); ctx.beginPath(); for (let y = r.y + (i % 2) * p * 0.5; y < r.y + r.h; y += p * 1.05) { ctx.moveTo(x + p * 0.08, y + p * 0.7); ctx.lineTo(x + p * 0.82, y); } ctx.stroke(); }
  }
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,240,200,0.16)'); g.addColorStop(1, 'rgba(0,0,0,0.22)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  const e = Math.max(4, c * 0.25); for (const [y0, a0, a1] of [[r.y, 0.4, 0], [r.y + r.h - e, 0, 0.4]]) { const eg = ctx.createLinearGradient(0, y0, 0, y0 + e); eg.addColorStop(0, `rgba(0,0,0,${a0})`); eg.addColorStop(1, `rgba(0,0,0,${a1})`); ctx.fillStyle = eg; ctx.fillRect(r.x, y0, r.w, e); }
  ctx.restore();
}

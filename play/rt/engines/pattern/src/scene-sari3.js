// Scene art, 1.13.0 (saris and shawls II), part 1: Chanderi gauze, Maheshwari river-fort check, Muga golden silk. Pure canvas 2D, no Math.random, no figures,
// no religious structures, no text. Registered in scenes-s2.js. Tools and supplies are added to TOOLS / POT here (unique names).
import { hash, rgba, mix, shade, lum, roundRectPath, rod, ball, speck, lines, glow, vignette, TAU, motifPath, isFilled, lineWidthOf, clamp, sheenLine, poly, POT } from './scene-kit.js';
import { TOOLS } from './scene-tools.js';
import { beam, castShadow, thread, margins, isLand } from './scene-loom.js';
import { insideTest, lightShaft } from './scene-needle.js';

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// shared bits
// ---------------------------------------------------------------------------------------------------------------------------------------------------
export const bx = (b) => ({ cx: b.x + b.w / 2, cy: b.y + b.h / 2, r: Math.min(b.w, b.h) / 2 });
export function ring(ctx, S, b, on) {
  ctx.save(); ctx.strokeStyle = on ? S.pal.accent : 'rgba(255,255,255,0.28)'; ctx.lineWidth = on ? 4 : 1.5; roundRectPath(ctx, b.x, b.y, b.w, b.h, 12); ctx.stroke();
  if (on) { ctx.fillStyle = S.pal.accent; ctx.beginPath(); ctx.arc(b.x + b.w - 7, b.y + 7, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x + b.w - 9.5, b.y + 7); ctx.lineTo(b.x + b.w - 7.2, b.y + 9.2); ctx.lineTo(b.x + b.w - 4.6, b.y + 4.8); ctx.stroke(); }
  ctx.restore();
}
export function back(ctx, b, c, a = 0.5) { ctx.save(); roundRectPath(ctx, b.x, b.y, b.w, b.h, 12); ctx.fillStyle = rgba(c, a); ctx.fill(); ctx.restore(); }
export const softE = (ctx, x, y, rx, ry, a = 0.3) => { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); };
export const pressOf = (T) => Math.max(0, 1 - T.a / 0.45);
export const G = (S) => ({ a: S.area, r: S.rect, c: S.cell, m: margins(S), land: isLand(S), b: S.box });
const clipTo = (ctx, r) => { ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); };

// A batch of short thread floats (round-capped dashes) in four passes: cast shadow, dark underside, body, highlight. segs = [[x0, y, x1], ...]
export function floats(ctx, segs, w, col, o = {}) {
  if (!segs.length) return;
  const run = (dx, dy, st, lw) => { ctx.beginPath(); for (const [x0, y, x1] of segs) { ctx.moveTo(x0 + dx, y + dy); ctx.lineTo(x1 + dx, y + dy); } ctx.strokeStyle = st; ctx.lineWidth = lw; ctx.stroke(); };
  ctx.lineCap = o.cap ?? 'round';
  run(w * 0.16, w * 0.42, `rgba(0,0,0,${o.sh ?? 0.3})`, w * 1.1);
  run(0, 0, shade(col, -0.5), w);
  run(0, -w * 0.04, col, w * 0.74);
  run(-w * 0.04, -w * 0.2, rgba(shade(col, 0.75), o.hi ?? 0.8), Math.max(0.5, w * 0.2));
}
// rows of floats filling a motif (brick offset); returns the float list
export function motifRows(ctx, kind, x, y, s, p, flen, gap) {
  const inside = insideTest(ctx, kind, x, y, s), segs = [], half = Math.ceil((s * 0.62) / p), step = p * 0.5;
  for (let j = -half; j <= half; j++) {
    const yy = y + j * p, off = (j & 1) * (flen + gap) * 0.5; let x0 = null;
    for (let i = -half * 2 - 2; i <= half * 2 + 2; i++) {
      const xx = x + i * step, ok = inside(xx, yy + 0.01);
      if (ok && x0 === null) x0 = xx;
      if ((!ok || i === half * 2 + 2) && x0 !== null) {
        const xe = xx - step; let q = x0 + off - (flen + gap) * ((j & 1) ? 1 : 0);
        for (; q < xe; q += flen + gap) { const a0 = Math.max(q, x0), a1 = Math.min(q + flen, xe); if (a1 - a0 > p * 0.5) segs.push([a0, yy, a1]); }
        x0 = null;
      }
    }
  }
  return segs;
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// supplies and tools
// ---------------------------------------------------------------------------------------------------------------------------------------------------
Object.assign(POT, {
  // a folded card with thread wound round its waist: the tray for the fine silk and zari threads of the gauze
  threadcard(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0, w = r * 1.35, h = r * 1.5; back(ctx, b, '#4a3a28', 0.34);
    ctx.save(); ctx.translate(cx, cy + lift); ctx.rotate(-0.16);
    softE(ctx, w * 0.1, h * 0.52, w * 0.56, h * 0.07);
    const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, '#fbf4e2'); g.addColorStop(1, '#d4c49c'); ctx.fillStyle = g; roundRectPath(ctx, -w / 2, -h / 2, w, h, w * 0.06); ctx.fill();
    ctx.strokeStyle = 'rgba(90,64,28,0.45)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#c9a24a'; ctx.fillRect(-w / 2, -h / 2, w, h * 0.06); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(-w / 2 + 2, -h / 2 + 1.5, w * 0.5, 1.2);
    const wraps = 11, y0 = -h * 0.2, y1 = h * 0.28; // the thread wound round the card, each wrap a thin lit strand
    for (let k = 0; k < wraps; k++) { const yy = y0 + ((y1 - y0) * k) / (wraps - 1); ctx.fillStyle = shade(col, -0.35); ctx.fillRect(-w * 0.5 - 1, yy - h * 0.022, w + 2, h * 0.056); ctx.fillStyle = k % 2 ? col : shade(col, 0.1); ctx.fillRect(-w * 0.5 - 1, yy - h * 0.02, w + 2, h * 0.034); ctx.fillStyle = rgba(shade(col, 0.8), 0.7); ctx.fillRect(-w * 0.5, yy - h * 0.018, w, Math.max(0.6, h * 0.008)); }
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.3, h * 0.025); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(w * 0.34, y1 + h * 0.02); ctx.quadraticCurveTo(w * 0.62, h * 0.52, w * 0.3, h * 0.62); ctx.stroke();
    ctx.restore(); ring(ctx, S, b, on);
  },
  // a spindle cop: yarn wound on a short turned wooden spindle held upright in a small stand
  copstand(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#1a2430', 0.5);
    ctx.save(); ctx.translate(cx, cy + lift);
    softE(ctx, r * 0.14, r * 0.74, r * 0.62, r * 0.12);
    const bg = ctx.createLinearGradient(-r * 0.6, 0, r * 0.6, 0); bg.addColorStop(0, '#d6a56a'); bg.addColorStop(1, '#6a3c1c'); ctx.fillStyle = bg; roundRectPath(ctx, -r * 0.6, r * 0.5, r * 1.2, r * 0.22, r * 0.07); ctx.fill();
    rod(ctx, 0, r * 0.55, 0, -r * 0.82, r * 0.1, '#c99a5a');
    const R = r * 0.4, g = ctx.createLinearGradient(-R, 0, R, 0); g.addColorStop(0, shade(col, 0.4)); g.addColorStop(0.45, col); g.addColorStop(1, shade(col, -0.5));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-R * 0.3, -r * 0.64); ctx.quadraticCurveTo(-R * 1.15, -r * 0.1, -R * 0.9, r * 0.38); ctx.lineTo(R * 0.9, r * 0.38); ctx.quadraticCurveTo(R * 1.15, -r * 0.1, R * 0.3, -r * 0.64); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 10; k++) { const t = k / 9, yy = -r * 0.58 + t * r * 0.92, w = R * (0.28 + 0.78 * Math.sin(t * 2.2 + 0.3) * 0.9); ctx.moveTo(-w, yy); ctx.lineTo(w, yy + 2.5); } ctx.stroke();
    ctx.strokeStyle = rgba(shade(col, 0.8), 0.55); ctx.beginPath(); for (let k = 0; k < 7; k++) { const t = k / 6, yy = -r * 0.55 + t * r * 0.9; ctx.moveTo(-R * 0.7, yy); ctx.lineTo(-R * 0.2, yy + 1.5); } ctx.stroke();
    ctx.restore(); ring(ctx, S, b, on);
  },
  // a bamboo bobbin wound with silk beside two golden cocoons
  cocoonreel(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#2c3a1c', 0.4);
    ctx.save(); ctx.translate(cx, cy + lift);
    softE(ctx, r * 0.1, r * 0.76, r * 0.74, r * 0.11);
    for (const [ox, oy, rot, k] of [[r * 0.46, r * 0.5, 0.5, 0], [r * 0.7, r * 0.36, -0.4, 1]]) { // two cocoons: pale golden ovals with a fine lengthwise grain
      ctx.save(); ctx.translate(ox, oy); ctx.rotate(rot); const g = ctx.createRadialGradient(-r * 0.05, -r * 0.08, 1, 0, 0, r * 0.28); g.addColorStop(0, '#f4d36c'); g.addColorStop(0.7, '#d9a62a'); g.addColorStop(1, '#8a5e12'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.2, r * 0.3, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(100,60,0,0.3)'; ctx.lineWidth = 0.8; for (let q = -2; q <= 2; q++) { ctx.beginPath(); ctx.ellipse(0, 0, r * 0.2 * (1 - Math.abs(q) * 0.2), r * 0.3, 0, -1.2 + k, 1.2 + k); ctx.stroke(); } ctx.restore();
    }
    ctx.rotate(-0.3); const w = r * 0.95, h = r * 1.24;
    ctx.fillStyle = '#b9a45a'; roundRectPath(ctx, -w * 0.62, -h / 2 - 3, w * 1.24, 7, 3); ctx.fill(); roundRectPath(ctx, -w * 0.62, h / 2 - 4, w * 1.24, 7, 3); ctx.fill();
    for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? col : shade(col, -0.14); ctx.fillRect(-w / 2, -h / 2 + (h * i) / 12, w, h / 12 + 0.6); }
    const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, 'rgba(255,255,255,0.6)'); g.addColorStop(0.3, 'rgba(255,255,255,0.05)'); g.addColorStop(1, 'rgba(0,0,0,0.42)'); ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore(); ring(ctx, S, b, on);
  },
});

Object.assign(TOOLS, {
  // a slim turned bobbin wound with zari thread, its thread end the tip
  zaribobbin(ctx, S, T) {
    const u = T.u, p = pressOf(T), lift = (1 - p) * u * 0.28, a = 0.62;
    softE(ctx, T.x + u * 0.5, T.y + u * 0.1, u * 0.8, u * 0.09);
    ctx.save(); ctx.translate(T.x, T.y - lift); ctx.rotate(a);
    ctx.strokeStyle = shade(T.col, -0.1); ctx.lineWidth = Math.max(1.2, u * 0.035); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -u * 0.5); ctx.stroke();
    rod(ctx, 0, -u * 0.45, 0, -u * 2.3, u * 0.17, '#d9b078');
    const g = ctx.createLinearGradient(-u * 0.24, 0, u * 0.24, 0); g.addColorStop(0, '#fff0b0'); g.addColorStop(0.45, '#e2b23a'); g.addColorStop(1, '#7a540c'); ctx.fillStyle = g; roundRectPath(ctx, -u * 0.25, -u * 1.75, u * 0.5, u * 0.78, u * 0.1); ctx.fill();
    ctx.strokeStyle = 'rgba(90,56,0,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 1; k < 8; k++) { const yy = -u * 1.75 + (u * 0.78 * k) / 8; ctx.moveTo(-u * 0.25, yy); ctx.lineTo(u * 0.25, yy + 1); } ctx.stroke();
    ctx.fillStyle = '#7a4a22'; ctx.fillRect(-u * 0.29, -u * 1.8, u * 0.58, u * 0.07); ctx.fillRect(-u * 0.29, -u * 1.0, u * 0.58, u * 0.07);
    ctx.restore();
  },
  // a flying shuttle of polished teak with pointed metal tips, yarn showing at its eye (Maheshwari)
  teakshuttle(ctx, S, T) {
    const u = T.u, p = pressOf(T), Lg = u * 3.1, H = u * 0.42, lift = p * u * 0.08;
    softE(ctx, T.x + Lg * 0.5 + 3, T.y + u * 0.16, Lg * 0.5, H * 0.45);
    ctx.save(); ctx.translate(T.x + Lg * 0.5, T.y - H * 0.28 - lift); ctx.rotate(-0.04);
    const g = ctx.createLinearGradient(0, -H, 0, H); g.addColorStop(0, '#d49a62'); g.addColorStop(0.45, '#9a5a2a'); g.addColorStop(1, '#3a1c0a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-Lg / 2, 0); ctx.bezierCurveTo(-Lg * 0.38, -H * 1.0, Lg * 0.3, -H * 1.0, Lg / 2, 0); ctx.bezierCurveTo(Lg * 0.3, H * 0.9, -Lg * 0.38, H * 0.9, -Lg / 2, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,230,190,0.5)'; ctx.lineWidth = Math.max(1, u * 0.04); ctx.beginPath(); ctx.moveTo(-Lg * 0.38, -H * 0.38); ctx.quadraticCurveTo(0, -H * 0.82, Lg * 0.36, -H * 0.3); ctx.stroke();
    ctx.fillStyle = '#d6dde3'; poly(ctx, [[Lg / 2 - u * 0.34, -H * 0.12], [Lg / 2 + u * 0.1, 0], [Lg / 2 - u * 0.34, H * 0.12]]); ctx.fill(); poly(ctx, [[-Lg / 2 + u * 0.34, -H * 0.12], [-Lg / 2 - u * 0.1, 0], [-Lg / 2 + u * 0.34, H * 0.12]]); ctx.fill();
    ctx.fillStyle = '#160a04'; ctx.beginPath(); ctx.ellipse(0, -H * 0.02, Lg * 0.2, H * 0.3, 0, 0, TAU); ctx.fill();
    for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? T.col : shade(T.col, -0.2); ctx.fillRect(-Lg * 0.15 + k * Lg * 0.05, -H * 0.22, Lg * 0.05, H * 0.44); }
    ctx.restore();
    sheenLine(ctx, [[T.x - u * 0.1, T.y - H * 0.25], [T.x - u * 0.7, T.y - H * 0.1 + Math.sin(T.t * 3) * u * 0.05], [T.x - u * 1.3, T.y + u * 0.1]], Math.max(1.3, u * 0.05), T.col);
  },
  // a length of bamboo with a node, a hole near the middle and the golden silk trailing from it (Assam)
  bamboobobbin(ctx, S, T) {
    const u = T.u, p = pressOf(T), lift = (1 - p) * u * 0.25, Lg = u * 2.7, a = -0.1;
    softE(ctx, T.x + Lg * 0.45, T.y + u * 0.12, Lg * 0.5, u * 0.08);
    ctx.save(); ctx.translate(T.x, T.y - u * 0.2 - lift); ctx.rotate(a);
    rod(ctx, u * 0.1, 0, Lg, 0, u * 0.3, '#c3b05c');
    ctx.fillStyle = '#6c5a22'; for (const f of [0.0, 0.5, 1.0]) ctx.fillRect(u * 0.1 + Lg * 0.88 * f + (f === 1 ? -u * 0.03 : 0), -u * 0.17, u * 0.05, u * 0.34);
    ctx.fillStyle = '#2a1e08'; ctx.beginPath(); ctx.ellipse(u * 0.1 + Lg * 0.28, -u * 0.02, u * 0.17, u * 0.07, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = T.col; ctx.lineWidth = Math.max(1.3, u * 0.05); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(u * 0.1 + Lg * 0.28, -u * 0.02); ctx.quadraticCurveTo(u * 0.1 + Lg * 0.1, u * 0.2, u * 0.05, u * 0.2 + lift); ctx.stroke();
    ctx.restore();
  },
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// CHANDERI: sheer cotton-silk gauze with tiny zari butis, stretched on bamboo rails over a pale table, in a sandstone courtyard window light
// ---------------------------------------------------------------------------------------------------------------------------------------------------
function arch(ctx, cx, y0, y1, w) { const R = w / 2; ctx.beginPath(); ctx.moveTo(cx - R, y1); ctx.lineTo(cx - R, y0 + R); ctx.arc(cx, y0 + R, R, Math.PI, 0); ctx.lineTo(cx + R, y1); ctx.closePath(); }
export function chanderiEnv(ctx, S) {
  const a = S.area, c = S.cell, X0 = a.x - 12, W = a.w + 24, land = isLand(S);
  let g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#f1e3c8'); g.addColorStop(0.6, '#e2cba4'); g.addColorStop(1, '#cfb48a'); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, a.h);
  clipTo(ctx, { x: X0, y: a.y, w: W, h: a.h });
  // sandstone courses: long blocks with staggered joints
  const ch = c * 1.05; ctx.strokeStyle = 'rgba(125,90,50,0.18)'; ctx.lineWidth = 1.3; ctx.beginPath();
  for (let y = a.y, j = 0; y < a.y + a.h; y += ch, j++) { ctx.moveTo(X0, y); ctx.lineTo(X0 + W, y); for (let x = X0 - (hash(j, 1) * ch * 3), i = 0; x < X0 + W; x += ch * (2.6 + hash(j, i, 2) * 1.2), i++) { ctx.moveTo(x, y); ctx.lineTo(x, y + ch); } }
  ctx.stroke(); ctx.strokeStyle = 'rgba(255,250,235,0.35)'; ctx.beginPath(); for (let y = a.y, j = 0; y < a.y + a.h; y += ch, j++) { ctx.moveTo(X0, y + 1.6); ctx.lineTo(X0 + W, y + 1.6); } ctx.stroke();
  speck(ctx, { x: X0, y: a.y, w: W, h: a.h }, 520, ['#9a7440', '#fff4da', '#b4905c'], 0.18, 2.2, 31);
  // three arched window openings: bright diffuse courtyard beyond, soft green trees, a white wall
  const B = S.box, aw = Math.min(B.w * (land ? 0.22 : 0.25), c * 3.0), y0 = B.y + c * 0.14, y1 = B.y + B.h * 0.62;
  const xs = [0.1, 0.5, 0.9].map((f) => B.x + B.w * f);
  for (let k = 0; k < xs.length; k++) {
    const cx = xs[k], dep = c * 0.2;
    ctx.save(); ctx.shadowColor = 'rgba(70,45,15,0.45)'; ctx.shadowBlur = c * 0.4; ctx.fillStyle = '#c3a57a'; arch(ctx, cx, y0 - dep, y1 + dep * 0.3, aw + dep * 2); ctx.fill(); ctx.restore();
    arch(ctx, cx, y0, y1, aw); ctx.save(); ctx.clip();
    g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#d9e6ee'); g.addColorStop(0.45, '#f4f1e4'); g.addColorStop(1, '#fff6df'); ctx.fillStyle = g; ctx.fillRect(cx - aw, y0, aw * 2, y1 - y0);
    const hh = y1 - y0, wy = y0 + hh * 0.66;
    // a hazy far ridge, then a courtyard wall with tree crowns in front of it and a pale lawn
    ctx.fillStyle = 'rgba(150,175,170,0.55)'; ctx.beginPath(); ctx.moveTo(cx - aw, wy - hh * 0.16); for (let i = 0; i <= 8; i++) ctx.lineTo(cx - aw / 2 + (aw * i) / 8 - aw / 2 * 0.0, wy - hh * (0.1 + 0.07 * Math.sin(i * 1.3 + k))); ctx.lineTo(cx + aw, wy); ctx.lineTo(cx - aw, wy); ctx.fill();
    ctx.fillStyle = '#efe4cb'; ctx.fillRect(cx - aw, wy - hh * 0.04, aw * 2, hh * 0.06); ctx.fillStyle = 'rgba(140,110,70,0.25)'; ctx.fillRect(cx - aw, wy - hh * 0.04, aw * 2, Math.max(1, c * 0.03));
    for (let q = 0; q < 7; q++) { const tx = cx - aw * 0.6 + hash(k, q, 3) * aw * 1.2, tr = c * (0.3 + hash(k, q, 4) * 0.34), ty = wy - hh * 0.03 - tr * 0.5; const tg = ctx.createRadialGradient(tx - tr * 0.3, ty - tr * 0.35, 1, tx, ty, tr); tg.addColorStop(0, q % 2 ? '#a9c88f' : '#8fb98a'); tg.addColorStop(0.75, q % 2 ? '#6f9a6a' : '#5f8f62'); tg.addColorStop(1, 'rgba(70,110,70,0.2)'); ctx.fillStyle = tg; ctx.beginPath(); ctx.arc(tx, ty, tr, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(70,45,20,0.55)'; ctx.fillRect(tx - tr * 0.07, ty + tr * 0.6, tr * 0.14, tr * 0.5 + hh * 0.04); }
    g = ctx.createLinearGradient(0, wy, 0, y1); g.addColorStop(0, '#d9e3c0'); g.addColorStop(1, '#f1ebd0'); ctx.fillStyle = g; ctx.fillRect(cx - aw, wy + hh * 0.02, aw * 2, y1 - wy);
    glow(ctx, cx, y0 + (y1 - y0) * 0.3, aw * 1.3, '#ffffff', 0.5);
    g = ctx.createLinearGradient(cx - aw / 2, 0, cx + aw / 2, 0); g.addColorStop(0, 'rgba(90,60,25,0.38)'); g.addColorStop(0.16, 'rgba(90,60,25,0)'); g.addColorStop(0.9, 'rgba(90,60,25,0)'); g.addColorStop(1, 'rgba(90,60,25,0.18)'); ctx.fillStyle = g; ctx.fillRect(cx - aw, y0, aw * 2, y1 - y0);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,248,230,0.55)'; ctx.lineWidth = 1.6; arch(ctx, cx, y0 - 1, y1, aw + 3); ctx.stroke();
    ctx.fillStyle = '#e8d2aa'; roundRectPath(ctx, cx - aw / 2 - c * 0.25, y1, aw + c * 0.5, c * 0.24, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,250,235,0.7)'; ctx.fillRect(cx - aw / 2 - c * 0.25, y1, aw + c * 0.5, Math.max(1.4, c * 0.05));
    ctx.fillStyle = 'rgba(80,50,20,0.28)'; ctx.fillRect(cx - aw / 2 - c * 0.2, y1 + c * 0.24, aw + c * 0.4, c * 0.14);
  }
  // window light slanting onto the wall below the sills and the floor
  lightShaft(ctx, { x: a.x, y: y1 + c * 0.3, w: a.w, h: a.y + a.h - y1 }, B.x + B.w * 0.04, B.w * 0.34, B.w * 0.18, '#fff6dc', 0.3, 0);
  const fy = B.y + B.h * 0.88; g = ctx.createLinearGradient(0, fy, 0, a.y + a.h); g.addColorStop(0, '#d9c19a'); g.addColorStop(1, '#bba173'); ctx.fillStyle = g; ctx.fillRect(X0, fy, W, a.y + a.h - fy + 12);
  ctx.strokeStyle = 'rgba(90,60,25,0.22)'; ctx.lineWidth = 1.3; ctx.beginPath(); for (let x = X0; x < X0 + W; x += c * 1.9) { ctx.moveTo(x, fy); ctx.lineTo(x - c * 0.5, a.y + a.h); } ctx.stroke(); ctx.fillStyle = 'rgba(255,248,225,0.5)'; ctx.fillRect(X0, fy, W, Math.max(1.4, c * 0.05));
  glow(ctx, B.x + B.w * 0.2, B.y, Math.max(B.w, B.h) * 0.8, '#fffaf0', 0.3);
  vignette(ctx, a, 0.2);
  ctx.restore();
}
const chanderiTable = (S) => { const { r, c } = G(S); return { x: r.x - c * 0.42, y: r.y - c * 0.34, w: r.w + c * 0.84, h: r.h + c * 0.68 }; };
export function chanderiUnder(ctx, S) {
  if (S.card || S.lite) return;
  const t = chanderiTable(S), c = S.cell;
  // a pale timber work table under the gauze: soft shadow, planks with grain, a lit edge
  ctx.save(); for (let k = 0; k < 4; k++) { ctx.fillStyle = `rgba(60,38,12,${0.1 - k * 0.02})`; roundRectPath(ctx, t.x - c * 0.1 * k + c * 0.1, t.y - c * 0.05 * k + c * 0.34, t.w + c * 0.2 * k, t.h + c * 0.1 * k, c * 0.2); ctx.fill(); } ctx.restore();
  const eg = ctx.createLinearGradient(0, t.y + t.h, 0, t.y + t.h + c * 0.32); eg.addColorStop(0, '#9c7440'); eg.addColorStop(1, '#4e321a'); ctx.fillStyle = eg; roundRectPath(ctx, t.x, t.y + t.h - c * 0.2, t.w, c * 0.5, c * 0.1); ctx.fill();
  const g = ctx.createLinearGradient(t.x, t.y, t.x + t.w, t.y + t.h); g.addColorStop(0, '#e2c18c'); g.addColorStop(1, '#b8915a'); ctx.fillStyle = g; roundRectPath(ctx, t.x, t.y, t.w, t.h, c * 0.14); ctx.fill();
  ctx.save(); roundRectPath(ctx, t.x, t.y, t.w, t.h, c * 0.14); ctx.clip();
  const pw = c * 1.5; ctx.strokeStyle = 'rgba(70,40,10,0.28)'; ctx.lineWidth = 1.4; ctx.beginPath(); for (let x = t.x + pw * 0.4; x < t.x + t.w; x += pw) { ctx.moveTo(x, t.y); ctx.lineTo(x, t.y + t.h); } ctx.stroke();
  lines(ctx, t, 'v', 5, '#5a3410', 0.1, 1, 2, 4);
  ctx.restore(); ctx.strokeStyle = 'rgba(255,238,200,0.5)'; ctx.lineWidth = 1.4; roundRectPath(ctx, t.x + 1, t.y + 1, t.w - 2, t.h - 2, c * 0.14); ctx.stroke();
}
export function chanderiGround(ctx, S) {
  const r = S.rect, c = S.cell, p = Math.max(1.8, c / 8), bg = S.bg;
  clipTo(ctx, r);
  // the sheer body: thin so the table shows through, paired warp threads with open gaps between the pairs, fine weft
  ctx.fillStyle = rgba(bg, 0.68); ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.beginPath(); for (let x = r.x + p * 0.4; x < r.x + r.w + p; x += p * 2.6) { ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); ctx.moveTo(x + p * 0.85, r.y); ctx.lineTo(x + p * 0.85, r.y + r.h); } ctx.strokeStyle = rgba(shade(bg, 0.22), 0.6); ctx.lineWidth = p * 0.42; ctx.stroke();
  ctx.beginPath(); for (let y = r.y + p * 0.3; y < r.y + r.h; y += p * 1.05) { ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); } ctx.strokeStyle = rgba(shade(bg, -0.2), 0.2); ctx.lineWidth = p * 0.3; ctx.stroke();
  if (!S.lite) { // leno twists: tiny crossings where the pairs trade places, in rows
    ctx.beginPath(); for (let y = r.y + p * 2, j = 0; y < r.y + r.h; y += p * 4.2, j++) for (let x = r.x + p * 0.4 + (j % 2) * p * 2.6; x < r.x + r.w; x += p * 5.2) { ctx.moveTo(x - p * 0.1, y + p * 0.5); ctx.lineTo(x + p * 0.95, y - p * 0.5); ctx.moveTo(x + p * 0.95, y + p * 0.5); ctx.lineTo(x - p * 0.1, y - p * 0.5); } ctx.strokeStyle = rgba(shade(bg, 0.45), 0.5); ctx.lineWidth = Math.max(0.6, p * 0.2); ctx.stroke();
    // small butis in the body: a half-drop of tiny zari flowers in gold and silver
    const bs = c * 0.5; for (let y = r.y + bs * 0.5, j = 0; y < r.y + r.h; y += bs, j++) for (let x = r.x + bs * 0.5 + (j % 2) * bs * 0.5, i = 0; x < r.x + r.w; x += bs, i++) { const gold = (i + j) % 3 !== 0, col = gold ? '#d9ad3c' : '#b5bcc4', q = c * 0.045; ctx.fillStyle = 'rgba(40,25,5,0.25)'; ctx.beginPath(); ctx.arc(x + 0.5, y + 0.9, q * 1.5, 0, TAU); ctx.fill(); ctx.fillStyle = col; poly(ctx, [[x, y - q * 1.7], [x + q * 1.1, y], [x, y + q * 1.7], [x - q * 1.1, y]]); ctx.fill(); ctx.fillStyle = shade(col, 0.6); ctx.fillRect(x - q * 0.3, y - q * 0.8, q * 0.5, q * 0.7); }
  }
  // fine zari border: a broad gold band with a woven zigzag and a pair of silver lines at both ends of the length, and gold selvage lines at the sides
  const bh = c * 0.3;
  for (const yy of [r.y, r.y + r.h - bh]) {
    const gg = ctx.createLinearGradient(0, yy, 0, yy + bh); gg.addColorStop(0, '#f3d57a'); gg.addColorStop(0.5, '#c9962a'); gg.addColorStop(1, '#8a5f10'); ctx.fillStyle = gg; ctx.fillRect(r.x, yy, r.w, bh);
    ctx.strokeStyle = 'rgba(70,42,0,0.55)'; ctx.lineWidth = Math.max(1, bh * 0.1); ctx.beginPath(); for (let x = r.x; x < r.x + r.w; x += bh * 0.7) { ctx.moveTo(x, yy + bh * 0.76); ctx.lineTo(x + bh * 0.35, yy + bh * 0.24); ctx.lineTo(x + bh * 0.7, yy + bh * 0.76); } ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(r.x, yy + bh * 0.06, r.w, Math.max(0.8, bh * 0.07));
    ctx.fillStyle = '#c4cbd2'; ctx.fillRect(r.x, yy === r.y ? yy + bh : yy - bh * 0.18, r.w, Math.max(1, bh * 0.14));
  }
  ctx.fillStyle = rgba('#d6a93a', 0.85); ctx.fillRect(r.x, r.y, Math.max(1.6, c * 0.04), r.h); ctx.fillRect(r.x + r.w - Math.max(1.6, c * 0.04), r.y, Math.max(1.6, c * 0.04), r.h);
  ctx.restore();
}
export function chanderiOver(ctx, S) {
  const r = S.rect, c = S.cell;
  // window light sliding over the sheer cloth: a soft bright band and a pale bloom, a faint shadow of the rail
  const g = ctx.createLinearGradient(r.x, r.y + r.h * 0.1, r.x + r.w, r.y + r.h * 0.9); g.addColorStop(0, 'rgba(255,252,238,0)'); g.addColorStop(0.28, 'rgba(255,252,238,0.2)'); g.addColorStop(0.42, 'rgba(255,252,238,0)'); g.addColorStop(0.7, 'rgba(255,252,238,0.12)'); g.addColorStop(1, 'rgba(255,252,238,0)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  const e = Math.max(5, c * 0.5); const h = ctx.createLinearGradient(0, r.y, 0, r.y + e); h.addColorStop(0, 'rgba(60,40,10,0.1)'); h.addColorStop(1, 'rgba(60,40,10,0)'); ctx.fillStyle = h; ctx.fillRect(r.x, r.y, r.w, e);
}
// gauze embroidery: rows of short zari / silk floats lying on the open weave, the open cloth showing between them
export function gauzeSkin(ctx, S, d) {
  const { kind, col, x, y, s } = d, fill = isFilled(kind), p = Math.max(1.5, s / 12), lw = Math.max(1.1, p * 0.66);
  ctx.lineJoin = 'round';
  if (!fill) {
    const w = Math.max(1.6, lineWidthOf(kind, s) * 0.5);
    ctx.setLineDash([w * 2.3, w * 0.9]); ctx.lineCap = 'round';
    const pth = (dx, dy) => { motifPath(ctx, kind, x + dx, y + dy, s); };
    pth(w * 0.15, w * 0.42); ctx.strokeStyle = 'rgba(40,25,5,0.28)'; ctx.lineWidth = w * 1.15; ctx.stroke();
    pth(0, 0); ctx.strokeStyle = shade(col, -0.5); ctx.lineWidth = w; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w * 0.72; ctx.stroke();
    pth(-w * 0.05, -w * 0.22); ctx.strokeStyle = rgba(shade(col, 0.75), 0.8); ctx.lineWidth = Math.max(0.5, w * 0.2); ctx.stroke(); ctx.setLineDash([]);
    return;
  }
  const s2 = s * 1.08;
  motifPath(ctx, kind, x + 0.6, y + 1.2, s2); ctx.fillStyle = 'rgba(40,25,5,0.1)'; ctx.fill();
  motifPath(ctx, kind, x, y, s2); ctx.fillStyle = rgba(col, 0.2); ctx.fill();
  const segs = motifRows(ctx, kind, x, y, s2, p, p * 2.6, p * 0.55);
  floats(ctx, segs, lw, col, { sh: 0.28 });
  // a glint on a few floats (zari catches the light)
  ctx.fillStyle = 'rgba(255,255,245,0.85)'; ctx.beginPath(); for (let k = 0; k < segs.length; k += 5) { const sg = segs[k]; ctx.rect(sg[0] + (sg[2] - sg[0]) * 0.25, sg[1] - lw * 0.3, Math.max(1, (sg[2] - sg[0]) * 0.28), Math.max(0.6, lw * 0.16)); } ctx.fill();
  ctx.setLineDash([p * 0.8, p * 0.7]); motifPath(ctx, kind, x, y, s2); ctx.strokeStyle = rgba(shade(col, -0.5), 0.65); ctx.lineWidth = Math.max(0.8, lw * 0.55); ctx.stroke(); ctx.setLineDash([]);
}
function bambooH(ctx, x1, x2, y, w, seed) {
  rod(ctx, x1, y, x2, y, w, '#b3b866', 'round');
  ctx.save(); ctx.fillStyle = 'rgba(80,70,20,0.55)'; const nd = w * 6.2; for (let x = x1 + hash(seed, 1) * nd * 0.6 + nd * 0.3; x < x2 - w; x += nd * (0.9 + hash(seed, x | 0) * 0.3)) { ctx.fillStyle = 'rgba(80,70,20,0.55)'; ctx.fillRect(x, y - w * 0.5, Math.max(1.6, w * 0.16), w); ctx.fillStyle = 'rgba(255,250,200,0.35)'; ctx.fillRect(x - Math.max(1, w * 0.09), y - w * 0.5, Math.max(1, w * 0.1), w * 0.8); } ctx.restore();
}
export function chanderiFrame(ctx, S) {
  if (S.card || S.lite) return;
  const { r, c, m } = G(S), tw = clamp(c * 0.2, 5, 11), x1 = r.x - c * 0.3, x2 = r.x + r.w + c * 0.3;
  // fringe: the loose warp ends of the cloth hang below the lower rail in pale silk with gold tips
  const fl = clamp(m.b * 0.4, c * 0.22, c * 0.5), by = r.y + r.h - tw * 0.1, bg = S.bg;
  ctx.lineCap = 'round'; for (let x = r.x + 2, i = 0; x < r.x + r.w - 1; x += Math.max(2.4, c * 0.09), i++) { const L = fl * (0.8 + hash(i, 2) * 0.35), sw = (hash(i, 3) - 0.5) * c * 0.06; ctx.strokeStyle = rgba(shade(bg, hash(i, 4) > 0.5 ? 0.25 : -0.1), 0.95); ctx.lineWidth = Math.max(1, c * 0.025); ctx.beginPath(); ctx.moveTo(x, by); ctx.quadraticCurveTo(x + sw, by + L * 0.5, x + sw * 1.6, by + L); ctx.stroke(); if (i % 4 === 0) { ctx.fillStyle = '#d9ad3c'; ctx.beginPath(); ctx.arc(x + sw * 1.6, by + L, Math.max(0.9, c * 0.03), 0, TAU); ctx.fill(); } }
  for (const y of [r.y - tw * 0.1, r.y + r.h + tw * 0.1]) { castShadow(ctx, x1, y, x2, y, tw, 1, tw * 0.55, 0.26); bambooH(ctx, x1, x2, y, tw, y | 0); }
  // lashings of dark cord at both ends of each rail
  ctx.strokeStyle = '#4a3a16'; ctx.lineWidth = Math.max(1.4, tw * 0.2); ctx.beginPath(); for (const y of [r.y - tw * 0.1, r.y + r.h + tw * 0.1]) for (const x of [x1 + tw * 1.4, x2 - tw * 1.4]) for (let k = -2; k <= 2; k++) { ctx.moveTo(x + k * tw * 0.3 - tw * 0.1, y - tw * 0.5); ctx.lineTo(x + k * tw * 0.3 + tw * 0.1, y + tw * 0.5); } ctx.stroke();
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// MAHESHWARI: a handloom on a river terrace under a plain sandstone fort: cotton-silk check and stripe cloth with a reversible border; warp tapering to the
// warp beam, a rope-hung reed batten, a treadle pit in the foreground
// ---------------------------------------------------------------------------------------------------------------------------------------------------
export function maheshwariEnv(ctx, S) {
  const a = S.area, B = S.box, c = S.cell, X0 = a.x - 12, W = a.w + 24, land = isLand(S);
  const yH = B.y + B.h * 0.36, yW = B.y + B.h * 0.4, yT = B.y + B.h * 0.8; // wall base / river / terrace edge
  let g = ctx.createLinearGradient(0, a.y, 0, yH); g.addColorStop(0, '#9dbbd0'); g.addColorStop(1, '#f3e7cf'); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, yH - a.y + 2);
  clipTo(ctx, { x: X0, y: a.y, w: W, h: a.h });
  glow(ctx, B.x + B.w * 0.78, B.y + B.h * 0.12, Math.max(B.w, B.h) * 0.6, '#fff4d6', 0.5);
  // soft clouds
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; for (let k = 0; k < 4; k++) { const x = B.x + B.w * (0.1 + 0.28 * k) + hash(k, 1) * 30, y = B.y + B.h * (0.03 + hash(k, 2) * 0.1); ctx.beginPath(); ctx.ellipse(x, y, c * (1.4 + hash(k, 3)), c * 0.18, 0, 0, TAU); ctx.ellipse(x + c * 0.7, y - c * 0.1, c * 0.9, c * 0.16, 0, 0, TAU); ctx.fill(); }
  // the fort: a plain rampart wall of sandstone with merlons, a round bastion left and a square tower right, arrow slits, no domes
  const wallTop = B.y + B.h * (land ? 0.1 : 0.07), wallBot = yW;
  const wg = ctx.createLinearGradient(B.x, 0, B.x + B.w, 0); wg.addColorStop(0, '#e6cfa2'); wg.addColorStop(0.5, '#d9bd8e'); wg.addColorStop(1, '#bfa073');
  ctx.fillStyle = wg; ctx.fillRect(X0, wallTop + c * 0.5, W, wallBot - wallTop - c * 0.5);
  // merlons along the top
  const mw = c * 0.62, mg = c * 0.34; ctx.fillStyle = '#e3caa0'; for (let x = X0 + mg * 0.3; x < X0 + W; x += mw + mg) { ctx.fillRect(x, wallTop, mw, c * 0.55); } ctx.fillStyle = 'rgba(255,248,225,0.4)'; for (let x = X0 + mg * 0.3; x < X0 + W; x += mw + mg) ctx.fillRect(x, wallTop, mw, Math.max(1.4, c * 0.05)); ctx.fillStyle = 'rgba(90,60,25,0.25)'; for (let x = X0 + mg * 0.3; x < X0 + W; x += mw + mg) ctx.fillRect(x + mw * 0.88, wallTop, mw * 0.12, c * 0.55);
  // courses and a batter shadow
  ctx.strokeStyle = 'rgba(110,80,40,0.22)'; ctx.lineWidth = 1.3; ctx.beginPath(); const ch = c * 0.62; for (let y = wallTop + c * 0.5, j = 0; y < wallBot; y += ch, j++) { ctx.moveTo(X0, y); ctx.lineTo(X0 + W, y); for (let x = X0 + (j % 2) * ch * 1.2; x < X0 + W; x += ch * 2.4) { ctx.moveTo(x, y); ctx.lineTo(x, y + ch); } } ctx.stroke();
  speck(ctx, { x: X0, y: wallTop, w: W, h: wallBot - wallTop }, 420, ['#8a6a3a', '#fff0d0'], 0.16, 2, 17);
  const tg = ctx.createLinearGradient(0, wallTop, 0, wallBot); tg.addColorStop(0, 'rgba(255,245,220,0.18)'); tg.addColorStop(1, 'rgba(70,45,20,0.28)'); ctx.fillStyle = tg; ctx.fillRect(X0, wallTop, W, wallBot - wallTop);
  // bastion (left) and tower (right): taller blocks with slits and a flat roof line
  for (const [bx0, bw, round] of [[B.x - c * 0.2, Math.max(c * 2.4, B.w * 0.16), true], [B.x + B.w - Math.max(c * 2.2, B.w * 0.14) + c * 0.2, Math.max(c * 2.2, B.w * 0.14), false]]) {
    const top = wallTop - c * 0.9, bg2 = ctx.createLinearGradient(bx0, 0, bx0 + bw, 0); bg2.addColorStop(0, '#ecd5a8'); bg2.addColorStop(0.6, '#d3b685'); bg2.addColorStop(1, '#a98b5e');
    ctx.fillStyle = bg2; if (round) { roundRectPath(ctx, bx0, top, bw, wallBot - top, c * 0.5); ctx.fill(); } else ctx.fillRect(bx0, top, bw, wallBot - top);
    ctx.fillStyle = '#e8d0a4'; for (let x = bx0; x < bx0 + bw - mw * 0.5; x += mw + mg * 0.7) ctx.fillRect(x, top - c * 0.42, mw, c * 0.45);
    ctx.fillStyle = '#2a1e12'; for (const yy of [top + c * 0.7, top + c * 1.9]) for (const f of [0.3, 0.7]) { roundRectPath(ctx, bx0 + bw * f - c * 0.06, yy, c * 0.12, c * 0.55, c * 0.05); ctx.fill(); }
    ctx.strokeStyle = 'rgba(110,80,40,0.25)'; ctx.beginPath(); for (let y = top + c * 0.5; y < wallBot; y += ch) { ctx.moveTo(bx0, y); ctx.lineTo(bx0 + bw, y); } ctx.stroke();
  }
  // the river: broad, indigo-teal, bright where it mirrors the sky, with long ripples and a mirrored wall
  g = ctx.createLinearGradient(0, yW, 0, yT); g.addColorStop(0, '#86a9bc'); g.addColorStop(0.35, '#4d7c98'); g.addColorStop(1, '#25496b'); ctx.fillStyle = g; ctx.fillRect(X0, yW, W, yT - yW + 2);
  ctx.fillStyle = 'rgba(217,189,142,0.28)'; for (let k = 0; k < 9; k++) { const x = X0 + W * (hash(k, 5) * 0.9), w = c * (0.8 + hash(k, 6) * 2), y = yW + k * (yT - yW) * 0.045; ctx.fillRect(x, y, w, (yT - yW) * 0.04); }
  ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = Math.max(1.2, c * 0.03); ctx.lineCap = 'round'; ctx.beginPath(); for (let k = 0; k < 34; k++) { const t = hash(k, 7), y = yW + (yT - yW) * (0.06 + t * 0.9), x = X0 + hash(k, 8) * W, l = c * (0.5 + t * 1.8); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + l * 0.5, y - c * 0.04, x + l, y); } ctx.stroke();
  ctx.strokeStyle = 'rgba(14,34,60,0.35)'; ctx.beginPath(); for (let k = 0; k < 22; k++) { const t = hash(k, 17), y = yW + (yT - yW) * (0.25 + t * 0.7), x = X0 + hash(k, 18) * W, l = c * (0.4 + t * 1.5); ctx.moveTo(x, y); ctx.lineTo(x + l, y); } ctx.stroke();
  glow(ctx, B.x + B.w * 0.72, yW + (yT - yW) * 0.2, c * 3.2, '#fff6dc', 0.4);
  // a small wooden river boat with a pointed bow lying far out on the water
  { const bxp = B.x + B.w * (land ? 0.9 : 0.86), byp = yW + (yT - yW) * 0.34, bl = c * 1.5; ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(bxp + 2, byp + c * 0.12, bl * 0.55, c * 0.07, 0, 0, TAU); ctx.fill(); const bg3 = ctx.createLinearGradient(0, byp - c * 0.2, 0, byp + c * 0.1); bg3.addColorStop(0, '#b27a44'); bg3.addColorStop(1, '#4a2a12'); ctx.fillStyle = bg3; ctx.beginPath(); ctx.moveTo(bxp - bl / 2, byp - c * 0.12); ctx.quadraticCurveTo(bxp, byp + c * 0.16, bxp + bl / 2 + c * 0.2, byp - c * 0.22); ctx.lineTo(bxp + bl / 2, byp - c * 0.1); ctx.quadraticCurveTo(bxp, byp + c * 0.02, bxp - bl / 2, byp - c * 0.12); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#e8dcc0'; ctx.fillRect(bxp - bl * 0.1, byp - c * 0.4, c * 0.05, c * 0.3); }
  // reflection of the wall base
  ctx.fillStyle = 'rgba(215,185,140,0.22)'; ctx.beginPath(); ctx.moveTo(X0, yW); for (let i = 0; i <= 24; i++) ctx.lineTo(X0 + (W * i) / 24, yW + c * (0.35 + 0.1 * Math.sin(i * 1.7))); ctx.lineTo(X0 + W, yW); ctx.fill();
  // terrace: lime-plastered earth with a stone kerb and plain steps down to the river
  g = ctx.createLinearGradient(0, yT, 0, a.y + a.h); g.addColorStop(0, '#d4b384'); g.addColorStop(1, '#a98457'); ctx.fillStyle = g; ctx.fillRect(X0, yT, W, a.y + a.h - yT + 12);
  speck(ctx, { x: X0, y: yT, w: W, h: a.y + a.h - yT }, 300, ['#7a5830', '#f0ddb4'], 0.22, 2.4, 29);
  ctx.fillStyle = '#e4cfa4'; ctx.fillRect(X0, yT - c * 0.12, W, c * 0.2); ctx.fillStyle = 'rgba(255,248,225,0.6)'; ctx.fillRect(X0, yT - c * 0.12, W, Math.max(1.4, c * 0.04)); ctx.fillStyle = 'rgba(70,45,20,0.35)'; ctx.fillRect(X0, yT + c * 0.08, W, c * 0.1);
  vignette(ctx, a, 0.22);
  ctx.restore();
}
function mhGeom(S) {
  const { a, r, c, m } = G(S), avail = Math.max(c * 0.9, m.t - c * 0.12), h2 = Math.min(c * 0.5, avail * 0.33), reedB = r.y - c * 0.03, h1 = c * 0.15, h3 = c * 0.16;
  const total = h1 + h2 + h3, beamY = r.y - Math.max(total + c * 0.38, avail * 0.86), px0 = r.x - c * 0.5, px1 = r.x + r.w + c * 0.5, taper = 0.84, cx = r.x + r.w / 2;
  return { a, r, c, m, h1, h2, h3, reedB, reedT: reedB - total, beamY, px0, px1, taper, cx, p: Math.max(2.4, c / 5), bw: Math.max(8, c * 0.3) };
}
export function maheshwariUnder(ctx, S) {
  if (S.card || S.lite) return;
  const g = mhGeom(S), { r, c, p, cx, taper, beamY, a } = g;
  // two timber posts, lit on the left, with a rope lashing at the top, standing on the terrace
  const bot = a.y + a.h;
  for (const x of [g.px0, g.px1]) { castShadow(ctx, x, beamY, x, bot, g.bw, g.bw * 0.7, g.bw * 0.15, 0.3); beam(ctx, x, beamY - g.bw * 0.4, x, bot, g.bw, '#9a6a3c', Math.floor(x)); }
  // warp: indigo and ivory threads with a few gold, fanning in from the warp beam to the reed
  for (let x = r.x + p * 0.5, i = 0; x < r.x + r.w; x += p, i++) { const col = i % 11 === 0 ? '#d6a93a' : (i % 6 < 3 ? '#e9dfc8' : (i % 6 < 5 ? '#27406e' : '#e9dfc8')); thread(ctx, cx + (x - cx) * taper, beamY, x, g.reedT + g.h3, Math.max(1.1, p * 0.3), col, 0); }
  // the warp beam: a turned timber roll with the unwoven warp wound round it
  const bl = g.px0, br = g.px1; castShadow(ctx, bl, beamY, br, beamY, g.bw * 1.1, 1, g.bw * 0.5, 0.34);
  beam(ctx, bl - g.bw * 0.5, beamY, br + g.bw * 0.5, beamY, g.bw * 1.05, '#a87444', 41);
  const wx0 = cx - (r.w / 2) * taper - 2, wx1 = cx + (r.w / 2) * taper + 2; ctx.save(); ctx.beginPath(); ctx.rect(wx0, beamY - g.bw * 0.5, wx1 - wx0, g.bw); ctx.clip(); for (let x = wx0, i = 0; x < wx1; x += p * 1.2, i++) { ctx.fillStyle = i % 3 === 0 ? '#27406e' : '#ecdfc0'; ctx.fillRect(x, beamY - g.bw * 0.5, p * 1.1, g.bw); } const wg = ctx.createLinearGradient(0, beamY - g.bw / 2, 0, beamY + g.bw / 2); wg.addColorStop(0, 'rgba(255,255,255,0.45)'); wg.addColorStop(0.45, 'rgba(255,255,255,0)'); wg.addColorStop(1, 'rgba(0,0,0,0.45)'); ctx.fillStyle = wg; ctx.fillRect(wx0, beamY - g.bw * 0.5, wx1 - wx0, g.bw); ctx.restore();
}
export function maheshwariFrame(ctx, S) {
  if (S.card || S.lite) return;
  const g = mhGeom(S), { r, c, p, reedB, h1, h2, h3, beamY, a } = g, bw = g.bw;
  const x0 = r.x - c * 0.3, x1 = r.x + r.w + c * 0.3, rt = g.reedT, wy0 = rt + h3, wy1 = reedB - h1;
  // the batten hangs from the beam on two ropes: top rail with a hand grip, a window of cane reed, a heavy bottom rail on the cloth edge
  ctx.lineCap = 'round'; for (const x of [r.x + r.w * 0.06, r.x + r.w * 0.94]) { ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = Math.max(2, c * 0.07); ctx.beginPath(); ctx.moveTo(x + 2, beamY); ctx.lineTo(x + 2, rt + 2); ctx.stroke(); ctx.strokeStyle = '#d8c394'; ctx.lineWidth = Math.max(1.6, c * 0.055); ctx.beginPath(); ctx.moveTo(x, beamY); ctx.lineTo(x, rt); ctx.stroke(); ctx.strokeStyle = '#8a7648'; ctx.setLineDash([2, 2.5]); ctx.stroke(); ctx.setLineDash([]); }
  ctx.fillStyle = 'rgba(30,18,6,0.5)'; ctx.fillRect(x0, wy0, x1 - x0, wy1 - wy0); // dark behind the reed window
  ctx.save(); ctx.beginPath(); ctx.rect(x0, wy0, x1 - x0, wy1 - wy0); ctx.clip(); // warp passing through the cane teeth
  for (let x = r.x + p * 0.5, i = 0; x < r.x + r.w; x += p, i++) { ctx.fillStyle = i % 11 === 0 ? '#d6a93a' : (i % 6 < 3 ? '#e9dfc8' : (i % 6 < 5 ? '#27406e' : '#e9dfc8')); ctx.fillRect(x - p * 0.14, wy0, p * 0.3, wy1 - wy0); }
  ctx.fillStyle = 'rgba(238,222,176,0.9)'; for (let x = r.x + p; x < r.x + r.w; x += p * 2) ctx.fillRect(x - Math.max(0.5, p * 0.06), wy0, Math.max(1, p * 0.12), wy1 - wy0);
  ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(x0, wy0, x1 - x0, (wy1 - wy0) * 0.3);
  ctx.restore();
  for (const [yy, hh, col] of [[rt, h3, '#b07a46'], [reedB - h1, h1, '#9c6a3a']]) { castShadow(ctx, x0, yy + hh / 2, x1, yy + hh / 2, hh, 1, hh * 0.5, 0.3); beam(ctx, x0, yy + hh / 2, x1, yy + hh / 2, hh, col, yy | 0); }
  ctx.fillStyle = '#6a4220'; for (const x of [x0 + hh0(c), x1 - hh0(c)]) { roundRectPath(ctx, x - c * 0.1, rt - c * 0.06, c * 0.2, h3 + c * 0.1, c * 0.05); ctx.fill(); }
  // the breast beam: the cloth passes over a timber roll; the finished cloth rolls onto it, indigo and ivory stripes at the ends
  const by = r.y + r.h + c * 0.16; castShadow(ctx, x0 - c * 0.2, by, x1 + c * 0.2, by, c * 0.3, 1, c * 0.2, 0.34); beam(ctx, g.px0 - c * 0.1, by, g.px1 + c * 0.1, by, c * 0.3, '#a06c3c', 61);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, by - c * 0.15, r.w, c * 0.3); ctx.clip(); for (let x = r.x, i = 0; x < r.x + r.w; x += c * 0.16, i++) { ctx.fillStyle = i % 5 === 0 ? '#27406e' : '#efe6cf'; ctx.fillRect(x, by - c * 0.15, c * 0.16, c * 0.3); } const rg = ctx.createLinearGradient(0, by - c * 0.15, 0, by + c * 0.15); rg.addColorStop(0, 'rgba(255,255,255,0.4)'); rg.addColorStop(0.5, 'rgba(255,255,255,0)'); rg.addColorStop(1, 'rgba(0,0,0,0.5)'); ctx.fillStyle = rg; ctx.fillRect(r.x, by - c * 0.15, r.w, c * 0.3); ctx.restore();
  // the treadle pit in the terrace: a dark opening with a stone lip, two treadles and their cords
  const pit0 = by + c * 0.3, pitH = clamp(Math.min(g.m.b * 0.62, a.y + a.h - pit0 - c * 0.2), c * 0.5, c * 1.3), pw = r.w + c * 0.9, px = r.x - c * 0.45;
  if (pitH > c * 0.45) {
    ctx.save(); ctx.shadowColor = 'rgba(60,35,10,0.5)'; ctx.shadowBlur = c * 0.3; ctx.fillStyle = '#e0c79a'; roundRectPath(ctx, px - c * 0.1, pit0 - c * 0.08, pw + c * 0.2, pitH + c * 0.16, c * 0.14); ctx.fill(); ctx.restore();
    const pg = ctx.createLinearGradient(0, pit0, 0, pit0 + pitH); pg.addColorStop(0, '#120a05'); pg.addColorStop(1, '#3a2412'); ctx.fillStyle = pg; roundRectPath(ctx, px, pit0, pw, pitH, c * 0.1); ctx.fill();
    for (const k of [0, 1]) { const tx = px + pw * (0.28 + k * 0.44), ty = pit0 + pitH * 0.58, tl = pw * 0.2; castShadow(ctx, tx - tl / 2, ty, tx + tl / 2, ty, c * 0.2, 1, 3, 0.4); beam(ctx, tx - tl / 2, ty + (k ? 2 : -2), tx + tl / 2, ty + (k ? -2 : 2), Math.max(5, c * 0.2), k ? '#c08850' : '#a87440', 71 + k); ctx.strokeStyle = '#efe3c2'; ctx.lineWidth = Math.max(1.4, c * 0.04); ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + (k ? 4 : -4), pit0 - 1); ctx.stroke(); }
  }
}
const hh0 = (c) => c * 0.36;
export function maheshwariGround(ctx, S) {
  const r = S.rect, c = S.cell, p = Math.max(1.7, c / 10), bg = S.bg;
  clipTo(ctx, r);
  ctx.fillStyle = bg; ctx.fillRect(r.x, r.y, r.w, r.h);
  // plain weave: warp threads a touch lighter, weft a touch silkier, then the fine pinstripe check of the body
  ctx.beginPath(); for (let x = r.x + p * 0.5; x < r.x + r.w; x += p) { ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); } ctx.strokeStyle = rgba(shade(bg, 0.3), 0.3); ctx.lineWidth = p * 0.5; ctx.stroke();
  ctx.beginPath(); for (let y = r.y + p * 0.5; y < r.y + r.h; y += p) { ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); } ctx.strokeStyle = rgba(shade(bg, -0.3), 0.2); ctx.lineWidth = p * 0.36; ctx.stroke();
  const st = c * 0.5; ctx.beginPath(); for (let x = r.x + st; x < r.x + r.w; x += st) { ctx.moveTo(x - p, r.y); ctx.lineTo(x - p, r.y + r.h); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); } ctx.strokeStyle = 'rgba(38,64,110,0.22)'; ctx.lineWidth = p * 0.6; ctx.stroke();
  ctx.beginPath(); for (let y = r.y + st; y < r.y + r.h; y += st) { ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); } ctx.strokeStyle = 'rgba(38,64,110,0.14)'; ctx.lineWidth = p * 0.5; ctx.stroke();
  // reversible border: a broad indigo band with ivory stripes and a gold line, the same on both faces, top and bottom
  const bh = c * 0.42;
  for (const [yy, up] of [[r.y, 1], [r.y + r.h - bh, -1]]) {
    ctx.fillStyle = '#26407a'; ctx.fillRect(r.x, yy, r.w, bh);
    const sg = ctx.createLinearGradient(r.x, 0, r.x + r.w, 0); sg.addColorStop(0, 'rgba(255,255,255,0.06)'); sg.addColorStop(1, 'rgba(0,0,0,0.2)'); ctx.fillStyle = sg; ctx.fillRect(r.x, yy, r.w, bh);
    ctx.beginPath(); for (let x = r.x + p * 0.5; x < r.x + r.w; x += p) { ctx.moveTo(x, yy); ctx.lineTo(x, yy + bh); } ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = p * 0.35; ctx.stroke();
    ctx.fillStyle = '#efe6cf'; ctx.fillRect(r.x, yy + bh * 0.2, r.w, Math.max(1.2, bh * 0.08)); ctx.fillRect(r.x, yy + bh * 0.62, r.w, Math.max(1.2, bh * 0.08));
    ctx.fillStyle = '#d6a93a'; ctx.fillRect(r.x, yy + bh * 0.4, r.w, Math.max(1.4, bh * 0.1)); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(r.x, yy + bh * 0.4, r.w, Math.max(0.6, bh * 0.03));
    ctx.fillStyle = '#d6a93a'; ctx.fillRect(r.x, up > 0 ? yy + bh : yy - Math.max(1.2, bh * 0.07), r.w, Math.max(1.2, bh * 0.07));
  }
  ctx.fillStyle = 'rgba(38,64,110,0.85)'; ctx.fillRect(r.x, r.y, Math.max(2, c * 0.05), r.h); ctx.fillRect(r.x + r.w - Math.max(2, c * 0.05), r.y, Math.max(2, c * 0.05), r.h);
  ctx.restore();
}
export function maheshwariOver(ctx, S) {
  const r = S.rect, c = S.cell;
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,246,222,0.14)'); g.addColorStop(0.5, 'rgba(255,246,222,0)'); g.addColorStop(1, 'rgba(10,20,40,0.22)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  const e = Math.max(4, c * 0.4); const h = ctx.createLinearGradient(0, r.y, 0, r.y + e); h.addColorStop(0, 'rgba(0,0,0,0.28)'); h.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = h; ctx.fillRect(r.x, r.y, r.w, e);
}
// chatai check: two-colour little squares like a woven mat, warp-faced and weft-faced squares side by side; stripe cords for the line motifs
export function chatSkin(ctx, S, d) {
  const { kind, col, x, y, s } = d, fill = isFilled(kind), lt = lum(col) > 0.6, c2 = lt ? shade(col, -0.4) : mix(col, '#f3ead3', 0.74);
  ctx.lineJoin = 'round';
  if (!fill) {
    const w = Math.max(2.6, lineWidthOf(kind, s) * 0.85); ctx.lineCap = 'butt';
    const pth = (dx, dy) => motifPath(ctx, kind, x + dx, y + dy, s);
    pth(w * 0.15, w * 0.32); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = w * 1.25; ctx.stroke();
    pth(0, 0); ctx.strokeStyle = shade(col, -0.5); ctx.lineWidth = w * 1.1; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
    ctx.setLineDash([w * 0.85, w * 0.85]); ctx.strokeStyle = c2; ctx.lineWidth = w * 0.52; ctx.stroke(); ctx.setLineDash([]);
    pth(-w * 0.1, -w * 0.25); ctx.strokeStyle = rgba(shade(col, 0.7), 0.7); ctx.lineWidth = Math.max(0.6, w * 0.16); ctx.stroke();
    return;
  }
  const n = 6, q = (s * 1.1) / n, x0 = x - (n * q) / 2, y0 = y - (n * q) / 2;
  ctx.save(); motifPath(ctx, kind, x, y, s * 1.04); ctx.fillStyle = shade(col, -0.5); ctx.fill(); ctx.clip();
  ctx.beginPath(); for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if ((i + j) % 2 === 0) ctx.rect(x0 + i * q, y0 + j * q, q, q); ctx.fillStyle = col; ctx.fill();
  ctx.beginPath(); for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if ((i + j) % 2) ctx.rect(x0 + i * q, y0 + j * q, q, q); ctx.fillStyle = c2; ctx.fill();
  // threads in each square: vertical in one colour's squares, horizontal in the other's
  ctx.lineWidth = Math.max(0.6, q * 0.1); ctx.beginPath(); for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const xs = x0 + i * q, ys = y0 + j * q; if ((i + j) % 2 === 0) for (let k = 1; k < 4; k++) { ctx.moveTo(xs + (q * k) / 4, ys); ctx.lineTo(xs + (q * k) / 4, ys + q); } else for (let k = 1; k < 4; k++) { ctx.moveTo(xs, ys + (q * k) / 4); ctx.lineTo(xs + q, ys + (q * k) / 4); } } ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.stroke();
  ctx.lineWidth = Math.max(0.5, q * 0.07); ctx.beginPath(); for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const xs = x0 + i * q, ys = y0 + j * q; if ((i + j) % 2 === 0) { ctx.moveTo(xs + q * 0.12, ys); ctx.lineTo(xs + q * 0.12, ys + q); } else { ctx.moveTo(xs, ys + q * 0.12); ctx.lineTo(xs + q, ys + q * 0.12); } } ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.stroke();
  // square joins and a silk sheen across
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = Math.max(0.6, q * 0.07); ctx.beginPath(); for (let k = 1; k < n; k++) { ctx.moveTo(x0 + k * q, y0); ctx.lineTo(x0 + k * q, y0 + n * q); ctx.moveTo(x0, y0 + k * q); ctx.lineTo(x0 + n * q, y0 + k * q); } ctx.stroke();
  const sg = ctx.createLinearGradient(x - s / 2, y - s / 2, x + s / 2, y + s / 2); sg.addColorStop(0, 'rgba(255,250,235,0.3)'); sg.addColorStop(0.45, 'rgba(255,250,235,0)'); sg.addColorStop(1, 'rgba(0,0,0,0.3)'); ctx.fillStyle = sg; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  ctx.restore();
  ctx.save(); motifPath(ctx, kind, x, y, s * 1.04); ctx.strokeStyle = rgba(shade(col, -0.65), 0.75); ctx.lineWidth = Math.max(0.9, s * 0.03); ctx.stroke(); ctx.strokeStyle = '#d6a93a'; ctx.lineWidth = Math.max(0.6, s * 0.014); ctx.stroke(); ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// MUGA: golden Assam silk on a bamboo and timber handloom, on the veranda of a stilt house above green hills; red and ivory supplementary-weft motifs
// ---------------------------------------------------------------------------------------------------------------------------------------------------
function palm(ctx, x, yb, h, c, seed) { // a slender areca palm: ringed trunk, a crown of drooping fronds
  ctx.fillStyle = '#4a5a30'; ctx.beginPath(); ctx.moveTo(x - c * 0.07, yb); ctx.lineTo(x - c * 0.045, yb - h); ctx.lineTo(x + c * 0.045, yb - h); ctx.lineTo(x + c * 0.07, yb); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(30,40,15,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); for (let y = yb; y > yb - h; y -= c * 0.2) { ctx.moveTo(x - c * 0.06, y); ctx.lineTo(x + c * 0.06, y); } ctx.stroke();
  ctx.lineCap = 'round'; for (let k = 0; k < 7; k++) { const a = -2.6 + k * 0.38 + (hash(seed, k) - 0.5) * 0.2, L = c * (1.2 + hash(seed, k, 2) * 0.5), ex = x + Math.cos(a) * L, ey = yb - h + Math.sin(a) * L * 0.35 + L * 0.45; ctx.strokeStyle = k % 2 ? '#3a6a34' : '#4a7c3c'; ctx.lineWidth = Math.max(2, c * 0.1); ctx.beginPath(); ctx.moveTo(x, yb - h); ctx.quadraticCurveTo(x + Math.cos(a) * L * 0.6, yb - h + Math.sin(a) * L * 0.5 - c * 0.2, ex, ey); ctx.stroke(); }
}
export function mugaEnv(ctx, S) {
  const a = S.area, B = S.box, c = S.cell, X0 = a.x - 12, W = a.w + 24;
  const yR = B.y + B.h * 0.72, yTh = B.y + B.h * 0.1;
  let g = ctx.createLinearGradient(0, a.y, 0, yR); g.addColorStop(0, '#bcd9d2'); g.addColorStop(0.5, '#e8efd9'); g.addColorStop(1, '#f6f1d6'); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, yR - a.y + 2);
  clipTo(ctx, { x: X0, y: a.y, w: W, h: a.h });
  glow(ctx, B.x + B.w * 0.2, B.y + B.h * 0.05, Math.max(B.w, B.h) * 0.8, '#fff3c4', 0.5);
  // three ridges of green hills with mist between them
  const ridges = [['#9cbaa6', 0.3, 0.07, 1.0], ['#6f9f72', 0.4, 0.09, 1.9], ['#3f7648', 0.5, 0.1, 2.7]];
  for (let k = 0; k < ridges.length; k++) {
    const [col, base, amp, ph] = ridges[k], yb = B.y + B.h * (base + (S.area.w > S.area.h * 1.15 ? 0 : 0));
    g = ctx.createLinearGradient(0, yb - B.h * amp, 0, yR); g.addColorStop(0, col); g.addColorStop(1, shade(col, -0.25)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(X0, yR);
    for (let i = 0; i <= 28; i++) { const t = i / 28, x = X0 + W * t; ctx.lineTo(x, yb - B.h * amp * (0.55 + 0.45 * Math.sin(t * 7 + ph) * Math.cos(t * 3 + ph * 2))); } ctx.lineTo(X0 + W, yR); ctx.closePath(); ctx.fill();
    const mg = ctx.createLinearGradient(0, yb - B.h * 0.02, 0, yb + B.h * 0.14); mg.addColorStop(0, 'rgba(255,255,245,0)'); mg.addColorStop(0.5, `rgba(255,255,245,${0.3 - k * 0.07})`); mg.addColorStop(1, 'rgba(255,255,245,0)'); ctx.fillStyle = mg; ctx.fillRect(X0, yb - B.h * 0.02, W, B.h * 0.16);
  }
  // tea-garden terraces on the near ridge: faint curved rows of bushes
  ctx.strokeStyle = 'rgba(190,225,150,0.28)'; ctx.lineWidth = Math.max(1.2, c * 0.05); for (let k = 0; k < 6; k++) { ctx.beginPath(); const y = B.y + B.h * (0.56 + k * 0.025); ctx.moveTo(X0, y + 6); ctx.quadraticCurveTo(X0 + W * 0.5, y - 12 - k * 3, X0 + W, y + 8); ctx.stroke(); }
  palm(ctx, B.x + B.w * 0.05, yR, B.h * 0.4, c, 3); palm(ctx, B.x + B.w * 0.95, yR + c * 0.1, B.h * 0.46, c, 8);
  // banana leaves at the right edge
  ctx.fillStyle = '#58993c'; for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(B.x + B.w * 0.99, yR); ctx.rotate(-1.9 - k * 0.45); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(c * 0.8, -c * 0.7, c * 2.1, -c * 0.1); ctx.quadraticCurveTo(c * 0.9, c * 0.2, 0, 0); ctx.fill(); ctx.restore(); }
  // thatch eave across the top: layered straw bundles, a dark shaded underside
  const tb = yTh; g = ctx.createLinearGradient(0, a.y, 0, tb + c * 0.5); g.addColorStop(0, '#9a7a2c'); g.addColorStop(1, '#d6b255'); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, tb + c * 0.5 - a.y);
  ctx.strokeStyle = 'rgba(70,45,10,0.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let x = X0; x < X0 + W; x += c * 0.14) { const j = hash(x | 0, 2) * c * 0.3; ctx.moveTo(x, tb - c * 0.9 + j); ctx.lineTo(x + c * 0.03, tb + c * 0.5); } ctx.stroke();
  ctx.strokeStyle = 'rgba(255,235,160,0.3)'; ctx.beginPath(); for (let x = X0 + 2; x < X0 + W; x += c * 0.27) { ctx.moveTo(x, tb - c * 0.6); ctx.lineTo(x, tb + c * 0.45); } ctx.stroke();
  for (let k = 0; k < 4; k++) { ctx.fillStyle = `rgba(60,38,8,${0.16 - k * 0.03})`; ctx.fillRect(X0, tb + c * 0.5 + k * c * 0.12, W, c * 0.12); }
  ctx.fillStyle = '#7a5a20'; ctx.fillRect(X0, tb + c * 0.44, W, c * 0.1); // eave edge
  for (let x = X0 + c * 0.1; x < X0 + W; x += c * 0.34) { ctx.fillStyle = 'rgba(70,45,10,0.5)'; ctx.fillRect(x, tb + c * 0.5, c * 0.04, c * (0.1 + hash(x | 0, 3) * 0.18)); } // straw ends
  // bamboo railing along the veranda edge: a top rail, a middle rail, close balusters
  const rh = c * 0.2; for (const yy of [yR - c * 0.9, yR - c * 0.45]) { castShadow(ctx, X0, yy, X0 + W, yy, rh, 1, rh * 0.5, 0.2); bambooH(ctx, X0, X0 + W, yy, rh, yy | 0); }
  for (let x = X0 + c * 0.2; x < X0 + W; x += c * 0.55) { rod(ctx, x, yR - c * 0.9, x, yR + c * 0.05, c * 0.1, '#a9ad5c', 'butt'); }
  // floor: split-bamboo slats, a dark gap showing the open space under the stilt house
  g = ctx.createLinearGradient(0, yR, 0, a.y + a.h); g.addColorStop(0, '#c7a85c'); g.addColorStop(1, '#8f7336'); ctx.fillStyle = g; ctx.fillRect(X0, yR, W, a.y + a.h - yR + 12);
  const sw = c * 0.42; for (let x = X0, i = 0; x < X0 + W; x += sw, i++) { ctx.fillStyle = `rgba(${hash(i, 4) > 0.5 ? '255,235,160' : '60,40,8'},${0.12 + hash(i, 5) * 0.1})`; ctx.fillRect(x, yR, sw, a.y + a.h - yR); ctx.fillStyle = 'rgba(30,18,4,0.7)'; ctx.fillRect(x + sw - 1.4, yR, 1.6, a.y + a.h - yR); }
  ctx.fillStyle = 'rgba(30,18,4,0.4)'; for (const f of [0.18, 0.55]) ctx.fillRect(X0, yR + (a.y + a.h - yR) * f, W, c * 0.1); // cross-ties
  ctx.fillStyle = '#7a5a28'; ctx.fillRect(X0, yR - c * 0.06, W, c * 0.14); ctx.fillStyle = 'rgba(255,240,180,0.45)'; ctx.fillRect(X0, yR - c * 0.06, W, Math.max(1.4, c * 0.04));
  vignette(ctx, a, 0.2);
  ctx.restore();
}
function mgGeom(S) {
  const { a, r, c, m } = G(S), avail = Math.max(c * 0.9, m.t - c * 0.1), px0 = r.x - c * 0.5, px1 = r.x + r.w + c * 0.5;
  const rh = Math.min(c * 0.62, avail * 0.3), reedB = r.y - c * 0.04, reedT = reedB - rh, hedY = reedT - Math.min(c * 0.62, avail * 0.3), beamY = hedY - Math.max(c * 0.32, avail * 0.2);
  return { a, r, c, m, px0, px1, rh, reedB, reedT, hedY, beamY, p: Math.max(2.4, c / 5), pw: Math.max(8, c * 0.3), cx: r.x + r.w / 2 };
}
export function mugaUnder(ctx, S) {
  if (S.card || S.lite) return;
  const g = mgGeom(S), { r, c, p, a, beamY, hedY } = g, bot = a.y + a.h;
  // two timber posts with dark grain, a lashing of cane at the head
  for (const x of [g.px0, g.px1]) { castShadow(ctx, x, beamY, x, bot, g.pw, g.pw * 0.7, g.pw * 0.15, 0.3); beam(ctx, x, beamY - g.pw * 0.5, x, bot, g.pw, '#7a4a28', Math.floor(x)); }
  // the warp: straight golden threads from the warp beam, a few ivory ones
  for (let x = r.x + p * 0.5, i = 0; x < r.x + r.w; x += p, i++) thread(ctx, x, beamY, x, r.y + 2, Math.max(1.1, p * 0.3), i % 13 === 0 ? '#efe6cc' : (i % 3 ? '#e2b53a' : '#cf9f26'), 0);
  // the top beam: a thick bamboo with nodes and cane lashings where it meets the posts
  castShadow(ctx, g.px0, beamY, g.px1, beamY, g.pw, 1, g.pw * 0.6, 0.3); bambooH(ctx, g.px0 - g.pw * 0.5, g.px1 + g.pw * 0.5, beamY, g.pw * 1.05, 91);
  ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = Math.max(1.4, g.pw * 0.14); ctx.beginPath(); for (const x of [g.px0, g.px1]) for (let k = -3; k <= 3; k++) { ctx.moveTo(x - g.pw * 0.55, beamY - g.pw * 0.5 + k * g.pw * 0.17); ctx.lineTo(x + g.pw * 0.55, beamY - g.pw * 0.38 + k * g.pw * 0.17); } ctx.stroke();
  // string heddles: loops of white cotton threaded on a slim bamboo rod, hanging down to the warp
  const hr = hedY - c * 0.06; rod(ctx, r.x - c * 0.1, hedY - c * 0.1, r.x + r.w + c * 0.1, hedY - c * 0.1, Math.max(3, c * 0.09), '#c3b266');
  ctx.strokeStyle = 'rgba(245,238,215,0.92)'; ctx.lineWidth = Math.max(1, c * 0.025); ctx.beginPath(); for (let x = r.x + p * 1.0; x < r.x + r.w; x += p * 2) { ctx.moveTo(x, hr + c * 0.02); ctx.ellipse(x, hr + c * 0.2, p * 0.5, c * 0.18, 0, -Math.PI / 2, Math.PI * 1.5); } ctx.stroke();
}
export function mugaFrame(ctx, S) {
  if (S.card || S.lite) return;
  const g = mgGeom(S), { r, c, p, a, m, reedT, reedB } = g, x0 = r.x - c * 0.28, x1 = r.x + r.w + c * 0.28, bot = r.y + r.h, th = Math.max(6, c * 0.2);
  // the bamboo reed in its swing batten: pale cane teeth between a top and bottom rail, the warp passing through; two timber arms hang it from the top beam
  for (const x of [x0 + th * 0.4, x1 - th * 0.4]) { castShadow(ctx, x, g.beamY, x, reedB, th * 0.7, th * 0.4, th * 0.2, 0.26); beam(ctx, x, g.beamY, x, reedB, th * 0.7, '#7a4a28', Math.floor(x) + 3); }
  ctx.fillStyle = 'rgba(40,26,6,0.55)'; ctx.fillRect(x0, reedT + th * 0.5, x1 - x0, reedB - reedT - th);
  ctx.save(); ctx.beginPath(); ctx.rect(x0, reedT + th * 0.5, x1 - x0, reedB - reedT - th); ctx.clip();
  for (let x = r.x + p * 0.5, i = 0; x < r.x + r.w; x += p, i++) { ctx.fillStyle = i % 13 === 0 ? '#efe6cc' : (i % 3 ? '#e2b53a' : '#cf9f26'); ctx.fillRect(x - p * 0.14, reedT, p * 0.3, reedB - reedT); }
  ctx.fillStyle = 'rgba(244,232,180,0.95)'; for (let x = r.x + p; x < r.x + r.w; x += p * 2) ctx.fillRect(x - Math.max(0.5, p * 0.06), reedT, Math.max(1, p * 0.12), reedB - reedT);
  ctx.restore();
  for (const y of [reedT + th * 0.35, reedB - th * 0.35]) { castShadow(ctx, x0, y, x1, y, th, 1, th * 0.5, 0.3); bambooH(ctx, x0, x1, y, th, y | 0); }
  // breast beam: a bamboo roll with the finished golden cloth wound on, red edge stripes
  const by = bot + c * 0.16; castShadow(ctx, g.px0, by, g.px1, by, c * 0.32, 1, c * 0.2, 0.34); bambooH(ctx, g.px0 - c * 0.1, g.px1 + c * 0.1, by, c * 0.32, 77);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, by - c * 0.17, r.w, c * 0.34); ctx.clip(); ctx.fillStyle = '#d3a02c'; ctx.fillRect(r.x, by - c * 0.17, r.w, c * 0.34); ctx.fillStyle = '#a4271f'; ctx.fillRect(r.x, by - c * 0.1, r.w, c * 0.06); ctx.fillRect(r.x, by + c * 0.06, r.w, c * 0.06); const rg = ctx.createLinearGradient(0, by - c * 0.17, 0, by + c * 0.17); rg.addColorStop(0, 'rgba(255,255,255,0.45)'); rg.addColorStop(0.4, 'rgba(255,255,255,0)'); rg.addColorStop(1, 'rgba(0,0,0,0.5)'); ctx.fillStyle = rg; ctx.fillRect(r.x, by - c * 0.17, r.w, c * 0.34); ctx.restore();
  // a coiled bamboo basket of golden cocoons on the floor, and a small bamboo tray
  const fy = a.y + a.h, bsy = Math.min(fy - c * 0.35, by + Math.max(c * 0.75, m.b * 0.6)), bxp = r.x + r.w * 0.16, br = Math.min(c * 0.55, (fy - bsy) * 0.9 + c * 0.2);
  if (m.b > c * 1.15) {
    softE(ctx, bxp + br * 0.2, bsy + br * 0.45, br * 1.15, br * 0.3, 0.32);
    const bg = ctx.createLinearGradient(bxp - br, 0, bxp + br, 0); bg.addColorStop(0, '#d9bd70'); bg.addColorStop(0.5, '#b8964a'); bg.addColorStop(1, '#6a4e1c'); ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(bxp - br, bsy - br * 0.2); ctx.quadraticCurveTo(bxp - br * 0.9, bsy + br * 0.55, bxp - br * 0.55, bsy + br * 0.55); ctx.lineTo(bxp + br * 0.55, bsy + br * 0.55); ctx.quadraticCurveTo(bxp + br * 0.9, bsy + br * 0.55, bxp + br, bsy - br * 0.2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(60,40,8,0.45)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 1; k < 4; k++) { const y = bsy - br * 0.2 + k * br * 0.2; ctx.moveTo(bxp - br * (1 - k * 0.08), y); ctx.lineTo(bxp + br * (1 - k * 0.08), y); } ctx.stroke();
    for (let k = 0; k < 7; k++) { const cx2 = bxp + (hash(k, 11) - 0.5) * br * 1.5, cy2 = bsy - br * 0.28 - hash(k, 12) * br * 0.3, rr = br * 0.26; const cg = ctx.createRadialGradient(cx2 - rr * 0.3, cy2 - rr * 0.35, 1, cx2, cy2, rr * 1.1); cg.addColorStop(0, '#f6da78'); cg.addColorStop(0.7, '#d9a62a'); cg.addColorStop(1, '#8a5e12'); ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(cx2, cy2, rr * 0.8, rr, hash(k, 13) - 0.5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = bg; ctx.fillRect(bxp - br * 1.02, bsy - br * 0.1, br * 2.04, br * 0.14);
  }
}
export function mugaGround(ctx, S) {
  const r = S.rect, c = S.cell, p = Math.max(1.7, c / 9), bg = S.bg;
  clipTo(ctx, r);
  ctx.fillStyle = shade(bg, -0.24); ctx.fillRect(r.x, r.y, r.w, r.h);
  // dense glossy silk: weft ridges alternating light and shade, fine warp lines, long soft sheen bands
  ctx.beginPath(); for (let y = r.y; y < r.y + r.h; y += p * 1.0) { ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); } ctx.strokeStyle = rgba(shade(bg, 0.3), 0.2); ctx.lineWidth = p * 0.46; ctx.stroke();
  ctx.beginPath(); for (let y = r.y + p * 0.5; y < r.y + r.h; y += p * 1.0) { ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); } ctx.strokeStyle = rgba(shade(bg, -0.45), 0.26); ctx.lineWidth = p * 0.4; ctx.stroke();
  if (!S.lite) { ctx.beginPath(); for (let x = r.x + p * 0.5; x < r.x + r.w; x += p) { ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); } ctx.strokeStyle = rgba(shade(bg, -0.3), 0.1); ctx.lineWidth = p * 0.3; ctx.stroke(); }
  for (const [f, w, al] of [[0.16, 0.1, 0.22], [0.5, 0.2, 0.28], [0.84, 0.09, 0.16]]) { const gx = r.x + r.w * f, sg = ctx.createLinearGradient(gx - r.w * w, r.y, gx + r.w * w + r.h * 0.4, r.y + r.h); sg.addColorStop(0, 'rgba(255,240,170,0)'); sg.addColorStop(0.5, `rgba(255,242,180,${al})`); sg.addColorStop(1, 'rgba(255,240,170,0)'); ctx.fillStyle = sg; ctx.fillRect(r.x, r.y, r.w, r.h); }
  const dg = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); dg.addColorStop(0, 'rgba(255,230,150,0.08)'); dg.addColorStop(1, 'rgba(70,35,0,0.3)'); ctx.fillStyle = dg; ctx.fillRect(r.x, r.y, r.w, r.h);
  // red borders (mekhela style): a red band with an ivory zigzag and gold-green lines, top and bottom, and dark selvage
  const bh = c * 0.4;
  for (const [yy, up] of [[r.y, 1], [r.y + r.h - bh, -1]]) {
    const rg = ctx.createLinearGradient(0, yy, 0, yy + bh); rg.addColorStop(0, '#c4362a'); rg.addColorStop(0.55, '#9a1f18'); rg.addColorStop(1, '#6a120e'); ctx.fillStyle = rg; ctx.fillRect(r.x, yy, r.w, bh);
    ctx.beginPath(); for (let x = r.x + p * 0.5; x < r.x + r.w; x += p) { ctx.moveTo(x, yy); ctx.lineTo(x, yy + bh); } ctx.strokeStyle = 'rgba(255,200,170,0.1)'; ctx.lineWidth = p * 0.4; ctx.stroke();
    ctx.strokeStyle = '#f3ead2'; ctx.lineWidth = Math.max(1.2, bh * 0.1); ctx.beginPath(); for (let x = r.x; x < r.x + r.w; x += bh * 0.62) { ctx.moveTo(x, yy + bh * 0.72); ctx.lineTo(x + bh * 0.31, yy + bh * 0.28); ctx.lineTo(x + bh * 0.62, yy + bh * 0.72); } ctx.stroke();
    ctx.fillStyle = '#e8b83a'; ctx.fillRect(r.x, yy + bh * 0.06, r.w, Math.max(1.2, bh * 0.07)); ctx.fillRect(r.x, yy + bh * 0.88, r.w, Math.max(1.2, bh * 0.07));
    ctx.fillStyle = '#3d7a3c'; ctx.fillRect(r.x, up > 0 ? yy + bh : yy - Math.max(1.4, bh * 0.08), r.w, Math.max(1.4, bh * 0.08));
  }
  ctx.fillStyle = 'rgba(70,35,0,0.55)'; ctx.fillRect(r.x, r.y, Math.max(1.8, c * 0.04), r.h); ctx.fillRect(r.x + r.w - Math.max(1.8, c * 0.04), r.y, Math.max(1.8, c * 0.04), r.h);
  ctx.restore();
}
export function mugaOver(ctx, S) {
  const r = S.rect, c = S.cell;
  const g = ctx.createLinearGradient(r.x, r.y + r.h * 0.2, r.x + r.w, r.y + r.h * 0.7); g.addColorStop(0, 'rgba(255,246,200,0)'); g.addColorStop(0.35, 'rgba(255,240,170,0.12)'); g.addColorStop(0.5, 'rgba(255,240,170,0)'); g.addColorStop(0.75, 'rgba(255,240,170,0.08)'); g.addColorStop(1, 'rgba(255,246,200,0)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  const e = Math.max(4, c * 0.4); const h = ctx.createLinearGradient(0, r.y, 0, r.y + e); h.addColorStop(0, 'rgba(0,0,0,0.26)'); h.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = h; ctx.fillRect(r.x, r.y, r.w, e);
}
// supplementary-weft motif: thick, plump, overlapping floats of glossy silk standing proud of the golden ground, with tie-down dots and a raised shadow
export function mugaSkin(ctx, S, d) {
  const { kind, col, x, y, s } = d, fill = isFilled(kind), p = Math.max(1.6, s / 9.5);
  ctx.lineJoin = 'round';
  if (!fill) {
    const w = Math.max(2.6, lineWidthOf(kind, s) * 0.8); ctx.lineCap = 'round';
    const pth = (dx, dy) => motifPath(ctx, kind, x + dx, y + dy, s);
    pth(w * 0.25, w * 0.5); ctx.strokeStyle = 'rgba(60,30,0,0.4)'; ctx.lineWidth = w * 1.35; ctx.stroke();
    pth(0, 0); ctx.strokeStyle = shade(col, -0.5); ctx.lineWidth = w * 1.1; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w * 0.86; ctx.stroke();
    ctx.setLineDash([w * 0.18, w * 0.42]); ctx.strokeStyle = rgba(shade(col, -0.55), 0.7); ctx.lineWidth = w * 0.86; ctx.stroke(); ctx.setLineDash([]);
    pth(-w * 0.12, -w * 0.28); ctx.strokeStyle = rgba(shade(col, 0.8), 0.9); ctx.lineWidth = Math.max(0.7, w * 0.2); ctx.stroke();
    return;
  }
  const s2 = s * 1.1;
  motifPath(ctx, kind, x + p * 0.3, y + p * 0.55, s2); ctx.fillStyle = 'rgba(60,30,0,0.32)'; ctx.fill();
  motifPath(ctx, kind, x, y, s2); ctx.fillStyle = shade(col, -0.35); ctx.fill();
  const segs = motifRows(ctx, kind, x, y, s2, p * 0.86, p * 4.6, -p * 0.2), ev = segs.filter((q, i) => Math.round((q[1] - y) / (p * 0.86)) % 2 === 0), od = segs.filter((q) => !ev.includes(q));
  floats(ctx, ev, p * 0.98, shade(col, 0.06), { sh: 0.2, hi: 0.9 }); floats(ctx, od, p * 0.98, shade(col, -0.05), { sh: 0.2, hi: 0.8 });
  ctx.fillStyle = rgba(shade(col, -0.65), 0.6); ctx.beginPath(); for (const q of segs) { ctx.rect(q[0] + (q[2] - q[0]) * 0.5, q[1] - p * 0.08, Math.max(0.8, p * 0.16), Math.max(0.8, p * 0.16)); } ctx.fill();
  const og = ctx.createRadialGradient(x - s * 0.2, y - s * 0.25, s * 0.05, x, y, s * 0.7); og.addColorStop(0, 'rgba(255,248,215,0.28)'); og.addColorStop(1, 'rgba(30,10,0,0.25)'); ctx.save(); motifPath(ctx, kind, x, y, s2); ctx.clip(); ctx.fillStyle = og; ctx.fillRect(x - s, y - s, s * 2, s * 2); ctx.restore();
  motifPath(ctx, kind, x, y, s2); ctx.strokeStyle = rgba(shade(col, -0.7), 0.7); ctx.lineWidth = Math.max(0.9, s * 0.028); ctx.stroke(); ctx.strokeStyle = rgba('#f4d36a', 0.55); ctx.lineWidth = Math.max(0.6, s * 0.012); ctx.stroke();
}

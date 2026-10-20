// Scene art, 1.13.0 (silk saris), part 1: banarasi (kadhua brocade, jacquard card chain, fly shuttle, dawn river bank) and
// kanchipuram (korvai silk, heavy reed, three shuttles, pillared verandah). Pure canvas 2D, no Math.random (hash only).
// No human figures, no religious symbols, no places of worship, text-free art.
import { hash, rgba, mix, shade, lum, roundRectPath, rod, ball, speck, lines, glow, vignette, TAU, motifPath, isFilled, lineWidthOf, clamp, sheenLine, POT } from './scene-kit.js';
import { TOOLS } from './scene-tools.js';
import { beam, castShadow, thread, margins, isLand } from './scene-loom.js';

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// shared bits
// ---------------------------------------------------------------------------------------------------------------------------------------------------
export const geo = (S) => ({ a: S.area, r: S.rect, c: S.cell, m: margins(S), land: isLand(S), b: S.box });
const softE = (ctx, x, y, rx, ry, a = 0.3) => { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); };
const pressOf = (T) => Math.max(0, 1 - T.a / 0.45);
const bx = (b) => ({ cx: b.x + b.w / 2, cy: b.y + b.h / 2, r: Math.min(b.w, b.h) / 2 });
export function ringSel(ctx, S, b, on) {
  ctx.save(); ctx.strokeStyle = on ? S.pal.accent : 'rgba(255,255,255,0.28)'; ctx.lineWidth = on ? 4 : 1.5; roundRectPath(ctx, b.x, b.y, b.w, b.h, 12); ctx.stroke();
  if (on) { ctx.fillStyle = S.pal.accent; ctx.beginPath(); ctx.arc(b.x + b.w - 7, b.y + 7, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x + b.w - 9.5, b.y + 7); ctx.lineTo(b.x + b.w - 7.2, b.y + 9.2); ctx.lineTo(b.x + b.w - 4.4, b.y + 4.8); ctx.stroke(); }
  ctx.restore();
}
export function backTile(ctx, b, c, a = 0.5) { ctx.save(); roundRectPath(ctx, b.x, b.y, b.w, b.h, 12); ctx.fillStyle = rgba(c, a); ctx.fill(); ctx.restore(); }
// a horizontal lit bar (rail, batten, beam with a rounded section): bright top, dark underside
export function hbar(ctx, x1, y, x2, h, col, r = 2) {
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, shade(col, 0.4)); g.addColorStop(0.3, col); g.addColorStop(1, shade(col, -0.55));
  ctx.fillStyle = g; roundRectPath(ctx, x1, y, x2 - x1, h, Math.min(r, h / 2)); ctx.fill();
  ctx.fillStyle = rgba(shade(col, 0.8), 0.45); ctx.fillRect(x1 + r, y + h * 0.14, Math.max(0, x2 - x1 - 2 * r), Math.max(1, h * 0.09));
}
export function vbar(ctx, x, y1, w, y2, col, r = 2) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, shade(col, 0.4)); g.addColorStop(0.35, col); g.addColorStop(1, shade(col, -0.55));
  ctx.fillStyle = g; roundRectPath(ctx, x, y1, w, y2 - y1, Math.min(r, w / 2)); ctx.fill();
  ctx.fillStyle = rgba(shade(col, 0.8), 0.4); ctx.fillRect(x + w * 0.16, y1 + r, Math.max(1, w * 0.08), Math.max(0, y2 - y1 - 2 * r));
}
const brassStud = (ctx, x, y, r) => { ball(ctx, x, y, r, '#d4aa4a', false); };
// the glossy look of silk wound on something: n turns of a thread across a rectangle, lit from the left
function wound(ctx, x, y, w, h, col, n, dir = 'h') {
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n, tone = k % 2 ? 0.1 : -0.1;
    ctx.fillStyle = shade(col, tone + (hash(k, 3) - 0.5) * 0.08);
    if (dir === 'h') ctx.fillRect(x, y + t * h - h / n / 2, w, h / n * 0.92); else ctx.fillRect(x + t * w - w / n / 2, y, w / n * 0.92, h);
  }
  const g = ctx.createLinearGradient(dir === 'h' ? x : x, dir === 'h' ? y : y, dir === 'h' ? x + w : x, dir === 'h' ? y : y + h);
  g.addColorStop(0, 'rgba(255,255,255,0.05)'); g.addColorStop(0.3, 'rgba(255,255,255,0.55)'); g.addColorStop(0.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
}

// ===================================================================================================================================================
// BANARASI: a pit loom under a jacquard card chain and a fly-shuttle sley, on a river bank at dawn (blue-grey mist, low warm sun, plain stone steps)
// ===================================================================================================================================================
export const BAN_TEAK = '#4a2a18';
const BAN_BRASS = '#d9b04e';
function banDims(S) {
  const { a, r, c, m, land, b } = geo(S), pw = Math.max(9, c * 0.4), inset = Math.max(pw * 0.9, Math.min(m.l, m.r) * 0.5);
  const lx = Math.max(a.x + pw * 0.6, r.x - inset), rx = Math.min(a.x + a.w - pw * 0.6, r.x + r.w + inset);
  const H = r.y - b.y, ty = b.y + Math.max(c * 0.25, Math.min(c * 0.45, H * 0.16));
  const hy = r.y - Math.min(c * 0.55, Math.max(c * 0.3, H * 0.22)), bot = r.y + r.h;
  return { a, r, c, m, land, b, pw, lx, rx, ty, hy, bot, H };
}
export function banEnv(ctx, S) {
  const a = S.area, b = S.box, c = S.cell, X0 = a.x - 12, W = a.w + 24, t = S.t || 0, land = isLand(S);
  const Ht = Math.max(0, S.rect.y - b.y);
  const hz = land ? b.y + b.h * 0.3 : b.y + Ht * 0.34, rb = land ? hz + b.h * 0.2 : b.y + Ht * 0.97, tt = rb + b.h * (land ? 0.17 : 0.1), top = a.y, bottom = a.y + a.h;
  // dawn sky, cold at the top, a warm pearly band at the horizon
  let g = ctx.createLinearGradient(0, top, 0, hz); g.addColorStop(0, '#566e8a'); g.addColorStop(0.55, '#97aabd'); g.addColorStop(1, '#f1d3b2'); ctx.fillStyle = g; ctx.fillRect(X0, top, W, hz - top + 1);
  const sx = a.x + a.w * (land ? 0.73 : 0.68);
  glow(ctx, sx, hz, Math.max(a.w, b.h) * 0.62, '#ffc48c', 0.6); glow(ctx, sx, hz, Math.max(a.w, b.h) * 0.2, '#fff0d0', 0.75);
  ctx.fillStyle = '#fff3dc'; ctx.beginPath(); ctx.arc(sx, hz - c * 0.15, c * 0.85, 0, TAU); ctx.fill(); glow(ctx, sx, hz - c * 0.15, c * 2.2, '#fff0cc', 0.5);
  // long thin cloud streaks lit from below
  ctx.save(); for (let k = 0; k < 5; k++) { const cy = hz - (0.12 + k * 0.16) * (hz - top), cx = a.x + a.w * (0.1 + hash(k, 2) * 0.8) + Math.sin(t * 0.05 + k) * c * 0.6; ctx.fillStyle = rgba(k % 2 ? '#f6dcc4' : '#b9c6d4', 0.45); ctx.beginPath(); ctx.ellipse(cx, cy, c * (3 + hash(k, 3) * 4), c * 0.16, 0, 0, TAU); ctx.fill(); } ctx.restore();
  // far bank: two layers of low hills with tree masses, hazed
  const hills = (col, base, amp, seed, trees) => {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(X0, hz + 2); const step = Math.max(4, W / 90);
    for (let x = X0; x <= X0 + W + step; x += step) { const i = Math.floor((x - X0) / step); const y = base - amp * (0.45 + 0.35 * Math.sin(x * 0.011 + seed) + 0.2 * Math.sin(x * 0.047 + seed * 2)) - (trees ? amp * 0.28 * (hash(Math.floor(i / 2), seed) * 0.8 + 0.2 * hash(i, seed + 1)) : 0); ctx.lineTo(x, y); }
    ctx.lineTo(X0 + W, hz + 2); ctx.closePath(); ctx.fill();
  };
  hills('#8497ab', hz - 1, c * 1.1, 1, false); hills('#667c93', hz, c * 0.7, 4, true);
  // river, brightest where the sun lies on it
  g = ctx.createLinearGradient(0, hz, 0, rb); g.addColorStop(0, '#e3c4a6'); g.addColorStop(0.35, '#8d9fb0'); g.addColorStop(1, '#53697f'); ctx.fillStyle = g; ctx.fillRect(X0, hz, W, rb - hz + 1);
  ctx.save(); ctx.beginPath(); ctx.rect(X0, hz, W, rb - hz); ctx.clip();
  g = ctx.createLinearGradient(0, hz, 0, rb); g.addColorStop(0, 'rgba(255,214,160,0.75)'); g.addColorStop(1, 'rgba(255,214,160,0)'); ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(sx - c * 0.7, hz); ctx.lineTo(sx + c * 0.7, hz); ctx.lineTo(sx + c * 2.6, rb); ctx.lineTo(sx - c * 2.6, rb); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1, c * 0.04); ctx.beginPath();
  for (let k = 0; k < 46; k++) { const y = hz + 3 + (rb - hz - 6) * hash(k, 5), x = X0 + hash(k, 6) * W + Math.sin(t * 0.6 + k) * c * 0.08, L = c * (0.25 + 0.5 * ((y - hz) / (rb - hz)) + hash(k, 7) * 0.4); ctx.moveTo(x, y); ctx.lineTo(x + L, y); }
  ctx.stroke();
  // a country boat on the water: a long low dark hull with a curved prow (a plain boat, nothing on it)
  const bxp = a.x + a.w * 0.27, byp = hz + (rb - hz) * 0.42, bl = c * 3.2;
  ctx.fillStyle = '#2f3a49'; ctx.beginPath(); ctx.moveTo(bxp - bl / 2, byp - c * 0.1); ctx.quadraticCurveTo(bxp, byp + c * 0.28, bxp + bl / 2, byp - c * 0.26); ctx.quadraticCurveTo(bxp, byp + c * 0.04, bxp - bl / 2, byp - c * 0.1); ctx.fill();
  ctx.fillStyle = 'rgba(30,40,55,0.3)'; ctx.fillRect(bxp - bl * 0.4, byp + c * 0.12, bl * 0.8, c * 0.05);
  ctx.restore();
  // mist lying on the water, drifting
  ctx.save(); ctx.beginPath(); ctx.rect(X0, hz - c * 0.8, W, rb - hz + c * 1.6); ctx.clip();
  for (let k = 0; k < 7; k++) { const cx = X0 + ((hash(k, 8) * W + t * c * (0.12 + hash(k, 9) * 0.1)) % (W + c * 8)) - c * 2, cy = hz + (rb - hz) * (0.1 + hash(k, 10) * 0.8); ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.1); const mg = ctx.createRadialGradient(0, 0, 0, 0, 0, c * 5); mg.addColorStop(0, 'rgba(240,236,232,0.5)'); mg.addColorStop(1, 'rgba(240,236,232,0)'); ctx.fillStyle = mg; ctx.fillRect(-c * 5, -c * 5, c * 10, c * 10); ctx.restore(); }
  ctx.restore();
  // plain stone steps going down to the water, then the swept workshop terrace
  const n = 4;
  for (let k = 0; k < n; k++) {
    const y0 = rb + ((tt - rb) * k) / n, y1 = rb + ((tt - rb) * (k + 1)) / n, tone = -0.1 + k * 0.07;
    ctx.fillStyle = shade('#a7a39a', tone - 0.18); ctx.fillRect(X0, y0, W, y1 - y0); // riser (in shade)
    ctx.fillStyle = shade('#c3beb2', tone); ctx.fillRect(X0, y0, W, (y1 - y0) * 0.58); // tread, lit
    ctx.fillStyle = 'rgba(255,240,215,0.5)'; ctx.fillRect(X0, y0 + (y1 - y0) * 0.58, W, Math.max(1, c * 0.04));
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(X0, y1 - 1.2, W, 1.2);
    ctx.strokeStyle = 'rgba(40,36,30,0.22)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = X0 + hash(k, 12) * c * 3; x < X0 + W; x += c * (3 + hash(Math.floor(x), k) * 4)) { ctx.moveTo(x, y0); ctx.lineTo(x + (hash(k, Math.floor(x)) - 0.5) * 4, y0 + (y1 - y0) * 0.58); } ctx.stroke();
  }
  speck(ctx, { x: X0, y: rb, w: W, h: tt - rb }, 90, ['#4a4a40', '#f4ecdc'], 0.16, Math.max(1, c * 0.04), 9);
  g = ctx.createLinearGradient(0, tt, 0, bottom); g.addColorStop(0, '#b4aca0'); g.addColorStop(1, '#6f695f'); ctx.fillStyle = g; ctx.fillRect(X0, tt, W, bottom - tt + 12);
  ctx.strokeStyle = 'rgba(30,26,20,0.3)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let y = tt + c * 1.2, i = 0; y < bottom; y += c * (1.4 + i * 0.3), i++) { ctx.moveTo(X0, y); ctx.lineTo(X0 + W, y); for (let x = X0 + hash(i, 3) * c * 4; x < X0 + W; x += c * 4.5) { ctx.moveTo(x, y); ctx.lineTo(x + c * 0.3, y + c * (1.4 + i * 0.3)); } } ctx.stroke();
  glow(ctx, sx, tt, a.w * 0.8, '#ffd9a8', 0.22);
  vignette(ctx, a, 0.38);
  // the eaves of the workshop: a dark lintel with a soft shadow below
  const lh = Math.max(c * 0.5, a.h * 0.03); ctx.fillStyle = '#2c1a10'; ctx.fillRect(X0, top, W, lh); g = ctx.createLinearGradient(0, top + lh, 0, top + lh + c * 1.3); g.addColorStop(0, 'rgba(20,12,8,0.5)'); g.addColorStop(1, 'rgba(20,12,8,0)'); ctx.fillStyle = g; ctx.fillRect(X0, top + lh, W, c * 1.3);
}
export function banUnder(ctx, S) {
  if (S.card || S.lite) return;
  const D = banDims(S), { r, c, lx, rx, ty, hy } = D, pw = D.pw;
  // the loom frame behind the cloth: two teak posts and the cross beam the card chain hangs from
  for (const x of [lx, rx]) { castShadow(ctx, x, ty, x, D.b.y + D.b.h, pw, pw * 0.7, 0, 0.3); beam(ctx, x, ty - c * 0.1, x, D.a.y + D.a.h, pw, BAN_TEAK, Math.floor(x)); }
  const th = Math.max(8, c * 0.42);
  castShadow(ctx, lx, ty, rx, ty, th, 2, th * 0.5, 0.4); beam(ctx, lx - pw * 0.5, ty, rx + pw * 0.5, ty, th, '#5a3520', 21);
  // harness cords: a fine fan of ivory silk from the beam to the comber board, then the warp itself in two silks
  const p = Math.max(2.4, c / 4.4);
  for (let x = r.x + p * 0.5, i = 0; x < r.x + r.w; x += p, i++) {
    const tx = lerpX(r.x, r.w, x, lx, rx, 0.18);
    thread(ctx, tx, ty + th * 0.3, x, hy, Math.max(0.9, p * 0.2), i % 5 === 0 ? '#e6c46a' : '#f0e6d2', 0);
    thread(ctx, x, hy, x, r.y + 2, Math.max(1, p * 0.3), i % 3 === 0 ? '#e8d9bc' : i % 3 === 1 ? '#d8c6a6' : '#f1e8d6', 0);
  }
}
const lerpX = (rx0, rw, x, lx, rx, k) => rx0 + rw * (0.5 + ((x - rx0) / rw - 0.5) * (1 - k));
export function banFrame(ctx, S) {
  if (S.card || S.lite) return;
  const D = banDims(S), { r, c, lx, rx, ty, hy, bot, m, a, b } = D, pw = D.pw, t = S.t || 0, p = Math.max(2.4, c / 4.4);
  // the comber board with its row of brass lingoes
  ctx.fillStyle = '#22130b'; roundRectPath(ctx, r.x - c * 0.12, hy - c * 0.1, r.w + c * 0.24, c * 0.22, c * 0.06); ctx.fill(); ctx.strokeStyle = BAN_BRASS; ctx.lineWidth = 1.2; ctx.stroke();
  for (let x = r.x + p * 1.4; x < r.x + r.w; x += p * 3.6) { ctx.strokeStyle = 'rgba(240,222,170,0.85)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, hy + c * 0.1); ctx.lineTo(x, r.y - 1); ctx.stroke(); ball(ctx, x, hy + c * 0.12, Math.max(1.5, c * 0.045), '#e1b648', false); }
  // low sun coming in from the right: soft slanted shafts across the loom
  ctx.save(); ctx.beginPath(); ctx.rect(a.x, b.y, a.w, b.h); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 4; k++) { const x0 = b.x + b.w * (0.62 + k * 0.17), w0 = c * (0.7 + hash(k, 4) * 0.8), dx = b.h * 0.7; const gg = ctx.createLinearGradient(x0, b.y, x0 - dx, b.y + b.h); gg.addColorStop(0, 'rgba(255,208,150,0.13)'); gg.addColorStop(1, 'rgba(255,208,150,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(x0, b.y); ctx.lineTo(x0 + w0, b.y); ctx.lineTo(x0 + w0 - dx, b.y + b.h); ctx.lineTo(x0 - dx, b.y + b.h); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  // THE JACQUARD: a brass-bound box on the cross beam (the card cylinder), and the chain of punched pasteboard cards laced into a belt that hangs down beside the loom
  const gapR = a.x + a.w - (rx + pw * 0.5), cw = clamp(Math.min(c * 1.4, gapR - 3), 14, 52), chh = cw * 0.6, hbx = Math.min(a.x + a.w - cw * 0.55 - 1, rx + pw * 0.5 + cw * 0.55), hw = cw * 1.5, hh = Math.max(c * 1.0, cw * 0.95), hy0 = ty - c * 0.12;
  const beltTop = hy0 + hh * 0.85, beltEnd = Math.min(b.y + b.h - c * 1.3, r.y + r.h * 0.78), nC = Math.max(4, Math.floor((beltEnd - beltTop) / (chh * 1.02)));
  castShadow(ctx, hbx - hw / 2, hy0 + hh / 2, hbx + hw / 2, hy0 + hh / 2, hh, 2, hh * 0.3, 0.4);
  hbar(ctx, hbx - hw / 2, hy0, hbx + hw / 2, hh, '#3a2114', 4);
  ctx.strokeStyle = BAN_BRASS; ctx.lineWidth = Math.max(1.4, c * 0.05); for (const f of [0.2, 0.8]) { ctx.beginPath(); ctx.moveTo(hbx - hw / 2 + hw * f, hy0 + 1); ctx.lineTo(hbx - hw / 2 + hw * f, hy0 + hh - 1); ctx.stroke(); }
  ctx.fillStyle = '#120a06'; ctx.beginPath(); ctx.arc(hbx, hy0 + hh * 0.5, hh * 0.3, 0, TAU); ctx.fill(); ctx.strokeStyle = BAN_BRASS; ctx.lineWidth = Math.max(1.2, c * 0.04); ctx.stroke();
  ctx.save(); ctx.translate(hbx, hy0 + hh * 0.5); ctx.rotate(t * 0.25); ctx.fillStyle = 'rgba(217,176,78,0.8)'; for (let q = 0; q < 6; q++) { ctx.rotate(TAU / 6); ctx.fillRect(hh * 0.07, -hh * 0.02, hh * 0.2, hh * 0.04); } ctx.restore();
  const sway = (y) => Math.sin(t * 0.9 + y * 0.03) * c * 0.06 * ((y - beltTop) / Math.max(1, beltEnd - beltTop));
  ctx.strokeStyle = 'rgba(40,24,12,0.95)'; ctx.lineWidth = Math.max(1, c * 0.035);
  for (const sx of [-cw * 0.47, cw * 0.47]) { ctx.beginPath(); for (let q = 0; q <= 12; q++) { const y = beltTop + (beltEnd - beltTop) * q / 12; q ? ctx.lineTo(hbx + sx + sway(y), y) : ctx.moveTo(hbx + sx, y); } ctx.stroke(); }
  { const ey = beltTop + nC * chh * 1.02, ex = hbx + sway(ey); ball(ctx, ex, ey + cw * 0.3, cw * 0.28, '#d9b04e', true); ctx.strokeStyle = 'rgba(40,24,12,0.95)'; ctx.beginPath(); ctx.moveTo(ex, ey - chh * 0.1); ctx.lineTo(ex, ey + cw * 0.1); ctx.stroke(); }
  for (let k = 0; k < nC; k++) {
    const y = beltTop + k * chh * 1.02, dx = sway(y), tilt = Math.sin(t * 0.9 + y * 0.03) * 0.02;
    ctx.save(); ctx.translate(hbx + dx, y); ctx.rotate(tilt);
    ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.fillRect(-cw / 2 + cw * 0.1, chh * 0.1, cw, chh);
    const cg = ctx.createLinearGradient(0, 0, 0, chh); cg.addColorStop(0, '#fbf3dc'); cg.addColorStop(0.7, '#e6d9b6'); cg.addColorStop(1, '#bfaf88'); ctx.fillStyle = cg; ctx.fillRect(-cw / 2, 0, cw, chh * 0.86);
    ctx.fillStyle = 'rgba(70,50,20,0.3)'; ctx.fillRect(-cw / 2, chh * 0.82, cw, Math.max(1, chh * 0.05));
    ctx.fillStyle = '#2b2118'; const hr = Math.max(1.2, chh * 0.2); ctx.beginPath();
    for (let j = 0; j < 2; j++) for (let i = 0; i < 6; i++) if (hash(k, j, i) > 0.42) { const hx = -cw * 0.36 + i * cw * 0.144, hyy = chh * (0.28 + j * 0.38); ctx.rect(hx - hr * 0.6, hyy - hr * 0.6, hr * 1.2, hr * 1.2); } ctx.fill();
    ctx.restore();
  }
  // the gathered figure cords rising to the beam and a picker handle on a cord (the fly-shuttle is thrown by this)
  const gx = rx - c * 0.1;
  for (let k = 0; k < 4; k++) { ctx.strokeStyle = k % 2 ? '#f0e4c4' : BAN_BRASS; ctx.lineWidth = Math.max(1.4, c * 0.05); ctx.beginPath(); ctx.moveTo(r.x + r.w * (0.18 + 0.2 * k), hy); ctx.quadraticCurveTo(r.x + r.w * (0.55 + 0.1 * k), ty + c * 0.6, gx - k * 2.5, ty + c * 0.45); ctx.stroke(); }
  // sley (batten) with the fly-shuttle boxes at both ends, below the cloth
  const sy = bot + Math.min(c * 0.2, m.b * 0.1), sh = Math.max(7, c * 0.5);
  castShadow(ctx, lx, sy + sh * 0.5, rx, sy + sh * 0.5, sh, 2, sh * 0.35, 0.4);
  hbar(ctx, lx - pw * 0.5, sy, rx + pw * 0.5, sh, '#6a3d22', 3);
  ctx.fillStyle = '#e6c37a'; ctx.fillRect(lx + pw * 0.5, sy + sh * 0.16, rx - lx - pw, Math.max(1, sh * 0.1)); // raceway edge
  for (const [x, dir] of [[lx - pw * 0.1, 1], [rx - pw * 0.9, -1]]) { // shuttle boxes
    const bw = pw * 1.1 + c * 0.35; ctx.fillStyle = '#24140c'; roundRectPath(ctx, dir > 0 ? x - c * 0.15 : x - c * 0.2, sy - sh * 0.55, bw, sh * 1.4, 3); ctx.fill(); ctx.strokeStyle = BAN_BRASS; ctx.lineWidth = 1.2; ctx.stroke();
  }
  // the shuttle waiting in the left box (steel tip showing) and the picker handle hanging below the sley
  ctx.save(); ctx.translate(lx + pw * 0.2, sy + sh * 0.3); ctx.fillStyle = '#c8cdd2'; ctx.beginPath(); ctx.moveTo(c * 0.2, 0); ctx.lineTo(c * 0.55, -sh * 0.12); ctx.lineTo(c * 0.55, sh * 0.12); ctx.closePath(); ctx.fill(); ctx.restore();
  const hx = (lx + rx) / 2, hy2 = sy + sh + Math.min(c * 0.9, Math.max(c * 0.4, m.b * 0.3));
  ctx.strokeStyle = '#e8dcc0'; ctx.lineWidth = Math.max(1.2, c * 0.04); ctx.beginPath(); ctx.moveTo(lx + pw, sy + sh * 0.8); ctx.quadraticCurveTo(hx, hy2 + c * 0.1, hx, hy2); ctx.moveTo(rx - pw, sy + sh * 0.8); ctx.quadraticCurveTo(hx, hy2 + c * 0.1, hx, hy2); ctx.stroke();
  rod(ctx, hx - c * 0.5, hy2 + c * 0.1, hx + c * 0.5, hy2 + c * 0.1, Math.max(4, c * 0.2), '#a8723c');
  // below: the pit (stone coping, darkness, two treadle planks) when there is room
  const pitTop = sy + sh + Math.max(c * 0.3, Math.min(c * 1.6, m.b * 0.45));
  if (b.y + b.h - pitTop > c * 0.9) {
    ctx.save(); ctx.beginPath(); ctx.rect(a.x, pitTop, a.w, a.y + a.h - pitTop); ctx.clip();
    const pg = ctx.createLinearGradient(0, pitTop, 0, a.y + a.h); pg.addColorStop(0, '#120a06'); pg.addColorStop(1, '#2a1a10'); ctx.fillStyle = pg; roundRectPath(ctx, lx - pw * 0.2, pitTop, rx - lx + pw * 0.4, a.y + a.h - pitTop + 20, c * 0.2); ctx.fill();
    ctx.fillStyle = '#d4cdbf'; ctx.fillRect(lx - pw * 0.6, pitTop - c * 0.16, rx - lx + pw * 1.2, c * 0.16); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(lx - pw * 0.6, pitTop - c * 0.04, rx - lx + pw * 1.2, c * 0.04);
    for (const k of [0, 1]) { const x0 = lx + (rx - lx) * (0.1 + 0.42 * k), yy = pitTop + c * (0.7 + 0.2 * k); if (yy < a.y + a.h - c * 0.2) hbar(ctx, x0, yy, x0 + (rx - lx) * 0.36, Math.max(6, c * 0.22), '#b27a42', 3); }
    ctx.restore();
  }
  void t;
}
export function banGround(ctx, S) {
  // satin silk in a deep wine colour: long warp floats make a liquid gloss, with a faint tone-on-tone lattice woven in
  const r = S.rect, c = S.cell, bg = S.bg, p = Math.max(1.6, c / 11);
  ctx.fillStyle = bg; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  ctx.beginPath(); for (let x = r.x + p * 0.5, i = 0; x < r.x + r.w; x += p, i++) { if (i % 2) continue; ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); } ctx.strokeStyle = rgba(mix(bg, '#e0527a', 0.45), 0.3); ctx.lineWidth = p * 0.75; ctx.stroke();
  ctx.beginPath(); for (let x = r.x + p * 1.5, i = 0; x < r.x + r.w; x += p * 2) { ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); i++; } ctx.strokeStyle = rgba(shade(bg, -0.5), 0.3); ctx.lineWidth = p * 0.5; ctx.stroke();
  // tone-on-tone diamond lattice
  const q = c * 0.5; ctx.beginPath();
  for (let x = r.x - r.h; x < r.x + r.w + r.h; x += q) { ctx.moveTo(x, r.y); ctx.lineTo(x + r.h, r.y + r.h); ctx.moveTo(x, r.y + r.h); ctx.lineTo(x + r.h, r.y); }
  ctx.strokeStyle = rgba(mix(bg, '#e0527a', 0.6), 0.16); ctx.lineWidth = Math.max(1, c * 0.03); ctx.stroke();
  // two broad soft gloss bands, as satin catches light across a drape
  for (const [u, w, a] of [[0.26, 0.18, 0.34], [0.74, 0.12, 0.2]]) { const sg = ctx.createLinearGradient(r.x + r.w * (u - w), r.y, r.x + r.w * (u + w) + r.h * 0.25, r.y + r.h); sg.addColorStop(0, 'rgba(255,170,180,0)'); sg.addColorStop(0.5, `rgba(255,170,180,${a})`); sg.addColorStop(1, 'rgba(255,170,180,0)'); ctx.fillStyle = sg; ctx.fillRect(r.x, r.y, r.w, r.h); }
  // gold selvedge lines either side and fine gold rules top and bottom
  ctx.fillStyle = rgba(BAN_BRASS, 0.8); ctx.fillRect(r.x, r.y, Math.max(2, c * 0.07), r.h); ctx.fillRect(r.x + r.w - Math.max(2, c * 0.07), r.y, Math.max(2, c * 0.07), r.h);
  ctx.fillStyle = rgba('#fff1c0', 0.5); ctx.fillRect(r.x + Math.max(2, c * 0.07), r.y, Math.max(1, c * 0.02), r.h);
  ctx.restore();
}
export function banOver(ctx, S) {
  const r = S.rect, c = S.cell, e = Math.max(5, c * 0.45);
  const tg = ctx.createLinearGradient(0, r.y, 0, r.y + e); tg.addColorStop(0, 'rgba(0,0,0,0.34)'); tg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = tg; ctx.fillRect(r.x, r.y, r.w, e);
  const lg = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); lg.addColorStop(0, 'rgba(255,214,170,0.08)'); lg.addColorStop(0.5, 'rgba(255,214,170,0)'); lg.addColorStop(1, 'rgba(10,0,10,0.3)'); ctx.fillStyle = lg; ctx.fillRect(r.x, r.y, r.w, r.h);
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// the zari float skin: supplementary-weft floats lying over satin; short stepped floats, tie-down ticks and a metal sheen
// o: { n rows, run float length in cells, gold sheen strength, dir 'h' | 'v' }
// ---------------------------------------------------------------------------------------------------------------------------------------------------
export function zariSkin(ctx, d, o = {}) {
  const { kind, col, x, y, s, key } = d, fill = isFilled(kind), h = s / 2, n = o.n ?? 12, p = s / n, lw = lineWidthOf(kind, s), run = o.run ?? 5.2, shine = o.shine ?? (0.26 + 0.4 * Math.max(0, lum(col) - 0.2)), vert = o.dir === 'v';
  const age = d.age === undefined ? 9 : d.age;
  if (!fill) { // a couched zari cord: tie-down stitches cross it at even steps
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = lw + 2.2; ctx.save(); ctx.translate(lw * 0.1, lw * 0.22); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = shade(col, -0.45); ctx.lineWidth = lw; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw * 0.76; ctx.stroke();
    ctx.setLineDash([Math.max(1, lw * 0.18), lw * 0.62]); ctx.strokeStyle = rgba(shade(col, -0.7), 0.75); ctx.lineWidth = lw * 0.92; ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = rgba(shade(col, 0.75), 0.9); ctx.lineWidth = Math.max(0.8, lw * 0.16); ctx.save(); ctx.translate(-lw * 0.14, -lw * 0.22); ctx.stroke(); ctx.restore(); ctx.restore(); return;
  }
  ctx.save(); ctx.translate(s * 0.03, s * 0.045); motifPath(ctx, kind, x, y, s); ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fill(); ctx.restore(); // the raised shadow on the satin
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.fillStyle = shade(col, -0.58); ctx.fill(); ctx.clip();
  const bodyP = [], hiP = [], loP = [], tieP = [];
  for (let j = 0; j <= n; j++) {
    const off = ((j * 2) % 5) * p * 1.15 + hash(key, j) * p * 0.12; let u = -off;
    while (u < s + p) {
      const L = (run * (0.92 + hash(key, j, Math.floor(u)) * 0.16)) * p, a0 = Math.max(0, u + p * 0.1), a1 = Math.min(s, u + L - p * 0.2);
      if (a1 - a0 > p * 0.4) {
        if (vert) { const X = x - h + j * p, Y = y - h + a0; bodyP.push([X + p * 0.04, Y, p * 0.88, a1 - a0]); hiP.push([X + p * 0.1, Y + 0.5, p * 0.26, a1 - a0 - 1]); loP.push([X + p * 0.72, Y, p * 0.2, a1 - a0]); tieP.push([X + p * 0.3, Y + (a1 - a0) + p * 0.1]); }
        else { const X = x - h + a0, Y = y - h + j * p; bodyP.push([X, Y + p * 0.04, a1 - a0, p * 0.88]); hiP.push([X + 0.5, Y + p * 0.1, a1 - a0 - 1, p * 0.2]); loP.push([X, Y + p * 0.66, a1 - a0, p * 0.3]); tieP.push([X + (a1 - a0) + p * 0.1, Y + p * 0.4]); }
      }
      u += L;
    }
  }
  const fillAll = (arr, style) => { ctx.fillStyle = style; ctx.beginPath(); for (const q of arr) ctx.rect(q[0], q[1], q[2], q[3]); ctx.fill(); };
  fillAll(bodyP, shade(col, -0.02)); fillAll(hiP, rgba(shade(col, 0.5), 0.6)); fillAll(loP, rgba(shade(col, -0.6), 0.7));
  ctx.fillStyle = rgba(shade(col, -0.75), 0.8); ctx.beginPath(); for (const q of tieP) ctx.rect(q[0], q[1], Math.max(1, p * 0.2), Math.max(1, p * 0.34)); ctx.fill();
  const sg = ctx.createLinearGradient(x - h, y - h, x + h, y + h); sg.addColorStop(0.15, 'rgba(255,252,240,0)'); sg.addColorStop(0.4, `rgba(255,252,240,${shine})`); sg.addColorStop(0.55, 'rgba(255,252,240,0)'); ctx.fillStyle = sg; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  const og = ctx.createRadialGradient(x - s * 0.2, y - s * 0.25, s * 0.08, x, y, s * 0.68); og.addColorStop(0, 'rgba(255,244,224,0.12)'); og.addColorStop(1, 'rgba(20,0,10,0.4)'); ctx.fillStyle = og; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  if (age < 0.5) { const k = Math.sin(Math.PI * Math.min(1, age * 2.2)); const fg = ctx.createLinearGradient(x - h - s + age * s * 5, y - h, x - h + age * s * 5, y + h); fg.addColorStop(0, 'rgba(255,255,255,0)'); fg.addColorStop(0.5, `rgba(255,255,255,${0.7 * k})`); fg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = fg; ctx.fillRect(x - s, y - s, s * 2, s * 2); }
  ctx.restore();
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(shade(col, -0.7), 0.7); ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke(); ctx.strokeStyle = rgba(shade(col, 0.6), 0.5); ctx.lineWidth = Math.max(0.6, s * 0.012); ctx.stroke(); ctx.restore();
}

// ===================================================================================================================================================
// KANCHIPURAM: a wide handloom with a heavy reed and three shuttles, in a pillared verandah (plain carved timber columns, warm dust-lit light)
// ===================================================================================================================================================
const KC_WOOD = '#3c2013';
function kcDims(S) {
  const { a, r, c, m, land, b } = geo(S), pw = Math.max(10, c * 0.46), inset = Math.max(pw * 0.9, Math.min(m.l, m.r) * 0.45);
  const lx = Math.max(a.x + pw * 0.6, r.x - inset), rx = Math.min(a.x + a.w - pw * 0.6, r.x + r.w + inset);
  const H = r.y - b.y, ty = b.y + Math.max(c * 0.2, Math.min(c * 0.4, H * 0.14)), reedH = clamp(H * 0.2, c * 0.35, c * 0.6), ry = r.y - reedH - Math.min(c * 0.08, H * 0.04), bot = r.y + r.h;
  return { a, r, c, m, land, b, pw, lx, rx, ty, ry, reedH, bot, H };
}
export function kcEnv(ctx, S) {
  const a = S.area, b = S.box, c = S.cell, X0 = a.x - 12, W = a.w + 24, t = S.t || 0, land = isLand(S), top = a.y, bottom = a.y + a.h;
  const fy = b.y + b.h * (land ? 0.8 : 0.86); // floor line
  // back wall: ochre lime plaster, a darker dado band, soft mottling
  let g = ctx.createLinearGradient(0, top, 0, fy); g.addColorStop(0, '#9a5e24'); g.addColorStop(0.5, '#c58a3a'); g.addColorStop(1, '#a86a2a'); ctx.fillStyle = g; ctx.fillRect(X0, top, W, fy - top + 1);
  for (let k = 0; k < 14; k++) { const px = a.x + hash(k, 1) * a.w, py = top + hash(k, 2) * (fy - top), pr = c * (3 + hash(k, 3) * 5); glow(ctx, px, py, pr, hash(k, 4) > 0.5 ? '#f0c470' : '#6a3a14', 0.16); }
  const dado = fy - (fy - top) * 0.22; ctx.fillStyle = '#7a3c1e'; ctx.fillRect(X0, dado, W, fy - dado); ctx.fillStyle = '#e0aa58'; ctx.fillRect(X0, dado - Math.max(2, c * 0.1), W, Math.max(2, c * 0.1)); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X0, dado, W, Math.max(1, c * 0.05));
  speck(ctx, { x: X0, y: top, w: W, h: fy - top }, 200, ['#5a3010', '#f0d09a'], 0.1, Math.max(1, c * 0.05), 7);
  // sunlit courtyard seen through the open bays between the columns: a bright cream slot that shows only at the sides
  // floor: dusty flagstones receding
  g = ctx.createLinearGradient(0, fy, 0, bottom); g.addColorStop(0, '#b3763a'); g.addColorStop(1, '#6a3c1a'); ctx.fillStyle = g; ctx.fillRect(X0, fy, W, bottom - fy + 12);
  ctx.fillStyle = 'rgba(255,214,150,0.32)'; ctx.fillRect(X0, fy, W, Math.max(1.4, c * 0.05));
  ctx.strokeStyle = 'rgba(40,18,6,0.34)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let k = 1, y = fy; y < bottom; k++) { y = fy + c * 0.55 * k * (1 + k * 0.28); ctx.moveTo(X0, y); ctx.lineTo(X0 + W, y); }
  for (let i = -8; i <= 8; i++) { const xc = a.x + a.w / 2 + i * c * 2.6; ctx.moveTo(a.x + a.w / 2 + i * c * 1.2, fy); ctx.lineTo(xc * 1.0 + (xc - a.x - a.w / 2) * 1.4, bottom); } ctx.stroke();
  // sun shafts slanting down from the upper left, with floor patches
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 4; k++) { const sx = a.x + a.w * (0.04 + k * 0.27), w0 = c * (1.4 + hash(k, 1) * 1.6), sl = (fy - top) * 0.55; const gg = ctx.createLinearGradient(sx, top, sx + sl, top + (fy - top)); gg.addColorStop(0, 'rgba(255,214,140,0.2)'); gg.addColorStop(1, 'rgba(255,190,100,0.03)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(sx, top); ctx.lineTo(sx + w0, top); ctx.lineTo(sx + w0 + sl, fy); ctx.lineTo(sx + sl, fy); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  // dust turning slowly in the light
  ctx.fillStyle = 'rgba(255,230,170,0.5)'; ctx.beginPath(); for (let k = 0; k < 30; k++) { const px = a.x + hash(k, 5) * a.w + Math.sin(t * 0.4 + k) * c * 0.3, py = top + ((hash(k, 6) * (fy - top) + t * c * 0.25 * (0.3 + hash(k, 7))) % (fy - top)), rr = Math.max(0.8, c * (0.025 + hash(k, 8) * 0.03)); ctx.moveTo(px + rr, py); ctx.arc(px, py, rr, 0, TAU); } ctx.fill();
  // timber columns at the edges: plinth, chamfered shaft, plain carved bands (zigzag rows), bracket capital
  const cw = Math.max(c * 1.25, a.w * 0.07);
  for (const [x, side] of [[a.x + cw * 0.5 - c * 0.15, 1], [a.x + a.w - cw * 0.5 + c * 0.15, -1]]) {
    const x0 = x - cw / 2; castShadow(ctx, x, top, x, bottom, cw, cw * 0.5 * side, 0, 0.3);
    vbar(ctx, x0, top, cw, bottom, '#6e3f1f', 2);
    ctx.fillStyle = 'rgba(255,214,150,0.18)'; ctx.fillRect(x0 + cw * 0.12, top, cw * 0.06, bottom - top); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x0 + cw * 0.5, top, cw * 0.02, bottom - top); // chamfer
    for (const f of [0.18, 0.5, 0.74]) { const yy = top + (bottom - top) * f, bh = c * 0.5; ctx.fillStyle = '#4a2812'; ctx.fillRect(x0, yy, cw, bh); ctx.strokeStyle = '#e3b058'; ctx.lineWidth = Math.max(1, c * 0.045); ctx.beginPath(); ctx.moveTo(x0, yy + bh * 0.2); for (let z = 0; z <= 6; z++) ctx.lineTo(x0 + cw * z / 6, yy + (z % 2 ? bh * 0.8 : bh * 0.2)); ctx.stroke(); ctx.fillStyle = '#e3b058'; ctx.fillRect(x0, yy - 1, cw, 2); ctx.fillRect(x0, yy + bh - 1, cw, 2); }
    ctx.fillStyle = '#b08a5a'; ctx.fillRect(x0 - c * 0.18, fy - c * 0.1, cw + c * 0.36, bottom - fy + c); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x0 - c * 0.18, fy - c * 0.1, cw + c * 0.36, c * 0.08);
    hbar(ctx, x0 - c * 0.3, top, x0 + cw + c * 0.3, c * 0.7, '#7a4624', 2);
  }
  vignette(ctx, a, 0.42);
}
export function kcUnder(ctx, S) {
  if (S.card || S.lite) return;
  const D = kcDims(S), { r, c, lx, rx, ty, ry, pw } = D, th = Math.max(9, c * 0.46);
  for (const x of [lx, rx]) { castShadow(ctx, x, ty, x, D.a.y + D.a.h, pw, pw * 0.7, 0, 0.34); beam(ctx, x, ty - c * 0.1, x, D.a.y + D.a.h, pw, KC_WOOD, Math.floor(x) + 3); ctx.fillStyle = '#d6a84a'; for (const f of [0.18, 0.5, 0.82]) brassStud(ctx, x, D.b.y + D.b.h * f, Math.max(1.8, pw * 0.1)); }
  castShadow(ctx, lx, ty, rx, ty, th, 2, th * 0.5, 0.42); beam(ctx, lx - pw * 0.5, ty, rx + pw * 0.5, ty, th, '#4e2a18', 17);
  for (let x = lx; x < rx; x += c * 1.3) brassStud(ctx, x + c * 0.3, ty, Math.max(1.5, th * 0.09));
  // thick silk warp in the body colour with two gold selvedge ends, from the lintel down to the reed
  const p = Math.max(2.8, c / 4.2), warp = S.bg;
  for (let x = r.x + p * 0.5, i = 0; x < r.x + r.w; x += p, i++) { const edge = i < 3 || x > r.x + r.w - p * 3; thread(ctx, x, ty + th * 0.4, x, ry + 1, Math.max(1.3, p * 0.36), edge ? '#e2b84a' : shade(warp, i % 2 ? 0.12 : 0.28), 0); }
}
export function kcFrame(ctx, S) {
  if (S.card || S.lite) return;
  const D = kcDims(S), { r, c, lx, rx, ty, ry, reedH, bot, m, a, b, pw } = D, t = S.t || 0, p = Math.max(2.8, c / 4.2);
  // the heavy reed: a thick wooden batten, brass dents between two rails, hung from the lintel on two swords
  for (const x of [lx + pw * 0.55, rx - pw * 0.55]) { castShadow(ctx, x, ty, x, ry, c * 0.2, c * 0.1, 0, 0.3); vbar(ctx, x - c * 0.1, ty, c * 0.2, ry + reedH, '#5c3220', 2); }
  castShadow(ctx, lx + pw * 0.5, ry + reedH * 0.5, rx - pw * 0.5, ry + reedH * 0.5, reedH * 0.8, 2, reedH * 0.3, 0.4);
  hbar(ctx, lx + pw * 0.3, ry, rx - pw * 0.3, reedH * 0.3, '#6a3a22', 3); hbar(ctx, lx + pw * 0.3, ry + reedH * 0.7, rx - pw * 0.3, reedH * 0.3, '#4e2816', 3);
  ctx.fillStyle = '#1a0e08'; ctx.fillRect(lx + pw * 0.3, ry + reedH * 0.3, rx - lx - pw * 0.6, reedH * 0.4);
  ctx.strokeStyle = '#e9c76a'; ctx.lineWidth = Math.max(1, c * 0.03); ctx.beginPath(); for (let x = r.x - c * 0.3; x < r.x + r.w + c * 0.3; x += p * 0.62) { ctx.moveTo(x, ry + reedH * 0.3); ctx.lineTo(x, ry + reedH * 0.7); } ctx.stroke();
  ctx.fillStyle = 'rgba(255,248,220,0.4)'; ctx.fillRect(lx + pw * 0.3, ry + reedH * 0.3, rx - lx - pw * 0.6, Math.max(1, reedH * 0.06));
  // the cloth apron with its bold zari band rolling to the cloth beam, then the beam
  const ay = bot, ah = Math.min(c * 0.9, Math.max(c * 0.4, m.b * 0.28)), g = ctx.createLinearGradient(0, ay, 0, ay + ah);
  g.addColorStop(0, shade(S.bg, 0.1)); g.addColorStop(1, shade(S.bg, -0.6)); ctx.fillStyle = g; ctx.fillRect(r.x, ay, r.w, ah);
  ctx.fillStyle = '#e4b84e'; ctx.fillRect(r.x, ay + ah * 0.18, r.w, Math.max(2, ah * 0.1)); ctx.fillStyle = 'rgba(255,248,210,0.7)'; ctx.fillRect(r.x, ay + ah * 0.18, r.w, Math.max(1, ah * 0.03));
  const by = ay + ah, bh = Math.max(8, c * 0.46);
  castShadow(ctx, lx, by + bh * 0.5, rx, by + bh * 0.5, bh, 2, bh * 0.35, 0.42); hbar(ctx, lx - pw * 0.5, by, rx + pw * 0.5, bh, '#5a3220', 3);
  for (let x = lx + c * 0.2; x < rx; x += c * 1.3) brassStud(ctx, x, by + bh * 0.5, Math.max(1.5, bh * 0.1));
  // THREE SHUTTLES resting on the beam: body colour and the two border colours
  const cols = S.colors || [], sc = [S.bg, cols[0] ?? '#2f8f3a', cols[1] ?? '#e0a82e'], sl = Math.min(c * 2.5, r.w / 3.5), sh = Math.min(c * 0.46, Math.max(5, m.b * 0.16)), sy = by + bh * 0.1 - sh * 0.35;
  for (let k = 0; k < 3; k++) shuttleBody(ctx, r.x + r.w * (0.1 + 0.31 * k) + sl * 0.5, sy, sl, sh, sc[k], k, 0);
  // wooden cross-rail below the beam when there is room (the weaver's seat plank)
  const py = by + bh + Math.min(c * 0.6, Math.max(0, a.y + a.h - by - bh - c * 0.5) * 0.3);
  if (a.y + a.h - py > c * 0.8) { hbar(ctx, lx - pw * 0.4, py, rx + pw * 0.4, Math.max(8, c * 0.4), '#7a4a26', 3); }
  void t; void b;
}
// a boat shuttle (used resting and as the held tool): lacquered body, gold caps, a silk spool seen through the window
function shuttleBody(ctx, cx, cy, L, H, col, seed, tilt) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt);
  softE(ctx, L * 0.04, H * 0.62, L * 0.5, H * 0.18, 0.35);
  const g = ctx.createLinearGradient(0, -H / 2, 0, H / 2); g.addColorStop(0, '#8a5230'); g.addColorStop(0.45, '#4a2616'); g.addColorStop(1, '#1e0e07');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.quadraticCurveTo(-L * 0.38, -H * 0.62, -L * 0.1, -H * 0.5); ctx.lineTo(L * 0.1, -H * 0.5); ctx.quadraticCurveTo(L * 0.38, -H * 0.62, L / 2, 0); ctx.quadraticCurveTo(L * 0.38, H * 0.62, L * 0.1, H * 0.5); ctx.lineTo(-L * 0.1, H * 0.5); ctx.quadraticCurveTo(-L * 0.38, H * 0.62, -L / 2, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,214,160,0.35)'; ctx.fillRect(-L * 0.28, -H * 0.46, L * 0.56, Math.max(1, H * 0.07));
  ctx.fillStyle = '#0e0704'; roundRectPath(ctx, -L * 0.2, -H * 0.3, L * 0.4, H * 0.6, H * 0.12); ctx.fill();
  ctx.save(); roundRectPath(ctx, -L * 0.19, -H * 0.27, L * 0.38, H * 0.54, H * 0.1); ctx.clip(); wound(ctx, -L * 0.19, -H * 0.27, L * 0.38, H * 0.54, col, 9, 'w'); ctx.restore();
  for (const sgn of [-1, 1]) { ctx.fillStyle = '#e1b648'; ctx.beginPath(); ctx.moveTo(sgn * L * 0.5, 0); ctx.lineTo(sgn * L * 0.4, -H * 0.18); ctx.lineTo(sgn * L * 0.4, H * 0.18); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle = '#e1b648'; ctx.lineWidth = Math.max(1, H * 0.05); ctx.beginPath(); ctx.moveTo(-L * 0.36, -H * 0.2); ctx.lineTo(-L * 0.24, -H * 0.2); ctx.moveTo(L * 0.24, -H * 0.2); ctx.lineTo(L * 0.36, -H * 0.2); ctx.stroke();
  void seed; ctx.restore();
}
export function kcGround(ctx, S) {
  // heavy silk: thick corded ribs with a bright crown each, a fine zari check and a bold zari band down both selvedges
  const r = S.rect, c = S.cell, bg = S.bg, p = Math.max(2, c / 6.5);
  ctx.fillStyle = bg; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  ctx.beginPath(); for (let y = r.y, j = 0; y < r.y + r.h; y += p, j++) { ctx.rect(r.x, y + p * 0.08, r.w, p * 0.3); } ctx.fillStyle = rgba(shade(bg, 0.45), 0.4); ctx.fill();
  ctx.beginPath(); for (let y = r.y, j = 0; y < r.y + r.h; y += p, j++) { ctx.rect(r.x, y + p * 0.72, r.w, p * 0.28); } ctx.fillStyle = rgba(shade(bg, -0.6), 0.45); ctx.fill();
  // twisted ply of the warp: faint verticals
  ctx.beginPath(); for (let x = r.x + p * 0.5; x < r.x + r.w; x += p * 1.05) { ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); } ctx.strokeStyle = rgba(shade(bg, -0.3), 0.16); ctx.lineWidth = Math.max(0.6, p * 0.2); ctx.stroke();
  // zari check: fine gold lines every cell, small gold knots at the crossings
  ctx.strokeStyle = rgba('#e6bb52', 0.5); ctx.lineWidth = Math.max(1, c * 0.028); ctx.beginPath();
  for (let x = r.x; x <= r.x + r.w + 1; x += c) { ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); } for (let y = r.y; y <= r.y + r.h + 1; y += c) { ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); } ctx.stroke();
  ctx.fillStyle = rgba('#f5d98a', 0.7); ctx.beginPath(); for (let x = r.x; x <= r.x + r.w + 1; x += c) for (let y = r.y; y <= r.y + r.h + 1; y += c) { ctx.moveTo(x + c * 0.045, y); ctx.arc(x, y, Math.max(1, c * 0.045), 0, TAU); } ctx.fill();
  const sg = ctx.createLinearGradient(r.x, r.y + r.h * 0.1, r.x + r.w, r.y + r.h * 0.9); sg.addColorStop(0.25, 'rgba(255,240,225,0)'); sg.addColorStop(0.42, 'rgba(255,240,225,0.3)'); sg.addColorStop(0.58, 'rgba(255,240,225,0)'); sg.addColorStop(0.85, 'rgba(255,240,225,0.14)'); sg.addColorStop(1, 'rgba(255,240,225,0)'); ctx.fillStyle = sg; ctx.fillRect(r.x, r.y, r.w, r.h);
  // bold zari border bands at the selvedges
  const bw = Math.max(4, c * 0.2);
  for (const x of [r.x, r.x + r.w - bw]) { const bgd = ctx.createLinearGradient(x, 0, x + bw, 0); bgd.addColorStop(0, '#9a6b1c'); bgd.addColorStop(0.4, '#f2cc62'); bgd.addColorStop(1, '#a8761f'); ctx.fillStyle = bgd; ctx.fillRect(x, r.y, bw, r.h); ctx.fillStyle = 'rgba(80,40,0,0.4)'; ctx.beginPath(); for (let y = r.y; y < r.y + r.h; y += bw * 0.6) ctx.rect(x, y, bw, Math.max(1, bw * 0.12)); ctx.fill(); }
  ctx.restore();
}
export function kcOver(ctx, S) {
  const r = S.rect, c = S.cell, e = Math.max(5, c * 0.4);
  const tg = ctx.createLinearGradient(0, r.y, 0, r.y + e); tg.addColorStop(0, 'rgba(0,0,0,0.36)'); tg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = tg; ctx.fillRect(r.x, r.y, r.w, e);
  const lg = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); lg.addColorStop(0, 'rgba(255,200,120,0.18)'); lg.addColorStop(0.5, 'rgba(255,200,120,0)'); lg.addColorStop(1, 'rgba(20,0,0,0.3)'); ctx.fillStyle = lg; ctx.fillRect(r.x, r.y, r.w, r.h);
}
// korvai skin: thick corded silk (horizontal ribs lit on top), a gold zari band hugging the motif edge and interlocked-weft teeth along it
export function korvaiSkin(ctx, d, o = {}) {
  const { kind, col, x, y, s, key } = d, fill = isFilled(kind), h = s / 2, n = o.n ?? 6, p = s / n, lw = lineWidthOf(kind, s);
  if (!fill) {
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.42)'; ctx.lineWidth = lw + 2.4; ctx.save(); ctx.translate(lw * 0.1, lw * 0.2); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = shade(col, -0.5); ctx.lineWidth = lw * 1.1; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw * 0.82; ctx.stroke();
    ctx.setLineDash([lw * 0.5, lw * 0.34]); ctx.strokeStyle = '#f0cc66'; ctx.lineWidth = lw * 0.4; ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = rgba(shade(col, 0.7), 0.8); ctx.lineWidth = Math.max(0.8, lw * 0.14); ctx.save(); ctx.translate(-lw * 0.14, -lw * 0.22); ctx.stroke(); ctx.restore(); ctx.restore(); return;
  }
  ctx.save(); ctx.translate(s * 0.025, s * 0.04); motifPath(ctx, kind, x, y, s); ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fill(); ctx.restore();
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.fillStyle = shade(col, -0.5); ctx.fill(); ctx.clip();
  const crown = [], valley = [], ply = [];
  for (let j = -1; j <= n; j++) { const yy = y - h + j * p; crown.push([x - h - 2, yy + p * 0.06, s + 4, p * 0.4]); valley.push([x - h - 2, yy + p * 0.72, s + 4, p * 0.24]); }
  ctx.fillStyle = shade(col, 0.04); ctx.fillRect(x - h - 2, y - h - 2, s + 4, s + 4);
  ctx.fillStyle = rgba(shade(col, 0.5), 0.55); ctx.beginPath(); for (const q of crown) ctx.rect(q[0], q[1], q[2], q[3]); ctx.fill();
  ctx.fillStyle = rgba(shade(col, -0.65), 0.55); ctx.beginPath(); for (const q of valley) ctx.rect(q[0], q[1], q[2], q[3]); ctx.fill();
  ctx.beginPath(); for (let i = 0; i <= n * 1.6; i++) { const xx = x - h + i * p * 0.62 + hash(key, i) * p * 0.1; ctx.moveTo(xx, y - h - 2); ctx.lineTo(xx, y + h + 2); } ctx.strokeStyle = rgba(shade(col, -0.45), 0.2); ctx.lineWidth = Math.max(0.6, p * 0.12); ctx.stroke();
  const sg = ctx.createLinearGradient(x - h, y - h, x + h, y + h); sg.addColorStop(0.18, 'rgba(255,248,235,0)'); sg.addColorStop(0.4, 'rgba(255,248,235,0.4)'); sg.addColorStop(0.55, 'rgba(255,248,235,0)'); ctx.fillStyle = sg; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  const og = ctx.createRadialGradient(x - s * 0.2, y - s * 0.25, s * 0.08, x, y, s * 0.68); og.addColorStop(0, 'rgba(255,244,224,0.1)'); og.addColorStop(1, 'rgba(20,0,10,0.38)'); ctx.fillStyle = og; ctx.fillRect(x - s, y - s, s * 2, s * 2);
  // the interlocked-weft teeth: a dashed dark ring inside the edge, then the zari band
  motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'miter'; ctx.setLineDash([p * 0.55, p * 0.55]); ctx.strokeStyle = rgba(shade(col, -0.7), 0.55); ctx.lineWidth = p * 1.4; ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
  ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba('#7a5014', 0.9); ctx.lineWidth = Math.max(2, s * 0.07); ctx.stroke(); ctx.strokeStyle = '#efc95e'; ctx.lineWidth = Math.max(1.4, s * 0.05); ctx.stroke();
  ctx.setLineDash([Math.max(1, s * 0.03), Math.max(1, s * 0.03)]); ctx.strokeStyle = 'rgba(120,70,0,0.55)'; ctx.lineWidth = Math.max(1.4, s * 0.05); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(255,250,215,0.85)'; ctx.lineWidth = Math.max(0.7, s * 0.014); ctx.save(); ctx.translate(-s * 0.012, -s * 0.014); ctx.stroke(); ctx.restore(); ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// supplies and tools
// ---------------------------------------------------------------------------------------------------------------------------------------------------
Object.assign(POT, {
  // a spool of flat metallic zari thread wound on a wooden bobbin: shiny winding between turned flanges
  zarispool(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; backTile(ctx, b, '#12202c', 0.6);
    ctx.save(); ctx.translate(cx, cy + lift); softE(ctx, r * 0.1, r * 0.8, r * 0.58, r * 0.1);
    ctx.fillStyle = '#5a3520'; roundRectPath(ctx, -r * 0.62, -r * 0.82, r * 1.24, r * 0.16, 3); ctx.fill(); roundRectPath(ctx, -r * 0.62, r * 0.66, r * 1.24, r * 0.16, 3); ctx.fill();
    ctx.fillStyle = BAN_BRASS; ctx.fillRect(-r * 0.62, -r * 0.7, r * 1.24, r * 0.025); ctx.fillRect(-r * 0.62, r * 0.66, r * 1.24, r * 0.025);
    ctx.save(); ctx.beginPath(); ctx.rect(-r * 0.5, -r * 0.66, r * 1, r * 1.32); ctx.clip();
    for (let k = 0; k < 16; k++) { const y = -r * 0.66 + k * r * 0.085; ctx.fillStyle = k % 2 ? shade(col, 0.2) : shade(col, -0.25); ctx.fillRect(-r * 0.5, y, r * 1, r * 0.09); ctx.fillStyle = rgba('#fff', 0.35); ctx.fillRect(-r * 0.5, y, r * 1, r * 0.018); }
    const g = ctx.createLinearGradient(-r * 0.5, 0, r * 0.5, 0); g.addColorStop(0, 'rgba(255,255,255,0.05)'); g.addColorStop(0.2, 'rgba(255,255,255,0.8)'); g.addColorStop(0.32, 'rgba(255,255,255,0)'); g.addColorStop(0.7, 'rgba(0,0,0,0.1)'); g.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = g; ctx.fillRect(-r * 0.5, -r * 0.66, r * 1, r * 1.32); ctx.restore();
    ctx.restore(); ringSel(ctx, S, b, on);
  },
  // a hank of thick silk twisted on itself and tied with a cotton string: the loop, the twist, the tie
  silkhank(ctx, S, b, col, on) {
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; backTile(ctx, b, '#1c0f08', 0.6);
    ctx.save(); ctx.translate(cx, cy + lift); softE(ctx, r * 0.1, r * 0.8, r * 0.55, r * 0.1);
    // two folded loops, many fine strands
    for (const sgn of [-1, 1]) for (let k = 0; k < 11; k++) {
      const o = (k - 5) * r * 0.045; ctx.strokeStyle = k % 3 === 0 ? shade(col, 0.3) : k % 3 === 1 ? col : shade(col, -0.25); ctx.lineWidth = Math.max(1.2, r * 0.07); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(o * 0.35, -r * 0.12); ctx.bezierCurveTo(sgn * (r * 0.8 + o), -r * 0.6, sgn * (r * 0.95 + o), r * 0.55, o * 0.5, r * 0.78); ctx.stroke();
    }
    ctx.strokeStyle = rgba(shade(col, 0.8), 0.55); ctx.lineWidth = Math.max(1, r * 0.045); for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sgn * r * 0.06, -r * 0.2); ctx.bezierCurveTo(sgn * r * 0.62, -r * 0.62, sgn * r * 0.78, r * 0.3, sgn * r * 0.08, r * 0.7); ctx.stroke(); }
    // the twisted neck and cotton ties
    ctx.fillStyle = shade(col, -0.1); roundRectPath(ctx, -r * 0.16, -r * 0.34, r * 0.32, r * 0.5, r * 0.12); ctx.fill();
    ctx.strokeStyle = rgba(shade(col, -0.6), 0.7); ctx.lineWidth = 1.2; ctx.beginPath(); for (let k = 0; k < 5; k++) { ctx.moveTo(-r * 0.15, -r * 0.3 + k * r * 0.1); ctx.lineTo(r * 0.15, -r * 0.22 + k * r * 0.1); } ctx.stroke();
    ctx.fillStyle = '#f2ead6'; ctx.fillRect(-r * 0.2, -r * 0.1, r * 0.4, r * 0.1); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-r * 0.2, -r * 0.02, r * 0.4, r * 0.02);
    ctx.restore(); ringSel(ctx, S, b, on);
  },
});
Object.assign(TOOLS, {
  // a slim fly-shuttle thrown along the sley, pulled by a cord from the picker: pointed steel tips, silk in a window, thread trailing
  flyshuttle(ctx, S, T) {
    const u = T.u, p = pressOf(T), Lg = u * 2.9, H = u * 0.34, k = Math.min(1, T.a / 0.32), slide = (1 - (1 - (1 - k) * (1 - k))) * 0, off = -(1 - Math.min(1, T.a / 0.3) ** 0.5) * u * 1.8 * (T.a < 0.3 ? 1 : 0);
    void slide;
    softE(ctx, T.x + Lg * 0.5 + 3 + off, T.y + u * 0.2, Lg * 0.46, H * 0.4);
    ctx.save(); ctx.translate(T.x + Lg * 0.5 + off, T.y - H * 0.35 - p * u * 0.08); ctx.rotate(-0.04);
    if (T.a < 0.3) { ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = Math.max(1, u * 0.04); for (let q = 0; q < 3; q++) { ctx.beginPath(); ctx.moveTo(-Lg * 0.5 - u * (0.3 + q * 0.2), (q - 1) * H * 0.22); ctx.lineTo(-Lg * 0.5 - u * 0.05, (q - 1) * H * 0.22); ctx.stroke(); } }
    const g = ctx.createLinearGradient(0, -H, 0, H); g.addColorStop(0, '#d29a62'); g.addColorStop(0.5, '#8a5430'); g.addColorStop(1, '#3a1e0e');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-Lg / 2, 0); ctx.quadraticCurveTo(-Lg * 0.3, -H * 0.95, 0, -H * 0.75); ctx.quadraticCurveTo(Lg * 0.3, -H * 0.95, Lg / 2, 0); ctx.quadraticCurveTo(Lg * 0.3, H * 0.95, 0, H * 0.75); ctx.quadraticCurveTo(-Lg * 0.3, H * 0.95, -Lg / 2, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0e0804'; roundRectPath(ctx, -Lg * 0.2, -H * 0.4, Lg * 0.4, H * 0.8, H * 0.14); ctx.fill(); ctx.save(); roundRectPath(ctx, -Lg * 0.19, -H * 0.36, Lg * 0.38, H * 0.72, H * 0.12); ctx.clip(); wound(ctx, -Lg * 0.19, -H * 0.36, Lg * 0.38, H * 0.72, T.col, 8, 'w'); ctx.restore();
    for (const sgn of [-1, 1]) { const tg = ctx.createLinearGradient(sgn * Lg * 0.4, 0, sgn * Lg * 0.56, 0); tg.addColorStop(0, '#9aa3ac'); tg.addColorStop(0.5, '#f4f7fa'); tg.addColorStop(1, '#808890'); ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(sgn * Lg * 0.56, 0); ctx.lineTo(sgn * Lg * 0.38, -H * 0.2); ctx.lineTo(sgn * Lg * 0.38, H * 0.2); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    sheenLine(ctx, [[T.x + off, T.y - H * 0.3], [T.x - u * 0.5 + off, T.y - H * 0.1 + Math.sin(T.t * 3) * u * 0.04], [T.x - u * 1.0, T.y + u * 0.16]], Math.max(1.3, u * 0.05), T.col);
  },
  // a thick boat shuttle with a gold-capped spool, put down with a thump; a loose end of gold zari lies across the cloth
  korvaishuttle(ctx, S, T) {
    const u = T.u, p = pressOf(T), Lg = u * 2.7, H = u * 0.6, lift = (1 - p) * u * 0.1;
    ctx.save(); ctx.translate(0, 0); shuttleBody(ctx, T.x + Lg * 0.5 + u * 0.1, T.y - H * 0.35 - lift - p * 0.0, Lg, H, T.col, 1, -0.05 + p * 0.06); ctx.restore();
    sheenLine(ctx, [[T.x, T.y - H * 0.25], [T.x - u * 0.6, T.y - H * 0.02 + Math.sin(T.t * 2.4) * u * 0.03], [T.x - u * 1.2, T.y + u * 0.14]], Math.max(1.6, u * 0.07), '#ecc65a');
  },
});

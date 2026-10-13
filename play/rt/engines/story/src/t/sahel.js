// Theatre: Sahel salt caravan. A golden-hour Sahara pane (dunes, mud-brick trading town, acacia, well, a camel train
// walking in parallax) over a woven indigo cloth route strip with salt-slab waypoints and a moving camel marker.
import { register } from '../theatres.js';
import { mix, dark, light, alpha, poly, vgrad, hgrad } from '../figures.js';
import { place, vignette, particles, TAU } from '../kit.js';
import { pattern } from '../skins.js';
import { person, smooth, hf, clampv as clamp } from './_verskit.js';

const OCH = '#e8b84a', RUST = '#c8602a', CREAM = '#f4ead0', IND = '#1d2a62';

function ridgeY(R, f, off, seed, base, amp) {
  const u = f * 5 + off * 0.01 + seed;
  return base - amp * (0.5 + 0.3 * Math.sin(u * 1.3) + 0.2 * Math.sin(u * 2.9 + seed) + 0.1 * Math.sin(u * 6.1));
}
function ridge(ctx, R, base, amp, off, seed, fill, crest) {
  ctx.beginPath(); ctx.moveTo(R.x, R.y + R.h);
  for (let i = 0; i <= 40; i++) ctx.lineTo(R.x + R.w * i / 40, ridgeY(R, i / 40, off, seed, base, amp));
  ctx.lineTo(R.x + R.w, R.y + R.h); ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  if (crest) { // lit crest line where the wind lifts the sand
    ctx.strokeStyle = crest; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i <= 40; i++) { const y = ridgeY(R, i / 40, off, seed, base, amp); i ? ctx.lineTo(R.x + R.w * i / 40, y) : ctx.moveTo(R.x, y); }
    ctx.stroke();
  }
}

function miniCamel(ctx, x, y, s, t, ph, col) {
  const sw = Math.sin(t * 5 + ph) * s * 0.07;
  ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = s * 0.07; ctx.lineCap = 'round';
  for (const [lx, d] of [[-0.3, 1], [-0.2, -1], [0.22, -1], [0.32, 1]]) { ctx.beginPath(); ctx.moveTo(x + lx * s, y - s * 0.4); ctx.lineTo(x + lx * s + d * sw, y); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(x, y - s * 0.5, s * 0.46, s * 0.17, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x - s * 0.05, y - s * 0.7, s * 0.14, s * 0.17, 0, 0, TAU); ctx.fill();
  ctx.lineWidth = s * 0.09; ctx.beginPath(); ctx.moveTo(x + s * 0.38, y - s * 0.55); ctx.quadraticCurveTo(x + s * 0.6, y - s * 0.7, x + s * 0.6, y - s * 1.05); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x + s * 0.68, y - s * 1.08, s * 0.16, s * 0.07, -0.2, 0, TAU); ctx.fill();
}

function town(ctx, x, base, sz, body, shade, glow) {
  const bld = [[-0.9, 0.3, 0.45], [-0.55, 0.28, 0.7], [-0.15, 0.24, 1.0], [0.2, 0.3, 0.62], [0.58, 0.26, 0.5], [0.9, 0.22, 0.34]];
  for (const [bx, bw, bh] of bld) {
    const x0 = x + bx * sz * 0.5, w = bw * sz * 0.5, h = bh * sz * 0.55;
    ctx.fillStyle = vgrad(ctx, base - h, base, [[0, body], [1, shade]]);
    poly(ctx, [[x0 - w / 2, base], [x0 - w * 0.4, base - h], [x0 + w * 0.4, base - h], [x0 + w / 2, base]]); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; poly(ctx, [[x0 + w * 0.05, base], [x0 + w * 0.05, base - h], [x0 + w * 0.4, base - h], [x0 + w / 2, base]]); ctx.fill();
    ctx.fillStyle = shade; // toron beam-ends sticking out of the mud walls
    for (let r = 1; r < 5; r++) { const yy = base - h * (r / 5.2); ctx.fillRect(x0 - w * 0.5 - 2, yy, 4, 1.6); ctx.fillRect(x0 + w * 0.5 - 1, yy, 4, 1.6); }
    ctx.fillStyle = body;
    for (let k = -1; k <= 1; k += 2) ctx.fillRect(x0 + k * w * 0.32 - 1.5, base - h - sz * 0.03, 3, sz * 0.035);
    ctx.fillStyle = glow; ctx.fillRect(x0 - w * 0.08, base - h * 0.45, w * 0.16, h * 0.14);
  }
}

function acacia(ctx, x, base, s) {
  ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = s * 0.05; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + s * 0.06, base - s * 0.5, x - s * 0.02, base - s * 0.85); ctx.moveTo(x + s * 0.03, base - s * 0.55); ctx.lineTo(x + s * 0.3, base - s * 0.8); ctx.stroke();
  for (const [dx, dy, rx] of [[-0.05, 0.95, 0.42], [0.3, 0.92, 0.3], [-0.3, 0.86, 0.26]]) {
    ctx.fillStyle = '#5a6a2a'; ctx.beginPath(); ctx.ellipse(x + dx * s, base - dy * s, rx * s, s * 0.1, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,220,120,0.25)'; ctx.beginPath(); ctx.ellipse(x + dx * s, base - dy * s - s * 0.03, rx * s * 0.8, s * 0.04, 0, 0, TAU); ctx.fill();
  }
}

function well(ctx, x, base, s, t) {
  ctx.fillStyle = vgrad(ctx, base - s * 0.3, base, [[0, '#c98f5a'], [1, '#7a4a28']]);
  ctx.fillRect(x - s * 0.34, base - s * 0.2, s * 0.68, s * 0.1);
  ctx.beginPath(); ctx.ellipse(x, base - s * 0.1, s * 0.34, s * 0.1, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c98f5a'; ctx.beginPath(); ctx.ellipse(x, base - s * 0.2, s * 0.34, s * 0.09, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#10080a'; ctx.beginPath(); ctx.ellipse(x, base - s * 0.2, s * 0.25, s * 0.06, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#3a2410'; ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.moveTo(x - s * 0.3, base - s * 0.15); ctx.lineTo(x - s * 0.3, base - s * 0.75); ctx.moveTo(x + s * 0.3, base - s * 0.15); ctx.lineTo(x + s * 0.3, base - s * 0.75); ctx.moveTo(x - s * 0.38, base - s * 0.72); ctx.lineTo(x + s * 0.38, base - s * 0.72); ctx.stroke();
  const sw = Math.sin(t * 1.4) * s * 0.02;
  ctx.strokeStyle = '#d8c690'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + sw, base - s * 0.72); ctx.lineTo(x + sw, base - s * 0.4); ctx.stroke();
  ctx.fillStyle = '#6a3a1c'; ctx.fillRect(x + sw - s * 0.05, base - s * 0.4, s * 0.1, s * 0.09);
}

function saltSlab(ctx, x, y, w, h) {
  ctx.fillStyle = vgrad(ctx, y, y + h, [[0, '#ffffff'], [1, '#c9d2dc']]); ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(40,50,90,0.35)'; ctx.fillRect(x, y + h - 1.5, w, 1.5); ctx.fillRect(x + w - 1.5, y, 1.5, h);
  ctx.strokeStyle = 'rgba(30,40,80,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function stage(g, S0, v) {
  const { ctx } = g, t = v.t, n = Math.max(1, (v.route?.length ?? 1) - 1);
  const night = v.bg === 'night' || v.bg === 'camp';
  const ph = S0.h * 0.67, P = { x: S0.x, y: S0.y, w: S0.w, h: ph };
  const hor = P.y + ph * 0.56;
  const prog = smooth('sahel-stop', clamp(v.stop ?? 0, 0, n), t, 2);
  const off = prog * S0.w * 0.12 + t * 4;
  const sky = night ? [[0, '#070b24'], [0.55, '#2a2a66'], [1, '#8a4a5a']] : [[0, '#3a3c80'], [0.35, '#c0585a'], [0.7, '#f4a468'], [1, '#ffdca0']];
  ctx.fillStyle = vgrad(ctx, P.y, hor, sky); ctx.fillRect(P.x, P.y, P.w, hor - P.y + 2);
  if (night) {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 40; i++) { ctx.globalAlpha = 0.35 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2 + i * 1.9)); ctx.fillRect(P.x + P.w * hf(i), P.y + ph * 0.5 * hf(i + 90), 1.5, 1.5); }
    ctx.globalAlpha = 1;
    const mx = P.x + P.w * 0.8, my = P.y + ph * 0.2;
    const mg = ctx.createRadialGradient(mx, my, 3, mx, my, ph * 0.3); mg.addColorStop(0, 'rgba(255,240,200,0.55)'); mg.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = mg; ctx.fillRect(P.x, P.y, P.w, ph);
    ctx.fillStyle = '#fff6dc'; ctx.beginPath(); ctx.arc(mx, my, ph * 0.045, 0, TAU); ctx.fill();
  } else {
    const sx = P.x + P.w * 0.22, sy = hor - ph * 0.17;
    const sg = ctx.createRadialGradient(sx, sy, ph * 0.02, sx, sy, ph * 0.6); sg.addColorStop(0, 'rgba(255,240,170,0.9)'); sg.addColorStop(0.3, 'rgba(255,190,110,0.4)'); sg.addColorStop(1, 'rgba(255,170,90,0)');
    ctx.fillStyle = sg; ctx.fillRect(P.x, P.y, P.w, hor - P.y + 4);
    ctx.fillStyle = '#fff4c8'; ctx.beginPath(); ctx.arc(sx, sy, ph * 0.06, 0, TAU); ctx.fill();
    for (let i = 0; i < 3; i++) { ctx.fillStyle = `rgba(255,230,190,${0.22 - i * 0.05})`; ctx.beginPath(); ctx.ellipse(P.x + P.w * (0.5 + i * 0.17) - (t * 3 + i * 40) % 30, P.y + ph * (0.14 + i * 0.07), P.w * 0.14, ph * 0.012, 0, 0, TAU); ctx.fill(); }
  }
  const fogC = night ? '#6a4a66' : '#f2b87a';
  ridge(ctx, P, hor + 2, ph * 0.12, off * 0.3, 1, mix(fogC, night ? '#201840' : '#c07a4a', 0.5), alpha('#ffe0a0', night ? 0.15 : 0.45));
  const tp = prog / n, tsz = S0.w * (0.2 + 0.16 * tp), tx = P.x + P.w * (0.78 - 0.18 * tp);
  town(ctx, tx, hor + 3, tsz, mix(night ? '#8a6a70' : '#d6a070', fogC, 0.3), mix('#7a4a30', fogC, 0.4), night ? '#ffc060' : '#3a2010');
  ridge(ctx, P, hor + ph * 0.1, ph * 0.1, off * 0.55, 3, mix(night ? '#4a3050' : '#d98a4a', '#40201a', night ? 0.1 : 0.05), alpha('#ffd890', 0.4));
  const cy = hor + ph * 0.06, cs = ph * 0.075;
  for (let i = 0; i < 6; i++) {
    const cx = P.x + ((i * (cs * 2.2) + t * 9 + prog * 20) % (P.w + cs * 6)) - cs * 2;
    miniCamel(ctx, cx, cy + Math.sin(cx * 0.05) * 1.5, cs, t, i * 1.3, night ? '#1a1228' : '#5a2a1a');
  }
  ridge(ctx, P, hor + ph * 0.2, ph * 0.12, off * 0.9, 5, vgrad(ctx, hor, P.y + ph, [[0, night ? '#6a4036' : '#e8a45a'], [1, night ? '#40241c' : '#c07a38']]), alpha('#fff0c0', 0.5));
  ctx.strokeStyle = alpha('#ffe6b0', night ? 0.15 : 0.35); ctx.lineWidth = 1.2; ctx.beginPath();
  for (let i = 0; i < 16; i++) { const yy = hor + ph * (0.05 + 0.3 * hf(i)), xx = P.x + ((hf(i + 7) * P.w + t * (30 + 20 * hf(i + 3))) % (P.w + 60)) - 30; ctx.moveTo(xx, yy); ctx.quadraticCurveTo(xx + 20, yy - 3, xx + 40 + hf(i) * 30, yy + 1); }
  ctx.stroke();
  const gy = P.y + ph * 0.8;
  ctx.fillStyle = vgrad(ctx, gy, P.y + ph, [[0, night ? '#4a2c24' : '#d99a50'], [1, night ? '#2a1612' : '#9a6428']]); ctx.fillRect(P.x, gy, P.w, P.y + ph - gy + 1);
  ctx.strokeStyle = 'rgba(80,40,10,0.28)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let i = 0; i < 6; i++) { const yy = gy + (P.y + ph - gy) * (i + 0.5) / 6; ctx.moveTo(P.x, yy); for (let x = 0; x <= P.w; x += 14) ctx.lineTo(P.x + x, yy + Math.sin(x * 0.05 + i * 2) * 1.6); }
  ctx.stroke();
  acacia(ctx, P.x + P.w * 0.06, gy + ph * 0.06, ph * 0.42);
  if (v.bg === 'oasis') {
    for (const [px, s] of [[0.93, 1], [0.84, 0.7]]) {
      const bx = P.x + P.w * px, by = gy + ph * 0.05, top = by - ph * 0.5 * s;
      ctx.strokeStyle = '#4a3018'; ctx.lineWidth = ph * 0.02; ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + ph * 0.04, by - ph * 0.25 * s, bx, top); ctx.stroke();
      ctx.strokeStyle = '#2f7a3a'; ctx.lineWidth = ph * 0.014;
      for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.6 + Math.sin(t + k) * 0.04; ctx.beginPath(); ctx.moveTo(bx, top); ctx.quadraticCurveTo(bx + Math.cos(a) * ph * 0.2, top + Math.sin(a) * ph * 0.14, bx + Math.cos(a) * ph * 0.3, top + ph * 0.12 + Math.sin(a) * ph * 0.05); ctx.stroke(); }
    }
  } else well(ctx, P.x + P.w * 0.92, gy + ph * 0.07, ph * 0.5, t);
  const floorY = P.y + ph * 0.94, FH = ph * 0.64;
  for (const f of v.figs) { if (f.alpha < 0.05) continue; ctx.fillStyle = `rgba(30,12,20,${0.28 * f.alpha})`; ctx.beginPath(); ctx.ellipse(P.x + P.w * f.x + FH * 0.22, floorY + 2, FH * 0.3, FH * 0.03, 0, 0, TAU); ctx.fill(); }
  place(ctx, P, floorY, FH, v, { style: 'color', noShadow: true });
  ctx.fillStyle = 'rgba(255,235,190,0.1)'; for (let i = 0; i < 4; i++) ctx.fillRect(P.x, hor - 4 - i * 5 + Math.sin(t * 2 + i) * 1.4, P.w, 1.4);
  const wl = ctx.createLinearGradient(P.x, 0, P.x + P.w, 0); wl.addColorStop(0, night ? 'rgba(20,10,60,0.12)' : 'rgba(255,170,80,0.14)'); wl.addColorStop(1, 'rgba(0,0,0,0.12)'); ctx.fillStyle = wl; ctx.fillRect(P.x, P.y, P.w, ph);
  vignette(ctx, P, 0.3);

  // ---- route strip: woven indigo cloth ---------------------------------------------------------------------
  const R = { x: S0.x, y: S0.y + ph, w: S0.w, h: S0.h - ph };
  ctx.fillStyle = vgrad(ctx, R.y, R.y + R.h, [[0, '#26367a'], [1, '#121a46']]); ctx.fillRect(R.x, R.y, R.w, R.h);
  ctx.strokeStyle = 'rgba(160,190,255,0.07)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = R.x; x < R.x + R.w; x += 3) { ctx.moveTo(x, R.y); ctx.lineTo(x, R.y + R.h); }
  for (let y = R.y; y < R.y + R.h; y += 3) { ctx.moveTo(R.x, y); ctx.lineTo(R.x + R.w, y); }
  ctx.stroke();
  pattern(ctx, 'diamond', R.x, R.y, R.w, R.h, OCH, 0.08);
  const b = Math.min(13, R.h * 0.12);
  for (const by of [R.y, R.y + R.h - b]) {
    ctx.fillStyle = RUST; ctx.fillRect(R.x, by, R.w, b);
    const tw = b * 1.1, up = by === R.y;
    for (let x = R.x, i = 0; x < R.x + R.w; x += tw, i++) { ctx.fillStyle = i % 2 ? OCH : CREAM; poly(ctx, [[x, up ? by : by + b], [x + tw, up ? by : by + b], [x + tw / 2, up ? by + b * 0.85 : by + b * 0.15]]); ctx.fill(); }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(R.x, R.y + b, R.w, 3);
  const r = v.route;
  if (r && r.length) {
    const I = { x: R.x + R.w * 0.07, y: R.y + b + R.h * 0.3, w: R.w * 0.86, h: R.h - b * 2 - R.h * 0.56 };
    const pt = (i) => ({ x: I.x + I.w * (r[i].x - 0.07) / 0.86, y: I.y + I.h * clamp((r[i].y - 0.28) / 0.42, 0, 1) });
    const bz = (a, bb, u) => { const cx = (a.x + bb.x) / 2; return { x: (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * cx + u * u * bb.x, y: (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * a.y + u * u * bb.y }; };
    const seg = (a, bb) => { ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo((a.x + bb.x) / 2, a.y, bb.x, bb.y); };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.setLineDash([2, 8]); ctx.strokeStyle = alpha(CREAM, 0.55); ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i < r.length - 1; i++) seg(pt(i), pt(i + 1)); ctx.stroke(); ctx.setLineDash([]);
    const cur = Math.floor(prog + 1e-6);
    ctx.strokeStyle = '#6a3a10'; ctx.lineWidth = 7; ctx.beginPath(); for (let i = 0; i < Math.min(cur, r.length - 1); i++) seg(pt(i), pt(i + 1)); ctx.stroke();
    ctx.strokeStyle = OCH; ctx.lineWidth = 4; ctx.stroke();
    const fs = Math.round(g.px(13));
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 ${fs}px system-ui, sans-serif`;
    r.forEach((w, i) => {
      const p = pt(i), done = i <= prog + 0.3, ic = Math.max(7, R.h * 0.1);
      if (i === r.length - 1) { ctx.fillStyle = done ? OCH : '#8a7a58'; poly(ctx, [[p.x - ic * 0.7, p.y + ic * 0.5], [p.x - ic * 0.5, p.y - ic], [p.x + ic * 0.5, p.y - ic], [p.x + ic * 0.7, p.y + ic * 0.5]]); ctx.fill(); ctx.fillStyle = '#1d1a40'; ctx.fillRect(p.x - 2, p.y - ic * 0.2, 4, ic * 0.7); }
      else if (/well|oasis/i.test(w.name)) { ctx.fillStyle = done ? '#7ad0e8' : '#4a6a8a'; ctx.beginPath(); ctx.arc(p.x, p.y, ic * 0.7, 0, TAU); ctx.fill(); ctx.strokeStyle = CREAM; ctx.lineWidth = 2; ctx.stroke(); }
      else if (done) { saltSlab(ctx, p.x - ic * 0.9, p.y - ic * 0.2, ic * 1.8, ic * 0.55); saltSlab(ctx, p.x - ic * 0.6, p.y - ic * 0.75, ic * 1.5, ic * 0.55); }
      else { ctx.fillStyle = '#8a7a58'; poly(ctx, [[p.x - ic * 0.8, p.y + ic * 0.4], [p.x, p.y - ic * 0.8], [p.x + ic * 0.8, p.y + ic * 0.4]]); ctx.fill(); }
      const ly = p.y + ic * 1.75;
      const lx = clamp(p.x, R.x + fs * 3.4, R.x + R.w - fs * 3.4);
      ctx.font = `700 ${fs}px system-ui, sans-serif`; ctx.lineWidth = 3.5; ctx.strokeStyle = '#0c1236'; ctx.strokeText(w.name, lx, ly); ctx.fillStyle = i === Math.round(prog) ? '#fff2b0' : CREAM; ctx.fillText(w.name, lx, ly);
    });
    const k = clamp(prog, 0, r.length - 1), i0 = Math.min(Math.floor(k), r.length - 2), mp = bz(pt(i0), pt(i0 + 1), k - i0), bob = Math.sin(t * 6) * 1.5;
    const cs2 = Math.max(10, R.h * 0.13);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(mp.x, mp.y + 2, cs2 * 0.6, cs2 * 0.15, 0, 0, TAU); ctx.fill();
    miniCamel(ctx, mp.x - cs2 * 0.2, mp.y - 4 + bob * 0.4, cs2, t, 0, '#ffdc78');
    ctx.strokeStyle = 'rgba(255,230,130,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mp.x, mp.y - cs2 * 0.55, cs2 * 1.15 + bob * 0.3, 0, TAU); ctx.stroke();
  }
  vignette(ctx, R, 0.25);
}

// ---- puppets: indigo-veiled traders and a patterned, laden camel -------------------------------------------------
function camel(T) {
  const { ctx, c, s, t, phase, o, bodyC } = T;
  const bob = Math.sin(t * 2.4 + phase) * s * 0.01, sw = o.walk ? Math.sin(t * 6 + phase) * s * 0.06 : Math.sin(t * 1.2 + phase) * s * 0.012;
  const fur = bodyC, dk = dark(fur, 0.3);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const leg = (lx, d, col) => { ctx.strokeStyle = col; ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.moveTo(lx * s, -0.36 * s); ctx.lineTo(lx * s + d * sw * 0.6 - s * 0.01, -0.17 * s); ctx.lineTo(lx * s + d * sw, 0); ctx.stroke(); ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.ellipse(lx * s + d * sw + s * 0.01, -s * 0.008, s * 0.045, s * 0.016, 0, 0, TAU); ctx.fill(); };
  leg(-0.2, -1, dk); leg(0.15, -1, dk);
  ctx.strokeStyle = fur; ctx.lineWidth = s * 0.075; ctx.beginPath(); ctx.moveTo(0.24 * s, -0.46 * s + bob); ctx.quadraticCurveTo(0.4 * s, -0.55 * s, 0.38 * s, -0.8 * s + bob); ctx.stroke();
  ctx.fillStyle = hgrad(ctx, -0.3 * s, 0.3 * s, [[0, light(fur, 0.18)], [0.5, fur], [1, dark(fur, 0.3)]]);
  ctx.beginPath(); ctx.ellipse(0, -0.44 * s + bob, 0.3 * s, 0.1 * s, 0, 0, TAU); ctx.fill();
  for (const [hx, r] of [[-0.08, 0.08], [0.1, 0.07]]) { ctx.beginPath(); ctx.ellipse(hx * s, -0.54 * s + bob, r * s, r * 1.25 * s, 0, 0, TAU); ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(0.44 * s, -0.82 * s + bob, 0.085 * s, 0.045 * s, -0.25, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#a2321e'; ctx.lineWidth = s * 0.014; ctx.beginPath(); ctx.arc(0.43 * s, -0.82 * s + bob, s * 0.045, 0.2, 5.5); ctx.stroke();
  ctx.fillStyle = OCH; ctx.beginPath(); ctx.arc(0.355 * s, -0.78 * s + bob, s * 0.012, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1c130e'; ctx.beginPath(); ctx.arc(0.42 * s, -0.84 * s + bob, s * 0.009, 0, TAU); ctx.fill();
  const bw = 0.2 * s, by = -0.5 * s + bob;
  ctx.fillStyle = IND; ctx.beginPath(); ctx.moveTo(-bw, by); ctx.quadraticCurveTo(0, by - s * 0.06, bw, by); ctx.lineTo(bw * 0.95, by + s * 0.24); ctx.lineTo(-bw * 0.95, by + s * 0.24); ctx.closePath(); ctx.fill();
  [RUST, OCH, CREAM, OCH].forEach((cl, i) => { ctx.fillStyle = cl; ctx.fillRect(-bw * 0.95, by + s * (0.03 + i * 0.045), bw * 1.9, s * 0.02); });
  ctx.fillStyle = OCH; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(-bw * 0.9 + i * bw * 0.26, by + s * 0.245, s * 0.013, 0, TAU); ctx.fill(); }
  if (c.pack) {
    for (const sd of [-1, 1]) { const sx = sd * bw * 0.95 - s * 0.045; saltSlab(ctx, sx, by - s * 0.02, s * 0.09, s * 0.2); saltSlab(ctx, sx, by + s * 0.19, s * 0.09, s * 0.08); }
    ctx.fillStyle = '#6a3a1c'; ctx.beginPath(); ctx.ellipse(0, by - s * 0.07, s * 0.13, s * 0.07, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#2a1408'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.strokeStyle = CREAM; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-bw, by - s * 0.01); ctx.lineTo(bw, by - s * 0.01); ctx.stroke();
  }
  leg(-0.08, 1, fur); leg(0.25, 1, fur);
  T.head.x = 0.44 * s; T.head.y = -0.82 * s; T.head.r = s * 0.06;
  T.shoulders.push([0.14 * s, -0.5 * s], [0.2 * s, -0.5 * s]); T.hands.push([-0.2 * s, -0.4 * s], [0.0, -0.4 * s]);
  T.knees.push([0.1 * s, -0.2 * s], [-0.1 * s, -0.2 * s]);
  return true;
}

function sahelPerson(T) {
  const { c } = T, hat = c.hat ?? 'turban';
  const wrap = c.color ?? '#2a3f8a';
  const indigo = hat === 'hood' ? '#3a2a22' : hat === 'cap' ? '#7a2a22' : '#1f3a8a';
  return person(T, {
    wTop: 0.15, wHem: hat === 'cap' ? 0.2 : 0.27, sleeve: 0.1,
    veil: hat === 'turban' ? mix(indigo, '#000000', 0.1) : null,
    robe: () => wrap,
    sleeveCol: () => light(wrap, 0.05),
    deco(ctx, G) { // embroidered chest panel and hem band of a long boubou
      ctx.fillStyle = alpha(G.accC, 0.9); ctx.fillRect(-G.wT * 0.55, G.ty, G.wT * 1.1, G.H * 0.2);
      ctx.strokeStyle = G.accC; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-G.wT * 0.4, G.ty + G.H * 0.2); ctx.lineTo(0, G.ty + G.H * 0.28); ctx.lineTo(G.wT * 0.4, G.ty + G.H * 0.2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(i * G.wT * 0.2, G.ty + G.H * 0.08, 1.8, 0, TAU); ctx.fill(); }
      ctx.fillStyle = mix(G.accC, '#000000', 0.25); ctx.fillRect(-G.wH * 1.2, G.hem - G.H * 0.06, G.wH * 2.4, G.H * 0.035);
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; for (let i = -4; i <= 4; i++) ctx.fillRect(i * G.wH * 0.24, G.hem - G.H * 0.052, G.wH * 0.1, G.H * 0.018);
      if (T.kind === 'trader') { ctx.fillStyle = '#6a3a1c'; ctx.beginPath(); ctx.ellipse(-G.wT * 0.9, G.ty + G.H * 0.3, G.H * 0.07, G.H * 0.09, 0.25, 0, TAU); ctx.fill(); ctx.strokeStyle = CREAM; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(G.wT * 0.6, G.ty); ctx.lineTo(-G.wT * 0.8, G.ty + G.H * 0.2); ctx.stroke(); }
    },
    headgear(ctx, hx, hy, r, TT, G) {
      if (hat === 'turban') { // tagelmust: layers of indigo cloth wound high, tail hanging behind
        for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? mix(indigo, '#ffffff', 0.12) : indigo; ctx.beginPath(); ctx.ellipse(hx - r * 0.1, hy - r * (0.45 + i * 0.26), r * (1.22 - i * 0.07), r * 0.34, -0.08, 0, TAU); ctx.fill(); }
        ctx.fillStyle = indigo; ctx.beginPath(); ctx.moveTo(hx - r, hy - r * 0.3); ctx.quadraticCurveTo(hx - r * 1.7, hy + r * 0.8, hx - r * 1.2 + Math.sin(G.t * 2) * r * 0.1, hy + r * 2.6); ctx.lineTo(hx - r * 0.7, hy + r * 2.5); ctx.quadraticCurveTo(hx - r * 0.9, hy + r * 0.5, hx - r * 0.5, hy - r * 0.2); ctx.fill();
      } else if (hat === 'hood') { // pointed travelling hood
        ctx.fillStyle = indigo; ctx.beginPath(); ctx.moveTo(hx - r * 1.15, hy + r * 0.9); ctx.quadraticCurveTo(hx - r * 1.4, hy - r * 0.9, hx - r * 0.2, hy - r * 2.0); ctx.quadraticCurveTo(hx + r * 1.0, hy - r * 1.0, hx + r * 0.95, hy - r * 0.15); ctx.quadraticCurveTo(hx + r * 0.2, hy - r * 0.9, hx - r * 0.4, hy + r * 0.2); ctx.quadraticCurveTo(hx - r * 0.7, hy + r * 1.0, hx - r * 1.15, hy + r * 0.9); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.stroke();
      } else { // embroidered round cap
        ctx.fillStyle = indigo; ctx.beginPath(); ctx.ellipse(hx, hy - r * 0.75, r * 1.0, r * 0.55, 0, Math.PI, TAU); ctx.fill();
        ctx.fillStyle = OCH; ctx.fillRect(hx - r * 1.0, hy - r * 0.78, r * 2.0, r * 0.2);
        ctx.fillStyle = CREAM; for (let i = -2; i <= 2; i++) ctx.fillRect(hx + i * r * 0.36 - 1, hy - r * 0.76, 2, r * 0.16);
      }
    },
    hair: (ctx, hx, hy, r) => { ctx.fillStyle = '#1c130e'; ctx.beginPath(); ctx.arc(hx, hy, r * 1.02, Math.PI * 0.95, Math.PI * 1.9); ctx.lineTo(hx, hy - r * 0.2); ctx.fill(); },
  });
}

register({
  id: 'sahel',
  look: { frame: '#5a3a1c', glow: '#fff1b8', ink: '#4a3420' },
  stage,
  puppet(T) {
    if (T.kind === 'camel') return camel(T);
    if (T.kind === 'beast' || T.kind === 'duck' || T.kind === 'croc' || T.kind === 'monkey') return false;
    return sahelPerson(T);
  },
  skin: {
    card: { top: '#2a3a7a', bot: '#141c4a', edge: OCH, inner: 'rgba(255,220,140,0.25)', ink: '#fbf0da', dim: '#d2bc9a', accent: OCH, shape: 'cut', r: 14, pattern: 'diamond', patCol: OCH, patA: 0.1, band: 6, bandCol: RUST, bandPat: 'zig' },
    name: { fill: '#9a5a22', fillEnd: OCH, ink: '#fff6dc', edge: 'rgba(255,230,160,0.6)', shape: 'cut' },
    plaque: { base: '#6a3f22', hot: '#9a6032', end: OCH, ink: '#fff6e0', inkEnd: '#1b1206', edge: 'rgba(20,8,0,0.7)', inner: 'rgba(232,184,74,0.45)', shape: 'cut', r: 12, pattern: 'zig', patCol: OCH, patA: 0.13, med: 'diamond', medA: '#fff0b8', medB: '#c8802a' },
    meter: { fill: '#10183e', edge: 'rgba(232,184,74,0.25)', bead: 'diamond', col: OCH, ink: '#fbf0da' },
    trans: 'sand', transCol: '#d9a45a',
    snd: { root: 174, scale: [1, 1.125, 1.333, 1.5, 1.78], hit: 'pluck', voiceLow: true, voiceVol: 0.03 },
    voice: 5,
  },
});
export default null;

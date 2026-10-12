// Stage painters for the story engine: real theatres drawn from canvas primitives (no assets).
// drawSceneArt(g, rect, view) paints one stage kind inside `rect`; the activity supplies the animated `view`.
import { drawFigure, drawBackdrop, drawCurtains, mix, dark, light, alpha, poly, vgrad, hgrad, rrPath } from './figures.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeOutBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };

// ---- shared painting tools -----------------------------------------------------------------------------------
function weave(ctx, R, step, col) {
  ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = R.x + step; x < R.x + R.w; x += step) { ctx.moveTo(x, R.y); ctx.lineTo(x, R.y + R.h); }
  for (let y = R.y + step; y < R.y + R.h; y += step) { ctx.moveTo(R.x, y); ctx.lineTo(R.x + R.w, y); }
  ctx.stroke();
}
function vignette(ctx, R, a) {
  const g = ctx.createRadialGradient(R.x + R.w / 2, R.y + R.h / 2, Math.min(R.w, R.h) * 0.3, R.x + R.w / 2, R.y + R.h / 2, Math.max(R.w, R.h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`);
  ctx.fillStyle = g; ctx.fillRect(R.x, R.y, R.w, R.h);
}
function woodRect(ctx, x, y, w, h, col) {
  ctx.fillStyle = vgrad(ctx, y, y + h, [[0, light(col, 0.22)], [0.5, col], [1, dark(col, 0.35)]]);
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1; ctx.beginPath();
  const n = Math.max(2, Math.round(h / 5));
  for (let i = 1; i < n; i++) { const yy = y + (h * i) / n + ((i * 7) % 3) - 1; ctx.moveTo(x, yy); ctx.lineTo(x + w, yy + ((i % 2) ? 1 : -1)); }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x, y, w, 1.5);
}
function floorBoards(ctx, R, y0, col, t) {
  const h = R.y + R.h - y0;
  ctx.fillStyle = vgrad(ctx, y0, y0 + h, [[0, dark(col, 0.45)], [0.35, col], [1, light(col, 0.12)]]);
  ctx.fillRect(R.x, y0, R.w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.2; ctx.beginPath();
  const cx = R.x + R.w / 2;
  for (let j = -9; j <= 9; j++) { ctx.moveTo(cx + j * R.w * 0.075, R.y + R.h); ctx.lineTo(cx + j * R.w * 0.032, y0); }
  for (let i = 1; i < 6; i++) { const yy = y0 + h * Math.pow(i / 6, 1.8); ctx.moveTo(R.x, yy); ctx.lineTo(R.x + R.w, yy); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.beginPath();
  for (let j = -9; j <= 9; j++) { ctx.moveTo(cx + j * R.w * 0.075 + 2, R.y + R.h); ctx.lineTo(cx + j * R.w * 0.032 + 1, y0); }
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(R.x, y0, R.w, 2);
}
function footlights(ctx, R, y, t, col) {
  const n = Math.max(5, Math.round(R.w / 56));
  for (let i = 0; i < n; i++) {
    const x = R.x + R.w * (i + 0.5) / n, fl = 0.85 + 0.15 * Math.sin(t * 7 + i * 2.1);
    const g = ctx.createRadialGradient(x, y, 1, x, y, R.w / n * 0.8 * fl);
    g.addColorStop(0, alpha(col, 0.7)); g.addColorStop(1, alpha(col, 0));
    ctx.fillStyle = g; ctx.fillRect(x - R.w / n, y - R.w / n * 0.8, R.w / n * 2, R.w / n * 1.2);
    ctx.fillStyle = '#fff4cc'; ctx.beginPath(); ctx.ellipse(x, y, 3.2, 2.2, 0, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = 'rgba(40,24,10,0.9)'; ctx.fillRect(R.x, y + 2, R.w, 5);
}
function spot(ctx, R, x, topY, floorY, col, a) {
  const g = ctx.createLinearGradient(0, topY, 0, floorY);
  g.addColorStop(0, alpha(col, 0)); g.addColorStop(1, alpha(col, a));
  ctx.fillStyle = g;
  const w0 = R.w * 0.05, w1 = R.w * 0.2;
  poly(ctx, [[x - w0, topY], [x + w0, topY], [x + w1, floorY], [x - w1, floorY]]); ctx.fill();
  const p = ctx.createRadialGradient(x, floorY, 1, x, floorY, w1 * 1.1);
  p.addColorStop(0, alpha(col, a * 1.2)); p.addColorStop(1, alpha(col, 0));
  ctx.save(); ctx.translate(0, floorY); ctx.scale(1, 0.25); ctx.translate(0, -floorY);
  ctx.fillStyle = p; ctx.fillRect(x - w1 * 1.2, floorY - w1 * 1.2, w1 * 2.4, w1 * 2.4); ctx.restore();
}
function star(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.46 : r; i ? ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  ctx.closePath();
}
function lantern(ctx, x, y, r, col, t, ph) {
  const sw = Math.sin(t * 1.6 + ph) * r * 0.15;
  const g = ctx.createRadialGradient(x + sw, y, 1, x + sw, y, r * 3);
  g.addColorStop(0, alpha('#ffd27a', 0.55)); g.addColorStop(1, alpha('#ffd27a', 0));
  ctx.fillStyle = g; ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
  ctx.strokeStyle = 'rgba(40,20,8,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - r * 2.2); ctx.lineTo(x + sw, y - r); ctx.stroke();
  ctx.fillStyle = vgrad(ctx, y - r, y + r, [[0, light(col, 0.35)], [1, dark(col, 0.2)]]);
  ctx.beginPath(); ctx.ellipse(x + sw, y, r * 0.78, r, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,240,180,0.55)'; ctx.beginPath(); ctx.ellipse(x + sw, y, r * 0.4, r * 0.6, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#d9a52a'; ctx.fillRect(x + sw - r * 0.3, y - r * 1.05, r * 0.6, r * 0.2); ctx.fillRect(x + sw - r * 0.3, y + r * 0.88, r * 0.6, r * 0.2);
}
function tassel(ctx, x, y, r, col) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0, TAU); ctx.fill();
  poly(ctx, [[x - r * 0.4, y + r * 0.2], [x + r * 0.4, y + r * 0.2], [x + r * 0.55, y + r * 2], [x - r * 0.55, y + r * 2]]); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = -1; i <= 1; i++) { ctx.moveTo(x + i * r * 0.2, y + r * 0.3); ctx.lineTo(x + i * r * 0.28, y + r * 1.95); } ctx.stroke();
}

// ---- figure placement -----------------------------------------------------------------------------------------
function place(ctx, R, floorY, H, v, o) {
  for (const f of v.figs) {
    if (f.alpha < 0.01 || !f.c) continue;
    const x = R.x + R.w * f.x;
    const base = floorY + (o.dy ?? 0) + (o.bob ? Math.sin(v.t * 2.2 + f.x * 9) * o.bob : 0);
    const common = {
      t: v.t, pose: f.pose, speaking: f.speaking, flip: f.flip, a1: f.a1, a2: f.a2, lean: f.lean, walk: f.walk,
      alpha: (f.alpha ?? 1) * (o.alpha ?? 1),
    };
    if (o.penumbra) {
      drawFigure(ctx, f.c, x, base + 1, H * 1.055, { ...common, style: 'shadow', cut: o.cut, alpha: common.alpha * 0.3, noShadow: true });
    }
    drawFigure(ctx, f.c, x, base, H, {
      ...common, style: o.style, cut: o.cut,
      strings: o.stringsY != null ? o.stringsY - base : null,
      rods: o.rodsY != null ? o.rodsY - base : null,
    });
  }
}

// ---- audience, reaction particles and the star reveal ---------------------------------------------------------
function audience(ctx, R, v, y0) {
  const n = Math.max(6, Math.round(R.w / 30));
  const c = v.crowd ?? { cheer: 0, mood: 0 };
  for (let layer = 0; layer < 2; layer++) {
    for (let i = 0; i < n; i++) {
      const h = ((i * 2654435761 + layer * 97) >>> 0) / 4294967296;
      const x = R.x + R.w * ((i + 0.5 + (layer ? 0.5 : 0) + (h - 0.5) * 0.4) / (n + 0.5));
      const r = R.w * (layer ? 0.024 : 0.03) * (0.85 + h * 0.4);
      const pop = c.cheer * (0.5 + 0.5 * Math.sin(v.t * 12 + i * 1.7)) * r * 0.9;
      const sway = c.mood < 0 ? Math.sin(v.t * 2.2 + i) * r * 0.25 * Math.abs(c.cheer) : 0;
      const baseY = y0 + layer * -r * 0.55 + (layer ? 0 : 0);
      const y = baseY - (c.mood > 0 ? pop : 0);
      const col = layer ? '#0d0a14' : '#050309';
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(x + sway, y + r * 1.9, r * 1.55, r * 1.5, 0, Math.PI, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(x + sway, y, r, 0, TAU); ctx.fill();
      // warm rim light from the stage on the heads
      ctx.strokeStyle = 'rgba(255,205,120,0.28)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x + sway, y, r, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      if (c.mood > 0 && c.cheer > 0.25 && i % 3 === 0) { // raised hands
        ctx.strokeStyle = col; ctx.lineWidth = r * 0.5; ctx.lineCap = 'round';
        const a = Math.sin(v.t * 14 + i) * 0.25;
        ctx.beginPath(); ctx.moveTo(x + sway - r * 1.2, y + r * 1.5); ctx.lineTo(x + sway - r * 1.7 + a * r, y - r * 1.2); ctx.moveTo(x + sway + r * 1.2, y + r * 1.5); ctx.lineTo(x + sway + r * 1.7 - a * r, y - r * 1.2); ctx.stroke();
      }
    }
  }
}
function particles(ctx, R, v) {
  for (const p of v.parts ?? []) {
    const k = p.age / p.life;
    const x = R.x + R.w * (p.x + p.vx * p.age), y = R.y + R.h * (p.y + p.vy * p.age + 0.35 * p.age * p.age);
    ctx.globalAlpha = clamp(1 - k * k, 0, 1);
    const r = R.w * 0.016 * p.size * (1 - k * 0.3);
    if (p.type === 'star') { ctx.fillStyle = p.col; star(ctx, x, y, r * 1.5); ctx.fill(); }
    else if (p.type === 'heart') { ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(x - r * 0.5, y - r * 0.2, r * 0.6, 0, TAU); ctx.arc(x + r * 0.5, y - r * 0.2, r * 0.6, 0, TAU); ctx.fill(); poly(ctx, [[x - r * 1.05, y + r * 0.1], [x + r * 1.05, y + r * 0.1], [x, y + r * 1.3]]); ctx.fill(); }
    else if (p.type === 'puff') { ctx.strokeStyle = p.col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r * (1 + k * 1.6), 0, TAU); ctx.stroke(); }
    else { ctx.fillStyle = p.col; ctx.fillRect(x - r * 0.5, y - r * 0.5, r, r * 1.4); }
  }
  ctx.globalAlpha = 1;
}
function starReveal(ctx, R, v) {
  const e = v.endStars;
  if (!e) return;
  const cx = R.x + R.w / 2, cy = R.y + R.h * 0.3, r = Math.min(R.w * 0.11, R.h * 0.16);
  const fade = clamp(e.age / 0.5, 0, 1);
  ctx.fillStyle = `rgba(8,4,16,${0.45 * fade})`; ctx.fillRect(R.x, R.y, R.w, R.h);
  const g = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 4.5);
  g.addColorStop(0, `rgba(255,214,110,${0.35 * fade})`); g.addColorStop(1, 'rgba(255,214,110,0)');
  ctx.fillStyle = g; ctx.fillRect(R.x, R.y, R.w, R.h);
  for (let i = 0; i < 3; i++) {
    const x = cx + (i - 1) * r * 2.5, y = cy + (i === 1 ? -r * 0.25 : r * 0.1);
    const age = e.age - 0.35 - i * 0.42;
    // empty socket
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; star(ctx, x, y, r); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2; ctx.stroke();
    if (i < e.n && age > 0) {
      const k = clamp(age / 0.5, 0, 1), sc = easeOutBack(k);
      ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.rotate((1 - k) * 0.6);
      const sg = ctx.createLinearGradient(0, -r, 0, r); sg.addColorStop(0, '#fff2a8'); sg.addColorStop(0.5, '#f6c640'); sg.addColorStop(1, '#c47f12');
      ctx.fillStyle = sg; star(ctx, 0, 0, r); ctx.fill();
      ctx.strokeStyle = '#8a5208'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; star(ctx, -r * 0.1, -r * 0.12, r * 0.45); ctx.fill();
      ctx.restore();
      if (age < 0.6) { // ring of sparkles on landing
        for (let k2 = 0; k2 < 8; k2++) { const a = (k2 / 8) * TAU + i, d = r * (0.8 + age * 3); ctx.globalAlpha = 1 - age / 0.6; ctx.fillStyle = '#fff3b0'; ctx.fillRect(x + Math.cos(a) * d - 1.5, y + Math.sin(a) * d - 1.5, 3, 3); }
        ctx.globalAlpha = 1;
      }
    }
  }
}

// ---- per stage painters -----------------------------------------------------------------------------------------
function shadowStage(g, S0, v) {
  const { ctx } = g, L = v.L, t = v.t, set = v.setting;
  // dark playhouse
  ctx.fillStyle = vgrad(ctx, S0.y, S0.y + S0.h, [[0, '#0a0503'], [1, '#1b0e07']]); ctx.fillRect(S0.x, S0.y, S0.w, S0.h);
  const fr = Math.max(8, S0.w * 0.05);
  const I = { x: S0.x + fr, y: S0.y + fr * 0.9, w: S0.w - fr * 2, h: S0.h - fr * 1.9 - (S0.h * 0.09) };
  const flick = 0.93 + 0.07 * Math.sin(t * 9) * Math.sin(t * 3.7);
  const lampX = I.x + I.w * 0.5 + Math.sin(t * 0.7) * I.w * 0.01, lampY = I.y + I.h * 0.3;
  // lit cloth
  const rg = ctx.createRadialGradient(lampX, lampY, I.h * 0.04, lampX, I.y + I.h * 0.5, Math.max(I.w, I.h) * 0.78 * flick);
  rg.addColorStop(0, L.lamp); rg.addColorStop(0.45, L.screen); rg.addColorStop(1, L.screenEdge);
  ctx.fillStyle = rg; ctx.fillRect(I.x, I.y, I.w, I.h);
  weave(ctx, I, 3, 'rgba(120,70,20,0.06)');
  // faint hanging folds and uneven tension in the cloth
  ctx.fillStyle = hgrad(ctx, I.x, I.x + I.w, [[0, 'rgba(0,0,0,0.12)'], [0.12, 'rgba(0,0,0,0)'], [0.88, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.12)']]); ctx.fillRect(I.x, I.y, I.w, I.h);
  ctx.save(); ctx.beginPath(); ctx.rect(I.x, I.y, I.w, I.h); ctx.clip();
  const floorY = I.y + I.h * 0.88;
  ctx.globalAlpha = 0.5;
  drawBackdrop(ctx, v.bg, I, floorY, { far: mix(L.screenEdge, '#000000', 0.62), near: mix(L.screenEdge, '#000000', 0.42), glow: L.lamp, sky: false }, t);
  ctx.globalAlpha = 1;
  // setting props that live on the screen
  if (set === 'wayang') gunungan(ctx, I, floorY, L, v, t);
  if (set === 'karagoz') tulipBorder(ctx, I, L);
  // ground line and the banana-log ledge the rods are planted in
  ctx.fillStyle = 'rgba(40,18,6,0.55)'; ctx.fillRect(I.x, floorY, I.w, 3);
  place(ctx, I, floorY, I.h * 0.56, v, { style: 'shadow', cut: L.lamp, rodsY: I.y + I.h, penumbra: true });
  // light bloom washes over everything (it is a lit screen, nothing is pure black)
  const bloom = ctx.createRadialGradient(lampX, lampY, 2, lampX, lampY, I.h * 0.7 * flick);
  bloom.addColorStop(0, alpha(L.lamp, 0.2)); bloom.addColorStop(1, alpha(L.lamp, 0));
  ctx.fillStyle = bloom; ctx.fillRect(I.x, I.y, I.w, I.h);
  if (v.spotX != null) { /* shadow play has no spotlight: the speaker simply glows a little */ }
  ctx.restore();
  // ledge below the screen
  const ly = I.y + I.h;
  if (set === 'wayang') { // banana trunk with puppet bases stuck in it
    ctx.fillStyle = vgrad(ctx, ly, ly + S0.h * 0.07, [[0, '#8a9a4a'], [0.5, '#6a7a38'], [1, '#3a4a1c']]); rrPath(ctx, S0.x + fr * 0.3, ly, S0.w - fr * 0.6, S0.h * 0.065, 5); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 1; i < 22; i++) { const x = S0.x + (S0.w * i) / 22; ctx.moveTo(x, ly + 2); ctx.lineTo(x + 3, ly + S0.h * 0.06); } ctx.stroke();
  } else {
    woodRect(ctx, S0.x + fr * 0.3, ly, S0.w - fr * 0.6, S0.h * 0.065, '#5a3416');
  }
  // frame
  const fcol = L.frame;
  ctx.fillStyle = hgrad(ctx, S0.x, S0.x + S0.w, [[0, light(fcol, 0.15)], [0.5, fcol], [1, dark(fcol, 0.3)]]);
  ctx.beginPath(); ctx.rect(S0.x, S0.y, S0.w, ly - S0.y + 2); ctx.rect(I.x + I.w, I.y, -I.w, I.h); ctx.fill('evenodd');
  ctx.strokeStyle = 'rgba(255,220,150,0.35)'; ctx.lineWidth = 1.5; ctx.strokeRect(I.x - 1, I.y - 1, I.w + 2, I.h + 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(I.x + 1, I.y + 1, I.w - 2, I.h - 2);
  if (set === 'wayang') { // parang diagonal border
    ctx.save(); ctx.beginPath(); ctx.rect(S0.x, S0.y, S0.w, fr); ctx.rect(S0.x, S0.y, fr, S0.h); ctx.rect(S0.x + S0.w - fr, S0.y, fr, S0.h); ctx.clip();
    ctx.strokeStyle = alpha('#e8b84a', 0.55); ctx.lineWidth = 1.5; ctx.beginPath();
    for (let x = S0.x - S0.h; x < S0.x + S0.w + S0.h; x += 9) { ctx.moveTo(x, S0.y); ctx.lineTo(x + S0.h, S0.y + S0.h); }
    ctx.stroke(); ctx.restore();
  }
  if (set === 'karagoz') { // pointed arch with a small lantern each side
    ctx.fillStyle = fcol;
    ctx.beginPath(); ctx.moveTo(I.x, I.y + I.h * 0.28); ctx.quadraticCurveTo(I.x + I.w * 0.05, I.y + I.h * 0.05, I.x + I.w * 0.5, I.y - fr * 0.1); ctx.quadraticCurveTo(I.x + I.w * 0.95, I.y + I.h * 0.05, I.x + I.w, I.y + I.h * 0.28); ctx.lineTo(I.x + I.w, I.y); ctx.lineTo(I.x, I.y); ctx.fill();
    lantern(ctx, S0.x + fr * 0.5, S0.y + S0.h * 0.28, fr * 0.32, '#e8453a', t, 0.3);
    lantern(ctx, S0.x + S0.w - fr * 0.5, S0.y + S0.h * 0.28, fr * 0.32, '#e8453a', t, 1.7);
  }
  if (set === 'wayang') { // the blencong oil lamp hangs above the screen
    const lx = S0.x + S0.w / 2, ly2 = S0.y + fr * 0.9;
    const fg = ctx.createRadialGradient(lx, ly2, 1, lx, ly2, fr * 2.2); fg.addColorStop(0, 'rgba(255,220,120,0.9)'); fg.addColorStop(1, 'rgba(255,200,80,0)'); ctx.fillStyle = fg; ctx.fillRect(lx - fr * 2.2, ly2 - fr * 2.2, fr * 4.4, fr * 4.4);
    ctx.fillStyle = '#e8a32a'; ctx.beginPath(); ctx.ellipse(lx, ly2 + fr * 0.2, fr * 0.55, fr * 0.2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff0b0'; poly(ctx, [[lx - fr * 0.14, ly2 + fr * 0.05], [lx, ly2 - fr * (0.55 + 0.1 * Math.sin(t * 9))], [lx + fr * 0.14, ly2 + fr * 0.05]]); ctx.fill();
  }
  // audience silhouettes in the dark below the screen
  audience(ctx, S0, v, S0.y + S0.h - S0.h * 0.012 - S0.h * 0.015);
  vignette(ctx, S0, 0.35);
}
function gunungan(ctx, I, floorY, L, v, t) {
  // the leaf-shaped tree of life: large at the very start/end, a small one to the side otherwise
  const big = v.opening;
  const h = I.h * (big ? 0.62 : 0.42), w = h * 0.5;
  const cx = big ? I.x + I.w * 0.5 : I.x + I.w * 0.93, base = floorY;
  const dim = big ? 0.8 : 0.55;
  ctx.fillStyle = alpha(mix(L.screenEdge, '#120804', 0.8), dim);
  ctx.beginPath(); ctx.moveTo(cx, base - h);
  ctx.bezierCurveTo(cx + w * 0.9, base - h * 0.7, cx + w * 0.7, base - h * 0.15, cx + w * 0.3, base);
  ctx.lineTo(cx - w * 0.3, base);
  ctx.bezierCurveTo(cx - w * 0.7, base - h * 0.15, cx - w * 0.9, base - h * 0.7, cx, base - h); ctx.fill();
  ctx.fillStyle = alpha(L.lamp, 0.8);
  ctx.beginPath(); ctx.moveTo(cx, base - h * 0.93); ctx.lineTo(cx, base - h * 0.55); ctx.strokeStyle = alpha(L.lamp, 0.7); ctx.lineWidth = 1.5; ctx.stroke();
  for (let i = 0; i < 6; i++) { const y = base - h * (0.2 + i * 0.12), r = w * 0.07 * (1 - i * 0.07); ctx.beginPath(); ctx.arc(cx - w * 0.22 + (i % 2) * w * 0.04, y, r, 0, TAU); ctx.arc(cx + w * 0.22 - (i % 2) * w * 0.04, y, r, 0, TAU); ctx.fill(); }
  ctx.beginPath(); ctx.arc(cx, base - h * 0.28, w * 0.12, 0, TAU); ctx.fill();
}
function tulipBorder(ctx, I, L) {
  ctx.fillStyle = alpha(mix(L.screenEdge, '#2a0a06', 0.55), 0.55);
  const n = 5;
  for (let i = 0; i < n; i++) {
    const x = I.x + I.w * (i + 0.5) / n, y = I.y + I.h * 0.07, r = I.w / n * 0.2;
    ctx.beginPath(); ctx.moveTo(x - r, y - r * 0.2); ctx.quadraticCurveTo(x - r, y + r * 1.4, x, y + r * 1.5); ctx.quadraticCurveTo(x + r, y + r * 1.4, x + r, y - r * 0.2); ctx.lineTo(x + r * 0.45, y + r * 0.35); ctx.lineTo(x, y - r * 0.5); ctx.lineTo(x - r * 0.45, y + r * 0.35); ctx.closePath(); ctx.fill();
  }
}

// ---- marionette / mask theatres -------------------------------------------------------------------------------
function proscenium(g, S0, v, kind) {
  const { ctx } = g, L = v.L, t = v.t, set = v.setting;
  const floorY = S0.y + S0.h * 0.84;
  const I = S0;
  // painted drop and wall
  ctx.fillStyle = vgrad(ctx, S0.y, floorY, [[0, dark(L.wall, 0.2)], [1, L.near]]); ctx.fillRect(S0.x, S0.y, S0.w, floorY - S0.y);
  const dropR = { x: S0.x, y: S0.y, w: S0.w, h: floorY - S0.y };
  if (set === 'kathputli') {
    // saffron and magenta drop with mirror-work and a painted arch
    ctx.fillStyle = vgrad(ctx, S0.y, floorY, [[0, '#7a1440'], [0.6, '#c42a58'], [1, '#e8892a']]); ctx.fillRect(S0.x, S0.y, S0.w, floorY - S0.y);
    ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = 'rgba(255,230,160,0.75)';
    for (let r = 0; r < 6; r++) for (let c = 0; c < Math.round(S0.w / 24); c++) { const x = S0.x + 12 + c * 24 + (r % 2) * 12, y = S0.y + S0.h * 0.16 + r * (floorY - S0.y) * 0.13; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, TAU); ctx.fill(); }
    ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.22; drawBackdrop(ctx, v.bg, dropR, floorY, { far: '#4a0e2c', near: '#7a1a44', glow: '#ffd777', sky: false }, t); ctx.restore();
  } else if (set === 'yokethe') {
    ctx.fillStyle = vgrad(ctx, S0.y, floorY, [[0, '#240c08'], [1, '#5a1a10']]); ctx.fillRect(S0.x, S0.y, S0.w, floorY - S0.y);
    ctx.save(); ctx.globalAlpha = 0.55; drawBackdrop(ctx, v.bg, dropR, floorY, { far: '#4a1810', near: '#7a2a18', glow: '#f5c84a', sky: ['#3a1008', '#8a3a1c'] }, t); ctx.restore();
  } else if (kind === 'mask') {
    drawBackdrop(ctx, v.bg, dropR, floorY, { far: L.far, near: L.near, glow: L.glow, sky: ['#d8b890', '#f0dcb0'] }, t);
    // painted canvas: darkened and slightly patched
    ctx.fillStyle = 'rgba(40,20,10,0.22)'; ctx.fillRect(S0.x, S0.y, S0.w, floorY - S0.y);
    weave(ctx, dropR, 4, 'rgba(60,30,10,0.07)');
  } else {
    drawBackdrop(ctx, v.bg, dropR, floorY, { far: L.far, near: L.near, glow: L.glow, sky: v.bg === 'stage' ? [mix(L.wall, '#000000', 0.2), L.near] : undefined }, t);
    ctx.fillStyle = 'rgba(10,8,30,0.28)'; ctx.fillRect(S0.x, S0.y, S0.w, floorY - S0.y);
  }
  // floor
  floorBoards(ctx, { x: S0.x, y: S0.y, w: S0.w, h: S0.h }, floorY, set === 'kathputli' ? '#a8452a' : L.floor, t);
  if (set === 'kathputli') { // durrie stripes across the floor
    ctx.fillStyle = 'rgba(255,214,120,0.5)'; for (let i = 0; i < 6; i++) { const yy = floorY + (S0.y + S0.h - floorY) * Math.pow((i + 0.5) / 6, 1.8); ctx.fillRect(S0.x, yy, S0.w, 2.2); }
  }
  // spotlight on the speaker
  if (v.spotX != null) spot(ctx, S0, S0.x + S0.w * v.spotX, S0.y + S0.h * 0.08, floorY, L.glow, 0.2);
  // figures
  const topY = S0.y + S0.h * (kind === 'mask' ? 0.08 : 0.17);
  place(ctx, I, floorY - S0.h * 0.01, S0.h * (kind === 'marionette' ? 0.42 : 0.5), v, { style: 'color', stringsY: kind === 'marionette' ? topY : null });
  // side drapes (or a rough canvas wing for the street trestle)
  const curtainH = floorY - S0.y + S0.h * 0.02;
  if (kind === 'mask') {
    // plank trestle stage seen from the front, canvas wings and pennants
    ctx.fillStyle = vgrad(ctx, floorY, S0.y + S0.h, [[0, '#6a4224'], [1, '#2a180a']]); ctx.fillRect(S0.x, floorY + S0.h * 0.02, S0.w, S0.h * 0.14);
    woodRect(ctx, S0.x, floorY - 2, S0.w, S0.h * 0.04, '#9a6a38');
    for (let i = 0; i < 5; i++) { const bx = S0.x + S0.w * (0.1 + i * 0.2); ctx.fillStyle = hgrad(ctx, bx - 14, bx + 14, [[0, '#6a4020'], [1, '#2a180a']]); ctx.beginPath(); ctx.ellipse(bx, floorY + S0.h * 0.1, 14, S0.h * 0.05, 0, 0, TAU); ctx.fill(); }
    drawCurtains(ctx, { x: S0.x, y: S0.y, w: S0.w, h: curtainH }, L.curtain, t, { width: 0.1, gold: '#d9b25a', valance: 0.07 });
    // bunting
    for (let i = 0; i < 9; i++) { const x = S0.x + S0.w * (i + 0.5) / 9, y = S0.y + S0.h * 0.1 + Math.sin((i / 9) * Math.PI) * S0.h * 0.02; ctx.fillStyle = ['#c8452d', '#e0a526', '#3a8aa8', '#6a8a3a'][i % 4]; poly(ctx, [[x - S0.w * 0.025, y], [x + S0.w * 0.025, y], [x, y + S0.h * 0.06]]); ctx.fill(); }
  } else {
    drawCurtains(ctx, { x: S0.x, y: S0.y, w: S0.w, h: curtainH }, L.curtain, t, { width: set === 'yokethe' ? 0.09 : 0.15, gold: set === 'kathputli' ? '#ffd777' : (L.frame && L.frame !== '#4a2c14' ? L.frame : '#e6b84a') });
    if (set === 'kathputli') {
      // marigold garlands and a cusped arch
      for (let k = 0; k < 3; k++) { const gx0 = S0.x + S0.w * k / 3, gx1 = S0.x + S0.w * (k + 1) / 3; for (let i = 0; i <= 14; i++) { const f = i / 14, x = gx0 + (gx1 - gx0) * f, y = S0.y + S0.h * 0.12 + Math.sin(f * Math.PI) * S0.h * 0.06; ctx.fillStyle = i % 2 ? '#f08a1c' : '#ffbf2a'; ctx.beginPath(); ctx.arc(x, y, S0.w * 0.011, 0, TAU); ctx.fill(); } }
    }
    if (set === 'yokethe') { // tiered gilded pelmet
      for (let i = 0; i < 3; i++) { const w = S0.w * (0.5 - i * 0.14), y = S0.y + S0.h * (0.0 + i * 0.04); ctx.fillStyle = vgrad(ctx, y, y + S0.h * 0.06, [[0, '#f5d27a'], [1, '#a8741a']]); poly(ctx, [[S0.x + S0.w / 2 - w, y + S0.h * 0.06], [S0.x + S0.w / 2 + w, y + S0.h * 0.06], [S0.x + S0.w / 2 + w * 0.8, y], [S0.x + S0.w / 2 - w * 0.8, y]]); ctx.fill(); }
      ctx.fillStyle = '#f5d27a'; poly(ctx, [[S0.x + S0.w / 2 - 4, S0.y + S0.h * 0.0], [S0.x + S0.w / 2 + 4, S0.y + S0.h * 0.0], [S0.x + S0.w / 2, S0.y - S0.h * 0.0 - 2]]); ctx.fill();
    }
    if (set === 'bohemian') { // comedy medallion on the valance
      const mx = S0.x + S0.w / 2, my = S0.y + S0.h * 0.062, mr = S0.h * 0.035;
      ctx.fillStyle = '#e6b84a'; ctx.beginPath(); ctx.arc(mx, my, mr * 1.25, 0, TAU); ctx.fill(); ctx.fillStyle = '#6a1a24'; ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fill();
      ctx.fillStyle = '#e6b84a'; ctx.beginPath(); ctx.arc(mx - mr * 0.35, my - mr * 0.15, mr * 0.12, 0, TAU); ctx.arc(mx + mr * 0.35, my - mr * 0.15, mr * 0.12, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#e6b84a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(mx, my + mr * 0.1, mr * 0.5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    }
  }
  footlights(ctx, S0, S0.y + S0.h * 0.955, t, L.glow);
  audience(ctx, S0, v, S0.y + S0.h * 1.005);
  // gilded frame edge
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 3; ctx.strokeRect(S0.x + 1.5, S0.y + 1.5, S0.w - 3, S0.h - 3);
  vignette(ctx, S0, 0.3);
}

// ---- glove booth ------------------------------------------------------------------------------------------------
function gloveStage(g, S0, v) {
  const { ctx } = g, L = v.L, t = v.t, set = v.setting;
  const counterY = S0.y + S0.h * 0.72;
  // street behind the booth (soft, dimmed)
  drawBackdrop(ctx, v.bg, { x: S0.x, y: S0.y, w: S0.w, h: S0.h }, S0.y + S0.h * 0.9, { far: L.far, near: L.near, glow: L.glow, sky: v.bg === 'stage' ? [L.wall, L.near] : undefined }, t);
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fillRect(S0.x, S0.y, S0.w, S0.h);
  // booth interior: patterned cloth
  const bx = S0.x + S0.w * 0.05, bw = S0.w * 0.9;
  ctx.fillStyle = vgrad(ctx, S0.y, counterY, [[0, dark(L.wall, 0.3)], [1, light(L.wall, 0.05)]]); ctx.fillRect(bx, S0.y, bw, counterY - S0.y);
  ctx.save(); ctx.beginPath(); ctx.rect(bx, S0.y, bw, counterY - S0.y); ctx.clip();
  ctx.strokeStyle = 'rgba(255,215,120,0.18)'; ctx.lineWidth = 1.2; ctx.beginPath();
  const sp = S0.w * 0.09;
  for (let x = bx - S0.h; x < bx + bw + S0.h; x += sp) { ctx.moveTo(x, S0.y); ctx.lineTo(x + S0.h, S0.y + S0.h); ctx.moveTo(x, S0.y + S0.h); ctx.lineTo(x + S0.h, S0.y); }
  ctx.stroke();
  // warm light falling from the awning
  const wg = ctx.createRadialGradient(S0.x + S0.w / 2, S0.y + S0.h * 0.25, 4, S0.x + S0.w / 2, S0.y + S0.h * 0.4, S0.w * 0.6); wg.addColorStop(0, 'rgba(255,220,150,0.28)'); wg.addColorStop(1, 'rgba(255,220,150,0)'); ctx.fillStyle = wg; ctx.fillRect(bx, S0.y, bw, S0.h);
  // puppets rise from behind the counter and are cut off by it
  ctx.beginPath(); ctx.rect(bx, S0.y, bw, counterY - S0.y + 1); ctx.clip();
  place(ctx, { x: bx, y: S0.y, w: bw, h: S0.h }, counterY + S0.h * 0.06, S0.h * 0.44, { ...v, figs: v.figs.map((f) => ({ ...f, x: (S0.x + S0.w * f.x - bx) / bw })) }, { style: 'glove', bob: S0.h * 0.012 });
  ctx.restore();
  // counter
  woodRect(ctx, S0.x, counterY, S0.w, S0.y + S0.h - counterY, L.frame);
  ctx.fillStyle = vgrad(ctx, counterY - 5, counterY + 6, [[0, light(L.frame, 0.45)], [1, dark(L.frame, 0.1)]]); ctx.fillRect(S0.x - 2, counterY - 5, S0.w + 4, 9);
  // painted panel on the counter front
  const pw = S0.w * 0.7, ph = (S0.y + S0.h - counterY) * 0.55, px = S0.x + (S0.w - pw) / 2, py = counterY + (S0.y + S0.h - counterY) * 0.28;
  ctx.fillStyle = dark(L.curtain, 0.1); rrPath(ctx, px, py, pw, ph, 6); ctx.fill();
  ctx.strokeStyle = '#e6b84a'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = 'rgba(255,230,160,0.55)';
  const nstar = Math.round(pw / (ph * 1.1));
  for (let i = 0; i < nstar; i++) { const cx = px + pw * (i + 0.5) / nstar; star(ctx, cx, py + ph / 2, ph * 0.36); ctx.fill(); }
  // awning: striped scalloped cloth
  const ah = S0.h * 0.13;
  const stripes = set === 'aragoz' ? ['#c0392b', '#f4e6c0', '#2e8b57', '#f1c40f'] : [L.curtain, '#f4e6c0'];
  const sw = S0.w / 10;
  for (let i = 0; i < 10; i++) {
    const x = S0.x + i * sw, col = stripes[i % stripes.length];
    ctx.fillStyle = vgrad(ctx, S0.y, S0.y + ah * 1.35, [[0, light(col, 0.1)], [1, dark(col, 0.2)]]);
    ctx.beginPath(); ctx.moveTo(x, S0.y); ctx.lineTo(x + sw, S0.y); ctx.lineTo(x + sw, S0.y + ah); ctx.quadraticCurveTo(x + sw / 2, S0.y + ah * 1.6, x, S0.y + ah); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(S0.x, S0.y + ah * 0.9, S0.w, 3);
  // posts
  for (const x of [S0.x, S0.x + S0.w - S0.w * 0.04]) { ctx.fillStyle = hgrad(ctx, x, x + S0.w * 0.04, [[0, light(L.frame, 0.3)], [1, dark(L.frame, 0.3)]]); ctx.fillRect(x, S0.y, S0.w * 0.04, S0.h); }
  // fairy lights across the front of the awning
  for (let i = 0; i < 9; i++) { const x = S0.x + S0.w * (i + 0.5) / 9, y = S0.y + ah * 1.35 + Math.sin(i * 1.3 + t * 3) * 1.5; const on = (i + Math.floor(t * 2)) % 3 !== 0; ctx.fillStyle = on ? '#ffe9a0' : '#c9a050'; ctx.beginPath(); ctx.arc(x, y, 2.4, 0, TAU); ctx.fill(); if (on) { ctx.fillStyle = 'rgba(255,230,150,0.25)'; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill(); } }
  audience(ctx, S0, v, S0.y + S0.h * 1.005);
  vignette(ctx, S0, 0.28);
}

// ---- water theatre -----------------------------------------------------------------------------------------------
function waterStage(g, S0, v) {
  const { ctx } = g, L = v.L, t = v.t;
  const waterY = S0.y + S0.h * 0.5;
  // sky and tree line (soft) behind the pavilion
  ctx.fillStyle = vgrad(ctx, S0.y, waterY, [[0, '#2a1410'], [1, mix(L.wall, '#000000', 0.15)]]); ctx.fillRect(S0.x, S0.y, S0.w, waterY - S0.y);
  // pavilion facade: bamboo screen with a doorway, red pillars, tiled curved roof
  const fx = S0.x + S0.w * 0.08, fw = S0.w * 0.84, fy = S0.y + S0.h * 0.16;
  ctx.fillStyle = vgrad(ctx, fy, waterY, [[0, '#b8863a'], [1, '#7a5420']]); ctx.fillRect(fx, fy, fw, waterY - fy);
  ctx.strokeStyle = 'rgba(40,20,4,0.4)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let i = 1; i < 34; i++) { const x = fx + (fw * i) / 34; ctx.moveTo(x, fy); ctx.lineTo(x, waterY); }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,230,160,0.15)'; for (let i = 0; i < 34; i += 2) ctx.fillRect(fx + (fw * i) / 34 + 1, fy, 1.5, waterY - fy);
  ctx.strokeStyle = 'rgba(40,20,4,0.35)'; ctx.beginPath(); for (let r = 1; r < 5; r++) { const y = fy + (waterY - fy) * r / 5; ctx.moveTo(fx, y); ctx.lineTo(fx + fw, y); } ctx.stroke();
  // doorway
  const dw = fw * 0.34, dx = fx + (fw - dw) / 2, dy = fy + (waterY - fy) * 0.18;
  ctx.fillStyle = '#1a0a06'; rrPath(ctx, dx, dy, dw, waterY - dy, dw * 0.15); ctx.fill();
  ctx.fillStyle = 'rgba(255,170,70,0.12)'; ctx.fillRect(dx + 4, dy + 4, dw - 8, (waterY - dy) * 0.5);
  ctx.strokeStyle = '#d9a52a'; ctx.lineWidth = 2; rrPath(ctx, dx, dy, dw, waterY - dy, dw * 0.15); ctx.stroke();
  // pillars
  for (const x of [fx - fw * 0.02, fx + fw * 0.98 - fw * 0.0]) { ctx.fillStyle = hgrad(ctx, x, x + fw * 0.045, [[0, light(L.curtain, 0.2)], [1, dark(L.curtain, 0.3)]]); ctx.fillRect(x, fy - S0.h * 0.04, fw * 0.045, waterY - fy + S0.h * 0.04); }
  // roof: curved with fish-scale tiles and upturned eaves
  const ry = S0.y + S0.h * 0.02;
  ctx.fillStyle = vgrad(ctx, ry, fy + S0.h * 0.02, [[0, light(L.curtain, 0.15)], [1, dark(L.curtain, 0.45)]]);
  ctx.beginPath(); ctx.moveTo(S0.x - 4, fy - S0.h * 0.01); ctx.quadraticCurveTo(S0.x + S0.w * 0.12, fy + S0.h * 0.04, S0.x + S0.w * 0.2, fy); ctx.lineTo(S0.x + S0.w * 0.8, fy); ctx.quadraticCurveTo(S0.x + S0.w * 0.88, fy + S0.h * 0.04, S0.x + S0.w + 4, fy - S0.h * 0.01); ctx.lineTo(S0.x + S0.w * 0.82, ry); ctx.lineTo(S0.x + S0.w * 0.18, ry); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 1;
  const tr = Math.max(7, S0.w / 38);
  for (let r = 0; r < 6; r++) for (let c = -1; c < S0.w / tr + 1; c++) { ctx.beginPath(); ctx.arc(S0.x + c * tr + (r % 2) * tr / 2, ry + r * tr * 0.55, tr / 2, 0, Math.PI); ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = '#e6b84a'; ctx.fillRect(S0.x, fy - 2, S0.w, 3);
  // lanterns under the eaves (they reflect in the water below)
  const lant = [0.18, 0.5, 0.82];
  // water: reflected sky colour over deep teal, with ripples and sparkle
  ctx.fillStyle = vgrad(ctx, waterY, S0.y + S0.h, [[0, '#3d93ab'], [0.5, L.floor], [1, dark(L.floor, 0.5)]]); ctx.fillRect(S0.x, waterY, S0.w, S0.y + S0.h - waterY);
  // reflection of the pavilion (flipped, faded)
  ctx.save(); ctx.beginPath(); ctx.rect(S0.x, waterY, S0.w, S0.y + S0.h - waterY); ctx.clip();
  ctx.globalAlpha = 0.28; ctx.translate(0, waterY * 2); ctx.scale(1, -1);
  ctx.fillStyle = '#9a6a2c'; ctx.fillRect(fx, fy, fw, waterY - fy);
  ctx.fillStyle = L.curtain; ctx.fillRect(S0.x, fy - S0.h * 0.04, S0.w, S0.h * 0.04);
  ctx.restore();
  // figures and their reflections
  const figH = S0.h * 0.4, floorY = waterY + S0.h * 0.2;
  ctx.save(); ctx.beginPath(); ctx.rect(S0.x, waterY, S0.w, S0.y + S0.h - waterY); ctx.clip();
  ctx.globalAlpha = 0.3; ctx.translate(0, floorY * 2 + 3); ctx.scale(1, -1);
  place(ctx, S0, floorY, figH, v, { style: 'color', noShadow: true });
  ctx.restore();
  // shimmer bars across the reflection
  ctx.fillStyle = 'rgba(180,230,240,0.18)';
  for (let i = 0; i < 14; i++) { const y = floorY + 3 + i * S0.h * 0.016, x = S0.x + ((i * 53 + t * 18 * (i % 2 ? 1 : -1)) % S0.w + S0.w) % S0.w; ctx.fillRect(x - S0.w * 0.1, y, S0.w * 0.2, 1.4); }
  ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1.5;
  for (let r = 0; r < 5; r++) for (let i = 0; i < 4; i++) { const px = S0.x + S0.w * (((i * 0.27 + r * 0.13 + t * 0.02) % 1)); const py = waterY + S0.h * (0.04 + r * 0.045); ctx.beginPath(); ctx.ellipse(px, py, 14 + r * 4, 2.5 + r * 0.7, 0, 0, TAU); ctx.stroke(); }
  for (const li of lant) { const lx = S0.x + S0.w * li; lantern(ctx, lx, fy + S0.h * 0.075, S0.h * 0.025, '#e8453a', t, li * 7); ctx.fillStyle = 'rgba(255,170,70,0.2)'; ctx.fillRect(lx - 2, waterY + 4, 4, S0.h * 0.16); }
  // lotus pads and flowers
  for (const [fxp, fyp, r, fl] of [[0.08, 0.9, 0.05, 1], [0.92, 0.88, 0.06, 0], [0.62, 0.95, 0.04, 1], [0.3, 0.92, 0.035, 0]]) {
    const x = S0.x + S0.w * fxp + Math.sin(t * 0.6 + fxp * 9) * 1.5, y = S0.y + S0.h * fyp, rr = S0.w * r;
    ctx.fillStyle = vgrad(ctx, y - rr * 0.3, y + rr * 0.3, [[0, '#4a9a4a'], [1, '#1f5a2c']]);
    ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.33, 0, 0.12, TAU - 0.12); ctx.lineTo(x, y); ctx.fill();
    if (fl) { ctx.fillStyle = '#f8c8d8'; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(x + k * rr * 0.14, y - rr * 0.35 - Math.abs(k) * -rr * 0.02, rr * 0.13, rr * 0.3, k * 0.35, 0, TAU); ctx.fill(); } ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.arc(x, y - rr * 0.18, rr * 0.1, 0, TAU); ctx.fill(); }
  }
  // puppets standing on the pond with wake rings
  for (const f of v.figs) {
    if (f.alpha < 0.05) continue;
    const px = S0.x + S0.w * f.x;
    for (let k = 0; k < 3; k++) { const ph = ((t * 0.6 + k / 3 + f.x) % 1); ctx.strokeStyle = `rgba(255,255,255,${0.4 * (1 - ph)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(px, floorY + 2, S0.w * 0.04 + ph * S0.w * 0.08, S0.h * 0.012 + ph * S0.h * 0.02, 0, 0, TAU); ctx.stroke(); }
  }
  place(ctx, S0, floorY, figH, v, { style: 'color', noShadow: true });
  // a drip of light on the water at each puppet
  audience(ctx, S0, v, S0.y + S0.h * 1.005);
  drawCurtains(ctx, { x: S0.x, y: S0.y, w: S0.w, h: waterY - S0.y + S0.h * 0.06 }, L.curtain, t, { width: 0.08, valance: 0.0 });
  vignette(ctx, S0, 0.3);
}

// ---- caravan: parchment map and a sand vignette ---------------------------------------------------------------
function caravanStage(g, S0, v) {
  const { ctx } = g, L = v.L, t = v.t, set = v.setting;
  const M = { x: S0.x + 6, y: S0.y + 6, w: S0.w - 12, h: S0.h * 0.56 };
  // parchment with burnt edges and fibre
  ctx.fillStyle = vgrad(ctx, M.y, M.y + M.h, [[0, '#f3e2b4'], [1, '#d9bd7e']]); rrPath(ctx, M.x, M.y, M.w, M.h, 10); ctx.fill();
  ctx.save(); rrPath(ctx, M.x, M.y, M.w, M.h, 10); ctx.clip();
  ctx.fillStyle = 'rgba(150,100,40,0.16)';
  for (let i = 0; i < 60; i++) { const x = M.x + ((i * 97) % 100) / 100 * M.w, y = M.y + ((i * 53) % 100) / 100 * M.h; ctx.fillRect(x, y, 1 + (i % 3), 1); }
  ctx.fillStyle = 'rgba(160,120,60,0.2)';
  ctx.beginPath(); ctx.ellipse(M.x + M.w * 0.25, M.y + M.h * 0.72, M.w * 0.22, M.h * 0.2, 0.2, 0, TAU); ctx.ellipse(M.x + M.w * 0.74, M.y + M.h * 0.32, M.w * 0.2, M.h * 0.22, -0.3, 0, TAU); ctx.fill();
  // sea / river hint
  ctx.strokeStyle = 'rgba(70,120,140,0.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(M.x + M.w * 0.1, M.y + M.h * 0.15); ctx.bezierCurveTo(M.x + M.w * 0.35, M.y + M.h * 0.3, M.x + M.w * 0.5, M.y + M.h * 0.05, M.x + M.w * 0.9, M.y + M.h * 0.25); ctx.stroke();
  // region glyphs
  const glyph = (x, y, s, kind) => {
    ctx.strokeStyle = 'rgba(90,60,30,0.55)'; ctx.fillStyle = 'rgba(120,80,40,0.25)'; ctx.lineWidth = 1.5;
    if (kind === 'mtn') { poly(ctx, [[x - s, y + s * 0.5], [x - s * 0.2, y - s * 0.6], [x + s * 0.2, y - s * 0.1], [x + s * 0.5, y - s * 0.4], [x + s, y + s * 0.5]]); ctx.fill(); ctx.stroke(); }
    else if (kind === 'dune') { ctx.beginPath(); ctx.moveTo(x - s, y + s * 0.3); ctx.quadraticCurveTo(x, y - s * 0.7, x + s, y + s * 0.3); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - s * 0.5, y + s * 0.5); ctx.quadraticCurveTo(x + s * 0.2, y - s * 0.2, x + s * 1.1, y + s * 0.5); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(x, y + s * 0.5); ctx.lineTo(x, y - s * 0.2); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y - s * 0.4, s * 0.45, 0, TAU); ctx.fill(); ctx.stroke(); }
  };
  const gl = set === 'sahel' ? ['dune', 'dune', 'tree'] : ['mtn', 'dune', 'mtn'];
  glyph(M.x + M.w * 0.18, M.y + M.h * 0.3, M.w * 0.05, gl[0]); glyph(M.x + M.w * 0.46, M.y + M.h * 0.78, M.w * 0.05, gl[1]); glyph(M.x + M.w * 0.62, M.y + M.h * 0.55, M.w * 0.045, gl[2]); glyph(M.x + M.w * 0.88, M.y + M.h * 0.78, M.w * 0.045, gl[0]);
  // compass rose
  const cx = M.x + M.w * 0.9, cy = M.y + M.h * 0.2, cr = Math.min(M.w, M.h) * 0.09;
  ctx.fillStyle = 'rgba(100,60,24,0.7)'; star(ctx, cx, cy, cr); ctx.fill(); ctx.strokeStyle = 'rgba(100,60,24,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, cr * 1.1, 0, TAU); ctx.stroke();
  ctx.restore();
  // route
  const r = v.route;
  if (r && r.length) {
    const pt = (i) => ({ x: M.x + M.w * (0.08 + 0.84 * r[i].x), y: M.y + M.h * (0.12 + 0.76 * r[i].y) });
    const cur = clamp(v.stop, 0, r.length - 1);
    const path = (from, to) => { ctx.beginPath(); const a = pt(from); ctx.moveTo(a.x, a.y); for (let i = from + 1; i <= to; i++) { const p0 = pt(i - 1), p1 = pt(i); ctx.quadraticCurveTo((p0.x + p1.x) / 2, p0.y, p1.x, p1.y); } };
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(90,60,30,0.6)'; ctx.lineWidth = 3; ctx.setLineDash([2, 9]);
    if (cur < r.length - 1) { path(cur, r.length - 1); ctx.stroke(); }
    ctx.setLineDash([]); ctx.strokeStyle = '#a2321e'; ctx.lineWidth = 4.5;
    if (cur > 0) { path(0, cur); ctx.stroke(); }
    r.forEach((w, i) => {
      const p = pt(i);
      ctx.fillStyle = i <= cur ? '#a2321e' : '#6b5330'; ctx.beginPath(); ctx.arc(p.x, p.y, i === cur ? 7 : 5, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#f6e8c0'; ctx.lineWidth = 1.5; ctx.stroke();
      const above = i % 2 === 0;
      const lx = clamp(p.x, M.x + 44, M.x + M.w - 44), ly = p.y + (above ? -15 : 19);
      const fs = g.px(15);
      g.label(ctx, w.name, lx + 1, ly + 1, fs, 'rgba(250,240,205,0.9)', 'center', '700');
      g.label(ctx, w.name, lx, ly, fs, '#3a2a18', 'center', '700');
    });
    const p = pt(cur), bob = Math.sin(t * 3) * 2;
    ctx.strokeStyle = '#c2381e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, 14 + bob, 0, TAU); ctx.stroke();
    // little camel marker
    ctx.fillStyle = '#3a2410'; const cs = M.w * 0.012;
    ctx.beginPath(); ctx.ellipse(p.x, p.y - 22 + bob * 0.4, cs * 2.2, cs * 1.1, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(p.x - cs * 0.6, p.y - 22 - cs * 1.4 + bob * 0.4, cs * 0.9, 0, TAU); ctx.arc(p.x + cs * 0.7, p.y - 22 - cs * 1.2 + bob * 0.4, cs * 0.8, 0, TAU); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#3a2410'; ctx.beginPath(); ctx.moveTo(p.x + cs * 1.7, p.y - 22 + bob * 0.4); ctx.lineTo(p.x + cs * 2.4, p.y - 22 - cs * 2.2 + bob * 0.4); ctx.stroke();
  }
  // border
  ctx.strokeStyle = L.frame; ctx.lineWidth = 3; rrPath(ctx, M.x, M.y, M.w, M.h, 10); ctx.stroke();
  ctx.strokeStyle = 'rgba(90,50,20,0.5)'; ctx.lineWidth = 1; rrPath(ctx, M.x + 5, M.y + 5, M.w - 10, M.h - 10, 7); ctx.stroke();
  // scene below: sky, parallax dunes, ground, figures
  const V0 = { x: S0.x, y: M.y + M.h + 6, w: S0.w, h: S0.y + S0.h - (M.y + M.h + 6) };
  const floorY = V0.y + V0.h * 0.86;
  ctx.save(); ctx.beginPath(); ctx.rect(V0.x, V0.y, V0.w, V0.h); ctx.clip();
  ctx.save(); ctx.translate(-(v.stop ?? 0) * 6 % 40, 0);
  drawBackdrop(ctx, v.bg, { x: V0.x - 40, y: V0.y, w: V0.w + 80, h: V0.h }, floorY, { far: mix(L.far, '#000000', 0.1), near: L.near, glow: '#fff1b8', sky: undefined }, t);
  ctx.restore();
  ctx.fillStyle = vgrad(ctx, floorY, V0.y + V0.h, [[0, '#d5ab62'], [1, '#a8803a']]); ctx.fillRect(V0.x, floorY, V0.w, V0.y + V0.h - floorY);
  ctx.strokeStyle = 'rgba(120,80,30,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 4; i++) { const y = floorY + (V0.y + V0.h - floorY) * (i + 0.6) / 4; ctx.moveTo(V0.x, y); ctx.bezierCurveTo(V0.x + V0.w * 0.3, y - 3, V0.x + V0.w * 0.6, y + 3, V0.x + V0.w, y); } ctx.stroke();
  // heat shimmer
  ctx.fillStyle = 'rgba(255,240,200,0.12)'; for (let i = 0; i < 4; i++) ctx.fillRect(V0.x, floorY - 8 - i * 6 + Math.sin(t * 2 + i) * 1.5, V0.w, 1.5);
  place(ctx, V0, floorY, V0.h * 0.78, v, { style: 'color' });
  ctx.restore();
  vignette(ctx, V0, 0.22);
}

// ---- verse: illuminated page --------------------------------------------------------------------------------------
function verseStage(g, S0, v) {
  const { ctx } = g, L = v.L, t = v.t, set = v.setting;
  const mat = set === 'malagasy';
  // paper or woven mat
  if (mat) {
    ctx.fillStyle = vgrad(ctx, S0.y, S0.y + S0.h, [[0, '#e8d0a0'], [1, '#c9a870']]); ctx.fillRect(S0.x, S0.y, S0.w, S0.h);
    ctx.strokeStyle = 'rgba(110,70,30,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); for (let y = S0.y + 4; y < S0.y + S0.h; y += 6) { ctx.moveTo(S0.x, y); ctx.lineTo(S0.x + S0.w, y); } ctx.stroke();
    ctx.strokeStyle = 'rgba(255,240,200,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = S0.x + 3; x < S0.x + S0.w; x += 6) { ctx.moveTo(x, S0.y); ctx.lineTo(x, S0.y + S0.h); } ctx.stroke();
  } else {
    ctx.fillStyle = vgrad(ctx, S0.y, S0.y + S0.h, [[0, '#f8efd6'], [1, '#e6d6a8']]); ctx.fillRect(S0.x, S0.y, S0.w, S0.h);
    ctx.fillStyle = 'rgba(140,100,40,0.1)';
    for (let i = 0; i < 70; i++) { const x = S0.x + ((i * 89) % 100) / 100 * S0.w, y = S0.y + ((i * 47) % 100) / 100 * S0.h; ctx.fillRect(x, y, 1 + (i % 4), 1); }
    const st = ctx.createRadialGradient(S0.x + S0.w * 0.85, S0.y + S0.h * 0.8, 4, S0.x + S0.w * 0.85, S0.y + S0.h * 0.8, S0.w * 0.3); st.addColorStop(0, 'rgba(150,100,40,0.18)'); st.addColorStop(1, 'rgba(150,100,40,0)'); ctx.fillStyle = st; ctx.fillRect(S0.x, S0.y, S0.w, S0.h);
  }
  // border: double rules with corner rosettes (and a zigzag band for woven mats)
  const m = Math.min(S0.w, S0.h) * 0.045;
  ctx.strokeStyle = L.frame; ctx.lineWidth = 4; ctx.strokeRect(S0.x + m, S0.y + m, S0.w - m * 2, S0.h - m * 2);
  ctx.lineWidth = 1.5; ctx.strokeRect(S0.x + m * 1.7, S0.y + m * 1.7, S0.w - m * 3.4, S0.h - m * 3.4);
  if (mat) {
    ctx.fillStyle = '#7a1a10'; const zs = m * 0.7;
    for (let x = S0.x + m * 2; x < S0.x + S0.w - m * 2; x += zs * 2) { poly(ctx, [[x, S0.y + m * 1.5], [x + zs, S0.y + m * 1.5], [x + zs / 2, S0.y + m * 1.5 + zs * 0.8]]); ctx.fill(); }
  }
  const rosette = (x, y, r) => {
    ctx.fillStyle = L.glow; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.fillStyle = dark(L.frame, 0.1); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.28, r * 0.14, a, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#f8efd6'; ctx.beginPath(); ctx.arc(x, y, r * 0.3, 0, TAU); ctx.fill();
  };
  for (const [cx2, cy2] of [[S0.x + m * 1.2, S0.y + m * 1.2], [S0.x + S0.w - m * 1.2, S0.y + m * 1.2], [S0.x + m * 1.2, S0.y + S0.h - m * 1.2], [S0.x + S0.w - m * 1.2, S0.y + S0.h - m * 1.2]]) rosette(cx2, cy2, m * 1.0);
  // header arch cartouche behind the speakers, like a miniature painting
  const cw = Math.min(S0.w * 0.66, S0.h * 0.62), ch = S0.h * 0.4, cx0 = S0.x + (S0.w - cw) / 2, cy0 = S0.y + m * 2.4;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(cx0, cy0 + ch); ctx.lineTo(cx0, cy0 + cw * 0.3); ctx.arc(cx0 + cw / 2, cy0 + cw * 0.3, cw / 2, Math.PI, 0); ctx.lineTo(cx0 + cw, cy0 + ch); ctx.closePath(); ctx.clip();
  ctx.fillStyle = vgrad(ctx, cy0, cy0 + ch, [[0, mat ? '#e8944a' : '#4a6ea8'], [1, mat ? '#f4d28a' : '#cfe0f0']]); ctx.fillRect(cx0, cy0, cw, ch);
  ctx.fillStyle = mat ? '#5a8a3a' : '#6a8a5a'; ctx.beginPath(); ctx.ellipse(cx0 + cw * 0.3, cy0 + ch * 1.05, cw * 0.5, ch * 0.3, 0, Math.PI, TAU); ctx.fill();
  ctx.fillStyle = mat ? '#4a7a2a' : '#4a7a4a'; ctx.beginPath(); ctx.ellipse(cx0 + cw * 0.8, cy0 + ch * 1.05, cw * 0.4, ch * 0.25, 0, Math.PI, TAU); ctx.fill();
  // speakers (inside the arch)
  place(ctx, { x: cx0, y: cy0, w: cw, h: ch }, cy0 + ch * 0.99, ch * 0.78, { ...v, figs: v.figs.map((f) => ({ ...f, x: clamp((S0.x + S0.w * f.x - cx0) / cw, 0.12, 0.88) })) }, { style: 'color', noShadow: false });
  ctx.restore();
  ctx.strokeStyle = L.glow; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx0, cy0 + ch); ctx.lineTo(cx0, cy0 + cw * 0.3); ctx.arc(cx0 + cw / 2, cy0 + cw * 0.3, cw / 2, Math.PI, 0); ctx.lineTo(cx0 + cw, cy0 + ch); ctx.stroke();
  ctx.strokeStyle = L.frame; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx0 - 4, cy0 + ch + 3); ctx.lineTo(cx0 + cw + 4, cy0 + ch + 3); ctx.stroke();
  // the verse so far, in ink, newest line in red and fading in
  const lines = v.poem.slice(-4);
  const size = g.px(S0.h > 200 ? 21 : 17);
  let y = cy0 + ch + size * 1.6;
  // faint ruled lines waiting for the verses still to be written
  ctx.strokeStyle = 'rgba(120,80,30,0.2)'; ctx.lineWidth = 1;
  for (let k = 0; k < 7; k++) { const yy = y + k * size * 1.35 + size * 0.62; if (yy > S0.y + S0.h - m * 3) break; ctx.beginPath(); ctx.moveTo(S0.x + m * 3, yy); ctx.lineTo(S0.x + S0.w - m * 3, yy); ctx.stroke(); }
  const maxW = S0.w - m * 6;
  lines.forEach((ln, i) => {
    const last = i === lines.length - 1;
    const wrapped = g.wrap(ctx, ln, maxW, size);
    wrapped.forEach((w) => {
      ctx.globalAlpha = last ? clamp(v.lineAge / 0.8, 0.15, 1) : 1;
      g.label(ctx, w, S0.x + S0.w / 2, y, size, last ? '#8a1f14' : L.ink, 'center', last ? '700' : '500');
      ctx.globalAlpha = 1;
      y += size * 1.35;
    });
    y += size * 0.15;
  });
  // quill and inkwell, lower right
  const qx = S0.x + S0.w - m * 4.2, qy = S0.y + S0.h - m * 2.4;
  ctx.fillStyle = '#1a1410'; ctx.beginPath(); ctx.ellipse(qx, qy, m * 0.9, m * 0.55, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a3028'; ctx.beginPath(); ctx.ellipse(qx, qy - m * 0.25, m * 0.55, m * 0.28, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(qx + m * 0.2, qy - m * 0.3); ctx.quadraticCurveTo(qx + m * 1.6, qy - m * 2.2, qx + m * 2.4, qy - m * 2.8); ctx.stroke();
  ctx.fillStyle = 'rgba(80,50,20,0.12)'; ctx.fillRect(S0.x, S0.y, S0.w, 0);
  vignette(ctx, S0, 0.16);
}

// ---- entry point --------------------------------------------------------------------------------------------------
export function drawSceneArt(g, S0, v) {
  const { ctx } = g;
  ctx.save(); ctx.beginPath(); ctx.rect(S0.x, S0.y, S0.w, S0.h); ctx.clip();
  const k = v.kind;
  if (k === 'shadow') shadowStage(g, S0, v);
  else if (k === 'glove') gloveStage(g, S0, v);
  else if (k === 'water') waterStage(g, S0, v);
  else if (k === 'caravan') caravanStage(g, S0, v);
  else if (k === 'verse') verseStage(g, S0, v);
  else proscenium(g, S0, v, k === 'mask' ? 'mask' : 'marionette');
  particles(ctx, S0, v);
  starReveal(ctx, S0, v);
  if (v.trans > 0.01) { ctx.fillStyle = `rgba(6,3,10,${clamp(v.trans, 0, 1) * 0.55})`; ctx.fillRect(S0.x, S0.y, S0.w, S0.h); }
  ctx.restore();
}

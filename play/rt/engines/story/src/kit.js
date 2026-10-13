// Shared painting tools for the story theatres (floor, lights, props, figure placement, audience, particles, star reveal).
import { drawFigure, mix, dark, light, alpha, poly, vgrad, hgrad, rrPath } from './figures.js';
export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const easeOutBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };

// ---- shared painting tools -----------------------------------------------------------------------------------
export function weave(ctx, R, step, col) {
  ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = R.x + step; x < R.x + R.w; x += step) { ctx.moveTo(x, R.y); ctx.lineTo(x, R.y + R.h); }
  for (let y = R.y + step; y < R.y + R.h; y += step) { ctx.moveTo(R.x, y); ctx.lineTo(R.x + R.w, y); }
  ctx.stroke();
}
export function vignette(ctx, R, a) {
  const g = ctx.createRadialGradient(R.x + R.w / 2, R.y + R.h / 2, Math.min(R.w, R.h) * 0.3, R.x + R.w / 2, R.y + R.h / 2, Math.max(R.w, R.h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`);
  ctx.fillStyle = g; ctx.fillRect(R.x, R.y, R.w, R.h);
}
export function woodRect(ctx, x, y, w, h, col) {
  ctx.fillStyle = vgrad(ctx, y, y + h, [[0, light(col, 0.22)], [0.5, col], [1, dark(col, 0.35)]]);
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1; ctx.beginPath();
  const n = Math.max(2, Math.round(h / 5));
  for (let i = 1; i < n; i++) { const yy = y + (h * i) / n + ((i * 7) % 3) - 1; ctx.moveTo(x, yy); ctx.lineTo(x + w, yy + ((i % 2) ? 1 : -1)); }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x, y, w, 1.5);
}
export function floorBoards(ctx, R, y0, col, t) {
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
export function footlights(ctx, R, y, t, col) {
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
export function spot(ctx, R, x, topY, floorY, col, a) {
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
export function star(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.46 : r; i ? ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  ctx.closePath();
}
export function lantern(ctx, x, y, r, col, t, ph) {
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
export function tassel(ctx, x, y, r, col) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0, TAU); ctx.fill();
  poly(ctx, [[x - r * 0.4, y + r * 0.2], [x + r * 0.4, y + r * 0.2], [x + r * 0.55, y + r * 2], [x - r * 0.55, y + r * 2]]); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = -1; i <= 1; i++) { ctx.moveTo(x + i * r * 0.2, y + r * 0.3); ctx.lineTo(x + i * r * 0.28, y + r * 1.95); } ctx.stroke();
}

// ---- figure placement -----------------------------------------------------------------------------------------
export function place(ctx, R, floorY, H, v, o) {
  for (const f of v.figs) {
    if (f.alpha < 0.01 || !f.c) continue;
    const x = R.x + R.w * f.x;
    const base = floorY + (o.dy ?? 0) + (o.bob ? Math.sin(v.t * 2.2 + f.x * 9) * o.bob : 0);
    const common = {
      t: v.t, pose: f.pose, speaking: f.speaking, flip: f.flip, a1: f.a1, a2: f.a2, lean: f.lean, walk: f.walk,
      alpha: (f.alpha ?? 1) * (o.alpha ?? 1), trad: o.trad === false ? null : (o.trad ?? v.setting),
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
export function audience(ctx, R, v, y0) {
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
export function particles(ctx, R, v) {
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
export function starReveal(ctx, R, v) {
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


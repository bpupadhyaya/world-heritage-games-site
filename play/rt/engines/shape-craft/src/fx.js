// Shape-craft look: colour helpers, work surfaces, the reference "display case", soft shadows and a small particle system.
// Pure canvas 2D; irregularity comes from `hash`, motion from the dt the activity feeds in. No DOM, no Math.random.
import { hash } from './geom.js';

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function parse(c) {
  const s = String(c || '#000').trim();
  if (s.startsWith('rgb')) { const m = s.match(/[\d.]+/g) || [0, 0, 0]; return [Number(m[0]) || 0, Number(m[1]) || 0, Number(m[2]) || 0]; }
  let h = s.replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  const n = parseInt(h.slice(0, 6), 16), v = Number.isFinite(n) ? n : 0;
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
const hx = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
export const toHex = ([r, g, b]) => `#${hx(r)}${hx(g)}${hx(b)}`;
export const rgba = (c, a) => { const [r, g, b] = parse(c); return `rgba(${r},${g},${b},${a})`; };
export const mix = (a, b, t) => { const A = parse(a), B = parse(b); return toHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]); };
export const tint = (c, t) => (t >= 0 ? mix(c, '#ffffff', t) : mix(c, '#000000', -t));
export const lum = (c) => { const [r, g, b] = parse(c); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
export const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

export function rrect(ctx, x, y, w, h, r) {
  const q = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + q, y); ctx.arcTo(x + w, y, x + w, y + h, q); ctx.arcTo(x + w, y + h, x, y + h, q); ctx.arcTo(x, y + h, x, y, q); ctx.arcTo(x, y, x + w, y, q); ctx.closePath();
}
export function shadowed(ctx, fn, { blur = 14, dx = 0, dy = 6, a = 0.5 } = {}) {
  ctx.save(); ctx.shadowColor = `rgba(0,0,0,${a})`; ctx.shadowBlur = blur; ctx.shadowOffsetX = dx; ctx.shadowOffsetY = dy; fn(); ctx.restore();
}

// ---- work surfaces ---------------------------------------------------------------------------------------------------------
// kind: wood (bench planks), mat (self-healing cutting mat), felt (soft felt), slate (potter's slab), weave (straw mat).
export function surface(ctx, r, kind, base) {
  const { x, y, w, h } = r;
  ctx.save(); rrect(ctx, x, y, w, h, 16); ctx.clip();
  const b = base;
  const gr = ctx.createLinearGradient(x, y, x + w * 0.6, y + h);
  gr.addColorStop(0, tint(b, 0.1)); gr.addColorStop(1, tint(b, -0.2)); ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
  if (kind === 'wood') {
    const pl = Math.max(26, h / 7);
    ctx.lineWidth = 1;
    for (let py = y + pl; py < y + h; py += pl) { ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x + w, py); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(x, py + 1.5); ctx.lineTo(x + w, py + 1.5); ctx.stroke(); }
    ctx.beginPath(); ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    for (let k = 0; k < 40; k++) { const gy = y + hash(k, 3) * h, gx = x + hash(k, 4) * w * 0.8; ctx.moveTo(gx, gy); ctx.bezierCurveTo(gx + w * 0.1, gy + (hash(k, 5) - 0.5) * 6, gx + w * 0.2, gy + (hash(k, 6) - 0.5) * 6, gx + w * (0.15 + 0.25 * hash(k, 7)), gy); }
    ctx.stroke();
  } else if (kind === 'mat') {
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1; ctx.beginPath();
    const s = Math.max(18, w / 16);
    for (let gx = x; gx < x + w; gx += s) { ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); }
    for (let gy = y; gy < y + h; gy += s) { ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); }
    ctx.stroke();
  } else if (kind === 'weave') {
    ctx.lineWidth = 2; const s = 7;
    ctx.strokeStyle = 'rgba(0,0,0,0.16)'; ctx.beginPath(); for (let gy = y; gy < y + h; gy += s) { ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); } ctx.setLineDash([s, s]); ctx.stroke();
    ctx.lineDashOffset = s; ctx.beginPath(); for (let gx = x; gx < x + w; gx += s) { ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); } ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
  } else { // felt, slate: fine grain
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.beginPath();
    for (let k = 0; k < 160; k++) ctx.rect(x + hash(k, 1) * w, y + hash(k, 2) * h, 1.6, 1.6);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.beginPath();
    for (let k = 0; k < 120; k++) ctx.rect(x + hash(k, 8) * w, y + hash(k, 9) * h, 2, 2);
    ctx.fill();
  }
  // vignette
  const vg = ctx.createRadialGradient(x + w / 2, y + h * 0.45, Math.min(w, h) * 0.3, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.42)'); ctx.fillStyle = vg; ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1.5; rrect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 16); ctx.stroke();
}

// ---- the reference "display case" --------------------------------------------------------------------------------------------
// Draws the case; the technique then draws its target inside `inner` and calls caseGlass(ctx, inner) for the shelf and the reflection.
export function displayCase(ctx, r, accent, bg) {
  const { x, y, w, h } = r;
  shadowed(ctx, () => { rrect(ctx, x - 6, y - 6, w + 12, h + 12, 16); ctx.fillStyle = shadeFrame(accent); ctx.fill(); }, { blur: 16, dy: 7, a: 0.55 });
  const fg = ctx.createLinearGradient(x, y, x + w, y + h);
  fg.addColorStop(0, tint(accent, 0.45)); fg.addColorStop(0.5, accent); fg.addColorStop(1, tint(accent, -0.45));
  rrect(ctx, x - 6, y - 6, w + 12, h + 12, 16); ctx.fillStyle = fg; ctx.fill();
  rrect(ctx, x, y, w, h, 11); ctx.fillStyle = '#0c0f13'; ctx.fill();
  ctx.save(); rrect(ctx, x, y, w, h, 11); ctx.clip();
  const sp = ctx.createRadialGradient(x + w / 2, y + h * 0.05, 4, x + w / 2, y + h * 0.35, Math.max(w, h) * 0.85);
  sp.addColorStop(0, rgba(mix(bg, '#ffffff', 0.35), 0.95)); sp.addColorStop(0.5, rgba(mix(bg, '#000000', 0.2), 0.95)); sp.addColorStop(1, 'rgba(8,10,14,1)');
  ctx.fillStyle = sp; ctx.fillRect(x, y, w, h);
  ctx.restore();
  return { x: x + 4, y: y + 4, w: w - 8, h: h - 8 };
}
const shadeFrame = (a) => tint(a, -0.6);
export function caseGlass(ctx, r) {
  const { x, y, w, h } = r;
  ctx.save(); rrect(ctx, x - 4, y - 4, w + 8, h + 8, 11); ctx.clip();
  const gl = ctx.createLinearGradient(x, y, x + w * 0.9, y + h * 0.9);
  gl.addColorStop(0, 'rgba(255,255,255,0.16)'); gl.addColorStop(0.28, 'rgba(255,255,255,0.03)'); gl.addColorStop(0.32, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gl; ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.restore();
}
export function shelf(ctx, cx, y, w) {
  const g = ctx.createLinearGradient(cx - w, y, cx + w, y);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(cx - w, y, w * 2, 2);
  const f = ctx.createRadialGradient(cx, y, 2, cx, y, w); f.addColorStop(0, 'rgba(255,255,255,0.14)'); f.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = f; ctx.beginPath(); ctx.ellipse(cx, y + 2, w, w * 0.12, 0, 0, 6.2832); ctx.fill();
}

// ---- lit guide edge ----------------------------------------------------------------------------------------------------------
// Strokes the current path as a ghosted outline with a lit edge: a wide faint glow, a bright dashed core, pulsing slowly.
export function litEdge(ctx, color, w, t, pulse = true) {
  const k = pulse ? 0.65 + 0.35 * Math.sin(t * 2.4) : 1;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = rgba(color, 0.14 * k + 0.05); ctx.lineWidth = w * 3.2; ctx.stroke();
  ctx.strokeStyle = rgba(color, 0.3 * k + 0.1); ctx.lineWidth = w * 1.8; ctx.stroke();
  ctx.setLineDash([w * 2.6, w * 1.6]); ctx.strokeStyle = rgba(tint(color, 0.4), 0.95); ctx.lineWidth = w; ctx.stroke();
  ctx.restore();
}

// ---- particles -----------------------------------------------------------------------------------------------------------------
// kinds: chip (tumbling shard), dust (soft puff), spark (four-point star), drop (round droplet), flake (paper scrap).
export function createFx() {
  let list = [], n = 0;
  return {
    emit(kind, x, y, { count = 6, color = '#ccc', size = 5, speed = 120, life = 0.55, gravity = 380, spread = Math.PI * 2, angle = -Math.PI / 2 } = {}) {
      for (let k = 0; k < count; k++) {
        const a = angle + (hash(n, k, 1) - 0.5) * spread, v = speed * (0.4 + hash(n, k, 2) * 0.8);
        list.push({ kind, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, age: 0, life: life * (0.7 + hash(n, k, 3) * 0.6), g: gravity, s: size * (0.6 + hash(n, k, 4) * 0.8), rot: hash(n, k, 5) * 6.28, vr: (hash(n, k, 6) - 0.5) * 14, color });
      }
      n++;
      if (list.length > 220) list.splice(0, list.length - 220);
    },
    update(dt) {
      for (const p of list) { p.age += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; if (p.kind === 'dust') { p.vx *= 0.96; p.vy *= 0.96; } }
      list = list.filter((p) => p.age < p.life);
    },
    draw(ctx) {
      for (const p of list) {
        const u = p.age / p.life, a = 1 - u;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = Math.max(0, a);
        if (p.kind === 'dust') { ctx.fillStyle = p.color; ctx.globalAlpha = a * 0.5; ctx.beginPath(); ctx.arc(0, 0, p.s * (1 + u * 1.6), 0, 6.2832); ctx.fill(); }
        else if (p.kind === 'spark') {
          ctx.fillStyle = p.color; ctx.beginPath(); const r = p.s * (1.2 - u * 0.6);
          for (let i = 0; i < 8; i++) { const ang = (i * Math.PI) / 4, rad = i % 2 ? r * 0.22 : r; ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad); }
          ctx.closePath(); ctx.fill();
        } else if (p.kind === 'drop') { ctx.fillStyle = p.color; ctx.beginPath(); ctx.ellipse(0, 0, p.s * 0.7, p.s, 0, 0, 6.2832); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-p.s * 0.25, -p.s * 0.5, p.s * 0.2, p.s * 0.4); }
        else if (p.kind === 'curl') { ctx.strokeStyle = p.color; ctx.lineWidth = Math.max(1.5, p.s * 0.45); ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, p.s * 0.9, 0.5, 5.2); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = Math.max(1, p.s * 0.15); ctx.beginPath(); ctx.arc(0, 0, p.s * 0.9, 3.6, 4.8); ctx.stroke(); }
        else { // chip, flake
          ctx.fillStyle = p.color; ctx.beginPath(); ctx.moveTo(-p.s, -p.s * 0.6); ctx.lineTo(p.s * 0.9, -p.s * 0.3); ctx.lineTo(p.s * 0.4, p.s * 0.8); ctx.lineTo(-p.s * 0.6, p.s * 0.5); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-p.s, -p.s * 0.6, p.s * 1.2, p.s * 0.25);
        }
        ctx.restore();
      }
    },
    count: () => list.length,
  };
}

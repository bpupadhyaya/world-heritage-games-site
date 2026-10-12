// Shared CHROME for every World Heritage Games engine: title screen, glossy buttons, header/HUD, footer, rules card,
// result card, transitions, particles, sounds, texture and safe-area handling. Pure drawing code: no DOM writes,
// no Math.random, no Date.now. Everything is driven by dt (ui.update) and by the palette, so a game gets a consistent
// professional frame for free and engines only draw the scene inside the `area` rect.
//
// Engines receive this object as `g.ui` in createActivity(...).render(g, area). See docs/ENGINE-CONTRACT.md ("Shared chrome").
import { hostBackVisible } from '../kit/host.js';

// ---- colour helpers ---------------------------------------------------------------------------------------------
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const parse = (c) => {
  if (typeof c !== 'string') return null;
  let m = /^#([0-9a-f]{3})$/i.exec(c);
  if (m) return [...m[1]].map((h) => parseInt(h + h, 16));
  m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(c);
  if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
  m = /^rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/i.exec(c);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  return null;
};
const rgb = (a) => `rgb(${Math.round(a[0])},${Math.round(a[1])},${Math.round(a[2])})`;
export const shade = (c, amt) => {   // amt -1..1: toward black (<0) or white (>0)
  const p = parse(c); if (!p) return c;
  const t = amt < 0 ? 0 : 255, k = Math.abs(amt);
  return rgb([p[0] + (t - p[0]) * k, p[1] + (t - p[1]) * k, p[2] + (t - p[2]) * k]);
};
export const mix = (c1, c2, t) => {
  const a = parse(c1), b = parse(c2); if (!a || !b) return c1;
  return rgb([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
};
export const rgba = (c, a) => { const p = parse(c); return p ? `rgba(${p[0]},${p[1]},${p[2]},${a})` : c; };
export const luminance = (c) => { const p = parse(c); if (!p) return 0.5; const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(p[0]) + 0.7152 * f(p[1]) + 0.0722 * f(p[2]); };
export const onColor = (c) => (luminance(c) > 0.38 ? '#1a1612' : '#ffffff');   // readable text colour on top of c
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const easeOut = (t) => 1 - (1 - clamp(t)) ** 3;
const easeOutBack = (t) => { t = clamp(t); const c = 1.9; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };

const DISPLAY = '"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,"Times New Roman",serif';
const TEXT = 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",sans-serif';

export function createUI({ pal, meta, px, audio = null, config = {}, options = {}, name = '', theme = {} } = {}) {
  const k = () => meta.cssPerUnit || 1;       // css px per virtual unit
  const css = (n) => n / k();                 // css px -> virtual units
  const quiet = options.shot === true || options.autoplay === true;
  let reduced = config.reducedMotion === true;
  try { if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) reduced = true; } catch { /* no matchMedia */ }
  const seed = hash(String(name) + (pal.accent ?? ''));
  const ui = { pal, fonts: { display: DISPLAY, text: TEXT }, css, shade, mix, rgba, onColor, luminance, easeOut, easeOutBack, clamp };
  ui.reduced = () => reduced;
  let t = 0;
  let hits = [];
  const pressAt = Object.create(null);
  let holdId = null, hoverId = null, lastDown = -9;
  const counts = new Map();
  let frameInsets = { top: 0, bottom: 0, left: 0, right: 0, back: 0 };

  // ---- sounds: audio.tone only, quiet and tuned --------------------------------------------------------------------
  const tone = (o) => { try { audio?.tone?.(o); } catch { /* audio is optional */ } };
  ui.sfx = {
    tap: () => tone({ freq: 640, to: 560, dur: 0.05, type: 'triangle', vol: 0.12 }),
    select: () => tone({ freq: 520, to: 700, dur: 0.08, type: 'triangle', vol: 0.12 }),
    back: () => tone({ freq: 420, to: 300, dur: 0.08, type: 'triangle', vol: 0.1 }),
    hit: () => tone({ freq: 740, to: 880, dur: 0.07, type: 'sine', vol: 0.14 }),
    miss: () => tone({ freq: 240, to: 170, dur: 0.12, type: 'triangle', vol: 0.1 }),
    good: () => { tone({ freq: 660, dur: 0.07, type: 'triangle', vol: 0.12 }); tone({ freq: 990, dur: 0.1, type: 'sine', vol: 0.08 }); },
    star: (i = 0) => { const f = [523, 659, 784][i % 3]; tone({ freq: f, dur: 0.3, type: 'triangle', vol: 0.16 }); tone({ freq: f * 2, dur: 0.22, type: 'sine', vol: 0.07 }); },
    win: () => { tone({ freq: 392, to: 784, dur: 0.35, type: 'triangle', vol: 0.16 }); tone({ freq: 784, to: 1175, dur: 0.4, type: 'sine', vol: 0.07 }); },
    lose: () => tone({ freq: 330, to: 196, dur: 0.4, type: 'triangle', vol: 0.12 }),
    whoosh: () => tone({ freq: 300, to: 620, dur: 0.12, type: 'sine', vol: 0.05 }),
  };

  // ---- frame lifecycle ---------------------------------------------------------------------------------------------
  const readInsets = () => {
    const s = globalThis.__safeInsets || {};
    const d = globalThis.document;
    const barAbove = !!(d && d.getElementById && d.getElementById('bar'));  // host DOM bar already sits above the canvas
    frameInsets = {
      top: barAbove ? 0 : css(s.top || 0), bottom: css(s.bottom || 0), left: css(s.left || 0), right: css(s.right || 0),
      back: !barAbove && !quiet && hostBackVisible() ? css(56) : 0,
    };
  };
  ui.insets = () => frameInsets;
  ui.begin = () => { hits = []; readInsets(); };
  ui.clearHits = () => { hits = []; };
  ui.now = () => t;
  ui.hit = (x, y) => { for (let i = hits.length - 1; i >= 0; i--) { const h = hits[i]; if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h.id; } return null; };
  ui.press = (id) => { pressAt[id] = t; };
  ui.update = (dt, input) => {
    t += dt;
    const p = input?.pointer;
    if (p) {
      if (p.down) { lastDown = t; holdId = ui.hit(p.x, p.y); hoverId = null; }
      else { holdId = null; hoverId = t - lastDown > 0.8 ? ui.hit(p.x, p.y) : null; }
    }
    for (const c of counts.values()) {
      const d = c.target - c.v;
      c.v = Math.abs(d) < 0.5 || reduced ? c.target : c.v + d * Math.min(1, dt * 9);
    }
    stepParticles(dt);
  };
  // animated number: ui.count('score', 42) returns the value to display now (counts up smoothly)
  ui.count = (key, target) => {
    let c = counts.get(key);
    if (!c) { c = { v: target, target }; counts.set(key, c); }
    c.target = target; return Math.round(c.v);
  };
  ui.countReset = (key, v = 0) => { const c = counts.get(key); if (c) { c.v = v; } };

  // ---- primitives --------------------------------------------------------------------------------------------------
  const rr = (ctx, x, y, w, h, r) => { r = Math.max(0, Math.min(r, w / 2, h / 2)); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  ui.rr = rr;
  const vgrad = (ctx, y0, y1, stops) => { const gr = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  ui.vgrad = vgrad;

  // text: ui.text(ctx, s, x, y, size, { color, align, weight, display, shadow, spacing, italic })
  ui.text = (ctx, s, x, y, size, o = {}) => {
    const { color = pal.ink, align = 'center', weight = o.display ? '800' : '600', display = false, shadow = false, spacing = 0, italic = false, base = 'middle' } = o;
    ctx.font = `${italic ? 'italic ' : ''}${weight} ${Math.round(size)}px ${display ? DISPLAY : TEXT}`;
    ctx.textAlign = align; ctx.textBaseline = base;
    if (spacing) ctx.letterSpacing = `${spacing}px`;
    if (shadow) { ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillText(String(s), x, y + Math.max(1.5, size * 0.06)); }
    ctx.fillStyle = color; ctx.fillText(String(s), x, y);
    if (spacing) ctx.letterSpacing = '0px';
  };
  const setFont = (ctx, size, weight = '600', display = false, italic = false) => { ctx.font = `${italic ? 'italic ' : ''}${weight} ${Math.round(size)}px ${display ? DISPLAY : TEXT}`; };
  // shrink a size until the string fits maxW (minimum 55%)
  ui.fit = (ctx, s, maxW, size, weight = '700', display = false) => {
    let z = size; setFont(ctx, z, weight, display);
    for (let i = 0; i < 14 && z > size * 0.55 && ctx.measureText(String(s)).width > maxW; i++) { z *= 0.93; setFont(ctx, z, weight, display); }
    return z;
  };
  ui.wrap = (ctx, s, maxW, size, o = {}) => {
    setFont(ctx, size, o.weight ?? '400', o.display === true, o.italic === true);
    const lines = []; let line = '';
    for (const word of String(s).split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > maxW) { lines.push(line); line = word; } else line = next;
    }
    if (line) lines.push(line);
    return lines;
  };
  // heavy "3D" display lettering (gradient face, dark extrusion, light rim); returns the height consumed
  ui.title = (ctx, s, x, y, size, { maxW = meta.width - 60, color = pal.accent, lines = 2, align = 'center' } = {}) => {
    let z = size, ls = ui.wrap(ctx, s, maxW, z, { weight: '800', display: true });
    while (ls.length > lines && z > size * 0.6) { z *= 0.92; ls = ui.wrap(ctx, s, maxW, z, { weight: '800', display: true }); }
    ls = ls.slice(0, lines);
    const lh = z * 1.08;
    ls.forEach((l, i) => {
      const cy = y + i * lh + lh / 2;
      setFont(ctx, z, '800', true); ctx.textAlign = align; ctx.textBaseline = 'middle';
      const dark = shade(color, -0.62);
      for (let d = Math.max(2, Math.round(z * 0.07)); d > 0; d--) { ctx.fillStyle = d > 1 ? dark : 'rgba(0,0,0,0.35)'; ctx.fillText(l, x, cy + d); }
      ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, z * 0.045); ctx.strokeStyle = shade(color, -0.55); ctx.strokeText(l, x, cy);
      ctx.fillStyle = vgrad(ctx, cy - z * 0.5, cy + z * 0.5, [[0, shade(color, 0.5)], [0.5, color], [1, shade(color, -0.22)]]);
      ctx.fillText(l, x, cy);
    });
    return ls.length * lh;
  };

  ui.panel = (ctx, x, y, w, h, o = {}) => {
    const { r = 22, fill = pal.panel, border = null, shadow = true, bevel = true, gloss = false, alpha = 1 } = o;
    ctx.save(); ctx.globalAlpha *= alpha;
    if (shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = Math.max(8, h * 0.12); ctx.shadowOffsetY = Math.max(3, h * 0.04);
      rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    }
    rr(ctx, x, y, w, h, r); ctx.fillStyle = vgrad(ctx, y, y + h, [[0, shade(fill, 0.1)], [1, shade(fill, -0.14)]]); ctx.fill();
    if (bevel) { rr(ctx, x + 1.5, y + 1.5, w - 3, h - 3, Math.max(2, r - 1.5)); ctx.strokeStyle = vgrad(ctx, y, y + h, [[0, 'rgba(255,255,255,0.28)'], [0.5, 'rgba(255,255,255,0.04)'], [1, 'rgba(0,0,0,0.25)']]); ctx.lineWidth = 2; ctx.stroke(); }
    if (border) { rr(ctx, x, y, w, h, r); ctx.strokeStyle = border; ctx.lineWidth = 2; ctx.stroke(); }
    if (gloss) ui.gloss(ctx, x, y, w, h, r, 0.14);
    ctx.restore();
  };
  ui.gloss = (ctx, x, y, w, h, r = 16, a = 0.22) => {
    ctx.save(); rr(ctx, x, y, w, h, r); ctx.clip();
    ctx.fillStyle = vgrad(ctx, y, y + h * 0.58, [[0, `rgba(255,255,255,${a * 1.6})`], [1, 'rgba(255,255,255,0)']]);
    ctx.fillRect(x, y, w, h * 0.58);
    ctx.restore();
  };
  ui.vignette = (ctx, x, y, w, h, strength = 0.42) => {
    const cx = x + w / 2, cy = y + h / 2, R = Math.hypot(w, h) / 2;
    const gr = ctx.createRadialGradient(cx, cy, R * 0.45, cx, cy, R);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${strength})`);
    ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
  };
  // texture: kinds weave | grain | diamond | dots | paper. Default kind is derived from the game, or theme.texture.
  const KINDS = ['weave', 'grain', 'diamond', 'dots', 'paper'];
  ui.textureKind = () => (KINDS.includes(theme.texture) ? theme.texture : KINDS[seed % KINDS.length]);
  ui.texture = (ctx, x, y, w, h, o = {}) => {
    const kind = o.kind ?? ui.textureKind(), a = o.alpha ?? 0.07, light = o.light ?? '#ffffff', dark = o.dark ?? '#000000';
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.lineWidth = 1.2;
    if (kind === 'weave') {
      const s = 20;
      ctx.beginPath(); for (let i = 0; i * s < w; i++) { ctx.moveTo(x + i * s, y); ctx.lineTo(x + i * s, y + h); }
      ctx.strokeStyle = rgba(light, a); ctx.stroke();
      ctx.beginPath(); for (let j = 0; j * s < h; j++) { ctx.moveTo(x, y + j * s + s / 2); ctx.lineTo(x + w, y + j * s + s / 2); }
      ctx.strokeStyle = rgba(dark, a * 1.3); ctx.stroke();
    } else if (kind === 'grain') {
      ctx.beginPath();
      for (let j = 0, n = 0; j * 9 < h; j++, n++) { const yy = y + j * 9 + ((hash(`g${j}`) % 7) - 3), wob = ((hash(`w${j}`) % 9) - 4); ctx.moveTo(x, yy); ctx.quadraticCurveTo(x + w / 2, yy + wob, x + w, yy - wob / 2); }
      ctx.strokeStyle = rgba(dark, a * 1.2); ctx.stroke();
    } else if (kind === 'diamond') {
      const s = 44;
      ctx.beginPath();
      for (let i = -Math.ceil(h / s); i * s < w; i++) { ctx.moveTo(x + i * s, y); ctx.lineTo(x + i * s + h, y + h); ctx.moveTo(x + i * s + h, y); ctx.lineTo(x + i * s, y + h); }
      ctx.strokeStyle = rgba(light, a * 0.9); ctx.stroke();
    } else if (kind === 'dots') {
      const s = 30;
      ctx.beginPath();
      for (let j = 0; j * s < h + s; j++) for (let i = 0; i * s < w + s; i++) { const ox = j % 2 ? s / 2 : 0; ctx.moveTo(x + i * s + ox + 2, y + j * s); ctx.arc(x + i * s + ox, y + j * s, 2, 0, Math.PI * 2); }
      ctx.fillStyle = rgba(light, a * 1.1); ctx.fill();
    } else {
      ctx.beginPath();
      for (let i = 0; i < 150; i++) {
        const hx = hash(`px${i}`), hy = hash(`py${i}`);
        const sx = x + (hx % 1000) / 1000 * w, sy = y + (hy % 1000) / 1000 * h, len = 8 + (hx >> 10) % 18, ang = ((hy >> 8) % 360) * Math.PI / 180;
        ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(ang) * len, sy + Math.sin(ang) * len);
      }
      ctx.strokeStyle = rgba(i2(light, dark), a * 1.6); ctx.stroke();
    }
    ctx.restore();
  };
  const i2 = (l, d) => (luminance(pal.bg) > 0.5 ? d : l);
  // full-screen ground: gradient + bloom + texture + vignette
  ui.background = (ctx, x, y, w, h, o = {}) => {
    const base = o.color ?? pal.bg;
    ctx.fillStyle = vgrad(ctx, y, y + h, [[0, shade(base, 0.1)], [0.55, base], [1, shade(base, -0.3)]]);
    ctx.fillRect(x, y, w, h);
    const bloom = ctx.createRadialGradient(x + w / 2, y + h * 0.28, 10, x + w / 2, y + h * 0.28, Math.max(w, h) * 0.7);
    bloom.addColorStop(0, rgba(o.glow ?? pal.accent, 0.16)); bloom.addColorStop(1, rgba(o.glow ?? pal.accent, 0));
    ctx.fillStyle = bloom; ctx.fillRect(x, y, w, h);
    if (o.texture !== false) ui.texture(ctx, x, y, w, h, { alpha: o.textureAlpha ?? 0.06 });
    if (o.vignette !== false) ui.vignette(ctx, x, y, w, h, o.vignetteStrength ?? 0.4);
  };

  // ---- sparkle / stars / particles -----------------------------------------------------------------------------------
  ui.sparkle = (ctx, x, y, r, o = {}) => {
    const { color = '#fff8d6', rot = 0, alpha = 1 } = o;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= alpha;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.lineTo(Math.cos(a + Math.PI / 4) * r * 0.2, Math.sin(a + Math.PI / 4) * r * 0.2);
    }
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
    ctx.restore();
  };
  const starPath = (ctx, cx, cy, R, r, rot = -Math.PI / 2) => {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = rot + (i * Math.PI) / 5, rad = i % 2 ? r : R; ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); }
    ctx.closePath();
  };
  ui.star = (ctx, cx, cy, size, { filled = true, scale = 1, rot = 0 } = {}) => {
    const R = size * 0.5 * scale; if (R <= 0.5) return;
    ctx.save();
    starPath(ctx, cx, cy, R, R * 0.48, -Math.PI / 2 + rot);
    if (filled) {
      ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = R * 0.3; ctx.shadowOffsetY = R * 0.08;
      ctx.fillStyle = vgrad(ctx, cy - R, cy + R, [[0, '#fff1a8'], [0.5, '#f5c542'], [1, '#c98a14']]); ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1.5, R * 0.08); ctx.strokeStyle = '#8a5a0a'; ctx.stroke();
      starPath(ctx, cx - R * 0.06, cy - R * 0.08, R * 0.62, R * 0.3, -Math.PI / 2 + rot); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fill(); ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1.5, R * 0.07); ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.stroke();
    }
    ctx.restore();
  };
  const POOL = 96;
  const parts = Array.from({ length: POOL }, () => ({ on: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 4, rot: 0, vr: 0, color: '#fff', kind: 0 }));
  let pseed = (seed | 1) >>> 0;
  const prnd = () => { pseed ^= pseed << 13; pseed >>>= 0; pseed ^= pseed >>> 17; pseed ^= pseed << 5; pseed >>>= 0; return pseed / 4294967296; };
  let pcursor = 0;
  // particle burst: kind 'spark' (4-point stars) or 'confetti'
  ui.burst = (x, y, { n = 18, colors = [pal.accent, '#fff8d6'], speed = 360, life = 0.9, size = 10, kind = 'spark', gravity = 520 } = {}) => {
    if (reduced) n = Math.min(n, 5);
    for (let i = 0; i < n; i++) {
      const p = parts[pcursor]; pcursor = (pcursor + 1) % POOL;
      const a = prnd() * Math.PI * 2, sp = speed * (0.35 + prnd() * 0.65);
      p.on = true; p.x = x; p.y = y; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - speed * 0.35; p.life = 0; p.max = life * (0.7 + prnd() * 0.6);
      p.size = size * (0.6 + prnd() * 0.8); p.rot = prnd() * 6.28; p.vr = (prnd() - 0.5) * 10; p.color = colors[i % colors.length]; p.kind = kind === 'confetti' ? 1 : 0; p.g = gravity;
    }
  };
  const stepParticles = (dt) => {
    for (const p of parts) {
      if (!p.on) continue;
      p.life += dt; if (p.life >= p.max) { p.on = false; continue; }
      p.vy += (p.g ?? 500) * dt; p.vx *= 1 - Math.min(1, dt * 1.4); p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    }
  };
  ui.particles = (ctx) => {
    for (const p of parts) {
      if (!p.on) continue;
      const a = 1 - p.life / p.max;
      if (p.kind === 0) ui.sparkle(ctx, p.x, p.y, p.size * (0.5 + 0.5 * a), { color: p.color, rot: p.rot, alpha: clamp(a * 1.6) });
      else { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha *= clamp(a * 1.6); ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); ctx.restore(); }
    }
  };

  // ---- icons ---------------------------------------------------------------------------------------------------------
  ui.icon = (ctx, kind, cx, cy, s, color = '#fff') => {
    ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = Math.max(2, s * 0.13); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const h = s / 2;
    ctx.beginPath();
    if (kind === 'play') { ctx.moveTo(-h * 0.5, -h * 0.75); ctx.lineTo(h * 0.8, 0); ctx.lineTo(-h * 0.5, h * 0.75); ctx.closePath(); ctx.fill(); }
    else if (kind === 'eye') { ctx.moveTo(-h, 0); ctx.quadraticCurveTo(0, -h * 1.1, h, 0); ctx.quadraticCurveTo(0, h * 1.1, -h, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, h * 0.32, 0, 6.3); ctx.fill(); }
    else if (kind === 'book') { ctx.moveTo(0, -h * 0.7); ctx.lineTo(0, h * 0.8); ctx.moveTo(0, -h * 0.7); ctx.quadraticCurveTo(-h * 0.5, -h * 0.95, -h, -h * 0.7); ctx.lineTo(-h, h * 0.55); ctx.quadraticCurveTo(-h * 0.5, h * 0.35, 0, h * 0.8); ctx.quadraticCurveTo(h * 0.5, h * 0.35, h, h * 0.55); ctx.lineTo(h, -h * 0.7); ctx.quadraticCurveTo(h * 0.5, -h * 0.95, 0, -h * 0.7); ctx.stroke(); }
    else if (kind === 'menu') { ctx.moveTo(-h, -h * 0.1); ctx.lineTo(0, -h * 0.9); ctx.lineTo(h, -h * 0.1); ctx.moveTo(-h * 0.7, -h * 0.15); ctx.lineTo(-h * 0.7, h * 0.8); ctx.lineTo(h * 0.7, h * 0.8); ctx.lineTo(h * 0.7, -h * 0.15); ctx.stroke(); }
    else if (kind === 'hint') { ctx.arc(0, -h * 0.2, h * 0.65, 0, 6.3); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-h * 0.3, h * 0.65); ctx.lineTo(h * 0.3, h * 0.65); ctx.moveTo(-h * 0.2, h * 0.95); ctx.lineTo(h * 0.2, h * 0.95); ctx.stroke(); }
    else if (kind === 'restart') { ctx.arc(0, 0, h * 0.75, -Math.PI * 0.2, Math.PI * 1.35); ctx.stroke(); ctx.beginPath(); ctx.moveTo(h * 0.75, -h * 0.85); ctx.lineTo(h * 0.7, -h * 0.2); ctx.lineTo(h * 0.1, -h * 0.45); ctx.closePath(); ctx.fill(); }
    else if (kind === 'undo') { ctx.moveTo(-h * 0.2, -h * 0.8); ctx.lineTo(-h * 0.8, -h * 0.3); ctx.lineTo(-h * 0.2, h * 0.2); ctx.moveTo(-h * 0.7, -h * 0.3); ctx.quadraticCurveTo(h * 1.1, -h * 0.4, h * 0.7, h * 0.7); ctx.stroke(); }
    else if (kind === 'plus') { ctx.moveTo(-h * 0.8, 0); ctx.lineTo(h * 0.8, 0); ctx.moveTo(0, -h * 0.8); ctx.lineTo(0, h * 0.8); ctx.stroke(); }
    else if (kind === 'up') { ctx.moveTo(-h * 0.7, h * 0.3); ctx.lineTo(0, -h * 0.4); ctx.lineTo(h * 0.7, h * 0.3); ctx.stroke(); }
    else if (kind === 'down') { ctx.moveTo(-h * 0.7, -h * 0.3); ctx.lineTo(0, h * 0.4); ctx.lineTo(h * 0.7, -h * 0.3); ctx.stroke(); }
    else if (kind === 'left') { ctx.moveTo(h * 0.3, -h * 0.7); ctx.lineTo(-h * 0.4, 0); ctx.lineTo(h * 0.3, h * 0.7); ctx.stroke(); }
    else if (kind === 'people') { ctx.arc(-h * 0.45, -h * 0.35, h * 0.3, 0, 6.3); ctx.moveTo(h * 0.95, -h * 0.35); ctx.arc(h * 0.45, -h * 0.35, h * 0.3, 0, 6.3); ctx.moveTo(-h * 0.95, h * 0.7); ctx.quadraticCurveTo(-h * 0.45, -h * 0.1, 0, h * 0.7); ctx.moveTo(0, h * 0.7); ctx.quadraticCurveTo(h * 0.45, -h * 0.1, h * 0.95, h * 0.7); ctx.stroke(); }
    else if (kind === 'bot') { rr(ctx, -h * 0.8, -h * 0.55, h * 1.6, h * 1.2, h * 0.3); ctx.stroke(); ctx.beginPath(); ctx.arc(-h * 0.35, 0, h * 0.14, 0, 6.3); ctx.arc(h * 0.35, 0, h * 0.14, 0, 6.3); ctx.fill(); ctx.beginPath(); ctx.moveTo(0, -h * 0.55); ctx.lineTo(0, -h * 0.9); ctx.stroke(); }
    else if (kind === 'flag') { ctx.moveTo(-h * 0.6, h * 0.9); ctx.lineTo(-h * 0.6, -h * 0.9); ctx.lineTo(h * 0.8, -h * 0.5); ctx.lineTo(-h * 0.6, -h * 0.1); ctx.stroke(); }
    ctx.restore();
  };

  // ---- buttons -------------------------------------------------------------------------------------------------------
  // ui.button(ctx, id, label, x, y, w, h, { primary, off, icon, size }) registers a hit rect for ui.hit().
  ui.button = (ctx, id, label, x, y, w, h, o = {}) => {
    const { primary = false, off = false, icon = null, size = null } = o;
    if (!off) hits.push({ id, x, y, w, h });
    const since = t - (pressAt[id] ?? -9);
    let s = 1, dip = 0;
    if (!off) {
      if (holdId === id) { s = 0.96; dip = 1; }
      else if (since < 0.3 && !reduced) { const u = since / 0.3; s = 0.96 + 0.04 * easeOutBack(u); dip = 1 - u; }
    }
    const hover = !off && hoverId === id ? 0.08 : 0;
    const cx = x + w / 2, cy = y + h / 2;
    ctx.save(); ctx.translate(cx, cy + dip * 2); ctx.scale(s, s); ctx.translate(-cx, -cy);
    if (off) ctx.globalAlpha = 0.45;
    const r = Math.min(h * 0.34, 28);
    const body = primary ? pal.accent : shade(pal.panel, 0.04);
    const top = shade(body, (primary ? 0.32 : 0.2) + hover), bot = shade(body, -0.14 + hover * 0.5);
    const plate = primary ? shade(body, -0.52) : shade(pal.panel, -0.55);
    const depth = Math.max(3, Math.min(8, h * 0.09)) * (1 - dip * 0.65);
    rr(ctx, x, y + depth, w, h, r); ctx.fillStyle = plate; ctx.fill();
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = depth * 0.6;
    rr(ctx, x, y, w, h, r); ctx.fillStyle = bot; ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    rr(ctx, x, y, w, h, r); ctx.fillStyle = vgrad(ctx, y, y + h, [[0, top], [1, bot]]); ctx.fill();
    rr(ctx, x + 1.5, y + 1.5, w - 3, h - 3, r - 1.5); ctx.lineWidth = 2; ctx.strokeStyle = `rgba(255,255,255,${primary ? 0.55 : 0.2})`; ctx.stroke();
    rr(ctx, x, y, w, h, r); ctx.lineWidth = 1.5; ctx.strokeStyle = primary ? shade(body, -0.45) : 'rgba(0,0,0,0.5)'; ctx.stroke();
    ui.gloss(ctx, x, y, w, h, r, primary ? 0.24 : 0.12);
    if (primary && !off && !reduced) {   // slow shine sweep so the main action invites a tap
      const ph = (t % 3.4) / 3.4;
      if (ph < 0.4) {
        const u = ph / 0.4, sx = x - h + (w + h * 2) * u;
        ctx.save(); rr(ctx, x, y, w, h, r); ctx.clip();
        ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx + h * 0.5, y); ctx.lineTo(sx + h * 0.5 - h * 0.6, y + h); ctx.lineTo(sx - h * 0.6, y + h); ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fill(); ctx.restore();
      }
    }
    const fg = primary ? onColor(body) : pal.ink;
    const fs = size ?? Math.min(px(26), h * 0.44);
    setFont(ctx, fs, '700');
    const tw = ctx.measureText(String(label)).width, iw = icon ? fs * 1.15 : 0, gap = icon ? fs * 0.4 : 0;
    const maxTw = w - 24 - iw - gap;
    const fs2 = tw > maxTw && maxTw > 10 ? fs * (maxTw / tw) : fs;
    setFont(ctx, fs2, '700');
    const tw2 = ctx.measureText(String(label)).width;
    const total = tw2 + iw + gap, sx0 = cx - total / 2;
    if (icon) ui.icon(ctx, icon, sx0 + iw / 2, cy, fs2 * 0.95, fg);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    if (!primary) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillText(String(label), sx0 + iw + gap, cy + 1.5); }
    ctx.fillStyle = fg; ctx.fillText(String(label), sx0 + iw + gap, cy + 1);
    ctx.restore();
  };
  // min button height in virtual units (>= 44 css px)
  ui.buttonH = (base = 58) => Math.max(css(46), px(base));

  // ---- layout metrics ------------------------------------------------------------------------------------------------
  // ui.layout(W, H, { footer: n buttons or false }) -> { headerBottom, area, footerTop, bh }
  ui.layout = (W, H, { footer = true, header = true } = {}) => {
    const ins = frameInsets;
    const bh = ui.buttonH(54);
    const top = ins.top + (header ? px(96) : 8);
    const footH = footer ? bh + 28 + ins.bottom : ins.bottom + 8;
    return { headerBottom: top, footerTop: H - footH, bh, area: { x: 12, y: top, w: W - 24, h: Math.max(40, H - top - footH) } };
  };

  // header/HUD band: title (display face), sub line, score pill with count-up, optional combo and progress bar
  ui.header = (ctx, W, { title = '', sub = '', subAccent = false, score = null, max = null, frac = null, combo = 0, scoreKey = 'score' } = {}) => {
    const ins = frameInsets;
    const top = ins.top, H0 = px(96);
    ctx.save();
    ctx.fillStyle = vgrad(ctx, 0, top + H0, [[0, 'rgba(0,0,0,0.55)'], [1, 'rgba(0,0,0,0.12)']]);
    ctx.fillRect(0, 0, W, top + H0);
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(0, top + H0 - 1, W, 1);
    ctx.restore();
    const left = 16 + ins.left + ins.back, right = W - 16 - ins.right;
    // score pill
    let pillW = 0;
    if (score !== null && score !== undefined) {
      const shown = typeof score === 'number' ? ui.count(scoreKey, score) : score;
      const big = px(34), small = px(20);
      setFont(ctx, big, '800', true);
      let txt = String(shown), tw = ctx.measureText(txt).width, mw = 0, mtxt = '';
      if (max) { mtxt = ` / ${max}`; setFont(ctx, small, '600'); mw = ctx.measureText(mtxt).width; }
      pillW = Math.max(px(92), tw + mw + 36); const ph = px(52), py = top + px(10);
      ui.panel(ctx, right - pillW, py, pillW, ph, { r: ph / 2, fill: shade(pal.panel, -0.1), border: rgba(pal.accent, 0.55), shadow: false });
      const bump = typeof score === 'number' ? easeOut(1 - clamp((counts.get(scoreKey)?.target - counts.get(scoreKey)?.v) / 10 || 0)) : 1;
      const cx = right - pillW / 2 - mw / 2;
      setFont(ctx, big * (0.94 + 0.06 * bump), '800', true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = pal.accent; ctx.fillText(txt, cx, py + ph / 2 + 1);
      if (mtxt) { setFont(ctx, small, '600'); ctx.textAlign = 'left'; ctx.fillStyle = pal.dim; ctx.fillText(mtxt, cx + tw / 2, py + ph / 2 + 2); }
      if (combo > 1) {
        const cw = px(70), cxp = right - pillW - 10 - cw;
        const pulse = reduced ? 1 : 1 + 0.06 * Math.sin(t * 9);
        ctx.save(); ctx.translate(cxp + cw / 2, py + ph / 2); ctx.scale(pulse, pulse); ctx.translate(-(cxp + cw / 2), -(py + ph / 2));
        ui.panel(ctx, cxp, py + 4, cw, ph - 8, { r: (ph - 8) / 2, fill: pal.a ?? pal.p0 ?? '#d64b3c', shadow: false });
        ui.text(ctx, `x${combo}`, cxp + cw / 2, py + ph / 2 + 1, px(24), { weight: '800', display: true, color: '#fff' });
        ctx.restore();
        pillW += cw + 10;
      }
    }
    const maxW = Math.max(60, right - left - pillW - 12);
    const tsz = ui.fit(ctx, title, maxW, px(32), '800', true);
    ui.text(ctx, title, left, top + px(28), tsz, { align: 'left', display: true, color: pal.ink, shadow: true });
    if (sub) {
      const ssz = ui.fit(ctx, sub, maxW, px(21), '600');
      ui.text(ctx, sub, left, top + px(60), ssz, { align: 'left', color: subAccent ? pal.accent : pal.dim, weight: '600' });
    }
    if (frac !== null && frac !== undefined) {
      const bw = W - 32 - ins.left - ins.right, bx = 16 + ins.left, by = top + H0 - px(14), bh = Math.max(6, px(8));
      rr(ctx, bx, by, bw, bh, bh / 2); ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill();
      const f = clamp(frac);
      if (f > 0) { rr(ctx, bx, by, Math.max(bh, bw * f), bh, bh / 2); ctx.fillStyle = vgrad(ctx, by, by + bh, [[0, shade(pal.accent, 0.35)], [1, shade(pal.accent, -0.1)]]); ctx.fill(); }
    }
  };

  // footer strip with glossy buttons: items = [{ id, label, icon, off }]
  ui.footer = (ctx, W, H, items) => {
    const ins = frameInsets;
    const bh = ui.buttonH(54), by = H - ins.bottom - bh - 14;
    ctx.fillStyle = vgrad(ctx, by - 18, H, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.5)']]);
    ctx.fillRect(0, by - 18, W, H - by + 18);
    const n = items.length, gap = 12, avail = W - 32 - ins.left - ins.right;
    const bw = Math.min(210, (avail - gap * (n - 1)) / n);
    let x = (W - (bw * n + gap * (n - 1))) / 2;
    for (const it of items) { ui.button(ctx, it.id, it.label, x, by, bw, bh, { icon: it.icon, off: it.off, size: Math.min(px(24), bh * 0.42) }); x += bw + gap; }
  };

  // ---- scene transitions -----------------------------------------------------------------------------------------------
  ui.sceneBegin = (ctx, sceneT) => {
    ctx.save();
    if (reduced || quiet) return 1;
    const e = easeOut(sceneT / 0.28);
    ctx.translate(0, (1 - e) * 16);
    return e;
  };
  ui.sceneEnd = (ctx, W, H, sceneT) => {
    ctx.restore();
    if (reduced || quiet) return;
    const e = easeOut(sceneT / 0.28);
    if (e < 1) { ctx.fillStyle = rgba(pal.bg, 1 - e); ctx.fillRect(0, 0, W, H); }
  };

  // ---- title screen ----------------------------------------------------------------------------------------------------
  // ui.medallion: procedural emblem built from the palette and the game's name (rosette | star | lattice)
  ui.medallion = (ctx, cx, cy, R) => {
    const variant = seed % 3, n = 8 + ((seed >> 4) % 5);
    const cols = [pal.accent, pal.a ?? pal.p0 ?? '#d64b3c', pal.b ?? pal.p1 ?? '#2d7bd6', pal.good ?? '#58c27d'];
    const spin = reduced ? 0 : t * 0.12;
    // ground shadow
    ctx.save(); ctx.translate(cx, cy + R * 1.04); ctx.scale(1, 0.18); ctx.beginPath(); ctx.arc(0, 0, R * 0.95, 0, 6.3); ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fill(); ctx.restore();
    // disc
    const disc = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
    disc.addColorStop(0, shade(pal.panel, 0.35)); disc.addColorStop(0.7, pal.panel); disc.addColorStop(1, shade(pal.panel, -0.45));
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.3); ctx.fillStyle = disc; ctx.fill();
    // metal ring
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.97, 0, 6.3);
    ctx.lineWidth = R * 0.075; ctx.strokeStyle = vgrad(ctx, cy - R, cy + R, [[0, shade(pal.accent, 0.5)], [0.5, pal.accent], [1, shade(pal.accent, -0.45)]]); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.86, 0, 6.3); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.stroke();
    // dotted band
    ctx.fillStyle = rgba(pal.accent, 0.85);
    for (let i = 0; i < n * 3; i++) { const a = (i / (n * 3)) * 6.2832 + spin * 0.5; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R * 0.78, cy + Math.sin(a) * R * 0.78, Math.max(1.5, R * 0.016), 0, 6.3); ctx.fill(); }
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(spin);
    if (variant === 0) {          // rosette
      for (let layer = 0; layer < 2; layer++) {
        const pr = R * (layer ? 0.42 : 0.66), pw = R * (layer ? 0.16 : 0.2);
        for (let i = 0; i < n; i++) {
          ctx.save(); ctx.rotate((i / n) * 6.2832 + (layer ? Math.PI / n : 0));
          const c = cols[(i + layer) % 3];
          ctx.beginPath(); ctx.ellipse(0, -pr * 0.7, pw, pr * 0.42, 0, 0, 6.3);
          ctx.fillStyle = vgrad(ctx, -pr, 0, [[0, shade(c, 0.3)], [1, shade(c, -0.25)]]); ctx.fill();
          ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.stroke();
          ctx.restore();
        }
      }
    } else if (variant === 1) {   // layered star
      for (let layer = 0; layer < 3; layer++) {
        const rad = R * (0.7 - layer * 0.2), c = cols[layer % 3];
        ctx.beginPath();
        for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * 6.2832 + layer * 0.2, rr2 = i % 2 ? rad * 0.55 : rad; ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); }
        ctx.closePath(); ctx.fillStyle = vgrad(ctx, -rad, rad, [[0, shade(c, 0.3)], [1, shade(c, -0.3)]]); ctx.fill();
        ctx.lineJoin = 'round'; ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.stroke();
      }
    } else {                      // lattice of turned squares
      for (let layer = 0; layer < 4; layer++) {
        const half = R * (0.5 - layer * 0.11), c = cols[layer % 3];
        ctx.save(); ctx.rotate(layer % 2 ? Math.PI / 4 : 0);
        rr(ctx, -half, -half, half * 2, half * 2, half * 0.12);
        ctx.fillStyle = vgrad(ctx, -half, half, [[0, shade(c, 0.28)], [1, shade(c, -0.3)]]); ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.stroke(); ctx.restore();
      }
    }
    ctx.restore();
    // boss
    const boss = ctx.createRadialGradient(cx - R * 0.05, cy - R * 0.06, 1, cx, cy, R * 0.16);
    boss.addColorStop(0, shade(pal.accent, 0.7)); boss.addColorStop(1, shade(pal.accent, -0.35));
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.14, 0, 6.3); ctx.fillStyle = boss; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.stroke();
    // gloss over disc
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R * 0.96, 0, 6.3); ctx.clip();
    ctx.beginPath(); ctx.ellipse(cx - R * 0.15, cy - R * 0.62, R * 0.75, R * 0.34, -0.15, 0, 6.3); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill(); ctx.restore();
    if (!reduced) for (let i = 0; i < 3; i++) {
      const ph = (t * 0.5 + i / 3) % 1, a = (seed % 360) * 0.0174 + i * 2.1;
      ui.sparkle(ctx, cx + Math.cos(a) * R * 1.02, cy + Math.sin(a) * R * 1.02, R * 0.09 * Math.sin(ph * Math.PI), { alpha: 0.9, rot: ph });
    }
  };

  // Title screen. rows = [[{id,label,icon,primary}], [...]] laid out as rows of equal-width buttons.
  ui.titleScreen = (ctx, W, H, { title = '', native = '', countries = [], summary = '', best = null, rows = [], hero = null, tagline = '' } = {}) => {
    const ins = frameInsets;
    const land = W > H * 1.1;
    const bh = ui.buttonH(62), gap = 12;
    const colX = land ? W * 0.5 + 10 : 24, colW = land ? W * 0.5 - 40 - ins.right : W - 48;
    const blockH = rows.length * bh + (rows.length - 1) * gap;
    const centerX = colX + colW / 2;
    // measure text block
    const tsz = px(land ? 54 : 62);
    const tl = ui.wrap(ctx, title, colW, ui.fit(ctx, title, colW * (title.length > 18 ? 1.0 : 1), tsz, '800', true), { weight: '800', display: true });
    const titleLines = Math.min(2, tl.length);
    const titleH = titleLines * tsz * 1.08;
    const nativeH = native ? px(40) : 0, ctyH = countries.length ? px(40) : 0;
    const sumLines = summary ? ui.wrap(ctx, summary, colW, px(23)).slice(0, land ? 6 : 4) : [];
    const sumH = sumLines.length * px(31);
    const bestH = best ? px(52) : 0;
    const textH = titleH + nativeH + ctyH + (summary ? px(26) : 0) + sumH + bestH;
    const bottomPad = ins.bottom + 22;
    let heroR = 0, heroCx = W / 2, heroCy = 0, y;
    if (land) {
      heroR = Math.min(W * 0.5 * 0.4, (H - ins.top - bottomPad) * 0.36);
      heroCx = W * 0.25; heroCy = H * 0.48;
      const total = textH + 26 + blockH;
      y = Math.max(ins.top + 14, (H - total) / 2);
    } else {
      const availH = H - ins.top - 24 - textH - 30 - blockH - bottomPad;
      heroR = Math.max(0, Math.min(W * 0.34, availH / 2.15));
      const heroBlock = heroR > 70 ? heroR * 2.15 : 0;
      heroCy = ins.top + 28 + heroR; if (!heroBlock) heroR = 0;
      y = ins.top + 28 + heroBlock + (heroBlock ? 22 : 10);
    }
    if (heroR > 0) {
      if (typeof hero === 'function') hero(ctx, { x: heroCx - heroR, y: heroCy - heroR, w: heroR * 2, h: heroR * 2, cx: heroCx, cy: heroCy, r: heroR });
      else ui.medallion(ctx, heroCx, heroCy, heroR);
    }
    // title block
    ui.title(ctx, title, centerX, y, tsz, { maxW: colW, lines: 2 }); y += titleH;
    if (native) { ui.text(ctx, native, centerX, y + px(18), ui.fit(ctx, native, colW, px(32), '600', true), { display: true, italic: true, weight: '600', color: pal.ink, shadow: true }); y += nativeH; }
    if (countries.length) { ui.text(ctx, countries.slice(0, 3).join('  ·  ').toUpperCase(), centerX, y + px(14), px(17), { color: pal.accent, weight: '700', spacing: 3 }); y += ctyH; }
    if (summary) {
      y += px(6);
      const ow = Math.min(colW * 0.5, 180);
      ctx.strokeStyle = rgba(pal.accent, 0.5); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(centerX - ow / 2, y + 4); ctx.lineTo(centerX - 12, y + 4); ctx.moveTo(centerX + 12, y + 4); ctx.lineTo(centerX + ow / 2, y + 4); ctx.stroke();
      ui.sparkle(ctx, centerX, y + 4, 8, { color: pal.accent }); y += px(20);
      sumLines.forEach((l, i) => { ui.text(ctx, l, centerX, y + px(15) + i * px(31), px(23), { color: pal.ink, weight: '400' }); });
      y += sumH;
    }
    if (best) {
      const label = `Best  ${best.score}`;
      setFont(ctx, px(23), '700'); const tw = ctx.measureText(label).width + (best.stars ? px(23) * 3.4 : 0) + 36, bwid = Math.min(colW, tw);
      ui.panel(ctx, centerX - bwid / 2, y + 4, bwid, px(42), { r: px(21), fill: shade(pal.panel, -0.12), border: rgba(pal.accent, 0.5), shadow: false });
      ui.text(ctx, label, centerX - (best.stars ? px(23) * 1.5 : 0), y + 4 + px(21) + 1, px(23), { color: pal.accent, weight: '700' });
      if (best.stars) for (let i = 0; i < 3; i++) ui.star(ctx, centerX + bwid / 2 - px(23) * (3.0 - i * 0.95) - 6, y + 4 + px(21), px(23), { filled: i < best.stars });
    }
    // buttons anchored to the bottom (portrait) or under the text (landscape)
    let by = land ? y + px(26) : H - bottomPad - blockH;
    for (const row of rows) {
      const n = row.length, bw = (colW - gap * (n - 1)) / n;
      row.forEach((b, i) => ui.button(ctx, b.id, b.label, colX + i * (bw + gap), by, bw, bh, { primary: b.primary, icon: b.icon, off: b.off, size: Math.min(px(b.primary ? 30 : 24), bh * 0.42) }));
      by += bh + gap;
    }
    if (tagline) ui.text(ctx, tagline, centerX, H - ins.bottom - 8, px(15), { color: pal.dim });
  };

  // ---- rules / how-to page: a printed card ---------------------------------------------------------------------------------
  // sections: [{ h: 'How to play', steps: ['..'] }, { h: 'Rules', bullets: [..] }, { h: 'About', para: '..' }]
  // returns { maxScroll, view } and registers up/down/back buttons
  ui.rulesCard = (ctx, W, H, { title = '', sections = [], scroll = 0, backId = 'back' } = {}) => {
    const ins = frameInsets;
    const bh = ui.buttonH(54);
    const topY = ins.top + px(14), footTop = H - ins.bottom - bh - 22;
    ui.text(ctx, title, W / 2, topY + px(22), ui.fit(ctx, title, W - 40 - ins.back * 2, px(32), '800', true), { display: true, color: pal.ink, shadow: true });
    const cardX = 16 + ins.left, cardW = W - 32 - ins.left - ins.right, cardY = topY + px(52), cardH = Math.max(120, footTop - cardY - 12);
    const paper = '#f3e8cf', ink = '#2a2118', mute = '#6b5a45';
    // card
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
    rr(ctx, cardX, cardY, cardW, cardH, 22); ctx.fillStyle = paper; ctx.fill();
    ctx.restore();
    rr(ctx, cardX, cardY, cardW, cardH, 22); ctx.fillStyle = vgrad(ctx, cardY, cardY + cardH, [[0, '#fbf3df'], [1, '#e8d9b8']]); ctx.fill();
    ctx.save(); rr(ctx, cardX, cardY, cardW, cardH, 22); ctx.clip(); ui.texture(ctx, cardX, cardY, cardW, cardH, { kind: 'paper', alpha: 0.12, dark: '#7a5f33', light: '#7a5f33' }); ctx.restore();
    rr(ctx, cardX + 8, cardY + 8, cardW - 16, cardH - 16, 15); ctx.strokeStyle = rgba(pal.accent === '#f2c14e' ? '#a9792a' : shade(pal.accent, -0.35), 0.7); ctx.lineWidth = 2; ctx.stroke();
    // content
    const pad = 26, tx = cardX + pad + 8, tw = cardW - pad * 2 - 16, size = px(24), lh = size * 1.42;
    const innerTop = cardY + 20, innerBot = cardY + cardH - 20, viewH = innerBot - innerTop;
    // measure
    const items = [];
    let hgt = 0;
    for (const sec of sections) {
      if (!sec) continue;
      if (sec.h) { items.push({ k: 'h', t: sec.h, y: hgt }); hgt += px(46); }
      (sec.steps ?? []).forEach((s, i) => { const ls = ui.wrap(ctx, s, tw - px(52), size); items.push({ k: 'step', n: i + 1, ls, y: hgt }); hgt += Math.max(ls.length * lh, px(40)) + px(10); });
      (sec.bullets ?? []).forEach((s) => { const ls = ui.wrap(ctx, s, tw - px(30), size); items.push({ k: 'bul', ls, y: hgt }); hgt += ls.length * lh + px(8); });
      if (sec.para) { const ls = ui.wrap(ctx, sec.para, tw, size, { italic: sec.italic === true }); items.push({ k: 'para', ls, y: hgt, italic: sec.italic === true }); hgt += ls.length * lh + px(8); }
      hgt += px(16);
    }
    const maxScroll = Math.max(0, hgt - viewH);
    scroll = clamp(scroll, 0, maxScroll);
    ctx.save(); ctx.beginPath(); ctx.rect(cardX + 6, innerTop, cardW - 12, viewH); ctx.clip();
    const accentDeep = shade(pal.accent, -0.1), numFg = onColor(accentDeep);
    for (const it of items) {
      const y = innerTop + it.y - scroll;
      if (y > innerBot + 40 || y < innerTop - 400) continue;
      if (it.k === 'h') {
        setFont(ctx, size * 1.2, '800', true); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = ink;
        ctx.fillText(it.t, tx, y + px(18));
        const w2 = ctx.measureText(it.t).width;
        ctx.fillStyle = shade(pal.accent, -0.25); ctx.fillRect(tx, y + px(36), Math.min(w2, tw), 3);
      } else if (it.k === 'step') {
        const r = px(18), cy = y + r + 2;
        ctx.beginPath(); ctx.arc(tx + r, cy, r, 0, 6.3); ctx.fillStyle = vgrad(ctx, cy - r, cy + r, [[0, shade(accentDeep, 0.25)], [1, shade(accentDeep, -0.25)]]); ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.stroke();
        ui.text(ctx, it.n, tx + r, cy + 1, r * 1.15, { color: numFg, weight: '800', display: true });
        setFont(ctx, size, '400'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = ink;
        it.ls.forEach((l, i) => ctx.fillText(l, tx + px(52), y + lh / 2 + i * lh));
      } else if (it.k === 'bul') {
        ctx.beginPath(); ctx.arc(tx + 7, y + lh / 2, 4, 0, 6.3); ctx.fillStyle = shade(pal.accent, -0.2); ctx.fill();
        setFont(ctx, size, '400'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = ink;
        it.ls.forEach((l, i) => ctx.fillText(l, tx + px(30), y + lh / 2 + i * lh));
      } else {
        setFont(ctx, size, '400', false, it.italic); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = it.italic ? mute : ink;
        it.ls.forEach((l, i) => ctx.fillText(l, tx, y + lh / 2 + i * lh));
      }
    }
    ctx.restore();
    if (maxScroll > 0) {   // paper fades + scroll thumb
      ctx.save(); rr(ctx, cardX, cardY, cardW, cardH, 22); ctx.clip();
      if (scroll > 4) { ctx.fillStyle = vgrad(ctx, innerTop, innerTop + 30, [[0, 'rgba(243,232,207,0.95)'], [1, 'rgba(243,232,207,0)']]); ctx.fillRect(cardX, innerTop, cardW, 30); }
      if (scroll < maxScroll - 4) { ctx.fillStyle = vgrad(ctx, innerBot - 36, innerBot, [[0, 'rgba(232,217,184,0)'], [1, 'rgba(232,217,184,0.97)']]); ctx.fillRect(cardX, innerBot - 36, cardW, 36); }
      ctx.restore();
      const th = Math.max(36, viewH * (viewH / hgt)), tyy = innerTop + (viewH - th) * (scroll / maxScroll);
      rr(ctx, cardX + cardW - 12, tyy, 5, th, 3); ctx.fillStyle = 'rgba(80,60,30,0.45)'; ctx.fill();
    }
    // footer buttons
    const gap = 12, bw1 = Math.min(220, cardW * 0.4), sm = bh;
    ui.button(ctx, backId, 'Back', cardX, footTop, bw1, bh, { primary: true, icon: 'left' });
    ui.button(ctx, 'down', '', cardX + cardW - sm, footTop, sm, bh, { icon: 'down', off: scroll >= maxScroll });
    ui.button(ctx, 'up', '', cardX + cardW - sm * 2 - gap, footTop, sm, bh, { icon: 'up', off: scroll <= 0 });
    return { maxScroll, scroll };
  };

  // ---- result card -------------------------------------------------------------------------------------------------------------
  // Result sequence time `rt` (seconds since the round ended). ui.resultTick fires sounds and bursts exactly once per beat.
  const STAR_AT = (i) => 0.55 + i * 0.38;
  ui.resultTick = (prev, now, { stars = 0, win = true, newBest = false } = {}) => {
    const W = meta.width, H = meta.height, cx = W / 2, cy = H * 0.42;
    const cross = (a) => prev < a && now >= a;
    if (cross(0.05)) (win ? ui.sfx.win : ui.sfx.lose)();
    for (let i = 0; i < 3; i++) if (i < stars && cross(STAR_AT(i))) {
      ui.sfx.star(i);
      ui.burst(cx + (i - 1) * Math.min(W * 0.2, 130), cy - H * 0.04, { n: 14, size: 11, speed: 300 });
    }
    if (win && cross(STAR_AT(Math.max(0, stars - 1)) + 0.45)) ui.burst(cx, cy - H * 0.08, { n: 30, kind: 'confetti', size: 14, speed: 520, colors: [pal.accent, pal.a ?? '#d64b3c', pal.b ?? '#2d7bd6', pal.good ?? '#58c27d', '#ffffff'] });
    if (newBest && cross(1.6)) ui.sfx.good();
  };
  // opts: { rt, headline, stars (null = no stars, show a medal), score, max, detail, best, newBest, note, buttons:[{id,label,primary,icon}] }
  ui.resultCard = (ctx, W, H, o) => {
    const { rt = 9, headline = 'Well done', stars = null, score = null, max = null, detail = '', best = null, newBest = false, note = '', buttons = [] } = o;
    const ins = frameInsets;
    const appear = reduced ? 1 : easeOut(rt / 0.3);
    ctx.fillStyle = `rgba(6,10,16,${0.62 * appear})`; ctx.fillRect(0, 0, W, H);
    const cardW = Math.min(W - 40, 600);
    const tsz = ui.fit(ctx, headline, cardW - 48, px(44), '800', true);
    const detLines = detail ? ui.wrap(ctx, detail, cardW - 56, px(22)).slice(0, 3) : [];
    const noteLines = note ? ui.wrap(ctx, note, cardW - 64, px(19), { italic: true }).slice(0, 3) : [];
    const bh = ui.buttonH(58);
    const medalH = px(110);
    const hCard = px(26) + tsz * 1.3 + medalH + (score !== null ? px(50) : 0) + detLines.length * px(30) + (best ? px(40) : 0) + (noteLines.length ? noteLines.length * px(25) + px(24) : 0) + bh + px(36);
    const x = (W - cardW) / 2;
    const yMax = H - ins.bottom - hCard - 20;
    const y = Math.max(ins.top + 10, Math.min((H - hCard) / 2 - H * 0.02, yMax));
    const sc = reduced ? 1 : 0.9 + 0.1 * easeOutBack(rt / 0.35);
    ctx.save(); ctx.globalAlpha = appear; ctx.translate(W / 2, y + hCard / 2); ctx.scale(sc, sc); ctx.translate(-W / 2, -(y + hCard / 2));
    ui.panel(ctx, x, y, cardW, hCard, { r: 30, fill: shade(pal.panel, -0.05), border: rgba(pal.accent, 0.8), gloss: true });
    let yy = y + px(22);
    ui.text(ctx, headline, W / 2, yy + tsz * 0.65, tsz, { display: true, color: pal.accent, shadow: true }); yy += tsz * 1.3;
    // stars or medal
    const sz = Math.min(px(86), cardW / 4.2), my = yy + medalH / 2;
    if (stars !== null) {
      for (let i = 0; i < 3; i++) {
        const sx = W / 2 + (i - 1) * sz * 1.15, tt = rt - STAR_AT(i), earned = i < stars;
        const mid = i === 1 ? -sz * 0.12 : 0;
        if (earned) {
          if (tt < 0) ui.star(ctx, sx, my + mid, sz, { filled: false, scale: 0.85 });
          else { const s2 = reduced ? 1 : easeOutBack(tt / 0.45); ui.star(ctx, sx, my + mid, sz, { filled: true, scale: 0.4 + 0.6 * s2 * (1 + 0.15 * Math.max(0, 1 - tt * 3)), rot: (1 - clamp(tt / 0.45)) * 0.8 }); if (tt < 0.5 && !reduced) ui.sparkle(ctx, sx + sz * 0.3, my + mid - sz * 0.3, sz * 0.32 * Math.sin(clamp(tt * 2) * Math.PI), { rot: tt * 5 }); }
        } else ui.star(ctx, sx, my + mid, sz, { filled: false, scale: 0.85 });
      }
    } else {
      const R = medalH * 0.4, sp = reduced ? 0 : Math.sin(rt * 2) * 0.05;
      ctx.beginPath(); ctx.arc(W / 2, my, R, 0, 6.3); ctx.fillStyle = vgrad(ctx, my - R, my + R, [[0, shade(pal.accent, 0.5)], [0.55, pal.accent], [1, shade(pal.accent, -0.4)]]); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = shade(pal.accent, -0.55); ctx.stroke();
      ui.star(ctx, W / 2, my, R * 1.15, { filled: true, rot: sp });
    }
    yy += medalH;
    if (score !== null) {
      const v = reduced ? score : Math.round(score * easeOut((rt - 0.2) / 0.9));
      ui.text(ctx, max ? `${v}  /  ${max}` : String(v), W / 2, yy + px(22), px(40), { display: true, color: pal.ink, shadow: true }); yy += px(50);
    }
    detLines.forEach((l, i) => ui.text(ctx, l, W / 2, yy + px(15) + i * px(30), px(22), { color: pal.dim, weight: '500' })); yy += detLines.length * px(30);
    if (best) {
      const txt = newBest ? 'New best!' : `Best  ${best.score}`;
      setFont(ctx, px(21), '700'); const pw = ctx.measureText(txt).width + 36;
      ui.panel(ctx, W / 2 - pw / 2, yy + px(4), pw, px(34), { r: px(17), fill: newBest ? shade(pal.accent, -0.35) : shade(pal.panel, -0.15), border: rgba(pal.accent, 0.6), shadow: false });
      ui.text(ctx, txt, W / 2, yy + px(21), px(21), { color: newBest ? '#fff' : pal.accent, weight: '700' });
      if (newBest && !reduced) ui.sparkle(ctx, W / 2 + pw / 2 - 4, yy + px(6), px(11) * (0.7 + 0.3 * Math.sin(rt * 6)), { rot: rt * 2 });
      yy += px(40);
    }
    if (noteLines.length) {
      yy += px(8);
      ctx.strokeStyle = rgba(pal.accent, 0.4); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(W / 2 - 60, yy); ctx.lineTo(W / 2 + 60, yy); ctx.stroke();
      noteLines.forEach((l, i) => ui.text(ctx, l, W / 2, yy + px(16) + i * px(25), px(19), { color: pal.dim, italic: true, weight: '400' })); yy += noteLines.length * px(25) + px(16);
    }
    const n = buttons.length, gap = 12, bwid = (cardW - 48 - gap * (n - 1)) / n, by = y + hCard - bh - px(20);
    buttons.forEach((b, i) => ui.button(ctx, b.id, b.label, x + 24 + i * (bwid + gap), by, bwid, bh, { primary: b.primary, icon: b.icon, size: Math.min(px(26), bh * 0.42) }));
    ctx.restore();
    ui.particles(ctx);
  };

  return ui;
}

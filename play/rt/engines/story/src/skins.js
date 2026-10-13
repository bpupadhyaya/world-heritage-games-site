// Interface skins for the story engine: every theatre gets its own dialogue card, name plate, choice plaque,
// meter beads, scene transition and sound palette. A skin is plain data (colours, shape names, pattern names).
import { mix, dark, light, alpha, vgrad, hgrad, rrPath, poly } from './figures.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---- ornament patterns (drawn inside a clipped rect) -----------------------------------------------------------
export function pattern(ctx, kind, x, y, w, h, col, a = 0.25) {
  if (!kind || kind === 'none') return;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.strokeStyle = alpha(col, a); ctx.fillStyle = alpha(col, a); ctx.lineWidth = 1.2;
  const u = Math.max(10, Math.min(w, h) * 0.34);
  if (kind === 'parang') { // batik diagonal S-bands
    ctx.beginPath();
    for (let k = -h; k < w + h; k += u * 0.9) { ctx.moveTo(x + k, y); for (let i = 1; i <= 6; i++) ctx.quadraticCurveTo(x + k + (i % 2 ? 1 : -1) * u * 0.35 + (i - 0.5) * h / 6, y + (i - 0.5) * h / 6, x + k + i * h / 6, y + i * h / 6); }
    ctx.stroke();
  } else if (kind === 'tile') { // tulip-and-star tile row
    const n = Math.max(3, Math.round(w / u));
    for (let i = 0; i < n; i++) {
      const cx = x + (i + 0.5) * w / n, cy = y + h / 2, r = Math.min(h * 0.4, w / n * 0.4);
      ctx.beginPath(); ctx.moveTo(cx - r, cy - r * 0.7); ctx.quadraticCurveTo(cx - r, cy + r * 0.8, cx, cy + r); ctx.quadraticCurveTo(cx + r, cy + r * 0.8, cx + r, cy - r * 0.7); ctx.lineTo(cx + r * 0.45, cy - r * 0.1); ctx.lineTo(cx, cy - r * 0.8); ctx.lineTo(cx - r * 0.45, cy - r * 0.1); ctx.closePath(); ctx.fill();
    }
  } else if (kind === 'mirror') { // mirror-work: rings with a bright centre
    const st = u * 0.7;
    for (let yy = y + st / 2; yy < y + h; yy += st) for (let xx = x + st / 2 + (((yy - y) / st) % 2 ? st / 2 : 0); xx < x + w; xx += st) { ctx.beginPath(); ctx.arc(xx, yy, st * 0.17, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(xx, yy, st * 0.07, 0, TAU); ctx.fill(); }
  } else if (kind === 'scallop') {
    const r = u * 0.3;
    for (let yy = y; yy < y + h + r; yy += r * 0.7) for (let xx = x - r + (((yy - y) / (r * 0.7)) % 2 ? r : 0); xx < x + w + r; xx += r * 2) { ctx.beginPath(); ctx.arc(xx, yy, r, Math.PI, TAU); ctx.stroke(); }
  } else if (kind === 'bamboo') { // vertical canes with nodes
    const st = Math.max(7, u * 0.4);
    for (let xx = x + st / 2; xx < x + w; xx += st) { ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx, y + h); ctx.stroke(); }
    for (let xx = x + st / 2; xx < x + w; xx += st) for (let yy = y + ((xx * 7) % 20); yy < y + h; yy += 22) ctx.fillRect(xx - st * 0.5, yy, st, 1.5);
  } else if (kind === 'zig') { // appliqué zigzag and pointed arches
    ctx.beginPath(); const st = u * 0.55;
    for (let yy = y + st * 0.5; yy < y + h; yy += st) { ctx.moveTo(x, yy); for (let xx = x; xx < x + w + st; xx += st) ctx.lineTo(xx + st / 2, yy + (((xx - x) / st) % 2 ? st * 0.3 : -st * 0.3)); }
    ctx.stroke();
  } else if (kind === 'arab') { // arabesque curls
    const st = u * 0.9;
    for (let yy = y + st / 2; yy < y + h + st; yy += st) for (let xx = x + st / 2; xx < x + w + st; xx += st) { ctx.beginPath(); ctx.arc(xx, yy, st * 0.28, 0.3, 4.6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(xx + st * 0.28, yy); ctx.quadraticCurveTo(xx + st * 0.5, yy + st * 0.3, xx + st * 0.9, yy); ctx.stroke(); }
  } else if (kind === 'diamond') {
    const st = u * 0.7; ctx.beginPath();
    for (let k = -h; k < w + h; k += st) { ctx.moveTo(x + k, y); ctx.lineTo(x + k + h, y + h); ctx.moveTo(x + k, y + h); ctx.lineTo(x + k + h, y); }
    ctx.stroke();
  } else if (kind === 'wave') { // sand ripples
    ctx.beginPath();
    for (let yy = y + 6; yy < y + h; yy += 9) { ctx.moveTo(x, yy); for (let xx = 0; xx <= w; xx += 12) ctx.lineTo(x + xx, yy + Math.sin(xx * 0.07 + yy) * 2); }
    ctx.stroke();
  } else if (kind === 'dots') {
    for (let yy = y + 6; yy < y + h; yy += 11) for (let xx = x + 6 + (((yy - y) / 11) % 2 ? 5 : 0); xx < x + w; xx += 11) { ctx.beginPath(); ctx.arc(xx, yy, 1.4, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
}

// ---- shape paths ------------------------------------------------------------------------------------------------
export function shapePath(ctx, shape, x, y, w, h, r) {
  r = Math.min(r, h / 2, w / 2);
  if (shape === 'cut') { const c = Math.min(r, h * 0.3); ctx.beginPath(); ctx.moveTo(x + c, y); ctx.lineTo(x + w - c, y); ctx.lineTo(x + w, y + c); ctx.lineTo(x + w, y + h - c); ctx.lineTo(x + w - c, y + h); ctx.lineTo(x + c, y + h); ctx.lineTo(x, y + h - c); ctx.lineTo(x, y + c); ctx.closePath(); return; }
  if (shape === 'ogee') { // pointed cusp on top and bottom edge, like a manuscript cartouche tab
    const m = x + w / 2, c = Math.min(h * 0.22, 14);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(m - c * 1.8, y); ctx.quadraticCurveTo(m - c * 0.5, y, m, y - c * 0.6); ctx.quadraticCurveTo(m + c * 0.5, y, m + c * 1.8, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(m + c * 1.8, y + h); ctx.quadraticCurveTo(m + c * 0.5, y + h, m, y + h + c * 0.6); ctx.quadraticCurveTo(m - c * 0.5, y + h, m - c * 1.8, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); return;
  }
  if (shape === 'scroll') { // rolled ends
    const e = Math.min(w * 0.04, 12); rrPath(ctx, x + e, y, w - e * 2, h, 4); ctx.rect(x, y - 2, e * 1.2, h + 4); ctx.rect(x + w - e * 1.2, y - 2, e * 1.2, h + 4); return;
  }
  if (shape === 'arch') { // gently arched top, flat bottom
    ctx.beginPath(); ctx.moveTo(x, y + h - r); ctx.lineTo(x, y + r * 1.5); ctx.quadraticCurveTo(x, y, x + w / 2, y - r * 0.5); ctx.quadraticCurveTo(x + w, y, x + w, y + r * 1.5); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.closePath(); return;
  }
  rrPath(ctx, x, y, w, h, r);
}

// ---- skin defaults -----------------------------------------------------------------------------------------------
export function resolveSkin(raw, pal) {
  const s = raw ?? {};
  const card = { top: light(pal.panel, 0.1), bot: dark(pal.panel, 0.25), edge: alpha(pal.accent, 0.5), inner: 'rgba(255,255,255,0.07)', ink: pal.ink, dim: pal.dim ?? pal.ink, accent: pal.accent, shape: 'round', r: 16, pattern: 'none', patCol: '#ffffff', patA: 0.08, ...(s.card ?? {}) };
  const name = { fill: mix('#7a3a18', pal.accent, 0.25), fillEnd: dark(pal.accent, 0.1), ink: '#fff1c8', edge: 'rgba(255,230,160,0.5)', shape: 'round', ...(s.name ?? {}) };
  const plaque = { base: mix(pal.panel, '#5a1c14', 0.3), hot: mix(pal.panel, pal.accent, 0.38), end: mix(pal.accent, '#8a5208', 0.15), ink: '#fff6e0', inkEnd: '#1b1206', edge: 'rgba(0,0,0,0.6)', inner: 'rgba(240,200,120,0.4)', shape: 'round', r: 18, pattern: 'none', patCol: '#ffffff', patA: 0.08, med: 'disc', medA: '#fff0b8', medB: '#c48a1e', medInk: '#3a2204', medEdge: '#6a4208', ...(s.plaque ?? {}) };
  const meter = { fill: mix(pal.panel, '#000000', 0.15), edge: 'rgba(255,255,255,0.08)', bead: 'disc', col: pal.accent, ink: pal.ink, ...(s.meter ?? {}) };
  return { card, name, plaque, meter, trans: s.trans ?? 'fade', transCol: s.transCol ?? '#06030a', snd: s.snd ?? {}, voice: s.voice ?? null, font: s.font ?? null };
}

// ---- drawing -----------------------------------------------------------------------------------------------------
export function drawCard(ctx, sk, x, y, w, h, t = 0) {
  const c = sk.card;
  ctx.save();
  shapePath(ctx, c.shape, x + 1, y + 3, w, h, c.r); ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fill();
  shapePath(ctx, c.shape, x, y, w, h, c.r); ctx.fillStyle = vgrad(ctx, y, y + h, [[0, c.top], [1, c.bot]]); ctx.fill();
  ctx.save(); shapePath(ctx, c.shape, x, y, w, h, c.r); ctx.clip();
  pattern(ctx, c.pattern, x, y, w, h, c.patCol, c.patA);
  if (c.band) { // a coloured band along the top and bottom edge
    ctx.fillStyle = vgrad(ctx, y, y + c.band, [[0, c.bandCol], [1, dark(c.bandCol, 0.3)]]); ctx.fillRect(x, y, w, c.band);
    ctx.fillStyle = vgrad(ctx, y + h - c.band, y + h, [[0, dark(c.bandCol, 0.3)], [1, c.bandCol]]); ctx.fillRect(x, y + h - c.band, w, c.band);
    pattern(ctx, c.bandPat, x, y, w, c.band, '#ffffff', 0.35); pattern(ctx, c.bandPat, x, y + h - c.band, w, c.band, '#ffffff', 0.35);
  }
  ctx.fillStyle = vgrad(ctx, y, y + h * 0.4, [[0, 'rgba(255,255,255,0.1)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(x, y, w, h * 0.4);
  ctx.restore();
  shapePath(ctx, c.shape, x + 0.75, y + 0.75, w - 1.5, h - 1.5, c.r); ctx.strokeStyle = c.edge; ctx.lineWidth = 1.8; ctx.stroke();
  shapePath(ctx, c.shape === 'ogee' || c.shape === 'arch' ? 'round' : c.shape, x + 4.5, y + 4.5, w - 9, h - 9, Math.max(3, c.r - 4)); ctx.strokeStyle = c.inner; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
}

export function drawNamePlate(ctx, sk, x, y, w, h, ending) {
  const n = sk.name, col = ending ? n.fillEnd : n.fill;
  ctx.save();
  shapePath(ctx, n.shape === 'round' ? 'round' : n.shape, x + 1, y + 2, w, h, h / 2); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
  shapePath(ctx, n.shape === 'round' ? 'round' : n.shape, x, y, w, h, h / 2);
  ctx.fillStyle = vgrad(ctx, y, y + h, [[0, light(col, 0.16)], [0.5, col], [1, dark(col, 0.35)]]); ctx.fill();
  ctx.strokeStyle = n.edge; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
}

export function drawPlaque(ctx, sk, x, y, w, h, st) {
  const p = sk.plaque;
  const base = st.end ? p.end : st.hot ? p.hot : p.base;
  const o = st.pressed ? 2 : 0;
  ctx.save();
  shapePath(ctx, p.shape, x + 1, y + (st.pressed ? 1 : 3), w, h, p.r); ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fill();
  shapePath(ctx, p.shape, x, y + o, w, h, p.r);
  ctx.fillStyle = vgrad(ctx, y, y + h, [[0, light(base, st.hot ? 0.28 : 0.14)], [0.5, base], [1, dark(base, 0.38)]]); ctx.fill();
  ctx.save(); ctx.clip();
  pattern(ctx, p.pattern, x, y + o, w, h, p.patCol, p.patA);
  ctx.fillStyle = vgrad(ctx, y, y + h * 0.5, [[0, 'rgba(255,255,255,0.22)'], [1, 'rgba(255,255,255,0.02)']]); ctx.fillRect(x, y + o, w, h * 0.5);
  ctx.restore();
  shapePath(ctx, p.shape, x + 0.75, y + 0.75 + o, w - 1.5, h - 1.5, p.r); ctx.strokeStyle = st.end ? 'rgba(80,40,0,0.8)' : p.edge; ctx.lineWidth = 1.5; ctx.stroke();
  shapePath(ctx, p.shape === 'ogee' || p.shape === 'arch' ? 'round' : p.shape, x + 3, y + 3 + o, w - 6, h - 6, Math.max(2, p.r - 3)); ctx.strokeStyle = st.hot || st.end ? 'rgba(255,240,180,0.7)' : p.inner; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
}

// number medallion on a choice plaque: disc | diamond | flower | seal | star
export function drawMedallion(ctx, sk, cx, cy, r, label, txt, minSize = 0) {
  const p = sk.plaque, k = p.med;
  ctx.save(); ctx.translate(cx, cy);
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r * 1.2); g.addColorStop(0, p.medA); g.addColorStop(1, p.medB);
  ctx.fillStyle = g; ctx.strokeStyle = p.medEdge; ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (k === 'diamond') { ctx.moveTo(0, -r * 1.15); ctx.lineTo(r * 1.1, 0); ctx.lineTo(0, r * 1.15); ctx.lineTo(-r * 1.1, 0); ctx.closePath(); }
  else if (k === 'flower') { for (let i = 0; i < 8; i++) { const a = i * TAU / 8; ctx.moveTo(0, 0); ctx.ellipse(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.5, r * 0.3, a, 0, TAU); } }
  else if (k === 'star') { for (let i = 0; i < 12; i++) { const a = -Math.PI / 2 + i * Math.PI / 6, rr = i % 2 ? r * 0.72 : r * 1.15; i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); }
  else if (k === 'seal') { for (let i = 0; i < 16; i++) { const a = i * TAU / 16, rr = i % 2 ? r * 0.95 : r * 1.12; i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); }
  else ctx.arc(0, 0, r, 0, TAU);
  ctx.fill(); ctx.stroke(); ctx.restore();
  txt(ctx, label, cx, cy, Math.max(r * 1.15, minSize), p.medInk, 'center', '800', 'Georgia, "Times New Roman", serif');
}

// meter bead: disc | diamond | coin | drop | leaf | star | lamp
export function drawBead(ctx, sk, x, y, r, on, t) {
  const m = sk.meter, k = m.bead;
  ctx.save(); ctx.translate(x, y);
  const path = () => {
    ctx.beginPath();
    if (k === 'diamond') { ctx.moveTo(0, -r * 1.2); ctx.lineTo(r, 0); ctx.lineTo(0, r * 1.2); ctx.lineTo(-r, 0); ctx.closePath(); }
    else if (k === 'drop') { ctx.moveTo(0, -r * 1.3); ctx.quadraticCurveTo(r * 1.1, r * 0.2, 0, r * 1); ctx.quadraticCurveTo(-r * 1.1, r * 0.2, 0, -r * 1.3); }
    else if (k === 'leaf') { ctx.moveTo(-r * 1.1, r * 0.5); ctx.quadraticCurveTo(-r * 0.2, -r * 1.3, r * 1.1, -r * 0.6); ctx.quadraticCurveTo(r * 0.3, r * 1.1, -r * 1.1, r * 0.5); }
    else if (k === 'star') { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.5 : r * 1.2; i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); }
    else if (k === 'lamp') { ctx.ellipse(0, 0, r * 0.85, r * 1.15, 0, 0, TAU); }
    else ctx.arc(0, 0, r, 0, TAU);
  };
  if (on) {
    const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.4); gg.addColorStop(0, alpha(m.col, 0.42)); gg.addColorStop(1, alpha(m.col, 0));
    ctx.fillStyle = gg; ctx.fillRect(-r * 2.4, -r * 2.4, r * 4.8, r * 4.8);
    path(); const bg = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r * 1.2); bg.addColorStop(0, light(m.col, 0.6)); bg.addColorStop(1, dark(m.col, 0.18)); ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = dark(m.col, 0.5); ctx.lineWidth = 1; ctx.stroke();
    if (k === 'coin') { ctx.strokeStyle = dark(m.col, 0.45); ctx.strokeRect(-r * 0.3, -r * 0.3, r * 0.6, r * 0.6); }
  } else { path(); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill(); }
  ctx.restore();
}

// ---- scene transitions: k runs 1 -> 0 -----------------------------------------------------------------------------
export function drawTransition(ctx, R, kind, k, col, t) {
  k = clamp(k, 0, 1);
  if (k <= 0.01) return;
  const e = k * k * (3 - 2 * k);
  const cx = R.x + R.w / 2, cy = R.y + R.h / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip();
  if (kind === 'curtainH') { // two curtains meet in the middle
    const w = R.w / 2 * e;
    for (const [x0, dir] of [[R.x, 1], [R.x + R.w, -1]]) {
      ctx.fillStyle = hgrad(ctx, x0, x0 + dir * w, [[0, dark(col, 0.3)], [0.5, light(col, 0.1)], [1, dark(col, 0.45)]]);
      ctx.fillRect(Math.min(x0, x0 + dir * w), R.y, w, R.h);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 1; i < 6; i++) { const xx = x0 + dir * w * i / 6; ctx.moveTo(xx, R.y); ctx.lineTo(xx, R.y + R.h); } ctx.stroke();
    }
  } else if (kind === 'curtainV') { // a cloth drops from the top with a scalloped hem
    const h = R.h * e;
    ctx.fillStyle = vgrad(ctx, R.y, R.y + h, [[0, light(col, 0.1)], [1, dark(col, 0.4)]]); ctx.fillRect(R.x, R.y, R.w, h);
    ctx.beginPath(); const n = 7; for (let i = 0; i < n; i++) { const x0 = R.x + R.w * i / n; ctx.moveTo(x0, R.y + h); ctx.quadraticCurveTo(x0 + R.w / n / 2, R.y + h + R.h * 0.05 * e, x0 + R.w / n, R.y + h); } ctx.fillStyle = dark(col, 0.3); ctx.fill();
  } else if (kind === 'kayon') { // the leaf-shaped tree of life sweeps across the screen
    const s = R.h * (0.15 + 1.5 * e);
    ctx.fillStyle = alpha(col, 0.9 * Math.min(1, e * 2));
    ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.62); ctx.bezierCurveTo(cx + s * 0.5, cy - s * 0.3, cx + s * 0.42, cy + s * 0.25, cx + s * 0.18, cy + s * 0.6); ctx.lineTo(cx - s * 0.18, cy + s * 0.6); ctx.bezierCurveTo(cx - s * 0.42, cy + s * 0.25, cx - s * 0.5, cy - s * 0.3, cx, cy - s * 0.62); ctx.fill();
  } else if (kind === 'iris') { // a lamp-lit round window closes
    ctx.fillStyle = alpha(col, 0.92); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.arc(cx, cy, Math.hypot(R.w, R.h) / 2 * (1 - e), 0, TAU, true); ctx.fill();
  } else if (kind === 'ripple') { // rings spread over the pond and a mist veil
    ctx.fillStyle = alpha(col, 0.5 * e); ctx.fillRect(R.x, R.y, R.w, R.h);
    ctx.strokeStyle = `rgba(255,255,255,${0.7 * e})`; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(cx, cy, R.w * (0.15 + (1 - e) * 0.5 + i * 0.12), R.h * (0.06 + (1 - e) * 0.2 + i * 0.05), 0, 0, TAU); ctx.stroke(); }
  } else if (kind === 'sand') { // wind-blown streaks of sand
    ctx.fillStyle = alpha(col, 0.55 * e); ctx.fillRect(R.x, R.y, R.w, R.h);
    ctx.strokeStyle = alpha(light(col, 0.4), 0.7 * e); ctx.lineWidth = 2;
    ctx.beginPath(); for (let i = 0; i < 22; i++) { const yy = R.y + R.h * ((i * 0.618) % 1), xx = R.x + ((i * 53 + (1 - e) * 220) % (R.w + 80)) - 40; ctx.moveTo(xx, yy); ctx.lineTo(xx + 40 + (i % 4) * 14, yy - 3); } ctx.stroke();
  } else if (kind === 'page') { // a page edge sweeps from the right
    const xx = R.x + R.w * (1 - e);
    ctx.fillStyle = hgrad(ctx, xx - 30, xx, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.28)']]); ctx.fillRect(xx - 30, R.y, 30, R.h);
    ctx.fillStyle = alpha(col, 0.96); ctx.fillRect(xx, R.y, R.x + R.w - xx, R.h);
    ctx.fillStyle = 'rgba(255,230,160,0.6)'; ctx.fillRect(xx, R.y, 2, R.h);
  } else if (kind === 'cloth') { // a wrapped cloth is drawn across
    const xx = R.x + R.w * e;
    ctx.fillStyle = hgrad(ctx, R.x, xx, [[0, dark(col, 0.1)], [1, light(col, 0.12)]]); ctx.fillRect(R.x, R.y, xx - R.x, R.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i < 5; i++) { const yy = R.y + R.h * (i + 0.5) / 5; ctx.moveTo(R.x, yy); ctx.bezierCurveTo(R.x + (xx - R.x) * 0.4, yy - 8, R.x + (xx - R.x) * 0.7, yy + 8, xx, yy); } ctx.stroke();
  } else {
    ctx.fillStyle = alpha(col, 0.55 * k); ctx.fillRect(R.x, R.y, R.w, R.h);
  }
  ctx.restore();
}

// ---- sound palettes ----------------------------------------------------------------------------------------------
// snd = { root, scale: [ratios], wave, hit: 'gong'|'pluck'|'bell'|'drum'|'buzz'|'plop'|'flute'|'page' }
const HITS = {
  gong: (f, v) => [{ freq: f * 0.5, to: f * 0.49, dur: 0.9, type: 'sine', vol: v * 1.1 }, { freq: f * 1.5, to: f * 1.5, dur: 0.5, type: 'triangle', vol: v * 0.35 }],
  bell: (f, v) => [{ freq: f * 2, to: f * 2, dur: 0.55, type: 'sine', vol: v }, { freq: f * 5.4, to: f * 5.4, dur: 0.2, type: 'sine', vol: v * 0.25 }],
  pluck: (f, v) => [{ freq: f, to: f * 0.99, dur: 0.22, type: 'sawtooth', vol: v * 0.55 }, { freq: f * 2, to: f * 2, dur: 0.1, type: 'triangle', vol: v * 0.3 }],
  drum: (f, v) => [{ freq: f * 0.7, to: f * 0.28, dur: 0.18, type: 'sine', vol: v * 1.2 }, { freq: f * 2.2, to: f, dur: 0.04, type: 'square', vol: v * 0.2 }],
  buzz: (f, v) => [{ freq: f * 1.3, to: f * 1.1, dur: 0.16, type: 'sawtooth', vol: v * 0.45 }, { freq: f * 1.31, to: f * 1.5, dur: 0.12, type: 'square', vol: v * 0.2 }],
  plop: (f, v) => [{ freq: f * 1.6, to: f * 0.7, dur: 0.14, type: 'sine', vol: v * 0.9 }],
  flute: (f, v) => [{ freq: f * 2, to: f * 2.02, dur: 0.38, type: 'sine', vol: v * 0.8 }],
  page: (f, v) => [{ freq: f * 0.9, to: f * 0.6, dur: 0.12, type: 'triangle', vol: v * 0.5 }],
  tabla: (f, v) => [{ freq: f * 0.8, to: f * 0.4, dur: 0.12, type: 'sine', vol: v }, { freq: f * 3, to: f * 2.2, dur: 0.05, type: 'triangle', vol: v * 0.3 }],
};
// Natural voices (platform/engine-kit/synth.js): each HITS entry also names the synth voice that plays it. The raw tone list stays
// as the fallback for hosts without the shared audio graph.
const NATURAL = {
  gong: (f, v) => ({ voice: 'gong', p: { hz: f * 0.5, dur: 1.2, vel: v * 2.6 } }),
  bell: (f, v) => ({ voice: 'bell', p: { hz: f * 2, dur: 0.9, vel: v * 2.2 } }),
  pluck: (f, v, inst) => ({ voice: 'pluck', p: { hz: f, dur: 0.6, vel: v * 2.4, inst } }),
  drum: (f, v) => ({ voice: 'drum', p: { hz: f * 0.4, style: 'tone', vel: v * 2.4 } }),
  buzz: (f, v) => ({ voice: 'reed', p: { hz: f, dur: 0.22, vel: v * 2.4 } }),
  plop: (f, v) => ({ voice: 'drum', p: { hz: f * 0.9, style: 'water', vel: v * 2.2 } }),
  flute: (f, v) => ({ voice: 'breath', p: { hz: f * 2, dur: 0.45, vel: v * 2.4 } }),
  page: (f, v) => ({ fx: 'scrape', p: { hz: 2200, dur: 0.12, vel: v * 3 } }),
  tabla: (f, v) => ({ voice: 'drum', p: { hz: f * 0.8, style: 'dayan', vel: v * 2.4 } }),
};
export function soundSet(snd) {
  const root = snd.root ?? 261, sc = snd.scale ?? [1, 1.125, 1.25, 1.5, 1.67], hitName = HITS[snd.hit] ? snd.hit : 'bell', hit = HITS[hitName];
  const nat = NATURAL[hitName];
  const note = (i) => root * sc[((i % sc.length) + sc.length) % sc.length] * (i >= sc.length ? 2 : 1);
  const mk = (list, at = 0, v = null) => list.map((o, k) => ({ at, o, v: k === 0 ? v : null }));
  const hitAt = (i, vol, at = 0, delay = 0) => { const f = note(i); return mk(hit(f, vol), at, { ...nat(f, vol, snd.inst), p: { ...nat(f, vol, snd.inst).p, delay } }); };
  return {
    scene: (n) => hitAt(n % 5, 0.22),
    good: (pts) => [...hitAt(0, 0.3, 0), ...hitAt(2, 0.28, 0.09), ...hitAt(4, 0.3, 0.18), ...(pts > 1 ? hitAt(5, 0.3, 0.27) : [])],
    bad: () => mk([{ freq: root * 0.62, to: root * 0.48, dur: 0.26, type: snd.hit === 'buzz' ? 'sawtooth' : 'triangle', vol: 0.26 }], 0, { fx: 'bad', p: { hz: root * 0.62, vel: 0.8 } }),
    neutral: () => hitAt(1, 0.18),
    star: (i) => hitAt(2 + i * 2, 0.34),
    // puppet speech: one vowel blip per revealed step (a murmur bed every few steps), pitched by the figure's skin
    voice: (i) => {
      const f0 = root * 0.72 * (1 + ((i * 7) % 5) * 0.09) * (snd.voiceLow ? 0.5 : 1);
      return mk([{ freq: root * (1 + ((i * 7) % 5) * 0.09) * (snd.voiceLow ? 0.5 : 1), to: root * 0.95, dur: 0.045, type: snd.voiceWave ?? 'triangle', vol: snd.voiceVol ?? 0.035 }], 0,
        i % 4 === 3 ? { fx: 'murmur', p: { hz: f0 * 2.4, dur: 0.35, vel: 0.5 } } : { fx: 'blip', p: { hz: f0, vowel: i, dur: 0.08, vel: 0.55 } });
    },
  };
}

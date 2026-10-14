// Procedural art for the rhythm engine: instruments drawn with form (wood grain, string sheen, drum skin, bamboo, bronze, floor boards).
// Pure drawing: no DOM, no randomness, no clocks (time arrives as an argument). Everything is a function of (ctx, geometry, style, state).

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const TAU = Math.PI * 2;

// ---- colour ---------------------------------------------------------------------------------------------------------
const rgbOf = (c) => {
  if (typeof c !== 'string' || c[0] !== '#' || c.length < 7) return [128, 128, 128];
  const n = parseInt(c.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const h2 = (v) => { const s = Math.round(clamp(v, 0, 255)).toString(16); return s.length < 2 ? `0${s}` : s; };
export const mix = (c1, c2, t) => {
  const a = rgbOf(c1), b = rgbOf(c2);
  return `#${h2(a[0] + (b[0] - a[0]) * t)}${h2(a[1] + (b[1] - a[1]) * t)}${h2(a[2] + (b[2] - a[2]) * t)}`;
};
export const rgba = (c, al) => { const v = rgbOf(c); return `rgba(${v[0]},${v[1]},${v[2]},${clamp(al, 0, 1)})`; };
export const lighter = (c, t) => mix(c, '#ffffff', t);
export const darker = (c, t) => mix(c, '#000000', t);
export const hash = (n) => { const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };

// ---- gradient and shape helpers -------------------------------------------------------------------------------------
export const vgrad = (ctx, y0, y1, stops, x = 0) => { const g = ctx.createLinearGradient(x, y0, x, y1); for (const s of stops) g.addColorStop(s[0], s[1]); return g; };
export const hgrad = (ctx, x0, x1, stops, y = 0) => { const g = ctx.createLinearGradient(x0, y, x1, y); for (const s of stops) g.addColorStop(s[0], s[1]); return g; };
export const rgrad = (ctx, x, y, r0, r1, stops, fx = x, fy = y) => { const g = ctx.createRadialGradient(fx, fy, r0, x, y, r1); for (const s of stops) g.addColorStop(s[0], s[1]); return g; };

export function glow(ctx, x, y, r, color, a) {
  if (a <= 0.01 || r <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, a)); g.addColorStop(0.5, rgba(color, a * 0.35)); g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

export function rrect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
export const ell = (ctx, x, y, rx, ry) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); };
export const circ = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); };

export function text(ctx, s, x, y, size, col, o = {}) {
  const { weight = '700', align = 'center', outline = null, lw = 3, family = 'system-ui, -apple-system, "Segoe UI", sans-serif' } = o;
  ctx.font = `${weight} ${Math.round(size)}px ${family}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  if (outline) { ctx.strokeStyle = outline; ctx.lineWidth = lw; ctx.strokeText(String(s), x, y); }
  ctx.fillStyle = col; ctx.fillText(String(s), x, y);
}

// wood grain: n long thin curves
export function grain(ctx, x, y, w, h, col, a, seed, vert = false, n = 10) {
  ctx.save(); ctx.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    const u = (i + 0.2 + hash(seed + i) * 0.6) / n, wob = (hash(seed + i * 7) - 0.5) * 0.07;
    ctx.strokeStyle = rgba(col, a * (0.35 + 0.65 * hash(seed + i * 3)));
    ctx.beginPath();
    if (vert) { const xx = x + u * w, d = wob * w; ctx.moveTo(xx, y); ctx.bezierCurveTo(xx + d, y + h * 0.33, xx - d, y + h * 0.66, xx + d * 0.4, y + h); }
    else { const yy = y + u * h, d = wob * h; ctx.moveTo(x, yy); ctx.bezierCurveTo(x + w * 0.33, yy + d, x + w * 0.66, yy - d, x + w, yy + d * 0.4); }
    ctx.stroke();
  }
  ctx.restore();
}

// ---- instrument styles -------------------------------------------------------------------------------------------------
const BASE = { motif: 'wood', hero: 'drum', wood: '#9c5f2c', pad: 'generic', body: 'round', face: 'wood', hole: 'round', key: 'bars', pipe: '#d8c57a', wrap: '#a3342b', floor: '#6a4a2c', dancer: 'steps', gem: 'bead', rack: '#6a3f1d' };
const BY_LAYOUT = {
  strings: { motif: 'weave', hero: 'lute', gem: 'bead' }, keys: { motif: 'wood', hero: 'bars', gem: 'tile' }, holes: { motif: 'bamboo', hero: 'pipe', gem: 'pearl' },
  steps: { motif: 'floor', hero: 'feet', gem: 'foot' }, circle: { motif: 'bronze', hero: 'gongs', gem: 'bead' }, pads: { motif: 'hide', hero: 'drum', gem: 'disc' },
};
const RULES = [
  [/charango/, { body: 'round', wood: '#c07c3a', motif: 'weave', hole: 'round' }],
  [/balalaika/, { body: 'tri', wood: '#d79c50', motif: 'birch', hole: 'round' }],
  [/ukulele/, { body: 'eight', wood: '#cf8f48', motif: 'palm' }],
  [/kamancha|goje|morin|rabab|rebab|fiddle/, { body: 'round', face: 'skin', hole: 'none', wood: '#7a4521', motif: 'steppe' }],
  [/dan-?bau|kora/, { body: 'gourd', face: 'skin', hole: 'none', wood: '#b58340', motif: 'bamboo' }],
  [/qanun|santur|santoor|dulcimer|zither|kantele|kankles|cimbalom/, { body: 'trap', hole: 'rosettes', wood: '#a05f2e', motif: 'arch' }],
  [/buzuq|oud|panduri|dombra|saz|joropo|lute/, { body: 'pear', wood: '#a85f2b' }],
  [/balafon|timbila|marimba|xylophone|amadinda/, { key: 'bars', wood: '#9a5a26', motif: 'wood' }],
  [/carillon/, { key: 'bells', motif: 'arch', wood: '#5b3d22' }],
  [/mbira|kalimba/, { key: 'tines', wood: '#8e5a2a', motif: 'wood' }],
  [/bandoneon|accordion/, { key: 'buttons', wood: '#2a2420', motif: 'arch' }],
  [/dizi/, { pipe: '#7fb056', wrap: '#b4262a', motif: 'bamboo' }],
  [/bansuri|flute/, { pipe: '#d9a64a', wrap: '#7a3a1c', motif: 'bamboo' }],
  [/mijwiz|clarinet/, { pipe: '#cdb883', wrap: '#2e5f6b', motif: 'bamboo', twin: true }],
  [/tabla/, { pad: 'tabla', wood: '#5a331a' }],
  [/taiko/, { pad: 'taiko', wood: '#7a2a16' }],
  [/bodhran|isukuti|frame/, { pad: 'frame', wood: '#a47845' }],
  [/fufu|mortar/, { pad: 'mortar', wood: '#7c4a22', motif: 'wood' }],
  [/steelpan|pan\b/, { pad: 'pan', motif: 'bronze' }],
  [/calabash|water/, { pad: 'water', wood: '#c79845' }],
  [/djembe|drum/, { pad: 'djembe' }],
  [/cueca/, { floor: '#5d3b25', dancer: 'kerchief' }],
  [/schuhplattler/, { floor: '#6a4a2c', dancer: 'slap' }],
  [/kolo|hopak|dabke|line/, { floor: '#5a4630' }],
  [/kulintang|gamelan|gong/, { motif: 'bronze', wood: '#5b3319' }],
];
export function styleFor(key, layout, timbre) {
  const k = String(key || '').toLowerCase();
  const s = { ...BASE, ...(BY_LAYOUT[layout] ?? {}) };
  for (const [re, o] of RULES) if (re.test(k)) Object.assign(s, o);
  if (layout === 'keys' && timbre === 'bell' && s.key === 'bars' && !/balafon|timbila|marimba|xylophone/.test(k)) s.key = 'bells';
  if (layout === 'keys' && timbre === 'reed' && s.key === 'bars') s.key = 'buttons';
  s.key_id = k;
  return s;
}

// ---- backdrop that breathes with the tempo -----------------------------------------------------------------------------
export function drawBackdrop(ctx, A, S, pal, pulse, slow) {
  const { x, y, w, h } = A, ink = lighter(pal.bg, 0.55);
  ctx.fillStyle = vgrad(ctx, y, y + h, [[0, lighter(pal.bg, 0.1)], [0.5, pal.bg], [1, darker(pal.bg, 0.5)]]);
  ctx.fillRect(x, y, w, h);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.lineWidth = 1; ctx.strokeStyle = rgba(ink, 0.09); ctx.fillStyle = rgba(ink, 0.06);
  switch (S.motif) {
    case 'weave': { // Andean textile: bands of diamonds and zigzags
      for (let r = 0; r < 3; r++) {
        const yy = y + 10 + r * 26; ctx.beginPath();
        for (let xx = x - 12 + (r % 2) * 13; xx < x + w + 14; xx += 26) { ctx.moveTo(xx, yy); ctx.lineTo(xx + 13, yy - 10); ctx.lineTo(xx + 26, yy); ctx.lineTo(xx + 13, yy + 10); ctx.closePath(); }
        ctx.fill();
      }
      ctx.beginPath(); for (let xx = x; xx < x + w + 20; xx += 20) { ctx.lineTo(xx, y + 92 + ((xx / 20) % 2 ? 6 : 0)); } ctx.stroke();
      break;
    }
    case 'bamboo': {
      for (let xx = x + 24; xx < x + w; xx += 62) {
        const sw = 10 + hash(xx) * 6;
        ctx.fillStyle = rgba(ink, 0.04); ctx.fillRect(xx - sw / 2, y, sw, h);
        ctx.strokeStyle = rgba(ink, 0.11);
        for (let yy = y + hash(xx * 3) * 80; yy < y + h; yy += 92 + hash(xx + yy) * 30) { ctx.beginPath(); ctx.moveTo(xx - sw / 2 - 2, yy); ctx.lineTo(xx + sw / 2 + 2, yy); ctx.stroke(); }
      }
      break;
    }
    case 'wood': case 'birch': {
      for (let yy = y + 20; yy < y + h; yy += 36) { ctx.strokeStyle = rgba(ink, 0.05 + 0.05 * hash(yy)); ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); }
      for (let k = 0; k < 6; k++) { const kx = x + hash(k + 3) * w, ky = y + hash(k + 9) * h; ell(ctx, kx, ky, 14, 7); ctx.strokeStyle = rgba(ink, 0.07); ctx.stroke(); ell(ctx, kx, ky, 7, 3.5); ctx.stroke(); }
      break;
    }
    case 'arch': { // tower arcade
      const aw = Math.max(90, w / 5);
      for (let xx = x; xx < x + w; xx += aw) { ctx.beginPath(); ctx.moveTo(xx + 8, y + h * 0.55); ctx.lineTo(xx + 8, y + h * 0.22); ctx.arc(xx + aw / 2, y + h * 0.22, aw / 2 - 8, Math.PI, 0); ctx.lineTo(xx + aw - 8, y + h * 0.55); ctx.stroke(); }
      break;
    }
    case 'floor': { // floor boards receding to a horizon
      const cx = x + w / 2, hy = y + h * 0.08;
      for (let k = -8; k <= 8; k++) { ctx.beginPath(); ctx.moveTo(cx + k * 12, hy); ctx.lineTo(cx + k * w * 0.2, y + h); ctx.stroke(); }
      for (let k = 1; k < 9; k++) { const yy = hy + (y + h - hy) * (k / 9) ** 1.7; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); }
      break;
    }
    case 'hide': {
      for (let k = 0; k < 70; k++) { const px = x + hash(k) * w, py = y + hash(k + 50) * h; circ(ctx, px, py, 1 + hash(k + 9) * 2.5); ctx.fillStyle = rgba(ink, 0.05 + 0.04 * hash(k + 4)); ctx.fill(); }
      break;
    }
    case 'bronze': {
      const cx = x + w / 2, cy = y + h * 0.55;
      for (let r = 40; r < w; r += 46) { circ(ctx, cx, cy, r); ctx.strokeStyle = rgba(ink, 0.06); ctx.stroke(); }
      break;
    }
    case 'steppe': { // felt-rug lozenges and rams' horn scrolls
      for (let xx = x + 30; xx < x + w; xx += 60) for (let yy = y + 30; yy < y + h * 0.6; yy += 60) { ctx.beginPath(); ctx.arc(xx, yy, 14, Math.PI * 0.2, Math.PI * 1.6); ctx.stroke(); }
      break;
    }
    default: { // palm
      for (let k = 0; k < 7; k++) { const px = x + w * (k / 6); ctx.beginPath(); ctx.moveTo(px, y); ctx.quadraticCurveTo(px + 40, y + h * 0.25, px + 10, y + h * 0.5); ctx.stroke(); }
    }
  }
  ctx.restore();
  // stage light that swells on each beat
  glow(ctx, x + w / 2, y + h * 0.66, Math.max(w, h) * (0.55 + 0.06 * slow), pal.accent, 0.05 + 0.1 * pulse);
  // vignette
  ctx.fillStyle = rgrad(ctx, x + w / 2, y + h / 2, Math.min(w, h) * 0.35, Math.max(w, h) * 0.78, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.5)']]);
  ctx.fillRect(x, y, w, h);
}

// ---- footprints and gestures for dance lanes ----------------------------------------------------------------------------
export function footprint(ctx, cx, cy, s, left, fill, edge, alpha = 1) {
  ctx.save(); ctx.translate(cx, cy + 0.05 * s); ctx.scale(left ? s : -s, s); ctx.globalAlpha = alpha;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(0.38, -0.45); ctx.bezierCurveTo(0.42, -0.95, -0.3, -1.0, -0.4, -0.5);
  ctx.bezierCurveTo(-0.46, -0.1, -0.32, 0.4, -0.3, 0.7); ctx.bezierCurveTo(-0.3, 1.05, 0.24, 1.1, 0.27, 0.75);
  ctx.bezierCurveTo(0.28, 0.45, 0.08, 0.3, 0.1, 0.0); ctx.bezierCurveTo(0.12, -0.2, 0.38, -0.2, 0.38, -0.45); ctx.closePath(); ctx.fill();
  const toes = [[0.25, -1.0, 0.15], [0.05, -1.12, 0.12], [-0.13, -1.1, 0.11], [-0.28, -1.0, 0.095], [-0.38, -0.86, 0.08]];
  for (const t of toes) { ctx.beginPath(); ctx.arc(t[0], t[1], t[2], 0, TAU); ctx.fill(); }
  ctx.restore();
  void edge;
}

// a handkerchief held at one corner, waving
export function kerchief(ctx, x, y, size, col, t, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const w1 = Math.sin(t * 5) * size * 0.14, w2 = Math.sin(t * 5 + 1.4) * size * 0.14;
  ctx.fillStyle = col; ctx.strokeStyle = rgba('#ffffff', 0.85); ctx.lineWidth = Math.max(1.5, size * 0.04);
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.5, -size * 0.18 + w1, size * 1.0, -size * 0.1 + w2);
  ctx.quadraticCurveTo(size * 1.12 + w1 * 0.5, size * 0.45, size * 0.95, size * 0.85 + w2);
  ctx.quadraticCurveTo(size * 0.5, size * 0.95 + w1, size * 0.1, size * 0.7);
  ctx.quadraticCurveTo(-size * 0.08, size * 0.35 - w2, 0, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(size * 0.1, size * 0.1); ctx.quadraticCurveTo(size * 0.5, size * 0.0 + w1, size * 0.9, size * 0.05); ctx.lineTo(size * 0.85, size * 0.25); ctx.quadraticCurveTo(size * 0.5, size * 0.15 + w1, size * 0.15, size * 0.28); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#e4c493'; ctx.lineWidth = Math.max(2, size * 0.05); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-size * 0.1, -size * 0.3); ctx.stroke();
  ctx.restore();
}

// glossy icon for a step lane: foot-l, foot-r, stomp (boot), clap (hands), slap (hand on thigh)
export function stepIcon(ctx, kind, cx, cy, s, col, hi) {
  ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, s * 0.09); ctx.lineCap = 'round';
  if (kind === 'foot-l' || kind === 'foot-r') { footprint(ctx, cx, cy + s * 0.05, s * 0.78, kind === 'foot-l', col, null); }
  else if (kind === 'stomp') { // heeled boot seen from the side with impact lines
    const w = s * 1.0;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.5, cy - w * 0.7); ctx.lineTo(cx - w * 0.05, cy - w * 0.7); ctx.lineTo(cx - w * 0.02, cy - w * 0.05);
    ctx.quadraticCurveTo(cx + w * 0.25, cy - w * 0.02, cx + w * 0.62, cy + w * 0.22); ctx.lineTo(cx + w * 0.62, cy + w * 0.42); ctx.lineTo(cx - w * 0.5, cy + w * 0.42); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - w * 0.7, cy + w * 0.62); ctx.lineTo(cx + w * 0.8, cy + w * 0.62); ctx.stroke();
    for (const d of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(cx + d * w * 0.4, cy + w * 0.78); ctx.lineTo(cx + d * w * 0.62, cy + w * 1.0); ctx.stroke(); }
  } else if (kind === 'clap') {
    for (const d of [-1, 1]) {
      ctx.save(); ctx.translate(cx + d * s * 0.28, cy); ctx.rotate(d * 0.28);
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.27, s * 0.58, 0, 0, TAU); ctx.fill();
      for (let k = -1; k <= 2; k++) { rrect(ctx, k * s * 0.12 - s * 0.05, -s * 0.9, s * 0.1, s * 0.4, s * 0.05); ctx.fill(); }
      ctx.restore();
    }
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + d * s * 0.05, cy - s * 1.0); ctx.lineTo(cx + d * s * 0.24, cy - s * 1.22); ctx.stroke(); }
  } else { // slap: open hand coming down onto the thigh
    ctx.beginPath(); ctx.arc(cx, cy + s * 0.22, s * 0.36, 0, TAU); ctx.fill();
    for (let k = -2; k <= 2; k++) { rrect(ctx, cx + k * s * 0.15 - s * 0.055, cy - s * 0.82 + Math.abs(k) * s * 0.08, s * 0.11, s * 0.62, s * 0.055); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(cx - s * 0.7, cy + s * 0.8); ctx.quadraticCurveTo(cx, cy + s * 0.62, cx + s * 0.7, cy + s * 0.8); ctx.stroke();
  }
  if (hi > 0.02) { ctx.globalAlpha = hi * 0.5; ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 1; }
  ctx.restore();
}

// ---- glossy note gems ------------------------------------------------------------------------------------------------------
export function gem(ctx, shape, x, y, r, col, a, icon) {
  ctx.save(); ctx.globalAlpha = a;
  const base = col, hi = lighter(col, 0.7), mid = lighter(col, 0.2), lo = darker(col, 0.5);
  if (shape === 'foot') {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x + r * 0.12, y + r * 0.2, r * 0.95, r * 0.55, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = rgba(lighter(col, 0.1), 0.28); ell(ctx, x, y, r * 1.05, r * 0.72); ctx.fill();
    ctx.strokeStyle = rgba(lighter(col, 0.6), 0.9); ctx.lineWidth = Math.max(1.5, r * 0.09); ell(ctx, x, y, r * 1.05, r * 0.72); ctx.stroke();
    const f = icon && icon !== 'foot-l' && icon !== 'foot-r' ? icon : (icon || 'foot-l');
    stepIcon(ctx, f, x, y, r * 0.62, lighter(col, 0.88), 0);
    ctx.restore(); return;
  }
  if (shape === 'tile') {
    const w = r * 1.7, h = r * 1.15;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, x - w / 2 + 1, y - h / 2 + 3, w, h, h * 0.28); ctx.fill();
    ctx.fillStyle = vgrad(ctx, y - h / 2, y + h / 2, [[0, hi], [0.3, mid], [0.7, base], [1, lo]]); rrect(ctx, x - w / 2, y - h / 2, w, h, h * 0.28); ctx.fill();
    ctx.strokeStyle = rgba(lighter(col, 0.7), 0.9); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; rrect(ctx, x - w * 0.4, y - h * 0.4, w * 0.8, h * 0.2, h * 0.1); ctx.fill();
    ctx.restore(); return;
  }
  const rx = shape === 'pearl' ? r * 1.15 : r, ry = shape === 'pearl' ? r * 0.82 : r;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, x + 1, y + ry * 0.28, rx, ry); ctx.fill();
  ctx.fillStyle = rgrad(ctx, x, y, 0, Math.max(rx, ry) * 1.15, [[0, hi], [0.3, mid], [0.7, base], [1, lo]], x - rx * 0.3, y - ry * 0.35);
  ell(ctx, x, y, rx, ry); ctx.fill();
  ctx.strokeStyle = rgba(lighter(col, 0.65), 0.95); ctx.lineWidth = Math.max(1.2, r * 0.09); ctx.stroke();
  if (shape === 'disc') { ctx.strokeStyle = rgba(lighter(col, 0.8), 0.7); ctx.lineWidth = 1.3; circ(ctx, x, y, r * 0.62); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,0.65)'; ell(ctx, x - rx * 0.22, y - ry * 0.46, rx * 0.46, ry * 0.2); ctx.fill();
  ctx.restore();
}

// ---- drums (seen from above) ---------------------------------------------------------------------------------------------------
export function drumHead(ctx, S, cx, cy, r, col, f, t, seed = 0) {
  const kind = S.pad, wood = S.wood;
  // cast shadow
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; ell(ctx, cx + r * 0.05, cy + r * 0.16, r * 1.04, r * 1.0); ctx.fill();
  if (kind === 'mortar') {
    ctx.fillStyle = rgrad(ctx, cx, cy, r * 0.5, r * 1.02, [[0, darker(wood, 0.2)], [0.7, wood], [1, darker(wood, 0.55)]], cx - r * 0.2, cy - r * 0.25);
    circ(ctx, cx, cy, r); ctx.fill();
    ctx.strokeStyle = rgba(lighter(wood, 0.5), 0.35); ctx.lineWidth = 1;
    for (const k of [0.9, 0.78]) { circ(ctx, cx, cy, r * k); ctx.stroke(); }
    ctx.fillStyle = rgrad(ctx, cx, cy, r * 0.05, r * 0.66, [[0, '#2a1608'], [0.8, darker(wood, 0.7)], [1, darker(wood, 0.35)]]);
    circ(ctx, cx, cy, r * 0.64); ctx.fill();
    const squash = 1 - 0.18 * f;
    ctx.fillStyle = rgrad(ctx, cx, cy, 0, r * 0.4, [[0, '#fff8e6'], [0.7, lighter(col, 0.55)], [1, lighter(col, 0.2)]], cx - r * 0.1, cy - r * 0.12 - r * 0.05);
    ell(ctx, cx, cy, r * 0.4 * (1 + 0.15 * f), r * 0.4 * squash); ctx.fill();
    if (f > 0.15) { // pestle end coming down
      const pr = r * (0.22 + 0.05 * f);
      ctx.fillStyle = rgba('#000000', 0.3); circ(ctx, cx + 3, cy + 4, pr); ctx.fill();
      ctx.fillStyle = rgrad(ctx, cx, cy, 0, pr, [[0, lighter(wood, 0.45)], [1, darker(wood, 0.2)]], cx - pr * 0.3, cy - pr * 0.3); circ(ctx, cx, cy, pr); ctx.fill();
    }
  } else if (kind === 'pan') {
    ctx.fillStyle = rgrad(ctx, cx, cy, r * 0.1, r, [[0, '#e9edf2'], [0.55, '#9aa4b0'], [1, '#4a525c']], cx - r * 0.3, cy - r * 0.35);
    circ(ctx, cx, cy, r); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = rgba(col, 0.55 + 0.35 * f); ell(ctx, cx, cy, r * 0.72, r * 0.66); ctx.fill();
    ctx.fillStyle = rgrad(ctx, cx, cy, 0, r * 0.7, [[0, 'rgba(255,255,255,0.55)'], [1, 'rgba(0,0,0,0.35)']], cx - r * 0.25, cy - r * 0.3); ell(ctx, cx, cy, r * 0.72, r * 0.66); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 2; ell(ctx, cx, cy, r * 0.72, r * 0.66); ctx.stroke();
    for (let k = 0; k < 4; k++) { const a = k * 1.7 + seed; circ(ctx, cx + Math.cos(a) * r * 0.32, cy + Math.sin(a) * r * 0.3, 1.4); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill(); }
  } else if (kind === 'water') {
    ctx.fillStyle = rgrad(ctx, cx, cy, r * 0.2, r, [[0, '#7fc4d4'], [0.7, '#2f6f86'], [1, '#18424f']]); circ(ctx, cx, cy, r); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5;
    for (let k = 0; k < 3; k++) { const rr = r * (0.7 + 0.1 * k + 0.04 * Math.sin(t * 2 + k)) + (1 - f) * 0; circ(ctx, cx, cy, rr); ctx.stroke(); }
    if (f > 0.02) { ctx.strokeStyle = `rgba(255,255,255,${0.8 * f})`; ctx.lineWidth = 3; circ(ctx, cx, cy, r * (0.9 - 0.3 * f)); ctx.stroke(); }
    ctx.fillStyle = rgrad(ctx, cx, cy, 0, r * 0.62, [[0, lighter(wood, 0.55)], [0.6, wood], [1, darker(wood, 0.5)]], cx - r * 0.2, cy - r * 0.25);
    circ(ctx, cx, cy, r * (0.6 - 0.03 * f)); ctx.fill();
    ctx.strokeStyle = rgba(darker(wood, 0.6), 0.5); ctx.lineWidth = 1.5; circ(ctx, cx, cy, r * 0.42); ctx.stroke();
  } else {
    // shell + hoop + skin
    const lacquer = kind === 'taiko' ? '#8a2412' : wood;
    ctx.fillStyle = rgrad(ctx, cx, cy, r * 0.6, r, [[0, lacquer], [1, darker(lacquer, 0.5)]], cx - r * 0.2, cy - r * 0.25); circ(ctx, cx, cy, r); ctx.fill();
    ctx.strokeStyle = rgba(lighter(lacquer, 0.55), 0.5); ctx.lineWidth = 1.5; circ(ctx, cx, cy, r * 0.97); ctx.stroke();
    if (kind === 'taiko') {
      ctx.fillStyle = '#e8c868';
      for (let k = 0; k < 22; k++) { const a = (k / 22) * TAU; circ(ctx, cx + Math.cos(a) * r * 0.88, cy + Math.sin(a) * r * 0.88, Math.max(1.3, r * 0.04)); ctx.fill(); }
    } else if (kind === 'djembe' || kind === 'generic') { // V lacing of rope
      ctx.strokeStyle = rgba(lighter(wood, 0.7), 0.85); ctx.lineWidth = Math.max(1.5, r * 0.045);
      ctx.beginPath(); for (let k = 0; k < 16; k++) { const a0 = (k / 16) * TAU, a1 = ((k + 0.5) / 16) * TAU; ctx.moveTo(cx + Math.cos(a0) * r * 0.96, cy + Math.sin(a0) * r * 0.96); ctx.lineTo(cx + Math.cos(a1) * r * 0.82, cy + Math.sin(a1) * r * 0.82); ctx.lineTo(cx + Math.cos(a0 + TAU / 16) * r * 0.96, cy + Math.sin(a0 + TAU / 16) * r * 0.96); }
      ctx.stroke();
    }
    ctx.strokeStyle = rgrad(ctx, cx, cy, r * 0.6, r * 0.9, [[0, '#f4f4f0'], [1, '#8a9099']]); ctx.lineWidth = Math.max(2, r * 0.07); circ(ctx, cx, cy, r * 0.8); ctx.stroke();
    const skinR = r * (kind === 'frame' ? 0.9 : 0.76);
    const dent = 0.1 * f;
    ctx.fillStyle = rgrad(ctx, cx, cy, 0, skinR * 1.1, [[0, '#fdf6e3'], [0.65, '#e8d6ae'], [1, '#bda27a']], cx - skinR * 0.25 + 3 * dent, cy - skinR * 0.3);
    circ(ctx, cx, cy, skinR); ctx.fill();
    ctx.save(); circ(ctx, cx, cy, skinR); ctx.clip();
    ctx.strokeStyle = 'rgba(120,90,50,0.14)'; ctx.lineWidth = 1;
    for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(cx + (hash(seed + k) - 0.5) * r * 0.4, cy + (hash(seed + k + 9) - 0.5) * r * 0.4, r * (0.2 + 0.16 * k), hash(k) * 6, hash(k) * 6 + 2.2); ctx.stroke(); }
    if (kind === 'frame') { for (let k = 0; k < 14; k++) { circ(ctx, cx + (hash(seed + k * 2) - 0.5) * skinR * 1.7, cy + (hash(seed + k * 3) - 0.5) * skinR * 1.7, r * (0.03 + 0.04 * hash(k + 4))); ctx.fillStyle = 'rgba(120,80,40,0.12)'; ctx.fill(); } }
    ctx.restore();
    if (kind === 'tabla') { // black syahi centre with a glossy highlight
      ctx.fillStyle = rgrad(ctx, cx, cy, 0, r * 0.4, [[0, '#2c2c34'], [0.7, '#0a0a0e'], [1, '#000']], cx - r * 0.1, cy - r * 0.12);
      circ(ctx, cx + r * 0.08, cy, r * 0.38); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ell(ctx, cx - r * 0.04, cy - r * 0.16, r * 0.17, r * 0.07); ctx.fill();
    }
    // lane colour ring (the colour is never the only signal: the name is printed too)
    ctx.strokeStyle = rgba(col, 0.9); ctx.lineWidth = Math.max(2, r * 0.07); circ(ctx, cx, cy, skinR * 0.62); ctx.stroke();
    if (f > 0.02) { ctx.fillStyle = `rgba(60,30,10,${0.18 * f})`; circ(ctx, cx, cy, skinR); ctx.fill(); }
  }
  if (f > 0.02) {
    ctx.strokeStyle = rgba('#ffffff', 0.75 * f); ctx.lineWidth = 3; circ(ctx, cx, cy, r * (0.5 + 0.55 * (1 - f))); ctx.stroke();
    glow(ctx, cx, cy, r * 1.5, col, 0.55 * f);
  }
}

// ---- gongs (bossed, lying on cords) --------------------------------------------------------------------------------------
export function gong(ctx, S, cx, cy, r, col, f) {
  // a bossed bronze gong seen from above: turned-down rim, hammered field, a ringed boss, lit from the upper left
  ctx.fillStyle = 'rgba(0,0,0,0.42)'; circ(ctx, cx + r * 0.08, cy + r * 0.18, r * 1.04); ctx.fill();
  ctx.fillStyle = rgrad(ctx, cx, cy, r * 0.5, r, [[0, '#d7a550'], [0.6, '#8a5818'], [1, '#3e2208']], cx - r * 0.3, cy - r * 0.35);
  circ(ctx, cx, cy, r); ctx.fill();
  ctx.strokeStyle = 'rgba(255,225,150,0.85)'; ctx.lineWidth = Math.max(1.5, r * 0.06); circ(ctx, cx, cy, r * 0.95); ctx.stroke();
  ctx.strokeStyle = 'rgba(40,20,4,0.6)'; ctx.lineWidth = Math.max(1, r * 0.03); circ(ctx, cx, cy, r * 0.88); ctx.stroke();
  ctx.fillStyle = rgrad(ctx, cx, cy, 0, r * 0.8, [[0, '#f8d98a'], [0.55, '#c58c34'], [1, '#6a4010']], cx - r * 0.28, cy - r * 0.32);
  circ(ctx, cx, cy, r * 0.8); ctx.fill();
  // hammer marks
  ctx.save(); circ(ctx, cx, cy, r * 0.8); ctx.clip();
  for (let k = 0; k < 26; k++) { const a = hash(k * 3 + r) * TAU, d = 0.35 + 0.45 * Math.sqrt(hash(k * 5 + 2)); ctx.fillStyle = 'rgba(60,30,6,0.16)'; ell(ctx, cx + Math.cos(a) * d * r, cy + Math.sin(a) * d * r, r * 0.07, r * 0.05); ctx.fill(); ctx.fillStyle = 'rgba(255,240,180,0.2)'; ell(ctx, cx + Math.cos(a) * d * r - r * 0.02, cy + Math.sin(a) * d * r - r * 0.02, r * 0.04, r * 0.025); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = rgba(darker(col, 0.2), 0.75); ctx.lineWidth = Math.max(1.5, r * 0.06); circ(ctx, cx, cy, r * 0.6); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,240,190,0.5)'; ctx.lineWidth = Math.max(1, r * 0.025); circ(ctx, cx, cy, r * 0.5); ctx.stroke();
  // boss
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; circ(ctx, cx + r * 0.05, cy + r * 0.07, r * 0.34); ctx.fill();
  ctx.fillStyle = rgrad(ctx, cx, cy, 0, r * 0.4, [[0, '#fff6c8'], [0.45, lighter(col, 0.3)], [1, darker(col, 0.55)]], cx - r * 0.12, cy - r * 0.14);
  circ(ctx, cx, cy, r * 0.34); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ell(ctx, cx - r * 0.12, cy - r * 0.16, r * 0.1, r * 0.05); ctx.fill();
  if (f > 0.02) { ctx.strokeStyle = rgba('#fff2c0', 0.8 * f); ctx.lineWidth = 3; circ(ctx, cx, cy, r * (0.8 + 0.5 * (1 - f))); ctx.stroke(); glow(ctx, cx, cy, r * 1.6, '#ffcf6a', 0.55 * f); }
}

export function bell(ctx, S, cx, top, w, h, col, f, swing) {
  const metal = '#b48a3a';
  ctx.save(); ctx.translate(cx, top); ctx.rotate(swing);
  ctx.strokeStyle = '#3a2a16'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(0, h * 0.06); ctx.stroke();
  const hw = w / 2;
  ctx.beginPath();
  ctx.moveTo(-hw * 0.22, h * 0.05);
  ctx.bezierCurveTo(-hw * 0.34, h * 0.12, -hw * 0.45, h * 0.3, -hw * 0.5, h * 0.62);
  ctx.bezierCurveTo(-hw * 0.55, h * 0.8, -hw * 0.85, h * 0.84, -hw, h * 0.94);
  ctx.lineTo(hw, h * 0.94);
  ctx.bezierCurveTo(hw * 0.85, h * 0.84, hw * 0.55, h * 0.8, hw * 0.5, h * 0.62);
  ctx.bezierCurveTo(hw * 0.45, h * 0.3, hw * 0.34, h * 0.12, hw * 0.22, h * 0.05);
  ctx.closePath();
  ctx.fillStyle = hgrad(ctx, -hw, hw, [[0, darker(metal, 0.5)], [0.25, lighter(metal, 0.5)], [0.5, metal], [0.8, darker(metal, 0.35)], [1, darker(metal, 0.6)]]);
  ctx.fill(); ctx.strokeStyle = rgba(lighter(metal, 0.5), 0.7); ctx.lineWidth = 1.5; ctx.stroke();
  ctx.strokeStyle = rgba(darker(metal, 0.5), 0.55); ctx.lineWidth = 1.5;
  for (const k of [0.4, 0.7]) { ctx.beginPath(); ctx.moveTo(-hw * (0.5 + 0.3 * (k - 0.4)) - 1, h * k); ctx.lineTo(hw * (0.5 + 0.3 * (k - 0.4)) + 1, h * k); ctx.stroke(); }
  ctx.fillStyle = rgba(col, 0.75); rrect(ctx, -hw * 0.5, h * 0.52, w * 0.5, Math.max(3, h * 0.045), 2); ctx.fill();
  ctx.fillStyle = '#1b1006'; ell(ctx, 0, h * 0.94, hw, h * 0.05); ctx.fill();
  ctx.fillStyle = darker(metal, 0.2); circ(ctx, Math.sin(swing * 2) * hw * 0.3, h * 0.99, w * 0.09); ctx.fill();
  ctx.restore();
  if (f > 0.02) glow(ctx, cx, top + h * 0.6, h * 0.9, '#ffd98a', 0.5 * f);
}


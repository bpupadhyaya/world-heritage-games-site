// Shared scenery for the aim engine: settings (props and backdrops), colour helpers and particle effects.
// Pure canvas primitives; deterministic (hash-based, no randomness); no assets.

const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fract = (x) => x - Math.floor(x);
export const hash = (n) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);

// ---- colour helpers --------------------------------------------------------------------------------------------
const rgbOf = (h) => {
  const s = String(h ?? '#888888');
  if (s.startsWith('rgb')) { const m = s.match(/\d+(\.\d+)?/g); return [Number(m[0]), Number(m[1]), Number(m[2])]; }
  let x = s.replace('#', '');
  if (x.length === 3) x = x.split('').map((c) => c + c).join('');
  const n = parseInt(x, 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mix = (a, b, k) => { const A = rgbOf(a), B = rgbOf(b); return `rgb(${Math.round(A[0] + (B[0] - A[0]) * k)},${Math.round(A[1] + (B[1] - A[1]) * k)},${Math.round(A[2] + (B[2] - A[2]) * k)})`; };
export const dark = (h, k) => mix(h, '#000000', k);
export const light = (h, k) => mix(h, '#ffffff', k);
export const alpha = (h, a) => { const [r, g, b] = rgbOf(h); return `rgba(${r},${g},${b},${a})`; };
export const vgrad = (ctx, y0, y1, stops) => { const g = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
export const hgrad = (ctx, x0, x1, stops) => { const g = ctx.createLinearGradient(x0, 0, x1, 0); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
export const poly = (ctx, pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };
export function rrect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// ---- settings ----------------------------------------------------------------------------------------------------
export const SETTINGS = ['generic', 'lawn', 'village', 'shore', 'hall', 'ice', 'court', 'range', 'jungle', 'festival', 'dojo', 'sports-hall', 'playground', 'street'];
const PAL = {
  generic: { skyTop: '#7fb4d9', skyLow: '#dbe9f1', far: '#6c8a5a', mid: '#4f7a45', ground: '#6a9a50' },
  lawn: { skyTop: '#6fa8dc', skyLow: '#e6f1f6', far: '#7da36a', mid: '#4f8a3f', ground: '#3e7a34' },
  village: { skyTop: '#86b6dc', skyLow: '#f1ecd8', far: '#5f8a6a', mid: '#2f5a3a', ground: '#78a050' },
  shore: { skyTop: '#8cc0e0', skyLow: '#f4e8d0', far: '#6a8aa0', mid: '#486a58', ground: '#b8a888' },
  hall: { skyTop: '#2a1c14', skyLow: '#5a3a24', far: '#3a2418', mid: '#4a2e1c', ground: '#5a3a22' },
  ice: { skyTop: '#a8c8e4', skyLow: '#eef6fc', far: '#7a8ca8', mid: '#5a6c88', ground: '#dfeaf3' },
  court: { skyTop: '#7fb4d9', skyLow: '#f4ecd2', far: '#7a8a6a', mid: '#8a3a2a', ground: '#c8b48a' },
  range: { skyTop: '#f0a860', skyLow: '#fbe3b0', far: '#a8845a', mid: '#8a6a42', ground: '#c8a46a' },
  jungle: { skyTop: '#4a7a4a', skyLow: '#b8d89a', far: '#2f5a34', mid: '#1f4a2a', ground: '#3a5a2a' },
  festival: { skyTop: '#7fb4d9', skyLow: '#f6e6c0', far: '#b88a64', mid: '#a86a4a', ground: '#c8b08a' },
  dojo: { skyTop: '#2a2236', skyLow: '#6a4a3a', far: '#5a3c2a', mid: '#8a6a44', ground: '#b08955' },
  'sports-hall': { skyTop: '#dfe4ea', skyLow: '#c3cad4', far: '#9aa4b4', mid: '#2d4a7a', ground: '#c99a58' },
  playground: { skyTop: '#8cc4e8', skyLow: '#eef4f2', far: '#6a9a62', mid: '#4a7a46', ground: '#68727c' },
  street: { skyTop: '#7fb0d6', skyLow: '#f0e6d2', far: '#8a7a70', mid: '#7a4a3c', ground: '#4a4d55' },
};
export const palFor = (setting, look = {}) => ({ ...(PAL[setting] ?? PAL.generic), skyTop: look.skyTop ?? (PAL[setting] ?? PAL.generic).skyTop, skyLow: look.skyLow ?? (PAL[setting] ?? PAL.generic).skyLow });

export function inferSetting(P, title) {
  if (P.setting && SETTINGS.includes(P.setting)) return P.setting;
  const t = `${title ?? ''}`.toLowerCase();
  const has = (re) => re.test(t);
  if (has(/bowl|boule|green/)) return 'lawn';
  if (has(/quoit|horseshoe|m[oö]lkky|pin|skittle|jukskei/)) return 'village';
  if (has(/skip|skim|stone/) && !has(/ice|curl/)) return 'shore';
  if (has(/shove|hapenny|sjoelen|shuffle|tiddly|flick|disc/)) return 'hall';
  if (has(/curl|ice/)) return 'ice';
  if (has(/pitch|tuho|pot/)) return 'court';
  if (has(/blowgun|sumpit|jungle/)) return 'jungle';
  if (has(/archery|mounted|javelin/)) return 'range';
  if (has(/alka|tilting|ring/)) return 'festival';
  if (has(/daruma|otoshi|stack/)) return 'dojo';
  if (P.mode === 'balance') return 'dojo';
  if (P.mode === 'fire') return 'range';
  return 'generic';
}

// ---- backdrop layers (drawn above the horizon) -----------------------------------------------------------------------
function ridge(ctx, x0, W, baseY, amp, seed, fill, n = 26) {
  ctx.beginPath(); ctx.moveTo(x0, baseY + 400);
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    ctx.lineTo(x0 + W * f, baseY - amp * (0.5 + 0.28 * Math.sin(f * 7.1 + seed) + 0.17 * Math.sin(f * 15.3 + seed * 2.3) + 0.08 * Math.sin(f * 31 + seed * 4)));
  }
  ctx.lineTo(x0 + W, baseY + 400); ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}
function conifer(ctx, x, base, h, col) {
  ctx.fillStyle = dark(col, 0.45); ctx.fillRect(x - h * 0.03, base - h * 0.12, h * 0.06, h * 0.12);
  for (let i = 0; i < 3; i++) {
    const y1 = base - h * (0.1 + i * 0.27), w = h * (0.34 - i * 0.07);
    ctx.fillStyle = i === 1 ? light(col, 0.08) : col;
    poly(ctx, [[x - w, y1], [x + w, y1], [x, y1 - h * 0.4]]); ctx.fill();
  }
}
function roundTree(ctx, x, base, h, col, t, ph) {
  const sw = Math.sin(t * 0.9 + ph) * h * 0.012;
  ctx.fillStyle = '#5a3d22'; ctx.fillRect(x - h * 0.04, base - h * 0.4, h * 0.08, h * 0.4);
  const g = ctx.createRadialGradient(x - h * 0.1 + sw, base - h * 0.75, h * 0.04, x + sw, base - h * 0.65, h * 0.4);
  g.addColorStop(0, light(col, 0.25)); g.addColorStop(1, dark(col, 0.1));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + sw, base - h * 0.68, h * 0.3, 0, TAU); ctx.arc(x - h * 0.2 + sw, base - h * 0.52, h * 0.22, 0, TAU); ctx.arc(x + h * 0.21 + sw, base - h * 0.5, h * 0.22, 0, TAU); ctx.fill();
}
function palm(ctx, x, base, h, col, t, ph) {
  ctx.strokeStyle = '#6a4a28'; ctx.lineWidth = Math.max(2, h * 0.05); ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + h * 0.08, base - h * 0.5, x + h * 0.02, base - h); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, h * 0.04);
  for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.6 + Math.sin(t * 1.4 + ph + i) * 0.05; ctx.beginPath(); ctx.moveTo(x + h * 0.02, base - h); ctx.quadraticCurveTo(x + Math.cos(a) * h * 0.3, base - h + Math.sin(a) * h * 0.25 - h * 0.1, x + Math.cos(a) * h * 0.5, base - h + Math.sin(a) * h * 0.12 + h * 0.2); ctx.stroke(); }
}
function house(ctx, x, base, w, h, wall, roof) {
  ctx.fillStyle = vgrad(ctx, base - h, base, [[0, light(wall, 0.12)], [1, dark(wall, 0.2)]]); ctx.fillRect(x - w / 2, base - h, w, h);
  ctx.fillStyle = roof; poly(ctx, [[x - w * 0.6, base - h], [x + w * 0.6, base - h], [x, base - h - h * 0.55]]); ctx.fill();
  ctx.fillStyle = 'rgba(255,230,150,0.85)'; ctx.fillRect(x - w * 0.28, base - h * 0.7, w * 0.18, h * 0.3); ctx.fillRect(x + w * 0.1, base - h * 0.7, w * 0.18, h * 0.3);
  ctx.fillStyle = dark(wall, 0.45); ctx.fillRect(x - w * 0.08, base - h * 0.45, w * 0.16, h * 0.45);
}
function pagoda(ctx, x, base, w, col, roof) {
  for (let i = 0; i < 2; i++) {
    const y = base - i * w * 0.42, ww = w * (1 - i * 0.22);
    ctx.fillStyle = col; ctx.fillRect(x - ww * 0.38, y - w * 0.3, ww * 0.76, w * 0.3);
    ctx.fillStyle = roof;
    ctx.beginPath(); ctx.moveTo(x - ww * 0.62, y - w * 0.28); ctx.quadraticCurveTo(x - ww * 0.3, y - w * 0.3, x, y - w * 0.52); ctx.quadraticCurveTo(x + ww * 0.3, y - w * 0.3, x + ww * 0.62, y - w * 0.28); ctx.lineTo(x + ww * 0.4, y - w * 0.22); ctx.lineTo(x - ww * 0.4, y - w * 0.22); ctx.closePath(); ctx.fill();
  }
}
function crowd(ctx, x0, y, w, rows, t, cols) {
  for (let r = 0; r < rows; r++) for (let i = 0; i < Math.round(w / 9); i++) {
    const x = x0 + (i + 0.5) * 9 + (r % 2) * 4, yy = y - r * 8 + Math.sin(t * 3 + i * 1.3 + r) * 0.8;
    ctx.fillStyle = cols[(i * 7 + r * 3) % cols.length]; ctx.beginPath(); ctx.arc(x, yy, 3, 0, TAU); ctx.fill();
    ctx.fillStyle = dark(cols[(i * 7 + r * 3) % cols.length], 0.35); ctx.fillRect(x - 3.4, yy + 2.5, 6.8, 5);
  }
}
function bunting(ctx, x0, x1, y, sag, n, cols, t) {
  ctx.strokeStyle = 'rgba(40,30,20,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo((x0 + x1) / 2, y + sag * 2, x1, y); ctx.stroke();
  for (let i = 0; i < n; i++) {
    const f = (i + 0.5) / n, x = x0 + (x1 - x0) * f, yy = y + sag * 2 * f * (1 - f) * 2 + Math.sin(t * 2 + i) * 0.8;
    ctx.fillStyle = cols[i % cols.length]; poly(ctx, [[x - 5, yy], [x + 5, yy], [x, yy + 10]]); ctx.fill();
  }
}

// R = the whole area; hy = horizon y; pan = parallax offset in px (far layers move less than near ones)
export function drawBackdrop(ctx, setting, R, hy, pal, t, pan = 0) {
  const W = R.w, x0 = R.x, skyH = hy - R.y;
  ctx.fillStyle = vgrad(ctx, R.y, hy, [[0, pal.skyTop], [1, pal.skyLow]]);
  ctx.fillRect(R.x, R.y, R.w, skyH + 2);
  const dim = setting === 'hall' || setting === 'dojo';
  // sun or lamp glow and soft clouds
  if (!dim) {
    const sx = x0 + W * 0.78 + pan * 0.1, sy = R.y + skyH * 0.35;
    const sg = ctx.createRadialGradient(sx, sy, 2, sx, sy, skyH * 0.7);
    sg.addColorStop(0, 'rgba(255,248,210,0.9)'); sg.addColorStop(0.15, 'rgba(255,240,190,0.4)'); sg.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.fillStyle = sg; ctx.fillRect(R.x, R.y, R.w, skyH);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 4; i++) {
      const cx = x0 + ((W * (0.12 + i * 0.27) + t * (3 + i) + pan * 0.25) % (W + 160)) - 40, cy = R.y + skyH * (0.18 + (i % 2) * 0.2);
      ctx.beginPath(); ctx.ellipse(cx, cy, 34, 9, 0, 0, TAU); ctx.ellipse(cx + 20, cy - 5, 22, 8, 0, 0, TAU); ctx.ellipse(cx - 20, cy - 3, 20, 7, 0, 0, TAU); ctx.fill();
    }
  }
  const far = pal.far, mid = pal.mid;
  const H = Math.max(40, skyH);
  switch (setting) {
    case 'lawn':
      ridge(ctx, x0, W, hy, H * 0.28, 1, mix(far, pal.skyLow, 0.5));
      for (let i = 0; i < 9; i++) roundTree(ctx, x0 + W * (0.05 + i * 0.12) + pan * 0.5, hy, H * (0.35 + (i % 3) * 0.08), mix(mid, pal.skyLow, 0.2), t, i);
      house(ctx, x0 + W * 0.22 + pan * 0.6, hy, W * 0.14, H * 0.2, '#f1ead2', '#7a3a26');
      // flag pole with club pennant
      ctx.strokeStyle = '#ddd'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + W * 0.7 + pan * 0.6, hy); ctx.lineTo(x0 + W * 0.7 + pan * 0.6, hy - H * 0.55); ctx.stroke();
      ctx.fillStyle = '#c8452d'; poly(ctx, [[x0 + W * 0.7 + pan * 0.6, hy - H * 0.55], [x0 + W * 0.7 + pan * 0.6 + 26 + Math.sin(t * 4) * 3, hy - H * 0.5], [x0 + W * 0.7 + pan * 0.6, hy - H * 0.45]]); ctx.fill();
      break;
    case 'village':
      ridge(ctx, x0, W, hy, H * 0.35, 2, mix(far, pal.skyLow, 0.55));
      for (let i = 0; i < 14; i++) conifer(ctx, x0 + W * (0.02 + i * 0.075) + pan * 0.5, hy, H * (0.45 + (i % 4) * 0.1), mix(mid, pal.skyLow, 0.1));
      house(ctx, x0 + W * 0.75 + pan * 0.6, hy, W * 0.15, H * 0.22, '#b8442c', '#3a2a22');
      break;
    case 'shore':
      ridge(ctx, x0, W, hy, H * 0.4, 3, mix(far, pal.skyLow, 0.5));
      ridge(ctx, x0, W, hy, H * 0.2, 5, mix(mid, pal.skyLow, 0.25));
      for (let i = 0; i < 6; i++) conifer(ctx, x0 + W * (0.05 + i * 0.18) + pan * 0.5, hy, H * (0.3 + (i % 3) * 0.1), mid);
      break;
    case 'hall': {
      // timber wall with a window and hanging lamp
      ctx.fillStyle = vgrad(ctx, R.y, hy, [[0, '#2a1810'], [1, '#4a2e1c']]); ctx.fillRect(R.x, R.y, R.w, skyH);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = x0 + 10; x < x0 + W; x += 22) { ctx.moveTo(x, R.y); ctx.lineTo(x, hy); } ctx.stroke();
      ctx.fillStyle = '#e8c870'; ctx.fillRect(x0 + W * 0.12 + pan * 0.3, R.y + skyH * 0.2, W * 0.2, skyH * 0.45);
      ctx.fillStyle = 'rgba(40,24,10,0.9)'; ctx.fillRect(x0 + W * 0.22 + pan * 0.3 - 2, R.y + skyH * 0.2, 4, skyH * 0.45); ctx.fillRect(x0 + W * 0.12 + pan * 0.3, R.y + skyH * 0.42 - 2, W * 0.2, 4);
      const lx = x0 + W * 0.62, ly = R.y + skyH * 0.35;
      const lg = ctx.createRadialGradient(lx, ly, 2, lx, ly, skyH * 1.0); lg.addColorStop(0, 'rgba(255,210,120,0.65)'); lg.addColorStop(1, 'rgba(255,210,120,0)'); ctx.fillStyle = lg; ctx.fillRect(R.x, R.y, R.w, skyH * 1.2);
      ctx.strokeStyle = '#1a100a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, R.y); ctx.lineTo(lx, ly - 10); ctx.stroke();
      ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.ellipse(lx, ly, 12, 9, 0, 0, TAU); ctx.fill();
      break;
    }
    case 'ice':
      ridge(ctx, x0, W, hy, H * 0.3, 4, mix(far, pal.skyLow, 0.5));
      ctx.fillStyle = '#2a3a58'; ctx.fillRect(R.x, hy - H * 0.2, R.w, H * 0.2);
      crowd(ctx, x0 + 4, hy - 6, W - 8, 3, t, ['#d8453a', '#f4f0e0', '#3a6ac8', '#e8b030', '#4a9a5a']);
      bunting(ctx, x0, x0 + W, hy - H * 0.32, 8, 12, ['#d8453a', '#f4f0e0', '#3a6ac8'], t);
      break;
    case 'court':
      ridge(ctx, x0, W, hy, H * 0.3, 6, mix(far, pal.skyLow, 0.5));
      // pavilion roof on posts
      pagoda(ctx, x0 + W * 0.24 + pan * 0.6, hy, W * 0.2, '#a83a2a', '#2f3a3a');
      pagoda(ctx, x0 + W * 0.8 + pan * 0.6, hy, W * 0.16, '#a83a2a', '#2f3a3a');
      for (let i = 0; i < 6; i++) roundTree(ctx, x0 + W * (0.4 + i * 0.07) + pan * 0.5, hy, H * 0.3, mix(mid, pal.skyLow, 0.5), t, i);
      break;
    case 'range':
      ridge(ctx, x0, W, hy, H * 0.45, 7, mix('#a8744a', pal.skyLow, 0.5));
      ridge(ctx, x0, W, hy, H * 0.25, 8, mix(far, pal.skyLow, 0.2));
      // pennants on tents
      for (const f of [0.15, 0.62]) {
        const x = x0 + W * f + pan * 0.6;
        ctx.fillStyle = '#e8dcb8'; poly(ctx, [[x - W * 0.06, hy], [x + W * 0.06, hy], [x, hy - H * 0.2]]); ctx.fill();
        ctx.strokeStyle = '#5a3a1c'; ctx.beginPath(); ctx.moveTo(x, hy - H * 0.2); ctx.lineTo(x, hy - H * 0.3); ctx.stroke();
        ctx.fillStyle = '#c8452d'; poly(ctx, [[x, hy - H * 0.3], [x + 16 + Math.sin(t * 5 + f * 9) * 3, hy - H * 0.27], [x, hy - H * 0.24]]); ctx.fill();
      }
      break;
    case 'jungle':
      ridge(ctx, x0, W, hy, H * 0.5, 9, mix(far, pal.skyLow, 0.35));
      for (let i = 0; i < 7; i++) palm(ctx, x0 + W * (0.05 + i * 0.15) + pan * 0.5, hy, H * (0.5 + (i % 3) * 0.12), mix('#2f7a3a', pal.skyLow, 0.1), t, i);
      break;
    case 'festival':
      ridge(ctx, x0, W, hy, H * 0.22, 10, mix(far, pal.skyLow, 0.4));
      for (let i = 0; i < 5; i++) house(ctx, x0 + W * (0.1 + i * 0.2) + pan * 0.6, hy, W * 0.15, H * (0.22 + (i % 2) * 0.08), ['#f1d9a8', '#e8b87a', '#f6e8c8'][i % 3], '#9a3a28');
      bunting(ctx, x0, x0 + W, hy - H * 0.38, 10, 14, ['#c8452d', '#f4f0e0', '#2d6bb0', '#e0a82e'], t);
      break;
    case 'dojo': {
      ctx.fillStyle = vgrad(ctx, R.y, hy, [[0, '#2a2236'], [1, '#5a4030']]); ctx.fillRect(R.x, R.y, R.w, skyH);
      // shoji panels
      const n = 4, pw = W / n;
      for (let i = 0; i < n; i++) {
        const x = x0 + i * pw + pan * 0.3;
        ctx.fillStyle = 'rgba(250,240,215,0.88)'; ctx.fillRect(x + 4, R.y + 6, pw - 8, skyH - 6);
        ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 2; ctx.strokeRect(x + 4, R.y + 6, pw - 8, skyH - 6);
        ctx.lineWidth = 1; ctx.beginPath(); for (let k = 1; k < 4; k++) { ctx.moveTo(x + 4, R.y + 6 + (skyH - 6) * k / 4); ctx.lineTo(x + pw - 4, R.y + 6 + (skyH - 6) * k / 4); } ctx.moveTo(x + pw / 2, R.y + 6); ctx.lineTo(x + pw / 2, hy); ctx.stroke();
      }
      // paper lantern
      const lx = x0 + W * 0.12, ly = R.y + skyH * 0.4;
      const lg = ctx.createRadialGradient(lx, ly, 2, lx, ly, skyH * 0.8); lg.addColorStop(0, 'rgba(255,200,110,0.6)'); lg.addColorStop(1, 'rgba(255,200,110,0)'); ctx.fillStyle = lg; ctx.fillRect(R.x, R.y, R.w, skyH);
      ctx.fillStyle = '#f8d890'; ctx.beginPath(); ctx.ellipse(lx, ly, 14, 18, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#8a4a20'; ctx.lineWidth = 1; ctx.stroke();
      break;
    }
    default:
      ridge(ctx, x0, W, hy, H * 0.4, 11, mix(far, pal.skyLow, 0.5));
      for (let i = 0; i < 8; i++) roundTree(ctx, x0 + W * (0.04 + i * 0.13) + pan * 0.5, hy, H * (0.3 + (i % 3) * 0.08), mix(mid, pal.skyLow, 0.25), t, i);
  }
}

// ---- a pennant on a pole: waves with the wind -------------------------------------------------------------------
export function windFlag(ctx, x, baseY, h, wind, windMax, t, col = '#c8452d') {
  const k = windMax > 0 ? clamp(wind / windMax, -1, 1) : 0;
  ctx.strokeStyle = '#d8d0c0'; ctx.lineWidth = Math.max(2, h * 0.04); ctx.beginPath(); ctx.moveTo(x, baseY); ctx.lineTo(x, baseY - h); ctx.stroke();
  ctx.fillStyle = col;
  const len = h * (0.35 + 0.35 * Math.abs(k)), dir = k >= 0 ? 1 : -1, y0 = baseY - h;
  ctx.beginPath(); ctx.moveTo(x, y0);
  for (let i = 0; i <= 8; i++) { const f = i / 8; ctx.lineTo(x + dir * len * f, y0 + Math.sin(t * 7 * (0.5 + Math.abs(k)) - f * 5) * h * 0.04 * f + f * h * (0.04 + 0.16 * (1 - Math.abs(k)))); }
  for (let i = 8; i >= 0; i--) { const f = i / 8; ctx.lineTo(x + dir * len * f, y0 + h * 0.14 * (1 - f * 0.5) + Math.sin(t * 7 * (0.5 + Math.abs(k)) - f * 5) * h * 0.04 * f + f * h * (0.04 + 0.16 * (1 - Math.abs(k)))); }
  ctx.closePath(); ctx.fill();
}

// ---- particles, shake and queued sounds ------------------------------------------------------------------------------
export function createFx(env) {
  const ps = [];
  const q = [];
  let n = 1, t = 0, shake = 0;
  const tone = (o) => { try { env.audio?.tone?.(o); } catch { /* sound is optional */ } };
  const r = () => hash(n++);
  const add = (p) => { ps.push({ age: 0, life: 0.8, vx: 0, vy: 0, g: 0, size: 4, rot: 0, vr: 0, ...p }); if (ps.length > 140) ps.splice(0, ps.length - 140); };
  const api = {
    get shake() { return shake; },
    kick(a) { shake = Math.max(shake, a); },
    offset() { return shake > 0.2 ? { x: Math.sin(t * 61) * shake, y: Math.cos(t * 53) * shake * 0.8 } : { x: 0, y: 0 }; },
    sfx(delay, o) { q.push({ at: t + delay, o }); },
    tone,
    ring(x, y, rx, ry, col, life = 0.6, w = 3) { add({ type: 'ring', x, y, rx, ry, col, life, w }); },
    dust(x, y, size, col = 'rgba(220,200,160,0.7)', count = 6) { for (let i = 0; i < count; i++) add({ type: 'dust', x, y, vx: (r() - 0.5) * size * 3, vy: -r() * size * 1.6, size: size * (0.4 + r() * 0.5), col, life: 0.5 + r() * 0.4, g: size * 2 }); },
    shards(x, y, size, cols, count = 10) { for (let i = 0; i < count; i++) { const a = r() * TAU, s = size * (2 + r() * 5); add({ type: 'shard', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - size * 3, size: size * (0.4 + r() * 0.5), col: cols[i % cols.length], life: 0.7 + r() * 0.5, g: size * 18, rot: r() * TAU, vr: (r() - 0.5) * 14 }); } },
    sparks(x, y, size, col = '#ffe27a', count = 8) { for (let i = 0; i < count; i++) { const a = (i / count) * TAU + r(); add({ type: 'spark', x, y, vx: Math.cos(a) * size * 5, vy: Math.sin(a) * size * 5, size: size * 0.5, col, life: 0.45 + r() * 0.2, g: size * 4 }); } },
    drops(x, y, size, col = 'rgba(210,235,250,0.9)', count = 9) { for (let i = 0; i < count; i++) add({ type: 'drop', x, y, vx: (r() - 0.5) * size * 5, vy: -(2 + r() * 5) * size, size: size * (0.25 + r() * 0.25), col, life: 0.6 + r() * 0.3, g: size * 16 }); },
    trail(x, y, size, col, life = 0.35) { add({ type: 'trail', x, y, size, col, life }); },
    update(dt) {
      t += dt; shake = Math.max(0, shake - dt * 28);
      for (const p of ps) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.rot += p.vr * dt; }
      for (let i = ps.length - 1; i >= 0; i--) if (ps[i].age >= ps[i].life) ps.splice(i, 1);
      if (q.length) { for (let i = q.length - 1; i >= 0; i--) if (q[i].at <= t) { tone(q[i].o); q.splice(i, 1); } }
    },
    draw(ctx) {
      for (const p of ps) {
        const k = p.age / p.life, a = clamp(1 - k * k, 0, 1);
        ctx.globalAlpha = a;
        if (p.type === 'ring') { ctx.strokeStyle = p.col; ctx.lineWidth = p.w * (1 - k * 0.5); ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx * (0.3 + k), p.ry * (0.3 + k), 0, 0, TAU); ctx.stroke(); }
        else if (p.type === 'dust') { ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 + k * 1.4), 0, TAU); ctx.fill(); }
        else if (p.type === 'shard') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col; ctx.beginPath(); ctx.moveTo(-p.size, -p.size * 0.5); ctx.lineTo(p.size, 0); ctx.lineTo(-p.size * 0.3, p.size * 0.8); ctx.closePath(); ctx.fill(); ctx.restore(); }
        else if (p.type === 'spark') { ctx.strokeStyle = p.col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); ctx.lineTo(p.x + p.vx * 0.02, p.y + p.vy * 0.02); ctx.stroke(); ctx.fillStyle = p.col; ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); }
        else if (p.type === 'drop') { ctx.fillStyle = p.col; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.size * 0.7, p.size, 0, 0, TAU); ctx.fill(); }
        else if (p.type === 'trail') { ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 - k * 0.7), 0, TAU); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
    },
    reset() { ps.length = 0; q.length = 0; shake = 0; },
  };
  return api;
}

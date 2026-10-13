// Procedural drawing for Tempo Race: scenery, surface marks, competitors with stride cycles, wake and dust, finish gantry,
// confetti and speed lines. Canvas primitives only, deterministic (a hash of an index instead of random numbers).
// Everything is seen from above; +x is the direction of travel in racer space. Light comes from the upper left.
export const hash = (n) => { let h = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const parse = (hex) => { const h = String(hex).replace('#', ''); const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0'); return [parseInt(f.slice(0, 2), 16) || 0, parseInt(f.slice(2, 4), 16) || 0, parseInt(f.slice(4, 6), 16) || 0]; };
export const shade = (hex, k) => { const c = parse(hex), t = k >= 0 ? 255 : 0, a = Math.abs(k); return `rgb(${c.map((v) => Math.round(v + (t - v) * a)).join(',')})`; };
const rgba = (hex, a) => { const [r, g, b] = parse(hex); return `rgba(${r},${g},${b},${a})`; };
const poly = (ctx, pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };
const ell = (ctx, x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); };
const SKINS = ['#e3b78c', '#c99366', '#8a5a3a', '#f0cfa8', '#a8714a'];
const SHIRTS = ['#f5f1e8', '#f2c14e', '#e0603a', '#58c27d', '#4fc3d9', '#ef8fb5', '#b07be0'];

// ---- scenery ----------------------------------------------------------------------------------------------------------
// Piece standing at (x, y) with size s (about one lane wide). r = a 0..1 variation, t = time for sway.
export function scenery(ctx, kind, x, y, s, r, t = 0) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const sh = (rx, ry, ox = 0.18) => { ctx.fillStyle = 'rgba(0,0,0,0.22)'; ell(ctx, x + s * ox, y + s * 0.38, rx, ry); ctx.fill(); };
  switch (kind) {
    case 'reeds': {
      sh(s * 0.4, s * 0.1);
      for (let i = -2; i <= 2; i++) {
        const sway = Math.sin(t * 1.6 + i + r * 6) * s * 0.06;
        ctx.strokeStyle = i % 2 ? '#2f6b38' : '#3f8a46'; ctx.lineWidth = Math.max(2, s * 0.07);
        ctx.beginPath(); ctx.moveTo(x + i * s * 0.13, y + s * 0.4); ctx.quadraticCurveTo(x + i * s * 0.2, y, x + i * s * 0.13 + (r - 0.5) * s * 0.3 + sway, y - s * (0.45 + 0.1 * ((i + 2) % 3))); ctx.stroke();
        if (i % 2 === 0) { ctx.fillStyle = '#7a5a2a'; ell(ctx, x + i * s * 0.13 + (r - 0.5) * s * 0.3 + sway, y - s * (0.5 + 0.1 * ((i + 2) % 3)), s * 0.05, s * 0.14); ctx.fill(); }
      }
      break; }
    case 'palms': {
      sh(s * 0.45, s * 0.12);
      const sway = Math.sin(t * 0.9 + r * 6) * s * 0.05, tx = x + (r - 0.5) * s * 0.3 + sway, ty = y - s * 0.6;
      ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = Math.max(3, s * 0.12); ctx.beginPath(); ctx.moveTo(x, y + s * 0.4); ctx.quadraticCurveTo(x + s * 0.15, y - s * 0.1, tx, ty); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = Math.max(1, s * 0.03); ctx.beginPath(); ctx.moveTo(x - s * 0.03, y + s * 0.4); ctx.quadraticCurveTo(x + s * 0.12, y - s * 0.1, tx - s * 0.03, ty); ctx.stroke();
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.55, l = s * (0.62 + 0.08 * (i % 2));
        ctx.strokeStyle = i % 2 ? '#2e7d3a' : '#3d9a48'; ctx.lineWidth = Math.max(2.5, s * 0.075);
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx + Math.cos(a) * l * 0.5, ty + Math.sin(a) * l * 0.35 - s * 0.14, tx + Math.cos(a) * l, ty + Math.sin(a) * l * 0.6 + s * 0.2); ctx.stroke();
      }
      ctx.fillStyle = '#5a3d1a'; ctx.beginPath(); ctx.arc(tx - s * 0.04, ty + s * 0.05, s * 0.05, 0, TAU); ctx.arc(tx + s * 0.05, ty + s * 0.06, s * 0.05, 0, TAU); ctx.fill();
      break; }
    case 'pines': {
      sh(s * 0.42, s * 0.12);
      ctx.fillStyle = '#5a3d22'; ctx.fillRect(x - s * 0.05, y + s * 0.2, s * 0.1, s * 0.25);
      for (let i = 0; i < 3; i++) {
        const w = s * (0.3 + i * 0.1), yy = y - s * 0.6 + i * s * 0.26;
        ctx.fillStyle = i % 2 ? '#2a5a3e' : '#1f4a34'; poly(ctx, [[x, yy], [x + w, yy + s * 0.34], [x - w, yy + s * 0.34]]); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; poly(ctx, [[x, yy], [x + w * 0.55, yy + s * 0.19], [x + w * 0.1, yy + s * 0.15], [x - w * 0.25, yy + s * 0.22], [x - w * 0.55, yy + s * 0.19]]); ctx.fill();
      }
      break; }
    case 'dunes': {
      const w = s * (0.8 + r * 0.5), h = s * (0.3 + r * 0.14);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ell(ctx, x + s * 0.2, y + s * 0.3, w * 0.9, h * 0.35); ctx.fill();
      ctx.fillStyle = r > 0.5 ? '#c99a52' : '#d9ad66'; ctx.beginPath(); ctx.ellipse(x, y + s * 0.2, w, h, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = 'rgba(120,70,20,0.2)'; ctx.beginPath(); ctx.moveTo(x + w * 0.1, y + s * 0.2 - h * 0.95); ctx.quadraticCurveTo(x + w * 0.9, y + s * 0.2 - h * 0.5, x + w, y + s * 0.2); ctx.lineTo(x + w * 0.2, y + s * 0.2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,240,200,0.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y + s * 0.2, w * 0.95, h * 0.95, 0, Math.PI * 1.05, Math.PI * 1.45); ctx.stroke();
      break; }
    case 'trees': {
      sh(s * 0.42, s * 0.12);
      ctx.fillStyle = '#5a3d22'; ctx.fillRect(x - s * 0.06, y, s * 0.12, s * 0.42);
      const R = s * (0.36 + r * 0.1);
      const g = ctx.createRadialGradient(x - R * 0.3, y - s * 0.25, R * 0.1, x, y - s * 0.1, R * 1.1); g.addColorStop(0, r > 0.5 ? '#5fb24f' : '#4fa04a'); g.addColorStop(1, r > 0.5 ? '#2f6d2f' : '#245a2a');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - s * 0.1, R, 0, TAU); ctx.arc(x - R * 0.55, y, R * 0.6, 0, TAU); ctx.arc(x + R * 0.55, y, R * 0.6, 0, TAU); ctx.fill();
      break; }
    case 'crowd': {
      const cols = ['#e0603a', '#f2c14e', '#58c27d', '#b07be0', '#ef8fb5', '#4fc3d9', '#f5f1e8'];
      ctx.fillStyle = '#2d323c'; ctx.fillRect(x - s * 0.62, y - s * 0.06, s * 1.24, s * 0.52);
      ctx.fillStyle = '#3d4350'; ctx.fillRect(x - s * 0.62, y - s * 0.06, s * 1.24, s * 0.08);
      for (let k = 0; k < 2; k++) for (let i = 0; i < 5; i++) {
        const cx = x - s * 0.48 + i * s * 0.24 + k * s * 0.06, cy = y - s * 0.16 + k * s * 0.2 - (i % 2) * s * 0.04;
        const wave = Math.sin(t * 5 + i * 1.7 + k + r * 9) * s * 0.07;
        ctx.fillStyle = cols[Math.floor(hash(i * 7 + k * 3 + Math.floor(r * 1000)) * cols.length)]; ell(ctx, cx, cy + s * 0.07, s * 0.1, s * 0.09); ctx.fill();
        ctx.fillStyle = SKINS[(i + k * 2) % SKINS.length]; ctx.beginPath(); ctx.arc(cx, cy - s * 0.02, s * 0.065, 0, TAU); ctx.fill();
        ctx.strokeStyle = SKINS[(i + k * 2) % SKINS.length]; ctx.lineWidth = Math.max(1.5, s * 0.035); ctx.beginPath(); ctx.moveTo(cx + s * 0.08, cy + s * 0.04); ctx.lineTo(cx + s * 0.12 + wave, cy - s * 0.12); ctx.stroke();
      }
      break; }
    case 'fence': {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x - s * 0.6, y + s * 0.04, s * 1.2, s * 0.06);
      ctx.strokeStyle = '#e8e1cd'; ctx.lineWidth = Math.max(2, s * 0.06);
      for (const dy of [-0.14, 0.0]) { ctx.beginPath(); ctx.moveTo(x - s * 0.6, y + s * dy); ctx.lineTo(x + s * 0.6, y + s * dy); ctx.stroke(); }
      ctx.strokeStyle = '#a8977a'; ctx.lineWidth = Math.max(3, s * 0.08);
      for (const dx of [-0.55, -0.18, 0.18, 0.55]) { ctx.beginPath(); ctx.moveTo(x + s * dx, y - s * 0.22); ctx.lineTo(x + s * dx, y + s * 0.1); ctx.stroke(); }
      break; }
    case 'windmill': {
      s *= 0.7;
      sh(s * 0.5, s * 0.12);
      ctx.fillStyle = '#e8dcc4'; poly(ctx, [[x - s * 0.28, y + s * 0.4], [x + s * 0.28, y + s * 0.4], [x + s * 0.17, y - s * 0.3], [x - s * 0.17, y - s * 0.3]]); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; poly(ctx, [[x + s * 0.02, y + s * 0.4], [x + s * 0.28, y + s * 0.4], [x + s * 0.17, y - s * 0.3], [x + s * 0.02, y - s * 0.3]]); ctx.fill();
      ctx.fillStyle = '#7a3a2a'; poly(ctx, [[x - s * 0.22, y - s * 0.3], [x + s * 0.22, y - s * 0.3], [x, y - s * 0.52]]); ctx.fill();
      ctx.fillStyle = '#5a3d22'; ctx.fillRect(x - s * 0.06, y + s * 0.2, s * 0.12, s * 0.2);
      const rot = t * 0.5 + r * 6;
      ctx.strokeStyle = '#5a4a38'; ctx.lineWidth = Math.max(2, s * 0.05);
      for (let i = 0; i < 4; i++) {
        const a = rot + (i * Math.PI) / 2;
        ctx.beginPath(); ctx.moveTo(x, y - s * 0.34); ctx.lineTo(x + Math.cos(a) * s * 0.75, y - s * 0.34 + Math.sin(a) * s * 0.75); ctx.stroke();
        ctx.fillStyle = 'rgba(250,245,230,0.9)'; poly(ctx, [[x + Math.cos(a) * s * 0.28, y - s * 0.34 + Math.sin(a) * s * 0.28], [x + Math.cos(a) * s * 0.72, y - s * 0.34 + Math.sin(a) * s * 0.72], [x + Math.cos(a + 0.25) * s * 0.7, y - s * 0.34 + Math.sin(a + 0.25) * s * 0.7], [x + Math.cos(a + 0.3) * s * 0.28, y - s * 0.34 + Math.sin(a + 0.3) * s * 0.28]]); ctx.fill();
      }
      break; }
    case 'huts': {
      sh(s * 0.45, s * 0.1);
      ctx.fillStyle = '#b79a6a'; ctx.fillRect(x - s * 0.3, y - s * 0.02, s * 0.6, s * 0.36);
      ctx.fillStyle = '#7a5a2a'; poly(ctx, [[x - s * 0.4, y], [x + s * 0.4, y], [x + s * 0.2, y - s * 0.34], [x - s * 0.2, y - s * 0.34]]); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x - s * 0.08, y + s * 0.12, s * 0.16, s * 0.22);
      break; }
    case 'banners': {
      ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = Math.max(3, s * 0.07); ctx.beginPath(); ctx.moveTo(x, y + s * 0.4); ctx.lineTo(x, y - s * 0.6); ctx.stroke();
      const cols = ['#e0603a', '#f2c14e', '#2d7bd6'];
      for (let i = 0; i < 3; i++) { const fl = Math.sin(t * 4 + i + r * 5) * s * 0.06; ctx.fillStyle = cols[i]; poly(ctx, [[x, y - s * 0.58 + i * s * 0.28], [x + s * 0.5 + fl, y - s * 0.52 + i * s * 0.28 + fl * 0.5], [x, y - s * 0.34 + i * s * 0.28]]); ctx.fill(); }
      break; }
    case 'rocks': {
      sh(s * 0.45, s * 0.1);
      for (let i = 0; i < 3; i++) { const cx = x + (i - 1) * s * 0.28, cy = y + (i % 2) * s * 0.1, rr = s * (0.16 + 0.07 * hash(i + Math.floor(r * 100))); ctx.fillStyle = i % 2 ? '#8a8f99' : '#9aa0aa'; ell(ctx, cx, cy, rr * 1.2, rr); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ell(ctx, cx - rr * 0.3, cy - rr * 0.3, rr * 0.5, rr * 0.35); ctx.fill(); }
      break; }
    default: break;
  }
}

// Surface mark in the lane area (ripples, scratches, speckles, snow flecks, grass ticks), s = size, r = 0..1.
export function texture(ctx, terrain, x, y, s, r, col, t = 0) {
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(1.5, s * 0.05); ctx.lineCap = 'round';
  switch (terrain) {
    case 'water': {
      const w = s * (0.3 + r * 0.35), a = 0.35 + 0.25 * Math.sin(t * 2 + r * 9);
      ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x, y - s * 0.12, x + w, y); ctx.stroke(); ctx.globalAlpha = 1; break; }
    case 'ice': ctx.beginPath(); ctx.moveTo(x - s * 0.4, y); ctx.lineTo(x + s * (0.1 + r * 0.5), y + s * 0.05 * (r - 0.5)); ctx.stroke(); if (r > 0.7) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s * 0.12, y - s * 0.18); ctx.stroke(); } break;
    case 'sand': ctx.beginPath(); ctx.arc(x, y, s * 0.03 + r * s * 0.035, 0, TAU); ctx.fill(); if (r > 0.6) { ctx.beginPath(); ctx.moveTo(x - s * 0.25, y); ctx.quadraticCurveTo(x, y - s * 0.08, x + s * 0.25, y); ctx.stroke(); } break;
    case 'mud': ctx.beginPath(); ell(ctx, x, y, s * (0.1 + r * 0.14), s * (0.05 + r * 0.05)); ctx.fill(); break;
    case 'snow': ctx.beginPath(); ctx.ellipse(x, y, s * 0.2, s * 0.06, 0, 0, TAU); ctx.fill(); break;
    case 'track': ctx.beginPath(); ctx.arc(x, y, s * 0.04 + r * s * 0.03, 0, TAU); ctx.fill(); break;
    default: ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r - 0.5) * s * 0.2, y - s * 0.22); ctx.stroke(); break;
  }
}

// ---- competitors ------------------------------------------------------------------------------------------------------
// ph = stride phase (radians, tied to distance covered), ex = { lean, trim, gallop, whip, look, v (0..1 of top speed), t, push, num }
const softShadow = (ctx, x, y, rx, ry, a = 0.28) => { ctx.fillStyle = `rgba(0,0,0,${(a * 0.6).toFixed(3)})`; ell(ctx, x, y, rx, ry); ctx.fill(); };
const capsuleH = (ctx, x0, x1, y, h) => { ctx.beginPath(); ctx.moveTo(x0 + h / 2, y - h / 2); ctx.lineTo(x1 - h / 2, y - h / 2); ctx.arc(x1 - h / 2, y, h / 2, -Math.PI / 2, Math.PI / 2); ctx.lineTo(x0 + h / 2, y + h / 2); ctx.arc(x0 + h / 2, y, h / 2, Math.PI / 2, Math.PI * 1.5); ctx.closePath(); };
const person = (ctx, x, y, s, shirt, skin, hat, arms = 0, lean = 0) => {
  // top view: shoulders across, head on top, optional arms reaching forward by `arms`
  ctx.fillStyle = shade(shirt, -0.18); ell(ctx, x - s * 0.02, y + lean, s * 0.1, s * 0.2); ctx.fill();
  ctx.fillStyle = shirt; ell(ctx, x, y + lean, s * 0.1, s * 0.19); ctx.fill();
  if (arms) { ctx.strokeStyle = skin; ctx.lineWidth = Math.max(2, s * 0.07); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + s * 0.02, y + lean - s * 0.14); ctx.lineTo(x + s * 0.2 * arms, y + lean - s * 0.2); ctx.moveTo(x + s * 0.02, y + lean + s * 0.14); ctx.lineTo(x + s * 0.2 * arms, y + lean + s * 0.2); ctx.stroke(); }
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(x + s * 0.06, y + lean, s * 0.08, 0, TAU); ctx.fill();
  ctx.fillStyle = hat; ctx.beginPath(); ctx.arc(x + s * 0.045, y + lean, s * 0.075, Math.PI * 0.55, Math.PI * 1.45, true); ctx.fill();
};

export function racer(ctx, kind, x, y, ang, s, col, ph, ex = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const v = ex.v ?? 0.5, t = ex.t ?? 0, id = ex.id ?? 0;
  switch (kind) {
    case 'paddle': {
      const look = ex.look ?? 'longboat';
      const len = look === 'pirogue' ? 1.35 : 1.75, wid = look === 'pirogue' ? 0.36 : 0.26;
      // soft shadow on the water and the foam of the bow wave
      softShadow(ctx, s * 0.1, s * 0.16, s * (len + 0.05), s * (wid + 0.16), 0.22);
      if (v > 0.2) { ctx.strokeStyle = `rgba(255,255,255,${0.25 + v * 0.45})`; ctx.lineWidth = Math.max(1.5, s * 0.05); ctx.beginPath(); ctx.moveTo(s * (len - 0.1), 0); ctx.lineTo(s * (len - 0.9), -s * (wid + 0.22 + v * 0.18)); ctx.moveTo(s * (len - 0.1), 0); ctx.lineTo(s * (len - 0.9), s * (wid + 0.22 + v * 0.18)); ctx.stroke(); }
      // hull
      ctx.beginPath();
      ctx.moveTo(s * len, 0);
      ctx.bezierCurveTo(s * len * 0.5, -s * wid * 1.15, -s * len * 0.6, -s * wid * 1.05, -s * len, -s * wid * (look === 'pirogue' ? 0.9 : 0.35));
      ctx.lineTo(-s * len, s * wid * (look === 'pirogue' ? 0.9 : 0.35));
      ctx.bezierCurveTo(-s * len * 0.6, s * wid * 1.05, s * len * 0.5, s * wid * 1.15, s * len, 0);
      ctx.closePath();
      const hg = ctx.createLinearGradient(0, -s * wid, 0, s * wid); hg.addColorStop(0, shade(col, 0.28)); hg.addColorStop(0.5, col); hg.addColorStop(1, shade(col, -0.38));
      ctx.fillStyle = hg; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = Math.max(1.5, s * 0.04); ctx.stroke();
      // inside of the boat and decoration
      ctx.fillStyle = shade(col, -0.45); capsuleH(ctx, -s * (len - 0.2), s * (len - 0.25), 0, s * wid * 1.0); ctx.fill();
      ctx.fillStyle = '#c9a368'; for (let i = 0; i < 6; i++) ctx.fillRect(s * (-len * 0.7 + i * len * 0.28), -s * wid * 0.62, s * 0.05, s * wid * 1.24);
      if (look === 'pirogue') {
        const bands = ['#f2c14e', '#e0603a', '#2e8b57', '#f5f1e8'];
        for (let i = 0; i < 7; i++) { ctx.fillStyle = bands[i % bands.length]; ctx.fillRect(s * (-len * 0.78 + i * len * 0.24), -s * wid * 0.98 + (i % 2) * 0, s * len * 0.12, s * 0.07); ctx.fillRect(s * (-len * 0.78 + i * len * 0.24), s * wid * 0.91, s * len * 0.12, s * 0.07); }
      } else {
        ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = Math.max(2, s * 0.06); ctx.beginPath(); ctx.moveTo(-s * len * 0.85, -s * wid * 0.55); ctx.lineTo(s * len * 0.8, -s * wid * 0.45); ctx.moveTo(-s * len * 0.85, s * wid * 0.55); ctx.lineTo(s * len * 0.8, s * wid * 0.45); ctx.stroke();
        // raised, curled prow and stern
        ctx.fillStyle = '#7a1f2a'; poly(ctx, [[s * len, 0], [s * (len - 0.3), -s * 0.11], [s * (len - 0.3), s * 0.11]]); ctx.fill();
        ctx.fillStyle = '#f2c14e'; ctx.beginPath(); ctx.arc(s * (len + 0.02), 0, s * 0.07, 0, TAU); ctx.fill();
      }
      // paddlers: shoulders, head, two arms and a paddle whose blade swings in alternation
      const n = look === 'pirogue' ? 4 : 5;
      for (let i = 0; i < n; i++) {
        const bx = s * (len * 0.62 - (i * len * 1.25) / (n - 1) * 0.98), side = i % 2 ? 1 : -1;
        const sw = Math.sin(ph + (i % 2) * Math.PI);
        const reach = sw * s * 0.32;
        const shirt = look === 'pirogue' ? ['#f2c14e', '#e0603a', '#58c27d', '#4fc3d9'][i % 4] : SHIRTS[(i + id) % SHIRTS.length];
        // paddle shaft from the hands out to the water and its blade
        ctx.strokeStyle = '#d9c28a'; ctx.lineWidth = Math.max(2, s * 0.06);
        const hx = bx + s * 0.04, hy = side * s * wid * 0.3;
        const tipX = bx + reach, tipY = side * (s * (wid + 0.62));
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tipX, tipY); ctx.stroke();
        const inWater = sw > 0.15;
        ctx.fillStyle = inWater ? '#7a4a1a' : '#a97b3c'; ell(ctx, tipX, tipY + side * s * 0.05, s * 0.13, s * 0.06, 0.2); ctx.fill();
        if (inWater && sw > 0.5) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(1.5, s * 0.04); const rr0 = s * (0.1 + (sw - 0.5) * 0.18); ctx.beginPath(); ctx.arc(tipX - s * 0.08, tipY + side * s * 0.1, rr0, side > 0 ? 0.3 : Math.PI + 0.3, side > 0 ? 2.8 : Math.PI + 2.8); ctx.stroke(); }
        person(ctx, bx, 0, s, shirt, SKINS[(i + id) % SKINS.length], look === 'pirogue' ? '#2a2a2a' : (i % 2 ? '#f5f1e8' : '#3a3a40'), 1.0 + sw * 0.3, side * s * 0.04 * sw);
      }
      break; }
    case 'runner': {
      const sw = Math.sin(ph), look = ex.look;
      if (look === 'stilt') {
        // long stilts: shadows of the poles trail on the ground, feet sit on small steps
        for (const d of [-1, 1]) {
          const fx = d * Math.sin(ph) * s * 0.55;
          ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = Math.max(2, s * 0.08); ctx.beginPath(); ctx.moveTo(fx - s * 0.1, d * s * 0.2 + s * 0.15); ctx.lineTo(fx + s * 0.45, d * s * 0.2 + s * 0.36); ctx.stroke();
          ctx.strokeStyle = '#8a6a34'; ctx.lineWidth = Math.max(3.5, s * 0.14); ctx.beginPath(); ctx.moveTo(fx - s * 0.2, d * s * 0.2); ctx.lineTo(fx + s * 0.55, d * s * 0.2 - s * 0.1 * (1 - Math.abs(Math.sin(ph)))); ctx.stroke();
          ctx.fillStyle = '#3a2a18'; ell(ctx, fx, d * s * 0.2, s * 0.22, s * 0.11); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ell(ctx, fx - s * 0.05, d * s * 0.2 - s * 0.03, s * 0.1, s * 0.04); ctx.fill();
        }
      } else {
        softShadow(ctx, s * 0.05, s * 0.12, s * 0.5, s * 0.34);
        ctx.fillStyle = '#2a2a2a';
        for (const d of [-1, 1]) { ell(ctx, d * sw * s * 0.5, d * s * 0.16, s * 0.28, s * 0.12); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ell(ctx, d * sw * s * 0.5 - s * 0.05, d * s * 0.16 - s * 0.03, s * 0.12, s * 0.04); ctx.fill(); ctx.fillStyle = '#2a2a2a'; }
      }
      // torso, arms swinging against the legs, head with hair
      ctx.strokeStyle = SKINS[id % SKINS.length]; ctx.lineWidth = Math.max(2.5, s * 0.1);
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, d * s * 0.3); ctx.lineTo(-d * sw * s * 0.4 + s * 0.12, d * s * 0.5); ctx.stroke(); }
      const tg = ctx.createLinearGradient(0, -s * 0.38, 0, s * 0.38); tg.addColorStop(0, shade(col, 0.25)); tg.addColorStop(1, shade(col, -0.3));
      ctx.fillStyle = tg; ell(ctx, 0, 0, s * 0.24, s * 0.38); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ell(ctx, -s * 0.04, -s * 0.12, s * 0.1, s * 0.12); ctx.fill();
      ctx.fillStyle = SKINS[id % SKINS.length]; ctx.beginPath(); ctx.arc(s * 0.22, 0, s * 0.17, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.arc(s * 0.19, 0, s * 0.16, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
      break; }
    case 'skater': {
      const sw = Math.sin(ph), push = ex.push ?? 0;
      softShadow(ctx, s * 0.05, s * 0.12, s * 0.6, s * 0.3, 0.2);
      // skates: long blades, one gliding and one pushing out to the side
      for (const d of [-1, 1]) {
        const ex0 = -s * 0.5 - (d * sw > 0 ? Math.abs(sw) * s * 0.35 : 0), lat = d * (s * 0.2 + Math.max(0, d * sw) * s * 0.18);
        ctx.strokeStyle = 'rgba(235,245,255,0.95)'; ctx.lineWidth = Math.max(2, s * 0.05); ctx.beginPath(); ctx.moveTo(ex0, lat); ctx.lineTo(s * 0.62, lat); ctx.stroke();
        ctx.strokeStyle = shade(col, -0.35); ctx.lineWidth = Math.max(3, s * 0.1); ctx.beginPath(); ctx.moveTo(ex0 + s * 0.15, lat); ctx.lineTo(s * 0.4, lat); ctx.stroke();
      }
      // body leaning into the stroke, hands clasped behind the back
      const lean = sw * s * 0.08;
      const tg = ctx.createLinearGradient(0, -s * 0.3, 0, s * 0.3); tg.addColorStop(0, shade(col, 0.25)); tg.addColorStop(1, shade(col, -0.3));
      ctx.fillStyle = tg; ell(ctx, 0, lean, s * 0.42, s * 0.26); ctx.fill();
      ctx.strokeStyle = shade(col, -0.2); ctx.lineWidth = Math.max(2.5, s * 0.08); ctx.beginPath(); ctx.moveTo(s * 0.1, lean - s * 0.2); ctx.lineTo(-s * 0.32, lean * 0.4); ctx.lineTo(s * 0.1, lean + s * 0.2); ctx.stroke();
      ctx.fillStyle = '#c0392b'; ell(ctx, -s * 0.05, lean, s * 0.18, s * 0.1); ctx.fill();   // scarf
      ctx.strokeStyle = '#c0392b'; ctx.lineWidth = Math.max(2, s * 0.07); ctx.beginPath(); ctx.moveTo(-s * 0.1, lean); ctx.quadraticCurveTo(-s * 0.5, lean + Math.sin(ph * 2) * s * 0.12, -s * 0.78, lean + Math.sin(ph * 2 + 1) * s * 0.18); ctx.stroke();
      ctx.fillStyle = SKINS[id % SKINS.length]; ctx.beginPath(); ctx.arc(s * 0.32, lean, s * 0.15, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2a2f3a'; ctx.beginPath(); ctx.arc(s * 0.29, lean, s * 0.15, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
      void push;
      break; }
    case 'animal': {
      const look = ex.look ?? 'camel', g = ex.gallop ? 1 : 0.55;
      const legs = (bx, by, k, len, w, fur) => {
        // four feet alternating in a gallop sequence along the body; seen from above they flick out along x
        ctx.fillStyle = fur;
        const ox = [0.7, 0.5, -0.5, -0.7], ps = [0, 1.6, 3.1, 4.7];
        for (let i = 0; i < 4; i++) { const off = Math.sin(ph * 1.3 + ps[i]) * len * 0.36 * g; const side = i % 2 ? 1 : -1; ell(ctx, bx + ox[i] * len + off, by + side * w * 0.95, len * 0.2, w * 0.2); ctx.fill(); }
      };
      if (look === 'buffalo') {
        // two buffalo yoked together, a plough board behind them and the runner standing on it
        softShadow(ctx, -s * 0.1, s * 0.18, s * 1.6, s * 0.9, 0.22);
        const bu = (by, fur, k) => {
          legs(0, by, s * 0.8, s * 0.8, s * 0.24, '#1d1d22');
          const bg = ctx.createLinearGradient(0, by - s * 0.3, 0, by + s * 0.3); bg.addColorStop(0, shade(fur, 0.3)); bg.addColorStop(1, shade(fur, -0.35));
          ctx.fillStyle = bg; ell(ctx, 0, by, s * 0.82, s * 0.31); ctx.fill();
          ctx.fillStyle = shade(fur, 0.1); ell(ctx, s * 0.78, by + Math.sin(ph * 1.3 + k) * s * 0.03, s * 0.28, s * 0.2); ctx.fill();
          ctx.strokeStyle = '#d8d0b8'; ctx.lineWidth = Math.max(2, s * 0.06); ctx.beginPath(); ctx.arc(s * 0.82, by, s * 0.28, -1.3, -0.2); ctx.moveTo(s * 0.82 + 0, by); ctx.arc(s * 0.82, by, s * 0.28, 1.3, 0.2, true); ctx.stroke();
          ctx.strokeStyle = fur; ctx.lineWidth = Math.max(2, s * 0.06); ctx.beginPath(); ctx.moveTo(-s * 0.8, by); ctx.lineTo(-s * 1.0, by + Math.sin(ph * 2 + k) * s * 0.15); ctx.stroke();
        };
        bu(-s * 0.48, '#34353d', 0); bu(s * 0.48, '#3f4048', 1.5);
        ctx.strokeStyle = '#7a5a2a'; ctx.lineWidth = Math.max(3, s * 0.1); ctx.beginPath(); ctx.moveTo(s * 0.45, -s * 0.5); ctx.lineTo(s * 0.45, s * 0.5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s * 0.45, 0); ctx.lineTo(-s * 1.15, 0); ctx.stroke();
        ctx.fillStyle = '#6b4a2a'; ctx.fillRect(-s * 1.55, -s * 0.34, s * 0.5, s * 0.68);
        const sw = Math.sin(ph * 1.3);
        ctx.strokeStyle = '#e8e0cc'; ctx.lineWidth = Math.max(2, s * 0.05); ctx.beginPath(); ctx.moveTo(-s * 1.3, -s * 0.12); ctx.lineTo(s * 0.0, -s * 0.5); ctx.moveTo(-s * 1.3, s * 0.12); ctx.lineTo(s * 0.0, s * 0.5); ctx.stroke();
        person(ctx, -s * 1.3, 0, s * 1.2, col, SKINS[2], '#f5f1e8', 1.1, sw * s * 0.05);
        if (ex.whip) { ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-s * 1.9, (i - 1) * s * 0.3); ctx.lineTo(-s * 2.6, (i - 1) * s * 0.3); ctx.stroke(); } }
      } else if (look === 'dog') {
        // sled dogs in pairs on a gangline, sled and musher behind
        softShadow(ctx, -s * 0.2, s * 0.15, s * 1.9, s * 0.5, 0.2);
        const dg = (dx, dy, fur, k) => {
          legs(dx, dy, s * 0.42, s * 0.42, s * 0.14, '#2a2420');
          ctx.fillStyle = fur; ell(ctx, dx, dy, s * 0.36, s * 0.14); ctx.fill();
          ctx.fillStyle = shade(fur, 0.15); ell(ctx, dx + s * 0.38, dy + Math.sin(ph * 1.3 + k) * s * 0.025, s * 0.14, s * 0.1); ctx.fill();
          ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.moveTo(dx + s * 0.36, dy - s * 0.08); ctx.lineTo(dx + s * 0.28, dy - s * 0.16); ctx.lineTo(dx + s * 0.32, dy - s * 0.04); ctx.fill();
          ctx.strokeStyle = fur; ctx.lineWidth = Math.max(2, s * 0.05); ctx.beginPath(); ctx.moveTo(dx - s * 0.34, dy); ctx.quadraticCurveTo(dx - s * 0.5, dy + Math.sin(ph * 2 + k) * s * 0.1, dx - s * 0.55, dy - s * 0.08); ctx.stroke();
        };
        ctx.strokeStyle = '#bbb'; ctx.lineWidth = Math.max(1.5, s * 0.04); ctx.beginPath(); ctx.moveTo(-s * 0.9, 0); ctx.lineTo(s * 1.0, 0); ctx.stroke();
        dg(s * 0.9, -s * 0.2, '#e8e4d8', 0); dg(s * 0.9, s * 0.2, '#5a5048', 1); dg(s * 0.25, -s * 0.2, '#5a5048', 2); dg(s * 0.25, s * 0.2, '#d9d4c8', 3);
        ctx.fillStyle = '#7a5a3a'; ctx.fillRect(-s * 1.7, -s * 0.24, s * 0.85, s * 0.48);
        ctx.strokeStyle = '#3a3a40'; ctx.lineWidth = Math.max(2.5, s * 0.07); ctx.beginPath(); ctx.moveTo(-s * 1.75, -s * 0.3); ctx.lineTo(-s * 0.8, -s * 0.3); ctx.moveTo(-s * 1.75, s * 0.3); ctx.lineTo(-s * 0.8, s * 0.3); ctx.stroke();
        person(ctx, -s * 1.5, 0, s * 1.1, col, SKINS[0], '#3a3f4a', 0.9, 0);
      } else if (look === 'whippet') {
        softShadow(ctx, 0, s * 0.14, s * 0.8, s * 0.3, 0.22);
        const stretch = Math.sin(ph * 1.3) * s * 0.18 * g;
        // body stretches and gathers with the stride
        ctx.fillStyle = '#2a2420';
        for (const [ox, p0] of [[0.5, 0], [0.5, 0.6], [-0.4, 3.1], [-0.4, 3.7]]) { const off = Math.sin(ph * 1.3 + p0) * s * 0.4 * g; ell(ctx, ox * s + off, (p0 % 3.1 > 0.1 ? 1 : -1) * s * 0.1, s * 0.16, s * 0.045); ctx.fill(); }
        const bg = ctx.createLinearGradient(0, -s * 0.2, 0, s * 0.2); bg.addColorStop(0, '#d9c9a8'); bg.addColorStop(1, '#8a7656');
        ctx.fillStyle = bg; ell(ctx, stretch * 0.3, 0, s * (0.52 + stretch / s * 0.3), s * 0.17); ctx.fill();
        ctx.fillStyle = col; ell(ctx, -s * 0.05 + stretch * 0.3, 0, s * 0.3, s * 0.18); ctx.fill();   // racing jacket
        ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.max(8, Math.round(s * 0.2))}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(1 + (id % 6)), -s * 0.05 + stretch * 0.3, 0);
        ctx.fillStyle = '#c9b690'; ell(ctx, s * 0.6 + stretch * 0.4, 0, s * 0.19, s * 0.09); ctx.fill();
        ctx.strokeStyle = '#a89570'; ctx.lineWidth = Math.max(2, s * 0.045); ctx.beginPath(); ctx.moveTo(-s * 0.5, 0); ctx.quadraticCurveTo(-s * 0.8, Math.sin(ph * 2) * s * 0.1, -s * 0.95, 0); ctx.stroke();
        ctx.fillStyle = '#6b5a3c'; ctx.beginPath(); ctx.moveTo(s * 0.55 + stretch * 0.4, -s * 0.08); ctx.lineTo(s * 0.4 + stretch * 0.4, -s * 0.2 - Math.sin(ph * 2) * s * 0.04); ctx.lineTo(s * 0.45 + stretch * 0.4, -s * 0.04); ctx.fill();
      } else {
        // camel with a rider: hump, neck stretched forward, legs flicking, silk and headscarf
        softShadow(ctx, s * 0.05, s * 0.18, s * 1.25, s * 0.5, 0.22);
        legs(0, 0, s * 0.95, s * 0.95, s * 0.28, '#6b4a2a');
        const bg = ctx.createLinearGradient(0, -s * 0.38, 0, s * 0.38); bg.addColorStop(0, '#d8b480'); bg.addColorStop(1, '#8a6a3a');
        ctx.fillStyle = bg; ell(ctx, 0, 0, s * 0.92, s * 0.36); ctx.fill();
        ctx.strokeStyle = '#b08a5a'; ctx.lineWidth = Math.max(4, s * 0.2); ctx.beginPath(); ctx.moveTo(s * 0.7, 0); ctx.quadraticCurveTo(s * 1.15, Math.sin(ph * 1.3) * s * 0.1, s * 1.5, Math.sin(ph * 1.3 + 1) * s * 0.06); ctx.stroke();
        ctx.fillStyle = '#c9a070'; ell(ctx, s * 1.62, Math.sin(ph * 1.3 + 1) * s * 0.06, s * 0.2, s * 0.13); ctx.fill();
        ctx.fillStyle = '#8f6b3e'; ell(ctx, s * 0.12, 0, s * 0.3, s * 0.3); ctx.fill();   // hump
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; ell(ctx, s * 0.05, -s * 0.1, s * 0.14, s * 0.1); ctx.fill();
        ctx.fillStyle = col; ell(ctx, s * 0.05, 0, s * 0.2, s * 0.26); ctx.fill();   // rider's silks
        ctx.fillStyle = '#f5f1e8'; ctx.beginPath(); ctx.arc(s * 0.18, 0, s * 0.11, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#a02c2c'; ctx.lineWidth = Math.max(2, s * 0.05); ctx.beginPath(); ctx.arc(s * 0.18, 0, s * 0.1, Math.PI * 0.6, Math.PI * 1.4); ctx.stroke();
        ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = Math.max(2, s * 0.05); ctx.beginPath(); ctx.moveTo(-s * 0.85, 0); ctx.lineTo(-s * 1.0, Math.sin(ph * 2) * s * 0.12); ctx.stroke();
      }
      if (ex.whip && look !== 'buffalo') { ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-s * 1.3, (i - 1) * s * 0.3); ctx.lineTo(-s * 2.0, (i - 1) * s * 0.3); ctx.stroke(); } }
      break; }
    case 'sailor': {
      const a = (ex.trim ?? 0) * 0.9;
      softShadow(ctx, -s * 0.1, s * 0.16, s * 1.3, s * 0.4, 0.22);
      if (v > 0.2) { ctx.strokeStyle = `rgba(255,255,255,${0.2 + v * 0.4})`; ctx.lineWidth = Math.max(1.5, s * 0.05); ctx.beginPath(); ctx.moveTo(s * 1.2, 0); ctx.lineTo(s * 0.4, -s * (0.45 + v * 0.15)); ctx.moveTo(s * 1.2, 0); ctx.lineTo(s * 0.4, s * (0.45 + v * 0.15)); ctx.stroke(); }
      const hg = ctx.createLinearGradient(0, -s * 0.35, 0, s * 0.35); hg.addColorStop(0, shade(col, 0.3)); hg.addColorStop(0.5, col); hg.addColorStop(1, shade(col, -0.4));
      ctx.fillStyle = hg; ctx.beginPath(); ctx.moveTo(s * 1.35, 0); ctx.quadraticCurveTo(s * 0.5, s * 0.42, -s * 1.0, s * 0.3); ctx.lineTo(-s * 1.0, -s * 0.3); ctx.quadraticCurveTo(s * 0.5, -s * 0.42, s * 1.35, 0); ctx.fill();
      ctx.fillStyle = '#c9a368'; capsuleH(ctx, -s * 0.8, s * 0.9, 0, s * 0.3); ctx.fill();
      ctx.fillStyle = '#f2c14e'; ctx.fillRect(-s * 0.95, -s * 0.05, s * 1.9, s * 0.04);
      // lateen sail: a long yard angled by the trim, sail billowing to leeward with fold lines
      const mx = s * 0.25, yardL = s * 1.9;
      const ex2 = mx - Math.cos(a) * yardL * 0.55, ey2 = Math.sin(a) * yardL * 0.55;
      const bx = mx + Math.cos(a) * yardL * 0.42, by = -Math.sin(a) * yardL * 0.42;
      const bil = s * 0.35 * (0.5 + 0.5 * Math.abs(Math.sin(t * 2)));
      const dxs = ex2 - bx, dys = ey2 - by, ln = Math.hypot(dxs, dys) || 1;
      const side = a >= 0 ? 1 : -1, bulge = s * 0.55 + bil;
      const cxs = (bx + ex2) / 2 + (-dys / ln) * bulge * side, cys = (by + ey2) / 2 + (dxs / ln) * bulge * side;
      ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.beginPath(); ctx.moveTo(bx + s * 0.06, by + s * 0.1); ctx.quadraticCurveTo(cxs + s * 0.06, cys + s * 0.1, ex2 + s * 0.06, ey2 + s * 0.1); ctx.closePath(); ctx.fill();
      const sg = ctx.createLinearGradient(bx, by, cxs, cys); sg.addColorStop(0, 'rgba(255,252,242,1)'); sg.addColorStop(1, 'rgba(226,218,198,0.98)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(cxs, cys, ex2, ey2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(160,150,130,0.6)'; ctx.lineWidth = 1.2;
      for (let i = 1; i < 4; i++) { const k = i / 4; const px = bx + dxs * k, py = by + dys * k, qx = px + (cxs - (bx + ex2) / 2) * 0.9 * (1 - Math.abs(k - 0.5) * 1.6), qy = py + (cys - (by + ey2) / 2) * 0.9 * (1 - Math.abs(k - 0.5) * 1.6); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(qx, qy); ctx.stroke(); }
      ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = Math.max(2.5, s * 0.07); ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex2, ey2); ctx.stroke();
      ctx.fillStyle = '#3a2a18'; ctx.beginPath(); ctx.arc(mx, 0, s * 0.07, 0, TAU); ctx.fill();
      person(ctx, -s * 0.7, 0, s * 1.0, '#e8e0cc', SKINS[2], '#f5f1e8', 0.6, 0);
      break; }
    case 'sled': {
      const tilt = (ex.lean ?? 0) * 0.35, look = ex.look;
      ctx.rotate(tilt);
      if (look === 'tumble') {
        // a runner tumbling downhill: limbs spin round the body
        const rot = ph * 1.4;
        softShadow(ctx, s * 0.05, s * 0.2, s * 0.7, s * 0.5, 0.25);
        ctx.save(); ctx.rotate(rot);
        ctx.strokeStyle = SKINS[id % SKINS.length]; ctx.lineWidth = Math.max(3, s * 0.12);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 0.55, -s * 0.3); ctx.moveTo(0, 0); ctx.lineTo(s * 0.5, s * 0.35); ctx.stroke();
        ctx.strokeStyle = shade(col, -0.3); ctx.lineWidth = Math.max(3, s * 0.14); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-s * 0.55, -s * 0.2); ctx.moveTo(0, 0); ctx.lineTo(-s * 0.5, s * 0.28); ctx.stroke();
        const tg = ctx.createLinearGradient(0, -s * 0.3, 0, s * 0.3); tg.addColorStop(0, shade(col, 0.3)); tg.addColorStop(1, shade(col, -0.25));
        ctx.fillStyle = tg; ell(ctx, 0, 0, s * 0.3, s * 0.38); ctx.fill();
        ctx.fillStyle = SKINS[id % SKINS.length]; ctx.beginPath(); ctx.arc(s * 0.3, 0, s * 0.15, 0, TAU); ctx.fill();
        ctx.restore();
      } else if (look === 'skijor') {
        // a skier on two long skis holding a line to the horse that pulls
        softShadow(ctx, s * 0.5, s * 0.14, s * 1.2, s * 0.3, 0.14);
        ctx.strokeStyle = '#8a8f99'; ctx.lineWidth = Math.max(1.5, s * 0.04); ctx.beginPath(); ctx.moveTo(-s * 0.2, 0); ctx.lineTo(s * 1.2, 0); ctx.stroke();
        // horse seen from above
        ctx.fillStyle = '#4a3326'; ell(ctx, s * 1.6, 0, s * 0.55, s * 0.2); ctx.fill();
        ctx.fillStyle = '#3a281c'; ell(ctx, s * 2.1, Math.sin(ph * 1.3) * s * 0.03, s * 0.2, s * 0.1); ctx.fill();
        ctx.fillStyle = '#2a1a10'; for (const [ox, p0] of [[1.95, 0], [1.95, 1.2], [1.2, 3.1], [1.2, 4.3]]) { ell(ctx, s * ox + Math.sin(ph * 1.5 + p0) * s * 0.18, (p0 % 3.1 > 0.1 ? 1 : -1) * s * 0.14, s * 0.13, s * 0.04); ctx.fill(); }
        ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = Math.max(2, s * 0.05); ctx.beginPath(); ctx.moveTo(s * 1.05, 0); ctx.quadraticCurveTo(s * 0.8, Math.sin(ph * 2) * s * 0.1, s * 0.7, 0); ctx.stroke();
        for (const d of [-1, 1]) { ctx.strokeStyle = '#2a2f3a'; ctx.lineWidth = Math.max(3, s * 0.07); ctx.beginPath(); ctx.moveTo(-s * 0.7, d * s * 0.22); ctx.lineTo(s * 0.6, d * s * 0.22); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-s * 0.7, d * s * 0.2); ctx.lineTo(s * 0.6, d * s * 0.2); ctx.stroke(); }
        ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = Math.max(2, s * 0.04); const pk = Math.sin(ph) * s * 0.1;
        ctx.beginPath(); ctx.moveTo(s * 0.1, -s * 0.12); ctx.lineTo(-s * 0.5 + pk, -s * 0.55); ctx.moveTo(s * 0.1, s * 0.12); ctx.lineTo(-s * 0.5 - pk, s * 0.55); ctx.stroke();
        const tg = ctx.createLinearGradient(0, -s * 0.2, 0, s * 0.2); tg.addColorStop(0, shade(col, 0.25)); tg.addColorStop(1, shade(col, -0.3));
        ctx.fillStyle = tg; ell(ctx, 0, 0, s * 0.3, s * 0.2); ctx.fill();
        ctx.fillStyle = '#f5f1e8'; ctx.beginPath(); ctx.arc(s * 0.2, 0, s * 0.11, 0, TAU); ctx.fill();
      } else {
        softShadow(ctx, 0, s * 0.14, s * 0.9, s * 0.42, 0.25);
        ctx.strokeStyle = '#8a8f99'; ctx.lineWidth = Math.max(2, s * 0.1);
        ctx.beginPath(); ctx.moveTo(-s * 0.8, -s * 0.34); ctx.lineTo(s * 0.8, -s * 0.34); ctx.moveTo(-s * 0.8, s * 0.34); ctx.lineTo(s * 0.8, s * 0.34); ctx.stroke();
        const bg = ctx.createLinearGradient(0, -s * 0.3, 0, s * 0.3); bg.addColorStop(0, shade(col, 0.3)); bg.addColorStop(1, shade(col, -0.35));
        ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(s * 1.0, 0); ctx.quadraticCurveTo(s * 0.5, s * 0.34, -s * 0.7, s * 0.28); ctx.lineTo(-s * 0.7, -s * 0.28); ctx.quadraticCurveTo(s * 0.5, -s * 0.34, s * 1.0, 0); ctx.fill();
        ctx.fillStyle = '#f5f1e8'; ctx.beginPath(); ctx.arc(-s * 0.05, 0, s * 0.2, 0, TAU); ctx.fill();
      }
      break; }
    default: break;
  }
  ctx.restore();
}

// ---- surface effects --------------------------------------------------------------------------------------------------
// Trail behind a racer, in world space so it scrolls with the course: foam on water, snow/ice spray, dust elsewhere.
// pts = [[x, y], ...] from the racer backwards; v = 0..1
export function trail(ctx, terrain, pts, size, v, vehicle) {
  if (pts.length < 2 || v < 0.15) return;
  const wet = terrain === 'water';
  const col = wet ? '255,255,255' : terrain === 'snow' ? '245,250,255' : terrain === 'ice' ? '230,244,255' : terrain === 'mud' ? '110,80,50' : terrain === 'sand' ? '235,205,150' : terrain === 'track' ? '220,170,130' : '230,235,210';
  if (wet || terrain === 'ice') {
    // tapered wake ribbon
    ctx.fillStyle = `rgba(${col},${0.18 + v * 0.14})`;
    ctx.beginPath();
    pts.forEach(([x, y], i) => { const w = size * (0.15 + (i / pts.length) * (vehicle === 'paddle' ? 0.9 : 0.5)); ctx.lineTo(x, y - w); });
    for (let i = pts.length - 1; i >= 0; i--) { const [x, y] = pts[i]; const w = size * (0.15 + (i / pts.length) * (vehicle === 'paddle' ? 0.9 : 0.5)); ctx.lineTo(x, y + w); }
    ctx.closePath(); ctx.fill();
    if (terrain === 'ice') { ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }
  } else {
    for (let i = 1; i < pts.length; i++) {
      const k = i / pts.length, [x, y] = pts[i];
      const jx = (hash(i * 3 + 1) - 0.5) * size * 0.5 * k, jy = (hash(i * 5 + 2) - 0.5) * size * 0.7 * k;
      ctx.fillStyle = `rgba(${col},${(1 - k) * 0.35 * v})`; ctx.beginPath(); ctx.arc(x + jx, y + jy, size * (0.12 + k * 0.28), 0, TAU); ctx.fill();
    }
  }
}

// Speed lines at the sides of the view, strongest while a burst lasts. dir: 'up' or 'right' (the course's direction on screen)
export function speedLines(ctx, rect, dir, amount, scroll, col = '255,255,255') {
  if (amount < 0.05) return;
  const n = Math.round(8 + amount * 10);
  ctx.save(); ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const lh = hash(i * 7 + 1), lat = i % 2 ? lh * 0.2 : 1 - lh * 0.2, pos = ((hash(i * 11 + 3) + scroll * (0.8 + hash(i) * 1.2)) % 1 + 1) % 1;
    const len = (0.04 + hash(i * 13 + 5) * 0.07) * (0.5 + amount);
    ctx.strokeStyle = `rgba(${col},${0.08 + amount * 0.16})`; ctx.lineWidth = 1.2 + hash(i + 17) * 1.5;
    ctx.beginPath();
    if (dir === 'up') { const x = rect.x + lat * rect.w, y = rect.y + (1 - pos) * rect.h; ctx.moveTo(x, y); ctx.lineTo(x, y + len * rect.h); }
    else { const y = rect.y + lat * rect.h, x = rect.x + pos * rect.w; ctx.moveTo(x, y); ctx.lineTo(x - len * rect.w, y); }
    ctx.stroke();
  }
  ctx.restore();
}

// Finish gantry: two posts at the track edges, a checker banner and pennants. (x1,y1)-(x2,y2) is the line across the track.
export function gantry(ctx, x1, y1, x2, y2, w, t, label = 'FINISH', minFont = 0) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy, dx);
  const nx = -dy / len, ny = dx / len;             // normal on the "up" side
  const lift = Math.min(18, w * 1.2);              // the banner is overhead: offset it toward the viewer
  // the line itself: a checkered strip
  ctx.save(); ctx.translate(x1, y1); ctx.rotate(ang);
  const cell = Math.max(5, w * 0.5), rows = 2;
  for (let i = 0; i * cell < len; i++) for (let j = 0; j < rows; j++) { ctx.fillStyle = (i + j) % 2 ? '#111' : '#fff'; ctx.fillRect(i * cell, (j - 1) * cell, Math.min(cell, len - i * cell), cell); }
  ctx.restore();
  // posts with shadows
  for (const [px, py] of [[x1, y1], [x2, y2]]) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, px + 4, py + 4, w * 0.5, w * 0.35); ctx.fill();
    ctx.fillStyle = '#d9d2c0'; ctx.beginPath(); ctx.arc(px, py, w * 0.42, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(px + nx * lift, py + ny * lift, w * 0.3, 0, TAU); ctx.fill();
  }
  // overhead banner
  ctx.save(); ctx.translate(x1 + nx * lift, y1 + ny * lift); ctx.rotate(ang);
  const bh = Math.max(14, w * 0.9, minFont * 1.3);   // minFont: 11 css px in units, so the sign stays readable on small screens
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(2, -bh / 2 + 5, len, bh);
  ctx.fillStyle = '#f5f1e8'; ctx.fillRect(0, -bh / 2, len, bh);
  for (let i = 0; i * (bh / 2) < len; i++) for (let j = 0; j < 2; j++) { if ((i + j) % 2) { ctx.fillStyle = '#111'; ctx.fillRect(i * (bh / 2), -bh / 2 + j * (bh / 2), Math.min(bh / 2, len - i * (bh / 2)), bh / 2); } }
  ctx.fillStyle = 'rgba(200,40,40,0.95)'; ctx.fillRect(len * 0.25, -bh / 2, len * 0.5, bh);
  ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.round(Math.max(bh * 0.7, minFont))}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, len / 2, 1);
  // pennants along the top edge
  for (let i = 0; i < 8; i++) { const px = (len * (i + 0.5)) / 8, fl = Math.sin(t * 5 + i) * 2; ctx.fillStyle = ['#e0603a', '#f2c14e', '#58c27d', '#4fc3d9'][i % 4]; poly(ctx, [[px - 5, -bh / 2], [px + 5, -bh / 2], [px + fl, -bh / 2 - 12]]); ctx.fill(); }
  ctx.restore();
}

// Confetti shower from two cannons; k = seconds since the finish. Deterministic from the index. power 0..1 scales the amount.
export function confetti(ctx, rect, k, power = 1) {
  const n = Math.round(50 + 110 * power);
  const cols = ['#f2c14e', '#e0603a', '#58c27d', '#4fc3d9', '#ef8fb5', '#b07be0', '#ffffff'];
  ctx.save(); ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
  for (let i = 0; i < n; i++) {
    const side = i % 2, ox = rect.x + (side ? rect.w * 0.96 : rect.w * 0.04), oy = rect.y + rect.h * 0.62;
    const up = 420 + hash(i * 3 + 1) * 520, inward = (side ? -1 : 1) * (90 + hash(i * 5 + 2) * 380);
    const tt = k - hash(i * 9 + 6) * 0.25;
    if (tt < 0) continue;
    const drag = 1 - Math.exp(-tt * 0.9);
    const x = ox + (inward * drag) / 0.9 + Math.sin(tt * 4 + i) * 12;
    const y = oy - (up * drag) / 0.9 + 130 * tt * tt + tt * 70;
    if (y > rect.y + rect.h + 20) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(tt * (4 + hash(i) * 6) + i);
    ctx.scale(1, Math.cos(tt * 7 + i));
    ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-6, -3.5, 12, 7);
    ctx.restore();
  }
  ctx.restore();
}

export function checker(ctx, x, y, w, h, cell) {
  for (let i = 0; i * cell < w; i++) for (let j = 0; j * cell < h; j++) { ctx.fillStyle = (i + j) % 2 ? '#111' : '#fff'; ctx.fillRect(x + i * cell, y + j * cell, Math.min(cell, w - i * cell), Math.min(cell, h - j * cell)); }
}

// The lead object that runs ahead of the racers (course.lead). Drawn at (x, y), s = radius in px, +x = direction of travel.
// roll = rolling angle (radians, from distance covered), hop = 0..1 height of the current bounce, ex = { vehicle, fl }.
export function leadObject(ctx, kind, x, y, ang, s, color, roll, hop = 0, ex = {}) {
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const lift = hop * s * 0.55;
  // ground shadow stays on the ground while the body hops
  if (kind === 'hoop') { ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = Math.max(3, s * 0.3); ctx.beginPath(); ctx.arc(x + s * 0.15, y + s * 0.25, s * 0.82, 0, 7); ctx.stroke(); }
  else if (kind !== 'pacemaker') {
    ctx.fillStyle = 'rgba(0,0,0,' + (0.3 - hop * 0.12).toFixed(2) + ')';
    ctx.beginPath(); ctx.ellipse(x + s * 0.12, y + s * 0.2, s * (kind === 'lure' ? 0.6 : 1) * (1 - hop * 0.15), s * (kind === 'lure' ? 0.3 : 0.55) * (1 - hop * 0.15), 0, 0, 7); ctx.fill();
  }
  const bx = x - lift * 0.25, by = y - lift;
  switch (kind) {
    case 'cheese': {
      // a round of cheese seen face-on, turning as it rolls: rind, eyes and a cut wedge that shows it spinning
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(bx, by, s, 0, 7); ctx.fill();
      ctx.strokeStyle = '#b9791f'; ctx.lineWidth = Math.max(2, s * 0.2); ctx.beginPath(); ctx.arc(bx, by, s * 0.93, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(150,90,10,0.45)';
      for (let i = 0; i < 3; i++) { const a = roll + i * 2.1 + 0.4; ctx.beginPath(); ctx.arc(bx + Math.cos(a) * s * 0.5, by + Math.sin(a) * s * 0.5, s * (0.1 + 0.03 * i), 0, 7); ctx.fill(); }
      ctx.fillStyle = '#7a4d0c'; ctx.beginPath(); ctx.moveTo(bx, by); ctx.arc(bx, by, s * 0.96, roll, roll + 0.95); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffe7a3'; ctx.beginPath(); ctx.moveTo(bx, by); ctx.arc(bx, by, s * 0.72, roll + 0.08, roll + 0.87); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(1.5, s * 0.07); ctx.beginPath(); ctx.arc(bx, by, s * 0.6, 3.4, 4.3); ctx.stroke();
      break; }
    case 'hoop': {
      ctx.strokeStyle = color; ctx.lineWidth = Math.max(3, s * 0.3); ctx.beginPath(); ctx.arc(bx, by, s * 0.82, 0, 7); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = Math.max(1.5, s * 0.07); ctx.beginPath(); ctx.arc(bx, by, s * 0.82, roll, roll + 1.4); ctx.stroke();
      ctx.fillStyle = 'rgba(30,20,10,0.65)';
      for (let i = 0; i < 3; i++) { const a = roll + i * 2.094; ctx.beginPath(); ctx.arc(bx + Math.cos(a) * s * 0.82, by + Math.sin(a) * s * 0.82, s * 0.1, 0, 7); ctx.fill(); }
      break; }
    case 'ball': {
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(bx, by, s * 0.85, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(30,30,30,0.7)'; ctx.lineWidth = Math.max(2, s * 0.1);
      for (let i = 0; i < 3; i++) { const a = roll + i * 1.05; ctx.beginPath(); ctx.ellipse(bx, by, s * 0.85, s * 0.3, a, 0, 7); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(1.5, s * 0.08); ctx.beginPath(); ctx.arc(bx, by, s * 0.85, 3.6, 4.4); ctx.stroke();
      break; }
    case 'lure': {
      // a bright rag on a cord, streaming back from a short handle; the flutter follows distance
      const fl = ex.fl ?? 0;
      ctx.save(); ctx.translate(bx, by); ctx.rotate(ang);
      ctx.strokeStyle = '#5a3d22'; ctx.lineWidth = Math.max(2, s * 0.14); ctx.beginPath(); ctx.moveTo(s * 0.3, 0); ctx.lineTo(-s * 0.1, 0); ctx.stroke();
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-s * 0.1, -s * 0.12);
      for (let i = 1; i <= 4; i++) ctx.lineTo(-s * (0.1 + i * 0.5), -s * 0.12 + Math.sin(fl + i * 0.9) * s * 0.28 - i * s * 0.02);
      for (let i = 4; i >= 1; i--) ctx.lineTo(-s * (0.1 + i * 0.5), s * 0.5 + Math.sin(fl + i * 0.9 + 0.6) * s * 0.28);
      ctx.lineTo(-s * 0.1, s * 0.35); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.5, s * 0.06); ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.12); ctx.lineTo(-s * 1.8, s * 0.12 + Math.sin(fl + 2.5) * s * 0.2); ctx.stroke();
      ctx.restore();
      break; }
    case 'pacemaker': {
      // an extra craft of the same vehicle kind in a plain colour, with a white pennant on a mast
      racer(ctx, ex.vehicle ?? 'paddle', bx, by, ang, s, color, roll * 0.4, { lean: 0, trim: 0, gallop: true, whip: false, look: ex.look });
      ctx.save(); ctx.translate(bx, by); ctx.rotate(ang);
      ctx.strokeStyle = '#444'; ctx.lineWidth = Math.max(2, s * 0.08); ctx.beginPath(); ctx.moveTo(-s * 0.6, 0); ctx.lineTo(-s * 0.6, -s * 1.0); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-s * 0.6, -s * 1.0); ctx.lineTo(-s * 1.5, -s * 0.8); ctx.lineTo(-s * 0.6, -s * 0.6); ctx.closePath(); ctx.fill();
      ctx.restore();
      break; }
    default: break;
  }
  ctx.restore();
}

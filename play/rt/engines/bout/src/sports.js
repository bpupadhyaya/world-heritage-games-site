// Sport kits for the bout engine: each recognised tradition gets its own venue, dress and adornments, balance mark,
// emblem, impact effects and sounds, so games on this engine do not share one surface. Chosen from the game title
// (or params.scene); game folders do not change. Deterministic: hash of an index, no randomness, no assets.
import { hash, shade, mix, rgba } from './art.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rr = (ctx, x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
const ell = (ctx, x, y, rx, ry) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); };
const lin = (ctx, x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
const rad = (ctx, x, y, r0, r1, stops) => { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
const poly = (ctx, pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };

export const SPORTS = ['arnis', 'kotta', 'kushti', 'laamb', 'moraingy', 'nguni', 'silat', 'silambam'];
export function sportOf(P, title) {
  if (P.scene && SPORTS.includes(P.scene)) return P.scene;
  const t = `${title ?? ''}`.toLowerCase();
  if (/arnis|eskrima|kali\b|escrima/.test(t)) return 'arnis';
  if (/kotta|pillow|palayok/.test(t)) return 'kotta';
  if (/kushti|pehlwan|akhara|mud wrest/.test(t)) return 'kushti';
  if (/laamb|senegal/.test(t)) return 'laamb';
  if (/moraingy|madagascar/.test(t)) return 'moraingy';
  if (/nguni|stick.?fight|donga|zulu/.test(t)) return 'nguni';
  if (/silat/.test(t)) return 'silat';
  if (/silambam|silamba/.test(t)) return 'silambam';
  return null;
}

// ---- small shared pieces ------------------------------------------------------------------------------------------------
const SKIN = ['#e9bf94', '#c99366', '#8a5a3a', '#f0cfa8', '#6d4128'];
function sky(ctx, s, hy, a, b) { ctx.fillStyle = lin(ctx, 0, s.y, 0, hy, [[0, a], [1, b]]); ctx.fillRect(s.x, s.y, s.w, hy - s.y + 1); }
function ground(ctx, s, hy, a, b, c) { ctx.fillStyle = lin(ctx, 0, hy, 0, s.y + s.h, [[0, a], [0.45, b], [1, c]]); ctx.fillRect(s.x, hy, s.w, s.y + s.h - hy); }
function sun(ctx, s, hy, col = 'rgba(255,244,214,0.85)') { const x = s.x + s.w * 0.8, y = s.y + (hy - s.y) * 0.3; ctx.fillStyle = rad(ctx, x, y, 2, s.h * 0.4, [[0, col], [0.3, 'rgba(255,240,200,0.3)'], [1, 'rgba(255,240,200,0)']]); ctx.fillRect(s.x, s.y, s.w, hy - s.y); }
function palm(ctx, x, y, h, T, k, col = '#2f7a3a') {
  const sw = Math.sin(T * 0.9 + k) * h * 0.03;
  ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = Math.max(3, h * 0.06); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + h * 0.12, y - h * 0.5, x + h * 0.05 + sw, y - h); ctx.stroke();
  const tx = x + h * 0.05 + sw, ty = y - h; ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, h * 0.045);
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.62; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx + Math.cos(a) * h * 0.3, ty + Math.sin(a) * h * 0.2 - h * 0.08, tx + Math.cos(a) * h * 0.55, ty + Math.sin(a) * h * 0.4 + h * 0.18); ctx.stroke(); }
  ctx.lineCap = 'butt';
}
function ringDisc(ctx, mid, gy, rx, ry, fill, edge, grain = 90) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(ctx, mid, gy + ry * 0.25, rx * 1.05, ry * 1.12); ctx.fill();
  ell(ctx, mid, gy, rx, ry * 1.05); ctx.fillStyle = rad(ctx, mid - rx * 0.25, gy - ry * 0.3, 0, rx * 1.05, [[0, shade(fill, 0.2)], [0.7, fill], [1, shade(fill, -0.2)]]); ctx.fill();
  ctx.save(); ell(ctx, mid, gy, rx, ry * 1.05); ctx.clip();
  for (let i = 0; i < grain; i++) { const a = hash(i * 3) * TAU, d = Math.sqrt(hash(i * 5 + 1)); ctx.fillStyle = hash(i + 4) > 0.5 ? rgba(shade(fill, 0.35), 0.5) : rgba(shade(fill, -0.4), 0.4); ctx.fillRect(mid + Math.cos(a) * rx * d, gy + Math.sin(a) * ry * d * 1.05, 2, 1.2); }
  ctx.restore();
  if (edge) { ell(ctx, mid, gy, rx, ry * 1.05); ctx.lineWidth = Math.max(2.5, ry * 0.12); ctx.strokeStyle = edge; ctx.stroke(); }
}
function person(ctx, x, yb, sz, shirt, skin, T, k, pulse, seated, hat) {
  const bob = Math.sin(T * (2 + hash(k) * 2) + k) * sz * 0.08 + (pulse > 0 ? -Math.abs(Math.sin(T * 9 + k)) * sz * 0.35 * pulse : 0);
  ctx.fillStyle = shirt; rr(ctx, x - sz * 0.75, yb - sz * (seated ? 1.4 : 1.9) + bob, sz * 1.5, sz * (seated ? 1.5 : 2.4), sz * 0.55); ctx.fill();
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(x, yb - sz * (seated ? 1.7 : 2.2) + bob, sz * 0.6, 0, TAU); ctx.fill();
  if (hat === 'dark') { ctx.fillStyle = '#241814'; ctx.beginPath(); ctx.arc(x, yb - sz * (seated ? 1.8 : 2.3) + bob, sz * 0.62, Math.PI, TAU); ctx.fill(); }
  else if (hat === 'turban') { ctx.fillStyle = shirt; ctx.beginPath(); ctx.ellipse(x, yb - sz * (seated ? 1.95 : 2.45) + bob, sz * 0.7, sz * 0.38, 0, 0, TAU); ctx.fill(); }
  else if (hat === 'cap') { ctx.fillStyle = '#1e1e1e'; ctx.fillRect(x - sz * 0.62, yb - sz * (seated ? 2.1 : 2.6) + bob, sz * 1.24, sz * 0.4); }
  else { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(x, yb - sz * (seated ? 1.8 : 2.3) + bob, sz * 0.6, Math.PI, TAU); ctx.fill(); }
}
function rowOfPeople(ctx, x0, x1, yb, sz, rows, cols, T, pulse, o = {}) {
  const n = Math.max(3, Math.round((x1 - x0) / (sz * 1.7)));
  for (let r = rows - 1; r >= 0; r--) for (let i = 0; i < n; i++) {
    const x = x0 + ((i + 0.5 + (r % 2) * 0.5) / (n + 0.5)) * (x1 - x0) + (hash(i * 7 + r) - 0.5) * sz * 0.5;
    const k = i * 31 + r * 5 + (o.seed ?? 0);
    person(ctx, x, yb - r * sz * 0.85, sz * (1 - r * 0.04), cols[Math.floor(hash(k) * cols.length)], o.skins ? o.skins[Math.floor(hash(k + 3) * o.skins.length)] : SKIN[Math.floor(hash(k + 3) * SKIN.length)], T, k, pulse, o.seated ?? false, o.hats ? o.hats[Math.floor(hash(k + 8) * o.hats.length)] : null);
  }
}
function bunting(ctx, x0, x1, y, sag, cols, T, n = 12, size = 10) {
  ctx.strokeStyle = 'rgba(40,30,20,0.55)'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i <= 20; i++) { const t = i / 20; const x = x0 + (x1 - x0) * t, yy = y + Math.sin(t * Math.PI) * sag; i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); } ctx.stroke();
  for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, x = x0 + (x1 - x0) * t, yy = y + Math.sin(t * Math.PI) * sag, fl = Math.sin(T * 3 + i) * 1.5; ctx.fillStyle = cols[i % cols.length]; poly(ctx, [[x - size * 0.5, yy], [x + size * 0.5, yy], [x + fl, yy + size * 1.2]]); ctx.fill(); }
}
const hip = (ctx, x, y, w, h, roof, wall) => {   // simple hut with a pyramid roof
  ctx.fillStyle = wall; ctx.fillRect(x - w / 2, y - h * 0.55, w, h * 0.55);
  ctx.fillStyle = roof; poly(ctx, [[x - w * 0.62, y - h * 0.5], [x + w * 0.62, y - h * 0.5], [x + w * 0.12, y - h], [x - w * 0.12, y - h]]); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; for (let i = 1; i < 6; i++) { const t = i / 6; ctx.beginPath(); ctx.moveTo(x - w * 0.62 * (1 - t) - w * 0.12 * t, y - h * 0.5 - h * 0.5 * t); ctx.lineTo(x + w * 0.62 * (1 - t) + w * 0.12 * t, y - h * 0.5 - h * 0.5 * t); ctx.stroke(); }
};

// ---- venues ---------------------------------------------------------------------------------------------------------------
// Each draws sky, scenery, spectators, floor and the contest surface. g = stageGeo { gy, mid, rx, ry, H, hy }.
const VENUE = {
  // Philippine barrio yard: stilted nipa huts, palms, a volcano, a chalk circle on packed earth, villagers on a bamboo bench
  arnis(ctx, s, g, T, pulse) {
    const { hy, gy, mid, rx, ry, H } = g;
    sky(ctx, s, hy, '#bfe3f2', '#fff0cc'); sun(ctx, s, hy);
    ctx.fillStyle = mix('#7d97a8', '#fff0cc', 0.35); poly(ctx, [[s.x + s.w * 0.52, hy], [s.x + s.w * 0.7, hy - s.h * 0.34], [s.x + s.w * 0.88, hy]]); ctx.fill();
    for (let i = 0; i < 3; i++) { ctx.fillStyle = mix('#5f9a4a', '#fff0cc', 0.25 + i * 0.1); ctx.fillRect(s.x, hy - s.h * (0.045 - i * 0.012), s.w, s.h * 0.05); }
    for (const [fx0, sc] of [[0.1, 1], [0.9, 0.9], [0.38, 0.8]]) palm(ctx, s.x + s.w * fx0, hy - s.h * 0.02, s.h * 0.4 * sc, T, fx0 * 9);
    for (const fx0 of [0.2, 0.8]) {
      const x = s.x + s.w * fx0, w = s.w * 0.15, y = hy + s.h * 0.02, st = s.h * 0.1;
      ctx.fillStyle = '#6b4a2a'; for (const dx of [-0.42, 0.42]) ctx.fillRect(x + dx * w - 3, y - st, 6, st + 4);
      ctx.fillStyle = '#9a7a48'; ctx.fillRect(x - w / 2, y - st - 6, w, 7);
      ctx.fillStyle = '#d9b878'; ctx.fillRect(x - w * 0.44, y - st - s.h * 0.1, w * 0.88, s.h * 0.1);
      ctx.strokeStyle = 'rgba(90,60,20,0.45)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 1; i < 8; i++) { ctx.moveTo(x - w * 0.44 + i * w * 0.11, y - st - s.h * 0.1); ctx.lineTo(x - w * 0.44 + i * w * 0.11, y - st - 6); } ctx.stroke();
      ctx.fillStyle = '#6a4a22'; ctx.fillRect(x - w * 0.1, y - st - s.h * 0.075, w * 0.2, s.h * 0.065);
      ctx.fillStyle = '#b8903a'; poly(ctx, [[x - w * 0.62, y - st - s.h * 0.095], [x + w * 0.62, y - st - s.h * 0.095], [x + w * 0.2, y - st - s.h * 0.22], [x - w * 0.2, y - st - s.h * 0.22]]); ctx.fill();
      ctx.strokeStyle = 'rgba(70,45,10,0.5)'; ctx.beginPath(); for (let i = 1; i < 6; i++) { const t = i / 6; ctx.moveTo(x - w * (0.62 - 0.42 * t), y - st - s.h * (0.095 + 0.125 * t)); ctx.lineTo(x + w * (0.62 - 0.42 * t), y - st - s.h * (0.095 + 0.125 * t)); } ctx.stroke();
    }
    ground(ctx, s, hy, '#a8c070', '#b59a62', '#7a6238');
    // bamboo fence
    for (let i = 0; i < 26; i++) { const x = s.x + (s.w * (i + 0.5)) / 26; ctx.fillStyle = i % 2 ? '#c9b070' : '#b89c5a'; poly(ctx, [[x - 4, hy + s.h * 0.05], [x + 4, hy + s.h * 0.05], [x + 4, hy - s.h * 0.02], [x, hy - s.h * 0.045], [x - 4, hy - s.h * 0.02]]); ctx.fill(); }
    ctx.strokeStyle = '#7a5a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(s.x, hy + s.h * 0.0); ctx.lineTo(s.x + s.w, hy + s.h * 0.0); ctx.stroke();
    rowOfPeople(ctx, s.x + s.w * 0.05, s.x + s.w * 0.95, hy + s.h * 0.2, s.h * 0.032, 1, ['#f2ecdc', '#e8b030', '#4a8cc2', '#c25b4a', '#f7f1e3'], T, pulse, { seated: true });
    ctx.fillStyle = 'rgba(70,50,20,0.9)'; ctx.fillRect(s.x + s.w * 0.04, hy + s.h * 0.2, s.w * 0.92, 5);
    ringDisc(ctx, mid, gy, rx, ry, '#b79a62', null, 140);
    ell(ctx, mid, gy, rx * 0.98, ry * 1.02); ctx.lineWidth = Math.max(3, ry * 0.14); ctx.strokeStyle = 'rgba(255,252,240,0.92)'; ctx.stroke();
    // rack of spare rattan sticks leaning at the edge
    for (let i = 0; i < 5; i++) { ctx.strokeStyle = i % 2 ? '#c89a54' : '#a87a3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(s.x + s.w * 0.07 + i * 7, gy + ry * 1.8); ctx.lineTo(s.x + s.w * 0.07 + i * 7 + 18, gy - H * 0.2); ctx.stroke(); }
  },

  // Sri Lankan New Year: a log across a mud pit, festive garden pavilion, crowd around the rim
  kotta(ctx, s, g, T, pulse) {
    const { hy, gy, mid, rx, ry, H } = g;
    sky(ctx, s, hy, '#9ad8ec', '#fff3cf'); sun(ctx, s, hy);
    ctx.fillStyle = mix('#3f8a5a', '#fff3cf', 0.4); ctx.beginPath(); ctx.moveTo(s.x, hy); for (let i = 0; i <= 24; i++) ctx.lineTo(s.x + s.w * i / 24, hy - s.h * (0.07 + 0.05 * Math.sin(i * 0.7) + 0.02 * Math.sin(i * 2))); ctx.lineTo(s.x + s.w, hy); ctx.closePath(); ctx.fill();
    for (const [fx0, sc] of [[0.06, 1.05], [0.2, 0.8], [0.8, 0.85], [0.94, 1]]) palm(ctx, s.x + s.w * fx0, hy, s.h * 0.42 * sc, T, fx0 * 11, '#2f8a3a');
    // festival arch: a frame of areca trunks with strings of cut leaves, flower garland and an oil lamp
    const ax = s.x + s.w * 0.5, aw = s.w * 0.34, ah = s.h * 0.3;
    ctx.fillStyle = '#7a5a2a'; ctx.fillRect(ax - aw / 2, hy - ah, 6, ah); ctx.fillRect(ax + aw / 2 - 6, hy - ah, 6, ah); ctx.fillRect(ax - aw / 2, hy - ah, aw, 7);
    for (let i = 0; i < 16; i++) { const x = ax - aw / 2 + (aw * (i + 0.5)) / 16; ctx.fillStyle = ['#e8873a', '#f2c14e', '#d8453a', '#3fa856'][i % 4]; poly(ctx, [[x - 5, hy - ah + 7], [x + 5, hy - ah + 7], [x + Math.sin(T * 3 + i) * 1.5, hy - ah + 27]]); ctx.fill(); }
    ctx.fillStyle = '#f2c14e'; rr(ctx, ax - 22, hy - ah * 0.36, 44, 12, 5); ctx.fill();
    ctx.fillStyle = '#ffe9a0'; ell(ctx, ax, hy - ah * 0.36 - 7 + Math.sin(T * 8) * 0.8, 3, 7); ctx.fill();
    ground(ctx, s, hy, '#a0c070', '#b59a62', '#7a6238');
    rowOfPeople(ctx, s.x + s.w * 0.03, s.x + s.w * 0.97, hy + s.h * 0.17, s.h * 0.036, 2, ['#f4f0e4', '#d8453a', '#f2c14e', '#3fa856', '#c25b9a', '#2d7bd6'], T, pulse, {});
    // the pit: dark mud with shine and bubbles; the log on two A-frames over it
    const my = gy + H * 0.3;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, mid, my + ry * 0.4, rx * 1.2, ry * 1.5); ctx.fill();
    ell(ctx, mid, my, rx * 1.15, ry * 1.5); ctx.fillStyle = rad(ctx, mid - rx * 0.3, my - ry * 0.5, 0, rx * 1.2, [[0, '#8a5f3a'], [0.6, '#5e3f24'], [1, '#3e2814']]); ctx.fill();
    ctx.strokeStyle = '#c9a56a'; ctx.lineWidth = Math.max(3, ry * 0.15); ell(ctx, mid, my, rx * 1.15, ry * 1.5); ctx.stroke();
    for (let i = 0; i < 18; i++) { const a = hash(i * 3) * TAU, d = Math.sqrt(hash(i * 5 + 1)); const bx = mid + Math.cos(a) * rx * 1.0 * d, by = my + Math.sin(a) * ry * 1.3 * d, br = 2 + hash(i) * 4 + Math.sin(T * 2 + i) * 0.8; ctx.strokeStyle = 'rgba(255,230,190,0.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ell(ctx, mid - rx * 0.3, my - ry * 0.5, rx * 0.4, ry * 0.2); ctx.fill();
    const lr = ry * 0.85, len = rx * 1.05, cy = gy + lr * 0.55;
    for (const sx of [-1, 1]) { const px = mid + sx * len * 0.78; ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = Math.max(5, ry * 0.3); ctx.beginPath(); ctx.moveTo(px - 12 * sx, my + ry * 0.4); ctx.lineTo(px, cy + lr); ctx.lineTo(px + 12 * sx, my + ry * 0.4); ctx.stroke(); }
    ctx.fillStyle = lin(ctx, 0, cy - lr, 0, cy + lr, [[0, '#d8a868'], [0.45, '#a8763a'], [1, '#5a3a1a']]); rr(ctx, mid - len, cy - lr, len * 2, lr * 2, lr); ctx.fill();
    ctx.strokeStyle = 'rgba(60,35,15,0.45)'; ctx.lineWidth = 1.3; for (let i = 0; i < 7; i++) { const y = cy - lr * 0.75 + (i / 6) * lr * 1.5; ctx.beginPath(); ctx.moveTo(mid - len * 0.92, y); ctx.lineTo(mid + len * 0.92, y); ctx.stroke(); }
    ctx.strokeStyle = '#d8453a'; ctx.lineWidth = 3; for (const f of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.moveTo(mid + len * f, cy - lr); ctx.lineTo(mid + len * f, cy + lr); ctx.stroke(); }   // painted bands
  },

  // Indian akhara: a raked clay pit in a walled courtyard under a neem tree, club rack, spectators on a plinth
  kushti(ctx, s, g, T, pulse) {
    const { hy, gy, mid, rx, ry, H } = g;
    sky(ctx, s, hy, '#f1d3a0', '#fbe8c6'); sun(ctx, s, hy, 'rgba(255,230,170,0.8)');
    // arcaded wall
    const wh = s.h * 0.3;
    ctx.fillStyle = lin(ctx, 0, hy - wh, 0, hy, [[0, '#c98a58'], [1, '#a76a3e']]); ctx.fillRect(s.x, hy - wh, s.w, wh);
    const n = 6;
    for (let i = 0; i < n; i++) { const x = s.x + (s.w * (i + 0.5)) / n, aw = s.w / n * 0.58; ctx.fillStyle = '#3a2418'; ctx.beginPath(); ctx.moveTo(x - aw / 2, hy); ctx.lineTo(x - aw / 2, hy - wh * 0.55); ctx.arc(x, hy - wh * 0.55, aw / 2, Math.PI, 0); ctx.lineTo(x + aw / 2, hy); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#e8c890'; ctx.lineWidth = 3; ctx.stroke(); }
    ctx.fillStyle = '#7a4a28'; ctx.fillRect(s.x, hy - wh - 5, s.w, 6);
    // neem tree on the left, with dappled canopy
    const tx = s.x + s.w * 0.09;
    ctx.fillStyle = '#4a3220'; poly(ctx, [[tx - 9, hy], [tx + 9, hy], [tx + 5, hy - s.h * 0.34], [tx - 4, hy - s.h * 0.34]]); ctx.fill();
    for (const [dx, dy, r] of [[0, -0.42, 0.13], [-0.08, -0.35, 0.1], [0.09, -0.36, 0.1], [0.02, -0.5, 0.09]]) { ctx.fillStyle = mix('#3f7a3a', '#fbe8c6', 0.1 + hash(dx * 100) * 0.15); ctx.beginPath(); ctx.arc(tx + dx * s.w, hy + dy * s.h, r * s.h * 1.2, 0, TAU); ctx.fill(); }
    // club rack (two bell-shaped wooden clubs standing)
    for (const k of [0, 1]) { const x = s.x + s.w * 0.88 + k * 14; ctx.fillStyle = lin(ctx, x - 7, 0, x + 7, 0, [[0, '#c89a54'], [1, '#7a5428']]); poly(ctx, [[x - 3, hy + 10], [x + 3, hy + 10], [x + 5, hy - 10], [x + 11, hy - 38], [x - 11, hy - 38], [x - 5, hy - 10]]); ctx.fill(); }
    ground(ctx, s, hy, '#d9b987', '#c49a62', '#8f6a3a');
    // plinth with spectators in turbans and wraps
    ctx.fillStyle = '#b89a6a'; ctx.fillRect(s.x, hy + s.h * 0.02, s.w, s.h * 0.035);
    rowOfPeople(ctx, s.x + s.w * 0.14, s.x + s.w * 0.86, hy + s.h * 0.02, s.h * 0.036, 1, ['#f4f0e4', '#e8873a', '#d8c8a8', '#c25b4a', '#f2c14e'], T, pulse, { hats: ['turban'], seated: true });
    // the pit: brick coping, raked red clay
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ell(ctx, mid, gy + ry * 0.3, rx * 1.12, ry * 1.25); ctx.fill();
    ell(ctx, mid, gy, rx * 1.08, ry * 1.18); ctx.fillStyle = '#a24a2a'; ctx.fill();
    ctx.strokeStyle = 'rgba(40,16,8,0.55)'; ctx.lineWidth = 1.5; for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU; ctx.beginPath(); ctx.moveTo(mid + Math.cos(a) * rx * 0.96, gy + Math.sin(a) * ry * 1.06); ctx.lineTo(mid + Math.cos(a) * rx * 1.08, gy + Math.sin(a) * ry * 1.18); ctx.stroke(); }
    ell(ctx, mid, gy + ry * 0.05, rx * 0.96, ry * 1.05); ctx.fillStyle = rad(ctx, mid - rx * 0.25, gy - ry * 0.3, 0, rx, [[0, '#d8a47a'], [0.7, '#b8744a'], [1, '#8a4a2a']]); ctx.fill();
    ctx.save(); ell(ctx, mid, gy + ry * 0.05, rx * 0.96, ry * 1.05); ctx.clip();
    ctx.strokeStyle = 'rgba(70,28,10,0.3)'; ctx.lineWidth = 1.4; for (let i = -7; i <= 7; i++) { ctx.beginPath(); ctx.moveTo(mid + i * rx * 0.12 - rx * 0.1, gy - ry * 1.2); ctx.lineTo(mid + i * rx * 0.12 + rx * 0.1, gy + ry * 1.2); ctx.stroke(); }
    ctx.restore();
  },

  // Senegalese sand arena: baobab, a line of sabar drummers, crowd in bright robes, painted pirogues on the shore
  laamb(ctx, s, g, T, pulse) {
    const { hy, gy, mid, rx, ry, H } = g;
    sky(ctx, s, hy, '#ffd9a0', '#fff1d4'); sun(ctx, s, hy, 'rgba(255,236,170,0.95)');
    ctx.fillStyle = '#4fa3c0'; ctx.fillRect(s.x, hy - s.h * 0.05, s.w, s.h * 0.06);
    for (const [fx0, col] of [[0.3, '#e8873a'], [0.52, '#2d8a5a'], [0.74, '#d8453a']]) { const x = s.x + s.w * fx0; ctx.fillStyle = col; poly(ctx, [[x - 30, hy - s.h * 0.04], [x + 30, hy - s.h * 0.04], [x + 22, hy - s.h * 0.01], [x - 22, hy - s.h * 0.01]]); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x - 24, hy - s.h * 0.035, 48, 2); }
    const bx = s.x + s.w * 0.86;      // baobab
    ctx.fillStyle = '#7a6a58'; poly(ctx, [[bx - 20, hy + 4], [bx + 20, hy + 4], [bx + 11, hy - s.h * 0.26], [bx - 11, hy - s.h * 0.26]]); ctx.fill();
    ctx.strokeStyle = '#5a4a38'; ctx.lineWidth = 6; ctx.lineCap = 'round'; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(bx + i * 3, hy - s.h * 0.26); ctx.lineTo(bx + i * 22, hy - s.h * (0.36 + 0.02 * Math.abs(i))); ctx.stroke(); } ctx.lineCap = 'butt';
    ctx.fillStyle = '#4a8a3a'; for (const i of [-2, 0, 2]) { ctx.beginPath(); ctx.arc(bx + i * 20, hy - s.h * 0.37, 14, 0, TAU); ctx.fill(); }
    ground(ctx, s, hy, '#f1ddaa', '#e8cc90', '#b89a60');
    // crowd on a rise: robes in strong colours, some headwraps
    rowOfPeople(ctx, s.x + s.w * 0.02, s.x + s.w * 0.98, hy + s.h * 0.17, s.h * 0.038, 3, ['#e8873a', '#2d8a5a', '#d8453a', '#f2c14e', '#4a6fd6', '#c25b9a', '#f7f1e3'], T, pulse * 1.3, { skins: ['#6d4128', '#5a3520', '#7a4a30'], hats: ['turban', null] });
    // drummers on the left: tall tapered sabars, hands and sticks beating
    for (let i = 0; i < 3; i++) {
      const x = s.x + s.w * (0.08 + i * 0.085), yb = hy + s.h * 0.2, sz = s.h * 0.036, beat = Math.abs(Math.sin(T * (6 + i) + i));
      ctx.fillStyle = lin(ctx, x - 9, 0, x + 9, 0, [[0, '#8a5a2a'], [1, '#4a2a10']]); poly(ctx, [[x - 8, yb - sz * 0.2], [x + 8, yb - sz * 0.2], [x + 14, yb - sz * 2.6], [x - 14, yb - sz * 2.6]]); ctx.fill();
      ctx.fillStyle = '#f0e2c0'; ell(ctx, x, yb - sz * 2.6, 14, 4); ctx.fill();
      ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 6, yb - sz * 3.4 + beat * 8); ctx.lineTo(x + 2, yb - sz * 2.7); ctx.stroke();
      person(ctx, x - 20, yb, sz, ['#e8873a', '#2d8a5a', '#d8453a'][i], '#6d4128', T, i + 40, pulse, true, null);
    }
    ringDisc(ctx, mid, gy, rx, ry, '#f0d9a0', '#c8a468', 160);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ell(ctx, mid, gy, rx * 0.9, ry * 0.95); ctx.stroke();
    // floodlit evening: the stand sinks into the dark, the sand ring glows
    ctx.fillStyle = rad(ctx, mid, gy - H * 0.2, rx * 0.3, Math.max(s.w, s.h) * 0.8, [[0, 'rgba(8,6,30,0.0)'], [0.55, 'rgba(8,6,30,0.5)'], [1, 'rgba(8,6,30,0.82)']]); ctx.fillRect(s.x, s.y, s.w, s.h);
    for (const fx0 of [0.15, 0.5, 0.85]) { const lx = s.x + s.w * fx0, ly = s.y + s.h * 0.07; ctx.fillStyle = rad(ctx, lx, ly, 0, s.h * 0.35, [[0, 'rgba(255,240,200,0.55)'], [1, 'rgba(255,240,200,0)']]); ctx.fillRect(lx - s.h * 0.35, ly - s.h * 0.1, s.h * 0.7, s.h * 0.6); ctx.fillStyle = '#fffbe6'; ctx.beginPath(); ctx.arc(lx, ly, 5, 0, TAU); ctx.fill(); }
  },

  // Highland Madagascar: terraced paddies, tall red-earth houses, a ring of villagers in striped cloths
  moraingy(ctx, s, g, T, pulse) {
    const { hy, gy, mid, rx, ry, H } = g;
    sky(ctx, s, hy, '#8fd0e8', '#f5f8e8'); sun(ctx, s, hy);
    for (let t = 0; t < 4; t++) { ctx.fillStyle = mix(['#4f9a4a', '#6aa84a', '#3f8a52', '#7ab85a'][t], '#f5f8e8', 0.25); ctx.beginPath(); ctx.moveTo(s.x, hy); for (let i = 0; i <= 14; i++) ctx.lineTo(s.x + s.w * i / 14, hy - s.h * (0.04 + t * 0.035 + 0.022 * Math.sin(i * 0.9 + t))); ctx.lineTo(s.x + s.w, hy); ctx.closePath(); ctx.fill(); }
    for (const [fx0, sc] of [[0.15, 1], [0.34, 0.8], [0.76, 1.1], [0.9, 0.85]]) {
      const x = s.x + s.w * fx0, w = s.w * 0.09 * sc, h = s.h * 0.16 * sc, y = hy + 2;
      ctx.fillStyle = '#b8503a'; ctx.fillRect(x - w / 2, y - h * 0.7, w, h * 0.7); ctx.fillStyle = '#d8a050'; ctx.fillRect(x - w / 2, y - h * 0.7, w, h * 0.08);
      ctx.fillStyle = '#3a2a1c'; poly(ctx, [[x - w * 0.62, y - h * 0.68], [x + w * 0.62, y - h * 0.68], [x + w * 0.15, y - h * 1.15], [x - w * 0.15, y - h * 1.15]]); ctx.fill();
      ctx.fillStyle = '#2a1a10'; ctx.fillRect(x - w * 0.12, y - h * 0.5, w * 0.24, h * 0.5); ctx.fillStyle = '#fff1c0'; ctx.fillRect(x - w * 0.36, y - h * 0.6, w * 0.16, h * 0.2);
    }
    for (let i = 0; i < 5; i++) { const x = s.x + s.w * (0.04 + i * 0.22 + hash(i) * 0.05); ctx.strokeStyle = '#6b5a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, hy); ctx.lineTo(x + 2, hy - s.h * 0.3); ctx.stroke(); ctx.fillStyle = '#6a9a58'; ell(ctx, x + 2, hy - s.h * 0.32, 11, 24); ctx.fill(); }
    ground(ctx, s, hy, '#d9a070', '#c4784a', '#8f4a2a');
    // ring of onlookers, wrapped in striped lamba cloths
    rowOfPeople(ctx, s.x + s.w * 0.02, s.x + s.w * 0.98, hy + s.h * 0.16, s.h * 0.036, 2, ['#e8453a', '#f2c14e', '#2d8a8a', '#f4f0e4', '#c25b9a', '#4a6fd6'], T, pulse, { hats: ['cap', null, null] });
    bunting(ctx, s.x + s.w * 0.05, s.x + s.w * 0.95, hy - s.h * 0.2, s.h * 0.03, ['#e8453a', '#f2c14e', '#2d8a8a', '#fff'], T, 14, 10);
    // drum on its stand at the right edge
    const dx = s.x + s.w * 0.92, dy = hy + s.h * 0.2;
    ctx.fillStyle = lin(ctx, dx - 14, 0, dx + 14, 0, [[0, '#d8a868'], [1, '#6a4420']]); poly(ctx, [[dx - 14, dy - 34], [dx + 14, dy - 34], [dx + 10, dy], [dx - 10, dy]]); ctx.fill();
    ctx.fillStyle = '#f2e6c8'; ell(ctx, dx, dy - 34, 14, 5); ctx.fill();
    ringDisc(ctx, mid, gy, rx, ry, '#d8946a', '#fff1c8', 170);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; ctx.setLineDash([8, 7]); ell(ctx, mid, gy, rx * 0.88, ry * 0.92); ctx.stroke(); ctx.setLineDash([]);
  },

  // Zulu homestead: beehive huts, thorn-branch kraal, golden hills, cattle, men leaning on sticks
  nguni(ctx, s, g, T, pulse) {
    const { hy, gy, mid, rx, ry, H } = g;
    sky(ctx, s, hy, '#f3c88a', '#fdeccb'); sun(ctx, s, hy, 'rgba(255,224,150,0.95)');
    for (let l = 0; l < 3; l++) { ctx.fillStyle = mix(['#a8924a', '#8a9a4a', '#6f8a46'][l], '#fdeccb', 0.2); ctx.beginPath(); ctx.moveTo(s.x, hy); for (let i = 0; i <= 18; i++) ctx.lineTo(s.x + s.w * i / 18, hy - s.h * (0.1 + (2 - l) * 0.05 + 0.04 * Math.sin(i * 0.5 + l * 2))); ctx.lineTo(s.x + s.w, hy); ctx.closePath(); ctx.fill(); }
    // flat-topped acacia
    const ax = s.x + s.w * 0.1; ctx.strokeStyle = '#4a3220'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(ax, hy); ctx.lineTo(ax + 4, hy - s.h * 0.2); ctx.stroke();
    ctx.fillStyle = '#4f7a3a'; ell(ctx, ax + 6, hy - s.h * 0.22, s.w * 0.1, s.h * 0.04); ctx.fill();
    // beehive huts of thatch bands
    for (const [fx0, sc] of [[0.3, 1], [0.5, 0.78], [0.78, 1.05]]) {
      const x = s.x + s.w * fx0, w = s.w * 0.11 * sc, h = s.h * 0.17 * sc, y = hy + s.h * 0.02;
      ctx.fillStyle = lin(ctx, x - w, 0, x + w, 0, [[0, '#d8b66a'], [1, '#8a6a2a']]); ctx.beginPath(); ctx.ellipse(x, y, w, h, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(70,45,10,0.5)'; ctx.lineWidth = 1.2; for (let k = 1; k < 6; k++) { const yy = y - h * k / 6, ww = w * Math.sqrt(1 - Math.pow(k / 6, 2)); ctx.beginPath(); ctx.moveTo(x - ww, yy); ctx.lineTo(x + ww, yy); ctx.stroke(); }
      ctx.fillStyle = '#2a1a0c'; ctx.beginPath(); ctx.ellipse(x, y, w * 0.2, h * 0.38, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
    }
    ground(ctx, s, hy, '#c8a868', '#b88a52', '#80582c');
    // cattle
    for (const fx0 of [0.18, 0.62]) { const x = s.x + s.w * fx0, y = hy + s.h * 0.08; ctx.fillStyle = '#4a3220'; ell(ctx, x, y - 10, 20, 9); ctx.fill(); ctx.fillRect(x - 15, y - 4, 3, 13); ctx.fillRect(x + 10, y - 4, 3, 13); ctx.beginPath(); ctx.arc(x + 23, y - 15, 6, 0, TAU); ctx.fill(); ctx.strokeStyle = '#e8dcc0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + 25, y - 22, 6, Math.PI * 0.9, Math.PI * 1.9); ctx.stroke(); }
    // thorn-branch kraal fence with watchers
    ctx.strokeStyle = '#5a3a1c'; ctx.lineWidth = 2; for (let i = 0; i < 70; i++) { const x = s.x + (s.w * i) / 70, a = (hash(i) - 0.5) * 0.7; ctx.beginPath(); ctx.moveTo(x, hy + s.h * 0.18); ctx.lineTo(x + Math.sin(a) * 16, hy + s.h * 0.18 - 28 - hash(i + 5) * 12); ctx.stroke(); }
    rowOfPeople(ctx, s.x + s.w * 0.06, s.x + s.w * 0.94, hy + s.h * 0.2, s.h * 0.036, 1, ['#8a3a2a', '#2f5d8c', '#e8c14a', '#f4f0e4', '#3a7a4a'], T, pulse, { skins: ['#6d4128', '#5a3520', '#7a4a30'] });
    ringDisc(ctx, mid, gy, rx, ry, '#d4a868', '#6a4a24', 150);
    for (let i = 0; i < 26; i++) { const a = (i / 26) * TAU; ctx.fillStyle = i % 2 ? '#8a7a68' : '#a89880'; ell(ctx, mid + Math.cos(a) * rx * 1.0, gy + Math.sin(a) * ry * 1.05, 6, 3); ctx.fill(); }
    ctx.fillStyle = 'rgba(70,24,10,0.38)'; ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = rad(ctx, s.x + s.w * 0.8, hy, 0, s.h * 0.5, [[0, 'rgba(255,170,60,0.5)'], [1, 'rgba(255,170,60,0)']]); ctx.fillRect(s.x, s.y, s.w, s.h);
  },

  // Javanese pendopo: carved pillars, a joglo roof, batik wall, gamelan, judges, a red and blue match mat
  silat(ctx, s, g, T, pulse) {
    const { hy, gy, mid, rx, ry, H } = g;
    ctx.fillStyle = lin(ctx, 0, s.y, 0, hy, [[0, '#3a2412'], [1, '#6a4524']]); ctx.fillRect(s.x, s.y, s.w, hy - s.y + 1);
    // joglo roof tiers
    for (let i = 0; i < 3; i++) { const y = s.y + i * s.h * 0.045, ins = s.w * (0.18 - i * 0.05); ctx.fillStyle = ['#2a1a0c', '#3a2412', '#4a2e16'][i]; poly(ctx, [[s.x + ins * 0.2, y], [s.x + s.w - ins * 0.2, y], [s.x + s.w - ins, y + s.h * 0.05], [s.x + ins, y + s.h * 0.05]]); ctx.fill(); ctx.fillStyle = '#d9b560'; ctx.fillRect(s.x + ins, y + s.h * 0.045, s.w - ins * 2, 2.5); }
    // batik wall: repeating diamond motif in indigo and gold
    const by0 = s.y + s.h * 0.15;
    ctx.fillStyle = '#1f2c52'; ctx.fillRect(s.x + s.w * 0.1, by0, s.w * 0.8, hy - by0);
    for (let r = 0; r < 6; r++) for (let c = 0; c < 18; c++) { const x = s.x + s.w * 0.1 + (c + (r % 2) * 0.5) * (s.w * 0.8 / 18), y = by0 + r * (hy - by0) / 6 + (hy - by0) / 12; ctx.fillStyle = (r + c) % 3 ? '#c9a24a' : '#7a8ab8'; poly(ctx, [[x, y - 7], [x + 6, y], [x, y + 7], [x - 6, y]]); ctx.fill(); }
    // gold lamp glow and gong frame
    for (const fx0 of [0.18, 0.5, 0.82]) { const x = s.x + s.w * fx0, y = s.y + s.h * 0.22; ctx.fillStyle = rad(ctx, x, y, 0, s.h * 0.2, [[0, 'rgba(255,214,120,0.5)'], [1, 'rgba(255,214,120,0)']]); ctx.fillRect(x - s.h * 0.2, y - s.h * 0.2, s.h * 0.4, s.h * 0.4); }
    const gx = s.x + s.w * 0.7;       // hanging gongs
    ctx.fillStyle = '#6a1f1a'; ctx.fillRect(gx - 54, hy - s.h * 0.36, 108, 6); ctx.fillRect(gx - 54, hy - s.h * 0.36, 6, s.h * 0.36); ctx.fillRect(gx + 48, hy - s.h * 0.36, 6, s.h * 0.36);
    for (const [dx, r] of [[-26, 18], [8, 24], [38, 14]]) { ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(gx + dx, hy - s.h * 0.35); ctx.lineTo(gx + dx, hy - s.h * 0.3); ctx.stroke(); ctx.fillStyle = rad(ctx, gx + dx - 4, hy - s.h * 0.3 + r * 0.6, 1, r * 1.2, [[0, '#fff0a0'], [0.5, '#c9a24a'], [1, '#6a4a14']]); ctx.beginPath(); ctx.arc(gx + dx, hy - s.h * 0.28 + r * 0.5, r, 0, TAU); ctx.fill(); }
    // pillars
    for (const fx0 of [0.06, 0.94, 0.3, 0.7]) { const x = s.x + s.w * fx0, w = s.w * 0.04; ctx.fillStyle = lin(ctx, x - w, 0, x + w, 0, [[0, '#7a2a1a'], [0.5, '#a8442a'], [1, '#4a1a0e']]); ctx.fillRect(x - w, s.y + s.h * 0.1, w * 2, hy - s.y - s.h * 0.1 + s.h * 0.04); ctx.fillStyle = '#d9b560'; ctx.fillRect(x - w, hy - s.h * 0.2, w * 2, 5); ctx.fillRect(x - w, s.y + s.h * 0.15, w * 2, 5); }
    ground(ctx, s, hy, '#6a4a2a', '#8a6236', '#4a3018');
    // seated audience on mats and judges at a table
    rowOfPeople(ctx, s.x + s.w * 0.08, s.x + s.w * 0.92, hy + s.h * 0.15, s.h * 0.034, 1, ['#1f2c52', '#7a2a1a', '#c9a24a', '#f4f0e4', '#2a5a4a'], T, pulse, { seated: true, hats: ['dark', 'cap'] });
    ctx.fillStyle = '#2a1a0c'; ctx.fillRect(s.x + s.w * 0.08, hy + s.h * 0.145, s.w * 0.84, 4);
    // match mat: red and blue halves with a centre circle
    const w = rx * 1.05, topY = gy - ry * 1.55, botY = gy + ry * 1.35;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, mid + 8, botY + 4, w * 1.05, ry * 0.4); ctx.fill();
    const q = (k, y0, y1, col, f0, f1) => { ctx.fillStyle = col; poly(ctx, [[mid + w * 0.82 * k * f0, y0], [mid + w * 0.82 * k * f1, y0], [mid + w * k * f1, y1], [mid + w * k * f0, y1]]); ctx.fill(); };
    q(1.06, topY - ry * 0.12, botY + ry * 0.12, '#e8d8a0', -1, 1);
    q(1, topY, botY, '#c43c2e', -1, 0); q(1, topY, botY, '#2d6bb0', 0, 1);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2.5; ell(ctx, mid, gy, rx * 0.34, ry * 0.7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mid, topY); ctx.lineTo(mid, botY); ctx.stroke();
  },

  // Tamil village green: banyan with hanging roots, tiled houses with verandas, marigold garlands, a kolam ring
  silambam(ctx, s, g, T, pulse) {
    const { hy, gy, mid, rx, ry, H } = g;
    sky(ctx, s, hy, '#f6c88a', '#fde8c4'); sun(ctx, s, hy, 'rgba(255,220,150,0.95)');
    for (let i = 0; i < 4; i++) { const x = s.x + s.w * (0.1 + i * 0.26), w = s.w * 0.2, h = s.h * 0.17; ctx.fillStyle = ['#f1e4c0', '#e8d0a0', '#f6ead0', '#d8b888'][i]; ctx.fillRect(x - w / 2, hy - h, w, h); ctx.fillStyle = '#a8442a'; poly(ctx, [[x - w * 0.58, hy - h], [x + w * 0.58, hy - h], [x + w * 0.4, hy - h * 1.45], [x - w * 0.4, hy - h * 1.45]]); ctx.fill(); ctx.fillStyle = '#5a3a1a'; for (let k = 0; k < 4; k++) ctx.fillRect(x - w * 0.42 + k * w * 0.28, hy - h * 0.6, 5, h * 0.6); ctx.fillStyle = '#2a1a0c'; ctx.fillRect(x - w * 0.36, hy - h * 0.62, w * 0.72, 4); }
    // banyan with aerial roots at the right
    const bx = s.x + s.w * 0.84; ctx.fillStyle = '#4a3220'; poly(ctx, [[bx - 14, hy + 6], [bx + 14, hy + 6], [bx + 7, hy - s.h * 0.24], [bx - 7, hy - s.h * 0.24]]); ctx.fill();
    for (const [dx, dy, r] of [[0, -0.32, 0.13], [-0.1, -0.26, 0.1], [0.11, -0.27, 0.1], [0.0, -0.4, 0.08]]) { ctx.fillStyle = mix('#2f6a34', '#fde8c4', 0.1 + hash(dx * 70) * 0.2); ctx.beginPath(); ctx.arc(bx + dx * s.w, hy + dy * s.h, r * s.h * 1.25, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#4a3220'; ctx.lineWidth = 2; for (let i = 0; i < 9; i++) { const x = bx - s.w * 0.1 + i * s.w * 0.025, sw = Math.sin(T * 0.8 + i) * 2; ctx.beginPath(); ctx.moveTo(x, hy - s.h * 0.2); ctx.quadraticCurveTo(x + sw, hy - s.h * 0.1, x + sw * 1.5, hy + s.h * 0.02); ctx.stroke(); }
    // marigold garlands and a string of mango leaves
    ctx.strokeStyle = '#e8873a'; ctx.lineWidth = 5; ctx.setLineDash([5, 3]); ctx.beginPath(); ctx.moveTo(s.x, s.y + s.h * 0.16); ctx.quadraticCurveTo(mid, s.y + s.h * 0.3, s.x + s.w, s.y + s.h * 0.16); ctx.stroke(); ctx.setLineDash([]);
    bunting(ctx, s.x, s.x + s.w, s.y + s.h * 0.08, s.h * 0.06, ['#3fa856', '#2f8a46'], T, 22, 9);
    ground(ctx, s, hy, '#ddb878', '#c9a062', '#8f6a38');
    rowOfPeople(ctx, s.x + s.w * 0.04, s.x + s.w * 0.96, hy + s.h * 0.17, s.h * 0.034, 2, ['#f7f1e3', '#f4f0e4', '#e8c14a', '#c25b4a', '#3a6aa8'], T, pulse, { seated: true, skins: ['#b57b52', '#8a5a3a', '#a46c46'] });
    // earth ring with a white kolam flower pattern
    ringDisc(ctx, mid, gy, rx, ry, '#c89a62', null, 130);
    ctx.strokeStyle = 'rgba(255,252,240,0.9)'; ctx.lineWidth = 2.2;
    for (let k = 0; k < 2; k++) { ell(ctx, mid, gy, rx * (0.98 - k * 0.22), ry * (1.02 - k * 0.22)); ctx.stroke(); }
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; ctx.beginPath(); ctx.ellipse(mid + Math.cos(a) * rx * 0.79, gy + Math.sin(a) * ry * 0.84, rx * 0.1, ry * 0.12, a, 0, TAU); ctx.stroke(); }
    for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; ctx.fillStyle = 'rgba(255,252,240,0.9)'; ctx.beginPath(); ctx.arc(mid + Math.cos(a) * rx * 0.99, gy + Math.sin(a) * ry * 1.03, 2, 0, TAU); ctx.fill(); }
    // dusk: the green is lit by lamps, the rest sinks into evening
    ctx.fillStyle = 'rgba(30,14,50,0.5)'; ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = rad(ctx, mid, gy - H * 0.3, rx * 0.2, rx * 1.2, [[0, 'rgba(255,200,110,0.42)'], [1, 'rgba(255,200,110,0)']]); ctx.fillRect(s.x, s.y, s.w, s.h);
    for (let i = 0; i < 6; i++) { const lx = s.x + s.w * (0.08 + i * 0.17), ly = s.y + s.h * 0.2; ctx.fillStyle = 'rgba(255,200,110,0.3)'; ctx.beginPath(); ctx.arc(lx, ly, 14, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffd37a'; ctx.beginPath(); ctx.arc(lx, ly, 4, 0, TAU); ctx.fill(); }
  },
};

// ---- fighters' dress and adornments ----------------------------------------------------------------------------------
const FIGHTERS = {
  arnis: { you: { outfit: 'tunic', skin: '#c48e62', hair: 'band', build: 0.95 }, rival: { outfit: 'tunic', skin: '#b57f55', hair: 'none', build: 1.0 } },
  kotta: { you: { outfit: 'skirt', skin: '#a8714a', hair: 'band', build: 1.0 }, rival: { outfit: 'skirt', skin: '#966238', hair: 'band', build: 1.02 } },
  kushti: { you: { outfit: 'mawashi', skin: '#b87d52', hair: 'none', build: 1.18 }, rival: { outfit: 'mawashi', skin: '#a56c45', hair: 'none', build: 1.22 } },
  laamb: { you: { outfit: 'mawashi', skin: '#6d4128', hair: 'none', build: 1.12 }, rival: { outfit: 'mawashi', skin: '#5a3520', hair: 'none', build: 1.18 } },
  moraingy: { you: { outfit: 'skirt', skin: '#b8855a', hair: 'band', build: 1.0 }, rival: { outfit: 'skirt', skin: '#a8734a', hair: 'cap', build: 1.0 } },
  nguni: { you: { outfit: 'skirt', skin: '#6d4128', hair: 'band', build: 1.08 }, rival: { outfit: 'skirt', skin: '#5a3520', hair: 'band', build: 1.1 } },
  silat: { you: { outfit: 'jacket', skin: '#c48e62', hair: 'turban', build: 0.95 }, rival: { outfit: 'jacket', skin: '#b57f55', hair: 'turban', build: 0.97 } },
  silambam: { you: { outfit: 'robe', skin: '#b57b52', hair: 'cap', build: 0.95 }, rival: { outfit: 'robe', skin: '#a46c46', hair: 'none', build: 1.0 } },
};
// anchors: { head:[x,y], hip:[x,y], chest:[x,y] }, H figure height, dir +1 faces right
function adorn(id, ctx, a, spec, H, dir, T) {
  const [hx, hy2] = a.head, [px, py] = a.hip, [cx, cy] = a.chest, t = spec.trim;
  switch (id) {
    case 'arnis':   // woven sash and a knotted headscarf tail
      ctx.fillStyle = t; ctx.beginPath(); ctx.ellipse(px, py - H * 0.03, H * 0.1, H * 0.022, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = t; ctx.lineWidth = Math.max(2, H * 0.014); ctx.beginPath(); ctx.moveTo(px, py - H * 0.03); ctx.lineTo(px - dir * H * 0.07, py + H * 0.1 + Math.sin(T * 5) * 2); ctx.stroke();
      break;
    case 'kotta':   // flower garland on the neck and a cloth tail on the sarong
      for (let i = 0; i < 7; i++) { const u = (i / 6 - 0.5) * 1.6; ctx.fillStyle = ['#f2c14e', '#e8453a', '#fff'][i % 3]; ctx.beginPath(); ctx.arc(cx + u * H * 0.06, cy - H * 0.1 + Math.abs(u) * -H * 0.02 + H * 0.045, H * 0.014, 0, TAU); ctx.fill(); }
      break;
    case 'kushti':  // clay smears on chest and arms
      ctx.strokeStyle = 'rgba(110,50,24,0.55)'; ctx.lineWidth = Math.max(2.5, H * 0.02); ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(cx - H * 0.05 + i * H * 0.04, cy - H * 0.06); ctx.lineTo(cx - H * 0.02 + i * H * 0.04, cy + H * 0.04); ctx.stroke(); }
      ctx.lineCap = 'butt';
      break;
    case 'laamb':   // gris-gris amulet belt and white paint dots
      ctx.fillStyle = '#3a2412'; ctx.fillRect(px - H * 0.1, py - H * 0.06, H * 0.2, H * 0.025);
      for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#c9a24a', '#a8442a'][i % 2]; rr(ctx, px - H * 0.09 + i * H * 0.05, py - H * 0.035, H * 0.035, H * 0.05, 3); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(cx - H * 0.06 + (i % 3) * H * 0.05, cy - H * 0.04 + Math.floor(i / 3) * H * 0.05, H * 0.008, 0, TAU); ctx.fill(); }
      break;
    case 'moraingy':   // lamba cloth over the shoulder and wrapped hands cue at the belt
      ctx.strokeStyle = t; ctx.lineWidth = Math.max(3, H * 0.03); ctx.beginPath(); ctx.moveTo(cx - dir * H * 0.08, cy - H * 0.1); ctx.lineTo(px + dir * H * 0.02, py - H * 0.02); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]); ctx.stroke(); ctx.setLineDash([]);
      break;
    case 'nguni':   // beaded necklace and headband beads
      for (let i = 0; i < 9; i++) { const u = (i / 8 - 0.5) * 2; ctx.fillStyle = ['#e8c14a', '#fff', '#d8453a', '#2d7bd6'][i % 4]; ctx.beginPath(); ctx.arc(cx + u * H * 0.07, cy - H * 0.11 + u * u * H * 0.035, H * 0.011, 0, TAU); ctx.fill(); }
      for (let i = 0; i < 5; i++) { ctx.fillStyle = ['#e8c14a', '#d8453a', '#fff'][i % 3]; ctx.beginPath(); ctx.arc(hx - H * 0.06 + i * H * 0.03, hy2 - H * 0.045, H * 0.009, 0, TAU); ctx.fill(); }
      break;
    case 'silat':   // red sash with a hanging end
      ctx.fillStyle = '#c43c2e'; ctx.beginPath(); ctx.ellipse(px, py - H * 0.035, H * 0.1, H * 0.026, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(px - dir * H * 0.02, py - H * 0.03); ctx.lineTo(px - dir * H * 0.07, py + H * 0.12 + Math.sin(T * 3) * 2); ctx.lineTo(px - dir * H * 0.03, py + H * 0.12); ctx.closePath(); ctx.fill();
      break;
    case 'silambam':   // towel across the chest and a waist knot
      ctx.strokeStyle = spec.trim; ctx.lineWidth = Math.max(4, H * 0.035); ctx.beginPath(); ctx.moveTo(cx - dir * H * 0.07, cy - H * 0.12); ctx.lineTo(cx + dir * H * 0.07, cy + H * 0.05); ctx.stroke();
      ctx.fillStyle = '#f7f1e3'; ctx.fillRect(px - H * 0.08, py - H * 0.03, H * 0.16, H * 0.02);
      break;
    default: break;
  }
}

// ---- balance mark above each fighter ------------------------------------------------------------------------------------
const MARK = { arnis: 'bamboo', kotta: 'pots', kushti: 'ticks', laamb: 'beads', moraingy: 'gongs', nguni: 'shields', silat: 'gongs', silambam: 'flame' };
function icon(ctx, kind, x, y, s, fill, col) {
  ctx.globalAlpha = fill; ctx.fillStyle = col; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1.5;
  switch (kind) {
    case 'bamboo': rr(ctx, x - s * 0.22, y - s * 0.5, s * 0.44, s, s * 0.14); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.moveTo(x - s * 0.22, y); ctx.lineTo(x + s * 0.22, y); ctx.stroke(); break;
    case 'pots': ctx.beginPath(); ctx.arc(x, y + s * 0.1, s * 0.34, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillRect(x - s * 0.15, y - s * 0.36, s * 0.3, s * 0.2); break;
    case 'ticks': poly(ctx, [[x - s * 0.14, y + s * 0.5], [x + s * 0.14, y + s * 0.5], [x + s * 0.2, y - s * 0.2], [x + s * 0.3, y - s * 0.5], [x - s * 0.3, y - s * 0.5], [x - s * 0.2, y - s * 0.2]]); ctx.fill(); ctx.stroke(); break;
    case 'beads': ctx.beginPath(); ctx.arc(x, y, s * 0.3, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(x - s * 0.1, y - s * 0.1, s * 0.09, 0, TAU); ctx.fill(); break;
    case 'shields': ctx.beginPath(); ctx.ellipse(x, y, s * 0.26, s * 0.48, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.moveTo(x, y - s * 0.44); ctx.lineTo(x, y + s * 0.44); ctx.stroke(); break;
    case 'gongs': ctx.beginPath(); ctx.arc(x, y, s * 0.36, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.arc(x, y, s * 0.13, 0, TAU); ctx.fill(); break;
    case 'flame': ctx.beginPath(); ctx.moveTo(x, y - s * 0.5); ctx.quadraticCurveTo(x + s * 0.4, y, x, y + s * 0.4); ctx.quadraticCurveTo(x - s * 0.4, y, x, y - s * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
    default: break;
  }
  ctx.globalAlpha = 1;
}
function dial(id, ctx, x, y, r, frac, grip, T, side, color) {
  const kind = MARK[id], n = 5, s = r * 0.62, w = n * s * 1.12;
  ctx.fillStyle = 'rgba(10,14,22,0.72)'; rr(ctx, x - w / 2 - 6, y - s * 0.75, w + 12, s * 1.5 + (grip != null ? 8 : 2), 9); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
  const base = frac > 0.6 ? '#9be3a8' : frac > 0.3 ? '#ffe38a' : '#ff9a7a';
  const col = { bamboo: '#b8d46a', pots: '#d8845a', ticks: '#e0b070', beads: '#f0c14e', gongs: '#e8c35a', shields: '#e8d0a0', flame: '#ffb040' }[kind] ?? base;
  for (let i = 0; i < n; i++) {
    const f = clamp(frac * n - i, 0, 1), wob = frac < 0.3 && f > 0 ? Math.sin(T * 14 + i + side) * 1.5 : 0;
    icon(ctx, 'bamboo' === kind ? 'bamboo' : kind, x - w / 2 + (i + 0.5) * s * 1.12, y + wob, s, 0.22 + 0.78 * f, f > 0 ? (frac > 0.3 ? col : '#ff9a7a') : '#555');
  }
  if (grip != null) { ctx.fillStyle = 'rgba(111,180,255,0.3)'; ctx.fillRect(x - w / 2, y + s * 0.62, w, 4); ctx.fillStyle = '#6fb4ff'; ctx.fillRect(x - w / 2, y + s * 0.62, w * clamp(grip, 0, 1), 4); }
}

// ---- impact effects and sounds --------------------------------------------------------------------------------------------
// Returns true when the effect was drawn here.
function fxDraw(id, ctx, e, geo, S) {
  const { mid, rx, gy, H } = geo;
  const k = e.t / e.life;
  if (k < 0 || k > 1) return false;
  const X = mid + e.x * rx, Y = gy - e.y * H;
  if (e.kind === 'splash' && id === 'kotta') {
    ctx.save(); ctx.globalAlpha = 1 - k;
    ctx.fillStyle = '#5e3f24';
    for (let i = 0; i < 16; i++) { const vx = (hash(e.seedI + i) - 0.5) * 1.8, vy = 0.6 + hash(e.seedI + i + 9) * 1.0, t = k * 1.4; ctx.beginPath(); ctx.arc(X + vx * H * 0.4 * t, Y - (vy * t - 1.5 * t * t) * H * 0.4, Math.max(2, H * 0.02), 0, TAU); ctx.fill(); }
    ctx.strokeStyle = 'rgba(200,160,110,0.9)'; ctx.lineWidth = 2; ell(ctx, X, Y, H * (0.1 + k * 0.4), H * (0.02 + k * 0.08)); ctx.stroke();
    ctx.restore(); return true;
  }
  if (e.kind !== 'burst') return false;
  const r = H * (0.12 + 0.1 * (e.big ? 1 : 0)) * (0.5 + k * 1.2);
  ctx.save(); ctx.globalAlpha = 1 - k * k;
  const n = 9;
  switch (id) {
    case 'arnis': case 'nguni': case 'silambam':   // wood chips and a clack ring
      for (let i = 0; i < n; i++) { const a = (i / n) * TAU + e.seed, d = r * (0.6 + hash(i + e.seedI) * 0.9); ctx.save(); ctx.translate(X + Math.cos(a) * d, Y + Math.sin(a) * d - k * H * 0.08); ctx.rotate(a + k * 5); ctx.fillStyle = i % 2 ? '#d8b070' : '#a87a3a'; ctx.fillRect(-4, -1.5, 8, 3); ctx.restore(); }
      ctx.strokeStyle = '#fff6d0'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(X, Y, r * (0.5 + k), 0, TAU); ctx.stroke();
      break;
    case 'kotta':   // feathers from the pillow
      for (let i = 0; i < n + 3; i++) { const a = (i / (n + 3)) * TAU + e.seed, d = r * (0.5 + hash(i + e.seedI) * 1.1); ctx.fillStyle = '#fffaf0'; ell(ctx, X + Math.cos(a) * d, Y + Math.sin(a) * d + k * H * 0.12, 6, 2.5); ctx.fill(); }
      break;
    case 'kushti':   // clay spatter
      for (let i = 0; i < n + 3; i++) { const a = (i / (n + 3)) * TAU + e.seed, d = r * (0.5 + hash(i + e.seedI) * 1.1); ctx.fillStyle = i % 2 ? '#b8744a' : '#8a4a2a'; ctx.beginPath(); ctx.arc(X + Math.cos(a) * d, Y + Math.sin(a) * d + k * H * 0.1, 3 + hash(i) * 4, 0, TAU); ctx.fill(); }
      break;
    case 'laamb':   // sand puff and a drum pulse
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + e.seed; ctx.fillStyle = 'rgba(240,215,160,0.55)'; ctx.beginPath(); ctx.arc(X + Math.cos(a) * r * 0.8, Y + Math.sin(a) * r * 0.5, r * 0.4 * (0.6 + k), 0, TAU); ctx.fill(); }
      ctx.strokeStyle = '#ffe38a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(X, Y, r * (0.4 + k * 1.1), 0, TAU); ctx.stroke(); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X, Y, r * (0.2 + k * 0.8), 0, TAU); ctx.stroke();
      break;
    case 'moraingy':   // concentric rings in lamba colours
      for (let i = 0; i < 3; i++) { ctx.strokeStyle = ['#e8453a', '#f2c14e', '#2d8a8a'][i]; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(X, Y, r * (0.35 + i * 0.28 + k * 0.5), 0, TAU); ctx.stroke(); }
      break;
    case 'silat':   // speed arcs
      ctx.strokeStyle = '#fff2b0'; ctx.lineWidth = 3; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(X, Y, r * (0.5 + i * 0.3), -0.9 + e.seed % 1, 0.9 + e.seed % 1); ctx.stroke(); }
      ctx.fillStyle = '#c9a24a'; for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + e.seed; poly(ctx, [[X + Math.cos(a) * r * 0.5, Y + Math.sin(a) * r * 0.5], [X + Math.cos(a + 0.2) * r * 0.9, Y + Math.sin(a + 0.2) * r * 0.9], [X + Math.cos(a - 0.2) * r * 0.9, Y + Math.sin(a - 0.2) * r * 0.9]]); ctx.fill(); }
      break;
    default: ctx.restore(); return false;
  }
  ctx.restore();
  return true;
}
const SOUND = {
  arnis: { tick: (q) => [{ freq: q === 1 ? 1250 : 900, dur: 0.035, type: 'square', vol: 0.12 }], hit: (t) => (t === 'good' ? [{ freq: 1500, to: 700, dur: 0.05, type: 'square', vol: 0.18 }, { freq: 480, dur: 0.1, type: 'triangle', vol: 0.12 }] : t === 'bad' ? [{ freq: 300, to: 180, dur: 0.12, type: 'square', vol: 0.12 }] : [{ freq: 800, dur: 0.05, type: 'square', vol: 0.1 }]) },
  kotta: { tick: (q) => [{ freq: q === 1 ? 420 : 300, dur: 0.07, type: 'sine', vol: 0.14 }], hit: (t) => (t === 'good' ? [{ freq: 150, to: 70, dur: 0.18, type: 'sine', vol: 0.4 }, { freq: 1500, to: 600, dur: 0.1, type: 'sawtooth', vol: 0.05 }] : [{ freq: 120, to: 70, dur: 0.15, type: 'sine', vol: 0.3 }]) },
  kushti: { tick: (q) => [{ freq: q === 1 ? 240 : 190, dur: 0.06, type: 'sine', vol: 0.14 }], hit: (t) => (t === 'good' ? [{ freq: 110, to: 55, dur: 0.22, type: 'sine', vol: 0.5 }, { freq: 700, to: 300, dur: 0.06, type: 'triangle', vol: 0.1 }] : [{ freq: 90, to: 60, dur: 0.18, type: 'sine', vol: 0.35 }]) },
  laamb: { tick: (q) => [{ freq: q === 1 ? 280 : 220, to: 160, dur: 0.1, type: 'triangle', vol: 0.18 }], hit: (t) => (t === 'good' ? [{ freq: 300, to: 130, dur: 0.16, type: 'triangle', vol: 0.4 }, { freq: 640, to: 280, dur: 0.1, type: 'triangle', vol: 0.18 }] : [{ freq: 200, to: 110, dur: 0.18, type: 'triangle', vol: 0.3 }]) },
  moraingy: { tick: (q) => [{ freq: q === 1 ? 330 : 250, to: 200, dur: 0.12, type: 'triangle', vol: 0.15 }], hit: (t) => (t === 'good' ? [{ freq: 400, to: 250, dur: 0.12, type: 'triangle', vol: 0.3 }, { freq: 520, dur: 0.18, type: 'sine', vol: 0.1 }] : [{ freq: 240, to: 150, dur: 0.14, type: 'triangle', vol: 0.25 }]) },
  nguni: { tick: (q) => [{ freq: q === 1 ? 760 : 560, dur: 0.05, type: 'square', vol: 0.1 }], hit: (t) => (t === 'good' ? [{ freq: 520, to: 260, dur: 0.1, type: 'square', vol: 0.2 }, { freq: 190, to: 100, dur: 0.14, type: 'sine', vol: 0.3 }] : [{ freq: 180, to: 110, dur: 0.14, type: 'sine', vol: 0.3 }]) },
  silat: { tick: (q) => [{ freq: q === 1 ? 880 : 660, dur: 0.14, type: 'sine', vol: 0.12 }], hit: (t) => (t === 'good' ? [{ freq: 784, dur: 0.3, type: 'sine', vol: 0.22 }, { freq: 1180, dur: 0.25, type: 'sine', vol: 0.1 }, { freq: 160, to: 90, dur: 0.1, type: 'sine', vol: 0.3 }] : [{ freq: 330, dur: 0.2, type: 'sine', vol: 0.14 }]) },
  silambam: { tick: (q) => [{ freq: q === 1 ? 900 : 700, to: 400, dur: 0.08, type: 'sawtooth', vol: 0.06 }], hit: (t) => (t === 'good' ? [{ freq: 1400, to: 500, dur: 0.06, type: 'square', vol: 0.15 }, { freq: 260, to: 140, dur: 0.14, type: 'triangle', vol: 0.3 }] : [{ freq: 360, to: 200, dur: 0.14, type: 'sawtooth', vol: 0.08 }]) },
};

// emblem on the HUD panels: a mark of the sport instead of a plain medallion
function emblem(id, ctx, x, y, r, spec) {
  ctx.fillStyle = spec.color; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = spec.trim; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.strokeStyle = spec.trim; ctx.fillStyle = spec.trim; ctx.lineWidth = 2; ctx.lineCap = 'round';
  switch (id) {
    case 'arnis': case 'nguni': ctx.beginPath(); ctx.moveTo(x - r * 0.5, y - r * 0.5); ctx.lineTo(x + r * 0.5, y + r * 0.5); ctx.moveTo(x + r * 0.5, y - r * 0.5); ctx.lineTo(x - r * 0.5, y + r * 0.5); ctx.stroke(); break;
    case 'silambam': ctx.beginPath(); ctx.moveTo(x - r * 0.55, y + r * 0.55); ctx.lineTo(x + r * 0.55, y - r * 0.55); ctx.stroke(); break;
    case 'kotta': rr(ctx, x - r * 0.55, y - r * 0.3, r * 1.1, r * 0.6, r * 0.25); ctx.fill(); break;
    case 'kushti': ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - r * 0.5, y); ctx.lineTo(x + r * 0.5, y); ctx.stroke(); break;
    case 'laamb': case 'moraingy': poly(ctx, [[x - r * 0.35, y - r * 0.5], [x + r * 0.35, y - r * 0.5], [x + r * 0.22, y + r * 0.5], [x - r * 0.22, y + r * 0.5]]); ctx.fill(); break;
    case 'silat': poly(ctx, [[x, y - r * 0.55], [x + r * 0.5, y], [x, y + r * 0.55], [x - r * 0.5, y]]); ctx.fill(); break;
    default: break;
  }
  ctx.lineCap = 'butt';
}

const SKIN_UI = {
  arnis: { bg: ['#2d4326', '#16210f'], pal: { panel: '#46663a', ink: '#f7f1e3', dim: '#c3cfa8', accent: '#f2c14e' } },
  kotta: { bg: ['#f4e6bf', '#e2c486'], pal: { panel: '#fff3d4', ink: '#3a2412', dim: '#7a5a34', accent: '#c0392b', good: '#2f8a46', bad: '#c0392b' } },
  kushti: { bg: ['#62210f', '#2c0d06'], pal: { panel: '#93421f', ink: '#fff0d8', dim: '#e0b898', accent: '#f2c14e' } },
  laamb: { bg: ['#0e1536', '#04061a'], pal: { panel: '#223268', ink: '#f7f1e3', dim: '#a8b4e0', accent: '#ffd24a' } },
  moraingy: { bg: ['#1f6a64', '#0d3a38'], pal: { panel: '#3a8f86', ink: '#fffbea', dim: '#bfe8de', accent: '#ffd24a' } },
  nguni: { bg: ['#85501c', '#4a2a0c'], pal: { panel: '#b8782e', ink: '#fff6e0', dim: '#f0d6a0', accent: '#fff0a0' } },
  silat: { bg: ['#1a1a1a', '#000000'], pal: { panel: '#3c3c3c', ink: '#f2e6c0', dim: '#b8a878', accent: '#e0b84a' } },
  silambam: { bg: ['#f8f2e4', '#e2d2ac'], pal: { panel: '#fffaf0', ink: '#2a1a0c', dim: '#7a6444', accent: '#b8322a', good: '#2f8a46', bad: '#b8322a' } },
};
const LAYOUT = { arnis: 'foot', kotta: 'overlay', kushti: 'rail', laamb: 'big', moraingy: 'top', nguni: 'wide', silat: 'railL', silambam: 'std' };
export function createSport(id) {
  if (!id || !VENUE[id]) return null;
  return {
    id,
    fighters: FIGHTERS[id],
    waterVenue: id === 'kotta',
    layout: LAYOUT[id],
    bg: SKIN_UI[id].bg,
    pal: SKIN_UI[id].pal,
    drawVenue: (ctx, s, geo, T, pulse) => VENUE[id](ctx, s, geo, T, pulse),
    adorn: (ctx, anchors, spec, H, dir, T) => adorn(id, ctx, anchors, spec, H, dir, T),
    dial: (ctx, x, y, r, frac, grip, T, side, color) => dial(id, ctx, x, y, r, frac, grip, T, side, color),
    fx: (ctx, e, geo, S) => fxDraw(id, ctx, e, geo, S),
    emblem: (ctx, x, y, r, spec) => emblem(id, ctx, x, y, r, spec),
    sound: SOUND[id],
  };
}

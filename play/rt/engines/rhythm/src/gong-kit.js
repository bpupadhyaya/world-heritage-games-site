// Painting kit for the 1.21.0 gong, chime and bell stages (stage-gongs.js, stage-chimes.js, stage-bells.js): lit bronze discs and kettle gongs, bosses,
// hung cords, padded beaters, lacquer and gilt frames, wooden beams. Plain canvas 2D, local coordinates, no state, no clocks, no randomness.
// Everything is lit from the upper left like the drum stages (drum-kit.js `dropShadow`).
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU, glow } from './drum-kit.js';

export { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU, glow };
export const PI = Math.PI;
export const lerp = (a, b, t) => a + (b - a) * t;

// the strongest flash among the lanes whose zone key is in `keys`
export const zf = (K, keyOf, rt, ...keys) => { let m = 0; for (let i = 0; i < K.N; i++) if (keys.includes(keyOf[i])) m = Math.max(m, rt.flash[i] ?? 0, (rt.hold?.[i] ?? 0) * 0.5); return m; };

// a metal colour ramp across a width: dark edge, bright core, warm reflected edge
export const metalH = (ctx, x0, x1, c) => hgrad(ctx, x0, x1, [[0, darker(c, 0.6)], [0.16, lighter(c, 0.5)], [0.34, c], [0.55, lighter(c, 0.15)], [0.78, darker(c, 0.42)], [0.92, lighter(c, 0.22)], [1, darker(c, 0.65)]]);

// ---- a bronze disc gong seen from the front: rim flange, hammered face, ring grooves, boss. cx,cy,R; o { col, boss (0..1 of R), rimW, hammer, dark, flat, f (flash 0..1), seed, rings, bossCol }
export function discGong(ctx, cx, cy, R, o = {}) {
  const { col = '#b98a3a', boss = 0.2, rimW = 0.09, hammer = 0.5, seed = 4, rings = 5, f = 0, flat = false, bossCol = null, tilt = 0 } = o;
  ctx.save(); ctx.translate(cx, cy); if (tilt) ctx.rotate(tilt);
  // the flange: the rim turned back, seen as a thick dark-to-light ring
  circ(ctx, 0, 0, R); ctx.fillStyle = rgrad(ctx, 0, 0, R * 0.7, R * 1.02, [[0, darker(col, 0.5)], [0.7, darker(col, 0.62)], [1, darker(col, 0.8)]]); ctx.fill();
  circ(ctx, 0, 0, R); ctx.strokeStyle = rgba(lighter(col, 0.55), 0.55); ctx.lineWidth = 2; ctx.stroke();
  // the face
  const fr = R * (1 - rimW);
  circ(ctx, 0, 0, fr); ctx.fillStyle = rgrad(ctx, 0, 0, fr * 0.06, fr * 1.04, [[0, lighter(col, 0.58)], [0.32, lighter(col, 0.22)], [0.7, col], [1, darker(col, 0.5)]], -fr * 0.34, -fr * 0.4); ctx.fill();
  ctx.save(); circ(ctx, 0, 0, fr); ctx.clip();
  // tarnish and hammering: dim blotches and small bright dents
  for (let k = 0; k < 26; k++) { const a = hash(seed + k) * TAU, d = Math.sqrt(hash(seed + k + 40)) * fr; ctx.fillStyle = rgba(darker(col, 0.7), 0.07 + 0.1 * hash(k + seed * 3)); ell(ctx, Math.cos(a) * d, Math.sin(a) * d, fr * (0.08 + 0.16 * hash(k + 7)), fr * (0.05 + 0.1 * hash(k + 3))); ctx.fill(); }
  if (hammer > 0) for (let k = 0; k < 90; k++) { const a = hash(seed + k * 2.3) * TAU, d = Math.sqrt(hash(seed + k * 3.1 + 1)) * fr * 0.96; if (d < fr * boss * 1.25) continue; const x = Math.cos(a) * d, y = Math.sin(a) * d, s = fr * (0.018 + 0.03 * hash(k + 5)); ctx.fillStyle = `rgba(0,0,0,${0.1 * hammer})`; ell(ctx, x + s * 0.3, y + s * 0.4, s, s * 0.8); ctx.fill(); ctx.fillStyle = `rgba(255,236,190,${0.14 * hammer})`; ell(ctx, x - s * 0.3, y - s * 0.4, s * 0.8, s * 0.6); ctx.fill(); }
  // the turned grooves round the boss
  if (!flat) for (let k = 0; k < rings; k++) { const rr = fr * (boss * 1.5 + (0.9 - boss * 1.5) * (k / Math.max(1, rings - 1))); ctx.strokeStyle = rgba(darker(col, 0.7), 0.3); ctx.lineWidth = Math.max(1, R * 0.008); circ(ctx, 0, 0, rr); ctx.stroke(); ctx.strokeStyle = rgba(lighter(col, 0.7), 0.2); ctx.lineWidth = Math.max(1, R * 0.006); circ(ctx, -R * 0.004, -R * 0.005, rr); ctx.stroke(); }
  // long soft highlight arc, the key light on the upper left
  ctx.strokeStyle = 'rgba(255,248,224,0.34)'; ctx.lineWidth = R * 0.05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, fr * 0.78, PI * 1.08, PI * 1.5); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,248,224,0.16)'; ctx.lineWidth = R * 0.03; ctx.beginPath(); ctx.arc(0, 0, fr * 0.62, PI * 1.12, PI * 1.38); ctx.stroke();
  // occlusion where the face turns into the rim
  ctx.fillStyle = rgrad(ctx, 0, 0, fr * 0.86, fr * 1.02, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.5)']]); ctx.fillRect(-fr, -fr, 2 * fr, 2 * fr);
  ctx.restore();
  // the boss: a raised dome with its own highlight and a dark ring at its foot
  if (boss > 0) {
    const br = R * boss, bc = bossCol ?? lighter(col, 0.1);
    circ(ctx, 0, 0, br * 1.12); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();
    circ(ctx, 0, 0, br); ctx.fillStyle = rgrad(ctx, 0, 0, 0, br * 1.05, [[0, lighter(bc, 0.8)], [0.4, bc], [1, darker(bc, 0.6)]], -br * 0.34, -br * 0.4); ctx.fill();
    ctx.strokeStyle = rgba(lighter(bc, 0.7), 0.5); ctx.lineWidth = 1.5; circ(ctx, 0, 0, br * 0.96); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,240,0.7)'; ell(ctx, -br * 0.34, -br * 0.4, br * 0.2, br * 0.13); ctx.fill();
  }
  if (f > 0.05) { ctx.globalCompositeOperation = 'lighter'; circ(ctx, 0, 0, R); ctx.fillStyle = rgrad(ctx, 0, 0, R * 0.05, R, [[0, `rgba(255,236,170,${0.5 * f})`], [1, `rgba(255,190,90,${0.08 * f})`]]); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
  ctx.restore();
}

// ---- a kettle (pot) gong seen from above and a little from the side: a flat ellipse top with a boss, a short wall under it. cx,cy = centre of the top
// o { col, ryk (squash), wall (height in px), boss, f, seed, lip }
export function potGong(ctx, cx, cy, R, o = {}) {
  const { col = '#b98a3a', ryk = 0.62, wall = R * 0.42, boss = 0.27, seed = 3, f = 0, lip = '#7a5420', tone = null } = o, rim = R * ryk;
  // shadow on whatever it rests on
  ctx.fillStyle = 'rgba(0,0,0,0.32)'; ell(ctx, cx + R * 0.1, cy + wall + rim * 0.55, R * 1.04, rim * 0.62); ctx.fill();
  // the wall: a lit cylinder, darker to the right, with a bright rolled lower edge
  ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx - R * 0.95, cy + wall); ctx.ellipse(cx, cy + wall, R * 0.95, rim * 0.95, 0, PI, 0, true); ctx.lineTo(cx + R, cy); ctx.ellipse(cx, cy, R, rim, 0, 0, PI); ctx.closePath();
  ctx.fillStyle = hgrad(ctx, cx - R, cx + R, [[0, darker(col, 0.55)], [0.2, lighter(col, 0.42)], [0.42, col], [0.7, darker(col, 0.45)], [1, darker(col, 0.72)]]); ctx.fill();
  ctx.strokeStyle = rgba(lighter(col, 0.5), 0.4); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(cx, cy + wall, R * 0.95, rim * 0.95, 0, PI * 0.08, PI * 0.92); ctx.stroke();
  // the top: a rolled rim, then a face that dips to the boss
  ell(ctx, cx, cy, R, rim); ctx.fillStyle = rgrad(ctx, cx, cy, R * 0.2, R, [[0, darker(col, 0.15)], [1, lighter(col, 0.28)]], cx - R * 0.3, cy - rim * 0.3); ctx.fill();
  ctx.strokeStyle = rgba(lighter(col, 0.65), 0.7); ctx.lineWidth = 2; ell(ctx, cx, cy, R, rim); ctx.stroke();
  const fr = R * 0.8; ell(ctx, cx, cy + 1, fr, fr * ryk); ctx.fillStyle = rgrad(ctx, cx, cy, fr * 0.1, fr * 1.05, [[0, lighter(tone ?? col, 0.38)], [0.5, tone ?? col], [1, darker(tone ?? col, 0.38)]], cx - fr * 0.32, cy - fr * ryk * 0.4); ctx.fill();
  ctx.strokeStyle = rgba(darker(col, 0.7), 0.5); ctx.lineWidth = 1.2; for (const k of [0.45, 0.62]) { ell(ctx, cx, cy + 1, fr * k * 1.5, fr * k * 1.5 * ryk); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,246,220,0.3)'; ctx.lineWidth = R * 0.05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.ellipse(cx, cy, fr * 0.8, fr * 0.8 * ryk, 0, PI * 1.1, PI * 1.5); ctx.stroke();
  // the boss
  const br = R * boss, bh = br * ryk;
  ell(ctx, cx + br * 0.12, cy + 2 + bh * 0.3, br * 1.08, bh * 1.1); ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.fill();
  ell(ctx, cx, cy - bh * 0.15, br, bh * 1.05); ctx.fillStyle = rgrad(ctx, cx, cy - bh * 0.15, 0, br * 1.1, [[0, lighter(col, 0.85)], [0.4, lighter(col, 0.2)], [1, darker(col, 0.5)]], cx - br * 0.34, cy - bh * 0.55); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,244,0.65)'; ell(ctx, cx - br * 0.34, cy - bh * 0.5, br * 0.2, bh * 0.16); ctx.fill();
  void seed; void lip;
  if (f > 0.05) { ctx.globalCompositeOperation = 'lighter'; ell(ctx, cx, cy, R, rim); ctx.fillStyle = rgrad(ctx, cx, cy, R * 0.05, R, [[0, `rgba(255,236,170,${0.55 * f})`], [1, `rgba(255,190,90,${0.06 * f})`]]); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
}

// a padded beater (a stick whose head is wrapped in cloth or cord), drawn from the grip (x,y) along `ang`; head radius hr. o { wood, pad, a }
export function padBeater(ctx, x, y, ang, len, hr, o = {}) {
  const { wood = '#c89a58', pad = '#e8dcc0', a = 1 } = o;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(ang);
  const w = Math.max(5, hr * 0.5);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.moveTo(0, -w * 0.5 + 6); ctx.lineTo(len, -w * 0.32 + 6); ctx.lineTo(len, w * 0.32 + 6); ctx.lineTo(0, w * 0.5 + 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = vgrad(ctx, -w * 0.5, w * 0.5, [[0, lighter(wood, 0.4)], [0.5, wood], [1, darker(wood, 0.55)]]);
  ctx.beginPath(); ctx.moveTo(0, -w * 0.5); ctx.lineTo(len, -w * 0.32); ctx.lineTo(len, w * 0.32); ctx.lineTo(0, w * 0.5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rgba(darker(wood, 0.7), 0.55); ctx.lineWidth = 1.2; ctx.stroke();
  // the padded head: a wrapped ball with cord turns
  ctx.fillStyle = rgrad(ctx, len, 0, 0, hr * 1.1, [[0, lighter(pad, 0.5)], [0.6, pad], [1, darker(pad, 0.5)]], len - hr * 0.3, -hr * 0.3); circ(ctx, len + hr * 0.3, 0, hr); ctx.fill();
  ctx.strokeStyle = rgba(darker(pad, 0.5), 0.45); ctx.lineWidth = 1.3; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(len + hr * 0.3 + k * hr * 0.3, 0, hr * 0.14, hr * 0.92 * Math.sqrt(Math.max(0.05, 1 - (k * 0.3) ** 2)), 0, 0, TAU); ctx.stroke(); }
  ctx.restore();
}

// a hanging cord: two strands from (x0,y0) to (x1,y1), twisted look, optional tassel at the lower end. o { col, w, tassel }
export function hangCord(ctx, x0, y0, x1, y1, o = {}) {
  const { col = '#d8c08a', w = 6, tassel = null } = o;
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.32)'; ctx.lineWidth = w + 2; ctx.beginPath(); ctx.moveTo(x0 + 3, y0 + 3); ctx.lineTo(x1 + 3, y1 + 3); ctx.stroke();
  ctx.strokeStyle = darker(col, 0.4); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = lighter(col, 0.35); ctx.lineWidth = Math.max(1, w * 0.42); ctx.setLineDash([w * 0.9, w * 0.8]); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.setLineDash([]);
  if (tassel) { const t = tassel, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L; ctx.fillStyle = t.col ?? '#b8252a'; for (let k = -3; k <= 3; k++) { ctx.strokeStyle = k % 2 ? (t.col ?? '#b8252a') : lighter(t.col ?? '#b8252a', 0.25); ctx.lineWidth = w * 0.4; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + ux * t.len + (-uy) * k * w * 0.5, y1 + uy * t.len + ux * k * w * 0.5); ctx.stroke(); } }
  ctx.restore();
}

// a wooden or lacquer beam from (x,y) w x h with grain and a lit top edge. o { col, seed, round }
export function beam(ctx, x, y, w, h, col = '#8a5a2c', o = {}) {
  const r = o.round ?? Math.min(w, h) * 0.18;
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; rrect(ctx, x + 6, y + 9, w, h, r); ctx.fill();
  ctx.save(); rrect(ctx, x, y, w, h, r);
  ctx.fillStyle = (o.vertical ?? w < h) ? hgrad(ctx, x, x + w, [[0, darker(col, 0.55)], [0.25, lighter(col, 0.32)], [0.55, col], [0.85, darker(col, 0.42)], [1, darker(col, 0.66)]]) : vgrad(ctx, y, y + h, [[0, lighter(col, 0.38)], [0.3, col], [0.8, darker(col, 0.5)], [1, darker(col, 0.65)]]); ctx.fill(); ctx.clip();
  if (o.grain !== false) grain(ctx, x, y, w, h, darker(col, 0.7), 0.38, o.seed ?? 5, w < h, Math.max(5, Math.round(Math.min(w, h) / 6)));
  ctx.restore(); rrect(ctx, x, y, w, h, r); ctx.strokeStyle = rgba(darker(col, 0.8), 0.7); ctx.lineWidth = 1.8; ctx.stroke();
}

// gilt scrollwork along a horizontal band: repeating spirals. (x0,x1,y) mid line, h band height, col gilt colour
export function scrollBand(ctx, x0, x1, y, h, col = '#e8c260', o = {}) {
  const n = Math.max(2, Math.round((x1 - x0) / (h * 1.25))), st = (x1 - x0) / n;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [lw, c, dy] of [[Math.max(2, h * 0.16) + 2, 'rgba(0,0,0,0.35)', 2], [Math.max(2, h * 0.16), col, 0], [Math.max(1, h * 0.05), lighter(col, 0.6), -1]]) {
    ctx.strokeStyle = c; ctx.lineWidth = lw;
    for (let k = 0; k < n; k++) {
      const x = x0 + k * st, s = k % 2 ? -1 : 1;
      ctx.beginPath(); ctx.moveTo(x, y + dy + s * h * 0.3);
      ctx.bezierCurveTo(x + st * 0.3, y + dy + s * h * 0.55, x + st * 0.55, y + dy - s * h * 0.5, x + st * 0.78, y + dy - s * h * 0.12);
      ctx.bezierCurveTo(x + st * 0.92, y + dy + s * h * 0.1, x + st * 0.72, y + dy + s * h * 0.3, x + st * 0.64, y + dy + s * h * 0.12); ctx.stroke();
    }
  }
  if (o.dots !== false) { ctx.fillStyle = lighter(col, 0.3); for (let k = 0; k <= n; k++) { circ(ctx, x0 + k * st, y, Math.max(1.5, h * 0.07)); ctx.fill(); } }
  ctx.restore();
}

// a small hanging flame lamp: brass cup, glowing bulb (wavers a little)
export function lamp(ctx, x, y, r, t, col = '#ffd890') {
  glow(ctx, x, y + r * 0.6, r * 6, col, 0.3 + 0.04 * Math.sin(t * 5 + x));
  ctx.fillStyle = rgrad(ctx, x - r * 0.3, y, 0, r * 1.3, [[0, '#ffffff'], [0.45, col], [1, darker(col, 0.35)]]); ell(ctx, x, y + r * 0.7, r * 0.7, r); ctx.fill();
  ctx.fillStyle = hgrad(ctx, x - r, x + r, [[0, '#6a4a10'], [0.4, '#e8c060'], [1, '#5a3a08']]); rrect(ctx, x - r * 0.95, y - r * 0.1, r * 1.9, r * 0.45, 4); ctx.fill();
}

// ripples of sound: rings travelling out of a struck point. f = flash 0..1
export function rings(ctx, x, y, R, f, col = '255,244,214') {
  if (f <= 0.04) return;
  for (let k = 0; k < 3; k++) { const p = clamp((1 - f) * 1.3 - k * 0.16, 0, 1); if (p <= 0 || p >= 1) continue; ctx.strokeStyle = `rgba(${col},${0.5 * (1 - p)})`; ctx.lineWidth = 3.4 - k; ctx.beginPath(); ctx.arc(x, y, R * (1 + 0.5 * p), 0, TAU); ctx.stroke(); }
}

// a lit rope / cord loop between two points (sag in px)
export function swag(ctx, x0, y0, x1, y1, sag, w, col) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + sag;
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = w + 2; ctx.beginPath(); ctx.moveTo(x0 + 2, y0 + 3); ctx.quadraticCurveTo(mx + 2, my + 3, x1 + 2, y1 + 3); ctx.stroke();
  ctx.strokeStyle = darker(col, 0.4); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x1, y1); ctx.stroke();
  ctx.strokeStyle = lighter(col, 0.4); ctx.lineWidth = Math.max(1, w * 0.36); ctx.setLineDash([w * 1.1, w * 0.9]); ctx.beginPath(); ctx.moveTo(x0, y0 - 1); ctx.quadraticCurveTo(mx, my - 1, x1, y1 - 1); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
}

// an eRing without the stray seam: the old path joined its two ellipses with a line along +x. A ring between f0 and f1 (fractions of rx, ry) of the ellipse at (cx,cy).
export function ringSpot(cx, cy, rx, ry, f0, f1, ang = -PI / 2, o = {}) {
  const hw = (f1 - f0) / 2, fm = (f0 + f1) / 2, ax = Math.cos(ang) * rx * fm, ay = Math.sin(ang) * ry * fm, cueR = Math.max(10, Math.min(rx, ry) * hw * 1.1);
  return { v: cx + ax, u: cy + ay, r: Math.min(rx, ry) * hw, evenodd: true, ap: { cx: cx + ax, cy: cy + ay, rx: cueR, ry: cueR, rot: 0 },
    dist: (lv, lu) => { const px = (lv - cx) / rx, py = (lu - cy) / ry, d = Math.hypot(px, py); return d < f0 ? 1 + (f0 - d) / hw * 1.6 : d > f1 ? 1 + (d - f1) / hw * 1.6 : Math.abs(d - fm) / hw * 0.9; },
    path: (g) => { g.beginPath(); g.ellipse(cx, cy, Math.max(0.1, rx * f1), Math.max(0.1, ry * f1), 0, 0, TAU); g.moveTo(cx + rx * f0, cy); g.ellipse(cx, cy, Math.max(0.1, rx * f0), Math.max(0.1, ry * f0), 0, 0, TAU, true); }, ...(o.extra ?? {}) };
}

// shape-craft 1.19.0: three more painted folk dolls on the lathe (decorations added to DECO / MARKS of doll.js; nothing existing changes).
//   vanka    Vanka-vstanka, Russia: a round-bottomed tumbler clown in a pointed blue cap, ruff and red polka-dot coat.
//   kimekomi Edo kimekomi, Japan: a carved paulownia doll dressed in cloth tucked into grooves (dark groove lines round every cloth panel, a brocade sash).
//   budao    Budaoweng, China: a tumbler in an official's black cap and a gold robe with a cloud-collar, a thin white moustache and goatee.
// Dolls are objects: faces are stylised marks (arcs, dots, a few strokes), never a portrait. Pure canvas 2D, deterministic (hash, never Math.random).
import { DECO, MARKS } from './doll.js';
import { hash } from './geom.js';
import { tint, rgba } from './fx.js';

const TAU = Math.PI * 2;
const ell = (ctx, x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); };
const lgr = (ctx, x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); for (const [o, c] of stops) g.addColorStop(o, c); return g; };
const ink = (g, k, d) => (g.F.decoInk && g.F.decoInk[k]) || d;
const on = (g, k) => !g.marks || !!g.marks[k];
function head(g) {
  const { top, H, R, F } = g, hy = top + H * (F.headAt ?? 0.07);
  if (F.headK) return { hy, hr: R(Math.min(top + H, Math.max(top, hy))) * F.headK };
  let hr = 0; for (let q = 0; q <= 8; q++) hr = Math.max(hr, R(top + (H * 0.22 * q) / 8));
  return { hy, hr };
}
const rim = (ctx, c, w) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke(); };

MARKS.vanka = [{ k: 'eyeL', fx: -0.3, fy: 0.02 }, { k: 'eyeR', fx: 0.3, fy: 0.02 }, { k: 'mouth', fx: 0, fy: 0.5 }];
MARKS.kimekomi = [{ k: 'eyeL', fx: -0.3, fy: 0.12 }, { k: 'eyeR', fx: 0.3, fy: 0.12 }, { k: 'mouth', fx: 0, fy: 0.55 }];
MARKS.budao = [{ k: 'eyeL', fx: -0.3, fy: 0.02 }, { k: 'eyeR', fx: 0.3, fy: 0.02 }, { k: 'mouth', fx: 0, fy: 0.46 }];

// a short scalloped collar band at y, half-width w
function ruff(ctx, cx, y, w, h, c1, c2, n = 11) {
  for (let layer = 0; layer < 2; layer++) {
    const m = n + layer * 2, c = layer ? c2 : c1, yy = y + layer * h * 0.34;
    ctx.fillStyle = c;
    for (let q = 0; q < m; q++) { const x = cx - w + ((q + 0.5) * 2 * w) / m; ell(ctx, x, yy, (w / m) * 1.12, h * 0.5); ctx.fill(); ctx.strokeStyle = rgba(tint(c, -0.55), 0.55); ctx.lineWidth = 0.9; ctx.stroke(); }
  }
}
// a rosy cheek
function cheek(ctx, x, y, r, c, a = 0.42) { const cg = ctx.createRadialGradient(x, y, 0, x, y, r); cg.addColorStop(0, rgba(c, a)); cg.addColorStop(1, rgba(c, 0)); ctx.fillStyle = cg; ctx.fillRect(x - r, y - r, r * 2, r * 2); }

DECO.vanka = function (ctx, g) {
  const { cx, top, H, R } = g, { hy, hr } = head(g), red = ink(g, 'red', '#c8282c'), blue = ink(g, 'blue', '#2457b0'), gold = ink(g, 'gold', '#f0c23a'), white = '#faf4e8', lw = Math.max(1.1, hr * 0.045);
  // coat: red polka dots in staggered rows and three big buttons
  const c0 = hy + hr * 1.05, c1 = top + H * 0.9;
  ctx.fillStyle = white;
  for (let row = 0; row < 7; row++) { const y = c0 + hr * 0.5 + row * hr * 0.62; if (y > c1) break; const r2 = R(y) * 0.92, nn = Math.max(2, Math.round((r2 * 2) / (hr * 0.62))); for (let q = 0; q < nn; q++) { const u = ((q + (row % 2 ? 0.5 : 0)) / nn) * 2 - 1; if (Math.abs(u) > 0.93) continue; const px = cx + u * r2, sq = Math.sqrt(Math.max(0, 1 - u * u)); ell(ctx, px, y, hr * 0.12 * (0.45 + 0.55 * sq), hr * 0.12); ctx.fill(); } }
  for (let q = 0; q < 3; q++) { const y = c0 + hr * (0.62 + q * 0.78); ctx.fillStyle = lgr(ctx, cx - hr * 0.2, y - hr * 0.2, cx + hr * 0.2, y + hr * 0.2, [[0, tint(gold, 0.45)], [1, tint(gold, -0.35)]]); ell(ctx, cx, y, hr * 0.17, hr * 0.17); ctx.fill(); rim(ctx, 'rgba(60,30,0,0.55)', 1); }
  // blue hem with a gold line
  ctx.fillStyle = blue; ctx.fillRect(cx - R(top + H * 0.9) - 2, top + H * 0.9, R(top + H * 0.9) * 2 + 4, H * 0.12); ctx.fillStyle = gold; ctx.fillRect(cx - R(top + H * 0.88) - 2, top + H * 0.88, R(top + H * 0.88) * 2 + 4, H * 0.014);
  // ruff
  ruff(ctx, cx, hy + hr * 0.92, hr * 1.05, hr * 0.34, white, '#e9dfcb', 11);
  // face: a cream oval with round rosy cheeks, a red round nose, small eyes and a wide smile
  ctx.fillStyle = lgr(ctx, cx - hr, 0, cx + hr, 0, [[0, '#d8bd98'], [0.4, '#fbe6cb'], [1, '#d0b088']]); ell(ctx, cx, hy + hr * 0.14, hr * 0.84, hr * 0.8); ctx.fill(); rim(ctx, 'rgba(90,50,20,0.55)', lw * 0.8);
  cheek(ctx, cx - hr * 0.5, hy + hr * 0.36, hr * 0.3, '#e04a4a', 0.55); cheek(ctx, cx + hr * 0.5, hy + hr * 0.36, hr * 0.3, '#e04a4a', 0.55);
  ctx.fillStyle = '#d83a30'; ell(ctx, cx, hy + hr * 0.26, hr * 0.12, hr * 0.11); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ell(ctx, cx - hr * 0.04, hy + hr * 0.22, hr * 0.035, hr * 0.03); ctx.fill();
  ctx.strokeStyle = '#3a2418'; ctx.lineWidth = lw * 0.9; ctx.lineCap = 'round';
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sx * hr * 0.55, hy - hr * 0.17); ctx.quadraticCurveTo(cx + sx * hr * 0.32, hy - hr * 0.34, cx + sx * hr * 0.12, hy - hr * 0.2); ctx.stroke(); }
  for (const sx of [-1, 1]) if (on(g, sx < 0 ? 'eyeL' : 'eyeR')) { const ex = cx + sx * hr * 0.3, ey = hy + hr * 0.02; ctx.fillStyle = '#fffdf6'; ell(ctx, ex, ey, hr * 0.13, hr * 0.12); ctx.fill(); rim(ctx, '#3a2418', lw * 0.7); ctx.fillStyle = '#1c1410'; ell(ctx, ex, ey + hr * 0.01, hr * 0.065, hr * 0.075); ctx.fill(); ctx.fillStyle = '#fff'; ell(ctx, ex - hr * 0.02, ey - hr * 0.025, hr * 0.02, hr * 0.02); ctx.fill(); }
  if (on(g, 'mouth')) { ctx.fillStyle = '#b02424'; ctx.beginPath(); ctx.moveTo(cx - hr * 0.34, hy + hr * 0.48); ctx.quadraticCurveTo(cx, hy + hr * 0.84, cx + hr * 0.34, hy + hr * 0.48); ctx.quadraticCurveTo(cx, hy + hr * 0.56, cx - hr * 0.34, hy + hr * 0.48); ctx.fill(); rim(ctx, '#5a1010', lw * 0.7); }
  // cap: a pointed blue cap over the brow with a gold band, white stars and a gold pompom
  const by = hy - hr * 0.4;
  ctx.fillStyle = lgr(ctx, cx - hr, 0, cx + hr, 0, [[0, tint(blue, -0.5)], [0.35, tint(blue, 0.22)], [0.6, blue], [1, tint(blue, -0.55)]]);
  ctx.beginPath(); ctx.moveTo(cx - hr * 1.4, by + hr * 0.04); ctx.quadraticCurveTo(cx - hr * 0.2, by - hr * 0.06, cx - hr * 0.1, top - hr * 1.4); ctx.lineTo(cx + hr * 1.4, top - hr * 1.4); ctx.lineTo(cx + hr * 1.4, by + hr * 0.04); ctx.quadraticCurveTo(cx, by + hr * 0.16, cx - hr * 1.4, by + hr * 0.04); ctx.closePath(); ctx.fill();
  ctx.fillStyle = gold; ctx.beginPath(); ctx.moveTo(cx - hr * 1.4, by - hr * 0.1); ctx.quadraticCurveTo(cx, by + hr * 0.06, cx + hr * 1.4, by - hr * 0.1); ctx.lineTo(cx + hr * 1.4, by + hr * 0.1); ctx.quadraticCurveTo(cx, by + hr * 0.26, cx - hr * 1.4, by + hr * 0.1); ctx.closePath(); ctx.fill(); rim(ctx, 'rgba(60,30,0,0.5)', 1);
  ctx.fillStyle = white; for (let q = 0; q < 6; q++) { const sx = cx + (hash(q, 61) - 0.5) * hr * 1.5, sy = by - hr * 0.35 - hash(q, 62) * hr * 0.9; for (let k = 0; k < 5; k++) { const a = (k * TAU) / 5 - 1.57, a2 = a + TAU / 10; ctx.beginPath(); ctx.moveTo(sx + Math.cos(a) * hr * 0.13, sy + Math.sin(a) * hr * 0.13); ctx.lineTo(sx + Math.cos(a2) * hr * 0.055, sy + Math.sin(a2) * hr * 0.055); ctx.lineTo(sx + Math.cos(a + TAU / 5) * hr * 0.13, sy + Math.sin(a + TAU / 5) * hr * 0.13); ctx.lineTo(sx, sy); ctx.fill(); } }
  ctx.fillStyle = gold; ell(ctx, cx, top + hr * 0.02, hr * 0.17, hr * 0.17); ctx.fill();
  void lw;
};

DECO.kimekomi = function (ctx, g) {
  const { cx, top, H, R } = g, { hy, hr } = head(g), red = ink(g, 'red', '#b3232f'), gold = ink(g, 'gold', '#d9a838'), indigo = ink(g, 'indigo', '#25396e'), hair = ink(g, 'hair', '#14100f'), lw = Math.max(1.1, hr * 0.04);
  const groove = (x0, y0, x1, y1, bx, by, w) => { ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(20,10,4,0.82)'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(bx, by, x1, y1); ctx.stroke(); ctx.strokeStyle = 'rgba(255,235,200,0.28)'; ctx.lineWidth = w * 0.45; ctx.beginPath(); ctx.moveTo(x0 + w * 0.6, y0 + w * 0.5); ctx.quadraticCurveTo(bx + w * 0.6, by + w * 0.5, x1 + w * 0.6, y1 + w * 0.5); ctx.stroke(); };
  // the kimono skirt: cloth panels cut by grooves. Pattern: pale blossoms and a small gold ring on the red cloth, a wave band of indigo cloth at the hem
  const ob0 = top + H * 0.44, ob1 = top + H * 0.58, hem = top + H * 0.82;
  const blossom = (x, y, r, c) => { ctx.fillStyle = c; for (let q = 0; q < 5; q++) { const a = (q * TAU) / 5 - 1.57; ell(ctx, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.46, r * 0.4, a); ctx.fill(); } ctx.fillStyle = gold; ell(ctx, x, y, r * 0.2, r * 0.2); ctx.fill(); };
  for (let row = 0; row < 4; row++) { const y = ob1 + hr * 0.5 + row * hr * 0.75; if (y > hem - hr * 0.15) break; const r2 = R(y) * 0.8, nn = Math.max(2, Math.round((r2 * 2) / (hr * 0.85))); for (let q = 0; q < nn; q++) { const u = ((q + (row % 2 ? 0.5 : 0.25)) / nn) * 2 - 1; if (Math.abs(u) > 0.86) continue; blossom(cx + u * r2, y, hr * 0.17 * (0.5 + 0.5 * Math.sqrt(1 - u * u)), row % 2 ? '#f7e4e0' : '#f0b8c4'); } }
  ctx.fillStyle = indigo; ctx.fillRect(cx - R(hem) - 2, hem, R(hem) * 2 + 4, H * 0.2);
  ctx.strokeStyle = 'rgba(240,236,220,0.7)'; ctx.lineWidth = Math.max(1, H * 0.006); for (let row = 0; row < 2; row++) for (let q = -5; q <= 5; q++) { const ww = R(hem + H * 0.06) * 0.2; ctx.beginPath(); ctx.arc(cx + q * ww * 0.9 + (row ? ww * 0.45 : 0), hem + H * (0.045 + row * 0.055), ww * 0.5, Math.PI, 0); ctx.stroke(); }
  groove(cx - R(ob1) * 0.98, hem - H * 0.01, cx - R(ob1) * 0.1, ob1 + H * 0.02, cx - R(ob1) * 0.5, hem - H * 0.12, Math.max(1.6, H * 0.008));
  groove(cx + R(ob1) * 0.98, hem - H * 0.01, cx + R(ob1) * 0.12, ob1 + H * 0.02, cx + R(ob1) * 0.5, hem - H * 0.12, Math.max(1.6, H * 0.008));
  groove(cx - R(hem) - 2, hem, cx + R(hem) + 2, hem, cx, hem, Math.max(1.8, H * 0.009));
  // the sash (obi): a wide brocade band with a diamond lattice, groove edges and a small knot
  ctx.fillStyle = lgr(ctx, 0, ob0, 0, ob1, [[0, tint(gold, 0.25)], [0.5, gold], [1, tint(gold, -0.4)]]); ctx.fillRect(cx - R(ob0) - 2, ob0, R(ob0) * 2 + 4, ob1 - ob0);
  ctx.save(); ctx.beginPath(); ctx.rect(cx - R(ob0) - 2, ob0, R(ob0) * 2 + 4, ob1 - ob0); ctx.clip(); ctx.strokeStyle = rgba('#7a3a14', 0.55); ctx.lineWidth = 1; const ds = (ob1 - ob0) * 0.5; for (let q = -12; q <= 12; q++) { ctx.beginPath(); ctx.moveTo(cx + q * ds, ob0); ctx.lineTo(cx + q * ds + (ob1 - ob0), ob1); ctx.moveTo(cx + q * ds + (ob1 - ob0), ob0); ctx.lineTo(cx + q * ds, ob1); ctx.stroke(); } ctx.fillStyle = rgba(red, 0.9); for (let q = -6; q <= 6; q++) { ell(ctx, cx + q * ds * 2, (ob0 + ob1) / 2, ds * 0.32, ds * 0.32); ctx.fill(); } ctx.restore();
  groove(cx - R(ob0) - 2, ob0, cx + R(ob0) + 2, ob0, cx, ob0, Math.max(1.8, H * 0.009)); groove(cx - R(ob1) - 2, ob1, cx + R(ob1) + 2, ob1, cx, ob1, Math.max(1.8, H * 0.009));
  // collar: white under-collar crossed over in a V from the neck to the sash, red edge
  const ny = hy + hr * 1.02, cw = R(ny) * 1.05;
  ctx.fillStyle = '#f6efe2'; ctx.beginPath(); ctx.moveTo(cx - cw, ny - hr * 0.08); ctx.lineTo(cx + cw * 0.06, ob0 - H * 0.01); ctx.lineTo(cx + cw * 0.34, ob0 - H * 0.01); ctx.lineTo(cx - cw * 0.5, ny - hr * 0.08); ctx.closePath(); ctx.fill();
  ctx.fillStyle = red; ctx.beginPath(); ctx.moveTo(cx + cw, ny - hr * 0.08); ctx.lineTo(cx - cw * 0.06, ob0 - H * 0.01); ctx.lineTo(cx - cw * 0.34, ob0 - H * 0.01); ctx.lineTo(cx + cw * 0.5, ny - hr * 0.08); ctx.closePath(); ctx.fill();
  groove(cx - cw, ny - hr * 0.08, cx + cw * 0.06, ob0 - H * 0.01, cx - cw * 0.5, ny + (ob0 - ny) * 0.5, Math.max(1.4, H * 0.006)); groove(cx + cw, ny - hr * 0.08, cx - cw * 0.06, ob0 - H * 0.01, cx + cw * 0.5, ny + (ob0 - ny) * 0.5, Math.max(1.4, H * 0.006));
  // face: a smooth white oval, small features; black glossy hair with a centre parting and a gold comb with red beads
  ctx.fillStyle = lgr(ctx, cx - hr, 0, cx + hr, 0, [[0, '#d9cdbd'], [0.4, '#fbf6ee'], [1, '#cfc2b2']]); ell(ctx, cx, hy + hr * 0.2, hr * 0.82, hr * 0.86); ctx.fill();
  ctx.fillStyle = lgr(ctx, cx - hr, 0, cx + hr, 0, [[0, '#070505'], [0.38, '#3a302b'], [0.58, hair], [1, '#050404']]);
  ctx.beginPath(); ctx.moveTo(cx - hr * 1.4, top - hr * 1.4); ctx.lineTo(cx + hr * 1.4, top - hr * 1.4); ctx.lineTo(cx + hr * 1.4, hy + hr * 0.5); ctx.lineTo(cx + hr * 0.84, hy + hr * 0.46); ctx.bezierCurveTo(cx + hr * 0.86, hy - hr * 0.2, cx + hr * 0.5, hy - hr * 0.56, cx, hy - hr * 0.62); ctx.bezierCurveTo(cx - hr * 0.5, hy - hr * 0.56, cx - hr * 0.86, hy - hr * 0.2, cx - hr * 0.84, hy + hr * 0.46); ctx.lineTo(cx - hr * 1.4, hy + hr * 0.5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(cx - hr * 0.6, hy - hr * 0.7); ctx.quadraticCurveTo(cx - hr * 0.2, hy - hr * 0.95, cx + hr * 0.3, hy - hr * 0.78); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = lw * 0.8; ctx.beginPath(); ctx.moveTo(cx, hy - hr * 0.62); ctx.lineTo(cx, hy - hr * 1.15); ctx.stroke();
  const kx = cx + hr * 0.78, ky = hy - hr * 0.3; ctx.strokeStyle = gold; ctx.lineWidth = lw * 1.4; ctx.beginPath(); ctx.moveTo(kx - hr * 0.35, ky - hr * 0.45); ctx.lineTo(kx + hr * 0.02, ky + hr * 0.05); ctx.stroke(); for (let q = 0; q < 4; q++) { ctx.fillStyle = q % 2 ? red : '#f7e4e0'; ell(ctx, kx - hr * 0.3 + q * hr * 0.1, ky - hr * 0.38 + q * hr * 0.14, hr * 0.085, hr * 0.085); ctx.fill(); rim(ctx, 'rgba(60,20,10,0.5)', 0.8); }
  ctx.strokeStyle = '#3a2418'; ctx.lineCap = 'round';
  for (const sx of [-1, 1]) { ctx.lineWidth = lw * 0.7; ctx.beginPath(); ctx.moveTo(cx + sx * hr * 0.5, hy - hr * 0.1); ctx.quadraticCurveTo(cx + sx * hr * 0.3, hy - hr * 0.2, cx + sx * hr * 0.12, hy - hr * 0.08); ctx.stroke(); }
  for (const sx of [-1, 1]) if (on(g, sx < 0 ? 'eyeL' : 'eyeR')) { const ex = cx + sx * hr * 0.3, ey = hy + hr * 0.12; ctx.lineWidth = lw * 1.1; ctx.beginPath(); ctx.moveTo(ex - hr * 0.15, ey + hr * 0.01); ctx.quadraticCurveTo(ex, ey - hr * 0.13, ex + hr * 0.15, ey + hr * 0.01); ctx.stroke(); ctx.lineWidth = lw * 0.55; ctx.beginPath(); ctx.moveTo(ex - hr * 0.1, ey + hr * 0.05); ctx.quadraticCurveTo(ex, ey + hr * 0.12, ex + hr * 0.1, ey + hr * 0.05); ctx.stroke(); }
  cheek(ctx, cx - hr * 0.5, hy + hr * 0.4, hr * 0.24, '#f07a8a', 0.4); cheek(ctx, cx + hr * 0.5, hy + hr * 0.4, hr * 0.24, '#f07a8a', 0.4);
  ctx.strokeStyle = 'rgba(130,90,60,0.7)'; ctx.lineWidth = lw * 0.6; ctx.beginPath(); ctx.moveTo(cx, hy + hr * 0.3); ctx.quadraticCurveTo(cx + hr * 0.04, hy + hr * 0.36, cx - hr * 0.01, hy + hr * 0.39); ctx.stroke();
  if (on(g, 'mouth')) { ctx.fillStyle = '#c4202c'; ctx.beginPath(); ctx.moveTo(cx - hr * 0.1, hy + hr * 0.56); ctx.quadraticCurveTo(cx, hy + hr * 0.5, cx + hr * 0.1, hy + hr * 0.56); ctx.quadraticCurveTo(cx, hy + hr * 0.68, cx - hr * 0.1, hy + hr * 0.56); ctx.fill(); }
};

DECO.budao = function (ctx, g) {
  const { cx, top, H, R } = g, { hy, hr } = head(g), gold = ink(g, 'gold', '#e6b830'), jade = ink(g, 'jade', '#2f8a66'), blue = ink(g, 'blue', '#27508e'), red = ink(g, 'red', '#bd2a24'), black = '#15110f', lw = Math.max(1.1, hr * 0.04);
  // robe: a round patch on the chest (rings and cloud scrolls), a jade belt with a plaque, blue wave scrolls at the hem
  const py = top + H * 0.5, pr = Math.min(R(py) * 0.55, hr * 1.1);
  ctx.fillStyle = rgba(red, 0.92); ell(ctx, cx, py, pr, pr); ctx.fill(); rim(ctx, gold, Math.max(1.5, pr * 0.07)); ctx.strokeStyle = gold; ctx.lineWidth = Math.max(1, pr * 0.045); ell(ctx, cx, py, pr * 0.78, pr * 0.78); ctx.stroke();
  for (let q = 0; q < 4; q++) { const a = (q * TAU) / 4 + 0.78; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * pr * 0.34, py + Math.sin(a) * pr * 0.34, pr * 0.22, a + 0.5, a + 5.4); ctx.stroke(); }
  ctx.fillStyle = gold; ell(ctx, cx, py, pr * 0.14, pr * 0.14); ctx.fill();
  const by = top + H * 0.68; ctx.fillStyle = jade; ctx.fillRect(cx - R(by) - 2, by, R(by) * 2 + 4, H * 0.045); ctx.fillStyle = gold; ctx.fillRect(cx - R(by) - 2, by, R(by) * 2 + 4, H * 0.008); ctx.fillRect(cx - R(by) - 2, by + H * 0.037, R(by) * 2 + 4, H * 0.008);
  for (let q = -2; q <= 2; q++) { ctx.fillStyle = q % 2 ? tint(jade, 0.4) : tint(jade, -0.25); ctx.fillRect(cx + q * R(by) * 0.3 - R(by) * 0.1, by + H * 0.005, R(by) * 0.2, H * 0.035); rim(ctx, gold, 0.8); }
  const hm = top + H * 0.82; ctx.fillStyle = blue; ctx.fillRect(cx - R(hm) - 2, hm, R(hm) * 2 + 4, H * 0.2);
  ctx.strokeStyle = gold; ctx.lineWidth = Math.max(1.1, H * 0.007); for (let row = 0; row < 2; row++) for (let q = -5; q <= 5; q++) { const ww = R(hm + H * 0.07) * 0.22; ctx.beginPath(); ctx.arc(cx + q * ww * 0.9 + (row ? ww * 0.45 : 0), hm + H * (0.055 + row * 0.055), ww * 0.5, Math.PI, 0); ctx.stroke(); }
  // collar: a cloud collar of four scalloped lobes
  const ny = hy + hr * 1.0; ctx.fillStyle = tint(gold, -0.1); for (const sx of [-1, 0, 1]) { ell(ctx, cx + sx * hr * 0.58, ny + hr * 0.1 + (sx ? hr * 0.04 : hr * 0.14), hr * 0.42, hr * 0.28); ctx.fill(); rim(ctx, 'rgba(90,50,10,0.7)', 1); }
  ctx.fillStyle = red; ell(ctx, cx, ny + hr * 0.26, hr * 0.14, hr * 0.14); ctx.fill();
  // face: a warm pale oval, rosy cheeks, long thin brows, narrow smiling eyes, a thin white moustache and a long goatee
  ctx.fillStyle = lgr(ctx, cx - hr, 0, cx + hr, 0, [[0, '#d5b690'], [0.4, '#f8e2c4'], [1, '#c9a880']]); ell(ctx, cx, hy + hr * 0.18, hr * 0.84, hr * 0.84); ctx.fill(); rim(ctx, 'rgba(90,50,20,0.5)', lw * 0.7);
  for (const sx of [-1, 1]) ell(ctx, cx + sx * hr * 0.84, hy + hr * 0.12, hr * 0.12, hr * 0.2), ctx.fill();
  cheek(ctx, cx - hr * 0.52, hy + hr * 0.34, hr * 0.28, '#e0605a', 0.5); cheek(ctx, cx + hr * 0.52, hy + hr * 0.34, hr * 0.28, '#e0605a', 0.5);
  ctx.strokeStyle = '#efe9dc'; ctx.lineCap = 'round'; ctx.lineWidth = lw * 1.5; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sx * hr * 0.64, hy - hr * 0.18); ctx.quadraticCurveTo(cx + sx * hr * 0.4, hy - hr * 0.34, cx + sx * hr * 0.14, hy - hr * 0.18); ctx.stroke(); ctx.strokeStyle = 'rgba(120,110,100,0.6)'; ctx.lineWidth = lw * 0.5; ctx.stroke(); ctx.strokeStyle = '#efe9dc'; ctx.lineWidth = lw * 1.5; }
  ctx.strokeStyle = '#3a2418'; for (const sx of [-1, 1]) if (on(g, sx < 0 ? 'eyeL' : 'eyeR')) { const ex = cx + sx * hr * 0.3, ey = hy + hr * 0.02; ctx.lineWidth = lw * 1.2; ctx.beginPath(); ctx.moveTo(ex - hr * 0.15, ey + hr * 0.04); ctx.quadraticCurveTo(ex, ey - hr * 0.14, ex + hr * 0.15, ey + hr * 0.04); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(140,90,60,0.7)'; ctx.lineWidth = lw * 0.6; ctx.beginPath(); ctx.moveTo(cx, hy + hr * 0.08); ctx.quadraticCurveTo(cx + hr * 0.06, hy + hr * 0.24, cx - hr * 0.02, hy + hr * 0.3); ctx.stroke();
  if (on(g, 'mouth')) { ctx.strokeStyle = '#a8301e'; ctx.lineWidth = lw * 1.1; ctx.beginPath(); ctx.moveTo(cx - hr * 0.16, hy + hr * 0.5); ctx.quadraticCurveTo(cx, hy + hr * 0.62, cx + hr * 0.16, hy + hr * 0.5); ctx.stroke(); }
  ctx.strokeStyle = '#f2eee6'; ctx.lineCap = 'round'; ctx.lineWidth = lw * 1.1;
  for (const sx of [-1, 1]) for (let q = 0; q < 3; q++) { ctx.beginPath(); ctx.moveTo(cx + sx * hr * 0.03, hy + hr * (0.4 + q * 0.03)); ctx.quadraticCurveTo(cx + sx * hr * 0.35, hy + hr * (0.36 + q * 0.05), cx + sx * hr * (0.62 + q * 0.04), hy + hr * (0.5 + q * 0.11)); ctx.stroke(); }
  ctx.fillStyle = '#f4f0e8'; ctx.beginPath(); ctx.moveTo(cx - hr * 0.16, hy + hr * 0.66); ctx.quadraticCurveTo(cx, hy + hr * 0.7, cx + hr * 0.16, hy + hr * 0.66); ctx.lineTo(cx + hr * 0.06, hy + hr * 1.08); ctx.lineTo(cx, hy + hr * 1.16); ctx.lineTo(cx - hr * 0.06, hy + hr * 1.08); ctx.closePath(); ctx.fill(); rim(ctx, 'rgba(120,110,100,0.7)', 0.8);
  // cap: a black official's cap with a gold band, a raised back and a gold button
  const cb = hy - hr * 0.42, top0 = top - hr * 1.4;
  const cap = () => { ctx.beginPath(); ctx.moveTo(cx - hr * 1.4, top0); ctx.lineTo(cx + hr * 1.4, top0); ctx.lineTo(cx + hr * 1.4, cb + hr * 0.3); ctx.quadraticCurveTo(cx + hr * 0.9, cb + hr * 0.12, cx, cb - hr * 0.02); ctx.quadraticCurveTo(cx - hr * 0.9, cb + hr * 0.12, cx - hr * 1.4, cb + hr * 0.3); ctx.closePath(); };
  ctx.fillStyle = lgr(ctx, cx - hr, 0, cx + hr, 0, [[0, '#050403'], [0.35, '#3a322c'], [0.6, black], [1, '#050403']]); cap(); ctx.fill();
  ctx.save(); cap(); ctx.clip(); ctx.strokeStyle = gold; ctx.lineWidth = hr * 0.13; ctx.beginPath(); ctx.moveTo(cx - hr * 1.4, cb + hr * 0.12); ctx.quadraticCurveTo(cx - hr * 0.9, cb - hr * 0.04, cx, cb - hr * 0.2); ctx.quadraticCurveTo(cx + hr * 0.9, cb - hr * 0.04, cx + hr * 1.4, cb + hr * 0.12); ctx.stroke();
  ctx.strokeStyle = rgba(gold, 0.5); ctx.lineWidth = lw * 0.8; ctx.beginPath(); ctx.moveTo(cx - hr * 1.4, cb - hr * 0.45); ctx.quadraticCurveTo(cx, cb - hr * 0.78, cx + hr * 1.4, cb - hr * 0.45); ctx.stroke(); ctx.restore();
  ctx.fillStyle = gold; ell(ctx, cx, cb - hr * 0.98, hr * 0.14, hr * 0.14); ctx.fill(); rim(ctx, 'rgba(60,30,0,0.6)', 1);
  void red;
};

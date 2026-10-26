// Drawing for the bake technique (tonir lavash, 1.26.0): the cutaway of the clay pit oven with its glowing wall, embers and heat shimmer; the baking sheets
// (pale, blistered, golden, scorched); the padded cushion and the dough on it, thin places showing the cloth through; the rolling pin; the stack of lavash.
import { hash } from './geom.js';
import { shadowed, rrect, rgba, mix, tint } from './fx.js';
import { hintPill } from './paint-ui.js';
import { drawHand, planksH, fsz, clamp, lerp, sm, lin, rad, TAU } from './kc-fire-lib.js';

export const BAKE_LOOKS = {
  tonir: {
    rules: () => [
      'Thin the dough on the cushion: drag over it in steady passes. Each pass thins what is under it; too fast and it tears, and a hole is lost for good. Aim for a sheet about a third of the starting thickness, the same everywhere; the Thickness bar in the dock shows how far you are and how even it is.',
      'Press To the oven, then press on the wall of the tonir where the sheet should go and hold. The cushion swings back; let go inside the lit part of the swing bar (the amber part is a wrinkled stick). Too early or too late and the sheet falls into the embers. A sheet will not hold on a wall that is too cool, nor on a place that is taken.',
      'The wall is hot low and on the fire side, cooler high and away from the fire; the glow shows it. A sheet bakes faster where it is hotter, and its thin places colour before its thick places. A place a sheet has just left stays cooler for a while: use another.',
      'Tap a sheet to hook it off: pale is raw, golden with blisters is right, dark is lost. A sheet left too long burns through and falls. You can stretch the next dough while the others bake.',
      'Score of a sheet: thin and even (the dough), a clean stick, the colour at the pull. A sheet that falls or burns scores nothing. The round is the mean of the whole order. Press Finish to hook everything off at once and stop.',
    ],
  },
};

// ---- colours of a baking sheet --------------------------------------------------------------------------------------------------------------
const STOPS = [[0, '#f1e6cc'], [0.18, '#eedcae'], [0.38, '#e4c274'], [0.56, '#d29a44'], [0.72, '#bd7430'], [0.88, '#95491a'], [1.05, '#4c2a14'], [1.3, '#1c120c']];
export const doneColor = (d) => { const k = clamp(d, 0, 1.3); for (let i = 1; i < STOPS.length; i++) if (k <= STOPS[i][0]) { const [a, ca] = STOPS[i - 1], [b, cb] = STOPS[i]; return mix(ca, cb, (k - a) / (b - a)); } return STOPS[STOPS.length - 1][1]; };

// ---- one sheet of lavash, an oval lit from the upper left, painted cell by cell ----------------------------------------------------------------------
export function drawSheet(ctx, cx, cy, a, b, s, o = {}) {
  const { CW, CH, inside, appear = 1, shadow = true, bs = 1 } = o;
  ctx.save(); ctx.translate(cx, cy);
  if (appear < 1) { const k = 1 + (1 - appear) * 0.28; ctx.scale(k, k); ctx.globalAlpha = clamp(appear * 2.2, 0, 1); }
  if (shadow) { ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.ellipse(a * 0.06, b * 0.1, a * 1.02, b * 1.04, 0, 0, TAU); ctx.fill(); }
  // an irregular outline: lavash is never a perfect oval
  const sid = s.id ?? 1;
  const edge = (k) => { ctx.beginPath(); for (let i = 0; i <= 40; i++) { const an = (i / 40) * TAU, w = 1 + 0.035 * Math.sin(an * 3 + hash(sid, 3) * 6) + 0.02 * Math.sin(an * 5 + hash(sid, 4) * 6); const x = Math.cos(an) * a * w * k, y = Math.sin(an) * b * w * k; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.closePath(); };
  const cells = s.cells ?? null, d0 = s.d ?? 0;
  edge(1); ctx.fillStyle = doneColor(Math.max(0, d0 - 0.06)); ctx.fill();
  ctx.save(); edge(1); ctx.clip();
  if (cells && CW) {
    const cw = (2 * a) / CW, ch = (2 * b) / CH, rr = Math.max(cw, ch) * 1.25;
    for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) {
      if (!inside(i, j)) continue;
      const k = j * CW + i, x = ((i + 0.5) / CW * 2 - 1) * a, y = ((j + 0.5) / CH * 2 - 1) * b, col = s.hole?.[k] ? '#2a1810' : doneColor(cells[k]);
      ctx.fillStyle = rad(ctx, x, y, 0, rr, [[0, rgba(col, 0.95)], [0.6, rgba(col, 0.6)], [1, rgba(col, 0)]]); ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    // blisters: domes that rise as it cooks, golden, scorched at the top where it is hottest
    const nb = Math.round(clamp((d0 - 0.1) / 0.4, 0, 1) * 44);
    for (let q = 0; q < nb; q++) {
      const ang = hash(q, 11, sid) * TAU, rd = Math.sqrt(hash(q, 12, sid)) * 0.84, bx = Math.cos(ang) * a * rd, by = Math.sin(ang) * b * rd, r = (3 + Math.pow(hash(q, 13), 1.6) * 12) * Math.max(0.55, a / 78) * bs, grow = clamp((d0 - 0.12 - q * 0.012) / 0.2, 0.2, 1), rr = r * grow;
      const col = tint(doneColor(Math.min(1.0, d0 * 0.92 + 0.04)), 0.12), scorch = clamp((d0 - 0.45) * 1.3, 0, 0.75);
      ctx.fillStyle = 'rgba(50,22,6,0.3)'; ctx.beginPath(); ctx.ellipse(bx + rr * 0.18, by + rr * 0.3, rr * 1.02, rr * 0.78, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = lin(ctx, bx - rr, by - rr, bx + rr, by + rr, [[0, rgba(tint(col, 0.32), 0.98)], [0.55, rgba(col, 0.98)], [1, rgba(mix(col, '#4a2208', 0.45), 0.98)]]); ctx.beginPath(); ctx.ellipse(bx, by, rr, rr * 0.84, 0, 0, TAU); ctx.fill();
      if (scorch > 0.05) { ctx.fillStyle = rgba(mix(col, '#2a1206', 0.55), 0.3 + 0.45 * scorch); ctx.beginPath(); ctx.ellipse(bx - rr * 0.1, by - rr * 0.16, rr * (0.22 + 0.3 * scorch), rr * (0.16 + 0.22 * scorch), 0.4, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = 'rgba(70,32,8,0.45)'; ctx.lineWidth = Math.max(1, rr * 0.12); ctx.beginPath(); ctx.arc(bx, by, rr * 0.96, 0.15, Math.PI * 0.85); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,248,225,0.55)'; ctx.lineWidth = Math.max(1, rr * 0.14); ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(bx, by, rr * 0.72, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke();
    }
    // holes are dark with a glowing edge
    if (s.hole) for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) { if (!inside(i, j)) continue; const k = j * CW + i; if (s.hole[k]) { const x = ((i + 0.5) / CW * 2 - 1) * a, y = ((j + 0.5) / CH * 2 - 1) * b; ctx.fillStyle = '#1c0e08'; ctx.beginPath(); ctx.ellipse(x, y, cw * 0.55, ch * 0.5, hash(k, 3) * 3, 0, TAU); ctx.fill(); ctx.strokeStyle = rgba('#ff9a3a', 0.5); ctx.lineWidth = 1; ctx.stroke(); } }
  }
  // edges brown first, with fine char specks where it is hottest
  if (cells && d0 > 0.2) { ctx.fillStyle = rad(ctx, 0, 0, Math.min(a, b) * 0.55, Math.max(a, b) * 1.05, [[0, 'rgba(60,24,6,0)'], [0.7, `rgba(90,40,10,${clamp((d0 - 0.2) * 0.35, 0, 0.35)})`], [1, `rgba(40,16,4,${clamp((d0 - 0.2) * 0.6, 0, 0.6)})`]]); ctx.fillRect(-a * 1.1, -b * 1.1, a * 2.2, b * 2.2); for (let q = 0; q < Math.round(clamp((d0 - 0.45) * 60, 0, 40)); q++) { const an = hash(q, 71, sid) * TAU, rd2 = Math.sqrt(hash(q, 72, sid)) * 0.95; ctx.fillStyle = `rgba(30,12,4,${0.35 + 0.4 * hash(q, 73)})`; ctx.fillRect(Math.cos(an) * a * rd2, Math.sin(an) * b * rd2, 1.2 + hash(q, 74) * 2, 1 + hash(q, 75) * 1.6); } }
  // wrinkles of a sheet that did not stick cleanly
  if (s.wrinkled) { ctx.strokeStyle = 'rgba(70,35,10,0.35)'; ctx.lineWidth = Math.max(1.2, a * 0.02); ctx.lineCap = 'round'; for (let q = 0; q < 5; q++) { ctx.beginPath(); const x0 = (hash(q, 21) - 0.5) * a * 1.4, y0 = (hash(q, 22) - 0.5) * b * 1.4; ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + a * 0.2, y0 + b * 0.18, x0 + a * (0.3 + hash(q, 23) * 0.2), y0 + b * (hash(q, 24) - 0.4) * 0.5); ctx.stroke(); } }
  // light from the upper left over the dome, a darker lower right
  ctx.fillStyle = lin(ctx, -a, -b, a, b, [[0, 'rgba(255,245,215,0.34)'], [0.5, 'rgba(255,245,215,0)'], [1, 'rgba(30,12,4,0.36)']]); ctx.fillRect(-a * 1.1, -b * 1.1, a * 2.2, b * 2.2);
  ctx.restore();
  edge(1); ctx.strokeStyle = 'rgba(60,30,10,0.55)'; ctx.lineWidth = 1.6; ctx.stroke();
  edge(0.965); ctx.strokeStyle = 'rgba(255,240,200,0.28)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.restore();
}

// a flame: layered teardrops that sway, hot yellow core, orange body, deep red edge
export function flame(ctx, x, yb, w, h, t, seed = 0) {
  const sw = Math.sin(t * 4.3 + seed * 1.7) * w * 0.35, sw2 = Math.sin(t * 6.1 + seed * 2.3) * w * 0.2;
  const layer = (k, col, a) => { const ww = w * k, hh = h * (0.55 + 0.45 * k); ctx.fillStyle = rgba(col, a); ctx.beginPath(); ctx.moveTo(x - ww, yb); ctx.bezierCurveTo(x - ww * 1.1, yb - hh * 0.4, x - ww * 0.3 + sw * k, yb - hh * 0.7, x + sw * k + sw2 * 0.4, yb - hh); ctx.bezierCurveTo(x + ww * 0.3 + sw * k * 0.6, yb - hh * 0.65, x + ww * 1.1, yb - hh * 0.35, x + ww, yb); ctx.closePath(); ctx.fill(); };
  layer(1, '#d63a10', 0.55); layer(0.74, '#ff8a22', 0.7); layer(0.48, '#ffd24a', 0.8); layer(0.22, '#fffbe0', 0.85);
}

// ---- the oven ------------------------------------------------------------------------------------------------------------------------------------------
function drawOven(ctx, G, V) {
  const { Z, WALL } = G, t = V.now, x = Z.x, y = Z.y, w = Z.w, h = Z.h;
  const gy = y + h * 0.95, rimY = y + h * 0.05, cavL = WALL.x - w * 0.02, cavR = WALL.x + WALL.w + w * 0.02;
  const flick = 0.82 + 0.18 * Math.sin(t * 9.1) * Math.sin(t * 5.3) + 0.04 * Math.sin(t * 17.3);
  ctx.save(); rrect(ctx, x, y, w, h, 16); ctx.clip();
  // the warm light of the fire thrown on the room around the oven
  ctx.fillStyle = rad(ctx, x + w / 2, y + h * 0.78, 10, w * 0.75, [[0, `rgba(255,150,70,${0.3 * flick})`], [1, 'rgba(255,100,30,0)']]); ctx.fillRect(x, y, w, h);
  // the shell: plaster outside, thick clay with straw, a barrel that is widest at the belly
  const outer = () => { ctx.beginPath(); ctx.moveTo(x + w * 0.1, rimY); ctx.bezierCurveTo(x + w * 0.03, y + h * 0.25, x + w * 0.0, y + h * 0.6, x + w * 0.05, gy); ctx.lineTo(x + w * 0.95, gy); ctx.bezierCurveTo(x + w * 1.0, y + h * 0.6, x + w * 0.97, y + h * 0.25, x + w * 0.9, rimY); ctx.closePath(); };
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6; outer(); ctx.fillStyle = '#5a3a26'; ctx.fill(); ctx.restore();
  outer(); ctx.fillStyle = lin(ctx, x, 0, x + w, 0, [[0, '#7a5638'], [0.2, '#a87a50'], [0.5, '#8a5f3c'], [0.8, '#a87a50'], [1, '#6a4a30']]); ctx.fill();
  ctx.save(); outer(); ctx.clip();
  for (let k = 0; k < 110; k++) { const px = x + hash(k, 1) * w, py = y + hash(k, 2) * h, l = 6 + hash(k, 3) * 14, an = (hash(k, 4) - 0.5) * 1.4; ctx.strokeStyle = k % 3 ? 'rgba(220,180,110,0.3)' : 'rgba(40,20,8,0.28)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(an) * l, py + Math.sin(an) * l * 0.4); ctx.stroke(); }   // straw in the clay
  for (let k = 0; k < 6; k++) { ctx.strokeStyle = 'rgba(40,22,10,0.32)'; ctx.lineWidth = 1.4; ctx.beginPath(); const px = x + w * (0.02 + hash(k, 5) * 0.14), py = y + h * (0.2 + hash(k, 6) * 0.6); ctx.moveTo(px, py); ctx.lineTo(px + 8, py + 14); ctx.lineTo(px + 4, py + 30); ctx.stroke(); const qx = x + w * (0.84 + hash(k, 7) * 0.14); ctx.beginPath(); ctx.moveTo(qx, py); ctx.lineTo(qx - 7, py + 16); ctx.lineTo(qx - 3, py + 28); ctx.stroke(); }   // cracks
  ctx.restore();
  // the cavity: an inner wall of baked clay, concave, glowing from the fire below
  const cav = () => { ctx.beginPath(); ctx.moveTo(cavL, rimY + h * 0.02); ctx.bezierCurveTo(cavL - w * 0.05, y + h * 0.3, cavL - w * 0.06, y + h * 0.65, cavL + w * 0.02, gy - h * 0.03); ctx.lineTo(cavR - w * 0.02, gy - h * 0.03); ctx.bezierCurveTo(cavR + w * 0.06, y + h * 0.65, cavR + w * 0.05, y + h * 0.3, cavR, rimY + h * 0.02); ctx.closePath(); };
  cav(); ctx.fillStyle = '#2a1409'; ctx.fill();
  ctx.save(); cav(); ctx.clip();
  const cx0 = (cavL + cavR) / 2;
  ctx.fillStyle = lin(ctx, 0, rimY, 0, gy, [[0, '#4a2a18'], [0.35, '#6a3a1e'], [0.7, '#9a4e1e'], [1, '#c8661e']]); ctx.fillRect(cavL - 30, rimY, cavR - cavL + 60, gy - rimY);
  // the rough clay of the lining: three faint coil bands, chips and pits, soot running down from the mouth
  for (let q = 0; q < 7; q++) { const bx0 = cavL + (cavR - cavL) * (q / 6); ctx.strokeStyle = `rgba(0,0,0,${0.06 + 0.04 * (q % 2)})`; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(bx0, rimY); ctx.quadraticCurveTo(bx0 + (bx0 - cx0) * 0.12, (rimY + gy) / 2, bx0, gy); ctx.stroke(); }
  for (const kk of [0.14, 0.3, 0.44, 0.58, 0.72, 0.86]) { ctx.strokeStyle = 'rgba(255,190,120,0.07)'; ctx.lineWidth = 6; const yy = rimY + kk * (gy - rimY); ctx.beginPath(); ctx.moveTo(cavL - 20, yy - 10); ctx.quadraticCurveTo(cx0, yy + 16, cavR + 20, yy - 10); ctx.stroke(); ctx.strokeStyle = 'rgba(15,6,2,0.3)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(cavL - 20, yy - 6); ctx.quadraticCurveTo(cx0, yy + 20, cavR + 20, yy - 6); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(20,8,2,0.18)'; ctx.lineWidth = 2.2; for (const kk of [0.3, 0.52, 0.73]) { const yy = rimY + kk * (gy - rimY); ctx.beginPath(); ctx.moveTo(cavL - 20, yy); for (let q = 0; q <= 12; q++) ctx.lineTo(cavL - 20 + ((cavR - cavL + 40) * q) / 12, yy + Math.sin(q * 1.3 + kk * 9) * 3 + 4 * Math.sin((q / 12) * Math.PI)); ctx.stroke(); }
  for (let k = 0; k < 46; k++) { const mx = cavL + hash(k, 51) * (cavR - cavL), my = rimY + hash(k, 52) * (gy - rimY), mr = 14 + hash(k, 53) * 34; ctx.fillStyle = rad(ctx, mx, my, 0, mr, [[0, k % 3 ? 'rgba(20,8,2,0.2)' : 'rgba(255,190,120,0.09)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2); }
  for (let k = 0; k < 150; k++) { const px = cavL + hash(k, 8) * (cavR - cavL), py = rimY + hash(k, 9) * (gy - rimY), q = hash(k, 10); ctx.fillStyle = q < 0.5 ? 'rgba(25,10,4,0.3)' : 'rgba(255,205,150,0.1)'; ctx.beginPath(); ctx.ellipse(px, py, 1 + q * 3, 0.8 + q * 1.8, hash(k, 12) * 3, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = 'rgba(8,3,1,0.4)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; for (let k = 0; k < 9; k++) { const sx = cavL + (cavR - cavL) * (0.08 + k * 0.105), l = h * (0.08 + hash(k, 14) * 0.2); ctx.beginPath(); ctx.moveTo(sx, rimY); ctx.bezierCurveTo(sx + 4, rimY + l * 0.4, sx - 3, rimY + l * 0.7, sx + 2, rimY + l); ctx.stroke(); }
  ctx.fillStyle = lin(ctx, 0, rimY, 0, rimY + h * 0.42, [[0, 'rgba(8,3,1,0.9)'], [0.5, 'rgba(10,4,2,0.45)'], [1, 'rgba(10,4,2,0)']]); ctx.fillRect(cavL - 30, rimY, cavR - cavL + 60, h * 0.42);   // soot
  // heat of the wall: a glow that follows heatAt, brighter when you are choosing where to slap
  const aimK = V.phase === 'aim' || V.phase === 'swing' ? 1 : 0.55, gcols = 12, grows = 8;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let r = 0; r < grows; r++) for (let c = 0; c < gcols; c++) {
    const u = (c + 0.5) / gcols, v = (r + 0.5) / grows, H = V.heatAt(u, v), px = WALL.x + u * WALL.w, py = WALL.y + v * WALL.h, rr = Math.max(WALL.w / gcols, WALL.h / grows) * 1.15, k = clamp((H - 0.3) / 1.0, 0, 1.3);
    ctx.fillStyle = rad(ctx, px, py, 0, rr, [[0, `rgba(255,${Math.round(120 + 70 * k)},${Math.round(30 + 40 * k)},${0.26 * k * aimK * flick})`], [1, 'rgba(255,120,30,0)']]); ctx.fillRect(px - rr, py - rr, rr * 2, rr * 2);
  }
  ctx.restore();
  // concave shading: the wall turns away at both sides
  ctx.fillStyle = lin(ctx, cavL, 0, cavR, 0, [[0, 'rgba(0,0,0,0.6)'], [0.16, 'rgba(0,0,0,0.08)'], [0.5, 'rgba(0,0,0,0)'], [0.84, 'rgba(0,0,0,0.08)'], [1, 'rgba(0,0,0,0.6)']]); ctx.fillRect(cavL - 30, rimY, cavR - cavL + 60, gy - rimY);
  // the embers and the flames at the bottom of the pit: a bed of charcoal with glowing cracks, flames lapping up the wall
  const bedY = WALL.y + WALL.h * 0.9;
  ctx.fillStyle = lin(ctx, 0, bedY - 10, 0, gy, [[0, 'rgba(255,170,60,0)'], [0.25, `rgba(255,120,30,${0.7 * flick})`], [1, '#4a1406']]); ctx.fillRect(cavL - 30, bedY - 10, cavR - cavL + 60, gy - bedY + 10);
  for (let k = 0; k < 84; k++) {
    const px = cavL + 6 + hash(k, 21) * (cavR - cavL - 12), py = bedY + (gy - bedY - 5) * (0.08 + hash(k, 22) * 0.92), sz = 3.5 + hash(k, 24) * 7, fl = 0.5 + 0.5 * Math.sin(t * (1.5 + hash(k, 23) * 2.5) + k), rt = hash(k, 27) * TAU;
    ctx.save(); ctx.translate(px, py); ctx.rotate(rt);
    ctx.fillStyle = `rgba(${Math.round(28 + 20 * hash(k, 28))},12,8,0.95)`; ctx.beginPath(); for (let q = 0; q < 7; q++) { const an = (q / 7) * TAU, rr = sz * (0.65 + 0.5 * hash(k, q, 29)); const x0 = Math.cos(an) * rr, y0 = Math.sin(an) * rr * 0.62; if (q) ctx.lineTo(x0, y0); else ctx.moveTo(x0, y0); } ctx.closePath(); ctx.fill();
    ctx.strokeStyle = `rgba(255,${Math.round(110 + 100 * fl)},30,${0.35 + 0.55 * fl})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-sz * 0.55, -sz * 0.05); ctx.lineTo(-sz * 0.1, sz * 0.18); ctx.lineTo(sz * 0.5, -sz * 0.1); ctx.stroke();
    ctx.fillStyle = `rgba(255,${Math.round(150 + 80 * fl)},60,${0.12 + 0.3 * fl})`; ctx.beginPath(); ctx.ellipse(0, sz * 0.05, sz * 0.9, sz * 0.4, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 8; k++) flame(ctx, cavL + (cavR - cavL) * (0.1 + k * 0.115), bedY + 6, (cavR - cavL) * 0.028 + 3, h * (0.1 + 0.05 * Math.sin(t * 5.7 + k * 1.9) + 0.03 * flick), t, k);
  ctx.restore();
  ctx.restore();
  cav(); ctx.strokeStyle = 'rgba(20,8,2,0.7)'; ctx.lineWidth = 3; ctx.stroke();
  // the rim: the cut through the clay collar on each side of the mouth, blackened with soot on the inside, a lit top edge
  for (const sd of [-1, 1]) {
    const x0 = sd < 0 ? x + w * 0.085 : cavR - 6, x1 = sd < 0 ? cavL + 6 : x + w * 0.915;
    ctx.beginPath(); ctx.moveTo(x0, rimY + 18); ctx.lineTo(x0, rimY - 2); ctx.quadraticCurveTo((x0 + x1) / 2, rimY - 13, x1, rimY - 2); ctx.lineTo(x1, rimY + 18); ctx.closePath();
    ctx.fillStyle = lin(ctx, 0, rimY - 12, 0, rimY + 18, [[0, '#e2c496'], [0.45, '#b0845a'], [1, '#5a3a22']]); ctx.fill(); ctx.strokeStyle = 'rgba(30,14,6,0.55)'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = lin(ctx, sd < 0 ? x1 : x1, 0, sd < 0 ? x1 - w * 0.06 : x1 + w * 0.06, 0, [[0, 'rgba(10,4,2,0.55)'], [1, 'rgba(10,4,2,0)']]); ctx.fillRect(sd < 0 ? x1 - w * 0.06 : x1, rimY - 8, w * 0.06, 26);
    ctx.fillStyle = 'rgba(255,248,225,0.4)'; ctx.fillRect(Math.min(x0, x1) + 6, rimY - 9, Math.abs(x1 - x0) - 12, 2);
  }
  // base: a stone slab
  ctx.fillStyle = lin(ctx, 0, gy, 0, y + h, [[0, '#6a5e52'], [1, '#2a241e']]); ctx.fillRect(x, gy, w, y + h - gy);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.5; for (let k = 1; k < 7; k++) { ctx.beginPath(); ctx.moveTo(x + (w * k) / 7, gy); ctx.lineTo(x + (w * k) / 7, y + h); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(x, gy, w, 2);
  // the long iron hook leaning by the oven, a bundle of vine twigs on the right
  ctx.strokeStyle = '#2a2a2c'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + w * 0.045, gy + 2); ctx.lineTo(x + w * 0.1, y + h * 0.22); ctx.quadraticCurveTo(x + w * 0.105, y + h * 0.18, x + w * 0.12, y + h * 0.19); ctx.stroke();
  ctx.strokeStyle = '#8a8f96'; ctx.lineWidth = 2; ctx.stroke();
  for (let k = 0; k < 9; k++) { ctx.strokeStyle = k % 2 ? '#6a4a2a' : '#4a3018'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + w * (0.9 + k * 0.006), gy + 2); ctx.lineTo(x + w * (0.93 + k * 0.004) + (k - 4) * 2, y + h * (0.62 + k * 0.01)); ctx.stroke(); }
  // heat shimmer rising out of the mouth
  ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = 'rgba(255,226,180,0.16)'; ctx.lineWidth = 3;
  for (let k = 0; k < 6; k++) { const bx = cavL + (cavR - cavL) * (0.12 + k * 0.15); ctx.beginPath(); for (let q = 0; q <= 8; q++) { const py = rimY - q * 7, px = bx + Math.sin(t * 3 + q * 0.9 + k * 2) * (2 + q * 0.5); if (q) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.stroke(); }
  ctx.restore();
  ctx.restore();
  ctx.save(); rrect(ctx, x, y, w, h, 16); ctx.strokeStyle = 'rgba(255,200,140,0.25)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
}

// a padded cushion: a stitched cloth disc with a thick edge and a tuft in the middle
function drawPad(ctx, rx, ry) {
  ctx.save();
  ctx.fillStyle = lin(ctx, 0, ry * 0.6, 0, ry * 1.1, [[0, '#4a1410'], [1, '#2a0a08']]); ctx.beginPath(); ctx.ellipse(0, ry * 0.12, rx * 1.02, ry * 1.0, 0, 0, TAU); ctx.fill();   // the edge below
  ctx.fillStyle = lin(ctx, -rx, -ry, rx, ry, [[0, '#b83a2a'], [0.5, '#8a2420'], [1, '#5a1612']]); ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.clip();
  ctx.strokeStyle = 'rgba(240,200,110,0.55)'; ctx.lineWidth = Math.max(1.5, rx * 0.025); for (const k of [0.78, 0.55]) { ctx.beginPath(); ctx.ellipse(0, 0, rx * k, ry * k, 0, 0, TAU); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(30,6,4,0.25)'; ctx.lineWidth = 1; for (let k = -10; k <= 10; k++) { ctx.beginPath(); ctx.moveTo(k * rx * 0.12, -ry); ctx.lineTo(k * rx * 0.12 + ry * 0.4, ry); ctx.stroke(); }
  ctx.fillStyle = rad(ctx, -rx * 0.3, -ry * 0.4, 1, rx * 0.9, [[0, 'rgba(255,200,170,0.4)'], [1, 'rgba(255,200,170,0)']]); ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
  ctx.restore();
  ctx.strokeStyle = 'rgba(20,4,2,0.6)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#e0b860'; ctx.beginPath(); ctx.arc(0, 0, Math.max(2.5, rx * 0.04), 0, TAU); ctx.fill();
  ctx.restore();
}

// the cushion held out toward the wall, swinging: an arm from above, a padded cloth disc with the dough on it, and the swing bar
function drawSwing(ctx, G, V) {
  const sw = V.swing, { WALL, Z } = G;
  const a = (V.SHEET.w * WALL.w) / 2, b = (V.SHEET.h * WALL.h) / 2;
  if (V.phase === 'aim' && V.ptr && V.ptr.x >= Z.x && V.ptr.x <= Z.x + Z.w && V.ptr.y >= Z.y && V.ptr.y <= Z.y + Z.h) {   // where it would go
    const u = (V.ptr.x - WALL.x) / WALL.w, v = (V.ptr.y - WALL.y) / WALL.h, ok = V.inRange(u, v) && V.free(u, v);
    ctx.save(); ctx.setLineDash([6, 5]); ctx.lineWidth = 2; ctx.strokeStyle = ok ? 'rgba(150,255,170,0.7)' : 'rgba(255,120,100,0.7)'; ctx.beginPath(); ctx.ellipse(V.ptr.x, V.ptr.y, a, b, 0, 0, TAU); ctx.stroke(); ctx.restore();
  }
  if (!sw || V.phase !== 'swing') return;
  const T = V.now - sw.t0, k = clamp(T / V.swingIdeal, 0, 1.25);
  const tx = WALL.x + sw.u * WALL.w, ty = WALL.y + sw.v * WALL.h;
  const bx = lerp(tx, Z.x + Z.w * 0.5, 0.35 * (1 - sm(k))), by = lerp(ty, Z.y + Z.h * 0.98, 0.5 * (1 - sm(k))), sc = lerp(1.3, 1, sm(k));
  // the target on the wall: a dashed oval, green when it will hold
  ctx.save(); ctx.setLineDash([6, 5]); ctx.lineWidth = 2.4; ctx.strokeStyle = sw.valid ? 'rgba(150,255,170,0.95)' : 'rgba(255,120,100,0.95)'; ctx.fillStyle = sw.valid ? 'rgba(150,255,170,0.1)' : 'rgba(255,120,100,0.12)';
  ctx.beginPath(); ctx.ellipse(tx, ty, a, b, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
  // the pad and the sheet on it
  ctx.save(); ctx.translate(bx, by); ctx.scale(sc, sc); ctx.rotate((1 - sm(k)) * -0.35);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(6, 10, a * 1.08, b * 1.08, 0, 0, TAU); ctx.fill();
  drawPad(ctx, a * 1.08, b * 1.08);
  drawSheet(ctx, 0, -2, a * 0.92, b * 0.92, { cells: V.zero, hole: V.hole, id: 7 }, { CW: V.CW, CH: V.CH, inside: V.inside, shadow: false });
  ctx.restore();
  // the arm that carries it, from the top of the oven
  ctx.save(); ctx.translate(bx + a * 0.55, by - b * 0.35); ctx.rotate(Math.PI - 0.5); drawHand(ctx, { x: 0, y: 0, s: Math.max(9, a * 0.2), side: 1, grip: 1, dust: 0.4, reach: 12 }); ctx.restore();
  // the swing bar
  const bw = Math.min(Z.w * 0.6, 340), bh = 15, bxx = Z.x + (Z.w - bw) / 2, byy = Z.y + Z.h - 26, ideal = V.swingIdeal / V.T_FULL;
  shadowed(ctx, () => { rrect(ctx, bxx - 8, byy - 8, bw + 16, bh + 24, 12); ctx.fillStyle = 'rgba(12,8,6,0.78)'; ctx.fill(); }, { blur: 8, dy: 3, a: 0.5 });
  rrect(ctx, bxx, byy, bw, bh, 7); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
  const seg = (c0, c1, col) => { rrect(ctx, bxx + clamp(c0, 0, 1) * bw, byy, (clamp(c1, 0, 1) - clamp(c0, 0, 1)) * bw, bh, 5); ctx.fillStyle = col; ctx.fill(); };
  seg(ideal - V.WIN2 / V.T_FULL, ideal + V.WIN2 / V.T_FULL, 'rgba(240,170,60,0.55)'); seg(ideal - V.WIN / V.T_FULL, ideal + V.WIN / V.T_FULL, '#7ee08a');
  const mk = bxx + clamp(T / V.T_FULL, 0, 1) * bw; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mk, byy + bh + 3); ctx.lineTo(mk - 6, byy + bh + 11); ctx.lineTo(mk + 6, byy + bh + 11); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillRect(mk - 1.5, byy - 4, 3, bh + 8);
}

// ---- the board: a table, the cushion with the dough, the rolling pin, the stack ----------------------------------------------------------------------
function drawDough(ctx, G, V) {
  const { dough } = G, { th, hole, CW, CH, inside } = V;
  ctx.save(); ctx.translate(dough.x, dough.y);
  const rx = dough.rx, ry = dough.ry;
  drawPad(ctx, rx * 1.1, ry * 1.12);
  if (!V.noDough) {
    // the dough, cell by cell: thick is creamy and opaque, thin lets the red cloth show through, a hole shows it fully
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, rx * 1.0, ry * 1.0, 0, 0, TAU); ctx.clip();
    ctx.fillStyle = lin(ctx, -rx, -ry, rx, ry, [[0, '#f6ecd2'], [1, '#e4d3ac']]); ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
    const cw = (2 * rx) / CW, ch = (2 * ry) / CH, rr = Math.max(cw, ch) * 1.2;
    for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) {
      if (!inside(i, j)) continue;
      const k = j * CW + i, x = ((i + 0.5) / CW * 2 - 1) * rx, y = ((j + 0.5) / CH * 2 - 1) * ry, thk = th[k];
      if (hole[k]) { ctx.fillStyle = '#4a1410'; ctx.beginPath(); ctx.ellipse(x, y, cw * 0.62, ch * 0.58, hash(k, 5) * 3, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,240,210,0.7)'; ctx.lineWidth = 1.5; ctx.stroke(); continue; }
      const thin = clamp((0.72 - thk) / 0.55, 0, 1), lump = clamp((thk - 0.85) / 0.5, 0, 1);
      if (thin > 0.02) { ctx.fillStyle = rad(ctx, x, y, 0, rr, [[0, `rgba(196,92,60,${0.5 * thin})`], [1, 'rgba(196,92,60,0)']]); ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
      if (lump > 0.02) { ctx.fillStyle = rad(ctx, x - rr * 0.15, y - rr * 0.2, 0, rr, [[0, `rgba(255,252,240,${0.55 * lump})`], [1, 'rgba(255,252,240,0)']]); ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
    }
    ctx.fillStyle = lin(ctx, -rx, -ry, rx, ry, [[0, 'rgba(255,255,255,0.18)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(60,20,8,0.28)']]); ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; for (let k = 0; k < 60; k++) { const an = hash(k, 31) * TAU, rd = Math.sqrt(hash(k, 32)); ctx.fillRect(Math.cos(an) * rx * rd * 0.95, Math.sin(an) * ry * rd * 0.95, 1.4, 1.4); }   // flour dust
    ctx.restore();
    ctx.strokeStyle = 'rgba(120,80,40,0.5)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.stroke();
  }
  ctx.restore();
}
function drawPin(ctx, G, V) {
  if (!V.ptr || V.phase !== 'stretch') return;
  const p = V.ptr, len = G.dough.rx * 0.62, th0 = Math.max(10, G.dough.rx * 0.075), roll = (V.rollX ?? 0) * 0.006;
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, -len / 2 + 5, th0 * 0.2 + 6, len, th0, th0 / 2); ctx.fill();
  ctx.fillStyle = lin(ctx, 0, -th0, 0, th0, [[0, '#e6c48a'], [0.4, '#c08a4a'], [1, '#7a4a22']]); rrect(ctx, -len / 2, -th0 * 0.5, len, th0 * 1.1, th0 * 0.5); ctx.fill();
  ctx.strokeStyle = 'rgba(70,36,12,0.35)'; ctx.lineWidth = 1.2; for (let k = -4; k <= 4; k++) { const xx = (((k * 0.11 + roll) % 1.0) * len * 0.9); ctx.beginPath(); ctx.moveTo(xx, -th0 * 0.4); ctx.lineTo(xx + 3, th0 * 0.5); ctx.stroke(); }
  ctx.fillStyle = '#a66f38'; for (const sd of [-1, 1]) { rrect(ctx, sd * len * 0.5 - (sd > 0 ? 0 : th0 * 0.9), -th0 * 0.5, th0 * 0.9, th0 * 1.1, th0 * 0.3); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,240,200,0.5)'; ctx.fillRect(-len / 2 + 4, -th0 * 0.42, len - 8, 2);
  ctx.restore();
}
function drawStack(ctx, G, V) {
  const { x, y } = G.stackPos, r = Math.min(G.B.w * 0.1, 46), ry = r * 0.5;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 8, r * 1.18, ry * 1.1, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = lin(ctx, x - r, 0, x + r, 0, [[0, '#d8d0bc'], [0.5, '#f5f0e2'], [1, '#bdb4a0']]); ctx.beginPath(); ctx.ellipse(x, y + 3, r * 1.15, ry * 1.05, 0, 0, TAU); ctx.fill();   // the cloth
  const sheets = V.stack.filter((b) => !b.fell && !b.burnt), shown = Math.min(sheets.length, 7);
  for (let k = 0; k < shown; k++) {
    const b = sheets[sheets.length - shown + k], yy = y - k * 3.2, col = doneColor(b.d ?? 0.7);
    ctx.fillStyle = mix(col, '#2a1408', 0.4); ctx.beginPath(); ctx.ellipse(x, yy + 2, r, ry, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, yy, r, ry, 0, 0, TAU); ctx.fill();
    if (k === shown - 1) { ctx.save(); ctx.beginPath(); ctx.ellipse(x, yy, r, ry, 0, 0, TAU); ctx.clip(); for (let q = 0; q < 16; q++) { ctx.fillStyle = rgba(mix(col, '#fff6dc', 0.35), 0.8); ctx.beginPath(); ctx.ellipse(x + (hash(q, 41) - 0.5) * r * 1.6, yy + (hash(q, 42) - 0.5) * ry * 1.5, 2 + hash(q, 43) * 4, 1.5 + hash(q, 44) * 2.4, 0, 0, TAU); ctx.fill(); } ctx.restore(); }
  }
  ctx.restore();
}

function drawBoard(ctx, G, V) {
  const { B } = G;
  ctx.save(); rrect(ctx, B.x, B.y, B.w, B.h, 14); ctx.clip();
  planksH(ctx, B.x, B.y, B.w, B.h, '#a8794a', Math.max(30, B.h / 4), 7, 1);
  ctx.fillStyle = lin(ctx, 0, B.y, 0, B.y + B.h, [[0, 'rgba(255,230,190,0.12)'], [0.6, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.3)']]); ctx.fillRect(B.x, B.y, B.w, B.h);
  // a bowl of flour on the edge
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(B.x + B.w * 0.9, B.y + B.h * 0.25, B.w * 0.07, B.h * 0.09, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = lin(ctx, 0, B.y + B.h * 0.16, 0, B.y + B.h * 0.32, [[0, '#d9dde2'], [1, '#8a919a']]); ctx.beginPath(); ctx.ellipse(B.x + B.w * 0.9, B.y + B.h * 0.25, B.w * 0.065, B.h * 0.085, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fbfcfd'; ctx.beginPath(); ctx.ellipse(B.x + B.w * 0.9, B.y + B.h * 0.235, B.w * 0.05, B.h * 0.06, 0, 0, TAU); ctx.fill();
  ctx.restore();
  const carried = V.phase === 'swing' || V.phase === 'slap';
  if (V.madeN > 0 && V.phase !== 'done' && V.phase !== 'wait') {
    ctx.save(); if (V.phase === 'next') ctx.globalAlpha = clamp(V.phaseT / 0.5, 0, 1); else if (V.phase === 'aim') ctx.globalAlpha = 0.55;
    drawDough(ctx, G, { ...V, noDough: carried }); ctx.restore();
  }
  drawStack(ctx, G, V);
  drawPin(ctx, G, V);
  const left = V.TOTAL - V.madeN;   // the dough balls still to come
  for (let k = 0; k < left; k++) { const bx = B.x + 18 + k * 20, by = B.y + B.h - 18; ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(bx + 2, by + 6, 10, 4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = lin(ctx, 0, by - 9, 0, by + 8, [[0, '#fff6e0'], [1, '#d6c196']]); ctx.beginPath(); ctx.ellipse(bx, by, 10, 8, 0, 0, TAU); ctx.fill(); }
}

// ---- the stage -------------------------------------------------------------------------------------------------------------------------------------------
export function drawBakeStage(g, G, V, Rt) {
  const { ctx } = g, W0 = G.W0;
  ctx.save(); ctx.beginPath(); ctx.rect(W0.x, W0.y, W0.w, W0.h); ctx.clip();
  drawBoard(ctx, G, V);
  drawOven(ctx, G, V);
  const { WALL } = G, a = (V.SHEET.w * WALL.w) / 2, b = (V.SHEET.h * WALL.h) / 2;
  // sheets on the wall: the one just slapped swells in
  for (const s of V.sheets) {
    const cx = WALL.x + s.u * WALL.w, cy = WALL.y + s.v * WALL.h, appear = clamp((V.now - s.born) / 0.18, 0, 1);
    drawSheet(ctx, cx, cy, a, b, s, { CW: V.CW, CH: V.CH, inside: V.inside, appear });
    // a small bar under each sheet: the golden window, and where it is now
    const bw = Math.min(a * 1.4, 70), bx = cx - bw / 2, by = cy + b + 5, gk = (D) => clamp(D / 1.1, 0, 1);
    rrect(ctx, bx, by, bw, 6, 3); ctx.fillStyle = 'rgba(10,6,4,0.7)'; ctx.fill();
    rrect(ctx, bx + bw * gk(V.D_GOOD - 0.1), by, bw * (gk(V.D_GOOD + 0.1) - gk(V.D_GOOD - 0.1)), 6, 3); ctx.fillStyle = 'rgba(126,224,138,0.9)'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(bx + bw * gk(s.d), by + 3, 4, 0, TAU); ctx.fill(); ctx.stroke();
  }
  drawSwing(ctx, G, V);
  // hooked sheets flying to the stack
  for (const f of V.flying) {
    const u = sm(clamp((V.now - f.t0) / 0.55, 0, 1)), sx = WALL.x + f.u * WALL.w, sy = WALL.y + f.v * WALL.h, tx = G.stackPos.x, ty = G.stackPos.y, x = lerp(sx, tx, u), y = lerp(sy, ty, u) - Math.sin(u * Math.PI) * 50, k = lerp(1, 0.5, u);
    drawSheet(ctx, x, y, a * k, b * k, f, { CW: V.CW, CH: V.CH, inside: V.inside, shadow: true });
    if (u < 0.9) { ctx.save(); ctx.fillStyle = f.score >= 80 ? '#ffe59a' : '#ffb08a'; ctx.font = `800 ${Math.round(fsz(g, 22, 34))}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.globalAlpha = Math.min(1, u * 3) * (1 - u); ctx.fillText(String(f.score), sx, sy - b - 6 - u * 24); ctx.restore(); }
  }
  V.puffs.draw(ctx);
  ctx.restore();
  hintPill(g, ctx, W0, V.hint);
  void Rt;
}

// ---- the dock ---------------------------------------------------------------------------------------------------------------------------------------------
export function drawBakeHud(g, G, V) {
  const { ctx } = g, d = G.dock, h = d.h, midY = d.y + h * 0.5, W0 = G.W0, fs = fsz(g, 14, h * 0.3);
  ctx.save();
  // the order: one pip per sheet, coloured by how it went
  const n = V.TOTAL, pw = Math.min(22, (W0.w * 0.34) / n), gx = W0.x + 14;
  g.label(ctx, 'Order', gx, midY - h * 0.26, fs, 'rgba(255,240,210,0.8)', 'left', '700');
  for (let k = 0; k < n; k++) {
    const cx = gx + pw * 0.5 + k * (pw + 6), cy = midY + 8, b = V.stack[k];
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx + 1, cy + 3, pw * 0.5, pw * 0.34, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = b ? (b.fell || b.burnt ? '#6a2a22' : b.score >= 85 ? '#9ad07a' : b.score >= 60 ? '#f2b84a' : '#e0603a') : 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.ellipse(cx, cy, pw * 0.5, pw * 0.34, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
    if (b) g.label(ctx, b.fell || b.burnt ? 'x' : String(b.score), cx, cy + 1, Math.max(9, pw * 0.38), '#1b1b1b', 'center', '800');
  }
  // centre: how thin the dough is
  const cxm = W0.x + W0.w * 0.58, bw = Math.min(170, W0.w * 0.3), st = V.stats;
  g.label(ctx, `Thick ${(st.m * 100).toFixed(0)}% \u00b7 even ${Math.round(100 - clamp(st.e * 100, 0, 99))}`, cxm, midY - h * 0.26, fs, 'rgba(255,240,210,0.88)', 'center', '700');
  rrect(ctx, cxm - bw / 2, midY + 2, bw, 10, 5); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill();
  const sx = (m) => cxm - bw / 2 + clamp(m / 1.1, 0, 1) * bw;
  rrect(ctx, sx(V.M_GOAL - 0.06), midY + 2, sx(V.M_GOAL + 0.06) - sx(V.M_GOAL - 0.06), 10, 4); ctx.fillStyle = 'rgba(126,224,138,0.85)'; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx(st.m), midY + 14); ctx.lineTo(sx(st.m) - 5, midY + 22); ctx.lineTo(sx(st.m) + 5, midY + 22); ctx.closePath(); ctx.fill(); ctx.stroke();
  // right: the fire
  const fx0 = W0.x + W0.w - 16, fw = Math.min(90, W0.w * 0.16), fl = clamp((V.fire - 0.8) / 0.4, 0, 1);
  g.label(ctx, 'Fire', fx0 - fw, midY - h * 0.26, fs, 'rgba(255,240,210,0.8)', 'left', '700');
  rrect(ctx, fx0 - fw, midY + 2, fw, 10, 5); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill();
  rrect(ctx, fx0 - fw, midY + 2, Math.max(8, fw * (0.35 + 0.65 * fl)), 10, 5); ctx.fillStyle = lin(ctx, fx0 - fw, 0, fx0, 0, [[0, '#e06a2a'], [1, '#ffd36a']]); ctx.fill();
  ctx.restore();
}

// the order: a sheet of lavash, golden and blistered, on a wooden board
export function drawBakeThumb(g, th, V) {
  const { ctx } = g, cx = th.x + th.w / 2, cy = th.y + th.h * 0.52, a = th.w * 0.42, b = th.h * 0.3;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(cx, cy + b * 1.1, a * 1.05, b * 0.3, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = lin(ctx, 0, cy - b, 0, cy + b * 1.2, [[0, '#c89a62'], [1, '#7a4e28']]); rrect(ctx, cx - a * 1.1, cy - b * 1.08, a * 2.2, b * 2.2, 10); ctx.fill();   // the board
  const cells = new Array(V.CW * V.CH).fill(0).map((_, k) => 0.62 + 0.18 * hash(k, 77) + (hash(k, 78) > 0.93 ? 0.25 : 0));
  drawSheet(ctx, cx, cy, a, b, { cells, d: 0.72, id: 3 }, { CW: V.CW, CH: V.CH, inside: V.inside, shadow: true, bs: 0.62 });
  ctx.restore();
  g.label(ctx, 'lavash', cx, th.y + th.h * 0.1, fsz(g, 15, th.h * 0.09), '#fff3d0', 'center', '800');
  g.label(ctx, `${V.TOTAL} sheets`, cx, th.y + th.h * 0.92, fsz(g, 14, th.h * 0.09), 'rgba(255,240,210,0.95)', 'center', '700');
}

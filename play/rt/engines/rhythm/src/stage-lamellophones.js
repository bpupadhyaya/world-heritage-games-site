// Thumb pianos, figure-free (1.19.0): the ogwumgwu (an iron-keyed board set into a half gourd, with two crescent grip holes), the kankobele (a small open calabash with
// keys laid across its mouth), the likembe (a small dark wooden box with a fan of iron keys) and the matepe (keys stepped up a board set in a big gourd, ringed with shells).
// The player is not drawn: the tip of every key flexes and glows when it sounds. Added through the key-scene registry in keys.js (KEY_SCENES), so every other keyed instrument,
// including the mbira, keeps its drawing; these routes take `ogwumgwu`, `kankobele`, `likembe` and `matepe` before the broad mbira route of keys.js.
import { clamp, mix, rgba, lighter, darker, glow, rrect, grain, hgrad, vgrad, rgrad, ell, circ, hash, TAU } from './art.js';
import { circleSpot, lerp } from './stagekit.js';
import { registerKeyStage } from './registry.js';
import { KEY_SCENES } from './keys.js';

registerKeyStage({ id: 'ogwumgwu', match: /ogwumgwu|board lamellophone|idoma board/ });
registerKeyStage({ id: 'kankobele', match: /kankobele|kankobela|ila thumb piano/ });
registerKeyStage({ id: 'likembe', match: /likembe|dikembe|lukeme|ikembe/ });
registerKeyStage({ id: 'matepe', match: /matepe/ });

// one iron key: a flat strip with a flattened, lit tip at the top; flexes sideways and glows when struck. v = centre, tip at u, length len, width w
function key(ctx, v, tip, len, w, col, f, t, i, o = {}) {
  const x = v + Math.sin(t * 90 + i) * 2.8 * f, base = o.base ?? '#cfd4da';
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; rrect(ctx, x - w / 2 + 5, tip + 6, w, len + 6, w * 0.4); ctx.fill();
  ctx.fillStyle = hgrad(ctx, x - w / 2, x + w / 2, [[0, darker(base, 0.65)], [0.32, lighter(base, 0.6)], [0.68, base], [1, darker(base, 0.62)]]); rrect(ctx, x - w / 2, tip, w, len, w * 0.4); ctx.fill();
  ctx.fillStyle = hgrad(ctx, x - w * 0.9, x + w * 0.9, [[0, darker(base, 0.5)], [0.5, lighter(base, 0.75)], [1, darker(base, 0.5)]]); rrect(ctx, x - w * 0.9, tip - 3, w * 1.8, w * 1.15, w * 0.5); ctx.fill();   // the flattened thumb tip
  ctx.strokeStyle = 'rgba(30,34,40,0.55)'; ctx.lineWidth = 1.5; rrect(ctx, x - w * 0.9, tip - 3, w * 1.8, w * 1.15, w * 0.5); ctx.stroke();
  ctx.fillStyle = rgba(col, 0.95); circ(ctx, x, tip + w * 1.9, 4.6); ctx.fill();
  if (f > 0.03) { glow(ctx, x, tip + 18, 80, col, 0.5 * f); ctx.strokeStyle = rgba(lighter(col, 0.6), 0.6 * f); ctx.lineWidth = 3; ell(ctx, x, tip + 10, w * 1.5, w * 0.7); ctx.stroke(); }
}
// the bridge: a bar lashed across the keys, with a coil of wire and loose rings that rattle
function bridge(ctx, x0, x1, u, h, t, shake, o = {}) {
  const base = o.col ?? '#9aa0aa';
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, x0 + 5, u - h / 2 + 7, x1 - x0, h, h * 0.45); ctx.fill();
  ctx.fillStyle = vgrad(ctx, u - h / 2, u + h / 2, [[0, lighter(base, 0.5)], [0.5, base], [1, darker(base, 0.6)]]); rrect(ctx, x0, u - h / 2, x1 - x0, h, h * 0.45); ctx.fill();
  ctx.strokeStyle = 'rgba(20,24,30,0.5)'; ctx.lineWidth = 1.6; rrect(ctx, x0, u - h / 2, x1 - x0, h, h * 0.45); ctx.stroke();
  ctx.strokeStyle = o.coil ?? '#b87a3a'; ctx.lineWidth = 2.4; for (let x = x0 + 8; x < x1 - 4; x += 8) { ctx.beginPath(); ctx.moveTo(x, u - h / 2 + 1); ctx.lineTo(x + 3, u + h / 2 - 1); ctx.stroke(); }
  for (const [k, side] of [[0, -1], [1, 1], [2, -1], [3, 1]]) { if (!o.rings) break; const x = side < 0 ? x0 + 16 + (k >> 1) * 26 : x1 - 16 - (k >> 1) * 26, y = u + h * 0.9 + Math.sin(t * 55 + k * 2) * 2.6 * shake; ctx.strokeStyle = '#d0d4da'; ctx.lineWidth = 3.4; circ(ctx, x, y, 8); ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; circ(ctx, x + 2, y + 3, 8); ctx.stroke(); }
}
const spotAt = (v, u, extra) => circleSpot(v, u, 32, extra);

// ================================================================= OGWUMGWU =============================================================================================
KEY_SCENES.ogwumgwu = (K) => {
  const { lanes, N, spots, order } = K;
  K.st.voice = 'tine';
  const ref = { w: 780, h: 740 }, rank = new Array(N); order.forEach((lane, r) => { rank[lane] = r; });
  const bu = 380, bw = 600, bh = 460, bcy = 400, pitch = clamp(430 / Math.max(1, N), 36, 58);
  lanes.forEach((_, i) => { const r = rank[i], v = (r - (N - 1) / 2) * pitch, len = lerp(190, 120, N > 1 ? r / (N - 1) : 0) * (1 + 0.05 * Math.sin(r)), tip = bu - len; spots[i] = spotAt(v, tip + 12, { v, tipU: tip, len, labelV: v, labelU: tip + 64 }); });
  K.set({ ref, dress: { kind: 'earth', base: '#5a3e24', rugKind: 'zigzag', rugBase: '#2a1c12', rugA: '#d8b068', rugB: '#8a3a22', light: '#ffe2b0' }, plr: null,
    draw(ctx, rt) {
      const shake = lanes.reduce((m, _, i) => Math.max(m, rt.flash[i]), 0);
      ctx.fillStyle = 'rgba(0,0,0,0.34)'; ell(ctx, 0, ref.h - 30, 380, 24); ctx.fill();
      // the half gourd the board is set into: a big warm bowl, its rim showing round the board
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 14, bcy + 30, 392, 340); ctx.fill();
      ctx.fillStyle = rgrad(ctx, -60, bcy - 80, 30, 420, [[0, '#f0c070'], [0.55, '#b87a30'], [1, '#4a2808']], -110, bcy - 150); ell(ctx, 0, bcy + 20, 392, 336); ctx.fill();
      ctx.save(); ell(ctx, 0, bcy + 20, 392, 336); ctx.clip(); for (let k = 0; k < 120; k++) { ctx.fillStyle = `rgba(70,36,8,${0.05 + 0.1 * hash(k)})`; ell(ctx, (hash(k + 3) - 0.5) * 760, bcy + (hash(k + 50) - 0.5) * 640, 3 + 9 * hash(k + 7), 2 + 4 * hash(k + 9)); ctx.fill(); } ctx.restore();
      ctx.strokeStyle = 'rgba(255,226,170,0.4)'; ctx.lineWidth = 4; ell(ctx, 0, bcy + 20, 392, 336); ctx.stroke();
      // the board: a wide plank, cream wood with a carved border, two crescent grip holes at the foot and the iron bridge across
      const bx = -bw / 2, by = bcy - bh / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, bx + 8, by + 12, bw, bh, 26); ctx.fill();
      ctx.fillStyle = hgrad(ctx, bx, bx + bw, [[0, darker('#d8b070', 0.5)], [0.2, lighter('#d8b070', 0.2)], [0.6, '#d8b070'], [1, darker('#d8b070', 0.5)]]); rrect(ctx, bx, by, bw, bh, 26); ctx.fill();
      ctx.save(); rrect(ctx, bx, by, bw, bh, 26); ctx.clip(); grain(ctx, bx, by, bw, bh, '#4a2a0c', 0.3, 14, false, 16);
      ctx.strokeStyle = 'rgba(60,30,8,0.6)'; ctx.lineWidth = 3; ctx.setLineDash([14, 8]); rrect(ctx, bx + 26, by + 26, bw - 52, bh - 52, 14); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(60,30,8,0.5)'; ctx.lineWidth = 3; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(-190, by + bh - 70 + k * 12); ctx.lineTo(190, by + bh - 70 + k * 12); ctx.stroke(); }
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,236,190,0.45)'; ctx.lineWidth = 3; rrect(ctx, bx, by, bw, bh, 26); ctx.stroke();
      for (const sx of [-1, 1]) {   // two crescent grip holes, curved like brackets along the left and right edges of the board
        ctx.save(); ctx.translate(sx * (bw / 2 - 62), by + bh * 0.66); ctx.scale(sx, 1);
        ctx.fillStyle = '#0c0603'; ctx.beginPath(); ctx.moveTo(-8, -92); ctx.bezierCurveTo(52, -62, 52, 62, -8, 92); ctx.bezierCurveTo(16, 46, 16, -46, -8, -92); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,230,180,0.7)'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      }
      bridge(ctx, bx + 70, bx + bw - 70, bu, 24, rt.anim, shake, { rings: true });
      lanes.forEach((l, i) => { const sp = spots[i], f = rt.flash[i]; key(ctx, sp.v, sp.tipU, sp.len + 14, 17, l.color, f, rt.anim, i); });
      K.eachCue(rt, (t, tau) => { const sp = spots[t.lane]; K.drop(ctx, t, tau, rt, sp.v, sp.tipU + 14, sp.tipU - 150); });
    } });
};

// ================================================================= KANKOBELE =============================================================================================
KEY_SCENES.kankobele = (K) => {
  const { lanes, N, spots, order } = K;
  K.st.voice = 'tine';
  const ref = { w: 780, h: 760 }, rank = new Array(N); order.forEach((lane, r) => { rank[lane] = r; });
  const cx = 0, cy = 440, rx = 330, ry = 270, bu = cy + ry * 0.62, pitch = clamp(470 / Math.max(1, N), 36, 52);
  lanes.forEach((_, i) => { const r = rank[i], v = (r - (N - 1) / 2) * pitch, t = N > 1 ? Math.abs(r - (N - 1) / 2) / ((N - 1) / 2) : 0, len = 330 - 90 * t, tip = bu - len; spots[i] = spotAt(v, tip + 12, { v, tipU: tip, len, labelV: v, labelU: tip + 64 }); });
  K.set({ ref, dress: { kind: 'planks', base: '#3a2818', rugKind: 'kente', rugBase: '#2a1810', rugA: '#e0b048', rugB: '#2a6a4a', light: '#ffe2b0' }, plr: null,
    draw(ctx, rt) {
      const shake = lanes.reduce((m, _, i) => Math.max(m, rt.flash[i]), 0);
      ctx.fillStyle = 'rgba(0,0,0,0.34)'; ell(ctx, 0, ref.h - 26, 360, 22); ctx.fill();
      // a small open calabash seen from its mouth: a thick lit rim round a dark hollow
      ctx.fillStyle = 'rgba(0,0,0,0.32)'; ell(ctx, 14, cy + 34, rx + 24, ry + 24); ctx.fill();
      ctx.fillStyle = rgrad(ctx, -70, cy - 70, 20, rx * 1.3, [[0, '#e8b660'], [0.55, '#a8702c'], [1, '#3a2006']], -110, cy - 110); ell(ctx, cx, cy, rx, ry); ctx.fill();
      ctx.save(); ell(ctx, cx, cy, rx, ry); ctx.clip(); for (let k = 0; k < 90; k++) { ctx.fillStyle = `rgba(70,36,8,${0.05 + 0.1 * hash(k)})`; ell(ctx, (hash(k + 3) - 0.5) * 720, cy + (hash(k + 50) - 0.5) * 560, 3 + 9 * hash(k + 7), 2 + 4 * hash(k + 9)); ctx.fill(); } ctx.restore();
      ctx.strokeStyle = 'rgba(255,226,170,0.45)'; ctx.lineWidth = 4; ell(ctx, cx, cy, rx, ry); ctx.stroke();
      ctx.fillStyle = rgrad(ctx, cx, cy + 20, 20, rx * 0.86, [[0, '#050301'], [0.7, '#140a04'], [1, '#2a160a']]); ell(ctx, cx, cy + 6, rx * 0.8, ry * 0.78); ctx.fill();
      ctx.strokeStyle = 'rgba(255,226,170,0.5)'; ctx.lineWidth = 3; ell(ctx, cx, cy + 6, rx * 0.8, ry * 0.78); ctx.stroke();
      // keys across the mouth from the cane bridge at the lower rim, tips rising past the upper rim; a split cane is lashed over them
      lanes.forEach((l, i) => { const sp = spots[i], f = rt.flash[i]; key(ctx, sp.v, sp.tipU, sp.len + 14, 16, l.color, f, rt.anim, i, { base: '#c4c9d0' }); });
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, -rx * 0.74 + 6, bu - 10 + 8, rx * 1.48, 24, 12); ctx.fill();
      ctx.fillStyle = hgrad(ctx, -rx * 0.74, rx * 0.74, [[0, '#6a4a22'], [0.5, '#d8b070'], [1, '#6a4a22']]); rrect(ctx, -rx * 0.74, bu - 12, rx * 1.48, 26, 13); ctx.fill();
      ctx.strokeStyle = 'rgba(40,20,6,0.6)'; ctx.lineWidth = 2; for (let x = -rx * 0.7; x < rx * 0.7; x += 18) { ctx.beginPath(); ctx.moveTo(x, bu - 12); ctx.lineTo(x + 6, bu + 14); ctx.stroke(); }
      for (const side of [-1, 1]) for (let k = 0; k < 3; k++) { const x = side * (rx * 0.62 - k * 22), y = bu + 36 + Math.sin(rt.anim * 55 + k * 2 + side) * 2.6 * shake; ctx.strokeStyle = '#d0d4da'; ctx.lineWidth = 3.2; circ(ctx, x, y, 8); ctx.stroke(); }
      K.eachCue(rt, (t, tau) => { const sp = spots[t.lane]; K.drop(ctx, t, tau, rt, sp.v, sp.tipU + 14, sp.tipU - 150); });
    } });
};

// ================================================================= LIKEMBE ===============================================================================================
KEY_SCENES.likembe = (K) => {
  const { lanes, N, spots, order } = K;
  K.st.voice = 'tine';
  const ref = { w: 780, h: 700 }, rank = new Array(N); order.forEach((lane, r) => { rank[lane] = r; });
  const bw = 600, bh = 330, bx = -bw / 2, by = 330, bu = by + 70, pitch = clamp(480 / Math.max(1, N), 34, 54);
  lanes.forEach((_, i) => { const r = rank[i], v = (r - (N - 1) / 2) * pitch, t = N > 1 ? r / (N - 1) : 0, len = 250 - 90 * t, tip = bu - len; spots[i] = spotAt(v, tip + 12, { v, tipU: tip, len, labelV: v, labelU: tip + 64 }); });
  K.set({ ref, dress: { kind: 'cloth', base: '#3a1a14', accent: '#e0b058', rugKind: null, light: '#ffd9a0' }, plr: null,
    draw(ctx, rt) {
      const shake = lanes.reduce((m, _, i) => Math.max(m, rt.flash[i]), 0), depth = 70;
      ctx.fillStyle = 'rgba(0,0,0,0.34)'; ell(ctx, 0, ref.h - 22, 360, 20); ctx.fill();
      // a small wooden box seen from above and the front: dark red-brown, a burnt border, a round sound hole
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, bx + 12, by + 18, bw, bh + depth, 16); ctx.fill();
      ctx.fillStyle = hgrad(ctx, bx, bx + bw, [[0, '#2a0e08'], [0.3, '#6a2a18'], [0.7, '#52200f'], [1, '#22090a']]); rrect(ctx, bx, by + bh - 10, bw, depth + 10, 16); ctx.fill();
      ctx.strokeStyle = 'rgba(240,190,120,0.35)'; ctx.lineWidth = 2.5; rrect(ctx, bx, by + bh - 10, bw, depth + 10, 16); ctx.stroke();
      ctx.save(); rrect(ctx, bx, by + bh, bw, depth, 8); ctx.clip(); ctx.fillStyle = 'rgba(240,190,120,0.45)'; for (let k = 0; k < 18; k++) { const x = bx + 20 + k * 33; ctx.beginPath(); ctx.moveTo(x, by + bh + 20); ctx.lineTo(x + 14, by + bh + 50); ctx.lineTo(x + 28, by + bh + 20); ctx.lineTo(x + 20, by + bh + 20); ctx.lineTo(x + 14, by + bh + 36); ctx.lineTo(x + 8, by + bh + 20); ctx.closePath(); ctx.fill(); } ctx.restore();
      ctx.fillStyle = hgrad(ctx, bx, bx + bw, [[0, darker('#7a3a20', 0.4)], [0.25, lighter('#7a3a20', 0.3)], [0.65, '#7a3a20'], [1, darker('#7a3a20', 0.5)]]); rrect(ctx, bx, by, bw, bh, 22); ctx.fill();
      ctx.save(); rrect(ctx, bx, by, bw, bh, 22); ctx.clip(); grain(ctx, bx, by, bw, bh, '#1a0804', 0.4, 33, false, 18);
      ctx.strokeStyle = 'rgba(20,6,2,0.6)'; ctx.lineWidth = 4; ctx.setLineDash([20, 10]); rrect(ctx, bx + 22, by + 22, bw - 44, bh - 44, 10); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,230,190,0.18)'; ctx.fillRect(bx, by, bw, 26); ctx.restore();
      ctx.strokeStyle = 'rgba(255,220,170,0.45)'; ctx.lineWidth = 3; rrect(ctx, bx, by, bw, bh, 22); ctx.stroke();
      ctx.fillStyle = '#080302'; ell(ctx, bx + bw * 0.78, by + bh * 0.66, 48, 36); ctx.fill(); ctx.strokeStyle = 'rgba(255,230,180,0.8)'; ctx.lineWidth = 3; ctx.stroke();
      // the fan of iron keys, with a heavy iron bar and a coil of wire over them
      lanes.forEach((l, i) => { const sp = spots[i], f = rt.flash[i]; key(ctx, sp.v, sp.tipU, sp.len + 14, 16, l.color, f, rt.anim, i, { base: '#aeb4bc' }); });
      bridge(ctx, bx + 60, bx + bw - 60, bu, 26, rt.anim, shake, { rings: true, col: '#7a808a', coil: '#d09040' });
      bridge(ctx, bx + 100, bx + bw - 100, bu + 54, 14, rt.anim, 0, { col: '#6a707a', coil: '#8a5a22' });
      K.eachCue(rt, (t, tau) => { const sp = spots[t.lane]; K.drop(ctx, t, tau, rt, sp.v, sp.tipU + 14, sp.tipU - 150); });
    } });
};

// ================================================================= MATEPE ================================================================================================
KEY_SCENES.matepe = (K) => {
  const { lanes, N, spots, order } = K;
  K.st.voice = 'tine';
  const ref = { w: 800, h: 780 }, rank = new Array(N); order.forEach((lane, r) => { rank[lane] = r; });
  const groups = 3, per = Math.ceil(N / groups), pitch = clamp(500 / Math.max(1, N), 34, 52), gcx = 0, gcy = 470;
  const gU = (g) => 450 - g * 54;   // each group of keys has its own bar, stepped up as the pitch rises
  lanes.forEach((_, i) => { const r = rank[i], g = Math.min(groups - 1, Math.floor(r / per)), j = r - g * per, v = (r - (N - 1) / 2) * pitch, len = 250 - 30 * j - 10 * g, tip = gU(g) - len; spots[i] = spotAt(v, tip + 12, { v, tipU: tip, len, g, labelV: v, labelU: tip + 64 }); });
  K.set({ ref, dress: { kind: 'earth', base: '#3a2a1c', rugKind: 'stripes', rugBase: '#16241c', rugA: '#e0b058', rugB: '#a8321e', light: '#ffe2b0' }, plr: null,
    draw(ctx, rt) {
      const shake = lanes.reduce((m, _, i) => Math.max(m, rt.flash[i]), 0);
      ctx.fillStyle = 'rgba(0,0,0,0.34)'; ell(ctx, 0, ref.h - 24, 400, 22); ctx.fill();
      // the big dark gourd resonator the board sits in
      ctx.fillStyle = 'rgba(0,0,0,0.32)'; ell(ctx, 14, gcy + 40, 392, 316); ctx.fill();
      ctx.fillStyle = rgrad(ctx, -70, gcy - 70, 30, 440, [[0, '#8a5a2a'], [0.55, '#4e2e14'], [1, '#1a0c04']], -110, gcy - 130); ell(ctx, gcx, gcy + 20, 392, 312); ctx.fill();
      ctx.save(); ell(ctx, gcx, gcy + 20, 392, 312); ctx.clip(); for (let k = 0; k < 110; k++) { ctx.fillStyle = `rgba(200,150,80,${0.04 + 0.08 * hash(k)})`; ell(ctx, (hash(k + 3) - 0.5) * 780, gcy + (hash(k + 50) - 0.5) * 620, 3 + 9 * hash(k + 7), 2 + 4 * hash(k + 9)); ctx.fill(); } ctx.restore();
      ctx.strokeStyle = 'rgba(255,226,170,0.35)'; ctx.lineWidth = 4; ell(ctx, gcx, gcy + 20, 392, 312); ctx.stroke();
      // the board: a dark plank with a ring of white shells round its edge
      const bw = 640, bh = 470, bx = -bw / 2, by = gcy - bh / 2 + 30;
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, bx + 8, by + 12, bw, bh, 30); ctx.fill();
      ctx.fillStyle = hgrad(ctx, bx, bx + bw, [[0, darker('#a8742c', 0.55)], [0.2, lighter('#a8742c', 0.15)], [0.6, '#a8742c'], [1, darker('#a8742c', 0.55)]]); rrect(ctx, bx, by, bw, bh, 30); ctx.fill();
      ctx.save(); rrect(ctx, bx, by, bw, bh, 30); ctx.clip(); grain(ctx, bx, by, bw, bh, '#2a1204', 0.35, 41, false, 14); ctx.restore();
      ctx.strokeStyle = 'rgba(255,225,170,0.45)'; ctx.lineWidth = 3; rrect(ctx, bx, by, bw, bh, 30); ctx.stroke();
      for (let k = 0; k < 30; k++) { const a = (k / 30) * TAU, x = Math.cos(a) * (bw / 2 - 18) * 1.0, y = by + bh / 2 + Math.sin(a) * (bh / 2 - 18); if (Math.abs(Math.cos(a)) < 0.2 && Math.sin(a) < 0) continue; const sw = Math.sin(rt.anim * 50 + k) * 2.4 * shake; ctx.save(); ctx.translate(x + sw, y); ctx.rotate(a); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 3, 4, 13, 8); ctx.fill(); ctx.fillStyle = rgrad(ctx, -3, -3, 1, 14, [[0, '#fffaf0'], [0.6, '#e8dcc0'], [1, '#a8987a']]); ell(ctx, 0, 0, 13, 8); ctx.fill(); ctx.strokeStyle = 'rgba(120,100,70,0.7)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.stroke(); ctx.restore(); }
      ctx.fillStyle = '#100803'; ell(ctx, 0, by + bh - 70, 78, 26); ctx.fill(); ctx.strokeStyle = 'rgba(255,230,180,0.8)'; ctx.lineWidth = 3; ctx.stroke();
      // three stepped bars, each holding its group of keys
      for (let g = 0; g < groups; g++) {
        const ks = lanes.map((_, i) => i).filter((i) => spots[i].g === g); if (!ks.length) continue;
        const vs = ks.map((i) => spots[i].v), x0 = Math.min(...vs) - 40, x1 = Math.max(...vs) + 40;
        ks.forEach((i) => { const sp = spots[i], l = lanes[i]; key(ctx, sp.v, sp.tipU, sp.len + 14, 16, l.color, rt.flash[i], rt.anim, i, { base: '#c8ced6' }); });
        bridge(ctx, x0, x1, gU(g), 22, rt.anim, shake, { rings: g === 0, col: '#8a909a' });
      }
      K.eachCue(rt, (t, tau) => { const sp = spots[t.lane]; K.drop(ctx, t, tau, rt, sp.v, sp.tipU + 14, sp.tipU - 150); });
    } });
};

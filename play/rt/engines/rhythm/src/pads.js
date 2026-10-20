// Drums as the play surface: the real drum (or pair, or set) is drawn large and each lane is a zone of its head or body.
// A seated performer reaches for the notes that are about to fall due and strikes them (performer.js); the instrument stands on
// a dressed surface (set.js). Cues are approach rings closing on the zone; ripples spread on the skin when it is struck.
import { clamp, mix, rgba, lighter, darker, glow, rrect, grain, hgrad, vgrad, rgrad, hash, ell, circ, text, TAU } from './art.js';
import { stageIdFor } from './registry.js';
import { makeBox, finishSpots, hitSpots, pill } from './stagekit.js';
import { setting } from './set.js';
import { createPlayer, hand, stick } from './performer.js';
export { hand, stick };

export const VIEW = { bodhran: { zoom: 1.0 }, steelpan: { zoom: 1.0 }, water: { zoom: 1.0 }, isukuti: { zoom: 1.0 }, tabla: { zoom: 1.0 }, taiko: { dx: 0.0, zoom: 1.0 }, djembe: { zoom: 1.0 }, mortar: { zoom: 1.0 }, rubboard: { zoom: 1.0 }, multi: {} };
export const IDS = [
  [/rub.?board|wash.?board|frottoir|zydeco|scrape/, 'rubboard'], [/tabla|dayan|bayan/, 'tabla'], [/taiko/, 'taiko'], [/bodhr|frame drum|daf\b|riq\b/, 'bodhran'], [/isukuti/, 'isukuti'],
  [/calabash|water drum|water/, 'water'], [/steel.?pan|pan\b/, 'steelpan'], [/fufu|mortar|pound/, 'mortar'], [/djembe|dunun|conga|cajon|candombe/, 'djembe'],
];
export const padId = (key) => stageIdFor('pads', key);   // routes live in registry.js; new drums: registerDrumStage

const disc = (cx, cy, rx, ry = rx, o = {}) => ({ v: cx, u: cy, r: Math.min(rx, ry), ar: Math.min(rx, ry) * 0.85, dist: (lv, lu) => Math.hypot((lv - cx) / rx, (lu - cy) / ry), path: (c) => { c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU); }, ...o });
const annulus = (cx, cy, r0, r1, sq = 1, ang = 0.6, o = {}) => {
  const rm = (r0 + r1) / 2, hw = (r1 - r0) / 2;
  return { v: cx + Math.cos(ang) * rm, u: cy + Math.sin(ang) * rm * sq, r: hw, ar: Math.min(hw, 70) * 0.95,
    dist: (lv, lu) => { const d = Math.hypot(lv - cx, (lu - cy) / sq); if (d < r0) return 1 + ((r0 - d) / hw) * 2; if (d > r1) return 1 + ((d - r1) / hw) * 2; return (Math.abs(d - rm) / hw) * 0.9; },
    path: (c) => { c.beginPath(); c.ellipse(cx, cy, r1, r1 * sq, 0, 0, TAU); c.ellipse(cx, cy, Math.max(0.1, r0), Math.max(0.1, r0 * sq), 0, 0, TAU, true); }, evenodd: true, ...o };
};

const SKIN_G = (c, cx, cy, rx, ry) => rgrad(c, cx, cy, 0, Math.max(rx, ry) * 1.1, [[0, '#fff9e8'], [0.6, '#eddcb4'], [1, '#c4a679']], cx - rx * 0.25, cy - ry * 0.3);

// hide texture inside an ellipse: mottling, veins, hair follicles, and an occlusion ring where the skin dips under the hoop
function hide(ctx, cx, cy, rx, ry, seed, dent = 0) {
  ctx.save(); ell(ctx, cx, cy, rx, ry); ctx.clip();
  for (let k = 0; k < 46; k++) {
    const a = hash(seed + k) * TAU, d = Math.sqrt(hash(seed + k + 40)), px = cx + Math.cos(a) * d * rx * 0.95, py = cy + Math.sin(a) * d * ry * 0.95;
    ctx.fillStyle = `rgba(${130 + 40 * hash(k)},${96 + 30 * hash(k + 3)},${52},${0.05 + 0.09 * hash(seed + k + 9)})`; ell(ctx, px, py, rx * (0.04 + 0.1 * hash(k + 7)), ry * (0.03 + 0.08 * hash(k + 5))); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(120,84,40,0.16)'; ctx.lineWidth = 1.2;
  for (let k = 0; k < 7; k++) { ctx.beginPath(); const a0 = hash(seed + k * 2) * TAU; ctx.ellipse(cx + (hash(seed + k) - 0.5) * rx * 0.5, cy + (hash(seed + k + 5) - 0.5) * ry * 0.5, rx * (0.25 + 0.14 * k), ry * (0.25 + 0.14 * k), 0, a0, a0 + 1.6 + hash(k) * 1.2); ctx.stroke(); }
  for (let k = 0; k < 90; k++) { const a = hash(seed + k * 3) * TAU, d = Math.sqrt(hash(seed + k * 5 + 1)); ctx.fillStyle = 'rgba(70,40,20,0.22)'; circ(ctx, cx + Math.cos(a) * d * rx, cy + Math.sin(a) * d * ry, 0.8 + hash(k) * 1.1); ctx.fill(); }
  // occlusion ring and a soft key-light sheen
  ctx.fillStyle = rgrad(ctx, cx, cy, Math.min(rx, ry) * 0.72, Math.max(rx, ry) * 1.02, [[0, 'rgba(50,28,10,0)'], [1, 'rgba(50,28,10,0.45)']]); ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  ctx.fillStyle = rgrad(ctx, cx - rx * 0.3, cy - ry * 0.35, 0, Math.max(rx, ry) * 0.7, [[0, 'rgba(255,255,255,0.32)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  if (dent > 0.02) { ctx.fillStyle = `rgba(60,30,10,${0.2 * dent})`; ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2); }
  ctx.restore();
}
function tacks(ctx, cx, cy, rx, ry, n, size, col = '#e8c868', ph = 0) {
  for (let k = 0; k < n; k++) {
    const a = ph + (k / n) * TAU, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, x + size * 0.3, y + size * 0.45, size); ctx.fill();
    ctx.fillStyle = rgrad(ctx, x, y, 0, size * 1.1, [[0, lighter(col, 0.7)], [0.55, col], [1, darker(col, 0.5)]], x - size * 0.3, y - size * 0.35); circ(ctx, x, y, size); ctx.fill();
  }
}
// a turned wooden ring (rim) seen from above: lit upper left, with a bevel and lathe grooves
function ring(ctx, cx, cy, r0, r1, col, seed = 3) {
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; ell(ctx, cx + (r1 - r0) * 0.3 + 6, cy + 10, r1, r1); ctx.fill();
  ctx.fillStyle = rgrad(ctx, cx, cy, r0 * 0.9, r1, [[0, lighter(col, 0.2)], [0.5, col], [1, darker(col, 0.6)]], cx - r1 * 0.25, cy - r1 * 0.3); circ(ctx, cx, cy, r1); ctx.fill();
  ctx.save(); circ(ctx, cx, cy, r1); ctx.clip();
  grain(ctx, cx - r1, cy - r1, r1 * 2, r1 * 2, darker(col, 0.7), 0.35, seed, false, 22);
  ctx.restore();
  ctx.strokeStyle = rgba(lighter(col, 0.65), 0.55); ctx.lineWidth = 2.5; circ(ctx, cx, cy, r1 - 2); ctx.stroke();
  ctx.strokeStyle = rgba(darker(col, 0.7), 0.5); ctx.lineWidth = 2; circ(ctx, cx, cy, r0 + 1); ctx.stroke();
  ctx.strokeStyle = rgba(lighter(col, 0.5), 0.2); ctx.lineWidth = 1; circ(ctx, cx, cy, (r0 + r1) / 2); ctx.stroke();
}
// an interlaced two-strand band around a circle (painted knotwork)
function knot(ctx, cx, cy, rm, amp, lobes, w, c1, c2) {
  const pt = (a, s) => [cx + Math.cos(a) * (rm + s * amp * Math.sin(lobes * a)), cy + Math.sin(a) * (rm + s * amp * Math.sin(lobes * a))];
  const strand = (s, c, from = 0, to = TAU) => {
    for (const [lw, col] of [[w + 4, 'rgba(30,16,6,0.9)'], [w, c], [w * 0.28, lighter(c, 0.5)]]) {
      ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.beginPath();
      for (let a = from; a <= to + 0.001; a += 0.03) { const [x, y] = pt(a, s); if (a === from) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
    }
  };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  strand(1, c1); strand(-1, c2);
  // weave: over-crossings at every second lobe
  for (let k = 0; k < lobes; k++) { const a0 = (k / lobes) * TAU + (TAU / lobes) * 0.15, a1 = a0 + (TAU / lobes) * 0.7; if (k % 2) strand(1, c1, a0, a1); else strand(-1, c2, a0, a1); }
}

export function createPadStage(id, S, lanes, P) {
  const N = lanes.length;
  const st = { id, kind: 'pads', spots: new Array(N).fill(null), voice: 'drum', F: null };
  const spots = st.spots;
  const order = lanes.map((_, i) => i).sort((a, b) => lanes[a].hz - lanes[b].hz);   // low to high
  const nm = (i) => lanes[i].name.toLowerCase();
  let ref = { w: 640, h: 760 }, drawScene = () => {}, dress = { kind: 'pub' }, plr = null, player = null, tall = false, built = false;

  // ---- zone painting ------------------------------------------------------------------------------------------------------------
  // a sweet spot: a soft lit disc with a bright ring, flaring when struck
  const zoneStyle = (ctx, sp, col, f, rt) => {
    sp.path(ctx);
    ctx.save();
    ctx.fillStyle = rgba(col, 0.1 + 0.5 * f); ctx.fill(sp.evenodd ? 'evenodd' : 'nonzero');
    ctx.clip(sp.evenodd ? 'evenodd' : 'nonzero');
    ctx.fillStyle = rgrad(ctx, sp.v - sp.r * 0.25, sp.u - sp.r * 0.3, 0, sp.r * 2.2, [[0, rgba('#ffffff', 0.22 + 0.3 * f)], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(sp.v - sp.r * 3, sp.u - sp.r * 3, sp.r * 6, sp.r * 6);
    ctx.restore();
    sp.path(ctx);
    ctx.strokeStyle = 'rgba(30,14,4,0.45)'; ctx.lineWidth = 5 + 2 * f; ctx.save(); ctx.translate(1.5, 2); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = rgba(lighter(col, 0.5), 0.8 + 0.2 * f); ctx.lineWidth = 3 + 2 * f; ctx.stroke();
    void rt;
  };
  const ripple = (ctx, sp, col, f, sq = 1) => {
    if (f <= 0.04) return;
    glow(ctx, sp.v, sp.u, sp.r * 2.4 + 40, col, 0.5 * f);
    for (let k = 0; k < 3; k++) { const p = clamp((1 - f) * 1.3 - k * 0.16, 0, 1); if (p <= 0) continue; ctx.strokeStyle = rgba('#ffffff', 0.6 * (1 - p)); ctx.lineWidth = 3.5 - k; ctx.beginPath(); ctx.ellipse(sp.v, sp.u, sp.r * (0.55 + 1.5 * p), sp.r * (0.55 + 1.5 * p) * sq, 0, 0, TAU); ctx.stroke(); }
  };
  const approach = (ctx, sp, col, tau, a, sq = 1) => {
    if (sp.rect) {   // a long zone (rubboard): a frame closes on it from outside
      const g2 = 3 + 14 * clamp(tau, 0, 1.1), k = 1 - clamp(tau, 0, 1), r = Math.min(sp.hw, sp.hh) * 0.3 + g2;
      ctx.save(); ctx.globalAlpha = a;
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 9; rrect(ctx, sp.v - sp.hw - g2 + 1.5, sp.u - sp.hh - g2 + 2, 2 * (sp.hw + g2), 2 * (sp.hh + g2), r); ctx.stroke();
      ctx.strokeStyle = rgba(lighter(col, 0.5), 0.98); ctx.lineWidth = 4.5; rrect(ctx, sp.v - sp.hw - g2, sp.u - sp.hh - g2, 2 * (sp.hw + g2), 2 * (sp.hh + g2), r); ctx.stroke();
      ctx.strokeStyle = rgba(col, 0.5); ctx.lineWidth = 10; ctx.stroke();
      glow(ctx, sp.v, sp.u, Math.max(sp.hw, sp.hh) * (0.7 + 0.5 * k), col, 0.12 + 0.3 * k);
      ctx.restore();
      return;
    }
    const R = sp.ar * (1 + 1.1 * clamp(tau, 0, 1.1));
    ctx.save(); ctx.globalAlpha = a;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(sp.v + 1.5, sp.u + 2, R, R * sq, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = rgba(lighter(col, 0.5), 0.98); ctx.lineWidth = 4.5; ctx.beginPath(); ctx.ellipse(sp.v, sp.u, R, R * sq, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = rgba(col, 0.5); ctx.lineWidth = 10; ctx.stroke();
    const k = 1 - clamp(tau, 0, 1); glow(ctx, sp.v, sp.u, sp.ar * (1.5 + k), col, 0.2 + 0.45 * k);
    ctx.fillStyle = rgba(lighter(col, 0.55), 0.95); circ(ctx, sp.v, sp.u, 6 + 7 * k); ctx.fill();
    ctx.restore();
  };
  const paintZones = (ctx, rt, sq = 1) => {
    lanes.forEach((l, i) => { const sp = spots[i]; if (!sp || sp.hidden) return; zoneStyle(ctx, sp, l.color, rt.flash[i], rt); ripple(ctx, sp, l.color, rt.flash[i], sq); });
  };

  // ---- scenes -------------------------------------------------------------------------------------------------------------------
  function sceneDjembe() {
    ref = { w: 620, h: 900 };
    dress = { kind: 'earth', base: '#8a5a32', rugKind: 'kente', rugBase: '#6a2a1c', rugA: '#e8b84a', rugB: '#1f5a3a', light: '#ffcf8a' };
    const cx = 0, cy = 270, rx = 232, ry = 126;
    const k = order.length;
    order.forEach((lane, rank) => {
      const r0 = (rank / k) * rx * 0.97, r1 = ((rank + 1) / k) * rx * 0.97;
      spots[lane] = rank === 0 ? disc(cx, cy, r1, r1 * (ry / rx)) : annulus(cx, cy, r0, r1, ry / rx, rank % 2 ? 0.7 : 2.4);
    });
    plr = { tool: 'palm', shirt: '#8a2a1c', trim: '#f0c860', headwear: 'cap', hat: '#2a5a3a', hands: 2, reach: 0.55 };
    drawScene = (ctx, rt) => {
      ctx.fillStyle = 'rgba(0,0,0,0.38)'; ell(ctx, 12, 862, 190, 30); ctx.fill();
      const wood = S.wood;
      ctx.beginPath(); ctx.moveTo(-rx, cy); ctx.bezierCurveTo(-rx, cy + 170, -120, 450, -92, 600); ctx.bezierCurveTo(-84, 660, -150, 720, -160, 850); ctx.quadraticCurveTo(0, 900, 160, 850); ctx.bezierCurveTo(150, 720, 84, 660, 92, 600); ctx.bezierCurveTo(120, 450, rx, cy + 170, rx, cy); ctx.closePath();
      ctx.fillStyle = hgrad(ctx, -rx, rx, [[0, darker(wood, 0.6)], [0.25, lighter(wood, 0.3)], [0.55, wood], [0.85, darker(wood, 0.45)], [1, darker(wood, 0.7)]]); ctx.fill();
      ctx.save(); ctx.clip(); grain(ctx, -rx, cy, rx * 2, 640, darker(wood, 0.75), 0.4, 17, true, 22);
      ctx.strokeStyle = 'rgba(255,225,170,0.35)'; ctx.lineWidth = 3;
      for (let b = 0; b < 3; b++) { ctx.beginPath(); for (let x = -150; x <= 150; x += 25) { const y = 700 + b * 34 + (Math.round(x / 25) % 2 ? 12 : -12); ctx.lineTo(x * (1 + b * 0.05), y); } ctx.stroke(); }
      ctx.restore();
      ctx.strokeStyle = '#e8d8b0'; ctx.lineWidth = 5; ctx.lineJoin = 'round';
      const ringU = 430;
      ctx.beginPath(); for (let a = 0; a < 20; a++) { const t0 = a / 20, t1 = (a + 0.5) / 20, t2 = (a + 1) / 20; const x = (t) => Math.cos(Math.PI * t) * rx * 0.97 * -1; ctx.moveTo(x(t0), cy + 14); ctx.lineTo(x(t1) * 0.78, ringU); ctx.lineTo(x(t2), cy + 14); } ctx.stroke();
      ctx.strokeStyle = '#2a1608'; ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(0, ringU, rx * 0.8, 38, 0, 0, Math.PI); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 6, cy + 12, rx + 12, ry + 12); ctx.fill();
      ctx.fillStyle = rgrad(ctx, 0, cy, rx * 0.6, rx + 10, [[0, '#9aa1ab'], [1, '#3a4048']]); ell(ctx, cx, cy, rx + 10, ry + 10); ctx.fill();
      ctx.fillStyle = SKIN_G(ctx, cx, cy, rx, ry); ell(ctx, cx, cy, rx - 4, ry - 4); ctx.fill();
      hide(ctx, cx, cy, rx - 4, ry - 4, 5);
      paintZones(ctx, rt, ry / rx);
    };
  }

  function sceneTaiko() {
    ref = { w: 700, h: 780 };
    dress = { kind: 'planks', base: '#5a3a26', rugKind: 'stripes', rugBase: '#1c2a3a', rugA: '#d8c070', rugB: '#a82a22', light: '#ffe0a8' };
    const cx = 0, cy = 340, R = 262;
    const k = order.length;
    order.forEach((lane, rank) => {
      const r0 = rank === 0 ? 0 : (rank / k) * R * 0.62 + (rank === 1 ? R * 0.1 : 0), r1 = rank === k - 1 ? R * 1.18 : ((rank + 1) / k) * R * 0.62 + R * 0.1;
      spots[lane] = rank === 0 ? disc(cx, cy, r1, r1) : annulus(cx, cy, r0, r1, 1, -0.6 + rank * 0.7);
    });
    plr = { tool: 'stick', toolLen: 150, toolW: 20, wood: '#f0dcb0', head: '#d9ad6a', headR: 0.95, shirt: '#1c2a52', trim: '#e8d8a0', headwear: 'wrap', hat: '#f0f0ea', hands: 2, reach: 0.7 };
    drawScene = (ctx, rt) => {
      ctx.fillStyle = 'rgba(0,0,0,0.36)'; ell(ctx, 10, 760, 270, 24); ctx.fill();
      for (const d of [-1, 1]) { ctx.save(); ctx.translate(d * 215, 640); ctx.rotate(d * -0.2); ctx.fillStyle = hgrad(ctx, -30, 30, [[0, '#2a1608'], [0.4, '#7a4a22'], [1, '#2a1608']]); rrect(ctx, -26, -140, 52, 270, 12); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = hgrad(ctx, -260, 260, [[0, '#3a1c0a'], [0.5, '#8a5a2a'], [1, '#3a1c0a']]); rrect(ctx, -270, 700, 540, 40, 14); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; circ(ctx, cx + 10, cy + 14, R + 40); ctx.fill();
      ctx.fillStyle = rgrad(ctx, cx, cy, R * 0.7, R + 44, [[0, '#7a2a14'], [0.7, '#5a1c0c'], [1, '#2a0c06']], cx - 60, cy - 70); circ(ctx, cx, cy, R + 40); ctx.fill();
      ctx.strokeStyle = 'rgba(255,210,150,0.4)'; ctx.lineWidth = 3; ctx.stroke();
      tacks(ctx, cx, cy, R + 20, R + 20, 30, 8.5);
      ctx.fillStyle = rgrad(ctx, cx, cy, 10, R + 6, [[0, '#fff6df'], [0.7, '#e9d3a3'], [1, '#b99c68']], cx - R * 0.25, cy - R * 0.3); circ(ctx, cx, cy, R); ctx.fill();
      hide(ctx, cx, cy, R, R, 9);
      ctx.strokeStyle = 'rgba(120,90,50,0.2)'; ctx.lineWidth = 2; for (let q = 1; q < 5; q++) { circ(ctx, cx, cy, R * q / 5.2); ctx.stroke(); }
      ctx.fillStyle = 'rgba(70,40,20,0.35)'; circ(ctx, cx, cy, R * 0.12); ctx.fill();
      paintZones(ctx, rt);
    };
  }

  function sceneBodhran() {
    ref = { w: 720, h: 720 };
    dress = { kind: 'pub', base: '#4a2e1a', rugKind: 'stripes', rugBase: '#27402c', rugA: '#c8a860', rugB: '#7a2a22', light: '#ffd9a0' };
    const cx = 0, cy = 360, R = 292;
    const rimLanes = lanes.map((_, i) => i).filter((i) => /rim|edge|wood|click|frame/.test(nm(i)));
    const inner = lanes.map((_, i) => i).filter((i) => !rimLanes.includes(i));
    rimLanes.forEach((i, k) => { spots[i] = annulus(cx, cy, R * 0.82, R * 1.1, 1, 0.8 + k * 1.5); });
    const place = { top: [0, -0.52], up: [0, -0.2], down: [0, 0.2], pressed: [-0.5, 0.26], press: [-0.5, 0.26], low: [0, 0.3], high: [0, -0.4] };
    const used = new Set();
    inner.forEach((i, k) => {
      let p = null;
      for (const key of Object.keys(place)) if (nm(i).includes(key) && !used.has(key)) { p = place[key]; used.add(key); break; }
      if (!p) { const a = -Math.PI / 2 + (k / Math.max(1, inner.length)) * TAU; p = [Math.cos(a) * 0.45, Math.sin(a) * 0.45]; }
      spots[i] = disc(cx + p[0] * R, cy + p[1] * R, R * 0.2, R * 0.2, { pressHand: /press/.test(nm(i)) });
    });
    const pressIdx = lanes.findIndex((_, i) => spots[i]?.pressHand);
    plr = {
      tool: 'stick', toolOf: (k) => (k === 0 ? 'palm' : 'stick'), toolLen: 130, toolW: 13, wood: '#d9b070', head: '#a87838', headR: 1.45,
      shirt: '#2a4a38', trim: '#c8a860', headwear: 'cap', hat: '#4a3a28', sleeve: 'long', hands: 2, reach: 0.62,
      aim: (i, sp) => (sp.pressHand ? [{ h: 0, x: sp.x, y: sp.y }] : [{ h: 1, x: sp.x, y: sp.y }]),
      restOf: (k, sps) => (k === 0 ? { x: (pressIdx >= 0 ? sps[pressIdx].x : sps[0].x), y: (pressIdx >= 0 ? sps[pressIdx].y : sps[0].y), raise: 0 } : { x: sps[0].x + 40, y: sps[0].y - 50, raise: 0.6 }),
    };
    drawScene = (ctx, rt) => {
      // wooden frame: a turned rim with a bevel, tuning tacks and a band of painted knotwork on the skin
      ring(ctx, cx, cy, R * 0.97, R + 38, '#8a5a2c', 3);
      ctx.fillStyle = SKIN_G(ctx, cx, cy, R, R); circ(ctx, cx, cy, R * 0.99); ctx.fill();
      hide(ctx, cx, cy, R * 0.99, R * 0.99, 11);
      // the crossbar behind the skin, faintly visible
      ctx.save(); circ(ctx, cx, cy, R * 0.99); ctx.clip();
      ctx.strokeStyle = 'rgba(70,44,18,0.2)'; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(cx - R, cy + R * 0.1); ctx.lineTo(cx + R, cy + R * 0.1); ctx.stroke();
      ctx.strokeStyle = 'rgba(70,44,18,0.1)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(cx - R, cy + R * 0.1 - 20); ctx.lineTo(cx + R, cy + R * 0.1 - 20); ctx.stroke();
      ctx.globalAlpha = 0.9; knot(ctx, cx, cy, R * 0.86, R * 0.045, 10, 9, '#6e3a1a', '#2f5a3c'); ctx.restore();
      tacks(ctx, cx, cy, R * 0.955, R * 0.955, 44, 4.5, '#d9b24a');
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 3; circ(ctx, cx, cy, R * 0.985); ctx.stroke();
      paintZones(ctx, rt);
    };
  }

  function sceneIsukuti() {
    const defs = tall
      ? [[0, 440, 150, 66, 280], [-175, 250, 118, 52, 230], [185, 230, 96, 42, 200]]
      : [[-230, 250, 150, 70, 370], [30, 280, 125, 60, 330], [250, 310, 96, 46, 290]];
    ref = tall ? { w: 600, h: 840 } : { w: 820, h: 700 };
    dress = { kind: 'earth', base: '#7e5a36', rugKind: 'kente', rugBase: '#8a2a1c', rugA: '#f0c040', rugB: '#1c5a3c', light: '#ffd48a' };
    const wood = lanes.map((_, i) => i).filter((i) => /stick|wood|click|clap/.test(nm(i)));
    const heads = order.filter((i) => !wood.includes(i));
    heads.forEach((lane, k) => { const d = defs[Math.min(k, defs.length - 1)]; spots[lane] = disc(d[0], d[1], d[2] * 0.82, d[3] * 0.82, { drum: d }); });
    wood.forEach((i, k) => { spots[i] = disc(tall ? -70 + k * 220 : -60 + k * 220, tall ? 780 : 640, 100, 38, { block: true }); });
    plr = { tool: 'stick', toolLen: 120, toolW: 14, wood: '#f0dcb0', head: '#b88040', headR: 0.9, shirt: '#c0392b', trim: '#f0d060', headwear: 'wrap', hat: '#e8b030', hands: 2, reach: 0.64 };
    drawScene = (ctx, rt) => {
      const woodC = S.wood;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, 0, ref.h - 14, ref.w * 0.46, 26); ctx.fill();
      [...heads].sort((a, b) => spots[a].drum[1] - spots[b].drum[1]).forEach((lane) => {
        const d = spots[lane].drum, cx = d[0], cy = d[1], rx = d[2], ry = d[3], bodyH = d[4];
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, cx + 10, cy + bodyH + 8, rx * 1.0, ry * 0.9); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx - rx, cy); ctx.bezierCurveTo(cx - rx * 1.12, cy + bodyH * 0.5, cx - rx * 1.05, cy + bodyH * 0.9, cx - rx * 0.86, cy + bodyH); ctx.ellipse(cx, cy + bodyH, rx * 0.86, ry * 0.8, 0, Math.PI, 0, true); ctx.bezierCurveTo(cx + rx * 1.05, cy + bodyH * 0.9, cx + rx * 1.12, cy + bodyH * 0.5, cx + rx, cy); ctx.closePath();
        ctx.fillStyle = hgrad(ctx, cx - rx, cx + rx, [[0, darker(woodC, 0.65)], [0.2, lighter(woodC, 0.3)], [0.55, woodC], [1, darker(woodC, 0.7)]]); ctx.fill();
        ctx.save(); ctx.clip();
        grain(ctx, cx - rx, cy, rx * 2, bodyH, darker(woodC, 0.7), 0.35, lane * 5, true, 14);
        // the drum is laced with strips of hide (V shapes) and banded with carved rings
        ctx.strokeStyle = 'rgba(240,222,176,0.85)'; ctx.lineWidth = 4;
        for (let a = 0; a < 8; a++) { const t = a / 8; ctx.beginPath(); ctx.moveTo(cx - rx + t * rx * 2, cy + 8); ctx.lineTo(cx - rx + (t + 0.065) * rx * 2, cy + bodyH * 0.5); ctx.lineTo(cx - rx + t * rx * 2, cy + bodyH); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(20,10,4,0.55)'; ctx.lineWidth = 7; for (const q of [0.2, 0.55, 0.85]) { ctx.beginPath(); ctx.ellipse(cx, cy + bodyH * q, rx * 1.06, ry * 0.9, 0, 0, Math.PI); ctx.stroke(); }
        ctx.fillStyle = hgrad(ctx, cx - rx, cx + rx, [[0, 'rgba(255,255,255,0)'], [0.22, 'rgba(255,240,200,0.22)'], [0.4, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.3)']]); ctx.fillRect(cx - rx * 1.2, cy, rx * 2.4, bodyH);
        ctx.restore();
        ctx.fillStyle = '#c4a679'; ell(ctx, cx, cy, rx + 7, ry + 7); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = SKIN_G(ctx, cx, cy, rx, ry); ell(ctx, cx, cy, rx - 3, ry - 3); ctx.fill();
        hide(ctx, cx, cy, rx - 3, ry - 3, lane * 7 + 2);
      });
      paintZones(ctx, rt, 0.47);
      lanes.forEach((l, i) => {
        const sp = spots[i];
        if (sp.block) { // wooden clapper block
          ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, sp.v - 86, sp.u - 16, 180, 56, 14); ctx.fill();
          ctx.fillStyle = hgrad(ctx, sp.v - 90, sp.v + 90, [[0, '#5a3418'], [0.35, '#e0b068'], [0.7, '#a0702e'], [1, '#4a2a10']]); rrect(ctx, sp.v - 90, sp.u - 26, 180, 52, 14); ctx.fill();
          grain(ctx, sp.v - 90, sp.u - 26, 180, 52, '#3a1c08', 0.4, 4, false, 5);
        }
      });
    };
  }

  function sceneWater() {
    ref = { w: 760, h: 760 };
    dress = { kind: 'earth', base: '#8a6a40', rugKind: 'stripes', rugBase: '#3a2a1c', rugA: '#d8b878', rugB: '#6a8a5a', light: '#bfe8ff' };
    const cx = 0, cy = 380, RB = 352, RC = 222;
    const rimL = lanes.map((_, i) => i).filter((i) => /rim|edge|bowl|wood/.test(nm(i)));
    const gourd = order.filter((i) => !rimL.includes(i));
    const k = gourd.length;
    // concentric zones of the floating half-gourd: low centre, higher towards the edge (more water lifted away)
    gourd.forEach((lane, rank) => {
      const r0 = rank === 0 ? 0 : (rank / k) * RC * 0.96, r1 = ((rank + 1) / k) * RC * 0.96;
      spots[lane] = rank === 0 ? disc(cx, cy, r1 * 0.97, r1 * 0.97) : annulus(cx, cy, r0 * 1.02, r1, 1, [-2.45, 0.7, -0.6][rank - 1] ?? -0.9 + rank * 1.4);
    });
    rimL.forEach((i, j) => { spots[i] = annulus(cx, cy, RB * 0.86, RB * 1.02, 1, 0.3 + j * 1.6); });
    plr = { tool: 'palm', shirt: '#b8422a', trim: '#f2d27a', headwear: 'wrap', hat: '#2a6a8a', hands: 2, reach: 0.6 };
    drawScene = (ctx, rt) => {
      // the bowl: a big calabash cut open, rim turned out
      ring(ctx, cx, cy, RB * 0.9, RB + 40, '#9a6a30', 7);
      ctx.fillStyle = rgrad(ctx, cx, cy, 20, RB, [[0, '#8fd6e6'], [0.6, '#3a8aa6'], [1, '#1a4a62']], cx - 60, cy - 70); circ(ctx, cx, cy, RB * 0.91); ctx.fill();
      // water: caustic bands moving slowly, shoreline occlusion at the bowl wall
      ctx.save(); circ(ctx, cx, cy, RB * 0.91); ctx.clip();
      for (let q = 0; q < 6; q++) {
        ctx.strokeStyle = `rgba(255,255,255,${0.1 + 0.05 * (q % 2)})`; ctx.lineWidth = 3;
        ctx.beginPath(); for (let a = 0; a <= TAU + 0.01; a += 0.12) { const r = RC * (1.14 + 0.15 * q) + 5 * Math.sin(rt.anim * 1.4 + q * 1.3 + a * 4); const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
      }
      ctx.fillStyle = rgrad(ctx, cx, cy, RB * 0.55, RB * 0.92, [[0, 'rgba(0,30,50,0)'], [1, 'rgba(0,20,40,0.55)']]); ctx.fillRect(cx - RB, cy - RB, RB * 2, RB * 2);
      ctx.restore();
      const wob = lanes.reduce((m, _, i) => Math.max(m, rt.flash[i]), 0);
      if (wob > 0.05) { ctx.strokeStyle = `rgba(255,255,255,${0.7 * wob})`; ctx.lineWidth = 5; circ(ctx, cx, cy, RC * (1.1 + (1 - wob) * 1.0)); ctx.stroke(); ctx.strokeStyle = `rgba(255,255,255,${0.4 * wob})`; ctx.lineWidth = 3; circ(ctx, cx, cy, RC * (1.0 + (1 - wob) * 1.5)); ctx.stroke(); }
      // the floating half-gourd, upside down: dome with grain, a seam and a specular streak
      ctx.fillStyle = 'rgba(0,0,0,0.34)'; circ(ctx, cx + 14, cy + 18, RC + 8); ctx.fill();
      ctx.fillStyle = rgrad(ctx, cx, cy, 8, RC + 6, [[0, '#f4d690'], [0.45, '#c8964a'], [0.85, '#8a5a22'], [1, '#4a2c0c']], cx - RC * 0.32, cy - RC * 0.4); circ(ctx, cx, cy, RC + 4); ctx.fill();
      ctx.save(); circ(ctx, cx, cy, RC + 4); ctx.clip();
      grain(ctx, cx - RC, cy - RC, RC * 2, RC * 2, '#3a1c06', 0.3, 5, false, 16);
      ctx.strokeStyle = 'rgba(70,40,12,0.4)'; ctx.lineWidth = 2; for (let q = 0; q < 5; q++) { ctx.beginPath(); ctx.arc(cx, cy, RC * (0.25 + q * 0.17), 0.2, 2.6 + q * 0.2); ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.32)'; ell(ctx, cx - RC * 0.3, cy - RC * 0.44, RC * 0.34, RC * 0.12); ctx.fill();
      ctx.strokeStyle = 'rgba(40,20,6,0.55)'; ctx.lineWidth = 4; circ(ctx, cx, cy, RC + 3); ctx.stroke();
      paintZones(ctx, rt);
    };
  }

  function scenePan() {
    ref = { w: 780, h: 800 };
    dress = { kind: 'asphalt', base: '#232830', rugKind: null, light: '#ffd9a0' };
    const cx = 0, cy = 360, R = 350, sq = 0.84;
    const outerN = N <= 5 ? N : Math.ceil(N * 0.66);
    lanes.forEach((_, i) => {
      const outer = i < outerN, n = outer ? outerN : N - outerN, kk = outer ? i : i - outerN;
      const a = -Math.PI / 2 + (kk / n) * TAU + (outer ? 0 : TAU / (2 * n)), rr = outer ? R * 0.68 : R * 0.31;
      const w = outer ? clamp(R * 0.215, 36, 80) : clamp(R * 0.19, 32, 66);
      spots[i] = disc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * sq, w, w * 0.8, { ang: a, outer });
    });
    plr = { tool: 'stick', toolLen: 120, toolW: 11, wood: '#d8c9a6', head: '#d83a2a', headR: 1.35, shirt: '#e0a020', trim: '#2a8a6a', headwear: 'hat', hat: '#d83a2a', sleeve: 'short', hands: 2, reach: 0.62 };
    drawScene = (ctx, rt) => {
      // stand legs and the barrel skirt below the playing surface
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ell(ctx, 14, cy + R * sq + 170, R * 0.95, 34); ctx.fill();
      for (const d of [-1, 1]) { ctx.fillStyle = hgrad(ctx, d * 230 - 18, d * 230 + 18, [[0, '#15181c'], [0.4, '#6a7078'], [1, '#15181c']]); rrect(ctx, d * 230 - 16, cy + R * sq * 0.6, 32, 190, 8); ctx.fill(); }
      const sk = 130;
      ctx.beginPath(); ctx.moveTo(-R - 30, cy); ctx.lineTo(-R - 30, cy + sk); ctx.ellipse(0, cy + sk, R + 30, (R + 30) * sq, 0, Math.PI, 0, true); ctx.lineTo(R + 30, cy); ctx.closePath();
      ctx.fillStyle = hgrad(ctx, -R - 30, R + 30, [[0, '#14181e'], [0.2, '#8a929c'], [0.38, '#e8edf2'], [0.55, '#9aa2ac'], [0.85, '#3a4048'], [1, '#101418']]); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; for (const q of [0.3, 0.62]) { ctx.beginPath(); ctx.ellipse(0, cy + sk * q, R + 30, (R + 30) * sq, 0, 0, Math.PI); ctx.stroke(); }
      // the playing surface: a rim, then a slightly concave bowl of beaten steel
      ctx.fillStyle = rgrad(ctx, cx, cy, R * 0.6, R + 40, [[0, '#8c949e'], [0.8, '#4a525c'], [1, '#1e242a']], cx - 90, cy - 100); ell(ctx, cx, cy, R + 38, (R + 38) * sq); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 4; ell(ctx, cx, cy, R + 36, (R + 36) * sq); ctx.stroke();
      ctx.fillStyle = rgrad(ctx, cx, cy, 10, R, [[0, '#cfd6de'], [0.55, '#7e8892'], [1, '#2e353c']], cx - R * 0.3, cy - R * 0.35 * sq); ell(ctx, cx, cy, R, R * sq); ctx.fill();
      // hammer-peening: little dents across the steel
      ctx.save(); ell(ctx, cx, cy, R, R * sq); ctx.clip();
      for (let k = 0; k < 120; k++) { const a = hash(k) * TAU, d = Math.sqrt(hash(k + 77)); const x = cx + Math.cos(a) * d * R * 0.97, y = cy + Math.sin(a) * d * R * sq * 0.97; ctx.fillStyle = 'rgba(0,0,0,0.1)'; ell(ctx, x, y, 7 + 5 * hash(k + 3), 5 + 3 * hash(k + 9)); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ell(ctx, x - 2, y - 2, 4, 2.5); ctx.fill(); }
      ctx.restore();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 3; ell(ctx, cx, cy, R * 0.99, R * 0.99 * sq); ctx.stroke();
      // grooved note dimples: each is a raised dome with its own rim light and a colour band
      lanes.forEach((l, i) => {
        const sp = spots[i], f = rt.flash[i], rx = sp.r * 1.25, ry = sp.r * 1.0;
        ctx.save(); ctx.translate(sp.v, sp.u); ctx.rotate(sp.ang + Math.PI / 2);
        ctx.fillStyle = 'rgba(0,0,0,0.45)'; ell(ctx, 3, 5, rx + 3, ry + 3); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 4; ell(ctx, 0, 0, rx + 2, (ry + 2) * 1.1); ctx.stroke();
        ctx.fillStyle = rgrad(ctx, 0, 0, 2, rx, [[0, lighter(l.color, 0.55 + 0.4 * f)], [0.55, mix('#b4bcc6', l.color, 0.32 + 0.4 * f)], [1, '#5a626c']], -rx * 0.25, -ry * 0.3); ell(ctx, 0, 0, rx, ry * 1.1); ctx.fill();
        ctx.strokeStyle = rgba(lighter(l.color, 0.5), 0.9); ctx.lineWidth = 3; ell(ctx, 0, 0, rx, ry * 1.1); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ell(ctx, -rx * 0.2, -ry * 0.42, rx * 0.42, ry * 0.17); ctx.fill();
        ctx.restore();
        ripple(ctx, sp, l.color, f, 0.85);
      });
    };
  }

  function sceneMortar() {
    ref = { w: 700, h: 830 };
    dress = { kind: 'earth', base: '#8a6038', rugKind: 'zigzag', rugBase: '#4a2a18', rugA: '#e0b060', rugB: '#6a8a4a', light: '#ffd18a' };
    const cx = 0, cy = 540, R = 240;
    let j = 0;
    lanes.forEach((_, i) => {
      const turn = /turn|hand|mix|fold/.test(nm(i));
      if (turn) { spots[i] = disc(cx, cy + 160, 68, 68, { turn: true }); return; }
      const side = j % 2 === 0 ? -1 : 1; j++;
      spots[i] = disc(cx + side * 74, cy - 4 + (j > 2 ? 36 : 0), 60, 60, { side });
    });
    const dirs = [{ x: -0.42, y: -0.91 }, { x: 0.42, y: -0.91 }];
    const pound = lanes.map((_, i) => i).filter((i) => !spots[i].turn);
    const tipOf = (k) => { const i = pound.find((q) => spots[q].side === (k === 0 ? -1 : 1)); return i == null ? pound[0] : i; };
    plr = {
      tool: 'pestle', twin: true, hands: 2, pestleDir: (k) => dirs[k], wood: S.wood, pestleW: 30, skin: null, shirt: '#b8422a', shirt2: '#2a6a8a', trim: '#f0d060', headwear: 'wrap', hat: '#e8b030', sleeve: 'short',
      lenOf: (G) => 450 * G.F.scale, gripOf: (G) => 250 * G.F.scale, personW: (G) => 150 * G.F.scale, lift: 60,
      shoulderPos: (G) => [0, 1].map((k) => { const sp = spots[tipOf(k)], d = dirs[k], len = 450 * G.F.scale; return { x: sp.x + d.x * len * 0.9 + (k ? 70 : -70) * G.F.scale, y: sp.y + d.y * len * 0.86 }; }),
      aim: (i, sp) => (sp.turn ? [] : [{ h: sp.side < 0 ? 0 : 1, x: sp.x, y: sp.y }]),
      restOf: (k) => { const sp = spots[tipOf(k)]; return { x: sp.x, y: sp.y, raise: 0.8 }; },
    };
    drawScene = (ctx, rt) => {
      const wood = S.wood;
      ctx.fillStyle = 'rgba(0,0,0,0.38)'; ell(ctx, 10, cy + 40, R + 90, R * 0.9); ctx.fill();
      ring(ctx, cx, cy, R * 0.8, R + 40, wood, 4);
      ctx.fillStyle = rgrad(ctx, cx, cy, 10, R * 0.82, [[0, '#1c0e06'], [0.8, '#3a2210'], [1, darker(wood, 0.4)]]); circ(ctx, cx, cy, R * 0.82); ctx.fill();
      const hit = lanes.reduce((m, _, i) => Math.max(m, rt.flash[i]), 0);
      // the dough: a soft white mound that squashes when pounded, with a faint steam
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, cx + 8, cy + 14, R * 0.6, R * 0.52); ctx.fill();
      ctx.fillStyle = rgrad(ctx, cx, cy, 6, R * 0.62, [[0, '#fffaf0'], [0.7, '#efe2c4'], [1, '#c9b48a']], cx - 24, cy - 34); ell(ctx, cx, cy, R * 0.6 * (1 + 0.08 * hit), R * 0.55 * (1 - 0.12 * hit)); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 3;
      for (let k = 0; k < 3; k++) { const x = cx - 60 + k * 60, ph = rt.anim * 0.5 + k * 0.37; ctx.beginPath(); for (let q = 0; q < 6; q++) { const t = (ph + q * 0.12) % 1; ctx.lineTo(x + Math.sin(t * 9 + k) * 12, cy - 30 - t * 130); } ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1; }
      paintZones(ctx, rt);
      lanes.forEach((l, i) => { const sp = spots[i], f = rt.flash[i]; if (sp.turn) hand(ctx, sp.v, sp.u - 10 * f, 100, Math.sin(rt.anim * 3) * 0.3 * f, 0.85 + 0.15 * f, '#d8956a'); });
    };
  }

  function sceneTabla() {
    // dayan (right, small, wooden) and bayan (left, big, metal): side by side on a wide screen, on a diagonal on a tall one
    const D = tall ? { cx: 128, cy: 245, R: 178 } : { cx: 250, cy: 290, R: 190 }, B = tall ? { cx: -112, cy: 560, R: 214 } : { cx: -250, cy: 310, R: 230 };
    ref = tall ? { w: 700, h: 940 } : { w: 960, h: 700 };
    dress = { kind: 'planks', base: '#4a2c1c', rugKind: 'diamond', rugBase: '#7a1f2a', rugA: '#e3b778', rugB: '#2a1a40', light: '#ffd0a0' };
    const zone = { na: annulus(D.cx, D.cy, D.R * 0.78, D.R * 1.0, 1, -0.6), ti: annulus(D.cx, D.cy, D.R * 0.4, D.R * 0.78, 1, 2.3), tin: disc(D.cx, D.cy, D.R * 0.4),
      ge: disc(B.cx + 40, B.cy, B.R * 0.3), ka: annulus(B.cx, B.cy, B.R * 0.52, B.R * 1.0, 1, 2.6) };
    const alias = (n) => {
      if (/^(dha|dhaa)$/.test(n)) return ['na', 'ge'];
      if (/^(dhin|dhi|din)$/.test(n)) return ['tin', 'ge'];
      if (/^(na|ta|naa)$/.test(n)) return ['na'];
      if (/^(tin|tun|tu)$/.test(n)) return ['tin'];
      if (/^(ti|te|tet|ta?r?a?)$/.test(n)) return ['ti'];
      if (/^(ge|ga|ghe|gha)$/.test(n)) return ['ge'];
      if (/^(ka|ke|kat|kha)$/.test(n)) return ['ka'];
      return null;
    };
    const free = ['tin', 'na', 'ti', 'ge', 'ka'];
    const both = [];
    lanes.forEach((l, i) => {
      const a = alias(nm(i));
      if (!a) { const z = free.shift() ?? 'tin'; spots[i] = { ...zone[z], zoneKey: z, links: [z] }; return; }
      if (a.length === 1) spots[i] = { ...zone[a[0]], zoneKey: a[0], links: a };
      else both.push({ i, a });
    });
    both.forEach(({ i, a }, k) => {
      const x = tall ? (k - (both.length - 1) / 2) * 200 : (k - (both.length - 1) / 2) * 190, y = tall ? 850 : 610;
      spots[i] = { ...disc(x, y, 80, 46), links: a, combo: true };
    });
    const left = (z) => z === 'ge' || z === 'ka';
    plr = {
      tool: 'palm', shirt: '#e8e0cc', trim: '#c8a050', headwear: 'cap', hat: '#f4f0e4', sleeve: 'long', hands: 2, reach: 0.58,
      aim: (i, sp, G) => {
        const links = sp.links ?? ['tin'];
        if (!sp.combo) { const l = left(links[0]); return [{ h: l ? 0 : 1, x: sp.x, y: sp.y }]; }
        return links.map((z) => { const zz = zone[z], p = G.F.map(zz.v, zz.u); return { h: left(z) ? 0 : 1, x: p[0], y: p[1] }; });
      },
      restOf: (k, sps, G) => { const z = k === 0 ? zone.ge : zone.tin, p = G.F.map(z.v, z.u); return { x: p[0], y: p[1], raise: 0.3 }; },
    };
    drawScene = (ctx, rt) => {
      ctx.fillStyle = 'rgba(0,0,0,0.36)'; ell(ctx, (B.cx + D.cx) / 2, Math.max(B.cy + B.R, D.cy + D.R) + 30, 440, 30); ctx.fill();
      // a padded cloth ring under each drum (the chutta)
      const chutta = (cx, cy, R, col) => {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, cx + 12, cy + 18, R + 36); ctx.fill();
        ctx.fillStyle = rgrad(ctx, cx, cy, R * 0.7, R + 38, [[0, lighter(col, 0.2)], [0.6, col], [1, darker(col, 0.5)]], cx - R * 0.3, cy - R * 0.35); circ(ctx, cx, cy, R + 36); ctx.fill();
        ctx.strokeStyle = rgba(lighter(col, 0.5), 0.5); ctx.lineWidth = 2; circ(ctx, cx, cy, R + 24); ctx.stroke();
        ctx.strokeStyle = rgba('#e3b778', 0.55); ctx.lineWidth = 3; ctx.setLineDash([10, 8]); circ(ctx, cx, cy, R + 14); ctx.stroke(); ctx.setLineDash([]);
      };
      chutta(B.cx, B.cy, B.R, '#8a1f2a'); chutta(D.cx, D.cy, D.R, '#2a4a7a');
      // body and braided edge (gajra) with leather straps going down to the tuning blocks
      const body = (cx, cy, R, metal, braidCol) => {
        ctx.fillStyle = 'rgba(0,0,0,0.34)'; circ(ctx, cx + 8, cy + 12, R + 18); ctx.fill();
        ctx.fillStyle = rgrad(ctx, cx, cy, R * 0.7, R + 18, metal, cx - R * 0.3, cy - R * 0.35); circ(ctx, cx, cy, R + 16); ctx.fill();
        for (let a = 0; a < 40; a++) { const t = (a / 40) * TAU, x = cx + Math.cos(t) * R * 0.9, y = cy + Math.sin(t) * R * 0.9; ctx.save(); ctx.translate(x, y); ctx.rotate(t + 0.7); ctx.fillStyle = rgrad(ctx, 0, 0, 0, 12, [[0, lighter(braidCol, 0.5)], [1, darker(braidCol, 0.55)]]); ell(ctx, 0, 0, 12, 6.5); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore(); }
        ctx.strokeStyle = '#24100a'; ctx.lineWidth = 7; ctx.lineCap = 'round';
        for (let a = 0; a < 16; a++) { const t = (a / 16) * TAU; ctx.beginPath(); ctx.moveTo(cx + Math.cos(t) * R * 0.97, cy + Math.sin(t) * R * 0.97); ctx.lineTo(cx + Math.cos(t + 0.2) * R * 0.7, cy + Math.sin(t + 0.2) * R * 0.7); ctx.stroke(); }
      };
      body(B.cx, B.cy, B.R, [[0, '#f0b070'], [0.55, '#b8682c'], [1, '#5a2c0c']], '#3a1e10');
      ctx.fillStyle = rgrad(ctx, B.cx, B.cy, 6, B.R * 0.78, [[0, '#fff6df'], [0.7, '#e9d3a3'], [1, '#b99c68']], B.cx - 40, B.cy - 50); circ(ctx, B.cx, B.cy, B.R * 0.78); ctx.fill();
      hide(ctx, B.cx, B.cy, B.R * 0.78, B.R * 0.78, 21);
      ctx.fillStyle = rgrad(ctx, B.cx + 40, B.cy, 4, B.R * 0.3, [[0, '#55555e'], [0.5, '#101014'], [1, '#000']], B.cx + 30, B.cy - 14); circ(ctx, B.cx + 40, B.cy, B.R * 0.3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ell(ctx, B.cx + 28, B.cy - B.R * 0.12, B.R * 0.12, B.R * 0.05); ctx.fill();
      body(D.cx, D.cy, D.R, [[0, '#a8683a'], [0.6, '#6a3a18'], [1, '#2a1408']], '#e8d8b0');
      ctx.fillStyle = rgrad(ctx, D.cx, D.cy, 6, D.R * 0.84, [[0, '#fff6df'], [0.7, '#e9d3a3'], [1, '#b99c68']], D.cx - 30, D.cy - 40); circ(ctx, D.cx, D.cy, D.R * 0.84); ctx.fill();
      hide(ctx, D.cx, D.cy, D.R * 0.84, D.R * 0.84, 31);
      ctx.fillStyle = rgrad(ctx, D.cx, D.cy, 4, D.R * 0.4, [[0, '#55555e'], [0.5, '#101014'], [1, '#000']], D.cx - 14, D.cy - 18); circ(ctx, D.cx, D.cy, D.R * 0.4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ell(ctx, D.cx - D.R * 0.1, D.cy - D.R * 0.2, D.R * 0.14, D.R * 0.06); ctx.fill();
      // combined strokes: thin cords from the pad to both drums
      lanes.forEach((l, i) => {
        const sp = spots[i];
        if (!sp.combo) return;
        for (const z of sp.links) { const t = zone[z]; ctx.strokeStyle = rgba(l.color, 0.5 + 0.4 * rt.flash[i]); ctx.lineWidth = 4; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(sp.v, sp.u - 30); ctx.quadraticCurveTo((sp.v + t.v) / 2, Math.min(sp.u, t.u) + 40, t.v, t.u); ctx.stroke(); ctx.setLineDash([]); }
      });
      lanes.forEach((l, i) => {
        const sp = spots[i], f = rt.flash[i];
        if (sp.combo) {
          ctx.fillStyle = 'rgba(0,0,0,0.4)'; ell(ctx, sp.v + 3, sp.u + 6, 84, 50); ctx.fill();
          ctx.fillStyle = rgrad(ctx, sp.v, sp.u, 4, 86, [[0, '#4a3a2c'], [1, '#1a110a']], sp.v - 20, sp.u - 18); ell(ctx, sp.v, sp.u, 82, 48); ctx.fill(); ctx.strokeStyle = rgba(l.color, 0.9); ctx.lineWidth = 3; ctx.stroke();
        }
        zoneStyle(ctx, sp, l.color, f, rt); ripple(ctx, sp, l.color, f);
        for (const z of sp.links ?? []) if (sp.combo && f > 0.04) ripple(ctx, zone[z], l.color, f);
      });
    };
  }


  // rubboard (frottoir): the ridged steel vest of zydeco, played with two spoons or bottle openers (no face: the player stands behind it)
  function sceneRub() {
    dress = { kind: 'planks', base: '#3e2616', rugKind: 'zigzag', rugBase: '#2a1620', rugA: '#e8a030', rugB: '#2a8a5a', light: '#ffd49a', rugPad: 0.02 };
    const rbox = (cx, cy, hw, hh, o = {}) => ({ v: cx, u: cy, r: Math.min(hw, hh), ar: Math.min(hw, hh) * 0.9, rect: true, hw, hh, dist: (lv, lu) => Math.max(Math.abs(lv - cx) / hw, Math.abs(lu - cy) / hh), path: (c) => rrect(c, cx - hw, cy - hh, hw * 2, hh * 2, Math.min(hw, hh) * 0.28), ...o });
    const kindOf = (i) => (/up/.test(nm(i)) ? 'up' : /tick|click|tap|dig|rim|beat|pop|clack/.test(nm(i)) ? 'tick' : 'down');
    const scr = lanes.map((_, i) => i).filter((i) => kindOf(i) !== 'tick').sort((a, b) => (kindOf(a) === 'up') - (kindOf(b) === 'up'));
    const tix = lanes.map((_, i) => i).filter((i) => kindOf(i) === 'tick');
    const colW = 340 / Math.max(1, scr.length), wideBoard = !tall;
    // zones are laid out in the board's own frame (lx across, ly from the neck to the hem); on a wide screen the board lies on its side, neck to the left
    const Z = (lx0, lx1, ly0, ly1, o) => (wideBoard ? rbox((ly0 + ly1) / 2 - 430, 270 + (lx0 + lx1) / 2, (ly1 - ly0) / 2, (lx1 - lx0) / 2, { ...o, horiz: true }) : rbox((lx0 + lx1) / 2, (ly0 + ly1) / 2, (lx1 - lx0) / 2, (ly1 - ly0) / 2, o));
    ref = wideBoard ? { w: 940, h: 540 } : { w: 700, h: 900 };
    scr.forEach((i, k) => { spots[i] = Z(-170 + colW * k + 8, -170 + colW * (k + 1) - 8, 170, tix.length ? 630 : 690, { dir: kindOf(i) === 'up' ? -1 : 1 }); });
    tix.forEach((i, k) => { const w = 340 / tix.length; spots[i] = Z(-170 + w * k + 8, -170 + w * (k + 1) - 8, 682, 766, { dir: 0 }); });
    plr = { tool: 'spoon', toolLen: 118, toolW: 8, headR: 1.55, wood: '#c8ccd4', head: '#d6dae2', shirt: '#7a2a22', trim: '#e8c060', sleeve: 'long', cuff: true, hands: 2, noHead: true, reach: 0.6, side: tall ? 'top' : 'left', sit: tall ? 0 : 0.12, shoulder: tall ? 0.8 : 0.9, slim: tall ? 1 : 0.5 };
    const vest = (c) => {
      c.beginPath(); c.moveTo(-170, 34); c.lineTo(-64, 34); c.quadraticCurveTo(0, 190, 64, 34); c.lineTo(170, 34);
      c.bezierCurveTo(175, 140, 130, 232, 208, 346); c.lineTo(204, 782); c.quadraticCurveTo(204, 826, 160, 826); c.lineTo(-160, 826); c.quadraticCurveTo(-204, 826, -204, 782); c.lineTo(-208, 346);
      c.bezierCurveTo(-130, 232, -175, 140, -170, 34); c.closePath();
    };
    drawScene = (ctx, rt) => {
      // shadow and the steel body with its ridges
      ctx.save();
      if (wideBoard) ctx.transform(0, 1, 1, 0, -430, 270);
      ctx.save(); ctx.translate(14, 20); vest(ctx); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill(); ctx.restore();
      vest(ctx); ctx.fillStyle = hgrad(ctx, -210, 210, [[0, '#6a7080'], [0.18, '#c4cad6'], [0.42, '#f2f5fa'], [0.62, '#aeb5c4'], [0.85, '#d4d9e4'], [1, '#585e6e']]); ctx.fill();
      ctx.save(); vest(ctx); ctx.clip();
      for (let y = 30; y < 830; y += 11) {
        ctx.strokeStyle = 'rgba(40,48,66,0.55)'; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(-215, y); ctx.lineTo(215, y); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-215, y + 4.5); ctx.lineTo(215, y + 4.5); ctx.stroke();
      }
      // roundness (the board curves around the body): shade the edges, light the middle, a soft diagonal glint, wear marks where spoons rub
      ctx.fillStyle = hgrad(ctx, -210, 210, [[0, 'rgba(10,14,28,0.62)'], [0.2, 'rgba(10,14,28,0.05)'], [0.5, 'rgba(255,255,255,0.12)'], [0.8, 'rgba(10,14,28,0.08)'], [1, 'rgba(10,14,28,0.6)']]); ctx.fillRect(-215, 20, 430, 820);
      ctx.fillStyle = vgrad(ctx, 30, 830, [[0, 'rgba(255,255,255,0.22)'], [0.4, 'rgba(255,255,255,0)'], [1, 'rgba(10,14,28,0.32)']]); ctx.fillRect(-215, 20, 430, 820);
      ctx.save(); ctx.rotate(-0.5); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(-60, 100, 38, 900); ctx.fillRect(10, 100, 12, 900); ctx.restore();
      ctx.fillStyle = 'rgba(70,60,50,0.1)'; for (let k = 0; k < 40; k++) { const x = -190 + hash(k) * 380, y = 260 + hash(k + 9) * 480; ell(ctx, x, y, 10 + hash(k + 3) * 24, 2 + hash(k + 5) * 4); ctx.fill(); }
      ctx.restore();
      // folded steel edge and rivets at the shoulders, hem and sides
      vest(ctx); ctx.strokeStyle = 'rgba(20,24,36,0.85)'; ctx.lineWidth = 12; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.strokeStyle = 'rgba(230,236,246,0.9)'; ctx.lineWidth = 4; ctx.save(); ctx.translate(-1.5, -1.5); ctx.stroke(); ctx.restore();
      for (const [x, y] of [[-150, 60], [150, 60], [-190, 330], [190, 330], [-186, 790], [186, 790], [-80, 806], [0, 806], [80, 806]]) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, x + 1.5, y + 2.5, 6); ctx.fill(); ctx.fillStyle = rgrad(ctx, x, y, 0, 7, [[0, '#ffffff'], [0.6, '#aeb4c2'], [1, '#4a5060']], x - 2, y - 2); circ(ctx, x, y, 6); ctx.fill(); }
      ctx.restore();
      lanes.forEach((l, i) => {
        const sp = spots[i], f = rt.flash[i];
        sp.path(ctx); ctx.fillStyle = rgba(l.color, 0.2); ctx.fill();
        zoneStyle(ctx, sp, l.color, f, rt);
        // the stroke made visible: chevrons running the way the spoon travels (down, up) or beads for a tick
        ctx.save(); sp.path(ctx); ctx.clip();
        if (sp.dir && sp.horiz) {
          const n = Math.max(3, Math.floor(sp.hw / 52)), ph = (rt.anim * 0.7) % 1;
          for (let k = -1; k <= n; k++) {
            const q = (k + ph) / n, xx = sp.dir > 0 ? sp.v - sp.hw + q * sp.hw * 2 : sp.v + sp.hw - q * sp.hw * 2;
            ctx.strokeStyle = rgba(lighter(l.color, 0.4), 0.38 + 0.5 * f); ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.beginPath(); ctx.moveTo(xx - sp.dir * 10, sp.u - 22); ctx.lineTo(xx + sp.dir * 10, sp.u); ctx.lineTo(xx - sp.dir * 10, sp.u + 22); ctx.stroke();
          }
          if (f > 0.04) { const p = 1 - f, xx = sp.dir > 0 ? sp.v - sp.hw + p * sp.hw * 2 : sp.v + sp.hw - p * sp.hw * 2; ctx.fillStyle = hgrad(ctx, xx - 60, xx + 60, [[0, 'rgba(255,255,255,0)'], [0.5, rgba('#ffffff', 0.7 * f)], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(xx - 60, sp.u - sp.hh, 120, sp.hh * 2); }
        } else if (sp.dir) {
          const n = Math.max(3, Math.floor(sp.hh / 52)), ph = (rt.anim * 0.7) % 1;
          for (let k = -1; k <= n; k++) {
            const q = (k + ph) / n, y = sp.u + sp.dir * (-sp.hh + q * sp.hh * 2) * (sp.dir > 0 ? 1 : -1) * -1;
            const yy = sp.dir > 0 ? sp.u - sp.hh + q * sp.hh * 2 : sp.u + sp.hh - q * sp.hh * 2;
            void y;
            ctx.strokeStyle = rgba(lighter(l.color, 0.4), 0.38 + 0.5 * f); ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.beginPath(); ctx.moveTo(sp.v - 22, yy - sp.dir * 10); ctx.lineTo(sp.v, yy + sp.dir * 10); ctx.lineTo(sp.v + 22, yy - sp.dir * 10); ctx.stroke();
          }
          if (f > 0.04) { // a bright sweep along the zone as the spoon travels over the ridges
            const p = 1 - f, yy = sp.dir > 0 ? sp.u - sp.hh + p * sp.hh * 2 : sp.u + sp.hh - p * sp.hh * 2;
            ctx.fillStyle = vgrad(ctx, yy - 60, yy + 60, [[0, 'rgba(255,255,255,0)'], [0.5, rgba('#ffffff', 0.7 * f)], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(sp.v - sp.hw, yy - 60, sp.hw * 2, 120);
          }
        } else {
          for (let k = 0; k < 7; k++) { ctx.fillStyle = rgba(lighter(l.color, 0.5), 0.3 + 0.6 * f); circ(ctx, sp.v - sp.hw + 22 + k * (sp.hw * 2 - 44) / 6, sp.u, 4); ctx.fill(); }
        }
        ctx.restore();
        ripple(ctx, sp, l.color, f, 1);
      });
    };
  }

  function sceneMulti() {
    const cols = N <= 3 ? N : N === 4 ? 2 : Math.min(4, Math.ceil(N / 2)), rows = Math.ceil(N / cols);
    const cell = 250;
    ref = { w: cols * cell + 40, h: rows * cell + 60 };
    dress = { kind: 'planks', base: '#4a3220', light: '#ffd9a0' };
    plr = null;
    lanes.forEach((_, i) => {
      const c = i % cols, r = Math.floor(i / cols), inRow = r === rows - 1 ? N - r * cols : cols;
      const x = (c - (inRow - 1) / 2) * cell, y = 40 + cell / 2 + r * cell;
      spots[i] = disc(x, y, cell * 0.42, cell * 0.42);
    });
    drawScene = (ctx, rt) => {
      lanes.forEach((l, i) => {
        const sp = spots[i], f = rt.flash[i];
        ring(ctx, sp.v, sp.u, sp.r * 0.8, sp.r * 1.1, S.wood, i + 2);
        ctx.fillStyle = SKIN_G(ctx, sp.v, sp.u, sp.r, sp.r); circ(ctx, sp.v, sp.u, sp.r * 0.84); ctx.fill();
        hide(ctx, sp.v, sp.u, sp.r * 0.84, sp.r * 0.84, i * 7 + 1, f);
        ctx.strokeStyle = rgba(l.color, 0.9); ctx.lineWidth = 5; circ(ctx, sp.v, sp.u, sp.r * 0.55); ctx.stroke();
        ripple(ctx, sp, l.color, f);
        if (f > 0.04) hand(ctx, sp.v + (i % 2 ? 20 : -20), sp.u - 36 * (1 - f), sp.r * 0.8, i % 2 ? 0.3 : -0.3, f * 1.6);
      });
    };
  }

  const BUILD = { djembe: sceneDjembe, taiko: sceneTaiko, bodhran: sceneBodhran, isukuti: sceneIsukuti, water: sceneWater, steelpan: scenePan, mortar: sceneMortar, tabla: sceneTabla, rubboard: sceneRub, multi: sceneMulti };
  const build = () => {
    for (let i = 0; i < N; i++) spots[i] = null;
    (BUILD[id] ?? sceneMulti)();
    for (let i = 0; i < N; i++) if (!spots[i]) spots[i] = disc(0, ref.h * (0.2 + 0.05 * i), 40);
    if (id === 'steelpan') st.voice = 'pan';
    player = plr ? createPlayer({ key: `${P.instrument ?? ''}${id}`, ...plr }) : null;
  };
  build();

  st.layout = (area) => {
    const nt = area.h > area.w * 1.05;
    if ((nt !== tall || !built) && (id === 'tabla' || id === 'isukuti' || id === 'rubboard')) { tall = nt; built = true; build(); } else { tall = nt; built = true; }
    st.F = makeBox(area, ref.w, ref.h, { top: 40, bottom: 10, side: 12, ...(VIEW[id] ?? {}) });
    finishSpots(st.F, spots);
  };
  st.hit = (x, y) => (st.F ? hitSpots(st.F, spots, x, y) : -1);
  st.anchor = (i) => ({ x: spots[i]?.x ?? 0, y: spots[i]?.y ?? 0 });
  st.voiceOf = (i) => (id === 'steelpan' && lanes[i].timName !== 'bass' ? 'pan' : id === 'rubboard' ? 'scrape' : null);

  st.draw = (g, rt) => {
    const { ctx } = g, F = st.F;
    if (!F) return;
    setting(ctx, F, dress.kind, S, rt, dress);
    if (player) { player.update(F, rt, spots, lanes); player.back(ctx, F, rt); }
    ctx.save(); F.apply(ctx);
    drawScene(ctx, rt);
    ctx.restore();
    if (player) player.front(ctx, F, rt, spots);
    ctx.save(); F.apply(ctx);
    // approach rings for every upcoming stroke
    for (let k = rt.list.length - 1; k >= 0; k--) {
      const t = rt.list[k];
      if (t.state && t.state !== 'pending' && t.state !== 'miss') continue;
      const tau = (t.t - rt.clock) / rt.look;
      if (tau > 1.0 || tau < -0.25) continue;
      const miss = t.state === 'miss', a = (rt.soft ? 0.5 : 1) * (miss ? 0.35 : 1) * clamp((1.05 - tau) * 8, 0, 1) * clamp((tau + 0.25) * 6, 0, 1);
      const col = miss ? mix(lanes[t.lane].color, '#555555', 0.6) : lanes[t.lane].color, sp = spots[t.lane];
      approach(ctx, sp, col, tau, a, sp.sqz ?? 1);
    }
    ctx.restore();
    const size = g.px(16);
    lanes.forEach((l, i) => { const sp = spots[i], [x, y] = F.map(sp.v, sp.u); pill(ctx, l.name, x, y, Math.max(70, sp.r * F.scale * 2.2), size, l.color, rt.flash[i]); });
  };
  return st;
}

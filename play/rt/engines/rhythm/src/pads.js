// Drums as the play surface: the real drum (or pair, or set) is drawn large and each lane is a zone of its head or body.
// Cues are approach rings closing on the zone, ripples spread on the skin when it is struck, and hands or sticks come down on it.
import { clamp, mix, rgba, lighter, darker, glow, rrect, grain, hgrad, vgrad, rgrad, hash, ell, circ, TAU, drumHead } from './art.js';
import { makeBox, finishSpots, hitSpots, pill, lerp } from './stagekit.js';

const VIEW = { bodhran: { zoom: 0.96 }, steelpan: { dx: 0.0, dy: 0.1, zoom: 1.0 }, water: { dx: 0.1, dy: 0.2, zoom: 0.9, tilt: 0.2 }, isukuti: { tilt: 0.2, dy: 0.18 }, tabla: { tilt: 0.12 }, taiko: { dx: 0.08, zoom: 0.95 }, djembe: { dx: -0.1, zoom: 0.95 }, mortar: { tilt: -0.15, dy: 0.1 }, multi: {} };
const IDS = [
  [/tabla|dayan|bayan/, 'tabla'], [/taiko/, 'taiko'], [/bodhr|frame drum|daf\b|riq\b/, 'bodhran'], [/isukuti/, 'isukuti'],
  [/calabash|water drum|water/, 'water'], [/steel.?pan|pan\b/, 'steelpan'], [/fufu|mortar|pound/, 'mortar'], [/djembe|dunun|conga|cajon|candombe/, 'djembe'],
];
export function padId(key) { const k = String(key || '').toLowerCase(); for (const [re, id] of IDS) if (re.test(k)) return id; return 'multi'; }

const disc = (cx, cy, rx, ry = rx, o = {}) => ({ v: cx, u: cy, r: Math.min(rx, ry), ar: Math.min(rx, ry) * 0.85, dist: (lv, lu) => Math.hypot((lv - cx) / rx, (lu - cy) / ry), path: (c) => { c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU); }, ...o });
const annulus = (cx, cy, r0, r1, sq = 1, ang = 0.6, o = {}) => {
  const rm = (r0 + r1) / 2, hw = (r1 - r0) / 2;
  return { v: cx + Math.cos(ang) * rm, u: cy + Math.sin(ang) * rm * sq, r: hw, ar: Math.min(hw, 70) * 0.95,
    dist: (lv, lu) => { const d = Math.hypot(lv - cx, (lu - cy) / sq); if (d < r0) return 1 + ((r0 - d) / hw) * 2; if (d > r1) return 1 + ((d - r1) / hw) * 2; return (Math.abs(d - rm) / hw) * 0.9; },
    path: (c) => { c.beginPath(); c.ellipse(cx, cy, r1, r1 * sq, 0, 0, TAU); c.ellipse(cx, cy, Math.max(0.1, r0), Math.max(0.1, r0 * sq), 0, 0, TAU, true); }, evenodd: true, ...o };
};

const SKIN_G = (c, cx, cy, rx, ry) => rgrad(c, cx, cy, 0, Math.max(rx, ry) * 1.1, [[0, '#fff9e8'], [0.6, '#eddcb4'], [1, '#c4a679']], cx - rx * 0.25, cy - ry * 0.3);

// a simple hand: palm, four fingers fanned, thumb; (x,y) = palm centre, s = size, rot in radians, lifted away by `lift`
export function hand(ctx, x, y, s, rot, a = 1, col = '#e0a678') {
  if (a <= 0.02) return;
  ctx.save(); ctx.globalAlpha = clamp(a, 0, 1); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ell(ctx, 6, 9, s * 0.52, s * 0.62); ctx.fill();
  const body = rgrad(ctx, 0, 0, 0, s * 0.8, [[0, lighter(col, 0.35)], [0.7, col], [1, darker(col, 0.35)]], -s * 0.15, -s * 0.2);
  ctx.fillStyle = body; ell(ctx, 0, 0, s * 0.46, s * 0.52); ctx.fill();
  for (let k = 0; k < 4; k++) { const a2 = (k - 1.5) * 0.26, len = s * (0.62 - 0.07 * Math.abs(k - 1.5)); ctx.save(); ctx.rotate(a2); rrect(ctx, -s * 0.085, -s * 0.28 - len, s * 0.17, len, s * 0.085); ctx.fillStyle = body; ctx.fill(); ctx.restore(); }
  ctx.save(); ctx.rotate(-1.05); rrect(ctx, -s * 0.09, -s * 0.5, s * 0.18, s * 0.42, s * 0.09); ctx.fillStyle = body; ctx.fill(); ctx.restore();
  ctx.restore();
}
export function stick(ctx, x, y, ang, len, w, wood = '#e6c58e', head = '#c9955a', a = 1) {
  if (a <= 0.02) return;
  ctx.save(); ctx.globalAlpha = clamp(a, 0, 1); ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, 5, 6, w, len, w / 2); ctx.fill();
  ctx.fillStyle = hgrad(ctx, 0, w, [[0, lighter(wood, 0.3)], [0.5, wood], [1, darker(wood, 0.4)]]); rrect(ctx, 0, 0, w, len, w / 2); ctx.fill();
  ctx.fillStyle = rgrad(ctx, w / 2, 0, 0, w * 1.1, [[0, lighter(head, 0.4)], [1, darker(head, 0.3)]], w * 0.35, -w * 0.2); circ(ctx, w / 2, 0, w * 0.95); ctx.fill();
  ctx.restore();
}

export function createPadStage(id, S, lanes, P) {
  const N = lanes.length;
  const st = { id, kind: 'pads', spots: new Array(N).fill(null), voice: 'drum', F: null };
  const spots = st.spots;
  const order = lanes.map((_, i) => i).sort((a, b) => lanes[a].hz - lanes[b].hz);   // low to high
  const nm = (i) => lanes[i].name.toLowerCase();
  let ref = { w: 640, h: 760 }, drawScene = () => {};

  // ---- scenes ---------------------------------------------------------------------------------------------------------------------
  const zoneStyle = (ctx, sp, col, f, rt) => {
    sp.path(ctx);
    ctx.fillStyle = rgba(col, 0.1 + 0.5 * f); ctx.fill(sp.evenodd ? 'evenodd' : 'nonzero');
    ctx.strokeStyle = rgba(lighter(col, 0.45), 0.55 + 0.45 * f); ctx.lineWidth = 3 + 2 * f; ctx.setLineDash(f > 0.05 ? [] : [9, 7]); ctx.stroke(); ctx.setLineDash([]);
    void rt;
  };
  const ripple = (ctx, sp, col, f, sq = 1) => {
    if (f <= 0.04) return;
    glow(ctx, sp.v, sp.u, sp.r * 2.4 + 40, col, 0.5 * f);
    for (let k = 0; k < 2; k++) { const p = clamp((1 - f) * 1.2 - k * 0.18, 0, 1); if (p <= 0) continue; ctx.strokeStyle = rgba('#ffffff', 0.55 * (1 - p)); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(sp.v, sp.u, sp.r * (0.6 + 1.3 * p), sp.r * (0.6 + 1.3 * p) * sq, 0, 0, TAU); ctx.stroke(); }
  };
  const approach = (ctx, sp, col, tau, a, sq = 1) => {
    const R = sp.ar * (1 + 1.1 * clamp(tau, 0, 1.1));
    ctx.save(); ctx.globalAlpha = a;
    ctx.strokeStyle = rgba(lighter(col, 0.45), 0.95); ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(sp.v, sp.u, R, R * sq, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = rgba(col, 0.45); ctx.lineWidth = 9; ctx.stroke();
    const k = 1 - clamp(tau, 0, 1); glow(ctx, sp.v, sp.u, sp.ar * (1.5 + k), col, 0.2 + 0.45 * k);
    ctx.fillStyle = rgba(lighter(col, 0.55), 0.9); circ(ctx, sp.v, sp.u, 6 + 7 * k); ctx.fill();
    ctx.restore();
  };

  // drums built from named zones (djembe, taiko, bodhran, ...) all go through the same zone painter
  const paintZones = (ctx, rt, sq = 1) => {
    lanes.forEach((l, i) => { const sp = spots[i]; if (!sp) return; zoneStyle(ctx, sp, l.color, rt.flash[i], rt); ripple(ctx, sp, l.color, rt.flash[i], sq); });
  };

  function sceneDjembe() {
    ref = { w: 620, h: 900 };
    const cx = 0, cy = 270, rx = 232, ry = 126;
    const k = order.length;
    // zones from the centre outward by pitch: lowest at the centre, highest at the edge
    order.forEach((lane, rank) => {
      const r0 = (rank / k) * rx * 0.97, r1 = ((rank + 1) / k) * rx * 0.97;
      spots[lane] = rank === 0 ? disc(cx, cy, r1, r1 * (ry / rx)) : annulus(cx, cy, r0, r1, ry / rx, rank % 2 ? 0.7 : 2.4);
    });
    drawScene = (ctx, rt) => {
      // shadow on the floor, goblet body, carved band, lacing, hoop and skin
      ctx.fillStyle = 'rgba(0,0,0,0.38)'; ell(ctx, 12, 862, 190, 30); ctx.fill();
      const wood = S.wood;
      ctx.beginPath(); ctx.moveTo(-rx, cy); ctx.bezierCurveTo(-rx, cy + 170, -120, 450, -92, 600); ctx.bezierCurveTo(-84, 660, -150, 720, -160, 850); ctx.quadraticCurveTo(0, 900, 160, 850); ctx.bezierCurveTo(150, 720, 84, 660, 92, 600); ctx.bezierCurveTo(120, 450, rx, cy + 170, rx, cy); ctx.closePath();
      ctx.fillStyle = hgrad(ctx, -rx, rx, [[0, darker(wood, 0.6)], [0.25, lighter(wood, 0.3)], [0.55, wood], [0.85, darker(wood, 0.45)], [1, darker(wood, 0.7)]]); ctx.fill();
      ctx.save(); ctx.clip(); grain(ctx, -rx, cy, rx * 2, 640, darker(wood, 0.75), 0.4, 17, true, 22);
      ctx.strokeStyle = 'rgba(255,225,170,0.35)'; ctx.lineWidth = 3;
      for (let b = 0; b < 3; b++) { ctx.beginPath(); for (let x = -150; x <= 150; x += 25) { const y = 700 + b * 34 + (Math.round(x / 25) % 2 ? 12 : -12); ctx.lineTo(x * (1 + b * 0.05), y); } ctx.stroke(); }
      ctx.restore();
      // rope lacing: V shapes from the hoop to the lower ring
      ctx.strokeStyle = '#e8d8b0'; ctx.lineWidth = 5; ctx.lineJoin = 'round';
      const ring = 430;
      ctx.beginPath(); for (let a = 0; a < 20; a++) { const t0 = a / 20, t1 = (a + 0.5) / 20, t2 = (a + 1) / 20; const x = (t) => Math.cos(Math.PI * t) * rx * 0.97 * -1; ctx.moveTo(x(t0 / 1) , cy + Math.sin(Math.PI * t0) * ry * 0.85 * 0 + 14); ctx.lineTo(x(t1) * 0.78, ring); ctx.lineTo(x(t2), cy + 14); } ctx.stroke();
      ctx.strokeStyle = '#2a1608'; ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(0, ring, rx * 0.8, 38, 0, 0, Math.PI); ctx.stroke();
      // hoop and skin
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 6, cy + 12, rx + 12, ry + 12); ctx.fill();
      ctx.fillStyle = rgrad(ctx, 0, cy, rx * 0.6, rx + 10, [[0, '#9aa1ab'], [1, '#3a4048']]); ell(ctx, cx, cy, rx + 10, ry + 10); ctx.fill();
      ctx.fillStyle = SKIN_G(ctx, cx, cy, rx, ry); ell(ctx, cx, cy, rx - 4, ry - 4); ctx.fill();
      ctx.save(); ell(ctx, cx, cy, rx - 4, ry - 4); ctx.clip();
      ctx.strokeStyle = 'rgba(110,80,40,0.16)'; ctx.lineWidth = 1.5; for (let q = 0; q < 6; q++) { ctx.beginPath(); ctx.ellipse(cx + (hash(q) - 0.5) * 70, cy + (hash(q + 4) - 0.5) * 30, 30 + q * 28, 14 + q * 13, 0, hash(q) * 6, hash(q) * 6 + 2.4); ctx.stroke(); }
      ctx.restore();
      paintZones(ctx, rt, ry / rx);
      // hands come down on the struck zone, right and left alternately
      lanes.forEach((l, i) => { const f = rt.flash[i]; if (f > 0.05) hand(ctx, spots[i].v + (i % 2 ? 26 : -26), spots[i].u - 40 * (1 - f) - 6, 78, (i % 2 ? 0.22 : -0.22), f * 1.6); });
    };
  }

  function sceneTaiko() {
    ref = { w: 700, h: 780 };
    const cx = 0, cy = 340, R = 262;
    const k = order.length;
    order.forEach((lane, rank) => {
      const r0 = rank === 0 ? 0 : (rank / k) * R * 0.62 + (rank === 1 ? R * 0.1 : 0), r1 = rank === k - 1 ? R * 1.18 : ((rank + 1) / k) * R * 0.62 + R * 0.1;
      spots[lane] = rank === 0 ? disc(cx, cy, r1, r1) : annulus(cx, cy, r0, r1, 1, -0.6 + rank * 0.7);
    });
    drawScene = (ctx, rt) => {
      // stand
      ctx.fillStyle = 'rgba(0,0,0,0.36)'; ell(ctx, 10, 760, 270, 24); ctx.fill();
      for (const d of [-1, 1]) { ctx.save(); ctx.translate(d * 215, 640); ctx.rotate(d * -0.2); ctx.fillStyle = hgrad(ctx, -30, 30, [[0, '#2a1608'], [0.4, '#7a4a22'], [1, '#2a1608']]); rrect(ctx, -26, -140, 52, 270, 12); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = hgrad(ctx, -260, 260, [[0, '#3a1c0a'], [0.5, '#8a5a2a'], [1, '#3a1c0a']]); rrect(ctx, -270, 700, 540, 40, 14); ctx.fill();
      // shell
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; circ(ctx, cx + 10, cy + 14, R + 40); ctx.fill();
      ctx.fillStyle = rgrad(ctx, cx, cy, R * 0.7, R + 44, [[0, '#7a2a14'], [0.7, '#5a1c0c'], [1, '#2a0c06']], cx - 60, cy - 70); circ(ctx, cx, cy, R + 40); ctx.fill();
      ctx.strokeStyle = 'rgba(255,210,150,0.4)'; ctx.lineWidth = 3; ctx.stroke();
      // tacks
      ctx.fillStyle = '#e8c868';
      for (let a = 0; a < 30; a++) { const t = (a / 30) * TAU; ctx.fillStyle = rgrad(ctx, 0, 0, 0, 9, [[0, '#fff3c0'], [1, '#a8782a']]); const x = cx + Math.cos(t) * (R + 20), y = cy + Math.sin(t) * (R + 20); ctx.save(); ctx.translate(x, y); circ(ctx, 0, 0, 8.5); ctx.fill(); ctx.restore(); }
      // ox-hide head
      ctx.fillStyle = rgrad(ctx, cx, cy, 10, R + 6, [[0, '#fff6df'], [0.7, '#e9d3a3'], [1, '#b99c68']], cx - R * 0.25, cy - R * 0.3); circ(ctx, cx, cy, R); ctx.fill();
      ctx.strokeStyle = 'rgba(120,90,50,0.2)'; ctx.lineWidth = 2; for (let q = 1; q < 5; q++) { circ(ctx, cx, cy, R * q / 5.2); ctx.stroke(); }
      ctx.fillStyle = 'rgba(70,40,20,0.35)'; circ(ctx, cx, cy, R * 0.12); ctx.fill();
      paintZones(ctx, rt);
      lanes.forEach((l, i) => { const f = rt.flash[i]; if (f > 0.04) { const sp = spots[i], d = (i % 2 ? 1 : -1); stick(ctx, sp.v + d * 12, sp.u - 6 - 150 * (1 - f) * 0.8, d * -0.18, 300, 22, '#f0dcb0', '#d9ad6a', f * 1.7); } });
      // resting sticks
      for (const d of [-1, 1]) { stick(ctx, d * 330, 120, d * 0.12, 270, 20, '#f0dcb0', '#d9ad6a', 0.9); }
    };
  }

  function sceneBodhran() {
    ref = { w: 700, h: 760 };
    const cx = 0, cy = 360, R = 285;
    const rimLanes = lanes.map((_, i) => i).filter((i) => /rim|edge|wood|click|frame/.test(nm(i)));
    const inner = lanes.map((_, i) => i).filter((i) => !rimLanes.includes(i));
    rimLanes.forEach((i, k) => { spots[i] = annulus(cx, cy, R * 0.8, R * 1.1, 1, 0.8 + k * 1.5); });
    const place = { top: [0, -0.62], up: [0, -0.22], down: [0, 0.2], pressed: [-0.46, 0.3], press: [-0.46, 0.3], low: [0, 0.3], high: [0, -0.4] };
    const used = new Set();
    inner.forEach((i, k) => {
      let p = null;
      for (const key of Object.keys(place)) if (nm(i).includes(key) && !used.has(key)) { p = place[key]; used.add(key); break; }
      if (!p) { const a = -Math.PI / 2 + (k / Math.max(1, inner.length)) * TAU; p = [Math.cos(a) * 0.45, Math.sin(a) * 0.45]; }
      spots[i] = disc(cx + p[0] * R, cy + p[1] * R, R * 0.19, R * 0.19, { pressHand: /press/.test(nm(i)) });
    });
    drawScene = (ctx, rt) => {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; circ(ctx, cx + 10, cy + 16, R + 36); ctx.fill();
      // wooden frame with depth
      ctx.fillStyle = rgrad(ctx, cx, cy, R * 0.8, R + 36, [[0, '#a47845'], [0.6, '#7a5028'], [1, '#3a2410']], cx - 50, cy - 60); circ(ctx, cx, cy, R + 34); ctx.fill();
      grain(ctx, cx - R - 30, cy - R - 30, (R + 30) * 2, (R + 30) * 2, '#2a1608', 0.35, 3, false, 14);
      ctx.strokeStyle = 'rgba(255,225,170,0.4)'; ctx.lineWidth = 3; circ(ctx, cx, cy, R + 34); ctx.stroke();
      ctx.fillStyle = SKIN_G(ctx, cx, cy, R, R); circ(ctx, cx, cy, R * 0.99); ctx.fill();
      ctx.save(); circ(ctx, cx, cy, R * 0.99); ctx.clip();
      for (let k = 0; k < 40; k++) { circ(ctx, cx + (hash(k) - 0.5) * R * 1.8, cy + (hash(k + 8) - 0.5) * R * 1.8, 2 + hash(k + 3) * 6); ctx.fillStyle = 'rgba(120,80,40,0.1)'; ctx.fill(); }
      // the crossbar behind the skin, faintly visible
      ctx.strokeStyle = 'rgba(80,50,20,0.16)'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(cx - R, cy + R * 0.1); ctx.lineTo(cx + R, cy + R * 0.1); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = '#d8dce2'; ctx.lineWidth = 6; circ(ctx, cx, cy, R * 0.99); ctx.stroke();
      paintZones(ctx, rt);
      lanes.forEach((l, i) => {
        const sp = spots[i], f = rt.flash[i];
        if (sp.pressHand) hand(ctx, sp.v - 20, sp.u + 24, 96, -0.5, 0.65 + 0.35 * f, '#d8956a'); // the other hand supports and presses from behind
        else if (f > 0.04) stick(ctx, sp.v - 40, sp.u - 20 - 200 * (1 - f) * 0.5, -0.25, 330, 20, '#f0dcb0', '#c9955a', f * 1.7);
      });
    };
  }

  function sceneIsukuti() {
    ref = { w: 820, h: 700 };
    const wood = lanes.map((_, i) => i).filter((i) => /stick|wood|click|clap/.test(nm(i)));
    const heads = order.filter((i) => !wood.includes(i));   // big (low) to small (high), left to right
    const defs = [[-230, 250, 150, 70, 370], [30, 280, 125, 60, 330], [250, 310, 96, 46, 290]];
    heads.forEach((lane, k) => { const d = defs[Math.min(k, defs.length - 1)]; spots[lane] = disc(d[0], d[1], d[2] * 0.82, d[3] * 0.82, { drum: d }); });
    wood.forEach((i, k) => { spots[i] = disc(-60 + k * 220, 640, 100, 38, { block: true }); });
    drawScene = (ctx, rt) => {
      const woodC = S.wood;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, 0, 690, 380, 26); ctx.fill();
      // tall barrel drums, drawn back to front (smallest at the back-right)
      [...heads].map((lane, k) => ({ lane, k })).sort((a, b) => a.k - b.k).forEach(({ lane }) => {
        const d = spots[lane].drum, cx = d[0], cy = d[1], rx = d[2], ry = d[3], bodyH = d[4];
        ctx.beginPath(); ctx.moveTo(cx - rx, cy); ctx.bezierCurveTo(cx - rx * 1.12, cy + bodyH * 0.5, cx - rx * 1.05, cy + bodyH * 0.9, cx - rx * 0.86, cy + bodyH); ctx.ellipse(cx, cy + bodyH, rx * 0.86, ry * 0.8, 0, Math.PI, 0, true); ctx.bezierCurveTo(cx + rx * 1.05, cy + bodyH * 0.9, cx + rx * 1.12, cy + bodyH * 0.5, cx + rx, cy); ctx.closePath();
        ctx.fillStyle = hgrad(ctx, cx - rx, cx + rx, [[0, darker(woodC, 0.6)], [0.25, lighter(woodC, 0.25)], [0.6, woodC], [1, darker(woodC, 0.6)]]); ctx.fill();
        ctx.save(); ctx.clip();
        ctx.strokeStyle = 'rgba(235,215,170,0.8)'; ctx.lineWidth = 4;
        for (let a = 0; a < 7; a++) { const t = a / 7; ctx.beginPath(); ctx.moveTo(cx - rx + t * rx * 2, cy + 8); ctx.lineTo(cx - rx + (t + 0.07) * rx * 2, cy + bodyH * 0.5); ctx.lineTo(cx - rx + t * rx * 2, cy + bodyH); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(20,10,4,0.55)'; ctx.lineWidth = 7; for (const q of [0.28, 0.62]) { ctx.beginPath(); ctx.ellipse(cx, cy + bodyH * q, rx * 1.06, ry * 0.9, 0, 0, Math.PI); ctx.stroke(); }
        ctx.restore();
        ctx.fillStyle = '#c4a679'; ell(ctx, cx, cy, rx + 6, ry + 6); ctx.fill();
        ctx.fillStyle = SKIN_G(ctx, cx, cy, rx, ry); ell(ctx, cx, cy, rx - 3, ry - 3); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; ell(ctx, cx, cy, rx + 6, ry + 6); ctx.stroke();
      });
      paintZones(ctx, rt, 0.47);
      lanes.forEach((l, i) => {
        const sp = spots[i], f = rt.flash[i];
        if (sp.block) { // wooden clapper block
          ctx.fillStyle = hgrad(ctx, sp.v - 90, sp.v + 90, [[0, '#6a3f1d'], [0.5, '#d9a860'], [1, '#6a3f1d']]); rrect(ctx, sp.v - 90, sp.u - 26, 180, 52, 14); ctx.fill();
        }
        if (f > 0.04) { const d = (i % 2 ? 1 : -1); stick(ctx, sp.v + d * 20, sp.u - 20 - 120 * (1 - f), d * 0.35, 260, 18, '#f0dcb0', '#b88040', f * 1.7); }
      });
    };
  }

  function sceneWater() {
    ref = { w: 760, h: 760 };
    const cx = 0, cy = 390, RB = 345, RC = 200;
    const rimL = lanes.map((_, i) => i).filter((i) => /rim|edge|bowl|wood/.test(nm(i)));
    const gourd = order.filter((i) => !rimL.includes(i));
    const k = gourd.length;
    gourd.forEach((lane, rank) => {
      const r0 = rank === 0 ? 0 : (rank / k) * RC, r1 = ((rank + 1) / k) * RC;
      spots[lane] = rank === 0 ? disc(cx, cy, r1 * 0.95, r1 * 0.95) : annulus(cx, cy, r0 * 1.02, r1, 1, -0.9 + rank * 1.4);
    });
    rimL.forEach((i, j) => { spots[i] = annulus(cx, cy, RB * 0.9, RB * 1.07, 1, 0.5 + j * 1.4); });
    drawScene = (ctx, rt) => {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; circ(ctx, cx + 12, cy + 18, RB + 44); ctx.fill();
      ctx.fillStyle = rgrad(ctx, cx, cy, RB * 0.8, RB + 44, [[0, '#d7b070'], [0.7, '#9a6a30'], [1, '#4a2c0e']], cx - 80, cy - 90); circ(ctx, cx, cy, RB + 40); ctx.fill();
      grain(ctx, cx - RB - 40, cy - RB - 40, (RB + 40) * 2, (RB + 40) * 2, '#2a1608', 0.3, 7, false, 16);
      // water with moving ripples
      ctx.fillStyle = rgrad(ctx, cx, cy, 20, RB, [[0, '#8fd6e6'], [0.6, '#3a8aa6'], [1, '#1a4a62']], cx - 60, cy - 70); circ(ctx, cx, cy, RB * 0.92); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 2;
      for (let q = 0; q < 5; q++) { circ(ctx, cx, cy, RC * (1.12 + 0.18 * q) + 5 * Math.sin(rt.anim * 1.6 + q * 1.3)); ctx.stroke(); }
      const wob = lanes.reduce((m, _, i) => Math.max(m, rt.flash[i]), 0);
      if (wob > 0.05) { ctx.strokeStyle = `rgba(255,255,255,${0.7 * wob})`; ctx.lineWidth = 5; circ(ctx, cx, cy, RC * (1.2 + (1 - wob) * 0.9)); ctx.stroke(); }
      // the floating half-gourd, upside down
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; circ(ctx, cx + 12, cy + 16, RC + 8); ctx.fill();
      ctx.fillStyle = rgrad(ctx, cx, cy, 8, RC + 6, [[0, '#f4d690'], [0.45, '#c8964a'], [0.85, '#8a5a22'], [1, '#4a2c0c']], cx - RC * 0.3, cy - RC * 0.38); circ(ctx, cx, cy, RC + 4); ctx.fill();
      ctx.save(); circ(ctx, cx, cy, RC + 4); ctx.clip(); grain(ctx, cx - RC, cy - RC, RC * 2, RC * 2, '#3a1c06', 0.3, 5, false, 12); ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.28)'; ell(ctx, cx - RC * 0.28, cy - RC * 0.42, RC * 0.3, RC * 0.13); ctx.fill();
      paintZones(ctx, rt);
      lanes.forEach((l, i) => { const f = rt.flash[i], sp = spots[i]; if (f > 0.04) hand(ctx, sp.v + (i % 2 ? 22 : -22), sp.u - 36 * (1 - f), 84, i % 2 ? 0.3 : -0.3, f * 1.6); });
    };
  }

  function scenePan() {
    ref = { w: 760, h: 760 };
    const cx = 0, cy = 380, R = 350;
    const outerN = N <= 5 ? N : Math.ceil(N * 0.66);
    const ringIdx = lanes.map((_, i) => i);
    ringIdx.forEach((i, k) => {
      const outer = k < outerN, n = outer ? outerN : N - outerN, kk = outer ? k : k - outerN;
      const a = -Math.PI / 2 + (kk / n) * TAU + (outer ? 0 : TAU / (2 * n)), rr = outer ? R * 0.68 : R * 0.31;
      const w = outer ? clamp(R * 0.215, 36, 80) : clamp(R * 0.19, 32, 66);
      spots[i] = disc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.98, w, w * 0.8, { ang: a, outer });
    });
    drawScene = (ctx, rt) => {
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, cx + 12, cy + 20, R + 40); ctx.fill();
      // oil-drum skirt and rim
      ctx.fillStyle = rgrad(ctx, cx, cy, R * 0.6, R + 40, [[0, '#8c949e'], [0.8, '#4a525c'], [1, '#1e242a']], cx - 90, cy - 100); circ(ctx, cx, cy, R + 38); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 4; circ(ctx, cx, cy, R + 36); ctx.stroke();
      ctx.fillStyle = rgrad(ctx, cx, cy, 10, R, [[0, '#cfd6de'], [0.55, '#7e8892'], [1, '#2e353c']], cx - R * 0.3, cy - R * 0.35); circ(ctx, cx, cy, R); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 3; circ(ctx, cx, cy, R * 0.99); ctx.stroke();
      // hammered note dimples
      lanes.forEach((l, i) => {
        const sp = spots[i], f = rt.flash[i], rx = sp.r * 1.25, ry = sp.r * 1.0;
        ctx.save(); ctx.translate(sp.v, sp.u); ctx.rotate(sp.ang + Math.PI / 2);
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ell(ctx, 3, 5, rx, ry); ctx.fill();
        ctx.fillStyle = rgrad(ctx, 0, 0, 2, rx, [[0, lighter(l.color, 0.5 + 0.4 * f)], [0.55, mix('#aeb6c0', l.color, 0.35 + 0.4 * f)], [1, '#5a626c']], -rx * 0.25, -ry * 0.3); ell(ctx, 0, 0, rx, ry * 1.1); ctx.fill();
        ctx.strokeStyle = rgba(lighter(l.color, 0.5), 0.9); ctx.lineWidth = 3; ell(ctx, 0, 0, rx, ry * 1.1); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ell(ctx, -rx * 0.2, -ry * 0.4, rx * 0.4, ry * 0.18); ctx.fill();
        ctx.restore();
        ripple(ctx, sp, l.color, f, 0.85);
      });
      lanes.forEach((l, i) => { const f = rt.flash[i], sp = spots[i]; if (f > 0.04) { const d = i % 2 ? 1 : -1; stick(ctx, sp.v + d * 8, sp.u - 14 - 120 * (1 - f), d * 0.3, 250, 14, '#d8c9a6', '#d83a2a', f * 1.7); } });
      // the pair of mallets at rest, low corners
      stick(ctx, -330, 560, -0.5, 190, 14, '#d8c9a6', '#d83a2a', 0.75); stick(ctx, 330, 560, 0.5, 190, 14, '#d8c9a6', '#d83a2a', 0.75);
    };
  }

  function sceneMortar() {
    ref = { w: 980, h: 760 };
    const cx = 0, cy = 360, R = 250;
    let j = 0;
    lanes.forEach((_, i) => {
      const turn = /turn|hand|mix|fold/.test(nm(i));
      if (turn) { spots[i] = disc(cx, cy + 175, 70, 70, { turn: true }); return; }
      const side = j % 2 === 0 ? -1 : 1; j++;
      spots[i] = disc(cx + side * 78, cy - 6 + (j > 2 ? 40 : 0), 62, 62, { side });
    });
    drawScene = (ctx, rt) => {
      const wood = S.wood;
      ctx.fillStyle = 'rgba(0,0,0,0.38)'; ell(ctx, 10, cy + 30, R + 80, R * 0.9); ctx.fill();
      ctx.fillStyle = rgrad(ctx, cx, cy, R * 0.5, R + 60, [[0, lighter(wood, 0.15)], [0.7, wood], [1, darker(wood, 0.6)]], cx - 60, cy - 70); circ(ctx, cx, cy, R + 40); ctx.fill();
      ctx.save(); circ(ctx, cx, cy, R + 40); ctx.clip(); grain(ctx, cx - R - 40, cy - R - 40, (R + 40) * 2, (R + 40) * 2, darker(wood, 0.7), 0.4, 4, false, 18); ctx.restore();
      ctx.strokeStyle = 'rgba(255,225,170,0.35)'; ctx.lineWidth = 3; circ(ctx, cx, cy, R + 40); ctx.stroke();
      ctx.fillStyle = rgrad(ctx, cx, cy, 10, R * 0.82, [[0, '#1c0e06'], [0.8, '#3a2210'], [1, darker(wood, 0.4)]]); circ(ctx, cx, cy, R * 0.82); ctx.fill();
      const hit = lanes.reduce((m, _, i) => Math.max(m, rt.flash[i]), 0);
      ctx.fillStyle = rgrad(ctx, cx, cy, 6, R * 0.62, [[0, '#fffaf0'], [0.7, '#efe2c4'], [1, '#c9b48a']], cx - 20, cy - 30); ell(ctx, cx, cy, R * 0.6 * (1 + 0.08 * hit), R * 0.55 * (1 - 0.12 * hit)); ctx.fill();
      paintZones(ctx, rt);
      lanes.forEach((l, i) => {
        const sp = spots[i], f = rt.flash[i];
        if (sp.turn) { hand(ctx, sp.v, sp.u - 10 * f, 100, Math.sin(rt.anim * 3) * 0.3 * f, 0.8 + 0.2 * f, '#d8956a'); return; }
        // a long pestle raised from its side, dropping onto the dough; the pounding end is the thick one
        const lift = 110 * (1 - f) * (1 - f), s2 = sp.side, tipV = sp.v, tipU = sp.u - lift;
        const dx = s2 * 0.62, dy = -0.78, len = 560;
        ctx.save(); ctx.translate(tipV, tipU); ctx.rotate(Math.atan2(dy, dx) - Math.PI / 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, -18 + 9, 10, 36, len, 16); ctx.fill();
        ctx.fillStyle = hgrad(ctx, -18, 18, [[0, lighter(wood, 0.5)], [0.5, lighter(wood, 0.12)], [1, darker(wood, 0.45)]]); rrect(ctx, -18, 0, 36, len, 16); ctx.fill();
        ctx.fillStyle = hgrad(ctx, -26, 26, [[0, lighter(wood, 0.4)], [0.5, wood], [1, darker(wood, 0.5)]]); rrect(ctx, -26, -6, 52, 90, 24); ctx.fill();
        ctx.restore();
      });
    };
  }

  function sceneTabla() {
    ref = { w: 960, h: 680 };
    // dayan (right, small wooden) and bayan (left, big kettle)
    const D = { cx: 250, cy: 270, R: 190 }, B = { cx: -250, cy: 290, R: 230 };
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
      const x = (k - (both.length - 1) / 2) * 190, y = 600;
      spots[i] = { ...disc(x, y, 80, 46), links: a, combo: true };
    });
    // Zones used by single-stroke lanes for highlighting combined strokes
    drawScene = (ctx, rt) => {
      ctx.fillStyle = 'rgba(0,0,0,0.36)'; ell(ctx, 0, 560, 480, 36); ctx.fill();
      // bayan: copper kettle seen from above, skin tied with straps
      const kettle = (c, cx, cy, R, metal) => {
        ctx.fillStyle = 'rgba(0,0,0,0.34)'; circ(ctx, cx + 10, cy + 16, R + 18); ctx.fill();
        ctx.fillStyle = rgrad(ctx, cx, cy, R * 0.7, R + 18, metal, cx - R * 0.3, cy - R * 0.35); circ(ctx, cx, cy, R + 16); ctx.fill();
      };
      kettle(ctx, B.cx, B.cy, B.R, [[0, '#f0b070'], [0.6, '#b8682c'], [1, '#5a2c0c']]);
      ctx.strokeStyle = '#2a1608'; ctx.lineWidth = 8; for (let a = 0; a < 16; a++) { const t = (a / 16) * TAU; ctx.beginPath(); ctx.moveTo(B.cx + Math.cos(t) * B.R * 0.96, B.cy + Math.sin(t) * B.R * 0.96); ctx.lineTo(B.cx + Math.cos(t + 0.2) * B.R * 0.72, B.cy + Math.sin(t + 0.2) * B.R * 0.72); ctx.stroke(); }
      ctx.fillStyle = rgrad(ctx, B.cx, B.cy, 6, B.R * 0.78, [[0, '#fff6df'], [0.7, '#e9d3a3'], [1, '#b99c68']], B.cx - 40, B.cy - 50); circ(ctx, B.cx, B.cy, B.R * 0.78); ctx.fill();
      // syahi: the black paste, off centre
      ctx.fillStyle = rgrad(ctx, B.cx + 40, B.cy, 4, B.R * 0.3, [[0, '#4a4a54'], [0.5, '#101014'], [1, '#000']], B.cx + 30, B.cy - 14); circ(ctx, B.cx + 40, B.cy, B.R * 0.3); ctx.fill();
      // dayan: a tapered wooden drum, black centre, braided edge and gaping straps
      kettle(ctx, D.cx, D.cy, D.R, [[0, '#9a5a2a'], [0.6, '#6a3a18'], [1, '#2a1408']]);
      ctx.fillStyle = '#e8d8b0'; for (let a = 0; a < 18; a++) { const t = (a / 18) * TAU; circ(ctx, D.cx + Math.cos(t) * D.R * 0.9, D.cy + Math.sin(t) * D.R * 0.9, 8); ctx.fill(); }
      ctx.fillStyle = rgrad(ctx, D.cx, D.cy, 6, D.R * 0.84, [[0, '#fff6df'], [0.7, '#e9d3a3'], [1, '#b99c68']], D.cx - 30, D.cy - 40); circ(ctx, D.cx, D.cy, D.R * 0.84); ctx.fill();
      ctx.fillStyle = rgrad(ctx, D.cx, D.cy, 4, D.R * 0.4, [[0, '#4a4a54'], [0.5, '#101014'], [1, '#000']], D.cx - 14, D.cy - 18); circ(ctx, D.cx, D.cy, D.R * 0.4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ell(ctx, D.cx - D.R * 0.1, D.cy - D.R * 0.2, D.R * 0.14, D.R * 0.06); ctx.fill();
      // combined strokes: thin cords from the pad to both drums
      lanes.forEach((l, i) => {
        const sp = spots[i];
        if (!sp.combo) return;
        for (const z of sp.links) { const t = zone[z]; ctx.strokeStyle = rgba(l.color, 0.45 + 0.4 * rt.flash[i]); ctx.lineWidth = 4; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(sp.v, sp.u - 30); ctx.quadraticCurveTo((sp.v + t.v) / 2, Math.min(sp.u, t.u) + 40, t.v, t.u); ctx.stroke(); ctx.setLineDash([]); }
      });
      lanes.forEach((l, i) => {
        const sp = spots[i], f = rt.flash[i];
        if (sp.combo) { ctx.fillStyle = 'rgba(30,20,12,0.9)'; ell(ctx, sp.v, sp.u, 82, 48); ctx.fill(); ctx.strokeStyle = rgba(l.color, 0.9); ctx.lineWidth = 3; ctx.stroke(); }
        zoneStyle(ctx, sp, l.color, f, rt); ripple(ctx, sp, l.color, f);
        for (const z of sp.links ?? []) if (sp.combo && f > 0.04) { const t = zone[z]; ripple(ctx, t, l.color, f); }
        if (f > 0.04) {
          const tgt = sp.combo ? sp.links.map((z) => zone[z]) : [sp];
          tgt.forEach((t, k) => hand(ctx, t.v + 14, t.u - 36 * (1 - f) - 6, 76, (k ? 0.3 : -0.3), f * 1.6));
        }
      });
    };
  }

  function sceneMulti() {
    const cols = N <= 3 ? N : N === 4 ? 2 : Math.min(4, Math.ceil(N / 2)), rows = Math.ceil(N / cols);
    const cell = 250;
    ref = { w: cols * cell + 40, h: rows * cell + 60 };
    lanes.forEach((_, i) => {
      const c = i % cols, r = Math.floor(i / cols), inRow = r === rows - 1 ? N - r * cols : cols;
      const x = (c - (inRow - 1) / 2) * cell, y = 40 + cell / 2 + r * cell;
      spots[i] = disc(x, y, cell * 0.42, cell * 0.42);
    });
    drawScene = (ctx, rt) => {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, -ref.w / 2 + 10, 12, ref.w - 20, ref.h - 30, 30); ctx.fill();
      lanes.forEach((l, i) => {
        const sp = spots[i], f = rt.flash[i];
        drumHead(ctx, S, sp.v, sp.u, sp.r * 1.05, l.color, f, rt.anim, i * 7);
        if (f > 0.04) hand(ctx, sp.v + (i % 2 ? 20 : -20), sp.u - 36 * (1 - f), sp.r * 0.8, i % 2 ? 0.3 : -0.3, f * 1.6);
      });
    };
  }

  const BUILD = { djembe: sceneDjembe, taiko: sceneTaiko, bodhran: sceneBodhran, isukuti: sceneIsukuti, water: sceneWater, steelpan: scenePan, mortar: sceneMortar, tabla: sceneTabla, multi: sceneMulti };
  (BUILD[id] ?? sceneMulti)();
  for (let i = 0; i < N; i++) if (!spots[i]) spots[i] = disc(0, ref.h * (0.2 + 0.05 * i), 40);
  if (id === 'steelpan') st.voice = 'pan';

  st.layout = (area) => { st.F = makeBox(area, ref.w, ref.h, { top: 40, bottom: 10, side: 12, ...(VIEW[id] ?? {}) }); finishSpots(st.F, spots); };
  st.hit = (x, y) => (st.F ? hitSpots(st.F, spots, x, y) : -1);
  st.anchor = (i) => ({ x: spots[i]?.x ?? 0, y: spots[i]?.y ?? 0 });
  st.voiceOf = (i) => (id === 'steelpan' && lanes[i].timName !== 'bass' ? 'bar' : null);

  st.draw = (g, rt) => {
    const { ctx } = g, F = st.F;
    if (!F) return;
    ctx.save(); F.apply(ctx);
    drawScene(ctx, rt);
    // approach rings for every upcoming stroke
    for (let k = rt.list.length - 1; k >= 0; k--) {
      const t = rt.list[k];
      if (t.state && t.state !== 'pending' && t.state !== 'miss') continue;
      const tau = (t.t - rt.clock) / rt.look;
      if (tau > 1.0 || tau < -0.25) continue;
      const miss = t.state === 'miss', a = (rt.soft ? 0.5 : 1) * (miss ? 0.35 : 1) * clamp((1.05 - tau) * 8, 0, 1) * clamp((tau + 0.25) * 6, 0, 1);
      const col = miss ? mix(lanes[t.lane].color, '#555555', 0.6) : lanes[t.lane].color, sp = spots[t.lane];
      if (sp.combo) { for (const z of sp.links) void z; }
      approach(ctx, sp, col, tau, a, sp.sqz ?? 1);
    }
    ctx.restore();
    const size = g.px(16);
    lanes.forEach((l, i) => { const sp = spots[i], [x, y] = F.map(sp.v, sp.u); pill(ctx, l.name, x, y, Math.max(70, sp.r * F.scale * 2.2), size, l.color, rt.flash[i]); });
  };
  return st;
}

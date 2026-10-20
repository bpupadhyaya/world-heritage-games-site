// Lyre stages (1.18.0): the yoke-and-arms family. Seen from the front, upright: a resonating body at the foot, two arms rising from it,
// a crossbar (yoke) across the arm tops, and the strings running from the crossbar down over a bridge to a tail cord. The body, the arms,
// the crossbar and the tying of the strings are all different per instrument (nothing is shared but the skeleton):
//   kissar     round bowl, cream hide with a laced edge, slim arms bowing out, leather-wrapped crossbar     (Nubia, Egypt)
//   tanbura    wide shallow bowl, thick short arms set with cowries, a rope-lashed square yoke              (Sudan, Red Sea coast)
//   simsimiyya a tin drum body with rivets, bright steel strings, upright blue-painted arms                   (Suez Canal, Egypt)
//   nyatiti    long wooden trough with a hide, short carved arms, beaded yoke, a toe-bell lane               (Luo, Kenya)
//   litungu    deep round bowl, tall splayed horn arms curling in, pale wood burnt with black patterns       (Luhya, Kenya)
//   obokano    a big square box with a lattice window, two stout posts, a thick yoke, large leather rings    (Kisii, Kenya)
//   begena     tall tapering box with a gilt border, wide arms, a heavy yoke, a buzzing bray                  (Ethiopia)
//   greek-lyre a tortoise-shell body, curved horn arms, a pale yoke with rolled string cuffs                (ancient Greece)
// Drawn in a fixed upright design box (makeBox), so a wide screen keeps the lyre upright instead of lying it on its side.
import { clamp, mix, rgba, lighter, darker, rrect, circ, ell, hgrad, vgrad, rgrad, hash, TAU } from './instr-art.js';
import { shadow, studs, tassel, skin } from './instr-art.js';
import { registerStringStage } from './registry.js';
import { createBoardStage, stagger } from './board-kit.js';
import { lerp } from './stagekit.js';

const REF_W = 700, REF_H = 790, SHIFT = 100;
const rank = (K) => K.noteIdx.slice().sort((a, b) => K.lanes[a].hz - K.lanes[b].hz);
const bez = (P, t) => { const m = 1 - t, a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t; return [a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0], a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1]]; };
const curve = (P, n = 40) => Array.from({ length: n + 1 }, (_, k) => bez(P, k / n));
const mirror = (P) => P.map(([x, u]) => [-x, u]);

// a ribbon (thick curve of varying width): builds a closed path around a polyline; `off` shifts it sideways in widths
function ribbon(ctx, pts, w0, w1, off = 0) {
  const n = pts.length - 1, L = [], R = [];
  for (let k = 0; k <= n; k++) {
    const a = pts[Math.max(0, k - 1)], b = pts[Math.min(n, k + 1)];
    let tx = b[0] - a[0], tu = b[1] - a[1]; const l = Math.hypot(tx, tu) || 1; tx /= l; tu /= l;
    const nx = -tu, nu = tx, w = lerp(w0, w1, k / n) / 2, c = off * w;
    L.push([pts[k][0] + nx * (w + c), pts[k][1] + nu * (w + c)]); R.push([pts[k][0] - nx * (w - c), pts[k][1] - nu * (w - c)]);
  }
  ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]);
  for (const p of L) ctx.lineTo(p[0], p[1]);
  for (let k = n; k >= 0; k--) ctx.lineTo(R[k][0], R[k][1]);
  ctx.closePath();
}
// a lit wooden bar along a polyline (dark rim, body, soft highlight on the lit side, grain lines)
function bar(ctx, pts, w0, w1, col, o = {}) {
  const { seed = 3, grainA = 0.2, hl = 0.36 } = o;
  ctx.save();
  ctx.translate(-7, 9); ribbon(ctx, pts, w0 + 3, w1 + 3); ctx.fillStyle = 'rgba(0,0,0,0.36)'; ctx.fill(); ctx.translate(7, -9);
  ribbon(ctx, pts, w0 + 4, w1 + 4); ctx.fillStyle = darker(col, 0.62); ctx.fill();
  ribbon(ctx, pts, w0, w1); ctx.fillStyle = col; ctx.fill();
  ribbon(ctx, pts, w0, w1, 0.0); ctx.save(); ctx.clip();
  for (let k = 0; k < 7; k++) { const off = -0.78 + k * 0.26; ribbon(ctx, pts, 1.2, 1.2, 0); const f = hash(seed + k); ctx.strokeStyle = rgba(darker(col, 0.7), grainA * (0.5 + f)); ctx.lineWidth = 1.3; ctx.beginPath(); pts.forEach((p, i) => { const q = pts[Math.min(pts.length - 1, i + 1)], a2 = pts[Math.max(0, i - 1)]; let tx = q[0] - a2[0], tu = q[1] - a2[1]; const l = Math.hypot(tx, tu) || 1; const w = lerp(w0, w1, i / (pts.length - 1)) / 2; const x = p[0] - (tu / l) * w * off, y = p[1] + (tx / l) * w * off; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.stroke(); }
  ribbon(ctx, pts, w0 * 0.42, w1 * 0.42, -0.62); ctx.fillStyle = rgba(lighter(col, 0.7), hl); ctx.fill();
  ribbon(ctx, pts, w0 * 0.18, w1 * 0.18, 0.95); ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fill();
  ctx.restore(); ctx.restore();
}

// ---- body painters: (ctx, o, rt) with o = { cu, rx, ry, ... look fields } ----------------------------------------------------------
function hideFace(ctx, cx, cy, rx, ry, o) {
  const path = () => { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); };
  path(); ctx.fillStyle = rgrad(ctx, cx - rx * 0.2, cy - ry * 0.3, 0, rx * 1.15, [[0, lighter(o.hide, 0.3)], [0.55, o.hide], [1, darker(o.hide, 0.38)]]); ctx.fill();
  ctx.save(); path(); ctx.clip();
  // fibres, a few darker patches, and a shadow where the hide is drawn down over the rim
  ctx.strokeStyle = rgba(darker(o.hide, 0.6), 0.14); ctx.lineWidth = 1.2;
  for (let k = 0; k < 11; k++) { ctx.beginPath(); ctx.arc(cx + rx * (hash(k + 4) - 0.5), cy + ry * (hash(k + 9) - 0.2), rx * (0.15 + 0.07 * k), hash(k) * 6, hash(k) * 6 + 2.0); ctx.stroke(); }
  for (let k = 0; k < 5; k++) { ctx.fillStyle = rgba(darker(o.hide, 0.55), 0.1 + 0.08 * hash(k + 40)); ell(ctx, cx + rx * (hash(k + 20) - 0.5) * 1.3, cy + ry * (hash(k + 50) - 0.5) * 1.2, rx * (0.1 + 0.12 * hash(k + 5)), ry * (0.08 + 0.1 * hash(k + 7))); ctx.fill(); }
  ctx.strokeStyle = 'rgba(30,14,2,0.5)'; ctx.lineWidth = rx * 0.1; path(); ctx.stroke();
  ctx.fillStyle = rgba('#ffffff', 0.18); ell(ctx, cx - rx * 0.34, cy - ry * 0.4, rx * 0.34, ry * 0.18); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(40,20,4,0.65)'; ctx.lineWidth = 2; path(); ctx.stroke();
}
function laced(ctx, cx, cy, rx, ry, n, col, inner = 0.84) {
  ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  for (let k = 0; k < n; k++) { const a = (k / n) * TAU + 0.07, c = Math.cos(a), s = Math.sin(a); ctx.beginPath(); ctx.moveTo(cx + c * rx * inner, cy + s * ry * inner); ctx.lineTo(cx + c * rx * 0.985, cy + s * ry * 0.985); ctx.stroke(); }
}
function holes(ctx, list, o = {}) {
  for (const [x, y, rx, ry] of list) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, x + 2, y + 3, rx + 3, ry + 3); ctx.fill();
    ctx.fillStyle = rgrad(ctx, x, y, 0, Math.max(rx, ry), [[0, '#000'], [0.8, '#150a03'], [1, '#2a1608']]); ell(ctx, x, y, rx, ry); ctx.fill();
    ctx.strokeStyle = o.ring ?? 'rgba(235,215,170,0.85)'; ctx.lineWidth = o.lw ?? 3; ell(ctx, x, y, rx + 2, ry + 2); ctx.stroke();
  }
}

const BODY = {
  // a round wooden bowl with a hide face drawn over it and laced down the edge
  bowl(ctx, o) {
    const { cu, rx, ry } = o, cx = 0;
    shadow(ctx, () => { ctx.beginPath(); ctx.ellipse(cx, cu, rx + 8, ry + 8, 0, 0, TAU); }, -10, 12, 0.4);
    ctx.beginPath(); ctx.ellipse(cx, cu, rx + 8, ry + 8, 0, 0, TAU); ctx.fillStyle = rgrad(ctx, -rx * 0.35, cu - ry * 0.45, 0, rx * 1.3, [[0, lighter(o.wood, 0.45)], [0.55, o.wood], [1, darker(o.wood, 0.6)]]); ctx.fill();
    ctx.strokeStyle = darker(o.wood, 0.7); ctx.lineWidth = 3; ctx.stroke();
    hideFace(ctx, cx, cu, rx - 18, ry - 18, o);
    laced(ctx, cx, cu, rx, ry, o.lace ?? 44, o.laceCol ?? '#3a2010', 0.84);
    if (o.dots) { for (let k = 0; k < 30; k++) { const a = (k / 30) * TAU; ctx.fillStyle = o.dots; circ(ctx, Math.cos(a) * (rx - 34), cu + Math.sin(a) * (ry - 34), 3.4); ctx.fill(); } }
    if (o.holes) holes(ctx, o.holes.map(([x, y, a, b]) => [x * rx, cu + y * ry, a, b]), { ring: o.holeRing });
  },
  // a tin drum: a polished metal rim with rivets, a stretched skin face
  tin(ctx, o) {
    const { cu, rx, ry } = o;
    shadow(ctx, () => { ctx.beginPath(); ctx.ellipse(0, cu, rx + 8, ry + 8, 0, 0, TAU); }, -10, 12, 0.4);
    ctx.beginPath(); ctx.ellipse(0, cu, rx + 8, ry + 8, 0, 0, TAU);
    ctx.fillStyle = hgrad(ctx, -rx, rx, [[0, '#6a7078'], [0.18, '#eef2f6'], [0.4, '#b4bbc4'], [0.62, '#747c86'], [0.82, '#dfe5ec'], [1, '#585e66']]); ctx.fill();
    ctx.strokeStyle = '#353a40'; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, cu, rx - 4, ry - 4, 0, 0, TAU); ctx.stroke();
    hideFace(ctx, 0, cu, rx - 24, ry - 24, o);
    const pts = []; for (let k = 0; k < 40; k++) { const a = (k / 40) * TAU; pts.push([Math.cos(a) * (rx + 0.5 - 11), cu + Math.sin(a) * (ry - 11)]); }
    studs(ctx, pts, 4, '#cfd5dc');
    // painted stripe on the tin
    ctx.strokeStyle = o.stripe ?? '#c8312a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(0, cu, rx - 22, ry - 22, 0, 0, TAU); ctx.stroke();
  },
  // a long wooden trough, rounded at both ends, hide stretched across its whole face
  trough(ctx, o) {
    const { cu, rx, ry } = o;
    const out = () => rrect(ctx, -rx - 6, cu - ry - 6, 2 * rx + 12, 2 * ry + 12, rx * 0.8);
    shadow(ctx, out, -10, 12, 0.4);
    ctx.beginPath(); out(); ctx.fillStyle = hgrad(ctx, -rx, rx, [[0, darker(o.wood, 0.55)], [0.25, lighter(o.wood, 0.25)], [0.6, o.wood], [1, darker(o.wood, 0.65)]]); ctx.fill();
    ctx.strokeStyle = darker(o.wood, 0.75); ctx.lineWidth = 3; out(); ctx.stroke();
    const face = () => rrect(ctx, -rx + 14, cu - ry + 14, 2 * rx - 28, 2 * ry - 28, rx * 0.66);
    face(); ctx.fillStyle = hgrad(ctx, -rx, rx, [[0, darker(o.hide, 0.2)], [0.35, lighter(o.hide, 0.3)], [0.7, o.hide], [1, darker(o.hide, 0.4)]]); ctx.fill();
    ctx.save(); face(); ctx.clip();
    for (let k = 0; k < 7; k++) { ctx.fillStyle = rgba(darker(o.hide, 0.55), 0.1 + 0.08 * hash(k + 3)); ell(ctx, (hash(k + 11) - 0.5) * rx, cu + (hash(k + 31) - 0.5) * ry * 1.6, rx * 0.2, ry * 0.1); ctx.fill(); }
    ctx.strokeStyle = 'rgba(30,14,2,0.45)'; ctx.lineWidth = rx * 0.12; face(); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = 'rgba(40,20,4,0.7)'; ctx.lineWidth = 2; face(); ctx.stroke();
    // a row of pegs pinning the hide
    const pts = []; for (let k = 0; k < 26; k++) { const s = k / 25; pts.push([-rx + 22 + (k % 2 ? 0 : 0), cu - ry + 40 + s * (2 * ry - 80)], [rx - 22, cu - ry + 40 + s * (2 * ry - 80)]); }
    studs(ctx, pts, 3, o.stud ?? '#d8b868');
    holes(ctx, o.holes.map(([x, y, a, b]) => [x * rx, cu + y * ry, a, b]), { ring: o.holeRing });
  },
  // a rectangular wooden box with a carved window
  box(ctx, o) {
    const { cu, rx, ry } = o, tw = o.taper ?? 0.0;
    const out = () => { ctx.beginPath(); ctx.moveTo(-rx * (1 - tw), cu - ry); ctx.lineTo(rx * (1 - tw), cu - ry); ctx.lineTo(rx, cu + ry); ctx.lineTo(-rx, cu + ry); ctx.closePath(); };
    shadow(ctx, out, -10, 12, 0.4);
    out(); ctx.fillStyle = hgrad(ctx, -rx, rx, [[0, darker(o.wood, 0.55)], [0.2, lighter(o.wood, 0.3)], [0.55, o.wood], [0.85, darker(o.wood, 0.3)], [1, darker(o.wood, 0.62)]]); ctx.fill();
    ctx.save(); out(); ctx.clip();
    for (let k = 1; k < 8; k++) { const x = -rx + (2 * rx * k) / 8; ctx.strokeStyle = rgba(darker(o.wood, 0.7), 0.3); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, cu - ry); ctx.lineTo(x * (1 + 0.04), cu + ry); ctx.stroke(); }
    for (let k = 0; k < 16; k++) { ctx.strokeStyle = rgba(darker(o.wood, 0.75), 0.18); ctx.lineWidth = 1; const y = cu - ry + hash(k + 2) * 2 * ry, x = -rx + hash(k + 12) * 2 * rx; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 14, y + 8, x + 30, y + 1); ctx.stroke(); }
    ctx.fillStyle = vgrad(ctx, cu - ry, cu + ry, [[0, 'rgba(0,0,0,0.34)'], [0.2, 'rgba(0,0,0,0)'], [0.85, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.3)']]); ctx.fillRect(-rx, cu - ry, 2 * rx, 2 * ry);
    ctx.restore();
    ctx.strokeStyle = darker(o.wood, 0.75); ctx.lineWidth = 3.5; out(); ctx.stroke();
    ctx.strokeStyle = rgba(lighter(o.wood, 0.5), 0.6); ctx.lineWidth = 3; ctx.save(); ctx.translate(0, 0); ctx.beginPath(); ctx.moveTo(-rx * (1 - tw) + 8, cu - ry + 8); ctx.lineTo(rx * (1 - tw) - 8, cu - ry + 8); ctx.stroke(); ctx.restore();
    if (o.border) { // gilt border
      ctx.strokeStyle = o.border; ctx.lineWidth = 3; ctx.setLineDash([8, 5]); const k = 0.9; ctx.beginPath(); ctx.moveTo(-rx * (1 - tw) * k, cu - ry * k); ctx.lineTo(rx * (1 - tw) * k, cu - ry * k); ctx.lineTo(rx * k, cu + ry * k); ctx.lineTo(-rx * k, cu + ry * k); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
    }
    if (o.window) { // a carved lattice window
      const [wx, wy, ww, wh] = [o.window[0] * rx, cu + o.window[1] * ry, o.window[2] * rx, o.window[3] * ry];
      ctx.fillStyle = '#0d0603'; rrect(ctx, wx - ww / 2, wy - wh / 2, ww, wh, 10); ctx.fill();
      ctx.strokeStyle = lighter(o.wood, 0.55); ctx.lineWidth = 4; rrect(ctx, wx - ww / 2, wy - wh / 2, ww, wh, 10); ctx.stroke();
      ctx.strokeStyle = lighter(o.wood, 0.3); ctx.lineWidth = 3;
      for (let k = 1; k < 6; k++) { const x = wx - ww / 2 + (ww * k) / 6; ctx.beginPath(); ctx.moveTo(x, wy - wh / 2); ctx.lineTo(x, wy + wh / 2); ctx.stroke(); }
      for (let k = 1; k < 3; k++) { const y = wy - wh / 2 + (wh * k) / 3; ctx.beginPath(); ctx.moveTo(wx - ww / 2, y); ctx.lineTo(wx + ww / 2, y); ctx.stroke(); }
    }
    if (o.holes) holes(ctx, o.holes.map(([x, y, a, b]) => [x * rx, cu + y * ry, a, b]), { ring: o.holeRing });
  },
  // a tortoise shell: an oval of hexagonal scutes, with the pale skin of the front showing at the lower part
  shell(ctx, o) {
    const { cu, rx, ry } = o;
    shadow(ctx, () => { ctx.beginPath(); ctx.ellipse(0, cu, rx + 6, ry + 6, 0, 0, TAU); }, -10, 12, 0.4);
    ctx.beginPath(); ctx.ellipse(0, cu, rx + 6, ry + 6, 0, 0, TAU); ctx.fillStyle = rgrad(ctx, -rx * 0.3, cu - ry * 0.4, 0, rx * 1.3, [[0, '#e0a64a'], [0.5, '#a86a1e'], [1, '#3a1c06']]); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, cu, rx, ry, 0, 0, TAU); ctx.clip();
    const s = rx * 0.27;
    for (let r = -5; r <= 5; r++) for (let c = -5; c <= 5; c++) {
      const x = c * s * 1.75 + (r % 2) * s * 0.87, y = cu + r * s * 1.52; const f = hash(r * 13 + c + 60);
      ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + (k / 6) * TAU; ctx.lineTo(x + Math.cos(a) * s * 0.98, y + Math.sin(a) * s * 0.98); } ctx.closePath();
      ctx.fillStyle = rgba(mix('#e8b04c', '#5a2a08', 0.15 + 0.6 * f), 0.95); ctx.fill(); ctx.strokeStyle = 'rgba(30,12,2,0.85)'; ctx.lineWidth = 3.2; ctx.stroke();
      ctx.strokeStyle = rgba('#3a1c06', 0.35); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, s * 0.55, 0, TAU); ctx.stroke();
    }
    ctx.fillStyle = vgrad(ctx, cu - ry, cu + ry, [[0, 'rgba(255,230,160,0.35)'], [0.3, 'rgba(0,0,0,0)'], [0.7, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.5)']]); ctx.fillRect(-rx, cu - ry, 2 * rx, 2 * ry);
    ctx.restore();
    ctx.strokeStyle = '#2a1204'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, cu, rx, ry, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,225,150,0.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, cu, rx - 6, ry - 6, 0, Math.PI * 1.05, Math.PI * 1.55); ctx.stroke();
  },
};

// ---- the look table ---------------------------------------------------------------------------------------------------------------------------
//   arm: control points of the RIGHT arm [base, c1, c2, tip] (the left is mirrored), aw: [width at base, at tip]
//   yU: the crossbar's height, yHalf: its half length, yW: thickness, tie: how strings are tied on ('leather' | 'rope' | 'beads' | 'pins' | 'rings' | 'cuff')
const LOOK = {
  kissar: { n: 5, body: 'bowl', cu: 668, rx: 232, ry: 214, wood: '#8c4c22', hide: '#efe0bb', dots: '#5a3014', lace: 46,
    arm: [[132, 520], [226, 410], [270, 290], [236, 150]], aw: [34, 22], yU: 150, yHalf: 236, yW: 26, yCol: '#7a3e1c', tie: 'leather', tieCol: '#d4a45c', tip: 'ball',
    bridgeU: 706, tailU: 800, spread: [220, 128], strCol: '#f2e8cc', strW: 3, mat: 'gut', voice: 'lyre-kissar', ground: '#2a1808' },
  tanbura: { n: 6, body: 'bowl', cu: 690, rx: 300, ry: 170, wood: '#5a3a24', hide: '#cdb487', dots: '#f0e4c8', lace: 54, laceCol: '#2a1608',
    arm: [[170, 570], [250, 490], [262, 380], [214, 290]], aw: [58, 44], yU: 282, yHalf: 214, yW: 40, yCol: '#4a2c18', tie: 'rope', tieCol: '#b89a6a', tip: 'flat', decor: 'cowrie',
    bridgeU: 720, tailU: 806, spread: [190, 138], strCol: '#d9c9a0', strW: 3.4, mat: 'gut', voice: 'lyre-tanbura', ground: '#201208' },
  simsimiyya: { n: 5, body: 'tin', cu: 650, rx: 190, ry: 190, wood: '#2c6b94', hide: '#e8dcc0', stripe: '#c8312a',
    arm: [[134, 536], [150, 420], [158, 280], [160, 142]], aw: [26, 20], yU: 142, yHalf: 164, yW: 24, yCol: '#245a7c', tie: 'pins', tieCol: '#e6ecf2', tip: 'ball', decor: 'trim',
    bridgeU: 690, tailU: 800, spread: [150, 96], strCol: '#e2e8ee', strW: 2.2, mat: 'steel', voice: 'lyre-simsimiyya', ground: '#10202c' },
  nyatiti: { n: 8, body: 'trough', cu: 690, rx: 196, ry: 168, wood: '#3c2414', hide: '#d8c294', stud: '#e0c070', holes: [],
    arm: [[132, 570], [200, 450], [222, 320], [190, 175]], aw: [40, 28], yU: 168, yHalf: 192, yW: 30, yCol: '#2c1a0e', tie: 'beads', tieCol: '#c8312a', tip: 'flat', decor: 'rings', toe: true,
    bridgeU: 716, tailU: 826, spread: [172, 126], strCol: '#e9d9b0', strW: 2.6, mat: 'gut', voice: 'lyre-nyatiti', ground: '#1e1208' },
  litungu: { n: 8, body: 'bowl', cu: 690, rx: 214, ry: 198, wood: '#d9bd86', hide: '#f1e2bc', dots: '#2a1608', holes: [[0, -0.05, 15, 15]], lace: 40, laceCol: '#55361a', holeRing: 'rgba(40,20,6,0.9)',
    arm: [[104, 540], [300, 500], [300, 270], [136, 120]], aw: [30, 18], yU: 112, yHalf: 138, yW: 20, yCol: '#c9a86c', tie: 'cuff', tieCol: '#3a2410', tip: 'curl', decor: 'burnt',
    bridgeU: 736, tailU: 820, spread: [124, 96], strCol: '#f4ecd2', strW: 2.6, mat: 'gut', voice: 'lyre-litungu', ground: '#241808' },
  obokano: { n: 8, body: 'box', cu: 700, rx: 250, ry: 150, wood: '#b5541e', border: '#f0d890', window: [0, -0.18, 0.5, 0.5], taper: 0.0, holes: [[-0.72, 0.52, 7, 7], [0.72, 0.52, 7, 7]],
    arm: [[168, 560], [186, 450], [194, 330], [186, 200]], aw: [48, 38], yU: 190, yHalf: 200, yW: 44, yCol: '#7a2e10', tie: 'rings', tieCol: '#e8c878', tip: 'square',
    bridgeU: 716, tailU: 800, spread: [180, 160], strCol: '#e8d8aa', strW: 3.2, mat: 'gut', voice: 'lyre-obokano', ground: '#2a1408' },
  begena: { n: 10, body: 'box', cu: 690, rx: 236, ry: 176, wood: '#2c1a14', border: '#d8b060', window: null, taper: 0.12, holes: [[-0.4, -0.2, 11, 11], [0.4, -0.2, 11, 11]], holeRing: 'rgba(216,176,96,0.9)',
    arm: [[198, 540], [208, 420], [214, 290], [214, 140]], aw: [46, 40], yU: 130, yHalf: 226, yW: 34, yCol: '#1e1210', tie: 'leather', tieCol: '#b8742c', tip: 'ball', decor: 'gilt', armWood: '#6a4430',
    bridgeU: 714, tailU: 800, spread: [206, 150], strCol: '#c9a258', strW: 3.0, mat: 'brass', voice: 'lyre-begena', ground: '#1a1010' },
  'greek-lyre': { n: 7, body: 'shell', cu: 668, rx: 172, ry: 190, wood: '#7a4a1c', hide: '#e8d6a8',
    arm: [[96, 540], [250, 470], [300, 300], [182, 170]], aw: [30, 20], yU: 160, yHalf: 182, yW: 22, yCol: '#efe5c8', tie: 'cuff', tieCol: '#a8201a', tip: 'horn', decor: 'ivory', armWood: '#3a2010',
    bridgeU: 700, tailU: 780, spread: [162, 96], strCol: '#efe4c4', strW: 2.6, mat: 'gut', voice: 'lyre-greek', ground: '#20140a' },
};

function arms(ctx, o, rt) {
  const R = o.arm, Lp = mirror(R);
  for (const P of [Lp, R]) {
    const pts = curve(P);
    bar(ctx, pts, o.aw[0], o.aw[1], o.wood === o.armWood ? o.wood : (o.armWood ?? o.yCol), { seed: o.n });
    if (o.decor === 'cowrie') for (let k = 1; k < 8; k++) { const p = pts[Math.round(k * 4)], q = pts[Math.round(k * 4) + 1]; ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(Math.atan2(q[1] - p[1], q[0] - p[0])); ctx.fillStyle = '#f5ecd8'; ell(ctx, 0, 0, 9, 6); ctx.fill(); ctx.strokeStyle = '#6a5436'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.stroke(); ctx.restore(); }
    if (o.decor === 'rings') for (let k = 0; k < 5; k++) { const i = 8 + k * 6, p = pts[i], q = pts[i + 1], w = lerp(o.aw[0], o.aw[1], i / 40); ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(Math.atan2(q[1] - p[1], q[0] - p[0]) + Math.PI / 2); ctx.fillStyle = 'rgba(232,200,120,0.9)'; ctx.fillRect(-w / 2, -3, w, 6); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-w / 2, 3, w, 2); ctx.restore(); }
    if (o.decor === 'burnt') for (let k = 1; k < 10; k++) { const p = pts[k * 4]; ctx.fillStyle = 'rgba(30,14,4,0.8)'; ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(k); ctx.fillRect(-7, -2, 14, 4); ctx.restore(); }
    if (o.decor === 'gilt') { ctx.strokeStyle = '#d8b060'; ctx.lineWidth = 3; ctx.beginPath(); pts.forEach((p, i) => { if (i === 0) ctx.moveTo(p[0] - 1, p[1]); else ctx.lineTo(p[0] - 1, p[1]); }); ctx.stroke(); }
    if (o.decor === 'trim') { ctx.strokeStyle = '#f2f6fa'; ctx.lineWidth = 3; for (let k = 2; k < 9; k++) { const p = pts[k * 4]; ctx.beginPath(); ctx.moveTo(p[0] - 11, p[1]); ctx.lineTo(p[0] + 11, p[1]); ctx.stroke(); } }
    const tip = P[3], prev = pts[pts.length - 3];
    if (o.tip === 'ball') { ctx.fillStyle = rgrad(ctx, tip[0] - 5, tip[1] - 5, 0, 22, [[0, '#fff2c0'], [0.5, '#d8a840'], [1, '#6a4410']]); circ(ctx, tip[0], tip[1] - 6, 18); ctx.fill(); ctx.strokeStyle = '#4a2c08'; ctx.lineWidth = 2; ctx.stroke(); }
    if (o.tip === 'curl') { const sd = Math.sign(tip[0]); ctx.strokeStyle = o.yCol; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(tip[0], tip[1]); ctx.quadraticCurveTo(tip[0] - sd * 8, tip[1] - 46, tip[0] - sd * 44, tip[1] - 40); ctx.stroke(); ctx.strokeStyle = lighter(o.yCol, 0.5); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(tip[0] + 1, tip[1]); ctx.quadraticCurveTo(tip[0] - sd * 8, tip[1] - 46, tip[0] - sd * 44, tip[1] - 40); ctx.stroke(); }
    if (o.tip === 'horn') { const sd = Math.sign(tip[0]); ctx.fillStyle = '#2a160a'; ctx.beginPath(); ctx.moveTo(tip[0] - 11, tip[1] + 8); ctx.quadraticCurveTo(tip[0] + sd * 8, tip[1] - 44, tip[0] - sd * 16, tip[1] - 70); ctx.quadraticCurveTo(tip[0] - sd * 8, tip[1] - 34, tip[0] + 11, tip[1] + 8); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,225,170,0.6)'; ctx.lineWidth = 2; ctx.stroke(); }
    void prev; void rt;
  }
}

function yoke(ctx, o, G, rt) {
  const { yU, yHalf, yW } = o, pts = [];
  for (let k = 0; k <= 30; k++) { const s = k / 30; pts.push([lerp(-yHalf - 10, yHalf + 10, s), yU - 6 * Math.sin(Math.PI * s)]); }
  bar(ctx, pts, yW, yW, o.yCol, { seed: 7 + o.n });
  // where each string is tied on
  for (const r of G.ties) {
    const x = r.v0, y = yU - 5 * Math.sin(Math.PI * clamp((x + yHalf + 10) / (2 * yHalf + 20), 0, 1));
    const ln = Math.hypot(r.v1 - r.v0, r.u1 - r.u0) || 1;
    if (o.tie === 'leather') { // a tan strap wrapped round the bar with a fringe above
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, x - 9, y - yW / 2 - 2, 20, yW + 6, 5); ctx.fill();
      ctx.fillStyle = vgrad(ctx, y - yW / 2, y + yW / 2, [[0, lighter(o.tieCol, 0.35)], [1, darker(o.tieCol, 0.35)]]); rrect(ctx, x - 10, y - yW / 2 - 4, 20, yW + 6, 5); ctx.fill();
      ctx.strokeStyle = darker(o.tieCol, 0.5); ctx.lineWidth = 1.2; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - 10, y - yW / 2 - 4 + k * (yW + 6) / 4); ctx.lineTo(x + 10, y - yW / 2 - 4 + k * (yW + 6) / 4 + 2); ctx.stroke(); }
    } else if (o.tie === 'rope') {
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x - 7, y - yW / 2 + 2); ctx.lineTo(x + 7, y + yW / 2 + 3); ctx.stroke();
      ctx.strokeStyle = o.tieCol; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - 7, y - yW / 2); ctx.lineTo(x + 7, y + yW / 2); ctx.stroke();
      ctx.strokeStyle = darker(o.tieCol, 0.5); ctx.lineWidth = 1.5; for (let k = 0; k < 5; k++) { const t = k / 4; ctx.beginPath(); ctx.moveTo(x - 7 + 14 * t - 3, y - yW / 2 + yW * t); ctx.lineTo(x - 7 + 14 * t + 3, y - yW / 2 + yW * t + 2); ctx.stroke(); }
    } else if (o.tie === 'beads') {
      for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? '#f4ecd8' : o.tieCol; circ(ctx, x, y - yW / 2 + 5 + k * ((yW - 10) / 4), 5.6); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.stroke(); }
    } else if (o.tie === 'pins') {
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, x + 1.5, y + 2.5, 9.5); ctx.fill();
      ctx.fillStyle = rgrad(ctx, x - 3, y - 3, 0, 10, [[0, '#ffffff'], [0.55, o.tieCol], [1, '#6a7580']]); circ(ctx, x, y, 8.5); ctx.fill(); ctx.strokeStyle = '#2a3036'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.strokeStyle = '#2a3036'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.stroke();
    } else if (o.tie === 'rings') {
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(x + 1, y + 2, 14, 0, TAU); ctx.stroke();
      ctx.strokeStyle = o.tieCol; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(x, y, 14, 0, TAU); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x - 1, y - 1, 14, 3.4, 4.9); ctx.stroke();
    } else if (o.tie === 'cuff') { // a rolled cuff round the bar with the string end looped
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, x - 8, y - yW / 2 - 3, 18, yW + 8, 6); ctx.fill();
      ctx.fillStyle = vgrad(ctx, y - yW / 2, y + yW / 2, [[0, lighter(o.tieCol, 0.4)], [0.5, o.tieCol], [1, darker(o.tieCol, 0.5)]]); rrect(ctx, x - 9, y - yW / 2 - 5, 18, yW + 8, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - 4, y - yW / 2 - 2); ctx.lineTo(x - 4, y + yW / 2 + 1); ctx.stroke();
    }
    void ln;
    if (o.tie === 'leather' || o.tie === 'rope') { // frayed string ends above the bar
      ctx.strokeStyle = rgba(o.strCol, 0.9); ctx.lineWidth = 1.8; for (const d of [-2.5, 2.5]) { ctx.beginPath(); ctx.moveTo(x, y - yW / 2 - 2); ctx.quadraticCurveTo(x + d * 3, y - yW / 2 - 16, x + d * 5, y - yW / 2 - 26); ctx.stroke(); }
    }
  }
  void rt;
}

function bridgeAndTail(ctx, o, G) {
  const { bridgeU, tailU } = o, a = G.strings.filter(Boolean);
  const vs = a.map((s) => s.vb), v0 = Math.min(...vs) - 30, v1 = Math.max(...vs) + 30;
  // the tail cord / tailpiece gathering the string ends
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.moveTo(v0 + 3, tailU + 5); ctx.lineTo(v1 + 3, tailU + 5); ctx.lineTo(0, tailU + 40); ctx.closePath(); ctx.fill();
  ctx.fillStyle = vgrad(ctx, tailU - 6, tailU + 30, [[0, lighter(o.yCol, 0.2)], [1, darker(o.yCol, 0.4)]]); rrect(ctx, v0, tailU - 6, v1 - v0, 14, 6); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.4; ctx.stroke();
  // the bridge: a thin bar standing on the face, with a lit top edge
  const bw = v1 - v0 + 24;
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; rrect(ctx, -bw / 2 + 3, bridgeU - 5 + 6, bw, 12, 5); ctx.fill();
  ctx.fillStyle = vgrad(ctx, bridgeU - 8, bridgeU + 8, [[0, '#f1e2bc'], [0.5, '#c9a86a'], [1, '#6a4a22']]); rrect(ctx, -bw / 2, bridgeU - 8, bw, 16, 6); ctx.fill(); ctx.strokeStyle = 'rgba(40,20,4,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
  if (o.voice === 'lyre-begena' || o.voice === 'lyre-obokano') { // a buzzing leather rest the strings lie against
    ctx.fillStyle = '#e8ddc0'; for (const s of a) { ctx.fillStyle = 'rgba(232,221,192,0.95)'; rrect(ctx, s.vb - 6, bridgeU - 10, 12, 8, 3); ctx.fill(); }
  }
}

for (const o of Object.values(LOOK)) { for (const k of ['cu', 'bridgeU', 'tailU', 'yU']) o[k] -= SHIFT; o.arm = o.arm.map(([x, u]) => [x, u - SHIFT]); }
for (const [id, o] of Object.entries(LOOK)) {
  const match = id === 'greek-lyre' ? /greek.?lyre|chelys|tortoise.?lyre/ : id === 'simsimiyya' ? /simsimiyya|simsimiyyah|simsimiya/ : new RegExp(id);
  registerStringStage({
    id, match,
    build: (S, lanes, P) => createBoardStage(id, S, lanes, P, {
      frame: { top: 44, bottom: 14, side: 10 }, box: { w: REF_W, h: REF_H },
      material: o.mat, voiceOf: (i, l, cls) => (cls === 'shaker' ? 'toe-bell' : o.voice),
      layout(F, K) {
        const order = rank(K), n = order.length, strings = new Array(K.N).fill(null);
        const G = { o, W: REF_W, H: REF_H, ties: [], strings };
        const [sx0, sx1] = o.spread;
        const vsx = order.map((_, r) => lerp(-sx0 + 18, sx0 - 18, n > 1 ? r / (n - 1) : 0.5));
        const rw = stagger(vsx, 58, 4), rows = Math.max(...rw) + 1;
        const barY = o.yU + 8;
        order.forEach((i, r) => {
          const f = n > 1 ? r / (n - 1) : 0.5;
          const va = lerp(-o.spread[0] + 18, o.spread[0] - 18, f), vb = lerp(-o.spread[1] + 14, o.spread[1] - 14, f);
          const p = 0.3 + (rw[r] - (rows - 1) / 2) * (rows > 1 ? 0.09 : 0) + 0.12, sv0 = va, u1 = o.tailU;
          const su = barY + (o.bridgeU - barY) * (o.tailGap ?? 1) * p;
          const sv = lerp(va, vb, (su - barY) / (u1 - barY));
          const s = { v0: va, u0: barY, v1: vb, u1, vb: lerp(va, vb, (o.bridgeU - barY) / (u1 - barY)), sv, su, r: 25, amp: 7, col: o.strCol, w: o.strW };
          strings[i] = s; G.ties.push({ v0: va, u0: barY, v1: vb, u1 });
          void sv0;
        });
        let spots;
        if (o.toe) { // the toe bells: a lane of its own at the lower left
          spots = {}; K.shakeIdx.forEach((i) => { spots[i] = { v: -282, u: 700, r: 46, dist: (lv, lu) => Math.hypot(lv + 282, lu - 700) / 50, toe: true }; });
        }
        return { G, strings, spots, top: barY + 30 };
      },
      back(ctx, G, rt) {
        // a warm pool of light behind the instrument, so a wide screen is not an empty box
        const gl = ctx.createRadialGradient(0, o.cu, 40, 0, o.cu, 760); gl.addColorStop(0, 'rgba(255,214,140,0.16)'); gl.addColorStop(1, 'rgba(255,214,140,0)');
        ctx.fillStyle = gl; ctx.fillRect(-900, -200, 1800, 1300);
        arms(ctx, o, rt);
        BODY[o.body](ctx, o);
        yoke(ctx, o, G, rt);
        if (o.toe) { /* drawn in special() */ }
      },
      front(ctx, G, rt) { bridgeAndTail(ctx, o, G); },
      special(ctx, G, rt, i, sp, f, h) {
        if (!sp.toe) return false;
        // a cluster of iron rings with small bells, on a cord tied round the player's foot, shown at the foot of the instrument
        const cx = sp.v, cy = sp.u;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, cx + 3, cy + 22, 52, 10); ctx.fill();
        ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(cx, cy - 6, 44, 20, 0, 0, TAU); ctx.stroke();
        for (let k = 0; k < 7; k++) {
          const a = (k / 7) * TAU + rt.anim * 0.0, bx = cx + Math.cos(a) * 44, by = cy - 6 + Math.sin(a) * 20 + 10 * f * Math.sin(rt.anim * 40 + k);
          ctx.fillStyle = rgrad(ctx, bx - 3, by - 3, 0, 12, [[0, '#fff0b8'], [0.5, '#b8862c'], [1, '#5a3a0a']]); circ(ctx, bx, by + 6, 9); ctx.fill(); ctx.strokeStyle = '#3a2408'; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.fillStyle = '#2a1804'; circ(ctx, bx, by + 10, 2.2); ctx.fill();
        }
        if (f > 0.05) { ctx.strokeStyle = rgba('#ffe9a8', 0.7 * f); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy - 6, 56 + 26 * (1 - f), 0, TAU); ctx.stroke(); }
        h.labels.push({ v: cx, u: cy + 40, s: h.K.lanes[i].name, w: 120, col: '#e8b868', f, o: {} });
        return true;
      },
    }),
  });
}

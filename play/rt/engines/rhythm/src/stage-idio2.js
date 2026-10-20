// Bells & Log Drums stages (1.26.0): the ekwe (a carved box slit drum in a blue-washed room), the agogo (four slabs of forged iron on a bench in a smithy)
// and the great bell (a big bronze bell in a timber frame struck by a swinging log, mountains at dawn). Each has its own silhouette, material, light and voice.
// No performer and no hands: a bare stick visits the struck tongue, an iron rod visits the struck slab, the hung log swings into the bell.
import { rSpot, eSpot } from './drum-kit.js';
import { mkGong, visit } from './stage-gongs.js';
import { WALLS } from './room-kit.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU, PI, lerp, glow, beam, rings, padBeater } from './gong-kit.js';

const poly = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };

// ============================================================ EKWE (box slit drum, three-quarter view from above) =============================
// A rectangular hardwood box in camwood red: the top is seen as a trapezoid with a long slit that pinches at the waist, so the thick near lip and the thin far lip
// are two tongues with two pitches; the front is chalked and charcoaled with spirals and chevrons. Room: indigo-washed walls with a white painted frieze,
// pale stone floor, a lamp pool on the drum.
WALLS.indigo = (ctx, A, b, o) => {
  ctx.fillStyle = vgrad(ctx, A.y, b, [[0, darker(o.c1, 0.45)], [0.55, o.c1], [1, lighter(o.c1, 0.1)]]); ctx.fillRect(A.x, A.y, A.w, b - A.y);
  for (let k = 0; k < 90; k++) { ctx.fillStyle = `rgba(${hash(k) > 0.5 ? '170,200,240' : '6,12,30'},${0.04 + 0.07 * hash(k + 3)})`; ell(ctx, A.x + hash(k * 2.3) * A.w, A.y + hash(k * 1.9 + 2) * (b - A.y), 10 + 40 * hash(k + 5), 4 + 14 * hash(k + 7)); ctx.fill(); }
  // a painted white frieze: a band of nested diamonds and dots
  const h = (b - A.y), y0 = A.y + h * 0.36, bh = h * 0.2, n = Math.max(4, Math.round(A.w / (bh * 1.1))), cw = A.w / n;
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(A.x, y0 - 4, A.w, bh + 8);
  ctx.fillStyle = '#efe8d8'; ctx.fillRect(A.x, y0, A.w, 5); ctx.fillRect(A.x, y0 + bh - 5, A.w, 5);
  for (let k = 0; k < n; k++) { const cx = A.x + (k + 0.5) * cw, cy = y0 + bh / 2, r = Math.min(cw, bh) * 0.42; ctx.fillStyle = '#efe8d8'; poly(ctx, [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]]); ctx.fill(); ctx.fillStyle = darker(o.c1, 0.2); poly(ctx, [[cx, cy - r * 0.62], [cx + r * 0.62, cy], [cx, cy + r * 0.62], [cx - r * 0.62, cy]]); ctx.fill(); ctx.fillStyle = '#d8643a'; circ(ctx, cx, cy, r * 0.2); ctx.fill(); ctx.fillStyle = '#efe8d8'; circ(ctx, cx + cw / 2, cy, 3); ctx.fill(); }
};
const EK = [['low', /low|near|thick|deep|boom/], ['high', /high|far|thin|bright|ring/], ['body', /body|front|side|belly|box/], ['rim', /rim|end|tick|click|edge/]];
mkGong('ekwe', /ekwe|ufie|box.?slit|slit.?box|igbo.?slit|slit.?drum.?box/, {
  wall: { kind: 'indigo', c1: '#2c4a78' }, floor: { kind: 'stone', c1: '#c8bda8' }, rail: '#efe8d8', light: '#ffd9a0', vig: 0.58,
  zones: EK,
  build: (K) => {
    const tall = K.tall, ref = tall ? { w: 760, h: 900 } : { w: 1100, h: 600 }, by = {};
    const W = tall ? 300 : 360, yT = tall ? 250 : 130, yF = tall ? 410 : 262, H = tall ? 190 : 130, bw = W * 0.8, yc = (yT + yF) / 2 + 4, Sx = W * 0.62, hs = (yF - yT) * 0.23;
    by.low = rSpot(0, yc + (yF - yc) * 0.52, Sx * 0.92, (yF - yc) * 0.4, 0, {}); by.high = rSpot(0, yT + (yc - yT) * 0.5, Sx * 0.8, (yc - yT) * 0.34, 0, {});
    by.body = rSpot(0, yF + H * 0.5, W * 0.8, H * 0.32, 0, {}); by.rim = rSpot(W * 0.86, yc, W * 0.1, (yF - yT) * 0.36, 0, {});
    const floorY = yF + H + (tall ? 80 : 46);
    return { ref, by, wallU: yF + H * 0.55,
      draw(ctx, rt, fl) {
        const fL = fl('low'), fH = fl('high'), fB = fl('body'), fR = fl('rim'), fm = Math.max(fL, fH, fB, fR), wob = Math.sin(rt.anim * 40) * fm * 1.4;
        const top = [[-bw, yT], [bw, yT], [W, yF], [-W, yF]];
        ctx.fillStyle = 'rgba(0,0,0,0.42)'; ell(ctx, 14, floorY + 4, W * 1.05, 30); ctx.fill();
        // two carved feet under the box
        for (const sx of [-1, 1]) { const x0 = sx * W * 0.66; ctx.fillStyle = hgrad(ctx, x0 - 52, x0 + 52, [[0, '#2a1008'], [0.35, '#7a3a20'], [1, '#2a1008']]); poly(ctx, [[x0 - 46, yF + H - 6], [x0 + 46, yF + H - 6], [x0 + 64, floorY], [x0 - 64, floorY]]); ctx.fill(); ctx.strokeStyle = 'rgba(20,6,2,0.8)'; ctx.lineWidth = 2.4; ctx.stroke(); }
        ctx.save(); ctx.translate(0, wob);
        // the front face of the box: camwood red, bulging a little at the foot
        const front = (g) => { g.beginPath(); g.moveTo(-W, yF); g.lineTo(W, yF); g.lineTo(W + 6, yF + H * 0.9); g.quadraticCurveTo(W, yF + H + 8, W - 20, yF + H + 8); g.lineTo(-W + 20, yF + H + 8); g.quadraticCurveTo(-W, yF + H + 8, -W - 6, yF + H * 0.9); g.closePath(); };
        ctx.save(); ctx.translate(10, 14); front(ctx); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill(); ctx.restore();
        front(ctx); ctx.fillStyle = vgrad(ctx, yF, yF + H, [[0, '#b04a28'], [0.4, '#92331c'], [1, '#4a160c']]); ctx.fill();
        ctx.save(); front(ctx); ctx.clip(); grain(ctx, -W, yF, 2 * W, H, '#2a0a04', 0.35, 4, false, 40);
        // chalk chevron band and spirals in white and charcoal
        const nb = 14; for (let k = 0; k < nb; k++) { const x = -W + (k + 0.5) * (2 * W / nb), y = yF + H * 0.2; ctx.fillStyle = '#efe6d0'; poly(ctx, [[x - 14, y], [x + 14, y], [x, y + 22]]); ctx.fill(); ctx.fillStyle = '#1a0a06'; poly(ctx, [[x - 6, y], [x + 6, y], [x, y + 9]]); ctx.fill(); }
        for (let k = 0; k < 4; k++) { const x = -W * 0.75 + k * W * 0.5, y = yF + H * 0.62; ctx.strokeStyle = '#efe6d0'; ctx.lineWidth = 4.4; ctx.beginPath(); for (let t = 0; t <= 30; t++) { const a = t * 0.42, r = 2 + t * (H * 0.0105); const px = x + Math.cos(a) * r * 1.3, py = y + Math.sin(a) * r; t ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); ctx.strokeStyle = '#1a0a06'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(x + 26, y - 8); ctx.bezierCurveTo(x + 50, y - 40, x + 70, y + 26, x + 90, y - 4); ctx.stroke(); }
        ctx.fillStyle = hgrad(ctx, -W, W, [[0, 'rgba(0,0,0,0.3)'], [0.15, 'rgba(0,0,0,0)'], [0.85, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.3)']]); ctx.fillRect(-W, yF, 2 * W, H + 10);
        ctx.fillStyle = vgrad(ctx, yF, yF + 40, [[0, 'rgba(255,214,170,0.45)'], [1, 'rgba(255,214,170,0)']]); ctx.fillRect(-W, yF, 2 * W, 40);
        if (fB > 0.05) { ctx.fillStyle = `rgba(255,214,150,${0.32 * fB})`; ctx.fillRect(-W, yF, 2 * W, H + 10); }
        ctx.restore(); front(ctx); ctx.strokeStyle = 'rgba(20,6,2,0.9)'; ctx.lineWidth = 2.6; ctx.stroke();
        // the top face
        poly(ctx, top); ctx.fillStyle = vgrad(ctx, yT, yF, [[0, '#8e3a20'], [0.5, '#c4562e'], [1, '#d97a48']]); ctx.fill();
        ctx.save(); poly(ctx, top); ctx.clip(); grain(ctx, -W, yT, 2 * W, yF - yT, '#3a1006', 0.35, 6, false, 34);
        ctx.fillStyle = hgrad(ctx, -W, W, [[0, 'rgba(0,0,0,0.18)'], [0.5, 'rgba(255,230,190,0.12)'], [1, 'rgba(0,0,0,0.2)']]); ctx.fillRect(-W, yT, 2 * W, yF - yT);
        // the slit: a long mouth that pinches at the waist
        const hh = (x) => hs * (1 - 0.46 * Math.exp(-Math.pow(x / (Sx * 0.16), 2))), N = 40;
        const slit = (g, grow = 0) => { g.beginPath(); for (let i = 0; i <= N; i++) { const x = -Sx + 2 * Sx * i / N; const y = yc - hh(x) - grow; i ? g.lineTo(x, y) : g.moveTo(x, y); } for (let i = N; i >= 0; i--) { const x = -Sx + 2 * Sx * i / N; g.lineTo(x, yc + hh(x) + grow); } g.closePath(); };
        ctx.save(); ctx.translate(0, 7); slit(ctx, 5); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill(); ctx.restore();
        slit(ctx, 5); ctx.fillStyle = '#5a2010'; ctx.fill();
        slit(ctx); ctx.fillStyle = vgrad(ctx, yc - hs, yc + hs, [[0, '#050202'], [0.7, '#1e0c06'], [1, '#4a2a18']]); ctx.fill(); ctx.strokeStyle = 'rgba(20,6,2,0.9)'; ctx.lineWidth = 2.2; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,214,160,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= N; i++) { const x = -Sx + 2 * Sx * i / N; const y = yc + hh(x) + 5; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
        if (fL > 0.05) { ctx.fillStyle = `rgba(255,220,160,${0.38 * fL})`; rrect(ctx, -Sx, yc + hs * 0.5, 2 * Sx, (yF - yc) * 0.78, 12); ctx.fill(); }
        if (fH > 0.05) { ctx.fillStyle = `rgba(255,220,160,${0.38 * fH})`; rrect(ctx, -Sx, yT + 10, 2 * Sx, (yc - yT) * 0.72, 12); ctx.fill(); }
        if (fR > 0.05) { ctx.fillStyle = `rgba(255,220,160,${0.4 * fR})`; rrect(ctx, W * 0.74, yT + 8, W * 0.2, yF - yT - 14, 8); ctx.fill(); }
        ctx.restore(); poly(ctx, top); ctx.strokeStyle = 'rgba(20,6,2,0.9)'; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,230,190,0.5)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-W + 2, yF); ctx.lineTo(W - 2, yF); ctx.stroke();
        ctx.restore();
        // the bare sticks: one visits the struck tongue, the other rests on the floor in front of the box
        const tg = [[fL, -Sx * 0.3, yc + (yF - yc) * 0.52], [fH, Sx * 0.3, yT + (yc - yT) * 0.5], [fB, 0, yF + H * 0.55], [fR, W * 0.86, yc]].sort((a, b) => b[0] - a[0])[0];
        visit(ctx, tg[1], tg[2], tg[0], { dir: [0.5, -0.9], back: 110, len: 260, hr: 8, ang: 2.4, pad: '#d8b078', wood: '#a87a46' });
        if (!(tg[0] > 0.06)) { padBeater(ctx, -W * 0.5, floorY + (tall ? 40 : 24), -0.03, 260, 8, { pad: '#d8b078', wood: '#a87a46' }); padBeater(ctx, -W * 0.3, floorY + (tall ? 64 : 38), 0.02, 240, 8, { pad: '#d8b078', wood: '#a87a46' }); }
      } };
  },
});

// ============================================================ AGOGO (four slabs of forged iron on a bench, in a smithy) ===========================
// Tall flattened cones welded from two plates, each with a weld bead down the middle and a row of rivets, standing in sockets on a bench with iron straps.
// Room: a smithy: sooty brick, a glowing hearth arch at the left, tongs and hammers hung on the wall, an earth floor with embers.
WALLS.smithy = (ctx, A, b, o) => {
  const h = b - A.y; ctx.fillStyle = vgrad(ctx, A.y, b, [[0, '#0c0a0a'], [1, '#2a2220']]); ctx.fillRect(A.x, A.y, A.w, h);
  const bh = Math.max(26, h / 9), bw = bh * 2.2;
  for (let r = 0, y = A.y; y < b; r++, y += bh) for (let x = A.x - (r % 2) * bw / 2; x < A.x + A.w; x += bw) { const c = hash(r * 31 + x * 0.1); ctx.fillStyle = rgba(mix('#2a2220', '#4a3a34', c), 0.9); ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4); ctx.fillStyle = `rgba(255,140,60,${0.03 + 0.06 * hash(x + y)})`; ctx.fillRect(x + 2, y + 2, bw - 4, 4); }
  // hearth arch with live coals
  const hx = A.x + A.w * 0.1, hw = Math.min(A.w * 0.26, 300), hy = b - h * 0.5;
  ctx.fillStyle = '#080606'; ctx.beginPath(); ctx.moveTo(hx, b); ctx.lineTo(hx, hy + hw * 0.4); ctx.quadraticCurveTo(hx + hw * 0.5, hy - hw * 0.2, hx + hw, hy + hw * 0.4); ctx.lineTo(hx + hw, b); ctx.closePath(); ctx.fill();
  ctx.fillStyle = rgrad(ctx, hx + hw / 2, b - h * 0.08, 0, hw * 0.7, [[0, '#fff2b0'], [0.25, '#ff9a30'], [0.6, '#b8300c'], [1, 'rgba(60,10,4,0)']]); ctx.fillRect(hx, hy - 10, hw, b - hy + 10);
  for (let k = 0; k < 18; k++) { ctx.fillStyle = `rgba(255,${120 + 100 * hash(k)},40,${0.5 + 0.4 * hash(k + 4)})`; ell(ctx, hx + hw * (0.1 + 0.8 * hash(k * 3)), b - h * (0.02 + 0.12 * hash(k + 6)), 8 + 14 * hash(k), 4 + 6 * hash(k + 2)); ctx.fill(); }
  ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(hx - 6, b); ctx.lineTo(hx - 6, hy + hw * 0.4); ctx.quadraticCurveTo(hx + hw * 0.5, hy - hw * 0.26, hx + hw + 6, hy + hw * 0.4); ctx.lineTo(hx + hw + 6, b); ctx.stroke();
  // tongs and hammers hung on pegs on the right
  ctx.strokeStyle = '#0a0808'; ctx.fillStyle = '#0a0808'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  for (let k = 0; k < 3; k++) { const x = A.x + A.w * (0.74 + k * 0.08), y = A.y + h * 0.18; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (k - 1) * 8, y + h * 0.3); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 14, y + h * 0.3); ctx.lineTo(x + 10 + (k - 1) * 8, y + h * 0.3); ctx.lineWidth = 12; ctx.stroke(); ctx.lineWidth = 7; ctx.fillStyle = '#d8a060'; circ(ctx, x, y - 4, 4); ctx.fill(); ctx.fillStyle = '#0a0808'; }
  ctx.fillStyle = rgrad(ctx, hx + hw / 2, b, 0, A.w * 0.6, [[0, 'rgba(255,140,50,0.34)'], [1, 'rgba(255,100,30,0)']]); ctx.fillRect(A.x, A.y, A.w, h);
};
const AG = [['a', /low|deep|big|large|tall/], ['b', /mid.*low|^mid$|medium/], ['c', /mid.*high|small/], ['d', /high|top|tiny|bright/]];
function slab(ctx, cx, yb, h, bw, f, hearthX, seed) {
  const tw = bw * 0.5, ry = bw * 0.16, col = '#3c4048';
  // a hand-forged outline: the edges are slightly uneven (hammer marks), the shoulders are rounded, the foot flares into a thick lip
  const W = (t) => tw + (bw - tw) * Math.pow(t, 1.15) + (t > 0.86 ? bw * 0.2 * Math.pow((t - 0.86) / 0.14, 2) : 0) + (hash(seed + Math.round(t * 22) * 1.3) - 0.5) * 3.2;
  const side = (g) => { g.beginPath(); const N = 26, top = yb - h; g.moveTo(cx - tw * 0.55, top);
    g.quadraticCurveTo(cx, top - tw * 0.34, cx + tw * 0.55, top);
    for (let i = 1; i <= N; i++) { const t = i / N; g.lineTo(cx + W(t) * (0.9 + 0.1 * t) + tw * 0.1, top + tw * 0.2 + (h - tw * 0.2) * t); }
    g.ellipse(cx, yb, bw * 1.2 + tw * 0.1, ry * 1.15, 0, 0, PI);
    for (let i = N; i >= 1; i--) { const t = i / N; g.lineTo(cx - W(t) * (0.9 + 0.1 * t) - tw * 0.1, top + tw * 0.2 + (h - tw * 0.2) * t); }
    g.closePath(); };
  // the forged hanging tang: a thick iron loop above the crown
  ctx.save(); ctx.strokeStyle = '#111317'; ctx.lineWidth = tw * 0.62; ctx.beginPath(); ctx.ellipse(cx, yb - h - tw * 0.2, tw * 0.62, tw * 0.78, 0, 0, TAU); ctx.stroke();
  ctx.strokeStyle = '#7d848d'; ctx.lineWidth = tw * 0.22; ctx.beginPath(); ctx.ellipse(cx - 1, yb - h - tw * 0.24, tw * 0.62, tw * 0.78, 0, PI * 0.9, PI * 1.7); ctx.stroke(); ctx.restore();
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.save(); ctx.translate(14, 6); side(ctx); ctx.fill(); ctx.restore();
  side(ctx); ctx.fillStyle = hgrad(ctx, cx - bw, cx + bw, [[0, '#101216'], [0.2, '#5a6068'], [0.45, col], [0.5, '#24282e'], [0.62, '#3a3e46'], [0.86, '#181a1e'], [1, '#0a0b0e']]); ctx.fill();
  ctx.save(); side(ctx); ctx.clip();
  // heat from the hearth on the near side, forge scale and hammer facets
  const warm = clamp(1 - Math.abs(cx - hearthX) / 900, 0, 1) * 0.5;
  ctx.fillStyle = hgrad(ctx, cx - bw, cx + bw, [[0, `rgba(255,120,40,${0.4 * warm + 0.1})`], [0.5, 'rgba(255,120,40,0)'], [1, 'rgba(255,120,40,0)']]); ctx.fillRect(cx - bw, yb - h, 2 * bw, h);
  for (let k = 0; k < 60; k++) { const t = hash(seed + k * 1.7), y = yb - h + h * t, w = tw + (bw - tw) * Math.pow(t, 1.2), x = cx + (hash(seed + k * 3.1) - 0.5) * w * 1.8; ctx.fillStyle = hash(k + seed) > 0.5 ? 'rgba(0,0,0,0.2)' : 'rgba(180,200,230,0.1)'; ell(ctx, x, y, 3 + 9 * hash(k + 2), 2 + 5 * hash(k + 5)); ctx.fill(); }
  // hammered dimples (lit top-left, dark bottom-right) and a rolled flange along both edges
  for (let k = 0; k < 26; k++) { const t = 0.08 + 0.86 * hash(seed + k * 2.9), w = W(t), x = cx + (hash(seed + k * 4.3) - 0.5) * w * 1.5, y = yb - h + h * t, r = 4 + 6 * hash(seed + k); ctx.fillStyle = 'rgba(0,0,0,0.28)'; ell(ctx, x + 1, y + 1, r, r * 0.7); ctx.fill(); ctx.strokeStyle = 'rgba(210,222,240,0.28)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.7, 0, PI * 0.95, PI * 1.6); ctx.stroke(); }
  side(ctx); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(8,9,12,0.55)'; ctx.lineWidth = 15; ctx.stroke(); ctx.strokeStyle = 'rgba(150,160,175,0.5)'; ctx.lineWidth = 6; ctx.stroke();
  // the weld bead down the middle with a double row of rivets
  ctx.strokeStyle = '#8a9098'; ctx.lineWidth = 5; ctx.beginPath(); for (let t = 0; t <= 12; t++) { const y = yb - h + tw * 0.2 + (h - tw * 0.2) * t / 12; const x = cx + (hash(seed + t) - 0.5) * 3; t ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.strokeStyle = '#14161a'; ctx.lineWidth = 1.6; ctx.stroke();
  for (let t = 1; t < 9; t++) for (const s of [-1, 1]) { const y = yb - h + h * (t / 9.5), w = tw + (bw - tw) * Math.pow(t / 9.5, 1.2); ctx.fillStyle = rgrad(ctx, cx + s * w * 0.18 - 1, y - 1, 0, 4, [[0, '#d0d6dc'], [1, '#3a3e46']]); circ(ctx, cx + s * w * 0.18, y, 3.2); ctx.fill(); }
  ctx.fillStyle = hgrad(ctx, cx - bw, cx + bw, [[0.06, 'rgba(255,255,255,0)'], [0.16, 'rgba(230,240,255,0.5)'], [0.26, 'rgba(255,255,255,0)'], [0.74, 'rgba(255,255,255,0)'], [0.84, 'rgba(255,180,120,0.3)'], [0.92, 'rgba(255,255,255,0)']]); ctx.fillRect(cx - bw, yb - h, 2 * bw, h);
  ctx.restore(); side(ctx); ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.lineWidth = 2.2; ctx.stroke();
  // the open mouth at the foot is hidden by the bench socket; a bright lip line above it
  ctx.strokeStyle = 'rgba(210,220,235,0.55)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.ellipse(cx, yb, bw, ry, 0, 0.1, PI - 0.1); ctx.stroke();
  if (f > 0.05) { ctx.globalCompositeOperation = 'lighter'; side(ctx); ctx.fillStyle = `rgba(255,190,110,${0.3 * f})`; ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
  ctx.restore();
}
mkGong('agogo', /agogo|cigogo|slab.?bell|forged.?bell|dawuro|iron.?slab|clapperless/, {
  wall: { kind: 'smithy' }, floor: { kind: 'earth', c1: '#2e2018' }, rail: '#1a1210', light: '#ff9a50', vig: 0.62,
  zones: AG,
  build: (K) => {
    const tall = K.tall, ref = tall ? { w: 780, h: 880 } : { w: 1120, h: 600 }, by = {};
    const gx = tall ? 150 : 215, xs = [-1.5, -0.5, 0.5, 1.5].map((m) => m * gx), hs = tall ? [440, 380, 325, 275] : [330, 285, 245, 205], bws = tall ? [74, 66, 59, 52] : [86, 77, 69, 61];
    const yb = tall ? 640 : 438, keys = ['a', 'b', 'c', 'd'];
    keys.forEach((k, i) => { by[k] = eSpot(xs[i], yb - hs[i] * 0.4, bws[i] * 0.62, hs[i] * 0.3, 0, { apk: 0.9 }); });
    return { ref, by, wallU: yb - 20,
      draw(ctx, rt, fl) {
        const fs = keys.map((k) => fl(k)), hearthX = -ref.w / 2;
        // the bench: a thick oak plank on two stumps with iron straps and sockets for the slabs
        const bw0 = gx * 3.5, by0 = yb + 4;
        ctx.fillStyle = 'rgba(0,0,0,0.45)'; ell(ctx, 16, yb + (tall ? 130 : 96), bw0 + 40, 26); ctx.fill();
        for (const sx of [-1, 1]) { const x0 = sx * bw0 * 0.72; ctx.fillStyle = hgrad(ctx, x0 - 60, x0 + 60, [[0, '#100804'], [0.3, '#5a3a22'], [0.6, '#2e1c10'], [1, '#0a0402']]); rrect(ctx, x0 - 56, by0 + 30, 112, tall ? 130 : 96, 10); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#2a2c32'; ctx.fillRect(x0 - 58, by0 + 50, 116, 12); }
        beam(ctx, -bw0, by0 - 8, 2 * bw0, 48, '#5a3a22', { round: 10, seed: 7 });
        ctx.fillStyle = '#23252b'; for (const sx of [-0.72, 0.72]) ctx.fillRect(sx * bw0 - 8, by0 - 8, 16, 48);
        // slabs
        keys.forEach((k, i) => {
          slab(ctx, xs[i], yb, hs[i], bws[i], fs[i], hearthX, 3 + i * 7);
          ctx.fillStyle = hgrad(ctx, xs[i] - bws[i] * 1.3 - 10, xs[i] + bws[i] * 1.3 + 10, [[0, '#101216'], [0.3, '#6a7078'], [0.6, '#30343a'], [1, '#0a0b0e']]); rrect(ctx, xs[i] - bws[i] * 1.3 - 8, yb - 4, 2.6 * bws[i] + 16, 20, 5); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 1.6; ctx.stroke();
          if (fs[i] > 0.05) { rings(ctx, xs[i], yb - hs[i] * 0.4, bws[i] * 0.9, fs[i], '255,200,140'); glow(ctx, xs[i], yb - hs[i] * 0.5, bws[i] * 2.4, '#ff9a50', 0.26 * fs[i]); }
        });
        const j = fs.indexOf(Math.max(...fs)), f = fs[j];
        visit(ctx, xs[j] + bws[j] * 0.3, yb - hs[j] * 0.4, f, { dir: [0.8, -0.5], back: 110, len: 270, hr: 12, ang: -2.7, pad: '#2c3036', wood: '#aab0b8' });
        if (!(f > 0.06)) { padBeater(ctx, -gx * 1.9, yb + (tall ? 110 : 84), -0.03, 300, 12, { pad: '#2c3036', wood: '#aab0b8' }); }
      } };
  },
});

// ============================================================ GREAT BELL (bronze bell in a timber frame, struck by a hung log) ====================
// A big bronze bell with a flat crown and a flared lip, green-brown with raised bands and panels of studs, hung from a heavy cross beam between two posts.
// A log hangs on two chains and swings into the bell. Room: a cool dawn: pink to pale-blue sky, layered misty mountains, pale stone slabs.
WALLS.dawn = (ctx, A, b, o) => {
  const h = b - A.y; ctx.fillStyle = vgrad(ctx, A.y, b, [[0, '#8fb2d0'], [0.45, '#f0cdb6'], [0.8, '#f8e6c8'], [1, '#e8d2b0']]); ctx.fillRect(A.x, A.y, A.w, h);
  ctx.fillStyle = rgrad(ctx, A.x + A.w * 0.72, b - h * 0.24, 0, h * 0.2, [[0, 'rgba(255,248,214,1)'], [0.35, 'rgba(255,230,180,0.7)'], [1, 'rgba(255,220,170,0)']]); ctx.fillRect(A.x, A.y, A.w, h);
  ctx.fillStyle = 'rgba(255,250,230,0.95)'; circ(ctx, A.x + A.w * 0.72, b - h * 0.24, h * 0.045); ctx.fill();
  const ridges = [[0.5, '#9ab0c4', 0.45], [0.38, '#7a96b0', 0.6], [0.26, '#587a96', 0.72], [0.14, '#38586f', 0.85]];
  ridges.forEach(([top, c, a], r) => {
    ctx.fillStyle = rgba(c, a); ctx.beginPath(); ctx.moveTo(A.x, b);
    for (let i = 0; i <= 28; i++) { const x = A.x + A.w * i / 28; ctx.lineTo(x, b - h * (top + 0.1 * Math.sin(i * 0.55 + r * 2.1) + 0.06 * Math.sin(i * 1.3 + r) + 0.04 * hash(i + r * 9))); }
    ctx.lineTo(A.x + A.w, b); ctx.closePath(); ctx.fill();
    ctx.fillStyle = vgrad(ctx, b - h * (top + 0.15), b - h * (top - 0.15), [[0, 'rgba(255,244,230,0)'], [1, 'rgba(255,244,230,0.5)']]); ctx.fillRect(A.x, b - h * (top + 0.15), A.w, h * 0.3);
  });
  for (let k = 0; k < 16; k++) { const x = A.x + A.w * hash(k * 3 + 1), y = b - h * (0.02 + 0.2 * hash(k + 3)), s = h * (0.05 + 0.05 * hash(k + 6)); ctx.fillStyle = '#243c34'; poly(ctx, [[x, y - s], [x + s * 0.28, y], [x - s * 0.28, y]]); ctx.fill(); }
  for (let k = 0; k < 4; k++) { ctx.fillStyle = 'rgba(255,255,255,0.22)'; ell(ctx, A.x + A.w * (0.15 + 0.25 * k), b - h * (0.3 + 0.06 * hash(k)), A.w * 0.2, h * 0.025); ctx.fill(); }
};
const GB = [['lip', /lip|sound.?bow|rim|low|deep/], ['waist', /waist|body|belly|mid/], ['shoulder', /shoulder|upper|high/], ['boss', /boss|stud|crown|top|knob/]];
mkGong('greatbell', /great.?bell|big.?bell|bonsho|tower.?bell|log.?bell|bell.?tower|swing.?log/, {
  wall: { kind: 'dawn' }, floor: { kind: 'stone', c1: '#a8a49a' }, rail: '#5a2c1c', light: '#fff0d8', vig: 0.42,
  zones: GB,
  build: (K) => {
    const tall = K.tall, ref = tall ? { w: 780, h: 940 } : { w: 1100, h: 620 }, by = {};
    const px = tall ? 280 : 400, beamY = tall ? 70 : 34, floorY = tall ? 840 : 560;
    const top = beamY + (tall ? 140 : 90), lip = tall ? 650 : 470, rx = tall ? 165 : 128, rt = rx * 0.36, mid = (top + lip) / 2;
    const wAt = (y) => { const t = clamp((y - top) / (lip - top), 0, 1); return rt + (rx * 0.8 - rt) * (1 - Math.pow(1 - t, 3.4)) + rx * 0.2 * Math.pow(t, 7); };
    by.lip = eSpot(0, lip - (lip - top) * 0.08, rx * 0.9, (lip - top) * 0.07, 0, {}); by.waist = eSpot(0, lip - (lip - top) * 0.34, rx * 0.8, (lip - top) * 0.12, 0, {});
    by.shoulder = eSpot(0, top + (lip - top) * 0.28, rt * 1.1, (lip - top) * 0.1, 0, {}); by.boss = eSpot(0, top + (lip - top) * 0.1, rt * 0.7, (lip - top) * 0.06, 0, {});
    const yAt = { lip: lip - (lip - top) * 0.08, waist: lip - (lip - top) * 0.34, shoulder: top + (lip - top) * 0.28, boss: top + (lip - top) * 0.1 };
    return { ref, by, wallU: floorY - 24,
      draw(ctx, rt2, fl) {
        const f = { lip: fl('lip'), waist: fl('waist'), shoulder: fl('shoulder'), boss: fl('boss') }, fmax = Math.max(f.lip, f.waist, f.shoulder, f.boss);
        const key = Object.keys(f).sort((a, b) => f[b] - f[a])[0], sway = Math.sin(rt2.anim * 9) * fmax * 0.012;
        // timber frame: two posts, a cross beam and low braces; floor slabs
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 10, floorY + 10, px + 90, 24); ctx.fill();
        for (const sx of [-1, 1]) { beam(ctx, sx * px - 26, beamY, 52, floorY - beamY, '#6a2e1c', { vertical: true, round: 8, seed: 3 + sx }); ctx.fillStyle = '#3a1a10'; ctx.fillRect(sx * px - 36, floorY - 30, 72, 34); ctx.strokeStyle = '#5a2c1c'; ctx.lineWidth = 20; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx * px - sx * 26, beamY + 190); ctx.lineTo(sx * (px - 160), beamY + 22); ctx.stroke(); ctx.strokeStyle = 'rgba(255,200,150,0.25)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(sx * px - sx * 26, beamY + 186); ctx.lineTo(sx * (px - 160), beamY + 18); ctx.stroke(); }
        beam(ctx, -px - 60, beamY - 22, 2 * px + 120, 52, '#5a2618', { round: 10, seed: 11 });
        ctx.fillStyle = '#d8b050'; for (const sx of [-1, 1]) { circ(ctx, sx * px, beamY + 4, 7); ctx.fill(); }
        // the bell
        ctx.save(); ctx.translate(0, beamY + 30); ctx.rotate(sway); ctx.translate(0, -(beamY + 30));
        ctx.strokeStyle = '#1a0e08'; ctx.lineWidth = 18; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, beamY + 28); ctx.lineTo(0, top - 6); ctx.stroke(); ctx.strokeStyle = '#8a7a4a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-4, beamY + 28); ctx.lineTo(-4, top - 6); ctx.stroke();
        const body = (g) => { g.beginPath(); g.moveTo(-rt, top); for (let i = 0; i <= 24; i++) { const y = top + (lip - top) * i / 24; g.lineTo(-wAt(y), y); } g.ellipse(0, lip, rx, rx * 0.12, 0, PI, 0, true); for (let i = 24; i >= 0; i--) { const y = top + (lip - top) * i / 24; g.lineTo(wAt(y), y); } g.closePath(); };
        ctx.save(); ctx.translate(14, 14); body(ctx); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill(); ctx.restore();
        ctx.fillStyle = '#0c0806'; ell(ctx, 0, lip, rx, rx * 0.12); ctx.fill();
        body(ctx); ctx.fillStyle = hgrad(ctx, -rx, rx, [[0, '#1c1608'], [0.16, '#9a8444'], [0.34, '#6e6030'], [0.58, '#5a4c26'], [0.84, '#2a2210'], [1, '#14100a']]); ctx.fill();
        ctx.save(); body(ctx); ctx.clip();
        // verdigris streaks running down from the crown and bands
        for (let k = 0; k < 20; k++) { const x = (hash(k * 2.7 + 1) - 0.5) * rx * 1.7, y0 = top + (lip - top) * 0.7 * hash(k + 5); ctx.fillStyle = `rgba(80,150,120,${0.12 + 0.2 * hash(k + 3)})`; rrect(ctx, x, y0, 4 + 8 * hash(k), (lip - top) * (0.1 + 0.3 * hash(k + 8)), 3); ctx.fill(); }
        // three raised bands and a band of stud panels under the crown
        for (const t of [0.04, 0.3, 0.84]) { const y = top + (lip - top) * t, w = wAt(y); ctx.fillStyle = hgrad(ctx, -w, w, [[0, '#2a2210'], [0.2, '#c8b266'], [0.5, '#7a6a36'], [1, '#2a2210']]); ctx.fillRect(-w, y - 5, 2 * w, 10); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.6; ctx.strokeRect(-w, y - 5, 2 * w, 10); }
        const sy0 = top + (lip - top) * 0.06, sy1 = top + (lip - top) * 0.28, sw = wAt(sy1);
        for (let c = 0; c < 4; c++) { const x0 = -sw + (c + 0.5) * (2 * sw / 4) * 0.98; ctx.strokeStyle = 'rgba(20,12,4,0.65)'; ctx.lineWidth = 2; ctx.strokeRect(x0 - sw / 4 * 0.84, sy0 + 6, sw / 2 * 0.84, sy1 - sy0 - 12); for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { const bx = x0 + (a - 1) * sw * 0.12, by2 = sy0 + 16 + b * (sy1 - sy0 - 32) / 2; ctx.fillStyle = rgrad(ctx, bx - 2, by2 - 2, 0, 7, [[0, '#d8c47a'], [1, '#4a3c1c']]); circ(ctx, bx, by2, 5.5); ctx.fill(); } }
        // four large panels with a pale inscription-like rule pattern over the waist
        for (let c = -1; c <= 1; c += 2) { const y0 = top + (lip - top) * 0.4, y1 = top + (lip - top) * 0.78, w0 = wAt(y1); ctx.strokeStyle = 'rgba(20,12,4,0.6)'; ctx.lineWidth = 2.2; ctx.strokeRect(c * w0 * 0.5 - w0 * 0.32, y0, w0 * 0.64, y1 - y0); for (let r = 0; r < 7; r++) { ctx.strokeStyle = 'rgba(200,184,110,0.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(c * w0 * 0.5 - w0 * 0.24, y0 + 14 + r * (y1 - y0 - 28) / 6); ctx.lineTo(c * w0 * 0.5 + w0 * 0.24, y0 + 14 + r * (y1 - y0 - 28) / 6); ctx.stroke(); } }
        ctx.fillStyle = hgrad(ctx, -rx, rx, [[0.1, 'rgba(255,255,255,0)'], [0.2, 'rgba(255,244,200,0.5)'], [0.3, 'rgba(255,255,255,0)'], [0.74, 'rgba(255,255,255,0)'], [0.82, 'rgba(255,220,160,0.2)'], [0.9, 'rgba(255,255,255,0)']]); ctx.fillRect(-rx, top, 2 * rx, lip - top);
        // a strike scar where the log lands
        ctx.fillStyle = 'rgba(30,16,4,0.35)'; ell(ctx, -wAt(lip - (lip - top) * 0.2) * 0.5, lip - (lip - top) * 0.2, 22, 14); ctx.fill();
        ctx.restore(); body(ctx); ctx.strokeStyle = 'rgba(14,10,4,0.9)'; ctx.lineWidth = 2.8; ctx.stroke();
        ctx.strokeStyle = 'rgba(232,212,140,0.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, lip, rx, rx * 0.12, 0, 0.05, PI - 0.05); ctx.stroke();
        if (fmax > 0.05) { ctx.globalCompositeOperation = 'lighter'; body(ctx); ctx.fillStyle = `rgba(255,220,150,${0.36 * fmax})`; ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
        ctx.restore();
        if (fmax > 0.05) { rings(ctx, 0, mid + 20, rx * 1.05, fmax, '255,240,200'); glow(ctx, 0, mid, rx * 2.2, '#ffd890', 0.24 * fmax); }
        // the log: two chains from the beam; at rest it hangs pulled back to the left, on a strike it swings in to the struck height
        const e = 1 - Math.pow(1 - clamp(fmax * 1.15, 0, 1), 2), ly = lerp(mid + 40, yAt[key], e), tipX = -wAt(yAt[key]) * 1.0 - 10, back = (tall ? 120 : 150) * (1 - e), Ll = tall ? 250 : 240, lr = tall ? 28 : 23;
        const ex = tipX - back, sx0 = ex - Ll;   // tip at ex, log extends left
        const tipC = -wAt(mid) - 10; for (const [fa, fx] of [[0.22, tipC - Ll * 0.78], [0.8, tipC - Ll * 0.2]]) { const a = sx0 + Ll * fa; ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(fx, beamY + 24); ctx.lineTo(a, ly - lr); ctx.stroke(); ctx.strokeStyle = '#9a9aa2'; ctx.lineWidth = 2.4; ctx.setLineDash([7, 5]); ctx.stroke(); ctx.setLineDash([]); }
        ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, sx0 + 8, ly - lr + 12, Ll, lr * 2, lr); ctx.fill();
        ctx.fillStyle = vgrad(ctx, ly - lr, ly + lr, [[0, '#d09a62'], [0.35, '#8a5a30'], [1, '#2e1808']]); rrect(ctx, sx0, ly - lr, Ll, lr * 2, lr * 0.5); ctx.fill(); ctx.strokeStyle = 'rgba(30,14,4,0.9)'; ctx.lineWidth = 2.4; ctx.stroke();
        ctx.save(); rrect(ctx, sx0, ly - lr, Ll, lr * 2, lr * 0.5); ctx.clip(); grain(ctx, sx0, ly - lr, Ll, lr * 2, '#2a1004', 0.4, 5, false, 18); ctx.restore();
        ctx.fillStyle = '#26282e'; for (const a of [sx0 + Ll * 0.2, sx0 + Ll * 0.78]) ctx.fillRect(a - 8, ly - lr - 4, 16, lr * 2 + 8);
        ctx.fillStyle = '#c8b270'; ctx.fillRect(ex - 12, ly - lr, 12, lr * 2);
        ctx.restore();
      } };
  },
});
void TAU;

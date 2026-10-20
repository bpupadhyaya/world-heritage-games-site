// Island drums, second half (1.23.1): the kundu (a tall carved hourglass drum in a rainforest), the lagerphone (a pole studded with flattened bottle caps in a
// shearing shed) and the stamping tubes (a rack of bamboo tubes on a beach at sunset). Each is its own picture, composition, room and voice.
import { registerDrumStage } from './registry.js';
import { createDrumStage, eSpot, eRing, rectSpot, assignZones, staticLayer, rot2 } from './drum-kit.js';
import { defVoice } from './voice-synth2.js';
import { registerStrikeVoice } from './voice-registry.js';
import { pool, vignette } from './set.js';
import { floorShadow, blob, speckle, bulb, skinHead, hoop } from './drum-side.js';
import { PI, TAU, clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, lerp, d2r, fl, woodH, stick, visitStick, thread } from './asia-kit.js';
import { wallBottom, withLayer } from './stage-asia1.js';

// ======================================================================================================================================================
// KUNDU: a tall hand drum with a waist, carved from one piece of wood, a stretched hide over the top, a carved grip at the waist and an open foot. The body is
// incised with bands of chevrons painted ochre, white and black. Room: a rainforest clearing, big layered leaves, mist and a slant of light, mossy ground.
// ======================================================================================================================================================
const KUN = [['c', /centre|center|^low|boom|^open/], ['e', /edge|ring|slap|^high/], ['g', /grip|handle|waist|knock|wood/], ['m', /mouth|foot|open.?end|bass|hole/]];
function rainforest(ctx, F, rt, S, scene) {
  const A = F.area, wallB = wallBottom(F, scene), wallH = wallB - A.y;
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
  ctx.fillStyle = vgrad(ctx, A.y, wallB, [[0, '#0a2418'], [0.4, '#1c5a3a'], [0.8, '#5a9a5a'], [1, '#c8d890']]); ctx.fillRect(A.x, A.y, A.w, wallH);
  // light shafts and mist
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const [fx, w, a] of [[0.3, 0.12, 0.2], [0.55, 0.16, 0.16], [0.8, 0.1, 0.18]]) { const g = ctx.createLinearGradient(A.x + A.w * fx, A.y, A.x + A.w * (fx - 0.12), wallB); g.addColorStop(0, `rgba(255,244,190,${a})`); g.addColorStop(1, 'rgba(255,244,190,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(A.x + A.w * fx, A.y); ctx.lineTo(A.x + A.w * (fx + w), A.y); ctx.lineTo(A.x + A.w * (fx + w - 0.2), wallB); ctx.lineTo(A.x + A.w * (fx - 0.2), wallB); ctx.closePath(); ctx.fill(); } ctx.restore();
  // big leaves in three depths: tall taro-like blades with a midrib and veins
  const leaf = (x, y, L, W, a, col) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(L * 0.5 + 6, 8, L * 0.5, W * 0.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = vgrad(ctx, -W / 2, W / 2, [[0, lighter(col, 0.25)], [1, darker(col, 0.4)]]); ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(L * 0.2, -W * 0.6, L * 0.75, -W * 0.5, L, 0); ctx.bezierCurveTo(L * 0.75, W * 0.5, L * 0.2, W * 0.6, 0, 0); ctx.fill(); ctx.strokeStyle = 'rgba(210,240,180,0.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(L * 0.96, 0); ctx.stroke(); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(210,240,180,0.3)'; for (let k = 1; k < 8; k++) { const t = k / 8; ctx.beginPath(); ctx.moveTo(L * t, 0); ctx.lineTo(L * (t + 0.12), -W * 0.38 * Math.sin(PI * t)); ctx.moveTo(L * t, 0); ctx.lineTo(L * (t + 0.12), W * 0.38 * Math.sin(PI * t)); ctx.stroke(); } ctx.restore(); };
  const u = Math.min(A.w, wallH);
  for (let k = 0; k < 9; k++) leaf(A.x + A.w * (0.05 + 0.9 * hash(k * 3 + 1)), A.y + wallH * (0.1 + 0.4 * hash(k * 5 + 2)), u * (0.4 + 0.3 * hash(k + 7)), u * (0.16 + 0.1 * hash(k + 3)), PI * (0.25 + 0.5 * hash(k + 9)) + (k % 2 ? 0.4 : -0.2), mix('#1a6a3a', '#2a8a4a', hash(k + 5)));
  for (let k = 0; k < 6; k++) leaf(A.x + A.w * (hash(k * 7 + 1) < 0.5 ? -0.02 : 1.02), A.y + wallH * (0.35 + 0.5 * hash(k * 3 + 2)), u * (0.55 + 0.2 * hash(k)), u * (0.24 + 0.1 * hash(k + 4)), hash(k * 7 + 1) < 0.5 ? -0.3 + 0.3 * hash(k) : PI + 0.3 - 0.3 * hash(k), mix('#0e4a2a', '#1a6a3a', hash(k + 2)));
  for (let k = 0; k < 4; k++) { ctx.fillStyle = rgrad(ctx, A.x + A.w * (0.2 + 0.2 * k), A.y + wallH * (0.5 + 0.1 * (k % 2)), 0, A.w * 0.3, [[0, 'rgba(220,240,225,0.22)'], [1, 'rgba(220,240,225,0)']]); ctx.fillRect(A.x, A.y + wallH * 0.3, A.w, wallH * 0.5); }
  // hanging vines
  for (let k = 0; k < 7; k++) { const x = A.x + A.w * (0.08 + 0.84 * hash(k * 9 + 2)), L = wallH * (0.2 + 0.3 * hash(k + 5)); ctx.strokeStyle = '#0a2a14'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, A.y); ctx.bezierCurveTo(x + 18, A.y + L * 0.3, x - 16, A.y + L * 0.7, x + 8, A.y + L); ctx.stroke(); }
  // mossy ground with roots and fallen leaves
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(A.x, wallB - 2, A.w, 6);
  const fh = A.y + A.h - wallB; ctx.fillStyle = vgrad(ctx, wallB, A.y + A.h, [[0, '#2e4a20'], [0.5, '#1a2e12'], [1, '#0a1608']]); ctx.fillRect(A.x, wallB, A.w, fh);
  for (let k = 0; k < 40; k++) { blob(ctx, A.x + A.w * hash(k * 3 + 1), wallB + fh * hash(k * 5 + 2), 26 + 40 * hash(k + 4), k * 5 + 1, 12, 0.6); ctx.fillStyle = rgba(hash(k) > 0.5 ? '#5a8a30' : '#1a3a12', 0.3); ctx.fill(); }
  for (let k = 0; k < 24; k++) { ctx.fillStyle = rgba(['#c8a030', '#a85a1c', '#d8c860'][k % 3], 0.5); ctx.save(); ctx.translate(A.x + A.w * hash(k * 7 + 2), wallB + fh * (0.1 + 0.85 * hash(k * 3 + 1))); ctx.rotate(hash(k) * TAU); ell(ctx, 0, 0, 12, 5); ctx.fill(); ctx.restore(); }
  ctx.restore(); vignette(ctx, A, 0.55);
}
registerDrumStage({
  id: 'kundu', match: /kundu|hourglass.?hand|waisted.?hand/,
  build: (S, lanes, P) => { const zoneOf = []; return createDrumStage('kundu', S, lanes, P, {
    heroClean: true, dress: withLayer(rainforest),
    voiceOf: (i) => `kundu-${zoneOf[i] ?? 'c'}`,
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 960 } : { w: 1040, h: 580 }, keyOf = assignZones(K, KUN.map(([key, re]) => ({ key, re })));
      for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const Rt = tall ? 140 : 96, Rw = Rt * 0.36, Rf = Rt * 0.72, ryk = 0.3, yT = tall ? 190 : 100, H = tall ? 600 : 360, cx = tall ? 0 : -20, yB = yT + H, by = {};
      by.c = eSpot(cx, yT, Rt * 0.46, Rt * 0.46 * ryk, 0, { apk: 0.95 }); by.e = eRing(cx, yT, Rt, Rt * ryk, 0, 0.62, 0.98, PI / 2);
      by.g = rectSpot(cx + Rt * 0.3, yT + H * 0.52, Rt * 0.55, H * 0.07, 0, { rad: 10 });
      by.m = eSpot(cx, yB, Rf * 0.7, Rf * 0.7 * ryk, 0, { apk: 0.9 });
      const spots = new Array(K.N).fill(null); for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
      const rAt = (t) => { const s = Math.abs(t - 0.52) / 0.52; return t < 0.52 ? lerp(Rw, Rt * 0.96, Math.pow(s, 1.6)) : lerp(Rw, Rf, Math.pow(s, 1.3)); };
      const layer = staticLayer();
      const paint = (ctx) => {
        const N = 40, path = () => { ctx.beginPath(); for (let k = 0; k <= N; k++) { const t = k / N; ctx.lineTo(cx - rAt(t), yT + H * t); } ctx.ellipse(cx, yB, rAt(1), rAt(1) * ryk, 0, PI, 0, true); for (let k = N; k >= 0; k--) { const t = k / N; ctx.lineTo(cx + rAt(t), yT + H * t); } ctx.closePath(); };
        ctx.save(); ctx.translate(14, 18); path(); ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.fill(); ctx.restore();
        const col = '#6a3a1c'; path(); ctx.fillStyle = hgrad(ctx, cx - Rt, cx + Rt, [[0, darker(col, 0.6)], [0.14, darker(col, 0.25)], [0.3, lighter(col, 0.35)], [0.42, lighter(col, 0.1)], [0.62, col], [0.88, darker(col, 0.5)], [1, darker(col, 0.78)]]); ctx.fill();
        ctx.save(); path(); ctx.clip(); grain(ctx, cx - Rt, yT, 2 * Rt, H + 30, '#1a0a02', 0.45, 5, true, 30);
        // incised bands: ochre chevrons, white triangles and a black zigzag, wrapped round the cylinder
        const wrap = (t, n, fn) => { for (let k = 0; k < n; k++) { const th = -PI / 2 + PI * (k + 0.5) / n, c = Math.cos(th), x = cx + Math.sin(th) * rAt(t) * 0.98; ctx.save(); ctx.translate(x, yT + H * t); ctx.scale(Math.max(0.15, c), 1); fn(c); ctx.restore(); } };
        for (const [t0, t1, c] of [[0.08, 0.14, '#d8a040'], [0.64, 0.7, '#e8e0cc'], [0.84, 0.9, '#d8a040']]) { ctx.fillStyle = rgba(c, 0.85); ctx.beginPath(); ctx.moveTo(cx - rAt(t0), yT + H * t0); ctx.lineTo(cx + rAt(t0), yT + H * t0); ctx.lineTo(cx + rAt(t1), yT + H * t1); ctx.lineTo(cx - rAt(t1), yT + H * t1); ctx.closePath(); ctx.fill(); }
        wrap(0.11, 11, () => { ctx.strokeStyle = '#1a0c06'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-12, 8); ctx.lineTo(0, -8); ctx.lineTo(12, 8); ctx.stroke(); });
        wrap(0.67, 11, () => { ctx.fillStyle = '#1a0c06'; ctx.beginPath(); ctx.moveTo(-9, 8); ctx.lineTo(0, -8); ctx.lineTo(9, 8); ctx.closePath(); ctx.fill(); });
        wrap(0.87, 12, () => { ctx.strokeStyle = '#1a0c06'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-10, 8); ctx.lineTo(-3, -8); ctx.lineTo(4, 8); ctx.lineTo(11, -8); ctx.stroke(); });
        wrap(0.3, 9, () => { ctx.fillStyle = 'rgba(232,224,204,0.9)'; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(10, 0); ctx.lineTo(0, 14); ctx.lineTo(-10, 0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#1a0c06'; ctx.lineWidth = 2.4; ctx.stroke(); });
        ctx.fillStyle = hgrad(ctx, cx - Rt, cx + Rt, [[0.2, 'rgba(255,255,255,0)'], [0.31, 'rgba(255,236,200,0.3)'], [0.4, 'rgba(255,255,255,0)']]); ctx.fillRect(cx - Rt, yT, 2 * Rt, H + 30);
        ctx.fillStyle = vgrad(ctx, yT, yB, [[0, 'rgba(0,0,0,0.3)'], [0.12, 'rgba(0,0,0,0)'], [0.88, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.4)']]); ctx.fillRect(cx - Rt, yT, 2 * Rt, H + 30);
        ctx.restore(); path(); ctx.strokeStyle = 'rgba(20,8,2,0.9)'; ctx.lineWidth = 2.8; ctx.stroke();
        // the grip: a carved block standing out at the waist with notches
        const gx = cx + rAt(0.52) - 6, gy = yT + H * 0.52; ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, gx + 6, gy - 22, 86, 52, 14); ctx.fill(); ctx.fillStyle = hgrad(ctx, gx, gx + 86, [[0, '#4a2810'], [0.3, '#a8703a'], [1, '#3a1e0c']]); rrect(ctx, gx, gy - 26, 86, 50, 14); ctx.fill(); ctx.strokeStyle = 'rgba(20,8,2,0.9)'; ctx.lineWidth = 2.6; ctx.stroke(); ctx.strokeStyle = 'rgba(30,12,4,0.8)'; ctx.lineWidth = 2.6; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(gx + 20 + k * 12, gy - 24); ctx.lineTo(gx + 26 + k * 12, gy + 20); ctx.stroke(); }
        // the open foot: a dark mouth with a lip
        ctx.fillStyle = rgrad(ctx, cx, yB, 0, rAt(1), [[0, '#000'], [0.8, '#140a04'], [1, '#2a1608']]); ell(ctx, cx, yB, rAt(1) * 0.9, rAt(1) * 0.9 * ryk); ctx.fill(); ctx.strokeStyle = 'rgba(232,194,120,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, yB, rAt(1) * 0.9, rAt(1) * 0.9 * ryk, 0, 0.1, PI - 0.1); ctx.stroke();
      };
      return { ref, spots, wallU: yB + 10, draw(ctx, rt) {
        const vc = fl(K, keyOf, rt, 'c', 'e'), vg = fl(K, keyOf, rt, 'g'), vm = fl(K, keyOf, rt, 'm');
        floorShadow(ctx, cx + 20, yB + 8, Rf * 1.6, 26, 0.6);
        layer(ctx, { x: cx - Rt - 80, y: yT - Rt * ryk - 40, w: 2 * Rt + 240, h: H + Rt * 0.8 + 120 }, paint);
        // the hide: mottled with dark blotches, a hoop of cane, a lump of black paste off centre
        ctx.save(); ctx.translate(cx, yT); ctx.scale(1, ryk);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, 6, 12, Rt + 14, Rt + 14); ctx.fill(); hoop(ctx, Rt, Rt, Rt * 0.1, { kind: 'rope', col: '#b8884a' });
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 0, 0, Rt + 1, Rt + 1); ctx.fill(); skinHead(ctx, Rt, Rt, { tint: '#e0cc98', edge: '#9a7a40', seed: 17, vib: vc, wear: 0.8, paste: [{ r: 0.3, dx: 0.12, dy: 0.1, col: '#1c140e' }] });
        ctx.save(); circ(ctx, 0, 0, Rt * 0.98); ctx.clip(); for (let k = 0; k < 26; k++) { const a = hash(k * 3) * TAU, d = Math.sqrt(hash(k * 5 + 1)) * Rt * 0.9; blob(ctx, Math.cos(a) * d, Math.sin(a) * d, 8 + 22 * hash(k + 7), k * 5 + 3, 10, 0.6); ctx.fillStyle = 'rgba(80,56,24,0.3)'; ctx.fill(); } ctx.restore();
        ctx.restore();
        if (vg > 0.05) { ctx.fillStyle = `rgba(255,214,150,${0.4 * vg})`; rrect(ctx, cx + Rt * 0.3 - Rt * 0.55, yT + H * 0.52 - H * 0.07, Rt * 1.1, H * 0.14, 10); ctx.fill(); }
        if (vm > 0.05) { ctx.fillStyle = `rgba(255,214,150,${0.45 * vm})`; ell(ctx, cx, yB, Rf * 0.7, Rf * 0.7 * ryk); ctx.fill(); }
        void stick; void visitStick; void woodH; void thread; void darker; void rot2; void eRing; void speckle; void bulb; void pool; void clamp; void d2r; void TAU;
      } };
    },
  }); },
});
defVoice('kundu-c', 'skin', { dur: 0.3, drop: 1.12, glide: 0.035, modes: [[1, 1, 1], [1.6, 0.5, 0.55], [2.4, 0.3, 0.4]], shell: { f: 220, q: 5, gain: 0.45, dur: 0.2 }, click: { f: 2200, gain: 0.4 }, lp: 4200, gain: 0.66 });
defVoice('kundu-e', 'skin', { dur: 0.11, drop: 1.06, glide: 0.015, modes: [[1, 1, 1], [2.2, 0.6, 0.55], [3.3, 0.4, 0.4]], click: { f: 4200, q: 1, gain: 1.0, dur: 0.018 }, lp: 9000, gain: 0.5 });
defVoice('kundu-g', 'woodtok', { dur: 0.12, gain: 0.55, hollow: 1.2, overtone: 2.3 });
defVoice('kundu-m', 'skin', { dur: 0.5, drop: 1.0, rise: 0.8, glide: 0.1, modes: [[1, 1, 1], [2.0, 0.2, 0.5]], shell: { f: 120, q: 5, gain: 0.5, dur: 0.3 }, lp: 1100, gain: 0.78 });

// ======================================================================================================================================================
// LAGERPHONE: a broom-handle pole studded with flattened bottle caps threaded loosely on nails, a ring of bigger caps at its head, an iron-shod foot on a stamping
// board. Shaken, struck and stamped to keep time for bush bands. Room: a shearing shed: rusty corrugated iron, rough timber, an old lamp, slatted boards.
// ======================================================================================================================================================
const LAG = [['t', /top|crown|head|shake/], ['u', /upper|high/], ['m', /mid|centre|center/], ['l', /lower|low/], ['s', /stomp|board|foot|boot|bass/]];
function shearingShed(ctx, F, rt, S, scene) {
  const A = F.area, wallB = wallBottom(F, scene), wallH = wallB - A.y;
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
  // corrugated iron: vertical ridges lit from the left, streaks of rust and a few holes of daylight
  const rw = Math.max(26, A.w / 22); ctx.fillStyle = '#7a8088'; ctx.fillRect(A.x, A.y, A.w, wallH);
  for (let x = A.x; x < A.x + A.w + rw; x += rw) { ctx.fillStyle = hgrad(ctx, x, x + rw, [[0, '#3a3e44'], [0.3, '#b8bec6'], [0.5, '#8a9098'], [0.8, '#4a4e54'], [1, '#2a2e34']]); ctx.fillRect(x, A.y, rw, wallH); }
  for (let k = 0; k < 40; k++) { const x = A.x + A.w * hash(k * 3 + 1), w = 12 + 30 * hash(k + 5), len = wallH * (0.2 + 0.7 * hash(k + 9)); ctx.fillStyle = vgrad(ctx, A.y, A.y + len, [[0, rgba('#b8501c', 0.0)], [0.3, rgba('#b8501c', 0.2 + 0.2 * hash(k))], [1, rgba('#6a2a0c', 0.0)]]); ctx.fillRect(x, A.y, w, len); }
  for (let y = A.y + wallH * 0.2; y < wallB; y += wallH * 0.3) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(A.x, y, A.w, 10); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(A.x, y - 3, A.w, 3); for (let x = A.x + rw * 0.5; x < A.x + A.w; x += rw) { ctx.fillStyle = '#4a2a14'; circ(ctx, x, y + 5, 3.4); ctx.fill(); } }
  { const hx = A.x + A.w * 0.8, hy = A.y + wallH * 0.2, hw = A.w * 0.12; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(hx, hy, hx - A.w * 0.3, wallB); g.addColorStop(0, 'rgba(255,230,160,0.5)'); g.addColorStop(1, 'rgba(255,230,160,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + hw, hy + 6); ctx.lineTo(hx - A.w * 0.1, wallB); ctx.lineTo(hx - A.w * 0.35, wallB); ctx.closePath(); ctx.fill(); ctx.restore(); ctx.fillStyle = '#ffe9a8'; ctx.fillRect(hx, hy, hw, 8); }
  // roof beam, a hanging hurricane lamp
  ctx.fillStyle = vgrad(ctx, A.y, A.y + wallH * 0.07, [[0, '#2a1608'], [1, '#5a3a1a']]); ctx.fillRect(A.x, A.y, A.w, wallH * 0.07);
  { const lx = A.x + A.w * 0.2, ly = A.y + wallH * 0.07; ctx.strokeStyle = '#1a1008'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx, ly + wallH * 0.1); ctx.stroke(); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgrad(ctx, lx, ly + wallH * 0.17, 0, A.w * 0.22, [[0, 'rgba(255,190,100,0.55)'], [1, 'rgba(255,190,100,0)']]); ctx.fillRect(lx - A.w * 0.22, ly, A.w * 0.44, wallH * 0.5); ctx.restore(); ctx.fillStyle = '#1a1008'; rrect(ctx, lx - 14, ly + wallH * 0.1, 28, 8, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,214,140,0.9)'; rrect(ctx, lx - 11, ly + wallH * 0.1 + 8, 22, 36, 7); ctx.fill(); ctx.strokeStyle = '#1a1008'; ctx.lineWidth = 2.4; ctx.stroke(); ctx.fillStyle = '#1a1008'; rrect(ctx, lx - 14, ly + wallH * 0.1 + 42, 28, 8, 3); ctx.fill(); }
  // slatted boards with gaps showing dark underneath, dust in the light
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(A.x, wallB - 2, A.w, 6);
  const fh = A.y + A.h - wallB; ctx.fillStyle = '#120a04'; ctx.fillRect(A.x, wallB, A.w, fh);
  const nb = 14; for (let k = 0; k < nb; k++) { const y0 = wallB + fh * Math.pow(k / nb, 1.5), y1 = wallB + fh * Math.pow((k + 0.92) / nb, 1.5), c = mix('#8a5e32', '#b88a56', hash(k * 3)); ctx.fillStyle = vgrad(ctx, y0, y1, [[0, lighter(c, 0.1)], [1, darker(c, 0.35)]]); ctx.fillRect(A.x, y0, A.w, y1 - y0); ctx.save(); ctx.beginPath(); ctx.rect(A.x, y0, A.w, y1 - y0); ctx.clip(); grain(ctx, A.x, y0, A.w, y1 - y0, '#2a1608', 0.4, k * 3 + 2, false, 5); ctx.restore(); }
  for (let k = 0; k < 60; k++) { ctx.fillStyle = `rgba(255,236,190,${0.1 + 0.25 * hash(k)})`; circ(ctx, A.x + A.w * hash(k * 3 + 1), A.y + A.h * (0.2 + 0.7 * hash(k * 7 + 2)), 0.8 + 1.8 * hash(k)); ctx.fill(); }
  ctx.restore(); pool(ctx, A.x + A.w * 0.5, wallB + fh * 0.2, A.w * 0.5, A.h * 0.28, '#ffd890', 0.28); vignette(ctx, A, 0.55);
}
const CAPCOL = ['#c8ccd2', '#d8b44a', '#b83a2a', '#3a7a9a', '#9aa0a8', '#2a8a5a'];
function cap(ctx, x, y, r, ang, c, swing) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang + swing); ctx.scale(1, 0.7);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; circ(ctx, 3, 5, r); ctx.fill();
  ctx.beginPath(); for (let k = 0; k < 21; k++) { const a = k / 21 * TAU, a2 = (k + 0.5) / 21 * TAU; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(a2) * r * 0.9, Math.sin(a2) * r * 0.9); } ctx.closePath();
  ctx.fillStyle = rgrad(ctx, -r * 0.3, -r * 0.3, 0, r * 1.3, [[0, lighter(c, 0.7)], [0.5, c], [1, darker(c, 0.5)]]); ctx.fill(); ctx.strokeStyle = rgba(darker(c, 0.7), 0.8); ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = rgba(darker(c, 0.3), 0.5); circ(ctx, 0, 0, r * 0.55); ctx.fill(); ctx.strokeStyle = rgba(lighter(c, 0.6), 0.6); ctx.lineWidth = 1.4; circ(ctx, 0, 0, r * 0.55); ctx.stroke();
  ctx.fillStyle = '#2a2a2a'; circ(ctx, 0, 0, r * 0.1); ctx.fill(); ctx.restore();
}
registerDrumStage({
  id: 'lagerphone', match: /lagerphone|bottle.?cap.?pole|cap.?pole/,
  build: (S, lanes, P) => { const zoneOf = []; return createDrumStage('lagerphone', S, lanes, P, {
    heroClean: true, dress: withLayer(shearingShed),
    voiceOf: (i) => `lager-${zoneOf[i] ?? 't'}`,
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 960 } : { w: 1040, h: 580 }, keyOf = assignZones(K, LAG.map(([key, re]) => ({ key, re })));
      for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      // the pole is drawn upright in local space and laid across on a wide screen
      const Lp = tall ? 700 : 880, top = tall ? 70 : -Lp / 2, rot = tall ? 0 : -PI / 2 + 0.08, ox = tall ? 0 : 0, oy = tall ? 0 : 300;
      const P0 = (x, y) => { if (tall) return [x, y]; const [a, b] = rot2(x, y - (top + Lp / 2), rot); return [ox + a, oy + b]; };
      const by = {};
      const seg = (t0, t1) => { const [x, y] = P0(0, top + Lp * (t0 + t1) / 2); return tall ? rectSpot(x, y, 100, Lp * (t1 - t0) / 2 - 4, 0, { rad: 14 }) : rectSpot(x, y, Lp * (t1 - t0) / 2 - 4, 90, 0, { rad: 14 }); };
      by.t = seg(0, 0.2); by.u = seg(0.2, 0.42); by.m = seg(0.42, 0.64); by.l = seg(0.64, 0.86);
      { const [x, y] = P0(0, top + Lp * 0.96); by.s = tall ? rectSpot(x, y, 170, 34, 0, { rad: 10 }) : rectSpot(x, y, 34, 150, 0, { rad: 10 }); }
      const spots = new Array(K.N).fill(null); for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
      return { ref, spots, wallU: tall ? top + Lp + 40 : oy + 120, draw(ctx, rt) {
        const vs = { t: fl(K, keyOf, rt, 't'), u: fl(K, keyOf, rt, 'u'), m: fl(K, keyOf, rt, 'm'), l: fl(K, keyOf, rt, 'l') }, vstomp = fl(K, keyOf, rt, 's');
        ctx.save(); if (!tall) { ctx.translate(ox, oy); ctx.rotate(rot); ctx.translate(0, -(top + Lp / 2)); }
        const yF = top + Lp;
        floorShadow(ctx, 14, yF + 14, 190, 24, 0.5);
        // the stamping board under the foot
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, -176 + 10, yF - 10 + 12, 352, 40, 6); ctx.fill(); ctx.fillStyle = vgrad(ctx, yF - 12, yF + 32, [[0, '#a8743a'], [1, '#5a3412']]); rrect(ctx, -176, yF - 12, 352, 44, 6); ctx.fill(); ctx.save(); rrect(ctx, -176, yF - 12, 352, 44, 6); ctx.clip(); grain(ctx, -176, yF - 12, 352, 44, '#1a0a02', 0.5, 4, false, 8); ctx.restore(); ctx.strokeStyle = 'rgba(20,8,2,0.9)'; ctx.lineWidth = 2.4; rrect(ctx, -176, yF - 12, 352, 44, 6); ctx.stroke();
        if (vstomp > 0.05) { ctx.fillStyle = `rgba(255,214,150,${0.4 * vstomp})`; rrect(ctx, -170, yF - 14, 340, 40, 6); ctx.fill(); }
        // the pole: a lit round shaft, an iron shoe at the foot
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, -14 + 10, top + 8, 36, Lp + 10, 12); ctx.fill();
        ctx.fillStyle = hgrad(ctx, -20, 20, [[0, '#2a1608'], [0.25, '#c8924e'], [0.5, '#9a6a34'], [0.8, '#5a3818'], [1, '#2a1608']]); rrect(ctx, -18, top, 36, Lp + 6, 12); ctx.fill(); ctx.strokeStyle = 'rgba(20,8,2,0.85)'; ctx.lineWidth = 2.4; ctx.stroke();
        ctx.fillStyle = hgrad(ctx, -22, 22, [[0, '#2a2e34'], [0.3, '#a8aeb8'], [0.6, '#5a6068'], [1, '#1a1e24']]); rrect(ctx, -21, yF - 40, 42, 52, 6); ctx.fill(); ctx.strokeStyle = 'rgba(10,12,16,0.9)'; ctx.lineWidth = 2; ctx.stroke();
        // caps threaded on nails in pairs, alternately left and right, swinging a little after a stroke
        const n = 34; for (let k = 0; k < n; k++) { const t = 0.03 + 0.88 * k / (n - 1), y = top + Lp * t, side = k % 2 ? 1 : -1, seg2 = t < 0.2 ? 't' : t < 0.42 ? 'u' : t < 0.64 ? 'm' : 'l', sw = Math.sin(rt.anim * 30 + k * 1.7) * vs[seg2] * 0.5;
          ctx.strokeStyle = '#2a2a2e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(side * 10, y); ctx.lineTo(side * 34, y + 2); ctx.stroke();
          cap(ctx, side * (36 + 8 * hash(k)), y + 3, 22 + 3 * hash(k + 4), 0.4 * side + 0.15 * (hash(k + 7) - 0.5) * 2, CAPCOL[Math.floor(hash(k * 3 + 1) * CAPCOL.length)], sw);
          cap(ctx, side * (52 + 8 * hash(k + 3)), y + 4, 20 + 3 * hash(k + 2), 0.9 * side, CAPCOL[Math.floor(hash(k * 5 + 2) * CAPCOL.length)], -sw); }
        // the crown: a ring of larger caps at the head under a dark knob
        for (let k = 0; k < 7; k++) { const a = PI * (1.05 + 0.9 * k / 6); cap(ctx, Math.cos(a) * 46, top + 14 + Math.sin(a) * 14 + 6, 28, a + PI / 2, CAPCOL[k % 6], Math.sin(rt.anim * 30 + k) * vs.t * 0.5); }
        ctx.fillStyle = rgrad(ctx, -4, top - 4, 0, 26, [[0, '#8a8e96'], [1, '#2a2e34']]); circ(ctx, 0, top - 2, 22); ctx.fill(); ctx.strokeStyle = 'rgba(10,12,16,0.9)'; ctx.lineWidth = 2; ctx.stroke();
        for (const [k, t0, t1] of [['t', 0, 0.2], ['u', 0.2, 0.42], ['m', 0.42, 0.64], ['l', 0.64, 0.86]]) if (vs[k] > 0.05) { ctx.fillStyle = `rgba(255,224,160,${0.28 * vs[k]})`; rrect(ctx, -110, top + Lp * t0 + 2, 220, Lp * (t1 - t0) - 4, 18); ctx.fill(); }
        ctx.restore();
        for (const k of ['t', 'u', 'm', 'l']) if (vs[k] > 0.06) { const sp = by[k], ang = tall ? 2.55 : 2.3; visitStick(ctx, sp.v + (tall ? 70 : 0), sp.u, vs[k], { ang, dir: tall ? [0.8, -0.5] : [0.6, -0.9], back: 110, len: 230, w: 12, col: '#c89a58' }); }
        void stick; void woodH; void thread; void speckle; void bulb; void blob; void skinHead; void hoop; void eSpot; void eRing; void clamp; void d2r; void lerp; void ell;
      } };
    },
  }); },
});
registerStrikeVoice('lager-t', (c) => { c.evoice(c.audio, 'jingle', { n: 10, f: 4600, spread: 0.12, dur: 0.3, gain: 0.22, vel: c.vel, wet: 0.12 }); });
registerStrikeVoice('lager-u', (c) => { c.evoice(c.audio, 'jingle', { n: 8, f: 3800, spread: 0.1, dur: 0.24, gain: 0.22, vel: c.vel, wet: 0.1 }); });
registerStrikeVoice('lager-m', (c) => { c.evoice(c.audio, 'jingle', { n: 8, f: 3200, spread: 0.1, dur: 0.22, gain: 0.22, vel: c.vel, wet: 0.1 }); });
registerStrikeVoice('lager-l', (c) => { c.evoice(c.audio, 'jingle', { n: 7, f: 2600, spread: 0.1, dur: 0.2, gain: 0.24, vel: c.vel, wet: 0.1 }); c.evoice(c.audio, 'woodtok', { hz: 220, dur: 0.08, gain: 0.3, hollow: 1.4, overtone: 2.5, vel: c.vel }); });
registerStrikeVoice('lager-s', (c) => { c.evoice(c.audio, 'woodtok', { hz: 170, dur: 0.18, gain: 0.7, hollow: 1.0, overtone: 1.9, vel: c.vel }); c.evoice(c.audio, 'jingle', { n: 14, f: 3000, spread: 0.16, dur: 0.34, gain: 0.26, vel: c.vel, wet: 0.14 }); });

// ======================================================================================================================================================
// STAMPING TUBES: a rack of bamboo tubes of different lengths standing on a beach, open at the top, struck on their mouths with a pad of coconut husk or
// stamped on the ground. One lane per tube, the longest tube the lowest. Room: a beach at sunset, a low sun on the sea, palm leaves overhead, wet sand.
// ======================================================================================================================================================
function sunsetBeach(ctx, F, rt, S, scene) {
  const A = F.area, wallB = wallBottom(F, scene), wallH = wallB - A.y, hz = A.y + wallH * 0.62;
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
  ctx.fillStyle = vgrad(ctx, A.y, hz, [[0, '#2a1a4a'], [0.4, '#b84a5a'], [0.75, '#f08a4a'], [1, '#ffd078']]); ctx.fillRect(A.x, A.y, A.w, hz - A.y);
  const sx = A.x + A.w * 0.66, sr = Math.min(A.w, wallH) * 0.12;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgrad(ctx, sx, hz - sr * 0.4, 0, sr * 5, [[0, 'rgba(255,230,150,0.8)'], [0.4, 'rgba(255,160,80,0.3)'], [1, 'rgba(255,120,60,0)']]); ctx.fillRect(A.x, A.y, A.w, hz - A.y + 4); ctx.restore();
  ctx.fillStyle = rgrad(ctx, sx, hz - sr * 0.5, sr * 0.2, sr, [[0, '#fffbe0'], [1, '#ffc860']]); circ(ctx, sx, hz - sr * 0.5, sr); ctx.fill();
  for (let k = 0; k < 4; k++) { const y = A.y + (hz - A.y) * (0.3 + 0.16 * k); ctx.fillStyle = `rgba(255,${180 - 20 * k},${150 - 20 * k},0.22)`; ctx.fillRect(A.x + A.w * (0.05 + 0.1 * k), y, A.w * (0.3 + 0.1 * (k % 2)), 6); ctx.fillRect(A.x + A.w * (0.5 + 0.06 * k), y + 12, A.w * 0.3, 5); }
  ctx.fillStyle = vgrad(ctx, hz, wallB, [[0, '#f0a060'], [0.2, '#8a5a7a'], [1, '#2a2a5a']]); ctx.fillRect(A.x, hz, A.w, wallB - hz);
  for (let k = 0; k < 70; k++) { const y = hz + (wallB - hz) * Math.pow(hash(k * 3 + 1), 1.3), x = A.x + A.w * hash(k * 5 + 2), w = 12 + 50 * hash(k + 4) * (0.3 + (y - hz) / (wallB - hz)); ctx.strokeStyle = rgba(hash(k) > 0.4 ? '#ffe0a0' : '#2a1a4a', 0.3 + 0.2 * hash(k + 7)); ctx.lineWidth = 1.6 + 2 * (y - hz) / (wallB - hz); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke(); }
  ctx.fillStyle = vgrad(ctx, hz, wallB, [[0, 'rgba(255,214,140,0.65)'], [1, 'rgba(255,214,140,0)']]); ctx.beginPath(); ctx.moveTo(sx - sr, hz); ctx.lineTo(sx + sr, hz); ctx.lineTo(sx + sr * 2.4, wallB); ctx.lineTo(sx - sr * 2.4, wallB); ctx.closePath(); ctx.fill();
  // palm fronds hanging in from the top corners, dark against the sky
  const frond = (x, y, L, a, s) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.strokeStyle = '#0e0a1a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(L * 0.5, -L * 0.18 * s, L, L * 0.12 * s); ctx.stroke(); ctx.fillStyle = '#0e0a1a'; for (let k = 0; k < 22; k++) { const t = 0.1 + 0.88 * k / 21, px = L * t, py = lerp(0, L * 0.12 * s, t * t) - L * 0.18 * s * Math.sin(PI * t) * 0.9, ll = L * 0.17 * (1 - t * 0.6); for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + ll * 0.4, py + d * ll * 0.5, px + ll * 0.2, py + d * ll); ctx.quadraticCurveTo(px + ll * 0.1, py + d * ll * 0.4, px, py); ctx.fill(); } } ctx.restore(); };
  const u = Math.min(A.w, wallH);
  frond(A.x - 10, A.y + wallH * 0.05, u * 0.8, 0.35, 1); frond(A.x - 10, A.y + wallH * 0.12, u * 0.6, 0.75, 1); frond(A.x + A.w + 10, A.y + wallH * 0.03, u * 0.85, PI - 0.3, -1); frond(A.x + A.w + 10, A.y + wallH * 0.12, u * 0.6, PI - 0.75, -1);
  // wet sand with ripples, foam line and shells
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(A.x, wallB - 2, A.w, 5);
  const fh = A.y + A.h - wallB; ctx.fillStyle = vgrad(ctx, wallB, A.y + A.h, [[0, '#c8a070'], [0.4, '#9a7a58'], [1, '#5a4a3a']]); ctx.fillRect(A.x, wallB, A.w, fh);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 4; ctx.beginPath(); for (let k = 0; k <= 40; k++) { const x = A.x + A.w * k / 40, y = wallB + 2 + Math.sin(k * 0.9) * 3; if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
  for (let k = 0; k < 8; k++) { const yy = wallB + fh * (0.12 + 0.11 * k); ctx.strokeStyle = 'rgba(70,50,30,0.22)'; ctx.lineWidth = 2.4; ctx.beginPath(); for (let j = 0; j <= 30; j++) { const x = A.x + A.w * j / 30, y = yy + Math.sin(j * 0.8 + k) * 3 * (1 + k * 0.2); if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); }
  speckle(ctx, A.x, wallB, A.w, fh, 220, '#4a3820', 0.3, 5, 0.8, 2.4); speckle(ctx, A.x, wallB, A.w, fh, 140, '#fff0d0', 0.2, 9, 0.8, 2);
  { const lx = A.x + A.w * 0.08, ly = A.y + A.h - fh * 0.13, ll = A.w * 0.34; ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(lx + ll / 2 + 8, ly + 12, ll / 2, 10, 0, 0, TAU); ctx.fill(); ctx.fillStyle = hgrad(ctx, lx, lx + ll, [[0, '#6a5a4a'], [0.5, '#c8b8a0'], [1, '#5a4a3a']]); rrect(ctx, lx, ly - 14, ll, 28, 14); ctx.fill(); ctx.strokeStyle = 'rgba(50,40,30,0.7)'; ctx.lineWidth = 2; ctx.stroke(); ctx.strokeStyle = 'rgba(80,66,52,0.5)'; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.moveTo(lx + ll * (0.1 + 0.11 * k), ly - 10); ctx.lineTo(lx + ll * (0.14 + 0.11 * k), ly + 10); ctx.stroke(); }
    for (const [dx, dy, c] of [[0.5, 0.05, '#f0d8c8'], [0.56, 0.0, '#e8b8a0'], [0.62, 0.06, '#f4ece0']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(A.x + A.w * dx, A.y + A.h - fh * (0.1 - dy), 14, 9, 0.3, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(120,80,60,0.6)'; ctx.lineWidth = 1.6; ctx.stroke(); }
    ctx.fillStyle = '#4a3418'; ctx.beginPath(); ctx.ellipse(A.x + A.w * 0.84, A.y + A.h - fh * 0.1, 30, 20, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#f4ecd8'; ctx.beginPath(); ctx.ellipse(A.x + A.w * 0.84, A.y + A.h - fh * 0.12, 22, 13, 0, 0, TAU); ctx.fill(); }
  ctx.restore(); vignette(ctx, A, 0.5);
}
function bamboo(ctx, x, yTop, yBot, w, v, seed) {
  const r = w / 2, ryk = 0.32;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x + 10, yBot + 8, r * 1.2, r * 0.34, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - r, yTop); ctx.lineTo(x - r, yBot); ctx.ellipse(x, yBot, r, r * ryk, 0, PI, 0, true); ctx.lineTo(x + r, yTop); ctx.closePath();
  ctx.fillStyle = hgrad(ctx, x - r, x + r, [[0, '#5a6a1c'], [0.18, '#c8d050'], [0.34, '#e6e47a'], [0.55, '#a8b43a'], [0.85, '#5a6a1c'], [1, '#34400e']]); ctx.fill();
  ctx.save(); ctx.clip();
  for (let k = 0; k < 40; k++) { ctx.strokeStyle = `rgba(60,70,10,${0.08 + 0.1 * hash(seed + k)})`; ctx.lineWidth = 1.2; const xx = x - r + 2 * r * hash(seed + k * 3 + 1); ctx.beginPath(); ctx.moveTo(xx, yTop); ctx.lineTo(xx + 3, yBot); ctx.stroke(); }
  for (let t = 0.22; t < 1; t += 0.3 + 0.1 * hash(seed)) { const y = lerp(yTop, yBot, t); ctx.fillStyle = 'rgba(40,50,6,0.55)'; ctx.fillRect(x - r - 2, y - 3, 2 * r + 4, 6); ctx.fillStyle = 'rgba(255,255,200,0.35)'; ctx.fillRect(x - r - 2, y - 5, 2 * r + 4, 2); ctx.fillStyle = '#7a8a22'; ell(ctx, x, y + 3, r * 1.04, r * 0.18); ctx.fill(); }
  ctx.fillStyle = hgrad(ctx, x - r, x + r, [[0.22, 'rgba(255,255,255,0)'], [0.32, 'rgba(255,255,230,0.35)'], [0.42, 'rgba(255,255,255,0)']]); ctx.fillRect(x - r, yTop, 2 * r, yBot - yTop + 20);
  // a wrapped band of plaited fibre in a colour of its own, with burnt zigzags above it
  { const yb = lerp(yTop, yBot, 0.62), c = ['#b8301e', '#d8a030', '#2a7a5a', '#3a62a8', '#8a3a6a', '#d86a1e'][seed % 6]; ctx.fillStyle = c; ctx.fillRect(x - r - 2, yb - 11, 2 * r + 4, 22); for (let k = 0; k < 14; k++) { ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - r + k * r / 7, yb - 11); ctx.lineTo(x - r + k * r / 7 + 7, yb + 11); ctx.stroke(); } ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x - r - 2, yb - 11, 2 * r + 4, 3);
    ctx.strokeStyle = 'rgba(60,30,6,0.7)'; ctx.lineWidth = 2.6; ctx.beginPath(); for (let k = 0; k <= 16; k++) { const xx = x - r + 2 * r * k / 16, yy = yb - 26 + (k % 2 ? 7 : -7); if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); } ctx.stroke(); }
  ctx.restore(); ctx.strokeStyle = 'rgba(40,50,6,0.85)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x - r, yTop); ctx.lineTo(x - r, yBot); ctx.ellipse(x, yBot, r, r * ryk, 0, PI, 0, true); ctx.lineTo(x + r, yTop); ctx.stroke();
  // the open mouth
  ctx.fillStyle = rgrad(ctx, x, yTop, 0, r, [[0, '#050802'], [0.8, '#1a2208'], [1, '#2a340c']]); ell(ctx, x, yTop, r, r * ryk); ctx.fill(); ctx.strokeStyle = '#d8dc80'; ctx.lineWidth = 3.4; ctx.stroke(); ctx.strokeStyle = 'rgba(40,50,6,0.9)'; ctx.lineWidth = 1.6; ell(ctx, x, yTop, r - 3, (r - 3) * ryk); ctx.stroke();
  if (v > 0.05) { ctx.fillStyle = `rgba(255,236,160,${0.5 * v})`; ell(ctx, x, yTop, r, r * ryk); ctx.fill(); }
  ctx.restore();
}
registerDrumStage({
  id: 'bamboo', match: /bamboo.?(tube|drum|stamp)|stamping|bumbung|tubes?\b|fijian.?bamboo|bamboo.?band/,
  build: (S, lanes, P) => { const zoneOf = []; return createDrumStage('bamboo', S, lanes, P, {
    heroClean: true, dress: withLayer(sunsetBeach),
    voiceOf: () => 'bamboo-tube',
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 960 } : { w: 1040, h: 580 }, N = K.N, order = K.order.slice().reverse();   // order[0] = highest pitch? K.order is low to high: reversed puts the lowest last
      const rank = new Array(N); K.order.forEach((li, r) => { rank[li] = r; });                          // 0 = lowest = longest tube
      const w = tall ? 104 : 94, rows = tall ? 2 : 1, perRow = Math.ceil(N / rows), pos = [];
      for (let i = 0; i < N; i++) { const r = rank[i], row = rows === 2 ? (r < perRow ? 0 : 1) : 0, idx = rows === 2 ? (row === 0 ? r : r - perRow) : r, cnt = row === 0 ? Math.min(perRow, N) : N - perRow, x = (idx - (cnt - 1) / 2) * (tall ? 150 : 132), len = (tall ? 300 : 280) - (r / Math.max(1, N - 1)) * (tall ? 150 : 150), yb = tall ? (row === 0 ? 520 : 800) : 470; pos[i] = { x, yb, yt: yb - len, row, len }; }
      const spots = pos.map((p) => eSpot(p.x, p.yt, w * 0.46, w * 0.46 * 0.4, 0, { apk: 1.0 }));
      return { ref, spots, wallU: tall ? 560 : 500, draw(ctx, rt) {
        const drawOrder = pos.map((p, i) => i).sort((a, b) => pos[a].row - pos[b].row || a - b);
        for (const i of drawOrder) { const p = pos[i]; bamboo(ctx, p.x, p.yt, p.yb, w, rt.flash[i], i * 7 + 3); }
        for (const i of drawOrder) { const p = pos[i]; if (rt.flash[i] > 0.06) visitStick(ctx, p.x, p.yt, rt.flash[i], { ang: 2.35, dir: [0.7, -0.8], back: 110, len: tall ? 260 : 220, w: 16, col: '#a8743a', knob: { r: 19, col: '#8a6a3a' } }); }
        void eRing; void rectSpot; void woodH; void stick; void thread; void blob; void bulb; void pool; void skinHead; void hoop; void rgba; void darker; void d2r; void clamp; void mix; void order; void rot2;
      } };
    },
  }); },
});
defVoice('bamboo-tube', 'skin', { dur: 0.34, drop: 1.0, rise: 0.9, glide: 0.03, modes: [[1, 1, 1], [2.0, 0.28, 0.5], [3.0, 0.12, 0.35]], shell: { f: 300, q: 8, gain: 0.35, dur: 0.18 }, click: { f: 1800, gain: 0.35 }, lp: 2400, gain: 0.72 });

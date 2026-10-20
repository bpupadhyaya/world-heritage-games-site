// Island drums, first half (1.23.1): the garamut (a huge slit log on forked posts under a thatched hall), the lali (two slit logs seen from above on a
// pandanus mat with tapa borders) and the pate (a small carved slit box seen head-on in a round open house). Each is its own picture, composition, room
// and voice. No performer, no hands: a beater visits the struck lip.
import { registerDrumStage } from './registry.js';
import { createDrumStage, eSpot, eRing, rectSpot, assignZones, staticLayer, rot2 } from './drum-kit.js';
import { defVoice } from './voice-synth2.js';
import { pool, vignette } from './set.js';
import { floorShadow, blob, speckle, bulb } from './drum-side.js';
import { PI, TAU, clamp, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, lerp, d2r, fl, woodH, stick, visitStick, tassel } from './asia-kit.js';
import { wallBottom, withLayer } from './stage-asia1.js';

// a heavy hardwood club or beater, round, thicker at the grip
const club = (ctx, x, y, ang, len, w, col = '#8a5a2c') => stick(ctx, x, y, ang, len, w, { col, tip: 0.7 });

// ======================================================================================================================================================
// GARAMUT: a huge hollowed log lying on two forked posts, seen from the side and a little above. A long slit runs along its top with a thick near lip and a thin
// far lip; the ends are carved in curving relief and painted red, white and black. Room: an open thatched hall at dusk, rough posts, the sea glowing behind
// palms, packed earth and a low fire.
// ======================================================================================================================================================
const GAR = [['low', /low|near|deep|thick|^boom/], ['high', /high|far|thin|^ring|crack/], ['end', /end|carv|cap|head/], ['body', /body|belly|side|log|bark/]];
function thatchHall(ctx, F, rt, S, scene) {
  const A = F.area, wallB = wallBottom(F, scene), wallH = wallB - A.y;
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
  ctx.fillStyle = vgrad(ctx, A.y, wallB, [[0, '#14233a'], [0.45, '#3a4a68'], [0.75, '#c8704a'], [1, '#f0a060']]); ctx.fillRect(A.x, A.y, A.w, wallH);
  for (let k = 0; k < 40; k++) { ctx.fillStyle = `rgba(255,240,220,${0.25 + 0.5 * hash(k)})`; circ(ctx, A.x + A.w * hash(k * 3 + 1), A.y + wallH * 0.4 * hash(k * 7 + 2), 0.6 + hash(k + 9)); ctx.fill(); }
  const hz = A.y + wallH * 0.7;
  ctx.fillStyle = vgrad(ctx, hz, wallB, [[0, '#f6b878'], [0.3, '#8a6a7a'], [1, '#243a52']]); ctx.fillRect(A.x, hz, A.w, wallB - hz);
  ctx.fillStyle = rgrad(ctx, A.x + A.w * 0.62, hz, 0, A.w * 0.4, [[0, 'rgba(255,214,140,0.7)'], [1, 'rgba(255,214,140,0)']]); ctx.fillRect(A.x, hz - wallH * 0.2, A.w, wallH * 0.4);
  // palm silhouettes
  const palm = (x, base, h, lean) => { ctx.strokeStyle = '#0c1620'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + lean * 0.4, base - h * 0.6, x + lean, base - h); ctx.stroke(); const tx = x + lean, ty = base - h; ctx.fillStyle = '#0c1620'; for (let k = 0; k < 9; k++) { const a = -PI * 0.95 + k * PI * 1.9 / 8 * 0.5 - 0.1 + (k > 4 ? 0.2 : 0), L = h * 0.42; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx + Math.cos(a) * L * 0.5, ty + Math.sin(a) * L * 0.5 - L * 0.15, tx + Math.cos(a) * L, ty + Math.sin(a) * L + L * 0.25); ctx.quadraticCurveTo(tx + Math.cos(a) * L * 0.5, ty + Math.sin(a) * L * 0.5 + L * 0.05, tx, ty + 4); ctx.fill(); } };
  palm(A.x + A.w * 0.3, hz + 6, wallH * 0.3, -20); palm(A.x + A.w * 0.72, hz + 10, wallH * 0.36, 24); palm(A.x + A.w * 0.5, hz + 4, wallH * 0.2, 10);
  // the thatch roof: layered fringes of dried grass hanging from a ridge pole, darker toward the top
  for (let r = 0; r < 4; r++) { const y0 = A.y + wallH * (0.0 + r * 0.075), c = ['#3a2410', '#5a3a18', '#7a5226', '#9a6c32'][r]; ctx.fillStyle = c; ctx.fillRect(A.x, y0, A.w, wallH * 0.1); for (let x = A.x; x < A.x + A.w; x += 7) { const l = wallH * (0.05 + 0.04 * hash(x * 0.3 + r)); ctx.strokeStyle = rgba(lighter(c, 0.15 + 0.2 * hash(x + r * 3)), 0.9); ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(x, y0 + wallH * 0.06); ctx.lineTo(x + (hash(x) - 0.5) * 4, y0 + wallH * 0.06 + l); ctx.stroke(); } }
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(A.x, A.y + wallH * 0.31, A.w, 10);
  // rough posts with lashing
  const pw = Math.min(A.w * 0.08, 62);
  for (const px of [A.x + pw * 0.6, A.x + A.w - pw * 0.6]) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(px - pw / 2 + 9, A.y, pw, wallH); ctx.fillStyle = hgrad(ctx, px - pw / 2, px + pw / 2, [[0, '#1e1008'], [0.3, '#7a5028'], [0.6, '#4a2c12'], [1, '#180c06']]); ctx.fillRect(px - pw / 2, A.y, pw, wallH); for (let k = 0; k < 18; k++) { ctx.strokeStyle = 'rgba(20,8,2,0.5)'; ctx.lineWidth = 2; const y = A.y + wallH * hash(k * 3 + 1); ctx.beginPath(); ctx.moveTo(px - pw / 2 + 4, y); ctx.lineTo(px + pw / 2 - 4, y + 6); ctx.stroke(); } for (const f of [0.34, 0.62]) { ctx.fillStyle = '#c8a060'; ctx.fillRect(px - pw / 2 - 2, A.y + wallH * f, pw + 4, 14); for (let j = 0; j < 6; j++) { ctx.strokeStyle = 'rgba(80,50,16,0.7)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(px - pw / 2 + j * pw / 5, A.y + wallH * f); ctx.lineTo(px - pw / 2 + j * pw / 5 + 5, A.y + wallH * f + 14); ctx.stroke(); } } }
  // packed earth with footprints of light and a low fire at the right
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(A.x, wallB - 2, A.w, 6);
  const fh = A.y + A.h - wallB; ctx.fillStyle = vgrad(ctx, wallB, A.y + A.h, [[0, '#5a3c22'], [1, '#2a1a0c']]); ctx.fillRect(A.x, wallB, A.w, fh);
  speckle(ctx, A.x, wallB, A.w, fh, 260, '#1a0e04', 0.35, 5, 1, 3.4); speckle(ctx, A.x, wallB, A.w, fh, 120, '#d8b080', 0.15, 9, 1, 2.4);
  const fx = A.x + A.w * 0.86, fy = wallB + fh * 0.45;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgrad(ctx, fx, fy, 0, A.w * 0.35, [[0, 'rgba(255,170,80,0.5)'], [1, 'rgba(255,120,40,0)']]); ctx.fillRect(A.x, wallB - wallH * 0.2, A.w, fh + wallH * 0.2); ctx.restore();
  for (let k = 0; k < 6; k++) { ctx.strokeStyle = '#2a1608'; ctx.lineWidth = 9; ctx.lineCap = 'round'; const a = k * 1.05; ctx.beginPath(); ctx.moveTo(fx + Math.cos(a) * 26, fy + Math.sin(a) * 9); ctx.lineTo(fx + Math.cos(a) * 6, fy + Math.sin(a) * 2); ctx.stroke(); }
  ctx.fillStyle = rgrad(ctx, fx, fy - 8, 0, 30, [[0, '#fff2b0'], [0.4, '#ffb030'], [1, 'rgba(220,60,10,0)']]); ell(ctx, fx, fy - 8, 18, 26); ctx.fill();
  ctx.restore();
  vignette(ctx, A, 0.52);
}
registerDrumStage({
  id: 'garamut', match: /garamut|garamout|slit.?log|log.?slit/,
  build: (S, lanes, P) => { const zoneOf = []; return createDrumStage('garamut', S, lanes, P, {
    heroClean: true, dress: withLayer(thatchHall),
    voiceOf: (i) => `garamut-${zoneOf[i] ?? 'low'}`,
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 960 } : { w: 1040, h: 580 }, keyOf = assignZones(K, GAR.map(([key, re]) => ({ key, re })));
      for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const Lh = tall ? 318 : 410, r = tall ? 124 : 112, cy = tall ? 560 : 290, cx = 0, rot = tall ? -0.06 : -0.03, by = {};
      const at = (x, y) => { const [a, b] = rot2(x, y, rot); return [cx + a, cy + b]; };
      { const [x, y] = at(0, -r * 0.34); by.low = rectSpot(x, y, Lh * 0.7, r * 0.17, rot, { rad: 10 }); }
      { const [x, y] = at(0, -r * 0.72); by.high = rectSpot(x, y, Lh * 0.7, r * 0.13, rot, { rad: 10 }); }
      { const [x, y] = at(-Lh - 8, 0); by.end = eSpot(x, y, r * 0.38, r * 0.82, rot, { apk: 0.95 }); }
      { const [x, y] = at(Lh * 0.1, r * 0.46); by.body = rectSpot(x, y, Lh * 0.55, r * 0.22, rot, { rad: 12 }); }
      const spots = new Array(K.N).fill(null); for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
      const col = '#7a4a24', yG = cy + r + (tall ? 130 : 70);
      return { ref, spots, wallU: yG - (tall ? 20 : 10), draw(ctx, rt) {
        const vl = fl(K, keyOf, rt, 'low'), vh = fl(K, keyOf, rt, 'high'), ve = fl(K, keyOf, rt, 'end'), vb = fl(K, keyOf, rt, 'body');
        floorShadow(ctx, cx + 20, yG + 16, Lh * 1.3, 34, 0.6);
        // two forked posts under the log
        for (const sx of [-0.58, 0.56]) { const x0 = cx + sx * Lh, y0 = cy + r * 0.9 + sx * Lh * Math.sin(rot);
          ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.moveTo(x0 - 20 + 8, yG + 10); ctx.lineTo(x0 + 20 + 8, yG + 10); ctx.lineTo(x0 + 8, y0 + 8); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(10,4,2,0.9)'; ctx.lineWidth = 34; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, yG + 6); ctx.lineTo(x0, y0 + 20); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x0 - 56, y0 - 12); ctx.lineTo(x0, y0 + 40); ctx.lineTo(x0 + 56, y0 - 12); ctx.stroke();
          ctx.strokeStyle = woodH(ctx, x0 - 20, x0 + 20, '#6a4220'); ctx.lineWidth = 28; ctx.beginPath(); ctx.moveTo(x0, yG + 6); ctx.lineTo(x0, y0 + 20); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x0 - 54, y0 - 10); ctx.lineTo(x0, y0 + 38); ctx.lineTo(x0 + 54, y0 - 10); ctx.stroke();
          ctx.strokeStyle = '#c8a060'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x0 - 20, y0 + 52); ctx.lineTo(x0 + 20, y0 + 56); ctx.stroke(); }
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
        // the log: a long cylinder, rounded and carved at the left end, thicker and plain at the right
        const body = () => { ctx.beginPath(); ctx.moveTo(-Lh, -r * 0.82); ctx.lineTo(Lh - 14, -r); ctx.quadraticCurveTo(Lh + 24, -r * 0.9, Lh + 22, 0); ctx.quadraticCurveTo(Lh + 24, r * 0.9, Lh - 14, r); ctx.lineTo(-Lh, r * 0.82); ctx.closePath(); };
        ctx.save(); ctx.translate(10, 18); body(); ctx.fillStyle = 'rgba(0,0,0,0.34)'; ctx.fill(); ctx.restore();
        body(); ctx.fillStyle = vgrad(ctx, -r, r, [[0, darker(col, 0.5)], [0.14, lighter(col, 0.35)], [0.3, lighter(col, 0.12)], [0.55, col], [0.85, darker(col, 0.5)], [1, darker(col, 0.78)]]); ctx.fill();
        ctx.save(); body(); ctx.clip(); grain(ctx, -Lh, -r, 2 * Lh + 30, 2 * r, '#1c0c04', 0.45, 7, false, 50);
        for (let k = 0; k < 10; k++) { const x = -Lh + Lh * 2 * hash(k * 3 + 1), y = (hash(k * 5 + 2) - 0.5) * r * 1.6; ctx.fillStyle = 'rgba(20,8,2,0.4)'; ell(ctx, x, y, 14 + 18 * hash(k), 5); ctx.fill(); }
        // painted bands near the right end and a row of white triangles along the belly
        for (const [x0, w, c] of [[Lh * 0.72, 22, '#e8e0cc'], [Lh * 0.78, 12, '#a8281e'], [Lh * 0.84, 22, '#e8e0cc']]) { ctx.fillStyle = c; ctx.fillRect(x0, -r * 1.05, w, r * 2.1); }
        for (let k = 0; k < 16; k++) { const x = -Lh * 0.7 + k * 60; ctx.fillStyle = 'rgba(232,224,204,0.85)'; ctx.beginPath(); ctx.moveTo(x, r * 0.8); ctx.lineTo(x + 20, r * 0.58); ctx.lineTo(x + 40, r * 0.8); ctx.closePath(); ctx.fill(); }
        // carved scrolls in white and black along the belly, and a band of burnt chevrons below the slit
        for (let k = 0; k < 7; k++) { const x = -Lh * 0.78 + k * Lh * 0.2, y = r * 0.3; ctx.strokeStyle = '#e8e0cc'; ctx.lineWidth = 4.4; ctx.beginPath(); for (let t = 0; t <= 26; t++) { const a = t * 0.42, rr = 2 + t * 0.9; const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.9; if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.stroke(); ctx.strokeStyle = '#1a1008'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x + 24, y - 6); ctx.bezierCurveTo(x + 50, y - 40, x + 80, y + 30, x + 100, y - 2); ctx.stroke(); }
        ctx.fillStyle = hgrad(ctx, -Lh, Lh, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.12)']]); ctx.fillRect(-Lh, -r, 2 * Lh + 30, 2 * r);
        ctx.fillStyle = vgrad(ctx, -r, r, [[0.1, 'rgba(255,255,255,0)'], [0.2, 'rgba(255,230,190,0.3)'], [0.32, 'rgba(255,255,255,0)']]); ctx.fillRect(-Lh, -r, 2 * Lh + 30, 2 * r);
        ctx.restore(); body(); ctx.strokeStyle = 'rgba(20,8,2,0.9)'; ctx.lineWidth = 2.8; ctx.stroke();
        // the slit: a long dark mouth, thick near lip below, thin far lip above, a pale hollow inside
        const sl = Lh * 0.8, sh = r * 0.2;
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, -sl + 4, -r * 0.62 - sh + 10, 2 * sl, sh * 2 + 16, sh); ctx.fill();
        ctx.fillStyle = vgrad(ctx, -r * 0.62 - sh, -r * 0.62 + sh, [[0, lighter(col, 0.3)], [1, darker(col, 0.3)]]); rrect(ctx, -sl - 10, -r * 0.66 - sh - 10, 2 * sl + 20, sh * 2 + 26, sh + 8); ctx.fill(); ctx.strokeStyle = 'rgba(20,8,2,0.85)'; ctx.lineWidth = 2.4; ctx.stroke();
        ctx.fillStyle = vgrad(ctx, -r * 0.66 - sh, -r * 0.66 + sh, [[0, '#0a0402'], [1, '#2a1406']]); rrect(ctx, -sl, -r * 0.66 - sh * 0.7, 2 * sl, sh * 1.4, sh * 0.7); ctx.fill();
        ctx.strokeStyle = 'rgba(255,214,150,0.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-sl + 12, -r * 0.66 + sh * 0.75); ctx.lineTo(sl - 12, -r * 0.66 + sh * 0.75); ctx.stroke();
        // the carved end: a flared cap with scrolls in red, white and black
        ctx.save(); ctx.translate(-Lh, 0); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, 6, 10, r * 0.46, r * 0.9); ctx.fill();
        ctx.fillStyle = rgrad(ctx, -r * 0.1, -r * 0.3, 0, r, [[0, '#d8a060'], [0.5, '#8a5428'], [1, '#3a1e0a']]); ell(ctx, 0, 0, r * 0.4, r * 0.84); ctx.fill(); ctx.strokeStyle = 'rgba(20,8,2,0.9)'; ctx.lineWidth = 3; ctx.stroke();
        for (let k = 0; k < 4; k++) { ctx.strokeStyle = ['#a8281e', '#e8e0cc', '#1a1008', '#e8e0cc'][k]; ctx.lineWidth = 5 - k * 0.6; ctx.beginPath(); ctx.ellipse(0, 0, r * (0.34 - k * 0.07), r * (0.74 - k * 0.15), 0, 0, TAU); ctx.stroke(); }
        ctx.strokeStyle = '#1a1008'; ctx.lineWidth = 4; ctx.beginPath(); for (let t = 0; t <= 40; t++) { const a = t * 0.4, rr = 2 + t * 0.5; ctx.lineTo(Math.cos(a) * rr * 0.5, Math.sin(a) * rr); } ctx.stroke();
        ctx.restore();
        if (vl > 0.05) { ctx.fillStyle = `rgba(255,214,150,${0.35 * vl})`; rrect(ctx, -Lh * 0.7, -r * 0.34 - r * 0.17, Lh * 1.4, r * 0.34, 10); ctx.fill(); }
        if (vh > 0.05) { ctx.fillStyle = `rgba(255,214,150,${0.35 * vh})`; rrect(ctx, -Lh * 0.7, -r * 0.72 - r * 0.13, Lh * 1.4, r * 0.26, 10); ctx.fill(); }
        if (vb > 0.05) { ctx.fillStyle = `rgba(255,214,150,${0.3 * vb})`; rrect(ctx, Lh * 0.1 - Lh * 0.55, r * 0.46 - r * 0.22, Lh * 1.1, r * 0.44, 12); ctx.fill(); }
        ctx.restore();
        const [lx, ly] = at(-Lh * 0.2, -r * 0.34), [hx, hy] = at(Lh * 0.25, -r * 0.72);
        visitStick(ctx, lx, ly, vl, { ang: 2.25, dir: [0.6, -0.8], back: 130, len: tall ? 280 : 250, w: 26, col: '#8a5a2c', tip: 0.8 });
        visitStick(ctx, hx, hy, vh, { ang: 0.9, dir: [-0.6, -0.8], back: 130, len: tall ? 280 : 250, w: 20, col: '#a8743a', tip: 0.8 });
        club(ctx, cx - Lh * 0.5, yG + (tall ? 60 : 30), -0.03, 250, 26); club(ctx, cx - Lh * 0.3, yG + (tall ? 92 : 50), 0.02, 230, 22, '#a8743a');
        void tassel; void lighter; void hash; void lerp; void d2r; void clamp; void blob; void bulb; void pool; void eRing; void TAU;
      } };
    },
  }); },
});
defVoice('garamut-low', 'woodtok', { dur: 0.42, gain: 0.7, hollow: 1.0, overtone: 1.9 });
defVoice('garamut-high', 'woodtok', { dur: 0.3, gain: 0.6, hollow: 1.2, overtone: 2.3 });
defVoice('garamut-end', 'skin', { dur: 0.22, drop: 1.05, glide: 0.02, modes: [[1, 1, 1], [1.7, 0.5, 0.5]], click: { f: 900, gain: 0.5 }, shell: { f: 200, q: 5, gain: 0.5, dur: 0.2 }, lp: 1600, gain: 0.7 });
defVoice('garamut-body', 'woodtok', { dur: 0.16, gain: 0.55, hollow: 1.1, overtone: 2.0 });

// ======================================================================================================================================================
// LALI: two hollowed logs seen from straight above, lying on a pandanus mat with tapa borders; each has a long slit with a thick and a thin lip.
// The whole screen is the floor: a woven mat in the middle, bands of printed tapa cloth round it, hibiscus and leaves at the corners. Two long beaters.
// ======================================================================================================================================================
const LAL = [['bl', /big.*low|^low|deep|^boom|thick/], ['bh', /big.*high/], ['sl', /small.*low|^mid/], ['sh', /small.*high|^high/]];
function pandanusFloor(ctx, F, rt, S, scene) {
  const A = F.area;
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
  ctx.fillStyle = '#e8d8b0'; ctx.fillRect(A.x, A.y, A.w, A.h);
  // sand under the mat edges
  for (let k = 0; k < 300; k++) { ctx.fillStyle = `rgba(${hash(k) > 0.5 ? '190,160,110' : '250,238,200'},0.35)`; circ(ctx, A.x + A.w * hash(k * 3 + 1), A.y + A.h * hash(k * 5 + 2), 1 + 2 * hash(k)); ctx.fill(); }
  // the mat: a plait of pale and tan strips laid diagonally, edged in black and red
  const m = Math.min(A.w, A.h) * 0.045, mx = A.x + m, my = A.y + m, mw = A.w - 2 * m, mh = A.h - 2 * m;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, mx + 6, my + 8, mw, mh, 10); ctx.fill();
  ctx.save(); rrect(ctx, mx, my, mw, mh, 10); ctx.clip(); ctx.fillStyle = '#d8bc78'; ctx.fillRect(mx, my, mw, mh);
  const st = Math.max(22, mw / 22);
  for (let dir = -1; dir <= 1; dir += 2) for (let k = -Math.ceil(mh / st); k < (mw + mh) / st + 2; k++) { const x0 = mx + k * st, c = (k + (dir > 0 ? 1 : 0)) % 2 ? '#e8d094' : '#b8985a'; ctx.fillStyle = rgba(c, 0.75); ctx.beginPath(); ctx.moveTo(x0, my); ctx.lineTo(x0 + st * 0.6, my); ctx.lineTo(x0 + st * 0.6 + dir * mh, my + mh); ctx.lineTo(x0 + dir * mh, my + mh); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(70,46,14,0.3)'; ctx.lineWidth = 1.2; ctx.stroke(); }
  ctx.restore();
  // tapa cloth bands: cream bark cloth printed in brown and black along the four sides
  const tb = Math.min(A.w, A.h) * 0.09;
  const band = (x, y, w, h, vert) => { ctx.fillStyle = '#f0e4c4'; ctx.fillRect(x, y, w, h); ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); const n = Math.ceil((vert ? h : w) / (tb * 0.9)); for (let k = 0; k < n; k++) { const t = k * tb * 0.9, cx0 = vert ? x + w / 2 : x + t + tb * 0.45, cy0 = vert ? y + t + tb * 0.45 : y + h / 2; ctx.fillStyle = '#4a2810'; ctx.beginPath(); ctx.moveTo(cx0, cy0 - tb * 0.36); ctx.lineTo(cx0 + tb * 0.36, cy0); ctx.lineTo(cx0, cy0 + tb * 0.36); ctx.lineTo(cx0 - tb * 0.36, cy0); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#f0e4c4'; ctx.beginPath(); ctx.moveTo(cx0, cy0 - tb * 0.16); ctx.lineTo(cx0 + tb * 0.16, cy0); ctx.lineTo(cx0, cy0 + tb * 0.16); ctx.lineTo(cx0 - tb * 0.16, cy0); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#1a1008'; circ(ctx, vert ? cx0 : cx0 + tb * 0.45, vert ? cy0 + tb * 0.45 : cy0, 3); ctx.fill(); } ctx.fillStyle = '#4a2810'; if (vert) { ctx.fillRect(x + 4, y, 4, h); ctx.fillRect(x + w - 8, y, 4, h); } else { ctx.fillRect(x, y + 4, w, 4); ctx.fillRect(x, y + h - 8, w, 4); } for (let k = 0; k < 90; k++) { ctx.fillStyle = `rgba(120,90,40,${0.06 * hash(k)})`; ctx.fillRect(x + hash(k * 3) * w, y + hash(k * 5 + 1) * h, 14, 2); } ctx.restore(); };
  band(mx, my, mw, tb, false); band(mx, my + mh - tb, mw, tb, false); band(mx, my + tb, tb, mh - 2 * tb, true); band(mx + mw - tb, my + tb, tb, mh - 2 * tb, true);
  ctx.strokeStyle = '#a8281e'; ctx.lineWidth = 5; rrect(ctx, mx, my, mw, mh, 10); ctx.stroke();
  ctx.restore();
  // hibiscus and leaves at two corners, soft light from the upper left
  const flower = (x, y, s, c) => { for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; ctx.fillStyle = rgrad(ctx, x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.5, 0, s * 0.8, [[0, lighter(c, 0.3)], [1, darker(c, 0.3)]]); ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.55, s * 0.55, s * 0.4, a, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(80,10,10,0.5)'; ctx.lineWidth = 1.4; ctx.stroke(); } ctx.fillStyle = '#ffe070'; circ(ctx, x, y, s * 0.13); ctx.fill(); ctx.strokeStyle = '#f0a020'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s * 0.6, y - s * 0.5); ctx.stroke(); };
  const leaf = (x, y, L, a) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(L * 0.5 + 5, 8, L * 0.5, L * 0.18, 0, 0, TAU); ctx.fill(); ctx.fillStyle = vgrad(ctx, -L * 0.2, L * 0.2, [[0, '#4aa05a'], [1, '#1a5a2c']]); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(L * 0.5, -L * 0.3, L, 0); ctx.quadraticCurveTo(L * 0.5, L * 0.3, 0, 0); ctx.fill(); ctx.strokeStyle = 'rgba(200,240,190,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(L * 0.95, 0); ctx.stroke(); ctx.restore(); };
  const u = Math.min(A.w, A.h);
  for (const [fx, fy, a] of [[0.06, 0.05, 0.6], [0.9, 0.96, 3.6]]) { leaf(A.x + A.w * fx, A.y + A.h * fy, u * 0.3, a); leaf(A.x + A.w * fx, A.y + A.h * fy, u * 0.26, a + 0.7); leaf(A.x + A.w * fx, A.y + A.h * fy, u * 0.24, a - 0.6); flower(A.x + A.w * fx + u * 0.08 * Math.cos(a), A.y + A.h * fy + u * 0.08 * Math.sin(a), u * 0.07, '#d82030'); }
  vignette(ctx, A, 0.4);
}
registerDrumStage({
  id: 'lali', match: /\blali\b|fijian.?log|log.?drum.?pair/,
  build: (S, lanes, P) => { const zoneOf = []; return createDrumStage('lali', S, lanes, P, {
    heroClean: true, dress: withLayer(pandanusFloor),
    voiceOf: (i) => `lali-${zoneOf[i] ?? 'bl'}`,
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 960 } : { w: 1040, h: 580 }, keyOf = assignZones(K, LAL.map(([key, re]) => ({ key, re })));
      for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const by = {};
      const logs = tall ? [{ x: -60, y: 320, L: 360, W: 150, rot: -1.18 + Math.PI / 2 - 0.05, col: '#7a4824', k: 'b' }, { x: 120, y: 640, L: 300, W: 120, rot: -1.05 + Math.PI / 2 + 0.04, col: '#8e5a2c', k: 's' }]
        : [{ x: -180, y: 200, L: 360, W: 120, rot: -0.1, col: '#7a4824', k: 'b' }, { x: 120, y: 400, L: 290, W: 96, rot: 0.06, col: '#8e5a2c', k: 's' }];
      const at = (lg, x, y) => { const [a, b] = rot2(x, y, lg.rot); return [lg.x + a, lg.y + b]; };
      for (const lg of logs) {
        const [lx, ly] = at(lg, 0, lg.W * 0.18), [hx, hy] = at(lg, 0, -lg.W * 0.22);
        by[lg.k + 'l'] = rectSpot(lx, ly, lg.L * 0.7, lg.W * 0.14, lg.rot, { rad: 10 }); by[lg.k + 'h'] = rectSpot(hx, hy, lg.L * 0.7, lg.W * 0.11, lg.rot, { rad: 10 });
      }
      const spots = new Array(K.N).fill(null); for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
      return { ref, spots, wallU: 0, draw(ctx, rt) {
        for (const lg of logs) {
          const vl = fl(K, keyOf, rt, lg.k + 'l'), vh = fl(K, keyOf, rt, lg.k + 'h'), L = lg.L, W = lg.W, col = lg.col;
          ctx.save(); ctx.translate(lg.x, lg.y); ctx.rotate(lg.rot);
          const body = () => { ctx.beginPath(); ctx.moveTo(-L + 20, -W); ctx.lineTo(L - 20, -W); ctx.quadraticCurveTo(L + 8, -W, L + 8, 0); ctx.quadraticCurveTo(L + 8, W, L - 20, W); ctx.lineTo(-L + 20, W); ctx.quadraticCurveTo(-L - 8, W, -L - 8, 0); ctx.quadraticCurveTo(-L - 8, -W, -L + 20, -W); ctx.closePath(); };
          ctx.save(); ctx.translate(10, 16); body(); ctx.fillStyle = 'rgba(0,0,0,0.34)'; ctx.fill(); ctx.restore();
          body(); ctx.fillStyle = vgrad(ctx, -W, W, [[0, darker(col, 0.5)], [0.15, lighter(col, 0.3)], [0.5, col], [0.85, darker(col, 0.45)], [1, darker(col, 0.7)]]); ctx.fill();
          ctx.save(); body(); ctx.clip(); grain(ctx, -L, -W, 2 * L, 2 * W, '#1c0c04', 0.45, lg.k === 'b' ? 3 : 8, false, 50);
          for (const f of [-0.84, -0.78, 0.78, 0.84]) { ctx.strokeStyle = f < 0 ? 'rgba(232,224,204,0.8)' : 'rgba(168,40,30,0.85)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(L * f, -W); ctx.lineTo(L * f, W); ctx.stroke(); }
          ctx.restore(); body(); ctx.strokeStyle = 'rgba(20,8,2,0.9)'; ctx.lineWidth = 2.8; ctx.stroke();
          // the slit with its thick lip (lower) and thin lip (upper), a dark hollow between
          const sw = W * 0.2, sl = L * 0.78;
          ctx.fillStyle = vgrad(ctx, -W * 0.3, W * 0.4, [[0, lighter(col, 0.35)], [1, darker(col, 0.3)]]); rrect(ctx, -sl - 12, -W * 0.34, 2 * sl + 24, W * 0.7, W * 0.2); ctx.fill(); ctx.strokeStyle = 'rgba(20,8,2,0.85)'; ctx.lineWidth = 2.4; ctx.stroke();
          ctx.fillStyle = vgrad(ctx, -sw, sw, [[0, '#080402'], [1, '#2a1406']]); rrect(ctx, -sl, -sw * 0.8, 2 * sl, sw * 1.6, sw * 0.8); ctx.fill();
          ctx.strokeStyle = 'rgba(255,224,170,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-sl + 10, sw * 0.7); ctx.lineTo(sl - 10, sw * 0.7); ctx.stroke();
          if (vl > 0.05) { ctx.fillStyle = `rgba(255,214,150,${0.35 * vl})`; rrect(ctx, -L * 0.7, W * 0.18 - W * 0.14, L * 1.4, W * 0.28, 10); ctx.fill(); }
          if (vh > 0.05) { ctx.fillStyle = `rgba(255,214,150,${0.35 * vh})`; rrect(ctx, -L * 0.7, -W * 0.22 - W * 0.11, L * 1.4, W * 0.22, 10); ctx.fill(); }
          ctx.restore();
          const [lx, ly] = at(lg, -L * 0.2, lg.W * 0.18), [hx, hy] = at(lg, L * 0.2, -lg.W * 0.22);
          visitStick(ctx, lx, ly, vl, { ang: 1.2, dir: [0.5, -1], back: 120, len: tall ? 330 : 270, w: 16, col: '#c8a060', tip: 0.6 });
          visitStick(ctx, hx, hy, vh, { ang: 2.0, dir: [-0.5, -1], back: 120, len: tall ? 330 : 270, w: 14, col: '#d8b070', tip: 0.6 });
        }
        void tassel; void clamp; void woodH; void club; void lerp; void d2r; void eSpot; void eRing; void floorShadow; void blob; void bulb; void pool; void speckle; void ell; void circ; void stick; void hgrad; void rgrad; void TAU;
      } };
    },
  }); },
});
defVoice('lali-bl', 'woodtok', { dur: 0.38, gain: 0.7, hollow: 1.0, overtone: 1.8 });
defVoice('lali-bh', 'woodtok', { dur: 0.28, gain: 0.62, hollow: 1.2, overtone: 2.2 });
defVoice('lali-sl', 'woodtok', { dur: 0.3, gain: 0.64, hollow: 1.1, overtone: 2.0 });
defVoice('lali-sh', 'woodtok', { dur: 0.2, gain: 0.56, hollow: 1.4, overtone: 2.6 });

// ======================================================================================================================================================
// PATE: a small carved box of hardwood with a narrow slit across its top, seen head-on and a little from above, on a fine mat on a timber platform. Behind
// it the inside of a round open house: a domed roof of radiating rafters lashed with coconut-fibre cord, posts, and a floor of pale mats.
// ======================================================================================================================================================
const PAT = [['l', /left|low|^deep|boom/], ['r', /right|high|^ring|crack/], ['f', /front|face|body|carv/], ['e', /edge|end|side|rim/]];
function roundHouse(ctx, F, rt, S, scene) {
  const A = F.area, wallB = wallBottom(F, scene), wallH = wallB - A.y, cx = A.x + A.w / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
  ctx.fillStyle = vgrad(ctx, A.y, wallB, [[0, '#1a0e06'], [0.5, '#3a2210'], [1, '#6a4420']]); ctx.fillRect(A.x, A.y, A.w, wallH);
  // the dome seen from inside: rafters radiating from the peak, ring beams, thatch between
  const px = cx, py = A.y - wallH * 0.12, R = Math.max(A.w * 0.9, wallH * 1.1);
  for (let k = 0; k < 26; k++) { const a = PI * (0.08 + 0.84 * k / 25); ctx.strokeStyle = k % 2 ? 'rgba(200,150,80,0.18)' : 'rgba(30,16,6,0.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a) * R * 1.3, py + Math.sin(a) * R * 1.3); ctx.stroke(); }
  for (let k = 1; k < 5; k++) { const rr = R * k * 0.2; ctx.strokeStyle = '#4a2a12'; ctx.lineWidth = 12 - k; ctx.beginPath(); ctx.arc(px, py, rr, 0.05, PI - 0.05); ctx.stroke(); ctx.strokeStyle = 'rgba(232,194,120,0.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py - 3, rr, 0.12, PI - 0.12); ctx.stroke(); for (let j = 0; j < 26; j++) { const a = PI * (0.08 + 0.84 * j / 25), x = px + Math.cos(a) * rr, y = py + Math.sin(a) * rr; ctx.fillStyle = '#c8302a'; ctx.fillRect(x - 3, y - 7, 6, 14); ctx.fillStyle = '#efe0b8'; ctx.fillRect(x - 3, y - 2, 6, 4); } }
  // posts and an open view of green and sea light at the sides
  const pw = Math.min(A.w * 0.075, 58);
  for (const sx of [0.13, 0.87]) { const x = A.x + A.w * sx; ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x - pw / 2 + 8, A.y + wallH * 0.25, pw, wallH * 0.75); ctx.fillStyle = hgrad(ctx, x - pw / 2, x + pw / 2, [[0, '#2a1608'], [0.3, '#9a6a34'], [0.6, '#5a3a18'], [1, '#1a0c04']]); ctx.fillRect(x - pw / 2, A.y + wallH * 0.2, pw, wallH * 0.8); for (let k = 0; k < 8; k++) { ctx.fillStyle = '#c8a060'; ctx.fillRect(x - pw / 2 - 2, A.y + wallH * (0.3 + 0.09 * k), pw + 4, 5); } }
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgrad(ctx, cx, A.y + wallH * 0.62, 0, A.w * 0.6, [[0, 'rgba(255,214,150,0.3)'], [1, 'rgba(255,214,150,0)']]); ctx.fillRect(A.x, A.y, A.w, wallH); ctx.restore();
  // a timber platform edge and the pale mat floor
  ctx.fillStyle = vgrad(ctx, wallB - 20, wallB, [[0, '#6a4220'], [1, '#2a1608']]); ctx.fillRect(A.x, wallB - 20, A.w, 20); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(A.x, wallB, A.w, 6);
  const fh = A.y + A.h - wallB; ctx.fillStyle = vgrad(ctx, wallB, A.y + A.h, [[0, '#e4cc90'], [1, '#a88a50']]); ctx.fillRect(A.x, wallB, A.w, fh);
  for (let k = -14; k <= 14; k++) { ctx.strokeStyle = 'rgba(90,60,20,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + k * A.w * 0.03, wallB); ctx.lineTo(cx + k * A.w * 0.12, A.y + A.h); ctx.stroke(); }
  for (let k = 1; k < 9; k++) { const yy = wallB + fh * Math.pow(k / 9, 1.4); ctx.strokeStyle = 'rgba(90,60,20,0.22)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(A.x, yy); ctx.lineTo(A.x + A.w, yy); ctx.stroke(); }
  ctx.restore();
  pool(ctx, cx, wallB + fh * 0.2, A.w * 0.5, A.h * 0.26, '#ffd890', 0.3); vignette(ctx, A, 0.52);
}
registerDrumStage({
  id: 'pate', match: /\bpate\b|samoan.?slit|hand.?slit/,
  build: (S, lanes, P) => { const zoneOf = []; return createDrumStage('pate', S, lanes, P, {
    heroClean: true, dress: withLayer(roundHouse),
    voiceOf: (i) => `pate-${zoneOf[i] ?? 'l'}`,
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 960 } : { w: 1040, h: 580 }, keyOf = assignZones(K, PAT.map(([key, re]) => ({ key, re })));
      for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const Wb = tall ? 330 : 300, Hb = tall ? 230 : 190, top = tall ? 100 : 80, cx = 0, cy = tall ? 560 : 300, by = {};
      by.l = rectSpot(-Wb * 0.5, cy - Hb * 0.5 - top * 0.1, Wb * 0.46, top * 0.5, 0, { rad: 10 });
      by.r = rectSpot(Wb * 0.5, cy - Hb * 0.5 - top * 0.1, Wb * 0.46, top * 0.5, 0, { rad: 10 });
      by.f = rectSpot(0, cy + Hb * 0.12, Wb * 0.78, Hb * 0.3, 0, { rad: 14 });
      by.e = rectSpot(0, cy - Hb * 0.5 - top * 0.5 - 22, Wb * 0.9, 16, 0, { rad: 8 });
      const spots = new Array(K.N).fill(null); for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
      const col = '#7e4a22', yG = cy + Hb * 0.5 + (tall ? 100 : 60);
      return { ref, spots, wallU: yG - 24, draw(ctx, rt) {
        const vl = fl(K, keyOf, rt, 'l'), vr = fl(K, keyOf, rt, 'r'), vf = fl(K, keyOf, rt, 'f'), ve = fl(K, keyOf, rt, 'e');
        // the mat the box stands on
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, cx - Wb * 0.82 + 8, yG - 50 + 12, Wb * 1.64, 96, 8); ctx.fill();
        ctx.fillStyle = '#c8a860'; rrect(ctx, cx - Wb * 0.82, yG - 50, Wb * 1.64, 96, 8); ctx.fill(); ctx.save(); rrect(ctx, cx - Wb * 0.82, yG - 50, Wb * 1.64, 96, 8); ctx.clip(); for (let k = 0; k < 30; k++) { ctx.fillStyle = k % 2 ? 'rgba(255,240,190,0.25)' : 'rgba(90,60,20,0.22)'; ctx.fillRect(cx - Wb * 0.82 + k * Wb * 0.055, yG - 50, Wb * 0.04, 96); } ctx.restore(); ctx.strokeStyle = '#a8281e'; ctx.lineWidth = 6; rrect(ctx, cx - Wb * 0.82, yG - 50, Wb * 1.64, 96, 8); ctx.stroke(); ctx.strokeStyle = '#2a1408'; ctx.lineWidth = 2; ctx.stroke();
        // a tapa runner under the box and hibiscus laid on the mat
        ctx.fillStyle = '#f0e4c4'; rrect(ctx, cx - Wb * 0.7, cy + Hb * 0.5 - 6, Wb * 1.4, 34, 4); ctx.fill(); ctx.strokeStyle = '#4a2810'; ctx.lineWidth = 3; ctx.stroke(); for (let k = 0; k < 14; k++) { const x = cx - Wb * 0.66 + k * Wb * 1.32 / 13; ctx.fillStyle = '#4a2810'; ctx.beginPath(); ctx.moveTo(x, cy + Hb * 0.5 + 4); ctx.lineTo(x + 8, cy + Hb * 0.5 + 11); ctx.lineTo(x, cy + Hb * 0.5 + 18); ctx.lineTo(x - 8, cy + Hb * 0.5 + 11); ctx.closePath(); ctx.fill(); }
        for (const [fx, fy] of [[cx + Wb * 0.82, yG - 8], [cx + Wb * 0.7, yG + 14]]) { for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; ctx.fillStyle = rgrad(ctx, fx + Math.cos(a) * 9, fy + Math.sin(a) * 9, 0, 16, [[0, '#ff6a7a'], [1, '#b81830']]); ctx.beginPath(); ctx.ellipse(fx + Math.cos(a) * 11, fy + Math.sin(a) * 11, 12, 8, a, 0, TAU); ctx.fill(); } ctx.fillStyle = '#ffe070'; circ(ctx, fx, fy, 4); ctx.fill(); }
        floorShadow(ctx, cx + 10, cy + Hb * 0.5 + 18, Wb * 0.95, 22, 0.6);
        const x0 = cx - Wb, x1 = cx + Wb, yT = cy - Hb * 0.5, yB = cy + Hb * 0.5;
        // the front face: pale wood with a carved diamond band, rounded ends
        ctx.beginPath(); ctx.moveTo(x0 + 14, yT); ctx.lineTo(x1 - 14, yT); ctx.quadraticCurveTo(x1 + 8, yT, x1 + 8, yT + 20); ctx.lineTo(x1 + 8, yB - 14); ctx.quadraticCurveTo(x1 + 8, yB, x1 - 14, yB); ctx.lineTo(x0 + 14, yB); ctx.quadraticCurveTo(x0 - 8, yB, x0 - 8, yB - 14); ctx.lineTo(x0 - 8, yT + 20); ctx.quadraticCurveTo(x0 - 8, yT, x0 + 14, yT); ctx.closePath();
        ctx.fillStyle = vgrad(ctx, yT, yB, [[0, lighter(col, 0.3)], [0.3, col], [1, darker(col, 0.55)]]); ctx.fill(); ctx.save(); ctx.clip(); grain(ctx, x0, yT, 2 * Wb, Hb, '#1a0a02', 0.5, 6, false, 20);
        ctx.fillStyle = hgrad(ctx, x0, x1, [[0, 'rgba(0,0,0,0.35)'], [0.1, 'rgba(255,230,190,0.12)'], [0.5, 'rgba(255,255,255,0)'], [0.9, 'rgba(0,0,0,0.1)'], [1, 'rgba(0,0,0,0.4)']]); ctx.fillRect(x0, yT, 2 * Wb, Hb);
        const bh = Hb * 0.34, by0 = yT + Hb * 0.3; ctx.fillStyle = 'rgba(30,14,4,0.8)'; ctx.fillRect(x0, by0 - 3, 2 * Wb, bh + 6); ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x0, by0, 2 * Wb, bh); for (let k = 0; k < 26; k++) { const x = x0 + 12 + k * (2 * Wb - 24) / 25; ctx.fillStyle = k % 2 ? '#a8281e' : '#1a1008'; ctx.beginPath(); ctx.moveTo(x, by0 + 4); ctx.lineTo(x + 11, by0 + bh / 2); ctx.lineTo(x, by0 + bh - 4); ctx.lineTo(x - 11, by0 + bh / 2); ctx.closePath(); ctx.fill(); }
        ctx.restore(); ctx.strokeStyle = 'rgba(20,8,2,0.9)'; ctx.lineWidth = 2.8; ctx.stroke();
        // the top: a lighter slab seen at a slant with the slit between two lips
        const tw = Wb * 2 - 20;
        ctx.beginPath(); ctx.moveTo(x0 + 14, yT); ctx.lineTo(x0 + 34, yT - top); ctx.lineTo(x1 - 34, yT - top); ctx.lineTo(x1 - 14, yT); ctx.closePath(); ctx.fillStyle = vgrad(ctx, yT - top, yT, [[0, lighter(col, 0.45)], [1, lighter(col, 0.1)]]); ctx.fill(); ctx.save(); ctx.clip(); grain(ctx, x0, yT - top, 2 * Wb, top, '#1a0a02', 0.4, 9, false, 8); ctx.restore(); ctx.strokeStyle = 'rgba(20,8,2,0.9)'; ctx.lineWidth = 2.6; ctx.stroke();
        ctx.fillStyle = vgrad(ctx, yT - top * 0.62, yT - top * 0.3, [[0, '#080402'], [1, '#2a1406']]); rrect(ctx, x0 + 52, yT - top * 0.64, tw - 80, top * 0.36, top * 0.18); ctx.fill(); ctx.strokeStyle = 'rgba(255,224,170,0.4)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x0 + 60, yT - top * 0.28); ctx.lineTo(x1 - 60, yT - top * 0.28); ctx.stroke();
        for (const [x, v] of [[cx - Wb * 0.5, vl], [cx + Wb * 0.5, vr]]) if (v > 0.05) { ctx.fillStyle = `rgba(255,214,150,${0.35 * v})`; rrect(ctx, x - Wb * 0.44, yT - top * 0.72, Wb * 0.88, top * 0.5, 10); ctx.fill(); }
        if (vf > 0.05) { ctx.fillStyle = `rgba(255,214,150,${0.3 * vf})`; rrect(ctx, cx - Wb * 0.78, cy + Hb * 0.12 - Hb * 0.3, Wb * 1.56, Hb * 0.6, 14); ctx.fill(); }
        if (ve > 0.05) { ctx.fillStyle = `rgba(255,214,150,${0.3 * ve})`; rrect(ctx, cx - Wb * 0.9, yT - top - 14, Wb * 1.8, 18, 8); ctx.fill(); }
        visitStick(ctx, cx - Wb * 0.55, yT - top * 0.46, vl, { ang: 1.2, dir: [0.7, -1], back: 110, len: tall ? 250 : 210, w: 12, col: '#d8b070', tip: 0.6 });
        visitStick(ctx, cx + Wb * 0.55, yT - top * 0.46, vr, { ang: 1.95, dir: [-0.7, -1], back: 110, len: tall ? 250 : 210, w: 12, col: '#c8a060', tip: 0.6 });
        stick(ctx, cx - Wb * 0.7, yG + 8, -0.03, 200, 10, { col: '#d8b070', tip: 0.6 }); stick(ctx, cx - Wb * 0.2, yG + 26, 0.02, 190, 10, { col: '#c8a060', tip: 0.6 });
        void tassel; void clamp; void lerp; void d2r; void eSpot; void eRing; void blob; void bulb; void speckle; void rgba; void darker; void woodH; void rgrad; void TAU; void ell; void circ; void hash; void club; void rot2;
      } };
    },
  }); },
});
defVoice('pate-l', 'woodtok', { dur: 0.2, gain: 0.62, hollow: 1.4, overtone: 2.4 });
defVoice('pate-r', 'woodtok', { dur: 0.14, gain: 0.58, hollow: 1.8, overtone: 3.0 });
defVoice('pate-f', 'woodtok', { dur: 0.1, gain: 0.5, hollow: 1.1, overtone: 2.0 });
defVoice('pate-e', 'woodtok', { dur: 0.06, gain: 0.5, hollow: 2.2, overtone: 4.0 });

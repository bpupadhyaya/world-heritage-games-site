// Drum stages, third wave (1.20.0): side views and filled backdrops. The bongo, timbales and naqareh of 1.18.0 were three top-down pairs of round heads on
// a patterned floor; here each one is its own picture: a stand-mounted bongo pair seen from the side in a teal courtyard, timbales on a stage stand with a
// cowbell block and a cascara lane under the lights, and copper kettledrums on a low stand with a different lane geometry in a tiled Persian niche.
// Later in the file: conga, surdo, riq and udu. No performer is drawn; the struck zone flares and the skin shivers.
import { registerDrumStage } from './registry.js';
import { createDrumStage, eSpot, eRing, eSector, rSpot, rectSpot, assignZones, staticLayer, rot2 } from './drum-kit.js';
import { registerStrikeVoice } from './voice-registry.js';
import { defVoice } from './voice-synth2.js';
import { pool, vignette } from './set.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, circ, ell, hash, TAU, grain, floorShadow, chromeH, tube, taperBody, barrelBody, headSide, foot, bolt, shiver, blob, speckle, bulb, skinHead, hoop } from './drum-side.js';

const PI = Math.PI, d2r = (d) => d * PI / 180;
export { staticLayer };
const fl = (K, keyOf, rt, ...ks) => { let m = 0; for (let i = 0; i < K.N; i++) if (ks.includes(keyOf[i])) m = Math.max(m, rt.flash[i]); return m; };
const wood = (ctx, x0, x1, c) => hgrad(ctx, x0, x1, [[0, darker(c, 0.6)], [0.25, lighter(c, 0.3)], [0.55, c], [0.85, darker(c, 0.45)], [1, darker(c, 0.7)]]);
// a wooden block with grain and a lit top edge
function block(ctx, x, y, w, h, r, c, seed = 5) {
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; rrect(ctx, x + 6, y + 9, w, h, r); ctx.fill();
  ctx.save(); rrect(ctx, x, y, w, h, r); ctx.fillStyle = vgrad(ctx, y, y + h, [[0, lighter(c, 0.35)], [0.3, c], [1, darker(c, 0.55)]]); ctx.fill(); ctx.clip();
  grain(ctx, x, y, w, h, darker(c, 0.7), 0.4, seed, false, 9); ctx.restore();
  rrect(ctx, x, y, w, h, r); ctx.strokeStyle = rgba(darker(c, 0.8), 0.7); ctx.lineWidth = 2; ctx.stroke();
}
const tilesFloor = (ctx, A, y0, c1, c2, c3, size) => {   // encaustic diamond tiles, brighter near the middle
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, y0, A.w, A.y + A.h - y0); ctx.clip();
  ctx.fillStyle = vgrad(ctx, y0, A.y + A.h, [[0, darker(c1, 0.25)], [1, darker(c1, 0.55)]]); ctx.fillRect(A.x, y0, A.w, A.y + A.h - y0);
  const rows = Math.ceil((A.y + A.h - y0) / size) + 1, cols = Math.ceil(A.w / size) + 2;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = A.x + (c - 0.5) * size + (r % 2 ? size / 2 : 0), y = y0 + (r + 0.5) * size * 0.62, k = (r + c) % 3, col = k === 0 ? c2 : k === 1 ? c3 : c1;
    ctx.fillStyle = rgba(col, 0.4); ctx.beginPath(); ctx.moveTo(x, y - size * 0.3); ctx.lineTo(x + size * 0.5, y); ctx.lineTo(x, y + size * 0.3); ctx.lineTo(x - size * 0.5, y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = rgba(lighter(col, 0.5), 0.28); circ(ctx, x, y, size * 0.07); ctx.fill();
  }
  ctx.restore();
};

// ======================================================================================================================================================
// BONGO: a pair of conical wooden shells on a chrome stand, seen from the side and a little from above
// ======================================================================================================================================================
const BONGO = [['mt', /macho.*(open|tone|center|centre|tip)|^macho$|high/], ['ms', /macho.*(slap|heel)|slap.*macho/], ['ht', /hembra.*(open|tone|center|centre|tip)|^hembra$|low/], ['hs', /hembra.*(slap|heel)|slap.*hembra/], ['rim', /rim|click|clave|aro|bridge|shell/]];
function courtyard(ctx, F, rt, S, scene) {
  const A = F.area, wallB = Math.min(A.y + A.h - 40, F.map(0, scene.wallU)[1]);
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
  const wallH = wallB - A.y;
  // plaster wall: teal, patched with ochre and terracotta where the paint has gone
  ctx.fillStyle = vgrad(ctx, A.y, wallB, [[0, '#17434c'], [0.55, '#25707a'], [1, '#2f8187']]); ctx.fillRect(A.x, A.y, A.w, wallH);
  const sc = Math.min(A.w, wallH * 1.5);
  for (let k = 0; k < 8; k++) {
    const x = A.x + A.w * (0.06 + 0.88 * hash(k * 3 + 1)), y = A.y + wallH * (0.25 + 0.7 * hash(k * 5 + 2)), r = sc * (0.035 + 0.05 * hash(k + 9));
    blob(ctx, x, y, r * 1.15, k * 11 + 3, 16, 0.55); ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fill();
    blob(ctx, x, y, r, k * 11 + 3, 16, 0.55); ctx.fillStyle = k % 3 ? '#c78a4c' : '#a95d3b'; ctx.fill();
    blob(ctx, x + r * 0.1, y + r * 0.08, r * 0.62, k * 7 + 1, 12, 0.6); ctx.fillStyle = rgba('#e2b878', 0.55); ctx.fill();
  }
  speckle(ctx, A.x, A.y, A.w, wallH, 260, '#0b2a30', 0.5, 7);
  speckle(ctx, A.x, A.y, A.w, wallH, 150, '#9fd0c8', 0.22, 31);
  // a window with open shutters, warm light inside
  const wallW = A.w, wx = A.x + wallW * (A.w > A.h ? 0.2 : 0.16), ww = Math.min(wallW * 0.22, wallH * 0.34), wy = A.y + wallH * 0.1, wh = wallH * 0.62;
  for (const [x0, flip] of [[wx, 0], [A.x + wallW - wx - ww, 1]]) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, x0 - 8, wy - 8, ww + 16, wh + 16, 8); ctx.fill();
    ctx.fillStyle = vgrad(ctx, wy, wy + wh, [[0, '#2a1608'], [0.5, '#8a5a24'], [1, '#c98a3a']]); rrect(ctx, x0, wy, ww, wh, 6); ctx.fill();
    ctx.fillStyle = rgrad(ctx, x0 + ww / 2, wy + wh * 0.62, 0, ww * 0.9, [[0, flip ? 'rgba(255,214,140,0.55)' : 'rgba(255,214,140,0.2)'], [1, 'rgba(255,214,140,0)']]); ctx.fillRect(x0, wy, ww, wh);
    ctx.strokeStyle = '#d9a84a'; ctx.lineWidth = 5; rrect(ctx, x0, wy, ww, wh, 6); ctx.stroke();
    for (const side of [0, 1]) {   // louvred leaves
      const lw = ww * 0.34, lx = side ? x0 + ww - lw - 3 : x0 + 3;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, lx + 3, wy + 8, lw, wh - 10, 3); ctx.fill();
      ctx.fillStyle = rgba('#d8ab3c', 0.98); rrect(ctx, lx, wy + 5, lw, wh - 10, 3); ctx.fill();
      for (let j = 0; j < 14; j++) { const yy = wy + 12 + j * (wh - 24) / 13; ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(lx + 3, yy, lw - 6, 3); ctx.fillStyle = 'rgba(255,240,170,0.36)'; ctx.fillRect(lx + 3, yy + 3, lw - 6, 1.5); }
      speckle(ctx, lx, wy, lw, wh, 30, '#6a3a10', 0.5, side * 40 + 5, 0.8, 2.2);
    }
  }
  // string of bulbs
  ctx.strokeStyle = 'rgba(20,10,4,0.8)'; ctx.lineWidth = 2; ctx.beginPath();
  const y0 = A.y + wallH * 0.08, sag = wallH * 0.1, nb = A.w > A.h ? 11 : 7;
  for (let k = 0; k <= 40; k++) { const t = k / 40, x = A.x + t * A.w, y = y0 + sag * Math.sin(PI * t) - wallH * 0.04 * (1 - t); if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
  ctx.stroke();
  for (let k = 0; k < nb; k++) { const t = (k + 0.5) / nb, x = A.x + t * A.w, y = y0 + sag * Math.sin(PI * t) - wallH * 0.04 * (1 - t); bulb(ctx, x, y + 9, A.w > A.h ? 7 : 6, '#ffd078'); }
  // baseboard and floor
  ctx.fillStyle = vgrad(ctx, wallB - 14, wallB, [[0, '#7a3f26'], [1, '#4a2216']]); ctx.fillRect(A.x, wallB - 14, A.w, 14);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(A.x, wallB, A.w, 6);
  tilesFloor(ctx, A, wallB, '#cdb88f', '#2a6f76', '#a8502f', Math.max(46, Math.min(A.w, A.h * 1.3) / 9));
  ctx.restore();
  pool(ctx, A.x + A.w / 2, wallB + (A.y + A.h - wallB) * 0.35, A.w * 0.5, A.h * 0.34, '#ffd7a0', 0.3 + 0.05 * (rt?.pul ?? 0));
  vignette(ctx, A, 0.55);
}
registerDrumStage({
  id: 'bongo', match: /bongo|bong[oó]s|bongos/,
  build: (S, lanes, P) => { const zoneOf = []; const layer = staticLayer(); return createDrumStage('bongo', S, lanes, P, {
    dress: () => ({ custom: (ctx, F, rt, S2, scene) => layer(ctx, { x: F.area.x, y: F.area.y, w: F.area.w, h: F.area.h }, (g) => courtyard(g, F, rt, S2, scene)) }),
    voiceOf: (i) => `bongo-${zoneOf[i] ?? 'mt'}`,
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 760, h: 940 } : { w: 900, h: 560 }, keyOf = assignZones(K, BONGO.map(([key, re]) => ({ key, re })));
      for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const k = tall ? 1 : 0.8, ryk = 0.37, yT = tall ? 300 : 150, hx = -158 * (tall ? 1 : 1.3), mx = 146 * (tall ? 1 : 1.3), hr = 140, mr = 118, w = 13, shellH = (tall ? 230 : 190), yF = yT + shellH + (tall ? 300 : 150);
      const by = {};
      by.ht = eSpot(hx, yT, hr * 0.5, hr * 0.5 * ryk * 1.15, 0, { apk: 0.95 }); by.hs = eRing(hx, yT, hr, hr * ryk, 0, 0.62, 0.97, -PI / 2);
      by.mt = eSpot(mx, yT, mr * 0.5, mr * 0.5 * ryk * 1.15, 0, { apk: 0.95 }); by.ms = eRing(mx, yT, mr, mr * ryk, 0, 0.62, 0.97, -PI / 2);
      by.rim = eSector(mx, yT + 14, mr + w, (mr + w) * ryk, 0, 1.0, 1.34, d2r(25), d2r(155));
      const spots = new Array(K.N).fill(null); for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
      const col = '#b4602a', rimC = '#d6d9df', skinH = { tint: '#ecd9b2', edge: '#a8865a', lugs: 6, rim: rimC, w, band: 13, wear: 0.8 };
      return { ref, spots, wallU: yT + shellH + 40 * k, draw(ctx, rt) {
        const vh = fl(K, keyOf, rt, 'ht', 'hs'), vm = fl(K, keyOf, rt, 'mt', 'ms', 'rim'), pcx = (hx + mx) / 2;
        // the stand first: a post, a tripod and two cradle arms
        floorShadow(ctx, pcx, yF + 6, 250, 44, 0.5);
        const legs = [[-205, yF + 4], [190, yF + 4], [pcx, yF + 30]], yPost = yT + shellH * 0.86;
        for (const [lx, ly] of legs) tube(ctx, (g) => { g.beginPath(); g.moveTo(pcx, yF - (yF - yPost) * 0.38); g.lineTo(lx, ly - 8); }, 13, '#bcc2cc');
        for (const [lx, ly] of legs) foot(ctx, lx, ly, 11);
        tube(ctx, (g) => { g.beginPath(); g.moveTo(pcx, yPost); g.lineTo(pcx, yF - (yF - yPost) * 0.38); }, 17, '#c9ced6');
        // shells
        const shellAt = (cx, r, ph) => { taperBody(ctx, cx, yT, r + 4, yT + shellH, (r + 4) * 0.62, ryk, { col, staves: 9, seed: ph, gloss: 0.8 }); };
        shellAt(hx, hr, 6); shellAt(mx, mr, 9);
        // cradle rings round the shells, joined to the post
        for (const [cx, r] of [[hx, hr], [mx, mr]]) {
          const t = 0.74, rr = (r + 4) * (1 - 0.38 * t) + 2, yy = yT + shellH * t;
          tube(ctx, (g) => { g.beginPath(); g.moveTo(pcx, yPost - 8); g.quadraticCurveTo((pcx + cx) / 2, yPost + 30, cx, yy + rr * ryk); }, 11, '#c1c7d0');
          tube(ctx, (g) => { g.beginPath(); g.ellipse(cx, yy, rr, rr * ryk, 0, 0.04, PI - 0.04); }, 10, '#cdd2da', 4);
        }
        bolt(ctx, pcx, yPost, 11, '#e2e5ea');
        // the bridge block bolted across both shells
        const bx = hx + hr * 0.62, bw = (mx - mr * 0.62) - bx, by0 = yT + 84, bh = 64;
        block(ctx, bx, by0, bw, bh, 12, '#8a4a1e', 12);
        bolt(ctx, bx + 16, by0 + bh / 2, 7, '#e8d8a0'); bolt(ctx, bx + bw - 16, by0 + bh / 2, 7, '#e8d8a0');
        ctx.strokeStyle = 'rgba(255,224,170,0.45)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(bx + 14, by0 + 7); ctx.lineTo(bx + bw - 14, by0 + 7); ctx.stroke();
        // heads
        headSide(ctx, hx, yT, hr, ryk, { ...skinH, seed: 6, lugs: 7 }, vh);
        headSide(ctx, mx, yT, mr, ryk, { ...skinH, seed: 9, lugs: 6 }, vm);
        void mix; void chromeH; void circ; void ell; void shiver; void skinHead; void hoop; void TAU; void rSpot; void rot2; void lighter; void wood;
      } };
    },
  }); },
});
defVoice('bongo-mt', 'skin', { dur: 0.2, drop: 1.12, glide: 0.025, modes: [[1, 1, 1], [1.7, 0.5, 0.6], [2.4, 0.3, 0.45]], click: { f: 3200, gain: 0.45 }, shell: { f: 420, q: 5, gain: 0.25 }, lp: 8000, gain: 0.5 });
defVoice('bongo-ms', 'skin', { dur: 0.09, drop: 1.08, modes: [[1, 1, 1], [2.2, 0.6, 0.6], [3.1, 0.4, 0.4]], click: { f: 4600, q: 1, gain: 0.95, dur: 0.02 }, lp: 10000, gain: 0.46 });
defVoice('bongo-ht', 'skin', { dur: 0.26, drop: 1.14, glide: 0.03, modes: [[1, 1, 1], [1.7, 0.5, 0.6], [2.4, 0.3, 0.45]], click: { f: 2600, gain: 0.4 }, shell: { f: 320, q: 5, gain: 0.3 }, lp: 6500, gain: 0.54 });
defVoice('bongo-hs', 'skin', { dur: 0.1, drop: 1.08, modes: [[1, 1, 1], [2.1, 0.6, 0.6], [3.0, 0.4, 0.4]], click: { f: 4000, q: 1, gain: 0.9, dur: 0.02 }, lp: 9000, gain: 0.46 });
defVoice('bongo-rim', 'woodtok', { dur: 0.07, gain: 0.5, hollow: 1.8, overtone: 3.2 });

// ======================================================================================================================================================
// TIMBALES: two shallow chrome drums on a heavy stand with a cowbell block above, under stage lights (cascara on the shell)
// ======================================================================================================================================================
const TIMB = [['hi', /hi|high|tone|abierto|open/], ['lo', /lo|low|bass|grave/], ['rim', /rim|paila|shell|cascara|side/], ['bell', /bell|cowbell|cencerro|campana/]];
function stageBackdrop(ctx, F, rt, S, scene) {
  const A = F.area, wallB = Math.min(A.y + A.h - 40, F.map(0, scene.wallU)[1]), wallH = wallB - A.y;
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
  // a deep violet velvet curtain with folds and a swagged valance
  ctx.fillStyle = vgrad(ctx, A.y, wallB, [[0, '#1c0c3a'], [0.6, '#341566'], [1, '#27114f']]); ctx.fillRect(A.x, A.y, A.w, wallH);
  const fw = Math.max(34, A.w / 16);
  for (let x = A.x - fw; x < A.x + A.w + fw; x += fw) {
    const f = ctx.createLinearGradient(x, 0, x + fw, 0); f.addColorStop(0, 'rgba(0,0,0,0.5)'); f.addColorStop(0.3, 'rgba(160,110,240,0.18)'); f.addColorStop(0.5, 'rgba(200,160,255,0.22)'); f.addColorStop(0.75, 'rgba(0,0,0,0.12)'); f.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = f; ctx.fillRect(x, A.y, fw, wallH);
  }
  const vh = wallH * 0.12;
  for (let x = A.x; x < A.x + A.w + fw * 2; x += fw * 2) {
    ctx.beginPath(); ctx.moveTo(x, A.y); ctx.quadraticCurveTo(x + fw, A.y + vh * 2, x + fw * 2, A.y); ctx.closePath();
    ctx.fillStyle = vgrad(ctx, A.y, A.y + vh * 1.2, [[0, '#4a2290'], [1, '#2a0f5a']]); ctx.fill(); ctx.strokeStyle = '#d9b050'; ctx.lineWidth = 3; ctx.stroke();
  }
  // two spotlight cones from above, additive, landing on the drums
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const [fx, col, a] of [[0.3, '#7fe0ff', 0.2], [0.72, '#ff9ae0', 0.17], [0.5, '#ffe9b0', 0.14]]) {
    const x0 = A.x + A.w * fx, x1 = A.x + A.w * (0.5 + (fx - 0.5) * 0.35), g = ctx.createLinearGradient(0, A.y, 0, wallB + 30);
    g.addColorStop(0, rgba(col, a * 1.4)); g.addColorStop(1, rgba(col, a * 0.15)); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x0 - 8, A.y); ctx.lineTo(x0 + 8, A.y); ctx.lineTo(x1 + A.w * 0.19, wallB + 30); ctx.lineTo(x1 - A.w * 0.19, wallB + 30); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  // the stage: glossy dark boards with the footlights along the front lip
  ctx.fillStyle = vgrad(ctx, wallB, A.y + A.h, [[0, '#18121c'], [1, '#08060c']]); ctx.fillRect(A.x, wallB, A.w, A.y + A.h - wallB);
  const fh = A.y + A.h - wallB, cx0 = A.x + A.w / 2;
  ctx.lineWidth = 2;
  for (let k = -12; k <= 12; k++) { ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.beginPath(); ctx.moveTo(cx0 + k * A.w * 0.012, wallB); ctx.lineTo(cx0 + k * A.w * 0.12, A.y + A.h); ctx.stroke(); }
  for (let k = 1; k < 5; k++) { const yy = wallB + fh * Math.pow(k / 5, 1.5); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(A.x, yy); ctx.lineTo(A.x + A.w, yy); ctx.stroke(); }
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(A.x, wallB - 2, A.w, 7);
  ctx.fillStyle = '#d9b050'; ctx.fillRect(A.x, wallB - 4, A.w, 3);
  for (let k = 0; k < 14; k++) bulb(ctx, A.x + (k + 0.5) * A.w / 14, A.y + A.h - 10, 4, '#ffc878');
  ctx.restore();
  pool(ctx, cx0, wallB + fh * 0.2, A.w * 0.45, A.h * 0.26, '#c8b4ff', 0.34 + 0.05 * (rt?.pul ?? 0));
  vignette(ctx, A, 0.5);
}
function cowbell(ctx, x, y, w, h, vib, c = '#8e949f') {
  ctx.save(); ctx.translate(x, y + vib * 3);
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.moveTo(-w * 0.36 + 8, 10); ctx.lineTo(w * 0.36 + 8, 10); ctx.lineTo(w * 0.5 + 8, h + 12); ctx.lineTo(-w * 0.5 + 8, h + 12); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-w * 0.36, 0); ctx.lineTo(w * 0.36, 0); ctx.lineTo(w * 0.5, h); ctx.lineTo(-w * 0.5, h); ctx.closePath();
  ctx.fillStyle = hgrad(ctx, -w / 2, w / 2, [[0, darker(c, 0.55)], [0.18, lighter(c, 0.6)], [0.42, c], [0.7, darker(c, 0.35)], [0.9, lighter(c, 0.3)], [1, darker(c, 0.6)]]); ctx.fill();
  ctx.strokeStyle = '#1c2028'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.fillStyle = vgrad(ctx, 0, h, [[0, 'rgba(255,255,255,0.25)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.35)']]); ctx.fillRect(-w, 0, 2 * w, h); ctx.restore();
  // the mouth: a dark opening along the lower edge
  ctx.fillStyle = '#0e1016'; ell(ctx, 0, h, w * 0.46, h * 0.16); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, h, w * 0.46, h * 0.16, 0, PI * 0.05, PI * 0.95); ctx.stroke();
  // top slot and clamp
  ctx.fillStyle = '#1c2028'; rrect(ctx, -w * 0.18, 5, w * 0.36, 7, 3); ctx.fill();
  ctx.restore();
}
registerDrumStage({
  id: 'timbales', match: /timbal|timbale/,
  build: (S, lanes, P) => { const zoneOf = []; const layer = staticLayer(); return createDrumStage('timbales', S, lanes, P, {
    dress: () => ({ custom: (ctx, F, rt, S2, scene) => layer(ctx, { x: F.area.x, y: F.area.y, w: F.area.w, h: F.area.h }, (g) => stageBackdrop(g, F, rt, S2, scene)) }),
    voiceOf: (i) => `timbales-${zoneOf[i] ?? 'hi'}`,
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 940 } : { w: 940, h: 560 }, keyOf = assignZones(K, TIMB.map(([key, re]) => ({ key, re })));
      for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const ryk = 0.34, lr = 150, hr = 130, w = 12, lx = tall ? -176 : -230, hx = tall ? 170 : 230, yT = tall ? 540 : 330, shellH = tall ? 130 : 105, yF = yT + shellH + (tall ? 210 : 100), by = {};
      const bellY = tall ? 210 : 70, bellX = 0;
      by.lo = eSpot(lx, yT, lr * 0.92, lr * 0.92 * ryk, 0, { apk: 0.82 }); by.hi = eSpot(hx, yT, hr * 0.92, hr * 0.92 * ryk, 0, { apk: 0.82 });
      by.rim = rSpot(hx, yT + hr * ryk + shellH * 0.5 + 4, hr * 0.8, shellH * 0.34, 0, { rad: 12, ap: { cx: hx, cy: yT + hr * ryk + shellH * 0.5 + 4, rx: hr * 0.74, ry: shellH * 0.3, rot: 0, rect: true, rad: 10 } });
      by.bell = eSpot(bellX, bellY + 46, 62, 52, 0, { apk: 0.8 });
      const spots = new Array(K.N).fill(null); for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
      const skin = { tint: '#f6f2e6', edge: '#c9c4b2', rim: '#c4cad4', w, band: 12, lugs: 8, wear: 0.4, lugLen: 22 };
      return { ref, spots, wallU: yT + shellH + (tall ? 70 : 40), draw(ctx, rt) {
        const vl = fl(K, keyOf, rt, 'lo'), vh = fl(K, keyOf, rt, 'hi', 'rim'), vb = fl(K, keyOf, rt, 'bell'), pcx = (lx + hx) / 2;
        floorShadow(ctx, pcx, yF + 4, 300, 40, 0.55);
        // heavy double-braced stand: two splayed legs, a cross brace, a post to the cowbell bar
        const ybase = yF - (yF - (yT + shellH)) * 0.55;
        for (const sx of [-1, 1]) { tube(ctx, (g) => { g.beginPath(); g.moveTo(pcx, ybase); g.lineTo(pcx + sx * 240, yF - 2); }, 13, '#b4bac4'); foot(ctx, pcx + sx * 240, yF, 12); }
        tube(ctx, (g) => { g.beginPath(); g.moveTo(pcx, yT + shellH * 0.7); g.lineTo(pcx, yF - 8); }, 17, '#c4cad4');
        tube(ctx, (g) => { g.beginPath(); g.moveTo(pcx - 135, yF - 78); g.lineTo(pcx + 135, yF - 78); }, 8, '#9aa0aa');
        foot(ctx, pcx, yF + 12, 12);
        // the cowbell rod and mount (behind the drums)
        tube(ctx, (g) => { g.beginPath(); g.moveTo(pcx, yT); g.lineTo(pcx, bellY + 8); g.lineTo(pcx - 86, bellY + 8); g.moveTo(pcx, bellY + 8); g.lineTo(pcx + 90, bellY + 8); }, 10, '#b8beca');
        cowbell(ctx, bellX, bellY + 6, 118, 100, vb, '#8e949f');
        cowbell(ctx, pcx + 102, bellY + 16, 80, 70, 0, '#a2a8b2');
        // shells and cradle arms
        for (const [cx, r] of [[lx, lr], [hx, hr]]) {
          taperBody(ctx, cx, yT, r + 4, yT + shellH, (r + 4) * 0.98, ryk, { col: '#b6bcc8', metal: true });
          tube(ctx, (g) => { g.beginPath(); g.moveTo(pcx, yT + shellH * 0.7); g.quadraticCurveTo((pcx + cx) / 2, yT + shellH * 0.95 + 20, cx - Math.sign(cx) * r * 0.5, yT + shellH + r * ryk * 0.75); }, 11, '#bcc2cc');
          headSide(ctx, cx, yT, r, ryk, { ...skin, seed: cx > 0 ? 8 : 3 }, cx > 0 ? vh : vl);
        }
        void mix; void chromeH; void circ; void shiver; void skinHead; void hoop; void TAU; void rot2; void lighter; void wood; void blob; void speckle; void block; void tilesFloor;
      } };
    },
  }); },
});
defVoice('timbales-hi', 'skin', { dur: 0.16, drop: 1.05, glide: 0.02, modes: [[1, 1, 1], [1.8, 0.7, 0.8], [2.6, 0.5, 0.6], [3.5, 0.3, 0.5]], click: { f: 4400, q: 1, gain: 0.8, dur: 0.02 }, shell: { f: 1200, q: 8, gain: 0.3, dur: 0.18 }, lp: 12000, gain: 0.46 });
defVoice('timbales-lo', 'skin', { dur: 0.22, drop: 1.06, glide: 0.025, modes: [[1, 1, 1], [1.8, 0.7, 0.8], [2.6, 0.5, 0.6]], click: { f: 3600, q: 1, gain: 0.7, dur: 0.02 }, shell: { f: 900, q: 8, gain: 0.3, dur: 0.2 }, lp: 10000, gain: 0.5 });
defVoice('timbales-rim', 'metal', { dur: 0.16, partials: [[1, 1, 1], [1.5, 0.7, 0.8], [2.4, 0.6, 0.6], [3.9, 0.4, 0.4], [5.6, 0.3, 0.3]], gain: 0.34, strike: 0.9, wet: 0.08 });
defVoice('timbales-bell', 'metal', { dur: 0.42, partials: [[1, 1, 1], [1.51, 0.8, 0.8], [2.77, 0.5, 0.5], [4.2, 0.3, 0.35]], gain: 0.34, strike: 0.6, wet: 0.1 });

// ======================================================================================================================================================
// NAQAREH: a pair of tilted copper kettles in a low wooden cradle on a carpet, in front of a tiled niche; struck with curved sticks.
// Lane geometry differs from the drums above: a centre disc and a crescent along the near rim of each kettle (not concentric rings).
// ======================================================================================================================================================
const NAQ = [['bc', /big.*(centre|center|boom|dum)|^bass$|^dum$|^low$/], ['be', /big.*(edge|rim)|bass.*edge/], ['sc', /small.*(centre|center)|^high$|^tak$/], ['se', /small.*(edge|rim)|high.*edge/]];
function star8(ctx, x, y, r, rot = 0) { ctx.beginPath(); for (let k = 0; k < 16; k++) { const a = rot + (k / 16) * TAU, rr = k % 2 ? r * 0.55 : r; if (k === 0) ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); }
function tileNiche(ctx, F, rt, S, scene) {
  const A = F.area, wallB = Math.min(A.y + A.h - 50, F.map(0, scene.wallU)[1]), wallH = wallB - A.y;
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
  const sz = Math.max(54, Math.min(A.w / 8, wallH / 5));
  ctx.fillStyle = vgrad(ctx, A.y, wallB, [[0, '#0e2f66'], [1, '#14438a']]); ctx.fillRect(A.x, A.y, A.w, wallH);
  for (let r = 0; r * sz < wallH + sz; r++) for (let c = -1; c * sz < A.w + sz; c++) {
    const x = A.x + c * sz + sz / 2 + (A.w % sz) / 2, y = A.y + r * sz + sz / 2, k = (r + c) & 1;
    ctx.fillStyle = k ? '#1a9d98' : '#2cb8aa'; star8(ctx, x, y, sz * 0.46, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(8,24,60,0.7)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#efe4c8'; star8(ctx, x, y, sz * 0.23, PI / 16); ctx.fill();
    ctx.fillStyle = k ? '#c9a24a' : '#12356f'; circ(ctx, x, y, sz * 0.07); ctx.fill();
    ctx.fillStyle = '#e6d8b0'; circ(ctx, x + sz / 2, y + sz / 2, sz * 0.05); ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,10,40,0.18)'; ctx.fillRect(A.x, A.y, A.w, wallH);
  // a pointed arch niche, deep blue inside with a gilded frame and muqarnas hints
  const nw = Math.min(A.w * 0.62, wallH * 0.95), nx = A.x + A.w / 2, ny0 = A.y + wallH * 0.06, nh = wallH * 0.94;
  const arch = (inset) => { ctx.beginPath(); ctx.moveTo(nx - nw / 2 + inset, A.y + wallH + 4); ctx.lineTo(nx - nw / 2 + inset, ny0 + nh * 0.45); ctx.quadraticCurveTo(nx - nw / 2 + inset, ny0 + nh * 0.12, nx, ny0 + inset * 0.6); ctx.quadraticCurveTo(nx + nw / 2 - inset, ny0 + nh * 0.12, nx + nw / 2 - inset, ny0 + nh * 0.45); ctx.lineTo(nx + nw / 2 - inset, A.y + wallH + 4); ctx.closePath(); };
  arch(-14); ctx.fillStyle = '#d6b258'; ctx.fill(); arch(-6); ctx.fillStyle = '#7a5a20'; ctx.fill();
  arch(0); ctx.fillStyle = vgrad(ctx, ny0, A.y + wallH, [[0, '#0a1030'], [0.6, '#16255a'], [1, '#2a3a84']]); ctx.fill();
  ctx.save(); arch(0); ctx.clip();
  for (let k = 0; k < 5; k++) { const rr = nw * (0.5 - k * 0.07); ctx.strokeStyle = rgba('#d6b258', 0.5 - k * 0.07); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(nx, ny0 + nh * 0.34, rr, PI, TAU); ctx.stroke(); }
  for (let k = 0; k < 7; k++) { const x = nx - nw * 0.4 + k * nw * 0.133; ctx.fillStyle = rgba('#f4e4b0', 0.08); star8(ctx, x, ny0 + nh * 0.55, nw * 0.07, 0); ctx.fill(); }
  ctx.fillStyle = rgrad(ctx, nx, A.y + wallH * 0.7, 0, nw * 0.7, [[0, 'rgba(255,200,120,0.35)'], [1, 'rgba(255,200,120,0)']]); ctx.fillRect(nx - nw, ny0, 2 * nw, nh);
  ctx.restore();
  // brass lamps hanging either side
  for (const lx of [A.x + A.w * 0.1, A.x + A.w * 0.9]) {
    if (Math.abs(lx - nx) < nw / 2 + 24) continue;
    const ly = A.y + wallH * 0.3;
    ctx.strokeStyle = '#2a1808'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, A.y); ctx.lineTo(lx, ly - 24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lx, ly - 26); ctx.quadraticCurveTo(lx + 24, ly - 4, lx + 18, ly + 24); ctx.lineTo(lx - 18, ly + 24); ctx.quadraticCurveTo(lx - 24, ly - 4, lx, ly - 26); ctx.closePath();
    ctx.fillStyle = hgrad(ctx, lx - 24, lx + 24, [[0, '#6a4410'], [0.35, '#e8c060'], [0.7, '#9a6a1c'], [1, '#4a2c08']]); ctx.fill();
    ctx.fillStyle = '#ffe9a8'; for (let k = 0; k < 5; k++) circ(ctx, lx - 10 + k * 5, ly + (k % 2) * 8 - 2, 2), ctx.fill();
    bulb(ctx, lx, ly + 6, 5, '#ffcf78');
  }
  // carpet: deep red with a gold border and a medallion
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(A.x, wallB - 4, A.w, 8);
  ctx.fillStyle = vgrad(ctx, wallB, A.y + A.h, [[0, '#5a1414'], [1, '#2e0808']]); ctx.fillRect(A.x, wallB, A.w, A.y + A.h - wallB);
  const ch = A.y + A.h - wallB;
  ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 6; ctx.strokeRect(A.x + 14, wallB + 12, A.w - 28, ch - 24);
  ctx.strokeStyle = '#1c3a7a'; ctx.lineWidth = 4; ctx.strokeRect(A.x + 28, wallB + 26, A.w - 56, ch - 52);
  for (let k = 0; k < 24; k++) { const x = A.x + 40 + k * (A.w - 80) / 23; ctx.fillStyle = k % 2 ? '#c9a24a' : '#e8dcc0'; star8(ctx, x, wallB + 19, 6, 0); ctx.fill(); }
  const mx = A.x + A.w / 2, my = wallB + ch * 0.5;
  for (let k = 0; k < 3; k++) { ctx.strokeStyle = k % 2 ? '#c9a24a' : '#2a5aa0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(mx, my, A.w * (0.34 - k * 0.06), ch * (0.34 - k * 0.06), 0, 0, TAU); ctx.stroke(); }
  speckle(ctx, A.x, wallB, A.w, ch, 160, '#000000', 0.18, 9, 0.8, 2);
  ctx.restore();
  pool(ctx, A.x + A.w / 2, wallB + ch * 0.3, A.w * 0.5, A.h * 0.3, '#ffd8a0', 0.26);
  vignette(ctx, A, 0.5);
}
function copperKettle(ctx, R, ryk, vib, o) {   // local space: head centre at (0,0), bowl hangs below
  const cop = '#c4723a', depth = R * 1.02;
  ctx.save();
  // bowl
  ctx.beginPath(); ctx.moveTo(-R, 0); ctx.bezierCurveTo(-R * 1.02, depth * 0.62, -R * 0.58, depth * 1.0, 0, depth); ctx.bezierCurveTo(R * 0.58, depth * 1.0, R * 1.02, depth * 0.62, R, 0); ctx.closePath();
  ctx.fillStyle = rgrad(ctx, -R * 0.38, depth * 0.3, 0, R * 1.5, [[0, '#ffc690'], [0.3, '#d98850'], [0.62, '#8e4620'], [1, '#3e1a0a']]); ctx.fill();
  ctx.save(); ctx.clip();
  for (let k = 0; k < 46; k++) { const a = hash(o.seed + k) * PI, d = Math.sqrt(hash(o.seed + k + 50)); ctx.fillStyle = `rgba(70,24,6,${0.12 + 0.12 * hash(k + 3)})`; ell(ctx, Math.cos(a) * d * R * 0.9 * (hash(k) < 0.5 ? 1 : -1), depth * 0.15 + Math.sin(a) * d * depth * 0.75, 5 + 6 * hash(k + 9), 4 + 4 * hash(k + 7)); ctx.fill(); ctx.fillStyle = 'rgba(255,214,160,0.2)'; ell(ctx, Math.cos(a) * d * R * 0.9 * (hash(k) < 0.5 ? 1 : -1) - 2, depth * 0.15 + Math.sin(a) * d * depth * 0.75 - 2, 3 + 3 * hash(k), 2); ctx.fill(); }
  // a bright specular sweep
  ctx.fillStyle = rgrad(ctx, -R * 0.45, depth * 0.28, 0, R * 0.7, [[0, 'rgba(255,240,210,0.55)'], [1, 'rgba(255,240,210,0)']]); ctx.fillRect(-R, 0, 2 * R, depth);
  ctx.restore();
  ctx.strokeStyle = 'rgba(40,14,4,0.8)'; ctx.lineWidth = 2.5; ctx.stroke();
  // riveted band under the rim
  ctx.save(); ctx.beginPath(); ctx.moveTo(-R, 0); ctx.lineTo(-R * 0.985, R * 0.26); ctx.ellipse(0, R * 0.26, R * 0.985, R * 0.985 * ryk, 0, PI, 0, true); ctx.lineTo(R, 0); ctx.closePath();
  ctx.fillStyle = hgrad(ctx, -R, R, [[0, '#5a2a10'], [0.3, '#e2a468'], [0.65, '#a85a2a'], [1, '#3e1a0a']]); ctx.fill(); ctx.strokeStyle = 'rgba(40,14,4,0.7)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  for (let k = 0; k < 16; k++) { const a = PI * (0.06 + 0.88 * k / 15), x = Math.cos(a) * R * 0.95, y = R * 0.13 + Math.sin(a) * R * 0.95 * ryk; ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, x + 1.5, y + 2, 3.6); ctx.fill(); ctx.fillStyle = rgrad(ctx, x - 1, y - 1, 0, 4, [[0, '#fff0d0'], [1, '#8a5a2a']]); circ(ctx, x, y, 3.2); ctx.fill(); }
  // a carved wooden cradle ring hugging the bowl
  { const yy = depth * 0.5, rr = R * 0.96 * 0.9; for (const [lw, c, dy] of [[17, 'rgba(0,0,0,0.4)', 5], [15, '#3a1c0a', 0], [11, '#8a5a2c', -1], [3, 'rgba(255,226,170,0.6)', -4]]) { ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); ctx.ellipse(0, yy + dy, rr, rr * 0.3, 0, 0.02, PI - 0.02); ctx.stroke(); } }
  // head with a rope hoop and leather lacing
  ctx.save(); ctx.scale(1, ryk);
  hoop(ctx, R * 0.9, R * 0.9, R * 0.12, { kind: 'rope', col: '#8a5a2a' });
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 0, 0, R * 0.92, R * 0.92); ctx.fill();
  skinHead(ctx, R * 0.9, R * 0.9, { tint: '#dcc392', edge: '#8a6a3a', seed: o.seed, vib, wear: 0.9 });
  ctx.restore();
  ctx.restore();
}
registerDrumStage({
  id: 'naqareh', match: /naqareh|naghareh|nagara|naqqara|kettle.?drum/,
  build: (S, lanes, P) => { const zoneOf = []; const layer = staticLayer(); return createDrumStage('naqareh', S, lanes, P, {
    dress: () => ({ custom: (ctx, F, rt, S2, scene) => layer(ctx, { x: F.area.x, y: F.area.y, w: F.area.w, h: F.area.h }, (g) => tileNiche(g, F, rt, S2, scene)) }),
    voiceOf: (i) => `naqareh-${zoneOf[i] ?? 'bc'}`,
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 940 } : { w: 940, h: 560 }, keyOf = assignZones(K, NAQ.map(([key, re]) => ({ key, re })));
      for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const ryk = 0.5, bR = tall ? 160 : 140, sR = bR * 0.78, bx = tall ? -176 : -220, sx = tall ? 176 : 220, yb = tall ? 430 : 215, ys = yb + 34, tb = d2r(10), ts = d2r(-9), by = {};
      const place = (cx, cy, R, rot, centre, edge) => {
        by[centre] = eSpot(cx, cy, R * 0.48, R * 0.48 * ryk * 1.1, rot, { apk: 0.95 });
        by[edge] = eSector(cx, cy, R * 0.9, R * 0.9 * ryk, rot, 0.62, 1.02, d2r(10), d2r(170), { cueR: R * 0.17 });
      };
      place(bx, yb, bR, tb, 'bc', 'be'); place(sx, ys, sR, ts, 'sc', 'se');
      const spots = new Array(K.N).fill(null); for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
      return { ref, spots, wallU: ys + sR * 1.05 + (tall ? 190 : 120) + 10, draw(ctx, rt) {
        const vb = fl(K, keyOf, rt, 'bc', 'be'), vs = fl(K, keyOf, rt, 'sc', 'se'), yG = ys + sR * 1.05 + (tall ? 190 : 120) + 44;
        floorShadow(ctx, 0, yG - 4, 380, 46, 0.5);
        // low carved cradle: two turned legs under each kettle, joined by a stretcher
        for (const [cx, cy, R] of [[bx, yb, bR], [sx, ys, sR]]) {
          const top = cy + R * 0.82;
          for (const dx of [-0.52, 0.52]) {
            const x0 = cx + dx * R, x1 = cx + dx * R * 1.28;
            ctx.beginPath(); ctx.moveTo(x0 - 14, top - R * 0.2); ctx.lineTo(x1 - 17, yG); ctx.lineTo(x1 + 17, yG); ctx.lineTo(x0 + 14, top - R * 0.2); ctx.closePath();
            ctx.fillStyle = hgrad(ctx, x0 - 14, x0 + 14, [[0, '#2a1408'], [0.35, '#8a5a2c'], [1, '#2a1408']]); ctx.fill();
            for (let t = 1; t < 5; t++) { const y = top + (yG - top) * t / 5, xx = x0 + (x1 - x0) * t / 5; ctx.fillStyle = 'rgba(20,10,4,0.5)'; ctx.fillRect(xx - 13, y, 26, 4); ctx.fillStyle = 'rgba(255,220,160,0.25)'; ctx.fillRect(xx - 13, y - 1.5, 26, 1.5); }
          }
          ctx.fillStyle = hgrad(ctx, cx - R * 1.3, cx + R * 1.3, [[0, '#3a1e0c'], [0.5, '#9a6a34'], [1, '#3a1e0c']]); rrect(ctx, cx - R * 1.34, yG - 52, R * 2.68, 15, 7); ctx.fill();
        }
        // kettles (tilted in toward each other)
        ctx.save(); ctx.translate(bx, yb); ctx.rotate(tb); copperKettle(ctx, bR, ryk, vb, { seed: 5 }); ctx.restore();
        ctx.save(); ctx.translate(sx, ys); ctx.rotate(ts); copperKettle(ctx, sR, ryk, vs, { seed: 11 }); ctx.restore();
        // two curved sticks resting across the carpet in front
        ctx.lineCap = 'round';
        for (const [x0, y0, x1, y1, c] of [[-230, yG + 56, -20, yG + 74, '#4a2410'], [-120, yG + 62, 120, yG + 54, '#5a3016']]) {
          const cxm = (x0 + x1) / 2, cym = Math.min(y0, y1) - 34;
          ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(x0 + 6, y0 + 9); ctx.quadraticCurveTo(cxm + 6, cym + 9, x1 + 6, y1 + 9); ctx.stroke();
          ctx.strokeStyle = c; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cxm, cym, x1, y1); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,214,150,0.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y0 - 3); ctx.quadraticCurveTo(cxm, cym - 3, x1, y1 - 3); ctx.stroke();
          ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(x1 - 7, y1 + (y1 - cym) * 0.1); ctx.lineTo(x1, y1); ctx.stroke();
        }
        void mix; void chromeH; void shiver; void TAU; void rot2; void lighter; void wood; void blob; void block; void tilesFloor; void taperBody; void headSide; void foot; void bolt; void tube;
      } };
    },
  }); },
});
defVoice('naqareh-bc', 'skin', { dur: 0.5, drop: 1.18, glide: 0.06, modes: [[1, 1, 1], [1.5, 0.6, 0.9], [2.0, 0.4, 0.7], [2.5, 0.25, 0.5]], shell: { f: 160, q: 4, gain: 0.5, dur: 0.18 }, click: { f: 1800, gain: 0.4 }, lp: 3000, gain: 0.7 });
defVoice('naqareh-be', 'skin', { dur: 0.14, drop: 1.1, modes: [[1, 1, 1], [2.1, 0.6, 0.6], [3.2, 0.4, 0.4]], click: { f: 3600, gain: 0.85, dur: 0.02 }, lp: 8000, gain: 0.5 });
defVoice('naqareh-sc', 'skin', { dur: 0.36, drop: 1.14, glide: 0.04, modes: [[1, 1, 1], [1.5, 0.6, 0.9], [2.0, 0.4, 0.7]], shell: { f: 260, q: 4, gain: 0.4, dur: 0.14 }, click: { f: 2600, gain: 0.45 }, lp: 4500, gain: 0.58 });
defVoice('naqareh-se', 'skin', { dur: 0.1, drop: 1.08, modes: [[1, 1, 1], [2.2, 0.6, 0.6], [3.4, 0.4, 0.4]], click: { f: 4400, gain: 0.9, dur: 0.02 }, lp: 9500, gain: 0.46 });

// ======================================================================================================================================================
// CONGA: three tall barrel drums in a row (quinto, conga, tumba) on chrome stands, in front of a night-blue brick wall with bunting
// ======================================================================================================================================================
const CONGA = [['to', /tumba|bass|low|^open bass/], ['co', /conga.*(open|tone|centre|center)|^conga$|^mid/], ['cs', /conga.*(slap|heel)/], ['qo', /quinto.*(open|tone|centre|center)|^quinto$|^high/], ['qs', /quinto.*(slap|heel)/]];
function brickStreet(ctx, F, rt, S, scene) {
  const A = F.area, wallB = Math.min(A.y + A.h - 40, F.map(0, scene.wallU)[1]), wallH = wallB - A.y;
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
  const bh = Math.max(20, Math.min(A.w / 16, wallH / 14)), bw = bh * 2.1;
  ctx.fillStyle = '#1a1230'; ctx.fillRect(A.x, A.y, A.w, wallH);
  for (let r = 0; r * bh < wallH + bh; r++) for (let c = -1; c * bw < A.w + bw; c++) {
    const x = A.x + c * bw + (r % 2 ? bw / 2 : 0), y = A.y + r * bh, k = hash(r * 31 + c * 7), col = mix('#6c3552', '#8a4a5a', k * 0.8);
    ctx.fillStyle = col; ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
    ctx.fillStyle = 'rgba(255,200,170,0.12)'; ctx.fillRect(x + 2, y + 2, bw - 4, 3); ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(x + 2, y + bh - 6, bw - 4, 4);
    if (k > 0.8) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x + 6 + k * 20, y + 6, bw * 0.2, bh * 0.3); }
  }
  // evening blue wash, darker toward the top, and a warm lantern on the left
  ctx.fillStyle = vgrad(ctx, A.y, wallB, [[0, 'rgba(10,14,60,0.72)'], [0.7, 'rgba(24,30,100,0.38)'], [1, 'rgba(40,40,110,0.12)']]); ctx.fillRect(A.x, A.y, A.w, wallH);
  const lx = A.x + A.w * 0.08, ly = A.y + wallH * 0.34;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgrad(ctx, lx, ly, 0, wallH * 0.7, [[0, 'rgba(255,190,100,0.5)'], [0.4, 'rgba(255,150,70,0.18)'], [1, 'rgba(255,140,60,0)']]); ctx.fillRect(A.x, A.y, A.w, wallH); ctx.restore();
  ctx.fillStyle = '#1a1210'; rrect(ctx, lx - 3, A.y, 6, ly - 26, 2); ctx.fill();
  ctx.fillStyle = '#2a1c14'; rrect(ctx, lx - 17, ly - 26, 34, 52, 6); ctx.fill(); ctx.fillStyle = '#ffd886'; rrect(ctx, lx - 11, ly - 19, 22, 38, 4); ctx.fill(); bulb(ctx, lx, ly, 5, '#fff0c0');
  // a lit arch window on the right
  const wx = A.x + A.w * 0.9, ww = Math.min(A.w * 0.16, wallH * 0.28), wy = A.y + wallH * 0.2;
  ctx.beginPath(); ctx.moveTo(wx - ww / 2, wy + wallH * 0.4); ctx.lineTo(wx - ww / 2, wy + ww / 2); ctx.arc(wx, wy + ww / 2, ww / 2, PI, 0); ctx.lineTo(wx + ww / 2, wy + wallH * 0.4); ctx.closePath();
  ctx.fillStyle = vgrad(ctx, wy, wy + wallH * 0.4, [[0, '#ffd58a'], [1, '#d0742c']]); ctx.fill(); ctx.strokeStyle = '#2a1a22'; ctx.lineWidth = 6; ctx.stroke();
  ctx.fillStyle = '#2a1a22'; ctx.fillRect(wx - 2, wy, 4, wallH * 0.4); ctx.fillRect(wx - ww / 2, wy + wallH * 0.18, ww, 4);
  // bunting
  const y0 = A.y + wallH * 0.1, nb = Math.round(A.w / 44), cols = ['#f0c040', '#2ec4b6', '#ef476f', '#7b5cff', '#ff8a3c'];
  ctx.strokeStyle = 'rgba(10,6,20,0.85)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let k = 0; k <= 30; k++) { const t = k / 30, x = A.x + t * A.w, y = y0 + wallH * 0.07 * Math.sin(PI * t); if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
  ctx.stroke();
  for (let k = 0; k < nb; k++) { const t = (k + 0.5) / nb, x = A.x + t * A.w, y = y0 + wallH * 0.07 * Math.sin(PI * t), w2 = Math.min(18, A.w / nb * 0.4); ctx.fillStyle = cols[k % cols.length]; ctx.beginPath(); ctx.moveTo(x - w2, y); ctx.lineTo(x + w2, y); ctx.lineTo(x, y + w2 * 2.1); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.5; ctx.stroke(); }
  // street: cobbles
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(A.x, wallB - 3, A.w, 8);
  const fh = A.y + A.h - wallB; ctx.fillStyle = vgrad(ctx, wallB, A.y + A.h, [[0, '#2a2f52'], [1, '#12142a']]); ctx.fillRect(A.x, wallB, A.w, fh);
  const rows = 9;
  for (let r = 0; r < rows; r++) {
    const f0 = r / rows, f1 = (r + 1) / rows, ya = wallB + fh * Math.pow(f0, 1.5), yb = wallB + fh * Math.pow(f1, 1.5), cwid = 22 + 70 * f1, n = Math.ceil(A.w / cwid) + 2;
    for (let c = 0; c < n; c++) { const x = A.x + (c - 0.5) * cwid + (r % 2 ? cwid / 2 : 0), k = hash(r * 13 + c); ctx.fillStyle = rgba(mix('#4a5280', '#7a82b0', k), 0.55); ctx.beginPath(); ctx.ellipse(x, (ya + yb) / 2, cwid * 0.46, (yb - ya) * 0.46, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.ellipse(x - cwid * 0.1, (ya + yb) / 2 - (yb - ya) * 0.15, cwid * 0.25, (yb - ya) * 0.14, 0, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
  pool(ctx, A.x + A.w * 0.55, wallB + fh * 0.3, A.w * 0.5, A.h * 0.25, '#ffc88a', 0.28);
  vignette(ctx, A, 0.5);
}
registerDrumStage({
  id: 'conga', match: /conga|tumba|quinto/,
  build: (S, lanes, P) => { const zoneOf = []; const layer = staticLayer(); return createDrumStage('conga', S, lanes, P, {
    dress: () => ({ custom: (ctx, F, rt, S2, scene) => layer(ctx, { x: F.area.x, y: F.area.y, w: F.area.w, h: F.area.h }, (g) => brickStreet(g, F, rt, S2, scene)) }),
    voiceOf: (i) => `conga-${zoneOf[i] ?? 'co'}`,
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 880, h: 960 } : { w: 1000, h: 580 }, keyOf = assignZones(K, CONGA.map(([key, re]) => ({ key, re })));
      for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const ryk = 0.34, w = 11, yF = tall ? 900 : 540, leg = tall ? 70 : 42;
      // x, head radius, head height, name
      const D = tall ? [{ x: -285, r: 104, y: 480, q: 'q' }, { x: 0, r: 122, y: 408, q: 'c' }, { x: 296, r: 140, y: 336, q: 't' }] : [{ x: -330, r: 96, y: 250, q: 'q' }, { x: 0, r: 114, y: 190, q: 'c' }, { x: 340, r: 132, y: 130, q: 't' }];
      const by = {};
      for (const d of D) {
        const open = eSpot(d.x, d.y, d.r * 0.5, d.r * 0.5 * ryk * 1.15, 0, { apk: 0.95 }), slap = eRing(d.x, d.y, d.r, d.r * ryk, 0, 0.62, 0.97, -PI / 2);
        if (d.q === 'q') { by.qo = open; by.qs = slap; } else if (d.q === 'c') { by.co = open; by.cs = slap; } else { by.to = open; by.ts = slap; }
      }
      const spots = new Array(K.N).fill(null); for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
      const cols = { q: '#c8571f', c: '#9c2a22', t: '#6a2a52' };
      return { ref, spots, wallU: yF - (tall ? 160 : 90), draw(ctx, rt) {
        floorShadow(ctx, 0, yF + 4, 520, 50, 0.5);
        // back to front is left to right: draw the three drums, each with stand legs under it
        for (const d of D) {
          const R = d.r + 4, yBot = yF - leg, v = fl(K, keyOf, rt, ...(d.q === 'q' ? ['qo', 'qs'] : d.q === 'c' ? ['co', 'cs'] : ['to', 'ts']));
          for (const sx of [-1, 0, 1]) { tube(ctx, (g) => { g.beginPath(); g.moveTo(d.x + sx * R * 0.34, yBot - 4); g.lineTo(d.x + sx * R * 0.72, yF - 2 + (sx === 0 ? 14 : 0)); }, 9, '#b8bec8'); foot(ctx, d.x + sx * R * 0.72, yF + (sx === 0 ? 14 : 0), 8); }
          barrelBody(ctx, d.x, d.y, yBot, R, R * 0.99, R * 0.6, ryk, { col: cols[d.q], staves: 9, seed: d.x, gloss: 0.9 });
          // tension rods: gold lugs at the rim and a bead ring round the lower shell
          const ringT = 0.78, ringY = d.y + (yBot - d.y) * ringT, ringR = R * (0.99 - 0.39 * ringT * ringT) * 0.97;
          ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(d.x, ringY + 3, ringR, ringR * ryk, 0, 0.03, PI - 0.03); ctx.stroke();
          ctx.strokeStyle = chromeH(ctx, d.x - ringR, d.x + ringR, '#d8b660'); ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(d.x, ringY, ringR, ringR * ryk, 0, 0.03, PI - 0.03); ctx.stroke();
          headSide(ctx, d.x, d.y, d.r, ryk, { tint: '#e8d2a4', edge: '#9a7a48', rim: '#d8b660', w, band: 15, lugs: 6, lugCol: '#e8c870', lugLen: 120, wear: 0.9, seed: d.x + 3 }, v);
        }
        void mix; void lighter; void taperBody; void bolt; void shiver; void skinHead; void hoop; void rot2; void wood; void blob; void speckle; void block; void tilesFloor;
      } };
    },
  }); },
});
defVoice('conga-to', 'skin', { dur: 0.5, drop: 1.18, glide: 0.06, modes: [[1, 1, 1], [1.5, 0.35, 0.6], [2.2, 0.2, 0.4]], shell: { f: 160, q: 4, gain: 0.35, dur: 0.25 }, lp: 2600, gain: 0.7 });
defVoice('conga-ts', 'skin', { dur: 0.1, drop: 1.1, modes: [[1, 1, 1], [2.1, 0.6, 0.5]], click: { f: 3000, q: 1, gain: 0.9, dur: 0.02 }, lp: 7000, gain: 0.5 });
defVoice('conga-co', 'skin', { dur: 0.36, drop: 1.15, glide: 0.04, modes: [[1, 1, 1], [1.6, 0.4, 0.6], [2.4, 0.25, 0.4]], click: { f: 2400, gain: 0.3 }, shell: { f: 260, q: 5, gain: 0.3, dur: 0.2 }, lp: 4500, gain: 0.6 });
defVoice('conga-cs', 'skin', { dur: 0.09, drop: 1.1, modes: [[1, 1, 1], [2.2, 0.6, 0.5], [3.1, 0.4, 0.4]], click: { f: 3800, q: 1, gain: 0.95, dur: 0.02 }, lp: 9000, gain: 0.48 });
defVoice('conga-qo', 'skin', { dur: 0.28, drop: 1.12, glide: 0.03, modes: [[1, 1, 1], [1.7, 0.45, 0.6], [2.5, 0.28, 0.4]], click: { f: 3400, gain: 0.35 }, shell: { f: 420, q: 5, gain: 0.25, dur: 0.15 }, lp: 7000, gain: 0.55 });
defVoice('conga-qs', 'skin', { dur: 0.08, drop: 1.08, modes: [[1, 1, 1], [2.3, 0.6, 0.5], [3.3, 0.4, 0.4]], click: { f: 5000, q: 1, gain: 1, dur: 0.018 }, lp: 11000, gain: 0.46 });

// ======================================================================================================================================================
// SURDO: the big samba bass drum lying on its side in a wooden cradle, seen from the front left; a felt mallet rests on a stand. Night parade backdrop.
// ======================================================================================================================================================
const SURDO = [['open', /open|boom|bass|centre|center|^low/], ['mute', /mute|muffl|damp|hand/], ['edge', /edge|ring|^high/], ['rim', /rim|click|shell/]];
function paradeNight(ctx, F, rt, S, scene) {
  const A = F.area, wallB = Math.min(A.y + A.h - 40, F.map(0, scene.wallU)[1]), wallH = wallB - A.y;
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
  ctx.fillStyle = vgrad(ctx, A.y, wallB, [[0, '#14062e'], [0.55, '#3a0f55'], [1, '#6a1a5a']]); ctx.fillRect(A.x, A.y, A.w, wallH);
  // big soft bokeh lights and glitter
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const cols = ['#ffb347', '#ff5fa2', '#3de0c8', '#ffe066', '#a08bff'];
  for (let k = 0; k < 26; k++) { const x = A.x + A.w * hash(k * 3 + 1), y = A.y + wallH * (0.05 + 0.8 * hash(k * 5 + 2)), r = (10 + 38 * hash(k + 7)) * Math.min(1.3, A.w / 700 + 0.3); ctx.fillStyle = rgrad(ctx, x, y, 0, r, [[0, rgba(cols[k % 5], 0.34)], [0.8, rgba(cols[k % 5], 0.16)], [1, rgba(cols[k % 5], 0)]]); ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
  ctx.restore();
  // hanging streamers and a gold curtain of tinsel at the sides
  for (const side of [0, 1]) for (let k = 0; k < 9; k++) {
    const x = side ? A.x + A.w - (k + 0.5) * A.w * 0.022 : A.x + (k + 0.5) * A.w * 0.022, len = wallH * (0.4 + 0.45 * hash(k * 2 + side * 11)), c = cols[(k + side) % 5];
    ctx.strokeStyle = rgba(c, 0.9); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, A.y); ctx.bezierCurveTo(x + 10, A.y + len * 0.3, x - 10, A.y + len * 0.7, x + 3, A.y + len); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 1, A.y); ctx.bezierCurveTo(x + 9, A.y + len * 0.3, x - 11, A.y + len * 0.7, x + 2, A.y + len); ctx.stroke();
  }
  speckle(ctx, A.x, A.y, A.w, wallH, 160, '#fff2b0', 0.65, 5, 0.8, 2.6);
  // a stage riser with a gold front and a glossy dark floor
  ctx.fillStyle = vgrad(ctx, wallB, A.y + A.h, [[0, '#2a1030'], [1, '#0e0414']]); ctx.fillRect(A.x, wallB, A.w, A.y + A.h - wallB);
  ctx.fillStyle = vgrad(ctx, wallB - 10, wallB + 4, [[0, '#f4d878'], [1, '#a8782a']]); ctx.fillRect(A.x, wallB - 10, A.w, 14);
  for (let k = 0; k < 40; k++) { const x = A.x + A.w * hash(k * 2 + 3), y = wallB + (A.y + A.h - wallB) * hash(k * 3 + 5); ctx.fillStyle = rgba(cols[k % 5], 0.55); ctx.fillRect(x, y, 6, 3); }
  ctx.restore();
  pool(ctx, A.x + A.w / 2, wallB + (A.y + A.h - wallB) * 0.2, A.w * 0.5, A.h * 0.3, '#ffb0e0', 0.3);
  vignette(ctx, A, 0.5);
}
registerDrumStage({
  id: 'surdo', match: /surdo|bass drum|bombo/,
  build: (S, lanes, P) => { const zoneOf = []; const layer = staticLayer(); return createDrumStage('surdo', S, lanes, P, {
    dress: () => ({ custom: (ctx, F, rt, S2, scene) => layer(ctx, { x: F.area.x, y: F.area.y, w: F.area.w, h: F.area.h }, (g) => paradeNight(g, F, rt, S2, scene)) }),
    voiceOf: (i) => `surdo-${zoneOf[i] ?? 'open'}`,
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 800, h: 860 } : { w: 1000, h: 560 }, keyOf = assignZones(K, SURDO.map(([key, re]) => ({ key, re })));
      for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const R = tall ? 268 : 190, rx = R * 0.46, L = tall ? 380 : 400, sl = tall ? 34 : 24, hx = tall ? -232 : -320, hy = tall ? 370 : 250, by = {};
      const yF = hy + R + (tall ? 112 : 100);
      by.open = eSpot(hx, hy, rx * 0.52, R * 0.5, 0, { apk: 0.95 });
      by.mute = eRing(hx, hy, rx, R, 0, 0.5, 0.74, d2r(90), { ap: { cx: hx, cy: hy + R * 0.62, rx: rx * 0.3, ry: R * 0.2, rot: 0 } });
      by.edge = eRing(hx, hy, rx, R, 0, 0.78, 0.98, -PI / 2);
      by.rim = eSector(hx, hy, rx, R, 0, 1.06, 1.26, d2r(-34), d2r(34), { cueR: R * 0.08 });
      const spots = new Array(K.N).fill(null); for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
      return { ref, spots, wallU: yF - (tall ? 70 : 40), draw(ctx, rt) {
        const v = fl(K, keyOf, rt, 'open', 'mute', 'edge', 'rim');
        floorShadow(ctx, hx + L / 2 + 20, yF + 4, 520, 46, 0.55);
        // cradle: two carved wooden trestles with a curved seat under the shell
        for (const t of [0.2, 0.8]) {
          const x = hx + L * t, ytop = hy + R * 0.86 - sl * t, w0 = 74;
          ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.moveTo(x - w0 + 10, yF + 2); ctx.lineTo(x + w0 + 14, yF + 2); ctx.lineTo(x + w0 * 0.6 + 14, ytop + 14); ctx.lineTo(x - w0 * 0.6 + 10, ytop + 14); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.moveTo(x - w0, yF); ctx.lineTo(x - w0 * 0.55, ytop + 6); ctx.quadraticCurveTo(x, ytop - 26, x + w0 * 0.55, ytop + 6); ctx.lineTo(x + w0, yF); ctx.lineTo(x + w0 * 0.62, yF); ctx.lineTo(x + w0 * 0.34, ytop + 44); ctx.lineTo(x - w0 * 0.34, ytop + 44); ctx.lineTo(x - w0 * 0.62, yF); ctx.closePath();
          ctx.fillStyle = hgrad(ctx, x - w0, x + w0, [[0, '#2a1608'], [0.3, '#a8743a'], [0.6, '#7a4a20'], [1, '#2a1608']]); ctx.fill(); ctx.strokeStyle = 'rgba(30,14,4,0.8)'; ctx.lineWidth = 2.5; ctx.stroke();
          ctx.strokeStyle = 'rgba(255,224,170,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - w0 * 0.55, ytop + 6); ctx.quadraticCurveTo(x, ytop - 26, x + w0 * 0.55, ytop + 6); ctx.stroke();
          bolt(ctx, x - w0 * 0.78, yF - 40, 5, '#d6b258'); bolt(ctx, x + w0 * 0.78, yF - 40, 5, '#d6b258');
        }
        // the shell: a red cylinder running right and a little up
        const x1 = hx + L, y1 = hy - sl;
        const shellPath = () => { ctx.beginPath(); ctx.moveTo(hx, hy - R); ctx.lineTo(x1, y1 - R); ctx.ellipse(x1, y1, rx, R, 0, -PI / 2, PI / 2); ctx.lineTo(hx, hy + R); ctx.closePath(); };
        shellPath();
        ctx.save(); ctx.fillStyle = vgrad(ctx, hy - R, hy + R, [[0, '#4a0a12'], [0.16, '#d63a3e'], [0.26, '#ff7a70'], [0.4, '#c8202a'], [0.7, '#8a121c'], [1, '#2a0408']]); ctx.fill(); ctx.clip();
        grain(ctx, hx, hy - R - sl, L + rx, 2 * R + sl, '#3a0408', 0.3, 5, false, 22);
        ctx.fillStyle = hgrad(ctx, hx, x1 + rx, [[0, 'rgba(0,0,0,0.35)'], [0.15, 'rgba(0,0,0,0)'], [0.8, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.5)']]); ctx.fillRect(hx - 4, hy - R - sl - 4, L + rx + 8, 2 * R + sl + 8);
        ctx.restore(); shellPath(); ctx.strokeStyle = 'rgba(30,2,6,0.8)'; ctx.lineWidth = 2.5; ctx.stroke();
        // two painted gold stripes round the shell, parallel to the head
        for (const t of [0.52, 0.59, 0.82]) { const x = hx + L * t, y = hy - sl * t; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = t === 0.59 ? 7 : 11; ctx.beginPath(); ctx.ellipse(x + 2, y + 2, rx, R, 0, PI / 2, PI * 1.5); ctx.stroke(); ctx.strokeStyle = t === 0.59 ? '#f4d878' : '#d6b258'; ctx.lineWidth = t === 0.59 ? 5 : 9; ctx.beginPath(); ctx.ellipse(x, y, rx, R, 0, PI / 2, PI * 1.5); ctx.stroke(); }
        // tension rods along the shell and the far rim band
        for (let a = -70; a <= 70; a += 28) { const yy = Math.sin(d2r(a)) * R; tube(ctx, (g) => { g.beginPath(); g.moveTo(hx + 30, hy + yy - 3); g.lineTo(x1 - 24, y1 + yy); }, 5, '#d8dce4', 3); }
        // the far rim and the near rim band
        ctx.save(); ctx.strokeStyle = chromeH(ctx, 0, 1, '#c9ced6'); ctx.lineWidth = 12; ctx.beginPath(); ctx.ellipse(x1, y1, rx, R, 0, -PI / 2, PI / 2); ctx.stroke(); ctx.restore();
        ctx.beginPath(); ctx.moveTo(hx, hy - R - 8); ctx.lineTo(hx + 40, hy - R - 8 - sl * 0.12); ctx.lineTo(hx + 40, hy + R + 8 - sl * 0.12); ctx.lineTo(hx, hy + R + 8); ctx.closePath();
        ctx.fillStyle = vgrad(ctx, hy - R, hy + R, [[0, '#6a7080'], [0.14, '#f2f4f8'], [0.4, '#b8bec8'], [0.7, '#80868f'], [1, '#2a2d34']]); ctx.fill(); ctx.strokeStyle = 'rgba(20,20,30,0.7)'; ctx.lineWidth = 2; ctx.stroke();
        for (let a = -72; a <= 72; a += 24) bolt(ctx, hx + 20, hy + Math.sin(d2r(a)) * (R + 2), 6.5, '#e8ebf0');
        // the head, wide hoop, on the near end
        ctx.save(); ctx.translate(hx, hy); ctx.scale(rx / R, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ell(ctx, 6, 8, R + 22, R + 22); ctx.fill();
        hoop(ctx, R, R, 20, { kind: 'metal', col: '#d0d4dc' });
        skinHead(ctx, R, R, { tint: '#f2ead4', edge: '#cbbf9c', seed: 9, vib: v, wear: 0.85 });
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(hx, hy, rx * 1.2 - 2, (R + 20) - 2, 0, PI * 0.9, PI * 1.25); ctx.stroke();
        // a felt mallet leaning on the right
        ctx.save(); ctx.translate(hx + L + rx + 70, yF - 40); ctx.rotate(-0.28);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, 5, -150, 14, 190, 6); ctx.fill();
        ctx.fillStyle = hgrad(ctx, 0, 16, [[0, '#4a2a10'], [0.4, '#b88444'], [1, '#3a200c']]); rrect(ctx, 0, -150, 14, 190, 6); ctx.fill();
        ctx.fillStyle = rgrad(ctx, 4, -176, 2, 40, [[0, '#fff3c4'], [0.6, '#d8c078'], [1, '#6a5a2a']], 0, -180); ell(ctx, 7, -172, 28, 34); ctx.fill();
        ctx.strokeStyle = 'rgba(60,40,10,0.7)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
        void mix; void lighter; void taperBody; void shiver; void rot2; void wood; void blob; void block; void tilesFloor; void rSpot; void foot;
      } };
    },
  }); },
});
defVoice('surdo-open', 'skin', { dur: 0.7, drop: 1.22, glide: 0.09, modes: [[1, 1, 1], [1.5, 0.3, 0.6]], shell: { f: 90, q: 3, gain: 0.5, dur: 0.35 }, lp: 900, gain: 0.85 });
defVoice('surdo-mute', 'skin', { dur: 0.16, drop: 1.1, glide: 0.03, modes: [[1, 1, 1], [1.8, 0.3, 0.5]], shell: { f: 110, q: 3, gain: 0.3, dur: 0.1 }, lp: 700, gain: 0.7 });
defVoice('surdo-edge', 'skin', { dur: 0.3, drop: 1.12, glide: 0.04, modes: [[1, 1, 1], [1.9, 0.5, 0.6], [2.8, 0.3, 0.4]], click: { f: 2500, gain: 0.4 }, lp: 2800, gain: 0.6 });
defVoice('surdo-rim', 'woodtok', { dur: 0.09, gain: 0.5, hollow: 1.4, overtone: 2.6 });

// ======================================================================================================================================================
// RIQ: the Arab tambourine resting on a velvet cushion, face tilted toward you; the frame shows its pearl inlay and four windows with brass jingle pairs.
// Backdrop: a carved wooden lattice screen with warm light behind it, over a kilim.
// ======================================================================================================================================================
const RIQ = [['dum', /dum|boom|centre|center|bass|^low/], ['tak', /tak|edge|^high|ring/], ['jing', /jingle|cymbal|shake|zil|rings/], ['rim', /rim|snap|click|frame/]];
function latticeRoom(ctx, F, rt, S, scene) {
  const A = F.area, wallB = Math.min(A.y + A.h - 40, F.map(0, scene.wallU)[1]), wallH = wallB - A.y;
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
  ctx.fillStyle = rgrad(ctx, A.x + A.w / 2, A.y + wallH * 0.55, 0, Math.max(A.w, wallH) * 0.8, [[0, '#ffd09a'], [0.45, '#d88a4a'], [1, '#6a2a14']]); ctx.fillRect(A.x, A.y, A.w, wallH);
  const sp = Math.max(60, Math.min(A.w / 6, wallH / 4)), cx0 = A.x + A.w / 2;
  ctx.lineCap = 'butt';
  for (const [col, lw, dy] of [['rgba(0,0,0,0.4)', 11, 3], ['#2a1208', 9, 0], ['#5c3016', 6, 0], ['rgba(255,200,130,0.5)', 1.6, -1.5]]) {
    ctx.strokeStyle = col; ctx.lineWidth = lw;
    ctx.beginPath();
    for (let k = -14; k <= 14; k++) { const x0 = cx0 + k * sp; ctx.moveTo(x0, A.y + dy); ctx.lineTo(x0 + wallH, A.y + wallH + dy); ctx.moveTo(x0, A.y + dy); ctx.lineTo(x0 - wallH, A.y + wallH + dy); }
    ctx.stroke();
  }
  for (let r = 0; r * sp <= wallH + sp; r++) for (let k = -14; k <= 14; k++) { const x = cx0 + k * sp + (r % 2 ? sp / 2 : 0) - 0, y = A.y + r * sp / 2; if ((k + r) % 2 === 0) { ctx.fillStyle = '#2a1208'; circ(ctx, x, y, 8); ctx.fill(); ctx.fillStyle = '#c89a52'; circ(ctx, x - 1, y - 1, 3.5); ctx.fill(); } }
  // a frame and a warm lantern behind
  ctx.strokeStyle = '#2a1208'; ctx.lineWidth = 16; ctx.strokeRect(A.x + 6, A.y + 6, A.w - 12, wallH - 6); ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 5; ctx.strokeRect(A.x + 14, A.y + 14, A.w - 28, wallH - 22);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgrad(ctx, A.x + A.w * 0.5, A.y + wallH * 0.45, 0, wallH * 0.7, [[0, 'rgba(255,220,160,0.4)'], [1, 'rgba(255,200,120,0)']]); ctx.fillRect(A.x, A.y, A.w, wallH); ctx.restore();
  // kilim floor: bands of triangles
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(A.x, wallB - 3, A.w, 8);
  const fh = A.y + A.h - wallB; ctx.fillStyle = vgrad(ctx, wallB, A.y + A.h, [[0, '#6a1c18'], [1, '#3a0e0c']]); ctx.fillRect(A.x, wallB, A.w, fh);
  const bands = [['#e8d4a0', '#1c4a6a'], ['#d89a3a', '#8a1c1c'], ['#e8d4a0', '#2a6a5a']];
  for (let b = 0; b < bands.length; b++) { const y0 = wallB + fh * (0.1 + b * 0.28), h = fh * 0.2, n = Math.ceil(A.w / (h * 1.2)) + 1; for (let k = 0; k < n; k++) { const x = A.x + k * h * 1.2; ctx.fillStyle = bands[b][k % 2]; ctx.beginPath(); ctx.moveTo(x, y0 + h); ctx.lineTo(x + h * 0.6, y0); ctx.lineTo(x + h * 1.2, y0 + h); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2; ctx.stroke(); } }
  speckle(ctx, A.x, wallB, A.w, fh, 160, '#000', 0.16, 4, 0.8, 2);
  ctx.restore();
  pool(ctx, A.x + A.w / 2, wallB + fh * 0.2, A.w * 0.5, A.h * 0.28, '#ffd7a0', 0.3);
  vignette(ctx, A, 0.5);
}
registerDrumStage({
  id: 'riq', match: /\briq\b|\bdaff?\b tambourine|tambourine|riqq|req\b/,
  build: (S, lanes, P) => { const zoneOf = []; const layer = staticLayer(); return createDrumStage('riq', S, lanes, P, {
    dress: () => ({ custom: (ctx, F, rt, S2, scene) => layer(ctx, { x: F.area.x, y: F.area.y, w: F.area.w, h: F.area.h }, (g) => latticeRoom(g, F, rt, S2, scene)) }),
    voiceOf: (i) => `riq-${zoneOf[i] ?? 'dum'}`,
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 800, h: 860 } : { w: 1000, h: 560 }, keyOf = assignZones(K, RIQ.map(([key, re]) => ({ key, re })));
      for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const R = tall ? 300 : 230, ryk = 0.64, T = R * 0.27, rot = -0.1, cx = 0, cy = tall ? 330 : 230, by = {};
      const at = (x, y) => { const [a, b] = rot2(x, y, rot); return [cx + a, cy + b]; };
      by.dum = eSpot(cx, cy, R * 0.46, R * 0.46 * ryk, rot, { apk: 0.95 }); by.tak = eRing(cx, cy, R * 0.96, R * 0.96 * ryk, rot, 0.62, 0.96, -PI / 2);
      const [jx, jy] = at(0, R * ryk + T * 0.52); by.jing = rectSpot(jx, jy, R * 0.78, T * 0.42, rot, { rad: 10, ap: { cx: jx, cy: jy, rx: R * 0.7, ry: T * 0.36, rot, rect: true, rad: 10 } });
      by.rim = eSector(cx, cy, R * 0.98, R * 0.98 * ryk, rot, 1.0, 1.18, d2r(200), d2r(340), { cueR: R * 0.07 });
      const spots = new Array(K.N).fill(null); for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
      const yF = cy + R * ryk + T + (tall ? 200 : 110);
      return { ref, spots, wallU: yF - (tall ? 80 : 50), draw(ctx, rt) {
        const v = fl(K, keyOf, rt, 'dum', 'tak', 'rim'), vj = fl(K, keyOf, rt, 'jing');
        // the cushion: puffy burgundy velvet with gold braid and four tassels
        const cu = cy + R * ryk + T - 20, cw = R * (tall ? 1.28 : 1.5), ch = tall ? 170 : 110;
        floorShadow(ctx, 0, cu + ch + 8, cw * 1.15, 40, 0.5);
        ctx.beginPath(); ctx.moveTo(-cw, cu + ch * 0.4); ctx.bezierCurveTo(-cw * 1.06, cu - ch * 0.1, -cw * 0.5, cu - ch * 0.2, 0, cu - ch * 0.12); ctx.bezierCurveTo(cw * 0.5, cu - ch * 0.2, cw * 1.06, cu - ch * 0.1, cw, cu + ch * 0.4); ctx.bezierCurveTo(cw * 1.04, cu + ch * 0.95, cw * 0.5, cu + ch * 1.05, 0, cu + ch * 1.04); ctx.bezierCurveTo(-cw * 0.5, cu + ch * 1.05, -cw * 1.04, cu + ch * 0.95, -cw, cu + ch * 0.4); ctx.closePath();
        ctx.fillStyle = rgrad(ctx, -cw * 0.3, cu, 0, cw * 1.3, [[0, '#a8283a'], [0.55, '#6e1426'], [1, '#34070f']]); ctx.fill(); ctx.strokeStyle = '#d6b258'; ctx.lineWidth = 5; ctx.stroke();
        ctx.save(); ctx.clip(); for (let k = -4; k <= 4; k++) { ctx.strokeStyle = 'rgba(255,200,170,0.14)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(k * cw * 0.25, cu - ch * 0.2); ctx.quadraticCurveTo(k * cw * 0.3, cu + ch * 0.5, k * cw * 0.2, cu + ch * 1.1); ctx.stroke(); } ctx.restore();
        for (const sx of [-1, 1]) { const tx = sx * (cw - 6), ty = cu + ch * 0.42; ctx.strokeStyle = '#d6b258'; ctx.lineWidth = 2; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + sx * 8 + k * 4, ty + 46); ctx.stroke(); } ctx.fillStyle = '#e8c870'; circ(ctx, tx, ty, 8); ctx.fill(); }
        // the drum, turned a little
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
        // front band with inlay and jingle windows
        const bandPath = () => { ctx.beginPath(); ctx.moveTo(-R, 0); ctx.lineTo(-R, T); ctx.ellipse(0, T, R, R * ryk, 0, PI, 0, true); ctx.lineTo(R, 0); ctx.ellipse(0, 0, R, R * ryk, 0, 0, PI); ctx.closePath(); };
        bandPath();
        ctx.fillStyle = hgrad(ctx, -R, R, [[0, '#1c0c06'], [0.25, '#6a3a1e'], [0.5, '#4a2410'], [0.8, '#26120a'], [1, '#100604']]); ctx.fill();
        ctx.save(); ctx.clip(); grain(ctx, -R, 0, 2 * R, R * ryk + T, '#1a0a04', 0.4, 7, false, 8);
        ctx.fillStyle = vgrad(ctx, 0, R * ryk + T, [[0, 'rgba(255,255,255,0)'], [0.55, 'rgba(255,255,255,0.1)'], [1, 'rgba(0,0,0,0.4)']]); ctx.fillRect(-R, 0, 2 * R, R * ryk + T); ctx.restore();
        bandPath(); ctx.strokeStyle = 'rgba(10,4,2,0.85)'; ctx.lineWidth = 2.5; ctx.stroke();
        const bandAt = (deg) => { const a = d2r(deg); return [R * Math.cos(a), R * ryk * Math.sin(a) + T * 0.5, Math.sin(a)]; };
        for (const deg of [14, 54, 90, 126, 166]) { const [x, y, f] = bandAt(deg), w2 = 22 * f + 2, h2 = T * 0.36; ctx.fillStyle = '#f2ead8'; ctx.beginPath(); ctx.moveTo(x, y - h2); ctx.lineTo(x + w2, y); ctx.lineTo(x, y + h2); ctx.lineTo(x - w2, y); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(60,40,20,0.6)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = 'rgba(120,200,190,0.4)'; ctx.beginPath(); ctx.moveTo(x, y - h2 * 0.5); ctx.lineTo(x + w2 * 0.5, y); ctx.lineTo(x, y + h2 * 0.5); ctx.lineTo(x - w2 * 0.5, y); ctx.closePath(); ctx.fill(); }
        for (const deg of [34, 72, 108, 146]) {
          const [x, y, f] = bandAt(deg), w2 = 30 * f + 3, h2 = T * 0.34;
          ctx.fillStyle = '#0c0604'; rrect(ctx, x - w2, y - h2, 2 * w2, 2 * h2, 4); ctx.fill();
          for (const [dx, dy, c] of [[-0.3, -0.18, '#c9a030'], [0.25, 0.14, '#e8c860']]) { const sh = vj * 2 * Math.sin(k_(deg) + dx * 9); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ell(ctx, x + dx * w2 + 1.5, y + dy * h2 + 2 + sh, w2 * 0.82, 4.5); ctx.fill(); ctx.fillStyle = hgrad(ctx, x - w2, x + w2, [[0, darker(c, 0.4)], [0.4, lighter(c, 0.6)], [1, darker(c, 0.4)]]); ell(ctx, x + dx * w2, y + dy * h2 + sh, w2 * 0.82, 4.5); ctx.fill(); }
          ctx.strokeStyle = '#d6b258'; ctx.lineWidth = 2.4; rrect(ctx, x - w2, y - h2, 2 * w2, 2 * h2, 4); ctx.stroke();
        }
        // the face: wood hoop and pale fish skin
        ctx.save(); ctx.scale(1, ryk);
        hoop(ctx, R * 0.93, R * 0.93, R * 0.07, { kind: 'wood', col: '#5a2e14' });
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 0, 0, R * 0.95, R * 0.95); ctx.fill();
        skinHead(ctx, R * 0.93, R * 0.93, { tint: '#f0dcb4', edge: '#c8a870', seed: 12, vib: v, wear: 0.8 });
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,235,200,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, R * 1.0, R * ryk, 0, PI * 1.1, PI * 1.55); ctx.stroke();
        ctx.restore();
        void mix; void chromeH; void bolt; void shiver; void tube; void foot; void taperBody; void blob; void block; void tilesFloor; void wood; void lighter;
      } };
    },
  }); },
});
const k_ = (d) => d * 0.13;
defVoice('riq-dum', 'skin', { dur: 0.3, drop: 1.12, glide: 0.04, modes: [[1, 1, 1], [1.7, 0.45, 0.6], [2.5, 0.25, 0.4]], shell: { f: 200, q: 4, gain: 0.3, dur: 0.14 }, click: { f: 2200, gain: 0.3 }, lp: 4000, gain: 0.6 });
defVoice('riq-tak', 'skin', { dur: 0.09, drop: 1.08, modes: [[1, 1, 1], [2.2, 0.6, 0.5], [3.2, 0.4, 0.4]], click: { f: 4400, q: 1, gain: 0.95, dur: 0.02 }, lp: 10000, gain: 0.46 });
registerStrikeVoice('riq-jing', (c) => c.evoice(c.audio, 'jingle', { n: 8, f: 4200, spread: 0.1, dur: 0.22, gain: 0.2, vel: c.vel, wet: 0.12 }));
defVoice('riq-rim', 'woodtok', { dur: 0.07, gain: 0.45, hollow: 2.0, overtone: 3.4 });

// ======================================================================================================================================================
// UDU: a glazed clay water-pot drum lying on its side on a woven mat: a big side hole faces you, the neck points away to the right.
// Backdrop: a sunlit clay workshop wall with a shelf of small pots.
// ======================================================================================================================================================
const UDU = [['hole', /hole|bass|boom|doom|^low/], ['neck', /neck|top|mouth|blow/], ['belly', /belly|body|tap|slap/], ['shoulder', /shoulder|rim|click|^high/]];
function clayShop(ctx, F, rt, S, scene) {
  const A = F.area, wallB = Math.min(A.y + A.h - 40, F.map(0, scene.wallU)[1]), wallH = wallB - A.y;
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
  ctx.fillStyle = vgrad(ctx, A.y, wallB, [[0, '#7a4224'], [0.5, '#b4733c'], [1, '#c98b50']]); ctx.fillRect(A.x, A.y, A.w, wallH);
  for (let k = 0; k < 70; k++) { const y = A.y + wallH * hash(k * 3 + 1), x = A.x + A.w * hash(k * 5 + 2), w2 = A.w * (0.05 + 0.18 * hash(k + 4)); ctx.strokeStyle = rgba(hash(k) > 0.5 ? '#e8b878' : '#5a2e14', 0.12); ctx.lineWidth = 3 + 6 * hash(k + 9); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + w2 / 2, y - 6 + 12 * hash(k + 2), x + w2, y + 4); ctx.stroke(); }
  speckle(ctx, A.x, A.y, A.w, wallH, 240, '#3a1c0c', 0.3, 7, 0.7, 2.2);
  // a window and a slanting shaft of sunlight
  const wx = A.x + A.w * 0.78, ww = Math.min(A.w * 0.2, wallH * 0.3), wy = A.y + wallH * 0.12;
  ctx.fillStyle = '#2a140a'; rrect(ctx, wx - 8, wy - 8, ww + 16, ww * 1.2 + 16, 8); ctx.fill(); ctx.fillStyle = vgrad(ctx, wy, wy + ww * 1.2, [[0, '#ffe8b0'], [1, '#ffc470']]); rrect(ctx, wx, wy, ww, ww * 1.2, 4); ctx.fill();
  ctx.fillStyle = '#2a140a'; ctx.fillRect(wx + ww / 2 - 3, wy, 6, ww * 1.2); ctx.fillRect(wx, wy + ww * 0.55, ww, 6);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(wx, wy, wx - ww * 2, wy + wallH * 0.9); g.addColorStop(0, 'rgba(255,230,170,0.38)'); g.addColorStop(1, 'rgba(255,230,170,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + ww, wy + ww * 0.2); ctx.lineTo(wx - ww * 1.2, A.y + wallH); ctx.lineTo(wx - ww * 3.2, A.y + wallH); ctx.closePath(); ctx.fill(); ctx.restore();
  // a shelf of small pots
  const sy = A.y + wallH * 0.42, sx0 = A.x + A.w * 0.04, sx1 = A.x + A.w * 0.58;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(sx0, sy + 6, sx1 - sx0, 16); ctx.fillStyle = vgrad(ctx, sy, sy + 14, [[0, '#8a5a2c'], [1, '#4a2a12']]); ctx.fillRect(sx0, sy, sx1 - sx0, 14);
  const pots = [[0.06, 52, 0.9, '#1f8f93'], [0.17, 40, 1.2, '#9a4a1c'], [0.29, 62, 0.8, '#d8c8a0'], [0.4, 46, 1.1, '#5a2e1a'], [0.5, 54, 0.95, '#2a6a8a']];
  const ps = Math.min(1, A.w / 700);
  for (const [fx, r0, ht, c] of pots) {
    const r = r0 * ps, x = sx0 + (sx1 - sx0) * fx / 0.56 * 0.9 + r, yb = sy, hh = r * ht * 1.6;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, x + 5, yb + 2, r * 0.9, 5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - r * 0.45, yb); ctx.bezierCurveTo(x - r * 1.05, yb - hh * 0.2, x - r * 1.0, yb - hh * 0.7, x - r * 0.4, yb - hh * 0.82); ctx.lineTo(x - r * 0.3, yb - hh); ctx.lineTo(x + r * 0.3, yb - hh); ctx.lineTo(x + r * 0.4, yb - hh * 0.82); ctx.bezierCurveTo(x + r * 1.0, yb - hh * 0.7, x + r * 1.05, yb - hh * 0.2, x + r * 0.45, yb); ctx.closePath();
    ctx.fillStyle = hgrad(ctx, x - r, x + r, [[0, darker(c, 0.55)], [0.3, lighter(c, 0.3)], [0.6, c], [1, darker(c, 0.6)]]); ctx.fill(); ctx.strokeStyle = 'rgba(30,12,4,0.6)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#120804'; ell(ctx, x, yb - hh, r * 0.3, 5); ctx.fill();
  }
  // hanging gourd ladles
  for (const fx of [0.68, 0.9]) { const x = A.x + A.w * fx, y = A.y + wallH * 0.58; ctx.strokeStyle = '#2a1408'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, A.y + wallH * 0.5); ctx.lineTo(x, y); ctx.stroke(); ctx.fillStyle = hgrad(ctx, x - 22, x + 22, [[0, '#6a4a1a'], [0.4, '#d0a04a'], [1, '#5a3a12']]); ell(ctx, x, y + 22, 21, 26); ctx.fill(); ctx.strokeStyle = 'rgba(30,12,4,0.6)'; ctx.stroke(); }
  // floor and mat
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(A.x, wallB - 3, A.w, 8);
  const fh = A.y + A.h - wallB; ctx.fillStyle = vgrad(ctx, wallB, A.y + A.h, [[0, '#6a3e22'], [1, '#2e180c']]); ctx.fillRect(A.x, wallB, A.w, fh);
  speckle(ctx, A.x, wallB, A.w, fh, 200, '#1a0a04', 0.35, 14, 1, 3.4);
  const mw = A.w * 0.7, mx = A.x + (A.w - mw) / 2, my = wallB + fh * 0.1, mh = fh * 0.78;
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, mx + 6, my + 8, mw, mh, 10); ctx.fill();
  ctx.fillStyle = '#c8a45a'; rrect(ctx, mx, my, mw, mh, 10); ctx.fill();
  ctx.save(); rrect(ctx, mx, my, mw, mh, 10); ctx.clip();
  const cell = 16; for (let yy = my; yy < my + mh; yy += cell) for (let xx = mx; xx < mx + mw; xx += cell) { const o = (Math.floor((xx - mx) / cell) + Math.floor((yy - my) / cell)) & 1; ctx.fillStyle = o ? 'rgba(90,50,16,0.2)' : 'rgba(255,236,170,0.12)'; ctx.fillRect(xx, yy, cell - 1.5, cell - 1.5); }
  for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? 'rgba(150,40,30,0.55)' : 'rgba(30,60,90,0.5)'; ctx.fillRect(mx, my + mh * (0.12 + 0.19 * k) - 3, mw, 7); }
  ctx.restore();
  ctx.restore();
  pool(ctx, A.x + A.w * 0.5, wallB + fh * 0.3, A.w * 0.5, A.h * 0.28, '#ffd9a0', 0.3);
  vignette(ctx, A, 0.5);
}
registerDrumStage({
  id: 'udu', match: /\budu\b|water.?pot|clay.?jug|pot drum/,
  build: (S, lanes, P) => { const zoneOf = []; const layer = staticLayer(); return createDrumStage('udu', S, lanes, P, {
    dress: () => ({ custom: (ctx, F, rt, S2, scene) => layer(ctx, { x: F.area.x, y: F.area.y, w: F.area.w, h: F.area.h }, (g) => clayShop(g, F, rt, S2, scene)) }),
    voiceOf: (i) => `udu-${zoneOf[i] ?? 'hole'}`,
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 800, h: 860 } : { w: 1000, h: 560 }, keyOf = assignZones(K, UDU.map(([key, re]) => ({ key, re })));
      for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const Rb = tall ? 240 : 195, cx = tall ? -50 : -60, cy = tall ? 430 : 255, rot = -0.1, by = {};
      const at = (x, y) => { const [a, b] = rot2(x, y, rot); return [cx + a, cy + b]; };
      const [hx, hy] = at(-Rb * 0.2, Rb * 0.04), [nx, ny] = at(Rb * 1.26, -Rb * 0.02), [bx, by2] = at(-Rb * 0.32, Rb * 0.62), [sx, sy] = at(Rb * 0.5, -Rb * 0.56);
      by.hole = eSpot(hx, hy, Rb * 0.34, Rb * 0.34, rot, { apk: 0.95 }); by.neck = eSpot(nx, ny, Rb * 0.13, Rb * 0.3, rot, { apk: 0.95 });
      by.belly = eSpot(bx, by2, Rb * 0.28, Rb * 0.2, rot, { apk: 0.95 }); by.shoulder = eSpot(sx, sy, Rb * 0.25, Rb * 0.18, rot, { apk: 0.95 });
      const spots = new Array(K.N).fill(null); for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
      const yF = cy + Rb * 0.95 + (tall ? 150 : 70);
      return { ref, spots, wallU: cy + Rb * 0.3, draw(ctx, rt) {
        const vh = fl(K, keyOf, rt, 'hole'), vn = fl(K, keyOf, rt, 'neck'), vb = fl(K, keyOf, rt, 'belly', 'shoulder');
        floorShadow(ctx, cx + Rb * 0.2, cy + Rb * 0.98, Rb * 1.7, 38, 0.55);
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
        const col = '#1f8e93';
        // the neck: a short cylinder lying to the right
        const nL = Rb * 0.7, nR = Rb * 1.24, nr = Rb * 0.3;
        ctx.beginPath(); ctx.moveTo(nL, -nr); ctx.lineTo(nR, -nr * 0.92); ctx.ellipse(nR, 0, nr * 0.3, nr * 0.92, 0, -PI / 2, PI / 2); ctx.lineTo(nL, nr); ctx.closePath();
        ctx.fillStyle = vgrad(ctx, -nr, nr, [[0, darker(col, 0.5)], [0.2, lighter(col, 0.45)], [0.45, col], [1, darker(col, 0.65)]]); ctx.fill(); ctx.strokeStyle = 'rgba(0,20,24,0.7)'; ctx.lineWidth = 2.5; ctx.stroke();
        for (const fx of [0.3, 0.46, 0.6]) { const x = nL + (nR - nL) * fx; ctx.strokeStyle = 'rgba(4,36,40,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, 0, nr * 0.3, nr * 0.95, 0, -PI / 2, PI / 2); ctx.stroke(); ctx.strokeStyle = 'rgba(200,240,230,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x + 3, 0, nr * 0.3, nr * 0.95, 0, -PI / 2, PI / 2); ctx.stroke(); }
        ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.ellipse(nR, 0, nr * 0.3 + 6, nr * 0.92 + 6, 0, 0, TAU); ctx.fill();   // lip
        ctx.fillStyle = rgrad(ctx, nR + 2, 0, 0, nr, [[0, '#000'], [0.8, '#07181c'], [1, '#1a3a40']]); ctx.beginPath(); ctx.ellipse(nR, 0, nr * 0.3, nr * 0.92, 0, 0, TAU); ctx.fill();
        if (vn > 0.05) { ctx.fillStyle = `rgba(255,220,150,${0.5 * vn})`; ctx.beginPath(); ctx.ellipse(nR, 0, nr * 0.3, nr * 0.92, 0, 0, TAU); ctx.fill(); }
        // the body: a squat sphere with glaze
        const body = () => { ctx.beginPath(); ctx.ellipse(0, 0, Rb, Rb * 0.95, 0, 0, TAU); };
        ctx.save(); dropShadowBody(ctx, Rb);
        body(); ctx.fillStyle = rgrad(ctx, 0, 0, 0, Rb * 1.15, [[0, lighter(col, 0.1)], [0.7, col], [1, darker(col, 0.7)]], -Rb * 0.38, -Rb * 0.42); ctx.fill(); ctx.save(); body(); ctx.clip();
        // reduction-fired copper patches near the foot and cream glaze drips from the shoulder
        for (let k = 0; k < 4; k++) { blob(ctx, -Rb * 0.5 + k * Rb * 0.38, Rb * (0.78 + 0.08 * hash(k)), Rb * 0.3, k * 7 + 2, 12, 0.5); ctx.fillStyle = rgba('#a85a24', 0.55); ctx.fill(); }
        for (let k = 0; k < 7; k++) { const x = -Rb * 0.75 + k * Rb * 0.25, len = Rb * (0.18 + 0.3 * hash(k + 3)); ctx.fillStyle = rgba('#efe4c8', 0.8); ctx.beginPath(); ctx.moveTo(x - 14, -Rb * 1.0); ctx.lineTo(x + 14, -Rb * 1.0); ctx.lineTo(x + 12, -Rb * 0.8 + len); ctx.quadraticCurveTo(x, -Rb * 0.8 + len + 22, x - 12, -Rb * 0.8 + len); ctx.closePath(); ctx.fill(); }
        // incised spirals and dots round the hole
        for (const [rr, c2, n] of [[Rb * 0.52, '#efe4c8', 22], [Rb * 0.62, '#12383c', 26], [Rb * 0.72, '#efe4c8', 30]]) for (let k = 0; k < n; k++) { const a = (k / n) * TAU + rr * 0.01, x = -Rb * 0.2 + Math.cos(a) * rr * 1.04, y = Rb * 0.04 + Math.sin(a) * rr; ctx.fillStyle = c2; circ(ctx, x, y, 4.4); ctx.fill(); }
        ctx.strokeStyle = 'rgba(8,40,44,0.7)'; ctx.lineWidth = 3; for (let k = 0; k < 2; k++) { ctx.beginPath(); for (let t = 0; t <= 60; t++) { const a = t * 0.2, rr = Rb * (0.36 + 0.006 * t * (k ? 1 : 0.8)); const x = Rb * 0.5 + Math.cos(a + k * 3) * rr * 0.3, y = -Rb * 0.5 + Math.sin(a + k * 3) * rr * 0.3; if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); }
        ctx.fillStyle = vgrad(ctx, -Rb, Rb, [[0, 'rgba(60,200,190,0.18)'], [0.55, 'rgba(10,60,110,0)'], [1, 'rgba(8,40,100,0.55)']]); ctx.fillRect(-Rb, -Rb, 2 * Rb, 2 * Rb);
        // glaze sheen and speckle
        ctx.fillStyle = rgrad(ctx, -Rb * 0.45, -Rb * 0.5, 0, Rb * 0.7, [[0, 'rgba(255,255,255,0.5)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-Rb, -Rb, 2 * Rb, 2 * Rb);
        speckle(ctx, -Rb, -Rb, 2 * Rb, 2 * Rb, 160, '#07282c', 0.3, 22, 0.8, 2);
        ctx.fillStyle = rgrad(ctx, 0, 0, Rb * 0.5, Rb * 1.08, [[0, 'rgba(0,0,0,0)'], [0.7, 'rgba(0,10,14,0.35)'], [1, 'rgba(0,6,12,0.78)']]); ctx.fillRect(-Rb, -Rb, 2 * Rb, 2 * Rb);
        ctx.save(); ctx.translate(-Rb * 0.5, -Rb * 0.52); ctx.rotate(-0.7); ctx.fillStyle = rgrad(ctx, 0, 0, 0, Rb * 0.32, [[0, 'rgba(255,255,255,0.75)'], [1, 'rgba(255,255,255,0)']]); ell(ctx, 0, 0, Rb * 0.34, Rb * 0.12); ctx.fill(); ctx.restore();
        ctx.strokeStyle = 'rgba(150,230,225,0.35)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(0, 0, Rb * 0.97, Rb * 0.92, 0, PI * 0.12, PI * 0.55); ctx.stroke();
        if (vb > 0.05) { ctx.fillStyle = `rgba(255,236,190,${0.18 * vb})`; ctx.fillRect(-Rb, -Rb, 2 * Rb, 2 * Rb); }
        ctx.restore(); body(); ctx.strokeStyle = 'rgba(0,20,26,0.8)'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
        // the side hole: a thick lip and a dark chamber
        const hx0 = -Rb * 0.2, hy0 = Rb * 0.04, hr = Rb * 0.34;
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, hx0 + 6, hy0 + 8, hr * 1.18, hr * 1.2); ctx.fill();
        ctx.fillStyle = rgrad(ctx, hx0 - hr * 0.3, hy0 - hr * 0.4, 0, hr * 1.4, [[0, '#fff4da'], [0.5, '#d8c496'], [1, '#7a6238']]); ell(ctx, hx0, hy0, hr * 1.16, hr * 1.18); ctx.fill(); ctx.strokeStyle = 'rgba(40,24,6,0.7)'; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.fillStyle = rgrad(ctx, hx0 + hr * 0.1, hy0 + hr * 0.2, 0, hr * 1.05, [[0, '#000'], [0.7, '#06161a'], [1, '#1a3c42']]); ell(ctx, hx0, hy0, hr, hr * 1.02); ctx.fill();
        ctx.save(); ell(ctx, hx0, hy0, hr, hr * 1.02); ctx.clip();
        ctx.fillStyle = rgrad(ctx, hx0 + hr * 0.55, hy0 + hr * 0.6, 0, hr * 0.9, [[0, 'rgba(210,150,90,0.3)'], [0.6, 'rgba(120,70,40,0.12)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(hx0 - hr, hy0 - hr, 2 * hr, 2 * hr);
        ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.lineWidth = hr * 0.22; ell(ctx, hx0 - hr * 0.04, hy0 - hr * 0.06, hr * 1.0, hr * 1.02); ctx.stroke();
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(hx0, hy0, hr * 0.92, hr * 0.94, 0, PI * 0.15, PI * 0.8); ctx.stroke();
        if (vh > 0.04) { ctx.fillStyle = rgrad(ctx, hx0, hy0, 0, hr, [[0, `rgba(255,210,140,${0.55 * vh})`], [1, 'rgba(255,210,140,0)']]); ell(ctx, hx0, hy0, hr, hr); ctx.fill(); }
        ctx.restore();
        void mix; void chromeH; void bolt; void shiver; void tube; void foot; void taperBody; void block; void tilesFloor; void wood; void hoop; void skinHead; void yF;
      } };
    },
  }); },
});
function dropShadowBody(ctx, Rb) { ctx.save(); ctx.translate(Rb * 0.06, Rb * 0.08); ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.ellipse(0, 0, Rb, Rb * 0.95, 0, 0, TAU); ctx.fill(); ctx.restore(); }
defVoice('udu-hole', 'skin', { dur: 0.55, drop: 1.0, rise: 0.78, glide: 0.1, modes: [[1, 1, 1], [2.0, 0.22, 0.5]], shell: { f: 110, q: 5, gain: 0.45, dur: 0.28 }, lp: 900, gain: 0.8 });
defVoice('udu-neck', 'skin', { dur: 0.4, drop: 1.3, glide: 0.08, modes: [[1, 1, 1], [1.5, 0.2, 0.5]], shell: { f: 160, q: 6, gain: 0.4, dur: 0.22 }, lp: 1200, gain: 0.7 });
defVoice('udu-belly', 'skin', { dur: 0.22, drop: 1.1, glide: 0.03, modes: [[1, 1, 1], [2.1, 0.5, 0.7], [3.2, 0.3, 0.5]], click: { f: 2600, gain: 0.5 }, shell: { f: 380, q: 8, gain: 0.3, dur: 0.14 }, lp: 4200, gain: 0.55 });
defVoice('udu-shoulder', 'woodtok', { dur: 0.1, gain: 0.5, hollow: 1.6, overtone: 3.0 });

// ======================================================================================================================================================
// Backdrops for the two older stages of 1.18.0 that stayed top-down or front-on (daf, ghatam). Used from stage-drums2.js (1.20.1).
// ======================================================================================================================================================
// DAF: the whole screen is a hand-knotted rug seen from above, crimson and indigo with cream and gold ornament, a medallion under the drum and fringe at both ends
export function rugFloor(ctx, F, rt, S, scene) {
  const A = F.area, [mx, my] = F.map(0, scene.centerU ?? 400), u = Math.min(A.w, A.h), fr = u * 0.045;
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
  ctx.fillStyle = '#1a0c10'; ctx.fillRect(A.x, A.y, A.w, A.h);
  const x0 = A.x + fr * 0.8, y0 = A.y + fr * 0.8, w0 = A.w - fr * 1.6, h0 = A.h - fr * 1.6;
  // field
  ctx.fillStyle = rgrad(ctx, mx, my, 0, Math.max(w0, h0) * 0.7, [[0, '#a8202e'], [0.6, '#7e1424'], [1, '#5a0c1a']]); ctx.fillRect(x0, y0, w0, h0);
  for (let k = 0; k < 900; k++) { ctx.fillStyle = `rgba(${hash(k) > 0.5 ? '255,200,170' : '30,0,10'},${0.04 + 0.05 * hash(k + 3)})`; ctx.fillRect(x0 + hash(k * 3 + 1) * w0, y0 + hash(k * 5 + 2) * h0, 2 + 3 * hash(k + 7), 2); }
  // all-over small rosettes on a diamond grid
  const g = u * 0.14;
  for (let r = -1; r * g < h0 + g; r++) for (let c = -1; c * g < w0 + g; c++) {
    const x = x0 + c * g + (r & 1 ? g / 2 : 0), y = y0 + r * g * 0.9, k = (r + c) & 1;
    for (let p = 0; p < 8; p++) { const a = (p / 8) * TAU; ctx.fillStyle = k ? 'rgba(236,214,160,0.34)' : 'rgba(30,50,110,0.5)'; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * g * 0.17, y + Math.sin(a) * g * 0.17, g * 0.1, g * 0.045, a, 0, TAU); ctx.fill(); }
    ctx.fillStyle = k ? 'rgba(214,178,88,0.5)' : 'rgba(236,214,160,0.4)'; circ(ctx, x, y, g * 0.05); ctx.fill();
  }
  // a big medallion behind the drum: nested lobed rings
  for (let k = 0; k < 4; k++) { const rr = u * (0.5 - k * 0.07); ctx.strokeStyle = [`rgba(214,178,88,0.55)`, `rgba(20,38,90,0.7)`, `rgba(236,214,160,0.5)`, `rgba(20,38,90,0.7)`][k]; ctx.lineWidth = 5 - k; ctx.beginPath(); for (let t = 0; t <= 96; t++) { const a = (t / 96) * TAU, rad = rr * (1 + 0.05 * Math.cos(a * 12)); const x = mx + Math.cos(a) * rad, y = my + Math.sin(a) * rad; if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); }
  // corner spandrels
  for (const [cx, cy] of [[x0, y0], [x0 + w0, y0], [x0, y0 + h0], [x0 + w0, y0 + h0]]) { for (let k = 0; k < 3; k++) { ctx.fillStyle = ['rgba(20,38,90,0.75)', 'rgba(236,214,160,0.5)', 'rgba(20,38,90,0.85)'][k]; ctx.beginPath(); ctx.arc(cx, cy, u * (0.3 - k * 0.07), 0, TAU); ctx.fill(); } }
  // borders: indigo band with cream diamonds, a cream vine band, a thin gold line
  const band = (inset, wd, col, fn) => { ctx.fillStyle = col; ctx.beginPath(); ctx.rect(x0 + inset, y0 + inset, w0 - 2 * inset, h0 - 2 * inset); ctx.rect(x0 + inset + wd, y0 + inset + wd, w0 - 2 * (inset + wd), h0 - 2 * (inset + wd)); ctx.fill('evenodd'); if (fn) fn(inset, wd); };
  band(0, u * 0.05, '#142a5a', (inset, wd) => { const n = Math.round((w0 + h0) / (wd * 1.6)); for (let k = 0; k < n; k++) { const t = k / n, per = 2 * (w0 + h0), d = t * per; let x, y; if (d < w0) { x = x0 + d; y = y0 + wd / 2; } else if (d < w0 + h0) { x = x0 + w0 - wd / 2; y = y0 + d - w0; } else if (d < 2 * w0 + h0) { x = x0 + w0 - (d - w0 - h0); y = y0 + h0 - wd / 2; } else { x = x0 + wd / 2; y = y0 + h0 - (d - 2 * w0 - h0); } ctx.fillStyle = k % 2 ? '#e8d6a0' : '#c8302a'; ctx.beginPath(); ctx.moveTo(x, y - wd * 0.28); ctx.lineTo(x + wd * 0.28, y); ctx.lineTo(x, y + wd * 0.28); ctx.lineTo(x - wd * 0.28, y); ctx.closePath(); ctx.fill(); } });
  band(u * 0.05, u * 0.045, '#e6d3a0');
  band(u * 0.095, u * 0.012, '#d6b258');
  band(u * 0.107, u * 0.02, '#142a5a');
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 3; ctx.strokeRect(x0, y0, w0, h0);
  // fringe at the top and the bottom
  for (const yy of [A.y, A.y + A.h]) for (let k = 0; k < A.w / 7; k++) { const x = A.x + k * 7 + 2, dir = yy === A.y ? 1 : -1; ctx.strokeStyle = k % 2 ? '#e8dcc0' : '#cdbf9c'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x, yy + dir * fr * 0.8); ctx.lineTo(x + (hash(k) - 0.5) * 4, yy + dir * 1); ctx.stroke(); }
  ctx.restore();
  pool(ctx, mx, my, u * 0.7, u * 0.7, '#ffd9a0', 0.26);
  vignette(ctx, A, 0.5);
}
// GHATAM: a south Indian hall: lime-washed wall with a red dado, two teak pillars with brass bands under a carved beam, a patterned cement-tile floor
export function southHall(ctx, F, rt, S, scene) {
  const A = F.area, wallB = Math.min(A.y + A.h - 50, F.map(0, scene.wallU)[1]), wallH = wallB - A.y;
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
  ctx.fillStyle = vgrad(ctx, A.y, wallB, [[0, '#d8c08a'], [0.6, '#ecd9a8'], [1, '#e2c88e']]); ctx.fillRect(A.x, A.y, A.w, wallH);
  for (let k = 0; k < 24; k++) { const x = A.x + A.w * hash(k * 3 + 1), y = A.y + wallH * hash(k * 5 + 2); ctx.fillStyle = rgrad(ctx, x, y, 0, A.w * 0.12, [[0, 'rgba(150,100,40,0.12)'], [1, 'rgba(150,100,40,0)']]); ctx.fillRect(x - A.w * 0.12, y - A.w * 0.12, A.w * 0.24, A.w * 0.24); }
  speckle(ctx, A.x, A.y, A.w, wallH, 200, '#6a4a20', 0.25, 5, 0.6, 1.8);
  // a carved beam and rafters
  const bh = wallH * 0.09; ctx.fillStyle = vgrad(ctx, A.y, A.y + bh, [[0, '#4a2a14'], [0.5, '#7a4a24'], [1, '#2e180a']]); ctx.fillRect(A.x, A.y, A.w, bh);
  for (let k = 0; k < A.w / 22; k++) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(A.x + k * 22 + 4, A.y + bh * 0.62, 10, bh * 0.3); ctx.fillStyle = 'rgba(255,214,150,0.18)'; ctx.fillRect(A.x + k * 22 + 4, A.y + bh * 0.58, 10, 2); }
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(A.x, A.y + bh, A.w, 6);
  // dado
  const dh = wallH * 0.2; ctx.fillStyle = vgrad(ctx, wallB - dh, wallB, [[0, '#9a3020'], [1, '#6a1c12']]); ctx.fillRect(A.x, wallB - dh, A.w, dh);
  ctx.fillStyle = '#f2e6c8'; ctx.fillRect(A.x, wallB - dh, A.w, 4); ctx.fillRect(A.x, wallB - dh + 10, A.w, 2);
  // pillars
  const pw = Math.min(A.w * 0.12, wallH * 0.18);
  for (const px of [A.x + A.w * 0.05 + pw / 2, A.x + A.w * 0.95 - pw / 2]) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(px - pw / 2 + 8, A.y + bh, pw, wallH - bh);
    ctx.fillStyle = hgrad(ctx, px - pw / 2, px + pw / 2, [[0, '#2a140a'], [0.25, '#8a5228'], [0.5, '#6a3a1a'], [0.8, '#3a1c0c'], [1, '#1e0e06']]); ctx.fillRect(px - pw / 2, A.y + bh, pw, wallH - bh);
    for (const f of [0.28, 0.62]) { const y = A.y + wallH * f; ctx.fillStyle = hgrad(ctx, px - pw / 2 - 5, px + pw / 2 + 5, [[0, '#6a4a10'], [0.3, '#f0d070'], [0.6, '#b8902a'], [1, '#5a3a08']]); ctx.fillRect(px - pw / 2 - 5, y, pw + 10, wallH * 0.035); }
    ctx.fillStyle = hgrad(ctx, px - pw, px + pw, [[0, '#2a140a'], [0.5, '#8a5228'], [1, '#2a140a']]); ctx.beginPath(); ctx.moveTo(px - pw * 0.5, A.y + bh); ctx.lineTo(px - pw * 0.95, A.y + bh); ctx.lineTo(px - pw * 0.5, A.y + bh + wallH * 0.09); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(px + pw * 0.5, A.y + bh); ctx.lineTo(px + pw * 0.95, A.y + bh); ctx.lineTo(px + pw * 0.5, A.y + bh + wallH * 0.09); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6a6458'; ctx.fillRect(px - pw * 0.66, wallB - wallH * 0.06, pw * 1.32, wallH * 0.06);
  }
  // floor: patterned cement tiles
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(A.x, wallB - 2, A.w, 6);
  const fh = A.y + A.h - wallB, ts = Math.max(60, A.w / 7);
  ctx.fillStyle = '#5a1c10'; ctx.fillRect(A.x, wallB, A.w, fh);
  for (let r = 0; r * ts * 0.55 < fh + ts; r++) for (let c = -1; c * ts < A.w + ts; c++) {
    const x = A.x + c * ts + (A.w % ts) / 2, y = wallB + r * ts * 0.55, k = (r + c) % 3, base = k === 0 ? '#b8452a' : k === 1 ? '#e8c46a' : '#2a6a5a';
    ctx.fillStyle = base; ctx.fillRect(x + 2, y + 2, ts - 4, ts * 0.55 - 4);
    ctx.fillStyle = k === 1 ? '#8a2a18' : '#f2e6c8'; ctx.beginPath(); ctx.moveTo(x + ts / 2, y + 8); ctx.lineTo(x + ts - 12, y + ts * 0.275); ctx.lineTo(x + ts / 2, y + ts * 0.55 - 8); ctx.lineTo(x + 12, y + ts * 0.275); ctx.closePath(); ctx.fill();
    ctx.fillStyle = base; circ(ctx, x + ts / 2, y + ts * 0.275, ts * 0.06); ctx.fill();
  }
  ctx.fillStyle = vgrad(ctx, wallB, A.y + A.h, [[0, 'rgba(0,0,0,0.1)'], [1, 'rgba(0,0,0,0.6)']]); ctx.fillRect(A.x, wallB, A.w, fh);
  ctx.restore();
  pool(ctx, A.x + A.w / 2, wallB, A.w * 0.5, A.h * 0.3, '#ffe0b0', 0.3);
  vignette(ctx, A, 0.5);
}

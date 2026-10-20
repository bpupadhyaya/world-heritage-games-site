// Drum stages, second wave (1.18.0): bongo (Cuba: a joined pair of wooden heads, small macho and larger hembra), timbales (Cuba: two shallow chrome drums
// and a mounted cowbell), naqareh (Iran and the Caucasus: a pair of copper kettle drums laced with leather), daf (Iran: a big frame drum with a mosaic
// frame and loose rings) and ghatam (south India: a clay pot played on its mouth, neck, shoulder and belly). Seen from above (the pot from the front);
// no performer is drawn: the struck zone flares and the skin shivers.
import { registerDrumStage } from './registry.js';
import { createDrumStage, eSpot, eRing, eSector, assignZones, skinHead, dropShadow, studRing, hoop } from './drum-kit.js';
import { staticLayer, rugFloor, southHall } from './stage-drums3.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU } from './drum-kit.js';
import { defVoice } from './voice-synth2.js';
import { registerStrikeVoice } from './voice-registry.js';

const PI = Math.PI, d2r = (d) => d * PI / 180;
const fl = (K, keyOf, rt, ...ks) => { let m = 0; for (let i = 0; i < K.N; i++) if (ks.includes(keyOf[i])) m = Math.max(m, rt.flash[i]); return m; };
const metal = (ctx, x0, x1, c) => hgrad(ctx, x0, x1, [[0, darker(c, 0.5)], [0.2, lighter(c, 0.6)], [0.45, c], [0.7, darker(c, 0.35)], [0.9, lighter(c, 0.4)], [1, darker(c, 0.55)]]);

// a head on a shell: shell ring (wood or metal), hoop, tuning lugs, skin
function headOn(ctx, cx, cy, R, rh, o, vib) {
  ctx.save(); ctx.translate(cx, cy);
  dropShadow(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); }, 12, 18, 0.42);
  ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU);
  ctx.fillStyle = o.chrome ? metal(ctx, -R, R, o.shell) : rgrad(ctx, 0, 0, rh, R, [[0, darker(o.shell, 0.3)], [0.5, o.shell], [1, darker(o.shell, 0.6)]], -R * 0.3, -R * 0.35); ctx.fill();
  if (!o.chrome) { ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip(); grain(ctx, -R, -R, 2 * R, 2 * R, darker(o.shell, 0.7), 0.4, o.seed ?? 3, false, 22); ctx.restore(); }
  ctx.strokeStyle = 'rgba(255,235,190,0.45)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, R - 2, PI * 0.9, PI * 1.6); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(0, 0, rh + 10, 0, TAU); ctx.fill();
  skinHead(ctx, rh, rh, { tint: o.tint, edge: o.edge, seed: o.seed ?? 4, vib, wear: o.wear ?? 0.7, paste: o.paste });
  hoop(ctx, rh, rh, (R - rh) * 0.55, { kind: 'metal', col: o.hoop ?? '#c9ccd2' });
  if (o.lugs) studRing(ctx, R - (R - rh) * 0.22, R - (R - rh) * 0.22, o.lugs, Math.max(4, (R - rh) * 0.2), o.lugCol ?? '#dfe3ea', 0.2);
  ctx.restore();
}

// ---- daf ------------------------------------------------------------------------------------------------------------------------------------
const DAF = [['c', /dum|centre|center|bass|boom/], ['m', /mid|tom|open|bom/], ['e', /edge|tak|tek|ka\b/], ['rim', /rim|frame/], ['sh', /shake|ring|jingle|trill/]];
registerDrumStage({
  id: 'daf', match: /\bdaf\b|\bdaff\b|dafli|duff/,
  build: (S, lanes, P) => { const zoneOf = []; const layer = staticLayer(); return createDrumStage('daf', S, lanes, P, {
    dress: () => ({ custom: (ctx, F, rt, S2, scene) => layer(ctx, { x: F.area.x, y: F.area.y, w: F.area.w, h: F.area.h }, (g) => rugFloor(g, F, rt, S2, scene)) }),
    voiceOf: (i) => `daf-${zoneOf[i] ?? 'c'}`,
    build: (K) => {
      const ref = { w: 800, h: 800 }, cx = 0, cy = 400, R = 344, fw = 70, rh = R - fw, keyOf = assignZones(K, DAF.map(([key, re]) => ({ key, re })));
      for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const by = {};
      by.c = eSpot(cx, cy, rh * 0.3, rh * 0.3, 0, { apk: 0.95 }); by.m = eRing(cx, cy, rh, rh, 0, 0.38, 0.68, -PI / 2 - 0.3); by.e = eRing(cx, cy, rh, rh, 0, 0.72, 0.98, PI / 2);
      by.rim = eSector(cx, cy, rh, rh, 0, 1.03, R / rh, d2r(-60), d2r(60)); by.sh = eSector(cx, cy, rh, rh, 0, 1.03, R / rh, d2r(100), d2r(260));
      const spots = new Array(K.N).fill(null); for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
      return { ref, spots, centerU: cy, draw(ctx, rt) {
        const vib = Math.max(fl(K, keyOf, rt, 'c', 'm', 'e')), shake = Math.max(fl(K, keyOf, rt, 'sh'), fl(K, keyOf, rt, 'rim') * 0.6, vib * 0.5);
        dropShadow(ctx, () => { ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); }, 16, 26, 0.45);
        // walnut frame with a mosaic band of small pale and red diamonds, and brass studs
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = rgrad(ctx, cx, cy, rh, R, [[0, '#3a1e0e'], [0.5, '#5a3016'], [1, '#2a1408']], cx - R * 0.25, cy - R * 0.3); ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip(); grain(ctx, cx - R, cy - R, 2 * R, 2 * R, '#150a04', 0.4, 5, false, 26); ctx.restore();
        const nd = 44; for (let k = 0; k < nd; k++) { const a = (k / nd) * TAU, r = R - fw * 0.5; ctx.save(); ctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.rotate(a + PI / 4); const s = fw * 0.2; ctx.fillStyle = k % 3 === 0 ? '#b8302a' : k % 3 === 1 ? '#efe2c0' : '#d8b050'; ctx.fillRect(-s, -s, 2 * s, 2 * s); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.4; ctx.strokeRect(-s, -s, 2 * s, 2 * s); ctx.restore(); }
        ctx.strokeStyle = 'rgba(255,224,170,0.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R - 2, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, R - fw + 3, 0, TAU); ctx.stroke();
        ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.arc(0, 0, rh + 6, 0, TAU); ctx.fill();
        skinHead(ctx, rh, rh, { tint: '#d6b886', edge: '#7a5a2c', seed: 14, vib, wear: 1.0 }); ctx.restore();
        // loose brass rings in four bunches hanging inside the frame: they rattle after a stroke
        for (let g = 0; g < 4; g++) for (let k = 0; k < 7; k++) {
          const a = (g / 4) * TAU + PI / 4 + (k - 3) * 0.055, r = rh - 2 - (k % 2) * 8, jx = Math.sin(rt.anim * 80 + g * 2 + k) * shake * 4, jy = Math.cos(rt.anim * 70 + k) * shake * 3;
          const x = cx + Math.cos(a) * r + jx, y = cy + Math.sin(a) * r + jy;
          ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x + 1.5, y + 2.5, 13, 0, TAU); ctx.stroke();
          ctx.strokeStyle = '#e0b84a'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.stroke(); ctx.strokeStyle = 'rgba(255,248,200,0.7)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x - 1, y - 1, 13, 3.5, 5); ctx.stroke();
        }
        void mix; void rgba; void lighter; void vgrad; void hash; void ell; void circ; void studRing;
      } };
    },
  }); },
});
// daf strokes: a drum stroke with the loose rings answering after it
const DAFV = { 'daf-c': [{ dur: 0.55, drop: 1.2, glide: 0.06, modes: [[1, 1, 1], [1.6, 0.5, 0.8], [2.3, 0.3, 0.6]], shell: { f: 150, q: 4, gain: 0.5, dur: 0.18 }, click: { f: 1600, gain: 0.4 }, lp: 2600, gain: 0.7 }, 0.1],
  'daf-m': [{ dur: 0.3, drop: 1.12, glide: 0.04, modes: [[1, 1, 1], [1.6, 0.5, 0.7], [2.3, 0.3, 0.5]], click: { f: 2400, gain: 0.5 }, lp: 4500, gain: 0.55 }, 0.14],
  'daf-e': [{ dur: 0.1, drop: 1.08, modes: [[1, 1, 1], [2.2, 0.6, 0.6], [3.2, 0.4, 0.4]], click: { f: 4200, gain: 0.9, dur: 0.02 }, lp: 9000, gain: 0.48 }, 0.2],
  'daf-rim': [{ dur: 0.08, drop: 1.05, modes: [[1, 1, 1], [2.4, 0.5, 0.5]], click: { f: 3800, gain: 0.8, dur: 0.02 }, lp: 8000, gain: 0.34 }, 0.3] };
for (const [kind, [skin, ring]] of Object.entries(DAFV)) registerStrikeVoice(kind, (c) => { c.evoice(c.audio, 'skin', { ...skin, hz: c.hz, vel: c.vel }); c.evoice(c.audio, 'jingle', { n: 7, f: 3200, spread: 0.08, dur: 0.24, gain: ring, vel: c.vel, wet: 0.1 }); });
registerStrikeVoice('daf-sh', (c) => c.evoice(c.audio, 'jingle', { n: 12, f: 3000, spread: 0.16, dur: 0.3, gain: 0.2, vel: c.vel, wet: 0.12 }));

// ---- ghatam: a clay pot seen from the front -------------------------------------------------------------------------------------------------
const GHA = [['mouth', /mouth|gumki|open|palm.*mouth|close/], ['neck', /neck|rim|lip|nam/], ['sh', /shoulder|tha|finger|tip/], ['belly', /belly|thom|palm|body/], ['base', /base|foot|low|bottom|bass/]];
registerDrumStage({
  id: 'ghatam', match: /ghatam|ghada|gatham|clay.?pot|pot.?drum|matka|jahla/,
  build: (S, lanes, P) => { const zoneOf = []; const layer = staticLayer(); return createDrumStage('ghatam', S, lanes, P, {
    dress: () => ({ custom: (ctx, F, rt, S2, scene) => layer(ctx, { x: F.area.x, y: F.area.y, w: F.area.w, h: F.area.h }, (g) => southHall(g, F, rt, S2, scene)) }),
    voiceOf: (i) => `ghatam-${zoneOf[i] ?? 'belly'}`,
    build: (K) => {
      const ref = { w: 760, h: 820 }, keyOf = assignZones(K, GHA.map(([key, re]) => ({ key, re })));
      for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const cx = 0, my = 150, mrx = 120, mry = 34, by = {};
      by.mouth = eSpot(cx, my, mrx * 0.9, mry * 1.6, 0, { apk: 0.9 });
      by.neck = eRing(cx, my + 20, mrx * 1.5, mry * 3.2, 0, 0.7, 1.0, PI / 2);
      by.sh = eSector(cx, 470, 290, 250, 0, 0.55, 0.98, d2r(-160), d2r(-100));
      by.belly = eSpot(cx, 520, 170, 150, 0, { apk: 0.9 });
      by.base = eSector(cx, 470, 290, 250, 0, 0.62, 0.98, d2r(60), d2r(120));
      const spots = new Array(K.N).fill(null); for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
      return { ref, spots, wallU: 660, draw(ctx, rt) {
        const vib = fl(K, keyOf, rt, 'belly', 'sh', 'base', 'neck', 'mouth');
        const body = () => { ctx.beginPath(); ctx.moveTo(-124, 150); ctx.bezierCurveTo(-136, 230, -150, 250, -250, 330); ctx.bezierCurveTo(-330, 400, -310, 640, -170, 730); ctx.bezierCurveTo(-90, 780, 90, 780, 170, 730); ctx.bezierCurveTo(310, 640, 330, 400, 250, 330); ctx.bezierCurveTo(150, 250, 136, 230, 124, 150); ctx.closePath(); };
        dropShadow(ctx, body, 18, 22, 0.42);
        body(); ctx.fillStyle = hgrad(ctx, -310, 310, [[0, '#4a1c0c'], [0.2, '#b8542a'], [0.45, '#d8703c'], [0.75, '#a04420'], [1, '#3a1408']]); ctx.fill();
        ctx.save(); body(); ctx.clip();
        // burnished mica sparkle and fine throwing rings
        for (let k = 0; k < 24; k++) { ctx.strokeStyle = `rgba(60,20,6,${0.08 + 0.1 * hash(k)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 150 + k * 28, 330 - Math.abs(k - 12) * 4, 14, 0, 0, PI); ctx.stroke(); }
        for (let k = 0; k < 90; k++) { ctx.fillStyle = `rgba(255,226,170,${0.2 + 0.3 * hash(k + 3)})`; circ(ctx, (hash(k + 5) - 0.5) * 560, 220 + hash(k + 9) * 540, 1 + hash(k) * 1.6); ctx.fill(); }
        ctx.fillStyle = rgrad(ctx, -110, 400, 0, 330, [[0, 'rgba(255,230,190,0.32)'], [1, 'rgba(255,230,190,0)']]); ctx.fillRect(-340, 150, 680, 640);
        ctx.fillStyle = vgrad(ctx, 600, 780, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.4)']]); ctx.fillRect(-340, 600, 680, 200);
        // two painted bands of dots and a hand-drawn vine on the belly
        ctx.fillStyle = '#f2e6c8'; for (let k = 0; k < 16; k++) { const a = PI * (0.12 + 0.76 * k / 15); circ(ctx, Math.cos(a) * -280 * -1 * 0 + (k - 7.5) * 34, 400 + Math.sin((k / 15) * PI) * -26 + 40, 5); ctx.fill(); }
        ctx.strokeStyle = '#3a1408'; ctx.lineWidth = 4; ctx.beginPath(); for (let k = 0; k <= 40; k++) { const x = -200 + k * 10, y = 600 + Math.sin(k * 0.6) * 18; if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
        ctx.restore();
        ctx.strokeStyle = 'rgba(30,10,2,0.6)'; ctx.lineWidth = 3; body(); ctx.stroke();
        // the neck and the thick lip around the mouth
        const lip = () => { ctx.beginPath(); ctx.ellipse(cx, my, mrx + 26, mry + 14, 0, 0, TAU); };
        ctx.fillStyle = hgrad(ctx, -150, 150, [[0, '#6a2a12'], [0.4, '#d8703c'], [1, '#5a2410']]); lip(); ctx.fill(); ctx.strokeStyle = 'rgba(30,10,2,0.6)'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = rgrad(ctx, cx, my, 0, mrx, [[0, '#000'], [0.8, '#1a0a04'], [1, '#3a1a0a']]); ctx.beginPath(); ctx.ellipse(cx, my, mrx, mry, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,214,160,0.6)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(cx, my - 2, mrx + 20, mry + 10, 0, PI * 1.05, PI * 1.8); ctx.stroke();
        if (vib > 0.04) { ctx.strokeStyle = `rgba(255,236,200,${0.5 * vib})`; ctx.lineWidth = 3; for (let k = 0; k < 2; k++) { const p = clamp((1 - vib) * 1.3 - k * 0.2, 0, 1); ctx.beginPath(); ctx.ellipse(cx, 520, 90 + 200 * p, 80 + 170 * p, 0, 0, TAU); ctx.stroke(); } }
        void mix; void rgba; void lighter; void darker; void ell; void rrect; void studRing; void eRing;
      } };
    },
  }); },
});
defVoice('ghatam-mouth', 'skin', { dur: 0.32, drop: 1.0, rise: 0.8, glide: 0.08, modes: [[1, 1, 1], [2, 0.3, 0.6]], shell: { f: 140, q: 5, gain: 0.5, dur: 0.2 }, lp: 1100, gain: 0.7 });
defVoice('ghatam-belly', 'skin', { dur: 0.3, drop: 1.12, glide: 0.04, modes: [[1, 1, 1], [2.0, 0.55, 0.8], [3.0, 0.3, 0.6], [4.1, 0.18, 0.4]], click: { f: 2200, gain: 0.4 }, shell: { f: 330, q: 8, gain: 0.35, dur: 0.18 }, lp: 4000, gain: 0.55 });
defVoice('ghatam-sh', 'metal', { dur: 0.3, partials: [[1, 1, 1], [2.3, 0.6, 0.7], [4.1, 0.4, 0.45], [6.2, 0.2, 0.3]], gain: 0.36, strike: 0.7, wet: 0.14 });
defVoice('ghatam-neck', 'woodtok', { dur: 0.08, gain: 0.5, hollow: 2.4, overtone: 4.2 });
defVoice('ghatam-base', 'skin', { dur: 0.4, drop: 1.25, glide: 0.07, modes: [[1, 1, 1], [1.6, 0.35, 0.6]], shell: { f: 120, q: 4, gain: 0.5, dur: 0.22 }, lp: 1300, gain: 0.7 });

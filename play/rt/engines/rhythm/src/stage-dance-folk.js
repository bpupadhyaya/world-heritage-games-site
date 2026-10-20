// Folk dance stages added in 1.13.0 (own stages for two dances that used to share the generic floor and body scenes):
//   hopak (Ukrainian Cossack dance): a line of dancers in wide trousers and caps, each in their own colours; the whole line answers a cue with a visible
//       pose (step, kick, clap); the lead swings a white sleeve. The pads (Left, Right, Kick, Clap) lie on an embroidered runner below the line.
//   gumboot (South Africa): a miner in a boiler suit and white rubber boots, front view, small enough to see the boots lifted and slapped; the rings stand in
//       columns beside him with a guide to the part each one answers; the backdrop is a mine yard (corrugated wall, work lamps).
// Sound and lane ids are the same as before (no voiceOf: the voice comes from the lane's timbre, as on the generic floor and body scenes).
import { registerDanceStage } from './registry.js';
import { createSceneStage, eSpot, assignZones, dancerTop, dancePose, smoothAngle, headwear, groundShadow } from './dance-kit.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, circ, ell, hash, TAU } from './dance-kit.js';
import { kerchief, stepIcon, glow } from './art.js';
import { minerFigure } from './figures-front.js';

const ss = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

// a lacquered floor pad with its step icon (the lane's own colour), a ring when struck
function pad(ctx, l, sp, f, ic) {
  const c = l.color, s = sp.r * (1 + 0.1 * f);
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, sp.v + 4, sp.u + 8, s); ctx.fill();
  ctx.fillStyle = rgrad(ctx, sp.v, sp.u, s * 0.1, s * 1.05, [[0, mix('#2a2018', c, 0.25 + 0.4 * f)], [0.7, mix('#14100a', c, 0.18 + 0.35 * f)], [1, mix('#0a0806', c, 0.4)]], sp.v - s * 0.3, sp.u - s * 0.35); circ(ctx, sp.v, sp.u, s); ctx.fill();
  ctx.strokeStyle = rgba(lighter(c, 0.35 + 0.4 * f), 0.98); ctx.lineWidth = 5; circ(ctx, sp.v, sp.u, s - 2); ctx.stroke();
  ctx.strokeStyle = rgba(c, 0.35); ctx.lineWidth = 2; circ(ctx, sp.v, sp.u, s * 0.82); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.14)'; ell(ctx, sp.v - s * 0.2, sp.u - s * 0.45, s * 0.55, s * 0.2); ctx.fill();
  if (f > 0.03) glow(ctx, sp.v, sp.u, s * 2.1, c, 0.5 * f);
  stepIcon(ctx, ic ?? 'stomp', sp.v + 2, sp.u + 3, s * 0.5, 'rgba(0,0,0,0.5)', 0);
  stepIcon(ctx, ic ?? 'stomp', sp.v, sp.u - 2, s * 0.5, lighter(c, 0.8), f);
}
const laneIcon = (l) => l.icon || (/left|izq|\bl\b/i.test(l.name) ? 'foot-l' : /right|der|\br\b/i.test(l.name) ? 'foot-r' : /clap|palm/i.test(l.name) ? 'clap' : /thigh|knee|slap|boot|escob/i.test(l.name) ? 'slap' : 'stomp');

// ---- hopak ---------------------------------------------------------------------------------------------------------------------------------------
const HOP_ZONES = [['clap', /clap|palm/], ['left', /left|izq/], ['right', /right|der/], ['kick', /kick|stomp|squat|jump|stamp|leap/]];
const COS = [
  { shirt: '#f6f0e0', bottom: '#b8322a', cap: '#1c1c22', band: '#c0392b', hair: '#2a1a12', skin: '#e8b890', vest: '#2a58b8' },
  { shirt: '#f2ecd8', bottom: '#1f3f8a', cap: '#b8322a', band: '#1c1c22', hair: '#c8903a', skin: '#f0c8a0', vest: '#8a2a2a' },
  { shirt: '#f8f2e4', bottom: '#2a2a32', cap: '#2a58b8', band: '#e8b84a', hair: '#1a1210', skin: '#d49a6c', vest: '#d8b040' },
  { shirt: '#f4eede', bottom: '#b8322a', cap: '#f2efe6', band: '#2a58b8', hair: '#6a4a2a', skin: '#e0b080', vest: '#2a7a4a' },
  { shirt: '#f6f0e0', bottom: '#2a6a3a', cap: '#8a1f2a', band: '#e8b84a', hair: '#3a281c', skin: '#c88a5a', vest: '#c0392b' },
  { shirt: '#f2ecd8', bottom: '#8a2a2a', cap: '#1c1c22', band: '#f2efe6', hair: '#a8782a', skin: '#e8b890', vest: '#2a58b8' },
  { shirt: '#f8f2e4', bottom: '#1f3f8a', cap: '#c0392b', band: '#1c1c22', hair: '#1a1210', skin: '#d9a37a', vest: '#e8b84a' },
];

// an embroidered runner (rushnyk): white linen, a red and black cross-stitch border, a row of diamonds, fringe at the ends
function runner(ctx, x0, y0, x1, y1) {
  const w = x1 - x0, h = y1 - y0;
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, x0 + 9, y0 + 13, w, h, 14); ctx.fill();
  ctx.save(); rrect(ctx, x0, y0, w, h, 14); ctx.clip();
  ctx.fillStyle = vgrad(ctx, y0, y1, [[0, '#f4ecd8'], [1, '#d8cdb0']]); ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = 'rgba(120,100,70,0.12)'; ctx.lineWidth = 1; for (let k = 0; k < h; k += 5) { ctx.beginPath(); ctx.moveTo(x0, y0 + k); ctx.lineTo(x1, y0 + k); ctx.stroke(); }
  for (const [ins, col, lw] of [[10, '#a8201c', 8], [26, '#1c1c22', 4]]) { ctx.strokeStyle = col; ctx.lineWidth = lw; rrect(ctx, x0 + ins, y0 + ins, w - 2 * ins, h - 2 * ins, 8); ctx.stroke(); }
  for (let k = 0; k < Math.floor(w / 34); k++) for (const yy of [y0 + 44, y1 - 44]) { const x = x0 + 24 + k * 34; ctx.fillStyle = k % 2 ? '#a8201c' : '#1c1c22'; ctx.beginPath(); ctx.moveTo(x, yy - 9); ctx.lineTo(x + 9, yy); ctx.lineTo(x, yy + 9); ctx.lineTo(x - 9, yy); ctx.closePath(); ctx.fill(); }
  for (let k = 0; k < Math.floor(h / 34); k++) for (const xx of [x0 + 44, x1 - 44]) { const y = y0 + 24 + k * 34; ctx.fillStyle = k % 2 ? '#a8201c' : '#1c1c22'; ctx.beginPath(); ctx.moveTo(xx, y - 9); ctx.lineTo(xx + 9, y); ctx.lineTo(xx, y + 9); ctx.lineTo(xx - 9, y); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(244,236,216,0.9)'; ctx.lineWidth = 2; for (let q = x0 + 8; q < x1 - 6; q += 9) { ctx.beginPath(); ctx.moveTo(q, y1); ctx.lineTo(q + 1, y1 + 12); ctx.stroke(); ctx.beginPath(); ctx.moveTo(q, y0); ctx.lineTo(q + 1, y0 - 12); ctx.stroke(); }
}

// a village yard behind the line: a wattle fence, a row of sunflowers, a clay pot and straw on the trodden earth
function yard(ctx, ref, t, tall) {
  const W = ref.w, fh = tall ? 130 : 96;
  ctx.save(); ctx.beginPath(); ctx.rect(-W / 2, 0, W, ref.h); ctx.clip();
  ctx.fillStyle = vgrad(ctx, 0, fh + 16, [[0, '#2a2418'], [1, '#4a3a24']]); ctx.fillRect(-W / 2, 0, W, fh + 16);
  for (let x = -W / 2 + 10; x < W / 2; x += 26) { ctx.fillStyle = hgrad(ctx, x, x + 14, [[0, '#6a4a28'], [0.4, '#a87a44'], [1, '#4a3018']]); rrect(ctx, x, 6, 14, fh, 5); ctx.fill(); }
  for (const y of [fh * 0.3, fh * 0.62]) { ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 9; ctx.beginPath(); for (let x = -W / 2; x <= W / 2; x += 20) ctx.lineTo(x, y + Math.sin(x * 0.07) * 4 + 3); ctx.stroke(); ctx.strokeStyle = '#c8a064'; ctx.lineWidth = 6; ctx.beginPath(); for (let x = -W / 2; x <= W / 2; x += 20) ctx.lineTo(x, y + Math.sin(x * 0.07) * 4); ctx.stroke(); }
  const n = Math.floor(W / 130);
  for (let k = 0; k < n; k++) { const x = -W / 2 + 70 + k * 130 + (k % 2) * 14, y = fh - 4 + (k % 3) * 4, r = 30 + (k % 3) * 4, sw = Math.sin(t * 1.4 + k) * 3;
    ctx.strokeStyle = '#3a6a2a'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x, y + 30); ctx.quadraticCurveTo(x + sw, y + 10, x + sw, y - r * 0.2); ctx.stroke();
    for (let q = 0; q < 14; q++) { const a = q / 14 * TAU; ctx.fillStyle = q % 2 ? '#f2b41c' : '#e89a10'; ctx.beginPath(); ctx.ellipse(x + sw + Math.cos(a) * r * 0.82, y - r * 0.2 + Math.sin(a) * r * 0.82, r * 0.34, r * 0.16, a, 0, TAU); ctx.fill(); }
    ctx.fillStyle = rgrad(ctx, x + sw - 4, y - r * 0.2 - 4, 2, r * 0.6, [[0, '#6a4220'], [1, '#2a1608']]); circ(ctx, x + sw, y - r * 0.2, r * 0.52); ctx.fill(); }
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-W / 2, fh + 14, W, 6);
  for (let k = 0; k < 80; k++) { const x = -W / 2 + hash(k * 2.7) * W, y = fh + 28 + hash(k * 5.1 + 3) * (ref.h - fh - 28), a = hash(k + 1) * TAU; ctx.strokeStyle = `rgba(232,200,120,${0.25 + 0.3 * hash(k + 6)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 18, y + Math.sin(a) * 6); ctx.stroke(); }
  ctx.restore();
}

registerDanceStage({
  id: 'hopak', match: /hopak|gopak|trepak|cossack/,
  build: (S, lanes, P) => createSceneStage('hopak', S, lanes, P, {
    dress: () => ({ kind: 'earth', base: '#8a6a3a', light: '#fff0c8' }),
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 960 } : { w: 1180, h: 600 };
      const keyOf = assignZones(K, HOP_ZONES.map(([key, re]) => ({ key, re }))); const spots = new Array(K.N).fill(null);
      const PR = tall ? 82 : 80;
      const by = tall ? { clap: [0, 548], left: [-175, 676], right: [175, 676], kick: [0, 812] } : { left: [-345, 470], right: [-115, 470], kick: [115, 470], clap: [345, 470] };
      for (let i = 0; i < K.N; i++) { const p = by[keyOf[i]]; if (p) spots[i] = eSpot(p[0], p[1], PR, PR, 0, { apk: 1, extra: { noFill: true } }); }
      const ND = tall ? 5 : 7, sd = tall ? 150 : 124, span = tall ? 560 : 900, y0 = tall ? 255 : 178;
      const sm = []; for (let j = 0; j < ND; j++) sm.push({});
      return { ref, spots,
        draw(ctx, rt) {
          const t = rt.anim;
          // strongest recent cue and which kind it was
          let f = 0, kd = null, li = -1; for (let i = 0; i < K.N; i++) if (rt.flash[i] > f) { f = rt.flash[i]; li = i; kd = keyOf[i]; }
          const fa = f > 0.04 ? f : 0, kind = !fa ? 'idle' : kd === 'clap' ? 'clap' : kd === 'kick' ? 'kick' : 'step';
          const beat = rt.spb > 0 ? Math.floor(rt.clock / rt.spb) : 0;
          // the embroidered runner under the pads, and a lamp pool on the boards
          yard(ctx, ref, t, tall);
          if (tall) runner(ctx, -275, 468, 275, 906); else runner(ctx, -470, 360, 470, 586);
          const xs = Array.from({ length: ND }, (_, k) => -span / 2 + (k / (ND - 1)) * span);
          // arms of neighbours link across the line
          xs.forEach((x, k) => { groundShadow(ctx, x + 8, y0 + 18, sd * 0.78, sd * 0.55, 0.26); });
          const lead = ND - 1;
          xs.forEach((x, k) => {
            const c = COS[(k * 3 + 1) % COS.length], sg = (k + (kind === 'kick' ? beat : 0)) % 2 ? -1 : 1, face = Math.PI / 2;   // facing down the screen (towards the pads)
            const sc = 1 + (kind === 'hop' ? 0.06 * fa : 0), ph = t * 1.2 + k * 0.45;
            const ff = kind === 'idle' ? 0 : clamp(fa * (0.85 + 0.15 * Math.sin(k * 2.1)), 0, 1);
            const pose = dancePose(kind, ff, { x, y: y0, s: sd * sc, face, sg: kind === 'kick' && k % 2 ? -sg : sg, ph });
            const hl = k === lead ? [x + sd * 0.42, y0 - sd * 0.52 - fa * 18] : pose.handL;
            dancerTop(ctx, x, y0 + (k % 2) * 6, sd * sc, { face, shirt: c.shirt, vest: c.vest, bottom: c.bottom, skirt: true, skirtR: 0.5, trim: '#d8b45a', hat: 'hair', hair: c.hair, skin: c.skin, shoe: '#1a0e08', step: 0, bob: 0.2 + ff * 0.6, handL: hl, handR: pose.handR, feet: pose.feet, twist: pose.twist });
            headwear(ctx, 'cap', x, y0 + (k % 2) * 6, sd * sc, c.cap, c.band, 0.2 + ff * 0.6);
            if (k === lead) kerchief(ctx, hl[0], hl[1], sd * 0.62, '#f4f2ec', t * 1.6 + fa * 2.4, -2.55 + 0.3 * Math.sin(t * 3));
          });
          void li; void ss; void smoothAngle; void hash; void darker; void hgrad; void TAU;
          // the pads, lacquered, with their step icons
          lanes.forEach((l, i) => { if (spots[i]) pad(ctx, l, spots[i], rt.flash[i], laneIcon(l)); });
        } };
    },
  }),
});

// ---- gumboot -------------------------------------------------------------------------------------------------------------------------------------
const GB_ZONES = [['stomp', /stomp|heel|ground|foot/], ['lb', /left/], ['rb', /right/], ['clap', /clap|hand|palm/], ['thigh', /thigh|knee|slap/]];
function mineYard(ctx, ref, t, tall) {
  const W = ref.w, H = ref.h, hz = tall ? 400 : 250;
  ctx.save(); ctx.beginPath(); ctx.rect(-W / 2, 0, W, H); ctx.clip();
  // the back wall: dark corrugated iron with a lit streak, rivet rows, and posts
  ctx.fillStyle = vgrad(ctx, 0, hz, [[0, '#1c2028'], [1, '#343a44']]); ctx.fillRect(-W / 2, 0, W, hz);
  for (let x = -W / 2; x < W / 2; x += 22) { ctx.fillStyle = hgrad(ctx, x, x + 22, [[0, 'rgba(255,255,255,0.1)'], [0.5, 'rgba(0,0,0,0.0)'], [1, 'rgba(0,0,0,0.3)']]); ctx.fillRect(x, 0, 22, hz); }
  ctx.fillStyle = 'rgba(20,24,30,0.9)'; for (const px of [-W / 2 + 40, W / 2 - 40]) ctx.fillRect(px - 14, 0, 28, hz + 40);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-W / 2, hz * 0.45); ctx.lineTo(W / 2, hz * 0.45); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-W / 2, hz * 0.45 - 4); ctx.lineTo(W / 2, hz * 0.45 - 4); ctx.stroke();
  // a string of work lamps (warm bulbs that glow and sway very slightly)
  ctx.strokeStyle = '#0c0c10'; ctx.lineWidth = 3; ctx.beginPath(); for (let k = 0; k <= 30; k++) { const x = -W / 2 + k / 30 * W, y = 40 + Math.sin(k / 30 * Math.PI) * 38; if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
  const nb = tall ? 6 : 9;
  for (let k = 0; k < nb; k++) { const u = (k + 0.5) / nb, x = -W / 2 + u * W, y = 40 + Math.sin(u * Math.PI) * 38 + 8, fl = 0.85 + 0.15 * Math.sin(t * 7 + k * 2.3); glow(ctx, x, y + 8, 80, '#ffd27a', 0.38 * fl); ctx.fillStyle = '#ffe9a8'; circ(ctx, x, y + 8, 7); ctx.fill(); ctx.fillStyle = '#4a4a52'; rrect(ctx, x - 6, y - 8, 12, 9, 3); ctx.fill(); }
  // stacked barrels and a wheelbarrow silhouette at the sides
  for (const [bx, by, sc] of [[-W / 2 + 90, hz - 6, 1], [-W / 2 + 160, hz + 6, 0.8], [W / 2 - 100, hz - 2, 1]]) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ell(ctx, bx + 6, by + 6, 52 * sc, 12 * sc); ctx.fill(); ctx.fillStyle = hgrad(ctx, bx - 40 * sc, bx + 40 * sc, [[0, '#4a3020'], [0.35, '#8a5a34'], [1, '#3a2418']]); rrect(ctx, bx - 40 * sc, by - 78 * sc, 80 * sc, 80 * sc, 12 * sc); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 3; for (const yy of [by - 60 * sc, by - 14 * sc]) { ctx.beginPath(); ctx.moveTo(bx - 40 * sc, yy); ctx.lineTo(bx + 40 * sc, yy); ctx.stroke(); } }
  // the ground: packed earth with stones, a wet sheen and a pool of light under the dancer
  ctx.fillStyle = vgrad(ctx, hz, H, [[0, '#4a4036'], [1, '#2a241e']]); ctx.fillRect(-W / 2, hz, W, H - hz);
  for (let k = 0; k < 60; k++) { const x = -W / 2 + hash(k * 3.1) * W, y = hz + 14 + hash(k * 5.3 + 2) * (H - hz - 14), r = 3 + hash(k) * 7; ctx.fillStyle = `rgba(${150 + 60 * hash(k + 4)},${130 + 40 * hash(k + 8)},${100 + 30 * hash(k + 1)},0.22)`; ell(ctx, x, y, r * 1.6, r); ctx.fill(); }
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-W / 2, hz, W, 5);
  ctx.fillStyle = rgrad(ctx, 0, hz + 160, 10, W * 0.5, [[0, 'rgba(255,214,140,0.3)'], [1, 'rgba(255,214,140,0)']]); ctx.fillRect(-W / 2, hz, W, H - hz);
  ctx.restore();
}

registerDanceStage({
  id: 'gumboot', match: /gumboot|gum.?boot|isicathulo|wellington.?dance/,
  build: (S, lanes, P) => createSceneStage('gumboot', S, lanes, P, {
    dress: () => ({ kind: 'stone', base: '#4a4844', accent: '#6a665e', size: 130, light: '#ffe6b8' }),
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 960 } : { w: 1180, h: 600 }, k = tall ? 0.8 : 0.74, fy = tall ? 70 : 20;
      const keyOf = assignZones(K, GB_ZONES.map(([key, re]) => ({ key, re }))); const spots = new Array(K.N).fill(null);
      const RR = tall ? 70 : 62;
      // authored figure points (x, y) -> design (x*k, fy + y*k); rings in columns beside the figure, the stomp ring on the ground below
      const by = tall ? { clap: [-300, 250], thigh: [300, 250], lb: [-300, 560], rb: [300, 560], stomp: [0, 850] } : { clap: [-440, 150], stomp: [-440, 310], lb: [-440, 470], thigh: [440, 150], rb: [440, 470] };
      for (let i = 0; i < K.N; i++) { const p = by[keyOf[i]]; if (p) spots[i] = eSpot(p[0], p[1], RR, RR, 0, { apk: 1, extra: { noFill: true } }); }
      const aim = { clap: [0, 400], thigh: [118, 330], lb: [-125, 600], rb: [125, 600], stomp: [0, 745] };
      return { ref, spots,
        draw(ctx, rt) {
          const t = rt.anim, fl = (key) => { let m = 0; for (let i = 0; i < K.N; i++) if (keyOf[i] === key) m = Math.max(m, rt.flash[i]); return m; };
          mineYard(ctx, ref, t, tall);
          const slapL = fl('lb'), slapR = fl('rb'), thigh = fl('thigh'), clap = fl('clap'), stomp = fl('stomp');
          // a little idle bounce so the miner is alive between cues
          const idle = 0.5 + 0.5 * Math.sin(t * 6);
          ctx.save(); ctx.translate(0, fy); ctx.scale(k, k);
          minerFigure(ctx, { slapL, slapR, thigh, clap, stomp: Math.max(stomp, 0.06 * idle), t });
          ctx.restore();
          // guides from each ring to the part it answers
          for (let i = 0; i < K.N; i++) { const key = keyOf[i], a = by[key], b = aim[key]; if (!a || !b) continue; const bx = b[0] * k, bY = fy + b[1] * k, f = rt.flash[i], dx = bx - a[0], dy = bY - a[1], d = Math.hypot(dx, dy) || 1;
            ctx.strokeStyle = `rgba(255,236,190,${0.2 + 0.55 * f})`; ctx.lineWidth = 2.5; ctx.setLineDash([7, 9]); ctx.beginPath(); ctx.moveTo(a[0] + dx / d * RR, a[1] + dy / d * RR); ctx.lineTo(bx, bY); ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = rgba(lanes[i].color, 0.9); circ(ctx, bx, bY, 6); ctx.fill(); }
          lanes.forEach((l, i) => { if (spots[i]) pad(ctx, l, spots[i], rt.flash[i], laneIcon(l)); });
        } };
    },
  }),
});

// Zither stages (1.10.0): kankles (Baltic trapezoid zither), kantele (Finnish plucked zither), guzheng and gayageum (long board zithers
// with movable bridges), mountain dulcimer (fretted lap zither). Premium 2D vector: lit wood, carved details, pins, bridges, strings that
// ring. No performer is drawn: the plucking is shown by the fingertip glyph the other string stages use.
import { clamp, mix, rgba, lighter, darker, rrect, circ, ell, hgrad, vgrad, rgrad, hash, TAU } from './instr-art.js';
import { wood, shadow, pin, peg, bridgeBar, rosette, inlay, studs, tassel, wrap, woodGrad } from './instr-art.js';
import { registerStringStage } from './registry.js';
import { createBoardStage, STR_COL, stagger } from './board-kit.js';
import { lerp } from './stagekit.js';

const rank = (K) => K.noteIdx.slice().sort((a, b) => K.lanes[a].hz - K.lanes[b].hz);
// ---- kankles --------------------------------------------------------------------------------------------------------------
registerStringStage({
  id: 'kankles', match: /kankl|baltic.?zither|kokl[eė]|gusli/,
  build: (S, lanes, P) => createBoardStage('kankles', S, lanes, P, {
    material: 'steel',
    voiceOf: () => 'zither-bright',
    layout(F, K) {
      const { W, H } = F, topU = H * 0.065, botU = H * 0.955;
      const wt = Math.min(W * 0.44, H * 0.3), wb = Math.min(W * 0.9, H * 0.56);
      const n = Math.max(1, K.noteIdx.length);
      const G = { W, H, topU, botU, wt, wb, n, penU: topU + 26, bridgeU: botU - 78, pinU: botU - 46 };
      const strings = new Array(K.N).fill(null);
      const order = rank(K);
      const vm = order.map((_, r) => lerp(lerp(-wt * 0.38, wt * 0.38, n > 1 ? r / (n - 1) : 0.5), lerp(-wb * 0.41, wb * 0.41, n > 1 ? r / (n - 1) : 0.5), 0.6));
      const rw = stagger(vm, 56, 4), rows = Math.max(...rw) + 1;
      order.forEach((i, r) => {
        const f = n > 1 ? r / (n - 1) : 0.5, v0 = lerp(-wt * 0.38, wt * 0.38, f), v1 = lerp(-wb * 0.41, wb * 0.41, f);
        const t = 0.6 + (rw[r] - (rows - 1) / 2) * 0.085;
        strings[i] = { v0, u0: G.penU, v1, u1: G.bridgeU, sv: lerp(v0, v1, t), su: lerp(G.penU, G.bridgeU, t), r: 24 };
      });
      G.pins = order.map((i) => strings[i]);
      G.half = (u) => lerp(wt, wb, (u - topU) / (botU - topU)) / 2;
      return { G, strings, top: G.penU };
    },
    back(ctx, G) {
      const { topU, botU, wt, wb } = G;
      const half = (u, inset = 0) => G.half(u) - inset + (u > topU ? Math.sin(((u - topU) / (botU - topU)) * Math.PI) * 6 : 0);
      const outline = (inset = 0) => () => {
        const t = topU + inset, b = botU - inset, r = 26;
        ctx.beginPath(); ctx.moveTo(-half(t, inset), t + 10);
        ctx.quadraticCurveTo(-half(t, inset) + 6, t - 14, 0, t - 18);
        ctx.quadraticCurveTo(half(t, inset) - 6, t - 14, half(t, inset), t + 10);
        const m = (t + b) / 2;
        ctx.quadraticCurveTo(half(m, inset) + 4, m - 40, half(b, inset), b - r);
        ctx.quadraticCurveTo(half(b, inset), b, half(b, inset) - r, b);
        ctx.lineTo(-half(b, inset) + r, b);
        ctx.quadraticCurveTo(-half(b, inset), b, -half(b, inset), b - r);
        ctx.quadraticCurveTo(-half(m, inset) - 4, m - 40, -half(t, inset), t + 10); ctx.closePath();
      };
      const bb = { x0: -wb / 2, y0: topU - 18, x1: wb / 2, y1: botU };
      shadow(ctx, outline(0), 8, 12, 0.4);
      wood(ctx, outline(0), bb, '#5b3319', { seed: 21, n: 16, bevel: 'rgba(255,214,150,0.4)' });
      // the spruce top plate inside the frame, lit from the left
      const plate = outline(17);
      wood(ctx, plate, { x0: bb.x0 + 17, y0: bb.y0 + 17, x1: bb.x1 - 17, y1: bb.y1 - 17 }, '#d3a05c', { seed: 4, n: 22, bevel: 'rgba(255,236,190,0.3)', edge: '#6a4420', shade: 0.28, grainA: 0.4, hl: 0.12 });
      ctx.save(); plate(); ctx.clip();
      // carved sound holes: a cluster of three rosettes
      const rr = wb * 0.036, cu = topU + (botU - topU) * 0.4;
      for (const [dv, du, k] of [[0, -0.07, 1.0], [-0.1, 0.07, 0.82], [0.1, 0.07, 0.82]]) rosette(ctx, wb * dv * 0.8, cu + du * (botU - topU) * 1.0, rr * k, { ring: '#7a4a1e', mid: '#e9cf96', spokes: 12, cut: 'rgba(110,64,26,0.9)' });
      // scalloped carving along the lower edge
      ctx.strokeStyle = 'rgba(92,52,22,0.75)'; ctx.lineWidth = 2.4;
      for (let k = 0; k < 17; k++) { const x = lerp(-wb * 0.42, wb * 0.42, k / 16); ctx.beginPath(); ctx.arc(x, botU - 36, wb * 0.024, 0, Math.PI); ctx.stroke(); }
      // long zigzag inlay down both sides
      for (const s of [-1, 1]) { ctx.strokeStyle = 'rgba(96,56,24,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); for (let k = 0; k <= 26; k++) { const u = lerp(topU + 60, botU - 90, k / 26); const x = s * (half(u, 30)) + (k % 2 ? 5 : -5) * -s; if (k === 0) ctx.moveTo(x, u); else ctx.lineTo(x, u); } ctx.stroke(); }
      ctx.restore();
      inlay(ctx, outline(14), '#f1dca6', 2.2, null, 0.9);
      // the peg bar across the narrow end: dark, with an iron peg for every string, and a hitch rail at the wide end
      const pb = () => rrect(ctx, -wt * 0.5 + 4, G.penU - 17, wt - 8, 30, 8);
      ctx.save(); ctx.translate(4, 6); pb(); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill(); ctx.restore();
      wood(ctx, pb, { x0: -wt / 2, y0: G.penU - 17, x1: wt / 2, y1: G.penU + 13 }, '#2c180a', { seed: 8, n: 6, vert: false, bevel: 'rgba(255,214,150,0.5)' });
      for (const s of G.pins) pin(ctx, s.v0, G.penU - 2, 6.4, '#cfd2da');
      const hr = () => rrect(ctx, -wb * 0.44, G.pinU - 8, wb * 0.88, 16, 6);
      ctx.save(); ctx.translate(3, 5); hr(); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill(); ctx.restore();
      wood(ctx, hr, { x0: -wb * 0.44, y0: G.pinU - 8, x1: wb * 0.44, y1: G.pinU + 8 }, '#3a200e', { seed: 9, vert: false, n: 4 });
      for (const s of G.pins) pin(ctx, s.v1, G.pinU, 4.2, '#d9b46a');
      // bridge bar
      const bu = G.bridgeU;
      bridgeBar(ctx, 0, bu, wb * 0.86, 12, '#d8bd80');
    },
  }),
});

// ---- kantele --------------------------------------------------------------------------------------------------------------
registerStringStage({
  id: 'kantele', match: /kantele|kannel/,
  build: (S, lanes, P) => createBoardStage('kantele', S, lanes, P, {
    material: 'steel',
    voiceOf: () => 'zither-bright',
    layout(F, K) {
      const { W, H } = F, topU = H * 0.075, botU = H * 0.95, a = Math.min(W * 0.92, H * 0.5);
      const G = { W, H, topU, botU, a, barU: topU + 36, hitchU: botU - 54 };
      const order = rank(K), n = order.length, strings = new Array(K.N).fill(null);
      // the strings run from the tuning bar on the narrow head down to the hitch bar, a little left of centre
      G.barV0 = -a * 0.30; G.barV1 = a * 0.16; G.hitV0 = -a * 0.44; G.hitV1 = a * 0.34;
      const vm = order.map((_, r) => lerp(lerp(G.barV0, G.barV1, n > 1 ? r / (n - 1) : 0.5), lerp(G.hitV0, G.hitV1, n > 1 ? r / (n - 1) : 0.5), 0.62));
      const rw = stagger(vm, 56, 4), rows = Math.max(...rw) + 1;
      order.forEach((i, r) => {
        const f = n > 1 ? r / (n - 1) : 0.5, v0 = lerp(G.barV0, G.barV1, f), v1 = lerp(G.hitV0, G.hitV1, f);
        const t = 0.62 + (rw[r] - (rows - 1) / 2) * 0.1;
        strings[i] = { v0, u0: G.barU, v1, u1: G.hitchU, sv: lerp(v0, v1, t), su: lerp(G.barU, G.hitchU, t), r: 25 };
      });
      G.order = order.map((i) => strings[i]);
      return { G, strings, top: G.barU };
    },
    back(ctx, G) {
      const { topU, botU, a } = G;
      const outline = (inset = 0) => () => {
        const t = topU + inset, b = botU - inset, i2 = inset;
        ctx.beginPath(); ctx.moveTo(-a * 0.36 + i2, t + 58);
        ctx.bezierCurveTo(-a * 0.40 + i2, t + 14, -a * 0.22, t - 6 + i2, a * 0.02, t - 4 + i2);       // narrow rounded head
        ctx.bezierCurveTo(a * 0.2, t - 2 + i2, a * 0.3 - i2, t + 14, a * 0.31 - i2, t + 54);
        ctx.bezierCurveTo(a * 0.34 - i2, t + (b - t) * 0.34, a * 0.5 - i2, t + (b - t) * 0.52, a * 0.5 - i2, t + (b - t) * 0.74);   // the right side swells
        ctx.bezierCurveTo(a * 0.5 - i2, b - 18, a * 0.42 - i2, b - i2 * 0.2, a * 0.22, b);
        ctx.lineTo(-a * 0.32, b);
        ctx.bezierCurveTo(-a * 0.5 + i2, b - 4, -a * 0.56 + i2, b - 60, -a * 0.52 + i2, t + (b - t) * 0.66);   // the left side bows out low
        ctx.bezierCurveTo(-a * 0.48 + i2, t + (b - t) * 0.46, -a * 0.34 + i2, t + (b - t) * 0.22, -a * 0.36 + i2, t + 58);
        ctx.closePath();
      };
      const bb = { x0: -a * 0.56, y0: topU - 6, x1: a * 0.5, y1: botU };
      shadow(ctx, outline(0), 8, 12, 0.4);
      wood(ctx, outline(0), bb, '#b0521f', { seed: 31, n: 14, bevel: 'rgba(255,200,140,0.45)' });   // stained rim
      wood(ctx, outline(15), { x0: bb.x0 + 15, y0: bb.y0 + 15, x1: bb.x1 - 15, y1: bb.y1 - 15 }, '#d9aa62', { seed: 14, n: 24, bevel: 'rgba(255,236,190,0.3)', edge: '#6a4420', shade: 0.28, grainA: 0.4, hl: 0.12 });
      inlay(ctx, outline(11), '#fff1c8', 2, null, 0.8);
      // one large carved sound hole with a deep ring, set low on the plate
      const hu = topU + (botU - topU) * 0.6, hv = -a * 0.02, hr = a * 0.075;
      ctx.fillStyle = 'rgba(70,36,12,0.5)'; ell(ctx, hv + 4, hu + 6, hr * 1.18, hr * 1.4); ctx.fill();
      ctx.fillStyle = rgrad(ctx, hv, hu, 0, hr * 1.4, [[0, '#000'], [0.7, '#150a04'], [1, '#2a180a']]); ell(ctx, hv, hu, hr, hr * 1.22); ctx.fill();
      ctx.strokeStyle = '#f3e0b0'; ctx.lineWidth = 5; ell(ctx, hv, hu, hr * 1.08, hr * 1.3); ctx.stroke();
      ctx.strokeStyle = 'rgba(120,70,30,0.8)'; ctx.lineWidth = 2; ell(ctx, hv, hu, hr * 1.32, hr * 1.58); ctx.stroke();
      for (let k = 0; k < 14; k++) { const an = (k / 14) * TAU; ctx.beginPath(); ctx.moveTo(hv + Math.cos(an) * hr * 1.4, hu + Math.sin(an) * hr * 1.7); ctx.lineTo(hv + Math.cos(an) * hr * 1.7, hu + Math.sin(an) * hr * 2.1); ctx.stroke(); }
      // tuning bar across the head: a dark rail with one iron pin per string; a steel hitch bar at the foot
      const tb = () => rrect(ctx, G.barV0 - 26, G.barU - 15, G.barV1 - G.barV0 + 52, 26, 8);
      ctx.save(); ctx.translate(3, 6); tb(); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill(); ctx.restore();
      wood(ctx, tb, { x0: G.barV0 - 26, y0: G.barU - 15, x1: G.barV1 + 26, y1: G.barU + 11 }, '#34190a', { seed: 5, vert: false, n: 4 });
      for (const s of G.order) pin(ctx, s.v0, G.barU - 2, 6.2, '#cfd2da');
      const hb = () => rrect(ctx, G.hitV0 - 22, G.hitchU - 7, G.hitV1 - G.hitV0 + 44, 14, 5);
      ctx.save(); ctx.translate(3, 5); hb(); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill(); ctx.restore();
      ctx.fillStyle = hgrad(ctx, G.hitV0, G.hitV1, [[0, '#8a8e98'], [0.3, '#e9ebf0'], [0.7, '#a9adb7'], [1, '#6c707a']]); hb(); ctx.fill();
      for (const s of G.order) { ctx.fillStyle = '#d9b46a'; circ(ctx, s.v1, G.hitchU, 3.6); ctx.fill(); }
      // a thin wooden saddle the strings lift over, near the hitch bar
      bridgeBar(ctx, (G.hitV0 + G.hitV1) / 2, G.hitchU - 34, G.hitV1 - G.hitV0 + 30, 9, '#d9bf84', -0.02);
    },
  }),
});

// ---- guzheng and gayageum ---------------------------------------------------------------------------------------------------
const BOARDS = {
  guzheng: { ns: 21, wood: '#d6a864', rail: '#4a1f12', railHi: '#8a4326', mat: 'steel', pins: 'steel', bridge: 'goose', tail: 'plate', voice: 'zither-guzheng', line: [0.78, 0.28] },
  gayageum: { ns: 12, wood: '#e2c58c', rail: '#2a2a2e', railHi: '#58585f', mat: 'silk', pins: 'cord', bridge: 'arch', tail: 'horn', voice: 'zither-silk', line: [0.7, 0.34] },
};
for (const [id, def0] of Object.entries(BOARDS)) {
  registerStringStage({
    id, match: id === 'guzheng' ? /guzheng|gu.?zheng|koto|zheng\b|chinese zither/ : /gayageum|kayagum|gayagum|korean zither|12.?string zither/,
    build: (S, lanes, P) => createBoardStage(id, S, lanes, P, {
      material: def0.mat, voiceOf: () => def0.voice,
      layout(F, K) {
        const { W, H } = F, bw = Math.min(W * 0.9, H * (id === 'guzheng' ? 0.5 : 0.42)), topU = H * 0.03, botU = H * 0.975;
        const G = { W, H, bw, topU, botU, pinTop: topU, bodyTop: topU + H * 0.1, bodyBot: botU - H * 0.065, ns: def0.ns };
        const NS = def0.ns, order = rank(K), n = order.length, strings = new Array(K.N).fill(null);
        const vOf = (s) => lerp(-bw * 0.4, bw * 0.4, s / (NS - 1));
        const bridgeU = (s) => lerp(G.bodyTop + (G.bodyBot - G.bodyTop) * def0.line[0], G.bodyTop + (G.bodyBot - G.bodyTop) * def0.line[1], s / (NS - 1));
        G.vOf = vOf; G.bridgeU = bridgeU;
        // lanes take strings spread over the whole board (so the strings stay readable), every other string stays a quiet partner
        const idx = order.map((_, r) => (n >= NS ? r : Math.round((r * (NS - 1)) / Math.max(1, n - 1))));
        const spacing = (bw * 0.8) / Math.max(1, n - 1);
        const rw = stagger(idx.map((s) => vOf(s)), 52, 4), rows = Math.max(...rw) + 1;
        const used = new Set();
        order.forEach((i, r) => {
          const s = idx[r]; used.add(s);
          const bu = bridgeU(s), v = vOf(s), top = G.bodyTop + 6;
          const t = 0.55 + (rw[r] - (rows - 1) / 2) * (rows > 2 ? 0.14 : 0.18);
          const u = lerp(top, bu - 8, t);
          strings[i] = { v0: v, u0: G.pinTop + H * 0.05, v1: v, u1: bu, sv: v, su: u, r: Math.max(14, Math.min(24, spacing * 0.5)) };
        });
        G.used = used;
        // the other strings: drawn as quiet strings from pin to bridge and on to the tail
        const extra = [];
        for (let s = 0; s < NS; s++) {
          const v = vOf(s), bu = bridgeU(s), low = s < NS * 0.35;
          const col = def0.mat === 'silk' ? '#e9dfc6' : low ? '#c9a45c' : '#cfd3da';
          extra.push({ v0: v, u0: bu, v1: v, u1: G.bodyBot + H * 0.04, w: def0.mat === 'silk' ? 3.2 : 1.3, col: mix(col, '#3a2410', 0.45), dim: false });
          if (!used.has(s)) extra.push({ v0: v, u0: G.pinTop + H * 0.05, v1: v, u1: bu, w: def0.mat === 'silk' ? 3.6 : 1.5, col: mix(col, '#3a2410', 0.35), dim: false });
        }
        return { G, strings, extra, top: G.pinTop + H * 0.05 };
      },
      back(ctx, G, rt, h) {
        const { bw, topU, botU, bodyTop, bodyBot, ns } = G;
        const x0 = -bw / 2, x1 = bw / 2;
        // the long box: carved rail (dark), pale soundboard with a gentle arch
        const box = (inset = 0) => () => { rrect(ctx, x0 + inset, topU + inset, bw - 2 * inset, botU - topU - 2 * inset, 18 - inset * 0.4); };
        shadow(ctx, box(0), 9, 13, 0.4);
        wood(ctx, box(0), { x0, y0: topU, x1, y1: botU }, def0.rail, { seed: 3, n: 16, bevel: rgba(def0.railHi, 0.7), shade: 0.3 });
        const sb = () => rrect(ctx, x0 + 22, bodyTop, bw - 44, bodyBot - bodyTop, 10);
        wood(ctx, sb, { x0: x0 + 22, y0: bodyTop, x1: x1 - 22, y1: bodyBot }, def0.wood, { seed: 6, n: 30, bevel: 'rgba(255,255,255,0.2)', edge: darker(def0.wood, 0.5), shade: 0.26, grainA: 0.42, hl: 0.1 });
        // arch: the board is lit down its middle and falls away to the rails
        ctx.save(); sb(); ctx.clip();
        ctx.fillStyle = hgrad(ctx, x0 + 22, x1 - 22, [[0, 'rgba(40,20,4,0.34)'], [0.22, 'rgba(255,240,200,0.0)'], [0.5, 'rgba(255,250,225,0.16)'], [0.78, 'rgba(255,240,200,0)'], [1, 'rgba(40,20,4,0.4)']]); ctx.fillRect(x0, bodyTop, bw, bodyBot - bodyTop);
        ctx.restore();
        // inlaid line round the board
        inlay(ctx, () => rrect(ctx, x0 + 12, topU + 12, bw - 24, botU - topU - 24, 12), 'rgba(240,215,160,0.8)', 2, [10, 6]);
        // pin end (top): a dark plate with the pins; gayageum has silk cords bound in bundles instead
        const pt = topU + 10;
        if (def0.pins === 'steel') {
          const pl = () => rrect(ctx, x0 + 24, pt, bw - 48, G.H * 0.075, 8);
          wood(ctx, pl, { x0: x0 + 24, y0: pt, x1: x1 - 24, y1: pt + G.H * 0.075 }, '#2a130a', { seed: 12, n: 8, vert: false });
          for (let s = 0; s < ns; s++) pin(ctx, G.vOf(s), pt + G.H * 0.037 + (s % 2 ? 5 : -5), 5, '#d3d6dd');
        } else {
          const pl = () => rrect(ctx, x0 + 24, pt, bw - 48, G.H * 0.06, 10);
          wood(ctx, pl, { x0: x0 + 24, y0: pt, x1: x1 - 24, y1: pt + G.H * 0.06 }, '#d9bd7c', { seed: 12, n: 8, vert: false, bevel: 'rgba(255,255,255,0.3)' });
          for (let s = 0; s < ns; s++) { wrap(ctx, G.vOf(s), pt + G.H * 0.03, 15, 22, s % 2 ? '#b8322c' : '#2c4f8a', 4, 0); }
        }
        // bridges: one for each string, standing on the soundboard along the slanted line
        for (let s = 0; s < ns; s++) {
          const v = G.vOf(s), u = G.bridgeU(s), sl = Math.atan2(G.bridgeU(Math.min(ns - 1, s + 1)) - G.bridgeU(Math.max(0, s - 1)), G.vOf(Math.min(ns - 1, s + 1)) - G.vOf(Math.max(0, s - 1)));
          if (def0.bridge === 'goose') { // a small ivory-coloured bridge leaning on the string
            ctx.save(); ctx.translate(v, u); ctx.rotate(sl * 0.0);
            ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.beginPath(); ctx.moveTo(-9, 12); ctx.lineTo(0, -10); ctx.lineTo(10, 12); ctx.closePath(); ctx.translate(2, 3); ctx.fill(); ctx.translate(-2, -3);
            ctx.fillStyle = vgrad(ctx, -12, 12, [[0, '#fff6dc'], [0.55, '#e3cb92'], [1, '#8a5a2a']]); ctx.beginPath(); ctx.moveTo(-9, 12); ctx.lineTo(0, -11); ctx.lineTo(9, 12); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(70,40,10,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
            ctx.restore();
          } else { // gayageum: a taller, wider arch of pale wood with a dark foot
            ctx.save(); ctx.translate(v, u);
            ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.moveTo(-14, 14); ctx.quadraticCurveTo(0, -16, 14, 14); ctx.lineTo(8, 14); ctx.quadraticCurveTo(0, -6, -8, 14); ctx.closePath(); ctx.translate(3, 4); ctx.fill(); ctx.translate(-3, -4);
            ctx.fillStyle = vgrad(ctx, -16, 14, [[0, '#fff8e6'], [0.6, '#e4cc94'], [1, '#6a4a22']]); ctx.beginPath(); ctx.moveTo(-14, 14); ctx.quadraticCurveTo(0, -17, 14, 14); ctx.lineTo(8, 14); ctx.quadraticCurveTo(0, -6, -8, 14); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(60,34,10,0.7)'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore();
          }
        }
        // tail end
        if (def0.tail === 'plate') {
          const tl = () => rrect(ctx, x0 + 24, bodyBot + 4, bw - 48, botU - bodyBot - 18, 8);
          wood(ctx, tl, { x0: x0 + 24, y0: bodyBot + 4, x1: x1 - 24, y1: botU - 14 }, '#3a170d', { seed: 17, n: 8, vert: false });
          ctx.strokeStyle = 'rgba(232,196,120,0.7)'; ctx.lineWidth = 2;
          for (let k = 0; k < 9; k++) { const x = lerp(x0 + 50, x1 - 50, k / 8); ctx.beginPath(); ctx.arc(x, bodyBot + (botU - bodyBot) * 0.42, bw * 0.03, 0, TAU); ctx.stroke(); }
        } else { // the curled end: a horn of dark wood with the string tails in loops of red silk
          const hy = bodyBot + 4;
          ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.moveTo(x0 + 24 + 4, hy + 6); ctx.lineTo(x1 - 24 + 4, hy + 6); ctx.lineTo(x1 - 24 + 4, botU - 6); ctx.quadraticCurveTo(0, botU + 10, x0 + 24 + 4, botU - 6); ctx.fill();
          wood(ctx, () => { ctx.beginPath(); ctx.moveTo(x0 + 24, hy); ctx.lineTo(x1 - 24, hy); ctx.lineTo(x1 - 24, botU - 12); ctx.quadraticCurveTo(0, botU + 4, x0 + 24, botU - 12); ctx.closePath(); },
            { x0: x0 + 24, y0: hy, x1: x1 - 24, y1: botU }, '#2f2a2a', { seed: 17, n: 8, vert: false, bevel: 'rgba(255,255,255,0.18)' });
          for (let s = 0; s < ns; s++) { const v = G.vOf(s); ctx.strokeStyle = '#c0342c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(v, hy + 6); ctx.quadraticCurveTo(v + 6, hy + 28, v, botU - 20); ctx.stroke(); ctx.fillStyle = '#e8c35a'; circ(ctx, v, hy + 8, 3.2); ctx.fill(); }
        }
      },
      front(ctx, G, rt, h) { void h; void rt; void G; },
    }),
  });
}

// ---- mountain dulcimer ------------------------------------------------------------------------------------------------------
const DIA = [0, 2, 4, 5, 7, 9, 10, 12, 14, 16, 17, 19, 21, 22, 24];   // semitones above the open melody string at each fret of the diatonic board
registerStringStage({
  id: 'dulcimer', match: /mountain.?dulcimer|appalachian|lap.?dulcimer|^(?!.*(hammered|santur|cimbalom)).*dulcimer/,
  build: (S, lanes, P) => createBoardStage('dulcimer', S, lanes, P, {
    material: 'steel', plectrum: true,
    voiceOf: (i, l) => (/drone/i.test(l.name) ? 'dulcimer-drone' : 'dulcimer'),
    layout(F, K) {
      const { W, H } = F, bw = Math.min(W * 0.66, H * 0.4), headU = H * 0.025, nutU = H * 0.2, bridgeU = H * 0.9, bodyTop = H * 0.17, bodyBot = H * 0.965;
      const G = { W, H, bw, headU, nutU, bridgeU, bodyTop, bodyBot, L: bridgeU - nutU };
      // three courses: the melody string (doubled) in the centre-left and two drones to the right
      const stV = [-bw * 0.075, bw * 0.045, bw * 0.12];
      const sv = [-bw * 0.075, bw * 0.045, bw * 0.12];
      G.sv = sv; G.melodyPair = [sv[0] - 4.5, sv[0] + 4.5];
      const fretU = (s) => nutU + G.L * 0.94 * (0.5 * (1 - 2 ** (-s / 12)) / (1 - 2 ** (-19 / 12)) + 0.5 * s / 19);   // true fret spacing blended with even spacing so the note names never touch
      G.fretU = fretU;
      const strings = new Array(K.N).fill(null);
      const open = Math.min(...K.noteIdx.filter((i) => !/drone/i.test(K.lanes[i].name)).map((i) => K.lanes[i].hz));
      const frets = [];
      K.noteIdx.forEach((i) => {
        const l = K.lanes[i], str = Number.isInteger(l.string) ? l.string : (/drone/i.test(l.name) ? 1 : 0);
        const semi = str === 0 ? (Number.isInteger(l.fret) ? DIA[l.fret] ?? 0 : Math.max(0, Math.round(12 * Math.log2(l.hz / open)))) : 0;
        const fi = Math.max(1, DIA.indexOf(semi)), u = semi === 0 ? nutU + 24 : (fretU(DIA[fi - 1] ?? 0) + fretU(semi)) / 2;
        const v = sv[Math.min(2, str)];
        strings[i] = { v0: v, u0: nutU, v1: v, u1: bridgeU, sv: v, su: u, r: 22, open: semi === 0 };
        frets.push(semi);
      });
      return { G, strings, top: nutU };
    },
    back(ctx, G) {
      const { bw, headU, nutU, bridgeU, bodyTop, bodyBot } = G;
      const half = (t, inset = 0) => bw * (0.5 - 0.17 * Math.exp(-(((t - 0.5) / 0.2) ** 2))) * (0.88 + 0.12 * t) - inset;   // hourglass: waist at the middle, the lower bout a little fuller
      const outline = (inset = 0) => () => {
        const n = 36; ctx.beginPath();
        for (let k = 0; k <= n; k++) { const t = k / n, u = lerp(bodyTop + inset, bodyBot - inset, t), x = -half(t, inset); if (k === 0) ctx.moveTo(x, u); else ctx.lineTo(x, u); }
        for (let k = n; k >= 0; k--) { const t = k / n, u = lerp(bodyTop + inset, bodyBot - inset, t); ctx.lineTo(half(t, inset), u); }
        ctx.closePath();
      };
      const bb = { x0: -bw * 0.62, y0: bodyTop, x1: bw * 0.62, y1: bodyBot };
      shadow(ctx, outline(0), 9, 12, 0.4);
      wood(ctx, outline(0), bb, '#5a2f14', { seed: 41, n: 16, bevel: 'rgba(255,205,140,0.42)' });
      wood(ctx, outline(13), { x0: bb.x0 + 13, y0: bb.y0 + 13, x1: bb.x1 - 13, y1: bb.y1 - 13 }, '#d6a862', { seed: 8, n: 26, bevel: 'rgba(255,236,190,0.28)', edge: '#6a4420', shade: 0.28, grainA: 0.4, hl: 0.12 });
      inlay(ctx, outline(9), '#f6e6b8', 1.8, [8, 5], 0.85);
      // two pairs of heart-shaped sound holes either side of the fretboard
      const heart = (cx, cy, s, rot) => {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
        ctx.beginPath(); ctx.moveTo(0, s * 0.9); ctx.bezierCurveTo(-s * 1.25, s * 0.1, -s * 0.9, -s * 0.9, 0, -s * 0.38); ctx.bezierCurveTo(s * 0.9, -s * 0.9, s * 1.25, s * 0.1, 0, s * 0.9); ctx.closePath();
        ctx.fillStyle = rgba('#000000', 0.38); ctx.save(); ctx.translate(2, 3); ctx.fill(); ctx.restore();
        ctx.fillStyle = '#120904'; ctx.fill(); ctx.strokeStyle = '#f3e1b2'; ctx.lineWidth = 3; ctx.stroke();
        ctx.restore();
      };
      const hs = bw * 0.048;
      for (const s of [-1, 1]) { heart(s * bw * 0.31, lerp(bodyTop, bodyBot, 0.3), hs, s * 0.12); heart(s * bw * 0.31, lerp(bodyTop, bodyBot, 0.74), hs, -s * 0.12); }
      // raised fingerboard down the middle: dark, with fret wires at the diatonic positions and dots at the key frets
      const fbw = bw * 0.27, fbL = -fbw / 2 + bw * 0.01, fbR = fbw / 2 + bw * 0.04;
      const fb = () => rrect(ctx, fbL, nutU - 14, fbR - fbL, bridgeU - nutU + 34, 7);
      ctx.save(); ctx.translate(5, 7); fb(); ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.fill(); ctx.restore();
      wood(ctx, fb, { x0: fbL, y0: nutU - 14, x1: fbR, y1: bridgeU + 20 }, '#3a2010', { seed: 51, n: 10, bevel: 'rgba(255,220,160,0.4)', shade: 0.3 });
      for (let k = 1; k < DIA.length; k++) {
        const u = G.fretU(DIA[k]); if (u > bridgeU - 16) break;
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(fbL + 2, u + 1); ctx.lineTo(fbR - 2, u + 1); ctx.stroke();
        ctx.strokeStyle = '#e4dccb'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(fbL + 2, u); ctx.lineTo(fbR - 2, u); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(fbL + 2, u - 1); ctx.lineTo(fbR - 2, u - 1); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(245,235,205,0.85)';
      for (const k of [3, 5, 8, 10]) { const u = (G.fretU(DIA[k - 1]) + G.fretU(DIA[k])) / 2; circ(ctx, G.sv[2] + 22, u, 3.4); ctx.fill(); }
      // peg box and scroll at the head
      const scroll = () => {
        ctx.beginPath(); ctx.moveTo(-bw * 0.075 - 22, nutU - 14); ctx.lineTo(-bw * 0.075 - 26, headU + 46); ctx.bezierCurveTo(-bw * 0.075 - 28, headU + 12, bw * 0.02, headU - 6, bw * 0.095, headU + 14);
        ctx.bezierCurveTo(bw * 0.14, headU + 34, bw * 0.15, headU + 46, bw * 0.13, nutU - 14); ctx.closePath();
      };
      shadow(ctx, scroll, 6, 8, 0.4);
      wood(ctx, scroll, { x0: -bw * 0.12, y0: headU - 6, x1: bw * 0.15, y1: nutU }, '#5a2f14', { seed: 61, n: 8, bevel: 'rgba(255,205,140,0.4)' });
      ctx.strokeStyle = '#e9cf9a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(bw * 0.098, headU + 24, 11, 0.4, TAU * 0.9); ctx.stroke(); ctx.beginPath(); ctx.arc(bw * 0.098, headU + 24, 5, 0, TAU); ctx.stroke();
      for (const [x, y, a] of [[-bw * 0.075 - 34, headU + 66, 0.1], [-bw * 0.075 - 34, headU + 98, 0.1], [bw * 0.16, headU + 70, -0.1]]) peg(ctx, x, y, 30, 8, '#c78a46', a);
      // nut and bridge
      bridgeBar(ctx, (fbL + fbR) / 2, nutU - 3, fbR - fbL + 6, 8, '#f1ead6');
      bridgeBar(ctx, (fbL + fbR) / 2, bridgeU, fbR - fbL + 14, 12, '#e9d7a8');
      // tailpiece: a small hitch bar with three pins
      for (const v of G.sv) pin(ctx, v, bridgeU + 22, 3.8, '#d9b46a');
    },
    front(ctx, G, rt, h) {
      // the noter: a short dark rod that stops the melody string at the lane that sounds, and the quill that plucks near the bridge
      const lane = h.K.noteIdx.reduce((b, i) => (rt.flash[i] > (rt.flash[b] ?? 0) ? i : b), h.K.noteIdx[0]);
      const sp = lane != null ? h.spots[lane] : null;
      if (!sp || !(rt.flash[lane] > 0.04) || sp.v > G.sv[0] + 8) return;
      const f = rt.flash[lane];
      ctx.save(); ctx.translate(sp.v + 3, sp.u); ctx.rotate(-0.5);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, 3, -44, 12, 66, 6); ctx.fill();
      ctx.fillStyle = hgrad(ctx, 0, 12, [[0, '#2a150a'], [0.4, '#a8682f'], [1, '#3a1e0c']]); rrect(ctx, 0, -46, 11, 66, 5.5); ctx.fill();
      ctx.restore();
      void f;
    },
  }),
});

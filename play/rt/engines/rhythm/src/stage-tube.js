// Tube zither stages (1.10.0): valiha (bamboo tube with strings along it, a bridge pair for every string) and sasando (a slimmer bamboo
// tube with a staircase of wedge bridges, standing in a pleated palm-leaf resonator). The strings run along the tube; each lane is a
// string, plucked where it is long enough to reach.
import { clamp, mix, rgba, lighter, darker, rrect, circ, ell, hgrad, vgrad, rgrad, hash, TAU } from './instr-art.js';
import { shadow, bamboo, bridgeBar, wood, wrap, studs } from './instr-art.js';
import { registerStringStage } from './registry.js';
import { createBoardStage, stagger } from './board-kit.js';
import { lerp } from './stagekit.js';

const rank = (K) => K.noteIdx.slice().sort((a, b) => K.lanes[a].hz - K.lanes[b].hz);

function tubeLayout(F, K, o) {
  const { W, H } = F;
  const tw = Math.min(W * o.wf, H * o.hf), R = tw / 2, y0 = H * 0.045, y1 = H * 0.955, h = y1 - y0;
  const G = { W, H, tw, R, y0, y1, h, o };
  const order = rank(K), n = order.length, strings = new Array(K.N).fill(null);
  const fOf = (r) => (n > 1 ? r / (n - 1) : 0.5);
  const vOf = (f) => R * 0.84 * (0.62 * (2 * f - 1) + 0.38 * Math.sin((2 * f - 1) * Math.PI / 2));
  const vs = order.map((_, r) => vOf(fOf(r)));
  const rw = stagger(vs, 54, 4), rows = Math.max(...rw) + 1;
  G.bridges = [];
  order.forEach((i, r) => {
    const f = fOf(r), v = vs[r], ut = y0 + o.edge * h + o.step * h * f, ub = y1 - o.edge * h - o.step * h * f;
    const t = 0.5 + (rw[r] - (rows - 1) / 2) * (rows > 1 ? 0.5 / rows : 0);
    strings[i] = { v0: v, u0: ut, v1: v, u1: ub, sv: v, su: lerp(ut, ub, t), r: 24 };
    G.bridges.push({ v, ut, ub, f });
  });
  // the strings that are not lanes: none (every string of these instruments is a lane in a game); keep the order for painters
  G.order = order;
  return { G, strings, top: y0 };
}

// ---- valiha ---------------------------------------------------------------------------------------------------------------
registerStringStage({
  id: 'valiha', match: /valiha|marovany/,
  build: (S, lanes, P) => createBoardStage('valiha', S, lanes, P, {
    material: 'steel', voiceOf: () => 'valiha',
    layout: (F, K) => tubeLayout(F, K, { wf: 0.62, hf: 0.4, edge: 0.1, step: 0.13 }),
    back(ctx, G) {
      const { R, y0, y1, h } = G;
      bamboo(ctx, -R, y0, R, y1, { base: '#c9a653', nodes: [y0 + h * 0.035, y0 + h * 0.34, y0 + h * 0.66, y1 - h * 0.035], seed: 7 });
      // the open top end seen a little from above: a dark mouth in a pale bamboo rim; the foot is closed and rounded
      const ry = R * 0.2;
      ctx.fillStyle = hgrad(ctx, -R, R, [[0, '#d8c07a'], [0.4, '#f6e6a8'], [1, '#a88a3c']]); ell(ctx, 0, y0 + ry * 0.7, R, ry); ctx.fill();
      ctx.fillStyle = rgrad(ctx, 0, y0 + ry * 0.9, 2, R * 0.9, [[0, '#050301'], [0.7, '#1a1006'], [1, '#3a2810']]); ell(ctx, 0, y0 + ry * 0.8, R * 0.86, ry * 0.76); ctx.fill();
      ctx.strokeStyle = 'rgba(60,36,6,0.7)'; ctx.lineWidth = 2; ell(ctx, 0, y0 + ry * 0.7, R, ry); ctx.stroke();
      ctx.strokeStyle = 'rgba(40,24,4,0.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, y1 - ry * 0.7, R * 0.98, ry, 0, 0.05, Math.PI - 0.05); ctx.stroke();
      // burnt zigzag bands near both ends, as on carved tubes
      for (const [ya, yb] of [[y0 + h * 0.055, y0 + h * 0.085], [y1 - h * 0.085, y1 - h * 0.055]]) {
        ctx.save(); rrect(ctx, -R, y0, 2 * R, h, R * 0.16); ctx.clip();
        ctx.strokeStyle = 'rgba(52,26,6,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-R, ya); ctx.lineTo(R, ya); ctx.moveTo(-R, yb); ctx.lineTo(R, yb); ctx.stroke();
        ctx.beginPath(); for (let x = -R; x <= R; x += 16) { ctx.lineTo(x, ya + 3); ctx.lineTo(x + 8, yb - 3); } ctx.stroke();
        ctx.restore();
      }
      // the bridge pair of every string: small wedges that set its length
      for (const b of G.bridges) { bridgeBar(ctx, b.v, b.ut - 5, 17, 11, '#f0d9a0'); bridgeBar(ctx, b.v, b.ub + 5, 17, 11, '#f0d9a0'); }
      // pegs tying the strings at both ends
      for (const b of G.bridges) { ctx.fillStyle = '#9a9ea8'; circ(ctx, b.v, b.ut - 18, 3); ctx.fill(); circ(ctx, b.v, b.ub + 18, 3); ctx.fill(); }
    },
  }),
});

// ---- sasando --------------------------------------------------------------------------------------------------------------
registerStringStage({
  id: 'sasando', match: /sasando|rote.?zither|lontar|tube.?zither|bamboo.?zither/,
  build: (S, lanes, P) => createBoardStage('sasando', S, lanes, P, {
    material: 'brass', voiceOf: () => 'sasando',
    layout: (F, K) => tubeLayout(F, K, { wf: 0.5, hf: 0.3, edge: 0.095, step: 0.2 }),
    back(ctx, G) {
      const { R, y0, y1, h, W } = G;
      // the pleated palm-leaf bowl behind the tube: wide rim at the top, closing to the foot
      const rimU = y0 + h * 0.36, Rf = Math.min(W * 0.47, R * 3.0);
      const bowl = () => {
        ctx.beginPath(); ctx.moveTo(-Rf, rimU); ctx.bezierCurveTo(-Rf * 1.04, rimU + h * 0.26, -R * 1.6, y1 - h * 0.1, -R * 0.9, y1 - h * 0.012);
        ctx.lineTo(R * 0.9, y1 - h * 0.012); ctx.bezierCurveTo(R * 1.6, y1 - h * 0.1, Rf * 1.04, rimU + h * 0.26, Rf, rimU);
        ctx.quadraticCurveTo(0, rimU + Rf * 0.2, -Rf, rimU); ctx.closePath();
      };
      shadow(ctx, bowl, 9, 12, 0.38);
      // the far inside of the bowl, seen over the front rim
      ctx.fillStyle = rgrad(ctx, 0, rimU, 4, Rf, [[0, '#2a300c'], [1, '#4a5418']]); ell(ctx, 0, rimU, Rf, Rf * 0.2); ctx.fill();
      ctx.strokeStyle = 'rgba(30,34,6,0.6)'; ctx.lineWidth = 2; for (let k = -10; k <= 10; k++) { ctx.beginPath(); ctx.moveTo(k * Rf * 0.09, rimU + Math.sqrt(Math.max(0, 1 - (k / 10) ** 2)) * Rf * 0.18); ctx.lineTo(k * Rf * 0.05, rimU - Rf * 0.02); ctx.stroke(); }
      bowl(); ctx.fillStyle = hgrad(ctx, -Rf, Rf, [[0, '#4e5a1c'], [0.22, '#a9a444'], [0.5, '#c9b858'], [0.78, '#8a8a34'], [1, '#434d18']]); ctx.fill();
      ctx.save(); bowl(); ctx.clip();
      // pleats: fan lines from the foot out to the rim, alternating light and dark folds
      for (let k = -18; k <= 18; k++) {
        const tx = (k / 18) * Rf, bx = (k / 18) * R * 0.85;
        ctx.strokeStyle = k % 2 ? 'rgba(48,52,14,0.55)' : 'rgba(255,248,170,0.32)'; ctx.lineWidth = k % 2 ? 2 : 3;
        ctx.beginPath(); ctx.moveTo(bx, y1 - h * 0.02); ctx.quadraticCurveTo(bx * 1.6 + tx * 0.3, lerp(y1, rimU, 0.45), tx, rimU - Math.sqrt(Math.max(0, 1 - (k / 18) ** 2)) * Rf * 0.16); ctx.stroke();
      }
      // woven bands across the bowl
      for (const t of [0.3, 0.6, 0.82]) { const u = lerp(rimU, y1, t); ctx.strokeStyle = 'rgba(60,44,8,0.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-Rf * (1 - t * 0.7), u); ctx.quadraticCurveTo(0, u + 14, Rf * (1 - t * 0.7), u); ctx.stroke(); }
      ctx.fillStyle = vgrad(ctx, rimU - 20, y1, [[0, 'rgba(255,245,160,0.14)'], [0.4, 'rgba(0,0,0,0)'], [1, 'rgba(20,24,4,0.4)']]); ctx.fillRect(-Rf * 1.1, rimU - 30, Rf * 2.2, y1 - rimU + 30);
      ctx.restore();
      // braided rim
      ctx.strokeStyle = '#3a3410'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-Rf, rimU); ctx.quadraticCurveTo(0, rimU + Rf * 0.2, Rf, rimU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, rimU, Rf, Rf * 0.2, 0, Math.PI, TAU); ctx.stroke();
      ctx.strokeStyle = '#b9a64c'; ctx.lineWidth = 6; ctx.stroke(); ctx.beginPath(); ctx.moveTo(-Rf, rimU); ctx.quadraticCurveTo(0, rimU + Rf * 0.2, Rf, rimU); ctx.stroke();
      ctx.strokeStyle = 'rgba(70,56,12,0.7)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.stroke(); ctx.setLineDash([]);
      // the tube, standing in front
      bamboo(ctx, -R, y0, R, y1 - h * 0.035, { base: '#c79a3c', nodes: [y0 + h * 0.03, y0 + h * 0.4, y1 - h * 0.06], seed: 9 });
      { const ry = R * 0.2; ctx.fillStyle = hgrad(ctx, -R, R, [[0, '#d8c07a'], [0.4, '#f6e6a8'], [1, '#a88a3c']]); ell(ctx, 0, y0 + ry * 0.7, R, ry); ctx.fill();
        ctx.fillStyle = rgrad(ctx, 0, y0 + ry * 0.9, 2, R * 0.9, [[0, '#050301'], [0.7, '#1a1006'], [1, '#3a2810']]); ell(ctx, 0, y0 + ry * 0.8, R * 0.86, ry * 0.76); ctx.fill();
        ctx.strokeStyle = 'rgba(60,36,6,0.7)'; ctx.lineWidth = 2; ell(ctx, 0, y0 + ry * 0.7, R, ry); ctx.stroke(); }
      // wedge bridges: tall pale blocks that lift each string, with a long shadow
      for (const b of G.bridges) {
        for (const [u, d] of [[b.ut - 4, -1], [b.ub + 4, 1]]) {
          ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.moveTo(b.v - 9, u + d * 10); ctx.lineTo(b.v + 12, u + d * 10); ctx.lineTo(b.v + 4, u - d * 8); ctx.closePath(); ctx.fill();
          ctx.fillStyle = vgrad(ctx, u - 12, u + 12, [[0, '#fff1c4'], [0.5, '#d9bb74'], [1, '#6a4a1c']]); ctx.beginPath(); ctx.moveTo(b.v - 8, u + d * 9); ctx.lineTo(b.v + 8, u + d * 9); ctx.lineTo(b.v, u - d * 10); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(70,40,8,0.7)'; ctx.lineWidth = 1; ctx.stroke();
        }
      }
      // a little rope-wrapped knob at the top where the strings are tied, and a small hook at the foot
      for (const b of G.bridges) { ctx.fillStyle = '#e8d6a2'; circ(ctx, b.v, b.ut - 20, 3.4); ctx.fill(); circ(ctx, b.v, b.ub + 20, 3.4); ctx.fill(); }
    },
  }),
});

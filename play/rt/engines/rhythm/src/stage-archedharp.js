// Arched harp stages (1.10.0): adungu (Uganda: hide-covered trough, leather-ringed neck) and saung gauk (Myanmar: red lacquer canoe
// with gold scrollwork, silk tassels). Seen from the side: the strings run from rings on the arching neck down to tabs on the hide.
// Always drawn upright (the frame lies the instrument across a portrait screen so the neck rises).
import { clamp, mix, rgba, lighter, darker, rrect, circ, ell, hgrad, vgrad, rgrad, hash, TAU } from './instr-art.js';
import { shadow, wood, wrap, tassel, studs, inlay } from './instr-art.js';
import { registerStringStage } from './registry.js';
import { createBoardStage, stagger } from './board-kit.js';
import { lerp } from './stagekit.js';

const rank = (K) => K.noteIdx.slice().sort((a, b) => K.lanes[a].hz - K.lanes[b].hz);
const bez = (p0, p1, p2, p3, t) => { const m = 1 - t; return [m * m * m * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t * t * t * p3[0], m * m * m * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t * t * t * p3[1]]; };
const bezD = (p0, p1, p2, p3, t) => { const m = 1 - t; return [3 * m * m * (p1[0] - p0[0]) + 6 * m * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]), 3 * m * m * (p1[1] - p0[1]) + 6 * m * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1])]; };

const LOOK = {
  'saung-gauk': { mat: 'silk', voice: 'harp-saung', rise: 0.92, bodyT: 0.17, wood: '#a3201a', neck: '#8c1b16', hide: '#f0e4c4', sag: 0.05 },
  adungu: { mat: 'gut', voice: 'harp-adungu', rise: 0.8, bodyT: 0.15, wood: '#7a3f1c', neck: '#5a2c12', hide: '#dcc59c', sag: 0 },
};

for (const [id, o] of Object.entries(LOOK)) {
  registerStringStage({
    id, match: id === 'adungu' ? /adungu|bow.?harp|arched.?harp(?!.*saung)/ : /saung|gauk|burmese.?harp|myanmar.?harp/,
    build: (S, lanes, P) => createBoardStage(id, S, lanes, P, {
      frame: { lying: 1, top: 44, bottom: 12, side: 10 },
      material: o.mat, voiceOf: () => o.voice,
      layout(F, K) {
        const { W, H } = F;
        const uL = H * 0.2, uR = H * 0.975, vTop = -W * 0.2, T = W * o.bodyT;
        const P0 = [uL + 0.03 * H, vTop], P1 = [uL - 0.075 * H, vTop + 0.52 * W * o.rise], P2 = [uL + 0.2 * H, vTop + 0.86 * W * o.rise], P3 = [uL + 0.54 * H, vTop + 0.6 * W * o.rise];
        const G = { W, H, uL, uR, vTop, T, P0, P1, P2, P3, o, id };
        G.neck = (t) => { const [u, v] = bez(P0, P1, P2, P3, t); return { u, v }; };
        G.tan = (t) => { const [du, dv] = bezD(P0, P1, P2, P3, t); const l = Math.hypot(du, dv) || 1; return { u: du / l, v: dv / l }; };
        const order = rank(K), n = order.length, strings = new Array(K.N).fill(null);
        const fOf = (r) => (n > 1 ? r / (n - 1) : 0.5);
        G.rings = [];
        const mids = order.map((_, r) => { const f = fOf(r), nk = G.neck(lerp(0.97, 0.46, f)), ua = lerp(uR - 0.07 * H, uL + 0.3 * H, f); return (nk.u + ua) / 2; });
        const rw = stagger(mids, 56, 4), rows = Math.max(...rw) + 1;
        order.forEach((i, r) => {
          const f = fOf(r), t = lerp(0.97, 0.46, f), nk = G.neck(t), ua = lerp(uR - 0.07 * H, uL + 0.3 * H, f);
          const p = 0.55 + (rw[r] - (rows - 1) / 2) * (rows > 1 ? 0.2 / (rows - 1) * 2 : 0);
          strings[i] = { v0: nk.v, u0: nk.u, v1: vTop, u1: ua, sv: lerp(nk.v, vTop, p), su: lerp(nk.u, ua, p), r: 24, amp: 6 };
          G.rings.push({ t, ...nk, ua, f, tan: G.tan(t) });
        });
        return { G, strings, top: P3[1] };
      },
      back(ctx, G, rt) {
        const { W, H, uL, uR, vTop, T } = G;
        // ---- the soundbox: a long trough, rounded below, its hide on top --------------------------------------------------------
        const n = 44;
        const body = () => {
          ctx.beginPath(); ctx.moveTo(vTop, uL);
          for (let k = 0; k <= n; k++) { const s = k / n, u = lerp(uL, uR, s), sh = o.sag * W * Math.sin(Math.PI * s) * 0; ctx.lineTo(vTop - T * Math.pow(Math.sin(Math.PI * s), 0.62) - sh, u); }
          ctx.lineTo(vTop, uR); ctx.closePath();
        };
        shadow(ctx, body, -10, 10, 0.38);
        if (id === 'adungu') {
          wood(ctx, body, { x0: vTop - T, y0: uL, x1: vTop, y1: uR }, o.wood, { seed: 71, n: 14, vert: true, bevel: 'rgba(255,205,140,0.35)' });
          // rows of tacks along the lower rim and an edge band of stitched leather
          const pts = []; for (let k = 2; k < 40; k++) { const s = k / n, u = lerp(uL, uR, s); pts.push([vTop - T * Math.pow(Math.sin(Math.PI * s), 0.62) * 0.8 + 4, u]); }
          studs(ctx, pts, 2.6, '#d8b868');
        } else {
          // red lacquer: deep colour, a long window of reflected light, and gold scrolls
          ctx.save(); body(); ctx.fillStyle = hgrad(ctx, vTop - T, vTop, [[0, '#4a0907'], [0.3, '#b3251e'], [0.6, '#d03a2a'], [1, '#7a120e']]); ctx.fill(); ctx.clip();
          ctx.fillStyle = 'rgba(255,230,210,0.22)'; ctx.beginPath(); ctx.ellipse(vTop - T * 0.35, (uL + uR) / 2, T * 0.1, (uR - uL) * 0.42, 0, 0, TAU); ctx.fill();
          ctx.strokeStyle = '#e8b64a'; ctx.lineWidth = 2.6;
          for (let k = 0; k < 9; k++) { const u = lerp(uL + 0.08 * H, uR - 0.08 * H, (k + 0.5) / 9); ctx.beginPath(); ctx.arc(vTop - T * 0.45, u, T * 0.2, -1.2, 3.4 + (k % 2) * 0.5); ctx.stroke(); ctx.beginPath(); ctx.arc(vTop - T * 0.45 + (k % 2 ? 4 : -4), u, T * 0.07, 0, TAU); ctx.stroke(); }
          for (let k = 0; k < 10; k++) { ctx.fillStyle = '#f0d6a0'; circ(ctx, vTop - T * 0.12, lerp(uL + 0.04 * H, uR - 0.04 * H, k / 9), 3.2); ctx.fill(); }
          ctx.restore();
          ctx.strokeStyle = '#e8b64a'; ctx.lineWidth = 3; body(); ctx.stroke();
        }
        // the hide laid on top, with a patched, stitched look
        const hideT = W * 0.034;
        const hide = () => rrect(ctx, vTop - hideT, uL + 4, hideT + 4, uR - uL - 8, 5);
        ctx.fillStyle = hgrad(ctx, vTop - hideT, vTop + 4, [[0, darker(o.hide, 0.25)], [0.4, lighter(o.hide, 0.25)], [1, darker(o.hide, 0.4)]]); hide(); ctx.fill();
        ctx.save(); hide(); ctx.clip(); ctx.fillStyle = 'rgba(70,40,12,0.2)';
        for (let k = 0; k < 7; k++) { ell(ctx, vTop - hideT * (0.2 + hash(k + 9) * 0.5), lerp(uL, uR, hash(k + 31)), hideT * 0.35, 22 + hash(k) * 30); ctx.fill(); }
        ctx.restore();
        ctx.strokeStyle = 'rgba(60,34,10,0.8)'; ctx.lineWidth = 1.5; hide(); ctx.stroke();
        ctx.strokeStyle = 'rgba(60,34,10,0.8)'; ctx.lineWidth = 1.4;
        for (let k = 0; k < 34; k++) { const u = lerp(uL + 14, uR - 14, k / 33); ctx.beginPath(); ctx.moveTo(vTop - hideT * 0.72, u); ctx.lineTo(vTop - hideT * 0.2, u + 5); ctx.stroke(); }
        // ---- the neck: a thick arc of dark wood, ringed where each string is tied ------------------------------------------------
        const neckPath = () => { ctx.beginPath(); for (let k = 0; k <= 40; k++) { const q = G.neck(k / 40); if (k === 0) ctx.moveTo(q.v, q.u); else ctx.lineTo(q.v, q.u); } };
        ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.translate(-9, 9); neckPath(); ctx.strokeStyle = 'rgba(0,0,0,0.38)'; ctx.lineWidth = id === 'adungu' ? 28 : 24; ctx.stroke(); ctx.translate(9, -9);
        neckPath(); ctx.strokeStyle = darker(o.neck, 0.45); ctx.lineWidth = id === 'adungu' ? 28 : 24; ctx.stroke();
        neckPath(); ctx.strokeStyle = o.neck; ctx.lineWidth = id === 'adungu' ? 22 : 19; ctx.stroke();
        neckPath(); ctx.strokeStyle = lighter(o.neck, 0.28); ctx.lineWidth = id === 'adungu' ? 12 : 10; ctx.stroke();
        ctx.save(); ctx.translate(-5, 0); neckPath(); ctx.strokeStyle = 'rgba(255,230,190,0.5)'; ctx.lineWidth = 3.2; ctx.stroke(); ctx.restore();
        ctx.restore();
        // foot of the neck where it enters the box
        const nb = G.neck(0.015); ctx.fillStyle = darker(o.neck, 0.35); circ(ctx, nb.v, nb.u, 17); ctx.fill();
        wood(ctx, () => circ(ctx, nb.v, nb.u, 15), { x0: nb.v - 15, y0: nb.u - 15, x1: nb.v + 15, y1: nb.u + 15 }, o.neck, { seed: 5, n: 4, bevel: 'rgba(255,205,140,0.4)' });
        // rings (leather bands, or gold ties with silk tassels) at every string
        for (const r of G.rings) {
          const ang = Math.atan2(r.tan.v, r.tan.u);
          if (id === 'adungu') wrap(ctx, r.v, r.u, 16, 30, '#c79a58', 4, ang + Math.PI / 2 - Math.PI / 2 + Math.PI / 2);
          else { wrap(ctx, r.v, r.u, 12, 28, '#e8b64a', 3, ang + Math.PI / 2 - Math.PI / 2 + Math.PI / 2); }
        }
        // the free end of the neck
        const tip = G.neck(1);
        if (id === 'adungu') { ctx.fillStyle = '#3a1c0a'; circ(ctx, tip.v, tip.u, 16); ctx.fill(); ctx.strokeStyle = '#d8b868'; ctx.lineWidth = 3; ctx.stroke(); }
        else { // a gilded leaf-shaped tip turned up at the end
          const tg = G.tan(1), ang = Math.atan2(tg.v, tg.u);
          ctx.save(); ctx.translate(tip.v + tg.v * 18, tip.u + tg.u * 18); ctx.rotate(ang * 0 + Math.atan2(tg.u, -tg.v) * 0 + 0);
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-22, -4, -30, 34, 4, 54); ctx.bezierCurveTo(30, 34, 22, -4, 0, 0); ctx.closePath();
          ctx.fillStyle = hgrad(ctx, -26, 26, [[0, '#a8761a'], [0.4, '#f6d777'], [1, '#8a5a10']]); ctx.fill(); ctx.strokeStyle = '#5a3a08'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
        }
        // tabs where the strings are tied on the hide
        for (const r of G.rings) { ctx.fillStyle = id === 'adungu' ? '#c79a58' : '#e8b64a'; rrect(ctx, vTop - 4, r.ua - 4, 10, 8, 3); ctx.fill(); ctx.strokeStyle = 'rgba(40,20,4,0.7)'; ctx.lineWidth = 1; ctx.stroke(); }
        if (id === 'saung-gauk') { // silk tassels hang from the rings, swaying a little
          G.rings.forEach((r, k) => { tassel(ctx, r.v - 8, r.u, 52, ['#c0342c', '#2c5fa8', '#e8b64a', '#2e8a5a'][k % 4], Math.sin(rt.anim * 2.4 + k) * 0.06); });
        }
        void H; void uR;
      },
    }),
  });
}

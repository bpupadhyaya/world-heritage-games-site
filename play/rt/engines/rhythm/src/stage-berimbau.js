// Berimbau (1.10.0): the musical bow. A long stick bent by a steel wire, a gourd tied near the foot as a resonator, a coin pressed to the
// wire to raise the note, a thin stick (baqueta) that strikes it, and a basket rattle (caxixi). The three wire notes sit where they are
// played along the wire; the coin sits at two of them (pressed hard = a higher clear note, touching lightly = a buzz).
import { clamp, mix, rgba, lighter, darker, rrect, circ, ell, hgrad, vgrad, rgrad, hash, TAU } from './instr-art.js';
import { shadow, wood } from './instr-art.js';
import { registerStringStage } from './registry.js';
import { createBoardStage } from './board-kit.js';
import { glow } from './art.js';
import { lerp } from './stagekit.js';

const KIND = (l, k) => (/solta|open|low|base/i.test(l.name) ? 'open' : /dobr|coin|stone|high|clear/i.test(l.name) ? 'coin' : /chiad|buzz/i.test(l.name) ? 'buzz' : ['open', 'coin', 'buzz'][k] ?? 'open');

registerStringStage({
  id: 'berimbau', match: /berimbau|musical.?bow|biriba|capoeira/,
  build: (S, lanes, P) => createBoardStage('berimbau', S, lanes, P, {
    material: 'steel',
    voiceOf: (i, l, c) => (c === 'shaker' ? 'caxixi' : `berimbau-${KIND(l, lanes.filter((q, j) => j < i && !/caxixi|shak/i.test(q.name)).length)}`),
    layout(F, K) {
      const { W, H } = F;
      const top = H * 0.045, bot = H * 0.965, vEnd = W * 0.07, bulge = W * 0.15;
      const G = { W, H, top, bot, vEnd, bulge, wireV: vEnd, gourdU: H * 0.8, gourdV: -W * 0.09 + 0, gourdR: Math.min(W * 0.2, H * 0.13) };
      G.stick = (t) => ({ u: lerp(top, bot, t), v: vEnd - bulge * Math.sin(Math.PI * t) });
      const strings = new Array(K.N).fill(null), spots = {};
      const pos = { open: 0.62, coin: 0.36, buzz: 0.2 };
      let k = 0; G.coins = [];
      K.lanes.forEach((l, i) => {
        if (K.cls[i] === 'shaker') { spots[i] = null; return; }
        if (K.cls[i] !== 'note') return;
        const kind = KIND(l, k++), u = lerp(top, bot, pos[kind]);
        strings[i] = { v0: vEnd, u0: top + 10, v1: vEnd, u1: bot - 10, sv: vEnd, su: u, r: 27, hide: true, kind };
        if (kind !== 'open') G.coins.push({ kind, u, i });
      });
      K.shakeIdx.forEach((i) => { const r = Math.min(W * 0.1, H * 0.07); spots[i] = { v: W * 0.3, u: H * 0.66, r, dist: (lv, lu) => Math.hypot(lv - W * 0.3, lu - H * 0.66) / r, shake: true }; });
      // lanes that carry a spot with sv,su on the wire
      return { G, strings, spots, top: top + 10 };
    },
    back(ctx, G, rt, h) {
      const { W, H, top, bot, vEnd, bulge, gourdU, gourdV, gourdR } = G;
      const stick = () => { ctx.beginPath(); for (let k = 0; k <= 40; k++) { const q = G.stick(k / 40); if (k === 0) ctx.moveTo(q.v, q.u); else ctx.lineTo(q.v, q.u); } };
      // ---- the gourd: a ball with a cut mouth turned toward the wire, tied on with a cord ------------------------------------------
      const cx = gourdV, cy = gourdU;
      ctx.fillStyle = 'rgba(0,0,0,0.36)'; ell(ctx, cx + 9, cy + 12, gourdR, gourdR * 1.04); ctx.fill();
      ctx.fillStyle = rgrad(ctx, cx, cy, gourdR * 0.1, gourdR * 1.1, [[0, '#f2c36a'], [0.45, '#c4872e'], [0.85, '#7a4814'], [1, '#43260a']], cx - gourdR * 0.4, cy - gourdR * 0.45);
      circ(ctx, cx, cy, gourdR); ctx.fill();
      ctx.save(); circ(ctx, cx, cy, gourdR); ctx.clip();
      ctx.strokeStyle = 'rgba(70,36,8,0.4)'; ctx.lineWidth = 1.4;
      for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.arc(cx - gourdR * 0.5, cy, gourdR * (0.5 + k * 0.12), -1.1, 1.1); ctx.stroke(); }
      // burnt traditional band
      ctx.strokeStyle = 'rgba(40,20,4,0.75)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, gourdR * 0.72, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(40,20,4,0.7)'; for (let k = 0; k < 18; k++) { const a = (k / 18) * TAU; circ(ctx, cx + Math.cos(a) * gourdR * 0.86, cy + Math.sin(a) * gourdR * 0.86, 2.6); ctx.fill(); }
      ctx.restore();
      // the cut mouth, facing the wire
      ctx.fillStyle = rgrad(ctx, cx + gourdR * 0.72, cy, 0, gourdR * 0.38, [[0, '#050200'], [0.7, '#180a02'], [1, '#33200c']]); ell(ctx, cx + gourdR * 0.78, cy, gourdR * 0.2, gourdR * 0.42); ctx.fill();
      ctx.strokeStyle = '#e6c27a'; ctx.lineWidth = 3; ell(ctx, cx + gourdR * 0.78, cy, gourdR * 0.2, gourdR * 0.42); ctx.stroke();
      // ---- the bow: a long pale stick with bark rings, bent by the wire -----------------------------------------------------------
      ctx.save(); ctx.lineCap = 'round';
      ctx.translate(-8, 9); stick(); ctx.strokeStyle = 'rgba(0,0,0,0.34)'; ctx.lineWidth = 17; ctx.stroke(); ctx.translate(8, -9);
      stick(); ctx.strokeStyle = '#4a2a10'; ctx.lineWidth = 17; ctx.stroke();
      stick(); ctx.strokeStyle = '#a8703a'; ctx.lineWidth = 13; ctx.stroke();
      stick(); ctx.strokeStyle = '#d6a468'; ctx.lineWidth = 7; ctx.save(); ctx.translate(-2, 0); ctx.stroke(); ctx.restore();
      // painted bands and bark scars
      for (let k = 0; k < 16; k++) { const q = G.stick(0.04 + k * 0.06), a = (k % 3 === 0) ? '#b8382a' : '#2a1608'; ctx.strokeStyle = a; ctx.lineWidth = k % 3 === 0 ? 4 : 2; ctx.beginPath(); ctx.moveTo(q.v - 9, q.u); ctx.lineTo(q.v + 9, q.u + 2); ctx.stroke(); }
      ctx.restore();
      // tie cord: the gourd is fastened to stick and wire together just above the mouth
      const tu = gourdU - gourdR * 1.0, ts = G.stick((tu - top) / (bot - top));
      ctx.strokeStyle = '#2a1608'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx + gourdR * 0.2, cy - gourdR * 0.92); ctx.quadraticCurveTo(ts.v, tu, vEnd + 4, tu - 2); ctx.stroke();
      for (let k = 0; k < 5; k++) { ctx.strokeStyle = '#e6d6a8'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(ts.v - 7, tu + k * 3.5 - 7); ctx.lineTo(ts.v + 8, tu + k * 3.5 - 4); ctx.stroke(); }
      // ---- end fittings of the wire --------------------------------------------------------------------------------------------------
      for (const u of [top, bot]) { ctx.fillStyle = '#2a1608'; circ(ctx, vEnd, u, 8); ctx.fill(); ctx.fillStyle = '#d6a468'; circ(ctx, vEnd, u, 4.4); ctx.fill(); }
    },
    front(ctx, G, rt, h) {
      const { W, H, top, bot, vEnd } = G;
      const en = Math.max(0, ...h.K.noteIdx.map((i) => h.e[i]));
      // the wire: bright, ringing with the struck note
      const sty = h.STR_COL.steel;
      const act = h.K.noteIdx.reduce((b, i) => (h.e[i] > (h.e[b] ?? 0) ? i : b), h.K.noteIdx[0]);
      const au = act != null ? h.spots[act].u : (top + bot) / 2;
      const pts = []; const n = 44;
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 4.2; ctx.beginPath(); ctx.moveTo(vEnd + 2, top + 2); ctx.lineTo(vEnd + 2, bot + 2); ctx.stroke();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let k = 0; k <= n; k++) { const s = k / n, u = lerp(top, bot, s), d = 9 * en * Math.sin(Math.PI * s) * Math.cos(rt.anim * 90) * (1 + 0.3 * Math.sin(s * 9)); const x = vEnd + d; if (k === 0) ctx.moveTo(x, u); else ctx.lineTo(x, u); }
      ctx.strokeStyle = en > 0.04 ? '#ffffff' : sty[0]; ctx.lineWidth = 2.8; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
      if (en > 0.05) glow(ctx, vEnd, au, 80, '#ffe4a8', 0.25 * en);
      // the coin: shown pressed against the wire at its lane, or hovering (buzz) with a flutter
      for (const c of G.coins) {
        const f = rt.flash[c.i] * 0.95 + (rt.hold[c.i] ?? 0) * 0.4, r = 19;
        const off = c.kind === 'buzz' ? 6 + Math.sin(rt.anim * 80) * 2.5 * f : 0;
        ctx.save(); ctx.globalAlpha = 0.5 + 0.5 * Math.min(1, f * 1.6);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; circ(ctx, vEnd + 22 + off + 3, c.u + 4, r); ctx.fill();
        ctx.fillStyle = rgrad(ctx, vEnd + 22 + off, c.u, 1, r, [[0, '#fff3c8'], [0.55, '#d6b25a'], [1, '#7a5a1a']], vEnd + 22 + off - r * 0.35, c.u - r * 0.35); circ(ctx, vEnd + 22 + off, c.u, r); ctx.fill();
        ctx.strokeStyle = 'rgba(70,46,10,0.8)'; ctx.lineWidth = 2; ctx.stroke(); ctx.strokeStyle = 'rgba(120,84,20,0.7)'; ctx.lineWidth = 1.3; circ(ctx, vEnd + 22 + off, c.u, r * 0.68); ctx.stroke();
        if (c.kind === 'buzz' && f > 0.05) { ctx.strokeStyle = `rgba(255,236,170,${0.7 * f})`; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(vEnd + 3, c.u - 9 + k * 9); ctx.lineTo(vEnd + 14 + (k % 2) * 4, c.u - 7 + k * 9); ctx.stroke(); } }
        ctx.restore();
      }
      // the baqueta: a thin stick that flicks the wire
      if (act != null && h.e[act] > 0.05) {
        const f = h.e[act], u = au, back = (1 - f) * 40;
        ctx.save(); ctx.translate(vEnd + 6 + back, u + back * 0.5); ctx.rotate(0.14);
        ctx.fillStyle = 'rgba(0,0,0,0.32)'; rrect(ctx, 4, -3, 220, 7, 3); ctx.fill();
        ctx.fillStyle = hgrad(ctx, 0, 220, [[0, '#d8b072'], [1, '#6a4416']]); rrect(ctx, 0, -4, 220, 7, 3.5); ctx.fill();
        ctx.restore();
      }
    },
    special(ctx, G, rt, i, sp, f, h) {
      if (!sp.shake) return false;
      const r = sp.r, sh = Math.sin(rt.anim * 46) * 7 * f, l = h.K.lanes[i];
      ctx.save(); ctx.translate(sp.v + sh, sp.u); ctx.rotate(sh * 0.012);
      // basket rattle: a wicker cone-bowl with a handle on top and a woven pattern
      ctx.fillStyle = 'rgba(0,0,0,0.34)'; ell(ctx, 6, r * 0.62, r * 0.92, r * 0.34); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-r * 0.8, -r * 0.2); ctx.quadraticCurveTo(-r * 0.78, r * 0.62, 0, r * 0.7); ctx.quadraticCurveTo(r * 0.78, r * 0.62, r * 0.8, -r * 0.2); ctx.quadraticCurveTo(0, -r * 0.55, -r * 0.8, -r * 0.2); ctx.closePath();
      ctx.fillStyle = hgrad(ctx, -r, r, [[0, '#6a4416'], [0.35, '#e6c27a'], [0.7, '#b98a3a'], [1, '#5a3810']]); ctx.fill();
      ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(70,40,8,0.55)'; ctx.lineWidth = 1.6;
      for (let k = -8; k <= 8; k++) { ctx.beginPath(); ctx.moveTo(k * r * 0.12, -r * 0.7); ctx.lineTo(k * r * 0.2, r * 0.8); ctx.stroke(); }
      for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(-r, -r * 0.4 + k * r * 0.2); ctx.quadraticCurveTo(0, -r * 0.2 + k * r * 0.2, r, -r * 0.4 + k * r * 0.2); ctx.stroke(); }
      ctx.restore();
      ctx.strokeStyle = '#3a2208'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-r * 0.8, -r * 0.2); ctx.quadraticCurveTo(0, -r * 0.55, r * 0.8, -r * 0.2); ctx.stroke();
      ctx.strokeStyle = '#5a3810'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-r * 0.14, -r * 0.4); ctx.lineTo(-r * 0.12, -r * 0.95); ctx.moveTo(r * 0.14, -r * 0.4); ctx.lineTo(r * 0.12, -r * 0.95); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = rgba(lighter(l.color, 0.4), 0.55 + 0.4 * f); ctx.lineWidth = 3; circ(ctx, sp.v, sp.u, r * 1.15); ctx.stroke();
      h.strikeFx(ctx, rt, i, sp, l.color);
      h.labels.push({ v: sp.v, u: sp.u + r * 1.4, s: l.name, w: 100, col: l.color, f, o: {} });
      return true;
    },
  }),
});

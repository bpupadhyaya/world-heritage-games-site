// Cajon stage (1.11.0): the Peruvian box drum seen from the front. The player sits on the top and strikes the thin front plate (tapa):
// the middle gives the deep bass, the upper edge the sharp slap that sets the snare wires buzzing inside. A round cut-away window in the
// right side shows the snare wires so the buzz can be seen as well as heard. No performer is drawn.
// Lane names pick the zone: bass, tone, slap, ghost, edge (otherwise lanes take them low to high).
import { registerDrumStage } from './registry.js';
import { createDrumStage, rectSpot, assignZones, dropShadow } from './drum-kit.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU } from './drum-kit.js';

const ZONES = [['bass', /bass|dum|low/], ['ghost', /ghost|soft|palm|heel/], ['tone', /tone|open|mid/], ['slap', /slap|snap|high|top|crack/], ['edge', /edge|side|rim|knock/]];

registerDrumStage({
  id: 'cajon', match: /caj[oó]n|box.?drum|cajon.?peruano|cajita/,
  build: (S, lanes, P) => { const zoneOf = []; return createDrumStage('cajon', S, lanes, P, {
    dress: () => ({ kind: 'planks', base: '#3a2a1e', rugKind: 'stripes', rugBase: '#4a1e1e', rugA: '#b8924a', rugB: '#22304a', light: '#ffe2b0' }),
    voiceOf: (i) => `cajon-${zoneOf[i] ?? 'bass'}`,
    build: (K) => {
      const tall = K.tall, tw = tall ? 560 : 660, th = tall ? 610 : 440, ref = tall ? { w: 760, h: 920 } : { w: 960, h: 640 };
      const x0 = -tw / 2 - 22, y0 = ref.h / 2 - th / 2 + 44;   // the front plate; the side panel sits to the right, the seat on top
      const keyOf = assignZones(K, ZONES.map(([key, re]) => ({ key, re })));
      for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const by = {};
      by.bass = rectSpot(x0 + tw * 0.5, y0 + th * 0.58, tw * 0.25, th * 0.2, 0, { rad: 40 });
      by.ghost = rectSpot(x0 + tw * 0.16, y0 + th * 0.78, tw * 0.1, th * 0.12, 0, { rad: 22 });
      by.tone = rectSpot(x0 + tw * 0.5, y0 + th * 0.27, tw * 0.17, th * 0.11, 0, { rad: 24 });
      by.slap = rectSpot(x0 + tw * 0.5, y0 + th * 0.065, tw * 0.42, th * 0.04, 0, { rad: 12 });
      by.edge = rectSpot(x0 + tw + 30, y0 + th * 0.5, 22, th * 0.34, 0, { rad: 12 });
      const spots = new Array(K.N).fill(null);
      for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
      return {
        ref, spots,
        draw(ctx, rt) {
          const fl = (k) => { let m = 0; for (let i = 0; i < K.N; i++) if (keyOf[i] === k) m = Math.max(m, rt.flash[i]); return m; };
          const hit = Math.max(fl('bass'), fl('tone'), fl('ghost')), sl = fl('slap'), buzz = Math.max(sl, hit * 0.4);
          const front = () => rrect(ctx, x0, y0, tw, th, 8);
          const depth = 70, topH = 66;
          dropShadow(ctx, () => rrect(ctx, x0 + 10, y0 + 6, tw + depth, th, 10), 18, 28, 0.42);
          // side panel (darker, in slight perspective)
          ctx.beginPath(); ctx.moveTo(x0 + tw, y0); ctx.lineTo(x0 + tw + depth, y0 - 18); ctx.lineTo(x0 + tw + depth, y0 + th - 14); ctx.lineTo(x0 + tw, y0 + th); ctx.closePath();
          ctx.fillStyle = hgrad(ctx, x0 + tw, x0 + tw + depth, [[0, '#5a2e16'], [0.5, '#6e3a1c'], [1, '#43220f']]); ctx.fill();
          ctx.save(); ctx.clip(); grain(ctx, x0 + tw, y0 - 20, depth, th + 20, '#2a1204', 0.4, 31, true, 8); ctx.restore();
          ctx.strokeStyle = 'rgba(255,214,150,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + tw, y0); ctx.lineTo(x0 + tw + depth, y0 - 18); ctx.stroke();
          // seat on top: a leather pad over the top slab
          ctx.beginPath(); ctx.moveTo(x0 + 4, y0); ctx.lineTo(x0 + tw + depth - 4, y0 - 18); ctx.lineTo(x0 + tw + depth - 26, y0 - 18 - topH); ctx.lineTo(x0 + 30, y0 - topH); ctx.closePath();
          ctx.fillStyle = vgrad(ctx, y0 - topH, y0, [[0, '#7a3a22'], [0.5, '#5a2a18'], [1, '#3a1a0e']]); ctx.fill();
          // a woven Andean manta over the seat: bands of red, ochre, indigo and cream, with a tassel fringe on the front edge
          ctx.save(); ctx.clip();
          const bands = ['#a8322a', '#e0a83a', '#233a6a', '#f0e2c0', '#2a6a4a', '#a8322a'];
          for (let k = 0; k < 18; k++) { const t0 = k / 18, t1 = (k + 1) / 18; ctx.fillStyle = bands[(k * 7) % bands.length]; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.moveTo(x0 + 4 + (tw + depth - 8) * 0, y0 - topH * t0 + (t0 * 0)); ctx.lineTo(x0 + tw + depth - 4 - (t0 * 22), y0 - 18 - (topH - 18) * 0 - topH * t0 + 18 * (1 - t0)); ctx.lineTo(x0 + tw + depth - 4 - (t1 * 22), y0 - 18 - topH * t1 + 18 * (1 - t1)); ctx.lineTo(x0 + 4 + 26 * t1, y0 - topH * t1); ctx.closePath(); ctx.fill(); }
          ctx.globalAlpha = 1; ctx.fillStyle = vgrad(ctx, y0 - topH, y0, [[0, 'rgba(255,255,255,0.18)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.3)']]); ctx.fillRect(x0, y0 - topH - 20, tw + depth, topH + 24); ctx.restore();
          ctx.strokeStyle = '#e8d4a0'; ctx.lineWidth = 3; for (let x = x0 + 8; x < x0 + tw + depth - 8; x += 9) { const yy = y0 - 18 * ((x - x0) / (tw + depth)); ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + 1.5, yy + 12); ctx.stroke(); }
          ctx.strokeStyle = 'rgba(255,200,140,0.35)'; ctx.lineWidth = 2; ctx.stroke();
          ctx.strokeStyle = 'rgba(20,8,2,0.5)'; ctx.setLineDash([7, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + 34, y0 - 8); ctx.lineTo(x0 + tw + depth - 30, y0 - 25); ctx.stroke(); ctx.setLineDash([]);
          // the front plate: pale birch ply in a dark frame, with the sheen of a lit board and the polish where hands land
          const frame = 14;
          ctx.fillStyle = vgrad(ctx, y0, y0 + th, [[0, '#4a2412'], [1, '#2e160a']]); front(); ctx.fill();
          ctx.save(); rrect(ctx, x0 + frame, y0 + frame, tw - 2 * frame, th - 2 * frame, 5); ctx.clip();
          ctx.fillStyle = hgrad(ctx, x0, x0 + tw, [[0, '#d8b27a'], [0.3, '#ecd0a0'], [0.6, '#e2c08a'], [1, '#c89c60']]); ctx.fillRect(x0, y0, tw, th);
          grain(ctx, x0, y0, tw, th, '#7a4a20', 0.34, 12, true, 28);
          ctx.strokeStyle = 'rgba(120,70,30,0.22)'; ctx.lineWidth = 1.2; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.ellipse(x0 + tw * (0.2 + 0.12 * k), y0 + th * (0.2 + 0.1 * ((k * 5) % 7)), 20 + 6 * k, 70 + 10 * k, 0.2, 0, TAU); ctx.stroke(); }
          ctx.fillStyle = rgrad(ctx, x0 + tw * 0.5, y0 + th * 0.55, 10, tw * 0.4, [[0, 'rgba(255,240,200,0.28)'], [1, 'rgba(255,240,200,0)']]); ctx.fillRect(x0, y0, tw, th);
          ctx.fillStyle = vgrad(ctx, y0, y0 + th, [[0, 'rgba(255,255,255,0.14)'], [0.4, 'rgba(255,255,255,0)'], [1, 'rgba(60,30,10,0.22)']]); ctx.fillRect(x0, y0, tw, th);
          // the plate shakes a little when struck
          if (hit > 0.05) { ctx.strokeStyle = `rgba(255,248,226,${0.35 * hit})`; ctx.lineWidth = 3; for (let k = 0; k < 2; k++) { const p = clamp((1 - hit) * 1.2 - k * 0.2, 0, 1); rrect(ctx, x0 + frame + 20 + p * 60, y0 + frame + 20 + p * 60, tw - 2 * frame - 40 - p * 120, th - 2 * frame - 40 - p * 120, 24); ctx.stroke(); } }
          ctx.restore();
          ctx.strokeStyle = 'rgba(255,214,150,0.4)'; ctx.lineWidth = 2; rrect(ctx, x0 + frame - 1, y0 + frame - 1, tw - 2 * frame + 2, th - 2 * frame + 2, 5); ctx.stroke();
          // brass screws in the four corners and along the top edge (they hold the plate on and let it be tuned)
          for (const [sx, sy] of [[0.04, 0.05], [0.96, 0.05], [0.04, 0.95], [0.96, 0.95], [0.5, 0.035], [0.27, 0.035], [0.73, 0.035]]) {
            const x = x0 + tw * sx, y = y0 + th * sy;
            ctx.fillStyle = 'rgba(0,0,0,0.45)'; circ(ctx, x + 1.5, y + 2.5, 7.5); ctx.fill();
            ctx.fillStyle = rgrad(ctx, x, y, 0, 8, [[0, '#fff0b0'], [0.6, '#c9a045'], [1, '#6a4a14']], x - 2, y - 2.5); circ(ctx, x, y, 7); ctx.fill();
            ctx.strokeStyle = 'rgba(60,36,6,0.8)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - 4, y - 1); ctx.lineTo(x + 4, y + 2); ctx.stroke();
          }
          // cut-away window in the side panel: the snare wires inside
          const wx = x0 + tw + depth * 0.5, wy = y0 + th * 0.2, wr = 27;
          ctx.fillStyle = 'rgba(0,0,0,0.5)'; circ(ctx, wx + 2, wy + 3, wr + 5); ctx.fill();
          ctx.fillStyle = '#7a5a2a'; circ(ctx, wx, wy, wr + 4); ctx.fill();
          ctx.fillStyle = rgrad(ctx, wx - 6, wy - 8, 2, wr, [[0, '#2a2018'], [1, '#0a0604']]); circ(ctx, wx, wy, wr); ctx.fill();
          ctx.save(); circ(ctx, wx, wy, wr - 1); ctx.clip();
          for (let k = -3; k <= 3; k++) { const y = wy + k * 7; ctx.strokeStyle = k % 2 ? '#d9dde4' : '#b87a3a'; ctx.lineWidth = 1.7; ctx.beginPath(); for (let s = 0; s <= 24; s++) { const x = wx - wr + (s / 24) * wr * 2, a = buzz * 4.5 * Math.sin(s * 1.3 + rt.anim * 60 + k); if (s === 0) ctx.moveTo(x, y + a); else ctx.lineTo(x, y + a * Math.sin(Math.PI * s / 24) + 0.0); } ctx.stroke(); }
          ctx.fillStyle = 'rgba(255,255,255,0.12)'; ell(ctx, wx - 8, wy - 11, 12, 6); ctx.fill();
          ctx.restore();
          ctx.strokeStyle = 'rgba(255,230,170,0.55)'; ctx.lineWidth = 2.4; circ(ctx, wx, wy, wr + 2); ctx.stroke();
          void mix; void rgba; void lighter; void darker; void hash;
        },
      };
    },
  }); },
});

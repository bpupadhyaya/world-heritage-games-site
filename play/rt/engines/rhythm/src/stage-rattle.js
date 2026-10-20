// Gourd rattle stage (1.11.0): the shekere (West Africa, Cuba, Brazil). A dried gourd wrapped in a loose net of beads: shaken, the beads rattle;
// struck with the fingertips or the heel of the hand on the base, it thumps. Lanes: Shake (the beads), Slap (the net on the belly),
// Bass (the base of the gourd), Roll (the net slid round the gourd). The net swings and the beads dance after every stroke.
// No performer is drawn.
import { registerDrumStage } from './registry.js';
import { createDrumStage, eSpot, eRing, eSector, assignZones, dropShadow } from './drum-kit.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU } from './drum-kit.js';

const ZONES = [['bass', /bass|thump|base|dum/], ['slap', /slap|hit|tap|pop/], ['roll', /roll|twist|turn|slide/], ['shake', /shake|rattle|chk|shk/]];
const lerp = (a, b, t) => a + (b - a) * t;

registerDrumStage({
  id: 'shekere', match: /shek[eé]r[eé]|axatse|chekere|cabasa|gourd.?rattle|agbe|bead.?rattle/,
  build: (S, lanes, P) => { const zoneOf = []; return createDrumStage('shekere', S, lanes, P, {
    dress: () => ({ kind: 'planks', base: '#3a2414', rugKind: 'kente', rugBase: '#2a1a12', rugA: '#e0a83a', rugB: '#a8322a', light: '#ffe0a8' }),
    voiceOf: (i) => `shekere-${zoneOf[i] ?? 'shake'}`,
    build: (K) => {
      const ref = K.tall ? { w: 640, h: 820 } : { w: 760, h: 600 }, cx = 0, cy = ref.h / 2 + 14, R = K.tall ? 250 : 215, top = cy - R * 1.2, bot = cy + R * 1.0;
      const rAt = (t) => { const b = R * Math.sqrt(Math.max(0, 1 - ((t - 0.64) / 0.38) ** 2)), nk = R * (0.15 + 0.04 * (1 - t)); return Math.max(nk, b * 0.985 + nk * 0.0); };
      const keyOf = assignZones(K, ZONES.map(([key, re]) => ({ key, re })));
      for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const yAt = (t) => lerp(top, bot, t);
      const by = {};
      by.bass = eSpot(cx, yAt(0.88), R * 0.5, R * 0.2, 0, { apk: 1.0 });
      by.slap = eSpot(cx - R * 0.42, yAt(0.58), R * 0.32, R * 0.3, 0, { apk: 1.0 });
      by.roll = eSpot(cx + R * 0.42, yAt(0.58), R * 0.32, R * 0.3, 0, { apk: 1.0 });
      by.shake = eSpot(cx, yAt(0.3), R * 0.5, R * 0.22, 0, { apk: 1.0 });
      const spots = new Array(K.N).fill(null);
      for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
      return { ref, spots,
        draw(ctx, rt) {
          const fl = (k) => { let m = 0; for (let i = 0; i < K.N; i++) if (keyOf[i] === k) m = Math.max(m, rt.flash[i]); return m; };
          const sh = Math.max(fl('shake'), fl('roll') * 0.8, fl('slap') * 0.5), tw = fl('roll'), th = fl('bass');
          const body = () => { ctx.beginPath(); for (let k = 0; k <= 40; k++) { const t = k / 40; ctx.lineTo(cx - rAt(t), yAt(t)); } for (let k = 40; k >= 0; k--) { const t = k / 40; ctx.lineTo(cx + rAt(t), yAt(t)); } ctx.closePath(); };
          dropShadow(ctx, body, 18, 26, 0.42);
          // the gourd: dry skin, orange to brown, with a lit side and a base ring
          body(); ctx.fillStyle = hgrad(ctx, cx - R, cx + R, [[0, '#6a3a14'], [0.2, '#d8963e'], [0.4, '#f0b862'], [0.62, '#c47c2e'], [0.85, '#7a4416'], [1, '#4a2808']]); ctx.fill();
          ctx.save(); body(ctx); ctx.clip();
          for (let k = 0; k < 90; k++) { const x = cx + (hash(k) - 0.5) * 2 * R, y = lerp(top, bot, hash(k + 50)); ctx.fillStyle = `rgba(70,36,8,${0.05 + 0.1 * hash(k + 9)})`; ell(ctx, x, y, 2 + 6 * hash(k + 3), 1.4 + 3 * hash(k + 7)); ctx.fill(); }
          // sphere shading: a lit upper-left shoulder, a darker rim, ridges that follow the gourd and a hard specular glint
          ctx.fillStyle = rgrad(ctx, cx - R * 0.34, yAt(0.5), 0, R * 1.05, [[0, 'rgba(255,244,214,0.5)'], [0.45, 'rgba(255,230,170,0.12)'], [1, 'rgba(30,10,0,0.45)']]); ctx.fillRect(cx - R, top, 2 * R, bot - top);
          ctx.strokeStyle = 'rgba(70,34,6,0.28)'; ctx.lineWidth = 1.6; for (let k = -5; k <= 5; k++) { ctx.beginPath(); for (let u = 0; u <= 30; u++) { const t = u / 30, x = cx + rAt(t) * Math.sin(k * 0.28), y = yAt(t); if (u === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); }
          ctx.fillStyle = 'rgba(255,255,244,0.5)'; ell(ctx, cx - R * 0.46, yAt(0.5), R * 0.07, R * 0.26); ctx.fill(); ctx.fillStyle = 'rgba(255,255,244,0.28)'; ell(ctx, cx - R * 0.58, yAt(0.62), R * 0.035, R * 0.12); ctx.fill();
          ctx.fillStyle = rgrad(ctx, cx - R * 0.3, yAt(0.45), 0, R * 0.9, [[0, 'rgba(255,240,200,0.18)'], [1, 'rgba(255,240,200,0)']]); ctx.fillRect(cx - R, top, 2 * R, bot - top);
          ctx.fillStyle = vgrad(ctx, top, bot, [[0, 'rgba(0,0,0,0.35)'], [0.25, 'rgba(0,0,0,0)'], [0.8, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.4)']]); ctx.fillRect(cx - R, top, 2 * R, bot - top);
          ctx.restore();
          // neck cord and tied end
          ctx.fillStyle = vgrad(ctx, top - 18, top + 14, [[0, '#d8b27a'], [1, '#7a5a2c']]); rrect(ctx, cx - rAt(0) - 4, top - 14, 2 * rAt(0) + 8, 26, 9); ctx.fill();
          ctx.strokeStyle = '#4a2a10'; ctx.lineWidth = 2; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(cx - rAt(0) + k * rAt(0) / 3, top - 12); ctx.lineTo(cx - rAt(0) + k * rAt(0) / 3 + 6, top + 10); ctx.stroke(); }
          // the bead net: a diamond lattice on the surface (theta, t); it swings a little with the shake and slides round when rolled
          const nI = 11, nJ = 11, dth = 0.27, dt = 0.05, t0 = 0.3, swing = Math.sin(rt.anim * 40) * sh * 0.12 + tw * 0.5, sag = Math.sin(rt.anim * 32 + 1) * sh * 4;
          const P = (i, j) => { const th0 = (i - j) * dth + swing, t = t0 + (i + j) * dt; if (t > 0.97 || Math.abs(th0) > 1.5) return null; const r = rAt(t) + 3 + sag * Math.cos(th0); return { x: cx + r * Math.sin(th0), y: yAt(t) + sag * 0.6, c: Math.cos(th0), t }; };
          const pts = []; for (let i = 0; i < nI; i++) for (let j = 0; j < nJ; j++) pts.push([i, j, P(i, j)]);
          ctx.lineCap = 'round';
          for (const [i, j, a] of pts) { if (!a) continue; for (const [di, dj] of [[1, 0], [0, 1]]) { const b = P(i + di, j + dj); if (!b || Math.min(a.c, b.c) < 0.08) continue; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(a.x + 1.5, a.y + 2); ctx.lineTo(b.x + 1.5, b.y + 2); ctx.stroke(); ctx.strokeStyle = '#efe4c8'; ctx.lineWidth = 1.7; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }
          const bc = ['#f6f2e6', '#e3d6b4', '#9ec8d8'];
          for (const [i, j, a] of pts) { if (!a || a.c < 0.1) continue; const rr = (6.5 + 5 * a.c) * (R / 250 * 0.9 + 0.1); ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, a.x + 1.6, a.y + 2.4, rr); ctx.fill();
            const col = bc[(i * 3 + j * 5) % 3]; ctx.fillStyle = rgrad(ctx, a.x, a.y, 0, rr * 1.1, [[0, '#ffffff'], [0.5, col], [1, darker(col, 0.45)]], a.x - rr * 0.3, a.y - rr * 0.35); circ(ctx, a.x, a.y, rr); ctx.fill();
            if (sh > 0.25 && (i + j) % 3 === 0) { ctx.fillStyle = `rgba(255,255,255,${0.7 * sh})`; circ(ctx, a.x - rr * 0.3, a.y - rr * 0.3, rr * 0.28); ctx.fill(); } }
          // the base ring pressed by the palm: a dark disc that flexes
          ctx.fillStyle = `rgba(30,12,2,${0.25 + 0.3 * th})`; ell(ctx, cx, yAt(0.95), R * 0.34, R * 0.1); ctx.fill();
          void mix; void rgba; void lighter; void hgrad; void grain; void eRing; void eSector;
        } };
    },
  }); },
});

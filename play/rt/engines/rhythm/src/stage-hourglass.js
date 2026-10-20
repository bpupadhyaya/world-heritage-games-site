// Hourglass drum stage (1.11.0): the talking drum (dundun, gangan, tama of West Africa). A waisted wooden drum with a skin at each end,
// the skins pulled together by leather cords. The drum is struck with a curved stick while the arm squeezes the cords: a harder squeeze
// tightens the skin and raises the pitch, so a stroke can glide up or down like a spoken tone.
// Lanes: a lane whose name says "stick", "open", "slap" or "beat" is the right head (an open stroke, no squeeze); every other lane is a
// squeeze place along the cords, ordered by pitch from the loose end (low) to the tight end (high). A stroke glides from the pitch of the
// phrase's previous stroke to its own. No performer is drawn: the cords draw tight as the squeeze rises.
import { registerDrumStage } from './registry.js';
import { createDrumStage, eSpot, rectSpot, rot2, skinHead, hoop, tubeShade, barrelPath, vStraps, beater, dropShadow } from './drum-kit.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU } from './drum-kit.js';

const lerp = (a, b, t) => a + (b - a) * t;
const D = { L: 620, R: 148, waist: 46, kx: 0.46, wood: '#8a4a22', seed: 61 };

registerDrumStage({
  id: 'talking', match: /talking.?drum|dundun|dun.?dun|gangan|tama\b|donno|dondo|hourglass|pressure.?drum|kalangu|lunna|odondo/,
  build: (S, lanes, P) => { const kindOf = []; return createDrumStage('talking', S, lanes, P, {
    dress: () => ({ kind: 'planks', base: '#4a2c1a', rugKind: 'kente', rugBase: '#2a1a14', rugA: '#8a6a30', rugB: '#1a3a2e', light: '#ffd9a0' }),
    voiceOf: (i) => (kindOf[i] === 'open' ? 'talk-open' : 'talk-squeeze'),
    build: (K) => {
      const ref = K.tall ? { w: 560, h: 900 } : { w: 1000, h: 520 };
      const ang = K.tall ? -1.05 : -0.08, cx = 0, cy = ref.h / 2;
      const R = (x, y) => { const [a, b] = rot2(x, y, ang); return [cx + a, cy + b]; };
      const head = []; const sq = [];
      K.order.forEach((i) => { if (/stick|open|slap|beat|head|strike/.test(K.nm(i))) head.push(i); else sq.push(i); });
      const rAt = (t, s = 0) => lerp(D.waist * (1 - 0.3 * s), D.R * 1.03, Math.pow(Math.abs(2 * t - 1), 1.7)) + 6;
      const spots = new Array(K.N).fill(null), n = sq.length, hw = Math.min(D.L * 0.058, D.L * 0.4 / Math.max(1, n));
      sq.forEach((i, r) => { const t = n > 1 ? lerp(0.22, 0.78, r / (n - 1)) : 0.5, [x, y] = R(lerp(-D.L / 2, D.L / 2, t), 0); spots[i] = rectSpot(x, y, hw, rAt(t) * 0.8, ang, { rad: 14 }); kindOf[i] = 'sq'; });
      const [rx0, ry0] = R(D.L / 2, 0);
      head.forEach((i, r) => { spots[i] = eSpot(rx0, ry0, D.R * D.kx * 0.7, D.R * 0.62, ang, { apk: 0.95 }); kindOf[i] = 'open'; void r; });
      return {
        ref, spots,
        draw(ctx, rt) {
          // squeeze: the flash-weighted position of the lit squeeze lanes (0 loose .. 1 tight)
          let wsum = 0, wt = 0, fo = 0;
          sq.forEach((i, r) => { const f = rt.flash[i]; wsum += f; wt += f * (n > 1 ? r / (n - 1) : 0.5); });
          head.forEach((i) => { fo = Math.max(fo, rt.flash[i]); });
          const s = wsum > 0.01 ? clamp(wt / wsum * Math.min(1, wsum) + 0.0, 0, 1) * 0.9 + 0.1 : 0;
          const xL = -D.L / 2 + s * 8, xR = D.L / 2 - s * 8, rxe = D.R * D.kx;
          const r = (t) => rAt(t, s);
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
          // the curved stick lying by the drum: a thick hooked branch with a lit edge
          ctx.save(); ctx.translate(-250, D.R + 64); ctx.rotate(-0.03);
          const stk = () => { ctx.beginPath(); ctx.moveTo(-10, 6); ctx.quadraticCurveTo(170, -8, 300, -38); ctx.quadraticCurveTo(352, -52, 346, -100); };
          ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.32)'; ctx.lineWidth = 20; ctx.save(); ctx.translate(8, 12); stk(); ctx.stroke(); ctx.restore();
          ctx.strokeStyle = '#4a2a12'; ctx.lineWidth = 19; stk(); ctx.stroke();
          ctx.strokeStyle = '#8a5a2c'; ctx.lineWidth = 14; stk(); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,220,160,0.55)'; ctx.lineWidth = 4; ctx.save(); ctx.translate(-2, -4); stk(); ctx.stroke(); ctx.restore();
          ctx.restore();
          const body = barrelPath(xL + rxe * 0.2, xR - rxe * 0.2, r, 60);
          dropShadow(ctx, body, 16, 26, 0.42);
          tubeShade(ctx, body, D.R + 20, D.wood, { hl: 0.3, dark: 0.34, spec: 0.28 });
          ctx.save(); body(ctx); ctx.clip();
          grain(ctx, xL, -D.R - 10, D.L, 2 * D.R + 20, darker(D.wood, 0.75), 0.4, D.seed, false, 24);
          // carved bands near each end
          ctx.strokeStyle = 'rgba(30,14,4,0.5)'; ctx.lineWidth = 2.6; for (const t of [0.08, 0.13, 0.87, 0.92]) { const x = lerp(xL, xR, t); ctx.beginPath(); ctx.ellipse(x, 0, r(t) * 0.1, r(t), 0, 0, TAU); ctx.stroke(); }
          // a band of dark stitched leather round the waist with brass studs, and two bands of cowrie-white beads near the ends
          for (const [t0, t1] of [[0.4, 0.6]]) { const xa = lerp(xL, xR, t0), xb = lerp(xL, xR, t1); ctx.fillStyle = vgrad(ctx, -D.R, D.R, [[0, '#4a2a14'], [0.3, '#8a5a30'], [0.6, '#5a3418'], [1, '#2a1608']]); ctx.fillRect(xa, -D.R * 1.2, xb - xa, D.R * 2.4);
            ctx.strokeStyle = 'rgba(255,230,180,0.5)'; ctx.lineWidth = 1.6; ctx.setLineDash([6, 5]); for (const x of [xa + 8, xb - 8]) { ctx.beginPath(); ctx.moveTo(x, -D.R * 1.2); ctx.lineTo(x, D.R * 1.2); ctx.stroke(); } ctx.setLineDash([]);
            for (let k = -5; k <= 5; k++) { const y = k * r(0.5) * 0.17; ctx.fillStyle = rgrad(ctx, (xa + xb) / 2 - 2, y - 2, 0, 7, [[0, '#fff0b0'], [0.6, '#c9a045'], [1, '#6a4a14']]); circ(ctx, (xa + xb) / 2, y, 5); ctx.fill(); } }
          for (const t of [0.17, 0.83]) { const x = lerp(xL, xR, t); for (let k = -7; k <= 7; k++) { const y = k * r(t) * 0.13; ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, x + 1.5, y + 2.5, 5, 7); ctx.fill(); ctx.fillStyle = rgrad(ctx, x - 1.5, y - 2, 0, 8, [[0, '#ffffff'], [0.6, '#efe6d0'], [1, '#a89c80']]); ell(ctx, x, y, 4.6, 6.6); ctx.fill(); } }
          ctx.restore();
          // cords
          vStraps(ctx, { xL, xR, rAt: r, n: 10, col: '#e2c28a', w: 6.5, rL: D.R + 8, rR: D.R + 8, aL: rxe * 0.1, aR: rxe * 0.1 });
          // the heads: leather rings and thin skins
          for (const [x, face] of [[xL, -1], [xR, 1]]) {
            ctx.save(); ctx.translate(x, 0);
            ctx.fillStyle = rgrad(ctx, -face * rxe * 0.2, 0, D.R * 0.6, D.R + 24, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.26)']]); ell(ctx, -face * rxe * 0.35, 0, rxe * 1.5 + 20, D.R + 22); ctx.fill();
            hoop(ctx, rxe, D.R, 14, { kind: 'rope', col: '#7a4a24', seed: 5 + face });
            skinHead(ctx, rxe, D.R, { tint: '#e9d8b0', edge: '#a88a58', seed: 17 + face, vib: face > 0 ? fo : 0, paste: [{ r: 0.2, dx: 0, col: '#4a3220' }], wear: 0.6 });
            ctx.restore();
          }
          ctx.restore();
        },
      };
    },
  }); },
});
void beater; void mix; void rgba; void lighter; void hgrad; void vgrad; void rrect; void circ; void hash;

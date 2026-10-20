// Jaw harp (mouth harp) stages (1.10.0): murchunga (Nepal: heavy horseshoe frame, brass-wound) and khomus (Sakha: long slim frame with an
// eyelet). The frame sounds ONE note (the tongue); the player's mouth picks out its harmonics. So the lanes are the harmonics, shown on a
// rising ladder inside a dark mouth-cavity space, and a plucked frame sits below. No face is drawn, only the resonance space.
import { clamp, mix, rgba, lighter, darker, rrect, circ, ell, hgrad, vgrad, rgrad, hash, TAU } from './instr-art.js';
import { shadow, metalGrad } from './instr-art.js';
import { registerStringStage } from './registry.js';
import { createBoardStage } from './board-kit.js';
import { glow } from './art.js';
import { lerp } from './stagekit.js';

const rank = (K) => K.noteIdx.slice().sort((a, b) => K.lanes[a].hz - K.lanes[b].hz);

const LOOK = {
  khomus: { frame: '#9aa3b4', hi: '#ffffff', wind: '#d9d9e2', armW: 11, aw: 0.115, len: 0.43, loop: 'ogive', voice: 'jawharp-steel', hue: '#1a2434' },
  murchunga: { frame: '#5b5f68', hi: '#c9ccd4', wind: '#c79a3a', armW: 15, aw: 0.17, len: 0.34, loop: 'round', voice: 'jawharp-iron', hue: '#241a34' },
};

for (const [id, o] of Object.entries(LOOK)) {
  registerStringStage({
    id, match: id === 'murchunga' ? /murchunga|morchang|morsing|jaw.?harp(?!.*(khomus|sakha))|mouth.?harp(?!.*(khomus|sakha))|jew.?s.?harp|vargan/ : /khomus|khomuz|komuz.?sakha|sakha|yakut/,
    build: (S, lanes, P) => createBoardStage(id, S, lanes, P, {
      material: 'steel', voiceOf: () => o.voice, sustained: true,
      layout(F, K) {
        const { W, H } = F;
        const aw = W * o.aw, uLoop = H * 0.955, armLen = H * o.len, uArm = uLoop - armLen, tipU = uArm - H * 0.045;
        const G = { W, H, aw, uLoop, uArm, tipU, cavU: H * 0.27 };
        const order = rank(K), n = order.length, strings = new Array(K.N).fill(null);
        // the harmonic ladder rises from the lowest lane at the bottom (near the frame) to the highest at the top, zig-zagging so the names never touch
        order.forEach((i, r) => {
          const f = n > 1 ? r / (n - 1) : 0.5, zig = (r % 2 ? 1 : -1) * W * 0.085;
          const v = lerp(-W * 0.3, W * 0.3, f) + zig * 0.6, u = lerp(H * 0.42, H * 0.075, f);
          strings[i] = { v0: 0, u0: tipU, v1: v, u1: u, sv: v, su: u, r: 25, hide: true };
        });
        G.order = order.map((i) => strings[i]);
        return { G, strings, top: tipU };
      },
      back(ctx, G, rt, h) {
        const { W, H, aw, uLoop, uArm, tipU } = G;
        const e = Math.max(0, ...h.K.noteIdx.map((i) => h.e[i]));
        // ---- the mouth cavity: a deep resonant space, brighter where the sounding harmonic sits -----------------------------------
        const cy = H * 0.245, rx = W * 0.47, ry = H * 0.235;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 6, cy + 10, rx, ry); ctx.fill();
        ctx.fillStyle = rgrad(ctx, 0, cy, 0, rx, [[0, mix(o.hue, '#000000', 0.2)], [0.65, mix(o.hue, '#000000', 0.55)], [1, mix(o.hue, '#000000', 0.8)]], 0, cy - ry * 0.25);
        ell(ctx, 0, cy, rx, ry); ctx.fill();
        ctx.strokeStyle = 'rgba(180,170,230,0.28)'; ctx.lineWidth = 3; ell(ctx, 0, cy, rx, ry); ctx.stroke();
        for (const k of [0.78, 0.56, 0.34]) { ctx.strokeStyle = `rgba(180,170,230,${0.1 + 0.05 * (1 - k)})`; ctx.lineWidth = 1.5; ell(ctx, 0, cy, rx * k, ry * k); ctx.stroke(); }
        ctx.restore();
        // the harmonic curve through the lanes, and a band of light at the sounding lane
        const pts = G.order;
        ctx.save(); ctx.strokeStyle = 'rgba(230,220,255,0.28)'; ctx.lineWidth = 2; ctx.setLineDash([3, 7]); ctx.beginPath();
        pts.forEach((p, k) => { if (k === 0) ctx.moveTo(p.sv, p.su); else ctx.lineTo(p.sv, p.su); }); ctx.stroke(); ctx.restore();
        h.K.noteIdx.forEach((i) => {
          const f = rt.flash[i] * 0.9 + (rt.hold[i] ?? 0) * 0.4, s = h.spots[i];
          if (f > 0.02 && s) { ctx.save(); ctx.globalAlpha = Math.min(1, f); const g2 = ctx.createLinearGradient(0, s.u - 28, 0, s.u + 28); g2.addColorStop(0, 'rgba(255,230,160,0)'); g2.addColorStop(0.5, 'rgba(255,230,160,0.5)'); g2.addColorStop(1, 'rgba(255,230,160,0)'); ctx.fillStyle = g2; ctx.fillRect(-rx * 0.8, s.u - 28, rx * 1.6, 56); ctx.restore(); }
        });
        // ---- the frame -------------------------------------------------------------------------------------------------------------
        const frame = () => {
          ctx.beginPath();
          if (o.loop === 'round') { ctx.moveTo(-aw, uArm); ctx.lineTo(-aw, uLoop - aw); ctx.arc(0, uLoop - aw, aw, Math.PI, 0, true); ctx.lineTo(aw, uArm); }
          else { ctx.moveTo(-aw, uArm); ctx.lineTo(-aw, uLoop - aw * 2.6); ctx.bezierCurveTo(-aw, uLoop - aw * 0.8, -aw * 0.4, uLoop - 4, 0, uLoop); ctx.bezierCurveTo(aw * 0.4, uLoop - 4, aw, uLoop - aw * 0.8, aw, uLoop - aw * 2.6); ctx.lineTo(aw, uArm); }
        };
        ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.translate(7, 10); frame(); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = o.armW + 4; ctx.stroke(); ctx.translate(-7, -10);
        frame(); ctx.strokeStyle = darker(o.frame, 0.5); ctx.lineWidth = o.armW + 3; ctx.stroke();
        frame(); ctx.strokeStyle = metalGrad(ctx, -aw - 8, aw + 8, o.frame); ctx.lineWidth = o.armW; ctx.stroke();
        frame(); ctx.strokeStyle = rgba(o.hi, 0.55); ctx.lineWidth = 2.2; ctx.save(); ctx.translate(-o.armW * 0.22, 0); ctx.stroke(); ctx.restore();
        ctx.restore();
        // the wound wire at the loop (murchunga) or the ring through the eyelet (khomus)
        if (id === 'murchunga') {
          for (let k = 0; k < 7; k++) { const u = uLoop - aw * 1.4 - k * 7; ctx.strokeStyle = k % 2 ? darker(o.wind, 0.3) : lighter(o.wind, 0.25); ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(-aw - 8, u); ctx.lineTo(-aw + 8, u + 2); ctx.moveTo(aw - 8, u + 2); ctx.lineTo(aw + 8, u); ctx.stroke(); }
        } else {
          ctx.strokeStyle = darker(o.frame, 0.4); ctx.lineWidth = 7; circ(ctx, 0, uLoop + 14, 16); ctx.stroke();
          ctx.strokeStyle = metalGrad(ctx, -18, 18, '#c9cdd8'); ctx.lineWidth = 5; ctx.stroke();
          // engraved line along the arms
          ctx.strokeStyle = 'rgba(30,40,60,0.55)'; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(-aw, uArm + 20); ctx.lineTo(-aw, uLoop - aw * 3); ctx.moveTo(aw, uArm + 20); ctx.lineTo(aw, uLoop - aw * 3); ctx.stroke(); ctx.setLineDash([]);
        }
        // ---- the tongue: a steel strip anchored in the loop, free in the gap, its tip bent outward as a trigger ----------------------
        const base = uLoop - aw * (id === 'murchunga' ? 0.55 : 1.9), amp = 9 * Math.min(1, e), ph = rt.anim * 90;
        const tongue = (dx, w, col) => {
          ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, base);
          for (let k = 1; k <= 14; k++) { const t = k / 14, u = lerp(base, tipU + 8, t); ctx.lineTo(Math.sin(ph) * amp * t * t + dx, u); }
          const tx = Math.sin(ph) * amp + dx; ctx.quadraticCurveTo(tx + aw * 0.3, tipU - 2, tx + aw * 0.75, tipU - 18); ctx.stroke();
        };
        ctx.save();
        tongue(3, 11, 'rgba(0,0,0,0.38)');
        if (amp > 1) { tongue(-amp * 0.35, 5, 'rgba(210,214,224,0.25)'); tongue(amp * 0.35, 5, 'rgba(210,214,224,0.25)'); }
        tongue(0, 10, darker(o.frame, 0.25)); tongue(0, 7, o.frame); tongue(-1.6, 3, lighter(o.hi, 0.2));
        ctx.restore();
        // twang: rings of sound leaving the tongue
        if (e > 0.04) for (let k = 0; k < 3; k++) { const p = ((rt.anim * 1.6 + k / 3) % 1); ctx.strokeStyle = `rgba(255,236,170,${(1 - p) * 0.4 * e})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, tipU, 26 + p * 90, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke(); }
        glow(ctx, 0, tipU - 6, 90, '#ffe4a8', 0.22 * e);
        // the plucking fingertip at the trigger
        if (e > 0.05) { h.finger(ctx, aw * 1.45 + (1 - e) * 16, tipU - 18 + (1 - e) * 8, e); }
      },
    }),
  });
}

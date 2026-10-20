// Bar instruments, figure-free (1.15.0): gender (bronze bars over tube resonators in a carved frame), ranat (wooden bars in a boat-shaped trough),
// marimba (rosewood bars over tuned metal tubes on a stand) and silimba (wooden bars over mirliton gourds on a lashed frame). The player is shown by the arms,
// hands and mallets only (no torso slab); the surface is a printed batik cloth, a boat-shaped hull on planks, a draped cloth or a woven reed mat.
// Added through the key-scene registry in keys.js (KEY_SCENES); every other keyed instrument keeps its 1.14.0 drawing.
import { clamp, mix, rgba, lighter, darker, glow, rrect, grain, hgrad, vgrad, rgrad, ell, circ, TAU } from './art.js';
import { rectSpot, lerp } from './stagekit.js';
import { registerKeyStage } from './registry.js';
import { KEY_SCENES } from './keys.js';

registerKeyStage({ id: 'marimba', match: /marimba/ });
registerKeyStage({ id: 'silimba', match: /silimba/ });

const BRONZE = [[0, '#4a3010'], [0.3, '#f0d890'], [0.65, '#b08a3c'], [1, '#3a2408']];
const STEEL = [[0, '#2c323a'], [0.28, '#f4f7fa'], [0.62, '#a4adb8'], [1, '#2a2f36']];

// a resonator tube: shadow, lit metal, a dark mouth where it faces its bar, and a thin rim ring
function pipe(ctx, x, y, w, len, vertical, stops, flare = 0) {
  ctx.fillStyle = 'rgba(0,0,0,0.34)'; rrect(ctx, x + 5, y + 7, vertical ? w : len, vertical ? len : w, w * 0.3); ctx.fill();
  const g = vertical ? hgrad(ctx, x, x + w, stops) : vgrad(ctx, y, y + w, stops);
  ctx.fillStyle = g; rrect(ctx, x, y, vertical ? w : len, vertical ? len : w, w * 0.3); ctx.fill();
  ctx.strokeStyle = 'rgba(255,240,200,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#100a05';
  if (vertical) { ell(ctx, x + w / 2, y + w * 0.16, w * 0.36, w * 0.13); ctx.fill(); } else { ell(ctx, x + len - w * 0.16, y + w / 2, w * 0.13, w * 0.36); ctx.fill(); }
  ctx.strokeStyle = 'rgba(30,18,6,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); if (vertical) { ctx.moveTo(x + 2, y + len * 0.86); ctx.lineTo(x + w - 2, y + len * 0.86); } else { ctx.moveTo(x + len * 0.86, y + 2); ctx.lineTo(x + len * 0.86, y + w - 2); } ctx.stroke();
  void flare;
}

// a wooden rail or pole with a lit edge
function rail(ctx, x, y, w, h, vertical, col, r = 10) {
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, x + 6, y + 6, w, h, r); ctx.fill();
  ctx.fillStyle = vertical ? hgrad(ctx, x, x + w, [[0, lighter(col, 0.3)], [1, darker(col, 0.7)]]) : vgrad(ctx, y, y + h, [[0, lighter(col, 0.3)], [1, darker(col, 0.7)]]); rrect(ctx, x, y, w, h, r); ctx.fill();
  ctx.fillStyle = 'rgba(255,235,190,0.28)'; if (vertical) ctx.fillRect(x + w * 0.2, y + r * 0.5, w * 0.14, h - r); else ctx.fillRect(x + r * 0.5, y + h * 0.2, w - r, h * 0.14);
}

// one carved, gold-leafed spiral
function spiral(ctx, cx, cy, r, dir) {
  ctx.beginPath();
  for (let k = 0; k <= 44; k++) { const a = k * 0.29 * dir, rr = r * (1 - k / 52); ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  ctx.stroke();
}
// an upright end panel of a carved frame: red lacquer, a gold rim, a column of mirrored scrolls and a lotus knob on top; `vertical` false turns it on its side
function panel(ctx, x, y, w, h, vertical, base, gold) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2); if (!vertical) ctx.rotate(-Math.PI / 2);
  const pw = vertical ? w : h, ph = vertical ? h : w;
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, -pw / 2 + 7, -ph / 2 + 9, pw, ph, pw * 0.3); ctx.fill();
  ctx.fillStyle = hgrad(ctx, -pw / 2, pw / 2, [[0, lighter(base, 0.2)], [0.5, base], [1, darker(base, 0.55)]]); rrect(ctx, -pw / 2, -ph / 2, pw, ph, pw * 0.3); ctx.fill();
  ctx.strokeStyle = gold; ctx.lineWidth = 4; rrect(ctx, -pw / 2 + 3, -ph / 2 + 3, pw - 6, ph - 6, pw * 0.26); ctx.stroke();
  ctx.strokeStyle = rgba(gold, 0.55); ctx.lineWidth = 1.6; rrect(ctx, -pw / 2 + 9, -ph / 2 + 9, pw - 18, ph - 18, pw * 0.2); ctx.stroke();
  ctx.save(); rrect(ctx, -pw / 2 + 4, -ph / 2 + 4, pw - 8, ph - 8, pw * 0.25); ctx.clip();
  const cell = pw * 0.86, n = Math.max(1, Math.floor((ph - 40) / cell)), y0 = -((n - 1) * cell) / 2;
  ctx.strokeStyle = gold; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  for (let k = 0; k < n; k++) {
    const cy = y0 + k * cell, r = pw * 0.2;
    spiral(ctx, -pw * 0.2, cy, r, 1); spiral(ctx, pw * 0.2, cy, r, -1);
    ctx.fillStyle = gold; circ(ctx, 0, cy + r * 0.5, pw * 0.055); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, cy - cell * 0.4); ctx.lineTo(0, cy - r * 0.1); ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = rgrad(ctx, 0, -ph / 2 - 6, 0, pw * 0.34, [[0, '#fff0b8'], [0.6, gold], [1, darker(gold, 0.5)]], -pw * 0.1, -ph / 2 - 10); circ(ctx, 0, -ph / 2 - 4, pw * 0.3); ctx.fill();
  ctx.restore();
}

// ---- scenes -------------------------------------------------------------------------------------------------------------------------
const VARIANTS = {
  metallophone: {
    metal: true, bar: '#c79a45', stick: '#d8b888', head: '#5a2a1c', shirt: '#8a3a24', trim: '#e0b44a',
    dress: { kind: 'batik', base: '#1b2350', accent: '#d09a3e', rugKind: null, light: '#ffd9a0', vig: 0.55 },
    wide: { Lmax: 330, Lmin: 210, mid: 250, h: 700, resMin: 92, resMax: 150 },
    tall: { Lmax: 340, Lmin: 220, resMin: 90, resMax: 150 },
  },
  ranat: {
    metal: false, bar: null, stick: '#e6c58e', head: '#7a2c1a', shirt: '#2a5a4a', trim: '#f0d060',
    dress: { kind: 'planks', base: '#5a2c1a', rugKind: 'diamond', rugBase: '#3a1218', rugA: '#e0b44a', rugB: '#2a6a4a', light: '#ffe0a8', vig: 0.55, rugPad: 0 },
    wide: { Lmax: 340, Lmin: 210, mid: 250, h: 600 },
    tall: { Lmax: 340, Lmin: 250 },
  },
  marimba: {
    metal: false, bar: '#a65a32', stick: '#ead2a0', head: '#c04a2a', shirt: '#b0302a', trim: '#f0d060',
    dress: { kind: 'cloth', base: '#3a1e46', accent: '#e0b070', rugKind: null, light: '#ffe0b0', vig: 0.6 },
    wide: { Lmax: 340, Lmin: 200, mid: 250, h: 690, resMin: 70, resMax: 150 },
    tall: { Lmax: 340, Lmin: 210, resMin: 80, resMax: 190 },
  },
  silimba: {
    metal: false, bar: '#cf9a58', stick: '#e8cfa0', head: '#3a2418', shirt: '#a8402a', trim: '#f0d060',
    dress: { kind: 'reeds', base: '#b8935a', rugKind: null, light: '#ffd9a0', vig: 0.5 },
    wide: { Lmax: 330, Lmin: 200, mid: 240, h: 640 },
    tall: { Lmax: 340, Lmin: 230 },
  },
};

function scene(K, id) {
  const V = VARIANTS[id], { N, lanes, order, spots, bar, gourd, hull, drop, eachCue } = K;
  const rank = new Array(N); order.forEach((lane, r) => { rank[lane] = r; });
  const tall = K.tall, wood = V.bar ?? K.S.wood, railCol = id === 'marimba' ? '#6a3c20' : id === 'silimba' ? '#7a4a22' : '#7a4a22';
  const plr = { tool: 'stick', toolLen: tall ? 140 : 150, toolW: tall ? 14 : 15, wood: V.stick, head: V.head, headR: 1.05, shirt: V.shirt, trim: V.trim, hands: 2, noBody: true, slim: 0.72, shoulder: 1.5, ...(tall ? { side: 'right', sit: -0.1 } : { side: 'bottom', sit: 0.1 }) };
  K.set({ dress: V.dress, plr });

  if (!tall) {
    const W = V.wide, bw = clamp(900 / N, 44, 108), gap = bw * 0.14, total = N * bw + (N - 1) * gap, mid = W.mid;
    const geo = lanes.map((_, i) => { const r = rank[i], t = N > 1 ? r / (N - 1) : 0, L = lerp(W.Lmax, W.Lmin, t), v = -total / 2 + r * (bw + gap) + bw / 2; return { v, L, t, u0: mid - L / 2 }; });
    lanes.forEach((_, i) => { const g = geo[i]; spots[i] = rectSpot(g.v, mid, bw / 2 + gap / 2, g.L / 2, { geo: g, labelV: g.v, labelU: g.u0 + 30 }); });
    K.set({ ref: { w: Math.max(620, total + 260), h: W.h } });
    const railW = total + (id === 'metallophone' ? 90 : 110), ro = W.Lmax * 0.34;
    K.set({ draw: (ctx, rt) => {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 0, W.h - 24, total / 2 + 110, 24); ctx.fill();
      if (id === 'ranat') {
        hull(ctx, [[-total / 2 - 55, mid - 120], [-total / 2 - 10, mid + W.Lmax * 0.78, total / 2 + 10, mid + W.Lmax * 0.78], [total / 2 + 55, mid - 120], [total / 2 + 30, mid - 40, -total / 2 - 30, mid - 40]]);
        for (const s of [-1, 1]) { ctx.fillStyle = '#e0b44a'; circ(ctx, s * (total / 2 + 52), mid - 118, 9); ctx.fill(); ctx.strokeStyle = '#7a5a14'; ctx.lineWidth = 2; ctx.stroke(); }
      } else {
        for (const u of [mid - ro, mid + ro]) rail(ctx, -railW / 2, u, railW, 22, false, railCol);
        if (id === 'metallophone') for (const s of [-1, 1]) panel(ctx, s * (total / 2 + 54) - 34, 62, 68, W.h - 110, true, '#8a1c12', '#e0b44a');
        if (id === 'marimba') {
          for (const s of [-1, 1]) { rail(ctx, s * (total / 2 + 52) - 17, 70, 34, W.h - 120, true, '#6a3c20', 14); ctx.fillStyle = '#e0b44a'; rrect(ctx, s * (total / 2 + 52) - 21, 64, 42, 14, 6); ctx.fill(); }
          rail(ctx, -(total / 2 + 70), W.h - 78, total + 140, 24, false, '#6a3c20', 10);
        }
        if (id === 'silimba') for (const s of [-1, 1]) { rail(ctx, s * (total / 2 + 44) - 14, mid - ro - 40, 28, ro * 2 + 90, true, '#7a4a22', 12); }
      }
      // resonators under each bar
      lanes.forEach((l, i) => {
        const g = geo[i], top = mid + g.L / 2 + 12;
        if (id === 'metallophone') pipe(ctx, g.v - bw * 0.36, top, bw * 0.72, lerp(W.resMax, W.resMin, g.t), true, BRONZE);
        else if (id === 'marimba') pipe(ctx, g.v - bw * 0.34, top, bw * 0.68, lerp(W.resMax, W.resMin, g.t), true, STEEL);
        else if (id === 'silimba') { const gr = clamp(bw * 0.6 * (g.L / 380), 22, 46); gourd(ctx, g.v, top + gr + 4, gr, false); }
      });
      // bars
      lanes.forEach((l, i) => {
        const g = geo[i], f = rt.flash[i];
        bar(ctx, g.v - bw / 2, g.u0 + 2 * f, bw, g.L, wood, l.color, f, i, true, V.metal);
        if (id === 'silimba') { ctx.fillStyle = 'rgba(40,22,8,0.85)'; for (const u of [mid - ro, mid + ro]) rrect(ctx, g.v - bw / 2 - 1, u - 3, bw + 2, 8, 3), ctx.fill(); }
        if (f > 0.03) glow(ctx, g.v, mid, g.L * 0.7, l.color, 0.45 * f);
      });
      eachCue(rt, (t, tau) => { const g = geo[t.lane]; drop(ctx, t, tau, rt, g.v, mid, 30); });
    } });
  } else {
    const W = V.tall, p = clamp(640 / N, 40, 74), bt = p * 0.88, total = N * p, u0 = 112;
    const resMaxT = W.resMax ?? (id === 'silimba' ? 96 : 0);
    const leftExt = W.Lmax / 2 + 14 + (id === 'ranat' ? 60 : resMaxT), rightExt = W.Lmax / 2 + 60;
    const vc = (leftExt - rightExt) / 2, refW = leftExt + rightExt + 50;
    const geo = lanes.map((_, i) => { const r = rank[i], t = N > 1 ? r / (N - 1) : 0, L = lerp(W.Lmax, W.Lmin, t), u = u0 + (N - 1 - r) * p + p / 2; return { v: vc, L, t, u }; });
    lanes.forEach((_, i) => { const g = geo[i]; spots[i] = rectSpot(g.v, g.u, g.L / 2, p / 2, { geo: g, labelV: g.v, labelU: g.u }); });
    const refH = total + 232;
    K.set({ ref: { w: refW, h: refH } });
    const rv = W.Lmax * 0.34;
    K.set({ draw: (ctx, rt) => {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, vc + 12, refH - 14, refW * 0.4, 20); ctx.fill();
      if (id === 'ranat') {
        hull(ctx, [[vc, u0 - 70], [vc - W.Lmax * 0.78, u0 + total * 0.1, vc - W.Lmax * 0.78, u0 + total * 0.9], [vc, u0 + total + 70], [vc + W.Lmax * 0.78, u0 + total * 0.9, vc + W.Lmax * 0.78, u0 + total * 0.1]]);
        for (const s of [-1, 1]) { ctx.fillStyle = '#e0b44a'; circ(ctx, vc, s < 0 ? u0 - 66 : u0 + total + 66, 9); ctx.fill(); ctx.strokeStyle = '#7a5a14'; ctx.lineWidth = 2; ctx.stroke(); }
      } else {
        for (const v of [vc - rv, vc + rv]) rail(ctx, v - 11, u0 - 20, 22, total + 40, true, railCol);
        if (id === 'metallophone') { panel(ctx, vc - W.Lmax / 2 - 14, u0 - 70, W.Lmax + 28, 56, false, '#8a1c12', '#e0b44a'); panel(ctx, vc - W.Lmax / 2 - 14, u0 + total + 14, W.Lmax + 28, 56, false, '#8a1c12', '#e0b44a'); }
        if (id === 'marimba') { rail(ctx, vc - W.Lmax / 2 - 16, u0 - 50, W.Lmax + 32, 26, false, '#6a3c20', 12); rail(ctx, vc - W.Lmax / 2 - 16, u0 + total + 24, W.Lmax + 32, 26, false, '#6a3c20', 12); }
        if (id === 'silimba') { rail(ctx, vc - W.Lmax / 2 - 12, u0 - 44, W.Lmax + 24, 22, false, '#7a4a22', 10); rail(ctx, vc - W.Lmax / 2 - 12, u0 + total + 22, W.Lmax + 24, 22, false, '#7a4a22', 10); }
      }
      lanes.forEach((l, i) => {
        const g = geo[i];
        if (id === 'metallophone') { const tl = lerp(W.resMax, W.resMin, g.t); pipe(ctx, g.v - g.L / 2 - 12 - tl, g.u - p * 0.4, p * 0.8, tl, false, BRONZE); }
        else if (id === 'marimba') { const tl = lerp(W.resMax, W.resMin, g.t); pipe(ctx, g.v - g.L / 2 - 12 - tl, g.u - p * 0.36, p * 0.72, tl, false, STEEL); }
        else if (id === 'silimba') { const gr = clamp(p * 0.6 * (g.L / 380), 18, 44); gourd(ctx, g.v - g.L / 2 - gr - 14, g.u, gr, false); }
      });
      lanes.forEach((l, i) => {
        const g = geo[i], f = rt.flash[i];
        bar(ctx, g.v - g.L / 2 + 2 * f, g.u - bt / 2, g.L, bt, wood, l.color, f, i, false, V.metal);
        if (id === 'silimba') { ctx.fillStyle = 'rgba(40,22,8,0.85)'; for (const v of [vc - rv, vc + rv]) rrect(ctx, v - 3, g.u - bt / 2 - 1, 8, bt + 2, 3), ctx.fill(); }
        if (f > 0.03) glow(ctx, g.v, g.u, g.L * 0.7, l.color, 0.45 * f);
      });
      eachCue(rt, (t, tau) => { const g = geo[t.lane]; drop(ctx, t, tau, rt, g.v, g.u, g.v + W.Lmax / 2 + 120, true); });
    } });
  }
  void mix; void grain; void TAU;
}

for (const id of Object.keys(VARIANTS)) KEY_SCENES[id] = (K) => scene(K, id);

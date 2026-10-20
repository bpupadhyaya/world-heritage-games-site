// Goblet drum stages (1.11.0): darbuka (Arab world, Turkey; a pressed-metal drum) and tombak (Iran; a turned and inlaid wooden drum, also zarb).
// The drum is held across the lap, so it lies on its side in landscape (head to the left, flared bell to the right) and stands in portrait
// (head up). The head faces the player: a centre for the deep stroke, an inner and an outer ring for the finger strokes, the hoop for rim
// strokes, and the body for a knock. No performer is drawn.
import { registerDrumStage } from './registry.js';
import { staticLayer, createDrumStage, eSpot, eRing, eSector, rectSpot, assignZones, rot2, skinHead, hoop, tubeShade, barrelPath, dropShadow, studRing } from './drum-kit.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU } from './drum-kit.js';

const lerp = (a, b, t) => a + (b - a) * t;

const LOOK = {
  darbuka: {
    L: 600, R: 150, neck: 54, bell: 126, flareAt: 0.58, kx: 0.68, base: '#c27a34', pat: 'arabesque', seed: 14,
    hoop: { kind: 'metal', col: '#d8d2c0', w: 17 }, skin: '#f3e8cd', skinEdge: '#bda47a',
    dress: () => ({ kind: 'tiles', base: '#1c2e3a', accent: '#6a5a3a', size: 120, light: '#ffe2ac' }),
    zones: [['c', /dum|doum|bass|centre|center/], ['m', /tek|tak|ta\b|tik/], ['o', /ka\b|ek|pa\b|sak/], ['h', /rim|hoop|edge/], ['b', /body|knock|shell/]],
  },
  tombak: {
    L: 600, R: 140, neck: 50, bell: 110, flareAt: 0.6, kx: 0.68, base: '#7a3e1e', pat: 'khatam', seed: 24,
    hoop: { kind: 'wood', col: '#a8683a', w: 16 }, skin: '#f0e2bf', skinEdge: '#b49a68',
    dress: () => ({ kind: 'planks', base: '#3a2418', rugKind: 'diamond', rugBase: '#5a1e2a', rugA: '#c9a050', rugB: '#1e2a4a', light: '#ffd8a0' }),
    zones: [['c', /tom|dom|bass|centre|center/], ['m', /bak|bek|ba\b|tak/], ['o', /rik|rig|ric|fing|ka\b/], ['h', /rim|hoop|edge|pelang|palang/], ['b', /body|knock|shell/]],
  },
};

// the radius of the body at fraction t from the head (0) to the bell (1)
const radius = (d, t) => {
  if (t < d.flareAt) { const k = t / d.flareAt; return lerp(d.R * 0.98, d.neck, Math.pow(k, 0.62) * 0.9 + 0.1 * k); }
  const k = (t - d.flareAt) / (1 - d.flareAt); return lerp(d.neck, d.bell, Math.pow(k, 1.9));
};

function ornament(ctx, d, rAt, x0, x1) {
  const body = barrelPath(x0, x1, rAt, 56);
  ctx.save(); body(ctx); ctx.clip();
  if (d.pat === 'arabesque') {
    // pressed bands: rows of dots, scalloped lotus petals and a vine, in a darker and a brighter copper
    const dark = darker(d.base, 0.55), bright = lighter(d.base, 0.5);
    for (const t of [0.1, 0.2, 0.34, 0.46, 0.74, 0.9]) { const x = lerp(x0, x1, t), r = rAt(t); ctx.strokeStyle = rgba(dark, 0.7); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, 0, r * 0.12, r, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = rgba(bright, 0.45); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(x + 2, 0, r * 0.12, r, 0, 0, TAU); ctx.stroke(); }
    for (const [t0, t1, n] of [[0.2, 0.34, 11], [0.74, 0.9, 13]]) {
      const xa = lerp(x0, x1, t0), xb = lerp(x0, x1, t1), xm = (xa + xb) / 2;
      for (let k = 0; k < n; k++) { const ph = -Math.PI * 0.5 + (k + 0.5) / n * Math.PI, r = rAt((t0 + t1) / 2); if (Math.cos(ph) < 0.05) continue; const y = Math.sin(ph) * r * 0.86, sc = 0.55 + 0.45 * Math.cos(ph);
        ctx.fillStyle = rgba(dark, 0.55); ctx.beginPath(); ctx.ellipse(xm + 1.5, y + 1.5, (xb - xa) * 0.3 * sc, 13 * sc, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = rgba(bright, 0.5); ctx.beginPath(); ctx.ellipse(xm, y, (xb - xa) * 0.28 * sc, 11 * sc, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = rgba(dark, 0.8); ctx.lineWidth = 1.6; ctx.stroke(); }
    }
    // a scrolling vine through the long middle section
    ctx.strokeStyle = rgba(dark, 0.6); ctx.lineWidth = 2.4;
    for (const off of [-0.5, 0.5]) { ctx.beginPath(); for (let s = 0; s <= 60; s++) { const t = lerp(0.48, 0.72, s / 60), r = rAt(t); const x = lerp(x0, x1, t), y = (off * 0.8 + Math.sin(s * 0.55 + off * 2) * 0.12) * r; if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); }
  } else {
    // khatam: tiny inlaid stars and triangles in bone, brass and ebony, in two bands and a long panel
    const cols = ['#efe2c0', '#c9a045', '#2a1a10'];
    for (const [t0, t1] of [[0.14, 0.3], [0.7, 0.88]]) {
      const xa = lerp(x0, x1, t0), xb = lerp(x0, x1, t1);
      for (let x = xa; x < xb; x += 13) for (let k = -8; k <= 8; k++) { const ph = k / 8 * Math.PI * 0.5; if (Math.cos(ph) < 0.08) continue; const r = rAt((x - x0) / (x1 - x0)), y = Math.sin(ph) * r * 0.9, sc = 0.5 + 0.5 * Math.cos(ph), q = Math.round((x - xa) / 13 + k + 20);
        ctx.fillStyle = cols[q % 3]; ctx.beginPath(); ctx.moveTo(x, y - 6 * sc); ctx.lineTo(x + 6.5 * sc, y + 5 * sc); ctx.lineTo(x - 6.5 * sc, y + 5 * sc); ctx.closePath(); ctx.fill(); }
      ctx.strokeStyle = 'rgba(30,14,6,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xa, -400); ctx.lineTo(xa, 400); ctx.moveTo(xb, -400); ctx.lineTo(xb, 400); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,230,170,0.35)'; ctx.lineWidth = 1.4; for (let k = -3; k <= 3; k++) { ctx.beginPath(); for (let s = 0; s <= 40; s++) { const t = lerp(0.36, 0.64, s / 40), r = rAt(t); const x = lerp(x0, x1, t), y = (k / 4) * r * 0.9; if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); }
    grain(ctx, x0, -300, x1 - x0, 600, '#2a1408', 0.35, d.seed, false, 30);
  }
  ctx.restore();
}

// a folded cloth the drum rests on (lap cloth): woven border, fringe, a soft shadow under the drum
function cloth(ctx, d, x0, x1, id) {
  const w = (x1 - x0) * 1.0 + d.R * 0.5, h = d.R * 2.1, cx = (x0 + x1) / 2 + d.R * 0.1, cy = 4, hot = id === 'darbuka';
  const base = hot ? '#233a5a' : '#6a2234', a = hot ? '#e0b858' : '#e8d4a0', b = hot ? '#b8483a' : '#2a4a5a';
  ctx.save(); ctx.translate(cx, cy);
  ctx.fillStyle = 'rgba(0,0,0,0.36)'; rrect(ctx, -w / 2 + 10, -h / 2 + 16, w, h, 26); ctx.fill();
  rrect(ctx, -w / 2, -h / 2, w, h, 22); ctx.fillStyle = vgrad(ctx, -h / 2, h / 2, [[0, lighter(base, 0.22)], [1, darker(base, 0.3)]]); ctx.fill(); ctx.save(); ctx.clip();
  for (let k = 0; k < 200; k++) { const y = -h / 2 + k * (h / 200); ctx.fillStyle = k % 2 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.05)'; ctx.fillRect(-w / 2, y, w, h / 200); }
  const bd = h * 0.11;
  for (const [yy, hh] of [[-h / 2 + 6, bd], [h / 2 - 6 - bd, bd]]) { ctx.fillStyle = rgba(b, 0.75); ctx.fillRect(-w / 2, yy, w, hh); ctx.fillStyle = a; for (let x = -w / 2; x < w / 2; x += 22) { ctx.beginPath(); ctx.moveTo(x, yy + hh * 0.5); ctx.lineTo(x + 11, yy + hh * 0.12); ctx.lineTo(x + 22, yy + hh * 0.5); ctx.lineTo(x + 11, yy + hh * 0.88); ctx.closePath(); ctx.fill(); } ctx.fillStyle = rgba(a, 0.7); ctx.fillRect(-w / 2, yy + 2, w, 2.5); ctx.fillRect(-w / 2, yy + hh - 4.5, w, 2.5); }
  ctx.fillStyle = rgrad(ctx, 0, 0, 10, w * 0.5, [[0, 'rgba(255,240,200,0.12)'], [1, 'rgba(0,0,0,0.25)']]); ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,230,170,0.35)'; ctx.lineWidth = 2; rrect(ctx, -w / 2, -h / 2, w, h, 22); ctx.stroke();
  ctx.strokeStyle = rgba(a, 0.9); ctx.lineWidth = 3; for (let x = -w / 2 + 12; x < w / 2 - 6; x += 9) { ctx.beginPath(); ctx.moveTo(x, h / 2); ctx.lineTo(x + 2, h / 2 + 15); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, -h / 2); ctx.lineTo(x + 2, -h / 2 - 15); ctx.stroke(); }
  ctx.restore();
}
// anisotropic streaks along a turned metal or wood shell, and a window-shaped reflection that follows the curve
function streaks(ctx, body, d, x0, x1, id) {
  ctx.save(); body(ctx); ctx.clip();
  for (let k = 0; k < 26; k++) { const y = (hash(k + d.seed) * 2 - 1) * d.R * 0.92, ln = (x1 - x0) * (0.2 + 0.5 * hash(k * 3 + d.seed)), xs = x0 + (x1 - x0) * hash(k * 7 + d.seed) * 0.6; ctx.strokeStyle = id === 'darbuka' ? `rgba(255,244,214,${0.05 + 0.1 * hash(k + 4)})` : `rgba(255,214,160,${0.04 + 0.07 * hash(k + 4)})`; ctx.lineWidth = 1 + hash(k + 9) * 1.5; ctx.beginPath(); ctx.moveTo(xs, y); ctx.lineTo(xs + ln, y + (hash(k) - 0.5) * 3); ctx.stroke(); }
  if (id === 'darbuka') { ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(x0 + (x1 - x0) * 0.1, -d.R * 0.7); ctx.lineTo(x0 + (x1 - x0) * 0.46, -d.neck * 0.8); ctx.lineTo(x0 + (x1 - x0) * 0.5, -d.neck * 0.55); ctx.lineTo(x0 + (x1 - x0) * 0.12, -d.R * 0.45); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.moveTo(x0 + (x1 - x0) * 0.62, -d.neck * 0.8); ctx.lineTo(x0 + (x1 - x0) * 0.96, -d.bell * 0.78); ctx.lineTo(x0 + (x1 - x0) * 0.97, -d.bell * 0.58); ctx.lineTo(x0 + (x1 - x0) * 0.64, -d.neck * 0.52); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}

for (const [id, d] of Object.entries(LOOK)) {
  registerDrumStage({
    id, match: id === 'darbuka' ? /darbuk|darbouk|doumbek|dumbek|derbake|goblet|dumbec|toumperleki/ : /tombak|tonbak|zarb|donbak/,
    build: (S, lanes, P) => { const zoneOf = []; return createDrumStage(id, S, lanes, P, {
      dress: d.dress,
      voiceOf: (i) => `goblet-${id}-${zoneOf[i] ?? 'c'}`,
      build: (K) => {
        const ref = K.tall ? { w: 470, h: 760 } : { w: 820, h: 400 };
        const ang = K.tall ? Math.PI / 2 - 0.2 : 0.14, cx = ref.w * 0.0, cy = ref.h / 2;
        // the drum's axis runs from the head (local x = -L/2) to the bell (local x = +L/2)
        const Lx = K.tall ? d.L * 0.92 : d.L, shift = K.tall ? 0 : 0;
        const R = (x, y) => { const [a, b] = rot2(x, y, ang); return [cx + a, cy + b + shift]; };
        const keyOf = assignZones(K, d.zones.map(([key, re]) => ({ key, re })));
        for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
        const [hx, hy] = R(-Lx / 2, 0), rx = d.R * d.kx, ry = d.R;
        const by = {};
        by.c = eSpot(hx, hy, rx * 0.5, ry * 0.5, ang, { apk: 0.95 });
        by.m = eRing(hx, hy, rx, ry, ang, 0.52, 0.78, -Math.PI * 0.62);
        by.o = eRing(hx, hy, rx, ry, ang, 0.8, 0.98, Math.PI * 0.62);
        by.h = eSector(hx, hy, rx, ry, ang, 1.0, 1.3, -Math.PI * 0.42, -Math.PI * 0.02, { cueR: 30 });
        const [bx, byy] = R(Lx * 0.2, 0);
        by.b = rectSpot(bx, byy, Lx * 0.14, d.neck * 0.8, ang, { rad: 16 });
        const spots = new Array(K.N).fill(null);
        for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
        const layer = staticLayer();
        return {
          ref, spots,
          draw(ctx, rt) {
            const x0 = -Lx / 2, x1 = Lx / 2, rAt = (t) => radius(d, t);
            const fh = (() => { let m = 0; for (let i = 0; i < K.N; i++) if (keyOf[i] && keyOf[i] !== 'b') m = Math.max(m, rt.flash[i]); return m; })();
            ctx.save(); ctx.translate(cx, cy + shift); ctx.rotate(ang);
            const paintStatic = (ctx) => {
            cloth(ctx, d, x0, x1, id);
            const body = barrelPath(x0 + rx * 0.4, x1, rAt, 56);
            // the shell is drawn from the head to the bell: path x runs along the drum
            const rAbs = (t) => rAt(t);
            dropShadow(ctx, body, 18, 28, 0.4);
            tubeShade(ctx, body, d.R + 20, d.base, id === 'darbuka' ? { hl: 0.5, dark: 0.55, spec: 0.5 } : { hl: 0.4, dark: 0.45, spec: 0.5 });
            streaks(ctx, body, d, x0, x1, id);
            ornament(ctx, d, rAbs, x0 + rx * 0.4, x1);
            if (id === 'darbuka') { // polished metal: a bright window reflection above the axis, a warm bounce below it, a hard dark edge band
              ctx.save(); body(ctx); ctx.clip();
              ctx.fillStyle = vgrad(ctx, -d.R, d.R, [[0, 'rgba(0,0,0,0.35)'], [0.12, 'rgba(255,248,220,0.0)'], [0.24, 'rgba(255,250,230,0.55)'], [0.32, 'rgba(255,250,230,0.0)'], [0.62, 'rgba(255,200,120,0.0)'], [0.74, 'rgba(255,190,110,0.28)'], [0.84, 'rgba(255,190,110,0.0)'], [1, 'rgba(0,0,0,0.4)']]); ctx.fillRect(x0, -d.R, x1 - x0, 2 * d.R);
              ctx.restore();
            }
            // the bell: the open end seen from the side as a dark lip
            ctx.fillStyle = vgrad(ctx, -d.bell, d.bell, [[0, lighter(d.base, 0.4)], [0.5, darker(d.base, 0.3)], [1, darker(d.base, 0.65)]]); ell(ctx, x1 - 3, 0, 20, d.bell); ctx.fill();
            ctx.fillStyle = rgrad(ctx, x1 + 4, 0, 4, d.bell * 0.9, [[0, '#050302'], [1, '#2a1a0c']]); ell(ctx, x1 + 2, 0, 15, d.bell * 0.84); ctx.fill();
            ctx.strokeStyle = rgba(lighter(d.base, 0.6), 0.55); ctx.lineWidth = 3; ell(ctx, x1 - 3, 0, 20, d.bell); ctx.stroke();
            };
            layer(ctx, { x: x0 - d.R * 2.2, y: -d.R * 1.75 - 30, w: (x1 - x0) + d.R * 3.6, h: d.R * 3.5 + 60 }, paintStatic);
            // head
            ctx.save(); ctx.translate(x0, 0);
            hoop(ctx, rx, ry, d.hoop.w, { ...d.hoop, seed: d.seed });
            skinHead(ctx, rx, ry, { tint: d.skin, edge: d.skinEdge, seed: d.seed + 4, vib: fh, wear: 0.9 });
            if (id === 'darbuka') studRing(ctx, rx + d.hoop.w * 0.5, ry + d.hoop.w * 0.5, 16, 3.4, '#cfd3da', 0.1);
            ctx.restore();
            ctx.restore();
          },
        };
      },
    }); },
  });
}
void clamp; void mix; void hgrad; void circ;

// Barrel drum stages (1.11.0): madal (Nepal), dhol (Punjab, Pashtun lands, Nepal) and mridangam (South India).
// The drum lies on its side (in portrait it lies on a diagonal) and shows both heads: a hide stretched over a turned hoop, laced to the
// other hoop with V-straps that follow the bulge of the shell. Every lane is a zone of a head, the shell, or a hoop.
//   zones (lane name picks one, otherwise lanes take them low to high): left centre, left edge, right centre, right edge, right rim, shell
// No performer is drawn (no hands, no face): the struck zone flares, the hide shivers and a ripple leaves it.
import { registerDrumStage } from './registry.js';
import { createDrumStage, eSpot, eRing, rectSpot, assignZones, rot2, skinHead, hoop, tubeShade, barrelPath, lacing, beater, dropShadow, studRing } from './drum-kit.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU } from './drum-kit.js';

const LOOK = {
  madal: {
    L: 540, rL: 160, rR: 160, bulge: 34, kx: 0.46, wood: '#b8703a', woodHi: 0.3, seed: 21,
    hoop: { kind: 'rope', col: '#6a3a1c', w: 20 }, lace: { col: '#c8452f', w: 11, n: 7, over: '#e9c26a' },
    pasteR: [{ r: 0.46, col: '#17130f' }], pasteL: [], skin: '#ecdcb6', skinEdge: '#b69660',
    sash: { cols: ['#c8452f', '#f0c25a', '#1f5a3a'], at: 0.5, w: 92 },
    dress: (t) => ({ kind: 'planks', base: '#5a3a24', rugKind: 'diamond', rugBase: '#4a2a22', rugA: '#9a7a3a', rugB: '#2a3a30', light: '#ffd9a0' }),
    zones: [['lc', /bass|left|dhi|gha|ghi|thom/], ['rc', /centre|center|ta\b|tha\b|syahi|paste/], ['re', /edge|ring|din|tin|nam/], ['sh', /shell|wood|knock/]],
  },
  dhol: {
    L: 520, rL: 196, rR: 148, bulge: 24, kx: 0.44, wood: '#a04a22', woodHi: 0.3, seed: 33,
    hoop: { kind: 'metal', col: '#b9a05a', w: 24 }, lace: { col: '#e8dcc0', w: 13, n: 6, over: '#c8452f' },
    pasteR: [], pasteL: [{ r: 0.32, col: '#2a1a10' }], skin: '#e8d7ae', skinEdge: '#a98a58',
    sash: { cols: ['#d93a2b', '#f2c230', '#22884a', '#2a58b8'], at: 0.52, w: 80 },
    dress: (t) => ({ kind: 'earth', base: '#8a6038', rugKind: 'stripes', rugBase: '#4a2420', rugA: '#9a7a3a', rugB: '#233a52', light: '#ffd49a' }),
    zones: [['lc', /dagga|bass|left|dha|thick/], ['le', /rim|kinaar|edge l/], ['rc', /tilli|tili|treble|right|thin|tak|ta\b/], ['re', /edge|ring|tin/], ['sh', /shell|wood|knock/]],
  },
  mridangam: {
    L: 580, rL: 150, rR: 126, bulge: 48, kx: 0.46, wood: '#a8481f', woodHi: 0.34, seed: 47,
    hoop: { kind: 'wood', col: '#d3b078', w: 18 }, lace: { col: '#6a3a1c', w: 12, n: 8, over: '#d8b27a' },
    pasteR: [{ r: 0.48, col: '#14110e' }], pasteL: [{ r: 0.5, dx: 0.06, col: '#d9d0bc', rim: true }], skin: '#f0e2bc', skinEdge: '#b49560',
    sash: null,
    dress: (t) => ({ kind: 'planks', base: '#4a2c1c', rugKind: 'stripes', rugBase: '#3a2a22', rugA: '#9a5a2a', rugB: '#1c2a3a', light: '#ffe0b0' }),
    zones: [['lc', /thom|thoppi|left|dhi|bass|gum/], ['le', /rim|chapu|edge l/], ['rc', /ki\b|thi\b|ti\b|centre|center|syahi/], ['re', /din|nam|num|ring|edge|dheem/], ['rr', /^ta$|^tha$|chap|rim r/], ['sh', /shell|wood|knock/]],
  },
};

const lerp = (a, b, t) => a + (b - a) * t;

function paintBarrel(ctx, d, vibL, vibR) {
  const { L, rL, rR, bulge } = d, xL = -L / 2, xR = L / 2, hw = d.hoop.w;
  const rxL = rL * d.kx, rxR = rR * d.kx;
  const rAt = (t) => lerp(rL + hw * 0.55, rR + hw * 0.55, t) + bulge * Math.pow(Math.sin(Math.PI * t), 1.35);
  const ybox = Math.max(rL, rR) + bulge + hw;
  const body = barrelPath(xL + rxL * 0.2, xR - rxR * 0.2, rAt, 48);
  dropShadow(ctx, body, 16, 26, 0.42);
  // the shell
  tubeShade(ctx, body, ybox, d.wood, { hl: d.woodHi, dark: 0.34, spec: 0.26 });
  ctx.save(); body(ctx); ctx.clip();
  grain(ctx, xL, -ybox, L, 2 * ybox, darker(d.wood, 0.75), 0.4, d.seed, false, 26);
  // rings turned into the shell, near both ends and at the belly
  ctx.strokeStyle = 'rgba(30,14,4,0.45)'; ctx.lineWidth = 2.4;
  for (const t of [0.12, 0.17, 0.5, 0.83, 0.88]) { const x = lerp(xL, xR, t), r = rAt(t); ctx.beginPath(); ctx.ellipse(x, 0, r * 0.12, r, 0, 0, TAU); ctx.stroke(); }
  ctx.restore();
  // V-straps over the front of the shell
  const lc = d.lace, zig = [];
  const nSeg = lc.n * 2 + 1, dphi = Math.PI / (lc.n * 2 - 0.6);
  for (let k = 0; k < nSeg; k++) zig.push(-Math.PI / 2 - dphi * 0.4 + k * dphi);
  const strap = (pa, pb, rightFirst, col, w, dy = 0) => {
    const mid = (pa + pb) / 2; if (Math.cos(mid) < 0.02) return;
    ctx.strokeStyle = col; ctx.lineWidth = w * (0.5 + 0.5 * Math.cos(mid)); ctx.lineCap = 'round'; ctx.beginPath();
    for (let s = 0; s <= 24; s++) { const t = s / 24, tt = rightFirst ? 1 - t : t, ph = lerp(pa, pb, t); const r = rAt(tt) + 1.5; const y = r * Math.sin(ph) + dy, x = lerp(xL + rxL * 0.1, xR - rxR * 0.1, tt); if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke();
  };
  for (let k = 0; k < nSeg - 1; k++) {
    const pa = zig[k], pb = zig[k + 1], fromLeft = k % 2 === 0;
    const pL = fromLeft ? pa : pb, pR = fromLeft ? pb : pa;   // the left end sits at pL, the right end at pR
    for (const [c, w, dy, dx] of [['rgba(0,0,0,0.38)', lc.w + 3, 4], [darker(lc.col, 0.45), lc.w, 0], [lc.col, lc.w * 0.66, -0.6], [lighter(lc.col, 0.55), lc.w * 0.2, -lc.w * 0.2]]) {
      void dx; const mid = (pL + pR) / 2; if (Math.cos(mid) < 0.02) continue;
      ctx.strokeStyle = c; ctx.lineWidth = w * (0.5 + 0.5 * Math.cos(mid)); ctx.lineCap = 'round'; ctx.beginPath();
      for (let s = 0; s <= 24; s++) { const t = s / 24, ph = lerp(pL, pR, t), r = rAt(t) + 1.5, y = r * Math.sin(ph) + dy, x = lerp(xL + rxL * 0.1, xR - rxR * 0.1, t); if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
    }
  }
  void strap;
  // the strap ends turn round the hoops in small leather loops
  for (let k = 0; k < nSeg; k++) { const ph = zig[k]; if (Math.cos(ph) < 0.1) continue; const left = k % 2 === 0, x = left ? xL + rxL * 0.1 : xR - rxR * 0.1, r = left ? rL + hw * 0.55 : rR + hw * 0.55;
    ctx.fillStyle = darker(lc.col, 0.4); ell(ctx, x, r * Math.sin(ph), 5 + 2 * Math.cos(ph), 6.5); ctx.fill(); ctx.fillStyle = lighter(lc.col, 0.3); ell(ctx, x - 1, r * Math.sin(ph) - 1.5, 2.4, 3.2); ctx.fill(); }
  // a sash or woven band wrapped round the belly
  if (d.sash) {
    const sx = lerp(xL, xR, d.sash.at), sw = d.sash.w, r = rAt(d.sash.at);
    ctx.save(); body(ctx); ctx.clip();
    const cols = d.sash.cols, n = cols.length;
    for (let k = 0; k < n; k++) { ctx.fillStyle = hgrad(ctx, sx - sw / 2 + (sw / n) * k, sx - sw / 2 + (sw / n) * (k + 1), [[0, darker(cols[k], 0.25)], [0.4, lighter(cols[k], 0.15)], [1, darker(cols[k], 0.3)]]); ctx.fillRect(sx - sw / 2 + (sw / n) * k, -r - 4, sw / n + 0.5, 2 * r + 8); }
    ctx.fillStyle = vgrad(ctx, -r, r, [[0, 'rgba(0,0,0,0.55)'], [0.2, 'rgba(255,255,255,0.14)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.6)']]); ctx.fillRect(sx - sw / 2, -r - 4, sw, 2 * r + 8);
    ctx.strokeStyle = 'rgba(255,240,200,0.5)'; ctx.lineWidth = 1.4; for (let y = -r + 12; y < r; y += 16) { ctx.beginPath(); ctx.moveTo(sx - sw / 2, y); ctx.lineTo(sx + sw / 2, y + 6); ctx.stroke(); }
    ctx.restore();
  }
  // the heads
  for (const [x, rx, ry, paste, vib, face] of [[xL, rxL, rL, d.pasteL, vibL, -1], [xR, rxR, rR, d.pasteR, vibR, 1]]) {
    ctx.save(); ctx.translate(x, 0);
    // contact shadow on the shell
    ctx.fillStyle = rgrad(ctx, -face * rx * 0.2, 0, ry * 0.6, ry + hw * 1.6, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.26)']]); ell(ctx, -face * rx * 0.35, 0, rx * 1.5 + hw, ry + hw * 1.3); ctx.fill();
    hoop(ctx, rx, ry, hw * (0.5 + d.kx), { ...d.hoop, seed: d.seed + face });
    skinHead(ctx, rx, ry, { tint: d.skin, edge: d.skinEdge, seed: d.seed + 3 * face, paste, vib, wear: 0.6 });
    if (d.hoop.kind === 'metal') studRing(ctx, rx + hw * 0.5, ry + hw * 0.5, 22, 3.6, '#e8d28a', 0.2);
    ctx.restore();
  }
}

// a stick or switch lying on the floor beside the drum (a prop, not a hand)
function props(ctx, look, ang, dist) {
  if (look === 'dhol') {
    ctx.save(); ctx.translate(0, dist); ctx.rotate(0.06);
    beater(ctx, -250, 0, 0.04, 430, 15, { wood: '#7a4a22', head: '#6a3a18' });
    beater(ctx, -200, 34, -0.03, 400, 8, { wood: '#d8b878' });
    ctx.restore();
  }
  void ang;
}

for (const [id, d] of Object.entries(LOOK)) {
  registerDrumStage({
    id, match: id === 'madal' ? /madal|maadal/ : id === 'dhol' ? /\bdhol\b|dholak|dhaak|dhak\b|dholki/ : /mridang|mrdang|pakhawaj|mridanga|khol\b/,
    build: (S, lanes, P) => { const zoneOf = []; return createDrumStage(id, S, lanes, P, {
      dress: d.dress,
      voiceOf: (i) => `barrel-${id}-${zoneOf[i] ?? 'rc'}`,
      build: (K) => {
        const ang = K.tall ? -1.02 : -0.1;
        const ref = K.tall ? { w: 640, h: 1000 } : { w: 1180, h: 640 };
        const cx = 0, cy = ref.h / 2 + (K.tall ? 10 : -2);
        const [xl, yl] = rot2(-d.L / 2, 0, ang), [xr, yr] = rot2(d.L / 2, 0, ang);
        const R = (x, y) => { const [a, b] = rot2(x, y, ang); return [cx + a, cy + b]; };
        const keys = d.zones.map(([key, re]) => ({ key, re }));
        const keyOf = assignZones(K, keys);
        for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
        const rxL = d.rL * d.kx, rxR = d.rR * d.kx, spotsByKey = {};
        const [lx, ly] = R(-d.L / 2, 0), [rx_, ry_] = R(d.L / 2, 0);
        spotsByKey.lc = eSpot(lx, ly, rxL * 0.62, d.rL * 0.5, ang, { apk: 0.95 });
        spotsByKey.le = eRing(lx, ly, rxL, d.rL, ang, 0.66, 1.0, Math.PI * 0.64);
        spotsByKey.rc = eSpot(rx_, ry_, rxR * 0.62, d.rR * 0.5, ang, { apk: 0.95 });
        spotsByKey.re = eRing(rx_, ry_, rxR, d.rR, ang, 0.66, 1.0, -Math.PI * 0.4);
        spotsByKey.rr = eRing(rx_, ry_, rxR * 1.0, d.rR * 1.0, ang, 1.02, 1.2, Math.PI * 0.35);
        const [sx, sy] = R(d.L * 0.06, 0);
        spotsByKey.sh = rectSpot(sx, sy, d.L * 0.12, d.rL * 0.34, ang, { rad: 18 });
        const spots = new Array(K.N).fill(null);
        for (let i = 0; i < K.N; i++) spots[i] = spotsByKey[keyOf[i]] ?? null;
        // lanes beyond the zone list reuse the leftover heads (a simple fallback; fixtures keep lane counts within the zone list)
        return {
          ref, view: K.tall ? { zoom: 1.0 } : { zoom: 1.0 }, spots,
          draw(ctx, rt, G) {
            const f = (side) => { let m = 0; for (let i = 0; i < K.N; i++) if (keyOf[i] && keyOf[i][0] === side) m = Math.max(m, rt.flash[i]); return m; };
            ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
            if (id === 'dhol') props(ctx, id, ang, d.rL + d.bulge + 70);
            paintBarrel(ctx, d, f('l'), f('r'));
            ctx.restore();
            void xl; void yl; void xr; void yr;
          },
        };
      },
    }); },
  });
}

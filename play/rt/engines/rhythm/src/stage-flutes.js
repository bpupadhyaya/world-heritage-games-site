// Duct flutes and vessel flutes, figure-free (1.19.2): tin whistle (a silver tube with a beak), Hungarian long flute (a long wooden duct flute with burnt rings),
// dvoyanka (a Bulgarian double flute: a melody pipe and a drone pipe in one block) and ocarina (a clay vessel flute). Same lanes as the wind stages: `holes` strings,
// a note is struck at its highest open hole, covered holes glow, a band of breath runs from the mouthpiece to it. No performer, no hands.
import { registerWindStage } from './registry.js';
import { clamp, mix, rgba, lighter, darker, glow, rrect, grain, hgrad, vgrad, rgrad, hash, ell, circ, TAU } from './art.js';
import { makeFrame, circleSpot, finishSpots, pill, lerp, isHero } from './stagekit.js';
import { setting, instrumentBox } from './set.js';
import { windSound } from './windvoice.js';
import { cues, marker, stageBase, byPitchRank, hv } from './winds2.js';
import { cyl } from './stage-oboes.js';

const MATCH = /tin whistle|penny whistle|whistle|hossz[uú] furulya|long furulya|furulya|dvoyanka|dvojanka|double flute|ocarina|vessel flute/;
const STYLE_RE = { ocarina: /ocarina|vessel flute/, dvoyanka: /dvoyanka|dvojanka|double flute/, furulya: /furulya/, whistle: /whistle/ };
const styleOf = (key) => { const k = String(key || '').toLowerCase(); for (const [n, re] of Object.entries(STYLE_RE)) if (re.test(k)) return n; return 'whistle'; };

const FL = {
  whistle: { lenF: 0.84, col: '#cdd2d8', w: 0.5, beak: '#16171b', set: { kind: 'planks', base: '#2e1e16', light: '#ffe0b0', rug: 'diamond', rugBase: '#1c3226', rugA: '#d0a858', rugB: '#6a1e22' }, holes: [0.32, 0.94], voice: 'whistle' },
  furulya: { lenF: 0.96, col: '#9a6a34', w: 0.46, beak: '#7a4a24', set: { kind: 'meadow', base: '#3f6a34', light: '#fff0c8' }, holes: [0.3, 0.92], voice: 'furulya', rings: 9 },
  dvoyanka: { lenF: 0.8, col: '#dcb272', w: 0.44, beak: '#8a5a2c', set: { kind: 'cloth', base: '#5a1a22', accent: '#e8c070', light: '#ffe2b0' }, holes: [0.3, 0.94], voice: 'dvoyanka', twin: true },
  ocarina: { lenF: 0.7, col: '#b5603a', w: 0.5, beak: '#a8502e', set: { kind: 'earth', base: '#5a3a24', light: '#ffe2b0', rug: 'zigzag', rugBase: '#22302a', rugA: '#e0b868', rugB: '#a8422a' }, holes: [0.2, 0.8], voice: 'ocarina' },
};

export function createFlute(S, lanes, style, P) {
  const N = lanes.length, L0 = FL[style] ?? FL.whistle;
  L0.set = { ...L0.set, ...(P?.set ?? {}) };
  const st = stageBase('flute', style, lanes), spots = st.spots;
  st.voiceOf = () => 'duct';
  st.sound = (audio, p) => windSound(audio, 'duct', { ...p, style: L0.voice });
  const nFront = clamp(Math.max(0, ...lanes.map((l) => (l.holes || '').length)) || 6, 3, 10);
  const fingerOf = (i) => { const h = lanes[i].holes || ''; return Array.from({ length: nFront }, (_, k) => h[k] === '1'); };
  const first = lanes.map((l) => { const h = (l.holes || '').slice(0, nFront); let c = 0; while (c < h.length && h[c] === '1') c++; return h ? c : null; });
  const { order } = byPitchRank(lanes);
  order.forEach((i, rank) => { if (first[i] == null) first[i] = clamp(nFront - rank, 0, nFront); });
  const reg = new Array(N).fill(0), groups = new Map();
  order.forEach((i) => { groups.set(first[i], [...(groups.get(first[i]) ?? []), i]); });
  groups.forEach((list) => list.forEach((i, r) => { reg[i] = r; }));
  const fing = new Array(nFront).fill(1);
  let lastAnim = 0;
  const ocar = style === 'ocarina';
  st.layout = (area) => {
    const F = makeFrame(area, { top: 40, bottom: 10, side: 16 }); st.F = F;
    const { W, H } = F, q = clamp(W * 0.17, 40, 112), Lg = H * L0.lenF, topU = (H - Lg) / 2, footU = topU + Lg;
    const G = { W, H, q, Lg, topU, footU, regGap: clamp(W * 0.22, 66, 150) };
    if (ocar) {   // an egg of clay lying across the frame, its holes in a staggered row along the body
      G.rx = Math.min(W * 0.46, H * 0.3), G.ry = G.rx * 0.74; G.cu = H * 0.5; G.ang = -0.18;
      G.holeAt = (k) => { const t = (k + 0.5) / nFront, x = lerp(-0.62, 0.55, t) * G.rx, y = (k % 2 ? 0.26 : -0.16) * G.ry + 0.12 * G.ry * Math.sin(t * 3); const c = Math.cos(G.ang), s = Math.sin(G.ang); return [x * c - y * s, G.cu + x * s + y * c]; };
    } else {
      const hu0 = lerp(topU + q * 1.1, footU, L0.holes[0]), hu1 = lerp(topU + q * 1.1, footU, L0.holes[1]);
      G.hu0 = hu0; G.hu1 = hu1; G.step = (hu1 - hu0) / nFront;
      G.hv = L0.twin ? -q * 0.34 : 0;
      G.holeAt = (k) => [G.hv, hu0 + (k + 0.5) * G.step];
    }
    st.G = G;
    const R = clamp(ocar ? q * 0.4 : G.step * 0.5, 22, 38);
    lanes.forEach((_, i) => {
      const c = first[i], p = c >= nFront ? (ocar ? [G.holeAt(nFront - 1)[0] + G.rx * 0.2, G.holeAt(nFront - 1)[1] + G.ry * 0.5] : [G.hv, footU + 6]) : G.holeAt(c);
      const v = p[0] + (reg[i] ? (ocar ? G.rx * 0.2 : q * 0.5 + G.regGap * 0.6) * (1 + 0 * reg[i]) + (reg[i] - 1) * G.regGap * 0.9 : 0), u = p[1];
      spots[i] = circleSpot(v, u, R + (reg[i] ? 6 : 0), { first: c, reg: reg[i] });
      if (!reg[i]) { const pv = ocar ? p[0] : -(q * 0.5 + (L0.twin ? q * 0.7 : 0) + 56), pu = ocar ? G.cu + G.ry * 1.25 + (c % 2) * 34 : u, sp = spots[i], own = sp.dist; sp.pillV = pv; sp.pillU = pu; sp.dist = (lv, lu) => Math.min(own(lv, lu), Math.hypot(lv - pv, lu - pu) / (R * 0.9)); }
    });
    finishSpots(F, spots);
  };
  st.countSpot = () => { const F = st.F, G = st.G; if (!F || !G) return null; const [x, y] = F.landscape ? F.map(F.W * 0.3, G.H * 0.17) : F.map(-F.W * 0.27, G.H * 0.14); return { x, y, size: clamp(Math.min(F.W, G.H) * 0.2, 56, 120) }; };
  st.draw = (g, rt) => {
    const { ctx } = g, F = st.F;
    if (!F) return;
    const G = st.G, { q, topU, footU } = G;
    let act = -1, best = 0.02;
    lanes.forEach((_, i) => { const v = hv(rt, i); if (v > best) { best = v; act = i; } });
    const dtv = clamp(rt.anim - lastAnim, 0, 0.1); lastAnim = rt.anim;
    const tgt = act >= 0 ? fingerOf(act) : new Array(nFront).fill(true);
    for (let k = 0; k < nFront; k++) fing[k] += ((tgt[k] ? 1 : 0) - fing[k]) * clamp(dtv * 18, 0, 1);
    const col = act >= 0 ? lanes[act].color : '#ffd9a0', live = act >= 0 ? best : 0, padA = 0.22 + 0.78 * Math.min(1, live * 1.4), base = L0.col;
    setting(ctx, F, L0.set.kind, S, rt, { ...L0.set, rugKind: L0.set.rug || null, rugBase: L0.set.rugBase ?? '#2a1a16', rugA: L0.set.rugA ?? '#d9b45a', rugB: L0.set.rugB ?? '#8a2a22', bbox: instrumentBox(F) });
    ctx.save(); F.apply(ctx);
    const holeDraw = (x, u, r, k) => {
      const c = fing[k];
      ctx.fillStyle = 'rgba(0,0,0,0.32)'; ell(ctx, x + 2, u + 3, r + 2, r * 1.05 + 2); ctx.fill();
      ctx.fillStyle = rgrad(ctx, x, u, 0, r * 1.1, [[0, '#000'], [0.7, '#140a04'], [1, '#2a1608']]); ell(ctx, x, u, r, r * 1.05); ctx.fill();
      ctx.strokeStyle = rgba(lighter(base, 0.65), 0.9); ctx.lineWidth = 2; ctx.stroke();
      if (c > 0.05 && !isHero()) { const pr = r * 1.55; ctx.fillStyle = rgba(lighter(col, 0.3), 0.18 + 0.6 * padA * c); circ(ctx, x, u, pr); ctx.fill(); ctx.strokeStyle = rgba(lighter(col, 0.65), (0.3 + 0.7 * padA) * c); ctx.lineWidth = 2.5; ctx.stroke(); if (live > 0.03) glow(ctx, x, u, pr * 2.6, col, 0.32 * c * live); }
    };
    let mouth = [0, topU];
    if (ocar) {
      const { rx, ry, cu, ang } = G;
      ctx.save(); ctx.translate(0, cu); ctx.rotate(ang);
      const egg = (c) => { c.beginPath(); for (let k = 0; k <= 80; k++) { const t = (k / 80) * TAU, cx = Math.cos(t), sn = Math.sin(t); c.lineTo(cx * rx * (1 + 0.1 * sn * 0), sn * ry * (1 + 0.14 * cx)); } c.closePath(); };
      ctx.save(); ctx.translate(14, 20); egg(ctx); ctx.fillStyle = 'rgba(0,0,0,0.36)'; ctx.fill(); ctx.restore();
      // the mouthpiece: a short tube at the upper right with the windway
      const mp = (c) => { c.beginPath(); c.moveTo(rx * 0.55, -ry * 0.62); c.lineTo(rx * 0.98, -ry * 1.2); c.lineTo(rx * 1.12, -ry * 1.08); c.lineTo(rx * 0.76, -ry * 0.42); c.closePath(); };
      mp(ctx); ctx.fillStyle = hgrad(ctx, rx * 0.5, rx * 1.1, [[0, darker(L0.beak, 0.4)], [0.4, lighter(L0.beak, 0.35)], [1, darker(L0.beak, 0.5)]]); ctx.fill(); ctx.strokeStyle = rgba(darker(L0.beak, 0.8), 0.8); ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = '#0a0402'; ctx.save(); ctx.translate(rx * 1.07, -ry * 1.14); ctx.rotate(-0.8); ell(ctx, 0, 0, 12, 7); ctx.fill(); ctx.restore();
      ctx.fillStyle = rgrad(ctx, -rx * 0.3, -ry * 0.4, 0, rx * 1.2, [[0, lighter(base, 0.5)], [0.5, base], [1, darker(base, 0.6)]], -rx * 0.35, -ry * 0.45); egg(ctx); ctx.fill();
      ctx.save(); egg(ctx); ctx.clip();
      for (let k = 0; k < 140; k++) { ctx.fillStyle = `rgba(60,24,8,${0.04 + 0.1 * hash(k)})`; ell(ctx, (hash(k + 3) - 0.5) * rx * 2, (hash(k + 40) - 0.5) * ry * 2, 3 + 9 * hash(k + 7), 2 + 5 * hash(k + 9)); ctx.fill(); }
      // painted dotted bands and a rosette in black slip
      ctx.fillStyle = 'rgba(26,12,6,0.85)'; for (let k = 0; k < 26; k++) { const t = -0.8 + k * 0.065, x = rx * 0.85 * Math.sin(t * 2.2) * 1.1, y = ry * (0.58 - 0.0 * k) + ry * 0.05 * Math.sin(k); circ(ctx, x, y, 4); ctx.fill(); }
      for (let k = 0; k < 20; k++) { const x = lerp(-rx * 0.7, rx * 0.5, k / 19); ctx.beginPath(); ctx.moveTo(x - 9, -ry * 0.62); ctx.lineTo(x, -ry * 0.78); ctx.lineTo(x + 9, -ry * 0.62); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = rgrad(ctx, -rx * 0.34, -ry * 0.42, 0, rx * 0.9, [[0, 'rgba(255,240,210,0.5)'], [1, 'rgba(255,240,210,0)']]); ctx.fillRect(-rx, -ry, 2 * rx, 2 * ry);
      ctx.fillStyle = 'rgba(255,250,235,0.45)'; ell(ctx, -rx * 0.46, -ry * 0.5, rx * 0.2, ry * 0.07); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = 'rgba(30,12,4,0.7)'; ctx.lineWidth = 3; egg(ctx); ctx.stroke();
      // the sound window under the mouthpiece
      ctx.fillStyle = '#0a0402'; rrect(ctx, rx * 0.34, -ry * 0.46, 34, 20, 4); ctx.fill(); ctx.strokeStyle = 'rgba(240,200,150,0.7)'; ctx.lineWidth = 2; rrect(ctx, rx * 0.34, -ry * 0.46, 34, 20, 4); ctx.stroke();
      ctx.restore();
      mouth = [rx * 1.07 * Math.cos(ang) + (-ry * 1.14) * -Math.sin(ang), cu + rx * 1.07 * Math.sin(ang) + (-ry * 1.14) * Math.cos(ang)];
      for (let k = 0; k < nFront; k++) { const [x, u] = G.holeAt(k); holeDraw(x, u, Math.min(q * 0.19, 18 + (k % 3) * 2), k); }
    } else {
      const bw = q * L0.w, tubes = L0.twin ? [{ v: G.hv, w: bw, holes: true }, { v: G.hv + q * 0.92, w: bw * 0.96, holes: false }] : [{ v: 0, w: bw, holes: true }];
      const t0 = topU + q * 1.1;
      for (const tb of tubes) {
        const path = (c) => rrect(c, tb.v - tb.w / 2, t0 - 4, tb.w, footU - t0 + 4, tb.w * 0.3);
        ctx.save(); ctx.translate(q * 0.14, q * 0.12); ctx.fillStyle = 'rgba(0,0,0,0.34)'; path(ctx); ctx.fill(); ctx.restore();
        cyl(ctx, path, tb.v - tb.w / 2, tb.v + tb.w / 2, base, t0, footU, { seed: 4, spec: style === 'whistle' ? 0.6 : 0.36, grain: style !== 'whistle' });
        ctx.strokeStyle = rgba(darker(base, 0.8), 0.85); ctx.lineWidth = 2.5; path(ctx); ctx.stroke();
        ctx.save(); path(ctx); ctx.clip();
        if (style === 'furulya') for (let k = 0; k < L0.rings; k++) { const u = lerp(t0 + 20, footU - 20, k / (L0.rings - 1)); ctx.fillStyle = 'rgba(40,18,6,0.82)'; ctx.fillRect(tb.v - tb.w, u, 2 * tb.w, k % 3 === 0 ? 9 : 4); if (k % 3 === 0) { ctx.fillStyle = 'rgba(240,200,140,0.35)'; ctx.fillRect(tb.v - tb.w, u + 9, 2 * tb.w, 2); } }
        if (style === 'dvoyanka') for (let k = 0; k < 10; k++) { const u = lerp(t0 + 30, footU - 30, k / 9); ctx.strokeStyle = 'rgba(150,34,30,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(tb.v - tb.w / 2, u + 10); ctx.lineTo(tb.v, u); ctx.lineTo(tb.v + tb.w / 2, u + 10); ctx.stroke(); }
        if (style === 'whistle') { ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(tb.v - tb.w * 0.4, t0, tb.w * 0.12, footU - t0); }
        ctx.restore();
        ctx.fillStyle = '#100803'; ell(ctx, tb.v, footU, tb.w * 0.36, q * 0.07); ctx.fill();
      }
      // the mouthpiece: a beak with a window and a fipple edge (the duct), shared by the twin pipes
      const bl = q * 1.15, bx0 = tubes[0].v - tubes[0].w * 0.55, bx1 = tubes[tubes.length - 1].v + tubes[tubes.length - 1].w * 0.55, bw2 = bx1 - bx0, bcx = (bx0 + bx1) / 2;
      const beak = (c) => { if (L0.twin) { rrect(c, bx0 - 6, topU, bw2 + 12, t0 - topU + 6, 16); return; } c.beginPath(); c.moveTo(bx0 + 4, t0 + 2); c.lineTo(bcx - bw2 * 0.18, topU + 2); c.lineTo(bcx + bw2 * 0.18, topU + 2); c.lineTo(bx1 - 4, t0 + 2); c.closePath(); };
      ctx.save(); ctx.translate(6, 8); beak(ctx); ctx.fillStyle = 'rgba(0,0,0,0.34)'; ctx.fill(); ctx.restore();
      beak(ctx); ctx.fillStyle = hgrad(ctx, bx0, bx1, [[0, darker(L0.beak, 0.45)], [0.3, lighter(L0.beak, 0.5)], [0.6, L0.beak], [1, darker(L0.beak, 0.55)]]); ctx.fill(); ctx.strokeStyle = rgba(darker(L0.beak, 0.85), 0.9); ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(bx0 + bw2 * 0.2, topU + 6, bw2 * 0.1, bl * 0.7);
      if (L0.twin) { for (const tb of tubes) { ctx.fillStyle = '#070302'; ell(ctx, tb.v, topU + 12, tb.w * 0.28, 6); ctx.fill(); ctx.strokeStyle = 'rgba(255,220,170,0.5)'; ctx.lineWidth = 2; ell(ctx, tb.v, topU + 12, tb.w * 0.32, 7); ctx.stroke(); } for (const f of [0.3, 0.62]) { ctx.fillStyle = vgrad(ctx, topU + (t0 - topU) * f, topU + (t0 - topU) * f + 8, [[0, '#e8c070'], [1, '#8a5a20']]); ctx.fillRect(bx0 - 6, topU + (t0 - topU) * f, bw2 + 12, 8); } } else { ctx.fillStyle = '#070302'; ell(ctx, bcx, topU + 3, bw2 * 0.16, 5); ctx.fill(); }
      ctx.fillStyle = '#0a0402'; rrect(ctx, bx0 + bw2 * 0.16, t0 + q * 0.02, bw2 * 0.68, q * 0.22, 4); ctx.fill();   // the window
      ctx.fillStyle = lighter(base, 0.6); ctx.beginPath(); ctx.moveTo(bx0 + bw2 * 0.14, t0 + q * 0.24); ctx.lineTo(bx1 - bw2 * 0.14, t0 + q * 0.24); ctx.lineTo(bcx, t0 + q * 0.04); ctx.closePath(); ctx.fill();
      mouth = [bcx, topU + 4];
      for (let k = 0; k < nFront; k++) { const [x, u] = G.holeAt(k); holeDraw(x, u, Math.min(q * 0.17, G.step * 0.22), k); }
      if (L0.twin) for (let k = 0; k < 3; k++) { const u = lerp(G.hu0 + G.step * 1.5, G.hu1 - G.step * 0.5, k / 2); ctx.fillStyle = rgrad(ctx, G.hv + q * 0.92, u, 0, q * 0.17, [[0, '#000'], [1, '#2a1608']]); ell(ctx, G.hv + q * 0.92, u, q * 0.12, q * 0.125); ctx.fill(); ctx.strokeStyle = rgba(lighter(base, 0.65), 0.9); ctx.lineWidth = 2; ctx.stroke(); }
    }
    // air stream from the mouthpiece to the first open hole
    lanes.forEach((l, i) => {
      const sp = spots[i], f = hv(rt, i);
      if (f <= 0.03) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(l.color, 0.4 * f); ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mouth[0], mouth[1] + 8); ctx.lineTo(sp.v, sp.u); ctx.stroke();
      ctx.restore();
      glow(ctx, sp.v, sp.u, 66, l.color, 0.45 * f);
    });
    cues(ctx, rt, lanes, spots, (i, p) => [lerp(mouth[0], spots[i].v, p), lerp(mouth[1], spots[i].u, p)], (i) => spots[i].r * 0.95);
    if (!isHero()) lanes.forEach((l, i) => {
      const sp = spots[i], f = rt.flash[i] ?? 0;
      marker(ctx, sp.v, sp.u, sp.r * 0.95, l, f);
      if (sp.pillV !== undefined) { ctx.strokeStyle = rgba(l.color, 0.45); ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(sp.pillV + (ocar ? 0 : 34), sp.pillU); ctx.lineTo(sp.v - (ocar ? 0 : sp.r * 0.95), ocar ? sp.u + sp.r * 0.95 : sp.u); ctx.stroke(); ctx.setLineDash([]); }
    });
    ctx.restore();
    const size = g.px(15);
    if (!isHero()) lanes.forEach((l, i) => { const sp = spots[i], [x, y] = F.map(sp.pillV !== undefined ? sp.pillV : sp.v, sp.pillU !== undefined ? sp.pillU : sp.u); pill(ctx, l.name, x, y, 74, size, l.color, rt.flash[i]); });
  };
  return st;
}

registerWindStage({ id: 'flute', match: MATCH, build: (S, lanes, P, { key }) => createFlute(S, lanes, styleOf(key), P) });

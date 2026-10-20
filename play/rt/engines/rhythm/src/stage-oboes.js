// Conical double-reed pipes, the shawm and oboe family (1.19.0): shehnai, nadaswaram, zurna, rhaita, suona and hichiriki. One parametric stage (layout `holes`)
// draws a reed assembly (flat double reed, staple, lip disc), a bored body that widens to the bell, bands and rings, the finger holes and a flared bell, each
// instrument with its own proportions, wood, metal and decoration. No performer, no hands: covered holes glow, open ones show their dark bore.
// Lanes carry a `holes` string (front holes from the top; 1 = covered); a note is struck at its highest open hole, like the end-blown flutes of 1.6.0.
import { registerWindStage } from './registry.js';
import { clamp, mix, rgba, lighter, darker, glow, rrect, grain, hgrad, vgrad, rgrad, hash, ell, circ, TAU } from './art.js';
import { makeFrame, circleSpot, finishSpots, pill, lerp, isHero } from './stagekit.js';
import { setting, instrumentBox } from './set.js';
import { windSound } from './windvoice.js';
import { cues, drawPills, marker, stageBase, byPitchRank, hv } from './winds2.js';

const MATCH = /shehnai|shahnai|nadaswaram|nagaswaram|nadhaswaram|zurna|zurla|surla|rhaita|ghaita|gaita (?:marocaine|maghreb)|suona|hichiriki|sona\b/;
const STYLE_RE = { shehnai: /shehnai|shahnai/, nadaswaram: /nadaswaram|nagaswaram|nadhaswaram/, zurna: /zurna|zurla|surla/, rhaita: /rhaita|ghaita/, suona: /suona|sona\b/, hichiriki: /hichiriki/ };
const styleOf = (key) => { const k = String(key || '').toLowerCase(); for (const [n, re] of Object.entries(STYLE_RE)) if (re.test(k)) return n; return 'shehnai'; };

// widths in units of q (the cross-section scale of the screen); lengths as fractions of the instrument length L
const OB = {
  shehnai: { tilt: 0.0, dx: -0.1, lenF: 0.92, body: '#8a4a26', wT: 0.46, wB: 0.74, rl: 1.9, bell: { kind: 'brass', col: '#dcae52', wb: 2.0, f: 0.15 }, reed: { kind: 'bundle', col: '#ead9a2', thread: '#b3232a', w: 0.6 },
    staple: '#d8a84a', rings: [[0.04, 'brass'], [0.12, 'black'], [0.2, 'black'], [0.66, 'brass']], holes: [0.1, 0.95], wax: 0,
    set: { kind: 'tiles', base: '#3e2420', accent: '#d9b45a', light: '#ffd9a0' } },
  nadaswaram: { tilt: -0.08, dx: 0.16, lenF: 0.96, body: '#33201a', wT: 0.6, wB: 0.98, rl: 1.8, bell: { kind: 'wood', col: '#4a2a1c', wb: 2.3, f: 0.2, rim: '#d3a548' }, reed: { kind: 'bundle', col: '#efdca4', thread: '#e8d48a', w: 0.7 },
    staple: '#c9ccd2', rings: [[0.02, 'brass'], [0.09, 'bone'], [0.18, 'brass'], [0.3, 'bone'], [0.54, 'brass'], [0.62, 'bone'], [0.7, 'brass']], holes: [0.08, 0.7], wax: 5,
    set: { kind: 'planks', base: '#2a1a14', accent: '#d9b45a', light: '#ffe2b0', rug: 'diamond' } },
  zurna: { tilt: 0.1, dx: -0.18, lenF: 0.74, body: '#b9833f', wT: 0.54, wB: 0.82, rl: 2.2, bell: { kind: 'wood', col: '#a8702e', wb: 2.2, f: 0.27, rim: '#5a3414' }, reed: { kind: 'pirouette', col: '#e8d49a', thread: '#6a4a22', w: 0.46, disc: '#d8dce2', discW: 1.7 },
    staple: '#c9ccd2', rings: [[0.04, 'black'], [0.08, 'black'], [0.5, 'bone'], [0.54, 'black']], holes: [0.12, 0.96], wax: 0,
    set: { kind: 'earth', base: '#4a3220', accent: '#d9b45a', light: '#ffe0a8', rug: 'zigzag' } },
  rhaita: { tilt: 0.12, dx: 0.2, lenF: 0.84, body: '#6b2a1a', wT: 0.44, wB: 0.64, rl: 2.4, bell: { kind: 'brass', col: '#c9a040', wb: 1.9, f: 0.22 }, reed: { kind: 'pirouette', col: '#efe0b0', thread: '#a8322a', w: 0.42, disc: '#c9a040', discW: 1.15, tall: 1.5 },
    staple: '#c9a040', rings: [[0.08, 'gold'], [0.12, 'gold'], [0.34, 'gold'], [0.38, 'gold'], [0.62, 'gold'], [0.66, 'gold']], holes: [0.12, 0.96], wax: 0,
    set: { kind: 'cloth', base: '#16404a', accent: '#e6c878', light: '#ffe6b0' } },
  suona: { tilt: -0.1, dx: 0.02, lenF: 0.8, body: '#9a1e1a', wT: 0.5, wB: 0.74, rl: 2.1, bell: { kind: 'brass', col: '#e0b040', wb: 2.5, f: 0.22 }, reed: { kind: 'disc', col: '#efe2b4', thread: '#f0e0a0', w: 0.46, disc: '#e0b040', discW: 1.5 },
    staple: '#e0b040', rings: [[0.1, 'gold'], [0.15, 'gold'], [0.66, 'gold'], [0.72, 'gold']], holes: [0.12, 0.96], wax: 0, tassel: true,
    set: { kind: 'cloth', base: '#4a1616', accent: '#e8c070', light: '#fff0c8' } },
  hichiriki: { tilt: 0.0, dx: -0.08, lenF: 0.7, body: '#2a1a12', wT: 0.7, wB: 0.7, rl: 1.7, bell: { kind: 'none', col: '#2a1a12', wb: 0.7, f: 0.0 }, reed: { kind: 'barkreed', col: '#e6d29a', thread: '#a64a20', w: 0.85 },
    staple: '#8a5a2a', rings: [], holes: [0.08, 0.95], wax: 0, bark: true,
    set: { kind: 'inkwash', base: '#1b2220', accent: '#8a7a5a', light: '#e8d8b0' } },
};

// a lit solid for a path made of a left and right edge: horizontal band shading with a lit side and a long highlight streak
export function cyl(ctx, path, x0, x1, base, u0, u1, o = {}) {
  path(ctx); ctx.fillStyle = hgrad(ctx, x0, x1, [[0, darker(base, 0.62)], [0.14, lighter(base, 0.5)], [0.34, lighter(base, 0.1)], [0.6, base], [0.84, darker(base, 0.45)], [1, darker(base, 0.72)]]); ctx.fill();
  ctx.save(); path(ctx); ctx.clip();
  if (o.grain !== false) grain(ctx, x0, u0, x1 - x0, u1 - u0, darker(base, 0.7), o.grainA ?? 0.32, o.seed ?? 5, true, 12);
  const cx = (x0 + x1) / 2, w = x1 - x0;
  ctx.fillStyle = hgrad(ctx, cx - w * 0.34, cx - w * 0.1, [[0, 'rgba(255,255,255,0)'], [0.5, `rgba(255,252,236,${o.spec ?? 0.34})`], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(cx - w * 0.34, u0, w * 0.24, u1 - u0);
  ctx.restore();
}

export function createOboe(S, lanes, style, P) {
  const N = lanes.length, st = stageBase('oboe', style, lanes), spots = st.spots, L0 = OB[style] ?? OB.shehnai;
  L0.set = { ...L0.set, ...(P?.set ?? {}) };
  st.voiceOf = () => 'shawm';
  const nFront = clamp(Math.max(0, ...lanes.map((l) => (l.holes || '').length)) || 7, 3, 10);
  const fingerOf = (i) => { const h = lanes[i].holes || ''; return Array.from({ length: nFront }, (_, k) => h[k] === '1'); };
  const first = lanes.map((l) => { const h = l.holes || ''; let c = 0; while (c < h.length && h[c] === '1') c++; return h ? c : null; });
  const { order } = byPitchRank(lanes);
  order.forEach((i, rank) => { if (first[i] == null) first[i] = clamp(nFront - rank, 0, nFront); });
  const reg = new Array(N).fill(0), groups = new Map();
  order.forEach((i) => { groups.set(first[i], [...(groups.get(first[i]) ?? []), i]); });
  groups.forEach((list) => list.forEach((i, r) => { reg[i] = r; }));
  const fing = new Array(nFront).fill(1);
  let lastAnim = 0;
  st.layout = (area) => {
    const F = makeFrame(area, { top: 40, bottom: 10, side: 16, tilt: L0.tilt || 0, dx: L0.dx || 0, zoom: 1 }); st.F = F;
    const { W, H } = F, q = clamp(W * 0.17, 40, 112), Lg = H * L0.lenF, topU = (H - Lg) / 2, bodyTop = topU + q * L0.rl, footU = topU + Lg;
    const bellStart = footU - Lg * L0.bell.f, hu0 = lerp(bodyTop, bellStart, L0.holes[0]), hu1 = lerp(bodyTop, bellStart, L0.holes[1]);
    const step = (hu1 - hu0) / nFront;
    const G = { W, H, q, Lg, topU, bodyTop, bellStart, footU, hu0, hu1, step, regGap: clamp(W * 0.22, 66, 150) };
    G.holeAt = (k) => hu0 + (k + 0.5) * step;
    G.hw = (u) => (u <= bellStart ? lerp(L0.wT, L0.wB, clamp((u - bodyTop) / Math.max(1, bellStart - bodyTop), 0, 1)) * q / 2 : lerp(L0.wB * q / 2, L0.bell.wb * q / 2, Math.pow(clamp((u - bellStart) / Math.max(1, footU - bellStart), 0, 1), 2.3)));
    st.G = G;
    const R = clamp(step * 0.5, 22, 38);
    lanes.forEach((_, i) => {
      const c = first[i], u = c >= nFront ? hu1 + step * 0.45 : G.holeAt(c), pw = G.hw(u) * 2, v = reg[i] ? (pw * 0.5 + G.regGap * 0.6) + (reg[i] - 1) * G.regGap * 0.9 : 0;
      spots[i] = circleSpot(v, u, R + (reg[i] ? 6 : 0), { first: c, reg: reg[i] });
      if (!reg[i]) { const pv = -(pw * 0.5 + 54), sp = spots[i], own = sp.dist; sp.pillV = pv; sp.dist = (lv, lu) => Math.min(own(lv, lu), Math.hypot(lv - pv, lu - sp.u) / (R * 0.9)); }
    });
    finishSpots(F, spots);
  };
  st.sound = (audio, p) => windSound(audio, 'shawm', { ...p, style });
  st.countSpot = () => {
    const F = st.F, G = st.G;
    if (!F || !G) return null;
    const [x, y] = F.landscape ? F.map(F.W * 0.3, G.H * 0.17) : F.map(-F.W * 0.27, G.H * 0.14);
    return { x, y, size: clamp(Math.min(F.W, G.H) * 0.2, 56, 120) };
  };
  st.draw = (g, rt) => {
    const { ctx } = g, F = st.F;
    if (!F) return;
    const G = st.G, { q, topU, bodyTop, bellStart, footU, step } = G, hw = G.hw, body = L0.body, bell = L0.bell;
    let act = -1, best = 0.02;
    lanes.forEach((_, i) => { const v = hv(rt, i); if (v > best) { best = v; act = i; } });
    const dtv = clamp(rt.anim - lastAnim, 0, 0.1); lastAnim = rt.anim;
    const tgt = act >= 0 ? fingerOf(act) : new Array(nFront).fill(true);
    for (let k = 0; k < nFront; k++) fing[k] += ((tgt[k] ? 1 : 0) - fing[k]) * clamp(dtv * 18, 0, 1);
    const col = act >= 0 ? lanes[act].color : '#ffd9a0', live = act >= 0 ? best : 0;
    setting(ctx, F, L0.set.kind, S, rt, { ...L0.set, rugKind: L0.set.rug || null, rugBase: '#2a1a16', rugA: '#d9b45a', rugB: '#8a2a22', bbox: instrumentBox(F) });
    ctx.save(); F.apply(ctx);
    const steps = 44;
    const bodyP = (c) => { c.beginPath(); for (let k = 0; k <= steps; k++) { const u = lerp(bodyTop, bellStart + 1, k / steps); c.lineTo(-hw(u), u); } for (let k = steps; k >= 0; k--) { const u = lerp(bodyTop, bellStart + 1, k / steps); c.lineTo(hw(u), u); } c.closePath(); };
    const bellP = (c) => { c.beginPath(); for (let k = 0; k <= steps; k++) { const u = lerp(bellStart, footU, k / steps); c.lineTo(-hw(u), u); } for (let k = steps; k >= 0; k--) { const u = lerp(bellStart, footU, k / steps); c.lineTo(hw(u), u); } c.closePath(); };
    const wMax = hw(footU) + 6;
    // shadow of the whole silhouette
    ctx.save(); ctx.translate(q * 0.18, q * 0.14); ctx.fillStyle = 'rgba(0,0,0,0.34)'; bodyP(ctx); ctx.fill(); bellP(ctx); ctx.fill(); ctx.restore();
    // the body
    cyl(ctx, bodyP, -hw(bellStart), hw(bellStart), body, bodyTop, bellStart, { seed: 7, spec: 0.38 });
    ctx.save(); bodyP(ctx); ctx.clip();
    if (L0.bark) {   // wrapped in bands of cherry bark: glossy red-brown strips with pale lenticel dashes, pale seams between and a dark lacquer showing at the edges
      const nb = 12;
      for (let k = 0; k < nb; k++) {
        const u = lerp(bodyTop, bellStart, k / nb), h2 = (bellStart - bodyTop) / nb;
        ctx.fillStyle = vgrad(ctx, u, u + h2, [[0, '#8a3a1c'], [0.5, '#5a2410'], [1, '#2a0e06']]); ctx.fillRect(-q, u + 1, 2 * q, h2 - 3);
        ctx.fillStyle = 'rgba(240,200,150,0.5)'; for (let d = -3; d <= 3; d++) ctx.fillRect(d * q * 0.2 - 6, u + h2 * 0.4, 12, 2.4);
        ctx.fillStyle = 'rgba(255,240,210,0.4)'; ctx.fillRect(-q, u + h2 - 2, 2 * q, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(-q * 0.5, u + 2, q * 0.12, h2 - 5);
      }
    }
    ctx.restore();
    ctx.strokeStyle = rgba(darker(body, 0.75), 0.8); ctx.lineWidth = 3; bodyP(ctx); ctx.stroke();
    // bands and rings
    for (const [f, kind] of L0.rings) {
      const u = lerp(bodyTop, bellStart, f), w = hw(u) + 3, h = kind === 'black' ? q * 0.07 : kind === 'bone' ? q * 0.13 : q * 0.11, c0 = { brass: '#d8a84a', gold: '#e6c15a', black: '#120a06', bone: '#efe4c6' }[kind] ?? '#d8a84a';
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-w + 2, u + 3, 2 * w, h);
      ctx.fillStyle = hgrad(ctx, -w, w, kind === 'black' ? [[0, '#050302'], [0.3, '#34281e'], [1, '#050302']] : [[0, darker(c0, 0.55)], [0.2, lighter(c0, 0.6)], [0.45, c0], [0.8, darker(c0, 0.4)], [1, darker(c0, 0.65)]]); rrect(ctx, -w, u, 2 * w, h, h * 0.4); ctx.fill();
    }
    // wax-plugged tuning holes down the lower body (nadaswaram)
    for (let k = 0; k < L0.wax; k++) { const u = lerp(G.hu1 + step * 0.35, bellStart - 8, (k + 0.5) / L0.wax), r = q * 0.07; ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, 2, u + 2, r + 2); ctx.fill(); ctx.fillStyle = rgrad(ctx, 0, u, 0, r, [[0, '#e8d8a0'], [1, '#8a6a30']]); circ(ctx, 0, u, r); ctx.fill(); }
    // the flared bell
    if (bell.kind !== 'none') {
      const bc = bell.col;
      cyl(ctx, bellP, -wMax, wMax, bc, bellStart, footU, { seed: 11, spec: bell.kind === 'brass' ? 0.5 : 0.34, grain: bell.kind !== 'brass', grainA: 0.3 });
      ctx.save(); bellP(ctx); ctx.clip();
      if (bell.kind === 'brass') { for (const f of [0.35, 0.7]) { ctx.strokeStyle = rgba(lighter(bc, 0.7), 0.4); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-wMax, lerp(bellStart, footU, f)); ctx.quadraticCurveTo(0, lerp(bellStart, footU, f) + q * 0.14, wMax, lerp(bellStart, footU, f)); ctx.stroke(); } }
      else { for (let k = 1; k < 5; k++) { const u = lerp(bellStart, footU, k / 5); ctx.fillStyle = 'rgba(20,8,2,0.5)'; ctx.fillRect(-wMax, u, 2 * wMax, 4); ctx.fillStyle = 'rgba(255,230,180,0.25)'; ctx.fillRect(-wMax, u + 4, 2 * wMax, 2); } }
      ctx.restore();
      ctx.strokeStyle = rgba(darker(bc, 0.8), 0.85); ctx.lineWidth = 3; bellP(ctx); ctx.stroke();
      // the lip of the bell: a rim and a dark bore
      const rw = hw(footU), rimC = bell.rim ?? lighter(bc, 0.25);
      ctx.fillStyle = vgrad(ctx, footU - q * 0.2, footU + q * 0.1, [[0, lighter(rimC, 0.3)], [1, darker(rimC, 0.4)]]); ell(ctx, 0, footU - 2, rw + 3, q * 0.2); ctx.fill();
      ctx.fillStyle = rgrad(ctx, 0, footU - 2, 0, rw, [[0, '#040201'], [0.8, '#140a04'], [1, '#2a160a']]); ell(ctx, 0, footU - 1, rw * 0.9, q * 0.15); ctx.fill();
      ctx.strokeStyle = rgba(lighter(rimC, 0.7), 0.7); ctx.lineWidth = 2; ell(ctx, 0, footU - 2, rw + 3, q * 0.2); ctx.stroke();
    } else {
      ctx.fillStyle = '#100803'; ell(ctx, 0, footU - 1, hw(footU) * 0.92, q * 0.14); ctx.fill();
      ctx.strokeStyle = rgba(lighter(body, 0.6), 0.6); ctx.lineWidth = 2; ell(ctx, 0, footU - 1, hw(footU) * 0.96, q * 0.16); ctx.stroke();
    }
    if (L0.tassel) {   // a short red tassel on a cord from the bell
      const tu = bellStart + 6, sw = Math.sin(rt.anim * 3) * 4 + live * 6 * Math.sin(rt.anim * 30);
      ctx.strokeStyle = '#e8c15a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hw(tu), tu); ctx.quadraticCurveTo(hw(tu) + 20, tu + 8, hw(tu) + 20 + sw, tu + 30); ctx.stroke();
      ctx.fillStyle = '#c0242a'; ctx.beginPath(); ctx.moveTo(hw(tu) + 20 + sw, tu + 28); for (let k = 0; k <= 6; k++) ctx.lineTo(hw(tu) + 8 + sw * 1.4 + k * 4, tu + 66 + (k % 2) * 4); ctx.closePath(); ctx.fill();
    }
    // the reed assembly at the top: staple, lip disc and the flat double reed
    const rd = L0.reed, sw0 = q * 0.16, stU0 = topU + q * (L0.rl - 0.9), rbase = bodyTop;
    // staple (a small metal tube that joins reed and body)
    ctx.fillStyle = hgrad(ctx, -sw0, sw0, [[0, darker(L0.staple, 0.55)], [0.25, lighter(L0.staple, 0.6)], [0.6, L0.staple], [1, darker(L0.staple, 0.6)]]); ctx.fillRect(-sw0, rbase - q * 0.7, 2 * sw0, q * 0.72);
    ctx.strokeStyle = 'rgba(20,10,0,0.5)'; ctx.lineWidth = 1.5; ctx.strokeRect(-sw0, rbase - q * 0.7, 2 * sw0, q * 0.72);
    if (rd.kind === 'pirouette' || rd.kind === 'disc') {
      const dw = q * rd.discW / 2, du = rbase - q * (rd.kind === 'disc' ? 0.34 : 0.62);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, 3, du + 4, dw, q * 0.14); ctx.fill();
      ctx.fillStyle = vgrad(ctx, du - q * 0.1, du + q * 0.1, [[0, lighter(rd.disc, 0.5)], [0.5, rd.disc], [1, darker(rd.disc, 0.5)]]); ell(ctx, 0, du, dw, q * 0.13); ctx.fill();
      ctx.strokeStyle = rgba(darker(rd.disc, 0.7), 0.8); ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ell(ctx, -dw * 0.35, du - q * 0.035, dw * 0.35, q * 0.03); ctx.fill();
    }
    {   // the reed: two thin cane blades pressed together, flat, with a thread binding and a slit at the tip
      const rw = q * rd.w / 2, ru1 = topU, ru0 = rbase - q * (rd.kind === 'pirouette' ? 0.78 : 0.62) - (rd.tall ? 0 : 0), sq = rd.kind === 'barkreed' ? 1.2 : 1;
      const rp = (c) => { c.beginPath(); c.moveTo(-sw0 * 1.2, ru0); c.bezierCurveTo(-rw * 0.95, ru0 - (ru0 - ru1) * 0.3, -rw * sq, ru1 + (ru0 - ru1) * 0.28, -rw * 0.82, ru1 + q * 0.12); c.quadraticCurveTo(0, ru1 - q * 0.1, rw * 0.82, ru1 + q * 0.12); c.bezierCurveTo(rw * sq, ru1 + (ru0 - ru1) * 0.28, rw * 0.95, ru0 - (ru0 - ru1) * 0.3, sw0 * 1.2, ru0); c.closePath(); };
      ctx.save(); ctx.translate(2, 5); rp(ctx); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill(); ctx.restore();
      rp(ctx); ctx.fillStyle = hgrad(ctx, -rw, rw, [[0, darker(rd.col, 0.35)], [0.25, lighter(rd.col, 0.4)], [0.55, rd.col], [1, darker(rd.col, 0.4)]]); ctx.fill();
      ctx.save(); rp(ctx); ctx.clip(); ctx.strokeStyle = 'rgba(110,80,30,0.4)'; ctx.lineWidth = 1.2; for (let k = -4; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(k * rw * 0.2, ru1); ctx.lineTo(k * rw * 0.12, ru0); ctx.stroke(); } ctx.restore();
      ctx.strokeStyle = 'rgba(60,40,10,0.7)'; ctx.lineWidth = 2; rp(ctx); ctx.stroke();
      ctx.fillStyle = '#1a0e04'; ell(ctx, 0, ru1 + q * 0.1, rw * 0.7, q * 0.045); ctx.fill();
      for (const f of [0.4, 0.62]) { const u = lerp(ru1, ru0, f), w2 = rw * (0.62 + 0.3 * f); ctx.fillStyle = vgrad(ctx, u, u + q * 0.12, [[0, lighter(rd.thread, 0.3)], [1, darker(rd.thread, 0.4)]]); rrect(ctx, -w2, u, 2 * w2, q * 0.11, 3); ctx.fill(); }
    }
    // holes. Closed ones show a lit pad (no finger drawn): brightness follows the sounding note
    const padA = 0.22 + 0.78 * Math.min(1, live * 1.4), r = Math.min(q * 0.2, step * 0.22);
    for (let k = 0; k < nFront; k++) {
      const u = G.holeAt(k), c = fing[k], hh = r;
      ctx.fillStyle = 'rgba(0,0,0,0.32)'; ell(ctx, 2, u + 3, hh + 2, hh * 1.05 + 2); ctx.fill();
      ctx.fillStyle = rgrad(ctx, 0, u, 0, hh * 1.1, [[0, '#000'], [0.7, '#140a04'], [1, '#2a1608']]); ell(ctx, 0, u, hh, hh * 1.05); ctx.fill();
      ctx.strokeStyle = rgba(lighter(body, 0.65), 0.9); ctx.lineWidth = 2; ctx.stroke();
      if (c > 0.05 && !isHero()) {
        const pr = hh * 1.55;
        ctx.fillStyle = rgba(lighter(col, 0.3), 0.18 + 0.6 * padA * c); circ(ctx, 0, u, pr); ctx.fill();
        ctx.strokeStyle = rgba(lighter(col, 0.65), (0.3 + 0.7 * padA) * c); ctx.lineWidth = 2.5; ctx.stroke();
        if (live > 0.03) glow(ctx, 0, u, pr * 2.6, col, 0.32 * c * live);
      }
    }
    // air stream from the reed down the bore to the first open hole while a note sounds
    lanes.forEach((l, i) => {
      const sp = spots[i], f = hv(rt, i);
      if (f <= 0.03) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = vgrad(ctx, bodyTop, sp.u, [[0, rgba(l.color, 0.5 * f)], [1, rgba(l.color, 0.1 * f)]]); rrect(ctx, -q * 0.12, bodyTop, q * 0.24, Math.max(4, sp.u - bodyTop), q * 0.1); ctx.fill();
      ctx.strokeStyle = rgba('#ffffff', 0.55 * f); ctx.lineWidth = 2.5;
      for (let k = 0; k < 3; k++) { const p = (rt.anim * 1.5 + k / 3) % 1; ctx.globalAlpha = (1 - p) * f; ctx.beginPath(); ctx.arc(sp.v + (sp.reg ? 0 : hw(sp.u) * 0.9), sp.u, 14 + 40 * p, -0.9, 0.9); ctx.stroke(); }
      ctx.restore();
      glow(ctx, sp.v, sp.u, 66, l.color, 0.45 * f);
    });
    if (live > 0.2) {   // the bell opens: rings of sound leave it
      for (let k = 0; k < 3; k++) { const p = (rt.anim * 0.9 + k / 3) % 1; ctx.strokeStyle = rgba(col, 0.4 * (1 - p) * live); ctx.lineWidth = 3; ell(ctx, 0, footU + 12 + p * q * 0.9, hw(footU) * (0.8 + 0.6 * p), q * (0.16 + 0.2 * p)); ctx.stroke(); }
    }
    cues(ctx, rt, lanes, spots, (i, p) => [lerp(0, spots[i].v, p), lerp(topU + q * 0.4, spots[i].u, p)], (i) => spots[i].r * 0.95);
    if (!isHero()) lanes.forEach((l, i) => {
      const sp = spots[i], f = rt.flash[i] ?? 0;
      marker(ctx, sp.v, sp.u, sp.r * 0.95, l, f);
      if (sp.reg) { ctx.strokeStyle = rgba(l.color, 0.4); ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.moveTo(sp.v, sp.u); ctx.lineTo(hw(sp.u), sp.u); ctx.stroke(); ctx.setLineDash([]); }
      else { ctx.strokeStyle = rgba(l.color, 0.45); ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(sp.pillV + 34, sp.u); ctx.lineTo(sp.v - sp.r * 0.95, sp.u); ctx.stroke(); ctx.setLineDash([]); }
    });
    ctx.restore();
    drawPills(g, F, spots, lanes, rt, (i) => [spots[i].reg ? spots[i].v : spots[i].pillV, spots[i].u]);
  };
  return st;
}

registerWindStage({ id: 'oboe', match: MATCH, build: (S, lanes, P, { key }) => createOboe(S, lanes, styleOf(key), P) });

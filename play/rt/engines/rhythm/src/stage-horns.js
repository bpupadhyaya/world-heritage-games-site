// Horns and trumpets, figure-free (1.19.2): kombu (a C-shaped brass horn), kakaki (a very long metal trumpet), kudu horn (a spiral-twisted antelope horn), vuvuzela (a bright
// plastic horn), siwa horn (a big side-blown horn of carved ivory), kajji horn (an antelope horn lengthened with a gourd) and kamba funnel trumpet (a bamboo tube in a calabash funnel).
// One parametric builder (layout `holes`): a tube drawn along a centre line with a width profile, shaded like a lit ribbon; the lanes are the notes the player can overblow,
// markers sitting along the tube (higher notes nearer the mouthpiece). The `timbalamhala` stage is a hocket: a fan of antelope horns, one pitch each, one lane per horn.
// A note lights its marker, a band of breath runs from the mouth to it and rings of sound leave the bell. No performer, no hands.
import { registerWindStage } from './registry.js';
import { clamp, mix, rgba, lighter, darker, glow, rrect, grain, hgrad, vgrad, rgrad, hash, ell, circ, TAU } from './art.js';
import { makeFrame, circleSpot, finishSpots, pill, lerp, isHero } from './stagekit.js';
import { setting, instrumentBox } from './set.js';
import { windSound } from './windvoice.js';
import { cues, marker, stageBase, byPitchRank, hv } from './winds2.js';

const MATCH = /kombu|kakaki|malakat|lepapata|kudu horn|vuvuzela|siwa horn|\bsiwa\b|kajji|antelope.?horn.*side|kamba funnel|funnel trumpet|timbalamhala/;
const STYLE_RE = { timbalamhala: /timbalamhala/, kombu: /kombu/, kakaki: /kakaki|malakat/, kudu: /lepapata|kudu/, vuvuzela: /vuvuzela/, siwa: /siwa/, kajji: /kajji|side.blown/, kamba: /kamba|funnel/ };
const styleOf = (key) => { const k = String(key || '').toLowerCase(); for (const [n, re] of Object.entries(STYLE_RE)) if (re.test(k)) return n; return 'kombu'; };

// ---- centre lines (design space: v -280..280, u 0..900), s = 0 at the mouthpiece, 1 at the bell ----------------------------------------------------
const PATH = {
  kombu: (s) => { const th = lerp(-1.32, 1.32, s); return [-70 + 250 * Math.cos(th), 450 + 372 * Math.sin(th)]; },
  kakaki: (s) => [-96 + 196 * s + 20 * Math.sin(s * TAU), 40 + 830 * s],
  kudu: (s) => [90 * Math.sin(s * 5.4 + 0.4) * (0.35 + 0.65 * s) + 40 * (1 - s) - 20, 44 + 800 * s],
  vuvuzela: (s) => [0, 60 + 780 * s],
  siwa: (s) => [130 - 250 * s + 120 * Math.sin(Math.PI * s), 80 + 760 * s],
  kajji: (s) => [140 - 270 * s + 80 * Math.sin(Math.PI * s * 0.95), 70 + 780 * s],
  kamba: (s) => [0, 50 + 800 * s],
};
const HALF = {   // half-width of the tube along s
  kombu: (s) => lerp(9, 17, s) + 62 * Math.pow(Math.max(0, (s - 0.68) / 0.32), 2.3),
  kakaki: (s) => lerp(7, 13, Math.pow(s, 0.8)) + 24 * Math.pow(Math.max(0, (s - 0.88) / 0.12), 2),
  kudu: (s) => lerp(7, 56, Math.pow(s, 1.25)) * (1 + 0.06 * Math.sin(s * 40)),
  vuvuzela: (s) => lerp(12, 24, s) + 36 * Math.pow(Math.max(0, (s - 0.5) / 0.5), 1.7),
  siwa: (s) => lerp(14, 64, Math.pow(s, 1.4)),
  kajji: (s) => (s < 0.58 ? lerp(8, 40, Math.pow(s / 0.58, 1.3)) : lerp(40, 62, (s - 0.58) / 0.42) * (1 + 0.28 * Math.sin(((s - 0.58) / 0.42) * Math.PI) )),
  kamba: (s) => (s < 0.72 ? 16 : lerp(16, 16, 0) + 66 * Math.pow((s - 0.72) / 0.28, 1.6)),
};
const LOOK = {
  kombu: { dx: 0.0, set: { kind: 'tiles', base: '#3a2420', accent: '#d9b45a', light: '#ffd9a0' }, col: '#d8a43c', style: 'kombu', marks: [0.16, 0.28, 0.4, 0.52, 0.64] },
  kakaki: { dx: 0.04, set: { kind: 'earth', base: '#5a3a22', light: '#ffe2b0', rug: 'zigzag', rugBase: '#2a1c12', rugA: '#d8b068', rugB: '#8a3a22' }, col: '#d6d2c4', style: 'kakaki', marks: [0.2, 0.36, 0.52, 0.68] },
  kudu: { dx: -0.1, set: { kind: 'earth', base: '#6a4a2c', light: '#ffe2b0', rug: 'stripes', rugBase: '#2a1c12', rugA: '#d8b068', rugB: '#a8482a' }, col: '#8a5a30', style: 'kudu', marks: [0.2, 0.42, 0.64] },
  vuvuzela: { dx: -0.2, set: { kind: 'asphalt', base: '#232830', light: '#e8f0ff' }, col: '#f2d628', style: 'vuvuzela', marks: [0.3, 0.5, 0.7] },
  siwa: { dx: 0.0, set: { kind: 'tiles', base: '#1e3a44', accent: '#d9c280', light: '#fff0c8' }, col: '#efe2c0', style: 'siwa', marks: [0.24, 0.42, 0.6] },
  kajji: { dx: 0.06, set: { kind: 'earth', base: '#5a4026', light: '#ffe2b0', rug: 'diamond', rugBase: '#22301e', rugA: '#d8b068', rugB: '#8a3a22' }, col: '#cfb98a', style: 'kajji', marks: [0.16, 0.34, 0.52] },
  kamba: { dx: 0.2, set: { kind: 'cloth', base: '#3a4a2a', accent: '#e0c868', light: '#fff0c8' }, col: '#cfc060', style: 'kamba', marks: [0.18, 0.34, 0.5] },
};

// a ribbon along a centre line between offsets a and b (fractions of the half-width, -1 = left, +1 = right)
function ribbon(ctx, C, Wd, a, b, from = 0, to = C.length - 1) {
  ctx.beginPath();
  for (let k = from; k <= to; k++) { const [x, y, nx, ny] = C[k], w = Wd[k]; ctx.lineTo(x + nx * w * a, y + ny * w * a); }
  for (let k = to; k >= from; k--) { const [x, y, nx, ny] = C[k], w = Wd[k]; ctx.lineTo(x + nx * w * b, y + ny * w * b); }
  ctx.closePath();
}

export function createHorns(S, lanes, style, P) {
  const N = lanes.length, L0 = LOOK[style] ?? LOOK.kombu;
  L0.set = { ...L0.set, ...(P?.set ?? {}) };
  const st = stageBase('horn', style, lanes), spots = st.spots;
  st.voiceOf = () => 'horn';
  st.sound = (audio, p) => windSound(audio, 'horn', { ...p, style: L0.style });
  const { order, rank } = byPitchRank(lanes);
  const DW = 560, DH = 900;
  let C = null, Wd = null;
  st.layout = (area) => {
    const F = makeFrame(area, { top: 40, bottom: 10, side: 14, dx: L0.dx || 0, zoom: 1 }); st.F = F;
    const { W, H } = F, k = Math.min(W / DW, H / DH), u0 = (H - DH * k) / 2;
    st.G = { W, H, k, u0 };
    const path = PATH[style] ?? PATH.kombu, half = HALF[style] ?? HALF.kombu, n = 120;
    C = []; Wd = [];
    for (let i = 0; i <= n; i++) {
      const s = i / n, [x, y] = path(s), [x2, y2] = path(Math.min(1, s + 0.004)), [x1, y1] = path(Math.max(0, s - 0.004));
      let dx = x2 - x1, dy = y2 - y1; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      C.push([x, y, -dy, dx]); Wd.push(half(s));
    }
    const R = clamp(60 * k, 22, 44), marks = L0.marks;
    lanes.forEach((_, i) => {
      const r = rank[i], s = N <= marks.length ? marks[r] : 0.14 + 0.56 * r / Math.max(1, N - 1), [x, y] = path(s);
      spots[i] = circleSpot(x * k, u0 + y * k, R, { s, dx: x, dy: y });
    });
    finishSpots(F, spots);
  };
  st.countSpot = () => {
    const F = st.F, G = st.G;
    if (!F || !G) return null;
    const [x, y] = F.landscape ? F.map(F.W * 0.3, G.H * 0.12) : F.map(-F.W * 0.3, G.H * 0.08);
    return { x, y, size: clamp(Math.min(F.W, G.H) * 0.16, 48, 100) };
  };
  st.draw = (g, rt) => {
    const { ctx } = g, F = st.F;
    if (!F || !C) return;
    const G = st.G, k = G.k;
    let act = -1, best = 0.02;
    lanes.forEach((_, i) => { const v = hv(rt, i); if (v > best) { best = v; act = i; } });
    const col = act >= 0 ? lanes[act].color : '#ffd9a0', live = act >= 0 ? best : 0;
    setting(ctx, F, L0.set.kind, S, rt, { ...L0.set, rugKind: L0.set.rug || null, rugPad: 0.04, rugTall: 0.4, bbox: instrumentBox(F) });
    ctx.save(); F.apply(ctx); ctx.translate(0, G.u0); ctx.scale(k, k);
    const base = L0.col, nC = C.length;
    // shadow, then the lit body: dark under side, base, a broad light band and a thin glint on the lit side
    ctx.save(); ctx.translate(10, 14); ribbon(ctx, C, Wd, -1, 1); ctx.fillStyle = 'rgba(0,0,0,0.34)'; ctx.fill(); ctx.restore();
    ribbon(ctx, C, Wd, -1, 1); ctx.fillStyle = darker(base, 0.5); ctx.fill();
    ribbon(ctx, C, Wd, -0.86, 0.78); ctx.fillStyle = base; ctx.fill();
    ribbon(ctx, C, Wd, -0.72, 0.1); ctx.fillStyle = rgba(lighter(base, 0.4), 0.7); ctx.fill();
    ribbon(ctx, C, Wd, -0.6, -0.3); ctx.fillStyle = rgba(lighter(base, 0.85), 0.55 + (style === 'kombu' || style === 'kakaki' ? 0.15 : 0)); ctx.fill();
    ribbon(ctx, C, Wd, 0.5, 0.95); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fill();
    ctx.strokeStyle = rgba(darker(base, 0.8), 0.85); ctx.lineWidth = 3; ribbon(ctx, C, Wd, -1, 1); ctx.stroke();
    // per-instrument dressing, along the centre line
    const at = (s) => C[clamp(Math.round(s * (nC - 1)), 0, nC - 1)];
    const bandAt = (s, thick, colr, widen = 1.18) => { const [x, y, nx, ny] = at(s), w = Wd[clamp(Math.round(s * (nC - 1)), 0, nC - 1)] * widen, tx = ny, ty = -nx; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(ny, nx) + Math.PI / 2 * 0 ); ctx.restore(); const a = [x + nx * w - tx * thick / 2, y + ny * w - ty * thick / 2], b = [x - nx * w - tx * thick / 2, y - ny * w - ty * thick / 2], c2 = [x - nx * w + tx * thick / 2, y - ny * w + ty * thick / 2], d = [x + nx * w + tx * thick / 2, y + ny * w + ty * thick / 2];
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c2[0], c2[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); const gr = ctx.createLinearGradient(a[0], a[1], b[0], b[1]); gr.addColorStop(0, darker(colr, 0.45)); gr.addColorStop(0.25, lighter(colr, 0.7)); gr.addColorStop(0.55, colr); gr.addColorStop(1, darker(colr, 0.55)); ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = rgba(darker(colr, 0.8), 0.7); ctx.lineWidth = 1.6; ctx.stroke(); };
    const stripe = (s0, s1, f0, f1, colr, a) => { ribbon(ctx, C, Wd, f0, f1, clamp(Math.round(s0 * (nC - 1)), 0, nC - 1), clamp(Math.round(s1 * (nC - 1)), 0, nC - 1)); ctx.fillStyle = rgba(colr, a); ctx.fill(); };
    if (style === 'kombu') { for (const s of [0.1, 0.3, 0.5, 0.66]) bandAt(s, 14, '#e8c870'); bandAt(0.975, 18, '#e8c870', 1.02); for (let q = 0; q < 14; q++) { const s = 0.72 + 0.24 * q / 13, [x, y] = at(s); ctx.fillStyle = 'rgba(80,50,10,0.35)'; circ(ctx, x, y, 4); ctx.fill(); } }
    if (style === 'kakaki') { for (let q = 0; q < 8; q++) bandAt(0.1 + q * 0.105, 12, q % 2 ? '#c9a040' : '#e8e4d8'); bandAt(0.99, 14, '#c9a040', 1.05); stripe(0, 1, -0.2, 0.2, '#ffffff', 0.15); }
    if (style === 'kudu') { // spiral ridges of a twisted horn: slanted bands that wind along the length; growth rings; a pale polished tip
      for (let q = 0; q < 34; q++) { const s = 0.08 + 0.9 * q / 33, [x, y, nx, ny] = at(s), w = Wd[clamp(Math.round(s * (nC - 1)), 0, nC - 1)], sl = 0.5; ctx.strokeStyle = 'rgba(30,14,4,0.5)'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(x + nx * w * 0.96 - ny * w * sl, y + ny * w * 0.96 + nx * w * sl); ctx.quadraticCurveTo(x - ny * w * 0.1, y + nx * w * 0.1 + w * 0.25, x - nx * w * 0.96 + ny * w * sl, y - ny * w * 0.96 - nx * w * sl); ctx.stroke(); ctx.strokeStyle = 'rgba(255,230,180,0.28)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x + nx * w * 0.9 - ny * w * sl + 2, y + ny * w * 0.9 + nx * w * sl + 3); ctx.quadraticCurveTo(x - ny * w * 0.1 + 2, y + nx * w * 0.1 + w * 0.25 + 3, x - nx * w * 0.9 + ny * w * sl + 2, y - ny * w * 0.9 - nx * w * sl + 3); ctx.stroke(); }
      stripe(0, 0.16, -1, 1, '#f0d8a0', 0.55); }
    if (style === 'vuvuzela') { for (let q = 0; q < 6; q++) { const s = 0.22 + q * 0.13; bandAt(s, 16, q % 2 ? '#1a1a1a' : '#f6f6f2', 1.04); } for (let q = 0; q < 11; q++) { const s = 0.78 + 0.2 * q / 10; bandAt(s, 4, '#c8a010', 1.0); } stripe(0, 0.07, -1, 1, '#f6f6f2', 0.9); }
    if (style === 'siwa') { for (const s of [0.2, 0.44, 0.7, 0.97]) bandAt(s, 20, '#c9a040'); for (let q = 0; q < 28; q++) { const s = 0.1 + 0.8 * q / 27, [x, y, nx, ny] = at(s), w = Wd[clamp(Math.round(s * (nC - 1)), 0, nC - 1)]; ctx.fillStyle = 'rgba(80,50,20,0.55)'; ctx.beginPath(); ctx.moveTo(x + nx * w * 0.5, y + ny * w * 0.5); ctx.lineTo(x + nx * w * 0.2 + ny * 7, y + ny * w * 0.2 - nx * 7); ctx.lineTo(x - nx * w * 0.1, y - ny * w * 0.1); ctx.lineTo(x + nx * w * 0.2 - ny * 7, y + ny * w * 0.2 + nx * 7); ctx.closePath(); ctx.fill(); }
      { const [x, y, nx, ny] = at(0.12), w = Wd[14]; ctx.save(); ctx.translate(x - nx * w * 0.2, y - ny * w * 0.2); ctx.fillStyle = '#100803'; ell(ctx, 0, 0, 14, 20); ctx.fill(); ctx.strokeStyle = '#d8b858'; ctx.lineWidth = 4; ctx.stroke(); ctx.restore(); } }
    if (style === 'kajji') { // horn part: ridged; gourd part: orange, with a band where they meet
      stripe(0.58, 1, -1, 1, '#d4802c', 0.95); ribbon(ctx, C, Wd, -0.6, -0.2, 70, nC - 1); ctx.fillStyle = 'rgba(255,230,170,0.5)'; ctx.fill(); bandAt(0.58, 16, '#7a5028'); bandAt(0.99, 12, '#7a4a20', 1.03);
      for (let q = 0; q < 12; q++) { const s = 0.06 + 0.5 * q / 11, [x, y, nx, ny] = at(s), w = Wd[clamp(Math.round(s * (nC - 1)), 0, nC - 1)]; ctx.strokeStyle = 'rgba(60,40,16,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + nx * w, y + ny * w); ctx.lineTo(x - nx * w, y - ny * w); ctx.stroke(); }
      { const [x, y, nx, ny] = at(0.1); ctx.save(); ctx.translate(x - nx * 3, y - ny * 3); ctx.fillStyle = '#100803'; ell(ctx, 0, 0, 9, 13); ctx.fill(); ctx.strokeStyle = '#8a6a38'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); } }
    if (style === 'kamba') { // bamboo: nodes along the tube, a plug at the stopped top, a rectangular notch below it, and the calabash funnel below
      stripe(0.72, 1, -1, 1, '#d08a2c', 0.96); ribbon(ctx, C, Wd, -0.6, -0.2, 90, nC - 1); ctx.fillStyle = 'rgba(255,235,180,0.5)'; ctx.fill();
      for (const s of [0.0, 0.28, 0.5, 0.7]) bandAt(s + 0.005, 10, '#6a7a2a', 1.14);
      { const [x, y] = at(0.1); ctx.fillStyle = '#100803'; rrect(ctx, x - 14, y - 16, 28, 34, 5); ctx.fill(); ctx.strokeStyle = '#a89a50'; ctx.lineWidth = 3; rrect(ctx, x - 14, y - 16, 28, 34, 5); ctx.stroke(); }
      for (let q = 0; q < 9; q++) { const s = 0.74 + 0.22 * q / 8, [x, y, nx, ny] = at(s), w = Wd[clamp(Math.round(s * (nC - 1)), 0, nC - 1)]; ctx.strokeStyle = 'rgba(70,40,10,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, w * 0.9, w * 0.14, 0, 0, TAU); ctx.stroke(); } }
    // the mouthpiece end and the bell: a dark opening seen at an angle, a bright lip (the ellipse is turned to the tube's own direction)
    const m = C[0], e = C[nC - 1], wm = Wd[0], we = Wd[nC - 1];
    const opening = (c0, w, a1, a2, lip) => {
      ctx.save(); ctx.translate(c0[0], c0[1]); ctx.rotate(Math.atan2(c0[3], c0[2]));
      ctx.fillStyle = vgrad(ctx, -w, w, [[0, lighter(lip, 0.6)], [1, darker(lip, 0.3)]]); ell(ctx, 0, 0, w * 1.04, Math.max(6, w * 0.34)); ctx.fill();
      ctx.fillStyle = rgrad(ctx, 0, 0, 0, w, [[0, '#040201'], [0.8, '#120804'], [1, '#2a160a']]); ell(ctx, 0, 0, w * 0.86, Math.max(4, w * 0.27)); ctx.fill();
      ctx.strokeStyle = rgba(lighter(lip, 0.7), 0.8); ctx.lineWidth = 2.4; ell(ctx, 0, 0, w * 1.04, Math.max(6, w * 0.34)); ctx.stroke(); ctx.restore(); void a1; void a2;
    };
    if (style !== 'kamba' && style !== 'kajji' && style !== 'kudu' && style !== 'siwa') opening(m, wm * 1.5, 0, 0, base);
    else opening(m, wm * 1.4, 0, 0, '#d8c8a0');
    opening(e, we, 0, 0, style === 'kajji' || style === 'kamba' ? '#d4802c' : base);
    // breath: a bright band from the mouthpiece to the sounding marker, and rings from the bell
    lanes.forEach((l, i) => {
      const f = hv(rt, i); if (f <= 0.03) return;
      const nS = Math.round(spots[i].s * (nC - 1));
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ribbon(ctx, C, Wd, -0.4, 0.4, 0, nS); ctx.fillStyle = rgba(l.color, 0.32 * f); ctx.fill(); ctx.restore();
      glow(ctx, spots[i].dx, spots[i].dy, 66, l.color, 0.45 * f);
    });
    if (live > 0.15) for (let q = 0; q < 3; q++) { const p = (rt.anim * 0.9 + q / 3) % 1, tx = e[3], ty = -e[2], off = we * (0.5 + 1.8 * p); ctx.save(); ctx.translate(e[0] + tx * off, e[1] + ty * off); ctx.rotate(Math.atan2(e[3], e[2])); ctx.strokeStyle = rgba(col, 0.4 * (1 - p) * live); ctx.lineWidth = 3; ell(ctx, 0, 0, we * (0.9 + 0.8 * p), 8 + 12 * p); ctx.stroke(); ctx.restore(); }
    ctx.restore();
    // cues, markers (screen-mapped local space, like the bagpipes)
    ctx.save(); F.apply(ctx);
    const topM = [C[0][0] * k, G.u0 + C[0][1] * k];
    cues(ctx, rt, lanes, spots, (i, p) => [lerp(topM[0], spots[i].v, p), lerp(topM[1], spots[i].u, p)], (i) => spots[i].r * 0.95);
    if (!isHero()) lanes.forEach((l, i) => { const sp = spots[i]; marker(ctx, sp.v, sp.u, sp.r * 0.95, l, rt.flash[i] ?? 0); });
    ctx.restore();
    const size = g.px(15);
    if (!isHero()) lanes.forEach((l, i) => { const sp = spots[i], [x, y] = F.map(sp.v, sp.u); pill(ctx, l.name, x, y, 74, size, l.color, rt.flash[i]); });
  };
  return st;
}

registerWindStage({ id: 'horn', match: MATCH, build: (S, lanes, P, { key }) => {
  const style = styleOf(key);
  return style === 'timbalamhala' ? createHocket(S, lanes, P) : createHorns(S, lanes, style, P);
} });

// ---- the hocket: a fan of antelope horns, each its own pitch and its own lane ----------------------------------------------------------------------------------------
export function createHocket(S, lanes, P) {
  const N = lanes.length, st = stageBase('horn', 'timbalamhala', lanes), spots = st.spots;
  st.voiceOf = () => 'horn';
  st.sound = (audio, p) => windSound(audio, 'horn', { ...p, style: 'antelope' });
  const { order, rank } = byPitchRank(lanes);
  const set = { kind: 'earth', base: '#5a4430', light: '#ffe2b0', rug: 'stripes', rugBase: '#22301e', rugA: '#d8b068', rugB: '#8a3a22', ...(P?.set ?? {}) };
  let geo = [];
  st.layout = (area) => {
    const F = makeFrame(area, { top: 40, bottom: 10, side: 14 }); st.F = F;
    const { W, H } = F, DW = 560, DH = 900, k = Math.min(W / DW, H / DH), u0 = (H - DH * k) / 2;
    st.G = { W, H, k, u0 };
    geo = lanes.map((_, i) => {
      const r = rank[i], t = N > 1 ? r / (N - 1) : 0, v = lerp(-196, 214, t), len = lerp(640, 360, t), base = [v * 0.9, 830 - 16 * Math.sin(t * Math.PI)], lean = lerp(-0.2, 0.3, t), bend = lerp(0.4, 0.2, t);
      const tip = [base[0] + Math.sin(lean) * len, base[1] - Math.cos(lean) * len];
      return { v, len, base, lean, bend, tip, t };
    });
    lanes.forEach((_, i) => { const g = geo[i], mx = lerp(g.base[0], g.tip[0], 0.82), my = lerp(g.base[1], g.tip[1], 0.82); spots[i] = circleSpot(mx * k, u0 + my * k, clamp(26 * k, 18, 34), { geo: g }); });
    finishSpots(F, spots);
  };
  st.countSpot = () => { const F = st.F, G = st.G; if (!F || !G) return null; const [x, y] = F.landscape ? F.map(F.W * 0.3, G.H * 0.1) : F.map(-F.W * 0.3, G.H * 0.06); return { x, y, size: clamp(Math.min(F.W, G.H) * 0.15, 46, 96) }; };
  st.draw = (g, rt) => {
    const { ctx } = g, F = st.F;
    if (!F) return;
    const G = st.G, k = G.k;
    setting(ctx, F, set.kind, S, rt, { ...set, rugKind: set.rug, rugPad: 0.04, rugTall: 0.4, bbox: instrumentBox(F) });
    ctx.save(); F.apply(ctx); ctx.translate(0, G.u0); ctx.scale(k, k);
    const horn = (g2, f, i) => {
      const bx = g2.base[0], by = g2.base[1], n = 40, base = i % 2 ? '#a88a5a' : '#8f7248', pts = [];
      for (let q = 0; q <= n; q++) { const s = q / n, x = lerp(bx, g2.tip[0], s) + g2.bend * 70 * Math.sin(Math.PI * s) * (g2.lean < 0 ? -1 : 1), y = lerp(by, g2.tip[1], s); pts.push([x, y]); }
      const C2 = pts.map((p, q) => { const a = pts[Math.max(0, q - 1)], b = pts[Math.min(n, q + 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d; return [p[0], p[1], -dy, dx]; });
      const W2 = pts.map((_, q) => lerp(40, 6, Math.pow(q / n, 0.9)) * (1 + 0.04 * Math.sin(q * 1.6)));
      ctx.save(); ctx.translate(8, 12); ribbon(ctx, C2, W2, -1, 1); ctx.fillStyle = 'rgba(0,0,0,0.34)'; ctx.fill(); ctx.restore();
      ribbon(ctx, C2, W2, -1, 1); ctx.fillStyle = darker(base, 0.55); ctx.fill();
      ribbon(ctx, C2, W2, -0.86, 0.78); ctx.fillStyle = base; ctx.fill();
      ribbon(ctx, C2, W2, -0.7, 0.1); ctx.fillStyle = rgba(lighter(base, 0.4), 0.65); ctx.fill();
      ribbon(ctx, C2, W2, -0.6, -0.3); ctx.fillStyle = rgba(lighter(base, 0.9), 0.5 + 0.3 * f); ctx.fill();
      ctx.strokeStyle = rgba(darker(base, 0.8), 0.85); ctx.lineWidth = 2.5; ribbon(ctx, C2, W2, -1, 1); ctx.stroke();
      for (let q = 3; q < n - 4; q += 3) { const [x, y, nx, ny] = C2[q], w = W2[q]; ctx.strokeStyle = 'rgba(30,20,8,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + nx * w, y + ny * w); ctx.lineTo(x - nx * w, y - ny * w); ctx.stroke(); }
      { const [x, y, nx, ny] = C2[Math.round(n * 0.88)]; ctx.fillStyle = '#100803'; ell(ctx, x - nx * 1, y - ny * 1, 5, 8); ctx.fill(); ctx.strokeStyle = '#d8b858'; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.fillStyle = '#0a0503'; ell(ctx, bx, by, 38, 10); ctx.fill(); ctx.strokeStyle = rgba(lighter(base, 0.6), 0.7); ctx.lineWidth = 3; ell(ctx, bx, by, 40, 12); ctx.stroke();
      if (f > 0.03) { glow(ctx, lerp(bx, g2.tip[0], 0.82), lerp(by, g2.tip[1], 0.82), 90, lanes[i].color, 0.55 * f); for (let q = 0; q < 3; q++) { const p = (rt.anim * 1.1 + q / 3) % 1; ctx.strokeStyle = rgba(lanes[i].color, 0.45 * (1 - p) * f); ctx.lineWidth = 3; ell(ctx, bx, by + 14 + p * 70, 30 + 30 * p, 8 + 10 * p); ctx.stroke(); } }
    };
    order.slice().sort((a, b) => geo[a].v - geo[b].v).forEach((i) => horn(geo[i], hv(rt, i), i));
    ctx.restore();
    ctx.save(); F.apply(ctx);
    cues(ctx, rt, lanes, spots, (i, p) => [lerp(spots[i].v, spots[i].v, p), lerp(spots[i].u - 140, spots[i].u, p)], (i) => spots[i].r * 0.95);
    if (!isHero()) lanes.forEach((l, i) => { const sp = spots[i]; marker(ctx, sp.v, sp.u, sp.r * 0.95, l, rt.flash[i] ?? 0); });
    ctx.restore();
    const size = g.px(15);
    if (!isHero()) lanes.forEach((l, i) => { const sp = spots[i], [x, y] = F.map(sp.v, sp.u + 50); pill(ctx, l.name, x, y, 74, size, l.color, rt.flash[i]); });
  };
  return st;
}

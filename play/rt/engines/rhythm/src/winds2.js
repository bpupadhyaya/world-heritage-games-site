// Wind stages added in rhythm 1.6.0: alphorn, panpipes, free-reed organs (lusheng / khene / sheng / sho) and end-blown flutes
// (shakuhachi, ney, quena, kaval, xiao, fujara) with the duduk reed pipe. The instrument is drawn as the play surface, with lighting;
// there is NO performer bust or face and no hands here: the pressed holes, pipes and rungs light up instead.
//   alphorn   : a long straight horn lying on the meadow, bell on the grass; lanes are the harmonics, a ladder of rungs; the mountain echoes.
//   panpipes  : two staggered rafts of stopped pipes (ira and arca) tied with woven cane lashings; one lane per pipe; a breath line over the rims.
//   free-reed : a wind chest carrying upright bamboo (or metal) pipes with press holes; a lane per pipe, tapped at its press hole.
//   end-blown : one vertical tube with node rings, a notch / rim / fipple / reed at the top, finger holes and a dashed back hole.
import { clamp, mix, rgba, lighter, darker, glow, rrect, grain, hgrad, vgrad, rgrad, hash, ell, circ, text, TAU } from './art.js';
import { makeFrame, makeBox, circleSpot, rectSpot, finishSpots, hitSpots, pill, lerp, isHero } from './stagekit.js';
import { setting, instrumentBox, pool, vignette } from './set.js';
import { windSound } from './windvoice.js';

export const WIND2_IDS = [
  [/alphorn|alpenhorn|alp horn|trembita|lur\b/, 'alphorn'],
  [/siku|zampo(?!gn)|antara|pan ?pipe|pan ?flute|panflute|\bnai\b|rondador|syrinx/, 'panpipes'],
  [/lusheng|sheng|khene|khaen|\bsho\b|mouth organ/, 'freereed'],
  [/shakuhachi|\bney\b|kaval|quena|\bxiao\b|dongxiao|fujara|duduk|end.blown/, 'endblown'],
];
const STYLE_RE = { trembita: /trembita/, alphorn: /alp/, siku: /siku/, zampona: /zampo(?!gn)/, antara: /antara/, nai: /\bnai\b/, pan: /pan/, lusheng: /lusheng/, khene: /khene|khaen/, sheng: /sheng/, sho: /\bsho\b/,
  shakuhachi: /shakuhachi/, xiao: /xiao/, ney: /\bney\b/, quena: /quena/, kaval: /kaval/, fujara: /fujara/, duduk: /duduk/ };
const styleOf = (key, list, dflt) => { const k = String(key || '').toLowerCase(); for (const n of list) if (STYLE_RE[n].test(k)) return n; return dflt; };

// ---- shared drawing -----------------------------------------------------------------------------------------------------------
// the local direction of the key light (upper left of the screen) in the stage's own (v,u) frame
const lightLocal = (F) => {
  const [cx, cy] = F.map(0, F.H / 2), [lx, ly] = F.inv(cx - 100, cy - 100), [mx, my] = F.inv(cx, cy);
  const d = Math.hypot(lx - mx, ly - my) || 1;
  return [(lx - mx) / d, (ly - my) / d];
};
const hv = (rt, i) => Math.max((rt.flash[i] ?? 0) * 0.9, (rt.hold[i] ?? 0) * 0.8);

// a vertical cane / wood tube centred on v from u0 (top) to u1, width w. o: nodes[] (u positions), open (dark bore at the top),
// round (corner radius), seed, rings (thin growth rings), shade (0..1 light level), tint (second colour mixed in speckles)
function tube(ctx, v, u0, u1, w, body, o = {}) {
  const len = u1 - u0, r = o.round ?? w * 0.22, x0 = v - w / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.30)'; rrect(ctx, x0 + w * 0.16, u0 + w * 0.1, w, len, r); ctx.fill();
  ctx.fillStyle = hgrad(ctx, x0, v + w / 2, [[0, darker(body, 0.5)], [0.16, lighter(body, 0.5)], [0.38, body], [0.78, darker(body, 0.36)], [1, darker(body, 0.66)]]);
  rrect(ctx, x0, u0, w, len, r); ctx.fill();
  ctx.save(); rrect(ctx, x0, u0, w, len, r); ctx.clip();
  grain(ctx, x0, u0, w, len, darker(body, 0.7), 0.35, o.seed ?? 5, true, 8);
  const n = Math.round(len / 5);
  for (let k = 0; k < Math.min(60, n); k++) { ctx.fillStyle = rgba(o.fleck ?? '#3a2410', 0.22); ell(ctx, x0 + hash(k + (o.seed ?? 0)) * w, u0 + hash(k + 40 + (o.seed ?? 0)) * len, 0.9 + hash(k + 9) * 1.6, 0.5 + hash(k + 11) * 0.7); ctx.fill(); }
  for (const nu of o.nodes ?? []) {
    ctx.fillStyle = rgba(darker(body, 0.7), 0.75); ctx.fillRect(x0, nu - w * 0.05, w, w * 0.1);
    ctx.fillStyle = rgba(lighter(body, 0.6), 0.5); ctx.fillRect(x0, nu + w * 0.05, w, w * 0.035);
    ctx.fillStyle = rgba(darker(body, 0.5), 0.35); ctx.fillRect(x0, nu - w * 0.09, w, w * 0.035);
  }
  ctx.fillStyle = hgrad(ctx, v - w * 0.34, v - w * 0.1, [[0, 'rgba(255,255,255,0)'], [0.5, `rgba(255,252,236,${o.spec ?? 0.34})`], [1, 'rgba(255,255,255,0)']]);
  ctx.fillRect(v - w * 0.34, u0 + 3, w * 0.24, len - 6);
  ctx.restore();
  ctx.strokeStyle = rgba(lighter(body, 0.65), 0.4); ctx.lineWidth = 1.5; rrect(ctx, x0, u0, w, len, r); ctx.stroke();
  if (o.open) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, v + 1.5, u0 + 1.5, w * 0.5, w * 0.2); ctx.fill();
    ctx.fillStyle = vgrad(ctx, u0 - w * 0.2, u0 + w * 0.2, [[0, lighter(body, 0.35)], [1, darker(body, 0.3)]]); ell(ctx, v, u0, w * 0.5, w * 0.2); ctx.fill();
    ctx.fillStyle = rgrad(ctx, v, u0 + w * 0.03, 0, w * 0.4, [[0, '#050301'], [0.7, '#150b05'], [1, '#2a170a']]); ell(ctx, v, u0 + w * 0.02, w * 0.38, w * 0.15); ctx.fill();
    ctx.strokeStyle = rgba(lighter(body, 0.7), 0.7); ctx.lineWidth = 1.4; ell(ctx, v, u0, w * 0.5, w * 0.2); ctx.stroke();
  }
}

// woven lashing band across [v0, v1] at u (height h): thread with a zigzag in two colours
function lash(ctx, v0, v1, u, h, cols, seed = 0) {
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, v0 + 2, u + 3, v1 - v0, h, h * 0.3); ctx.fill();
  ctx.fillStyle = vgrad(ctx, u, u + h, [[0, lighter(cols[0], 0.28)], [0.5, cols[0]], [1, darker(cols[0], 0.4)]]); rrect(ctx, v0, u, v1 - v0, h, h * 0.3); ctx.fill();
  ctx.beginPath(); rrect(ctx, v0, u, v1 - v0, h, h * 0.3); ctx.clip();
  const step = Math.max(5, h * 0.8);
  for (let x = v0, k = 0; x < v1; x += step, k++) {
    ctx.fillStyle = rgba(cols[1 + (k + seed) % (cols.length - 1)], 0.95);
    ctx.beginPath(); ctx.moveTo(x, u + h); ctx.lineTo(x + step * 0.5, u); ctx.lineTo(x + step, u + h); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(v0, u + 1, v1 - v0, h * 0.18);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(v0, u + h * 0.84, v1 - v0, h * 0.16);
  ctx.restore();
}

// the traveling breath bead for approaching notes along a path (v,u) = pathOf(lane, p), plus a closing ring at the lane's spot
function cues(ctx, rt, lanes, spots, pathOf, ringR, o = {}) {
  for (let k = rt.list.length - 1; k >= 0; k--) {
    const t = rt.list[k];
    if (t.state && t.state !== 'pending' && t.state !== 'miss') continue;
    const tau = (t.t - rt.clock) / rt.look;
    if (tau > 1.0 || tau < -0.25) continue;
    const sp = spots[t.lane], l = lanes[t.lane], miss = t.state === 'miss';
    const a = (rt.soft ? 0.5 : 1) * (miss ? 0.35 : 1) * clamp((1.05 - tau) * 8, 0, 1) * clamp((tau + 0.25) * 6, 0, 1);
    const col = miss ? mix(l.color, '#555555', 0.6) : l.color, p = clamp(1 - tau, 0, 1.05);
    ctx.save(); ctx.globalAlpha = a * 0.55; ctx.strokeStyle = rgba(col, 0.9); ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); for (let s = 0; s <= 12; s++) { const [x, y] = pathOf(t.lane, p * s / 12); if (s) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); ctx.restore();
    const [x, y] = pathOf(t.lane, p);
    glow(ctx, x, y, 40 + 30 * p, col, 0.4 * a);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = rgba(lighter(col, 0.6), 0.95); circ(ctx, x, y, 12 + 4 * p); ctx.fill(); ctx.strokeStyle = rgba(col, 1); ctx.lineWidth = 3; ctx.stroke();
    const sc = 1 + 0.9 * clamp(tau, 0, 1), R = ringR(t.lane);
    ctx.strokeStyle = rgba(lighter(col, 0.45), 0.9); ctx.lineWidth = 2.5;
    if (o.ring) o.ring(ctx, t.lane, sc); else { const [tv, tu] = o.target ? o.target(t.lane) : [sp.v, sp.u]; circ(ctx, tv, tu, R * sc); }
    ctx.stroke(); ctx.restore();
  }
}
const drawPills = (g, F, spots, lanes, rt, at) => {
  const size = g.px(15);
  lanes.forEach((l, i) => { const [x, y] = F.map(...(at ? at(i) : [spots[i].v, spots[i].u])); pill(g.ctx, l.name, x, y, 74, size, l.color, rt.flash[i]); });
};
const marker = (ctx, v, u, r, l, f) => {
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 4; circ(ctx, v + 1, u + 2, r); ctx.stroke();
  ctx.strokeStyle = rgba(lighter(l.color, 0.4), 0.55 + 0.45 * f); ctx.lineWidth = 2.5; circ(ctx, v, u, r); ctx.stroke();
};

function stageBase(id, style, lanes) {
  const N = lanes.length;
  const st = { id, style, kind: 'winds', spots: new Array(N).fill(null), voice: 'breath', F: null, G: null, sustained: true };
  st.hit = (x, y) => (st.F ? hitSpots(st.F, st.spots, x, y) : -1);
  st.anchor = (i) => ({ x: st.spots[i]?.x ?? 0, y: st.spots[i]?.y ?? 0 });
  st.voiceOf = () => ({ alphorn: 'alphorn', panpipes: 'panpipes', freereed: 'freereed', endblown: style === 'duduk' ? 'reedpipe' : 'endblown' }[id]);
  return st;
}
const byPitchRank = (lanes) => { const order = lanes.map((_, i) => i).sort((a, b) => lanes[a].hz - lanes[b].hz); const rank = []; order.forEach((i, r) => { rank[i] = r; }); return { order, rank }; };

// ================================================================ ALPHORN =====================================================
const SKY = { alphorn: ['#16294d', '#46628f', '#d99a68', '#f1c490'], trembita: ['#1d2748', '#58608f', '#c98a6e', '#efb98a'] };
function meadow(ctx, A, rt, style, S) {
  const { x, y, w, h } = A, hor = y + h * (w > h * 1.15 ? 0.46 : 0.4), pal = SKY[style] ?? SKY.alphorn, t = rt?.anim ?? 0;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = vgrad(ctx, y, hor + 20, [[0, pal[0]], [0.45, pal[1]], [0.85, pal[2]], [1, pal[3]]]); ctx.fillRect(x, y, w, h);
  glow(ctx, x + w * 0.2, hor - h * 0.04, Math.max(w, h) * 0.5, '#ffd9a0', 0.5);
  // far peaks with snow caps, then a nearer green ridge
  const peaks = (base, amp, col, snow, seed, n) => {
    ctx.beginPath(); ctx.moveTo(x - 4, hor + 4);
    const pts = [];
    for (let k = 0; k <= n; k++) { const px = x + (k / n) * w, py = base - amp * (0.35 + 0.65 * hash(seed + k * 1.7)) * (k % 2 ? 0.55 : 1); pts.push([px, py]); ctx.lineTo(px, py); }
    ctx.lineTo(x + w + 4, hor + 4); ctx.closePath();
    ctx.fillStyle = vgrad(ctx, base - amp, hor, [[0, snow ? '#f4f0ec' : lighter(col, 0.18)], [snow ? 0.22 : 0.4, snow ? lighter(col, 0.45) : col], [1, darker(col, 0.28)]]); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1.2; ctx.stroke();
    // shaded faces: the slope running down to the right of each summit lies in shadow
    for (let k = 1; k < pts.length - 1; k++) {
      if (!(pts[k][1] < pts[k - 1][1] && pts[k][1] < pts[k + 1][1])) continue;
      ctx.fillStyle = 'rgba(8,16,40,0.3)'; ctx.beginPath(); ctx.moveTo(pts[k][0], pts[k][1]); ctx.lineTo(pts[k + 1][0], pts[k + 1][1]); ctx.lineTo(pts[k + 1][0], hor + 4); ctx.lineTo(pts[k][0] + (pts[k + 1][0] - pts[k][0]) * 0.1, hor + 4); ctx.closePath(); ctx.fill();
    }
    return pts;
  };
  peaks(hor - h * 0.02, h * 0.3, '#5a6f98', true, 3, 7);
  peaks(hor + h * 0.0, h * 0.17, '#3c5878', false, 11, 9);
  // soft drifting clouds
  for (let k = 0; k < 4; k++) {
    const cx = x + ((hash(k * 5.3) * 1.4 + t * 0.004 * (1 + k * 0.3)) % 1.2 - 0.1) * w, cy = y + h * (0.09 + 0.07 * k + 0.05 * hash(k));
    for (let j = 0; j < 5; j++) { ctx.fillStyle = `rgba(255,236,214,${0.1 + 0.05 * hash(j + k)})`; ell(ctx, cx + (j - 2) * w * 0.05, cy + (hash(j + 3 * k) - 0.5) * 8, w * 0.06, h * 0.014); ctx.fill(); }
  }
  // meadow: layered grass, tufts, flowers and a few dark pines on the ridge
  ctx.fillStyle = vgrad(ctx, hor - 2, y + h, [[0, '#7aa150'], [0.25, '#4f8a3c'], [1, '#1f4a26']]); ctx.fillRect(x, hor - 2, w, y + h - hor + 2);
  for (let k = 0; k < 9; k++) { const px = x + hash(k * 4.1) * w, ph = h * (0.03 + 0.03 * hash(k)); ctx.fillStyle = '#0f2a1a'; ctx.beginPath(); ctx.moveTo(px, hor - ph); ctx.lineTo(px - ph * 0.28, hor + 4); ctx.lineTo(px + ph * 0.28, hor + 4); ctx.closePath(); ctx.fill(); }
  const tones = ['#2f6a2c', '#4f8a38', '#78a84c', '#a6c868'];
  tones.forEach((tc, ti) => {
    ctx.strokeStyle = rgba(tc, 0.6); ctx.lineWidth = 1.5; ctx.beginPath();
    for (let k = ti; k < 200; k += 4) {
      const gx = x + hash(k * 1.3) * w, gy = hor + (y + h - hor) * Math.pow(hash(k * 2.1 + 1), 0.8), s = 0.5 + (gy - hor) / (y + h - hor) * 1.5;
      ctx.moveTo(gx, gy); ctx.lineTo(gx + (hash(k) - 0.5) * 5 * s, gy - (5 + 9 * hash(k + 7)) * s);
    }
    ctx.stroke();
  });
  ['#fff3c0', '#f4d24a', '#f08a8a', '#ffffff'].forEach((fc, ti) => {
    ctx.fillStyle = fc; ctx.beginPath();
    for (let k = ti * 11; k < 220; k += 44) { const gx = x + hash(k * 1.3) * w, gy = hor + (y + h - hor) * Math.pow(hash(k * 2.1 + 1), 0.8), s = 0.5 + (gy - hor) / (y + h - hor) * 1.5; ctx.moveTo(gx + 2.2 * s, gy - 8 * s); ctx.arc(gx, gy - 8 * s, 2.2 * s, 0, TAU); }
    ctx.fill();
  });
  vignette(ctx, A, 0.55);
  ctx.restore();
  void S;
}

function createAlphorn(S, lanes, style) {
  const N = lanes.length, st = stageBase('alphorn', style, lanes), spots = st.spots;
  const { rank } = byPitchRank(lanes);
  const echoes = [], prev = new Array(N).fill(0);
  let horn = null;
  st.layout = (area) => {
    const F = makeFrame(area, { top: 40, bottom: 10, side: 16 }); st.F = F;
    const { W, H } = F, land = F.landscape, ws = Math.min(W, H * 0.7);
    const M = [0.3 * W, 0.07 * H], B = [-0.27 * W, 0.8 * H], C = [0.0 * W, 0.4 * H];
    const w0 = clamp(ws * 0.045, 20, 38), w1 = ws * 0.085, wb = ws * 0.19;
    const pts = [];
    for (let k = 0; k <= 96; k++) {
      const t = k / 96, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
      const v = a * M[0] + b * C[0] + c * B[0], u = a * M[1] + b * C[1] + c * B[1];
      const tv = 2 * (1 - t) * (C[0] - M[0]) + 2 * t * (B[0] - C[0]), tu = 2 * (1 - t) * (C[1] - M[1]) + 2 * t * (B[1] - C[1]), tl = Math.hypot(tv, tu);
      const w = t < 0.86 ? lerp(w0, w1, Math.pow(t / 0.86, 0.9)) : w1 + (wb - w1) * Math.pow((t - 0.86) / 0.14, 2.3);
      pts.push({ t, v, u, tv: tv / tl, tu: tu / tl, nv: -tu / tl, nu: tv / tl, w });
    }
    horn = { pts, M, B, C, w0, w1, wb, L: lightLocal(F) };
    const lv = 0.335 * W, u0 = land ? 0.4 * H : 0.93 * H, u1 = land ? 0.93 * H : 0.46 * H;
    const step = Math.abs(u1 - u0) / Math.max(1, N - 1), hh = clamp(step * 0.5, 14, 30);
    st.G = { W, H, ws, lv, rail: ws * 0.1, hh, horn };
    lanes.forEach((_, i) => { const r = rank[i], u = lerp(u0, u1, N > 1 ? r / (N - 1) : 0.5); spots[i] = rectSpot(lv, u, ws * 0.13, hh + 3); });
    finishSpots(F, spots);
  };
  const along = (t) => { const P = horn.pts, f = clamp(t, 0, 1) * (P.length - 1), i = Math.min(P.length - 2, Math.floor(f)), r = f - i; return [lerp(P[i].v, P[i + 1].v, r), lerp(P[i].u, P[i + 1].u, r)]; };
  st.sound = (audio, p) => {
    const ok = windSound(audio, 'alphorn', { ...p, style });
    windSound(audio, 'alphorn', { ...p, style, delay: 0.62, vel: (p.vel ?? 0.75) * 0.3, dur: Math.min(p.dur ?? 1, 1.2), pan: 0.25 });   // the valley answers
    return ok;
  };
  st.draw = (g, rt) => {
    const { ctx } = g, F = st.F;
    if (!F) return;
    meadow(ctx, F.area, rt, style, S);
    // new strokes make the mountain answer a moment later
    lanes.forEach((_, i) => { const f = rt.flash[i] ?? 0; if (f > prev[i] + 0.25) echoes.push({ t0: rt.anim, lane: i }); prev[i] = f; });
    while (echoes.length && rt.anim - echoes[0].t0 > 3) echoes.shift();
    const A = F.area, ex = A.x + A.w * 0.7, ey = A.y + A.h * (F.landscape ? 0.28 : 0.2);
    for (const e of echoes) {
      const age = rt.anim - e.t0 - 0.62; if (age < 0 || age > 1.6) continue;
      const q = age / 1.6, col = lanes[e.lane].color;
      glow(ctx, ex, ey, 40 + 130 * q, col, 0.38 * (1 - q));
      ctx.strokeStyle = rgba(lighter(col, 0.5), 0.5 * (1 - q)); ctx.lineWidth = 2.5;
      for (let r = 0; r < 3; r++) { ctx.beginPath(); ctx.ellipse(ex, ey, 18 + (50 + 70 * r) * q, 10 + (28 + 40 * r) * q, 0, 0, TAU); ctx.stroke(); }
    }
    ctx.save(); F.apply(ctx);
    const G = st.G, { pts } = horn, [Lv, Lu] = horn.L;
    // shadow of the horn on the grass (away from the light)
    const sh = (off, a) => {
      ctx.fillStyle = `rgba(8,20,6,${a})`; ctx.beginPath();
      pts.forEach((p, k) => { const x = p.v + p.nv * p.w * 0.5 - Lv * off, y = p.u + p.nu * p.w * 0.5 - Lu * off; if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      for (let k = pts.length - 1; k >= 0; k--) { const p = pts[k]; ctx.lineTo(p.v - p.nv * p.w * 0.5 - Lv * off, p.u - p.nu * p.w * 0.5 - Lu * off); }
      ctx.closePath(); ctx.fill();
    };
    sh(34, 0.16); sh(24, 0.2); sh(14, 0.26);
    const sgn = (pts[48].nv * Lv + pts[48].nu * Lu) >= 0 ? 1 : -1;   // +1: normal points toward the light
    const band = (o0, o1, fill, t0 = 0, t1 = 1, scale = 1) => {
      ctx.fillStyle = fill; ctx.beginPath();
      let first = true;
      for (const p of pts) { if (p.t < t0 || p.t > t1) continue; const x = p.v + p.nv * sgn * o0 * p.w * 0.5 * scale, y = p.u + p.nu * sgn * o0 * p.w * 0.5 * scale; if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y); }
      for (let k = pts.length - 1; k >= 0; k--) { const p = pts[k]; if (p.t < t0 || p.t > t1) continue; ctx.lineTo(p.v + p.nv * sgn * o1 * p.w * 0.5 * scale, p.u + p.nu * sgn * o1 * p.w * 0.5 * scale); }
      ctx.closePath(); ctx.fill();
    };
    const wood = style === 'trembita' ? '#a8683a' : '#d19b58';
    band(-1, 1, darker(wood, 0.45));
    band(-0.92, -0.45, darker(wood, 0.28)); band(-0.55, -0.05, darker(wood, 0.08)); band(-0.1, 0.4, wood); band(0.3, 0.6, lighter(wood, 0.2));
    band(0.45, 0.72, lighter(wood, 0.4)); band(0.5, 0.58, 'rgba(255,248,220,0.55)'); band(0.8, 0.98, rgba(lighter(wood, 0.25), 0.35));
    // growth lines of the spruce running along the horn
    ctx.lineWidth = 1; for (let q = 0; q < 7; q++) { ctx.strokeStyle = rgba(darker(wood, 0.6), 0.18); ctx.beginPath(); pts.forEach((p, k) => { const o = (-0.8 + q * 0.26 + 0.05 * Math.sin(p.t * 20 + q)) * p.w * 0.5; const x = p.v + p.nv * o, y = p.u + p.nu * o; if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.stroke(); }
    // bindings of split root / bark: dark bands every so often, with a lighter thread
    const binds = style === 'trembita' ? [0.1, 0.3, 0.5, 0.7, 0.86] : [0.08, 0.2, 0.34, 0.5, 0.66, 0.8];
    for (const bt of binds) {
      const k = Math.round(bt * 96), p = pts[k], bw = p.w * 1.07, th = Math.max(5, p.w * 0.3);
      ctx.save(); ctx.translate(p.v, p.u); ctx.rotate(Math.atan2(p.tu, p.tv)); // x axis along the horn
      ctx.fillStyle = vgrad(ctx, -bw / 2, bw / 2, [[0, '#8a5a30'], [0.5, '#4a2a14'], [1, '#2a160a']]); ctx.beginPath(); ctx.rect(-th / 2, -bw / 2, th, bw); ctx.fill();
      ctx.fillStyle = 'rgba(232,196,120,0.55)'; for (let y = -bw / 2 + 2; y < bw / 2 - 2; y += 6) ctx.fillRect(-th / 2, y, th, 1.6);
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-th / 2, -bw / 2, th, bw * 0.2);
      ctx.restore();
    }
    // lit stretches: where a note sounds the breath glows through the wood from mouthpiece to bell
    const live = Math.max(0, ...lanes.map((_, i) => hv(rt, i))), liveI = lanes.reduce((b, _, i) => (hv(rt, i) > hv(rt, b) ? i : b), 0);
    if (live > 0.03) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const col = lanes[liveI].color;
      for (let k = 1; k < pts.length; k++) {
        const p = pts[k], q = pts[k - 1], ph = ((rt.anim * 0.9 - p.t) % 1 + 1) % 1;
        ctx.strokeStyle = rgba(col, live * (0.08 + 0.3 * Math.max(0, 1 - ph * 2.2))); ctx.lineWidth = p.w * 0.85; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(q.v, q.u); ctx.lineTo(p.v, p.u); ctx.stroke();
      }
      ctx.restore();
    }
    // mouthpiece: a deep cup turned from dark hardwood
    {
      const p = pts[0], ang = Math.atan2(p.tu, p.tv), mw = horn.w0 * 1.55;
      ctx.save(); ctx.translate(p.v, p.u); ctx.rotate(ang);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, -mw * 1.15 + 3, -mw / 2 + 5, mw * 1.2, mw, mw * 0.3); ctx.fill();
      ctx.fillStyle = vgrad(ctx, -mw / 2, mw / 2, [[0, '#8a6038'], [0.35, '#4a2c16'], [1, '#1c0e06']]); rrect(ctx, -mw * 1.2, -mw / 2, mw * 1.35, mw, mw * 0.32); ctx.fill();
      ctx.fillStyle = 'rgba(255,230,180,0.3)'; rrect(ctx, -mw * 1.12, -mw * 0.44, mw * 1.1, mw * 0.2, mw * 0.1); ctx.fill();
      ctx.fillStyle = '#080402'; ell(ctx, -mw * 1.2, 0, mw * 0.14, mw * 0.3); ctx.fill();
      ctx.strokeStyle = rgba('#e8c88a', 0.5); ctx.lineWidth = 1.5; ell(ctx, -mw * 1.2, 0, mw * 0.14, mw * 0.3); ctx.stroke();
      ctx.restore();
    }
    // bell: the wide mouth, seen at an angle, dark inside with a warm rim
    {
      const p = pts[96], ang = Math.atan2(p.tu, p.tv), bw = p.w;
      ctx.save(); ctx.translate(p.v, p.u); ctx.rotate(ang);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, bw * 0.12 + 6, 8, bw * 0.34, bw * 0.55); ctx.fill();
      ctx.fillStyle = vgrad(ctx, -bw / 2, bw / 2, [[0, lighter(wood, 0.35)], [0.5, wood], [1, darker(wood, 0.55)]]); ell(ctx, 0, 0, bw * 0.3, bw * 0.52); ctx.fill();
      ctx.fillStyle = rgrad(ctx, bw * 0.08, 0, 0, bw * 0.46, [[0, '#080402'], [0.55, '#1d0f06'], [1, '#5a3418']]); ell(ctx, bw * 0.05, 0, bw * 0.24, bw * 0.43); ctx.fill();
      ctx.strokeStyle = rgba(lighter(wood, 0.55), 0.75); ctx.lineWidth = 2; ell(ctx, 0, 0, bw * 0.3, bw * 0.52); ctx.stroke();
      ctx.restore();
    }
    // echo rings leaving the bell while a note sounds
    if (live > 0.03) {
      const p = pts[96], ang = Math.atan2(p.tu, p.tv), col = lanes[liveI].color;
      ctx.save(); ctx.translate(p.v, p.u); ctx.rotate(ang);
      for (let q = 0; q < 4; q++) { const ph = (rt.anim * 0.9 + q / 4) % 1; ctx.strokeStyle = rgba(lighter(col, 0.45), (1 - ph) * live * 0.8); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(p.w * 0.25 + ph * G.ws * 0.5, 0, 10 + ph * G.ws * 0.18, 18 + ph * G.ws * 0.4, 0, -1.1, 1.1); ctx.stroke(); }
      ctx.restore();
    }
    // harmonic ladder: two rails and a rung per harmonic, the low ones nearest the bell
    {
      const sp0 = spots.reduce((a, s) => (!a || s.u < a.u ? s : a), null), sp1 = spots.reduce((a, s) => (!a || s.u > a.u ? s : a), null);
      const uA = sp0.u - 34, uB = sp1.u + 34, rv = G.rail;
      for (const side of [-1, 1]) {
        const x = G.lv + side * (G.ws * 0.17);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, x - 5 + 6, uA + 8, 10, uB - uA, 5); ctx.fill();
        ctx.fillStyle = hgrad(ctx, x - 6, x + 6, [[0, darker(wood, 0.3)], [0.4, lighter(wood, 0.25)], [1, darker(wood, 0.6)]]); rrect(ctx, x - 6, uA, 12, uB - uA, 6); ctx.fill();
        ctx.strokeStyle = rgba(lighter(wood, 0.6), 0.4); ctx.lineWidth = 1; ctx.stroke();
      }
      void rv;
      lanes.forEach((l, i) => {
        const sp = spots[i], f = hv(rt, i), w = G.ws * 0.34, h = sp.hh * 1.25;
        ctx.fillStyle = 'rgba(0,0,0,0.34)'; rrect(ctx, sp.v - w / 2 + 3, sp.u - h / 2 + 5, w, h, h * 0.45); ctx.fill();
        ctx.fillStyle = vgrad(ctx, sp.u - h / 2, sp.u + h / 2, [[0, lighter(wood, 0.28 + 0.2 * f)], [0.5, wood], [1, darker(wood, 0.5)]]); rrect(ctx, sp.v - w / 2, sp.u - h / 2, w, h, h * 0.45); ctx.fill();
        ctx.strokeStyle = rgba(l.color, 0.7 + 0.3 * f); ctx.lineWidth = 3; rrect(ctx, sp.v - w / 2, sp.u - h / 2, w, h, h * 0.45); ctx.stroke();
        if (f > 0.03) glow(ctx, sp.v, sp.u, 80, l.color, 0.5 * f);
      });
    }
    cues(ctx, rt, lanes, spots, (i, p) => {
      const sp = spots[i];
      if (p < 0.6) return along(p / 0.6);
      const q = (p - 0.6) / 0.4, B = along(1);
      return [lerp(B[0], sp.v, q), lerp(B[1], sp.u, q) - Math.sin(Math.PI * q) * G.ws * 0.1];
    }, (i) => spots[i].hh * 1.4, { ring: (c, i, sc) => { const q = 1 + (sc - 1) * 0.45, sp = spots[i], w = G.ws * 0.34 * q, h = sp.hh * 1.25 * q * 1.15; rrect(c, sp.v - w / 2, sp.u - h / 2, w, h, h * 0.45); } });
    ctx.restore();
    drawPills(g, F, spots, lanes, rt);
  };
  return st;
}

// ================================================================ PANPIPES ====================================================
function createPanpipes(S, lanes, style) {
  const N = lanes.length, st = stageBase('panpipes', style, lanes), spots = st.spots;
  const { order, rank } = byPitchRank(lanes);
  const two = /siku|zampona|zampo/.test(style) && N >= 4;
  const fmin = Math.min(...lanes.map((l) => l.hz));
  const pipes = new Array(N);
  const cane = style === 'nai' ? '#b98a4e' : style === 'antara' ? '#caa66a' : '#dcb878';
  st.layout = (area) => {
    const top = 40, bottom = 10, side = 16, availW = area.w - 2 * side, availH = area.h - top - bottom;
    const H = 1000, W = H * availW / availH;
    const F = makeBox(area, W, H, { top, bottom, side, maxScale: 3 }); st.F = F;
    const raftOf = order.map((i, r) => (two ? r % 2 : 0));
    const cnt = two ? [Math.ceil(N / 2), Math.floor(N / 2)] : [N, 0];
    const wide = W > H * 1.1, Lmax = H * (wide ? 0.66 : 0.56), pw = clamp(Math.min(W * 0.9 / (N + (two ? 1.2 : 0.3)) / 1.04, H * (wide ? 0.14 : 0.1)), 24, H * (wide ? 0.14 : 0.1));
    const gap = two ? pw * 0.9 : 0, total = N * pw * 1.04 + gap;
    let v0 = -total / 2;
    const rafts = [];
    const idx = [0, 0];
    const lanesOfRaft = [[], []];
    order.forEach((i, r) => lanesOfRaft[raftOf[r]].push(i));
    lanesOfRaft.forEach((list, ri) => {
      if (!list.length) return;
      const x0 = v0, topU = H * (wide ? 0.2 : 0.3) - (ri === 1 ? pw * 0.55 : 0);
      list.forEach((i, k) => {
        const L = Lmax * clamp(Math.pow(fmin / lanes[i].hz, 0.8), 0.3, 1), v = x0 + (k + 0.5) * pw * 1.04;
        pipes[i] = { v, top: topU, L, bot: topU + L, raft: ri, k };
        spots[i] = rectSpot(v, topU + L * 0.5, pw * 0.53, L * 0.5, { cueU: topU });
      });
      rafts.push({ x0, x1: x0 + list.length * pw * 1.04, top: topU, list });
      v0 += list.length * pw * 1.04 + gap;
    });
    st.G = { W, H, pw, rafts, Lmax, two };
    void cnt; void idx;
    finishSpots(F, spots);
  };
  st.sound = (audio, p) => windSound(audio, 'panpipes', { ...p, style });
  st.draw = (g, rt) => {
    const { ctx } = g, F = st.F;
    if (!F) return;
    const G = st.G, { pw, rafts, H } = G;
    setting(ctx, F, 'cloth', S, rt, { base: '#3a2034', accent: '#e0a83a', light: '#ffcf90', rugKind: null, bbox: instrumentBox(F) });
    ctx.save(); F.apply(ctx);
    const cols = style === 'nai' ? ['#7a1e24', '#e8d8b0', '#1c1410'] : ['#b3262a', '#1a1210', '#efe6d0', '#e0a82e'];
    const mouthV = 0, mouthU = rafts[0].top - H * 0.075;
    // rafts, back one first; each pipe stopped with a node at the foot, open at the top
    [...rafts].reverse().forEach((rf) => {
      const left = rf.x0 - pw * 0.15, right = rf.x1 + pw * 0.15;
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; rrect(ctx, left + 14, rf.top + 20, right - left, G.Lmax * 0.98, pw * 0.3); ctx.fill();
      rf.list.forEach((i, k) => {
        const p = pipes[i], f = hv(rt, i), body = mix(cane, '#8a5a2a', 0.18 * hash(i * 3.7 + 1));
        tube(ctx, p.v, p.top, p.bot, pw, lighter(body, 0.12 * f), { nodes: [p.bot - pw * 0.18, p.top + p.L * 0.46 + (k % 2) * pw * 0.2], open: true, seed: i * 3 + 2, round: pw * 0.18 });
        // lane colour on the lip so each pipe is identifiable
        ctx.strokeStyle = rgba(lanes[i].color, 0.9); ctx.lineWidth = 3.5; ctx.beginPath(); ctx.ellipse(p.v, p.top, pw * 0.5, pw * 0.2, 0, 0.1, Math.PI - 0.1); ctx.stroke();
        if (f > 0.03) {
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = vgrad(ctx, p.top, p.bot, [[0, rgba(lanes[i].color, 0.55 * f)], [1, rgba(lanes[i].color, 0.1 * f)]]); rrect(ctx, p.v - pw * 0.42, p.top + 2, pw * 0.84, p.L - 4, pw * 0.2); ctx.fill();
          ctx.restore();
        }
      });
      // two woven cane lashings across the raft and a cord with tassels at the end
      const lo = rf.list.reduce((m, i) => Math.min(m, pipes[i].bot), 1e9) - rf.top;
      for (const [q, c] of [[0.2, 0], [0.34, 1]]) {
        const h = pw * 0.3, u = rf.top + Math.min(G.Lmax * q, lo * 0.45 + (q - 0.2) * G.Lmax);
        lash(ctx, rf.x0 - pw * 0.12, rf.x1 + pw * 0.12, u, h, [cols[c % cols.length], cols[(c + 1) % cols.length], cols[(c + 2) % cols.length], cols[(c + 3) % cols.length]].filter(Boolean), c);
      }
      const tx = rf.x1 + pw * 0.2, tu = rf.top + G.Lmax * 0.36;
      ctx.strokeStyle = cols[0]; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(tx - pw * 0.15, tu); ctx.quadraticCurveTo(tx + pw * 0.45, tu + pw * 0.4, tx + pw * 0.25, tu + pw * 0.9); ctx.stroke();
      for (let t = 0; t < 7; t++) { ctx.strokeStyle = cols[t % cols.length]; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(tx + pw * 0.25, tu + pw * 0.9); ctx.lineTo(tx + pw * 0.25 + (t - 3) * 3.2, tu + pw * 1.9 + (t % 3) * 5); ctx.stroke(); }
    });
    // the breath line over the rims, with a sweep that follows the sounding pipe
    {
      const left = rafts[0].x0 - pw * 0.3, right = rafts[rafts.length - 1].x1 + pw * 0.3, uu = rafts[0].top - pw * 0.55;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(255,236,200,0.14)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(left, uu + pw * 0.45); ctx.quadraticCurveTo(0, uu - pw * 0.25, right, uu + pw * 0.45); ctx.stroke();
      ctx.restore();
      lanes.forEach((l, i) => {
        const f = hv(rt, i); if (f <= 0.03) return;
        const p = pipes[i], sx = mouthV + (p.v - mouthV) * 1.0;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const ph = (rt.anim * 2.2) % 1;
        ctx.strokeStyle = rgba(lighter(l.color, 0.5), 0.75 * f); ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(sx - pw * 0.7, p.top - pw * 0.28 - 5); ctx.lineTo(sx + pw * 0.7, p.top - pw * 0.28 - 5); ctx.stroke();
        for (let q = 0; q < 3; q++) { const pp = (ph + q / 3) % 1; ctx.strokeStyle = rgba('#ffffff', (1 - pp) * 0.55 * f); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(p.v, p.top, pw * (0.5 + 0.7 * pp), pw * (0.2 + 0.35 * pp), 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
        ctx.restore();
        glow(ctx, p.v, p.top, pw * 2.2, l.color, 0.5 * f);
      });
    }
    cues(ctx, rt, lanes, spots, (i, p) => {
      const sp = pipes[i], x = lerp(mouthV, sp.v, p), y = lerp(mouthU, sp.top - pw * 0.15, p) - Math.sin(Math.PI * p) * H * 0.035;
      return [x, y];
    }, (i) => pw * 0.55, { ring: (c, i, sc) => { const p = pipes[i]; c.beginPath(); c.ellipse(p.v, p.top, pw * 0.62 * sc, pw * 0.27 * sc, 0, 0, TAU); } });
    // markers on every pipe lip and name pills on the pipes
    lanes.forEach((l, i) => { const p = pipes[i], f = rt.flash[i] ?? 0; ctx.strokeStyle = rgba(lighter(l.color, 0.4), 0.55 + 0.45 * f); ctx.lineWidth = 2.5; ell(ctx, p.v, p.top, pw * 0.62, pw * 0.27); ctx.stroke(); });
    ctx.restore();
    // cue rings are drawn with circles in cues(); the rectSpot centres hold the pills
    drawPills(g, F, spots, lanes, rt, (i) => [pipes[i].v, pipes[i].top + Math.min(pipes[i].L * 0.55, G.Lmax * 0.5) + (rank[i] % 2) * pw * 0.2]);
  };
  return st;
}

// ================================================================ FREE-REED ===================================================
const FREE = {
  lusheng: { body: '#c8a35a', chest: '#7a3418', trim: '#e8c070', row: true, sleeve: true, ring: '#b3262a', set: { kind: 'planks', base: '#4a2c1a' } },
  khene: { body: '#e0c68a', chest: '#4a2a14', trim: '#d8b45a', row: true, sleeve: false, ring: '#7a1e1e', set: { kind: 'cloth', base: '#3a2a1c', accent: '#d8b45a', light: '#ffe0a8' } },
  sheng: { body: '#d9b45a', chest: '#6a1e1e', trim: '#f0d890', row: false, sleeve: false, metal: true, ring: '#ffffff', set: { kind: 'tiles', base: '#2a3c52', accent: '#d8b45a', light: '#ffe0a8' } },
  sho: { body: '#6a4426', chest: '#1a1210', trim: '#d9b450', row: false, sleeve: false, ring: '#d9b450', set: { kind: 'cloth', base: '#2a2036', accent: '#d9b450', light: '#ffd9a0' } },
};
function createFreeReed(S, lanes, style, P) {
  const N = lanes.length, st = stageBase('freereed', style, lanes), spots = st.spots;
  const L0 = { ...(FREE[style] ?? FREE.khene) }, { rank } = byPitchRank(lanes);
  L0.set = { ...L0.set, ...(P?.set ?? {}) };
  const fmin = Math.min(...lanes.map((l) => l.hz));
  const pipes = new Array(N);
  let chest = null;
  st.layout = (area) => {
    const top = 40, bottom = 10, side = 16, availW = area.w - 2 * side, availH = area.h - top - bottom;
    const H = 1000, W = H * availW / availH;
    const F = makeBox(area, W, H, { top, bottom, side, maxScale: 3 }); st.F = F;
    const wide = W > H * 1.1;
    const baseU = H * 0.8;
    const Lmax = H * (wide ? 0.68 : 0.6);
    let pitch, pw;
    if (L0.row) { pitch = Math.min(W * 0.84 / N, H * (wide ? 0.2 : 0.15)); pw = clamp(pitch * 0.52, 22, H * (wide ? 0.1 : 0.075)); }
    else { pitch = Math.min(W * 0.84 / N, H * 0.12); pw = clamp(pitch * 0.55, 20, H * 0.05); }
    const chestW = L0.row ? pitch * N + pw * 1.2 : 0;
    const rc = L0.row ? 0 : clamp(Math.min(W * 0.22, H * (wide ? 0.21 : 0.165)), 70, 260);
    chest = { u: baseU, w: chestW, rc, h: L0.row ? pw * (style === 'khene' ? 2.1 : 1.7) : 0, v0: -chestW / 2 };
    const maxA = Math.min(0.5, 0.06 * N);
    lanes.forEach((_, i) => {
      const r = rank[i], L = Lmax * clamp(Math.pow(fmin / lanes[i].hz, 0.75), 0.4, 1);
      if (L0.row) {
        const v = -chestW / 2 + pw * 0.6 + (i + 0.5) * pitch;   // keep the lane order of the song's lanes left to right
        const holeU = baseU - pw * 1.55;
        pipes[i] = { v, base: baseU, L, top: baseU - L, ang: 0, holeU, hv: v, r };
        spots[i] = circleSpot(v, holeU, clamp(pitch * 0.46, 22, 56));
      } else {
        const a = N > 1 ? (i / (N - 1) - 0.5) * 2 * maxA : 0, ax = Math.sin(a), au = -Math.cos(a), bv = ax * rc * 0.8, bu = baseU - rc * 0.28 * Math.cos(a);
        const dh = rc * 0.55 + pw * 1.2 + (i % 2) * pw * 2.2;
        pipes[i] = { v: bv, base: bu, bv, bu, L, ang: a, ax, au, top: bu + au * L, holeU: bu + au * dh, hv: bv + ax * dh, r, dh };
        spots[i] = circleSpot(bv + ax * dh, bu + au * dh, clamp(pw * 0.95, 16, 32));
      }
    });
    st.G = { W, H, pw, pitch, baseU, Lmax, wide };
    finishSpots(F, spots);
  };
  const mouthPt = () => { const m = L0.row ? (style === 'lusheng' ? [-chest.w / 2 + chest.h * 1.1, chest.u + chest.h * 2.3] : style === 'khene' ? [chest.h * 0.9, chest.u + chest.h * 2.0] : [0, chest.u + chest.h * 2.1]) : [chest.rc * 0.9, chest.u + chest.rc * 0.95]; return [m[0], Math.min(m[1], st.G.H * 0.955)]; };
  st.sound = (audio, p) => windSound(audio, 'freereed', { ...p, style });
  st.draw = (g, rt) => {
    const { ctx } = g, F = st.F;
    if (!F) return;
    const G = st.G, { pw, H, baseU } = G, body = L0.body;
    setting(ctx, F, L0.set.kind, S, rt, { ...L0.set, rugKind: null, bbox: instrumentBox(F) });
    ctx.save(); F.apply(ctx);
    const drawPipe = (i) => {
      const p = pipes[i], f = hv(rt, i), col = lanes[i].color;
      ctx.save(); ctx.translate(p.bv ?? p.v, p.bu ?? p.base); ctx.rotate(p.ang);
      // pipe-local: axis points up (-y); draw as a tube from y=-L (top) to y=0 (base)
      const wp = pw * (L0.sleeve ? 0.62 : 1), pb = L0.metal ? mix(body, '#cfd6dc', 0.35 * hash(i * 2.3)) : mix(body, '#7a4a20', 0.2 * hash(i * 1.7 + 3));
      tube(ctx, 0, -p.L, 0, wp, pb, { nodes: [-p.L * 0.12, -p.L * 0.5, -p.L * 0.78].filter((_, k) => !L0.metal || k === 0), seed: i * 5 + 1, open: !L0.sleeve, spec: L0.metal ? 0.55 : 0.34, round: wp * 0.2 });
      if (L0.sleeve) {   // wide resonating tube over the upper part of the pipe
        const sw = pw * 1.28, s0 = -p.L, s1 = -p.L * 0.42;
        tube(ctx, 0, s0, s1, sw, mix(body, '#a98a3a', 0.15), { nodes: [s0 + (s1 - s0) * 0.5], open: true, seed: i * 7 + 4, round: sw * 0.15 });
        lash(ctx, -sw * 0.52, sw * 0.52, s1 - sw * 0.2, sw * 0.26, [L0.ring, '#f0e4c0', '#1a1210'], i);
        lash(ctx, -sw * 0.52, sw * 0.52, s0 + sw * 0.55, sw * 0.18, [L0.trim, '#7a3418', '#1a1210'], i + 1);
      } else if (style === 'sho' || style === 'sheng') {
        for (const q of [0.3, 0.62]) lash(ctx, -wp * 0.58, wp * 0.58, -p.L * q, wp * 0.28, [L0.ring, darker(L0.ring, 0.45)], i);
      } else {   // khene: dark glued joints between the cane sections
        for (const q of [0.3, 0.66]) { ctx.fillStyle = 'rgba(70,36,14,0.55)'; ctx.fillRect(-wp * 0.5, -p.L * q - wp * 0.1, wp, wp * 0.2); }
      }
      if (L0.row && style !== 'khene') {   // free reed: a small window near the foot where the brass tongue shows (the sho and sheng keep their pipes clean)
        const ru = -pw * 3.0;
        ctx.fillStyle = '#120804'; rrect(ctx, -wp * 0.2, ru - pw * 0.4, wp * 0.4, pw * 0.8, 3); ctx.fill();
        ctx.fillStyle = vgrad(ctx, ru - pw * 0.3, ru + pw * 0.3, [[0, '#f0d890'], [1, '#a07a30']]); ctx.fillRect(-wp * 0.1, ru - pw * 0.3, wp * 0.2, pw * 0.6);
      }
      ctx.restore();
      if (f > 0.03) {   // the pipe sounds: it glows in its lane colour from the press hole to the rim
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(p.bv ?? p.v, p.bu ?? p.base); ctx.rotate(p.ang);
        const gw = pw * (L0.sleeve ? 1.1 : 0.7);
        ctx.fillStyle = vgrad(ctx, -p.L, 0, [[0, rgba(col, 0.15 * f)], [0.6, rgba(col, 0.5 * f)], [1, rgba(col, 0.2 * f)]]); rrect(ctx, -gw / 2, -p.L, gw, p.L, gw * 0.3); ctx.fill();
        for (let q = 0; q < 3; q++) { const ph = (rt.anim * 1.6 + q / 3) % 1; ctx.strokeStyle = rgba('#ffffff', (1 - ph) * 0.5 * f); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, -p.L - ph * 18, pw * (0.55 + ph * 0.8), pw * (0.22 + ph * 0.3), 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
        ctx.restore();
      }
    };
    // shadow, back to front
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(ctx, 0, chest.u + (chest.h || chest.rc) * 0.9, (chest.w || chest.rc * 2.2) / 2 + 30, (chest.h || chest.rc) * 0.7); ctx.fill();
    if (style === 'khene') {   // the rear row: every pipe has a partner standing behind it in the gap, a little darker and of its own length
      const ph = G.pitch / 2;
      lanes.forEach((_, i) => {
        const p = pipes[i], q = pipes[Math.min(N - 1, i + 1)], Lr = Math.min(G.Lmax, (p.L + q.L) / 2 * 1.06 + pw * 0.5), wr = pw * 0.84;
        ctx.save(); ctx.translate(p.v + ph, p.base);
        tube(ctx, 0, -Lr, 0, wr, darker(mix(body, '#7a4a20', 0.22), 0.1), { seed: i * 13 + 7, round: wr * 0.15, nodes: [-Lr * 0.2, -Lr * 0.53, -Lr * 0.8], open: true, spec: 0.2 });
        ctx.fillStyle = 'rgba(20,10,4,0.16)'; ctx.fillRect(-wr / 2, -Lr, wr, Lr);
        ctx.restore();
      });
    }
    const idxs = lanes.map((_, i) => i);
    if (!L0.row) idxs.sort((a, b) => Math.abs(pipes[b].ang) - Math.abs(pipes[a].ang));
    idxs.forEach(drawPipe);
    if (style === 'khene') {   // the whole bundle is bound across with rattan, over both rows
      const Lmin = Math.min(...pipes.map((q) => q.L)), x0 = pipes[0].v - pw * 0.72, x1 = pipes[N - 1].v + G.pitch * 0.5 + pw * 0.6;
      for (const d of [3.7, 7.2]) {
        if (pw * d > Lmin * 0.92) continue;
        const u = baseU - pw * d;
        lash(ctx, x0, x1, u, pw * 0.34, [L0.ring, '#e8d8a8', '#1a1210'], 0);
        lash(ctx, x0, x1, u + pw * 0.38, pw * 0.1, ['#1a1210', '#d8b45a'], 1);
      }
    }
    // the wind chest
    if (L0.row) {
      const x = chest.v0, y = chest.u - pw * 0.55, w = chest.w, h = chest.h;
      const kh = style === 'khene', cr = h * 0.5;
      const cpath = () => {   // khene: a turned hardwood barrel, flat on top where the pipes enter, belly below
        ctx.beginPath(); ctx.moveTo(x + cr, y); ctx.lineTo(x + w - cr, y); ctx.quadraticCurveTo(x + w, y, x + w, y + h * 0.45); ctx.quadraticCurveTo(x + w, y + h * 0.95, x + w - cr * 0.8, y + h * 1.0);
        ctx.bezierCurveTo(x + w * 0.75, y + h * 1.26, x + w * 0.25, y + h * 1.26, x + cr * 0.8, y + h * 1.0); ctx.quadraticCurveTo(x, y + h * 0.95, x, y + h * 0.45); ctx.quadraticCurveTo(x, y, x + cr, y); ctx.closePath();
      };
      const shape = () => (kh ? cpath() : rrect(ctx, x, y, w, h, h * 0.5));
      if (kh) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.save(); ctx.translate(6, 10); cpath(); ctx.fill(); ctx.restore(); }
      shape(); ctx.fillStyle = vgrad(ctx, y, y + h * (kh ? 1.4 : 1), [[0, lighter(L0.chest, 0.35)], [0.3, L0.chest], [1, darker(L0.chest, 0.6)]]); ctx.fill();
      ctx.save(); shape(); ctx.clip(); grain(ctx, x, y, w, h * 1.4, darker(L0.chest, 0.7), 0.4, 9, false, 8);
      ctx.fillStyle = 'rgba(255,230,190,0.28)'; ctx.fillRect(x, y + h * 0.1, w, h * 0.16);
      if (kh) for (const q of [0.12, 0.2, 0.8, 0.88]) { ctx.fillStyle = 'rgba(20,8,2,0.5)'; ctx.fillRect(x + w * q, y, 2.5, h * 1.4); ctx.fillStyle = 'rgba(255,230,190,0.2)'; ctx.fillRect(x + w * q + 2.5, y, 1.5, h * 1.4); }
      ctx.restore();
      ctx.strokeStyle = rgba(lighter(L0.chest, 0.5), 0.5); ctx.lineWidth = 2; shape(); ctx.stroke();
      if (kh) {   // black wax seals the pipes into the top of the chest: a seam and a lump around every pipe
        ctx.fillStyle = vgrad(ctx, y - pw * 0.2, y + pw * 0.34, [[0, '#4a3826'], [0.4, '#1c1209'], [1, '#080503']]); rrect(ctx, x + cr * 0.45, y - pw * 0.12, w - cr * 0.9, pw * 0.44, pw * 0.18); ctx.fill();
        for (const q of pipes) { ctx.fillStyle = vgrad(ctx, y - pw * 0.4, y + pw * 0.1, [[0, '#4a3826'], [1, '#150d06']]); ell(ctx, q.v, y - pw * 0.04, pw * 0.74, pw * 0.3); ctx.fill(); ctx.fillStyle = 'rgba(255,240,210,0.22)'; ell(ctx, q.v - pw * 0.2, y - pw * 0.14, pw * 0.22, pw * 0.07); ctx.fill(); }
      }
      if (!kh) for (const q of [0.04, 0.96]) lash(ctx, x + w * q - pw * 0.25, x + w * q + pw * 0.25, y - 2, h + 4, [L0.trim, darker(L0.trim, 0.5)], 0);
      else for (const q of [0.05, 0.95]) lash(ctx, x + w * q - pw * 0.22, x + w * q + pw * 0.22, y + h * 0.1, h * 0.85, [L0.trim, darker(L0.trim, 0.5)], 0);
      // blowpipe with its lip plate
      const [mv, mu] = mouthPt();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = pw * 0.55; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo((style === 'lusheng' ? x + h * 0.9 : 0) + 4, y + h * (kh ? 1.08 : 1) + 4); ctx.lineTo(mv + 4, mu + 4); ctx.stroke();
      ctx.strokeStyle = vgrad(ctx, y, mu, [[0, lighter(body, 0.2)], [1, darker(body, 0.3)]]); ctx.lineWidth = pw * 0.5; ctx.beginPath(); ctx.moveTo(style === 'lusheng' ? x + h * 0.9 : 0, y + h * (kh ? 1.08 : 1) - 2); ctx.lineTo(mv, mu); ctx.stroke();
      ctx.fillStyle = vgrad(ctx, mu - pw * 0.2, mu + pw * 0.2, [[0, lighter(L0.trim, 0.2)], [1, darker(L0.trim, 0.4)]]); ell(ctx, mv, mu, pw * 0.5, pw * 0.2); ctx.fill();
      ctx.fillStyle = '#100804'; ell(ctx, mv, mu, pw * 0.26, pw * 0.1); ctx.fill();
    } else {
      const cx = 0, cy = chest.u, r = chest.rc;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, cx + 10, cy + r * 0.2 + 12, r * 1.05, r * 0.5); ctx.fill();
      const [mv, mu] = mouthPt();
      ctx.strokeStyle = vgrad(ctx, cy, mu, [[0, lighter(L0.chest, 0.2)], [1, darker(L0.chest, 0.4)]]); ctx.lineWidth = pw * 0.8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(r * 0.4, cy + r * 0.3); ctx.lineTo(mv, mu); ctx.stroke();
      ctx.fillStyle = L0.trim; ell(ctx, mv, mu, pw * 0.75, pw * 0.32); ctx.fill(); ctx.fillStyle = '#100804'; ell(ctx, mv, mu, pw * 0.35, pw * 0.14); ctx.fill();
      ctx.fillStyle = rgrad(ctx, cx - r * 0.3, cy - r * 0.35, r * 0.05, r * 1.15, [[0, lighter(L0.chest, 0.45)], [0.5, L0.chest], [1, darker(L0.chest, 0.65)]]); ell(ctx, cx, cy, r, r * 0.62); ctx.fill();
      ctx.strokeStyle = rgba(L0.trim, 0.9); ctx.lineWidth = 5; ell(ctx, cx, cy, r * 0.98, r * 0.6); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.86, r * 0.52, 0, Math.PI * 1.05, Math.PI * 1.55); ctx.stroke();
      ctx.fillStyle = rgba(L0.trim, 0.8); for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; circ(ctx, Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.55 - cy + cy, 2.5); ctx.fill(); }
    }
    // press holes: open (dark) at rest; covered and lit in the lane colour while the note sounds
    lanes.forEach((l, i) => {
      const sp = spots[i], f = hv(rt, i), r = pw * 0.36;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, sp.v + 2, sp.u + 3, r + 2, r + 2); ctx.fill();
      ctx.fillStyle = rgrad(ctx, sp.v, sp.u, 0, r * 1.2, [[0, '#000'], [0.7, '#140a04'], [1, '#2a1608']]); circ(ctx, sp.v, sp.u, r); ctx.fill();
      ctx.strokeStyle = rgba(lighter(body, 0.7), 0.9); ctx.lineWidth = 2; ctx.stroke();
      if (f > 0.03) { ctx.fillStyle = rgba(lighter(l.color, 0.35), 0.45 + 0.5 * f); circ(ctx, sp.v, sp.u, r * 1.55); ctx.fill(); ctx.strokeStyle = rgba(lighter(l.color, 0.7), 0.9); ctx.lineWidth = 2.5; ctx.stroke(); glow(ctx, sp.v, sp.u, 70, l.color, 0.55 * f); }
      if (L0.row) marker(ctx, sp.v, sp.u, sp.r * 0.78, l, rt.flash[i] ?? 0);
      else { ctx.strokeStyle = rgba(lighter(l.color, 0.4), 0.28 + 0.7 * (rt.flash[i] ?? 0)); ctx.lineWidth = 2; circ(ctx, sp.v, sp.u, r * 1.28); ctx.stroke(); }   // sho: one quiet ring per hole
    });
    const [mv, mu] = mouthPt();
    cues(ctx, rt, lanes, spots, (i, p) => {
      const q = pipes[i], sp = spots[i], d1 = Math.hypot(q.v - mv, chest.u - mu), d2 = Math.hypot(sp.v - q.v, sp.u - chest.u), tot = d1 + d2, s = p * tot;
      return s < d1 ? [lerp(mv, q.v, s / d1), lerp(mu, chest.u, s / d1)] : [lerp(q.v, sp.v, (s - d1) / d2), lerp(chest.u, sp.u, (s - d1) / d2)];
    }, (i) => spots[i].r * 0.78);
    ctx.restore();
    void H;
    drawPills(g, F, spots, lanes, rt, (i) => (L0.row ? (style === 'khene' ? [pipes[i].v, pipes[i].holeU - spots[i].r - 20] : [pipes[i].v, pipes[i].holeU - pw * 2.0 - (i % 2) * pw * 1.6]) : [spots[i].v, spots[i].u]));
  };
  return st;
}

// ================================================================ END-BLOWN ===================================================
const END = {
  shakuhachi: { body: '#c79a52', top: 'notch', thumb: 1, w: 1.0, nodes: 6, root: true, bold: true, bend: true, set: { kind: 'inkwash', base: '#1b2523', accent: '#8fae92', light: '#e9eddc', vig: 0.42 } },
  xiao: { body: '#bf9a58', top: 'notch', thumb: 1, w: 0.8, nodes: 7, bold: true, bend: true, set: { kind: 'bamboo', base: '#1b2b24', accent: '#86a98a', light: '#e4f0d8', vig: 0.42 } },
  ney: { body: '#d2ae6a', top: 'rim', thumb: 1, w: 0.84, nodes: 6, cap: true, bend: true, set: { kind: 'tiles', base: '#243c56', accent: '#d8b45a', light: '#ffe0a8' } },
  quena: { body: '#a86a38', top: 'quena', thumb: 1, w: 1.0, nodes: 2, set: { kind: 'cloth', base: '#4a2a28', accent: '#e8b84a', light: '#ffd9a0' } },
  kaval: { body: '#8a5a30', top: 'rim', thumb: 0, w: 1.05, nodes: 0, bands: true, bend: true, set: { kind: 'planks', base: '#4a3220' } },
  fujara: { body: '#b87a40', top: 'fipple', thumb: 0, w: 1.25, nodes: 0, paint: true, set: { kind: 'planks', base: '#3a2c1c' } },
  duduk: { body: '#d68a3e', top: 'reed', thumb: 1, w: 1.15, nodes: 0, set: { kind: 'cloth', base: '#4a2418', accent: '#e8c070', light: '#ffd9a0' } },
};
function createEndBlown(S, lanes, style, P) {
  const N = lanes.length, st = stageBase('endblown', style, lanes), spots = st.spots;
  const L0 = { ...(END[style] ?? END.quena) };
  L0.set = { ...L0.set, ...(P?.set ?? {}) };   // a game's params may replace the backdrop (kind, base, accent, light, vig)
  st.bowed = true;                           // the optional meri / kari bend plays a sustained quiet voice
  const nAll = clamp(Math.max(0, ...lanes.map((l) => (l.holes || '').length)) || 6, 3, 10);
  const nFront = nAll - (L0.thumb ? 1 : 0);
  const fingerOf = (i) => { const h = lanes[i].holes || ''; return Array.from({ length: nAll }, (_, k) => h[k] === '1'); };
  const first = lanes.map((l) => { const h = (l.holes || '').slice(0, nFront); let c = 0; while (c < h.length && h[c] === '1') c++; return h ? c : null; });
  const { order } = byPitchRank(lanes);
  order.forEach((i, rank) => { if (first[i] == null) first[i] = clamp(nFront - rank, 0, nFront); });
  const reg = new Array(N).fill(0), groups = new Map();
  order.forEach((i) => { groups.set(first[i], [...(groups.get(first[i]) ?? []), i]); });
  groups.forEach((list) => list.forEach((i, r) => { reg[i] = r; }));
  const fing = new Array(nAll).fill(1);
  let lastAnim = 0, bend = 0, bendT = 0, drag = null, lastTone = -9, lastHz = 0;
  st.layout = (area) => {
    const F = makeFrame(area, { top: 40, bottom: 10, side: 16 }); st.F = F;
    const { W, H } = F;
    const pw = L0.bold ? clamp(Math.min(W * 0.21, 132), 64, 132) * Math.max(L0.w, 0.86) : clamp(Math.min(W * 0.17, 104), 52, 104) * L0.w;
    const topU = H * 0.06, footU = H * (L0.root ? 0.925 : 0.95), hU0 = H * (style === 'fujara' ? 0.5 : 0.3), hU1 = H * (L0.root ? 0.8 : 0.86), nGap = Math.max(1, nFront - (style === 'fujara' ? 0 : 0));
    const step = (hU1 - hU0) / nGap;
    const G = { W, H, pw, topU, footU, hU0, hU1, step, regGap: clamp(W * 0.24, 70, 150) };
    G.holeAt = (k) => hU0 + (k + 0.5) * step;
    G.thumbU = hU0 - step * 0.35;
    st.G = G;
    const R = clamp(step * 0.5, 24, 40);
    lanes.forEach((_, i) => {
      const c = first[i], u = c >= nFront ? footU + 4 : G.holeAt(c), v = reg[i] ? (pw * 0.5 + G.regGap * 0.6) + (reg[i] - 1) * G.regGap * 0.9 : 0;
      spots[i] = circleSpot(v, u, R + (reg[i] ? 6 : 0), { first: c, reg: reg[i] });
      if (!reg[i]) {   // the name pill stands beside the tube so the hole stays visible; the pill is part of the touch target
        const pv = -(pw * 0.5 + 50), sp = spots[i], own = sp.dist;
        sp.pillV = pv; sp.dist = (lv, lu) => Math.min(own(lv, lu), Math.hypot(lv - pv, lu - sp.u) / (R * 0.9));
      }
    });
    finishSpots(F, spots);
  };
  st.sound = (audio, p) => windSound(audio, style === 'duduk' ? 'reedpipe' : 'endblown', { ...p, style });
  // the numeral of the count-in stands beside the tube (never on it, never on a label)
  st.countSpot = () => {
    const F = st.F, G = st.G;
    if (!F || !G) return null;
    const [x, y] = F.landscape ? F.map(F.W * 0.3, G.H * 0.17) : F.map(-F.W * 0.27, G.H * 0.14);
    return { x, y, size: clamp(Math.min(F.W, G.H) * 0.2, 56, 120) };
  };
  // meri / kari: dragging up or down while a note sounds bends it (down = meri, the chin covers more of the edge and the pitch sinks;
  // up = kari, the edge opens and the pitch rises). Presentation and a quiet extra tone only: scoring reads taps and never this.
  st.pointer = (p) => {
    const out = [];
    if (!L0.bend || !st.F || !p) return out;
    if (p.pressed) { drag = { y0: p.y, lane: st.hit(p.x, p.y), moved: false }; lastHz = 0; }
    if (!p.down) { drag = null; bendT = 0; return out; }
    if (!drag) return out;
    const dy = p.y - drag.y0;
    if (!drag.moved && Math.abs(dy) < 14) return out;
    drag.moved = true;
    bendT = clamp(-(dy - Math.sign(dy) * 14) / Math.max(70, st.F.area.h * 0.1), -1, 1);
    const base = p.sounding?.hz ?? (drag.lane >= 0 ? lanes[drag.lane].hz : 0);
    if (base && p.clock - lastTone > 0.09) {
      const hz = base * 2 ** ((bendT < 0 ? bendT * 250 : bendT * 100) / 1200);
      out.push({ freq: lastHz || base, to: hz, dur: 0.16, type: 'sine', vol: 0.06 });
      lastHz = hz; lastTone = p.clock;
    }
    return out;
  };
  st.draw = (g, rt) => {
    const { ctx } = g, F = st.F;
    if (!F) return;
    const G = st.G, { pw, topU, footU, step } = G, body = L0.body;
    let act = -1, best = 0.02;
    lanes.forEach((_, i) => { const v = hv(rt, i); if (v > best) { best = v; act = i; } });
    const dtv = clamp(rt.anim - lastAnim, 0, 0.1); lastAnim = rt.anim;
    if (!drag) bendT = 0;
    bend += (bendT - bend) * clamp(dtv * 14, 0, 1);
    const tgt = act >= 0 ? fingerOf(act) : new Array(nAll).fill(true);
    for (let k = 0; k < nAll; k++) fing[k] += ((tgt[k] ? 1 : 0) - fing[k]) * clamp(dtv * 18, 0, 1);
    const col = act >= 0 ? lanes[act].color : '#ffd9a0', live = act >= 0 ? best : 0;
    setting(ctx, F, L0.set.kind, S, rt, { ...L0.set, rugKind: null, bbox: instrumentBox(F) });
    ctx.save(); F.apply(ctx);
    const nodes = [];
    for (let k = 1; k <= L0.nodes; k++) nodes.push(lerp(topU + 30, footU - 30, k / (L0.nodes + 1)));
    const t0 = topU + (L0.top === 'reed' ? pw * 1.6 : L0.top === 'notch' ? pw * 0.6 : 0);
    if (L0.bold) { ctx.fillStyle = 'rgba(4,8,7,0.5)'; rrect(ctx, -pw / 2 - 8, t0 - 6, pw + 16, footU - t0 + 12, pw * 0.3); ctx.fill(); }
    tube(ctx, 0, t0, footU, pw, body, { nodes, seed: 9, round: pw * 0.2, fleck: '#2a1608', spec: 0.4 });
    if (L0.bold) { ctx.strokeStyle = 'rgba(14,8,3,0.9)'; ctx.lineWidth = 3.5; rrect(ctx, -pw / 2, t0, pw, footU - t0, pw * 0.2); ctx.stroke(); }
    // body details by instrument
    if (L0.bands) for (const q of [0.12, 0.5, 0.9]) lash(ctx, -pw * 0.53, pw * 0.53, lerp(t0, footU, q), pw * 0.2, ['#d8c070', '#7a5a20'], 0);
    if (L0.paint) { // carved and painted bands of the long shepherd's flute
      for (let k = 0; k < 7; k++) { const u = lerp(t0 + 80, footU - 60, k / 6); ctx.fillStyle = k % 2 ? 'rgba(122,30,26,0.8)' : 'rgba(232,200,110,0.7)'; ctx.fillRect(-pw * 0.5, u, pw, pw * 0.1); }
      ctx.strokeStyle = 'rgba(122,30,26,0.55)'; ctx.lineWidth = 2; for (let u = t0 + 100; u < footU - 90; u += pw * 0.5) { ctx.beginPath(); ctx.moveTo(-pw * 0.4, u); ctx.lineTo(0, u + pw * 0.24); ctx.lineTo(pw * 0.4, u); ctx.stroke(); }
    }
    if (L0.root) {   // the root end: the bamboo's own root bulb flares out below the lowest hole, with knobbly root scars and a wide open bore
      const fu0 = footU - pw * 1.3, fw = pw * 0.8, fb = footU - pw * 0.04, rough = (k) => (hash(k * 3.7 + 2) - 0.5) * pw * 0.05;
      ctx.fillStyle = 'rgba(0,0,0,0.38)'; ell(ctx, fw * 0.12, fb + pw * 0.1, fw * 1.05, pw * 0.22); ctx.fill();
      const path = () => {
        ctx.beginPath(); ctx.moveTo(-pw / 2, fu0);
        ctx.bezierCurveTo(-pw / 2 - pw * 0.02, fu0 + pw * 0.55, -fw, fb - pw * 0.72, -fw, fb - pw * 0.2);
        for (let k = 1; k < 8; k++) { const t = k / 8; ctx.lineTo(-fw + 2 * fw * t, fb + pw * 0.04 * Math.sin(t * Math.PI) + rough(k)); }
        ctx.lineTo(fw, fb - pw * 0.2);
        ctx.bezierCurveTo(fw, fb - pw * 0.72, pw / 2 + pw * 0.02, fu0 + pw * 0.55, pw / 2, fu0);
        ctx.closePath();
      };
      path(); ctx.fillStyle = hgrad(ctx, -fw, fw, [[0, darker(body, 0.5)], [0.16, lighter(body, 0.45)], [0.4, body], [0.78, darker(body, 0.38)], [1, darker(body, 0.7)]]); ctx.fill();
      ctx.save(); path(); ctx.clip();
      grain(ctx, -fw, fu0, fw * 2, footU - fu0, darker(body, 0.7), 0.4, 13, true, 8);
      for (let k = 0; k < 7; k++) {   // old root scars: dark knobs with a pale lip
        const a = (k + 0.5) / 7, sx = -fw * 0.92 + a * fw * 1.84, sy = footU - pw * (0.15 + 0.55 * hash(k + 5));
        ctx.fillStyle = rgba('#2a1608', 0.55); ell(ctx, sx, sy, pw * 0.07, pw * 0.045); ctx.fill();
        ctx.strokeStyle = rgba(lighter(body, 0.55), 0.45); ctx.lineWidth = 1.5; ell(ctx, sx, sy, pw * 0.075, pw * 0.05); ctx.stroke();
      }
      ctx.fillStyle = rgba(darker(body, 0.75), 0.7); ctx.fillRect(-fw, fu0 + pw * 0.55, fw * 2, pw * 0.08);   // the node ridge where the flare begins
      ctx.fillStyle = rgba(lighter(body, 0.6), 0.38); ctx.fillRect(-fw, fu0 + pw * 0.63, fw * 2, pw * 0.04);
      ctx.restore();
      ctx.strokeStyle = 'rgba(14,8,3,0.9)'; ctx.lineWidth = 3.5; path(); ctx.stroke();
      ctx.fillStyle = vgrad(ctx, fb - pw * 0.3, fb + pw * 0.1, [[0, lighter(body, 0.3)], [1, darker(body, 0.3)]]); ell(ctx, 0, fb - pw * 0.06, fw * 0.84, pw * 0.27); ctx.fill();   // the lip of the bore
      ctx.fillStyle = rgrad(ctx, 0, fb - pw * 0.04, 0, fw * 0.7, [[0, '#050301'], [0.8, '#1a0e06'], [1, '#2e1a0c']]); ell(ctx, 0, fb - pw * 0.03, fw * 0.68, pw * 0.2); ctx.fill();
    } else { ctx.fillStyle = '#150a04'; ell(ctx, 0, footU - 1, pw * 0.34, pw * 0.1); ctx.fill(); }
    // the top: embouchure
    if (L0.top === 'notch') {   // slanted blowing edge: the cane is cut across at an angle, inlaid with bone along the edge, with a U-notch
      const cy0 = topU + pw * 0.62, cx0 = -pw / 2, cx1 = pw / 2;
      ctx.fillStyle = hgrad(ctx, cx0, cx1, [[0, darker(body, 0.5)], [0.16, lighter(body, 0.5)], [0.38, body], [0.78, darker(body, 0.36)], [1, darker(body, 0.66)]]);
      ctx.beginPath(); ctx.moveTo(cx0, cy0 + 4); ctx.lineTo(cx0, topU + pw * 0.5); ctx.lineTo(cx1, topU + pw * 0.04); ctx.lineTo(cx1, cy0 + 4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba(lighter(body, 0.65), 0.4); ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = vgrad(ctx, topU, topU + pw * 0.6, [[0, '#fbf6e8'], [1, '#d4c49a']]);   // bone inlay along the edge
      ctx.beginPath(); ctx.moveTo(cx0, topU + pw * 0.5); ctx.lineTo(cx1, topU + pw * 0.04); ctx.lineTo(cx1, topU + pw * 0.2); ctx.lineTo(cx0, topU + pw * 0.66); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#100803'; ctx.beginPath(); ctx.moveTo(-pw * 0.22, topU + pw * 0.4); ctx.lineTo(pw * 0.2, topU + pw * 0.18); ctx.lineTo(pw * 0.24, topU + pw * 0.46); ctx.quadraticCurveTo(0, topU + pw * 0.72, -pw * 0.18, topU + pw * 0.66); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx0, topU + pw * 0.5); ctx.lineTo(cx1, topU + pw * 0.04); ctx.stroke();
    } else if (L0.top === 'quena') { // a U-shaped notch cut into the rim
      ctx.fillStyle = '#120804'; ctx.beginPath(); ctx.moveTo(-pw * 0.26, topU); ctx.lineTo(-pw * 0.26, topU + pw * 0.25); ctx.arc(0, topU + pw * 0.25, pw * 0.26, Math.PI, 0, true); ctx.lineTo(pw * 0.26, topU); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba(lighter(body, 0.7), 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, topU + pw * 0.25, pw * 0.27, Math.PI * 0.02, Math.PI * 0.98); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-pw * 0.5, topU, pw * 0.1, pw * 0.12);
    } else if (L0.top === 'rim') { // rim-blown: a metal / horn mouth ring
      ctx.fillStyle = vgrad(ctx, topU - 6, topU + pw * 0.55, [[0, '#f0e4c0'], [0.5, '#b89a4a'], [1, '#6a5020']]); rrect(ctx, -pw * 0.55, topU - 6, pw * 1.1, pw * 0.55, pw * 0.14); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-pw * 0.5, topU - 2, pw * 0.2, pw * 0.5);
      ctx.fillStyle = '#0a0402'; ell(ctx, 0, topU - 5, pw * 0.4, pw * 0.13); ctx.fill();
      ctx.strokeStyle = 'rgba(255,240,200,0.7)'; ctx.lineWidth = 1.8; ell(ctx, 0, topU - 5, pw * 0.5, pw * 0.16); ctx.stroke();
    } else if (L0.top === 'fipple') { // sealed wooden plug with the blowing hole, then the window and the cut lip below it
      ctx.fillStyle = hgrad(ctx, -pw / 2, pw / 2, [[0, darker(body, 0.5)], [0.18, lighter(body, 0.45)], [0.45, body], [1, darker(body, 0.66)]]);
      rrect(ctx, -pw * 0.55, topU - 4, pw * 1.1, pw * 0.5, pw * 0.2); ctx.fill();
      ctx.strokeStyle = rgba(lighter(body, 0.6), 0.5); ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#0a0402'; ell(ctx, 0, topU + 2, pw * 0.16, pw * 0.07); ctx.fill();
      ctx.fillStyle = '#120804'; rrect(ctx, -pw * 0.26, topU + pw * 0.78, pw * 0.52, pw * 0.34, 4); ctx.fill();
      ctx.fillStyle = '#efe0b8'; ctx.beginPath(); ctx.moveTo(-pw * 0.28, topU + pw * 1.12); ctx.lineTo(pw * 0.28, topU + pw * 1.12); ctx.lineTo(0, topU + pw * 0.9); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba(L0.paintCol ?? '#e8c86e', 0.9); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-pw * 0.5, topU + pw * 0.62); ctx.lineTo(pw * 0.5, topU + pw * 0.62); ctx.stroke();
    } else if (L0.top === 'reed') { // the big double reed of the apricot-wood pipe, with a binding ring and a slider
      ctx.fillStyle = vgrad(ctx, topU, topU + pw * 1.7, [[0, '#e8d28a'], [1, '#a68a3c']]);
      ctx.beginPath(); ctx.moveTo(-pw * 0.42, topU + pw * 1.65); ctx.lineTo(-pw * 0.5, topU + pw * 0.2); ctx.quadraticCurveTo(0, topU - pw * 0.15, pw * 0.5, topU + pw * 0.2); ctx.lineTo(pw * 0.42, topU + pw * 1.65); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(80,50,10,0.55)'; ctx.lineWidth = 1.5; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(-pw * 0.4 + k * pw * 0.13, topU + pw * 0.15); ctx.lineTo(-pw * 0.36 + k * pw * 0.12, topU + pw * 1.6); ctx.stroke(); }
      ctx.fillStyle = '#120804'; ell(ctx, 0, topU + pw * 0.06, pw * 0.34, pw * 0.07); ctx.fill();
      ctx.fillStyle = vgrad(ctx, topU + pw * 1.2, topU + pw * 1.5, [[0, '#d0d4d8'], [1, '#6a6e72']]); rrect(ctx, -pw * 0.52, topU + pw * 1.2, pw * 1.04, pw * 0.3, pw * 0.1); ctx.fill();
    }
    if (L0.bend && Math.abs(bend) > 0.03) {   // meri: the chin shades the blowing edge and the pitch sinks; kari: the edge opens and glints
      const b = bend, ey = topU + pw * (L0.top === 'notch' ? 0.34 : 0.1);
      if (b < 0) { ctx.fillStyle = rgba('#0a0604', 0.5 * -b); ell(ctx, 0, ey + pw * 0.2, pw * (0.12 + 0.2 * -b), pw * (0.06 + 0.12 * -b)); ctx.fill(); }
      else { glow(ctx, 0, ey, pw * 0.9, '#fff0c0', 0.5 * b); ctx.strokeStyle = rgba('#fff8e0', 0.8 * b); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-pw * 0.4, ey + pw * 0.22); ctx.lineTo(pw * 0.4, ey - pw * 0.2); ctx.stroke(); }
    }
    if (L0.cap) { ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-pw * 0.5, topU + pw * 0.55, pw * 0.14, G.step * 0.2); }
    // holes. Closed ones show a lit pad (the player's finger is not drawn): brightness follows the sounding note.
    const padA = 0.22 + 0.78 * Math.min(1, live * 1.4);
    const r = Math.min(pw * 0.2, step * 0.22);
    const drawHole = (u, k, dashed) => {
      const c = fing[k];
      if (dashed) {
        ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = rgba(lighter(body, 0.7), 0.85); ctx.lineWidth = 2.5; circ(ctx, 0, u, r * 1.25); ctx.stroke(); ctx.restore();
        ctx.fillStyle = rgba(darker(body, 0.5), 0.25 * (1 - c)); circ(ctx, 0, u, r * 1.2); ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 2, u + 3, r + 2, r * 1.05 + 2); ctx.fill();
        ctx.fillStyle = rgrad(ctx, 0, u, 0, r * 1.1, [[0, '#000'], [0.7, '#140a04'], [1, '#2a1608']]); ell(ctx, 0, u, r, r * 1.05); ctx.fill();
        ctx.strokeStyle = rgba(lighter(body, 0.65), 0.9); ctx.lineWidth = 2; ctx.stroke();
      }
      if (c > 0.05) {
        const pr = r * (dashed ? 1.25 : 1.55);
        ctx.fillStyle = rgba(lighter(col, 0.3), 0.18 + 0.6 * padA * c); circ(ctx, 0, u, pr); ctx.fill();
        ctx.strokeStyle = rgba(lighter(col, 0.65), (0.3 + 0.7 * padA) * c); ctx.lineWidth = 2.5; ctx.stroke();
        if (live > 0.03) glow(ctx, 0, u, pr * 2.6, col, 0.32 * c * live);
      }
    };
    for (let k = 0; k < nFront; k++) drawHole(G.holeAt(k), k, false);
    if (L0.thumb) drawHole(G.thumbU, nFront, true);
    // air stream: from the embouchure it runs down the bore to the first open hole while a note sounds
    lanes.forEach((l, i) => {
      const sp = spots[i], f = hv(rt, i);
      if (f <= 0.03) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = vgrad(ctx, topU, sp.u, [[0, rgba(l.color, 0.5 * f)], [1, rgba(l.color, 0.1 * f)]]); rrect(ctx, -pw * 0.2, topU + pw * 0.3, pw * 0.4, Math.max(4, sp.u - topU - pw * 0.3), pw * 0.18); ctx.fill();
      ctx.strokeStyle = rgba('#ffffff', 0.55 * f); ctx.lineWidth = 2.5;
      for (let q = 0; q < 3; q++) { const p = (rt.anim * 1.5 + q / 3) % 1; ctx.globalAlpha = (1 - p) * f; ctx.beginPath(); ctx.arc(sp.v + (sp.reg ? 0 : pw * 0.5), sp.u, 14 + 40 * p, -0.9, 0.9); ctx.stroke(); }
      ctx.restore();
      glow(ctx, sp.v, sp.u, 66, l.color, 0.45 * f);
    });
    const mouthU = topU + (L0.top === 'reed' ? pw * 0.5 : pw * 0.3);
    cues(ctx, rt, lanes, spots, (i, p) => [lerp(0, spots[i].v, p), lerp(mouthU, spots[i].u, p)], (i) => spots[i].r * 0.95);
    lanes.forEach((l, i) => {
      const sp = spots[i], f = rt.flash[i] ?? 0;
      marker(ctx, sp.v, sp.u, sp.r * 0.95, l, f);
      if (sp.reg) { ctx.strokeStyle = rgba(l.color, 0.4); ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.moveTo(sp.v, sp.u); ctx.lineTo(pw * 0.5, sp.u); ctx.stroke(); ctx.setLineDash([]); }
      else { ctx.strokeStyle = rgba(l.color, 0.45); ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(sp.pillV + 34, sp.u); ctx.lineTo(sp.v - sp.r * 0.95, sp.u); ctx.stroke(); ctx.setLineDash([]); }
    });
    ctx.restore();
    if (L0.bend && !isHero()) {   // the meri / kari gauge (screen space, always upright): a bead rides it while you drag
      const hh = clamp(F.area.h * 0.075, 40, 74), act2 = Math.abs(bend);
      const [mx, my] = F.map(F.landscape ? -(pw * 0.5 + 30 + hh + 22) : pw * 0.5 + 46, topU + pw * 0.95);
      const a = 0.4 + 0.6 * Math.min(1, act2 * 2.5), size = g.px(13);
      ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(6,10,9,0.62)'; rrect(ctx, mx - 11, my - hh - 6, 22, hh * 2 + 12, 11); ctx.fill();
      ctx.strokeStyle = rgba('#e8dcb0', 0.85); ctx.lineWidth = 2; rrect(ctx, mx - 11, my - hh - 6, 22, hh * 2 + 12, 11); ctx.stroke();
      ctx.strokeStyle = rgba('#e8dcb0', 0.55); ctx.beginPath(); ctx.moveTo(mx - 7, my); ctx.lineTo(mx + 7, my); ctx.stroke();
      ctx.fillStyle = act2 > 0.05 ? rgba(lighter(col, 0.3), 0.98) : '#e8dcb0'; circ(ctx, mx, my - bend * hh, 7); ctx.fill();
      ctx.restore();
      text(ctx, 'kari', mx, my - hh - 20, size, rgba('#f2e8c4', a), { weight: '800', outline: 'rgba(0,0,0,0.7)', lw: 3 });
      text(ctx, 'meri', mx, my + hh + 21, size, rgba('#f2e8c4', a), { weight: '800', outline: 'rgba(0,0,0,0.7)', lw: 3 });
    }
    drawPills(g, F, spots, lanes, rt, (i) => [spots[i].reg ? spots[i].v : spots[i].pillV, spots[i].u]);
  };
  return st;
}

export function createWindStage2(id, key, S, lanes, P) {
  if (id === 'alphorn') return createAlphorn(S, lanes, styleOf(key, ['trembita', 'alphorn'], 'alphorn'));
  if (id === 'panpipes') return createPanpipes(S, lanes, styleOf(key, ['siku', 'zampona', 'antara', 'nai', 'pan'], 'pan'));
  if (id === 'freereed') return createFreeReed(S, lanes, styleOf(key, ['lusheng', 'khene', 'sheng', 'sho'], 'khene'), P);
  return createEndBlown(S, lanes, styleOf(key, ['shakuhachi', 'xiao', 'ney', 'quena', 'kaval', 'fujara', 'duduk'], 'quena'), P);
}
void pool;
// 1.19.0: the shared drawing helpers are also used by stage-oboes.js, stage-bagpipes.js and stage-lamellophones.js (no behaviour change)
export { tube, lash, cues, drawPills, marker, stageBase, byPitchRank, hv, lightLocal };

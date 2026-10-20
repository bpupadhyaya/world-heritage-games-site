// The great Highland bagpipe as the play surface (layout "holes", instrument bagpipe): NO piper's face.
// A tartan-covered bag with cords and tassels, a blowpipe with its bone mouthpiece, two tenor drones and a bass drone rising over
// the shoulder with ivory ferrules and silver mounts, and a black wood chanter with a gold-rimmed bell. A forearm squeezes the bag
// on every note (the bag visibly gives), two hands cover the finger holes, and the breath of a note runs from the bag stock down the
// chanter to the first open hole. Lane -> hole: a note is tapped where the highest open hole is (as in winds.js); the bell is the foot.
import { clamp, mix, rgba, lighter, darker, glow, rrect, grain, hgrad, vgrad, rgrad, hash, ell, circ, TAU } from './art.js';
import { makeFrame, makeBox, rectSpot, finishSpots, hitSpots, pill, lerp } from './stagekit.js';
import { setting, instrumentBox } from './set.js';

export const IDS = [[/bagpipe|highland|chanter|gaida|gaita|zampogna|uilleann|piob|great.?pipe/, 'bagpipe']];
export function pipeId(key) { const k = String(key || '').toLowerCase(); for (const [re, id] of IDS) if (re.test(k)) return id; return null; }

const SKIN = '#d9a07a';
const PIPE = { black: '#17161a', ivory: '#efe4c6', gold: '#d9a93a', silver: '#c9ccd2' };

// a tapered tube from a to b with half-widths w0, w1 and a lathe-turned shading across it
function tube(ctx, ax, ay, bx, by, w0, w1, base, o = {}) {
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  const p = [[ax + nx * w0, ay + ny * w0], [bx + nx * w1, by + ny * w1], [bx - nx * w1, by - ny * w1], [ax - nx * w0, ay - ny * w0]];
  const mx = (ax + bx) / 2, my = (ay + by) / 2, wm = (w0 + w1) / 2;
  const gr = ctx.createLinearGradient(mx - nx * wm, my - ny * wm, mx + nx * wm, my + ny * wm);
  for (const [s, c] of o.stops ?? [[0, darker(base, 0.2)], [0.2, lighter(base, 0.55)], [0.42, base], [0.75, darker(base, 0.35)], [1, darker(base, 0.1)]]) gr.addColorStop(s, c);
  ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); ctx.lineTo(p[1][0], p[1][1]); ctx.lineTo(p[2][0], p[2][1]); ctx.lineTo(p[3][0], p[3][1]); ctx.closePath();
  if (o.shadow !== false) { ctx.save(); ctx.translate(6, 8); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill(); ctx.restore(); }
  ctx.fillStyle = gr; ctx.fill();
  if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
}
// a turned ring (ferrule, mount, cap) around an axis at position t along a->b
function band(ctx, ax, ay, bx, by, t, wHalf, thick, col, o = {}) {
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, cx = ax + dx * t, cy = ay + dy * t;
  tube(ctx, cx - ux * thick / 2, cy - uy * thick / 2, cx + ux * thick / 2, cy + uy * thick / 2, wHalf, wHalf * (o.taper ?? 1), col, { shadow: false, stops: o.stops ?? [[0, darker(col, 0.35)], [0.22, lighter(col, 0.7)], [0.5, col], [0.8, darker(col, 0.45)], [1, darker(col, 0.25)]] });
}

export function createBagpipeStage(S, lanes, P) {
  const N = lanes.length;
  const st = { id: 'bagpipe', kind: 'winds', spots: new Array(N).fill(null), voice: 'reed', sustained: true, F: null, G: null };
  const spots = st.spots;
  const nHoles = clamp(Math.max(0, ...lanes.map((l) => (l.holes || '').length)) || 8, 4, 9);
  const first = lanes.map((l) => { const h = l.holes || ''; if (!h) return null; let c = 0; while (c < h.length && h[c] === '1') c++; return c; });
  const byPitch = lanes.map((_, i) => i).sort((a, b) => lanes[a].hz - lanes[b].hz);
  byPitch.forEach((i, rank) => { if (first[i] == null) first[i] = clamp(nHoles - rank, 0, nHoles); });
  const fingerOf = (i) => Array.from({ length: nHoles }, (_, k) => k < first[i]);
  const fing = new Array(nHoles).fill(1);
  let lastAnim = 0, sq = 0, arm = 0;

  st.layout = (area) => {
    // a tall screen fits the instrument as it is; a squarish area (the title picture, a tablet) takes the whole pipe, scaled to fit, with nothing cropped
    const squarish = area.h < area.w * 1.3 && !(area.w > area.h * 1.15);
    const F = squarish ? makeBox(area, 600, 905, { top: 8, bottom: 8, side: 8, maxScale: 2 }) : makeFrame(area, { top: 40, bottom: 10, side: 14 });
    st.F = F;
    const { W, H } = F;
    const portrait = !F.landscape;
    const bagRx = clamp(Math.min(W * (portrait ? 0.3 : 0.26), H * 0.19), 70, 200), bagRy = clamp(H * (portrait ? 0.105 : 0.1), 56, 170);
    const pipeV = portrait ? W * 0.07 : 0;
    const bagU = H * 0.335, step = H * 0.054, holeU0 = H * 0.455;
    const cw = clamp(Math.min(W * 0.075, step * 0.9), 26, 50);
    const G = { W, H, bagRx, bagRy, bagU, pipeV, step, holeU0, cw, portrait, holeAt: (k) => holeU0 + k * step, footU: holeU0 + nHoles * step };
    st.G = G;
    const hw = cw / 2 + 92, R = clamp(step * 0.5, 16, 34);
    const used = new Map();
    lanes.forEach((_, i) => {
      const c = first[i], u = G.holeAt(clamp(c, 0, nHoles)), n = used.get(c) ?? 0; used.set(c, n + 1);
      // a lane that shares a fingering sits beside the first one (octaves)
      const sp = rectSpot(pipeV - 46 + n * (cw + 52), u, hw, step * 0.5, { first: c, hole: pipeV, dup: n });
      sp.r = R; spots[i] = sp;
    });
    finishSpots(F, spots);
  };
  st.hit = (x, y) => (st.F ? hitSpots(st.F, spots, x, y) : -1);
  st.anchor = (i) => ({ x: spots[i]?.x ?? 0, y: spots[i]?.y ?? 0 });
  st.voiceOf = () => 'pipe';

  const sleeve = (ctx, x0, y0, x1, y1, w, col) => {   // a forearm in a jacket sleeve with a white cuff
    tube(ctx, x0, y0, x1, y1, w, w * 0.78, col, { stops: [[0, darker(col, 0.15)], [0.25, lighter(col, 0.3)], [0.55, col], [1, darker(col, 0.55)]] });
  };

  st.draw = (g, rt) => {
    const { ctx } = g, F = st.F, G = st.G;
    if (!F) return;
    const { bagRx, bagRy, bagU, pipeV, step, cw, W, H } = G;
    // squeeze: every sounding note presses the bag a little (eased)
    const dtv = clamp(rt.anim - lastAnim, 0, 0.1); lastAnim = rt.anim;
    let act = -1, best = 0.02, loud = 0;
    lanes.forEach((_, i) => { const v = rt.flash[i] + (rt.hold[i] ?? 0) * 0.6; if (v > best) { best = v; act = i; } loud = Math.max(loud, rt.flash[i]); });
    sq += (loud - sq) * clamp(dtv * 14, 0, 1);
    arm += ((act >= 0 ? 1 : 0) - arm) * clamp(dtv * 6, 0, 1);
    const tgt = act >= 0 ? fingerOf(act) : new Array(nHoles).fill(true);
    for (let k = 0; k < nHoles; k++) fing[k] += ((tgt[k] ? 1 : 0) - fing[k]) * clamp(dtv * 18, 0, 1);

    setting(ctx, F, 'planks', S, rt, { base: '#3a2a1c', light: '#ffd9a0', rugKind: 'diamond', rugBase: '#1c3a2c', rugA: '#d9b45a', rugB: '#7a1f2a', rugPad: 0.04, rugTall: 0.4, bbox: instrumentBox(F) });
    ctx.save(); F.apply(ctx);
    const bx = pipeV - bagRx * 0.05, by = bagU;
    const bw = bagRx * (1 + 0.035 * sq), bh = bagRy * (1 - 0.1 * sq);

    // ---- drones: two tenors and a bass, rising from stocks on top of the bag, over the shoulder -------------------------------------
    const stockU = by - bh * 0.78, topU = H * 0.05;
    const drones = [
      { v0: bx - bw * 0.52, v1: bx - bw * 0.82, len: 0.16, tenor: true },
      { v0: bx - bw * 0.2, v1: bx - bw * 0.34, len: 0.19, tenor: true },
      { v0: bx + bw * 0.28, v1: bx + bw * 0.48, len: 0.235, tenor: false },
    ];
    const dw = clamp(cw * 0.42, 9, 20);
    drones.forEach((d, k) => {
      const ax = d.v0, ay = stockU + bh * 0.08, tipY = Math.max(topU, stockU - H * d.len * 1.35), bxx = d.v1, byy = tipY, sh = Math.sin(rt.anim * 24 + k) * 0.9 * (act >= 0 ? 1 : 0.2);
      const L = (t) => [ax + (bxx - ax) * t, ay + (byy - ay) * t];
      const w = (t) => dw * (d.tenor ? 1.0 - 0.28 * t : 1.12 - 0.3 * t);
      // sections: stock, body, slide, top (each a little narrower), turned black wood
      const segs = d.tenor ? [[0, 0.3], [0.3, 0.64], [0.64, 1.0]] : [[0, 0.26], [0.26, 0.56], [0.56, 0.82], [0.82, 1.0]];
      segs.forEach(([t0, t1], si) => { const [x0, y0] = L(t0), [x1, y1] = L(t1); tube(ctx, x0 + sh, y0, x1 + sh, y1, w(t0) * (si ? 0.9 : 1), w(t1) * 0.92, PIPE.black); });
      // ivory ferrules and silver mounts at every joint, a gold ring at the stock
      segs.forEach(([t0, t1], si) => { if (!si) return; const [x, y] = L(t0); band(ctx, x + sh, y, L(t1)[0] + sh, L(t1)[1], 0.0, w(t0) * 1.18, 13, PIPE.ivory); band(ctx, x + sh, y, L(t1)[0] + sh, L(t1)[1], 0.0, w(t0) * 1.02, 4, PIPE.silver); });
      { const [x, y] = L(0.06); band(ctx, x, y, L(0.3)[0], L(0.3)[1], 0, w(0) * 1.22, 18, PIPE.ivory); band(ctx, x, y, L(0.3)[0], L(0.3)[1], 0, w(0) * 1.3, 5, PIPE.gold); }
      // the tip: a flared ivory cap on a tenor, a big bulb on the bass drone, with the reed seat above it
      const [tx, ty] = L(1), [px, py] = L(0.8);
      if (d.tenor) { band(ctx, px + sh, py, tx + sh, ty, 1.0, w(1) * 1.45, 16, PIPE.ivory, { taper: 0.75 }); band(ctx, px + sh, py, tx + sh, ty, 0.86, w(1) * 1.4, 4, PIPE.gold); }
      else { band(ctx, px + sh, py, tx + sh, ty, 1.0, w(1) * 1.9, 24, PIPE.ivory, { taper: 0.7 }); band(ctx, px + sh, py, tx + sh, ty, 0.9, w(1) * 1.75, 5, PIPE.gold); band(ctx, px + sh, py, tx + sh, ty, 0.8, w(1) * 1.5, 6, PIPE.silver); }
      // soft glint of a lit drone: a bright thread down one side while any note sounds
      if (act >= 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba('#fff2c0', 0.1 + 0.08 * Math.sin(rt.anim * 6 + k)); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax - w(0) * 0.3, ay); ctx.lineTo(tx - w(1) * 0.3, ty); ctx.stroke(); ctx.restore(); }
    });

    // ---- chanter: black wood, ivory mounts, brass and gold, gold-rimmed bell ---------------------------------------------------------
    const cv = pipeV, topC = by + bh * 0.62, cwHalf = cw * 0.56, footU = G.footU + step * 0.4;
    // stock and hemp binding where the chanter enters the bag
    tube(ctx, cv, topC - 20, cv, topC + step * 0.9, cwHalf * 1.45, cwHalf * 1.15, PIPE.black);
    band(ctx, cv, topC + 8, cv, topC + 30, 0, cwHalf * 1.55, 22, '#b89860');
    tube(ctx, cv, topC + step * 0.9, cv, footU, cwHalf * 1.0, cwHalf * 1.22, PIPE.black);
    // two ivory rings, a silver ferrule, and the flared bell with a thick gold rim
    band(ctx, cv, G.holeAt(0) - step * 0.55, cv, G.holeAt(0), 0, cwHalf * 1.2, 11, PIPE.ivory);
    band(ctx, cv, G.holeAt(3) + step * 0.25, cv, G.holeAt(3) + step * 0.7, 0, cwHalf * 1.18, 7, PIPE.silver);
    band(ctx, cv, G.footU - step * 0.1, cv, G.footU + step * 0.4, 0, cwHalf * 1.4, 14, PIPE.ivory);
    tube(ctx, cv, G.footU + step * 0.3, cv, G.footU + step * 0.95, cwHalf * 1.3, cwHalf * 2.15, PIPE.black, { shadow: false });
    band(ctx, cv, G.footU + step * 0.86, cv, G.footU + step * 1.05, 0, cwHalf * 2.3, 16, PIPE.gold);
    ctx.fillStyle = '#050405'; ell(ctx, cv, G.footU + step * 1.0, cwHalf * 1.7, 5); ctx.fill();
    // finger holes: bored, with a bright metal ring (the thumb hole is on the back, drawn as a dashed ring)
    for (let k = 0; k < nHoles; k++) {
      const u = G.holeAt(k), r = Math.min(cw * 0.26, step * 0.24), thumb = k === 0 && nHoles >= 8;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, cv + 2, u + 3, r + 2, r + 2); ctx.fill();
      ctx.fillStyle = rgrad(ctx, cv, u, 0, r * 1.1, [[0, '#000000'], [0.7, '#0c0a0a'], [1, '#2a2420']]); ell(ctx, cv, u, r, r); ctx.fill();
      ctx.strokeStyle = rgba(thumb ? '#9a9aa4' : PIPE.gold, 0.95); ctx.lineWidth = 2; if (thumb) ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
    }
    // the air column: lit while a note sounds, from the bag stock to the first open hole
    lanes.forEach((l, i) => {
      const sp = spots[i], hv = Math.max(rt.flash[i] * 0.9, (rt.hold[i] ?? 0) * 0.8);
      if (hv <= 0.03) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = vgrad(ctx, topC, sp.u, [[0, rgba(l.color, 0.6 * hv)], [1, rgba(l.color, 0.12 * hv)]]); rrect(ctx, cv - cw * 0.2, topC, cw * 0.4, Math.max(4, sp.u - topC), cw * 0.2); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = rgba('#ffffff', 0.6 * hv); ctx.lineWidth = 3;
      for (let q = 0; q < 3; q++) { const p = ((rt.anim * 1.7 + q / 3) % 1); ctx.globalAlpha = (1 - p) * hv; ctx.beginPath(); ctx.arc(cv + cw * 0.6, sp.u, 12 + 34 * p, -0.9, 0.9); ctx.stroke(); }
      ctx.globalAlpha = 1; glow(ctx, cv, sp.u, 64, l.color, 0.5 * hv);
    });

    // ---- the bag: tartan cover, cords and tassels; it gives under the squeezing arm --------------------------------------------------
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.34)'; ell(ctx, bx + 12, by + 16, bw * 1.02, bh * 1.04); ctx.fill();
    const bagPath = () => { ctx.beginPath(); ctx.moveTo(bx - bw, by); ctx.bezierCurveTo(bx - bw, by - bh * 1.3, bx + bw * 0.9, by - bh * 1.25, bx + bw, by - bh * 0.1); ctx.bezierCurveTo(bx + bw * 1.02, by + bh * 1.0, bx - bw * 0.6, by + bh * 1.2, bx - bw, by); ctx.closePath(); };
    bagPath(); ctx.fillStyle = '#1f4a30'; ctx.fill();
    ctx.save(); bagPath(); ctx.clip();
    // tartan: wide green and navy bands, a red over-check, thin yellow and white lines, woven twill hatching
    const tw = bw * 0.36;
    for (let k = -6; k < 12; k++) { const x = bx - bw + k * tw * 0.5; const navy = (k % 4 + 4) % 4 < 1.5; ctx.fillStyle = navy ? 'rgba(18,30,78,0.82)' : 'rgba(28,98,56,0.45)'; ctx.fillRect(x, by - bh * 1.5, tw * 0.5, bh * 3); }
    for (let k = -6; k < 12; k++) { const y = by - bh * 1.5 + k * tw * 0.42; const navy = (k % 4 + 4) % 4 < 1.5; ctx.fillStyle = navy ? 'rgba(18,30,78,0.55)' : 'rgba(10,50,26,0.3)'; ctx.fillRect(bx - bw * 1.2, y, bw * 2.4, tw * 0.42); }
    ctx.fillStyle = 'rgba(190,34,38,0.8)'; for (let k = -3; k < 7; k++) { ctx.fillRect(bx - bw + k * tw * 1.0 + tw * 0.2, by - bh * 1.5, 3, bh * 3); ctx.fillRect(bx - bw * 1.2, by - bh * 1.5 + k * tw * 0.84 + tw * 0.2, bw * 2.4, 3); }
    ctx.fillStyle = 'rgba(240,210,90,0.75)'; for (let k = -3; k < 7; k++) { ctx.fillRect(bx - bw + k * tw * 1.0 + tw * 0.62, by - bh * 1.5, 1.6, bh * 3); ctx.fillRect(bx - bw * 1.2, by - bh * 1.5 + k * tw * 0.84 + tw * 0.62, bw * 2.4, 1.6); }
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1; for (let x = -bw * 1.2; x < bw * 1.4; x += 5) { ctx.beginPath(); ctx.moveTo(bx + x, by - bh * 1.3); ctx.lineTo(bx + x + bh * 0.9, by + bh * 1.3); ctx.stroke(); }
    // roundness: dark rim, soft light from the upper left, a crease where the arm presses
    ctx.fillStyle = rgrad(ctx, bx, by, Math.min(bw, bh) * 0.4, Math.max(bw, bh) * 1.1, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,10,5,0.62)']], bx - bw * 0.3, by - bh * 0.4); ctx.fillRect(bx - bw * 1.2, by - bh * 1.5, bw * 2.4, bh * 3);
    ctx.fillStyle = rgrad(ctx, bx - bw * 0.35, by - bh * 0.5, 0, bw * 0.8, [[0, 'rgba(255,255,230,0.3)'], [1, 'rgba(255,255,230,0)']]); ctx.fillRect(bx - bw * 1.2, by - bh * 1.5, bw * 2.4, bh * 3);
    if (sq > 0.03) { ctx.fillStyle = `rgba(0,10,5,${0.28 * sq})`; ell(ctx, bx - bw * 0.35, by + bh * 0.25, bw * 0.5, bh * 0.45); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = rgba('#07120b', 0.9); ctx.lineWidth = 3; bagPath(); ctx.stroke();
    // cords: a twisted red and gold cord around the neck of the bag, tied at the stocks, with tassels
    const cord = (x0, y0, x1, y1, bend) => { for (const [lw, col] of [[7, '#2a0a08'], [5, '#b02a2e'], [2, '#e8c860']]) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + bend, x1, y1); ctx.stroke(); } };
    cord(bx - bw * 0.78, by - bh * 0.35, bx + bw * 0.55, by - bh * 0.5, bh * 0.55);
    cord(bx - bw * 0.6, by - bh * 0.78, bx + bw * 0.08, by + bh * 0.1, -bh * 0.1);
    const tassel = (x, y, len, sway) => { ctx.strokeStyle = '#b02a2e'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + sway * 0.5, y + len * 0.4, x + sway, y + len * 0.7); ctx.stroke(); ctx.fillStyle = '#c8382c'; ell(ctx, x + sway, y + len * 0.72, 8, 8); ctx.fill(); ctx.strokeStyle = '#e8c860'; ctx.lineWidth = 2; for (let q = -3; q <= 3; q++) { ctx.beginPath(); ctx.moveTo(x + sway + q, y + len * 0.76); ctx.lineTo(x + sway + q * 3.5 + Math.sin(rt.anim * 2 + q) * 1.5, y + len * 1.05); ctx.stroke(); } };
    tassel(bx + bw * 0.55, by - bh * 0.5, 70, 14 + Math.sin(rt.anim * 1.4) * 3); tassel(bx - bw * 0.15, by + bh * 0.55, 62, -16 + Math.sin(rt.anim * 1.2) * 3);
    // blowpipe: bone mouthpiece, leather valve, held from the bag's upper left
    {
      const sx = bx - bw * 0.82, sy = by - bh * 0.18, ex = sx - bw * 0.34, ey = sy - bh * 0.9;
      tube(ctx, sx, sy, ex, ey, 10, 8, PIPE.black); band(ctx, sx, sy, ex, ey, 0.2, 14, 14, PIPE.ivory); band(ctx, sx, sy, ex, ey, 0.55, 11, 6, PIPE.silver);
      tube(ctx, ex, ey, ex - 12, ey - 40, 8, 6.5, '#efe3c4', { shadow: false });
      ctx.fillStyle = '#080606'; ell(ctx, ex - 12, ey - 40, 5, 3); ctx.fill();
    }
    ctx.restore();

    // ---- the squeezing forearm (comes in from the left, elbow tucked under the bag, the hand pressing on top) ------------------------------
    {
      const press = 0.3 + 0.7 * arm * (0.4 + 0.6 * sq), aw = clamp(bh * 0.22, 16, 30);
      const ex0 = bx - bw * 2.7, ey0 = by + bh * 1.5, ex1 = bx - bw * 0.3, ey1 = by + bh * 0.28 - 7 * press;
      ctx.save();
      sleeve(ctx, ex0, ey0, ex1, ey1, aw, '#2f4a3a');
      band(ctx, ex0, ey0, ex1, ey1, 0.87, aw * 0.9, 14, '#efe9db');
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, ex1 + 24, ey1 + 8, 32, 19); ctx.fill();
      ctx.fillStyle = rgrad(ctx, ex1 + 24, ey1, 2, 34, [[0, lighter(SKIN, 0.3)], [0.6, SKIN], [1, darker(SKIN, 0.4)]], ex1 + 16, ey1 - 8); ell(ctx, ex1 + 22, ey1, 32, 19); ctx.fill();
      ctx.strokeStyle = 'rgba(100,50,20,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    }

    // ---- hands on the chanter: the upper hand (thumb and three fingers), the lower hand (four fingers) -------------------------------------
    const perTop = Math.min(nHoles, 4);
    const hands = [[0, perTop], [perTop, nHoles]];
    hands.forEach(([k0, k1], hi) => {
      if (k1 <= k0) return;
      const fw = Math.min(step * 0.62, cw * 0.98), uTop = G.holeAt(Math.max(k0, hi ? k0 : 1)) - fw * 0.6, uBot = G.holeAt(k1 - 1) + fw * 0.6, open = 1 - (fing.slice(k0, k1).reduce((a, b) => a + b, 0) / (k1 - k0));
      const px = cv + cw * 0.5 + 70 + open * 12;
      // sleeve toward the edge, cuff, then the back of the hand: the sleeve ends inside the frame (it is only as long as the room allows)
      const sl = clamp(W / 2 - 8 - (px + 70), 26, F.landscape ? 64 : 150), su0 = uTop - 16 + (uBot - uTop) * 0.1, sh = (uBot - uTop + 32) * 0.8;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, px + 8, su0 + 8, sl + 70, sh, 24); ctx.fill();
      ctx.fillStyle = vgrad(ctx, su0, su0 + sh, [[0, lighter('#2a3a5e', 0.3)], [0.5, '#2a3a5e'], [1, darker('#2a3a5e', 0.5)]]); rrect(ctx, px + 70, su0, sl, sh, 24); ctx.fill();
      ctx.fillStyle = '#efe9db'; rrect(ctx, px + 50, uTop - 12, 28, uBot - uTop + 24, 10); ctx.fill();
      ctx.fillStyle = vgrad(ctx, uTop - fw * 0.4, uBot + fw * 0.4, [[0, lighter(SKIN, 0.35)], [0.5, SKIN], [1, darker(SKIN, 0.4)]]); rrect(ctx, px - 6, uTop - fw * 0.3, 64, uBot - uTop + fw * 0.6, fw * 0.5); ctx.fill();
      ctx.strokeStyle = 'rgba(100,50,20,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
    });
    for (let k = 0; k < nHoles; k++) {
      const u = G.holeAt(k), c = fing[k], fw = Math.min(step * 0.62, cw * 0.98), len = 82, thumb = k === 0 && nHoles >= 8;
      if (thumb) {   // the thumb comes round the back: a pad on the left edge of the chanter
        ctx.save(); ctx.globalAlpha = 0.4 + 0.6 * c;
        const x1 = cv - cwHalf * 0.9 - (1 - c) * 20;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, x1 + 3, u + 5, fw * 0.55, fw * 0.5); ctx.fill();
        ctx.fillStyle = rgrad(ctx, x1, u, 0, fw * 0.6, [[0, lighter(SKIN, 0.4)], [1, darker(SKIN, 0.35)]], x1 - 3, u - 3); ell(ctx, x1, u, fw * 0.52, fw * 0.46); ctx.fill();
        ctx.strokeStyle = 'rgba(100,50,20,0.45)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
        continue;
      }
      const x1 = cv + 5 + (1 - c) * (cw * 0.5 + 36), y = u - (1 - c) * 6;
      ctx.save(); ctx.globalAlpha = 0.5 + 0.5 * c;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, x1 + 6, y - fw / 2 + 8, len, fw, fw / 2); ctx.fill();
      ctx.fillStyle = vgrad(ctx, y - fw / 2, y + fw / 2, [[0, lighter(SKIN, 0.4)], [0.5, SKIN], [1, darker(SKIN, 0.35)]]); rrect(ctx, x1, y - fw / 2, len, fw, fw / 2); ctx.fill();
      ctx.strokeStyle = 'rgba(100,50,20,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.strokeStyle = 'rgba(100,50,20,0.3)'; for (const q of [0.4, 0.68]) { ctx.beginPath(); ctx.moveTo(x1 + len * q, y - fw * 0.3); ctx.lineTo(x1 + len * q, y + fw * 0.3); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,230,210,0.5)'; rrect(ctx, x1 + 3, y - fw * 0.25, fw * 0.5, fw * 0.5, fw * 0.2); ctx.fill();
      ctx.restore();
    }

    // ---- cues: a bead of breath leaves the bag stock and runs down the chanter to the hole; a frame closes on the note ------------------
    for (let k = rt.list.length - 1; k >= 0; k--) {
      const t = rt.list[k];
      if (t.state && t.state !== 'pending' && t.state !== 'miss') continue;
      const tau = (t.t - rt.clock) / rt.look;
      if (tau > 1.0 || tau < -0.25) continue;
      const sp = spots[t.lane], l = lanes[t.lane], miss = t.state === 'miss';
      const a = (rt.soft ? 0.5 : 1) * (miss ? 0.35 : 1) * clamp((1.05 - tau) * 8, 0, 1) * clamp((tau + 0.25) * 6, 0, 1);
      const col = miss ? mix(l.color, '#555555', 0.6) : l.color, p = clamp(1 - tau, 0, 1.05);
      const x = lerp(cv, cv, p), y = lerp(topC, sp.u, p);
      ctx.save(); ctx.globalAlpha = a * 0.55; ctx.strokeStyle = rgba(col, 0.9); ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cv, topC); ctx.lineTo(x, y); ctx.stroke(); ctx.restore();
      glow(ctx, x, y, 38 + 28 * p, col, 0.4 * a);
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = rgba(lighter(col, 0.6), 0.95); circ(ctx, x, y, 11 + 4 * p); ctx.fill(); ctx.strokeStyle = rgba(col, 1); ctx.lineWidth = 3; ctx.stroke();
      const sc = 1 + 0.9 * clamp(tau, 0, 1), hx = cv + 5;
      ctx.strokeStyle = rgba(lighter(col, 0.45), 0.9); ctx.lineWidth = 2.5; rrect(ctx, hx - 34 * sc, sp.u - 17 * sc, 68 * sc, 34 * sc, 17 * sc); ctx.stroke(); ctx.restore();
    }
    lanes.forEach((l, i) => {
      const sp = spots[i], f = rt.flash[i];
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 4; rrect(ctx, cv - 31, sp.u - 17 + 2, 64, 34, 17); ctx.stroke();
      ctx.strokeStyle = rgba(lighter(l.color, 0.4), 0.6 + 0.4 * f); ctx.lineWidth = 2.5; rrect(ctx, cv - 32, sp.u - 17, 64, 34, 17); ctx.stroke();
      // a dotted lead from the name on the left to its hole
      ctx.strokeStyle = rgba(l.color, 0.5); ctx.lineWidth = 2; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(cv - cw * 0.5 - 14, sp.u); ctx.lineTo(cv - 34, sp.u); ctx.stroke(); ctx.setLineDash([]);
    });
    ctx.restore();
    const size = g.px(15);
    lanes.forEach((l, i) => { const sp = spots[i], [x, y] = F.map(cv - cw * 0.5 - 14 - 44, sp.u); pill(ctx, l.name, x, y, 86, size, l.color, rt.flash[i]); });
    void W; void grain; void hash; void hgrad; void TAU;
  };
  return st;
}

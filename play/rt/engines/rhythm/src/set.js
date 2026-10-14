// Stage dressing for the non-string instruments: the surface the instrument stands on (planks, woven rugs and mats, packed earth,
// night asphalt, silk cloth, tile), lit by one warm key light from the upper left with a pool under the instrument and a soft vignette.
// Pure drawing in screen space; deterministic (hash-based), no clocks except the time handed in.
import { clamp, mix, rgba, lighter, darker, hash, rrect, ell, circ, TAU, vgrad, hgrad, rgrad, glow } from './art.js';

// elliptical light pool (screen space)
export function pool(ctx, cx, cy, rx, ry, col, a) {
  if (a <= 0.005) return;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(0.55, rgba(col, a * 0.4)); g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g; ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
  ctx.restore();
}

export function vignette(ctx, A, a = 0.55) {
  const { x, y, w, h } = A;
  ctx.fillStyle = rgrad(ctx, x + w / 2, y + h / 2, Math.min(w, h) * 0.3, Math.max(w, h) * 0.75, [[0, 'rgba(0,0,0,0)'], [1, `rgba(0,0,0,${a})`]]);
  ctx.fillRect(x, y, w, h);
}

// wooden boards running across the area, each a slightly different tone, with grain, staggered joints, seams and nails
export function planks(ctx, A, base, o = {}) {
  const { x, y, w, h } = A, ph = o.plank ?? clamp(h / 10, 44, 92), seed = o.seed ?? 3, vertical = !!o.vertical;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (vertical) { ctx.translate(x, y + h); ctx.rotate(-Math.PI / 2); A = { x: 0, y: 0, w: h, h: w }; }
  const ax = vertical ? 0 : x, ay = vertical ? 0 : y, aw = vertical ? h : w, ah = vertical ? w : h;
  const rows = Math.ceil(ah / ph) + 1;
  for (let r = 0; r < rows; r++) {
    const py = ay + r * ph, t = (hash(r * 3.17 + seed) - 0.5) * 0.3, c = t > 0 ? lighter(base, t) : darker(base, -t);
    ctx.fillStyle = vgrad(ctx, py, py + ph, [[0, lighter(c, 0.1)], [0.35, c], [1, darker(c, 0.22)]]);
    ctx.fillRect(ax, py, aw, ph);
    // grain: long flowing strokes
    ctx.lineWidth = 1;
    for (let k = 0; k < 5; k++) {
      const yy = py + ph * (0.12 + 0.18 * k + 0.08 * hash(r * 9 + k + seed));
      ctx.strokeStyle = rgba(darker(c, 0.6), 0.16 + 0.2 * hash(r * 5 + k * 3 + seed));
      ctx.beginPath(); ctx.moveTo(ax, yy);
      for (let xx = ax; xx < ax + aw; xx += 140) ctx.quadraticCurveTo(xx + 70, yy + (hash(xx * 0.13 + r + k) - 0.5) * 7, xx + 140, yy + (hash(xx * 0.07 + k) - 0.5) * 3);
      ctx.stroke();
    }
    // knots
    if (hash(r * 11.3 + seed) > 0.55) {
      const kx = ax + hash(r * 2.2 + seed) * aw, ky = py + ph * 0.5;
      ctx.strokeStyle = rgba(darker(c, 0.7), 0.35); ctx.lineWidth = 1.5; ell(ctx, kx, ky, 11, 5.5); ctx.stroke(); ell(ctx, kx, ky, 5, 2.5); ctx.stroke();
    }
    // staggered butt joints
    const pl = 260 + hash(r + seed) * 160; let jx = ax + hash(r * 7.7 + seed) * pl;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; for (; jx < ax + aw; jx += pl) { ctx.fillRect(jx, py, 2, ph); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(jx + 2, py, 1, ph); ctx.fillStyle = 'rgba(0,0,0,0.5)'; }
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(ax, py + ph - 2, aw, 2);
    ctx.fillStyle = 'rgba(255,240,200,0.09)'; ctx.fillRect(ax, py, aw, 1.5);
  }
  ctx.restore();
  void A;
}

// woven rug: shadow, fringe, border bands, a patterned field and a faint weave; motif diamond | zigzag | kente | stripes
export function rug(ctx, x, y, w, h, o = {}) {
  const base = o.base ?? '#7a2a22', a = o.a ?? '#e3b778', b = o.b ?? '#1f1a40', motif = o.motif ?? 'diamond', r = o.r ?? 10;
  const u = Math.min(w, h), bd = clamp(u * 0.075, 10, 34);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, x + 7, y + 11, w, h, r); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; rrect(ctx, x + 14, y + 20, w, h, r + 4); ctx.fill();
  if (o.fringe !== false) { // fringe on the two short ends
    ctx.strokeStyle = rgba('#efe0b8', 0.9); ctx.lineWidth = 2;
    const horiz = w >= h;
    for (let k = 0; k <= (horiz ? h : w); k += 6) {
      ctx.beginPath();
      if (horiz) { ctx.moveTo(x, y + k); ctx.lineTo(x - 13, y + k + 1); ctx.moveTo(x + w, y + k); ctx.lineTo(x + w + 13, y + k + 1); }
      else { ctx.moveTo(x + k, y); ctx.lineTo(x + k + 1, y - 13); ctx.moveTo(x + k, y + h); ctx.lineTo(x + k + 1, y + h + 13); }
      ctx.stroke();
    }
  }
  rrect(ctx, x, y, w, h, r); ctx.clip();
  ctx.fillStyle = vgrad(ctx, y, y + h, [[0, lighter(base, 0.1)], [1, darker(base, 0.25)]]); ctx.fillRect(x, y, w, h);
  // border bands
  const bandDiamonds = (yy, hh, col, vertical) => {
    const s = hh * 0.9;
    ctx.fillStyle = rgba(col, 0.9);
    const len = vertical ? h : w;
    for (let p = s; p < len - s; p += s * 1.7) {
      const cx = vertical ? x + yy + hh / 2 : x + p, cy = vertical ? y + p : y + yy + hh / 2;
      ctx.beginPath(); ctx.moveTo(cx, cy - s / 2); ctx.lineTo(cx + s / 2, cy); ctx.lineTo(cx, cy + s / 2); ctx.lineTo(cx - s / 2, cy); ctx.closePath(); ctx.fill();
    }
  };
  ctx.fillStyle = darker(base, 0.35);
  ctx.fillRect(x, y, w, bd); ctx.fillRect(x, y + h - bd, w, bd); ctx.fillRect(x, y, bd, h); ctx.fillRect(x + w - bd, y, bd, h);
  ctx.fillStyle = rgba(a, 0.95);
  for (const q of [bd * 0.14, bd * 0.86]) { ctx.fillRect(x, y + q - 1, w, 2); ctx.fillRect(x, y + h - q - 1, w, 2); ctx.fillRect(x + q - 1, y, 2, h); ctx.fillRect(x + w - q - 1, y, 2, h); }
  bandDiamonds(bd * 0.3, bd * 0.4, a, false); bandDiamonds(h - bd * 0.7, bd * 0.4, a, false);
  // field
  const fx = x + bd * 1.25, fy = y + bd * 1.25, fw = w - bd * 2.5, fh = h - bd * 2.5;
  ctx.save(); ctx.beginPath(); ctx.rect(fx, fy, fw, fh); ctx.clip();
  const s = clamp(u * 0.11, 22, 60);
  if (motif === 'kente') { // vertical woven strips of colour with small blocks
    const cols = [a, b, mix(base, '#ffffff', 0.25), mix(a, base, 0.5)];
    let k = 0;
    for (let px = fx; px < fx + fw; px += s * 0.55, k++) {
      ctx.fillStyle = rgba(cols[k % cols.length], k % 3 === 0 ? 0.55 : 0.28); ctx.fillRect(px, fy, s * 0.55 - 2, fh);
      ctx.fillStyle = rgba(cols[(k + 1) % cols.length], 0.55);
      for (let py = fy + hash(k) * s; py < fy + fh; py += s * 1.3) ctx.fillRect(px + 2, py, s * 0.55 - 6, s * 0.28);
    }
  } else if (motif === 'zigzag') {
    for (let row = 0, py = fy + s * 0.5; py < fy + fh; row++, py += s * 0.8) {
      ctx.strokeStyle = rgba(row % 2 ? a : b, 0.7); ctx.lineWidth = Math.max(2, s * 0.14);
      ctx.beginPath();
      for (let px = fx - s; px < fx + fw + s; px += s * 0.5) ctx.lineTo(px, py + ((Math.round((px - fx) / (s * 0.5)) % 2) ? -s * 0.22 : s * 0.22));
      ctx.stroke();
    }
  } else if (motif === 'stripes') {
    for (let py = fy, k = 0; py < fy + fh; py += s * 0.5, k++) { ctx.fillStyle = rgba(k % 3 === 0 ? a : k % 3 === 1 ? b : darker(base, 0.2), 0.45); ctx.fillRect(fx, py, fw, s * 0.34); }
  } else { // diamond lattice with a medallion
    for (let gy = 0; gy * s * 0.6 < fh + s; gy++) for (let gx = 0; gx * s * 0.6 < fw + s; gx++) {
      if ((gx + gy) % 2) continue;
      const cx = fx + gx * s * 0.6, cy = fy + gy * s * 0.6;
      ctx.fillStyle = rgba((gx + gy) % 4 ? a : b, 0.33); ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.3); ctx.lineTo(cx + s * 0.3, cy); ctx.lineTo(cx, cy + s * 0.3); ctx.lineTo(cx - s * 0.3, cy); ctx.closePath(); ctx.fill();
    }
    const mx = fx + fw / 2, my = fy + fh / 2, mr = Math.min(fw, fh) * 0.38;
    ctx.strokeStyle = rgba(a, 0.8); ctx.lineWidth = 3; ctx.fillStyle = rgba(b, 0.45);
    ctx.beginPath(); ctx.moveTo(mx, my - mr); ctx.lineTo(mx + mr * 1.2, my); ctx.lineTo(mx, my + mr); ctx.lineTo(mx - mr * 1.2, my); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
  // weave texture and light
  ctx.fillStyle = 'rgba(0,0,0,0.07)'; for (let py = y; py < y + h; py += 3) ctx.fillRect(x, py, w, 1);
  ctx.fillStyle = 'rgba(255,240,210,0.04)'; for (let px = x; px < x + w; px += 4) ctx.fillRect(px, y, 1, h);
  ctx.fillStyle = rgrad(ctx, x + w * 0.3, y + h * 0.25, 0, Math.max(w, h) * 0.9, [[0, 'rgba(255,235,190,0.16)'], [1, 'rgba(0,0,0,0.28)']]); ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,230,180,0.35)'; ctx.lineWidth = 1.5; rrect(ctx, x, y, w, h, r); ctx.stroke();
}

// packed earth: warm gradient, speckle, pebbles with contact shadows, hairline cracks, scuffs
export function earth(ctx, A, base, o = {}) {
  const { x, y, w, h } = A, seed = o.seed ?? 5;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = rgrad(ctx, x + w * 0.5, y + h * 0.45, Math.min(w, h) * 0.1, Math.max(w, h) * 0.85, [[0, lighter(base, 0.14)], [0.6, base], [1, darker(base, 0.5)]]); ctx.fillRect(x, y, w, h);
  for (const [col, a, pred] of [[darker(base, 0.6), 0.2, (k) => hash(k + 3) > 0.5], [lighter(base, 0.5), 0.16, (k) => hash(k + 3) <= 0.5]]) {   // speckle: two batched paths
    ctx.fillStyle = rgba(col, a); ctx.beginPath();
    for (let k = 0; k < 140; k++) { if (!pred(k)) continue; const px = x + hash(k + seed) * w, py = y + hash(k * 1.7 + seed + 20) * h, r = 0.7 + 1.8 * hash(k + 40); ctx.moveTo(px + r, py); ctx.arc(px, py, r, 0, TAU); }
    ctx.fill();
  }
  for (let k = 0; k < 24; k++) { // scuffs
    const px = x + hash(k * 4 + seed + 5) * w, py = y + hash(k * 6 + seed + 8) * h;
    ctx.fillStyle = rgba(darker(base, 0.6), 0.08); ell(ctx, px, py, 30 + 50 * hash(k), 8 + 14 * hash(k + 1)); ctx.fill();
  }
  ctx.strokeStyle = rgba(darker(base, 0.7), 0.3); ctx.lineWidth = 1.2;
  for (let k = 0; k < 7; k++) { let px = x + hash(k + 70 + seed) * w, py = y + hash(k + 90 + seed) * h; ctx.beginPath(); ctx.moveTo(px, py); for (let j = 0; j < 5; j++) { px += (hash(k * 5 + j) - 0.4) * 30; py += (hash(k * 7 + j) - 0.3) * 24; ctx.lineTo(px, py); } ctx.stroke(); }
  for (let k = 0; k < 20; k++) { // pebbles
    const px = x + hash(k + 111 + seed) * w, py = y + hash(k + 150 + seed) * h, pr = 3 + 6 * hash(k + 9);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, px + 2, py + 2.5, pr, pr * 0.8); ctx.fill();
    ctx.fillStyle = rgrad(ctx, px, py, 0, pr, [[0, lighter(base, 0.45)], [1, darker(base, 0.2)]], px - pr * 0.3, py - pr * 0.3); ell(ctx, px, py, pr, pr * 0.8); ctx.fill();
  }
  ctx.restore();
}

// night asphalt with painted lines and a string of bulbs (steelpan yard)
export function asphalt(ctx, A, base, o = {}, t = 0) {
  const { x, y, w, h } = A;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = vgrad(ctx, y, y + h, [[0, darker(base, 0.2)], [0.5, base], [1, darker(base, 0.45)]]); ctx.fillRect(x, y, w, h);
  for (const [col, pred] of [['rgba(255,255,255,0.07)', (k) => hash(k) > 0.5], ['rgba(0,0,0,0.09)', (k) => hash(k) <= 0.5]]) {
    ctx.fillStyle = col; ctx.beginPath();
    for (let k = 0; k < 200; k++) { if (!pred(k)) continue; const px = x + hash(k + 1) * w, py = y + hash(k + 2) * h, r = 0.6 + 1.2 * hash(k + 4); ctx.moveTo(px + r, py); ctx.arc(px, py, r, 0, TAU); }
    ctx.fill();
  }
  ctx.strokeStyle = rgba('#e8d8a0', 0.18); ctx.lineWidth = 5; ctx.setLineDash([36, 28]); ctx.beginPath(); ctx.moveTo(x - 10, y + h * 0.9); ctx.lineTo(x + w + 10, y + h * 0.84); ctx.stroke(); ctx.setLineDash([]);
  // string lights with bokeh
  const cols = ['#ffb347', '#ff6f91', '#7fe0ff', '#ffe66d'];
  ctx.strokeStyle = 'rgba(10,10,12,0.9)'; ctx.lineWidth = 2; ctx.beginPath();
  const n = 9; for (let k = 0; k <= n; k++) { const px = x + (w * k) / n, py = y + 18 + Math.sin((k / n) * Math.PI) * 26; if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
  ctx.stroke();
  for (let k = 0; k <= n; k++) {
    const px = x + (w * k) / n, py = y + 18 + Math.sin((k / n) * Math.PI) * 26, c = cols[k % cols.length], tw = 0.7 + 0.3 * Math.sin(t * 2 + k * 1.7);
    glow(ctx, px, py + 8, 40, c, 0.32 * tw);
    ctx.fillStyle = lighter(c, 0.5); circ(ctx, px, py + 7, 4); ctx.fill();
  }
  ctx.restore();
  void o;
}

// draped silk or cotton cloth: soft vertical folds, woven stripes, a hem
export function cloth(ctx, A, base, accent, o = {}) {
  const { x, y, w, h } = A, fold = o.fold ?? 54, seed = o.seed ?? 2;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = vgrad(ctx, y, y + h, [[0, lighter(base, 0.08)], [1, darker(base, 0.35)]]); ctx.fillRect(x, y, w, h);
  for (let px = x - fold, k = 0; px < x + w + fold; px += fold, k++) {
    const sh = 0.6 + 0.4 * hash(k + seed);
    ctx.fillStyle = hgrad(ctx, px, px + fold, [[0, 'rgba(0,0,0,0.0)'], [0.45, `rgba(255,245,220,${0.1 * sh})`], [0.75, 'rgba(0,0,0,0.0)'], [1, `rgba(0,0,0,${0.18 * sh})`]]);
    ctx.fillRect(px, y, fold, h);
  }
  // woven stripes
  for (let py = y + 30; py < y + h; py += 64) { ctx.fillStyle = rgba(accent, 0.28); ctx.fillRect(x, py, w, 6); ctx.fillStyle = rgba(accent, 0.14); ctx.fillRect(x, py + 10, w, 2); }
  ctx.fillStyle = 'rgba(0,0,0,0.05)'; for (let py = y; py < y + h; py += 3) ctx.fillRect(x, py, w, 1);
  ctx.restore();
}

// glazed courtyard tiles (dabke) laid on the diagonal
export function tiles(ctx, A, base, accent, o = {}) {
  const { x, y, w, h } = A, s = o.size ?? clamp(Math.min(w, h) / 6, 54, 120);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = darker(base, 0.5); ctx.fillRect(x, y, w, h);
  for (let gy = 0; gy * s < h + s; gy++) for (let gx = 0; gx * s < w + s; gx++) {
    const px = x + gx * s, py = y + gy * s, alt = (gx + gy) % 2 === 0, c = alt ? base : mix(base, accent, 0.5);
    ctx.fillStyle = vgrad(ctx, py, py + s, [[0, lighter(c, 0.14)], [1, darker(c, 0.18)]]); ctx.fillRect(px + 1.5, py + 1.5, s - 3, s - 3);
    ctx.strokeStyle = rgba('#ffffff', 0.12); ctx.lineWidth = 1; ctx.strokeRect(px + 2.5, py + 2.5, s - 5, s - 5);
    ctx.fillStyle = rgba(alt ? accent : base, 0.35); // star
    ctx.beginPath(); for (let q = 0; q < 8; q++) { const a = (q / 8) * TAU + Math.PI / 8, rr = q % 2 ? s * 0.12 : s * 0.26; ctx.lineTo(px + s / 2 + Math.cos(a) * rr, py + s / 2 + Math.sin(a) * rr); } ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

// meadow with a mown ring (maypole / kolo green)
export function meadow(ctx, A, base, o = {}) {
  const { x, y, w, h } = A, seed = o.seed ?? 8;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = rgrad(ctx, x + w / 2, y + h * 0.5, 10, Math.max(w, h) * 0.8, [[0, lighter(base, 0.18)], [0.6, base], [1, darker(base, 0.5)]]); ctx.fillRect(x, y, w, h);
  for (const [col, pred] of [[lighter(base, 0.4), (k) => hash(k + 5) > 0.5], [darker(base, 0.5), (k) => hash(k + 5) <= 0.5]]) {   // blades of grass: two batched paths
    ctx.strokeStyle = rgba(col, 0.35); ctx.lineWidth = 1; ctx.beginPath();
    for (let k = 0; k < 420; k++) { if (!pred(k)) continue; const px = x + hash(k + seed) * w, py = y + hash(k * 1.3 + seed + 7) * h, l = 4 + 7 * hash(k + 3); ctx.moveTo(px, py); ctx.lineTo(px + (hash(k + 11) - 0.5) * 4, py - l); }
    ctx.stroke();
  }
  ctx.restore();
}

// the dressing dispatcher. F is the stage frame (F.area is the playable area); kind picks the surface
export function setting(ctx, F, kind, S, rt, o = {}) {
  const A0 = F.area, A = A0.bleed ? { ...A0, h: A0.h + A0.bleed } : A0, t = rt?.anim ?? 0, pul = rt?.pul ?? 0;
  const bb = o.bbox ?? instrumentBox(F);
  const cx = (bb.x0 + bb.x1) / 2, cy = (bb.y0 + bb.y1) / 2, bw = bb.x1 - bb.x0, bh = bb.y1 - bb.y0;
  ctx.save();
  ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
  switch (kind) {
    case 'planks': planks(ctx, A, o.base ?? S.floor ?? '#6a4a2c', { seed: o.seed }); break;
    case 'pub': planks(ctx, A, o.base ?? '#5a3a20', { plank: clamp(A.h / 12, 40, 80), seed: 11 }); break;
    case 'earth': earth(ctx, A, o.base ?? '#7a5836', { seed: o.seed }); break;
    case 'asphalt': asphalt(ctx, A, o.base ?? '#232830', o, t); break;
    case 'cloth': cloth(ctx, A, o.base ?? '#2e5f4a', o.accent ?? '#e8d089', o); break;
    case 'tiles': tiles(ctx, A, o.base ?? '#2e5c70', o.accent ?? '#d9b45a', o); break;
    case 'meadow': meadow(ctx, A, o.base ?? '#3f6a34', o); break;
    case 'stone': tiles(ctx, A, o.base ?? '#5a5750', o.accent ?? '#7a766c', { size: o.size ?? 96 }); break;
    default: planks(ctx, A, o.base ?? '#5a3a20', { seed: 4 });
  }
  if (o.rug !== false && o.rugKind) {
    const m = o.rugPad ?? 0.12, rw = bw * (1 + 2 * m) + 40, rh = bh * (1 + 2 * m * (o.rugTall ?? 0.7)) + 30;
    rug(ctx, cx - rw / 2, cy - rh / 2, rw, rh, { base: o.rugBase, a: o.rugA, b: o.rugB, motif: o.rugKind, fringe: o.fringe });
  }
  // lamp pool under the instrument, pulsing very lightly with the beat, and a vignette to keep the edges calm
  pool(ctx, cx - bw * 0.05, cy - bh * 0.1, Math.max(bw, bh) * 0.85, Math.max(bw, bh) * 0.6, o.light ?? '#ffd9a0', 0.22 + 0.06 * pul);
  if (A.w > A.h * 1.2) { // wide screens: two more lamps off to the sides keep the empty floor lit and give the room a width
    const lc = o.light ?? '#ffd9a0';
    pool(ctx, A.x + A.w * 0.1, A.y + A.h * 0.5, A.h * 0.62, A.h * 0.5, lc, 0.12 + 0.03 * pul);
    pool(ctx, A.x + A.w * 0.9, A.y + A.h * 0.5, A.h * 0.62, A.h * 0.5, lc, 0.12 + 0.03 * pul);
  }
  vignette(ctx, A, o.vig ?? 0.5);
  ctx.restore();
}

// screen-space bounds of the instrument's design box (works with tilt and rotation)
export function instrumentBox(F) {
  const pts = [[-F.W / 2, 0], [F.W / 2, 0], [-F.W / 2, F.H], [F.W / 2, F.H]].map(([v, u]) => F.map(v, u));
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

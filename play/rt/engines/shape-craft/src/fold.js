// fold: paper folding as a sequence of fold operations on a square sheet, matched to a target silhouette.
import { clipHalf, inConvex, polyArea, normIoU, starsFor, hash } from './geom.js';
import { tint, litEdge, rrect, rgba, mix, shadowed, shelf, ease } from './fx.js';

const S2 = Math.SQRT1_2;
// Each op: the points with a*x+b*y+c < 0 move (they are reflected over the line a*x+b*y+c = 0); the others stay.
export const OPS = {
  'v-l': { name: 'Right half over left', m: [-1, 0, 0.5] },
  'v-r': { name: 'Left half over right', m: [1, 0, -0.5] },
  'h-t': { name: 'Bottom half up', m: [0, -1, 0.5] },
  'h-b': { name: 'Top half down', m: [0, 1, -0.5] },
  'd-tr': { name: 'Top-right corner over the diagonal', m: [-S2, S2, 0] },
  'd-bl': { name: 'Bottom-left corner over the diagonal', m: [S2, -S2, 0] },
  'a-tl': { name: 'Top-left corner over the diagonal', m: [S2, S2, -S2] },
  'a-br': { name: 'Bottom-right corner over the diagonal', m: [-S2, -S2, S2] },
  'q-l': { name: 'Left edge to the centre', m: [1, 0, -0.25] },
  'q-r': { name: 'Right edge to the centre', m: [-1, 0, 0.75] },
  'q-t': { name: 'Top edge to the centre', m: [0, 1, -0.25] },
  'q-b': { name: 'Bottom edge to the centre', m: [0, -1, 0.75] },
};
export const OP_IDS = Object.keys(OPS);
export const FOLD_DEFAULTS = { ops: ['v-l', 'h-t', 'd-tr', 'a-br'], folds: 3, paper: '#d8453b', front: '#f6f1e6', tolerance: 0.03, guide: true, maxExtra: 1 };

const unit = [[0, 0], [1, 0], [1, 1], [0, 1]];
const reflect = ([a, b, c], p) => { const d = a * p[0] + b * p[1] + c; return [p[0] - 2 * d * a, p[1] - 2 * d * b]; };
export function applyOp(layers, id) {
  const [a, b, c] = OPS[id].m, stay = [a, b, c], move = [-a, -b, -c];
  const keep = [], moved = [];
  for (const L of layers) {
    const s = clipHalf(L.pts, stay);
    if (s.length >= 3 && polyArea(s) > 1e-7) keep.push({ pts: s, back: L.back });
    const m = clipHalf(L.pts, move);
    if (m.length >= 3 && polyArea(m) > 1e-7) moved.push({ pts: m.map((p) => reflect([a, b, c], p)).reverse(), back: !L.back });
  }
  return [...keep, ...moved.reverse()];
}
const GRID = 40;
export function raster(layers) {
  const out = new Array(GRID * GRID).fill(0);
  for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) {
    const x = (c + 0.5) / GRID, y = (r + 0.5) / GRID;
    for (const L of layers) if (inConvex(L.pts, x, y)) { out[r * GRID + c] = 1; break; }
  }
  return out;
}
const sameRaster = (a, b) => a.every((v, i) => v === b[i]);

export function createFold(P, env) {
  const { rng, audio, fx } = env;
  let flight = null, creaseAt = -9, creaseOp = null, clock = 0;
  let layers, history, targetLayers, targetSeq, targetMask, done, rects = null, geo = null, acc = 0, anim = 0;
  const fresh = () => [{ pts: unit.map((p) => p.slice()), back: false }];
  const maxFolds = () => targetSeq.length + P.maxExtra;

  const makeTarget = () => {
    let cur = fresh(), mask = raster(cur), seq = [];
    for (let s = 0; s < P.folds; s++) {
      const cand = rng.shuffle(P.ops);
      let ok = false;
      for (const id of cand) {
        const next = applyOp(cur, id), m = raster(next);
        if (sameRaster(m, mask)) continue;
        cur = next; mask = m; seq.push(id); ok = true; break;
      }
      if (!ok) break;
    }
    targetLayers = cur; targetSeq = seq; targetMask = mask;
  };
  const init = () => { makeTarget(); layers = fresh(); history = []; done = null; acc = 0; anim = 0; };
  init();

  const mask = () => raster(layers);
  const score = () => normIoU(mask(), targetMask, P.tolerance);
  const finish = () => {
    const r = score(), stars = starsFor(r.score);
    done = { score: r.score, max: 100, stars, headline: stars === 3 ? 'Crisp folds' : stars ? 'Nearly there' : 'Unfold and try again', detail: `${history.length} folds made; the target needs ${targetSeq.length}` };
  };
  const canFold = () => history.length < maxFolds();
  const fold = (id) => {
    if (!canFold()) return;
    const next = applyOp(layers, id);
    flight = { before: layers, id, t0: clock, dur: 0.42 };
    creaseOp = id; creaseAt = clock;
    history.push({ layers, id }); layers = next; anim = 0.35;
    audio?.tone({ freq: 300, to: 220, dur: 0.1, type: 'triangle', vol: 0.2 });
  };

  const items = () => {
    const out = P.ops.map((id) => ({ id: `fold:${id}`, kind: 'fold', op: id, off: !canFold(), title: OPS[id].name }));
    out.push({ id: 'undo', kind: 'btn', label: 'Undo', off: !history.length });
    out.push({ id: 'reset', kind: 'btn', label: 'Unfold' });
    out.push({ id: 'check', kind: 'btn', label: 'Check', primary: true });
    return out;
  };
  const control = (id) => {
    if (done) return;
    if (id.startsWith('fold:')) fold(id.slice(5));
    else if (id === 'undo') { const h = history.pop(); if (h) { layers = h.layers; flight = null; creaseOp = null; } }
    else if (id === 'reset') { history = []; layers = fresh(); flight = null; creaseOp = null; }
    else if (id === 'check') finish();
  };

  const poly = (ctx, pts, ox, oy, s) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(ox + p[0] * s, oy + p[1] * s) : ctx.moveTo(ox + p[0] * s, oy + p[1] * s))); ctx.closePath(); };
  // One layer of paper: its face colour with a faint sheen, soft shadow to the layer below, lit upper edges.
  const sheet = (ctx, L, ox, oy, s, depth, flat, squash = 1) => {
    const col = L.back ? P.paper : P.front;
    if (!flat) { ctx.save(); ctx.translate(1.5 + depth * 0.9, 2.5 + depth * 1.2); poly(ctx, L.pts, ox, oy, s); ctx.fillStyle = `rgba(0,0,0,${0.22 * squash})`; ctx.fill(); ctx.restore(); }
    poly(ctx, L.pts, ox, oy, s);
    const xs = L.pts.map((p) => ox + p[0] * s), ys = L.pts.map((p) => oy + p[1] * s);
    const g = ctx.createLinearGradient(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys));
    g.addColorStop(0, tint(col, 0.1)); g.addColorStop(0.55, col); g.addColorStop(1, tint(col, -0.12));
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); poly(ctx, L.pts, ox, oy, s); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let k = 0; k < 14; k++) { const yy = oy + hash(k, 1, 9) * s, xx = ox + hash(k, 2, 9) * s; ctx.moveTo(xx, yy); ctx.lineTo(xx + s * 0.08 * (hash(k, 3, 9) + 0.3), yy + 1.5); }
    ctx.stroke();
    ctx.restore();
    poly(ctx, L.pts, ox, oy, s); ctx.strokeStyle = L.back ? tint(P.paper, -0.4) : 'rgba(50,40,30,0.5)'; ctx.lineWidth = 1.4; ctx.stroke();
  };
  const paint = (ctx, ls, ox, oy, s, flat) => { ls.forEach((L, i) => sheet(ctx, L, ox, oy, s, i, flat)); };
  // A fold in flight: the moving half turns about the crease; its width shrinks as cos(theta), then shows the other face.
  const paintFlight = (ctx, fl, ox, oy, s, u) => {
    const [a, b, c] = OPS[fl.id].m, stay = [a, b, c], move = [-a, -b, -c], th = u * Math.PI, ck = Math.cos(th);
    const keep = [], moved = [];
    for (const L of fl.before) {
      const st = clipHalf(L.pts, stay); if (st.length >= 3 && polyArea(st) > 1e-7) keep.push({ pts: st, back: L.back });
      const mv = clipHalf(L.pts, move);
      if (mv.length >= 3 && polyArea(mv) > 1e-7) {
        // vertex p at signed distance d (negative on the moving side) lands at p + d*n*(cos(theta) - 1)
        const pts = mv.map((p) => { const d = a * p[0] + b * p[1] + c; return [p[0] + d * a * (ck - 1), p[1] + d * b * (ck - 1)]; });
        moved.push({ pts, back: ck < 0 ? !L.back : L.back });
      }
    }
    keep.forEach((L, i) => sheet(ctx, L, ox, oy, s, i, false));
    moved.reverse().forEach((L, i) => sheet(ctx, L, ox, oy, s, keep.length + i + Math.sin(th) * 3, false, 0.6 + Math.sin(th) * 0.8));
  };

  const draw = (g, R, t) => {
    const { ctx, pal } = g;
    rects = R; clock = t;
    const W = R.work, s = Math.min(W.w, W.h) * 0.74, ox = W.x + (W.w - s) / 2, oy = W.y + (W.h - s) / 2 + 14;
    geo = { ox, oy, s };
    // original sheet outline and candidate crease lines
    ctx.setLineDash([5, 6]); ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1.5; ctx.strokeRect(ox, oy, s, s);
    ctx.beginPath();
    ctx.moveTo(ox + s / 2, oy); ctx.lineTo(ox + s / 2, oy + s); ctx.moveTo(ox, oy + s / 2); ctx.lineTo(ox + s, oy + s / 2);
    ctx.moveTo(ox, oy); ctx.lineTo(ox + s, oy + s); ctx.moveTo(ox + s, oy); ctx.lineTo(ox, oy + s);
    ctx.stroke(); ctx.setLineDash([]);
    const u = flight ? (t - flight.t0) / flight.dur : 2;
    if (flight && u < 1) {
      // while in flight the whole stack is lifted a touch (soft shadow grows)
      paintFlight(ctx, flight, ox, oy, s, ease(u));
      if (!flight.puffed && u > 0.9) { flight.puffed = true; if (fx) fx.emit('dust', ox + s * 0.5, oy + s * 0.5, { count: 4, color: '#ffffff', size: s * 0.03, speed: 70, life: 0.45, gravity: -10 }); }
    } else {
      paint(ctx, layers, ox, oy, s, false);
      // a freshly pressed crease: a pale and a dark line along the fold, fading
      if (creaseOp && t - creaseAt < 1.6) {
        const [a, b, c] = OPS[creaseOp].m, k = 1 - (t - creaseAt) / 1.6;
        ctx.save(); ctx.beginPath(); layers.forEach((L) => { L.pts.forEach((p, i) => (i ? ctx.lineTo(ox + p[0] * s, oy + p[1] * s) : ctx.moveTo(ox + p[0] * s, oy + p[1] * s))); ctx.closePath(); }); ctx.clip();
        const px = -a * c, py = -b * c, tx = -b, ty = a;
        ctx.beginPath(); ctx.moveTo(ox + (px - tx * 2) * s, oy + (py - ty * 2) * s); ctx.lineTo(ox + (px + tx * 2) * s, oy + (py + ty * 2) * s);
        ctx.strokeStyle = `rgba(0,0,0,${0.3 * k})`; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.translate(-a * 2, -b * 2); ctx.strokeStyle = `rgba(255,255,255,${0.5 * k})`; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
      }
    }
    if (P.guide) paintTargetOutline(ctx, ox, oy, s, pal.accent, t);
    // reference
    const th = R.thumb, ts = Math.min(th.w, th.h) * 0.72, tx0 = th.x + (th.w - ts) / 2, ty0 = th.y + (th.h - ts) / 2 - th.h * 0.04;
    shelf(ctx, th.x + th.w / 2, ty0 + ts + 6, th.w * 0.34);
    paint(ctx, targetLayers, tx0, ty0, ts, false);
    g.label(ctx, `Folds made: ${history.length} of about ${targetSeq.length}`, W.x + W.w / 2, W.y + 26, g.px(24), pal.dim, 'center', '500');
  };
  const titleArt = (g, S, t) => {
    const { ctx } = g;
    let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
    for (const L of targetLayers) for (const p of L.pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
    const bw = Math.max(0.05, x1 - x0), bh = Math.max(0.05, y1 - y0), s = Math.min((S.w * 0.7) / bw, (S.h * 0.7) / bh);
    ctx.save(); ctx.translate(S.x + S.w / 2, S.y + S.h / 2); ctx.rotate(-0.07 + Math.sin(t * 0.7) * 0.01); ctx.translate(-((x0 + x1) / 2) * s, -((y0 + y1) / 2) * s);
    paint(ctx, targetLayers, 0, 0, s, false);
    ctx.restore();
  };
  const paintTargetOutline = (ctx, ox, oy, s, color, t) => {
    for (const L of targetLayers) { poly(ctx, L.pts, ox, oy, s); litEdge(ctx, color, 2.2, t); }
  };

  const attract = (dt) => {
    if (done) return;
    acc += dt;
    if (acc < 1.1) return; acc = 0;
    if (history.length < targetSeq.length) fold(targetSeq[history.length]); else finish();
  };

  return {
    init, items, control, work: () => {}, draw, attract, titleArt, surface: 'mat', surfaceTint: '#3a5a4a', result: () => done,
    score: () => score().score,
    info: () => [`Folds needed: about ${targetSeq.length}`, `Allowed: ${maxFolds()}`],
    caption: 'Fold the paper into this shape',
    hint() {
      if (history.length < targetSeq.length && history.every((h, i) => h.id === targetSeq[i])) return `Next: ${OPS[targetSeq[history.length]].name}.`;
      if (history.length >= targetSeq.length && score().score >= 99) return 'The shape matches: press Check.';
      return 'The folds so far lead somewhere else: press Undo and compare with the target.';
    },
    rules: () => ['Each fold button folds the paper along a fixed crease; the folded layers stay where they land. Order matters.', 'Score: how closely the folded silhouette overlaps the target, beyond the plain square sheet.'],
    point(id) { return null; },
    state: () => ({ technique: 'fold', folds: history.map((h) => h.id), targetSeq, maxFolds: maxFolds(), layers: layers.length }),
  };
}

// Icon for a fold button (square with crease line and an arrow over the moving part).
export function drawFoldIcon(ctx, op, x, y, s, color) {
  const o = OPS[op], [a, b, c] = o.m, pad = s * 0.18, k = s - pad * 2, ox = x + pad, oy = y + pad;
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(ox, oy, k, k);
  const mv = clipHalf(unit, [-a, -b, -c]);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); mv.forEach((p, i) => (i ? ctx.lineTo(ox + p[0] * k, oy + p[1] * k) : ctx.moveTo(ox + p[0] * k, oy + p[1] * k))); ctx.closePath(); ctx.fill();
  // crease
  const d = a * 0 + b * 0 + c; const n = [a, b]; const px = -n[0] * c, py = -n[1] * c; const tx = -n[1], ty = n[0];
  ctx.save(); ctx.beginPath(); ctx.rect(ox, oy, k, k); ctx.clip();
  ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(ox + (px - tx * 2) * k, oy + (py - ty * 2) * k); ctx.lineTo(ox + (px + tx * 2) * k, oy + (py + ty * 2) * k); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
  void d;
  const cen = mv.reduce((q, p) => [q[0] + p[0] / mv.length, q[1] + p[1] / mv.length], [0, 0]);
  const dst = reflect([a, b, c], cen);
  ctx.strokeStyle = '#f2c14e'; ctx.fillStyle = '#f2c14e'; ctx.lineWidth = 2.5;
  const ax = ox + cen[0] * k, ay = oy + cen[1] * k, bx = ox + dst[0] * k, by = oy + dst[1] * k;
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  const ang = Math.atan2(by - ay, bx - ax);
  ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - 8 * Math.cos(ang - 0.5), by - 8 * Math.sin(ang - 0.5)); ctx.lineTo(bx - 8 * Math.cos(ang + 0.5), by - 8 * Math.sin(ang + 0.5)); ctx.closePath(); ctx.fill();
}

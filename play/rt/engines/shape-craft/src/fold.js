// fold: paper folding as a sequence of fold operations on a square sheet, matched to a target silhouette.
import { clipHalf, inConvex, polyArea, normIoU, starsFor, shade } from './geom.js';

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
  const { rng, audio } = env;
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
    else if (id === 'undo') { const h = history.pop(); if (h) layers = h.layers; }
    else if (id === 'reset') { history = []; layers = fresh(); }
    else if (id === 'check') finish();
  };

  const poly = (ctx, pts, ox, oy, s) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(ox + p[0] * s, oy + p[1] * s) : ctx.moveTo(ox + p[0] * s, oy + p[1] * s))); ctx.closePath(); };
  const paint = (ctx, ls, ox, oy, s, flat) => {
    ls.forEach((L, i) => {
      if (!flat) { ctx.save(); ctx.translate(2 + i * 0.5, 3); poly(ctx, L.pts, ox, oy, s); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fill(); ctx.restore(); }
      poly(ctx, L.pts, ox, oy, s);
      ctx.fillStyle = L.back ? P.paper : P.front; ctx.fill();
      ctx.strokeStyle = L.back ? shade(P.paper, -0.35) : 'rgba(60,50,40,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
    });
  };

  const draw = (g, R, t) => {
    const { ctx, pal } = g;
    rects = R;
    const W = R.work, s = Math.min(W.w, W.h) * 0.8, ox = W.x + (W.w - s) / 2, oy = W.y + (W.h - s) / 2 + 8;
    geo = { ox, oy, s };
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; g.rr(ctx, ox - 14, oy - 14, s + 28, s + 28, 14); ctx.fill();
    // original sheet outline and candidate crease lines
    ctx.setLineDash([5, 6]); ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.5; ctx.strokeRect(ox, oy, s, s);
    ctx.beginPath();
    ctx.moveTo(ox + s / 2, oy); ctx.lineTo(ox + s / 2, oy + s); ctx.moveTo(ox, oy + s / 2); ctx.lineTo(ox + s, oy + s / 2);
    ctx.moveTo(ox, oy); ctx.lineTo(ox + s, oy + s); ctx.moveTo(ox + s, oy); ctx.lineTo(ox, oy + s);
    ctx.stroke(); ctx.setLineDash([]);
    paint(ctx, layers, ox, oy, s, false);
    if (P.guide) paintTargetOutline(ctx, ox, oy, s, pal.accent);
    // thumbnail
    const th = R.thumb, ts = Math.min(th.w, th.h) * 0.86, tx = th.x + (th.w - ts) / 2, ty = th.y + (th.h - ts) / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; g.rr(ctx, th.x, th.y, th.w, th.h, 12); ctx.fill();
    paint(ctx, targetLayers, tx, ty, ts, false);
    g.label(ctx, `Folds made: ${history.length} of about ${targetSeq.length}`, W.x + W.w / 2, W.y + 12, g.px(18), pal.dim, 'center', '500');
  };
  const paintTargetOutline = (ctx, ox, oy, s, color) => {
    ctx.setLineDash([8, 6]); ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    for (const L of targetLayers) { poly(ctx, L.pts, ox, oy, s); ctx.stroke(); }
    ctx.setLineDash([]);
  };

  const attract = (dt) => {
    if (done) return;
    acc += dt;
    if (acc < 0.9) return; acc = 0;
    if (history.length < targetSeq.length) fold(targetSeq[history.length]); else finish();
  };

  return {
    init, items, control, work: () => {}, draw, attract, result: () => done,
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

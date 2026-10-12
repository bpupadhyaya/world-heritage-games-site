// carve: remove cells from a block to reveal a figure (subtractive), or cut (snip a folded sheet; symmetric partners go too).
import { clamp, hash, shade, rasterFigure, orbit, normIoU, starsFor } from './geom.js';

export const CARVE_DEFAULTS = { mode: 'figure', figure: 'elephant', cols: 16, rows: 16, material: 'stone', color: '#8a8f86', cavity: '#14181d', symmetry: 'none', snips: 7, tolerance: 0.06, guide: true, chisels: 2, variation: 1 };

export function createCarve(P, env) {
  const { rng, audio } = env;
  const { cols, rows } = P, total = cols * rows, cut = P.mode === 'cut';
  let kept, target, undo, done, geo = null, rects = null, tool = 1, drag = false, last = null, strokeRestore = false, acc = 0;
  const at = (c, r) => r * cols + c;

  const makeTarget = () => {
    if (!cut) {
      const j = [0, 1, 2, 3].map(() => (rng.next() * 2 - 1) * P.variation);
      return rasterFigure(P.figure, cols, rows, j);
    }
    const holes = new Array(total).fill(0);
    const stamps = [[[0, 0]], [[0, 0]], [[0, 0], [1, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 0], [0, 1]], [[0, 0], [1, 1]], [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]];
    const sym = P.symmetry;
    for (let k = 0; k < P.snips; k++) {
      const st = stamps[rng.int(stamps.length)], bx = 1 + rng.int(cols - 2), by = 1 + rng.int(rows - 2);
      for (const [dx, dy] of st) {
        const c = bx + dx, r = by + dy;
        if (c < 1 || r < 1 || c >= cols - 1 || r >= rows - 1) continue;
        for (const [x, y] of orbit(sym, c, r, cols, rows)) holes[at(x, y)] = 1;
      }
    }
    if (!holes.some((h) => h)) holes[at(Math.floor(cols / 2), Math.floor(rows / 2))] = 1;
    return holes.map((h) => (h ? 0 : 1));
  };
  const init = () => { target = makeTarget(); kept = new Array(total).fill(1); undo = []; done = null; tool = 1; drag = false; last = null; acc = 0; };
  init();

  const score = () => normIoU(kept, target, P.tolerance);
  const finish = () => {
    const r = score(), stars = starsFor(r.score);
    const wrong = kept.reduce((n, k, i) => n + (k !== target[i] ? 1 : 0), 0);
    done = { score: r.score, max: 100, stars, headline: stars === 3 ? (cut ? 'A clean cut-out' : 'A fine carving') : stars ? 'Well shaped' : 'Keep chipping', detail: wrong ? `${wrong} cells differ from the design` : 'Every cell matches the design' };
  };

  const items = () => {
    const out = [];
    if (!cut && P.chisels > 1) out.push({ id: 'tool', kind: 'btn', label: tool === 1 ? 'Chisel: fine' : 'Chisel: broad' });
    out.push({ id: 'undo', kind: 'btn', label: 'Undo', off: !undo.length });
    out.push({ id: 'reset', kind: 'btn', label: 'Reset' });
    out.push({ id: 'check', kind: 'btn', label: 'Check', primary: true });
    return out;
  };
  const control = (id) => {
    if (done) return;
    if (id === 'undo') { const u = undo.pop(); if (u) kept = u; }
    else if (id === 'reset') { undo.push(kept.slice()); kept = new Array(total).fill(1); }
    else if (id === 'tool') tool = tool === 1 ? 2 : 1;
    else if (id === 'check') finish();
  };

  const cellAt = (p) => { const c = Math.floor((p.x - geo.x) / geo.cs), r = Math.floor((p.y - geo.y) / geo.cs); return c >= 0 && r >= 0 && c < cols && r < rows ? [c, r] : null; };
  const strike = (c, r, remove = true) => {
    const sz = cut ? 1 : tool; let changed = false;
    for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) {
      const cc = c + dx, rr = r + dy;
      if (cc >= cols || rr >= rows) continue;
      for (const [x, y] of orbit(cut ? P.symmetry : 'none', cc, rr, cols, rows)) { const v = remove ? 0 : 1; if (kept[at(x, y)] !== v) { kept[at(x, y)] = v; changed = true; } }
    }
    if (changed) audio?.tone({ freq: 180 + hash(c, r) * 120, dur: 0.035, type: 'square', vol: 0.12 });
  };
  const work = (p) => {
    if (!geo || done) return;
    if (p.pressed) {
      const cell = cellAt(p);
      if (cell) { undo.push(kept.slice()); drag = true; last = { x: p.x, y: p.y }; strokeRestore = cut && !kept[at(cell[0], cell[1])]; strike(cell[0], cell[1], !strokeRestore); }
      if (p.released && !p.down) drag = false;
      return;
    }
    if (drag && p.down && last) {
      const d = Math.hypot(p.x - last.x, p.y - last.y), n = Math.max(1, Math.ceil(d / (geo.cs * 0.5)));
      for (let s = 1; s <= n; s++) { const cell = cellAt({ x: last.x + ((p.x - last.x) * s) / n, y: last.y + ((p.y - last.y) * s) / n }); if (cell) strike(cell[0], cell[1], !strokeRestore); }
      last = { x: p.x, y: p.y };
    }
    if (!p.down) drag = false;
  };

  const cellColor = (c, r) => {
    const h = hash(c, r), k = P.material;
    let f = 0;
    if (k === 'wood') f = 0.11 * Math.sin(r * 1.25 + hash(c, 0, 5) * 1.4 + c * 0.12) + (h - 0.5) * 0.05;
    else if (k === 'stone') f = (h - 0.5) * 0.14 + (h > 0.93 ? -0.16 : 0);
    else if (k === 'metal') f = 0.17 * Math.sin((c + r) * 0.55) + (h - 0.5) * 0.05;
    else if (k === 'candy') f = (h - 0.5) * 0.07 + (h > 0.9 ? 0.12 : 0);
    else if (k === 'clay') f = (h - 0.5) * 0.1;
    else f = (h - 0.5) * 0.03;
    return shade(P.color, f);
  };
  const drawBlock = (ctx, mask, x, y, cs, { detail, fillCavity }) => {
    if (fillCavity) { ctx.fillStyle = P.cavity; ctx.fillRect(x, y, cs * cols, cs * rows); }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (!mask[at(c, r)]) continue;
      const px = x + c * cs, py = y + r * cs;
      ctx.fillStyle = cellColor(c, r); ctx.fillRect(px, py, cs + 0.6, cs + 0.6);
      if (!detail) continue;
      const open = (cc, rr) => cc < 0 || rr < 0 || cc >= cols || rr >= rows || !mask[at(cc, rr)];
      const e = Math.max(1.5, cs * 0.1);
      if (open(c, r - 1)) { ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(px, py, cs, e); }
      if (open(c - 1, r)) { ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(px, py, e, cs); }
      if (open(c + 1, r)) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(px + cs - e, py, e, cs); }
      if (open(c, r + 1)) { ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fillRect(px, py + cs - e, cs, e); }
    }
  };

  const draw = (g, R, t) => {
    const { ctx, pal } = g;
    rects = R;
    const W0 = R.work, W = { x: W0.x, y: W0.y + 26, w: W0.w, h: W0.h - 26 }, cs = Math.max(4, Math.floor(Math.min((W.w - 12) / cols, (W.h - 12) / rows)));
    const bx = Math.round(W.x + (W.w - cs * cols) / 2), by = Math.round(W.y + (W.h - cs * rows) / 2);
    geo = { x: bx, y: by, cs };
    ctx.fillStyle = cut ? '#101419' : P.cavity; ctx.fillRect(bx - 6, by - 6, cs * cols + 12, cs * rows + 12);
    drawBlock(ctx, kept, bx, by, cs, { detail: true, fillCavity: true });
    if (cut) {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 1.5;
      if (/mirror|rot/.test(P.symmetry)) { ctx.beginPath(); ctx.moveTo(bx + (cs * cols) / 2, by); ctx.lineTo(bx + (cs * cols) / 2, by + cs * rows); ctx.stroke(); }
      if (/mirror-xy|rot4/.test(P.symmetry)) { ctx.beginPath(); ctx.moveTo(bx, by + (cs * rows) / 2); ctx.lineTo(bx + cs * cols, by + (cs * rows) / 2); ctx.stroke(); }
      ctx.setLineDash([]);
    }
    if (P.guide) {
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const i = at(c, r);
        if (!kept[i] && target[i]) { ctx.fillStyle = 'rgba(224,96,58,0.45)'; ctx.fillRect(bx + c * cs, by + r * cs, cs, cs); }
      }
      ctx.strokeStyle = pal.accent; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const here = target[at(c, r)];
        const diff = (cc, rr) => (cc < 0 || rr < 0 || cc >= cols || rr >= rows ? 0 : target[at(cc, rr)]) !== here;
        const x0 = bx + c * cs, y0 = by + r * cs;
        if (diff(c + 1, r)) { ctx.moveTo(x0 + cs, y0); ctx.lineTo(x0 + cs, y0 + cs); }
        if (diff(c, r + 1)) { ctx.moveTo(x0, y0 + cs); ctx.lineTo(x0 + cs, y0 + cs); }
        if (c === 0 && here) { ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + cs); }
        if (r === 0 && here) { ctx.moveTo(x0, y0); ctx.lineTo(x0 + cs, y0); }
      }
      ctx.stroke();
    }
    // thumbnail
    const th = R.thumb, tcs = Math.max(2, Math.floor(Math.min(th.w / cols, th.h / rows))), tx = th.x + (th.w - tcs * cols) / 2, ty = th.y + (th.h - tcs * rows) / 2;
    drawBlock(ctx, target, tx, ty, tcs, { detail: false, fillCavity: true });
    ctx.strokeStyle = pal.dim; ctx.lineWidth = 2; ctx.strokeRect(tx, ty, tcs * cols, tcs * rows);
    g.label(ctx, cut ? 'Tap cells to snip: partners on the fold are cut too' : P.guide ? 'Remove what lies outside the gold outline' : 'Remove everything that is not the figure', W0.x + W0.w / 2, W0.y + 12, g.px(18), pal.dim, 'center', '500');
  };

  const attract = (dt) => {
    if (done) return;
    acc += dt;
    if (acc < 0.06) return; acc = 0;
    for (let i = 0; i < total; i++) if (kept[i] && !target[i]) { const c = i % cols, r = Math.floor(i / cols); for (const [x, y] of orbit(cut ? P.symmetry : 'none', c, r, cols, rows)) if (!target[at(x, y)]) kept[at(x, y)] = 0; return; }
    for (let i = 0; i < total; i++) if (!kept[i] && target[i]) { kept[i] = 1; return; }
    finish();
  };

  return {
    init, items, control, work, draw, attract, result: () => done,
    score: () => score().score,
    info: () => [`Block: ${cols} by ${rows}`, cut ? `Fold: ${P.symmetry}` : (P.chisels > 1 ? 'Chisels: fine and broad' : 'One chisel')],
    caption: cut ? 'Cut this design' : 'Carve this figure',
    hint() {
      const c = target.findIndex((v, i) => kept[i] && !v);
      if (c >= 0) return `Remove the cell in column ${(c % cols) + 1}, row ${Math.floor(c / cols) + 1}.`;
      const d = target.findIndex((v, i) => !kept[i] && v);
      if (d >= 0) return 'You cut too deep: press Undo to bring a cell back.';
      return 'The shape matches: press Check.';
    },
    rules: () => [cut ? `The sheet is folded with ${P.symmetry} symmetry: every snip is repeated on its mirrored partners. Tap a cut cell again to mend it.` : 'Cells you remove cannot be put back except with Undo.', 'Score: overlap with the target, measured beyond the plain block. Cutting into the figure costs as much as leaving extra material.'],
    point(id) {
      if (!geo) return null;
      if (id.startsWith('cell:')) { const [c, r] = id.slice(5).split(',').map(Number); return { x: geo.x + (c + 0.5) * geo.cs, y: geo.y + (r + 0.5) * geo.cs }; }
      return null;
    },
    state: () => ({ technique: cut ? 'cut' : 'carve', cols, rows, kept, target, tool, symmetry: P.symmetry }),
  };
}

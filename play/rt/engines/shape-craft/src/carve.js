// carve: remove cells from a block to reveal a figure (subtractive), or cut (snip a folded sheet; symmetric partners go too).
import { clamp, hash, rasterFigure, orbit, normIoU, starsFor } from './geom.js';
import { tint, litEdge, rrect, rgba, mix, shadowed, shelf, lum } from './fx.js';

export const CARVE_DEFAULTS = { mode: 'figure', figure: 'elephant', cols: 16, rows: 16, material: 'stone', color: '#8a8f86', cavity: '#14181d', symmetry: 'none', snips: 7, tolerance: 0.06, guide: true, chisels: 2, variation: 1 };

export function createCarve(P, env) {
  const { rng, audio, fx } = env;
  let flashes = [], lastPtr = null;
  const { cols, rows } = P, total = cols * rows, cut = P.mode === 'cut';
  let kept, target, undo, done, geo = null, rects = null, tool = 1, drag = false, last = null, strokeRestore = false, acc = 0, clock = 0;
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
    if (changed) {
      audio?.tone({ freq: 150 + hash(c, r) * 90, to: 90, dur: 0.05, type: 'triangle', vol: 0.14 });
      audio?.tone({ freq: 1500 + hash(c, r, 2) * 900, dur: 0.02, type: 'square', vol: 0.025 });
      if (geo && fx) {
        const col = cut ? P.color : cellColor(c, r), x = geo.x + (c + 0.5 * sz) * geo.cs, y = geo.y + (r + 0.5 * sz) * geo.cs;
        fx.emit(cut ? 'flake' : 'chip', x, y, { count: cut ? 3 : 5, color: col, size: Math.max(2.5, geo.cs * 0.2), speed: 150, life: 0.6, gravity: 620, spread: 3.6, angle: -1.2 });
        if (!cut) fx.emit('dust', x, y, { count: 2, color: tint(col, 0.2), size: Math.max(3, geo.cs * 0.3), speed: 40, life: 0.5, gravity: -20 });
        flashes.push({ c, r, t: clock, sz });
        if (flashes.length > 24) flashes.shift();
      }
    }
  };
  const work = (p) => {
    if (!geo || done) return;
    lastPtr = { x: p.x, y: p.y, down: p.down, t: clock };
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
    if (k === 'wood') f = 0.1 * Math.sin(r * 1.1 + Math.sin(c * 0.35) * 1.6) + (h - 0.5) * 0.05;
    else if (k === 'stone') f = (h - 0.5) * 0.05 + 0.03 * Math.sin(c * 0.45 + r * 0.3) + (h > 0.96 ? -0.1 : 0);
    else if (k === 'metal') f = 0.15 * Math.sin((c + r) * 0.55) + (h - 0.5) * 0.04;
    else if (k === 'candy') f = (h - 0.5) * 0.06 + (h > 0.9 ? 0.12 : 0);
    else if (k === 'clay') f = (h - 0.5) * 0.09;
    else f = (h - 0.5) * 0.03;
    return tint(P.color, f);
  };
  // One block drawn with form: cells with a texture of their material, bevelled cut edges and cast shadows into the cavity.
  const drawBlock = (ctx, mask, x, y, cs, { detail, fillCavity, t = 0 }) => {
    const k = P.material, W = cs * cols, Hh = cs * rows;
    if (fillCavity) {
      const cg = ctx.createLinearGradient(x, y, x + W, y + Hh); cg.addColorStop(0, tint(P.cavity, 0.12)); cg.addColorStop(1, tint(P.cavity, -0.25));
      ctx.fillStyle = cg; ctx.fillRect(x, y, W, Hh);
    }
    const open = (cc, rr) => cc < 0 || rr < 0 || cc >= cols || rr >= rows || !mask[at(cc, rr)];
    // shadows cast by raised material into the cavity (light from the upper left)
    if (detail) {
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (!mask[at(c, r)]) continue;
        const px = x + c * cs, py = y + r * cs, d = Math.max(2, cs * 0.34);
        if (c + 1 < cols && !mask[at(c + 1, r)]) ctx.fillRect(px + cs, py + d * 0.5, d, cs);
        if (r + 1 < rows && !mask[at(c, r + 1)]) ctx.fillRect(px + d * 0.5, py + cs, cs, d);
        if (c + 1 < cols && r + 1 < rows && !mask[at(c + 1, r + 1)] && !open(c + 1, r) === false) ctx.fillRect(px + cs, py + cs, d, d);
      }
    }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (!mask[at(c, r)]) continue;
      const px = x + c * cs, py = y + r * cs, base = cellColor(c, r);
      ctx.fillStyle = base; ctx.fillRect(px, py, cs + 0.6, cs + 0.6);
      if (!detail) continue;
      // material texture, continuous from cell to cell
      if (k === 'wood') {
        ctx.strokeStyle = 'rgba(60,30,10,0.22)'; ctx.lineWidth = Math.max(0.8, cs * 0.05); ctx.beginPath();
        for (let g2 = 0; g2 < 3; g2++) { const gy = py + cs * (0.2 + g2 * 0.3) + Math.sin((c + g2 * 1.7) * 0.5 + r * 0.8) * cs * 0.12; ctx.moveTo(px, gy); ctx.lineTo(px + cs, gy + Math.sin((c + 1 + g2 * 1.7) * 0.5 + r * 0.8) * cs * 0.12 - Math.sin((c + g2 * 1.7) * 0.5 + r * 0.8) * cs * 0.12 + 0.01); }
        ctx.stroke();
      } else if (k === 'stone') {
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; for (let q = 0; q < 2; q++) ctx.fillRect(px + hash(c, r, q + 20) * cs * 0.8, py + hash(c, r, q + 30) * cs * 0.8, Math.max(1, cs * 0.08), Math.max(1, cs * 0.08));
        ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(px + hash(c, r, 40) * cs * 0.8, py + hash(c, r, 41) * cs * 0.8, Math.max(1, cs * 0.1), Math.max(1, cs * 0.07));
        if (Math.sin(c * 0.6 + r * 0.9) > 0.93) { ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px, py + cs); ctx.lineTo(px + cs, py); ctx.stroke(); }
      } else if (k === 'metal') {
        ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(px, py + cs * (0.2 + hash(c, r, 5) * 0.2), cs, Math.max(1, cs * 0.06));
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(px, py + cs * (0.6 + hash(c, r, 6) * 0.2), cs, Math.max(1, cs * 0.05));
      } else if (k === 'candy') {
        ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(px + cs * 0.12, py + cs * 0.12, cs * 0.35, cs * 0.14);
        ctx.fillStyle = 'rgba(120,40,0,0.12)'; ctx.fillRect(px, py + cs * 0.7, cs, cs * 0.3);
      } else if (k === 'paper') {
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(px + hash(c, r, 60) * cs * 0.7, py + hash(c, r, 61) * cs * 0.7, cs * 0.3, Math.max(1, cs * 0.04));
      } else if (k === 'clay') {
        ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(px + hash(c, r, 70) * cs * 0.6, py + hash(c, r, 71) * cs * 0.6, cs * 0.3, cs * 0.18);
      }
      const e = Math.max(1.5, cs * 0.14);
      if (open(c, r - 1)) { const eg = ctx.createLinearGradient(0, py, 0, py + e); eg.addColorStop(0, 'rgba(255,255,255,0.5)'); eg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = eg; ctx.fillRect(px, py, cs, e); }
      if (open(c - 1, r)) { const eg = ctx.createLinearGradient(px, 0, px + e, 0); eg.addColorStop(0, 'rgba(255,255,255,0.32)'); eg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = eg; ctx.fillRect(px, py, e, cs); }
      if (open(c + 1, r)) { const eg = ctx.createLinearGradient(px + cs, 0, px + cs - e, 0); eg.addColorStop(0, 'rgba(0,0,0,0.45)'); eg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = eg; ctx.fillRect(px + cs - e, py, e, cs); }
      if (open(c, r + 1)) { const eg = ctx.createLinearGradient(0, py + cs, 0, py + cs - e); eg.addColorStop(0, 'rgba(0,0,0,0.55)'); eg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = eg; ctx.fillRect(px, py + cs - e, cs, e); }
    }
    if (detail) { // soft overall light: brighter top-left, falling off to the lower right
      const lg = ctx.createLinearGradient(x, y, x + W, y + Hh);
      lg.addColorStop(0, 'rgba(255,255,255,0.16)'); lg.addColorStop(0.5, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(0,0,0,0.22)');
      ctx.save(); ctx.beginPath();
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (mask[at(c, r)]) ctx.rect(x + c * cs, y + r * cs, cs, cs);
      ctx.clip(); ctx.fillStyle = lg; ctx.fillRect(x, y, W, Hh);
      if (k === 'metal' || k === 'candy') { const sw = ((t * 0.25) % 2) - 0.5, sg = ctx.createLinearGradient(x + W * sw, y, x + W * (sw + 0.25), y + Hh * 0.3); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.22)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sg; ctx.fillRect(x, y, W, Hh); }
      ctx.restore();
    }
  };

  const outlinePath = (ctx, bx, by, cs) => {
    ctx.beginPath();
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const here = target[at(c, r)];
      const diff = (cc, rr) => (cc < 0 || rr < 0 || cc >= cols || rr >= rows ? 0 : target[at(cc, rr)]) !== here;
      const x0 = bx + c * cs, y0 = by + r * cs;
      if (diff(c + 1, r)) { ctx.moveTo(x0 + cs, y0); ctx.lineTo(x0 + cs, y0 + cs); }
      if (diff(c, r + 1)) { ctx.moveTo(x0, y0 + cs); ctx.lineTo(x0 + cs, y0 + cs); }
      if (c === 0 && here) { ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + cs); }
      if (r === 0 && here) { ctx.moveTo(x0, y0); ctx.lineTo(x0 + cs, y0); }
    }
  };

  const drawChisel = (ctx, x, y, t) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.9 + Math.sin(t * 22) * 0.05);
    shadowed(ctx, () => {
      const bl = ctx.createLinearGradient(-6, 0, 6, 0); bl.addColorStop(0, '#9aa5b0'); bl.addColorStop(0.5, '#eef2f6'); bl.addColorStop(1, '#6f7a85');
      ctx.fillStyle = bl; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(7, 46); ctx.lineTo(-7, 46); ctx.closePath(); ctx.fill();
      const hg = ctx.createLinearGradient(-10, 0, 10, 0); hg.addColorStop(0, '#7a4a1e'); hg.addColorStop(0.45, '#d6a05a'); hg.addColorStop(1, '#5a3410');
      rrect(ctx, -9, 44, 18, 54, 8); ctx.fillStyle = hg; ctx.fill();
    }, { blur: 8, dx: 4, dy: 5, a: 0.5 });
    ctx.restore();
  };

  const draw = (g, R, t) => {
    const { ctx, pal } = g;
    rects = R; clock = t;
    const W0 = R.work, W = { x: W0.x, y: W0.y + 40, w: W0.w, h: W0.h - 40 }, cs = Math.max(4, Math.floor(Math.min((W.w - 24) / cols, (W.h - 24) / rows)));
    const bx = Math.round(W.x + (W.w - cs * cols) / 2), by = Math.round(W.y + (W.h - cs * rows) / 2);
    geo = { x: bx, y: by, cs };
    // the block sits on the bench with a body (a plinth edge below and to the right) and a soft shadow
    const dp = Math.max(4, cs * 0.5);
    shadowed(ctx, () => { ctx.fillStyle = cut ? '#0b0e12' : tint(P.color, -0.55); ctx.fillRect(bx - 4, by - 4, cs * cols + 8 + dp * 0.6, cs * rows + 8 + dp); }, { blur: 22, dy: 12, a: 0.55 });
    ctx.fillStyle = cut ? '#0b0e12' : tint(P.color, -0.5); ctx.fillRect(bx - 5, by - 5, cs * cols + 10, cs * rows + 10);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.5; ctx.strokeRect(bx - 4.5, by - 4.5, cs * cols + 9, cs * rows + 9);
    drawBlock(ctx, kept, bx, by, cs, { detail: true, fillCavity: true, t });
    // strike flashes
    flashes = flashes.filter((f) => t - f.t < 0.18);
    for (const f of flashes) { const a = 1 - (t - f.t) / 0.18; ctx.fillStyle = `rgba(255,248,220,${0.55 * a})`; ctx.fillRect(bx + f.c * cs, by + f.r * cs, cs * f.sz, cs * f.sz); }
    if (cut) {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 1.5;
      if (/mirror|rot/.test(P.symmetry)) { ctx.beginPath(); ctx.moveTo(bx + (cs * cols) / 2, by); ctx.lineTo(bx + (cs * cols) / 2, by + cs * rows); ctx.stroke(); }
      if (/mirror-xy|rot4/.test(P.symmetry)) { ctx.beginPath(); ctx.moveTo(bx, by + (cs * rows) / 2); ctx.lineTo(bx + cs * cols, by + (cs * rows) / 2); ctx.stroke(); }
      ctx.setLineDash([]);
    }
    if (P.guide) {
      ctx.fillStyle = 'rgba(224,96,58,0.5)';
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const i = at(c, r); if (!kept[i] && target[i]) ctx.fillRect(bx + c * cs, by + r * cs, cs, cs); }
      outlinePath(ctx, bx, by, cs); litEdge(ctx, pal.accent, Math.max(1.6, cs * 0.1), t);
    }
    // the working tool
    if (!done && lastPtr && lastPtr.down && t - lastPtr.t < 0.25) drawChisel(ctx, lastPtr.x, lastPtr.y, t);
    // the reference
    const th = R.thumb, tcs = Math.max(2, Math.floor(Math.min((th.w - 16) / cols, (th.h - 16) / rows))), tx = th.x + (th.w - tcs * cols) / 2, ty = th.y + (th.h - tcs * rows) / 2;
    shadowed(ctx, () => { ctx.fillStyle = '#000'; ctx.fillRect(tx, ty, tcs * cols, tcs * rows); }, { blur: 10, dy: 5, a: 0.5 });
    drawBlock(ctx, target, tx, ty, tcs, { detail: tcs >= 5, fillCavity: true, t });
    g.label(ctx, cut ? 'Tap cells to snip: partners on the fold are cut too' : P.guide ? 'Remove what lies outside the lit outline' : 'Remove everything that is not the figure', W0.x + W0.w / 2, W0.y + 26, g.px(24), pal.dim, 'center', '500');
  };

  const titleArt = (g, S, t) => {
    const { ctx } = g;
    const cs = Math.max(4, Math.floor(Math.min(S.w * 0.84 / cols, S.h * 0.84 / rows))), bx = S.x + (S.w - cs * cols) / 2, by = S.y + (S.h - cs * rows) / 2;
    if (cut) shadowed(ctx, () => { ctx.fillStyle = P.cavity; ctx.fillRect(bx, by, cs * cols, cs * rows); }, { blur: 28, dy: 16, a: 0.6 });
    else shadowed(ctx, () => {
      ctx.fillStyle = tint(P.color, -0.3); ctx.beginPath();
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (target[at(c, r)]) ctx.rect(bx + c * cs, by + r * cs, cs + 0.5, cs + 0.5);
      ctx.fill();
    }, { blur: 24, dy: 14, a: 0.6 });
    drawBlock(ctx, target, bx, by, cs, { detail: true, fillCavity: cut, t });
  };

  const attract = (dt) => {
    clock += 0;
    if (done) return;
    acc += dt;
    if (acc < 0.06) return; acc = 0;
    for (let i = 0; i < total; i++) if (kept[i] && !target[i]) {
      const c = i % cols, r = Math.floor(i / cols);
      for (const [x, y] of orbit(cut ? P.symmetry : 'none', c, r, cols, rows)) if (!target[at(x, y)]) { kept[at(x, y)] = 0; if (geo && fx) { const col = cut ? P.color : cellColor(x, y); fx.emit(cut ? 'flake' : 'chip', geo.x + (x + 0.5) * geo.cs, geo.y + (y + 0.5) * geo.cs, { count: 3, color: col, size: Math.max(2.5, geo.cs * 0.2), speed: 140, life: 0.55, gravity: 600, spread: 3.4, angle: -1.2 }); flashes.push({ c: x, r: y, t: clock, sz: 1 }); } }
      if (flashes.length > 24) flashes.splice(0, flashes.length - 24);
      audio?.tone({ freq: 150 + hash(c, r) * 90, to: 90, dur: 0.05, type: 'triangle', vol: 0.1 });
      return;
    }
    for (let i = 0; i < total; i++) if (!kept[i] && target[i]) { kept[i] = 1; return; }
    finish();
  };

  return {
    init, items, control, work, draw, attract, titleArt, surface: cut ? 'mat' : 'wood', surfaceTint: cut ? '#2f4a3a' : '#8a5f38', result: () => done,
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

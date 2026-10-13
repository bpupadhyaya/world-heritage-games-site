// carve: remove cells from a block to reveal a figure (subtractive), or cut (snip a folded sheet; symmetric partners go too).
import { clamp, hash, rasterFigure, orbit, normIoU, starsFor } from './geom.js';
import { tint, litEdge, rrect, rgba, mix, shadowed, shelf, lum } from './fx.js';
import { drawSeat, drawTool, wallLift } from './scenes.js';
import { contourLoops, tracePath } from './relief.js';

export const CARVE_DEFAULTS = { mode: 'figure', figure: 'elephant', cols: 16, rows: 16, material: 'stone', color: '#8a8f86', cavity: '#14181d', symmetry: 'none', snips: 7, tolerance: 0.06, guide: true, chisels: 2, variation: 1 };

export function createCarve(P, env) {
  const { rng, audio, fx, sound } = env;
  const SC = P.scene ?? {}, BK = SC.block ?? P.material, PM = SC.pitch ?? 1, WV = SC.wave ?? 'triangle';
  const FXK = SC.fx ?? { kind: P.mode === 'cut' ? 'flake' : 'chip', c: null };
  let flashes = [], lastPtr = null;
  const { cols, rows } = P, total = cols * rows, cut = P.mode === 'cut';
  let castAt = -1, kept, target, undo, done, geo = null, rects = null, tool = 1, drag = false, last = null, strokeRestore = false, acc = 0, clock = 0;
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
  const init = () => { castAt = -1; target = makeTarget(); kept = new Array(total).fill(1); undo = []; done = null; tool = 1; drag = false; last = null; acc = 0; };
  init();

  const score = () => normIoU(kept, target, P.tolerance);
  const finish = () => {
    const r = score(), stars = starsFor(r.score);
    if (SC.id === 'lostwax') { castAt = clock; sound?.cast(); }
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
      if (!remove) sound?.mend();
      else if (cut && SC.cavity === 'mirror') sound?.mirror(hash(c, r));
      else sound?.chip(hash(c, r), sz > 1);
      if (geo && fx) {
        const col = cut ? P.color : cellColor(c, r), x = geo.x + (c + 0.5 * sz) * geo.cs, y = geo.y + (r + 0.5 * sz) * geo.cs;
        const pc = FXK.c ?? col;
        if (FXK.kind === 'dust') { fx.emit('dust', x, y, { count: 5, color: pc, size: Math.max(3, geo.cs * 0.45), speed: 55, life: 0.8, gravity: -14 }); fx.emit('chip', x, y, { count: 2, color: col, size: Math.max(2, geo.cs * 0.14), speed: 120, life: 0.5, gravity: 620, spread: 3.2, angle: -1.2 }); }
        else { fx.emit(FXK.kind, x, y, { count: cut ? 3 : 5, color: pc, size: Math.max(2.5, geo.cs * 0.2), speed: 150, life: 0.6, gravity: FXK.kind === 'spark' ? 120 : 620, spread: 3.6, angle: -1.2 });
          if (!cut && FXK.kind === 'chip') fx.emit('dust', x, y, { count: 2, color: tint(col, 0.2), size: Math.max(3, geo.cs * 0.3), speed: 40, life: 0.5, gravity: -20 }); }
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
    const h = hash(c, r), k = BK === 'soapstone' ? 'stone' : BK;
    let f = 0;
    if (k === 'wax') f = (h - 0.5) * 0.03 + 0.07 * Math.sin(r * 0.45 + c * 0.2);
    else if (k === 'mud') f = (h - 0.5) * 0.14 + 0.05 * Math.sin(c * 1.3) * Math.cos(r * 1.1);
    else if (k === 'wood') f = 0.1 * Math.sin(r * 1.1 + Math.sin(c * 0.35) * 1.6) + (h - 0.5) * 0.05;
    else if (k === 'stone') f = (h - 0.5) * 0.05 + 0.03 * Math.sin(c * 0.45 + r * 0.3) + (h > 0.96 ? -0.1 : 0);
    else if (k === 'metal') f = 0.15 * Math.sin((c + r) * 0.55) + (h - 0.5) * 0.04;
    else if (k === 'candy') f = (h - 0.5) * 0.06 + (h > 0.9 ? 0.12 : 0);
    else if (k === 'clay') f = (h - 0.5) * 0.09;
    else f = (h - 0.5) * 0.03;
    return tint(P.color, f);
  };

  // The block as one smooth solid: rounded contour, material painted in block coordinates (so veins, grain and glints run on
  // across cells), a soft cast shadow into the cavity, inner light and shade that give it thickness.
  const drawSmooth = (ctx, mask, x, y, cs, { detail, t = 0, cast = 0 }) => {
    const loops = contourLoops(mask, cols, rows, { k: cs >= 9 ? 4 : 3 });
    if (!loops.length) return;
    const W = cs * cols, Hh = cs * rows, base = cast > 0 ? mix(P.color, '#7c4518', Math.min(1, cast)) : P.color;
    const path = () => { ctx.beginPath(); tracePath(ctx, loops, x, y, cs); };
    const ringFill = (fn) => { // paints the area OUTSIDE the shape; used for inner shadows (call inside a clip)
      ctx.beginPath(); ctx.rect(x - cs * 3, y - cs * 3, W + cs * 6, Hh + cs * 6); tracePath(ctx, loops, x, y, cs); fn();
    };
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, W, Hh); ctx.clip();
    if (detail) { // cast shadow into the cavity: a contact core and a long soft one
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = cs * 0.55; ctx.shadowOffsetX = cs * 0.12; ctx.shadowOffsetY = cs * 0.2; path(); ctx.fillStyle = tint(base, -0.6); ctx.fill('evenodd'); ctx.restore();
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = cs * 1.3; ctx.shadowOffsetX = cs * 0.45; ctx.shadowOffsetY = cs * 0.7; path(); ctx.fillStyle = tint(base, -0.6); ctx.fill('evenodd'); ctx.restore();
    }
    if (detail) { // the thickness of the slab: side wall seen below and to the right of the lit top face
      const steps = 6, dx = cs * 0.09, dy = cs * 0.13;
      for (let q = steps; q >= 1; q--) { ctx.save(); ctx.translate(dx * q, dy * q); path(); ctx.fillStyle = tint(base, -0.35 - 0.3 * (q / steps)); ctx.fill('evenodd'); ctx.restore(); }
    }
    const gb = ctx.createLinearGradient(x, y, x + W * 0.7, y + Hh);
    gb.addColorStop(0, tint(base, 0.14)); gb.addColorStop(0.55, base); gb.addColorStop(1, tint(base, -0.2));
    path(); ctx.fillStyle = gb; ctx.fill('evenodd');
    if (!detail) { ctx.restore(); return; }
    ctx.save(); path(); ctx.clip('evenodd');
    const R = (i, j = 0, s2 = 0) => hash(i, j, s2 + 300), u = (f) => x + f * W, v = (f) => y + f * Hh;
    const blot = (n, rmin, rmax, col, a) => {
      for (let q = 0; q < n; q++) {
        const px = u(R(q, 1)), py = v(R(q, 2)), rr = cs * (rmin + (rmax - rmin) * R(q, 3)), cc = typeof col === 'function' ? col(q) : col;
        const gr = ctx.createRadialGradient(px, py, 0, px, py, rr); gr.addColorStop(0, rgba(cc, a)); gr.addColorStop(1, rgba(cc, 0));
        ctx.fillStyle = gr; ctx.fillRect(px - rr, py - rr, rr * 2, rr * 2);
      }
    };
    const dots = (n, col, a, size) => { ctx.fillStyle = rgba(col, a); ctx.beginPath(); for (let q = 0; q < n; q++) { const sz = Math.max(0.8, cs * size * (0.5 + R(q, 5))); ctx.rect(u(R(q, 6)), v(R(q, 7)), sz, sz); } ctx.fill(); };
    const wander = (n, col, a, w, amp, ySpan = 1) => {
      ctx.lineCap = 'round'; ctx.strokeStyle = rgba(col, a); ctx.lineWidth = w;
      for (let q = 0; q < n; q++) {
        const x0 = u(R(q, 11) * 0.5 - 0.1), y0 = v(R(q, 12) * ySpan), L = W * (0.35 + R(q, 13) * 0.5);
        ctx.beginPath(); ctx.moveTo(x0, y0);
        ctx.bezierCurveTo(x0 + L * 0.3, y0 + (R(q, 14) - 0.5) * amp * cs, x0 + L * 0.65, y0 + (R(q, 15) - 0.5) * amp * cs, x0 + L, y0 + (R(q, 16) - 0.5) * amp * cs * 1.4);
        ctx.stroke();
      }
    };
    const k = cast > 0.5 ? 'metal' : BK === 'soapstone' ? 'stone' : BK;
    if (k === 'stone') {
      blot(11, 2.2, 4.8, (q) => (q % 3 === 0 ? '#9a4a56' : q % 3 === 1 ? '#5a5f78' : '#f6ece4'), 0.2);
      wander(7, '#6f3a3a', 0.2, Math.max(1, cs * 0.07), 6);
      wander(7, '#ffffff', 0.18, Math.max(0.8, cs * 0.035), 6);
      dots(140, '#ffffff', 0.14, 0.07); dots(110, '#000000', 0.1, 0.07);
    } else if (k === 'wax') {
      blot(7, 3, 6, '#fff0b0', 0.28); blot(6, 2, 4, '#9a5a10', 0.16);
      wander(9, '#fff8d8', 0.28, Math.max(1, cs * 0.05), 3);
      wander(7, '#7a4408', 0.16, Math.max(1, cs * 0.06), 3);
      for (let q = 0; q < 18; q++) { // tool strokes: short arcs where the loop has scraped
        ctx.strokeStyle = 'rgba(110,60,5,0.22)'; ctx.lineWidth = Math.max(1, cs * 0.05); ctx.beginPath();
        ctx.arc(u(R(q, 21)), v(R(q, 22)), cs * (0.7 + R(q, 23) * 1.2), R(q, 24) * 6, R(q, 24) * 6 + 1.2); ctx.stroke();
      }
    } else if (k === 'mud') {
      blot(26, 1.0, 2.6, (q) => (q % 2 ? '#fff0d8' : '#4a2a14'), 0.24);
      dots(150, '#3a2010', 0.3, 0.1); dots(90, '#ffe8c8', 0.26, 0.09);
      wander(8, '#3a2010', 0.3, Math.max(1, cs * 0.05), 2.4);
      ctx.fillStyle = 'rgba(255,235,205,0.18)'; for (let q = 0; q < 22; q++) { ctx.beginPath(); ctx.ellipse(u(R(q, 31)), v(R(q, 32)), cs * (0.25 + R(q, 33) * 0.35), cs * 0.18, R(q, 34) * 3, 0, 6.2832); ctx.fill(); }
    } else if (k === 'wood') {
      ctx.lineWidth = Math.max(1, cs * 0.055);
      for (let q = 0; q < rows * 1.6; q++) {
        const yy = v((q + 0.5) / (rows * 1.6)), ph = R(q, 41) * 6;
        ctx.strokeStyle = `rgba(${q % 3 ? '70,36,12' : '30,14,4'},${0.12 + 0.12 * R(q, 42)})`; ctx.beginPath();
        for (let s2 = 0; s2 <= 24; s2++) { const px = x + (s2 / 24) * W; const py = yy + Math.sin(s2 * 0.5 + ph) * cs * 0.35 + Math.sin(s2 * 0.17 + q) * cs * 0.5; if (s2) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.stroke();
      }
      const kx = u(0.3 + R(1, 51) * 0.4), ky = v(0.3 + R(2, 52) * 0.4);
      for (let q = 4; q > 0; q--) { ctx.strokeStyle = `rgba(50,22,6,${0.14 + 0.04 * q})`; ctx.lineWidth = Math.max(1, cs * 0.05); ctx.beginPath(); ctx.ellipse(kx, ky, cs * q * 0.55, cs * q * 0.3, 0.2, 0, 6.2832); ctx.stroke(); }
      blot(8, 3, 6, '#ffe2a8', 0.12);
    } else if (k === 'metal') {
      ctx.lineWidth = 1;
      for (let q = 0; q < rows * 3; q++) { const yy = v(q / (rows * 3)); ctx.strokeStyle = q % 2 ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)'; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + W, yy + cs * (R(q, 61) - 0.5) * 0.3); ctx.stroke(); }
      blot(6, 3, 6, '#ffffff', 0.12);
    } else if (k === 'candy') {
      blot(9, 2, 5, '#fff2a0', 0.3); blot(7, 1.5, 3.5, '#a03800', 0.18);
      for (let q = 0; q < 16; q++) { ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.ellipse(u(R(q, 71)), v(R(q, 72)), cs * 0.2, cs * 0.1, -0.6, 0, 6.2832); ctx.fill(); }
    } else if (k === 'paper') {
      dots(200, '#ffffff', 0.1, 0.06); wander(10, '#ffffff', 0.08, 1, 3); wander(10, '#000000', 0.05, 1, 3);
    } else {
      blot(14, 1.8, 4, (q) => (q % 2 ? '#fff1dc' : '#3a1c0a'), 0.16);
      dots(90, '#000000', 0.12, 0.08); dots(70, '#ffffff', 0.1, 0.07);
    }
    // thickness: ambient shade all round, a dark lower-right face, a bright upper-left lip
    ringFill(() => { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = cs * 0.5; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; ctx.fillStyle = '#000'; ctx.fill('evenodd'); ctx.restore(); });
    ringFill(() => { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = cs * 0.55; ctx.shadowOffsetX = -cs * 0.28; ctx.shadowOffsetY = -cs * 0.38; ctx.fillStyle = '#000'; ctx.fill('evenodd'); ctx.restore(); });
    ringFill(() => { ctx.save(); ctx.shadowColor = k === 'metal' || k === 'candy' || k === 'wax' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.6)'; ctx.shadowBlur = cs * 0.3; ctx.shadowOffsetX = cs * 0.16; ctx.shadowOffsetY = cs * 0.22; ctx.fillStyle = '#000'; ctx.fill('evenodd'); ctx.restore(); });
    // overall key light and a broad sheen
    const lg = ctx.createLinearGradient(x, y, x + W, y + Hh);
    lg.addColorStop(0, 'rgba(255,255,255,0.2)'); lg.addColorStop(0.45, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(0,0,0,0.26)');
    ctx.fillStyle = lg; ctx.fillRect(x, y, W, Hh);
    if (k === 'metal' || k === 'candy' || k === 'wax' || k === 'stone') {
      const sw = ((t * 0.18) % 2.2) - 0.6, sg = ctx.createLinearGradient(x + W * sw, y, x + W * (sw + 0.22), y + Hh * 0.35);
      sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, `rgba(255,255,255,${k === 'stone' ? 0.1 : 0.22})`); sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg; ctx.fillRect(x, y, W, Hh);
    }
    ctx.restore();
    path(); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(tint(base, -0.7), 0.75); ctx.lineWidth = Math.max(1, cs * 0.06); ctx.stroke();
    ctx.restore();
  };
  // One block drawn with form: cells with a texture of their material, bevelled cut edges and cast shadows into the cavity.
  const drawBlock = (ctx, mask, x, y, cs, opt) => {
    const { detail, fillCavity, t = 0 } = opt;
    const k = P.material, W = cs * cols, Hh = cs * rows;
    if (fillCavity) {
      const cv = SC.cavity ?? 'dark';
      const base0 = cv === 'dust' ? '#8f7c6e' : cv === 'mat' ? '#2a4434' : cv === 'mirror' ? '#a9c3d0' : P.cavity;
      const cg = ctx.createLinearGradient(x, y, x + W, y + Hh); cg.addColorStop(0, tint(base0, 0.12)); cg.addColorStop(1, tint(base0, -0.25));
      ctx.fillStyle = cg; ctx.fillRect(x, y, W, Hh);
      if (cv === 'mirror') {
        for (let rr = 0; rr < rows; rr++) for (let c0 = 0; c0 < cols; c0++) {
          const px = x + c0 * cs, py = y + rr * cs, h1 = hash(c0, rr, 90);
          const fg = ctx.createLinearGradient(px, py, px + cs, py + cs);
          fg.addColorStop(0, h1 > 0.5 ? '#ffffff' : '#e3f1f8'); fg.addColorStop(0.5, h1 > 0.5 ? '#9dc0d2' : '#c8e0ec'); fg.addColorStop(1, h1 > 0.5 ? '#e6f3fa' : '#7ea1b6');
          ctx.fillStyle = fg; ctx.fillRect(px, py, cs + 0.6, cs + 0.6);
          if (detail) { ctx.strokeStyle = 'rgba(40,70,90,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px + cs * h1, py); ctx.lineTo(px + cs * (1 - h1), py + cs); ctx.stroke(); }
        }
        if (detail) { const gx = x + ((t * 0.18) % 1.6 - 0.3) * W; const gl = ctx.createLinearGradient(gx, y, gx + W * 0.2, y + Hh * 0.4); gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(0.5, 'rgba(255,255,255,0.5)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.save(); ctx.beginPath(); for (let rr = 0; rr < rows; rr++) for (let c0 = 0; c0 < cols; c0++) if (!mask[at(c0, rr)]) ctx.rect(x + c0 * cs, y + rr * cs, cs, cs); ctx.clip(); ctx.fillStyle = gl; ctx.fillRect(x, y, W, Hh); ctx.restore(); }
      } else if (cv === 'mat') {
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.beginPath(); for (let q = 0; q <= cols; q++) { ctx.moveTo(x + q * cs, y); ctx.lineTo(x + q * cs, y + Hh); } for (let q = 0; q <= rows; q++) { ctx.moveTo(x, y + q * cs); ctx.lineTo(x + W, y + q * cs); } ctx.stroke();
      }
    }
    if (cs >= 3) { drawSmooth(ctx, mask, x, y, cs, { detail, t, cast: opt.cast ?? 0 }); return; }
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
      if (BK === 'wax') {
        ctx.fillStyle = 'rgba(255,240,190,0.16)'; ctx.fillRect(px, py, cs, cs * 0.45);
        ctx.fillStyle = 'rgba(120,60,0,0.10)'; ctx.fillRect(px + hash(c, r, 5) * cs * 0.5, py + cs * 0.55, cs * 0.5, cs * 0.3);
        if (hash(c, r, 8) > 0.82) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(px + cs * 0.2, py + cs * 0.15, cs * 0.5, Math.max(1, cs * 0.08)); }
      } else if (BK === 'mud') {
        ctx.fillStyle = 'rgba(255,240,215,0.2)'; ctx.beginPath(); ctx.arc(px + cs * (0.25 + hash(c, r, 3) * 0.3), py + cs * (0.25 + hash(c, r, 4) * 0.3), cs * 0.2, 0, 6.2832); ctx.fill();
        ctx.fillStyle = 'rgba(60,30,10,0.22)'; ctx.beginPath(); ctx.arc(px + cs * (0.55 + hash(c, r, 5) * 0.3), py + cs * (0.6 + hash(c, r, 6) * 0.3), cs * 0.18, 0, 6.2832); ctx.fill();
        if (hash(c, r, 9) > 0.7) { ctx.strokeStyle = 'rgba(70,40,20,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px + cs * 0.1, py + cs * 0.3); ctx.lineTo(px + cs * 0.9, py + cs * 0.4); ctx.stroke(); }
      } else if (BK === 'soapstone') {
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; for (let q = 0; q < 2; q++) ctx.fillRect(px + hash(c, r, q + 20) * cs * 0.8, py + hash(c, r, q + 30) * cs * 0.8, Math.max(1, cs * 0.08), Math.max(1, cs * 0.08));
        const v = Math.sin((c + r * 0.7) * 0.55) + Math.sin((c * 0.3 - r) * 0.8);
        if (v > 1.2) { ctx.fillStyle = 'rgba(150,60,70,0.16)'; ctx.fillRect(px, py, cs, cs); }
        else if (v < -1.35) { ctx.fillStyle = 'rgba(70,70,80,0.14)'; ctx.fillRect(px, py, cs, cs); }
        ctx.strokeStyle = 'rgba(90,50,40,0.12)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px, py + cs * hash(c, r, 12)); ctx.lineTo(px + cs, py + cs * hash(c, r, 13)); ctx.stroke();
      } else if (k === 'wood') {
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
    if (cs >= 3) { ctx.beginPath(); tracePath(ctx, contourLoops(target, cols, rows, { k: cs >= 9 ? 4 : 3 }), bx, by, cs); return; }
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
    const W0 = R.work, lift = SC.wall ? wallLift(W0) : 0, W = { x: W0.x, y: W0.y + 40 + lift, w: W0.w, h: W0.h - 40 - lift }, cs = Math.max(4, Math.floor(Math.min((W.w - 24) / (cols + 2), (W.h - 24) / (rows + 2))));
    const bx = Math.round(W.x + (W.w - cs * cols) / 2), by = Math.round(W.y + (W.h - cs * rows) / 2);
    geo = { x: bx, y: by, cs };
    // the block sits on the bench with a body (a plinth edge below and to the right) and a soft shadow
    const dp = Math.max(4, cs * 0.5);
    drawSeat(ctx, SC.seat ?? 'bench', bx, by, cs * cols, cs * rows, cs, P.color, t);
    shadowed(ctx, () => { ctx.fillStyle = cut ? '#0b0e12' : tint(P.color, -0.55); ctx.fillRect(bx - 4, by - 4, cs * cols + 8 + dp * 0.6, cs * rows + 8 + dp); }, { blur: 16, dy: 9, a: 0.5 });
    ctx.fillStyle = cut ? '#0b0e12' : tint(P.color, -0.5); ctx.fillRect(bx - 5, by - 5, cs * cols + 10, cs * rows + 10);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.5; ctx.strokeRect(bx - 4.5, by - 4.5, cs * cols + 9, cs * rows + 9);
    const castU = SC.id === 'lostwax' && done && castAt >= 0 ? Math.min(1, Math.max(0, (t - castAt - 0.2) / 1.6)) : 0;
    drawBlock(ctx, kept, bx, by, cs, { detail: true, fillCavity: true, t, cast: castU });
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
      // material still to remove (kept, outside the figure) is tinted; over-cut places show red inside the lit outline
      const kl = contourLoops(kept, cols, rows, { k: cs >= 9 ? 4 : 3 }), tl = contourLoops(target, cols, rows, { k: cs >= 9 ? 4 : 3 });
      ctx.save(); ctx.beginPath(); ctx.rect(bx, by, cs * cols, cs * rows); ctx.clip();
      ctx.save(); ctx.beginPath(); tracePath(ctx, kl, bx, by, cs); ctx.clip('evenodd');
      ctx.beginPath(); ctx.rect(bx - cs, by - cs, cs * (cols + 2), cs * (rows + 2)); tracePath(ctx, tl, bx, by, cs);
      ctx.fillStyle = 'rgba(20,10,5,0.22)'; ctx.fill('evenodd'); ctx.restore();
      ctx.save(); ctx.beginPath(); tracePath(ctx, tl, bx, by, cs); ctx.clip('evenodd');
      ctx.beginPath(); ctx.rect(bx - cs, by - cs, cs * (cols + 2), cs * (rows + 2)); tracePath(ctx, kl, bx, by, cs);
      ctx.fillStyle = 'rgba(224,70,40,0.5)'; ctx.fill('evenodd'); ctx.restore();
      ctx.restore();
      outlinePath(ctx, bx, by, cs); litEdge(ctx, pal.accent, Math.max(1.6, cs * 0.1), t);
    }
    // the working tool
    if (!done && lastPtr && lastPtr.down && t - lastPtr.t < 0.25) { if (SC.tool) drawTool(ctx, SC, SC.tool, lastPtr.x, lastPtr.y, Math.max(90, Math.min(150, cs * 9)), t, { c: SC.fx?.c, t }); else drawChisel(ctx, lastPtr.x, lastPtr.y, t); }
    // the reference
    const th = R.thumb, tcs = Math.max(2, Math.floor(Math.min((th.w - 16) / cols, (th.h - 16) / rows))), tx = th.x + (th.w - tcs * cols) / 2, ty = th.y + (th.h - tcs * rows) / 2;
    shadowed(ctx, () => { ctx.fillStyle = '#000'; ctx.fillRect(tx, ty, tcs * cols, tcs * rows); }, { blur: 10, dy: 5, a: 0.5 });
    drawBlock(ctx, target, tx, ty, tcs, { detail: tcs >= 5, fillCavity: true, t });
    const wd = SC.words ?? {};
    g.label(ctx, cut ? (wd.hint ?? 'Tap cells to snip: partners on the fold are cut too') : P.guide ? (wd.hint ?? 'Remove what lies outside the lit outline') : (wd.hintBlind ?? 'Remove everything that is not the figure'), W0.x + W0.w / 2, W0.y + 26, g.px(22), pal.ink, 'center', '600');
  };

  const titleArt = (g, S, t) => {
    const { ctx } = g;
    const cs = Math.max(4, Math.floor(Math.min(S.w * 0.74 / cols, S.h * 0.74 / rows))), bx = S.x + (S.w - cs * cols) / 2, by = S.y + (S.h - cs * rows) / 2;
    drawSeat(ctx, SC.seat ?? 'bench', bx, by, cs * cols, cs * rows, cs, P.color, t);
    if (cut) shadowed(ctx, () => { ctx.fillStyle = P.cavity; ctx.fillRect(bx, by, cs * cols, cs * rows); }, { blur: 28, dy: 16, a: 0.6 });
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
      if (cut && SC.cavity === 'mirror') sound?.mirror(hash(c, r)); else sound?.chip(hash(c, r), false);
      return;
    }
    for (let i = 0; i < total; i++) if (!kept[i] && target[i]) { kept[i] = 1; return; }
    finish();
  };

  return {
    init, items, control, work, draw, attract, titleArt, result: () => done,
    score: () => score().score,
    info: () => [`Block: ${cols} by ${rows}`, cut ? `Fold: ${P.symmetry}` : (P.chisels > 1 ? 'Chisels: fine and broad' : 'One chisel')],
    caption: SC.words?.caption ?? (cut ? 'Cut this design' : 'Carve this figure'),
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

// Pattern and craft design activity (docs/ENGINE-CONTRACT.md "Activity engines").
// Board = cols x rows cells; each cell holds { m: motif index or -1, c: colour index }. Painting a cell also paints its
// symmetric partners, so every design keeps the tradition's symmetry by construction.
// shape 'polar' (1.3.0): a disc of `rings` concentric rings x `rays` radial sectors; cell (c, r) = (ray c, ring r), ring 0 is innermost, ray 0 starts at the top and runs clockwise.
//   Internally cols = rays and rows = rings, so designs, targets and boards use the same flat layout as the grid.
// `designs`: optional hand-authored targets: [{ name, rows: ["..a..", ...], legend: { a: { m: motifIndex, c: colourIndex } } }] ('.' = empty). One is chosen per round.
import { drawStamp, drawGround, drawThreadOverlay, drawLight, frameBefore, frameAfter, pickMaterial, hash, hashStr, rgba, mix, shade, lum, sparkle, roundRectPath, clamp, createRng, drawProp } from './art.js';

export const DEFAULTS = { material: 'auto', shape: 'grid', rings: 5, rays: 16, rotateMarks: false, designs: null, cols: 7, rows: 7, symmetry: 'rot4', palette: [{ name: 'Cream', color: '#f3ead2' }, { name: 'Red', color: '#c8452d' }, { name: 'Blue', color: '#27508c' }, { name: 'Gold', color: '#e0a82e' }], background: '#2b2118', grid: '#4d3b2a', motifs: ['solid', 'diamond', 'dot', 'cross'], mode: 'copy', density: 0.45, colorsInTarget: 3 };

// Symmetry groups (each a proper group, so orbits partition the grid): identity plus the listed transforms.
const orbit = (sym, c, r, cols, rows) => {
  const mx = cols - 1 - c, my = rows - 1 - r, square = cols === rows;
  const T = { id: [c, r], fx: [mx, r], fy: [c, my], r2: [mx, my], r90: [my, c], r270: [r, mx], tr: [r, c], atr: [my, mx] };
  const sets = {
    none: ['id'], 'mirror-x': ['id', 'fx'], 'mirror-y': ['id', 'fy'], 'mirror-xy': ['id', 'fx', 'fy', 'r2'], rot2: ['id', 'r2'],
    rot4: square ? ['id', 'r90', 'r2', 'r270'] : ['id', 'r2'],
    'rot4-mirror': square ? ['id', 'r90', 'r2', 'r270', 'fx', 'fy', 'tr', 'atr'] : ['id', 'fx', 'fy', 'r2'],
  };
  const out = new Map();
  for (const k of sets[sym] ?? sets.none) { const [x, y] = T[k]; if (x >= 0 && y >= 0 && x < cols && y < rows) out.set(`${x},${y}`, [x, y]); }
  return [...out.values()];
};

// Orientation of a cell's stamp under the symmetry group (so leaves, frets and waves point the way a real mirrored or rotated design would).
function orient(sym, c, r, cols, rows) {
  const mx = (cols - 1) / 2, my = (rows - 1) / 2, right = c > mx + 1e-9, left = c < mx - 1e-9, low = r > my + 1e-9, up = r < my - 1e-9;
  const t = { rot: 0, fx: false, fy: false };
  if (sym === 'mirror-x') t.fx = right;
  else if (sym === 'mirror-y') t.fy = low;
  else if (sym === 'mirror-xy') { t.fx = right; t.fy = low; }
  else if (sym === 'rot2') t.rot = low || (!up && right) ? 2 : 0;
  else if (sym === 'rot4' || sym === 'rot4-mirror') { t.rot = right && !low ? 1 : right && low ? 2 : low && !right ? 3 : 0; if (sym === 'rot4-mirror') t.fx = false; }
  return t;
}

// ---- polar mode -------------------------------------------------------------------------------------------------------------
// Symmetry for polar discs: none | mirror (left-right across the vertical axis) | rotN | rotN-mirror, N dividing rays.
// Ray 0 starts at the top, so the vertical axis is a sector boundary and the mirror of ray c is ray rays-1-c.
export function parsePolarSymmetry(sym, rays) {
  if (sym === 'none' || sym == null) return { n: 1, mirror: false, step: rays };
  if (sym === 'mirror' || sym === 'mirror-x') { if (rays % 2) throw new Error(`pattern: polar symmetry "${sym}" needs an even number of rays (got ${rays})`); return { n: 1, mirror: true, step: rays }; }
  const m = /^rot(\d+)(-mirror)?$/.exec(sym);
  if (!m) throw new Error(`pattern: symmetry "${sym}" is not valid for polar discs (use none, mirror, rotN or rotN-mirror)`);
  const n = Number(m[1]);
  if (n < 1 || rays % n) throw new Error(`pattern: symmetry "${sym}" needs N to divide the number of rays (${rays})`);
  if (m[2] && rays % 2) throw new Error(`pattern: symmetry "${sym}" needs an even number of rays (got ${rays})`);
  return { n, mirror: !!m[2], step: rays / n };
}
export function polarOrbit(sym, c, rays) {
  const { n, mirror, step } = typeof sym === 'object' ? sym : parsePolarSymmetry(sym, rays);
  const out = new Set();
  for (let k = 0; k < n; k++) { out.add((c + k * step) % rays); if (mirror) out.add((((rays - 1 - c + k * step) % rays) + rays) % rays); }
  return [...out].sort((a, b) => a - b);
}
// Throws a clear error naming the invalid design (used by the activity and by tests / the gate).
export function validatePolarDesigns(params) {
  const P = { ...DEFAULTS, ...params };
  if (P.shape !== 'polar') return;
  const sym = parsePolarSymmetry(P.symmetry, P.rays);
  (P.designs || []).forEach((d, di) => {
    const name = `design #${di + 1} "${d.name}"`;
    if (d.rows.length !== P.rings) throw new Error(`pattern: ${name} has ${d.rows.length} rows but rings = ${P.rings} (one string per ring, innermost first)`);
    d.rows.forEach((row, r) => {
      if ([...row].length !== P.rays) throw new Error(`pattern: ${name} ring ${r + 1} has ${[...row].length} characters but rays = ${P.rays}`);
      [...row].forEach((ch) => { if (ch !== '.' && !d.legend[ch]) throw new Error(`pattern: ${name} ring ${r + 1} uses "${ch}" which is not in its legend`); });
      [...row].forEach((ch, c) => {
        for (const o of polarOrbit(sym, c, P.rays)) if ([...row][o] !== ch) throw new Error(`pattern: ${name} is not ${P.symmetry}-symmetric: ring ${r + 1}, ray ${c + 1} ("${ch}") differs from its partner ray ${o + 1} ("${[...row][o]}")`);
      });
    });
  });
}
// Stamp drawn radially: its "up" points outward; `flip` mirrors it for the mirrored half of a mirror-symmetric disc.
const SYM_NAMES = { none: 'No symmetry', 'mirror-x': 'Mirrored left and right', 'mirror-y': 'Mirrored top and bottom', 'mirror-xy': 'Mirrored both ways', rot2: 'Half-turn symmetry', rot4: 'Quarter-turn symmetry', 'rot4-mirror': 'Quarter-turn and mirror', mirror: 'Mirrored left and right' };
const symName = (s) => SYM_NAMES[s] ?? (/^rot(\d+)(-mirror)?$/.exec(s) ? `${/^rot(\d+)/.exec(s)[1]}-fold turn${/-mirror/.test(s) ? ' and mirror' : ''}` : s);
const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const REVEAL_SECONDS = 1.5;      // length of the completion reveal before the result is released
const REVEAL_HOLD = 0.35;        // pause after the sheen before the result overlay

export function createActivity(userParams, env) {
  const P = { ...DEFAULTS, ...userParams };
  const { rng, palette: pal } = env;
  const polar = P.shape === 'polar';
  if (polar) validatePolarDesigns(P);
  const mat = pickMaterial(P.material === 'auto' ? null : P.material, env.text?.title, env.text?.summary);
  const reduce = !!(env.config?.reduceMotion);
  const psym = polar ? parsePolarSymmetry(P.symmetry, P.rays) : null;
  const cols = polar ? P.rays : P.cols, rows = polar ? P.rings : P.rows;
  const total = cols * rows;
  const orbitOf = (c, r) => (polar ? polarOrbit(psym, c, cols).map((x) => [x, r]) : orbit(P.symmetry, c, r, cols, rows));
  const bgc = P.background;
  const titleSeed = hashStr(String(env.text?.title ?? 'pattern'));
  let board, target, targetName, sel, undoStack, tip, done, outcome, layout = null;
  let clock = 0, landAt, eraseAt, eraseCell, revealAt, wrongAt, hoverAt, hover, hintAt, hintCell, shown, pulseAt, lastScore, pressId, lastPtr, attractT;
  const empty = () => Array.from({ length: total }, () => ({ m: -1, c: 0 }));
  const at = (c, r) => r * cols + c;

  const fromDesign = (d) => {
    const t = empty();
    d.rows.forEach((row, r) => [...row].forEach((ch, c) => { const g = d.legend[ch]; if (g && r < rows && c < cols) t[at(c, r)] = { m: g.m, c: g.c }; }));
    return t;
  };
  const generateWith = (R) => {
    const t = empty();
    if (P.designs && P.designs.length) { const d = P.designs[R.int(P.designs.length)]; return { cells: fromDesign(d), name: d.name }; }
    const colors = Math.min(P.colorsInTarget, P.palette.length);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (t[at(c, r)].m !== -1 || !R.chance(P.density)) continue;
      const cell = { m: R.int(P.motifs.length), c: R.int(colors) };
      for (const [x, y] of orbitOf(c, r)) t[at(x, y)] = { ...cell };
    }
    if (t.every((x) => x.m === -1)) t[at(Math.floor(cols / 2), Math.floor(rows / 2))] = { m: 0, c: 0 };
    return { cells: t, name: '' };
  };
  const generate = () => generateWith(rng);

  const init = () => {
    board = empty();
    const gen = P.mode === 'copy' ? generate() : null;
    target = gen ? gen.cells : null; targetName = gen ? gen.name : '';
    sel = { m: 0, c: Math.min(1, P.palette.length - 1) }; undoStack = []; tip = ''; done = null; outcome = null;
    landAt = new Array(total).fill(-1e9); eraseAt = new Array(total).fill(-1e9); eraseCell = new Array(total).fill(null);
    revealAt = -1; wrongAt = []; hoverAt = -1e9; hover = null; hintAt = -1e9; hintCell = -1; shown = 0; pulseAt = -1e9; lastScore = 0;
    pressId = null; lastPtr = { x: -1, y: -1 }; attractT = 0;
  };
  init();

  const tone = (o) => env.audio?.tone(o);
  const paint = (c, r) => {
    undoStack.push(board.map((x) => ({ ...x })));
    const erase = sel.m === -1;
    const same = board[at(c, r)].m === sel.m && board[at(c, r)].c === sel.c;
    let k = 0;
    for (const [x, y] of orbitOf(c, r)) {
      const i = at(x, y), next = erase || same ? { m: -1, c: 0 } : { m: sel.m, c: sel.c };
      if (next.m === -1) { if (board[i].m !== -1) { eraseCell[i] = board[i]; eraseAt[i] = clock + k * 0.03; } landAt[i] = -1e9; }
      else { landAt[i] = clock + k * 0.045; eraseAt[i] = -1e9; }
      board[i] = next; k++;
    }
    // a soft thud, then a small high tick for the grain of the material
    tone({ freq: 210 + sel.c * 26, to: 120, dur: 0.1, type: 'triangle', vol: 0.16 });
    tone({ freq: 880 + sel.c * 90, dur: 0.035, type: 'sine', vol: 0.04 });
  };

  const score = () => {
    if (!target) {
      const filled = board.filter((x) => x.m !== -1);
      const colors = new Set(filled.map((x) => x.c)).size, kinds = new Set(filled.map((x) => x.m)).size;
      const coverage = filled.length / total;
      const s = Math.round(Math.min(100, 30 + colors * 12 + kinds * 8 + (coverage > 0.2 && coverage < 0.85 ? 22 : 6)));
      return { score: s, correct: filled.length, wrong: 0 };
    }
    let correct = 0, wrong = 0;
    for (let i = 0; i < total; i++) {
      const a = board[i], b = target[i];
      if (a.m === -1 && b.m === -1) continue;
      if (a.m === b.m && a.c === b.c) correct++; else wrong++;
    }
    return { score: Math.round((100 * correct) / Math.max(1, correct + wrong)), correct, wrong };
  };

  const finish = (stars, headline, detail, sc) => {
    outcome = { score: sc.score, max: 100, stars, headline, detail };
    revealAt = clock;
    wrongAt = [];
    if (target) for (let i = 0; i < total; i++) { const a = board[i], b = target[i]; if (!(a.m === -1 && b.m === -1) && !(a.m === b.m && a.c === b.c)) wrongAt.push(i); }
    tone({ freq: 330, to: 660, dur: 0.32, type: 'triangle', vol: 0.14 });
  };
  const check = () => {
    const r = score();
    const stars = r.score >= 98 ? 3 : r.score >= 85 ? 2 : r.score >= 60 ? 1 : 0;
    finish(stars, stars === 3 ? 'A faithful pattern!' : stars ? 'A good pattern' : 'Keep practising', target ? `${r.correct} cells right, ${r.wrong} to fix` : 'A balanced, symmetric design', r);
  };

  // ---- geometry ---------------------------------------------------------------------------------------------------------------
  // Disc geometry inside a square [x, y, D]: centre, outer radius, hub radius, ring thickness.
  const discOf = (x, y, D) => { const R = D / 2 - 3, R0 = R * 0.1; return { cx: x + D / 2, cy: y + D / 2, R, R0, thick: (R - R0) / rows }; };
  const step = (2 * Math.PI) / cols;
  const sectorAngle = (c) => -Math.PI / 2 + (c + 0.5) * step;
  const sectorCentre = (d, c, r) => { const rad = d.R0 + (r + 0.5) * d.thick, a = sectorAngle(c); return { x: d.cx + Math.cos(a) * rad, y: d.cy + Math.sin(a) * rad }; };
  const polarHit = (d, px, py) => {
    const dx = px - d.cx, dy = py - d.cy, dist = Math.hypot(dx, dy);
    if (dist < d.R0 || dist >= d.R) return null;
    let ang = Math.atan2(dy, dx) + Math.PI / 2; ang = ((ang % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    return { c: Math.min(cols - 1, Math.floor(ang / step)), r: Math.min(rows - 1, Math.floor((dist - d.R0) / d.thick)) };
  };
  const fitBoard = (box, fd) => {
    // The board (square cells, or a disc) that fits `box` leaving room for the frame.
    const inner = { x: box.x + fd, y: box.y + fd, w: Math.max(10, box.w - 2 * fd), h: Math.max(10, box.h - 2 * fd) };
    if (polar) {
      const D = Math.floor(Math.min(inner.w, inner.h)), x0 = inner.x + (inner.w - D) / 2, y0 = inner.y + (inner.h - D) / 2;
      return { x: x0, y: y0, w: D, h: D, cell: D, ...discOf(x0, y0, D) };
    }
    const cell = Math.max(4, Math.floor(Math.min(inner.w / cols, inner.h / rows)));
    const bw = cell * cols, bh = cell * rows;
    return { x: inner.x + (inner.w - bw) / 2, y: inner.y + (inner.h - bh) / 2, w: bw, h: bh, cell };
  };
  const geometry = (a, u) => {
    const landscape = a.w > a.h * 1.15, gap = Math.round(10 * u / 1.85);
    const nColor = P.palette.length, nMotif = P.motifs.length + 1;
    const touch = 46 * u;
    const out = { landscape, u };
    let sw, palArea, boardBox, cardBox = null, actH = Math.min(touch, 76);
    if (landscape) {
      const per = 4;
      sw = Math.min(touch, Math.floor((a.w * 0.34 - 14) / per) - 6);
      const rowsN = Math.ceil(nColor / per) + Math.ceil(nMotif / per);
      sw = Math.min(sw, Math.floor((a.h - actH - 30) / rowsN) - 6);
      sw = Math.max(40, sw);
      const colW = per * (sw + 6) + 14;
      palArea = { x: a.x + a.w - colW, y: a.y, w: colW, h: a.h, per };
      const left = a.w - colW - gap;
      if (target) {
        const cw = Math.round(clamp(left * 0.3, 170 * u / 1.85, 340 * u / 1.85));
        cardBox = { x: a.x + 4, y: a.y + 4, w: cw, h: a.h - 8, column: true };
        boardBox = { x: a.x + cw + gap, y: a.y, w: left - cw - gap, h: a.h };
      } else boardBox = { x: a.x, y: a.y, w: left, h: a.h };
    } else {
      const per = Math.max(nColor, nMotif);
      sw = Math.max(40, Math.min(touch, Math.floor((a.w - 8) / per) - 6));
      const palH = (sw + 8) * 2 + actH + 14;
      palArea = { x: a.x, y: a.y + a.h - palH, w: a.w, h: palH, per };
      const rest = a.h - palH - gap;
      if (target) {
        const ch = Math.round(clamp(rest * 0.3, 150, Math.min(a.w * 0.5, 380)));
        cardBox = { x: a.x + 6, y: a.y + 4, w: a.w - 12, h: ch, column: false };
        boardBox = { x: a.x, y: a.y + ch + gap + 4, w: a.w, h: rest - ch - gap - 4 };
      } else boardBox = { x: a.x, y: a.y, w: a.w, h: rest };
    }
    const fd = clamp(Math.min(boardBox.w, boardBox.h) / (Math.max(cols, rows) * 3.2), 9 * u / 1.85, 24 * u / 1.85) + 4;
    const b = fitBoard(boardBox, fd + (mat === 'weave' ? 8 : 0));
    return { ...out, sw, actH, board: b, fd, card: cardBox, pal: palArea, boardBox };
  };

  const buttons = (L) => {
    const sw = L.sw, p = L.pal, out = [];
    const per = L.landscape ? p.per : Math.max(P.palette.length, P.motifs.length + 1);
    const rowStart = (n, perRow) => (L.landscape ? p.x + 7 : p.x + (p.w - Math.min(n, perRow) * (sw + 6) + 6) / 2);
    let y = p.y + 4;
    const colorsPer = L.landscape ? per : P.palette.length;
    P.palette.forEach((_, i) => out.push({ id: `color:${i}`, x: rowStart(P.palette.length, colorsPer) + (i % colorsPer) * (sw + 6), y: y + Math.floor(i / colorsPer) * (sw + 6), w: sw, h: sw }));
    y += (Math.floor((P.palette.length - 1) / colorsPer) + 1) * (sw + 6) + (L.landscape ? 4 : 2);
    const all = [...P.motifs.map((_, i) => i), -1];
    const mPer = L.landscape ? per : all.length;
    all.forEach((mi, i) => out.push({ id: `motif:${mi}`, x: rowStart(all.length, mPer) + (i % mPer) * (sw + 6), y: y + Math.floor(i / mPer) * (sw + 6), w: sw, h: sw }));
    y += (Math.floor((all.length - 1) / mPer) + 1) * (sw + 6) + (L.landscape ? 6 : 4);
    const names = [['check', 'Check', 1.5], ['undo', 'Undo', 1], ['clear', 'Clear', 1]];
    const totalW = L.landscape ? p.w - 14 : p.w - 12, gapB = 8, wsum = names.reduce((s, n) => s + n[2], 0);
    let x = L.landscape ? p.x + 7 : p.x + 6;
    for (const [id, label, wt] of names) { const w = (totalW - gapB * 2) * (wt / wsum); out.push({ id, label, x, y, w, h: Math.min(L.actH, Math.max(40, p.y + p.h - y - 2)) }); x += w + gapB; }
    return out;
  };

  // ---- drawing -----------------------------------------------------------------------------------------------------------------
  const cellKind = (cell) => P.motifs[cell.m];
  const drawCellAt = (ctx, cell, x, y, size, c, r, i, sc, alpha) => {
    const col = P.palette[cell.c].color, kind = cellKind(cell);
    ctx.save(); ctx.translate(x, y);
    if (alpha < 1) ctx.globalAlpha = alpha;
    if (sc !== 1) ctx.scale(sc, sc);
    if (polar) {
      ctx.rotate(sectorAngle(c) + Math.PI / 2);
      if (psym.mirror && Math.floor(((c + 0.5) * 2) / psym.step) % 2 === 1) ctx.scale(-1, 1);
    } else if (P.rotateMarks) {
      const t = orient(P.symmetry, c, r, cols, rows);
      ctx.rotate((t.rot * Math.PI) / 2); ctx.scale(t.fx ? -1 : 1, t.fy ? -1 : 1);
    }
    drawStamp(ctx, mat, kind, 0, 0, size, col, i * 13 + c, bgc);
    ctx.restore();
  };
  const cellCentre = (B, c, r) => (polar ? sectorCentre(B, c, r) : { x: B.x + (c + 0.5) * B.cell, y: B.y + (r + 0.5) * B.cell });
  const cellSize = (B, r) => (polar ? Math.min(B.thick, (B.R0 + (r + 0.5) * B.thick) * step) * 0.92 : B.cell * 0.9);

  // Draws one board (the player's, the reference card's or the title art's) with every material effect.
  // o: { cells, lite, anim, grid (0..1), guides (0..1), reveal (0..1), light }
  const renderBoard = (ctx, B, o) => {
    const cells = o.cells, lite = !!o.lite;
    const rect = polar ? { x: B.cx - B.R, y: B.cy - B.R, w: B.R * 2, h: B.R * 2 } : { x: B.x, y: B.y, w: B.w, h: B.h };
    const cell = polar ? B.thick : B.cell, fd = o.fd ?? Math.max(5, cell * 0.28);
    frameBefore(ctx, mat, rect, fd, polar, bgc, o.reveal ?? 0);
    ctx.save();
    if (polar) { ctx.beginPath(); ctx.arc(B.cx, B.cy, B.R, 0, Math.PI * 2); ctx.clip(); }
    drawGround(ctx, mat, rect, bgc, cell, polar ? 0 : cols, polar ? 0 : rows, lite);
    // erased stamps fade away
    if (o.anim && !reduce) for (let i = 0; i < total; i++) {
      const age = clock - eraseAt[i]; if (age < 0 || age > 0.25 || !eraseCell[i]) continue;
      const c = i % cols, r = Math.floor(i / cols), p = cellCentre(B, c, r), k = age / 0.25;
      drawCellAt(ctx, eraseCell[i], p.x, p.y, cellSize(B, r), c, r, i, 1 - 0.25 * k, 1 - k);
    }
    // stamps (a stamp that has just landed drops from above with a small bounce)
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = at(c, r), cellv = cells[i]; if (cellv.m === -1) continue;
      const p = cellCentre(B, c, r), size = cellSize(B, r);
      let sc = 1, a = 1;
      if (o.anim && !reduce) {
        const age = clock - landAt[i];
        if (age < 0) continue;
        if (age < 0.55) {
          sc = 1 + 0.34 * Math.exp(-8.5 * age) * Math.cos(15 * age + 0.2); a = Math.min(1, age / 0.05);
          const lift = Math.max(0, sc - 1);
          if (lift > 0.01) { ctx.fillStyle = rgba('#000', Math.min(0.4, lift * 1.1)); ctx.beginPath(); ctx.ellipse(p.x + size * 0.06 * (1 + lift), p.y + size * (0.1 + lift * 0.5), size * 0.32, size * 0.2, 0, 0, 6.2832); ctx.fill(); }
        }
      }
      drawCellAt(ctx, cellv, p.x, p.y, size, c, r, i, sc, a);
    }
    drawThreadOverlay(ctx, mat, rect, cell, 1, lite);
    // ruled cell lines: a faint stitched guide that fades away when the work is done
    const ga = o.grid ?? 1;
    if (ga > 0.02 && mat !== 'tile') {
      ctx.save(); ctx.globalAlpha = ga * (mat === 'bead' ? 0.5 : 0.85); ctx.strokeStyle = P.grid; ctx.lineWidth = lite ? 1 : Math.max(1, cell * 0.022);
      ctx.setLineDash([Math.max(3, cell * 0.12), Math.max(3, cell * 0.1)]); ctx.beginPath();
      if (polar) {
        for (let r = 0; r <= rows; r++) { ctx.moveTo(B.cx + B.R0 + r * B.thick, B.cy); ctx.arc(B.cx, B.cy, B.R0 + r * B.thick, 0, 6.2832); }
        if (!lite) for (let c = 0; c < cols; c++) { const a = -Math.PI / 2 + c * step; ctx.moveTo(B.cx + Math.cos(a) * B.R0, B.cy + Math.sin(a) * B.R0); ctx.lineTo(B.cx + Math.cos(a) * B.R, B.cy + Math.sin(a) * B.R); }
      } else {
        for (let i = 1; i < cols; i++) { ctx.moveTo(B.x + i * B.cell, B.y); ctx.lineTo(B.x + i * B.cell, B.y + B.h); }
        for (let j = 1; j < rows; j++) { ctx.moveTo(B.x, B.y + j * B.cell); ctx.lineTo(B.x + B.w, B.y + j * B.cell); }
      }
      ctx.stroke(); ctx.restore();
    }
    if (polar) { // hub
      const hr = B.R0 * 0.9; const gr = ctx.createRadialGradient(B.cx - hr * 0.3, B.cy - hr * 0.3, 1, B.cx, B.cy, hr);
      gr.addColorStop(0, shade(bgc, 0.4)); gr.addColorStop(1, shade(bgc, -0.5)); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(B.cx, B.cy, hr, 0, 6.2832); ctx.fill();
    }
    drawLight(ctx, rect, polar, (o.light ?? 1) * (lite ? 0.8 : 1));
    ctx.restore();
    frameAfter(ctx, mat, rect, fd, polar, bgc, pal.accent, cell);
  };

  // Symmetry guides: fine glowing axes with small diamond ends, a rosette where the turns meet.
  const drawGuides = (ctx, B, alpha) => {
    if (alpha <= 0.02 || P.symmetry === 'none') return;
    const sym = P.symmetry, acc = pal.accent;
    const line = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
    const dia = (x, y, r) => { ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); ctx.fill(); };
    const cell = polar ? B.thick : B.cell, e = Math.max(5, cell * 0.2);
    const cx = polar ? B.cx : B.x + B.w / 2, cy = polar ? B.cy : B.y + B.h / 2;
    const hw = polar ? B.R : B.w / 2, hh = polar ? B.R : B.h / 2;
    const axisV = /mirror/.test(sym) && sym !== 'mirror-y', axisH = sym === 'mirror-y' || sym === 'mirror-xy' || sym === 'rot4-mirror' || /^rot\d+-mirror$/.test(sym) && polar && false;
    ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = 'round';
    ctx.setLineDash([Math.max(6, cell * 0.2), Math.max(5, cell * 0.16)]);
    const stroke = (fn) => { ctx.strokeStyle = rgba(acc, 0.16); ctx.lineWidth = Math.max(4, cell * 0.14); fn(); ctx.strokeStyle = rgba(acc, 0.72); ctx.lineWidth = Math.max(1.4, cell * 0.04); fn(); };
    if (axisV) stroke(() => line(cx, cy - hh, cx, cy + hh));
    if (axisH && !polar) stroke(() => line(cx - hw, cy, cx + hw, cy));
    if (polar && /rot\d+/.test(sym)) { const n = Number(/rot(\d+)/.exec(sym)[1]); if (n > 1) stroke(() => { for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + (k * 2 * Math.PI) / n; line(cx + Math.cos(a) * B.R0, cy + Math.sin(a) * B.R0, cx + Math.cos(a) * B.R, cy + Math.sin(a) * B.R); } }); }
    ctx.setLineDash([]);
    ctx.fillStyle = rgba(acc, 0.9);
    if (axisV) { dia(cx, cy - hh, e * 0.55); dia(cx, cy + hh, e * 0.55); }
    if (axisH && !polar) { dia(cx - hw, cy, e * 0.55); dia(cx + hw, cy, e * 0.55); }
    // the rosette marks the centre of a turn
    if (/rot/.test(sym) || sym === 'mirror-xy') {
      ctx.strokeStyle = rgba(acc, 0.85); ctx.lineWidth = Math.max(1.4, cell * 0.04); ctx.beginPath();
      for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4, r1 = k % 2 ? e * 0.55 : e * 1.05; ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); }
      ctx.closePath(); ctx.stroke();
      ctx.fillStyle = rgba(bgc, 0.85); ctx.fill();
      if (/rot2$/.test(sym) || /rot4/.test(sym)) { // turn arrows: two small arcs
        ctx.beginPath(); ctx.arc(cx, cy, e * 1.6, -0.5, 0.9); ctx.moveTo(cx + Math.cos(0.9 + Math.PI) * e * 1.6, cy + Math.sin(0.9 + Math.PI) * e * 1.6); ctx.arc(cx, cy, e * 1.6, Math.PI - 0.5, Math.PI + 0.9); ctx.stroke();
      }
    }
    ctx.restore();
  };

  const drawGhosts = (ctx, B) => {
    // The cell under the finger and its partners: a soft glowing outline, so the player sees where the symmetry will land.
    if (!hover || clock - hoverAt > 1.4 || done || outcome) return;
    const k = 0.5 + 0.5 * Math.sin(clock * 7);
    ctx.save(); ctx.lineJoin = 'round';
    const first = orbitOf(hover.c, hover.r);
    first.forEach(([c, r], idx) => {
      const p = cellCentre(B, c, r), sz = cellSize(B, r) * 0.5 * 1.12, main = c === hover.c && r === hover.r;
      ctx.strokeStyle = rgba(pal.accent, main ? 0.95 : 0.55 + 0.25 * k); ctx.lineWidth = Math.max(1.5, (polar ? B.thick : B.cell) * (main ? 0.07 : 0.05));
      if (polar) {
        const r0 = B.R0 + r * B.thick, r1 = r0 + B.thick, a0 = -Math.PI / 2 + c * step, a1 = a0 + step;
        ctx.beginPath(); ctx.arc(B.cx, B.cy, r1, a0, a1); ctx.arc(B.cx, B.cy, r0, a1, a0, true); ctx.closePath();
      } else roundRectPath(ctx, p.x - sz, p.y - sz, sz * 2, sz * 2, sz * 0.25);
      ctx.fillStyle = rgba(pal.accent, main ? 0.2 : 0.1); ctx.fill(); ctx.stroke(); void idx;
    });
    ctx.restore();
  };

  const drawLandingFx = (ctx, B) => {
    if (reduce) return;
    for (let i = 0; i < total; i++) {
      const age = clock - landAt[i];
      if (age < 0 || age > 0.6 || boardCell(i).m === -1) continue;
      const c = i % cols, r = Math.floor(i / cols), p = cellCentre(B, c, r), size = cellSize(B, r), u = age / 0.6;
      const col = P.palette[boardCell(i).c].color;
      // ink spreading outward
      ctx.strokeStyle = rgba(col, 0.5 * (1 - u)); ctx.lineWidth = Math.max(1, size * 0.07 * (1 - u)); ctx.beginPath(); ctx.arc(p.x, p.y, size * (0.3 + 0.42 * Math.sqrt(u)), 0, 6.2832); ctx.stroke();
      // dust motes
      ctx.fillStyle = rgba(shade(col, 0.5), 0.8 * (1 - u));
      for (let k = 0; k < 5; k++) { const a = hash(i, k) * 6.2832 + u, rad = size * (0.25 + 0.5 * u * (0.6 + hash(i, k + 9))); ctx.fillRect(p.x + Math.cos(a) * rad - 1, p.y + Math.sin(a) * rad - 1 - u * size * 0.1, 2.2, 2.2); }
    }
  };
  const boardCell = (i) => board[i];

  const drawReveal = (ctx, B, t) => {
    // t = seconds since the check; the sheen crosses the work once, sparkles sit on the finished cells, wrong cells are ringed.
    const rect = polar ? { x: B.cx - B.R, y: B.cy - B.R, w: B.R * 2, h: B.R * 2 } : { x: B.x, y: B.y, w: B.w, h: B.h };
    const p = clamp(t / REVEAL_SECONDS, 0, 1);
    ctx.save();
    if (polar) { ctx.beginPath(); ctx.arc(B.cx, B.cy, B.R, 0, 6.2832); ctx.clip(); } else { ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip(); }
    if (p < 1) {
      const diag = rect.w + rect.h, pos = -0.2 + 1.4 * ease(p), cxb = rect.x + diag * pos - rect.h * 0.5;
      const gr = ctx.createLinearGradient(cxb - diag * 0.12, rect.y, cxb + diag * 0.12 + rect.h * 0.5, rect.y + rect.h);
      gr.addColorStop(0, 'rgba(255,248,220,0)'); gr.addColorStop(0.5, `rgba(255,248,220,${0.42 * Math.sin(Math.PI * Math.min(1, p * 1.05))})`); gr.addColorStop(1, 'rgba(255,248,220,0)');
      ctx.fillStyle = gr; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
    // wrong cells: a dashed ring (shape, not only colour)
    if (wrongAt.length && p > 0.3 && !reduce) {
      const a = Math.min(1, (p - 0.3) / 0.3) * (done ? 0.0 : 1);
      ctx.save(); ctx.globalAlpha = a; ctx.setLineDash([6, 5]); ctx.strokeStyle = pal.bad ?? '#e0603a'; ctx.lineWidth = Math.max(2, (polar ? B.thick : B.cell) * 0.07);
      for (const i of wrongAt) { const c = i % cols, r = Math.floor(i / cols), q = cellCentre(B, c, r), rad = cellSize(B, r) * 0.52; ctx.beginPath(); ctx.arc(q.x, q.y, rad, 0, 6.2832); ctx.stroke(); }
      ctx.restore();
    }
    // sparkles over the finished work
    const n = outcome ? 4 + outcome.stars * 6 : 0;
    if (!reduce) for (let k = 0; k < n; k++) {
      const ph = hash(k, 5) * 0.8, age = (t - 0.2 - ph) / 0.75;
      if (age < 0 || age > 1) continue;
      const q = polar ? { x: B.cx + (hash(k, 1) - 0.5) * B.R * 1.5, y: B.cy + (hash(k, 2) - 0.5) * B.R * 1.5 } : { x: B.x + (0.06 + 0.88 * hash(k, 1)) * B.w, y: B.y + (0.06 + 0.88 * hash(k, 2)) * B.h };
      const cell = polar ? B.thick : B.cell;
      sparkle(ctx, q.x, q.y, cell * (0.35 + 0.35 * hash(k, 3)) * Math.sin(Math.PI * age), k % 3 ? '#fff4c8' : pal.accent, 1);
    }
    // glow rim persists once revealed
    if (outcome && outcome.stars > 0) {
      const gl = 0.5 + 0.5 * ease(p);
      ctx.save(); ctx.strokeStyle = rgba(pal.accent, 0.55 * gl); ctx.lineWidth = Math.max(3, (polar ? B.thick : B.cell) * 0.12); ctx.shadowColor = pal.accent; ctx.shadowBlur = 16 * gl;
      ctx.beginPath(); if (polar) ctx.arc(B.cx, B.cy, B.R + 2, 0, 6.2832); else ctx.rect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4); ctx.stroke(); ctx.restore();
    }
  };

  const drawCard = (ctx, g, L) => {
    const c = L.card; if (!c || !target) return;
    const css = L.u, lite = true;
    // shadow + paper
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
    roundRectPath(ctx, c.x, c.y, c.w, c.h, 14 * css / 1.85); ctx.fillStyle = '#f1e7d0'; ctx.fill(); ctx.restore();
    const gr = ctx.createLinearGradient(c.x, c.y, c.x, c.y + c.h); gr.addColorStop(0, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(120,90,40,0.18)');
    roundRectPath(ctx, c.x, c.y, c.w, c.h, 14 * css / 1.85); ctx.fillStyle = gr; ctx.fill();
    ctx.strokeStyle = rgba(pal.accent, 0.9); ctx.lineWidth = 2.5; roundRectPath(ctx, c.x + 5, c.y + 5, c.w - 10, c.h - 10, 10 * css / 1.85); ctx.stroke();
    ctx.strokeStyle = 'rgba(80,55,20,0.35)'; ctx.lineWidth = 1; roundRectPath(ctx, c.x + 10, c.y + 10, c.w - 20, c.h - 20, 7 * css / 1.85); ctx.stroke();
    // corner studs
    ctx.fillStyle = rgba(pal.accent, 0.95); for (const [qx, qy] of [[c.x + 5, c.y + 5], [c.x + c.w - 5, c.y + 5], [c.x + 5, c.y + c.h - 5], [c.x + c.w - 5, c.y + c.h - 5]]) { ctx.beginPath(); ctx.arc(qx, qy, 4.5, 0, 6.2832); ctx.fill(); }
    // mini reference, drawn with the same material as the work
    const padI = 16 * css / 1.85;
    let mini, textBox;
    if (c.column) {
      const side = Math.min(c.w - padI * 2, c.h - 262 * css / 1.85);
      mini = { x: c.x + (c.w - side) / 2, y: c.y + padI + 8, w: side, h: side }; textBox = { x: c.x + padI, y: mini.y + side + 8, w: c.w - padI * 2, h: c.y + c.h - (mini.y + side + 8) - padI };
    } else {
      const side = c.h - padI * 2 - 4;
      mini = { x: c.x + padI + 2, y: c.y + padI + 2, w: side, h: side }; textBox = { x: mini.x + side + padI, y: c.y + padI, w: c.x + c.w - (mini.x + side + padI) - padI, h: c.h - padI * 2 };
    }
    const mfd = Math.max(5, Math.min(mini.w, mini.h) / (Math.max(cols, rows) * 3.4)) + 2;
    const mb = fitBoard(mini, mfd);
    renderBoard(ctx, mb, { cells: target, lite, anim: false, grid: 0.55, fd: mfd, light: 0.8 });
    // text (caption 13 css px, name 16 css px, numbers 18 css px at the reference scale)
    const cx0 = c.column ? c.x + c.w / 2 : textBox.x, al = c.column ? 'center' : 'left';
    const CAP = g.px(24), NAME = g.px(30);
    let ty = textBox.y + CAP * 0.6;
    ctx.save(); try { ctx.letterSpacing = '3px'; } catch (e) { /* older canvas */ }
    g.label(ctx, 'REFERENCE', cx0, ty, CAP, '#6b4a1f', al, '700');
    try { ctx.letterSpacing = '0px'; } catch (e) { /* ignore */ }
    ctx.restore();
    ty += CAP * 1.25;
    const name = targetName || symName(P.symmetry);
    ctx.font = `700 ${Math.round(NAME)}px Georgia, 'Times New Roman', serif`;
    const lines = [];
    { let line = ''; for (const word of String(name).split(' ')) { const nx = line ? `${line} ${word}` : word; if (line && ctx.measureText(nx).width > textBox.w) { lines.push(line); line = word; } else line = nx; } if (line) lines.push(line); }
    ctx.save(); ctx.font = `700 ${Math.round(NAME)}px Georgia, 'Times New Roman', serif`; ctx.fillStyle = '#3a2810'; ctx.textAlign = al; ctx.textBaseline = 'middle';
    lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, cx0, ty + i * NAME * 1.15));
    ctx.restore();
    ty += (Math.min(2, lines.length) - 0.2) * NAME * 1.15;
    if (targetName) { g.label(ctx, symName(P.symmetry), cx0, ty + CAP * 0.4, CAP, '#6b5a40', al, '500'); ty += CAP * 1.2; }
    // the colours of the tradition, named
    const mhh = Math.max(16, g.px(20)), mTop = textBox.y + textBox.h - mhh - CAP * 2.2;
    {
      let px0 = textBox.x, py0 = ty + CAP * 0.9; const rad = CAP * 0.36;
      ctx.save(); ctx.font = `500 ${Math.round(CAP * 0.92)}px system-ui, sans-serif`;
      for (const pc of P.palette) {
        const w = ctx.measureText(pc.name).width + rad * 2 + 14;
        if (px0 + w > textBox.x + textBox.w && px0 > textBox.x) { px0 = textBox.x; py0 += CAP * 1.15; }
        if (py0 + CAP * 0.5 > mTop) break;
        ctx.fillStyle = pc.color; ctx.strokeStyle = 'rgba(60,40,10,0.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px0 + rad, py0, rad, 0, 6.2832); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#5a4a30'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(pc.name, px0 + rad * 2 + 6, py0 + 1);
        px0 += w + 6;
      }
      ctx.restore();
    }
    // match meter: count-up percentage over a gilded bar
    const mh = Math.max(16, g.px(20)), mw = textBox.w, my = textBox.y + textBox.h - mh;
    const k = clamp(shown / 100, 0, 1);
    const pulse = clock - pulseAt < 0.5 ? 1 - (clock - pulseAt) / 0.5 : 0;
    g.label(ctx, 'Match', textBox.x, my - CAP * 0.85, CAP, '#6b5a40', 'left', '600');
    g.label(ctx, `${Math.round(shown)}%`, textBox.x + mw, my - CAP * 0.9, g.px(32) * (1 + pulse * 0.18), pulse > 0 ? '#9a5d00' : '#3a2810', 'right', '800');
    roundRectPath(ctx, textBox.x, my, mw, mh, mh / 2); ctx.fillStyle = 'rgba(60,40,10,0.25)'; ctx.fill();
    if (k > 0.005) {
      const fw = Math.max(mh, mw * k), mg = ctx.createLinearGradient(textBox.x, 0, textBox.x + mw, 0);
      mg.addColorStop(0, shade(pal.accent, -0.1)); mg.addColorStop(1, pal.good ?? '#58c27d');
      roundRectPath(ctx, textBox.x, my, fw, mh, mh / 2); ctx.fillStyle = mg; ctx.fill();
      ctx.save(); roundRectPath(ctx, textBox.x, my, fw, mh, mh / 2); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(textBox.x, my, fw, mh * 0.4); ctx.restore();
      if (pulse > 0 && !reduce) sparkle(ctx, textBox.x + fw, my + mh / 2, mh * (0.7 + pulse), '#fff4c8', pulse);
    }
  };

  const drawControls = (ctx, g, L) => {
    const css = L.u / 1.85;
    for (const btn of buttons(L)) {
      const pressed = pressId === btn.id && !outcome;
      const sc = pressed ? 0.93 : 1, cx = btn.x + btn.w / 2, cy = btn.y + btn.h / 2;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
      if (btn.id.startsWith('color:')) {
        const i = Number(btn.id.slice(6)), on = sel.c === i, col = P.palette[i].color, lift = on ? 4 : 0;
        // a pot of dye: glossy cap and a body that catches the light
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = on ? 14 : 6; ctx.shadowOffsetY = on ? 7 : 3;
        roundRectPath(ctx, btn.x, btn.y - lift, btn.w, btn.h, 14 * css); ctx.fillStyle = col; ctx.fill(); ctx.restore();
        const gr = ctx.createLinearGradient(btn.x, btn.y - lift, btn.x + btn.w, btn.y + btn.h - lift);
        gr.addColorStop(0, 'rgba(255,255,255,0.42)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.3)');
        roundRectPath(ctx, btn.x, btn.y - lift, btn.w, btn.h, 14 * css); ctx.fillStyle = gr; ctx.fill();
        ctx.strokeStyle = on ? pal.accent : 'rgba(255,255,255,0.35)'; ctx.lineWidth = on ? 4 : 1.5; roundRectPath(ctx, btn.x, btn.y - lift, btn.w, btn.h, 14 * css); ctx.stroke();
        if (on) { // a tick, drawn in the contrasting colour (selection is shape as well as ring)
          const tc = lum(col) > 0.55 ? '#1b1b1b' : '#ffffff'; ctx.strokeStyle = tc; ctx.lineWidth = Math.max(3, btn.w * 0.07); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
          ctx.moveTo(cx - btn.w * 0.18, cy - lift + 1); ctx.lineTo(cx - btn.w * 0.04, cy - lift + btn.h * 0.14); ctx.lineTo(cx + btn.w * 0.2, cy - lift - btn.h * 0.14); ctx.stroke();
        }
      } else if (btn.id.startsWith('motif:')) {
        const mi = Number(btn.id.slice(6)), on = sel.m === mi, lift = on ? 3 : 0;
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = on ? 12 : 5; ctx.shadowOffsetY = on ? 6 : 2;
        roundRectPath(ctx, btn.x, btn.y - lift, btn.w, btn.h, 12 * css); ctx.fillStyle = mix(bgc, '#000', 0.15); ctx.fill(); ctx.restore();
        // a little swatch of the ground so the stamp is seen as it will print
        ctx.save(); roundRectPath(ctx, btn.x, btn.y - lift, btn.w, btn.h, 12 * css); ctx.clip();
        drawGround(ctx, mat === 'tile' ? 'paint' : mat, { x: btn.x, y: btn.y - lift, w: btn.w, h: btn.h }, bgc, btn.w * 0.5, 1, 1, true);
        ctx.restore();
        if (mi === -1) {
          ctx.strokeStyle = pal.ink; ctx.lineWidth = Math.max(3, btn.w * 0.08); ctx.lineCap = 'round'; ctx.beginPath();
          ctx.moveTo(cx - btn.w * 0.2, cy - lift - btn.w * 0.2); ctx.lineTo(cx + btn.w * 0.2, cy - lift + btn.w * 0.2); ctx.moveTo(cx + btn.w * 0.2, cy - lift - btn.w * 0.2); ctx.lineTo(cx - btn.w * 0.2, cy - lift + btn.w * 0.2); ctx.stroke();
        } else drawStamp(ctx, mat, P.motifs[mi], cx, cy - lift, btn.w * 0.76, P.palette[sel.c].color, mi + 3, bgc);
        ctx.strokeStyle = on ? pal.accent : 'rgba(255,255,255,0.25)'; ctx.lineWidth = on ? 4 : 1.5; roundRectPath(ctx, btn.x, btn.y - lift, btn.w, btn.h, 12 * css); ctx.stroke();
      } else {
        const primary = btn.id === 'check';
        const off = !!outcome;
        ctx.save(); ctx.globalAlpha = off ? 0.5 : 1; ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
        roundRectPath(ctx, btn.x, btn.y, btn.w, btn.h, Math.min(18, btn.h / 2)); ctx.fillStyle = primary ? pal.accent : pal.panel; ctx.fill(); ctx.restore();
        const gr = ctx.createLinearGradient(0, btn.y, 0, btn.y + btn.h); gr.addColorStop(0, 'rgba(255,255,255,0.28)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.22)');
        roundRectPath(ctx, btn.x, btn.y, btn.w, btn.h, Math.min(18, btn.h / 2)); ctx.fillStyle = gr; ctx.fill();
        ctx.strokeStyle = primary ? shade(pal.accent, 0.3) : pal.dim; ctx.lineWidth = 2; ctx.stroke();
        g.label(ctx, btn.label, cx, cy + 1, Math.min(g.px(26), btn.h * 0.46), primary ? '#1b1b1b' : pal.ink, 'center', '700');
      }
      ctx.restore();
    }
  };

  // The finished artefact shown large: used by the shell's title screen.
  let artCache = null;
  const artDesign = () => {
    if (artCache) return artCache;
    const R = createRng(titleSeed);
    artCache = generateWith(R).cells;
    return artCache;
  };

  const act = {
    init,
    point(id) {
      if (!layout) return null;
      if (/^\d+,\d+$/.test(id)) { const [c, r] = id.split(',').map(Number); return cellCentre(layout.board, c, r); }
      const btn = buttons(layout).find((x) => x.id === id);
      return btn ? { x: btn.x + btn.w / 2, y: btn.y + btn.h / 2 } : null;
    },
    update(dt, input) {
      clock += dt;
      if (!layout) return;
      const p = input.pointer;
      shown += (score().score - shown) * Math.min(1, dt * 9);
      if (Math.abs(shown - score().score) < 0.4) shown = score().score;
      const sc = score().score;
      if (sc >= lastScore + 3 && target) pulseAt = clock;
      lastScore = sc;
      if (outcome) { if (!done && clock - revealAt >= REVEAL_SECONDS + REVEAL_HOLD) done = outcome; return; }
      const b = layout.board;
      if (p.x !== lastPtr.x || p.y !== lastPtr.y) {
        lastPtr = { x: p.x, y: p.y };
        let h = null;
        if (polar) { if (Math.hypot(p.x - b.cx, p.y - b.cy) < b.R + 2) h = polarHit(b, p.x, p.y); }
        else if (p.x >= b.x && p.y >= b.y && p.x < b.x + b.w && p.y < b.y + b.h) h = { c: Math.floor((p.x - b.x) / b.cell), r: Math.floor((p.y - b.y) / b.cell) };
        if (h) { hover = h; hoverAt = clock; }
      }
      pressId = p.down ? (buttons(layout).find((x) => p.x >= x.x && p.x <= x.x + x.w && p.y >= x.y && p.y <= x.y + x.h)?.id ?? null) : null;
      if (!p.pressed) return;
      if (polar && Math.hypot(p.x - b.cx, p.y - b.cy) < b.R + 2) {
        const h = polarHit(b, p.x, p.y);
        if (h) { hover = h; hoverAt = clock; paint(h.c, h.r); }
        return;
      }
      if (!polar && p.x >= b.x && p.y >= b.y && p.x < b.x + b.w && p.y < b.y + b.h) {
        const c = Math.floor((p.x - b.x) / b.cell), r = Math.floor((p.y - b.y) / b.cell);
        hover = { c, r }; hoverAt = clock; paint(c, r);
        return;
      }
      const hit = buttons(layout).find((x) => p.x >= x.x && p.x <= x.x + x.w && p.y >= x.y && p.y <= x.y + x.h);
      if (!hit) return;
      if (hit.id.startsWith('color:')) { sel.c = Number(hit.id.slice(6)); tone({ freq: 520 + sel.c * 45, dur: 0.06, type: 'sine', vol: 0.09 }); }
      else if (hit.id.startsWith('motif:')) { sel.m = Number(hit.id.slice(6)); tone({ freq: 400 + (sel.m + 1) * 40, dur: 0.05, type: 'triangle', vol: 0.09 }); }
      else if (hit.id === 'undo') { if (undoStack.length) { board = undoStack.pop(); tone({ freq: 300, to: 220, dur: 0.08, type: 'triangle', vol: 0.1 }); } }
      else if (hit.id === 'clear') { undoStack.push(board.map((x) => ({ ...x }))); board = empty(); tone({ freq: 260, to: 150, dur: 0.16, type: 'triangle', vol: 0.1 }); }
      else if (hit.id === 'check') check();
    },
    attract(dt) {
      // Watch and learn: the computer paints the target one symmetric orbit at a time, then checks the work.
      clock += dt;
      shown += (score().score - shown) * Math.min(1, dt * 9);
      if (Math.abs(shown - score().score) < 0.4) shown = score().score;
      if (outcome) { if (!done && clock - revealAt >= REVEAL_SECONDS + REVEAL_HOLD) done = outcome; return; }
      attractT += dt;
      if (attractT < 0.2) return; attractT = 0;
      const script = target ?? artDesign();
      for (let i = 0; i < total; i++) {
        const a = board[i], t = script[i];
        if (t.m !== -1 && (a.m !== t.m || a.c !== t.c)) {
          sel = { m: t.m, c: t.c }; const c = i % cols, r = Math.floor(i / cols); let k = 0;
          for (const [x, y] of orbitOf(c, r)) { const j = at(x, y); board[j] = { ...script[j] }; landAt[j] = clock + k * 0.05; eraseAt[j] = -1e9; k++; }
          hover = { c, r }; hoverAt = clock;
          tone({ freq: 210 + sel.c * 26, to: 120, dur: 0.1, type: 'triangle', vol: 0.12 });
          return;
        }
      }
      const r = score();
      finish(3, 'Pattern complete', 'The computer copied the design', r);
    },
    render(g, area) {
      const { ctx } = g;
      const u = Math.max(1, g.px(0) / 12 * (1)) || 1;
      layout = geometry(area, u > 1.2 ? u : 1.85);
      const L = layout, b = L.board;
      // the work table: a pool of light behind the cloth
      const bc = { x: b.x + (polar ? b.w / 2 : b.w / 2), y: b.y + b.h / 2 };
      const bgG = ctx.createRadialGradient(bc.x, bc.y, 10, bc.x, bc.y, Math.max(area.w, area.h) * 0.75);
      bgG.addColorStop(0, rgba(mix(pal.bg, pal.accent, 0.16), 1)); bgG.addColorStop(1, rgba(pal.bg, 1));
      ctx.fillStyle = bgG; ctx.fillRect(area.x - 12, area.y, area.w + 24, area.h);
      const revealT = revealAt >= 0 ? clock - revealAt : -1;
      const rp = revealT >= 0 ? ease(revealT / REVEAL_SECONDS) : 0;
      const lift = revealT >= 0 && !reduce ? rp : 0;
      ctx.save();
      if (lift > 0) { ctx.translate(bc.x, bc.y); const s = 1 + 0.012 * Math.sin(Math.PI * Math.min(1, rp * 1.0)) + 0.008 * rp; ctx.scale(s, s); ctx.translate(-bc.x, -bc.y); }
      renderBoard(ctx, b, { cells: board, lite: false, anim: true, grid: 1 - rp, fd: L.fd, reveal: lift });
      drawGuides(ctx, b, (1 - rp) * (revealAt >= 0 ? 1 : 1));
      drawGhosts(ctx, b);
      drawLandingFx(ctx, b);
      if (revealT >= 0) drawReveal(ctx, b, revealT);
      // hint: a pulsing ring on the cell to fix
      if (hintCell >= 0 && clock - hintAt < 3.2 && !outcome) {
        const c = hintCell % cols, r = Math.floor(hintCell / cols), q = cellCentre(b, c, r), k = (clock - hintAt) * 2.2;
        ctx.strokeStyle = rgba('#fff4c8', 0.9 * (1 - (clock - hintAt) / 3.2)); ctx.lineWidth = 3;
        for (let n = 0; n < 2; n++) { const f = (k + n * 0.5) % 1; ctx.beginPath(); ctx.arc(q.x, q.y, cellSize(b, r) * (0.45 + 0.5 * f), 0, 6.2832); ctx.globalAlpha = 1 - f; ctx.stroke(); }
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      drawCard(ctx, g, L);
      drawControls(ctx, g, L);
    },
    // A large rendering of the finished craft for the shell's title screen: the work lying on the table with its tool beside it.
    titleArt(g, rect, t) {
      const { ctx } = g, tt = t ?? clock;
      const cells = artDesign();
      ctx.save();
      const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2, S = Math.min(rect.w, rect.h);
      const glow = ctx.createRadialGradient(cx, cy, S * 0.05, cx, cy, S * 0.62);
      glow.addColorStop(0, rgba(pal.accent, 0.3)); glow.addColorStop(1, rgba(pal.accent, 0));
      ctx.fillStyle = glow; ctx.fillRect(rect.x - S * 0.1, rect.y - S * 0.1, rect.w + S * 0.2, rect.h + S * 0.2);
      // the work, slightly turned
      const fd = clamp(S * 0.04, 8, 26);
      const box = { x: cx - S * 0.43, y: cy - S * 0.45, w: S * 0.86, h: S * 0.86 };
      const B = fitBoard(box, fd);
      ctx.translate(cx, cy); ctx.rotate(-0.045 + Math.sin(tt * 0.6) * 0.004); ctx.translate(-cx, -cy);
      renderBoard(ctx, B, { cells, lite: false, anim: false, grid: 0.35, fd, light: 1.1, reveal: 0.6 });
      // sheen drifting across
      const rect2 = polar ? { x: B.cx - B.R, y: B.cy - B.R, w: B.R * 2, h: B.R * 2 } : { x: B.x, y: B.y, w: B.w, h: B.h };
      ctx.save(); if (polar) { ctx.beginPath(); ctx.arc(B.cx, B.cy, B.R, 0, 6.2832); ctx.clip(); } else { ctx.beginPath(); ctx.rect(rect2.x, rect2.y, rect2.w, rect2.h); ctx.clip(); }
      const ph = ((tt * 0.12) % 1.6) - 0.3, dx = rect2.x + (rect2.w + rect2.h) * ph - rect2.h * 0.5;
      const sg = ctx.createLinearGradient(dx, rect2.y, dx + rect2.h * 0.5 + rect2.w * 0.1, rect2.y + rect2.h);
      sg.addColorStop(0, 'rgba(255,248,220,0)'); sg.addColorStop(0.5, 'rgba(255,248,220,0.2)'); sg.addColorStop(1, 'rgba(255,248,220,0)');
      ctx.fillStyle = sg; ctx.fillRect(rect2.x, rect2.y, rect2.w, rect2.h); ctx.restore();
      ctx.restore();
      drawProp(ctx, mat, P, pal, rect, tt, bgc);
    },
    status() {
      const r = score();
      return { score: r.score, max: 100, label: P.mode === 'copy' ? 'Match the design using the same symmetry' : 'Make a balanced design' };
    },
    result: () => done,
    hint() {
      if (!target) return 'Use two or three colours and at least two motifs for a richer design.';
      for (let i = 0; i < total; i++) { const a = board[i], t = target[i]; if (t.m !== -1 && (a.m !== t.m || a.c !== t.c)) { hintCell = i; hintAt = clock; return polar ? `Check ray ${(i % cols) + 1}, ring ${Math.floor(i / cols) + 1} (ring 1 is the centre)` : `Check column ${(i % cols) + 1}, row ${Math.floor(i / cols) + 1}`; } }
      return 'Everything matches: press Check.';
    },
    rules: () => [polar ? `Symmetry: ${P.symmetry}. Each sector you paint is repeated on its partner sectors around the disc.` : `Symmetry: ${P.symmetry}. Each cell you paint is mirrored to its partners.`, `Score: share of cells that match the design.`],
    getState: () => ({ shape: P.shape, rays: polar ? cols : undefined, rings: polar ? rows : undefined, cols, rows, mode: P.mode, board, target, sel, score: score().score }),
  };
  return act;
}

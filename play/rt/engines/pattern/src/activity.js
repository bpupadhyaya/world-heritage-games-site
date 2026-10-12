// Pattern and craft design activity (docs/ENGINE-CONTRACT.md "Activity engines").
// Board = cols x rows cells; each cell holds { m: motif index or -1, c: colour index }. Painting a cell also paints its
// symmetric partners, so every design keeps the tradition's symmetry by construction.
// shape 'polar' (1.3.0): a disc of `rings` concentric rings x `rays` radial sectors; cell (c, r) = (ray c, ring r), ring 0 is innermost, ray 0 starts at the top and runs clockwise.
//   Internally cols = rays and rows = rings, so designs, targets and boards use the same flat layout as the grid.
// `designs`: optional hand-authored targets: [{ name, rows: ["..a..", ...], legend: { a: { m: motifIndex, c: colourIndex } } }] ('.' = empty). One is chosen per round.
export const DEFAULTS = { shape: 'grid', rings: 5, rays: 16, rotateMarks: false, designs: null, cols: 7, rows: 7, symmetry: 'rot4', palette: [{ name: 'Cream', color: '#f3ead2' }, { name: 'Red', color: '#c8452d' }, { name: 'Blue', color: '#27508c' }, { name: 'Gold', color: '#e0a82e' }], background: '#2b2118', grid: '#4d3b2a', motifs: ['solid', 'diamond', 'dot', 'cross'], mode: 'copy', density: 0.45, colorsInTarget: 3 };

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

function drawMotif(ctx, kind, x, y, s, color, bg = '#000') {
  const h = s / 2, q = s * 0.14;
  ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, s * 0.12);
  const path = (pts) => { ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath(); };
  switch (kind) {
    case 'solid': ctx.fillRect(x - h + 1, y - h + 1, s - 2, s - 2); break;
    case 'diamond': path([[x, y - h * 0.9], [x + h * 0.9, y], [x, y + h * 0.9], [x - h * 0.9, y]]); ctx.fill(); break;
    case 'dot': ctx.beginPath(); ctx.arc(x, y, s * 0.26, 0, Math.PI * 2); ctx.fill(); break;
    case 'ring': ctx.beginPath(); ctx.arc(x, y, s * 0.32, 0, Math.PI * 2); ctx.stroke(); break;
    case 'cross': ctx.fillRect(x - q, y - h * 0.8, q * 2, h * 1.6); ctx.fillRect(x - h * 0.8, y - q, h * 1.6, q * 2); break;
    case 'triangle': path([[x, y - h * 0.85], [x + h * 0.85, y + h * 0.7], [x - h * 0.85, y + h * 0.7]]); ctx.fill(); break;
    case 'stripe-h': for (let i = -1; i <= 1; i++) ctx.fillRect(x - h * 0.85, y + i * s * 0.3 - q * 0.7, h * 1.7, q * 1.4); break;
    case 'stripe-v': for (let i = -1; i <= 1; i++) ctx.fillRect(x + i * s * 0.3 - q * 0.7, y - h * 0.85, q * 1.4, h * 1.7); break;
    case 'checker': ctx.fillRect(x - h * 0.8, y - h * 0.8, h * 0.8, h * 0.8); ctx.fillRect(x, y, h * 0.8, h * 0.8); break;
    case 'knot': { // over-under crossing: two bands, the second drawn with a gap where it passes under
      ctx.lineWidth = Math.max(3, s * 0.18); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - h * 0.8, y - h * 0.8); ctx.lineTo(x + h * 0.8, y + h * 0.8); ctx.stroke();
      ctx.save(); ctx.strokeStyle = bg || '#000'; ctx.lineWidth = Math.max(6, s * 0.34); ctx.beginPath(); ctx.moveTo(x + h * 0.8, y - h * 0.8); ctx.lineTo(x - h * 0.8, y + h * 0.8); ctx.stroke(); ctx.restore();
      ctx.lineWidth = Math.max(3, s * 0.18); ctx.beginPath(); ctx.moveTo(x + h * 0.8, y - h * 0.8); ctx.lineTo(x - h * 0.8, y + h * 0.8); ctx.stroke(); ctx.lineCap = 'butt'; break; }
    case 'wave': ctx.lineWidth = Math.max(3, s * 0.14); ctx.beginPath(); for (let i = 0; i <= 12; i++) { const px = x - h * 0.85 + (i / 12) * h * 1.7, py = y + Math.sin((i / 12) * Math.PI * 2) * h * 0.4; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); break;
    case 'zigzag': ctx.lineWidth = Math.max(3, s * 0.14); ctx.beginPath(); [[-0.85, 0.35], [-0.42, -0.35], [0, 0.35], [0.42, -0.35], [0.85, 0.35]].forEach(([dx, dy], i) => (i ? ctx.lineTo(x + dx * h, y + dy * h) : ctx.moveTo(x + dx * h, y + dy * h))); ctx.stroke(); break;
    case 'spiral': ctx.lineWidth = Math.max(3, s * 0.12); ctx.beginPath(); for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 4, r = (i / 40) * h * 0.8; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); break;
    case 'fret': ctx.lineWidth = Math.max(3, s * 0.13); ctx.beginPath(); [[-0.8, 0.8], [-0.8, -0.8], [0.8, -0.8], [0.8, 0.3], [-0.2, 0.3], [-0.2, -0.3], [0.3, -0.3]].forEach(([dx, dy], i) => (i ? ctx.lineTo(x + dx * h, y + dy * h) : ctx.moveTo(x + dx * h, y + dy * h))); ctx.stroke(); break;
    case 'leaf': ctx.beginPath(); ctx.moveTo(x - h * 0.8, y + h * 0.5); ctx.quadraticCurveTo(x - h * 0.2, y - h * 0.95, x + h * 0.85, y - h * 0.6); ctx.quadraticCurveTo(x + h * 0.3, y + h * 0.8, x - h * 0.8, y + h * 0.5); ctx.fill(); break;
    case 'hexagon': { const pts = []; for (let i = 0; i < 6; i++) { const ang = (i * Math.PI) / 3; pts.push([x + Math.cos(ang) * h * 0.85, y + Math.sin(ang) * h * 0.85]); } path(pts); ctx.fill(); break; }
    case 'arch': ctx.beginPath(); ctx.moveTo(x - h * 0.7, y + h * 0.8); ctx.lineTo(x - h * 0.7, y - h * 0.1); ctx.arc(x, y - h * 0.1, h * 0.7, Math.PI, 0); ctx.lineTo(x + h * 0.7, y + h * 0.8); ctx.closePath(); ctx.fill(); break;
    case 'xstitch': ctx.lineWidth = Math.max(3, s * 0.16); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - h * 0.6, y - h * 0.6); ctx.lineTo(x + h * 0.6, y + h * 0.6); ctx.moveTo(x + h * 0.6, y - h * 0.6); ctx.lineTo(x - h * 0.6, y + h * 0.6); ctx.stroke(); ctx.lineCap = 'butt'; break;
    case 'star': { const pts = []; for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 - Math.PI / 2, r = i % 2 ? h * 0.38 : h * 0.9; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } path(pts); ctx.fill(); break; }
    default: break;
  }
}

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
function drawOriented(ctx, kind, x, y, s, color, bg, t) {
  if (!t || (!t.rot && !t.fx && !t.fy)) return drawMotif(ctx, kind, x, y, s, color, bg);
  ctx.save(); ctx.translate(x, y); ctx.rotate((t.rot * Math.PI) / 2); ctx.scale(t.fx ? -1 : 1, t.fy ? -1 : 1);
  drawMotif(ctx, kind, 0, 0, s, color, bg); ctx.restore();
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
function drawRadial(ctx, kind, x, y, s, color, bg, ang, flip) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang + Math.PI / 2); if (flip) ctx.scale(-1, 1);
  drawMotif(ctx, kind, 0, 0, s, color, bg); ctx.restore();
}

export function createActivity(userParams, env) {
  const P = { ...DEFAULTS, ...userParams };
  const { rng, palette: pal } = env;
  const polar = P.shape === 'polar';
  if (polar) validatePolarDesigns(P);
  const psym = polar ? parsePolarSymmetry(P.symmetry, P.rays) : null;
  const cols = polar ? P.rays : P.cols, rows = polar ? P.rings : P.rows;
  const total = cols * rows;
  const orbitOf = (c, r) => (polar ? polarOrbit(psym, c, cols).map((x) => [x, r]) : orbit(P.symmetry, c, r, cols, rows));
  let board, target, sel, undoStack, tip, done, layout = null;
  const empty = () => Array.from({ length: total }, () => ({ m: -1, c: 0 }));
  const at = (c, r) => r * cols + c;

  const fromDesign = (d) => {
    const t = empty();
    d.rows.forEach((row, r) => [...row].forEach((ch, c) => { const g = d.legend[ch]; if (g && r < rows && c < cols) t[at(c, r)] = { m: g.m, c: g.c }; }));
    return t;
  };
  const generate = () => {
    if (P.designs && P.designs.length) return fromDesign(P.designs[rng.int(P.designs.length)]);
    const t = empty();
    const colors = Math.min(P.colorsInTarget, P.palette.length);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (t[at(c, r)].m !== -1 || !rng.chance(P.density)) continue;
      const cell = { m: rng.int(P.motifs.length), c: rng.int(colors) };
      for (const [x, y] of orbitOf(c, r)) t[at(x, y)] = { ...cell };
    }
    if (t.every((x) => x.m === -1)) t[at(Math.floor(cols / 2), Math.floor(rows / 2))] = { m: 0, c: 0 };
    return t;
  };

  const init = () => { board = empty(); target = P.mode === 'copy' ? generate() : null; sel = { m: 0, c: Math.min(1, P.palette.length - 1) }; undoStack = []; tip = ''; done = null; };
  init();

  const paint = (c, r) => {
    undoStack.push(board.map((x) => ({ ...x })));
    const erase = sel.m === -1;
    const same = board[at(c, r)].m === sel.m && board[at(c, r)].c === sel.c;
    for (const [x, y] of orbitOf(c, r)) board[at(x, y)] = erase || same ? { m: -1, c: 0 } : { m: sel.m, c: sel.c };
    env.audio?.tone({ freq: 360 + sel.c * 60, dur: 0.05 });
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

  // Disc geometry inside a square [x, y, D]: centre, outer radius, hub radius, ring thickness.
  const discOf = (x, y, D) => { const R = D / 2 - 3, R0 = R * 0.1; return { cx: x + D / 2, cy: y + D / 2, R, R0, thick: (R - R0) / rows }; };
  const step = (2 * Math.PI) / cols;
  const sectorAngle = (c) => -Math.PI / 2 + (c + 0.5) * step;           // canvas angle of a sector centre
  const sectorCentre = (d, c, r) => { const rad = d.R0 + (r + 0.5) * d.thick, a = sectorAngle(c); return { x: d.cx + Math.cos(a) * rad, y: d.cy + Math.sin(a) * rad }; };
  const polarHit = (d, px, py) => {
    const dx = px - d.cx, dy = py - d.cy, dist = Math.hypot(dx, dy);
    if (dist < d.R0 || dist >= d.R) return null;
    let ang = Math.atan2(dy, dx) + Math.PI / 2; ang = ((ang % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    return { c: Math.min(cols - 1, Math.floor(ang / step)), r: Math.min(rows - 1, Math.floor((dist - d.R0) / d.thick)) };
  };
  // Draw a disc of cells (the board or the target preview) into square d.
  const drawDisc = (ctx, d, cells, showGrid, g) => {
    ctx.fillStyle = P.background; ctx.beginPath(); ctx.arc(d.cx, d.cy, d.R, 0, Math.PI * 2); ctx.fill();
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const cell = cells[at(c, r)]; if (cell.m === -1) continue;
      const mid = d.R0 + (r + 0.5) * d.thick, size = Math.min(d.thick, mid * step) * 0.92, p = sectorCentre(d, c, r);
      const half = Math.floor(((c + 0.5) * 2) / psym.step), flip = psym.mirror && half % 2 === 1;
      drawRadial(ctx, P.motifs[cell.m], p.x, p.y, size, P.palette[cell.c].color, P.background, sectorAngle(c), flip);
    }
    ctx.strokeStyle = P.grid; ctx.lineWidth = 1;
    for (let r = 0; r <= rows; r++) { ctx.beginPath(); ctx.arc(d.cx, d.cy, d.R0 + r * d.thick, 0, Math.PI * 2); ctx.stroke(); }
    if (showGrid) for (let c = 0; c < cols; c++) { const a = -Math.PI / 2 + c * step; ctx.beginPath(); ctx.moveTo(d.cx + Math.cos(a) * d.R0, d.cy + Math.sin(a) * d.R0); ctx.lineTo(d.cx + Math.cos(a) * d.R, d.cy + Math.sin(a) * d.R); ctx.stroke(); }
  };

  const geometry = (a) => {
    const landscape = a.w > a.h * 1.15;
    const gap = 10;
    const swatch = Math.min(56, Math.max(40, a.w / 9));
    let boardArea, targetArea = null, palArea;
    if (landscape) {
      const colW = Math.max(swatch * 2 + 30, a.w * 0.22);
      palArea = { x: a.x + a.w - colW, y: a.y, w: colW, h: a.h };
      const left = a.w - colW - gap;
      if (target) { targetArea = { x: a.x, y: a.y + 18, w: left * 0.3, h: left * 0.3 }; boardArea = { x: a.x + left * 0.3 + gap, y: a.y, w: left * 0.7 - gap, h: a.h }; }
      else boardArea = { x: a.x, y: a.y, w: left, h: a.h };
    } else {
      const palH = swatch * 2 + 70;
      palArea = { x: a.x, y: a.y + a.h - palH, w: a.w, h: palH };
      const rest = a.h - palH - gap;
      if (target) { const th = Math.min(rest * 0.28, a.w * 0.42); targetArea = { x: a.x + (a.w - th) / 2, y: a.y + 18, w: th, h: th }; boardArea = { x: a.x, y: a.y + th + gap + 18, w: a.w, h: rest - th - gap - 18 }; }
      else boardArea = { x: a.x, y: a.y, w: a.w, h: rest };
    }
    if (polar) {
      const D = Math.floor(Math.min(boardArea.w, boardArea.h)), x0 = boardArea.x + (boardArea.w - D) / 2, y0 = boardArea.y + (boardArea.h - D) / 2;
      return { landscape, swatch, board: { x: x0, y: y0, w: D, h: D, cell: D, ...discOf(x0, y0, D) }, target: targetArea, pal: palArea };
    }
    const cell = Math.floor(Math.min(boardArea.w / cols, boardArea.h / rows));
    const bw = cell * cols, bh = cell * rows;
    const b = { x: boardArea.x + (boardArea.w - bw) / 2, y: boardArea.y + (boardArea.h - bh) / 2, w: bw, h: bh, cell };
    return { landscape, swatch, board: b, target: targetArea, pal: palArea };
  };

  const buttons = (L) => {
    const sw = L.swatch, out = [];
    const p = L.pal;
    const perRow = L.landscape ? 2 : 6;
    const startX = L.landscape ? p.x + 6 : p.x + (p.w - Math.min(perRow, P.palette.length) * (sw + 6)) / 2 + 3;
    P.palette.forEach((_, i) => out.push({ id: `color:${i}`, x: startX + (i % perRow) * (sw + 6), y: p.y + 6 + Math.floor(i / perRow) * (sw + 6), w: sw, h: sw }));
    const my = p.y + 6 + (Math.floor((P.palette.length - 1) / perRow) + 1) * (sw + 6) + 8;
    const all = [...P.motifs.map((_, i) => i), -1];
    const mPer = L.landscape ? 2 : 7;
    const mStartX = L.landscape ? p.x + 6 : p.x + (p.w - Math.min(mPer, all.length) * (sw + 6)) / 2 + 3;
    all.forEach((mi, i) => out.push({ id: `motif:${mi}`, x: mStartX + (i % mPer) * (sw + 6), y: my + Math.floor(i / mPer) * (sw + 6), w: sw, h: sw }));
    const lastRow = my + (Math.floor((all.length - 1) / mPer) + 1) * (sw + 6) + 6;
    const bw = L.landscape ? p.w - 12 : Math.min(150, (p.w - 24) / 3);
    const names = [['check', 'Check'], ['undo', 'Undo'], ['clear', 'Clear']];
    names.forEach(([id, t], i) => out.push({ id, label: t, x: L.landscape ? p.x + 6 : p.x + 6 + i * (bw + 8), y: L.landscape ? lastRow + i * (sw * 0.8 + 6) : lastRow, w: bw, h: L.landscape ? sw * 0.8 : Math.min(sw * 0.9, Math.max(36, p.y + p.h - lastRow - 2)) }));
    return out;
  };

  const act = {
    init,
    point(id) {
      if (!layout) return null;
      if (/^\d+,\d+$/.test(id) && polar) { const [c, r] = id.split(',').map(Number); return sectorCentre(layout.board, c, r); }
      if (/^\d+,\d+$/.test(id)) { const [c, r] = id.split(',').map(Number); const b = layout.board; return { x: b.x + (c + 0.5) * b.cell, y: b.y + (r + 0.5) * b.cell }; }
      const btn = buttons(layout).find((x) => x.id === id);
      return btn ? { x: btn.x + btn.w / 2, y: btn.y + btn.h / 2 } : null;
    },
    update(dt, input) {
      if (!layout || done) return;
      const p = input.pointer;
      if (!p.pressed) return;
      const b = layout.board;
      if (polar && Math.hypot(p.x - b.cx, p.y - b.cy) < b.R + 2) {
        const h = polarHit(b, p.x, p.y);
        if (h) paint(h.c, h.r);
        return;
      }
      if (!polar && p.x >= b.x && p.y >= b.y && p.x < b.x + b.w && p.y < b.y + b.h) {
        paint(Math.floor((p.x - b.x) / b.cell), Math.floor((p.y - b.y) / b.cell));
        return;
      }
      const hit = buttons(layout).find((x) => p.x >= x.x && p.x <= x.x + x.w && p.y >= x.y && p.y <= x.y + x.h);
      if (!hit) return;
      if (hit.id.startsWith('color:')) sel.c = Number(hit.id.slice(6));
      else if (hit.id.startsWith('motif:')) sel.m = Number(hit.id.slice(6));
      else if (hit.id === 'undo') { if (undoStack.length) board = undoStack.pop(); }
      else if (hit.id === 'clear') { undoStack.push(board.map((x) => ({ ...x }))); board = empty(); }
      else if (hit.id === 'check') {
        const r = score();
        const stars = r.score >= 98 ? 3 : r.score >= 85 ? 2 : r.score >= 60 ? 1 : 0;
        done = { score: r.score, max: 100, stars, headline: stars === 3 ? 'A faithful pattern!' : stars ? 'A good pattern' : 'Keep practising', detail: target ? `${r.correct} cells right, ${r.wrong} to fix` : 'A balanced, symmetric design' };
      }
    },
    attract(dt, input) {
      // Watch and learn: the computer paints the target cell by cell, one symmetric orbit at a time.
      if (done || !target) return;
      layout = layout; act._t = (act._t ?? 0) + dt;
      if (act._t < 0.18) return; act._t = 0;
      for (let i = 0; i < total; i++) {
        const a = board[i], t = target[i];
        if (t.m !== -1 && (a.m !== t.m || a.c !== t.c)) { sel = { m: t.m, c: t.c }; const c = i % cols, r = Math.floor(i / cols); for (const [x, y] of orbitOf(c, r)) board[at(x, y)] = { ...target[at(x, y)] }; return; }
      }
      const r = score();
      done = { score: r.score, max: 100, stars: 3, headline: 'Pattern complete', detail: 'The computer copied the design' };
    },
    render(g, area) {
      const { ctx } = g;
      layout = geometry(area);
      const L = layout, b = L.board;
      // board
      if (polar) {
        drawDisc(ctx, b, board, true, g);
        ctx.strokeStyle = pal.accent; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.cx, b.cy, b.R, 0, Math.PI * 2); ctx.stroke();
      } else {
      ctx.fillStyle = P.background; ctx.fillRect(b.x, b.y, b.w, b.h);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const cell = board[at(c, r)], cx = b.x + (c + 0.5) * b.cell, cy = b.y + (r + 0.5) * b.cell;
        if (cell.m !== -1) drawOriented(ctx, P.motifs[cell.m], cx, cy, b.cell * 0.9, P.palette[cell.c].color, P.background, P.rotateMarks ? orient(P.symmetry, c, r, cols, rows) : null);
      }
      ctx.strokeStyle = P.grid; ctx.lineWidth = 1;
      for (let i = 0; i <= cols; i++) { ctx.beginPath(); ctx.moveTo(b.x + i * b.cell, b.y); ctx.lineTo(b.x + i * b.cell, b.y + b.h); ctx.stroke(); }
      for (let i = 0; i <= rows; i++) { ctx.beginPath(); ctx.moveTo(b.x, b.y + i * b.cell); ctx.lineTo(b.x + b.w, b.y + i * b.cell); ctx.stroke(); }
      ctx.strokeStyle = pal.accent; ctx.lineWidth = 3; ctx.strokeRect(b.x, b.y, b.w, b.h);
      }
      // target preview
      if (target && L.target && polar) {
        const t = L.target, D = Math.floor(Math.min(t.w, t.h)), tx = t.x + (t.w - D) / 2, ty = t.y + (t.h - D) / 2, d = discOf(tx, ty, D);
        drawDisc(ctx, d, target, false, g);
        ctx.strokeStyle = pal.dim; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(d.cx, d.cy, d.R, 0, Math.PI * 2); ctx.stroke();
        g.label(ctx, 'Copy this design', d.cx, ty - 9, 15, pal.dim, 'center', '500');
      } else if (target && L.target) {
        const t = L.target, cs = Math.floor(Math.min(t.w / cols, t.h / rows)), tw = cs * cols, th = cs * rows, tx = t.x + (t.w - tw) / 2, ty = t.y + (t.h - th) / 2;
        ctx.fillStyle = P.background; ctx.fillRect(tx, ty, tw, th);
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const cell = target[at(c, r)]; if (cell.m !== -1) drawOriented(ctx, P.motifs[cell.m], tx + (c + 0.5) * cs, ty + (r + 0.5) * cs, cs * 0.9, P.palette[cell.c].color, P.background, P.rotateMarks ? orient(P.symmetry, c, r, cols, rows) : null); }
        ctx.strokeStyle = pal.dim; ctx.lineWidth = 2; ctx.strokeRect(tx, ty, tw, th);
        g.label(ctx, 'Copy this design', tx + tw / 2, ty - 9, 15, pal.dim, 'center', '500');
      }
      // palette
      for (const btn of buttons(L)) {
        if (btn.id.startsWith('color:')) {
          const i = Number(btn.id.slice(6));
          ctx.fillStyle = P.palette[i].color; g.rr(ctx, btn.x, btn.y, btn.w, btn.h, 8); ctx.fill();
          ctx.strokeStyle = sel.c === i ? pal.accent : pal.dim; ctx.lineWidth = sel.c === i ? 4 : 1.5; ctx.stroke();
        } else if (btn.id.startsWith('motif:')) {
          const mi = Number(btn.id.slice(6));
          ctx.fillStyle = P.background; g.rr(ctx, btn.x, btn.y, btn.w, btn.h, 8); ctx.fill();
          if (mi === -1) { g.label(ctx, '✕', btn.x + btn.w / 2, btn.y + btn.h / 2, btn.w * 0.5, pal.dim); }
          else drawMotif(ctx, P.motifs[mi], btn.x + btn.w / 2, btn.y + btn.h / 2, btn.w * 0.8, P.palette[sel.c].color, P.background);
          ctx.strokeStyle = sel.m === mi ? pal.accent : pal.dim; ctx.lineWidth = sel.m === mi ? 4 : 1.5; ctx.stroke();
        } else {
          g.rr(ctx, btn.x, btn.y, btn.w, btn.h, 12); ctx.fillStyle = btn.id === 'check' ? pal.accent : pal.panel; ctx.fill();
          ctx.strokeStyle = btn.id === 'check' ? pal.accent : pal.dim; ctx.lineWidth = 2; ctx.stroke();
          g.label(ctx, btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2, Math.min(24, btn.h * 0.5), btn.id === 'check' ? '#1b1b1b' : pal.ink);
        }
      }
    },
    status() {
      const r = score();
      return { score: r.score, max: 100, label: P.mode === 'copy' ? 'Match the design using the same symmetry' : 'Make a balanced design' };
    },
    result: () => done,
    hint() {
      if (!target) return 'Use two or three colours and at least two motifs for a richer design.';
      for (let i = 0; i < total; i++) { const a = board[i], t = target[i]; if (t.m !== -1 && (a.m !== t.m || a.c !== t.c)) return polar ? `Check ray ${(i % cols) + 1}, ring ${Math.floor(i / cols) + 1} (ring 1 is the centre)` : `Check column ${(i % cols) + 1}, row ${Math.floor(i / cols) + 1}`; }
      return 'Everything matches: press Check.';
    },
    rules: () => [polar ? `Symmetry: ${P.symmetry}. Each sector you paint is repeated on its partner sectors around the disc.` : `Symmetry: ${P.symmetry}. Each cell you paint is mirrored to its partners.`, `Score: share of cells that match the design.`],
    getState: () => ({ shape: P.shape, rays: polar ? cols : undefined, rings: polar ? rows : undefined, cols, rows, mode: P.mode, board, target, sel, score: score().score }),
  };
  return act;
}

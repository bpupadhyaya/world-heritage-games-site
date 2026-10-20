// shape-craft `mat` technique (1.13.0): flat plaiting seen from above, the floor plan of a mat, an over-and-under weave laid strip by strip.
// The player lays the visible crossing of every strip, row by row from the loom end (as in `coil` and `basket`, same score). Not yet laid,
// the long warp strips lie bare in the unwoven part of the mat. Each crossing is one strip lit as a flat splint, a round reed, a palm
// leaflet, twisted jute, silky grass or rope; the weave (plain, twill, check, herringbone) decides which direction shows on top.
// Frames: none, bar (warp tied to a pole), loom (beams and a reed comb that follows the weaving), frame (a wooden bed with rope), stakes.
import { registerTechnique } from './registry.js';
import { clamp, starsFor, hash } from './geom.js';
import { tint, rrect, rgba, mix, shelf } from './fx.js';
import { lg, rg, ell, TAU } from './props.js';
import { wallBand, dockHeight } from './scenes.js';

export const MAT_STYLES = ['cane', 'rush', 'palm', 'jute', 'grass', 'cord', 'buri', 'hana'];
export const MAT_WEAVES = ['plain', 'twill', 'twill21', 'check', 'herring'];
export const MAT_DESIGNS = ['medallion', 'diamonds', 'zigzag', 'steps', 'stripes', 'checks', 'lattice', 'bands', 'meander', 'blocks'];
export const MAT_DEFAULTS = {
  design: 'medallion', weave: 'plain', style: 'cane', cols: 15, rows: 15, period: 6, colors: 3, edge: 'turned', frame: 'none', bare: 'strips', gap: 0.07, sheen: 0.5, cellH: 1, binding: '#7a3a22', under: '#2a1d12',
  palette: [{ name: 'Cane', color: '#e2c88e' }, { name: 'Dark', color: '#3a2a1c' }, { name: 'Red', color: '#a8402a' }], guide: true, tolerance: 0, variation: 0,
};

// which direction shows on top at (r,c): true = the warp (vertical strip), false = the weft
export const warpTop = (weave, r, c) => {
  switch (weave) {
    case 'twill': return ((r + c) % 4) < 2;
    case 'twill21': return ((r + c) % 3) === 0;
    case 'check': return (((r >> 1) + (c >> 1)) & 1) === 0;
    case 'herring': { const m = c % 8, q = m < 4 ? m : 7 - m; return ((r + q) % 4) < 2; }
    default: return ((r + c) & 1) === 0;
  }
};

// colour index for the target, symmetric left-right and top-bottom (a mat is built from its middle)
function designColor(P, r, c, R, C, nC, ph) {
  const mr = Math.min(r, R - 1 - r), mc = Math.min(c, C - 1 - c), ring = Math.min(mr, mc);
  const A = 1, B = nC > 2 ? 2 : 1, D = nC > 3 ? 3 : B;
  const dx = c - (C - 1) / 2, dy = r - (R - 1) / 2, per = P.period, a1 = ph ? B : A, b1 = ph ? A : B;
  switch (P.design) {
    case 'diamonds': {
      if (ring === 0) return A; if (ring === 1) return 0;
      const ex = Math.abs((c % per) - (per - 1) / 2), ey = Math.abs((r % per) - (per - 1) / 2), e = ex + ey;
      return e < 1.1 ? b1 : e <= (per - 1) / 2 ? a1 : (e <= (per - 1) / 2 + 1 && D !== B && ((r + c) & 1) ? D : 0);
    }
    case 'zigzag': {
      if (mr === 0) return A;
      const zig = Math.abs(((c + ph * 2) % (2 * per)) - per), k = Math.floor((r + zig) / 2) % 4;
      return k === 1 ? a1 : k === 3 ? b1 : 0;
    }
    case 'steps': {
      if (ring === 0) return A; if (ring === 1) return 0;
      const d = Math.abs(dx) + Math.abs(dy), k = Math.floor(d / 2) % 4;
      return k === 0 ? b1 : k === 2 ? a1 : (k === 3 && D !== B && Math.floor(d) % 2 ? D : 0);
    }
    case 'stripes': {
      const seq = ph ? [3, 1, 2, 1, 1, 2] : [2, 1, 1, 3, 1, 2], tot = seq.reduce((s, v) => s + v, 0); let m = mc % tot, i = 0;
      while (m >= seq[i]) { m -= seq[i]; i++; }
      if (mr === 0) return A;
      return [0, a1, 0, b1][i % 4];
    }
    case 'checks': {
      if (ring === 0) return A; if (ring === 1) return 0;
      const ch = ((mc >> 1) + (mr >> 1)) & 1;
      return ring === 2 ? b1 : ch ? (nC > 2 && mr === Math.floor((R - 1) / 2) && mc === Math.floor((C - 1) / 2) ? b1 : a1) : 0;
    }
    case 'lattice': {
      if (mr === 0) return A; if (mr === 1) return 0; if (mr === 2) return b1; if (mr === 3) return 0;
      const u = (c + r) % per, v = (c - r + 400) % per, onA = u === 0, onB = v === 0;
      return onA && onB ? b1 : onA || onB ? a1 : 0;
    }
    case 'bands': {
      if (mr === 0) return A; if (mr === 1) return b1; if (mr === 2) return 0; if (mr === 3) return a1;
      if (ring <= 3) return 0;
      return (r % 4 === 2 && c % 4 === 2) ? a1 : 0;
    }
    case 'meander': { // a key border and a field of stepped hooks
      if (ring === 0) return A; if (ring === 1) return 0;
      if (ring === 2) return ((mr + mc + (r < C ? 0 : 1)) % 4 < 2 ? b1 : 0);
      const u = (c + 2 * ph) % 6, v = r % 6, hook = (u === 1 && v <= 3) || (v === 1 && u >= 1 && u <= 4) || (u === 4 && v >= 1 && v <= 4) || (v === 4 && u >= 2 && u <= 4);
      return hook ? a1 : 0;
    }
    case 'blocks': { // large squares set on the diagonal, alternating colours (flat blocks of a rush mat)
      if (ring === 0) return A;
      const q = Math.floor((r + 1) / 3) + Math.floor((c + 1) / 3);
      return ring === 1 ? 0 : (q & 1) ? (nC > 2 && ((r + c) % 3 === 0) ? b1 : a1) : 0;
    }
    default: { // medallion: border bands and a diamond in the middle, small diamonds in the corners
      if (ring === 0) return A; if (ring === 1) return 0; if (ring === 2) return b1; if (ring === 3) return 0;
      const d = Math.abs(dx) / (C / 2) + Math.abs(dy) / (R / 2);
      if (d < 0.2) return b1; if (d < 0.36) return 0; if (d < 0.54) return a1; if (d < 0.66) return 0; if (d < 0.78) return ph ? D : B;
      const cd = Math.abs(mc - 5.5) + Math.abs(mr - 5.5);
      return cd < 1.6 && ring >= 4 ? a1 : 0;
    }
  }
}

// ---- one strip piece, drawn in a local frame: the strip runs along y, thickness along x, light from the left ---------------------------
function piece(ctx, T, L, col, style, o) {
  const round = style === 'rush' || style === 'cord', rad = round ? T * 0.46 : style === 'jute' ? T * 0.2 : style === 'grass' ? T * 0.22 : T * 0.14;
  const lit = o.lit ?? 0;
  ctx.fillStyle = round
    ? lg(ctx, -T / 2, 0, T / 2, 0, [[0, tint(col, 0.04)], [0.26, tint(col, 0.2 + lit)], [0.58, col], [1, tint(col, -0.42)]])
    : lg(ctx, -T / 2, 0, T / 2, 0, [[0, tint(col, 0.12 + lit)], [0.5, col], [1, tint(col, -0.28)]]);
  rrect(ctx, -T / 2, -L / 2, T, L, rad); ctx.fill();
  if (!o.small) {
    ctx.save(); rrect(ctx, -T / 2, -L / 2, T, L, rad); ctx.clip();
    const k = o.k ?? 0.5;
    if (style === 'cane') {
      ctx.strokeStyle = rgba(tint(col, -0.55), 0.24); ctx.lineWidth = Math.max(0.7, T * 0.035);
      for (const f of [-0.3, -0.12, 0.06, 0.22, 0.36]) { ctx.beginPath(); ctx.moveTo(T * (f + (k - 0.5) * 0.06), -L / 2); ctx.lineTo(T * (f + (k - 0.5) * 0.06 + 0.02), L / 2); ctx.stroke(); }
      ctx.fillStyle = lg(ctx, 0, -L / 2, 0, L / 2, [[0, 'rgba(255,255,255,0)'], [0.3, `rgba(255,255,255,${0.3 * o.sheen})`], [0.7, `rgba(255,255,255,${0.1 * o.sheen})`], [1, 'rgba(255,255,255,0)']]);
      ctx.fillRect(-T * 0.3, -L / 2, T * 0.13, L);
    } else if (style === 'rush') {
      ctx.strokeStyle = rgba(tint(col, -0.55), 0.35); ctx.lineWidth = Math.max(0.7, T * 0.05);
      const ny = (k - 0.5) * L * 0.5; ctx.beginPath(); ctx.moveTo(-T * 0.32, ny); ctx.lineTo(T * 0.3, ny + T * 0.07); ctx.stroke();
      ctx.strokeStyle = rgba(tint(col, -0.4), 0.16); ctx.beginPath(); ctx.moveTo(T * 0.08, -L / 2); ctx.lineTo(T * 0.1, L / 2); ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${0.26 * o.sheen})`; ctx.fillRect(-T * 0.22, -L / 2, T * 0.1, L);
    } else if (style === 'palm') {
      ctx.strokeStyle = rgba(tint(col, -0.5), 0.3); ctx.lineWidth = Math.max(0.8, T * 0.045);
      ctx.beginPath(); ctx.moveTo(T * 0.02, -L / 2); ctx.lineTo(0, L / 2); ctx.stroke();
      ctx.strokeStyle = rgba(tint(col, 0.5), 0.3); ctx.beginPath(); ctx.moveTo(-T * 0.06, -L / 2); ctx.lineTo(-T * 0.07, L / 2); ctx.stroke();
      ctx.strokeStyle = rgba(tint(col, -0.4), 0.12); for (let q = -3; q <= 3; q++) { if (!q) continue; ctx.beginPath(); ctx.moveTo(q * T * 0.11, -L / 2); ctx.lineTo(q * T * 0.1 + T * 0.02, L / 2); ctx.stroke(); }
    } else if (style === 'jute') {
      ctx.strokeStyle = rgba(tint(col, -0.55), 0.38); ctx.lineWidth = Math.max(0.9, T * 0.07);
      const st = Math.max(3.5, T * 0.34); for (let y = -L / 2 + ((k * st) % st); y < L / 2; y += st) { ctx.beginPath(); ctx.moveTo(-T / 2, y); ctx.lineTo(T / 2, y + T * 0.22); ctx.stroke(); }
      ctx.strokeStyle = rgba(tint(col, 0.35), 0.22); ctx.lineWidth = Math.max(0.7, T * 0.04); for (let y = -L / 2 + ((k * st) % st) + st * 0.5; y < L / 2; y += st) { ctx.beginPath(); ctx.moveTo(-T / 2, y); ctx.lineTo(T / 2, y + T * 0.22); ctx.stroke(); }
    } else if (style === 'cord') {
      const st = Math.max(3.5, T * 0.75);
      for (let y = -L / 2 + ((k * st) % st) - st; y < L / 2; y += st) {
        ctx.strokeStyle = rgba(tint(col, -0.6), 0.45); ctx.lineWidth = Math.max(1, T * 0.1); ctx.beginPath(); ctx.moveTo(-T / 2, y + T * 0.3); ctx.quadraticCurveTo(0, y - T * 0.05, T / 2, y - T * 0.35); ctx.stroke();
        ctx.strokeStyle = rgba(tint(col, 0.4), 0.3); ctx.lineWidth = Math.max(0.8, T * 0.06); ctx.beginPath(); ctx.moveTo(-T / 2, y + T * 0.43); ctx.quadraticCurveTo(0, y + T * 0.08, T / 2, y - T * 0.22); ctx.stroke();
      }
    } else if (style === 'grass') {
      ctx.fillStyle = `rgba(255,255,255,${0.34 * o.sheen})`; ctx.fillRect(-T * 0.28, -L / 2, T * 0.2, L);
      ctx.strokeStyle = rgba(tint(col, -0.4), 0.1); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(T * 0.12, -L / 2); ctx.lineTo(T * 0.12, L / 2); ctx.stroke();
    } else if (style === 'buri') {
      ctx.strokeStyle = rgba(tint(col, 0.35), 0.28); ctx.lineWidth = Math.max(0.8, T * 0.05);
      ctx.beginPath(); ctx.moveTo(-T * 0.36, -L / 2); ctx.lineTo(-T * 0.36, L / 2); ctx.moveTo(T * 0.36, -L / 2); ctx.lineTo(T * 0.36, L / 2); ctx.stroke();
      ctx.strokeStyle = rgba(tint(col, -0.5), 0.12); ctx.beginPath(); for (let q = -1; q <= 1; q++) { ctx.moveTo(q * T * 0.2, -L / 2); ctx.lineTo(q * T * 0.2 + T * 0.03, L / 2); } ctx.stroke();
    } else if (style === 'hana') {
      ctx.strokeStyle = rgba(tint(col, -0.55), 0.2); ctx.lineWidth = Math.max(0.7, T * 0.04);
      ctx.beginPath(); for (let y = -L / 2 + 2; y < L / 2; y += Math.max(2.5, L * 0.13)) { ctx.moveTo(-T / 2, y); ctx.lineTo(T / 2, y + 0.6); } ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(-T * 0.35, -L / 2, T * 0.12, L);
    }
    ctx.restore();
  }
  // where the strip dips under its neighbour
  const dip = L * (o.small ? 0.2 : 0.2);
  if (o.dipA) { ctx.fillStyle = lg(ctx, 0, -L / 2, 0, -L / 2 + dip, [[0, 'rgba(0,0,0,0.6)'], [1, 'rgba(0,0,0,0)']]); ctx.save(); rrect(ctx, -T / 2, -L / 2, T, L, rad); ctx.clip(); ctx.fillRect(-T / 2, -L / 2, T, dip); ctx.restore(); }
  if (o.dipB) { ctx.fillStyle = lg(ctx, 0, L / 2, 0, L / 2 - dip, [[0, 'rgba(0,0,0,0.6)'], [1, 'rgba(0,0,0,0)']]); ctx.save(); rrect(ctx, -T / 2, -L / 2, T, L, rad); ctx.clip(); ctx.fillRect(-T / 2, L / 2 - dip, T, dip); ctx.restore(); }
  if (!o.small) { ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 0.8; rrect(ctx, -T / 2, -L / 2, T, L, rad); ctx.stroke(); }
}

export function createMat(P0, env) {
  const { rng, fx, sound } = env;
  const SC = P0.scene ?? {};
  const P = { ...MAT_DEFAULTS, ...P0 };
  const C = P.cols, R = P.rows, total = R * C, nC = clamp(P.colors, 2, P.palette.length);
  let clock = 0, target, board, cursor, done, geo = null, acc = 0, lastLaid = -1, lastLaidAt = -9, ph = 0;

  const makeTarget = () => {
    ph = rng.int(2);
    const t = new Array(total).fill(0);
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) t[r * C + c] = Math.min(nC - 1, designColor(P, r, c, R, C, nC, ph));
    return t;
  };
  const init = () => { target = makeTarget(); board = new Array(total).fill(-1); cursor = 0; done = null; acc = 0; };
  init();
  const share = () => { const cnt = new Array(P.palette.length).fill(0); target.forEach((c) => cnt[c]++); return Math.max(...cnt) / total; };
  const score = () => {
    let ok = 0; for (let i = 0; i < total; i++) if (board[i] === target[i]) ok++;
    const base = share();
    return { score: Math.round(100 * clamp((ok / total - base) / Math.max(1e-6, 1 - base), 0, 1)), ok };
  };
  const finish = () => {
    const r = score(), stars = starsFor(r.score);
    done = { score: r.score, max: 100, stars, headline: stars === 3 ? (SC.words?.win ?? 'A true weave') : stars ? (SC.words?.ok ?? 'A sound mat') : 'Unpick and begin again', detail: `${r.ok} of ${total} crossings match; ${Math.floor(cursor / C)} rows woven` };
  };

  // ---- geometry -----------------------------------------------------------------------------------------------------
  const pad = () => {
    const f = P.frame, e = P.edge;
    const px = f === 'frame' ? 1.05 : f === 'loom' ? 1.35 : f === 'stakes' ? 0.95 : f === 'bar' ? 0.9 : e === 'fringe' ? 0.6 : 0.62;
    const py = f === 'frame' ? 1.05 : f === 'loom' ? 1.25 : (f === 'bar' || e === 'fringe' || e === 'tassel') ? 1.25 : f === 'stakes' ? 0.95 : 0.62;
    return { px, py };
  };
  const G = (area, small) => {
    const { px, py } = pad(), ch = P.cellH;
    const cs = Math.max(3, Math.min(area.w * 0.97 / (C + 2 * px), area.h * 0.97 / (R * ch + 2 * py)));
    const w = C * cs, h = R * cs * ch, x0 = area.x + (area.w - w) / 2, y0 = area.y + (area.h - h) / 2;
    return { cs, ch: cs * ch, w, h, x0, y0, small };
  };
  const fibre = P.palette[0].color;

  // ---- drawing --------------------------------------------------------------------------------------------------------
  const bareColor = () => tint(mix(fibre, '#6a5a44', 0.18), -0.1);
  const paintBare = (ctx, g) => {
    const T = g.cs * (1 - P.gap);
    if (P.bare === 'threads') {
      ctx.lineCap = 'round';
      for (let c = 0; c < C; c++) {
        const x = g.x0 + (c + 0.5) * g.cs;
        ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = Math.max(1.2, T * 0.42); ctx.beginPath(); ctx.moveTo(x + 0.8, g.y0); ctx.lineTo(x + 0.8, g.y0 + g.h); ctx.stroke();
        ctx.strokeStyle = bareColor(); ctx.lineWidth = Math.max(1, T * 0.34); ctx.beginPath(); ctx.moveTo(x, g.y0); ctx.lineTo(x, g.y0 + g.h); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = Math.max(0.6, T * 0.08); ctx.beginPath(); ctx.moveTo(x - T * 0.08, g.y0); ctx.lineTo(x - T * 0.08, g.y0 + g.h); ctx.stroke();
      }
      return;
    }
    for (let c = 0; c < C; c++) {
      ctx.save(); ctx.translate(g.x0 + (c + 0.5) * g.cs, g.y0 + g.h / 2);
      piece(ctx, T, g.h, bareColor(), P.style, { k: hash(c, 5), small: g.small, sheen: P.sheen * 0.5, lit: -0.02 });
      ctx.restore();
    }
  };
  const paintCell = (ctx, g, r, c, v, pop) => {
    const T = g.cs * (1 - P.gap), Tl = g.ch * (1 - P.gap), wt = warpTop(P.weave, r, c), k = hash(r, c, 7), cx = g.x0 + (c + 0.5) * g.cs, cy = g.y0 + (r + 0.5) * g.ch;
    const up = r > 0 && warpTop(P.weave, r - 1, c) === wt, dn = r < R - 1 && warpTop(P.weave, r + 1, c) === wt, lf = c > 0 && warpTop(P.weave, r, c - 1) === wt, rt = c < C - 1 && warpTop(P.weave, r, c + 1) === wt;
    const col = tint(P.palette[v].color, (k - 0.5) * 0.09);
    ctx.save(); ctx.translate(cx + (hash(r, c, 11) - 0.5) * g.cs * 0.035, cy + (hash(r, c, 12) - 0.5) * g.ch * 0.035); ctx.rotate((hash(r, c, 13) - 0.5) * (g.small ? 0 : 0.026));
    if (pop > 1) ctx.scale(pop, pop);
    if (wt) piece(ctx, T, g.ch * (up || dn ? 1.04 : 1), col, P.style, { dipA: !up, dipB: !dn, k, small: g.small, sheen: P.sheen });
    else { ctx.rotate(Math.PI / 2); piece(ctx, Tl, g.cs * (lf || rt ? 1.04 : 1), col, P.style, { dipA: !rt, dipB: !lf, k, small: g.small, sheen: P.sheen }); }
    ctx.restore();
  };
  const edgeArt = (ctx, g) => {
    const e = P.edge, { x0, y0, w, h, cs } = g, bw = cs * 0.62, bc = P.binding;
    if (e === 'bound') {
      for (const [x, y, ww, hh] of [[x0 - bw, y0 - bw, w + bw * 2, bw], [x0 - bw, y0 + h, w + bw * 2, bw], [x0 - bw, y0, bw, h], [x0 + w, y0, bw, h]]) {
        rrect(ctx, x, y, ww, hh, 2); ctx.fillStyle = lg(ctx, x, y, x + (ww > hh ? 0 : ww), y + (ww > hh ? hh : 0), [[0, tint(bc, 0.2)], [1, tint(bc, -0.35)]]); ctx.fill();
      }
      ctx.strokeStyle = rgba(tint(bc, 0.45), 0.5); ctx.lineWidth = 1; ctx.beginPath();
      for (let q = 0; q < C * 2; q++) { const x = x0 + (q + 0.5) * cs * 0.5; ctx.moveTo(x, y0 - bw * 0.85); ctx.lineTo(x, y0 - bw * 0.15); ctx.moveTo(x, y0 + h + bw * 0.15); ctx.lineTo(x, y0 + h + bw * 0.85); }
      ctx.stroke();
    } else if (e === 'turned') { // the strips are folded back into the weave: a darker lip with tuck marks
      ctx.strokeStyle = 'rgba(0,0,0,0.38)'; ctx.lineWidth = Math.max(1.5, cs * 0.1); ctx.strokeRect(x0 - 0.5, y0 - 0.5, w + 1, h + 1);
      ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1; ctx.strokeRect(x0 + 1.5, y0 + 1.5, w - 3, h - 3);
    } else if (e === 'fringe' || e === 'tassel') { // loose strip ends or cotton threads beyond the first and last row
      for (const sd of [-1, 1]) for (let c = 0; c < C; c++) {
        const x = x0 + (c + 0.5) * cs, y = sd < 0 ? y0 : y0 + h, len = cs * (e === 'tassel' ? 1.05 : 0.7 + hash(c, sd + 3) * 0.45), sw = (hash(c, sd + 9) - 0.5) * cs * 0.6;
        if (e === 'tassel') {
          ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = Math.max(1, cs * 0.16); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 0.6, y); ctx.quadraticCurveTo(x + sw * 0.4, y + sd * len * 0.6, x + sw, y + sd * len); ctx.stroke();
          ctx.strokeStyle = bareColor(); ctx.lineWidth = Math.max(0.9, cs * 0.1); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + sw * 0.4, y + sd * len * 0.6, x + sw, y + sd * len); ctx.stroke();
          if (c % 2 === 0) { ctx.fillStyle = tint(fibre, -0.25); ell(ctx, x + (c % 4 === 0 ? 0 : cs * 0.5), y + sd * cs * 0.15, cs * 0.2, cs * 0.16); ctx.fill(); }
        } else {
          ctx.save(); ctx.translate(x, y + sd * len / 2); ctx.rotate(sw * 0.015 * sd);
          piece(ctx, cs * (1 - P.gap), len, tint(bareColor(), 0.04), P.style, { k: hash(c, 6), small: g.small, sheen: P.sheen * 0.5, dipA: sd > 0, dipB: sd < 0 }); ctx.restore();
        }
      }
    }
  };
  const frameArt = (ctx, g, curRow, back) => {
    const f = P.frame, { x0, y0, w, h, cs } = g, wood = SC.wood ?? '#8a5a30';
    const rail = (x, y, ww, hh, rr = 3) => { // a wooden rail, lit from the left
      ctx.fillStyle = 'rgba(0,0,0,0.38)'; rrect(ctx, x + 2, y + 3, ww, hh, rr); ctx.fill();
      ctx.fillStyle = ww > hh ? lg(ctx, 0, y, 0, y + hh, [[0, tint(wood, 0.28)], [0.45, wood], [1, tint(wood, -0.4)]]) : lg(ctx, x, 0, x + ww, 0, [[0, tint(wood, 0.28)], [0.45, wood], [1, tint(wood, -0.4)]]);
      rrect(ctx, x, y, ww, hh, rr); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); for (let q = 1; q < 4; q++) { if (ww > hh) { ctx.moveTo(x + 4, y + hh * q / 4); ctx.lineTo(x + ww - 4, y + hh * q / 4 + 1); } else { ctx.moveTo(x + ww * q / 4, y + 4); ctx.lineTo(x + ww * q / 4 + 1, y + hh - 4); } } ctx.stroke();
    };
    if (f === 'frame' && back) { // bedstead: four rails, turned corner posts, holes the rope runs through
      const b = cs * 0.8;
      rail(x0 - b, y0 - b, w + b * 2, b, 5); rail(x0 - b, y0 + h, w + b * 2, b, 5); rail(x0 - b, y0, b, h, 5); rail(x0 + w, y0, b, h, 5);
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; for (let c = 0; c < C; c++) { const x = x0 + (c + 0.5) * cs; ell(ctx, x, y0 - b * 0.5, cs * 0.12, cs * 0.12); ctx.fill(); ell(ctx, x, y0 + h + b * 0.5, cs * 0.12, cs * 0.12); ctx.fill(); }
      for (let r = 0; r < R; r++) { const y = y0 + (r + 0.5) * g.ch; ell(ctx, x0 - b * 0.5, y, cs * 0.12, cs * 0.12); ctx.fill(); ell(ctx, x0 + w + b * 0.5, y, cs * 0.12, cs * 0.12); ctx.fill(); }
      for (const [x, y] of [[x0 - b, y0 - b], [x0 + w + b, y0 - b], [x0 - b, y0 + h + b], [x0 + w + b, y0 + h + b]]) {
        ctx.fillStyle = rg(ctx, x - b * 0.2, y - b * 0.2, 1, b * 0.8, [[0, tint(wood, 0.45)], [1, tint(wood, -0.45)]]); ell(ctx, x, y, b * 0.62, b * 0.62); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ell(ctx, x, y, b * 0.36, b * 0.36); ctx.stroke();
      }
    } else if (f === 'bar' && !back) { // warp tied to a bamboo pole with cord, the pole laid over the top edge
      const pw = cs * 0.62, y = y0 - pw * 0.55, x1 = x0 - cs * 0.75, ln = w + cs * 1.5;
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, x1 + 2, y + 4, ln, pw, pw / 2); ctx.fill();
      ctx.fillStyle = lg(ctx, 0, y, 0, y + pw, [[0, '#e6d090'], [0.35, '#bfa24e'], [1, '#6a5222']]); rrect(ctx, x1, y, ln, pw, pw / 2); ctx.fill();
      ctx.strokeStyle = 'rgba(70,50,10,0.55)'; ctx.lineWidth = 2; for (let q = x1 + ln * 0.2; q < x1 + ln * 0.9; q += ln * 0.33) { ctx.beginPath(); ctx.moveTo(q, y + 1); ctx.lineTo(q + 1, y + pw - 1); ctx.stroke(); }
      for (let c = 0; c < C; c += 2) { const x = x0 + (c + 1) * cs; ctx.strokeStyle = P.binding; ctx.lineWidth = Math.max(1.6, cs * 0.13); ctx.beginPath(); ctx.moveTo(x - 1.5, y - 1); ctx.lineTo(x + 1.5, y + pw + 1); ctx.stroke(); ctx.strokeStyle = tint(P.binding, 0.5); ctx.lineWidth = 0.7; ctx.stroke(); }
    } else if (f === 'loom') {
      if (back) { // posts and beams behind the weave
        const pw = cs * 0.7, hh = cs * 0.95;
        rail(x0 - cs * 1.25, y0 - hh, pw, h + hh * 2, 4); rail(x0 + w + cs * 0.55, y0 - hh, pw, h + hh * 2, 4);
        rail(x0 - cs * 1.25, y0 - hh, w + cs * 2.5, hh * 0.6, 4); rail(x0 - cs * 1.25, y0 + h + hh * 0.4, w + cs * 2.5, hh * 0.6, 4);
      } else if (curRow >= 0) { // the reed comb sits against the last woven row and rises with the work
        const y = y0 + (curRow + 0.1) * g.ch - cs * 0.28, bh = cs * 0.62;
        ctx.fillStyle = 'rgba(0,0,0,0.38)'; rrect(ctx, x0 - cs * 0.55 + 2, y + 4, w + cs * 1.1, bh, 3); ctx.fill();
        ctx.fillStyle = lg(ctx, 0, y, 0, y + bh, [[0, tint(wood, 0.35)], [0.5, tint(wood, 0.05)], [1, tint(wood, -0.45)]]); rrect(ctx, x0 - cs * 0.55, y, w + cs * 1.1, bh, 3); ctx.fill();
        ctx.strokeStyle = 'rgba(30,18,8,0.65)'; ctx.lineWidth = Math.max(1, cs * 0.05); ctx.beginPath(); for (let c = 0; c <= C; c++) { const x = x0 + c * cs; ctx.moveTo(x, y + bh * 0.2); ctx.lineTo(x, y + bh * 0.85); } ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0 - cs * 0.5, y + 1.5); ctx.lineTo(x0 + w + cs * 0.5, y + 1.5); ctx.stroke();
      }
    } else if (f === 'stakes' && !back) {
      for (const [x, y] of [[x0 - cs * 0.5, y0 - cs * 0.5], [x0 + w + cs * 0.5, y0 - cs * 0.5], [x0 - cs * 0.5, y0 + h + cs * 0.5], [x0 + w + cs * 0.5, y0 + h + cs * 0.5]]) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ell(ctx, x + 2, y + 3, cs * 0.3, cs * 0.3); ctx.fill();
        ctx.fillStyle = rg(ctx, x - cs * 0.1, y - cs * 0.1, 1, cs * 0.34, [[0, tint(wood, 0.45)], [1, tint(wood, -0.45)]]); ell(ctx, x, y, cs * 0.28, cs * 0.28); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.strokeStyle = P.binding; ctx.lineWidth = Math.max(1.4, cs * 0.1); ell(ctx, x, y, cs * 0.28, cs * 0.28); ctx.stroke();
      }
      ctx.strokeStyle = rgba(P.binding, 0.8); ctx.lineWidth = Math.max(1.2, cs * 0.07); ctx.setLineDash([cs * 0.3, cs * 0.18]); ctx.strokeRect(x0 - cs * 0.5, y0 - cs * 0.5, w + cs, h + cs); ctx.setLineDash([]);
    }
  };

  const paintMat = (ctx, g, gridFor, curRow, t, small) => {
    const { x0, y0, w, h, cs } = g;
    // shadow on the floor
    ctx.fillStyle = 'rgba(0,0,0,0.42)'; rrect(ctx, x0 - cs * 0.15 + cs * 0.22, y0 - cs * 0.1 + cs * 0.3, w + cs * 0.3, h + cs * 0.3, cs * 0.3); ctx.fill();
    frameArt(ctx, g, curRow, true);
    { const th = Math.max(2, cs * 0.14); // the thickness of the mat, seen at its lower and right edges
      ctx.fillStyle = tint(fibre, -0.62); ctx.fillRect(x0 + th * 0.4, y0 + h, w, th); ctx.fillRect(x0 + w, y0 + th * 0.4, th, h);
      ctx.fillStyle = lg(ctx, 0, y0 + h, 0, y0 + h + th, [[0, 'rgba(255,255,255,0.18)'], [1, 'rgba(0,0,0,0.4)']]); ctx.fillRect(x0 + th * 0.4, y0 + h, w, th); }
    ctx.fillStyle = P.under; ctx.fillRect(x0, y0, w, h);
    paintBare(ctx, g);
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const i = r * C + c, v = gridFor[i]; if (v < 0) continue;
      let pop = 1; if (!small && i === lastLaid && t - lastLaidAt < 0.22) pop = 1 + 0.22 * (1 - (t - lastLaidAt) / 0.22);
      paintCell(ctx, g, r, c, v, pop);
    }
    // soft light over the whole mat, darker at the lower right and the edges
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
    ctx.fillStyle = lg(ctx, x0, y0, x0 + w, y0 + h, [[0, 'rgba(255,240,205,0.14)'], [0.45, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.3)']]); ctx.fillRect(x0, y0, w, h);
    if (!small) { const ew = cs * 0.9; // edges fall into shade, light pools in the middle
      for (const [ax, ay, bx, by, rx, ry, rw, rh] of [[x0, y0, x0 + ew, y0, x0, y0, ew, h], [x0 + w, y0, x0 + w - ew, y0, x0 + w - ew, y0, ew, h], [x0, y0, x0, y0 + ew, x0, y0, w, ew], [x0, y0 + h, x0, y0 + h - ew, x0, y0 + h - ew, w, ew]]) { ctx.fillStyle = lg(ctx, ax, ay, bx, by, [[0, 'rgba(0,0,0,0.3)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(rx, ry, rw, rh); } }
    ctx.restore();
    if (!small && curRow >= 0 && curRow < R) { // the woven part casts a shadow on the bare strips that run under it
      const yb = y0 + curRow * g.ch + (cursor % C ? g.ch : 0); ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
      ctx.fillStyle = lg(ctx, 0, yb, 0, yb + cs * 1.1, [[0, 'rgba(0,0,0,0.45)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(x0, yb, w, cs * 1.1);
      ctx.fillStyle = lg(ctx, 0, yb, 0, y0 + h, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.22)']]); ctx.fillRect(x0, yb, w, y0 + h - yb); ctx.restore(); }
    if (!small) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip(); // daylight pooling on the upper left of the mat
      ctx.fillStyle = rg(ctx, x0 + w * 0.3, y0 + h * 0.2, 4, Math.max(w, h) * 0.75, [[0, 'rgba(255,236,190,0.16)'], [1, 'rgba(255,236,190,0)']]); ctx.fillRect(x0, y0, w, h); ctx.restore(); }
    edgeArt(ctx, g);
    frameArt(ctx, g, curRow, false);
    if (!small && curRow >= 0 && cursor < total) { // the crossing to lay next
      const r = Math.floor(cursor / C), c = cursor % C, x = x0 + (c + 0.5) * cs, y = y0 + (r + 0.5) * g.ch, pulse = 0.6 + 0.4 * Math.sin(t * 5);
      ctx.fillStyle = 'rgba(242,193,78,0.09)'; ctx.fillRect(x0, y0 + r * g.ch, w, g.ch);
      rrect(ctx, x - cs * 0.52, y - g.ch * 0.52, cs * 1.04, g.ch * 1.04, cs * 0.14); ctx.strokeStyle = rgba('#ffe08a', 0.55 + 0.4 * pulse); ctx.lineWidth = 2.6; ctx.stroke();
    }
  };

  // ---- interface ------------------------------------------------------------------------------------------------------
  const burst = (idx) => {
    if (!geo || !fx) return;
    const r = Math.floor(idx / C), c = idx % C;
    fx.emit('spark', geo.x0 + (c + 0.5) * geo.cs, geo.y0 + (r + 0.5) * geo.ch, { count: 3, color: '#fff4c8', size: Math.max(3, geo.cs * 0.2), speed: 60, life: 0.4, gravity: 40, spread: 3 });
  };
  const items = () => {
    const out = [];
    for (let i = 0; i < nC; i++) out.push({ id: `stitch:${i}`, kind: 'swatch', color: P.palette[i].color, name: P.palette[i].name, off: cursor >= total });
    out.push({ id: 'undo', kind: 'btn', label: 'Undo', off: cursor === 0 });
    out.push({ id: 'check', kind: 'btn', label: 'Check', primary: true });
    return out;
  };
  const control = (id) => {
    if (done) return;
    if (id.startsWith('stitch:')) {
      if (cursor >= total) return;
      const c = Number(id.slice(7)); lastLaid = cursor; lastLaidAt = clock; board[cursor++] = c; sound?.weave(c); burst(lastLaid);
    } else if (id === 'undo') { if (cursor > 0) board[--cursor] = -1; }
    else if (id === 'check') finish();
  };
  const fullRect = (W) => { let d = 60; for (let q = 0; q < 4; q++) d = dockHeight({ h: W.h + d }); return { x: W.x, y: W.y, w: W.w, h: W.h + d }; };
  const draw = (g, Rt, t) => {
    const { ctx, pal } = g; clock = t;
    const W = Rt.work, wb = wallBand(fullRect(W), SC), guideH = P.guide && cursor < total ? Math.min(70, W.h * 0.2) : 0;
    const top = W.y + wb * 0.82, area = { x: W.x + 6, y: top, w: W.w - 12, h: W.y + W.h - top - 4 - guideH };
    geo = G(area, false);
    const row = Math.min(R - 1, Math.floor(cursor / C));
    paintMat(ctx, geo, board, cursor < total ? row : -1, t, false);
    if (P.guide && cursor < total) {
      const gw = Math.min(W.w * 0.7, 40 * C), sw = gw / C, gx = W.x + W.w / 2 - gw / 2, gh = Math.max(16, Math.min(30, sw * 0.7)), gy = W.y + W.h - gh - 10;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; rrect(ctx, gx - 8, gy - 8, gw + 16, gh + 16, 10); ctx.fill();
      for (let j = 0; j < C; j++) {
        const col = P.palette[target[row * C + j]].color, gg = ctx.createLinearGradient(0, gy, 0, gy + gh); gg.addColorStop(0, tint(col, 0.2)); gg.addColorStop(1, tint(col, -0.25));
        rrect(ctx, gx + j * sw + 1, gy, Math.max(2, sw - 2), gh, 3); ctx.fillStyle = gg; ctx.fill();
        if (row * C + j === cursor) { ctx.strokeStyle = pal.accent; ctx.lineWidth = 3; rrect(ctx, gx + j * sw, gy - 2, sw, gh + 4, 4); ctx.stroke(); }
      }
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; rrect(ctx, W.x + W.w / 2 - 150, gy - 36, 300, 24, 12); ctx.fill();
      g.label(ctx, `Row ${row + 1} of ${R}: copy this row`, W.x + W.w / 2, gy - 23, g.px(21), '#f1e8d6', 'center', '500');
    }
    g.label(ctx, `Crossing ${Math.min(cursor + 1, total)} of ${total}`, W.x + 16, W.y + 20, g.px(22), pal.dim, 'left', '500');
    const th = Rt.thumb, tg = G({ x: th.x + 2, y: th.y + 2, w: th.w - 4, h: th.h - 4 }, true);
    paintMat(ctx, tg, target, -1, t, true);
  };
  const titleArt = (g, S, t) => {
    const { ctx } = g, tg = G({ x: S.x, y: S.y + S.h * 0.16, w: S.w, h: S.h * 0.8 }, false);
    paintMat(ctx, tg, target, -1, t, false);
  };
  const attract = (dt) => {
    if (done) return;
    acc += dt; if (acc < 0.04) return; acc = 0;
    if (cursor < total) { board[cursor] = target[cursor]; cursor++; sound?.weave(target[cursor - 1]); } else finish();
  };
  return {
    init, items, control, work: () => {}, draw, attract, titleArt, result: () => done,
    score: () => score().score,
    info: () => [`Rows: ${R}`, `Strips per row: ${C}`],
    caption: SC.words?.caption ?? 'Plait this mat',
    hint() {
      if (cursor >= total) return 'The mat is woven: press Check.';
      const row = Math.floor(cursor / C), j = cursor % C;
      return `Crossing ${j + 1} of row ${row + 1} should be ${P.palette[target[cursor]].name}.`;
    },
    rules: () => ['Rows are laid from the loom end, left to right; undo takes back the last crossing.', 'The strips not yet woven lie bare, side by side.', 'Score: crossings with the right colour, measured beyond what the plain fibre colour would give.'],
    point() { return null; },
    state: () => ({ technique: 'mat', design: P.design, weave: P.weave, style: P.style, rows: R, stitches: C, board, target, cursor }),
  };
}
void shelf;
registerTechnique('mat', { make: (P, env) => createMat({ ...MAT_DEFAULTS, ...P }, env), scene: 'mt-verandah', mat: 'reed' });

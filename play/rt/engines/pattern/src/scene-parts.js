// Reusable pieces that scenes are assembled from: surface bases, grounds, looms and frames.
import { hash, rgba, mix, shade, lum, roundRectPath, rod, ball, poly, speck, lines, weaveGrid, glow, vignette, TAU, ENV, sheenLine } from './scene-kit.js';

// ---- bases: the object the work sits on / is made of (drawn first, with its cast shadow) ---------------------------------------------
export const base = {
  sheet: (o = {}) => (ctx, S) => { // a flat sheet: cloth, paper, board
    const r = S.rect; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = S.cell * (o.blur ?? 1.1); ctx.shadowOffsetY = S.cell * (o.drop ?? 0.35);
    ctx.fillStyle = o.fill ?? S.bg; if (S.polar) { ctx.beginPath(); ctx.arc(S.B.cx, S.B.cy, S.B.R + (o.grow ?? 0), 0, TAU); ctx.fill(); } else ctx.fillRect(r.x - (o.grow ?? 0), r.y - (o.grow ?? 0), r.w + 2 * (o.grow ?? 0), r.h + 2 * (o.grow ?? 0)); ctx.restore();
  },
  slab: (o = {}) => (ctx, S) => { // a thick slab: top face with an edge below
    const r = S.rect, t = S.cell * (o.thick ?? 0.35), g = o.grow ?? S.cell * 0.2;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = S.cell * 1.2; ctx.shadowOffsetY = S.cell * 0.5;
    ctx.fillStyle = shade(o.side ?? '#777', -0.35); roundRectPath(ctx, r.x - g, r.y - g + t, r.w + 2 * g, r.h + 2 * g, o.r ?? 6); ctx.fill(); ctx.restore();
    ctx.fillStyle = o.top ?? '#999'; roundRectPath(ctx, r.x - g, r.y - g, r.w + 2 * g, r.h + 2 * g, o.r ?? 6); ctx.fill();
  },
};

// ---- grounds: the texture the cells are laid on ---------------------------------------------------------------------------------------
export const ground = {
  silk: (o = {}) => (ctx, S) => { // warp and weft threads of a fine cloth with a diagonal sheen
    const r = S.rect, bg = S.bg; ctx.fillStyle = bg; ctx.fillRect(r.x, r.y, r.w, r.h);
    const p = Math.max(2.2, S.cell / (o.density ?? 7));
    lines(ctx, r, 'v', p, o.warp ?? shade(bg, 0.25), 0.22, p * 0.45, 0.4, 3);
    lines(ctx, r, 'h', p, o.weft ?? '#000', 0.2, p * 0.4, 0.4, 5);
    const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,255,255,0.12)'); g.addColorStop(0.45, 'rgba(255,255,255,0)'); g.addColorStop(0.7, 'rgba(255,255,255,0.08)'); g.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  },
  coarse: (o = {}) => (ctx, S) => { // thick plain-weave cloth (khaddar, linen, raffia)
    const r = S.rect, bg = S.bg; ctx.fillStyle = bg; ctx.fillRect(r.x, r.y, r.w, r.h);
    const p = Math.max(3, S.cell / (o.density ?? 4.2));
    weaveGrid(ctx, r, p, shade(bg, -0.4), shade(bg, 0.3), o.a ?? 0.45);
    if (!S.lite) speck(ctx, r, 160, [shade(bg, -0.3), shade(bg, 0.35)], 0.3, 1.6, 21);
  },
  aida: (o = {}) => (ctx, S) => { // counted fabric: a grid of holes, four to a cell
    const r = S.rect, bg = S.bg; ctx.fillStyle = bg; ctx.fillRect(r.x, r.y, r.w, r.h);
    const n = o.n ?? 4, p = S.cell / n; weaveGrid(ctx, r, p, shade(bg, -0.25), shade(bg, 0.2), 0.35);
    ctx.fillStyle = rgba(shade(bg, -0.55), 0.55); ctx.beginPath(); const c0 = Math.ceil(r.w / p), r0 = Math.ceil(r.h / p);
    if (c0 * r0 < 4200) for (let j = 0; j < r0; j++) for (let i = 0; i < c0; i++) { ctx.moveTo(r.x + i * p + p * 0.14, r.y + j * p); ctx.arc(r.x + i * p, r.y + j * p, Math.max(0.8, p * 0.14), 0, TAU); }
    ctx.fill();
  },
  plaster: (o = {}) => (ctx, S) => { // lime plaster or mud render with trowel marks
    const r = S.rect, bg = S.bg; ctx.fillStyle = bg; ctx.fillRect(r.x, r.y, r.w, r.h);
    for (let i = 0; i < (S.lite ? 6 : 18); i++) { const px = r.x + hash(i, 1) * r.w, py = r.y + hash(i, 2) * r.h, pr = (0.15 + hash(i, 3) * 0.3) * Math.max(r.w, r.h); const g = ctx.createRadialGradient(px, py, 0, px, py, pr); g.addColorStop(0, rgba(hash(i, 4) > 0.5 ? shade(bg, 0.3) : shade(bg, -0.3), o.a ?? 0.18)); g.addColorStop(1, rgba(bg, 0)); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h); }
    if (!S.lite) { speck(ctx, r, 220, [shade(bg, -0.35), shade(bg, 0.4)], 0.2, Math.max(1.2, S.cell * 0.035), 31); lines(ctx, r, 'h', S.cell * 0.9, shade(bg, 0.4), 0.07, S.cell * 0.08, S.cell * 0.4, 6); }
  },
  planks: (o = {}) => (ctx, S) => {
    const r = S.rect, bg = S.bg; ctx.fillStyle = bg; ctx.fillRect(r.x, r.y, r.w, r.h);
    const p = S.cell * (o.size ?? 0.6);
    ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
    if (o.dir === 'v') { for (let x = r.x, i = 0; x < r.x + r.w; x += p, i++) { ctx.fillStyle = rgba(hash(i, 2) > 0.5 ? '#fff' : '#000', 0.06); ctx.fillRect(x, r.y, p, r.h); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x, r.y, 1.2, r.h); } lines(ctx, r, 'v', Math.max(3, p / 5), '#000', 0.14, 1, p * 0.1, 8); }
    else { for (let y = r.y, i = 0; y < r.y + r.h; y += p, i++) { ctx.fillStyle = rgba(hash(i, 2) > 0.5 ? '#fff' : '#000', 0.06); ctx.fillRect(r.x, y, r.w, p); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(r.x, y, r.w, 1.2); } lines(ctx, r, 'h', Math.max(3, p / 5), '#000', 0.14, 1, p * 0.1, 8); }
    ctx.restore();
  },
  paper: (o = {}) => (ctx, S) => {
    const r = S.rect, bg = S.bg; ctx.fillStyle = bg; ctx.fillRect(r.x, r.y, r.w, r.h);
    if (!S.lite) { speck(ctx, r, 320, [shade(bg, -0.2), shade(bg, 0.4)], 0.3, 1.5, 17); lines(ctx, r, 'v', o.laid ?? S.cell * 0.18, shade(bg, -0.3), 0.06, 1, 1, 11); }
  },
  tileGrid: (o = {}) => (ctx, S) => { // mortar bed with raised tile spaces
    const r = S.rect, bg = S.bg; ctx.fillStyle = o.mortar ?? shade(bg, -0.3); ctx.fillRect(r.x, r.y, r.w, r.h);
    if (!S.polar) { const c = S.cell, bw = Math.max(1.5, c * 0.06);
      for (let j = 0; j < S.rows; j++) for (let i = 0; i < S.cols; i++) { const v = (hash(i, j, 3) - 0.5) * 0.1; ctx.fillStyle = shade(bg, v); ctx.fillRect(r.x + i * c + bw, r.y + j * c + bw, c - 2 * bw, c - 2 * bw); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(r.x + i * c + bw, r.y + j * c + bw, c - 2 * bw, bw); } }
    else { ctx.fillStyle = bg; ctx.fillRect(r.x, r.y, r.w, r.h); }
  },
  sand: (o = {}) => (ctx, S) => { // raked gravel: fine parallel grooves
    const r = S.rect, bg = S.bg; ctx.fillStyle = bg; ctx.fillRect(r.x, r.y, r.w, r.h);
    const p = Math.max(3, S.cell * 0.16);
    lines(ctx, r, o.dir ?? 'h', p, shade(bg, -0.45), 0.5, p * 0.28, p * 0.3, 2);
    ctx.save(); ctx.translate(0, p * 0.36); lines(ctx, r, o.dir ?? 'h', p, '#fff', 0.45, p * 0.2, p * 0.3, 2); ctx.restore();
    if (!S.lite) speck(ctx, r, 260, [shade(bg, -0.4), '#fff'], 0.25, Math.max(1, S.cell * 0.03), 77);
  },
  plain: () => (ctx, S) => { const r = S.rect; ctx.fillStyle = S.bg; ctx.fillRect(r.x, r.y, r.w, r.h); },
};

// ---- frames and apparatus around the work -----------------------------------------------------------------------------------------------
export const frame = {
  // horizontal frame loom: warp threads run beyond the cloth to a cloth beam above and a breast beam below
  loomH(ctx, S, o = {}) {
    const b = S.box, r = S.rect, bw = Math.max(8, S.cell * (o.beam ?? 0.5)), wood = o.wood ?? '#7a4f26', warp = o.warp ?? '#e7dcc2';
    const top = b.y + bw * 0.7, bot = b.y + b.h - bw * 0.7, p = Math.max(2.4, S.cell / (o.density ?? 5));
    if (o.posts !== false) { rod(ctx, b.x + bw * 0.6, b.y, b.x + bw * 0.6, b.y + b.h, bw * 0.9, shade(wood, -0.15)); rod(ctx, b.x + b.w - bw * 0.6, b.y, b.x + b.w - bw * 0.6, b.y + b.h, bw * 0.9, shade(wood, -0.15)); }
    ctx.save(); ctx.lineWidth = Math.max(1, p * 0.3); ctx.strokeStyle = rgba(warp, 0.75); ctx.beginPath();
    for (let x = r.x; x <= r.x + r.w + 0.1; x += p) { ctx.moveTo(x, top); ctx.lineTo(x, r.y + 3); ctx.moveTo(x, r.y + r.h - 3); ctx.lineTo(x, bot); }
    ctx.stroke(); ctx.restore();
    rod(ctx, b.x + bw * 0.3, top, b.x + b.w - bw * 0.3, top, bw, wood); rod(ctx, b.x + bw * 0.3, bot, b.x + b.w - bw * 0.3, bot, bw, wood);
    ctx.fillStyle = rgba('#e8d8a0', 0.9); for (const x of [b.x + bw * 0.6, b.x + b.w - bw * 0.6]) for (const y of [top, bot]) { ctx.beginPath(); ctx.arc(x, y, bw * 0.34, 0, TAU); ctx.fill(); }
    if (o.heddles) { // two hanging heddle frames with strings and a small pulley
      const hy = top + (r.y - top) * 0.55;
      for (let k = 0; k < 2; k++) { const yy = hy + k * bw * 0.55; rod(ctx, r.x - bw * 0.2, yy, r.x + r.w + bw * 0.2, yy, bw * 0.34, '#a9884f'); }
      ctx.strokeStyle = 'rgba(240,230,200,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = r.x + p * 2; x < r.x + r.w; x += p * 6) { ctx.moveTo(x, hy); ctx.lineTo(x, r.y); } ctx.stroke();
      ball(ctx, r.x + r.w * 0.5, top + bw * 0.5, bw * 0.45, '#8a5a2a', false);
    }
    if (o.reed) { const y = r.y - bw * 0.35; rod(ctx, r.x - bw * 0.3, y, r.x + r.w + bw * 0.3, y, bw * 0.4, '#d8c08a'); ctx.fillStyle = 'rgba(60,40,10,0.7)'; for (let x = r.x; x < r.x + r.w; x += p * 1.5) ctx.fillRect(x, y - bw * 0.2, 1.2, bw * 0.4); }
    if (o.weights) { for (let x = r.x + p * 3; x < r.x + r.w; x += Math.max(p * 7, r.w / 5)) { ctx.strokeStyle = 'rgba(230,220,190,0.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, bot); ctx.lineTo(x, bot + bw * 0.8); ctx.stroke(); ball(ctx, x, bot + bw * 1.1, bw * 0.4, '#8a8a82', false); } }
  },
  // wooden frame stand or stretcher holding cloth taut with ties
  stretcher(ctx, S, o = {}) {
    const r = S.rect, t = Math.max(7, S.cell * (o.t ?? 0.42)), wood = o.wood ?? '#b89a5a';
    const R = { x: r.x - t, y: r.y - t, w: r.w + 2 * t, h: r.h + 2 * t };
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = S.cell * 1.0; ctx.shadowOffsetY = S.cell * 0.4; ctx.fillStyle = '#000'; ctx.fillRect(R.x, R.y, R.w, R.h); ctx.restore();
    rod(ctx, R.x + t / 2, R.y + t / 2, R.x + R.w - t / 2, R.y + t / 2, t, wood); rod(ctx, R.x + t / 2, R.y + R.h - t / 2, R.x + R.w - t / 2, R.y + R.h - t / 2, t, wood);
    rod(ctx, R.x + t / 2, R.y, R.x + t / 2, R.y + R.h, t, shade(wood, -0.1)); rod(ctx, R.x + R.w - t / 2, R.y, R.x + R.w - t / 2, R.y + R.h, t, shade(wood, -0.1));
    if (o.ties) { ctx.strokeStyle = o.tie ?? '#f1e7d0'; ctx.lineWidth = Math.max(1.4, S.cell * 0.05); ctx.beginPath(); const n = o.ties; for (let k = 0; k < n; k++) { const f = (k + 0.5) / n; ctx.moveTo(r.x + r.w * f, r.y); ctx.lineTo(r.x + r.w * f - 0, R.y + t * 0.5); ctx.moveTo(r.x + r.w * f, r.y + r.h); ctx.lineTo(r.x + r.w * f, R.y + R.h - t * 0.5); ctx.moveTo(r.x, r.y + r.h * f); ctx.lineTo(R.x + t * 0.5, r.y + r.h * f); ctx.moveTo(r.x + r.w, r.y + r.h * f); ctx.lineTo(R.x + R.w - t * 0.5, r.y + r.h * f); } ctx.stroke(); }
    return R;
  },
};
export function diagLines(ctx, r, step, c, a, lw, dir = 1) {
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); ctx.beginPath();
  const n = Math.ceil((r.w + r.h) / step);
  for (let i = -1; i <= n; i++) { const o = i * step; if (dir > 0) { ctx.moveTo(r.x + o, r.y); ctx.lineTo(r.x + o - r.h, r.y + r.h); } else { ctx.moveTo(r.x + o - r.h, r.y); ctx.lineTo(r.x + o, r.y + r.h); } }
  ctx.strokeStyle = rgba(c, a); ctx.lineWidth = lw; ctx.stroke(); ctx.restore();
}
// a round prop seen from above: tub, vat, pan (used as environment dressing)
export function tub(ctx, x, y, r, liquid, rim = '#7a4f26') {
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.ellipse(x + r * 0.15, y + r * 0.2, r * 1.05, r * 0.95, 0, 0, TAU); ctx.fill();
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r); g.addColorStop(0, shade(rim, 0.35)); g.addColorStop(1, shade(rim, -0.45)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  const l = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, 1, x, y, r * 0.78); l.addColorStop(0, shade(liquid, 0.3)); l.addColorStop(1, shade(liquid, -0.4)); ctx.fillStyle = l; ctx.beginPath(); ctx.arc(x, y, r * 0.78, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(x - r * 0.28, y - r * 0.3, r * 0.22, r * 0.08, -0.6, 0, TAU); ctx.fill();
}
export { ENV, shade, mix, lum, poly, glow, vignette };

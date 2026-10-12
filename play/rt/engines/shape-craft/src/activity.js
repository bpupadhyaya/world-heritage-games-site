// shape-craft: crafts that SHAPE an object (docs/ENGINE-CONTRACT.md "Activity engines").
// One shared shell (layout, controls, scoring to stars, attract mode) over five techniques selected by params.technique:
//   lathe (wheel-thrown vessel + glaze bands), carve (subtractive figure), cut (symmetric paper cut-out),
//   fold (paper folding to a silhouette), coil (basket built stitch by stitch), knot (one cord tied over and under on a
//   grid of crossings), bend (wire bent into a silhouette).
import { createLathe, LATHE_DEFAULTS } from './lathe.js';
import { createCarve, CARVE_DEFAULTS } from './carve.js';
import { createFold, FOLD_DEFAULTS, drawFoldIcon } from './fold.js';
import { createCoil, COIL_DEFAULTS } from './coil.js';
import { createKnot, KNOT_DEFAULTS } from './knot.js';
import { createBend, BEND_DEFAULTS } from './bend.js';

export const TECHNIQUES = ['lathe', 'carve', 'cut', 'fold', 'coil', 'knot', 'bend'];

export function createActivity(userParams, env) {
  const technique = TECHNIQUES.includes(userParams.technique) ? userParams.technique : 'lathe';
  const make = {
    lathe: () => createLathe({ ...LATHE_DEFAULTS, ...userParams }, env),
    carve: () => createCarve({ ...CARVE_DEFAULTS, ...userParams, mode: 'figure' }, env),
    cut: () => createCarve({ ...CARVE_DEFAULTS, material: 'paper', color: '#c8321f', cavity: '#0f1318', symmetry: 'mirror-xy', cols: 12, rows: 12, guide: true, ...userParams, mode: 'cut' }, env),
    fold: () => createFold({ ...FOLD_DEFAULTS, ...userParams }, env),
    coil: () => createCoil({ ...COIL_DEFAULTS, ...userParams }, env),
    knot: () => createKnot({ ...KNOT_DEFAULTS, ...userParams }, env),
    bend: () => createBend({ ...BEND_DEFAULTS, ...userParams }, env),
  }[technique];
  const tech = make();
  const pal = env.palette;
  let clock = 0, layout = null;

  const itemSize = (g, it, bh) => (it.kind === 'btn' ? Math.max(bh * 1.7, (it.label?.length ?? 4) * g.px(14) + 36) : it.kind === 'fold' ? bh * 1.05 : bh);
  const compute = (g, area, items) => {
    const touch = (g.px(0) * 44) / 12, bh = Math.max(54, touch), gap = 8;
    const landscape = area.w > area.h * 1.15;
    const colW = landscape ? Math.min(380, Math.max(250, area.w * 0.32)) : area.w;
    const flow = (width) => {
      const rows = [[]]; let x = 0;
      for (const it of items) {
        const w = itemSize(g, it, bh);
        if (x + w > width && rows[rows.length - 1].length) { rows.push([]); x = 0; }
        rows[rows.length - 1].push({ it, w }); x += w + gap;
      }
      return rows;
    };
    const rows = flow(colW - 8);
    const ctrlH = rows.length * (bh + gap) + 4;
    let thumb, work, ctrlTop, ctrlX, info;
    if (landscape) {
      const ts = Math.min(colW - 8, Math.max(120, area.h - ctrlH - 90));
      thumb = { x: area.x + area.w - colW + (colW - ts) / 2, y: area.y + 26, w: ts, h: ts };
      info = { x: area.x + area.w - colW, y: thumb.y + ts + 4, w: colW };
      ctrlTop = Math.min(area.y + area.h - ctrlH, info.y + 70); ctrlX = area.x + area.w - colW + 4;
      work = { x: area.x, y: area.y, w: area.w - colW - 8, h: area.h };
    } else {
      const th = Math.min(Math.max(110, area.h * 0.24), 250);
      thumb = { x: area.x + 6, y: area.y + 20, w: th, h: th };
      info = { x: thumb.x + th + 14, y: thumb.y, w: area.w - th - 26 };
      ctrlTop = area.y + area.h - ctrlH; ctrlX = area.x + 4;
      work = { x: area.x, y: thumb.y + th + 8, w: area.w, h: ctrlTop - (thumb.y + th + 8) - 4 };
    }
    // position control items
    const placed = [];
    rows.forEach((row, ri) => {
      const total = row.reduce((s, r) => s + r.w, 0) + (row.length - 1) * gap;
      let x = ctrlX + Math.max(0, ((landscape ? colW - 8 : area.w - 8) - total) / 2);
      for (const { it, w } of row) { placed.push({ ...it, x, y: ctrlTop + ri * (bh + gap), w, h: bh }); x += w + gap; }
    });
    return { landscape, thumb, work, info, ctrl: placed };
  };

  const drawItem = (g, b) => {
    const { ctx } = g;
    ctx.globalAlpha = b.off ? 0.4 : 1;
    if (b.kind === 'swatch') {
      ctx.fillStyle = b.color; g.rr(ctx, b.x, b.y, b.w, b.h, 10); ctx.fill();
      ctx.strokeStyle = b.on ? pal.accent : 'rgba(255,255,255,0.45)'; ctx.lineWidth = b.on ? 5 : 2; ctx.stroke();
    } else if (b.kind === 'fold') {
      ctx.fillStyle = pal.panel; g.rr(ctx, b.x, b.y, b.w, b.h, 10); ctx.fill();
      ctx.strokeStyle = pal.dim; ctx.lineWidth = 1.5; ctx.stroke();
      drawFoldIcon(ctx, b.op, b.x, b.y, Math.min(b.w, b.h), pal.ink);
    } else {
      g.rr(ctx, b.x, b.y, b.w, b.h, 14); ctx.fillStyle = b.primary ? pal.accent : pal.panel; ctx.fill();
      ctx.strokeStyle = b.primary ? pal.accent : pal.dim; ctx.lineWidth = 2; ctx.stroke();
      g.label(ctx, b.label, b.x + b.w / 2, b.y + b.h / 2, Math.min(g.px(22), b.h * 0.42), b.primary ? '#1b1b1b' : pal.ink);
    }
    ctx.globalAlpha = 1;
  };

  const act = {
    init() { tech.init(); clock = 0; },
    update(dt, input) {
      clock += dt;
      const p = input.pointer;
      if (!layout || tech.result()) return;
      if (p.pressed) {
        const b = layout.ctrl.find((c) => p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h);
        if (b) { if (!b.off) tech.control(b.id); return; }
      }
      tech.work(p);
    },
    attract(dt) { clock += dt; tech.attract(dt); },
    render(g, area) {
      const { ctx } = g;
      layout = compute(g, area, tech.items());
      const L = layout;
      tech.draw(g, { work: L.work, thumb: L.thumb }, clock);
      // thumbnail frame, caption and info
      ctx.strokeStyle = pal.accent; ctx.lineWidth = 2; g.rr(ctx, L.thumb.x - 2, L.thumb.y - 2, L.thumb.w + 4, L.thumb.h + 4, 12); ctx.stroke();
      g.label(ctx, tech.caption, L.thumb.x + L.thumb.w / 2, L.thumb.y - 12, g.px(17), pal.accent, 'center', '700');
      let y = L.info.y + g.px(12);
      for (const line of tech.info()) { for (const l of g.wrap(ctx, line, L.info.w, g.px(19))) { g.label(ctx, l, L.info.x, y, g.px(19), pal.ink, 'left', '500'); y += g.px(26); } }
      for (const b of L.ctrl) drawItem(g, b);
    },
    status: () => ({ score: tech.score(), max: 100, label: tech.caption }),
    result: () => tech.result(),
    hint: () => tech.hint(),
    rules: () => tech.rules(),
    point(id) {
      const b = layout?.ctrl.find((c) => c.id === id);
      if (b) return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
      return tech.point(id);
    },
    getState: () => ({ technique, ...tech.state(), score: tech.score() }),
  };
  return act;
}

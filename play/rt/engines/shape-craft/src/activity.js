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
import { createFx, caseGlass, shadowed, rrect, tint, rgba, mix, lum } from './fx.js';
import { resolveScene, splitWork, drawGround, drawDock, drawFrame, drawStage } from './scenes.js';

export const TECHNIQUES = ['lathe', 'carve', 'cut', 'fold', 'coil', 'knot', 'bend'];

export function createActivity(userParams0, env0) {
  let userParams = userParams0;
  const technique = TECHNIQUES.includes(userParams.technique) ? userParams.technique : 'lathe';
  const fx = createFx();
  const env = { ...env0, fx };
  const scene = resolveScene(userParams, env0.text, technique);
  userParams = { ...userParams, scene };
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
  let clock = 0, layout = null, press = null, resultAt = -1;

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
      const ts = Math.min(colW * 0.52, Math.max(100, area.h - ctrlH - 54 - 14));
      thumb = { x: area.x + area.w - colW + 10, y: area.y + 54, w: ts, h: ts };
      info = { x: thumb.x + ts + 16, y: thumb.y + 4, w: colW - ts - 34 };
      ctrlTop = area.y + area.h - ctrlH; ctrlX = area.x + area.w - colW + 4;
      work = { x: area.x, y: area.y, w: area.w - colW - 8, h: area.h };
    } else {
      const th = Math.min(Math.max(110, area.h * 0.24), 250);
      thumb = { x: area.x + 14, y: area.y + 54, w: th, h: th };
      info = { x: thumb.x + th + 24, y: thumb.y + 4, w: area.w - th - 48 };
      ctrlTop = area.y + area.h - ctrlH; ctrlX = area.x + 4;
      work = { x: area.x, y: thumb.y + th + 16, w: area.w, h: ctrlTop - (thumb.y + th + 16) - 4 };
    }
    const placed = [];
    rows.forEach((row, ri) => {
      const total = row.reduce((s, r) => s + r.w, 0) + (row.length - 1) * gap;
      let x = ctrlX + Math.max(0, ((landscape ? colW - 8 : area.w - 8) - total) / 2);
      for (const { it, w } of row) { placed.push({ ...it, x, y: ctrlTop + ri * (bh + gap), w, h: bh }); x += w + gap; }
    });
    return { landscape, thumb, work, info, ctrl: placed };
  };

  const drawItem = (g, b, down) => {
    const { ctx } = g;
    const sc = down ? 0.94 : 1, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
    ctx.globalAlpha = b.off ? 0.4 : 1;
    if (b.kind === 'swatch') {
      const lift = b.on ? 4 : 0;
      shadowed(ctx, () => { rrect(ctx, b.x, b.y - lift, b.w, b.h, 14); ctx.fillStyle = b.color; ctx.fill(); }, { blur: b.on ? 14 : 6, dy: b.on ? 7 : 3, a: 0.5 });
      const gr = ctx.createLinearGradient(b.x, b.y - lift, b.x + b.w, b.y + b.h - lift);
      gr.addColorStop(0, 'rgba(255,255,255,0.42)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.3)');
      rrect(ctx, b.x, b.y - lift, b.w, b.h, 14); ctx.fillStyle = gr; ctx.fill();
      ctx.strokeStyle = b.on ? pal.accent : 'rgba(255,255,255,0.4)'; ctx.lineWidth = b.on ? 4.5 : 1.5; ctx.stroke();
      if (b.on) {
        ctx.strokeStyle = lum(b.color) > 0.55 ? '#1b1b1b' : '#fff'; ctx.lineWidth = Math.max(3, b.w * 0.07); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
        ctx.moveTo(cx - b.w * 0.18, cy - lift + 1); ctx.lineTo(cx - b.w * 0.04, cy - lift + b.h * 0.14); ctx.lineTo(cx + b.w * 0.2, cy - lift - b.h * 0.14); ctx.stroke();
      }
    } else if (b.kind === 'fold') {
      shadowed(ctx, () => { rrect(ctx, b.x, b.y, b.w, b.h, 12); ctx.fillStyle = mix(pal.panel, '#000', 0.1); ctx.fill(); }, { blur: 6, dy: 3, a: 0.45 });
      const gr = ctx.createLinearGradient(0, b.y, 0, b.y + b.h); gr.addColorStop(0, 'rgba(255,255,255,0.14)'); gr.addColorStop(1, 'rgba(0,0,0,0.2)');
      rrect(ctx, b.x, b.y, b.w, b.h, 12); ctx.fillStyle = gr; ctx.fill();
      ctx.strokeStyle = pal.dim; ctx.lineWidth = 1.5; ctx.stroke();
      drawFoldIcon(ctx, b.op, b.x, b.y, Math.min(b.w, b.h), pal.ink);
    } else {
      shadowed(ctx, () => { rrect(ctx, b.x, b.y, b.w, b.h, Math.min(18, b.h / 2)); ctx.fillStyle = b.primary ? pal.accent : pal.panel; ctx.fill(); }, { blur: 8, dy: 3, a: 0.45 });
      const gr = ctx.createLinearGradient(0, b.y, 0, b.y + b.h); gr.addColorStop(0, 'rgba(255,255,255,0.28)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.22)');
      rrect(ctx, b.x, b.y, b.w, b.h, Math.min(18, b.h / 2)); ctx.fillStyle = gr; ctx.fill();
      ctx.strokeStyle = b.primary ? tint(pal.accent, 0.3) : pal.dim; ctx.lineWidth = 2; ctx.stroke();
      g.label(ctx, b.label, b.x + b.w / 2, b.y + b.h / 2 + 1, Math.min(g.px(24), b.h * 0.42), b.primary ? '#1b1b1b' : pal.ink, 'center', '700');
    }
    ctx.restore();
  };

  const act = {
    init() { tech.init(); clock = 0; resultAt = -1; },
    update(dt, input) {
      clock += dt; fx.update(dt);
      const p = input.pointer;
      if (!layout) return;
      press = p.down ? layout.ctrl.find((c) => !c.off && p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h)?.id ?? null : null;
      if (tech.result()) return;
      if (p.pressed) {
        const b = layout.ctrl.find((c) => p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h);
        if (b) { if (!b.off) tech.control(b.id); return; }
      }
      tech.work(p);
    },
    attract(dt) { clock += dt; fx.update(dt); tech.attract(dt); },
    render(g, area) {
      const { ctx } = g;
      layout = compute(g, area, tech.items());
      const L = layout;
      // work surface and the display case that holds the reference
      const wk = { x: L.work.x + 2, y: L.work.y + 2, w: L.work.w - 4, h: L.work.h - 4 };
      const parts = splitWork(wk);
      drawGround(ctx, scene, wk, clock);
      drawDock(ctx, scene, parts.dock, clock);
      const fr = drawFrame(ctx, scene, L.thumb, pal);
      tech.draw(g, { work: parts.work, thumb: fr.inner }, clock);
      if (fr.glass) caseGlass(ctx, fr.inner);
      fx.draw(ctx);
      g.label(ctx, scene.words?.caption ?? tech.caption, L.thumb.x - 4, L.thumb.y - 26, g.px(24), pal.accent, 'left', '700');
      let y = L.info.y + g.px(14);
      for (const line of tech.info()) { for (const l of g.wrap(ctx, line, L.info.w, g.px(26))) { g.label(ctx, l, L.info.x, y, g.px(26), pal.ink, 'left', '500'); y += g.px(34); } }
      for (const b of L.ctrl) drawItem(g, b, press === b.id);
    },
    // A large rendering of the finished craft on its stage, for the shell's title screen.
    titleArt(g, rect, t) {
      const { ctx } = g, tt = t ?? clock;
      ctx.save();
      const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2, S = Math.min(rect.w, rect.h);
      const sw = Math.min(rect.w, rect.h * 1.15), sh = Math.min(rect.h, sw * 1.05);
      const st = drawStage(ctx, scene, { x: cx - sw / 2, y: cy - sh / 2, w: sw, h: sh }, tt);
      const A = Math.min(st.w, st.h) * 0.96;
      ctx.save(); rrect(ctx, st.x, st.y, st.w, st.h, 16); ctx.clip();
      tech.titleArt?.(g, { x: st.x + (st.w - A) / 2, y: st.y + (st.h - A) / 2 + st.h * 0.02, w: A, h: A }, tt);
      ctx.restore();
      void S;
      ctx.restore();
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
  void resultAt;
  return act;
}

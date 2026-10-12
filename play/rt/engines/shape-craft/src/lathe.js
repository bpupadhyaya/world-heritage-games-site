// lathe: shape a vessel on the wheel by setting its radius row by row, then glaze its bands from the tradition's palette.
import { clamp, profileRadii, smoothThrough, shade } from './geom.js';

export const LATHE_DEFAULTS = { profile: 'vase', rows: 10, steps: 10, variation: 0.05, tolerance: 0.32, bands: 5, clay: '#b9744a', glazes: [{ name: 'White', color: '#f1ede2' }, { name: 'Cobalt', color: '#1f4aa8' }, { name: 'Turquoise', color: '#2aa6a0' }], glazePattern: null, guide: true, wheelColor: '#6e6a66' };

function vesselPoints(cx, base, H, unit, radii) {
  const n = radii.length, rowH = H / n, top = base - H;
  const left = [[cx - radii[n - 1] * unit, top]], right = [[cx + radii[n - 1] * unit, top]];
  for (let i = n - 1; i >= 0; i--) { const y = base - (i + 0.5) * rowH; left.push([cx - radii[i] * unit, y]); right.push([cx + radii[i] * unit, y]); }
  left.push([cx - radii[0] * unit, base]); right.push([cx + radii[0] * unit, base]);
  return { left, right, top, rowH };
}

export function drawVessel(ctx, o) {
  const { cx, base, H, unit, radii, bands = 0, colors = [], clay, t = null, outlineOnly = false, accent = '#f2c14e', steps = 10 } = o;
  const { left, right, top, rowH } = vesselPoints(cx, base, H, unit, radii);
  const path = () => { ctx.beginPath(); smoothThrough(ctx, left); ctx.lineTo(right[right.length - 1][0], right[right.length - 1][1]); smoothThrough(ctx, right.slice().reverse(), false); ctx.closePath(); };
  if (outlineOnly) { path(); ctx.setLineDash([8, 6]); ctx.strokeStyle = accent; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]); return; }
  const n = radii.length, rmax = Math.max(...radii) * unit;
  ctx.save();
  path(); ctx.clip();
  const B = Math.max(1, bands);
  for (let k = 0; k < B; k++) {
    const yTop = base - ((k + 1) * n / B) * rowH, yBot = base - ((k * n) / B) * rowH;
    const c = colors[k] !== undefined && colors[k] >= 0 && o.glazes ? o.glazes[colors[k]].color : clay;
    ctx.fillStyle = c; ctx.fillRect(cx - rmax - 4, yTop - 1, rmax * 2 + 8, yBot - yTop + 2);
    if (bands > 0 && k > 0) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(cx - rmax - 4, yBot - 1.5, rmax * 2 + 8, 3); }
  }
  // throwing rings: faint horizontal ridges left by the fingers
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1;
  for (let i = 1; i < n * 2; i++) { const y = base - (i / (n * 2)) * H; ctx.beginPath(); ctx.moveTo(cx - rmax - 4, y); ctx.lineTo(cx + rmax + 4, y); ctx.stroke(); }
  const gr = ctx.createLinearGradient(cx - rmax, 0, cx + rmax, 0);
  gr.addColorStop(0, 'rgba(0,0,0,0.42)'); gr.addColorStop(0.28, 'rgba(255,255,255,0.28)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.04)'); gr.addColorStop(1, 'rgba(0,0,0,0.48)');
  ctx.fillStyle = gr; ctx.fillRect(cx - rmax - 4, top - 4, rmax * 2 + 8, H + 8);
  if (t !== null) {
    for (let k = 0; k < 7; k++) {
      const th = t * 2.2 + (k * Math.PI * 2) / 7, vis = Math.cos(th);
      if (vis <= 0) continue;
      ctx.strokeStyle = `rgba(255,255,255,${(vis * 0.22).toFixed(3)})`; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(cx + Math.sin(th) * radii[n - 1] * unit, top);
      for (let i = n - 1; i >= 0; i--) ctx.lineTo(cx + Math.sin(th) * radii[i] * unit, base - (i + 0.5) * rowH);
      ctx.lineTo(cx + Math.sin(th) * radii[0] * unit, base); ctx.stroke();
    }
  }
  ctx.restore();
  path(); ctx.strokeStyle = 'rgba(20,10,5,0.75)'; ctx.lineWidth = 2; ctx.stroke();
  const rt = radii[n - 1] * unit;
  ctx.beginPath(); ctx.ellipse(cx, top, rt, Math.max(3, rt * 0.2), 0, 0, Math.PI * 2);
  ctx.fillStyle = '#2b160c'; ctx.fill(); ctx.strokeStyle = shade(clay, -0.2); ctx.lineWidth = 2; ctx.stroke();
}

export function createLathe(P, env) {
  const { rng, audio } = env;
  const n = P.rows, steps = P.steps;
  const hasGlaze = P.bands > 0;
  let drag = false, radii, target, colors, targetColors, phase, sel, undo, done, rects = null, geo = null, clock = 0, acc = 0, attractStage = 0;

  const makeTarget = () => {
    target = profileRadii(P.profile, n, steps, P.variation, rng, P.explicitProfile);
    if (P.glazePattern && P.glazePattern.length) { targetColors = Array.from({ length: P.bands }, (_, k) => P.glazePattern[k % P.glazePattern.length]); return; }
    const g = P.glazes.length, main = rng.int(g), acc2 = (main + 1 + rng.int(Math.max(1, g - 1))) % g;
    targetColors = Array.from({ length: P.bands }, (_, k) => (k % 2 ? acc2 : main));
    if (g > 2) targetColors[rng.int(P.bands)] = (main + 2) % g === acc2 ? (acc2 + 1) % g : (main + 2) % g;
  };
  const init = () => {
    makeTarget();
    const start = clamp(Math.round(steps * 0.55), 1, steps);
    radii = new Array(n).fill(start); colors = new Array(P.bands).fill(-1);
    phase = 'shape'; sel = 0; undo = []; done = null; attractStage = 0; acc = 0;
  };
  init();

  const snapshot = () => undo.push({ radii: radii.slice(), colors: colors.slice(), phase });
  const shapeScore = () => { let e = 0; for (let i = 0; i < n; i++) e += Math.abs(radii[i] - target[i]); e = e / n / steps; return Math.round(100 * clamp(1 - e / P.tolerance, 0, 1)); };
  const glazeScore = () => { if (!hasGlaze) return 100; let ok = 0; for (let k = 0; k < P.bands; k++) if (colors[k] === targetColors[k]) ok++; return Math.round((100 * ok) / P.bands); };
  const score = () => {
    const s = shapeScore(), g = glazeScore();
    const total = hasGlaze ? Math.round(s * 0.7 + g * 0.3) : s;
    return { score: total, detail: hasGlaze ? `Shape ${s} of 100, glaze ${Math.round((g * P.bands) / 100)} of ${P.bands} bands right` : `Shape ${s} of 100` };
  };

  const items = () => {
    const out = [];
    if (phase === 'glaze') P.glazes.forEach((gl, i) => out.push({ id: `glaze:${i}`, kind: 'swatch', color: gl.color, on: sel === i, name: gl.name }));
    out.push({ id: 'undo', kind: 'btn', label: 'Undo', off: !undo.length });
    if (phase === 'glaze') out.push({ id: 'shape', kind: 'btn', label: 'Reshape' });
    else out.push({ id: 'reset', kind: 'btn', label: 'Reset' });
    if (phase === 'shape' && hasGlaze) out.push({ id: 'glaze', kind: 'btn', label: 'Glaze', primary: true });
    else out.push({ id: 'check', kind: 'btn', label: 'Check', primary: true });
    return out;
  };

  const control = (id) => {
    if (done) return;
    if (id === 'undo') { const u = undo.pop(); if (u) { radii = u.radii; colors = u.colors; phase = u.phase; } }
    else if (id === 'reset') { snapshot(); radii = new Array(n).fill(clamp(Math.round(steps * 0.55), 1, steps)); }
    else if (id === 'glaze') { snapshot(); phase = 'glaze'; audio?.tone({ freq: 520, to: 700, dur: 0.12, type: 'triangle' }); }
    else if (id === 'shape') { snapshot(); phase = 'shape'; }
    else if (id.startsWith('glaze:')) sel = Number(id.slice(6));
    else if (id === 'check') finish();
  };
  const finish = () => {
    const r = score(), stars = r.score >= 88 ? 3 : r.score >= 65 ? 2 : r.score >= 40 ? 1 : 0;
    done = { score: r.score, max: 100, stars, headline: stars === 3 ? 'A fine vessel' : stars ? 'A good pot' : 'Back to the wheel', detail: r.detail };
  };

  const rowAt = (y) => clamp(Math.floor((geo.base - y) / geo.rowH), 0, n - 1);
  const setRow = (i, r) => {
    r = clamp(r, 1, steps);
    if (radii[i] !== r) { radii[i] = r; audio?.tone({ freq: 140 + r * 18, dur: 0.04, type: 'triangle', vol: 0.15 }); }
  };
  const work = (p) => {
    if (!geo || done) return;
    const inside = p.x >= rects.work.x && p.x <= rects.work.x + rects.work.w && p.y >= rects.work.y && p.y <= rects.work.y + rects.work.h;
    if (p.pressed && inside) { snapshot(); drag = true; }
    if (p.released && !p.down) { if (p.pressed && drag) apply(p); drag = false; return; }
    if (!drag || !inside) return;
    apply(p);
  };
  const apply = (p) => {
    const i = rowAt(p.y);
    if (phase === 'shape') setRow(i, Math.round(Math.abs(p.x - geo.cx) / geo.unit));
    else {
      const k = Math.floor((i * P.bands) / n);
      if (colors[k] !== sel) { colors[k] = sel; audio?.tone({ freq: 400 + sel * 90, dur: 0.06 }); }
    }
  };

  const draw = (g, R, t) => {
    const { ctx, pal } = g;
    rects = R; clock = t;
    const W = R.work;
    // thumbnail of the target
    const th = R.thumb, tH = th.h * 0.8, tUnit = Math.min((th.w * 0.46) / steps, tH / 11);
    const shelf = (c, y, w) => { ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(c - w, y, w * 2, 3); };
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; g.rr(ctx, th.x, th.y, th.w, th.h, 12); ctx.fill();
    drawVessel(ctx, { cx: th.x + th.w / 2, base: th.y + th.h * 0.92, H: tH, unit: tUnit, radii: target, bands: P.bands, colors: targetColors, glazes: P.glazes, clay: P.clay, steps });
    shelf(th.x + th.w / 2, th.y + th.h * 0.92, th.w * 0.35);
    // wheel + work vessel
    const unit = Math.min((W.w * 0.46) / steps, (W.h * 0.74) / (n * 1.1));
    const H = Math.min(W.h * 0.74, W.w * 1.0);
    const base = W.y + W.h * 0.9, cx = W.x + W.w / 2;
    geo = { cx, base, unit, H, rowH: H / n };
    const wr = Math.min(steps * unit * 1.15, W.w / 2 - 2);
    ctx.fillStyle = '#35302c'; ctx.fillRect(cx - 14, base + 10, 28, W.h * 0.1 - 4);
    ctx.beginPath(); ctx.ellipse(cx, base + 2, wr, Math.max(8, wr * 0.13), 0, 0, Math.PI * 2); ctx.fillStyle = P.wheelColor; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2; ctx.stroke();
    for (let k = 0; k < 9; k++) { const a = clock * 1.3 + (k * Math.PI * 2) / 9; if (Math.sin(a) > -0.2) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(cx + Math.cos(a) * wr * 0.92 - 2, base + 2 + Math.sin(a) * wr * 0.12 - 1, 4, 3); } }
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
    for (let k = -steps; k <= steps; k++) { ctx.beginPath(); ctx.moveTo(cx + k * unit, base - H - 6); ctx.lineTo(cx + k * unit, base); ctx.stroke(); }
    if (P.guide) drawVessel(ctx, { cx, base, H, unit, radii: target, outlineOnly: true, accent: pal.accent });
    drawVessel(ctx, { cx, base, H, unit, radii, bands: P.bands, colors: phase === 'glaze' || colors.some((c) => c >= 0) ? colors : [], glazes: P.glazes, clay: P.clay, t: done ? null : clock, steps });
    if (P.guide) drawVessel(ctx, { cx, base, H, unit, radii: target, outlineOnly: true, accent: pal.accent });
    g.label(ctx, phase === 'shape' ? 'Drag across the clay to set its width' : 'Tap a band to glaze it', cx, W.y + 12, g.px(18), pal.dim, 'center', '500');
  };

  const attract = (dt) => {
    if (done) return;
    acc += dt;
    if (acc < 0.07) return; acc = 0;
    if (phase === 'shape') {
      for (let i = 0; i < n; i++) if (radii[i] !== target[i]) { radii[i] += Math.sign(target[i] - radii[i]); return; }
      if (hasGlaze) phase = 'glaze'; else finish();
    } else {
      for (let k = 0; k < P.bands; k++) if (colors[k] !== targetColors[k]) { sel = targetColors[k]; colors[k] = sel; acc = -0.2; return; }
      acc = -0.4; if (++attractStage > 2) finish();
    }
  };

  return {
    init, items, control, work, draw, attract, result: () => done,
    score: () => score().score,
    info: () => [`Rows: ${n}`, hasGlaze ? `Bands to glaze: ${P.bands}` : 'Bare clay'],
    caption: 'Make this vessel',
    hint() {
      if (phase === 'shape') { for (let i = n - 1; i >= 0; i--) if (radii[i] !== target[i]) return `Row ${n - i} from the top should be ${target[i] > radii[i] ? 'wider' : 'narrower'}.`; return 'The shape matches: press Glaze.'; }
      for (let k = 0; k < P.bands; k++) if (colors[k] !== targetColors[k]) return `Band ${k + 1} from the bottom needs ${P.glazes[targetColors[k]].name}.`;
      return 'The glaze matches: press Check.';
    },
    rules: () => ['Score: how closely the vessel width matches the target on every row (70 percent) and how many glaze bands have the right colour (30 percent).'],
    point(id) {
      if (!geo) return null;
      if (id.startsWith('lathe:')) { const [, row, rad] = id.split(':').map(Number); return { x: geo.cx + rad * geo.unit, y: geo.base - (row + 0.5) * geo.rowH }; }
      if (id.startsWith('band:')) { const k = Number(id.slice(5)); const row = Math.floor(((k + 0.5) * n) / P.bands); return { x: geo.cx, y: geo.base - (row + 0.5) * geo.rowH }; }
      return null;
    },
    state: () => ({ technique: 'lathe', phase, radii, target, colors, targetColors, sel, rows: n, bands: P.bands, steps, shape: shapeScore(), glaze: glazeScore() }),
  };
}

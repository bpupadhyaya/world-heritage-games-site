// lathe: shape a vessel on the wheel by setting its radius row by row, then glaze its bands from the tradition's palette.
import { clamp, profileRadii, smoothThrough, hash } from './geom.js';
import { tint, litEdge, rrect, rgba, mix, shadowed, shelf } from './fx.js';

export const LATHE_DEFAULTS = { profile: 'vase', rows: 10, steps: 10, variation: 0.05, tolerance: 0.32, bands: 5, clay: '#b9744a', glazes: [{ name: 'White', color: '#f1ede2' }, { name: 'Cobalt', color: '#1f4aa8' }, { name: 'Turquoise', color: '#2aa6a0' }], glazePattern: null, guide: true, wheelColor: '#6e6a66' };

function vesselPoints(cx, base, H, unit, radii) {
  const n = radii.length, rowH = H / n, top = base - H;
  const left = [[cx - radii[n - 1] * unit, top]], right = [[cx + radii[n - 1] * unit, top]];
  for (let i = n - 1; i >= 0; i--) { const y = base - (i + 0.5) * rowH; left.push([cx - radii[i] * unit, y]); right.push([cx + radii[i] * unit, y]); }
  left.push([cx - radii[0] * unit, base]); right.push([cx + radii[0] * unit, base]);
  return { left, right, top, rowH };
}

export function drawVessel(ctx, o) {
  const { cx, base, H, unit, radii, bands = 0, colors = [], clay, t = null, outlineOnly = false, accent = '#f2c14e', steps = 10, wet = 0 } = o;
  const { left, right, top, rowH } = vesselPoints(cx, base, H, unit, radii);
  const path = () => { ctx.beginPath(); smoothThrough(ctx, left); ctx.lineTo(right[right.length - 1][0], right[right.length - 1][1]); smoothThrough(ctx, right.slice().reverse(), false); ctx.closePath(); };
  if (outlineOnly) { path(); litEdge(ctx, accent, 2.4, t ?? 0); return; }
  const n = radii.length, rmax = Math.max(...radii) * unit;
  // contact shadow on the wheel
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.ellipse(cx + rmax * 0.08, base + 2, radii[0] * unit * 1.08 + 4, Math.max(4, radii[0] * unit * 0.16), 0, 0, 6.2832); ctx.fill(); ctx.restore();
  ctx.save();
  path(); ctx.clip();
  const B = Math.max(1, bands), glazed = bands > 0 && colors.some((c) => c >= 0);
  const x0 = cx - rmax - 4, wd = rmax * 2 + 8;
  for (let k = 0; k < B; k++) {
    const yTop = base - ((k + 1) * n / B) * rowH, yBot = base - ((k * n) / B) * rowH;
    const has = colors[k] !== undefined && colors[k] >= 0 && o.glazes;
    const c = has ? o.glazes[colors[k]].color : clay;
    const vg = ctx.createLinearGradient(0, yTop, 0, yBot);
    vg.addColorStop(0, has ? tint(c, 0.08) : c); vg.addColorStop(1, has ? tint(c, -0.1) : tint(c, -0.04));
    ctx.fillStyle = vg; ctx.fillRect(x0, yTop - 1, wd, yBot - yTop + 2);
    if (bands > 0 && k > 0) {
      ctx.fillStyle = has ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.09)'; ctx.fillRect(x0, yBot - 1.5, wd, 2.5);
      if (has) { // glaze pools and drips at the lower edge of the band
        ctx.fillStyle = tint(c, -0.2);
        for (let d = 0; d < 6; d++) { const dx = cx - rmax + hash(k, d, 3) * rmax * 2, len = rowH * (0.15 + 0.5 * hash(k, d, 4)); if (hash(k, d, 5) > 0.45) { rrect(ctx, dx - 1.8, yBot - 1, 3.6, len, 1.8); ctx.fill(); } }
      }
    }
  }
  // throwing rings left by the fingers: finer and brighter while the clay is raw
  ctx.lineWidth = 1;
  for (let i = 1; i < n * 3; i++) { const y = base - (i / (n * 3)) * H; ctx.strokeStyle = glazed ? 'rgba(0,0,0,0.05)' : (i % 2 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.07)'); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + wd, y); ctx.stroke(); }
  // cylinder light: a soft key on the left, a reflected edge light on the right
  const gr = ctx.createLinearGradient(cx - rmax, 0, cx + rmax, 0);
  gr.addColorStop(0, 'rgba(0,0,0,0.5)'); gr.addColorStop(0.16, 'rgba(0,0,0,0.12)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.3)'); gr.addColorStop(0.42, 'rgba(255,255,255,0.05)'); gr.addColorStop(0.82, 'rgba(0,0,0,0.3)'); gr.addColorStop(0.93, 'rgba(255,255,255,0.1)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = gr; ctx.fillRect(x0, top - 4, wd, H + 8);
  // gloss strip (glaze) or wet sheen (raw clay)
  const sx = cx - rmax * 0.42, gs = ctx.createLinearGradient(sx - rmax * 0.1, 0, sx + rmax * 0.1, 0);
  const ga = glazed ? 0.5 : 0.16 + wet * 0.22;
  gs.addColorStop(0, 'rgba(255,255,255,0)'); gs.addColorStop(0.5, `rgba(255,255,255,${ga})`); gs.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gs; ctx.fillRect(sx - rmax * 0.1, top + H * 0.04, rmax * 0.2, H * 0.9);
  if (t !== null) {
    for (let k = 0; k < 7; k++) {
      const th = t * 2.2 + (k * Math.PI * 2) / 7, vis = Math.cos(th);
      if (vis <= 0) continue;
      ctx.strokeStyle = `rgba(255,255,255,${(vis * 0.14).toFixed(3)})`; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(cx + Math.sin(th) * radii[n - 1] * unit, top);
      for (let i = n - 1; i >= 0; i--) ctx.lineTo(cx + Math.sin(th) * radii[i] * unit, base - (i + 0.5) * rowH);
      ctx.lineTo(cx + Math.sin(th) * radii[0] * unit, base); ctx.stroke();
    }
  }
  ctx.restore();
  path(); ctx.strokeStyle = 'rgba(20,10,5,0.7)'; ctx.lineWidth = 1.8; ctx.stroke();
  // rim: a lip with an inner shadow
  const rt = radii[n - 1] * unit, ry = Math.max(3, rt * 0.2);
  ctx.beginPath(); ctx.ellipse(cx, top, rt, ry, 0, 0, 6.2832);
  const ig = ctx.createLinearGradient(0, top - ry, 0, top + ry); ig.addColorStop(0, '#0a0503'); ig.addColorStop(1, '#3a1d10');
  ctx.fillStyle = ig; ctx.fill(); ctx.strokeStyle = tint(clay, 0.25); ctx.lineWidth = 2.2; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cx, top, rt, ry, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.6; ctx.stroke();
}

export function createLathe(P, env) {
  const { rng, audio, fx } = env;
  let toolAt = null, lastPtr = null, wetUntil = 0;
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
    if (radii[i] !== r) {
      radii[i] = r; audio?.tone({ freq: 140 + r * 18, dur: 0.04, type: 'triangle', vol: 0.15 }); wetUntil = clock + 2.5;
      if (geo && fx) { const y = geo.base - (i + 0.5) * geo.rowH; fx.emit('drop', geo.cx + r * geo.unit, y, { count: 2, color: tint(P.clay, -0.05), size: 3.4, speed: 90, life: 0.5, gravity: 520, spread: 2.2, angle: -0.6 }); }
    }
  };
  const work = (p) => {
    if (!geo || done) return;
    lastPtr = { x: p.x, y: p.y, down: p.down, t: clock };
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

  const wheelAndVessel = (ctx, pal, cx, base, H, unit, W, radiiArr, colorsArr, t, guide, wet) => {
    const wr = Math.min(steps * unit * 1.2, W.w / 2 - 2), ry = Math.max(8, wr * 0.14);
    // splash pan and wheel head
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx, base + ry * 0.9, wr * 1.28, ry * 1.55, 0, 0, 6.2832); ctx.fill();
    const pan = ctx.createLinearGradient(cx - wr * 1.3, 0, cx + wr * 1.3, 0); pan.addColorStop(0, '#2a2724'); pan.addColorStop(0.5, '#4a4540'); pan.addColorStop(1, '#25221f');
    ctx.fillStyle = pan; ctx.beginPath(); ctx.ellipse(cx, base + ry * 0.7, wr * 1.22, ry * 1.4, 0, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#35302c'; ctx.fillRect(cx - 14, base + ry, 28, Math.max(8, W.h * 0.07));
    const hg = ctx.createLinearGradient(cx - wr, 0, cx + wr, 0); hg.addColorStop(0, tint(P.wheelColor, -0.25)); hg.addColorStop(0.35, tint(P.wheelColor, 0.25)); hg.addColorStop(1, tint(P.wheelColor, -0.35));
    ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(cx, base + 2, wr, ry, 0, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
    for (let k = 1; k < 4; k++) { ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(cx, base + 2, wr * (k / 4), ry * (k / 4), 0, 0, 6.2832); ctx.stroke(); }
    for (let k = 0; k < 11; k++) { const a = t * 1.6 + (k * Math.PI * 2) / 11; if (Math.sin(a) > -0.1) { ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(cx + Math.cos(a) * wr * 0.9 - 2, base + 2 + Math.sin(a) * ry * 0.9 - 1, 4, 3); } }
    if (guide) { ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1; for (let k = -steps; k <= steps; k++) { ctx.beginPath(); ctx.moveTo(cx + k * unit, base - H - 6); ctx.lineTo(cx + k * unit, base); ctx.stroke(); } }
    drawVessel(ctx, { cx, base, H, unit, radii: radiiArr, bands: P.bands, colors: colorsArr, glazes: P.glazes, clay: P.clay, t: done ? null : t, steps, wet });
  };

  const draw = (g, R, t) => {
    const { ctx, pal } = g;
    rects = R; clock = t;
    const W = R.work;
    // the reference on its shelf
    const th = R.thumb, tH = th.h * 0.78, tUnit = Math.min((th.w * 0.44) / steps, tH / 11), tb = th.y + th.h * 0.88;
    shelf(ctx, th.x + th.w / 2, tb, th.w * 0.36);
    drawVessel(ctx, { cx: th.x + th.w / 2, base: tb, H: tH, unit: tUnit, radii: target, bands: P.bands, colors: targetColors, glazes: P.glazes, clay: P.clay, steps });
    // wheel + work vessel
    const unit = Math.min((W.w * 0.46) / steps, (W.h * 0.7) / (n * 1.1));
    const base = W.y + W.h * 0.86, cx = W.x + W.w / 2;
    const H = Math.min(W.h * 0.7, W.w * 1.0, base - W.y - 56 - steps * unit * 0.2);
    geo = { cx, base, unit, H, rowH: H / n };
    if (P.guide) drawVessel(ctx, { cx, base, H, unit, radii: target, outlineOnly: true, accent: pal.accent, t });
    const wet = clamp((wetUntil - t) / 2.5, 0, 1);
    wheelAndVessel(ctx, pal, cx, base, H, unit, W, radii, phase === 'glaze' || colors.some((c) => c >= 0) ? colors : [], t, true, wet);
    if (P.guide) drawVessel(ctx, { cx, base, H, unit, radii: target, outlineOnly: true, accent: pal.accent, t });
    // the rib tool where the finger is working
    if (!done && lastPtr && lastPtr.down && t - lastPtr.t < 0.3) {
      const i = rowAt(lastPtr.y), ex = geo.cx + radii[i] * geo.unit, ey = geo.base - (i + 0.5) * geo.rowH;
      ctx.save(); ctx.translate(ex + 4, ey); ctx.rotate(0.25);
      shadowed(ctx, () => { const gr = ctx.createLinearGradient(0, -22, 0, 22); gr.addColorStop(0, '#e2b878'); gr.addColorStop(1, '#8a5b2d'); rrect(ctx, 0, -20, 46, 40, 14); ctx.fillStyle = gr; ctx.fill(); }, { blur: 8, dx: 3, dy: 4, a: 0.5 });
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5; rrect(ctx, 0, -20, 46, 40, 14); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.arc(30, 0, 5, 0, 6.2832); ctx.fill();
      ctx.restore();
    }
    g.label(ctx, phase === 'shape' ? 'Drag across the clay to set its width' : 'Tap a band to glaze it', cx, W.y + 26, g.px(24), pal.dim, 'center', '500');
  };

  const titleArt = (g, S, t) => {
    const { ctx, pal } = g;
    const unit = Math.min((S.w * 0.42) / steps, (S.h * 0.66) / (n * 1.1)), H = S.h * 0.66, base = S.y + S.h * 0.8, cx = S.x + S.w / 2;
    wheelAndVessel(ctx, pal, cx, base, H, unit, { x: S.x, y: S.y, w: S.w * 0.74, h: S.h }, target, targetColors, t, false, 0.3);
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
    init, items, control, work, draw, attract, titleArt, surface: 'slate', surfaceTint: '#5c5148', result: () => done,
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

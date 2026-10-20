// shape-craft technique `marble` (1.16.0): paper marbling on a tray of thickened water (Ebru).
//   Drops of paint float on the size and spread; every new drop pushes the earlier ones outward. A needle or a comb drawn through the paint drags the
//   colours with it. Finally a sheet of paper is laid on the tray and lifted, and takes the pattern.
// The geometry follows the usual marbling maps: a drop of radius r at C moves every point P to C + (P - C) * sqrt(1 + r^2 / |P - C|^2); a needle moving
// from A to B drags each point by (B - A) weighted by a bell of its distance to the path. The reference is the same script run once; the score
// compares what is under every cell of a coarse grid with the target (a cell may match any colour within one cell of it). Doing nothing scores 0.
import { registerTechnique } from './registry.js';
import { starsFor, hash } from './geom.js';
import { shadowed, rrect, rgba, tint, mix, shelf } from './fx.js';
import { drawTool, wallLift } from './scenes.js';
import { fx as synth } from '../../../platform/engine-kit/synth.js';
import { clamp } from './paint-stroke.js';
import { PATTERNS, PATTERN_IDS, AR } from './marble-patterns.js';

const TAU = Math.PI * 2;
const GC = 30, GR = Math.round(GC * AR);             // grid used to compare with the target
const CW = { stylus: 0.03, comb: 0.02 };              // width of the bell a needle drags
const MAXPTS = 1100;

function createSound(audio) {
  const F = (kind, p) => { try { return synth(audio, kind, p); } catch { return false; } };
  let carried = 0;
  return {
    drop(r) { F('pop', { vel: 0.5 }); F('splash', { vel: 0.18 + r, delay: 0.02 }); },
    drag(len) { carried += len; if (carried < 0.05) return; carried = 0; F('scrape', { hz: 1700, dur: 0.1, vel: 0.28 }); },
    tool() { F('tick', { hz: 1500, vel: 0.3 }); },
    lay() { F('whoosh', { dur: 0.5, vel: 0.35, down: true }); F('scrape', { hz: 800, dur: 0.5, vel: 0.3, delay: 0.3 }); },
    win(stars) { F('good', { hz: 660 + stars * 60, vel: 0.55 }); },
    undo() { F('pop', { vel: 0.35 }); },
  };
}

// ---- the paint ----------------------------------------------------------------------------------------------------------------------------
const circle = (cx, cy, r, n = 72) => Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * TAU) * r, cy + Math.sin((i / n) * TAU) * r]);
function refine(poly) {   // keep the outline smooth where it has been stretched
  if (poly.length > MAXPTS) return poly;
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    out.push(a);
    if (d > 0.026 && out.length + poly.length < MAXPTS * 1.2) { const n = Math.min(6, Math.floor(d / 0.016)); for (let k = 1; k <= n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / (n + 1), a[1] + ((b[1] - a[1]) * k) / (n + 1)]); }
  }
  return out;
}
function dropOn(drops, cx, cy, r, c) {
  const r2 = r * r;
  for (const d of drops) for (const p of d.pts) { const dx = p[0] - cx, dy = p[1] - cy, q = dx * dx + dy * dy; if (q < 1e-10) { p[0] = cx + r; p[1] = cy; continue; } const f = Math.sqrt(1 + r2 / q); p[0] = cx + dx * f; p[1] = cy + dy * f; }
  drops.forEach((d) => { d.pts = refine(d.pts); });
  drops.push({ c, pts: circle(cx, cy, r) });
}
function tine(drops, ax, ay, bx, by, cw) {
  const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy; if (L2 < 1e-10) return;
  const inv = 1 / (cw * cw);
  for (const d of drops) for (const p of d.pts) {
    const t = clamp(((p[0] - ax) * dx + (p[1] - ay) * dy) / L2, 0, 1), qx = p[0] - (ax + dx * t), qy = p[1] - (ay + dy * t), w = Math.exp(-(qx * qx + qy * qy) * inv);
    if (w < 0.004) continue;
    p[0] += dx * w; p[1] += dy * w;
  }
}
function drag(drops, tool, ax, ay, bx, by, tines = 1, gap = 0) {
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  for (let j = 0; j < tines; j++) { const off = (j - (tines - 1) / 2) * gap; tine(drops, ax + nx * off, ay + ny * off, bx + nx * off, by + ny * off, tool === 'comb' ? CW.comb : CW.stylus); }
  for (const d of drops) d.pts = refine(d.pts);
}
function along(drops, tool, pts, tines, gap, step = 0.014) {
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < n; k++) drag(drops, tool, a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n, a[0] + ((b[0] - a[0]) * (k + 1)) / n, a[1] + ((b[1] - a[1]) * (k + 1)) / n, tines, gap);
  }
}
function runStep(drops, st) {
  if (st.t === 'drop') dropOn(drops, st.x, st.y, st.r, st.c);
  else along(drops, st.t, st.pts, st.tines ?? 1, st.gap ?? 0);
}
// what lies under the centre of every cell of the comparison grid (colour index, -1 = bare size); the topmost drop wins
function labels(drops) {
  const out = new Int8Array(GC * GR).fill(-1);
  const bb = drops.map((d) => { let x0 = 9, y0 = 9, x1 = -9, y1 = -9; for (const p of d.pts) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; } return [x0, y0, x1, y1]; });
  for (let j = 0; j < GR; j++) for (let i = 0; i < GC; i++) {
    const x = (i + 0.5) / GC, y = ((j + 0.5) / GR) * AR;
    for (let k = drops.length - 1; k >= 0; k--) {
      const b = bb[k]; if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue;
      const pts = drops[k].pts; let ins = false;
      for (let a = 0, c = pts.length - 1; a < pts.length; c = a++) { const pa = pts[a], pc = pts[c]; if ((pa[1] > y) !== (pc[1] > y) && x < ((pc[0] - pa[0]) * (y - pa[1])) / (pc[1] - pa[1]) + pa[0]) ins = !ins; }
      if (ins) { out[j * GC + i] = drops[k].c; break; }
    }
  }
  return out;
}
function match(L, T) {   // share of cells that agree with the target, a cell counting if the target colour is within one cell of it; then scaled above an empty tray
  let ok = 0, base = 0;
  for (let j = 0; j < GR; j++) for (let i = 0; i < GC; i++) {
    const t = T[j * GC + i]; if (t < 0) base++;
    let hit = L[j * GC + i] === t;
    for (let dj = -1; dj <= 1 && !hit; dj++) for (let di = -1; di <= 1 && !hit; di++) { const jj = j + dj, ii = i + di; if (jj >= 0 && jj < GR && ii >= 0 && ii < GC && L[jj * GC + ii] === t) hit = true; }
    if (hit && L[j * GC + i] === t) ok += 1; else if (hit) ok += 0.7;
  }
  const n = GC * GR, b0 = base / n;
  return clamp((ok / n - b0) / (1 - b0 - 0.08), 0, 1);
}

export function createMarble(P, env) {
  const { rng, fx } = env, SC = P.scene ?? {};
  const snd = createSound(env.audio);
  if (env.options?.soundLog) for (const k of Object.keys(snd)) { const f = snd[k]; snd[k] = (...a) => { env.options.soundLog.push({ kind: `marble.${k}` }); return f(...a); }; }
  const PAL = P.palette ?? [{ name: 'Red', color: '#c62a2a' }, { name: 'Turquoise', color: '#1f9aa6' }, { name: 'Gold', color: '#e8b53a' }, { name: 'Indigo', color: '#243a82' }];
  let pid = PATTERN_IDS.includes(P.design) ? P.design : 'karanfil';
  let script, drops, target, targetLab, undo, step, tool, color, size, phase, done, geo, now, ptr, last, gesture, dirty, lastScore, lastAt, auto, printAt, hand;

  const init = () => {
    if (Array.isArray(P.designs) && P.designs.length) { const ok = P.designs.filter((x) => PATTERN_IDS.includes(x)); if (ok.length) pid = ok[rng.int(ok.length)]; }
    script = PATTERNS[pid](rng.next());
    target = []; for (const s of script) runStep(target, s); targetLab = labels(target);
    drops = []; undo = []; step = 0; tool = 'drop'; color = script[0]?.c ?? 0; size = 'M'; phase = 'make'; done = null; geo = null; now = 0; ptr = null; last = null; gesture = false; dirty = true; lastScore = 0; lastAt = -9; printAt = -1; hand = null;
    buildAuto(); selectFor(0);
  };
  const selectFor = (i) => { const s = script[i]; if (!s) return; tool = s.t; if (s.t === 'drop') { color = s.c; size = s.r > 0.135 ? 'L' : s.r > 0.078 ? 'M' : 'S'; } };
  const radius = () => ({ S: 0.055, M: 0.1, L: 0.17 }[size]);
  const compute = () => { if (!dirty) return lastScore; dirty = false; lastScore = Math.round(100 * match(labels(drops), targetLab)); lastAt = now; return lastScore; };
  const total = () => (done ? done.score : dirty && now - lastAt > 0.7 ? compute() : lastScore);

  const snap = () => undo.push(drops.map((d) => ({ c: d.c, pts: d.pts.map((p) => [p[0], p[1]]) })));
  const doDrop = (x, y) => { snap(); dropOn(drops, x, y, radius(), color); dirty = true; snd.drop(radius()); const st = script[step]; if (st?.t === 'drop') step++; if (step < script.length) selectFor(step); if (geo) fx.emit('drop', geo.ox + x * geo.s, geo.oy + y * geo.s, { count: 3, color: PAL[color]?.color ?? '#fff', size: 4, speed: 60, life: 0.5, gravity: 80, spread: 3, angle: -1.57 }); };
  const toLocal = (x, y) => [(x - geo.ox) / geo.s, (y - geo.oy) / geo.s];
  const inTray = (u, v) => u >= -0.02 && u <= 1.02 && v >= -0.02 && v <= AR + 0.02;
  const tinesNow = () => { const st = script[step]; return tool === 'comb' ? [st?.t === 'comb' ? st.tines : 5, st?.t === 'comb' ? st.gap : 0.19] : [1, 0]; };

  const control = (id) => {
    if (done || phase !== 'make') return;
    if (id === 'undo') { const u = undo.pop(); if (u) { drops = u; dirty = true; step = Math.max(0, step - 1); selectFor(step); snd.undo(); } }
    else if (id === 'reset') { snap(); drops = []; step = 0; dirty = true; selectFor(0); }
    else if (id.startsWith('color:')) { color = Number(id.slice(6)); tool = 'drop'; snd.tool(); }
    else if (id.startsWith('tool:')) { tool = id.slice(5); snd.tool(); }
    else if (id === 'size') { size = size === 'S' ? 'M' : size === 'M' ? 'L' : 'S'; snd.tool(); }
    else if (id === 'check') lay();
  };
  const lay = () => { if (phase !== 'make') return; phase = 'print'; printAt = now; snd.lay(); };
  const finish = () => {
    const score = compute(), stars = starsFor(score), W = SC.words ?? {};
    done = { score, max: 100, stars, headline: stars === 3 ? (W.win ?? 'A sheet worth framing') : stars ? (W.ok ?? 'A good print') : (W.retry ?? 'Back to the tray'), detail: `The print matches the pattern by ${score} percent` };
    snd.win(stars);
    if (geo) fx.emit('spark', geo.ox + geo.s / 2, geo.oy + (geo.s * AR) / 2, { count: 14, color: '#fff8e0', size: 8, speed: 150, life: 0.9, gravity: 50 });
  };
  const work = (p) => {
    if (!geo || done || phase !== 'make') return;
    ptr = { x: p.x, y: p.y };
    const [u, v] = toLocal(p.x, p.y);
    if (p.pressed && inTray(u, v)) {
      if (tool === 'drop') { doDrop(clamp(u, 0.02, 0.98), clamp(v, 0.02, AR - 0.02)); gesture = false; last = null; return; }
      snap(); gesture = true; last = [u, v]; return;
    }
    if (gesture && p.down && last) {
      const d = Math.hypot(u - last[0], v - last[1]); if (d < 0.006) return;
      const n = Math.ceil(d / 0.02), [tn, gp] = tinesNow();
      for (let k = 0; k < n; k++) drag(drops, tool, last[0] + ((u - last[0]) * k) / n, last[1] + ((v - last[1]) * k) / n, last[0] + ((u - last[0]) * (k + 1)) / n, last[1] + ((v - last[1]) * (k + 1)) / n, tn, gp);
      snd.drag(d); dirty = true; last = [u, v];
    }
    if (gesture && (p.released || !p.down)) { gesture = false; last = null; const st = script[step]; if (st && st.t !== 'drop') { step++; if (step < script.length) selectFor(step); } }
  };
  const tick = (dt) => {
    now += dt;
    if (phase === 'print' && now - printAt > 1.6 && !done) finish();
  };

  // ---- attract: the script, played by a hand ----------------------------------------------------------------------------------------------
  function buildAuto() { auto = { i: 0, wait: 0.5, st: null }; }
  const attract = (dt) => {
    if (done) return;
    if (auto.wait > 0) { auto.wait -= dt; return; }
    const st = auto.st;
    if (st) {
      st.s = Math.min(st.len, st.s + 0.9 * dt); const f = st.len ? st.s / st.len : 1;
      // walk the polyline
      let acc = 0, at = st.pts[st.pts.length - 1];
      for (let i = 0; i + 1 < st.pts.length; i++) { const a = st.pts[i], b = st.pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (acc + l >= st.s) { const t = (st.s - acc) / (l || 1); at = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; break; } acc += l; }
      const pr = st.cur ?? st.pts[0], d = Math.hypot(at[0] - pr[0], at[1] - pr[1]);
      if (d > 0.001) { const n = Math.ceil(d / 0.02); for (let k = 0; k < n; k++) drag(drops, st.t, pr[0] + ((at[0] - pr[0]) * k) / n, pr[1] + ((at[1] - pr[1]) * k) / n, pr[0] + ((at[0] - pr[0]) * (k + 1)) / n, pr[1] + ((at[1] - pr[1]) * (k + 1)) / n, st.tines ?? 1, st.gap ?? 0); dirty = true; snd.drag(d); }
      st.cur = at; hand = at;
      if (f >= 1) { auto.st = null; hand = null; step++; auto.wait = 0.12; }
      return;
    }
    const s = script[auto.i];
    if (!s) { if (phase === 'make') { lay(); } auto.wait = 1; return; }
    auto.i++;
    if (s.t === 'drop') { color = s.c; dropOn(drops, s.x, s.y, s.r, s.c); dirty = true; snd.drop(s.r); step++; hand = [s.x, s.y]; auto.wait = 0.28; if (geo) fx.emit('drop', geo.ox + s.x * geo.s, geo.oy + s.y * geo.s, { count: 3, color: PAL[s.c]?.color ?? '#fff', size: 4, speed: 60, life: 0.5, gravity: 80, spread: 3, angle: -1.57 }); }
    else { snap(); let len = 0; for (let i = 0; i + 1 < s.pts.length; i++) len += Math.hypot(s.pts[i + 1][0] - s.pts[i][0], s.pts[i + 1][1] - s.pts[i][1]); tool = s.t; auto.st = { ...s, s: 0, len, cur: null }; }
  };

  // ---- drawing -------------------------------------------------------------------------------------------------------------------------------
  const X = (V, x) => V.ox + x * V.s, Y = (V, y) => V.oy + y * V.s;
  const paintPath = (ctx, V, pts) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(X(V, p[0]), Y(V, p[1])) : ctx.moveTo(X(V, p[0]), Y(V, p[1])))); ctx.closePath(); };
  const drawPaint = (ctx, V, list, alpha = 1) => {
    ctx.save(); ctx.globalAlpha = alpha; ctx.lineJoin = 'round';
    for (const d of list) {
      const col = PAL[d.c]?.color ?? '#888'; paintPath(ctx, V, d.pts); ctx.fillStyle = col; ctx.fill();
      ctx.strokeStyle = rgba(tint(col, -0.38), 0.7); ctx.lineWidth = Math.max(0.8, V.s * 0.0022); ctx.stroke();
    }
    ctx.restore();
  };
  const drawSurface = (ctx, V, t) => {
    const x = X(V, 0), y = Y(V, 0), w = V.s, h = V.s * AR, tc = SC.trayC ?? '#b8742a';
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = V.s * 0.05; ctx.shadowOffsetY = V.s * 0.025; rrect(ctx, x - V.s * 0.03, y - V.s * 0.03, w + V.s * 0.06, h + V.s * 0.06, V.s * 0.03); ctx.fillStyle = '#2a1a0e'; ctx.fill(); ctx.restore();
    const rg = ctx.createLinearGradient(x, y, x + w, y + h); rg.addColorStop(0, tint(tc, 0.35)); rg.addColorStop(0.5, tc); rg.addColorStop(1, tint(tc, -0.45));
    rrect(ctx, x - V.s * 0.03, y - V.s * 0.03, w + V.s * 0.06, h + V.s * 0.06, V.s * 0.03); ctx.fillStyle = rg; ctx.fill();
    ctx.strokeStyle = 'rgba(40,20,4,0.5)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); rrect(ctx, x, y, w, h, V.s * 0.015); ctx.clip();
    const sg = ctx.createLinearGradient(x, y, x + w * 0.3, y + h); sg.addColorStop(0, SC.sizeC ?? '#dfe9ec'); sg.addColorStop(1, tint(SC.sizeC ?? '#dfe9ec', -0.14)); ctx.fillStyle = sg; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1.2; for (let k = 0; k < 9; k++) { const yy = y + (h * (k + 0.5)) / 9 + Math.sin(t * 0.8 + k) * 3; ctx.beginPath(); ctx.moveTo(x, yy); ctx.bezierCurveTo(x + w * 0.3, yy - 5, x + w * 0.6, yy + 5, x + w, yy); ctx.stroke(); }
    ctx.restore();
    return { x, y, w, h };
  };
  const drawGhost = (ctx, V, st, t) => {
    if (!st) return;
    ctx.save(); ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -t * 20; ctx.lineCap = 'round';
    if (st.t === 'drop') { ctx.strokeStyle = PAL[st.c]?.color ?? '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(X(V, st.x), Y(V, st.y), st.r * V.s, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = rgba('#ffffff', 0.35 + 0.25 * Math.sin(t * 5)); ctx.beginPath(); ctx.arc(X(V, st.x), Y(V, st.y), 4, 0, TAU); ctx.fill(); }
    else {
      ctx.strokeStyle = '#ffffff'; ctx.shadowColor = '#000'; ctx.shadowBlur = 5;
      const tn = st.t === 'comb' ? st.tines : 1, gp = st.t === 'comb' ? st.gap : 0, a0 = st.pts[0], b0 = st.pts[st.pts.length - 1], dx = b0[0] - a0[0], dy = b0[1] - a0[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      for (let j = 0; j < tn; j++) { const off = (j - (tn - 1) / 2) * gp; ctx.beginPath(); st.pts.forEach((p, i) => (i ? ctx.lineTo(X(V, p[0] + nx * off), Y(V, p[1] + ny * off)) : ctx.moveTo(X(V, p[0] + nx * off), Y(V, p[1] + ny * off)))); ctx.stroke(); }
      ctx.setLineDash([]); const ex = X(V, b0[0]), ey = Y(V, b0[1]), ang = Math.atan2(dy, dx); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - Math.cos(ang - 0.45) * 14, ey - Math.sin(ang - 0.45) * 14); ctx.lineTo(ex - Math.cos(ang + 0.45) * 14, ey - Math.sin(ang + 0.45) * 14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = rgba('#ffffff', 0.4 + 0.3 * Math.sin(t * 5)); ctx.beginPath(); ctx.arc(X(V, a0[0]), Y(V, a0[1]), 5, 0, TAU); ctx.fill();
    }
    ctx.restore();
  };
  const drawSheet = (ctx, V, list, k) => {   // a sheet of paper laid on the tray and lifted away with the print
    const w = V.s * 1.0, h = V.s * AR, x = V.ox, y0 = V.oy;
    const lift = k < 0.5 ? 0 : (k - 0.5) / 0.5, y = y0 - lift * h * 0.12, lay = k < 0.5 ? k / 0.5 : 1;
    ctx.save(); ctx.translate(0, y - y0);
    ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = V.s * 0.04; ctx.shadowOffsetY = V.s * (0.01 + 0.03 * lift);
    ctx.beginPath(); for (let q = 0; q <= 40; q++) { const f = q / 40; ctx.lineTo(x + w * f, y0 - (hash(q, 3) - 0.5) * 3); } for (let q = 0; q <= 50; q++) { const f = q / 50; ctx.lineTo(x + w + (hash(q, 5) - 0.5) * 3, y0 + h * f); } for (let q = 40; q >= 0; q--) { const f = q / 40; ctx.lineTo(x + w * f, y0 + h + (hash(q, 7) - 0.5) * 3); } for (let q = 50; q >= 0; q--) { const f = q / 50; ctx.lineTo(x + (hash(q, 9) - 0.5) * 3, y0 + h * f); } ctx.closePath();
    ctx.fillStyle = '#f6efe0'; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.clip();
    ctx.globalAlpha = Math.min(1, 0.35 + 0.65 * lay);
    drawPaint(ctx, V, list, 0.94);
    ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let q = 0; q < 160; q++) ctx.fillRect(x + w * hash(q, 11), y0 + h * hash(q, 12), 2, 2);
    ctx.fillStyle = 'rgba(120,90,50,0.08)'; for (let q = 0; q < 120; q++) ctx.fillRect(x + w * hash(q, 13), y0 + h * hash(q, 14), 2, 1);
    ctx.restore();
  };
  const draw = (g, Rt, tt) => {
    const { ctx, pal: PL } = g, W0 = Rt.work, lift = SC.wall ? wallLift(W0) * 0.35 : 0;
    const Wk = { x: W0.x, y: W0.y + 52 + lift, w: W0.w, h: W0.h - 52 - lift - 4 };
    const s = Math.min(Wk.w - 40, (Wk.h - 4) / AR), V = { ox: Wk.x + (Wk.w - s) / 2, oy: Wk.y + 2, s };
    geo = { ox: V.ox, oy: V.oy, s: V.s };
    if (phase === 'print') drawSheet(ctx, V, drops, clamp((now - printAt) / 1.4, 0, 1));
    else if (done) drawSheet(ctx, V, drops, 1);
    else {
      drawSurface(ctx, V, tt);
      ctx.save(); rrect(ctx, V.ox, V.oy, V.s, V.s * AR, V.s * 0.015); ctx.clip(); drawPaint(ctx, V, drops); ctx.restore();
      if (step < script.length) drawGhost(ctx, V, script[step], tt);
    }
    const hintTxt = done ? '' : phase === 'print' ? 'Laying the paper...' : step >= script.length ? 'The pattern is complete: press Lay paper.' : script[step].t === 'drop' ? `Drop ${PAL[script[step].c]?.name ?? 'paint'} where the ring shows.` : script[step].t === 'comb' ? 'Draw the comb along the lit lines.' : 'Draw the needle along the lit line.';
    if (hintTxt) { ctx.font = `600 ${Math.round(g.px(20))}px system-ui, sans-serif`; const tw = Math.min(W0.w - 16, ctx.measureText(hintTxt).width + 28), ph = g.px(20) + 14; rrect(ctx, W0.x + (W0.w - tw) / 2, W0.y + 18 - ph / 2, tw, ph, ph / 2); ctx.fillStyle = 'rgba(12,10,8,0.62)'; ctx.fill(); g.label(ctx, hintTxt, W0.x + W0.w / 2, W0.y + 18, g.px(20), '#f4efe6', 'center', '600'); }
    const hp = auto?.st && hand ? [X(V, hand[0]), Y(V, hand[1])] : ptr && (gesture || tool !== 'drop') && phase === 'make' && !done && ptr ? [ptr.x, ptr.y] : null;
    if (hp && !done && phase === 'make') drawTool(ctx, SC, tool === 'comb' ? 'pins' : 'brush', hp[0], hp[1], Math.max(100, V.s * 0.3), tt);
    const th = Rt.thumb, tw2 = Math.min(th.w - 12, (th.h - 12) / AR), V2 = { ox: th.x + (th.w - tw2) / 2, oy: th.y + (th.h - tw2 * AR) / 2, s: tw2 };
    ctx.save(); rrect(ctx, V2.ox, V2.oy, V2.s, V2.s * AR, 4); ctx.fillStyle = '#f6efe0'; ctx.fill(); ctx.clip(); drawPaint(ctx, V2, target); ctx.restore();
  };
  const titleArt = (g, S, t) => {
    const { ctx } = g, s = Math.min(S.w * 0.86, (S.h * 0.94) / AR), V = { ox: S.x + (S.w - s) / 2, oy: S.y + (S.h - s * AR) / 2, s };
    const ph = Math.sin((t ?? 0) * 0.6) * 0.006, list = target.map((d) => ({ c: d.c, pts: d.pts }));
    ctx.save(); ctx.translate(0, ph * s); drawSheet(ctx, V, list, 1); ctx.restore();
  };

  const items = () => {
    const out = PAL.map((c, i) => ({ id: `color:${i}`, kind: 'swatch', color: c.color, on: tool === 'drop' && color === i, name: c.name }));
    out.push({ id: 'tool:stylus', kind: 'btn', label: 'Needle', primary: tool === 'stylus' }, { id: 'tool:comb', kind: 'btn', label: 'Comb', primary: tool === 'comb' }, { id: 'size', kind: 'btn', label: `Drop ${size}` });
    out.push({ id: 'undo', kind: 'btn', label: 'Undo', off: !undo.length }, { id: 'check', kind: 'btn', label: 'Lay paper', primary: true });
    return out;
  };
  const state = () => ({ technique: 'marble', phase, step, steps: script.length, drops: drops.length, match: total(), tool, color, size, pattern: pid });
  init();
  return {
    init, items, control, work, tick, draw, attract, titleArt, result: () => done, score: total,
    hint: () => (step < script.length ? (script[step].t === 'drop' ? `Drop ${PAL[script[step].c]?.name ?? 'paint'} where the ring shows.` : 'Draw along the lit line.') : 'The pattern is complete: press Lay paper.'),
    info: () => [`Step ${Math.min(step + 1, script.length)} of ${script.length}`, `Pattern: ${total()}%`],
    get caption() { return SC.words?.caption ?? 'Marble this pattern'; },
    rules: () => [
      'Tap the tray to float a drop of paint on it. A new drop pushes every earlier drop outward, so the order matters.',
      'Draw the needle or the comb through the paint to drag the colours into waves, petals and combed lines.',
      'Press Lay paper to print: the score is how much of the pattern in the frame your tray matches. Doing nothing scores 0.',
    ],
    point(id) {
      if (!geo) return null;
      if (id === 'ghost') { const st = script[step]; if (!st) return null; const a = st.t === 'drop' ? [st.x, st.y] : st.pts[0]; return { x: geo.ox + a[0] * geo.s, y: geo.oy + a[1] * geo.s }; }
      if (id === 'ghost-end') { const st = script[step]; if (!st || st.t === 'drop') return null; const b = st.pts[st.pts.length - 1]; return { x: geo.ox + b[0] * geo.s, y: geo.oy + b[1] * geo.s }; }
      return null;
    },
    state,
  };
}

registerTechnique('marble', { make: (P, env) => createMarble(P, env), scene: 'ebruatelier', mat: 'wire' });
void mix; void shadowed; void shelf;

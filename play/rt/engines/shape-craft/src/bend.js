// bend: bend a wire into a silhouette. Drag the points of each wire (and place the wheels) to match the outline.
// Score = a partial Hausdorff distance between the player's wire and the target outline, in figure heights.
import { clamp, shade, starsFor } from './geom.js';

export const BEND_DEFAULTS = { figure: 'car', tolerance: 0.06, wireColor: '#d9b45a', wheelColor: '#6b7480', guide: true, variation: 1 };

// Coordinates are fractions of the figure box (x across, y down); ar = box width / height.
// pts = target corners of one wire, from = the straight line the wire's points start on.
export const BEND_FIGURES = {
  car: {
    ar: 1.0, name: 'Wire car',
    paths: [
      { name: 'body', closed: true, pts: [[0.10, 0.86], [0.08, 0.74], [0.18, 0.72], [0.28, 0.62], [0.50, 0.58], [0.60, 0.72], [0.84, 0.75], [0.90, 0.86]], from: [[0.12, 0.30], [0.64, 0.30]] },
      { name: 'steering rod', closed: false, pts: [[0.76, 0.74], [0.80, 0.16], [0.64, 0.08]], from: [[0.05, 0.62], [0.05, 0.18]] },
    ],
    wheels: [{ x: 0.27, y: 0.88, r: 0.085 }, { x: 0.74, y: 0.88, r: 0.085 }], wheelFrom: [[0.30, 0.46], [0.46, 0.46]],
  },
  bicycle: {
    ar: 1.3, name: 'Wire bicycle',
    paths: [
      { name: 'frame', closed: true, pts: [[0.22, 0.70], [0.46, 0.70], [0.70, 0.42], [0.42, 0.42]], from: [[0.14, 0.26], [0.50, 0.26]] },
      { name: 'fork and handlebar', closed: false, pts: [[0.78, 0.70], [0.72, 0.44], [0.66, 0.28], [0.84, 0.24]], from: [[0.93, 0.62], [0.93, 0.12]] },
      { name: 'seat', closed: false, pts: [[0.41, 0.40], [0.39, 0.28], [0.30, 0.27]], from: [[0.05, 0.10], [0.28, 0.10]] },
    ],
    wheels: [{ x: 0.22, y: 0.70, r: 0.17 }, { x: 0.78, y: 0.70, r: 0.17 }], wheelFrom: [[0.34, 0.50], [0.62, 0.50]],
  },
  bird: {
    ar: 1.3, name: 'Wire bird',
    paths: [
      { name: 'body', closed: true, pts: [[0.96, 0.34], [0.84, 0.22], [0.74, 0.28], [0.60, 0.30], [0.40, 0.34], [0.16, 0.22], [0.04, 0.30], [0.20, 0.42], [0.36, 0.58], [0.58, 0.66], [0.74, 0.54], [0.82, 0.42]], from: [[0.06, 0.08], [0.78, 0.08]] },
      { name: 'legs', closed: false, pts: [[0.46, 0.62], [0.50, 0.90], [0.66, 0.90], [0.64, 0.64]], from: [[0.04, 0.58], [0.04, 0.95]] },
    ],
    wheels: [], wheelFrom: [],
  },
};

const STEP = 0.02;
const pct = (arr, q) => { const s = arr.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * (s.length - 1)))]; };

// sample points (in metric units: x scaled by the aspect ratio) along wires and wheel circles
function sampleFigure(paths, wheels, ar) {
  const out = [];
  for (const p of paths) {
    const n = p.pts.length, segs = p.closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const a = p.pts[i], b = p.pts[(i + 1) % n];
      const len = Math.hypot((b[0] - a[0]) * ar, b[1] - a[1]), k = Math.max(1, Math.ceil(len / STEP));
      for (let s = 0; s < k; s++) out.push([(a[0] + ((b[0] - a[0]) * s) / k) * ar, a[1] + ((b[1] - a[1]) * s) / k]);
    }
    if (!p.closed) out.push([p.pts[n - 1][0] * ar, p.pts[n - 1][1]]);
  }
  for (const w of wheels) {
    const k = Math.max(12, Math.ceil((2 * Math.PI * w.r) / STEP));
    for (let s = 0; s < k; s++) { const t = (s / k) * Math.PI * 2; out.push([w.x * ar + Math.cos(t) * w.r, w.y + Math.sin(t) * w.r]); }
  }
  return out;
}
const directed = (A, B) => {
  const d = [];
  for (const a of A) { let m = 1e9; for (const b of B) { const e = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2; if (e < m) m = e; } d.push(Math.sqrt(m)); }
  return d;
};

export function createBend(P, env) {
  const { rng, audio } = env;
  const FIG = BEND_FIGURES[P.figure] ?? BEND_FIGURES.car;
  let target, cur, undo, done, geo = null, grab = null, moved = false, tSamples, cache = null, acc = 0, hit = 26;

  const lineFrom = (from, n) => Array.from({ length: n }, (_, i) => { const t = n === 1 ? 0 : i / (n - 1); return [from[0][0] + (from[1][0] - from[0][0]) * t, from[0][1] + (from[1][1] - from[0][1]) * t]; });
  const init = () => {
    const j = () => (rng.next() * 2 - 1) * 0.015 * P.variation;
    target = { paths: FIG.paths.map((p) => ({ closed: p.closed, pts: p.pts.map(([x, y]) => [clamp(x + j(), 0.02, 0.98), clamp(y + j(), 0.02, 0.98)]) })), wheels: FIG.wheels.map((w) => ({ x: w.x + j(), y: w.y + j(), r: w.r })) };
    cur = { paths: FIG.paths.map((p) => ({ closed: p.closed, pts: lineFrom(p.from, p.pts.length) })), wheels: FIG.wheels.map((w, i) => ({ x: FIG.wheelFrom[i][0], y: FIG.wheelFrom[i][1], r: w.r })) };
    tSamples = sampleFigure(target.paths, target.wheels, FIG.ar);
    undo = []; done = null; grab = null; cache = null; acc = 0;
  };
  init();
  const snapshot = () => JSON.parse(JSON.stringify(cur));
  const distance = () => {
    if (!cache) { const s = sampleFigure(cur.paths, cur.wheels, FIG.ar); cache = Math.max(pct(directed(tSamples, s), 0.95), pct(directed(s, tSamples), 0.95)); }
    return cache;
  };
  const score = () => Math.round(100 * clamp(1 - Math.max(0, distance() - 0.25 * P.tolerance) / (2.75 * P.tolerance), 0, 1));
  const finish = () => {
    const s = score(), stars = starsFor(s);
    done = { score: s, max: 100, stars, headline: stars === 3 ? 'A true wire figure' : stars ? 'Recognisable' : 'Keep bending', detail: `Greatest gap from the outline: ${(distance() * 100).toFixed(1)} percent of the figure height` };
  };

  const items = () => [
    { id: 'undo', kind: 'btn', label: 'Undo', off: !undo.length },
    { id: 'reset', kind: 'btn', label: 'Reset' },
    { id: 'check', kind: 'btn', label: 'Check', primary: true },
  ];
  const control = (id) => {
    if (done) return;
    if (id === 'undo') { const u = undo.pop(); if (u) { cur = u; cache = null; } }
    else if (id === 'reset') { undo.push(snapshot()); init2(); }
    else if (id === 'check') finish();
  };
  const init2 = () => {
    cur = { paths: FIG.paths.map((p) => ({ closed: p.closed, pts: lineFrom(p.from, p.pts.length) })), wheels: FIG.wheels.map((w, i) => ({ x: FIG.wheelFrom[i][0], y: FIG.wheelFrom[i][1], r: w.r })) };
    cache = null;
  };

  const px = (u, v) => [geo.ox + u * geo.bw, geo.oy + v * geo.bh];
  const pick = (x, y) => {
    let best = null, bd = hit;
    cur.paths.forEach((p, pi) => p.pts.forEach((q, i) => { const [qx, qy] = px(q[0], q[1]), d = Math.hypot(qx - x, qy - y); if (d < bd) { bd = d; best = { kind: 'pt', pi, i }; } }));
    if (best) return best;
    cur.wheels.forEach((w, i) => {
      const [cx, cy] = px(w.x, w.y), d = Math.hypot(cx - x, cy - y), rp = w.r * geo.bh;
      if (d <= hit * 0.8 || Math.abs(d - rp) <= hit * 0.7) { const s = Math.min(d, Math.abs(d - rp)); if (s < bd || !best) { bd = s; best = { kind: 'wheel', i }; } }
    });
    return best;
  };
  const objPos = (o) => (o.kind === 'pt' ? cur.paths[o.pi].pts[o.i] : [cur.wheels[o.i].x, cur.wheels[o.i].y]);
  const setPos = (o, u, v) => {
    u = clamp(u, -0.04, 1.04); v = clamp(v, -0.04, 1.04);
    if (o.kind === 'pt') { cur.paths[o.pi].pts[o.i] = [u, v]; } else { cur.wheels[o.i].x = u; cur.wheels[o.i].y = v; }
    cache = null;
  };
  const work = (p) => {
    if (!geo || done) return;
    if (p.pressed) {
      const o = pick(p.x, p.y);
      if (o) {
        const [u, v] = objPos(o), [ox, oy] = px(u, v);
        grab = { o, dx: ox - p.x, dy: oy - p.y, snap: snapshot() }; moved = false;
      }
      if (p.released && !p.down) grab = null;
      return;
    }
    if (grab && p.down) {
      const nu = (p.x + grab.dx - geo.ox) / geo.bw, nv = (p.y + grab.dy - geo.oy) / geo.bh, [u, v] = objPos(grab.o);
      if (Math.abs(nu - u) > 1e-4 || Math.abs(nv - v) > 1e-4) {
        if (!moved) { undo.push(grab.snap); moved = true; }
        setPos(grab.o, nu, nv);
        audio?.tone({ freq: 200 + ((nu * 4 + nv * 3) % 1) * 160, dur: 0.02, type: 'triangle', vol: 0.05 });
      }
    }
    if (!p.down) grab = null;
  };

  const wheelAt = (ctx, cx, cy, rp, color, w) => {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(cx, cy, rp, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = Math.max(3, rp * 0.2); ctx.beginPath(); ctx.arc(cx, cy, rp, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = shade(color, 0.35); ctx.lineWidth = Math.max(1, rp * 0.06);
    for (let k = 0; k < 6; k++) { const t = (k * Math.PI) / 3 + w; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(t) * rp * 0.9, cy + Math.sin(t) * rp * 0.9); ctx.stroke(); }
    ctx.fillStyle = shade(color, 0.5); ctx.beginPath(); ctx.arc(cx, cy, Math.max(2, rp * 0.14), 0, Math.PI * 2); ctx.fill();
  };
  const tone = (i) => shade(P.wireColor, [0, -0.32, 0.28][i % 3]);
  const paintFigure = (ctx, fig, X, Y, bw, bh, lw, handles, guide) => {
    const to = (q) => [X + q[0] * bw, Y + q[1] * bh];
    fig.paths.forEach((p, i) => {
      ctx.beginPath();
      p.pts.forEach((q, k) => { const [x, y] = to(q); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      if (p.closed) ctx.closePath();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (guide) { ctx.setLineDash([lw * 2.2, lw * 2.2]); ctx.strokeStyle = 'rgba(245,200,90,0.75)'; ctx.lineWidth = lw * 0.8; }
      else { ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = lw * 1.9; ctx.stroke(); ctx.strokeStyle = tone(i); ctx.lineWidth = lw; }
      ctx.stroke(); ctx.setLineDash([]);
    });
    fig.wheels.forEach((w) => {
      const [cx, cy] = to([w.x, w.y]), rp = w.r * bh;
      if (guide) { ctx.setLineDash([lw * 2.2, lw * 2.2]); ctx.strokeStyle = 'rgba(245,200,90,0.75)'; ctx.lineWidth = lw * 0.8; ctx.beginPath(); ctx.arc(cx, cy, rp, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
      else wheelAt(ctx, cx, cy, rp, P.wheelColor, 0.3);
    });
    if (handles) {
      const hr = Math.max(7, bh * 0.02);
      fig.paths.forEach((p, i) => p.pts.forEach((q) => {
        const [x, y] = to(q);
        ctx.fillStyle = '#f6f1e6'; ctx.strokeStyle = tone(i); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, hr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }));
    }
  };

  const draw = (g, Rt) => {
    const { ctx, pal } = g;
    const W0 = Rt.work, Wk = { x: W0.x, y: W0.y + 26, w: W0.w, h: W0.h - 26 };
    hit = Math.max(22, (g.px(0) * 44) / 12 * 0.5);
    const bh = Math.min(Wk.h - 8, (Wk.w - 8) / FIG.ar), bw = bh * FIG.ar, ox = Wk.x + (Wk.w - bw) / 2, oy = Wk.y + (Wk.h - bh) / 2;
    geo = { ox, oy, bw, bh };
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; g.rr(ctx, ox - 6, oy - 6, bw + 12, bh + 12, 12); ctx.fill();
    const lw = Math.max(3, bh * 0.012);
    if (P.guide) paintFigure(ctx, target, ox, oy, bw, bh, lw, false, true);
    // wheels first (behind the wire), then the wire with handles
    cur.wheels.forEach((w) => wheelAt(ctx, ox + w.x * bw, oy + w.y * bh, w.r * bh, P.wheelColor, 0.3));
    paintFigure(ctx, { paths: cur.paths, wheels: [] }, ox, oy, bw, bh, lw * 1.3, true, false);
    // thumbnail: the finished figure
    const th = Rt.thumb, tb = Math.min(th.h - 6, (th.w - 6) / FIG.ar), tw = tb * FIG.ar;
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(th.x, th.y, th.w, th.h);
    paintFigure(ctx, target, th.x + (th.w - tw) / 2, th.y + (th.h - tb) / 2, tw, tb, Math.max(2, tb * 0.014), false, false);
    g.label(ctx, 'Drag the white points; drag a wheel by its rim', W0.x + W0.w / 2, W0.y + 12, g.px(17), pal.dim, 'center', '500');
  };

  const attract = (dt) => {
    if (done) return;
    const k = 1 - Math.exp(-dt * 5);
    let err = 0;
    const toward = (a, b) => { const d = Math.hypot(a[0] - b[0], a[1] - b[1]); err = Math.max(err, d); };
    cur.paths.forEach((p, pi) => p.pts.forEach((q, i) => { const t = target.paths[pi].pts[i]; toward(q, t); p.pts[i] = [q[0] + (t[0] - q[0]) * k, q[1] + (t[1] - q[1]) * k]; }));
    cur.wheels.forEach((w, i) => { const t = target.wheels[i]; toward([w.x, w.y], [t.x, t.y]); w.x += (t.x - w.x) * k; w.y += (t.y - w.y) * k; });
    cache = null;
    acc += dt;
    if (err < 0.004 || acc > 6) {
      cur.paths.forEach((p, pi) => p.pts.forEach((q, i) => { p.pts[i] = target.paths[pi].pts[i].slice(); }));
      cur.wheels.forEach((w, i) => { w.x = target.wheels[i].x; w.y = target.wheels[i].y; });
      cache = null; finish();
    }
  };

  const nPts = FIG.paths.reduce((s, p) => s + p.pts.length, 0);
  return {
    init, items, control, work, draw, attract, result: () => done,
    score,
    info: () => [`Wire points: ${nPts}${FIG.wheels.length ? `, wheels: ${FIG.wheels.length}` : ''}`, `Gap: ${(distance() * 100).toFixed(1)} percent`],
    caption: `Bend this ${FIG.name.toLowerCase().replace('wire ', '')}`,
    hint() {
      let best = null, bd = 0;
      cur.paths.forEach((p, pi) => p.pts.forEach((q, i) => { const t = target.paths[pi].pts[i], d = Math.hypot((q[0] - t[0]) * FIG.ar, q[1] - t[1]); if (d > bd) { bd = d; best = { pi, i, q, t }; } }));
      cur.wheels.forEach((w, i) => { const t = target.wheels[i], d = Math.hypot((w.x - t.x) * FIG.ar, w.y - t.y); if (d > bd) { bd = d; best = { wheel: i, q: [w.x, w.y], t: [t.x, t.y] }; } });
      if (!best || bd < P.tolerance * 0.5) return 'The figure matches: press Check.';
      const dir = `${best.t[0] < best.q[0] - 0.02 ? 'left' : best.t[0] > best.q[0] + 0.02 ? 'right' : ''} ${best.t[1] < best.q[1] - 0.02 ? 'up' : best.t[1] > best.q[1] + 0.02 ? 'down' : ''}`.trim();
      return best.wheel !== undefined ? `Move wheel ${best.wheel + 1} ${dir}.` : `Move point ${best.i + 1} of the ${FIG.paths[best.pi].name} ${dir}.`;
    },
    rules: () => [
      'Each wire is a chain of points: drag a point to bend the wire there. Wheels are loose rings: drag one by its rim into place.',
      'Score: how far the worst part of your wire lies from the outline, and the worst part of the outline from your wire (a partial Hausdorff distance), measured beyond the straight wire you began with.',
      'Undo takes back the last drag.',
    ],
    point(id) {
      if (!geo) return null;
      const [kind, rest] = id.split(':');
      if (kind === 'handle' || kind === 'target') {
        const [pi, i] = rest.split(',').map(Number), q = (kind === 'handle' ? cur : target).paths[pi].pts[i];
        return { x: geo.ox + q[0] * geo.bw, y: geo.oy + q[1] * geo.bh };
      }
      if (kind === 'wheel' || kind === 'targetwheel') {
        const w = (kind === 'wheel' ? cur : target).wheels[Number(rest)];
        return { x: geo.ox + w.x * geo.bw, y: geo.oy + (w.y + w.r) * geo.bh };
      }
      return null;
    },
    state: () => ({ technique: 'bend', figure: P.figure, paths: cur.paths.map((p) => p.pts.length), wheels: cur.wheels.length, gap: Math.round(distance() * 1000) / 1000, pts: cur.paths.map((p) => p.pts), wpos: cur.wheels.map((w) => [w.x, w.y]) }),
  };
}

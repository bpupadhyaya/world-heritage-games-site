// Lane module: input (drag to aim, or meters), guide, rendering, attract AI. Physics lives in lane.js.
import { createPhysics, railed, DT } from './lane.js';

const hyp = Math.hypot;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const MAXPULL = 150, DEAD = 14;

export function createLane(P, env, host) {
  const ph = createPhysics(P);
  const { hw, len } = ph;
  const L = P.lane, T = P.target, PR = P.projectile, LK = P.look;
  const rng = env.rng;
  let w = null, layout = null, aim = null, floats = [], flying = null, ai = null, planCache = null, shake = 0;
  const meter = { stage: 0, t: 0, angle: 0, power: 0 };
  const tone = (o) => env.audio?.tone?.(o);

  const reset = () => { w = ph.newWorld(rng); flying = null; aim = null; ai = null; planCache = null; floats = []; meter.stage = 0; meter.t = 0; };

  // ---- view transform: portrait = lane runs up the screen; landscape = lane runs left to right -----------------
  const makeLayout = (area) => {
    const minY = -Math.max(1.2, len * 0.1), maxY = len + 0.5, spanY = maxY - minY, spanX = L.width + 0.7;
    const bar = 40;
    const sp = Math.min(area.w / spanX, (area.h - bar) / spanY), sl = Math.min(area.w / spanY, (area.h - bar) / spanX);
    const land = sl > sp * 1.05 && area.w > area.h;
    const s = land ? sl : sp;
    const ox = area.x + area.w / 2, oy = area.y + (area.h - bar) / 2;
    const tr = land
      ? (x, y) => ({ x: ox + (y - (minY + maxY) / 2) * s, y: oy + x * s })
      : (x, y) => ({ x: ox + x * s, y: oy - (y - (minY + maxY) / 2) * s });
    const inv = land ? (sx, sy) => ({ x: (sy - oy) / s, y: (sx - ox) / s + (minY + maxY) / 2 }) : (sx, sy) => ({ x: (sx - ox) / s, y: -(sy - oy) / s + (minY + maxY) / 2 });
    const d2w = land ? (dx, dy) => ({ x: dy, y: dx }) : (dx, dy) => ({ x: dx, y: -dy });
    const w2d = land ? (x, y) => ({ x: y, y: x }) : (x, y) => ({ x, y: -y });
    return { area, s, land, tr, inv, d2w, w2d, bar };
  };

  // ---- planning (also the attract-mode player): simulate candidate throws on cloned worlds ---------------------
  const evalThrow = (base, sx, ang, power, offset) => {
    const c = ph.clone(base);
    c.clock += offset;
    const dx = Math.sin(ang), dy = Math.cos(ang);
    const before = ph.restTotal(c);
    ph.launch(c, sx, dx, dy, power);
    ph.settle(c);
    let g = ph.throwGain(c, c.throwNo);
    if (P.rounds.scoreAt === 'end') g += ph.restTotal(c) - before;
    // tie-break: prefer resting close to the nearest scoring centre
    return g;
  };
  const closeness = (base, sx, ang, power, offset) => {
    const c = ph.clone(base); c.clock += offset;
    ph.launch(c, sx, Math.sin(ang), Math.cos(ang), power); ph.settle(c);
    const b = c.bodies.find((q) => q.kind === 'proj');
    if (!b || b.st === 'out' || b.st === 'sunk') return -99;
    let best = 99;
    const goals = [...(T.rings ?? []).map((r) => (r.around === 'jack' ? c.bodies.find((q) => q.kind === 'jack') : railed(r, c.clock))), ...(T.pots ?? []).map((p) => railed(p, c.clock)), ...(T.pins ?? []).map((p) => p)];
    for (const g of goals) if (g) best = Math.min(best, hyp(b.x - g.x, b.y - g.y));
    for (const bd of T.bands ?? []) best = Math.min(best, Math.abs(b.y - (bd.y0 + bd.y1) / 2) * 0.5);
    return -best;
  };
  const computePlan = (offset) => {
    const sx = L.start.x;
    const A = P.attract.angle, na = 15, np = 14;
    const cands = [];
    for (let i = 0; i < na; i++) for (let j = 0; j < np; j++) cands.push({ ang: -A + (2 * A * i) / (na - 1), power: 0.12 + (0.88 * j) / (np - 1) });
    if (P.mode === 'lob' && !P.skip) {
      // aim straight at each scoring centre, allowing for this round's wind
      const goals = [...(T.pots ?? []), ...(T.rings ?? []).filter((r) => r.around !== 'jack'), ...(T.pins ?? [])];
      for (const gl of goals) {
        const c = railed(gl, w.clock + offset);
        let gx = c.x, gy = c.y;
        for (let it = 0; it < 2; it++) {
          const d0 = Math.hypot(gx - sx, gy - L.start.y), Tm = 0.45 + 0.2 * Math.sqrt(d0);
          const ax = c.x - 0.5 * w.wind.x * Tm * Tm, ay = c.y - 0.5 * w.wind.y * Tm * Tm;
          const d = Math.hypot(ax - sx, ay - L.start.y);
          cands.push({ ang: Math.atan2(ax - sx, ay - L.start.y), power: clamp((d - P.range.min) / (P.range.max - P.range.min), 0, 1) });
          gx = ax; gy = ay;
        }
      }
    }
    const score = (c) => { const g = evalThrow(w, sx, c.ang, c.power, offset); return g * 10 + closeness(w, sx, c.ang, c.power, offset) * 0.1 + (g > 0 ? 0 : 0); };
    for (const c of cands) c.g = score(c);
    cands.sort((a, b) => b.g - a.g);
    let best = cands[0];
    const stepA = (2 * A) / (na - 1), stepP = 0.88 / (np - 1);
    for (const top of cands.slice(0, 3)) {
      for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
        const c = { ang: top.ang + (i * stepA) / 6, power: clamp(top.power + (j * stepP) / 6, 0, 1) };
        c.g = score(c);
        if (c.g > best.g) best = c;
      }
    }
    return { startX: sx, ang: best.ang, power: best.power, gain: Math.floor(best.g / 10) };
  };

  // ---- throwing -------------------------------------------------------------------------------------------
  const fire = (sx, dir, power) => {
    if (!host.canThrow()) return;
    const b = ph.launch(w, clamp(sx, -hw + PR.r, hw - PR.r), dir.x, dir.y, power);
    flying = b.thr;
    host.thrown();
    planCache = null;
    tone({ freq: 220 + power * 200, to: 160, dur: 0.14, type: 'triangle', vol: 0.5 });
  };

  const sfx = (ev) => {
    for (const e of ev.slice(0, 4)) {
      if (e === 'in') tone({ freq: 660, to: 990, dur: 0.18, type: 'triangle' });
      else if (e === 'splash') tone({ freq: 300, to: 100, dur: 0.12, type: 'sawtooth', vol: 0.3 });
      else if (e === 'skip') tone({ freq: 520, to: 700, dur: 0.05, type: 'triangle', vol: 0.4 });
      else if (e === 'pin') tone({ freq: 180, to: 120, dur: 0.1, type: 'square', vol: 0.3 });
      else if (e === 'hit') tone({ freq: 260, dur: 0.04, type: 'square', vol: 0.25 });
    }
  };

  const bank = () => {
    const thr = flying;
    let g = ph.throwGain(w, thr);
    const spots = [];
    for (const b of w.bodies) if (b.kind === 'proj' && b.thr === thr) spots.push(b);
    const b0 = spots[0];
    if (b0 && g > 0) floats.push({ x: b0.x, y: b0.y, text: `+${g}`, t: 0 });
    for (const b of w.bodies) if (b.kind === 'proj' && (b.st === 'in' || b.st === 'sunk' || b.st === 'out')) b.scored = true;
    if (P.rounds.scoreAt === 'throw') {
      w.bodies = w.bodies.filter((b) => b.kind !== 'proj');
      if (P.rounds.resetPins === 'throw') for (const b of w.bodies) if (b.kind === 'pin') { b.st = 'stand'; b.x = b.x0; b.y = b.y0; b.vx = 0; b.vy = 0; b.fall = -1; }
    } else w.bodies = w.bodies.filter((b) => b.kind !== 'proj' || (b.st === 'ground'));
    flying = null;
    const allDown = (T.pins ?? []).length && P.rounds.resetPins === 'never' && w.bodies.filter((b) => b.kind === 'pin').every((b) => b.st === 'fallen');
    host.settle(g, { over: !!allDown });
  };

  // ---- update ---------------------------------------------------------------------------------------------
  // tick: time, floats, the flight and resolution of a throw, meters. Returns true when a new throw may be started.
  const tick = (dt) => {
    for (const f of floats) f.t += dt;
    floats = floats.filter((f) => f.t < 1.4);
    if (!w) return false;
    if (flying !== null) {
      const ev = ph.step(w, []);
      sfx(ev);
      if (ph.settled(w)) bank();
      return false;
    }
    ph.step(w, []);   // keep the clock (moving targets) running while aiming
    if (!host.canThrow()) { aim = null; return false; }
    if (P.controls === 'meter') {
      meter.t += dt;
      const A = P.attract.angle;
      if (meter.stage === 0) meter.angle = A * Math.sin((meter.t * Math.PI * 2) / 2.4);
      else meter.power = 0.5 - 0.5 * Math.cos((meter.t * Math.PI * 2) / 1.6);
    }
    return true;
  };
  const tapMeter = () => {
    if (meter.stage === 0) { meter.stage = 1; meter.t = 0; tone({ freq: 500, dur: 0.05 }); }
    else { fire(L.start.x, { x: Math.sin(meter.angle), y: Math.cos(meter.angle) }, meter.power); meter.stage = 0; meter.t = 0; }
  };

  const update = (dt, input) => {
    if (!tick(dt) || !layout) return;
    const p = input.pointer, a = layout.area;
    const inside = p.x >= a.x && p.x <= a.x + a.w && p.y >= a.y && p.y <= a.y + a.h;
    if (P.controls === 'meter') { if (p.pressed && inside) tapMeter(); return; }
    if (p.pressed && inside) {
      const wp = layout.inv(p.x, p.y);
      aim = { ax: p.x, ay: p.y, cx: p.x, cy: p.y, sx: L.startX === 'free' ? clamp(wp.x, -hw + PR.r, hw - PR.r) : L.start.x };
    }
    if (aim && (p.down || p.released)) { aim.cx = p.x; aim.cy = p.y; }
    if (aim && p.released) {
      const d = layout.d2w(aim.ax - aim.cx, aim.ay - aim.cy);
      const pull = hyp(aim.ax - aim.cx, aim.ay - aim.cy);
      if (pull > DEAD && d.y > 0.2 * hyp(d.x, d.y)) fire(aim.sx, d, clamp((pull - DEAD) / (MAXPULL - DEAD), 0, 1));
      aim = null;
    }
  };

  // ---- attract: the computer plays; it works without a rendered layout (store screenshots run unrendered) ----------
  const attract = (dt) => {
    if (!tick(dt)) { if (flying !== null) ai = null; return; }
    if (!ai) ai = { t: 0, plan: computePlan(P.controls === 'meter' ? 0.2 : 1.0) };
    ai.t += dt;
    const pl = ai.plan;
    if (P.controls === 'meter') {
      if (meter.stage === 0 && Math.abs(meter.angle - pl.ang) < 0.012 && meter.t > 0.2) tapMeter();
      else if (meter.stage === 1 && Math.abs(meter.power - pl.power) < 0.018 && meter.t > 0.2) { tapMeter(); ai = null; }
      return;
    }
    aim = { ai: true, sx: pl.startX, power: pl.power * clamp((ai.t - 0.15) / 0.75, 0, 1), dir: { x: Math.sin(pl.ang), y: Math.cos(pl.ang) } };
    if (ai.t >= 1.0) { const q = pl; aim = null; ai = null; fire(q.startX, { x: Math.sin(q.ang), y: Math.cos(q.ang) }, q.power); }
  };

  const pathFor = (plan) => {
    const a = layout.tr(plan.startX, L.start.y);
    const dw = { x: Math.sin(plan.ang), y: Math.cos(plan.ang) };
    const ds = layout.w2d(dw.x, dw.y);
    const pull = DEAD + plan.power * (MAXPULL - DEAD);
    return { ax: a.x, ay: a.y, cx: a.x - ds.x * pull, cy: a.y - ds.y * pull };
  };

  // ---- drawing --------------------------------------------------------------------------------------------
  const ringColors = (i) => LK.ringColors[i % LK.ringColors.length];
  const drawBody = (g, b, S) => {
    const { ctx } = g;
    const c = layout.tr(b.x, b.y), r = Math.max(3, b.r * layout.s);
    if (b.st === 'out' || b.st === 'sunk') return;
    const lift = (b.z ?? 0) * layout.s * 0.8;
    if (b.st === 'fly') { ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(c.x, c.y, r, r * 0.7, 0, 0, 6.3); ctx.fill(); }
    const cx = c.x, cy = c.y - lift, rs = r * (1 + (b.z ?? 0) * 0.25);
    if (b.kind === 'pin') {
      ctx.save(); ctx.globalAlpha = b.st === 'fallen' ? 0.6 : 1;
      ctx.fillStyle = b.st === 'fallen' ? LK.pinDown : LK.pin; ctx.strokeStyle = LK.pinEdge; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, rs, 0, 6.3); ctx.fill(); ctx.stroke();
      if (b.v !== undefined && rs > 7) g.label(ctx, b.v, cx, cy, Math.min(rs * 1.2, 22), LK.pinText, 'center', '700');
      ctx.restore();
    } else if (b.kind === 'jack') {
      ctx.fillStyle = LK.jack; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, rs, 0, 6.3); ctx.fill(); ctx.stroke();
    } else {
      const look = PR.look;
      if (look === 'ring') { ctx.strokeStyle = PR.color; ctx.lineWidth = Math.max(3, rs * 0.4); ctx.beginPath(); ctx.arc(cx, cy, rs * 0.8, 0, 6.3); ctx.stroke(); }
      else if (look === 'stone') { ctx.fillStyle = PR.color; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(cx, cy, rs, rs * 0.72, 0.5, 0, 6.3); ctx.fill(); ctx.stroke(); }
      else if (look === 'baton') { ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = PR.color; ctx.fillRect(-rs * 1.6, -rs * 0.6, rs * 3.2, rs * 1.2); ctx.restore(); }
      else if (look === 'arrow') { ctx.strokeStyle = PR.color; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx - rs, cy + rs * 1.6); ctx.lineTo(cx + rs * 0.4, cy - rs * 1.6); ctx.stroke(); }
      else {
        ctx.fillStyle = PR.color; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, rs, 0, 6.3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(cx - rs * 0.3, cy - rs * 0.3, rs * 0.35, 0, 6.3); ctx.fill();
      }
    }
  };

  const render = (g, area) => {
    const { ctx } = g;
    layout = makeLayout(area);
    const { tr, s } = layout;
    if (!w) return;
    // surroundings and lane
    ctx.fillStyle = LK.surround; ctx.fillRect(area.x, area.y, area.w, area.h);
    const c0 = tr(-hw, -2), c1 = tr(hw, len);
    const x0 = Math.min(c0.x, c1.x), y0 = Math.min(c0.y, c1.y), ww = Math.abs(c1.x - c0.x), hh = Math.abs(c1.y - c0.y);
    ctx.fillStyle = LK.lane; ctx.fillRect(x0, y0, ww, hh);
    const rect = (xa, ya, xb, yb) => { const p = tr(xa, ya), q = tr(xb, yb); return { x: Math.min(p.x, q.x), y: Math.min(p.y, q.y), w: Math.abs(q.x - p.x), h: Math.abs(q.y - p.y) }; };
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
    for (let k = 1; k < len; k++) { const p0 = tr(-hw, k), p1 = tr(hw, k); ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke(); }
    for (const z of P.world.zones ?? []) { const r = rect(-hw, z.y0, hw, z.y1); ctx.fillStyle = z.mul > 1 ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.16)'; ctx.fillRect(r.x, r.y, r.w, r.h); }
    (T.bands ?? []).forEach((b, i) => {
      const r = rect(-hw, b.y0, hw, b.y1);
      ctx.fillStyle = ringColors(i); ctx.globalAlpha = 0.55; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.globalAlpha = 1;
      ctx.strokeStyle = LK.line; ctx.lineWidth = 2; ctx.strokeRect(r.x, r.y, r.w, r.h);
      g.label(ctx, b.points, r.x + r.w / 2, r.y + r.h / 2, Math.min(r.h * 0.6, r.w * 0.2, 30), LK.line, 'center', '700');
    });
    for (const h of P.world.hazards ?? []) { const c = tr(h.x, h.y); ctx.fillStyle = LK.hazard; ctx.beginPath(); ctx.ellipse(c.x, c.y, h.r * s, h.r * s * 0.8, 0.3, 0, 6.3); ctx.fill(); }
    (T.rings ?? []).forEach((ring) => {
      const cen = ring.around === 'jack' ? w.bodies.find((b) => b.kind === 'jack') : railed(ring, w.clock);
      if (!cen) return;
      const c = tr(cen.x, cen.y);
      [...ring.bands].reverse().forEach((band, i, arr) => {
        ctx.fillStyle = ringColors(arr.length - 1 - i); ctx.globalAlpha = ring.around === 'jack' ? 0.28 : 0.85;
        ctx.beginPath(); ctx.arc(c.x, c.y, band.r * s, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1;
        ctx.strokeStyle = LK.line; ctx.lineWidth = 1.5; ctx.stroke();
      });
      const first = ring.bands[0];
      if (first && first.r * s > 8 && ring.around !== 'jack') g.label(ctx, first.points, c.x, c.y, Math.min(first.r * s * 1.1, 24), LK.line, 'center', '800');
    });
    for (const p of T.pots ?? []) {
      const pos = railed(p, w.clock), c = tr(pos.x, pos.y);
      if (p.peg) { ctx.fillStyle = LK.potRim; ctx.beginPath(); ctx.arc(c.x, c.y, Math.max(4, p.r * s), 0, 6.3); ctx.fill(); }
      else {
        if (p.rim) { ctx.fillStyle = LK.potRim; ctx.beginPath(); ctx.arc(c.x, c.y, (p.r + p.rim) * s, 0, 6.3); ctx.fill(); }
        ctx.fillStyle = LK.pot; ctx.beginPath(); ctx.arc(c.x, c.y, p.r * s, 0, 6.3); ctx.fill();
      }
      if (p.points > 1 || p.label) g.label(ctx, p.label ?? p.points, c.x, c.y, Math.min(p.r * s * 1.2, 22), LK.potText, 'center', '800');
    }
    // foul line / thrower
    const fl0 = tr(-hw, 0), fl1 = tr(hw, 0);
    ctx.strokeStyle = LK.line; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fl0.x, fl0.y); ctx.lineTo(fl1.x, fl1.y); ctx.stroke();
    ctx.strokeStyle = LK.edge; ctx.lineWidth = 4; ctx.strokeRect(x0, y0, ww, hh);
    const sxNow = aim ? aim.sx : L.start.x, th = tr(sxNow, L.start.y);
    ctx.fillStyle = LK.thrower; ctx.beginPath(); ctx.arc(th.x, th.y, Math.max(14, PR.r * s * 1.6), 0, 6.3); ctx.fill();
    ctx.strokeStyle = LK.edge; ctx.lineWidth = 3; ctx.stroke();
    // bodies
    for (const b of w.bodies) if (b.st !== 'fly') drawBody(g, b);
    for (const b of w.bodies) if (b.st === 'fly') drawBody(g, b);
    // guide
    const guide = (dirw, power, sx) => {
      const a = tr(sx, L.start.y);
      const d = layout.w2d(dirw.x, dirw.y);
      const l = 30 + power * 70;
      ctx.strokeStyle = LK.guide; ctx.lineWidth = 4; ctx.setLineDash([2, 9]); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x + d.x * l * 3.2, a.y + d.y * l * 3.2); ctx.stroke(); ctx.setLineDash([]);
      if (P.guide === 'full') {
        const gw = { clock: w.clock, nid: 1, throwNo: 0, bodies: [], wind: w.wind, trail: [] };
        ph.launch(gw, sx, dirw.x, dirw.y, power);
        ph.settle(gw, 8);
        ctx.fillStyle = LK.guide;
        gw.trail.forEach((q, i) => { if (i % 5 === 0) { const c = tr(q.x, q.y); ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(c.x, c.y - (q.z ?? 0) * s * 0.8, 3, 0, 6.3); ctx.fill(); } });
        ctx.globalAlpha = 1;
      }
      ctx.lineCap = 'butt';
      return { a, d };
    };
    if (aim && host.canThrow()) {
      if (aim.ai) { if (aim.power > 0.02) guide(aim.dir, aim.power, aim.sx); }
      else {
        const dd = layout.d2w(aim.ax - aim.cx, aim.ay - aim.cy), pull = hyp(aim.ax - aim.cx, aim.ay - aim.cy);
        if (pull > DEAD && dd.y > 0) guide({ x: dd.x / hyp(dd.x, dd.y), y: dd.y / hyp(dd.x, dd.y) }, clamp((pull - DEAD) / (MAXPULL - DEAD), 0, 1), aim.sx);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(aim.ax, aim.ay); ctx.lineTo(aim.cx, aim.cy); ctx.stroke();
        ctx.fillStyle = LK.guide; ctx.beginPath(); ctx.arc(aim.cx, aim.cy, 9, 0, 6.3); ctx.fill();
      }
    }
    if (P.controls === 'meter' && flying === null && host.canThrow()) {
      guide({ x: Math.sin(meter.angle), y: Math.cos(meter.angle) }, meter.stage === 1 ? meter.power : 0.5, L.start.x);
      const bx = area.x + 14, bh = area.h * 0.5, by = area.y + (area.h - layout.bar) / 2 - bh / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(bx, by, 18, bh);
      ctx.fillStyle = meter.stage === 1 ? LK.guide : 'rgba(255,255,255,0.3)'; const ph2 = bh * (meter.stage === 1 ? meter.power : 0); ctx.fillRect(bx, by + bh - ph2, 18, ph2);
      g.label(ctx, meter.stage === 0 ? 'Tap to set the angle' : 'Tap to throw', area.x + area.w / 2, area.y + 16, g.px(20), LK.hudText);
    }
    // floats
    for (const f of floats) { const c = tr(f.x, f.y); ctx.globalAlpha = 1 - f.t / 1.4; g.label(ctx, f.text, c.x, c.y - 20 - f.t * 30, g.px(30), LK.float, 'center', '800'); ctx.globalAlpha = 1; }
    // HUD: wind and throws left
    const hy = area.y + area.h - layout.bar / 2 - 2;
    const left = host.throwsLeft(), total = P.rounds.throws;
    for (let i = 0; i < total; i++) { ctx.fillStyle = i < left ? LK.guide : 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(area.x + 18 + i * 20, hy, 7, 0, 6.3); ctx.fill(); }
    const wm = P.world.wind ?? 0;
    if (wm > 0) {
      const mag = hyp(w.wind.x, w.wind.y), wd = layout.w2d(w.wind.x, w.wind.y);
      const cx = area.x + area.w - 70, k = mag > 0 ? 1 / mag : 0;
      g.label(ctx, 'Wind', cx - 38, hy, g.px(18), LK.hudText, 'right', '600');
      ctx.strokeStyle = LK.hudText; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - wd.x * k * 18, hy - wd.y * k * 18); ctx.lineTo(cx + wd.x * k * 18, hy + wd.y * k * 18); ctx.stroke();
      ctx.fillStyle = LK.hudText; ctx.beginPath(); ctx.arc(cx + wd.x * k * 18, hy + wd.y * k * 18, 5, 0, 6.3); ctx.fill();
      for (let i = 0; i < 4; i++) { ctx.fillStyle = mag / wm > i / 4 ? LK.guide : 'rgba(255,255,255,0.2)'; ctx.fillRect(cx + 26 + i * 8, hy + 8 - i * 4, 6, 4 + i * 4); }
    }
  };

  const testPlan = () => {
    if (!planCache && w && layout) { const pl = computePlan(3 * DT); planCache = { ...pl, ...pathFor(pl) }; }
    return planCache;
  };

  return {
    reset, update, attract, render,
    busy: () => flying !== null,
    endGain: () => (P.rounds.scoreAt === 'end' ? ph.restTotal(w) : 0),
    point(id) {
      if (!layout) return null;
      if (id === 'tap') return { x: layout.area.x + layout.area.w / 2, y: layout.area.y + layout.area.h / 2 };
      const pl = testPlan(); if (!pl) return null;
      if (id === 'anchor') return { x: pl.ax, y: pl.ay, gain: pl.gain };
      if (id === 'release') return { x: pl.cx, y: pl.cy, gain: pl.gain };
      if (id === 'meter') return { angle: pl.ang, power: pl.power };
      return null;
    },
    hint: () => (P.controls === 'meter' ? 'Tap once to lock the angle, again to lock the power.' : 'Press, pull back and release: the dotted line shows the direction and strength.'),
    state: () => ({ clock: Math.round(w?.clock * 100) / 100, flying, wind: w ? { x: Math.round(w.wind.x * 100) / 100, y: Math.round(w.wind.y * 100) / 100 } : null,
      bodies: (w?.bodies ?? []).map((b) => [b.kind, b.st, Math.round(b.x * 100) / 100, Math.round(b.y * 100) / 100]) }),
  };
}

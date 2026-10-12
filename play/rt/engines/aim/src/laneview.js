// Lane module: input (drag to aim, or meters), guide, rendering, attract AI. Physics lives in lane.js.
// Rendering is a true perspective view from behind the thrower: the lane recedes to a horizon, objects shrink with
// distance and are foreshortened, scenery sits on parallax layers, and every landing has weight (dust, ripples, shake).
import { createPhysics, railed, DT } from './lane.js';
import { drawBackdrop, windFlag, createFx, palFor, inferSetting, mix, dark, light, alpha, vgrad, hgrad, poly, rrect, clamp, hash } from './scenery.js';

const hyp = Math.hypot;
const TAU = Math.PI * 2;
const MAXPULL = 150, DEAD = 14;

export function createLane(P, env, host) {
  const ph = createPhysics(P);
  const { hw, len } = ph;
  const L = P.lane, T = P.target, PR = P.projectile, LK = P.look;
  const rng = env.rng;
  const setting = inferSetting(P, env.text?.title);
  const pal = palFor(setting, {});
  const fx = createFx(env);
  let w = null, layout = null, aim = null, floats = [], flying = null, ai = null, planCache = null, clock = 0;
  const meter = { stage: 0, t: 0, angle: 0, power: 0 };
  const seen = new Map();
  let trail = [];
  const tone = (o) => env.audio?.tone?.(o);

  const reset = () => { w = ph.newWorld(rng); flying = null; aim = null; ai = null; planCache = null; floats = []; meter.stage = 0; meter.t = 0; trail = []; seen.clear(); fx.reset(); };

  // ---- perspective camera --------------------------------------------------------------------------------------------
  const makeLayout = (area) => {
    const bar = 40;
    const wide = area.w > area.h * 1.15;
    const hy = area.y + (area.h - bar) * (wide ? 0.13 : 0.2);
    const yBottom = area.y + area.h - bar - 10;
    const nearY = -Math.max(0.9, len * 0.09);
    const back = Math.max(4, len * 0.5);
    const Kb = (yBottom - hy) * (nearY + back);               // sy(y) = hy + Kb / (y + back)
    const sNear = Math.min(area.w * 0.9 / (L.width + 0.5), (yBottom - hy) * (wide ? 0.34 : 0.18));
    const camH = (yBottom - hy) / sNear;
    const cx = area.x + area.w / 2;
    const sy = (y) => hy + Kb / (y + back);
    const sc = (y) => (sy(y) - hy) / camH;                    // pixels per world unit across the lane at depth y
    const fs = (y) => camH / (y + back);                      // foreshortening: how much a circle on the ground is squashed
    const tr = (x, y, z = 0) => { const s = sc(y); return { x: cx + x * s, y: sy(y) - z * s * 1.8, s }; };
    const inv = (px, py) => { const y = Kb / Math.max(1, py - hy) - back; return { x: (px - cx) / sc(y), y }; };
    return { area, hy, yBottom, nearY, back, tr, sy, sc, fs, inv, cx, bar, d2w: (dx, dy) => ({ x: dx, y: -dy }), w2d: (x, y) => ({ x, y: -y }) };
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
    const score = (c) => { const g = evalThrow(w, sx, c.ang, c.power, offset); return g * 10 + closeness(w, sx, c.ang, c.power, offset) * 0.1; };
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
    trail = [];
    host.thrown();
    planCache = null;
    tone({ freq: 240 + power * 220, to: 150, dur: 0.14, type: 'triangle', vol: 0.45 });
    fx.sfx(0.02, { freq: 900 + power * 600, to: 300, dur: 0.07, type: 'sawtooth', vol: 0.06 }); // whoosh
  };

  // sound for physics events (no positions needed)
  const sfx = (ev) => {
    for (const e of ev.slice(0, 4)) {
      if (e === 'in') { tone({ freq: 660, to: 990, dur: 0.18, type: 'triangle', vol: 0.4 }); fx.sfx(0.08, { freq: 1320, dur: 0.16, type: 'sine', vol: 0.25 }); }
      else if (e === 'splash') { tone({ freq: 320, to: 90, dur: 0.16, type: 'sawtooth', vol: 0.22 }); fx.sfx(0.05, { freq: 700, to: 200, dur: 0.1, type: 'triangle', vol: 0.12 }); }
      else if (e === 'skip') tone({ freq: 520, to: 760, dur: 0.05, type: 'triangle', vol: 0.35 });
      else if (e === 'pin') { tone({ freq: 210, to: 130, dur: 0.1, type: 'square', vol: 0.3 }); fx.sfx(0.05, { freq: 160, to: 110, dur: 0.08, type: 'square', vol: 0.2 }); }
      else if (e === 'hit') tone({ freq: 300, to: 220, dur: 0.04, type: 'square', vol: 0.22 });
      else if (e === 'land') tone({ freq: 120, to: 60, dur: 0.13, type: 'sine', vol: 0.45 });
      else if (e === 'rim') tone({ freq: 420, to: 300, dur: 0.07, type: 'triangle', vol: 0.3 });
    }
  };

  // visual consequences: found by comparing each body with how it was last tick
  const watch = () => {
    if (!layout) return;
    for (const b of w.bodies) {
      const pv = seen.get(b.id);
      const hop = b.fl?.hop ?? 0;
      if (pv) {
        const p = layout.tr(b.x, b.y), f = layout.fs(b.y), s = p.s;
        if (b.kind === 'proj') {
          if (pv.st === 'fly' && b.st === 'ground') { fx.dust(p.x, p.y, s * 0.12); fx.ring(p.x, p.y, s * 0.5, s * 0.5 * f, 'rgba(255,255,255,0.7)', 0.5, 2.5); fx.kick(3); }
          else if (pv.st !== 'in' && b.st === 'in') { fx.sparks(p.x, p.y, s * 0.16); fx.ring(p.x, p.y, s * 0.7, s * 0.7 * f, alpha('#ffe27a', 0.9), 0.7, 3.5); fx.kick(5); }
          else if (pv.st !== 'sunk' && b.st === 'sunk') { fx.drops(p.x, p.y, s * 0.2); fx.ring(p.x, p.y, s * 0.7, s * 0.7 * f, 'rgba(235,248,255,0.85)', 0.9, 3); fx.ring(p.x, p.y, s * 1.1, s * 1.1 * f, 'rgba(235,248,255,0.5)', 1.1, 2); }
          else if (pv.st !== 'out' && b.st === 'out') fx.dust(p.x, p.y, s * 0.1, 'rgba(200,190,170,0.6)', 4);
          else if (b.st === 'fly' && hop > pv.hop) { fx.ring(p.x, p.y, s * 0.4, s * 0.4 * f, 'rgba(235,248,255,0.9)', 0.7, 2.5); fx.drops(p.x, p.y, s * 0.12, undefined, 5); }
        } else if (b.kind === 'pin' && pv.st === 'stand' && b.st === 'fallen') {
          fx.shards(p.x, p.y - s * 0.2, s * 0.06, [LK.pin, LK.pinEdge, LK.pinDown], 7); fx.dust(p.x, p.y, s * 0.08, 'rgba(230,220,190,0.55)', 3); fx.kick(4);
        }
      }
      seen.set(b.id, { st: b.st, hop });
    }
  };

  const bank = () => {
    const thr = flying;
    const g = ph.throwGain(w, thr);
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
    if (g > 0) fx.sfx(0.1, { freq: 880, to: 1320, dur: 0.14, type: 'triangle', vol: 0.25 });
    host.settle(g, { over: !!allDown });
  };

  // ---- update ---------------------------------------------------------------------------------------------
  const tick = (dt) => {
    clock += dt;
    fx.update(dt);
    for (const f of floats) f.t += dt;
    floats = floats.filter((f) => f.t < 1.4);
    if (!w) return false;
    if (flying !== null) {
      const ev = ph.step(w, []);
      sfx(ev);
      watch();
      for (const b of w.bodies) if (b.kind === 'proj' && b.thr === flying && (b.st === 'fly' || b.st === 'ground')) { trail.push({ x: b.x, y: b.y, z: b.z ?? 0, st: b.st }); if (trail.length > 40) trail.shift(); }
      if (ph.settled(w)) bank();
      return false;
    }
    ph.step(w, []);   // keep the clock (moving targets) running while aiming
    if (trail.length) trail.shift();
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
      aim = { ax: p.x, ay: p.y, cx: p.x, cy: p.y, sx: L.startX === 'free' ? clamp(layout.inv(p.x, layout.sy(L.start.y)).x, -hw + PR.r, hw - PR.r) : L.start.x };
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
  const ellipse = (ctx, x, y, rx, ry) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, TAU); };
  let gLabel = null;

  // a piece in 3D: shadow on the ground, then the object, lifted by z
  const drawPiece = (ctx, b, spin) => {
    if (b.st === 'out' || b.st === 'sunk') return;
    const p = layout.tr(b.x, b.y), f = layout.fs(b.y), s = p.s;
    const z = b.z ?? 0, r = Math.max(3, b.r * s), lift = z * s * 1.8;
    if (b.kind === 'pin') {
      const fallen = b.st === 'fallen';
      const ph2 = s * 0.28;
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; ellipse(ctx, p.x + r * 0.25, p.y + 1, r * 1.1, r * f * 0.9); ctx.fill();
      if (fallen) {
        ctx.save(); ctx.translate(p.x, p.y - r * 0.4); ctx.rotate(0.9 + (b.id % 5) * 0.5);
        ctx.fillStyle = LK.pinDown; rrect(ctx, -ph2 * 0.5, -r * 0.8, ph2, r * 1.6, r * 0.7); ctx.fill(); ctx.strokeStyle = LK.pinEdge; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-ph2 * 0.3, -r * 0.5, ph2 * 0.18, r);
        ctx.restore();
      } else {
        ctx.fillStyle = hgrad(ctx, p.x - r, p.x + r, [[0, light(LK.pin, 0.25)], [0.55, LK.pin], [1, dark(LK.pin, 0.3)]]);
        rrect(ctx, p.x - r, p.y - ph2, r * 2, ph2 + r * f * 0.5, r * 0.8); ctx.fill();
        ctx.strokeStyle = LK.pinEdge; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = light(LK.pin, 0.15); ellipse(ctx, p.x, p.y - ph2, r, r * f * 0.9); ctx.fill(); ctx.strokeStyle = LK.pinEdge; ctx.stroke();
        if (b.v !== undefined && r > 6 && gLabel) gLabel(b.v, p.x, p.y - ph2, Math.min(r * 1.25, 20), LK.pinText);
      }
      return;
    }
    if (b.kind === 'jack') {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ellipse(ctx, p.x + 1, p.y + 1, r * 1.1, r * f); ctx.fill();
      const gr = ctx.createRadialGradient(p.x - r * 0.3, p.y - r * 0.5 - r * f * 0.2, 1, p.x, p.y - r * 0.4, r * 1.1);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, dark(LK.jack, 0.35));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x, p.y - r * 0.55, r, 0, TAU); ctx.fill();
      return;
    }
    const sh = clamp(1 - z * 0.6, 0.4, 1);
    ctx.fillStyle = `rgba(0,0,0,${0.3 * sh})`; ellipse(ctx, p.x + lift * 0.1, p.y + 1, r * 1.1 * sh, r * f * 0.95 * sh); ctx.fill();
    const cy = p.y - lift - r * 0.45, rs = r * (1 + z * 0.15);
    const look = PR.look;
    if (look === 'ring') {
      ctx.save(); ctx.translate(p.x, cy); ctx.scale(1, clamp(f * 1.1, 0.35, 1));
      ctx.strokeStyle = dark(PR.color, 0.4); ctx.lineWidth = Math.max(3, rs * 0.55); ctx.beginPath(); ctx.arc(0, 0, rs * 0.85, 0, TAU); ctx.stroke();
      ctx.strokeStyle = PR.color; ctx.lineWidth = Math.max(2, rs * 0.4); ctx.beginPath(); ctx.arc(0, 0, rs * 0.85, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = Math.max(1, rs * 0.12); ctx.beginPath(); ctx.arc(0, 0, rs * 0.85, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
      ctx.restore();
    } else if (look === 'stone') {
      ctx.save(); ctx.translate(p.x, cy); ctx.rotate((spin ?? 0) * 0.5);
      const gr = ctx.createRadialGradient(-rs * 0.3, -rs * 0.3, 1, 0, 0, rs * 1.2); gr.addColorStop(0, light(PR.color, 0.35)); gr.addColorStop(1, dark(PR.color, 0.35));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(0, 0, rs * 1.05, rs * 0.74, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    } else if (look === 'baton') {
      ctx.save(); ctx.translate(p.x, cy); ctx.rotate(spin ?? 0); ctx.fillStyle = hgrad(ctx, -rs, rs, [[0, light(PR.color, 0.3)], [1, dark(PR.color, 0.35)]]); rrect(ctx, -rs * 1.6, -rs * 0.55, rs * 3.2, rs * 1.1, rs * 0.4); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
    } else if (look === 'arrow') {
      ctx.save(); ctx.translate(p.x, cy); ctx.strokeStyle = PR.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, rs * 1.7); ctx.lineTo(0, -rs * 1.7); ctx.stroke(); ctx.fillStyle = '#ddd'; poly(ctx, [[-rs * 0.4, -rs * 1.5], [rs * 0.4, -rs * 1.5], [0, -rs * 2.3]]); ctx.fill(); ctx.restore();
    } else {
      const gr = ctx.createRadialGradient(p.x - rs * 0.35, cy - rs * 0.4, 1, p.x, cy, rs * 1.15);
      gr.addColorStop(0, light(PR.color, 0.7)); gr.addColorStop(0.5, PR.color); gr.addColorStop(1, dark(PR.color, 0.5));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x, cy, rs, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(p.x - rs * 0.35, cy - rs * 0.4, rs * 0.25, rs * 0.15, -0.6, 0, TAU); ctx.fill();
    }
  };

  // lane polygon between two depths at x extents
  const strip = (ctx, y0, y1, xa, xb) => {
    const A = layout.tr(xa, y0), B = layout.tr(xb, y0), C = layout.tr(xb, y1), D = layout.tr(xa, y1);
    poly(ctx, [[A.x, A.y], [B.x, B.y], [C.x, C.y], [D.x, D.y]]);
  };

  const render = (g, area) => {
    const { ctx } = g;
    gLabel = (s, x, y, size, col) => g.label(ctx, s, x, y, size, col, 'center', '700');
    layout = makeLayout(area);
    if (!w) return;
    const { tr, hy, fs } = layout;
    const off = fx.offset();
    ctx.save();
    ctx.beginPath(); ctx.rect(area.x, area.y, area.w, area.h); ctx.clip();
    ctx.translate(off.x, off.y);
    const aimX = aim ? (aim.ai ? aim.dir.x * 0.5 : clamp((aim.cx - aim.ax) / 150, -1, 1)) : 0;
    const pan = -aimX * area.w * 0.03;
    const P2 = { ...pal, skyTop: LK.skyTop && LK.skyTop !== '#7fb4d9' ? LK.skyTop : pal.skyTop, skyLow: LK.skyLow && LK.skyLow !== '#dbe9f1' ? LK.skyLow : pal.skyLow };
    drawBackdrop(ctx, setting, { x: area.x - 20, y: area.y, w: area.w + 40, h: area.h }, hy, P2, clock, pan);
    // ground around the lane, with depth bands (mown stripes / flagstones)
    const gnd = pal.ground;
    ctx.fillStyle = vgrad(ctx, hy, area.y + area.h, [[0, mix(gnd, pal.skyLow, 0.45)], [0.35, gnd], [1, dark(gnd, 0.35)]]);
    ctx.fillRect(area.x - 20, hy, area.w + 40, area.y + area.h - hy);
    for (let k = -2; k < len + 6; k += 2) {
      const a = layout.sy(k), b2 = layout.sy(k + 1);
      ctx.fillStyle = 'rgba(255,255,255,0.045)'; ctx.fillRect(area.x - 20, b2, area.w + 40, a - b2);
    }
    // the boundary across the far end of the field: hedge, boards or a low wall by setting
    {
      const wy = len + 0.9, base = layout.sy(wy), hgt = Math.max(10, layout.sc(wy) * 1.4);
      const solid = setting === 'ice' || setting === 'hall' || setting === 'dojo' || setting === 'court' || setting === 'festival';
      const col = setting === 'ice' ? '#2c4a78' : setting === 'hall' || setting === 'dojo' ? '#4a2e1c' : setting === 'court' || setting === 'festival' ? '#b8a07a' : setting === 'shore' ? '#c8b890' : pal.mid;
      ctx.fillStyle = vgrad(ctx, base - hgt, base, [[0, light(col, 0.2)], [1, dark(col, 0.3)]]);
      if (solid) ctx.fillRect(area.x - 20, base - hgt, area.w + 40, hgt);
      else {
        ctx.beginPath(); ctx.moveTo(area.x - 20, base);
        for (let x = area.x - 20; x <= area.x + area.w + 20; x += 8) ctx.lineTo(x, base - hgt + Math.sin(x * 0.11) * hgt * 0.15 + Math.sin(x * 0.3) * hgt * 0.07);
        ctx.lineTo(area.x + area.w + 20, base); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(area.x - 20, base - hgt, area.w + 40, 2);
      if (solid) { ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = area.x; x < area.x + area.w; x += Math.max(14, hgt * 1.4)) { ctx.moveTo(x, base - hgt); ctx.lineTo(x, base); } ctx.stroke(); }
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(area.x - 20, base, area.w + 40, 3);
    }
    // lane surface
    strip(ctx, -2, len, -hw, hw);
    ctx.fillStyle = vgrad(ctx, layout.sy(len), layout.sy(-2), [[0, mix(LK.lane, pal.skyLow, 0.28)], [1, dark(LK.lane, 0.12)]]); ctx.fill();
    ctx.save(); strip(ctx, -2, len, -hw, hw); ctx.clip();
    for (let k = -2; k < len; k += 2) { strip(ctx, k, k + 1, -hw, hw); ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill(); }
    for (const z of P.world.zones ?? []) { strip(ctx, z.y0, z.y1, -hw, hw); ctx.fillStyle = z.mul > 1 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'; ctx.fill(); }
    (T.bands ?? []).forEach((b, i) => {
      strip(ctx, b.y0, b.y1, -hw, hw); ctx.fillStyle = alpha(ringColors(i), 0.55); ctx.fill();
      ctx.strokeStyle = LK.line; ctx.lineWidth = 2; ctx.stroke();
      const c = tr(0, (b.y0 + b.y1) / 2);
      g.label(ctx, b.points, c.x, c.y, clamp(c.s * 0.5, 12, 30), LK.line, 'center', '800');
    });
    for (const h of P.world.hazards ?? []) {
      const c = tr(h.x, h.y), f = fs(h.y);
      const gr = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, h.r * c.s); gr.addColorStop(0, light(LK.hazard, 0.1)); gr.addColorStop(1, dark(LK.hazard, 0.2));
      ctx.fillStyle = gr; ellipse(ctx, c.x, c.y, h.r * c.s, h.r * c.s * f); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
      for (let i = 0; i < 2; i++) { ellipse(ctx, c.x, c.y, h.r * c.s * (0.5 + 0.18 * i + 0.04 * Math.sin(clock * 2 + i)), h.r * c.s * f * (0.5 + 0.18 * i)); ctx.stroke(); }
    }
    ctx.restore();
    // rings (foreshortened discs)
    (T.rings ?? []).forEach((ring) => {
      const cen = ring.around === 'jack' ? w.bodies.find((b) => b.kind === 'jack') : railed(ring, w.clock);
      if (!cen) return;
      const c = tr(cen.x, cen.y), f = fs(cen.y);
      const jackRing = ring.around === 'jack';
      [...ring.bands].reverse().forEach((band, i, arr) => {
        const col = ringColors(arr.length - 1 - i), rr = band.r * c.s;
        const gr = ctx.createRadialGradient(c.x, c.y, rr * 0.1, c.x, c.y, rr);
        gr.addColorStop(0, light(col, 0.18)); gr.addColorStop(1, dark(col, 0.18));
        ctx.globalAlpha = jackRing ? 0.3 : 0.92; ctx.fillStyle = gr; ellipse(ctx, c.x, c.y, rr, rr * f); ctx.fill(); ctx.globalAlpha = 1;
        ctx.strokeStyle = LK.line; ctx.lineWidth = 1.5; ctx.stroke();
      });
      const first = ring.bands[0];
      if (first && first.r * c.s > 8 && !jackRing) g.label(ctx, first.points, c.x, c.y, Math.min(first.r * c.s * 1.1, 24), LK.line, 'center', '800');
    });
    // pots and pegs
    for (const p of T.pots ?? []) {
      const pos = railed(p, w.clock), c = tr(pos.x, pos.y), f = fs(pos.y), rr = p.r * c.s;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ellipse(ctx, c.x + rr * 0.15, c.y + rr * f * 0.2, rr * 1.15, rr * f * 1.0); ctx.fill();
      if (p.peg) {
        const hgt = c.s * 0.5;
        ctx.fillStyle = hgrad(ctx, c.x - rr, c.x + rr, [[0, light(LK.potRim, 0.3)], [1, dark(LK.potRim, 0.3)]]); ctx.fillRect(c.x - Math.max(3, rr), c.y - hgt, Math.max(6, rr * 2), hgt);
        ctx.fillStyle = light(LK.potRim, 0.3); ellipse(ctx, c.x, c.y - hgt, Math.max(3, rr), Math.max(2, rr * f)); ctx.fill();
      } else {
        const rim = (p.rim ?? 0) * c.s, ro = rr + Math.max(rim, 3);
        ctx.fillStyle = hgrad(ctx, c.x - ro, c.x + ro, [[0, light(LK.potRim, 0.35)], [0.5, LK.potRim], [1, dark(LK.potRim, 0.35)]]);
        ellipse(ctx, c.x, c.y, ro, ro * f); ctx.fill();
        ctx.fillStyle = vgrad(ctx, c.y - rr * f, c.y + rr * f, [[0, '#000'], [1, LK.pot]]); ellipse(ctx, c.x, c.y, rr, rr * f); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5; ellipse(ctx, c.x, c.y, ro, ro * f); ctx.stroke();
      }
      if (p.points > 1 || p.label) g.label(ctx, p.label ?? p.points, c.x, c.y - (p.peg ? c.s * 0.65 : 0), Math.min(Math.max(rr, 8) * 1.2, 22), LK.potText, 'center', '800');
    }
    // lane edges (low boards with a lit top), foul line, distance marks
    for (const sgn of [-1, 1]) {
      const a = tr(sgn * hw, -2), b = tr(sgn * hw, len), a2 = tr(sgn * hw, -2, 0.18), b2 = tr(sgn * hw, len, 0.18);
      ctx.fillStyle = dark(LK.edge, 0.15); poly(ctx, [[a.x, a.y], [b.x, b.y], [b2.x, b2.y], [a2.x, a2.y]]); ctx.fill();
      ctx.strokeStyle = light(LK.edge, 0.4); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a2.x, a2.y); ctx.lineTo(b2.x, b2.y); ctx.stroke();
    }
    const fl0 = tr(-hw, 0), fl1 = tr(hw, 0);
    ctx.strokeStyle = LK.line; ctx.lineWidth = Math.max(2, fl0.s * 0.05); ctx.beginPath(); ctx.moveTo(fl0.x, fl0.y); ctx.lineTo(fl1.x, fl1.y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let k = 2; k < len; k += 2) {
      const m0 = tr(-hw, k), m1 = tr(-hw + 0.35, k);
      ctx.fillRect(m0.x, m0.y - 1, Math.max(3, m1.x - m0.x), 2);
      if (k % 4 === 0) g.label(ctx, `${k}`, m0.x - clamp(m0.s * 0.28, 7, 14), m0.y, clamp(m0.s * 0.3, 9, 14), 'rgba(255,255,255,0.8)', 'center', '600');
    }
    // props beside the lane: they make distance readable (smaller and higher with depth)
    for (let k = 1; k < len + 2; k += 3) {
      for (const sgn of [-1, 1]) {
        const c = tr(sgn * (hw + 0.55), k), s = c.s;
        if (setting === 'lawn' || setting === 'generic' || setting === 'village') {
          ctx.fillStyle = dark(pal.mid, 0.15); ctx.beginPath(); ctx.ellipse(c.x, c.y - s * 0.12, s * 0.28, s * 0.2, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = light(pal.mid, 0.2); ctx.beginPath(); ctx.ellipse(c.x - s * 0.06, c.y - s * 0.18, s * 0.18, s * 0.12, 0, 0, TAU); ctx.fill();
        } else if (setting === 'ice' || setting === 'hall' || setting === 'dojo') {
          ctx.fillStyle = '#d8453a'; ctx.fillRect(c.x - s * 0.12, c.y - s * 0.5, s * 0.24, s * 0.5);
          ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(c.x - s * 0.12, c.y - s * 0.5, s * 0.07, s * 0.5);
        } else {
          ctx.fillStyle = '#7a5a34'; ctx.fillRect(c.x - s * 0.05, c.y - s * 0.45, s * 0.1, s * 0.45);
          ctx.fillStyle = light('#7a5a34', 0.3); ctx.beginPath(); ctx.arc(c.x, c.y - s * 0.46, s * 0.09, 0, TAU); ctx.fill();
        }
      }
    }
    // thrower spot and shadow
    const sxNow = aim ? aim.sx : L.start.x, th = tr(sxNow, L.start.y), tf = fs(L.start.y);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ellipse(ctx, th.x, th.y + 4, th.s * 0.55, th.s * 0.55 * tf); ctx.fill();
    ctx.strokeStyle = LK.thrower; ctx.lineWidth = 2.5; ellipse(ctx, th.x, th.y, th.s * 0.4, th.s * 0.4 * tf); ctx.stroke();
    // bodies far to near
    const bs = w.bodies.filter((b) => b.st !== 'out' && b.st !== 'sunk').sort((a, b) => b.y - a.y);
    for (const b of bs) { if (b.kind !== 'proj') drawPiece(ctx, b); }
    if (trail.length > 2) {
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1], b = trail[i], pa = tr(a.x, a.y, a.z), pb = tr(b.x, b.y, b.z);
        const k = i / trail.length;
        ctx.strokeStyle = b.st === 'fly' ? `rgba(255,236,160,${0.75 * k})` : `rgba(255,255,255,${0.28 * k})`;
        ctx.lineWidth = b.st === 'fly' ? Math.max(1.5, pb.s * 0.12 * k) : Math.max(1, pb.s * 0.08 * k);
        ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
      }
      ctx.lineCap = 'butt';
    }
    for (const b of bs) { if (b.kind === 'proj') drawPiece(ctx, b, clock * 8 + b.id); }
    // wind: a pennant by the lane and streaks of drifting dust
    const wm = P.world.wind ?? 0;
    if (wm > 0) {
      const fp = tr(hw + 1.0, len * 0.6);
      windFlag(ctx, fp.x, fp.y, fp.s * 1.5, w.wind.x, wm, clock, '#d8453a');
      const k = w.wind.x / wm;
      ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 9; i++) {
        const u = (clock * (0.18 + 0.4 * Math.abs(k)) * Math.sign(k || 1) + i * 0.137) % 1, uu = (u + 1) % 1;
        const yy = layout.sy(len * (0.1 + 0.8 * hash(i + 3))) - 20 - hash(i) * 40, xx = area.x + area.w * uu;
        ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx - Math.sign(k || 1) * (10 + 26 * Math.abs(k)), yy); ctx.stroke();
      }
    }
    // landing / aiming guide
    const R_ = P.range;
    const guide = (dirw, power, sx) => {
      const a = tr(sx, L.start.y);
      if (P.guide === 'full') {
        const gw = { clock: w.clock, nid: 1, throwNo: 0, bodies: [], wind: w.wind, trail: [] };
        ph.launch(gw, sx, dirw.x, dirw.y, power);
        ph.settle(gw, 8);
        const tl = gw.trail;
        for (let i = 0; i < tl.length; i += 4) {
          const q = tl[i], c = tr(q.x, q.y, q.z ?? 0), k = i / tl.length;
          ctx.fillStyle = alpha(LK.guide, 0.95 - k * 0.5); ctx.beginPath(); ctx.arc(c.x, c.y, Math.max(1.8, c.s * 0.05), 0, TAU); ctx.fill();
        }
        const e = tl[tl.length - 1];
        if (e) {
          const c = tr(e.x, e.y), f = fs(e.y), pulse = 1 + 0.12 * Math.sin(clock * 6);
          ctx.strokeStyle = LK.guide; ctx.lineWidth = 2.5; ellipse(ctx, c.x, c.y, c.s * 0.34 * pulse, c.s * 0.34 * pulse * f); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(c.x - c.s * 0.2, c.y); ctx.lineTo(c.x + c.s * 0.2, c.y); ctx.moveTo(c.x, c.y - c.s * 0.2 * f); ctx.lineTo(c.x, c.y + c.s * 0.2 * f); ctx.stroke();
        }
      } else {
        const d = R_.min + power * (R_.max - R_.min);
        const far = tr(sx + dirw.x * d, L.start.y + dirw.y * d);
        ctx.strokeStyle = LK.guide; ctx.lineWidth = 3; ctx.setLineDash([3, 9]); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(far.x, far.y); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.lineCap = 'butt';
    };
    if (aim && host.canThrow()) {
      if (aim.ai) { if (aim.power > 0.02) guide(aim.dir, aim.power, aim.sx); }
      else {
        const dd = layout.d2w(aim.ax - aim.cx, aim.ay - aim.cy), pull = hyp(aim.ax - aim.cx, aim.ay - aim.cy);
        if (pull > DEAD && dd.y > 0) guide({ x: dd.x / hyp(dd.x, dd.y), y: dd.y / hyp(dd.x, dd.y) }, clamp((pull - DEAD) / (MAXPULL - DEAD), 0, 1), aim.sx);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(aim.ax, aim.ay); ctx.lineTo(aim.cx, aim.cy); ctx.stroke(); ctx.setLineDash([]);
        const gr = ctx.createRadialGradient(aim.cx - 3, aim.cy - 3, 1, aim.cx, aim.cy, 12); gr.addColorStop(0, '#fff6c8'); gr.addColorStop(1, dark(LK.guide, 0.3));
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(aim.cx, aim.cy, 11, 0, TAU); ctx.fill();
      }
      const pw = aim.ai ? aim.power : clamp((hyp(aim.ax - aim.cx, aim.ay - aim.cy) - DEAD) / (MAXPULL - DEAD), 0, 1);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(th.x, th.y, th.s * 0.55, 0, TAU); ctx.stroke();
      ctx.strokeStyle = pw > 0.85 ? '#ff7a4a' : LK.guide; ctx.beginPath(); ctx.arc(th.x, th.y, th.s * 0.55, -Math.PI / 2, -Math.PI / 2 + TAU * pw); ctx.stroke();
    } else if (host.canThrow() && flying === null && P.controls !== 'meter') {
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(clock * 3);
      ctx.strokeStyle = LK.guide; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(th.x, th.y, th.s * 0.5 + 3, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (flying === null && host.canThrow()) drawPiece(ctx, { kind: 'proj', x: sxNow, y: L.start.y, r: PR.r, st: 'ground', z: 0.12 + 0.03 * Math.sin(clock * 3), id: 0 }, clock);
    if (P.controls === 'meter' && flying === null && host.canThrow()) {
      guide({ x: Math.sin(meter.angle), y: Math.cos(meter.angle) }, meter.stage === 1 ? meter.power : 0.5, L.start.x);
      const bx = area.x + 14, bh = area.h * 0.45, by = area.y + (area.h - layout.bar) / 2 - bh / 2;
      rrect(ctx, bx, by, 18, bh, 9); ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill();
      const ph2 = bh * (meter.stage === 1 ? meter.power : 0);
      if (ph2 > 2) { rrect(ctx, bx, by + bh - ph2, 18, ph2, 9); ctx.fillStyle = vgrad(ctx, by, by + bh, [[0, '#ff7a4a'], [1, LK.guide]]); ctx.fill(); }
      g.label(ctx, meter.stage === 0 ? 'Tap to set the angle' : 'Tap to throw', area.x + area.w / 2, area.y + 18, g.px(20), LK.hudText);
    }
    fx.draw(ctx);
    for (const f of floats) { const c = tr(f.x, f.y); const k = f.t / 1.4; ctx.globalAlpha = 1 - k * k; g.label(ctx, f.text, c.x, c.y - 24 - f.t * 34, g.px(30 * (1 + 0.4 * Math.max(0, 1 - f.t * 6))), LK.float, 'center', '800'); ctx.globalAlpha = 1; }
    ctx.restore();
    // HUD: throws left (as pieces) and the wind
    const hyH = area.y + area.h - layout.bar / 2 - 2;
    const left = host.throwsLeft(), total = P.rounds.throws;
    for (let i = 0; i < total; i++) {
      const x = area.x + 18 + i * 20;
      ctx.fillStyle = i < left ? PR.color : 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.arc(x, hyH, 7, 0, TAU); ctx.fill();
      ctx.strokeStyle = i < left ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    if (wm > 0) {
      const mag = hyp(w.wind.x, w.wind.y), dirx = w.wind.x / (mag || 1);
      const cx = area.x + area.w - 66;
      g.label(ctx, 'Wind', cx - 36, hyH, g.px(16), LK.hudText, 'right', '600');
      ctx.strokeStyle = LK.hudText; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - 16 * dirx, hyH + (w.wind.y / (mag || 1)) * 6); ctx.lineTo(cx + 16 * dirx, hyH - (w.wind.y / (mag || 1)) * 6); ctx.stroke();
      ctx.fillStyle = LK.hudText; ctx.beginPath(); ctx.arc(cx + 16 * dirx, hyH - (w.wind.y / (mag || 1)) * 6, 5, 0, TAU); ctx.fill();
      for (let i = 0; i < 4; i++) { ctx.fillStyle = mag / wm > i / 4 ? LK.guide : 'rgba(255,255,255,0.2)'; ctx.fillRect(cx + 26 + i * 8, hyH + 8 - i * 4, 6, 4 + i * 4); }
      ctx.lineCap = 'butt';
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

// Face view (mode "fire"): looking at the targets from the shooter's position. Aim by dragging; the crosshair shows the
// true point of impact (hand sway, wind and drop included); release to shoot. Targets may swing or sweep across.
import { DT } from './lane.js';

const hyp = Math.hypot;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const LIFT = 70;

export function createFace(P, env, host) {
  const F = P.face, LK = P.look, rng = env.rng;
  const FW = F.w, FH = F.h, M = 0.35;
  let clock = 0, wind = 0, hold = 0, ptr = null, shots = [], stuck = [], floats = [], layout = null, ai = null, planCache = null, pending = 0;
  const meter = { stage: 0, t: 0, x: 0, y: 0 };
  const tone = (o) => env.audio?.tone?.(o);

  const reset = () => { clock = 0; wind = F.wind > 0 ? rng.range(-F.wind, F.wind) : 0; hold = 0; ptr = null; shots = []; stuck = []; floats = []; ai = null; planCache = null; pending = 0; meter.stage = 0; meter.t = 0; };

  const itemPos = (it, t) => {
    let x = it.x, y = it.y;
    if (it.scroll) { const span = FW + 2 * M; x = ((((it.x + it.scroll * t + FW / 2 + M) % span) + span) % span) - FW / 2 - M; }
    if (it.rail) { const a = (t * 2 * Math.PI) / (it.rail.period || 3) + (it.rail.phase || 0); x += (it.rail.ax || 0) * Math.sin(a); y += (it.rail.ay || 0) * Math.sin(a); }
    return { x, y };
  };
  const sway = (t) => ({ x: (F.sway * (Math.sin(t * 1.9) + 0.6 * Math.sin(t * 3.7 + 1.3))) / 1.6, y: (F.sway * (Math.cos(t * 1.4) + 0.6 * Math.cos(t * 2.9 + 0.4))) / 1.6 });
  const eff = (h) => (F.drawTime > 0 ? clamp(h / F.drawTime, 0, 1) : 1);
  const dropAt = (h) => F.drop * (1 - 0.7 * eff(h));
  const impact = (base, t, h) => { const s = sway(t); return { x: base.x + s.x + wind, y: base.y + s.y - dropAt(h) }; };
  const score = (pt, t) => {
    let best = 0, who = -1;
    F.items.forEach((it, i) => {
      const c = itemPos(it, t), d = hyp(pt.x - c.x, pt.y - c.y);
      for (const b of it.bands) if (d <= b.r) { if (b.points > best) { best = b.points; who = i; } break; }
    });
    return { points: best, who };
  };

  const toBase = (sx, sy) => ({ x: (sx - layout.rect.x) / layout.s - FW / 2, y: (layout.rect.y + layout.rect.h - (sy - LIFT)) / layout.s });
  const toScreen = (x, y) => ({ x: layout.rect.x + (x + FW / 2) * layout.s, y: layout.rect.y + layout.rect.h - y * layout.s });

  const shoot = (pt) => {
    const spread = F.spread > 0 ? { x: rng.range(-F.spread, F.spread), y: rng.range(-F.spread, F.spread) } : { x: 0, y: 0 };
    shots.push({ t: 0, x: pt.x + spread.x, y: pt.y + spread.y, at: clock + F.flight });
    pending++;
    host.thrown();
    planCache = null;
    tone({ freq: 700, to: 300, dur: 0.12, type: 'sawtooth', vol: 0.3 });
  };

  // tick: clock, resolution of arrows in flight and meters. Returns true when a new shot may be aimed.
  const tick = (dt) => {
    clock += dt;
    for (const f of floats) f.t += dt;
    floats = floats.filter((f) => f.t < 1.4);
    for (const sh of shots) {
      sh.t += dt;
      if (!sh.done && clock >= sh.at) {
        sh.done = true;
        const r = score(sh, clock);
        let rel = null;
        if (r.who >= 0) { const c = itemPos(F.items[r.who], clock); rel = { who: r.who, dx: sh.x - c.x, dy: sh.y - c.y }; }
        stuck.push({ x: sh.x, y: sh.y, rel, points: r.points });
        floats.push({ x: sh.x, y: sh.y, text: r.points ? `+${r.points}` : 'miss', t: 0 });
        tone(r.points ? { freq: 520 + r.points * 60, to: 880, dur: 0.15, type: 'triangle' } : { freq: 200, dur: 0.1, type: 'sawtooth', vol: 0.2 });
        sh.points = r.points;
      }
    }
    for (const s of shots.filter((q) => q.done && q.t > F.flight + 0.3)) { shots.splice(shots.indexOf(s), 1); pending--; host.settle(s.points ?? 0, {}); }
    if (!host.canThrow() || pending > 0) { ptr = null; return false; }
    if (P.controls === 'meter') {
      meter.t += dt;
      if (meter.stage === 0) meter.x = (FW / 2) * 0.9 * Math.sin((meter.t * 2 * Math.PI) / 2.6);
      else meter.y = FH * 0.5 + FH * 0.42 * Math.sin((meter.t * 2 * Math.PI) / 2.0);
    }
    return true;
  };
  const tapMeter = () => {
    if (meter.stage === 0) { meter.stage = 1; meter.t = 0; tone({ freq: 500, dur: 0.05 }); }
    else { shoot({ x: meter.x + wind, y: meter.y - dropAt(F.drawTime) }); meter.stage = 0; meter.t = 0; }
  };

  const update = (dt, input) => {
    if (!tick(dt) || !layout) return;
    const p = input.pointer, a = layout.area;
    const inside = p.x >= a.x && p.x <= a.x + a.w && p.y >= a.y && p.y <= a.y + a.h;
    if (P.controls === 'meter') { if (p.pressed && inside) tapMeter(); return; }
    if (p.pressed && inside) { ptr = toBase(p.x, p.y); hold = 0; }
    else if (ptr) {
      hold += dt;
      if (p.down || p.released) ptr = toBase(p.x, p.y);
      if (p.released) {
        const pt = impact(ptr, clock, hold);
        ptr = null;
        if (hold >= 0.05) shoot(pt);
      }
    }
  };

  // The computer: press at a spot, hold to full draw, release when the (swaying) crosshair sits on the best target.
  const planAt = (lead = 1) => {
    const nT = Math.ceil((F.drawTime + 0.05) / DT) + 1;
    const tPress = clock + lead * DT, tr = tPress + nT * DT;
    const hz = nT * DT;
    let best = null;
    F.items.forEach((it, i) => {
      const pts = Math.max(...it.bands.map((b) => b.points));
      const c = itemPos(it, tr + F.flight);
      if (c.x < -FW / 2 + 0.05 || c.x > FW / 2 - 0.05) return;
      const cand = { i, pts, c, edge: Math.abs(c.x) };
      if (!best || cand.pts > best.pts || (cand.pts === best.pts && cand.edge < best.edge)) best = cand;
    });
    if (!best) return { nT, tr, base: { x: 0, y: FH / 2 } };
    const sw = sway(tr), dr = dropAt(hz);
    return { nT, tr, base: { x: best.c.x - sw.x - wind, y: best.c.y - sw.y + dr } };
  };

  // The computer presses, holds to full draw and releases when the (swaying) crosshair sits on the best target.
  // It works on logical values, so it runs even before the first render (store screenshots).
  const attract = (dt) => {
    if (!tick(dt)) { ai = null; return; }
    if (P.controls === 'meter') {
      if (!ai) {
        let best = null;
        F.items.forEach((it) => { const c = itemPos(it, clock + 1); const pts = Math.max(...it.bands.map((b) => b.points)); if (!best || pts > best.pts) best = { pts, c }; });
        ai = { tx: best.c.x - wind, ty: best.c.y + dropAt(F.drawTime) };
      }
      if (meter.stage === 0 && Math.abs(meter.x - ai.tx) < 0.02 && meter.t > 0.2) tapMeter();
      else if (meter.stage === 1 && Math.abs(meter.y - ai.ty) < 0.02 && meter.t > 0.2) { tapMeter(); ai = null; }
      return;
    }
    if (!ai) { const pl = planAt(0); ai = { n: 0, nT: pl.nT, base: pl.base }; hold = 0; }
    ai.n++;
    ptr = { x: ai.base.x, y: ai.base.y };
    if (ai.n > 1) hold += dt;
    if (ai.n === ai.nT + 1) { const pt = impact(ai.base, clock, hold); ptr = null; ai = null; shoot(pt); }
  };

  const render = (g, area) => {
    const { ctx } = g;
    const bar = 36, s = Math.min(area.w / FW, (area.h - bar) / FH);
    const rect = { x: area.x + (area.w - FW * s) / 2, y: area.y + (area.h - bar - FH * s) / 2, w: FW * s, h: FH * s };
    layout = { area, s, rect };
    const sx = (x) => rect.x + (x + FW / 2) * s, sy = (y) => rect.y + rect.h - y * s;
    ctx.fillStyle = LK.surround; ctx.fillRect(area.x, area.y, area.w, area.h);
    const grd = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    grd.addColorStop(0, LK.skyTop); grd.addColorStop(1, LK.skyLow);
    ctx.fillStyle = grd; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = LK.hills; ctx.beginPath(); ctx.moveTo(rect.x, sy(0.18));
    for (let i = 0; i <= 24; i++) { const x = rect.x + (rect.w * i) / 24; ctx.lineTo(x, sy(0.18 + 0.09 * Math.sin(i * 0.9) + 0.05 * Math.sin(i * 2.1))); }
    ctx.lineTo(rect.x + rect.w, rect.y + rect.h); ctx.lineTo(rect.x, rect.y + rect.h); ctx.fill();
    ctx.fillStyle = LK.lane; ctx.fillRect(rect.x, sy(0.08), rect.w, 0.08 * s);
    ctx.save(); ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
    F.items.forEach((it, i) => {
      const c = itemPos(it, clock), cx = sx(c.x), cy = sy(c.y);
      const maxR = it.bands[it.bands.length - 1].r;
      if (it.hang) { ctx.strokeStyle = LK.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, rect.y); ctx.lineTo(cx, cy - maxR * s); ctx.stroke(); }
      else if (it.post !== false) { ctx.strokeStyle = LK.post; ctx.lineWidth = Math.max(3, s * 0.03); ctx.beginPath(); ctx.moveTo(cx, cy + maxR * s * 0.6); ctx.lineTo(cx, sy(0.05)); ctx.stroke(); }
      [...it.bands].reverse().forEach((b, k, arr) => {
        ctx.fillStyle = LK.ringColors[(arr.length - 1 - k) % LK.ringColors.length];
        ctx.beginPath(); ctx.arc(cx, cy, b.r * s, 0, 6.3); ctx.fill();
        ctx.strokeStyle = LK.line; ctx.lineWidth = 1.5; ctx.stroke();
      });
      const first = it.bands[0];
      if (first.r * s > 9) g.label(ctx, first.points, cx, cy, Math.min(first.r * s * 1.2, 24), LK.line, 'center', '800');
    });
    for (const st of stuck) {
      let x = st.x, y = st.y;
      if (st.rel) { const c = itemPos(F.items[st.rel.who], clock); x = c.x + st.rel.dx; y = c.y + st.rel.dy; }
      ctx.fillStyle = LK.dart; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(sx(x), sy(y), Math.max(3.5, 0.018 * s), 0, 6.3); ctx.fill(); ctx.stroke();
    }
    for (const sh of shots) if (!sh.done) {
      const u = clamp(sh.t / F.flight, 0, 1), px = sx(sh.x), py = sy(sh.y), r = 14 * (1 - u) + 3;
      ctx.strokeStyle = LK.dart; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py, r, 0, 6.3); ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = LK.edge; ctx.lineWidth = 4; ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    // crosshair at the true impact point
    let cross = null, drawLevel = 0;
    if (P.controls === 'meter') cross = meter.stage === 0 ? { x: meter.x + wind, y: FH * 0.5 } : { x: meter.x + wind, y: meter.y - dropAt(F.drawTime) };
    else if (ptr) { drawLevel = eff(hold); cross = impact(ptr, clock, hold); }
    if (cross && host.canThrow() && pending === 0 && layout) {
      const c = { x: sx(cross.x), y: sy(cross.y) }, r = 18;
      ctx.strokeStyle = LK.guide; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, 6.3); ctx.moveTo(c.x - r * 1.6, c.y); ctx.lineTo(c.x - r * 0.4, c.y); ctx.moveTo(c.x + r * 0.4, c.y); ctx.lineTo(c.x + r * 1.6, c.y);
      ctx.moveTo(c.x, c.y - r * 1.6); ctx.lineTo(c.x, c.y - r * 0.4); ctx.moveTo(c.x, c.y + r * 0.4); ctx.lineTo(c.x, c.y + r * 1.6); ctx.stroke();
      if (ptr && F.drawTime > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(area.x + 14, area.y + 14, 120, 14);
        ctx.fillStyle = drawLevel >= 1 ? LK.good : LK.guide; ctx.fillRect(area.x + 14, area.y + 14, 120 * drawLevel, 14);
        g.label(ctx, drawLevel >= 1 ? 'Full draw: release' : 'Drawing', area.x + 144, area.y + 21, g.px(16), LK.hudText, 'left', '600');
      }
    }
    if (P.controls === 'meter' && host.canThrow()) g.label(ctx, meter.stage === 0 ? 'Tap to set across' : 'Tap to set height and shoot', area.x + area.w / 2, area.y + 16, g.px(20), LK.hudText);
    for (const f of floats) { const px = sx(f.x), py = sy(f.y); ctx.globalAlpha = 1 - f.t / 1.4; g.label(ctx, f.text, px, py - 22 - f.t * 30, g.px(30), LK.float, 'center', '800'); ctx.globalAlpha = 1; }
    // HUD
    const hy = area.y + area.h - bar / 2;
    const left = host.throwsLeft(), total = P.rounds.throws;
    for (let i = 0; i < total; i++) { ctx.fillStyle = i < left ? LK.guide : 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(area.x + 18 + i * 20, hy, 7, 0, 6.3); ctx.fill(); }
    if (F.wind > 0) {
      const cx = area.x + area.w - 60, m = wind / F.wind;
      g.label(ctx, 'Wind', cx - 38, hy, g.px(18), LK.hudText, 'right', '600');
      ctx.strokeStyle = LK.hudText; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - m * 22, hy); ctx.lineTo(cx + m * 22, hy); ctx.stroke();
      ctx.fillStyle = LK.hudText; ctx.beginPath(); ctx.arc(cx + m * 22, hy, 5, 0, 6.3); ctx.fill();
    }
  };

  const testPlan = () => {
    if (!layout) return null;
    const pl = planAt(1);
    const sc = toScreen(pl.base.x, pl.base.y);
    return { x: sc.x, y: sc.y + LIFT, hold: pl.nT };
  };

  return {
    reset, update, attract, render,
    busy: () => pending > 0,
    endGain: () => 0,
    point(id) {
      if (!layout) return null;
      if (id === 'tap') return { x: layout.area.x + layout.area.w / 2, y: layout.area.y + layout.area.h / 2 };
      if (id === 'aim') return testPlan();
      return null;
    },
    hint: () => (P.controls === 'meter' ? 'Tap to stop the sweep across, then tap again to set the height.' : 'Press to draw, watch the crosshair drift with your hand, and release when it sits on the target.'),
    state: () => ({ clock: Math.round(clock * 100) / 100, wind: Math.round(wind * 100) / 100, pending, stuck: stuck.map((s) => [Math.round(s.x * 100) / 100, Math.round(s.y * 100) / 100, s.points]) }),
  };
}

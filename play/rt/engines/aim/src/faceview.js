// Face view (mode "fire"): looking at the targets from the shooter's position. Aim by dragging; the crosshair shows the
// true point of impact (hand sway, wind and drop included); release to shoot. Targets may swing or sweep across.
// Rendering: a receding ground plane, parallax scenery, 3D target discs with posts and shadows, a projectile that
// flies a visible arc and shrinks with distance, wind pennants and shatter / ripple effects on every hit.
import { DT } from './lane.js';
import { drawBackdrop, windFlag, createFx, palFor, inferSetting, mix, dark, light, alpha, vgrad, hgrad, poly, rrect, clamp, hash } from './scenery.js';

const hyp = Math.hypot;
const TAU = Math.PI * 2;
const LIFT = 70;

export function createFace(P, env, host) {
  const F = P.face, LK = P.look, PR = P.projectile, rng = env.rng;
  const FW = F.w, FH = F.h, M = 0.35;
  const setting = inferSetting(P, env.text?.title);
  const pal = palFor(setting, {});
  const fx = createFx(env);
  let clock = 0, wind = 0, hold = 0, ptr = null, shots = [], stuck = [], floats = [], layout = null, ai = null, planCache = null, pending = 0;
  let hits = [];
  const meter = { stage: 0, t: 0, x: 0, y: 0 };
  const tone = (o) => env.audio?.tone?.(o);

  const reset = () => { clock = 0; wind = F.wind > 0 ? rng.range(-F.wind, F.wind) : 0; hold = 0; ptr = null; shots = []; stuck = []; floats = []; ai = null; planCache = null; pending = 0; meter.stage = 0; meter.t = 0; hits = []; fx.reset(); };

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
    fx.sfx(0.02, { freq: 1500, to: 500, dur: 0.1, type: 'triangle', vol: 0.08 });
  };

  // tick: clock, resolution of arrows in flight and meters. Returns true when a new shot may be aimed.
  const tick = (dt) => {
    clock += dt;
    fx.update(dt);
    for (const f of floats) f.t += dt;
    floats = floats.filter((f) => f.t < 1.4);
    hits = hits.filter((h) => { h.t += dt; return h.t < 1.2; });
    for (const sh of shots) {
      sh.t += dt;
      if (!sh.done && clock >= sh.at) {
        sh.done = true;
        const r = score(sh, clock);
        let rel = null;
        if (r.who >= 0) { const c = itemPos(F.items[r.who], clock); rel = { who: r.who, dx: sh.x - c.x, dy: sh.y - c.y }; }
        stuck.push({ x: sh.x, y: sh.y, rel, points: r.points });
        floats.push({ x: sh.x, y: sh.y, text: r.points ? `+${r.points}` : 'miss', t: 0 });
        if (r.points) {
          hits.push({ who: r.who, t: 0, amp: 0.12 + 0.03 * r.points, dx: sh.x - itemPos(F.items[r.who], clock).x });
          tone({ freq: 520 + r.points * 60, to: 880, dur: 0.15, type: 'triangle', vol: 0.4 });
          fx.sfx(0, { freq: 130, to: 70, dur: 0.12, type: 'sine', vol: 0.5 });   // the thump of the hit
          fx.sfx(0.06, { freq: 1100 + r.points * 120, dur: 0.14, type: 'sine', vol: 0.18 });
          if (layout) {
            const p = toScreen(sh.x, sh.y), it = F.items[r.who], band = it.bands.find((b) => hyp(sh.x - itemPos(it, clock).x, sh.y - itemPos(it, clock).y) <= b.r) ?? it.bands[0];
            const bi = it.bands.indexOf(band), col = LK.ringColors[(it.bands.length - 1 - bi + 3 * it.bands.length) % LK.ringColors.length];
            fx.shards(p.x, p.y, layout.s * 0.05, [col, LK.ringColors[0], '#f3ead2'], 9 + r.points * 2);
            fx.ring(p.x, p.y, layout.s * 0.14, layout.s * 0.14, 'rgba(255,255,255,0.85)', 0.55, 3);
            fx.ring(p.x, p.y, layout.s * 0.26, layout.s * 0.26, alpha('#ffe27a', 0.7), 0.8, 2);
            fx.kick(2 + r.points);
          }
        } else {
          tone({ freq: 200, dur: 0.1, type: 'sawtooth', vol: 0.2 });
          fx.sfx(0, { freq: 90, to: 60, dur: 0.1, type: 'sine', vol: 0.3 });
          if (layout) { const p = toScreen(sh.x, sh.y); fx.dust(p.x, p.y, layout.s * 0.05, 'rgba(240,230,210,0.7)', 5); fx.kick(1.5); }
        }
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

  // ---- drawing ---------------------------------------------------------------------------------------------------
  const ellipse = (ctx, x, y, rx, ry) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, TAU); };

  // an arrow, dart or pellet along direction ang at scale k
  const drawMissile = (ctx, x, y, ang, len, col, arrow) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.lineCap = 'round';
    if (arrow) {
      ctx.strokeStyle = dark(col, 0.2); ctx.lineWidth = Math.max(1.5, len * 0.07); ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(len * 0.6, 0); ctx.stroke();
      ctx.fillStyle = '#d6d6d6'; poly(ctx, [[len * 0.55, -len * 0.1], [len * 0.55, len * 0.1], [len, 0]]); ctx.fill();
      ctx.fillStyle = '#e8453a'; poly(ctx, [[-len, 0], [-len * 0.8, -len * 0.18], [-len * 0.55, 0], [-len * 0.8, len * 0.18]]); ctx.fill();
    } else {
      ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.5, len * 0.1); ctx.beginPath(); ctx.moveTo(-len * 0.8, 0); ctx.lineTo(len * 0.8, 0); ctx.stroke();
      ctx.fillStyle = '#e8453a'; ctx.beginPath(); ctx.ellipse(-len * 0.8, 0, len * 0.28, len * 0.14, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
  };

  const render = (g, area) => {
    const { ctx } = g;
    const bar = 36;
    const s = Math.min(area.w / FW, (area.h - bar) * 0.74 / FH);
    const rect = { x: area.x + (area.w - FW * s) / 2, y: area.y + (area.h - bar - FH * s) * 0.5, w: FW * s, h: FH * s };
    layout = { area, s, rect };
    const sx = (x) => rect.x + (x + FW / 2) * s, sy = (y) => rect.y + rect.h - y * s;
    const baseY = sy(0.06);                                   // where posts stand: a fixed distance down the range
    const hz = baseY - area.h * 0.1;                          // horizon
    const cx = area.x + area.w / 2;
    const bottom = area.y + area.h - bar;
    const off = fx.offset();
    ctx.save();
    ctx.beginPath(); ctx.rect(area.x, area.y, area.w, area.h); ctx.clip();
    ctx.translate(off.x, off.y);
    // parallax: the far scenery slides against the aim point
    const aimX = ptr ? clamp(ptr.x / (FW / 2), -1, 1) : P.controls === 'meter' ? clamp(meter.x / (FW / 2), -1, 1) : 0;
    const P2 = { ...pal, skyTop: LK.skyTop && LK.skyTop !== '#7fb4d9' ? LK.skyTop : pal.skyTop, skyLow: LK.skyLow && LK.skyLow !== '#dbe9f1' ? LK.skyLow : pal.skyLow };
    drawBackdrop(ctx, setting, { x: area.x - 20, y: area.y, w: area.w + 40, h: area.h }, hz, P2, clock, -aimX * area.w * 0.035);
    // ground plane: lighter at the horizon, receding stripes and converging seams
    const gnd = LK.lane && setting === 'range' ? LK.lane : pal.ground;
    ctx.fillStyle = vgrad(ctx, hz, bottom, [[0, mix(gnd, P2.skyLow, 0.5)], [0.3, gnd], [1, dark(gnd, 0.4)]]);
    ctx.fillRect(area.x - 20, hz, area.w + 40, bottom - hz + 40);
    for (let i = 0; i < 9; i++) {
      const u = Math.pow((i + 1) / 9, 1.9), y0 = hz + (bottom - hz) * u, y1 = hz + (bottom - hz) * Math.pow((i + 1.5) / 9, 1.9);
      if (i % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(area.x - 20, y0, area.w + 40, y1 - y0); }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let j = -8; j <= 8; j++) { ctx.moveTo(cx + j * 8, hz); ctx.lineTo(cx + j * area.w * 0.16, bottom + 40); }
    ctx.stroke();
    // pennants along the range tell the wind
    const wmax = F.wind;
    if (wmax > 0) {
      windFlag(ctx, area.x + area.w * 0.07, baseY + 6, area.h * 0.2, wind, wmax, clock, '#d8453a');
      windFlag(ctx, area.x + area.w * 0.93, baseY + 6, area.h * 0.2, wind, wmax, clock, '#2d6bb0');
    }
    // targets
    F.items.forEach((it, i) => {
      const c = itemPos(it, clock);
      let cxp = sx(c.x), cyp = sy(c.y);
      const maxR = it.bands[it.bands.length - 1].r, R = maxR * s;
      // swing: a hit sets the target rocking
      const h = hits.find((q) => q.who === i);
      const wob = h ? h.amp * Math.sin(h.t * 22) * Math.exp(-h.t * 4.2) : 0;
      const hang = it.hang ? 1 : 0;
      // ground shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ellipse(ctx, cxp + R * 0.2, baseY + 3, R * 0.9, R * 0.16); ctx.fill();
      ctx.save();
      if (hang) {
        const pivotY = rect.y, ang = wob + Math.sin(clock * 1.3 + i) * 0.02;
        ctx.strokeStyle = LK.line; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cxp, pivotY); ctx.lineTo(cxp, cyp - R); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cxp - 1, pivotY); ctx.lineTo(cxp - 1, cyp - R); ctx.stroke();
        ctx.translate(cxp, cyp - R); ctx.rotate(ang); ctx.translate(-cxp, -(cyp - R));
      } else if (it.post !== false) {
        const postW = Math.max(4, s * 0.045);
        ctx.fillStyle = hgrad(ctx, cxp - postW, cxp + postW, [[0, light(LK.post, 0.3)], [0.5, LK.post], [1, dark(LK.post, 0.4)]]);
        ctx.fillRect(cxp - postW / 2, cyp + R * 0.5, postW, baseY - cyp - R * 0.5);
        ctx.translate(cxp, baseY); ctx.rotate(wob * 0.5); ctx.translate(-cxp, -baseY);
      }
      // disc thickness, then the face with bevelled bands and a sheen
      ctx.fillStyle = dark(LK.ringColors[0], 0.55); ctx.beginPath(); ctx.arc(cxp + R * 0.05, cyp + R * 0.06, R * 1.02, 0, TAU); ctx.fill();
      [...it.bands].reverse().forEach((b, k, arr) => {
        const col = LK.ringColors[(arr.length - 1 - k) % LK.ringColors.length], rr = b.r * s;
        const gr = ctx.createRadialGradient(cxp - rr * 0.35, cyp - rr * 0.35, rr * 0.1, cxp, cyp, rr);
        gr.addColorStop(0, light(col, 0.28)); gr.addColorStop(0.7, col); gr.addColorStop(1, dark(col, 0.25));
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cxp, cyp, rr, 0, TAU); ctx.fill();
        ctx.strokeStyle = LK.line; ctx.lineWidth = 1.5; ctx.stroke();
      });
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(cxp - R * 0.3, cyp - R * 0.4, R * 0.5, R * 0.2, -0.6, 0, TAU); ctx.fill();
      const first = it.bands[0];
      if (first.r * s > 9) g.label(ctx, first.points, cxp, cyp, Math.min(first.r * s * 1.2, 24), LK.line, 'center', '800');
      // a flash on the face right after a hit
      if (h && h.t < 0.25) { ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - h.t / 0.25)})`; ctx.beginPath(); ctx.arc(cxp, cyp, R, 0, TAU); ctx.fill(); }
      // stuck darts ride on the target
      for (const st of stuck) {
        if (!st.rel || st.rel.who !== i) continue;
        const px = cxp + st.rel.dx * s, py = cyp - st.rel.dy * s;
        drawMissile(ctx, px - 6, py - 5, -2.4, Math.max(8, s * 0.07), LK.dart, PR.look === 'arrow');
      }
      ctx.restore();
    });
    // misses stick in the ground or fall behind
    for (const st of stuck) {
      if (st.rel) continue;
      const px = sx(st.x), py = sy(st.y);
      ctx.fillStyle = alpha(LK.dart, 0.55); ctx.beginPath(); ctx.arc(px, py, Math.max(2.5, s * 0.02), 0, TAU); ctx.fill();
    }
    // projectiles in flight: a visible arc, shrinking toward the target, with a fading trail
    for (const sh of shots) if (!sh.done) {
      const u = clamp(sh.t / F.flight, 0, 1);
      const tx = sx(sh.x), ty = sy(sh.y);
      const x0 = cx + (tx - cx) * 0.25, y0 = bottom - 6;
      const lift = Math.sin(Math.PI * u) * (s * 0.35 + Math.hypot(tx - x0, ty - y0) * 0.12);
      const px = x0 + (tx - x0) * u, py = y0 + (ty - y0) * u - lift;
      const k = 1.1 - 0.75 * u;
      for (let i = 1; i <= 6; i++) {
        const uu = Math.max(0, u - i * 0.035), l2 = Math.sin(Math.PI * uu) * (s * 0.35 + Math.hypot(tx - x0, ty - y0) * 0.12);
        const qx = x0 + (tx - x0) * uu, qy = y0 + (ty - y0) * uu - l2;
        ctx.fillStyle = `rgba(255,245,200,${0.5 * (1 - i / 7)})`; ctx.beginPath(); ctx.arc(qx, qy, Math.max(1, 5 * k * (1 - i / 8)), 0, TAU); ctx.fill();
      }
      const u2 = Math.min(1, u + 0.03), l3 = Math.sin(Math.PI * u2) * (s * 0.35 + Math.hypot(tx - x0, ty - y0) * 0.12);
      const ang = Math.atan2((y0 + (ty - y0) * u2 - l3) - py, (x0 + (tx - x0) * u2) - px);
      drawMissile(ctx, px, py, ang, Math.max(7, s * 0.11 * k), LK.dart, PR.look === 'arrow');
      // its shadow runs along the ground
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ellipse(ctx, x0 + (tx - x0) * u, baseY + (bottom - baseY) * (1 - u) * 0.5, 7 * k, 2.5 * k); ctx.fill();
    }
    // the shooter's weapon in the foreground
    {
      const bx = cx + area.w * 0.28, by = bottom + 6;
      if (PR.look === 'arrow') {
        ctx.strokeStyle = '#5a3a1c'; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx - area.w * 0.22, by + 10); ctx.quadraticCurveTo(cx - area.w * 0.36, bottom - area.h * 0.12, cx - area.w * 0.2, bottom - area.h * 0.28); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx - area.w * 0.2, bottom - area.h * 0.28); ctx.lineTo(cx - area.w * 0.22, by + 10); ctx.stroke();
      } else {
        ctx.fillStyle = hgrad(ctx, bx - 14, bx + 14, [[0, '#9a6a34'], [0.5, '#6a4420'], [1, '#2a1a0c']]);
        poly(ctx, [[bx - 11, by + 30], [bx + 11, by + 30], [bx + 5, bottom - area.h * 0.17], [bx - 5, bottom - area.h * 0.17]]); ctx.fill();
        ctx.fillStyle = '#d8c8a0'; ctx.beginPath(); ctx.ellipse(bx, bottom - area.h * 0.17, 5.5, 2.5, 0, 0, TAU); ctx.fill();
      }
      ctx.lineCap = 'butt';
    }
    // crosshair at the true impact point
    let cross = null, drawLevel = 0;
    if (P.controls === 'meter') cross = meter.stage === 0 ? { x: meter.x + wind, y: FH * 0.5 } : { x: meter.x + wind, y: meter.y - dropAt(F.drawTime) };
    else if (ptr) { drawLevel = eff(hold); cross = impact(ptr, clock, hold); }
    if (cross && host.canThrow() && pending === 0 && layout) {
      const c = { x: sx(cross.x), y: sy(cross.y) }, r = 17 + (1 - drawLevel) * 9;
      // where the hand actually points, joined by a thin line to the true impact
      if (ptr) { const b = { x: sx(ptr.x), y: sy(ptr.y) }; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.stroke(); ctx.setLineDash([]); ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, TAU); ctx.stroke(); }
      const col = drawLevel >= 1 ? LK.good : LK.guide;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 5.5; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, TAU); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, TAU); ctx.moveTo(c.x - r * 1.7, c.y); ctx.lineTo(c.x - r * 0.45, c.y); ctx.moveTo(c.x + r * 0.45, c.y); ctx.lineTo(c.x + r * 1.7, c.y);
      ctx.moveTo(c.x, c.y - r * 1.7); ctx.lineTo(c.x, c.y - r * 0.45); ctx.moveTo(c.x, c.y + r * 0.45); ctx.lineTo(c.x, c.y + r * 1.7); ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(c.x, c.y, 2.5, 0, TAU); ctx.fill();
      if (ptr && F.drawTime > 0) {
        rrect(ctx, area.x + 14, area.y + 14, 126, 16, 8); ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill();
        if (drawLevel > 0.02) { rrect(ctx, area.x + 14, area.y + 14, Math.max(12, 126 * drawLevel), 16, 8); ctx.fillStyle = drawLevel >= 1 ? LK.good : LK.guide; ctx.fill(); }
        g.label(ctx, drawLevel >= 1 ? 'Full draw: release' : 'Drawing', area.x + 150, area.y + 22, g.px(16), LK.hudText, 'left', '600');
      }
    }
    if (P.controls === 'meter' && host.canThrow()) g.label(ctx, meter.stage === 0 ? 'Tap to set across' : 'Tap to set height and shoot', area.x + area.w / 2, area.y + 16, g.px(20), LK.hudText);
    fx.draw(ctx);
    for (const f of floats) { const px = sx(f.x), py = sy(f.y); const k = f.t / 1.4; ctx.globalAlpha = 1 - k * k; g.label(ctx, f.text, px, py - 22 - f.t * 30, g.px(30 * (1 + 0.4 * Math.max(0, 1 - f.t * 6))), LK.float, 'center', '800'); ctx.globalAlpha = 1; }
    ctx.restore();
    // HUD
    const hy = area.y + area.h - bar / 2;
    const left = host.throwsLeft(), total = P.rounds.throws;
    for (let i = 0; i < total; i++) { ctx.fillStyle = i < left ? LK.guide : 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(area.x + 18 + i * 20, hy, 7, 0, TAU); ctx.fill(); }
    if (F.wind > 0) {
      const wx = area.x + area.w - 60, m = wind / F.wind;
      g.label(ctx, 'Wind', wx - 38, hy, g.px(16), LK.hudText, 'right', '600');
      ctx.strokeStyle = LK.hudText; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(wx - m * 22, hy); ctx.lineTo(wx + m * 22, hy); ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = LK.hudText; ctx.beginPath(); ctx.arc(wx + m * 22, hy, 5, 0, TAU); ctx.fill();
    }
    void hash;
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

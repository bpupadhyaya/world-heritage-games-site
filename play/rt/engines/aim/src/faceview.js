// Face view (mode "fire"): looking at the targets from the shooter's position. Aim by dragging; the crosshair shows the
// true point of impact (hand sway, wind and drop included); release to shoot. Targets may swing or sweep across.
// Rendering: a receding ground plane, parallax scenery, 3D target discs with posts and shadows, a projectile that
// flies a visible arc and shrinks with distance, wind pennants and shatter / ripple effects on every hit.
import { DT } from './lane.js';
import { faceSceneId, createFaceScene } from './scenes.js';
import { courtExtras } from './halls.js';
import { drawPerson, actorFrame, drawSprite, groundShadow, FIG_UNIT } from './figureplay.js';
import { haze, vignette, makeStaticCache, drawBystander, drawFaceProp } from './finish.js';
import { drawBall, hoopBack, hoopMid, hoopFront, riderBehind, screenDraw, landingRing, drawHand, drawBoot, pip } from './props.js';
import { SOUND } from './sound.js';
import { backdrop as drawBackdrop, floorFace } from './halls.js';
import { windFlag, createFx, palFor, inferSetting, mix, dark, light, alpha, vgrad, hgrad, poly, rrect, clamp, hash } from './scenery.js';

const hyp = Math.hypot;
const TAU = Math.PI * 2;
const LIFT = 70;

export function createFace(P, env, host) {
  const F = P.face, LK = P.look, PR = P.projectile, rng = env.rng;
  const FW = F.w, FH = F.h, M = 0.35;
  const setting = inferSetting(P, env.text?.title);
  const pal = palFor(setting, {});
  const fx = createFx(env);
  const SC = createFaceScene(faceSceneId(P, env.text?.title), P, env, fx);
  let clock = 0, wind = 0, hold = 0, ptr = null, shots = [], stuck = [], floats = [], layout = null, ai = null, planCache = null, pending = 0;
  let hits = [], balls = [], lastShotAt = -9, origin = null;
  const staticLayer = makeStaticCache();
  const isBall = PR.look === 'ball' && !SC;
  const aimerKind = F.aimer ?? 'crosshair';
  const FIGS = env.figs && LK.figures === 'view3d' ? env.figs : null;   // 1.8.0 baked 3D people
  const BALL = F.ball ?? 0.055, GRAV = 4.2;
  const kindOf = (it) => it.kind ?? 'disc';
  const meter = { stage: 0, t: 0, x: 0, y: 0 };
  const tone = (o) => env.audio?.tone?.(o);

  const reset = () => { clock = 0; wind = F.wind > 0 ? rng.range(-F.wind, F.wind) : 0; hold = 0; ptr = null; shots = []; stuck = []; floats = []; ai = null; planCache = null; pending = 0; meter.stage = 0; meter.t = 0; hits = []; balls = []; lastShotAt = -9; origin = null; fx.reset(); SC?.reset(); };

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
  const panelBox = (it) => { const w = it.w ?? 0.9, h = it.h ?? 1.3, top = it.y + 0.3 * h; return { w, h, top, bottom: Math.max(top - h, 0.08) }; };
  // what a shot at point pt earns: { points, who, eff } where eff names the visible outcome for hoops and screens
  const score = (pt, t) => {
    let best = 0, who = -1, eff = null, near = -1, nearD = 9, nearEff = null;
    F.items.forEach((it, i) => {
      const c = itemPos(it, t), d = hyp(pt.x - c.x, pt.y - c.y), k = kindOf(it);
      let got = 0;
      for (const b of it.bands) if (d <= b.r) { got = b.points; break; }
      if (got > best) { best = got; who = i; eff = k === 'hoop' ? (d > it.bands[it.bands.length - 1].r * 0.72 ? 'rattle' : 'swish') : k === 'goalscreen' ? 'hole' : null; }
      else if (!got) {
        const outer = it.bands[it.bands.length - 1].r;
        if (k === 'hoop' && d <= outer * 1.45 && d < nearD) { near = i; nearD = d; nearEff = 'rim'; }
        if (k === 'goalscreen') {
          const pb = panelBox(it), hw2 = pb.w / 2;
          if (Math.abs(pt.x - c.x) <= hw2 && pt.y <= pb.top && pt.y >= pb.bottom && d < nearD) { near = i; nearD = d; nearEff = 'panel'; }
        }
      }
    });
    if (who < 0 && near >= 0) {
      who = near; eff = nearEff;
      if (nearEff === 'panel') best = F.items[near].panelPoints ?? 1;
    }
    return { points: best, who, eff };
  };

  const toBase = (sx, sy) => ({ x: (sx - layout.rect.x) / layout.s - FW / 2, y: (layout.rect.y + layout.rect.h - (sy - LIFT)) / layout.s });
  const toScreen = (x, y) => ({ x: layout.rect.x + (x + FW / 2) * layout.s, y: layout.rect.y + layout.rect.h - y * layout.s });

  const shoot = (pt) => {
    const spread = F.spread > 0 ? { x: rng.range(-F.spread, F.spread), y: rng.range(-F.spread, F.spread) } : { x: 0, y: 0 };
    shots.push({ t: 0, x: pt.x + spread.x, y: pt.y + spread.y, at: clock + F.flight, o: origin, spin: (isBall ? 8 + (shots.length % 3) : 0) * (pt.x < 0 ? -1 : 1) });
    lastShotAt = clock;
    pending++;
    host.thrown();
    planCache = null;
    if (SC) SC.onShoot(tone, fx);
    else if (isBall) SOUND.ballShoot(env.audio, aimerKind);
    else { tone({ freq: 700, to: 300, dur: 0.12, type: 'sawtooth', vol: 0.3 }); fx.sfx(0.02, { freq: 1500, to: 500, dur: 0.1, type: 'triangle', vol: 0.08 }); }
  };

  // ---- balls after the shot: through the net, off the rim, into the silk, or on past the target -------------------------
  const spawn = (o) => { balls.push({ x: 0, y: 0, vx: 0, vy: 0, k: 1, dk: 0, spin: 0, vs: 6, t: 0, life: 1.9, layer: 'top', gy: 0.06, bounces: 0, kind: 'free', ...o }); if (balls.length > 12) balls.shift(); };
  const stepBall = (b, dt) => {
    b.t += dt; b.spin += b.vs * dt; b.k = Math.max(0.3, b.k + b.dk * dt);
    if (b.kind === 'pouch') { const st = Math.min(1, b.t / 0.35); b.y = b.y0 - b.drop * (1 - (1 - st) * (1 - st)); b.k = 1 - 0.2 * st; return; }
    if (b.kind === 'through' && b.netBottom !== undefined && b.y > b.netBottom) { b.vy = Math.max(b.vy, -1.0 - b.t * 0.6); b.vx += (b.cx - b.x) * 10 * dt; b.vx *= 1 - 3 * dt; }
    b.vy -= GRAV * dt; b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.y < b.gy) {
      b.y = b.gy;
      if (Math.abs(b.vy) > 0.35 && b.bounces < 4) { b.vy = -b.vy * 0.52; b.vx *= 0.75; b.bounces++; b.vs *= 0.7; if (b.bounces <= 2) SOUND.ballBounce(env.audio, Math.min(1, Math.abs(b.vy))); }
      else { b.vy = 0; b.vx *= 1 - 3 * dt; b.vs *= 1 - 2 * dt; }
    }
  };
  const resolveBall = (sh, r) => {
    const it = r.who >= 0 ? F.items[r.who] : null, kind = it ? kindOf(it) : 'disc';
    const c = it ? itemPos(it, clock) : { x: sh.x, y: sh.y };
    const dx = sh.x - c.x, dy = sh.y - c.y, d = hyp(dx, dy) || 1e-6;
    const spinD = sh.spin >= 0 ? 1 : -1, outer = it ? it.bands[it.bands.length - 1].r : 0.1;
    if (it && kind === 'hoop' && r.points) {
      hits.push({ who: r.who, t: 0, amp: r.eff === 'rattle' ? 0.05 : 0.025, dx, kind: r.eff });
      if (it.style === 'held') spawn({ kind: 'pouch', x: c.x, y: sh.y, y0: sh.y, drop: outer * 0.9, layer: 'mid', life: 1.1, vs: 3 * spinD, gy: 0 });
      else spawn({ kind: 'through', x: sh.x, y: sh.y, cx: c.x, vx: (c.x - sh.x) * 1.3, vy: -0.3, layer: 'mid', vs: 5 * spinD, netBottom: c.y - outer * (it.style === 'basket' ? 1.2 : 1.45), life: 2.2 });
      if (r.eff === 'rattle') SOUND.ballRattle(env.audio, r.points); else SOUND.ballSwish(env.audio, r.points);
      if (layout) { const p = toScreen(c.x, c.y); fx.sparks(p.x, p.y, layout.s * 0.025, '#ffe9a8', 7); fx.ring(p.x, p.y + layout.s * 0.02, outer * layout.s * 1.0, outer * layout.s * 0.3, 'rgba(255,255,255,0.7)', 0.6, 2.5); fx.kick(1.5); }
    } else if (it && kind === 'goalscreen' && r.eff === 'hole') {
      hits.push({ who: r.who, t: 0, amp: 0.05, dx, kind: 'hole' });
      spawn({ kind: 'free', x: sh.x, y: sh.y, vx: dx * 0.5, vy: 0.05, dk: -0.25, vs: 4 * spinD, layer: 'mid', gy: 0.14, life: 1.8 });
      SOUND.ballHole(env.audio, r.points);
      if (layout) { const p = toScreen(c.x, c.y); fx.sparks(p.x, p.y, layout.s * 0.03, '#ffe27a', 10); fx.ring(p.x, p.y, outer * layout.s * 1.3, outer * layout.s * 1.3, alpha('#ffe27a', 0.8), 0.7, 3); fx.kick(2); }
    } else if (it && kind === 'goalscreen' && r.eff === 'panel') {
      hits.push({ who: r.who, t: 0, amp: 0.06, dx, kind: 'panel' });
      spawn({ kind: 'free', x: sh.x, y: sh.y, vx: dx * 0.7 + 0.05 * spinD, vy: 0.5, vs: 5 * spinD, layer: 'top', gy: -0.05, life: 1.9 });
      SOUND.ballPanel(env.audio);
      if (layout) fx.kick(1.5);
    } else if (it && kind === 'hoop' && r.eff === 'rim') {
      hits.push({ who: r.who, t: 0, amp: 0.09, dx, kind: 'rim' });
      spawn({ kind: 'free', x: sh.x, y: sh.y, vx: (dx / d) * 0.75 + 0.15 * (dx >= 0 ? 1 : -1), vy: 1.1, dk: 0.18, vs: 9 * spinD, layer: 'top', gy: -0.22, life: 2.0 });
      SOUND.ballRim(env.audio);
      if (layout) { const p = toScreen(sh.x, sh.y); fx.sparks(p.x, p.y, layout.s * 0.02, '#fff4cf', 6); fx.kick(2); }
    } else if (it && r.points) {
      hits.push({ who: r.who, t: 0, amp: 0.1, dx, kind: 'hit' });
      spawn({ kind: 'free', x: sh.x, y: sh.y, vx: dx * 0.6, vy: 0.6, vs: 6 * spinD, layer: 'top', gy: -0.05, life: 1.8 });
      SOUND.ballThud(env.audio, r.points);
      if (layout) fx.kick(2);
    } else {
      spawn({ kind: 'free', x: sh.x, y: sh.y, vx: 0.08 * spinD, vy: 0.15, dk: -0.35, vs: 5 * spinD, layer: 'pre', gy: 0.16, life: 1.6 });
      SOUND.ballMiss(env.audio);
    }
  };

  // tick: clock, resolution of arrows in flight and meters. Returns true when a new shot may be aimed.
  const tick = (dt) => {
    clock += dt;
    fx.update(dt);
    SC?.tickHit?.(dt);
    for (const f of floats) f.t += dt;
    floats = floats.filter((f) => f.t < 1.4);
    hits = hits.filter((h) => { h.t += dt; return h.t < 1.6; });
    for (const b of balls) stepBall(b, dt);
    balls = balls.filter((b) => b.t < b.life);
    for (const sh of shots) {
      sh.t += dt;
      if (!sh.done && clock >= sh.at) {
        sh.done = true;
        const r = score(sh, clock);
        let rel = null;
        if (r.who >= 0) { const c = itemPos(F.items[r.who], clock); rel = { who: r.who, dx: sh.x - c.x, dy: sh.y - c.y }; }
        stuck.push({ x: sh.x, y: sh.y, rel, points: r.points });
        floats.push({ x: sh.x, y: sh.y, text: r.points ? `+${r.points}` : 'miss', t: 0 });
        if (isBall) resolveBall(sh, r);
        else if (SC && layout) { const pp = toScreen(sh.x, sh.y); if (r.points) hits.push({ who: r.who, t: 0, amp: 0.12 + 0.03 * r.points, dx: sh.x - itemPos(F.items[r.who], clock).x }); SC.onResolve({ points: r.points, p: pp, x: sh.x, y: sh.y, tone, fxs: fx, s: layout.s }); }
        else if (r.points) {
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
  const ell2 = (ctx, x, y, rx, ry) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, TAU); };
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
    const wideF = area.w > area.h * 1.15;
    const s0 = Math.min(area.w / FW, (area.h - bar) * 0.74 / FH), zm = wideF ? (LK.zoomWide ?? 1) : (LK.zoom ?? 1);
    // 1.6.0 zoom: bigger targets, but never so big that a target leaves the screen
    let s = s0 * zm; 
    if (zm !== 1) {
      let mx = 0, top = 0;
      for (const it of F.items) {
        const kd = kindOf(it), ext = it.bands[it.bands.length - 1].r;
        const wx = kd === 'goalscreen' ? (it.w ?? 0.9) / 2 + 0.1 : kd === 'hoop' ? ext * 1.6 + 0.08 : ext + 0.08;
        mx = Math.max(mx, Math.abs(it.x) + wx + (it.scroll ? 9 : 0) + (it.rail?.ax ?? 0));
        top = Math.max(top, it.y + (kd === 'goalscreen' ? 0.3 * (it.h ?? 1.3) + 0.22 : kd === 'hoop' ? (it.style === 'pole' ? 0.2 : 0.28) : ext + 0.08) + (it.rail?.ay ?? 0));
      }
      if (mx < 3) s = Math.min(s, area.w / (2 * mx));
      if (top > FH / 2) s = Math.min(s, ((area.h - bar) / 2 - 34) / (top - FH / 2));
      s = Math.max(s, s0);
    }
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
    if (SC?.bob) ctx.translate(0, Math.sin(clock * 9.5) * 2.2 + Math.sin(clock * 4.1) * 1.2);
    // parallax: the far scenery slides against the aim point
    const aimX = ptr ? clamp(ptr.x / (FW / 2), -1, 1) : P.controls === 'meter' ? clamp(meter.x / (FW / 2), -1, 1) : 0;
    const P2 = { ...pal, skyTop: LK.skyTop && LK.skyTop !== '#7fb4d9' ? LK.skyTop : pal.skyTop, skyLow: LK.skyLow && LK.skyLow !== '#dbe9f1' ? LK.skyLow : pal.skyLow };
    const SCc = { A: area, hz, bottom, baseY, cx, t: clock, aimX, s, rect, LK, F, sx, sy };
    // 1.6.0: on a finished scene with static targets the backdrop and floor are painted once into an offscreen layer
    const paintStatic = (ctx, pan0, clock) => {
    if (SC) SC.backdrop(ctx, SCc);
    else drawBackdrop(ctx, setting, { x: area.x - 20, y: area.y, w: area.w + 40, h: area.h }, hz, P2, clock, -aimX * area.w * 0.035 * (pan0 === null ? 1 : 0), LK);
    if (!SC && LK.finish && setting === 'court') courtExtras(ctx, area.x - 20, area.w + 40, area.y, hz - area.y, hz, 0, pan0 === null ? clock : 0);
    // ground plane: lighter at the horizon, receding stripes and converging seams
    const gnd = LK.lane && setting === 'range' ? LK.lane : pal.ground;
    if (!SC && (setting === 'sports-hall' || setting === 'playground')) floorFace(ctx, setting, area, hz, bottom, baseY, cx, pal, LK, F.items.map((it) => sx(itemPos(it, clock).x)), s, clock);
    else if (!SC) {
    ctx.fillStyle = vgrad(ctx, hz, bottom, [[0, mix(gnd, P2.skyLow, 0.5)], [0.3, gnd], [1, dark(gnd, 0.4)]]);
    ctx.fillRect(area.x - 20, hz, area.w + 40, bottom - hz + 40);
    for (let i = 0; i < 9; i++) {
      const u = Math.pow((i + 1) / 9, 1.9), y0 = hz + (bottom - hz) * u, y1 = hz + (bottom - hz) * Math.pow((i + 1.5) / 9, 1.9);
      if (i % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(area.x - 20, y0, area.w + 40, y1 - y0); }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let j = -8; j <= 8; j++) { ctx.moveTo(cx + j * 8, hz); ctx.lineTo(cx + j * area.w * 0.16, bottom + 40); }
    ctx.stroke();
    }
    for (const b of LK.bystanders ?? []) { if (!(FIGS && drawPerson(ctx, FIGS, b, b.front ? 180 : 0, sx(b.x), baseY + (b.y ?? 0) * s, s * (LK.figuresScale ?? 0.5), 0, hash))) drawBystander(ctx, { x: sx(b.x), y: baseY + (b.y ?? 0) * s, s: s * 0.42 }, b, 0); }
    for (const q of LK.faceProps ?? []) drawFaceProp(ctx, q, sx(q.x), q.sky ? sy(q.y) : baseY + (q.y ?? 0) * s, s, pan0 === null ? clock : 0);   // 1.7.0 props on the ground line or in the sky   // 1.6.0 people on the ground line (x in face units, y = depth offset)
    };
    const cacheOk = !!LK.finish && LK.cache !== false && !SC && !F.items.some((it) => it.scroll || it.rail);
    const layer = cacheOk ? staticLayer(ctx, area, (c2) => paintStatic(c2, 0, 0), `${s}`) : null;
    if (layer) ctx.drawImage(layer, area.x - 20, area.y, area.w + 40, area.h); else paintStatic(ctx, null, clock);
    // pennants along the range tell the wind
    const wmax = F.wind;
    if (wmax > 0 && !SC) {
      windFlag(ctx, area.x + area.w * 0.07, baseY + 6, area.h * 0.2, wind, wmax, clock, '#d8453a');
      windFlag(ctx, area.x + area.w * 0.93, baseY + 6, area.h * 0.2, wind, wmax, clock, '#2d6bb0');
    }
    // balls that went on past the target are behind everything
    const ballPx = (b) => ({ x: sx(b.x), y: sy(b.y), r: Math.max(3, s * BALL * b.k) });
    const drawBalls = (layer) => {
      for (const b of balls) {
        if (b.layer !== layer) continue;
        const q = ballPx(b), gyS = sy(b.gy), fade = clamp((b.life - b.t) / 0.4, 0, 1), hgt = Math.max(0, gyS - q.y);
        ctx.globalAlpha = fade;
        if (b.kind !== 'pouch' && hgt >= 0) { ctx.fillStyle = `rgba(0,0,0,${clamp(0.3 - hgt / (area.h * 2.2), 0.05, 0.3)})`; ell2(ctx, q.x + hgt * 0.04, gyS + 2, q.r * (1 - Math.min(0.4, hgt / area.h)), q.r * 0.3); ctx.fill(); }
        drawBall(ctx, q.x, q.y, q.r, { color: PR.color, pattern: PR.pattern, rot: b.spin });
        ctx.globalAlpha = 1;
      }
    };
    if (!SC) drawBalls('pre');
    const frontQ = [];
    const lastHit = (i) => { for (let k = hits.length - 1; k >= 0; k--) if (hits[k].who === i) return hits[k]; return null; };
    // targets
    F.items.forEach((it, i) => {
      const c = itemPos(it, clock);
      let cxp = sx(c.x), cyp = sy(c.y);
      const maxR = it.bands[it.bands.length - 1].r, R = maxR * s;
      // swing: a hit sets the target rocking
      const h = hits.find((q) => q.who === i);
      const wob = h ? h.amp * Math.sin(h.t * 22) * Math.exp(-h.t * 4.2) : 0;
      const hang = it.hang ? 1 : 0;
      const kd = kindOf(it);
      if (kd !== 'disc' && !SC) {
        const hh2 = lastHit(i);
        const fxs = hh2 ? { kind: hh2.kind, t: hh2.t } : null;
        const wob2 = hh2 && (hh2.kind === 'rim' || hh2.kind === 'hit') ? hh2.amp * Math.sin(hh2.t * 24) * Math.exp(-hh2.t * 4.5) : 0;
        const col = it.color ?? (kd === 'hoop' ? (it.style === 'basket' ? LK.ringColors[1] ?? '#2d6bb0' : it.style === 'held' ? '#c9964f' : '#e8632b') : '#c8322b');
        const Gm = { cx: cxp, cy: cyp, R, baseY, s, t: clock };
        const Sm = { style: it.style ?? 'pole', color: col, wob: wob2, fx: fxs, w: it.w, h: it.h, t: clock, shirt: LK.jersey, skin: LK.skin };
        if (kd === 'hoop') {
          if (Sm.style === 'held') riderBehind(ctx, Gm, Sm);
          hoopBack(ctx, Gm, Sm);
          hoopMid(ctx, Gm, Sm);
          frontQ.push(() => hoopFront(ctx, Gm, Sm));
        } else {
          const pre = it.post === false;
          void pre;
          frontQ.push(() => screenDraw(ctx, Gm, Sm));
        }
        return;
      }
      if (SC) {
        const hh = hits.find((q) => q.who === i);
        SC.target(ctx, g, SCc, { it, i, pos: { cx: cxp, cy: cyp, R }, wob, h: hh, baseY, stuck: stuck.filter((st) => st.rel && st.rel.who === i) });
        return;
      }
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
    if (!SC) { drawBalls('mid'); for (const q of frontQ) q(); }
    // misses stick in the ground or fall behind
    for (const st of stuck) {
      if (st.rel || SC?.hideMissile || isBall) continue;
      const px = sx(st.x), py = sy(st.y);
      ctx.fillStyle = alpha(LK.dart, 0.55); ctx.beginPath(); ctx.arc(px, py, Math.max(2.5, s * 0.02), 0, TAU); ctx.fill();
    }
    // projectiles in flight: a visible arc, shrinking toward the target, with a fading trail
    for (const sh of shots) if (!sh.done && isBall) {
      // a ball: a high arc from the hand or boot, growing out of the foreground, spinning, with its shadow on the ground
      const u = clamp(sh.t / F.flight, 0, 1), tx = sx(sh.x), ty = sy(sh.y);
      const o = sh.o ?? { x: cx, y: bottom - 6 };
      const peak = (s * 0.45 + Math.hypot(tx - o.x, ty - o.y) * 0.2) * (F.arc ?? 1);
      const at = (uu) => ({ x: o.x + (tx - o.x) * uu, y: o.y + (ty - o.y) * uu - Math.sin(Math.PI * uu) * peak });
      const br = (uu) => Math.max(4, s * BALL * (2.3 - 1.3 * uu));
      const q = at(u), gY = o.y + 10 + (baseY - o.y - 10) * u, h = Math.max(0, gY - q.y);
      ctx.fillStyle = `rgba(0,0,0,${clamp(0.32 - h / (area.h * 2.4), 0.06, 0.32)})`; ell2(ctx, q.x, gY, br(u) * (1 - Math.min(0.45, h / area.h)), br(u) * 0.28); ctx.fill();
      drawBall(ctx, q.x, q.y, br(u), { color: PR.color, pattern: PR.pattern, rot: sh.t * sh.spin });
    }
    for (const sh of shots) if (!sh.done && !SC?.hideMissile && !isBall) {
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
    if (!SC) drawBalls('top');
    let cross = null, drawLevel = 0;
    if (P.controls === 'meter') cross = meter.stage === 0 ? { x: meter.x + wind, y: FH * 0.5 } : { x: meter.x + wind, y: meter.y - dropAt(F.drawTime) };
    else if (ptr) { drawLevel = eff(hold); cross = impact(ptr, clock, hold); }
    if (SC) {
      const aiming = cross && host.canThrow() && pending === 0;
      const live = shots.find((q) => !q.done);
      const flight = live ? { u: clamp(live.t / F.flight, 0, 1), e: Math.min(1, live.t / (F.flight * 0.8)), tx: sx(live.x), ty: sy(live.y) } : null;
      SC.tool(ctx, g, SCc, { cross: aiming ? { x: sx(cross.x), y: sy(cross.y) } : null, ptr: ptr ? { x: sx(ptr.x), y: sy(ptr.y) } : null, drawLevel, flight });
      if (aiming && ptr) { const b = { x: sx(ptr.x), y: sy(ptr.y) }, c2 = { x: sx(cross.x), y: sy(cross.y) }; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(c2.x, c2.y); ctx.stroke(); ctx.setLineDash([]); }
      if (aiming && ptr && F.drawTime > 0) {
        rrect(ctx, area.x + 14, area.y + 14, 126, 16, 8); ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill();
        if (drawLevel > 0.02) { rrect(ctx, area.x + 14, area.y + 14, Math.max(12, 126 * drawLevel), 16, 8); ctx.fillStyle = drawLevel >= 1 ? LK.good : LK.guide; ctx.fill(); }
        g.label(ctx, drawLevel >= 1 ? SC.labels.full : SC.labels.draw, area.x + 150, area.y + 22, g.px(16), LK.hudText, 'left', '600');
      }
    }
    // the shooter's weapon in the foreground (only the legacy darts and arrows; ball sports choose an aimer)
    if (!SC && F.aimer === undefined && !isBall) {
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
    if (!SC && aimerKind === 'crosshair' && cross && host.canThrow() && pending === 0 && layout) {
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
    // a hand or a boot as the cursor: a calm landing ring at the true impact point and the limb that will make the shot
    if (!SC && FIGS && LK.actor && FIGS.actors.size && (aimerKind === 'hand' || aimerKind === 'foot') && layout) {
      // 1.8.0 3D shooter: a real athlete seen from behind at the bottom of the scene (pull = wind-up, release = strike)
      const aimingNow = cross && host.canThrow() && pending === 0;
      const tx = cross ? sx(cross.x) : cx, aimX0 = cx + area.w * ((wideF ? (LK.aimerXWide ?? LK.aimerX) : LK.aimerX) ?? 0), hxp = aimX0 + (tx - aimX0) * (LK.aimerFollow ?? 0.4);
      const res = FIGS.actors.get(0) ?? FIGS.actors.values().next().value, since = clock - lastShotAt;
      const pose = since < 0.5 ? { mode: 'strike', e: since } : ptr && drawLevel > 0.02 ? { mode: 'pull', pw: drawLevel } : { mode: 'idle' };
      const fr = actorFrame(res, pose, clock), hpx = area.h * (wideF ? (LK.actorHeightWide ?? LK.actorHeight ?? 0.34) : (LK.actorHeight ?? 0.34)), k = hpx / (FIG_UNIT * FIGS.ppm);
      const sf = res.strike.frames[Math.min(res.contact, res.strike.frames.length - 1)];
      let fx = hxp, fy = bottom - area.h * 0.012;
      if (aimerKind === 'foot') {
        const sizeP = Math.max(15, area.h * 0.046) * ((wideF ? LK.aimerScaleWide : undefined) ?? LK.aimerScale ?? 1), bx = hxp, by = bottom - area.h * (LK.ballRise ?? 0.3);
        if (sf.mx !== undefined) { fx = bx - (sf.mx - sf.ax) * k; fy = by - (sf.my - sf.ay) * k; }
        const hasBall = !(since < 0.65 || pending > 0);
        groundShadow(ctx, fx + hpx * 0.04, fy, hpx * 0.2, hpx * 0.04);
        drawSprite(ctx, fr, fx, fy, k);
        if (hasBall) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell2(ctx, bx, by + sizeP * 0.7, sizeP * 0.9, sizeP * 0.26); ctx.fill(); drawBall(ctx, bx, by, sizeP * 1.0, { color: PR.color, pattern: PR.pattern, rot: Math.sin(clock * 2) * 0.12 }); }
        origin = { x: bx, y: by - sizeP * 0.3 };
      } else {
        groundShadow(ctx, fx + hpx * 0.04, fy, hpx * 0.2, hpx * 0.04);
        drawSprite(ctx, fr, fx, fy, k);
        origin = sf.mx !== undefined ? { x: fx + (sf.mx - sf.ax) * k, y: fy + (sf.my - sf.ay) * k } : { x: fx, y: fy - hpx * 0.7 };
      }
      if (aimingNow) {
        const c = { x: sx(cross.x), y: sy(cross.y) };
        landingRing(ctx, c.x, c.y, 15 + (1 - drawLevel) * 8, drawLevel >= 1 ? LK.good : LK.guide, clock);
        if (ptr && F.drawTime > 0) {
          rrect(ctx, area.x + 14, area.y + 14, 126, 16, 8); ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill();
          if (drawLevel > 0.02) { rrect(ctx, area.x + 14, area.y + 14, Math.max(12, 126 * drawLevel), 16, 8); ctx.fillStyle = drawLevel >= 1 ? LK.good : LK.guide; ctx.fill(); }
          g.label(ctx, drawLevel >= 1 ? 'Ready: release' : 'Winding up', area.x + 150, area.y + 22, g.px(16), LK.hudText, 'left', '600');
        }
      }
    } else if (!SC && (aimerKind === 'hand' || aimerKind === 'foot') && layout) {
      const aimingNow = cross && host.canThrow() && pending === 0;
      const tx = cross ? sx(cross.x) : cx, aimX0 = cx + area.w * ((wideF ? (LK.aimerXWide ?? LK.aimerX) : LK.aimerX) ?? 0), hxp = aimX0 + (tx - aimX0) * (LK.aimerFollow ?? 0.4), sizeP = Math.max(15, area.h * 0.046) * ((wideF ? LK.aimerScaleWide : undefined) ?? LK.aimerScale ?? 1);
      const since = clock - lastShotAt, kick = since < 0.3 ? since / 0.3 : since < 0.6 ? 1 - (since - 0.3) / 0.3 : 0;
      const ang = cross ? clamp((tx - hxp) / (area.h * 0.9), -0.45, 0.45) : 0;
      const hasBall = !(since < 0.65 || pending > 0);
      const spin = hasBall ? Math.sin(clock * 2) * 0.12 : 0;
      if (aimerKind === 'hand') {
        const hy2 = bottom - area.h * 0.08 - sizeP * 0.4;
        origin = { x: hxp, y: hy2 - sizeP * 0.9 };
        drawHand(ctx, hxp, hy2, sizeP, ang, { skin: LK.skin, sleeve: LK.jersey ?? '#2d6bb0', ball: hasBall, kick: since < 0.65 ? clamp(since / 0.18, 0, 1) * (since > 0.35 ? clamp(1 - (since - 0.35) / 0.3, 0, 1) : 1) : 0, ballColor: PR.color, pattern: PR.pattern, rot: spin });
      } else {
        const fy = bottom - area.h * 0.2;
        origin = { x: hxp, y: fy - sizeP * 0.3 };
        const kk = since < 0.55 ? Math.min(1, since / 0.12) * (since > 0.3 ? clamp(1 - (since - 0.3) / 0.25, 0, 1) : 1) : 0;
        drawBoot(ctx, hxp, fy, sizeP * 1.15, { fancy: !!LK.finish, accent: LK.shoeAccent, sleeve: LK.jersey ?? '#2d6bb0', boot: LK.boot, ball: hasBall, kick: kk, ballColor: PR.color, pattern: PR.pattern, rot: spin });
      }
      if (aimingNow) {
        const c = { x: sx(cross.x), y: sy(cross.y) };
        landingRing(ctx, c.x, c.y, 15 + (1 - drawLevel) * 8, drawLevel >= 1 ? LK.good : LK.guide, clock);
        if (ptr && F.drawTime > 0) {
          rrect(ctx, area.x + 14, area.y + 14, 126, 16, 8); ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill();
          if (drawLevel > 0.02) { rrect(ctx, area.x + 14, area.y + 14, Math.max(12, 126 * drawLevel), 16, 8); ctx.fillStyle = drawLevel >= 1 ? LK.good : LK.guide; ctx.fill(); }
          g.label(ctx, drawLevel >= 1 ? 'Ready: release' : 'Winding up', area.x + 150, area.y + 22, g.px(16), LK.hudText, 'left', '600');
        }
      }
    } else if (!SC && aimerKind === 'crosshair') origin = null;
    if (P.controls === 'meter' && host.canThrow()) g.label(ctx, meter.stage === 0 ? 'Tap to set across' : 'Tap to set height and shoot', area.x + area.w / 2, area.y + 16, g.px(20), LK.hudText);
    if (LK.finish) { const FN = typeof LK.finish === 'object' ? LK.finish : {}; if (FN.haze) haze(ctx, area, hz, P2.skyLow, FN.haze, 0.3); if (FN.vignette !== 0) vignette(ctx, area, FN.vignette ?? 0.3, FN.warm ?? 0.08); }
    fx.draw(ctx);
    for (const f of floats) { const px = sx(f.x), py = sy(f.y); const k = f.t / 1.4; ctx.globalAlpha = 1 - k * k; g.label(ctx, f.text, px, py - 22 - f.t * 30, g.px(30 * (1 + 0.4 * Math.max(0, 1 - f.t * 6))), LK.float, 'center', '800'); ctx.globalAlpha = 1; }
    ctx.restore();
    // HUD
    const hy = area.y + area.h - bar / 2;
    const left = host.throwsLeft(), total = P.rounds.throws;
    for (let i = 0; i < total; i++) { if (SC?.hudIcon) { SC.hudIcon(ctx, area.x + 20 + i * 24, hy, i < left); continue; } if (isBall) { pip(ctx, area.x + 20 + i * 22, hy, 8, { color: PR.color, pattern: PR.pattern }, i >= left); continue; } ctx.fillStyle = i < left ? LK.guide : 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(area.x + 18 + i * 20, hy, 7, 0, TAU); ctx.fill(); }
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
    hint: () => SC?.hint ?? (P.controls === 'meter' ? 'Tap to stop the sweep across, then tap again to set the height.' : 'Press to draw, watch the crosshair drift with your hand, and release when it sits on the target.'),
    state: () => ({ clock: Math.round(clock * 100) / 100, wind: Math.round(wind * 100) / 100, pending, stuck: stuck.map((s) => [Math.round(s.x * 100) / 100, Math.round(s.y * 100) / 100, s.points]) }),
  };
}

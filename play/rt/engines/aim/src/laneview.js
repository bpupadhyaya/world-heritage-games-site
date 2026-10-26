// Lane module: input (drag to aim, or meters), guide, rendering, attract AI. Physics lives in lane.js.
// Rendering is a true perspective view from behind the thrower: the lane recedes to a horizon, objects shrink with
// distance and are foreshortened, scenery sits on parallax layers, and every landing has weight (dust, ripples, shake).
import { createPhysics, railed, DT } from './lane.js';
import { backdrop as drawBackdrop, courtyardBand, floorLinesLane } from './halls.js';
import { drawBall } from './props.js';
import { makeTableLayout, drawTable } from './tableview.js';
import { drawFlag, drawProp, drawArch, drawTubeHoop, drawPeg, drawStriker } from './laneprops.js';
import { drawNet, netGeom } from './net.js';
import { streetBackdrop, streetWorld, streetObjs, streetOpts, drawManhole } from './street.js';
import { SOUND } from './sound.js';
import { drawVenue, VENUE_KINDS } from './venues.js';
import { actorFrame, drawSprite, groundShadow, drawPerson, FIG_UNIT } from './figureplay.js';
import { mowStripes, groundDetail, rakeLines, haze, vignette, drawBystander, drawDecal, makeStaticCache } from './finish.js';
import { windFlag, createFx, palFor, inferSetting, mix, dark, light, alpha, vgrad, hgrad, poly, rrect, clamp, hash } from './scenery.js';

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
  const FIGS = env.figs && LK.figures === 'view3d' ? env.figs : null;   // 1.8.0 baked 3D people (null = vector figures)
  let w = null, layout = null, aim = null, floats = [], flying = null, ai = null, planCache = null, clock = 0;
  const meter = { stage: 0, t: 0, angle: 0, power: 0 };
  const seen = new Map();
  let trail = [];
  const tone = (o) => env.audio?.tone?.(o);
  const TABLE = P.view === 'table';
  let drops = [];
  const STRIKER = TABLE ? 'cue' : LK.striker && LK.striker !== 'none' ? LK.striker : null;
  const swing = { t: 9, from: 0, v: 0 };
  const staticLayer = makeStaticCache();
  const NETS = (L.props ?? []).filter((p) => p.kind === 'net' || p.kind === 'rope');
  let netRip = NETS.map(() => null);

  const reset = () => { w = ph.newWorld(rng); flying = null; aim = null; ai = null; planCache = null; floats = []; meter.stage = 0; meter.t = 0; trail = []; seen.clear(); swing.t = 9; swing.v = 0; drops = []; netRip = NETS.map(() => null); fx.reset(); };

  // ---- perspective camera --------------------------------------------------------------------------------------------
  const makeLayout = (area) => {
    if (TABLE) return makeTableLayout(P, area);
    const bar = 40;
    const wide = area.w > area.h * 1.15;
    let hy = area.y + (area.h - bar) * (wide ? 0.13 : 0.2);
    const yBottom = area.y + area.h - bar - 10;
    const nearY = -(LK.nearPad ?? Math.max(0.9, len * 0.09));   // 1.8.0 nearPad: metres of ground kept below the thrower (room for a 3D figure)
    const back = Math.max(4, len * ((wide ? LK.cameraBackWide : undefined) ?? LK.cameraBack ?? 0.5));
    // 1.7.0 yaw: the camera is turned around the thrower by this many degrees (0 = straight behind the lane), so a lane runs
    // diagonally in a three-quarter view. Street scenes ignore it.
    const yawDeg = setting === 'street' ? 0 : ((wide ? LK.yawWide : undefined) ?? LK.yaw ?? 0);
    const th0 = (yawDeg * Math.PI) / 180, cs = Math.cos(th0), sn = Math.sin(th0);
    // 1.5.0 raised camera: farEdge puts the far wall of the lane at that fraction of the play area (0 = top), so the zones
    // beyond a tall prop get most of the screen; the horizon moves up (it may leave the screen)
    const fe = (wide ? LK.farEdgeWide : undefined) ?? LK.farEdge;
    if (fe !== undefined) { const r = (nearY * cs + back) / ((len + 0.9) * cs + back); hy = (area.y + (area.h - bar) * fe - yBottom * r) / (1 - r); }
    const Kb = (yBottom - hy) * (nearY * cs + back);          // depth v: svy(v) = hy + Kb / (v + back)
    const zoom = wide ? (LK.zoomWide ?? 1) : (LK.zoom ?? 1);   // 1.6.0: >1 crops the lane edges so the figure and the targets are bigger
    const sNear = Math.min(area.w * 0.9 / (L.width + 0.5), (yBottom - hy) * (wide ? 0.34 : 0.18)) * zoom;
    const camH = (yBottom - hy) / sNear;
    const cx = area.x + area.w / 2;
    const svy = (v) => hy + Kb / (Math.max(v, -back + 0.35) + back);
    const scv = (v) => (svy(v) - hy) / camH;                  // pixels per world unit across the lane at depth v
    const fsv = (v) => camH / (Math.max(v, -back + 0.35) + back);   // foreshortening: how much a circle on the ground is squashed
    const sy = (y) => svy(y * cs), sc = (y) => scv(y * cs), fs = (y) => fsv(y * cs);   // y only = along the middle of the lane
    const uMid = (LK.yawCenter ?? 0.45) * len * sn;           // keeps the middle of a yawed lane under the screen centre
    const tr = (x, y, z = 0) => { const u = x * cs + y * sn - uMid, v = y * cs - x * sn, s = scv(v); return { x: cx + u * s, y: svy(v) - z * s * 1.8, s, f: fsv(v) }; };
    const inv = (px, py) => { const v = Kb / Math.max(1, py - hy) - back, u = (px - cx) / scv(v) + uMid; return { x: u * cs - v * sn, y: u * sn + v * cs }; };
    const vFar = (extra = 0.9) => (len + extra) * cs + hw * Math.abs(sn);   // depth of the farthest corner of the far end
    const farBase = (extra = 0.9) => svy(vFar(extra));
    const farSc = (extra = 0.9) => scv(vFar(extra));
    return { area, hy, yBottom, nearY, back, tr, sy, sc, fs, inv, cx, bar, yaw: th0, farBase, farSc,
      d2w: (dx, dy) => { const u = dx, v = -dy; return { x: u * cs - v * sn, y: u * sn + v * cs }; },
      w2d: (x, y) => ({ x: x * cs + y * sn, y: -(y * cs - x * sn) }) };
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
    if (TABLE) {
      const ds = c.bodies.filter((q) => q.kind === 'disc' && q.st === 'ground');
      let tot = 0; for (const q of ds) tot += Math.min(...[[-hw, 0], [hw, 0], [-hw, len], [hw, len]].map(([px, py]) => hyp(q.x - px, q.y - py)));
      return -(ds.length ? tot / ds.length : 0);
    }
    let best = 99;
    const goals = [...(T.rings ?? []).map((r) => (r.around === 'jack' ? c.bodies.find((q) => q.kind === 'jack') : railed(r, c.clock))), ...(T.pots ?? []).map((p) => railed(p, c.clock)), ...(T.pins ?? []).map((p) => p)];
    for (const g of goals) if (g) best = Math.min(best, hyp(b.x - g.x, b.y - g.y));
    for (const bd of T.bands ?? []) best = Math.min(best, (bd.x0 !== undefined || bd.x1 !== undefined ? hyp(b.y - (bd.y0 + bd.y1) / 2, b.x - ((bd.x0 ?? -hw) + (bd.x1 ?? hw)) / 2) : Math.abs(b.y - (bd.y0 + bd.y1) / 2)) * 0.5);
    for (const h of T.hoops ?? []) best = Math.min(best, hyp(b.x - h.x, b.y - h.y));
    if (T.peg) best = Math.min(best, hyp(b.x - T.peg.x, b.y - T.peg.y));
    return -best;
  };
  const computePlan = (offset) => {
    const sx = L.start.x;
    const A = P.attract.angle, na = TABLE ? 9 : 15, np = TABLE ? 8 : 14;
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
    if (P.mode !== 'lob' && ((T.hoops ?? []).length || T.peg)) {
      // aim at every hoop and the peg, stopping a little short of, at and beyond each
      for (const gl of [...(T.hoops ?? []), ...(T.peg ? [T.peg] : [])]) {
        const dx = gl.x - sx, dy = gl.y - L.start.y, d = Math.hypot(dx, dy), ang0 = Math.atan2(dx, dy);
        for (const extra of [0.2, 0.6, 1.2, 2.4, 4]) for (const da of [-0.02, 0, 0.02]) cands.push({ ang: clamp(ang0 + da, -A * 1.4, A * 1.4), power: clamp((d + extra - P.range.min) / (P.range.max - P.range.min), 0, 1) });
      }
    }
    if (TABLE) {
      // ghost-ball aims: strike each disc so that it runs toward a pocket
      const sxs = L.startX === 'free' ? [-hw * 0.55, 0, hw * 0.55] : [sx];
      for (const d of w.bodies.filter((q) => q.kind === 'disc' && q.st === 'ground')) {
        for (const [px, py] of [[-hw, 0], [hw, 0], [-hw, len], [hw, len]]) {
          const ddx = px - d.x, ddy = py - d.y, d2 = hyp(ddx, ddy);
          if (d2 < 0.15) continue;
          const gx = d.x - (ddx / d2) * (d.r + PR.r), gy = d.y - (ddy / d2) * (d.r + PR.r);
          for (const s0 of sxs) {
            const a0 = Math.atan2(gx - s0, gy - L.start.y), d1 = hyp(gx - s0, gy - L.start.y);
            if (Math.abs(a0) > 1.4) continue;
            for (const k of [0.8, 1.4, 2.4]) cands.push({ ang: a0, power: clamp((d1 + d2 * k - P.range.min) / (P.range.max - P.range.min), 0, 1), sx: s0 });
          }
        }
      }
    }
    const score = (c) => { const g = evalThrow(w, c.sx ?? sx, c.ang, c.power, offset); return g * 10 + closeness(w, c.sx ?? sx, c.ang, c.power, offset) * 0.1; };
    for (const c of cands) c.g = score(c);
    cands.sort((a, b) => b.g - a.g);
    let best = cands[0];
    const stepA = (2 * A) / (na - 1), stepP = 0.88 / (np - 1);
    for (const top of cands.slice(0, 3)) {
      for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
        const c = { ang: top.ang + (i * stepA) / 6, power: clamp(top.power + (j * stepP) / 6, 0, 1), sx: top.sx };
        c.g = score(c);
        if (c.g > best.g) best = c;
      }
    }
    return { startX: best.sx ?? sx, ang: best.ang, power: best.power, gain: Math.floor(best.g / 10) };
  };

  // ---- throwing -------------------------------------------------------------------------------------------
  const fire = (sx, dir, power) => {
    if (!host.canThrow()) return;
    const b = ph.launch(w, clamp(sx, -hw + PR.r, hw - PR.r), dir.x, dir.y, power);
    flying = b.thr;
    trail = [];
    host.thrown();
    planCache = null;
    if (STRIKER) { swing.from = swing.v; swing.t = 0; SOUND.strike(env.audio, STRIKER, power); }
    else {
      tone({ freq: 240 + power * 220, to: 150, dur: 0.14, type: 'triangle', vol: 0.45 });
      fx.sfx(0.02, { freq: 900 + power * 600, to: 300, dur: 0.07, type: 'sawtooth', vol: 0.06 }); // whoosh
    }
  };

  // sound for physics events (no positions needed)
  const sfx = (ev) => {
    for (const e of ev.slice(0, 4)) {
      if (e === 'in') { tone({ freq: 660, to: 990, dur: 0.18, type: 'triangle', vol: 0.4 }); fx.sfx(0.08, { freq: 1320, dur: 0.16, type: 'sine', vol: 0.25 }); }
      else if (e === 'splash') { tone({ freq: 320, to: 90, dur: 0.16, type: 'sawtooth', vol: 0.22 }); fx.sfx(0.05, { freq: 700, to: 200, dur: 0.1, type: 'triangle', vol: 0.12 }); }
      else if (e === 'skip') tone({ freq: 520, to: 760, dur: 0.05, type: 'triangle', vol: 0.35 });
      else if (e === 'pin') { tone({ freq: 210, to: 130, dur: 0.1, type: 'square', vol: 0.3 }); fx.sfx(0.05, { freq: 160, to: 110, dur: 0.08, type: 'square', vol: 0.2 }); }
      else if (e === 'hit') { if (TABLE) SOUND.discClack(env.audio); else tone({ freq: 300, to: 220, dur: 0.04, type: 'square', vol: 0.22 }); }
      else if (e === 'pocket') SOUND.pocketDrop(env.audio);
      else if (e === 'rail') SOUND.railKnock(env.audio);
      else if (e === 'land') tone({ freq: 120, to: 60, dur: 0.13, type: 'sine', vol: 0.45 });
      else if (e === 'rim') tone({ freq: 420, to: 300, dur: 0.07, type: 'triangle', vol: 0.3 });
      else if (e === 'hoop') SOUND.hoopRun(env.audio);
      else if (e === 'pegscore') SOUND.pegHit(env.audio);
      else if (e === 'peg' || e === 'post') SOUND.postTock(env.audio);
      else if (e === 'netfault') SOUND.netThud(env.audio);
      else if (e === 'nettape') SOUND.netBrush(env.audio);
    }
  };

  // visual consequences: found by comparing each body with how it was last tick
  const watch = () => {
    if (!layout) return;
    for (const b of w.bodies) {
      const pv = seen.get(b.id);
      const hop = b.fl?.hop ?? 0;
      if (pv) {
        const p = layout.tr(b.x, b.y), f = p.f, s = p.s;
        if (b.kind === 'proj') {
          if (pv.st === 'fly' && b.st === 'ground') { fx.dust(p.x, p.y, s * 0.12); fx.ring(p.x, p.y, s * 0.5, s * 0.5 * f, 'rgba(255,255,255,0.7)', 0.5, 2.5); fx.kick(3); }
          else if (pv.st !== 'in' && b.st === 'in') { fx.sparks(p.x, p.y, s * 0.16); fx.ring(p.x, p.y, s * 0.7, s * 0.7 * f, alpha('#ffe27a', 0.9), 0.7, 3.5); fx.kick(5); }
          else if (TABLE && pv.st !== 'sunk' && b.st === 'sunk') { const pk = b.pk ?? [0, 0], q = layout.tr(pk[0], pk[1]); drops.push({ x: b.x, y: b.y, px: pk[0], py: pk[1], r: b.r, color: PR.color, t: 0 }); fx.ring(q.x, q.y, layout.k * 0.35, layout.k * 0.35, 'rgba(255,90,70,0.9)', 0.6, 3); fx.kick(2); }
          else if (pv.st !== 'sunk' && b.st === 'sunk') { fx.drops(p.x, p.y, s * 0.2); fx.ring(p.x, p.y, s * 0.7, s * 0.7 * f, 'rgba(235,248,255,0.85)', 0.9, 3); fx.ring(p.x, p.y, s * 1.1, s * 1.1 * f, 'rgba(235,248,255,0.5)', 1.1, 2); }
          else if (pv.st !== 'out' && b.st === 'out') fx.dust(p.x, p.y, s * 0.1, 'rgba(200,190,170,0.6)', 4);
          else if (b.st === 'fly' && hop > pv.hop) { fx.ring(p.x, p.y, s * 0.4, s * 0.4 * f, 'rgba(235,248,255,0.9)', 0.7, 2.5); fx.drops(p.x, p.y, s * 0.12, undefined, 5); }
        } else if (TABLE && b.kind === 'disc' && pv.st !== 'sunk' && b.st === 'sunk') {
          const pk = b.pk ?? [0, 0], q = layout.tr(pk[0], pk[1]);
          drops.push({ x: b.x, y: b.y, px: pk[0], py: pk[1], r: b.r, color: b.color ?? '#e8dcc4', t: 0 });
          fx.sparks(q.x, q.y, layout.k * 0.1, '#ffe27a', 8); fx.ring(q.x, q.y, layout.k * 0.35, layout.k * 0.35, alpha('#ffe27a', 0.9), 0.6, 3); fx.kick(3);
          floats.push({ x: pk[0] * 0.8, y: pk[1] + (pk[1] > 0 ? -0.5 : 0.5), text: `+${b.v}`, t: 0 });
        } else if (b.kind === 'pin' && pv.st === 'stand' && b.st === 'fallen') {
          fx.shards(p.x, p.y - s * 0.2, s * 0.06, [LK.pin, LK.pinEdge, LK.pinDown], 7); fx.dust(p.x, p.y, s * 0.08, 'rgba(230,220,190,0.55)', 3); fx.kick(4);
        }
      }
      if (pv && b.kind === 'proj' && (b.xp ?? 0) > (pv.xp ?? 0)) {
        const g2 = layout.tr(b.x, b.y);
        fx.sparks(g2.x, g2.y - g2.s * 0.3, g2.s * 0.14, '#ffe27a', 9); fx.ring(g2.x, g2.y, g2.s * 0.5, g2.s * 0.5 * g2.f, alpha('#ffe27a', 0.9), 0.7, 3); fx.kick(2);
        floats.push({ x: b.x, y: b.y, text: `+${(b.xp ?? 0) - (pv.xp ?? 0)}`, t: 0 });
      }
      if (b.kind === 'proj' && b.fault && !(pv?.fault) && NETS.length) {
        let bi = 0, bd = 1e9; NETS.forEach((n, i) => { const d = Math.abs(n.y - b.y); if (d < bd) { bd = d; bi = i; } });
        netRip[bi] = { t: 0, x: b.x };
        if (layout) { const q = layout.tr(b.x, NETS[bi].y, 0.4); fx.dust(q.x, q.y, q.s * 0.1, 'rgba(240,240,240,0.5)', 3); fx.kick(2); }
      }
      seen.set(b.id, { st: b.st, hop, xp: b.xp ?? 0, fault: !!b.fault });
    }
  };

  const bank = () => {
    const thr = flying;
    const g = ph.throwGain(w, thr);
    const spots = [];
    for (const b of w.bodies) if (b.kind === 'proj' && b.thr === thr) spots.push(b);
    const b0 = spots[0];
    if (b0 && g > 0) floats.push({ x: b0.x, y: b0.y, text: `+${g}`, t: 0 });
    for (const b of w.bodies) if ((b.kind === 'proj' && (b.st === 'in' || b.st === 'sunk' || b.st === 'out')) || (b.kind === 'disc' && b.st === 'sunk')) b.scored = true;
    if (P.rounds.scoreAt === 'throw') {
      w.bodies = w.bodies.filter((b) => b.kind !== 'proj');
      if (P.rounds.resetPins === 'throw') for (const b of w.bodies) if (b.kind === 'pin') { b.st = 'stand'; b.x = b.x0; b.y = b.y0; b.vx = 0; b.vy = 0; b.fall = -1; }
    } else w.bodies = w.bodies.filter((b) => b.kind !== 'proj' || (b.st === 'ground'));
    flying = null;
    const allDown = ((T.pins ?? []).length && P.rounds.resetPins === 'never' && w.bodies.filter((b) => b.kind === 'pin').every((b) => b.st === 'fallen')) || ((T.discs ?? []).length && w.bodies.filter((b) => b.kind === 'disc').every((b) => b.st === 'sunk'));
    if (g > 0) fx.sfx(0.1, { freq: 880, to: 1320, dur: 0.14, type: 'triangle', vol: 0.25 });
    host.settle(g, { over: !!allDown });
  };

  // ---- update ---------------------------------------------------------------------------------------------
  const tick = (dt) => {
    clock += dt;
    swing.t += dt;
    for (const d of drops) d.t += dt;
    netRip = netRip.map((r) => (r && r.t < 2 ? { ...r, t: r.t + dt } : null));
    drops = drops.filter((d) => d.t < 0.4);
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

  // world x on the thrower's row that sits under screen x (the row is slanted when the camera is yawed)
  const xAtRow = (px) => { if (TABLE || !layout.yaw) return layout.inv(px, layout.sy(L.start.y)).x; let x = 0; for (let i = 0; i < 4; i++) { const c = layout.tr(x, L.start.y); x += (px - c.x) / Math.max(1, c.s * Math.cos(layout.yaw)); } return x; };

  const update = (dt, input) => {
    if (!tick(dt) || !layout) return;
    const p = input.pointer, a = layout.area;
    const inside = p.x >= a.x && p.x <= a.x + a.w && p.y >= a.y && p.y <= a.y + a.h;
    if (P.controls === 'meter') { if (p.pressed && inside) tapMeter(); return; }
    if (p.pressed && inside) {
      aim = { ax: p.x, ay: p.y, cx: p.x, cy: p.y, sx: L.startX === 'free' ? clamp(xAtRow(p.x), -hw + PR.r, hw - PR.r) : L.start.x };
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
    const p = layout.tr(b.x, b.y), f = p.f, s = p.s;
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
    const bsc = layout && layout.area.w > layout.area.h * 1.15 ? (LK.ballScaleWide ?? LK.ballScale ?? 1) : (LK.ballScale ?? 1);
    const cy = p.y - lift - r * 0.45 * bsc, rs = r * (1 + z * 0.15) * bsc;
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
    } else if (look === 'ball' && PR.pattern) {
      drawBall(ctx, p.x, cy, rs, { color: PR.color, pattern: PR.pattern, rot: (spin ?? 0) * 0.35 });
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

  const renderTable = (g, area) => {
    const { ctx } = g, off = fx.offset();
    ctx.save(); ctx.beginPath(); ctx.rect(area.x, area.y, area.w, area.h); ctx.clip(); ctx.translate(off.x, off.y);
    drawTable(ctx, g, { roomCache: staticLayer, P, L: layout, LK, T: P.table, w, area, aim, flying, clock, meter, swing, drops, host, ph, DEAD, MAXPULL, hw, len });
    fx.draw(ctx);
    for (const f of floats) { const c = layout.tr(f.x, f.y); const k = f.t / 1.4; ctx.globalAlpha = 1 - k * k; g.label(ctx, f.text, c.x, c.y - 24 - f.t * 34, g.px(30 * (1 + 0.4 * Math.max(0, 1 - f.t * 6))), LK.float, 'center', '800'); ctx.globalAlpha = 1; }
    if (P.controls === 'meter' && flying === null && host.canThrow()) g.label(ctx, meter.stage === 0 ? 'Tap to set the angle' : 'Tap to strike', area.x + area.w / 2, area.y + 18, g.px(20), LK.hudText);
    ctx.restore();
    const hyH = area.y + area.h - layout.bar / 2 - 2, left = host.throwsLeft(), total = P.rounds.throws;
    for (let i = 0; i < total; i++) { const x = area.x + 18 + i * 20; ctx.fillStyle = i < left ? PR.color : 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.arc(x, hyH, 7, 0, TAU); ctx.fill(); ctx.strokeStyle = i < left ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5; ctx.stroke(); }
    const rest = w.bodies.filter((b) => b.kind === 'disc' && b.st === 'ground').length;
    g.label(ctx, `${rest} on the board`, area.x + area.w - 14, hyH, g.px(16), LK.hudText, 'right', '600');
  };

  // ---- 1.8.0 3D people: baked sprites blitted into the scene --------------------------------------------------------------
  const yawDeg = () => Math.round(((layout?.yaw ?? 0) * 180) / Math.PI);
  const drawPerson3d = (ctx, q, b) => { const yd = yawDeg(), wide = layout.area.w > layout.area.h * 1.15, m = wide ? (LK.bystanderScaleWide ?? 1) : 1; return drawPerson(ctx, FIGS, m === 1 ? b : { ...b, scale: (b.scale ?? 1) * m }, b.front ? 180 + yd : yd, q.x, q.y, q.s, clock, hash); };
  const drawActor3d = (ctx, th, ball, pose) => {
    const res = FIGS.actors.get(yawDeg()) ?? FIGS.actors.values().next().value;
    if (!res) return false;
    const fsc = (LK.figureScale ?? 1) * (layout.area.w > layout.area.h * 1.15 ? (LK.figureScaleWide ?? 1) : 1), fr = actorFrame(res, pose, clock), k = (th.s * fsc) / FIGS.ppm, sf = res.strike.frames[Math.min(res.contact, res.strike.frames.length - 1)];
    let fx, fy;
    if (res.hasMarker && sf.mx !== undefined) { fx = ball.x - (sf.mx - sf.ax) * k + (LK.actorDx ?? 0) * th.s; fy = ball.y - (sf.my - sf.ay) * k + (LK.actorDy ?? 0) * th.s; }
    else { fx = th.x + (LK.figureSide ?? -1) * th.s * 0.7 * (LK.figureX ?? 1); fy = th.y + th.s * 0.3; }
    groundShadow(ctx, fx + th.s * 0.08, fy, th.s * 0.5 * fsc, th.s * 0.11 * fsc);
    drawSprite(ctx, fr, fx, fy, k);
    return true;
  };

  const render = (g, area) => {
    const { ctx } = g;
    gLabel = (s, x, y, size, col) => g.label(ctx, s, x, y, size, col, 'center', '700');
    layout = makeLayout(area);
    if (!w) return;
    if (TABLE) { renderTable(g, area); return; }
    const { tr, hy, fs } = layout;
    const off = fx.offset();
    ctx.save();
    ctx.beginPath(); ctx.rect(area.x, area.y, area.w, area.h); ctx.clip();
    ctx.translate(off.x, off.y);
    const aimX = aim ? (aim.ai ? aim.dir.x * 0.5 : clamp((aim.cx - aim.ax) / 150, -1, 1)) : 0;
    const pan = -aimX * area.w * 0.03;
    const P2 = { ...pal, skyTop: LK.skyTop && LK.skyTop !== '#7fb4d9' ? LK.skyTop : pal.skyTop, skyLow: LK.skyLow && LK.skyLow !== '#dbe9f1' ? LK.skyLow : pal.skyLow };
    const FIN = LK.finish && typeof LK.finish === 'object' ? LK.finish : LK.finish ? {} : null;
    const overlayBands = T.bandLabels === 'overlay' || (T.bandLabels === undefined && NETS.length > 0);
    const hallSet = setting === 'sports-hall' || setting === 'playground', newSet = hallSet || setting === 'street';
    // everything up to the rings is the same every frame on a venue scene: paint it once into an offscreen layer (1.6.0)
    const paintStatic = (ctx, pan, clock) => {
    if (hy - area.y < 14) { ctx.fillStyle = vgrad(ctx, area.y, area.y + area.h * 0.4, [[0, P2.skyTop], [1, P2.skyLow]]); ctx.fillRect(area.x - 20, area.y, area.w + 40, area.h); }
    else if (setting === 'street') streetBackdrop(ctx, { x: area.x - 20, y: area.y, w: area.w + 40, h: area.h }, hy, P2, clock, pan, LK);
    else drawBackdrop(ctx, setting, { x: area.x - 20, y: area.y, w: area.w + 40, h: area.h }, hy, P2, clock, pan);
    // ground around the lane, with depth bands (mown stripes / flagstones)
    const gnd = newSet ? (LK.ground ?? pal.ground) : pal.ground;
    ctx.fillStyle = vgrad(ctx, hy, area.y + area.h, [[0, mix(gnd, pal.skyLow, 0.45)], [0.35, gnd], [1, dark(gnd, 0.35)]]);
    ctx.fillRect(area.x - 20, hy, area.w + 40, area.y + area.h - hy);
    for (let k = -2; k < len + 6; k += 2) {
      const a = layout.sy(k), b2 = layout.sy(k + 1);
      ctx.fillStyle = 'rgba(255,255,255,0.045)'; ctx.fillRect(area.x - 20, b2, area.w + 40, a - b2);
    }
    // the boundary across the far end of the field: hedge, boards or a low wall by setting
    if (setting === 'street') streetWorld(ctx, layout, { hw, len, LK, pal: P2 });
    else {
      const wy = len + 0.9, base = layout.farBase(0.9), hgt = Math.max(10, layout.farSc(0.9) * (LK.wallHeight ?? 1.4));
      const solid = setting === 'ice' || setting === 'hall' || setting === 'dojo' || setting === 'court' || setting === 'festival' || newSet;
      const hgt2 = Math.max(10, layout.farSc(0.9) * (LK.wallHeight ?? 1.4));
      const cy0 = LK.courtyard ?? (setting === 'sports-hall' ? 'hallwall' : setting === 'playground' ? 'fence' : 'none');
      const venue = VENUE_KINDS.includes(cy0);           // 1.6.0 venues paint the whole band down to the far end of the lane
      const ownWall = cy0 !== 'none' && (!solid || venue);           // a courtyard on an open setting is the whole far boundary
      if (venue) drawVenue(ctx, cy0, { x: area.x - 20, w: area.w + 40 }, area.y, base, P2, LK, clock);
      else if (cy0 !== 'none') courtyardBand(ctx, cy0, { x: area.x - 20, w: area.w + 40 }, hy, ownWall ? base : base - hgt2, pal, LK, clock);
      const col = setting === 'sports-hall' ? (LK.jersey ?? '#2d4a7a') : setting === 'playground' ? '#7c8791' : setting === 'ice' ? '#2c4a78' : setting === 'hall' || setting === 'dojo' ? '#4a2e1c' : setting === 'court' || setting === 'festival' ? '#b8a07a' : setting === 'shore' ? '#c8b890' : pal.mid;
      ctx.fillStyle = vgrad(ctx, base - hgt, base, [[0, light(col, 0.2)], [1, dark(col, 0.3)]]);
      if (solid && !venue) ctx.fillRect(area.x - 20, base - hgt, area.w + 40, hgt);
      else if (!ownWall) {
        ctx.beginPath(); ctx.moveTo(area.x - 20, base);
        for (let x = area.x - 20; x <= area.x + area.w + 20; x += 8) ctx.lineTo(x, base - hgt + Math.sin(x * 0.11) * hgt * 0.15 + Math.sin(x * 0.3) * hgt * 0.07);
        ctx.lineTo(area.x + area.w + 20, base); ctx.closePath(); ctx.fill();
      }
      if (!ownWall) { ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(area.x - 20, base - hgt, area.w + 40, 2); }
      if (solid && !venue) { ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = area.x; x < area.x + area.w; x += Math.max(14, hgt * 1.4)) { ctx.moveTo(x, base - hgt); ctx.lineTo(x, base); } ctx.stroke(); }
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(area.x - 20, base, area.w + 40, 3);
    }
    if (FIN) {
      if (FIN.mow) { mowStripes(ctx, tr, -hw - 14, hw + 14, -3, len + 0.9, FIN.mow, 0.05, 0.06, 1); }
      if (FIN.detail) groundDetail(ctx, tr, FIN.detail, -hw - 8, hw + 8, -2, len + 0.8, FIN.count ?? 140, 11);
    }
    // lane surface
    strip(ctx, -2, len, -hw, hw);
    ctx.fillStyle = vgrad(ctx, layout.farBase(0), layout.sy(-2), [[0, mix(LK.lane, pal.skyLow, 0.28)], [1, dark(LK.lane, 0.12)]]); ctx.fill();
    ctx.save(); strip(ctx, -2, len, -hw, hw); ctx.clip();
    for (let k = -2; k < len; k += 2) { strip(ctx, k, k + 1, -hw, hw); ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill(); }
    if (FIN?.mow && FIN.laneStripes !== false) mowStripes(ctx, tr, -hw, hw, -2, len, FIN.mow, 0.06, 0.07, 0);
    if (FIN?.rake) rakeLines(ctx, tr, hw, -2, len, 14);
    if (FIN?.detail) groundDetail(ctx, tr, FIN.detail, -hw, hw, -2, len, Math.round((FIN.count ?? 140) * 0.8), 29);
    for (const z of P.world.zones ?? []) { strip(ctx, z.y0, z.y1, -hw, hw); ctx.fillStyle = z.mul > 1 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'; ctx.fill(); }
    (T.bands ?? []).forEach((b, i) => {
      const xa = b.x0 ?? -hw, xb = b.x1 ?? hw;
      strip(ctx, b.y0, b.y1, xa, xb); ctx.fillStyle = alpha(b.color ?? ringColors(i), 0.55); ctx.fill();
      ctx.strokeStyle = LK.line; ctx.lineWidth = 2; ctx.stroke();
      if (!overlayBands) {
        const c = tr((xa + xb) / 2, (b.y0 + b.y1) / 2);
        g.label(ctx, b.label ?? b.points, c.x, c.y, clamp(c.s * 0.5, 12, 30), LK.line, 'center', '800');
      }
    });
    if (T.lines?.length) {
      ctx.strokeStyle = T.lineColor ?? LK.line; ctx.lineCap = 'round';
      for (const q of T.lines) { const a = tr(q.x0, q.y0), b2 = tr(q.x1, q.y1); ctx.lineWidth = Math.max(2, (a.s + b2.s) * 0.5 * (q.w ?? 0.05)); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b2.x, b2.y); ctx.stroke(); }
      ctx.lineCap = 'butt';
    }
    for (const h of P.world.hazards ?? []) {
      const c = tr(h.x, h.y), f = c.f;
      const gr = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, h.r * c.s); gr.addColorStop(0, light(LK.hazard, 0.1)); gr.addColorStop(1, dark(LK.hazard, 0.2));
      ctx.fillStyle = gr; ellipse(ctx, c.x, c.y, h.r * c.s, h.r * c.s * f); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
      for (let i = 0; i < 2; i++) { ellipse(ctx, c.x, c.y, h.r * c.s * (0.5 + 0.18 * i + 0.04 * Math.sin(clock * 2 + i)), h.r * c.s * f * (0.5 + 0.18 * i)); ctx.stroke(); }
    }
    ctx.restore();
    for (const p of L.props ?? []) if (p.kind === 'manhole') drawManhole(ctx, tr, fs, p.x, p.y, p.r, p.color);
    for (const b of T.bands ?? []) if (b.cover) { const cv = b.cover === true ? {} : b.cover; drawManhole(ctx, tr, fs, cv.x ?? ((b.x0 ?? -hw) + (b.x1 ?? hw)) / 2, cv.at === 'end' ? b.y1 : b.y0, cv.r, cv.color); }
    if (hallSet && LK.lines !== 'none') floorLinesLane(ctx, tr, setting, hw, len, LK);
    for (const d of LK.decals ?? []) drawDecal(ctx, tr, d);   // 1.7.0 ground decals (static, so they sit in the cached layer)
    };
    const cacheOk = LK.cache !== false && (VENUE_KINDS.includes(LK.courtyard) || setting === 'street' || (FIN && LK.cache === true)) && !(P.world.hazards ?? []).length;
    const layer = cacheOk ? staticLayer(ctx, area, paintStatic) : null;
    if (layer) ctx.drawImage(layer, area.x - 20, area.y, area.w + 40, area.h);
    else paintStatic(ctx, pan, clock);
    // rings (foreshortened discs)
    (T.rings ?? []).forEach((ring) => {
      const cen = ring.around === 'jack' ? w.bodies.find((b) => b.kind === 'jack') : railed(ring, w.clock);
      if (!cen) return;
      const c = tr(cen.x, cen.y), f = c.f;
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
      const pos = railed(p, w.clock), c = tr(pos.x, pos.y), f = c.f, rr = p.r * c.s;
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
      if (p.flag && !p.peg) drawFlag(ctx, c, typeof p.flag === 'string' ? p.flag : LK.guide, clock);
      if (p.points > 1 || p.label) g.label(ctx, p.label ?? p.points, c.x, c.y + (p.flag ? rr * f + 11 : 0) - (p.peg ? c.s * 0.65 : 0), Math.min(Math.max(rr, 8) * 1.2, p.flag ? 14 : 22), LK.potText, 'center', '800');
    }
    // lane edges (low boards with a lit top), foul line, distance marks
    for (const sgn of [-1, 1]) {
      const a = tr(sgn * hw, -2), b = tr(sgn * hw, len), a2 = tr(sgn * hw, -2, 0.18), b2 = tr(sgn * hw, len, 0.18);
      if (setting === 'street') {
        // a painted road edge instead of low boards
        ctx.strokeStyle = alpha(LK.edge, 0.85); ctx.lineWidth = Math.max(2, a.s * 0.05); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        continue;
      }
      ctx.fillStyle = dark(LK.edge, 0.15); poly(ctx, [[a.x, a.y], [b.x, b.y], [b2.x, b2.y], [a2.x, a2.y]]); ctx.fill();
      ctx.strokeStyle = light(LK.edge, 0.4); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a2.x, a2.y); ctx.lineTo(b2.x, b2.y); ctx.stroke();
    }
    const fl0 = tr(-hw, 0), fl1 = tr(hw, 0);
    ctx.strokeStyle = LK.line; ctx.lineWidth = Math.max(2, fl0.s * 0.05); ctx.beginPath(); ctx.moveTo(fl0.x, fl0.y); ctx.lineTo(fl1.x, fl1.y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    if (LK.distanceMarks ?? setting !== 'street') for (let k = 2; k < len; k += 2) {
      const m0 = tr(-hw, k), m1 = tr(-hw + 0.35, k);
      ctx.fillRect(m0.x, m0.y - 1, Math.max(3, m1.x - m0.x), 2);
      if (k % 4 === 0) g.label(ctx, `${k}`, m0.x - clamp(m0.s * 0.28, 7, 14), m0.y, clamp(m0.s * 0.3, 9, 14), 'rgba(255,255,255,0.8)', 'center', '600');
    }
    // props beside the lane: they make distance readable (smaller and higher with depth)
    const bol = LK.bollards ?? (setting === 'street' ? false : true);
    if (bol !== false) for (let k = 1; k < len + 2; k += 3) {
      for (const sgn of [-1, 1]) {
        const c = tr(sgn * (hw + 0.55), k), s = c.s;
        if (setting === 'lawn' || setting === 'generic' || setting === 'village') {
          ctx.fillStyle = dark(pal.mid, 0.15); ctx.beginPath(); ctx.ellipse(c.x, c.y - s * 0.12, s * 0.28, s * 0.2, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = light(pal.mid, 0.2); ctx.beginPath(); ctx.ellipse(c.x - s * 0.06, c.y - s * 0.18, s * 0.18, s * 0.12, 0, 0, TAU); ctx.fill();
        } else if (setting === 'ice' || setting === 'hall' || setting === 'dojo' || setting === 'sports-hall' || setting === 'playground') {
          ctx.fillStyle = typeof bol === 'string' ? bol : '#d8453a'; ctx.fillRect(c.x - s * 0.12, c.y - s * 0.5, s * 0.24, s * 0.5);
          ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(c.x - s * 0.12, c.y - s * 0.5, s * 0.07, s * 0.5);
        } else {
          ctx.fillStyle = '#7a5a34'; ctx.fillRect(c.x - s * 0.05, c.y - s * 0.45, s * 0.1, s * 0.45);
          ctx.fillStyle = light('#7a5a34', 0.3); ctx.beginPath(); ctx.arc(c.x, c.y - s * 0.46, s * 0.09, 0, TAU); ctx.fill();
        }
      }
    }
    // thrower spot and shadow
    const sxNow = aim ? aim.sx : L.start.x, th = tr(sxNow, L.start.y), tf = th.f;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ellipse(ctx, th.x, th.y + 4, th.s * 0.55, th.s * 0.55 * tf); ctx.fill();
    ctx.strokeStyle = LK.thrower; ctx.lineWidth = 2.5; ellipse(ctx, th.x, th.y, th.s * 0.4, th.s * 0.4 * tf); ctx.stroke();
    if (FIN?.haze) haze(ctx, area, hy, P2.skyLow, FIN.haze, 0.34);
    // bodies far to near
    const bs = w.bodies.filter((b) => b.st !== 'out' && b.st !== 'sunk').sort((a, b) => b.y - a.y);
    const drawTrail = () => {
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
    };
    // props, croquet hoops and the peg stand in the scene: everything is drawn far to near so a ball passes through a hoop
    const objs = [];
    for (const p of L.props ?? []) if (p.kind !== 'net' && p.kind !== 'rope' && p.kind !== 'manhole') objs.push({ y: p.y, d: () => drawProp(ctx, p, tr, fs, LK, pal) });
    NETS.forEach((p, i) => objs.push({ y: p.y, d: () => drawNet(ctx, tr, p, netGeom(p, L), netRip[i], clock) }));
    if (setting === 'street') objs.push(...streetObjs(layout, { hw, len, LK, props: L.props }, ctx, clock));
    for (const b of LK.bystanders ?? []) {
      const q = tr(b.x, b.y), hgt = q.s * 1.55 * (b.scale ?? 1);
      if (b.wide === false && layout.area.w > layout.area.h * 1.15) continue;
      if (q.y - hgt < area.y + 4 || q.x < area.x - hgt * 0.3 || q.x > area.x + area.w + hgt * 0.3) continue;   // 1.7.0: a person cropped by the top edge or the sides is not drawn
      objs.push({ y: b.y, d: () => { if (!(FIGS && drawPerson3d(ctx, tr(b.x, b.y), b))) drawBystander(ctx, tr(b.x, b.y), b, clock); } });
    }
    for (const h of T.hoops ?? []) objs.push({ y: h.y, d: () => (LK.hoopStyle === 'tube' ? drawTubeHoop(ctx, tr, h.x, h.y, h.w + 2 * (h.leg ?? 0.025), h.h ?? 0.32, h.color ?? '#f4f4ee', h.leg ?? 0.025, LK.hoopBand ?? '#d8453a') : drawArch(ctx, tr, h.x, h.y, h.w + 2 * (h.leg ?? 0.025), h.h ?? 0.32, h.color ?? '#f4f4ee', h.leg ?? 0.025)) });
    if (T.peg) { const pg = T.peg; objs.push({ y: pg.y, d: () => { const c = tr(pg.x, pg.y); drawPeg(ctx, { ...c }, pg.r ?? 0.05, pg.h ?? 0.55, pg.colors ?? ['#2d6bb0', '#d8453a', '#f2d34a', '#2b2b2b'], clock); } }); }
    if (objs.length) {
      for (const b of bs) objs.push({ y: b.y, proj: b.kind === 'proj', d: () => drawPiece(ctx, b, b.kind === 'proj' ? clock * 8 + b.id : undefined) });
      objs.sort((a, b) => b.y - a.y);
      let trailDone = false;
      for (const o of objs) { if (o.proj && !trailDone) { drawTrail(); trailDone = true; } o.d(); }
      if (!trailDone) drawTrail();
    } else {
      for (const b of bs) { if (b.kind !== 'proj') drawPiece(ctx, b); }
      drawTrail();
      for (const b of bs) { if (b.kind === 'proj') drawPiece(ctx, b, clock * 8 + b.id); }
    }
    if (overlayBands) {
      // scoring numbers drawn over the props so a tall net never hides them
      (T.bands ?? []).forEach((b) => {
        const c = tr(((b.x0 ?? -hw) + (b.x1 ?? hw)) / 2, (b.y0 + b.y1) / 2), sz = clamp(c.s * 0.46, 11, 26), txt = `${b.label ?? b.points}`;
        ctx.font = `800 ${Math.round(sz)}px system-ui, sans-serif`; const tw = ctx.measureText(txt).width + sz * 0.7;
        rrect(ctx, c.x - tw / 2, c.y - sz * 0.62, tw, sz * 1.24, sz * 0.5); ctx.fillStyle = 'rgba(10,14,24,0.5)'; ctx.fill();
        g.label(ctx, txt, c.x, c.y, sz, '#ffffff', 'center', '800');
      });
    }
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
          const c = tr(e.x, e.y), f = c.f, pulse = 1 + 0.12 * Math.sin(clock * 6);
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
    if (STRIKER && LK.figure !== false) {
      const pwNow = aim ? (aim.ai ? aim.power : clamp((hyp(aim.ax - aim.cx, aim.ay - aim.cy) - DEAD) / (MAXPULL - DEAD), 0, 1)) : P.controls === 'meter' && meter.stage === 1 ? meter.power : 0;
      let swv = 0;
      if (swing.t < 0.5) { const q = swing.t; swv = q < 0.1 ? swing.from + (1 - swing.from) * (1 - (1 - q / 0.1) ** 2) : 1 - (q - 0.1) / 0.4; }
      else if (host.canThrow() && flying === null) swv = -pwNow;
      swing.v = swv;
      const pose3 = swing.t < 0.5 ? { mode: 'strike', e: swing.t, from: swing.from } : { mode: pwNow > 0.02 ? 'pull' : 'idle', pw: pwNow };
      if (FIGS && LK.actor && drawActor3d(ctx, th, tr(sxNow, L.start.y, 0.06), pose3)) { /* 3D actor drawn */ } else drawStriker(ctx, th, STRIKER, swv, { scale: (LK.figureScale ?? 1) * (layout.area.w > layout.area.h * 1.15 ? (LK.figureScaleWide ?? 1) : 1), jersey: LK.jersey, skin: LK.skin, wood: LK.mallet && LK.mallet !== '#7a5230' ? LK.mallet : undefined, band: LK.jersey, side: LK.figureSide ?? -1, sideMul: layout.area.w > layout.area.h * 1.15 ? (LK.figureXWide ?? LK.figureX) : LK.figureX, hair: LK.hair, pants: LK.pants, shoes: LK.shoes, hat: LK.hat, hatColor: LK.hatColor, shoeAccent: LK.shoeAccent, hairStyle: LK.hairStyle, t: clock, fancy: !!LK.finish });
    }
    if (P.controls === 'meter' && flying === null && host.canThrow()) {
      guide({ x: Math.sin(meter.angle), y: Math.cos(meter.angle) }, meter.stage === 1 ? meter.power : 0.5, L.start.x);
      const bx = area.x + 14, bh = area.h * 0.45, by = area.y + (area.h - layout.bar) / 2 - bh / 2;
      rrect(ctx, bx, by, 18, bh, 9); ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill();
      const ph2 = bh * (meter.stage === 1 ? meter.power : 0);
      if (ph2 > 2) { rrect(ctx, bx, by + bh - ph2, 18, ph2, 9); ctx.fillStyle = vgrad(ctx, by, by + bh, [[0, '#ff7a4a'], [1, LK.guide]]); ctx.fill(); }
      g.label(ctx, meter.stage === 0 ? 'Tap to set the angle' : 'Tap to throw', area.x + area.w / 2, area.y + 18, g.px(20), LK.hudText);
    }
    if (FIN?.vignette) vignette(ctx, area, FIN.vignette, FIN.warm ?? 0.08);
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
    hint: () => (TABLE ? 'Press, pull the cue back and release: drive the discs into the corner pockets.' : P.controls === 'meter' ? 'Tap once to lock the angle, again to lock the power.' : 'Press, pull back and release: the dotted line shows the direction and strength.'),
    state: () => ({ clock: Math.round(w?.clock * 100) / 100, flying, wind: w ? { x: Math.round(w.wind.x * 100) / 100, y: Math.round(w.wind.y * 100) / 100 } : null,
      bodies: (w?.bodies ?? []).map((b) => [b.kind, b.st, Math.round(b.x * 100) / 100, Math.round(b.y * 100) / 100]) }),
  };
}

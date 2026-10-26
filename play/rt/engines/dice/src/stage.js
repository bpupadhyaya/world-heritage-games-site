// The dice stage: dice state, the cup, the deterministic tumble plan and its drawing.
// Every random choice is drawn from env.rng at the moment of a roll (a fixed number of draws per die); after that the animation is
// a pure function of time, so the outcome (the face on top) never depends on rendering or frame rate.
import { mul, rotAxis, rotZ, restRotation } from './math3.js';
import { drawDie, drawDieShadow, ELEV } from './die.js';
import { drawCup } from './tray.js';

const TAU = Math.PI * 2;
const G = 17;                 // gravity in die half-edges per second squared
const SHAKE = 0.72;           // seconds the cup rattles before the dice leave it
const GATHER = 0.2;           // seconds the dice being thrown again take to hop into the cup
const ZONE = { lo: [0.075, 0.36], hi: [0.925, 0.66] };   // where tumbling dice may land (fractions of the surface)
const RACK_V = 0.885;
const cosE = Math.cos(ELEV), sinE = Math.sin(ELEV);

const fold = (x, lo, hi) => { const r = hi - lo, y = (((x - lo) % (2 * r)) + 2 * r) % (2 * r); return lo + (y < r ? y : 2 * r - y); };
const support = (R, a, r) => (Math.abs(R[6]) + Math.abs(R[7]) + Math.abs(R[8])) * a + r;

// bounce profile for a drop from height h0 (half-edges above resting): list of impacts and a z(t) function
function bounces(h0, e) {
  const segs = []; let t = 0, h = h0, v = 0, first = true;
  let tf = Math.sqrt((2 * h) / G); segs.push({ t0: 0, t1: tf, peak: h, first: true }); t = tf; v = G * tf;
  segs[0].impact = { t, vel: v };
  for (let k = 0; k < 6; k++) {
    v *= e; const hp = (v * v) / (2 * G);
    if (hp < 0.035) break;
    const dur = (2 * v) / G;
    segs.push({ t0: t, t1: t + dur, peak: hp, impact: { t: t + dur, vel: v } }); t += dur;
  }
  return { segs, total: t };
}
const hopAt = (b, t) => {
  if (t >= b.total) return 0;
  for (const s of b.segs) if (t <= s.t1) {
    if (s.first) { const tf = s.t1; return Math.max(0, s.peak * (1 - (t / tf) ** 2)); }
    const u = (t - s.t0) / (s.t1 - s.t0); return Math.max(0, s.peak * 4 * u * (1 - u));
  }
  return 0;
};

export function createStage({ rng, n, events = () => {} }) {
  const dice = [];
  const st = {
    dice, n, t: 0,
    cup: { phase: 'rest', t: 0, shake: 0, tilt: 0, at: { u: 0.885, v: 0.26 }, covering: false },
    flash: [], lastRoll: 0,
    hid: { phase: 'none', t: 0, lift: 0 },
    // which dice are shown inside the tray
  };
  for (let i = 0; i < n; i++) dice.push({ i, v: 1, held: false, shown: false, pos: { u: 0.5, v: 0.5 }, rest: { u: 0.5, v: 0.5 }, yaw: 0, R: restRotation(1, 0), anim: null, slide: null, gather: null, lift: 0, glow: 0, dim: 0, mark: 0, off: { x: 0, y: 0 }, tag: '' });

  const rackPos = (i) => ({ u: (i + 0.5) / n, v: RACK_V });

  st.reset = () => {
    for (const d of dice) { d.shown = false; d.held = false; d.anim = null; d.slide = null; d.gather = null; d.glow = 0; d.dim = 0; }
    st.cup.phase = 'rest'; st.cup.t = 0; st.pending = null; st.cup.covering = false;
    st.hid.phase = 'none'; st.hid.lift = 0; for (const d of dice) { d.off = { x: 0, y: 0 }; d.tag = ''; }
  };
  st.busy = () => st.cup.phase !== 'rest' || st.hid.phase === 'shake' || st.hid.phase === 'slam' || st.hid.phase === 'lifting' || st.hid.phase === 'lowering' || dice.some((d) => d.anim || d.gather);
  st.values = () => dice.map((d) => d.v);
  st.shownAll = () => dice.every((d) => d.shown);

  // Show dice with given values at rest (store screenshots, the title scene, a hidden/revealed cup).
  st.place = (i, v, pos, yaw = 0) => {
    const d = dice[i]; d.v = v; d.yaw = yaw; d.R = restRotation(v, yaw); d.shown = true; d.anim = null; d.slide = null; d.gather = null;
    d.pos = { ...pos }; d.rest = { ...pos };
  };

  // Throw the dice listed in ids (everything else keeps its place). forced = optional values (tests, Mia's hidden roll).
  st.roll = (ids, forced = null, opts = {}) => {
    const k = ids.length;
    const slots = rng.shuffle(Array.from({ length: k }, (_, j) => j));
    const plan = [];
    ids.forEach((id, j) => {
      const d = dice[id];
      const v = forced ? forced[j] : 1 + rng.int(6);
      const yaw = rng.range(-0.75, 0.75);
      const ax = [rng.range(-1, 1), rng.range(-1, 1), rng.range(-0.6, 0.6)];
      const turns = rng.range(1.7, 3.2) * TAU;
      const wall = rng.int(5);
      const e = 0.4 + rng.range(0, 0.1);
      const slow = rng.range(0, 0.08);
      const jitter = [rng.range(-1, 1) * Math.min(0.035, 0.05 / k), rng.range(-0.045, 0.045)];
      const s = slots[j];
      const w = ZONE.hi[0] - ZONE.lo[0], hgt = ZONE.hi[1] - ZONE.lo[1];
      const end = { u: ZONE.lo[0] + w * ((s + 0.5) / Math.max(1, k)) + jitter[0], v: ZONE.lo[1] + hgt * (0.5 + (s % 2 === 0 ? -1 : 1) * (k >= 4 ? 0.3 : 0.2) + (k <= 2 ? 0 : 0)) + jitter[1] };
      if (k === 1) end.v = ZONE.lo[1] + hgt * (0.5 + jitter[1] * 4);
      plan.push({ id, v, yaw, ax, turns, wall, e, slow, end });
    });
    st.pending = { plan, opts, t: 0, stage: 'gather' };
    st.cup.phase = 'shake'; st.cup.t = 0; st.cup.shake = 0;
    for (const p of plan) { const d = dice[p.id]; d.held = false; d.slide = null; d.gather = d.shown ? { t: 0, from: { ...d.pos } } : null; d.anim = null; }
    events('rattle', { n: k, hasGather: plan.some((p) => dice[p.id].gather) });
  };

  const launch = () => {
    const { plan } = st.pending;
    for (const p of plan) {
      const d = dice[p.id];
      const h0 = 1.55 + 0.25 * (p.slow * 10);
      const b = bounces(h0, p.e);
      const T = b.total;
      const R_end = restRotation(p.v, p.yaw);
      const sU = st.cup.at.u - 0.04, sV = st.cup.at.v + 0.1;
      const lo = [ZONE.lo[0] - 0.02, ZONE.lo[1] - 0.04], hi = [ZONE.hi[0] + 0.02, ZONE.hi[1] + 0.02];
      let eu = p.end.u, ev = p.end.v;
      if (p.wall === 1) eu = 2 * hi[0] - p.end.u; else if (p.wall === 2) eu = 2 * lo[0] - p.end.u; else if (p.wall === 3) ev = 2 * lo[1] - p.end.v; else if (p.wall === 4) ev = 2 * hi[1] - p.end.v;
      // wall hit time: where the raw path crosses the wall (easing is 1-(1-x)^2.2)
      const walls = [];
      const ease = (x) => 1 - (1 - x) ** 2.2, inv = (y) => 1 - (1 - y) ** (1 / 2.2);
      const crossAt = (s0, s1, w) => { if ((s1 - s0) === 0) return null; const y = (w - s0) / (s1 - s0); return y > 0 && y < 1 ? inv(y) * T : null; };
      if (p.wall === 1) walls.push(crossAt(sU, eu, hi[0])); if (p.wall === 2) walls.push(crossAt(sU, eu, lo[0]));
      if (p.wall === 3) walls.push(crossAt(sV, ev, lo[1])); if (p.wall === 4) walls.push(crossAt(sV, ev, hi[1]));
      d.anim = { t: 0, T: T + 0.04, b, R_end, ax: p.ax, turns: p.turns, start: { u: sU, v: sV }, raw: { u: eu, v: ev }, lo, hi, ease, walls: walls.filter((x) => x != null), fired: 0, firedWall: 0, h0 };
      d.v = p.v; d.yaw = p.yaw; d.shown = true; d.held = false; d.rest = { ...p.end }; d.pos = { ...p.end };
    }
    st.cup.phase = 'pour'; st.cup.t = 0;
    events('pour', { n: plan.length });
  };

  // ---- Mia-style hidden roll: the dice are shaken in the cup, the cup is slammed down over them, and can be lifted aside ----------
  st.hiddenRoll = (values, yaws = null) => {
    values.forEach((v, i) => {
      const d = dice[i]; d.shown = true; d.held = false; d.anim = null; d.slide = null; d.gather = null; d.v = v;
      const yaw = yaws ? yaws[i] : rng.range(-0.8, 0.8);
      d.yaw = yaw; d.R = restRotation(v, yaw); d.pos = { u: 0.5, v: 0.66 }; d.rest = { ...d.pos }; d.off = { x: (i - (values.length - 1) / 2) * 2.1, y: (i % 2 ? 0.12 : -0.12) };
    });
    st.hid.phase = 'shake'; st.hid.t = 0; st.hid.lift = 0; events('rattle', { n: values.length });
  };
  st.lift = (on) => { if (st.hid.phase === 'none') return; if (on && (st.hid.phase === 'covered' || st.hid.phase === 'lowering')) { st.hid.phase = 'lifting'; st.hid.t = 0; events('lift', {}); } else if (!on && (st.hid.phase === 'open' || st.hid.phase === 'lifting')) { st.hid.phase = 'lowering'; st.hid.t = 0; } };
  st.clearHidden = () => { st.hid.phase = 'none'; for (const d of dice) { d.shown = false; d.off = { x: 0, y: 0 }; } };
  st.revealed = () => st.hid.phase === 'open' || (st.hid.phase === 'lifting' && st.hid.t > 0.18);

  // sweep every die on the tray into the cup (start of the next turn)
  st.collect = () => { for (const d of dice) if (d.shown && !d.anim) { d.gather = { t: 0, from: { ...d.pos } }; d.slide = null; } };

  st.setHeld = (i, held) => {
    const d = dice[i]; if (!d.shown || d.anim) return;
    if (d.held === held) return;
    d.held = held;
    const to = held ? rackPos(i) : d.rest.v < 0.8 ? d.rest : { u: (i + 0.5) / n, v: 0.46 };
    if (!held && d.rest.v >= 0.8) d.rest = { ...to };
    d.slide = { t: 0, T: 0.26, from: { ...d.pos }, to: { ...to } };
    events('slide', { held });
  };
  // set dice aside / bring back without hold semantics (Ten Thousand): same slide, no event differences
  // hint: pulse a ring under these dice for a few seconds
  st.mark = (ids, secs = 3.2) => { for (const d of dice) d.mark = ids.includes(d.i) ? secs : 0; };
  st.hide = (i) => { const d = dice[i]; d.shown = false; d.anim = null; d.slide = null; };

  const sampleAnim = (d) => {
    const a = d.anim, u = Math.min(1, a.t / a.T), tt = Math.min(a.t, a.b.total);
    const e = a.ease(Math.min(1, a.t / a.b.total));
    const ru = a.start.u + (a.raw.u - a.start.u) * e, rv = a.start.v + (a.raw.v - a.start.v) * e;
    d.pos = { u: fold(ru, a.lo[0], a.hi[0]), v: fold(rv, a.lo[1], a.hi[1]) };
    const decay = (1 - Math.min(1, a.t / a.b.total)) ** 1.8;
    d.R = mul(rotAxis(a.ax, a.turns * decay), a.R_end);
    d.lift = hopAt(a.b, tt);
    d.supportR = true; void u;
  };

  st.update = (dt) => {
    st.t += dt;
    const hid = st.hid;
    if (hid.phase !== 'none') {
      hid.t += dt;
      if (hid.phase === 'shake' && hid.t >= 0.95) { hid.phase = 'slam'; hid.t = 0; }
      else if (hid.phase === 'slam' && hid.t >= 0.2) { hid.phase = 'covered'; hid.t = 0; events('slam', {}); }
      else if (hid.phase === 'lifting' && hid.t >= 0.4) { hid.phase = 'open'; hid.t = 0; }
      else if (hid.phase === 'lowering' && hid.t >= 0.3) { hid.phase = 'covered'; hid.t = 0; events('slam', { soft: true }); }
    }
    const cup = st.cup;
    if (cup.phase === 'shake') {
      cup.t += dt;
      if (cup.t >= SHAKE) launch();
    } else if (cup.phase === 'pour') {
      cup.t += dt;
      if (cup.t > 0.5) { cup.phase = 'return'; cup.t = 0; }
    } else if (cup.phase === 'return') { cup.t += dt; if (cup.t > 0.35) { cup.phase = 'rest'; cup.t = 0; st.pending = null; } }
    for (const d of dice) {
      if (d.gather) { d.gather.t += dt; if (d.gather.t >= GATHER) { d.gather = null; d.shown = false; d.held = false; } }
      if (d.anim) {
        const a = d.anim; a.t += dt;
        while (a.fired < a.b.segs.length && a.b.segs[a.fired].impact.t <= a.t) {
          const imp = a.b.segs[a.fired].impact; a.fired++;
          events('knock', { vel: Math.min(1, imp.vel / 8), id: d.i, first: a.fired === 1 });
        }
        while (a.firedWall < a.walls.length && a.walls[a.firedWall] <= a.t) { a.firedWall++; events('wall', { id: d.i }); }
        if (a.t >= a.T) { d.anim = null; d.R = a.R_end; d.pos = { ...d.rest }; d.lift = 0; events('settle', { id: d.i, v: d.v }); } else sampleAnim(d);
      }
      if (d.slide) {
        d.slide.t += dt; const u = Math.min(1, d.slide.t / d.slide.T), e = 1 - (1 - u) ** 3;
        d.pos = { u: d.slide.from.u + (d.slide.to.u - d.slide.from.u) * e, v: d.slide.from.v + (d.slide.to.v - d.slide.from.v) * e };
        d.lift = Math.sin(u * Math.PI) * 0.7;
        if (u >= 1) { d.slide = null; d.lift = 0; events('knock', { vel: 0.35, id: d.i, soft: true }); }
      }
      d.glow += ((d.held ? 1 : 0) - d.glow) * Math.min(1, dt * 10);
      if (d.mark > 0) d.mark = Math.max(0, d.mark - dt);
    }
  };

  // ---- layout + drawing -------------------------------------------------------------------------------------------------
  // surf = { x, y, w, h } of the playing surface (felt) in canvas units
  st.metrics = (surf) => {
    const S = Math.max(14, Math.min(surf.w / (n * 3.4), surf.h * (n <= 2 ? 0.115 : 0.165)));
    st.cup.at.v = Math.max(0.26, (2.62 * S) / surf.h + 0.02);
    return { surf, S, X: (u) => surf.x + u * surf.w, Y: (v) => surf.y + v * surf.h };
  };
  st.diePos = (i, m) => {
    const d = dice[i];
    const lift = d.anim || d.slide ? d.lift : d.held ? 0.18 * d.glow : 0;
    const x = m.X(d.pos.u) + d.off.x * m.S, gy = m.Y(d.pos.v) + d.off.y * m.S;
    const sup = d.anim ? support(d.R, 0.8, 0.2) : 1;
    const z = sup + lift;
    return { x, gy, z, y: gy - z * cosE * m.S, S: m.S };
  };
  st.hit = (px, py, m) => {
    let best = -1, bd = 1e9;
    for (const d of dice) {
      if (!d.shown || d.anim || d.gather) continue;
      const p = st.diePos(d.i, m);
      const dx = px - p.x, dy = py - p.y;
      const r = m.S * 1.45;
      if (Math.abs(dx) <= r && Math.abs(dy) <= r) { const dist = dx * dx + dy * dy; if (dist < bd) { bd = dist; best = d.i; } }
    }
    return best;
  };
  st.cupPose = (m) => {
    const c = st.cup;
    const base = { x: m.X(c.at.u), y: m.Y(c.at.v) };
    let tilt = 0, sx = 0, sy = 0, lift = 0;
    if (c.phase === 'shake') {
      const u = c.t / SHAKE, amp = Math.sin(Math.min(1, u) * Math.PI) ;
      sx = Math.sin(c.t * 46) * m.S * 0.22 * amp; sy = Math.abs(Math.sin(c.t * 23)) * -m.S * 0.45 * amp; tilt = Math.sin(c.t * 46) * 0.12 * amp - 0.08 * amp;
      lift = amp * m.S * 0.6;
    } else if (c.phase === 'pour') {
      const u = Math.min(1, c.t / 0.18); const e = 1 - (1 - u) ** 3;
      tilt = -1.75 * e; sx = -m.S * 0.6 * e; sy = -m.S * 0.3 * e; lift = m.S * 0.4 * e;
      if (c.t > 0.3) { const w = (c.t - 0.3) / 0.2; tilt *= 1 - w * 0.0; }
    } else if (c.phase === 'return') {
      const u = Math.min(1, c.t / 0.35), e = u * u * (3 - 2 * u);
      tilt = -1.75 * (1 - e); sx = -m.S * 0.6 * (1 - e); sy = -m.S * 0.3 * (1 - e); lift = m.S * 0.4 * (1 - e);
    }
    return { x: base.x + sx, y: base.y + sy, tilt, lift, shaking: c.phase === 'shake' };
  };

  st.drawDice = (ctx, m, look, o = {}) => {
    const list = dice.filter((d) => (d.shown || d.gather) && !(st.hid.phase === 'shake')).map((d) => ({ d, p: st.diePos(d.i, m) }));
    // gathering dice hop toward the cup
    for (const it of list) {
      const g = it.d.gather;
      if (g) {
        const u = Math.min(1, g.t / GATHER), e = u * u;
        const tx = m.X(st.cup.at.u), ty = m.Y(st.cup.at.v) - m.S;
        it.p = { ...it.p, x: it.p.x + (tx - it.p.x) * e, gy: it.p.gy + (ty - it.p.gy) * e, y: it.p.y + (ty - it.p.y) * e - Math.sin(u * Math.PI) * m.S * 1.4, z: it.p.z + Math.sin(u * Math.PI) * 1.2, s: 1 - 0.5 * e };
      }
    }
    list.sort((a, b) => a.p.gy - b.p.gy);
    for (const { d, p } of list) {
      const sc = (p.s ?? 1) * (1 + 0.1 * Math.max(0, p.z - 1));
      if (d.glow > 0.02 && !d.anim) {   // brass-gold light under a kept die
        ctx.save(); ctx.translate(p.x, p.gy + m.S * 0.12); ctx.scale(1, sinE * 0.78);
        const gr = ctx.createRadialGradient(0, 0, m.S * 0.2, 0, 0, m.S * 1.7);
        gr.addColorStop(0, `rgba(255,214,110,${0.55 * d.glow})`); gr.addColorStop(1, 'rgba(255,214,110,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, m.S * 1.7, 0, TAU); ctx.fill(); ctx.restore();
      }
      if (d.mark > 0 && !d.anim) {   // hint ring: a soft pulsing sky-blue light under the die
        const pulse = 0.55 + 0.45 * Math.sin(st.t * 6), fade = Math.min(1, d.mark * 2);
        ctx.save(); ctx.translate(p.x, p.gy + m.S * 0.1); ctx.scale(1, sinE * 0.8);
        ctx.lineWidth = m.S * 0.14; ctx.strokeStyle = `rgba(120,200,255,${0.8 * pulse * fade})`; ctx.beginPath(); ctx.arc(0, 0, m.S * (1.45 + 0.1 * pulse), 0, TAU); ctx.stroke(); ctx.restore();
      }
      drawDieShadow(ctx, p.x, p.gy, m.S * (p.s ?? 1), p.z, look.shadow ?? 0.5);
      void sc;
    }
    for (const { d, p } of list) {
      const S = m.S * (p.s ?? 1) * (1 + 0.07 * Math.max(0, p.z - 1));
      const dimmed = o.dim && o.dim(d);
      ctx.save();
      if (dimmed) ctx.globalAlpha = 0.9;
      drawDie(ctx, { x: p.x, y: p.y, S, R: d.R }, d.v === 1 && look.pip1 ? look : look);
      ctx.restore();
      if (d.tag && d.held && !d.anim) {   // a small brass plate under a kept die
        ctx.save(); ctx.font = `800 ${Math.round(m.S * 0.46)}px system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const w = ctx.measureText(d.tag).width + m.S * 0.5, y = p.gy + m.S * 0.72;
        ctx.fillStyle = 'rgba(30,20,8,0.75)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(p.x - w / 2, y - m.S * 0.26, w, m.S * 0.52, m.S * 0.2) : ctx.rect(p.x - w / 2, y - m.S * 0.26, w, m.S * 0.52); ctx.fill();
        ctx.strokeStyle = 'rgba(230,190,100,0.8)'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = '#f0d27a'; ctx.fillText(d.tag, p.x, y + 1); ctx.restore();
      }
    }
  };
  st.drawCup = (ctx, m, look, cupLook) => {
    if (st.hid.phase !== 'none') {
      const h = st.hid, S = m.S, x = m.X(0.5), y = m.Y(0.66) + S * 1.1;
      const ease = (u) => 1 - (1 - Math.min(1, u)) ** 3;
      let o;
      if (h.phase === 'shake') { const sh = Math.sin(h.t * 44); o = { x: x + sh * S * 0.3, y: y - S * 0.2, lift: S * (2.1 + Math.abs(Math.sin(h.t * 22)) * 0.6), tilt: sh * 0.1, shaking: true }; }
      else if (h.phase === 'slam') { const u = h.t / 0.2; o = { x, y, lift: S * 2.4 * (1 - u * u), tilt: 0, inverted: true }; }
      else if (h.phase === 'covered') { const bump = Math.max(0, 1 - h.t / 0.12) * S * 0.12; o = { x, y, lift: bump, tilt: 0, inverted: true }; }
      else if (h.phase === 'lifting') { const e = ease(h.t / 0.4); o = { x: x - e * S * 4.6, y, lift: S * 2.2 * e, tilt: -0.75 * e, inverted: true }; }
      else if (h.phase === 'open') o = { x: x - S * 4.6, y, lift: S * 2.2, tilt: -0.75, inverted: true };
      else { const e = 1 - ease(h.t / 0.3); o = { x: x - e * S * 4.6, y, lift: S * 2.2 * e, tilt: -0.75 * e, inverted: true }; }
      drawCup(ctx, { ...o, h: S * 5.9, t: st.t }, cupLook ?? look.cup ?? {});
      return;
    }
    const pose = st.cupPose(m);
    drawCup(ctx, { x: pose.x, y: pose.y, h: m.S * 2.5, tilt: pose.tilt, lift: pose.lift, shaking: pose.shaking, t: st.t }, cupLook ?? look.cup ?? {});
  };
  st.getState = () => ({ values: dice.map((d) => d.v), held: dice.map((d) => d.held), shown: dice.map((d) => d.shown), cup: st.cup.phase, hid: st.hid.phase, busy: st.busy() });
  return st;
}

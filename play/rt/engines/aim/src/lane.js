// Lane view (looking down at a lane or court, thrower at the foot): modes lob, slide, flick, roll.
// Deterministic fixed-step 2D physics: circles, friction with zones, roll bias, circle-vs-circle impulses, wall bounces.
export const DT = 1 / 60;
const hyp = Math.hypot;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const TAU = Math.PI * 2;

const FLAT = ['net', 'rope', 'manhole'];
export function railed(item, clock) {
  const r = item.rail;
  if (!r) return { x: item.x, y: item.y };
  const a = (clock * TAU) / (r.period || 4) + (r.phase || 0);
  return { x: item.x + (r.ax || 0) * Math.sin(a), y: item.y + (r.ay || 0) * Math.sin(a) };
}

// ---------------------------------------------------------------- physics (pure functions over a plain world object)
export function createPhysics(P) {
  const L = P.lane, W = P.world, T = P.target, PR = P.projectile, R = P.range, S = P.skip;
  const hw = L.width / 2, len = L.length;
  const TABLE = P.view === 'table', pocketR = P.table?.pocketR ?? 0.17;
  const pots = () => T.pots ?? [];
  // static things a rolling piece can hit (1.4.0): solid props, the legs of croquet hoops and the peg
  const hoops = T.hoops ?? [], peg = T.peg ?? null;
  const circles = [], boxes = [];
  for (const p of L.props ?? []) if (p.solid && !FLAT.includes(p.kind)) { if (p.kind === 'box') boxes.push({ x0: p.x - (p.w ?? 0.6) / 2, x1: p.x + (p.w ?? 0.6) / 2, y0: p.y - (p.d ?? 0.4) / 2, y1: p.y + (p.d ?? 0.4) / 2 }); else circles.push({ x: p.x, y: p.y, r: p.r ?? 0.1 }); }
  for (const h of hoops) { const leg = h.leg ?? 0.025; circles.push({ x: h.x - h.w / 2 - leg, y: h.y, r: leg }, { x: h.x + h.w / 2 + leg, y: h.y, r: leg }); }
  if (peg) circles.push({ x: peg.x, y: peg.y, r: peg.r ?? 0.05, peg: true });

  // nets and ropes (1.5.0): a barrier across the lane. A lob lower than `h` where it crosses is a net fault (no score, drops back);
  // a rolling piece bounces off it.
  const nets = (L.props ?? []).filter((p) => p.kind === 'net' || p.kind === 'rope').map((p) => ({ x: p.x ?? 0, y: p.y, w: p.w ?? L.width + 0.8, h: p.h ?? 1, fault: p.fault !== false }));

  const newWorld = (rng) => {
    const w = { clock: 0, nid: 1, throwNo: 0, bodies: [], wind: { x: 0, y: 0 }, trail: null };
    for (const p of T.pins ?? []) w.bodies.push({ id: w.nid++, kind: 'pin', x: p.x, y: p.y, x0: p.x, y0: p.y, vx: 0, vy: 0, r: T.pinR, m: T.pinMass, e: 0.35, st: 'stand', v: p.v, fall: -1 });
    for (const d of T.discs ?? []) w.bodies.push({ id: w.nid++, kind: 'disc', x: d.x, y: d.y, vx: 0, vy: 0, r: d.r ?? 0.07, m: d.mass ?? 0.35, e: 0.82, st: 'ground', v: d.points ?? 1, color: d.color });
    if (T.jack) {
      const j = T.jack, jj = j.jitter ?? {};
      w.bodies.push({ id: w.nid++, kind: 'jack', x: j.x + (jj.x ? rng.range(-jj.x, jj.x) : 0), y: j.y + (jj.y ? rng.range(-jj.y, jj.y) : 0), vx: 0, vy: 0, r: j.r, m: j.mass, e: 0.6, st: 'ground' });
    }
    const wm = W.wind ?? 0;
    if (wm > 0) { w.wind.x = rng.range(-wm, wm); w.wind.y = rng.range(-wm, wm) * 0.4; }
    return w;
  };

  const rate = (power) => clamp(S.rate.max - S.rate.loss * (power - S.rate.sweet) ** 2, 0.2, 0.95);
  const rotate = (dx, dy, a) => ({ x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) });

  const launch = (w, sx, dx0, dy0, power) => {
    const n = hyp(dx0, dy0) || 1, dx = dx0 / n, dy = dy0 / n;
    const d = R.min + clamp(power, 0, 1) * (R.max - R.min);
    const b = { id: w.nid++, kind: 'proj', x: sx, y: L.start.y, vx: 0, vy: 0, r: PR.r, m: PR.mass, e: PR.bounce, st: 'ground', v0: 0, thr: ++w.throwNo, skips: 0, scored: false };
    if (P.mode === 'lob') {
      const Tm = 0.45 + 0.2 * Math.sqrt(d);
      b.st = 'fly';
      b.fl = { t: 0, T: Tm, x0: b.x, y0: b.y, x1: b.x + dx * d + 0.5 * w.wind.x * Tm * Tm, y1: b.y + dy * d + 0.5 * w.wind.y * Tm * Tm, dx, dy, len: d, power, hop: 0 };
    } else {
      const v = Math.sqrt(2 * W.friction * d);
      b.vx = dx * v; b.vy = dy * v; b.v0 = v;
    }
    w.bodies.push(b);
    return b;
  };

  const sink = (b, why) => { b.st = why; };

  const land = (w, b, events) => {
    const f = b.fl;
    b.x = f.x1; b.y = f.y1; b.fl = null;
    events.push('land');
    for (const h of W.hazards ?? []) if (hyp(b.x - h.x, b.y - h.y) < h.r + b.r * 0.4) { events.push('splash'); return sink(b, 'sunk'); }
    if (Math.abs(b.x) > hw + 0.2 || b.y > len + 0.2 || b.y < -3) return sink(b, 'out');
    if (S) {
      const nl = f.len * rate(f.power);
      if (nl >= S.minHop) {
        const dir = rotate(f.dx, f.dy, S.drift * (f.hop % 2 ? -1 : 1) * 0.6 + S.drift * 0.4);
        const Tm = 0.16 + 0.07 * Math.sqrt(nl);
        b.fl = { t: 0, T: Tm, x0: b.x, y0: b.y, x1: b.x + dir.x * nl, y1: b.y + dir.y * nl, dx: dir.x, dy: dir.y, len: nl, power: f.power, hop: f.hop + 1 };
        b.st = 'fly'; b.skips++; events.push('skip');
        return undefined;
      }
      return sink(b, 'sunk');
    }
    const now = w.clock;
    for (const p of pots()) {
      const c = railed(p, now), d = hyp(b.x - c.x, b.y - c.y);
      if (p.peg) { if (d <= PR.inner - p.r) { b.st = 'in'; b.pot = p; b.x = c.x; b.y = c.y; events.push('in'); return undefined; } continue; }
      if (d <= p.r - b.r * 0.4) { b.st = 'in'; b.pot = p; b.x = c.x; b.y = c.y; events.push('in'); return undefined; }
      if (d <= p.r + (p.rim ?? 0)) {
        const nx = (b.x - c.x) / (d || 1), ny = (b.y - c.y) / (d || 1);
        b.st = 'ground'; b.vx = nx * 1.8; b.vy = ny * 1.8; b.v0 = 1.8; events.push('rim');
        return undefined;
      }
    }
    b.st = 'ground';
    const roll = W.landRoll ?? 0;
    b.vx = f.dx * roll; b.vy = f.dy * roll; b.v0 = roll;
    return undefined;
  };

  const zoneMul = (y) => { let m = 1; for (const z of W.zones ?? []) if (y >= z.y0 && y < z.y1) m *= z.mul; return m; };

  const step = (w, events = []) => {
    w.clock += DT;
    const bs = w.bodies;
    for (const b of bs) { b.py = b.y; b.px = b.x; }
    for (const b of bs) {
      if (b.st === 'fly') {
        const f = b.fl;
        f.t += DT;
        const u = Math.min(1, f.t / f.T);
        b.x = f.x0 + (f.x1 - f.x0) * u; b.y = f.y0 + (f.y1 - f.y0) * u;
        b.z = Math.sin(Math.PI * u) * (f.hop ? 0.25 : 1) * (0.25 + 0.05 * f.len);
        if (nets.length && b.kind === 'proj') {
          for (const n of nets) {
            if (b.py < n.y && b.y >= n.y && Math.abs(b.x - n.x) <= n.w / 2 && n.fault) {
              if (b.z < n.h) {
                // net fault: the ball dies against the net and drops back toward the thrower
                b.st = 'ground'; b.fl = null; b.z = 0; b.fault = true; b.y = n.y - b.r - 0.02;
                b.vx = (b.x - f.x0) * 0.25; b.vy = -1.3; b.v0 = 1.3; events.push('netfault');
              } else if (b.z < n.h + 0.22) events.push('nettape');
              break;
            }
          }
          if (b.fault) continue;
        }
        if (u >= 1) land(w, b, events);
        if (w.trail) w.trail.push({ x: b.x, y: b.y, z: b.z ?? 0 });
        continue;
      }
      if (b.st !== 'ground' && b.st !== 'fallen' && b.st !== 'stand') continue;
      const sp = hyp(b.vx, b.vy);
      if (sp === 0) continue;
      let fr = W.friction * zoneMul(b.y);
      if (b.kind === 'pin') fr = Math.max(fr, 6);
      const sp2 = Math.max(0, sp - fr * DT);
      if (sp2 < 0.03) { b.vx = 0; b.vy = 0; continue; }
      const k = sp2 / sp; b.vx *= k; b.vy *= k;
      if (b.kind === 'proj' && W.bias && b.v0 > 0) {
        const a = W.bias * (0.3 + 1.4 * (1 - Math.min(1, sp2 / b.v0)) ** 2) * DT;
        const r = rotate(b.vx, b.vy, a); b.vx = r.x; b.vy = r.y;
      }
      b.x += b.vx * DT; b.y += b.vy * DT;
      if (w.trail && b.kind === 'proj') w.trail.push({ x: b.x, y: b.y, z: 0 });
    }
    if (nets.length) {
      for (const b of bs) {
        if (b.st !== 'ground' || b.kind !== 'proj') continue;
        for (const n of nets) {
          if (b.py < n.y && b.y + b.r >= n.y && Math.abs(b.x - n.x) <= n.w / 2) {
            b.y = n.y - b.r; b.vy = -Math.abs(b.vy) * 0.3; b.vx *= 0.5; b.fault = true; events.push('netfault');
          }
        }
      }
    }
    // circle vs circle
    for (let i = 0; i < bs.length; i++) {
      const a = bs[i];
      if (a.st === 'fly' || a.st === 'in' || a.st === 'out' || a.st === 'sunk') continue;
      for (let j = i + 1; j < bs.length; j++) {
        const c = bs[j];
        if (c.st === 'fly' || c.st === 'in' || c.st === 'out' || c.st === 'sunk') continue;
        const dx = c.x - a.x, dy = c.y - a.y, d = hyp(dx, dy), rr = a.r + c.r;
        if (d >= rr) continue;
        const nx = d > 1e-6 ? dx / d : 1, ny = d > 1e-6 ? dy / d : 0;
        const vn = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
        const wa = 1 / a.m, wc = 1 / c.m;
        if (vn < 0) {
          const e = Math.min(a.e, c.e), j2 = (-(1 + e) * vn) / (wa + wc);
          a.vx -= j2 * wa * nx; a.vy -= j2 * wa * ny; c.vx += j2 * wc * nx; c.vy += j2 * wc * ny;
          const hit = -vn;
          for (const [p, q] of [[a, c], [c, a]]) if (p.kind === 'pin' && p.st === 'stand' && hit > T.knock && q) { p.st = 'fallen'; p.fall = w.throwNo; events.push('pin'); }
          if (hit > 0.3) events.push('hit');
        }
        const over = rr - d + 1e-4, tw = wa + wc;
        a.x -= nx * over * (wa / tw); a.y -= ny * over * (wa / tw); c.x += nx * over * (wc / tw); c.y += ny * over * (wc / tw);
      }
    }
    // walls, ends, holes
    for (const b of bs) {
      if (b.st === 'fly' || b.st === 'in' || b.st === 'out' || b.st === 'sunk') continue;
      if (W.sides === 'wall' || b.kind !== 'proj') {
        if (b.x - b.r < -hw) { if (TABLE && b.vx < -0.5) events.push('rail'); b.x = -hw + b.r; b.vx = Math.abs(b.vx) * W.wallBounce; }
        if (b.x + b.r > hw) { if (TABLE && b.vx > 0.5) events.push('rail'); b.x = hw - b.r; b.vx = -Math.abs(b.vx) * W.wallBounce; }
      } else if (Math.abs(b.x) > hw) { b.st = 'out'; events.push('out'); continue; }
      if (W.ends === 'wall') { if (b.y + b.r > len) { if (TABLE && b.vy > 0.5) events.push('rail'); b.y = len - b.r; b.vy = -Math.abs(b.vy) * W.wallBounce; } }
      else if (b.y - b.r > len) { if (b.kind === 'proj') { b.st = 'out'; events.push('out'); continue; } b.y = len; b.vy = 0; }
      if (TABLE && b.y - b.r < 0) { if (b.vy < -0.5) events.push('rail'); b.y = b.r; b.vy = Math.abs(b.vy) * W.wallBounce; }
      if (b.y - b.r < -2 && b.kind !== 'proj') { b.y = -2 + b.r; b.vy = 0; }
      if (b.kind === 'proj' && b.y < -2 && !TABLE) { b.st = 'out'; continue; }
      if (b.kind === 'proj' && b.st === 'ground' && b.thr && hyp(b.vx, b.vy) < (W.captureSpeed ?? 1.4)) {
        for (const p of pots()) {
          if (p.peg) continue;
          const c = railed(p, w.clock);
          if (hyp(b.x - c.x, b.y - c.y) <= p.r - b.r * 0.3) { b.st = 'in'; b.pot = p; b.x = c.x; b.y = c.y; events.push('in'); break; }
        }
      }
    }
    if (TABLE) {
      for (const b of bs) {
        if (b.st !== 'ground' || (b.kind !== 'proj' && b.kind !== 'disc')) continue;
        for (const [px, py] of [[-hw, 0], [hw, 0], [-hw, len], [hw, len]]) {
          if (hyp(b.x - px, b.y - py) < pocketR) { b.st = 'sunk'; b.vx = 0; b.vy = 0; b.pk = [px, py]; events.push('pocket'); break; }
        }
      }
    }
    if (circles.length || boxes.length) {
      for (const b of bs) {
        if (b.st !== 'ground' && b.st !== 'stand') continue;
        const e = W.wallBounce ?? 0.5;
        for (const c of circles) {
          const dx = b.x - c.x, dy = b.y - c.y, d = hyp(dx, dy), rr = b.r + c.r;
          if (d >= rr) continue;
          const nx = d > 1e-6 ? dx / d : 0, ny = d > 1e-6 ? dy / d : -1, over = rr - d;
          b.x += nx * over; b.y += ny * over;
          const vn = b.vx * nx + b.vy * ny;
          if (vn < 0) { b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny; if (-vn > 0.4) events.push(c.peg ? 'peg' : 'post'); }
          if (c.peg && b.kind === 'proj' && !b.pegHit) { b.pegHit = true; b.xp = (b.xp ?? 0) + (peg.points ?? 1); events.push('pegscore'); }
        }
        for (const q of boxes) {
          const px = clamp(b.x, q.x0, q.x1), py = clamp(b.y, q.y0, q.y1), dx = b.x - px, dy = b.y - py, d = hyp(dx, dy);
          if (d >= b.r) continue;
          let nx, ny, over;
          if (d > 1e-6) { nx = dx / d; ny = dy / d; over = b.r - d; }
          else { const dl = b.x - q.x0, dr = q.x1 - b.x, dt = b.y - q.y0, db = q.y1 - b.y, m = Math.min(dl, dr, dt, db); nx = m === dl ? -1 : m === dr ? 1 : 0; ny = m === dt ? -1 : m === db ? 1 : 0; over = b.r + m; }
          b.x += nx * over; b.y += ny * over;
          const vn = b.vx * nx + b.vy * ny;
          if (vn < 0) { b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny; if (-vn > 0.4) events.push('post'); }
        }
      }
    }
    // hoops: a ground piece that crosses the plane between the legs, slowly enough, scores without being captured
    if (hoops.length) {
      for (const b of bs) {
        if (b.kind !== 'proj' || b.st !== 'ground' || !b.thr) continue;
        hoops.forEach((h, i) => {
          if (b.py < h.y && b.y >= h.y && !(b.hp ?? []).includes(i)) {
            const f = (h.y - b.py) / Math.max(1e-6, b.y - b.py), xc = b.px + (b.x - b.px) * f;
            const ok = Math.abs(xc - h.x) <= h.w / 2 - b.r * 0.2 && hyp(b.vx, b.vy) <= (h.maxSpeed ?? 99) && (T.hoopOrder !== 'ordered' || (b.hn ?? 0) === i);
            (b.hp ??= []).push(i);
            if (ok) { b.xp = (b.xp ?? 0) + (h.points ?? 1); b.hn = i + 1; events.push('hoop'); }
          }
        });
      }
    }
    return events;
  };

  const settled = (w) => w.bodies.every((b) => b.st !== 'fly' && (b.vx === 0 && b.vy === 0 || b.st === 'in' || b.st === 'out' || b.st === 'sunk'));

  const settle = (w, maxT = 16, events = []) => {
    let n = 0;
    while (!settled(w) && n < maxT / DT) { step(w, events); n++; }
    if (!settled(w)) for (const b of w.bodies) { b.vx = 0; b.vy = 0; if (b.st === 'fly') b.st = 'out'; }
    return w;
  };

  // ---- scoring ------------------------------------------------------------------------------------------
  const centerOf = (w, ring) => {
    if (ring.around === 'jack') { const j = w.bodies.find((b) => b.kind === 'jack'); return j ? { x: j.x, y: j.y } : null; }
    return railed(ring, w.clock);
  };
  const restPoints = (w, b) => {
    let best = 0;
    if (b.fault) return 0;
    for (const ring of T.rings ?? []) {
      const c = centerOf(w, ring); if (!c) continue;
      const d = hyp(b.x - c.x, b.y - c.y);
      for (const band of ring.bands) if (d <= band.r) { best = Math.max(best, band.points); break; }
    }
    for (const band of T.bands ?? []) if (b.y >= band.y0 && b.y < band.y1 && (band.x0 !== undefined || band.x1 !== undefined ? b.x >= (band.x0 ?? -hw) && b.x < (band.x1 ?? hw) : Math.abs(b.x) <= hw)) best = Math.max(best, band.points);
    return best;
  };
  const restTotal = (w) => w.bodies.reduce((s, b) => s + (b.kind === 'proj' && b.st === 'ground' ? restPoints(w, b) : 0), 0);
  const pinPoints = (w, thr) => {
    const fell = w.bodies.filter((b) => b.kind === 'pin' && b.st === 'fallen' && b.fall === thr);
    if (!fell.length) return 0;
    if (T.pinScoring === 'single') return fell.length === 1 ? fell[0].v : fell.length;
    return fell.reduce((s, b) => s + b.v, 0);
  };
  const xpPoints = (w, thr) => w.bodies.reduce((s2, b) => s2 + (b.kind === 'proj' && b.thr === thr ? (b.xp ?? 0) : 0), 0);
  const discPoints = (w) => w.bodies.reduce((s2, b) => s2 + (b.kind === 'disc' && b.st === 'sunk' && !b.scored ? b.v : 0), 0) - (T.foul ?? 0) * w.bodies.filter((b) => TABLE && b.kind === 'proj' && b.st === 'sunk' && !b.scored).length;
  const potPoints = (w) => w.bodies.reduce((s, b) => s + (b.kind === 'proj' && b.st === 'in' && !b.scored ? b.pot.points : 0), 0);
  const skipPoints = (w) => (S ? w.bodies.reduce((s, b) => s + (b.kind === 'proj' && (b.st === 'sunk' || b.st === 'out') && !b.scored ? b.skips * S.points : 0), 0) : 0);
  // points the current throw is worth right now (end-of-round resting scores are added separately)
  const throwGain = (w, thr) => discPoints(w) + xpPoints(w, thr) + potPoints(w) + pinPoints(w, thr) + skipPoints(w) + (P.rounds.scoreAt === 'throw' ? w.bodies.reduce((s, b) => s + (b.kind === 'proj' && b.thr === thr && b.st === 'ground' ? restPoints(w, b) : 0), 0) : 0);

  const clone = (w) => JSON.parse(JSON.stringify({ ...w, trail: null }));
  return { newWorld, launch, step, settled, settle, restTotal, throwGain, restPoints, clone, hw, len, rate };
}

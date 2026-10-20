// shape-craft technique `polish` (1.7.0): cast a metal mirror and polish it through the grits (Aranmula metal mirror, Kerala).
//   1. ALLOY: drag the slider until the molten alloy matches the master's sample tone (too much copper is red, too much tin is white).
//   2. CAST: pour; a poor alloy leaves pits that never polish out.
//   3. POLISH: pick a grit and rub; each grit only works while the surface is rough enough for it and leaves scratches only it can remove:
//      coarse to fine, or the mirror stays dull. A finished mirror reflects the room.
// Score = 25 percent alloy + 75 percent of the face polished to a mirror (pits count against it). Doing nothing scores nothing.
import { registerTechnique } from './registry.js';
import { starsFor, hash } from './geom.js';
import { shadowed, rrect, shelf, rgba, tint, mix, ease } from './fx.js';
import { drawTool, wallLift } from './scenes.js';
import { fx as synth } from '../../../platform/engine-kit/synth.js';
import { clamp, smooth01 } from './paint-stroke.js';

const GRITS = [{ n: 80, floor: 0.62, span: 0.5 }, { n: 240, floor: 0.38, span: 0.38 }, { n: 600, floor: 0.2, span: 0.28 }, { n: 1500, floor: 0.09, span: 0.18 }, { n: 4000, floor: 0.02, span: 0.14 }];
const R_MIN = 0.1, R_MAX = 0.4, CELLS = 48, DISC = 0.405;
const toneOf = (r) => { const k = clamp((r - R_MIN) / (R_MAX - R_MIN), 0, 1); return k < 0.5 ? mix('#b4532a', '#e0aa48', k * 2) : mix('#e0aa48', '#dfe3e6', (k - 0.5) * 2); };

function createSound(audio) {
  const F = (kind, p) => { try { return synth(audio, kind, p); } catch { return false; } };
  let carried = 0, tickAt = 0;
  return {
    slide(r) { if (Math.abs(r - tickAt) < 0.008) return; tickAt = r; F('tick', { hz: 900 + 1400 * r, vel: 0.32 }); },
    cast() { F('whoosh', { dur: 0.8, vel: 0.5, down: true }); F('splash', { vel: 0.5, delay: 0.5 }); F('scrape', { hz: 1200, dur: 0.9, vel: 0.4, delay: 0.7 }); F('impact', { mat: 'metal', hz: 420, vel: 0.5, delay: 1.35 }); },
    grit(i) { F('tick', { hz: 1200 + i * 500, vel: 0.35 }); },
    rub(len, i, fit) { carried += len; if (carried < 0.04) return; carried = 0; F('scrape', { hz: 900 + i * 1100, dur: 0.14 - i * 0.012, vel: (0.7 - i * 0.05) * (fit ? 1 : 0.5) }); },
    mirror() { F('ring', { hz: 1568, dur: 1.4, vel: 0.35 }); F('ring', { hz: 2349, dur: 1.1, vel: 0.22, delay: 0.08 }); },
    step() { F('whoosh', { dur: 0.2, vel: 0.4, down: true }); },
    win(stars) { F('good', { hz: 660 + stars * 60, vel: 0.5 }); },
  };
}

export function createPolish(P, env) {
  const { rng, fx } = env, SC = P.scene ?? {};
  const snd = createSound(env.audio);
  if (env.options?.soundLog) for (const k of Object.keys(snd)) { const f = snd[k]; snd[k] = (...a) => { env.options.soundLog.push({ kind: `polish.${k}` }); return f(...a); }; }
  const AR = 1;
  let phase, ratio, target, castAt, cells, pits, grit, rubbed, last, down, done, geo, now, ptr, auto, alloyScore, polishedAt, mirrorSounded, sliderGrab, lastFit;

  const init = () => {
    target = 0.23 + rng.next() * 0.1; ratio = 0.15; phase = 0; castAt = -1; grit = 0; rubbed = 0; last = null; down = false; done = null; geo = null; now = 0; ptr = null; alloyScore = 0; polishedAt = -1; mirrorSounded = false; sliderGrab = false; lastFit = true;
    cells = [];
    for (let j = 0; j < CELLS; j++) for (let i = 0; i < CELLS; i++) { const x = (i + 0.5) / CELLS, y = (j + 0.5) / CELLS; if (Math.hypot(x - 0.5, y - 0.5) <= DISC) cells.push({ x, y, r: 0.95, pit: 0 }); }
    pits = [];
    buildAuto();
  };
  const polished = () => cells.filter((c) => c.r <= 0.07 && !c.pit).length / cells.length;
  const alloyQ = () => clamp(1 - Math.max(0, Math.abs(ratio - target) - 0.01) / 0.06, 0, 1);
  const total = () => {
    if (done) return done.score;
    return Math.round(100 * ((phase >= 1 ? 0.25 * alloyScore : 0) + (phase >= 2 ? 0.75 * polished() : 0)));
  };

  // ---- interaction -------------------------------------------------------------------------------------------------------------------------
  const sliderRect = () => ({ x: geo.ox + geo.bw * 0.08, y: geo.oy + geo.s * 1.06, w: geo.bw * 0.84, h: 26 });
  const toLocal = (x, y) => [(x - geo.ox) / geo.s, (y - geo.oy) / geo.s];
  const setRatio = (x) => { const s = sliderRect(); const r = R_MIN + clamp((x - s.x) / s.w, 0, 1) * (R_MAX - R_MIN); ratio = r; snd.slide(r); };
  const doCast = () => {
    if (phase !== 0 || done) return;
    alloyScore = alloyQ(); phase = 1; castAt = now; snd.cast();
    const q = 1 - alloyScore, nPits = Math.round(q * 46);
    for (let k = 0; k < nPits; k++) { const c = cells[Math.floor(hash(k, 77) * cells.length)]; c.pit = 1; pits.push(c); }
  };
  const rubTo = (u, v) => {
    if (!last) { last = [u, v]; return; }
    const dx = u - last[0], dy = v - last[1], d = Math.hypot(dx, dy);
    if (d < 0.004) return;
    const n = Math.ceil(d / 0.018);
    for (let s = 1; s <= n; s++) rubAt(last[0] + (dx * s) / n, last[1] + (dy * s) / n, d / n);
    snd.rub(d, grit, lastFit);
    last = [u, v];
  };
  const rubAt = (x, y, d) => {
    const G = GRITS[grit], rr = 0.058;
    let fit = false;
    for (const c of cells) {
      const dist = Math.hypot(c.x - x, c.y - y); if (dist > rr) continue;
      const w = 1 - dist / rr;
      if (c.r > G.floor) { const ok = c.r - G.floor <= G.span; if (ok) fit = true; c.r -= (c.r - G.floor) * clamp(d * 42 * (ok ? 1 : 0.1) * w, 0, 0.9); }
      else c.r += (G.floor - c.r) * clamp(d * 9 * w, 0, 0.9);   // a coarse grit on a finer surface only scratches it
    }
    lastFit = fit;
    if (!mirrorSounded && polished() > 0.85 && phase === 2) { mirrorSounded = true; polishedAt = now; snd.mirror(); }
  };
  const control = (id) => {
    if (done) return;
    if (id === 'cast') doCast();
    else if (id.startsWith('grit:')) { grit = Number(id.slice(5)); last = null; snd.grit(grit); }
    else if (id === 'check') finish();
  };
  const finish = () => {
    if (done) return;
    if (phase === 0) doCast();
    phase = 2;
    const score = Math.round(100 * (0.25 * alloyScore + 0.75 * polished())), stars = starsFor(score), W = SC.words ?? {};
    done = { score, max: 100, stars, headline: stars === 3 ? (W.win ?? 'A true mirror') : stars ? (W.ok ?? 'A fair reflection') : (W.retry ?? 'Back to the grits'), detail: `Alloy ${Math.round(alloyScore * 100)} percent, face polished ${Math.round(polished() * 100)} percent` };
    snd.win(stars);
    if (geo) fx.emit('spark', geo.ox + geo.bw / 2, geo.oy + geo.s / 2, { count: 14, color: '#ffffff', size: 8, speed: 160, life: 0.9, gravity: 60 });
  };
  const work = (p) => {
    if (!geo || done) return;
    ptr = { x: p.x, y: p.y };
    if (phase === 0) {
      const s = sliderRect();
      if (p.pressed && p.x >= s.x - 16 && p.x <= s.x + s.w + 16 && p.y >= s.y - 22 && p.y <= s.y + s.h + 22) sliderGrab = true;
      if (sliderGrab && (p.down || p.pressed)) setRatio(p.x);
      if (!p.down) sliderGrab = false;
      return;
    }
    if (phase < 2) return;
    const [u, v] = toLocal(p.x, p.y);
    if (p.pressed && Math.hypot(u - 0.5, v - 0.5) < DISC + 0.06) { down = true; last = null; rubTo(u, v); }
    if (down && (p.down || p.pressed)) rubTo(u, v);
    if (down && (p.released || !p.down)) { down = false; last = null; }
  };
  const tick = (dt) => { now += dt; if (phase === 1 && now - castAt > 1.5) { phase = 2; snd.step(); } };

  // ---- attract -----------------------------------------------------------------------------------------------------------------------------
  function buildAuto() { auto = { q: [{ t: 'slide' }, { t: 'cast' }, { t: 'wait', s: 1.7 }, ...GRITS.flatMap((_, i) => [{ t: 'grit', i }, { t: 'rub', passes: 1.2 }]), { t: 'check' }], i: 0, wait: 0.3, st: null, hand: null }; }
  const serp = (s) => { const rows = 13, per = 0.86, k = Math.floor(s / per), f = (s % per) / per, y = 0.5 - DISC + 0.03 + ((2 * DISC - 0.06) * Math.min(rows - 1, k)) / (rows - 1); const half = Math.sqrt(Math.max(0.0004, DISC * DISC - (y - 0.5) ** 2)) - 0.015; return [0.5 + (k % 2 ? 1 - 2 * f : 2 * f - 1) * half, y]; };
  const attract = (dt) => {
    if (done) return;
    if (auto.wait > 0) { auto.wait -= dt; return; }
    const st = auto.st;
    if (st?.kind === 'slide') { const d = target - ratio; ratio += Math.sign(d) * Math.min(Math.abs(d), 0.14 * dt); snd.slide(ratio); if (Math.abs(target - ratio) < 1e-6) { ratio = target; auto.st = null; auto.wait = 0.5; } return; }
    if (st?.kind === 'rub') {
      st.s = Math.min(st.len, st.s + 4.4 * dt); const q = serp(st.s); rubTo(q[0], q[1]); auto.hand = q;
      if (st.s >= st.len) { auto.st = null; last = null; auto.wait = 0.15; }
      return;
    }
    const a = auto.q[auto.i]; if (!a) return; auto.i++;
    if (a.t === 'slide') auto.st = { kind: 'slide' };
    else if (a.t === 'cast') { doCast(); }
    else if (a.t === 'wait') auto.wait = a.s;
    else if (a.t === 'grit') { control(`grit:${a.i}`); auto.wait = 0.2; }
    else if (a.t === 'rub') { last = null; auto.st = { kind: 'rub', s: 0, len: 0.86 * 13 * a.passes / 1.1 }; }
    else if (a.t === 'check') { finish(); }
  };

  // ---- drawing -----------------------------------------------------------------------------------------------------------------------------
  const X = (V, x) => V.ox + x * V.s, Y = (V, y) => V.oy + y * V.s;
  const drawMirror = (ctx, V, t, o) => {
    const cx = X(V, 0.5), cy = Y(V, 0.5), R = V.s * DISC, tone = toneOf(o.ratio ?? ratio), poll = o.polished ?? polished();
    // rim and ring ornaments
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = V.s * 0.05; ctx.shadowOffsetY = V.s * 0.025; ctx.beginPath(); ctx.arc(cx, cy, V.s * 0.47, 0, 6.3); ctx.fillStyle = '#1a120a'; ctx.fill(); ctx.restore();
    const rim = ctx.createLinearGradient(cx - V.s * 0.47, cy - V.s * 0.47, cx + V.s * 0.47, cy + V.s * 0.47); rim.addColorStop(0, tint(tone, 0.35)); rim.addColorStop(0.5, mix(tone, '#5a3a16', 0.35)); rim.addColorStop(1, tint(tone, -0.5));
    ctx.beginPath(); ctx.arc(cx, cy, V.s * 0.47, 0, 6.3); ctx.fillStyle = rim; ctx.fill();
    ctx.strokeStyle = 'rgba(40,24,6,0.55)'; ctx.lineWidth = 2; for (const rr of [0.465, 0.43, 0.418]) { ctx.beginPath(); ctx.arc(cx, cy, V.s * rr, 0, 6.3); ctx.stroke(); }
    ctx.fillStyle = 'rgba(40,24,6,0.5)'; for (let k = 0; k < 48; k++) { const a = (k / 48) * 6.2832; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * V.s * 0.446, cy + Math.sin(a) * V.s * 0.446, V.s * 0.0055, 0, 6.3); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx - 1, cy - 1, V.s * 0.469, 3.4, 5.0); ctx.stroke();
    // face
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.3); ctx.clip();
    const matte = mix(tone, '#3a2616', 0.5);
    ctx.fillStyle = matte; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    // the reflected room, shifted a little with the pointer (the mirror is tilted by the hand)
    const px = o.tilt?.[0] ?? 0, py = o.tilt?.[1] ?? 0, ox = cx + px * R * 0.12, oy2 = cy + py * R * 0.12;
    ctx.save(); ctx.translate(ox - cx, oy2 - cy);
    const sky = ctx.createLinearGradient(cx, cy - R, cx, cy + R); sky.addColorStop(0, '#bcd8f0'); sky.addColorStop(0.55, '#f4e8c8'); sky.addColorStop(0.56, '#8a6a46'); sky.addColorStop(1, '#4a3420'); ctx.fillStyle = sky; ctx.fillRect(cx - R * 1.2, cy - R * 1.2, R * 2.4, R * 2.4);
    ctx.fillStyle = '#fff8e0'; ctx.fillRect(cx - R * 0.8, cy - R * 0.75, R * 0.62, R * 0.52); ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = R * 0.05; ctx.strokeRect(cx - R * 0.8, cy - R * 0.75, R * 0.62, R * 0.52); ctx.beginPath(); ctx.moveTo(cx - R * 0.49, cy - R * 0.75); ctx.lineTo(cx - R * 0.49, cy - R * 0.23); ctx.moveTo(cx - R * 0.8, cy - R * 0.49); ctx.lineTo(cx - R * 0.18, cy - R * 0.49); ctx.stroke();
    const lamp = ctx.createRadialGradient(cx + R * 0.5, cy - R * 0.1, 0, cx + R * 0.5, cy - R * 0.1, R * 0.55); lamp.addColorStop(0, 'rgba(255,230,150,1)'); lamp.addColorStop(0.3, 'rgba(255,170,60,0.8)'); lamp.addColorStop(1, 'rgba(255,120,20,0)'); ctx.fillStyle = lamp; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.fillStyle = '#2f5a38'; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.ellipse(cx + R * (0.15 + k * 0.1), cy + R * 0.3 - (k % 2) * R * 0.1, R * 0.14, R * 0.03, -0.5 + k * 0.15, 0, 6.3); ctx.fill(); }
    ctx.restore();
    // the film of roughness over the reflection
    { const cs = V.s / CELLS + 0.6; for (const sh of [0, 0.5]) for (const c of o.cells ?? cells) { if (c.r < 0.04) continue; const al = clamp(c.r * 1.25, 0, 1); ctx.fillStyle = rgba(matte, 1 - Math.sqrt(1 - al * 0.98)); ctx.fillRect(X(V, c.x) - cs / 2 + sh * cs, Y(V, c.y) - cs / 2 + sh * cs, cs, cs); } }   // two half-offset passes soften the cell edges
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.beginPath();
    for (const c of o.cells ?? cells) { if (c.r < 0.1) continue; const a = hash(Math.round(c.x * 99), Math.round(c.y * 99), 5) * 3.14; ctx.moveTo(X(V, c.x), Y(V, c.y)); ctx.lineTo(X(V, c.x) + Math.cos(a) * V.s * 0.02 * c.r, Y(V, c.y) + Math.sin(a) * V.s * 0.02 * c.r); }
    ctx.stroke();
    for (const c of o.pits ?? pits) { ctx.fillStyle = 'rgba(20,10,4,0.75)'; ctx.beginPath(); ctx.ellipse(X(V, c.x), Y(V, c.y), V.s * 0.007, V.s * 0.0045, hash(Math.round(c.x * 99), 3), 0, 6.3); ctx.fill(); }
    const gl = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R); gl.addColorStop(0.1, `rgba(255,255,255,${0.35 * poll})`); gl.addColorStop(0.3, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.3); ctx.stroke();
  };
  const drawCrucible = (ctx, V, k, t) => { // the pot of molten alloy, tilting to pour
    const bx = X(V, 0.5 + 0.22 * k), by = Y(V, 0.1 + 0.18 * k), s = V.s * 0.26, tilt = k * 1.05;
    ctx.save(); ctx.translate(bx, by); ctx.rotate(tilt);
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 8;
    ctx.beginPath(); ctx.moveTo(-s * 0.5, -s * 0.3); ctx.lineTo(-s * 0.36, s * 0.45); ctx.lineTo(s * 0.36, s * 0.45); ctx.lineTo(s * 0.5, -s * 0.3); ctx.closePath(); ctx.fillStyle = '#3a3330'; ctx.fill(); ctx.shadowColor = 'transparent';
    const g = ctx.createLinearGradient(-s * 0.5, 0, s * 0.5, 0); g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.35)'); ctx.fillStyle = g; ctx.fill();
    const tone = toneOf(ratio), glow = ctx.createRadialGradient(0, -s * 0.28, 2, 0, -s * 0.28, s * 0.5); glow.addColorStop(0, tint(tone, 0.6)); glow.addColorStop(0.5, tone); glow.addColorStop(1, mix(tone, '#ff6a20', 0.5));
    ctx.fillStyle = glow; ctx.beginPath(); ctx.ellipse(0, -s * 0.3, s * 0.46, s * 0.12, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = `rgba(255,200,120,${0.18 + 0.1 * Math.sin(t * 6)})`; ctx.beginPath(); ctx.ellipse(0, -s * 0.36, s * 0.52, s * 0.26, 0, 0, 6.3); ctx.fill();
    ctx.restore();
    if (k > 0.5 && k < 1.01) { const x1 = bx + s * 0.55, y1 = by - s * 0.05; ctx.strokeStyle = toneOf(ratio); ctx.lineWidth = Math.max(3, V.s * 0.012); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(x1 + s * 0.2, y1 + s * 0.3, X(V, 0.58), Y(V, 0.5)); ctx.stroke(); }
  };
  const draw = (g, Rt, tt) => {
    const { ctx, pal: PL } = g, W0 = Rt.work, lift = SC.wall ? wallLift(W0) * 0.35 : 0;
    const Wk = { x: W0.x, y: W0.y + 56 + lift, w: W0.w, h: W0.h - 56 - lift - 4 };
    const s = Math.min(Wk.h - 52, Wk.w - 16), V = { ox: Wk.x + (Wk.w - s) / 2, oy: Wk.y + 2, s };
    geo = { ox: V.ox, oy: V.oy, s: V.s, bw: V.s };
    const tilt = ptr ? [clamp(((ptr.x - X(V, 0.5)) / (V.s * 0.5)), -1, 1), clamp(((ptr.y - Y(V, 0.5)) / (V.s * 0.5)), -1, 1)] : [0, 0];
    if (phase === 0 || (phase === 1 && now - castAt < 1.5)) {
      // sand mould with the disc to be cast
      const cx = X(V, 0.5), cy = Y(V, 0.5);
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8; rrect(ctx, X(V, 0.02), Y(V, 0.02), V.s * 0.96, V.s * 0.96, 18); ctx.fillStyle = '#6a5a44'; ctx.fill(); ctx.restore();
      ctx.save(); rrect(ctx, X(V, 0.02), Y(V, 0.02), V.s * 0.96, V.s * 0.96, 18); ctx.clip(); ctx.fillStyle = '#7a6a52'; ctx.fillRect(X(V, 0), Y(V, 0), V.s, V.s);
      ctx.fillStyle = 'rgba(40,28,14,0.25)'; for (let k = 0; k < 500; k++) ctx.fillRect(X(V, hash(k, 1)), Y(V, hash(k, 2)), 2, 2);
      ctx.fillStyle = 'rgba(255,240,200,0.12)'; for (let k = 0; k < 300; k++) ctx.fillRect(X(V, hash(k, 3)), Y(V, hash(k, 4)), 2, 2);
      const fillK = phase === 1 ? clamp((now - castAt - 0.7) / 0.7, 0, 1) : 0;
      ctx.beginPath(); ctx.arc(cx, cy, V.s * 0.43, 0, 6.3); ctx.fillStyle = '#4a3c2a'; ctx.fill();
      if (fillK > 0) { ctx.beginPath(); ctx.arc(cx, cy, V.s * 0.43 * ease(fillK), 0, 6.3); ctx.fillStyle = mix(toneOf(ratio), '#ff7a2a', 0.45 * (1 - fillK)); ctx.fill(); }
      ctx.restore();
      drawCrucible(ctx, V, phase === 1 ? clamp((now - castAt) / 0.7, 0, 1) * (1 - clamp((now - castAt - 1.2) / 0.3, 0, 1)) : 0, now);
    } else drawMirror(ctx, V, now, { tilt, ratio });
    // slider (alloy)
    if (phase === 0) {
      const sl = sliderRect();
      ctx.save(); rrect(ctx, sl.x, sl.y + 9, sl.w, 8, 4); const tg = ctx.createLinearGradient(sl.x, 0, sl.x + sl.w, 0); tg.addColorStop(0, toneOf(R_MIN)); tg.addColorStop(0.5, toneOf((R_MIN + R_MAX) / 2)); tg.addColorStop(1, toneOf(R_MAX)); ctx.fillStyle = tg; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.stroke();
      const hx = sl.x + ((ratio - R_MIN) / (R_MAX - R_MIN)) * sl.w, tx = sl.x + ((target - R_MIN) / (R_MAX - R_MIN)) * sl.w;
      ctx.fillStyle = toneOf(target); ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx, sl.y - 3); ctx.lineTo(tx - 7, sl.y - 15); ctx.lineTo(tx + 7, sl.y - 15); ctx.closePath(); ctx.fill(); ctx.stroke();
      shadowed(ctx, () => { ctx.beginPath(); ctx.arc(hx, sl.y + 13, 15, 0, 6.3); ctx.fillStyle = toneOf(ratio); ctx.fill(); }, { blur: 8, dy: 3, a: 0.5 }); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hx, sl.y + 13, 15, 0, 6.3); ctx.stroke();
      g.label(ctx, "Master's sample", tx, sl.y - 20, g.px(17), PL.ink, 'center', '600'); ctx.restore();
    }
    const hintTxt = phase === 0 ? 'Drag the slider until your alloy matches the master\'s sample, then Cast.' : phase === 1 ? 'Pouring the metal...' : done ? '' : `Grit ${GRITS[grit].n}: rub the face. Work from coarse to fine.`;
    g.wrap(ctx, hintTxt, W0.w - 24, g.px(21)).slice(0, 2).forEach((l, i) => g.label(ctx, l, W0.x + W0.w / 2, W0.y + 16 + i * g.px(24), g.px(21), PL.ink, 'center', '600'));
    if (phase === 2 && ptr && (down || auto?.st?.kind === 'rub') && !done) { const hand = auto?.st?.kind === 'rub' ? auto.hand : null, hx = hand ? X(V, hand[0]) : ptr.x, hy = hand ? Y(V, hand[1]) : ptr.y; drawTool(ctx, SC, 'sponge', hx, hy, Math.max(100, V.s * 0.26), now); }
    else if (phase === 2 && auto?.hand && !ptr) drawTool(ctx, SC, 'sponge', X(V, auto.hand[0]), Y(V, auto.hand[1]), Math.max(100, V.s * 0.26), now);
    // reference: the finished mirror
    const th = Rt.thumb, ts = Math.min(th.w, th.h) - 12, Vt = { ox: th.x + (th.w - ts) / 2, oy: th.y + (th.h - ts) / 2, s: ts };
    shelf(ctx, th.x + th.w / 2, th.y + th.h - 3, th.w * 0.36);
    drawMirror(ctx, Vt, 99, { ratio: target, polished: 1, cells: [], pits: [], tilt: [-0.3, -0.2] });
  };
  const titleArt = (g, S, t) => { const { ctx } = g, s = Math.min(S.w, S.h) * 0.94, V = { ox: S.x + (S.w - s) / 2, oy: S.y + (S.h - s) / 2, s }; drawMirror(ctx, V, t ?? 0, { ratio: target, polished: 1, cells: [], pits: [], tilt: [Math.sin((t ?? 0) * 0.7), Math.cos((t ?? 0) * 0.5) * 0.6] }); };

  const items = () => phase === 0 ? [{ id: 'cast', kind: 'btn', label: 'Cast', primary: true }]
    : phase === 1 ? [{ id: 'wait', kind: 'btn', label: 'Pouring', off: true }]
      : [...GRITS.map((G, i) => ({ id: `grit:${i}`, kind: 'btn', label: `${G.n}`, primary: i === grit })), { id: 'check', kind: 'btn', label: 'Check', primary: false }];
  const state = () => ({ technique: 'polish', phase, ratio: Math.round(ratio * 1000) / 1000, target: Math.round(target * 1000) / 1000, grit, polished: Math.round(polished() * 1000) / 1000, pits: pits.length, alloy: Math.round(alloyScore * 1000) / 1000, rubbed: Math.round(rubbed) });

  init();
  return {
    init, items, control, work, tick, draw, attract, titleArt, result: () => done, score: total,
    hint: () => (phase === 0 ? 'Drag the slider until the colour of your alloy matches the master\'s sample.' : phase === 2 ? (polished() > 0.85 ? 'The face is a mirror: press Check.' : `Rub with grit ${GRITS[grit].n}; when the surface stops changing, move to the next finer grit.`) : ''),
    info: () => [phase === 0 ? 'Step 1 of 3: Mix the alloy' : phase === 1 ? 'Step 2 of 3: Cast' : 'Step 3 of 3: Polish', phase >= 2 ? `Face polished: ${Math.round(polished() * 100)}%` : `Alloy off by ${Math.round(Math.abs(ratio - target) * 100)} points`],
    get caption() { return SC.words?.caption ?? 'Cast and polish this mirror'; },
    rules: () => [
      'Drag the slider to mix the alloy: the colour of the molten metal must match the master\'s sample. Too much copper is red, too much tin is pale. Then press Cast.',
      'A badly mixed alloy leaves pits in the face; pits never polish out.',
      'Pick a grit and rub the face. Each grit only cuts while the surface is still rough enough for it, and leaves scratches only a finer grit can remove: go from the coarsest grit to the finest. A coarse grit on a fine surface scratches it again.',
      'Score: a quarter for the alloy, three quarters for how much of the face is polished to a mirror. Doing nothing scores nothing.',
    ],
    point(id) {
      if (!geo) return null;
      if (id === 'slider') { const s = sliderRect(); return { x: s.x + ((target - R_MIN) / (R_MAX - R_MIN)) * s.w, y: s.y + 13 }; }
      if (id === 'sliderstart') { const s = sliderRect(); return { x: s.x + ((ratio - R_MIN) / (R_MAX - R_MIN)) * s.w, y: s.y + 13 }; }
      if (id.startsWith('rub:')) { const q = serp(Number(id.slice(4))); return { x: geo.ox + q[0] * geo.s, y: geo.oy + q[1] * geo.s }; }
      return null;
    },
    state,
  };
}

registerTechnique('polish', { make: (P, env) => createPolish(P, env), scene: 'aranmula', mat: 'wire' });
void smooth01;

// shape-craft technique `disk` (1.17.0): round braiding on a disk with 32 notches (kumihimo).
//   Eight threads sit in four pairs round the disk. One cycle is two moves and a quarter turn: the lower left thread goes up beside the top pair, the top right thread
//   goes down beside the bottom pair, and the disk is turned a quarter turn. The lit thread shows what to pick up and a ring shows where it goes. The braid grows below
//   the disk, one band of colour for every cycle.
// Score: the share of the braid that has been plaited, less 10 points for every wrong tap. Doing nothing scores 0.
import { registerTechnique } from './registry.js';
import { starsFor, hash } from './geom.js';
import { rrect, rgba, tint, mix } from './fx.js';
import { wallLift } from './scenes.js';
import { fx as synth } from '../../../platform/engine-kit/synth.js';
import { clamp } from './paint-stroke.js';

const TAU = Math.PI * 2, NS = 32;
const ease = (t) => t * t * (3 - 2 * t);
const ang = (s) => -Math.PI / 2 + (s * TAU) / NS;     // slot 0 at the top, numbered clockwise
const sx = (s) => Math.cos(ang(((s % NS) + NS) % NS));   // screen x of a slot (unit radius)
const wrap = (s) => ((s % NS) + NS) % NS;

function createSound(audio) {
  const F = (kind, p) => { try { return synth(audio, kind, p); } catch { return false; } };
  return {
    pick() { F('tick', { hz: 1300, vel: 0.3 }); },
    place(i) { F('impact', { mat: 'wood', hz: 520 + 40 * (i % 4), vel: 0.35 }); F('scrape', { hz: 2000, dur: 0.08, vel: 0.2 }); },
    turn() { F('whoosh', { dur: 0.3, vel: 0.3, down: false }); F('tick', { hz: 900, vel: 0.3, delay: 0.25 }); },
    wrong() { F('tick', { hz: 300, vel: 0.5 }); },
    done(stars) { F('good', { hz: 660 + stars * 60, vel: 0.55 }); },
  };
}

export function createDisk(P, env) {
  const { rng, fx } = env, SC = P.scene ?? {};
  const snd = createSound(env.audio);
  if (env.options?.soundLog) for (const k of Object.keys(snd)) { const f = snd[k]; snd[k] = (...a) => { env.options.soundLog.push({ kind: `disk.${k}` }); return f(...a); }; }
  const COL = (P.palette ?? [{ color: '#c8321f' }, { color: '#f2eadb' }, { color: '#243a82' }, { color: '#d8a62a' }]).map((c) => c.color);
  const CYC = P.cycles ?? 8;
  let grp, ring, slots, rot, step, cycle, err, done, geo, now, anim, braid, shake, auto, sel, pulse;
  // slots[s] = bobbin colour index or -1; rot = quarter turns done (the disk itself is turned, so slot numbers stay on the screen)
  const init = () => {
    slots = new Array(NS).fill(-1); grp = new Array(NS).fill(-1);
    [0, 8, 16, 24].forEach((b, g) => { for (const q of [wrap(b - 1), wrap(b + 1)]) { slots[q] = g % 4; grp[q] = g; } });   // pairs of one colour either side of the four marked notches
    ring = [0, 3, 2, 1];   // the groups at the top, left, bottom and right of the disk
    rot = 0; step = 0; cycle = 0; err = 0; done = null; geo = null; now = 0; anim = null; braid = []; shake = -9; auto = { w: 0.8 }; sel = null; pulse = 0;
  };
  const slotsOf = (g) => { const o = []; for (let q = 0; q < NS; q++) if (grp[q] === g && slots[q] >= 0) o.push(q); return o; };
  const nextMove = () => {
    const top = slotsOf(ring[0]), bot = slotsOf(ring[2]);
    if (step % 2 === 0) {   // the lower left thread goes up to the empty notch just left of the top pair
      const from = bot.reduce((a, b) => (sx(b) < sx(a) ? b : a), bot[0]), left = top.reduce((a, b) => (sx(b) < sx(a) ? b : a), top[0]);
      let to = wrap(left - 1); while (slots[to] >= 0) to = wrap(to - 1);
      return { from, to };
    }
    const from = top.reduce((a, b) => (sx(b) > sx(a) ? b : a), top[0]), right = bot.reduce((a, b) => (sx(b) > sx(a) ? b : a), bot[0]);   // the top right thread goes down to the empty notch just right of the bottom pair
    let to = wrap(right - 1); while (slots[to] >= 0) to = wrap(to - 1);
    return { from, to };
  };
  const total = () => (done ? done.score : Math.max(0, Math.round(100 * (cycle / CYC) - 10 * err)));
  const total2 = () => CYC * 2;
  const apply = (from, to) => {
    const c = slots[from]; slots[to] = c; slots[from] = -1; grp[to] = step % 2 === 0 ? ring[0] : ring[2]; grp[from] = -1; step++; snd.place(step);
    braid.push({ c, side: step % 2 });
    if (step % 2 === 0) { anim = { t: 0 }; snd.turn(); cycle++; }
  };
  const tapSlot = (s) => {
    if (done || anim || cycle >= CYC) return;
    const mv = nextMove();
    if (!sel) {
      if (s === mv.from) { sel = s; snd.pick(); } else { err++; shake = now; snd.wrong(); }
    } else if (s === mv.to) { apply(sel, s); sel = null; }
    else if (s === sel) sel = null;
    else { err++; shake = now; snd.wrong(); sel = null; }
  };
  const finish = () => {
    if (done) return;
    const score = total(), stars = starsFor(score), W = SC.words ?? {};
    done = { score, max: 100, stars, headline: stars === 3 ? (W.win ?? 'A fine cord') : stars ? (W.ok ?? 'A good cord') : (W.retry ?? 'Back to the disk'), detail: `${cycle} of ${CYC} turns braided, ${err} wrong ${err === 1 ? 'tap' : 'taps'}` };
    snd.done(stars);
  };
  const control = (id) => { if (id === 'check') finish(); };
  const work = (p) => {
    if (!geo || done || !p.pressed) return;
    let best = -1, bd = 1e9; for (let s = 0; s < NS; s++) { const q = geo.at(s); const d = Math.hypot(p.x - q[0], p.y - q[1]); if (d < bd) { bd = d; best = s; } }
    if (bd < geo.R * 0.2) tapSlot(best);
  };
  const tick = (dt) => {
    now += dt; pulse += dt;
    if (anim) { anim.t += dt / 0.5; if (anim.t >= 1) { // the disk is turned a quarter turn: every thread moves eight notches round
      const ns = new Array(NS).fill(-1), ng = new Array(NS).fill(-1); for (let s = 0; s < NS; s++) if (slots[s] >= 0) { ns[wrap(s - 8)] = slots[s]; ng[wrap(s - 8)] = grp[s]; } slots = ns; grp = ng; ring = [ring[3], ring[0], ring[1], ring[2]]; anim = null; rot++; } }
    if (!done && cycle >= CYC && !anim) finish();
  };
  const attract = (dt) => {
    if (done) return;
    if (auto.w > 0) { auto.w -= dt; return; }
    if (anim || cycle >= CYC) return;
    const mv = nextMove(); if (!sel) { sel = mv.from; snd.pick(); auto.w = 0.3; } else { apply(sel, mv.to); sel = null; auto.w = 0.35; }
  };

  // ---- drawing -----------------------------------------------------------------------------------------------------------------------------
  const drawBraid = (ctx, x, y0, w, hh, list, tt) => {   // the cord below the disk: chevrons of the colours that crossed in every cycle
    const n = Math.min(list.length, Math.floor(hh / (w * 0.42)));
    const sh = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); sh.addColorStop(0, 'rgba(0,0,0,0.45)'); sh.addColorStop(0.3, 'rgba(255,255,255,0.18)'); sh.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.save(); ctx.beginPath(); ctx.rect(x - w, y0, w * 2, hh); ctx.clip();
    for (let j = 0; j < n; j++) { const b = list[list.length - 1 - j], y = y0 + j * w * 0.42; ctx.fillStyle = COL[b.c % COL.length]; ctx.beginPath(); ctx.moveTo(x - w / 2, y + (b.side ? w * 0.28 : 0)); ctx.lineTo(x, y + (b.side ? 0 : w * 0.28)); ctx.lineTo(x + w / 2, y + (b.side ? w * 0.28 : 0)); ctx.lineTo(x + w / 2, y + w * 0.5 + (b.side ? w * 0.28 : 0)); ctx.lineTo(x, y + w * 0.5 + (b.side ? 0 : w * 0.28)); ctx.lineTo(x - w / 2, y + w * 0.5 + (b.side ? w * 0.28 : 0)); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.4; ctx.stroke(); }
    ctx.fillStyle = sh; ctx.fillRect(x - w / 2, y0, w, n * w * 0.42 + w * 0.5); ctx.restore();
  };
  const draw = (g, Rt, tt) => {
    const { ctx, pal: PL } = g, W0 = Rt.work, lift = SC.wall ? wallLift(W0) * 0.25 : 0;
    const area = { x: W0.x, y: W0.y + 48 + lift, w: W0.w, h: W0.h - 48 - lift - 6 }, landscape = area.w > area.h * 1.3;
    const R = Math.min(landscape ? area.h * 0.44 : area.w * 0.42, landscape ? area.w * 0.3 : area.h * 0.38), cx = landscape ? area.x + area.w * 0.3 : area.x + area.w / 2, cy = landscape ? area.y + area.h * 0.5 : area.y + R + 6;
    const turn = anim ? -ease(clamp(anim.t, 0, 1)) * (TAU / 4) : 0;
    const at = (s) => { const a = ang(s) + turn * (anim ? 1 : 0); return [cx + Math.cos(a) * R * 0.86, cy + Math.sin(a) * R * 0.86]; };
    geo = { R, cx, cy, at: (s) => { const a = ang(s); return [cx + Math.cos(a) * R * 0.86, cy + Math.sin(a) * R * 0.86]; } };
    const shk = now - shake < 0.3 ? Math.sin((now - shake) * 70) * 4 * (1 - (now - shake) / 0.3) : 0;
    // the braid hangs below (or to the right of) the disk
    if (landscape) drawBraid(ctx, area.x + area.w * 0.74, area.y + 10, Math.min(60, area.w * 0.12), area.h - 20, braid, tt);
    else drawBraid(ctx, cx, cy + R + 14, Math.min(54, R * 0.34), area.y + area.h - (cy + R) - 20, braid, tt);
    ctx.save(); ctx.translate(shk, 0);
    // disk: a thick foam wheel with notches
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = SC.diskC ?? '#2a2a30'; ctx.fill(); ctx.restore();
    const dg = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R); dg.addColorStop(0, tint(SC.diskC ?? '#2a2a30', 0.3)); dg.addColorStop(1, tint(SC.diskC ?? '#2a2a30', -0.3)); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = dg; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R - 2, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, R * 0.12, 0, TAU); ctx.fillStyle = '#0a0a0c'; ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(cx, cy); if (anim) ctx.rotate(turn);
    for (let s = 0; s < NS; s++) { const a = ang(s), marked = s % 8 === 0; ctx.save(); ctx.rotate(a + Math.PI / 2); ctx.fillStyle = '#0a0a0c'; ctx.beginPath(); ctx.moveTo(-R * 0.025, -R * 0.99); ctx.lineTo(R * 0.025, -R * 0.99); ctx.lineTo(R * 0.012, -R * 0.84); ctx.lineTo(-R * 0.012, -R * 0.84); ctx.closePath(); ctx.fill(); if (marked) { ctx.fillStyle = '#e8c860'; ctx.beginPath(); ctx.arc(0, -R * 0.74, R * 0.022, 0, TAU); ctx.fill(); } ctx.restore(); }
    ctx.restore();
    // threads from the bobbins to the centre
    for (let s = 0; s < NS; s++) { if (slots[s] < 0) continue; const [bx, by] = (() => { const a = ang(s) + (anim ? turn : 0); return [cx + Math.cos(a) * R * 0.86, cy + Math.sin(a) * R * 0.86]; })(); const c = COL[slots[s] % COL.length]; ctx.strokeStyle = rgba(tint(c, -0.5), 0.9); ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(cx, cy); ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(cx, cy); ctx.stroke(); }
    const mv = !done && cycle < CYC && !anim ? nextMove() : null;
    for (let s = 0; s < NS; s++) { if (slots[s] < 0) continue; const [bx, by] = (() => { const a = ang(s) + (anim ? turn : 0); return [cx + Math.cos(a) * R * 0.86, cy + Math.sin(a) * R * 0.86]; })(); const c = COL[slots[s] % COL.length], r = R * 0.085, lit = mv && !sel && s === mv.from || sel === s;
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(bx, by, r, 0, TAU); ctx.fill(); ctx.restore(); const bg = ctx.createRadialGradient(bx - r * 0.35, by - r * 0.4, 1, bx, by, r); bg.addColorStop(0, 'rgba(255,255,255,0.7)'); bg.addColorStop(0.5, 'rgba(255,255,255,0)'); bg.addColorStop(1, 'rgba(0,0,0,0.4)'); ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(bx, by, r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
      if (lit) { const pu = 0.5 + 0.5 * Math.sin(pulse * 6); ctx.strokeStyle = rgba(PL.accent, 0.6 + 0.4 * pu); ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(bx, by, r * 1.35 + pu * 3, 0, TAU); ctx.stroke(); } }
    if (mv && sel !== null) { const [tx, ty] = geo.at(mv.to), pu = 0.5 + 0.5 * Math.sin(pulse * 6); ctx.strokeStyle = rgba(PL.accent, 0.7); ctx.lineWidth = 3; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(tx, ty, R * 0.085 * 1.3 + pu * 3, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = rgba(PL.accent, 0.3 + 0.3 * pu); ctx.beginPath(); ctx.arc(tx, ty, R * 0.04, 0, TAU); ctx.fill(); }
    ctx.restore();
    const hintTxt = done ? '' : cycle >= CYC ? '' : !sel ? (step % 2 === 0 ? 'Tap the lit thread at the lower left.' : 'Tap the lit thread at the top right.') : 'Now tap the ring beside the other pair.';
    if (hintTxt) { ctx.font = `600 ${Math.round(g.px(20))}px system-ui, sans-serif`; const tw = Math.min(W0.w - 16, ctx.measureText(hintTxt).width + 28), ph = g.px(20) + 14; rrect(ctx, W0.x + (W0.w - tw) / 2, W0.y + 18 - ph / 2, tw, ph, ph / 2); ctx.fillStyle = 'rgba(12,10,8,0.62)'; ctx.fill(); g.label(ctx, hintTxt, W0.x + W0.w / 2, W0.y + 18, g.px(20), '#f4efe6', 'center', '600'); }
    const pb = Math.min(W0.w - 40, 260), pbx = W0.x + (W0.w - pb) / 2, pby = W0.y + W0.h - 12; ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, pbx, pby, pb, 7, 4); ctx.fill(); ctx.fillStyle = PL.accent; rrect(ctx, pbx, pby, pb * (cycle / CYC), 7, 4); ctx.fill();
    // reference: the finished cord (the pattern of colours the cycles make)
    const th = Rt.thumb, ref = [];
    const sc = new Array(NS).fill(-1); let sg = new Array(NS).fill(-1); [0, 8, 16, 24].forEach((b, gI) => { for (const q of [wrap(b - 1), wrap(b + 1)]) { sc[q] = gI % 4; sg[q] = gI; } }); let rg = [0, 3, 2, 1];
    const so = (g) => { const o = []; for (let q = 0; q < NS; q++) if (sg[q] === g && sc[q] >= 0) o.push(q); return o; };
    for (let c = 0; c < CYC; c++) { for (let m = 0; m < 2; m++) { const top = so(rg[0]), bot = so(rg[2]); let from, to; if (m === 0) { from = bot.reduce((a, b) => (sx(b) < sx(a) ? b : a), bot[0]); const left = top.reduce((a, b) => (sx(b) < sx(a) ? b : a), top[0]); to = wrap(left - 1); while (sc[to] >= 0) to = wrap(to - 1); } else { from = top.reduce((a, b) => (sx(b) > sx(a) ? b : a), top[0]); const right = bot.reduce((a, b) => (sx(b) > sx(a) ? b : a), bot[0]); to = wrap(right - 1); while (sc[to] >= 0) to = wrap(to - 1); } const cc = sc[from]; sc[to] = cc; sg[to] = m === 0 ? rg[0] : rg[2]; sc[from] = -1; sg[from] = -1; ref.push({ c: cc, side: m }); }
      const nc = new Array(NS).fill(-1), ng = new Array(NS).fill(-1); for (let q = 0; q < NS; q++) if (sc[q] >= 0) { nc[wrap(q - 8)] = sc[q]; ng[wrap(q - 8)] = sg[q]; } for (let q = 0; q < NS; q++) { sc[q] = nc[q]; sg[q] = ng[q]; } rg = [rg[3], rg[0], rg[1], rg[2]]; }
    ctx.save(); ctx.beginPath(); ctx.rect(th.x, th.y, th.w, th.h); ctx.clip(); drawBraid(ctx, th.x + th.w / 2, th.y + 8, Math.min(th.w * 0.34, 46), th.h - 14, ref, tt); ctx.restore();
  };
  const titleArt = (g, S, t) => { const { ctx } = g; const R = Math.min(S.w, S.h) * 0.4, cx = S.x + S.w / 2, cy = S.y + S.h * 0.46; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = SC.diskC ?? '#2a2a30'; ctx.fill(); for (let s = 0; s < NS; s++) { const a = ang(s) + (t ?? 0) * 0.2; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R * 0.96, cy + Math.sin(a) * R * 0.96); ctx.lineTo(cx + Math.cos(a) * R * 0.86, cy + Math.sin(a) * R * 0.86); ctx.stroke(); if (s % 4 === 1 || s % 4 === 3) { const c = COL[(s >> 2) % COL.length]; ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R * 0.8, cy + Math.sin(a) * R * 0.8); ctx.lineTo(cx, cy); ctx.stroke(); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R * 0.8, cy + Math.sin(a) * R * 0.8, R * 0.08, 0, TAU); ctx.fill(); } } };

  const items = () => [{ id: 'check', kind: 'btn', label: 'Check', primary: cycle >= CYC }];
  const state = () => ({ technique: 'disk', step, cycle, cycles: CYC, errors: err, selected: sel, slots: slots.slice() });
  init();
  return {
    init, items, control, work, tick, draw, attract, titleArt, result: () => done, score: total,
    hint: () => (cycle >= CYC ? 'The cord is finished: press Check.' : !sel ? (step % 2 === 0 ? 'Pick up the lit thread at the lower left.' : 'Pick up the lit thread at the top right.') : 'Put it in the ringed notch.'),
    info: () => [`Turn ${Math.min(cycle + 1, CYC)} of ${CYC}`, `Wrong taps: ${err}`],
    get caption() { return SC.words?.caption ?? 'Braid this cord'; },
    rules: () => [
      'Eight threads sit in four pairs round the disk. Every turn has two moves and a quarter turn of the disk.',
      'First move: the thread at the lower left goes up to the empty notch just left of the top pair. Second move: the thread at the top right goes down to the empty notch just right of the bottom pair. Then the disk turns by itself.',
      'Tap the lit thread, then tap the ringed notch. A wrong tap costs 10 points. Score: the share of the cord you have braided, less 10 points for each wrong tap. Doing nothing scores 0.',
    ],
    point(id) {
      if (!geo) return null;
      if (id === 'from' || id === 'to') { if (done || cycle >= CYC || anim) return null; const mv = nextMove(), q = geo.at(id === 'from' ? mv.from : mv.to); return { x: q[0], y: q[1] }; }
      return null;
    },
    state,
  };
}

registerTechnique('disk', { make: (P, env) => createDisk(P, env), scene: 'kumihimoroom', mat: 'wire' });
void hash; void mix;

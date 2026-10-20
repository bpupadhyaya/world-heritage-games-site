// shape-craft technique `braid` (1.17.0): plaiting flat braids from n strands, seen as a growing braid.
//   The strands hang from an anchor and fan out below the braid. Each step one strand of the braid crosses over its neighbours: the pair that is next lights up,
//   and the player taps the strand that has to go over. The braid grows with every right move (the over strand is drawn on top at every crossing); a wrong tap
//   shakes and costs points. Pattern `over: k`: the strand at the right edge goes over k strands to the left, then the strand at the left edge goes over k strands
//   to the right, and so on (3 strands over 1, 5 strands over 2, 7 strands over 3 are the usual flat plaits).
// Score: the share of the braid that has been plaited, less 12 points for every wrong tap. Doing nothing scores 0.
import { registerTechnique } from './registry.js';
import { starsFor, hash } from './geom.js';
import { rrect, rgba, tint, mix, lum } from './fx.js';
import { wallLift } from './scenes.js';
import { fx as synth } from '../../../platform/engine-kit/synth.js';
import { clamp } from './paint-stroke.js';

const TAU = Math.PI * 2;
const ease = (t) => t * t * (3 - 2 * t);

function createSound(audio) {
  const F = (kind, p) => { try { return synth(audio, kind, p); } catch { return false; } };
  return {
    cross(i) { F('scrape', { hz: 1100 + 90 * (i % 5), dur: 0.12, vel: 0.35 }); F('tick', { hz: 760 + 60 * (i % 4), vel: 0.26 }); },
    wrong() { F('tick', { hz: 300, vel: 0.5 }); },
    done(stars) { F('good', { hz: 660 + stars * 60, vel: 0.55 }); },
  };
}

// the crossings of one full pattern cycle: [column of the left strand of the pair, +1 left strand goes over / -1 right strand goes over]
export function cyclePlan(n, k) {
  const out = [];
  for (let q = 0; q < k; q++) out.push([n - 2 - q, -1]);   // the right edge strand travels left over k strands
  for (let q = 0; q < k; q++) out.push([q, 1]);              // the left edge strand travels right over k strands
  return out;
}

export function createBraid(P, env) {
  const { rng, fx } = env, SC = P.scene ?? {};
  const snd = createSound(env.audio);
  if (env.options?.soundLog) for (const k of Object.keys(snd)) { const f = snd[k]; snd[k] = (...a) => { env.options.soundLog.push({ kind: `braid.${k}` }); return f(...a); }; }
  const N = clamp(P.strands ?? 5, 3, 9), K = clamp(P.over ?? Math.floor((N - 1) / 2), 1, Math.floor((N - 1) / 2) + 1), CYC = P.cycles ?? 4;
  const COL = (P.palette ?? [{ color: '#c8321f' }, { color: '#f2eadb' }, { color: '#1c1a18' }, { color: '#c8321f' }, { color: '#f2eadb' }, { color: '#1c1a18' }, { color: '#c8321f' }, { color: '#f2eadb' }, { color: '#1c1a18' }]).map((c) => c.color);
  const FLAT = P.cord !== 'round', WCORD = P.cordWidth ?? 0.74;
  let plan, pos, k, err, anim, done, geo, now, shake, ghostPulse, auto, ord;

  const init = () => {
    const cyc = cyclePlan(N, K); plan = []; for (let c = 0; c < CYC; c++) for (const s of cyc) plan.push(s);
    ord = Array.from({ length: N }, (_, c) => c);          // strand id at each column
    pos = [ord.slice()];                                     // columns of every strand after each step: pos[j][column] = strand id
    k = 0; err = 0; anim = null; done = null; geo = null; now = 0; shake = -9; ghostPulse = 0; auto = { w: 0.7 };
  };
  const total = () => (done ? done.score : Math.max(0, Math.round(100 * (k / plan.length) - 12 * err)));
  const overCol = () => { const [i, d] = plan[k]; return d > 0 ? i : i + 1; };
  const tap = (col) => {
    if (done || anim || k >= plan.length) return;
    if (col === overCol()) {
      const [i, d] = plan[k], cur = pos[k].slice(), a = cur[i], b = cur[i + 1]; cur[i] = b; cur[i + 1] = a;
      anim = { t: 0, i, d, k }; pos.push(cur); k++; snd.cross(k);
    } else { err++; shake = now; snd.wrong(); }
  };
  const finish = () => {
    if (done) return;
    const score = total(), stars = starsFor(score), W = SC.words ?? {};
    done = { score, max: 100, stars, headline: stars === 3 ? (W.win ?? 'A braid to be proud of') : stars ? (W.ok ?? 'A good braid') : (W.retry ?? 'Back to the strands'), detail: `${k} of ${plan.length} crossings plaited, ${err} wrong ${err === 1 ? 'tap' : 'taps'}` };
    snd.done(stars);
  };
  const control = (id) => { if (id === 'check') finish(); };
  const work = (p) => {
    if (!geo || done) return;
    if (p.pressed) {
      // the strands are tapped where they hang below the braid
      let best = -1, bd = 1e9; for (let c = 0; c < N; c++) { const d = Math.abs(p.x - geo.cx(c)); if (d < bd) { bd = d; best = c; } }
      if (bd < geo.dx * 0.8 && p.y > geo.yw - geo.dy * 1.5) tap(best);
    }
  };
  const tick = (dt) => {
    now += dt; ghostPulse += dt;
    if (anim) { anim.t += dt / 0.28; if (anim.t >= 1) anim = null; }
    if (!done && k >= plan.length && !anim) finish();
  };
  const attract = (dt) => {
    if (done) return;
    if (auto.w > 0) { auto.w -= dt; return; }
    if (!anim && k < plan.length) { tap(overCol()); auto.w = 0.3; }
  };

  // ---- drawing ------------------------------------------------------------------------------------------------------------------------------
  const stroke3 = (ctx, pts, w, c, o = {}) => {
    const path = () => { ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); };
    ctx.lineJoin = 'round'; ctx.lineCap = o.cap ?? 'butt';
    return { out: () => { path(); ctx.strokeStyle = rgba(tint(c, -0.68), 0.95); ctx.lineWidth = w + 3.2; ctx.stroke(); }, base: () => { path(); ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke(); }, light: () => { ctx.save(); ctx.translate(-w * 0.2, 0); path(); ctx.strokeStyle = rgba(tint(c, 0.5), 0.55); ctx.lineWidth = Math.max(1.4, w * 0.22); ctx.stroke(); ctx.restore(); ctx.save(); ctx.translate(w * 0.28, 0); path(); ctx.strokeStyle = rgba(tint(c, -0.35), 0.4); ctx.lineWidth = Math.max(1.2, w * 0.2); ctx.stroke(); ctx.restore(); } };
  };
  const draw = (g, Rt, tt) => {
    const { ctx, pal: PL } = g, W0 = Rt.work, lift = SC.wall ? wallLift(W0) * 0.25 : 0;
    const area = { x: W0.x, y: W0.y + 50 + lift, w: W0.w, h: W0.h - 50 - lift - 6 };
    const dx = Math.min(area.w / (N + 0.8), area.h / 9), cx0 = area.x + area.w / 2 - ((N - 1) * dx) / 2, dy = dx * 1.3, yw = area.y + area.h * 0.7;
    geo = { dx, dy, yw, cx: (c) => cx0 + c * dx };
    const W = dx * WCORD, shk = now - shake < 0.35 ? Math.sin((now - shake) * 60) * 5 * (1 - (now - shake) / 0.35) : 0;
    ctx.save(); ctx.beginPath(); ctx.rect(area.x, W0.y + 30, area.w, area.h + 30); ctx.clip();
    // a soft board behind the braid
    const bw = (N + 1.2) * dx; ctx.fillStyle = 'rgba(0,0,0,0.22)'; rrect(ctx, area.x + area.w / 2 - bw / 2, W0.y + 36, bw, area.h + 20, 14); ctx.fill();
    const prog = anim ? ease(clamp(anim.t, 0, 1)) : 1, kk = k;   // k counts the step in progress as completed; its geometry is interpolated
    const yAt = (j) => yw - (kk - j - (anim ? 1 - prog : 0)) * dy;    // y of the boundary above step j
    const strandsAt = (j) => pos[Math.min(j, pos.length - 1)];
    // where each strand lies at boundary j (column index of strand id)
    const colOf = (j, sid) => strandsAt(j).indexOf(sid);
    const segs = [];
    for (let sid = 0; sid < N; sid++) {
      for (let j = 0; j < kk; j++) {
        const c0 = colOf(j, sid), c1 = colOf(j + 1, sid), y0 = yAt(j), y1 = yAt(j + 1); if (y1 < W0.y - dy || y0 > area.y + area.h + dy) continue;
        const pts = []; const M = c0 === c1 ? 1 : 10; for (let q = 0; q <= M; q++) { const f = q / M, e = c0 === c1 ? f : ease(f); pts.push([cx0 + (c0 + (c1 - c0) * e) * dx, y0 + (y1 - y0) * f]); }
        const [ci, cd] = plan[j], isOver = c0 !== c1 && ((cd > 0 && c0 === ci) || (cd < 0 && c0 === ci + 1));
        segs.push({ pts, sid, over: isOver, cross: c0 !== c1 });
      }
      // loose ends below the working line, gently fanned
      const cL = colOf(kk, sid), top = yw + (anim ? (1 - prog) * 0 : 0);
      segs.push({ pts: [[cx0 + cL * dx, top], [cx0 + cL * dx + (cL - (N - 1) / 2) * dx * 0.05 + (hash(sid, 5) - 0.5) * 6, area.y + area.h + 10]], sid, over: false, cross: false, loose: true });
    }
    // under layer: everything that is not an over segment; then the over segments on top
    for (const layer of [false, true]) {
      const list = segs.filter((s) => s.over === layer); if (!list.length) continue;
      const S = list.map((s) => ({ s, f: stroke3(ctx, s.pts.map((q) => [q[0] + (s.loose ? shk : 0), q[1]]), W, COL[s.sid % COL.length] )}));
      S.forEach((o) => o.f.out()); S.forEach((o) => o.f.base()); S.forEach((o) => o.f.light());
    }
    // the anchor at the top
    const ya = yAt(0) - 18; if (ya > W0.y + 20) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; rrect(ctx, area.x + area.w / 2 - bw / 2 + 6, ya - 2, bw - 12, 16, 7); ctx.fill(); ctx.fillStyle = SC.clampC ?? '#8a8a90'; rrect(ctx, area.x + area.w / 2 - bw / 2 + 6, ya - 6, bw - 12, 14, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(area.x + area.w / 2 - bw / 2 + 12, ya - 4, bw - 24, 2); }
    // the next crossing: pulse the pair, mark the strand that must go over
    if (!done && k < plan.length && !anim) {
      const [i, d] = plan[k], pu = 0.5 + 0.5 * Math.sin(ghostPulse * 6), oc = overCol();
      ctx.strokeStyle = rgba(PL.accent, 0.4 + 0.4 * pu); ctx.lineWidth = 3; ctx.setLineDash([6, 6]); rrect(ctx, cx0 + i * dx - W * 0.7, yw - dy * 0.15, dx + W * 1.4, dy * 1.5, 12); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = rgba(PL.accent, 0.6 + 0.4 * pu); const ax = cx0 + oc * dx, ay = yw + dy * 1.7, dirx = d > 0 ? 1 : -1; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax - dirx * 0 - 11, ay + 15); ctx.lineTo(ax + 11, ay + 15); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba(PL.accent, 0.8); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax, ay + 24); ctx.lineTo(ax + dirx * dx * 0.7, ay + 24); ctx.stroke(); ctx.beginPath(); ctx.moveTo(ax + dirx * dx * 0.7, ay + 24); ctx.lineTo(ax + dirx * (dx * 0.7 - 9), ay + 18); ctx.lineTo(ax + dirx * (dx * 0.7 - 9), ay + 30); ctx.closePath(); ctx.fillStyle = rgba(PL.accent, 0.8); ctx.fill();
    }
    ctx.restore();
    // progress
    const pb = Math.min(W0.w - 40, 260), pbx = W0.x + (W0.w - pb) / 2, pby = W0.y + W0.h - 12; ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, pbx, pby, pb, 7, 4); ctx.fill(); ctx.fillStyle = PL.accent; rrect(ctx, pbx, pby, pb * (k / plan.length), 7, 4); ctx.fill();
    const hintTxt = done ? '' : k >= plan.length ? '' : `Tap the ${COL.length ? 'lit' : ''} strand that goes over.`;
    if (hintTxt) { ctx.font = `600 ${Math.round(g.px(20))}px system-ui, sans-serif`; const tw = Math.min(W0.w - 16, ctx.measureText(hintTxt).width + 28), ph = g.px(20) + 14; rrect(ctx, W0.x + (W0.w - tw) / 2, W0.y + 18 - ph / 2, tw, ph, ph / 2); ctx.fillStyle = 'rgba(12,10,8,0.62)'; ctx.fill(); g.label(ctx, hintTxt, W0.x + W0.w / 2, W0.y + 18, g.px(20), '#f4efe6', 'center', '600'); }
    // reference: the finished braid
    const th = Rt.thumb, tdx = Math.min((th.w - 16) / (N + 0.6), (th.h - 16) / 9), tcx0 = th.x + th.w / 2 - ((N - 1) * tdx) / 2, tdy = tdx * 1.3, steps = Math.min(plan.length, Math.floor((th.h - 14) / tdy));
    const fin = [Array.from({ length: N }, (_, c) => c)]; for (let j = 0; j < steps; j++) { const [i] = plan[j], cur = fin[j].slice(); const a = cur[i]; cur[i] = cur[i + 1]; cur[i + 1] = a; fin.push(cur); }
    ctx.save(); ctx.beginPath(); ctx.rect(th.x, th.y, th.w, th.h); ctx.clip(); const segs2 = [];
    for (let sid = 0; sid < N; sid++) for (let j = 0; j < steps; j++) { const c0 = fin[j].indexOf(sid), c1 = fin[j + 1].indexOf(sid), y0 = th.y + 8 + j * tdy, y1 = y0 + tdy, pts = []; const M = c0 === c1 ? 1 : 8; for (let q = 0; q <= M; q++) { const f = q / M, e = c0 === c1 ? f : ease(f); pts.push([tcx0 + (c0 + (c1 - c0) * e) * tdx, y0 + (y1 - y0) * f]); } const [ci, cd] = plan[j]; segs2.push({ pts, sid, over: c0 !== c1 && ((cd > 0 && c0 === ci) || (cd < 0 && c0 === ci + 1)) }); }
    for (const layer of [false, true]) { const S = segs2.filter((s) => s.over === layer).map((s) => stroke3(ctx, s.pts, tdx * WCORD, COL[s.sid % COL.length])); S.forEach((o) => o.out()); S.forEach((o) => o.base()); S.forEach((o) => o.light()); }
    ctx.restore();
  };
  const titleArt = (g, S, t) => { const R2 = { work: S, thumb: { x: -999, y: -999, w: 1, h: 1 } }; void R2; const { ctx } = g; const dx = Math.min(S.w / (N + 1), S.h / 12), cx0 = S.x + S.w / 2 - ((N - 1) * dx) / 2, dy = dx * 1.3, steps = 9; const fin = [Array.from({ length: N }, (_, c) => c)]; for (let j = 0; j < steps; j++) { const [i] = plan[j % plan.length], cur = fin[j].slice(); const a = cur[i]; cur[i] = cur[i + 1]; cur[i + 1] = a; fin.push(cur); } const y00 = S.y + S.h * 0.1 + Math.sin(t ?? 0) * 3, segs = []; for (let sid = 0; sid < N; sid++) for (let j = 0; j < steps; j++) { const c0 = fin[j].indexOf(sid), c1 = fin[j + 1].indexOf(sid), y0 = y00 + j * dy, y1 = y0 + dy, pts = []; const M = c0 === c1 ? 1 : 8; for (let q = 0; q <= M; q++) { const f = q / M, e = c0 === c1 ? f : ease(f); pts.push([cx0 + (c0 + (c1 - c0) * e) * dx, y0 + (y1 - y0) * f]); } const [ci, cd] = plan[j % plan.length]; segs.push({ pts, sid, over: c0 !== c1 && ((cd > 0 && c0 === ci) || (cd < 0 && c0 === ci + 1)) }); } for (const layer of [false, true]) { const L = segs.filter((s) => s.over === layer).map((s) => stroke3(ctx, s.pts, dx * WCORD, COL[s.sid % COL.length])); L.forEach((o) => o.out()); L.forEach((o) => o.base()); L.forEach((o) => o.light()); } };

  const items = () => [{ id: 'check', kind: 'btn', label: 'Check', primary: k >= plan.length }];
  const state = () => ({ technique: 'braid', strands: N, over: K, step: k, steps: plan.length, errors: err, order: pos[pos.length - 1].slice() });
  init();
  return {
    init, items, control, work, tick, draw, attract, titleArt, result: () => done, score: total,
    hint: () => (k < plan.length ? `Tap strand ${overCol() + 1} from the left: it goes over its neighbour.` : 'The braid is finished: press Check.'),
    info: () => [`Crossing ${Math.min(k + 1, plan.length)} of ${plan.length}`, `Wrong taps: ${err}`],
    get caption() { return SC.words?.caption ?? 'Plait this braid'; },
    rules: () => [
      `The braid has ${N} strands. At every step one strand goes over its neighbour: the pair that is next is outlined and an arrow shows which way the over strand travels.`,
      'Tap the strand that has to go over. A right tap plaits one crossing; a wrong tap costs 12 points.',
      `Plait every crossing: ${plan.length} in all. Score: the share of the braid you have plaited, less 12 points for each wrong tap. Doing nothing scores 0.`,
    ],
    point(id) {
      if (!geo) return null;
      if (id === 'over' && k < plan.length) return { x: geo.cx(overCol()), y: geo.yw + geo.dy * 0.8 };
      if (id === 'wrong' && k < plan.length) { const oc = overCol(); const c = oc === 0 ? 1 : oc - 1; return { x: geo.cx(c), y: geo.yw + geo.dy * 0.8 }; }
      return null;
    },
    state,
  };
}

registerTechnique('braid', { make: (P, env) => createBraid(P, env), scene: 'gaitan', mat: 'wire' });
void lum; void mix; void TAU;

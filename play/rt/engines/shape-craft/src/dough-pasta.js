// dough technique, mode "orecchiette": handmade pasta from Puglia. Roll the semolina dough into an even rope (drag back and forth along it,
// the dough thins and lengthens under the pointer), cut it into eight equal pieces, then shape each piece: drag it across the board with the
// knife to curl it, and flick it over the thumb into a little ear. Score: the rope, the equality of the pieces, thin centre and thick rim,
// the flip, and the rhythm of the tray.
import { starsFor, hash } from './geom.js';
import { shadowed, rrect, rgba, tint, mix } from './fx.js';
import { lg, rg, TAU, flour, flourCloud, drawHand, board, drawPulses } from './dough-art.js';
import { clamp, lerp, sm, r3, mean, sd, makeSound, stageGeom, createPilot } from './dough-core.js';
import { hintPill, dockGauge } from './paint-ui.js';

const SW = 1.4, SH = 0.86, N = 48, TS = 0.072, NP = 8, RYO = 0.24, WORK = [0.38, 0.54], DSTAR = 0.2, VSTAR = 0.6, BEAT = 3.5;
const SEMO = '#e9c268';
const TRAY = { x: 0.96, y: 0.12, w: 0.4, h: 0.62 };
const slotXY = (k) => [TRAY.x + TRAY.w * (0.27 + 0.46 * (k % 2)), TRAY.y + TRAY.h * (0.13 + 0.25 * Math.floor(k / 2))];

// ---------------------------------------------------------------------------------------------------------------------------------------------
// pieces of dough
function semolina(ctx, cx, cy, rx, ry, n, seed, a = 0.55) { flour(ctx, cx, cy, rx, ry, n, seed, a, 0.0032, '#fff0c0'); }
function blob(ctx, x, y, rx, ry, rot, o = {}) { // a lump of semolina dough: matte, rough, lit from the upper left
  const c = o.c ?? SEMO;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.save(); ctx.shadowColor = 'rgba(40,22,6,0.5)'; ctx.shadowBlur = o.blur ?? 5; ctx.shadowOffsetX = 1.5; ctx.shadowOffsetY = 3;
  ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fillStyle = rg(ctx, 0, 0, Math.min(rx, ry) * 0.1, Math.max(rx, ry) * 1.1, [[0, tint(c, 0.22)], [0.55, c], [1, tint(c, -0.32)]], -rx * 0.3, -ry * 0.4); ctx.fill(); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.clip();
  semolina(ctx, 0, 0, rx * 0.95, ry * 0.95, Math.round(10 + rx * ry * 9000), o.seed ?? 5, 0.5);
  ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.ellipse(-rx * 0.3, -ry * 0.45, rx * 0.4, ry * 0.18, -0.3, 0, TAU); ctx.fill();
  ctx.restore(); ctx.restore();
}
// a short cut length of rope: a lit cylinder with a pale cut face at each end
function cylinder(ctx, x, y, hl, r, rot, seed) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.save(); ctx.shadowColor = 'rgba(40,22,6,0.5)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 3; rrect(ctx, -hl, -r, hl * 2, r * 2, r * 0.9); ctx.fillStyle = lg(ctx, 0, -r, 0, r, [[0, tint(SEMO, 0.32)], [0.35, tint(SEMO, 0.08)], [0.7, SEMO], [1, tint(SEMO, -0.42)]]); ctx.fill(); ctx.restore();
  ctx.save(); rrect(ctx, -hl, -r, hl * 2, r * 2, r * 0.9); ctx.clip(); semolina(ctx, 0, 0, hl, r, 22, seed, 0.55);
  ctx.fillStyle = 'rgba(255,244,200,0.5)'; ctx.beginPath(); ctx.ellipse(-hl + r * 0.35, 0, r * 0.4, r * 0.8, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(hl - r * 0.35, 0, r * 0.4, r * 0.8, 0, 0, TAU); ctx.fill(); ctx.restore();
  ctx.restore();
}
// a curled shell: the piece dragged across the board, its leading edge rolled over and a flat tail behind it
function shell(ctx, x, y, r, dir, len, seed) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(dir);
  const L = r * (1.2 + len * 5), W = r * 1.25;
  ctx.save(); ctx.shadowColor = 'rgba(40,22,6,0.5)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 3;
  ctx.beginPath(); ctx.moveTo(-L * 0.5, -W * 0.32); ctx.quadraticCurveTo(-L * 0.1, -W * 1.0, L * 0.45, -W * 0.7); ctx.quadraticCurveTo(L * 0.62, 0, L * 0.45, W * 0.7); ctx.quadraticCurveTo(-L * 0.1, W * 1.0, -L * 0.5, W * 0.32); ctx.quadraticCurveTo(-L * 0.58, 0, -L * 0.5, -W * 0.32); ctx.closePath();
  ctx.fillStyle = lg(ctx, -L * 0.5, -W, L * 0.5, W, [[0, tint(SEMO, 0.22)], [0.5, SEMO], [1, tint(SEMO, -0.3)]]); ctx.fill(); ctx.restore();
  // the thin flat centre and the rolled rim at the front
  ctx.fillStyle = 'rgba(250,228,160,0.5)'; ctx.beginPath(); ctx.ellipse(-L * 0.05, 0, L * 0.3, W * 0.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = lg(ctx, L * 0.2, 0, L * 0.62, 0, [[0, tint(SEMO, 0.1)], [0.6, tint(SEMO, -0.12)], [1, tint(SEMO, -0.34)]]); ctx.beginPath(); ctx.moveTo(L * 0.28, -W * 0.7); ctx.quadraticCurveTo(L * 0.62, 0, L * 0.28, W * 0.7); ctx.quadraticCurveTo(L * 0.4, 0, L * 0.28, -W * 0.7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,240,190,0.5)'; ctx.lineWidth = 0.0032; ctx.beginPath(); ctx.moveTo(L * 0.3, -W * 0.62); ctx.quadraticCurveTo(L * 0.55, 0, L * 0.3, W * 0.62); ctx.stroke();
  semolina(ctx, 0, 0, L * 0.45, W * 0.8, 40, seed, 0.5);
  ctx.restore();
}
// the little ear: a cup with a thick rim and a thin pale centre, a rough outer skin from the knife. Concave: the inner wall is shaded on the upper left and lit on the lower right.
function ear(ctx, x, y, r, o = {}) {
  const { thin = 1, rim = 1, tilt = -0.3, seed = 3, a = 1, squash = 1 } = o;
  const edge = (t) => r * (1 + 0.05 * Math.sin(3 * t + seed) + 0.03 * Math.sin(5 * t + seed * 2));
  const path = (k) => { ctx.beginPath(); for (let i = 0; i <= 40; i++) { const t = (i / 40) * TAU, e = edge(t) * k; const px = Math.cos(t) * e, py = Math.sin(t) * e * 0.9; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.closePath(); };
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(1, squash);
  ctx.save(); ctx.translate(r * 0.1, r * 0.2); path(1.02); ctx.fillStyle = 'rgba(40,22,6,0.34)'; ctx.shadowColor = 'rgba(40,22,6,0.4)'; ctx.shadowBlur = r * 0.3; ctx.fill(); ctx.restore();
  path(1); ctx.fillStyle = rg(ctx, 0, 0, r * 0.2, r * 1.08, [[0, tint(SEMO, 0.1)], [0.6, SEMO], [0.88, tint(SEMO, -0.12)], [1, tint(SEMO, -0.34)]], -r * 0.25, -r * 0.3); ctx.fill();
  ctx.save(); path(1); ctx.clip();
  // the thick rim: a lit ridge on the upper left, a shaded one on the lower right
  ctx.strokeStyle = 'rgba(255,244,200,0.7)'; ctx.lineWidth = r * 0.09; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r * 0.8, 0, Math.PI * 1.02, Math.PI * 1.62); ctx.stroke();
  ctx.strokeStyle = `rgba(110,70,16,${0.3 + 0.1 * rim})`; ctx.lineWidth = r * 0.12; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r * 0.8, 0, Math.PI * 0.05, Math.PI * 0.62); ctx.stroke();
  // the hollow: pale and thin, dark inside the upper-left wall, lit on the lower-right wall
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, r * 0.62, r * 0.54, 0, 0, TAU); ctx.clip();
  ctx.fillStyle = lg(ctx, -r * 0.6, -r * 0.5, r * 0.6, r * 0.5, [[0, tint(SEMO, -0.35)], [0.35, tint(SEMO, -0.04)], [0.7, tint(SEMO, 0.22)], [1, tint(SEMO, 0.4)]]); ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.fillStyle = `rgba(255,246,206,${0.3 * thin})`; ctx.beginPath(); ctx.ellipse(r * 0.1, r * 0.08, r * 0.35, r * 0.28, 0, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(90,56,10,0.4)'; ctx.lineWidth = r * 0.03; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.62, r * 0.54, 0, 0, TAU); ctx.stroke();
  // rough, ridged outer skin
  ctx.strokeStyle = 'rgba(150,100,30,0.3)'; ctx.lineWidth = 0.0025; for (let k = 0; k < 22; k++) { const ang = hash(k, seed) * TAU, r1 = r * 0.7, r2 = r * (0.9 + hash(k, seed + 1) * 0.1); ctx.beginPath(); ctx.moveTo(Math.cos(ang) * r1, Math.sin(ang) * r1 * 0.88); ctx.lineTo(Math.cos(ang) * r2, Math.sin(ang) * r2 * 0.88); ctx.stroke(); }
  semolina(ctx, 0, 0, r * 0.95, r * 0.85, 46, seed, 0.6);
  ctx.restore(); ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
export function createPasta(P, env) {
  const { rng, fx } = env, SC = P.scene ?? {};
  const snd = makeSound(env, (F) => ({
    roll(v) { F('scrape', { hz: 380 + v * 220, dur: 0.1, vel: 0.2 }); },
    cut() { F('impact', { mat: 'wood', hz: 340, vel: 0.5 }); F('tick', { hz: 2400, vel: 0.16, delay: 0.01 }); },
    pick() { F('tick', { hz: 1500, vel: 0.16 }); },
    drag(v) { F('scrape', { hz: 650 + v * 500, dur: 0.12, vel: 0.22 }); },
    curl() { F('impact', { mat: 'clay', hz: 210, vel: 0.3 }); },
    flip(q) { F('pop', { hz: 360 + q * 120, vel: 0.4 }); F('thud', { hz: 110, vel: 0.2, delay: 0.03 }); },
    bad() { F('bad', { hz: 210, vel: 0.28 }); },
    tray() { F('tick', { hz: 1900, vel: 0.24 }); F('thud', { hz: 130, vel: 0.14, delay: 0.02 }); },
    win(stars) { F('good', { hz: 600 + stars * 70, vel: 0.5 }); F('chime', { hz: 1180, vel: 0.28, delay: 0.1 }); },
    mode() { F('tick', { hz: 1500, vel: 0.3 }); },
  }), 'pasta');
  const pilot = createPilot();
  let pulses, trails, th, th0v, vol0, phase, rolling, rollTravel, cuts, pieces, cur, drag, flick, doneAt, intervals, done, guide, now, geo, lastP, ptr, handAt, flash, glide, V, VT, LP, strokes, parkQ, aimDir;

  const init = () => {
    const m = 0.108 + rng.next() * 0.012; th = []; for (let i = 0; i < N; i++) th.push(m * (1 + 0.1 * Math.sin(i * 0.7 + rng.next() * 6.28) + 0.18 * Math.pow((i - N / 2) / (N / 2), 2) * -1) * (0.95 + rng.next() * 0.1));
    vol0 = th.map((v) => v * v * 0.0062); VT = vol0.reduce((s, v) => s + v, 0); V = VT / NP; LP = VT / (TS * TS) / NP;
    pulses = []; trails = []; phase = 'roll'; rolling = false; rollTravel = 0; cuts = []; pieces = []; cur = 0; drag = null; flick = null; doneAt = []; intervals = []; done = null; guide = 1; now = 0; lastP = null; ptr = null; handAt = null; flash = { t: -9, k: '' }; glide = 0; strokes = 0; parkQ = [];
    aimDir = 0.55 + (rng.next() - 0.5) * 0.3; pilot.clear();
  };
  // rope geometry: segment i carries a fixed volume, so a thin place is a long place
  const segs = () => { const dx = th.map((t, i) => vol0[i] / (t * t)), L = dx.reduce((s, v) => s + v, 0); let x = 0.5 - L / 2; const X = [], E = [x]; for (let i = 0; i < N; i++) { X.push(x + dx[i] / 2); x += dx[i]; E.push(x); } return { X, E, dx, L }; };
  const idealCut = (k) => { let acc = 0; const g = segs(); for (let i = 0; i < N; i++) { if (acc + vol0[i] >= k * V) { const f = (k * V - acc) / vol0[i]; return g.E[i] + g.dx[i] * f; } acc += vol0[i]; } return g.E[N]; };
  const volBetween = (a, b) => { const g = segs(); let s = 0; for (let i = 0; i < N; i++) { const lo = Math.max(a, g.E[i]), hi = Math.min(b, g.E[i + 1]); if (hi > lo) s += vol0[i] * (hi - lo) / g.dx[i]; } return s; };

  // ---- scoring
  const ropeScore = () => { const r = th.map((t) => t / TS), e = r.map((v) => Math.abs(v - 1)), mae = mean(e), s = e.slice().sort((a, b) => a - b), p90 = s[Math.floor(N * 0.9)]; return 0.6 * (1 - clamp((mae - 0.03) / 0.17, 0, 1)) + 0.4 * (1 - clamp((p90 - 0.1) / 0.3, 0, 1)); };
  const cutScore = () => { if (!pieces.length) return 0; const err = pieces.map((p) => Math.abs(p.vol - V) / V); return 1 - clamp((mean(err) - 0.04) / 0.3, 0, 1); };
  const pieceScore = (p) => (p.shaped ? 0.4 * p.thin + 0.3 * p.rim + 0.3 * p.flip : 0);
  const rhythmScore = () => { if (intervals.length < 3) return 0; const m = mean(intervals), cv = sd(intervals) / (m || 1); return 0.6 * (1 - clamp((cv - 0.08) / 0.4, 0, 1)) + 0.4 * clamp(1 - (m - 3.5) / 6, 0, 1); };
  const parts = () => {
    const shaped = pieces.filter((p) => p.shaped).length, shapeAgg = pieces.length ? pieces.reduce((s, p) => s + pieceScore(p) * (0.75 + 0.25 * clamp(1 - Math.abs(p.vol - V) / V / 0.3, 0, 1)), 0) / NP : 0;
    return { rope: phase === 'roll' && !strokes ? 0 : ropeScore(), cut: cutScore(), shape: shapeAgg, rhythm: rhythmScore(), shaped };
  };
  const rawScore = () => { const p = parts(); return 100 * (0.1 * p.rope + 0.15 * p.cut * (pieces.length === NP ? 1 : pieces.length / NP) + 0.55 * p.shape + 0.2 * p.rhythm); };
  const score = () => (done ? done.score : Math.round(rawScore()));
  const finish = () => {
    if (done) return;
    const p = parts(), sc = Math.round(rawScore()), stars = starsFor(sc);
    done = { score: sc, max: 100, stars, headline: stars === 3 ? 'A tray of fine orecchiette' : stars ? 'Good pasta' : 'Back to the board', detail: `rope ${Math.round(p.rope * 100)} percent, pieces ${Math.round(p.cut * 100)} percent, shaping ${Math.round(p.shape * NP / pieces.length * 100)} percent, rhythm ${Math.round(p.rhythm * 100)} percent` };
    snd.win(stars);
  };

  // ---- input in design units
  const workD = (p, dt) => {
    if (done) return;
    const prev = lastP; lastP = { x: p.x, y: p.y };
    const touchD = geo ? geo.touch / geo.s : 0.1, cap = Math.max(0.08, touchD * 0.8);
    if (phase === 'roll') {
      if (p.pressed && Math.abs(p.y - RYO) <= 0.17 && p.x > 0.02 && p.x < 0.98) { rolling = true; handAt = { x: p.x, y: p.y }; }
      if (rolling && p.down && prev) {
        const adx = Math.abs(p.x - prev.x); handAt = { x: p.x, y: p.y };
        if (adx > 0.001 && Math.abs(p.y - RYO) <= 0.2) {
          const g = segs(); let hit = false; for (let i = 0; i < N; i++) { const w = Math.exp(-Math.pow((g.X[i] - p.x) / 0.075, 2)); if (w > 0.05) { th[i] = Math.max(0.026, th[i] - 0.09 * adx * w * clamp((th[i] - 0.78 * TS) / (0.5 * TS), 0, 1.5)); hit = true; } }
          if (hit) { rollTravel += adx; strokes++; if (Math.floor(rollTravel * 5) !== Math.floor((rollTravel - adx) * 5)) snd.roll(adx / dt / 3); }
        }
      }
      if (rolling && (p.released || !p.down)) rolling = false;
    } else if (phase === 'cut') {
      if (p.pressed && Math.abs(p.y - RYO) <= 0.14) {
        const g = segs(), lastC = cuts.length ? cuts[cuts.length - 1] : g.E[0];
        if (p.x > lastC + 0.012 && p.x < g.E[N] - 0.012) { cuts.push(p.x); pulses.push({ x: p.x, y: RYO, t: now }); snd.cut(); handAt = { x: p.x, y: p.y, cut: now }; if (cuts.length === NP - 1) endCuts(); }
        else { snd.bad(); flash = { t: now, k: 'cut' }; }
      }
    } else if (phase === 'shape') {
      const pc = pieces[cur]; if (!pc) return;
      if (glide < 1) return;
      if (pc.state === 'work') {
        if (p.pressed && !drag && Math.hypot(p.x - WORK[0], p.y - WORK[1]) <= cap) { drag = { x0: p.x, y0: p.y, t0: now, sp: [], lx: p.x, ly: p.y }; handAt = { x: p.x, y: p.y }; snd.pick(); }
        if (drag && p.down) { const d = Math.hypot(p.x - drag.lx, p.y - drag.ly); drag.sp.push(d / Math.max(dt, 1e-4)); drag.lx = p.x; drag.ly = p.y; drag.x = p.x; drag.y = p.y; handAt = { x: p.x, y: p.y }; pc.dragLen = Math.hypot(p.x - drag.x0, p.y - drag.y0); pc.dir = Math.atan2(p.y - drag.y0, p.x - drag.x0); if (d > 0.002) snd.drag(d / dt / 2); }
        if (drag && (p.released || !p.down)) {
          const d = drag; drag = null;
          const len = Math.hypot((d.x ?? d.x0) - d.x0, (d.y ?? d.y0) - d.y0);
          if (len < 0.05) { pc.dragLen = 0; snd.bad(); flash = { t: now, k: 'short' }; }
          else {
            const mid = d.sp.slice(Math.floor(d.sp.length * 0.15), Math.max(Math.floor(d.sp.length * 0.15) + 1, Math.floor(d.sp.length * 0.85))), cv = mid.length > 2 ? sd(mid) / (mean(mid) || 1) : 0.5;
            pc.thin = clamp(1 - Math.abs(len - DSTAR) / 0.09, 0, 1); pc.rim = clamp(1 - (cv - 0.15) / 0.5, 0, 1); pc.len = len; pc.dir = Math.atan2(d.y - d.y0, d.x - d.x0); pc.state = 'curled'; pc.cx = d.x0 + (d.x - d.x0) * 0.5; pc.cy = d.y0 + (d.y - d.y0) * 0.5; trails.push({ x0: d.x0, y0: d.y0, x1: d.x, y1: d.y, seed: pc.seed }); if (geo) { const q = toScr(d.x, d.y); fx.emit('dust', q.x, q.y, { count: 7, color: '#fff0c0', size: 3.5, speed: 40, life: 0.6, gravity: 10 }); } snd.curl();
          }
        }
      } else if (pc.state === 'curled') {
        if (p.pressed && !flick && Math.hypot(p.x - pc.cx, p.y - pc.cy) <= cap * 1.2) { flick = { x0: p.x, y0: p.y, t0: now }; handAt = { x: p.x, y: p.y }; }
        if (flick && p.down) { const sp2 = Math.hypot(p.x - (flick.x ?? flick.x0), p.y - (flick.y ?? flick.y0)) / Math.max(dt, 1e-4); if (sp2 > 0.08) { flick.path = (flick.path ?? 0) + sp2 * dt; flick.mv = (flick.mv ?? 0) + dt; } flick.x = p.x; flick.y = p.y; handAt = { x: p.x, y: p.y }; flick.maxUp = Math.max(flick.maxUp ?? 0, flick.y0 - p.y); }
        if (flick && (p.released || !p.down)) {
          const f = flick; flick = null; const up = (f.y0 - (f.y ?? f.y0)), len = Math.hypot((f.x ?? f.x0) - f.x0, (f.y ?? f.y0) - f.y0);
          if (len < 0.045 || up < len * 0.5) { snd.bad(); flash = { t: now, k: len < 0.045 ? 'flipshort' : 'flipway' }; }
          else { const v = (f.path ?? len) / Math.max(f.mv ?? 0.2, 0.04); pc.flip = clamp(1 - Math.abs(v - VSTAR) / 0.4, 0, 1); pc.v = v; pc.state = 'ear'; pc.shaped = true; pc.earT = now; snd.flip(pc.flip); pulses.push({ x: pc.cx, y: pc.cy, t: now, col: pc.flip > 0.8 ? '#d8ffe4' : '#ffe8a0' }); doneAt.push(now); if (doneAt.length > 1) intervals.push(now - doneAt[doneAt.length - 2]); parkQ.push(cur); cur++; glide = 0; const nx = pieces[cur]; if (nx) nx.state = 'queue'; else finishAll(); }
        }
      }
    }
  };
  const endCuts = () => {
    const g = segs(), b = [g.E[0], ...cuts, g.E[N]];
    pieces = []; for (let k = 0; k < NP; k++) { const vol = volBetween(b[k], b[k + 1]), x = (b[k] + b[k + 1]) / 2, len = b[k + 1] - b[k]; pieces.push({ vol, x, len, state: 'cutrow', thin: 0, rim: 0, flip: 0, shaped: false, seed: k + 2, tilt: (rng.next() - 0.5) * 0.5 }); }
    phase = 'shape'; cur = 0; pieces[0].state = 'queue'; glide = 0;
  };
  const finishAll = () => { setTimeoutFinish = 1.3; };
  let setTimeoutFinish = 0;
  const work = (p) => { if (!geo) return; workD({ x: (p.x - geo.ox) / geo.s, y: (p.y - geo.oy) / geo.s, down: p.down, pressed: p.pressed, released: p.released }, 1 / 60); };
  const control = (id) => {
    if (done) return;
    if (id === 'next' && phase === 'roll' && strokes > 0) { phase = 'cut'; snd.mode(); }
    else if (id === 'undo' && phase === 'cut' && cuts.length) { cuts.pop(); snd.mode(); }
    else if (id === 'guide') { guide = (guide + 1) % 3; snd.mode(); }
  };
  const items = () => { const a = []; if (phase === 'roll') a.push({ id: 'next', kind: 'btn', label: 'Cut it', primary: strokes > 0, off: strokes === 0 }); if (phase === 'cut') a.push({ id: 'undo', kind: 'btn', label: 'Undo', off: !cuts.length }); a.push({ id: 'guide', kind: 'btn', label: ['Guide on', 'Faint', 'No guide'][guide] }); return a; };
  const tick = (dt) => {
    now += dt;
    if (phase === 'shape' && pieces[cur] && glide < 1) { glide = Math.min(1, glide + dt / 0.38); if (glide >= 1 && pieces[cur].state === 'queue') pieces[cur].state = 'work'; }
    if (setTimeoutFinish > 0) { setTimeoutFinish -= dt; if (setTimeoutFinish <= 0) finish(); }
  };

  // ---- Watch and learn
  const attract = (dt) => {
    if (done) return;
    if (!pilot.busy()) {
      if (phase === 'roll') {
        const g = segs(), ex = th.map((t, i) => t - TS * 1.04);
        let best = -1, bv = 0.04 * TS; for (let i = 0; i < N; i++) { const sm3 = (ex[i - 1] ?? ex[i]) + ex[i] + (ex[i + 1] ?? ex[i]); if (sm3 / 3 > bv) { bv = sm3 / 3; best = i; } }
        if (best < 0 || strokes === 0 && best < 0) { if (strokes > 0) control('next'); else pilot.push({ pts: [[0.5, RYO], [0.62, RYO]], dur: [0.3], hold: 0.02, lead: 0.5 }); }
        else { const cx = g.X[best], lo = Math.max(0.08, cx - 0.1), hi = Math.min(0.92, cx + 0.1); pilot.push({ pts: [[lo, RYO], [hi, RYO], [lo, RYO]], dur: [0.28, 0.28], linear: true, hold: 0.02, lead: strokes ? 0.2 : 0.7 }); }
      } else if (phase === 'cut') {
        const k = cuts.length + 1; if (k <= NP - 1) { const x = idealCut(k); pilot.push({ pts: [[x, RYO]], hold: 0.05, lead: 0.3 }); }
      } else if (phase === 'shape' && glide >= 1) {
        const pc = pieces[cur]; if (!pc) return;
        if (pc.state === 'work') { const dir = aimDir, ex = WORK[0] + Math.cos(dir) * DSTAR, ey = WORK[1] + Math.sin(dir) * DSTAR; pilot.push({ pts: [[WORK[0], WORK[1]], [ex, ey]], dur: [0.45], linear: true, hold: 0.06, lead: 0.25 }); }
        else if (pc.state === 'curled') { const d = 0.09, T = d / VSTAR; pilot.push({ pts: [[pc.cx, pc.cy], [pc.cx, pc.cy - d]], dur: [T], linear: true, hold: 0.02, lead: 0.22 }); }
      }
    }
    const p = pilot.step(dt); ptr = { x: p.x, y: p.y, down: p.down }; workD({ x: p.x, y: p.y, down: p.down, pressed: p.pressed, released: p.released }, dt);
  };

  // ---- drawing
  const hintText = () => {
    if (done) return '';
    if (now - flash.t < 2) return { cut: 'Tap the rope between the marks to cut it.', short: 'Drag the piece further across the board.', flipshort: 'A quicker flick upward over the thumb.', flipway: 'Flick upward, over the thumb.' }[flash.k] ?? '';
    if (phase === 'roll') return strokes ? 'Roll until the rope fills the lit lines all along, then press Cut it.' : 'Drag back and forth along the rope: the dough thins and lengthens under your fingers.';
    if (phase === 'cut') return `Tap the rope at each lit mark to cut ${NP} equal pieces (${cuts.length} of ${NP - 1} cuts).`;
    const pc = pieces[cur]; if (!pc) return '';
    return pc.state === 'curled' ? 'Now flick the piece upward over the thumb to turn it into an ear.' : 'Drag the piece across the board with the knife, steady and not too far.';
  };
  const drawRope = (ctx, g, t) => {
    const top = (i) => RYO - th[i] / 2, bot = (i) => RYO + th[i] / 2;
    ctx.save(); ctx.shadowColor = 'rgba(40,22,6,0.5)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
    ctx.beginPath(); ctx.moveTo(g.E[0], RYO); ctx.lineTo(g.X[0], top(0)); for (let i = 1; i < N; i++) ctx.lineTo(g.X[i], top(i)); ctx.lineTo(g.E[N], RYO); for (let i = N - 1; i >= 0; i--) ctx.lineTo(g.X[i], bot(i)); ctx.closePath();
    ctx.fillStyle = lg(ctx, 0, RYO - 0.06, 0, RYO + 0.06, [[0, tint(SEMO, 0.3)], [0.3, tint(SEMO, 0.1)], [0.6, SEMO], [1, tint(SEMO, -0.4)]]); ctx.fill(); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.moveTo(g.E[0], RYO); ctx.lineTo(g.X[0], top(0)); for (let i = 1; i < N; i++) ctx.lineTo(g.X[i], top(i)); ctx.lineTo(g.E[N], RYO); for (let i = N - 1; i >= 0; i--) ctx.lineTo(g.X[i], bot(i)); ctx.closePath(); ctx.clip();
    ctx.strokeStyle = 'rgba(255,248,215,0.5)'; ctx.lineWidth = 0.004; ctx.beginPath(); for (let i = 0; i < N; i++) { const y = RYO - th[i] * 0.22; if (i) ctx.lineTo(g.X[i], y); else ctx.moveTo(g.X[i], y); } ctx.stroke();
    semolina(ctx, 0.5, RYO, g.L / 2, 0.05, 260, 7, 0.55);
    ctx.strokeStyle = 'rgba(150,100,30,0.18)'; ctx.lineWidth = 0.0025; for (let k = 0; k < 40; k++) { const x = g.E[0] + g.L * hash(k, 3), y = RYO + (hash(k, 4) - 0.5) * 0.05; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.012, y + (hash(k, 5) - 0.5) * 0.01); ctx.stroke(); }
    ctx.restore(); void t;
  };
  const hand = (ctx, s, x, y, ang, pose, open = 0) => drawHand(ctx, x, y, { rot: ang, k: s * 0.0021, pose, open, skin: SC.skin, sleeve: SC.sleeve });
  const drawKnife = (ctx, x, y, s, ang) => { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 7; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 7; const L = s * 0.3, h = s * 0.034; ctx.fillStyle = lg(ctx, 0, -h, 0, h, [[0, '#f8fafb'], [0.5, '#b8c1ca'], [1, '#6c7680']]); ctx.beginPath(); ctx.moveTo(0, -h * 0.35); ctx.lineTo(L * 0.62, -h); ctx.quadraticCurveTo(L * 0.74, -h * 0.9, L * 0.7, h * 0.2); ctx.lineTo(0, h * 0.6); ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent'; rrect(ctx, L * 0.66, -h * 0.55, L * 0.38, h * 1.1, h * 0.45); ctx.fillStyle = lg(ctx, 0, -h, 0, h, [[0, '#a8794a'], [0.5, '#7a4e26'], [1, '#4a2c12']]); ctx.fill(); ctx.restore(); };
  const toScr = (u, v) => ({ x: geo.ox + u * geo.s, y: geo.oy + v * geo.s });
  const scene = (ctx, V0, tt) => {
    const { ox, oy, s } = V0;
    board(ctx, ox + s * 0.02, oy + s * 0.02, s * 1.36, s * 0.8, { c: '#d2a870', thick: s * 0.014, seed: 31, r: s * 0.025, knots: false, grain: 1.7 });
    flourCloud(ctx, ox + s * 0.5, oy + s * 0.4, s * 0.5, s * 0.3, 11, 0.5, '#fff0c0'); flourCloud(ctx, ox + s * 0.2, oy + s * 0.62, s * 0.2, s * 0.1, 13, 0.4, '#fff0c0'); flourCloud(ctx, ox + s * 0.7, oy + s * 0.62, s * 0.18, s * 0.1, 17, 0.4, '#fff0c0');
    for (let k = 0; k < 26; k++) { const cx2 = ox + s * (0.12 + hash(k, 41) * 0.78), cy2 = oy + s * (0.1 + hash(k, 42) * 0.64); ctx.fillStyle = k % 3 ? 'rgba(233,194,104,0.8)' : 'rgba(255,240,190,0.7)'; ctx.beginPath(); ctx.ellipse(cx2, cy2, 1.6 + hash(k, 43) * 2.4, 1.2 + hash(k, 44) * 1.6, hash(k, 45) * 3, 0, TAU); ctx.fill(); }
    // a bowl of semolina, a bench scraper, a few grains and a sprig of basil
    { const bx = ox + s * 0.1, by = oy + s * 0.11, br = s * 0.07; ctx.save(); ctx.fillStyle = 'rgba(40,22,6,0.3)'; ctx.beginPath(); ctx.ellipse(bx + 4, by + br * 0.55, br * 1.05, br * 0.74, 0, 0, TAU); ctx.fill(); ctx.fillStyle = lg(ctx, bx - br, by, bx + br, by, [[0, '#a8624a'], [0.3, '#e8a888'], [0.7, '#c4745a'], [1, '#7a3e2c']]); ctx.beginPath(); ctx.ellipse(bx, by, br, br * 0.72, 0, 0, TAU); ctx.fill(); ctx.fillStyle = rg(ctx, bx, by, 2, br, [[0, '#f6dc94'], [0.7, SEMO], [1, tint(SEMO, -0.3)]], bx - br * 0.2, by - br * 0.2); ctx.beginPath(); ctx.ellipse(bx, by - 2, br * 0.82, br * 0.56, 0, 0, TAU); ctx.fill(); flour(ctx, bx, by - 2, br * 0.7, br * 0.4, 30, 5, 0.5, 1.6, '#fff0c0'); ctx.fillStyle = 'rgba(255,255,255,0.32)'; ctx.beginPath(); ctx.ellipse(bx - br * 0.3, by - br * 0.3, br * 0.3, br * 0.09, -0.4, 0, TAU); ctx.fill(); ctx.restore(); }
    { const kx = ox + s * 0.16, ky = oy + s * 0.68; ctx.save(); ctx.translate(kx, ky); ctx.rotate(-0.12); ctx.shadowColor = 'rgba(40,22,6,0.45)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 5; ctx.fillStyle = lg(ctx, 0, 0, 0, s * 0.06, [[0, '#f8fafb'], [0.5, '#b8c1ca'], [1, '#6c7680']]); ctx.fillRect(0, 0, s * 0.18, s * 0.045); ctx.shadowColor = 'transparent'; rrect(ctx, s * 0.01, s * 0.035, s * 0.16, s * 0.022, s * 0.01); ctx.fillStyle = lg(ctx, 0, 0, 0, s * 0.06, [[0, '#b8895a'], [1, '#52341a']]); ctx.fill(); ctx.restore(); }
    for (let k = 0; k < 5; k++) { const bx = ox + s * (0.78 + hash(k, 4) * 0.12), by = oy + s * (0.66 + hash(k, 5) * 0.1); ctx.fillStyle = k % 2 ? '#4a8a38' : '#5a9a44'; ctx.beginPath(); ctx.ellipse(bx, by, s * 0.012, s * 0.007, hash(k, 6) * 3, 0, TAU); ctx.fill(); }
    // the tray, lined with linen, with eight places
    const tx = ox + s * TRAY.x, ty = oy + s * TRAY.y, tw = s * TRAY.w, th2 = s * TRAY.h;
    shadowed(ctx, () => { rrect(ctx, tx, ty, tw, th2, s * 0.02); ctx.fillStyle = '#6a4626'; ctx.fill(); }, { blur: 14, dy: 6, a: 0.5 });
    rrect(ctx, tx, ty, tw, th2, s * 0.02); ctx.fillStyle = lg(ctx, tx, ty, tx + tw, ty + th2, [[0, '#c89a5a'], [1, '#8a6232']]); ctx.fill();
    ctx.save(); rrect(ctx, tx + s * 0.012, ty + s * 0.012, tw - s * 0.024, th2 - s * 0.024, s * 0.014); ctx.clip(); ctx.fillStyle = '#efe6d0'; ctx.fillRect(tx, ty, tw, th2); ctx.strokeStyle = 'rgba(140,120,90,0.25)'; ctx.lineWidth = 1; for (let q = 0; q < th2; q += 6) { ctx.beginPath(); ctx.moveTo(tx, ty + q); ctx.lineTo(tx + tw, ty + q); ctx.stroke(); } for (let q = 0; q < tw; q += 6) { ctx.beginPath(); ctx.moveTo(tx + q, ty); ctx.lineTo(tx + q, ty + th2); ctx.stroke(); } ctx.fillStyle = 'rgba(70,90,150,0.35)'; ctx.fillRect(tx, ty + th2 * 0.05, tw, 3); ctx.fillRect(tx, ty + th2 * 0.93, tw, 3); flourCloud(ctx, tx + tw / 2, ty + th2 / 2, tw * 0.4, th2 * 0.4, 5, 0.18, '#fff0c0'); ctx.restore();
    ctx.save(); ctx.translate(ox, oy); ctx.scale(s, s);
    for (let k = 0; k < NP; k++) { const [sx, sy] = slotXY(k); ctx.strokeStyle = 'rgba(100,70,30,0.22)'; ctx.setLineDash([0.012, 0.01]); ctx.lineWidth = 0.003; ctx.beginPath(); ctx.arc(sx, sy, 0.076, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
    // faint semolina smears where earlier pieces were dragged
    for (const t2 of trails) { ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,240,190,0.16)'; ctx.lineWidth = 0.05; ctx.beginPath(); ctx.moveTo(t2.x0, t2.y0); ctx.lineTo(t2.x1, t2.y1); ctx.stroke(); ctx.strokeStyle = 'rgba(120,80,20,0.07)'; ctx.lineWidth = 0.02; ctx.beginPath(); ctx.moveTo(t2.x0 + 0.01, t2.y0 + 0.014); ctx.lineTo(t2.x1 + 0.01, t2.y1 + 0.014); ctx.stroke(); semolina(ctx, (t2.x0 + t2.x1) / 2, (t2.y0 + t2.y1) / 2, 0.1, 0.04, 30, t2.seed + 40, 0.5); ctx.restore(); }
    // the rope, in the roll and cut phases
    if (phase === 'roll' || phase === 'cut') {
      const g = segs();
      if (phase === 'roll' && guide < 2) { ctx.strokeStyle = rgba('#8ef0a8', guide === 1 ? 0.7 : 0.35); ctx.lineWidth = 0.003; ctx.setLineDash([0.012, 0.01]); for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0.08, RYO + sgn * TS / 2); ctx.lineTo(0.92, RYO + sgn * TS / 2); ctx.stroke(); } ctx.setLineDash([]); }
      drawRope(ctx, g, tt);
      if (phase === 'cut') {
        // equal-volume marks, the cuts so far, then the knife
        if (guide < 2) for (let k = 1; k < NP; k++) { if (k <= cuts.length) continue; const x = idealCut(k), nx = k === cuts.length + 1; ctx.strokeStyle = rgba(nx ? '#8ef0a8' : '#ffffff', nx ? 0.95 : guide === 1 ? 0.5 : 0.25); ctx.lineWidth = nx ? 0.006 : 0.0035; ctx.beginPath(); ctx.moveTo(x, RYO - 0.065); ctx.lineTo(x, RYO + 0.065); ctx.stroke(); }
        for (const x of cuts) { ctx.fillStyle = 'rgba(30,16,4,0.7)'; ctx.fillRect(x - 0.0025, RYO - 0.05, 0.005, 0.1); ctx.fillStyle = 'rgba(255,244,200,0.4)'; ctx.fillRect(x + 0.0025, RYO - 0.05, 0.0015, 0.1); }
      }
    }
    // pieces: in a row after cutting, at the work spot, curled, and finished
    if (phase === 'shape' || done) {
      pieces.forEach((pc, k) => {
        const r0 = 0.056 * Math.sqrt(pc.vol / V), qy = RYO + 0.02;
        if (pc.state === 'cutrow' || pc.state === 'queue') {
          let x = pc.x, y = qy, a = 1;
          if (pc.state === 'queue' && k === cur) { const u = sm(glide); x = lerp(pc.x, WORK[0], u); y = lerp(qy, WORK[1], u); }
          cylinder(ctx, x, y, Math.max(0.02, pc.len * 0.46), r0 * 0.78, pc.tilt * 0.4, pc.seed);
          void a;
        } else if (pc.state === 'work') { if (!(drag && k === cur && Math.hypot((drag.x ?? drag.x0) - drag.x0, (drag.y ?? drag.y0) - drag.y0) > 0.01)) blob(ctx, WORK[0], WORK[1], r0 * 1.05, r0, pc.tilt, { seed: pc.seed }); }
        else if (pc.state === 'curled') shell(ctx, pc.cx, pc.cy, r0, pc.dir, pc.len / DSTAR * 0.2, pc.seed);
        else if (pc.state === 'ear') {
          const slot = slotXY(k), age = now - pc.earT, u = sm(age / 0.7), x = lerp(pc.cx ?? WORK[0], slot[0], u), y = lerp((pc.cy ?? WORK[1]) - 0.04 * Math.sin(Math.PI * Math.min(1, age / 0.7)), slot[1], u);
          const q = pieceScore(pc), flip = age < 0.28 ? 0.35 + 0.65 * (age / 0.28) : 1;
          if (u > 0.9) { ctx.strokeStyle = q >= 0.85 ? 'rgba(142,240,168,0.55)' : q >= 0.6 ? 'rgba(255,211,106,0.55)' : 'rgba(255,150,110,0.55)'; ctx.lineWidth = 0.004; ctx.beginPath(); ctx.arc(slot[0], slot[1], 0.082, 0, TAU); ctx.stroke(); }
          ear(ctx, x, y, 0.07 * (0.88 + 0.12 * Math.sqrt(pc.vol / V)) * (0.9 + 0.1 * pc.thin), { thin: pc.thin, rim: pc.rim, seed: pc.seed, tilt: -0.3 + (pc.seed % 3) * 0.2, squash: flip });
          if (u > 0.98 && !pc.parked) pc.parked = true;
        }
        // a dragged piece shows a smear tail while being dragged
      });
      // the dragged piece: follows the drag
      const pc = pieces[cur];
      if (pc && drag) { const dl = Math.hypot((drag.x ?? drag.x0) - drag.x0, (drag.y ?? drag.y0) - drag.y0); if (dl > 0.01) { ctx.save(); ctx.translate(0, 0); shell(ctx, drag.x0 + ((drag.x ?? drag.x0) - drag.x0) * 0.5, drag.y0 + ((drag.y ?? drag.y0) - drag.y0) * 0.5, 0.056 * Math.sqrt(pc.vol / V), Math.atan2((drag.y ?? drag.y0) - drag.y0, (drag.x ?? drag.x0) - drag.x0), dl / DSTAR * 0.2, pc.seed); ctx.restore(); } }
      // the guide: how far to drag
      if (guide < 2 && pc && pc.state === 'work' && !drag) { const ex = WORK[0] + Math.cos(aimDir) * DSTAR, ey = WORK[1] + Math.sin(aimDir) * DSTAR, pu = 0.6 + 0.4 * Math.sin(tt * 5); ctx.strokeStyle = rgba('#8ef0a8', 0.6); ctx.lineWidth = 0.006; ctx.setLineDash([0.012, 0.012]); ctx.beginPath(); ctx.moveTo(WORK[0], WORK[1]); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = rgba('#8ef0a8', 0.3 + 0.2 * pu); ctx.beginPath(); ctx.arc(ex, ey, 0.03, 0, TAU); ctx.fill(); ctx.strokeStyle = '#d8ffe4'; ctx.lineWidth = 0.004; ctx.beginPath(); ctx.arc(ex, ey, 0.022, 0, TAU); ctx.stroke(); ctx.fillStyle = rgba('#ffd36a', 0.3 + 0.2 * pu); ctx.beginPath(); ctx.arc(WORK[0], WORK[1], 0.04, 0, TAU); ctx.fill(); }
      if (guide < 2 && pc && pc.state === 'curled') { const pu = 0.6 + 0.4 * Math.sin(tt * 5); ctx.strokeStyle = rgba('#8ef0a8', 0.7); ctx.lineWidth = 0.006; ctx.beginPath(); ctx.moveTo(pc.cx, pc.cy); ctx.lineTo(pc.cx, pc.cy - 0.09); ctx.stroke(); ctx.fillStyle = rgba('#8ef0a8', 0.8); ctx.beginPath(); ctx.moveTo(pc.cx, pc.cy - 0.115); ctx.lineTo(pc.cx - 0.015, pc.cy - 0.085); ctx.lineTo(pc.cx + 0.015, pc.cy - 0.085); ctx.fill(); ctx.fillStyle = rgba('#ffd36a', 0.3 + 0.2 * pu); ctx.beginPath(); ctx.arc(pc.cx, pc.cy, 0.04, 0, TAU); ctx.fill(); }
    }
    drawPulses(ctx, pulses, now);
    ctx.restore();
  };
  const draw = (g2, Rt, tt) => {
    const { ctx } = g2, W0 = Rt.work;
    ctx.save(); ctx.beginPath(); ctx.rect(W0.x, W0.y, W0.w, W0.h); ctx.clip();
    const V0 = stageGeom(W0, SC, SW, SH, 0.45); geo = { ox: V0.ox, oy: V0.oy, s: V0.s, touch: (g2.px(0) * 44) / 12 };
    scene(ctx, V0, now);
    // tool at the pointer
    const live = ptr && pilot.busy() ? ptr : null, hp = handAt;
    if (phase === 'roll' && (rolling || live)) { const h = toScr((live ?? hp).x, (live ?? hp).y); hand(ctx, V0.s, h.x, h.y + 4, 0.6, 'drag'); }
    else if (phase === 'cut' && (live || (handAt && now - (handAt.cut ?? -9) < 0.35))) { const h = toScr((live ?? hp).x, (live ?? hp).y); drawKnife(ctx, h.x, h.y - V0.s * 0.03, V0.s, -0.5 + (handAt?.cut && now - handAt.cut < 0.2 ? 0.25 : 0)); }
    else if (phase === 'shape') {
      const pc = pieces[cur];
      if (pc && (drag || (live && pc.state === 'work'))) { const q = drag ? { x: drag.x ?? drag.x0, y: drag.y ?? drag.y0 } : live; const h = toScr(q.x, q.y); drawKnife(ctx, h.x, h.y - V0.s * 0.022, V0.s, -0.7); }
      else if (pc && pc.state === 'curled') { const th3 = toScr(pc.cx, pc.cy + 0.035); const fy = flick ? -(flick.maxUp ?? 0) * V0.s : 0; hand(ctx, V0.s, th3.x, th3.y + fy, 2.2, 'press'); }
    }
    ctx.restore();
    dockGauge(g2, ctx, W0, { dot: mix('#e9c268', '#ffffff', 0.7 * Math.pow(Math.max(0, 1 - ((now % BEAT) / BEAT) * 4), 2)), fill: (x, y, w, h) => { const k = pieces.filter((p) => p.shaped).length / NP; ctx.fillStyle = '#e9c268'; rrect(ctx, x, y, w * clamp(k, 0, 1), h, 5); ctx.fill(); }, warn: phase === 'shape' ? `${Math.min(NP, cur + 1)} of ${NP}` : undefined });
    hintPill(g2, ctx, W0, hintText());
    drawReference(g2, Rt.thumb, now);
  };
  const drawReference = (g2, th3, tt) => {
    const { ctx } = g2, S = Math.min(th3.w, th3.h);
    ctx.save(); ctx.beginPath(); ctx.rect(th3.x, th3.y, th3.w, th3.h); ctx.clip();
    const cx = th3.x + th3.w / 2, cy = th3.y + th3.h * 0.56;
    // a white plate with a shaded rim, the ears heaped with tomatoes and basil
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(cx + S * 0.02, cy + S * 0.17, S * 0.47, S * 0.27, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = lg(ctx, cx - S * 0.45, cy, cx + S * 0.45, cy + S * 0.2, [[0, '#cfd6dc'], [0.4, '#fdfdfb'], [1, '#aab2ba']]); ctx.beginPath(); ctx.ellipse(cx, cy + S * 0.1, S * 0.46, S * 0.28, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = rg(ctx, cx, cy + S * 0.1, S * 0.05, S * 0.36, [[0, '#f4f2ec'], [0.7, '#ffffff'], [1, '#d4d8dc']]); ctx.beginPath(); ctx.ellipse(cx, cy + S * 0.11, S * 0.34, S * 0.2, 0, 0, TAU); ctx.fill();
    const spots = [[-0.18, 0.1, 0.1, 1], [0.0, 0.14, 0.1, 2], [0.18, 0.1, 0.1, 3], [-0.09, 0.02, 0.1, 4], [0.1, 0.03, 0.1, 5], [-0.2, 0.2, 0.09, 6], [0.2, 0.2, 0.09, 7], [0.0, 0.04, 0.1, 8]];
    for (const [dx, dy, rr, sd2] of spots) ear(ctx, cx + dx * S * 1.1, cy + dy * S * 0.9, S * rr, { seed: sd2 + 3, tilt: -0.3 + sd2 * 0.7 });
    for (const [dx, dy] of [[-0.12, -0.02], [0.14, 0.18]]) { const tx = cx + dx * S, ty = cy + dy * S; ctx.fillStyle = rg(ctx, tx - 2, ty - 2, 1, S * 0.05, [[0, '#ff7a5a'], [0.6, '#d8301c'], [1, '#8a1408']]); ctx.beginPath(); ctx.arc(tx, ty, S * 0.045, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(tx - S * 0.015, ty - S * 0.018, S * 0.012, S * 0.007, -0.5, 0, TAU); ctx.fill(); }
    for (const [dx, dy, a] of [[0.0, -0.05, 0.4], [-0.05, 0.0, 2.4], [0.06, 0.12, 5.2]]) { ctx.save(); ctx.translate(cx + dx * S, cy + dy * S); ctx.rotate(a); ctx.fillStyle = lg(ctx, -S * 0.05, 0, S * 0.05, 0, [[0, '#2f7a2a'], [0.5, '#5aa844'], [1, '#2a6a24']]); ctx.beginPath(); ctx.moveTo(0, -S * 0.05); ctx.quadraticCurveTo(S * 0.045, -S * 0.01, 0, S * 0.05); ctx.quadraticCurveTo(-S * 0.045, -S * 0.01, 0, -S * 0.05); ctx.fill(); ctx.strokeStyle = 'rgba(20,60,20,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -S * 0.045); ctx.lineTo(0, S * 0.045); ctx.stroke(); ctx.restore(); }
    ctx.restore(); void tt;
  };
  const titleArt = (g2, S, tt) => {
    const { ctx } = g2, s = Math.min(S.w / SW, S.h / SH) * 0.98, V0 = { ox: S.x + (S.w - s * SW) / 2, oy: S.y + (S.h - s * SH) / 2, s };
    board(ctx, V0.ox + s * 0.02, V0.oy + s * 0.02, s * 1.36, s * 0.8, { c: '#d9b684', thick: s * 0.014, seed: 31, r: s * 0.025, knots: false });
    flourCloud(ctx, V0.ox + s * 0.5, V0.oy + s * 0.4, s * 0.44, s * 0.3, 11, 0.3, '#fff0c0');
    ctx.save(); ctx.translate(V0.ox, V0.oy); ctx.scale(s, s); for (let k = 0; k < 18; k++) { const a = k * 2.4, d = 0.06 + 0.27 * Math.sqrt(k / 18); ear(ctx, 0.5 + Math.cos(a) * d * 1.3, 0.4 + Math.sin(a) * d * 0.7, 0.062, { seed: k + 3, tilt: -0.3 + k * 0.7 }); } ctx.restore(); void tt;
  };
  const state = () => ({ technique: 'dough', mode: 'orecchiette', phase, strokes, trails: trails.length, th: th.map((v) => r3(v)), cuts: cuts.map((v) => r3(v)), cur, shaped: pieces.filter((p) => p.shaped).length, pieces: pieces.map((p) => [p.state, r3(p.vol / V), r3(p.thin), r3(p.rim), r3(p.flip)]), intervals: intervals.map((v) => r3(v)), guide, parts: Object.fromEntries(Object.entries(parts()).map(([k, v]) => [k, r3(v)])) });
  init();
  return {
    init, items, control, work, tick, draw, attract, titleArt, result: () => done, score, hint: hintText,
    info: () => [phase === 'shape' ? `Ear ${Math.min(NP, cur + 1)}/${NP}` : `Step: ${phase === 'roll' ? 'roll the rope' : 'cut equal pieces'}`, phase === 'roll' ? `Rope ${Math.round(ropeScore() * 100)}% even` : phase === 'cut' ? `Cuts ${cuts.length}/${NP - 1}` : `Rhythm ${Math.round(rhythmScore() * 100)}%`],
    get caption() { return SC.words?.caption ?? 'Shape these orecchiette'; },
    rules: () => [
      `Roll the dough into a rope: press and drag back and forth along it. The dough thins and lengthens under your fingers; keep the rope between the two lit lines all along, then press Cut it. Rolling past the lines leaves it too thin and it cannot be thickened again.`,
      `Cut the rope into ${NP} equal pieces: tap it at each lit mark. The marks divide the dough by volume, so thick and thin places are allowed for.`,
      'Shape each piece in turn: drag it across the board with the knife, steadily and about as far as the lit mark, to curl it into a thin disc with a rolled rim; then flick it upward over the thumb to turn it into an ear.',
      'Score: the rope 10, equal pieces 15, shaping 55 (a thin centre from the length of the drag, a thick rim from a steady drag, the flip from the speed of the flick), rhythm 20 (a steady pace, about three and a half seconds a piece).',
    ],
    point(id) {
      if (!geo) return null;
      if (id === 'start') return toScr(0.3, RYO);
      if (id.startsWith('roll:')) return toScr(Number(id.slice(5)), RYO);
      if (id === 'ropeBest') { const g = segs(); const ex = th.map((t) => t - TS * 1.04); let best = 0; for (let i = 0; i < N; i++) if (ex[i] > ex[best]) best = i; return toScr(g.X[best], RYO); }
      if (id === 'ropeExcess') { const ex = th.map((t) => t - TS * 1.04); let b = 0; for (let i = 0; i < N; i++) if (ex[i] > ex[b]) b = i; return { x: ex[b], y: 0 }; }
      if (id.startsWith('cut:')) return toScr(idealCut(Number(id.slice(4))), RYO);
      if (id === 'work') return toScr(WORK[0], WORK[1]);
      if (id === 'dragTo') return toScr(WORK[0] + Math.cos(aimDir) * DSTAR, WORK[1] + Math.sin(aimDir) * DSTAR);
      if (id === 'curled') { const pc = pieces[cur]; return pc && pc.state === 'curled' ? toScr(pc.cx, pc.cy) : null; }
      if (id === 'flipTo') { const pc = pieces[cur]; return pc && pc.state === 'curled' ? toScr(pc.cx, pc.cy - 0.09) : null; }
      return null;
    },
    state,
  };
}

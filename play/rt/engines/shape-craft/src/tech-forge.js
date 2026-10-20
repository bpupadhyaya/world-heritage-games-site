// shape-craft technique `forge` (1.7.0): draw out an iron bar to a target profile with heat and timed hammer blows (Blacksmith's Forge).
// Pump the bellows to heat the bar in the fire (its tip heats fastest), move it to the anvil, and strike on the beat: a blow only moves hot iron
// (cherry red to yellow); cold iron rings back, white-hot iron burns. Heavy or light blows; the bar cools as you work, so go back to the fire.
// The target profile is drawn as a lit outline over the bar. Score = how close the bar's width profile is to the target beyond the untouched bar.
import { registerTechnique } from './registry.js';
import { starsFor, hash } from './geom.js';
import { shadowed, rrect, shelf, rgba, tint, mix, ease } from './fx.js';
import { drawTool, wallLift } from './scenes.js';
import { hintPill, dockGauge } from './paint-ui.js';
import { fx as synth } from '../../../platform/engine-kit/synth.js';
import { clamp, smooth01 } from './paint-stroke.js';

// Stage geometry (1.8.0, side view, design units: x 0..1, y 0..SH). The fire pot is up on the right, the anvil below; the bar moves between them.
const N = 28, SW = 1, SH = 0.78, HALF_W = 0.052, X0 = 0.1, SEG0 = 0.64 / (N - 1);
const FACE_Y = 0.4, Y_ANVIL = FACE_Y - HALF_W * 0.93, Y_FIRE = 0.175, BEAT_S = 0.72, FALL = [1, 0.6, 0.25];
const POT = { x: 0.74, y: 0.2, rx: 0.205 };
const HEAT_STOPS = [[0, '#2a2522'], [0.2, '#34272a'], [0.3, '#4a2a22'], [0.4, '#7a2014'], [0.5, '#b02a14'], [0.6, '#e0501a'], [0.7, '#f58a22'], [0.8, '#ffc040'], [0.9, '#fff0a0'], [1, '#ffffff']];
const heatColor = (h) => { const k = clamp(h, 0, 1); for (let i = 1; i < HEAT_STOPS.length; i++) if (k <= HEAT_STOPS[i][0]) { const [a, ca] = HEAT_STOPS[i - 1], [b, cb] = HEAT_STOPS[i]; return mix(ca, cb, (k - a) / (b - a)); } return '#ffffff'; };
// total bend (radians, upward) a target asks for, spread over the last part of the bar; 0 = a straight bar
const BENDS = { hook: 2.1 };
const stretch = (w) => 1 + 0.9 * Math.pow(1 - w, 1.2);   // drawing out lengthens the bar: a thin place is longer than a thick one
const PROFILES = {
  taper: (u, j) => (u < 0.3 ? 1 : 1 - (0.84 + j) * Math.pow(smooth01((u - 0.3) / 0.7), 1.1)),
  chisel: (u, j) => (u < 0.5 ? 1 : 1 - (0.78 + j) * Math.pow((u - 0.5) / 0.5, 1.6)),
  hook: (u, j) => (u < 0.35 ? 1 : 1 - (0.7 + j) * smooth01((u - 0.35) / 0.65)),
  candlestick: (u, j) => (u < 0.3 ? 1 : u < 0.42 ? 1 - (0.32 + j) * smooth01((u - 0.3) / 0.12) : u < 0.55 ? 0.68 - j : u < 0.66 ? 0.68 - j + 0.22 * smooth01((u - 0.55) / 0.11) : u < 0.72 ? 0.9 - j : u < 0.8 ? 0.9 - j - 0.32 * smooth01((u - 0.72) / 0.08) : 0.58 - 0.45 * smooth01((u - 0.8) / 0.2)),
  leaf: (u, j) => (u < 0.2 ? 1 : u < 0.5 ? 1 - (0.62 + j) * smooth01((u - 0.2) / 0.3) : u < 0.72 ? 0.38 + 0.42 * smooth01((u - 0.5) / 0.22) : 0.8 - (0.7 + j) * smooth01((u - 0.72) / 0.28)),
};

function createSound(audio) {
  const F = (kind, p) => { try { return synth(audio, kind, p); } catch { return false; } };
  return {
    bellows() { F('whoosh', { dur: 0.55, vel: 0.55, down: false }); F('thud', { hz: 70, vel: 0.35, delay: 0.1 }); },
    strike(e, on, heavy) { const hot = e > 0.15; F('impact', { mat: 'metal', hz: hot ? 380 + (1 - e) * 260 : 1500, vel: (hot ? 0.55 : 0.4) * (heavy ? 1 : 0.7) }); F('ring', { hz: hot ? 1200 + (1 - e) * 700 : 2400, dur: hot ? 0.35 : 0.6, vel: (hot ? 0.34 : 0.42) * (on ? 1 : 0.7), delay: 0.01 }); if (hot) F('thud', { hz: 90, vel: 0.28 * (heavy ? 1 : 0.6) }); },
    toFire() { F('whoosh', { dur: 0.3, vel: 0.4, down: true }); F('tick', { hz: 2600, vel: 0.3, delay: 0.2 }); F('tick', { hz: 3200, vel: 0.25, delay: 0.28 }); F('tick', { hz: 2100, vel: 0.22, delay: 0.37 }); },
    toAnvil() { F('whoosh', { dur: 0.25, vel: 0.4, down: false }); F('impact', { mat: 'metal', hz: 260, vel: 0.45, delay: 0.3 }); },
    burn() { F('splash', { vel: 0.5 }); F('scrape', { hz: 4200, dur: 0.5, vel: 0.5, delay: 0.05 }); },
    mode() { F('tick', { hz: 1500, vel: 0.35 }); },
    win(stars) { F('good', { hz: 660 + stars * 60, vel: 0.5 }); F('ring', { hz: 1760, dur: 1.0, vel: 0.25, delay: 0.1 }); },
  };
}


// Node positions of a bar: width W[i] (1 = the starting bar) and curvature B[i] (radians added at node i, up positive), anchored at (x0, y0).
// A thin place is longer than a thick one (the iron is drawn out) and the bar bends where B says.
function layout(W, B, x0, y0) {
  const x = [x0], y = [y0], th = [B[0]];
  for (let i = 1; i < W.length; i++) {
    th.push(th[i - 1] + B[i]);
    const l = SEG0 * stretch((W[i] + W[i - 1]) / 2);
    x.push(x[i - 1] + l * Math.cos(th[i])); y.push(y[i - 1] - l * Math.sin(th[i]));
  }
  return { x, y, th };
}

export function createForge(P, env) {
  const { rng, fx } = env, SC = P.scene ?? {};
  const snd = createSound(env.audio);
  if (env.options?.soundLog) for (const k of Object.keys(snd)) { const f = snd[k]; snd[k] = (...a) => { env.options.soundLog.push({ kind: `forge.${k}` }); return f(...a); }; }
  const profName = PROFILES[P.target] ? P.target : 'taper', bpm = P.bpm ?? 83, beatS = 60 / bpm, bendTotal = BENDS[profName] ?? 0, hasBend = bendTotal > 0;
  let w, h, bn, goal, gb, base, baseB, loc, slide, bell, now, strikes, cold, burns, burnT, hammer, heavy, bendMode, done, geo, auto, ptr, lastBeat, flash;

  const init = () => {
    const j = (rng.next() - 0.5) * 0.08;
    goal = Array.from({ length: N }, (_, i) => clamp(PROFILES[profName](i / (N - 1), j), 0.1, 1));
    base = goal.reduce((s, g) => s + (1 - g), 0) / N;
    // the bend the target asks for: curvature spread over the last 45 percent of the bar
    gb = Array.from({ length: N }, (_, i) => (hasBend && i >= Math.floor(N * 0.55) ? bendTotal / (N - Math.floor(N * 0.55)) : 0));
    bn = new Array(N).fill(0);
    baseB = hasBend ? meanAbs(cum(gb)) : 0;
    w = new Array(N).fill(1); h = new Array(N).fill(0.04);
    loc = 'anvil'; slide = 1; bell = 0; now = 0; strikes = 0; cold = 0; burns = 0; burnT = 0; hammer = null; heavy = true; bendMode = false; done = null; geo = null; ptr = null; lastBeat = -1; flash = -9;
    auto = { st: 'heat', wait: 0.4, pump: 0, hand: null };
  };
  const cum = (a) => { let s = 0; return a.map((v) => (s += v)); };
  const meanAbs = (a) => a.reduce((s, v) => s + Math.abs(v), 0) / a.length;
  const err = () => w.reduce((s, v, i) => s + Math.abs(v - goal[i]), 0) / N;
  const berr = () => { const a = cum(bn), g = cum(gb); return a.reduce((s, v, i) => s + Math.abs(v - g[i]), 0) / N; };
  const shapeScore = () => clamp(100 * (1 - err() / base / 0.6), 0, 100);
  const bendScore = () => (hasBend ? clamp(100 * (1 - berr() / baseB / 0.6), 0, 100) : 100);
  const score = () => (hasBend ? 0.65 * shapeScore() + 0.35 * bendScore() : shapeScore());
  const total = () => (done ? done.score : Math.max(0, Math.round(score()) - Math.min(30, burns * 8)));
  const onBeat = () => { const ph = (now % beatS) / beatS, d = Math.min(ph, 1 - ph) * beatS; return d <= 0.15; };
  const beatPhase = () => (now % beatS) / beatS;
  const barY = () => Y_FIRE + (Y_ANVIL - Y_FIRE) * ease(slide);
  const geom = () => layout(w, bn, X0, barY());

  // ---- actions -----------------------------------------------------------------------------------------------------------------------------
  const pump = () => { if (done) return; bell = Math.min(1, bell + 0.55); snd.bellows(); if (geo) fx.emit('dust', geo.ox + geo.s * 0.93, geo.oy + geo.s * 0.1, { count: 4, color: '#ffb060', size: 5, speed: 40, life: 0.6, gravity: -30 }); };
  const move = () => { if (done) return; loc = loc === 'fire' ? 'anvil' : 'fire'; (loc === 'fire' ? snd.toFire : snd.toAnvil)(); };
  const strike = (c) => {
    if (done || slide < 0.97 || loc !== 'anvil') return;
    const on = onBeat(), e = clamp((h[c] - 0.38) / 0.22, 0, 1), G = geom();
    strikes++; hammer = { c, t: now, on, heavy, bend: bendMode, e };
    snd.strike(e, on, heavy);
    if (e < 0.15) { cold++; flash = now; }
    if (bendMode && hasBend) {
      const da = (heavy ? 0.3 : 0.12) * e * (on ? 1 : 0.6);
      for (let k = -2; k <= 2; k++) { const j = c + k; if (j < 0 || j >= N) continue; bn[j] = clamp(bn[j] + (da * FALL[Math.abs(k)]) / 2.7, 0, 0.45); h[j] = Math.max(0.03, h[j] - 0.01 * (heavy ? 1.4 : 0.6)); }
    } else {
      const amt = (heavy ? 0.2 : 0.075) * e * (on ? 1 : 0.6);
      for (let k = -2; k <= 2; k++) { const j = c + k; if (j < 0 || j >= N) continue; w[j] = Math.max(0.08, w[j] - amt * FALL[Math.abs(k)]); h[j] = Math.max(0.03, h[j] - 0.012 * (heavy ? 1.4 : 0.6)); }
    }
    if (geo && e > 0.05) {
      const x = geo.ox + G.x[c] * geo.s, y = geo.oy + (G.y[c] + HALF_W * 0.5) * geo.s;
      fx.emit('spark', x, y, { count: Math.round(5 + 14 * e * (heavy ? 1 : 0.45)), color: heatColor(h[c] + 0.15), size: heavy ? 6 : 4.5, speed: (heavy ? 190 : 130) + 120 * e, life: 0.6, gravity: 520, spread: Math.PI * 1.2, angle: -Math.PI / 2 });
    }
  };
  const finish = () => {
    if (done) return;
    const s = Math.max(0, Math.round(score()) - Math.min(30, burns * 8)), stars = starsFor(s), W = SC.words ?? {};
    done = { score: s, max: 100, stars, headline: stars === 3 ? (W.win ?? 'Drawn out true') : stars ? (W.ok ?? 'A serviceable piece') : (W.retry ?? 'Back to the fire'), detail: `Profile error ${(err() * 100).toFixed(1)} points against ${(base * 100).toFixed(0)} at the start${hasBend ? `, bend ${Math.round(bendScore())} percent` : ''}, ${strikes} blows, ${burns ? burns + ' burn' + (burns > 1 ? 's' : '') : 'no burns'}` };
    snd.win(stars);
    if (geo) { const G = geom(); fx.emit('spark', geo.ox + G.x[N >> 1] * geo.s, geo.oy + G.y[N >> 1] * geo.s, { count: 16, color: '#ffd070', size: 8, speed: 170, life: 0.9, gravity: 200 }); }
  };
  const items = () => {
    const out = [{ id: 'bellows', kind: 'btn', label: 'Bellows' }, { id: 'move', kind: 'btn', label: loc === 'fire' ? 'To anvil' : 'To fire' }, { id: 'weight', kind: 'btn', label: heavy ? 'Heavy' : 'Light' }];
    if (hasBend) out.push({ id: 'tool', kind: 'btn', label: bendMode ? 'Bend' : 'Draw out' });
    out.push({ id: 'check', kind: 'btn', label: 'Check', primary: true });
    return out;
  };
  const control = (id) => { if (done) return; if (id === 'bellows') pump(); else if (id === 'move') move(); else if (id === 'weight') { heavy = !heavy; snd.mode(); } else if (id === 'tool' && hasBend) { bendMode = !bendMode; snd.mode(); } else if (id === 'check') finish(); };

  const toLocal = (x, y) => [(x - geo.ox) / geo.s, (y - geo.oy) / geo.s];
  const nearest = (u, v) => { const G = geom(); let c = -1, d = 1e9; for (let i = 0; i < N; i++) { const q = Math.hypot(G.x[i] - u, G.y[i] - v); if (q < d) { d = q; c = i; } } return { c, d }; };
  const work = (p) => {
    if (!geo || done) return;
    ptr = { x: p.x, y: p.y };
    if (!p.pressed) return;
    const [u, v] = toLocal(p.x, p.y), { c, d } = nearest(u, v);
    if (d < HALF_W * 2.6 + 0.02) strike(c);
  };
  const tick = (dt) => {
    now += dt;
    slide = clamp(slide + (loc === 'anvil' ? 1 : -1) * dt / 0.5, 0, 1);
    bell = Math.max(0, bell - dt * 0.55);
    let maxH = 0;
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      if (loc === 'fire' && slide < 0.3) h[i] = Math.min(1, h[i] + (0.1 + 0.17 * smooth01((u - 0.15) / 0.5)) * (1 + 2.6 * bell) * clamp((1.12 - h[i]) / 0.62, 0.15, 1.3) * dt * 1.7);   // the tip heats fastest, but iron already hot gains slowly, so the middle can catch up (1.8.0)
      else h[i] = Math.max(0.03, h[i] - (0.02 + 0.07 * h[i]) * dt);
      maxH = Math.max(maxH, h[i]);
    }
    if (maxH > 0.93) { burnT += dt; if (burnT > 1.0) { burnT = 0; burns++; for (let i = 0; i < N; i++) w[i] = Math.max(0.08, w[i] - 0.03); snd.burn(); flash = now; if (geo) fx.emit('spark', geo.ox + POT.x * geo.s, geo.oy + Y_FIRE * geo.s, { count: 18, color: '#ffffff', size: 6, speed: 220, life: 0.7, gravity: 300 }); } } else burnT = Math.max(0, burnT - dt);
  };

  // ---- attract mode: a smith who keeps the iron in the working colour and strikes on the beat; draws the bar out first, then bends it --------
  const attract = (dt) => {
    if (done) return;
    if (auto.wait > 0) { auto.wait -= dt; return; }
    const needW = []; for (let i = 0; i < N; i++) if (w[i] - goal[i] > 0.03) needW.push(i);
    const needB = []; if (hasBend) for (let i = 0; i < N; i++) if (gb[i] - bn[i] > 0.035) needB.push(i);
    if (!needW.length && !needB.length) { finish(); return; }
    const forBend = !needW.length, need = forBend ? needB : needW;
    const hot = (i) => h[i] >= 0.5;
    if (loc === 'fire') {
      // ready when most of the places that still need work are in the working colour, or the hottest spot is about to burn
      const want = need.filter((i) => i >= N * 0.15), hs = want.map((i) => h[i]).sort((a, b) => a - b), p40 = hs.length ? hs[Math.floor(hs.length * 0.4)] : 0.9, mx = Math.max(...h);
      if (p40 >= 0.55 || mx > 0.8) { move(); auto.wait = 0.7; return; }
      if (bell < 0.3 && mx < 0.5) { pump(); auto.wait = 0.28; }
      return;
    }
    if (slide < 0.99) return;
    const usable = need.filter(hot);
    if (!usable.length) { move(); auto.wait = 0.7; return; }
    const ph = beatPhase();
    if (!(ph < 0.03 || ph > 0.97)) return;
    const gap = (i) => (forBend ? gb[i] - bn[i] : w[i] - goal[i]);
    let c = usable[0]; for (const i of usable) if (gap(i) > gap(c)) c = i;
    heavy = forBend ? gap(c) > 0.09 : gap(c) > 0.22;
    bendMode = forBend;
    const G = geom(); auto.hand = [G.x[c], G.y[c]];
    strike(c); auto.wait = beatS * 0.7;
  };

  // ---- drawing -----------------------------------------------------------------------------------------------------------------------------
  const X = (V, x) => V.ox + x * V.s, Y = (V, y) => V.oy + y * V.s;
  const poly = (ctx, V, pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(X(V, x), Y(V, y)) : ctx.moveTo(X(V, x), Y(V, y)))); ctx.closePath(); };
  // a stump of oak, a side-view anvil (horn, step, face, heel, waist, base)
  const drawAnvil = (ctx, V, glow) => {
    const s = V.s;
    // the stump
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = s * 0.04; ctx.shadowOffsetY = s * 0.015;
    const sg = ctx.createLinearGradient(X(V, 0.2), 0, X(V, 0.8), 0); sg.addColorStop(0, '#4a2e17'); sg.addColorStop(0.35, '#8a5a30'); sg.addColorStop(0.7, '#6a4222'); sg.addColorStop(1, '#3a2210');
    rrect(ctx, X(V, 0.2), Y(V, 0.655), s * 0.6, s * 0.14, s * 0.012); ctx.fillStyle = sg; ctx.fill(); ctx.restore();
    ctx.strokeStyle = 'rgba(30,16,6,0.4)'; ctx.lineWidth = 1.4; ctx.beginPath(); for (let k = 0; k < 9; k++) { const x = X(V, 0.23 + k * 0.067 + hash(k, 2) * 0.01); ctx.moveTo(x, Y(V, 0.665)); ctx.lineTo(x + (hash(k, 3) - 0.5) * 5, Y(V, 0.78)); } ctx.stroke();
    ctx.fillStyle = '#2a2a2c'; ctx.fillRect(X(V, 0.2), Y(V, 0.7), s * 0.6, s * 0.012); ctx.fillRect(X(V, 0.2), Y(V, 0.752), s * 0.6, s * 0.012);   // iron bands
    // the anvil: horn on the left, face on top, heel on the right, a narrow waist, a flared base
    const body = [[0.02, 0.408], [0.08, 0.398], [0.19, 0.392], [0.225, 0.4], [0.255, 0.4], [0.74, 0.4], [0.82, 0.402], [0.84, 0.425], [0.835, 0.45], [0.745, 0.462], [0.7, 0.49], [0.685, 0.545], [0.7, 0.58], [0.79, 0.605], [0.8, 0.655], [0.2, 0.655], [0.21, 0.605], [0.3, 0.58], [0.315, 0.545], [0.3, 0.49], [0.26, 0.465], [0.17, 0.455], [0.09, 0.435]];
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = s * 0.03; ctx.shadowOffsetY = s * 0.012;
    poly(ctx, V, body); const g = ctx.createLinearGradient(0, Y(V, 0.39), 0, Y(V, 0.655)); g.addColorStop(0, '#aeb6be'); g.addColorStop(0.12, '#7c848c'); g.addColorStop(0.5, '#4a5058'); g.addColorStop(1, '#25282c'); ctx.fillStyle = g; ctx.fill(); ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 2; poly(ctx, V, body); ctx.stroke();
    // lit top edge of the face, a highlight along the horn, the hardy and pritchel holes, the step
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(V, 0.26), Y(V, 0.4)); ctx.lineTo(X(V, 0.74), Y(V, 0.4)); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(V, 0.03), Y(V, 0.409)); ctx.quadraticCurveTo(X(V, 0.1), Y(V, 0.4), X(V, 0.22), Y(V, 0.397)); ctx.stroke();
    ctx.fillStyle = '#0e0f11'; ctx.fillRect(X(V, 0.63), Y(V, 0.392), s * 0.026, s * 0.012); ctx.beginPath(); ctx.ellipse(X(V, 0.56), Y(V, 0.393), s * 0.012, s * 0.005, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(X(V, 0.225), Y(V, 0.402), s * 0.03, s * 0.012);
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; for (let k = 0; k < 24; k++) ctx.fillRect(X(V, 0.3 + hash(k, 4) * 0.42), Y(V, 0.47 + hash(k, 5) * 0.17), 3 + hash(k, 6) * 7, 1.4);
    if (glow > 0) { ctx.fillStyle = `rgba(255,150,50,${0.16 * glow})`; poly(ctx, V, [[0.26, 0.4], [0.74, 0.4], [0.74, 0.43], [0.26, 0.43]]); ctx.fill(); }
  };
  // the fire pot: an iron bowl on a block of brick, glowing coals, flames, and bellows with a pipe; `front` draws the parts that sit in front of the bar
  const drawPotBack = (ctx, V, t, bellK) => {
    const s = V.s, cx = X(V, POT.x), cy = Y(V, POT.y), rx = POT.rx * s;
    // brick block
    const bg = ctx.createLinearGradient(0, cy, 0, cy + s * 0.1); bg.addColorStop(0, '#5a3a30'); bg.addColorStop(1, '#2a1a16');
    rrect(ctx, cx - rx * 1.05, cy + s * 0.02, rx * 2.1, s * 0.085, 6); ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5; for (let r = 0; r < 2; r++) for (let k = 0; k < 9; k++) { const bx = cx - rx * 1.05 + ((k + (r % 2) * 0.5) / 9) * rx * 2.1; ctx.strokeRect(bx, cy + s * 0.02 + r * s * 0.042, rx * 2.1 / 9, s * 0.042); }
    // the leather bellows behind the pot: two boards hinged at the nozzle, pleated leather between them, a handle on the top board
    { const nx = cx + rx * 0.5, ny = cy - s * 0.02, ax = -0.62, open = 0.32 * (1 - 0.7 * bellK), L = s * 0.17;
      const pt = (a, l, off) => [nx + Math.cos(a) * l - Math.sin(a) * off, ny + Math.sin(a) * l + Math.cos(a) * off];
      ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      const aT = ax - open / 2, aB = ax + open / 2, t0 = pt(aT, s * 0.02, 0), t1 = pt(aT, L, 0), b0 = pt(aB, s * 0.02, 0), b1 = pt(aB, L, 0);
      ctx.fillStyle = '#4a3220'; ctx.beginPath(); ctx.moveTo(...t0); ctx.lineTo(...t1); ctx.lineTo(...b1); ctx.lineTo(...b0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(20,10,4,0.65)'; ctx.lineWidth = 1.4; for (let k = 1; k < 5; k++) { const l = s * 0.02 + ((L - s * 0.02) * k) / 5, a = pt(aT, l, 0), b = pt(aB, l, 0); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
      for (const [p0, p1, c] of [[t0, t1, '#a07a44'], [b0, b1, '#7a5a30']]) { ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = s * 0.018; ctx.beginPath(); ctx.moveTo(...p0); ctx.lineTo(...p1); ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = s * 0.011; ctx.stroke(); }
      const hk = pt(aT, L + s * 0.045, 0); ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = s * 0.012; ctx.beginPath(); ctx.moveTo(...t1); ctx.lineTo(...hk); ctx.stroke();
      ctx.strokeStyle = '#2a2a2c'; ctx.lineWidth = s * 0.012; ctx.beginPath(); ctx.moveTo(nx, ny); ctx.quadraticCurveTo(nx - s * 0.04, ny + s * 0.0, nx - s * 0.075, ny + s * 0.012); ctx.stroke();
      ctx.restore(); }
    // coals: a glowing bed
    const f = 0.8 + 0.2 * Math.sin(t * 9) * Math.sin(t * 4.3) + bellK * 0.5;
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, rx, s * 0.045, 0, Math.PI, 0); ctx.lineTo(cx + rx, cy); ctx.closePath(); ctx.clip();
    const bed = ctx.createRadialGradient(cx, cy - s * 0.02, 3, cx, cy, rx * 1.05); bed.addColorStop(0, `rgba(255,${Math.round(210 * Math.min(1, f))},100,1)`); bed.addColorStop(0.45, `rgba(255,${Math.round(110 * f)},30,0.97)`); bed.addColorStop(1, 'rgba(70,16,6,1)'); ctx.fillStyle = bed; ctx.fillRect(cx - rx, cy - s * 0.06, rx * 2, s * 0.08);
    for (let k = 0; k < 46; k++) { const a = hash(k, 1), b = hash(k, 2), fl = 0.5 + 0.5 * Math.sin(t * 3 + k); ctx.fillStyle = rgba(fl > 0.55 ? '#ffd070' : '#8a2410', 0.85); ctx.beginPath(); ctx.ellipse(cx - rx * 0.92 + a * rx * 1.84, cy - s * 0.04 * (0.15 + b * 0.85), 2.4 + hash(k, 3) * 3, 1.8 + hash(k, 4) * 2, 0, 0, 6.3); ctx.fill(); }
    ctx.restore();
    // the glow thrown on the wall behind
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gl = ctx.createRadialGradient(cx, cy - s * 0.04, 6, cx, cy - s * 0.04, rx * 1.5); gl.addColorStop(0, `rgba(255,150,60,${0.4 * f})`); gl.addColorStop(1, 'rgba(255,90,20,0)'); ctx.fillStyle = gl; ctx.fillRect(cx - rx * 1.6, cy - rx * 1.5, rx * 3.2, rx * 1.9); ctx.restore();
  };
  const drawPotFront = (ctx, V, t, bellK) => {
    const s = V.s, cx = X(V, POT.x), cy = Y(V, POT.y), rx = POT.rx * s, f = 0.8 + 0.2 * Math.sin(t * 9) * Math.sin(t * 4.3) + bellK * 0.5;
    for (let k = 0; k < 7; k++) {
      const fx0 = cx - rx * 0.75 + (k / 6) * rx * 1.5, hgt = s * (0.04 + 0.03 * Math.sin(t * 7 + k * 1.7) + 0.04 * f), sw = Math.sin(t * 5 + k) * 5, yb = cy - s * 0.02;
      ctx.fillStyle = rgba('#ff9a2a', 0.5); ctx.beginPath(); ctx.moveTo(fx0 - s * 0.022, yb); ctx.quadraticCurveTo(fx0 - s * 0.01 + sw, yb - hgt * 0.6, fx0 + sw * 1.3, yb - hgt); ctx.quadraticCurveTo(fx0 + s * 0.012 + sw, yb - hgt * 0.5, fx0 + s * 0.022, yb); ctx.closePath(); ctx.fill();
      ctx.fillStyle = rgba('#ffe090', 0.55); ctx.beginPath(); ctx.moveTo(fx0 - s * 0.01, yb); ctx.quadraticCurveTo(fx0 + sw * 0.6, yb - hgt * 0.45, fx0 + sw * 0.8, yb - hgt * 0.62); ctx.quadraticCurveTo(fx0 + s * 0.006, yb - hgt * 0.3, fx0 + s * 0.01, yb); ctx.closePath(); ctx.fill();
    }
    // the iron rim of the pot, in front
    ctx.strokeStyle = '#1c1a1a'; ctx.lineWidth = s * 0.014; ctx.lineCap = 'round'; ctx.beginPath(); ctx.ellipse(cx, cy, rx, s * 0.045, 0, 0, Math.PI); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(cx, cy + 2, rx * 0.97, s * 0.04, 0, 0.1, Math.PI - 0.1); ctx.stroke();
  };
  const bar = (ctx, V, G, W, H, showHeat) => {
    const s = V.s, top = (i) => [X(V, G.x[i]) - Math.sin(G.th[i]) * W[i] * HALF_W * s, Y(V, G.y[i]) - Math.cos(G.th[i]) * W[i] * HALF_W * s], bot = (i) => [X(V, G.x[i]) + Math.sin(G.th[i]) * W[i] * HALF_W * s, Y(V, G.y[i]) + Math.cos(G.th[i]) * W[i] * HALF_W * s];
    const outline = () => { ctx.beginPath(); for (let i = 0; i < N; i++) { const [x, y] = top(i); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } for (let i = N - 1; i >= 0; i--) { const [x, y] = bot(i); ctx.lineTo(x, y); } ctx.closePath(); };
    if (showHeat && Math.max(...H) > 0.3) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < N; i += 2) { const g = clamp((H[i] - 0.35) / 0.65, 0, 1); if (g <= 0) continue; const r = s * 0.1, x = X(V, G.x[i]), y = Y(V, G.y[i]), gr = ctx.createRadialGradient(x, y, 2, x, y, r); gr.addColorStop(0, `rgba(255,140,40,${0.42 * g})`); gr.addColorStop(1, 'rgba(255,90,20,0)'); ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2); } ctx.restore(); }
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 6; outline(); ctx.fillStyle = '#8a8f96'; ctx.fill(); ctx.restore();
    ctx.save(); outline(); ctx.clip();
    for (let i = 1; i < N; i++) { const a = top(i - 1), b = top(i), c = bot(i), d = bot(i - 1); ctx.beginPath(); ctx.moveTo(a[0] - 0.6, a[1]); ctx.lineTo(b[0] + 0.6, b[1]); ctx.lineTo(c[0] + 0.6, c[1]); ctx.lineTo(d[0] - 0.6, d[1]); ctx.closePath(); ctx.fillStyle = showHeat ? heatColor((H[i] + H[i - 1]) / 2) : '#8a8f96'; ctx.fill(); }
    // a rounded bar lit from above: a bright stripe near the top edge, a dark one near the bottom; scale on the cool iron
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [k, col, lw] of [[0.5, 'rgba(255,255,255,0.3)', 0.28], [-0.62, 'rgba(0,0,0,0.38)', 0.5]]) { ctx.beginPath(); for (let i = 0; i < N; i++) { const x = X(V, G.x[i]) - Math.sin(G.th[i]) * W[i] * HALF_W * s * k, y = Y(V, G.y[i]) - Math.cos(G.th[i]) * W[i] * HALF_W * s * k; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, HALF_W * s * lw); ctx.stroke(); }
    if (showHeat) for (let i = 0; i < N; i++) { const cool = clamp(1 - H[i] * 1.8, 0, 1); if (cool > 0.05) { ctx.fillStyle = `rgba(20,16,14,${0.4 * cool})`; for (let k = 0; k < 3; k++) ctx.fillRect(X(V, G.x[i]) + hash(i, k) * 8 - 4, Y(V, G.y[i]) + (hash(i, k + 5) - 0.5) * W[i] * HALF_W * s * 1.7, 5 + hash(i, k + 9) * 6, 2); } }
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.lineWidth = 1.6; outline(); ctx.stroke();
  };
  const drawGoal = (ctx, V, G, t) => {
    const s = V.s; ctx.save(); ctx.lineJoin = 'round'; ctx.setLineDash([7, 5]); ctx.lineWidth = 2.4; ctx.strokeStyle = `rgba(120,230,255,${0.8 + 0.2 * Math.sin(t * 3)})`;
    for (const sd of [-1, 1]) { ctx.beginPath(); for (let i = 0; i < N; i++) { const x = X(V, G.x[i]) - sd * Math.sin(G.th[i]) * goal[i] * HALF_W * s, y = Y(V, G.y[i]) - sd * Math.cos(G.th[i]) * goal[i] * HALF_W * s; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); }
    ctx.restore();
  };
  const drawTongs = (ctx, V, G) => {
    const s = V.s, x = X(V, G.x[0]), y = Y(V, G.y[0]), steel = '#6a6e74';
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const sd of [-1, 1]) {
      ctx.strokeStyle = '#25272a'; ctx.lineWidth = s * 0.016; ctx.beginPath(); ctx.moveTo(x + s * 0.07, y + sd * HALF_W * s * 0.95); ctx.lineTo(x + s * 0.005, y + sd * HALF_W * s * 1.0); ctx.lineTo(x - s * 0.1, y + sd * s * 0.034 + s * 0.05); ctx.lineTo(x - s * 0.24, y + sd * s * 0.02 + s * 0.15); ctx.stroke();
      ctx.strokeStyle = steel; ctx.lineWidth = s * 0.011; ctx.stroke();
    }
    ctx.fillStyle = '#3a3d41'; ctx.beginPath(); ctx.arc(x - s * 0.005, y, s * 0.012, 0, 6.3); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.restore();
  };
  // a smith's hammer: wooden handle, steel head with a face and a peen. The face lands on (hx, hy); alpha < 1 while it fades away after a blow.
  const drawHammer = (ctx, V, hx, hy, ang, hv, alpha) => {
    const s = V.s, hl = s * (hv ? 0.3 : 0.24), hw = s * (hv ? 0.09 : 0.068), hh = s * (hv ? 0.05 : 0.04), pivx = hx + hl * Math.cos(0.9), pivy = hy - hl * Math.sin(0.9);
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(pivx, pivy); ctx.rotate(-ang);
    const bx = hx - pivx, by = hy - pivy;
    ctx.save(); ctx.translate(bx, by); ctx.rotate(0.55);
    // head: laid along the handle's end, face down
    const hg = ctx.createLinearGradient(0, -hh, 0, hh); hg.addColorStop(0, '#c4cad0'); hg.addColorStop(0.5, '#6c737b'); hg.addColorStop(1, '#2c2f33');
    ctx.fillStyle = hg; rrect(ctx, -hw * 0.5, -hh * 0.5 - hh * 0.2, hw, hh, hh * 0.18); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
    // handle from the head back to the hand
    ctx.strokeStyle = '#3a2410'; ctx.lineWidth = s * 0.026; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(0, 0); ctx.stroke();
    ctx.strokeStyle = '#a77a45'; ctx.lineWidth = s * 0.017; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx * 0.95, by * 0.95 - 3); ctx.lineTo(-bx * 0.02, -by * 0.02 - 3); ctx.stroke();
    ctx.restore();
  };
  // the hammer at rest, leaning against the stump
  const drawRest = (ctx, V, hv) => {
    const s = V.s, hw = s * (hv ? 0.09 : 0.068), hh = s * (hv ? 0.05 : 0.04), hx = X(V, 0.9), hy = Y(V, 0.745);
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = '#3a2410'; ctx.lineWidth = s * 0.026; ctx.beginPath(); ctx.moveTo(hx, hy - hh * 0.5); ctx.lineTo(hx - s * 0.11, hy - s * 0.17); ctx.stroke(); ctx.strokeStyle = '#a77a45'; ctx.lineWidth = s * 0.017; ctx.stroke();
    const hg = ctx.createLinearGradient(0, hy - hh, 0, hy + hh * 0.5); hg.addColorStop(0, '#c4cad0'); hg.addColorStop(0.5, '#6c737b'); hg.addColorStop(1, '#2c2f33');
    ctx.fillStyle = hg; rrect(ctx, hx - hw / 2, hy - hh, hw, hh, hh * 0.18); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
  };
  // a light, steady stage: stump and anvil, pot, bar, tongs, hammer; used for play, the title and the reference
  const scene = (ctx, V, o) => {
    drawPotBack(ctx, V, o.t, o.bell);
    drawAnvil(ctx, V, o.glow);
    bar(ctx, V, o.G, o.W, o.H, true);
    drawPotFront(ctx, V, o.t, o.bell);
    if (o.tongs) drawTongs(ctx, V, o.G);
  };
  const hammerPose = (G) => {
    // [x, y, angle, alpha] of the swinging hammer, or null when it rests
    if (!hammer || now - hammer.t > 0.36) return null;
    const p = now - hammer.t, up = hammer.heavy ? 1.25 : 0.8, x = G.x[hammer.c], y = G.y[hammer.c] - HALF_W * w[hammer.c] * 0.8;
    if (p < 0.13) return [x, y, up * (1 - Math.pow(p / 0.13, 2.2)), 1];
    if (p < 0.26) return [x, y, 0.16 * Math.sin(((p - 0.13) / 0.13) * Math.PI) * (hammer.heavy ? 1 : 0.6), 1];
    return [x, y, up * 0.8 * ease((p - 0.26) / 0.1), 1 - (p - 0.26) / 0.1];
  };
  const draw = (g, Rt, tt) => {
    const { ctx, pal: PL } = g, W0 = Rt.work, lift = SC.wall ? wallLift(W0) * 0.1 : 0;
    const Wk = { x: W0.x, y: W0.y + 40 + lift, w: W0.w, h: W0.h - 40 - lift - 4 };
    const s = Math.min(Wk.h / SH, Wk.w / SW), V = { ox: Wk.x + (Wk.w - s * SW) / 2, oy: Wk.y + (Wk.h - s * SH) / 2, s };
    geo = { ox: V.ox, oy: V.oy, s: V.s };
    const k = (now % beatS) / beatS, on = onBeat() && loc === 'anvil' && !done, G = geom();
    scene(ctx, V, { t: now, bell, glow: loc === 'anvil' ? Math.pow(Math.max(0, 1 - k * 3), 2) : 0, G, W: w, H: h, tongs: true });
    if (slide > 0.9) drawGoal(ctx, V, layout(goal, gb, X0, barY()), now);
    // the hammer: swinging after a blow, resting against the stump otherwise
    const hp = hammerPose(G);
    if (hp) drawHammer(ctx, V, X(V, hp[0]), Y(V, hp[1]), hp[2], hammer.heavy, hp[3]);
    else drawRest(ctx, V, heavy);
    // one heat gauge in the dock, with the beat light beside it
    const mh = Math.max(...h);
    const gg = dockGauge(g, ctx, W0, { dot: heatColor(mh), fill: (x, y, wd, ht) => {
      const gr = ctx.createLinearGradient(x, 0, x + wd, 0); HEAT_STOPS.forEach(([o, c]) => gr.addColorStop(o, c)); ctx.fillStyle = gr; ctx.globalAlpha = 0.55; rrect(ctx, x + 1, y + 1, wd - 2, ht - 2, 4); ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(120,230,255,0.95)'; ctx.lineWidth = 2; ctx.strokeRect(x + wd * 0.45, y - 3, wd * 0.3, ht + 6);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2; const mx = x + wd * clamp(mh, 0, 1); ctx.beginPath(); ctx.moveTo(mx, y + ht + 2); ctx.lineTo(mx - 5, y + ht + 10); ctx.lineTo(mx + 5, y + ht + 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    } });
    ctx.beginPath(); ctx.arc(gg.x + gg.w + 28, gg.y + 5, 7 + (loc === 'anvil' ? 6 * Math.pow(Math.max(0, 1 - k * 3), 2) : 0), 0, 6.3); ctx.fillStyle = on ? '#8ef0a8' : 'rgba(255,255,255,0.35)'; ctx.fill();
    hintPill(g, ctx, W0, hint());
    // reference: the finished bar, drawn out (and bent) to the goal, hot enough to glow
    const th = Rt.thumb, GR = layout(goal, gb, 0, 0);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (let i = 0; i < N; i++) { x0 = Math.min(x0, GR.x[i]); x1 = Math.max(x1, GR.x[i]); y0 = Math.min(y0, GR.y[i]); y1 = Math.max(y1, GR.y[i]); }
    const bw = x1 - x0 + 0.2, bh = y1 - y0 + 0.2, ts = Math.min((th.w * 0.92) / bw, (th.h * 0.7) / bh), Vt = { ox: th.x + th.w / 2 - ((x0 + x1) / 2) * ts, oy: th.y + th.h * 0.46 - ((y0 + y1) / 2) * ts, s: ts };
    shelf(ctx, th.x + th.w / 2, th.y + th.h - 3, th.w * 0.36);
    bar(ctx, Vt, GR, goal, new Array(N).fill(0.62), true);
  };
  const titleArt = (g, S, t) => {
    const { ctx } = g, s = Math.min(S.w / SW, S.h / SH) * 0.98, V = { ox: S.x + (S.w - s * SW) / 2, oy: S.y + (S.h - s * SH) / 2, s };
    const G = layout(goal, gb, X0, Y_ANVIL);
    scene(ctx, V, { t: t ?? 0, bell: 0.3, glow: 0, G, W: goal, H: goal.map((_, i) => 0.78 - i * 0.008), tongs: true });
    drawRest(ctx, V, true);
  };

  const hint = () => {
    if (done) return '';
    if (loc === 'anvil' && h.every((v) => v < 0.25)) return 'The bar is cold: press To fire, pump the bellows until it glows, then bring it back.';
    if (loc === 'fire') return h.some((v, i) => v >= 0.5 && (goal[i] < w[i] - 0.03 || gb[i] - bn[i] > 0.035)) ? 'The iron is working colour: move it to the anvil.' : 'Pump the bellows until the tip glows orange, then move it to the anvil.';
    const hot = h.filter((v) => v >= 0.45).length;
    if (!hot) return 'The iron has gone cold: move it back to the fire.';
    return bendMode && hasBend ? 'Tap the bar on the beat to bend it where it should curl.' : 'Tap the bar on the beat to strike. Heavy blows draw it out, light blows finish it.';
  };
  const state = () => ({ technique: 'forge', target: profName, loc, slide: Math.round(slide * 100) / 100, bell: Math.round(bell * 100) / 100, beat: Math.round(beatPhase() * 1000) / 1000, onBeat: onBeat(), heavy, strikes, cold, burns, err: Math.round(err() * 1000) / 1000, base: Math.round(base * 1000) / 1000,
    tool: bendMode ? 'bend' : 'hammer', bend: bn.map((v) => Math.round(v * 1000) / 1000), goalBend: gb.map((v) => Math.round(v * 1000) / 1000), bendErr: hasBend ? Math.round(berr() * 1000) / 1000 : 0, length: Math.round(w.reduce((t, v, i) => t + (i ? SEG0 * stretch((v + w[i - 1]) / 2) : 0), 0) * 1000) / 1000,
    heat: h.map((v) => Math.round(v * 100) / 100), width: w.map((v) => Math.round(v * 1000) / 1000), goal: goal.map((v) => Math.round(v * 1000) / 1000) });

  init();
  return {
    init, items, control, work, tick, draw, attract, titleArt, result: () => done, score: total, hint,
    info: () => [`Profile error ${(err() * 100).toFixed(1)} points${hasBend ? `, bend ${Math.round(bendScore())}%` : ''}`, `${strikes} blows${burns ? `, ${burns} burn${burns > 1 ? 's' : ''}` : ''}`],
    get caption() { return SC.words?.caption ?? 'Forge this bar'; },
    rules: () => [
      'Pump the bellows to heat the bar in the fire; the tip heats fastest, the end in the tongs slowest. The heat gauge shows the hottest part; the lit box is the working colour (cherry red to orange).',
      'Move the bar to the anvil and tap it to strike on the beat (the light by the gauge turns green). A blow on the beat is full strength; off the beat it is weaker. Heavy blows swing the hammer from high and draw the bar out (it grows longer as it thins); light blows finish it.',
      'Cold iron barely moves and rings back; iron that goes white-hot for too long burns, loses metal and costs points. The bar cools as you work: go back to the fire.',
      ...(hasBend ? ['Where the outline curls, press Bend: hot blows then turn the bar over the anvil, a little with each blow, instead of drawing it out.'] : []),
      'The dashed outline is the shape to reach. Score: how close the bar\'s width is to the outline along its whole length (and, for a curled outline, how well it is bent), beyond the untouched bar; each burn costs 8 points.',
    ],
    point(id) {
      if (!geo) return null;
      const [k, rest] = id.split(':');
      if (k === 'col') { const c = clamp(Number(rest), 0, N - 1), G = geom(); return { x: geo.ox + G.x[c] * geo.s, y: geo.oy + G.y[c] * geo.s }; }
      return null;
    },
    state,
  };
}

registerTechnique('forge', { make: (P, env) => createForge(P, env), scene: 'forge', mat: 'wire' });
void tint;

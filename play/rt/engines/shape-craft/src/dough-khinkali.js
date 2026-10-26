// dough technique, mode "pleat-round": khinkali (Georgia). A rolled wrapper with a ball of filling. The player pinches the rim at the lit
// mark, pulls the pinch along the rim to the next mark and holds a beat to set it; each fold overlaps the last, round the whole circle
// (at least 19 pleats, evenly spaced, tight), then twists the pleats closed into the topknot (the kudi, which is not twisted too far).
// Score: pleat count, evenness of spacing, tightness (how deep the fold is tucked and whether it was held), and the topknot.
import { hash } from './geom.js';
import { starsFor } from './geom.js';
import { rrect, rgba, tint } from './fx.js';
import { lg, rg, ell, TAU, flour, flourCloud, steam, drawHand, board, pin, drawPulses } from './dough-art.js';
import { clamp, lerp, r3, wrapPi, mean, sd, makeSound, stageGeom, createPilot } from './dough-core.js';
import { hintPill, dockGauge } from './paint-ui.js';

const SW = 1, SH = 0.9, CX = 0.5, CY = 0.5, SY = 0.8;
let SPIN = 0;   // while drawing, the dumpling is turned on the board by this angle (the cook turns it so the next pinch is always at the bottom)
const pt = (r, a, z = 0) => [CX + r * Math.cos(a + SPIN), CY + r * Math.sin(a + SPIN) * SY - z];
const DOUGH = '#eee0bc';

// ---------------------------------------------------------------------------------------------------------------------------------------
// The dumpling itself, in design units (the caller has translated and scaled the context). o: { R0, a0, cur, pleats: [{ a1, w, tight }], g (gather 0..1),
// turns (twist turns), pinch: { da, rho } | null, tears: [angles], t, rimPhase }
export function drawDumpling(ctx, o) {
  SPIN = o.spin ?? 0;
  try { drawDumplingBody(ctx, o); } finally { SPIN = 0; }
}
function drawDumplingBody(ctx, o) {
  const { R0, pleats, g = 0, turns = 0, pinch = null, tears = [], t = 0 } = o, a0 = o.a0, cur = o.cur ?? a0;
  const full = pleats.length ? pleats[pleats.length - 1].a1 >= a0 + TAU - 1e-3 : false;
  const rim = (a) => R0 * (1 + 0.011 * Math.sin(a * 7 + (o.rimPhase ?? 0)) + 0.007 * Math.sin(a * 13 + 1.3));
  const ptc = (r, a, z = 0) => pt(r, a, z);
  // --- contact shadow of the whole piece on the board
  ctx.save(); const sr = full ? 0.235 : R0 * 0.99;
  ctx.fillStyle = rg(ctx, CX + 0.012, CY + 0.035, sr * 0.7, sr * 1.18, [[0, full ? 'rgba(40,22,6,0.5)' : 'rgba(40,22,6,0.42)'], [0.8, 'rgba(40,22,6,0.18)'], [1, 'rgba(40,22,6,0)']]);
  ctx.beginPath(); ctx.ellipse(CX + 0.012, CY + 0.035, sr * 1.18, sr * 1.18 * SY, 0, 0, TAU); ctx.fill(); ctx.restore();
  // --- the flat rim: the part of the wrapper not yet pleated, from the cursor round to the start. Thin, a little translucent at the edge.
  if (!full) {
    const A = cur, B = a0 + TAU, n = Math.max(6, Math.round((B - A) / 0.06));
    // the thin edge throws a faint shadow on the board
    ctx.save(); ctx.strokeStyle = 'rgba(50,28,8,0.22)'; ctx.lineWidth = 0.012; ctx.lineJoin = 'round'; ctx.beginPath(); for (let i = 0; i <= n; i++) { const a = A + ((B - A) * i) / n, q3 = ptc(rim(a) + 0.003, a); if (i) ctx.lineTo(q3[0] + 0.003, q3[1] + 0.006); else ctx.moveTo(q3[0] + 0.003, q3[1] + 0.006); } ctx.stroke(); ctx.restore();
    ctx.save(); ctx.beginPath();
    const rin = 0.15; let q = ptc(rin, A); ctx.moveTo(q[0], q[1]);
    q = ptc(rim(A), A); ctx.lineTo(q[0], q[1]);
    for (let i = 1; i <= n; i++) { const a = A + ((B - A) * i) / n; q = ptc(rim(a), a); ctx.lineTo(q[0], q[1]); }
    for (let i = n; i >= 0; i--) { const a = A + ((B - A) * i) / n; q = ptc(rin, a, 0.03); ctx.lineTo(q[0], q[1]); }
    ctx.closePath();
    ctx.fillStyle = rg(ctx, CX, CY, 0.12, R0 * 1.02, [[0, tint(DOUGH, -0.2)], [0.3, tint(DOUGH, -0.05)], [0.8, tint(DOUGH, 0.03)], [0.94, tint(DOUGH, 0.1)], [1, rgba(tint(DOUGH, 0.2), 0.86)]], CX - 0.05, CY - 0.06); ctx.shadowColor = 'rgba(40,22,6,0.4)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.clip();
    // rolled-out texture: faint concentric stretch lines, blisters, flour
    ctx.strokeStyle = 'rgba(120,90,40,0.08)'; ctx.lineWidth = 0.003; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(CX, CY, R0 * (0.5 + k * 0.1), R0 * (0.5 + k * 0.1) * SY, 0, 0, TAU); ctx.stroke(); }
    // the wrapper drapes over the filling: soft folds radiating from the mound
    for (let k2 = 0; k2 < 22; k2++) {
      const aa = A + (B - A) * hash(k2, 3, 9), r0 = 0.19, r1 = R0 * (0.62 + 0.32 * hash(k2, 4, 9)), q0 = ptc(r0, aa), q1 = ptc(r1, aa + (hash(k2, 5, 9) - 0.5) * 0.14), qm = ptc((r0 + r1) / 2, aa + (hash(k2, 6, 9) - 0.5) * 0.1);
      ctx.strokeStyle = 'rgba(110,80,30,0.1)'; ctx.lineWidth = 0.006; ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.quadraticCurveTo(qm[0], qm[1], q1[0], q1[1]); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,252,240,0.2)'; ctx.lineWidth = 0.003; ctx.beginPath(); ctx.moveTo(q0[0] - 0.004, q0[1] - 0.004); ctx.quadraticCurveTo(qm[0] - 0.004, qm[1] - 0.004, q1[0] - 0.004, q1[1] - 0.004); ctx.stroke();
    }
    flour(ctx, CX, CY, R0 * 0.95, R0 * 0.95 * SY, 190, 4, 0.55, 0.0045, '#fffaf0'); flourCloud(ctx, CX + 0.12, CY + 0.1, 0.16, 0.08, 12, 0.22);
    for (let k2 = 0; k2 < 5; k2++) { const bx = CX + (hash(k2, 7, 9) - 0.5) * R0 * 1.5, by = CY + (hash(k2, 8, 9) - 0.5) * R0 * 1.2 * SY; ctx.fillStyle = 'rgba(120,90,40,0.07)'; ctx.beginPath(); ctx.ellipse(bx, by, 0.01, 0.007, 0.3, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,252,240,0.3)'; ctx.beginPath(); ctx.ellipse(bx - 0.002, by - 0.002, 0.005, 0.0028, 0.3, 0, TAU); ctx.fill(); }
    // the edge lit like thin dough: a pale lip with a shadow just inside it
    ctx.lineWidth = 0.006; ctx.strokeStyle = 'rgba(255,252,240,0.6)'; ctx.beginPath(); for (let i = 0; i <= n; i++) { const a = A + ((B - A) * i) / n, q2 = ptc(rim(a) - 0.002, a); if (i) ctx.lineTo(q2[0], q2[1]); else ctx.moveTo(q2[0], q2[1]); } ctx.stroke();
    ctx.lineWidth = 0.012; ctx.strokeStyle = 'rgba(110,80,30,0.14)'; ctx.beginPath(); for (let i = 0; i <= n; i++) { const a = A + ((B - A) * i) / n, q2 = ptc(rim(a) - 0.012, a); if (i) ctx.lineTo(q2[0], q2[1]); else ctx.moveTo(q2[0], q2[1]); } ctx.stroke();
    // the open edge at the cursor lifts: shade it
    const e = ptc(rim(A), A), e2 = ptc(0.15, A); ctx.strokeStyle = 'rgba(90,60,20,0.35)'; ctx.lineWidth = 0.012; ctx.beginPath(); ctx.moveTo(e2[0], e2[1]); ctx.lineTo(e[0], e[1]); ctx.stroke();
    ctx.restore();
  }
  // --- the filling under the wrapper: a lumpy dome that shows through a little, rim-lit on the upper left, in shade lower right
  const domeTop = lerp(0.1, 0.0, g * 0.5);
  ctx.save(); const dx = CX, dy = CY - 0.04, rx = lerp(0.215, 0.19, g), ry = lerp(0.15, 0.17, g);
  const dome = () => { ctx.beginPath(); for (let i = 0; i <= 48; i++) { const a = (i / 48) * TAU, k = 1 + 0.025 * Math.sin(3 * a + 1) + 0.018 * Math.sin(5 * a + 2) + 0.012 * Math.sin(8 * a); const x = dx + Math.cos(a) * rx * k, y = dy + Math.sin(a) * ry * k; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.closePath(); };
  dome(); ctx.fillStyle = rg(ctx, dx, dy, 0.01, rx * 1.2, [[0, tint(DOUGH, 0.2)], [0.5, DOUGH], [0.85, tint(DOUGH, -0.2)], [1, tint(DOUGH, -0.42)]], dx - rx * 0.4, dy - ry * 0.55); ctx.shadowColor = 'rgba(40,22,6,0.45)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4; ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); dome(); ctx.clip();
  ctx.fillStyle = rg(ctx, dx + rx * 0.1, dy + ry * 0.3, 0.01, rx * 0.9, [[0, 'rgba(196,112,98,0.36)'], [1, 'rgba(196,112,98,0)']]); ctx.fillRect(dx - rx, dy - ry, rx * 2, ry * 2);   // meat and broth seen through the thin dough
  for (let k2 = 0; k2 < 14; k2++) { const a = hash(k2, 2, 7) * TAU, d = 0.25 + 0.6 * hash(k2, 3, 7); ctx.fillStyle = k2 % 3 ? 'rgba(120,150,80,0.16)' : 'rgba(140,60,50,0.16)'; ctx.beginPath(); ctx.ellipse(dx + Math.cos(a) * rx * d, dy + Math.sin(a) * ry * d, 0.012, 0.008, a, 0, TAU); ctx.fill(); }
  flour(ctx, dx, dy, rx * 0.8, ry * 0.8, 40, 17, 0.45, 0.004, '#fffaf0');
  ctx.strokeStyle = 'rgba(255,252,240,0.55)'; ctx.lineWidth = 0.006; ctx.beginPath(); ctx.ellipse(dx, dy, rx * 0.97, ry * 0.97, 0, Math.PI * 0.95, Math.PI * 1.55); ctx.stroke();
  ctx.strokeStyle = 'rgba(70,40,10,0.28)'; ctx.lineWidth = 0.012; ctx.beginPath(); ctx.ellipse(dx, dy, rx * 0.97, ry * 0.97, 0, -0.1, Math.PI * 0.6); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.34)'; ell(ctx, dx - rx * 0.36, dy - ry * 0.5, rx * 0.26, ry * 0.12); ctx.fill();
  ctx.restore(); void domeTop; ctx.restore();
  // --- pleats, oldest first so every fold lies over the last
  const lift = (k) => pleats[k].tight ?? 1;
  pleats.forEach((p, k) => { const age = p.born !== undefined && o.now !== undefined ? clamp((o.now - p.born) / 0.3, 0, 1) : 1, grow = age >= 1 ? 1 : 1 + 0.18 * Math.sin(age * Math.PI) * (1 - age) - (1 - age) * (1 - age) * 0.5; leaf(ctx, p.a1, p.w * (0.6 + 0.4 * grow), g, 1 - lift(k) + (1 - grow), k, o, DOUGH, k === pleats.length - 1 && !pinch); });
  // --- a pleat in the making under the fingers
  if (pinch && pinch.da > 0.02) leaf(ctx, cur + pinch.da, pinch.da * 1.9, g, 0.5, 99, o, DOUGH, true, 0.9);
  // --- the skirt sits on the board: a soft dark line under it, and the crown a little lighter
  if (g > 0.6) { ctx.save(); ctx.strokeStyle = 'rgba(40,22,6,0.22)'; ctx.lineWidth = 0.012; ctx.beginPath(); for (let i = 0; i <= 60; i++) { const a = (i / 60) * TAU, q = pt(lerp(0.3, 0.245, g) * 1.01, a, 0.0); if (i) ctx.lineTo(q[0], q[1] + 0.004); else ctx.moveTo(q[0], q[1] + 0.004); } ctx.closePath(); ctx.stroke(); ctx.restore(); }
  // --- tears
  for (const a of tears) { const q = ptc(rim(a) * 0.93, a); ctx.fillStyle = 'rgba(70,40,10,0.7)'; ctx.beginPath(); ctx.moveTo(q[0] - 0.012, q[1]); ctx.lineTo(q[0], q[1] - 0.02); ctx.lineTo(q[0] + 0.012, q[1] + 0.004); ctx.lineTo(q[0] + 0.002, q[1] + 0.018); ctx.closePath(); ctx.fill(); }
  // --- the topknot
  if (g > 0.02 || turns > 0.05) knob(ctx, g, turns, t, DOUGH);
}

// One pleat: a leaf of dough from the crown down to the skirt. a1 is the crest angle, w how much of the rim it carries, g how far the purse is gathered.
function leaf(ctx, a1, w, g, loose, k, o, dough, crest, alpha = 1) {
  const RIN = lerp(0.16, 0.035, g), zIn = lerp(0.05, 0.135, g), RO = lerp(0.3, 0.245, g) * (1 + loose * 0.06), zOut = lerp(0.012, 0.045, g);
  const aT = a1 - w, nW = 7;
  ctx.save(); ctx.globalAlpha = alpha;
  const outline = () => {
    ctx.beginPath(); let q = pt(RIN, a1 + 0.02, zIn); ctx.moveTo(q[0], q[1]);
    const c1 = pt((RIN + RO) * 0.5, a1 + 0.045 + loose * 0.03, (zIn + zOut) / 2 + 0.03), e = pt(RO, a1, zOut); ctx.quadraticCurveTo(c1[0], c1[1], e[0], e[1]);
    for (let i = 1; i <= nW; i++) { const u = i / nW, a = a1 - w * u, r = RO * (1 + (0.016 + loose * 0.02) * Math.sin(i * 2.3 + k * 1.7)) * (1 - 0.012 * u); q = pt(r, a, zOut + 0.003 * Math.sin(i + k)); ctx.lineTo(q[0], q[1]); }
    const c2 = pt((RIN + RO) * 0.5, aT - 0.02, (zIn + zOut) / 2 + 0.018), s = pt(RIN, a1 - w * 0.7, zIn); ctx.quadraticCurveTo(c2[0], c2[1], s[0], s[1]);
    ctx.closePath();
  };
  outline();
  const A = pt((RIN + RO) / 2, aT, (zIn + zOut) / 2), B = pt((RIN + RO) / 2, a1, (zIn + zOut) / 2);
  const gr = ctx.createLinearGradient(A[0], A[1], B[0], B[1]);
  const vt = (hash(k, 11, 3) - 0.5) * 0.07; gr.addColorStop(0, tint(dough, 0.14 + vt)); gr.addColorStop(0.28, tint(dough, 0.05 + vt)); gr.addColorStop(0.68, tint(dough, -0.15 + vt)); gr.addColorStop(1, tint(dough, -0.36 + vt));
  ctx.fillStyle = gr; ctx.shadowColor = 'rgba(50,28,8,0.5)'; ctx.shadowBlur = 6; ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 2; ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); outline(); ctx.clip();
  // a lit ridge along the folded-over edge, fine micro folds, flour
  const r0 = pt(RIN, aT + w * 0.28, zIn), r1 = pt(RO, aT + w * 0.1, zOut);
  ctx.strokeStyle = 'rgba(255,252,238,0.55)'; ctx.lineWidth = 0.0055; ctx.beginPath(); ctx.moveTo(r0[0], r0[1]); ctx.lineTo(r1[0], r1[1]); ctx.stroke();
  ctx.strokeStyle = 'rgba(110,76,30,0.2)'; ctx.lineWidth = 0.0035; for (const f of [0.45, 0.7]) { const q0 = pt(RIN, aT + w * f, zIn), q1 = pt(RO * 0.98, aT + w * (f - 0.08), zOut); ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke(); }
  const outer = pt(RO * 0.93, a1 - w * 0.5, zOut); flour(ctx, outer[0], outer[1], 0.03, 0.02, 7, k + 40, 0.5, 0.0045);
  ctx.restore();
  if (crest) { ctx.strokeStyle = 'rgba(255,252,238,0.45)'; ctx.lineWidth = 0.004; outline(); ctx.stroke(); }
  ctx.restore();
}

// The topknot: dough twisted into a stalk with spiral grooves; it grows with the gather and shows the turns.
function knob(ctx, g, turns, t, dough) {
  const [kx, ky] = pt(0, 0, lerp(0.07, 0.14, g)), h = 0.012 + 0.06 * clamp(turns / 1.5, 0, 1.2) + 0.02 * g, w = 0.045 - 0.008 * clamp(turns / 2, 0, 1);
  ctx.save(); ctx.translate(kx, ky);
  ctx.shadowColor = 'rgba(40,22,6,0.45)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
  ctx.beginPath(); ctx.moveTo(-w, 0.004); ctx.bezierCurveTo(-w * 0.9, -h * 0.5, -w * 0.45, -h * 0.9, -w * 0.12, -h * 1.05); ctx.quadraticCurveTo(0, -h * 1.12, w * 0.12, -h * 1.05); ctx.bezierCurveTo(w * 0.45, -h * 0.9, w * 0.9, -h * 0.5, w, 0.004); ctx.quadraticCurveTo(0, w * 0.5, -w, 0.004); ctx.closePath();
  ctx.fillStyle = lg(ctx, -w, 0, w, 0, [[0, tint(dough, -0.12)], [0.35, tint(dough, 0.08)], [0.7, dough], [1, tint(dough, -0.32)]]); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.clip();
  // spiral grooves: slanted arcs, more of them and steeper with the turns
  const grooves = 3 + Math.round(turns * 3.4);
  ctx.strokeStyle = 'rgba(110,76,30,0.34)'; ctx.lineWidth = 0.0035;
  for (let i = 0; i < grooves; i++) { const y0 = -h * (i + 0.5) / grooves; ctx.beginPath(); ctx.moveTo(-w, y0 + 0.012 + turns * 0.004); ctx.quadraticCurveTo(0, y0 - 0.006 - turns * 0.006, w, y0 - 0.008); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,252,238,0.5)'; for (let i = 0; i < grooves; i++) { const y0 = -h * (i + 0.5) / grooves - 0.004; ctx.beginPath(); ctx.moveTo(-w, y0 + 0.012 + turns * 0.004); ctx.quadraticCurveTo(0, y0 - 0.006 - turns * 0.006, w, y0 - 0.008); ctx.stroke(); }
  ctx.restore();
  void t;
}

// ---------------------------------------------------------------------------------------------------------------------------------------
export function createKhinkali(P, env) {
  const { rng, fx } = env, SC = P.scene ?? {};
  const snd = makeSound(env, (F) => ({
    pinch() { F('scrape', { hz: 650, dur: 0.07, vel: 0.22 }); F('thud', { hz: 160, vel: 0.1 }); },
    fold(q) { F('thud', { hz: 110 + q * 60, vel: 0.26 }); F('scrape', { hz: 1100 + q * 500, dur: 0.07, vel: 0.26, delay: 0.015 }); F('tick', { hz: 1700 + q * 500, vel: 0.12, delay: 0.03 }); },
    loose() { F('scrape', { hz: 500, dur: 0.1, vel: 0.2 }); },
    tear() { F('bad', { hz: 200, vel: 0.35 }); F('scrape', { hz: 2400, dur: 0.18, vel: 0.4 }); },
    twist(k) { F('scrape', { hz: 450 + k * 320, dur: 0.09, vel: 0.2 }); },
    close() { F('thud', { hz: 100, vel: 0.4 }); F('good', { hz: 620, vel: 0.5, delay: 0.05 }); },
    win(stars) { F('good', { hz: 600 + stars * 70, vel: 0.5 }); F('chime', { hz: 1180, vel: 0.28, delay: 0.1 }); },
    mode() { F('tick', { hz: 1500, vel: 0.3 }); },
  }), 'khinkali');
  const target0 = Math.max(19, Math.round(P.pleats ?? 21)), minPleats = P.minPleats ?? 19;
  const pilot = createPilot();
  let pulses, spin, pleats, cur, a0, R0, rimPhase, Nt, delta, tears, phase, pinch, tw, twDown, done, guide, now, geo, lastP, flash, noteT, g, lastGoodHand, handAt, ptr;

  const init = () => {
    Nt = target0 + rng.int(3) - 1; delta = TAU / Nt; a0 = Math.PI * (0.5 + (rng.next() - 0.5) * 0.3); R0 = 0.395 * (0.97 + rng.next() * 0.06); rimPhase = rng.next() * TAU;
    pleats = []; cur = a0; tears = []; phase = 'pleat'; pinch = null; tw = 0; twDown = false; done = null; guide = 1; now = 0; flash = { t: -9, k: '' }; noteT = -9; g = 0; lastP = null; handAt = null; ptr = null; lastGoodHand = null;
    spin = Math.PI / 2 - cur; pulses = []; pilot.clear();
  };
  const spinT = () => Math.PI / 2 - cur;
  // --- scoring
  const parts = () => {
    const n = pleats.length;
    if (!n) return { count: 0, even: 0, tight: 0, knot: 0 };
    const st = pleats.filter((p) => !p.last).map((p) => p.step);
    const count = clamp(n / minPleats, 0, 1);
    const cv = st.length >= 3 ? sd(st) / (mean(st) || 1) : 0.4;
    const even = st.length >= 3 ? clamp(1 - (cv - 0.07) / 0.3, 0, 1) : 0;
    const tight = mean(pleats.map((p) => p.tightScore));
    const turns = tw / TAU, knot = phase === 'pleat' ? 0 : turns < 1 ? clamp(turns, 0, 1) * 0.6 : turns <= 1.95 ? 1 : clamp(1 - (turns - 1.95) / 0.4, 0.25, 1);
    return { count, even, tight, knot, turns };
  };
  const rawScore = () => { const p = parts(); return Math.max(0, 100 * (0.3 * p.count + 0.25 * p.even + 0.25 * p.tight + 0.2 * p.knot) - Math.min(18, tears.length * 6)); };
  const score = () => (done ? done.score : Math.round(rawScore()));
  const finish = (torn) => {
    if (done) return;
    if (torn) tw = TAU * 2.6;
    const p = parts(), sc = Math.round(rawScore() - (torn ? 0 : 0)), stars = starsFor(sc), W = SC.words ?? {};
    done = { score: sc, max: 100, stars, headline: stars === 3 ? 'A proper khinkali' : stars ? 'Holds its broth' : 'Back to the board', detail: `${pleats.length} pleats, spacing ${Math.round(p.even * 100)} percent, tightness ${Math.round(p.tight * 100)} percent, topknot ${Math.round(p.knot * 100)} percent${tears.length ? `, ${tears.length} torn` : ''}` };
    snd.win(stars); void W;
  };

  // --- geometry: input logic runs in design units (so Watch and learn needs no screen); draw sets geo for the screen mapping
  const toScr = (u, v, z = 0) => ({ x: geo.ox + u * geo.s, y: geo.oy + (v - z) * geo.s });
  const markerD = () => { const q = pt(R0, cur + spinT()); return { x: q[0], y: q[1] }; };
  const targetD = (da = delta, rho = 0.9) => { const q = pt(R0 * rho, cur + da + spinT()); return { x: q[0], y: q[1] }; };
  const knobD = () => { const q = pt(0, 0, 0.12); return { x: q[0], y: q[1] }; };
  const polar = (u0, v0) => { const u = u0 - CX, v = (v0 - CY) / SY; return { a: Math.atan2(v, u) - spinT(), r: Math.hypot(u, v) }; };
  const scr = (d) => toScr(d.x, d.y);
  const markerScr = () => scr(markerD()), targetPt = (da, rho) => scr(targetD(da, rho)), knobScr = () => scr(knobD());

  // --- input (shared by the player and by Watch and learn, which feeds the same snapshot)
  const commit = () => {
    const da = pinch.da, rem = a0 + TAU - cur;
    if (da > delta * 2.15) { tears.push(cur + delta * 0.5); snd.tear(); flash = { t: now, k: 'tear' }; pinch = null; return; }
    if (da < delta * 0.45) { flash = { t: now, k: 'small' }; snd.loose(); pinch = null; return; }
    const last = da >= rem - delta * 0.4, step = last ? rem : da;
    const depth = pinch.rho, set = clamp(pinch.still / 0.28, 0, 1);
    const depthScore = 1 - clamp(Math.abs(depth - 0.9) / 0.22, 0, 1), tightScore = 0.55 * depthScore + 0.45 * set;
    pleats.push({ a1: cur + step, step, w: step * 1.9, depth: r3(depth), set: r3(set), tight: 0.35 + 0.65 * tightScore, tightScore, last, born: now });
    cur += step; snd.fold(tightScore);
    const m = pt(R0 * 0.9, Math.PI / 2 + step); pulses.push({ x: m[0], y: m[1], t: now, col: tightScore > 0.85 ? '#d8ffe4' : '#ffe8a0' }); if (geo) { const s2 = toScr(m[0], m[1]); fx.emit('dust', s2.x, s2.y, { count: 5, color: '#fffaf0', size: 4, speed: 35, life: 0.6, gravity: -10 }); }
    pinch = null;
    if (last) { phase = 'gather'; g = 0; snd.close(); noteT = now; }
  };
  const workD = (p, dt) => {
    if (done) return;
    const spd = lastP ? Math.hypot(p.x - lastP.x, p.y - lastP.y) / Math.max(dt, 1e-4) : 0; lastP = { x: p.x, y: p.y };
    const touchD = geo ? geo.touch / geo.s : 0.1;
    if (phase === 'pleat') {
      const M = markerD();
      if (p.pressed && !pinch) { const cap = Math.max(0.1, touchD * 0.9); if (Math.hypot(p.x - M.x, p.y - M.y) <= cap) { pinch = { da: 0, rho: 1, still: 0 }; snd.pinch(); handAt = { x: p.x, y: p.y }; } }
      if (pinch && p.down) {
        const q = polar(p.x, p.y); let da = wrapPi(q.a - cur); if (da < -Math.PI * 0.5) da = 0;
        pinch.da = clamp(da, 0, delta * 2.6); pinch.rho = clamp(q.r / R0, 0.3, 1.2);
        if (spd < 0.16) pinch.still += dt; else pinch.still = Math.max(0, pinch.still - dt * 1.5);
        handAt = { x: p.x, y: p.y };
      }
      if (pinch && (p.released || !p.down)) commit();
    } else if (phase === 'gather') {
      const K = knobD();
      if (p.pressed && Math.hypot(p.x - K.x, p.y - K.y) <= 0.42) { twDown = true; twLast = Math.atan2(p.y - K.y, p.x - K.x); }
      if (twDown && p.down) {
        const a = Math.atan2(p.y - K.y, p.x - K.x), d = wrapPi(a - twLast); twLast = a;
        if (Math.hypot(p.x - K.x, p.y - K.y) > 0.02) { tw = Math.max(0, tw + d); if (Math.abs(d) > 0.02) { twSnd += Math.abs(d); if (twSnd > 0.7) { twSnd = 0; snd.twist(tw / TAU / 2); } } }
        g = clamp(tw / TAU, 0, 1);
        handAt = { x: p.x, y: p.y };
        if (tw > TAU * 2.4) finish(true);
      }
      if (twDown && (p.released || !p.down)) { twDown = false; if (tw >= TAU && !done) finish(false); }
    }
  };
  const work = (p) => { if (!geo) return; workD({ x: (p.x - geo.ox) / geo.s, y: (p.y - geo.oy) / geo.s, down: p.down, pressed: p.pressed, released: p.released }, geo.dt ?? 1 / 60); };
  let twLast = 0, twSnd = 0;
  const control = (id) => {
    if (done) return;
    if (id === 'undo' && phase === 'pleat' && pleats.length && !pinch) { const p = pleats.pop(); cur = p.a1 - p.step; snd.mode(); }
    else if (id === 'guide') { guide = (guide + 1) % 3; snd.mode(); }
  };
  const items = () => [{ id: 'undo', kind: 'btn', label: 'Undo', off: phase !== 'pleat' || !pleats.length }, { id: 'guide', kind: 'btn', label: ['Guide on', 'Faint', 'No guide'][guide] }];

  const tick = (dt) => { now += dt; if (!pinch) spin += (spinT() - spin) * (1 - Math.exp(-dt * 11)); if (phase === 'gather' && !twDown && !done) g = Math.min(g, clamp(tw / TAU, 0, 1)); };

  // --- Watch and learn: the pilot plays pinch gestures with the ideal step, depth and hold, then twists 1.4 turns
  const attract = (dt) => {
    if (done) return;
    if (!pilot.busy()) {
      if (phase === 'pleat') {
        const rem = a0 + TAU - cur, da = rem < delta * 1.4 ? rem : delta;
        pilot.push({ pts: () => { const m = markerD(), q = targetD(da); return [[m.x, m.y], [q.x, q.y]]; }, dur: [0.2], hold: 0.34, lead: pleats.length ? 0.16 : 0.7 });
      } else if (phase === 'gather') {
        const K = knobD(), R = 0.06, pts = []; for (let i = 0; i <= 17; i++) { const a = (i / 12) * TAU - Math.PI / 2; pts.push([K.x + Math.cos(a) * R, K.y + Math.sin(a) * R]); }
        pilot.push({ pts, dur: new Array(pts.length - 1).fill(0.11), linear: true, hold: 0.25, lead: 0.2 });
      }
    }
    const p = pilot.step(dt); ptr = { x: p.x, y: p.y, down: p.down }; workD({ x: p.x, y: p.y, down: p.down, pressed: p.pressed, released: p.released }, dt);
  };

  // --- drawing
  const hintText = () => {
    if (done) return '';
    if (phase === 'gather') return tw / TAU < 1 ? 'Gather the pleats: circle a finger around the knot, one to two turns, then let go.' : 'Lift your finger to close the topknot.';
    if (!pleats.length) return 'Pinch the glowing mark, drag it along the rim to the next mark, hold a beat, let go.';
    return pinch ? (pinch.da > delta * 1.9 ? 'Too far: the dough will tear.' : 'Hold a moment at the mark so the fold sets, then let go.') : `Next pleat at the lit mark. Even spacing, ${Math.max(0, minPleats - pleats.length)} to go for a full ring.`;
  };
  const hand = (ctx, s, x, y, ang, open = 0) => drawHand(ctx, x, y, { rot: ang, k: s * 0.0021, pose: 'pinch', open, skin: SC.skin, sleeve: SC.sleeve });
  const scene = (ctx, V, tt, opts = {}) => {
    const { ox, oy, s } = V;
    // the board and what lies about it
    ctx.save();
    board(ctx, ox + s * 0.04, oy + s * 0.12, s * 0.92, s * 0.76, { c: '#c8a066', round: true, thick: s * 0.014, seed: 11, r: 0 });
    flourCloud(ctx, ox + s * 0.5, oy + s * 0.58, s * 0.38, s * 0.22, 3, 0.26);
    ctx.restore();
    pin(ctx, ox + s * 0.17, oy + s * 0.88, s * 0.44, -0.12, s * 0.028, { c: '#d2a86c' });
    ctx.save(); ctx.translate(ox, oy); ctx.scale(s, s);
    const st = opts.state ?? { pleats, a0, cur, g, tears, pinch };
    drawDumpling(ctx, { R0, rimPhase, a0: st.a0, cur: st.cur, pleats: st.pleats, g: st.g, turns: opts.turns ?? tw / TAU, pinch: st.pinch, tears: st.tears, t: tt, now, spin: opts.state ? 0 : spin });
    ctx.restore();
  };
  const guideDraw = (ctx, V, tt) => {
    if (phase !== 'pleat' || done || guide === 2) return;
    const a = guide === 1 ? 0.55 : 0.3;
    ctx.save(); ctx.translate(V.ox, V.oy); ctx.scale(V.s, V.s);
    // little marks round the rim: where every pleat should land
    for (let k = 0; k <= Nt; k++) { const ang = a0 + k * delta; if (ang < cur - 1e-3 || ang > a0 + TAU + 1e-3) continue; const q = pt(R0 * 1.06, ang + spin), nx = k === Math.round((cur - a0) / delta) + 1; ctx.fillStyle = rgba(nx ? '#8ef0a8' : '#ffffff', nx ? 0.95 : a * 0.55); ctx.beginPath(); ctx.arc(q[0], q[1], nx ? 0.0105 : 0.006, 0, TAU); ctx.fill(); }
    // the next target: a lit dot inside the rim and the arc to it
    const m = pt(R0, cur + spin), tq = pt(R0 * 0.9, cur + delta + spin), pulse = 0.6 + 0.4 * Math.sin(tt * 5);
    ctx.strokeStyle = rgba('#8ef0a8', 0.5 * a + 0.2); ctx.lineWidth = 0.007; ctx.setLineDash([0.012, 0.012]); ctx.beginPath(); ctx.moveTo(m[0], m[1]); for (let i = 1; i <= 8; i++) { const q = pt(R0 * (1 - 0.1 * (i / 8)), cur + spin + (delta * i) / 8); ctx.lineTo(q[0], q[1]); } ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = rgba('#8ef0a8', 0.25 + 0.2 * pulse); ctx.beginPath(); ctx.arc(tq[0], tq[1], 0.034, 0, TAU); ctx.fill(); ctx.strokeStyle = rgba('#d8ffe4', 0.9); ctx.lineWidth = 0.005; ctx.beginPath(); ctx.arc(tq[0], tq[1], 0.026, 0, TAU); ctx.stroke();
    // the pinch mark on the rim
    ctx.fillStyle = rgba('#ffd36a', 0.35 + 0.25 * pulse); ctx.beginPath(); ctx.arc(m[0], m[1], 0.04 * (1 + 0.1 * pulse), 0, TAU); ctx.fill(); ctx.strokeStyle = '#ffe8a0'; ctx.lineWidth = 0.006; ctx.beginPath(); ctx.arc(m[0], m[1], 0.03, 0, TAU); ctx.stroke();
    ctx.restore();
  };
  const draw = (g2, Rt, tt) => {
    const { ctx } = g2, W0 = Rt.work;
    ctx.save(); ctx.beginPath(); ctx.rect(W0.x, W0.y, W0.w, W0.h); ctx.clip();
    const V = stageGeom(W0, SC, SW, SH); geo = { ox: V.ox, oy: V.oy, s: V.s, touch: (g2.px(0) * 44) / 12, dt: 1 / 60 };
    scene(ctx, V, now);
    guideDraw(ctx, V, now);
    ctx.save(); ctx.translate(V.ox, V.oy); ctx.scale(V.s, V.s); drawPulses(ctx, pulses, now); ctx.restore();
    // twist ring around the knot
    if (phase === 'gather' && !done) {
      const K = knobScr(), r = V.s * 0.075, turns = tw / TAU;
      ctx.save(); ctx.lineWidth = V.s * 0.012; ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.arc(K.x, K.y, r, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(142,240,168,0.85)'; ctx.beginPath(); ctx.arc(K.x, K.y, r, -Math.PI / 2 + TAU * (1 / 2), -Math.PI / 2 + TAU * (1.9 / 2) , false); ctx.stroke();   // the good window of turns, drawn once round at half scale for legibility
      ctx.strokeStyle = '#ffd36a'; ctx.beginPath(); ctx.arc(K.x, K.y, r, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(turns / 2, 0, 1)); ctx.stroke(); ctx.restore();
    }
    // the hand: while a pinch or a twist is under way, and in Watch and learn (open while it travels)
    if (pinch && handAt && pinch.da > delta * 0.3) { const h = toScr(handAt.x, handAt.y), kk = clamp(pinch.still / 0.28, 0, 1); ctx.save(); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(h.x, h.y, V.s * 0.05, 0, TAU); ctx.stroke(); ctx.strokeStyle = kk >= 1 ? '#8ef0a8' : '#ffd36a'; ctx.beginPath(); ctx.arc(h.x, h.y, V.s * 0.05, -Math.PI / 2, -Math.PI / 2 + TAU * kk); ctx.stroke(); ctx.restore(); }
    if ((pinch || twDown) && handAt) { const h = toScr(handAt.x, handAt.y); hand(ctx, V.s, h.x, h.y, 1.0, 0); }
    else if (ptr && pilot.busy()) { const h = toScr(ptr.x, ptr.y); hand(ctx, V.s, h.x, h.y, 1.0, ptr.down ? 0 : 0.9); }
    // flash notes
    if (now - flash.t < 1.2) { const msg = flash.k === 'tear' ? 'Torn: pulled too far' : 'Pull the pinch further along the rim'; g2.label(ctx, msg, W0.x + W0.w / 2, W0.y + W0.h * 0.22, g2.px(22), '#ffb0a0', 'center', '700'); }
    // dock gauge: pleats so far
    dockGauge(g2, ctx, W0, { dot: '#e8d8b0', fill: (x, y, w, h) => { ctx.fillStyle = '#e8d8b0'; rrect(ctx, x, y, w * clamp(pleats.length / Math.max(minPleats, 1), 0, 1), h, 5); ctx.fill(); ctx.strokeStyle = 'rgba(142,240,168,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + w, y - 3); ctx.lineTo(x + w, y + h + 3); ctx.stroke(); }, warn: tears.length ? `${tears.length} torn` : undefined });
    ctx.restore();
    hintPill(g2, ctx, W0, hintText());
    // the reference: the finished khinkali on a plate
    drawReference(g2, Rt.thumb, now);
    void tt;
  };
  const drawReference = (g2, th, tt) => {
    const { ctx } = g2, S = Math.min(th.w, th.h * 1.05);
    ctx.save(); ctx.beginPath(); ctx.rect(th.x, th.y, th.w, th.h); ctx.clip();
    const cx = th.x + th.w / 2, cy = th.y + th.h * 0.6;
    ctx.fillStyle = rg(ctx, cx, cy + S * 0.14, 2, S * 0.5, [[0, '#f4f0e8'], [0.8, '#cfc6b4'], [1, '#8a806c']]); ctx.beginPath(); ctx.ellipse(cx, cy + S * 0.16, S * 0.46, S * 0.17, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(cx, cy + S * 0.18, S * 0.34, S * 0.1, 0, 0, TAU); ctx.fill();
    const sc = S * 1.0, V2 = { x: cx - sc * 0.5, y: cy - sc * 0.62 };
    ctx.save(); ctx.translate(V2.x, V2.y); ctx.scale(sc, sc);
    const ps = []; for (let k = 0; k < Nt; k++) ps.push({ a1: a0 + (k + 1) * delta, w: delta * 1.9, tight: 1 });
    drawDumpling(ctx, { R0, rimPhase, a0, cur: a0 + TAU, pleats: ps, g: 1, turns: 1.4, pinch: null, tears: [], t: tt });
    ctx.restore();
    steam(ctx, cx, cy - S * 0.12, S * 0.3, S * 0.4, tt, 0.4, 5);
    ctx.restore();
  };
  const titleArt = (g2, S, tt) => {
    const { ctx } = g2, s = Math.min(S.w / SW, S.h / SH) * 0.98, V = { ox: S.x + (S.w - s * SW) / 2, oy: S.y + (S.h - s * SH) / 2, s };
    const ps = []; for (let k = 0; k < Nt; k++) ps.push({ a1: a0 + (k + 1) * delta, w: delta * 1.9, tight: 1 });
    scene(ctx, V, tt ?? 0, { state: { pleats: ps, a0, cur: a0 + TAU, g: 1, tears: [], pinch: null }, turns: 1.4 });
  };
  const state = () => ({ technique: 'dough', mode: 'pleat-round', phase, n: pleats.length, target: Nt, delta: r3(delta), cur: r3(cur - a0), tears: tears.length, turns: r3(tw / TAU), guide, pinch: pinch ? { da: r3(pinch.da), rho: r3(pinch.rho), still: r3(pinch.still) } : null, steps: pleats.map((p) => r3(p.step)), tightness: pleats.map((p) => r3(p.tightScore)), parts: Object.fromEntries(Object.entries(parts()).map(([k, v]) => [k, r3(v)])) });
  init();
  return {
    init, items, control, work, tick, draw, attract, titleArt, result: () => done, score, hint: hintText,
    info: () => [`Pleats ${pleats.length}/${minPleats}`, phase === 'gather' ? `Topknot ${(tw / TAU).toFixed(1)} turns` : `Spacing ${Math.round(parts().even * 100)}%`],
    get caption() { return SC.words?.caption ?? 'Pleat this khinkali'; },
    rules: () => [
      'The wrapper is pleated round its rim, each fold lying over the last. Press the glowing pinch mark, drag along the rim to the lit mark inside the edge, hold a beat so the fold sets, and let go. The next pinch begins where the last one ended.',
      `At least ${minPleats} pleats make a khinkali that holds its broth. The ring of small marks shows the spacing that closes the circle evenly; Guide cycles bright marks, faint marks and none.`,
      'Spacing counts: pleats of unequal width score less. A fold dropped well inside the lit mark is loose, and letting go before it has set leaves it loose. Dragging further than about two pleats tears the dough, which costs 6 points.',
      'When the circle closes, gather the pleats: circle a finger round the knot for one to two turns, then lift. Too little leaves the top open; more than two turns tears the topknot.',
      'Score: pleat count 30, even spacing 25, tight folds 25, the topknot 20.',
    ],
    point(id) {
      if (!geo) return null;
      if (id === 'pinch') return markerScr();
      if (id === 'pleat') { const rem = a0 + TAU - cur; return targetPt(rem < delta * 1.4 ? rem : delta); }
      if (id === 'knot') return knobScr();
      return null;
    },
    state,
  };
}

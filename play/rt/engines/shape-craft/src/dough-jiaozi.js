// dough technique, mode "pleat-crescent": jiaozi (northern China; momo and gyoza are close cousins). Three dumplings, one after another.
// Each: hold to spoon on the filling (the ring shows the right amount), drag the lower edge up over the top so the edges meet, pinch the middle,
// then run pleats along the front edge toward one end, each a quick flick toward the middle at even spacing, and seal the edge in one smooth stroke.
// The finished dumpling goes onto the tray. Score: filling amount, fold alignment, pleat spacing / depth / reach, the seal.
import { starsFor } from './geom.js';
import { shadowed, rrect, rgba, tint } from './fx.js';
import { bake, lg, rg, TAU, flour, flourCloud, steam, drawHand, board, pin, drawPulses } from './dough-art.js';
import { clamp, lerp, sm, r3, mean, sd, makeSound, stageGeom, createPilot } from './dough-core.js';
import { hintPill, dockGauge } from './paint-ui.js';
import { hash } from './geom.js';

const SW = 1.5, SH = 1.0, WX = 0.54, WY = 0.6, RY = 0.62;   // wrapper centre, and the foreshortening of the circle seen from above
const DOUGH = '#f6ebd0';
const ROUNDS = 3;
const SEALR = 0.935;
const px = (R, a) => [WX + R * Math.cos(a), WY - R * RY * Math.sin(a)];   // a point on the front edge at angle a (0 right end, PI/2 middle, PI left end)

// ---------------------------------------------------------------------------------------------------------------------------------------------
// One dumpling in design units. o: { R, fill (0..1.3), fold (0..1), fdx, mid, pleats: [{ a, len, ok }], seal (coverage 0..1 from the left end), t, ghost, centre: [x, y], scale }
export function drawJiaozi(ctx, o) {
  const { R, fill = 0, fold = 0, fdx = 0, mid = false, pleats = [], seal = 0, t = 0 } = o, [cx, cy] = o.centre ?? [WX, WY], k = o.scale ?? 1;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); ctx.translate(-WX, -WY);
  const belly = R * (0.1 + 0.17 * clamp(fill, 0, 1.2) * (fold > 0.5 ? 1 : 0.4));
  // (the shadow on the board comes from the shapes themselves)
  const disc = (full) => { ctx.beginPath(); ctx.ellipse(WX, WY, R, R * RY, 0, full ? 0 : Math.PI, TAU); };   // the upper half
  const edgeWave = (a) => 1 + 0.012 * Math.sin(a * 9 + 1) + 0.008 * Math.sin(a * 17);
  const wrapper = (clipHalf) => {
    // a thin rolled disc: lighter and a little translucent at the rim, soft rolling lines, flour
    ctx.beginPath(); for (let i = 0; i <= 64; i++) { const a = (i / 64) * TAU, r = R * edgeWave(a); const x = WX + r * Math.cos(a), y = WY + r * RY * Math.sin(a); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.closePath();
    ctx.fillStyle = rg(ctx, WX, WY, R * 0.1, R * 1.02, [[0, tint(DOUGH, -0.1)], [0.6, DOUGH], [0.92, tint(DOUGH, 0.07)], [1, rgba(tint(DOUGH, 0.2), 0.82)]], WX - R * 0.25, WY - R * 0.3);
    ctx.shadowColor = 'rgba(40,22,6,0.4)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(120,90,40,0.07)'; ctx.lineWidth = 0.003; for (let q = 0; q < 4; q++) { ctx.beginPath(); ctx.ellipse(WX, WY, R * (0.45 + q * 0.14), R * RY * (0.45 + q * 0.14), 0, 0, TAU); ctx.stroke(); }
    flour(ctx, WX, WY, R * 0.9, R * 0.8, 110, 8, 0.45, 0.004); ctx.restore();
    ctx.strokeStyle = 'rgba(255,252,240,0.6)'; ctx.lineWidth = 0.004; ctx.beginPath(); for (let i = 0; i <= 64; i++) { const a = (i / 64) * TAU, r = R * edgeWave(a) - 0.003; const x = WX + r * Math.cos(a), y = WY + r * RY * Math.sin(a); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke();
    void clipHalf;
  };
  if (fold < 0.01) {
    wrapper();
    if (fill > 0.02) dollop(ctx, WX, WY + 0.01, R * 0.5 * Math.pow(clamp(fill, 0, 1.4), 0.6), RY, t);
  } else if (fold < 0.999) {
    // the lower half is lifted about the diameter and laid over the top: a flap scaled by cos
    ctx.save(); ctx.beginPath(); ctx.rect(WX - R * 1.3, WY - R * 1.3, R * 2.6, R * 1.3); ctx.clip(); wrapper(); ctx.restore();   // the fixed upper half
    if (fill > 0.02) dollop(ctx, WX, WY - 0.005, R * 0.5 * Math.pow(clamp(fill, 0, 1.4), 0.6), RY, t, 1);
    const c = Math.cos(Math.PI * fold), up = fold > 0.5;
    ctx.save(); ctx.translate(WX, WY); ctx.scale(1, c); ctx.translate(-WX, -WY);
    ctx.save(); ctx.beginPath(); ctx.rect(WX - R * 1.3, WY, R * 2.6, R * 1.3); ctx.clip(); wrapper(); ctx.restore();
    ctx.restore();
    // the lifted flap darkens a little as it passes over, and throws a soft shadow
    ctx.fillStyle = `rgba(60,36,10,${0.16 * Math.sin(Math.PI * fold)})`; ctx.beginPath(); ctx.ellipse(WX, WY + R * RY * 0.4 * c, R * 0.9, R * RY * 0.4 * Math.abs(c), 0, 0, TAU); ctx.fill(); void up;
  } else {
    // folded: a half-moon, the doubled rim on top, the belly of the filling below the fold
    ctx.save(); ctx.translate(fdx * 0.0, 0);
    const back = () => { ctx.beginPath(); ctx.moveTo(WX - R, WY); ctx.ellipse(WX, WY, R, R * RY, 0, Math.PI, TAU); ctx.bezierCurveTo(WX + R, WY + belly * 1.0, WX + R * 0.5, WY + belly * 1.28, WX, WY + belly * 1.28); ctx.bezierCurveTo(WX - R * 0.5, WY + belly * 1.28, WX - R, WY + belly * 1.0, WX - R, WY); ctx.closePath(); };
    back();
    ctx.fillStyle = lg(ctx, WX - R * 0.4, WY - R, WX + R * 0.4, WY + belly * 1.3, [[0, tint(DOUGH, 0.04)], [0.45, DOUGH], [0.8, tint(DOUGH, -0.12)], [1, tint(DOUGH, -0.3)]]); ctx.shadowColor = 'rgba(40,22,6,0.45)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.save(); back(); ctx.clip();
    // the filling swells the belly: a soft lit dome with a hint of the meat through thin dough
    ctx.fillStyle = rg(ctx, WX - R * 0.2, WY + belly * 0.2, 0.01, R * 0.9, [[0, 'rgba(255,255,255,0.32)'], [0.5, 'rgba(255,255,255,0.06)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(WX - R * 1.2, WY - R, R * 2.4, R * 2 + belly * 2);
    ctx.fillStyle = rg(ctx, WX, WY - R * 0.1, 0.01, R * 0.85, [[0, 'rgba(196,112,98,0.3)'], [0.6, 'rgba(160,150,90,0.14)'], [1, 'rgba(190,110,96,0)']]); ctx.fillRect(WX - R * 1.2, WY - R, R * 2.4, R * 2 + belly * 2);
    ctx.strokeStyle = 'rgba(120,80,30,0.16)'; ctx.lineWidth = 0.004; ctx.beginPath(); ctx.moveTo(WX - R * 0.96, WY + 0.002); ctx.bezierCurveTo(WX - R * 0.5, WY + belly * 0.3, WX + R * 0.5, WY + belly * 0.3, WX + R * 0.96, WY + 0.002); ctx.stroke();
    flour(ctx, WX, WY + belly * 0.4, R * 0.8, belly * 0.8 + 0.02, 70, 15, 0.4, 0.004); ctx.restore();
    // the rim: a flat band along the arc, where the front layer lies a little in from the back one (shifted by the misalignment)
    const band = 0.034 * R / 0.27;
    ctx.save(); ctx.beginPath(); ctx.ellipse(WX, WY, R, R * RY, 0, Math.PI, TAU); ctx.ellipse(WX, WY, R - band, (R - band) * RY, 0, TAU, Math.PI, true); ctx.closePath();
    ctx.fillStyle = lg(ctx, WX, WY - R, WX, WY - R + band * 2, [[0, tint(DOUGH, 0.15)], [1, tint(DOUGH, -0.05)]]); ctx.fill(); ctx.restore();
    const off = fdx * 0.9;   // front layer sits off the back layer when the fold missed
    if (Math.abs(off) > 0.004) { ctx.strokeStyle = 'rgba(90,60,20,0.5)'; ctx.lineWidth = 0.004; ctx.beginPath(); ctx.ellipse(WX + off, WY, R - band, (R - band) * RY, 0, Math.PI, TAU); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,252,240,0.55)'; ctx.lineWidth = 0.004; ctx.beginPath(); ctx.ellipse(WX, WY, R - 0.002, (R - 0.002) * RY, 0, Math.PI * 1.04, Math.PI * 1.96); ctx.stroke();
    // sealed length so far: the seam shows as a pressed groove
    if (seal > 0.01) { ctx.strokeStyle = 'rgba(100,66,24,0.55)'; ctx.lineWidth = 0.006; ctx.beginPath(); const a1 = Math.PI - seal * Math.PI; for (let i = 0; i <= 40; i++) { const a = Math.PI - ((Math.PI - a1) * i) / 40, q = px(R - band * 0.5, a); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); } ctx.stroke(); ctx.strokeStyle = 'rgba(255,252,240,0.5)'; ctx.lineWidth = 0.0025; ctx.beginPath(); for (let i = 0; i <= 40; i++) { const a = Math.PI - ((Math.PI - a1) * i) / 40, q = px(R - band * 0.5 - 0.004, a); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); } ctx.stroke(); }
    // the pinch in the middle
    if (mid) { const q = px(R - band * 0.4, Math.PI / 2); ctx.fillStyle = 'rgba(110,76,30,0.4)'; ctx.beginPath(); ctx.ellipse(q[0], q[1], 0.012, 0.008, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,252,240,0.7)'; ctx.lineWidth = 0.003; ctx.beginPath(); ctx.moveTo(q[0] - 0.012, q[1] + 0.012); ctx.lineTo(q[0] + 0.012, q[1] - 0.004); ctx.stroke(); }
    // the pleats: a crimped band along the edge. Each pleat is a crease that leans toward the middle; between creases the dough bulges out in a petal.
    if (pleats.length) {
      const cr = [Math.PI / 2, ...pleats.slice().sort((u, v) => v.a - u.a).map((q) => q.a)];   // creases from the middle toward the end
      const lean = 0.15, ri = R - band * 1.5, ro = R + 0.004;
      for (let j = cr.length - 2; j >= -1; j--) {
        const aa = j >= 0 ? cr[j] : cr[0] + 0.04, bb = j >= 0 ? cr[j + 1] : cr[0], mid2 = (aa + bb) / 2;
        const P1 = px(ro, aa), P2 = px(ro, bb), P3 = px(ri, bb + lean), P4 = px(ri, aa + lean), M1 = px(R + 0.024, mid2 + 0.01), M2 = px(ri - 0.004, mid2 + lean);
        ctx.save(); ctx.fillStyle = lg(ctx, P1[0], P1[1], P2[0], P2[1], [[0, tint(DOUGH, 0.2)], [0.5, tint(DOUGH, 0.03)], [1, tint(DOUGH, -0.2)]]); ctx.shadowColor = 'rgba(40,22,6,0.5)'; ctx.shadowBlur = 4; ctx.shadowOffsetX = -1; ctx.shadowOffsetY = 2;
        ctx.beginPath(); ctx.moveTo(P1[0], P1[1]); ctx.quadraticCurveTo(M1[0], M1[1], P2[0], P2[1]); ctx.lineTo(P3[0], P3[1]); ctx.quadraticCurveTo(M2[0], M2[1], P4[0], P4[1]); ctx.closePath(); ctx.fill(); ctx.restore();
        // the bulge catches the light on its upper side
        ctx.strokeStyle = 'rgba(255,252,240,0.6)'; ctx.lineWidth = 0.003; ctx.beginPath(); ctx.moveTo(P1[0] + 0.002, P1[1] + 0.001); ctx.quadraticCurveTo(M1[0], M1[1] + 0.003, P2[0] - 0.002, P2[1] + 0.001); ctx.stroke();
        ctx.fillStyle = 'rgba(255,252,240,0.2)'; ctx.beginPath(); ctx.ellipse((M1[0] + M2[0]) / 2, (M1[1] + M2[1]) / 2 - 0.004, 0.011, 0.007, -0.6, 0, TAU); ctx.fill();
        if (j >= 0) { // the crease itself: a dark groove with a lit lip
          ctx.strokeStyle = 'rgba(96,62,22,0.55)'; ctx.lineWidth = 0.0032; ctx.beginPath(); ctx.moveTo(P1[0], P1[1]); ctx.lineTo(P4[0], P4[1]); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,252,240,0.5)'; ctx.lineWidth = 0.0018; ctx.beginPath(); ctx.moveTo(P1[0] - 0.0025, P1[1] + 0.001); ctx.lineTo(P4[0] - 0.0025, P4[1] + 0.001); ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
  ctx.restore();
}

// The sealed dumpling curls into a crescent: drawn into a baked layer, then laid down in thin vertical strips whose ends rise (visual only).
function drawBent(ctx, o, bend) {
  const R = o.R, x0 = WX - R * 1.16, w = R * 2.32, y0 = WY - R * 1.05, h = R * 2.0;
  const key = `jz|${Math.round(R * 1000)}|${Math.round((o.fill ?? 0) * 100)}|${(o.pleats ?? []).map((p) => Math.round(p.a * 100)).join(',')}`;
  const b = bake(ctx, key, w, h, (c2) => { c2.translate(-x0, -y0); drawJiaozi(c2, { ...o, centre: [WX, WY], scale: 1 }); }, 1000);
  if (!b) { drawJiaozi(ctx, o); return; }
  const k = b.canvas.width / w, N = 48, sw = b.canvas.width / N;
  for (let i = 0; i < N; i++) { const u = ((i + 0.5) / N - 0.5) * 2, dy = -bend * R * u * u; ctx.drawImage(b.canvas, i * sw, 0, sw + 1, b.canvas.height, x0 + (i * sw) / k, y0 + dy, sw / k + 0.0015, h); }
}

// The filling: a mound of chopped pork and cabbage, with flecks of green and ginger and a glossy sheen.
function dollop(ctx, x, y, r, ry, t, a = 1) {
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(40,22,6,0.28)'; ctx.beginPath(); ctx.ellipse(x + r * 0.08, y + r * 0.18, r * 1.04, r * ry * 0.98, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = rg(ctx, x, y, r * 0.1, r * 1.1, [[0, '#d99a84'], [0.55, '#b9755f'], [1, '#8a4c3c']], x - r * 0.3, y - r * 0.35); ctx.beginPath(); ctx.ellipse(x, y, r, r * ry * 0.92, 0, 0, TAU); ctx.fill();
  ctx.save(); ctx.clip();
  for (let i = 0; i < 46; i++) { const ang = hash(i, 31) * TAU, d = Math.sqrt(hash(i, 32)) * 0.95, fx = x + Math.cos(ang) * r * d, fy = y + Math.sin(ang) * r * d * ry, sz = r * (0.05 + hash(i, 33) * 0.07); ctx.fillStyle = ['#88a864', '#a8c080', '#e8d8a0', '#f0e6c8', '#7a9a58'][i % 5]; ctx.globalAlpha = a * 0.85; ctx.beginPath(); ctx.ellipse(fx, fy, sz, sz * 0.7, hash(i, 34) * 3, 0, TAU); ctx.fill(); }
  ctx.restore(); ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(255,255,255,0.42)'; ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * ry * 0.4, r * 0.32, r * ry * 0.13, -0.4, 0, TAU); ctx.fill();
  ctx.restore(); void t;
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
export function createJiaozi(P, env) {
  const { rng, fx } = env, SC = P.scene ?? {};
  const snd = makeSound(env, (F) => ({
    scoop() { F('scrape', { hz: 900, dur: 0.07, vel: 0.18 }); },
    dollop(q) { F('impact', { mat: 'clay', hz: 120 + q * 60, vel: 0.3 }); },
    fold() { F('whoosh', { dur: 0.22, vel: 0.3 }); F('thud', { hz: 130, vel: 0.28, delay: 0.16 }); },
    pinch() { F('scrape', { hz: 1100, dur: 0.06, vel: 0.24 }); F('tick', { hz: 1800, vel: 0.14, delay: 0.02 }); },
    pleat(q) { F('thud', { hz: 130 + q * 50, vel: 0.22 }); F('scrape', { hz: 1200 + q * 500, dur: 0.06, vel: 0.26, delay: 0.012 }); },
    seal() { F('scrape', { hz: 700, dur: 0.1, vel: 0.15 }); },
    bad() { F('bad', { hz: 210, vel: 0.3 }); },
    tray() { F('thud', { hz: 90, vel: 0.35 }); F('good', { hz: 700, vel: 0.4, delay: 0.05 }); },
    win(stars) { F('good', { hz: 600 + stars * 70, vel: 0.5 }); F('chime', { hz: 1180, vel: 0.28, delay: 0.1 }); },
    mode() { F('tick', { hz: 1500, vel: 0.3 }); },
  }), 'jiaozi');
  const NPL = Math.max(4, Math.round(P.pleats ?? 6)), pilot = createPilot();
  let pulses, round, R, phase, amount, foldP, foldDx, foldDrag, midDone, midHold, midAcc, pleats, sealCov, sealDev, sealN, sealDown, pleatDrag, tray, rounds, done, guide, now, geo, lastP, ptr, handAt, flash, settleT, fillDown, fillAcc, steamT, spoonAt;
  let step, a0;

  const init = () => {
    pulses = []; round = 0; tray = []; rounds = []; done = null; guide = 1; now = 0; lastP = null; ptr = null; handAt = null; flash = { t: -9, k: '' }; pilot.clear(); newRound();
  };
  const newRound = () => {
    R = 0.255 + rng.next() * 0.04; phase = 'fill'; amount = 0; foldP = 0; foldDx = 0; foldDrag = null; midDone = false; midHold = 0; midAcc = null; pleats = []; sealCov = 0; sealDev = []; sealN = 0; sealDown = false; pleatDrag = null; settleT = 0; fillDown = false; fillAcc = 0; spoonAt = null;
    a0 = Math.PI / 2; step = (Math.PI / 2) / (NPL + 0.3);
  };
  // ---- scoring of one dumpling
  const roundParts = () => {
    const fillS = phase === 'fill' && amount < 0.05 ? 0 : clamp(1 - Math.abs(amount - 0.92) / 0.5, 0, 1);
    const foldS = foldP >= 0.999 ? clamp(1 - Math.abs(foldDx) / (R * 0.4), 0, 1) : 0;
    const pos = pleats.map((p) => p.a), gaps = pos.map((a, i) => (i ? pos[i - 1] - a : a0 - a));
    const reach = pleats.length ? clamp(1 - (pos[pos.length - 1] - 0.08) / 0.5, 0, 1) : 0, count = clamp(pleats.length / NPL, 0, 1);
    const even = gaps.length >= 3 ? clamp(1 - (sd(gaps) / (mean(gaps) || 1) - 0.06) / 0.3, 0, 1) : 0;
    const depth = pleats.length ? mean(pleats.map((p) => p.q)) : 0;
    const pleatS = 0.35 * even + 0.25 * depth + 0.2 * count + 0.2 * reach;
    const sealS = sealCov >= 0.85 ? clamp(1 - mean(sealDev) / 0.07, 0, 1) * clamp(sealCov, 0, 1) : sealCov * 0.4 * (mean(sealDev) < 0.07 ? 1 : 0.5);
    const midS = midDone ? midAcc : 0;
    return { fill: fillS, fold: foldS, mid: midS, pleat: pleatS, seal: sealS, even, depth, count, reach };
  };
  const roundScore = (pp) => 100 * (0.16 * pp.fill + 0.16 * pp.fold + 0.06 * pp.mid + 0.42 * pp.pleat + 0.2 * pp.seal);
  const total = () => { const cur = rounds.map((r) => r.score), live = phase === 'settle' || done ? [] : [roundScore(roundParts())]; return Math.round((cur.reduce((s, v) => s + v, 0) + live.reduce((s, v) => s + v, 0)) / ROUNDS); };
  const score = () => (done ? done.score : total());
  const finish = () => {
    if (done) return;
    const sc = Math.round(mean(rounds.map((r) => r.score))), stars = starsFor(sc);
    const avg = (k) => Math.round(mean(rounds.map((r) => r.p[k])) * 100);
    done = { score: sc, max: 100, stars, headline: stars === 3 ? 'A tray worth steaming' : stars ? 'Good dumplings' : 'Back to the board', detail: `filling ${avg('fill')} percent, folds ${avg('fold')} percent, pleats ${avg('pleat')} percent, seams ${avg('seal')} percent` };
    snd.win(stars);
  };

  // ---- geometry
  const toScr = (u, v) => ({ x: geo.ox + u * geo.s, y: geo.oy + v * geo.s });
  const topEnd = () => px(R, Math.PI / 2);
  const foldStart = () => [WX, WY + R * RY];
  const sealHead = () => px(R * SEALR, Math.PI - sealCov * Math.PI);
  const pleatTarget = () => { const k = pleats.length + 1, a = a0 - k * step; return px(R, Math.max(0.03, a)); };
  const arcOf = (x, y) => { const u = (x - WX) / R, v = -(y - WY) / (R * RY); return { a: Math.atan2(v, u), r: Math.hypot(u, v) }; };

  // ---- input (design units, shared with Watch and learn)
  const finishRound = () => {
    const pp = roundParts(), sc = roundScore(pp);
    rounds.push({ score: sc, p: pp, R, n: pleats.length, belly: amount, pleats: pleats.map((q) => ({ a: q.a })), foldDx });
    tray.push({ R, fill: amount, pleats: pleats.map((q) => ({ a: q.a })), seal: 1, foldDx });
    phase = 'settle'; settleT = 0; snd.tray();
  };
  const workD = (p, dt) => {
    if (done) return;
    const spd = lastP ? Math.hypot(p.x - lastP.x, p.y - lastP.y) / Math.max(dt, 1e-4) : 0; lastP = { x: p.x, y: p.y };
    const touchD = geo ? geo.touch / geo.s : 0.1, cap = Math.max(0.09, touchD * 0.9);
    if (phase === 'fill') {
      if (p.pressed && Math.hypot(p.x - WX, (p.y - WY) / RY) <= R * 0.8) { fillDown = true; snd.scoop(); }
      if (fillDown && p.down) { const before = amount; amount = Math.min(1.45, amount + dt / 1.45); spoonAt = { x: p.x, y: p.y }; fillAcc += dt; if (Math.floor(before * 6) !== Math.floor(amount * 6)) snd.dollop(amount); }
      if (fillDown && (p.released || !p.down)) { fillDown = false; spoonAt = null; }
      if (!fillDown && amount > 0.05 && p.pressed) { const b = foldStart(); if (Math.hypot(p.x - b[0], p.y - b[1]) <= cap) { phase = 'fold'; foldDrag = { y0: p.y }; handAt = { x: p.x, y: p.y }; snd.pinch(); } }
    } else if (phase === 'fold') {
      if (!foldDrag && p.pressed) { const b = foldStart(); if (Math.hypot(p.x - b[0], p.y - b[1]) <= cap) { foldDrag = { y0: p.y }; snd.pinch(); } }
      if (foldDrag && p.down) { foldP = clamp((foldStart()[1] - p.y) / (2 * R * RY), 0, 1); foldDx = p.x - WX; handAt = { x: p.x, y: p.y }; }
      if (foldDrag && (p.released || !p.down)) { foldDrag = null; if (foldP >= 0.84) { foldP = 1; phase = 'mid'; pulses.push({ x: WX, y: WY, t: now }); snd.fold(); } else { foldP = 0; foldDx = 0; snd.bad(); flash = { t: now, k: 'fold' }; } }
    } else if (phase === 'mid') {
      const m = topEnd();
      if (p.pressed && Math.hypot(p.x - (m[0] + foldDx * 0.9), p.y - m[1]) <= cap) { midHold = 0; midAcc = clamp(1 - Math.hypot(p.x - (m[0] + foldDx * 0.9), p.y - m[1]) / cap * 0.4, 0.5, 1); pleatDrag = { mid: true }; handAt = { x: p.x, y: p.y }; snd.pinch(); }
      if (pleatDrag?.mid && p.down) { midHold += dt; handAt = { x: p.x, y: p.y }; }
      if (pleatDrag?.mid && (p.released || !p.down)) { pleatDrag = null; if (midHold >= 0.15) { midDone = true; phase = 'pleat'; { const mp = topEnd(); pulses.push({ x: mp[0], y: mp[1], t: now }); } snd.pleat(0.8); } else snd.bad(); }
    } else if (phase === 'pleat') {
      if (p.pressed && !pleatDrag) { const q = arcOf(p.x, p.y); if (q.a > 0 && q.a < a0 - step * 0.3 && Math.abs(q.r - 1) <= Math.max(0.25, cap / R)) { pleatDrag = { a: q.a, x0: p.x, y0: p.y, t0: now, path: 0 }; snd.pinch(); handAt = { x: p.x, y: p.y }; } }
      if (pleatDrag && p.down) { pleatDrag.path += Math.hypot(p.x - (pleatDrag.lx ?? p.x), p.y - (pleatDrag.ly ?? p.y)); pleatDrag.lx = p.x; pleatDrag.ly = p.y; pleatDrag.x = p.x; pleatDrag.y = p.y; handAt = { x: p.x, y: p.y }; }
      if (pleatDrag && (p.released || !p.down)) {
        const d = pleatDrag; pleatDrag = null;
        // the flick must head toward the middle (leftward along the front edge, and a little inward)
        const tx = d.x ?? d.x0, ty = d.y ?? d.y0, dx = tx - d.x0, dy = ty - d.y0, len = Math.hypot(dx, dy), q = clamp(1 - Math.abs(len / R - 0.2) / 0.2, 0, 1);
        const prev = pleats.length ? pleats[pleats.length - 1].a : a0;
        if (len < R * 0.07) { snd.bad(); flash = { t: now, k: 'short' }; }
        else if (dx > 0 && Math.abs(dx) > Math.abs(dy)) { snd.bad(); flash = { t: now, k: 'way' }; }
        else if (prev - d.a < step * 0.4) { snd.bad(); flash = { t: now, k: 'near' }; }
        else { pleats.push({ a: d.a, len: r3(len / R), q: 0.4 + 0.6 * q, qq: q }); { const pp = px(R, d.a); pulses.push({ x: pp[0], y: pp[1], t: now, col: q > 0.8 ? '#d8ffe4' : '#ffe8a0' }); } snd.pleat(q); const s2 = geo && px(R, d.a); if (geo) { const sp = toScr(s2[0], s2[1]); fx.emit('dust', sp.x, sp.y, { count: 4, color: '#fffaf0', size: 3.5, speed: 30, life: 0.5, gravity: -10 }); } if (d.a <= 0.2) { /* the end: sealing is next */ } }
        void spd;
      }
      if (!pleatDrag && pleats.length >= 3 && p.pressed) { const h = sealHead(); if (Math.hypot(p.x - h[0], p.y - h[1]) <= cap && pleatReady()) { phase = 'seal'; sealDown = true; sealDev = []; handAt = { x: p.x, y: p.y }; snd.pinch(); } }
    } else if (phase === 'seal') {
      if (!sealDown && p.pressed) { const h = sealHead(); if (Math.hypot(p.x - h[0], p.y - h[1]) <= cap * 1.3) { sealDown = true; snd.pinch(); } }
      if (sealDown && p.down) {
        const q = arcOf(p.x, p.y), prog = clamp((Math.PI - q.a) / Math.PI, 0, 1.02);
        if (prog > sealCov && prog - sealCov < 0.25) { sealCov = Math.min(1, prog); sealDev.push(Math.abs(q.r - SEALR)); sealN++; if (sealN % 6 === 0) snd.seal(); }
        handAt = { x: p.x, y: p.y };
      }
      if (sealDown && (p.released || !p.down)) { sealDown = false; if (sealCov >= 0.93) { sealCov = 1; finishRound(); } }
    }
  };
  const flickEnd = (a) => { const q0 = px(R, a), tx = -Math.sin(a), ty = -RY * Math.cos(a), ix = -Math.cos(a), iy = RY * Math.sin(a), tl = Math.hypot(tx, ty), il = Math.hypot(ix, iy); let dx = 0.85 * tx / tl + 0.45 * ix / il, dy = 0.85 * ty / tl + 0.45 * iy / il; const dl = Math.hypot(dx, dy); return [q0[0] + (dx / dl) * 0.2 * R, q0[1] + (dy / dl) * 0.2 * R]; };
  const pleatReady = () => pleats.length >= Math.min(NPL, 4) && pleats[pleats.length - 1].a < 0.5 * a0;
  const work = (p) => { if (!geo) return; workD({ x: (p.x - geo.ox) / geo.s, y: (p.y - geo.oy) / geo.s, down: p.down, pressed: p.pressed, released: p.released }, 1 / 60); };
  const control = (id) => {
    if (done || phase === 'settle') return;
    if (id === 'undo') {
      if (phase === 'pleat' && pleats.length) { pleats.pop(); snd.mode(); }
      else if (phase === 'seal') { sealCov = 0; sealDev = []; phase = 'pleat'; snd.mode(); }
    } else if (id === 'guide') { guide = (guide + 1) % 3; snd.mode(); }
  };
  const items = () => [{ id: 'undo', kind: 'btn', label: 'Undo', off: !(phase === 'pleat' && pleats.length) && phase !== 'seal' }, { id: 'guide', kind: 'btn', label: ['Guide on', 'Faint', 'No guide'][guide] }];
  const tick = (dt) => {
    now += dt; steamT = now;
    if (phase === 'fold' && !foldDrag && foldP < 1) foldP = Math.max(0, foldP - dt * 3);
    if (phase === 'settle') { settleT += dt; if (settleT > 1.1) { if (round + 1 >= ROUNDS) { finish(); } else { round++; newRound(); } } }
  };

  // ---- Watch and learn
  const attract = (dt) => {
    if (done) return;
    if (!pilot.busy() && phase !== 'settle') {
      if (phase === 'fill' && amount < 0.9) pilot.push({ pts: [[WX, WY]], hold: 1.35, lead: round ? 0.3 : 0.7 });
      else if (phase === 'fill' || phase === 'fold') { if (foldP < 1) pilot.push({ pts: () => { const b = foldStart(); return [[b[0], b[1]], [WX, WY + (b[1] - WY) * 0.3], [WX, WY - R * RY * 0.98]]; }, dur: [0.35, 0.35], hold: 0.12, lead: 0.2 }); }
      else if (phase === 'mid') { const m = topEnd(); pilot.push({ pts: [[m[0], m[1]]], hold: 0.3, lead: 0.2 }); }
      else if (phase === 'pleat') {
        const tg = pleatTarget(), a = Math.max(0.03, a0 - (pleats.length + 1) * step);
        if (pleats.length < NPL) pilot.push({ pts: () => { const q0 = px(R, a), q1 = flickEnd(a); return [[q0[0], q0[1]], [q1[0], q1[1]]]; }, dur: [0.14], hold: 0.04, lead: 0.28 });
        else { const h = sealHead(); pilot.push({ pts: [[h[0], h[1]]], hold: 0.04, lead: 0.3 }); }
        void tg;
      } else if (phase === 'seal') {
        const pts = []; for (let i = 0; i <= 16; i++) { const a = Math.PI * (1 - sealCov) - ((Math.PI * (1 - sealCov)) * i) / 16; const q = px(R * SEALR, a); pts.push(q); }
        pilot.push({ pts, dur: new Array(16).fill(0.09), linear: true, hold: 0.2, lead: 0.25 });
      }
    }
    const p = pilot.step(dt); ptr = { x: p.x, y: p.y, down: p.down }; workD({ x: p.x, y: p.y, down: p.down, pressed: p.pressed, released: p.released }, dt);
  };

  // ---- drawing
  const hintText = () => {
    if (done) return '';
    if (flash && now - flash.t < 2) return { fold: 'Pull the lower edge all the way up to the top edge.', short: 'A quicker, longer flick toward the middle.', way: 'Flick toward the middle, away from the end.', near: 'Too close to the last pleat.' }[flash.k] ?? '';
    return { fill: amount < 0.05 ? 'Hold on the wrapper to spoon on the filling; stop when the ring is full.' : 'Now drag the lower edge up: press the glowing mark at the bottom.', fold: 'Drag the lower edge up over the top so the edges meet.', mid: 'Pinch the middle of the edge: press and hold a moment.', pleat: pleats.length < NPL ? 'Flick a pleat toward the middle at each lit mark, working toward the end.' : 'Now seal: press at the left end and run along the whole edge.', seal: 'Run along the edge in one smooth stroke to seal it.', settle: '' }[phase] ?? '';
  };
  const hand = (ctx, s, x, y, ang, pose, open = 0) => drawHand(ctx, x, y, { rot: ang, k: s * 0.0021, pose, open, skin: SC.skin, sleeve: SC.sleeve });
  const drawBoardAndProps = (ctx, V, tt) => {
    const { ox, oy, s } = V;
    board(ctx, ox + s * 0.04, oy + s * 0.09, s * 1.0, s * 0.88, { c: '#e0c48c', thick: s * 0.012, seed: 21, r: s * 0.03, knots: false });
    flourCloud(ctx, ox + s * 0.54, oy + s * 0.6, s * 0.42, s * 0.28, 5, 0.22);
    // the filling bowl and spoon, top left
    const bx = ox + s * 0.2, by = oy + s * 0.24, br = s * 0.12;
    ctx.save(); ctx.fillStyle = 'rgba(40,22,6,0.3)'; ctx.beginPath(); ctx.ellipse(bx + 4, by + br * 0.5, br * 1.02, br * 0.72, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = lg(ctx, bx - br, by, bx + br, by, [[0, '#9ab0b8'], [0.3, '#f2f6f8'], [0.7, '#c8d4da'], [1, '#6a7a84']]); ctx.beginPath(); ctx.ellipse(bx, by, br, br * 0.72, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = rg(ctx, bx, by, 2, br, [[0, '#d99a84'], [0.6, '#b9755f'], [1, '#8a4c3c']], bx - br * 0.2, by - br * 0.2); ctx.beginPath(); ctx.ellipse(bx, by - 2, br * 0.84, br * 0.56, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 26; i++) { const a = hash(i, 5) * TAU, d = Math.sqrt(hash(i, 6)) * 0.8; ctx.fillStyle = ['#88a864', '#e8d8a0', '#a8c080'][i % 3]; ctx.beginPath(); ctx.ellipse(bx + Math.cos(a) * br * 0.82 * d, by - 2 + Math.sin(a) * br * 0.54 * d, br * 0.06, br * 0.04, a, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(bx - br * 0.35, by - br * 0.32, br * 0.3, br * 0.1, -0.4, 0, TAU); ctx.fill();
    ctx.restore();
    // small saucer of water and a wooden rolling pin
    pin(ctx, ox + s * 0.34, oy + s * 0.95, s * 0.42, -0.04, s * 0.022, { c: '#d6b176' });
    void tt;
  };
  const drawTray = (ctx, V, tt) => {
    const { ox, oy, s } = V, x = ox + s * 1.1, y = oy + s * 0.2, w = s * 0.36, h = s * 0.74;
    shadowed(ctx, () => { rrect(ctx, x, y, w, h, s * 0.02); ctx.fillStyle = '#7a5530'; ctx.fill(); }, { blur: 14, dy: 6, a: 0.5 });
    rrect(ctx, x, y, w, h, s * 0.02); ctx.fillStyle = lg(ctx, x, y, x + w, y + h, [[0, '#d8b57a'], [1, '#a47c46']]); ctx.fill();
    // a woven bamboo-style base with a dusting of flour
    ctx.save(); rrect(ctx, x + s * 0.012, y + s * 0.012, w - s * 0.024, h - s * 0.024, s * 0.014); ctx.clip(); ctx.fillStyle = '#e9d6a8'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(150,110,50,0.3)'; ctx.lineWidth = 1; for (let q = 0; q < h; q += 9) { ctx.beginPath(); ctx.moveTo(x, y + q); ctx.lineTo(x + w, y + q); ctx.stroke(); } for (let q = 0; q < w; q += 9) { ctx.beginPath(); ctx.moveTo(x + q, y); ctx.lineTo(x + q, y + h); ctx.stroke(); }
    flourCloud(ctx, x + w / 2, y + h / 2, w * 0.4, h * 0.4, 9, 0.2); ctx.restore();
    for (let i = 0; i < ROUNDS; i++) {
      const cx = x + w / 2, cy = y + h * (0.2 + i * 0.3);
      ctx.strokeStyle = 'rgba(80,50,16,0.22)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(cx, cy, w * 0.36, w * 0.24, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      const d = tray[i]; if (!d) continue;
      let sc = (w * 0.74) / (2 * R * s) , lift = 0;
      if (i === tray.length - 1 && phase === 'settle') { const u = sm(settleT / 0.9); sc = lerp(1, sc, u); lift = (1 - u); const sx = WX * s + ox, sy = WY * s + oy; ctx.save(); ctx.translate(lerp(sx, cx, u) - cx, lerp(sy, cy, u) - cy - Math.sin(u * Math.PI) * s * 0.06); }
      else ctx.save();
      ctx.save(); ctx.translate(cx, cy); ctx.scale(s * sc, s * sc); ctx.translate(-WX, -WY - 0.02);
      drawBent(ctx, { R: d.R, fill: d.fill, fold: 1, fdx: d.foldDx, mid: true, pleats: d.pleats, seal: 1, t: tt }, 0.3);
      ctx.restore(); ctx.restore(); void lift;
    }
    steam(ctx, x + w / 2, y + h * 0.5, w * 0.5, h * 0.4, tt, 0.18, 7);
  };
  const guideDraw = (ctx, V, tt) => {
    if (done || guide === 2 || phase === 'settle') return;
    const A = guide === 1 ? 1 : 0.55, pulse = 0.6 + 0.4 * Math.sin(tt * 5);
    ctx.save(); ctx.translate(V.ox, V.oy); ctx.scale(V.s, V.s);
    const mark = (q, r, col = '#ffd36a') => { ctx.fillStyle = rgba(col, (0.28 + 0.22 * pulse) * A); ctx.beginPath(); ctx.arc(q[0], q[1], r * (1 + 0.1 * pulse), 0, TAU); ctx.fill(); ctx.strokeStyle = rgba('#fff2c0', 0.9 * A); ctx.lineWidth = 0.005; ctx.beginPath(); ctx.arc(q[0], q[1], r * 0.78, 0, TAU); ctx.stroke(); };
    if (phase === 'fill') {
      // the amount ring round the dollop: it fills as you hold, the green band is the right amount
      const r = R * 0.62, rr = r * RY * 1.15; ctx.lineWidth = 0.012; ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.ellipse(WX, WY, r, rr, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(142,240,168,0.85)'; ctx.beginPath(); ctx.ellipse(WX, WY, r, rr, 0, -Math.PI / 2 + TAU * 0.8 / 1.45, -Math.PI / 2 + TAU * 1.04 / 1.45); ctx.stroke();
      ctx.strokeStyle = amount > 1.08 ? '#ff8a70' : '#ffd36a'; ctx.beginPath(); ctx.ellipse(WX, WY, r, rr, 0, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(amount / 1.45, 0, 1)); ctx.stroke();
      if (amount > 0.05) { const b = foldStart(); mark(b, 0.035); }
    } else if (phase === 'fold') { const b = foldStart(), t2 = [WX, WY - R * RY]; mark(b, 0.035); ctx.strokeStyle = rgba('#8ef0a8', 0.6 * A); ctx.lineWidth = 0.006; ctx.setLineDash([0.012, 0.012]); ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(t2[0], t2[1]); ctx.stroke(); ctx.setLineDash([]); mark(t2, 0.03, '#8ef0a8'); }
    else if (phase === 'mid') mark([topEnd()[0] + foldDx * 0.9, topEnd()[1]], 0.034);
    else if (phase === 'pleat') {
      for (let k = 1; k <= NPL; k++) { const a = Math.max(0.03, a0 - k * step), q = px(R + 0.045, a), nx = k === pleats.length + 1; ctx.fillStyle = rgba(nx ? '#8ef0a8' : '#ffffff', nx ? 0.95 : 0.5 * A); ctx.beginPath(); ctx.arc(q[0], q[1], nx ? 0.011 : 0.0065, 0, TAU); ctx.fill(); }
      if (pleats.length < NPL) { const a = Math.max(0.03, a0 - (pleats.length + 1) * step), q = px(R, a), q1 = px(R * 0.84, a + 0.2); mark(q, 0.034); ctx.strokeStyle = rgba('#8ef0a8', 0.7 * A); ctx.lineWidth = 0.006; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke(); ctx.fillStyle = rgba('#8ef0a8', 0.8 * A); ctx.beginPath(); ctx.arc(q1[0], q1[1], 0.008, 0, TAU); ctx.fill(); }
      else mark(sealHead(), 0.034);
    } else if (phase === 'seal') { mark(sealHead(), 0.034); }
    ctx.restore();
  };
  const draw = (g2, Rt, tt) => {
    const { ctx } = g2, W0 = Rt.work;
    ctx.save(); ctx.beginPath(); ctx.rect(W0.x, W0.y, W0.w, W0.h); ctx.clip();
    const V = stageGeom(W0, SC, SW, SH, 0.5); geo = { ox: V.ox, oy: V.oy, s: V.s, touch: (g2.px(0) * 44) / 12 };
    drawBoardAndProps(ctx, V, now);
    drawTray(ctx, V, now);
    ctx.save(); ctx.translate(V.ox, V.oy); ctx.scale(V.s, V.s);
    if (phase !== 'settle' && !done) drawJiaozi(ctx, { R, fill: amount, fold: foldP, fdx: foldDx, mid: midDone, pleats, seal: sealCov, t: now });
    ctx.restore();
    guideDraw(ctx, V, now);
    ctx.save(); ctx.translate(V.ox, V.oy); ctx.scale(V.s, V.s); drawPulses(ctx, pulses, now); ctx.restore();
    // the hand or the spoon
    if (handAt && (pleatDrag || foldDrag || sealDown || (phase === 'mid' && pleatDrag?.mid))) { const h = toScr(handAt.x, handAt.y), cs = toScr(WX, WY); hand(ctx, V.s, h.x, h.y, Math.atan2(h.y - cs.y, h.x - cs.x) + 0.5, phase === 'seal' ? 'drag' : 'pinch', 0); }
    else if (spoonAt) { const h = toScr(spoonAt.x, spoonAt.y); drawSpoon(ctx, h.x, h.y, V.s); }
    else if (ptr && pilot.busy() && phase !== 'settle') { const h = toScr(ptr.x, ptr.y), cs = toScr(WX, WY); if (phase === 'fill') drawSpoon(ctx, h.x, h.y, V.s); else hand(ctx, V.s, h.x, h.y, Math.atan2(h.y - cs.y, h.x - cs.x) + 0.5, phase === 'seal' ? 'drag' : 'pinch', ptr.down ? 0 : 0.9); }
    ctx.restore();
    dockGauge(g2, ctx, W0, { dot: '#f3e6c8', fill: (x, y, w, h) => { const k = (round + (phase === 'settle' ? 1 : 0)) / ROUNDS; ctx.fillStyle = '#f3e6c8'; rrect(ctx, x, y, w * clamp(k + (phase === 'settle' ? 0 : 0), 0, 1), h, 5); ctx.fill(); }, warn: `${Math.min(ROUNDS, round + 1)} of ${ROUNDS}` });
    hintPill(g2, ctx, W0, hintText());
    drawReference(g2, Rt.thumb, now);
  };
  const drawSpoon = (ctx, x, y, s) => { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.6); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 6; const L = s * 0.28; rrect(ctx, 0, -L * 0.04, L, L * 0.08, L * 0.04); ctx.fillStyle = lg(ctx, 0, -L * 0.04, 0, L * 0.04, [[0, '#f0e2c0'], [1, '#a88a58']]); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, 0, L * 0.17, L * 0.12, 0, 0, TAU); ctx.fillStyle = lg(ctx, -L * 0.15, -L * 0.1, L * 0.15, L * 0.1, [[0, '#f4f7f9'], [1, '#8c98a2']]); ctx.fill(); ctx.fillStyle = '#b9755f'; ctx.beginPath(); ctx.ellipse(0, -L * 0.01, L * 0.13, L * 0.085, 0, 0, TAU); ctx.fill(); ctx.restore(); };
  const drawReference = (g2, th, tt) => {
    const { ctx } = g2, S = Math.min(th.w, th.h * 1.05);
    ctx.save(); ctx.beginPath(); ctx.rect(th.x, th.y, th.w, th.h); ctx.clip();
    const cx = th.x + th.w / 2, cy = th.y + th.h * 0.58;
    ctx.fillStyle = rg(ctx, cx, cy + S * 0.14, 2, S * 0.5, [[0, '#f4f0e8'], [0.8, '#d4cab8'], [1, '#8a806c']]); ctx.beginPath(); ctx.ellipse(cx, cy + S * 0.15, S * 0.46, S * 0.17, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(cx, cy); ctx.scale(S * 1.25, S * 1.25); ctx.translate(-WX, -WY - 0.03);
    const pl = []; for (let k = 1; k <= NPL; k++) pl.push({ a: a0 - k * step });
    drawJiaozi(ctx, { R: 0.27, fill: 0.9, fold: 1, fdx: 0, mid: true, pleats: pl, seal: 1, t: tt });
    ctx.restore(); steam(ctx, cx, cy - S * 0.1, S * 0.28, S * 0.36, tt, 0.35, 5); ctx.restore();
  };
  const titleArt = (g2, S, tt) => {
    const { ctx } = g2, s = Math.min(S.w / SW, S.h / SH) * 0.98, V = { ox: S.x + (S.w - s * SW) / 2, oy: S.y + (S.h - s * SH) / 2, s };
    drawBoardAndProps(ctx, V, tt ?? 0);
    const pl = []; for (let k = 1; k <= NPL; k++) pl.push({ a: a0 - k * step });
    ctx.save(); ctx.translate(V.ox, V.oy); ctx.scale(s, s); drawJiaozi(ctx, { R: 0.3, fill: 0.9, fold: 1, fdx: 0, mid: true, pleats: pl, seal: 1, t: tt ?? 0, centre: [0.7, 0.6], scale: 1.1 }); ctx.restore();
  };
  const state = () => ({ technique: 'dough', mode: 'pleat-crescent', round, phase, amount: r3(amount), fold: r3(foldP), foldDx: r3(foldDx), mid: midDone, pleats: pleats.map((p) => r3(p.a)), npl: NPL, seal: r3(sealCov), rounds: rounds.map((r) => r3(r.score)), guide, parts: Object.fromEntries(Object.entries(roundParts()).map(([k, v]) => [k, r3(v)])) });
  init();
  return {
    init, items, control, work, tick, draw, attract, titleArt, result: () => done, score, hint: hintText,
    info: () => [`Dumpling ${Math.min(ROUNDS, round + 1)}/${ROUNDS}`, phase === 'pleat' ? `Pleats ${pleats.length}/${NPL}` : `Step: ${{ fill: 'filling', fold: 'fold', mid: 'pinch the middle', pleat: 'pleats', seal: 'seal', settle: 'to the tray' }[phase]}`],
    get caption() { return SC.words?.caption ?? 'Pleat these jiaozi'; },
    rules: () => [
      'Make three dumplings. Hold on the wrapper to spoon on the filling: the ring fills as you hold, and the green band is the right amount. Too little is flat; too much will not seal.',
      'Press the glowing mark at the bottom edge and drag it up over the top edge so the two edges meet; the closer they line up, the better the fold.',
      'Pinch the middle of the edge and hold a moment. Then flick a pleat toward the middle at each lit mark, working toward one end, at even spacing.',
      'Seal: press at the left end and run along the whole edge in one smooth stroke, staying on the edge.',
      'Score per dumpling: filling 16, fold 16, middle pinch 6, pleats 42 (spacing, depth, reach), seal 20; the three are averaged.',
    ],
    point(id) {
      if (!geo) return null;
      const S = (q) => toScr(q[0], q[1]);
      if (id === 'fill') return toScr(WX, WY);
      if (id === 'fold0') return S(foldStart());
      if (id === 'fold1') return toScr(WX, WY - R * RY * 0.98);
      if (id === 'mid') return S(topEnd());
      if (id === 'pleat') { const a = Math.max(0.03, a0 - (pleats.length + 1) * step); return S(px(R, a)); }
      if (id === 'pleatTo') { const a = Math.max(0.03, a0 - (pleats.length + 1) * step); return S(flickEnd(a)); }
      if (id === 'sealHead') return S(sealHead());
      if (id.startsWith('seal:')) { const k = Number(id.slice(5)), a = Math.PI * (1 - k); return S(px(R * SEALR, a)); }
      return null;
    },
    state,
  };
}

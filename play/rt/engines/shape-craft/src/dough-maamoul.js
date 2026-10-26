// dough technique, mode "mould": maamoul (Lebanon, Syria, Jordan, Palestine, Egypt). A filled ball of semolina dough is pressed into a carved wooden
// mould, the back is levelled flush, the mould is knocked on the table edge so the cookie drops out, and the cookies are set out on a tray.
// Three cookies, three moulds (round with a domed rosette, oval with a lattice, walnut-shaped). Per cookie: fill the dough (hold; the ring shows the right
// amount), close it (drag the seam shut), place it in the mould, press it in evenly with the thumb until the pattern is sharp everywhere, level the back
// with the scraper in one straight stroke, knock the mould (hold = strength, let go; a steady light knock or two) and set the cookie on the tray.
import { starsFor, hash } from './geom.js';
import { shadowed, rrect, rgba, tint } from './fx.js';
import { lg, rg, TAU, flour, flourCloud, drawHand, drawPulses } from './dough-art.js';
import { clamp, sm, r3, mean, sd, makeSound, stageGeom, createPilot } from './dough-core.js';
import { hintPill, dockGauge } from './paint-ui.js';

const SW = 1.4, SH = 0.84;
const DOUGH = '#e6c78c', DATE = '#5a3220';
const BALL = [0.2, 0.52], MC = [0.6, 0.4], KN = [0.6, 0.55];
const TRAYR = { x: 1.03, y: 0.1, w: 0.34, h: 0.68 }, SLOTX = 1.2, SLOTY = [0.24, 0.44, 0.64];
const KINDS = ['round', 'oval', 'walnut'];
const DIM = { round: [0.1, 0.1], oval: [0.125, 0.082], walnut: [0.108, 0.09] };     // cavity half-sizes
const KINDNAME = { round: 'round rosette', oval: 'oval lattice', walnut: 'walnut' };
const CELL = 0.036, BAND = [0.4, 0.75];

// the outline of each shape: round, oval (an ellipse) and walnut (an ellipse with a notch at both ends of the seam)
function outline(ctx, kind, rx, ry) {
  ctx.beginPath();
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * TAU; let k = 1;
    if (kind === 'walnut') k -= 0.09 * Math.exp(-Math.pow((((a + TAU) % TAU) - Math.PI / 2) / 0.22, 2)) + 0.09 * Math.exp(-Math.pow((((a + TAU) % TAU) - Math.PI * 1.5) / 0.22, 2));
    const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.closePath();
}
// the carved pattern, as strokes in the unit of the shape (-1..1)
function pattern(ctx, kind, rx, ry) {
  ctx.beginPath();
  if (kind === 'round') {
    ctx.ellipse(0, 0, rx * 0.88, ry * 0.88, 0, 0, TAU); ctx.moveTo(rx * 0.52, 0); ctx.ellipse(0, 0, rx * 0.52, ry * 0.52, 0, 0, TAU); ctx.moveTo(rx * 0.14, 0); ctx.ellipse(0, 0, rx * 0.14, ry * 0.14, 0, 0, TAU);
    for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU; ctx.moveTo(Math.cos(a) * rx * 0.2, Math.sin(a) * ry * 0.2); ctx.lineTo(Math.cos(a) * rx * 0.52, Math.sin(a) * ry * 0.52); ctx.moveTo(Math.cos(a + 0.31) * rx * 0.52, Math.sin(a + 0.31) * ry * 0.52); ctx.lineTo(Math.cos(a + 0.31) * rx * 0.88, Math.sin(a + 0.31) * ry * 0.88); }
  } else if (kind === 'oval') {
    ctx.ellipse(0, 0, rx * 0.9, ry * 0.86, 0, 0, TAU);
    for (let k = -4; k <= 4; k++) { ctx.moveTo(k * rx * 0.2 - ry * 0.75, ry * 0.8); ctx.lineTo(k * rx * 0.2 + ry * 0.75, -ry * 0.8); ctx.moveTo(k * rx * 0.2 + ry * 0.75, ry * 0.8); ctx.lineTo(k * rx * 0.2 - ry * 0.75, -ry * 0.8); }
  } else {
    ctx.moveTo(0, -ry * 0.82); ctx.lineTo(0, ry * 0.86);
    for (let k = 0; k < 4; k++) { const y = -ry * 0.55 + k * ry * 0.36; ctx.moveTo(-rx * 0.82, y * 0.9); ctx.quadraticCurveTo(-rx * 0.45, y - ry * 0.28, -rx * 0.04, y + ry * 0.04); ctx.moveTo(rx * 0.82, y * 0.9); ctx.quadraticCurveTo(rx * 0.45, y - ry * 0.28, rx * 0.04, y + ry * 0.04); }
    ctx.moveTo(rx * 0.6, 0); ctx.ellipse(0, 0, rx * 0.6, ry * 0.62, 0, 0, TAU);
  }
}
// the finished cookie: a golden dome dusted with sugar, the pattern pressed in with a lit edge
export function drawCookie(ctx, kind, x, y, rx, ry, o = {}) {
  const { rot = 0, a = 1, seed = 1, sugar = 1 } = o;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(rot);
  ctx.save(); ctx.shadowColor = 'rgba(40,22,6,0.55)'; ctx.shadowBlur = rx * 0.35; ctx.shadowOffsetX = rx * 0.08; ctx.shadowOffsetY = rx * 0.22; outline(ctx, kind, rx, ry);
  ctx.fillStyle = rg(ctx, 0, 0, rx * 0.1, rx * 1.1, [[0, tint(DOUGH, 0.2)], [0.55, DOUGH], [0.9, tint(DOUGH, -0.16)], [1, tint(DOUGH, -0.34)]], -rx * 0.3, -ry * 0.35); ctx.fill(); ctx.restore();
  ctx.save(); outline(ctx, kind, rx, ry); ctx.clip();
  // golden bake colour toward the rim, sugar on the dome
  ctx.fillStyle = rg(ctx, 0, 0, rx * 0.5, rx * 1.05, [[0, 'rgba(255,240,200,0)'], [1, 'rgba(190,120,40,0.35)']]); ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
  pattern(ctx, kind, rx, ry); ctx.strokeStyle = 'rgba(120,76,24,0.55)'; ctx.lineWidth = rx * 0.045; ctx.lineCap = 'round'; ctx.stroke();
  ctx.save(); ctx.translate(-rx * 0.03, -rx * 0.03); pattern(ctx, kind, rx, ry); ctx.strokeStyle = 'rgba(255,248,225,0.7)'; ctx.lineWidth = rx * 0.02; ctx.stroke(); ctx.restore();
  flour(ctx, 0, 0, rx * 0.95, ry * 0.95, Math.round(40 * sugar), seed, 0.7 * sugar, rx * 0.03, '#fffaf0');
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.ellipse(-rx * 0.3, -ry * 0.4, rx * 0.4, ry * 0.15, -0.4, 0, TAU); ctx.fill();
  ctx.restore();
  outline(ctx, kind, rx, ry); ctx.strokeStyle = 'rgba(255,240,200,0.5)'; ctx.lineWidth = rx * 0.025; ctx.stroke();
  ctx.restore();
}
// the carved wooden mould seen from above: a block with a handle, the cavity with the pattern cut into it
function drawMould(ctx, kind, x, y, s, o = {}) {
  const [rx, ry] = DIM[kind], bw = 0.22, bh = Math.max(0.2, ry * 2 + 0.1), shake = o.shake ?? 0;
  ctx.save(); ctx.translate(x + shake, y);
  ctx.save(); ctx.shadowColor = 'rgba(30,16,4,0.55)'; ctx.shadowBlur = 14; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 9;
  rrect(ctx, -bw, -bh / 2, bw * 2, bh, 0.045); ctx.fillStyle = '#5a3418'; ctx.fill(); ctx.restore();
  // handle
  rrect(ctx, bw * 0.8, -0.034, 0.17, 0.068, 0.032); ctx.fillStyle = lg(ctx, 0, -0.034, 0, 0.034, [[0, '#a8743c'], [0.5, '#7a4a22'], [1, '#442a10']]); ctx.fill();
  rrect(ctx, -bw, -bh / 2, bw * 2, bh, 0.045); ctx.fillStyle = lg(ctx, -bw, -bh / 2, bw, bh / 2, [[0, '#b07c46'], [0.5, '#82522a'], [1, '#4e2e14']]); ctx.fill();
  ctx.strokeStyle = 'rgba(255,230,180,0.3)'; ctx.lineWidth = 0.003; ctx.stroke();
  ctx.save(); rrect(ctx, -bw, -bh / 2, bw * 2, bh, 0.045); ctx.clip(); ctx.strokeStyle = 'rgba(40,20,6,0.22)'; ctx.lineWidth = 0.002; for (let k = 0; k < 14; k++) { const gy = -bh / 2 + (bh * k) / 14 + hash(k, 3) * 0.01; ctx.beginPath(); ctx.moveTo(-bw, gy); ctx.bezierCurveTo(-bw * 0.4, gy + 0.004, bw * 0.3, gy - 0.004, bw, gy + 0.002); ctx.stroke(); } ctx.restore();
  // the cavity: a carved well, dark at the edge, pattern lit on its far wall
  ctx.save(); ctx.translate(0, 0); outline(ctx, kind, rx * 1.06, ry * 1.06); ctx.fillStyle = '#2a1608'; ctx.fill();
  outline(ctx, kind, rx, ry); ctx.fillStyle = rg(ctx, 0, 0, rx * 0.1, rx * 1.1, [[0, '#6e4422'], [0.6, '#4c2e14'], [1, '#2a1608']], -rx * 0.2, -ry * 0.3); ctx.fill();
  ctx.save(); outline(ctx, kind, rx, ry); ctx.clip(); pattern(ctx, kind, rx, ry); ctx.strokeStyle = 'rgba(20,10,2,0.7)'; ctx.lineWidth = 0.0045; ctx.stroke(); ctx.translate(0.0016, 0.0016); pattern(ctx, kind, rx, ry); ctx.strokeStyle = 'rgba(210,160,100,0.4)'; ctx.lineWidth = 0.0022; ctx.stroke(); ctx.restore();
  ctx.restore();
  ctx.restore(); void s;
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
export function createMaamoul(P, env) {
  const { rng, fx } = env, SC = P.scene ?? {};
  const COUNT = Math.max(1, Math.min(3, Math.round(P.count ?? 3)));
  const snd = makeSound(env, (F) => ({
    dose(q) { F('impact', { mat: 'clay', hz: 130 + q * 50, vel: 0.22 }); },
    close() { F('scrape', { hz: 700, dur: 0.1, vel: 0.2 }); F('thud', { hz: 120, vel: 0.2 }); },
    place() { F('thud', { hz: 95, vel: 0.3 }); F('tick', { hz: 1300, vel: 0.14, delay: 0.02 }); },
    press(q) { F('thud', { hz: 85 + q * 40, vel: 0.2 + q * 0.12 }); },
    level() { F('scrape', { hz: 1500, dur: 0.1, vel: 0.2 }); },
    knock(s) { F('impact', { mat: 'wood', hz: 180 + s * 160, vel: 0.35 + s * 0.4 }); F('thud', { hz: 90, vel: 0.2, delay: 0.01 }); },
    release() { F('pop', { hz: 420, vel: 0.4 }); F('thud', { hz: 110, vel: 0.24, delay: 0.04 }); },
    crack() { F('bad', { hz: 230, vel: 0.35 }); F('scrape', { hz: 2600, dur: 0.12, vel: 0.35 }); },
    set() { F('tick', { hz: 1800, vel: 0.22 }); F('thud', { hz: 120, vel: 0.14, delay: 0.02 }); },
    bad() { F('bad', { hz: 210, vel: 0.26 }); },
    win(stars) { F('good', { hz: 600 + stars * 70, vel: 0.5 }); F('chime', { hz: 1180, vel: 0.28, delay: 0.1 }); },
    mode() { F('tick', { hz: 1500, vel: 0.3 }); },
  }), 'maamoul');
  const pilot = createPilot();
  let pulses, cookie, phase, amount, fillDown, closeP, closeDrag, ballAt, ballDrag, placeOff, cells, cellsP, pressDown, pressN, levelDrag, levelCov, levelDev, levelDone, charge, chargeDown, knocks, knockT, relP, cracked, shake, shakeT, cookies, arrPos, dragCookie, done, guide, now, geo, lastP, ptr, handAt, flash, settleT, kind, finals;

  const init = () => { pulses = []; cookie = 0; cookies = []; arrPos = []; done = null; guide = 1; now = 0; lastP = null; ptr = null; handAt = null; flash = { t: -9, k: '' }; pilot.clear(); finals = null; startCookie(); };
  const startCookie = () => {
    kind = KINDS[cookie % 3]; phase = 'fill'; amount = 0; fillDown = false; closeP = 0; closeDrag = null; ballAt = { x: BALL[0], y: BALL[1] }; ballDrag = null; placeOff = null;
    const [rx, ry] = DIM[kind]; cells = []; for (let gy = -ry; gy <= ry + 1e-6; gy += CELL) for (let gx = -rx; gx <= rx + 1e-6; gx += CELL) if (Math.pow(gx / rx, 2) + Math.pow(gy / ry, 2) <= 1.02) cells.push([gx, gy]);
    cellsP = cells.map(() => 0); pressDown = false; pressN = 0; levelDrag = null; levelCov = 0; levelDev = []; levelDone = false; charge = 0; chargeDown = false; knocks = []; knockT = -9; relP = 0; cracked = false; shake = 0; shakeT = -9; dragCookie = null; settleT = 0;
  };
  // ---- scoring
  const fillS = () => clamp(1 - Math.abs(amount - 0.95) / 0.5, 0, 1);
  const pressS = () => { if (!cells.length) return 0; const cov = cellsP.filter((v) => v >= 0.9).length / cells.length, ev = 1 - clamp(mean(cellsP.map((v) => Math.abs(Math.min(v, 2.6) - 1.15))) / 0.7, 0, 1), over = cellsP.filter((v) => v > 2.0).length / cells.length; return clamp(0.55 * cov + 0.45 * ev * cov - over * 0.5, 0, 1) * (1 - 0.3 * (placeOff ? clamp(placeOff / 0.1, 0, 1) : 0)); };
  const levelS = () => (levelDone ? clamp(1 - mean(levelDev) / 0.03, 0, 1) * clamp(levelCov, 0, 1) : 0);
  const knockS = () => { if (!knocks.length) return 0; const st = mean(knocks.map((k) => 1 - clamp(Math.abs(k.s - 0.57) / 0.4, 0, 1))), iv = knocks.length > 1 ? knocks.slice(1).map((k, i) => k.t - knocks[i].t) : [], rh = iv.length ? 1 - clamp((sd(iv) / (mean(iv) || 1) - 0.1) / 0.4, 0, 1) : 1; return clamp((0.7 * st + 0.3 * rh) * (cracked ? 0.6 : 1) * (knocks.length > 3 ? 0.8 : 1), 0, 1); };
  const cookieScore = (c) => 100 * (0.2667 * c.fill + 0.2667 * c.press + 0.1333 * c.level + 0.3333 * c.knock);
  const arrS = () => {
    if (arrPos.length < COUNT) return 0;
    const ys = arrPos.map((p) => p.y), xs = arrPos.map((p) => p.x), sorted = ys.slice().sort((a, b) => a - b), gaps = sorted.slice(1).map((v, i) => v - sorted[i]);
    const sp = gaps.length ? 1 - clamp((sd(gaps) / (mean(gaps) || 1) - 0.05) / 0.4, 0, 1) : 1, al = 1 - clamp((sd(xs) - 0.01) / 0.07, 0, 1), minGap = Math.min(...gaps, 1), ov = minGap < 0.11 ? clamp(minGap / 0.11, 0, 1) : 1;
    return clamp((0.5 * sp + 0.5 * al) * ov, 0, 1);
  };
  const live = () => { const rows = cookies.map(cookieScore), cur = phase === 'settle' ? [] : [cookieScore({ fill: fillS(), press: phase === 'fill' || phase === 'close' || phase === 'place' ? 0 : pressS(), level: levelS(), knock: knockS() })]; const all = rows.concat(cur); return 0.75 * (all.reduce((s, v) => s + v, 0) / COUNT) + 25 * arrS(); };
  const score = () => (done ? done.score : Math.round(live()));
  const finish = () => {
    if (done) return;
    const sc = Math.round(0.75 * (cookies.reduce((s, c) => s + cookieScore(c), 0) / COUNT) + 25 * arrS()), stars = starsFor(sc), avg = (k) => Math.round(mean(cookies.map((c) => c[k])) * 100);
    done = { score: sc, max: 100, stars, headline: stars === 3 ? 'A tray of fine maamoul' : stars ? 'Good maamoul' : 'Back to the board', detail: `filling ${avg('fill')} percent, pressing ${avg('press')} percent, levelling ${avg('level')} percent, knock-out ${avg('knock')} percent, tray ${Math.round(arrS() * 100)} percent` };
    snd.win(stars);
  };

  // ---- geometry helpers
  const cavR = () => DIM[kind];
  const toScr = (u, v) => ({ x: geo.ox + u * geo.s, y: geo.oy + v * geo.s });
  const levelA = () => [MC[0] - cavR()[0] - 0.12, MC[1] - cavR()[1] - 0.075], levelB = () => [MC[0] + cavR()[0] + 0.12, MC[1] - cavR()[1] - 0.075];

  // ---- input in design units
  const workD = (p, dt) => {
    if (done || phase === 'settle') return;
    const prev = lastP; lastP = { x: p.x, y: p.y };
    const touchD = geo ? geo.touch / geo.s : 0.1, cap = Math.max(0.09, touchD * 0.85);
    if (phase === 'fill') {
      const m = [ballAt.x + 0.075, ballAt.y];
      if (p.pressed && amount > 0.05 && Math.hypot(p.x - m[0], p.y - m[1]) <= cap * 0.6) { phase = 'close'; closeDrag = true; closeP = 0; snd.close(); }
      else if (p.pressed && Math.hypot(p.x - ballAt.x, p.y - ballAt.y) <= 0.11) { fillDown = true; snd.dose(0); handAt = { x: p.x, y: p.y }; }
      if (fillDown && p.down) { const b = amount; amount = Math.min(1.4, amount + dt / 1.2); if (Math.floor(b * 6) !== Math.floor(amount * 6)) snd.dose(amount); }
      if (fillDown && (p.released || !p.down)) fillDown = false;
    }
    if (phase === 'close') {
      if (!closeDrag && p.pressed) { const m = [ballAt.x + 0.075, ballAt.y]; if (Math.hypot(p.x - m[0], p.y - m[1]) <= cap) { closeDrag = true; snd.close(); } }
      if (closeDrag && p.down) { closeP = clamp(1 - Math.hypot(p.x - ballAt.x, p.y - ballAt.y) / 0.075, 0, 1); handAt = { x: p.x, y: p.y }; }
      if (closeDrag && (p.released || !p.down)) { closeDrag = false; if (closeP >= 0.75) { closeP = 1; phase = 'place'; snd.close(); } else { closeP = 0; snd.bad(); flash = { t: now, k: 'close' }; } }
    } else if (phase === 'place') {
      if (p.pressed && !ballDrag && Math.hypot(p.x - ballAt.x, p.y - ballAt.y) <= 0.11) { ballDrag = { dx: ballAt.x - p.x, dy: ballAt.y - p.y }; snd.set(); }
      if (ballDrag && p.down) { ballAt = { x: p.x + ballDrag.dx, y: p.y + ballDrag.dy }; handAt = { x: p.x, y: p.y }; }
      if (ballDrag && (p.released || !p.down)) {
        ballDrag = null; const off = Math.hypot(ballAt.x - MC[0], ballAt.y - MC[1]);
        if (off <= 0.1) { placeOff = off; ballAt = { x: MC[0], y: MC[1] }; phase = 'press'; pulses.push({ x: MC[0], y: MC[1], t: now }); snd.place(); } else { snd.bad(); flash = { t: now, k: 'place' }; }
      }
    } else if (phase === 'press') {
      const rt = 0.062;
      if (p.pressed) { pressDown = true; handAt = { x: p.x, y: p.y }; }
      if (pressDown && p.down) {
        let hit = false; const lx = p.x - MC[0], ly = p.y - MC[1]; handAt = { x: p.x, y: p.y };
        for (let i = 0; i < cells.length; i++) { const d = Math.hypot(cells[i][0] - lx, cells[i][1] - ly); if (d < rt) { cellsP[i] = Math.min(3, cellsP[i] + dt * 2.2 * (1 - d / rt)); hit = true; } }
        if (hit) { const k = Math.floor(mean(cellsP) * 5); if (k !== pressN) { pressN = k; snd.press(clamp(mean(cellsP), 0, 1.5) / 1.5); } }
      }
      if (pressDown && (p.released || !p.down)) { pressDown = false; if (cellsP.every((v) => v >= 0.9)) { phase = 'level'; snd.mode(); } }
    } else if (phase === 'level') {
      const A = levelA(), B = levelB();
      if (p.pressed && !levelDrag && Math.hypot(p.x - A[0], p.y - A[1]) <= cap) { levelDrag = { dev: [] }; levelCov = 0; levelDev = []; snd.level(); handAt = { x: p.x, y: p.y }; }
      if (levelDrag && p.down) { levelCov = clamp((p.x - A[0]) / (B[0] - A[0]), 0, 1); levelDev.push(Math.abs(p.y - A[1])); handAt = { x: p.x, y: p.y }; if (Math.floor(levelCov * 8) !== Math.floor((levelCov - 0.04) * 8)) snd.level(); }
      if (levelDrag && (p.released || !p.down)) { levelDrag = null; if (levelCov >= 0.9) { levelDone = true; levelCov = 1; phase = 'knock'; snd.mode(); } else { levelDev = []; levelCov = 0; snd.bad(); flash = { t: now, k: 'level' }; } }
    } else if (phase === 'knock') {
      if (p.pressed && Math.hypot(p.x - KN[0], p.y - KN[1]) <= 0.2) { chargeDown = true; charge = 0; handAt = { x: p.x, y: p.y }; }
      if (chargeDown && p.down) { charge = Math.min(1.5, charge + dt / 0.9); handAt = { x: p.x, y: p.y }; }
      if (chargeDown && (p.released || !p.down)) {
        chargeDown = false; const s = charge; charge = 0; if (s < 0.08) return;
        knocks.push({ s: r3(s), t: now }); shake = 1; shakeT = now; pulses.push({ x: KN[0], y: KN[1] + 0.1, t: now, col: s >= BAND[0] && s <= BAND[1] ? '#d8ffe4' : s > 1 ? '#ff9a80' : '#ffe8a0' }); snd.knock(clamp(s, 0, 1));
        if (s > 1.0) { cracked = true; snd.crack(); flash = { t: now, k: 'hard' }; relP += 1.1; }
        else if (s >= BAND[0]) relP += s; else { flash = { t: now, k: 'soft' }; relP += s * 0.4; }
        if (relP >= 1) { phase = 'arrange'; snd.release(); dragCookie = { x: KN[0], y: KN[1] + 0.13, held: false, placed: false, born: now }; if (geo) { const q = toScr(KN[0], KN[1] + 0.13); fx.emit('dust', q.x, q.y, { count: 8, color: '#fffaf0', size: 4, speed: 50, life: 0.7, gravity: 20 }); } }
      }
    } else if (phase === 'arrange') {
      const c = dragCookie;
      if (c && p.pressed && Math.hypot(p.x - c.x, p.y - c.y) <= 0.12) { c.held = true; c.dx = c.x - p.x; c.dy = c.y - p.y; snd.set(); }
      if (c && c.held && p.down) { c.x = p.x + c.dx; c.y = p.y + c.dy; handAt = { x: p.x, y: p.y }; }
      if (c && c.held && (p.released || !p.down)) {
        c.held = false;
        if (c.x >= TRAYR.x + 0.04 && c.x <= TRAYR.x + TRAYR.w - 0.04 && c.y >= TRAYR.y + 0.04 && c.y <= TRAYR.y + TRAYR.h - 0.04) { arrPos.push({ x: c.x, y: c.y, kind }); finishCookie(); snd.set(); } else { snd.bad(); flash = { t: now, k: 'tray' }; }
      }
    }
    void prev;
  };
  const finishCookie = () => {
    cookies.push({ fill: fillS(), press: pressS(), level: levelS(), knock: knockS(), kind, knocks: knocks.length });
    phase = 'settle'; settleT = 0;
  };
  const work = (p) => { if (!geo) return; workD({ x: (p.x - geo.ox) / geo.s, y: (p.y - geo.oy) / geo.s, down: p.down, pressed: p.pressed, released: p.released }, 1 / 60); };
  const control = (id) => { if (done) return; if (id === 'guide') { guide = (guide + 1) % 3; snd.mode(); } else if (id === 'undo' && phase === 'press' && !pressDown) { cellsP = cellsP.map((v) => v * 0.6); snd.mode(); } };
  const items = () => [{ id: 'undo', kind: 'btn', label: 'Ease off', off: phase !== 'press' }, { id: 'guide', kind: 'btn', label: ['Guide on', 'Faint', 'No guide'][guide] }];
  const tick = (dt) => {
    now += dt;
    if (shake > 0) shake = Math.max(0, shake - dt * 4);
    if (phase === 'settle') { settleT += dt; if (settleT > 0.8) { if (cookie + 1 >= COUNT) finish(); else { cookie++; startCookie(); } } }
  };

  // ---- Watch and learn
  const attract = (dt) => {
    if (done) return;
    if (!pilot.busy() && phase !== 'settle') {
      if (phase === 'fill' && amount < 0.93) pilot.push({ pts: [[ballAt.x, ballAt.y]], hold: 1.15, lead: cookie ? 0.4 : 0.7 });
      else if (phase === 'fill' || phase === 'close') pilot.push({ pts: () => [[ballAt.x + 0.075, ballAt.y], [ballAt.x + 0.004, ballAt.y]], dur: [0.35], hold: 0.1, lead: 0.25 });
      else if (phase === 'place') pilot.push({ pts: () => [[ballAt.x, ballAt.y], [MC[0], MC[1]]], dur: [0.6], hold: 0.1, lead: 0.3 });
      else if (phase === 'press') {
        let bi = -1, bv = 0.9; for (let i = 0; i < cells.length; i++) if (cellsP[i] < bv) { bv = cellsP[i]; bi = i; }
        if (bi >= 0) { const c = cells[bi], need = Math.max(0.25, (1.08 - cellsP[bi]) / (2.2 * 0.8)); pilot.push({ pts: [[MC[0] + c[0], MC[1] + c[1]]], hold: need, lead: 0.2 }); }
        else pilot.push({ pts: [[MC[0], MC[1]]], hold: 0.02, lead: 0.15 });
      } else if (phase === 'level') { const A = levelA(), B = levelB(); pilot.push({ pts: [A, B], dur: [0.7], linear: true, hold: 0.05, lead: 0.3 }); }
      else if (phase === 'knock') pilot.push({ pts: [[KN[0], KN[1]]], hold: 0.52, lead: knocks.length ? 0.25 : 0.4 });
      else if (phase === 'arrange' && dragCookie) { const k = arrPos.length, ty = SLOTY[k] ?? SLOTY[SLOTY.length - 1]; pilot.push({ pts: () => [[dragCookie.x, dragCookie.y], [SLOTX, ty]], dur: [0.6], hold: 0.1, lead: 0.3 }); }
    }
    const p = pilot.step(dt); ptr = { x: p.x, y: p.y, down: p.down }; workD({ x: p.x, y: p.y, down: p.down, pressed: p.pressed, released: p.released }, dt);
  };

  // ---- drawing
  const hintText = () => {
    if (done) return '';
    if (now - flash.t < 2) return { close: 'Drag the seam all the way to the middle to close the dough.', place: 'Set the ball down in the mould.', level: 'One straight stroke across the whole top, left to right.', soft: 'A little harder: that knock was too light.', hard: 'Too hard: the cookie cracked.', tray: 'Set the cookie on the tray.' }[flash.k] ?? '';
    return { fill: amount < 0.05 ? 'Hold on the dough to add the filling; stop when the ring is in the green band.' : 'Now drag the seam closed: press the glowing mark and pull it to the middle.', close: 'Drag the seam to the middle to close the dough.', place: `Drag the ball into the ${KINDNAME[kind]} mould.`, press: 'Press the dough in with your thumb until the pattern is sharp everywhere. Pale places need more.', level: 'Level the back: one straight stroke of the scraper across the top.', knock: 'Knock the mould on the table: press and hold for the strength, let go to knock.', arrange: 'Set the cookie on the tray, in line and evenly spaced.', settle: '' }[phase] ?? '';
  };
  const hand = (ctx, s, x, y, ang, pose, open = 0) => drawHand(ctx, x, y, { rot: ang, k: s * 0.0021, pose, open, skin: SC.skin, sleeve: SC.sleeve });
  const scene = (ctx, V, tt) => {
    const { ox, oy, s } = V;
    // a marble slab with grey veining, the brass tray with a doily at the right
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = s * 0.04; ctx.shadowOffsetY = s * 0.02; rrect(ctx, ox + s * 0.02, oy + s * 0.04, s * 0.96, s * 0.76, s * 0.02); ctx.fillStyle = '#ece7de'; ctx.fill(); ctx.restore();
    ctx.save(); rrect(ctx, ox + s * 0.02, oy + s * 0.04, s * 0.96, s * 0.76, s * 0.02); ctx.clip(); ctx.fillStyle = lg(ctx, ox, oy, ox + s, oy + s, [[0, '#f6f2ea'], [0.6, '#e6dfd2'], [1, '#c9c1b0']]); ctx.fillRect(ox, oy, s, s);
    // soft grey veining: wide faint strokes, then narrower darker ones along the same wandering paths
    for (let k = 0; k < 6; k++) { const pts = []; let x = ox + (0.05 + hash(k, 3) * 0.9) * s, y = oy + s * 0.02; for (let j = 0; j <= 8; j++) { pts.push([x, y]); x += (hash(k, j, 5) - 0.42) * s * 0.2; y += s * 0.1; }
      for (const [w2, al] of [[22, 0.035], [10, 0.05], [3, 0.09], [1, 0.12]]) { ctx.strokeStyle = `rgba(110,114,124,${al})`; ctx.lineWidth = w2; ctx.lineJoin = 'round'; ctx.beginPath(); pts.forEach(([px2, py2], j) => (j ? ctx.lineTo(px2, py2) : ctx.moveTo(px2, py2))); ctx.stroke(); } }
    ctx.fillStyle = 'rgba(140,130,110,0.1)'; for (let k = 0; k < 40; k++) { ctx.beginPath(); ctx.arc(ox + hash(k, 12) * s, oy + hash(k, 13) * s * 0.8, 0.8 + hash(k, 14) * 1.6, 0, TAU); ctx.fill(); }
    flourCloud(ctx, ox + s * 0.5, oy + s * 0.42, s * 0.4, s * 0.24, 7, 0.18);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; rrect(ctx, ox + s * 0.02, oy + s * 0.04, s * 0.96, s * 0.76, s * 0.02); ctx.stroke();
    // tray
    const tx = ox + s * TRAYR.x, ty = oy + s * TRAYR.y, tw = s * TRAYR.w, th = s * TRAYR.h;
    shadowed(ctx, () => { rrect(ctx, tx, ty, tw, th, s * 0.03); ctx.fillStyle = '#7a5418'; ctx.fill(); }, { blur: 14, dy: 7, a: 0.5 });
    rrect(ctx, tx, ty, tw, th, s * 0.03); ctx.fillStyle = lg(ctx, tx, ty, tx + tw, ty + th, [[0, '#f2d27a'], [0.35, '#c9983a'], [0.7, '#e6c466'], [1, '#8a6218']]); ctx.fill();
    rrect(ctx, tx + s * 0.014, ty + s * 0.014, tw - s * 0.028, th - s * 0.028, s * 0.02); ctx.fillStyle = lg(ctx, tx, ty, tx + tw, ty + th, [[0, '#d8ae52'], [1, '#a47a24']]); ctx.fill();
    ctx.save(); rrect(ctx, tx + s * 0.02, ty + s * 0.02, tw - s * 0.04, th - s * 0.04, s * 0.016); ctx.clip(); ctx.fillStyle = '#f6f0e4'; ctx.fillRect(tx, ty, tw, th);
    ctx.strokeStyle = 'rgba(160,140,110,0.15)'; ctx.lineWidth = 1; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.arc(tx + tw / 2, ty + th / 2, tw * (0.08 + k * 0.06), 0, TAU); ctx.stroke(); } for (let k = 0; k < 18; k++) { const a = (k / 18) * TAU; ctx.beginPath(); ctx.moveTo(tx + tw / 2 + Math.cos(a) * tw * 0.1, ty + th / 2 + Math.sin(a) * tw * 0.1); ctx.lineTo(tx + tw / 2 + Math.cos(a) * th * 0.7, ty + th / 2 + Math.sin(a) * th * 0.7); ctx.stroke(); } ctx.restore();
    ctx.save(); ctx.translate(ox, oy); ctx.scale(s, s);
    // the guide slots on the tray
    if (guide < 2 && phase === 'arrange') for (let k = arrPos.length; k < COUNT; k++) { ctx.strokeStyle = rgba('#8ef0a8', k === arrPos.length ? 0.9 : guide === 1 ? 0.5 : 0.25); ctx.lineWidth = 0.004; ctx.setLineDash([0.012, 0.01]); ctx.beginPath(); ctx.ellipse(SLOTX, SLOTY[k], 0.075, 0.062, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
    // cookies already on the tray
    arrPos.forEach((a, i) => { const [rx, ry] = DIM[a.kind]; drawCookie(ctx, a.kind, a.x, a.y, rx * 0.82, ry * 0.82, { seed: i + 3, rot: i === 1 ? 0 : 0 }); });
    // the filling bowl, a small dish of sugar
    const bowl = (x, y, r, c, c2) => { ctx.save(); ctx.fillStyle = 'rgba(40,22,6,0.3)'; ctx.beginPath(); ctx.ellipse(x + 0.006, y + 0.018, r, r * 0.74, 0, 0, TAU); ctx.fill(); ctx.fillStyle = lg(ctx, x - r, y, x + r, y, [[0, '#7a9ab0'], [0.3, '#e8f0f4'], [0.7, '#b0c4d0'], [1, '#5a7a90']]); ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.72, 0, 0, TAU); ctx.fill(); ctx.fillStyle = rg(ctx, x, y, 0.004, r, [[0, c2], [0.6, c], [1, tint(c, -0.3)]], x - r * 0.2, y - r * 0.2); ctx.beginPath(); ctx.ellipse(x, y - 0.003, r * 0.82, r * 0.56, 0, 0, TAU); ctx.fill(); ctx.restore(); };
    bowl(0.14, 0.2, 0.075, '#5a3220', '#8a5436'); bowl(0.3, 0.14, 0.05, '#d8b078', '#f0d8a8');
    // mould, dough ball, cookie
    const mk = phase === 'knock' || phase === 'arrange' || phase === 'settle' ? KN : MC;
    const shk = 0, bounce = shake > 0 ? -Math.abs(Math.sin((now - shakeT) * 40)) * 0.022 * shake : 0;
    drawMould(ctx, kind, mk[0], mk[1] + bounce, s, { shake: shk });
    if (phase === 'fill' || phase === 'close' || phase === 'place') drawBall(ctx, ballAt.x, ballAt.y, amount, closeP, tt, phase);
    if (phase === 'press' || phase === 'level') drawPressed(ctx, tt);
    if (phase === 'knock' || phase === 'arrange') {
      // the pressed dough shows leaving the mould as the knocks add up
      const [rx, ry] = DIM[kind];
      if (relP < 1) { outline(ctx, kind, rx, ry); ctx.save(); ctx.translate(mk[0] + shk, mk[1] + bounce); outline(ctx, kind, rx * 0.98, ry * 0.98); ctx.fillStyle = tint(DOUGH, -0.05); ctx.fill(); pattern(ctx, kind, rx, ry); ctx.strokeStyle = 'rgba(120,76,24,0.5)'; ctx.lineWidth = 0.004; ctx.stroke(); ctx.restore(); ctx.beginPath(); }
    }
    if (phase === 'arrange' && dragCookie) { const [rx, ry] = DIM[kind], age = clamp((now - dragCookie.born) / 0.4, 0, 1), pop = 1 + 0.25 * Math.sin(age * Math.PI) * (1 - age), dropY = dragCookie.held ? 0 : (1 - sm(age)) * -0.05; drawCookie(ctx, kind, dragCookie.x, dragCookie.y + dropY, rx * 0.82 * pop, ry * 0.82 * pop, { seed: 9 }); }
    if (phase === 'settle') { const a = arrPos[arrPos.length - 1]; void a; }
    // knock gauge
    if (phase === 'knock') {
      const gx = KN[0], gy = KN[1] + 0.2, gw = 0.3, gh = 0.022; ctx.fillStyle = 'rgba(20,12,4,0.6)'; rrect(ctx, gx - gw / 2 - 0.01, gy - 0.012, gw + 0.02, gh + 0.024, 0.014); ctx.fill();
      ctx.fillStyle = 'rgba(142,240,168,0.55)'; ctx.fillRect(gx - gw / 2 + gw * (BAND[0] / 1.5), gy, gw * ((BAND[1] - BAND[0]) / 1.5), gh); ctx.fillStyle = 'rgba(255,120,100,0.4)'; ctx.fillRect(gx - gw / 2 + gw * (1.0 / 1.5), gy, gw * (0.5 / 1.5), gh);
      ctx.fillStyle = charge > 1 ? '#ff8a70' : '#ffd36a'; ctx.fillRect(gx - gw / 2, gy, gw * clamp(charge / 1.5, 0, 1), gh);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.003; ctx.strokeRect(gx - gw / 2, gy, gw, gh);
      // how far the dough has loosened
      ctx.fillStyle = 'rgba(20,12,4,0.55)'; rrect(ctx, gx - gw / 2 - 0.01, gy + 0.045, gw + 0.02, 0.02, 0.01); ctx.fill(); ctx.fillStyle = '#e8c070'; ctx.fillRect(gx - gw / 2, gy + 0.049, gw * clamp(relP, 0, 1), 0.012);
    }
    // guides: marks for the next action
    if (guide < 2 && !done) {
      const A = guide === 1 ? 1 : 0.55, pu = 0.6 + 0.4 * Math.sin(tt * 5);
      const mark = (x, y, r, col = '#ffd36a') => { ctx.fillStyle = rgba(col, (0.28 + 0.22 * pu) * A); ctx.beginPath(); ctx.arc(x, y, r * (1 + 0.1 * pu), 0, TAU); ctx.fill(); ctx.strokeStyle = rgba('#fff2c0', 0.9 * A); ctx.lineWidth = 0.004; ctx.beginPath(); ctx.arc(x, y, r * 0.78, 0, TAU); ctx.stroke(); };
      if (phase === 'fill') { if (amount < 0.05) mark(ballAt.x, ballAt.y, 0.05); else mark(ballAt.x + 0.075, ballAt.y, 0.035); const r = 0.115; ctx.lineWidth = 0.008; ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.arc(ballAt.x, ballAt.y, r, 0, TAU); ctx.stroke(); ctx.strokeStyle = 'rgba(142,240,168,0.85)'; ctx.beginPath(); ctx.arc(ballAt.x, ballAt.y, r, -Math.PI / 2 + TAU * 0.8 / 1.4, -Math.PI / 2 + TAU * 1.05 / 1.4); ctx.stroke(); ctx.strokeStyle = amount > 1.08 ? '#ff8a70' : '#ffd36a'; ctx.beginPath(); ctx.arc(ballAt.x, ballAt.y, r, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(amount / 1.4, 0, 1)); ctx.stroke(); }
      else if (phase === 'close') mark(ballAt.x + 0.075, ballAt.y, 0.035);
      else if (phase === 'place') { mark(ballAt.x, ballAt.y, 0.05); ctx.strokeStyle = rgba('#8ef0a8', 0.7 * A); ctx.lineWidth = 0.005; ctx.setLineDash([0.012, 0.012]); ctx.beginPath(); ctx.moveTo(ballAt.x, ballAt.y); ctx.lineTo(MC[0], MC[1]); ctx.stroke(); ctx.setLineDash([]); }
      else if (phase === 'level') { const a2 = levelA(), b2 = levelB(); mark(a2[0], a2[1], 0.035); ctx.strokeStyle = rgba('#8ef0a8', 0.7 * A); ctx.lineWidth = 0.005; ctx.setLineDash([0.012, 0.012]); ctx.beginPath(); ctx.moveTo(a2[0], a2[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke(); ctx.setLineDash([]); mark(b2[0], b2[1], 0.03, '#8ef0a8'); }
      else if (phase === 'knock') mark(KN[0], KN[1], 0.06);
    }
    drawPulses(ctx, pulses, now);
    ctx.restore();
  };
  const drawBall = (ctx, x, y, amt, close, tt, ph) => {
    const R = 0.07, ry = 0.062;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(40,22,6,0.35)'; ctx.beginPath(); ctx.ellipse(0.008, 0.02, R * 1.08, ry * 1.0, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, R, ry, 0, 0, TAU); ctx.fillStyle = rg(ctx, 0, 0, R * 0.1, R * 1.1, [[0, tint(DOUGH, 0.2)], [0.6, DOUGH], [1, tint(DOUGH, -0.32)]], -R * 0.3, -ry * 0.4); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, R, ry, 0, 0, TAU); ctx.clip(); flour(ctx, 0, 0, R * 0.9, ry * 0.9, 24, 4, 0.5, 0.004, '#fff0c0');
    if (ph === 'fill' && amt > 0.02) {
      // a well opened in the dough with the date paste rising in it
      const w = R * (0.4 + 0.32 * clamp(amt, 0, 1.3));
      ctx.fillStyle = 'rgba(90,60,20,0.35)'; ctx.beginPath(); ctx.ellipse(0, 0, w * 1.08, w * 0.96 * (ry / R), 0, 0, TAU); ctx.fill();
      ctx.fillStyle = rg(ctx, -w * 0.2, -w * 0.2, 0.004, w, [[0, '#8a5436'], [0.6, DATE], [1, '#33180a']]); ctx.beginPath(); ctx.ellipse(0, 0, w, w * 0.88 * (ry / R), 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,230,190,0.35)'; ctx.beginPath(); ctx.ellipse(-w * 0.3, -w * 0.3, w * 0.28, w * 0.1, -0.4, 0, TAU); ctx.fill();
    } else if (ph !== 'fill' || amt > 0.02) {
      // closed: a seam drawn shut, the filling gone inside
      ctx.strokeStyle = 'rgba(110,76,30,0.55)'; ctx.lineWidth = 0.004; ctx.beginPath(); const L = R * 0.5 * (1 - close * 0.8); ctx.moveTo(-L, 0); ctx.quadraticCurveTo(0, -0.01 * (1 - close), L, 0); ctx.stroke();
    }
    ctx.restore();
    if (ph === 'fill' && amt <= 0.02) { ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.ellipse(-R * 0.3, -ry * 0.4, R * 0.35, ry * 0.14, -0.4, 0, TAU); ctx.fill(); }
    ctx.restore(); void tt;
  };
  const drawPressed = (ctx, tt) => {
    const [rx, ry] = DIM[kind], cx = MC[0], cy = MC[1];
    ctx.save(); ctx.translate(cx, cy);
    // the raw dough domed in the cavity, then the pattern sharp where it has been pressed
    outline(ctx, kind, rx * 0.97, ry * 0.97); ctx.fillStyle = rg(ctx, 0, 0, 0.01, rx * 1.1, [[0, tint(DOUGH, 0.28)], [0.6, tint(DOUGH, 0.02)], [1, tint(DOUGH, -0.3)]], -rx * 0.25, -ry * 0.3); ctx.fill();
    ctx.save(); outline(ctx, kind, rx * 0.97, ry * 0.97); ctx.clip();
    flour(ctx, 0, 0, rx * 0.95, ry * 0.95, 50, 12, 0.5, 0.0035, '#fff0c0');
    // lumpy unpressed dough: soft bumps, fading as pressure builds
    for (let i = 0; i < cells.length; i++) { const v = clamp(cellsP[i] / 0.9, 0, 1); if (v < 1) { ctx.fillStyle = `rgba(255,248,225,${0.35 * (1 - v)})`; ctx.beginPath(); ctx.arc(cells[i][0], cells[i][1], CELL * 0.62, 0, TAU); ctx.fill(); ctx.fillStyle = `rgba(110,70,20,${0.18 * (1 - v)})`; ctx.beginPath(); ctx.arc(cells[i][0] + 0.004, cells[i][1] + 0.005, CELL * 0.5, 0, TAU); ctx.fill(); } }
    // the crisp pattern, revealed through the pressed cells
    ctx.save(); ctx.beginPath(); for (let i = 0; i < cells.length; i++) if (cellsP[i] >= 0.5) { ctx.moveTo(cells[i][0] + CELL * 0.8, cells[i][1]); ctx.arc(cells[i][0], cells[i][1], CELL * (0.55 + 0.35 * clamp(cellsP[i], 0.5, 1.2)), 0, TAU); } ctx.clip();
    pattern(ctx, kind, rx, ry); ctx.strokeStyle = 'rgba(120,76,24,0.6)'; ctx.lineWidth = 0.0045; ctx.lineCap = 'round'; ctx.stroke(); ctx.translate(-0.0018, -0.0018); pattern(ctx, kind, rx, ry); ctx.strokeStyle = 'rgba(255,248,225,0.75)'; ctx.lineWidth = 0.0022; ctx.stroke();
    ctx.restore();
    // over-pressed places show filling pushing out
    for (let i = 0; i < cells.length; i++) if (cellsP[i] > 2.0) { ctx.fillStyle = 'rgba(90,50,20,0.5)'; ctx.beginPath(); ctx.arc(cells[i][0], cells[i][1], CELL * 0.45, 0, TAU); ctx.fill(); }
    ctx.restore();
    outline(ctx, kind, rx * 0.97, ry * 0.97); ctx.strokeStyle = 'rgba(255,240,200,0.45)'; ctx.lineWidth = 0.003; ctx.stroke();
    // level: the scraper's finished path leaves a clean, flat top; a curl of dough shaves off
    if (phase === 'level' && levelCov > 0) { ctx.strokeStyle = 'rgba(255,248,225,0.7)'; ctx.lineWidth = 0.004; ctx.beginPath(); ctx.moveTo(levelA()[0] - cx, levelA()[1] - cy); ctx.lineTo(levelA()[0] + (levelB()[0] - levelA()[0]) * levelCov - cx, levelA()[1] - cy); ctx.stroke(); }
    ctx.restore(); void tt;
  };
  const drawScraper = (ctx, x, y, s) => { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.15); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 8; const L = s * 0.17, H = s * 0.07; ctx.fillStyle = lg(ctx, 0, 0, 0, H, [[0, '#f8fafb'], [0.5, '#b8c1ca'], [1, '#6c7680']]); ctx.fillRect(-L / 2, 0, L, H * 0.7); ctx.shadowColor = 'transparent'; rrect(ctx, -L * 0.5, H * 0.7, L, H * 0.45, H * 0.15); ctx.fillStyle = lg(ctx, 0, H * 0.7, 0, H * 1.15, [[0, '#a8794a'], [1, '#52341a']]); ctx.fill(); ctx.restore(); };
  const draw = (g2, Rt, tt) => {
    const { ctx } = g2, W0 = Rt.work;
    ctx.save(); ctx.beginPath(); ctx.rect(W0.x, W0.y, W0.w, W0.h); ctx.clip();
    const V = stageGeom(W0, SC, SW, SH, 0.45); geo = { ox: V.ox, oy: V.oy, s: V.s, touch: (g2.px(0) * 44) / 12 };
    scene(ctx, V, now);
    const q = ptr && pilot.busy() ? ptr : handAt && (fillDown || closeDrag || ballDrag || pressDown || levelDrag || chargeDown || (dragCookie && dragCookie.held)) ? handAt : null;
    if (q) {
      const h = toScr(q.x, q.y);
      if (phase === 'level') drawScraper(ctx, h.x, h.y, V.s); else hand(ctx, V.s, h.x, h.y, 0.9, phase === 'press' || phase === 'fill' || phase === 'knock' ? 'press' : 'pinch', phase === 'place' || phase === 'close' ? 0 : 0);
    }
    ctx.restore();
    dockGauge(g2, ctx, W0, { dot: '#e6c78c', fill: (x, y, w, h) => { ctx.fillStyle = '#e6c78c'; rrect(ctx, x, y, w * clamp((cookie + (phase === 'settle' ? 1 : 0)) / COUNT, 0, 1), h, 5); ctx.fill(); }, warn: `${Math.min(COUNT, cookie + 1)} of ${COUNT}` });
    hintPill(g2, ctx, W0, hintText());
    drawReference(g2, Rt.thumb, now);
  };
  const drawReference = (g2, th, tt) => {
    const { ctx } = g2, S = Math.min(th.w, th.h);
    ctx.save(); ctx.beginPath(); ctx.rect(th.x, th.y, th.w, th.h); ctx.clip();
    const cx = th.x + th.w / 2, cy = th.y + th.h * 0.55;
    ctx.fillStyle = lg(ctx, cx - S * 0.4, cy, cx + S * 0.4, cy + S * 0.2, [[0, '#f2d27a'], [0.5, '#c9983a'], [1, '#8a6218']]); ctx.beginPath(); ctx.ellipse(cx, cy + S * 0.1, S * 0.46, S * 0.3, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#f6f0e4'; ctx.beginPath(); ctx.ellipse(cx, cy + S * 0.1, S * 0.41, S * 0.26, 0, 0, TAU); ctx.fill();
    drawCookie(ctx, 'round', cx - S * 0.2, cy, S * 0.13, S * 0.13, { seed: 2 }); drawCookie(ctx, 'oval', cx + S * 0.18, cy - S * 0.06, S * 0.15, S * 0.1, { seed: 3, rot: -0.3 }); drawCookie(ctx, 'walnut', cx + S * 0.0, cy + S * 0.15, S * 0.13, S * 0.11, { seed: 4, rot: 0.2 });
    ctx.restore(); void tt;
  };
  const titleArt = (g2, S, tt) => {
    const { ctx } = g2, s = Math.min(S.w / SW, S.h / SH) * 0.98, V = { ox: S.x + (S.w - s * SW) / 2, oy: S.y + (S.h - s * SH) / 2, s };
    ctx.save(); rrect(ctx, V.ox + s * 0.02, V.oy + s * 0.04, s * 0.96, s * 0.76, s * 0.02); ctx.fillStyle = '#ece7de'; ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(V.ox, V.oy); ctx.scale(s, s); drawMould(ctx, 'round', 0.4, 0.4, 1); drawCookie(ctx, 'round', 0.9, 0.35, 0.1, 0.1, { seed: 2 }); drawCookie(ctx, 'oval', 0.9, 0.6, 0.12, 0.085, { seed: 3, rot: -0.2 }); drawCookie(ctx, 'walnut', 0.65, 0.65, 0.1, 0.09, { seed: 4, rot: 0.2 }); ctx.restore(); void tt;
  };
  const state = () => ({ technique: 'dough', mode: 'mould', cookie, kind, phase, amount: r3(amount), close: r3(closeP), cells: cellsP.map((v) => r3(v)), level: r3(levelCov), knocks: knocks.map((k) => k.s), relP: r3(relP), cracked, arr: arrPos.map((a) => [r3(a.x), r3(a.y)]), cookies: cookies.map((c) => [r3(c.fill), r3(c.press), r3(c.level), r3(c.knock)]), guide, parts: { fill: r3(fillS()), press: r3(pressS()), level: r3(levelS()), knock: r3(knockS()), tray: r3(arrS()) } });
  init();
  return {
    init, items, control, work, tick, draw, attract, titleArt, result: () => done, score, hint: hintText,
    info: () => [`Cookie ${Math.min(COUNT, cookie + 1)}/${COUNT}: ${KINDNAME[kind]}`, { fill: 'Step: fill the dough', close: 'Step: close the seam', place: 'Step: place in the mould', press: `Pressed ${Math.round((cellsP.filter((v) => v >= 0.9).length / Math.max(1, cells.length)) * 100)}%`, level: 'Step: level the back', knock: `Loosened ${Math.round(clamp(relP, 0, 1) * 100)}%`, arrange: 'Step: set it on the tray', settle: '' }[phase] ?? ''],
    get caption() { return SC.words?.caption ?? 'Mould these maamoul'; },
    rules: () => [
      'Make three cookies in three moulds. Hold on the dough to add the date or nut filling; the ring fills as you hold and the green band is the right amount. Then press the glowing seam mark and drag it to the middle to close the dough.',
      'Drag the closed ball into the mould. Press it in with your thumb, moving over the whole carving: the pattern turns sharp where the dough is pressed. Pale places need more; pressing one place far too hard squeezes the filling out.',
      'Level the back with the scraper in one straight stroke from side to side. Then knock the mould on the table: press and hold for the strength, let go to knock. A steady medium knock, once or twice, drops the cookie; a knock that is too hard cracks it.',
      'Set each cookie on the tray, in line and evenly spaced, without touching.',
      'Score: filling 20, pressing 20, levelling 10, knock-out 25 (strength and rhythm), the tray 25.',
    ],
    point(id) {
      if (!geo) return null;
      const S = (a, b) => toScr(a, b);
      if (id === 'ball') return S(ballAt.x, ballAt.y);
      if (id === 'seam') return S(ballAt.x + 0.075, ballAt.y);
      if (id === 'seamTo') return S(ballAt.x + 0.004, ballAt.y);
      if (id === 'mould') return S(MC[0], MC[1]);
      if (id === 'pressWeak') { let bi = -1, bv = 0.9; for (let i = 0; i < cells.length; i++) if (cellsP[i] < bv) { bv = cellsP[i]; bi = i; } return bi >= 0 ? S(MC[0] + cells[bi][0], MC[1] + cells[bi][1]) : null; }
      if (id === 'levelA') return S(levelA()[0], levelA()[1]);
      if (id === 'levelB') return S(levelB()[0], levelB()[1]);
      if (id === 'knock') return S(KN[0], KN[1]);
      if (id === 'cookie') return dragCookie ? S(dragCookie.x, dragCookie.y) : null;
      if (id.startsWith('slot:')) return S(SLOTX, SLOTY[Number(id.slice(5))]);
      return null;
    },
    state,
  };
}

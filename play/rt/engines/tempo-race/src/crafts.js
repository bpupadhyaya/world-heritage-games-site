// The vessels of the chase view, one drawing per craft. draw(ctx, S, st): origin = hull centre at the waterline, bow to the
// right, S = hull length in px. st = { t, ph, v, color, q, trim, heel, id, hit }. Returns { tips } (paddle/pole blade tips in px,
// for splashes). Hull outlines are in hull units (S = 1).
import { hullShape, paddler, poler, sitter, sailTri, spar, flag, capsule, smooth, lg, lit, dim, mix, alpha, hash, SKINS, SHIRTS, TAU, clamp, lerp } from './craft-art.js';

const frac = (x) => x - Math.floor(x);
const pick = (a, i) => a[((i % a.length) + a.length) % a.length];

// shared: draw the inside of a hull (the far gunwale and a dark interior) between two hull curves
function interior(ctx, S, top, rise, col) {
  const T = top.map(([x, y]) => [x * S, y * S]);
  ctx.beginPath(); smooth(ctx, T, true); smooth(ctx, T.map(([x, y]) => [x, y - rise * S]).reverse(), false); ctx.closePath();
  ctx.fillStyle = col; ctx.fill();
}
function crewSkins(st, i) { return pick(st.skins ?? SKINS, st.id * 3 + i * 5 + 1); }

// ---- paddled craft ---------------------------------------------------------------------------------------------------
function paddledCrew(ctx, S, st, cfg) {
  const { seats, gun, u, water, hull, hat, shirts, sleeve } = cfg;
  const crew = seats.map((x, i) => {
    const phi = frac(st.ph / TAU + (cfg.jitter ?? 0.03) * (hash(st.id * 17 + i) - 0.5) * 2 + (cfg.stagger ?? 0) * i);
    const shirt = shirts === 'team' ? lit(st.color, i % 2 ? 0.12 : 0) : pick(shirts, i + st.id);
    return paddler(ctx, x * S, gun * S, u * S, phi, {
      skin: crewSkins(st, i), shirt, sleeve: sleeve ? (sleeve === 'team' ? st.color : sleeve) : undefined,
      hat: typeof hat === 'function' ? hat(i) : hat, hatCol: cfg.hatCol ? cfg.hatCol(i, st) : shirt,
      blade: cfg.blade ?? st.color, wood: cfg.wood, water: water * S, seat: cfg.seat,
    });
  });
  return crew;
}

const OUT_TOP = [[-0.5, -0.12], [-0.46, -0.085], [-0.3, -0.06], [0, -0.052], [0.3, -0.058], [0.45, -0.085], [0.5, -0.14]];
const OUT_BOT = [[0.5, -0.12], [0.46, -0.04], [0.38, 0.004], [0.1, 0.016], [-0.2, 0.016], [-0.42, 0.002], [-0.49, -0.05], [-0.5, -0.105]];

function outrigger(ctx, S, st) {
  const base = st.hull ?? '#f4efe4';
  interior(ctx, S, OUT_TOP.slice(1, -1), 0.016, '#2a1a10');
  const crew = paddledCrew(ctx, S, st, { seats: [-0.32, -0.16, 0, 0.16, 0.32], gun: -0.052, u: 0.098, water: 0.02, hat: (i) => (i % 2 ? 'band' : 'cap'), shirts: 'team', hatCol: (i, s) => (i % 2 ? lit(s.color, 0.3) : s.color) });
  hullShape(ctx, S, OUT_TOP, OUT_BOT, base, { stripe: st.color, stripeW: 0.016, stripeDrop: 0.02, rail: lit(st.trim ?? '#b88a50', 0.35) });
  // carved prow curl and stern tail
  ctx.strokeStyle = st.color; ctx.lineWidth = S * 0.01; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0.46 * S, -0.09 * S); ctx.quadraticCurveTo(0.53 * S, -0.16 * S, 0.5 * S, -0.2 * S); ctx.stroke();
  // lashed booms to the float
  for (const bx of [-0.14, 0.17]) {
    ctx.strokeStyle = '#4a2c14'; ctx.lineWidth = S * 0.02; ctx.beginPath(); ctx.moveTo(bx * S, -0.052 * S); ctx.quadraticCurveTo((bx + 0.02) * S, 0.035 * S, (bx + 0.035) * S, 0.075 * S); ctx.stroke();
    ctx.strokeStyle = '#c9a56a'; ctx.lineWidth = S * 0.008; ctx.beginPath(); ctx.moveTo(bx * S, -0.052 * S); ctx.quadraticCurveTo((bx + 0.02) * S, 0.035 * S, (bx + 0.035) * S, 0.075 * S); ctx.stroke();
    ctx.fillStyle = '#e8d6a8'; ctx.fillRect((bx + 0.026) * S, 0.066 * S, 0.018 * S, 0.012 * S);
    ctx.fillStyle = '#c9a56a'; ctx.fillRect((bx - 0.008) * S, -0.058 * S, 0.016 * S, 0.012 * S);
  }
  // the float (ama)
  hullShape(ctx, S, [[-0.31, 0.08], [-0.2, 0.068], [0.1, 0.066], [0.3, 0.072], [0.4, 0.054]], [[0.4, 0.058], [0.34, 0.09], [0.1, 0.102], [-0.2, 0.102], [-0.31, 0.088]], mix(base, st.color, 0.35), { rail: '#fff' });
  const tips = crew.map((c) => c.draw2());
  return { tips };
}

const VOY_TOP = [[-0.5, -0.21], [-0.485, -0.13], [-0.4, -0.082], [-0.2, -0.058], [0.05, -0.05], [0.3, -0.06], [0.42, -0.09], [0.485, -0.14], [0.5, -0.21]];
const VOY_BOT = [[0.5, -0.2], [0.48, -0.1], [0.4, -0.02], [0.2, 0.012], [-0.1, 0.018], [-0.35, 0.01], [-0.47, -0.06], [-0.5, -0.17]];
function voyageur(ctx, S, st) {
  const base = st.hull ?? '#cf9d5d';
  interior(ctx, S, VOY_TOP.slice(1, -1), 0.018, '#3a2414');
  const crew = paddledCrew(ctx, S, st, { seats: [-0.34, -0.18, -0.02, 0.14, 0.3], gun: -0.056, u: 0.096, water: 0.02, hat: (i) => (i % 3 === 0 ? 'wrap' : 'cap'), shirts: ['#c8372d', '#f4f0e4', '#2a5da8', '#e8b84a'], sleeve: undefined, hatCol: (i, s) => (i % 2 ? s.color : '#c8372d'), blade: undefined });
  hullShape(ctx, S, VOY_TOP, VOY_BOT, base, { stripe: '#8a5a2a', stripeW: 0.012, rail: '#5a3820' });
  // bark seams, stitch ticks and the painted bow frieze
  ctx.strokeStyle = 'rgba(70,40,16,0.45)'; ctx.lineWidth = S * 0.0035;
  for (let i = -9; i <= 9; i++) { const x = i * 0.05; ctx.beginPath(); ctx.moveTo(x * S, -0.05 * S); ctx.lineTo((x + 0.012) * S, -0.012 * S); ctx.stroke(); }
  for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? st.color : '#f4efe4'; ctx.beginPath(); ctx.moveTo((0.36 + i * 0.02) * S, -0.07 * S); ctx.lineTo((0.37 + i * 0.02) * S, -0.115 * S); ctx.lineTo((0.38 + i * 0.02) * S, -0.07 * S); ctx.fill(); }
  ctx.fillStyle = st.color; ctx.beginPath(); ctx.ellipse(0.495 * S, -0.18 * S, 0.012 * S, 0.026 * S, 0.2, 0, TAU); ctx.fill();
  const tips = crew.map((c) => c.draw2());
  return { tips };
}

const ICE_TOP = [[-0.5, -0.15], [-0.48, -0.1], [-0.38, -0.07], [-0.2, -0.056], [0.1, -0.05], [0.3, -0.058], [0.42, -0.085], [0.5, -0.15]];
const ICE_BOT = [[0.5, -0.14], [0.46, -0.05], [0.36, 0.0], [0.1, 0.016], [-0.2, 0.016], [-0.4, -0.01], [-0.5, -0.1]];
function iceCanoe(ctx, S, st) {
  const base = st.hull ?? '#d8432c';
  // steel runner strip under the hull, curving up at both ends
  const run = (ctx2) => { ctx2.strokeStyle = '#9fb2c2'; ctx2.lineWidth = S * 0.01; ctx2.lineCap = 'round'; ctx2.beginPath(); ctx2.moveTo(-0.46 * S, -0.03 * S); ctx2.quadraticCurveTo(-0.4 * S, 0.034 * S, -0.3 * S, 0.034 * S); ctx2.lineTo(0.3 * S, 0.034 * S); ctx2.quadraticCurveTo(0.42 * S, 0.034 * S, 0.47 * S, -0.04 * S); ctx2.stroke(); ctx2.strokeStyle = 'rgba(255,255,255,0.7)'; ctx2.lineWidth = S * 0.003; ctx2.beginPath(); ctx2.moveTo(-0.3 * S, 0.031 * S); ctx2.lineTo(0.3 * S, 0.031 * S); ctx2.stroke(); };
  interior(ctx, S, ICE_TOP.slice(1, -1), 0.016, '#1c2430');
  const crew = paddledCrew(ctx, S, st, { seats: [-0.3, -0.12, 0.06, 0.24], gun: -0.054, u: 0.1, water: 0.02, hat: 'toque', shirts: ['#27364a', '#b9382b', '#2a6a8a', '#e4e8ee'], sleeve: undefined, hatCol: (i, s) => (i % 2 ? s.color : '#f4f0e4'), blade: '#e8eef4', wood: '#c9d3dc', stagger: 0.0 });
  run(ctx);
  hullShape(ctx, S, ICE_TOP, ICE_BOT, base, { stripe: '#fff', stripeW: 0.012, rail: '#f0f4f8' });
  // rope grab lines along the side
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = S * 0.004; ctx.setLineDash([S * 0.02, S * 0.014]); ctx.beginPath(); ctx.moveTo(-0.4 * S, -0.032 * S); ctx.lineTo(0.38 * S, -0.036 * S); ctx.stroke(); ctx.setLineDash([]);
  const tips = crew.map((c) => c.draw2());
  return { tips };
}

const DUA_TOP = [[-0.5, -0.1], [-0.46, -0.07], [-0.3, -0.052], [0, -0.046], [0.3, -0.052], [0.44, -0.08], [0.5, -0.17]];
const DUA_BOT = [[0.5, -0.15], [0.46, -0.04], [0.38, 0.0], [0.1, 0.014], [-0.2, 0.014], [-0.42, 0.0], [-0.5, -0.07]];
function dugout(ctx, S, st) {
  const base = st.hull ?? '#8a4b2a';
  interior(ctx, S, DUA_TOP.slice(1, -1), 0.014, '#24130b');
  const crew = paddledCrew(ctx, S, st, { seats: [-0.36, -0.2, -0.04, 0.12, 0.28], gun: -0.048, u: 0.09, water: 0.018, hat: (i) => (i % 3 === 0 ? 'wrap' : 'bare'), shirts: 'team', hatCol: (i, s) => (i % 2 ? '#f2c14e' : s.color), jitter: 0.02 });
  hullShape(ctx, S, DUA_TOP, DUA_BOT, base, { stripe: '#f2c14e', stripeW: 0.012, rail: '#e8c27a' });
  // painted zigzag along the hull and the carved up-curved prow
  ctx.strokeStyle = alpha('#f4efe4', 0.85); ctx.lineWidth = S * 0.004; ctx.beginPath();
  for (let i = -8; i <= 8; i++) ctx.lineTo((i * 0.052) * S, (-0.028 + (i % 2 ? 0.01 : -0.004)) * S); ctx.stroke();
  ctx.fillStyle = st.color; ctx.beginPath(); ctx.moveTo(0.46 * S, -0.1 * S); ctx.quadraticCurveTo(0.54 * S, -0.2 * S, 0.5 * S, -0.26 * S); ctx.quadraticCurveTo(0.505 * S, -0.2 * S, 0.43 * S, -0.082 * S); ctx.fill();
  const tips = crew.map((c) => c.draw2());
  return { tips };
}

// ---- poled dugout ------------------------------------------------------------------------------------------------------
function mokoro(ctx, S, st) {
  const top = [[-0.5, -0.062], [-0.42, -0.036], [0, -0.026], [0.4, -0.03], [0.5, -0.07]], bot = [[0.5, -0.06], [0.45, -0.008], [0.3, 0.012], [-0.3, 0.012], [-0.45, -0.008], [-0.5, -0.05]];
  const base = st.hull ?? '#b79a72';
  const u = 0.092 * S, phi = frac(st.ph / TAU);
  const o = { skin: crewSkins(st, 0), shirt: st.color, trousers: '#3a4a5e', hat: 'straw', hatCol: lit(st.color, 0.2), water: 0.014 * S, wood: '#8a6a40' };
  const p = poler(ctx, -0.3 * S, -0.03 * S, u, phi, o);
  interior(ctx, S, top.slice(1, -1), 0.012, '#2a1d12');
  // a passenger's bundle and a seated rider
  sitter(ctx, 0.06 * S, -0.03 * S, u * 0.8, { skin: crewSkins(st, 1), shirt: lit(st.color, 0.35), hat: 'wrap', hatCol: '#f4f0e4' }, 0.04);
  hullShape(ctx, S, top, bot, base, { stripe: st.color, stripeW: 0.01, rail: '#e0c89a' });
  // adze marks on the dugout
  ctx.strokeStyle = 'rgba(60,40,20,0.35)'; ctx.lineWidth = S * 0.003; for (let i = -7; i <= 7; i++) { ctx.beginPath(); ctx.moveTo(i * 0.06 * S, -0.02 * S); ctx.lineTo((i * 0.06 + 0.02) * S, -0.008 * S); ctx.stroke(); }
  const tip = p.draw2();
  // woven basket by the rider
  ctx.fillStyle = '#c88a3a'; ctx.beginPath(); ctx.ellipse(0.2 * S, -0.045 * S, 0.034 * S, 0.026 * S, 0, 0, TAU); ctx.fill();
  return { tips: [tip] };
}

// ---- sailing craft -----------------------------------------------------------------------------------------------------
function heelWrap(ctx, st, fn) { ctx.save(); ctx.rotate(st.heel ?? 0); fn(); ctx.restore(); }
function fill(st) { return clamp(st.q ?? 0.6, 0, 1); }

function jangada(ctx, S, st) {
  const logs = '#c79a62';
  heelWrap(ctx, st, () => {
    const top = [[-0.5, -0.03], [-0.3, -0.04], [0.2, -0.045], [0.42, -0.05], [0.5, -0.1]], bot = [[0.5, -0.09], [0.44, 0.0], [0.2, 0.014], [-0.3, 0.016], [-0.5, 0.0]];
    // mast and sail behind, fisherman and oar
    const f = fill(st), t = st.t;
    const sailCol = st.sail ?? '#f1e6cf';
    sailTri(ctx, S, [0.3, -0.06], [0.03, -0.84], [-0.34, -0.14], sailCol, { t, billow: 0.03 + 0.07 * f, flutter: (1 - f) * 0.012, seams: 7, band: st.color, patches: [[0.45, 0.35, 0.09, 0.06, st.color], [0.55, 0.6, 0.07, 0.05, '#d9a441']] });
    spar(ctx, -0.34 * S, -0.14 * S, 0.3 * S, -0.06 * S, S * 0.009);
    spar(ctx, 0.08 * S, -0.04 * S, 0.06 * S, -0.82 * S, S * 0.012);
    flag(ctx, 0.03 * S, -0.84 * S, 0.1 * S, 0.035 * S, st.color, t, st.id);
    hullShape(ctx, S, top, bot, logs, { rail: lit(logs, 0.5) });
    ctx.strokeStyle = 'rgba(70,40,14,0.55)'; ctx.lineWidth = S * 0.0035;
    for (const y of [-0.028, -0.014, 0.0]) { ctx.beginPath(); ctx.moveTo(-0.48 * S, y * S); ctx.lineTo(0.42 * S, (y - 0.005) * S); ctx.stroke(); }
    ctx.fillStyle = dim(logs, 0.25); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(-0.497 * S, (-0.02 + i * 0.016) * S, 0.007 * S, 0.008 * S, 0, 0, TAU); ctx.fill(); }
    // lashing bands across the logs
    ctx.strokeStyle = '#6a4420'; ctx.lineWidth = S * 0.006; for (const x of [-0.3, -0.05, 0.2]) { ctx.beginPath(); ctx.moveTo(x * S, -0.043 * S); ctx.lineTo((x + 0.004) * S, 0.012 * S); ctx.stroke(); }
    // fisherman seated aft with the steering oar, mate by the mast
    sitter(ctx, -0.34 * S, -0.04 * S, 0.08 * S, { skin: crewSkins(st, 0), shirt: st.color, hat: 'straw', hatCol: st.color }, 0.08);
    sitter(ctx, 0.12 * S, -0.045 * S, 0.075 * S, { skin: crewSkins(st, 1), shirt: '#f4f0e4', hat: 'cap', hatCol: '#2a5da8' }, -0.1);
    spar(ctx, -0.34 * S, -0.1 * S, -0.56 * S, 0.06 * S, S * 0.008, '#7a5230');
    ctx.fillStyle = '#c8372d'; ctx.beginPath(); ctx.ellipse(-0.57 * S, 0.075 * S, 0.01 * S, 0.026 * S, 0.5, 0, TAU); ctx.fill();
  });
  return { tips: [] };
}

function felucca(ctx, S, st) {
  const f = fill(st), t = st.t;
  heelWrap(ctx, st, () => {
    const base = st.hull ?? '#f1e8d4';
    const top = [[-0.5, -0.14], [-0.45, -0.098], [-0.3, -0.066], [0, -0.046], [0.3, -0.05], [0.45, -0.08], [0.5, -0.12]], bot = [[0.5, -0.1], [0.44, -0.03], [0.3, 0.01], [-0.3, 0.012], [-0.44, -0.02], [-0.5, -0.1]];
    // lateen: a long yard slanting up from the bow and a triangle of cloth hung from it
    const sailCol = st.sail ?? '#f6efe0';
    sailTri(ctx, S, [0.4, -0.1], [-0.14, -0.84], [-0.44, -0.16], sailCol, { t, billow: 0.025 + 0.06 * f, flutter: (1 - f) * 0.012, seams: 8, band: st.color });
    spar(ctx, 0.44 * S, -0.075 * S, -0.16 * S, -0.88 * S, S * 0.011, '#6a4424');
    spar(ctx, 0.12 * S, -0.05 * S, 0.1 * S, -0.3 * S, S * 0.012);
    flag(ctx, -0.15 * S, -0.88 * S, 0.1 * S, 0.034 * S, st.color, t, st.id);
    hullShape(ctx, S, top, bot, base, { stripe: st.color, stripeW: 0.016, stripeDrop: 0.022, rail: '#7a5230' });
    // painted eyes of the bow and a deck canopy aft
    ctx.fillStyle = '#2a5da8'; ctx.beginPath(); ctx.arc(0.43 * S, -0.075 * S, 0.012 * S, 0, TAU); ctx.fill();
    ctx.fillStyle = st.color; ctx.fillRect(-0.45 * S, -0.1 * S, 0.12 * S, 0.012 * S);
    sitter(ctx, -0.36 * S, -0.07 * S, 0.075 * S, { skin: crewSkins(st, 0), shirt: '#f4f0e4', hat: 'wrap', hatCol: '#f4f0e4' }, 0.0);
    sitter(ctx, 0.18 * S, -0.05 * S, 0.07 * S, { skin: crewSkins(st, 1), shirt: st.color, hat: 'cap', hatCol: '#2a2a2a' }, 0.05);
    spar(ctx, -0.46 * S, -0.1 * S, -0.54 * S, 0.0, S * 0.008, '#7a5230');   // rudder
  });
  return { tips: [] };
}

function ngalawa(ctx, S, st) {
  const f = fill(st), t = st.t;
  heelWrap(ctx, st, () => {
    const base = st.hull ?? '#d8c7a4';
    const top = [[-0.5, -0.09], [-0.4, -0.06], [0, -0.045], [0.4, -0.055], [0.5, -0.1]], bot = [[0.5, -0.09], [0.44, -0.01], [0.2, 0.014], [-0.3, 0.014], [-0.46, -0.01], [-0.5, -0.07]];
    // crab-claw sail: two curved spars meeting at the foot, cloth between
    const sailCol = st.sail ?? '#e8d2a8';
    const ax = 0.04 * S, ay = -0.07 * S, px = -0.3 * S, py = -0.56 * S, qx = 0.34 * S, qy = -0.58 * S, b = (0.03 + 0.06 * f) * S;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(-0.2 * S - b * 0.5, -0.35 * S, px, py); ctx.quadraticCurveTo(0.02 * S, -0.64 * S - b * 0.3 + Math.sin(t * 7 + st.id) * (1 - f) * 0.01 * S, qx, qy); ctx.quadraticCurveTo(0.26 * S + b * 0.7, -0.36 * S, ax, ay); ctx.closePath();
    ctx.fillStyle = lg(ctx, px, 0, qx, 0, [[0, dim(sailCol, 0.14)], [0.5, lit(sailCol, 0.16)], [1, sailCol]]); ctx.fill();
    ctx.save(); ctx.clip();
    for (let i = 0; i < 6; i++) { ctx.fillStyle = alpha(i % 2 ? st.color : '#d9a441', 0.55); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(lerp(px, qx, i / 5) , lerp(py, qy, i / 5) - 0.05 * S); ctx.lineTo(lerp(px, qx, (i + 1) / 5), lerp(py, qy, (i + 1) / 5) - 0.05 * S); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(30,18,8,0.5)'; ctx.lineWidth = S * 0.003; ctx.stroke();
    ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = S * 0.011; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(-0.2 * S - b * 0.5, -0.35 * S, px, py); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(0.26 * S + b * 0.7, -0.36 * S, qx, qy); ctx.stroke();
    spar(ctx, 0.04 * S, -0.04 * S, 0.04 * S, -0.1 * S, S * 0.013);
    // float
    for (const bx of [-0.12, 0.18]) { ctx.strokeStyle = '#6a4424'; ctx.lineWidth = S * 0.011; ctx.beginPath(); ctx.moveTo(bx * S, -0.045 * S); ctx.quadraticCurveTo((bx + 0.02) * S, 0.05 * S, (bx + 0.04) * S, 0.092 * S); ctx.stroke(); }
    hullShape(ctx, S, top, bot, base, { stripe: st.color, stripeW: 0.013, rail: '#7a5230' });
    sitter(ctx, -0.3 * S, -0.045 * S, 0.075 * S, { skin: crewSkins(st, 0), shirt: st.color, hat: 'cap', hatCol: '#f4f0e4' }, 0.06);
    sitter(ctx, 0.2 * S, -0.045 * S, 0.075 * S, { skin: crewSkins(st, 1), shirt: '#f4f0e4', hat: 'wrap', hatCol: '#c8372d' }, -0.05);
    hullShape(ctx, S, [[-0.3, 0.092], [-0.2, 0.08], [0.1, 0.078], [0.3, 0.084], [0.4, 0.068]], [[0.4, 0.07], [0.34, 0.1], [0.1, 0.112], [-0.2, 0.112], [-0.3, 0.1]], mix(base, st.color, 0.3), { rail: '#fff' });
  });
  return { tips: [] };
}

function sloop(ctx, S, st) {
  const f = fill(st), t = st.t;
  heelWrap(ctx, st, () => {
    const base = st.hull ?? '#f4efe4';
    const top = [[-0.5, -0.085], [-0.3, -0.062], [0, -0.05], [0.3, -0.058], [0.5, -0.1]], bot = [[0.5, -0.09], [0.4, -0.012], [0.1, 0.016], [-0.3, 0.014], [-0.5, -0.05]];
    const sailCol = st.sail ?? '#f7f1e2';
    // main with a long boom over the stern and a jib forward
    sailTri(ctx, S, [0.0, -0.07], [-0.03, -0.9], [-0.54, -0.095], sailCol, { t, billow: 0.03 + 0.07 * f, flutter: (1 - f) * 0.012, seams: 8, band: st.color });
    sailTri(ctx, S, [0.5, -0.095], [0.04, -0.78], [0.04, -0.11], lit(sailCol, 0.0), { t: t + 1, billow: 0.02 + 0.04 * f, flutter: (1 - f) * 0.01, seams: 5 });
    spar(ctx, 0.0 * S, -0.04 * S, -0.03 * S, -0.9 * S, S * 0.011);
    spar(ctx, -0.55 * S, -0.095 * S, 0.0, -0.075 * S, S * 0.009);
    ctx.fillStyle = st.color; ctx.font = `900 ${Math.round(S * 0.08)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(1 + (st.id % 9)), -0.25 * S, -0.36 * S);
    flag(ctx, -0.03 * S, -0.9 * S, 0.1 * S, 0.034 * S, st.color, t, st.id);
    hullShape(ctx, S, top, bot, base, { stripe: st.color, stripeW: 0.02, stripeDrop: 0.02, rail: '#8a5a2a' });
    // crew hiking out along the near gunwale, leaning away from the deck
    for (let i = 0; i < 4; i++) sitter(ctx, (-0.3 + i * 0.13) * S, -0.058 * S, 0.07 * S, { skin: crewSkins(st, i), shirt: pick(['#f4f0e4', st.color, '#2a5da8', '#e8b84a'], i + st.id), hat: i % 2 ? 'cap' : 'wrap', hatCol: i % 2 ? '#f4f0e4' : st.color }, 0.3 + 0.12 * (i % 2));
    ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = S * 0.006; ctx.beginPath(); ctx.moveTo(-0.32 * S, -0.052 * S); ctx.lineTo(0.28 * S, -0.058 * S); ctx.stroke();
  });
  return { tips: [] };
}

// ---- the table ----------------------------------------------------------------------------------------------------------
// len = real length in metres (sets the speed scale), h = overall height as a share of the length, bow/stern = hull ends,
// draft = water-line spread, kind = the vehicle the craft expects, sails = true for sail crafts
export const CRAFTS = {
  outrigger: { draw: outrigger, len: 13, h: 0.4, bow: 0.5, stern: -0.5, below: 0.13, kind: 'paddle', hull: '#f4efe4' },
  voyageur: { draw: voyageur, len: 12, h: 0.4, bow: 0.5, stern: -0.5, below: 0.04, kind: 'paddle', hull: '#cf9d5d' },
  'ice-canoe': { draw: iceCanoe, len: 8, h: 0.30, bow: 0.5, stern: -0.5, below: 0.05, kind: 'paddle', hull: '#d8432c', ice: true },
  dugout: { draw: dugout, len: 14, h: 0.4, bow: 0.5, stern: -0.5, below: 0.04, kind: 'paddle', hull: '#8a4b2a' },
  mokoro: { draw: mokoro, len: 6, h: 0.52, bow: 0.5, stern: -0.5, below: 0.03, kind: 'paddle', hull: '#b79a72' },
  jangada: { draw: jangada, len: 6, h: 0.9, bow: 0.5, stern: -0.5, below: 0.05, kind: 'sailor', sails: true },
  felucca: { draw: felucca, len: 9, h: 0.92, bow: 0.5, stern: -0.5, below: 0.04, kind: 'sailor', sails: true },
  ngalawa: { draw: ngalawa, len: 5, h: 0.66, bow: 0.5, stern: -0.5, below: 0.12, kind: 'sailor', sails: true },
  sloop: { draw: sloop, len: 9, h: 1.0, bow: 0.5, stern: -0.5, below: 0.04, kind: 'sailor', sails: true },
};
export const CRAFT_IDS = Object.keys(CRAFTS);
export { SHIRTS };

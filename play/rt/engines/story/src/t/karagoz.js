// Karagoz (Turkey): coloured translucent leather figures pressed to the back of a lit muslin screen, framed by a carved
// walnut window with a pointed tulip arch, iznik tiles, brass lamps and the coffeehouse audience in the foreground.
import { register } from '../theatres.js';
import { mix, dark, light, alpha, vgrad, hgrad, rrPath } from '../figures.js';
import { weave, vignette, place } from '../kit.js';
import { TAU, hash, outline, arm2, holes } from './_shadowkit.js';

// ---- the puppets ----------------------------------------------------------------------------------------------------
const PALETTE = {
  clown: { robe: '#d2322c', pants: '#1c9450', cap: '#23306e', band: '#e8b030' },
  person: { robe: '#2e62bc', pants: '#efe2b8', cap: '#f4ead0', band: '#d9962a' },
  ruler: { robe: '#80308f', pants: '#e8c040', cap: '#c2262a', band: '#f0d060' },
  trader: { robe: '#e08a1c', pants: '#2a8f98', cap: '#8a2a2a', band: '#f0d060' },
  child: { robe: '#2aa0a8', pants: '#e8a040', cap: '#c8302a', band: '#f4ead0' },
};

function human(T) {
  const { ctx, c, o, kind, t, talk, breath } = T;
  const P = PALETTE[kind] ?? PALETTE.person;
  const robe = c.color && c.color !== '#9a5b3a' ? c.color : P.robe;
  const clown = kind === 'clown', ruler = kind === 'ruler', child = kind === 'child';
  const S = T.s * (clown ? 0.78 : child ? 0.68 : 1);
  const ln = Math.max(1.4, S * 0.013), INK = '#120a06';
  const glow = 'rgba(255,246,205,0.5)';
  const lean = o.lean ?? 0, sway = breath * S * 0.004;
  const shade = (col, y0, y1) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, light(col, 0.28)); g.addColorStop(0.55, col); g.addColorStop(1, dark(col, 0.18)); return g; };
  const part = (pts, col, sm, hl, y0 = -0.8, y1 = 0) => {
    outline(ctx, pts, S, 0, 0, sm); ctx.fillStyle = shade(col, y0 * S, y1 * S); ctx.fill();
    ctx.save(); outline(ctx, pts, S, 0, 0, sm); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,230,0.14)'; ctx.fillRect(-S, y0 * S, S * 0.12, S); // lamp glow through thin hide
    if (hl) { ctx.fillStyle = glow; hl(); }
    ctx.restore();
    outline(ctx, pts, S, 0, 0, sm); ctx.strokeStyle = INK; ctx.lineWidth = ln; ctx.lineJoin = 'round'; ctx.stroke();
  };
  const st = o.walk ? Math.sin(t * 9 + T.phase) * 0.04 : 0;
  // curly-toed shoes
  const shoe = (dx, col) => part([[-0.04 + dx, -0.05], [0.06 + dx, -0.06], [0.16 + dx, -0.03], [0.24 + dx, -0.07], [0.25 + dx, -0.02], [0.18 + dx, 0.0], [-0.04 + dx, 0.0]], col, false);
  shoe(-0.09 - st, '#8a2a1c'); shoe(0.06 + st, '#a8321e');
  // baggy trousers (salvar), gathered at the ankle
  const wide = clown ? 1.18 : 1;
  part([[-0.12 * wide, -0.42], [0.14 * wide, -0.42], [0.2 * wide, -0.28], [0.14 * wide, -0.1], [0.1, -0.06], [0.01, -0.06], [0.0, -0.2], [-0.02, -0.06], [-0.1, -0.06], [-0.16 * wide, -0.15], [-0.2 * wide, -0.28]], P.pants, true, () => {
    holes(ctx, -0.22 * S, -0.43 * S, 0.44 * S, 0.4 * S, S * 0.04, S * 0.007, glow, 'dia');
  }, -0.42, 0);
  // upper body about the hips
  ctx.save(); ctx.translate(0, -0.42 * S + sway); ctx.rotate(lean);
  const up = (pts) => pts.map(([x, y]) => [x, y + 0.42]);
  const belly = clown ? 0.1 : 0;
  const torso = ruler
    ? [[-0.1, -0.7], [0.0, -0.72], [0.12, -0.66], [0.15, -0.5], [0.17, -0.38], [-0.17, -0.38], [-0.14, -0.55]]
    : [[-0.1, -0.68], [0.0, -0.7], [0.1, -0.64], [0.13 + belly, -0.52], [0.15 + belly, -0.4], [-0.14, -0.4], [-0.12, -0.54]];
  part(up(torso), robe, true, () => {
    holes(ctx, -0.16 * S, -0.3 * S, 0.34 * S, 0.3 * S, S * 0.036, S * 0.007, glow);
    ctx.fillStyle = 'rgba(20,10,5,0.55)'; ctx.fillRect(-0.15 * S, -0.0 * S, 0.34 * S, S * 0.025);
  }, -0.3, 0);
  // vest edge and sash
  ctx.fillStyle = P.band; ctx.fillRect(-0.14 * S, -0.04 * S, (0.3 + belly) * S, S * 0.04); ctx.strokeStyle = INK; ctx.lineWidth = ln * 0.7; ctx.strokeRect(-0.14 * S, -0.04 * S, (0.3 + belly) * S, S * 0.04);
  // head: big, profile, bulging eye, huge nose
  const R = S * (clown ? 0.1 : child ? 0.08 : 0.078);
  const bob = (o.speaking ? Math.abs(talk) * 0.01 : 0) * S;
  const hx = 0.03 * S, hy = (-0.7 + 0.42) * S - R * 1.0 - bob;
  ctx.fillStyle = shade('#d89a64', hy, hy + R * 2); ctx.fillRect(hx - R * 0.35, hy + R * 0.5, R * 0.8, R * 1.0);
  // cap or tall kavuk turban (behind the face)
  const hd = (pts, col, sm, hl) => { outline(ctx, pts, R, hx, hy, sm); ctx.fillStyle = shade(col, hy - R * 3, hy); ctx.fill(); ctx.save(); outline(ctx, pts, R, hx, hy, sm); ctx.clip(); if (hl) { ctx.fillStyle = glow; hl(); } ctx.restore(); outline(ctx, pts, R, hx, hy, sm); ctx.strokeStyle = INK; ctx.lineWidth = ln; ctx.stroke(); };
  const skin = '#e6a870';
  // face
  const beardy = kind === 'clown' || kind === 'person' || kind === 'trader' || ruler;
  hd([[-0.9, 0.0], [-0.85, -0.6], [-0.4, -1.0], [0.3, -1.05], [0.8, -0.8], [0.95, -0.4], [1.0, 0.1], [0.9, 0.5], [0.7, 0.9], [0.1, 1.1], [-0.5, 0.8]], skin, true, () => holes(ctx, hx - R, hy - R * 0.2, R * 1.8, R * 1.2, R * 0.28, R * 0.05, 'rgba(255,255,255,0.5)'));
  // nose
  const nose = clown ? 1.0 : 0.8;
  hd([[0.85, -0.35], [1.0 + nose * 0.5, -0.1], [1.0 + nose * 0.75, 0.3], [1.0 + nose * 0.4, 0.55], [0.9, 0.45]], '#d68c58', true);
  // eye, brow
  ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.ellipse(hx + R * 0.45, hy - R * 0.28, R * 0.3, R * 0.24, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = ln; ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(hx + R * 0.55, hy - R * 0.27, R * 0.11, 0, TAU); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = ln * 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx + R * 0.05, hy - R * 0.62); ctx.quadraticCurveTo(hx + R * 0.45, hy - R * 0.75, hx + R * 0.85, hy - R * 0.5); ctx.stroke();
  // beard (moves with speech) or clean mouth
  const jaw = (o.speaking ? Math.abs(talk) * 0.12 : 0) * R;
  if (beardy) {
    const big = clown || ruler;
    hd([[-0.5, 0.1], [0.3, 0.3], [0.85, 0.5], [0.95, 0.8 + (big ? 0.5 : 0.35)], [0.5, 1.3 + (big ? 0.8 : 0.4)], [0.0, 1.0], [-0.4, 0.8]].map(([x, y]) => [x, y + jaw / R]), '#1a1210', true, () => holes(ctx, hx - R * 0.4, hy + R * 0.3, R * 1.4, R * 1.8, R * 0.3, R * 0.05, 'rgba(255,255,255,0.35)'));
  } else {
    ctx.fillStyle = '#8a2a20'; ctx.beginPath(); ctx.ellipse(hx + R * 0.72, hy + R * 0.7, R * 0.18, R * (0.05 + jaw / R * 0.8), 0, 0, TAU); ctx.fill();
  }
  if (!clown && !ruler && beardy) { ctx.strokeStyle = '#1a1210'; ctx.lineWidth = ln * 2; ctx.beginPath(); ctx.moveTo(hx + R * 0.5, hy + R * 0.42); ctx.quadraticCurveTo(hx + R * 1.1, hy + R * 0.4, hx + R * 1.5, hy + R * 0.55); ctx.stroke(); }
  // headgear
  if (clown) {
    hd([[-1.0, -0.5], [-0.8, -1.3], [0.0, -1.7], [0.8, -1.35], [1.0, -0.6], [0.2, -0.9], [-0.5, -0.8]], P.cap, true, () => holes(ctx, hx - R, hy - R * 1.6, R * 2, R * 0.8, R * 0.3, R * 0.05, glow));
    hd([[-0.95, -0.7], [0.95, -0.85], [1.0, -0.55], [-0.95, -0.4]], P.band, false);
  } else if (child) {
    hd([[-0.95, -0.4], [-0.8, -1.2], [0.0, -1.55], [0.85, -1.2], [1.0, -0.5], [0.0, -0.85]], P.cap, true);
  } else { // kavuk: tall cylinder with a wrapped band
    hd([[-0.8, -0.75], [-0.75, -2.2], [0.0, -2.4], [0.75, -2.2], [0.82, -0.8]], ruler ? P.cap : '#f0e4c2', false, () => { for (let i = 0; i < 4; i++) ctx.fillRect(hx - R * 0.8, hy - R * (1.0 + i * 0.35), R * 1.6, R * 0.06); });
    hd([[-1.05, -0.65], [-0.9, -1.15], [0.95, -1.2], [1.1, -0.7], [0.0, -0.55]], P.band, true, () => holes(ctx, hx - R, hy - R * 1.2, R * 2.1, R * 0.5, R * 0.25, R * 0.05, 'rgba(255,255,255,0.6)'));
  }
  // arms: the front arm is long and jointed with a stick; the back arm short
  const hands = [];
  const aw = S * 0.042;
  const sh = [[-0.06, -0.66], [0.04, -0.66]];
  const angs = [(o.a1 ?? 0.1) + 0.2, (o.a2 ?? 0.1) + 0.45];
  const lens = [[S * 0.18, S * 0.2], [S * 0.26, S * 0.3]];
  for (let i = 0; i < 2; i++) {
    const sx = sh[i][0] * S, sy = (sh[i][1] + 0.42) * S;
    const r = arm2(ctx, sx, sy, angs[i], lens[i][0], lens[i][1], aw, shade(i ? robe : dark(robe, 0.15), sy, sy + S * 0.5), INK);
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(r[0], r[1], S * 0.04, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = ln; ctx.stroke();
    ctx.fillStyle = P.band; ctx.beginPath(); ctx.arc(r[2], r[3], S * 0.022, 0, TAU); ctx.fill(); ctx.stroke();
    hands.push([r[0], r[1]]);
    if (!(i === 1 && c.prop && c.prop !== 'none')) { ctx.strokeStyle = '#3a2410'; ctx.lineWidth = S * 0.012; ctx.beginPath(); ctx.moveTo(r[0], r[1]); ctx.lineTo(r[0] + S * 0.03, r[1] + S * 0.3); ctx.stroke(); }
    if (i === 1 && c.prop && c.prop !== 'none') { // the stick or staff in the front hand
      ctx.strokeStyle = '#5a3416'; ctx.lineWidth = S * 0.024; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(r[0] + S * 0.01, r[1] + S * 0.36); ctx.lineTo(r[0] + S * 0.02, r[1] - S * 0.36); ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = ln * 0.6; ctx.stroke();
      ctx.fillStyle = P.band; ctx.beginPath(); ctx.arc(r[0] + S * 0.02, r[1] - S * 0.37, S * 0.03, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.stroke();
    }
  }
  const cs = Math.cos(lean), sn = Math.sin(lean), hipAbs = -0.42 * S + sway;
  const loc = ([x, y]) => [x * cs - y * sn, hipAbs + x * sn + y * cs];
  T.hands.push(loc(hands[0]), loc(hands[1]));
  T.shoulders.push(loc([-0.06 * S, -0.24 * S]), loc([0.04 * S, -0.24 * S]));
  const hp = loc([hx, hy]); T.head.x = hp[0]; T.head.y = hp[1]; T.head.r = R;
  T.knees.push([-0.05 * S, -0.2 * S], [0.07 * S, -0.2 * S]);
  ctx.restore();
}

function puppet(T) {
  if (['person', 'ruler', 'clown', 'trader', 'child'].includes(T.kind)) { human(T); return true; }
  return false;
}

// ---- the theatre -------------------------------------------------------------------------------------------------
function tile(ctx, x, y, s, k) {
  const alt = k % 2 === 0;
  ctx.fillStyle = alt ? '#f2ecd8' : '#1c58ac'; ctx.fillRect(x, y, s, s);
  ctx.strokeStyle = 'rgba(10,30,70,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
  const cx = x + s / 2, cy = y + s / 2;
  ctx.fillStyle = alt ? '#1c58ac' : '#f2ecd8';
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * s * 0.17, cy + Math.sin(a) * s * 0.17, s * 0.18, s * 0.08, a, 0, TAU); ctx.fill(); }
  ctx.fillStyle = alt ? '#d8402e' : '#e8b030'; ctx.beginPath(); ctx.arc(cx, cy, s * 0.09, 0, TAU); ctx.fill();
  ctx.fillStyle = alt ? '#15a4a0' : '#15a4a0'; ctx.fillRect(x, y, s * 0.12, s * 0.12); ctx.fillRect(x + s * 0.88, y + s * 0.88, s * 0.12, s * 0.12);
}

function kandil(ctx, x, y, r, t, ph) {
  const sw = Math.sin(t * 1.3 + ph) * r * 0.3;
  const g = ctx.createRadialGradient(x + sw, y + r * 2, 1, x + sw, y + r * 2, r * 5); g.addColorStop(0, 'rgba(255,200,100,0.55)'); g.addColorStop(1, 'rgba(255,200,100,0)');
  ctx.fillStyle = g; ctx.fillRect(x + sw - r * 5, y - r * 3, r * 10, r * 10);
  ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y - r * 3); ctx.lineTo(x + sw, y); ctx.stroke();
  ctx.fillStyle = vgrad(ctx, y, y + r * 2.5, [[0, '#ffe9a0'], [0.5, '#d9a53a'], [1, '#7a5214']]);
  ctx.beginPath(); ctx.moveTo(x + sw - r * 0.5, y); ctx.lineTo(x + sw + r * 0.5, y); ctx.lineTo(x + sw + r * 1.2, y + r * 1.4); ctx.quadraticCurveTo(x + sw, y + r * 3, x + sw - r * 1.2, y + r * 1.4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,245,200,0.95)'; ctx.beginPath(); ctx.ellipse(x + sw, y + r * 1.5, r * 0.5, r * 0.7, 0, 0, TAU); ctx.fill();
}

function crowd(ctx, R, y0, v) {
  const c = v.crowd ?? { cheer: 0, mood: 0 }, t = v.t;
  const n = Math.max(5, Math.round(R.w / 54));
  for (let i = 0; i < n; i++) {
    const h = hash(i * 3.7), x = R.x + R.w * (i + 0.5) / n + (h - 0.5) * 12, r = R.w * 0.03 * (0.9 + h * 0.3);
    const hop = c.mood > 0 ? c.cheer * (0.5 + 0.5 * Math.sin(t * 11 + i * 1.7)) * r * 0.7 : 0;
    const y = y0 - hop;
    ctx.fillStyle = '#05080f';
    ctx.beginPath(); ctx.ellipse(x, y + r * 2.2, r * 1.8, r * 1.8, 0, Math.PI, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    if (i % 3 !== 1) { // fez with tassel
      ctx.fillStyle = '#6a0d14'; ctx.beginPath(); ctx.moveTo(x - r * 0.8, y - r * 0.5); ctx.lineTo(x - r * 0.65, y - r * 1.5); ctx.lineTo(x + r * 0.65, y - r * 1.5); ctx.lineTo(x + r * 0.8, y - r * 0.5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#05080f'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y - r * 1.5); ctx.quadraticCurveTo(x + r, y - r * 1.4, x + r * 1.1, y - r * 0.6); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,205,120,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    if (c.mood > 0 && c.cheer > 0.25 && i % 3 === 0) { ctx.strokeStyle = '#05080f'; ctx.lineWidth = r * 0.5; ctx.beginPath(); ctx.moveTo(x - r * 1.3, y + r * 1.6); ctx.lineTo(x - r * 1.7, y - r * 1.2); ctx.moveTo(x + r * 1.3, y + r * 1.6); ctx.lineTo(x + r * 1.7, y - r * 1.2); ctx.stroke(); }
  }
}

function stage(g, S0, v) {
  const { ctx } = g, t = v.t;
  const W = S0.w, H = S0.h;
  // tiled coffeehouse wall
  ctx.fillStyle = '#0d2748'; ctx.fillRect(S0.x, S0.y, W, H);
  const cs = Math.max(16, W / 20);
  for (let r = 0, y = S0.y; y < S0.y + H; y += cs, r++) for (let c = 0, x = S0.x; x < S0.x + W; x += cs, c++) tile(ctx, x, y, cs, r + c);
  const wallShade = ctx.createLinearGradient(0, S0.y, 0, S0.y + H); wallShade.addColorStop(0, 'rgba(4,14,34,0.55)'); wallShade.addColorStop(0.5, 'rgba(4,14,34,0.72)'); wallShade.addColorStop(1, 'rgba(4,10,24,0.85)');
  ctx.fillStyle = wallShade; ctx.fillRect(S0.x, S0.y, W, H);
  // the window: carved walnut frame with a pointed tulip arch
  const fr = Math.max(9, W * 0.045);
  const I = { x: S0.x + W * 0.1, y: S0.y + H * 0.1, w: W * 0.8, h: H * 0.68 };
  const base = I.y + I.h * 0.24, cx = I.x + I.w / 2;
  const arch = (e = 0) => {
    ctx.beginPath(); ctx.moveTo(I.x - e, I.y + I.h + e); ctx.lineTo(I.x - e, base);
    ctx.bezierCurveTo(I.x - e, base - I.h * 0.12, cx - I.w * 0.25, base - I.h * 0.12 - e * 0.3, cx, I.y - e * 1.2);
    ctx.bezierCurveTo(cx + I.w * 0.25, base - I.h * 0.12 - e * 0.3, I.x + I.w + e, base - I.h * 0.12, I.x + I.w + e, base);
    ctx.lineTo(I.x + I.w + e, I.y + I.h + e); ctx.closePath();
  };
  arch(fr); ctx.fillStyle = hgrad(ctx, I.x - fr, I.x + I.w + fr, [[0, '#2a1409'], [0.2, '#5a3216'], [0.5, '#7a4820'], [0.8, '#5a3216'], [1, '#2a1409']]); ctx.fill();
  ctx.strokeStyle = '#e8b84a'; ctx.lineWidth = 2; ctx.stroke();
  ctx.save(); arch(fr * 0.5); ctx.strokeStyle = 'rgba(240,190,90,0.55)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
  // lit muslin screen
  const flick = 0.96 + 0.04 * Math.sin(t * 7.3) * Math.sin(t * 2.9);
  ctx.save(); arch(0); ctx.clip();
  const rg = ctx.createRadialGradient(cx, I.y + I.h * 0.5, I.h * 0.05, cx, I.y + I.h * 0.5, Math.max(I.w, I.h) * 0.7 * flick);
  rg.addColorStop(0, '#fffefa'); rg.addColorStop(0.45, '#fff7de'); rg.addColorStop(1, '#f1d594');
  ctx.fillStyle = rg; ctx.fillRect(I.x, I.y - fr, I.w, I.h + fr);
  weave(ctx, I, 3, 'rgba(170,130,60,0.07)');
  const floorY = I.y + I.h * 0.95;
  // a stylised set piece (dekor) in translucent colour: tulips and a tiled house
  const dk = I.h * 0.28;
  ctx.fillStyle = 'rgba(214,110,60,0.35)'; ctx.fillRect(I.x + I.w * 0.05, floorY - dk, I.w * 0.2, dk);
  ctx.fillStyle = 'rgba(30,90,170,0.35)'; ctx.beginPath(); ctx.moveTo(I.x + I.w * 0.03, floorY - dk); ctx.lineTo(I.x + I.w * 0.15, floorY - dk * 1.5); ctx.lineTo(I.x + I.w * 0.27, floorY - dk); ctx.fill();
  for (const [fx, s] of [[0.78, 1], [0.86, 0.8], [0.93, 1.1]]) {
    const x = I.x + I.w * fx, h = dk * 0.9 * s;
    ctx.strokeStyle = 'rgba(30,140,70,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, floorY); ctx.lineTo(x, floorY - h); ctx.stroke();
    ctx.fillStyle = 'rgba(214,40,50,0.5)'; ctx.beginPath(); ctx.moveTo(x - 8 * s, floorY - h); ctx.quadraticCurveTo(x - 9 * s, floorY - h - 14 * s, x, floorY - h - 18 * s); ctx.quadraticCurveTo(x + 9 * s, floorY - h - 14 * s, x + 8 * s, floorY - h); ctx.fill();
  }
  // the ledge the figures slide along
  ctx.fillStyle = 'rgba(80,45,15,0.5)'; ctx.fillRect(I.x, floorY, I.w, I.h);
  place(ctx, I, floorY, I.h * 0.62, v, { style: 'color', noShadow: true });
  // warm light glows through the colours
  ctx.globalCompositeOperation = 'lighter';
  const bl = ctx.createRadialGradient(cx, I.y + I.h * 0.5, 4, cx, I.y + I.h * 0.5, I.h * 0.7 * flick);
  bl.addColorStop(0, 'rgba(255,214,140,0.2)'); bl.addColorStop(1, 'rgba(255,214,140,0)');
  ctx.fillStyle = bl; ctx.fillRect(I.x, I.y, I.w, I.h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
  // brass ledge with a carved lip
  const ly = I.y + I.h;
  ctx.fillStyle = vgrad(ctx, ly, ly + H * 0.05, [[0, '#f0cc70'], [0.3, '#b8862a'], [1, '#4a2e0c']]); rrPath(ctx, I.x - fr * 1.2, ly, I.w + fr * 2.4, H * 0.05, 4); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.stroke();
  // floor of the coffeehouse and what stands on it
  const fy = ly + H * 0.05;
  ctx.fillStyle = vgrad(ctx, fy, S0.y + H, [[0, '#2a1608'], [1, '#0b0603']]); ctx.fillRect(S0.x, fy, W, S0.y + H - fy);
  ctx.strokeStyle = 'rgba(232,184,74,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 1; i < 5; i++) { const y = fy + (S0.y + H - fy) * i / 5; ctx.moveTo(S0.x, y); ctx.lineTo(S0.x + W, y); } ctx.stroke();
  // brass tray with tulip tea glasses and steam
  const tx = S0.x + W * 0.5, ty = S0.y + H * 0.93, tr = Math.min(W * 0.13, H * 0.07);
  ctx.fillStyle = vgrad(ctx, ty - tr * 0.3, ty + tr * 0.3, [[0, '#ffe08a'], [1, '#9a6a1a']]); ctx.beginPath(); ctx.ellipse(tx, ty, tr, tr * 0.28, 0, 0, TAU); ctx.fill();
  for (let i = -1; i <= 1; i++) {
    const gx = tx + i * tr * 0.55, gy = ty - tr * 0.1;
    ctx.fillStyle = 'rgba(255,240,210,0.35)'; ctx.beginPath(); ctx.moveTo(gx - tr * 0.17, gy - tr * 0.6); ctx.quadraticCurveTo(gx - tr * 0.27, gy - tr * 0.2, gx - tr * 0.1, gy); ctx.lineTo(gx + tr * 0.1, gy); ctx.quadraticCurveTo(gx + tr * 0.27, gy - tr * 0.2, gx + tr * 0.17, gy - tr * 0.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#a8260e'; ctx.beginPath(); ctx.moveTo(gx - tr * 0.2, gy - tr * 0.4); ctx.lineTo(gx + tr * 0.2, gy - tr * 0.4); ctx.lineTo(gx + tr * 0.12, gy); ctx.lineTo(gx - tr * 0.12, gy); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; ctx.beginPath(); const sx = gx + Math.sin(t * 1.4 + i) * 2; ctx.moveTo(sx, gy - tr * 0.65); ctx.quadraticCurveTo(sx + 5, gy - tr * 0.9, sx - 2, gy - tr * 1.1 - ((t * 8 + i * 5) % 6)); ctx.stroke();
  }
  crowd(ctx, S0, S0.y + H * 0.985, v);
  // brass lamps on chains beside the window
  kandil(ctx, S0.x + W * 0.055, S0.y + H * 0.05, Math.max(5, W * 0.016), t, 0.4);
  kandil(ctx, S0.x + W * 0.945, S0.y + H * 0.05, Math.max(5, W * 0.016), t, 2.1);
  vignette(ctx, S0, 0.34);
}

register({
  id: 'karagoz',
  look: { screen: '#fff7de', screenEdge: '#f1d594', lamp: '#fffbe8', frame: '#5a3216', curtain: '#1c58ac' },
  stage,
  puppet,
  skin: {
    card: { top: '#1a4a96', bot: '#0a2252', edge: '#e8b84a', inner: 'rgba(140,230,230,0.35)', ink: '#fffbea', dim: '#b8e4ee', accent: '#ffd25a', shape: 'ogee', r: 16, pattern: 'tile', patCol: '#8fe6e6', patA: 0.065 },
    name: { fill: '#0e6f78', fillEnd: '#f0b030', ink: '#fffdf0', edge: 'rgba(255,215,120,0.8)', shape: 'round' },
    plaque: { base: '#14407e', hot: '#1a7f96', end: '#f0b030', ink: '#fffbea', inkEnd: '#1b1206', edge: '#e8b84a', inner: 'rgba(140,230,230,0.5)', shape: 'ogee', r: 14, pattern: 'tile', patCol: '#8fe6e6', patA: 0.06, med: 'star', medA: '#fff3b8', medB: '#e8a02a', medInk: '#06224a', medEdge: '#6a4208' },
    meter: { fill: '#0b2a52', edge: 'rgba(140,230,230,0.3)', bead: 'drop', col: '#ffcb47', ink: '#fffbea' },
    trans: 'iris', transCol: '#06162e',
    snd: { root: 293, scale: [1, 1.067, 1.26, 1.333, 1.5], hit: 'pluck', voiceWave: 'triangle', voiceVol: 0.03 },
    voice: 4,
  },
});
export default null;

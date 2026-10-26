// Drawing for the pizza mode of bake (1.26.0): the pizza itself cell by cell (dough, sauce, cheese, leaves, spots), the marble counter with its bowls,
// the inside of the wood-fired dome with the fire and the floor, the peel, the dock and the order picture.
import { hash } from './geom.js';
import { shadowed, rrect, rgba, mix, tint } from './fx.js';
import { hintPill } from './paint-ui.js';
import { fsz, clamp, lerp, sm, lin, rad, TAU } from './kc-fire-lib.js';
import { flame } from './bake-art.js';

const BAKE = [[0, '#f0e3c2'], [0.28, '#e8cf96'], [0.5, '#dba95a'], [0.7, '#c38a40'], [0.95, '#8a4c1e'], [1.2, '#3a2012']];
const bakeColor = (d) => { const k = clamp(d, 0, 1.2); for (let i = 1; i < BAKE.length; i++) if (k <= BAKE[i][0]) { const [a, ca] = BAKE[i - 1], [b, cb] = BAKE[i]; return mix(ca, cb, (k - a) / (b - a)); } return BAKE[BAKE.length - 1][1]; };
const blob = (ctx, r, seed, n = 7) => { ctx.beginPath(); for (let q = 0; q <= n; q++) { const an = (q / n) * TAU, rr = r * (0.78 + 0.34 * hash(q % n, seed, 3)); const x = Math.cos(an) * rr, y = Math.sin(an) * rr * 0.9; if (q) ctx.quadraticCurveTo(Math.cos(an - 0.45) * rr * 1.08, Math.sin(an - 0.45) * rr * 1.0, x, y); else ctx.moveTo(x, y); } ctx.closePath(); };

// ---- the pizza -------------------------------------------------------------------------------------------------------------------------------------
export function drawPizza(ctx, cx, cy, R, ysc, V, o = {}) {
  const { S, R: NR, RIM, th, hole, sauce, herb, pieces, d, ringRho, cellPhi } = V, rot = o.rot ?? 0, grow = o.grow ?? 1, rd = R * grow;
  const showSauce = o.sauce ?? true, baked = o.baked ?? true, sc = rd / 150;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(1, ysc);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(rd * 0.03, rd * 0.07, rd * 1.03, rd * 1.03, 0, 0, TAU); ctx.fill();
  ctx.rotate(rot);
  const r0 = (r) => (r / NR) * rd, r1 = (r) => ((r + 1) / NR) * rd;
  // the dough cells: pale where raw, golden to brown with the heat, red under sauce. Values are smoothed over the neighbours and each cell is filled with a
  // gradient from its inner to its outer neighbour so the painting reads as one surface, not as tiles.
  const sm3 = (arr) => { const out = new Array(NR * S); for (let r = 0; r < NR; r++) for (let s2 = 0; s2 < S; s2++) { const k = r * S + s2, l = r * S + ((s2 + S - 1) % S), rr = r * S + ((s2 + 1) % S), i0 = r > 0 ? (r - 1) * S + s2 : k, o0 = r < NR - 1 ? (r + 1) * S + s2 : k; out[k] = 0.4 * arr[k] + 0.15 * (arr[l] + arr[rr]) + 0.15 * (arr[i0] + arr[o0]); } return out; };
  const sD = sm3(baked ? d : d.map(() => 0)), sS = sm3(sauce), sT = sm3(th);
  const cellCol = (k) => {
    const r = Math.floor(k / S), dk = sD[k];
    let col = r === RIM ? mix('#f6ead0', '#eddcb8', hash(k, 5) * 0.5) : mix('#d6c6a0', '#fbf3df', clamp((sT[k] - 0.25) / 0.85, 0, 1));
    col = mix(col, bakeColor(dk), clamp(dk / 0.22, 0, 1));
    if (showSauce && sS[k] > 0.02 && (r < RIM || sauce[k] > 0.3)) col = mix(col, mix('#c63e26', '#7a2210', clamp(dk * 0.8, 0, 0.7)), clamp(sS[k] * 1.25, 0, 1));
    return hole[k] ? '#4a3426' : col;
  };
  for (let r = 0; r < NR; r++) for (let s2 = 0; s2 < S; s2++) {
    const k = r * S + s2, a0 = (s2 / S) * TAU - 0.012, a1 = ((s2 + 1) / S) * TAU + 0.012, c = cellCol(k), ci = r > 0 ? cellCol(k - S) : c, co = r < NR - 1 ? cellCol(k + S) : c;
    const g0 = rad(ctx, 0, 0, Math.max(0.1, r0(r)), r1(r), [[0, mix(c, ci, hole[k] ? 0 : 0.5)], [1, mix(c, co, hole[k] ? 0 : 0.5)]]);
    ctx.fillStyle = g0; ctx.beginPath(); ctx.arc(0, 0, r1(r) + 0.4, a0, a1); ctx.arc(0, 0, Math.max(0, r0(r) - 0.4), a1, a0, true); ctx.closePath(); ctx.fill();
  }
  // the puffy rim: a ridge that is shadowed on its inner edge, lit along the top and darker at the outer edge; the light stays upper left as the pizza turns
  const rimIn = r0(RIM), rimMid = (rimIn + rd) / 2;
  ctx.fillStyle = rad(ctx, 0, 0, rimIn, rd, [[0, 'rgba(70,34,10,0.42)'], [0.3, 'rgba(255,248,230,0)'], [0.55, 'rgba(255,250,235,0.34)'], [0.8, 'rgba(255,250,235,0)'], [1, 'rgba(50,25,8,0.4)']]); ctx.beginPath(); ctx.arc(0, 0, rd, 0, TAU); ctx.arc(0, 0, rimIn, TAU, 0, true); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.rotate(-rot);
  ctx.strokeStyle = 'rgba(255,250,232,0.5)'; ctx.lineWidth = Math.max(2, (rd - rimIn) * 0.2); ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, rimMid - (rd - rimIn) * 0.1, Math.PI * 1.05, Math.PI * 1.8); ctx.stroke();
  ctx.strokeStyle = 'rgba(40,20,6,0.32)'; ctx.lineWidth = Math.max(2, (rd - rimIn) * 0.22); ctx.beginPath(); ctx.arc(0, 0, rimMid + (rd - rimIn) * 0.14, Math.PI * 0.05, Math.PI * 0.8); ctx.stroke();
  ctx.fillStyle = rad(ctx, -rd * 0.3, -rd * 0.35, rd * 0.1, rd * 1.2, [[0, 'rgba(255,250,235,0.18)'], [0.7, 'rgba(255,250,235,0)'], [1, 'rgba(40,20,6,0.16)']]); ctx.beginPath(); ctx.arc(0, 0, rd, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(70,36,10,0.4)'; ctx.lineWidth = Math.max(1.2, rd * 0.014); ctx.beginPath(); ctx.arc(0, 0, rimIn, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(60,30,10,0.55)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, 0, rd, 0, TAU); ctx.stroke();
  for (let k = 0; k < 40; k++) { const an = hash(k, 61) * TAU, rr = rimIn + (rd - rimIn) * (0.2 + 0.7 * hash(k, 62)); ctx.fillStyle = `rgba(255,255,255,${0.12 + 0.2 * hash(k, 63)})`; ctx.fillRect(Math.cos(an) * rr, Math.sin(an) * rr, 1.5 * sc + 0.5, 1.2 * sc + 0.4); }   // flour on the rim
  // dough life: tiny bubbles and flour streaks in the middle, blisters on the rim that scorch with the heat
  for (let k = 0; k < 46; k++) { const an = hash(k, 81) * TAU, rr = Math.sqrt(hash(k, 82)) * rimIn * 0.92, bk0 = clamp((o.bakeAmt ?? 0), 0, 1); ctx.strokeStyle = `rgba(255,248,230,${0.18 + 0.2 * hash(k, 83)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(Math.cos(an) * rr, Math.sin(an) * rr, (1.5 + hash(k, 84) * 3.2) * sc + 0.6, (1.1 + hash(k, 84) * 2.2) * sc + 0.4, an, 0, TAU); ctx.stroke(); if (bk0 > 0.25 && hash(k, 85) > 0.5) { ctx.fillStyle = `rgba(120,60,20,${0.18 * bk0})`; ctx.beginPath(); ctx.arc(Math.cos(an) * rr, Math.sin(an) * rr, (1 + hash(k, 86) * 2) * sc + 0.5, 0, TAU); ctx.fill(); } }
  for (let k = 0; k < 20; k++) { const an = hash(k, 87) * TAU, rr = rimMid + (hash(k, 88) - 0.5) * (rd - rimIn) * 0.5, br = (2.5 + hash(k, 89) * 4) * sc + 1, bk1 = clamp(((o.bakeAmt ?? 0) - 0.15) * 1.6, 0, 1); ctx.fillStyle = `rgba(255,236,190,${0.25 + 0.3 * hash(k, 90)})`; ctx.beginPath(); ctx.ellipse(Math.cos(an) * rr, Math.sin(an) * rr, br, br * 0.8, an, 0, TAU); ctx.fill(); if (bk1 > 0.05) { ctx.fillStyle = `rgba(52,22,8,${0.5 * bk1})`; ctx.beginPath(); ctx.ellipse(Math.cos(an) * rr, Math.sin(an) * rr, br * 0.7, br * 0.5, an, 0, TAU); ctx.fill(); } }
  // sauce shine
  if (showSauce) for (let k = 0; k < NC(S, NR); k++) { const r = Math.floor(k / S), s = k % S; if (r >= RIM || sauce[k] < 0.5 || hash(k, 8) < 0.55) continue; const ph = cellPhi(s) + (hash(k, 9) - 0.5) * 0.2, rr = ringRho(r) * rd * (0.96 + 0.08 * hash(k, 10)); ctx.fillStyle = `rgba(255,220,200,${0.18 + 0.2 * hash(k, 11)})`; ctx.beginPath(); ctx.ellipse(Math.cos(ph) * rr, Math.sin(ph) * rr, 2.5 * sc + 1, 1.3 * sc + 0.6, ph, 0, TAU); ctx.fill(); }
  // oregano flecks
  for (let k = 0; k < NC(S, NR); k++) { const r = Math.floor(k / S), s = k % S; if (r >= RIM || herb[k] < 0.25) continue; const n = Math.round(herb[k] * 5); for (let q = 0; q < n; q++) { const ph = cellPhi(s) + (hash(k, q, 12) - 0.5) * (TAU / S), rr = (ringRho(r) + (hash(k, q, 13) - 0.5) / NR) * rd; ctx.fillStyle = hash(k, q, 14) > 0.5 ? '#5c7a2c' : '#7a9a3a'; ctx.fillRect(Math.cos(ph) * rr, Math.sin(ph) * rr, 2 * sc + 1, 1.4 * sc + 0.8); } }
  // the pieces: cheese melts and spreads, leaves darken, garlic goes golden
  const meanD = V.meanD ?? 0;
  for (const q of pieces) {
    const x = Math.cos(q.phi) * q.rho * rd, y = Math.sin(q.phi) * q.rho * rd, bk = baked ? clamp(meanD, 0, 1.2) : 0;
    ctx.save(); ctx.translate(x, y); ctx.rotate(q.rot);
    if (q.kind === 'cheese') {
      const rr = rd * 0.105 * q.size * (1 + 0.5 * clamp(bk / 0.4, 0, 1));
      ctx.fillStyle = 'rgba(60,20,8,0.3)'; blob(ctx, rr * 1.04, Math.round(q.rot * 9)); ctx.save(); ctx.translate(rr * 0.08, rr * 0.14); ctx.fill(); ctx.restore();
      ctx.fillStyle = mix('#fbf6e6', '#f0cf88', clamp((bk - 0.15) / 0.5, 0, 1)); blob(ctx, rr, Math.round(q.rot * 9)); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(-rr * 0.25, -rr * 0.3, rr * 0.3, rr * 0.15, -0.4, 0, TAU); ctx.fill();
      if (bk > 0.4) { ctx.fillStyle = `rgba(150,80,24,${clamp((bk - 0.4) * 1.4, 0, 0.55)})`; for (let n = 0; n < 3; n++) { ctx.beginPath(); ctx.ellipse((hash(n, 3) - 0.5) * rr * 1.1, (hash(n, 4) - 0.5) * rr * 0.9, rr * 0.14, rr * 0.1, 0, 0, TAU); ctx.fill(); } }
    } else if (q.kind === 'basil') {
      const L = rd * 0.15 * q.size, dark = clamp(bk * 1.1, 0, 0.8);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(L * 0.06, L * 0.1, L * 0.5, L * 0.85, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = lin(ctx, -L * 0.5, 0, L * 0.5, 0, [[0, mix('#5aa63a', '#1a2a0e', dark)], [1, mix('#2f7a22', '#0e1a08', dark)]]); ctx.beginPath(); ctx.moveTo(0, -L); ctx.bezierCurveTo(L * 0.7, -L * 0.5, L * 0.6, L * 0.5, 0, L * 0.9); ctx.bezierCurveTo(-L * 0.6, L * 0.5, -L * 0.7, -L * 0.5, 0, -L); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = `rgba(200,240,170,${0.7 - dark * 0.5})`; ctx.lineWidth = Math.max(1, L * 0.06); ctx.beginPath(); ctx.moveTo(0, -L * 0.9); ctx.lineTo(0, L * 0.8); ctx.stroke();
      ctx.lineWidth = Math.max(0.8, L * 0.04); for (const sd of [-1, 1]) for (let n = 0; n < 3; n++) { ctx.beginPath(); ctx.moveTo(0, -L * 0.5 + n * L * 0.4); ctx.lineTo(sd * L * 0.35, -L * 0.3 + n * L * 0.38); ctx.stroke(); }
    } else if (q.kind === 'garlic') {
      const rr = rd * 0.06 * q.size; ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(rr * 0.1, rr * 0.18, rr, rr * 0.8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = mix('#f7f0d6', '#d8a850', clamp(bk * 1.1, 0, 1)); ctx.beginPath(); ctx.ellipse(0, 0, rr, rr * 0.78, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = mix('#e8dcaa', '#a8742a', clamp(bk, 0, 1)); ctx.lineWidth = Math.max(1, rr * 0.18); ctx.beginPath(); ctx.ellipse(0, 0, rr * 0.7, rr * 0.5, 0, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }
  // leopard spots: the char of a very hot oven, first on the rim
  const nSp = Math.round(clamp((meanD - 0.22) / 0.45, 0, 1) * 70);
  if (baked && nSp > 0) for (let q = 0; q < nSp; q++) {
    const ph = hash(q, 51) * TAU, k = Math.floor(ph / TAU * S) + RIM * S, rr = rimMid + (hash(q, 52) - 0.5) * (rd - rimIn) * 0.7, dd = clamp(d[k] ?? meanD, 0, 1.2), sz = (1.6 + hash(q, 53) * 4.2) * sc * (0.6 + dd);
    if (hash(q, 54) > clamp((dd - 0.22) * 2.5, 0, 1)) continue;
    ctx.fillStyle = `rgba(48,22,8,${0.55 + 0.4 * hash(q, 55)})`; ctx.beginPath(); ctx.ellipse(Math.cos(ph) * rr, Math.sin(ph) * rr, sz, sz * 0.75, ph, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
const NC = (S, R) => S * R;


// two fingertips pressing, seen from above: skin, a nail, a soft shadow
function drawFingers(ctx, x, y, s, press) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.5);
  for (const dx of [-0.55, 0.55]) {
    const fx = dx * s, w = s * 0.9, L = s * 3.2;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; rrect(ctx, fx - w / 2 + 3, 5, w, L, w / 2); ctx.fill();
    ctx.fillStyle = lin(ctx, fx - w / 2, 0, fx + w / 2, 0, [[0, '#f0c4a0'], [0.45, '#dc9f78'], [1, '#a8704c']]); rrect(ctx, fx - w / 2, 0, w, L, w / 2); ctx.fill(); ctx.strokeStyle = 'rgba(90,50,30,0.5)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(250,226,214,0.95)'; rrect(ctx, fx - w * 0.3, s * 0.1, w * 0.6, s * 0.7, s * 0.2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(fx - w * 0.2, s * 0.14, w * 0.1, s * 0.4);
  }
  if (press) { ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, s * 1.6, 0, TAU); ctx.stroke(); }
  ctx.restore();
}
function drawLadle(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.6);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(4, 7, s * 1.3, s * 0.9, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#7a5a34'; ctx.lineWidth = s * 0.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * 1.0, -s * 0.2); ctx.lineTo(s * 6, -s * 3.4); ctx.stroke();
  ctx.fillStyle = lin(ctx, -s, -s, s, s, [[0, '#f0b080'], [0.5, '#c07a44'], [1, '#6a3a1a']]); ctx.beginPath(); ctx.ellipse(0, 0, s * 1.3, s * 0.95, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#c4301c'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.95, s * 0.66, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,230,210,0.5)'; ctx.beginPath(); ctx.ellipse(-s * 0.3, -s * 0.2, s * 0.35, s * 0.15, 0, 0, TAU); ctx.fill();
  ctx.restore();
}

// ---- the counter (stretch and dress) ----------------------------------------------------------------------------------------------------------------
function drawBowl(ctx, x, y, r, kind, active, t) {
  ctx.save(); ctx.translate(x, y);
  if (active) { ctx.fillStyle = `rgba(255,236,150,${0.2 + 0.1 * Math.sin(t * 5)})`; ctx.beginPath(); ctx.ellipse(0, r * 0.2, r * 1.5, r * 0.9, 0, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(2, r * 0.55, r * 1.05, r * 0.4, 0, 0, TAU); ctx.fill();
  if (kind === 'sauce') { // a copper pan of tomato sauce with a ladle
    ctx.fillStyle = lin(ctx, -r, 0, r, 0, [[0, '#8a4a22'], [0.35, '#e0905a'], [1, '#6a3414']]); ctx.beginPath(); ctx.moveTo(-r, -r * 0.1); ctx.quadraticCurveTo(-r * 0.9, r * 0.55, 0, r * 0.56); ctx.quadraticCurveTo(r * 0.9, r * 0.55, r, -r * 0.1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#b8722e'; ctx.beginPath(); ctx.ellipse(0, -r * 0.1, r, r * 0.3, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#c4301c'; ctx.beginPath(); ctx.ellipse(0, -r * 0.1, r * 0.86, r * 0.23, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,220,200,0.5)'; ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.16, r * 0.25, r * 0.06, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = r * 0.13; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(r * 0.2, -r * 0.1); ctx.lineTo(r * 1.3, -r * 0.85); ctx.stroke();
  } else {
    ctx.fillStyle = lin(ctx, -r, 0, r, 0, [[0, '#cdd3da'], [0.35, '#f8fafb'], [1, '#8f98a2']]); ctx.beginPath(); ctx.moveTo(-r, -r * 0.1); ctx.quadraticCurveTo(-r * 0.9, r * 0.55, 0, r * 0.56); ctx.quadraticCurveTo(r * 0.9, r * 0.55, r, -r * 0.1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e4e8ec'; ctx.beginPath(); ctx.ellipse(0, -r * 0.1, r, r * 0.3, 0, 0, TAU); ctx.fill();
    if (kind === 'cheese') { for (let k = 0; k < 7; k++) { ctx.fillStyle = '#fcf7e8'; ctx.beginPath(); ctx.ellipse((hash(k, 1) - 0.5) * r * 1.4, -r * 0.14 + (hash(k, 2) - 0.5) * r * 0.2, r * 0.26, r * 0.15, hash(k, 3), 0, TAU); ctx.fill(); } }
    else if (kind === 'basil') { for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#3f8a2e' : '#58a63a'; ctx.beginPath(); ctx.ellipse((hash(k, 1) - 0.5) * r * 1.3, -r * 0.2 - hash(k, 2) * r * 0.25, r * 0.2, r * 0.32, (hash(k, 3) - 0.5) * 1.6, 0, TAU); ctx.fill(); } }
    else if (kind === 'garlic') { for (let k = 0; k < 6; k++) { ctx.fillStyle = '#f7f0d6'; ctx.beginPath(); ctx.ellipse((hash(k, 1) - 0.5) * r * 1.3, -r * 0.14 + (hash(k, 2) - 0.5) * r * 0.2, r * 0.16, r * 0.11, hash(k, 3), 0, TAU); ctx.fill(); } }
    else if (kind === 'oregano') { ctx.fillStyle = '#6a8a30'; for (let k = 0; k < 30; k++) ctx.fillRect((hash(k, 1) - 0.5) * r * 1.5, -r * 0.18 + (hash(k, 2) - 0.5) * r * 0.2, 2, 1.5); }
  }
  ctx.restore();
}

function drawCounter(ctx, G, V) {
  const { W0, disc } = G, st = V.stage, y0 = W0.y + W0.h - 28;
  // the ingredient bowls along the bottom edge: the one in use glows
  const order = ['sauce', ...(V.layers.slice(1))], r = Math.min(22, W0.w * 0.045);
  order.forEach((k, i) => drawBowl(ctx, W0.x + W0.w * (0.12 + i * 0.14), y0, r, k, st === k, V.now));
  // a flour dusting of the marble and the disc
  for (let k = 0; k < 16; k++) { const an = hash(k, 91) * TAU, rr = disc.R * (0.9 + 0.55 * hash(k, 92)), fx = disc.x + Math.cos(an) * rr, fy = disc.y + Math.sin(an) * rr * 0.95, fr = disc.R * (0.14 + 0.2 * hash(k, 93)); ctx.fillStyle = rad(ctx, fx, fy, 0, fr, [[0, `rgba(255,252,244,${0.22 + 0.18 * hash(k, 94)})`], [1, 'rgba(255,252,244,0)']]); ctx.fillRect(fx - fr, fy - fr, fr * 2, fr * 2); }
  for (let k = 0; k < 90; k++) { const an = hash(k, 95) * TAU, rr = disc.R * (0.95 + 0.6 * hash(k, 96)); ctx.fillStyle = `rgba(255,255,250,${0.25 + 0.4 * hash(k, 97)})`; ctx.fillRect(disc.x + Math.cos(an) * rr, disc.y + Math.sin(an) * rr, 1.6, 1.6); }
  const grow = st === 'stretch' ? 0.8 + 0.2 * clamp((1.05 - V.interior.m) / 0.7, 0, 1) : 1;
  drawPizza(ctx, disc.x, disc.y, disc.R, 1, V, { grow, sauce: st !== 'stretch', baked: false, rot: 0 });
  if (V.ptr) { const sz = Math.max(8, disc.R * 0.075); if (st === 'sauce') drawLadle(ctx, V.ptr.x, V.ptr.y, sz); else if (st === 'stretch' || st === 'oregano') drawFingers(ctx, V.ptr.x, V.ptr.y, sz, true); else drawFingers(ctx, V.ptr.x, V.ptr.y, sz, false); }
  // the guide: a dashed ring where the rim begins; the sauce stops at it
  if (st !== 'stretch') { ctx.save(); ctx.setLineDash([5, 6]); ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(disc.x, disc.y, disc.R * 0.857 * grow, 0, TAU); ctx.stroke(); ctx.restore(); }
  else { ctx.save(); ctx.strokeStyle = `rgba(150,240,255,${0.4 + 0.2 * Math.sin(V.now * 3)})`; ctx.fillStyle = 'rgba(150,240,255,0.5)'; ctx.lineWidth = 2; ctx.setLineDash([5, 6]); for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + 0.3, r0 = disc.R * 0.15, r1 = disc.R * 0.62; ctx.beginPath(); ctx.moveTo(disc.x + Math.cos(a) * r0, disc.y + Math.sin(a) * r0); ctx.lineTo(disc.x + Math.cos(a) * r1, disc.y + Math.sin(a) * r1); ctx.stroke(); } ctx.setLineDash([]); ctx.restore(); }
}

// ---- the oven (launch and bake) ---------------------------------------------------------------------------------------------------------------------
function drawDome(ctx, G, V) {
  const { W0, oven } = G, t = V.now, fl = 0.8 + 0.2 * Math.sin(t * 9.1) * Math.sin(t * 5.3);
  ctx.save(); ctx.beginPath(); ctx.rect(W0.x, W0.y, W0.w, W0.h); ctx.clip();
  // the dome: brick courses curving over the floor, dark at the top, warm toward the fire
  ctx.fillStyle = lin(ctx, 0, W0.y, 0, W0.y + W0.h, [[0, '#120a06'], [0.45, '#34201a'], [1, '#5a3626']]); ctx.fillRect(W0.x, W0.y, W0.w, W0.h);
  const cxm = oven.x, cyb = oven.y - oven.ry * 0.2, rows = 8;
  const arc = (k) => ({ rx: oven.rx * (0.34 + k * 0.17), ry: (cyb - W0.y) * (0.2 + k * 0.125) });
  for (let k = 1; k <= rows; k++) {
    const a0 = arc(k - 1), a1 = arc(k), n = 6 + k * 3;
    ctx.strokeStyle = 'rgba(10,5,3,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cxm, cyb, a1.rx, a1.ry, 0, Math.PI, TAU); ctx.stroke();
    for (let q = 0; q < n; q++) { const th = Math.PI + ((q + (k % 2) * 0.5) / n) * Math.PI, c = Math.cos(th), s2 = Math.sin(th); ctx.beginPath(); ctx.moveTo(cxm + c * a0.rx, cyb + s2 * a0.ry); ctx.lineTo(cxm + c * a1.rx, cyb + s2 * a1.ry); ctx.stroke(); const bt = hash(k, q, 7); if (bt > 0.6) { const m = 0.5 + 0.1 * bt; ctx.fillStyle = `rgba(${bt > 0.8 ? '255,190,140' : '8,4,2'},0.1)`; ctx.beginPath(); ctx.ellipse(cxm + c * (a0.rx + (a1.rx - a0.rx) * m), cyb + s2 * (a0.ry + (a1.ry - a0.ry) * m), 12, 6, 0, 0, TAU); ctx.fill(); } }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.beginPath(); ctx.ellipse(cxm, W0.y + 8, oven.rx * 0.16, 10, 0, 0, TAU); ctx.fill();   // the flue at the top
  // the glow of the fire on the dome
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const fx0 = G.ovenX(V.FIRE.fx), fy0 = G.ovenY(V.FIRE.fd); ctx.fillStyle = rad(ctx, fx0, fy0 - 30, 6, oven.rx * 1.5, [[0, `rgba(255,150,60,${0.55 * fl})`], [0.5, `rgba(255,100,30,${0.16 * fl})`], [1, 'rgba(255,100,30,0)']]); ctx.fillRect(W0.x, W0.y, W0.w, W0.h); ctx.restore();
  // the floor: firebrick tiles, heat shown as a glow that follows the fire
  ctx.save(); ctx.beginPath(); ctx.ellipse(oven.x, oven.y, oven.rx, oven.ry, 0, 0, TAU); ctx.clip();
  ctx.fillStyle = lin(ctx, 0, oven.y - oven.ry, 0, oven.y + oven.ry, [[0, '#6a3a26'], [1, '#8a5a40']]); ctx.fillRect(oven.x - oven.rx, oven.y - oven.ry, oven.rx * 2, oven.ry * 2);
  ctx.strokeStyle = 'rgba(30,14,8,0.5)'; ctx.lineWidth = 1.5; for (let k = -6; k <= 6; k++) { ctx.beginPath(); ctx.moveTo(oven.x + k * oven.rx * 0.18, oven.y - oven.ry); ctx.lineTo(oven.x + k * oven.rx * 0.3, oven.y + oven.ry); ctx.stroke(); } for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(oven.x - oven.rx, oven.y + k * oven.ry * 0.3); ctx.lineTo(oven.x + oven.rx, oven.y + k * oven.ry * 0.3); ctx.stroke(); }
  ctx.globalCompositeOperation = 'lighter';
  for (let i = -9; i <= 9; i++) for (let j = 0; j <= 9; j++) { const fx = i / 10, fd = 0.05 + j * 0.1, H = V.floorHeat(fx, fd), px = G.ovenX(fx), py = G.ovenY(fd), k = clamp((H - 0.45) / 1.1, 0, 1.2); ctx.fillStyle = rad(ctx, px, py, 0, oven.rx * 0.16, [[0, `rgba(255,${Math.round(110 + 70 * k)},40,${0.3 * k * fl})`], [1, 'rgba(255,110,30,0)']]); ctx.fillRect(px - oven.rx * 0.16, py - oven.rx * 0.16, oven.rx * 0.32, oven.rx * 0.32); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(20,8,4,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(oven.x, oven.y, oven.rx, oven.ry, 0, 0, TAU); ctx.stroke();
  // the fire by the left wall: a bed of embers, three thick split logs with glowing cracks, flames licking the dome
  ctx.fillStyle = rad(ctx, fx0, fy0 + 6, 2, oven.rx * 0.34, [[0, 'rgba(255,200,90,0.95)'], [0.4, 'rgba(240,110,30,0.8)'], [1, 'rgba(120,30,10,0)']]); ctx.beginPath(); ctx.ellipse(fx0, fy0 + 6, oven.rx * 0.34, oven.ry * 0.5, 0, 0, TAU); ctx.fill();
  for (const [dx, dy, an, ln] of [[-0.08, 0.1, -0.32, 0.36], [0.1, 0.0, 0.42, 0.34], [-0.01, -0.12, 0.08, 0.32]]) { ctx.save(); ctx.translate(fx0 + dx * oven.rx, fy0 + dy * oven.ry * 2.2); ctx.rotate(an); const L = oven.rx * ln, Wd = Math.max(11, oven.rx * 0.05); ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, -L / 2 + 2, -Wd / 2 + 5, L, Wd, Wd / 2); ctx.fill(); ctx.fillStyle = lin(ctx, 0, -Wd / 2, 0, Wd / 2, [[0, '#7a4a28'], [0.5, '#3a2010'], [1, '#150a04']]); rrect(ctx, -L / 2, -Wd / 2, L, Wd, Wd / 2); ctx.fill(); ctx.strokeStyle = `rgba(255,${Math.round(120 + 90 * fl)},30,0.85)`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-L * 0.4, -Wd * 0.05); ctx.lineTo(-L * 0.1, Wd * 0.12); ctx.lineTo(L * 0.2, -Wd * 0.1); ctx.lineTo(L * 0.42, Wd * 0.05); ctx.stroke(); ctx.fillStyle = 'rgba(255,150,50,0.35)'; ctx.fillRect(-L * 0.45, -Wd * 0.2, L * 0.9, Wd * 0.4); ctx.restore(); }
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 14; k++) flame(ctx, fx0 + (k - 6.5) * oven.rx * 0.04 + Math.sin(k * 2.3) * 8, fy0 + 14 - (k % 4) * 5, oven.rx * (0.06 + 0.03 * (k % 3)), oven.ry * (0.55 + 0.25 * Math.sin(t * 5.3 + k * 1.7) + 0.22 * (k % 3)), t, k);
  ctx.fillStyle = rad(ctx, fx0, fy0 - oven.ry * 0.6, 4, oven.rx * 0.5, [[0, 'rgba(255,210,120,0.35)'], [1, 'rgba(255,120,30,0)']]); ctx.fillRect(fx0 - oven.rx * 0.5, fy0 - oven.rx * 0.5 - oven.ry * 0.6, oven.rx, oven.rx); ctx.restore();
  // heat haze over the fire, and the stucco arch of the mouth framing the view
  ctx.strokeStyle = 'rgba(255,220,170,0.1)'; ctx.lineWidth = 3; for (let k = 0; k < 5; k++) { ctx.beginPath(); for (let q = 0; q <= 8; q++) { const px2 = fx0 + (k - 2) * 22 + Math.sin(t * 3 + q + k) * (3 + q), py2 = fy0 - oven.ry * 0.9 - q * 16; if (q) ctx.lineTo(px2, py2); else ctx.moveTo(px2, py2); } ctx.stroke(); }
  for (const sd of [-1, 1]) { const ex = sd < 0 ? W0.x : W0.x + W0.w; ctx.fillStyle = lin(ctx, ex, 0, ex - sd * oven.rx * 0.2, 0, [[0, '#d8c8a8'], [0.6, '#a89674'], [1, 'rgba(60,44,28,0)']]); ctx.beginPath(); ctx.moveTo(ex, W0.y); ctx.lineTo(ex - sd * oven.rx * 0.16, W0.y); ctx.quadraticCurveTo(ex - sd * oven.rx * 0.07, W0.y + W0.h * 0.35, ex - sd * oven.rx * 0.2, oven.y + oven.ry * 1.05); ctx.lineTo(ex, oven.y + oven.ry * 1.05); ctx.closePath(); ctx.fill(); }
  // the marble landing at the mouth
  ctx.fillStyle = lin(ctx, 0, oven.y + oven.ry * 1.05, 0, W0.y + W0.h, [[0, '#cfc8c0'], [1, '#e8e4de']]); ctx.fillRect(W0.x, oven.y + oven.ry * 1.05, W0.w, W0.h);
  ctx.strokeStyle = 'rgba(120,112,104,0.35)'; ctx.lineWidth = 1.5; for (let k = 0; k < 7; k++) { const x = W0.x + hash(k, 41) * W0.w, y = oven.y + oven.ry * 1.05 + hash(k, 42) * (W0.h * 0.2); ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 30, y + 12, x + 60, y - 8, x + 90 + hash(k, 43) * 40, y + 6); ctx.stroke(); }
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fillRect(W0.x, oven.y + oven.ry * 1.05, W0.w, 5);
  ctx.restore();
}

function drawPeel(ctx, x, y, R, handleTo) {
  ctx.save();
  const hw = R * 0.12; ctx.fillStyle = lin(ctx, x - hw, 0, x + hw, 0, [[0, '#d8b078'], [0.5, '#b88a52'], [1, '#7a5430']]); rrect(ctx, x - hw, y + R * 0.4, hw * 2, handleTo - y - R * 0.4, hw * 0.5); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 6, R * 1.12, R * 0.7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = lin(ctx, x - R, y - R * 0.6, x + R, y + R * 0.6, [[0, '#e0bc84'], [0.6, '#c89a60'], [1, '#8a6238']]); ctx.beginPath(); ctx.ellipse(x, y, R * 1.12, R * 0.7, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(70,40,14,0.4)'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.restore();
}

function drawOven(ctx, G, V) {
  const { oven } = G, st = V.stage, pr = (fd) => oven.rx * 0.46 * (1 - 0.2 * fd);
  drawDome(ctx, G, V);
  if (st === 'launch') {
    // the lit patch where a whole pizza belongs, then the peel pushing in
    const o = V.optimum; ctx.save(); ctx.strokeStyle = `rgba(150,255,170,${0.35 + 0.15 * Math.sin(V.now * 3)})`; ctx.setLineDash([6, 6]); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(G.ovenX(o.fx), G.ovenY(o.fd), pr(o.fd) * 1.05, pr(o.fd) * 0.55, 0, 0, TAU); ctx.stroke(); ctx.restore();
    if (V.lp) { const depth = clamp((V.now - V.lp.t0) / 1.6, 0, 1), fd = 0.1 + depth * 0.85, px = G.ovenX(V.lp.fx), py = G.ovenY(fd), R = pr(fd); drawPeel(ctx, px, py, R, G.W0.y + G.W0.h + 20); drawPizza(ctx, px, py - 2, R, 0.55, { ...V, meanD: 0, d: V.d.map(() => 0) }, { sauce: true, baked: false }); }
    else { const R = oven.rx * 0.46, px = oven.x, py = G.W0.y + G.W0.h - R * 0.45; drawPeel(ctx, px, py, R, G.W0.y + G.W0.h + 40); drawPizza(ctx, px, py - 2, R, 0.6, { ...V, meanD: 0, d: V.d.map(() => 0) }, { sauce: true, baked: false }); }
  } else if (V.drop) {
    const R = pr(V.drop.fd), px = G.ovenX(V.drop.fx), py = G.ovenY(V.drop.fd);
    drawPizza(ctx, px, py, R, 0.58, V, { sauce: true, baked: true, rot: V.rot, bakeAmt: V.meanD });
    { const fa = V.fireAngle, mx = px + Math.cos(fa) * R * 1.14, my = py - Math.sin(fa) * R * 0.62; ctx.save(); ctx.globalAlpha = 0.9; flame(ctx, mx, my + 8, 7, 18, V.now, 3); ctx.restore(); }
    // the fire side glows
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const fa = V.fireAngle; ctx.fillStyle = rad(ctx, px + Math.cos(fa) * R * 0.9, py - Math.sin(fa) * R * 0.5, 2, R * 1.1, [[0, 'rgba(255,150,60,0.28)'], [1, 'rgba(255,120,30,0)']]); ctx.fillRect(px - R * 1.4, py - R * 1.0, R * 2.8, R * 2); ctx.restore();
  }
}

// ---- the stage, the dock, the picture ----------------------------------------------------------------------------------------------------------------
export function drawPizzaStage(g, G, V) {
  const { ctx } = g, W0 = G.W0, st = V.stage;
  ctx.save(); ctx.beginPath(); ctx.rect(W0.x, W0.y, W0.w, W0.h); ctx.clip();
  if (st === 'launch' || st === 'bake') drawOven(ctx, G, V); else drawCounter(ctx, G, V);
  V.puffs.draw(ctx);
  ctx.restore();
  hintPill(g, ctx, W0, V.hint);
}

export function drawPizzaHud(g, G, V) {
  const { ctx } = g, d = G.dock, h = d.h, midY = d.y + h * 0.5, W0 = G.W0, st = V.stage, fs = fsz(g, 14, h * 0.3);
  ctx.save();
  // left: one pip per pizza of the table
  const n = V.TOTAL, pw = Math.min(20, (W0.w * 0.3) / n), gx = W0.x + 14;
  g.label(ctx, `Table`, gx, midY - h * 0.26, fs, 'rgba(255,240,210,0.8)', 'left', '700');
  for (let k = 0; k < n; k++) { const cx = gx + pw * 0.5 + k * (pw + 6), cy = midY + 9, b = V.results[k]; ctx.fillStyle = b ? (b.score >= 85 ? '#9ad07a' : b.score >= 60 ? '#f2b84a' : '#e0603a') : 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.arc(cx, cy, pw * 0.46, 0, TAU); ctx.fill(); ctx.strokeStyle = k === V.idx ? '#fff' : 'rgba(255,255,255,0.3)'; ctx.lineWidth = k === V.idx ? 2 : 1.2; ctx.stroke(); if (b) g.label(ctx, String(b.score), cx, cy + 1, Math.max(8, pw * 0.36), '#1b1b1b', 'center', '800'); }
  // centre: a bar for what matters at this stage
  const cxm = W0.x + W0.w * 0.58, bw = Math.min(170, W0.w * 0.3);
  let label = '', val = 0, lo = 0, hi = 0, scale = 1;
  if (st === 'stretch') { label = `Middle ${(V.interior.m * 100).toFixed(0)}%   rim ${V.rim >= 0.8 ? 'ok' : 'flat'}`; val = V.interior.m; lo = V.M_GOAL - 0.06; hi = V.M_GOAL + 0.06; scale = 1.1; }
  else if (st === 'sauce') { label = `Sauce ${(V.cover.c * 100).toFixed(0)}%   rim ${V.cover.rs > 0.12 ? 'smeared' : 'clear'}`; val = V.cover.c; lo = 0.7; hi = 1; }
  else if (st === 'oregano') { label = `Oregano ${(V.herbC * 100).toFixed(0)}%`; val = V.herbC; lo = 0.4; hi = 0.8; }
  else if (V.MAXP[st]) { const c = V.placed(st).length; label = `${V.LAYER_TEXT[st]} ${c} of about ${V.WANT[st]}`; val = c / V.MAXP[st]; lo = (V.WANT[st] - 2) / V.MAXP[st]; hi = (V.WANT[st] + 2) / V.MAXP[st]; }
  else if (st === 'launch') { label = 'Hot, not at the fire'; val = V.lp ? clamp((V.now - V.lp.t0) / 1.6, 0, 1) : 0; lo = 0.4; hi = 0.7; }
  else { label = `Colour ${(V.meanD * 100).toFixed(0)}%   sides ${V.sdD < 0.07 ? 'even' : 'uneven'}`; val = V.meanD; lo = V.D_GOOD - 0.07; hi = V.D_GOOD + 0.07; scale = 1.15; }
  g.label(ctx, label, cxm, midY - h * 0.26, fs, 'rgba(255,240,210,0.9)', 'center', '700');
  rrect(ctx, cxm - bw / 2, midY + 2, bw, 10, 5); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill();
  const sx = (m) => cxm - bw / 2 + clamp(m / scale, 0, 1) * bw;
  rrect(ctx, sx(lo), midY + 2, Math.max(4, sx(hi) - sx(lo)), 10, 4); ctx.fillStyle = 'rgba(126,224,138,0.85)'; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx(val), midY + 14); ctx.lineTo(sx(val) - 5, midY + 22); ctx.lineTo(sx(val) + 5, midY + 22); ctx.closePath(); ctx.fill(); ctx.stroke();
  // right: the kind of pizza and the turns
  const fx0 = W0.x + W0.w - 16;
  g.label(ctx, V.NAMES[V.kind], fx0, midY - h * 0.26, fs, 'rgba(255,240,210,0.85)', 'right', '700');
  g.label(ctx, st === 'bake' ? `turns ${V.nTurns}` : { stretch: 'stretch', sauce: 'dress', cheese: 'dress', basil: 'dress', garlic: 'dress', oregano: 'dress', launch: 'oven' }[st] ?? '', fx0, midY + 9, fs, 'rgba(255,240,210,0.7)', 'right', '600');
  ctx.restore();
}

// the order: a finished pizza on a wooden board
export function drawPizzaThumb(g, th, V) {
  const { ctx } = g, cx = th.x + th.w / 2, cy = th.y + th.h * 0.52, R = Math.min(th.w, th.h) * 0.36;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(cx, cy + R * 0.2, R * 1.3, R * 0.8, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = lin(ctx, 0, cy - R, 0, cy + R, [[0, '#c89a62'], [1, '#7a4e28']]); ctx.beginPath(); ctx.ellipse(cx, cy, R * 1.28, R * 0.82, 0, 0, TAU); ctx.fill();
  const S = V.S, NRg = V.R, RIM = V.RIM, NCc = S * NRg, margh = V.kind === 'margherita';
  const th2 = new Array(NCc).fill(0).map((_, k) => (Math.floor(k / S) === RIM ? 1 : 0.32)), sau = new Array(NCc).fill(0).map((_, k) => (Math.floor(k / S) < RIM ? 0.9 : 0)), dd = new Array(NCc).fill(0).map((_, k) => 0.5 + 0.3 * hash(k, 91) + (Math.floor(k / S) === RIM ? 0.12 : 0));
  const pcs = []; for (let k = 0; k < 9; k++) pcs.push({ kind: margh ? 'cheese' : 'garlic', rho: 0.18 + 0.52 * Math.sqrt((k + 0.5) / 9), phi: k * 2.4, rot: hash(k, 7) * 6, size: 1 }); if (margh) for (let k = 0; k < 4; k++) pcs.push({ kind: 'basil', rho: 0.46, phi: k * 1.57 + 0.5, rot: k, size: 1 });
  drawPizza(ctx, cx, cy, R, 0.8, { ...V, th: th2, hole: new Array(NCc).fill(false), sauce: sau, herb: new Array(NCc).fill(0), pieces: pcs, d: dd, meanD: 0.62 }, { baked: true });
  ctx.restore();
  g.label(ctx, V.NAMES[V.kind].toLowerCase(), cx, th.y + th.h * 0.1, fsz(g, 15, th.h * 0.09), '#fff3d0', 'center', '800');
  g.label(ctx, `${V.TOTAL} pizzas`, cx, th.y + th.h * 0.92, fsz(g, 14, th.h * 0.09), 'rgba(255,240,210,0.95)', 'center', '700');
}
void shadowed; void rgba; void tint; void lerp; void sm;

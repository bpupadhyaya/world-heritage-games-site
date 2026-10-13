// Dara look: the board as the Hausa and Zarma players draw it, a 6 by 5 grid of shallow cells scratched into dry sand under an
// acacia, played with pebbles against bundles of twigs. Pure canvas 2D: no DOM, no Math.random, no clocks (time arrives as an
// argument). The shared board shell draws plain wooden boards from describe(); this module paints over that body (see
// skinRules in engine.js) so only Dara-style games change. Geometry: the board rect is the grid plus a margin of sand (side margin
// MS cells, top and bottom margin M cells that hold each player's reserve).
const TAU = Math.PI * 2;
export const MS = 0.4, M = 1.05;

const hash = (a, b = 0, c = 0) => {
  let h = (Math.imul(a + 1, 374761393) + Math.imul(b + 7, 668265263) + Math.imul(c + 13, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const rgbOf = (c) => { const n = parseInt(String(c).replace('#', '').slice(0, 6), 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const hx = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
const mix = (a, b, t) => { const A = rgbOf(a), B = rgbOf(b); return `#${hx(A[0] + (B[0] - A[0]) * t)}${hx(A[1] + (B[1] - A[1]) * t)}${hx(A[2] + (B[2] - A[2]) * t)}`; };
const tint = (c, t) => (t >= 0 ? mix(c, '#ffffff', t) : mix(c, '#000000', -t));
const rgba = (c, a) => { const [r, g, b] = rgbOf(c); return `rgba(${r},${g},${b},${a})`; };
const ease = (u) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };

// Layout of the described board: aspect, node centres and node radius (relative to the shell's unit = min(w, h)).
export function daraLayout(cols, rows) {
  const W = cols + 2 * MS, H = rows + 2 * M, aspect = W / H;
  const node = (c, r) => [(MS + c + 0.5) / W, (M + r + 0.5) / H];
  const r = (0.5 / W) * Math.max(1, aspect);
  return { W, H, aspect, node, r };
}

// ---- the sand --------------------------------------------------------------------------------------------------------------
function paintSand(ctx, x, y, w, h) {
  const g = ctx.createLinearGradient(x, y, x + w * 0.7, y + h);
  g.addColorStop(0, '#f0dcae'); g.addColorStop(0.5, '#e0c28a'); g.addColorStop(1, '#c9a468');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  // wind ripples: long shallow waves with a lit crest and a shaded trough
  const n = Math.max(6, Math.round(h / 26));
  ctx.lineCap = 'round';
  for (let k = 0; k < n; k++) {
    const yy = y + (h * (k + 0.5)) / n, ph = hash(k, 3) * TAU, amp = h * 0.006 + 1.5;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) { const xx = x + (w * i) / 24; const py = yy + Math.sin(ph + i * 0.7) * amp; i ? ctx.lineTo(xx, py) : ctx.moveTo(xx, py); }
    ctx.strokeStyle = 'rgba(255,248,225,0.32)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.translate(0, 2.4); ctx.strokeStyle = 'rgba(120,80,30,0.16)'; ctx.lineWidth = 1.4; ctx.stroke(); ctx.translate(0, -2.4);
  }
  // grains
  const N = Math.min(420, Math.round((w * h) / 900));
  for (let k = 0; k < N; k++) {
    ctx.fillStyle = k % 3 ? 'rgba(110,70,25,0.16)' : 'rgba(255,255,240,0.3)';
    ctx.fillRect(x + hash(k, 1) * w, y + hash(k, 2) * h, 1.4 + hash(k, 4) * 1.6, 1.2 + hash(k, 5) * 1.2);
  }
  // acacia shade: soft dappled leaflets falling across one corner, and a warm sun patch opposite
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  for (let k = 0; k < 26; k++) {
    const a = hash(k, 7) * 1.1, d = hash(k, 8) * Math.min(w, h) * 0.5;
    const px = x + w * 0.96 - Math.cos(a) * d * 1.1, py = y + h * 0.03 + Math.sin(a) * d * 0.9;
    ctx.save(); ctx.translate(px, py); ctx.rotate(hash(k, 9) * TAU);
    ctx.fillStyle = `rgba(60,40,10,${0.07 + hash(k, 10) * 0.07})`; ctx.beginPath(); ctx.ellipse(0, 0, w * 0.045, w * 0.014, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  const sun = ctx.createRadialGradient(x + w * 0.2, y + h * 0.85, 4, x + w * 0.2, y + h * 0.85, w * 0.5);
  sun.addColorStop(0, 'rgba(255,240,190,0.28)'); sun.addColorStop(1, 'rgba(255,240,190,0)');
  ctx.fillStyle = sun; ctx.fillRect(x, y, w, h);
  const vg = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.35, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(60,30,0,0.28)');
  ctx.fillStyle = vg; ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// One scratched cell: a wobbly square groove with a dark inner edge top-left and a lit lip bottom-right.
function paintCell(ctx, cx, cy, hs, seed) {
  const j = (k) => (hash(seed, k) - 0.5) * hs * 0.16;
  const P = [[-hs + j(1), -hs + j(2)], [0 + j(3), -hs * 1.02 + j(4)], [hs + j(5), -hs + j(6)], [hs * 1.02 + j(7), j(8)], [hs + j(9), hs + j(10)], [j(11), hs * 1.02 + j(12)], [-hs + j(13), hs + j(14)], [-hs * 1.02 + j(15), j(16)]];
  const path = () => {
    ctx.beginPath();
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const s = mid(P[7], P[0]); ctx.moveTo(cx + s[0], cy + s[1]);
    for (let i = 0; i < 8; i++) { const m = mid(P[i], P[(i + 1) % 8]); ctx.quadraticCurveTo(cx + P[i][0], cy + P[i][1], cx + m[0], cy + m[1]); }
    ctx.closePath();
  };
  path(); ctx.fillStyle = 'rgba(130,88,40,0.2)'; ctx.fill();
  ctx.save(); path(); ctx.clip();
  const g = ctx.createLinearGradient(cx - hs, cy - hs, cx + hs, cy + hs);
  g.addColorStop(0, 'rgba(70,40,10,0.42)'); g.addColorStop(0.35, 'rgba(70,40,10,0.08)'); g.addColorStop(1, 'rgba(255,245,215,0.2)');
  ctx.fillStyle = g; ctx.fillRect(cx - hs * 1.2, cy - hs * 1.2, hs * 2.4, hs * 2.4);
  ctx.restore();
  path(); ctx.strokeStyle = 'rgba(80,48,16,0.6)'; ctx.lineWidth = Math.max(1.5, hs * 0.07); ctx.lineJoin = 'round'; ctx.stroke();
  ctx.save(); ctx.translate(hs * 0.05, hs * 0.07); path(); ctx.strokeStyle = 'rgba(255,248,225,0.55)'; ctx.lineWidth = Math.max(1, hs * 0.045); ctx.stroke(); ctx.restore();
}

// ---- pieces ----------------------------------------------------------------------------------------------------------------
// Owner 1: smooth river pebbles (blue-grey). Owner 0: bundles of cut twigs (red ochre). Different silhouettes, not just colours.
function pebble(ctx, x, y, r, base, seed) {
  const rot = (hash(seed, 1) - 0.5) * 0.9, rx = r * (0.98 + hash(seed, 2) * 0.12), ry = r * (0.8 + hash(seed, 3) * 0.1);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = 'rgba(50,30,5,0.38)'; ctx.beginPath(); ctx.ellipse(r * 0.14, r * 0.3, rx * 1.05, ry * 0.95, 0, 0, TAU); ctx.fill();
  const g = ctx.createRadialGradient(-rx * 0.35, -ry * 0.45, rx * 0.1, 0, 0, rx * 1.15);
  g.addColorStop(0, tint(base, 0.6)); g.addColorStop(0.5, base); g.addColorStop(1, tint(base, -0.5));
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = rgba(tint(base, -0.6), 0.6); ctx.lineWidth = Math.max(1, r * 0.06); ctx.stroke();
  for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? rgba(tint(base, -0.55), 0.5) : rgba('#ffffff', 0.4); const a = hash(seed, 10 + k) * TAU, d = hash(seed, 20 + k) * 0.6; ctx.beginPath(); ctx.arc(Math.cos(a) * rx * d, Math.sin(a) * ry * d, Math.max(0.8, r * 0.06), 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(-rx * 0.35, -ry * 0.42, rx * 0.26, ry * 0.12, -0.5, 0, TAU); ctx.fill();
  ctx.restore();
}
function twigs(ctx, x, y, r, base, seed) {
  const rot = (hash(seed, 4) - 0.5) * 0.7 + 0.35;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const L = r * 1.75, T = r * 0.34;
  for (let k = 0; k < 3; k++) {
    const oy = (k - 1) * T * 1.05, ox = (hash(seed, 5 + k) - 0.5) * r * 0.25, an = (k - 1) * 0.1;
    ctx.save(); ctx.translate(ox, oy); ctx.rotate(an);
    ctx.fillStyle = 'rgba(50,30,5,0.34)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-L / 2 + r * 0.1, T * 0.35, L, T, T / 2) : ctx.rect(-L / 2, T * 0.35, L, T); ctx.fill();
    const g = ctx.createLinearGradient(0, -T / 2, 0, T / 2); g.addColorStop(0, tint(base, 0.55)); g.addColorStop(0.45, base); g.addColorStop(1, tint(base, -0.5));
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-L / 2, -T / 2, L, T, T / 2) : ctx.rect(-L / 2, -T / 2, L, T); ctx.fill();
    ctx.strokeStyle = rgba(tint(base, -0.65), 0.55); ctx.lineWidth = Math.max(1, T * 0.12); ctx.stroke();
    ctx.strokeStyle = rgba(tint(base, -0.55), 0.7); ctx.lineWidth = Math.max(1, T * 0.14);
    for (const nx of [-L * 0.2, L * 0.22]) { ctx.beginPath(); ctx.moveTo(nx, -T * 0.5); ctx.lineTo(nx + 1, T * 0.5); ctx.stroke(); }
    ctx.fillStyle = tint(base, 0.7); ctx.beginPath(); ctx.ellipse(L / 2 - T * 0.2, 0, T * 0.22, T * 0.34, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // a twist of grass binding the bundle
  ctx.strokeStyle = '#6e5a2a'; ctx.lineWidth = Math.max(1.5, T * 0.28); ctx.beginPath(); ctx.moveTo(-L * 0.04, -T * 1.7); ctx.lineTo(L * 0.02, T * 1.7); ctx.stroke();
  ctx.restore();
}

const pieceDraw = (ctx, owner, x, y, r, pal, seed) => (owner === 0 ? twigs(ctx, x, y, r, pal.p0, seed) : pebble(ctx, x, y, r, mix(pal.p1, '#9aa0a8', 0.5), seed));

// ---- the board -------------------------------------------------------------------------------------------------------------
// model = { cells: [{ node, c, r }], pieces: [{ node, owner }], hand: [n0, n1], born?: {node: t0}, puffs?: [{ c, r, t0 }] }
export function paintDara(ctx, rect, model, pal, t = 0) {
  const { x, y, w, h } = rect, L = daraLayout(model.cols, model.rows);
  const dx = w / L.W, dy = h / L.H, hs = Math.min(dx, dy) * 0.5;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  paintSand(ctx, x, y, w, h);
  const cx = (c) => x + (MS + c + 0.5) * dx, cy = (r) => y + (M + r + 0.5) * dy;
  for (const cell of model.cells) paintCell(ctx, cx(cell.c), cy(cell.r), hs * 0.9, cell.c * 17 + cell.r * 5);
  // reserves in the sand above and below: unplaced stones for each player
  const reserve = (owner, yy, n) => {
    if (n <= 0) return;
    const per = 6, small = hs * 0.5, x0 = x + w / 2 - ((Math.min(n, per) - 1) * small * 1.65) / 2;
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / per), col = i % per, px = x0 + col * small * 1.65 + (row % 2) * small * 0.4, py = yy + (row - (Math.ceil(n / per) - 1) / 2) * small * 1.25;
      pieceDraw(ctx, owner, px, py, small, pal, 200 + owner * 50 + i);
    }
    ctx.font = `700 ${Math.max(11, Math.round(hs * 0.42))}px system-ui, sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(70,40,10,0.75)'; ctx.fillText(`x${n}`, x + w * 0.04 + hs * 0.2, yy);
  };
  reserve(1, y + (M * dy) / 2, model.hand[1]);
  reserve(0, y + h - (M * dy) / 2, model.hand[0]);
  // scuffed sand where a piece just left
  for (const p of model.puffs ?? []) {
    const u = (t - p.t0) / 0.55; if (u < 0 || u > 1) continue;
    for (let k = 0; k < 6; k++) { const a = hash(p.c, p.r, k) * TAU, d = u * hs * (0.5 + hash(k, 3) * 0.9); ctx.fillStyle = `rgba(236,214,164,${0.55 * (1 - u)})`; ctx.beginPath(); ctx.arc(cx(p.c) + Math.cos(a) * d, cy(p.r) + Math.sin(a) * d * 0.7 - u * hs * 0.3, hs * (0.16 + u * 0.22), 0, TAU); ctx.fill(); }
  }
  for (const pc of model.pieces) {
    const cell = model.byNode.get(pc.node); if (!cell) continue;
    const born = model.born?.[pc.node], u = born === undefined ? 1 : Math.min(1, (t - born) / 0.28);
    const lift = u < 1 ? (1 - ease(u)) * hs * 1.1 : 0;
    pieceDraw(ctx, pc.owner, cx(cell.c), cy(cell.r) - lift, hs * 0.74, pal, cell.c * 7 + cell.r * 13 + pc.owner);
  }
  ctx.restore();
}

// The framed board for the title screen: a damp sand rim, a soft shadow, the sand and an example position.
export function paintDaraTitle(ctx, rect, model, pal, t) {
  const L = daraLayout(model.cols, model.rows);
  let bw = rect.w * 0.98, bh = bw / L.aspect;
  if (bh > rect.h * 0.98) { bh = rect.h * 0.98; bw = bh * L.aspect; }
  const x = rect.x + rect.w / 2 - bw / 2, y = rect.y + rect.h / 2 - bh / 2, rim = Math.max(5, bw * 0.02);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = bw * 0.05; ctx.shadowOffsetY = bw * 0.02;
  ctx.fillStyle = '#7a5428'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - rim, y - rim, bw + rim * 2, bh + rim * 2, rim * 2) : ctx.rect(x - rim, y - rim, bw + rim * 2, bh + rim * 2); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, bw, bh, rim) : ctx.rect(x, y, bw, bh); ctx.clip();
  paintDara(ctx, { x, y, w: bw, h: bh }, model, pal, t);
  ctx.restore();
}

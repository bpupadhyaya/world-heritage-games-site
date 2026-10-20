// Camera views of the craft races (tempo-race 1.7.0). `craft.view` picks how the same race is staged:
//   chase      low camera behind and beside the fleet (1.6.0 look)
//   broadside  side-on from a committee boat: high horizon, one big hull across the screen, clouds, a thin fleet at the line
//   shore      from the beach: a wedge of wet sand and surf in the foreground, the raft launched through the break
//   aerial     high oblique over a lagoon: almost no sky, coral and sand shoals under the hulls, small boats
//   iceedge    from the ice shelf: a bright ice apron with spectators in front, a dark open channel, the hull close to the edge
//   map        top-down river-bend map: the river winds through banks, boats seen from above and turned along the stream
//   rear       over the shoulder: the crew's backs in the foreground, the canoe narrowing to the horizon, rivals ahead
// Every view draws the same race state (racers, obstacles, rough water); only the staging and the art differ.
import { drawChase, BACKDROPS, noise, palm, pine, ridge } from './craft-world.js';
import { hash, lit, dim, mix, alpha, smooth, lg, capsule, TAU, clamp, lerp } from './craft-art.js';
import { drawMap, drawRear } from './craft-top.js';

// ---- shore: sand wedge, surf foam, a beached raft and a palm -----------------------------------------------------------------
function shoreFg(ctx, g, W) {
  const { x0, y0, w, h, t } = g, U = Math.min(w, h * 0.72);
  const edge = (u) => y0 + h * (0.72 + 0.3 * u * u + 0.02 * u) + Math.sin(u * 7 + t * 0.7) * 2.5;   // water edge: u 0..1 across the sand
  const X = (u) => x0 - 6 + u * w * 0.6;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(x0 - 6, y0 + h * 0.7);
  for (let u = 0; u <= 1.001; u += 0.05) ctx.lineTo(X(u), edge(u));
  ctx.lineTo(X(1), y0 + h + 6); ctx.lineTo(x0 - 6, y0 + h + 6); ctx.closePath();
  const sg = lg(ctx, x0, y0 + h * 0.7, x0 + w * 0.3, y0 + h, [[0, '#f3d9a4'], [0.5, '#e8c488'], [1, '#c99a62']]);
  ctx.fillStyle = sg; ctx.fill();
  ctx.clip();
  // wet sand band along the edge, ripples, shells
  const wet = ctx.createLinearGradient(x0, y0 + h * 0.6, x0 + w * 0.7, y0 + h); wet.addColorStop(0, 'rgba(120,80,44,0)'); wet.addColorStop(1, 'rgba(120,80,44,0.38)');
  ctx.fillStyle = wet; ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = 'rgba(150,100,56,0.28)'; ctx.lineWidth = 1.4;
  for (let k = 0; k < 7; k++) { const yy = y0 + h * (0.76 + k * 0.04); ctx.beginPath(); for (let x = x0; x < x0 + w * 0.7; x += 10) ctx.lineTo(x, yy + Math.sin(x * 0.05 + k) * 2.2 + (x - x0) * 0.12); ctx.stroke(); }
  for (let k = 0; k < 22; k++) { ctx.fillStyle = k % 3 ? 'rgba(255,248,230,0.7)' : 'rgba(150,90,60,0.5)'; ctx.beginPath(); ctx.ellipse(x0 + hash(k * 3) * w * 0.5, y0 + h * (0.72 + hash(k * 5) * 0.26), 2 + hash(k) * 2.4, 1.4, hash(k) * 3, 0, TAU); ctx.fill(); }
  // two beached log rafts with furled sails
  for (const [bx, by, sz, rot] of [[0.2, 0.93, 0.34, -0.05], [0.5, 1.0, 0.3, 0.08]]) {
    ctx.save(); ctx.translate(x0 + w * bx, y0 + h * by); ctx.rotate(rot); const L = w * sz;
    ctx.fillStyle = 'rgba(70,40,14,0.3)'; ctx.beginPath(); ctx.ellipse(0, L * 0.06, L * 0.55, L * 0.05, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 4; i++) { const yy = -i * L * 0.038, col = mix('#b98a52', '#d8aa6c', i / 4); ctx.strokeStyle = col; ctx.lineWidth = L * 0.04; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-L * 0.5, yy); ctx.lineTo(L * 0.5, yy - L * 0.01); ctx.stroke(); ctx.fillStyle = dim(col, 0.35); ctx.beginPath(); ctx.arc(-L * 0.5, yy, L * 0.02, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#6a4420'; ctx.lineWidth = L * 0.012; for (const x of [-0.3, 0, 0.3]) { ctx.beginPath(); ctx.moveTo(L * x, -L * 0.14); ctx.lineTo(L * x + 2, L * 0.02); ctx.stroke(); }
    ctx.strokeStyle = '#7a5230'; ctx.lineWidth = L * 0.018; ctx.beginPath(); ctx.moveTo(-L * 0.45, -L * 0.2); ctx.lineTo(L * 0.5, -L * 0.14); ctx.stroke();
    ctx.fillStyle = '#f1e6cf'; ctx.beginPath(); ctx.moveTo(-L * 0.4, -L * 0.19); ctx.lineTo(L * 0.3, -L * 0.14); ctx.lineTo(L * 0.1, -L * 0.1); ctx.lineTo(-L * 0.4, -L * 0.14); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  // surf: layered foam lines hugging the sand edge, sliding in and out
  for (let k = 0; k < 3; k++) {
    const ph = Math.sin(t * 0.9 + k * 1.7) * 6;
    ctx.strokeStyle = `rgba(255,255,255,${0.75 - k * 0.2})`; ctx.lineWidth = 3 - k * 0.7; ctx.lineCap = 'round'; ctx.beginPath();
    for (let u = 0; u <= 1.001; u += 0.04) { const x = X(u) + ph * 0.5 + k * 9, y = edge(u) - 3 - k * 7 + ph * 0.4 + Math.sin(u * 30 + k) * 1.6; u ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
  }
  // a palm trunk and fronds leaning in from the top-left corner
  ctx.strokeStyle = '#2b2218'; ctx.lineWidth = U * 0.026; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0 + U * 0.02, y0 + h * 0.76); ctx.quadraticCurveTo(x0 + U * 0.05, y0 + h * 0.4, x0 + U * 0.17, y0 + h * 0.2); ctx.stroke();
  ctx.strokeStyle = '#3a2d1f'; ctx.lineWidth = 2; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(x0 + w * 0.012, y0 + h * (0.7 - i * 0.05)); ctx.lineTo(x0 + w * 0.045, y0 + h * (0.7 - i * 0.05)); ctx.stroke(); }
  const px = x0 + U * 0.17, py = y0 + h * 0.2, sw = Math.sin(t * 1.1) * 0.05;
  ctx.strokeStyle = '#223a22'; ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.02 + i * 0.16) + sw, L = U * (0.2 + (i % 2) * 0.04); ctx.lineWidth = U * 0.014; ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + Math.cos(a) * L * 0.6, py + Math.sin(a) * L * 0.6 - L * 0.1, px + Math.cos(a) * L, py + Math.sin(a) * L + L * 0.3); ctx.stroke(); }
}

// ---- aerial: lagoon floor patterns under the hulls ----------------------------------------------------------------------------
function aerialWater(ctx, g, W) {
  const { x0, w, hz, y0, h, off, t } = g;
  const bot = y0 + h;
  const gr = ctx.createLinearGradient(0, hz, 0, bot); gr.addColorStop(0, W.water[0]); gr.addColorStop(0.4, '#5fd3d0'); gr.addColorStop(1, '#27b6c4');
  ctx.fillStyle = gr; ctx.fillRect(x0, hz, w, bot - hz);
  ctx.save(); ctx.beginPath(); ctx.rect(x0, hz, w, bot - hz); ctx.clip();
  const span = w * 2.4, par = 0.8, U = Math.min(w, h * 1.1);
  const blob = (k, kind) => {
    const bx = ((hash(k * 3 + kind * 101) * span - off * par) % span + span) % span - w * 0.7 + x0, by = hz + (bot - hz) * (0.04 + hash(k * 7 + kind * 13) * 0.96);
    const d = (by - hz) / (bot - hz), r = U * (0.1 + hash(k * 11 + kind) * 0.22) * (0.5 + d * 0.9);
    return { bx, by, r, d };
  };
  for (let k = 0; k < 14; k++) {   // deep channels
    const b = blob(k, 1), gg = ctx.createRadialGradient(b.bx, b.by, 0, b.bx, b.by, b.r);
    gg.addColorStop(0, 'rgba(8,70,112,0.62)'); gg.addColorStop(0.7, 'rgba(10,100,140,0.28)'); gg.addColorStop(1, 'rgba(10,100,140,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.ellipse(b.bx, b.by, b.r * 1.5, b.r * 0.62, 0, 0, TAU); ctx.fill();
  }
  for (let k = 0; k < 9; k++) {   // pale sand banks with a bright cyan rim
    const b = blob(k, 2);
    ctx.fillStyle = 'rgba(140,238,230,0.5)'; ctx.beginPath(); ctx.ellipse(b.bx, b.by, b.r * 1.15, b.r * 0.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(247,236,196,0.9)'; ctx.beginPath(); ctx.ellipse(b.bx, b.by, b.r * 0.78, b.r * 0.32, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,240,0.55)'; ctx.beginPath(); ctx.ellipse(b.bx - b.r * 0.15, b.by - b.r * 0.06, b.r * 0.4, b.r * 0.12, 0, 0, TAU); ctx.fill();
  }
  for (let k = 0; k < 30; k++) {   // coral heads: dark clusters
    const b = blob(k, 3), s = b.r * 0.16;
    for (let j = 0; j < 5; j++) { ctx.fillStyle = j % 2 ? 'rgba(52,54,40,0.62)' : 'rgba(86,70,46,0.58)'; ctx.beginPath(); ctx.ellipse(b.bx + (hash(k * 5 + j) - 0.5) * s * 3, b.by + (hash(k * 9 + j) - 0.5) * s, s * (0.6 + hash(j + k) * 0.6), s * 0.38, 0, 0, TAU); ctx.fill(); }
  }
  // caustic ripples
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.3;
  for (let k = 0; k < 40; k++) { const x = x0 + ((hash(k * 5) * w * 1.3 - off * 0.9 - t * 6 * (1 + hash(k))) % (w * 1.3) + w * 1.3) % (w * 1.3) - w * 0.15, d = hash(k * 3 + 1), y = hz + (bot - hz) * (0.03 + d * 0.97), L = 8 + d * 34; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + L / 2, y - 2 - d * 3, x + L, y); ctx.stroke(); }
  ctx.restore();
}
function aerialShadow(ctx, x, y, S) {   // the hull and sail throw a soft shadow on the sand below
  ctx.fillStyle = 'rgba(4,50,70,0.34)'; ctx.beginPath(); ctx.ellipse(x + S * 0.1, y + S * 0.13, S * 0.46, S * 0.05, 0.02, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(4,50,70,0.18)'; ctx.beginPath(); ctx.moveTo(x - S * 0.1, y + S * 0.12); ctx.lineTo(x + S * 0.38, y + S * 0.16); ctx.lineTo(x + S * 0.2, y + S * 0.34); ctx.lineTo(x - S * 0.15, y + S * 0.2); ctx.closePath(); ctx.fill();
}

// ---- iceedge: apron of shore ice with spectators ----------------------------------------------------------------------------------
function iceFg(ctx, g, W) {
  const { x0, y0, w, h, t } = g;
  const top = (x) => y0 + h * 0.8 + Math.sin(x * 0.021) * 4 + noise(x * 0.012, 5) * 14 - 6;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(x0 - 4, y0 + h + 4);
  for (let x = x0 - 4; x <= x0 + w + 8; x += 6) ctx.lineTo(x, top(x));
  ctx.lineTo(x0 + w + 8, y0 + h + 4); ctx.closePath();
  const ig = lg(ctx, 0, y0 + h * 0.78, 0, y0 + h, [[0, '#f4f9fd'], [0.4, '#dbe9f4'], [1, '#b8cfe2']]);
  ctx.fillStyle = ig; ctx.fill(); ctx.clip();
  // lit rim, blue shadow under the lip, cracks and snow drifts
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); for (let x = x0; x <= x0 + w + 8; x += 6) x === x0 ? ctx.moveTo(x, top(x)) : ctx.lineTo(x, top(x)); ctx.stroke();
  ctx.strokeStyle = 'rgba(90,140,185,0.5)'; ctx.lineWidth = 5; ctx.beginPath(); for (let x = x0; x <= x0 + w + 8; x += 6) x === x0 ? ctx.moveTo(x, top(x) + 5) : ctx.lineTo(x, top(x) + 5); ctx.stroke();
  ctx.strokeStyle = 'rgba(70,120,170,0.38)'; ctx.lineWidth = 1.2;
  for (let k = 0; k < 9; k++) { let x = x0 + hash(k * 3) * w, y = y0 + h * (0.84 + hash(k * 5) * 0.14); ctx.beginPath(); ctx.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (hash(k * 7 + j) - 0.3) * 30; y += (hash(k * 11 + j) - 0.4) * 10; ctx.lineTo(x, y); } ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(x0 + w * (0.1 + k * 0.22) + hash(k) * 20, y0 + h * (0.9 + hash(k + 3) * 0.07), w * 0.09, 5, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
  // spectators in winter coats along the lip, a pennant line, a hot-drink stall
  const u = Math.min(w, h * 1.05), n = Math.max(6, Math.round(w / (u * 0.1)));
  for (let k = 0; k < n; k++) {
    const x = x0 + (k + 0.4 + hash(k) * 0.4) * (w / n), s = u * (0.034 + hash(k * 3) * 0.012), y = top(x) + s * 0.4;
    const coat = ['#c8372d', '#2a5da8', '#e8b84a', '#2f2f3a', '#3f8a5a', '#f4f0e4', '#8a3a7a'][k % 7];
    ctx.fillStyle = 'rgba(40,70,110,0.25)'; ctx.beginPath(); ctx.ellipse(x, y + 2, s * 0.6, s * 0.12, 0, 0, TAU); ctx.fill();
    capsule(ctx, x, y - s * 0.7, x, y - s * 1.55, s * 0.62, coat);
    capsule(ctx, x - s * 0.12, y, x - s * 0.12, y - s * 0.8, s * 0.22, '#2a2a36'); capsule(ctx, x + s * 0.14, y, x + s * 0.14, y - s * 0.8, s * 0.22, '#2a2a36');
    ctx.fillStyle = '#d9a57a'; ctx.beginPath(); ctx.arc(x, y - s * 1.82, s * 0.27, 0, TAU); ctx.fill();
    ctx.fillStyle = k % 2 ? '#c8372d' : '#f4f0e4'; ctx.beginPath(); ctx.arc(x, y - s * 1.9, s * 0.3, Math.PI, TAU); ctx.fill(); ctx.fillRect(x - s * 0.3, y - s * 1.93, s * 0.6, s * 0.1);
    if (k % 3 === 1) { capsule(ctx, x + s * 0.3, y - s * 1.2, x + s * 0.45, y - s * 2.3, s * 0.07, '#5a3a1e'); const fl = Math.sin(t * 5 + k) * 2; ctx.fillStyle = k % 2 ? '#c8372d' : '#2a5da8'; ctx.beginPath(); ctx.moveTo(x + s * 0.45, y - s * 2.3); ctx.lineTo(x + s * 1.2, y - s * 2.1 + fl); ctx.lineTo(x + s * 0.45, y - s * 1.9); ctx.fill(); }
  }
}

// ---- presets ------------------------------------------------------------------------------------------------------------------
const PRESETS = {
  chase: {},
  broadside: { hz: 0.5, hzW: 0.44, bot: 0.88, botW: 0.9, heroW: 0.86, heroWW: 0.54, anchor: 0.5, anchorW: 0.5, depth: 2.4, scFar: 0.36, scFarW: 0.3, fleet: 7, vig: 0.04 },
  shore: { hz: 0.3, hzW: 0.28, bot: 0.72, botW: 0.8, heroW: 0.74, heroWW: 0.5, anchor: 0.6, anchorW: 0.62, depth: 1.5, scFar: 0.4, scFarW: 0.32, fleet: 3, fg: shoreFg },
  aerial: { hz: 0.1, hzW: 0.1, bot: 0.84, botW: 0.9, heroW: 0.62, heroWW: 0.4, anchor: 0.5, anchorW: 0.5, depth: 3.2, scFar: 0.55, scFarW: 0.5, fleet: 0, water: aerialWater, noReflect: true, shadow: aerialShadow },
  iceedge: { hz: 0.33, hzW: 0.3, bot: 0.76, botW: 0.8, heroW: 0.76, heroWW: 0.5, anchor: 0.45, anchorW: 0.42, depth: 1.6, scFar: 0.46, scFarW: 0.34, fleet: 3, fg: iceFg },
};
export const VIEW_IDS = ['chase', 'map', 'rear', ...Object.keys(PRESETS).filter((k) => k !== 'chase')];

export function drawView(ctx, V0, o) {
  const v = o.craft.view ?? 'chase';
  if (v === 'map') return drawMap(ctx, V0, o);
  if (v === 'rear') return drawRear(ctx, V0, o);
  return drawChase(ctx, V0, { ...o, cfg: PRESETS[v] ?? PRESETS.chase });
}

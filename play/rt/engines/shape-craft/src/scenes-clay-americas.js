// shape-craft 1.12.0: eight pottery workshops of the Americas (lathe, `vessel: 'fine'`), each with its own wall, floor, bench rig, reference frame,
// dock tools, motifs, finish and profile. Oaxaca black clay, Atzompa green glaze, Tolima smoke pit (lidded cooking pot), Pomaire red clay,
// Chulucanas leaf resist, Mata Ortiz thin-wall olla, Metepec modelled relief, Saramenha lead-glazed water jar (Minas Gerais). Pure canvas drawing, deterministic (hash, never Math.random).
import { registerSceneSet, registerProfile, registerProp } from './registry.js';
import { hash } from './geom.js';
import { tint, rgba, mix, rrect } from './fx.js';
import { lg, rg, ell, cast, TAU } from './props.js';

// ---- profiles (bottom to top; thrown on 12 rows and 12 steps they stay smooth) -------------------------------------------------------------
registerProfile('cantaro', [0.46, 0.62, 0.84, 0.97, 1, 0.92, 0.7, 0.52, 0.44, 0.5, 0.66]);          // round belly, tall narrow neck, flared lip (Oaxaca black clay)
registerProfile('atzjug', [0.52, 0.72, 0.88, 0.96, 0.98, 0.9, 0.7, 0.5, 0.42, 0.46, 0.62]);        // pitcher for a green glaze, with a broad lip and a handle (Atzompa)
registerProfile('ollachamba', [0.62, 0.84, 0.97, 1, 0.97, 0.88, 0.78, 0.72, 0.72, 0.76]);          // squat cooking pot with a wide mouth that takes a lid (La Chamba)
registerProfile('greda', [0.5, 0.72, 0.9, 0.98, 1, 0.94, 0.82, 0.7, 0.66, 0.7, 0.78]);               // wide round-bellied casserole pot with a low mouth (Pomaire)
registerProfile('chuluvase', [0.4, 0.58, 0.8, 0.94, 0.98, 0.9, 0.7, 0.46, 0.34, 0.3, 0.34, 0.46]);  // globular vase with a slim neck and a flared lip (Chulucanas)
registerProfile('olla', [0.34, 0.6, 0.84, 0.97, 1, 0.96, 0.84, 0.66, 0.5, 0.44, 0.5, 0.6]);         // very round thin-walled jar with a small neck (Mata Ortiz)
registerProfile('florero', [0.46, 0.64, 0.82, 0.92, 0.94, 0.88, 0.76, 0.64, 0.6, 0.7, 0.88]);       // jar with a wide flaring mouth for applied relief (Metepec)

registerProfile('moringa', [0.5, 0.7, 0.86, 0.94, 0.92, 0.78, 0.58, 0.4, 0.3, 0.28, 0.34, 0.46]);       // tall water jar with a narrow neck and two ears under a flared lip (Saramenha)

// ---- small drawing helpers -------------------------------------------------------------------------------------------------------------------
const PR = { jar: [0.28, 0.4, 0.5, 0.46, 0.32, 0.24, 0.27, 0.33], jug: [0.22, 0.32, 0.36, 0.3, 0.19, 0.15, 0.2, 0.26], olla: [0.3, 0.46, 0.52, 0.48, 0.34, 0.22, 0.24, 0.3], bowl: [0.2, 0.34, 0.46, 0.54], tall: [0.2, 0.3, 0.34, 0.3, 0.2, 0.16, 0.15, 0.2, 0.26], pot: [0.4, 0.5, 0.52, 0.46, 0.4, 0.42] };
function sm(ctx, pts, move = true) { if (move) ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2); ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); }
// a small lit pot standing on the baseline y (a prop of the wall)
function vase(ctx, x, y, h, kind, c, o = {}) {
  const pr = PR[kind] ?? PR.jar, n = pr.length, L = [], R = [];
  for (let i = 0; i < n; i++) { const yy = y - (h * i) / (n - 1), rr = pr[i] * h; L.push([x - rr, yy]); R.push([x + rr, yy]); }
  const rmax = Math.max(...pr) * h, rt = pr[n - 1] * h;
  cast(ctx, x + h * 0.06, y, pr[0] * h * 1.5, h * 0.05, 0.35);
  ctx.beginPath(); sm(ctx, L); ctx.lineTo(R[n - 1][0], R[n - 1][1]); sm(ctx, R.slice().reverse(), false); ctx.closePath();
  ctx.fillStyle = lg(ctx, x - rmax, 0, x + rmax, 0, [[0, tint(c, -0.45)], [0.28, tint(c, o.gloss ?? 0.22)], [0.6, c], [1, tint(c, -0.6)]]); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = rgba('#ffffff', o.sheen ?? 0.22); ell(ctx, x - rmax * 0.42, y - h * 0.5, rmax * 0.08, h * 0.2); ctx.fill();
  ell(ctx, x, y - h, rt, Math.max(1.5, rt * 0.24)); ctx.fillStyle = o.inside ?? tint(c, -0.62); ctx.fill(); ctx.strokeStyle = tint(c, 0.25); ctx.lineWidth = 1.2; ctx.stroke();
  if (o.band) { ctx.strokeStyle = o.band; ctx.lineWidth = Math.max(1, h * 0.04); ctx.beginPath(); ctx.ellipse(x, y - h * 0.5, pr[Math.floor(n / 2)] * h * 0.99, h * 0.05, 0, 0.1, Math.PI - 0.1); ctx.stroke(); }
}
function agave(ctx, x, y, s, c) { // a rosette of long pointed leaves
  for (let k = 0; k < 11; k++) {
    const a = -Math.PI / 2 + (k - 5) * 0.26, l = s * (0.78 + 0.22 * hash(k, 31)), w = s * 0.085;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2); ctx.fillStyle = lg(ctx, -w, 0, w, 0, [[0, tint(c, -0.25)], [0.5, tint(c, 0.12)], [1, tint(c, -0.35)]]);
    ctx.beginPath(); ctx.moveTo(-w, 0); ctx.quadraticCurveTo(-w * 1.15, -l * 0.55, 0, -l); ctx.quadraticCurveTo(w * 1.15, -l * 0.55, w, 0); ctx.closePath(); ctx.fill(); ctx.restore();
  }
}
function palm(ctx, x, y, s, c) { // a tall palm silhouette
  ctx.strokeStyle = c; ctx.lineWidth = Math.max(2, s * 0.035); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + s * 0.06, y - s * 0.5, x + s * 0.02, y - s); ctx.stroke();
  for (let k = 0; k < 9; k++) { const a = -Math.PI * 0.95 + (k * Math.PI * 0.9) / 8; ctx.beginPath(); ctx.moveTo(x + s * 0.02, y - s); ctx.quadraticCurveTo(x + s * 0.02 + Math.cos(a) * s * 0.3, y - s + Math.sin(a) * s * 0.25 - s * 0.05, x + s * 0.02 + Math.cos(a) * s * 0.5, y - s + Math.sin(a) * s * 0.2 + s * 0.14); ctx.stroke(); }
}
const leafP = (ctx, w, h) => { ctx.beginPath(); ctx.moveTo(0, h); ctx.quadraticCurveTo(w, h * 0.15, 0, -h); ctx.quadraticCurveTo(-w, h * 0.15, 0, h); ctx.closePath(); };

// ---- walls -----------------------------------------------------------------------------------------------------------------------------------
const walls = {
  kilncourt(ctx, s, r, H, t) { // Oaxaca: a sunlit lime-washed adobe wall, tile eave, blue dado, agaves, a shelf of black burnished ware
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#efdcb4'], [1, s.wallC]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let k = 0; k < 46; k++) { ctx.fillStyle = `rgba(120,86,48,${0.05 + 0.05 * hash(k, 3)})`; ell(ctx, r.x + r.w * hash(k, 1), r.y + H * (0.2 + 0.7 * hash(k, 2)), 8 + 18 * hash(k, 4), 3 + 6 * hash(k, 5)); ctx.fill(); }
    const eh = H * 0.17; ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + eh, [[0, '#5a2a1a'], [1, '#a8522e']]); ctx.fillRect(r.x, r.y, r.w, eh);
    for (let x = r.x; x < r.x + r.w + 20; x += 20) { ctx.fillStyle = '#c4683a'; ctx.beginPath(); ctx.arc(x, r.y + eh * 0.62, 10, 0, Math.PI); ctx.fill(); ctx.strokeStyle = 'rgba(40,16,8,0.45)'; ctx.lineWidth = 1.2; ctx.stroke(); }
    const sg = ctx.createLinearGradient(0, r.y + eh, 0, r.y + eh + H * 0.22); sg.addColorStop(0, 'rgba(60,30,10,0.4)'); sg.addColorStop(1, 'rgba(60,30,10,0)'); ctx.fillStyle = sg; ctx.fillRect(r.x, r.y + eh, r.w, H * 0.22);
    const dh = H * 0.24, dy = r.y + H - dh; ctx.fillStyle = lg(ctx, 0, dy, 0, r.y + H, [[0, '#3a82c0'], [1, '#1e5a96']]); ctx.fillRect(r.x, dy, r.w, dh); ctx.fillStyle = '#f4ecd6'; ctx.fillRect(r.x, dy - 2, r.w, 3);
    agave(ctx, r.x + r.w * 0.1, dy, H * 0.62, '#5f8c76'); agave(ctx, r.x + r.w * 0.92, dy, H * 0.5, '#6a9680');
    const sx0 = r.x + r.w * 0.2, sx1 = r.x + r.w * 0.82, sy = r.y + H * 0.7; ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 7, [[0, '#a8744a'], [1, '#4a2c16']]); ctx.fillRect(sx0, sy, sx1 - sx0, 7);
    const kinds = ['jar', 'jug', 'olla', 'tall', 'bowl', 'jar'], n = Math.max(3, Math.min(6, Math.round((sx1 - sx0) / 62)));
    for (let k = 0; k < n; k++) vase(ctx, sx0 + ((sx1 - sx0) * (k + 0.5)) / n, sy, H * (0.34 + 0.07 * hash(k, 6)), kinds[k % kinds.length], '#201c1e', { sheen: 0.4, gloss: 0.3, inside: '#050404' });
  },
  greenrack(ctx, s, r, H, t) { // Atzompa: a warm ochre wall with a wooden rack of green-glazed pitchers, plates and hanging cups
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.18)], [1, tint(s.wallC, -0.12)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let k = 0; k < 40; k++) { ctx.fillStyle = `rgba(70,36,12,${0.05 + 0.05 * hash(k, 3)})`; ell(ctx, r.x + r.w * hash(k, 1), r.y + H * hash(k, 2), 6 + 16 * hash(k, 4), 3 + 5 * hash(k, 5)); ctx.fill(); }
    const dh = H * 0.2, dy = r.y + H - dh; ctx.fillStyle = '#f0e4c0'; ctx.fillRect(r.x, dy, r.w, dh);   // a painted zigzag border along the bottom
    ctx.fillStyle = '#2d6a3e'; ctx.beginPath(); ctx.moveTo(r.x, dy + dh); for (let x = r.x; x <= r.x + r.w + 18; x += 18) { ctx.lineTo(x + 9, dy + 3); ctx.lineTo(x + 18, dy + dh); } ctx.closePath(); ctx.fill();
    const rx0 = r.x + r.w * 0.08, rx1 = r.x + r.w * 0.92, ys = [r.y + H * 0.46, r.y + H * 0.8];
    ctx.strokeStyle = '#4a2e16'; ctx.lineWidth = 5; for (const px of [rx0, (rx0 + rx1) / 2, rx1]) { ctx.beginPath(); ctx.moveTo(px, r.y + H * 0.08); ctx.lineTo(px, dy); ctx.stroke(); }
    ys.forEach((yy) => { ctx.fillStyle = lg(ctx, 0, yy, 0, yy + 6, [[0, '#9a6a3a'], [1, '#3e2410']]); ctx.fillRect(rx0 - 8, yy, rx1 - rx0 + 16, 6); });
    const G = ['#2f7a45', '#3d9158', '#256c3c'], nt = Math.max(4, Math.round((rx1 - rx0) / 70));
    for (let k = 0; k < nt; k++) { const x = rx0 + ((rx1 - rx0) * (k + 0.5)) / nt; vase(ctx, x, ys[0], H * 0.26, k % 2 ? 'jar' : 'jug', G[k % 3], { sheen: 0.5, gloss: 0.3 }); }
    const np = Math.max(5, Math.round((rx1 - rx0) / 52));
    for (let k = 0; k < np; k++) { const x = rx0 + ((rx1 - rx0) * (k + 0.5)) / np, pr = H * 0.1; ctx.fillStyle = rg(ctx, x - pr * 0.3, ys[1] - pr * 1.2, 1, pr * 1.6, [[0, '#5fb27a'], [1, '#1e5a30']]); ell(ctx, x, ys[1] - pr * 1.0, pr * 0.9, pr); ctx.fill(); ctx.strokeStyle = '#d6b05a'; ctx.lineWidth = 1.5; ctx.stroke(); ell(ctx, x, ys[1] - pr * 1.0, pr * 0.55, pr * 0.62); ctx.strokeStyle = 'rgba(240,230,190,0.7)'; ctx.stroke(); }
    for (let k = 0; k < 4; k++) { const x = rx0 + (rx1 - rx0) * (0.14 + k * 0.24), hy = r.y + H * 0.1; ctx.strokeStyle = '#2a1a0e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, hy + 3); ctx.stroke(); ctx.fillStyle = '#d6a238'; ell(ctx, x, hy + 5, 4, 3); ctx.fill(); } // hooks
  },
  smokepit(ctx, s, r, H, t) { // Tolima: dusk over the river valley, palms and hills, embers glowing at the pit and smoke drifting up
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#1c1830'], [0.55, '#5a2a3c'], [1, '#c8683a']]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let k = 0; k < 26; k++) { ctx.fillStyle = `rgba(255,240,220,${0.25 + 0.4 * hash(k, 7)})`; ctx.fillRect(r.x + r.w * hash(k, 1), r.y + H * 0.45 * hash(k, 2), 1.5, 1.5); }
    ctx.fillStyle = '#2a1a2c'; ctx.beginPath(); ctx.moveTo(r.x, r.y + H); ctx.lineTo(r.x, r.y + H * 0.58); for (let x = 0; x <= r.w; x += r.w / 12) ctx.lineTo(r.x + x, r.y + H * (0.56 - 0.2 * Math.abs(Math.sin(x * 0.011 + 1))) ); ctx.lineTo(r.x + r.w, r.y + H); ctx.fill();
    ctx.fillStyle = '#150f1a'; ctx.beginPath(); ctx.moveTo(r.x, r.y + H); ctx.lineTo(r.x, r.y + H * 0.8); for (let x = 0; x <= r.w; x += r.w / 16) ctx.lineTo(r.x + x, r.y + H * (0.78 - 0.1 * Math.abs(Math.sin(x * 0.017)))); ctx.lineTo(r.x + r.w, r.y + H); ctx.fill();
    palm(ctx, r.x + r.w * 0.1, r.y + H, H * 0.8, '#0e0912'); palm(ctx, r.x + r.w * 0.2, r.y + H, H * 0.56, '#0e0912'); palm(ctx, r.x + r.w * 0.9, r.y + H, H * 0.72, '#0e0912');
    const gx = r.x + r.w * 0.5, gy = r.y + H; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rg(ctx, gx, gy, 4, r.w * 0.34, [[0, 'rgba(255,150,60,0.7)'], [1, 'rgba(255,90,20,0)']]); ctx.fillRect(r.x, r.y, r.w, H); ctx.restore();
    for (let k = 0; k < 7; k++) { const u = ((t * 0.12 + k / 7) % 1), px = gx + r.w * 0.12 + Math.sin(u * 6 + k) * 14 + u * 60, py = gy - u * H * 1.05, pr = 10 + u * 34; ctx.fillStyle = `rgba(190,180,176,${0.2 * (1 - u)})`; ctx.beginPath(); ctx.arc(px, py, pr, 0, TAU); ctx.fill(); }
  },
  ovenyard(ctx, s, r, H, t) { // Pomaire: Andes above a whitewashed yard wall, a tile roof, a domed clay oven with a flame, a stack of firewood
    const wy = r.y + H * 0.34; ctx.fillStyle = lg(ctx, 0, r.y, 0, wy, [[0, '#8cb8e0'], [1, '#e8f0f4']]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.fillStyle = '#9aa8bc'; ctx.beginPath(); ctx.moveTo(r.x, wy); for (let x = 0; x <= r.w + 1; x += r.w / 10) ctx.lineTo(r.x + x, wy - H * (0.12 + 0.2 * Math.abs(Math.sin(x * 0.009 + 0.7)))); ctx.lineTo(r.x + r.w, wy); ctx.fill();
    ctx.fillStyle = '#f6f8fa'; ctx.beginPath(); ctx.moveTo(r.x + r.w * 0.3, wy - H * 0.04); ctx.lineTo(r.x + r.w * 0.34, wy - H * 0.31); ctx.lineTo(r.x + r.w * 0.38, wy - H * 0.04); ctx.fill();
    ctx.fillStyle = lg(ctx, 0, wy, 0, r.y + H, [[0, '#f4ecdc'], [1, s.wallC]]); ctx.fillRect(r.x, wy, r.w, r.y + H - wy);
    for (let x = r.x; x < r.x + r.w + 16; x += 16) { ctx.fillStyle = '#b0452a'; ctx.beginPath(); ctx.arc(x, wy + 2, 8, 0, Math.PI); ctx.fill(); ctx.strokeStyle = 'rgba(60,20,8,0.5)'; ctx.stroke(); }
    const ox = r.x + r.w * 0.8, oy = r.y + H, ow = Math.min(r.w * 0.17, H * 0.95), oh = H * 0.66;
    ctx.fillStyle = lg(ctx, ox - ow, 0, ox + ow, 0, [[0, '#8a5236'], [0.4, '#c88a5a'], [1, '#6a3a24']]); ctx.beginPath(); ctx.moveTo(ox - ow, oy); ctx.bezierCurveTo(ox - ow, oy - oh * 1.3, ox + ow, oy - oh * 1.3, ox + ow, oy); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(40,16,8,0.5)'; ctx.stroke();
    const fl = 0.8 + 0.2 * Math.sin(t * 7) * Math.sin(t * 2.7), aw = ow * 0.42; ctx.fillStyle = '#1a0e08'; ctx.beginPath(); ctx.moveTo(ox - aw, oy); ctx.lineTo(ox - aw, oy - oh * 0.34); ctx.arc(ox, oy - oh * 0.34, aw, Math.PI, 0); ctx.lineTo(ox + aw, oy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = rg(ctx, ox, oy - oh * 0.2, 2, aw * 1.2, [[0, `rgba(255,220,120,${fl})`], [0.5, `rgba(240,100,30,${0.8 * fl})`], [1, 'rgba(60,10,0,0.5)']]); ctx.beginPath(); ctx.moveTo(ox - aw * 0.8, oy); ctx.quadraticCurveTo(ox - aw * 0.9, oy - oh * 0.55, ox, oy - oh * (0.5 + 0.06 * fl)); ctx.quadraticCurveTo(ox + aw * 0.9, oy - oh * 0.55, ox + aw * 0.8, oy); ctx.fill();
    const lx = r.x + r.w * 0.05, lw = Math.min(r.w * 0.22, 140), ly = oy; for (let row = 0; row < 3; row++) for (let k = 0; k < 6 - row; k++) { const x = lx + k * (lw / 6) + row * (lw / 12), y = ly - row * 11 - 6; ctx.fillStyle = '#6a4424'; ell(ctx, x + 8, y, 15, 5.5); ctx.fill(); ctx.fillStyle = '#d6b078'; ell(ctx, x + 22, y, 5.5, 5.5); ctx.fill(); ctx.strokeStyle = '#7a5530'; ctx.lineWidth = 1; ctx.stroke(); }
    const kinds = ['pot', 'olla', 'bowl', 'jar'], bx0 = r.x + r.w * 0.34, bx1 = r.x + r.w * 0.66, n = Math.max(2, Math.round((bx1 - bx0) / 64));
    for (let k = 0; k < n; k++) vase(ctx, bx0 + ((bx1 - bx0) * (k + 0.5)) / n, r.y + H * 0.94, H * (0.3 + 0.08 * hash(k, 3)), kinds[k % 4], hash(k, 4) > 0.5 ? '#a8452c' : '#7a3220', { sheen: 0.18 });
  },
  quincha(ctx, s, r, H, t) { // Chulucanas: a cane-and-mud (quincha) panel in dry-forest sun, leaf shadows, pressed leaves hung to dry
    ctx.fillStyle = s.wallC; ctx.fillRect(r.x, r.y, r.w, H);
    for (let x = r.x; x < r.x + r.w; x += 9) { ctx.fillStyle = hash(x | 0, 3) > 0.5 ? 'rgba(255,240,200,0.18)' : 'rgba(90,60,20,0.16)'; ctx.fillRect(x, r.y, 7, H); ctx.fillStyle = 'rgba(60,36,10,0.25)'; ctx.fillRect(x + 7, r.y, 1.5, H); }
    for (const fy of [0.3, 0.72]) { const yy = r.y + H * fy; ctx.fillStyle = lg(ctx, 0, yy - 4, 0, yy + 4, [[0, '#8a6a3a'], [1, '#4a3016']]); ctx.fillRect(r.x, yy - 4, r.w, 8); ctx.strokeStyle = 'rgba(30,16,6,0.55)'; ctx.lineWidth = 1; for (let x = r.x + 6; x < r.x + r.w; x += 34) { ctx.beginPath(); ctx.moveTo(x, yy - 4); ctx.lineTo(x + 3, yy + 4); ctx.stroke(); } }
    ctx.save(); ctx.fillStyle = 'rgba(40,52,24,0.32)'; for (let k = 0; k < 40; k++) { ctx.save(); ctx.translate(r.x + r.w * hash(k, 11), r.y + H * (0.1 + 0.8 * hash(k, 12))); ctx.rotate((hash(k, 13) - 0.5) * 2); leafP(ctx, 4 + 3 * hash(k, 14), 9 + 6 * hash(k, 15)); ctx.fill(); ctx.restore(); } ctx.restore();
    ctx.strokeStyle = '#2e2216'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(r.x, r.y + H * 0.04); ctx.bezierCurveTo(r.x + r.w * 0.2, r.y + H * 0.2, r.x + r.w * 0.3, r.y - 4, r.x + r.w * 0.5, r.y + H * 0.1); ctx.stroke();
    ctx.lineWidth = 1.6; for (let k = 0; k < 16; k++) { const u = k / 15, bx = r.x + u * r.w * 0.5, by = r.y + H * (0.04 + 0.12 * Math.sin(u * 3)); ctx.fillStyle = '#4a5a2a'; ctx.save(); ctx.translate(bx, by); ctx.rotate(0.6 + k); leafP(ctx, 3, 8); ctx.fill(); ctx.restore(); }
    const ry = r.y + H * 0.26; ctx.strokeStyle = '#4a3418'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r.x + r.w * 0.38, ry); ctx.lineTo(r.x + r.w * 0.96, ry); ctx.stroke();
    const nl = Math.max(4, Math.min(8, Math.round(r.w / 80)));
    for (let k = 0; k < nl; k++) { const x = r.x + r.w * 0.42 + ((r.w * 0.52) * k) / nl; ctx.strokeStyle = '#4a3418'; ctx.beginPath(); ctx.moveTo(x, ry); ctx.lineTo(x, ry + 8); ctx.stroke(); ctx.save(); ctx.translate(x, ry + 8 + H * 0.2); ctx.rotate(Math.PI + (hash(k, 9) - 0.5) * 0.3); ctx.fillStyle = lg(ctx, -9, 0, 9, 0, [[0, '#5a3a1e'], [0.5, '#7a5230'], [1, '#3e2814']]); leafP(ctx, H * 0.1, H * 0.2); ctx.fill(); ctx.strokeStyle = 'rgba(240,226,190,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, H * 0.18); ctx.lineTo(0, -H * 0.18); for (let q = -2; q <= 2; q++) { ctx.moveTo(0, q * H * 0.07 + 4); ctx.lineTo(H * 0.06, q * H * 0.07 - 4); ctx.moveTo(0, q * H * 0.07 + 4); ctx.lineTo(-H * 0.06, q * H * 0.07 - 4); } ctx.stroke(); ctx.restore(); }
  },
  adobemesa(ctx, s, r, H, t) { // Mata Ortiz: a pink adobe wall with log beam ends, a window onto the mesa, a string of red chiles, painted ware on a ledge
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.12)], [1, tint(s.wallC, -0.1)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let k = 0; k < 50; k++) { ctx.fillStyle = `rgba(90,50,28,${0.05 + 0.05 * hash(k, 3)})`; ell(ctx, r.x + r.w * hash(k, 1), r.y + H * (0.25 + 0.75 * hash(k, 2)), 8 + 22 * hash(k, 4), 3 + 6 * hash(k, 5)); ctx.fill(); }
    ctx.fillStyle = '#6a4630'; ctx.fillRect(r.x, r.y, r.w, H * 0.1); for (let x = r.x + 12; x < r.x + r.w; x += 30) { ctx.fillStyle = rg(ctx, x - 2, r.y + H * 0.06, 1, 9, [[0, '#c8946a'], [1, '#6a4228']]); ell(ctx, x, r.y + H * 0.1, 8, 8); ctx.fill(); ctx.strokeStyle = 'rgba(40,20,8,0.5)'; ctx.stroke(); ell(ctx, x, r.y + H * 0.1, 4, 4); ctx.stroke(); }
    const wx = r.x + r.w * 0.22, ww = Math.min(r.w * 0.22, 130), wy = r.y + H * 0.2, wh = H * 0.55;
    ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#a8d0ec'], [0.6, '#f0e6d0'], [1, '#d8a878']]); ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = '#a8704c'; ctx.beginPath(); ctx.moveTo(wx, wy + wh * 0.72); ctx.lineTo(wx + ww * 0.2, wy + wh * 0.42); ctx.lineTo(wx + ww * 0.56, wy + wh * 0.42); ctx.lineTo(wx + ww * 0.7, wy + wh * 0.58); ctx.lineTo(wx + ww, wy + wh * 0.5); ctx.lineTo(wx + ww, wy + wh); ctx.lineTo(wx, wy + wh); ctx.fill();
    ctx.fillStyle = 'rgba(120,70,40,0.5)'; ctx.fillRect(wx, wy + wh * 0.84, ww, 3);
    ctx.strokeStyle = '#1fa5a8'; ctx.lineWidth = 6; ctx.strokeRect(wx - 3, wy - 3, ww + 6, wh + 6); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.stroke();
    const rx = r.x + r.w * 0.62; ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(rx, r.y + H * 0.1); ctx.lineTo(rx, r.y + H * 0.2); ctx.stroke();
    for (let k = 0; k < 9; k++) { const y = r.y + H * 0.2 + k * H * 0.07, sw = 0.7 + 0.3 * Math.sin(k); ctx.save(); ctx.translate(rx + (k % 2 ? 4 : -4), y); ctx.rotate((k % 2 ? 0.35 : -0.35)); ctx.fillStyle = lg(ctx, -6, 0, 6, 0, [[0, '#7a1410'], [0.4, '#d8301e'], [1, '#8a1812']]); ctx.beginPath(); ctx.moveTo(0, -3); ctx.quadraticCurveTo(7 * sw, H * 0.04, 0, H * 0.13); ctx.quadraticCurveTo(-7 * sw, H * 0.04, 0, -3); ctx.fill(); ctx.restore(); }
    const lx0 = r.x + r.w * 0.7, lx1 = r.x + r.w * 0.97, ly = r.y + H * 0.86; ctx.fillStyle = lg(ctx, 0, ly, 0, ly + 6, [[0, '#8a5a38'], [1, '#3e2410']]); ctx.fillRect(lx0, ly, lx1 - lx0, 6);
    const n = Math.max(2, Math.round((lx1 - lx0) / 56)); for (let k = 0; k < n; k++) vase(ctx, lx0 + ((lx1 - lx0) * (k + 0.5)) / n, ly, H * (0.3 + 0.06 * hash(k, 2)), k % 2 ? 'olla' : 'jar', '#ebddbf', { sheen: 0.12, gloss: 0.12, band: '#241a16', inside: '#6a5a4a' });
  },
  colonial(ctx, s, r, H, t) { // Minas Gerais: an ochre colonial facade, blue-framed windows with shutters, a red tile eave, stone base
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.1)], [1, tint(s.wallC, -0.08)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let k = 0; k < 30; k++) { ctx.fillStyle = `rgba(110,70,20,${0.04 + 0.05 * hash(k, 3)})`; ell(ctx, r.x + r.w * hash(k, 1), r.y + H * (0.2 + 0.7 * hash(k, 2)), 10 + 20 * hash(k, 4), 3 + 5 * hash(k, 5)); ctx.fill(); }
    const eh = H * 0.15; ctx.fillStyle = '#7a2e1c'; ctx.fillRect(r.x, r.y, r.w, eh); for (let x = r.x; x < r.x + r.w + 18; x += 18) { ctx.fillStyle = '#b8472a'; ctx.beginPath(); ctx.arc(x, r.y + eh * 0.7, 9, 0, Math.PI); ctx.fill(); ctx.strokeStyle = 'rgba(40,10,4,0.5)'; ctx.stroke(); }
    ctx.fillStyle = '#f2ead4'; ctx.fillRect(r.x, r.y + eh, r.w, 5);
    const bh = H * 0.16, by = r.y + H - bh; ctx.fillStyle = lg(ctx, 0, by, 0, r.y + H, [[0, '#8a8478'], [1, '#5a564e']]); ctx.fillRect(r.x, by, r.w, bh); ctx.strokeStyle = 'rgba(20,18,14,0.5)'; ctx.lineWidth = 1.5; for (let x = r.x; x < r.x + r.w; x += 38) { ctx.strokeRect(x, by, 38, bh); }
    const n = Math.max(2, Math.round(r.w / 190)), wh = H * 0.5, ww = Math.min(54, r.w / (n * 2.4)), wy = r.y + H * 0.26;
    for (let k = 0; k < n; k++) { const x = r.x + (r.w * (k + 0.5)) / n - ww / 2;
      ctx.fillStyle = lg(ctx, x, wy, x, wy + wh, [[0, '#6a98c0'], [1, '#2a3e5a']]); ctx.fillRect(x, wy, ww, wh);
      ctx.strokeStyle = '#2b5fa8'; ctx.lineWidth = 6; ctx.strokeRect(x - 3, wy - 3, ww + 6, wh + 6); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + ww / 2, wy); ctx.lineTo(x + ww / 2, wy + wh); ctx.moveTo(x, wy + wh * 0.5); ctx.lineTo(x + ww, wy + wh * 0.5); ctx.stroke();
      for (const sx of [-1, 1]) { const sx0 = sx < 0 ? x - ww * 0.5 - 6 : x + ww + 6; ctx.fillStyle = '#2b5fa8'; ctx.fillRect(sx0, wy - 3, ww * 0.5, wh + 6); ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; for (let q = 1; q < 8; q++) { ctx.beginPath(); ctx.moveTo(sx0 + 2, wy - 3 + (q * (wh + 6)) / 8); ctx.lineTo(sx0 + ww * 0.5 - 2, wy - 3 + (q * (wh + 6)) / 8); ctx.stroke(); } }
      ctx.fillStyle = '#f2ead4'; ctx.fillRect(x - 8, wy + wh + 3, ww + 16, 5); vase(ctx, x + ww / 2, wy + wh + 3, H * 0.2, k % 2 ? 'jug' : 'jar', k % 2 ? '#a8641e' : '#6a3a1c', { sheen: 0.4, gloss: 0.25 }); }
  },
  tilestall(ctx, s, r, H, t) { // Metepec: a bright teal wall, cut-paper bunting, a shelf of small painted pots and sun plates
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.12)], [1, tint(s.wallC, -0.2)]]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let x = r.x; x < r.x + r.w; x += 40) ctx.fillRect(x, r.y, 20, H);
    const C = ['#e8452c', '#f2b52c', '#c23a8a', '#ffffff', '#6a3ac8', '#2ab06a'], nflag = Math.max(8, Math.round(r.w / 34)), by = r.y + H * 0.04;
    ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(r.x, by); ctx.quadraticCurveTo(r.x + r.w / 2, by + H * 0.12, r.x + r.w, by); ctx.stroke();
    for (let k = 0; k < nflag; k++) { const u = (k + 0.5) / nflag, x = r.x + u * r.w, y = by + 4 * Math.sin(u * Math.PI) * 6 * 0.5 + H * 0.12 * 4 * u * (1 - u), fw = (r.w / nflag) * 0.8, fh = H * 0.2;
      ctx.fillStyle = C[k % C.length]; ctx.beginPath(); ctx.moveTo(x - fw / 2, y); ctx.lineTo(x + fw / 2, y); ctx.lineTo(x + fw / 2, y + fh); for (let z = 0; z < 4; z++) ctx.lineTo(x + fw / 2 - ((z + 0.5) * fw) / 4, y + fh - (z % 2 ? 0 : 6)); ctx.lineTo(x - fw / 2, y + fh); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(20,60,70,0.55)'; for (let z = 0; z < 3; z++) { ctx.beginPath(); ctx.arc(x - fw * 0.25 + z * fw * 0.25, y + fh * 0.4, fw * 0.07, 0, TAU); ctx.fill(); } }
    const sy = r.y + H * 0.82, sx0 = r.x + r.w * 0.08, sx1 = r.x + r.w * 0.92; ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 7, [[0, '#f6e2b0'], [1, '#a8783a']]); ctx.fillRect(sx0, sy, sx1 - sx0, 7);
    const P = ['#e8452c', '#f2b52c', '#c23a8a', '#2ab06a', '#6a3ac8'], n = Math.max(4, Math.round((sx1 - sx0) / 64));
    for (let k = 0; k < n; k++) { const x = sx0 + ((sx1 - sx0) * (k + 0.5)) / n; if (k % 3 === 1) { const pr = H * 0.17; ctx.fillStyle = rg(ctx, x - pr * 0.3, sy - pr * 1.2, 1, pr * 1.6, [[0, tint(P[k % 5], 0.35)], [1, tint(P[k % 5], -0.2)]]); ell(ctx, x, sy - pr, pr, pr); ctx.fill(); ctx.strokeStyle = '#fff3d0'; ctx.lineWidth = 1.4; ctx.stroke(); for (let q = 0; q < 12; q++) { const a = (q * TAU) / 12; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * pr * 0.45, sy - pr + Math.sin(a) * pr * 0.45); ctx.lineTo(x + Math.cos(a) * pr * 0.78, sy - pr + Math.sin(a) * pr * 0.78); ctx.stroke(); } } else vase(ctx, x, sy, H * (0.34 + 0.06 * hash(k, 2)), k % 2 ? 'jar' : 'jug', P[k % 5], { sheen: 0.3, gloss: 0.25 }); }
  },
};

// ---- floors: bench grounds -------------------------------------------------------------------------------------------------------------------
const floorKinds = { sandcourt: 'felt', saltillo: 'slate', riversand: 'felt', brick: 'slate', cane: 'weave', adobepave: 'slate', cementtile: 'slate' };
const floorEx = {
  sandcourt(ctx, r) { ctx.strokeStyle = 'rgba(90,60,30,0.16)'; ctx.lineWidth = 1.5; for (let y = r.y + 14; y < r.y + r.h; y += 11) { ctx.beginPath(); ctx.moveTo(r.x, y); for (let x = r.x; x <= r.x + r.w; x += 30) ctx.lineTo(x + 15, y + 2 * Math.sin(x * 0.07 + y)); ctx.stroke(); } for (let k = 0; k < 60; k++) { ctx.fillStyle = 'rgba(70,46,24,0.3)'; ell(ctx, r.x + r.w * hash(k, 61), r.y + r.h * hash(k, 62), 2.2, 1.4); ctx.fill(); } },
  saltillo(ctx, r) { const t = 54; for (let y = r.y; y < r.y + r.h; y += t) for (let x = r.x - ((y / t) % 2 ? t / 2 : 0); x < r.x + r.w; x += t) { ctx.fillStyle = `rgba(${hash(x | 0, y | 0, 7) > 0.5 ? '255,200,150' : '60,20,5'},${0.05 + 0.08 * hash(x | 0, y | 0, 8)})`; ctx.fillRect(x, y, t, t); ctx.strokeStyle = 'rgba(40,16,6,0.4)'; ctx.lineWidth = 2; ctx.strokeRect(x, y, t, t); } },
  riversand(ctx, r) { for (let k = 0; k < 120; k++) { ctx.fillStyle = `rgba(${hash(k, 71) > 0.5 ? '200,190,180' : '20,14,12'},${0.1 + 0.14 * hash(k, 72)})`; ell(ctx, r.x + r.w * hash(k, 73), r.y + r.h * hash(k, 74), 2 + 5 * hash(k, 75), 1.4 + 2 * hash(k, 76)); ctx.fill(); } ctx.strokeStyle = 'rgba(90,110,40,0.5)'; ctx.lineWidth = 1.5; for (let k = 0; k < 14; k++) { const x = r.x + r.w * hash(k, 77), y = r.y + r.h * (0.1 + 0.2 * hash(k, 78)); ctx.beginPath(); for (let q = -2; q <= 2; q++) { ctx.moveTo(x, y + 10); ctx.lineTo(x + q * 4, y - 6 - Math.abs(q)); } ctx.stroke(); } },
  brick(ctx, r) { const bw = 62, bh = 24; for (let y = r.y, row = 0; y < r.y + r.h; y += bh, row++) for (let x = r.x - (row % 2 ? bw / 2 : 0); x < r.x + r.w; x += bw) { ctx.fillStyle = `rgba(${hash(x | 0, y | 0, 5) > 0.5 ? '255,170,120' : '50,14,6'},${0.05 + 0.1 * hash(x | 0, y | 0, 6)})`; ctx.fillRect(x + 1, y + 1, bw - 2, bh - 2); ctx.strokeStyle = 'rgba(230,216,190,0.28)'; ctx.lineWidth = 2; ctx.strokeRect(x, y, bw, bh); } },
  cane(ctx, r) { ctx.lineWidth = 3; for (let d = -r.h; d < r.w; d += 12) { ctx.strokeStyle = (d / 12) % 2 ? 'rgba(255,232,170,0.16)' : 'rgba(70,44,12,0.2)'; ctx.beginPath(); ctx.moveTo(r.x + d, r.y); ctx.lineTo(r.x + d + r.h, r.y + r.h); ctx.stroke(); } ctx.strokeStyle = 'rgba(70,44,12,0.2)'; for (let d = 0; d < r.w + r.h; d += 12) { ctx.beginPath(); ctx.moveTo(r.x + d, r.y); ctx.lineTo(r.x + d - r.h, r.y + r.h); ctx.stroke(); } },
  adobepave(ctx, r) { ctx.strokeStyle = 'rgba(40,28,18,0.4)'; ctx.lineWidth = 2.5; let k = 0; for (let y = r.y; y < r.y + r.h + 40; y += 44) for (let x = r.x - 30; x < r.x + r.w + 40; x += 66, k++) { const ox = (hash(k, 81) - 0.5) * 14, oy = (hash(k, 82) - 0.5) * 10; ctx.fillStyle = `rgba(255,245,225,${0.04 + 0.08 * hash(k, 83)})`; rrect(ctx, x + ox, y + oy, 62, 40, 8); ctx.fill(); ctx.stroke(); } },
  cementtile(ctx, r) { const t = 52; for (let y = r.y, j = 0; y < r.y + r.h; y += t, j++) for (let x = r.x, i = 0; x < r.x + r.w; x += t, i++) { const a = (i + j) % 2; ctx.fillStyle = a ? 'rgba(30,140,150,0.5)' : 'rgba(250,236,200,0.38)'; ctx.fillRect(x, y, t, t); ctx.fillStyle = a ? 'rgba(250,236,200,0.5)' : 'rgba(210,90,60,0.5)'; ctx.beginPath(); ctx.moveTo(x + t / 2, y + 6); ctx.lineTo(x + t - 6, y + t / 2); ctx.lineTo(x + t / 2, y + t - 6); ctx.lineTo(x + 6, y + t / 2); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(30,20,10,0.35)'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, t, t); } },
};

// ---- litter on the bench ---------------------------------------------------------------------------------------------------------------------
const litter = {
  ashflecks(ctx, r, c) { for (let k = 0; k < 14; k++) { ctx.fillStyle = rgba(c, 0.35 + 0.3 * hash(k, 91)); ell(ctx, r.x + r.w * hash(k, 92), r.y + r.h * (0.3 + 0.6 * hash(k, 93)), 2 + 4 * hash(k, 94), 1.2 + 2 * hash(k, 95)); ctx.fill(); } },
  chips(ctx, r, c) { for (let k = 0; k < 9; k++) { ctx.save(); ctx.translate(r.x + r.w * hash(k, 96), r.y + r.h * (0.35 + 0.55 * hash(k, 97))); ctx.rotate(hash(k, 98) * 3); ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(0, -3); ctx.lineTo(7, 1); ctx.lineTo(1, 4); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.stroke(); ctx.restore(); } },
};

// ---- reference frames ------------------------------------------------------------------------------------------------------------------------
const glow = (ctx, x, y, w, h, c0, c1) => { ctx.fillStyle = rg(ctx, x + w / 2, y + h * 0.35, 2, Math.max(w, h) * 0.95, [[0, c0], [1, c1]]); ctx.fillRect(x, y, w, h); };
const frames = {
  adobearch(ctx, s, x, y, w, h) { // lime-washed adobe arch with a blue edge
    const ar = w * 0.5, path = () => { ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + ar); ctx.arc(x + w / 2, y + ar, ar, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.closePath(); };
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6; path(); ctx.fillStyle = '#efe0bc'; ctx.fill(); ctx.restore();
    path(); ctx.fillStyle = '#efe0bc'; ctx.fill(); const q = 9; ctx.save(); ctx.beginPath(); ctx.moveTo(x + q, y + h); ctx.lineTo(x + q, y + ar); ctx.arc(x + w / 2, y + ar, ar - q, Math.PI, 0); ctx.lineTo(x + w - q, y + h); ctx.closePath(); ctx.clip();
    glow(ctx, x, y, w, h, 'rgba(255,214,150,0.9)', 'rgba(40,24,14,1)'); ctx.fillStyle = lg(ctx, 0, y + h * 0.88, 0, y + h, [[0, '#b89060'], [1, '#5a3a20']]); ctx.fillRect(x, y + h * 0.88, w, h * 0.12); ctx.restore();
    path(); ctx.strokeStyle = '#2a6aa8'; ctx.lineWidth = 4; ctx.stroke();
    return { x: x + q, y: y + ar * 0.35, w: w - q * 2, h: h - ar * 0.35 - 2 };
  },
  greencase(ctx, s, x, y, w, h) { // a green-painted wooden frame with a cream inner border and a plank shelf
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 6; rrect(ctx, x, y, w, h, 10); ctx.fillStyle = '#245f38'; ctx.fill(); ctx.restore();
    ctx.fillStyle = lg(ctx, x, y, x + w, y + h, [[0, '#2f7a45'], [1, '#17482a']]); rrect(ctx, x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = '#efe2b8'; ctx.lineWidth = 2; rrect(ctx, x + 6, y + 6, w - 12, h - 12, 6); ctx.stroke();
    ctx.fillStyle = 'rgba(18,14,10,0.9)'; rrect(ctx, x + 11, y + 11, w - 22, h - 22, 4); ctx.fill(); glow(ctx, x + 11, y + 11, w - 22, h - 22, 'rgba(255,236,190,0.5)', 'rgba(255,236,190,0)');
    ctx.fillStyle = lg(ctx, 0, y + h - 22, 0, y + h - 8, [[0, '#d6b27a'], [1, '#7a5230']]); ctx.fillRect(x + 11, y + h - 22, w - 22, 12);
    return { x: x + 11, y: y + 11, w: w - 22, h: h - 33 };
  },
  tondo(ctx, s, x, y, w, h) { // a round window of stones onto the dusk, as seen from the pit
    const cx = x + w / 2, cy = y + h / 2, R = Math.min(w, h) / 2;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6; ctx.fillStyle = '#2a2220'; ell(ctx, cx, cy, R, R); ctx.fill(); ctx.restore();
    ctx.save(); ell(ctx, cx, cy, R - 6, R - 6); ctx.clip(); ctx.fillStyle = lg(ctx, 0, cy - R, 0, cy + R, [[0, '#1c1830'], [0.6, '#6a2e3a'], [1, '#d06a38']]); ctx.fillRect(x, y, w, h);
    ctx.fillStyle = rg(ctx, cx, cy + R * 0.9, 2, R * 1.1, [[0, 'rgba(255,170,70,0.55)'], [1, 'rgba(255,90,20,0)']]); ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#120c14'; ctx.beginPath(); ctx.moveTo(x, cy + R * 0.5); ctx.lineTo(cx - R * 0.4, cy + R * 0.18); ctx.lineTo(cx + R * 0.1, cy + R * 0.42); ctx.lineTo(cx + R * 0.6, cy + R * 0.1); ctx.lineTo(x + w, cy + R * 0.5); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.fill(); ctx.restore();
    for (let k = 0; k < 26; k++) { const a = (k / 26) * TAU, rr = R - 3; ctx.fillStyle = hash(k, 9) > 0.5 ? '#6a625c' : '#4a4440'; ell(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 8 + 4 * hash(k, 10), 6 + 3 * hash(k, 11), a); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.stroke(); }
    const q = R * 0.2929; return { x: cx - R + q + 4, y: cy - R + q + 4, w: (R - q - 4) * 2, h: (R - q - 4) * 2 };
  },
  stepwindow(ctx, s, x, y, w, h) { // a whitewashed stepped window with red trim
    const st = Math.min(w, h) * 0.1, path = () => { ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + st * 2); ctx.lineTo(x + st, y + st * 2); ctx.lineTo(x + st, y + st); ctx.lineTo(x + st * 2, y + st); ctx.lineTo(x + st * 2, y); ctx.lineTo(x + w - st * 2, y); ctx.lineTo(x + w - st * 2, y + st); ctx.lineTo(x + w - st, y + st); ctx.lineTo(x + w - st, y + st * 2); ctx.lineTo(x + w, y + st * 2); ctx.lineTo(x + w, y + h); ctx.closePath(); };
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 6; path(); ctx.fillStyle = '#f2ead8'; ctx.fill(); ctx.restore();
    path(); ctx.fillStyle = '#f2ead8'; ctx.fill(); ctx.strokeStyle = '#b0452a'; ctx.lineWidth = 4; ctx.stroke();
    const q = 10; ctx.fillStyle = '#1b130e'; ctx.fillRect(x + q, y + st * 2 + 2, w - q * 2, h - st * 2 - q - 2); glow(ctx, x + q, y + st * 2, w - q * 2, h - st * 2 - q, 'rgba(255,200,140,0.55)', 'rgba(255,200,140,0)');
    return { x: x + q, y: y + st * 2 + 2, w: w - q * 2, h: h - st * 2 - q - 2 };
  },
  matframe(ctx, s, x, y, w, h) { // a woven reed border round a dark panel
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 6; ctx.fillStyle = '#a8844c'; ctx.fillRect(x, y, w, h); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); for (let d = -h; d < w; d += 9) { ctx.strokeStyle = (d / 9) % 2 ? 'rgba(255,232,170,0.35)' : 'rgba(70,44,12,0.35)'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(x + d, y); ctx.lineTo(x + d + h, y + h); ctx.stroke(); } ctx.restore();
    const q = 14; ctx.fillStyle = '#18130e'; ctx.fillRect(x + q, y + q, w - q * 2, h - q * 2); glow(ctx, x + q, y + q, w - q * 2, h - q * 2, 'rgba(255,226,170,0.5)', 'rgba(255,226,170,0)'); ctx.strokeStyle = '#3a2810'; ctx.lineWidth = 3; ctx.strokeRect(x + q, y + q, w - q * 2, h - q * 2);
    return { x: x + q, y: y + q, w: w - q * 2, h: h - q * 2 };
  },
  tinniche(ctx, s, x, y, w, h) { // a tin-punched niche with a turquoise border
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 6; rrect(ctx, x, y, w, h, 6); ctx.fillStyle = '#9aa0a6'; ctx.fill(); ctx.restore();
    ctx.fillStyle = lg(ctx, x, y, x + w, y + h, [[0, '#d8dde2'], [0.5, '#9aa0a6'], [1, '#6a7076']]); rrect(ctx, x, y, w, h, 6); ctx.fill();
    ctx.fillStyle = 'rgba(30,34,40,0.55)'; for (let px = x + 8; px < x + w - 4; px += 10) { ctx.beginPath(); ctx.arc(px, y + 8, 2, 0, TAU); ctx.arc(px, y + h - 8, 2, 0, TAU); ctx.fill(); } for (let py = y + 18; py < y + h - 14; py += 10) { ctx.beginPath(); ctx.arc(x + 8, py, 2, 0, TAU); ctx.arc(x + w - 8, py, 2, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#1fa5a8'; ctx.lineWidth = 5; ctx.strokeRect(x + 16, y + 16, w - 32, h - 32); const q = 20; ctx.fillStyle = '#17120e'; ctx.fillRect(x + q, y + q, w - q * 2, h - q * 2); glow(ctx, x + q, y + q, w - q * 2, h - q * 2, 'rgba(255,230,190,0.5)', 'rgba(255,230,190,0)');
    return { x: x + q, y: y + q, w: w - q * 2, h: h - q * 2 };
  },
  bluewindow(ctx, s, x, y, w, h) { // a colonial window with blue painted frame, shutters and a white sill
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 6; ctx.fillStyle = '#2b5fa8'; ctx.fillRect(x, y, w, h); ctx.restore();
    ctx.fillStyle = lg(ctx, x, y, x + w, y + h, [[0, '#3a74c0'], [1, '#1e4684']]); ctx.fillRect(x, y, w, h); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; for (let k = 1; k < 12; k++) { ctx.beginPath(); ctx.moveTo(x + 4, y + (k * h) / 12); ctx.lineTo(x + w - 4, y + (k * h) / 12); ctx.stroke(); }
    const q = 14; ctx.fillStyle = '#1a1410'; ctx.fillRect(x + q, y + q, w - q * 2, h - q * 2 - 8); glow(ctx, x + q, y + q, w - q * 2, h - q * 2 - 8, 'rgba(255,214,150,0.55)', 'rgba(255,214,150,0)');
    ctx.fillStyle = lg(ctx, 0, y + h - 14, 0, y + h, [[0, '#fbf5e4'], [1, '#c8bca0']]); ctx.fillRect(x - 5, y + h - 14, w + 10, 12);
    return { x: x + q, y: y + q, w: w - q * 2, h: h - q * 2 - 8 };
  },
  papelframe(ctx, s, x, y, w, h) { // a bright painted frame with a scalloped edge
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 6; rrect(ctx, x, y, w, h, 8); ctx.fillStyle = '#c23a8a'; ctx.fill(); ctx.restore();
    ctx.fillStyle = lg(ctx, x, y, x + w, y + h, [[0, '#d84a9a'], [1, '#8a2468']]); rrect(ctx, x, y, w, h, 8); ctx.fill();
    ctx.fillStyle = '#f2b52c'; for (let px = x + 10; px < x + w - 4; px += 16) { ctx.beginPath(); ctx.arc(px, y + 7, 5, 0, Math.PI); ctx.arc(px, y + h - 7, 5, Math.PI, 0); ctx.fill(); } ctx.fillStyle = '#1fa3a0'; for (let py = y + 22; py < y + h - 14; py += 16) { ctx.beginPath(); ctx.arc(x + 7, py, 4, Math.PI / 2, -Math.PI / 2); ctx.arc(x + w - 7, py, 4, -Math.PI / 2, Math.PI / 2); ctx.fill(); }
    const q = 17; ctx.fillStyle = '#16100e'; ctx.fillRect(x + q, y + q, w - q * 2, h - q * 2); glow(ctx, x + q, y + q, w - q * 2, h - q * 2, 'rgba(255,224,190,0.55)', 'rgba(255,224,190,0)'); ctx.strokeStyle = '#fff3d0'; ctx.lineWidth = 2; ctx.strokeRect(x + q, y + q, w - q * 2, h - q * 2);
    return { x: x + q, y: y + q, w: w - q * 2, h: h - q * 2 };
  },
};

// ---- props for the tool docks ----------------------------------------------------------------------------------------------------------------
registerProp('burnstone', (ctx, s, o) => { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, s * 0.04, s * 0.1, s * 0.3, s * 0.1); ctx.fill(); ctx.fillStyle = rg(ctx, -s * 0.08, -s * 0.06, 1, s * 0.34, [[0, '#e8e2da'], [0.6, o.c ?? '#8a8680'], [1, '#3a3632']]); ell(ctx, 0, 0, s * 0.3, s * 0.18, -0.2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ell(ctx, -s * 0.1, -s * 0.07, s * 0.07, s * 0.03, -0.4); ctx.fill(); });
registerProp('leaf', (ctx, s, o) => { ctx.save(); ctx.rotate(-0.5); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.translate(2, 3); leafP(ctx, s * 0.2, s * 0.4); ctx.fill(); ctx.translate(-2, -3); ctx.fillStyle = lg(ctx, -s * 0.2, 0, s * 0.2, 0, [[0, '#3e5a22'], [0.5, o.c ?? '#6a8a3a'], [1, '#2e4418']]); leafP(ctx, s * 0.2, s * 0.4); ctx.fill(); ctx.strokeStyle = 'rgba(240,236,190,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, s * 0.36); ctx.lineTo(0, -s * 0.36); for (let q = -2; q <= 2; q++) { ctx.moveTo(0, q * s * 0.14 + 3); ctx.lineTo(s * 0.12, q * s * 0.14 - 5); ctx.moveTo(0, q * s * 0.14 + 3); ctx.lineTo(-s * 0.12, q * s * 0.14 - 5); } ctx.stroke(); ctx.restore(); });
registerProp('gourd', (ctx, s, o) => { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, s * 0.04, s * 0.12, s * 0.32, s * 0.09); ctx.fill(); ctx.fillStyle = lg(ctx, -s * 0.3, 0, s * 0.3, 0, [[0, '#7a4a1e'], [0.4, o.c ?? '#d89a4a'], [1, '#5a3412']]); ctx.beginPath(); ctx.moveTo(-s * 0.3, 0); ctx.quadraticCurveTo(0, s * 0.34, s * 0.3, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#2a1608'; ell(ctx, 0, 0, s * 0.3, s * 0.08); ctx.fill(); ctx.strokeStyle = '#f0c87a'; ctx.lineWidth = 1.5; ctx.stroke(); });
registerProp('sherd', (ctx, s, o) => { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, s * 0.04, s * 0.14, s * 0.3, s * 0.08); ctx.fill(); ctx.fillStyle = lg(ctx, -s * 0.3, 0, s * 0.3, 0, [[0, '#9a7a56'], [0.5, o.c ?? '#ecdcbc'], [1, '#8a6c48']]); ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.06); ctx.lineTo(-s * 0.2, -s * 0.12); ctx.lineTo(s * 0.12, -s * 0.16); ctx.lineTo(s * 0.3, -s * 0.02); ctx.lineTo(s * 0.18, s * 0.12); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#211a18'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-s * 0.18, -s * 0.06); ctx.lineTo(s * 0.04, -s * 0.1); ctx.lineTo(s * 0.2, 0); ctx.stroke(); });
registerProp('corncob', (ctx, s, o) => { ctx.save(); ctx.rotate(-0.6); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 2, 4, s * 0.12, s * 0.34); ctx.fill(); ctx.fillStyle = lg(ctx, -s * 0.12, 0, s * 0.12, 0, [[0, '#b8842a'], [0.5, o.c ?? '#f0c850'], [1, '#9a6a1c']]); ell(ctx, 0, 0, s * 0.12, s * 0.32); ctx.fill(); ctx.strokeStyle = 'rgba(120,70,10,0.5)'; ctx.lineWidth = 1; for (let k = -4; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(-s * 0.1, k * s * 0.07); ctx.lineTo(s * 0.1, k * s * 0.07); ctx.stroke(); } ctx.restore(); });

// ---- workshops ------------------------------------------------------------------------------------------------------------------------------
const W = (c, shape, glaze, win, ok) => ({ caption: c, shape, glaze, win, ok, retry: 'Back to the clay' });
const scenes = {
  oaxaca: { wall: 'kilncourt', wallC: '#dcc592', floor: 'sandcourt', floorC: '#b99d70', light: 'window', litter: [{ k: 'chips', c: '#3a3234' }], dock: ['burnstone', 'bowl', 'pot:#d8d0c4', 'caliper'], dockKind: 'ledge', frame: 'adobearch',
    rig: 'turn', turnC: '#7a5a3a', tool: 'rib', top: 'open', vessel: 'fine', view: 0.22, wscale: 0.7, hscale: 0.86, sheen: 0.9, count: { pierced: 7 }, inside: '#241f21', motifs: ['polish', 'rings', 'pierced', 'rings', 'polish'], inkLight: ['#2a2020'], inkDark: '#d9d0c4',
    words: W('Shape this black-clay jar', 'Drag across the clay to set its width', 'Tap a band to burnish it, leave it matt or keep the raw clay', 'A jar ready for the kiln', 'A good jar'), pitch: 0.82, wave: 'sine' },
  atzompa: { wall: 'greenrack', wallC: '#b8793f', floor: 'saltillo', floorC: '#a85f3a', light: 'window', litter: [{ k: 'clay', c: '#8a4a28' }], dock: ['pot:#2f7a45', 'pot:#eadfc0', 'brush:#2f7a45', 'sponge'], dockKind: 'ledge', frame: 'greencase',
    rig: 'wheel', tool: 'rib', top: 'open', vessel: 'fine', view: 0.22, wscale: 0.64, hscale: 0.92, handle: true, motifs: ['greenleaf', 'dots', 'greenleaf', 'dots', 'greenleaf'], inkLight: ['#2a6a3a'], inkDark: '#f0e6bc', inside: '#1c4a2a',
    words: W('Throw this green-glazed pitcher', 'Drag across the clay to set its width', 'Tap a band to glaze it green, honey or cream', 'A pitcher with a bright green glaze', 'A good pitcher'), pitch: 1.0, wave: 'triangle' },
  chamba: { wall: 'smokepit', wallC: '#3a2430', floor: 'riversand', floorC: '#3a2f2a', light: 'lamp', litter: [{ k: 'ashflecks', c: '#cfc8c0' }], dock: ['burnstone', 'gourd', 'pot:#1a1514', 'corncob'], dockKind: 'ledge', frame: 'tondo',
    rig: 'pit', tool: 'rib', top: 'open', vessel: 'fine', view: 0.2, wscale: 0.66, hscale: 0.78, lid: true, ears: true, smoke: 0.95, matt: true, sheen: 0.3, motifs: ['polish', 'rings', 'polish'], inkLight: ['#3a2a22'], inkDark: '#a89a8c', inside: '#0a0706',
    words: W('Shape this lidded cooking pot', 'Drag across the clay to set the walls of the pot', 'Tap a band to smoke it black, slip it red or polish it brown', 'A pot for the smoke pit', 'A good pot'), pitch: 0.72, wave: 'sine' },
  pomaire: { wall: 'ovenyard', wallC: '#e6d8bc', floor: 'brick', floorC: '#9a4a32', light: 'window', litter: [{ k: 'chips', c: '#a8452c' }], dock: ['mudbowl', 'sponge', 'pot:#a8452c', 'caliper'], dockKind: 'ledge', frame: 'stepwindow',
    rig: 'kick', tool: 'rib', top: 'open', vessel: 'fine', view: 0.24, wscale: 0.68, hscale: 0.86, ears: true, earsAt: 0.3, matt: true, sheen: 0.2, motifs: ['rings', 'dots', 'rings', 'none', 'rings'], inkLight: ['#3a1a12'], inkDark: '#e8d6b4', inside: '#3a1a12',
    words: W('Throw this red-clay casserole', 'Drag across the clay to set its width', 'Tap a band to slip it red, black or cream', 'A casserole for the wood oven', 'A good casserole'), pitch: 0.9, wave: 'triangle' },
  chulucanas: { wall: 'quincha', wallC: '#cdb07a', floor: 'cane', floorC: '#a98a58', light: 'window', litter: [{ k: 'grass', c: '#8a7a3a' }], dock: ['leaf:#6a8a3a', 'burnstone', 'pot:#1e1a18', 'sponge'], dockKind: 'ledge', frame: 'matframe',
    rig: 'turn', turnC: '#6a4a30', tool: 'rib', top: 'open', vessel: 'fine', view: 0.22, wscale: 0.62, hscale: 0.94, sheen: 0.5, count: { leafresist: 5 }, motifs: ['leafresist', 'rings', 'leafresist', 'rings', 'leafresist'], inkLight: ['#2a1d16'], inkDark: '#ecdcb8', inside: '#2a1d16',
    words: W('Shape this vase for leaf resist', 'Drag across the clay to set its width', 'Tap a band to leave it pale, smoke it or burn it brown', 'A vase with pale leaf prints', 'A good vase'), pitch: 1.05, wave: 'sine' },
  mataortiz: { wall: 'adobemesa', wallC: '#c99a74', floor: 'adobepave', floorC: '#a58f78', light: 'window', litter: [{ k: 'chips', c: '#ecdcbc' }], dock: ['sherd:#ecdcbc', 'brush:#211a18', 'pot:#a8482c', 'burnstone'], dockKind: 'ledge', frame: 'tinniche',
    rig: 'turn', turnC: '#9a7a58', tool: 'rib', top: 'open', vessel: 'fine', view: 0.2, wscale: 0.74, hscale: 0.88, matt: true, sheen: 0.28, motifs: ['fret', 'dots', 'fret', 'rings', 'fret'], inkLight: ['#1e1815'], inkDark: '#ecdcc0', inside: '#6a5a4a',
    words: W('Shape this thin-walled jar', 'Drag across the clay to set its width', 'Tap a band to slip it cream, paint it black or rust red', 'A fine painted jar', 'A good jar'), pitch: 1.1, wave: 'triangle' },
  metepec: { wall: 'tilestall', wallC: '#1b7f8c', floor: 'cementtile', floorC: '#d8c9a0', light: 'window', litter: [{ k: 'splash', c: '#c23a8a' }], dock: ['pot:#e8452c', 'pot:#f2b52c', 'brush:#c23a8a', 'sponge'], dockKind: 'ledge', frame: 'papelframe',
    rig: 'wheel', tool: 'rib', top: 'open', vessel: 'fine', view: 0.23, wscale: 0.66, hscale: 0.92, motifs: ['applied', 'dots', 'applied', 'scale', 'applied'], inkLight: ['#7a1e4a'], inkDark: '#fff3d0', inside: '#1a5a62',
    words: W('Throw this jar for applied relief', 'Drag across the clay to set its width', 'Tap a band to colour it turquoise, marigold or magenta', 'A jar with modelled flowers', 'A good jar'), pitch: 1.15, wave: 'triangle' },
  saramenha: { wall: 'colonial', wallC: '#e0b24a', floor: 'planks', floorC: '#7a5638', light: 'window', litter: [{ k: 'clay', c: '#a8641e' }], dock: ['mudbowl', 'sponge', 'pot:#a8641e', 'caliper'], dockKind: 'ledge', frame: 'bluewindow',
    rig: 'wheel', tool: 'rib', top: 'open', vessel: 'fine', view: 0.22, wscale: 0.62, hscale: 0.94, ears: true, earsAt: 0.12, motifs: ['vine', 'wave', 'dots', 'wave', 'vine'], inkLight: ['#4a2a10'], inkDark: '#f2dca0', inside: '#3a1e0c',
    words: W('Throw this glazed water jar', 'Drag across the clay to set its width', 'Tap a band to glaze it honey, brown or green', 'A water jar with a warm glaze', 'A good water jar'), pitch: 0.95, wave: 'triangle' },
};
registerSceneSet({
  scenes: Object.fromEntries(Object.entries(scenes).map(([id, s]) => [id, { ...s, hang: [] }])),
  rules: [['oaxaca', /barro negro|black.?clay|oaxaca/i], ['atzompa', /atzompa|green.?glaze/i], ['chamba', /la chamba|tolima/i], ['pomaire', /pomaire/i], ['chulucanas', /chulucanas/i], ['mataortiz', /mata ortiz|casas grandes/i], ['metepec', /metepec/i], ['saramenha', /saramenha/i]],
  walls, floorKinds, floorEx, litter, frames,
  soundMat: { oaxaca: 'clay', atzompa: 'clay', chamba: 'clay', pomaire: 'clay', chulucanas: 'clay', mataortiz: 'clay', metepec: 'clay', saramenha: 'clay' },
});

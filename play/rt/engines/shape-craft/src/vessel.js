// shape-craft lathe, fine vessel look (1.10.0): a smooth silhouette seen from above, a lit rounded lip with a visible inside wall (or a painted
// floor on a shallow bowl), a handle where the form has one, and painted or stamped motifs that differ from band to band.
// Used only by scenes that set `vessel: 'fine'` (jaipur, marginea, boleslawiec, deruta); every other lathe scene keeps drawVessel in lathe.js.
// Pure canvas 2D, deterministic (hash, never Math.random).
import { hash } from './geom.js';
import { tint, rgba, litEdge, lum, mix } from './fx.js';
import { DECO } from './doll.js';
import { drawGlassVessel } from './glass.js';

const TAU = Math.PI * 2;
const rrectP = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };

// Catmull-Rom through the row radii (row centres), clamped at both ends: a smooth profile instead of a polyline of steps
function profileFn(radii, unit, base, H) {
  const n = radii.length, rowH = H / n, top = base - H;
  // the drawn profile is a gently relaxed copy of the row radii (two passes of 1-2-1), so quantised steps read as a thrown, rounded wall; scoring still uses the exact radii
  let sm = radii.slice();
  for (let pass = 0; pass < 2; pass++) sm = sm.map((v, i) => (i === 0 || i === n - 1 ? v : (sm[i - 1] + 2 * v + sm[i + 1]) / 4));
  const at = (i) => sm[Math.max(0, Math.min(n - 1, i))] * unit;
  const R = (y) => {
    const f = Math.max(0, Math.min(n - 1, (base - y) / rowH - 0.5)), i = Math.floor(f), t = f - i;
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const v = 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
    return Math.max(2, v);
  };
  return { R, top, rowH, n };
}

export function fineOutline(ctx, o) {   // the silhouette as the current path (also the guide outline)
  const { cx, base, H, unit, radii } = o, { R, top } = profileFn(radii, unit, base, H), M = 72, ev = o.ev ?? 0.2;
  const r0 = R(base), sag = Math.max(2, r0 * ev * 0.9);
  ctx.beginPath(); ctx.moveTo(cx - R(top), top);
  for (let j = 1; j <= M; j++) { const y = top + ((base - top) * j) / M; ctx.lineTo(cx - R(y), y); }
  ctx.quadraticCurveTo(cx, base + sag * 2, cx + R(base), base);
  for (let j = M - 1; j >= 0; j--) { const y = top + ((base - top) * j) / M; ctx.lineTo(cx + R(y), y); }
  if (o.dome) { const rt = R(top), c = rt * o.dome / 0.75; ctx.bezierCurveTo(cx + rt, top - c, cx - rt, top - c, cx - rt, top); }   // 1.15.0: a solid doll head closes in a dome (no mouth)
  ctx.closePath();
}

// ---- painted motifs: each is drawn at the origin, `u` = half the band height, squashed sideways by cv (the turn of the vessel) -----------------
const pet = (ctx, a, d, w, h) => { ctx.beginPath(); ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d, w, h, a, 0, TAU); ctx.fill(); };
const leafShape = (ctx, w, h) => { ctx.beginPath(); ctx.moveTo(0, h); ctx.quadraticCurveTo(w, h * 0.2, 0, -h); ctx.quadraticCurveTo(-w, h * 0.2, 0, h); ctx.closePath(); ctx.fill(); };
const speckle = (ctx, r, base, ink, seed, n = 9) => { // sponge texture: tiny gaps in the paint and spatter round the edge
  ctx.fillStyle = rgba(base, 0.5); for (let q = 0; q < n; q++) { const a = hash(seed, q, 1) * TAU, d = r * 0.9 * Math.sqrt(hash(seed, q, 2)); ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d, Math.max(0.6, r * 0.06), 0, TAU); ctx.fill(); }
  ctx.fillStyle = rgba(ink, 0.7); for (let q = 0; q < 5; q++) { const a = hash(seed, q, 3) * TAU, d = r * (1.05 + hash(seed, q, 4) * 0.35); ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d, Math.max(0.6, r * 0.05), 0, TAU); ctx.fill(); }
};
const STAMP = {
  flower(ctx, u, ink, base, s) { for (let q = 0; q < 5; q++) pet(ctx, (q * TAU) / 5 - 1.57, u * 0.46, u * 0.34, u * 0.2); ctx.fillStyle = base; ctx.beginPath(); ctx.arc(0, 0, u * 0.14, 0, TAU); ctx.fill(); ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(0, 0, u * 0.07, 0, TAU); ctx.fill(); },
  bird(ctx, u, ink, base, s) { // a perching bird facing right: round body, tail fan, wing, head with an eye
    ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1, u * 0.08); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(0, 0, u * 0.62, u * 0.38, -0.25, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(u * 0.6, -u * 0.34, u * 0.2, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(u * 0.76, -u * 0.36); ctx.lineTo(u * 1.02, -u * 0.3); ctx.lineTo(u * 0.78, -u * 0.26); ctx.fill();
    for (let q = 0; q < 4; q++) { ctx.beginPath(); ctx.moveTo(-u * 0.5, u * 0.05); ctx.quadraticCurveTo(-u * (0.95 + q * 0.12), -u * (0.18 - q * 0.17), -u * (1.15 + q * 0.06), -u * (0.3 - q * 0.22)); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(u * 0.05, u * 0.34); ctx.lineTo(u * 0.05, u * 0.62); ctx.moveTo(u * 0.24, u * 0.32); ctx.lineTo(u * 0.26, u * 0.6); ctx.stroke();
    ctx.fillStyle = base; ctx.beginPath(); ctx.ellipse(-u * 0.06, -u * 0.04, u * 0.34, u * 0.16, -0.4, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(u * 0.64, -u * 0.37, u * 0.05, 0, TAU); ctx.fill();
  },
  leafband(ctx, u, ink, base, s) { for (const sx of [-1, 1]) { ctx.save(); ctx.rotate(sx * 0.5); ctx.translate(0, -u * 0.05); leafShape(ctx, u * 0.2, u * 0.62); ctx.restore(); } ctx.beginPath(); ctx.arc(0, -u * 0.7, u * 0.09, 0, TAU); ctx.fill(); },
  peacock(ctx, u, ink, base, s) { // the sponge-stamped peacock eye: a feathered ring round an eye, with a short tail
    const r = u * 0.78;
    ctx.beginPath(); ctx.ellipse(0, 0, r, r, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = base; ctx.beginPath(); ctx.arc(0, 0, r * 0.66, 0, TAU); ctx.fill();
    ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(0, 0, r * 0.46, 0, TAU); ctx.fill();
    ctx.fillStyle = base; ctx.beginPath(); ctx.arc(0, 0, r * 0.2, 0, TAU); ctx.fill();
    ctx.fillStyle = ink; for (let q = 0; q < 8; q++) { const a = (q * TAU) / 8 + 0.2; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 1.04, Math.sin(a) * r * 1.04, r * 0.11, 0, TAU); ctx.fill(); }
    speckle(ctx, r, base, ink, s);
  },
  rosette(ctx, u, ink, base, s) { // a sponge-stamped rosette: a ring of dabs round a centre
    const r = u * 0.72;
    for (let q = 0; q < 8; q++) { const a = (q * TAU) / 8; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, r * 0.27, 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = base; ctx.beginPath(); ctx.arc(0, 0, r * 0.1, 0, TAU); ctx.fill();
    speckle(ctx, r, base, ink, s, 6);
  },
  dots(ctx, u, ink, base, s) { for (const [x, y] of [[-0.34, 0], [0, -0.22], [0.34, 0], [0, 0.22]]) { ctx.beginPath(); ctx.arc(x * u, y * u, u * 0.14, 0, TAU); ctx.fill(); } },
  scale(ctx, u, ink, base, s) { ctx.lineWidth = Math.max(1, u * 0.07); ctx.strokeStyle = ink; for (const [x, y] of [[-0.46, 0.18], [0, 0.18], [0.46, 0.18], [-0.23, -0.12], [0.23, -0.12]]) { ctx.beginPath(); ctx.arc(x * u, y * u, u * 0.26, Math.PI, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(x * u, (y - 0.02) * u, u * 0.1, Math.PI, 0); ctx.stroke(); } },
  burnish(ctx, u, ink, base, s) { ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.4, u * 0.12); ctx.strokeStyle = ink; for (const x of [-0.4, -0.2, 0, 0.2, 0.4]) { ctx.beginPath(); ctx.moveTo(x * u, -u * 0.62); ctx.lineTo(x * u + u * 0.04, u * 0.62); ctx.stroke(); } },

  // ---- 1.12.0 (Americas clay workshops) ----
  pierced(ctx, u, ink, base, s) { // a pierced (calado) flower: a ring of small openings round a centre one, lit on their lower rim
    const hole = (x, y, r) => { ctx.fillStyle = '#060404'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = Math.max(1, r * 0.3); ctx.beginPath(); ctx.arc(x, y, r, 0.2, Math.PI - 0.2); ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.arc(x, y, r, Math.PI + 0.25, TAU - 0.25); ctx.stroke(); };
    ctx.scale(1.35, 1.35); hole(0, 0, u * 0.17);
    for (let q = 0; q < 6; q++) { const a = (q * TAU) / 6 + 0.5; ctx.save(); ctx.translate(Math.cos(a) * u * 0.46, Math.sin(a) * u * 0.46); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(0, 0, u * 0.17, u * 0.09, 0, 0, TAU); ctx.fillStyle = '#060404'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.34)'; ctx.lineWidth = Math.max(1, u * 0.04); ctx.beginPath(); ctx.ellipse(0, 0, u * 0.17, u * 0.09, 0, 0.3, Math.PI - 0.3); ctx.stroke(); ctx.restore(); }
    for (let q = 0; q < 6; q++) { const a = (q * TAU) / 6 + 0.5 + 0.52; hole(Math.cos(a) * u * 0.78, Math.sin(a) * u * 0.78, u * 0.06); }
  },
  greenleaf(ctx, u, ink, base, s) { // a sprig: stem, two pairs of leaves and a curl at the tip
    ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineWidth = Math.max(1.2, u * 0.07); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, u * 0.7); ctx.lineTo(0, -u * 0.25); ctx.stroke();
    for (const [y, a, w] of [[0.45, 0.95, 0.2], [0.12, 0.8, 0.17]]) for (const sx of [-1, 1]) { ctx.save(); ctx.translate(0, y * u); ctx.rotate(sx * a); ctx.translate(0, -u * 0.32); leafShape(ctx, u * w, u * 0.34); ctx.restore(); }
    ctx.beginPath(); ctx.arc(u * 0.1, -u * 0.38, u * 0.14, Math.PI * 0.9, Math.PI * 2.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(u * 0.1, -u * 0.38, u * 0.04, 0, TAU); ctx.fill();
  },
  leafresist(ctx, u, ink, base, s) { // two leaf prints left pale by the resist, with their midrib and veins in the ground colour
    for (const [dx, a, sc] of [[-u * 0.4, -0.5, 1.25], [u * 0.42, 0.45, 1.1]]) {
      ctx.save(); ctx.translate(dx, 0); ctx.rotate(a); ctx.fillStyle = ink; leafShape(ctx, u * 0.34 * sc, u * 0.74 * sc);
      ctx.strokeStyle = base; ctx.lineWidth = Math.max(1, u * 0.045); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, u * 0.62 * sc); ctx.lineTo(0, -u * 0.62 * sc);
      for (let q = -2; q <= 2; q++) { const y = q * u * 0.2 * sc; ctx.moveTo(0, y + u * 0.12); ctx.lineTo(u * 0.2 * sc, y - u * 0.06); ctx.moveTo(0, y + u * 0.12); ctx.lineTo(-u * 0.2 * sc, y - u * 0.06); }
      ctx.stroke(); ctx.restore();
    }
  },
  polish(ctx, u, ink, base, s) { // soft vertical streaks of a stone-polished surface (no hard lines)
    ctx.lineCap = 'round'; for (const [x, a] of [[-0.3, 0.12], [0, 0.18], [0.3, 0.1]]) { ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = Math.max(2, u * 0.26); ctx.beginPath(); ctx.moveTo(x * u, -u * 0.6); ctx.quadraticCurveTo(x * u + u * 0.08, 0, x * u, u * 0.6); ctx.stroke(); }
  },
  applied(ctx, u, ink, base, s) { // modelled relief: applied rosette, leaves and pressed balls that catch the light on one side
    const rel = (x, y, rx, ry, rot = 0) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(rx * 0.14, ry * 0.2, rx, ry, 0, 0, TAU); ctx.fill();
      const g = ctx.createRadialGradient(-rx * 0.3, -ry * 0.35, 1, 0, 0, Math.max(rx, ry) * 1.15); g.addColorStop(0, tint(base, 0.5)); g.addColorStop(0.55, base); g.addColorStop(1, tint(base, -0.34));
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fill(); ctx.restore();
    };
    for (const sx of [-1, 1]) rel(sx * u * 0.78, u * 0.05, u * 0.34, u * 0.13, sx * 0.5);
    for (let q = 0; q < 7; q++) { const a = (q * TAU) / 7 - 1.57; rel(Math.cos(a) * u * 0.4, Math.sin(a) * u * 0.4, u * 0.26, u * 0.17, a); }
    rel(0, 0, u * 0.21, u * 0.21); ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(0, 0, u * 0.07, 0, TAU); ctx.fill();
    for (const sx of [-1, 1]) rel(sx * u * 0.52, -u * 0.5, u * 0.07, u * 0.07);
  },
};
// continuous motifs that run all the way round the vessel (the phase turns with the wheel): ink on the band
const RUN = {
  vine(ctx, pts, u, ink, base) { // a wavy vine with a leaf at every crest and a berry between
    const vis = pts.filter((p) => p.cv > 0.08); if (vis.length < 2) return;
    ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1.4, u * 0.16); ctx.lineCap = 'round'; ctx.beginPath(); vis.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke();
    ctx.fillStyle = ink;
    for (const p of pts) if (p.mark && p.cv > 0.12) { ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.cv, 1); ctx.rotate(p.mark * 0.9); ctx.translate(0, -p.mark * u * 0.1); leafShape(ctx, u * 0.3, u * 0.62); ctx.restore(); }
  },
  wave(ctx, pts, u, ink) { const vis = pts.filter((p) => p.cv > 0.08); if (vis.length < 2) return; ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1, u * 0.07); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); vis.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke(); },
  fret(ctx, pts, u, ink) { // interlocking sawtooth bands: filled teeth hanging from the top edge, a fine parallel line below, a dot under each tip
    const vis = pts.filter((p) => p.cv > 0.08); if (vis.length < 2) return;
    ctx.fillStyle = ink; ctx.beginPath(); vis.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); for (let i = vis.length - 1; i >= 0; i--) ctx.lineTo(vis[i].x, vis[i].y - vis[i].wob * u * 0.45 - u * 0.6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1, u * 0.045); ctx.lineJoin = 'round'; ctx.beginPath(); vis.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y + u * 0.24) : ctx.moveTo(p.x, p.y + u * 0.24))); ctx.stroke();
    ctx.beginPath(); vis.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y + u * 0.4) : ctx.moveTo(p.x, p.y + u * 0.4))); ctx.stroke();
    for (const p of vis) if (p.wob > 0.97) { ctx.beginPath(); ctx.arc(p.x, p.y + u * 0.15, Math.max(0.8, u * 0.05) * p.cv, 0, TAU); ctx.fill(); }
  },
  rings(ctx, pts, u, ink) { // incised rings round the vessel
    const vis = pts.filter((p) => p.cv > 0.08); if (vis.length < 2) return; ctx.strokeStyle = ink; ctx.lineCap = 'round';
    [[-0.34, 0.07], [0, 0.1], [0.34, 0.07]].forEach(([dy, w]) => { ctx.lineWidth = Math.max(1, u * w); ctx.beginPath(); vis.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y + dy * u) : ctx.moveTo(p.x, p.y + dy * u))); ctx.stroke(); });
  },
};

// the painted floor of a shallow bowl, drawn in plan (a circle of radius R, then squashed by the view)
function roundel(ctx, R, ink, ink2, base) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1.2, R * 0.03); ctx.beginPath(); ctx.arc(0, 0, R * 0.97, 0, TAU); ctx.stroke();
  ctx.lineWidth = Math.max(1, R * 0.018); ctx.beginPath(); ctx.arc(0, 0, R * 0.9, 0, TAU); ctx.stroke();
  ctx.fillStyle = ink2; for (let q = 0; q < 30; q++) { const a = (q * TAU) / 30; pet(ctx, a, R * 0.8, R * 0.075, R * 0.03); }   // scalloped border
  ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1, R * 0.018); ctx.beginPath(); ctx.arc(0, 0, R * 0.7, 0, TAU); ctx.stroke();
  ctx.fillStyle = rgba(ink2, 0.9); for (let q = 0; q < 8; q++) { const a = (q * TAU) / 8 + 0.2; ctx.save(); ctx.translate(Math.cos(a) * R * 0.58, Math.sin(a) * R * 0.58); ctx.rotate(a + Math.PI / 2); leafShape(ctx, R * 0.045, R * 0.1); ctx.restore(); }
  // a bird with a fanned tail and a crest at the centre, as on figure plates of the hill town
  ctx.save(); ctx.translate(0, R * 0.04);
  ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1.2, R * 0.03);
  for (let q = 0; q < 5; q++) { ctx.beginPath(); ctx.moveTo(-R * 0.16, R * 0.02); ctx.quadraticCurveTo(-R * (0.34 + q * 0.04), R * (0.12 - q * 0.1), -R * (0.46 + q * 0.02), -R * (0.04 + q * 0.12)); ctx.stroke(); }
  ctx.fillStyle = ink2; ctx.beginPath(); ctx.ellipse(0, 0, R * 0.26, R * 0.15, -0.3, 0, TAU); ctx.fill();
  ctx.fillStyle = ink; ctx.beginPath(); ctx.ellipse(-R * 0.03, -R * 0.01, R * 0.15, R * 0.075, -0.5, 0, TAU); ctx.fill();
  ctx.fillStyle = ink2; ctx.beginPath(); ctx.arc(R * 0.26, -R * 0.17, R * 0.08, 0, TAU); ctx.fill();
  ctx.fillStyle = ink; ctx.beginPath(); ctx.moveTo(R * 0.33, -R * 0.18); ctx.lineTo(R * 0.47, -R * 0.14); ctx.lineTo(R * 0.34, -R * 0.12); ctx.fill();
  ctx.beginPath(); ctx.moveTo(R * 0.24, -R * 0.24); ctx.quadraticCurveTo(R * 0.2, -R * 0.36, R * 0.3, -R * 0.38); ctx.quadraticCurveTo(R * 0.27, -R * 0.3, R * 0.3, -R * 0.24); ctx.fill();
  ctx.fillStyle = base; ctx.beginPath(); ctx.arc(R * 0.27, -R * 0.18, R * 0.02, 0, TAU); ctx.fill();
  ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1, R * 0.025); ctx.beginPath(); ctx.moveTo(-R * 0.02, R * 0.14); ctx.lineTo(-R * 0.02, R * 0.34); ctx.moveTo(R * 0.1, R * 0.12); ctx.lineTo(R * 0.12, R * 0.32); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = ink; for (const sx of [-1, 1]) { ctx.save(); ctx.translate(sx * R * 0.4, R * 0.42); ctx.rotate(sx * -0.9); leafShape(ctx, R * 0.05, R * 0.14); ctx.restore(); }
}

const MOTIF_KIND = { vine: 'run', wave: 'run', zigzag: 'run', fret: 'run', rings: 'run' };

// 1.15.0 engraving on fine vessels (lacquer): cuts[i] = 0 none, 1 ring, 2 scroll, 3 leaf; a groove shows the lac layer below (or gold leaf with F.engraveFill)
function drawBandCuts(ctx, g, cuts) {   // 1.18.0 grinding: the top lac is ground away over whole bands of rows and the layers beneath show their mottle (Tsugaru)
  const { cx, base, H, R, arc, ev, B, colors, glazes, clay, F } = g, m = cuts.length;
  let i = 0;
  while (i < m) {
    const kd = cuts[i]; if (!kd) { i++; continue; }
    let j = i; while (j + 1 < m && cuts[j + 1] === kd) j++;
    const yTop = base - ((j + 1) / m) * H, yBot = base - (i / m) * H, k = Math.min(B - 1, Math.floor((i * B) / m)), ci = colors[k], L = glazes ? glazes.length : 1;
    const cA = ci !== undefined && ci >= 0 && glazes ? glazes[(ci + kd) % L].color : tint(clay, -0.4), cB = ci !== undefined && ci >= 0 && glazes ? glazes[(ci + kd + 1) % L].color : cA, cC = ci !== undefined && ci >= 0 && glazes ? glazes[(ci + kd + 2) % L].color : cA;
    ctx.save(); ctx.beginPath(); arc(yTop, true); arc(yBot + 1, false); ctx.closePath(); ctx.clip();
    ctx.fillStyle = cA; ctx.fillRect(cx - R(yBot) - 4, yTop - 4, R(yBot) * 2 + 8, yBot - yTop + 8);
    const rmx = Math.max(R(yTop), R(yBot), R((yTop + yBot) / 2));
    for (let q = 0; q < 26; q++) { const bx = cx - rmx + hash(q, i, 81) * rmx * 2, by = yTop + hash(q, i, 82) * (yBot - yTop), br = (yBot - yTop) * (0.25 + 0.5 * hash(q, i, 83)) + 4; const gr = ctx.createRadialGradient(bx, by, 0, bx, by, br); const cc = q % 2 ? cB : cC; gr.addColorStop(0, rgba(cc, 0.75)); gr.addColorStop(1, rgba(cc, 0)); ctx.fillStyle = gr; ctx.fillRect(bx - br, by - br, br * 2, br * 2); }
    const dsp = Math.max(4, (yBot - yTop) / 7);   // the fish-roe dots of the ground, in rows
    for (let yy = yTop + dsp * 0.5, row = 0; yy < yBot; yy += dsp, row++) for (let xx = cx - rmx + (row % 2 ? dsp * 0.5 : 0); xx < cx + rmx; xx += dsp) { const hh = hash(Math.round(xx), row, i + 85); ctx.strokeStyle = hh > 0.5 ? rgba(tint(cB, 0.3), 0.55) : rgba(tint(cC, -0.25), 0.5); ctx.lineWidth = Math.max(0.8, dsp * 0.16); ctx.beginPath(); ctx.arc(xx, yy, dsp * 0.3, 0, TAU); ctx.stroke(); }
    ctx.restore();
    i = j + 1;
  }
}
function drawCuts(ctx, g, cuts) {
  if (g.F.engraveStyle === 'band') return drawBandCuts(ctx, g, cuts);
  const { cx, base, H, R, arc, ev, B, n, colors, glazes, clay, t, F } = g, m = cuts.length, rot = F.still ? 0.4 : t === null ? 0.3 : t * 0.9, rowH = H / n;
  const gold = F.engraveFill, goldFill = (x0, y0, x1, y1) => { const gr = ctx.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, '#fff0b0'); gr.addColorStop(0.45, gold === true ? '#d9a93a' : gold); gr.addColorStop(1, '#8a5f14'); return gr; };
  for (let i = 0; i < m; i++) {
    const kd = cuts[i]; if (!kd) continue;
    const y = base - ((i + 0.5) / m) * H, k = Math.min(B - 1, Math.floor((i * B) / m)), ci = colors[k], r = R(y);
    const L = F.engraveLayers ?? 1, under = gold ? null : (ci !== undefined && ci >= 0 && glazes ? glazes[(ci + (kd === 3 && L > 1 ? 2 : 1)) % glazes.length].color : tint(clay, -0.4));
    const paint = under ?? '#d9a93a';
    if (kd === 1) {
      ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 3.4; ctx.beginPath(); arc(y + 1, true); ctx.stroke();
      ctx.strokeStyle = gold ? goldFill(cx - r, y, cx + r, y) : under; ctx.lineWidth = gold ? 3 : 2.4; ctx.beginPath(); arc(y, true); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 0.8; ctx.beginPath(); arc(y - 1.3, true); ctx.stroke();
    } else {
      const N = kd === 2 ? 13 : 10, sz = Math.max(3.6, rowH * 0.66);
      for (let j = 0; j < N; j++) {
        const th = rot + (j * Math.PI * 2) / N, cv = Math.cos(th); if (cv < 0.12) continue;
        const px = cx + Math.sin(th) * r * 0.985, py = y + r * ev * cv * 0.9, w = sz * cv * 1.4;
        ctx.save(); ctx.translate(px, py); ctx.globalAlpha = 0.6 + 0.4 * cv; ctx.lineCap = 'round'; ctx.strokeStyle = gold ? goldFill(-w, -sz, w, sz) : under; ctx.fillStyle = ctx.strokeStyle;
        if (kd === 2) { ctx.lineWidth = Math.max(1.2, sz * 0.22); ctx.beginPath(); ctx.moveTo(-w, sz * 0.3); ctx.bezierCurveTo(-w * 0.6, -sz, w * 0.2, -sz, w * 0.1, -sz * 0.1); ctx.bezierCurveTo(-w * 0.1, sz * 0.4, w * 0.6, sz * 0.5, w, -sz * 0.4); ctx.stroke(); ctx.beginPath(); ctx.arc(w * 0.1, -sz * 0.1, Math.max(1, sz * 0.28 * cv), 0, TAU); ctx.fill(); }
        else { for (const a of [-0.75, 0, 0.75]) { ctx.save(); ctx.translate(0, sz * 0.5); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(w * 0.34, -sz * 0.7, 0, -sz * 1.6); ctx.quadraticCurveTo(-w * 0.34, -sz * 0.7, 0, 0); ctx.closePath(); ctx.fill(); ctx.restore(); } ctx.lineWidth = Math.max(1, sz * 0.12); ctx.beginPath(); ctx.moveTo(0, sz * 0.85); ctx.lineTo(0, sz * 0.45); ctx.stroke(); }
        ctx.restore();
      }
    }
  }
}

export function drawFineVessel(ctx, o) {
  const { cx, base, H, unit, radii, bands = 0, colors = [], clay, t = null, outlineOnly = false, accent = '#f2c14e', wet = 0, glazes } = o;
  const ev = o.ev ?? 0.2, F = o.fine ?? {};
  const { R, top, rowH, n } = profileFn(radii, unit, base, H);
  if (outlineOnly) { fineOutline(ctx, { cx, base, H, unit, radii, ev, dome: F.dome }); litEdge(ctx, accent, 2.4, t ?? 0); return; }
  if (F.glass) { drawGlassVessel(ctx, o, { R, top, rowH, n }, fineOutline); return; }   // 1.22.0 blown glass: see glass.js
  const rmax = Math.max(...radii) * unit, rt = R(top), ry = rt * ev, B = Math.max(1, bands), glazed = bands > 0 && colors.some((c) => c >= 0);
  const bandBase = (k) => (colors[k] !== undefined && colors[k] >= 0 && glazes ? glazes[colors[k]].color : clay);
  // contact shadow
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.ellipse(cx + rmax * 0.06, base + 2, R(base) * 1.1 + 4, Math.max(4, R(base) * ev * 0.9), 0, 0, TAU); ctx.fill(); ctx.restore();
  // 1.12.0 ears: two small lug handles at the shoulders (cooking pots, ollas), behind the body
  if (F.ears) {
    const ey0 = top + H * (F.earsAt ?? 0.26), ey1 = ey0 + H * 0.16, out = rmax * 0.2;
    for (const sx of [-1, 1]) {
      const ex0 = cx + sx * R(ey0) * 0.96, ex1 = cx + sx * R(ey1) * 0.96;
      const path = () => { ctx.beginPath(); ctx.moveTo(ex0 - sx * 3, ey0); ctx.bezierCurveTo(ex0 + sx * out, ey0 - H * 0.03, ex1 + sx * out * 1.1, ey1 + H * 0.03, ex1 - sx * 3, ey1); };
      ctx.save(); ctx.lineCap = 'round';
      path(); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = rmax * 0.15 + 3; ctx.translate(2, 3); ctx.stroke(); ctx.translate(-2, -3);
      path(); ctx.strokeStyle = tint(bandBase(B - 1), -0.35); ctx.lineWidth = rmax * 0.13 + 2; ctx.stroke();
      path(); ctx.strokeStyle = bandBase(B - 1); ctx.lineWidth = rmax * 0.1; ctx.stroke();
      path(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = rmax * 0.025; ctx.translate(-rmax * 0.02, -rmax * 0.02); ctx.stroke();
      ctx.restore();
    }
  }
  // handle (behind the body): a loop of clay joined to the neck and the belly
  if (F.handle) {
    const hy0 = top + H * 0.2, hy1 = base - H * 0.3, x0 = cx + R(hy0) * 0.96, x1 = cx + R(hy1) * 0.96, out = rmax * 0.62;
    const path = () => { ctx.beginPath(); ctx.moveTo(x0 - 3, hy0); ctx.bezierCurveTo(x0 + out, hy0 - H * 0.04, x1 + out * 1.1, hy1 + H * 0.06, x1 - 3, hy1); };
    ctx.save(); ctx.lineCap = 'round';
    path(); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = rmax * 0.26 + 4; ctx.translate(2, 3); ctx.stroke(); ctx.translate(-2, -3);
    path(); ctx.strokeStyle = tint(bandBase(B - 1), -0.35); ctx.lineWidth = rmax * 0.24 + 2; ctx.stroke();
    path(); ctx.strokeStyle = bandBase(B - 1); ctx.lineWidth = rmax * 0.2; ctx.stroke();
    path(); ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = rmax * 0.05; ctx.translate(-rmax * 0.04, -rmax * 0.04); ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  fineOutline(ctx, { cx, base, H, unit, radii, ev, dome: F.dome }); ctx.clip();
  const x0 = cx - rmax - 4, wd = rmax * 2 + 8;
  const arc = (y, first) => { const N = 24, r = R(y) + 1; for (let j = 0; j <= N; j++) { const f = first ? j / N : 1 - j / N, px = cx - r + f * 2 * r, u2 = (px - cx) / r, py = y + r * ev * Math.sqrt(Math.max(0, 1 - u2 * u2)); if (j === 0 && first) ctx.moveTo(px, py); else ctx.lineTo(px, py); } };
  for (let k = 0; k < B; k++) {
    const yTop = base - ((k + 1) * n / B) * rowH, yBot = base - ((k * n) / B) * rowH, has = colors[k] !== undefined && colors[k] >= 0 && glazes, c = bandBase(k);
    const vg = ctx.createLinearGradient(0, yTop, 0, yBot + rmax * ev); vg.addColorStop(0, has ? tint(c, 0.08) : c); vg.addColorStop(1, has ? tint(c, -0.1) : tint(c, -0.04));
    if (F.glazeAlpha && has) {   // 1.18.0 transparent lac: the wood shows through the coat
      const wg = ctx.createLinearGradient(0, yTop, 0, yBot + rmax * ev); wg.addColorStop(0, tint(clay, 0.08)); wg.addColorStop(1, tint(clay, -0.12));
      ctx.fillStyle = wg; ctx.beginPath(); arc(yTop - (k === B - 1 ? 10 + (F.dome ? rt * F.dome * 1.3 : 0) : 1), true); arc(yBot + 1, false); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.globalAlpha = F.glazeAlpha; ctx.fillStyle = vg; ctx.beginPath(); arc(yTop - (k === B - 1 ? 10 + (F.dome ? rt * F.dome * 1.3 : 0) : 1), true); arc(yBot + 1, false); ctx.closePath(); ctx.fill(); ctx.restore();
    } else { ctx.fillStyle = vg; ctx.beginPath(); arc(yTop - (k === B - 1 ? 10 + (F.dome ? rt * F.dome * 1.3 : 0) : 1), true); arc(yBot + 1, false); ctx.closePath(); ctx.fill(); }
    if (F.grain && (!has || F.grainAll)) {   // 1.15.0 wood grain on bare bands (1.18.0: on every band when the lac is transparent): fine lines along the turned wood, darker and lighter
      const yt = yTop - (k === B - 1 && F.dome ? rt * F.dome : 0), gr0 = R(yBot) + 1;
      for (let q = 0; q < 46; q++) { const gx = cx - rmax + hash(q, k, 61) * 2 * rmax, wob = (hash(q, k, 62) - 0.5) * 3; ctx.strokeStyle = hash(q, k, 63) > 0.35 ? 'rgba(120,76,32,0.12)' : 'rgba(255,245,215,0.1)'; ctx.lineWidth = 0.6 + hash(q, k, 64) * 0.9; ctx.beginPath(); ctx.moveTo(gx, yt); ctx.quadraticCurveTo(gx + wob, (yt + yBot) / 2, gx - wob * 0.4, yBot); ctx.stroke(); }
    }
    if (bands > 0 && k > 0) {
      ctx.strokeStyle = has ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.1)'; ctx.lineWidth = 2; ctx.beginPath(); arc(yBot, true); ctx.stroke();
      if (has) { ctx.fillStyle = tint(c, -0.2); for (let d = 0; d < 6; d++) { const dx = cx - R(yBot) + hash(k, d, 3) * R(yBot) * 2, len = rowH * (0.12 + 0.35 * hash(k, d, 4)); if (hash(k, d, 5) > 0.5) { ctx.beginPath(); ctx.ellipse(dx, yBot + len / 2, 1.6, len / 2, 0, 0, TAU); ctx.fill(); } } }
    }
  }
  ctx.lineWidth = 1; // throwing rings, finer on raw clay
  for (let i = 1; i < n * 3; i++) { const y = base - (i / (n * 3)) * H; ctx.strokeStyle = glazed ? 'rgba(0,0,0,0.04)' : (i % 2 ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.07)'); ctx.beginPath(); arc(y, true); ctx.stroke(); }
  if (F.seams) for (const f of F.seams) { const y = top + H * f; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 3.2; ctx.beginPath(); arc(y, true); ctx.stroke(); ctx.strokeStyle = 'rgba(255,230,170,0.5)'; ctx.lineWidth = 1.3; ctx.beginPath(); arc(y + 2.2, true); ctx.stroke(); }   // 1.15.0: a lid seam or a foot ring
  if (o.cuts && glazed) drawCuts(ctx, { cx, base, H, R, arc, ev, B, n, colors, glazes, clay, t, F }, o.cuts);   // 1.15.0
  // 1.12.0 kiln smoke: soft dark clouds where the flame licked the ware
  if (F.smoke) for (let q = 0; q < 14; q++) {
    const qx = cx + (hash(q, 41) - 0.5) * 2 * rmax, qy = top + hash(q, 42) * H, qr = rmax * (0.22 + 0.3 * hash(q, 43));
    ctx.save(); ctx.translate(qx, qy); ctx.scale(0.7, 1.5); const sg = ctx.createRadialGradient(0, 0, 1, 0, 0, qr); sg.addColorStop(0, `rgba(12,8,6,${(F.smoke * (0.25 + 0.3 * hash(q, 44))).toFixed(3)})`); sg.addColorStop(1, 'rgba(12,8,6,0)'); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 0, qr, 0, TAU); ctx.fill(); ctx.restore();
  }
  // motifs: one kind per band, painted on the turning surface
  const motifs = F.motifs ?? [];
  if (glazed && motifs.length) {
    const rot = F.still ? 0 : t === null ? 0.45 : t * 0.9;   // 1.15.0: `still` ware (a doll held in the hand) does not turn its painting
    for (let k = 0; k < B; k++) {
      const ci = colors[k], kind = motifs[k % motifs.length]; if (ci === undefined || ci < 0 || !glazes || !kind || kind === 'none') continue;
      const c = glazes[ci].color, light = lum(c) > 0.5;
      const inkL = F.inkLight?.[k % F.inkLight.length] ?? tint(c, -0.62), inkD = F.inkDark ?? tint(c, 0.75), ink = light ? inkL : inkD;
      const yTop = base - ((k + 1) * n / B) * rowH, yBot = base - ((k * n) / B) * rowH, yc = (yTop + yBot) / 2, bh = yBot - yTop, u = bh * 0.4, rr = R(yc);
      if (bh < 9) continue;
      ctx.save(); ctx.globalAlpha = 0.95;
      if (MOTIF_KIND[kind] === 'run') {
        const m = kind === 'zigzag' ? 12 : kind === 'fret' ? 10 : 4, N = 90, pts = [];
        for (let j = 0; j <= N; j++) {
          const th = -Math.PI / 2 - 0.15 + ((Math.PI + 0.3) * j) / N, ph = th + rot, cv = Math.cos(th);
          const wob = kind === 'rings' ? 0 : kind === 'zigzag' || kind === 'fret' ? (2 / Math.PI) * Math.asin(Math.sin(ph * m)) : Math.sin(ph * m);
          const mark = kind === 'vine' && Math.abs(Math.sin(ph * m)) > 0.985 ? Math.sign(Math.sin(ph * m)) : 0;
          pts.push({ x: cx + Math.sin(th) * rr * 0.985, y: yc + rr * ev * cv * 0.9 + wob * u * 0.45, cv, mark, wob });
        }
        // keep one mark per crest
        let last = -9; for (let j = 0; j < pts.length; j++) { if (pts[j].mark) { if (j - last < 5) pts[j].mark = 0; else last = j; } }
        if (kind === 'zigzag') { RUN.wave(ctx, pts, u, ink); RUN.wave(ctx, pts.map((p) => ({ ...p, y: p.y + u * 0.28 })), u * 0.8, ink); } else RUN[kind](ctx, pts, u, ink, c);
      } else {
        const N = F.count?.[kind] ?? (kind === 'bird' ? 5 : kind === 'peacock' ? 6 : kind === 'burnish' ? 20 : 9), seed = k * 17 + 3;
        for (let j = 0; j < N; j++) {
          const th = rot + (j * TAU) / N + (kind === 'peacock' && k % 2 ? Math.PI / N : 0), cv = Math.cos(th); if (cv < 0.16) continue;
          const px = cx + Math.sin(th) * rr * 0.985, py = yc + rr * ev * cv * 0.9;
          ctx.save(); ctx.translate(px, py); ctx.scale(cv, 1); ctx.globalAlpha = 0.6 + 0.4 * cv; ctx.fillStyle = ink; ctx.strokeStyle = ink;
          STAMP[kind]?.(ctx, u, ink, c, seed + j); ctx.restore();
        }
      }
      ctx.restore();
    }
  }
  // 1.15.0 doll decoration (face, hair, motifs in front view) painted once the bands are glazed; see doll.js
  if (F.deco && (glazed || F.decoAlways)) { const dk = DECO[F.deco]; if (dk) { ctx.save(); dk(ctx, { cx, top, base, H, R, rmax, n, rowH, B, ev, t, clay, glazes, colors, bandBase, glazed, F, dome: F.dome ?? 0, rt, marks: o.marks ?? null }); ctx.restore(); } }
  // cylinder light
  const gr = ctx.createLinearGradient(cx - rmax, 0, cx + rmax, 0);
  gr.addColorStop(0, 'rgba(0,0,0,0.5)'); gr.addColorStop(0.16, 'rgba(0,0,0,0.12)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.28)'); gr.addColorStop(0.42, 'rgba(255,255,255,0.05)'); gr.addColorStop(0.82, 'rgba(0,0,0,0.3)'); gr.addColorStop(0.93, 'rgba(255,255,255,0.1)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)');
  const domeH = F.dome ? rt * F.dome * 1.1 : 0;
  ctx.fillStyle = gr; ctx.fillRect(x0, top - 4 - domeH, wd, H + 8 + domeH);
  if (F.dome) { const dg = ctx.createRadialGradient(cx - rt * 0.38, top - domeH * 0.45, 1, cx - rt * 0.2, top - domeH * 0.2, rt * 1.1); dg.addColorStop(0, 'rgba(255,255,255,0.2)'); dg.addColorStop(0.5, 'rgba(255,255,255,0.04)'); dg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = dg; ctx.fillRect(cx - rt * 1.1, top - domeH - 4, rt * 2.2, domeH + rt * 1.2); }
  // gloss strip (glaze), or a matt burnish sheen on smoke-fired ware, or wet clay
  const sx = cx - rmax * 0.42, gs = ctx.createLinearGradient(sx - rmax * 0.1, 0, sx + rmax * 0.1, 0), ga = glazed ? (F.matt ? 0.26 : 0.5) : 0.16 + wet * 0.22;
  gs.addColorStop(0, 'rgba(255,255,255,0)'); gs.addColorStop(0.5, `rgba(255,255,255,${ga})`); gs.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gs; ctx.fillRect(sx - rmax * 0.1, top + H * 0.04, rmax * 0.2, H * 0.9);
  // 1.12.0 finishes: a mirror burnish that reflects a window, flecks of mica
  if (F.sheen) {
    const sh = F.sheen, s2 = cx + rmax * 0.52, g2 = ctx.createLinearGradient(s2 - rmax * 0.05, 0, s2 + rmax * 0.05, 0);
    g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(0.5, `rgba(255,255,255,${(sh * 0.3).toFixed(3)})`); g2.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g2; ctx.fillRect(s2 - rmax * 0.05, top + H * 0.14, rmax * 0.1, H * 0.7);
    const wx = cx - rmax * 0.56, wy = top + H * 0.34, ww = rmax * 0.26, wh = H * 0.15; ctx.save(); ctx.globalAlpha = sh * 0.3; ctx.fillStyle = '#e9f1f6'; rrectP(ctx, wx, wy, ww, wh, Math.min(ww, wh) * 0.3); ctx.fill(); ctx.strokeStyle = 'rgba(20,24,30,0.7)'; ctx.lineWidth = Math.max(1, ww * 0.06); ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke(); ctx.restore();
  }
  if (F.mica) for (let q = 0; q < 70; q++) {
    const mx = cx + (hash(q, 51) - 0.5) * 1.9 * rmax, my = top + hash(q, 52) * H, tw = t === null ? 0.7 : 0.5 + 0.5 * Math.sin(t * 3 + q * 1.7);
    ctx.fillStyle = `rgba(255,236,200,${(0.5 * tw * F.mica).toFixed(3)})`; ctx.fillRect(mx, my, 1.6, 1.6);
  }
  if (t !== null) for (let k = 0; k < 7; k++) {
    const th = t * 2.2 + (k * TAU) / 7, vis = Math.cos(th); if (vis <= 0) continue;
    ctx.strokeStyle = `rgba(255,255,255,${(vis * 0.12).toFixed(3)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + Math.sin(th) * R(top), top);
    for (let j = 1; j <= 24; j++) { const y = top + ((base - top) * j) / 24; ctx.lineTo(cx + Math.sin(th) * R(y), y); } ctx.stroke();
  }
  ctx.restore();
  fineOutline(ctx, { cx, base, H, unit, radii, ev, dome: F.dome }); ctx.strokeStyle = 'rgba(20,10,5,0.65)'; ctx.lineWidth = 1.6; ctx.stroke();
  if (F.dome) return;   // a solid doll head: no mouth
  // the mouth: a rounded lip, then the inside wall (lit on the far side, shaded under the near lip), or the painted floor of a shallow bowl
  const topC = bandBase(B - 1), inside = F.inside ?? (glazed ? topC : tint(clay, 0.05)), lipC = F.lipColor ?? tint(topC, glazed ? 0.2 : 0.25), shallow = !!F.roundel || !!F.floorGrain;
  ctx.save();
  const lipW = Math.max(2.5, rt * 0.075);
  ctx.beginPath(); ctx.ellipse(cx, top, rt, ry, 0, 0, TAU); ctx.fillStyle = lipC; ctx.fill();
  const ir = rt - lipW, iy = Math.max(2, ry - lipW * ev * 1.4);
  ctx.beginPath(); ctx.ellipse(cx, top + lipW * 0.1, ir, iy, 0, 0, TAU);
  const ig = ctx.createLinearGradient(0, top - iy, 0, top + iy);
  if (shallow) { ig.addColorStop(0, tint(inside, -0.12)); ig.addColorStop(0.5, tint(inside, 0.04)); ig.addColorStop(1, tint(inside, -0.05)); } else { ig.addColorStop(0, tint(inside, 0.1)); ig.addColorStop(0.45, tint(inside, -0.22)); ig.addColorStop(1, tint(inside, -0.55)); }
  ctx.fillStyle = ig; ctx.fill();
  ctx.save(); ctx.clip();
  if (shallow && F.floorGrain) {   // 1.18.0 the floor of a plate: growth rings of the wood under a clear coat
    ctx.translate(cx, top + lipW * 0.1); ctx.scale(1, iy / ir);
    const fg = ctx.createRadialGradient(-ir * 0.3, -ir * 0.3, 1, 0, 0, ir); fg.addColorStop(0, tint(F.floorColor ?? clay, 0.18)); fg.addColorStop(1, tint(F.floorColor ?? clay, -0.2)); ctx.fillStyle = fg; ctx.fillRect(-ir, -ir, ir * 2, ir * 2);
    for (let q = 1; q < 22; q++) { const rr = ir * (q / 22) * 1.05, ox = (hash(q, 71) - 0.5) * ir * 0.18, oy = (hash(q, 72) - 0.5) * ir * 0.12; ctx.strokeStyle = q % 3 ? 'rgba(90,40,10,0.26)' : 'rgba(255,230,180,0.2)'; ctx.lineWidth = Math.max(0.8, ir * (q % 3 ? 0.012 : 0.02)); ctx.beginPath(); for (let a = 0; a <= 40; a++) { const th = (a / 40) * TAU, wob = 1 + 0.05 * Math.sin(th * 3 + q) + 0.03 * Math.sin(th * 7 + q * 2); a ? ctx.lineTo(ox + Math.cos(th) * rr * wob, oy + Math.sin(th) * rr * wob) : ctx.moveTo(ox + Math.cos(th) * rr * wob, oy + Math.sin(th) * rr * wob); } ctx.closePath(); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.ellipse(-ir * 0.3, -ir * 0.35, ir * 0.35, ir * 0.12, -0.5, 0, TAU); ctx.fill();
  } else if (shallow && F.roundel && glazed) {
    const lightIn = lum(inside) > 0.5, ink = F.roundelInk?.[0] ?? (lightIn ? tint(inside, -0.65) : tint(inside, 0.8)), ink2 = F.roundelInk?.[1] ?? ink;
    ctx.translate(cx, top + lipW * 0.1); ctx.scale(1, iy / ir); roundel(ctx, ir * 0.98, ink, ink2, inside);
  } else {   // the far wall catches the light; the floor of a deep pot falls into shade
    const sh = ctx.createRadialGradient(cx, top + iy * 0.5, ir * 0.1, cx, top + iy * 0.2, ir * 1.05); sh.addColorStop(0, 'rgba(0,0,0,0.0)'); sh.addColorStop(1, 'rgba(0,0,0,0.28)'); ctx.fillStyle = sh; ctx.fillRect(cx - ir, top - iy, ir * 2, iy * 2.2);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = Math.max(1, rt * 0.02); ctx.beginPath(); ctx.ellipse(cx, top - iy * 0.1, ir * 0.9, iy * 0.9, 0, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  }
  ctx.restore();
  // inner edge shadow under the near lip, lip rim highlight
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(cx, top + lipW * 0.1, ir, iy, 0, 0, TAU); ctx.stroke();
  ctx.strokeStyle = tint(topC, -0.4); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.ellipse(cx, top, rt, ry, 0, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(1.4, lipW * 0.45); ctx.beginPath(); ctx.ellipse(cx, top, rt - lipW * 0.3, ry - lipW * 0.3 * ev, 0, Math.PI * 0.62, Math.PI * 1.05); ctx.stroke();
  // 1.12.0 lid: a domed lid with a knob sits on the mouth (a lidded cooking pot); it is decoration, the scored shape is the pot
  if (F.lid) {
    const rl = rt * 1.07, hl = H * (F.lidH ?? 0.13), ly = top + ry * 0.12, lc = F.lidColor ?? bandBase(B - 1), lry = ry * 1.08;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.beginPath(); ctx.ellipse(cx + rl * 0.06, ly + lry * 0.4, rl * 1.02, lry * 1.1, 0, 0, TAU); ctx.fill();
    const body = () => { ctx.beginPath(); ctx.moveTo(cx - rl, ly); ctx.bezierCurveTo(cx - rl * 1.02, ly - hl * 1.45, cx + rl * 1.02, ly - hl * 1.45, cx + rl, ly); ctx.ellipse(cx, ly, rl, lry, 0, 0, Math.PI); ctx.closePath(); };
    body(); const lgd = ctx.createLinearGradient(cx - rl, 0, cx + rl, 0); lgd.addColorStop(0, tint(lc, -0.35)); lgd.addColorStop(0.3, tint(lc, 0.22)); lgd.addColorStop(0.55, lc); lgd.addColorStop(1, tint(lc, -0.5)); ctx.fillStyle = lgd; ctx.fill();
    ctx.save(); body(); ctx.clip();
    const vg = ctx.createLinearGradient(0, ly - hl * 1.2, 0, ly + lry); vg.addColorStop(0, 'rgba(255,255,255,0.16)'); vg.addColorStop(0.7, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.3)'); ctx.fillStyle = vg; ctx.fillRect(cx - rl, ly - hl * 1.5, rl * 2, hl * 1.5 + lry * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = Math.max(1.5, rl * 0.05); ctx.beginPath(); ctx.moveTo(cx - rl * 0.56, ly - hl * 0.1); ctx.quadraticCurveTo(cx - rl * 0.5, ly - hl * 0.95, cx - rl * 0.12, ly - hl * 1.0); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(cx, ly, rl * 0.97, lry * 0.93, 0, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.restore();
    body(); ctx.strokeStyle = 'rgba(20,10,5,0.65)'; ctx.lineWidth = 1.5; ctx.stroke();
    const ky = ly - hl * 1.05, kw = rl * 0.13, kh = hl * 0.2;
    const kg = ctx.createLinearGradient(cx - kw, 0, cx + kw, 0); kg.addColorStop(0, tint(lc, -0.3)); kg.addColorStop(0.35, tint(lc, 0.3)); kg.addColorStop(1, tint(lc, -0.5));
    ctx.fillStyle = kg; ctx.beginPath(); ctx.moveTo(cx - kw * 0.8, ky + kh); ctx.lineTo(cx - kw, ky); ctx.quadraticCurveTo(cx, ky - kh * 1.5, cx + kw, ky); ctx.lineTo(cx + kw * 0.8, ky + kh); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(20,10,5,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

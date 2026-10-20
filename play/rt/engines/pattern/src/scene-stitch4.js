// Stitch and thread II, 1.13.0, part 2: broderie anglaise (punched eyelets, overcast edges, scalloped cotton) + federkiel (split peacock quill sewn on leather).
// Pure canvas 2D, hash-only randomness, no figures, no text. Registered in scenes-t2.js.
import { hash, rgba, mix, shade, roundRectPath, rod, ball, speck, glow, vignette, TAU, motifPath, isFilled, POT } from './scene-kit.js';
import { TOOLS } from './scene-tools.js';
import { clothGround, edgeShade, lightShaft } from './scene-needle.js';
import { bxx, potBack, potRing, softE, rrp, planks, squareHoop, innerShade, resample, linePts, stemStitch, satinLeaf } from './scene-stitch3.js';

const press = (T) => Math.max(0, 1 - T.a / 0.45);

// ====================================================================================================================================================
// BRODERIE ANGLAISE: white cotton whitework. Small round and oval holes are punched open and edged with close overcast stitches; leaves and petals are
// satin stitch; the cotton ends in a scalloped buttonhole edge. Lies in a pale hoop on a dusty-rose cloth, so the colour shows through every hole.
// ====================================================================================================================================================
const ROSE = '#c98a96';
export function broderieEnv(ctx, S) {
  const a = S.area, c = S.cell, X0 = a.x - 12, W = a.w + 24;
  // dusty-rose linen tablecloth, flat lay: soft diagonal folds, fine weave, light from the upper left
  const g = ctx.createLinearGradient(a.x, a.y, a.x + a.w * 0.4, a.y + a.h); g.addColorStop(0, '#efc6cc'); g.addColorStop(0.5, '#dfa9b3'); g.addColorStop(1, '#cb8d9a'); ctx.fillStyle = g; ctx.fillRect(X0, a.y, W, a.h);
  ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, a.h); ctx.clip();
  const fold = (x0, w0, al, dark) => { const q = ctx.createLinearGradient(x0, a.y, x0 + w0 + a.h * 0.35, a.y + a.h); q.addColorStop(0, 'rgba(255,255,255,0)'); q.addColorStop(0.5, dark ? `rgba(90,30,50,${al})` : `rgba(255,240,240,${al})`); q.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = q; ctx.beginPath(); ctx.moveTo(x0, a.y); ctx.lineTo(x0 + w0, a.y); ctx.lineTo(x0 + w0 + a.h * 0.35, a.y + a.h); ctx.lineTo(x0 + a.h * 0.35 - w0 * 0.2, a.y + a.h); ctx.closePath(); ctx.fill(); };
  fold(a.x - a.w * 0.1, a.w * 0.5, 0.2, false); fold(a.x + a.w * 0.5, a.w * 0.34, 0.22, true); fold(a.x + a.w * 0.15, a.w * 0.22, 0.12, true); fold(a.x + a.w * 0.8, a.w * 0.3, 0.14, false);
  const p = Math.max(2.4, c * 0.12); ctx.strokeStyle = 'rgba(255,235,235,0.09)'; ctx.lineWidth = 1; ctx.beginPath(); for (let y = a.y; y < a.y + a.h; y += p) { ctx.moveTo(X0, y); ctx.lineTo(X0 + W, y); } ctx.stroke();
  ctx.strokeStyle = 'rgba(80,20,40,0.07)'; ctx.beginPath(); for (let x = X0; x < X0 + W; x += p) { ctx.moveTo(x, a.y); ctx.lineTo(x, a.y + a.h); } ctx.stroke();
  ctx.restore();
  glow(ctx, a.x + a.w * 0.2, a.y + a.h * 0.1, Math.max(a.w, a.h) * 0.9, '#fff4f0', 0.22);
  vignette(ctx, a, 0.22);
  // when the screen is wide, a pair of small scissors, a loose spool and a folded napkin lie on the cloth beside the hoop
  if (!S.lite && !S.card) {
    const r = S.rect, lf = r.x - a.x, rt = a.x + a.w - (r.x + r.w);
    if (lf > c * 2.6) { scissors(ctx, a.x + lf * 0.5, r.y + r.h * 0.74, Math.min(c * 2.3, lf * 0.8), -0.95, c); }
    if (rt > c * 2.6) { const sx = r.x + r.w + rt * 0.5, sy = r.y + r.h * 0.2; softE(ctx, sx + c * 0.12, sy + c * 0.5, c * 0.62, c * 0.22, 0.28); const g = ctx.createLinearGradient(0, sy - c * 0.5, 0, sy + c * 0.5); g.addColorStop(0, '#fff6e8'); g.addColorStop(1, '#c9b090'); ctx.fillStyle = g; roundRectPath(ctx, sx - c * 0.5, sy - c * 0.45, c * 1.0, c * 0.9, 3); ctx.fill(); ctx.strokeStyle = 'rgba(100,70,40,0.4)'; ctx.lineWidth = 1; ctx.stroke(); for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? '#f4eee2' : '#e6ddca'; ctx.fillRect(sx - c * 0.3 + k * c * 0.075, sy - c * 0.28, c * 0.075, c * 0.56); } }
  }
}
function scissors(ctx, x, y, L, rot, c) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); softE(ctx, L * 0.05, c * 0.2, L * 0.5, c * 0.14, 0.3);
  for (const sgn of [-1, 1]) { ctx.save(); ctx.rotate(sgn * 0.13); const q = ctx.createLinearGradient(0, -c * 0.06, 0, c * 0.06); q.addColorStop(0, '#fafcfe'); q.addColorStop(1, '#7c868f'); ctx.fillStyle = q; ctx.beginPath(); ctx.moveTo(-L * 0.12, -c * 0.06); ctx.lineTo(L * 0.5, 0); ctx.lineTo(-L * 0.12, c * 0.06); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#d9b050'; ctx.lineWidth = c * 0.1; ctx.beginPath(); ctx.ellipse(-L * 0.26, -sgn * c * 0.12, c * 0.17, c * 0.11, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = 'rgba(255,245,200,0.8)'; ctx.lineWidth = c * 0.03; ctx.beginPath(); ctx.ellipse(-L * 0.26, -sgn * c * 0.12, c * 0.17, c * 0.11, 0, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = '#d9b050'; ctx.beginPath(); ctx.arc(-L * 0.06, 0, c * 0.05, 0, TAU); ctx.fill();
  ctx.restore();
}
// scalloped edge path samples: points along a rounded rectangle with outward normals
function edgePts(R, rad, step) {
  const pts = [], arc = (cx, cy, a0) => { const n = Math.max(3, Math.round((rad * Math.PI / 2) / step)); for (let i = 1; i < n; i++) { const a = a0 + (i / n) * Math.PI / 2; pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, Math.cos(a), Math.sin(a)]); } };
  const side = (x0, y0, x1, y1, nx, ny) => { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / step)); for (let i = 0; i < n; i++) { const f = i / n; pts.push([x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, nx, ny]); } };
  side(R.x + rad, R.y, R.x + R.w - rad, R.y, 0, -1); arc(R.x + R.w - rad, R.y + rad, -Math.PI / 2);
  side(R.x + R.w, R.y + rad, R.x + R.w, R.y + R.h - rad, 1, 0); arc(R.x + R.w - rad, R.y + R.h - rad, 0);
  side(R.x + R.w - rad, R.y + R.h, R.x + rad, R.y + R.h, 0, 1); arc(R.x + rad, R.y + R.h - rad, Math.PI / 2);
  side(R.x, R.y + R.h - rad, R.x, R.y + rad, -1, 0); arc(R.x + rad, R.y + rad, Math.PI);
  return pts;
}
export function broderieUnder(ctx, S) {
  const r = S.rect, c = S.cell, t = c * 0.34, over = c * 0.38, rho = Math.max(3, c * 0.15), d = rho * 1.5, off = t * 1.05 + over;
  const R = { x: r.x - off, y: r.y - off, w: r.w + 2 * off, h: r.h + 2 * off }, rad = c * 1.0 + off * 0.6, cot = '#f7f3ea';
  const pts = edgePts(R, rad, d), phi = Math.asin(d / (2 * rho));
  // soft shadow of the cotton on the cloth, then the cotton with its scalloped edge
  ctx.save(); ctx.shadowColor = 'rgba(80,20,40,0.45)'; ctx.shadowBlur = c * 0.55; ctx.shadowOffsetX = c * 0.06; ctx.shadowOffsetY = c * 0.2; ctx.fillStyle = cot; ctx.beginPath(); rrp(ctx, R.x, R.y, R.w, R.h, rad); ctx.fill(); ctx.beginPath(); for (const [x, y] of pts) { ctx.moveTo(x + rho, y); ctx.arc(x, y, rho, 0, TAU); } ctx.fill(); ctx.restore();
  const g = ctx.createLinearGradient(R.x, R.y, R.x + R.w * 0.6, R.y + R.h); g.addColorStop(0, '#fffdf8'); g.addColorStop(1, '#ebe3d4'); ctx.fillStyle = g; ctx.beginPath(); rrp(ctx, R.x, R.y, R.w, R.h, rad); ctx.fill(); ctx.beginPath(); for (const [x, y] of pts) { ctx.moveTo(x + rho, y); ctx.arc(x, y, rho, 0, TAU); } ctx.fill();
  if (!S.lite) {
    // buttonhole stitches fanning round every scallop, then the thread along the rim
    const stitch = (dx, dy, col, lw) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); for (const [x, y, nx, ny] of pts) { const a0 = Math.atan2(ny, nx); for (let k = -2; k <= 2; k++) { const aa = a0 + (k / 2) * phi * 0.82; ctx.moveTo(x + Math.cos(aa) * rho * 0.5 + dx, y + Math.sin(aa) * rho * 0.5 + dy); ctx.lineTo(x + Math.cos(aa + 0.1) * rho * 0.98 + dx, y + Math.sin(aa + 0.1) * rho * 0.98 + dy); } } ctx.stroke(); };
    ctx.lineCap = 'round'; stitch(rho * 0.1, rho * 0.16, 'rgba(110,70,70,0.3)', Math.max(0.9, rho * 0.3)); stitch(0, 0, '#fffefb', Math.max(0.9, rho * 0.27)); stitch(-rho * 0.04, -rho * 0.07, 'rgba(255,255,255,0.9)', Math.max(0.5, rho * 0.08));
    const rim = (dx, dy, col, lw) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); for (const [x, y, nx, ny] of pts) { const a0 = Math.atan2(ny, nx); ctx.moveTo(x + Math.cos(a0 - phi) * rho + dx, y + Math.sin(a0 - phi) * rho + dy); ctx.arc(x + dx, y + dy, rho, a0 - phi, a0 + phi); } ctx.stroke(); };
    rim(rho * 0.08, rho * 0.14, 'rgba(120,80,80,0.32)', Math.max(1, rho * 0.34)); rim(0, 0, '#fffefb', Math.max(1, rho * 0.3)); rim(-rho * 0.05, -rho * 0.08, 'rgba(210,200,185,0.9)', Math.max(0.5, rho * 0.07));
  }
  squareHoop(ctx, S, { wood: '#e6bd86', t: 0.34, metal: '#d4d9de', shadow: 0.4 });
}
export function broderieGround(ctx, S) {
  const r = S.rect, c = S.cell; ctx.save(); ctx.beginPath(); rrp(ctx, r.x, r.y, r.w, r.h, c * 0.8); ctx.clip();
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w * 0.8, r.y + r.h); g.addColorStop(0, '#fffefa'); g.addColorStop(0.5, S.bg); g.addColorStop(1, shade(S.bg, -0.05)); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  const p = Math.max(1.6, c / 15); ctx.lineWidth = Math.max(0.5, p * 0.3);
  ctx.strokeStyle = 'rgba(160,140,110,0.07)'; ctx.beginPath(); for (let y = r.y; y < r.y + r.h; y += p) { ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); } ctx.stroke();
  ctx.strokeStyle = 'rgba(160,140,110,0.05)'; ctx.beginPath(); for (let x = r.x; x < r.x + r.w; x += p) { ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); } ctx.stroke();
  if (!S.lite) { ctx.strokeStyle = 'rgba(150,130,100,0.1)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 40; k++) { const x = r.x + hash(k, 61) * r.w, y = r.y + hash(k, 62) * r.h; ctx.moveTo(x, y); ctx.lineTo(x + c * (0.1 + hash(k, 63) * 0.3), y); } ctx.stroke(); }
  ctx.restore();
}
export function broderieOver(ctx, S) {
  const r = S.rect, c = S.cell; ctx.save(); ctx.beginPath(); rrp(ctx, r.x, r.y, r.w, r.h, c * 0.8); ctx.clip(); innerShade(ctx, S, 0.17); ctx.restore();
}
const UNDERLAY = '#c4808e';
// one eyelet: a hole whose edge is closed with radial overcast stitches (the underlay shows through), optional scalloped outer ring
function eyelet(ctx, x, y, rx, ry, rot, col, w, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const ell = (ax, ay, dx = 0, dy = 0) => { ctx.beginPath(); ctx.ellipse(dx, dy, ax, ay, 0, 0, TAU); };
  // cast shadow of the raised ring on the cotton (light from the upper left)
  ell(rx + w, ry + w, w * 0.14, w * 0.24); ctx.fillStyle = 'rgba(110,70,75,0.3)'; ctx.fill();
  // the hole: rose underlay with the cotton's edge shadowing the upper left
  ell(rx, ry); ctx.fillStyle = UNDERLAY; ctx.fill(); ctx.save(); ctx.clip();
  const hg = ctx.createRadialGradient(rx * 0.25, ry * 0.3, 0, 0, 0, Math.max(rx, ry) * 1.2); hg.addColorStop(0, 'rgba(255,215,220,0.5)'); hg.addColorStop(1, 'rgba(60,10,30,0.55)'); ctx.fillStyle = hg; ctx.fillRect(-rx * 1.3, -ry * 1.3, rx * 2.6, ry * 2.6);
  ell(rx, ry, rx * 0.18, ry * 0.24); ctx.strokeStyle = 'rgba(60,10,30,0.3)'; ctx.lineWidth = Math.max(1, w * 0.4); ctx.stroke();
  ctx.restore();
  // the overcast ring
  const per = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry))), pitch = Math.max(1.4, w * 0.5), n = Math.max(10, Math.round((per * 1.15) / pitch));
  const pt = (k, f, ex) => { const a = (k / n) * TAU + (ex ?? 0), px = Math.cos(a), py = Math.sin(a); return [px * (rx + w * f), py * (ry + w * f)]; };
  ell(rx + w * 0.5, ry + w * 0.5); ctx.strokeStyle = shade(col, -0.2); ctx.lineWidth = w * 1.05; ctx.stroke();
  ell(rx + w * 0.5, ry + w * 0.5); ctx.strokeStyle = col; ctx.lineWidth = w * 0.9; ctx.stroke();
  ctx.lineCap = 'round'; ctx.strokeStyle = rgba(shade(col, -0.5), 0.5); ctx.lineWidth = Math.max(0.5, w * 0.07); ctx.beginPath(); for (let k = 0; k < n; k++) { const [x1, y1] = pt(k, 0.0, 0), [x2, y2] = pt(k, 1.0, 0.12); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); } ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = Math.max(0.5, w * 0.1); ctx.beginPath(); for (let k = 0; k < n; k++) { const a = (k / n) * TAU; if (Math.cos(a) + Math.sin(a) > 0.2) continue; const [x1, y1] = pt(k, 0.15, 0), [x2, y2] = pt(k, 0.55, 0.06); ctx.moveTo(x1 - 0.3, y1 - 0.3); ctx.lineTo(x2 - 0.3, y2 - 0.3); } ctx.stroke();
  ell(rx, ry); ctx.strokeStyle = 'rgba(90,40,50,0.55)'; ctx.lineWidth = Math.max(0.7, w * 0.09); ctx.stroke();
  if (o.scallop) { // buttonhole scallops round the outside
    const m = o.scallop, R = Math.max(rx, ry) + w; ctx.fillStyle = col; for (let k = 0; k < m; k++) { const a = (k / m) * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * (rx + w * 0.95), Math.sin(a) * (ry + w * 0.95), w * 0.34, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(90,40,50,0.4)'; ctx.lineWidth = Math.max(0.6, w * 0.07); ctx.stroke(); } void R;
  }
  ctx.restore();
}
export function broderieSkin(ctx, S, d) {
  const { kind, col, x, y, s, key } = d, w0 = Math.max(1.5, s * 0.115);
  switch (kind) {
    case 'dot': eyelet(ctx, x, y, s * 0.13, s * 0.13, 0, col, Math.max(1.6, s * 0.14)); break;
    case 'ring': eyelet(ctx, x, y, s * 0.25, s * 0.25, 0, col, Math.max(1.8, s * 0.15), { scallop: 12 }); break;
    case 'petal': { const a = (hash(key, 2) - 0.5) * 0.3; eyelet(ctx, x, y, s * 0.12, s * 0.31, a, col, Math.max(1.6, s * 0.135)); break; }
    case 'flower': {
      const n = 6, a0 = hash(key, 3) * 0.4;
      for (let k = 0; k < n; k++) { const a = a0 + (k / n) * TAU, rr = s * 0.31; eyelet(ctx, x + Math.cos(a) * rr, y + Math.sin(a) * rr, s * 0.07, s * 0.15, a + Math.PI / 2, col, Math.max(1.2, s * 0.09)); }
      eyelet(ctx, x, y, s * 0.055, s * 0.055, 0, col, Math.max(1.2, s * 0.095)); break;
    }
    case 'leaf': satinLeaf(ctx, x - s * 0.5, y + s * 0.26, -0.55, s * 1.05, s * 0.3, col, key, { dk: 0.2, sh: 0.22 }); break;
    case 'vine': {
      const pts = linePts('vine', x, y, s * 1.04);
      satinLeaf(ctx, x - s * 0.34, y + s * 0.24, -1.55, s * 0.42, s * 0.12, col, key + 1, { dk: 0.2, sh: 0.22 }); satinLeaf(ctx, x - s * 0.12, y + s * 0.04, 1.0, s * 0.38, s * 0.11, col, key + 2, { dk: 0.2, sh: 0.22 }); satinLeaf(ctx, x + s * 0.18, y - s * 0.1, -0.7, s * 0.4, s * 0.12, col, key + 3, { dk: 0.2, sh: 0.22 });
      stemStitch(ctx, pts, Math.max(2.2, s * 0.1), col, { dk: 0.24, sh: 0.2 }); break;
    }
    case 'wave': case 'zigzag': case 'spiral': case 'fret': stemStitch(ctx, linePts(kind, x, y, s * 1.04), Math.max(2.2, s * 0.1), col, { dk: 0.24, sh: 0.2 }); break;
    default:
      if (isFilled(kind)) { // a satin-stitched solid: fine parallel strands
        const p = Math.max(1.1, s / 16), N = Math.ceil(s / p); motifPath(ctx, kind, x + s * 0.02, y + s * 0.04, s); ctx.fillStyle = 'rgba(110,70,75,0.3)'; ctx.fill(); motifPath(ctx, kind, x, y, s); ctx.fillStyle = shade(col, -0.18); ctx.fill(); ctx.save(); ctx.clip();
        ctx.lineCap = 'butt'; ctx.strokeStyle = col; ctx.lineWidth = p * 0.8; ctx.beginPath(); for (let k = -N; k <= N; k++) { ctx.moveTo(x + k * p - s, y + s); ctx.lineTo(x + k * p + s, y - s); } ctx.stroke(); ctx.restore();
        motifPath(ctx, kind, x, y, s); ctx.strokeStyle = 'rgba(90,40,50,0.5)'; ctx.lineWidth = Math.max(0.8, s * 0.03); ctx.stroke();
      } else { motifPath(ctx, kind, x, y, s); ctx.strokeStyle = col; ctx.lineWidth = w0; ctx.lineCap = 'round'; ctx.stroke(); }
  }
}
Object.assign(POT, {
  // a notched card bobbin wound with cotton
  eyeletcard(ctx, S, b, col, on) {
    const { cx, cy, r } = bxx(b), lift = on ? -3 : 0; potBack(ctx, b, '#5a2e3c', 0.62);
    ctx.save(); ctx.translate(cx, cy + lift); ctx.rotate(-0.14);
    softE(ctx, r * 0.1, r * 0.62, r * 0.85, r * 0.16, 0.35);
    const w = r * 1.5, h = r * 1.1, cg = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); cg.addColorStop(0, '#fbf3e4'); cg.addColorStop(1, '#cdbfa6');
    ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(-w * 0.34, -h / 2); ctx.lineTo(-w * 0.34, -h * 0.34); ctx.lineTo(w * 0.34, -h * 0.34); ctx.lineTo(w * 0.34, -h / 2); ctx.lineTo(w / 2, -h / 2); ctx.lineTo(w / 2, h / 2); ctx.lineTo(w * 0.34, h / 2); ctx.lineTo(w * 0.34, h * 0.34); ctx.lineTo(-w * 0.34, h * 0.34); ctx.lineTo(-w * 0.34, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(70,50,30,0.5)'; ctx.lineWidth = 1; ctx.stroke();
    const tw = w * 0.68, th = h * 0.68, tg = ctx.createLinearGradient(0, -th / 2, 0, th / 2); tg.addColorStop(0, shade(col, 0.2)); tg.addColorStop(0.5, col); tg.addColorStop(1, shade(col, -0.45)); ctx.fillStyle = tg; roundRectPath(ctx, -tw / 2, -th / 2, tw, th, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(60,20,30,0.38)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 1; k < 9; k++) { ctx.moveTo(-tw / 2, -th / 2 + (k / 9) * th); ctx.lineTo(tw / 2, -th / 2 + (k / 9) * th + 0.6); } ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); for (let k = 0; k < 9; k++) { ctx.moveTo(-tw / 2 + 2, -th / 2 + (k + 0.3) / 9 * th); ctx.lineTo(tw / 2 - 2, -th / 2 + (k + 0.3) / 9 * th); } ctx.stroke();
    ctx.restore(); potRing(ctx, S, b, on);
  },
});
// a stiletto: slim steel spike in a turned bone handle; presses a ring open at the tip
Object.assign(TOOLS, {
  stiletto(ctx, S, T) {
    const u = T.u, p = press(T), a = 0.62, L = u * 3.1;
    softE(ctx, T.x + u * 0.35, T.y + u * 0.1, u * 0.6, u * 0.09, 0.3);
    if (T.a < 0.45) { const k = T.a / 0.45; ctx.strokeStyle = `rgba(110,40,60,${0.6 * (1 - k)})`; ctx.lineWidth = Math.max(1.2, u * 0.05); ctx.beginPath(); ctx.arc(T.x, T.y, u * (0.1 + 0.2 * k), 0, TAU); ctx.stroke(); }
    ctx.save(); ctx.translate(T.x, T.y - p * u * 0.07); ctx.rotate(a);
    const sg = ctx.createLinearGradient(-u * 0.06, 0, u * 0.06, 0); sg.addColorStop(0, '#f6f9fc'); sg.addColorStop(1, '#7c858f'); ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-u * 0.06, -u * 1.15); ctx.lineTo(u * 0.06, -u * 1.15); ctx.closePath(); ctx.fill();
    const fg = ctx.createLinearGradient(-u * 0.14, 0, u * 0.14, 0); fg.addColorStop(0, '#f1e0a8'); fg.addColorStop(1, '#8a6a28'); ctx.fillStyle = fg; ctx.fillRect(-u * 0.12, -u * 1.45, u * 0.24, u * 0.34);
    const bg = ctx.createLinearGradient(-u * 0.3, 0, u * 0.3, 0); bg.addColorStop(0, '#fffaf0'); bg.addColorStop(0.55, '#e6d9bb'); bg.addColorStop(1, '#9c8a64'); ctx.fillStyle = bg;
    ctx.beginPath(); ctx.moveTo(-u * 0.13, -u * 1.45); ctx.bezierCurveTo(-u * 0.38, -u * 1.9, -u * 0.34, -L * 0.8, -u * 0.2, -L); ctx.quadraticCurveTo(0, -L - u * 0.16, u * 0.2, -L); ctx.bezierCurveTo(u * 0.34, -L * 0.8, u * 0.38, -u * 1.9, u * 0.13, -u * 1.45); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(80,60,30,0.45)'; ctx.lineWidth = 1; ctx.stroke(); ctx.strokeStyle = 'rgba(90,70,40,0.5)'; for (const yy of [-u * 1.8, -u * 2.0, -u * 2.7]) { ctx.beginPath(); ctx.moveTo(-u * 0.28, yy); ctx.lineTo(u * 0.28, yy); ctx.stroke(); }
    ctx.restore();
  },
});

// ====================================================================================================================================================
// FEDERKIEL: Alpine quill embroidery. Split peacock quills (pale, glossy, a groove down the hollow shaft) are laid in flowers and tendrils on dark leather and
// sewn down with fine thread: the dark stitches cross every strip. Leather is held in a pine frame with brass tacks, on a sunlit pine bench.
// ====================================================================================================================================================
export function federkielEnv(ctx, S) {
  const a = S.area, c = S.cell, X0 = a.x - 12, W = a.w + 24;
  // long pine boards of the bench, running down the screen, a warm honey colour with pale sapwood and dark knots
  ctx.save(); ctx.beginPath(); ctx.rect(X0, a.y, W, a.h); ctx.clip();
  const bw = Math.max(c * 3.1, 54), cols = ['#d9a85c', '#c99349', '#e0b46c', '#bf8a44'];
  for (let x = X0 - bw * hash(3, 7), i = 0; x < X0 + W; x += bw, i++) {
    const base = cols[(i * 3 + 1) % cols.length], g = ctx.createLinearGradient(x, 0, x + bw, 0); g.addColorStop(0, shade(base, 0.12)); g.addColorStop(0.1, base); g.addColorStop(0.88, shade(base, -0.12)); g.addColorStop(1, shade(base, -0.4)); ctx.fillStyle = g; ctx.fillRect(x, a.y, bw, a.h);
    if (!S.lite) {
      ctx.strokeStyle = 'rgba(90,50,10,0.16)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 9; k++) { const xx = x + bw * (0.1 + 0.8 * hash(i, k, 3)), ph = hash(i, k, 4) * 6; ctx.moveTo(xx, a.y); for (let y = a.y; y <= a.y + a.h + 30; y += 30) ctx.lineTo(xx + Math.sin(y * 0.012 + ph) * bw * 0.03, y); } ctx.stroke();
      for (let k = 0; k < 2; k++) { const kx = x + bw * (0.25 + 0.5 * hash(i, k, 8)), ky = a.y + a.h * hash(i, k, 9), kr = c * (0.22 + hash(i, k, 10) * 0.2); ctx.fillStyle = 'rgba(70,35,8,0.4)'; ctx.beginPath(); ctx.ellipse(kx, ky, kr * 0.7, kr * 1.3, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(70,35,8,0.22)'; ctx.lineWidth = 1; for (let q = 1; q < 4; q++) { ctx.beginPath(); ctx.ellipse(kx, ky, kr * (0.7 + q * 0.45), kr * (1.3 + q * 1.1), 0, 0, TAU); ctx.stroke(); } }
    }
    ctx.fillStyle = 'rgba(40,20,0,0.5)'; ctx.fillRect(x + bw - 2, a.y, 2, a.h);
  }
  ctx.restore();
  // a window to the left throws a warm, mullioned beam over the boards
  lightShaft(ctx, a, a.x - a.w * 0.12, a.w * 0.62, a.w * 0.26, '#fff0c0', 0.3, 2);
  glow(ctx, a.x + a.w * 0.15, a.y + a.h * 0.05, Math.max(a.w, a.h) * 0.8, '#fff0c0', 0.24);
  vignette(ctx, a, 0.42);
  // a turned bowl of split quills and a spool of waxed thread by the frame
  if (!S.lite && !S.card) {
    const b = S.box ?? S.rect, r = S.rect, R = c * 0.62, cx = b.x + b.w - R * 0.55, cy = b.y + b.h - R * 0.5;
    softE(ctx, cx + R * 0.2, cy + R * 0.35, R * 1.1, R * 0.7, 0.35);
    const wg = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R); wg.addColorStop(0, '#c78a4a'); wg.addColorStop(1, '#5a3418'); ctx.fillStyle = wg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a160a'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.78, 0, TAU); ctx.fill();
    ctx.lineCap = 'round'; for (let k = 0; k < 8; k++) { const aa = -2.6 + k * 0.45, rr = R * (0.2 + 0.5 * hash(k, 3)); quillLine(ctx, [[cx, cy], [cx + Math.cos(aa) * rr, cy + Math.sin(aa) * rr]], R * 0.12, k % 3 === 0 ? '#e7cf8e' : '#f2e9d0'); }
    void r;
  }
}
// one quill strip along a polyline: shadow, edge, glossy body, groove, highlight and the dark couching stitches
function quillLine(ctx, pts, w, col, o = {}) {
  const build = (dx, dy) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + dx, y + dy) : ctx.moveTo(x + dx, y + dy))); };
  ctx.lineCap = o.cap ?? 'round'; ctx.lineJoin = 'round';
  build(w * 0.14, w * 0.3); ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = w * 1.15; ctx.stroke();
  build(0, 0); ctx.strokeStyle = shade(col, -0.55); ctx.lineWidth = w; ctx.stroke();
  ctx.strokeStyle = shade(col, -0.12); ctx.lineWidth = w * 0.82; ctx.stroke();
  build(-w * 0.06, -w * 0.1); ctx.strokeStyle = col; ctx.lineWidth = w * 0.66; ctx.stroke();
  build(w * 0.04, w * 0.08); ctx.strokeStyle = 'rgba(90,60,25,0.38)'; ctx.lineWidth = Math.max(0.5, w * 0.09); ctx.stroke();
  build(-w * 0.2, -w * 0.26); ctx.strokeStyle = 'rgba(255,255,248,0.85)'; ctx.lineWidth = Math.max(0.5, w * 0.17); ctx.stroke();
  if (o.stitch !== false && w > 3) { build(0, 0); ctx.lineCap = 'butt'; ctx.setLineDash([Math.max(0.8, w * 0.13), w * (o.gap ?? 1.5)]); ctx.strokeStyle = 'rgba(52,28,10,0.85)'; ctx.lineWidth = w * 1.1; ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'round'; }
}
// a pointed lens of quill (one bract of the edelweiss)
function quillLens(ctx, x, y, ang, len, wid, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  const path = (dx = 0, dy = 0, k = 1) => { ctx.beginPath(); ctx.moveTo(dx, dy); ctx.quadraticCurveTo(dx + len * 0.5, dy - wid * k, dx + len, dy); ctx.quadraticCurveTo(dx + len * 0.5, dy + wid * k, dx, dy); ctx.closePath(); };
  const ca = Math.cos(ang), sa = Math.sin(ang), sx = wid * 0.18, sy = wid * 0.34;
  path(sx * ca + sy * sa, -sx * sa + sy * ca); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();
  path(); ctx.fillStyle = shade(col, -0.55); ctx.fill();
  path(0, 0, 0.88); const g = ctx.createLinearGradient(0, -wid * 0.5, 0, wid * 0.5); const up = (-0.55 * -sa + -0.83 * ca) < 0; g.addColorStop(0, shade(col, up ? 0.3 : -0.2)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, up ? -0.3 : 0.2)); ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(90,60,25,0.4)'; ctx.lineWidth = Math.max(0.6, wid * 0.07); ctx.beginPath(); ctx.moveTo(len * 0.05, 0); ctx.lineTo(len * 0.9, 0); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,248,0.75)'; ctx.lineWidth = Math.max(0.6, wid * 0.1); ctx.beginPath(); ctx.moveTo(len * 0.18, -wid * 0.3); ctx.quadraticCurveTo(len * 0.5, -wid * 0.42, len * 0.8, -wid * 0.1); ctx.stroke();
  ctx.strokeStyle = 'rgba(52,28,10,0.85)'; ctx.lineWidth = Math.max(0.8, wid * 0.1); ctx.lineCap = 'butt'; ctx.beginPath(); for (const f of [0.34, 0.62]) { ctx.moveTo(len * f, -wid * 0.42 * (1 - Math.abs(f - 0.5) * 1.3)); ctx.lineTo(len * f, wid * 0.42 * (1 - Math.abs(f - 0.5) * 1.3)); } ctx.stroke();
  ctx.restore();
}
// a hollow shaft cut across: a ring of quill with the dark hollow in the middle
function quillTube(ctx, x, y, R, col, key) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.arc(x + R * 0.16, y + R * 0.28, R * 1.02, 0, TAU); ctx.fill();
  const g = ctx.createRadialGradient(x - R * 0.3, y - R * 0.35, R * 0.1, x, y, R); g.addColorStop(0, shade(col, 0.35)); g.addColorStop(0.6, col); g.addColorStop(1, shade(col, -0.5)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
  const h = ctx.createRadialGradient(x + R * 0.12, y + R * 0.14, 0, x, y, R * 0.5); h.addColorStop(0, '#120a05'); h.addColorStop(1, '#3a2512'); ctx.fillStyle = h; ctx.beginPath(); ctx.arc(x, y, R * 0.48, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,248,0.7)'; ctx.lineWidth = Math.max(0.6, R * 0.1); ctx.beginPath(); ctx.arc(x, y, R * 0.8, Math.PI * 1.05, Math.PI * 1.55); ctx.stroke();
  ctx.strokeStyle = 'rgba(52,28,10,0.8)'; ctx.lineWidth = Math.max(0.8, R * 0.14); ctx.beginPath(); ctx.moveTo(x - R * 1.1, y + R * 0.04); ctx.lineTo(x - R * 0.74, y + R * 0.04); ctx.moveTo(x + R * 0.74, y + R * 0.04); ctx.lineTo(x + R * 1.1, y + R * 0.04); ctx.stroke();
  void key;
}
export function federkielUnder(ctx, S) {
  const r = S.rect, c = S.cell, tb = c * 0.46, wood = '#e3bd7c', R = { x: r.x - tb, y: r.y - tb, w: r.w + 2 * tb, h: r.h + 2 * tb };
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.62)'; ctx.shadowBlur = c * 0.9; ctx.shadowOffsetX = c * 0.1; ctx.shadowOffsetY = c * 0.34; ctx.fillStyle = '#000'; ctx.fillRect(R.x, R.y, R.w, R.h); ctx.restore();
  const X1 = R.x + R.w, Y1 = R.y + R.h;
  const bar = (pts, g0, g1, gx, gy) => { const g = ctx.createLinearGradient(gx[0], gy[0], gx[1], gy[1]); g.addColorStop(0, g0); g.addColorStop(1, g1); ctx.fillStyle = g; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(50,25,0,0.6)'; ctx.lineWidth = 1; ctx.stroke(); };
  bar([[R.x, R.y], [X1, R.y], [X1 - tb, R.y + tb], [R.x + tb, R.y + tb]], shade(wood, 0.35), shade(wood, 0.0), [0, 0], [R.y, R.y + tb]);
  bar([[R.x, R.y], [R.x + tb, R.y + tb], [R.x + tb, Y1 - tb], [R.x, Y1]], shade(wood, 0.25), shade(wood, -0.1), [R.x, R.x + tb], [0, 0]);
  bar([[X1, R.y], [X1, Y1], [X1 - tb, Y1 - tb], [X1 - tb, R.y + tb]], shade(wood, -0.12), shade(wood, -0.45), [X1 - tb, X1], [0, 0]);
  bar([[R.x, Y1], [X1, Y1], [X1 - tb, Y1 - tb], [R.x + tb, Y1 - tb]], shade(wood, -0.2), shade(wood, -0.5), [0, 0], [Y1 - tb, Y1]);
  if (!S.lite) {
    ctx.save(); ctx.lineWidth = Math.max(0.8, tb * 0.05); ctx.lineCap = 'butt';
    for (let k = 0; k < 3; k++) { ctx.strokeStyle = rgba(k % 2 ? '#3a1c04' : '#fff4d0', 0.2); const o2 = tb * (0.2 + k * 0.28); ctx.setLineDash([c * (2 + hash(k, 5) * 3), c * (0.4 + hash(k, 6))]); ctx.beginPath(); ctx.moveTo(R.x + o2, R.y + o2); ctx.lineTo(X1 - o2, R.y + o2); ctx.lineTo(X1 - o2, Y1 - o2); ctx.lineTo(R.x + o2, Y1 - o2); ctx.closePath(); ctx.stroke(); }
    ctx.restore();
    // carved notches along the top and bottom rails, brass tacks along every rail
    ctx.fillStyle = 'rgba(70,35,5,0.55)'; const nn = Math.round(R.w / (c * 1.0)); for (let i = 0; i < nn; i++) { const x = R.x + tb * 1.2 + ((R.w - tb * 2.4) * (i + 0.5)) / nn; for (const y of [R.y + tb * 0.5, Y1 - tb * 0.5]) { ctx.beginPath(); ctx.moveTo(x - c * 0.1, y); ctx.lineTo(x, y - c * 0.1); ctx.lineTo(x + c * 0.1, y); ctx.lineTo(x, y + c * 0.1); ctx.closePath(); ctx.fill(); } }
    const tack = (x, y) => { ball(ctx, x, y, Math.max(1.6, c * 0.07), '#e0b84a', true); };
    const tn = Math.max(5, Math.round(r.w / (c * 1.0)));
    for (let i = 0; i <= tn; i++) { const x = r.x + (r.w * i) / tn; tack(x, R.y + tb * 0.22); tack(x, Y1 - tb * 0.22); }
    const tm = Math.max(5, Math.round(r.h / (c * 1.0))); for (let i = 0; i <= tm; i++) { const y = r.y + (r.h * i) / tm; tack(R.x + tb * 0.22, y); tack(X1 - tb * 0.22, y); }
  }
  ctx.strokeStyle = 'rgba(30,12,0,0.7)'; ctx.lineWidth = Math.max(1.2, c * 0.05); ctx.strokeRect(r.x - 0.5, r.y - 0.5, r.w + 1, r.h + 1);
}
export function federkielGround(ctx, S) {
  const r = S.rect, c = S.cell, bg = S.bg;
  ctx.fillStyle = bg; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  // pebbled grain of the leather: tiny lit and shaded dimples, a few creases, a soft diagonal sheen
  if (!S.lite) { speck(ctx, r, Math.round(r.w * r.h / 14), [shade(bg, 0.28), shade(bg, -0.4), shade(bg, 0.14)], 0.34, Math.max(1.1, c * 0.045), 41); ctx.strokeStyle = rgba(shade(bg, 0.3), 0.14); ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 5; k++) { const y = r.y + r.h * hash(k, 51), x = r.x + r.w * hash(k, 52); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + c * 1.5, y + (hash(k, 53) - 0.5) * c, x + c * (2 + hash(k, 54) * 3), y + (hash(k, 55) - 0.5) * c * 2); } ctx.stroke(); }
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,225,185,0.2)'); g.addColorStop(0.35, 'rgba(255,225,185,0.04)'); g.addColorStop(0.55, 'rgba(255,225,185,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0.3)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.restore();
}
export function federkielOver(ctx, S) {
  const r = S.rect, c = S.cell; innerShade(ctx, S, 0.4);
  // a row of pale stitching just inside the leather's edge
  ctx.save(); ctx.setLineDash([c * 0.16, c * 0.1]); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = Math.max(1.1, c * 0.045); const i0 = c * 0.1; ctx.strokeRect(r.x + i0 + 0.5, r.y + i0 + 1, r.w - i0 * 2, r.h - i0 * 2); ctx.strokeStyle = 'rgba(232,214,170,0.55)'; ctx.lineWidth = Math.max(0.9, c * 0.035); ctx.strokeRect(r.x + i0, r.y + i0, r.w - i0 * 2, r.h - i0 * 2); ctx.restore();
}
const pol = (cx, cy, r, a) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
export function federkielSkin(ctx, S, d) {
  const { kind, col, x, y, key } = d, s = d.s * (kind === 'dot' ? 1.05 : 1.16), w = Math.max(2, s * 0.115), dark = shade(col, 0);
  void dark;
  switch (kind) {
    case 'flower': { // daisy: split-quill petals round a cut shaft
      const n = 8, a0 = hash(key, 4) * 0.4;
      for (let k = 0; k < n; k++) { const a = a0 + (k / n) * TAU; quillLine(ctx, [pol(x, y, s * 0.14, a), pol(x, y, s * 0.46, a)], w * 1.12, col, { gap: 1.2 }); }
      quillTube(ctx, x, y, s * 0.15, shade(col, 0.04), key); break;
    }
    case 'star': { // edelweiss: woolly pointed bracts round a cluster of tiny shafts
      const n = 7, a0 = hash(key, 4) * 0.5;
      for (let k = 0; k < n; k++) { const a = a0 + (k / n) * TAU; quillLens(ctx, x + Math.cos(a) * s * 0.05, y + Math.sin(a) * s * 0.05, a, s * 0.45, s * 0.2, col); }
      for (let k = 0; k < 3; k++) quillTube(ctx, x + Math.cos(k * 2.1 + 0.4) * s * 0.07, y + Math.sin(k * 2.1 + 0.4) * s * 0.07, s * 0.075, shade(col, -0.2), key + k); break;
    }
    case 'leaf': { // a midrib quill and slanted quills along it
      const ang = -0.6, ca = Math.cos(ang), sa = Math.sin(ang), L = s * 0.9, bx = x - ca * L * 0.5, by = y - sa * L * 0.5 + s * 0.05;
      for (const side of [-1, 1]) for (let k = 0; k < 4; k++) { const u = L * (0.2 + k * 0.17), px = bx + ca * u, py = by + sa * u, a2 = ang + side * 0.95, l2 = s * (0.3 - k * 0.04); quillLine(ctx, [[px, py], [px + Math.cos(a2) * l2, py + Math.sin(a2) * l2]], w * 0.9, col, { gap: 1.8 }); }
      quillLine(ctx, [[bx, by], [bx + ca * L, by + sa * L]], w * 1.1, shade(col, 0.04), { gap: 1.1 }); break;
    }
    case 'vine': { // a tendril that ends in a curl, with leaf quills
      const pts = linePts('vine', x, y, s * 1.04);
      quillLine(ctx, [pol(x - s * 0.2, y + s * 0.02, s * 0.0, 0), [x - s * 0.3, y + s * 0.3], [x - s * 0.34, y + s * 0.5]].slice(1), w * 0.8, shade(col, -0.05), { gap: 1.8 });
      for (const [px, py, a2, l2] of [[x - s * 0.22, y + s * 0.24, -1.6, s * 0.3], [x - s * 0.05, y + s * 0.0, 1.0, s * 0.28], [x + s * 0.22, y - s * 0.12, -0.8, s * 0.3]]) quillLine(ctx, [[px, py], [px + Math.cos(a2) * l2, py + Math.sin(a2) * l2]], w * 0.85, col, { gap: 1.7 });
      quillLine(ctx, pts, w, col, { gap: 1.4 }); quillLine(ctx, linePts('spiral', x + s * 0.34, y - s * 0.4, s * 0.3), w * 0.8, col, { gap: 1.5 }); break;
    }
    case 'spiral': quillLine(ctx, linePts('spiral', x, y, s * 1.06), w * 1.02, col, { gap: 1.4 }); break;
    case 'ring': quillLine(ctx, linePts('ring', x, y, s * 1.1), w * 1.05, col, { gap: 1.3 }); break;
    case 'wave': case 'zigzag': case 'fret': quillLine(ctx, linePts(kind, x, y, s * 1.08), w, col, { gap: 1.4 }); break;
    case 'dot': quillTube(ctx, x, y, s * 0.24, col, key); break;
    case 'petal': { // an almond of quill with a smaller one inside
      const pts = (k) => { const o = []; for (let i = 0; i <= 28; i++) { const t = (i / 28) * TAU, px = Math.sin(t) * s * 0.26 * k * (1 - 0.0), py = -Math.cos(t) * s * 0.44 * k * (1 + 0.0 * Math.sin(t)); o.push([x + px * (1 - 0.3 * Math.max(0, Math.cos(t)) * 0), y + py]); } return o; };
      quillLine(ctx, pts(1), w * 0.95, col, { gap: 1.6 }); quillLine(ctx, pts(0.5), w * 0.8, shade(col, 0.05), { gap: 1.8 }); break;
    }
    default:
      if (isFilled(kind)) { // parallel quills laid across the shape
        ctx.save(); motifPath(ctx, kind, x, y, s * 1.02); ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill(); ctx.clip();
        const p = Math.max(2.4, s * 0.16); for (let k = -4; k <= 4; k++) quillLine(ctx, [[x + k * p - s * 0.6, y + s * 0.6], [x + k * p + s * 0.6, y - s * 0.6]], p * 0.92, col, { gap: 1.6 }); ctx.restore();
      } else quillLine(ctx, linePts(kind, x, y, s) ?? [[x - s * 0.4, y], [x + s * 0.4, y]], w, col);
  }
}
Object.assign(POT, {
  // a small turned bowl with split quills fanned over its rim
  quillbowl(ctx, S, b, col, on) {
    const { cx, cy, r } = bxx(b), lift = on ? -3 : 0, R = r * 0.7; potBack(ctx, b, '#1a0e06', 0.62);
    softE(ctx, cx + R * 0.15, cy + lift + R * 0.8, R * 1.05, R * 0.3, 0.45);
    const wg = ctx.createRadialGradient(cx - R * 0.35, cy + lift - R * 0.3, R * 0.1, cx, cy + lift, R * 1.05); wg.addColorStop(0, '#d9a468'); wg.addColorStop(1, '#5a3418'); ctx.fillStyle = wg; ctx.beginPath(); ctx.arc(cx, cy + lift, R, 0, TAU); ctx.fill();
    ctx.fillStyle = '#24130a'; ctx.beginPath(); ctx.arc(cx, cy + lift, R * 0.8, 0, TAU); ctx.fill();
    ctx.lineCap = 'round'; for (let k = 0; k < 9; k++) { const aa = -3.0 + k * 0.42, rr = R * (0.55 + 0.4 * hash(k, 7)); quillLine(ctx, [[cx - R * 0.1 + Math.cos(aa) * R * 0.1, cy + lift + Math.sin(aa) * R * 0.1], [cx + Math.cos(aa) * rr, cy + lift + Math.sin(aa) * rr]], R * 0.17, col, { stitch: false }); }
    ctx.strokeStyle = 'rgba(255,225,170,0.5)'; ctx.lineWidth = Math.max(1, R * 0.05); ctx.beginPath(); ctx.arc(cx, cy + lift, R * 0.97, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke();
    potRing(ctx, S, b, on);
  },
});
// a leather awl with a pear-shaped beech handle and a short steel blade
Object.assign(TOOLS, {
  leatherawl(ctx, S, T) {
    const u = T.u, p = press(T), a = 0.55, L = u * 2.9;
    softE(ctx, T.x + u * 0.3, T.y + u * 0.1, u * 0.55, u * 0.09, 0.32);
    if (T.a < 0.45) { const k = T.a / 0.45; ctx.strokeStyle = `rgba(255,235,190,${0.7 * (1 - k)})`; ctx.lineWidth = Math.max(1.2, u * 0.05); ctx.beginPath(); ctx.arc(T.x, T.y, u * (0.1 + 0.22 * k), 0, TAU); ctx.stroke(); }
    ctx.save(); ctx.translate(T.x, T.y - p * u * 0.08); ctx.rotate(a);
    const sg = ctx.createLinearGradient(-u * 0.05, 0, u * 0.05, 0); sg.addColorStop(0, '#fafcfe'); sg.addColorStop(1, '#6a737d'); ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-u * 0.05, -u * 0.95); ctx.lineTo(u * 0.05, -u * 0.95); ctx.closePath(); ctx.fill();
    const fg = ctx.createLinearGradient(-u * 0.14, 0, u * 0.14, 0); fg.addColorStop(0, '#f6e7b0'); fg.addColorStop(1, '#8a6a28'); ctx.fillStyle = fg; ctx.fillRect(-u * 0.12, -u * 1.28, u * 0.24, u * 0.36);
    const hg = ctx.createLinearGradient(-u * 0.42, 0, u * 0.42, 0); hg.addColorStop(0, '#f1d29a'); hg.addColorStop(0.5, '#cf9d5a'); hg.addColorStop(1, '#7a4c22'); ctx.fillStyle = hg;
    ctx.beginPath(); ctx.moveTo(-u * 0.14, -u * 1.28); ctx.bezierCurveTo(-u * 0.5, -u * 1.7, -u * 0.46, -L * 0.85, -u * 0.2, -L); ctx.quadraticCurveTo(0, -L - u * 0.2, u * 0.2, -L); ctx.bezierCurveTo(u * 0.46, -L * 0.85, u * 0.5, -u * 1.7, u * 0.14, -u * 1.28); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(70,40,10,0.5)'; ctx.lineWidth = 1; ctx.stroke(); ctx.strokeStyle = 'rgba(70,40,10,0.45)'; for (const yy of [-u * 1.75, -u * 1.9]) { ctx.beginPath(); ctx.moveTo(-u * 0.4, yy); ctx.lineTo(u * 0.4, yy); ctx.stroke(); }
    ctx.restore();
    // a fine waxed thread trailing from the work
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = Math.max(1.2, u * 0.05); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(T.x - u * 0.2, T.y + u * 0.1); ctx.bezierCurveTo(T.x - u * 0.9, T.y + u * 0.5, T.x - u * 1.4, T.y + u * 0.1 + Math.sin(T.t * 1.6) * u * 0.06, T.x - u * 2.0, T.y + u * 0.6); ctx.stroke();
    ctx.strokeStyle = '#efe2bd'; ctx.lineWidth = Math.max(1, u * 0.035); ctx.stroke();
  },
});
export { rod, mix };

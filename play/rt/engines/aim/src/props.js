// Shared props for the aim engine's ball sports (1.4.0): a spinning ball with real seams, hoops with nets, silk goal screens,
// hands and boots as cursors. Pure canvas, deterministic, no assets.
import { mix, dark, light, alpha, vgrad, hgrad, poly, rrect, clamp } from './scenery.js';

const TAU = Math.PI * 2;
const PHI = (1 + Math.sqrt(5)) / 2;
const ell = (ctx, x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.4, rx), Math.max(0.4, ry), rot, 0, TAU); };

// ---- a ball as a sphere: pattern points are rotated in 3D so spin looks like spin ------------------------------------
const norm3 = (v) => { const n = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / n, v[1] / n, v[2] / n]; };
const AXIS = norm3([0.35, 0.9, 0.25]);
function rot3(v, a, ax = AXIS) {
  const c = Math.cos(a), s = Math.sin(a), d = ax[0] * v[0] + ax[1] * v[1] + ax[2] * v[2];
  return [
    v[0] * c + (ax[1] * v[2] - ax[2] * v[1]) * s + ax[0] * d * (1 - c),
    v[1] * c + (ax[2] * v[0] - ax[0] * v[2]) * s + ax[1] * d * (1 - c),
    v[2] * c + (ax[0] * v[1] - ax[1] * v[0]) * s + ax[2] * d * (1 - c),
  ];
}
const ICO = [[0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI], [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0], [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1]].map(norm3);
const crossN = (a, b) => norm3([a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]);

function greatCircle(ctx, x, y, r, n) {
  // the visible half of a seam: a great circle with normal n (already rotated)
  const ref = Math.abs(n[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1];
  const u = crossN(n, ref), v = crossN(n, u);
  let pen = false;
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const th = (i / 40) * TAU, p = [u[0] * Math.cos(th) + v[0] * Math.sin(th), u[1] * Math.cos(th) + v[1] * Math.sin(th), u[2] * Math.cos(th) + v[2] * Math.sin(th)];
    if (p[2] < 0) { pen = false; continue; }
    if (pen) ctx.lineTo(x + p[0] * r, y + p[1] * r); else { ctx.moveTo(x + p[0] * r, y + p[1] * r); pen = true; }
  }
  ctx.stroke();
}

export function drawBall(ctx, x, y, r, o = {}) {
  const col = o.color ?? '#f4f1e6', pat = o.pattern ?? 'plain', rot = o.rot ?? 0, line = o.line ?? '#1c1c20';
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
  const g = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.08, x, y, r * 1.05);
  g.addColorStop(0, light(col, 0.5)); g.addColorStop(0.5, col); g.addColorStop(1, dark(col, 0.42));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  if (pat === 'panels') {
    for (const d of ICO) {
      const v = rot3(d, rot);
      if (v[2] < 0.06) continue;
      const cx = x + v[0] * r, cy = y + v[1] * r, e = Math.hypot(v[0], v[1]) || 1, ex = v[0] / e, ey = v[1] / e, tx = -ey, ty = ex, pr = r * 0.34, zf = Math.max(0.18, v[2]);
      ctx.beginPath();
      for (let k = 0; k < 5; k++) {
        const a = (k * TAU) / 5 + Math.PI / 2, lx = Math.cos(a) * pr, ly = Math.sin(a) * pr * zf;
        const px = cx + tx * lx + ex * ly, py = cy + ty * lx + ey * ly;
        if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.fillStyle = line; ctx.fill();
    }
    ctx.strokeStyle = alpha(line, 0.35); ctx.lineWidth = Math.max(0.6, r * 0.04);
    for (const n of [[1, 0, 0], [0, 1, 0], [0, 0, 1], norm3([1, 1, 1]), norm3([1, -1, 1])]) greatCircle(ctx, x, y, r, rot3(n, rot));
  } else if (pat === 'seams') {
    ctx.strokeStyle = line; ctx.lineWidth = Math.max(0.9, r * 0.075); ctx.lineCap = 'round';
    for (const n of [[1, 0, 0], [0, 1, 0], norm3([1, 0, 1.15]), norm3([1, 0, -1.15])]) greatCircle(ctx, x, y, r, rot3(n, rot));
  } else if (pat === 'volley') {
    ctx.lineCap = 'round';
    for (const n of [[1, 0, 0], norm3([0.5, 1, 0]), norm3([0.5, -1, 0.4])]) {
      const nr = rot3(n, rot);
      ctx.strokeStyle = '#2d6bb0'; ctx.lineWidth = Math.max(1.4, r * 0.3); greatCircle(ctx, x, y, r, nr);
      ctx.strokeStyle = alpha(line, 0.55); ctx.lineWidth = Math.max(0.6, r * 0.045); greatCircle(ctx, x, y, r, nr);
    }
  } else if (pat === 'tennis') {
    ctx.strokeStyle = '#f5f5ee'; ctx.lineWidth = Math.max(1, r * 0.1); ctx.lineCap = 'round';
    for (const n of [norm3([1, 0.3, 0.9]), norm3([1, -0.3, -0.9])]) greatCircle(ctx, x, y, r, rot3(n, rot));
  }
  const sh = ctx.createRadialGradient(x - r * 0.45, y - r * 0.5, r * 0.25, x + r * 0.1, y + r * 0.15, r * 1.25);
  sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(0.6, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = sh; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ell(ctx, x - r * 0.38, y - r * 0.46, r * 0.26, r * 0.14, -0.7); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,0.38)'; ctx.lineWidth = Math.max(0.8, r * 0.06); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
}

// ---- nets ----------------------------------------------------------------------------------------------------------------
// a diamond-knot net hanging below a ring; back and front halves are drawn on either side of the ball that passes through
function netNodes(c, R, ryk, depth, o, rows, n) {
  const out = [];
  for (let j = 0; j <= rows; j++) {
    const u = j / rows, row = [];
    const bul = (o.bulge ?? 0) * Math.exp(-(((u - (o.bulgeAt ?? 0.3)) / 0.24) ** 2));
    const rj = R * (1 - (o.taper ?? 0.36) * u + (o.flare ?? 0) * u * u + bul);
    const xc = c.x + (o.sway ?? 0) * u * u * R, yc = c.y + depth * u * (1 - 0.12 * (o.flare ?? 0));
    for (let i = 0; i < n; i++) {
      const th = (TAU * (i + 0.5 * (j % 2))) / n;
      row.push({ x: xc + rj * Math.cos(th), y: yc + rj * ryk * Math.sin(th), s: Math.sin(th) });
    }
    out.push(row);
  }
  return out;
}
function netDraw(ctx, nodes, n, rows, front, col, lw) {
  ctx.lineCap = 'round'; ctx.lineWidth = lw;
  ctx.strokeStyle = front ? col : alpha(col, 0.5);
  ctx.beginPath();
  for (let j = 0; j < rows; j++) for (let i = 0; i < n; i++) {
    const a = nodes[j][i], links = j % 2 === 0 ? [nodes[j + 1][i], nodes[j + 1][(i + n - 1) % n]] : [nodes[j + 1][i], nodes[j + 1][(i + 1) % n]];
    for (const b of links) { const isFront = (a.s + b.s) / 2 >= 0; if (isFront === front) { ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); } }
  }
  ctx.stroke();
  // the bottom cord
  const last = nodes[rows];
  ctx.strokeStyle = front ? col : alpha(col, 0.5); ctx.lineWidth = lw * 1.5; ctx.beginPath();
  let pen = false;
  for (let i = 0; i <= n; i++) { const p = last[i % n]; const isFront = p.s >= 0; if (isFront !== front) { pen = false; continue; } if (pen) ctx.lineTo(p.x, p.y); else { ctx.moveTo(p.x, p.y); pen = true; } }
  ctx.stroke();
}

function pole(ctx, x, top, bottom, w, col = '#9aa3ad') {
  ctx.fillStyle = hgrad(ctx, x - w, x + w, [[0, light(col, 0.45)], [0.45, col], [1, dark(col, 0.5)]]);
  ctx.fillRect(x - w / 2, top, w, bottom - top);
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x - w * 0.3, top, w * 0.14, bottom - top);
}

// G = { cx, cy, R (opening radius, px), baseY, s, t }, S = { style, color, net, wob, fx: { kind, t } | null, ballAt (0..1 progress of a ball in the net) }
export function hoopBack(ctx, G, S) {
  const { cx, cy, R, baseY, s } = G, style = S.style ?? 'pole', col = S.color ?? '#e8632b';
  ctx.fillStyle = 'rgba(0,0,0,0.26)'; ell(ctx, cx + R * 0.3, baseY + 3, R * (style === 'held' ? 1.3 : 1.1), R * 0.2); ctx.fill();
  ctx.save();
  if (S.wob) { ctx.translate(cx, baseY); ctx.rotate(S.wob * 0.5); ctx.translate(-cx, -baseY); }
  if (style === 'pole' || style === 'basket') {
    const pw = Math.max(5, s * (style === 'basket' ? 0.07 : 0.05));
    pole(ctx, cx, cy - R * 0.45, baseY, pw);
    // foot plate and bracket
    ctx.fillStyle = dark('#9aa3ad', 0.35); ell(ctx, cx, baseY, pw * 1.7, pw * 0.5); ctx.fill();
    ctx.fillStyle = dark('#9aa3ad', 0.2); rrect(ctx, cx - pw * 0.8, cy - R * 0.55, pw * 1.6, R * 0.3, 2); ctx.fill();
  }
  ctx.restore();
}

export function hoopMid(ctx, G, S) {   // the part behind the ball that is passing through: the back of the net and the back rim
  const { cx, cy, R } = G, style = S.style ?? 'pole', col = S.color ?? '#e8632b', ry = style === 'held' ? R : R * 0.3;
  ctx.save();
  if (S.wob) { ctx.translate(cx, G.baseY); ctx.rotate(S.wob * 0.5); ctx.translate(-cx, -G.baseY); }
  const fxk = S.fx, t = fxk ? fxk.t : 9;
  const swish = fxk && fxk.kind !== 'rim' ? Math.exp(-t * 2.6) : 0;
  const nd = { sway: swish * Math.sin(t * 16) * 0.25, flare: swish * 0.55, bulge: fxk && fxk.kind !== 'rim' && t < 0.7 ? 0.42 * (1 - t / 0.7) : 0, bulgeAt: clamp(t / 0.5, 0, 1), taper: style === 'basket' ? 0.04 : 0.36 };
  if (style === 'basket') {
    // open-bottom korfball basket: a bucket of coloured moulded plastic with no backboard
    const hgt = R * 1.25, wob2 = swish * Math.sin(t * 20) * R * 0.05;
    ctx.fillStyle = mix(col, '#000000', 0.45); ell(ctx, cx, cy + hgt, R * 0.98, ry * 0.98); ctx.fill();   // inside back wall seen through the open top
    ctx.fillStyle = vgrad(ctx, cy, cy + hgt, [[0, dark(col, 0.45)], [1, dark(col, 0.7)]]);
    ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx - R * 0.98, cy + hgt); ctx.ellipse(cx, cy + hgt, R * 0.98, ry * 0.98, 0, Math.PI, TAU, true); ctx.lineTo(cx + R, cy); ctx.ellipse(cx, cy, R, ry, 0, 0, Math.PI, true); ctx.closePath(); ctx.fill();
    void wob2;
  } else if (style === 'held') {
    // a bag of net behind the vertical ring
    const pouch = R * 1.05 + (swish ? swish * Math.sin(t * 14) * R * 0.1 : 0);
    const nodes = netNodes({ x: cx, y: cy }, R, 0.0, 0, nd, 4, 12).map((row, j) => row.map((q, i) => { const u = j / 4, th = (TAU * (i + 0.5 * (j % 2))) / 12; return { x: cx + R * (1 - 0.82 * u) * Math.cos(th) + 0, y: cy + R * (1 - 0.82 * u) * Math.sin(th) + pouch * u * u * 0.9, s: 1 }; }));
    ctx.fillStyle = 'rgba(30,22,16,0.55)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    netDraw(ctx, nodes, 12, 4, true, 'rgba(240,235,220,0.55)', Math.max(1, R * 0.03));
  } else {
    const rows = 5, n = 12, depth = R * 1.45;
    const nodes = netNodes({ x: cx, y: cy }, R, 0.3, depth, nd, rows, n);
    netDraw(ctx, nodes, n, rows, false, 'rgba(250,250,245,0.9)', Math.max(1, R * 0.035));
    S._nodes = nodes;
  }
  // back arc of the ring
  if (style !== 'held') { ctx.strokeStyle = dark(col, 0.45); ctx.lineWidth = Math.max(2, R * 0.12); ctx.beginPath(); ctx.ellipse(cx, cy, R, ry, 0, Math.PI, TAU); ctx.stroke(); }
  ctx.restore();
}

export function hoopFront(ctx, G, S) {
  const { cx, cy, R } = G, style = S.style ?? 'pole', col = S.color ?? '#e8632b', ry = style === 'held' ? R : R * 0.3;
  ctx.save();
  if (S.wob) { ctx.translate(cx, G.baseY); ctx.rotate(S.wob * 0.5); ctx.translate(-cx, -G.baseY); }
  const fxk = S.fx, t = fxk ? fxk.t : 9;
  const swish = fxk && fxk.kind !== 'rim' ? Math.exp(-t * 2.6) : 0;
  const th = Math.max(3, R * 0.15);
  if (style === 'basket') {
    const hgt = R * 1.25, ryy = ry * 0.98;
    const gr = hgrad(ctx, cx - R, cx + R, [[0, dark(col, 0.25)], [0.3, light(col, 0.18)], [0.62, col], [1, dark(col, 0.55)]]);
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.ellipse(cx, cy, R, ry, 0, Math.PI, 0, true); ctx.lineTo(cx + R * 0.98, cy + hgt); ctx.ellipse(cx, cy + hgt, R * 0.98, ryy, 0, 0, Math.PI); ctx.closePath(); ctx.fill();
    // moulded ribs and a lower band
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1.2;
    for (let i = -3; i <= 3; i++) { const a = (i / 3.6) * 1.25, x0 = cx + Math.sin(a) * R, x1 = cx + Math.sin(a) * R * 0.98; ctx.beginPath(); ctx.moveTo(x0, cy + Math.cos(a) * ry); ctx.lineTo(x1, cy + hgt + Math.cos(a) * ryy); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = Math.max(2, R * 0.1); ctx.beginPath(); ctx.ellipse(cx, cy + hgt * 0.78, R * 0.98, ryy, 0, 0.12, Math.PI - 0.12); ctx.stroke();
    ctx.strokeStyle = dark(col, 0.45); ctx.lineWidth = Math.max(1.5, R * 0.08); ctx.beginPath(); ctx.ellipse(cx, cy + hgt, R * 0.98, ryy, 0, 0, Math.PI); ctx.stroke();
    // rim
    ctx.strokeStyle = light(col, 0.3); ctx.lineWidth = Math.max(3, R * 0.14); ctx.beginPath(); ctx.ellipse(cx, cy, R, ry, 0, 0, Math.PI); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = Math.max(1, R * 0.04); ctx.beginPath(); ctx.ellipse(cx, cy - th * 0.1, R, ry, 0, 0.5, 1.5); ctx.stroke();
  } else if (style === 'held') {
    // ring wrapped in leather with six handles
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = th * 1.25; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    ctx.strokeStyle = hgradRing(ctx, cx, cy, R, col); ctx.lineWidth = th; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
    for (let i = 0; i < 22; i++) { const a = (i / 22) * TAU; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (R - th * 0.5), cy + Math.sin(a) * (R - th * 0.5)); ctx.lineTo(cx + Math.cos(a) * (R + th * 0.5), cy + Math.sin(a) * (R + th * 0.5)); ctx.stroke(); }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.5, x0 = cx + Math.cos(a) * (R + th * 0.4), y0 = cy + Math.sin(a) * (R + th * 0.4), x1 = cx + Math.cos(a) * (R + th * 1.9), y1 = cy + Math.sin(a) * (R + th * 1.9);
      ctx.strokeStyle = '#3a2412'; ctx.lineWidth = Math.max(3, th * 0.55); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.strokeStyle = '#a8703a'; ctx.lineWidth = Math.max(1.5, th * 0.3); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.fillStyle = '#8a5a2a'; ctx.beginPath(); ctx.arc(x1, y1, th * 0.34, 0, TAU); ctx.fill();
    }
  } else {
    const rows = 5, n = 12, depth = R * 1.45;
    const nd = { sway: swish * Math.sin(t * 16) * 0.25, flare: swish * 0.55, bulge: fxk && fxk.kind !== 'rim' && t < 0.7 ? 0.42 * (1 - t / 0.7) : 0, bulgeAt: clamp(t / 0.5, 0, 1), taper: 0.36 };
    const nodes = netNodes({ x: cx, y: cy }, R, 0.3, depth, nd, rows, n);
    netDraw(ctx, nodes, n, rows, true, 'rgba(255,255,255,0.95)', Math.max(1, R * 0.04));
    // front arc of the ring: a lit tube with a hot highlight
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = th + 2; ctx.beginPath(); ctx.ellipse(cx, cy, R, ry, 0, 0, Math.PI); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = th; ctx.beginPath(); ctx.ellipse(cx, cy, R, ry, 0, 0, Math.PI); ctx.stroke();
    ctx.strokeStyle = light(col, 0.55); ctx.lineWidth = Math.max(1, th * 0.28); ctx.beginPath(); ctx.ellipse(cx, cy - th * 0.18, R, ry, 0, 0.35, 1.25); ctx.stroke();
    // little net hooks
    ctx.fillStyle = dark(col, 0.3);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI + 0.26; ctx.fillRect(cx + Math.cos(a) * R - 1, cy + Math.sin(a) * ry - 1, 2.5, 2.5); }
  }
  ctx.restore();
}
function hgradRing(ctx, cx, cy, R, col) {
  const g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  g.addColorStop(0, light(col, 0.4)); g.addColorStop(0.5, col); g.addColorStop(1, dark(col, 0.5));
  return g;
}

// a rider's raised arm and the horse behind the held ring (pato): a horse in profile, a rider in front view
export function riderBehind(ctx, G, S) {
  const { cx, cy, R, baseY } = G;
  const u = R, sx = cx + 2.6 * u, sy = cy + 2.6 * u;            // shoulder
  const hc = S.horse ?? '#6a3a20', shirt = S.shirt ?? '#c8322b', skin = S.skin ?? '#c88a5a';
  ctx.save();
  const body = { x: sx + 0.7 * u, y: baseY - 2.0 * u, rx: 3.2 * u, ry: 1.35 * u };
  // legs
  ctx.fillStyle = dark(hc, 0.4);
  for (const [dx, ph] of [[-2.2, 0], [-1.5, 1], [1.8, 1], [2.5, 0]]) { ctx.fillRect(body.x + dx * u - 0.22 * u, body.y + body.ry * 0.6, 0.44 * u, baseY - body.y - body.ry * 0.6 - (ph ? 0.1 * u : 0)); ctx.fillStyle = '#1a1210'; ctx.fillRect(body.x + dx * u - 0.26 * u, baseY - 0.3 * u, 0.52 * u, 0.3 * u); ctx.fillStyle = dark(hc, 0.4); }
  // tail
  ctx.strokeStyle = dark(hc, 0.6); ctx.lineWidth = 0.55 * u; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(body.x + body.rx * 0.92, body.y - body.ry * 0.3); ctx.quadraticCurveTo(body.x + body.rx * 1.45, body.y + body.ry * 0.5, body.x + body.rx * 1.2, body.y + body.ry * 1.5); ctx.stroke(); ctx.lineCap = 'butt';
  // body, neck and head facing left
  const g = ctx.createLinearGradient(0, body.y - body.ry, 0, body.y + body.ry); g.addColorStop(0, light(hc, 0.22)); g.addColorStop(1, dark(hc, 0.4));
  ctx.fillStyle = g; ell(ctx, body.x, body.y, body.rx, body.ry); ctx.fill();
  ctx.beginPath(); ctx.moveTo(body.x - body.rx * 0.55, body.y - body.ry * 0.7); ctx.quadraticCurveTo(body.x - body.rx * 0.95, body.y - body.ry * 2.1, body.x - body.rx * 1.2, body.y - body.ry * 2.55);
  ctx.lineTo(body.x - body.rx * 1.65, body.y - body.ry * 2.0); ctx.quadraticCurveTo(body.x - body.rx * 1.7, body.y - body.ry * 1.6, body.x - body.rx * 1.85, body.y - body.ry * 1.35); ctx.lineTo(body.x - body.rx * 1.75, body.y - body.ry * 1.05);
  ctx.quadraticCurveTo(body.x - body.rx * 1.55, body.y - body.ry * 1.2, body.x - body.rx * 1.35, body.y - body.ry * 1.0); ctx.quadraticCurveTo(body.x - body.rx * 1.2, body.y - body.ry * 0.2, body.x - body.rx * 0.8, body.y + body.ry * 0.3); ctx.closePath(); ctx.fill();
  ctx.fillStyle = dark(hc, 0.6);
  poly(ctx, [[body.x - body.rx * 1.2, body.y - body.ry * 2.55], [body.x - body.rx * 1.12, body.y - body.ry * 2.95], [body.x - body.rx * 1.02, body.y - body.ry * 2.55]]); ctx.fill();
  for (let i = 0; i < 6; i++) { const t = i / 5; poly(ctx, [[body.x - body.rx * (0.62 + t * 0.5), body.y - body.ry * (0.9 + t * 1.5)], [body.x - body.rx * (0.9 + t * 0.4), body.y - body.ry * (0.8 + t * 1.5)], [body.x - body.rx * (0.7 + t * 0.5), body.y - body.ry * (1.2 + t * 1.5)]]); ctx.fill(); }
  ctx.fillStyle = '#16100c'; ctx.beginPath(); ctx.arc(body.x - body.rx * 1.45, body.y - body.ry * 1.75, 0.09 * u, 0, TAU); ctx.fill();
  // saddle cloth
  ctx.fillStyle = '#2d6bb0'; rrect(ctx, body.x - 0.7 * u, body.y - body.ry * 0.95, 1.8 * u, 0.7 * u, 0.2 * u); ctx.fill();
  // rider: torso, head with a hat, then the raised arm to a fist on a ring handle
  ctx.fillStyle = vgrad(ctx, sy - 0.5 * u, sy + 1.6 * u, [[0, light(shirt, 0.15)], [1, dark(shirt, 0.35)]]);
  rrect(ctx, sx - 0.75 * u, sy - 0.5 * u, 1.6 * u, body.y - body.ry * 0.9 - sy + 0.5 * u, 0.5 * u); ctx.fill();
  ctx.fillStyle = skin; ell(ctx, sx + 0.05 * u, sy - 0.95 * u, 0.42 * u, 0.48 * u); ctx.fill();
  ctx.fillStyle = '#2a1a10'; ell(ctx, sx + 0.05 * u, sy - 1.28 * u, 0.72 * u, 0.15 * u); ctx.fill(); rrect(ctx, sx - 0.33 * u, sy - 1.52 * u, 0.76 * u, 0.34 * u, 0.14 * u); ctx.fill();
  const hx = cx + 0.95 * u, hy = cy + 0.85 * u;
  ctx.lineCap = 'round'; ctx.strokeStyle = dark(shirt, 0.15); ctx.lineWidth = 0.62 * u;
  ctx.beginPath(); ctx.moveTo(sx - 0.35 * u, sy - 0.15 * u); ctx.quadraticCurveTo(sx - 1.1 * u, sy - 0.8 * u, hx + 0.5 * u, hy + 0.6 * u); ctx.stroke();
  ctx.strokeStyle = skin; ctx.lineWidth = 0.34 * u; ctx.beginPath(); ctx.moveTo(hx + 0.75 * u, hy + 0.9 * u); ctx.lineTo(hx + 0.1 * u, hy + 0.15 * u); ctx.stroke();
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(hx, hy, 0.27 * u, 0, TAU); ctx.fill();
  ctx.lineCap = 'butt';
  ctx.restore();
}

// ---- goal screen: a silk panel between two posts with a round hole ------------------------------------------------------------
export function screenDraw(ctx, G, S) {
  const { cx, cy, R, baseY, s } = G, t = S.t ?? 0;
  const W = (S.w ?? 0.9) * s, H = (S.h ?? 1.3) * s, top = cy - H * 0.3, left = cx - W / 2;
  const silk = S.color ?? '#c8322b', gold = '#e8c25a';
  const fxk = S.fx, ft = fxk ? fxk.t : 9, hitAmp = fxk ? Math.exp(-ft * 2.2) * (fxk.kind === 'panel' ? 1.3 : 0.7) : 0;
  const amp = W * (0.012 + 0.045 * hitAmp);
  const pw = Math.max(5, s * 0.045);
  const bottom = Math.min(top + H, baseY - 6);
  // posts and ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(ctx, cx + W * 0.05, baseY + 3, W * 0.62, s * 0.05); ctx.fill();
  for (const px of [left - pw * 1.2, left + W + pw * 1.2]) {
    ctx.fillStyle = hgrad(ctx, px - pw, px + pw, [[0, light('#8a1e1a', 0.35)], [0.5, '#8a1e1a'], [1, dark('#8a1e1a', 0.5)]]);
    ctx.fillRect(px - pw / 2, top - H * 0.14, pw, baseY - top + H * 0.14);
    ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(px, top - H * 0.14, pw * 0.8, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.arc(px - pw * 0.25, top - H * 0.14 - pw * 0.25, pw * 0.25, 0, TAU); ctx.fill();
  }
  // crossbar
  const barY = top - H * 0.05;
  ctx.fillStyle = vgrad(ctx, barY - pw * 0.4, barY + pw * 0.4, [[0, light('#8a1e1a', 0.3)], [1, dark('#8a1e1a', 0.4)]]);
  ctx.fillRect(left - pw * 1.2, barY - pw * 0.4, W + pw * 2.4, pw * 0.8);
  // the silk: a polygon whose edges ripple, shaded in soft bands, with the hole cut out of it
  ctx.save();
  const rows = 30, rh = (bottom - top) / rows;
  const offAt = (j) => amp * Math.sin(t * 2.3 + j * 0.27 + (fxk ? ft * 14 * hitAmp : 0)) * (0.25 + j / rows);
  ctx.beginPath();
  for (let j = 0; j <= rows; j++) { const x = left + offAt(j), y = top + j * rh; if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
  for (let j = rows; j >= 0; j--) ctx.lineTo(left + W + offAt(j), top + j * rh);
  ctx.closePath();
  ctx.arc(cx, cy, R * 1.0, 0, TAU, true);
  ctx.clip('evenodd');
  ctx.fillStyle = hgrad(ctx, left - amp, left + W + amp, [[0, dark(silk, 0.3)], [0.14, light(silk, 0.1)], [0.5, silk], [0.86, light(silk, 0.08)], [1, dark(silk, 0.36)]]);
  ctx.fillRect(left - amp * 2, top, W + amp * 4, bottom - top);
  for (let j = 0; j < rows; j += 2) { const sl = Math.cos(t * 2.3 + j * 0.27 + (fxk ? ft * 14 * hitAmp : 0)); ctx.fillStyle = sl > 0 ? `rgba(255,255,255,${0.05 * sl})` : `rgba(0,0,0,${-0.06 * sl})`; ctx.fillRect(left - amp * 2, top + j * rh, W + amp * 4, rh * 2); }
  // gold borders and diamonds
  const off0 = offAt;
  ctx.fillStyle = gold; ctx.fillRect(left, top, W, Math.max(3, H * 0.025)); ctx.fillRect(left, bottom - Math.max(3, H * 0.025), W, Math.max(3, H * 0.025));
  ctx.strokeStyle = gold; ctx.lineWidth = Math.max(3, W * 0.022); for (const ex of [left + Math.max(3, W * 0.011), left + W - Math.max(3, W * 0.011)]) { ctx.beginPath(); for (let j = 0; j <= rows; j++) { const x = ex + offAt(j), y = top + j * rh; if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); }
  ctx.fillStyle = alpha(gold, 0.55);
  for (let i = 0; i < 5; i++) { const dx = left + W * (0.12 + i * 0.19), dy = bottom - H * 0.09; poly(ctx, [[dx, dy - H * 0.04], [dx + W * 0.03, dy], [dx, dy + H * 0.04], [dx - W * 0.03, dy]]); ctx.fill(); }
  ctx.restore();
  // embroidered gold ring around the hole
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = Math.max(3, R * 0.22); ctx.beginPath(); ctx.arc(cx, cy, R * 1.04, 0, TAU); ctx.stroke();
  const g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R); g.addColorStop(0, light(gold, 0.5)); g.addColorStop(0.5, gold); g.addColorStop(1, dark(gold, 0.45));
  ctx.strokeStyle = g; ctx.lineWidth = Math.max(2.5, R * 0.16); ctx.beginPath(); ctx.arc(cx, cy, R * 1.06, 0, TAU); ctx.stroke();
  // tassels
  ctx.strokeStyle = gold; ctx.lineWidth = 1.5;
  for (let i = 0; i < 7; i++) { const x = left + W * (0.06 + i * 0.147); ctx.beginPath(); ctx.moveTo(x, bottom); ctx.lineTo(x + Math.sin(t * 2 + i) * 1.5, bottom + H * 0.05); ctx.stroke(); ctx.fillStyle = silk; ctx.beginPath(); ctx.arc(x + Math.sin(t * 2 + i) * 1.5, bottom + H * 0.055, 2.4, 0, TAU); ctx.fill(); }
  return { left, top, W, bottom };
}

// ---- cursors that belong to the sport --------------------------------------------------------------------------------------
// a landing ring that stays calm: two counter-rotating dashed arcs, a soft fill and a dot
export function landingRing(ctx, x, y, r, col, t) {
  ctx.save();
  ctx.fillStyle = alpha(col, 0.14); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash([r * 0.55, r * 0.4]); ctx.lineDashOffset = -t * r * 1.2;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  ctx.setLineDash([]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r * 0.35, 0, TAU); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, TAU); ctx.fill();
  ctx.restore();
}

// a hand and forearm holding (or having just thrown) the ball. (x, y) = palm, ang = tilt from straight up, kick 0..1 = throwing motion
export function drawHand(ctx, x, y, size, ang, o = {}) {
  const skin = o.skin ?? '#d6a077', sleeve = o.sleeve ?? '#2d6bb0', k = clamp(o.kick ?? 0, 0, 1), e = 1 - (1 - k) * (1 - k);
  const py = y - e * size * 1.1, px = x + Math.sin(ang) * e * size * 0.8, sc = 1 - e * 0.12;
  const len = size * 3.6, sn = Math.sin(ang), cs = Math.cos(ang);
  const bx = px - sn * len, by = py + cs * len;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = size * 1.6; ctx.beginPath(); ctx.moveTo(bx + 5, by + 3); ctx.lineTo(px + 4, py + size * 0.9); ctx.stroke();
  // sleeve, cuff and wrist
  const sg = ctx.createLinearGradient(px - size, 0, px + size, 0); sg.addColorStop(0, light(sleeve, 0.25)); sg.addColorStop(0.5, sleeve); sg.addColorStop(1, dark(sleeve, 0.45));
  ctx.strokeStyle = sg; ctx.lineWidth = size * 1.55; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(px - sn * size * 1.35, py + cs * size * 1.35); ctx.stroke();
  ctx.strokeStyle = light(sleeve, 0.7); ctx.lineWidth = size * 1.58; ctx.beginPath(); ctx.moveTo(px - sn * size * 1.37, py + cs * size * 1.37); ctx.lineTo(px - sn * size * 1.2, py + cs * size * 1.2); ctx.stroke();
  const wg = ctx.createLinearGradient(px - size, 0, px + size, 0); wg.addColorStop(0, light(skin, 0.2)); wg.addColorStop(1, dark(skin, 0.3));
  ctx.strokeStyle = wg; ctx.lineWidth = size * 1.05; ctx.beginPath(); ctx.moveTo(px - sn * size * 1.2, py + cs * size * 1.2); ctx.lineTo(px, py + size * 0.25); ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.translate(px, py); ctx.rotate(ang); ctx.scale(sc, sc);
  const pg = ctx.createRadialGradient(-size * 0.25, -size * 0.1, size * 0.1, 0, 0, size * 1.1); pg.addColorStop(0, light(skin, 0.22)); pg.addColorStop(1, dark(skin, 0.32));
  const finger = (fx, fy, w, hgt, rot) => {
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(rot);
    const fg = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); fg.addColorStop(0, light(skin, 0.15)); fg.addColorStop(1, dark(skin, 0.3));
    ctx.fillStyle = fg; rrect(ctx, -w / 2, -hgt, w, hgt, w / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(70,35,15,0.35)'; ctx.lineWidth = 0.9; ctx.stroke();
    ctx.restore();
  };
  if (o.ball !== false && k < 0.16) {
    ctx.fillStyle = pg; ell(ctx, 0, size * 0.05, size * 0.78, size * 0.56); ctx.fill();
    drawBall(ctx, 0, -size * 0.62, size * 0.86, { color: o.ballColor, pattern: o.pattern, rot: o.rot ?? 0 });
    // thumb on one side, four fingers curled over the lower rim of the ball
    finger(-size * 0.7, size * 0.1, size * 0.34, size * 0.75, -0.55);
    for (let i = 0; i < 4; i++) finger(-size * 0.5 + i * size * 0.33, size * 0.12 - Math.abs(i - 1.5) * 0.04 * size, size * 0.3, size * (0.62 - Math.abs(i - 1.5) * 0.07), (i - 1.5) * 0.09);
  } else {
    ctx.fillStyle = pg; ell(ctx, 0, size * 0.05, size * 0.78, size * 0.56); ctx.fill();
    finger(-size * 0.72, size * 0.15, size * 0.32, size * 0.62, -1.0);
    for (let i = 0; i < 4; i++) finger(-size * 0.48 + i * size * 0.32, size * 0.05, size * 0.28, size * (0.95 - Math.abs(i - 1.5) * 0.08), (i - 1.5) * 0.18);
  }
  ctx.restore();
}

// a shoe seen from above and behind with the ball on the ground in front of it. (x, y) = ball; kick 0..1 swings the shoe through the ball
export function drawBoot(ctx, x, y, size, o = {}) {
  const k = clamp(o.kick ?? 0, 0, 1), e = 1 - (1 - k) * (1 - k);
  const leather = o.boot ?? '#3a2a1e', sock = o.sleeve ?? '#2d6bb0';
  if (o.fancy) { drawBootFancy(ctx, x, y, size, o, k, e, leather, sock); return; }
  const bx = x + size * 0.7 - e * size * 0.5, by = y + size * 2.45 - e * size * 2.3, sc = 1 + e * 0.12;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, x + size * 0.1, y + size * 0.62, size * 0.9, size * 0.26); ctx.fill();
  if (o.ball !== false || k < 0.3) drawBall(ctx, x, y - size * 0.1, size * 0.85, { color: o.ballColor, pattern: o.pattern, rot: o.rot ?? 0 });
  ctx.translate(bx, by); ctx.rotate(-0.12 + e * 0.1); ctx.scale(sc * 1.22, sc * 0.95);
  // trouser leg and sock coming down from the ankle, off the bottom of the screen
  ctx.fillStyle = hgrad(ctx, -size * 0.5, size * 0.5, [[0, light(sock, 0.25)], [0.6, sock], [1, dark(sock, 0.5)]]);
  rrect(ctx, -size * 0.46, size * 0.6, size * 0.92, size * 5, size * 0.3); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(-size * 0.46, size * 1.5, size * 0.92, size * 0.14);
  // the sole edge, then the upper with a toe cap, a seam and the ankle opening
  ctx.fillStyle = dark(leather, 0.6);
  ctx.beginPath(); ctx.moveTo(-size * 0.62, size * 0.62); ctx.bezierCurveTo(-size * 0.8, -size * 0.4, -size * 0.62, -size * 1.45, 0, -size * 1.58); ctx.bezierCurveTo(size * 0.62, -size * 1.45, size * 0.8, -size * 0.4, size * 0.62, size * 0.62); ctx.bezierCurveTo(size * 0.4, size * 0.98, -size * 0.4, size * 0.98, -size * 0.62, size * 0.62); ctx.closePath(); ctx.fill();
  const bg = ctx.createLinearGradient(-size * 0.7, -size, size * 0.7, size * 0.5); bg.addColorStop(0, light(leather, 0.45)); bg.addColorStop(0.5, leather); bg.addColorStop(1, dark(leather, 0.35));
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.moveTo(-size * 0.56, size * 0.52); ctx.bezierCurveTo(-size * 0.72, -size * 0.4, -size * 0.56, -size * 1.33, 0, -size * 1.45); ctx.bezierCurveTo(size * 0.56, -size * 1.33, size * 0.72, -size * 0.4, size * 0.56, size * 0.52); ctx.bezierCurveTo(size * 0.35, size * 0.8, -size * 0.35, size * 0.8, -size * 0.56, size * 0.52); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = alpha('#ffffff', 0.35); ctx.lineWidth = Math.max(1, size * 0.05); ctx.beginPath(); ctx.arc(0, -size * 0.7, size * 0.6, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.strokeStyle = alpha('#000000', 0.35); ctx.beginPath(); ctx.moveTo(0, -size * 0.1); ctx.lineTo(0, size * 0.5); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ell(ctx, 0, size * 0.42, size * 0.42, size * 0.22); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ell(ctx, -size * 0.25, -size * 0.8, size * 0.14, size * 0.5, 0.25); ctx.fill();
  ctx.restore();
}

// 1.6.0: a bright boot with a white sole and studs, laces, a coloured stripe, heel tab and highlights, plus a sock with bands
function drawBootFancy(ctx, x, y, size, o, k, e, leather, sock) {
  const bx = x + size * 0.7 - e * size * 0.5, by = y + size * 2.45 - e * size * 2.3, sc = 1 + e * 0.12, accent = o.accent ?? '#f2c230';
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, x + size * 0.1, y + size * 0.62, size * 0.9, size * 0.26); ctx.fill();
  if (o.ball !== false || k < 0.3) drawBall(ctx, x, y - size * 0.1, size * 0.85, { color: o.ballColor, pattern: o.pattern, rot: o.rot ?? 0 });
  ctx.translate(bx, by); ctx.rotate(-0.12 + e * 0.1); ctx.scale(sc * 1.22, sc * 0.95);
  // leg: shin guard sleeve with bands
  ctx.fillStyle = hgrad(ctx, -size * 0.5, size * 0.5, [[0, light(sock, 0.35)], [0.5, sock], [1, dark(sock, 0.5)]]);
  rrect(ctx, -size * 0.46, size * 0.5, size * 0.92, size * 5, size * 0.3); ctx.fill();
  ctx.fillStyle = '#f6f3ea'; ctx.fillRect(-size * 0.46, size * 1.4, size * 0.92, size * 0.18); ctx.fillRect(-size * 0.46, size * 1.75, size * 0.92, size * 0.1);
  // sole and studs
  ctx.fillStyle = '#f4f1e8'; ctx.beginPath(); ctx.moveTo(-size * 0.66, size * 0.66); ctx.bezierCurveTo(-size * 0.88, -size * 0.4, -size * 0.7, -size * 1.5, 0, -size * 1.66); ctx.bezierCurveTo(size * 0.7, -size * 1.5, size * 0.88, -size * 0.4, size * 0.66, size * 0.66); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = Math.max(1, size * 0.04); ctx.stroke();
  ctx.fillStyle = '#c9c4b4'; for (const [sx0, sy0] of [[-0.6, -0.9], [0.6, -0.9], [-0.64, -0.1], [0.64, -0.1], [-0.3, -1.5], [0.3, -1.5]]) { ctx.beginPath(); ctx.arc(sx0 * size, sy0 * size, size * 0.07, 0, TAU); ctx.fill(); }
  // upper
  const bg = ctx.createLinearGradient(-size * 0.7, -size * 1.2, size * 0.7, size * 0.5); bg.addColorStop(0, light(leather, 0.55)); bg.addColorStop(0.45, leather); bg.addColorStop(1, dark(leather, 0.35));
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.moveTo(-size * 0.58, size * 0.56); ctx.bezierCurveTo(-size * 0.76, -size * 0.4, -size * 0.58, -size * 1.4, 0, -size * 1.52); ctx.bezierCurveTo(size * 0.58, -size * 1.4, size * 0.76, -size * 0.4, size * 0.58, size * 0.56); ctx.closePath(); ctx.fill();
  // toe cap, side stripes, laces, tongue, ankle collar
  ctx.fillStyle = alpha('#ffffff', 0.18); ctx.beginPath(); ctx.ellipse(0, -size * 1.0, size * 0.48, size * 0.42, 0, Math.PI, TAU); ctx.fill();
  ctx.strokeStyle = accent; ctx.lineWidth = Math.max(2, size * 0.14); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-size * 0.5, -size * 0.1); ctx.quadraticCurveTo(-size * 0.62, -size * 0.7, -size * 0.3, -size * 1.2); ctx.moveTo(size * 0.5, -size * 0.1); ctx.quadraticCurveTo(size * 0.62, -size * 0.7, size * 0.3, -size * 1.2); ctx.stroke();
  ctx.fillStyle = dark(leather, 0.2); rrect(ctx, -size * 0.2, -size * 1.05, size * 0.4, size * 1.3, size * 0.12); ctx.fill();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.4, size * 0.07);
  for (let i = 0; i < 5; i++) { const yy = -size * 0.95 + i * size * 0.26; ctx.beginPath(); ctx.moveTo(-size * 0.2, yy); ctx.lineTo(size * 0.2, yy + size * 0.1); ctx.moveTo(size * 0.2, yy); ctx.lineTo(-size * 0.2, yy + size * 0.1); ctx.stroke(); }
  ctx.lineCap = 'butt';
  ctx.fillStyle = '#1c1c22'; ell(ctx, 0, size * 0.4, size * 0.44, size * 0.22); ctx.fill(); ctx.fillStyle = accent; ctx.fillRect(-size * 0.44, size * 0.28, size * 0.88, size * 0.07);
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ell(ctx, -size * 0.3, -size * 0.85, size * 0.12, size * 0.5, 0.3); ctx.fill();
  ctx.restore();
}

// a coloured bib-style round marker for hud pips etc.
export function pip(ctx, x, y, r, ball, used) {
  ctx.save();
  if (used) ctx.globalAlpha = 0.28;
  drawBall(ctx, x, y, r, ball);
  ctx.restore();
}

// Title-screen hero art for the aim engine (1.4.0): `look.titleArt` (or `look.hero`) is either the name of a built-in hero
// (ball, hoop, basket, club, mallet, bat, shuttle, horse) or a small inline SVG string. Drawn on a medallion-style plate.
import { drawBall, hoopBack, hoopMid, hoopFront } from './props.js';
import { mix, dark, light, alpha, vgrad, hgrad, poly, rrect, clamp } from './scenery.js';

const TAU = Math.PI * 2;
export const HEROES = ['ball', 'hoop', 'basket', 'club', 'mallet', 'bat', 'shuttle', 'horse'];
const ell = (ctx, x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.4, rx), Math.max(0.4, ry), rot, 0, TAU); };

// ---- a tiny SVG subset: path, circle, ellipse, rect, line, polygon, polyline, g (fill/stroke inherited) ---------------------------
const attrs = (s) => { const o = {}; s.replace(/([\w:-]+)\s*=\s*"([^"]*)"/g, (_, k, v) => { o[k] = v; return ''; }); return o; };
export function parseSvg(src) {
  const svg = String(src);
  const vb = (svg.match(/viewBox\s*=\s*"([^"]+)"/) ?? [])[1];
  const box = vb ? vb.trim().split(/[\s,]+/).map(Number) : [0, 0, 100, 100];
  const els = [], stack = [{}];
  const re = /<(\/?)(\w+)([^>]*?)(\/?)>/g;
  let m;
  while ((m = re.exec(svg))) {
    const [, close, tag, rest, self] = m;
    if (tag === 'g') { if (close) stack.pop(); else { const a = attrs(rest); stack.push({ ...stack[stack.length - 1], ...pick(a) }); if (self) stack.pop(); } continue; }
    if (close || tag === 'svg') continue;
    const a = attrs(rest);
    els.push({ tag, a, inh: { ...stack[stack.length - 1], ...pick(a) } });
  }
  return { box: box.length === 4 && box.every(Number.isFinite) && box[2] > 0 && box[3] > 0 ? box : [0, 0, 100, 100], els };
}
const pick = (a) => { const o = {}; for (const k of ['fill', 'stroke', 'stroke-width', 'opacity', 'fill-opacity', 'stroke-linecap', 'stroke-linejoin']) if (a[k] !== undefined) o[k] = a[k]; return o; };
const num = (v, d = 0) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
export function drawSvg(ctx, parsed, cx, cy, size) {
  const [bx, by, bw, bh] = parsed.box, k = size / Math.max(bw, bh);
  ctx.save(); ctx.translate(cx - (bx + bw / 2) * k, cy - (by + bh / 2) * k); ctx.scale(k, k);
  for (const { tag, a, inh } of parsed.els) {
    const fill = inh.fill === undefined ? '#000000' : inh.fill, stroke = inh.stroke;
    const paint = (path) => {
      ctx.globalAlpha = num(inh.opacity, 1);
      if (fill !== 'none' && !String(fill).startsWith('url(')) { ctx.globalAlpha = num(inh.opacity, 1) * num(inh['fill-opacity'], 1); ctx.fillStyle = fill; path ? ctx.fill(path) : ctx.fill(); }
      if (stroke && stroke !== 'none' && !String(stroke).startsWith('url(')) { ctx.globalAlpha = num(inh.opacity, 1); ctx.strokeStyle = stroke; ctx.lineWidth = num(inh['stroke-width'], 1); ctx.lineCap = inh['stroke-linecap'] ?? 'butt'; ctx.lineJoin = inh['stroke-linejoin'] ?? 'miter'; path ? ctx.stroke(path) : ctx.stroke(); }
      ctx.globalAlpha = 1;
    };
    if (tag === 'path' && a.d && typeof Path2D !== 'undefined') paint(new Path2D(a.d));
    else if (tag === 'circle') { ctx.beginPath(); ctx.arc(num(a.cx), num(a.cy), num(a.r), 0, TAU); paint(); }
    else if (tag === 'ellipse') { ctx.beginPath(); ctx.ellipse(num(a.cx), num(a.cy), num(a.rx), num(a.ry), 0, 0, TAU); paint(); }
    else if (tag === 'rect') { rrect(ctx, num(a.x), num(a.y), num(a.width), num(a.height), num(a.rx)); paint(); }
    else if (tag === 'line') { ctx.beginPath(); ctx.moveTo(num(a.x1), num(a.y1)); ctx.lineTo(num(a.x2), num(a.y2)); paint(); }
    else if ((tag === 'polygon' || tag === 'polyline') && a.points) {
      const pts = a.points.trim().split(/[\s,]+/).map(Number); ctx.beginPath();
      for (let i = 0; i + 1 < pts.length; i += 2) { if (i) ctx.lineTo(pts[i], pts[i + 1]); else ctx.moveTo(pts[i], pts[i + 1]); }
      if (tag === 'polygon') ctx.closePath();
      paint();
    }
  }
  ctx.restore();
}

// ---- built-in heroes: each is drawn inside a unit circle of radius r around (cx, cy) ---------------------------------------------
function clubArt(ctx, cx, cy, r, o, kind) {
  // a long-handled striker lying at an angle with the ball at its head: club | mallet | bat
  const wood = o.wood ?? '#a5763d';
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.72);
  const len = r * (kind === 'bat' ? 1.9 : 1.55);
  if (kind === 'bat') {
    const g = hgrad(ctx, -r * 0.2, r * 0.2, [[0, light('#e3c38a', 0.25)], [0.5, '#d2a966'], [1, dark('#d2a966', 0.4)]]);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-r * 0.045, len * 0.1); ctx.lineTo(-r * 0.045, -len * 0.26); ctx.lineTo(-r * 0.2, -len * 0.34); ctx.quadraticCurveTo(-r * 0.2, -len * 0.62, -r * 0.18, -len * 0.7); ctx.lineTo(r * 0.18, -len * 0.7); ctx.quadraticCurveTo(r * 0.2, -len * 0.62, r * 0.2, -len * 0.34); ctx.lineTo(r * 0.045, -len * 0.26); ctx.lineTo(r * 0.045, len * 0.1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(80,50,20,0.5)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#2a2a30'; rrect(ctx, -r * 0.055, len * 0.02, r * 0.11, len * 0.2, r * 0.04); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-r * 0.12, -len * 0.66, r * 0.05, len * 0.3);
  } else if (kind === 'mallet') {
    ctx.fillStyle = hgrad(ctx, -r * 0.05, r * 0.05, [[0, light(wood, 0.3)], [1, dark(wood, 0.35)]]); ctx.fillRect(-r * 0.04, -len * 0.3, r * 0.08, len * 1.05);
    ctx.fillStyle = '#e8e0cc'; rrect(ctx, -r * 0.055, len * 0.5, r * 0.11, len * 0.22, r * 0.03); ctx.fill();
    const hh = len * 0.3, hw2 = r * 0.34, hy = -len * 0.62;
    ctx.fillStyle = hgrad(ctx, -hw2, hw2, [[0, light(wood, 0.35)], [0.5, wood], [1, dark(wood, 0.45)]]); rrect(ctx, -hw2, hy, hw2 * 2, hh * 1.5, r * 0.06); ctx.fill();
    ctx.fillStyle = o.band ?? '#2d6bb0'; ctx.fillRect(-hw2, hy + hh * 0.18, hw2 * 2, hh * 0.18); ctx.fillRect(-hw2, hy + hh * 1.0, hw2 * 2, hh * 0.18);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.2; ctx.strokeRect(-hw2, hy, hw2 * 2, hh * 1.5);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-hw2 * 0.78, hy + 2, hw2 * 0.22, hh * 1.5 - 4);
  } else {
    ctx.fillStyle = hgrad(ctx, -r * 0.05, r * 0.05, [[0, light(wood, 0.3)], [1, dark(wood, 0.35)]]); ctx.beginPath(); ctx.moveTo(-r * 0.04, len * 0.7); ctx.lineTo(-r * 0.025, -len * 0.45); ctx.lineTo(r * 0.025, -len * 0.45); ctx.lineTo(r * 0.04, len * 0.7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = hgrad(ctx, -r * 0.3, r * 0.3, [[0, light('#8a8f98', 0.4)], [0.5, '#8a8f98'], [1, dark('#8a8f98', 0.5)]]);
    ctx.beginPath(); ctx.moveTo(-r * 0.04, -len * 0.45); ctx.quadraticCurveTo(-r * 0.2, -len * 0.5, -r * 0.34, -len * 0.62); ctx.quadraticCurveTo(-r * 0.2, -len * 0.7, r * 0.12, -len * 0.62); ctx.quadraticCurveTo(r * 0.18, -len * 0.5, r * 0.04, -len * 0.45); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.stroke();
  }
  ctx.restore();
  // the ball sits at the end of the swing
  drawBall(ctx, cx + r * 0.62, cy + r * 0.52, r * 0.2, { color: o.ball ?? '#f4f1e6', pattern: o.pattern, rot: o.rot });
}

function shuttleArt(ctx, cx, cy, r, o) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.5);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(ctx, r * 0.25, r * 0.75, r * 0.7, r * 0.1); ctx.fill();
  const cork = o.cork ?? '#e8c07a';
  // feathers: a fan of overlapping blades
  for (let i = -6; i <= 6; i++) {
    const a = (i / 6) * 0.42, x1 = Math.sin(a) * r * 0.62, y1 = -r * 0.5 - Math.cos(a) * r * 0.04;
    ctx.fillStyle = vgrad(ctx, -r * 0.7, r * 0.1, [[0, '#ffffff'], [1, '#d9dde0']]);
    ctx.beginPath(); ctx.moveTo(x1 * 0.18, r * 0.2); ctx.quadraticCurveTo(x1 * 0.9 - r * 0.045, -r * 0.2, x1 - r * 0.055, y1 - r * 0.28); ctx.lineTo(x1 + r * 0.055, y1 - r * 0.28); ctx.quadraticCurveTo(x1 * 0.9 + r * 0.045, -r * 0.2, x1 * 0.18, r * 0.2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(120,130,140,0.55)'; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.strokeStyle = '#d8453a'; ctx.lineWidth = Math.max(2, r * 0.045); ctx.beginPath(); ctx.ellipse(0, -r * 0.76, r * 0.66, r * 0.14, 0, 0, TAU); ctx.stroke();
  const cg = ctx.createRadialGradient(-r * 0.1, r * 0.35, 2, 0, r * 0.45, r * 0.35); cg.addColorStop(0, light(cork, 0.5)); cg.addColorStop(1, dark(cork, 0.4));
  ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, r * 0.42, r * 0.28, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f6f2ea'; ctx.fillRect(-r * 0.27, r * 0.14, r * 0.54, r * 0.07);
  ctx.restore();
}

function horseArt(ctx, cx, cy, r, o, t) {
  // a horse's head and neck in profile, facing left, with mane and bridle
  const hc = o.horse ?? '#6a3a20', sway = Math.sin(t * 1.4) * 0.03;
  ctx.save(); ctx.translate(cx, cy + r * 0.05); ctx.rotate(sway);
  const g = ctx.createLinearGradient(-r * 0.8, -r * 0.8, r * 0.6, r * 0.8); g.addColorStop(0, light(hc, 0.25)); g.addColorStop(0.55, hc); g.addColorStop(1, dark(hc, 0.5));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(r * 0.55, r * 0.9); ctx.lineTo(r * 0.2, -r * 0.55);
  ctx.quadraticCurveTo(r * 0.05, -r * 0.78, -r * 0.1, -r * 0.8);                 // poll
  ctx.lineTo(-r * 0.2, -r * 0.98); ctx.lineTo(-r * 0.3, -r * 0.78);             // ear
  ctx.quadraticCurveTo(-r * 0.5, -r * 0.72, -r * 0.64, -r * 0.5);               // forehead
  ctx.quadraticCurveTo(-r * 0.86, -r * 0.2, -r * 0.92, r * 0.08);               // nose
  ctx.quadraticCurveTo(-r * 0.96, r * 0.24, -r * 0.8, r * 0.28);                // muzzle
  ctx.quadraticCurveTo(-r * 0.6, r * 0.3, -r * 0.5, r * 0.1);                   // chin
  ctx.quadraticCurveTo(-r * 0.3, r * 0.2, -r * 0.18, r * 0.42);                 // jaw
  ctx.quadraticCurveTo(-r * 0.05, r * 0.7, -r * 0.1, r * 0.9);
  ctx.closePath(); ctx.fill();
  // mane
  ctx.fillStyle = dark(hc, 0.65);
  for (let i = 0; i < 9; i++) { const tt = i / 8, x = r * (0.1 + tt * 0.42), y = -r * (0.78 - tt * 1.55); poly(ctx, [[x - r * 0.04, y], [x + r * 0.34, y + r * 0.07 + Math.sin(t * 2 + i) * r * 0.02], [x + r * 0.02, y + r * 0.22]]); ctx.fill(); }
  poly(ctx, [[-r * 0.05, -r * 0.8], [r * 0.12, -r * 0.78], [r * 0.2, -r * 0.55], [r * 0.02, -r * 0.62]]); ctx.fill();
  // bridle, eye and nostril
  ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = Math.max(2, r * 0.045);
  ctx.beginPath(); ctx.moveTo(-r * 0.4, -r * 0.62); ctx.lineTo(-r * 0.2, r * 0.38); ctx.moveTo(-r * 0.82, -r * 0.02); ctx.lineTo(-r * 0.4, -r * 0.12); ctx.moveTo(-r * 0.3, -r * 0.6); ctx.lineTo(-r * 0.05, -r * 0.25); ctx.stroke();
  ctx.fillStyle = '#d8b24a'; ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.08, r * 0.04, 0, TAU); ctx.fill();
  ctx.fillStyle = '#120c08'; ell(ctx, -r * 0.36, -r * 0.36, r * 0.07, r * 0.045, -0.4); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(-r * 0.38, -r * 0.37, r * 0.016, 0, TAU); ctx.fill();
  ctx.fillStyle = '#120c08'; ell(ctx, -r * 0.88, r * 0.08, r * 0.035, r * 0.06, 0.3); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.14)'; ell(ctx, -r * 0.35, -r * 0.45, r * 0.22, r * 0.07, -0.7); ctx.fill();
  ctx.restore();
}

export function drawHero(g, rect, art, P) {
  const { ctx } = g, { cx, cy, r } = rect, t = g.t ?? 0, pal = g.pal ?? {}, LK = P.look ?? {}, PR = P.projectile ?? {};
  const accent = pal.accent ?? '#e8b52e', panel = pal.panel ?? '#1d2a3a', bob = g.reduced ? 0 : Math.sin(t * 1.6) * r * 0.025;
  // the plate: same family as the default medallion, so the title frame stays one system
  ctx.save(); ctx.translate(cx, cy + r * 1.04); ctx.scale(1, 0.18); ctx.beginPath(); ctx.arc(0, 0, r * 0.95, 0, TAU); ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fill(); ctx.restore();
  const disc = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
  disc.addColorStop(0, light(panel, 0.35)); disc.addColorStop(0.7, panel); disc.addColorStop(1, dark(panel, 0.45));
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fillStyle = disc; ctx.fill();
  const glow = ctx.createRadialGradient(cx, cy - r * 0.1, r * 0.05, cx, cy, r * 0.85); glow.addColorStop(0, alpha(accent, 0.28)); glow.addColorStop(1, alpha(accent, 0));
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, r * 0.97, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.97, 0, TAU); ctx.lineWidth = r * 0.075; ctx.strokeStyle = vgrad(ctx, cy - r, cy + r, [[0, light(accent, 0.5)], [0.5, accent], [1, dark(accent, 0.45)]]); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.86, 0, TAU); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r * 0.86, 0, TAU); ctx.clip();
  const ay = cy + bob, ballOpts = { color: PR.color, pattern: PR.pattern, rot: g.reduced ? 0.5 : t * 0.6 };
  const name = String(art).trim();
  if (name.startsWith('<')) {
    try { drawSvg(ctx, parseSvg(name), cx, ay, r * 1.55); } catch { /* a broken svg leaves the plate empty */ }
  } else if (name === 'ball') {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, cx + r * 0.1, cy + r * 0.62, r * 0.55, r * 0.1); ctx.fill();
    drawBall(ctx, cx, ay, r * 0.6, { ...ballOpts, color: PR.color ?? '#f4f1e6', pattern: PR.pattern ?? 'panels' });
  } else if (name === 'hoop' || name === 'basket') {
    const R = r * (name === 'basket' ? 0.36 : 0.46), G = { cx, cy: cy - r * 0.28 + bob, R, baseY: cy + r * 0.74, s: r };
    const S = { style: name === 'basket' ? 'basket' : 'pole', color: name === 'basket' ? (LK.jersey ?? '#2d6bb0') : '#e8632b', t };
    hoopBack(ctx, G, S); hoopMid(ctx, G, S);
    drawBall(ctx, cx, cy - r * 0.28 + R * 0.35 + Math.sin(t * 1.6) * R * 0.1, r * 0.19, ballOpts);
    hoopFront(ctx, G, S);
  } else if (name === 'club' || name === 'mallet' || name === 'bat') clubArt(ctx, cx - r * 0.1, ay + r * 0.06, r * 0.66, { wood: LK.mallet, ball: PR.color, pattern: PR.pattern, rot: ballOpts.rot, band: LK.jersey }, name);
  else if (name === 'shuttle') shuttleArt(ctx, cx, ay + r * 0.05, r * 0.74, {});
  else if (name === 'horse') horseArt(ctx, cx + r * 0.06, ay + r * 0.04, r * 0.76, { horse: LK.horse }, t);
  ctx.restore();
}

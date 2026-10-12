// Procedural puppets and painted backdrops for the story engine. Pure canvas primitives, no assets.
// Figures are drawn in local coordinates: origin = feet on the floor, y negative = up, facing right (+x).
// Three looks: 'color' (painted puppet, shaded, outlined), 'shadow' (lit leather cut-out with punched ornament and
// jointed limbs), 'glove' (hand puppet: big head, cloth body, arms, no legs; the booth counter clips the bottom).

const TAU = Math.PI * 2;

// ---- colour helpers ------------------------------------------------------------------------------------------
const rgbOf = (h) => {
  const s = String(h ?? '#888888');
  if (s.startsWith('rgb')) { const m = s.match(/\d+(\.\d+)?/g); return [Number(m[0]), Number(m[1]), Number(m[2])]; }
  let x = s.replace('#', '');
  if (x.length === 3) x = x.split('').map((c) => c + c).join('');
  const n = parseInt(x, 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mix = (a, b, k) => {
  const A = rgbOf(a), B = rgbOf(b);
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * k)},${Math.round(A[1] + (B[1] - A[1]) * k)},${Math.round(A[2] + (B[2] - A[2]) * k)})`;
};
export const dark = (h, k) => mix(h, '#000000', k);
export const light = (h, k) => mix(h, '#ffffff', k);
export const alpha = (h, a) => { const [r, g, b] = rgbOf(h); return `rgba(${r},${g},${b},${a})`; };
export const poly = (ctx, pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };
export const vgrad = (ctx, y0, y1, stops) => { const g = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
export const hgrad = (ctx, x0, x1, stops) => { const g = ctx.createLinearGradient(x0, 0, x1, 0); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
export function rrPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// Two-bone limb: draws shoulder -> elbow -> hand with a jointed look and returns [elbowX, elbowY, handX, handY].
function limb(ctx, sx, sy, tx, ty, l1, l2, bend, w, col, joint) {
  const dx = tx - sx, dy = ty - sy;
  const D = Math.hypot(dx, dy) || 0.001;
  const d = Math.min(D, l1 + l2 - 0.01);
  const ux = dx / D, uy = dy / D;
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const px = sx + ux * a, py = sy + uy * a;
  const ex = px - uy * h * bend, ey = py + ux * h * bend;
  const hx = sx + ux * d, hy = sy + uy * d;
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
  if (joint) { ctx.fillStyle = joint; ctx.beginPath(); ctx.arc(ex, ey, w * 0.36, 0, TAU); ctx.fill(); }
  return [ex, ey, hx, hy];
}

// ---- accessories -----------------------------------------------------------------------------------------------
function drawHat(ctx, kind, hx, hy, r, col, acc) {
  const rim = dark(col, 0.45);
  ctx.lineWidth = Math.max(1, r * 0.1); ctx.strokeStyle = rim; ctx.lineJoin = 'round';
  const fillGrad = (x0, x1) => hgrad(ctx, x0, x1, [[0, light(col, 0.35)], [0.55, col], [1, dark(col, 0.35)]]);
  switch (kind) {
    case 'crown': {
      const w = r * 1.35;
      ctx.fillStyle = fillGrad(hx - w, hx + w);
      poly(ctx, [[hx - w, hy - r * 0.55], [hx - w, hy - r * 1.75], [hx - w / 2, hy - r * 1.25], [hx, hy - r * 2.0], [hx + w / 2, hy - r * 1.25], [hx + w, hy - r * 1.75], [hx + w, hy - r * 0.55]]); ctx.fill(); ctx.stroke();
      ctx.fillStyle = acc;
      for (const x of [-w * 0.5, 0, w * 0.5]) { ctx.beginPath(); ctx.arc(hx + x, hy - r * 0.8, r * 0.14, 0, TAU); ctx.fill(); }
      break;
    }
    case 'turban': {
      ctx.fillStyle = fillGrad(hx - r * 1.3, hx + r * 1.3);
      ctx.beginPath(); ctx.ellipse(hx, hy - r * 0.72, r * 1.3, r * 0.98, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = alpha('#000000', 0.22); ctx.lineWidth = Math.max(1, r * 0.08);
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(hx, hy - r * 0.62, r * (0.55 + i * 0.27), Math.PI * 1.08, Math.PI * 1.9); ctx.stroke(); }
      ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(hx + r * 0.1, hy - r * 1.35, r * 0.2, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(hx + r * 0.06, hy - r * 1.4, r * 0.07, 0, TAU); ctx.fill();
      break;
    }
    case 'cap':
      ctx.fillStyle = fillGrad(hx - r * 1.1, hx + r * 1.1);
      ctx.beginPath(); ctx.ellipse(hx, hy - r * 0.5, r * 1.12, r * 0.78, 0, Math.PI, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = dark(col, 0.2); ctx.beginPath(); ctx.rect(hx - r * 1.28, hy - r * 0.58, r * 2.56, r * 0.2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(hx, hy - r * 1.3, r * 0.14, 0, TAU); ctx.fill();
      break;
    case 'pointed':
      ctx.fillStyle = fillGrad(hx - r * 1.1, hx + r * 1.1);
      poly(ctx, [[hx - r * 1.1, hy - r * 0.45], [hx + r * 1.1, hy - r * 0.45], [hx + r * 0.1, hy - r * 2.6]]); ctx.fill(); ctx.stroke();
      ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(hx + r * 0.12, hy - r * 2.6, r * 0.2, 0, TAU); ctx.fill();
      break;
    case 'kalpak':
      ctx.fillStyle = fillGrad(hx - r, hx + r);
      rrPath(ctx, hx - r * 0.95, hy - r * 2.0, r * 1.9, r * 1.55, r * 0.4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = acc; ctx.fillRect(hx - r * 0.95, hy - r * 0.85, r * 1.9, r * 0.28);
      break;
    case 'straw':
      ctx.fillStyle = fillGrad(hx - r * 1.9, hx + r * 1.9);
      poly(ctx, [[hx - r * 1.95, hy - r * 0.4], [hx + r * 1.95, hy - r * 0.4], [hx + r * 0.1, hy - r * 1.9]]); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = alpha('#000000', 0.2); ctx.lineWidth = Math.max(1, r * 0.06);
      for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(hx + i * r * 0.1, hy - r * 1.7); ctx.lineTo(hx + i * r * 0.55, hy - r * 0.42); ctx.stroke(); }
      break;
    case 'hood':
      ctx.fillStyle = fillGrad(hx - r * 1.3, hx + r * 1.3);
      ctx.beginPath(); ctx.arc(hx, hy - r * 0.1, r * 1.3, Math.PI * 0.92, Math.PI * 2.08); ctx.fill(); ctx.stroke();
      break;
    case 'plume': {
      ctx.fillStyle = fillGrad(hx - r * 1.2, hx + r * 1.2);
      ctx.beginPath(); ctx.ellipse(hx, hy - r * 0.55, r * 1.2, r * 0.62, 0, Math.PI, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = acc; ctx.strokeStyle = dark(acc, 0.4);
      ctx.beginPath(); ctx.moveTo(hx + r * 0.3, hy - r * 1.05); ctx.bezierCurveTo(hx + r * 1.2, hy - r * 2.4, hx + r * 2.2, hy - r * 2.0, hx + r * 1.8, hy - r * 1.2); ctx.bezierCurveTo(hx + r * 1.5, hy - r * 1.7, hx + r * 0.9, hy - r * 1.4, hx + r * 0.3, hy - r * 1.05); ctx.fill(); ctx.stroke();
      break;
    }
    case 'topknot':
      ctx.fillStyle = dark(col, 0.1);
      ctx.beginPath(); ctx.arc(hx, hy - r * 1.18, r * 0.42, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = acc; ctx.fillRect(hx - r * 0.35, hy - r * 0.92, r * 0.7, r * 0.14);
      break;
    default: break;
  }
}

function drawProp(ctx, kind, x, y, s, col, acc, t) {
  ctx.strokeStyle = col; ctx.fillStyle = acc; ctx.lineWidth = Math.max(2, s * 0.03); ctx.lineCap = 'round';
  switch (kind) {
    case 'staff':
      ctx.strokeStyle = '#4a2e14'; ctx.lineWidth = Math.max(2.5, s * 0.032);
      ctx.beginPath(); ctx.moveTo(x, y + s * 0.26); ctx.lineTo(x, y - s * 0.42); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = Math.max(1, s * 0.01); ctx.beginPath(); ctx.moveTo(x - s * 0.006, y + s * 0.24); ctx.lineTo(x - s * 0.006, y - s * 0.4); ctx.stroke();
      ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(x, y - s * 0.44, s * 0.04, 0, TAU); ctx.fill(); break;
    case 'fan':
      ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, s * 0.19, -Math.PI * 0.92, -Math.PI * 0.08); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
      for (let i = 1; i < 5; i++) { const a = -Math.PI * (0.08 + 0.168 * i); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * s * 0.19, y + Math.sin(a) * s * 0.19); ctx.stroke(); }
      break;
    case 'drum':
      ctx.fillStyle = '#8a4a22'; ctx.beginPath(); ctx.ellipse(x, y, s * 0.11, s * 0.08, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f3dfb0'; ctx.beginPath(); ctx.ellipse(x, y - s * 0.015, s * 0.09, s * 0.05, 0, 0, TAU); ctx.fill(); break;
    case 'bag':
      ctx.fillStyle = acc; ctx.beginPath(); ctx.ellipse(x, y + s * 0.09, s * 0.11, s * 0.13, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = dark(acc, 0.35); ctx.fillRect(x - s * 0.04, y - s * 0.02, s * 0.08, s * 0.05); break;
    case 'lute':
      ctx.fillStyle = '#a8662c'; ctx.beginPath(); ctx.ellipse(x + s * 0.05, y, s * 0.11, s * 0.08, -0.5, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3a210e'; ctx.beginPath(); ctx.arc(x + s * 0.05, y, s * 0.025, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + s * 0.12, y - s * 0.06); ctx.lineTo(x + s * 0.3, y - s * 0.22); ctx.stroke(); break;
    case 'lantern': {
      const sw = Math.sin((t ?? 0) * 2.5) * s * 0.012;
      ctx.beginPath(); ctx.moveTo(x, y - s * 0.12); ctx.lineTo(x + sw, y); ctx.stroke();
      ctx.fillStyle = '#e8453a'; ctx.beginPath(); ctx.ellipse(x + sw, y + s * 0.075, s * 0.065, s * 0.085, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,233,168,0.55)'; ctx.beginPath(); ctx.ellipse(x + sw, y + s * 0.075, s * 0.035, s * 0.05, 0, 0, TAU); ctx.fill(); break;
    }
    case 'scroll':
      ctx.fillStyle = '#f2e3bd'; rrPath(ctx, x - s * 0.055, y - s * 0.11, s * 0.11, s * 0.22, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8a5a2a'; ctx.fillRect(x - s * 0.07, y - s * 0.12, s * 0.14, s * 0.03); ctx.fillRect(x - s * 0.07, y + s * 0.09, s * 0.14, s * 0.03); break;
    case 'cup':
      ctx.fillStyle = '#d9a52a';
      poly(ctx, [[x - s * 0.07, y - s * 0.06], [x + s * 0.07, y - s * 0.06], [x + s * 0.045, y + s * 0.08], [x - s * 0.045, y + s * 0.08]]); ctx.fill(); ctx.stroke(); break;
    case 'sword':
      ctx.strokeStyle = '#dfe6ee'; ctx.lineWidth = Math.max(2, s * 0.028);
      ctx.beginPath(); ctx.moveTo(x, y + s * 0.04); ctx.lineTo(x + s * 0.2, y - s * 0.3); ctx.stroke();
      ctx.strokeStyle = acc; ctx.lineWidth = Math.max(2.5, s * 0.035); ctx.beginPath(); ctx.moveTo(x - s * 0.04, y - s * 0.03); ctx.lineTo(x + s * 0.05, y + s * 0.03); ctx.stroke(); break;
    case 'stick':
      ctx.strokeStyle = '#6a3f1a'; ctx.lineWidth = Math.max(2.5, s * 0.034);
      ctx.beginPath(); ctx.moveTo(x - s * 0.1, y + s * 0.1); ctx.lineTo(x + s * 0.17, y - s * 0.18); ctx.stroke();
      ctx.strokeStyle = acc; ctx.lineWidth = Math.max(1.5, s * 0.015); ctx.beginPath(); ctx.moveTo(x - s * 0.05, y + s * 0.05); ctx.lineTo(x + s * 0.12, y - s * 0.12); ctx.stroke(); break;
    default: break;
  }
}

// ---- animal species picked from the cast name when the recipe does not say --------------------------------------
const speciesOf = (c) => {
  if (c.species) return c.species;
  const n = `${c.name ?? ''}`.toLowerCase();
  if (/kerbau|buffalo|trau|\box\b|bull|\bcow/.test(n)) return 'buffalo';
  if (/fox|\bcao\b/.test(n)) return 'fox';
  if (/kancil|deer|mouse/.test(n)) return 'deer';
  return c.stripes ? 'tiger' : 'deer';
};

// ---- one figure ------------------------------------------------------------------------------------------------
// c: cast recipe; o: { style:'shadow'|'color'|'glove', cut, t, pose, speaking, flip, strings:topY(local)|null,
//    rods: bottomY(local)|null, alpha, a1, a2, lean, walk, noShadow }
export function drawFigure(ctx, c, x, base, H, o) {
  const shadow = o.style === 'shadow';
  const glove = o.style === 'glove';
  const bodyC = c.color ?? '#9a5b3a';
  const accC = c.accent ?? '#e6b84a';
  const skinC = c.skin ?? '#e7c29b';
  const cut = o.cut ?? '#f6dfa3';
  const leather = shadow ? mix('#120804', bodyC, 0.14) : bodyC;
  const rimC = shadow ? mix(bodyC, cut, 0.55) : dark(bodyC, 0.5);
  const body = shadow ? leather : bodyC;
  const acc = shadow ? mix('#160a05', accC, 0.3) : accC;
  const skin = shadow ? mix('#160a05', skinC, 0.2) : skinC;
  const s = H * (c.scale ?? 1);
  const t = o.t ?? 0;
  const phase = (c.phase ?? 0) + x * 0.013;
  const talk = o.speaking ? Math.sin(t * 9 + phase) : 0;
  const breath = Math.sin(t * 1.7 + phase);
  const walk = o.walk ? Math.sin(t * 9 + phase) : 0;
  ctx.save();
  ctx.globalAlpha = (o.alpha ?? 1);
  ctx.translate(x, base);
  if (o.flip) ctx.scale(-1, 1);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const kind = c.kind ?? 'person';
  const hands = [];
  const knees = [];
  const head = { x: 0, y: 0, r: 0 };
  const shoulders = [];
  const ol = Math.max(1, s * 0.012);
  const lineC = shadow ? rimC : dark(bodyC, 0.55);

  // soft contact shadow on the floor (painted puppets only; a lit screen already has its own)
  if (!shadow && !glove && !o.noShadow) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath(); ctx.ellipse(0, 1, s * (kind === 'camel' || kind === 'croc' ? 0.34 : 0.17), s * 0.025, 0, 0, TAU); ctx.fill();
  }
  const eye = (ex, ey, r) => {
    if (shadow) { ctx.fillStyle = cut; ctx.beginPath(); ctx.ellipse(ex, ey, r * 1.3, r * 0.8, 0, 0, TAU); ctx.fill(); return; }
    ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.arc(ex, ey, r * 1.35, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1c130e'; ctx.beginPath(); ctx.arc(ex + r * 0.25, ey, r * 0.85, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + r * 0.1, ey - r * 0.3, r * 0.3, 0, TAU); ctx.fill();
  };
  const fillBody = (col, x0, x1) => { ctx.fillStyle = shadow ? col : hgrad(ctx, x0, x1, [[0, light(col, 0.22)], [0.5, col], [1, dark(col, 0.32)]]); };
  const outline = () => { ctx.strokeStyle = lineC; ctx.lineWidth = ol; ctx.stroke(); };
  const sheen = (px, py, rx, ry, rot) => { if (shadow) return; ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(px, py, rx, ry, rot ?? 0, 0, TAU); ctx.fill(); };

  if (kind === 'camel') {
    const bob = Math.sin(t * 2.4 + phase) * s * 0.01;
    const sw = o.walk ? Math.sin(t * 6 + phase) * s * 0.05 : Math.sin(t * 1.2 + phase) * s * 0.012;
    ctx.strokeStyle = shadow ? body : dark(bodyC, 0.2); ctx.lineWidth = s * 0.045;
    for (const [lx, d] of [[-0.19, -1], [0.14, -1]]) { ctx.beginPath(); ctx.moveTo(lx * s, -0.36 * s); ctx.lineTo(lx * s + d * sw * 0.7, -0.17 * s); ctx.lineTo(lx * s + d * sw, 0); ctx.stroke(); }
    ctx.strokeStyle = body; ctx.lineWidth = s * 0.07;
    ctx.beginPath(); ctx.moveTo(0.22 * s, -0.43 * s + bob); ctx.quadraticCurveTo(0.36 * s, -0.55 * s, 0.33 * s, -0.78 * s + bob); ctx.stroke();
    fillBody(bodyC, -0.3 * s, 0.3 * s);
    ctx.beginPath(); ctx.ellipse(0, -0.42 * s + bob, 0.29 * s, 0.1 * s, 0, 0, TAU); ctx.fill(); outline();
    for (const [hx, r] of [[-0.07, 0.075], [0.1, 0.065]]) { ctx.beginPath(); ctx.ellipse(hx * s, -0.52 * s + bob, r * s, r * 1.2 * s, 0, 0, TAU); ctx.fill(); outline(); }
    sheen(-0.02 * s, -0.45 * s + bob, 0.1 * s, 0.025 * s, -0.1);
    if (!shadow) {
      ctx.fillStyle = accC; ctx.beginPath(); ctx.moveTo(-0.19 * s, -0.54 * s + bob); ctx.quadraticCurveTo(0, -0.5 * s + bob, 0.17 * s, -0.54 * s + bob); ctx.lineTo(0.15 * s, -0.36 * s + bob); ctx.lineTo(-0.17 * s, -0.36 * s + bob); ctx.closePath(); ctx.fill(); outline();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 4; i++) ctx.fillRect((-0.15 + i * 0.09) * s, -0.4 * s + bob, s * 0.03, s * 0.025);
    }
    if (c.pack) { ctx.fillStyle = shadow ? acc : dark(accC, 0.2); ctx.beginPath(); ctx.ellipse(0.0, -0.66 * s + bob, 0.13 * s, 0.075 * s, 0, 0, TAU); ctx.fill(); outline(); }
    fillBody(bodyC, 0.3 * s, 0.46 * s);
    ctx.beginPath(); ctx.ellipse(0.4 * s, -0.8 * s + bob, 0.075 * s, 0.045 * s, -0.25, 0, TAU); ctx.fill(); outline();
    eye(0.39 * s, -0.82 * s + bob, s * 0.01);
    ctx.strokeStyle = body; ctx.lineWidth = s * 0.05;
    for (const [lx, d] of [[-0.1, 1], [0.21, 1]]) { ctx.beginPath(); ctx.moveTo(lx * s, -0.36 * s); ctx.lineTo(lx * s + d * sw * 0.7, -0.17 * s); ctx.lineTo(lx * s + d * sw, 0); ctx.stroke(); }
    head.x = 0.4 * s; head.y = -0.82 * s; head.r = s * 0.06;
  } else if (kind === 'croc') {
    const snap = (Math.sin(t * 2.2 + phase) + 1) * 0.5 * s * 0.035;
    const wag = Math.sin(t * 2 + phase) * s * 0.025;
    ctx.strokeStyle = body; ctx.lineWidth = s * 0.05;
    for (const lx of [-0.18, 0.12]) { ctx.beginPath(); ctx.moveTo(lx * s, -0.12 * s); ctx.lineTo(lx * s - 0.03 * s, 0); ctx.stroke(); }
    fillBody(bodyC, -0.62 * s, -0.1 * s);
    ctx.beginPath(); ctx.moveTo(-0.26 * s, -0.24 * s); ctx.quadraticCurveTo(-0.45 * s, -0.2 * s + wag, -0.66 * s, -0.05 * s + wag * 1.5); ctx.quadraticCurveTo(-0.45 * s, -0.12 * s + wag, -0.26 * s, -0.1 * s); ctx.closePath(); ctx.fill(); outline();
    fillBody(bodyC, -0.3 * s, 0.3 * s);
    ctx.beginPath(); ctx.ellipse(0, -0.17 * s, 0.3 * s, 0.085 * s, 0, 0, TAU); ctx.fill(); outline();
    fillBody(bodyC, 0.2 * s, 0.64 * s);
    poly(ctx, [[0.22 * s, -0.23 * s], [0.64 * s, -0.19 * s - snap], [0.64 * s, -0.165 * s - snap], [0.22 * s, -0.15 * s]]); ctx.fill(); outline();
    poly(ctx, [[0.22 * s, -0.15 * s], [0.62 * s, -0.14 * s + snap], [0.62 * s, -0.115 * s + snap], [0.22 * s, -0.1 * s]]); ctx.fill(); outline();
    ctx.fillStyle = shadow ? cut : '#f6f0de';
    for (let i = 0; i < 5; i++) { const tx = (0.3 + i * 0.065) * s; poly(ctx, [[tx, -0.168 * s - snap * 0.5], [tx + 0.02 * s, -0.168 * s - snap * 0.5], [tx + 0.01 * s, -0.138 * s - snap * 0.1]]); ctx.fill(); }
    ctx.fillStyle = shadow ? acc : dark(bodyC, 0.3);
    for (let i = 0; i < 7; i++) { const sx = (-0.24 + i * 0.075) * s; poly(ctx, [[sx - s * 0.02, -0.25 * s], [sx, -0.285 * s], [sx + s * 0.02, -0.25 * s]]); ctx.fill(); }
    sheen(-0.02 * s, -0.2 * s, 0.14 * s, 0.015 * s);
    eye(0.2 * s, -0.235 * s, s * 0.011);
    head.x = 0.35 * s; head.y = -0.22 * s; head.r = s * 0.05;
  } else if (kind === 'duck') {
    const bob = Math.sin(t * 3 + phase) * s * 0.012;
    const w = Math.sin(t * 2.5 + phase) * s * 0.02;
    fillBody(bodyC, -0.18 * s, 0.18 * s);
    ctx.beginPath(); ctx.moveTo(-0.2 * s, -0.17 * s + bob); ctx.quadraticCurveTo(-0.26 * s, -0.2 * s, -0.24 * s, -0.24 * s + bob); ctx.quadraticCurveTo(-0.1 * s, -0.17 * s, 0.05 * s, -0.2 * s); ctx.quadraticCurveTo(0.2 * s, -0.17 * s, 0.17 * s, -0.1 * s); ctx.quadraticCurveTo(0, -0.02 * s + bob, -0.2 * s, -0.17 * s + bob); ctx.fill(); outline();
    ctx.beginPath(); ctx.ellipse(-0.02 * s, -0.12 * s + bob, 0.09 * s, 0.05 * s, -0.2, 0, TAU); ctx.fillStyle = shadow ? body : dark(bodyC, 0.12); ctx.fill(); outline();
    fillBody(bodyC, 0.08 * s, 0.24 * s);
    ctx.beginPath(); ctx.arc(0.15 * s, -0.27 * s + bob, 0.072 * s, 0, TAU); ctx.fill(); outline();
    ctx.fillStyle = shadow ? acc : '#f2a21c'; poly(ctx, [[0.21 * s, -0.285 * s + bob], [0.32 * s + w, -0.265 * s + bob], [0.21 * s, -0.245 * s + bob]]); ctx.fill(); outline();
    eye(0.17 * s, -0.295 * s + bob, s * 0.011);
    head.x = 0.15 * s; head.y = -0.3 * s; head.r = s * 0.07;
  } else if (kind === 'beast') {
    const species = speciesOf(c);
    const bob = Math.sin(t * 2 + phase) * s * 0.01;
    const gallop = o.walk ? Math.sin(t * 8 + phase) * s * 0.05 : Math.sin(t * 1.6 + phase) * s * 0.008;
    const big = species === 'buffalo' ? 1.15 : species === 'deer' ? 0.82 : 1;
    const L = s * 0.26 * big, bodyY = -s * 0.34 * big;
    ctx.strokeStyle = shadow ? body : dark(bodyC, 0.25); ctx.lineWidth = s * 0.04;
    for (const [lx, d] of [[-0.8, -1], [0.7, -1]]) { ctx.beginPath(); ctx.moveTo(lx * L, bodyY); ctx.lineTo(lx * L + d * gallop * 0.5, bodyY * 0.5); ctx.lineTo(lx * L + d * gallop, 0); ctx.stroke(); }
    ctx.strokeStyle = body; ctx.lineWidth = s * 0.03;
    if (species === 'fox') {
      ctx.lineWidth = s * 0.07; ctx.beginPath(); ctx.moveTo(-L, bodyY - s * 0.02); ctx.quadraticCurveTo(-L * 1.7, bodyY - s * 0.12 + Math.sin(t * 2 + phase) * s * 0.02, -L * 1.5, bodyY + s * 0.05); ctx.stroke();
      ctx.strokeStyle = shadow ? cut : '#fff5e0'; ctx.lineWidth = s * 0.03; ctx.beginPath(); ctx.moveTo(-L * 1.55, bodyY - s * 0.02); ctx.lineTo(-L * 1.5, bodyY + s * 0.05); ctx.stroke();
    } else { ctx.beginPath(); ctx.moveTo(-L * 0.98, bodyY - s * 0.02); ctx.quadraticCurveTo(-L * 1.3, bodyY, -L * 1.25, bodyY + s * 0.1 + Math.sin(t * 2 + phase) * s * 0.02); ctx.stroke(); }
    const hx = L * 1.15, hy = bodyY - s * 0.2 * big + bob;
    ctx.strokeStyle = body; ctx.lineWidth = s * (species === 'buffalo' ? 0.1 : 0.065);
    ctx.beginPath(); ctx.moveTo(L * 0.7, bodyY - s * 0.04 + bob); ctx.lineTo(hx - s * 0.03, hy + s * 0.02); ctx.stroke();
    fillBody(bodyC, -L, L);
    ctx.beginPath(); ctx.ellipse(0, bodyY + bob, L, s * 0.095 * big, 0, 0, TAU); ctx.fill(); outline();
    if (species === 'buffalo') { ctx.beginPath(); ctx.ellipse(L * 0.45, bodyY - s * 0.06 + bob, s * 0.09, s * 0.07, 0, 0, TAU); ctx.fill(); }
    sheen(-L * 0.1, bodyY - s * 0.05 * big + bob, L * 0.5, s * 0.02, 0);
    if (c.stripes || species === 'tiger') { ctx.strokeStyle = shadow ? cut : accC; ctx.lineWidth = s * 0.02; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * L * 0.28, bodyY - s * 0.085 + bob); ctx.lineTo(i * L * 0.28 + s * 0.02, bodyY + s * 0.05 + bob); ctx.stroke(); } }
    fillBody(bodyC, hx - s * 0.08, hx + s * 0.1);
    if (species === 'fox') { poly(ctx, [[hx - s * 0.06, hy - s * 0.045], [hx + s * 0.13, hy + s * 0.015], [hx - s * 0.06, hy + s * 0.06]]); ctx.fill(); outline(); poly(ctx, [[hx - s * 0.05, hy - s * 0.04], [hx - s * 0.02, hy - s * 0.13], [hx + s * 0.02, hy - s * 0.04]]); ctx.fill(); outline(); }
    else { ctx.beginPath(); ctx.ellipse(hx + s * 0.02, hy, s * (species === 'buffalo' ? 0.1 : 0.075), s * 0.055, -0.3, 0, TAU); ctx.fill(); outline(); }
    if (species === 'buffalo') { ctx.strokeStyle = shadow ? acc : '#d8cdb0'; ctx.lineWidth = s * 0.025; ctx.beginPath(); ctx.moveTo(hx - s * 0.04, hy - s * 0.04); ctx.quadraticCurveTo(hx - s * 0.16, hy - s * 0.06, hx - s * 0.13, hy - s * 0.14); ctx.stroke(); }
    if (species === 'deer') { ctx.fillStyle = body; poly(ctx, [[hx - s * 0.05, hy - s * 0.03], [hx - s * 0.02, hy - s * 0.12], [hx + s * 0.01, hy - s * 0.03]]); ctx.fill(); outline(); }
    eye(hx + s * 0.04, hy - s * 0.012, s * 0.009);
    ctx.strokeStyle = body; ctx.lineWidth = s * 0.045;
    for (const [lx, d] of [[-0.62, 1], [0.85, 1]]) { ctx.beginPath(); ctx.moveTo(lx * L, bodyY); ctx.lineTo(lx * L + d * gallop * 0.5, bodyY * 0.5); ctx.lineTo(lx * L + d * gallop, 0); ctx.stroke(); ctx.fillStyle = shadow ? body : dark(bodyC, 0.5); ctx.fillRect(lx * L + d * gallop - s * 0.02, -s * 0.02, s * 0.045, s * 0.02); }
    head.x = hx; head.y = hy; head.r = s * 0.06;
  } else {
    // humanoid: person | ruler | clown | trader | child | monkey
    const robe = kind === 'ruler' || c.robe || glove;
    const fat = kind === 'clown' ? 1.28 : (c.build ?? 1) * (kind === 'child' ? 0.9 : 1);
    const tall = kind === 'child' ? 0.78 : 1;
    const hs = s * tall;
    const bigHead = glove ? 1.5 : 1;
    const headR = hs * (kind === 'clown' ? 0.1 : kind === 'monkey' ? 0.105 : 0.088) * bigHead * (kind === 'child' ? 1.1 : 1);
    const hipY = glove ? -hs * 0.15 : -hs * 0.4;
    const shY = glove ? -hs * 0.46 : -hs * 0.71;
    const lean = o.lean ?? (o.pose === 'bow' ? 0.32 : o.pose === 'slump' ? 0.2 : 0);
    const sway = breath * hs * 0.006 + (o.speaking ? Math.abs(talk) * hs * 0.01 : 0) + (o.walk ? Math.abs(walk) * hs * 0.01 : 0);
    const wTop = hs * 0.13 * fat, wHip = hs * (robe ? 0.2 : 0.12) * fat;
    const legC = shadow ? body : (c.legColor ?? dark(bodyC, 0.35));

    if (kind === 'monkey') { ctx.strokeStyle = body; ctx.lineWidth = hs * 0.04; ctx.beginPath(); ctx.moveTo(-hs * 0.05, hipY); ctx.bezierCurveTo(-hs * 0.4, hipY + hs * 0.02, -hs * 0.35, -hs * 0.8, -hs * 0.15, -hs * 0.72 + Math.sin(t * 3 + phase) * hs * 0.05); ctx.stroke(); }

    // legs (jointed, with a walk cycle)
    if (!glove) {
      for (const side of [-1, 1]) {
        const step = o.walk ? walk * side : 0;
        const fx = side * hs * 0.075 * fat + step * hs * 0.09;
        const fy = o.walk ? -Math.max(0, step) * hs * 0.05 : 0;
        const hx = side * hs * 0.055 * fat, hy = hipY + sway * 0.4;
        knees.push([hx + (fx - hx) * 0.5, hy + (fy - hy) * 0.5]);
        if (robe && !shadow) continue;
        limb(ctx, hx, hy, fx, fy - hs * 0.012, hs * 0.2, hs * 0.2, side * 0.6, hs * 0.082 * (fat > 1 ? 1.1 : 1), legC, shadow ? null : 'rgba(0,0,0,0.15)');
        ctx.fillStyle = shadow ? body : dark(accC, 0.35);
        ctx.beginPath(); ctx.ellipse(fx + hs * 0.035, fy - hs * 0.01, hs * 0.065, hs * 0.027, 0, 0, TAU); ctx.fill();
      }
    }

    // upper body, rotated about the hips for bows
    ctx.save();
    ctx.translate(0, hipY + sway); ctx.rotate(lean);
    const ty = shY - hipY, hy2 = ty - headR * 1.55;
    const hem = glove ? hs * 0.34 : (robe ? -hipY - hs * 0.02 : hs * 0.05);
    fillBody(bodyC, -wHip, wHip);
    ctx.beginPath();
    ctx.moveTo(-wTop, ty); ctx.quadraticCurveTo(0, ty - hs * 0.03, wTop, ty);
    ctx.quadraticCurveTo(wTop * 1.05, ty * 0.35, wHip, hem);
    ctx.quadraticCurveTo(0, hem + hs * 0.035, -wHip, hem);
    ctx.quadraticCurveTo(-wTop * 1.05, ty * 0.35, -wTop, ty);
    ctx.closePath(); ctx.fill(); outline();
    ctx.fillStyle = acc;
    ctx.beginPath(); ctx.moveTo(-wHip, hem); ctx.quadraticCurveTo(0, hem + hs * 0.035, wHip, hem); ctx.lineTo(wHip * 0.97, hem - hs * 0.028); ctx.quadraticCurveTo(0, hem + hs * 0.008, -wHip * 0.97, hem - hs * 0.028); ctx.fill();
    const sashY = ty * 0.25;
    ctx.fillStyle = acc; ctx.fillRect(-wHip * 0.82, sashY - hs * 0.018, wHip * 1.64, hs * 0.036);
    if (!shadow) { ctx.fillStyle = light(accC, 0.5); ctx.beginPath(); ctx.arc(0, sashY, hs * 0.016, 0, TAU); ctx.fill(); }
    ctx.fillStyle = shadow ? acc : dark(bodyC, 0.2);
    poly(ctx, [[-wTop * 0.45, ty], [wTop * 0.45, ty], [0, ty + hs * 0.07]]); ctx.fill();
    if (kind === 'trader') { ctx.fillStyle = shadow ? acc : accC; ctx.beginPath(); ctx.ellipse(-wTop * 0.8, ty + hs * 0.2, hs * 0.1, hs * 0.13, 0.3, 0, TAU); ctx.fill(); outline(); }
    if (shadow) {
      ctx.fillStyle = cut;
      for (let r = 0; r < 3; r++) for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(i * wHip * 0.3, ty * 0.62 - r * hs * 0.05 + (i % 2) * hs * 0.012, hs * 0.0105, 0, TAU); ctx.fill(); }
      ctx.beginPath(); ctx.arc(0, ty * 0.78, hs * 0.02, 0, TAU); ctx.fill();
      for (let i = -3; i <= 3; i++) { poly(ctx, [[i * wHip * 0.28 - hs * 0.012, hem - hs * 0.045], [i * wHip * 0.28, hem - hs * 0.07], [i * wHip * 0.28 + hs * 0.012, hem - hs * 0.045]]); ctx.fill(); }
    } else {
      ctx.strokeStyle = 'rgba(0,0,0,0.16)'; ctx.lineWidth = Math.max(1, hs * 0.008);
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * wHip * 0.35, sashY + hs * 0.03); ctx.quadraticCurveTo(i * wHip * 0.5, (sashY + hem) / 2, i * wHip * 0.7, hem - hs * 0.03); ctx.stroke(); }
      sheen(-wTop * 0.35, ty * 0.5, wTop * 0.18, hs * 0.1, 0.1);
    }
    // arms (jointed): angle 0 hangs down, positive swings outward and up
    const a1 = o.a1 ?? 0.12, a2 = o.a2 ?? 0.12;
    const reach = hs * 0.3;
    const armW = hs * (glove ? 0.085 : 0.062);
    const armC = shadow ? body : (glove ? bodyC : dark(bodyC, 0.12));
    const hand = (side, ang) => {
      const sx = side * wTop * 0.95, sy = ty + hs * 0.025;
      const tx = sx + Math.sin(ang) * reach * side * 0.98, ty2 = sy + Math.cos(ang) * reach * 0.98;
      let hx, hy;
      if (glove) { hx = sx + side * hs * 0.04 + Math.sin(ang) * hs * 0.1 * side; hy = sy + Math.cos(ang) * hs * 0.17; ctx.strokeStyle = armC; ctx.lineWidth = armW; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke(); }
      else { const r = limb(ctx, sx, sy, tx, ty2, hs * 0.16, hs * 0.15, -side, armW, armC, shadow ? 'rgba(255,230,160,0.8)' : acc); hx = r[2]; hy = r[3]; }
      ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(hx, hy, hs * (glove ? 0.042 : 0.034), 0, TAU); ctx.fill();
      if (!shadow) outline();
      return [hx, hy];
    };
    const h1 = hand(-1, a1);
    ctx.fillStyle = shadow ? body : dark(skinC, 0.12); ctx.fillRect(-hs * 0.022, ty - hs * 0.04, hs * 0.044, hs * 0.07);
    if (shadow) {
      ctx.fillStyle = skin;
      ctx.beginPath(); ctx.arc(0, hy2, headR, 0, TAU); ctx.fill();
      poly(ctx, [[headR * 0.7, hy2 - headR * 0.15], [headR * 1.55, hy2 + headR * 0.35], [headR * 0.75, hy2 + headR * 0.5]]); ctx.fill();
      ctx.beginPath(); ctx.arc(headR * 0.3, hy2 + headR * 0.75, headR * 0.45, 0, TAU); ctx.fill();
      ctx.strokeStyle = rimC; ctx.lineWidth = Math.max(1, hs * 0.008); ctx.beginPath(); ctx.arc(0, hy2, headR, 0, TAU); ctx.stroke();
    } else {
      const hg = ctx.createRadialGradient(-headR * 0.3, hy2 - headR * 0.35, headR * 0.1, 0, hy2, headR * 1.15);
      hg.addColorStop(0, light(skinC, 0.3)); hg.addColorStop(0.7, skinC); hg.addColorStop(1, dark(skinC, 0.28));
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0, hy2, headR, 0, TAU); ctx.fill(); outline();
      ctx.fillStyle = dark(skinC, 0.1); ctx.beginPath(); ctx.ellipse(-headR * 0.85, hy2 + headR * 0.05, headR * 0.17, headR * 0.26, 0, 0, TAU); ctx.fill();
      if (!c.bald && c.hat !== 'topknot' && !(c.mask && c.mask !== 'none')) { ctx.fillStyle = c.hair ?? '#2a1c14'; ctx.beginPath(); ctx.arc(0, hy2, headR * 1.02, Math.PI * 0.95, Math.PI * 1.9); ctx.lineTo(0, hy2 - headR * 0.2); ctx.fill(); }
    }
    const faceY = hy2;
    if (c.mask && c.mask !== 'none') {
      const mc = c.maskColor ?? '#1f1a17';
      ctx.fillStyle = shadow ? body : hgrad(ctx, -headR, headR, [[0, light(mc, 0.25)], [1, dark(mc, 0.3)]]);
      ctx.beginPath(); ctx.moveTo(-headR * 1.0, faceY - headR * 0.1); ctx.quadraticCurveTo(-headR * 0.9, faceY - headR * 1.05, 0, faceY - headR * 1.05); ctx.quadraticCurveTo(headR * 0.95, faceY - headR * 1.0, headR * 1.02, faceY - headR * 0.1); ctx.quadraticCurveTo(headR * 0.5, faceY + headR * 0.55, 0, faceY + headR * 0.4); ctx.quadraticCurveTo(-headR * 0.6, faceY + headR * 0.5, -headR * 1.0, faceY - headR * 0.1); ctx.fill(); outline();
      if (c.mask === 'long') { poly(ctx, [[headR * 0.2, faceY - headR * 0.1], [headR * 1.45, faceY + headR * 0.6], [headR * 0.25, faceY + headR * 0.35]]); ctx.fill(); outline(); }
      if (c.mask === 'beak') { poly(ctx, [[headR * 0.25, faceY - headR * 0.2], [headR * 1.9, faceY + headR * 0.7], [headR * 0.25, faceY + headR * 0.5]]); ctx.fill(); outline(); }
      ctx.fillStyle = shadow ? cut : '#f3e2c5';
      for (const ex of [-headR * 0.38, headR * 0.35]) { ctx.beginPath(); ctx.ellipse(ex, faceY - headR * 0.25, headR * 0.2, headR * 0.12, 0.1, 0, TAU); ctx.fill(); }
      if (!shadow) {
        ctx.fillStyle = '#1c130e'; for (const ex of [-headR * 0.34, headR * 0.39]) { ctx.beginPath(); ctx.arc(ex, faceY - headR * 0.25, headR * 0.07, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#9c3d30'; ctx.beginPath(); ctx.ellipse(headR * 0.3, faceY + headR * 0.62, headR * 0.22, headR * (0.04 + Math.abs(talk) * 0.12), 0, 0, TAU); ctx.fill();
      }
    } else if (!shadow) {
      ctx.strokeStyle = dark(c.hair ?? '#3a281c', 0.1); ctx.lineWidth = Math.max(1, headR * 0.1);
      ctx.beginPath(); ctx.moveTo(-headR * 0.25, faceY - headR * 0.42); ctx.lineTo(headR * 0.12, faceY - headR * 0.4); ctx.moveTo(headR * 0.3, faceY - headR * 0.4); ctx.lineTo(headR * 0.7, faceY - headR * 0.44); ctx.stroke();
      eye(-headR * 0.05, faceY - headR * 0.18, headR * 0.12); eye(headR * 0.5, faceY - headR * 0.18, headR * 0.12);
      ctx.fillStyle = dark(skinC, 0.15); poly(ctx, [[headR * 0.38, faceY - headR * 0.08], [headR * 0.7, faceY + headR * 0.12], [headR * 0.42, faceY + headR * 0.14]]); ctx.fill();
      ctx.fillStyle = 'rgba(216,86,74,0.28)'; ctx.beginPath(); ctx.arc(headR * 0.1, faceY + headR * 0.32, headR * 0.17, 0, TAU); ctx.fill();
      ctx.fillStyle = '#8a2e26'; const mo = 0.04 + Math.abs(talk) * 0.14;
      ctx.beginPath(); ctx.ellipse(headR * 0.4, faceY + headR * 0.52, headR * 0.2, headR * mo, 0, 0, TAU); ctx.fill();
      if (c.beard) { ctx.fillStyle = c.beardColor ?? '#d8d2c4'; ctx.beginPath(); ctx.moveTo(-headR * 0.75, faceY + headR * 0.2); ctx.quadraticCurveTo(0, faceY + headR * 2.1, headR * 0.8, faceY + headR * 0.25); ctx.quadraticCurveTo(headR * 0.2, faceY + headR * 0.55, -headR * 0.75, faceY + headR * 0.2); ctx.fill(); outline(); }
      if (kind === 'clown') { ctx.fillStyle = '#d6452d'; ctx.beginPath(); ctx.arc(headR * 0.7, faceY + headR * 0.05, headR * 0.26, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(headR * 0.64, faceY - headR * 0.02, headR * 0.08, 0, TAU); ctx.fill(); }
    } else {
      eye(headR * 0.45, faceY - headR * 0.12, headR * 0.12);
      if (c.beard) { ctx.fillStyle = body; poly(ctx, [[-headR * 0.4, faceY + headR * 0.3], [headR * 0.9, faceY + headR * 0.4], [headR * 0.2, faceY + headR * 2.0]]); ctx.fill(); }
    }
    drawHat(ctx, c.hat, 0, faceY - headR * 0.4, headR, shadow ? body : (c.hatColor ?? accC), acc);
    const h2 = hand(1, a2);
    if (c.prop && c.prop !== 'none') drawProp(ctx, c.prop, h2[0], h2[1], hs, shadow ? body : '#4a3420', shadow ? acc : accC, t);
    const cs = Math.cos(lean), sn = Math.sin(lean);
    const toLocal = ([px, py]) => [px * cs - py * sn, hipY + sway + px * sn + py * cs];
    hands.push(toLocal(h1), toLocal(h2));
    shoulders.push(toLocal([-wTop, ty]), toLocal([wTop, ty]));
    const hp = toLocal([0, hy2]);
    head.x = hp[0]; head.y = hp[1]; head.r = headR;
    ctx.restore();
  }

  // marionette: crossbar controller and strings with a soft sheen
  if (o.strings != null) {
    const topY = o.strings;
    const bw = s * 0.2;
    const tilt = Math.sin(t * 1.3 + phase) * s * 0.012 + (o.speaking ? talk * s * 0.01 : 0);
    const line = (ax, ay, bx, by) => {
      ctx.lineWidth = Math.max(1, s * 0.006);
      ctx.strokeStyle = 'rgba(244,236,214,0.6)'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ax + 1, ay); ctx.lineTo(bx + 1, by); ctx.stroke();
    };
    line(0, topY + s * 0.03, head.x, head.y - head.r * 1.15);
    if (shoulders[0]) { line(-bw, topY + tilt, shoulders[0][0], shoulders[0][1]); line(bw, topY - tilt, shoulders[1][0], shoulders[1][1]); }
    if (hands[0]) { line(-bw * 0.6, topY + s * 0.05 + tilt, hands[0][0], hands[0][1]); line(bw * 0.6, topY + s * 0.05 - tilt, hands[1][0], hands[1][1]); }
    if (knees[0]) { line(-bw * 0.3, topY + s * 0.07, knees[0][0], knees[0][1]); line(bw * 0.3, topY + s * 0.07, knees[1][0], knees[1][1]); }
    ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = Math.max(2, s * 0.015); ctx.beginPath(); ctx.moveTo(0, topY - s * 0.2); ctx.lineTo(0, topY + s * 0.02); ctx.stroke();
    ctx.save(); ctx.translate(0, topY + s * 0.02); ctx.rotate(tilt / bw);
    ctx.fillStyle = vgrad(ctx, -s * 0.02, s * 0.02, [[0, '#c79a5a'], [1, '#6b4a2a']]);
    rrPath(ctx, -bw * 1.1, -s * 0.014, bw * 2.2, s * 0.028, s * 0.012); ctx.fill();
    ctx.strokeStyle = 'rgba(42,24,8,0.6)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#e8c36a'; ctx.beginPath(); ctx.arc(-bw * 1.1, 0, s * 0.012, 0, TAU); ctx.arc(bw * 1.1, 0, s * 0.012, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#c79a5a'; for (const sp of shoulders.concat(knees)) { ctx.beginPath(); ctx.arc(sp[0], sp[1], s * 0.008, 0, TAU); ctx.fill(); }
  }
  // shadow puppets: rods from the hands and a body rod to the bottom of the screen
  if (o.rods != null) {
    ctx.strokeStyle = shadow ? 'rgba(26,14,6,0.85)' : '#6b4a2a'; ctx.lineWidth = Math.max(2, s * 0.016);
    for (const [px, py] of hands.slice(0, 2)) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px * 0.7 + (px > 0 ? s * 0.06 : -s * 0.06), o.rods); ctx.stroke(); }
    ctx.lineWidth = Math.max(2.5, s * 0.02);
    ctx.beginPath(); ctx.moveTo(0, -s * 0.3); ctx.lineTo(0, o.rods); ctx.stroke();
  }
  ctx.restore();
}

// ---- backdrops -------------------------------------------------------------------------------------------------
const ridge = (ctx, x0, W, floorY, baseY, amp, seed, fill, n = 28) => {
  ctx.beginPath(); ctx.moveTo(x0, floorY);
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const y = baseY - amp * (0.5 + 0.28 * Math.sin(f * 7.1 + seed) + 0.17 * Math.sin(f * 15.3 + seed * 2.3) + 0.08 * Math.sin(f * 31 + seed * 4));
    ctx.lineTo(x0 + W * f, y);
  }
  ctx.lineTo(x0 + W, floorY); ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
};
const SKY = {
  market: ['#f2c27a', '#f7e0b0'], palace: ['#e8a45a', '#f6d79a'], forest: ['#9fc79a', '#e5f0c4'], night: ['#0c1330', '#3a3f78'],
  desert: ['#f0a55a', '#f9e2a6'], oasis: ['#6db7c9', '#f6e8b0'], pass: ['#8aa4c8', '#e9e2cf'], street: ['#d89a62', '#f6d8a4'],
  river: ['#7fb6c6', '#eef0d6'], sea: ['#4f8fb8', '#d9ecf0'], village: ['#e9a869', '#f7e3b2'], camp: ['#14193a', '#5a3a58'], stage: ['#3a2a4a', '#6a4a62'],
};
export const skyOf = (kind) => SKY[kind] ?? SKY.stage;

// R = rect to paint inside; floorY absolute. colour set: { far, near, glow, sky: [top, bottom] | false }
export function drawBackdrop(ctx, kind, R, floorY, k, t) {
  const { far, near, glow } = k;
  const H = floorY - R.y, W = R.w, x0 = R.x;
  ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip();
  const X = (f) => x0 + W * f;
  const sk = k.sky === false ? null : (k.sky ?? skyOf(kind));
  if (sk) { ctx.fillStyle = vgrad(ctx, R.y, floorY, [[0, sk[0]], [1, sk[1]]]); ctx.fillRect(R.x, R.y, R.w, floorY - R.y); }
  const haze = sk ? sk[1] : far;
  switch (kind) {
    case 'market': {
      ridge(ctx, x0, W, floorY, floorY - H * 0.12, H * 0.3, 1, mix(far, haze, 0.55));
      for (const [f, w, up] of [[0.1, 0.17, 0], [0.9, 0.17, 0], [0.5, 0.15, 0.03]]) {
        const cx = X(f), top = floorY - H * (0.5 + up), ww = W * w;
        ctx.fillStyle = vgrad(ctx, top, top + H * 0.2, [[0, near], [1, dark(near, 0.3)]]);
        poly(ctx, [[cx - ww, top + H * 0.16], [cx + ww, top + H * 0.16], [cx + ww * 0.82, top], [cx - ww * 0.82, top]]); ctx.fill();
        for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? light(near, 0.4) : dark(near, 0.2); ctx.fillRect(cx - ww + i * ww / 3, top + H * 0.02, ww / 3, H * 0.14); }
        ctx.fillStyle = dark(far, 0.15); ctx.fillRect(cx - ww * 0.9, top + H * 0.18, ww * 0.06, floorY - top - H * 0.18); ctx.fillRect(cx + ww * 0.84, top + H * 0.18, ww * 0.06, floorY - top - H * 0.18);
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(cx - ww * 0.84, top + H * 0.2, ww * 1.68, H * 0.03);
        for (let i = 0; i < 5; i++) { ctx.fillStyle = ['#c8452d', '#e0a526', '#6a8a3a', '#d9743a'][i % 4]; ctx.beginPath(); ctx.arc(cx - ww * 0.6 + i * ww * 0.3, floorY - H * 0.1, H * 0.025, 0, TAU); ctx.fill(); }
      }
      for (let i = 0; i < 5; i++) {
        const cx = X(0.12 + i * 0.19), sw = Math.sin(t * 1.4 + i) * 3;
        ctx.strokeStyle = 'rgba(42,24,8,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - W * 0.1, R.y + H * 0.07); ctx.quadraticCurveTo(cx, R.y + H * 0.14, cx + W * 0.1, R.y + H * 0.07); ctx.stroke();
        const lg = ctx.createRadialGradient(cx + sw, R.y + H * 0.15, 1, cx + sw, R.y + H * 0.15, H * 0.1); lg.addColorStop(0, alpha(glow, 0.85)); lg.addColorStop(1, alpha(glow, 0)); ctx.fillStyle = lg; ctx.fillRect(cx - H * 0.1, R.y + H * 0.05, H * 0.2, H * 0.2);
        ctx.fillStyle = '#e8453a'; ctx.beginPath(); ctx.ellipse(cx + sw, R.y + H * 0.15, H * 0.02, H * 0.028, 0, 0, TAU); ctx.fill();
      }
      break;
    }
    case 'palace': {
      const cx = X(0.5);
      ridge(ctx, x0, W, floorY, floorY - H * 0.1, H * 0.2, 2, mix(far, haze, 0.6));
      ctx.fillStyle = vgrad(ctx, floorY - H * 0.5, floorY, [[0, light(far, 0.25)], [1, far]]);
      ctx.fillRect(cx - W * 0.21, floorY - H * 0.44, W * 0.42, H * 0.44);
      for (let i = 0; i < 3; i++) { const w = W * (0.31 - i * 0.075), y = floorY - H * (0.44 + i * 0.11); ctx.fillStyle = vgrad(ctx, y - H * 0.11, y, [[0, light(near, 0.3)], [1, dark(near, 0.2)]]); poly(ctx, [[cx - w, y], [cx + w, y], [cx + w * 0.72, y - H * 0.105], [cx - w * 0.72, y - H * 0.105]]); ctx.fill(); ctx.fillStyle = alpha(glow, 0.9); ctx.fillRect(cx - w, y - 2, w * 2, 3); }
      ctx.fillStyle = glow; ctx.beginPath(); ctx.moveTo(cx - W * 0.055, floorY); ctx.lineTo(cx - W * 0.055, floorY - H * 0.22); ctx.arc(cx, floorY - H * 0.22, W * 0.055, Math.PI, 0); ctx.lineTo(cx + W * 0.055, floorY); ctx.fill();
      for (const f of [0.1, 0.9]) { const px = X(f); ctx.fillStyle = hgrad(ctx, px - W * 0.025, px + W * 0.025, [[0, light(far, 0.3)], [1, dark(far, 0.3)]]); ctx.fillRect(px - W * 0.025, R.y, W * 0.05, floorY - R.y); }
      for (const f of [0.28, 0.72]) { ctx.fillStyle = alpha(glow, 0.65); ctx.fillRect(X(f) - W * 0.025, floorY - H * 0.32, W * 0.05, H * 0.14); }
      break;
    }
    case 'forest': {
      ridge(ctx, x0, W, floorY, floorY - H * 0.2, H * 0.45, 3, mix(far, haze, 0.5));
      for (const [f, s, layer] of [[0.05, 1, 1], [0.22, 0.7, 0], [0.4, 0.5, 0], [0.55, 0.62, 0], [0.7, 0.72, 0], [0.88, 0.95, 1], [0.98, 0.8, 1]]) {
        const cx = X(f), h = H * 0.95 * s;
        ctx.fillStyle = layer ? dark(far, 0.1) : mix(far, haze, 0.35); ctx.fillRect(cx - W * 0.014, floorY - h * 0.6, W * 0.028, h * 0.6);
        const leaf = layer ? mix(near, '#000000', 0.2) : mix(near, haze, 0.35);
        const lg = ctx.createRadialGradient(cx - h * 0.08, floorY - h * 0.75, h * 0.03, cx, floorY - h * 0.65, h * 0.34);
        lg.addColorStop(0, light(leaf, 0.2)); lg.addColorStop(1, leaf);
        ctx.fillStyle = lg;
        ctx.beginPath(); ctx.arc(cx, floorY - h * 0.68, h * 0.26, 0, TAU); ctx.arc(cx - h * 0.18, floorY - h * 0.53, h * 0.19, 0, TAU); ctx.arc(cx + h * 0.19, floorY - h * 0.52, h * 0.19, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,246,192,0.1)';
      for (const f of [0.3, 0.52, 0.66]) { poly(ctx, [[X(f), R.y], [X(f + 0.06), R.y], [X(f + 0.2), floorY], [X(f + 0.06), floorY]]); ctx.fill(); }
      break;
    }
    case 'night': {
      const mx = X(0.78), my = R.y + H * 0.22;
      const mg = ctx.createRadialGradient(mx, my, H * 0.04, mx, my, H * 0.38); mg.addColorStop(0, alpha(glow, 0.5)); mg.addColorStop(1, alpha(glow, 0)); ctx.fillStyle = mg; ctx.fillRect(R.x, R.y, R.w, H);
      ctx.fillStyle = light(glow, 0.5); ctx.beginPath(); ctx.arc(mx, my, H * 0.085, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(42,58,106,0.35)'; ctx.beginPath(); ctx.arc(mx + H * 0.03, my - H * 0.02, H * 0.085, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 16; i++) { const tw = 0.5 + 0.5 * Math.sin(t * 2 + i * 1.7); ctx.globalAlpha = 0.3 + 0.6 * tw; const sz = 1 + (i % 3) * 0.6; ctx.fillRect(X(0.03 + ((i * 0.37) % 0.94)), R.y + H * (0.05 + ((i * 29) % 45) / 100), sz, sz); }
      ctx.globalAlpha = 1;
      ridge(ctx, x0, W, floorY, floorY - H * 0.12, H * 0.34, 4, mix(far, '#000000', 0.2));
      break;
    }
    case 'desert': {
      const sx = X(0.78), sy = R.y + H * 0.28;
      const sg = ctx.createRadialGradient(sx, sy, H * 0.03, sx, sy, H * 0.5); sg.addColorStop(0, 'rgba(255,244,192,0.9)'); sg.addColorStop(1, 'rgba(255,244,192,0)'); ctx.fillStyle = sg; ctx.fillRect(R.x, R.y, R.w, H);
      ctx.fillStyle = '#fff7d6'; ctx.beginPath(); ctx.arc(sx, sy, H * 0.075, 0, TAU); ctx.fill();
      ridge(ctx, x0, W, floorY, floorY - H * 0.16, H * 0.3, 5, mix(far, haze, 0.35));
      ridge(ctx, x0, W, floorY, floorY - H * 0.06, H * 0.2, 7, far);
      ridge(ctx, x0, W, floorY, floorY, H * 0.13, 9, near);
      break;
    }
    case 'oasis': {
      ridge(ctx, x0, W, floorY, floorY - H * 0.1, H * 0.2, 6, mix('#c9954c', haze, 0.4));
      ctx.fillStyle = vgrad(ctx, floorY - H * 0.14, floorY, [[0, '#8fd3d6'], [1, '#3a8f9a']]);
      ctx.beginPath(); ctx.ellipse(X(0.5), floorY - H * 0.045, W * 0.32, H * 0.07, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(X(0.5), floorY - H * 0.045, W * (0.1 + i * 0.09 + (Math.sin(t + i) * 0.01)), H * 0.02 + i * H * 0.01, 0, 0, TAU); ctx.stroke(); }
      for (const [f, s] of [[0.13, 1], [0.87, 0.85], [0.3, 0.6]]) {
        const cx = X(f), h = H * 0.72 * s; ctx.strokeStyle = dark('#6a4a28', 0.2); ctx.lineWidth = W * 0.016; ctx.beginPath(); ctx.moveTo(cx, floorY); ctx.quadraticCurveTo(cx + W * 0.025, floorY - h * 0.5, cx, floorY - h); ctx.stroke();
        ctx.strokeStyle = '#2f7a3a'; ctx.lineWidth = W * 0.01;
        for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.55 + Math.sin(t * 1.3 + i + f * 9) * 0.04; ctx.beginPath(); ctx.moveTo(cx, floorY - h); ctx.quadraticCurveTo(cx + Math.cos(a) * h * 0.3, floorY - h + Math.sin(a) * h * 0.2 - h * 0.12, cx + Math.cos(a) * h * 0.5, floorY - h + Math.sin(a) * h * 0.1 + h * 0.2); ctx.stroke(); }
      }
      break;
    }
    case 'pass': {
      ctx.fillStyle = mix(far, haze, 0.5); poly(ctx, [[x0, floorY], [X(0.1), floorY - H * 0.45], [X(0.24), floorY - H * 0.62], [X(0.36), floorY - H * 0.3], [X(0.5), floorY - H * 0.85], [X(0.66), floorY - H * 0.35], [X(0.8), floorY - H * 0.65], [X(0.92), floorY - H * 0.4], [x0 + W, floorY]]); ctx.fill();
      ctx.fillStyle = vgrad(ctx, floorY - H * 0.6, floorY, [[0, mix(far, '#ffffff', 0.45)], [1, far]]); poly(ctx, [[x0, floorY], [X(0.2), floorY - H * 0.4], [X(0.4), floorY - H * 0.2], [X(0.55), floorY - H * 0.55], [X(0.75), floorY - H * 0.25], [x0 + W, floorY]]); ctx.fill();
      ctx.fillStyle = '#fff'; poly(ctx, [[X(0.5), floorY - H * 0.85], [X(0.44), floorY - H * 0.66], [X(0.5), floorY - H * 0.7], [X(0.56), floorY - H * 0.64]]); ctx.fill();
      poly(ctx, [[X(0.24), floorY - H * 0.62], [X(0.19), floorY - H * 0.5], [X(0.24), floorY - H * 0.53], [X(0.28), floorY - H * 0.49]]); ctx.fill();
      break;
    }
    case 'street': {
      ridge(ctx, x0, W, floorY, floorY - H * 0.15, H * 0.15, 8, mix(far, haze, 0.55));
      for (let i = 0; i < 5; i++) {
        const w = W * 0.2, cx = X(0.08 + i * 0.21), h = H * (0.5 + ((i * 7) % 3) * 0.1);
        const wall = i % 2 ? far : near;
        ctx.fillStyle = vgrad(ctx, floorY - h, floorY, [[0, light(wall, 0.12)], [1, dark(wall, 0.25)]]); ctx.fillRect(cx - w / 2, floorY - h, w, h);
        ctx.fillStyle = dark(wall, 0.4); poly(ctx, [[cx - w * 0.6, floorY - h], [cx + w * 0.6, floorY - h], [cx, floorY - h - H * 0.12]]); ctx.fill();
        for (let r = 0; r < 2; r++) for (const wx of [-0.22, 0.1]) {
          const lit = ((i + r) % 2) === 0;
          ctx.fillStyle = lit ? glow : dark(wall, 0.55); ctx.fillRect(cx + wx * w, floorY - h * (0.8 - r * 0.32), w * 0.16, h * 0.18);
          if (lit) { ctx.fillStyle = alpha(glow, 0.2); ctx.fillRect(cx + wx * w - 3, floorY - h * (0.8 - r * 0.32) - 3, w * 0.16 + 6, h * 0.18 + 6); }
        }
      }
      break;
    }
    case 'river': case 'sea': {
      ridge(ctx, x0, W, floorY - H * 0.2, floorY - H * 0.28, H * 0.22, 10, mix(far, haze, 0.5));
      ctx.fillStyle = vgrad(ctx, floorY - H * 0.3, floorY, [[0, mix(sk ? sk[1] : '#99aacc', '#2a6f86', 0.3)], [1, mix('#2a6f86', '#000000', 0.15)]]);
      ctx.fillRect(R.x, floorY - H * 0.28, R.w, H * 0.28);
      ctx.strokeStyle = alpha(glow, 0.6); ctx.lineWidth = 1.5;
      for (let r = 0; r < 4; r++) { ctx.beginPath(); for (let i = 0; i <= 28; i++) { const px = x0 + (W * i) / 28, py = floorY - H * (0.04 + r * 0.065) + Math.sin(i * 0.9 + t * 1.5 + r) * 2.5; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); }
      const bx = X(0.78) + Math.sin(t * 0.7) * 4, by = floorY - H * 0.15 + Math.sin(t * 1.4) * 1.5;
      ctx.fillStyle = dark(far, 0.1); poly(ctx, [[bx - W * 0.06, by], [bx + W * 0.06, by], [bx + W * 0.04, by + H * 0.06], [bx - W * 0.04, by + H * 0.06]]); ctx.fill();
      ctx.fillRect(bx - 1, by - H * 0.26, 2.5, H * 0.26);
      ctx.fillStyle = '#f4ead0'; poly(ctx, [[bx + 3, by - H * 0.25], [bx + W * 0.05, by - H * 0.04], [bx + 3, by - H * 0.04]]); ctx.fill();
      break;
    }
    case 'village': {
      ridge(ctx, x0, W, floorY, floorY - H * 0.12, H * 0.35, 11, mix(far, haze, 0.5));
      ridge(ctx, x0, W, floorY, floorY - H * 0.02, H * 0.14, 12, mix(near, haze, 0.2));
      for (const [f, s] of [[0.16, 1], [0.5, 0.8], [0.84, 1]]) {
        const cx = X(f), w = W * 0.13 * s, h = H * 0.21 * s;
        ctx.fillStyle = vgrad(ctx, floorY - h, floorY, [[0, light(near, 0.2)], [1, dark(near, 0.2)]]); ctx.fillRect(cx - w, floorY - h, w * 2, h);
        ctx.fillStyle = vgrad(ctx, floorY - h * 2.1, floorY - h, [[0, light(far, 0.1)], [1, dark(far, 0.35)]]); poly(ctx, [[cx - w * 1.35, floorY - h], [cx + w * 1.35, floorY - h], [cx, floorY - h * 2.1]]); ctx.fill();
        ctx.fillStyle = glow; ctx.fillRect(cx - w * 0.22, floorY - h * 0.7, w * 0.44, h * 0.7);
      }
      break;
    }
    case 'camp': {
      const cx = X(0.5), fl = 0.75 + 0.25 * Math.sin(t * 8) * Math.sin(t * 3.1);
      ridge(ctx, x0, W, floorY, floorY - H * 0.05, H * 0.3, 13, dark(far, 0.1));
      ctx.fillStyle = vgrad(ctx, floorY - H * 0.5, floorY, [[0, light(near, 0.1)], [1, dark(near, 0.4)]]);
      poly(ctx, [[X(0.1), floorY], [X(0.27), floorY - H * 0.5], [X(0.44), floorY]]); ctx.fill();
      poly(ctx, [[X(0.6), floorY], [X(0.76), floorY - H * 0.42], [X(0.93), floorY]]); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; poly(ctx, [[X(0.27), floorY - H * 0.5], [X(0.27), floorY], [X(0.44), floorY]]); ctx.fill();
      const fg = ctx.createRadialGradient(cx, floorY - H * 0.07, 2, cx, floorY - H * 0.07, H * 0.35 * fl); fg.addColorStop(0, 'rgba(255,176,64,0.7)'); fg.addColorStop(1, 'rgba(255,176,64,0)'); ctx.fillStyle = fg; ctx.fillRect(R.x, floorY - H * 0.45, R.w, H * 0.5);
      ctx.fillStyle = '#ffd36a'; poly(ctx, [[cx - H * 0.045, floorY], [cx, floorY - H * (0.13 + 0.04 * fl)], [cx + H * 0.045, floorY]]); ctx.fill();
      ctx.fillStyle = '#e8601a'; poly(ctx, [[cx - H * 0.03, floorY], [cx + H * 0.005, floorY - H * (0.08 + 0.03 * fl)], [cx + H * 0.03, floorY]]); ctx.fill();
      break;
    }
    case 'stage': default: {
      ctx.fillStyle = alpha(far, 0.55);
      for (let i = 0; i < 3; i++) { const ax = X(0.2 + i * 0.3), aw = W * 0.12; ctx.beginPath(); ctx.moveTo(ax - aw, floorY); ctx.lineTo(ax - aw, R.y + H * 0.35); ctx.arc(ax, R.y + H * 0.35, aw, Math.PI, 0); ctx.lineTo(ax + aw, floorY); ctx.fill(); }
      const lg = ctx.createRadialGradient(X(0.5), R.y + H * 0.2, 2, X(0.5), R.y + H * 0.2, H * 0.3); lg.addColorStop(0, alpha(glow, 0.6)); lg.addColorStop(1, alpha(glow, 0)); ctx.fillStyle = lg; ctx.fillRect(R.x, R.y, R.w, H * 0.6);
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(X(0.5), R.y + H * 0.2, H * 0.05, 0, TAU); ctx.fill();
      break;
    }
  }
  ctx.restore();
}

// ---- curtains --------------------------------------------------------------------------------------------------
// Side curtains with deep folds, a gathered tie-back with a tassel and a scalloped valance with gold fringe.
export function drawCurtains(ctx, R, col, t, opt = {}) {
  const w = R.w * (opt.width ?? 0.15);
  const gold = opt.gold ?? '#e6b84a';
  const sway = Math.sin((t ?? 0) * 0.8) * 1.2;
  const n = 6;
  const side = (x0, dir) => {
    const x1 = x0 + dir * w;
    ctx.beginPath(); ctx.moveTo(x0, R.y); ctx.lineTo(x1, R.y);
    ctx.bezierCurveTo(x1, R.y + R.h * 0.4, x0 + dir * w * 0.55 + sway * dir, R.y + R.h * 0.55, x0 + dir * w * 0.5, R.y + R.h * 0.62);
    ctx.bezierCurveTo(x0 + dir * w * 0.9, R.y + R.h * 0.75, x1, R.y + R.h * 0.9, x1, R.y + R.h);
    ctx.lineTo(x0, R.y + R.h); ctx.closePath();
    const g = ctx.createLinearGradient(Math.min(x0, x1), 0, Math.max(x0, x1), 0);
    for (let i = 0; i <= n; i++) g.addColorStop(i / n, i % 2 ? light(col, 0.18) : dark(col, 0.32));
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = vgrad(ctx, R.y, R.y + R.h, [[0, 'rgba(0,0,0,0.25)'], [0.35, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.35)']]); ctx.fillRect(Math.min(x0, x1), R.y, w, R.h);
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.5;
    for (let i = 1; i < n; i += 2) { ctx.beginPath(); ctx.moveTo(x0 + dir * w * (i / n), R.y); ctx.bezierCurveTo(x0 + dir * w * (i / n), R.y + R.h * 0.45, x0 + dir * w * (i / n) * 0.7, R.y + R.h * 0.6, x0 + dir * w * (i / n) * 0.95, R.y + R.h); ctx.stroke(); }
    const ty = R.y + R.h * 0.6;
    ctx.strokeStyle = gold; ctx.lineWidth = Math.max(2, R.h * 0.012);
    ctx.beginPath(); ctx.moveTo(x0, ty - R.h * 0.02); ctx.quadraticCurveTo(x0 + dir * w * 0.3, ty + R.h * 0.03, x0 + dir * w * 0.62, ty); ctx.stroke();
    ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(x0 + dir * w * 0.62, ty, R.h * 0.014, 0, TAU); ctx.fill();
    poly(ctx, [[x0 + dir * w * 0.62 - 3, ty + 2], [x0 + dir * w * 0.62 + 3, ty + 2], [x0 + dir * w * 0.62 + 4, ty + R.h * 0.06], [x0 + dir * w * 0.62 - 4, ty + R.h * 0.06]]); ctx.fill();
  };
  side(R.x, 1); side(R.x + R.w, -1);
  const vh = R.h * (opt.valance ?? 0.1);
  ctx.fillStyle = hgrad(ctx, R.x, R.x + R.w, [[0, dark(col, 0.25)], [0.5, light(col, 0.12)], [1, dark(col, 0.25)]]);
  ctx.fillRect(R.x, R.y, R.w, vh);
  const m = Math.max(6, Math.round(R.w / 46));
  for (let i = 0; i < m; i++) {
    const cx = R.x + R.w * (i + 0.5) / m, rw = R.w / m / 2;
    ctx.fillStyle = hgrad(ctx, cx - rw, cx + rw, [[0, dark(col, 0.2)], [0.5, light(col, 0.1)], [1, dark(col, 0.3)]]);
    ctx.beginPath(); ctx.moveTo(cx - rw, R.y + vh * 0.9); ctx.quadraticCurveTo(cx, R.y + vh * 1.65, cx + rw, R.y + vh * 0.9); ctx.fill();
    ctx.strokeStyle = gold; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx - rw, R.y + vh * 0.9); ctx.quadraticCurveTo(cx, R.y + vh * 1.65, cx + rw, R.y + vh * 0.9); ctx.stroke();
    ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(cx, R.y + vh * 1.5, 2, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = gold; ctx.fillRect(R.x, R.y + vh * 0.82, R.w, Math.max(2, vh * 0.1));
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(R.x, R.y + vh * 0.92, R.w, 3);
}

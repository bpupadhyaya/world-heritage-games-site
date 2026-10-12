// Procedural puppets, backdrops and stage frames for the story engine. Pure canvas primitives, no assets.
// Figures are drawn in local coordinates: origin = feet on the floor, y negative = up, facing right.

const TAU = Math.PI * 2;
const lighten = (hex, k) => {
  const n = parseInt(String(hex).slice(1), 16);
  const f = (v) => Math.round(v + (255 - v) * k);
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
};
const poly = (ctx, pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };

// ---- accessories -----------------------------------------------------------------------------------------------
function drawHat(ctx, kind, hx, hy, r, col, acc) {
  ctx.fillStyle = col;
  switch (kind) {
    case 'crown': { const w = r * 1.5; poly(ctx, [[hx - w, hy - r * 0.6], [hx - w, hy - r * 1.9], [hx - w / 2, hy - r * 1.3], [hx, hy - r * 2.1], [hx + w / 2, hy - r * 1.3], [hx + w, hy - r * 1.9], [hx + w, hy - r * 0.6]]); ctx.fill(); break; }
    case 'turban': ctx.beginPath(); ctx.ellipse(hx, hy - r * 0.7, r * 1.35, r * 1.0, 0, 0, TAU); ctx.fill(); ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(hx, hy - r * 1.2, r * 0.22, 0, TAU); ctx.fill(); break;
    case 'cap': ctx.beginPath(); ctx.ellipse(hx, hy - r * 0.55, r * 1.15, r * 0.7, 0, Math.PI, TAU); ctx.fill(); ctx.fillRect(hx - r * 1.3, hy - r * 0.6, r * 2.6, r * 0.2); break;
    case 'pointed': poly(ctx, [[hx - r * 1.1, hy - r * 0.5], [hx + r * 1.1, hy - r * 0.5], [hx + r * 0.2, hy - r * 2.7]]); ctx.fill(); break;
    case 'kalpak': ctx.fillRect(hx - r * 0.95, hy - r * 2.0, r * 1.9, r * 1.5); ctx.fillStyle = acc; ctx.fillRect(hx - r * 0.95, hy - r * 0.8, r * 1.9, r * 0.25); break;
    case 'straw': poly(ctx, [[hx - r * 1.9, hy - r * 0.45], [hx + r * 1.9, hy - r * 0.45], [hx, hy - r * 1.9]]); ctx.fill(); break;
    case 'hood': ctx.beginPath(); ctx.arc(hx, hy - r * 0.1, r * 1.25, Math.PI * 0.95, Math.PI * 2.05); ctx.fill(); break;
    case 'plume': ctx.beginPath(); ctx.ellipse(hx, hy - r * 0.7, r * 1.3, r * 0.55, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = acc; ctx.lineWidth = r * 0.3; ctx.beginPath(); ctx.moveTo(hx + r * 0.6, hy - r * 1.0); ctx.quadraticCurveTo(hx + r * 1.9, hy - r * 2.4, hx + r * 2.3, hy - r * 1.2); ctx.stroke(); break;
    case 'topknot': ctx.beginPath(); ctx.arc(hx, hy - r * 1.35, r * 0.5, 0, TAU); ctx.fill(); break;
    default: break;
  }
}

function drawProp(ctx, kind, x, y, s, col, acc) {
  ctx.strokeStyle = col; ctx.fillStyle = acc; ctx.lineWidth = Math.max(2, s * 0.025);
  switch (kind) {
    case 'staff': ctx.beginPath(); ctx.moveTo(x, y + s * 0.3); ctx.lineTo(x, y - s * 0.55); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y - s * 0.57, s * 0.04, 0, TAU); ctx.fill(); break;
    case 'fan': ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, s * 0.17, -Math.PI * 0.9, -Math.PI * 0.1); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
    case 'drum': ctx.beginPath(); ctx.ellipse(x, y, s * 0.1, s * 0.07, 0, 0, TAU); ctx.fill(); ctx.stroke(); break;
    case 'bag': ctx.beginPath(); ctx.ellipse(x, y + s * 0.08, s * 0.1, s * 0.12, 0, 0, TAU); ctx.fill(); ctx.stroke(); break;
    case 'lute': ctx.beginPath(); ctx.ellipse(x + s * 0.05, y, s * 0.1, s * 0.075, -0.5, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + s * 0.1, y - s * 0.05); ctx.lineTo(x + s * 0.28, y - s * 0.2); ctx.stroke(); break;
    case 'lantern': ctx.beginPath(); ctx.moveTo(x, y - s * 0.1); ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, y + s * 0.07, s * 0.06, s * 0.08, 0, 0, TAU); ctx.fill(); ctx.stroke(); break;
    case 'scroll': ctx.fillRect(x - s * 0.05, y - s * 0.1, s * 0.1, s * 0.2); ctx.strokeRect(x - s * 0.05, y - s * 0.1, s * 0.1, s * 0.2); break;
    case 'cup': poly(ctx, [[x - s * 0.06, y - s * 0.05], [x + s * 0.06, y - s * 0.05], [x + s * 0.04, y + s * 0.07], [x - s * 0.04, y + s * 0.07]]); ctx.fill(); break;
    case 'sword': ctx.beginPath(); ctx.moveTo(x, y + s * 0.05); ctx.lineTo(x + s * 0.2, y - s * 0.28); ctx.stroke(); break;
    case 'stick': ctx.beginPath(); ctx.moveTo(x - s * 0.1, y + s * 0.1); ctx.lineTo(x + s * 0.15, y - s * 0.15); ctx.stroke(); break;
    default: break;
  }
}

// ---- one figure ------------------------------------------------------------------------------------------------
// c: cast recipe { kind, color, accent, skin, hat, prop, mask, stripes, scale, build }
// o: { style: 'shadow'|'color', cut: colour of lit holes, t, pose, speaking, flip, strings: topY(local)|null, rods: bottomY(local)|null, alpha, sink }
export function drawFigure(ctx, c, x, base, H, o) {
  const shadow = o.style === 'shadow';
  const body = shadow ? '#1b0f07' : (c.color ?? '#9a5b3a');
  const acc = shadow ? '#1b0f07' : (c.accent ?? '#e6b84a');
  const skin = shadow ? '#1b0f07' : (c.skin ?? '#e7c29b');
  const cut = o.cut ?? '#f6dfa3';
  const s = H * (c.scale ?? 1);
  const t = o.t ?? 0;
  const phase = (c.phase ?? 0) + x * 0.013;
  const talk = o.speaking ? Math.sin(t * 9 + phase) : 0;
  const sway = Math.sin(t * 1.6 + phase) * s * 0.012 + (o.speaking ? Math.abs(talk) * s * 0.012 : 0);
  ctx.save();
  ctx.globalAlpha = (o.alpha ?? 1);
  ctx.translate(x, base);
  if (o.flip) ctx.scale(-1, 1);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const kind = c.kind ?? 'person';
  const hands = [];
  const head = { x: 0, y: 0, r: 0 };
  const eye = (ex, ey, r) => { ctx.fillStyle = shadow ? cut : '#241a14'; ctx.beginPath(); ctx.arc(ex, ey, r, 0, TAU); ctx.fill(); };

  if (kind === 'camel') {
    const bob = Math.sin(t * 2.4 + phase) * s * 0.012;
    ctx.fillStyle = body; ctx.strokeStyle = body; ctx.lineWidth = s * 0.05;
    const legSwing = Math.sin(t * 2.4 + phase) * s * 0.03;
    for (const [lx, d] of [[-0.2, 1], [-0.1, -1], [0.1, 1], [0.2, -1]]) { ctx.beginPath(); ctx.moveTo(lx * s, -0.36 * s); ctx.lineTo(lx * s + d * legSwing, 0); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(0, -0.42 * s + bob, 0.29 * s, 0.1 * s, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-0.06 * s, -0.55 * s + bob, 0.07 * s, 0.09 * s, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0.1 * s, -0.54 * s + bob, 0.06 * s, 0.08 * s, 0, 0, TAU); ctx.fill();
    ctx.lineWidth = s * 0.06; ctx.beginPath(); ctx.moveTo(0.24 * s, -0.46 * s + bob); ctx.quadraticCurveTo(0.34 * s, -0.62 * s, 0.34 * s, -0.8 * s + bob); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0.4 * s, -0.82 * s + bob, 0.075 * s, 0.045 * s, -0.2, 0, TAU); ctx.fill();
    ctx.fillStyle = acc; ctx.fillRect(-0.17 * s, -0.5 * s + bob, 0.34 * s, 0.05 * s);
    ctx.fillStyle = c.pack ? acc : body;
    if (c.pack) { ctx.beginPath(); ctx.ellipse(0.0, -0.62 * s + bob, 0.12 * s, 0.07 * s, 0, 0, TAU); ctx.fill(); }
    eye(0.42 * s, -0.84 * s + bob, s * 0.011);
    head.x = 0.4 * s; head.y = -0.85 * s; head.r = s * 0.06;
  } else if (kind === 'croc') {
    const snap = (Math.sin(t * 2.2 + phase) + 1) * 0.5 * s * 0.035;
    ctx.fillStyle = body; ctx.strokeStyle = body;
    ctx.lineWidth = s * 0.05;
    for (const lx of [-0.18, 0.12]) { ctx.beginPath(); ctx.moveTo(lx * s, -0.12 * s); ctx.lineTo(lx * s - 0.03 * s, 0); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(0, -0.17 * s, 0.3 * s, 0.085 * s, 0, 0, TAU); ctx.fill();
    poly(ctx, [[-0.28 * s, -0.2 * s], [-0.62 * s, -0.04 * s + Math.sin(t * 2 + phase) * s * 0.02], [-0.28 * s, -0.13 * s]]); ctx.fill();
    poly(ctx, [[0.22 * s, -0.22 * s], [0.62 * s, -0.19 * s - snap], [0.62 * s, -0.17 * s - snap], [0.22 * s, -0.14 * s]]); ctx.fill();
    poly(ctx, [[0.22 * s, -0.15 * s], [0.6 * s, -0.14 * s + snap], [0.6 * s, -0.12 * s + snap], [0.22 * s, -0.1 * s]]); ctx.fill();
    ctx.fillStyle = shadow ? cut : '#f4f0e0'; for (let i = 0; i < 4; i++) { const tx = (0.3 + i * 0.08) * s; poly(ctx, [[tx, -0.17 * s - snap * 0.6], [tx + 0.02 * s, -0.17 * s - snap * 0.6], [tx + 0.01 * s, -0.14 * s - snap * 0.3]]); ctx.fill(); }
    ctx.fillStyle = body; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc((-0.2 + i * 0.1) * s, -0.255 * s, s * 0.018, 0, TAU); ctx.fill(); }
    eye(0.2 * s, -0.235 * s, s * 0.012);
    head.x = 0.35 * s; head.y = -0.22 * s; head.r = s * 0.05;
  } else if (kind === 'beast' || kind === 'duck') {
    const small = kind === 'duck';
    const bob = Math.sin(t * (small ? 3 : 2) + phase) * s * 0.012;
    ctx.fillStyle = body; ctx.strokeStyle = body;
    if (small) {
      const w = Math.sin(t * 2.5 + phase) * s * 0.02;
      ctx.beginPath(); ctx.ellipse(0, -0.13 * s + bob, 0.17 * s, 0.1 * s, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(0.15 * s, -0.28 * s + bob, 0.075 * s, 0, TAU); ctx.fill();
      ctx.fillStyle = acc; poly(ctx, [[0.21 * s, -0.29 * s + bob], [0.31 * s + w, -0.27 * s + bob], [0.21 * s, -0.25 * s + bob]]); ctx.fill();
      eye(0.17 * s, -0.3 * s + bob, s * 0.012);
      head.x = 0.15 * s; head.y = -0.3 * s; head.r = s * 0.07;
    } else {
      ctx.lineWidth = s * 0.045;
      const gallop = Math.sin(t * 3 + phase) * s * 0.025;
      for (const [lx, d] of [[-0.2, 1], [-0.12, -1], [0.1, -1], [0.18, 1]]) { ctx.beginPath(); ctx.moveTo(lx * s, -0.3 * s); ctx.lineTo(lx * s + d * gallop, 0); ctx.stroke(); }
      ctx.beginPath(); ctx.ellipse(0, -0.34 * s + bob, 0.27 * s, 0.1 * s, 0, 0, TAU); ctx.fill();
      ctx.lineWidth = s * 0.07; ctx.beginPath(); ctx.moveTo(0.2 * s, -0.4 * s + bob); ctx.lineTo(0.3 * s, -0.56 * s + bob); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0.35 * s, -0.6 * s + bob, 0.075 * s, 0.05 * s, -0.3, 0, TAU); ctx.fill();
      ctx.lineWidth = s * 0.025; ctx.beginPath(); ctx.moveTo(0.3 * s, -0.64 * s + bob); ctx.lineTo(0.27 * s, -0.78 * s + bob); ctx.moveTo(0.33 * s, -0.64 * s + bob); ctx.lineTo(0.34 * s, -0.8 * s + bob); ctx.stroke();
      if (c.stripes) { ctx.strokeStyle = shadow ? cut : acc; ctx.lineWidth = s * 0.02; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 0.09 * s, -0.43 * s + bob); ctx.lineTo(i * 0.09 * s + 0.02 * s, -0.27 * s + bob); ctx.stroke(); } }
      ctx.lineWidth = s * 0.03; ctx.strokeStyle = body; ctx.beginPath(); ctx.moveTo(-0.26 * s, -0.36 * s + bob); ctx.quadraticCurveTo(-0.38 * s, -0.4 * s, -0.36 * s, -0.5 * s + bob); ctx.stroke();
      eye(0.37 * s, -0.62 * s + bob, s * 0.011);
      head.x = 0.35 * s; head.y = -0.62 * s; head.r = s * 0.06;
    }
  } else {
    // humanoid: person | ruler | clown | trader | child
    const robe = kind === 'ruler' || c.robe;
    if (kind === 'monkey') { ctx.strokeStyle = body; ctx.lineWidth = s * 0.035; ctx.beginPath(); ctx.moveTo(-s * 0.05, -s * 0.3); ctx.bezierCurveTo(-s * 0.4, -s * 0.28, -s * 0.35, -s * 0.8, -s * 0.15, -s * 0.7 + Math.sin(t * 3 + phase) * s * 0.05); ctx.stroke(); }
    const fat = kind === 'clown' ? 1.3 : (c.build ?? 1);
    const tall = kind === 'child' ? 0.78 : 1;
    const hs = s * tall;
    const headR = hs * (kind === 'clown' ? 0.1 : kind === 'monkey' ? 0.11 : 0.085);
    const hipY = -hs * 0.36, shY = -hs * 0.68, headY = -hs * 0.8 - (kind === 'clown' ? hs * 0.015 : 0);
    const lean = o.pose === 'bow' ? 0.32 : o.pose === 'slump' ? 0.2 : 0;
    const wTop = hs * 0.14 * fat, wBot = hs * (robe ? 0.2 : 0.11) * fat;
    // legs / robe
    ctx.fillStyle = body; ctx.strokeStyle = body;
    const step = Math.sin(t * 2 + phase) * hs * 0.01;
    if (robe) { poly(ctx, [[-wBot, 0], [wBot, 0], [wTop * 0.8, hipY], [-wTop * 0.8, hipY]]); ctx.fill(); ctx.fillStyle = acc; ctx.fillRect(-wBot, -hs * 0.03, wBot * 2, hs * 0.03); }
    else {
      ctx.lineWidth = hs * 0.075; ctx.beginPath(); ctx.moveTo(-hs * 0.06 * fat, hipY); ctx.lineTo(-hs * 0.08 * fat + step, 0); ctx.moveTo(hs * 0.06 * fat, hipY); ctx.lineTo(hs * 0.08 * fat - step, 0); ctx.stroke();
      ctx.fillStyle = acc; ctx.fillRect(-hs * 0.12 * fat - 2, -hs * 0.015, hs * 0.1 * fat, hs * 0.03); ctx.fillRect(hs * 0.02 * fat, -hs * 0.015, hs * 0.1 * fat, hs * 0.03);
    }
    // upper body (rotates about the hips for bows)
    ctx.save();
    ctx.translate(0, hipY + sway); ctx.rotate(lean);
    const ty = shY - hipY, hy2 = headY - hipY;
    ctx.fillStyle = body; poly(ctx, [[-wTop, ty], [wTop, ty], [wBot * 0.85, 0], [-wBot * 0.85, 0]]); ctx.fill();
    ctx.fillStyle = acc; ctx.fillRect(-wBot * 0.85, -hs * 0.035, wBot * 1.7, hs * 0.035);
    if (kind === 'trader') { ctx.fillStyle = acc; ctx.beginPath(); ctx.ellipse(-wTop * 0.9, ty + hs * 0.18, hs * 0.1, hs * 0.13, 0.3, 0, TAU); ctx.fill(); }
    if (shadow) { ctx.fillStyle = cut; ctx.beginPath(); ctx.arc(0, ty * 0.5, hs * 0.018, 0, TAU); ctx.fill(); ctx.fillRect(-wBot * 0.5, -hs * 0.07, wBot, hs * 0.01); }
    // arms
    const armLen = hs * 0.25;
    const arm = (side, ang) => {
      const sx = side * wTop, sy = ty + hs * 0.02;
      const hx = sx + Math.cos(ang) * armLen * (ang < 0 ? 0.95 : 1) * side, hy = sy + Math.sin(ang) * armLen;
      ctx.strokeStyle = body; ctx.lineWidth = hs * 0.055; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(hx, hy, hs * 0.03, 0, TAU); ctx.fill();
      return [hx, hy];
    };
    const pose = o.pose ?? 'idle';
    const wave = Math.sin(t * 7 + phase);
    let a1 = 1.25 + Math.sin(t * 1.5 + phase) * 0.06, a2 = 1.25 - Math.sin(t * 1.5 + phase) * 0.06;
    if (pose === 'cheer') { a1 = -1.2 + wave * 0.15; a2 = -1.2 - wave * 0.15; }
    else if (pose === 'point') { a2 = -0.15; a1 = 1.1; }
    else if (pose === 'bow') { a1 = 1.0; a2 = 1.0; }
    else if (pose === 'slump') { a1 = 1.45; a2 = 1.45; }
    else if (o.speaking) { a2 = -0.7 + talk * 0.3; }
    else if (pose === 'hold') { a2 = 0.15; }
    const h1 = arm(-1, a1), h2 = arm(1, a2);
    // head
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(0, hy2, headR, 0, TAU); ctx.fill();
    ctx.fillRect(-hs * 0.02, hy2 + headR * 0.6, hs * 0.04, headR * 0.7);
    if (c.mask) {
      ctx.fillStyle = shadow ? body : (c.maskColor ?? '#1f1a17');
      ctx.beginPath(); ctx.arc(0, hy2, headR * 1.02, Math.PI, TAU); ctx.fill(); ctx.fillRect(-headR * 1.02, hy2 - 1, headR * 2.04, headR * 0.35);
      if (c.mask === 'long') { poly(ctx, [[headR * 0.2, hy2], [headR * 1.2, hy2 + headR * 0.55], [headR * 0.2, hy2 + headR * 0.4]]); ctx.fill(); }
      if (c.mask === 'beak') { poly(ctx, [[headR * 0.3, hy2 - headR * 0.1], [headR * 1.7, hy2 + headR * 0.5], [headR * 0.3, hy2 + headR * 0.45]]); ctx.fill(); }
      eye(-headR * 0.38, hy2 - headR * 0.2, headR * 0.17); eye(headR * 0.38, hy2 - headR * 0.2, headR * 0.17);
      if (!shadow) { ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(-headR * 0.38, hy2 - headR * 0.2, headR * 0.17, 0, TAU); ctx.arc(headR * 0.38, hy2 - headR * 0.2, headR * 0.17, 0, TAU); ctx.fill(); }
    } else {
      eye(headR * 0.4, hy2 - headR * 0.1, headR * 0.14);
      if (c.beard) { ctx.fillStyle = shadow ? body : (c.beardColor ?? '#d8d2c4'); poly(ctx, [[-headR * 0.7, hy2 + headR * 0.2], [headR * 0.7, hy2 + headR * 0.2], [0, hy2 + headR * 1.9]]); ctx.fill(); }
      if (kind === 'clown') { ctx.fillStyle = shadow ? cut : '#c8452d'; ctx.beginPath(); ctx.arc(headR * 0.75, hy2 + headR * 0.15, headR * 0.28, 0, TAU); ctx.fill(); }
    }
    drawHat(ctx, c.hat, 0, hy2 - headR * 0.35, headR, shadow ? body : (c.hatColor ?? acc), acc);
    if (c.prop) drawProp(ctx, c.prop, h2[0], h2[1], hs, shadow ? body : '#4a3420', acc);
    // record absolute-ish hand points in figure space for strings and rods
    const cs = Math.cos(lean), sn = Math.sin(lean);
    const toLocal = ([px, py]) => [px * cs - py * sn, hipY + sway + px * sn + py * cs];
    hands.push(toLocal(h1), toLocal(h2));
    const hp = toLocal([0, hy2]);
    head.x = hp[0]; head.y = hp[1]; head.r = headR;
    ctx.restore();
    hands.push([-hs * 0.07, -hs * 0.18], [hs * 0.07, -hs * 0.18]);
  }

  if (o.strings != null) {
    ctx.strokeStyle = 'rgba(240,232,210,0.55)'; ctx.lineWidth = Math.max(1, s * 0.008);
    const pts = [[head.x, head.y - head.r * 1.4], ...hands];
    pts.forEach(([px, py], i) => { ctx.beginPath(); ctx.moveTo(px * 0.9 + (i - 1.5) * s * 0.02, o.strings); ctx.lineTo(px, py); ctx.stroke(); });
    ctx.fillStyle = '#6b4a2a'; ctx.fillRect(-s * 0.14, o.strings - s * 0.03, s * 0.28, s * 0.03);
  }
  if (o.rods != null) {
    ctx.strokeStyle = shadow ? '#2a1a0e' : '#6b4a2a'; ctx.lineWidth = Math.max(2, s * 0.015);
    const rod = hands.slice(0, 2);
    for (const [px, py] of rod) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px * 0.7, o.rods); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(0, -s * 0.3); ctx.lineTo(0, o.rods); ctx.stroke();
  }
  ctx.restore();
}

// ---- backdrops -------------------------------------------------------------------------------------------------
// R = rect to paint inside; floorY absolute. colour set: { far, near, glow, sky }.
export function drawBackdrop(ctx, kind, R, floorY, k, t) {
  const { far, near, glow } = k;
  const H = floorY - R.y, W = R.w, x0 = R.x;
  ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip();
  const X = (f) => x0 + W * f;
  ctx.fillStyle = far; ctx.strokeStyle = far;
  switch (kind) {
    case 'market': {
      for (const [f, w] of [[0.1, 0.17], [0.9, 0.17], [0.5, 0.14]]) {
        const cx = X(f), top = floorY - H * 0.5, ww = W * w;
        ctx.fillStyle = far; poly(ctx, [[cx - ww, top + H * 0.14], [cx + ww, top + H * 0.14], [cx + ww * 0.8, top], [cx - ww * 0.8, top]]); ctx.fill();
        ctx.fillStyle = near; for (let i = 0; i < 5; i++) ctx.fillRect(cx - ww + i * ww * 0.4, top + H * 0.14, ww * 0.2, H * 0.05);
        ctx.fillStyle = far; ctx.fillRect(cx - ww * 0.9, top + H * 0.19, ww * 0.06, floorY - top - H * 0.19); ctx.fillRect(cx + ww * 0.84, top + H * 0.19, ww * 0.06, floorY - top - H * 0.19);
      }
      ctx.fillStyle = glow; for (let i = 0; i < 4; i++) { const cx = X(0.2 + i * 0.2), sw = Math.sin(t * 1.4 + i) * 3; ctx.beginPath(); ctx.arc(cx + sw, R.y + H * 0.12 + (i % 2) * H * 0.05, H * 0.035, 0, TAU); ctx.fill(); }
      break;
    }
    case 'palace': {
      const cx = X(0.5);
      ctx.fillStyle = far; ctx.fillRect(cx - W * 0.2, floorY - H * 0.42, W * 0.4, H * 0.42);
      for (let i = 0; i < 3; i++) { const w = W * (0.3 - i * 0.07), y = floorY - H * (0.42 + i * 0.1); poly(ctx, [[cx - w, y], [cx + w, y], [cx + w * 0.7, y - H * 0.1], [cx - w * 0.7, y - H * 0.1]]); ctx.fill(); }
      ctx.fillStyle = glow; ctx.fillRect(cx - W * 0.05, floorY - H * 0.3, W * 0.1, H * 0.3);
      ctx.fillStyle = far; for (const f of [0.08, 0.92]) { ctx.fillRect(X(f) - W * 0.02, R.y, W * 0.04, floorY - R.y); }
      break;
    }
    case 'forest': {
      for (const [f, s] of [[0.08, 1], [0.27, 0.7], [0.5, 0.55], [0.73, 0.75], [0.93, 1]]) {
        const cx = X(f), h = H * 0.9 * s;
        ctx.fillStyle = far; ctx.fillRect(cx - W * 0.012, floorY - h * 0.55, W * 0.024, h * 0.55);
        ctx.fillStyle = near; ctx.beginPath(); ctx.arc(cx, floorY - h * 0.65, h * 0.26, 0, TAU); ctx.arc(cx - h * 0.16, floorY - h * 0.52, h * 0.18, 0, TAU); ctx.arc(cx + h * 0.17, floorY - h * 0.5, h * 0.18, 0, TAU); ctx.fill();
      }
      break;
    }
    case 'night': {
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(X(0.8), R.y + H * 0.2, H * 0.1, 0, TAU); ctx.fill();
      for (let i = 0; i < 9; i++) { const tw = 0.5 + 0.5 * Math.sin(t * 2 + i * 1.7); ctx.globalAlpha = 0.4 + 0.5 * tw; ctx.fillRect(X(0.05 + i * 0.11), R.y + H * (0.08 + ((i * 37) % 30) / 100), 3, 3); }
      ctx.globalAlpha = 1; ctx.fillStyle = far; ctx.beginPath(); ctx.moveTo(x0, floorY); ctx.quadraticCurveTo(X(0.3), floorY - H * 0.35, X(0.6), floorY - H * 0.1); ctx.quadraticCurveTo(X(0.85), floorY - H * 0.25, x0 + W, floorY); ctx.fill();
      break;
    }
    case 'desert': {
      ctx.fillStyle = far; ctx.beginPath(); ctx.moveTo(x0, floorY); ctx.quadraticCurveTo(X(0.25), floorY - H * 0.5, X(0.5), floorY - H * 0.12); ctx.quadraticCurveTo(X(0.75), floorY - H * 0.4, x0 + W, floorY); ctx.fill();
      ctx.fillStyle = near; ctx.beginPath(); ctx.moveTo(x0, floorY); ctx.quadraticCurveTo(X(0.5), floorY - H * 0.25, x0 + W, floorY); ctx.fill();
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(X(0.82), R.y + H * 0.22, H * 0.09, 0, TAU); ctx.fill();
      break;
    }
    case 'oasis': {
      ctx.fillStyle = glow; ctx.beginPath(); ctx.ellipse(X(0.5), floorY - H * 0.04, W * 0.3, H * 0.06, 0, 0, TAU); ctx.fill();
      for (const [f, s] of [[0.15, 1], [0.85, 0.85]]) {
        const cx = X(f), h = H * 0.7 * s; ctx.strokeStyle = far; ctx.lineWidth = W * 0.014; ctx.beginPath(); ctx.moveTo(cx, floorY); ctx.quadraticCurveTo(cx + W * 0.02, floorY - h * 0.5, cx, floorY - h); ctx.stroke();
        for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.55; ctx.beginPath(); ctx.moveTo(cx, floorY - h); ctx.quadraticCurveTo(cx + Math.cos(a) * h * 0.3, floorY - h + Math.sin(a) * h * 0.2 - h * 0.1, cx + Math.cos(a) * h * 0.5, floorY - h + Math.sin(a) * h * 0.1 + h * 0.2); ctx.stroke(); }
      }
      break;
    }
    case 'pass': {
      ctx.fillStyle = far; poly(ctx, [[x0, floorY], [X(0.15), floorY - H * 0.55], [X(0.3), floorY - H * 0.25], [X(0.5), floorY - H * 0.8], [X(0.7), floorY - H * 0.3], [X(0.88), floorY - H * 0.6], [x0 + W, floorY]]); ctx.fill();
      ctx.fillStyle = glow; poly(ctx, [[X(0.5), floorY - H * 0.8], [X(0.45), floorY - H * 0.66], [X(0.5), floorY - H * 0.7], [X(0.56), floorY - H * 0.65]]); ctx.fill();
      break;
    }
    case 'street': {
      for (let i = 0; i < 4; i++) {
        const w = W * 0.2, cx = X(0.12 + i * 0.25), h = H * (0.55 + (i % 2) * 0.15);
        ctx.fillStyle = i % 2 ? far : near; ctx.fillRect(cx - w / 2, floorY - h, w, h); poly(ctx, [[cx - w * 0.6, floorY - h], [cx + w * 0.6, floorY - h], [cx, floorY - h - H * 0.12]]); ctx.fill();
        ctx.fillStyle = glow; ctx.fillRect(cx - w * 0.2, floorY - h * 0.75, w * 0.15, h * 0.18); ctx.fillRect(cx + w * 0.08, floorY - h * 0.75, w * 0.15, h * 0.18);
      }
      break;
    }
    case 'river': case 'sea': {
      ctx.strokeStyle = glow; ctx.lineWidth = 2;
      for (let r = 0; r < 4; r++) { ctx.beginPath(); for (let i = 0; i <= 24; i++) { const px = x0 + (W * i) / 24, py = floorY - H * (0.04 + r * 0.07) + Math.sin(i * 0.9 + t * 1.5 + r) * 3; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); }
      ctx.fillStyle = far; poly(ctx, [[X(0.7), floorY - H * 0.2], [X(0.88), floorY - H * 0.2], [X(0.84), floorY - H * 0.1], [X(0.74), floorY - H * 0.1]]); ctx.fill(); ctx.fillRect(X(0.79), floorY - H * 0.42, W * 0.008, H * 0.22); poly(ctx, [[X(0.8), floorY - H * 0.42], [X(0.86), floorY - H * 0.24], [X(0.8), floorY - H * 0.24]]); ctx.fill();
      break;
    }
    case 'village': {
      for (const [f, s] of [[0.15, 1], [0.5, 0.8], [0.85, 1]]) {
        const cx = X(f), w = W * 0.13 * s, h = H * 0.22 * s;
        ctx.fillStyle = near; ctx.fillRect(cx - w, floorY - h, w * 2, h); ctx.fillStyle = far; poly(ctx, [[cx - w * 1.3, floorY - h], [cx + w * 1.3, floorY - h], [cx, floorY - h * 2.1]]); ctx.fill();
        ctx.fillStyle = glow; ctx.fillRect(cx - w * 0.2, floorY - h * 0.7, w * 0.4, h * 0.7);
      }
      break;
    }
    case 'camp': {
      const cx = X(0.5), fl = 0.7 + 0.3 * Math.sin(t * 8);
      ctx.fillStyle = far; poly(ctx, [[X(0.12), floorY], [X(0.28), floorY - H * 0.5], [X(0.44), floorY]]); ctx.fill();
      poly(ctx, [[X(0.6), floorY], [X(0.76), floorY - H * 0.42], [X(0.92), floorY]]); ctx.fill();
      ctx.fillStyle = glow; ctx.globalAlpha = 0.5 * fl; ctx.beginPath(); ctx.arc(cx, floorY - H * 0.08, H * 0.2, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      poly(ctx, [[cx - H * 0.05, floorY], [cx, floorY - H * (0.12 + 0.03 * fl)], [cx + H * 0.05, floorY]]); ctx.fill();
      break;
    }
    case 'stage': {
      ctx.fillStyle = far; for (let i = 0; i < 3; i++) { ctx.fillRect(X(0.2 + i * 0.3) - W * 0.03, R.y + H * 0.2, W * 0.06, floorY - R.y - H * 0.2); }
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(X(0.5), R.y + H * 0.2, H * 0.06, 0, TAU); ctx.fill();
      break;
    }
    default: break;
  }
  ctx.restore();
}

// ---- stage frames ----------------------------------------------------------------------------------------------
export function drawCurtains(ctx, R, col, t, dark = false) {
  const w = R.w * 0.13;
  const fold = (x, dir) => {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, R.y); ctx.lineTo(x + dir * w, R.y); ctx.quadraticCurveTo(x + dir * w * 0.4, R.y + R.h * 0.5, x + dir * w * 0.9, R.y + R.h); ctx.lineTo(x, R.y + R.h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = dark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x + dir * w * i * 0.22, R.y); ctx.quadraticCurveTo(x + dir * w * (i * 0.12), R.y + R.h * 0.5, x + dir * w * (i * 0.2), R.y + R.h); ctx.stroke(); }
  };
  fold(R.x, 1); fold(R.x + R.w, -1);
  ctx.fillStyle = col; const vh = R.h * 0.1;
  ctx.fillRect(R.x, R.y, R.w, vh);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(R.x, R.y + vh - 3, R.w, 3);
  ctx.fillStyle = col; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(R.x + R.w * (i + 0.5) / 9, R.y + vh, R.w / 18, 0, Math.PI); ctx.fill(); }
}

// Wayang kulit (Java): perforated buffalo-hide figures as shadows on the kelir cloth, blencong lamp, banana-trunk base,
// gunungan, gamelan silhouettes below. Secular village tales only.
import { register } from '../theatres.js';
import { mix, dark, alpha, vgrad, hgrad, rrPath } from '../figures.js';
import { weave, vignette, place, audience } from '../kit.js';
import { TAU, outline, arm2, holes } from './_shadowkit.js';

// ---- the puppets ----------------------------------------------------------------------------------------------------
const HEAD = [[-0.75, -0.1], [-0.7, -0.65], [-0.35, -0.98], [0.15, -1.02], [0.6, -0.85], [0.82, -0.55], [0.86, -0.28], [1.25, 0.05], [1.85, 0.34], [1.12, 0.42], [1.0, 0.55], [1.05, 0.66], [0.9, 0.78], [0.98, 1.0], [0.62, 1.18], [0.12, 1.05], [-0.25, 0.6]];

function human(T) {
  const { ctx, c, o, kind, t, talk, breath, cut } = T;
  const clown = kind === 'clown', ruler = kind === 'ruler', child = kind === 'child';
  const S = T.s * (child ? 0.86 : clown ? 0.82 : 1);
  const L = mix('#0d0603', T.bodyC, 0.1), rim = 'rgba(255,200,100,0.7)', hole = cut;
  const rw = Math.max(1, S * 0.006);
  const hip = -0.42, lean = o.lean ?? 0, sway = breath * S * 0.004 + (o.walk ? Math.sin(t * 9 + T.phase) * S * 0.006 : 0);
  const part = (draw, hl) => {
    draw(); ctx.fillStyle = L; ctx.fill(); ctx.strokeStyle = rim; ctx.lineWidth = rw; ctx.stroke();
    if (hl) { ctx.save(); draw(); ctx.clip(); ctx.fillStyle = hole; hl(); ctx.restore(); }
  };
  const poly = (pts, sm) => () => outline(ctx, pts, S, 0, 0, sm);
  // feet, then the kain (skirt) with lace hem and a pleated front panel
  const st = o.walk ? Math.sin(t * 9 + T.phase) * 0.05 : 0;
  part(poly([[-0.05 + st, -0.06], [0.0 + st, 0.0], [0.17 + st, 0.0], [0.2 + st, -0.025], [0.1 + st, -0.045]], false));
  part(poly([[-0.12 - st, -0.06], [-0.09 - st, 0.0], [0.07 - st, 0.0], [0.1 - st, -0.025], [0.0 - st, -0.05]], false));
  const kain = [[-0.07, -0.43], [0.1, -0.42], [0.21, -0.3], [0.25, -0.13], [0.23, -0.05], [0.1, -0.025], [-0.02, -0.05], [-0.12, -0.02], [-0.2, -0.06], [-0.19, -0.2], [-0.14, -0.34]];
  part(poly(kain, true), () => {
    holes(ctx, -0.25 * S, -0.43 * S, 0.5 * S, 0.4 * S, S * 0.034, S * 0.009, hole, 'dia');
    for (let i = 0; i < 9; i++) { const x = (-0.17 + i * 0.043) * S; ctx.beginPath(); ctx.moveTo(x, -0.035 * S); ctx.lineTo(x + S * 0.014, -0.085 * S); ctx.lineTo(x + S * 0.028, -0.035 * S); ctx.fill(); }
    ctx.fillRect(-0.25 * S, -0.16 * S, 0.5 * S, S * 0.012);
  });
  part(poly([[0.05, -0.41], [0.16, -0.4], [0.18, -0.09], [0.07, -0.07]], false), () => { for (let i = 0; i < 4; i++) ctx.fillRect((0.075 + i * 0.026) * S, -0.38 * S, S * 0.008, S * 0.29); });
  // upper body rotates about the hips
  ctx.save(); ctx.translate(0, hip * S + sway); ctx.rotate(lean);
  const U = (x, y) => [x * S, (y - hip) * S];
  const uPoly = (pts, sm) => () => outline(ctx, pts.map(([x, y]) => [x, y - hip]), S, 0, 0, sm);
  ctx.strokeStyle = L; ctx.lineWidth = S * 0.026; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(...U(-0.04, -0.4)); ctx.quadraticCurveTo(...U(-0.2, -0.36), ...U(-0.24 - Math.sin(t * 2 + T.phase) * 0.015, -0.16)); ctx.stroke();
  const wide = ruler ? 1.15 : 1;
  const torso = clown
    ? [[-0.1, -0.69], [0.03, -0.7], [0.12, -0.62], [0.17, -0.5], [0.15, -0.4], [0.07, -0.34], [-0.08, -0.34], [-0.15, -0.42], [-0.12, -0.58]]
    : [[-0.055 * wide, -0.69], [0.02, -0.7], [0.075 * wide, -0.64], [0.085 * wide, -0.55], [0.06, -0.45], [0.07, -0.4], [-0.06, -0.4], [-0.075 * wide, -0.5], [-0.07 * wide, -0.62]];
  part(uPoly(torso, true), () => {
    ctx.beginPath(); ctx.moveTo(...U(-0.04, -0.69)); ctx.lineTo(...U(0.07, -0.64)); ctx.lineTo(...U(0.02, -0.57)); ctx.closePath(); ctx.fill();
    holes(ctx, -0.1 * S, (-0.62 - hip) * S, 0.25 * S, 0.22 * S, S * 0.03, S * 0.008, hole, 'dia');
    ctx.fillRect(-0.1 * S, (-0.42 - hip) * S, 0.25 * S, S * 0.012);
  });
  const R = S * (clown ? 0.082 : child ? 0.066 : 0.07);
  const bob = (o.speaking ? Math.abs(talk) * 0.01 : 0) * S;
  const hx = 0.03 * S, hy = (-0.745 - hip) * S - R * 0.95 - bob;
  ctx.fillStyle = L; ctx.fillRect(hx - R * 0.5, hy + R * 0.6, R * 0.95, R * 1.2);
  const hd = (pts, sm, hl) => part(() => outline(ctx, pts, R, hx, hy, sm), hl);
  if (ruler) {
    hd([[-0.78, -0.55], [0.78, -0.7], [0.7, -1.05], [-0.7, -0.92]], false, () => holes(ctx, hx - R, hy - R * 1.1, R * 2, R * 0.6, R * 0.3, R * 0.07, hole));
    hd([[-0.6, -0.95], [0.6, -1.08], [0.5, -1.75], [-0.5, -1.6]], true, () => holes(ctx, hx - R * 0.6, hy - R * 1.8, R * 1.2, R * 0.9, R * 0.26, R * 0.07, hole, 'dia'));
    hd([[-0.3, -1.65], [0.3, -1.75], [0.08, -2.7], [-0.15, -2.4]], false, () => holes(ctx, hx - R * 0.3, hy - R * 2.5, R * 0.6, R * 0.8, R * 0.22, R * 0.06, hole));
    hd([[-0.7, -0.8], [-1.0, -0.2], [-1.7, 0.5], [-1.2, 0.5], [-0.8, 0.0]], true, () => holes(ctx, hx - R * 1.7, hy - R * 0.6, R, R * 1.2, R * 0.26, R * 0.06, hole));
  } else if (child) {
    hd([[-0.9, -0.9], [-0.5, -1.45], [0.0, -1.35], [-0.1, -0.7]], true, () => holes(ctx, hx - R, hy - R * 1.4, R, R * 0.6, R * 0.22, R * 0.06, hole));
    hd([[-0.7, -0.55], [0.7, -0.75], [0.75, -0.95], [-0.7, -0.8]], false);
    hd([[0.05, -0.95], [0.3, -1.6], [0.55, -0.95]], false, () => ctx.fillRect(hx + R * 0.28, hy - R * 1.25, R * 0.06, R * 0.3));
    for (let i = 0; i < 4; i++) { ctx.fillStyle = L; ctx.beginPath(); ctx.arc(hx - R * (0.9 + i * 0.1), hy - R * 0.2 + i * R * 0.35, R * 0.1, 0, TAU); ctx.fill(); }
  } else if (clown) {
    hd([[-0.1, -0.95], [0.0, -1.8], [0.2, -1.4], [0.4, -1.75], [0.55, -0.9]], true);
    hd([[-0.75, -0.55], [0.75, -0.72], [0.75, -0.95], [-0.75, -0.78]], false);
  } else {
    hd([[-0.85, -0.1], [-0.8, -0.8], [0.0, -1.2], [0.7, -0.95], [0.88, -0.58], [0.2, -0.7]], true, () => { ctx.fillRect(hx - R * 0.6, hy - R * 0.95, R * 1.3, R * 0.07); });
    hd([[0.6, -0.95], [1.05, -1.6], [0.35, -1.05]], false);
  }
  const mouth = 0.03 + (o.speaking ? Math.abs(talk) * 0.16 : 0);
  part(() => outline(ctx, HEAD, R, hx, hy, false), () => {
    ctx.beginPath(); ctx.ellipse(hx + R * 0.52, hy - R * 0.22, R * (clown ? 0.26 : 0.3), R * (clown ? 0.16 : 0.085), -0.38, 0, TAU); ctx.fill();
    ctx.fillRect(hx + R * 0.18, hy - R * 0.55, R * 0.55, R * 0.05);
    ctx.fillRect(hx + R * 0.8, hy + R * 0.7, R * 0.3, R * mouth * 2);
    ctx.beginPath(); ctx.arc(hx - R * 0.3, hy + R * 0.1, R * 0.12, 0, TAU); ctx.fill();
  });
  // arms: very long, thin, two joints
  const aw = S * 0.02, hands = [];
  const sh = [[-0.025, -0.67], [0.04, -0.67]];
  const angs = [(o.a1 ?? 0.1) + 0.14, (o.a2 ?? 0.1) + 0.32];
  const prop = c.prop && c.prop !== 'none' ? c.prop : null;
  for (let i = 0; i < 2; i++) {
    const [sx, sy] = U(sh[i][0], sh[i][1]);
    const r = arm2(ctx, sx, sy, angs[i] * (i ? 1 : 0.85) + (i ? 0 : 0.08), S * 0.27, S * 0.3, aw, L, rim);
    const dx = r[0] - r[2], dy = r[1] - r[3], dl = Math.hypot(dx, dy) || 1;
    ctx.save(); ctx.translate(r[0], r[1]); ctx.rotate(Math.atan2(dy, dx));
    ctx.fillStyle = L; ctx.beginPath(); ctx.ellipse(S * 0.035, 0, S * 0.04, S * 0.011, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = rim; ctx.lineWidth = rw; ctx.stroke();
    ctx.restore();
    ctx.fillStyle = cut; ctx.beginPath(); ctx.arc(r[2], r[3], S * 0.005, 0, TAU); ctx.fill();
    if (i === 1 && prop && /staff|stick|cane|spear/.test(prop)) {
      const px = r[0] - dx / dl * S * 0.05;
      ctx.strokeStyle = L; ctx.lineWidth = S * 0.014; ctx.beginPath(); ctx.moveTo(px, r[1] + S * 0.34); ctx.lineTo(px, r[1] - S * 0.2); ctx.stroke();
      ctx.fillStyle = L; ctx.beginPath(); ctx.arc(px, r[1] - S * 0.22, S * 0.02, 0, TAU); ctx.fill();
    }
    hands.push([r[0], r[1]]);
  }
  const cs = Math.cos(lean), sn = Math.sin(lean), hipAbs = hip * S + sway;
  const loc = ([x, y]) => [x * cs - y * sn, hipAbs + x * sn + y * cs];
  T.hands.push(loc(hands[0]), loc(hands[1]));
  T.shoulders.push(loc(U(-0.04, -0.68)), loc(U(0.05, -0.68)));
  const hp = loc([hx, hy]); T.head.x = hp[0]; T.head.y = hp[1]; T.head.r = R;
  T.knees.push([-0.03 * S, -0.2 * S], [0.1 * S, -0.2 * S]);
  ctx.restore();
}

function beast(T) {
  const { ctx, c, o, t, phase, cut } = T;
  const nm = `${c.name ?? ''} ${c.species ?? ''}`.toLowerCase();
  const deer = /kancil|deer|mouse/.test(nm) && !/buffalo|kerbau/.test(nm);
  const calf = /calf/.test(nm);
  const S = T.s * 0.78 * (calf ? 0.72 : 1) * (deer ? 0.8 : 1);
  const L = mix('#0d0603', T.bodyC, 0.1), rim = 'rgba(255,200,100,0.7)';
  const rw = Math.max(1, S * 0.006);
  const gal = o.walk ? Math.sin(t * 8 + phase) * S * 0.045 : Math.sin(t * 1.6 + phase) * S * 0.006;
  const bob = Math.sin(t * 2 + phase) * S * 0.006;
  const part = (pts, sm, hl) => {
    outline(ctx, pts, S, 0, bob, sm); ctx.fillStyle = L; ctx.fill(); ctx.strokeStyle = rim; ctx.lineWidth = rw; ctx.stroke();
    if (hl) { ctx.save(); outline(ctx, pts, S, 0, bob, sm); ctx.clip(); ctx.fillStyle = cut; hl(); ctx.restore(); }
  };
  const leg = (x, d, w) => { ctx.strokeStyle = L; ctx.lineWidth = S * w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x * S, -0.2 * S); ctx.lineTo((x + d * 0.012) * S + gal * d * 0.5, -0.1 * S); ctx.lineTo(x * S + gal * d, -0.012 * S); ctx.stroke(); ctx.fillStyle = L; ctx.fillRect(x * S + gal * d - S * 0.022, -0.02 * S, S * 0.044, S * 0.02); };
  const w = deer ? 0.026 : 0.04;
  leg(-0.2, -1, w); leg(0.12, -1, w);
  ctx.strokeStyle = L; ctx.lineWidth = S * 0.014; ctx.beginPath(); ctx.moveTo(-0.3 * S, -0.31 * S + bob); ctx.quadraticCurveTo(-0.38 * S, -0.22 * S, -0.35 * S, -0.1 * S + Math.sin(t * 2 + phase) * S * 0.02); ctx.stroke();
  if (deer) {
    part([[-0.24, -0.3], [-0.05, -0.33], [0.13, -0.31], [0.2, -0.26], [0.17, -0.2], [0.0, -0.17], [-0.2, -0.19], [-0.27, -0.24]], true, () => holes(ctx, -0.3 * S, -0.36 * S, 0.5 * S, 0.2 * S, S * 0.03, S * 0.008, cut));
    part([[0.14, -0.3], [0.2, -0.38], [0.27, -0.36], [0.34, -0.24], [0.31, -0.2], [0.24, -0.23], [0.18, -0.24]], false, () => { ctx.beginPath(); ctx.arc(0.26 * S, -0.31 * S, S * 0.008, 0, TAU); ctx.fill(); });
    part([[0.21, -0.37], [0.2, -0.5], [0.25, -0.4]], false);
  } else {
    part([[-0.32, -0.32], [-0.2, -0.4], [-0.02, -0.4], [0.12, -0.43], [0.2, -0.37], [0.25, -0.26], [0.19, -0.2], [0.05, -0.15], [-0.12, -0.14], [-0.27, -0.17], [-0.33, -0.24]], true, () => {
      holes(ctx, -0.35 * S, -0.45 * S, 0.62 * S, 0.34 * S, S * 0.034, S * 0.009, cut, 'dia');
      ctx.fillRect(-0.35 * S, -0.3 * S, 0.62 * S, S * 0.012);
    });
    part([[0.2, -0.42], [0.29, -0.4], [0.38, -0.28], [0.44, -0.15], [0.41, -0.1], [0.33, -0.11], [0.27, -0.17], [0.19, -0.25]], false, () => { ctx.beginPath(); ctx.ellipse(0.33 * S, -0.26 * S, S * 0.018, S * 0.008, -0.6, 0, TAU); ctx.fill(); ctx.fillRect(0.36 * S, -0.13 * S, S * 0.05, S * 0.012); });
    ctx.strokeStyle = L; ctx.lineWidth = S * 0.032; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0.27 * S, -0.4 * S + bob); ctx.quadraticCurveTo(0.2 * S, -0.5 * S, 0.06 * S, -0.5 * S + bob); ctx.quadraticCurveTo(0.0, -0.5 * S, -0.02 * S, -0.43 * S + bob); ctx.stroke();
  }
  leg(-0.12, 1, w); leg(0.2, 1, w);
  T.head.x = 0.33 * S; T.head.y = -0.25 * S; T.head.r = S * 0.05;
  T.hands.push([-0.05 * S, -0.3 * S], [0.1 * S, -0.3 * S]); T.shoulders.push([-0.1 * S, -0.4 * S], [0.1 * S, -0.4 * S]);
}

function puppet(T) {
  if (T.kind === 'beast') { beast(T); return true; }
  if (['person', 'ruler', 'clown', 'trader', 'child'].includes(T.kind)) { human(T); return true; }
  return false;
}

// ---- the theatre -------------------------------------------------------------------------------------------------
function gunungan(ctx, cx, base, h, lamp, t, dim) {
  const w = h * 0.5, sw = Math.sin(t * 1.3) * w * 0.03;
  ctx.save(); ctx.translate(cx + sw, 0);
  const leaf = () => {
    ctx.beginPath(); ctx.moveTo(0, base - h);
    ctx.bezierCurveTo(w * 0.15, base - h * 0.88, w * 0.62, base - h * 0.74, w * 0.55, base - h * 0.5);
    ctx.bezierCurveTo(w * 0.8, base - h * 0.3, w * 0.5, base - h * 0.05, w * 0.4, base);
    ctx.lineTo(-w * 0.4, base);
    ctx.bezierCurveTo(-w * 0.5, base - h * 0.05, -w * 0.8, base - h * 0.3, -w * 0.55, base - h * 0.5);
    ctx.bezierCurveTo(-w * 0.62, base - h * 0.74, -w * 0.15, base - h * 0.88, 0, base - h);
  };
  leaf(); ctx.fillStyle = `rgba(14,6,2,${dim})`; ctx.fill();
  ctx.strokeStyle = 'rgba(255,200,100,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.save(); leaf(); ctx.clip(); ctx.fillStyle = alpha(lamp, 0.85);
  ctx.fillRect(-w * 0.03, base - h * 0.78, w * 0.06, h * 0.52);
  ctx.strokeStyle = alpha(lamp, 0.85); ctx.lineWidth = w * 0.035; ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) for (const d of [-1, 1]) { const y = base - h * (0.7 - i * 0.09); ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(d * w * 0.15, y - h * 0.04, d * w * 0.3, y - h * 0.02, d * w * (0.32 - i * 0.02), y - h * 0.08); ctx.stroke(); ctx.beginPath(); ctx.arc(d * w * (0.32 - i * 0.02), y - h * 0.095, w * 0.025, 0, TAU); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(-w * 0.2, base); ctx.lineTo(-w * 0.2, base - h * 0.18); ctx.quadraticCurveTo(0, base - h * 0.3, w * 0.2, base - h * 0.18); ctx.lineTo(w * 0.2, base); ctx.fill();
  ctx.fillStyle = `rgba(14,6,2,${dim})`; ctx.beginPath(); ctx.arc(-w * 0.07, base - h * 0.1, w * 0.04, 0, TAU); ctx.arc(w * 0.07, base - h * 0.1, w * 0.04, 0, TAU); ctx.fill(); ctx.fillRect(-w * 0.07, base - h * 0.05, w * 0.14, w * 0.025);
  ctx.fillStyle = alpha(lamp, 0.8);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r = w * 0.43; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.9, base - h * 0.5 + Math.sin(a) * h * 0.38, w * 0.02, 0, TAU); ctx.fill(); }
  ctx.restore(); ctx.restore();
}

function gamelan(ctx, R, y0, h, t) {
  const col = '#0b0503', warm = 'rgba(255,196,96,0.55)';
  const beat = Math.sin(t * 3.2), hit = Math.max(0, beat), u = h / 100;
  const fg = ctx.createLinearGradient(0, y0, 0, y0 + h); fg.addColorStop(0, 'rgba(120,60,10,0.35)'); fg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = fg; ctx.fillRect(R.x, y0, R.w, h);
  const gx = R.x + R.w * 0.84, gy = y0 + h * 0.5;
  ctx.fillStyle = col; ctx.fillRect(gx - R.w * 0.095, gy - h * 0.55, R.w * 0.016, h * 1.1); ctx.fillRect(gx + R.w * 0.08, gy - h * 0.55, R.w * 0.016, h * 1.1); ctx.fillRect(gx - R.w * 0.1, gy - h * 0.58, R.w * 0.2, 5 * u);
  const gr = Math.min(R.w * 0.075, h * 0.42), gsw = hit * 0.8;
  const gg = ctx.createRadialGradient(gx - gr * 0.3, gy - gr * 0.2, gr * 0.1, gx, gy, gr);
  gg.addColorStop(0, '#6a4410'); gg.addColorStop(0.55, '#2a1806'); gg.addColorStop(1, '#0e0703');
  ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(gx + gsw, gy, gr, 0, TAU); ctx.fill();
  ctx.strokeStyle = warm; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#c28a24'; ctx.beginPath(); ctx.arc(gx + gsw, gy, gr * 0.28, 0, TAU); ctx.fill();
  const sx = R.x + R.w * 0.36;
  ctx.fillStyle = col; rrPath(ctx, sx - R.w * 0.16, y0 + h * 0.62, R.w * 0.32, h * 0.2, 4); ctx.fill();
  for (let i = 0; i < 7; i++) { const bx = sx - R.w * 0.14 + i * R.w * 0.04; ctx.fillStyle = '#7a5416'; ctx.fillRect(bx, y0 + h * 0.56, R.w * 0.033, h * 0.07); ctx.fillStyle = 'rgba(255,220,130,0.6)'; ctx.fillRect(bx, y0 + h * 0.56, R.w * 0.033, 2); }
  ctx.strokeStyle = warm; ctx.lineWidth = 1.5; rrPath(ctx, sx - R.w * 0.16, y0 + h * 0.62, R.w * 0.32, h * 0.2, 4); ctx.stroke();
  const person = (px, py, sc, mallet) => {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(px, py + sc * 2.6, sc * 1.7, sc * 1.9, 0, Math.PI, TAU); ctx.fill();
    ctx.fillRect(px - sc * 1.5, py + sc * 2.6, sc * 3, sc * 4);
    ctx.beginPath(); ctx.arc(px, py, sc * 0.95, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px - sc * 0.15, py - sc * 0.55, sc * 1.1, sc * 0.55, 0, Math.PI, TAU); ctx.fill();
    ctx.fillRect(px - sc * 1.15, py - sc * 0.5, sc * 0.5, sc * 0.9);
    ctx.strokeStyle = warm; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(px, py, sc * 0.95, Math.PI * 1.05, Math.PI * 1.9); ctx.stroke();
    if (mallet != null) { ctx.strokeStyle = col; ctx.lineWidth = sc * 0.4; ctx.beginPath(); ctx.moveTo(px + sc * 1.3, py + sc * 3.4); ctx.lineTo(px + sc * 3.2, py + sc * 5 - mallet * sc * 1.4); ctx.stroke(); }
  };
  const ps = Math.min(R.w * 0.017, h * 0.075);
  person(sx - R.w * 0.07, y0 + h * 0.3, ps, hit * 0.6 + 0.2);
  person(sx + R.w * 0.09, y0 + h * 0.32, ps * 0.95, Math.max(0, -beat) * 0.6 + 0.2);
  const kx = R.x + R.w * 0.12;
  person(kx + R.w * 0.07, y0 + h * 0.3, ps, null);
  ctx.fillStyle = '#1a0d05'; ctx.beginPath(); ctx.moveTo(kx - R.w * 0.045, y0 + h * 0.72); ctx.quadraticCurveTo(kx, y0 + h * 0.58, kx + R.w * 0.045, y0 + h * 0.72); ctx.quadraticCurveTo(kx, y0 + h * 0.8, kx - R.w * 0.045, y0 + h * 0.72); ctx.fill();
  ctx.strokeStyle = warm; ctx.lineWidth = 1.5; ctx.stroke();
}

function stage(g, S0, v) {
  const { ctx } = g, L = v.L, t = v.t;
  const W = S0.w, H = S0.h;
  ctx.fillStyle = vgrad(ctx, S0.y, S0.y + H, [[0, '#0a0503'], [0.6, '#170b05'], [1, '#080402']]); ctx.fillRect(S0.x, S0.y, W, H);
  const fr = Math.max(10, W * 0.075);
  const orch = H * 0.19;
  const I = { x: S0.x + fr * 1.05, y: S0.y + H * 0.045, w: W - fr * 2.1, h: H - orch - H * 0.085 - H * 0.07 };
  const flick = 0.93 + 0.07 * Math.sin(t * 9) * Math.sin(t * 3.7) + 0.02 * Math.sin(t * 23);
  const lampX = I.x + I.w * 0.5 + Math.sin(t * 0.8) * I.w * 0.012, lampY = I.y + I.h * 0.16;
  const rg = ctx.createRadialGradient(lampX, lampY, I.h * 0.03, lampX, I.y + I.h * 0.45, Math.max(I.w, I.h) * 0.8 * flick);
  rg.addColorStop(0, '#fffbe0'); rg.addColorStop(0.3, L.screen); rg.addColorStop(0.75, L.screenEdge); rg.addColorStop(1, dark(L.screenEdge, 0.45));
  ctx.fillStyle = rg; ctx.fillRect(I.x, I.y, I.w, I.h);
  weave(ctx, I, 3, 'rgba(120,70,20,0.07)');
  ctx.save(); ctx.beginPath(); ctx.rect(I.x, I.y, I.w, I.h); ctx.clip();
  const floorY = I.y + I.h * 0.965;
  const big = v.opening;
  gunungan(ctx, big ? I.x + I.w * 0.5 : I.x + I.w * 0.93, floorY + 4, I.h * (big ? 0.7 : 0.45), L.lamp, t, big ? 0.88 : 0.6);
  place(ctx, I, floorY, I.h * 0.86, v, { style: 'shadow', cut: L.lamp, rodsY: I.y + I.h + 6, penumbra: true });
  const bloom = ctx.createRadialGradient(lampX, lampY, 2, lampX, lampY, I.h * 0.75 * flick);
  bloom.addColorStop(0, alpha('#fff4c8', 0.4)); bloom.addColorStop(1, alpha('#fff4c8', 0));
  ctx.fillStyle = bloom; ctx.fillRect(I.x, I.y, I.w, I.h);
  ctx.restore();
  // red kelir border with gold batik
  const bw = fr * 0.28;
  ctx.fillStyle = vgrad(ctx, I.y, I.y + I.h, [[0, '#8a1414'], [1, '#5a0c0c']]);
  ctx.beginPath(); ctx.rect(I.x - bw, I.y - bw, I.w + bw * 2, I.h + bw * 2); ctx.rect(I.x + I.w, I.y, -I.w, I.h); ctx.fill('evenodd');
  ctx.save(); ctx.beginPath(); ctx.rect(I.x - bw, I.y - bw, I.w + bw * 2, I.h + bw * 2); ctx.rect(I.x + I.w, I.y, -I.w, I.h); ctx.clip('evenodd');
  ctx.strokeStyle = 'rgba(240,190,80,0.6)'; ctx.lineWidth = 1.2; ctx.beginPath();
  for (let x = I.x - I.h; x < I.x + I.w + I.h; x += 8) { ctx.moveTo(x, I.y - bw); ctx.lineTo(x + I.h * 1.05, I.y + I.h + bw); }
  ctx.stroke(); ctx.restore();
  ctx.strokeStyle = 'rgba(255,210,120,0.8)'; ctx.lineWidth = 1.5; ctx.strokeRect(I.x - bw, I.y - bw, I.w + bw * 2, I.h + bw * 2);
  // teak joglo pillars with carved gold bands
  for (const px of [S0.x, S0.x + W - fr]) {
    ctx.fillStyle = hgrad(ctx, px, px + fr, [[0, '#1a0d05'], [0.4, '#4a2812'], [1, '#150a04']]); ctx.fillRect(px, S0.y, fr, H);
    ctx.fillStyle = 'rgba(232,184,74,0.7)'; ctx.fillRect(px, S0.y + H * 0.03, fr, 3); ctx.fillRect(px, S0.y + H * 0.76, fr, 3);
    ctx.strokeStyle = 'rgba(232,184,74,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); for (let y = S0.y + H * 0.06; y < S0.y + H * 0.74; y += fr * 0.45) { ctx.moveTo(px + fr * 0.2, y); ctx.lineTo(px + fr * 0.5, y + fr * 0.22); ctx.lineTo(px + fr * 0.8, y); } ctx.stroke();
  }
  // blencong lamp: gilded bird-shaped bowl with a living flame
  const fl = Math.sin(t * 9) * 0.1 + Math.sin(t * 13.7) * 0.06;
  const lx = lampX, ly = I.y - bw * 0.2;
  const lg = ctx.createRadialGradient(lx, ly + 6, 1, lx, ly + 6, fr * 2.4); lg.addColorStop(0, 'rgba(255,230,140,0.85)'); lg.addColorStop(1, 'rgba(255,190,70,0)');
  ctx.fillStyle = lg; ctx.fillRect(lx - fr * 2.4, ly - fr * 2, fr * 4.8, fr * 4.8);
  ctx.strokeStyle = '#3a2008'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(lx, S0.y); ctx.lineTo(lx, ly + 4); ctx.stroke();
  ctx.fillStyle = vgrad(ctx, ly, ly + fr * 0.4, [[0, '#ffe08a'], [1, '#a8741a']]);
  ctx.beginPath(); ctx.ellipse(lx, ly + fr * 0.3, fr * 0.5, fr * 0.17, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(lx + fr * 0.4, ly + fr * 0.25); ctx.quadraticCurveTo(lx + fr * 0.75, ly + fr * 0.05, lx + fr * 0.7, ly + fr * 0.32); ctx.quadraticCurveTo(lx + fr * 0.6, ly + fr * 0.3, lx + fr * 0.4, ly + fr * 0.36); ctx.fill();
  ctx.fillStyle = '#fff6c0'; ctx.beginPath(); ctx.moveTo(lx - fr * 0.1, ly + fr * 0.15); ctx.quadraticCurveTo(lx + fl * fr, ly - fr * 0.3, lx, ly - fr * (0.55 + fl)); ctx.quadraticCurveTo(lx + fr * 0.02 + fl * fr * 0.4, ly - fr * 0.1, lx + fr * 0.1, ly + fr * 0.15); ctx.fill();
  // banana-trunk base: two logs
  const ty = I.y + I.h + bw, th = H * 0.04;
  for (let k = 0; k < 2; k++) {
    const y = ty + k * th * 0.95, x0 = S0.x + fr * 0.5, w = W - fr;
    ctx.fillStyle = vgrad(ctx, y, y + th, [[0, k ? '#d8d7a0' : '#a8b868'], [0.5, k ? '#8e9a50' : '#6a7e34'], [1, '#2c3814']]);
    rrPath(ctx, x0, y, w, th, th * 0.45); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 1; i < 26; i++) { const xx = x0 + w * i / 26; ctx.moveTo(xx, y + 2); ctx.lineTo(xx + 2, y + th - 2); } ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,230,0.25)'; ctx.fillRect(x0 + th * 0.4, y + th * 0.12, w - th * 0.8, 2);
  }
  gamelan(ctx, S0, S0.y + H - orch - H * 0.01, orch, t);
  audience(ctx, S0, v, S0.y + H * 1.01);
  vignette(ctx, S0, 0.42);
}

register({
  id: 'wayang',
  look: { screen: '#f7dc96', screenEdge: '#c8822a', lamp: '#fff0b8', frame: '#3a1d0c', curtain: '#6b1d1d' },
  stage,
  puppet,
  skin: {
    card: { top: '#40220f', bot: '#1c0d05', edge: '#d9a441', inner: 'rgba(255,215,120,0.28)', ink: '#fcefd0', dim: '#e0c48c', accent: '#f0c050', shape: 'cut', r: 14, pattern: 'parang', patCol: '#e0b050', patA: 0.16, band: 6, bandCol: '#7a1414', bandPat: 'diamond' },
    name: { fill: '#8a1c14', fillEnd: '#d9a441', ink: '#ffe9b0', edge: 'rgba(255,215,120,0.7)', shape: 'cut' },
    plaque: { base: '#4a2410', hot: '#7e3c16', end: '#d9a441', ink: '#fff3d0', inkEnd: '#2a1204', edge: '#e0b050', inner: 'rgba(255,215,120,0.55)', shape: 'ogee', r: 14, pattern: 'parang', patCol: '#f0c060', patA: 0.12, med: 'flower', medA: '#ffe8a0', medB: '#b8801a', medInk: '#3a1c04', medEdge: '#5a3406' },
    meter: { fill: '#24120a', edge: 'rgba(224,176,80,0.3)', bead: 'leaf', col: '#f0b83a', ink: '#fcefd0' },
    trans: 'kayon', transCol: '#0e0603',
    snd: { root: 233, scale: [1, 1.149, 1.32, 1.516, 1.741], hit: 'bell', voiceLow: true, voiceVol: 0.025 },
    voice: 5,
  },
});
export default null;

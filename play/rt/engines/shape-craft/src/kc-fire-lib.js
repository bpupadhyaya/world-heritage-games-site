// Kitchen Crafts (fire area) shared drawing helpers: soft particles (flour, steam, embers, splashes, crumbs), a shaded cook's forearm and hand,
// small maths. Pure canvas 2D, no DOM, no Math.random; every irregularity is a hash, every motion is driven by the dt the activity feeds in.
import { hash } from './geom.js';
import { rgba, mix, tint } from './fx.js';

export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sm = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
// text size for a caption: wanted size, capped by the room, never below 12 css px (g.px(0) is that floor)
export const fsz = (g, base, cap) => Math.max(g.px(0), Math.min(g.px(base), cap));
export const r3 = (v) => Math.round(v * 1000) / 1000;
export const lin = (ctx, x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); for (const [o, c] of stops) g.addColorStop(o, c); return g; };
export const rad = (ctx, x, y, r0, r1, stops, fx = x, fy = y) => { const g = ctx.createRadialGradient(fx, fy, Math.max(0, r0), x, y, Math.max(0.1, r1)); for (const [o, c] of stops) g.addColorStop(o, c); return g; };

// ---- soft particles -----------------------------------------------------------------------------------------------------------------
// kinds: flour (white, drifts and settles), steam (rises, grows, fades), ember (bright, rises and flickers), splash (droplet), crumb (tan flake),
// smoke (grey, slow), ash. Not part of getState(); positions come from a counter hash so replays look identical.
export function createPuffs(cap = 260) {
  let list = [], n = 0;
  return {
    emit(kind, x, y, { count = 6, color = '#fff', size = 10, speed = 40, life = 1.2, gravity = 0, spread = TAU, angle = -Math.PI / 2, grow = 1.8, alpha = 0.5, drift = 0 } = {}) {
      for (let k = 0; k < count; k++) {
        const a = angle + (hash(n, k, 1) - 0.5) * spread, v = speed * (0.35 + hash(n, k, 2) * 0.9);
        list.push({ kind, x: x + (hash(n, k, 7) - 0.5) * size * 0.8, y: y + (hash(n, k, 8) - 0.5) * size * 0.5, vx: Math.cos(a) * v, vy: Math.sin(a) * v, age: 0, life: life * (0.7 + hash(n, k, 3) * 0.6), g: gravity, s: size * (0.55 + hash(n, k, 4) * 0.9), rot: hash(n, k, 5) * TAU, vr: (hash(n, k, 6) - 0.5) * 6, color, grow, alpha, drift, ph: hash(n, k, 9) * TAU });
      }
      n++;
      if (list.length > cap) list.splice(0, list.length - cap);
    },
    update(dt) {
      for (const p of list) {
        p.age += dt; p.vy += p.g * dt; p.x += (p.vx + Math.sin(p.age * 2.3 + p.ph) * p.drift) * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        if (p.kind === 'flour' || p.kind === 'steam' || p.kind === 'smoke') { p.vx *= 1 - 0.7 * dt; p.vy *= 1 - 0.5 * dt; }
      }
      list = list.filter((p) => p.age < p.life);
    },
    draw(ctx) {
      for (const p of list) {
        const u = p.age / p.life, fade = Math.sin(Math.min(1, u * 1.15) * Math.PI) ;   // swell in, fade out
        if (p.kind === 'flour' || p.kind === 'steam' || p.kind === 'smoke' || p.kind === 'ash') {
          const r = p.s * (1 + u * p.grow), a = p.alpha * (p.kind === 'steam' ? Math.min(1, fade * 1.4) : fade);
          if (a < 0.01) continue;
          ctx.fillStyle = rad(ctx, p.x, p.y, 0, r, [[0, rgba(p.color, a)], [0.55, rgba(p.color, a * 0.45)], [1, rgba(p.color, 0)]]);
          ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
        } else if (p.kind === 'ember') {
          const a = (1 - u) * (0.65 + 0.35 * Math.sin(p.age * 24 + p.ph)), r = p.s * (1 - u * 0.5);
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = rad(ctx, p.x, p.y, 0, r * 2.4, [[0, rgba('#fff2b0', a)], [0.3, rgba(p.color, a * 0.8)], [1, rgba(p.color, 0)]]); ctx.fillRect(p.x - r * 2.4, p.y - r * 2.4, r * 4.8, r * 4.8);
          ctx.restore();
        } else if (p.kind === 'splash') {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx) + Math.PI / 2); ctx.globalAlpha = Math.max(0, 1 - u * u);
          ctx.fillStyle = p.color; ctx.beginPath(); ctx.ellipse(0, 0, p.s * 0.32, p.s * 0.6, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-p.s * 0.1, -p.s * 0.38, p.s * 0.1, p.s * 0.3);
          ctx.restore();
        } else { // crumb
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = Math.max(0, 1 - u * u);
          ctx.fillStyle = p.color; ctx.beginPath(); ctx.moveTo(-p.s * 0.5, -p.s * 0.3); ctx.lineTo(p.s * 0.5, -p.s * 0.2); ctx.lineTo(p.s * 0.3, p.s * 0.4); ctx.lineTo(-p.s * 0.4, p.s * 0.3); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
      }
    },
    count: () => list.length,
  };
}

// ---- a cook's forearm and hand --------------------------------------------------------------------------------------------------------
// Seen from behind, as if the player were the cook, a fist closed over whatever is held: the forearm comes up from the lower outer corner (a rolled
// white sleeve), then the back of the hand with its four knuckles, the fingers curling over and away round the dough, the thumb pressed along the
// inner edge. (x, y) is where the held thing enters the fist (the front-inner edge). s is one finger width. side -1 = left hand, +1 = right hand.
// grip 0 = loose, 1 = tight. dust 0..1 is flour on the skin. dirx tilts the arm (0 = straight up the screen).
export function drawHand(ctx, o) {
  const { s, side = 1, grip = 1, skin = '#d6a07c', sleeve = '#f1ede4', dust = 0, reach = 7, dirx = side * 0.8 } = o;
  const diry = 1, dl = Math.hypot(dirx, diry), ux = dirx / dl, uy = diry / dl;       // from the fist back down the arm
  const px = -uy, py = ux;                                                          // across the arm
  const inner = side;                                                               // +w is the inner side for the right hand, -w for the left
  const X = o.x + ux * 2.35 * s + px * inner * -0.9 * s, Y = o.y + uy * 2.35 * s + py * inner * -0.9 * s;   // the wrist
  const A = (d, w) => [X + ux * d + px * w, Y + uy * d + py * w];
  const AI = (d, wi) => A(d, inner * wi);
  const shade = (c, k) => (k >= 0 ? mix(c, '#ffffff', k) : mix(c, '#000000', -k));
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const wr = 1.0 * s, el = 1.5 * s, L = reach * s, cuff = 2.9 * s;
  const poly = (d0, w0, d1, w1) => { const a = A(d0, -w0), b = A(d1, -w1), c = A(d1, w1), d = A(d0, w0); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...c); ctx.lineTo(...d); ctx.closePath(); };
  // cast shadow of the arm on the counter
  ctx.save(); ctx.globalAlpha = 0.26; ctx.fillStyle = '#000'; ctx.translate(s * 0.7, s * 1.2); poly(0.4 * s, wr * 1.1, L, el * 1.2); ctx.fill(); ctx.restore();
  // forearm (skin to the wrist), tapered, lit from the upper left
  poly(0.2 * s, wr, cuff + 0.4 * s, wr * 1.28);
  ctx.fillStyle = lin(ctx, ...A(0, -el), ...A(0, el), [[0, shade(skin, 0.22)], [0.45, skin], [1, shade(skin, -0.42)]]); ctx.fill();
  ctx.strokeStyle = rgba(shade(skin, 0.5), 0.4); ctx.lineWidth = Math.max(1, s * 0.1); ctx.beginPath(); ctx.moveTo(...A(1.2 * s, -wr * 0.4)); ctx.lineTo(...A(cuff, -wr * 0.5)); ctx.stroke();
  ctx.strokeStyle = rgba(shade(skin, -0.5), 0.22); ctx.lineWidth = Math.max(0.8, s * 0.07); ctx.beginPath(); ctx.moveTo(...A(1.3 * s, wr * 0.25)); ctx.quadraticCurveTo(...A(2 * s, wr * 0.05), ...A(2.7 * s, wr * 0.3)); ctx.stroke();
  // rolled sleeve with a cuff band and folds
  poly(cuff, wr * 1.36, L, el * 1.14);
  ctx.fillStyle = lin(ctx, ...A(0, -el * 1.2), ...A(0, el * 1.2), [[0, shade(sleeve, 0.12)], [0.5, sleeve], [1, shade(sleeve, -0.36)]]); ctx.fill();
  ctx.strokeStyle = 'rgba(60,50,40,0.35)'; ctx.lineWidth = 1; ctx.stroke();
  poly(cuff - 0.45 * s, wr * 1.5, cuff + 0.35 * s, wr * 1.5); ctx.fillStyle = lin(ctx, ...A(0, -el), ...A(0, el), [[0, shade(sleeve, 0.2)], [1, shade(sleeve, -0.28)]]); ctx.fill(); ctx.strokeStyle = 'rgba(60,50,40,0.45)'; ctx.stroke();
  ctx.strokeStyle = 'rgba(70,60,50,0.26)'; ctx.lineWidth = Math.max(1, s * 0.07);
  for (let k = 0; k < 4; k++) { const d = cuff + 1.3 * s + k * 1.2 * s; ctx.beginPath(); ctx.moveTo(...A(d, -el * 0.9)); ctx.quadraticCurveTo(...A(d + 0.25 * s, 0), ...A(d, el * 0.9)); ctx.stroke(); }
  // the back of the hand: wide at the knuckles, narrow at the wrist, a soft dome
  const hk = -1.45 * s, hw = 1.8 * s;
  ctx.beginPath(); ctx.moveTo(...A(0.3 * s, -wr * 1.05)); ctx.bezierCurveTo(...A(-0.2 * s, -hw * 0.9), ...A(hk * 0.6, -hw * 1.1), ...A(hk, -hw * 0.98)); ctx.lineTo(...A(hk, hw * 0.98)); ctx.bezierCurveTo(...A(hk * 0.6, hw * 1.1), ...A(-0.2 * s, hw * 0.9), ...A(0.3 * s, wr * 1.05)); ctx.closePath();
  ctx.fillStyle = lin(ctx, ...A(0, -hw), ...A(0, hw), [[0, shade(skin, 0.28)], [0.4, shade(skin, 0.04)], [1, shade(skin, -0.4)]]); ctx.fill();
  ctx.strokeStyle = rgba(shade(skin, -0.55), 0.5); ctx.lineWidth = 1.2; ctx.stroke();
  ctx.strokeStyle = rgba(shade(skin, -0.45), 0.2); ctx.lineWidth = Math.max(1, s * 0.07);
  for (const k of [-1.35, -0.45, 0.45, 1.35]) { ctx.beginPath(); ctx.moveTo(...A(-0.1 * s, k * wr * 0.4)); ctx.lineTo(...A(hk, k * s * 0.95)); ctx.stroke(); }
  // four fingers closed over the dough: stubby proximal segments curling forward and down out of sight, a crease at each joint
  const fw = 0.88 * s, curl = 0.75 + 0.25 * grip;
  const ws = [-1.32, -0.44, 0.44, 1.32].map((w) => w * s);
  ws.forEach((w, k) => {
    const len = (1.2 - Math.abs(k - 1.5) * 0.1) * s * curl, a = A(hk + 0.2 * s, w), b = A(hk - len, w * 0.96);
    ctx.strokeStyle = shade(skin, -0.62); ctx.lineWidth = fw + 2.4; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
    ctx.strokeStyle = lin(ctx, ...A(0, w - fw / 2), ...A(0, w + fw / 2), [[0, shade(skin, 0.12)], [0.5, skin], [1, shade(skin, -0.34)]]); ctx.lineWidth = fw; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
    // the finger bends over the dough: shade the far end, a crease, a highlight along the top of the finger
    const e = A(hk - len, w * 0.96); ctx.fillStyle = lin(ctx, ...A(hk - len * 0.4, w), ...A(hk - len - fw * 0.3, w), [[0, rgba(shade(skin, -0.4), 0)], [1, rgba(shade(skin, -0.72), 0.85)]]); ctx.beginPath(); ctx.ellipse(e[0], e[1], fw * 0.5, fw * 0.42, Math.atan2(uy, ux) + 1.57, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba(shade(skin, -0.6), 0.5); ctx.lineWidth = Math.max(1, s * 0.07); const m1 = A(hk - len * 0.45, w - fw * 0.46), m2 = A(hk - len * 0.45, w + fw * 0.46); ctx.beginPath(); ctx.moveTo(...m1); ctx.lineTo(...m2); ctx.stroke();
    ctx.strokeStyle = rgba(shade(skin, 0.68), 0.6); ctx.lineWidth = Math.max(1, fw * 0.16); ctx.beginPath(); ctx.moveTo(...A(hk + 0.05 * s, w - fw * 0.2)); ctx.lineTo(...A(hk - len * 0.8, w - fw * 0.2)); ctx.stroke();
    ctx.fillStyle = rgba(shade(skin, 0.32), 0.8); ctx.beginPath(); ctx.arc(a[0], a[1], fw * 0.42, 0, TAU); ctx.fill();   // the knuckle
    ctx.strokeStyle = rgba(shade(skin, -0.5), 0.35); ctx.lineWidth = 1; ctx.stroke();
  });
  // the thumb, pressed along the inner edge toward the dough, its nail catching the light
  const t0 = AI(-0.1 * s, hw * 0.95), t1 = AI(hk + 0.1 * s, hw * 1.25), t2 = AI(hk - 1.55 * s, hw * 0.95);
  ctx.strokeStyle = shade(skin, -0.62); ctx.lineWidth = s * 0.9 + 2.4; ctx.beginPath(); ctx.moveTo(...t0); ctx.quadraticCurveTo(...t1, ...t2); ctx.stroke();
  ctx.strokeStyle = lin(ctx, ...AI(0, hw * 0.5), ...AI(0, hw * 1.5), [[0, shade(skin, -0.25)], [0.6, skin], [1, shade(skin, 0.15)]]); ctx.lineWidth = s * 0.9; ctx.beginPath(); ctx.moveTo(...t0); ctx.quadraticCurveTo(...t1, ...t2); ctx.stroke();
  ctx.fillStyle = rgba('#f6e2d6', 0.92); ctx.beginPath(); ctx.ellipse(t2[0] - ux * s * 0.05, t2[1] - uy * s * 0.05, s * 0.3, s * 0.38, Math.atan2(uy, ux) + 1.57, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(t2[0] - px * s * 0.08, t2[1] - py * s * 0.08 - s * 0.1, s * 0.1, s * 0.16, 0, 0, TAU); ctx.fill();
  // flour on the skin
  if (dust > 0.02) {
    ctx.fillStyle = rgba('#ffffff', 0.5 * dust);
    for (let k = 0; k < 28; k++) { const d = hk - 0.6 * s + hash(k, 11) * (-hk + 0.6 * s + 3 * s), w = (hash(k, 12) - 0.5) * 3.2 * s, q = A(d, w); ctx.beginPath(); ctx.arc(q[0], q[1], s * (0.04 + hash(k, 13) * 0.09), 0, TAU); ctx.fill(); }
  }
  void tint;
  ctx.restore();
}

// wood grain helper: horizontal planks with seams, grain lines, knots and a lit top edge; used for counters, boards and peels
export function planksH(ctx, x, y, w, h, c, plank, seed = 1, wear = 1) {
  const n = Math.max(1, Math.round(h / plank));
  for (let i = 0; i < n; i++) {
    const py = y + (h * i) / n, ph = h / n, k = hash(i, seed), base = mix(c, hash(i, seed + 3) > 0.5 ? '#3a2412' : '#c89a5a', 0.06 + k * 0.1);
    ctx.fillStyle = lin(ctx, 0, py, 0, py + ph, [[0, tint(base, 0.1)], [0.5, base], [1, tint(base, -0.18)]]); ctx.fillRect(x, py, w, ph);
    ctx.strokeStyle = 'rgba(255,230,190,0.07)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let g = 0; g < 9; g++) { const gy = py + ph * (0.12 + 0.8 * hash(i, g, seed + 5)), x0 = x + w * hash(i, g, seed + 6) * 0.5; ctx.moveTo(x0, gy); ctx.bezierCurveTo(x0 + w * 0.2, gy + (hash(g, i, 3) - 0.5) * 5, x0 + w * 0.35, gy - (hash(g, i, 4) - 0.5) * 5, x0 + w * (0.4 + hash(i, g, 8) * 0.55), gy + (hash(i, g, 9) - 0.5) * 4); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath();
    for (let g = 0; g < 7; g++) { const gy = py + ph * (0.1 + 0.85 * hash(i, g, seed + 15)), x0 = x + w * hash(i, g, seed + 16) * 0.6; ctx.moveTo(x0, gy); ctx.lineTo(x0 + w * (0.1 + hash(i, g, 18) * 0.3), gy + (hash(i, g, 19) - 0.5) * 3); }
    ctx.stroke();
    if (wear > 0 && hash(i, seed + 21) > 0.55) { const kx = x + w * (0.15 + hash(i, seed + 22) * 0.7), ky = py + ph * 0.5; ctx.fillStyle = 'rgba(40,22,8,0.3)'; ctx.beginPath(); ctx.ellipse(kx, ky, ph * 0.28, ph * 0.16, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(40,22,8,0.25)'; ctx.beginPath(); ctx.ellipse(kx, ky, ph * 0.42, ph * 0.26, 0, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x, py + ph - 1.5, w, 1.5); ctx.fillStyle = 'rgba(255,235,200,0.13)'; ctx.fillRect(x, py, w, 1.2);
  }
}

// a cheap but convincing steel/enamel pot highlight band
export function sheenBand(ctx, x0, y0, x1, y1, c, a = 0.5) { ctx.fillStyle = lin(ctx, x0, y0, x1, y0, [[0, rgba(c, 0)], [0.5, rgba(c, a)], [1, rgba(c, 0)]]); ctx.fillRect(x0, y0, x1 - x0, y1 - y0); }

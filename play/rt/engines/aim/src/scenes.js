// Per-sport scenes for the aim engine's face view (mode "fire"): each recognised game gets its own venue, equipment,
// cursor/tool, effects and sounds instead of the shared disc-on-a-post range. Keyed by the game's title (and params), so
// game folders do not change. Pure canvas, deterministic (hash-based), no assets.
//   pinata    - festival patio at dusk, a papier-mache star on a pulley rope, a striped stick, candy
//   alka      - a street of stone houses, the ring gantry (spoked iron alka), a lance with pennant, horse ears
//   steppe    - open steppe with felt tents, a rail fence and a gallop camera, square hide targets, a recurve bow
import { mix, dark, light, alpha, vgrad, hgrad, poly, rrect, clamp, hash } from './scenery.js';
import { SOUND } from './sound.js';

const TAU = Math.PI * 2;
const ell = (ctx, x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rot, 0, TAU); };

export function faceSceneId(P, title) {
  const t = `${title ?? ''}`.toLowerCase();
  if (P.mode !== 'fire') return null;
  if (P.scene && ['pinata', 'alka', 'steppe'].includes(P.scene)) return P.scene;
  if (/pi[nñ]ata|hampas|palayok/.test(t)) return 'pinata';
  if (/ring.?tilt|alka|tilting/.test(t)) return 'alka';
  if (/mounted|horse.?archery|horseback/.test(t)) return 'steppe';
  return null;
}

// ---- shared bits ---------------------------------------------------------------------------------------------------
function stick(ctx, x0, y0, x1, y1, w0, w1, cols, seg = 9) {
  // a tapered stick drawn as striped segments (spiral stripes read as a painted festival pole)
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  for (let i = 0; i < seg; i++) {
    const a = i / seg, b = (i + 1) / seg, wa = (w0 + (w1 - w0) * a) / 2, wb = (w0 + (w1 - w0) * b) / 2;
    ctx.fillStyle = cols[i % cols.length];
    poly(ctx, [[x0 + dx * a + nx * wa, y0 + dy * a + ny * wa], [x0 + dx * b + nx * wb, y0 + dy * b + ny * wb], [x0 + dx * b - nx * wb, y0 + dy * b - ny * wb], [x0 + dx * a - nx * wa, y0 + dy * a - ny * wa]]); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = Math.max(1, w0 * 0.12); ctx.beginPath();
  ctx.moveTo(x0 + nx * w0 * 0.22, y0 + ny * w0 * 0.22); ctx.lineTo(x1 + nx * w1 * 0.22, y1 + ny * w1 * 0.22); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = Math.max(1, w0 * 0.1); ctx.beginPath();
  ctx.moveTo(x0 - nx * w0 * 0.3, y0 - ny * w0 * 0.3); ctx.lineTo(x1 - nx * w1 * 0.3, y1 - ny * w1 * 0.3); ctx.stroke();
}
const fist = (ctx, x, y, r, skin, cuff) => {
  ctx.fillStyle = cuff; ell(ctx, x + r * 0.9, y + r * 1.2, r * 1.15, r * 1.5, 0.5); ctx.fill();
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r * 1.1); g.addColorStop(0, light(skin, 0.25)); g.addColorStop(1, dark(skin, 0.35));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x - r * 0.1, y + i * r * 0.42); ctx.lineTo(x + r * 0.6, y + i * r * 0.42); ctx.stroke(); }
};
function ringTorus(ctx, x, y, r, th, col, spin = 0) {
  // a metal ring seen from the front: lit rim, dark inside edge, a moving glint
  const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  g.addColorStop(0, light(col, 0.55)); g.addColorStop(0.45, col); g.addColorStop(1, dark(col, 0.55));
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = th + 2; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = g; ctx.lineWidth = th; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = Math.max(1, th * 0.28); ctx.beginPath(); ctx.arc(x, y, r, -2.4 + spin, -1.3 + spin); ctx.stroke();
}

// ====================================================================================================================
// PINATA: a courtyard on a festival night
// ====================================================================================================================
const CANDY = ['#ff4d6d', '#ffd23f', '#3bceac', '#4cc9f0', '#ff9f1c', '#c77dff', '#80ed99'];

function pinataScene(P, env, fx) {
  const LK = P.look;
  let hitsN = 0, candies = [], swingFx = [];
  const reset = () => { hitsN = 0; candies = []; swingFx = []; };
  const wallCol = '#d7893f';

  function house(ctx, x, w, hz, h, t, n) {
    ctx.fillStyle = vgrad(ctx, hz - h, hz, [[0, light(wallCol, 0.1)], [1, dark(wallCol, 0.25)]]); ctx.fillRect(x, hz - h, w, h);
    ctx.fillStyle = dark('#8a3b24', 0.0); ctx.fillRect(x - 3, hz - h - 7, w + 6, 8);          // parapet cap
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x, hz - h * 0.12, w, h * 0.12);
    const aw = Math.min(26, w / (n * 1.8));
    for (let i = 0; i < n; i++) {
      const ax = x + (i + 0.5) * (w / n), ay = hz - h * 0.14;
      const gl = ctx.createRadialGradient(ax, ay - h * 0.3, 1, ax, ay - h * 0.3, h * 0.7);
      gl.addColorStop(0, 'rgba(255,214,120,0.75)'); gl.addColorStop(1, 'rgba(255,214,120,0)');
      ctx.fillStyle = gl; ctx.fillRect(ax - h * 0.7, ay - h, h * 1.4, h * 1.1);
      ctx.fillStyle = '#ffdc86'; ctx.beginPath(); ctx.moveTo(ax - aw / 2, ay); ctx.lineTo(ax - aw / 2, ay - h * 0.42); ctx.arc(ax, ay - h * 0.42, aw / 2, Math.PI, 0); ctx.lineTo(ax + aw / 2, ay); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#4a2418'; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax, ay - h * 0.42 - aw / 2); ctx.lineTo(ax, ay); ctx.moveTo(ax - aw / 2, ay - h * 0.3); ctx.lineTo(ax + aw / 2, ay - h * 0.3); ctx.stroke();
      // flower pot on the sill
      ctx.fillStyle = '#b8472a'; ctx.fillRect(ax - 6, ay + 1, 12, 7);
      ctx.fillStyle = CANDY[(n + i) % CANDY.length]; ctx.beginPath(); ctx.arc(ax - 3, ay - 1, 3.5, 0, TAU); ctx.arc(ax + 3, ay - 2, 3, 0, TAU); ctx.fill();
    }
    void t;
  }

  const backdrop = (ctx, c) => {
    const { A, hz, bottom, t, aimX } = c;
    const pan = -aimX * A.w * 0.03;
    const skyH = hz - A.y;
    ctx.fillStyle = vgrad(ctx, A.y, hz, [[0, LK.skyTop], [0.7, mix(LK.skyTop, LK.skyLow, 0.7)], [1, LK.skyLow]]);
    ctx.fillRect(A.x - 20, A.y, A.w + 40, skyH + 2);
    for (let i = 0; i < 26; i++) {      // first stars
      const sx = A.x + hash(i * 3 + 1) * A.w, sy = A.y + hash(i * 5 + 2) * skyH * 0.55;
      ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.4 * Math.abs(Math.sin(t * 1.3 + i))})`; ctx.fillRect(sx, sy, 1.6, 1.6);
    }
    // adobe walls with warm arches, a bell gable and a jacaranda
    const hh = skyH * 0.5;
    ctx.fillStyle = mix('#5a2a3a', LK.skyLow, 0.25); ell(ctx, A.x + A.w * 0.5, hz - hh, A.w * 0.7, hh * 0.25); ctx.fill();
    house(ctx, A.x - 10 + pan, A.w * 0.46, hz, hh, t, 3);
    house(ctx, A.x + A.w * 0.52 + pan, A.w * 0.5, hz, hh * 0.82, t, 3);
    ctx.fillStyle = dark(wallCol, 0.1); ctx.fillRect(A.x + A.w * 0.46 + pan, hz - hh * 1.35, A.w * 0.08, hh * 1.35);     // bell gable
    ctx.fillStyle = '#4a2418'; ctx.beginPath(); ctx.moveTo(A.x + A.w * 0.46 + pan, hz - hh * 1.35); ctx.lineTo(A.x + A.w * 0.5 + pan, hz - hh * 1.6); ctx.lineTo(A.x + A.w * 0.54 + pan, hz - hh * 1.35); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#26110c'; ctx.beginPath(); ctx.arc(A.x + A.w * 0.5 + pan, hz - hh * 1.12, A.w * 0.018, Math.PI, 0); ctx.fillRect(A.x + A.w * 0.5 + pan - A.w * 0.018, hz - hh * 1.12, A.w * 0.036, hh * 0.16); ctx.fill();
    const tx = A.x + A.w * 0.9 + pan * 1.4;
    ctx.fillStyle = '#4a3220'; ctx.fillRect(tx - 3, hz - hh * 0.9, 6, hh * 0.9);
    ctx.fillStyle = '#a56ee0'; for (const [dx, dy, r] of [[0, -hh * 1.0, 20], [-16, -hh * 0.88, 16], [17, -hh * 0.86, 17], [4, -hh * 1.15, 14]]) { ctx.beginPath(); ctx.arc(tx + dx, hz + dy, r, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(tx - 14 + hash(i) * 30, hz - hh * (0.8 + hash(i + 4) * 0.4), 3, 0, TAU); ctx.fill(); }
    // paving: terracotta flags in perspective, a dark gutter at the wall foot
    ctx.fillStyle = vgrad(ctx, hz, bottom + 40, [[0, mix('#c97a4a', LK.skyLow, 0.2)], [0.25, '#b86a3e'], [1, '#6a3420']]);
    ctx.fillRect(A.x - 20, hz, A.w + 40, bottom - hz + 40);
    ctx.strokeStyle = 'rgba(60,20,10,0.35)'; ctx.lineWidth = 1.2;
    for (let i = 1; i <= 9; i++) { const y = hz + (bottom - hz) * Math.pow(i / 9, 1.8); ctx.beginPath(); ctx.moveTo(A.x - 20, y); ctx.lineTo(A.x + A.w + 20, y); ctx.stroke(); }
    ctx.beginPath(); for (let j = -9; j <= 9; j++) { ctx.moveTo(A.x + A.w / 2 + j * 7, hz); ctx.lineTo(A.x + A.w / 2 + j * A.w * 0.12, bottom + 40); } ctx.stroke();
    // spilled confetti on the stones
    for (let i = 0; i < 40; i++) { const u = Math.pow(hash(i * 3 + 7), 1.6); const y = hz + u * (bottom - hz), x = A.x + hash(i * 5 + 1) * A.w; ctx.fillStyle = CANDY[i % CANDY.length]; ctx.globalAlpha = 0.55; ctx.fillRect(x, y, 2 + u * 4, 1.5 + u * 2); }
    ctx.globalAlpha = 1;
    // papel picado: cut-paper flags on three swaying strings, string lights below
    const strings = [[A.y + A.h * 0.035, 12, 17], [A.y + A.h * 0.1, 18, 15], [A.y + A.h * 0.17, 10, 19]];
    strings.forEach(([y0, sag, n], k) => {
      ctx.strokeStyle = 'rgba(20,10,20,0.75)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(A.x - 10, y0 - sag * 0.2); ctx.quadraticCurveTo(A.x + A.w / 2, y0 + sag * 2, A.x + A.w + 10, y0 - sag * 0.2); ctx.stroke();
      for (let i = 0; i < n; i++) {
        const f = (i + 0.5) / n, x = A.x + A.w * f, y = y0 - sag * 0.2 + (sag * 2 + sag * 0.2) * 2 * f * (1 - f) * 0.5 * 2 / 1;
        const w = A.w / n * 0.78, h = w * 0.85, sw = Math.sin(t * 1.6 + i * 1.7 + k) * 0.12, col = CANDY[(i + k * 3) % CANDY.length];
        ctx.save(); ctx.translate(x, y); ctx.rotate(sw); ctx.fillStyle = col; ctx.globalAlpha = 0.92; ctx.fillRect(-w / 2, 0, w, h);
        ctx.fillStyle = 'rgba(30,10,40,0.38)';
        for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) { const dx = -w * 0.3 + a * w * 0.3, dy = h * 0.2 + b * h * 0.4; poly(ctx, [[dx, dy - h * 0.1], [dx + w * 0.08, dy], [dx, dy + h * 0.1], [dx - w * 0.08, dy]]); ctx.fill(); }
        ctx.fillStyle = col; for (let a = 0; a < 5; a++) { ctx.beginPath(); ctx.moveTo(-w / 2 + a * w / 5, h); ctx.lineTo(-w / 2 + (a + 0.5) * w / 5, h + h * 0.15); ctx.lineTo(-w / 2 + (a + 1) * w / 5, h); ctx.fill(); }
        ctx.globalAlpha = 1; ctx.restore();
      }
    });
    const ly = A.y + A.h * 0.28;
    ctx.strokeStyle = 'rgba(20,10,20,0.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(A.x, ly); ctx.quadraticCurveTo(A.x + A.w / 2, ly + A.h * 0.07, A.x + A.w, ly); ctx.stroke();
    for (let i = 0; i < 16; i++) {
      const f = (i + 0.5) / 16, x = A.x + A.w * f, y = ly + A.h * 0.07 * 2 * f * (1 - f) * 1.0 * 1.0 + 6;
      const gl = ctx.createRadialGradient(x, y, 1, x, y, 15); gl.addColorStop(0, 'rgba(255,225,140,0.85)'); gl.addColorStop(1, 'rgba(255,225,140,0)'); ctx.fillStyle = gl; ctx.fillRect(x - 15, y - 15, 30, 30);
      ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill();
    }
    // children at both edges, arms up, in paper hats
    const kids = [[0.05, 1.0, '#2a1a3a'], [0.14, 0.8, '#3a2548'], [0.91, 1.0, '#2a1a3a'], [0.83, 0.82, '#3a2548']];
    kids.forEach(([fx0, sc, col], i) => {
      const x = A.x + A.w * fx0, base = bottom - 6 - (1 - sc) * A.h * 0.1, hgt = A.h * 0.17 * sc;
      const bob = Math.abs(Math.sin(t * 5 + i * 1.9)) * hgt * 0.06;
      ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = 'round';
      rrect(ctx, x - hgt * 0.17, base - hgt * 0.62 - bob, hgt * 0.34, hgt * 0.62, hgt * 0.1); ctx.fill();
      ctx.beginPath(); ctx.arc(x, base - hgt * 0.72 - bob, hgt * 0.11, 0, TAU); ctx.fill();
      ctx.lineWidth = hgt * 0.07; const up = Math.sin(t * 6 + i) * 0.25;
      ctx.beginPath(); ctx.moveTo(x - hgt * 0.15, base - hgt * 0.55 - bob); ctx.lineTo(x - hgt * 0.3, base - hgt * (0.92 + up * 0.2) - bob); ctx.moveTo(x + hgt * 0.15, base - hgt * 0.55 - bob); ctx.lineTo(x + hgt * 0.3, base - hgt * (0.92 - up * 0.2) - bob); ctx.stroke();
      ctx.fillStyle = CANDY[(i * 2) % CANDY.length]; poly(ctx, [[x - hgt * 0.1, base - hgt * 0.8 - bob], [x + hgt * 0.1, base - hgt * 0.8 - bob], [x, base - hgt * 1.0 - bob]]); ctx.fill();
      ctx.lineCap = 'butt';
    });
    // the line the pinata hangs from, with its pulley and the person at the far end of the rope
    c.ropeY = A.y + A.h * 0.015;
  };

  // pinata drawn at (x, y) with outer radius R. Spiky cone fringes in crepe paper; hits tear cones away.
  function star(ctx, x, y, R, t, rot, torn) {
    const n = 7, rb = R * 0.52;
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < n; i++) {
      if (i < torn) continue;
      const a = -Math.PI / 2 + (i / n) * TAU + rot + Math.sin(t * 2 + i) * 0.02;
      if ((pass === 0) === (Math.cos(a - rot + Math.PI / 2) > 0.2)) continue;
      const col = CANDY[i % CANDY.length];
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      for (let j = 0; j < 4; j++) {
        const r0 = rb * 0.8 + (R - rb * 0.8) * (j / 4), r1 = rb * 0.8 + (R - rb * 0.8) * ((j + 1.35) / 4), w0 = R * 0.2 * (1 - j * 0.18), w1 = w0 * 0.82;
        ctx.fillStyle = j % 2 ? light(col, 0.3) : col;
        ctx.beginPath(); ctx.moveTo(r0, -w0); ctx.lineTo(r1, -w1);
        for (let k = 0; k < 5; k++) ctx.lineTo(r1 + (k % 2 ? R * 0.02 : R * 0.07), -w1 + (w1 * 2 * (k + 0.5)) / 5);
        ctx.lineTo(r1, w1); ctx.lineTo(r0, w0); ctx.closePath(); ctx.fill();
        const sh = ctx.createLinearGradient(0, -w0, 0, w0); sh.addColorStop(0, 'rgba(255,255,255,0.32)'); sh.addColorStop(0.45, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(10,0,30,0.38)');
        ctx.fillStyle = sh; ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1; ctx.stroke();
        // crepe-paper fringe ribs
        ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 1; k < 4; k++) { ctx.moveTo(r0 + (r1 - r0) * 0.15, -w0 + (w0 * 2 * k) / 4); ctx.lineTo(r1, -w1 + (w1 * 2 * k) / 4); } ctx.stroke();
      }
      const tip = ctx.createRadialGradient(R, 0, 0, R, 0, R * 0.12); tip.addColorStop(0, '#fff7c2'); tip.addColorStop(1, 'rgba(255,220,100,0)');
      ctx.fillStyle = tip; ctx.fillRect(R - R * 0.14, -R * 0.14, R * 0.28, R * 0.28);
      ctx.restore();
    }
    // body: a ball of paper bands with a star sticker
    const g = ctx.createRadialGradient(x - rb * 0.35, y - rb * 0.4, rb * 0.1, x, y, rb * 1.1); g.addColorStop(0, light('#ffd23f', 0.4)); g.addColorStop(0.6, '#f3a712'); g.addColorStop(1, dark('#d4571f', 0.3));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rb, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(190,40,70,0.75)'; ctx.lineWidth = rb * 0.14;
    for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.ellipse(x, y + k * rb * 0.45, rb * Math.sqrt(1 - Math.pow(k * 0.45, 2)) * 0.98, rb * 0.16, 0, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = '#fff7d6'; poly(ctx, Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i / 10) * TAU, rr = i % 2 ? rb * 0.2 : rb * 0.46; return [x + Math.cos(a) * rr, y + Math.sin(a) * rr]; })); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ell(ctx, x - rb * 0.35, y - rb * 0.45, rb * 0.28, rb * 0.14, -0.6); ctx.fill();
    const rim = ctx.createRadialGradient(x, y, rb * 0.6, x, y, rb); rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, 'rgba(40,0,20,0.45)');
    ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(x, y, rb, 0, TAU); ctx.fill();
  }

  const target = (ctx, g, c, o) => {
    const { pos, wob, h, baseY, i } = o, { A, t } = c;
    const { cx, cy, R } = pos;
    // ground shadow and the candies already spilled
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ell(ctx, cx + R * 0.25, baseY + 6, R * 0.95, R * 0.17); ctx.fill();
    for (const cd of candies) { const px = c.sx(cd.x), py = baseY + 4 + cd.dy; ctx.fillStyle = cd.col; ell(ctx, px, py, 5, 3, cd.r); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(px - 2, py - 1.5, 2, 1); }
    // rope: up to a pulley on the festival line, then along it to the hand of the person pulling
    const ropeY = c.ropeY ?? A.y + 6;
    ctx.save();
    ctx.strokeStyle = '#e9d4a0'; ctx.lineWidth = 3; ctx.setLineDash([5, 3]);
    ctx.beginPath(); ctx.moveTo(cx, cy - R * 1.0); ctx.lineTo(cx, ropeY + 4); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, ropeY + 4); ctx.lineTo(A.x + A.w * 0.97, ropeY + 28 + Math.sin(t * 2.2) * 3); ctx.stroke();
    ctx.fillStyle = '#4a2f18'; ctx.beginPath(); ctx.arc(cx, ropeY + 4, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#d9b45a'; ctx.beginPath(); ctx.arc(cx, ropeY + 4, 2.4, 0, TAU); ctx.fill();
    ctx.restore();
    // swing about the pulley point
    const ang = (h ? h.amp * Math.sin(h.t * 20) * Math.exp(-h.t * 3.4) : 0) + wob * 0 + Math.sin(t * 2 + i) * 0.015;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang); ctx.translate(-cx, -cy);
    star(ctx, cx, cy, R * 1.12, t, Math.sin(t * 0.9) * 0.08, Math.min(hitsN, 4));
    // a white flash right after a hit
    if (h && h.t < 0.22) { ctx.fillStyle = `rgba(255,255,255,${0.55 * (1 - h.t / 0.22)})`; ctx.beginPath(); ctx.arc(cx, cy, R * 0.6, 0, TAU); ctx.fill(); }
    ctx.restore();
    return true;
  };

  const onShoot = (tone, fxs) => {
    void tone; void fxs; SOUND.pinataSwing(env.audio);
  };

  const onResolve = (info) => {
    const { points, p, tone, fxs, s } = info;
    if (points) {
      hitsN++;
      SOUND.pinataHit(env.audio, points, hitsN);
      fxs.shards(p.x, p.y, s * 0.045, CANDY, 12 + points * 4);
      fxs.sparks(p.x, p.y, s * 0.06, '#fff2a0', 6);
      fxs.kick(2 + points);
      for (let k = 0; k < 3 + points; k++) candies.push({ x: info.x + (hash(candies.length * 5 + k) - 0.5) * 0.7, dy: hash(candies.length * 3 + k) * 22, col: CANDY[(candies.length + k) % CANDY.length], r: hash(candies.length + k) * 3 });
    } else {
      SOUND.pinataMiss(env.audio);
      fxs.dust(p.x, p.y, s * 0.04, 'rgba(255,230,240,0.5)', 4);
      fxs.kick(1);
    }
    return true;
  };

  // the cursor is the stick itself: its tip is the true point of impact
  const tool = (ctx, g, c, o) => {
    const { A, bottom, cx } = c;
    const grip = { x: cx + A.w * 0.3, y: bottom + 8 };
    const skin = '#e0a878', cuff = '#c8453a';
    let tip, stretch = 1;
    if (o.flight) tip = { x: grip.x + (o.flight.tx - grip.x) * (0.25 + 0.75 * o.flight.e), y: grip.y + (o.flight.ty - grip.y) * (0.25 + 0.75 * o.flight.e) - Math.sin(Math.PI * o.flight.u) * A.h * 0.12 };
    else if (o.cross) tip = o.cross;
    else tip = { x: cx + A.w * 0.2, y: bottom - A.h * 0.26 };
    const cols = [LK.guide === '#ffd24a' ? '#e63946' : '#e63946', '#f7f1df'];
    stick(ctx, grip.x + 14, grip.y + 24, tip.x, tip.y, 15, 7, cols, 10);
    // tied ribbons at the knob, hands
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(grip.x + 14, grip.y + 24); ctx.quadraticCurveTo(grip.x + 30, grip.y + 36 + Math.sin(c.t * 4) * 4, grip.x + 20, grip.y + 52); ctx.stroke();
    fist(ctx, grip.x, grip.y, 14, skin, cuff);
    const mx = grip.x + (tip.x - grip.x) * 0.3, my = grip.y + (tip.y - grip.y) * 0.3;
    fist(ctx, mx, my, 12, skin, cuff);
    if (o.cross && !o.flight) {
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(tip.x, tip.y, 13, 0, TAU); ctx.stroke();
      ctx.strokeStyle = o.drawLevel >= 1 ? LK.good : LK.guide; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(tip.x, tip.y, 13, 0, TAU); ctx.stroke();
      ctx.fillStyle = o.drawLevel >= 1 ? LK.good : LK.guide; ctx.beginPath(); ctx.arc(tip.x, tip.y, 3, 0, TAU); ctx.fill();
    }
    void stretch;
  };

  return {
    id: 'pinata', reset, backdrop, target, tool, onShoot, onResolve, hideMissile: true,
    labels: { draw: 'Winding up', full: 'Swing now: release', shots: 'sticks' },
    hint: 'Hold to wind the stick back, watch its tip drift with your hand, and release when the tip is on the swinging pinata.',
    hudIcon: (ctx, x, y, filled) => { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.7); ctx.fillStyle = filled ? '#e63946' : 'rgba(255,255,255,0.2)'; rrect(ctx, -9, -2.5, 18, 5, 2.5); ctx.fill(); ctx.fillStyle = filled ? '#f7f1df' : 'rgba(255,255,255,0.12)'; ctx.fillRect(-3, -2.5, 3, 5); ctx.fillRect(4, -2.5, 3, 5); ctx.restore(); },
  };
}

// ====================================================================================================================
// ALKA: ring tilting down a town street
// ====================================================================================================================
function alkaScene(P, env, fx) {
  const LK = P.look;
  let ringsOn = 0, lastHit = null;
  const reset = () => { ringsOn = 0; lastHit = null; };

  const backdrop = (ctx, c) => {
    const { A, hz, bottom, t, aimX, baseY } = c;
    const vpX = A.x + A.w / 2 - aimX * A.w * 0.02;
    const skyH = hz - A.y;
    ctx.fillStyle = vgrad(ctx, A.y, hz, [[0, LK.skyTop], [1, LK.skyLow]]); ctx.fillRect(A.x - 20, A.y, A.w + 40, skyH + 2);
    // distant mountains and a bell tower at the end of the street
    for (let l = 0; l < 2; l++) {
      ctx.fillStyle = mix(l ? '#6f8aa8' : '#9ab0c8', LK.skyLow, 0.35 + l * 0.0);
      ctx.beginPath(); ctx.moveTo(A.x - 20, hz);
      for (let i = 0; i <= 16; i++) ctx.lineTo(A.x - 20 + (A.w + 40) * i / 16, hz - skyH * (0.12 + 0.26 * (l ? hash(i + 3) : hash(i + 40)) * (1 - Math.abs(i - 8) / 14)));
      ctx.lineTo(A.x + A.w + 20, hz); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#d8cdb4'; ctx.fillRect(vpX - 9, hz - skyH * 0.42, 18, skyH * 0.42);
    ctx.fillStyle = '#9a3a28'; poly(ctx, [[vpX - 12, hz - skyH * 0.42], [vpX + 12, hz - skyH * 0.42], [vpX, hz - skyH * 0.58]]); ctx.fill();
    ctx.fillStyle = '#4a3a2a'; ctx.beginPath(); ctx.arc(vpX, hz - skyH * 0.35, 4, Math.PI, 0); ctx.fill();
    // ground first: packed earth lane, a trampled middle
    ctx.fillStyle = vgrad(ctx, hz, bottom + 40, [[0, '#d8c8a2'], [0.3, '#c8b088'], [1, '#8f7550']]); ctx.fillRect(A.x - 20, hz, A.w + 40, bottom - hz + 40);
    const dT = (bottom - hz) / Math.max(10, baseY - hz);
    const px = (X, d) => vpX + X * A.w * 0.5 / d, py = (Y, d) => hz + Y * (bottom - hz) / d;   // X side offset, Y below the eye (positive = ground)
    // lane, rails and spectators drawn in perspective segments, far to near
    const segs = []; for (let d = dT * 2.4; d > 1.02; d /= 1.28) segs.push(d);
    const wallX = 1.5, railX = 0.62, houseH = 1.45;
    // street gutters
    ctx.fillStyle = 'rgba(70,50,25,0.25)'; poly(ctx, [[px(-0.4, dT * 2.4), py(1, dT * 2.4)], [px(0.4, dT * 2.4), py(1, dT * 2.4)], [px(0.55, 1), py(1, 1)], [px(-0.55, 1), py(1, 1)]]); ctx.fill();
    segs.forEach((d, k) => {
      const d2 = d / 1.28 < 1 ? 1 : d / 1.28;
      for (const side of [-1, 1]) {
        // house front (side wall) between depths d and d2
        const cols = ['#e8dcc0', '#d9b98a', '#efe6cf', '#cfa97a'], wc = cols[(k * 2 + (side > 0 ? 1 : 0)) % 4];
        const q = [[px(side * wallX, d), py(-houseH, d)], [px(side * wallX, d2), py(-houseH, d2)], [px(side * wallX, d2), py(1, d2)], [px(side * wallX, d), py(1, d)]];
        ctx.fillStyle = vgrad(ctx, q[0][1], q[3][1], [[0, light(wc, 0.1)], [1, dark(wc, 0.25)]]); poly(ctx, q); ctx.fill();
        // red tile roof edge above
        ctx.fillStyle = '#a8412a'; poly(ctx, [[q[0][0], q[0][1]], [q[1][0], q[1][1]], [q[1][0] + side * 6, q[1][1] - 12 * (1 / d2) - 3], [q[0][0] + side * 6, q[0][1] - 12 * (1 / d) - 3]]); ctx.fill();
        // windows with shutters: two columns, two storeys
        for (const f of [0.5]) for (const lv of [-1.0, 0.0]) {
          const dm = d + (d2 - d) * f, w0 = 0.12 / dm * A.w * 0.5 * 0.0;
          const x = px(side * wallX, dm), y0 = py(lv, dm), y1 = py(lv + 0.62, dm), wd = (A.w * 0.5 * 0.2) / dm * 0.55 * side;
          ctx.fillStyle = '#5a6f80'; ctx.fillRect(Math.min(x, x + wd), y0, Math.abs(wd), y1 - y0);
          ctx.fillStyle = '#3f7a56'; ctx.fillRect(Math.min(x, x + wd) - 3, y0, 3, y1 - y0);
          void w0;
        }
      }
      // fence posts and rails (white) along the lane on both sides
      for (const side of [-1, 1]) {
        const x = px(side * railX, d), yb = py(1, d), yt = py(0.55, d);
        ctx.fillStyle = '#f2ecdc'; ctx.fillRect(x - 2 / d - 1, yt, 3 / d + 1.5, yb - yt);
        if (d2 > 1) { const xn = px(side * railX, d2), yn = py(0.62, d2), yo = py(0.62, d); ctx.strokeStyle = '#f2ecdc'; ctx.lineWidth = 2 / d2 + 1; ctx.beginPath(); ctx.moveTo(x, yo); ctx.lineTo(xn, yn); ctx.stroke(); }
      }
      // spectators behind the rails, a head and a coloured shirt each
      for (const side of [-1, 1]) for (let r = 0; r < 2; r++) {
        const dm = (d + d2) / 2, x = px(side * (railX + 0.14 + r * 0.16), dm), yb = py(0.6 - r * 0.0, dm), sz = 11 / dm + 2;
        const sway = Math.sin(t * 4 + k * 2 + side + r) * sz * 0.08;
        ctx.fillStyle = ['#c8452d', '#f3ead2', '#2d6bb0', '#e0a82e', '#4a7a4a'][(k + r + (side > 0 ? 2 : 0)) % 5]; rrect(ctx, x - sz * 0.7, yb - sz * 1.6 + sway, sz * 1.4, sz * 1.7, sz * 0.4); ctx.fill();
        ctx.fillStyle = ['#e9bf94', '#c99366', '#8a5a3a'][(k + r) % 3]; ctx.beginPath(); ctx.arc(x, yb - sz * 1.9 + sway, sz * 0.52, 0, TAU); ctx.fill();
      }
      // bunting across the street every third segment
      if (k % 3 === 1) {
        const x0 = px(-wallX, d), x1 = px(wallX, d), y = py(-houseH * 0.8, d);
        ctx.strokeStyle = 'rgba(40,30,20,0.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo(vpX, y + 22 / d, x1, y); ctx.stroke();
        for (let i = 0; i < 9; i++) { const f = (i + 0.5) / 9, x = x0 + (x1 - x0) * f, yy = y + 2 * (22 / d) * f * (1 - f) * 1.0 * 1.0; ctx.fillStyle = ['#c8452d', '#f3ead2', '#2d6bb0'][i % 3]; poly(ctx, [[x - 5 / d - 2, yy], [x + 5 / d + 2, yy], [x, yy + 9 / d + 3]]); ctx.fill(); }
      }
    });
    // lane edge lines to the target
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.setLineDash([10, 12]);
    ctx.beginPath(); ctx.moveTo(vpX, hz); ctx.lineTo(vpX, bottom + 30); ctx.stroke(); ctx.setLineDash([]);
    c.vpX = vpX;
  };

  // the alka: an iron wheel with spokes, a rim and a small central disc, hung under a crossbar between two posts
  function alka(ctx, x, y, R, t, spin, held) {
    const rOut = R, rMid = R * 0.6, rIn = R * 0.3;
    // spokes and plates behind
    ctx.strokeStyle = '#6a5a3a'; ctx.lineWidth = Math.max(2, R * 0.08);
    for (let i = 0; i < 6; i++) { const a = spin + (i / 6) * TAU; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * rIn, y + Math.sin(a) * rIn); ctx.lineTo(x + Math.cos(a) * rOut, y + Math.sin(a) * rOut); ctx.stroke(); }
    ringTorus(ctx, x, y, rOut, Math.max(3, R * 0.16), '#8a8f98', spin * 2);
    ringTorus(ctx, x, y, rMid, Math.max(2, R * 0.1), '#b8bcc4', spin);
    const g = ctx.createRadialGradient(x - rIn * 0.3, y - rIn * 0.3, 1, x, y, rIn); g.addColorStop(0, '#fff3c4'); g.addColorStop(0.7, '#d9a82e'); g.addColorStop(1, '#8a6a1c');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rIn, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(60,40,10,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(60,40,10,0.55)'; poly(ctx, Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i / 10) * TAU + spin, rr = i % 2 ? rIn * 0.25 : rIn * 0.65; return [x + Math.cos(a) * rr, y + Math.sin(a) * rr]; })); ctx.fill();
    void held; void t;
  }

  const target = (ctx, g, c, o) => {
    const { pos, h, baseY, rect, s } = o, { cx, cy, R } = pos, { A, t } = c;
    const L = c.sx(-0.62), Rr = c.sx(0.62), barY = c.sy(1.32);
    // two gantry posts with a crossbar, ground shadows and the hanging cord
    for (const px of [L, Rr]) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(ctx, px + 6, baseY + 4, 12, 4); ctx.fill();
      ctx.fillStyle = hgrad(ctx, px - 6, px + 6, [[0, light('#7a5230', 0.3)], [0.5, '#5a3a1e'], [1, dark('#3a2410', 0.2)]]); ctx.fillRect(px - 5, barY - 8, 10, baseY - barY + 8);
      ctx.fillStyle = '#c8452d'; ctx.fillRect(px - 6, barY + 20, 12, 5); ctx.fillStyle = '#f3ead2'; ctx.fillRect(px - 6, barY + 25, 12, 5);
    }
    ctx.fillStyle = '#4a2f18'; ctx.fillRect(L - 8, barY - 10, Rr - L + 16, 9);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(L - 8, barY - 10, Rr - L + 16, 2);
    // tassels and pennants on the crossbar
    for (let i = 0; i < 5; i++) { const x = L + (Rr - L) * (i + 0.5) / 5; ctx.fillStyle = ['#c8452d', '#f3ead2', '#2d6bb0'][i % 3]; poly(ctx, [[x - 6, barY - 1], [x + 6, barY - 1], [x + Math.sin(t * 3 + i) * 2, barY + 16]]); ctx.fill(); }
    // the cord from the bar to the wheel, which is empty for a while after a clean take
    const ang = h ? h.amp * Math.sin(h.t * 20) * Math.exp(-h.t * 3.4) : 0;
    const taken = lastHit && lastHit.t < 1.1;
    ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx - ang * (cy - barY), barY); ctx.lineTo(cx, cy - R); ctx.stroke();
    if (!taken) alka(ctx, cx, cy, R, t, Math.sin(t * 1.1) * 0.12 + ang, false);
    else { ctx.fillStyle = '#2a1a0c'; ctx.beginPath(); ctx.arc(cx, cy - R, 3, 0, TAU); ctx.fill(); }
    // wobbling after a hit: a small hook glints where the ring hung
    if (lastHit) lastHit.t += 0;
    void rect; void s; void A; void i0;
    return true;
  };
  const i0 = 0;

  const onShoot = (tone, fxs) => {
    void tone; void fxs; SOUND.alkaShoot(env.audio);
  };

  const onResolve = (info) => {
    const { points, p, tone, fxs, s } = info;
    if (points) {
      ringsOn++; lastHit = { t: 0, x: info.x, y: info.y };
      SOUND.alkaHit(env.audio, points);
      fxs.sparks(p.x, p.y, s * 0.06, '#ffe9a0', 9 + points * 3);
      fxs.ring(p.x, p.y, s * 0.12, s * 0.12, 'rgba(255,240,180,0.9)', 0.5, 3);
      fxs.kick(1.5 + points);
    } else {
      SOUND.alkaMiss(env.audio);
      fxs.dust(p.x, p.y, s * 0.04, 'rgba(235,215,170,0.6)', 5);
      fxs.kick(1);
    }
    return true;
  };

  const tool = (ctx, g, c, o) => {
    const { A, bottom, cx, t } = c;
    const grip = { x: cx + A.w * 0.34, y: bottom + 2 };
    let tip;
    if (o.flight) tip = { x: grip.x + (o.flight.tx - grip.x) * (0.2 + 0.8 * o.flight.e), y: grip.y + (o.flight.ty - grip.y) * (0.2 + 0.8 * o.flight.e) };
    else if (o.cross) tip = o.cross;
    else tip = { x: cx + A.w * 0.18, y: bottom - A.h * 0.3 };
    // horse: ears, mane and a red browband at the foot of the view
    const hx = cx - A.w * 0.12, hy = bottom + 6;
    ctx.fillStyle = hgrad(ctx, hx - 60, hx + 60, [[0, '#4a2a1a'], [0.5, '#7a4528'], [1, '#3a2012']]);
    ctx.beginPath(); ctx.moveTo(hx - 70, hy); ctx.quadraticCurveTo(hx - 56, hy - A.h * 0.09, hx - 36, hy - A.h * 0.08); ctx.quadraticCurveTo(hx, hy - A.h * 0.1, hx + 36, hy - A.h * 0.08); ctx.quadraticCurveTo(hx + 56, hy - A.h * 0.09, hx + 70, hy); ctx.closePath(); ctx.fill();
    for (const sx of [-1, 1]) {
      const ex = hx + sx * 30, tw = Math.sin(t * 6 + sx) * 1.5;
      ctx.fillStyle = '#5a321c'; poly(ctx, [[ex - 11, hy - A.h * 0.075], [ex + 11, hy - A.h * 0.075], [ex + sx * 3 + tw, hy - A.h * 0.17]]); ctx.fill();
      ctx.fillStyle = '#c9926a'; poly(ctx, [[ex - 5, hy - A.h * 0.08], [ex + 5, hy - A.h * 0.08], [ex + sx * 2 + tw, hy - A.h * 0.145]]); ctx.fill();
    }
    ctx.fillStyle = '#c8452d'; ctx.fillRect(hx - 44, hy - A.h * 0.062, 88, 7); ctx.fillStyle = '#e0a82e'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(hx - 36 + i * 14.4, hy - A.h * 0.0585, 2.3, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#1e120a'; ctx.lineWidth = 3; ctx.beginPath(); for (let i = -6; i <= 6; i++) { ctx.moveTo(hx + i * 8, hy - A.h * 0.08); ctx.lineTo(hx + i * 8 + Math.sin(t * 5 + i) * 3, hy - A.h * 0.115); } ctx.stroke();
    // the lance: spiral red and white, a leaf head, a vamplate guard, a pennant that streams
    const dx = tip.x - grip.x, dy = tip.y - grip.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, ext = Math.min(L * 0.12, 24);
    const bx = grip.x - ux * 46, by = grip.y - uy * 46 + 8;
    stick(ctx, bx, by, tip.x + ux * ext, tip.y + uy * ext, 11, 5, ['#c8452d', '#f3ead2'], 14);
    // rings strung on the shaft from earlier takes
    for (let r = 0; r < Math.min(ringsOn, 5); r++) { const f = 0.78 - r * 0.07; ringTorus(ctx, tip.x + (grip.x - tip.x) * (1 - f) * 0.0 + (tip.x - grip.x) * (f - 1) * 0.0 + dx * (f - 1) * 0.5 + 0, tip.y + dy * (f - 1) * 0.5, 7, 2.5, '#9aa0aa', 0); }
    ctx.fillStyle = '#c9ced6'; poly(ctx, [[tip.x + ux * ext - uy * 5, tip.y + uy * ext + ux * 5], [tip.x + ux * (ext + 24), tip.y + uy * (ext + 24)], [tip.x + ux * ext + uy * 5, tip.y + uy * ext - ux * 5]]); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tip.x + ux * ext, tip.y + uy * ext); ctx.lineTo(tip.x + ux * (ext + 24), tip.y + uy * (ext + 24)); ctx.stroke();
    const px = tip.x - ux * 28, py = tip.y - uy * 28;
    ctx.fillStyle = '#2d6bb0'; ctx.beginPath(); ctx.moveTo(px, py); for (let i = 1; i <= 6; i++) ctx.lineTo(px - ux * i * 6 + Math.sin(t * 9 - i) * 3 * i / 6 * -uy * 0 - uy * Math.sin(t * 9 - i) * 3, py - uy * i * 6 + ux * Math.sin(t * 9 - i) * 3); ctx.lineTo(px - ux * 36 - uy * 10, py - uy * 36 + ux * 10); ctx.lineTo(px - uy * 9, py + ux * 9); ctx.closePath(); ctx.fill();
    fist(ctx, grip.x, grip.y, 15, '#d9a679', '#2d6bb0');
    if (o.cross && !o.flight) {
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(o.cross.x, o.cross.y, 12, 0, TAU); ctx.stroke();
      ctx.strokeStyle = LK.guide; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(o.cross.x, o.cross.y, 12, 0, TAU); ctx.stroke();
      ctx.fillStyle = LK.guide; ctx.beginPath(); ctx.arc(o.cross.x, o.cross.y, 2.6, 0, TAU); ctx.fill();
    }
    if (lastHit && lastHit.t < 1.1) {
      // the ring rides the lance point for a moment
      const sp = lastHit.t * 6;
      ringTorus(ctx, tip.x + ux * (ext + 14), tip.y + uy * (ext + 14), 18, 4, '#aeb4be', sp);
    }
  };

  const tickHit = (dt) => { if (lastHit) lastHit.t += dt; };

  return {
    id: 'alka', reset, backdrop, target, tool, onShoot, onResolve, tickHit, hideMissile: true,
    labels: { draw: 'Couching the lance', full: 'Charge: release', shots: 'runs' },
    hint: 'Press to level the lance, let its point settle on the ring, and release as the ring swings through the centre.',
    hudIcon: (ctx, x, y, filled) => { ctx.strokeStyle = filled ? '#c9ced6' : 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.stroke(); },
  };
}

// ====================================================================================================================
// STEPPE: galloping past targets
// ====================================================================================================================
function steppeScene(P, env, fx) {
  const LK = P.look;
  let drawn = 0;
  const reset = () => { drawn = 0; };

  const gerTent = (ctx, x, y, w, t) => {
    const h = w * 0.55;
    ctx.fillStyle = vgrad(ctx, y - h, y, [[0, '#fbf6e6'], [1, '#d8cfb4']]); rrect(ctx, x - w / 2, y - h * 0.7, w, h * 0.7, 2); ctx.fill();
    ctx.fillStyle = '#e8dfc4'; ctx.beginPath(); ctx.ellipse(x, y - h * 0.7, w / 2, h * 0.42, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = '#7a5a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - w / 2, y - h * 0.55); ctx.lineTo(x + w / 2, y - h * 0.55); ctx.stroke();
    ctx.fillStyle = '#2d6bb0'; ctx.fillRect(x - w * 0.5, y - h * 0.58, w, 3);
    ctx.fillStyle = '#c8452d'; rrect(ctx, x - w * 0.09, y - h * 0.5, w * 0.18, h * 0.5, 2); ctx.fill();
    ctx.fillStyle = '#4a3a2a'; ctx.fillRect(x - 1, y - h * 1.15, 2, h * 0.2);
    void t;
  };

  const backdrop = (ctx, c) => {
    const { A, hz, bottom, t, aimX, baseY } = c;
    const skyH = hz - A.y, pan = -aimX * A.w * 0.03;
    ctx.fillStyle = vgrad(ctx, A.y, hz, [[0, LK.skyTop], [1, LK.skyLow]]); ctx.fillRect(A.x - 20, A.y, A.w + 40, skyH + 2);
    const sg = ctx.createRadialGradient(A.x + A.w * 0.78, A.y + skyH * 0.32, 4, A.x + A.w * 0.78, A.y + skyH * 0.32, skyH * 0.8); sg.addColorStop(0, 'rgba(255,248,214,0.95)'); sg.addColorStop(0.15, 'rgba(255,238,180,0.4)'); sg.addColorStop(1, 'rgba(255,238,180,0)');
    ctx.fillStyle = sg; ctx.fillRect(A.x - 20, A.y, A.w + 40, skyH);
    // snowy range (slow) and rolling hills
    ctx.fillStyle = mix('#8b95b8', LK.skyLow, 0.35);
    ctx.beginPath(); ctx.moveTo(A.x - 20, hz); for (let i = 0; i <= 14; i++) { const x = A.x - 20 + (A.w + 40) * i / 14 + pan * 0.4; ctx.lineTo(x, hz - skyH * (0.15 + 0.4 * hash(i + 21) * (i % 2 ? 1 : 0.5))); } ctx.lineTo(A.x + A.w + 20, hz); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 1; i < 14; i += 2) { const x = A.x - 20 + (A.w + 40) * i / 14 + pan * 0.4, y = hz - skyH * (0.15 + 0.4 * hash(i + 21)); poly(ctx, [[x, y], [x - 16, y + skyH * 0.09], [x - 5, y + skyH * 0.07], [x + 4, y + skyH * 0.1], [x + 17, y + skyH * 0.08]]); ctx.fill(); }
    ctx.fillStyle = mix(LK.hills, LK.skyLow, 0.35);
    ctx.beginPath(); ctx.moveTo(A.x - 20, hz); for (let i = 0; i <= 22; i++) ctx.lineTo(A.x - 20 + (A.w + 40) * i / 22 + pan * 0.7, hz - skyH * (0.06 + 0.06 * Math.sin(i * 0.8) + 0.03 * Math.sin(i * 2.1))); ctx.lineTo(A.x + A.w + 20, hz); ctx.closePath(); ctx.fill();
    // felt tents far off, a pennant line
    gerTent(ctx, A.x + A.w * 0.2 + pan, hz + 1, A.w * 0.13, t);
    gerTent(ctx, A.x + A.w * 0.3 + pan, hz + 2, A.w * 0.09, t);
    gerTent(ctx, A.x + A.w * 0.82 + pan, hz + 2, A.w * 0.11, t);
    // plain: grass with a pale dirt course; parallax speed streaks and tufts rush past (gallop)
    const gnd = LK.lane || '#a9844d';
    ctx.fillStyle = vgrad(ctx, hz, bottom + 40, [[0, mix('#9aa862', LK.skyLow, 0.4)], [0.35, '#7d9a4a'], [1, '#4f6b2c']]); ctx.fillRect(A.x - 20, hz, A.w + 40, bottom - hz + 40);
    const tr0 = hz + (baseY - hz) * 0.6;
    ctx.fillStyle = vgrad(ctx, tr0, bottom + 40, [[0, mix(gnd, '#d8c08a', 0.4)], [1, dark(gnd, 0.25)]]);
    ctx.beginPath(); ctx.moveTo(A.x - 20, tr0 + (bottom - tr0) * 0.18); ctx.lineTo(A.x + A.w + 20, tr0 + (bottom - tr0) * 0.18); ctx.lineTo(A.x + A.w + 20, bottom + 40); ctx.lineTo(A.x - 20, bottom + 40); ctx.closePath(); ctx.fill();
    // overhanging branches in the foreground: the lane runs under old trees; leaves in three shades, a gnarled bough,
    // sun shafts falling through and a darker edge at the top of the frame
    {
      const topH = skyH * 0.2;
      const shaft = (x0, w0, a0) => { const gs = ctx.createLinearGradient(x0, A.y, x0 + w0 * 0.6, A.y + skyH * 0.9); gs.addColorStop(0, `rgba(255,236,170,${a0})`); gs.addColorStop(1, 'rgba(255,236,170,0)'); ctx.fillStyle = gs; poly(ctx, [[x0, A.y], [x0 + w0, A.y], [x0 + w0 * 1.9, A.y + skyH * 0.95], [x0 + w0 * 0.7, A.y + skyH * 0.95]]); ctx.fill(); };
      shaft(A.x + A.w * 0.18, A.w * 0.06, 0.16); shaft(A.x + A.w * 0.5, A.w * 0.09, 0.12); shaft(A.x + A.w * 0.78, A.w * 0.05, 0.14);
      ctx.fillStyle = 'rgba(18,30,12,0.97)'; ctx.fillRect(A.x - 10, A.y, A.w + 20, topH * 0.6);
      const shades = ['rgba(26,44,16,0.97)', 'rgba(38,62,24,0.97)', 'rgba(52,82,30,0.97)', 'rgba(70,104,38,0.95)'];
      for (let layer = 0; layer < 3; layer++) {
        const n = 14 + layer * 4;
        for (let i = 0; i < n; i++) {
          const x = A.x + A.w * ((i + 0.3 + 0.6 * hash(i * 3 + layer * 31)) / n) + Math.sin(t * (0.6 + layer * 0.15) + i) * (2 + layer);
          const r = skyH * (0.05 + 0.06 * hash(i + 60 + layer * 9)) * (1 + layer * 0.15), y = A.y + topH * (0.55 + layer * 0.22) + hash(i + 80 + layer) * topH * 0.25;
          ctx.fillStyle = shades[(i + layer) % 3]; ctx.beginPath(); ctx.ellipse(x, y, r * 1.2, r, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = shades[3]; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.ellipse(x - r * 0.3, y - r * 0.35, r * 0.55, r * 0.35, -0.4, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
        }
      }
      // gnarled bough with bark shading running in from the left edge
      const by = A.y + topH * 0.35;
      ctx.fillStyle = vgrad(ctx, by - 10, by + 14, [[0, '#6a4a2a'], [0.5, '#3e2a16'], [1, '#1c1208']]);
      ctx.beginPath(); ctx.moveTo(A.x - 10, by - 14); ctx.quadraticCurveTo(A.x + A.w * 0.3, by + 4, A.x + A.w * 0.66, by - 4); ctx.lineTo(A.x + A.w * 0.66, by + 3); ctx.quadraticCurveTo(A.x + A.w * 0.3, by + 14, A.x - 10, by + 16); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(40,64,22,0.95)'; for (let i = 0; i < 7; i++) { const x = A.x + A.w * (0.08 + i * 0.09), y = by + 8 + (i % 2) * 6; ctx.beginPath(); ctx.ellipse(x, y, 9, 5, 0.4 + i * 0.2, 0, TAU); ctx.fill(); }
    }
    // course rope with posts along the track edge
    const ry = tr0 + (bottom - tr0) * 0.18;
    ctx.strokeStyle = '#efe6cc'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(A.x - 20, ry - 8); ctx.lineTo(A.x + A.w + 20, ry - 8); ctx.stroke();
    const sp = 90, off = (t * sp) % 46;
    for (let x = A.x - 60 + off; x < A.x + A.w + 40; x += 46) { ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 2, ry - 22, 4, 24); ctx.fillStyle = '#c8452d'; ctx.fillRect(x - 2, ry - 22, 4, 5); }
    // near tufts and dust streaks: they stream past fast
    for (let i = 0; i < 26; i++) {
      const depth = hash(i * 7 + 1), y = ry + 8 + depth * (bottom - ry - 12), speed = 120 + depth * 420, w = 6 + depth * 26;
      const x = A.x + (((hash(i * 3 + 2) * (A.w + 120) + t * speed) % (A.w + 120)) - 60);
      ctx.strokeStyle = `rgba(255,248,220,${0.10 + depth * 0.18})`; ctx.lineWidth = 1 + depth * 2; ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x, y); ctx.stroke();
      if (i % 3 === 0) { ctx.strokeStyle = `rgba(60,80,30,${0.4 + depth * 0.3})`; ctx.lineWidth = 1.5; ctx.beginPath(); for (let k = -1; k <= 1; k++) { ctx.moveTo(x + k * 2, y); ctx.lineTo(x + k * 5, y - 5 - depth * 8); } ctx.stroke(); }
    }
  };

  // a square hide target in a wooden frame on a stake, with a straw backing and a pennant
  const target = (ctx, g, c, o) => {
    const { pos, h, baseY, i } = o, { cx, cy, R } = pos, { t } = c;
    const wob = h ? h.amp * Math.sin(h.t * 22) * Math.exp(-h.t * 4.2) : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(ctx, cx + R * 0.3, baseY + 3, R * 0.9, R * 0.15); ctx.fill();
    ctx.save(); ctx.translate(cx, baseY); ctx.rotate(wob * 0.5); ctx.translate(-cx, -baseY);
    const pw = Math.max(4, R * 0.12);
    ctx.fillStyle = hgrad(ctx, cx - pw, cx + pw, [[0, light('#7a5230', 0.25)], [0.5, '#5a3a1e'], [1, '#2e1c0e']]); ctx.fillRect(cx - pw / 2, cy, pw, baseY - cy);
    // pennant
    ctx.fillStyle = '#2d6bb0'; ctx.beginPath(); ctx.moveTo(cx + pw / 2, cy - R * 1.12); for (let k = 0; k <= 6; k++) ctx.lineTo(cx + pw / 2 + (k / 6) * R * 0.9, cy - R * 1.12 + Math.sin(t * 8 - k + i) * 3 + k * 1.2); ctx.lineTo(cx + pw / 2 + R * 0.85, cy - R * 0.92); ctx.lineTo(cx + pw / 2, cy - R * 0.95); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#4a3220'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + pw / 2, cy - R * 1.2); ctx.lineTo(cx + pw / 2, cy - R * 0.9); ctx.stroke();
    ctx.translate(cx, cy); ctx.rotate(wob);
    // straw backing shows at the corners, then the hide face
    const q = R * 1.18;
    ctx.fillStyle = '#c9a85a'; rrect(ctx, -q - 4, -q - 4, (q + 4) * 2, (q + 4) * 2, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(90,60,20,0.5)'; ctx.lineWidth = 1; for (let k = -4; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(-q - 3, k * q * 0.24); ctx.lineTo(q + 3, k * q * 0.24 + 3); ctx.stroke(); }
    ctx.fillStyle = hgrad(ctx, -q, q, [[0, '#f3e6c4'], [1, '#d7c293']]); rrect(ctx, -q, -q, q * 2, q * 2, 4); ctx.fill();
    ctx.strokeStyle = '#4a3220'; ctx.lineWidth = Math.max(3, R * 0.1); ctx.stroke();
    [...o.it.bands].reverse().forEach((b, k, arr) => {
      const col = LK.ringColors[(arr.length - 1 - k) % LK.ringColors.length], rr = b.r * c.s;
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(40,24,12,0.65)'; ctx.lineWidth = 1.5; ctx.stroke();
    });
    ctx.fillStyle = 'rgba(40,24,12,0.8)'; for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.beginPath(); ctx.arc(sx * (q - 7), sy * (q - 7), 2.6, 0, TAU); ctx.fill(); }
    if (h && h.t < 0.25) { ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - h.t / 0.25)})`; ctx.fillRect(-q, -q, q * 2, q * 2); }
    // arrows stuck in the hide
    for (const st of o.stuck) {
      const px = st.rel.dx * c.s, py = -st.rel.dy * c.s, a = -2.5 - hash(st.rel.dx * 100) * 0.4;
      ctx.save(); ctx.translate(px, py); ctx.rotate(a); ctx.strokeStyle = '#5a3a1c'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-R * 0.9, 0); ctx.stroke();
      ctx.fillStyle = '#e8453a'; poly(ctx, [[-R * 0.9, 0], [-R * 0.75, -4], [-R * 0.55, 0], [-R * 0.75, 4]]); ctx.fill(); ctx.restore();
    }
    ctx.restore();
    return true;
  };

  const onShoot = (tone, fxs) => {
    void tone; void fxs; SOUND.archShoot(env.audio);
  };

  const onResolve = (info) => {
    const { points, p, tone, fxs, s } = info;
    if (points) {
      SOUND.archHit(env.audio, points);
      fxs.shards(p.x, p.y, s * 0.04, ['#f3e6c4', '#c9a85a', '#8a5a2a'], 8 + points * 2);
      fxs.sparks(p.x, p.y, s * 0.05, '#fff0b0', 5);
      fxs.kick(1.5 + points * 0.5);
    } else {
      SOUND.archMiss(env.audio);
      fxs.dust(p.x, p.y, s * 0.05, 'rgba(210,190,140,0.7)', 6);
      fxs.kick(1);
    }
    return true;
  };

  // composite recurve bow: limbs bend away from the target, the string draws back to the cheek as the draw fills
  const tool = (ctx, g, c, o) => {
    const { A, bottom, cx, t } = c;
    const grip = { x: cx + A.w * 0.28, y: bottom - A.h * 0.2 };
    let aim;
    if (o.flight) aim = { x: o.flight.tx, y: o.flight.ty };
    else if (o.cross) aim = o.cross;
    else aim = { x: cx - A.w * 0.1, y: bottom - A.h * 0.36 };
    const dx = aim.x - grip.x, dy = aim.y - grip.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const draw = o.flight ? 0.1 : o.drawLevel ?? 0;
    // the horse: a chestnut neck rising from the saddle, ears pricked, braided headstall, mane streaming back
    {
      const nk = Math.sin(t * 9) * A.h * 0.006, bx = A.x, by = bottom;
      const nw = A.w * 0.34, nh = A.h * 0.26;
      const hg = ctx.createLinearGradient(bx, by - nh, bx + nw, by);
      hg.addColorStop(0, '#b06a38'); hg.addColorStop(0.5, '#8a4a22'); hg.addColorStop(1, '#4a2410');
      ctx.fillStyle = hg; ctx.beginPath(); ctx.moveTo(bx - 10, by + 8);
      ctx.bezierCurveTo(bx + nw * 0.02, by - nh * 0.9 + nk, bx + nw * 0.1, by - nh * 1.0 + nk, bx + nw * 0.26, by - nh * 0.92 + nk);   // crest up to the poll
      ctx.bezierCurveTo(bx + nw * 0.4, by - nh * 0.6, bx + nw * 0.52, by - nh * 0.2, bx + nw * 0.62, by + 8);                             // throat down to the withers
      ctx.closePath(); ctx.fill();
      // muscle highlight and shadow under the jaw
      ctx.fillStyle = 'rgba(255,200,140,0.22)'; ctx.beginPath(); ctx.ellipse(bx + nw * 0.2, by - nh * 0.45, nw * 0.1, nh * 0.32, 0.5, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(20,8,0,0.28)'; ctx.beginPath(); ctx.ellipse(bx + nw * 0.42, by - nh * 0.18, nw * 0.12, nh * 0.2, 0.4, 0, TAU); ctx.fill();
      // head: a long chestnut shape with a pale blaze, eye and nostril, headstall straps
      const hx = bx + nw * 0.2, hy = by - nh * 0.98 + nk;
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(0.35);
      const hg2 = ctx.createLinearGradient(-nw * 0.1, -nh * 0.1, nw * 0.1, nh * 0.2); hg2.addColorStop(0, '#a45e30'); hg2.addColorStop(1, '#5a2e14');
      ctx.fillStyle = hg2; ctx.beginPath(); ctx.moveTo(-nw * 0.1, -nh * 0.06); ctx.quadraticCurveTo(nw * 0.12, -nh * 0.2, nw * 0.3, -nh * 0.02); ctx.quadraticCurveTo(nw * 0.34, nh * 0.08, nw * 0.28, nh * 0.12); ctx.quadraticCurveTo(nw * 0.1, nh * 0.18, -nw * 0.08, nh * 0.1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,240,220,0.5)'; ctx.beginPath(); ctx.ellipse(nw * 0.15, -nh * 0.08, nw * 0.12, nh * 0.025, 0.1, 0, TAU); ctx.fill();
      ctx.fillStyle = '#140a04'; ctx.beginPath(); ctx.ellipse(nw * 0.04, -nh * 0.04, nh * 0.022, nh * 0.016, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(nw * 0.035, -nh * 0.05, 2, 2);
      ctx.fillStyle = '#1e0e06'; ctx.beginPath(); ctx.ellipse(nw * 0.29, nh * 0.03, nh * 0.02, nh * 0.03, 0.3, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#7a1e18'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-nw * 0.05, -nh * 0.08); ctx.lineTo(nw * 0.08, nh * 0.14); ctx.moveTo(nw * 0.22, -nh * 0.1); ctx.lineTo(nw * 0.24, nh * 0.12); ctx.stroke();
      ctx.fillStyle = '#d8b04a'; ctx.beginPath(); ctx.arc(nw * 0.08, nh * 0.03, 3.5, 0, TAU); ctx.fill();
      // ears
      ctx.fillStyle = '#7a4020'; for (const [ex, er] of [[-nw * 0.07, -0.25], [nw * 0.0, 0.05]]) { ctx.save(); ctx.translate(ex, -nh * 0.07); ctx.rotate(er - 0.3); poly(ctx, [[-nh * 0.025, 0], [nh * 0.03, 0], [0, -nh * 0.16]]); ctx.fill(); ctx.restore(); }
      ctx.restore();
      // mane: two tones of streaming strands from the crest
      ctx.lineCap = 'round';
      for (let pass = 0; pass < 2; pass++) {
        ctx.strokeStyle = pass ? '#2a160a' : '#120904'; ctx.lineWidth = pass ? 3 : 4.5;
        for (let i = 0; i < 16; i++) {
          const f = i / 15, mx = bx + nw * (0.0 + f * 0.26), my = by - nh * (0.55 + f * 0.4 - f * f * 0.05) + nk;
          ctx.beginPath(); ctx.moveTo(mx, my);
          ctx.quadraticCurveTo(mx + 14 + pass * 3, my - 10 + Math.sin(t * 12 + i) * 4, mx + 34 + Math.sin(t * 9 + i) * 6 + pass * 6, my + 6 + Math.sin(t * 10 + i * 2) * 7);
          ctx.stroke();
        }
      }
      ctx.lineCap = 'butt';
    }
    // limbs
    const half = A.h * 0.13, bend = A.h * 0.05;
    const top = [grip.x + nx * half - ux * bend, grip.y + ny * half - uy * bend], bot = [grip.x - nx * half - ux * bend, grip.y - ny * half - uy * bend];
    const nock = [grip.x - ux * (A.h * 0.03 + draw * A.h * 0.12), grip.y - uy * (A.h * 0.03 + draw * A.h * 0.12)];
    // string, arrow
    ctx.strokeStyle = 'rgba(255,250,235,0.85)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(nock[0], nock[1]); ctx.lineTo(bot[0], bot[1]); ctx.stroke();
    if (!o.flight) {
      const tipx = grip.x + ux * A.h * 0.1, tipy = grip.y + uy * A.h * 0.1;
      ctx.strokeStyle = '#5a3a1c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(nock[0], nock[1]); ctx.lineTo(tipx, tipy); ctx.stroke();
      ctx.fillStyle = '#d6d6d6'; poly(ctx, [[tipx + nx * 4, tipy + ny * 4], [tipx + ux * 14, tipy + uy * 14], [tipx - nx * 4, tipy - ny * 4]]); ctx.fill();
      ctx.fillStyle = '#e8453a'; poly(ctx, [[nock[0], nock[1]], [nock[0] + ux * 16 + nx * 5, nock[1] + uy * 16 + ny * 5], [nock[0] + ux * 22, nock[1] + uy * 22], [nock[0] + ux * 16 - nx * 5, nock[1] + uy * 16 - ny * 5]]); ctx.fill();
    }
    ctx.strokeStyle = '#2e1a0c'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.quadraticCurveTo(grip.x + nx * half * 0.55 + ux * bend * 0.6, grip.y + ny * half * 0.55 + uy * bend * 0.6, grip.x, grip.y); ctx.quadraticCurveTo(grip.x - nx * half * 0.55 + ux * bend * 0.6, grip.y - ny * half * 0.55 + uy * bend * 0.6, bot[0], bot[1]); ctx.stroke();
    ctx.strokeStyle = '#a8743a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.quadraticCurveTo(grip.x + nx * half * 0.55 + ux * bend * 0.6, grip.y + ny * half * 0.55 + uy * bend * 0.6, grip.x, grip.y); ctx.quadraticCurveTo(grip.x - nx * half * 0.55 + ux * bend * 0.6, grip.y - ny * half * 0.55 + uy * bend * 0.6, bot[0], bot[1]); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.lineCap = 'butt';
    fist(ctx, grip.x, grip.y, 12, '#d9a679', '#7a2e22');
    // the drawing hand at the string
    if (draw > 0.05 && !o.flight) { ctx.fillStyle = '#d9a679'; ctx.beginPath(); ctx.arc(nock[0] - ux * 6, nock[1] - uy * 6, 8, 0, TAU); ctx.fill(); }
    if (o.cross && !o.flight) {
      const col = o.drawLevel >= 1 ? LK.good : LK.guide, r = 15 + (1 - (o.drawLevel ?? 0)) * 9, cr = o.cross;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 5.5; ctx.beginPath(); ctx.arc(cr.x, cr.y, r, 0, TAU); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cr.x, cr.y, r, 0, TAU);
      ctx.moveTo(cr.x - r * 1.6, cr.y); ctx.lineTo(cr.x - r * 0.45, cr.y); ctx.moveTo(cr.x + r * 0.45, cr.y); ctx.lineTo(cr.x + r * 1.6, cr.y); ctx.moveTo(cr.x, cr.y - r * 1.6); ctx.lineTo(cr.x, cr.y - r * 0.45); ctx.moveTo(cr.x, cr.y + r * 0.45); ctx.lineTo(cr.x, cr.y + r * 1.6); ctx.stroke();
    }
    void drawn;
  };

  return {
    id: 'steppe', reset, backdrop, target, tool, onShoot, onResolve, bob: true,
    labels: { draw: 'Drawing the bow', full: 'Full draw: loose', shots: 'arrows' },
    hint: 'Draw as the target comes level, watch the crosshair drift with the gallop, and loose slightly ahead of the board.',
    hudIcon: (ctx, x, y, filled) => { ctx.strokeStyle = filled ? '#f0e0b0' : 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y); ctx.stroke(); ctx.fillStyle = ctx.strokeStyle; poly(ctx, [[x + 8, y - 3.5], [x + 13, y], [x + 8, y + 3.5]]); ctx.fill(); },
  };
}

export function createFaceScene(id, P, env, fx) {
  if (id === 'pinata') return pinataScene(P, env, fx);
  if (id === 'alka') return alkaScene(P, env, fx);
  if (id === 'steppe') return steppeScene(P, env, fx);
  return null;
}

// shape-craft 1.26.0 Kitchen Crafts: the jebena hut and the palm sugar kitchen (see scenes-kitchen-coffee.js for the Turkish coffee house).
import { registerSceneSet, registerProp } from './registry.js';
import { hash } from './geom.js';
import { tint, mix, rgba, rrect } from './fx.js';
import { lg, rg, ell, cast, TAU } from './props.js';
import { jebena, sini } from './brew-jebena-art.js';

const lerp = (a, b, t) => a + (b - a) * t;

const speck = (ctx, x, y, w, h, n, c, a, seed, sz = 2) => { ctx.fillStyle = rgba(c, a); ctx.beginPath(); for (let k = 0; k < n; k++) ctx.rect(x + hash(k, seed) * w, y + hash(k, seed + 1) * h, sz * (0.5 + hash(k, seed + 2)), sz * (0.5 + hash(k, seed + 3))); ctx.fill(); };
const glowAt = (ctx, x, y, r, col, a) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.45, `rgba(${col},${a * 0.35})`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); };

registerProp('kc-brew-jebenamini', (ctx, s) => { cast(ctx, 0, s * 0.42, s * 0.3, s * 0.06, 0.4); jebena(ctx, { ox: 0, oy: 0, s: s * 2 }, { x: 0.03, y: 0.205, t: 0, L: 0, heat: 0, plug: true }); });
registerProp('kc-brew-sinimini', (ctx, s) => { sini(ctx, 0, s * 0.3, s * 0.9, 0.9, 0, 0); });
registerProp('kc-brew-pan', (ctx, s) => { // the long-handled roasting pan with a few roasted beans
  cast(ctx, 0, s * 0.18, s * 0.4, s * 0.07, 0.4);
  ctx.strokeStyle = lg(ctx, 0, -4, 0, 4, [[0, '#8a5a30'], [1, '#3a2210']]); ctx.lineWidth = s * 0.07; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * 0.12, 0); ctx.lineTo(s * 0.5, -s * 0.07); ctx.stroke();
  ctx.fillStyle = lg(ctx, -s * 0.3, 0, s * 0.3, 0, [[0, '#23262a'], [0.3, '#8a9097'], [1, '#1c1e22']]); ell(ctx, -s * 0.12, 0, s * 0.3, s * 0.13); ctx.fill(); ctx.fillStyle = '#16181b'; ell(ctx, -s * 0.12, s * 0.01, s * 0.26, s * 0.1); ctx.fill();
  for (let q = 0; q < 12; q++) { ctx.fillStyle = tint('#4a2810', hash(q, 3) * 0.3 - 0.1); ell(ctx, -s * 0.12 + (hash(q, 1) - 0.5) * s * 0.4, (hash(q, 2) - 0.5) * s * 0.1, s * 0.032, s * 0.02); ctx.fill(); }
});
registerProp('kc-brew-mortarmini', (ctx, s) => {
  cast(ctx, 0, s * 0.4, s * 0.28, s * 0.06, 0.4);
  ctx.fillStyle = lg(ctx, -s * 0.3, 0, s * 0.3, 0, [[0, '#3a1c0a'], [0.3, '#9a6a3a'], [0.7, '#6e3d1c'], [1, '#2a1206']]);
  ctx.beginPath(); ctx.moveTo(-s * 0.2, s * 0.4); ctx.bezierCurveTo(-s * 0.22, s * 0.15, -s * 0.14, s * 0.05, -s * 0.15, -s * 0.05); ctx.bezierCurveTo(-s * 0.16, -s * 0.2, -s * 0.24, -s * 0.2, -s * 0.24, -s * 0.34); ctx.lineTo(s * 0.24, -s * 0.34); ctx.bezierCurveTo(s * 0.24, -s * 0.2, s * 0.16, -s * 0.2, s * 0.15, -s * 0.05); ctx.bezierCurveTo(s * 0.14, s * 0.05, s * 0.22, s * 0.15, s * 0.2, s * 0.4); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(20,8,2,0.6)'; ctx.stroke();
  ctx.fillStyle = '#1a0c06'; ell(ctx, 0, -s * 0.34, s * 0.23, s * 0.06); ctx.fill();
  ctx.save(); ctx.translate(s * 0.05, -s * 0.2); ctx.rotate(-0.35); ctx.fillStyle = lg(ctx, 0, -s * 0.05, 0, s * 0.05, [[0, '#c89a5a'], [1, '#6a3e1c']]); rrect(ctx, -s * 0.04, -s * 0.5, s * 0.08, s * 0.5, s * 0.03); ctx.fill(); ctx.restore();
});


registerProp('kc-brew-paddle', (ctx, s) => { // a long wooden stirring paddle
  cast(ctx, 0, s * 0.18, s * 0.42, s * 0.05, 0.35);
  ctx.fillStyle = lg(ctx, 0, -s * 0.03, 0, s * 0.03, [[0, '#d6a868'], [0.5, '#9a6a34'], [1, '#4a2a10']]); rrect(ctx, -s * 0.1, -s * 0.018, s * 0.6, s * 0.036, s * 0.016); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-s * 0.1, 0); ctx.quadraticCurveTo(-s * 0.14, -s * 0.12, -s * 0.34, -s * 0.11); ctx.lineTo(-s * 0.34, s * 0.11); ctx.quadraticCurveTo(-s * 0.14, s * 0.12, -s * 0.1, 0); ctx.closePath(); ctx.fillStyle = lg(ctx, 0, -s * 0.1, 0, s * 0.1, [[0, '#e2b878'], [0.5, '#a8743a'], [1, '#5a3418']]); ctx.fill(); ctx.strokeStyle = 'rgba(40,16,4,0.55)'; ctx.stroke();
});
registerProp('kc-brew-ladle', (ctx, s) => { // a coconut-shell ladle on a bamboo handle
  cast(ctx, 0, s * 0.2, s * 0.4, s * 0.05, 0.35);
  ctx.strokeStyle = lg(ctx, 0, -4, 0, 4, [[0, '#d8c070'], [1, '#6a5a20']]); ctx.lineWidth = s * 0.05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-s * 0.05, 0); ctx.lineTo(s * 0.5, -s * 0.1); ctx.stroke();
  ctx.strokeStyle = 'rgba(70,52,16,0.7)'; ctx.lineWidth = 2; for (const f of [0.3, 0.6]) { const px = -s * 0.05 + s * 0.55 * f, py = -s * 0.1 * f; ctx.beginPath(); ctx.moveTo(px - 3, py - s * 0.03); ctx.lineTo(px + 3, py + s * 0.03); ctx.stroke(); }
  ctx.fillStyle = lg(ctx, -s * 0.2, -s * 0.1, s * 0.2, s * 0.15, [[0, '#8a5a30'], [0.5, '#4a2a12'], [1, '#2a1408']]); ctx.beginPath(); ctx.ellipse(-s * 0.1, 0, s * 0.2, s * 0.16, 0, 0, Math.PI); ctx.lineTo(s * 0.1, 0); ctx.ellipse(-s * 0.1, 0, s * 0.2, s * 0.05, 0, 0, Math.PI, true); ctx.fill();
  ctx.fillStyle = '#d28a22'; ell(ctx, -s * 0.1, 0, s * 0.18, s * 0.045); ctx.fill(); ctx.fillStyle = 'rgba(255,255,230,0.6)'; ell(ctx, -s * 0.15, -s * 0.01, s * 0.05, s * 0.014); ctx.fill();
});
registerProp('kc-brew-bamboo', (ctx, s) => { // two bamboo moulds with golden syrup
  cast(ctx, 0, s * 0.3, s * 0.4, s * 0.06, 0.35);
  for (const dx of [-0.2, 0.2]) { const x = dx * s, rx = s * 0.17, ry = rx * 0.42, hh = s * 0.4;
    ctx.beginPath(); ctx.moveTo(x - rx, -hh * 0.5); ctx.lineTo(x - rx * 0.98, s * 0.24); ctx.ellipse(x, s * 0.24, rx * 0.98, ry * 0.95, 0, Math.PI, 0, true); ctx.lineTo(x + rx, -hh * 0.5); ctx.closePath(); ctx.fillStyle = lg(ctx, x - rx, 0, x + rx, 0, [[0, '#6a5a2a'], [0.3, '#e0cc86'], [0.6, '#c8b26a'], [1, '#6a5a2a']]); ctx.fill(); ctx.strokeStyle = 'rgba(60,40,10,0.7)'; ctx.stroke();
    ctx.fillStyle = '#6a5a2a'; ell(ctx, x, -hh * 0.5, rx, ry); ctx.fill(); ctx.fillStyle = lg(ctx, x - rx, 0, x + rx, 0, [[0, '#f0c050'], [1, '#a85a16']]); ell(ctx, x, -hh * 0.5 + 1, rx * 0.86, ry * 0.78); ctx.fill(); }
});
registerProp('kc-brew-cakes', (ctx, s) => { // discs of palm sugar
  cast(ctx, 0, s * 0.26, s * 0.4, s * 0.06, 0.35);
  for (const [dx, dy] of [[-0.18, 0.1], [0.16, 0.1], [0, -0.06]]) { const x = dx * s, y = dy * s, rx = s * 0.2, ry = rx * 0.4; ctx.fillStyle = lg(ctx, 0, y - ry, 0, y + ry + s * 0.08, [[0, '#a85a16'], [1, '#5a2808']]); ctx.beginPath(); ctx.ellipse(x, y + s * 0.08, rx, ry, 0, 0, Math.PI); ctx.lineTo(x - rx, y); ctx.lineTo(x + rx, y); ctx.fill(); ctx.fillStyle = lg(ctx, x - rx, 0, x + rx, 0, [[0, '#c27428'], [0.35, '#f0b04a'], [1, '#8a4a12']]); ell(ctx, x, y, rx, ry); ctx.fill(); ctx.fillStyle = 'rgba(255,255,230,0.5)'; ell(ctx, x - rx * 0.3, y - ry * 0.2, rx * 0.25, ry * 0.2); ctx.fill(); }
});

const walls = {
  kcbrewhutwall(ctx, s, r, H, t) { // a round hut: mud plaster, thatch overhead, a doorway onto a bright courtyard, gourds and a clay jar on pegs
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#8a5a34'], [0.45, '#b88454'], [1, '#9a6a40']]); ctx.fillRect(r.x, r.y, r.w, H);
    speck(ctx, r.x, r.y, r.w, H, 240, '#3a2010', 0.12, 41, 4); speck(ctx, r.x, r.y, r.w, H, 120, '#f0d8a8', 0.1, 45, 3);
    // thatch
    const th = H * 0.3; ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + th, [[0, '#2a1a0a'], [1, '#6a4a1e']]); ctx.fillRect(r.x, r.y, r.w, th);
    ctx.strokeStyle = 'rgba(210,170,90,0.5)'; ctx.lineWidth = 2; for (let x = r.x; x < r.x + r.w; x += 9) { ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x + (hash(x | 0, 2) - 0.5) * 6, r.y + th + hash(x | 0, 3) * 6); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(r.x, r.y + th - 2, r.w, 6);
    ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(r.x, r.y + th + 3); ctx.lineTo(r.x + r.w, r.y + th + 3); ctx.stroke();
    // the doorway
    const dw = Math.min(r.w * 0.3, H * 0.75), dx = r.x + r.w * 0.72, dy = r.y + th + 8, dh = H - th - 8;
    const door = () => { ctx.beginPath(); ctx.moveTo(dx - dw / 2, dy + dh); ctx.lineTo(dx - dw / 2, dy + dw * 0.45); ctx.quadraticCurveTo(dx - dw / 2, dy, dx, dy); ctx.quadraticCurveTo(dx + dw / 2, dy, dx + dw / 2, dy + dw * 0.45); ctx.lineTo(dx + dw / 2, dy + dh); ctx.closePath(); };
    ctx.save(); door(); ctx.clip(); ctx.fillStyle = lg(ctx, 0, dy, 0, dy + dh, [[0, '#fff2c8'], [0.5, '#f6dc98'], [1, '#c8a860']]); ctx.fillRect(dx - dw / 2, dy, dw, dh);
    ctx.fillStyle = '#b88a4a'; ctx.beginPath(); ctx.moveTo(dx - dw / 2, dy + dh * 0.62); for (let q = 0; q <= 8; q++) ctx.lineTo(dx - dw / 2 + (dw * q) / 8, dy + dh * (0.58 - 0.08 * Math.sin(q * 1.3 + 1))); ctx.lineTo(dx + dw / 2, dy + dh); ctx.lineTo(dx - dw / 2, dy + dh); ctx.fill();
    ctx.strokeStyle = '#3a2a14'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(dx + dw * 0.1, dy + dh * 0.9); ctx.quadraticCurveTo(dx + dw * 0.08, dy + dh * 0.6, dx + dw * 0.14, dy + dh * 0.4); ctx.stroke();
    ctx.fillStyle = '#3a5a22'; ctx.beginPath(); ctx.ellipse(dx + dw * 0.14, dy + dh * 0.36, dw * 0.3, dh * 0.1, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#4a6e2a'; ctx.beginPath(); ctx.ellipse(dx + dw * 0.02, dy + dh * 0.42, dw * 0.2, dh * 0.07, 0, 0, TAU); ctx.fill();
    ctx.restore(); ctx.strokeStyle = '#4a2c14'; ctx.lineWidth = 6; door(); ctx.stroke();
    glowAt(ctx, dx, dy + dh * 0.7, dw * 1.2, '255,230,160', 0.22);
    // gourds, a clay jar and a basket on pegs
    const peg = (x, y) => { ctx.fillStyle = '#2a1a0a'; ctx.fillRect(x - 2, y - 2, 5, 8); };
    const gx = r.x + r.w * 0.12; peg(gx, r.y + th + H * 0.12);
    ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx, r.y + th + H * 0.12); ctx.lineTo(gx, r.y + th + H * 0.2); ctx.stroke();
    ctx.fillStyle = lg(ctx, gx - 18, 0, gx + 18, 0, [[0, '#6a4a14'], [0.35, '#d8b050'], [1, '#6a4a14']]); ell(ctx, gx, r.y + th + H * 0.34, 16, H * 0.14); ctx.fill(); ell(ctx, gx, r.y + th + H * 0.2, 8, 9); ctx.fill();
    const jx = r.x + r.w * 0.3, jy = r.y + H * 0.92; ctx.fillStyle = lg(ctx, jx - 24, 0, jx + 24, 0, [[0, '#4a1c10'], [0.3, '#b8602e'], [1, '#4a1c10']]); ctx.beginPath(); ctx.moveTo(jx - 10, jy - H * 0.6); ctx.quadraticCurveTo(jx - 30, jy - H * 0.3, jx - 22, jy); ctx.lineTo(jx + 22, jy); ctx.quadraticCurveTo(jx + 30, jy - H * 0.3, jx + 10, jy - H * 0.6); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#2a1008'; ell(ctx, jx, jy - H * 0.6, 11, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(240,210,150,0.6)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(jx - 24, jy - H * 0.28); ctx.lineTo(jx + 24, jy - H * 0.28); ctx.stroke();
    const bx = r.x + r.w * 0.5, by = r.y + th + H * 0.3; peg(bx, by - 8); ctx.fillStyle = '#d9b878'; ctx.beginPath(); ctx.ellipse(bx, by + 12, 28, 22, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 1.4; for (let q = 0; q < 6; q++) { ctx.beginPath(); ctx.ellipse(bx, by + 12, 28, 22 - q * 3.5, 0, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(r.x, r.y, r.w, 8);
  },
  kcbrewpalmwall(ctx, s, r, H, t) { // a village kitchen under sugar palms: hazy sky, paddy, palms, a thatch eave with sap tubes, smoke
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#9cc4b4'], [0.45, '#e8e0b0'], [0.7, '#f6e2a8'], [1, '#c8a860']]); ctx.fillRect(r.x, r.y, r.w, H);
    glowAt(ctx, r.x + r.w * 0.62, r.y + H * 0.5, H * 1.1, '255,236,170', 0.45);
    // far paddy and tree line
    ctx.fillStyle = '#9ab868'; ctx.beginPath(); ctx.moveTo(r.x, r.y + H * 0.7); for (let x = 0; x <= r.w; x += 10) ctx.lineTo(r.x + x, r.y + H * (0.66 + 0.03 * Math.sin(x * 0.03) + 0.02 * Math.sin(x * 0.11))); ctx.lineTo(r.x + r.w, r.y + H); ctx.lineTo(r.x, r.y + H); ctx.fill();
    ctx.fillStyle = '#5a7a3a'; ctx.beginPath(); ctx.moveTo(r.x, r.y + H * 0.76); for (let x = 0; x <= r.w; x += 12) ctx.lineTo(r.x + x, r.y + H * (0.72 + 0.025 * Math.sin(x * 0.05 + 1) + 0.02 * hash(x | 0, 9))); ctx.lineTo(r.x + r.w, r.y + H); ctx.lineTo(r.x, r.y + H); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,230,0.22)'; ctx.lineWidth = 1.5; for (let q = 0; q < 6; q++) { ctx.beginPath(); ctx.moveTo(r.x, r.y + H * (0.82 + q * 0.03)); ctx.lineTo(r.x + r.w, r.y + H * (0.82 + q * 0.03)); ctx.stroke(); }
    // sugar palms: slim trunks with rings and a crown of fan leaves
    const palm = (x, base, top, lean, scale) => {
      ctx.strokeStyle = '#4a3a24'; ctx.lineWidth = 9 * scale; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + lean * 0.4, (base + top) / 2, x + lean, top); ctx.stroke();
      ctx.strokeStyle = 'rgba(20,12,4,0.5)'; ctx.lineWidth = 1.6; for (let q = 0; q < 14; q++) { const f = q / 14, yy = lerp(base, top, f), xx = x + lean * f * f * 0.9 + lean * 0.4 * f * (1 - f) * 0; ctx.beginPath(); ctx.moveTo(xx - 5 * scale, yy); ctx.lineTo(xx + 5 * scale, yy + 2); ctx.stroke(); }
      for (let f = 0; f < 11; f++) { const a = -Math.PI / 2 + (f - 5) * 0.34, L = (44 + 14 * hash(f, 3)) * scale, cx = x + lean, cy = top; const ex = cx + Math.cos(a) * L, ey = cy + Math.sin(a) * L * 0.65 + L * 0.28 * Math.abs(Math.sin(a + Math.PI / 2)); ctx.strokeStyle = f % 2 ? '#2f5a22' : '#3f7a2c'; ctx.lineWidth = 7 * scale; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.quadraticCurveTo(cx + Math.cos(a) * L * 0.55, cy + Math.sin(a) * L * 0.5 - 4 * scale, ex, ey); ctx.stroke(); }
    };
    palm(r.x + r.w * 0.1, r.y + H, r.y + H * 0.2, 14, 1.2); palm(r.x + r.w * 0.24, r.y + H, r.y + H * 0.38, -8, 0.95); palm(r.x + r.w * 0.92, r.y + H, r.y + H * 0.14, -16, 1.3); palm(r.x + r.w * 0.8, r.y + H, r.y + H * 0.4, 10, 0.85);
    // the thatch eave, with bamboo tubes for the sap hanging from it
    const th = H * 0.24; ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + th, [[0, '#3a2a12'], [1, '#7a5a26']]); ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x + r.w, r.y); ctx.lineTo(r.x + r.w, r.y + th * 0.8); for (let x = r.w; x >= 0; x -= 14) ctx.lineTo(r.x + x, r.y + th + hash(x | 0, 4) * 10); ctx.lineTo(r.x, r.y + th * 0.8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(230,200,120,0.4)'; ctx.lineWidth = 2; for (let x = r.x; x < r.x + r.w; x += 8) { ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x + (hash(x | 0, 2) - 0.5) * 8, r.y + th); ctx.stroke(); }
    for (let k = 0; k < 4; k++) { const x = r.x + r.w * (0.3 + k * 0.14), y = r.y + th + 6; ctx.strokeStyle = '#3a2a14'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 6); ctx.stroke(); ctx.fillStyle = lg(ctx, x - 8, 0, x + 8, 0, [[0, '#7a6a2a'], [0.35, '#e0cc86'], [1, '#6a5a2a']]); rrect(ctx, x - 8, y + 4, 16, H * 0.22, 4); ctx.fill(); ctx.strokeStyle = 'rgba(70,50,16,0.7)'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = '#2a1c08'; ell(ctx, x, y + 4, 8, 3); ctx.fill(); }
    // smoke haze drifting across
    const sm_ = ctx.createLinearGradient(r.x, 0, r.x + r.w, 0); sm_.addColorStop(0, 'rgba(200,190,170,0)'); sm_.addColorStop(0.5, 'rgba(200,190,170,0.2)'); sm_.addColorStop(1, 'rgba(200,190,170,0)'); ctx.fillStyle = sm_; ctx.fillRect(r.x, r.y + th, r.w, H - th);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(r.x, r.y, r.w, 8);
  },
};
const floors = {
  kcbrewrush(ctx, r, c) { // a floor of rush matting with cut grass
    ctx.fillStyle = lg(ctx, r.x, r.y, r.x + r.w, r.y + r.h, [[0, '#a8864a'], [0.5, '#8a6a38'], [1, '#7a5a2c']]); ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.lineWidth = 2; for (let y = r.y; y < r.y + r.h; y += 11) { ctx.strokeStyle = `rgba(${hash(y | 0, 4) > 0.5 ? '50,30,8' : '220,190,120'},0.14)`; ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y + hash(y | 0, 5) * 3); ctx.stroke(); }
    for (let x = r.x; x < r.x + r.w; x += 44) { ctx.strokeStyle = 'rgba(40,24,6,0.22)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(120,150,60,0.6)'; ctx.lineWidth = 2; ctx.lineCap = 'round'; for (let k = 0; k < 46; k++) { const x = r.x + r.w * hash(k, 6), y = r.y + r.h * (0.3 + hash(k, 7) * 0.7), a = hash(k, 8) * 3.1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 18, y + Math.sin(a) * 6); ctx.stroke(); }
  },
  kcbrewearth(ctx, r, c) { // swept red earth with chips of wood, palm leaves and a stack of firewood
    ctx.fillStyle = lg(ctx, r.x, r.y, r.x + r.w, r.y + r.h, [[0, '#a8683a'], [0.5, '#8a5028'], [1, '#6a3c1c']]); ctx.fillRect(r.x, r.y, r.w, r.h);
    speck(ctx, r.x, r.y, r.w, r.h, 380, '#3a1c08', 0.16, 71, 3); speck(ctx, r.x, r.y, r.w, r.h, 200, '#f0d0a0', 0.12, 75, 2);
    ctx.strokeStyle = 'rgba(70,36,14,0.22)'; ctx.lineWidth = 2; for (let k = 0; k < 30; k++) { const cx = r.x + r.w * hash(k, 21), cy = r.y + r.h * hash(k, 22), rr = 50 + hash(k, 23) * 90; ctx.beginPath(); ctx.arc(cx, cy, rr, 0.2 + hash(k, 24) * 3, 0.9 + hash(k, 24) * 3); ctx.stroke(); }
    ctx.fillStyle = 'rgba(60,110,40,0.7)'; for (let k = 0; k < 8; k++) { ctx.save(); ctx.translate(r.x + r.w * hash(k, 31), r.y + r.h * (0.35 + hash(k, 32) * 0.65)); ctx.rotate(hash(k, 33) * 3.1); ell(ctx, 0, 0, 30, 4); ctx.fill(); ctx.restore(); }
  },
};
const T = (c, h, w) => ({ caption: c, hint: h, ...(w ?? {}) });
registerSceneSet({
  scenes: {
    'kc-brew-jebena': { wall: 'kcbrewhutwall', wallC: '#b88454', wallK: 2.2, floor: 'kcbrewrush', floorC: '#8a6a38', light: 'window', litter: [{ k: 'grass', c: '#8aa850' }], dock: ['kc-brew-pan', 'kc-brew-mortarmini', '', 'kc-brew-jebenamini', 'kc-brew-sinimini'], dockKind: 'cloth', frame: 'cloth', wood: '#6a4a24', hang: [],
      words: T('Make this coffee', 'Roast, pound, boil, pour', { win: 'Every cup poured clear', ok: 'A good round of cups', retry: 'Back to the pan' }), pitch: 0.9, wave: 'triangle' },
    'kc-brew-syrup': { wall: 'kcbrewpalmwall', wallC: '#e8d8a0', wallK: 2.2, floor: 'kcbrewearth', floorC: '#8a5028', light: 'window', litter: [], dock: ['kc-brew-paddle', 'kc-brew-ladle', '', 'kc-brew-bamboo', 'kc-brew-cakes'], dockKind: 'tray', frame: 'rail', wood: '#6a4a24', hang: [],
      words: T('Boil this sugar', 'Stir in rhythm, test the thread, ladle', { win: 'Golden sugar in every mould', ok: 'A good batch', retry: 'Back to the wok' }), pitch: 0.8, wave: 'triangle' },
  },
  walls, floorKinds: { kcbrewrush: 'weave', kcbrewearth: 'felt' }, floorEx: floors,
  soundMat: { 'kc-brew-jebena': 'clay', 'kc-brew-syrup': 'wood' },
});
void mix;

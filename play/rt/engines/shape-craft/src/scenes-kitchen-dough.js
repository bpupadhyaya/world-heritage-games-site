// Kitchen Crafts of the World, dough area: four kitchens, each its own room, light, props and sound. The wall band is tall (wallK) so the
// kitchen reads behind the work: a steaming pot in the Georgian mountain house, bamboo steamers in the northern Chinese home, a whitewashed
// Puglian vault with copper and dried tomatoes, a Levantine kitchen with tiled arches and a shelf of carved wooden moulds.
import { registerSceneSet, registerProp } from './registry.js';
import { hash } from './geom.js';
import { tint, rgba, rrect, mix } from './fx.js';
import { lg, rg, ell, cast, TAU } from './props.js';
import { steam, flour, flourCloud, bake } from './dough-art.js';

const grad = (ctx, r, H, a, b) => { ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, a], [1, b]]); ctx.fillRect(r.x, r.y, r.w, H); };
const speck = (ctx, x, y, w, h, n, c, a, seed, sz = 2) => { ctx.fillStyle = rgba(c, a); ctx.beginPath(); for (let k = 0; k < n; k++) ctx.rect(x + hash(k, seed) * w, y + hash(k, seed + 1) * h, sz * (0.5 + hash(k, seed + 2)), sz * (0.5 + hash(k, seed + 3))); ctx.fill(); };
const beam = (ctx, x, y, w, h, c) => { ctx.fillStyle = lg(ctx, 0, y, 0, y + h, [[0, tint(c, 0.25)], [0.5, c], [1, tint(c, -0.5)]]); ctx.fillRect(x, y, w, h); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(x, y + 1, w, 1.5); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 6; k++) { const gy = y + h * (0.15 + k * 0.14); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy + (hash(k, 3) - 0.5) * 2); } ctx.stroke(); };
const rope = (ctx, x0, y0, x1, y1, c = '#9a7a46') => { ctx.strokeStyle = c; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
const wood = '#a8692f';

// ================================================ GEORGIA: a mountain kitchen with a steaming pot ===========================================
function garlic(ctx, x, y, h) { // a braid of garlic bulbs
  rope(ctx, x, y, x, y + h * 0.9, '#8a6a3a');
  for (let k = 0; k < 6; k++) {
    const by = y + h * (0.14 + k * 0.14), sw = (k % 2 ? 1 : -1) * h * 0.04, bx = x + sw, r = h * 0.075 * (1.05 - k * 0.04);
    ctx.fillStyle = lg(ctx, bx - r, by - r, bx + r, by + r, [[0, '#f8f2e2'], [0.6, '#e2d4b4'], [1, '#a8946a']]); ctx.beginPath(); ctx.ellipse(bx, by, r, r * 0.92, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(120,96,56,0.4)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(bx - r * 0.2, by - r * 0.8); ctx.quadraticCurveTo(bx - r * 0.5, by, bx - r * 0.2, by + r * 0.8); ctx.moveTo(bx + r * 0.3, by - r * 0.8); ctx.quadraticCurveTo(bx + r * 0.6, by, bx + r * 0.3, by + r * 0.8); ctx.stroke();
    ctx.fillStyle = '#c9b88a'; ctx.beginPath(); ctx.moveTo(bx - 2, by - r * 0.85); ctx.lineTo(bx, by - r * 1.3); ctx.lineTo(bx + 2, by - r * 0.85); ctx.fill();
  }
}
function chilis(ctx, x, y, h, seed) { // a string of dried red peppers
  rope(ctx, x, y, x, y + h * 0.85, '#7a5a30');
  for (let k = 0; k < 8; k++) {
    const py = y + h * (0.08 + k * 0.1), side = k % 2 ? 1 : -1, len = h * 0.2; ctx.save(); ctx.translate(x, py); ctx.rotate(side * (0.18 + hash(k, seed) * 0.1));
    ctx.fillStyle = lg(ctx, -4, 0, 4, 0, [[0, '#e0402a'], [0.4, '#b82418'], [1, '#6a1008']]); ctx.beginPath(); ctx.moveTo(-3, 0); ctx.quadraticCurveTo(-5, len * 0.6, 0, len); ctx.quadraticCurveTo(5, len * 0.6, 3, 0); ctx.fill();
    ctx.fillStyle = '#3a5a1c'; ctx.fillRect(-3.4, -2, 6.8, 3); ctx.fillStyle = 'rgba(255,200,170,0.35)'; ctx.fillRect(-2, 3, 1.5, len * 0.5); ctx.restore();
  }
}
function herbs(ctx, x, y, h) { // a hanging bunch of dried herbs
  rope(ctx, x, y, x, y + h * 0.2, '#8a6a3a');
  for (let k = 0; k < 11; k++) { const a = (k / 10 - 0.5) * 0.9, l = h * (0.55 + hash(k, 2) * 0.25); ctx.strokeStyle = tint('#7a8a3a', (hash(k, 4) - 0.5) * 0.3); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y + h * 0.2); ctx.quadraticCurveTo(x + Math.sin(a) * l * 0.4, y + h * 0.2 + l * 0.5, x + Math.sin(a) * l * 0.8, y + h * 0.2 + l * Math.cos(a)); ctx.stroke(); }
  ctx.strokeStyle = '#b8864a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 5, y + h * 0.24); ctx.lineTo(x + 5, y + h * 0.24); ctx.stroke();
}
function ridge(ctx, x, y, w, h, c, seed, snow = false) { // a mountain ridge across a window
  ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, y + h);
  const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12, yy = y + h * (0.5 - 0.5 * Math.abs(Math.sin(u * 5.2 + seed)) * (0.5 + hash(i, seed) * 0.6)); pts.push([x + u * w, yy]); ctx.lineTo(x + u * w, yy); }
  ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill();
  if (snow) { ctx.fillStyle = 'rgba(255,255,255,0.88)'; for (let i = 1; i < 12; i++) { const [px, py] = pts[i]; if (py < y + h * 0.38) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - w * 0.03, py + h * 0.16); ctx.lineTo(px - w * 0.012, py + h * 0.1); ctx.lineTo(px, py + h * 0.17); ctx.lineTo(px + w * 0.015, py + h * 0.1); ctx.lineTo(px + w * 0.03, py + h * 0.14); ctx.closePath(); ctx.fill(); } } }
}
function stoneCourse(ctx, x, y, w, h, base, seed) { // rubble stone course: irregular blocks with mortar
  ctx.fillStyle = mix(base, '#000', 0.5); ctx.fillRect(x, y, w, h);
  const rows = Math.max(2, Math.round(h / 22)), rh = h / rows;
  for (let r = 0; r < rows; r++) {
    let px = x - hash(r, seed) * 40;
    while (px < x + w) {
      const bw = 34 + hash(Math.floor(px), r, seed) * 44, k = hash(Math.floor(px), r, seed + 1);
      ctx.fillStyle = lg(ctx, px, y + r * rh, px + bw, y + (r + 1) * rh, [[0, tint(base, 0.12 + k * 0.1)], [0.7, tint(base, -0.04 + k * 0.05)], [1, tint(base, -0.28)]]);
      rrect(ctx, px + 1.5, y + r * rh + 1.5, bw - 3, rh - 3, 5); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px + 5, y + r * rh + 3); ctx.lineTo(px + bw - 6, y + r * rh + 3); ctx.stroke(); px += bw;
    }
  }
}

const WALLS = {
  kcgeowall(ctx, s, r, H, t) { // Svaneti-style kitchen: lime plaster over rubble stone, timber beam, stove with a steaming pot, window onto snow peaks
    grad(ctx, r, H, tint(s.wallC, 0.14), tint(s.wallC, -0.16));
    speck(ctx, r.x, r.y, r.w, H, 160, '#7a5a30', 0.1, 111, 5); speck(ctx, r.x, r.y, r.w, H, 90, '#ffffff', 0.14, 115, 4);
    stoneCourse(ctx, r.x, r.y + H * 0.7, r.w, H * 0.3, '#8a7a68', 5);
    // window onto the Caucasus, right of centre
    const ww = Math.min(r.w * 0.3, H * 1.25), wx = r.x + r.w * 0.64, wy = r.y + H * 0.14, wh = H * 0.56;
    ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#7fb0dc'], [0.55, '#cfe4f2'], [1, '#e8f0e4']]); ctx.fillRect(wx, wy, ww, wh);
    ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
    ctx.fillStyle = rg(ctx, wx + ww * 0.8, wy + wh * 0.18, 2, wh * 0.5, [[0, 'rgba(255,250,220,0.95)'], [0.3, 'rgba(255,240,190,0.5)'], [1, 'rgba(255,240,190,0)']]); ctx.fillRect(wx, wy, ww, wh);
    ridge(ctx, wx, wy + wh * 0.18, ww, wh * 0.5, '#a9bccf', 1.3, true); ridge(ctx, wx - 10, wy + wh * 0.36, ww + 20, wh * 0.42, '#6f8ca8', 2.9, true); ridge(ctx, wx, wy + wh * 0.58, ww, wh * 0.42, '#4f7a58', 4.4);
    ctx.fillStyle = '#3a6a3a'; for (let k = 0; k < 9; k++) { const tx = wx + ww * (0.05 + k * 0.11), ty = wy + wh * (0.8 + hash(k, 3) * 0.12); ctx.beginPath(); ctx.moveTo(tx, ty - wh * 0.1); ctx.lineTo(tx - 5, ty); ctx.lineTo(tx + 5, ty); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = '#4a2c14'; ctx.lineWidth = 4; ctx.strokeRect(wx, wy, ww, wh); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh * 0.5); ctx.lineTo(wx + ww, wy + wh * 0.5); ctx.stroke();
    ctx.fillStyle = lg(ctx, 0, wy + wh, 0, wy + wh + 8, [[0, '#8a5a2a'], [1, '#4a2c14']]); ctx.fillRect(wx - 8, wy + wh, ww + 16, 8);
    // open shutters, hinged on the frame
    for (const sd of [-1, 1]) { const sx = sd < 0 ? wx - ww * 0.22 : wx + ww; ctx.fillStyle = lg(ctx, sx, 0, sx + ww * 0.22, 0, [[0, '#5a8a6a'], [1, '#3a6a4a']]); ctx.beginPath(); ctx.moveTo(sx, wy - 2); ctx.lineTo(sx + ww * 0.22, wy + 6); ctx.lineTo(sx + ww * 0.22, wy + wh - 6); ctx.lineTo(sx, wy + wh + 2); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.stroke(); }
    // a pot of basil on the sill
    const bx = wx + ww * 0.3, by = wy + wh; ctx.fillStyle = '#b5603a'; ctx.beginPath(); ctx.moveTo(bx - 9, by); ctx.lineTo(bx + 9, by); ctx.lineTo(bx + 6, by - 12); ctx.lineTo(bx - 6, by - 12); ctx.fill(); ctx.fillStyle = '#4a9a3a'; for (let k = 0; k < 7; k++) { ell(ctx, bx + (k - 3) * 3.6, by - 17 - (k % 3) * 3, 4.5, 3.2); ctx.fill(); }
    // timber beam with hanging garlic, chilli and herbs
    beam(ctx, r.x, r.y, r.w, H * 0.085, '#4a2c16');
    garlic(ctx, r.x + r.w * 0.36, r.y + H * 0.08, H * 0.4); chilis(ctx, r.x + r.w * 0.455, r.y + H * 0.08, H * 0.46, 2); herbs(ctx, r.x + r.w * 0.545, r.y + H * 0.08, H * 0.38); garlic(ctx, r.x + r.w * 0.93, r.y + H * 0.08, H * 0.34);
    // the stove: a stone hearth with a big steaming pot on the left
    const px = r.x + r.w * 0.19, pw = Math.min(r.w * 0.2, H * 0.85), py = r.y + H * 0.94;
    ctx.fillStyle = lg(ctx, px - pw * 0.8, 0, px + pw * 0.8, 0, [[0, '#5a4a3c'], [0.5, '#7a685a'], [1, '#4a3a2e']]); rrect(ctx, px - pw * 0.78, py - H * 0.1, pw * 1.56, H * 0.16, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,150,60,0.55)'; ell(ctx, px - pw * 0.5, py - H * 0.02, pw * 0.16, H * 0.03); ctx.fill();
    cast(ctx, px, py - H * 0.095, pw * 0.58, H * 0.03, 0.4);
    const top = py - H * 0.6, bot = py - H * 0.1;
    const pot = () => { ctx.beginPath(); ctx.moveTo(px - pw * 0.46, top + H * 0.06); ctx.quadraticCurveTo(px - pw * 0.52, (top + bot) / 2, px - pw * 0.42, bot); ctx.lineTo(px + pw * 0.42, bot); ctx.quadraticCurveTo(px + pw * 0.52, (top + bot) / 2, px + pw * 0.46, top + H * 0.06); ctx.closePath(); };
    pot(); ctx.fillStyle = lg(ctx, px - pw * 0.5, 0, px + pw * 0.5, 0, [[0, '#6a6e72'], [0.22, '#d8dde0'], [0.45, '#a5abb0'], [0.8, '#6a7076'], [1, '#3e4348']]); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = lg(ctx, px - pw * 0.5, 0, px + pw * 0.5, 0, [[0, '#5a5e62'], [0.3, '#c8ced2'], [1, '#42474c']]); ctx.beginPath(); ctx.ellipse(px, top + H * 0.06, pw * 0.47, H * 0.045, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(px - pw * 0.34, py - H * 0.5, pw * 0.07, H * 0.34);
    ctx.strokeStyle = '#2a2c30'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(px - pw * 0.5, py - H * 0.44, H * 0.05, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke(); ctx.beginPath(); ctx.arc(px + pw * 0.5, py - H * 0.44, H * 0.05, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
    ctx.fillStyle = rg(ctx, px, top, 4, H * 0.62, [[0, 'rgba(60,38,20,0.5)'], [1, 'rgba(60,38,20,0)']]); ctx.fillRect(px - H * 0.7, r.y, H * 1.4, top - r.y + H * 0.1);   // soot-stained plaster above the pot
    // a shelf of clay jugs between pot and window
    const sx = r.x + r.w * 0.36, sy = r.y + H * 0.58; beam(ctx, sx, sy, r.w * 0.2, 5, '#6a3e1e');
    for (const [o2, hh, c] of [[0.025, 0.2, '#a8502a'], [0.075, 0.26, '#8a3e20'], [0.125, 0.18, '#b8683a']]) { const jx = sx + r.w * o2 + r.w * 0.012, jw = H * 0.06; ctx.fillStyle = lg(ctx, jx - jw, 0, jx + jw, 0, [[0, tint(c, 0.3)], [0.5, c], [1, tint(c, -0.45)]]); ctx.beginPath(); ctx.moveTo(jx - jw * 0.4, sy); ctx.quadraticCurveTo(jx - jw * 1.1, sy - H * hh * 0.5, jx - jw * 0.35, sy - H * hh * 0.85); ctx.lineTo(jx - jw * 0.3, sy - H * hh); ctx.lineTo(jx + jw * 0.3, sy - H * hh); ctx.lineTo(jx + jw * 0.35, sy - H * hh * 0.85); ctx.quadraticCurveTo(jx + jw * 1.1, sy - H * hh * 0.5, jx + jw * 0.4, sy); ctx.closePath(); ctx.fill(); }
  },
};

const FLOORS = {
  kcgeotable(ctx, r, c) { // a long scrubbed table of broad pine planks with knife scars, flour in drifts
    const pl = Math.max(54, r.h / 6.5);
    for (let k = 0; k * pl < r.h + pl; k++) { const y = r.y + k * pl, tone = (hash(k, 7) - 0.5) * 0.12; ctx.fillStyle = rgba(tint(c, tone), 0.55); ctx.fillRect(r.x, y, r.w, pl); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(r.x, y, r.w, 2.5); ctx.fillStyle = 'rgba(255,240,210,0.12)'; ctx.fillRect(r.x, y + 3, r.w, 1.5); }
    ctx.strokeStyle = 'rgba(70,40,12,0.16)'; ctx.lineWidth = 1; for (let k = 0; k < 90; k++) { const y = r.y + hash(k, 21) * r.h, x = r.x + hash(k, 22) * r.w; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 40, y + (hash(k, 23) - 0.5) * 4, x + 90, y + (hash(k, 24) - 0.5) * 4, x + 60 + hash(k, 25) * 160, y + (hash(k, 26) - 0.5) * 3); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(30,18,6,0.22)'; for (let k = 0; k < 14; k++) { const x = r.x + hash(k, 31) * r.w, y = r.y + r.h * (0.25 + hash(k, 32) * 0.7), a = hash(k, 33) * 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 26, y + Math.sin(a) * 12); ctx.stroke(); }
    flourCloud(ctx, r.x + r.w * 0.2, r.y + r.h * 0.78, r.w * 0.2, r.h * 0.12, 5, 0.3); flourCloud(ctx, r.x + r.w * 0.85, r.y + r.h * 0.5, r.w * 0.16, r.h * 0.1, 9, 0.24);
  },
};

const LITTER = {
  kcflour(ctx, r, c) { for (let k = 0; k < 4; k++) flourCloud(ctx, r.x + r.w * (0.1 + 0.25 * k + hash(k, 3) * 0.1), r.y + r.h * (0.25 + hash(k, 4) * 0.6), 28 + hash(k, 5) * 30, 10 + hash(k, 6) * 12, 20 + k, 0.2, c); },
  kcherb(ctx, r, c) { for (let k = 0; k < 9; k++) { const x = r.x + r.w * hash(k, 41), y = r.y + r.h * (0.3 + hash(k, 42) * 0.7); ctx.save(); ctx.translate(x, y); ctx.rotate(hash(k, 43) * TAU); ctx.fillStyle = rgba(tint(c, (hash(k, 44) - 0.5) * 0.3), 0.9); ctx.beginPath(); ctx.moveTo(0, -5); ctx.quadraticCurveTo(5, -1, 0, 5); ctx.quadraticCurveTo(-5, -1, 0, -5); ctx.fill(); ctx.strokeStyle = 'rgba(30,60,20,0.5)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, 4); ctx.stroke(); ctx.restore(); } },
};


// ================================================ CHINA: a northern kitchen with bamboo steamers ===================================================
function steamerStack(ctx, x, y, w, h, t) { // y is the base; three bamboo steamers and a lid, steam from the join
  const lv = 3, sh = h * 0.2;
  // iron wok on a brick stove
  ctx.fillStyle = lg(ctx, x - w * 0.6, 0, x + w * 0.6, 0, [[0, '#7a3a28'], [0.5, '#a8523a'], [1, '#5a2a1c']]); rrect(ctx, x - w * 0.62, y - h * 0.12, w * 1.24, h * 0.14, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.moveTo(x - w * 0.62 + (k * w * 1.24) / 8, y - h * 0.12); ctx.lineTo(x - w * 0.62 + (k * w * 1.24) / 8, y + h * 0.02); ctx.stroke(); }
  ctx.fillStyle = lg(ctx, x - w * 0.5, 0, x + w * 0.5, 0, [[0, '#1a1a1c'], [0.3, '#4a4a50'], [1, '#101012']]); ctx.beginPath(); ctx.ellipse(x, y - h * 0.12, w * 0.5, h * 0.05, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < lv; i++) {
    const by = y - h * 0.12 - i * sh, rx = w * 0.48 * (1 - 0.02 * i), ry = h * 0.045;
    ctx.fillStyle = lg(ctx, x - rx, 0, x + rx, 0, [[0, '#8a5e24'], [0.25, '#e8c878'], [0.5, '#d2a550'], [1, '#6e4818']]); ctx.beginPath(); ctx.moveTo(x - rx, by - sh); ctx.lineTo(x - rx, by); ctx.ellipse(x, by, rx, ry, 0, Math.PI, 0, true); ctx.lineTo(x + rx, by - sh); ctx.ellipse(x, by - sh, rx, ry, 0, 0, Math.PI, true); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(90,56,16,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); for (let q = 1; q < 6; q++) { const yy = by - (sh * q) / 6; ctx.moveTo(x - rx, yy); ctx.quadraticCurveTo(x, yy + ry * 1.9, x + rx, yy); } ctx.stroke();
    ctx.fillStyle = 'rgba(70,40,10,0.7)'; ctx.fillRect(x - rx, by - sh * 0.06, rx * 2, sh * 0.08); ctx.fillRect(x - rx, by - sh * 0.96, rx * 2, sh * 0.07);
    ctx.fillStyle = 'rgba(255,240,190,0.4)'; ctx.fillRect(x - rx * 0.6, by - sh * 0.8, rx * 0.12, sh * 0.7);
  }
  const ty = y - h * 0.12 - lv * sh;
  ctx.fillStyle = lg(ctx, x - w * 0.5, 0, x + w * 0.5, 0, [[0, '#8a5e24'], [0.3, '#e8c878'], [1, '#6e4818']]); ctx.beginPath(); ctx.ellipse(x, ty, w * 0.49, h * 0.05, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = lg(ctx, x - w * 0.5, 0, x + w * 0.5, 0, [[0, '#a8782c'], [0.3, '#f0d488'], [1, '#7a5220']]); ctx.beginPath(); ctx.moveTo(x - w * 0.49, ty); ctx.quadraticCurveTo(x - w * 0.3, ty - h * 0.14, x, ty - h * 0.16); ctx.quadraticCurveTo(x + w * 0.3, ty - h * 0.14, x + w * 0.49, ty); ctx.quadraticCurveTo(x, ty + h * 0.06, x - w * 0.49, ty); ctx.fill();
  ctx.fillStyle = '#4a2c10'; ctx.beginPath(); ctx.arc(x, ty - h * 0.17, h * 0.022, 0, TAU); ctx.fill();
  void t;
}
function rooftops(ctx, x, y, w, h) { // grey tiled roofs with curved ridges, a persimmon tree
  ctx.fillStyle = lg(ctx, 0, y, 0, y + h, [[0, '#9ec4e0'], [1, '#e8f0f4']]); ctx.fillRect(x, y, w, h);
  for (const [px0, py0, pw, c] of [[0.05, 0.52, 0.5, '#5e6670'], [0.4, 0.62, 0.62, '#4a525c']]) { const rx = x + w * px0, ry = y + h * py0, rw = w * pw; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(rx, ry + h * 0.4); ctx.lineTo(rx, ry + h * 0.1); ctx.quadraticCurveTo(rx + rw * 0.5, ry - h * 0.16, rx + rw, ry + h * 0.1); ctx.lineTo(rx + rw, ry + h * 0.4); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1; for (let q = 1; q < 14; q++) { const qx = rx + (rw * q) / 14; ctx.beginPath(); ctx.moveTo(qx, ry + h * 0.4); ctx.lineTo(qx, ry + h * 0.06 - Math.sin((q / 14) * Math.PI) * h * 0.1); ctx.stroke(); } }
  ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + w * 0.82, y + h); ctx.quadraticCurveTo(x + w * 0.8, y + h * 0.6, x + w * 0.86, y + h * 0.4); ctx.stroke();
  for (let k = 0; k < 14; k++) { const a = hash(k, 4) * TAU, d = hash(k, 5) * w * 0.12; ctx.fillStyle = k % 4 === 0 ? '#e8802a' : '#6a8a3a'; ctx.beginPath(); ctx.arc(x + w * 0.86 + Math.cos(a) * d, y + h * 0.36 + Math.sin(a) * d * 0.7, k % 4 === 0 ? 3.4 : 5, 0, TAU); ctx.fill(); }
}
function utensil(ctx, kind, x, y, s) { // hanging kitchen tools
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(2, 2); ctx.lineTo(2, s * 0.9); ctx.stroke();
  if (kind === 'ladle') { ctx.strokeStyle = '#6e4a22'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, s * 0.62); ctx.stroke(); ctx.fillStyle = lg(ctx, -s * 0.14, 0, s * 0.14, 0, [[0, '#8a949c'], [0.4, '#e4eaee'], [1, '#6e7880']]); ctx.beginPath(); ctx.arc(0, s * 0.74, s * 0.14, 0, Math.PI, false); ctx.lineTo(-s * 0.14, s * 0.7); ctx.lineTo(s * 0.14, s * 0.7); ctx.closePath(); ctx.fill(); }
  else if (kind === 'spider') { ctx.strokeStyle = '#c89a58'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, s * 0.62); ctx.stroke(); ctx.strokeStyle = '#c8d0d6'; ctx.lineWidth = 1.5; ctx.fillStyle = 'rgba(200,210,220,0.3)'; ctx.beginPath(); ctx.arc(0, s * 0.78, s * 0.17, 0, TAU); ctx.fill(); ctx.stroke(); for (let q = -2; q <= 2; q++) { ctx.beginPath(); ctx.moveTo(q * s * 0.06, s * 0.64); ctx.lineTo(q * s * 0.06, s * 0.92); ctx.stroke(); } }
  else { ctx.fillStyle = lg(ctx, 0, 0, s * 0.22, 0, [[0, '#f4f7f9'], [0.5, '#b4bdc6'], [1, '#6e7882']]); ctx.beginPath(); ctx.moveTo(-s * 0.1, s * 0.34); ctx.lineTo(s * 0.12, s * 0.34); ctx.lineTo(s * 0.12, s * 0.8); ctx.lineTo(-s * 0.1, s * 0.78); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#6e4a22'; rrect(ctx, -s * 0.05, 0, s * 0.06, s * 0.36, 3); ctx.fill(); }
  ctx.restore();
}
WALLS.kccnwall = function (ctx, s, r, H, t) { // northern Chinese home kitchen: white glazed tile, a window onto grey roofs, tool rail, stove with a stack of bamboo steamers
  grad(ctx, r, H, tint(s.wallC, 0.1), tint(s.wallC, -0.12));
  // white glazed tile
  const tw = Math.max(18, H / 7), ty0 = r.y + H * 0.34;
  for (let y = ty0, row = 0; y < r.y + H; y += tw * 0.62, row++) for (let x = r.x - (row % 2 ? tw / 2 : 0); x < r.x + r.w; x += tw) { const k = hash(Math.floor(x), row, 4); ctx.fillStyle = lg(ctx, x, y, x + tw, y + tw * 0.6, [[0, tint('#f2f4f0', 0.02 + k * 0.03)], [1, tint('#cfd6d0', k * 0.04)]]); ctx.fillRect(x + 1, y + 1, tw - 2, tw * 0.62 - 2); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x + 2, y + 2, tw - 5, 1.5); }
  ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(r.x, ty0, r.w, 3);
  ctx.fillStyle = '#2f6a58'; ctx.fillRect(r.x, ty0 - 5, r.w, 6); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(r.x, ty0 - 5, r.w, 1.5);
  speck(ctx, r.x, r.y, r.w, H * 0.35, 90, '#8a7a5a', 0.07, 131, 4);
  // window with roofs
  const wx = r.x + r.w * 0.04, wy = r.y + H * 0.1, ww = Math.min(r.w * 0.25, H * 1.0), wh = H * 0.55;
  ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip(); rooftops(ctx, wx, wy, ww, wh); ctx.fillStyle = rg(ctx, wx + ww * 0.2, wy + wh * 0.1, 2, wh * 0.8, [[0, 'rgba(255,248,220,0.7)'], [1, 'rgba(255,248,220,0)']]); ctx.fillRect(wx, wy, ww, wh); ctx.restore();
  ctx.strokeStyle = '#3a2a1e'; ctx.lineWidth = 5; ctx.strokeRect(wx, wy, ww, wh); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(80,60,40,0.7)'; ctx.lineWidth = 1.5; for (let q = 1; q < 4; q++) { const lx = wx + (ww * q) / 4; if (q !== 2) { ctx.beginPath(); ctx.moveTo(lx, wy); ctx.lineTo(lx, wy + wh); ctx.stroke(); } }
  // utensil rail
  const rx0 = r.x + r.w * 0.7, rw = r.w * 0.28, ry = r.y + H * 0.12;
  ctx.fillStyle = lg(ctx, 0, ry, 0, ry + 6, [[0, '#b0b8be'], [1, '#5a6268']]); ctx.fillRect(rx0, ry, rw, 5);
  utensil(ctx, 'ladle', rx0 + rw * 0.15, ry + 3, H * 0.5); utensil(ctx, 'spider', rx0 + rw * 0.45, ry + 3, H * 0.5); utensil(ctx, 'cleaver', rx0 + rw * 0.8, ry + 3, H * 0.5);
  // shelf with jars
  const sy = r.y + H * 0.66, sx = r.x + r.w * 0.31; beam(ctx, sx, sy, r.w * 0.22, 5, '#6a4426');
  for (const [o2, c, hh] of [[0.03, '#2a2018', 0.2], [0.09, '#5a3a22', 0.17], [0.15, '#d8d0b8', 0.22], [0.21, '#8a2a1c', 0.16]]) { const jx = sx + r.w * o2 + 8, jw = H * 0.055; ctx.fillStyle = lg(ctx, jx - jw, 0, jx + jw, 0, [[0, tint(c, 0.25)], [0.5, c], [1, tint(c, -0.4)]]); rrect(ctx, jx - jw, sy - H * hh, jw * 2, H * hh, 5); ctx.fill(); ctx.fillStyle = '#c9a85a'; ctx.fillRect(jx - jw * 0.7, sy - H * hh - 3, jw * 1.4, 4); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(jx - jw * 0.6, sy - H * hh + 4, 2, H * hh * 0.5); }
  // stove with the steamer stack
  const stx = r.x + r.w * 0.6, sw = Math.min(r.w * 0.24, H * 0.9); steamerStack(ctx, stx, r.y + H * 0.97, sw, H * 0.92, t);
};
FLOORS.kccntable = function (ctx, r, c) { // a pale scrubbed table, planks running across, oil and flour, a checked cloth corner
  const pl = Math.max(46, r.h / 7);
  for (let k = 0; k * pl < r.h + pl; k++) { const y = r.y + k * pl, tone = (hash(k, 17) - 0.5) * 0.1; ctx.fillStyle = rgba(tint(c, tone), 0.5); ctx.fillRect(r.x, y, r.w, pl); ctx.fillStyle = 'rgba(70,50,20,0.4)'; ctx.fillRect(r.x, y, r.w, 2); ctx.fillStyle = 'rgba(255,250,235,0.18)'; ctx.fillRect(r.x, y + 3, r.w, 1.5); }
  ctx.strokeStyle = 'rgba(110,80,40,0.14)'; ctx.lineWidth = 1; for (let k = 0; k < 80; k++) { const y = r.y + hash(k, 41) * r.h, x = r.x + hash(k, 42) * r.w; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 50, y + (hash(k, 43) - 0.5) * 3, x + 100, y + (hash(k, 44) - 0.5) * 3, x + 50 + hash(k, 45) * 150, y + (hash(k, 46) - 0.5) * 2); ctx.stroke(); }
  flourCloud(ctx, r.x + r.w * 0.1, r.y + r.h * 0.7, r.w * 0.12, r.h * 0.1, 15, 0.24); flourCloud(ctx, r.x + r.w * 0.9, r.y + r.h * 0.45, r.w * 0.1, r.h * 0.08, 19, 0.2);
  // a checked tea towel folded in the lower right corner
  const cx = r.x + r.w * 0.86, cy = r.y + r.h * 0.8, cw = r.w * 0.13, ch = r.h * 0.12; ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.12); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(3, 4, cw, ch); ctx.fillStyle = '#f4efe2'; ctx.fillRect(0, 0, cw, ch); ctx.fillStyle = 'rgba(40,110,130,0.5)'; for (let q = 0; q < cw; q += 14) ctx.fillRect(q, 0, 7, ch); for (let q = 0; q < ch; q += 14) ctx.fillRect(0, q, cw, 7); ctx.restore();
};
LITTER.kcchive = function (ctx, r, c) { for (let k = 0; k < 10; k++) { const x = r.x + r.w * hash(k, 51), y = r.y + r.h * (0.3 + hash(k, 52) * 0.7); ctx.fillStyle = rgba(k % 2 ? c : '#f4f0d8', 0.9); ctx.beginPath(); ctx.ellipse(x, y, 4, 2.2, hash(k, 53) * 3, 0, TAU); ctx.fill(); } };
registerProp('kc-dough-chopsticks', (ctx, s) => { for (const [dy, c] of [[-s * 0.022, '#c8934a'], [s * 0.022, '#b07a38']]) { ctx.fillStyle = lg(ctx, 0, dy - 3, 0, dy + 3, [[0, tint(c, 0.4)], [0.5, c], [1, tint(c, -0.5)]]); ctx.beginPath(); ctx.moveTo(-s * 0.48, dy - 3); ctx.lineTo(s * 0.48, dy - 1.2); ctx.lineTo(s * 0.48, dy + 1.2); ctx.lineTo(-s * 0.48, dy + 3); ctx.closePath(); ctx.fill(); } ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-s * 0.48, -s * 0.045, s * 0.12, s * 0.09); });


// ================================================ ITALY: a whitewashed Puglian kitchen, copper and dried tomatoes ================================
function copperPot(ctx, x, y, w, h, c = '#c9733a') { // a hanging copper pot, side on
  ctx.fillStyle = lg(ctx, x - w / 2, 0, x + w / 2, 0, [[0, tint(c, -0.4)], [0.2, tint(c, 0.35)], [0.5, c], [0.85, tint(c, -0.35)], [1, tint(c, -0.55)]]); ctx.beginPath(); ctx.moveTo(x - w * 0.46, y); ctx.quadraticCurveTo(x - w * 0.52, y + h * 0.55, x - w * 0.4, y + h); ctx.lineTo(x + w * 0.4, y + h); ctx.quadraticCurveTo(x + w * 0.52, y + h * 0.55, x + w * 0.46, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = lg(ctx, x - w / 2, 0, x + w / 2, 0, [[0, '#7a4a28'], [0.4, '#e8c8a0'], [1, '#6a3a1c']]); ctx.beginPath(); ctx.ellipse(x, y, w * 0.46, h * 0.1, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,240,210,0.5)'; ctx.fillRect(x - w * 0.34, y + h * 0.14, w * 0.07, h * 0.6); ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + w * 0.46, y + h * 0.12); ctx.quadraticCurveTo(x + w * 0.72, y + h * 0.1, x + w * 0.68, y + h * 0.34); ctx.stroke();
}
function tomatoString(ctx, x, y, h) { rope(ctx, x, y, x, y + h * 0.9, '#6a5a30'); for (let k = 0; k < 8; k++) { const ty = y + h * (0.08 + k * 0.105), sw = (k % 2 ? 1 : -1) * 4.5, r = h * 0.045; ctx.fillStyle = lg(ctx, x + sw - r, ty - r, x + sw + r, ty + r, [[0, '#ff6a4a'], [0.4, '#d03020'], [1, '#7a1408']]); ctx.beginPath(); ctx.ellipse(x + sw, ty, r, r * 0.9, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#4a7a2a'; ctx.beginPath(); ctx.ellipse(x + sw, ty - r * 0.8, r * 0.5, r * 0.22, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(x + sw - r * 0.3, ty - r * 0.3, r * 0.25, r * 0.14, -0.5, 0, TAU); ctx.fill(); } }
function oliveView(ctx, x, y, w, h) { // sunlit Apulian landscape: red earth, olive trees, a white trullo cone
  ctx.fillStyle = lg(ctx, 0, y, 0, y + h, [[0, '#6fb8e8'], [0.6, '#d4ecf6'], [1, '#f4f0d8']]); ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#b8643a'; ctx.beginPath(); ctx.moveTo(x, y + h * 0.7); ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.62, x + w, y + h * 0.72); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.fill();
  const tx = x + w * 0.72, ty = y + h * 0.7; ctx.fillStyle = '#f6f2e6'; ctx.fillRect(tx - w * 0.09, ty - h * 0.18, w * 0.18, h * 0.18); ctx.fillStyle = lg(ctx, tx - w * 0.12, 0, tx + w * 0.12, 0, [[0, '#9a9a96'], [0.4, '#d0d0cc'], [1, '#7a7a78']]); ctx.beginPath(); ctx.moveTo(tx - w * 0.12, ty - h * 0.18); ctx.lineTo(tx, ty - h * 0.46); ctx.lineTo(tx + w * 0.12, ty - h * 0.18); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(tx - 3, ty - h * 0.1, 6, h * 0.1);
  for (const [ox, oy, rr] of [[0.18, 0.62, 0.2], [0.42, 0.68, 0.16], [0.9, 0.66, 0.15]]) { const cx = x + w * ox, cy = y + h * oy; ctx.strokeStyle = '#5a4a32'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, cy + h * 0.1); ctx.quadraticCurveTo(cx - 4, cy, cx + 3, cy - h * 0.06); ctx.stroke(); for (let q = 0; q < 12; q++) { const a = hash(q, 3) * TAU, d = hash(q, 4) * w * rr; ctx.fillStyle = q % 2 ? '#8aa07a' : '#6a8a5a'; ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * d, cy - h * 0.1 + Math.sin(a) * d * 0.55, w * 0.05, w * 0.022, a, 0, TAU); ctx.fill(); } }
}
WALLS.kcitwall = function (ctx, s, r, H, t) { // lime-washed vault, arched window onto olive trees, copper pots, dried tomatoes, a drying rack of orecchiette
  grad(ctx, r, H, tint(s.wallC, 0.08), tint(s.wallC, -0.14)); speck(ctx, r.x, r.y, r.w, H, 200, '#9a8a6a', 0.1, 141, 4); speck(ctx, r.x, r.y, r.w, H, 120, '#ffffff', 0.25, 145, 5);
  // a stone arch soffit, lit from the window
  ctx.fillStyle = 'rgba(120,96,64,0.16)'; ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x + r.w, r.y); ctx.lineTo(r.x + r.w, r.y + H * 0.08); ctx.quadraticCurveTo(r.x + r.w * 0.5, r.y + H * 0.2, r.x, r.y + H * 0.08); ctx.fill();
  // arched window at the left
  const ww = Math.min(r.w * 0.27, H * 0.95), wx = r.x + r.w * 0.06, wy = r.y + H * 0.16, wh = H * 0.7;
  ctx.save(); ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + ww / 2); ctx.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0); ctx.lineTo(wx + ww, wy + wh); ctx.closePath(); ctx.clip(); oliveView(ctx, wx, wy, ww, wh); ctx.fillStyle = rg(ctx, wx + ww * 0.8, wy + wh * 0.1, 2, wh * 0.9, [[0, 'rgba(255,250,220,0.6)'], [1, 'rgba(255,250,220,0)']]); ctx.fillRect(wx, wy, ww, wh); ctx.restore();
  ctx.strokeStyle = '#c46a3a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + ww / 2); ctx.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0); ctx.lineTo(wx + ww, wy + wh); ctx.stroke();
  ctx.strokeStyle = '#2a4a6a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh * 0.55); ctx.lineTo(wx + ww, wy + wh * 0.55); ctx.stroke();
  ctx.fillStyle = lg(ctx, 0, wy + wh, 0, wy + wh + 8, [[0, '#e8dcc0'], [1, '#a89a78']]); ctx.fillRect(wx - 8, wy + wh, ww + 16, 8);
  // iron rail with copper pots
  const rx0 = r.x + r.w * 0.36, rw = r.w * 0.3, ry = r.y + H * 0.1; ctx.fillStyle = lg(ctx, 0, ry, 0, ry + 6, [[0, '#4a4a50'], [1, '#18181a']]); ctx.fillRect(rx0, ry, rw, 5);
  for (const [o2, ww2, hh] of [[0.14, 0.2, 0.34], [0.46, 0.17, 0.28], [0.8, 0.14, 0.22]]) { const px0 = rx0 + rw * o2; rope(ctx, px0, ry + 5, px0, ry + 20, '#2a2a2a'); copperPot(ctx, px0, ry + 20, rw * ww2 * 1.4, H * hh); }
  // tomatoes and a wooden rack of drying orecchiette on cloth
  tomatoString(ctx, r.x + r.w * 0.72, r.y + H * 0.06, H * 0.5); tomatoString(ctx, r.x + r.w * 0.76, r.y + H * 0.06, H * 0.38);
  const kx = r.x + r.w * 0.82, ky = r.y + H * 0.56, kw = r.w * 0.16; beam(ctx, kx, ky, kw, 5, '#6a4426');
  ctx.fillStyle = '#f2eee2'; ctx.fillRect(kx + 3, ky - H * 0.1, kw - 6, H * 0.1); ctx.strokeStyle = 'rgba(100,120,170,0.5)'; ctx.lineWidth = 1; for (let q = 0; q < 4; q++) { ctx.beginPath(); ctx.moveTo(kx + 3, ky - H * 0.1 + q * 5); ctx.lineTo(kx + kw - 3, ky - H * 0.1 + q * 5); ctx.stroke(); }
  for (let q = 0; q < 6; q++) { const ex = kx + kw * (0.12 + q * 0.15), ey = ky - H * 0.05; ctx.fillStyle = '#e8c268'; ctx.beginPath(); ctx.ellipse(ex, ey, kw * 0.055, kw * 0.05, 0.3, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,240,190,0.5)'; ctx.beginPath(); ctx.ellipse(ex - 1, ey - 1, kw * 0.03, kw * 0.025, 0, 0, TAU); ctx.fill(); }
  // basil in a clay pot on the sill ledge
  const bx = r.x + r.w * 0.31, by = r.y + H * 0.97; ctx.fillStyle = '#b8643a'; ctx.beginPath(); ctx.moveTo(bx - 10, by); ctx.lineTo(bx + 10, by); ctx.lineTo(bx + 7, by - 15); ctx.lineTo(bx - 7, by - 15); ctx.fill(); ctx.fillStyle = '#3a8a3a'; for (let k = 0; k < 9; k++) { ell(ctx, bx + (k - 4) * 3.4, by - 20 - (k % 3) * 4, 5, 3.6); ctx.fill(); }
};
FLOORS.kcittable = function (ctx, r, c) { // a broad walnut table, scrubbed pale where the board sits, semolina scattered
  const pl = Math.max(60, r.h / 5.5);
  for (let k = 0; k * pl < r.h + pl; k++) { const y = r.y + k * pl, tone = (hash(k, 27) - 0.5) * 0.14; ctx.fillStyle = rgba(tint(c, tone), 0.5); ctx.fillRect(r.x, y, r.w, pl); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(r.x, y, r.w, 2.5); ctx.fillStyle = 'rgba(255,230,190,0.14)'; ctx.fillRect(r.x, y + 3, r.w, 1.5); }
  ctx.strokeStyle = 'rgba(50,28,8,0.2)'; ctx.lineWidth = 1; for (let k = 0; k < 90; k++) { const y = r.y + hash(k, 61) * r.h, x = r.x + hash(k, 62) * r.w; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 40, y + (hash(k, 63) - 0.5) * 4, x + 90, y + (hash(k, 64) - 0.5) * 4, x + 50 + hash(k, 65) * 160, y + (hash(k, 66) - 0.5) * 3); ctx.stroke(); }
  flourCloud(ctx, r.x + r.w * 0.12, r.y + r.h * 0.75, r.w * 0.14, r.h * 0.1, 23, 0.3, '#fff0c0'); flourCloud(ctx, r.x + r.w * 0.9, r.y + r.h * 0.4, r.w * 0.1, r.h * 0.1, 29, 0.25, '#fff0c0');
};
registerProp('kc-dough-knife', (ctx, s) => { const h = s * 0.1; ctx.fillStyle = lg(ctx, 0, -h * 0.5, 0, h * 0.5, [[0, '#f8fafb'], [0.5, '#b8c1ca'], [1, '#6c7680']]); ctx.beginPath(); ctx.moveTo(-s * 0.1, -h * 0.35); ctx.lineTo(s * 0.46, -h * 0.5); ctx.quadraticCurveTo(s * 0.52, -h * 0.3, s * 0.46, h * 0.2); ctx.lineTo(-s * 0.1, h * 0.35); ctx.closePath(); ctx.fill(); rrect(ctx, -s * 0.5, -h * 0.35, s * 0.42, h * 0.7, h * 0.3); ctx.fillStyle = lg(ctx, 0, -h * 0.35, 0, h * 0.35, [[0, '#b8895a'], [0.5, '#8a5e30'], [1, '#52341a']]); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-s * 0.05, -h * 0.28, s * 0.46, 1.4); });


// ================================================ LEVANT: a tiled kitchen with a shelf of carved moulds ==========================================
function tileDado(ctx, x, y, w, h) { // lozenge tiles in teal, cream and ochre
  const t = Math.max(22, h / 4); ctx.fillStyle = '#efe7d4'; ctx.fillRect(x, y, w, h);
  for (let row = 0, yy = y; yy < y + h + t; row++, yy += t / 2) for (let xx = x - (row % 2 ? t / 2 : 0); xx < x + w + t; xx += t) {
    const k = hash(Math.floor(xx), row, 6), c = (row + Math.floor((xx - x) / t)) % 2 ? '#2a7a8a' : '#d7a548';
    ctx.fillStyle = lg(ctx, xx, yy - t / 2, xx + t, yy + t / 2, [[0, tint(c, 0.15 + k * 0.08)], [1, tint(c, -0.2)]]);
    ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + t / 2, yy - t / 2 + 2); ctx.lineTo(xx + t - 2, yy); ctx.lineTo(xx + t / 2, yy + t / 2 - 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(xx + t * 0.3, yy - t * 0.08); ctx.lineTo(xx + t / 2, yy - t * 0.3); ctx.lineTo(xx + t * 0.6, yy - t * 0.05); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x, y, w, 3); ctx.fillStyle = '#2a4a5a'; ctx.fillRect(x, y - 5, w, 6); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x, y - 5, w, 1.5);
}
function seaView(ctx, x, y, w, h) { // terraced stone houses above a blue bay, a cypress
  ctx.fillStyle = lg(ctx, 0, y, 0, y + h, [[0, '#7cc0e8'], [0.45, '#d8eef6'], [0.5, '#3a8ab8'], [1, '#1f5f8a']]); ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#c8a878'; ctx.beginPath(); ctx.moveTo(x, y + h * 0.58); ctx.quadraticCurveTo(x + w * 0.3, y + h * 0.4, x + w * 0.6, y + h * 0.5); ctx.quadraticCurveTo(x + w * 0.85, y + h * 0.56, x + w, y + h * 0.5); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.fill();
  for (let k = 0; k < 9; k++) { const bx = x + w * (0.05 + k * 0.1), by = y + h * (0.55 + (k % 3) * 0.07), bw = w * 0.1, bh = h * 0.12; ctx.fillStyle = k % 2 ? '#f4ecd8' : '#e8d8b8'; ctx.fillRect(bx, by, bw, bh); ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(bx + bw * 0.6, by, bw * 0.4, bh); ctx.fillStyle = '#4a6a7a'; ctx.fillRect(bx + bw * 0.2, by + bh * 0.3, bw * 0.2, bh * 0.4); }
  ctx.fillStyle = '#2a4a2a'; ctx.beginPath(); ctx.moveTo(x + w * 0.88, y + h * 0.62); ctx.quadraticCurveTo(x + w * 0.82, y + h * 0.3, x + w * 0.88, y + h * 0.18); ctx.quadraticCurveTo(x + w * 0.94, y + h * 0.3, x + w * 0.88, y + h * 0.62); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; for (let q = 0; q < 5; q++) { ctx.beginPath(); ctx.moveTo(x + w * (0.1 + q * 0.15), y + h * (0.74 + (q % 2) * 0.08)); ctx.lineTo(x + w * (0.2 + q * 0.15), y + h * (0.74 + (q % 2) * 0.08)); ctx.stroke(); }
}
function woodMould(ctx, x, y, w, kind) { // a carved wooden mould hung on a peg, seen from the front
  ctx.save(); ctx.translate(x, y); rope(ctx, 0, 0, 0, w * 0.1, '#5a3a18');
  ctx.fillStyle = lg(ctx, -w / 2, 0, w / 2, 0, [[0, '#6a3e1c'], [0.4, '#b27a42'], [1, '#52301a']]); rrect(ctx, -w * 0.1, w * 0.1, w * 0.2, w * 0.5, w * 0.06); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, w * 0.74, kind === 'oval' ? w * 0.5 : w * 0.42, kind === 'oval' ? w * 0.34 : w * 0.42, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(40,20,6,0.6)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(0, w * 0.74, w * 0.26, w * 0.26 * (kind === 'oval' ? 0.7 : 1), 0, 0, TAU); for (let q = 0; q < 8; q++) { const a = (q / 8) * TAU; ctx.moveTo(Math.cos(a) * w * 0.08, w * 0.74 + Math.sin(a) * w * 0.08); ctx.lineTo(Math.cos(a) * w * 0.26, w * 0.74 + Math.sin(a) * w * 0.26 * (kind === 'oval' ? 0.7 : 1)); } ctx.stroke();
  ctx.restore();
}
WALLS.kclevwall = function (ctx, s, r, H, t) { // lime plaster over a tiled dado, an arched niche of moulds, an arched window onto the bay, hanging figs and a brass tray
  grad(ctx, r, H, tint(s.wallC, 0.1), tint(s.wallC, -0.14)); speck(ctx, r.x, r.y, r.w, H, 170, '#8a7a5a', 0.1, 151, 4); speck(ctx, r.x, r.y, r.w, H, 80, '#ffffff', 0.2, 155, 5);
  tileDado(ctx, r.x, r.y + H * 0.68, r.w, H * 0.32);
  // arched niche at the left with a shelf of carved wooden moulds and jars
  const nx = r.x + r.w * 0.05, nw = Math.min(r.w * 0.3, H * 1.15), ny = r.y + H * 0.1, nh = H * 0.62;
  ctx.save(); ctx.beginPath(); ctx.moveTo(nx, ny + nh); ctx.lineTo(nx, ny + nw / 2); ctx.arc(nx + nw / 2, ny + nw / 2, nw / 2, Math.PI, 0); ctx.lineTo(nx + nw, ny + nh); ctx.closePath(); ctx.fillStyle = lg(ctx, 0, ny, 0, ny + nh, [[0, '#8a6a48'], [1, '#a88a62']]); ctx.fill(); ctx.clip();
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(nx, ny, nw, nh * 0.2); ctx.fillStyle = rg(ctx, nx + nw / 2, ny + nh * 0.5, 2, nw, [[0, 'rgba(255,220,150,0.25)'], [1, 'rgba(255,220,150,0)']]); ctx.fillRect(nx, ny, nw, nh);
  woodMould(ctx, nx + nw * 0.24, ny + nh * 0.14, nw * 0.3, 'round'); woodMould(ctx, nx + nw * 0.62, ny + nh * 0.12, nw * 0.3, 'oval');
  beam(ctx, nx, ny + nh * 0.55, nw, 5, '#5a3a1c');
  for (const [o2, c, hh] of [[0.2, '#d8c8a8', 0.17], [0.44, '#c9a85a', 0.2], [0.68, '#a8503a', 0.15]]) { const jx = nx + nw * o2, jw = nw * 0.09, jy = ny + nh * 0.55; ctx.fillStyle = lg(ctx, jx - jw, 0, jx + jw, 0, [[0, tint(c, 0.3)], [0.5, c], [1, tint(c, -0.4)]]); ctx.beginPath(); ctx.moveTo(jx - jw * 0.7, jy); ctx.quadraticCurveTo(jx - jw * 1.2, jy - H * hh * 0.5, jx - jw * 0.5, jy - H * hh * 0.9); ctx.lineTo(jx + jw * 0.5, jy - H * hh * 0.9); ctx.quadraticCurveTo(jx + jw * 1.2, jy - H * hh * 0.5, jx + jw * 0.7, jy); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#6a4a22'; ctx.fillRect(jx - jw * 0.5, jy - H * hh * 0.98, jw, H * hh * 0.1); }
  ctx.restore(); ctx.strokeStyle = '#d7a548'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(nx, ny + nh); ctx.lineTo(nx, ny + nw / 2); ctx.arc(nx + nw / 2, ny + nw / 2, nw / 2, Math.PI, 0); ctx.lineTo(nx + nw, ny + nh); ctx.stroke();
  // arched window onto the bay
  const wx = r.x + r.w * 0.46, ww = Math.min(r.w * 0.24, H * 0.95), wy = r.y + H * 0.14, wh = H * 0.5;
  ctx.save(); ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + ww / 2); ctx.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0); ctx.lineTo(wx + ww, wy + wh); ctx.closePath(); ctx.clip(); seaView(ctx, wx, wy, ww, wh); ctx.fillStyle = rg(ctx, wx + ww * 0.7, wy + wh * 0.1, 2, wh, [[0, 'rgba(255,250,220,0.55)'], [1, 'rgba(255,250,220,0)']]); ctx.fillRect(wx, wy, ww, wh); ctx.restore();
  ctx.strokeStyle = '#f2ecd8'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + ww / 2); ctx.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0); ctx.lineTo(wx + ww, wy + wh); ctx.stroke();
  ctx.fillStyle = '#e8dcc0'; ctx.fillRect(wx - 8, wy + wh, ww + 16, 7); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(wx - 8, wy + wh + 5, ww + 16, 2);
  // dried figs on a string, a brass tray leaning on the dado, a mortar
  const fx2 = r.x + r.w * 0.78; rope(ctx, fx2, r.y, fx2, r.y + H * 0.46, '#6a5a30'); for (let k = 0; k < 7; k++) { const fy = r.y + H * (0.07 + k * 0.058), sw = (k % 2 ? 1 : -1) * 4; ctx.fillStyle = lg(ctx, fx2 + sw - 8, fy - 6, fx2 + sw + 8, fy + 6, [[0, '#b48a68'], [0.5, '#7a5238'], [1, '#3e2418']]); ctx.beginPath(); ctx.ellipse(fx2 + sw, fy, 8, 6.4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,230,190,0.35)'; ctx.beginPath(); ctx.ellipse(fx2 + sw - 2, fy - 2, 3, 1.8, 0, 0, TAU); ctx.fill(); }
  const tx = r.x + r.w * 0.9, ty = r.y + H * 0.46, tr = H * 0.26; ctx.save(); ctx.translate(tx, ty); ctx.fillStyle = lg(ctx, -tr, -tr, tr, tr, [[0, '#f2d27a'], [0.4, '#c9983a'], [1, '#7a5418']]); ctx.beginPath(); ctx.arc(0, 0, tr, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(80,50,10,0.5)'; ctx.lineWidth = 1.4; for (let q = 1; q < 5; q++) { ctx.beginPath(); ctx.arc(0, 0, tr * q * 0.2, 0, TAU); ctx.stroke(); } for (let q = 0; q < 16; q++) { const a = (q / 16) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * tr * 0.25, Math.sin(a) * tr * 0.25); ctx.lineTo(Math.cos(a) * tr * 0.9, Math.sin(a) * tr * 0.9); ctx.stroke(); } ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(-tr * 0.3, -tr * 0.4, tr * 0.3, tr * 0.12, -0.5, 0, TAU); ctx.fill(); ctx.restore();
};
FLOORS.kclevtable = function (ctx, r, c) { // honey limestone slabs with fine grout lines and pores
  const sl = Math.max(120, r.w / 3.6);
  for (let k = 0; k < 6; k++) for (let j = 0; j < 6; j++) { const x = r.x + k * sl - (j % 2) * sl * 0.4, y = r.y + j * sl * 0.7, tone = (hash(k, j, 9) - 0.5) * 0.12; ctx.fillStyle = rgba(tint(c, tone), 0.55); ctx.fillRect(x, y, sl, sl * 0.7); ctx.strokeStyle = 'rgba(70,50,20,0.4)'; ctx.lineWidth = 2; ctx.strokeRect(x, y, sl, sl * 0.7); ctx.strokeStyle = 'rgba(255,245,215,0.18)'; ctx.strokeRect(x + 2, y + 2, sl - 2, sl * 0.7 - 2); }
  speck(ctx, r.x, r.y, r.w, r.h, 300, '#6a5a3a', 0.12, 161, 2); speck(ctx, r.x, r.y, r.w, r.h, 160, '#ffffff', 0.18, 165, 2);
  flourCloud(ctx, r.x + r.w * 0.1, r.y + r.h * 0.8, r.w * 0.12, r.h * 0.08, 33, 0.22); flourCloud(ctx, r.x + r.w * 0.92, r.y + r.h * 0.6, r.w * 0.1, r.h * 0.08, 35, 0.2);
};
LITTER.kcnut = function (ctx, r, c) { for (let k = 0; k < 9; k++) { const x = r.x + r.w * hash(k, 71), y = r.y + r.h * (0.3 + hash(k, 72) * 0.7); ctx.save(); ctx.translate(x, y); ctx.rotate(hash(k, 73) * TAU); ctx.fillStyle = lg(ctx, -5, -4, 5, 4, [[0, tint(c, 0.25)], [1, tint(c, -0.3)]]); ctx.beginPath(); ctx.ellipse(0, 0, 5, 3.8, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(60,30,8,0.5)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, -3.6); ctx.lineTo(0, 3.6); ctx.stroke(); ctx.restore(); } };
registerProp('kc-dough-mould', (ctx, s) => { const R = s * 0.3; ctx.fillStyle = lg(ctx, -s * 0.5, 0, s * 0.5, 0, [[0, '#7a4a22'], [0.5, '#b27a42'], [1, '#52301a']]); rrect(ctx, R * 0.6, -s * 0.06, s * 0.4, s * 0.12, s * 0.05); ctx.fill(); ctx.beginPath(); ctx.ellipse(-s * 0.1, 0, R, R * 0.78, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a2008'; ctx.beginPath(); ctx.ellipse(-s * 0.1, 0, R * 0.78, R * 0.6, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(210,160,100,0.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(-s * 0.1, 0, R * 0.46, R * 0.36, 0, 0, TAU); ctx.stroke(); });

// ================================================ props for the dock (all kitchens) =================================================================
registerProp('kc-dough-pin', (ctx, s, o = {}) => { // a long thin dowel rolling pin
  const c = o.c ?? '#d0a468', h = s * 0.1;
  rrect(ctx, -s * 0.48, -h / 2, s * 0.96, h, h / 2); ctx.fillStyle = lg(ctx, 0, -h / 2, 0, h / 2, [[0, tint(c, 0.4)], [0.35, tint(c, 0.12)], [0.65, c], [1, tint(c, -0.5)]]); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-s * 0.4, -h * 0.2); ctx.lineTo(s * 0.4, -h * 0.2); ctx.stroke();
  ctx.fillStyle = 'rgba(255,252,244,0.55)'; ctx.fillRect(-s * 0.3, -h * 0.05, s * 0.4, 1.2);
});
registerProp('kc-dough-bowl', (ctx, s, o = {}) => { // a bowl seen from above and a little in front: o.c is what is in it
  const shell = o.shell ?? '#e8dcc4', fill = o.c ?? '#fffaf0', r = s * 0.34;
  cast(ctx, 0, r * 0.5, r * 1.05, r * 0.3, 0.38);
  ctx.fillStyle = lg(ctx, -r, 0, r, 0, [[0, tint(shell, -0.3)], [0.3, tint(shell, 0.15)], [0.7, shell], [1, tint(shell, -0.4)]]); ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.62, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.98, r * 0.6, 0, Math.PI * 1.05, Math.PI * 1.55); ctx.stroke();
  ctx.fillStyle = lg(ctx, -r, -r * 0.4, r * 0.8, r * 0.5, [[0, tint(fill, -0.18)], [0.4, fill], [1, tint(fill, 0.1)]]); ctx.beginPath(); ctx.ellipse(0, -r * 0.04, r * 0.82, r * 0.48, 0, 0, TAU); ctx.fill();
  flour(ctx, 0, -r * 0.04, r * 0.7, r * 0.4, 36, 9, 0.35, 1.6, tint(fill, 0.3)); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ell(ctx, -r * 0.3, -r * 0.22, r * 0.28, r * 0.08); ctx.fill();
});
registerProp('kc-dough-cleaver', (ctx, s) => { // a bench knife / dough scraper with a wooden handle
  const h = s * 0.18; rrect(ctx, -s * 0.5, -h * 0.28, s * 0.3, h * 0.56, h * 0.25); ctx.fillStyle = lg(ctx, 0, -h * 0.3, 0, h * 0.3, [[0, tint(wood, 0.35)], [0.5, wood], [1, tint(wood, -0.5)]]); ctx.fill();
  ctx.fillStyle = lg(ctx, 0, -h * 0.5, 0, h * 0.5, [[0, '#f4f7f9'], [0.45, '#b4bdc6'], [1, '#6e7882']]); ctx.beginPath(); ctx.moveTo(-s * 0.2, -h * 0.5); ctx.lineTo(s * 0.46, -h * 0.5); ctx.lineTo(s * 0.5, h * 0.5); ctx.lineTo(-s * 0.2, h * 0.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(-s * 0.18, -h * 0.44, s * 0.62, h * 0.08);
  ctx.fillStyle = '#c9ced4'; ctx.fillRect(-s * 0.22, -h * 0.32, 3, h * 0.64);
});
registerProp('kc-dough-spoon', (ctx, s, o = {}) => { // a wooden spoon
  const c = o.c ?? '#c89a58'; ctx.fillStyle = lg(ctx, 0, -s * 0.05, 0, s * 0.05, [[0, tint(c, 0.3)], [0.5, c], [1, tint(c, -0.45)]]);
  rrect(ctx, -s * 0.5, -s * 0.03, s * 0.66, s * 0.06, s * 0.03); ctx.fill(); ctx.beginPath(); ctx.ellipse(s * 0.3, 0, s * 0.2, s * 0.12, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(60,30,8,0.35)'; ctx.beginPath(); ctx.ellipse(s * 0.31, 0, s * 0.15, s * 0.08, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-s * 0.4, -s * 0.02, s * 0.4, 1.4);
});

const T = (caption, hint) => ({ caption, hint });
const scenes = {
  'kc-dough-levant': { wall: 'kclevwall', wallC: '#ecdcb8', wallK: 1.4, floor: 'kclevtable', floorC: '#cfae78', light: 'window', litter: [{ k: 'kcflour', c: '#fff6e0' }, { k: 'kcnut', c: '#b88a50' }], dock: ['kc-dough-bowl:#5a3220', 'kc-dough-bowl:#d8b078', 'kc-dough-mould', 'kc-dough-cleaver'], dockKind: 'ledge', frame: 'plinth', skin: '#d8a478', sleeve: '#e8e0cc', words: T('Mould these maamoul', 'Fill, press, level, knock out and arrange') },
  'kc-dough-italy': { wall: 'kcitwall', wallC: '#efe5d0', wallK: 1.4, floor: 'kcittable', floorC: '#b0825a', light: 'window', litter: [{ k: 'kcflour', c: '#fff0c0' }], dock: ['kc-dough-bowl:#e9c268', 'kc-dough-knife', 'kc-dough-bowl:#f4efe0', 'kc-dough-spoon'], dockKind: 'ledge', frame: 'plinth', skin: '#e6b48c', sleeve: '#d8dde6', words: T('Shape these orecchiette', 'Roll, cut, drag and flip over the thumb') },
  'kc-dough-china': { wall: 'kccnwall', wallC: '#e4d9bf', wallK: 1.4, floor: 'kccntable', floorC: '#d4b685', light: 'lamp', litter: [{ k: 'kcflour', c: '#fffaf0' }, { k: 'kcchive', c: '#7aa84a' }], dock: ['kc-dough-pin:#e0c690', 'kc-dough-bowl:#fffaf0', 'kc-dough-bowl:#b9755f', 'kc-dough-chopsticks'], dockKind: 'ledge', frame: 'plinth', skin: '#e8b890', sleeve: '#3a5a72', words: T('Pleat these jiaozi', 'Fill, fold, pleat toward the end and seal') },
  'kc-dough-georgia': { wall: 'kcgeowall', wallC: '#d6c19c', wallK: 1.4, floor: 'kcgeotable', floorC: '#b58a58', light: 'window', litter: [{ k: 'kcflour', c: '#fffaf0' }, { k: 'kcherb', c: '#5a9a3a' }], dock: ['kc-dough-pin', 'kc-dough-bowl:#fffaf0', 'kc-dough-bowl:#c98a78', 'kc-dough-cleaver'], dockKind: 'ledge', frame: 'plinth', skin: '#e3b08a', sleeve: '#efe6d2', words: T('Pleat this khinkali', 'Pinch the rim, fold it over the last pleat, and go round') },
};

// Walls and floors are baked: the still picture is drawn once into a layer; only the steam moves (WALL_OVER draws it every frame).
const WALL_OVER = {};
WALL_OVER.kcgeowall = (ctx, sc, r, H, t) => { const px = r.x + r.w * 0.19, pw = Math.min(r.w * 0.2, H * 0.85), top = r.y + H * 0.94 - H * 0.6; steam(ctx, px, top + H * 0.04, pw * 0.8, H * 0.46, t, 0.8, 3); steam(ctx, px + pw * 0.12, top + H * 0.04, pw * 0.6, H * 0.4, t + 2.2, 0.6, 5); };
WALL_OVER.kccnwall = (ctx, sc, r, H, t) => { const x = r.x + r.w * 0.6, w = Math.min(r.w * 0.24, H * 0.9), y = r.y + H * 0.97, h = H * 0.92, sh = h * 0.2; steam(ctx, x - w * 0.45, y - h * 0.12 - sh, w * 0.4, h * 0.5, t, 0.5, 6); steam(ctx, x + w * 0.45, y - h * 0.12 - sh * 2, w * 0.4, h * 0.45, t + 1.4, 0.45, 8); };
for (const [id, fn] of Object.entries(WALLS)) {
  WALLS[id] = (ctx, sc, r, H, t) => {
    const b = bake(ctx, `wall|${id}|${Math.round(r.w)}|${Math.round(H)}|${sc.wallC}`, r.w, H, (c2) => fn(c2, sc, { x: 0, y: 0, w: r.w, h: r.h }, H, null));
    if (b) ctx.drawImage(b.canvas, r.x, r.y, r.w, H); else fn(ctx, sc, r, H, null);
    WALL_OVER[id]?.(ctx, sc, r, H, t);
  };
}
for (const [id, fn] of Object.entries(FLOORS)) {
  FLOORS[id] = (ctx, r, c) => {
    const b = bake(ctx, `floor|${id}|${Math.round(r.w)}|${Math.round(r.h)}|${c}`, r.w, r.h, (c2) => fn(c2, { x: 0, y: 0, w: r.w, h: r.h }, c));
    if (b) ctx.drawImage(b.canvas, r.x, r.y, r.w, r.h); else fn(ctx, r, c);
  };
}
registerSceneSet({
  scenes: Object.fromEntries(Object.entries(scenes).map(([id, sc]) => [id, { ...sc, hang: [] }])),
  walls: WALLS, floorKinds: { kcgeotable: 'wood', kccntable: 'wood', kcittable: 'wood', kclevtable: 'slate' }, floorEx: FLOORS, litter: LITTER,
  soundMat: { 'kc-dough-georgia': 'clay', 'kc-dough-china': 'clay', 'kc-dough-italy': 'clay', 'kc-dough-levant': 'clay' },
});

// shape-craft 1.15.0: painted doll decoration for turned wooden figures (lathe, `vessel: 'fine'`, scene option `deco`).
// Each decoration is drawn in FRONT view, after the bands are glazed, inside the doll's silhouette and under the cylinder light:
// a face, hair, kerchief or motifs placed from the doll's own profile (head circle taken from `headAt`).
// Dolls are objects: faces are stylised marks (arcs, dots), never a portrait. Pure canvas 2D, deterministic (hash, never Math.random).
import { hash } from './geom.js';
import { tint, rgba, mix, lum } from './fx.js';

const TAU = Math.PI * 2;
const ell = (ctx, x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); };
const lgr = (ctx, x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); for (const [o, c] of stops) g.addColorStop(o, c); return g; };

// where the head is: centre y and radius, from the live profile
function head(g) {
  const { top, H, R, F } = g, hy = top + H * (F.headAt ?? 0.07);
  if (F.headK) return { hy, hr: R(Math.min(top + H, Math.max(top, hy))) * F.headK };   // 1.15.0: a head that is part of the body (daruma): a fraction of the body radius at `headAt`
  let hr = 0; for (let q = 0; q <= 8; q++) hr = Math.max(hr, R(top + (H * 0.22 * q) / 8));   // the widest point of the head rows
  return { hy, hr };
}
const ink = (g, k, d) => (g.F.decoInk && g.F.decoInk[k]) || d;

// a stylised eye: a curved upper lid with a short lash tick (no iris), or a small filled oval
function lid(ctx, x, y, w, c, lw, flip = 1) {
  ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - w, y + w * 0.12 * flip); ctx.quadraticCurveTo(x, y - w * 0.62, x + w, y + w * 0.12 * flip); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - w * 0.75, y + w * 0.1); ctx.quadraticCurveTo(x, y + w * 0.34, x + w * 0.75, y + w * 0.1); ctx.lineWidth = lw * 0.55; ctx.stroke();
}
// a chrysanthemum seen from the front: rings of long petals, a contrasting centre, drawn inside radius r
function chrys(ctx, x, y, r, c1, c2, c3, rings = 3, petals = 16, rot = 0) {
  for (let ring = 0; ring < rings; ring++) {
    const f = 1 - ring / rings, n = petals + ring * 2, c = ring % 2 ? c2 : c1, off = ring * 0.19;
    for (let q = 0; q < n; q++) {
      const a = (q * TAU) / n + rot + off;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(0, -r * f * 0.2); ctx.quadraticCurveTo(r * f * 0.2, -r * f * 0.55, 0, -r * f); ctx.quadraticCurveTo(-r * f * 0.2, -r * f * 0.55, 0, -r * f * 0.2); ctx.closePath();
      ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = rgba(tint(c, -0.5), 0.55); ctx.lineWidth = Math.max(0.6, r * 0.03); ctx.stroke();
      ctx.restore();
    }
  }
  ctx.fillStyle = c3; ell(ctx, x, y, r * 0.14, r * 0.14); ctx.fill(); ctx.strokeStyle = rgba('#000000', 0.35); ctx.lineWidth = 0.8; ctx.stroke();
}
function leaf(ctx, x, y, l, w, rot, c) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(w, -l * 0.5, 0, -l); ctx.quadraticCurveTo(-w, -l * 0.5, 0, 0); ctx.closePath();
  ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = rgba(tint(c, -0.5), 0.6); ctx.lineWidth = 0.8; ctx.stroke();
  ctx.strokeStyle = rgba(tint(c, 0.45), 0.7); ctx.beginPath(); ctx.moveTo(0, -l * 0.05); ctx.lineTo(0, -l * 0.92); ctx.stroke(); ctx.restore();
}
// horizontal painted rings across the body at height y, as thin parallel lines (lathe lines drawn with the skew tool)
function ringLine(ctx, g, y, c, lw, ev) {
  const r = g.R(y) * 0.995, N = 40; ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath();
  for (let j = 0; j <= N; j++) { const f = j / N, px = g.cx - r + f * 2 * r, u = (px - g.cx) / r, py = y + r * ev * Math.sqrt(Math.max(0, 1 - u * u)); j ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.stroke();
}

// finishing touches (lathe phase 'touch'): where each tap lands, in units of the head radius from the head centre; a feature is drawn only once its mark is painted
export const MARKS = {
  kokeshi: [{ k: 'eyeL', fx: -0.33, fy: 0.2 }, { k: 'eyeR', fx: 0.33, fy: 0.2 }, { k: 'mouth', fx: 0, fy: 0.6 }],
  tsuchiyu: [{ k: 'eyeL', fx: -0.34, fy: 0.12 }, { k: 'eyeR', fx: 0.34, fy: 0.12 }, { k: 'mouth', fx: 0, fy: 0.58 }],
  daruma: [{ k: 'eyeL', fx: -0.3, fy: -0.14, fr: 0.26 }, { k: 'eyeR', fx: 0.3, fy: -0.14, fr: 0.26 }],
  peg: [{ k: 'eyeL', fx: -0.3, fy: 0.12 }, { k: 'eyeR', fx: 0.3, fy: 0.12 }, { k: 'mouth', fx: 0, fy: 0.55 }],
  nutcracker: [{ k: 'eyeL', fx: -0.32, fy: 0.04 }, { k: 'eyeR', fx: 0.32, fy: 0.04 }, { k: 'mouth', fx: 0, fy: 0.5 }],
};
const on = (g, k) => !g.marks || !!g.marks[k];

export const DECO = {
  // ---- Naruko kokeshi: black bobbed hair with a straight fringe, a plain wooden face with tiny features, a chrysanthemum on the chest, rings at the hem ----
  kokeshi(ctx, g) {
    const { cx, top, base, H, R, ev } = g, { hy, hr } = head(g), dbg = g.F.decoP?.debug, hair = ink(g, 'hair', '#17110f'), red = ink(g, 'red', '#c4302b'), gold = ink(g, 'gold', '#e8b53a'), green = ink(g, 'green', '#2f7a46');
    if (dbg) { ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2; ell(ctx, cx, hy, hr, hr); ctx.stroke(); ctx.strokeStyle = '#f0f'; ctx.beginPath(); ctx.moveTo(cx - 90, top); ctx.lineTo(cx + 90, top); ctx.stroke(); }
    // hair: everything above the fringe, and the side locks that hang beside the face
    const fy = hy - hr * 0.1;
    ctx.fillStyle = lgr(ctx, cx - hr, 0, cx + hr, 0, [[0, '#0b0807'], [0.38, '#3a302b'], [0.55, hair], [1, '#080605']]);
    ctx.beginPath(); ctx.moveTo(cx - hr * 1.3, top - hr * 1.4); ctx.lineTo(cx + hr * 1.3, top - hr * 1.4); ctx.lineTo(cx + hr * 1.3, fy + hr * 0.08);
    ctx.bezierCurveTo(cx + hr * 0.6, fy + hr * 0.22, cx - hr * 0.6, fy + hr * 0.22, cx - hr * 1.3, fy + hr * 0.08); ctx.closePath(); ctx.fill();
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sx * hr * 1.3, fy); ctx.lineTo(cx + sx * hr * 0.74, fy + hr * 0.06); ctx.bezierCurveTo(cx + sx * hr * 0.7, fy + hr * 0.5, cx + sx * hr * 0.74, fy + hr * 0.85, cx + sx * hr * 0.9, hy + hr * 0.92); ctx.lineTo(cx + sx * hr * 1.3, hy + hr * 0.92); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = Math.max(1, hr * 0.03); ctx.beginPath(); ctx.moveTo(cx - hr * 0.55, fy - hr * 0.2); ctx.quadraticCurveTo(cx - hr * 0.1, fy - hr * 0.5, cx + hr * 0.4, fy - hr * 0.28); ctx.stroke();
    // a thin red ribbon at the parting
    ctx.fillStyle = red; ctx.beginPath(); ctx.ellipse(cx + hr * 0.02, top - hr * 0.12, hr * 0.16, hr * 0.06, 0, 0, TAU); ctx.fill();
    // face: lids, brows, nose, mouth, cheeks
    const lw = Math.max(1.1, hr * 0.045);
    for (const sx of [-1, 1]) if (on(g, sx < 0 ? 'eyeL' : 'eyeR')) { lid(ctx, cx + sx * hr * 0.33, hy + hr * 0.2, hr * 0.17, '#2a1a12', lw); ctx.strokeStyle = '#3a2418'; ctx.lineWidth = lw * 0.7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx + sx * hr * 0.54, hy + hr * 0.03); ctx.quadraticCurveTo(cx + sx * hr * 0.33, hy - hr * 0.03, cx + sx * hr * 0.14, hy + hr * 0.04); ctx.stroke(); }
    if (on(g, 'mouth')) {
    ctx.strokeStyle = '#b06a4a'; ctx.lineWidth = lw * 0.7; ctx.beginPath(); ctx.moveTo(cx - hr * 0.03, hy + hr * 0.32); ctx.quadraticCurveTo(cx + hr * 0.04, hy + hr * 0.4, cx - hr * 0.04, hy + hr * 0.44); ctx.stroke();
    ctx.fillStyle = red; ctx.beginPath(); ctx.moveTo(cx - hr * 0.13, hy + hr * 0.6); ctx.quadraticCurveTo(cx, hy + hr * 0.52, cx + hr * 0.13, hy + hr * 0.6); ctx.quadraticCurveTo(cx, hy + hr * 0.7, cx - hr * 0.13, hy + hr * 0.6); ctx.fill();
    for (const sx of [-1, 1]) { const cg = ctx.createRadialGradient(cx + sx * hr * 0.5, hy + hr * 0.5, 0, cx + sx * hr * 0.5, hy + hr * 0.5, hr * 0.26); cg.addColorStop(0, rgba(red, 0.4)); cg.addColorStop(1, rgba(red, 0)); ctx.fillStyle = cg; ctx.fillRect(cx + sx * hr * 0.5 - hr * 0.3, hy + hr * 0.2, hr * 0.6, hr * 0.6); }
    }
    // chest: a chrysanthemum with leaves, between the neck rings and the hem rings
    const by = top + H * (g.F.chestAt ?? 0.5), br = R(by);
    const cr = br * 0.62;
    leaf(ctx, cx - cr * 0.7, by + cr * 0.8, cr * 0.9, cr * 0.26, -1.0, green); leaf(ctx, cx + cr * 0.7, by + cr * 0.8, cr * 0.9, cr * 0.26, 1.0, green);
    chrys(ctx, cx, by, cr, red, gold, hair, 3, 14, 0.1);
    // rings at the neck and the hem: a thick red line between two fine ones
    for (const [f, c, w] of [[0.255, red, 0.026], [0.275, hair, 0.012], [0.9, red, 0.028], [0.935, hair, 0.012], [0.87, gold, 0.012]]) ringLine(ctx, g, top + H * f, c, Math.max(1, H * w), ev);
  },

  // ---- Tsuchiyu kokeshi: a long neck and slim body, black hair with a scalloped fringe under a red dotted hair band with a bow, round open eyes; plum blossoms and rings ----
  tsuchiyu(ctx, g) {
    const { cx, top, base, H, R, ev } = g, { hy, hr } = head(g), hair = ink(g, 'hair', '#15110f'), red = ink(g, 'red', '#c8282c'), indigo = ink(g, 'indigo', '#233a78'), pink = ink(g, 'pink', '#f2a6b4'), gold = ink(g, 'gold', '#e8b53a');
    // hair, scalloped fringe
    ctx.fillStyle = lgr(ctx, cx - hr, 0, cx + hr, 0, [[0, '#0a0706'], [0.4, '#352b27'], [0.58, hair], [1, '#070505']]);
    ctx.beginPath(); ctx.moveTo(cx - hr * 1.3, top - hr * 1.4); ctx.lineTo(cx + hr * 1.3, top - hr * 1.4); ctx.lineTo(cx + hr * 1.3, hy - hr * 0.08);
    const N = 7; for (let q = N; q >= 0; q--) { const x = cx - hr * 1.1 + (hr * 2.2 * q) / N, y = hy - hr * 0.02 + (q % 2 ? hr * 0.16 : hr * 0.02); ctx.lineTo(x, y); }
    ctx.lineTo(cx - hr * 1.3, hy - hr * 0.08); ctx.closePath(); ctx.fill();
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sx * hr * 1.3, hy - hr * 0.1); ctx.lineTo(cx + sx * hr * 0.78, hy - hr * 0.04); ctx.bezierCurveTo(cx + sx * hr * 0.74, hy + hr * 0.4, cx + sx * hr * 0.8, hy + hr * 0.7, cx + sx * hr * 0.92, hy + hr * 0.95); ctx.lineTo(cx + sx * hr * 1.3, hy + hr * 0.95); ctx.closePath(); ctx.fill(); }
    // the red dotted band across the head (tied hair cloth) with a bow at the side
    const by = hy - hr * 0.62; ctx.save(); ctx.beginPath(); ctx.moveTo(cx - hr * 1.3, by - hr * 0.13); ctx.quadraticCurveTo(cx, by - hr * 0.3, cx + hr * 1.3, by - hr * 0.13); ctx.lineTo(cx + hr * 1.3, by + hr * 0.13); ctx.quadraticCurveTo(cx, by - hr * 0.04, cx - hr * 1.3, by + hr * 0.13); ctx.closePath(); ctx.fillStyle = red; ctx.fill(); ctx.clip();
    ctx.fillStyle = '#f6e8e0'; for (let q = -6; q <= 6; q++) for (const dy of [-0.07, 0.07]) { ctx.beginPath(); ctx.arc(cx + q * hr * 0.2 + (dy > 0 ? hr * 0.1 : 0), by - hr * 0.08 + dy * hr + (q * q * 0.006) * hr, hr * 0.032, 0, TAU); ctx.fill(); } ctx.restore();
    for (const sx of [1]) { ctx.fillStyle = red; ctx.beginPath(); ctx.moveTo(cx + sx * hr * 0.62, by - hr * 0.16); ctx.quadraticCurveTo(cx + sx * hr * 0.98, by - hr * 0.5, cx + sx * hr * 0.9, by - hr * 0.12); ctx.quadraticCurveTo(cx + sx * hr * 0.8, by - hr * 0.2, cx + sx * hr * 0.62, by - hr * 0.16); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx + sx * hr * 0.62, by - hr * 0.16); ctx.quadraticCurveTo(cx + sx * hr * 1.0, by + hr * 0.2, cx + sx * hr * 0.82, by + hr * 0.14); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = Math.max(1, hr * 0.03); ctx.beginPath(); ctx.moveTo(cx - hr * 0.55, by - hr * 0.5); ctx.quadraticCurveTo(cx - hr * 0.1, by - hr * 0.78, cx + hr * 0.35, by - hr * 0.56); ctx.stroke();
    // face: round open eyes with a highlight, brows, a small mouth
    const lw = Math.max(1.1, hr * 0.04);
    for (const sx of [-1, 1]) if (on(g, sx < 0 ? 'eyeL' : 'eyeR')) {
      const ex = cx + sx * hr * 0.34, ey = hy + hr * 0.12;
      ctx.fillStyle = '#fbf3e6'; ell(ctx, ex, ey, hr * 0.14, hr * 0.105); ctx.fill(); ctx.strokeStyle = '#2a1a12'; ctx.lineWidth = lw; ctx.stroke();
      ctx.fillStyle = '#241812'; ell(ctx, ex + sx * hr * 0.01, ey + hr * 0.01, hr * 0.072, hr * 0.082); ctx.fill(); ctx.fillStyle = '#fff'; ell(ctx, ex - hr * 0.03, ey - hr * 0.035, hr * 0.025, hr * 0.025); ctx.fill();
      ctx.strokeStyle = '#3a2418'; ctx.lineWidth = lw * 0.8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx + sx * hr * 0.56, ey - hr * 0.17); ctx.quadraticCurveTo(cx + sx * hr * 0.36, ey - hr * 0.26, cx + sx * hr * 0.16, ey - hr * 0.17); ctx.stroke();
    }
    if (on(g, 'mouth')) { ctx.fillStyle = red; ell(ctx, cx, hy + hr * 0.58, hr * 0.1, hr * 0.045); ctx.fill(); ctx.strokeStyle = '#b06a4a'; ctx.lineWidth = lw * 0.7; ctx.beginPath(); ctx.moveTo(cx, hy + hr * 0.3); ctx.lineTo(cx - hr * 0.02, hy + hr * 0.4); ctx.stroke();
      for (const sx of [-1, 1]) { const cg = ctx.createRadialGradient(cx + sx * hr * 0.52, hy + hr * 0.4, 0, cx + sx * hr * 0.52, hy + hr * 0.4, hr * 0.24); cg.addColorStop(0, rgba(red, 0.35)); cg.addColorStop(1, rgba(red, 0)); ctx.fillStyle = cg; ctx.fillRect(cx + sx * hr * 0.52 - hr * 0.3, hy + hr * 0.1, hr * 0.6, hr * 0.6); } }
    // body: crossed collar lines under the neck, plum blossoms with a branch, and bands of rings
    const cy0 = top + H * 0.3; ctx.strokeStyle = red; ctx.lineWidth = Math.max(1.4, H * 0.014); ctx.lineCap = 'round';
    const cw = R(cy0) * 0.7; ctx.beginPath(); ctx.moveTo(cx - cw, cy0); ctx.lineTo(cx + cw * 0.15, cy0 + cw * 1.15); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx + cw, cy0); ctx.lineTo(cx - cw * 0.15, cy0 + cw * 1.15); ctx.stroke();
    const my = top + H * 0.6, mr = R(my); ctx.strokeStyle = '#4a3320'; ctx.lineWidth = Math.max(1.4, mr * 0.045); ctx.beginPath(); ctx.moveTo(cx - mr * 0.8, my + mr * 0.7); ctx.bezierCurveTo(cx - mr * 0.3, my + mr * 0.4, cx + mr * 0.1, my + mr * 0.5, cx + mr * 0.7, my - mr * 0.4); ctx.stroke();
    const ume = (x, y, r) => { for (let q = 0; q < 5; q++) { const a = (q * TAU) / 5 - 1.57; ctx.fillStyle = pink; ell(ctx, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.5, r * 0.44, a); ctx.fill(); ctx.strokeStyle = rgba(red, 0.55); ctx.lineWidth = 0.9; ctx.stroke(); } ctx.fillStyle = gold; ell(ctx, x, y, r * 0.2, r * 0.2); ctx.fill(); };
    ume(cx - mr * 0.3, my + mr * 0.15, mr * 0.34); ume(cx + mr * 0.34, my - mr * 0.1, mr * 0.28); ume(cx + mr * 0.05, my + mr * 0.55, mr * 0.24);
    for (const [f, c, w] of [[0.84, indigo, 0.03], [0.875, red, 0.016], [0.92, indigo, 0.03], [0.95, red, 0.012]]) ringLine(ctx, g, top + H * f, c, Math.max(1, H * w), ev);
  },

  // ---- Takasaki daruma: a round red egg, a white face panel with thick brows, whiskers and a beard, blank round eyes that are dotted last; gold waves at the foot ----
  daruma(ctx, g) {
    const { cx, top, base, H, R, ev } = g, { hy, hr } = head(g), red = ink(g, 'red', '#c41f26'), gold = ink(g, 'gold', '#e2ab35'), black = '#14100e';
    const wy = hy + hr * 0.12, fw = hr * 0.78, fh = hr * 0.8;   // the face panel: a rounded white shield
    ctx.save();
    ctx.beginPath(); ctx.moveTo(cx - fw, wy - fh * 0.1); ctx.bezierCurveTo(cx - fw * 1.06, wy - fh * 1.15, cx + fw * 1.06, wy - fh * 1.15, cx + fw, wy - fh * 0.1); ctx.bezierCurveTo(cx + fw * 1.02, wy + fh * 0.9, cx + fw * 0.4, wy + fh * 1.25, cx, wy + fh * 1.3); ctx.bezierCurveTo(cx - fw * 0.4, wy + fh * 1.25, cx - fw * 1.02, wy + fh * 0.9, cx - fw, wy - fh * 0.1); ctx.closePath();
    ctx.fillStyle = lgr(ctx, cx - fw, 0, cx + fw, 0, [[0, '#d9cfc2'], [0.35, '#fffaf0'], [1, '#d4c8b8']]); ctx.fill(); ctx.strokeStyle = gold; ctx.lineWidth = Math.max(1.5, hr * 0.045); ctx.stroke();
    ctx.clip();
    const lw = Math.max(1.2, hr * 0.04); ctx.lineCap = 'round';
    // thick arched brows that taper to a point
    for (const sx of [-1, 1]) { ctx.fillStyle = black; ctx.beginPath(); ctx.moveTo(cx + sx * hr * 0.08, wy - hr * 0.22); ctx.bezierCurveTo(cx + sx * hr * 0.3, wy - hr * 0.62, cx + sx * hr * 0.6, wy - hr * 0.6, cx + sx * hr * 0.7, wy - hr * 0.3); ctx.bezierCurveTo(cx + sx * hr * 0.55, wy - hr * 0.44, cx + sx * hr * 0.3, wy - hr * 0.44, cx + sx * hr * 0.08, wy - hr * 0.22); ctx.fill(); }
    // eyes: white almonds with a black rim, the pupil is added last
    for (const sx of [-1, 1]) { const ex = cx + sx * hr * 0.3, ey = wy - hr * 0.02;
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(ex - hr * 0.2, ey); ctx.quadraticCurveTo(ex, ey - hr * 0.2, ex + hr * 0.2, ey); ctx.quadraticCurveTo(ex, ey + hr * 0.15, ex - hr * 0.2, ey); ctx.fill(); ctx.strokeStyle = black; ctx.lineWidth = lw * 1.2; ctx.stroke();
      if (on(g, sx < 0 ? 'eyeL' : 'eyeR')) { ctx.fillStyle = black; ell(ctx, ex, ey - hr * 0.01, hr * 0.085, hr * 0.085); ctx.fill(); ctx.fillStyle = '#fff'; ell(ctx, ex - hr * 0.025, ey - hr * 0.04, hr * 0.022, hr * 0.022); ctx.fill(); } }
    // nose and moustache: curved tapering strokes
    ctx.strokeStyle = '#8a4a30'; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(cx, wy + hr * 0.04); ctx.quadraticCurveTo(cx + hr * 0.07, wy + hr * 0.2, cx, wy + hr * 0.26); ctx.stroke();
    ctx.strokeStyle = black; for (const sx of [-1, 1]) for (let q = 0; q < 4; q++) { ctx.lineWidth = lw * (1.5 - q * 0.22); ctx.beginPath(); ctx.moveTo(cx + sx * hr * 0.04, wy + hr * (0.33 + q * 0.05)); ctx.bezierCurveTo(cx + sx * hr * 0.3, wy + hr * (0.26 + q * 0.04), cx + sx * hr * 0.55, wy + hr * (0.36 + q * 0.06), cx + sx * hr * (0.68 - q * 0.05), wy + hr * (0.5 + q * 0.06)); ctx.stroke(); }
    // a beard of many fine strokes down to the chin
    ctx.lineWidth = lw * 0.9; for (let q = -5; q <= 5; q++) { const bx = cx + q * hr * 0.1; ctx.beginPath(); ctx.moveTo(bx, wy + hr * (0.62 - Math.abs(q) * 0.01)); ctx.quadraticCurveTo(bx + q * hr * 0.03, wy + hr * 0.8, bx * 0.94 + cx * 0.06, wy + hr * (1.05 - Math.abs(q) * 0.045)); ctx.stroke(); }
    ctx.restore();
    // gold waves at the foot and a gold line between face and body
    const gy = top + H * 0.82, gr = R(gy);
    ctx.save(); ctx.strokeStyle = gold; ctx.lineWidth = Math.max(1.2, H * 0.012);
    for (let row = 0; row < 3; row++) { const y = top + H * (0.78 + row * 0.07), rr = R(y) * 0.98, ww = rr * 0.32; for (let q = -4; q <= 4; q++) { const x = cx + q * ww * 0.9 + (row % 2 ? ww * 0.45 : 0); if (Math.abs(x - cx) > rr * 0.96) continue; ctx.beginPath(); ctx.arc(x, y, ww * 0.55, Math.PI, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, ww * 0.3, Math.PI, 0); ctx.stroke(); } }
    ctx.restore();
  },

  // ---- Val Gardena peg doll: a turned jointed doll in a painted dress: a spotted red kerchief and plaits, an apron with stitching, black shoes ----
  peg(ctx, g) {
    const { cx, top, base, H, R, ev } = g, { hy, hr } = head(g), hair = ink(g, 'hair', '#5a3418'), red = ink(g, 'red', '#c4282a'), blue = ink(g, 'blue', '#2b5aa4'), apron = ink(g, 'apron', '#f6efe0');
    // kerchief: a red cap with white spots tied under the chin, with hair showing at the sides
    ctx.fillStyle = lgr(ctx, cx - hr, 0, cx + hr, 0, [[0, shade(hair, -0.5)], [0.4, hair], [1, shade(hair, -0.6)]]);
    ctx.beginPath(); ctx.rect(cx - hr * 1.3, hy - hr * 0.2, hr * 2.6, hr * 1.25); ctx.fill();
    ctx.fillStyle = '#f3d4b0'; ctx.beginPath(); ctx.ellipse(cx, hy + hr * 0.3, hr * 0.7, hr * 0.78, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.moveTo(cx - hr * 1.3, top - hr * 1.4); ctx.lineTo(cx + hr * 1.3, top - hr * 1.4); ctx.lineTo(cx + hr * 1.3, hy + hr * 0.12); ctx.bezierCurveTo(cx + hr * 0.9, hy + hr * 0.02, cx + hr * 0.7, hy - hr * 0.3, cx + hr * 0.5, hy - hr * 0.2); ctx.quadraticCurveTo(cx, hy - hr * 0.62, cx - hr * 0.5, hy - hr * 0.2); ctx.bezierCurveTo(cx - hr * 0.7, hy - hr * 0.3, cx - hr * 0.9, hy + hr * 0.02, cx - hr * 1.3, hy + hr * 0.12); ctx.closePath(); ctx.fillStyle = red; ctx.fill(); ctx.clip();
    ctx.fillStyle = '#f7eee2'; for (let r2 = 0; r2 < 5; r2++) for (let q = -5; q <= 5; q++) { ctx.beginPath(); ctx.arc(cx + q * hr * 0.24 + (r2 % 2 ? hr * 0.12 : 0), top - hr * 0.9 + r2 * hr * 0.3, hr * 0.045, 0, TAU); ctx.fill(); } ctx.restore();
    // a knot under the chin
    ctx.fillStyle = red; ctx.beginPath(); ctx.moveTo(cx, hy + hr * 1.02); ctx.quadraticCurveTo(cx - hr * 0.4, hy + hr * 0.84, cx - hr * 0.3, hy + hr * 1.16); ctx.quadraticCurveTo(cx - hr * 0.05, hy + hr * 1.0, cx, hy + hr * 1.02); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx, hy + hr * 1.02); ctx.quadraticCurveTo(cx + hr * 0.4, hy + hr * 0.84, cx + hr * 0.3, hy + hr * 1.16); ctx.quadraticCurveTo(cx + hr * 0.05, hy + hr * 1.0, cx, hy + hr * 1.02); ctx.fill();
    // face: dot eyes with lashes, rosy cheeks, a little mouth
    for (const sx of [-1, 1]) if (on(g, sx < 0 ? 'eyeL' : 'eyeR')) { const ex = cx + sx * hr * 0.3, ey = hy + hr * 0.12; ctx.fillStyle = '#231712'; ell(ctx, ex, ey, hr * 0.065, hr * 0.085); ctx.fill(); ctx.fillStyle = '#fff'; ell(ctx, ex - hr * 0.02, ey - hr * 0.03, hr * 0.02, hr * 0.02); ctx.fill(); ctx.strokeStyle = '#231712'; ctx.lineWidth = Math.max(1, hr * 0.03); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ex + sx * hr * 0.06, ey - hr * 0.06); ctx.lineTo(ex + sx * hr * 0.14, ey - hr * 0.1); ctx.stroke(); }
    if (on(g, 'mouth')) { ctx.strokeStyle = '#b22a2a'; ctx.lineWidth = Math.max(1.4, hr * 0.05); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - hr * 0.12, hy + hr * 0.52); ctx.quadraticCurveTo(cx, hy + hr * 0.62, cx + hr * 0.12, hy + hr * 0.52); ctx.stroke();
      for (const sx of [-1, 1]) { const cg = ctx.createRadialGradient(cx + sx * hr * 0.46, hy + hr * 0.38, 0, cx + sx * hr * 0.46, hy + hr * 0.38, hr * 0.24); cg.addColorStop(0, 'rgba(226,90,90,0.5)'); cg.addColorStop(1, 'rgba(226,90,90,0)'); ctx.fillStyle = cg; ctx.fillRect(cx + sx * hr * 0.46 - hr * 0.3, hy + hr * 0.1, hr * 0.6, hr * 0.6); } }
    // dress: apron with a stitched edge and buttons, a blue hem and black shoes
    const ay = top + H * 0.5, ar = R(ay) * 0.7;
    ctx.beginPath(); ctx.moveTo(cx - ar * 0.55, top + H * 0.33); ctx.lineTo(cx + ar * 0.55, top + H * 0.33); ctx.bezierCurveTo(cx + ar * 1.0, top + H * 0.55, cx + ar * 1.1, top + H * 0.78, cx + ar * 1.1, top + H * 0.9); ctx.lineTo(cx - ar * 1.1, top + H * 0.9); ctx.bezierCurveTo(cx - ar * 1.1, top + H * 0.78, cx - ar * 1.0, top + H * 0.55, cx - ar * 0.55, top + H * 0.33); ctx.closePath();
    ctx.fillStyle = apron; ctx.fill(); ctx.strokeStyle = blue; ctx.lineWidth = Math.max(1.2, H * 0.01); ctx.setLineDash([H * 0.025, H * 0.018]); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = blue; for (let q = 0; q < 3; q++) { ell(ctx, cx, top + H * (0.4 + q * 0.07), ar * 0.07, ar * 0.07); ctx.fill(); }
    for (const sx of [-1, 1]) { const fx = cx + sx * ar * 0.55, fy = top + H * 0.64; for (let q = 0; q < 5; q++) { const a = (q * TAU) / 5; ctx.fillStyle = red; ell(ctx, fx + Math.cos(a) * ar * 0.13, fy + Math.sin(a) * ar * 0.13, ar * 0.08, ar * 0.08); ctx.fill(); } ctx.fillStyle = '#e8b53a'; ell(ctx, fx, fy, ar * 0.06, ar * 0.06); ctx.fill(); }
    ctx.fillStyle = '#1d1613'; ctx.fillRect(cx - R(base - H * 0.04) - 2, top + H * 0.94, R(base - H * 0.04) * 2 + 4, H * 0.07);
  },

  // ---- nutcracker: a turned soldier in a red coat with gold braid and buttons, white trousers, black boots, a tall hat, a white moustache, a wide mouth ----
  nutcracker(ctx, g) {
    const { cx, top, base, H, R, ev } = g, { hy, hr } = head(g), red = ink(g, 'red', '#b8241c'), gold = ink(g, 'gold', '#e2b43a'), black = '#16120f', white = '#f4efe4', blue = ink(g, 'blue', '#1f3a7a');
    // hat: black with a gold band, a brim ring and a plume
    const hatB = hy - hr * 0.52;
    ctx.fillStyle = lgr(ctx, cx - hr, 0, cx + hr, 0, [[0, '#050403'], [0.35, '#3a322c'], [0.6, black], [1, '#050403']]); ctx.beginPath(); ctx.rect(cx - hr * 1.4, top - hr * 2.2, hr * 2.8, hatB - (top - hr * 2.2)); ctx.fill();
    ctx.fillStyle = gold; ctx.fillRect(cx - hr * 1.4, hatB - hr * 0.3, hr * 2.8, hr * 0.12); ctx.fillRect(cx - hr * 1.4, hatB - hr * 0.08, hr * 2.8, hr * 0.06);
    ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(cx, hatB - hr * 0.75, hr * 0.16, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.stroke();
    // face: pale wood with a white moustache and brows
    ctx.fillStyle = '#f0d4b0'; ctx.beginPath(); ctx.rect(cx - hr * 1.4, hatB, hr * 2.8, hy + hr * 1.1 - hatB); ctx.fill();
    const lw = Math.max(1.2, hr * 0.045);
    ctx.fillStyle = white; ctx.beginPath(); ctx.moveTo(cx - hr * 0.12, hy + hr * 0.3); ctx.bezierCurveTo(cx - hr * 0.7, hy + hr * 0.18, cx - hr * 0.95, hy + hr * 0.5, cx - hr * 0.8, hy + hr * 0.62); ctx.bezierCurveTo(cx - hr * 0.5, hy + hr * 0.5, cx - hr * 0.2, hy + hr * 0.5, cx, hy + hr * 0.42); ctx.bezierCurveTo(cx + hr * 0.2, hy + hr * 0.5, cx + hr * 0.5, hy + hr * 0.5, cx + hr * 0.8, hy + hr * 0.62); ctx.bezierCurveTo(cx + hr * 0.95, hy + hr * 0.5, cx + hr * 0.7, hy + hr * 0.18, cx + hr * 0.12, hy + hr * 0.3); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(120,100,70,0.5)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#e8b890'; ctx.beginPath(); ctx.ellipse(cx, hy + hr * 0.2, hr * 0.13, hr * 0.17, 0, 0, TAU); ctx.fill();   // the nose
    for (const sx of [-1, 1]) { ctx.fillStyle = white; ctx.beginPath(); ctx.moveTo(cx + sx * hr * 0.58, hy - hr * 0.12); ctx.quadraticCurveTo(cx + sx * hr * 0.3, hy - hr * 0.32, cx + sx * hr * 0.1, hy - hr * 0.14); ctx.quadraticCurveTo(cx + sx * hr * 0.3, hy - hr * 0.2, cx + sx * hr * 0.58, hy - hr * 0.12); ctx.fill(); }
    for (const sx of [-1, 1]) if (on(g, sx < 0 ? 'eyeL' : 'eyeR')) { const ex = cx + sx * hr * 0.32, ey = hy + hr * 0.04; ctx.fillStyle = '#fff'; ell(ctx, ex, ey, hr * 0.13, hr * 0.09); ctx.fill(); ctx.strokeStyle = black; ctx.lineWidth = lw; ctx.stroke(); ctx.fillStyle = '#2a4a8a'; ell(ctx, ex, ey, hr * 0.06, hr * 0.06); ctx.fill(); ctx.fillStyle = black; ell(ctx, ex, ey, hr * 0.03, hr * 0.03); ctx.fill(); }
    if (on(g, 'mouth')) { ctx.fillStyle = '#4a1010'; ctx.beginPath(); ctx.moveTo(cx - hr * 0.5, hy + hr * 0.62); ctx.quadraticCurveTo(cx, hy + hr * 0.95, cx + hr * 0.5, hy + hr * 0.62); ctx.quadraticCurveTo(cx, hy + hr * 0.7, cx - hr * 0.5, hy + hr * 0.62); ctx.fill(); ctx.fillStyle = white; for (let q = -3; q <= 3; q++) ctx.fillRect(cx + q * hr * 0.12 - hr * 0.045, hy + hr * 0.67 + Math.abs(q) * hr * 0.012, hr * 0.09, hr * 0.07); }
    // coat: gold buttons and braid, white crossbelt, black belt with a buckle, epaulettes
    const cy1 = top + H * 0.38, cy2 = top + H * 0.62, cr = R(top + H * 0.5);
    for (const sx of [-1, 1]) { ctx.fillStyle = gold; for (let q = 0; q < 5; q++) { ell(ctx, cx + sx * cr * 0.28, cy1 + ((cy2 - cy1) * (q + 0.3)) / 5, cr * 0.055, cr * 0.055); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.8; ctx.stroke(); } ctx.strokeStyle = gold; ctx.lineWidth = Math.max(1.5, cr * 0.04); ctx.beginPath(); ctx.moveTo(cx + sx * cr * 0.42, cy1 - cr * 0.1); ctx.lineTo(cx + sx * cr * 0.42, cy2); ctx.stroke(); ctx.beginPath(); ctx.ellipse(cx + sx * cr * 0.98, cy1 - cr * 0.12, cr * 0.2, cr * 0.1, sx * 0.4, 0, TAU); ctx.fillStyle = gold; ctx.fill(); }
    ctx.strokeStyle = white; ctx.lineWidth = Math.max(2, cr * 0.1); ctx.beginPath(); ctx.moveTo(cx - cr, cy1 - cr * 0.1); ctx.lineTo(cx + cr, cy2 + cr * 0.05); ctx.stroke();
    ctx.fillStyle = black; ctx.fillRect(cx - cr * 1.1, top + H * 0.62, cr * 2.2, H * 0.035); ctx.fillStyle = gold; ctx.fillRect(cx - cr * 0.14, top + H * 0.62, cr * 0.28, H * 0.035); ctx.strokeStyle = black; ctx.lineWidth = 1; ctx.strokeRect(cx - cr * 0.14, top + H * 0.62, cr * 0.28, H * 0.035);
    // trousers seam and boot tops
    ctx.strokeStyle = 'rgba(60,70,100,0.55)'; ctx.lineWidth = Math.max(1, cr * 0.03); ctx.beginPath(); ctx.moveTo(cx, top + H * 0.66); ctx.lineTo(cx, top + H * 0.9); ctx.stroke();
    ctx.fillStyle = gold; ctx.fillRect(cx - R(top + H * 0.9) - 2, top + H * 0.895, R(top + H * 0.9) * 2 + 4, H * 0.014);
    void red; void blue; void ev; void base;
  },
};
function shade(hex, f) { return tint(hex, f); }

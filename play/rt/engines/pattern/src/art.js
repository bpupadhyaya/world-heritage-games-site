// Pattern engine art: procedural materials (woven cloth, resist dye, block print, embroidery, plaster paint, glazed tile, inlaid wood,
// floor powder, beads, wet ink, raked sand), stamps with form, frames and lighting. Pure canvas 2D, no DOM, no Math.random:
// every irregularity comes from `hash`, so a picture is a pure function of (cells, clock).
// Performance: textures are drawn as a few batched paths per frame (dash-patterned thread lines, one path of speckles), never per pixel.

// ---- colour helpers ---------------------------------------------------------------------------------------------------------
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function parse(c) {
  let h = String(c || '#000').replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  const n = parseInt(h.slice(0, 6), 16);
  const v = Number.isFinite(n) ? n : 0;
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
const hx = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
export const toHex = ([r, g, b]) => `#${hx(r)}${hx(g)}${hx(b)}`;
export const rgba = (c, a) => { const [r, g, b] = parse(c); return `rgba(${r},${g},${b},${a})`; };
export const mix = (a, b, t) => { const A = parse(a), B = parse(b); return toHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]); };
export const shade = (c, t) => (t >= 0 ? mix(c, '#ffffff', t) : mix(c, '#000000', -t));
export const lum = (c) => { const [r, g, b] = parse(c); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
// Deterministic hash noise in [0,1).
export function hash(a, b = 0, c = 0) {
  let x = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1442695041)) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177); x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}
export const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

// ---- which material does a tradition use? ------------------------------------------------------------------------------------
// `params.material` wins; otherwise the title (then the summary) is read for the craft's own words.
export const MATERIAL_NAMES = ['weave', 'dye', 'print', 'stitch', 'paint', 'tile', 'wood', 'powder', 'bead', 'ink', 'sand'];
const RULES = [
  ['bead', /bead|lukasa/], ['sand', /gravel|karesansui|raked/], ['tile', /tile|mosaic|zellij|pavement|calçada|cobble/],
  ['powder', /rangoli|kolam|alpana|alpona|powder|chalk|floor pattern/], ['ink', /henna|mehndi|mehendi|sugar|syrup|tanghua|calligraph|\bink\b/],
  ['stitch', /stitch|embroider|needle|lace|sashiko|tatreez|phulkari|suzani|temari|thread.ball|ñandut/],
  ['print', /print|stamp/], ['dye', /dye|dyed|dyeing|indigo|batik|resist|mud.?cloth|bogolan|ikat|shibori/],
  ['paint', /paint|wall|truck|lacquer|enamel|alebrije|khokhloma|warli|mural/], ['wood', /lattice|wood|joinery|mashrabiya|kumiko|marquetry|inlay/],
  ['weave', /weav|loom|woven|knit|carpet|rug|tartan|raffia|cloth|knot|songket|kente|dhaka|lamba/],
];
export function pickMaterial(param, title = '', summary = '') {
  if (MATERIAL_NAMES.includes(param)) return param;
  const t = String(title).toLowerCase();
  for (const [m, re] of RULES) if (re.test(t)) return m;
  const s = String(summary).toLowerCase();
  for (const [m, re] of RULES) if (re.test(s)) return m;
  return 'weave';
}

// ---- motif geometry ----------------------------------------------------------------------------------------------------------
const FILLED = new Set(['solid', 'diamond', 'dot', 'cross', 'triangle', 'stripe-h', 'stripe-v', 'checker', 'leaf', 'hexagon', 'arch', 'star', 'flower', 'bird', 'fish', 'petal', 'kalka']);
export const isFilled = (kind) => FILLED.has(kind);
const LW = { ring: 0.12, wave: 0.14, zigzag: 0.14, spiral: 0.12, fret: 0.13, xstitch: 0.16, knot: 0.18, vine: 0.09 };
export const lineWidthOf = (kind, s) => Math.max(3, s * (LW[kind] ?? 0.12));
// Builds the path of one stamp (no fill or stroke). Returns nothing; use isFilled(kind) and lineWidthOf(kind, s).
export function motifPath(ctx, kind, x, y, s) {
  const h = s / 2, q = s * 0.14;
  const poly = (pts) => { ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath(); };
  ctx.beginPath();
  switch (kind) {
    case 'solid': ctx.rect(x - h + 1, y - h + 1, s - 2, s - 2); break;
    case 'diamond': poly([[x, y - h * 0.9], [x + h * 0.9, y], [x, y + h * 0.9], [x - h * 0.9, y]]); break;
    case 'dot': ctx.arc(x, y, s * 0.26, 0, Math.PI * 2); break;
    case 'ring': ctx.arc(x, y, s * 0.32, 0, Math.PI * 2); break;
    case 'cross': ctx.rect(x - q, y - h * 0.8, q * 2, h * 1.6); ctx.rect(x - h * 0.8, y - q, h * 1.6, q * 2); break;
    case 'triangle': poly([[x, y - h * 0.85], [x + h * 0.85, y + h * 0.7], [x - h * 0.85, y + h * 0.7]]); break;
    case 'stripe-h': for (let i = -1; i <= 1; i++) ctx.rect(x - h * 0.85, y + i * s * 0.3 - q * 0.7, h * 1.7, q * 1.4); break;
    case 'stripe-v': for (let i = -1; i <= 1; i++) ctx.rect(x + i * s * 0.3 - q * 0.7, y - h * 0.85, q * 1.4, h * 1.7); break;
    case 'checker': ctx.rect(x - h * 0.8, y - h * 0.8, h * 0.8, h * 0.8); ctx.rect(x, y, h * 0.8, h * 0.8); break;
    case 'wave': for (let i = 0; i <= 12; i++) { const px = x - h * 0.85 + (i / 12) * h * 1.7, py = y + Math.sin((i / 12) * Math.PI * 2) * h * 0.4; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); } break;
    case 'zigzag': [[-0.85, 0.35], [-0.42, -0.35], [0, 0.35], [0.42, -0.35], [0.85, 0.35]].forEach(([dx, dy], i) => (i ? ctx.lineTo(x + dx * h, y + dy * h) : ctx.moveTo(x + dx * h, y + dy * h))); break;
    case 'spiral': for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 4, r = (i / 40) * h * 0.8; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); } break;
    case 'fret': [[-0.8, 0.8], [-0.8, -0.8], [0.8, -0.8], [0.8, 0.3], [-0.2, 0.3], [-0.2, -0.3], [0.3, -0.3]].forEach(([dx, dy], i) => (i ? ctx.lineTo(x + dx * h, y + dy * h) : ctx.moveTo(x + dx * h, y + dy * h))); break;
    case 'leaf': ctx.moveTo(x - h * 0.8, y + h * 0.5); ctx.quadraticCurveTo(x - h * 0.2, y - h * 0.95, x + h * 0.85, y - h * 0.6); ctx.quadraticCurveTo(x + h * 0.3, y + h * 0.8, x - h * 0.8, y + h * 0.5); ctx.closePath(); break;
    case 'hexagon': { const pts = []; for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; pts.push([x + Math.cos(a) * h * 0.85, y + Math.sin(a) * h * 0.85]); } poly(pts); break; }
    case 'arch': ctx.moveTo(x - h * 0.7, y + h * 0.8); ctx.lineTo(x - h * 0.7, y - h * 0.1); ctx.arc(x, y - h * 0.1, h * 0.7, Math.PI, 0); ctx.lineTo(x + h * 0.7, y + h * 0.8); ctx.closePath(); break;
    case 'xstitch': ctx.moveTo(x - h * 0.6, y - h * 0.6); ctx.lineTo(x + h * 0.6, y + h * 0.6); ctx.moveTo(x + h * 0.6, y - h * 0.6); ctx.lineTo(x - h * 0.6, y + h * 0.6); break;
    case 'star': { const pts = []; for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 - Math.PI / 2, r = i % 2 ? h * 0.38 : h * 0.9; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } poly(pts); break; }
    // 1.9.0 outline-style motifs of pen-drawn cloth: a blossom of six petals round a seed, a perched bird facing right, a vine with leaves
    case 'flower': {
      for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3 - Math.PI / 2, ax = Math.cos(a), ay = Math.sin(a), l = Math.cos(a - 0.55), m = Math.sin(a - 0.55), l2 = Math.cos(a + 0.55), m2 = Math.sin(a + 0.55);
        ctx.moveTo(x + ax * h * 0.16, y + ay * h * 0.16); ctx.quadraticCurveTo(x + l * h * 0.78, y + m * h * 0.78, x + ax * h * 0.95, y + ay * h * 0.95); ctx.quadraticCurveTo(x + l2 * h * 0.78, y + m2 * h * 0.78, x + ax * h * 0.16, y + ay * h * 0.16); ctx.closePath(); }
      ctx.moveTo(x + h * 0.2, y); ctx.arc(x, y, h * 0.2, 0, Math.PI * 2); break;
    }
    case 'bird': {
      const P = (px, py) => [x + px * h, y + py * h];
      const mv = (px, py) => ctx.moveTo(...P(px, py)), qc = (cx2, cy2, px, py) => ctx.quadraticCurveTo(...P(cx2, cy2), ...P(px, py)), ln = (px, py) => ctx.lineTo(...P(px, py));
      mv(0.86, -0.2); qc(0.78, -0.55, 0.45, -0.66); qc(0.12, -0.82, -0.04, -0.5); qc(-0.1, -0.2, -0.3, -0.04); qc(-0.55, 0.2, -0.9, 0.78); ln(-0.6, 0.82); qc(-0.22, 0.46, 0.06, 0.5);
      qc(0.42, 0.56, 0.54, 0.2); qc(0.66, -0.02, 0.6, -0.1); qc(0.7, -0.12, 0.86, -0.2); ctx.closePath(); break;
    }
    case 'vine': {
      const P = (px, py) => [x + px * h, y + py * h];
      ctx.moveTo(...P(-0.9, 0.55)); ctx.bezierCurveTo(...P(-0.35, 0.8), ...P(-0.25, 0.05), ...P(0.05, -0.1)); ctx.bezierCurveTo(...P(0.35, -0.25), ...P(0.6, -0.75), ...P(0.9, -0.5));
      const leaf = (px, py, ang, L) => { const ca = Math.cos(ang), sa = Math.sin(ang), nx = -sa, ny = ca; ctx.moveTo(...P(px, py)); ctx.quadraticCurveTo(...P(px + ca * L * 0.5 + nx * L * 0.3, py + sa * L * 0.5 + ny * L * 0.3), ...P(px + ca * L, py + sa * L)); ctx.quadraticCurveTo(...P(px + ca * L * 0.5 - nx * L * 0.3, py + sa * L * 0.5 - ny * L * 0.3), ...P(px, py)); };
      leaf(-0.5, 0.62, -1.05, 0.5); leaf(-0.16, 0.12, 1.15, 0.45); leaf(0.3, -0.2, -0.6, 0.5); leaf(0.62, -0.58, 0.5, 0.36);
      ctx.moveTo(...P(0.05, -0.1)); ctx.bezierCurveTo(...P(-0.05, -0.45), ...P(-0.3, -0.5), ...P(-0.32, -0.3)); break;
    }
    // 1.10.0 kantha motifs: a fish seen from the side (nose right, forked tail, an eye), a pointed petal, and the kalka (paisley mango): a full body
    // that tapers to a curled tip, with a small seed hole
    case 'fish': {
      const P = (px, py) => [x + px * h, y + py * h];
      ctx.moveTo(...P(0.92, 0.04)); ctx.quadraticCurveTo(...P(0.4, -0.68), ...P(-0.36, -0.2)); ctx.lineTo(...P(-0.9, -0.58)); ctx.quadraticCurveTo(...P(-0.66, 0), ...P(-0.9, 0.58)); ctx.lineTo(...P(-0.36, 0.2)); ctx.quadraticCurveTo(...P(0.4, 0.68), ...P(0.92, 0.04)); ctx.closePath();
      ctx.moveTo(...P(0.66, -0.02)); ctx.arc(x + h * 0.52, y - h * 0.02, h * 0.09, 0, Math.PI * 2, true); break;
    }
    case 'petal': {
      const P = (px, py) => [x + px * h, y + py * h];
      ctx.moveTo(...P(0, 0.92)); ctx.bezierCurveTo(...P(0.95, 0.34), ...P(0.78, -0.5), ...P(0, -0.92)); ctx.bezierCurveTo(...P(-0.78, -0.5), ...P(-0.95, 0.34), ...P(0, 0.92)); ctx.closePath(); break;
    }
    case 'kalka': {
      const P = (px, py) => [x + px * h, y + py * h];
      ctx.moveTo(...P(0.52, -0.92)); ctx.bezierCurveTo(...P(-0.04, -0.9), ...P(-0.84, -0.42), ...P(-0.74, 0.28)); ctx.bezierCurveTo(...P(-0.66, 0.86), ...P(0.12, 1.0), ...P(0.56, 0.66));
      ctx.bezierCurveTo(...P(0.96, 0.34), ...P(0.82, -0.24), ...P(0.36, -0.32)); ctx.bezierCurveTo(...P(0.52, -0.46), ...P(0.66, -0.7), ...P(0.52, -0.92)); ctx.closePath();
      ctx.moveTo(...P(-0.1, 0.38)); ctx.arc(x - h * 0.2, y + h * 0.38, h * 0.2, 0, Math.PI * 2, true); break;
    }
    default: break;
  }
}

// ---- one stamp, painted in a material ----------------------------------------------------------------------------------------
// (x, y) centre, s size, col colour, key a per-cell number for deterministic irregularity, bg the ground colour of the board.
export function drawStamp(ctx, mat, kind, x, y, s, col, key, bg) {
  const fill = isFilled(kind), lw = lineWidthOf(kind, s), h = s / 2;
  const dark = shade(col, -0.42), light = shade(col, 0.45);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const build = () => motifPath(ctx, kind, x, y, s);
  const solid = (c, a = 1, grow = 0) => {
    build(); ctx.globalAlpha = a;
    if (fill) { ctx.fillStyle = c; ctx.fill(); if (grow) { ctx.strokeStyle = c; ctx.lineWidth = grow; ctx.stroke(); } }
    else { ctx.strokeStyle = c; ctx.lineWidth = lw + grow; ctx.stroke(); }
    ctx.globalAlpha = 1;
  };
  const edge = (c, a, w, dx = 0, dy = 0) => { ctx.save(); ctx.translate(dx, dy); build(); ctx.globalAlpha = a; ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke(); ctx.restore(); };
  // Inner bevel: clip to the stamp and stroke its outline shifted both ways (dark low-right, light high-left).
  const bevel = (d, w, aDark, aLight) => {
    if (!fill) return;
    ctx.save(); build(); ctx.clip();
    ctx.translate(d, d); build(); ctx.globalAlpha = aDark; ctx.strokeStyle = '#000'; ctx.lineWidth = w; ctx.stroke();
    ctx.translate(-2 * d, -2 * d); build(); ctx.globalAlpha = aLight; ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.restore();
  };
  const knotPaint = (under, over) => {
    // Two bands crossing; the under band is cut at the crossing and the over band casts an edge, so no ground-coloured patch is needed.
    const a = h * 0.8, gap = lw * 0.95;
    const seg = (x1, y1, x2, y2, c, w) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke(); };
    const k = gap / (a * 2) * 0.5; // fraction of the diagonal to leave out each side of the centre
    const u = under, o = over;
    seg(x - a, y - a, x - a * k * 2, y - a * k * 2, dark, lw + 2.5); seg(x + a * k * 2, y + a * k * 2, x + a, y + a, dark, lw + 2.5);
    seg(x - a, y - a, x - a * k * 2, y - a * k * 2, u, lw); seg(x + a * k * 2, y + a * k * 2, x + a, y + a, u, lw);
    seg(x + a, y - a, x - a, y + a, dark, lw + 2.5); seg(x + a, y - a, x - a, y + a, o, lw);
    seg(x + a * 0.9, y - a * 0.9, x - a * 0.9, y + a * 0.9, light, lw * 0.28);
  };
  if (kind === 'knot') { knotPaint(shade(col, -0.12), col); return; }

  switch (mat) {
    case 'weave':
      solid(dark, 0.4, s * 0.06); solid(col);
      if (fill) bevel(s * 0.025, s * 0.06, 0.18, 0.12); else edge(light, 0.35, lw * 0.3, -lw * 0.12, -lw * 0.12);
      break;
    case 'dye': {
      // Dye wicks into the cloth: a faint wide halo, the body slightly translucent, a darker pooled edge.
      solid(col, 0.14, s * 0.18); solid(col, 0.26, s * 0.08); solid(col, 0.94);
      edge(dark, 0.3, Math.max(1.5, s * 0.03));
      break;
    }
    case 'print': {
      // Block print: ink sits a hair off register, thicker at the block's rim, with small unprinted flecks.
      solid(dark, 0.28, s * 0.03); ctx.save(); ctx.translate(s * 0.018, s * 0.012); solid(col, 0.4); ctx.restore();
      solid(col, 0.93); edge(dark, 0.26, Math.max(1.5, s * 0.04));
      ctx.fillStyle = bg; ctx.globalAlpha = 0.4;
      for (let i = 0; i < 4; i++) { const px = x + (hash(key, i) - 0.5) * s * 0.7, py = y + (hash(key, i + 7) - 0.5) * s * 0.7; ctx.beginPath(); ctx.arc(px, py, Math.max(0.8, s * 0.018 * (1 + hash(key, i + 3))), 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
      break;
    }
    case 'stitch': {
      // Thread stands proud: a shadow on the cloth, the thread, and a bright sheen line (satin hatching on filled shapes).
      edge('#000', 0.38, fill ? Math.max(1.5, s * 0.04) : lw + 2, s * 0.018, s * 0.028);
      solid(col);
      if (fill) {
        ctx.save(); build(); ctx.clip();
        const p = Math.max(2.2, s * 0.075); ctx.lineWidth = Math.max(1, p * 0.42);
        ctx.beginPath(); for (let k = -3; k < s / p + 3; k++) { ctx.moveTo(x - h + k * p, y + h); ctx.lineTo(x - h + k * p + s * 0.5, y - h); }
        ctx.globalAlpha = 0.34; ctx.strokeStyle = light; ctx.stroke();
        ctx.translate(p * 0.5, 0); ctx.globalAlpha = 0.2; ctx.strokeStyle = dark; ctx.stroke();
        ctx.restore(); ctx.globalAlpha = 1;
        edge(dark, 0.4, Math.max(1.2, s * 0.03));
      } else { edge(light, 0.6, lw * 0.34, -lw * 0.14, -lw * 0.16); edge(dark, 0.22, lw * 0.18, lw * 0.18, lw * 0.2); }
      break;
    }
    case 'paint': {
      // Paint on plaster: a soft contact shadow, flat colour with brush streaks and a gentle bevel where it stands off the wall.
      edge('#000', 0.28, fill ? Math.max(2, s * 0.05) : lw + 3, s * 0.02, s * 0.03);
      solid(col);
      if (fill) {
        ctx.save(); build(); ctx.clip(); ctx.lineWidth = Math.max(1, s * 0.02); ctx.beginPath();
        for (let i = 0; i < 5; i++) { const yy = y - h + s * (0.12 + i * 0.19 + (hash(key, i) - 0.5) * 0.08); ctx.moveTo(x - h, yy); ctx.lineTo(x + h, yy + (hash(key, i + 9) - 0.5) * s * 0.05); }
        ctx.globalAlpha = 0.16; ctx.strokeStyle = light; ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1;
        bevel(s * 0.03, s * 0.08, 0.24, 0.2);
      } else edge(light, 0.4, lw * 0.3, -lw * 0.14, -lw * 0.16);
      break;
    }
    case 'tile': {
      // Glaze: gradient body, bright rim top-left, deep rim bottom-right, a gloss sheen.
      build();
      const gr = ctx.createLinearGradient(x - h, y - h, x + h, y + h);
      gr.addColorStop(0, shade(col, 0.28)); gr.addColorStop(0.55, col); gr.addColorStop(1, shade(col, -0.3));
      if (fill) { ctx.fillStyle = gr; ctx.fill(); } else { ctx.strokeStyle = gr; ctx.lineWidth = lw; ctx.stroke(); }
      if (fill) {
        bevel(s * 0.035, s * 0.1, 0.34, 0.4);
        ctx.save(); build(); ctx.clip();
        const gl = ctx.createLinearGradient(x - h, y - h, x + h * 0.2, y + h * 0.6);
        gl.addColorStop(0, 'rgba(255,255,255,0.46)'); gl.addColorStop(0.5, 'rgba(255,255,255,0.08)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gl; ctx.fillRect(x - h, y - h, s, s); ctx.restore();
      } else edge('#fff', 0.45, lw * 0.3, -lw * 0.14, -lw * 0.16);
      break;
    }
    case 'wood': {
      // Inlaid or turned wood: drop shadow into the recess, grain lines, bevelled edge.
      edge('#000', 0.42, fill ? Math.max(2, s * 0.06) : lw + 3, s * 0.03, s * 0.04);
      solid(col);
      if (fill) {
        ctx.save(); build(); ctx.clip(); ctx.beginPath();
        const p = Math.max(2.4, s * 0.085);
        for (let k = -1; k < s / p + 1; k++) { const yy = y - h + k * p; ctx.moveTo(x - h, yy); ctx.bezierCurveTo(x - h * 0.3, yy + (hash(key, k) - 0.5) * p * 1.6, x + h * 0.3, yy - (hash(key, k + 11) - 0.5) * p * 1.6, x + h, yy + (hash(key, k + 5) - 0.5) * p); }
        ctx.lineWidth = Math.max(0.8, p * 0.18); ctx.globalAlpha = 0.2; ctx.strokeStyle = dark; ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1;
        bevel(s * 0.03, s * 0.09, 0.32, 0.3);
      } else { edge(light, 0.5, lw * 0.3, -lw * 0.14, -lw * 0.16); }
      break;
    }
    case 'powder': {
      // Coloured powder poured through the fingers: a soft spilled halo, a grainy body, bright specks.
      solid(col, 0.2, s * 0.16); solid(col, 0.5, s * 0.07); solid(col, 0.9);
      ctx.fillStyle = light; ctx.globalAlpha = 0.5;
      for (let i = 0; i < 8; i++) { const a = hash(key, i) * 6.283, r = s * (0.08 + 0.42 * hash(key, i + 20)); ctx.fillRect(x + Math.cos(a) * r, y + Math.sin(a) * r, Math.max(1, s * 0.025), Math.max(1, s * 0.025)); }
      ctx.fillStyle = col; ctx.globalAlpha = 0.8;
      for (let i = 0; i < 7; i++) { const a = hash(key, i + 40) * 6.283, r = s * (0.38 + 0.26 * hash(key, i + 60)); ctx.fillRect(x + Math.cos(a) * r, y + Math.sin(a) * r, Math.max(1, s * 0.03), Math.max(1, s * 0.03)); }
      ctx.globalAlpha = 1;
      break;
    }
    case 'bead': {
      // A field of round glass beads inside the stamp's outline.
      const n = 4, p = s / n;
      ctx.save();
      if (fill) { build(); ctx.clip(); }
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const bx = x - h + (i + 0.5) * p, by = y - h + (j + 0.5) * p;
        if (!fill) continue;
        beadAt(ctx, bx, by, p * 0.46, col);
      }
      ctx.restore();
      if (!fill) { const m = Math.max(3, p * 0.7); ctx.save(); build(); ctx.strokeStyle = col; ctx.lineWidth = m; ctx.stroke(); ctx.strokeStyle = rgba('#fff', 0.5); ctx.lineWidth = m * 0.22; ctx.translate(-m * 0.12, -m * 0.14); build(); ctx.stroke(); ctx.restore(); }
      break;
    }
    case 'ink': {
      // Wet paste or syrup: dark rim, body, a long glossy highlight.
      edge('#000', 0.3, fill ? Math.max(2, s * 0.05) : lw + 2.5, s * 0.015, s * 0.025);
      solid(col);
      if (fill) { bevel(s * 0.03, s * 0.09, 0.3, 0.45); } else { edge(light, 0.65, lw * 0.3, -lw * 0.16, -lw * 0.2); edge(dark, 0.3, lw * 0.16, lw * 0.2, lw * 0.22); }
      break;
    }
    case 'sand': {
      // Filled shapes are stones standing in the gravel; lines are grooves raked into it.
      if (fill) {
        edge('#000', 0.35, Math.max(3, s * 0.08), s * 0.04, s * 0.06);
        build(); const gr = ctx.createRadialGradient(x - h * 0.3, y - h * 0.35, s * 0.05, x, y, h * 1.05);
        gr.addColorStop(0, shade(col, 0.4)); gr.addColorStop(0.6, col); gr.addColorStop(1, shade(col, -0.45));
        ctx.fillStyle = gr; ctx.fill(); bevel(s * 0.03, s * 0.08, 0.25, 0.25);
      } else { edge('#000', 0.35, lw + 2, lw * 0.18, lw * 0.22); solid(col); edge(light, 0.5, lw * 0.28, -lw * 0.15, -lw * 0.18); }
      break;
    }
    default: solid(col);
  }
}
function beadAt(ctx, x, y, r, col) {
  ctx.fillStyle = rgba('#000', 0.35); ctx.beginPath(); ctx.arc(x + r * 0.14, y + r * 0.18, r, 0, 7); ctx.fill();
  const gr = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  gr.addColorStop(0, shade(col, 0.55)); gr.addColorStop(0.55, col); gr.addColorStop(1, shade(col, -0.4));
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.arc(x - r * 0.38, y - r * 0.42, r * 0.16, 0, 7); ctx.fill();
}

// ---- grounds, overlays and frames -------------------------------------------------------------------------------------------
// r = bounding rect of the board (square for a disc), cell = size of one cell, lite = cheaper texture for small previews.
export function drawGround(ctx, mat, r, bg, cell, cols, rows, lite = false) {
  const { x, y, w, h } = r;
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
  const dk = shade(bg, -0.4), lt = shade(bg, 0.35);
  if (mat === 'paint') {
    // Plaster: broad cloudy patches, a few trowel sweeps and fine grit.
    for (let i = 0; i < (lite ? 8 : 22); i++) {
      const px = x + hash(i, 1) * w, py = y + hash(i, 2) * h, pr = (0.12 + hash(i, 3) * 0.28) * Math.max(w, h);
      const gr = ctx.createRadialGradient(px, py, 0, px, py, pr);
      gr.addColorStop(0, rgba(hash(i, 4) > 0.5 ? lt : dk, 0.16)); gr.addColorStop(1, rgba(bg, 0));
      ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
    }
    ctx.lineWidth = Math.max(1, cell * 0.03); ctx.strokeStyle = rgba(lt, 0.12); ctx.beginPath();
    for (let i = 0; i < (lite ? 5 : 14); i++) { const sy = y + hash(i, 5) * h, sx = x + hash(i, 6) * w * 0.5; ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + w * 0.25, sy + (hash(i, 7) - 0.5) * cell, sx + w * (0.3 + 0.3 * hash(i, 8)), sy + (hash(i, 9) - 0.5) * cell * 0.6); }
    ctx.stroke();
    if (!lite) speckle(ctx, r, 140, [dk, lt], 0.16, Math.max(1.2, cell * 0.03), 31);
  } else if (mat === 'wood') {
    ctx.beginPath(); const p = Math.max(3, cell * 0.16);
    for (let yy = y + p * 0.5; yy < y + h; yy += p) { ctx.moveTo(x, yy); for (let k = 1; k <= 8; k++) ctx.lineTo(x + (w * k) / 8, yy + Math.sin(k * 1.3 + yy * 0.07) * p * 0.35); }
    ctx.lineWidth = Math.max(1, p * 0.22); ctx.strokeStyle = rgba(dk, 0.3); ctx.stroke();
    ctx.strokeStyle = rgba(lt, 0.07); ctx.translate(0, p * 0.3); ctx.stroke(); ctx.translate(0, -p * 0.3);
  } else if (mat === 'powder') {
    if (!lite) speckle(ctx, r, 420, [dk, lt, shade(bg, 0.12)], 0.35, Math.max(1.2, cell * 0.035), 51);
    else speckle(ctx, r, 90, [dk, lt], 0.3, Math.max(1.2, cell * 0.05), 51);
  } else if (mat === 'sand') {
    ctx.beginPath(); const p = Math.max(3.2, cell * 0.2);
    for (let yy = y + p * 0.5; yy < y + h; yy += p) { ctx.moveTo(x, yy); for (let k = 1; k <= 10; k++) ctx.lineTo(x + (w * k) / 10, yy + Math.sin(k * 0.9 + yy * 0.045) * p * 0.28); }
    ctx.lineWidth = Math.max(1, p * 0.3); ctx.strokeStyle = rgba(dk, 0.34); ctx.stroke();
    ctx.translate(0, p * 0.36); ctx.strokeStyle = rgba(lt, 0.3); ctx.stroke(); ctx.translate(0, -p * 0.36);
    if (!lite) speckle(ctx, r, 200, [dk, lt], 0.25, Math.max(1, cell * 0.025), 77);
  } else if (mat === 'tile') {
    // Raised tiles with a hairline grout: bevel each cell.
    const bw = Math.max(1.5, cell * 0.045);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const tx = x + i * cell, ty = y + j * cell, v = (hash(i, j, 3) - 0.5) * 0.08;
      { const tg = ctx.createLinearGradient(tx, ty, tx + cell, ty + cell); tg.addColorStop(0, shade(bg, 0.1 + v)); tg.addColorStop(1, shade(bg, -0.08 + v)); ctx.fillStyle = tg; ctx.fillRect(tx + bw, ty + bw, cell - bw * 2, cell - bw * 2); }
      ctx.fillStyle = rgba('#fff', 0.3); ctx.fillRect(tx + bw, ty + bw, cell - bw * 2, bw); ctx.fillRect(tx + bw, ty + bw, bw, cell - bw * 2);
      ctx.fillStyle = rgba('#000', 0.28); ctx.fillRect(tx + bw, ty + cell - bw * 2, cell - bw * 2, bw); ctx.fillRect(tx + cell - bw * 2, ty + bw, bw, cell - bw * 2);
    }
    ctx.fillStyle = rgba('#000', 0.35);
    for (let i = 0; i <= cols; i++) ctx.fillRect(x + i * cell - bw * 0.5, y, bw, h);
    for (let j = 0; j <= rows; j++) ctx.fillRect(x, y + j * cell - bw * 0.5, w, bw);
  } else if (mat === 'bead') {
    const n = 4, p = cell / n; ctx.fillStyle = rgba('#000', 0.35); ctx.beginPath();
    const rad = p * 0.4, c0 = Math.ceil(w / p), r0 = Math.ceil(h / p);
    for (let j = 0; j < r0; j++) for (let i = 0; i < c0; i++) { const bx = x + (i + 0.5) * p, by = y + (j + 0.5) * p; ctx.moveTo(bx + rad, by); ctx.arc(bx, by, rad, 0, 6.2832); }
    ctx.fill();
    ctx.fillStyle = rgba('#fff', 0.1); ctx.beginPath();
    for (let j = 0; j < r0; j++) for (let i = 0; i < c0; i++) { const bx = x + (i + 0.5) * p - rad * 0.3, by = y + (j + 0.5) * p - rad * 0.35; ctx.moveTo(bx + rad * 0.2, by); ctx.arc(bx, by, rad * 0.2, 0, 6.2832); }
    ctx.fill();
  } else if (mat === 'ink') {
    const gr = ctx.createLinearGradient(x, y, x + w, y + h);
    gr.addColorStop(0, rgba(lt, 0.22)); gr.addColorStop(1, rgba(dk, 0.3)); ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
    if (!lite) speckle(ctx, r, 60, [lt], 0.12, Math.max(1.2, cell * 0.03), 91);
  } else if (mat === 'stitch') {
    // Aida cloth: a grid of small holes four to the cell.
    const p = cell / 4, rad = Math.max(0.8, p * 0.16);
    ctx.fillStyle = rgba('#000', 0.3); ctx.beginPath();
    const c0 = Math.ceil(w / p), r0 = Math.ceil(h / p);
    if (c0 * r0 < 4200) for (let j = 0; j < r0; j++) for (let i = 0; i < c0; i++) { const bx = x + i * p, by = y + j * p; ctx.moveTo(bx + rad, by); ctx.arc(bx, by, rad, 0, 6.2832); }
    ctx.fill();
  }
}
function speckle(ctx, r, n, colors, alpha, size, seed) {
  ctx.globalAlpha = alpha;
  for (let k = 0; k < colors.length; k++) {
    ctx.fillStyle = colors[k]; ctx.beginPath();
    for (let i = k; i < n; i += colors.length) ctx.rect(r.x + hash(i, seed) * r.w, r.y + hash(i, seed + 1) * r.h, size * (0.6 + hash(i, seed + 2)), size * (0.6 + hash(i, seed + 3)));
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Thread texture drawn OVER the motifs so that the design reads as part of the cloth.
export function drawThreadOverlay(ctx, mat, r, cell, strength = 1, lite = false) {
  if (mat !== 'weave' && mat !== 'dye' && mat !== 'print' && mat !== 'stitch') return;
  const k = mat === 'weave' ? 1 : mat === 'dye' ? 0.8 : mat === 'stitch' ? 0.45 : 0.5;
  const p = clamp(cell / (mat === 'weave' ? 6.5 : 8), lite ? 3 : 2.2, 7);
  const a = 0.2 * k * strength;
  const { x, y, w, h } = r;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const nx = Math.ceil(w / p), ny = Math.ceil(h / p);
  const pass = (vertical, parity, color, alpha, lw, off) => {
    ctx.beginPath();
    const n = vertical ? nx : ny;
    for (let i = parity; i < n; i += 2) {
      if (vertical) { ctx.moveTo(x + i * p + p * 0.5, y); ctx.lineTo(x + i * p + p * 0.5, y + h); } else { ctx.moveTo(x, y + i * p + p * 0.5); ctx.lineTo(x + w, y + i * p + p * 0.5); }
    }
    ctx.setLineDash([p, p]); ctx.lineDashOffset = off; ctx.lineWidth = lw; ctx.strokeStyle = rgba(color, alpha); ctx.stroke();
  };
  // Over-under: horizontal threads show on alternate cells, vertical threads fill the rest.
  pass(false, 0, '#000', a, p * 0.62, 0); pass(false, 1, '#000', a, p * 0.62, p);
  pass(true, 0, '#000', a * 0.7, p * 0.62, p); pass(true, 1, '#000', a * 0.7, p * 0.62, 0);
  if (!lite) {
    pass(false, 0, '#fff', a * 0.55, p * 0.2, 0); pass(false, 1, '#fff', a * 0.55, p * 0.2, p);
    pass(true, 0, '#fff', a * 0.4, p * 0.2, p); pass(true, 1, '#fff', a * 0.4, p * 0.2, 0);
  }
  ctx.setLineDash([]); ctx.lineDashOffset = 0;
  ctx.restore();
}

// Lighting laid over the whole board: soft key light from the top-left, a little falloff, and an edge vignette.
export function drawLight(ctx, r, disc, strength = 1) {
  const { x, y, w, h } = r;
  ctx.save();
  if (disc) { ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, w / 2, 0, 6.2832); ctx.clip(); } else { ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); }
  const g1 = ctx.createLinearGradient(x, y, x + w * 0.9, y + h * 0.9);
  g1.addColorStop(0, `rgba(255,248,230,${0.14 * strength})`); g1.addColorStop(0.5, 'rgba(255,255,255,0)'); g1.addColorStop(1, `rgba(0,0,0,${0.2 * strength})`);
  ctx.fillStyle = g1; ctx.fillRect(x, y, w, h);
  const g2 = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.38, x + w / 2, y + h / 2, Math.max(w, h) * 0.78);
  g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, `rgba(0,0,0,${0.3 * strength})`);
  ctx.fillStyle = g2; ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// Frame styles by material. `before` draws the drop shadow and the base the board sits in; `after` draws the rim over its edge.
const FRAME = { weave: 'hem', dye: 'hem', print: 'hem', stitch: 'hoop', paint: 'wall', tile: 'grout', wood: 'wood', powder: 'slab', bead: 'wood', ink: 'slab', sand: 'wood' };
export const frameStyle = (mat) => FRAME[mat] ?? 'hem';
const WOOD_A = '#8a5a30', WOOD_B = '#5a3519';
function ringPath(ctx, r, grow, disc, radius = 0) {
  const x = r.x - grow, y = r.y - grow, w = r.w + grow * 2, h = r.h + grow * 2;
  ctx.beginPath();
  if (disc) ctx.arc(r.x + r.w / 2, r.y + r.h / 2, r.w / 2 + grow, 0, 6.2832);
  else if (radius > 0) { const rr = Math.min(radius, w / 2, h / 2); ctx.moveTo(x + rr, y); ctx.arcTo(x + w, y, x + w, y + h, rr); ctx.arcTo(x + w, y + h, x, y + h, rr); ctx.arcTo(x, y + h, x, y, rr); ctx.arcTo(x, y, x + w, y, rr); ctx.closePath(); }
  else ctx.rect(x, y, w, h);
}
export function frameBefore(ctx, mat, r, d, disc, bg, lift = 0) {
  const st = frameStyle(mat);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 22 + lift * 18; ctx.shadowOffsetY = 9 + lift * 8;
  ctx.fillStyle = st === 'hem' ? bg : st === 'slab' ? mix(bg, '#888', 0.3) : '#000';
  ringPath(ctx, r, st === 'hem' ? 0 : d * 0.9, disc, st === 'slab' ? d : 0); ctx.fill();
  ctx.restore();
  if (st === 'slab') { // slab thickness: a darker copy below
    ctx.fillStyle = shade(mix(bg, '#8a8a8a', 0.4), -0.5); ctx.save(); ctx.translate(0, d * 0.45); ringPath(ctx, r, d * 0.9, disc, d); ctx.fill(); ctx.restore();
    ctx.fillStyle = shade(mix(bg, '#8a8a8a', 0.45), -0.05); ringPath(ctx, r, d * 0.9, disc, d); ctx.fill();
  }
}
export function frameAfter(ctx, mat, r, d, disc, bg, accent, cell) {
  const st = frameStyle(mat);
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  if (st === 'hem') {
    // Hemmed edge: a stitched line a little inside; fringe on two sides for woven cloth.
    ctx.save(); ctx.setLineDash([Math.max(3, cell * 0.12), Math.max(3, cell * 0.1)]); ctx.strokeStyle = rgba('#fff', 0.28); ctx.lineWidth = Math.max(1.2, cell * 0.03);
    const inset = Math.max(4, cell * 0.14); ringPath(ctx, { x: r.x + inset, y: r.y + inset, w: r.w - 2 * inset, h: r.h - 2 * inset }, 0, disc); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = rgba('#000', 0.55); ctx.lineWidth = 1.5; ringPath(ctx, r, 0, disc); ctx.stroke();
    if (mat === 'weave' && !disc) {
      const fl = Math.min(d * 0.8, cell * 0.5), n = Math.floor(r.w / 3.2); ctx.lineWidth = 1.4;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        for (let i = 0; i < n; i++) { const fx = r.x + 1.5 + i * 3.2, y0 = side < 0 ? r.y : r.y + r.h, ln = fl * (0.6 + 0.4 * hash(i, side + 3)); ctx.moveTo(fx, y0); ctx.lineTo(fx + (hash(i, 8) - 0.5) * 3, y0 + side * ln); }
        ctx.strokeStyle = rgba(shade(bg, 0.35), 0.8); ctx.stroke();
      }
    }
  } else if (st === 'hoop') {
    const t = Math.max(10, d * 0.9);
    const gr = ctx.createLinearGradient(r.x - d, r.y - d, r.x + r.w + d, r.y + r.h + d);
    gr.addColorStop(0, '#d9b27a'); gr.addColorStop(0.5, '#a97a45'); gr.addColorStop(1, '#6a4524');
    ctx.strokeStyle = gr; ctx.lineWidth = t; ringPath(ctx, r, t * 0.4, disc, t * 0.9); ctx.stroke();
    ctx.strokeStyle = rgba('#000', 0.4); ctx.lineWidth = 1.5; ringPath(ctx, r, t * 0.9, disc, t * 0.9); ctx.stroke(); ringPath(ctx, r, -t * 0.1, disc, t * 0.5); ctx.stroke();
    ctx.strokeStyle = rgba('#fff', 0.35); ctx.lineWidth = Math.max(1.5, t * 0.12); ringPath(ctx, r, t * 0.15, disc, t * 0.7); ctx.stroke();
    // screw clasp at the top
    const sx = cx, sy = r.y - t * 0.45, bw = t * 1.9, bh = t * 1.15;
    const mg = ctx.createLinearGradient(sx - bw / 2, sy - bh / 2, sx + bw / 2, sy + bh / 2);
    mg.addColorStop(0, '#f2e4b8'); mg.addColorStop(0.5, '#b8943e'); mg.addColorStop(1, '#6e5516');
    ctx.fillStyle = mg; ctx.beginPath(); ctx.rect(sx - bw / 2, sy - bh / 2, bw, bh); ctx.fill(); ctx.strokeStyle = rgba('#000', 0.5); ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = rgba('#000', 0.45); ctx.beginPath(); ctx.arc(sx, sy, bh * 0.22, 0, 6.2832); ctx.fill();
  } else if (st === 'wall') {
    // Inner shade from the wall's reveal (top and left in shadow) plus a painted border band.
    const sh = Math.max(8, cell * 0.35);
    ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
    let gr = ctx.createLinearGradient(r.x, r.y, r.x, r.y + sh); gr.addColorStop(0, 'rgba(0,0,0,0.38)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(r.x, r.y, r.w, sh);
    gr = ctx.createLinearGradient(r.x, r.y, r.x + sh, r.y); gr.addColorStop(0, 'rgba(0,0,0,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(r.x, r.y, sh, r.h);
    ctx.restore();
    ctx.lineWidth = d * 0.9; ctx.strokeStyle = mix(bg, '#7a6a58', 0.5); ringPath(ctx, r, d * 0.45, false); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = rgba('#fff', 0.25); ringPath(ctx, r, d * 0.9, false); ctx.stroke();
    ctx.strokeStyle = rgba('#000', 0.5); ringPath(ctx, r, 0, false); ctx.stroke();
  } else if (st === 'grout') {
    ctx.lineWidth = d * 0.9; ctx.strokeStyle = mix(bg, '#c9c2b2', 0.55); ringPath(ctx, r, d * 0.45, false); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = rgba('#fff', 0.45); ringPath(ctx, r, d * 0.9, false); ctx.stroke();
    ctx.strokeStyle = rgba('#000', 0.55); ringPath(ctx, r, 0, false); ctx.stroke();
  } else if (st === 'wood') {
    const t = Math.max(10, d * 0.9);
    const gr = ctx.createLinearGradient(r.x - d, r.y - d, r.x + r.w + d, r.y + r.h + d); gr.addColorStop(0, shade(WOOD_A, 0.25)); gr.addColorStop(0.5, WOOD_A); gr.addColorStop(1, WOOD_B);
    ctx.strokeStyle = gr; ctx.lineWidth = t; ringPath(ctx, r, t * 0.45, disc, t * 0.3); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.strokeStyle = rgba('#000', 0.5); ringPath(ctx, r, t * 0.95, disc, t * 0.3); ctx.stroke(); ringPath(ctx, r, -0.5, disc); ctx.stroke();
    ctx.strokeStyle = rgba('#fff', 0.3); ringPath(ctx, r, t * 0.2, disc, t * 0.3); ctx.stroke();
  } else { // slab: an engraved line near the rim
    ctx.strokeStyle = rgba('#fff', 0.25); ctx.lineWidth = 1.5; ringPath(ctx, r, d * 0.55, disc, d); ctx.stroke();
    ctx.strokeStyle = rgba('#000', 0.45); ringPath(ctx, r, 0, disc); ctx.stroke();
  }
  void accent;
}

// ---- small decorations -------------------------------------------------------------------------------------------------------
export function sparkle(ctx, x, y, r, color, a) {
  if (a <= 0 || r <= 0) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, a); ctx.fillStyle = color; ctx.translate(x, y); ctx.beginPath();
  for (let i = 0; i < 8; i++) { const ang = (i * Math.PI) / 4, rad = i % 2 ? r * 0.22 : r; ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
export function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + rr, y); ctx.arcTo(x + w, y, x + w, y + h, rr); ctx.arcTo(x + w, y + h, x, y + h, rr); ctx.arcTo(x, y + h, x, y, rr); ctx.arcTo(x, y, x + w, y, rr); ctx.closePath();
}

// A tiny seeded generator for art that must not touch the game's rng (title art is drawn outside the round).
export function createRng(seed) {
  let a = seed >>> 0;
  const next = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return { next, int: (n) => Math.floor(next() * n), chance: (p) => next() < p };
}

// ---- the maker's tool, drawn with form, for the title art ---------------------------------------------------------------------
// rect: the title art rect; the prop sits at its lower right, partly over the work.
export function drawProp(ctx, mat, P, pal, rect, t, bg) {
  const S = Math.min(rect.w, rect.h);
  const colors = P.palette.map((p) => p.color);
  const c0 = colors[Math.min(1, colors.length - 1)], c1 = colors[Math.min(2, colors.length - 1)], c2 = colors[0];
  const ox = rect.x + rect.w * 0.5, oy = rect.y + rect.h * 0.5 + S * 0.04;
  const shadow = (fn) => { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = S * 0.03; ctx.shadowOffsetX = S * 0.012; ctx.shadowOffsetY = S * 0.02; fn(); ctx.restore(); };
  const rr = (x, y, w, h, r) => roundRectPath(ctx, x, y, w, h, r);
  ctx.save();
  if (mat === 'stitch' || mat === 'bead') {
    // needle with a loop of thread trailing across the cloth
    const x0 = ox + S * 0.1, y0 = oy + S * 0.42, x1 = ox + S * 0.46, y1 = oy + S * 0.16;
    const sway = Math.sin(t * 1.4) * S * 0.012;
    ctx.lineCap = 'round';
    shadow(() => { ctx.strokeStyle = c0; ctx.lineWidth = S * 0.016; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.bezierCurveTo(ox + S * 0.46, oy + S * 0.5 + sway, ox + S * 0.1, oy + S * 0.55, ox - S * 0.25, oy + S * 0.43 + sway); ctx.stroke(); });
    ctx.strokeStyle = rgba('#fff', 0.5); ctx.lineWidth = S * 0.005; ctx.beginPath(); ctx.moveTo(x1 - S * 0.004, y1 - S * 0.004); ctx.bezierCurveTo(ox + S * 0.46, oy + S * 0.5 + sway, ox + S * 0.1, oy + S * 0.55, ox - S * 0.25, oy + S * 0.43 + sway); ctx.stroke();
    shadow(() => { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, '#9aa3ad'); g.addColorStop(0.5, '#f4f7fb'); g.addColorStop(1, '#7c858f'); ctx.strokeStyle = g; ctx.lineWidth = S * 0.012; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); });
    ctx.fillStyle = '#2a2f36'; ctx.beginPath(); ctx.ellipse(x1 - S * 0.012, y1 + S * 0.012, S * 0.006, S * 0.016, 0.9, 0, 6.2832); ctx.fill();
  } else if (mat === 'paint' || mat === 'ink') {
    // brush with a loaded tip and a dab of colour
    ctx.save(); ctx.translate(ox + S * 0.34, oy + S * 0.4); ctx.rotate(-0.95);
    shadow(() => {
      const L = S * 0.5, w = S * 0.04;
      const g = ctx.createLinearGradient(0, -w, 0, w); g.addColorStop(0, '#d8a867'); g.addColorStop(0.5, '#a77638'); g.addColorStop(1, '#6a4521');
      rr(-L * 0.1, -w * 0.5, L * 0.9, w, w * 0.5); ctx.fillStyle = g; ctx.fill();
      const mg = ctx.createLinearGradient(0, -w, 0, w); mg.addColorStop(0, '#f2f5f8'); mg.addColorStop(1, '#7d8791'); ctx.fillStyle = mg; rr(-L * 0.28, -w * 0.62, L * 0.2, w * 1.24, w * 0.3); ctx.fill();
      ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(-L * 0.28, -w * 0.58); ctx.quadraticCurveTo(-L * 0.46, -w * 0.5, -L * 0.52, 0); ctx.quadraticCurveTo(-L * 0.46, w * 0.5, -L * 0.28, w * 0.58); ctx.closePath(); ctx.fill();
    });
    ctx.restore();
    ctx.fillStyle = rgba(c2, 0.9); ctx.beginPath(); ctx.ellipse(ox + S * 0.18, oy + S * 0.5, S * 0.07, S * 0.025, -0.2, 0, 6.2832); ctx.fill();
    ctx.fillStyle = rgba('#fff', 0.4); ctx.beginPath(); ctx.ellipse(ox + S * 0.16, oy + S * 0.495, S * 0.03, S * 0.008, -0.2, 0, 6.2832); ctx.fill();
  } else if (mat === 'print' || mat === 'dye') {
    // wooden block with a knob, its carved face inked
    ctx.save(); ctx.translate(ox + S * 0.3, oy + S * 0.36); ctx.rotate(-0.22);
    shadow(() => {
      const w = S * 0.22, h = S * 0.12;
      const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, '#c9965a'); g.addColorStop(1, '#6e4524');
      rr(-w / 2, -h / 2, w, h, S * 0.01); ctx.fillStyle = g; ctx.fill();
      rr(-w * 0.16, -h / 2 - S * 0.07, w * 0.32, S * 0.08, S * 0.02); ctx.fillStyle = g; ctx.fill();
      ctx.fillStyle = c0; rr(-w / 2, h / 2 - S * 0.012, w, S * 0.02, S * 0.006); ctx.fill();
    });
    ctx.restore();
  } else if (mat === 'weave') {
    // spool of thread
    ctx.save(); ctx.translate(ox + S * 0.36, oy + S * 0.36); ctx.rotate(0.35);
    shadow(() => {
      const w = S * 0.11, h = S * 0.16;
      ctx.fillStyle = '#b88b50'; rr(-w * 0.62, -h / 2 - S * 0.01, w * 1.24, S * 0.022, S * 0.006); ctx.fill(); rr(-w * 0.62, h / 2 - S * 0.012, w * 1.24, S * 0.022, S * 0.006); ctx.fill();
      for (let i = 0; i < 9; i++) { ctx.fillStyle = i % 2 ? c0 : shade(c0, -0.15); ctx.fillRect(-w / 2, -h / 2 + (h * i) / 9, w, h / 9 + 0.5); }
      const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, 'rgba(255,255,255,0.4)'); g.addColorStop(0.35, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.35)'); ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
    });
    ctx.restore();
  } else if (mat === 'powder') {
    // little heaps of coloured powder
    const n = Math.min(4, colors.length);
    for (let i = 0; i < n; i++) {
      const hx = ox - S * 0.3 + i * S * 0.2, hy = oy + S * 0.45 + Math.sin(i * 2.1) * S * 0.015, hr = S * 0.075;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(hx + hr * 0.1, hy + hr * 0.1, hr * 1.1, hr * 0.38, 0, 0, 6.2832); ctx.fill();
      const g = ctx.createRadialGradient(hx - hr * 0.3, hy - hr * 0.6, 1, hx, hy, hr * 1.1); g.addColorStop(0, shade(colors[i], 0.35)); g.addColorStop(1, shade(colors[i], -0.3));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(hx - hr * 1.05, hy + hr * 0.1); ctx.quadraticCurveTo(hx - hr * 0.4, hy - hr * 1.3, hx, hy - hr * 1.0); ctx.quadraticCurveTo(hx + hr * 0.4, hy - hr * 1.3, hx + hr * 1.05, hy + hr * 0.1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = rgba('#fff', 0.5); for (let k = 0; k < 9; k++) ctx.fillRect(hx - hr * 0.7 + hash(i, k) * hr * 1.4, hy - hr * 0.8 + hash(i, k + 9) * hr * 0.8, 1.6, 1.6);
    }
  } else if (mat === 'sand') {
    // a small rake
    ctx.save(); ctx.translate(ox + S * 0.3, oy + S * 0.4); ctx.rotate(-0.7);
    shadow(() => { ctx.fillStyle = '#c9a76d'; rr(-S * 0.3, -S * 0.008, S * 0.42, S * 0.016, S * 0.008); ctx.fill(); ctx.fillStyle = '#a07a40'; rr(S * 0.1, -S * 0.07, S * 0.03, S * 0.14, S * 0.01); ctx.fill(); for (let i = 0; i < 6; i++) { ctx.fillRect(S * 0.13, -S * 0.07 + i * S * 0.026, S * 0.05, S * 0.008); } });
    ctx.restore();
  } else { // tile and wood: loose pieces
    const pieces = [[0.28, 0.42, 0.3], [0.4, 0.34, -0.2], [0.34, 0.5, -0.5]];
    pieces.forEach(([px, py, rot], i) => {
      ctx.save(); ctx.translate(ox + S * (px - 0.1), oy + S * (py - 0.02)); ctx.rotate(rot + Math.sin(t * 0.8 + i) * 0.01);
      const w = S * 0.09, col = colors[(i + 1) % colors.length];
      shadow(() => { const g = ctx.createLinearGradient(-w / 2, -w / 2, w / 2, w / 2); g.addColorStop(0, shade(col, 0.3)); g.addColorStop(1, shade(col, -0.3)); rr(-w / 2, -w / 2, w, w, w * 0.12); ctx.fillStyle = g; ctx.fill(); });
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; rr(-w / 2 + 2, -w / 2 + 2, w - 4, w - 4, w * 0.1); ctx.stroke();
      ctx.restore();
    });
  }
  ctx.restore();
  void c1; void bg; void pal;
}

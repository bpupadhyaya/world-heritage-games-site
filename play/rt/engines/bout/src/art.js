// Bout art: venues (ring, stands, backdrop, light), articulated fighters, balance dials and impact effects.
// Pure canvas drawing, deterministic (no Math.random / Date.now): all "randomness" is a hash of an index.
// Light comes from the upper left; shadows fall to the right. Everything is drawn procedurally (no binary art).

export const hash = (n) => { let h = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---- colour helpers ---------------------------------------------------------------------------------------------------
const parse = (hex) => { const h = String(hex).replace('#', ''); const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0'); return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)]; };
const toHex = (c) => `#${c.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')}`;
export const mix = (a, b, t) => { const A = parse(a), B = parse(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
export const shade = (hex, k) => (k >= 0 ? mix(hex, '#ffffff', k) : mix(hex, '#000000', -k));
export const rgba = (hex, a) => { const [r, g, b] = parse(hex); return `rgba(${r},${g},${b},${a})`; };

const rr = (ctx, x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
const ell = (ctx, x, y, rx, ry) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); };
const lin = (ctx, x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
const rad = (ctx, x, y, r0, r1, stops) => { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };

// ---- which venue a fixture plays in -----------------------------------------------------------------------------------
export const venueOf = (P) => {
  if (P.setting.venue) return P.setting.venue;
  const k = P.ring.kind;
  if (k === 'circle') return P.ring.pushOut ? 'dohyo' : 'courtyard';
  if (k === 'water') return P.weapon.front === 'pillow' ? 'beam' : 'boats';
  return { mud: 'pit', sawdust: 'sawdust', sand: 'sandarena', mat: 'mat', grass: 'meadow' }[k] ?? 'sandarena';
};

// ---- geometry of the stage --------------------------------------------------------------------------------------------
export function stageGeo(s, venue) {
  const gy = s.y + s.h * 0.8;
  const mid = s.x + s.w / 2;
  const rx = Math.min(s.w * 0.43, s.h * 1.15);
  const ry = Math.min(rx * 0.25, s.h * 0.12);
  const H = Math.min(s.h * 0.62, s.w * 0.42);
  const hy = s.y + s.h * 0.5;
  return { gy, mid, rx, ry, H, hy, venue };
}

// ---- backdrop pieces --------------------------------------------------------------------------------------------------
const skyAndLight = (ctx, s, S, hy, T) => {
  ctx.fillStyle = lin(ctx, 0, s.y, 0, hy, [[0, S.sky[0]], [1, S.sky[1]]]); ctx.fillRect(s.x, s.y, s.w, s.h);
  ctx.fillStyle = rad(ctx, s.x + s.w * 0.22, s.y + s.h * 0.2, 0, s.w * 0.55, [[0, 'rgba(255,248,222,0.75)'], [0.35, 'rgba(255,240,200,0.28)'], [1, 'rgba(255,240,200,0)']]); ctx.fillRect(s.x, s.y, s.w, s.h);
  // a few slow clouds
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 3; i++) { const cx = s.x + ((hash(i + 3) * 1.4 + T * 0.004 * (1 + i)) % 1.3 - 0.15) * s.w, cy = s.y + s.h * (0.1 + i * 0.07); ell(ctx, cx, cy, s.w * 0.1, s.h * 0.025); ctx.fill(); ell(ctx, cx + s.w * 0.06, cy - s.h * 0.012, s.w * 0.06, s.h * 0.022); ctx.fill(); }
};

const mountains = (ctx, s, hy, col, snow, layers = 2) => {
  for (let l = 0; l < layers; l++) {
    const base = hy - s.h * 0.02 * l, amp = s.h * (0.3 - l * 0.08), c = mix(col, '#ffffff', 0.35 - l * 0.28);
    const pts = []; const n = 9;
    for (let i = 0; i <= n; i++) pts.push([s.x + (s.w * i) / n, base - amp * (0.35 + 0.65 * hash(i * 3 + l * 11)) * (i % 2 ? 1 : 0.55)]);
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(s.x, hy); pts.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(s.x + s.w, hy); ctx.closePath(); ctx.fill();
    if (snow && l === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      pts.forEach(([x, y], i) => { if (i % 2 && i < n) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s.w * 0.035, y + s.h * 0.07); ctx.lineTo(x - s.w * 0.01, y + s.h * 0.05); ctx.lineTo(x + s.w * 0.012, y + s.h * 0.08); ctx.lineTo(x + s.w * 0.04, y + s.h * 0.065); ctx.closePath(); ctx.fill(); } });
    }
  }
  ctx.fillStyle = lin(ctx, 0, hy - s.h * 0.1, 0, hy, [[0, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0.35)']]); ctx.fillRect(s.x, hy - s.h * 0.1, s.w, s.h * 0.1);
};
const hills = (ctx, s, hy, col) => {
  for (let l = 0; l < 3; l++) {
    ctx.fillStyle = mix(col, '#ffffff', 0.3 - l * 0.17);
    ctx.beginPath(); ctx.moveTo(s.x, hy);
    for (let i = 0; i <= 28; i++) ctx.lineTo(s.x + (s.w * i) / 28, hy - s.h * (0.1 + l * 0.04 + 0.07 * Math.sin(i * 0.5 + l * 2 + 1) + 0.035 * Math.sin(i * 1.3 + l)));
    ctx.lineTo(s.x + s.w, hy); ctx.closePath(); ctx.fill();
  }
};
const palm = (ctx, x, y, h, T, k) => {
  const sway = Math.sin(T * 0.9 + k) * h * 0.03;
  ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = Math.max(3, h * 0.07); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + h * 0.12, y - h * 0.5, x + h * 0.06 + sway, y - h); ctx.stroke();
  const tx = x + h * 0.06 + sway, ty = y - h;
  ctx.strokeStyle = '#2f7a3a'; ctx.lineWidth = Math.max(2, h * 0.05);
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.62; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx + Math.cos(a) * h * 0.3, ty + Math.sin(a) * h * 0.2 - h * 0.08, tx + Math.cos(a) * h * 0.55, ty + Math.sin(a) * h * 0.4 + h * 0.18); ctx.stroke(); }
};
const flagLine = (ctx, x0, x1, y, sag, cols, T, n = 12, size = 10) => {
  ctx.strokeStyle = 'rgba(40,30,20,0.55)'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i <= 20; i++) { const t = i / 20; const x = x0 + (x1 - x0) * t, yy = y + Math.sin(t * Math.PI) * sag; i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); } ctx.stroke();
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n; const x = x0 + (x1 - x0) * t, yy = y + Math.sin(t * Math.PI) * sag, fl = Math.sin(T * 3 + i) * 1.5;
    ctx.fillStyle = cols[i % cols.length]; ctx.beginPath(); ctx.moveTo(x - size * 0.5, yy); ctx.lineTo(x + size * 0.5, yy); ctx.lineTo(x + fl, yy + size * 1.2); ctx.closePath(); ctx.fill();
  }
};

// Spectators on raked stands. rows people behind each other, bobbing; pulse (0..1) makes them jump after a big moment.
const SPECT = ['#c25b4a', '#e3b04a', '#4a8cc2', '#6aa56a', '#9a6ac2', '#e08a3a', '#f0e6cf', '#3f5f9a', '#b34a6a'];
const crowd = (ctx, s, hy, S, T, pulse, tiers, standCol, dark) => {
  const hh = s.h * 0.2;
  const top = hy - hh * 0.55;
  ctx.fillStyle = lin(ctx, 0, top, 0, hy + s.h * 0.03, [[0, shade(standCol, -0.15)], [1, shade(standCol, -0.45)]]); ctx.fillRect(s.x, top, s.w, hh * 0.55 + s.h * 0.03);
  for (let row = 0; row < tiers; row++) {
    const yb = hy - row * hh * 0.28 + s.h * 0.012;
    const n = 18 + row * 2, sz = s.h * (0.036 - row * 0.002);
    for (let i = 0; i < n; i++) {
      const x = s.x + ((i + 0.5 + (row % 2) * 0.5 + (hash(i * 7 + row) - 0.5) * 0.4) / (n + 0.5)) * s.w;
      const bob = Math.sin(T * (2 + hash(i + row * 13) * 2) + i) * sz * 0.1 + (pulse > 0 ? -Math.abs(Math.sin(T * 9 + i)) * sz * 0.35 * pulse : 0);
      const c = SPECT[Math.floor(hash(i * 31 + row * 5) * SPECT.length)];
      const col = dark ? mix(c, '#000000', 0.35) : c;
      ctx.fillStyle = col; rr(ctx, x - sz * 0.8, yb - sz * 1.9 + bob, sz * 1.6, sz * 2.4, sz * 0.6); ctx.fill();
      ctx.fillStyle = dark ? '#7a5a40' : ['#e9bf94', '#c99366', '#8a5a3a', '#f0cfa8'][Math.floor(hash(i * 5 + row) * 4)];
      ctx.beginPath(); ctx.arc(x, yb - sz * 2.2 + bob, sz * 0.62, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.arc(x, yb - sz * 2.35 + bob, sz * 0.62, Math.PI, TAU); ctx.fill();
    }
    // a rail of shade at the foot of each tier gives depth
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(s.x, yb + sz * 0.5, s.w, s.h * 0.012);
  }
};

// ---- floor with texture -----------------------------------------------------------------------------------------------
const floor = (ctx, s, geo, S, kind) => {
  const { hy } = geo;
  const fh = s.y + s.h - hy;
  ctx.fillStyle = lin(ctx, 0, hy, 0, s.y + s.h, [[0, shade(S.ground, 0.12)], [0.5, S.ground], [1, shade(S.ground, -0.3)]]);
  ctx.fillRect(s.x, hy, s.w, fh);
  // perspective banding and grain: marks grow and spread toward the viewer
  for (let i = 0; i < 90; i++) {
    const t = hash(i * 3 + 1), t2 = hash(i * 7 + 5), depth = Math.pow(t, 1.4);
    const y = hy + depth * fh, x = s.x + t2 * s.w, sz = 1 + depth * 3.5;
    ctx.fillStyle = hash(i + 9) > 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
    if (kind === 'grass') { ctx.strokeStyle = rgba(shade(S.ground, hash(i) > 0.5 ? 0.25 : -0.25), 0.5); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (hash(i + 2) - 0.5) * 6, y - sz * 2.2); ctx.stroke(); }
    else { ctx.beginPath(); ctx.ellipse(x, y, sz * 1.8, sz * 0.7, 0, 0, TAU); ctx.fill(); }
  }
};

// ---- ring / platform --------------------------------------------------------------------------------------------------
// Draws the contest surface under the fighters. Returns nothing; geometry is shared through geo.
const ringSurface = (ctx, s, geo, S, venue, T, P) => {
  const { mid, gy, rx, ry } = geo;
  const fill = S.ringFill, edge = S.ringEdge;
  const disc = (cx, cy, rX, rY, baseFill, speckle) => {
    ell(ctx, cx, cy, rX, rY); ctx.fillStyle = rad(ctx, cx - rX * 0.25, cy - rY * 0.3, 0, rX * 1.05, [[0, shade(baseFill, 0.2)], [0.7, baseFill], [1, shade(baseFill, -0.18)]]); ctx.fill();
    if (speckle) { ctx.save(); ell(ctx, cx, cy, rX, rY); ctx.clip(); for (let i = 0; i < 120; i++) { const a = hash(i * 3) * TAU, d = Math.sqrt(hash(i * 5 + 1)); const x = cx + Math.cos(a) * rX * d, y = cy + Math.sin(a) * rY * d; ctx.fillStyle = hash(i + 4) > 0.5 ? rgba(shade(baseFill, 0.35), 0.5) : rgba(shade(baseFill, -0.4), 0.4); ctx.fillRect(x, y, 2, 1.2); } ctx.restore(); }
  };
  switch (venue) {
    case 'dohyo': {
      const hgt = ry * 0.7;
      // base shadow and raised clay platform with a visible side
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, mid + rx * 0.04, gy + hgt + ry * 0.15, rx * 1.12, ry * 1.1); ctx.fill();
      ctx.fillStyle = lin(ctx, 0, gy, 0, gy + hgt, [[0, shade(fill, -0.15)], [1, shade(fill, -0.5)]]);
      ctx.beginPath(); ctx.ellipse(mid, gy + hgt, rx * 1.1, ry * 1.1, 0, 0, Math.PI); ctx.lineTo(mid - rx * 1.1, gy); ctx.ellipse(mid, gy, rx * 1.1, ry * 1.1, 0, Math.PI, 0, true); ctx.closePath(); ctx.fill();
      disc(mid, gy, rx * 1.1, ry * 1.1, fill, true);
      // straw bale ring
      ell(ctx, mid, gy, rx * 0.93, ry * 0.93); ctx.lineWidth = ry * 0.26; ctx.strokeStyle = '#8e7138'; ctx.stroke();
      ell(ctx, mid, gy - ry * 0.03, rx * 0.93, ry * 0.93); ctx.lineWidth = ry * 0.17; ctx.strokeStyle = '#e1c780'; ctx.stroke();
      ctx.strokeStyle = 'rgba(110,80,30,0.55)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU; const x = mid + Math.cos(a) * rx * 0.93, y = gy + Math.sin(a) * ry * 0.93; ctx.beginPath(); ctx.moveTo(x, y - ry * 0.08); ctx.lineTo(x + 1, y + ry * 0.08); ctx.stroke(); }
      // starting lines
      ctx.strokeStyle = 'rgba(255,252,240,0.95)'; ctx.lineWidth = Math.max(2.5, ry * 0.1);
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(mid + sx * rx * 0.12 - rx * 0.05, gy + ry * 0.12); ctx.lineTo(mid + sx * rx * 0.12 + rx * 0.05, gy + ry * 0.12); ctx.stroke(); }
      break; }
    case 'pit': {
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; ell(ctx, mid, gy + ry * 0.2, rx * 1.12, ry * 1.2); ctx.fill();
      // stone coping with radial joints
      ell(ctx, mid, gy, rx * 1.08, ry * 1.18); ctx.fillStyle = lin(ctx, 0, gy - ry, 0, gy + ry, [[0, shade(edge, -0.1)], [1, shade(edge, -0.4)]]); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 36; i++) { const a = (i / 36) * TAU; ctx.beginPath(); ctx.moveTo(mid + Math.cos(a) * rx * 0.97, gy + Math.sin(a) * ry * 1.06); ctx.lineTo(mid + Math.cos(a) * rx * 1.08, gy + Math.sin(a) * ry * 1.18); ctx.stroke(); }
      // sunken mud with an inner shadow where the wall drops away
      disc(mid, gy + ry * 0.05, rx * 0.97, ry * 1.05, fill, false);
      ctx.save(); ell(ctx, mid, gy + ry * 0.05, rx * 0.97, ry * 1.05); ctx.clip();
      ctx.fillStyle = lin(ctx, 0, gy - ry, 0, gy - ry * 0.2, [[0, 'rgba(0,0,0,0.45)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(mid - rx, gy - ry * 1.1, rx * 2, ry * 0.9);
      for (let i = 0; i < 26; i++) { const x = mid + (hash(i * 3) - 0.5) * rx * 1.7, y = gy + (hash(i * 5 + 1) - 0.5) * ry * 1.6; ctx.fillStyle = 'rgba(255,255,255,0.12)'; ell(ctx, x, y, 6 + hash(i) * 12, 1.5 + hash(i + 3) * 2.5); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ell(ctx, x + 3, y + 3, 5 + hash(i + 9) * 8, 1.5); ctx.fill(); }
      ctx.restore();
      break; }
    case 'beam': {
      // a long log across a pond; water drawn by the caller. The log is a capsule with grain and end rings.
      const lr = ry * 0.9, len = rx * 1.05, cy = gy + lr * 0.55;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(ctx, mid + 6, cy + lr * 1.0, len * 1.02, lr * 0.45); ctx.fill();
      ctx.fillStyle = lin(ctx, 0, cy - lr, 0, cy + lr, [[0, shade(fill, 0.25)], [0.45, fill], [1, shade(fill, -0.5)]]);
      rr(ctx, mid - len, cy - lr, len * 2, lr * 2, lr); ctx.fill();
      ctx.strokeStyle = 'rgba(60,35,15,0.45)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 9; i++) { const y = cy - lr * 0.8 + (i / 8) * lr * 1.6; ctx.beginPath(); ctx.moveTo(mid - len * 0.9, y); ctx.bezierCurveTo(mid - len * 0.3, y + (hash(i) - 0.5) * 6, mid + len * 0.3, y + (hash(i + 5) - 0.5) * 6, mid + len * 0.9, y); ctx.stroke(); }
      for (const sx of [-1, 1]) { ctx.fillStyle = shade(fill, 0.3); ell(ctx, mid + sx * (len - lr * 0.35), cy, lr * 0.45, lr * 0.95); ctx.fill(); ctx.strokeStyle = 'rgba(60,35,15,0.5)'; ctx.lineWidth = 1.5; ell(ctx, mid + sx * (len - lr * 0.35), cy, lr * 0.22, lr * 0.5); ctx.stroke(); }
      break; }
    case 'boats': break; // each fighter has a boat, drawn under them
    case 'courtyard': {
      // stone floor in perspective, a painted ring on it
      const w = rx * 1.12, topY = gy - ry * 1.7, botY = gy + ry * 1.5;
      ctx.fillStyle = lin(ctx, 0, topY, 0, botY, [[0, shade(fill, 0.05)], [1, shade(fill, -0.22)]]);
      ctx.beginPath(); ctx.moveTo(mid - w * 0.72, topY); ctx.lineTo(mid + w * 0.72, topY); ctx.lineTo(mid + w * 1.12, botY); ctx.lineTo(mid - w * 1.12, botY); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(70,50,25,0.35)'; ctx.lineWidth = 1.5;
      for (let i = 1; i < 6; i++) { const t = i / 6, y = topY + (botY - topY) * t * t; const k = 0.72 + 0.4 * t * t; ctx.beginPath(); ctx.moveTo(mid - w * k, y); ctx.lineTo(mid + w * k, y); ctx.stroke(); }
      for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(mid + (i / 4) * w * 0.72, topY); ctx.lineTo(mid + (i / 4) * w * 1.12, botY); ctx.stroke(); }
      ell(ctx, mid, gy, rx * 0.96, ry * 1.05); ctx.lineWidth = Math.max(3, ry * 0.14); ctx.strokeStyle = edge; ctx.stroke();
      ell(ctx, mid, gy, rx * 0.96 - ry * 0.22, ry * 1.05 - ry * 0.2); ctx.lineWidth = 1.5; ctx.setLineDash([3, 7]); ctx.strokeStyle = rgba(edge, 0.7); ctx.stroke(); ctx.setLineDash([]);
      break; }
    case 'mat': {
      const w = rx * 1.05, topY = gy - ry * 1.55, botY = gy + ry * 1.35;
      const quad = (k, y0, y1, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(mid - w * 0.82 * k, y0); ctx.lineTo(mid + w * 0.82 * k, y0); ctx.lineTo(mid + w * k, y1); ctx.lineTo(mid - w * k, y1); ctx.closePath(); ctx.fill(); };
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, mid + 8, botY + 4, w * 1.05, ry * 0.4); ctx.fill();
      quad(1.07, topY - ry * 0.12, botY + ry * 0.12, edge);
      quad(1, topY, botY, fill);
      ctx.fillStyle = lin(ctx, mid, topY, mid, botY, [[0, 'rgba(255,255,255,0.18)'], [1, 'rgba(0,0,0,0.12)']]); ctx.beginPath(); ctx.moveTo(mid - w * 0.82, topY); ctx.lineTo(mid + w * 0.82, topY); ctx.lineTo(mid + w, botY); ctx.lineTo(mid - w, botY); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1;
      for (let i = 1; i < 8; i++) { const t = i / 8; const x = mid + (t - 0.5) * 2 * w * 0.82, x2 = mid + (t - 0.5) * 2 * w; ctx.beginPath(); ctx.moveTo(x, topY); ctx.lineTo(x2, botY); ctx.stroke(); }
      break; }
    case 'meadow': {
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ell(ctx, mid, gy + ry * 0.25, rx * 1.05, ry * 1.1); ctx.fill();
      disc(mid, gy, rx, ry * 1.05, fill, false);
      ctx.save(); ell(ctx, mid, gy, rx, ry * 1.05); ctx.clip();
      for (let i = 0; i < 160; i++) { const a = hash(i * 3) * TAU, d = Math.sqrt(hash(i * 5 + 1)); const x = mid + Math.cos(a) * rx * d, y = gy + Math.sin(a) * ry * d * 1.05; ctx.strokeStyle = rgba(shade(fill, hash(i) > 0.5 ? 0.3 : -0.3), 0.5); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (hash(i + 2) - 0.5) * 5, y - 4 - hash(i + 4) * 5); ctx.stroke(); }
      ctx.restore();
      ell(ctx, mid, gy, rx, ry * 1.05); ctx.lineWidth = Math.max(2, ry * 0.08); ctx.strokeStyle = edge; ctx.stroke();
      break; }
    default: { // sandarena, sawdust, village
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(ctx, mid, gy + ry * 0.25, rx * 1.05, ry * 1.12); ctx.fill();
      disc(mid, gy, rx, ry * 1.05, fill, true);
      // raked lines in the sand
      ctx.save(); ell(ctx, mid, gy, rx, ry * 1.05); ctx.clip(); ctx.strokeStyle = 'rgba(0,0,0,0.045)'; ctx.lineWidth = 1;
      for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.ellipse(mid, gy, rx * (0.5 + 0.08 * i), ry * (0.5 + 0.08 * i) * 1.05, 0, 0, TAU); ctx.stroke(); }
      ctx.restore();
      ell(ctx, mid, gy, rx, ry * 1.05); ctx.lineWidth = Math.max(3, ry * 0.12); ctx.strokeStyle = edge; ctx.stroke();
      if (venue === 'sandarena') { ell(ctx, mid, gy, rx * 0.9, ry * 0.95); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.stroke(); }
    }
  }
  void T; void P;
};

// ---- venue-specific scenery behind and in front of the ring ----------------------------------------------------------
const backdrop = (ctx, s, geo, S, venue, T, pulse) => {
  const { hy, mid, rx, ry, gy } = geo;
  const dark = venue === 'dohyo';
  const bd = S.backdrop;
  if (bd === 'mountains') mountains(ctx, s, hy - s.h * 0.1, S.far, venue === 'sawdust' || venue === 'meadow');
  else if (bd === 'hills') hills(ctx, s, hy - s.h * 0.06, S.far);
  if (venue === 'mat' || venue === 'village') for (let i = 0; i < 5; i++) palm(ctx, s.x + s.w * (0.06 + i * 0.22 + hash(i) * 0.05), hy - s.h * 0.08, s.h * (0.3 + hash(i + 2) * 0.1), T, i);
  if (venue === 'courtyard') {
    // colonnade: warm lit arches behind the stands
    const ph = s.h * 0.34, n = 6;
    ctx.fillStyle = lin(ctx, 0, hy - ph, 0, hy, [[0, shade(S.far, -0.2)], [1, shade(S.far, -0.05)]]); ctx.fillRect(s.x, hy - ph, s.w, ph);
    for (let i = 0; i < n; i++) {
      const x = s.x + (s.w * (i + 0.5)) / n, aw = s.w / n * 0.62;
      ctx.fillStyle = rad(ctx, x, hy - ph * 0.45, 0, aw, [[0, 'rgba(255,214,140,0.9)'], [1, 'rgba(130,70,30,0.9)']]);
      ctx.beginPath(); ctx.moveTo(x - aw / 2, hy); ctx.lineTo(x - aw / 2, hy - ph * 0.55); ctx.arc(x, hy - ph * 0.55, aw / 2, Math.PI, 0); ctx.lineTo(x + aw / 2, hy); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = shade(S.far, 0.1); for (let i = 0; i <= n; i++) ctx.fillRect(s.x + (s.w * i) / n - 4, hy - ph, 8, ph);
    for (let i = 0; i < 4; i++) { const x = s.x + s.w * (0.15 + i * 0.23); ctx.strokeStyle = 'rgba(40,30,20,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, hy - ph); ctx.lineTo(x, hy - ph * 0.85); ctx.stroke(); ctx.fillStyle = '#ffd37a'; ell(ctx, x, hy - ph * 0.8, 5, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,200,100,0.25)'; ell(ctx, x, hy - ph * 0.8, 16, 20); ctx.fill(); }
  }
  if (venue === 'boats' || venue === 'beam') {
    // far bank with reeds / trees
    ctx.fillStyle = shade('#4f7a3a', -0.1); ctx.fillRect(s.x, hy - s.h * 0.03, s.w, s.h * 0.05);
    for (let i = 0; i < 14; i++) { const x = s.x + s.w * (i + hash(i)) / 14; ctx.strokeStyle = '#3d6a2c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, hy + s.h * 0.015); ctx.quadraticCurveTo(x + 3, hy - s.h * 0.04, x + (hash(i + 3) - 0.5) * 12, hy - s.h * 0.075); ctx.stroke(); }
  }
  if (venue === 'dohyo') {
    // dark hall: lanterns on the back wall
    ctx.fillStyle = lin(ctx, 0, s.y, 0, hy, [[0, '#1d1620'], [1, '#3a2630']]); ctx.fillRect(s.x, s.y, s.w, hy - s.y);
    for (let i = 0; i < 7; i++) { const x = s.x + s.w * (0.07 + i * 0.145); ctx.fillStyle = 'rgba(255,190,90,0.18)'; ell(ctx, x, s.y + s.h * 0.2, 26, 30); ctx.fill(); ctx.fillStyle = '#e8923a'; rr(ctx, x - 7, s.y + s.h * 0.17, 14, 22, 6); ctx.fill(); ctx.fillStyle = '#fff1c0'; rr(ctx, x - 3, s.y + s.h * 0.18, 6, 14, 3); ctx.fill(); }
  }
  if (S.crowd) {
    const standCol = venue === 'dohyo' ? '#2a2026' : venue === 'courtyard' ? '#6b4a30' : '#6a5a46';
    crowd(ctx, s, hy + s.h * 0.02, S, T, pulse, venue === 'dohyo' || venue === 'sandarena' ? 3 : 2, standCol, dark);
  }
  if (venue === 'pit') {
    // wooden posts with a garland of cloth
    for (const sx of [0.12, 0.88]) { const x = s.x + s.w * sx; ctx.fillStyle = lin(ctx, x - 7, 0, x + 7, 0, [[0, '#9a6a3a'], [1, '#5a3a1a']]); ctx.fillRect(x - 7, hy - s.h * 0.34, 14, s.h * 0.4); }
    flagLine(ctx, s.x + s.w * 0.12, s.x + s.w * 0.88, hy - s.h * 0.33, s.h * 0.05, ['#e8873a', '#f2c14e', '#c0392b', '#f5f1e8'], T, 16, 12);
  }
  if (venue === 'sawdust' || venue === 'meadow' || venue === 'sandarena') flagLine(ctx, s.x + s.w * 0.04, s.x + s.w * 0.96, hy - s.h * 0.2, s.h * 0.04, ['#c0392b', '#f5f1e8', '#2d7bd6', '#f2c14e'], T, 18, 10);
  if (venue === 'meadow') {
    // two felt tents at the edges
    for (const sx of [0.14, 0.86]) { const x = s.x + s.w * sx, w = s.w * 0.15, h = s.h * 0.14; ctx.fillStyle = '#f2ecdc'; rr(ctx, x - w / 2, hy - h * 0.6, w, h * 0.6, 4); ctx.fill(); ctx.beginPath(); ctx.ellipse(x, hy - h * 0.6, w / 2, h * 0.45, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#c0392b'; ctx.fillRect(x - w * 0.12, hy - h * 0.4, w * 0.24, h * 0.4); ctx.strokeStyle = '#2d4fa3'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - w / 2, hy - h * 0.55); ctx.lineTo(x + w / 2, hy - h * 0.55); ctx.stroke(); }
  }
  void mid; void rx; void ry; void gy;
};

const dohyoRoof = (ctx, s, S) => {
  const hh = s.h * 0.065;
  ctx.fillStyle = lin(ctx, 0, s.y, 0, s.y + hh, [[0, '#4a1f2e'], [1, '#6e2d44']]); ctx.fillRect(s.x, s.y, s.w, hh);
  ctx.fillStyle = '#d9b560'; ctx.fillRect(s.x, s.y + hh, s.w, 3);
  for (const sx of [0.1, 0.9]) {
    const x = s.x + s.w * sx;
    ctx.strokeStyle = '#6b2f8a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, s.y + hh); ctx.lineTo(x, s.y + hh + s.h * 0.2); ctx.stroke();
    ctx.fillStyle = '#6b2f8a'; ctx.beginPath(); ctx.moveTo(x - 6, s.y + hh + s.h * 0.2); ctx.lineTo(x + 6, s.y + hh + s.h * 0.2); ctx.lineTo(x + 9, s.y + hh + s.h * 0.27); ctx.lineTo(x - 9, s.y + hh + s.h * 0.27); ctx.closePath(); ctx.fill();
  }
  void S;
};

const water = (ctx, s, geo, S, T, venue) => {
  const { hy } = geo;
  const top = venue === 'boats' ? hy : hy;
  ctx.fillStyle = lin(ctx, 0, top, 0, s.y + s.h, [[0, shade(S.water ?? '#3b7fa6', 0.2)], [1, shade(S.water ?? '#3b7fa6', -0.3)]]); ctx.fillRect(s.x, top, s.w, s.y + s.h - top);
  // light glitter and moving ripples (bigger toward the viewer)
  for (let i = 0; i < 46; i++) {
    const depth = Math.pow(hash(i * 3 + 1), 1.3), y = top + depth * (s.y + s.h - top), x0 = hash(i * 7 + 2), sp = 6 + hash(i) * 10;
    const x = s.x + ((x0 * s.w + T * sp * (0.4 + depth)) % (s.w + 40)) - 20, w = 6 + depth * 28;
    ctx.strokeStyle = `rgba(255,255,255,${0.1 + depth * 0.35})`; ctx.lineWidth = 1 + depth * 1.4; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.quadraticCurveTo(x, y - 2 - depth * 2, x + w / 2, y); ctx.stroke();
  }
};

// ---- lighting overlay -------------------------------------------------------------------------------------------------
const lighting = (ctx, s, geo, venue) => {
  const dim = venue === 'dohyo' ? 0.55 : 0.4;
  ctx.fillStyle = rad(ctx, geo.mid, geo.gy - geo.H * 0.3, geo.rx * 0.5, Math.max(s.w, s.h) * 0.85, [[0, 'rgba(0,0,0,0)'], [1, `rgba(10,8,20,${dim})`]]); ctx.fillRect(s.x, s.y, s.w, s.h);
  if (venue === 'dohyo') { ctx.fillStyle = rad(ctx, geo.mid, geo.gy - geo.H * 0.5, 0, geo.rx * 1.2, [[0, 'rgba(255,240,200,0.28)'], [1, 'rgba(255,240,200,0)']]); ctx.fillRect(s.x, s.y, s.w, s.h); }
  // floating motes in the light
  ctx.fillStyle = 'rgba(255,248,224,0.5)';
  for (let i = 0; i < 14; i++) { const x = s.x + (hash(i * 3) * s.w + Math.sin(geo.t * 0.4 + i) * 10), y = s.y + ((hash(i * 5 + 1) * s.h - geo.t * (4 + hash(i) * 5)) % s.h + s.h) % s.h; ctx.beginPath(); ctx.arc(x, y, 1 + hash(i + 7) * 1.5, 0, TAU); ctx.fill(); }
};

// ---- the scene --------------------------------------------------------------------------------------------------------
// Draws sky, backdrop, stands, floor and ring. Returns the geometry for the fighters. `pulse` (0..1) excites the crowd.
export function drawVenue(ctx, s, S, geo, T, pulse, P) {
  const venue = geo.venue;
  geo.t = T;
  skyAndLight(ctx, s, S, geo.hy, T);
  backdrop(ctx, s, geo, S, venue, T, pulse);
  if (venue === 'boats' || venue === 'beam') water(ctx, s, geo, S, T, venue);
  else floor(ctx, s, geo, S, venue === 'meadow' ? 'grass' : 'dirt');
  ringSurface(ctx, s, geo, S, venue, T, P);
  if (venue === 'dohyo') dohyoRoof(ctx, s, S);
}
export function drawLight(ctx, s, geo, venue) { lighting(ctx, s, geo, venue); }

// platform that carries one fighter (jousting boat), drawn before the fighter
export function drawBoat(ctx, x, gy, H, dir, col, trim, T, k) {
  const w = H * 0.75, bob = Math.sin(T * 2.2 + k) * H * 0.012;
  ctx.save(); ctx.translate(x, gy + bob);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(ctx, w * 0.05, H * 0.07, w * 1.0, H * 0.05); ctx.fill();
  // hull
  ctx.fillStyle = lin(ctx, 0, -H * 0.02, 0, H * 0.1, [[0, shade(col, 0.2)], [1, shade(col, -0.35)]]);
  ctx.beginPath(); ctx.moveTo(-w, -H * 0.02); ctx.quadraticCurveTo(-w * 0.8, H * 0.1, -w * 0.2, H * 0.1); ctx.lineTo(w * 0.4, H * 0.1); ctx.quadraticCurveTo(w * 0.95, H * 0.08, w * 1.05 * dir, -H * 0.06); ctx.lineTo(w, -H * 0.02); ctx.closePath(); ctx.fill();
  ctx.fillStyle = trim; ctx.fillRect(-w * 0.9, H * 0.005, w * 1.85, H * 0.016);
  // raised platform (the jousting stand)
  ctx.fillStyle = '#8a5a2a'; ctx.fillRect(-w * 0.55, -H * 0.05, w * 1.1, H * 0.035);
  ctx.fillStyle = '#b98a52'; ctx.fillRect(-w * 0.55, -H * 0.06, w * 1.1, H * 0.014);
  ctx.restore();
}

// ---- figures ----------------------------------------------------------------------------------------------------------
// tapered capsule path from (ax, ay) to (bx, by) with end widths w0, w1
const seg = (ctx, ax, ay, bx, by, w0, w1) => {
  const a = Math.atan2(by - ay, bx - ax);
  ctx.beginPath();
  ctx.arc(ax, ay, w0 / 2, a + Math.PI / 2, a + Math.PI * 1.5);
  ctx.arc(bx, by, w1 / 2, a - Math.PI / 2, a + Math.PI / 2);
  ctx.closePath();
};
const limb = (ctx, a, m, b, w0, wm, w1, c0, c1 = c0) => {
  ctx.fillStyle = c0; seg(ctx, a[0], a[1], m[0], m[1], w0, wm); ctx.fill();
  ctx.fillStyle = c1; seg(ctx, m[0], m[1], b[0], b[1], wm, w1); ctx.fill();
  ctx.fillStyle = c0 === c1 ? c0 : c1; ctx.beginPath(); ctx.arc(m[0], m[1], wm / 2, 0, TAU); ctx.fill();
  // soft highlight toward the light
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1, wm * 0.28);
  const o = -wm * 0.18; ctx.beginPath(); ctx.moveTo(a[0] + o, a[1] + o); ctx.lineTo(m[0] + o, m[1] + o); ctx.lineTo(b[0] + o, b[1] + o); ctx.stroke();
};
const joint = (ax, ay, bx, by, s, bend) => {
  const dx = bx - ax, dy = by - ay, d = Math.max(1e-3, Math.hypot(dx, dy)), h = Math.sqrt(Math.max(0, s * s - (d / 2) * (d / 2)));
  return [ax + dx / 2 + (-dy / d) * h * bend, ay + dy / 2 + (dx / d) * h * bend];
};

export const OUTFITS = ['mawashi', 'jacket', 'robe', 'tunic', 'skirt'];

// f = { pose }, spec = fighter spec { color, trim, outfit, build, skin, hair }, o = { T, dir, weapon, wob, tint }
export function drawFigure(ctx, pose, spec, x, ground, H, dir, o) {
  const p = pose, build = spec.build ?? 1, skin = spec.skin, skinD = shade(skin, -0.25);
  const body = spec.color, trim = spec.trim, outfit = spec.outfit ?? 'tunic';
  const legCol = outfit === 'mawashi' ? skin : outfit === 'jacket' ? mix(body, '#000000', 0.25) : outfit === 'robe' ? body : mix(trim, '#000000', 0.35);
  const bob = Math.sin(o.T * 2.4 + (dir > 0 ? 0 : 1.7)) * H * 0.006 * (1 - p.down);
  const breathe = 1 + Math.sin(o.T * 2.4 + (dir > 0 ? 0 : 1.7)) * 0.012;
  ctx.save();
  ctx.translate(x, ground);
  // falling: the whole body rotates about the feet, away from the opponent
  if (p.down > 0.001) { ctx.rotate(-dir * p.down * 1.38); ctx.translate(0, -p.down * H * 0.06); }
  ctx.translate(-x, -ground);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const lean = p.lean + (o.wob ?? 0);
  const legH = 0.5 * H * (1 - p.crouch * 0.55);
  const hipX = x + dir * Math.sin(lean) * 0.08 * H, hipY = ground - legH + bob;
  const a = lean, torso = 0.3 * H * breathe;
  const shX = hipX + dir * Math.sin(a) * torso, shY = hipY - Math.cos(a) * torso;
  const nkX = shX + dir * Math.sin(a) * 0.035 * H, nkY = shY - Math.cos(a) * 0.035 * H;
  const headX = shX + dir * Math.sin(a) * 0.105 * H, headY = shY - Math.cos(a) * 0.105 * H;
  const legSeg = 0.26 * H, armSeg = 0.17 * H;
  const feet = [[x + dir * p.sf * H, ground], [x + dir * p.sb * H, ground]];
  const lift = [Math.max(0, p.sf - 0.2) * H * 0.0, 0];
  const kneeF = joint(hipX, hipY, feet[0][0], ground - lift[0], legSeg, dir > 0 ? -1 : 1), kneeB = joint(hipX, hipY, feet[1][0], ground, legSeg, dir > 0 ? -1 : 1);
  const handF = [shX + dir * p.hf[0] * H, shY - p.hf[1] * H], handB = [shX + dir * p.hb[0] * H, shY - p.hb[1] * H];
  const elbF = joint(shX, shY, handF[0], handF[1], armSeg, dir > 0 ? 1 : -1), elbB = joint(shX, shY, handB[0], handB[1], armSeg, dir > 0 ? 1 : -1);
  const wl = 0.15 * H * build, wk = 0.112 * H * build, wa = 0.088 * H * (0.78 + 0.22 * build);
  const sleeve = outfit === 'jacket' || outfit === 'tunic';
  const armCol = sleeve ? body : skin;
  const foot = (fx, col) => { ctx.fillStyle = col; ell(ctx, fx + dir * H * 0.03, ground - H * 0.008, H * 0.065, H * 0.022); ctx.fill(); };

  // contact shadow handled by caller; back arm and leg first (darker, farther from the light)
  limb(ctx, [shX, shY], elbB, handB, wa, wa * 0.9, wa * 0.75, shade(armCol, -0.22), shade(skin, -0.22));
  limb(ctx, [hipX, hipY], kneeB, feet[1], wl * 0.95, wk, wk * 0.7, shade(legCol, -0.25), outfit === 'robe' || outfit === 'mawashi' ? shade(skin, -0.25) : shade(legCol, -0.25));
  foot(feet[1][0], outfit === 'jacket' ? '#2a2018' : shade(skin, -0.3));

  // torso
  const tw0 = 0.19 * H * build, tw1 = 0.21 * H * build;
  ctx.fillStyle = outfit === 'jacket' || outfit === 'tunic' || outfit === 'robe' ? body : skin;
  seg(ctx, hipX, hipY, shX, shY, tw0, tw1); ctx.fill();
  if (build > 1.1) { // belly
    ctx.fillStyle = outfit === 'mawashi' ? skin : body;
    ell(ctx, (hipX + shX) / 2 + dir * 0.035 * H * build, (hipY + shY) / 2 + torso * 0.08, 0.1 * H * build * 0.8, torso * 0.46); ctx.fill();
  }
  // body shading: a darker band along the far side and a highlight on the near shoulder
  ctx.fillStyle = 'rgba(0,0,0,0.14)'; seg(ctx, hipX + dir * tw0 * 0.18, hipY, shX + dir * tw1 * 0.18, shY, tw0 * 0.45, tw1 * 0.45); ctx.fill();
  if (outfit === 'mawashi') {
    // belt and loincloth: a band at the hips and an apron in front
    ctx.fillStyle = body; seg(ctx, hipX - dir * 0.005 * H, hipY - 0.01 * H, hipX + dir * Math.sin(a) * 0.035 * H, hipY - 0.065 * H, tw0 * 1.12, tw0 * 1.1); ctx.fill();
    ctx.fillStyle = trim; seg(ctx, hipX, hipY - 0.05 * H, hipX + dir * Math.sin(a) * 0.02 * H, hipY - 0.055 * H, tw0 * 1.14, tw0 * 1.14); ctx.fill();
    ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(hipX + dir * tw0 * 0.1, hipY - 0.03 * H); ctx.lineTo(hipX + dir * tw0 * 0.62, hipY - 0.02 * H); ctx.lineTo(hipX + dir * tw0 * 0.55, hipY + 0.1 * H); ctx.lineTo(hipX + dir * tw0 * 0.12, hipY + 0.09 * H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = trim; ctx.lineWidth = Math.max(1, H * 0.006); for (let i = 0; i < 3; i++) { const t = (i + 1) / 4, xx = hipX + dir * tw0 * (0.1 + 0.5 * t); ctx.beginPath(); ctx.moveTo(xx, hipY - 0.01 * H); ctx.lineTo(xx, hipY + 0.085 * H); ctx.stroke(); }
  } else if (outfit === 'jacket') {
    ctx.fillStyle = trim; seg(ctx, hipX + dir * Math.sin(a) * 0.02 * H, hipY - 0.045 * H, hipX + dir * Math.sin(a) * 0.05 * H, hipY - 0.06 * H, tw0 * 1.1, tw0 * 1.1); ctx.fill();
    ctx.strokeStyle = trim; ctx.lineWidth = Math.max(1.5, H * 0.012);
    ctx.beginPath(); ctx.moveTo(shX + dir * 0.02 * H, shY - 0.01 * H); ctx.lineTo((hipX + shX) / 2 - dir * 0.0, (hipY + shY) / 2); ctx.lineTo(hipX + dir * 0.02 * H, hipY - 0.05 * H); ctx.stroke();
  } else if (outfit === 'robe') {
    ctx.fillStyle = trim; ctx.beginPath(); ctx.moveTo(shX - dir * 0.04 * H, shY); ctx.lineTo(shX + dir * 0.03 * H, shY + 0.01 * H); ctx.lineTo(hipX + dir * 0.06 * H, hipY - 0.04 * H); ctx.lineTo(hipX - dir * 0.02 * H, hipY - 0.03 * H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = trim; seg(ctx, hipX, hipY - 0.04 * H, hipX + dir * Math.sin(a) * 0.04 * H, hipY - 0.06 * H, tw0 * 1.06, tw0 * 1.06); ctx.fill();
  } else if (outfit === 'skirt') {
    ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(hipX - tw0 * 0.55, hipY - 0.06 * H); ctx.lineTo(hipX + tw0 * 0.55, hipY - 0.06 * H); ctx.lineTo(hipX + tw0 * 0.8 + dir * 0.02 * H, hipY + 0.14 * H); ctx.lineTo(hipX - tw0 * 0.8 + dir * 0.02 * H, hipY + 0.14 * H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = trim; ctx.fillRect(hipX - tw0 * 0.6, hipY - 0.07 * H, tw0 * 1.2, 0.02 * H);
    ctx.strokeStyle = trim; ctx.lineWidth = Math.max(2, H * 0.012); ctx.beginPath(); ctx.moveTo(shX - dir * 0.05 * H, shY + 0.01 * H); ctx.lineTo(hipX + dir * 0.06 * H, hipY - 0.06 * H); ctx.stroke();
  }
  // front leg over the torso base
  limb(ctx, [hipX, hipY], kneeF, feet[0], wl, wk, wk * 0.72, legCol, outfit === 'robe' || outfit === 'mawashi' ? skin : legCol);
  if (outfit === 'robe') { ctx.strokeStyle = trim; ctx.lineWidth = Math.max(1.5, H * 0.01); ctx.beginPath(); const mx = (hipX + kneeF[0]) / 2, my = (hipY + kneeF[1]) / 2; ctx.moveTo(kneeF[0] - wk * 0.5, kneeF[1]); ctx.lineTo(kneeF[0] + wk * 0.5, kneeF[1] + 2); ctx.stroke(); void mx; void my; }
  foot(feet[0][0], outfit === 'jacket' ? '#3a2a1c' : skin);

  // neck and head
  ctx.fillStyle = skin; seg(ctx, nkX, nkY, headX, headY + 0.02 * H, 0.055 * H, 0.05 * H); ctx.fill();
  const hr = 0.075 * H;
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(headX, headY, hr, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.arc(headX - hr * 0.25, headY - hr * 0.25, hr * 0.55, 0, TAU); ctx.fill();
  // face looks toward the opponent
  ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.arc(headX + dir * hr * 0.45, headY - hr * 0.05, Math.max(1.2, hr * 0.1), 0, TAU); ctx.fill();
  ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = Math.max(1, hr * 0.1); ctx.beginPath(); ctx.moveTo(headX + dir * hr * 0.28, headY - hr * 0.25); ctx.lineTo(headX + dir * hr * 0.68, headY - hr * 0.22 + (p.stick < 0 ? 0 : 0)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(headX + dir * hr * 0.35, headY + hr * 0.38); ctx.lineTo(headX + dir * hr * 0.6, headY + hr * 0.36); ctx.stroke();
  const hair = spec.hair ?? 'band';
  const hairCol = '#241814';
  if (hair === 'topknot') {
    ctx.fillStyle = hairCol; ctx.beginPath(); ctx.arc(headX - dir * hr * 0.05, headY - hr * 0.1, hr * 1.04, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
    ctx.beginPath(); ctx.ellipse(headX - dir * hr * 0.2, headY - hr * 1.2, hr * 0.38, hr * 0.28, -dir * 0.3, 0, TAU); ctx.fill();
  } else if (hair === 'turban') {
    ctx.fillStyle = trim; ctx.beginPath(); ctx.ellipse(headX - dir * hr * 0.08, headY - hr * 0.5, hr * 1.12, hr * 0.78, 0, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
    ctx.strokeStyle = shade(trim, -0.3); ctx.lineWidth = 1.5; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(headX - dir * hr * 0.05, headY - hr * 0.3, hr * (0.78 + i * 0.12), Math.PI * 1.1 + i * 0.06, Math.PI * 1.9 - i * 0.06); ctx.stroke(); }
  } else if (hair === 'cap') {
    ctx.fillStyle = trim; ctx.beginPath(); ctx.arc(headX, headY - hr * 0.1, hr * 1.06, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
    ctx.fillStyle = shade(trim, -0.3); ctx.fillRect(headX - hr * 1.05, headY - hr * 0.2, hr * 2.1, hr * 0.2);
  } else if (hair === 'none') {
    ctx.fillStyle = hairCol; ctx.beginPath(); ctx.arc(headX - dir * hr * 0.08, headY - hr * 0.12, hr * 1.02, Math.PI * 1.1, Math.PI * 1.95); ctx.fill();
  } else { // headband
    ctx.fillStyle = hairCol; ctx.beginPath(); ctx.arc(headX - dir * hr * 0.1, headY - hr * 0.1, hr * 1.03, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
    ctx.fillStyle = trim; ctx.fillRect(headX - hr * 1.0, headY - hr * 0.55, hr * 2.0, hr * 0.28);
    ctx.beginPath(); ctx.moveTo(headX - dir * hr, headY - hr * 0.42); ctx.lineTo(headX - dir * hr * 1.9, headY - hr * 0.1 + Math.sin(o.T * 4) * hr * 0.15); ctx.lineTo(headX - dir * hr * 1.0, headY - hr * 0.2); ctx.closePath(); ctx.fill();
  }

  // weapons and props
  const angle = (p.stick * Math.PI) / 180;
  const stickBetween = (hand, len, w, col, ang, ends) => {
    const e = [hand[0] + dir * Math.cos(ang) * len, hand[1] - Math.sin(ang) * len];
    const t = [hand[0] - dir * Math.cos(ang) * len * 0.15, hand[1] + Math.sin(ang) * len * 0.15];
    ctx.fillStyle = col; seg(ctx, t[0], t[1], e[0], e[1], w * 1.1, w * 0.9); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = Math.max(1, w * 0.25); ctx.beginPath(); ctx.moveTo(t[0] - w * 0.15, t[1] - w * 0.15); ctx.lineTo(e[0] - w * 0.15, e[1] - w * 0.15); ctx.stroke();
    if (ends) { ctx.fillStyle = '#6a5a3a'; for (const q of [t, e]) { ctx.beginPath(); ctx.arc(q[0], q[1], w * 0.62, 0, TAU); ctx.fill(); } }
  };
  const wf = o.weapon?.front, wb = o.weapon?.back;
  if (wb === 'stick') stickBetween(handB, 0.42 * H, 0.03 * H, '#b98d52', angle * 0.6 + 0.2, false);
  if (wb === 'shield') {
    const sx = handB[0] + dir * 0.05 * H, sy = handB[1];
    ctx.fillStyle = lin(ctx, sx - 0.06 * H, sy, sx + 0.06 * H, sy, [[0, '#f0e4cc'], [1, '#bda37a']]); rr(ctx, sx - 0.07 * H, sy - 0.19 * H, 0.14 * H, 0.38 * H, 0.06 * H); ctx.fill();
    ctx.fillStyle = '#4a2d18'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(sx + (hash(i) - 0.5) * 0.07 * H, sy + (i - 2) * 0.07 * H, 0.016 * H, 0.025 * H, 0.3, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#3a2410'; ctx.lineWidth = Math.max(2, 0.014 * H); rr(ctx, sx - 0.07 * H, sy - 0.19 * H, 0.14 * H, 0.38 * H, 0.06 * H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx, sy - 0.18 * H); ctx.lineTo(sx, sy + 0.18 * H); ctx.stroke();
  }
  limb(ctx, [shX, shY], elbF, handF, wa, wa * 0.92, wa * 0.78, armCol, skin);
  if (sleeve) { ctx.fillStyle = trim; ctx.beginPath(); ctx.arc(elbF[0], elbF[1], wa * 0.5, 0, TAU); ctx.fill(); }
  if (wf === 'staff') stickBetween(handF, 0.82 * H, 0.032 * H, '#c9a56a', angle, true);
  else if (wf === 'stick') stickBetween(handF, 0.5 * H, 0.03 * H, '#d2ae72', angle, false);
  else if (wf === 'pillow') {
    const e = [handF[0] + dir * Math.cos(angle) * 0.36 * H, handF[1] - Math.sin(angle) * 0.36 * H];
    ctx.fillStyle = '#f4efe0'; seg(ctx, handF[0], handF[1], e[0], e[1], 0.14 * H, 0.15 * H); ctx.fill();
    ctx.strokeStyle = trim; ctx.lineWidth = Math.max(2, 0.014 * H); ctx.beginPath(); ctx.moveTo(handF[0] + (e[0] - handF[0]) * 0.3, handF[1] + (e[1] - handF[1]) * 0.3 - 0.06 * H); ctx.lineTo(handF[0] + (e[0] - handF[0]) * 0.3, handF[1] + (e[1] - handF[1]) * 0.3 + 0.06 * H); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; seg(ctx, handF[0], handF[1] + 0.03 * H, e[0], e[1] + 0.03 * H, 0.06 * H, 0.06 * H); ctx.fill();
  }
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(handF[0], handF[1], 0.032 * H, 0, TAU); ctx.fill();
  ctx.fillStyle = skinD; ctx.beginPath(); ctx.arc(handF[0] + dir * 0.008 * H, handF[1] + 0.008 * H, 0.014 * H, 0, TAU); ctx.fill();
  ctx.restore();
  return { head: [headX, headY], hip: [hipX, hipY], chest: [(hipX + shX) / 2 + dir * 0.03 * H, (hipY + shY) / 2] };
}

export function groundShadow(ctx, x, gy, H, down) {
  const w = H * (0.2 + down * 0.45);
  ctx.save();
  ctx.translate(x + H * 0.05, gy + 2);
  ctx.scale(1, 0.2);
  ctx.fillStyle = rad(ctx, 0, 0, 0, w, [[0, 'rgba(0,0,0,0.4)'], [1, 'rgba(0,0,0,0)']]);
  ctx.beginPath(); ctx.arc(0, 0, w, 0, TAU); ctx.fill();
  ctx.restore();
}

// ---- balance dial -----------------------------------------------------------------------------------------------------
// A half-circle gauge over the fighter. fraction 0..1; grip 0..1 or null. Needle swings toward the red as balance fails.
export function drawDial(ctx, x, y, r, frac, grip, T, side, color) {
  const col = frac > 0.6 ? '#58c27d' : frac > 0.3 ? '#f2c14e' : '#e0603a';
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(10,14,22,0.7)'; ctx.beginPath(); ctx.arc(0, 0, r * 1.2, Math.PI, TAU); ctx.lineTo(r * 1.2, r * 0.16); ctx.lineTo(-r * 1.2, r * 0.16); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, r * 0.08); ctx.beginPath(); ctx.arc(0, 0, r * 1.2, Math.PI, TAU); ctx.lineTo(r * 1.2, r * 0.16); ctx.lineTo(-r * 1.2, r * 0.16); ctx.closePath(); ctx.stroke();
  const zones = [[0, 0.3, '#e0603a'], [0.3, 0.6, '#f2c14e'], [0.6, 1, '#58c27d']];
  const rad0 = grip != null ? r * 0.86 : r * 0.78;
  for (const [a0, a1, c] of zones) { ctx.strokeStyle = rgba(c, 0.38); ctx.lineWidth = r * 0.24; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.arc(0, 0, rad0, Math.PI + a0 * Math.PI, Math.PI + a1 * Math.PI); ctx.stroke(); }
  ctx.strokeStyle = col; ctx.lineWidth = r * 0.24; ctx.beginPath(); ctx.arc(0, 0, rad0, Math.PI, Math.PI + frac * Math.PI); ctx.stroke();
  if (grip != null) {
    ctx.strokeStyle = 'rgba(111,180,255,0.25)'; ctx.lineWidth = r * 0.13; ctx.beginPath(); ctx.arc(0, 0, r * 0.55, Math.PI, TAU); ctx.stroke();
    ctx.strokeStyle = '#6fb4ff'; ctx.beginPath(); ctx.arc(0, 0, r * 0.55, Math.PI, Math.PI + clamp(grip, 0, 1) * Math.PI); ctx.stroke();
  }
  const wob = frac < 0.35 ? Math.sin(T * 14 + side) * (0.35 - frac) * 0.1 : 0;
  const ang = Math.PI + clamp(frac + wob, 0, 1) * Math.PI;
  ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2, r * 0.1); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang) * r * 0.95, Math.sin(ang) * r * 0.95); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, r * 0.14, 0, TAU); ctx.fill();
  ctx.restore();
}

// ground ring under a fighter: its size and colour show how steady the stance is (colour is never the only signal)
export function drawStance(ctx, x, gy, H, frac, T) {
  const col = frac > 0.6 ? '#9be3a8' : frac > 0.3 ? '#ffe38a' : '#ff9a7a';
  const w = H * (0.12 + 0.12 * frac) * (1 + (frac < 0.3 ? Math.sin(T * 12) * 0.06 : 0));
  ctx.strokeStyle = rgba(col, 0.8); ctx.lineWidth = Math.max(2, H * 0.012);
  if (frac < 0.3) ctx.setLineDash([5, 5]);
  ell(ctx, x, gy + 3, w, w * 0.22); ctx.stroke(); ctx.setLineDash([]);
}

// ---- effects ----------------------------------------------------------------------------------------------------------
// fx: { kind, t, life, x (ring units from the centre), y (height in H, 0 = ground), seed, dir, big, text, color }
export function drawFx(ctx, fx, geo, S) {
  const { mid, rx, gy, H } = geo;
  const k = fx.t / fx.life;
  if (k < 0 || k > 1) return;
  const X = mid + fx.x * rx, Y = fx.kind === 'text' ? geo.textY : gy - fx.y * H;
  ctx.save();
  switch (fx.kind) {
    case 'burst': {
      const r = H * (0.12 + 0.1 * (fx.big ? 1 : 0)) * (0.5 + k * 1.2);
      ctx.globalAlpha = 1 - k * k;
      ctx.fillStyle = fx.color ?? '#fff6c8';
      const n = 10;
      ctx.beginPath();
      for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * TAU + fx.seed, rr0 = i % 2 ? r * 0.38 : r * (0.8 + 0.4 * hash(i + fx.seedI)); ctx.lineTo(X + Math.cos(a) * rr0, Y + Math.sin(a) * rr0); }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(2, H * 0.012); ctx.beginPath(); ctx.arc(X, Y, r * (0.6 + k * 0.9), 0, TAU); ctx.stroke();
      break; }
    case 'block': {
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = '#d9ecff'; ctx.lineWidth = Math.max(3, H * 0.02);
      ctx.beginPath(); ctx.arc(X, Y, H * (0.1 + k * 0.1), -1.1 + (fx.dir > 0 ? Math.PI : 0), 1.1 + (fx.dir > 0 ? Math.PI : 0)); ctx.stroke();
      for (let i = 0; i < 6; i++) { const a = -1 + i * 0.4 + (fx.dir > 0 ? Math.PI : 0), d = H * (0.1 + k * 0.22); ctx.beginPath(); ctx.moveTo(X + Math.cos(a) * d * 0.8, Y + Math.sin(a) * d * 0.8); ctx.lineTo(X + Math.cos(a) * d * 1.25, Y + Math.sin(a) * d * 1.25); ctx.stroke(); }
      break; }
    case 'dust': {
      const n = fx.big ? 9 : 5;
      for (let i = 0; i < n; i++) {
        const dx = (hash(fx.seedI + i * 3) - 0.5) * 2, up = 0.4 + hash(fx.seedI + i * 5 + 1);
        const x = X + dx * H * (0.1 + k * 0.28), y = Y - k * H * 0.16 * up, r = H * (0.035 + k * 0.07) * (0.7 + hash(i + fx.seedI));
        ctx.globalAlpha = (1 - k) * 0.55;
        ctx.fillStyle = rad(ctx, x, y, 0, r, [[0, rgba(shade(S.ground, 0.4), 0.9)], [1, rgba(shade(S.ground, 0.25), 0)]]);
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      }
      break; }
    case 'splash': {
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(X, Y, H * (0.1 + k * 0.4), H * (0.02 + k * 0.08), 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(235,248,255,0.95)';
      for (let i = 0; i < 12; i++) { const vx = (hash(fx.seedI + i) - 0.5) * 1.6, vy = 0.6 + hash(fx.seedI + i + 9) * 0.9; const t = k * 1.4; ctx.beginPath(); ctx.arc(X + vx * H * 0.35 * t, Y - (vy * t - 1.5 * t * t) * H * 0.35, Math.max(1.5, H * 0.012), 0, TAU); ctx.fill(); }
      break; }
    case 'text': {
      const rise = k * H * 0.18, pop = k < 0.15 ? 0.6 + (k / 0.15) * 0.5 : 1.1 - Math.min(0.1, (k - 0.15) * 0.3);
      ctx.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
      ctx.translate(X, Y - rise); ctx.scale(pop, pop);
      const px = Math.max(16, H * 0.1);
      ctx.font = `900 ${Math.round(px)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = Math.max(4, px * 0.22); ctx.strokeStyle = 'rgba(20,12,6,0.85)'; ctx.lineJoin = 'round'; ctx.strokeText(fx.text, 0, 0);
      ctx.fillStyle = fx.color ?? '#ffe38a'; ctx.fillText(fx.text, 0, 0);
      break; }
    default: break;
  }
  ctx.restore();
}

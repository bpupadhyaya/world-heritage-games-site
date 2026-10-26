// Tables, trays and cups for the dice engine: felt tray with a walnut rim, planked tavern table with a rope edge, wooden bowl,
// checked cloth, and the leather dice cup. Pure drawing from a few theme colours; deterministic textures (hash, no randomness).
const TAU = Math.PI * 2;
const hash = (n) => { let x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const rgb = (c) => { const m = /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(String(c)); if (m) return [Number(m[1]), Number(m[2]), Number(m[3])]; const h = String(c).replace('#', ''); const f = h.length === 3 ? h.split('').map((x) => x + x).join('') : h.padEnd(6, '0'); return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)]; };
export const tint = (c, k, add = 0) => { const p = rgb(c); const f = (v) => Math.max(0, Math.min(255, Math.round(v * k + add))); return `rgb(${f(p[0])},${f(p[1])},${f(p[2])})`; };
export const alpha = (c, a) => { const p = rgb(c); return `rgba(${p[0]},${p[1]},${p[2]},${a})`; };
const rr = (ctx, x, y, w, h, r) => { r = Math.max(0, Math.min(r, w / 2, h / 2)); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };

export function woodGrain(ctx, x, y, w, h, base, seed = 1, o = {}) {
  const vertical = o.vertical === true, n = o.lines ?? Math.max(8, Math.round((vertical ? w : h) / 7));
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const t = (i + hash(seed + i) * 0.8) / n, a = (0.05 + hash(seed * 3 + i) * 0.09) * (o.strength ?? 1);
    const dark = hash(seed + i * 7) > 0.35;
    ctx.strokeStyle = dark ? `rgba(20,8,0,${a})` : `rgba(255,225,170,${a * 0.7})`;
    ctx.lineWidth = 0.6 + hash(seed + i * 11) * 1.8;
    ctx.beginPath();
    const wob = (hash(seed + i * 5) - 0.5) * (vertical ? w : h) * 0.06;
    if (vertical) { const px = x + t * w; ctx.moveTo(px, y); ctx.bezierCurveTo(px + wob, y + h * 0.33, px - wob, y + h * 0.66, px + wob * 0.4, y + h); }
    else { const py = y + t * h; ctx.moveTo(x, py); ctx.bezierCurveTo(x + w * 0.33, py + wob, x + w * 0.66, py - wob, x + w, py + wob * 0.4); }
    ctx.stroke();
  }
  if (o.knots) for (let k = 0; k < o.knots; k++) {   // a few knots
    const kx = x + hash(seed + k * 31) * w, ky = y + hash(seed + k * 17) * h, kr = (vertical ? w : h) * (0.03 + hash(seed + k) * 0.03);
    for (let j = 3; j >= 1; j--) { ctx.strokeStyle = `rgba(30,12,0,${0.1 + j * 0.03})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(kx, ky, kr * j * 1.1, kr * j * 0.55, 0, 0, TAU); ctx.stroke(); }
  }
  ctx.restore();
}

// ---- the tray -----------------------------------------------------------------------------------------------------------
export function trayRects(outer, T) {
  const rw = Math.max(10, Math.min(outer.w, outer.h) * (T.rimW ?? 0.05));
  return { rim: rw, surf: { x: outer.x + rw, y: outer.y + rw, w: outer.w - 2 * rw, h: outer.h - 2 * rw } };
}

export function drawTray(ctx, ui, outer, T, m, o = {}) {
  const { rim: rw, surf } = trayRects(outer, T);
  const R = Math.min(outer.w, outer.h) * (T.round ?? 0.06), r2 = Math.max(4, R - rw * 0.55);
  const kind = T.kind ?? 'felt';
  ctx.save();
  // soft drop shadow of the whole tray on the table
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 10;
  rr(ctx, outer.x, outer.y, outer.w, outer.h, R); ctx.fillStyle = T.rim ?? '#4a2a14'; ctx.fill();
  ctx.restore();
  // rim: wood (or rope-wrapped wood)
  ctx.save(); rr(ctx, outer.x, outer.y, outer.w, outer.h, R); ctx.clip();
  const rg = ctx.createLinearGradient(outer.x, outer.y, outer.x, outer.y + outer.h);
  rg.addColorStop(0, T.rim2 ?? '#8a5a34'); rg.addColorStop(0.5, T.rim ?? '#5a331b'); rg.addColorStop(1, tint(T.rim ?? '#5a331b', 0.6));
  ctx.fillStyle = rg; ctx.fillRect(outer.x, outer.y, outer.w, outer.h);
  woodGrain(ctx, outer.x, outer.y, outer.w, outer.h, T.rim, T.seed ?? 3, { strength: 1.2, lines: 22 });
  ctx.restore();
  // rim bevel
  rr(ctx, outer.x + 1, outer.y + 1, outer.w - 2, outer.h - 2, R); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,235,200,0.28)'; ctx.stroke();
  rr(ctx, outer.x, outer.y, outer.w, outer.h, R); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.stroke();

  // playing surface
  ctx.save(); rr(ctx, surf.x, surf.y, surf.w, surf.h, r2); ctx.clip();
  const sg = ctx.createRadialGradient(surf.x + surf.w * 0.5, surf.y + surf.h * 0.42, surf.h * 0.1, surf.x + surf.w * 0.5, surf.y + surf.h * 0.5, Math.max(surf.w, surf.h) * 0.72);
  sg.addColorStop(0, T.surface2 ?? '#2a8561'); sg.addColorStop(1, T.surface ?? '#1d6a4a');
  ctx.fillStyle = sg; ctx.fillRect(surf.x, surf.y, surf.w, surf.h);
  if (kind === 'felt') {
    // fibre speckle and a faint nap
    for (let i = 0; i < 420; i++) { const px = surf.x + hash(i * 1.7) * surf.w, py = surf.y + hash(i * 2.9 + 4) * surf.h; ctx.fillStyle = hash(i) > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)'; ctx.fillRect(px, py, 1.6, 1.6); }
  } else if (kind === 'plank') {
    const pw = surf.w / 4;
    for (let i = 0; i < 4; i++) {
      const px = surf.x + i * pw, tone = 0.86 + hash(i + 3) * 0.28;
      ctx.fillStyle = `rgba(${hash(i) > 0.5 ? '255,220,160' : '0,0,0'},${0.05 + hash(i * 2) * 0.05})`; ctx.fillRect(px, surf.y, pw, surf.h);
      woodGrain(ctx, px, surf.y, pw, surf.h, T.surface, 20 + i * 5, { vertical: true, strength: 1.6, lines: 9, knots: i % 2 ? 1 : 0 });
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(px - 1, surf.y, 2.4, surf.h); ctx.fillStyle = 'rgba(255,230,190,0.12)'; ctx.fillRect(px + 1.4, surf.y, 1.4, surf.h); void tone;
    }
  } else if (kind === 'cloth') {   // woven lozenge tablecloth
    const s = Math.max(34, surf.w / 11);
    for (let yy = -s; yy < surf.h + s; yy += s) for (let xx = -s; xx < surf.w + s; xx += s) {
      const ox = surf.x + xx + ((Math.round(yy / s) % 2) ? s / 2 : 0), oy = surf.y + yy;
      ctx.fillStyle = T.cloth ?? '#2f6fb8'; ctx.beginPath(); ctx.moveTo(ox, oy - s * 0.36); ctx.lineTo(ox + s * 0.36, oy); ctx.lineTo(ox, oy + s * 0.36); ctx.lineTo(ox - s * 0.36, oy); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.moveTo(ox, oy - s * 0.16); ctx.lineTo(ox + s * 0.16, oy); ctx.lineTo(ox, oy + s * 0.16); ctx.lineTo(ox - s * 0.16, oy); ctx.closePath(); ctx.fill();
    }
    ui.texture(ctx, surf.x, surf.y, surf.w, surf.h, { kind: 'weave', alpha: 0.12 });
  } else if (kind === 'leather') {
    for (let i = 0; i < 700; i++) { const px = surf.x + hash(i * 1.3) * surf.w, py = surf.y + hash(i * 3.1 + 2) * surf.h; ctx.fillStyle = hash(i * 5) > 0.5 ? 'rgba(255,230,190,0.06)' : 'rgba(0,0,0,0.1)'; ctx.beginPath(); ctx.arc(px, py, 1 + hash(i) * 1.8, 0, TAU); ctx.fill(); }
  } else if (kind === 'bowl') {
    for (let i = 1; i < 9; i++) { ctx.strokeStyle = `rgba(0,0,0,${0.05 + (i % 2) * 0.03})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(surf.x + surf.w / 2, surf.y + surf.h / 2, surf.w * 0.5 * (i / 8), surf.h * 0.5 * (i / 8), 0, 0, TAU); ctx.stroke(); }
    woodGrain(ctx, surf.x, surf.y, surf.w, surf.h, T.surface, 77, { strength: 1.1, lines: 30 });
  }
  // inner shadow along the rim and a faint top light
  ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = Math.max(10, rw * 1.5);
  rr(ctx, surf.x - rw, surf.y - rw, surf.w + 2 * rw, surf.h + 2 * rw, r2 + rw); ctx.lineWidth = rw * 2; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.stroke();
  ctx.restore();
  // brass inlay around the surface
  if (T.trim !== false) {
    rr(ctx, surf.x - 1, surf.y - 1, surf.w + 2, surf.h + 2, r2 + 1); ctx.lineWidth = 3; ctx.strokeStyle = T.trim ?? '#d6aa4e'; ctx.stroke();
    rr(ctx, surf.x - 2.2, surf.y - 2.2, surf.w + 4.4, surf.h + 4.4, r2 + 2); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,245,200,0.5)'; ctx.stroke();
  }
  if (T.rope) drawRope(ctx, outer, R, rw, T.rope);
  // keep rack
  if (m && o.rack !== false) drawRack(ctx, m, T, o);
  return { surf };
}

function drawRope(ctx, outer, R, rw, ropeColor) {
  const col = typeof ropeColor === 'string' ? ropeColor : '#d9c08a';
  const x = outer.x + rw * 0.45, y = outer.y + rw * 0.45, w = outer.w - rw * 0.9, h = outer.h - rw * 0.9;
  const path = [];
  const rad = Math.max(4, R - rw * 0.4), step = Math.max(5, rw * 0.62);
  const seg = (x0, y0, x1, y1) => { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / step)); for (let i = 0; i < n; i++) path.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, Math.atan2(y1 - y0, x1 - x0)]); };
  const arc = (cx, cy, a0, a1) => { const n = Math.max(2, Math.round((Math.abs(a1 - a0) * rad) / step)); for (let i = 0; i < n; i++) { const a = a0 + ((a1 - a0) * i) / n; path.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, a + Math.PI / 2]); } };
  seg(x + rad, y, x + w - rad, y); arc(x + w - rad, y + rad, -Math.PI / 2, 0); seg(x + w, y + rad, x + w, y + h - rad); arc(x + w - rad, y + h - rad, 0, Math.PI / 2);
  seg(x + w - rad, y + h, x + rad, y + h); arc(x + rad, y + h - rad, Math.PI / 2, Math.PI); seg(x, y + h - rad, x, y + rad); arc(x + rad, y + rad, Math.PI, Math.PI * 1.5);
  const th = rw * 0.5;
  ctx.save(); ctx.lineCap = 'round';
  rr(ctx, x - th * 0.1, y - th * 0.1, w + th * 0.2, h + th * 0.2, rad); ctx.lineWidth = th * 1.5; ctx.strokeStyle = tint(col, 0.45); ctx.stroke();
  for (let i = 0; i < path.length; i++) {
    const [px, py, a] = path[i], c = Math.cos(a + 0.9), s = Math.sin(a + 0.9);
    ctx.lineWidth = th * 0.5; ctx.strokeStyle = i % 2 ? tint(col, 1.1) : tint(col, 0.72);
    ctx.beginPath(); ctx.moveTo(px - c * th * 0.62, py - s * th * 0.62); ctx.lineTo(px + c * th * 0.62, py + s * th * 0.62); ctx.stroke();
  }
  ctx.restore();
}

function drawRack(ctx, m, T, o) {
  const { surf, S } = m, n = o.n ?? 5;
  const y = m.Y(0.885), h = S * 2.35, x = surf.x + surf.w * 0.03, w = surf.w * 0.94;
  ctx.save();
  rr(ctx, x, y - h / 2, w, h, h * 0.4);
  const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.48)'); g.addColorStop(0.5, 'rgba(0,0,0,0.26)'); g.addColorStop(1, 'rgba(255,240,210,0.1)');
  ctx.fillStyle = g; ctx.fill();
  rr(ctx, x, y - h / 2, w, h, h * 0.4); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.stroke();
  rr(ctx, x + 1, y - h / 2 + h * 0.52, w - 2, h * 0.5 - 1, h * 0.38); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,235,190,0.22)'; ctx.stroke();
  for (let i = 0; i < n; i++) {
    const cx = m.X((i + 0.5) / n);
    ctx.beginPath(); ctx.ellipse(cx, y + S * 0.38, S * 1.12, S * 0.62, 0, 0, TAU); ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(255,235,190,0.12)'; ctx.stroke();
  }
  ctx.restore();
}

// ---- the leather dice cup -------------------------------------------------------------------------------------------------
// o = { x, y (base centre on the table), h (height), tilt (rad, negative = mouth toward the left), lift, shaking, t }
export function drawCup(ctx, o, L = {}) {
  const leather = L.leather ?? '#7b4a26', band = L.band ?? '#d9ad55', stitch = L.stitch ?? '#ecd9a6';
  const h = o.h, rt = h * 0.36, rb = h * 0.27, ry = 0.3;
  const cx = o.x, cy = o.y - (o.lift ?? 0);
  if (o.inverted) return drawCupDown(ctx, o, L, { leather, band, stitch, h, rt: h * 0.44, rb: h * 0.32, ry, cx, cy });
  // table shadow
  ctx.save();
  ctx.translate(o.x + h * 0.08, o.y + h * 0.04); ctx.scale(1, 0.32);
  const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, rb * 1.7); sg.addColorStop(0, `rgba(0,0,0,${0.5 / (1 + (o.lift ?? 0) / h * 2)})`); sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 0, rb * 1.7, 0, TAU); ctx.fill(); ctx.restore();
  ctx.save();
  ctx.translate(cx, cy - h * 0.5); ctx.rotate(o.tilt ?? 0);
  const top = -h / 2, bot = h / 2;
  // body
  const body = () => { ctx.beginPath(); ctx.moveTo(-rt, top); ctx.lineTo(rt, top); ctx.lineTo(rb, bot); ctx.ellipse(0, bot, rb, rb * ry, 0, 0, Math.PI, false); ctx.lineTo(-rt, top); ctx.closePath(); };
  body();
  const bg = ctx.createLinearGradient(-rt, 0, rt, 0);
  bg.addColorStop(0, tint(leather, 0.42)); bg.addColorStop(0.22, tint(leather, 1.18)); bg.addColorStop(0.42, tint(leather, 1.35, 8)); bg.addColorStop(0.75, tint(leather, 0.78)); bg.addColorStop(1, tint(leather, 0.38));
  ctx.fillStyle = bg; ctx.fill();
  ctx.save(); body(); ctx.clip();
  for (let i = 0; i < 160; i++) { const px = (hash(i * 1.9) - 0.5) * 2 * rt, py = top + hash(i * 4.3 + 1) * h; ctx.fillStyle = hash(i * 7) > 0.5 ? 'rgba(255,225,170,0.07)' : 'rgba(0,0,0,0.11)'; ctx.beginPath(); ctx.arc(px, py, 0.8 + hash(i) * 1.3, 0, TAU); ctx.fill(); }
  // gold bands and stitching
  const lerpR = (t) => rt + (rb - rt) * t;
  for (const [t, wd] of [[0.1, 4], [0.86, 4]]) {
    const yy = top + t * h, r = lerpR(t);
    ctx.beginPath(); ctx.ellipse(0, yy, r, r * ry, 0, 0, Math.PI, false); ctx.lineWidth = wd; ctx.strokeStyle = band; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, yy - 1.2, r, r * ry, 0, 0, Math.PI, false); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,250,210,0.7)'; ctx.stroke();
  }
  ctx.setLineDash([5, 4]);
  for (const t of [0.17, 0.79]) { const yy = top + t * h, r = lerpR(t); ctx.beginPath(); ctx.ellipse(0, yy, r - 1, (r - 1) * ry, 0, 0.05, Math.PI - 0.05, false); ctx.lineWidth = 1.6; ctx.strokeStyle = stitch; ctx.stroke(); }
  ctx.setLineDash([]);
  // seam highlight
  const sh = ctx.createLinearGradient(-rt * 0.3, 0, rt * 0.1, 0); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(255,245,220,0.22)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sh; ctx.fillRect(-rt * 0.5, top, rt * 0.7, h);
  ctx.restore();
  // rim: thick lip, dark inside
  ctx.beginPath(); ctx.ellipse(0, top, rt, rt * ry, 0, 0, TAU); ctx.fillStyle = tint(leather, 0.95); ctx.fill();
  ctx.lineWidth = Math.max(3, h * 0.035); ctx.strokeStyle = tint(leather, 1.28, 6); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, top + 1, rt - h * 0.028, (rt - h * 0.028) * ry, 0, 0, TAU);
  const ig = ctx.createLinearGradient(0, top - rt * ry, 0, top + rt * ry); ig.addColorStop(0, '#0e0703'); ig.addColorStop(1, tint(leather, 0.3));
  ctx.fillStyle = ig; ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, top, rt, rt * ry, 0, Math.PI * 1.05, Math.PI * 1.55); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,240,200,0.5)'; ctx.stroke();
  ctx.restore();
}

// the cup upside down on the table (mouth on the cloth, closed base on top): it hides what is under it
function drawCupDown(ctx, o, L, k) {
  const { leather, band, stitch, h, rt, rb, ry, cx, cy } = k;
  ctx.save();
  ctx.translate(o.x + h * 0.06, o.y + h * 0.03); ctx.scale(1, 0.32);
  const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, rt * 1.5); sg.addColorStop(0, `rgba(0,0,0,${0.5 / (1 + (o.lift ?? 0) / h * 3)})`); sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 0, rt * 1.5, 0, TAU); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(cx, cy - h * 0.5); ctx.rotate(o.tilt ?? 0);
  const top = -h / 2, bot = h / 2;       // base (narrow) on top, mouth (wide) at the bottom
  const body = () => { ctx.beginPath(); ctx.moveTo(-rb, top); ctx.lineTo(rb, top); ctx.lineTo(rt, bot); ctx.ellipse(0, bot, rt, rt * ry, 0, 0, Math.PI, false); ctx.lineTo(-rb, top); ctx.closePath(); };
  body();
  const bg = ctx.createLinearGradient(-rt, 0, rt, 0);
  bg.addColorStop(0, tint(leather, 0.42)); bg.addColorStop(0.22, tint(leather, 1.18)); bg.addColorStop(0.42, tint(leather, 1.35, 8)); bg.addColorStop(0.75, tint(leather, 0.78)); bg.addColorStop(1, tint(leather, 0.38));
  ctx.fillStyle = bg; ctx.fill();
  ctx.save(); body(); ctx.clip();
  for (let i = 0; i < 160; i++) { const px = (hash(i * 1.9) - 0.5) * 2 * rt, py = top + hash(i * 4.3 + 1) * h; ctx.fillStyle = hash(i * 7) > 0.5 ? 'rgba(255,225,170,0.07)' : 'rgba(0,0,0,0.11)'; ctx.beginPath(); ctx.arc(px, py, 0.8 + hash(i) * 1.3, 0, TAU); ctx.fill(); }
  const lerpR = (t) => rb + (rt - rb) * t;
  for (const [t, wd] of [[0.12, 5], [0.9, 5]]) { const yy = top + t * h, r = lerpR(t); ctx.beginPath(); ctx.ellipse(0, yy, r, r * ry, 0, 0, Math.PI, false); ctx.lineWidth = wd; ctx.strokeStyle = band; ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, yy - 1.4, r, r * ry, 0, 0, Math.PI, false); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,250,210,0.7)'; ctx.stroke(); }
  ctx.setLineDash([6, 5]);
  for (const t of [0.2, 0.82]) { const yy = top + t * h, r = lerpR(t); ctx.beginPath(); ctx.ellipse(0, yy, r - 1, (r - 1) * ry, 0, 0.05, Math.PI - 0.05, false); ctx.lineWidth = 1.8; ctx.strokeStyle = stitch; ctx.stroke(); }
  ctx.setLineDash([]);
  const sh = ctx.createLinearGradient(-rt * 0.3, 0, rt * 0.1, 0); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(255,245,220,0.22)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sh; ctx.fillRect(-rt * 0.5, top, rt * 0.7, h);
  ctx.restore();
  // mouth rim on the cloth (front lip)
  ctx.beginPath(); ctx.ellipse(0, bot, rt, rt * ry, 0, 0, Math.PI, false); ctx.lineWidth = Math.max(4, h * 0.03); ctx.strokeStyle = tint(leather, 0.62); ctx.stroke();
  // closed base: a full ellipse on top
  ctx.beginPath(); ctx.ellipse(0, top, rb, rb * ry, 0, 0, TAU);
  const cg = ctx.createLinearGradient(-rb, top, rb, top + rb * ry); cg.addColorStop(0, tint(leather, 1.3, 10)); cg.addColorStop(1, tint(leather, 0.85));
  ctx.fillStyle = cg; ctx.fill(); ctx.lineWidth = Math.max(2, h * 0.02); ctx.strokeStyle = tint(leather, 1.4, 12); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, top, rb * 0.55, rb * ry * 0.55, 0, 0, TAU); ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.stroke();
  ctx.restore();
}

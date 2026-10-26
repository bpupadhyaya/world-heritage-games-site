// The hand-written score sheet: a paper card, ruled rows, printed labels, ink for each player, pencil for what a roll would score,
// a yellow highlighter on the chosen row, scribbled crosses for dropped boxes and a total that is underlined twice.
// Drawing only: the activity owns the data. Returns the tappable row rectangles.
import { tint, alpha } from './tray.js';
const TAU = Math.PI * 2;
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const SERIF = '"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif';
const HAND = '"Bradley Hand","Segoe Print","Noteworthy","Chalkboard SE","Comic Sans MS",cursive';

const wobbleLine = (ctx, x0, y0, x1, y1, seed, amp = 1.2) => {
  ctx.beginPath(); ctx.moveTo(x0, y0 + (hash(seed) - 0.5) * amp);
  const n = Math.max(2, Math.round((x1 - x0) / 60));
  for (let i = 1; i <= n; i++) { const t = i / n; ctx.lineTo(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + (hash(seed + i * 3) - 0.5) * amp * 2); }
  ctx.stroke();
};

export function miniFace(ctx, cx, cy, s, v, body, pip) {
  const r = s * 0.2, x = cx - s / 2, y = cy - s / 2;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + s, y, x + s, y + s, r); ctx.arcTo(x + s, y + s, x, y + s, r); ctx.arcTo(x, y + s, x, y, r); ctx.arcTo(x, y, x + s, y, r); ctx.closePath();
  const g = ctx.createLinearGradient(x, y, x, y + s); g.addColorStop(0, tint(body, 1.1, 6)); g.addColorStop(1, tint(body, 0.82));
  ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.stroke();
  const P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]] }[v] ?? [];
  ctx.fillStyle = pip;
  for (const [a, b] of P) { ctx.beginPath(); ctx.arc(cx + a * s * 0.26, cy + b * s * 0.26, s * 0.1, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// sheet = { cols:[{name, ink}], rows:[{id,label,face?,cells:[c0,c1],preview,picked,open,kind}], totals:[a,b], active:0|1, headNote }
// cell = null | number | { v, at, cross }
export function drawSheet(g, rect, sheet, o = {}) {
  const { ctx, ui, px } = g;
  const now = o.now ?? 0;
  const pal = o.paper ?? {};
  const paper = pal.paper ?? '#efe2bf', ink = pal.ink ?? '#26323f', line = pal.line ?? '#a9966c', accent = pal.accent ?? '#b3402b', die = pal.die ?? '#f1e8d0', pipc = pal.pip ?? '#232323';
  const { x, y, w, h } = rect;
  const rows = sheet.rows;
  const nRows = rows.length + 2.3;
  const rowH = Math.min(h / nRows, Math.max(px(50), 32));
  const used = rowH * nRows;
  const top = y + Math.max(0, (h - used) / 2);
  // card
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 7;
  ui.rr(ctx, x, top, w, used, Math.min(18, w * 0.03)); ctx.fillStyle = paper; ctx.fill();
  ctx.restore();
  ctx.save(); ui.rr(ctx, x, top, w, used, Math.min(18, w * 0.03)); ctx.clip();
  const pg = ctx.createLinearGradient(x, top, x + w, top + used); pg.addColorStop(0, tint(paper, 1.07)); pg.addColorStop(1, tint(paper, 0.9));
  ctx.fillStyle = pg; ctx.fillRect(x, top, w, used);
  ui.texture(ctx, x, top, w, used, { kind: 'paper', alpha: 0.2, dark: '#7a5f33', light: '#fff6dc' });
  // a coffee-ring stain and edge toning
  ctx.strokeStyle = 'rgba(120,70,30,0.1)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + w * 0.84, top + used * 0.9, Math.min(w, used) * 0.12, 0.3, 5.6); ctx.stroke();
  const eg = ctx.createRadialGradient(x + w / 2, top + used / 2, Math.min(w, used) * 0.3, x + w / 2, top + used / 2, Math.max(w, used) * 0.75);
  eg.addColorStop(0, 'rgba(120,80,30,0)'); eg.addColorStop(1, 'rgba(120,80,30,0.3)'); ctx.fillStyle = eg; ctx.fillRect(x, top, w, used);

  const labW = w * 0.46, colW = (w - labW) / 2, cx0 = x + labW, cx1 = x + labW + colW;
  const head = rowH * 1.15;
  // header: pen names
  const fh = Math.min(px(24), rowH * 0.55);
  sheet.cols.forEach((c, i) => {
    const cxm = (i === 0 ? cx0 : cx1) + colW / 2;
    if (sheet.active === i) {   // a pencilled underline marks whose turn it is
      ctx.strokeStyle = alpha(c.ink, 0.9); ctx.lineWidth = 2.4; wobbleLine(ctx, cxm - colW * 0.36, top + head * 0.82, cxm + colW * 0.36, top + head * 0.82, 40 + i, 1.5);
    }
    ctx.save(); ctx.translate(cxm, top + head * 0.45); ctx.rotate((hash(i + 5) - 0.5) * 0.06);
    ctx.font = `italic 800 ${Math.round(fh)}px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = c.ink;
    ctx.fillText(fit(ctx, c.name, colW * 0.9), 0, 0);
    ctx.restore();
  });
  ctx.fillStyle = alpha(ink, 0.7); ctx.font = `700 ${Math.round(Math.min(px(18), rowH * 0.4))}px ${SERIF}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(sheet.headNote ?? '', x + 16, top + head * 0.45);
  ctx.strokeStyle = alpha(ink, 0.65); ctx.lineWidth = 2; wobbleLine(ctx, x + 10, top + head, x + w - 10, top + head, 7, 1.2);

  const hits = [];
  let yy = top + head;
  rows.forEach((r, i) => {
    const rh = r.kind === 'gap' ? rowH * 0.3 : rowH;
    const cy = yy + rh / 2;
    if (r.picked) {   // highlighter
      ctx.fillStyle = 'rgba(255,224,80,0.5)'; ctx.beginPath();
      ctx.moveTo(x + 8, yy + 2); ctx.lineTo(x + w - 10, yy + 1); ctx.lineTo(x + w - 8, yy + rh - 2); ctx.lineTo(x + 10, yy + rh - 1); ctx.closePath(); ctx.fill();
    } else if (r.open) { ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x + 6, yy + 1, w - 12, rh - 2); }
    if (r.kind !== 'gap') {
      // label with an optional die face
      let lx = x + 14;
      if (r.face) { const s = Math.min(rowH * 0.74, 34); miniFace(ctx, lx + s / 2, cy, s, r.face, die, pipc); lx += s + 10; }
      const lf = Math.min(px(23), rowH * 0.5);
      ctx.font = `${r.bold ? 800 : 700} ${Math.round(lf)}px ${SERIF}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = ink;
      const lab = fit(ctx, r.label, x + labW - lx - 6);
      ctx.fillText(lab, lx, cy - (r.sub ? lf * 0.18 : 0));
      if (r.sub) { ctx.font = `italic 600 ${Math.round(lf * 0.58)}px ${SERIF}`; ctx.fillStyle = alpha(ink, 0.6); ctx.fillText(fit(ctx, r.sub, x + labW - lx - 6), lx, cy + lf * 0.5); }
      [0, 1].forEach((ci) => {
        const cell = r.cells?.[ci], ccx = (ci === 0 ? cx0 : cx1) + colW / 2;
        writeCell(ctx, cell, ccx, cy, rowH, colW, sheet.cols[ci].ink, now, i * 2 + ci, px, ink);
        if (ci === 0 && (cell == null) && r.preview != null) pencil(ctx, r.preview, ccx, cy, rowH, px, r.picked);
        else if (ci === 1 && cell == null && r.preview1 != null) pencil(ctx, r.preview1, ccx, cy, rowH, px, false);
      });
      hits.push({ id: r.id, x: x + 4, y: yy, w: w - 8, h: rh, open: !!r.open });
    }
    ctx.strokeStyle = alpha(line, 0.8); ctx.lineWidth = 1.1; wobbleLine(ctx, x + 8, yy + rh, x + w - 8, yy + rh, 100 + i * 3, 0.9);
    yy += rh;
  });
  // column rules
  ctx.strokeStyle = alpha(ink, 0.45); ctx.lineWidth = 1.6;
  for (const vx of [cx0, cx1]) { ctx.beginPath(); ctx.moveTo(vx + (hash(vx) - 0.5) * 2, top + 6); const n = 6; for (let k = 1; k <= n; k++) ctx.lineTo(vx + (hash(vx + k) - 0.5) * 3, top + 6 + ((used - 12) * k) / n); ctx.stroke(); }
  // totals
  const tY = yy + rowH * 0.58;
  ctx.font = `800 ${Math.round(Math.min(px(23), rowH * 0.5))}px ${SERIF}`; ctx.textAlign = 'left'; ctx.fillStyle = ink; ctx.textBaseline = 'middle';
  ctx.fillText(sheet.totalLabel ?? 'Total', x + 14, tY);
  [0, 1].forEach((ci) => {
    const ccx = (ci === 0 ? cx0 : cx1) + colW / 2;
    const val = sheet.totals[ci];
    ctx.save(); ctx.translate(ccx, tY); ctx.rotate((hash(ci + 90) - 0.5) * 0.07);
    ctx.font = `italic 900 ${Math.round(Math.min(px(36), rowH * 0.82))}px ${SERIF}`; ctx.textAlign = 'center'; ctx.fillStyle = sheet.cols[ci].ink; ctx.textBaseline = 'middle';
    ctx.fillText(String(Math.round(val)), 0, 0);
    ctx.restore();
    ctx.strokeStyle = alpha(sheet.cols[ci].ink, 0.8); ctx.lineWidth = 2; wobbleLine(ctx, ccx - colW * 0.3, tY + rowH * 0.36, ccx + colW * 0.3, tY + rowH * 0.36, 300 + ci, 1);
    wobbleLine(ctx, ccx - colW * 0.28, tY + rowH * 0.44, ccx + colW * 0.28, tY + rowH * 0.44, 310 + ci, 1);
  });
  ctx.restore();
  // pushed-pin / binder holes on the left edge for a notebook feel
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  void accent;
  ctx.restore();
  return { hits, rowH, top, height: used };
}

function fit(ctx, s, maxW) {
  s = String(s);
  if (ctx.measureText(s).width <= maxW) return s;
  while (s.length > 2 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1);
  return s + '…';
}

function pencil(ctx, v, cx, cy, rowH, px, picked) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.04);
  ctx.font = `italic 700 ${Math.round(Math.min(px(27), rowH * 0.64))}px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = picked ? 'rgba(60,60,70,0.95)' : 'rgba(95,95,105,0.7)';
  ctx.fillText(String(v), 0, 0);
  if (!picked) { ctx.setLineDash([2, 4]); ctx.strokeStyle = 'rgba(95,95,105,0.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-rowH * 0.45, rowH * 0.3); ctx.lineTo(rowH * 0.45, rowH * 0.3); ctx.stroke(); }
  ctx.restore();
}

function writeCell(ctx, cell, cx, cy, rowH, colW, inkC, now, seed, px) {
  if (cell == null) return;
  const v = typeof cell === 'object' ? cell.v : cell, cross = typeof cell === 'object' && cell.cross, at = typeof cell === 'object' ? cell.at ?? -9 : -9;
  const u = Math.max(0, Math.min(1, (now - at) / 0.5));
  ctx.save();
  const w = Math.min(colW * 0.8, rowH * 2);
  ctx.beginPath(); ctx.rect(cx - w / 2 - 6, cy - rowH / 2, (w + 12) * u, rowH); ctx.clip();
  ctx.translate(cx + (hash(seed) - 0.5) * 6, cy + (hash(seed + 9) - 0.5) * 3); ctx.rotate((hash(seed + 4) - 0.5) * 0.12);
  ctx.font = `italic 900 ${Math.round(Math.min(px(30), rowH * 0.72))}px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = inkC; ctx.fillText(String(v), 0, 0);
  ctx.globalAlpha = 0.35; ctx.fillText(String(v), 0.7, 0.5);   // a second pass: the ink pools slightly
  ctx.globalAlpha = 1;
  if (cross) {   // two quick strokes through the box
    ctx.strokeStyle = alpha(inkC, 0.9); ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-w * 0.42, -rowH * 0.3); ctx.lineTo(w * 0.4, rowH * 0.28); ctx.moveTo(-w * 0.4, rowH * 0.3); ctx.lineTo(w * 0.42, -rowH * 0.26); ctx.stroke();
  }
  ctx.restore();
  void HAND;
}

// shape-craft shared work-area furniture (1.8.0): the one-line step hint pill and the gauge that sits in the middle of the tool dock.
import { rrect, shadowed } from './fx.js';

// The dock strip under the work rect (same maths as scenes.js dockHeight/splitWork, which only the shell calls).
export function dockRect(W0) {
  const t = (W0.h * 0.16) / 0.84, h = t < 46 ? 46 : t > 78 ? 78 : t;
  return { x: W0.x, y: W0.y + W0.h, w: W0.w, h };
}
// One line of text on a dark pill at the top of the work area; shrinks to fit, then truncates with "...", never wraps.
export function hintPill(g, ctx, W0, txt) {
  if (!txt) return;
  const maxW = W0.w - 36, fam = 'system-ui, sans-serif', meas = (px, t) => { ctx.save(); ctx.font = `600 ${px}px ${fam}`; const m = ctx.measureText(t).width; ctx.restore(); return m; };
  let px = Math.round(g.px(20)), shown = txt, w = meas(px, txt);
  for (; px > Math.round(g.px(14)) && w > maxW; px -= 1) w = meas(px, txt);
  if (w > maxW) { while (shown.length > 8 && meas(px, shown + '...') > maxW) shown = shown.slice(0, -1); shown = shown.replace(/[ ,;:]+$/, '') + '...'; w = meas(px, shown); }
  const tw = Math.min(maxW, w) + 22, tx = W0.x + (W0.w - tw) / 2, ty = W0.y + 6, th = px + 12;
  rrect(ctx, tx, ty, tw, th, th / 2); ctx.fillStyle = 'rgba(14,9,6,0.66)'; ctx.fill();
  g.label(ctx, shown, W0.x + W0.w / 2, ty + th / 2 + 1, px, '#fff6e0', 'center', '600');
}
// A pill in the dock centre: a dot (the colour or heat in hand) and a bar (what is left); `warn` shows a short word above it.
export function dockGauge(g, ctx, W0, o) {
  const d = dockRect(W0), gw = Math.min(210, W0.w * 0.34), gx = W0.x + (W0.w - gw) / 2, gy = d.y + d.h * 0.5 - 6;
  shadowed(ctx, () => { rrect(ctx, gx - 22, gy - 8, gw + 44, 26, 13); ctx.fillStyle = 'rgba(12,8,6,0.62)'; ctx.fill(); }, { blur: 6, dy: 2, a: 0.4 });
  ctx.beginPath(); ctx.arc(gx - 6, gy + 5, 9, 0, 6.3); ctx.fillStyle = o.dot; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; ctx.stroke();
  const x0 = gx + 10, w = gw - 10;
  rrect(ctx, x0, gy, w, 10, 5); ctx.fillStyle = o.track ?? 'rgba(255,255,255,0.14)'; ctx.fill();
  if (o.fill) o.fill(x0, gy, w, 10);
  if (o.warn) g.label(ctx, o.warn, gx + gw / 2 + 4, gy - 14, g.px(16), '#ffd36a', 'center', '700');
  return { x: x0, y: gy, w, h: 10 };
}

// An off-screen surface for baking static art: a plain canvas made from the one the shell hands us (no DOM globals), else OffscreenCanvas, else null.
export function makeSurface(ctx, w, h) {
  try {
    const doc = ctx?.canvas?.ownerDocument;
    if (doc?.createElement) { const c = doc.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); if (x) return { canvas: c, ctx: x }; }
    if (typeof OffscreenCanvas !== 'undefined') { const c = new OffscreenCanvas(w, h), x = c.getContext('2d'); if (x) return { canvas: c, ctx: x }; }
  } catch { /* fall through */ }
  return null;
}

// shape-craft 1.22.0: blown glass for the lathe (scene option `glass: {...}` with `vessel: 'fine'`). The form is set row by row as for any vessel; the bands are
// the colours of the glass. Glass is translucent: a clear, slightly greenish body whose edges are darker and more colourful (the wall seen end-on), a
// coloured shadow on the bench, a bright window reflection, a lit rim, thread canes that spiral round the body, fluted or diamond cuts, bubbles
// in the metal, and a glow that fades after every change (the glass is hot). Pure canvas 2D, deterministic (hash, never Math.random).
//   glass: { twist: { n, turns, color, from, to }, flutes: n, diamond: { n, from, to }, bubbles: n, heavy: 0.06, rimGold: true, tint: '#cfe4ec' }
import { hash } from './geom.js';
import { tint, rgba, lum } from './fx.js';

const TAU = Math.PI * 2;
const sub = (c, a) => rgba(c, a);

export function drawGlassVessel(ctx, o, P, fineOutline) {
  const { cx, base, H, unit, bands = 0, colors = [], t = null, wet = 0, glazes } = o, F = o.fine ?? {}, G = F.glass ?? {};
  const { R, top, rowH, n } = P, ev = o.ev ?? 0.2, B = Math.max(1, bands);
  const rmax = Math.max(...o.radii) * unit, rt = R(top), ry = Math.max(3, rt * ev), rb = R(base), hot = Math.max(0, Math.min(1, wet));
  const rot = F.still ? 0.4 : t === null ? 0.45 : t * 0.45;
  const clearC = G.tint ?? '#cfe4ec';
  const has = (k) => colors[k] !== undefined && colors[k] >= 0 && glazes;
  const bandC = (k) => (has(k) ? glazes[colors[k]].color : clearC);
  const midC = (() => { let r = 0, g = 0, b = 0, m = 0; for (let k = 0; k < B; k++) if (has(k)) { const h = bandC(k); r += parseInt(h.slice(1, 3), 16); g += parseInt(h.slice(3, 5), 16); b += parseInt(h.slice(5, 7), 16); m++; } return m ? `#${[r, g, b].map((v) => Math.round(v / m).toString(16).padStart(2, '0')).join('')}` : clearC; })();
  const outline = () => fineOutline(ctx, { cx, base, H, unit, radii: o.radii, ev, dome: 0 });
  const arc = (y, first) => { const N = 24, r = R(y) + 1; for (let j = 0; j <= N; j++) { const f = first ? j / N : 1 - j / N, px = cx - r + f * 2 * r, u2 = (px - cx) / r, py = y + r * ev * Math.sqrt(Math.max(0, 1 - u2 * u2)); if (j === 0 && first) ctx.moveTo(px, py); else ctx.lineTo(px, py); } };

  // the furnace glow behind a hot piece, the shadow and the coloured light the glass throws on the bench
  if (hot > 0.02) { const gg = ctx.createRadialGradient(cx, top + H * 0.5, rmax * 0.2, cx, top + H * 0.5, rmax * 2.6); gg.addColorStop(0, `rgba(255,150,50,${(0.3 * hot).toFixed(3)})`); gg.addColorStop(1, 'rgba(255,100,20,0)'); ctx.fillStyle = gg; ctx.fillRect(cx - rmax * 3, top - H * 0.3, rmax * 6, H * 1.6); }
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(cx - rmax * 0.1, base + 3, rb * 1.1 + 4, Math.max(4, rb * ev * 0.9), 0, 0, TAU); ctx.fill();
  const cg = ctx.createRadialGradient(cx + rmax * 0.55, base + 4, 1, cx + rmax * 0.55, base + 4, rb * 1.3); cg.addColorStop(0, sub(midC, 0.55)); cg.addColorStop(1, sub(midC, 0)); ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(cx + rmax * 0.5, base + 5, rb * 1.3, Math.max(4, rb * ev * 1.0), 0, 0, TAU); ctx.fill();
  ctx.restore();

  // a glass handle, behind the body
  if (F.handle) {
    const hy0 = top + H * 0.2, hy1 = base - H * 0.3, x0 = cx + R(hy0) * 0.96, x1 = cx + R(hy1) * 0.96, out = rmax * 0.58, hc = bandC(B - 1);
    const path = () => { ctx.beginPath(); ctx.moveTo(x0 - 3, hy0); ctx.bezierCurveTo(x0 + out, hy0 - H * 0.04, x1 + out * 1.1, hy1 + H * 0.06, x1 - 3, hy1); };
    ctx.save(); ctx.lineCap = 'round';
    path(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = rmax * 0.22 + 3; ctx.translate(2, 3); ctx.stroke(); ctx.translate(-2, -3);
    path(); ctx.strokeStyle = sub(tint(hc, -0.4), 0.9); ctx.lineWidth = rmax * 0.2 + 2; ctx.stroke();
    path(); ctx.strokeStyle = sub(hc, 0.55); ctx.lineWidth = rmax * 0.15; ctx.stroke();
    path(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = rmax * 0.035; ctx.translate(-rmax * 0.03, -rmax * 0.03); ctx.stroke();
    ctx.restore();
  }

  ctx.save(); outline(); ctx.clip();
  const x0 = cx - rmax - 4, wd = rmax * 2 + 8;
  // the body, band by band: a clear middle and an edge that gathers the colour (the wall seen end-on)
  ctx.fillStyle = 'rgba(190,215,225,0.1)'; ctx.fillRect(x0, top - 14, wd, H + 40);
  for (let k = 0; k < B; k++) {
    const yTop = base - ((k + 1) * n / B) * rowH, yBot = base - ((k * n) / B) * rowH, c = bandC(k), rr = Math.max(R(yTop), R(yBot), R((yTop + yBot) / 2)), solid = has(k);
    const eg = ctx.createLinearGradient(cx - rr, 0, cx + rr, 0);
    eg.addColorStop(0, sub(tint(c, solid ? -0.45 : -0.55), 0.92)); eg.addColorStop(0.1, sub(tint(c, -0.15), solid ? 0.7 : 0.45)); eg.addColorStop(0.3, sub(c, solid ? 0.45 : 0.16)); eg.addColorStop(0.55, sub(c, solid ? 0.38 : 0.1)); eg.addColorStop(0.82, sub(tint(c, -0.1), solid ? 0.55 : 0.3)); eg.addColorStop(0.94, sub(tint(c, -0.4), 0.8)); eg.addColorStop(1, sub(tint(c, -0.6), 0.95));
    ctx.fillStyle = eg; ctx.beginPath(); arc(yTop - (k === B - 1 ? 10 : 1), true); arc(yBot + 1, false); ctx.closePath(); ctx.fill();
    if (k > 0 && solid !== has(k - 1)) { ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.4; ctx.beginPath(); arc(yBot, true); ctx.stroke(); }
  }
  // the thick bottom (a heavy base catches and bends the light) and the back wall of the mouth seen through the glass
  const hv = G.heavy ?? 0.05;
  if (hv > 0) { const hb = base - H * hv, hg = ctx.createLinearGradient(0, hb, 0, base + rb * ev); hg.addColorStop(0, sub(midC, 0.1)); hg.addColorStop(0.5, sub(tint(midC, 0.3), 0.55)); hg.addColorStop(1, sub(tint(midC, -0.3), 0.7)); ctx.fillStyle = hg; ctx.beginPath(); ctx.moveTo(cx - rb, hb); ctx.quadraticCurveTo(cx, hb + rb * ev * 1.2, cx + rb, hb); ctx.lineTo(cx + rb, base + rb * ev); ctx.lineTo(cx - rb, base + rb * ev); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(cx - rb * 0.9, hb + 1); ctx.quadraticCurveTo(cx, hb + rb * ev * 1.35, cx + rb * 0.9, hb + 1); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = Math.max(1, rt * 0.02); ctx.beginPath(); ctx.ellipse(cx, top, rt * 0.94, ry * 0.94, 0, Math.PI * 1.02, Math.PI * 1.98, false); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.ellipse(cx, top + ry * 0.2, rt * 0.9, ry * 0.9, 0, 0.05, Math.PI - 0.05); ctx.stroke();

  // thread canes: spirals of opaque glass wound into the wall (lattimo); only the front half shows
  const sp = (turns, a0, from, to, count, color, lw, alpha) => {
    for (let j = 0; j < count; j++) {
      ctx.strokeStyle = sub(color, alpha); ctx.lineCap = 'round'; let run = false;
      for (let s = 0; s <= 60; s++) {
        const f = from + ((to - from) * s) / 60, y = top + H * f, ang = a0 + (j * TAU) / count + (f - from) * turns * TAU + rot, cv = Math.cos(ang), x = cx + Math.sin(ang) * R(y), py = y + R(y) * ev * cv * 0.9;
        if (cv > 0.05) { if (!run) { ctx.beginPath(); ctx.moveTo(x, py); run = true; } else ctx.lineTo(x, py); ctx.lineWidth = Math.max(0.8, lw * (0.4 + 0.6 * cv)); } else if (run) { ctx.stroke(); run = false; }
      }
      if (run) ctx.stroke();
    }
  };
  if (G.twist) { const T = G.twist; sp(T.turns ?? 2.2, 0, T.from ?? 0, T.to ?? 1, T.n ?? 6, T.color ?? '#f6f2e8', T.w ?? 2.6, 0.9); }
  if (G.diamond) { const D = G.diamond; sp(D.turns ?? 1.6, 0.3, D.from ?? 0.2, D.to ?? 0.9, D.n ?? 10, '#ffffff', 1.5, 0.5); sp(-(D.turns ?? 1.6), 0.9, D.from ?? 0.2, D.to ?? 0.9, D.n ?? 10, '#ffffff', 1.5, 0.5); }
  if (G.flutes) {   // vertical flutes cut in the wall: a bright edge and a dark one beside it
    const N = G.flutes, f0 = G.flutesFrom ?? 0.15, f1 = G.flutesTo ?? 0.95;
    for (let j = 0; j < N; j++) {
      const ang = (j * TAU) / N + rot, cv = Math.cos(ang); if (cv < 0.04) continue;
      for (const [off, c, w] of [[0, 'rgba(255,255,255,0.55)', 1.6], [0.07, 'rgba(0,30,50,0.28)', 3.2]]) {
        ctx.strokeStyle = c; ctx.lineWidth = w * (0.5 + 0.5 * cv); ctx.beginPath();
        for (let s = 0; s <= 24; s++) { const y = top + H * (f0 + ((f1 - f0) * s) / 24), a2 = ang + off, x = cx + Math.sin(a2) * R(y), py = y + R(y) * ev * Math.cos(a2) * 0.9; if (s) ctx.lineTo(x, py); else ctx.moveTo(x, py); }
        ctx.stroke();
      }
    }
  }
  // bubbles in the metal
  for (let q = 0; q < (G.bubbles ?? 0); q++) { const y = top + H * (0.1 + 0.8 * hash(q, 11)), r = R(y), x = cx + (hash(q, 12) - 0.5) * r * 1.5, br = 1.2 + 2.4 * hash(q, 13); ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, br, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(x - br * 0.35, y - br * 0.35, Math.max(0.6, br * 0.25), 0, TAU); ctx.fill(); }
  // gold or enamel trail on the lip band (a rim drawn in gold leaf)
  if (G.rimGold) { const y = top + H * 0.035; ctx.strokeStyle = '#e8c050'; ctx.lineWidth = Math.max(2.5, H * 0.016); ctx.beginPath(); arc(y, true); ctx.stroke(); ctx.strokeStyle = 'rgba(255,248,200,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); arc(y - 1.5, true); ctx.stroke(); }
  // the window on the glass, a long streak and a soft one on the shaded side
  const wx = cx - rmax * 0.62, wy = top + H * 0.2, ww = rmax * 0.36, wh = H * 0.32; ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#f4fbff'; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + ww, wy + wh * 0.04); ctx.lineTo(wx + ww * 0.9, wy + wh); ctx.lineTo(wx - ww * 0.04, wy + wh * 0.96); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(30,60,80,0.55)'; ctx.lineWidth = Math.max(1, ww * 0.07); ctx.beginPath(); ctx.moveTo(wx + ww * 0.5, wy); ctx.lineTo(wx + ww * 0.46, wy + wh); ctx.moveTo(wx, wy + wh * 0.5); ctx.lineTo(wx + ww, wy + wh * 0.52); ctx.stroke(); ctx.restore();
  const st = ctx.createLinearGradient(cx - rmax * 0.82, 0, cx - rmax * 0.7, 0); st.addColorStop(0, 'rgba(255,255,255,0)'); st.addColorStop(0.5, 'rgba(255,255,255,0.7)'); st.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = st; ctx.fillRect(cx - rmax * 0.84, top + H * 0.12, rmax * 0.16, H * 0.74);
  const s2 = ctx.createLinearGradient(cx + rmax * 0.58, 0, cx + rmax * 0.7, 0); s2.addColorStop(0, 'rgba(255,255,255,0)'); s2.addColorStop(0.5, 'rgba(255,255,255,0.3)'); s2.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = s2; ctx.fillRect(cx + rmax * 0.56, top + H * 0.2, rmax * 0.16, H * 0.6);
  // the heat: an orange glow that fades as the glass cools, strongest in the middle of the wall
  if (hot > 0.02) { const hg = ctx.createLinearGradient(cx - rmax, 0, cx + rmax, 0); hg.addColorStop(0, `rgba(255,90,20,${(0.5 * hot).toFixed(3)})`); hg.addColorStop(0.5, `rgba(255,190,80,${(0.55 * hot).toFixed(3)})`); hg.addColorStop(1, `rgba(255,70,10,${(0.5 * hot).toFixed(3)})`); ctx.fillStyle = hg; ctx.fillRect(x0, top - 14, wd, H + 40); }
  ctx.restore();
  outline(); ctx.strokeStyle = 'rgba(210,235,245,0.55)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.strokeStyle = 'rgba(10,30,40,0.45)'; ctx.lineWidth = 0.8; ctx.stroke();

  // the mouth: a thick lip that catches the light, the far inner wall just seen through it
  const topC = bandC(B - 1), lipW = Math.max(2.4, rt * 0.07);
  ctx.save();
  ctx.beginPath(); ctx.ellipse(cx, top, rt, ry, 0, 0, TAU); ctx.fillStyle = sub(tint(topC, 0.4), has(B - 1) ? 0.5 : 0.28); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx, top + lipW * 0.1, rt - lipW, Math.max(2, ry - lipW * ev * 1.4), 0, 0, TAU); const ig = ctx.createLinearGradient(0, top - ry, 0, top + ry); ig.addColorStop(0, sub(tint(topC, -0.1), 0.2)); ig.addColorStop(1, sub(tint(topC, -0.55), 0.5)); ctx.fillStyle = ig; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = Math.max(1.4, lipW * 0.5); ctx.beginPath(); ctx.ellipse(cx, top, rt - lipW * 0.3, ry - lipW * 0.3 * ev, 0, Math.PI * 0.62, Math.PI * 1.08); ctx.stroke();
  ctx.strokeStyle = 'rgba(20,50,60,0.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(cx, top, rt, ry, 0, 0, TAU); ctx.stroke();
  if (G.rimGold) { ctx.strokeStyle = '#e8c050'; ctx.lineWidth = Math.max(2, lipW * 0.8); ctx.beginPath(); ctx.ellipse(cx, top, rt - lipW * 0.2, ry - lipW * 0.2 * ev, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = 'rgba(255,248,200,0.85)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(cx, top - 0.6, rt - lipW * 0.2, ry - lipW * 0.2 * ev, 0, Math.PI * 0.7, Math.PI * 1.1); ctx.stroke(); }
  ctx.restore();
  void lum;
}

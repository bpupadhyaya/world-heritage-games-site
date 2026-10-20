// Shared extras for the 1.8.0 scene files (scenes-f.js, scenes-g.js): maker's tools, supply vessels and cell skins that the older
// kit does not have (felt, bobbin lace, drawn-thread work, kilim slits, white-on-white, kantha contours, translucent patchwork, tied
// resist dots, loaded-brush petals, raised ridges, plaited straw, silk satin). They are added to the shared TOOLS / POT / SKIN tables
// at import time (the same way `TOOLS.scissors` is), under names no older scene uses. Pure canvas: no DOM, no Math.random.
import { rod, ball, poly, shade, mix, rgba, hash, roundRectPath, motifPath, isFilled, lineWidthOf, sheenLine, speck, TAU, SKIN, POT } from './scene-kit.js';
import { TOOLS } from './scene-tools.js';

const press = (T) => Math.max(0, 1 - T.a / 0.45);
const soft = (ctx, x, y, rx, ry, a = 0.3) => { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); };
const bx = (b) => ({ cx: b.x + b.w / 2, cy: b.y + b.h / 2, r: Math.min(b.w, b.h) / 2 });
function ring(ctx, S, b, on) {
  ctx.save(); ctx.strokeStyle = on ? S.pal.accent : 'rgba(255,255,255,0.28)'; ctx.lineWidth = on ? 4 : 1.5; roundRectPath(ctx, b.x, b.y, b.w, b.h, 12); ctx.stroke();
  if (on) { ctx.fillStyle = S.pal.accent; ctx.beginPath(); ctx.arc(b.x + b.w - 7, b.y + 7, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x + b.w - 9.5, b.y + 7); ctx.lineTo(b.x + b.w - 7.2, b.y + 9.2); ctx.lineTo(b.x + b.w - 4.6, b.y + 4.8); ctx.stroke(); }
  ctx.restore();
}
function back(ctx, b, c, a = 0.5) { ctx.save(); roundRectPath(ctx, b.x, b.y, b.w, b.h, 12); ctx.fillStyle = rgba(c, a); ctx.fill(); ctx.restore(); }

// ---- tools -----------------------------------------------------------------------------------------------------------------------
Object.assign(TOOLS, {
  // lace bobbin pair: two turned bobbins with spangle rings, threads running to the pin
  bobbinpair(ctx, S, T) {
    const u = T.u, p = press(T), sw = Math.sin(T.t * 3) * 0.03;
    soft(ctx, T.x + u * 0.8, T.y + u * 0.1, u * 1.2, u * 0.1);
    for (const [a, c] of [[0.55 + sw + p * 0.12, '#c99a5a'], [0.95 - sw - p * 0.1, '#a97a3e']]) {
      const x2 = T.x + Math.sin(a) * u * 2.7, y2 = T.y - Math.cos(a) * u * 2.7 + u * 0.35;
      sheenLine(ctx, [[T.x, T.y], [(T.x + x2) / 2, (T.y + y2) / 2 + u * 0.12], [x2, y2]], Math.max(1.1, u * 0.04), '#f4efe2');
      ctx.save(); ctx.translate(x2, y2); ctx.rotate(a - 0.15);
      rod(ctx, 0, 0, u * 1.9, 0, u * 0.22, c); ball(ctx, u * 2.0, 0, u * 0.2, shade(c, 0.1), false); rod(ctx, u * 0.32, 0, u * 0.34, 0, u * 0.3, shade(c, -0.3));
      for (let k = 0; k < 6; k++) ball(ctx, u * (1.35 + (k % 2) * 0.14), (k < 3 ? -1 : 1) * u * (0.24 + (k % 3) * 0.07), u * 0.075, ['#e8d8a0', T.col][k % 2], false);
      ctx.restore();
    }
    ball(ctx, T.x, T.y - p * u * 0.04, u * 0.1, '#f4f4f4', false);
  },
  // kani: a short wooden spool (the shawl weaver's bobbin) with its coloured yarn
  kanispool(ctx, S, T) {
    const u = T.u, p = press(T), a = 0.25;
    soft(ctx, T.x + u * 0.2, T.y + u * 0.1, u * 0.45, u * 0.09);
    ctx.save(); ctx.translate(T.x, T.y - u * 0.1 - p * u * 0.12); ctx.rotate(a);
    rod(ctx, 0, 0, 0, -u * 2.2, u * 0.17, '#a87444');
    for (let k = 0; k < 7; k++) { ctx.fillStyle = k % 2 ? T.col : shade(T.col, -0.18); roundRectPath(ctx, -u * 0.26, -u * (0.4 + k * 0.1), u * 0.52, u * 0.11, 2); ctx.fill(); }
    ball(ctx, 0, -u * 2.3, u * 0.16, '#7a4f26', false); ctx.restore();
    sheenLine(ctx, [[T.x, T.y], [T.x + u * 0.3, T.y - u * 0.2], [T.x + u * 0.35, T.y - u * 0.5]], Math.max(1.2, u * 0.05), T.col);
  },
  // Turkmen knotting hook-knife: a bent hook with a short blade, wooden grip
  knotknife(ctx, S, T) {
    const u = T.u, p = press(T), a = 0.6;
    soft(ctx, T.x + u * 0.3, T.y + u * 0.1, u * 0.55, u * 0.08);
    ctx.save(); ctx.translate(T.x, T.y - p * u * 0.06); ctx.rotate(a);
    ctx.fillStyle = '#d9dee3'; poly(ctx, [[0, 0], [u * 0.05, -u * 0.9], [-u * 0.2, -u * 0.95], [-u * 0.12, -u * 0.35]]); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.stroke();
    rod(ctx, u * 0.0, -u * 0.9, u * 0.0, -u * 3.1, u * 0.34, '#6a3d1c'); rod(ctx, 0, -u * 1.6, 0, -u * 1.7, u * 0.4, '#c9a050', 'butt');
    ctx.restore();
    sheenLine(ctx, [[T.x, T.y], [T.x - u * 0.5, T.y + u * 0.25], [T.x - u * 1.2, T.y + u * 0.15]], Math.max(1.4, u * 0.06), T.col);
  },
  // Sadu / ground-loom batten: a flat wooden sword beating the weft, wool tassel on the grip
  battensword(ctx, S, T) {
    const u = T.u, p = press(T), lift = (1 - p) * u * 0.35;
    soft(ctx, T.x + u * 0.9, T.y + u * 0.1, u * 1.5, u * 0.1);
    ctx.save(); ctx.translate(T.x, T.y - lift); ctx.rotate(-0.12);
    const g = ctx.createLinearGradient(0, -u * 0.2, 0, u * 0.2); g.addColorStop(0, '#e1c48a'); g.addColorStop(1, '#8a6a38'); ctx.fillStyle = g;
    poly(ctx, [[0, 0], [u * 0.5, -u * 0.22], [u * 2.9, -u * 0.22], [u * 2.9, u * 0.22], [u * 0.5, u * 0.22]]); ctx.fill();
    ctx.strokeStyle = 'rgba(60,30,10,0.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(u * 0.7, 0); ctx.lineTo(u * 2.7, 0); ctx.stroke();
    ctx.fillStyle = '#b03a2a'; ctx.fillRect(u * 2.9, -u * 0.14, u * 0.2, u * 0.28); for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? '#b03a2a' : '#e8e0d0'; ctx.fillRect(u * 3.1, -u * 0.2 + k * u * 0.08, u * 0.5, u * 0.07); }
    ctx.restore();
  },
  // Berber weaving fork: a long-tined wooden comb that packs the weft rows
  weavefork(ctx, S, T) {
    const u = T.u, p = press(T), lift = (1 - p) * u * 0.4 + u * 0.05;
    soft(ctx, T.x, T.y + u * 0.12, u * 0.9, u * 0.1);
    ctx.save(); ctx.translate(T.x, T.y - lift);
    for (let k = 0; k < 5; k++) rod(ctx, (k - 2) * u * 0.28, 0, (k - 2) * u * 0.28, -u * 1.1, u * 0.1, '#b78a50', 'butt');
    rod(ctx, -u * 0.62, -u * 1.15, u * 0.62, -u * 1.15, u * 0.3, '#8a5a2e'); rod(ctx, 0, -u * 1.2, 0.3 * u, -u * 3.3, u * 0.3, '#7a4a26');
    ctx.restore();
  },
  // toquilla: a pale straw strand held in a bone pick, the weaver's working end
  strawpick(ctx, S, T) {
    const u = T.u, p = press(T), a = 0.7;
    soft(ctx, T.x + u * 0.3, T.y + u * 0.08, u * 0.5, u * 0.08);
    for (let k = -1; k <= 1; k++) sheenLine(ctx, [[T.x, T.y], [T.x + u * (0.6 + k * 0.2), T.y + u * 0.15 + k * u * 0.2], [T.x + u * (1.5 + k * 0.3), T.y + u * (0.1 + k * 0.55)]], Math.max(1.4, u * 0.07), '#ecd9a2');
    ctx.save(); ctx.translate(T.x, T.y - p * u * 0.05); ctx.rotate(a);
    ctx.fillStyle = '#f2ecdc'; poly(ctx, [[0, 0], [-u * 0.1, -u * 0.5], [u * 0.1, -u * 0.5]]); ctx.fill(); rod(ctx, 0, -u * 0.45, 0, -u * 2.9, u * 0.2, '#e4d8bc'); ctx.restore();
  },
  // a big blanket pin that fastens the wool: closed spring coil and a bar
  blanketpin(ctx, S, T) {
    const u = T.u, p = press(T), a = 0.9;
    soft(ctx, T.x + u * 0.3, T.y + u * 0.08, u * 0.6, u * 0.08);
    ctx.save(); ctx.translate(T.x, T.y - p * u * 0.05); ctx.rotate(a);
    rod(ctx, 0, 0, 0, -u * 2.4, u * 0.08, '#cfd6dc'); rod(ctx, u * 0.34, -u * 0.2, u * 0.34, -u * 2.4, u * 0.07, '#aeb6be');
    ctx.strokeStyle = '#cfd6dc'; ctx.lineWidth = u * 0.07; ctx.beginPath(); ctx.arc(u * 0.17, -u * 2.5, u * 0.2, 0, TAU); ctx.stroke();
    ball(ctx, 0, 0, u * 0.1, '#eee', false); ctx.restore();
  },
  // bandhani: the dyer's pinch: a thumb nail lifts a point of cloth, a waxed thread binds it
  pinchbind(ctx, S, T) {
    const u = T.u, p = press(T);
    soft(ctx, T.x + u * 0.2, T.y + u * 0.1, u * 0.5, u * 0.09);
    ctx.save(); ctx.translate(T.x, T.y - p * u * 0.12); ctx.fillStyle = shade(T.col, -0.3); poly(ctx, [[0, -u * 0.5], [-u * 0.24, 0], [u * 0.24, 0]]); ctx.fill();
    ctx.strokeStyle = '#efe6cc'; ctx.lineWidth = u * 0.07; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(0, -u * (0.16 + k * 0.1), u * (0.22 - k * 0.04), u * 0.05, 0, 0, TAU); ctx.stroke(); }
    ctx.restore();
    rod(ctx, T.x + u * 0.5, T.y - u * 0.35, T.x + u * 2.3, T.y - u * 2.0, u * 0.1, '#e6d8b0'); ball(ctx, T.x + u * 0.5, T.y - u * 0.35, u * 0.12, '#cfd6dc', false);
  },
  // kalamkari: a bamboo pen with a bound wad of cloth that holds the mordant
  kalam(ctx, S, T) {
    const u = T.u, p = press(T), a = 0.55;
    soft(ctx, T.x + u * 0.35, T.y + u * 0.08, u * 0.55, u * 0.09);
    ctx.save(); ctx.translate(T.x, T.y - p * u * 0.04); ctx.rotate(a);
    rod(ctx, 0, -u * 0.4, 0, -u * 4.0, u * 0.18, '#b99a52');
    ctx.fillStyle = '#e8dcc4'; ctx.beginPath(); ctx.moveTo(-u * 0.22, -u * 1.0); ctx.lineTo(u * 0.22, -u * 1.0); ctx.lineTo(u * 0.12, -u * 0.25); ctx.lineTo(-u * 0.12, -u * 0.25); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a2418'; poly(ctx, [[-u * 0.12, -u * 0.25], [u * 0.12, -u * 0.25], [0, 0]]); ctx.fill();
    ctx.strokeStyle = '#8a4a2a'; ctx.lineWidth = 1.6; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-u * 0.2, -u * (0.5 + k * 0.14)); ctx.lineTo(u * 0.2, -u * (0.42 + k * 0.14)); ctx.stroke(); }
    ctx.restore();
  },
  // fine lace-knitting needles: two slim steel needles crossing, a strand of white mohair from the ball
  laceknit(ctx, S, T) {
    const u = T.u, p = press(T), sw = Math.sin(T.t * 4) * 0.035 * (T.a < 0.6 ? 1 : 0.3);
    soft(ctx, T.x + u * 0.3, T.y + u * 0.1, u * 0.7, u * 0.09);
    for (const [a, c] of [[0.62 + sw + p * 0.07, '#e4e9ee'], [0.02 - sw, '#c4ccd4']]) {
      const x2 = T.x + Math.sin(a) * u * 4.2, y2 = T.y - Math.cos(a) * u * 4.2; rod(ctx, T.x, T.y, x2, y2, u * 0.07, c); ball(ctx, x2, y2, u * 0.1, '#f4efe0', false);
    }
    ball(ctx, T.x + u * 1.1, T.y + u * 1.0, u * 0.5, T.col, true);
    sheenLine(ctx, [[T.x + u * 0.7, T.y + u * 0.7], [T.x + u * 0.3, T.y + u * 0.2], [T.x, T.y]], Math.max(1.1, u * 0.045), T.col);
  },
  // pointed bodkin that opens eyelet holes in drawn-thread work and cutwork
  bodkin(ctx, S, T) {
    const u = T.u, p = press(T), a = 0.7;
    soft(ctx, T.x + u * 0.3, T.y + u * 0.08, u * 0.5, u * 0.08);
    ctx.save(); ctx.translate(T.x, T.y - p * u * 0.05); ctx.rotate(a);
    ctx.fillStyle = '#d6dce2'; poly(ctx, [[0, 0], [-u * 0.09, -u * 0.9], [u * 0.09, -u * 0.9]]); ctx.fill(); rod(ctx, 0, -u * 0.85, 0, -u * 3.0, u * 0.22, '#e8dcc0'); rod(ctx, 0, -u * 1.0, 0, -u * 1.15, u * 0.3, '#c9a050', 'butt'); ctx.restore();
    sheenLine(ctx, [[T.x, T.y], [T.x - u * 0.6, T.y + u * 0.4], [T.x - u * 1.4, T.y + u * 0.2]], Math.max(1.2, u * 0.05), T.col);
  },
  // imigongo: a wooden spatula that lays a ridge of paste
  ridgeknife(ctx, S, T) {
    const u = T.u, p = press(T), a = 0.65;
    soft(ctx, T.x + u * 0.3, T.y + u * 0.1, u * 0.6, u * 0.09);
    ctx.save(); ctx.translate(T.x, T.y - p * u * 0.06); ctx.rotate(a);
    const g = ctx.createLinearGradient(-u * 0.3, 0, u * 0.3, 0); g.addColorStop(0, '#d9b078'); g.addColorStop(1, '#8a5a30'); ctx.fillStyle = g;
    poly(ctx, [[0, 0], [-u * 0.38, -u * 0.5], [-u * 0.3, -u * 1.5], [u * 0.3, -u * 1.5], [u * 0.38, -u * 0.5]]); ctx.fill();
    ctx.fillStyle = '#2a1c12'; poly(ctx, [[0, 0], [-u * 0.38, -u * 0.5], [u * 0.38, -u * 0.5]]); ctx.fill();
    rod(ctx, 0, -u * 1.5, 0, -u * 3.0, u * 0.24, '#7a4a26'); ctx.restore();
  },
});

// ---- supplies ---------------------------------------------------------------------------------------------------------------------
Object.assign(POT, {
  felt(ctx, S, b, col, on) { // a stack of wool felt sheets with soft edges
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#1a140e');
    for (let i = 3; i >= 0; i--) {
      const w = r * 1.25, h = r * 0.34, y = cy + r * 0.38 - i * r * 0.2 + lift, c = i ? shade(col, (i % 2 ? -0.18 : 0.12)) : col;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; roundRectPath(ctx, cx - w / 2 + 2, y - h / 2 + 3, w, h, h * 0.45); ctx.fill();
      ctx.fillStyle = shade(c, -0.25); roundRectPath(ctx, cx - w / 2, y - h / 2 + h * 0.2, w, h, h * 0.45); ctx.fill();
      const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2); g.addColorStop(0, shade(c, 0.28)); g.addColorStop(1, c); ctx.fillStyle = g; roundRectPath(ctx, cx - w / 2, y - h / 2, w, h, h * 0.45); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 7; k++) { const x = cx - w * 0.4 + hash(i, k) * w * 0.8; ctx.moveTo(x, y - h * 0.3); ctx.lineTo(x + 3, y - h * 0.3 + 2); } ctx.stroke();
    }
    ring(ctx, S, b, on);
  },
  bobbinpot(ctx, S, b, col, on) { // a bobbin with its thread wound on
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#1b1410');
    ctx.save(); ctx.translate(cx, cy + lift); ctx.rotate(-0.5);
    soft(ctx, r * 0.1, r * 0.55, r * 0.9, r * 0.14, 0.35);
    rod(ctx, -r * 0.8, 0, r * 0.8, 0, r * 0.3, '#b98a50'); ball(ctx, r * 0.86, 0, r * 0.2, '#c9a060', false);
    for (let k = 0; k < 7; k++) { ctx.fillStyle = k % 2 ? col : shade(col, -0.2); ctx.fillRect(-r * 0.45 + k * r * 0.065, -r * 0.26, r * 0.07, r * 0.52); }
    for (let k = 0; k < 4; k++) ball(ctx, -r * 0.55 + k * 0.03, (k % 2 ? 1 : -1) * r * 0.32, r * 0.08, k % 2 ? '#e8d8a0' : '#c0392b', false);
    ctx.restore(); ring(ctx, S, b, on);
  },
  hank(ctx, S, b, col, on) { // a hank of yarn hung over a peg
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#161310');
    ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = r * 0.12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - r * 0.5, cy - r * 0.68 + lift); ctx.lineTo(cx + r * 0.5, cy - r * 0.68 + lift); ctx.stroke();
    for (let i = 0; i < 9; i++) { const o = (i - 4) * r * 0.075; ctx.strokeStyle = i % 2 ? shade(col, -0.2) : shade(col, 0.12); ctx.lineWidth = r * 0.12; ctx.beginPath(); ctx.moveTo(cx + o * 0.6 - r * 0.1, cy - r * 0.64 + lift); ctx.bezierCurveTo(cx + o * 2.2 - r * 0.5, cy + r * 0.1 + lift, cx + o * 2.2 + r * 0.5, cy + r * 0.1 + lift, cx + o * 0.6 + r * 0.1, cy - r * 0.64 + lift); ctx.lineTo(cx + o * 0.6, cy + r * 0.74 + lift); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(cx - r * 0.4, cy - r * 0.2 + lift, r * 0.12, r * 0.7);
    ring(ctx, S, b, on);
  },
  blanketstack(ctx, S, b, col, on) { // a folded wool blanket with a bold border stripe
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#14110e');
    for (let i = 2; i >= 0; i--) {
      const w = r * 1.4, h = r * 0.46, y = cy + r * 0.3 - i * r * 0.28 + lift, c = i === 0 ? col : shade(col, i * -0.14);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; roundRectPath(ctx, cx - w / 2 + 2, y - h / 2 + 3, w, h, 4); ctx.fill();
      ctx.fillStyle = c; roundRectPath(ctx, cx - w / 2, y - h / 2, w, h, 4); ctx.fill();
      ctx.fillStyle = '#efe6d2'; ctx.fillRect(cx - w / 2 + 3, y - h * 0.3, w - 6, h * 0.1); ctx.fillStyle = shade(c, -0.4); ctx.fillRect(cx - w / 2 + 3, y + h * 0.05, w - 6, h * 0.14);
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(cx - w / 2 + 4, y - h / 2 + 2, w * 0.4, 2);
    }
    ring(ctx, S, b, on);
  },
  scraps(ctx, S, b, col, on) { // folded translucent silk scraps
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#161820');
    for (let i = 0; i < 3; i++) {
      ctx.save(); ctx.translate(cx + (i - 1) * r * 0.26, cy + (1 - i) * r * 0.06 + lift); ctx.rotate((i - 1) * 0.28);
      const w = r * 1.05; ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-w / 2 + 2, -w * 0.3 + 3, w, w * 0.6);
      ctx.fillStyle = rgba(i === 1 ? col : shade(col, i === 0 ? -0.2 : 0.2), 0.88); ctx.fillRect(-w / 2, -w * 0.3, w, w * 0.6);
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.4; ctx.strokeRect(-w / 2 + 3, -w * 0.3 + 3, w - 6, w * 0.6 - 6);
      ctx.restore();
    }
    ring(ctx, S, b, on);
  },
  inkwell(ctx, S, b, col, on) { // a clay cup of dye and a bamboo pen resting across it
    POT.pot(ctx, S, b, col, on);
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0;
    ctx.save(); ctx.translate(cx, cy + lift); rod(ctx, -r * 0.7, r * 0.55, r * 0.7, -r * 0.55, r * 0.1, '#b99a52'); ctx.restore();
  },
  enamel(ctx, S, b, col, on) { // a small tin of gloss enamel with the lid prised open
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#14141a');
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(cx + 2, cy + r * 0.55 + lift, r * 0.75, r * 0.25, 0, 0, TAU); ctx.fill();
    const g = ctx.createLinearGradient(cx - r * 0.7, 0, cx + r * 0.7, 0); g.addColorStop(0, '#dfe3e8'); g.addColorStop(0.5, '#8a929c'); g.addColorStop(1, '#4a525c');
    ctx.fillStyle = g; ctx.beginPath(); ctx.rect(cx - r * 0.7, cy - r * 0.15 + lift, r * 1.4, r * 0.7); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.55 + lift, r * 0.7, r * 0.2, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#dfe3e8'; ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.15 + lift, r * 0.7, r * 0.22, 0, 0, TAU); ctx.fill();
    const lg = ctx.createLinearGradient(cx - r * 0.5, 0, cx + r * 0.5, 0); lg.addColorStop(0, shade(col, 0.4)); lg.addColorStop(1, shade(col, -0.2)); ctx.fillStyle = lg; ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.15 + lift, r * 0.58, r * 0.16, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = rgba(col, 0.9); ctx.fillRect(cx - r * 0.7, cy + r * 0.1 + lift, r * 1.4, r * 0.18);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(cx - r * 0.55, cy - r * 0.1 + lift, r * 0.1, r * 0.55);
    ring(ctx, S, b, on);
  },
  paste(ctx, S, b, col, on) { // a bowl of thick paste with a dollop on a spatula
    const { cx, cy, r } = bx(b), lift = on ? -3 : 0; back(ctx, b, '#14100c');
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(cx + 2, cy + r * 0.5 + lift, r * 0.85, r * 0.28, 0, 0, TAU); ctx.fill();
    const g = ctx.createLinearGradient(cx - r, 0, cx + r, 0); g.addColorStop(0, '#9a6a40'); g.addColorStop(0.5, '#d19a60'); g.addColorStop(1, '#5a3a1e');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.1 + lift, r * 0.82, r * 0.7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = shade(col, -0.15); ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.02 + lift, r * 0.66, r * 0.5, 0, 0, TAU); ctx.fill();
    const m = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.25 + lift, 1, cx, cy + lift, r * 0.6); m.addColorStop(0, shade(col, 0.45)); m.addColorStop(1, col); ctx.fillStyle = m; ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.08 + lift, r * 0.5, r * 0.34, 0, 0, TAU); ctx.fill();
    ring(ctx, S, b, on);
  },
});

// ---- skins -----------------------------------------------------------------------------------------------------------------------
const lineSkin = (ctx, d, w, col, hi) => { // a plain lit cord along the stamp outline
  const { kind, x, y, s } = d; motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = w + 2; ctx.save(); ctx.translate(0.8, 1.3); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = shade(col, -0.35); ctx.lineWidth = w; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w * 0.72; ctx.stroke();
  if (hi) { ctx.strokeStyle = rgba(shade(col, 0.55), 0.7); ctx.lineWidth = w * 0.2; ctx.save(); ctx.translate(-w * 0.12, -w * 0.15); ctx.stroke(); ctx.restore(); }
};
Object.assign(SKIN, {
  // felt: thick wool felt cut to shape, a fuzzy rim and a twisted cord sewn along the edge
  felt(ctx, d, o = {}) {
    const { kind, col, x, y, s, key } = d, fill = isFilled(kind), lw = lineWidthOf(kind, s);
    if (!fill) { lineSkin(ctx, d, lw, col, false); ctx.save(); motifPath(ctx, kind, x, y, s); ctx.setLineDash([s * 0.05, s * 0.035]); ctx.strokeStyle = rgba('#fff', 0.35); ctx.lineWidth = Math.max(1, lw * 0.14); ctx.stroke(); ctx.restore(); return; }
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = s * 0.1; ctx.save(); ctx.translate(s * 0.025, s * 0.04); ctx.stroke(); ctx.restore();
    ctx.fillStyle = col; ctx.fill(); ctx.clip();
    const g = ctx.createLinearGradient(x - s / 2, y - s / 2, x + s / 2, y + s / 2); g.addColorStop(0, 'rgba(255,255,255,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0.25)'); ctx.fillStyle = g; ctx.fillRect(x - s / 2, y - s / 2, s, s);
    ctx.lineCap = 'round'; for (const [c2, a] of [[shade(col, 0.35), 0.35], [shade(col, -0.35), 0.3]]) { ctx.strokeStyle = rgba(c2, a); ctx.lineWidth = Math.max(0.8, s * 0.018); ctx.beginPath(); for (let i = 0; i < 26; i++) { const px = x + (hash(key, i, c2.length) - 0.5) * s, py = y + (hash(key, i + 40, c2.length) - 0.5) * s, an = hash(key, i + 9) * TAU; ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(an) * s * 0.07, py + Math.sin(an) * s * 0.07); } ctx.stroke(); }
    ctx.restore();
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(shade(col, -0.5), 0.8); ctx.lineWidth = s * 0.04; ctx.stroke();
    ctx.strokeStyle = rgba(o.cord ?? '#f0e4c0', 0.9); ctx.lineWidth = Math.max(1.4, s * 0.035); ctx.setLineDash([s * 0.05, s * 0.032]); ctx.save(); ctx.translate(-s * 0.005, -s * 0.005); ctx.stroke(); ctx.restore();
    ctx.restore();
  },
  // bobbin lace: pairs of threads worked in cloth-stitch (a diagonal weave), pinholes along the edge
  lace(ctx, d, o = {}) {
    const { kind, col, x, y, s, key } = d, fill = isFilled(kind), lw = lineWidthOf(kind, s), h = s / 2, p = s / (o.n ?? 7);
    const holes = () => { ctx.save(); motifPath(ctx, kind, x, y, s); ctx.setLineDash([0.01, p * 1.5]); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(10,6,14,0.75)'; ctx.lineWidth = Math.max(1.6, p * 0.5); ctx.stroke(); ctx.restore(); };
    if (!fill) { // a plait: a braid of twisted pairs
      ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = lw + 2; ctx.save(); ctx.translate(0.8, 1.3); ctx.stroke(); ctx.restore();
      ctx.strokeStyle = shade(col, -0.45); ctx.lineWidth = lw; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw * 0.7; ctx.setLineDash([lw * 0.55, lw * 0.35]); ctx.stroke(); ctx.strokeStyle = rgba(shade(col, 0.6), 0.6); ctx.lineWidth = lw * 0.2; ctx.setLineDash([lw * 0.3, lw * 0.6]); ctx.stroke(); ctx.restore(); return;
    }
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = s * 0.08; ctx.save(); ctx.translate(s * 0.015, s * 0.03); ctx.stroke(); ctx.restore(); ctx.fillStyle = shade(col, -0.55); ctx.fill(); ctx.clip();
    for (let j = -1; j <= 2 * (o.n ?? 7) + 1; j++) for (let i = -1; i <= (o.n ?? 7) + 1; i++) {
      const cx = x - h + (i + (j % 2) * 0.5) * p, cy = y - h + j * p * 0.5, up = (i + j) % 2 === 0, tint = (hash(key, i, j) - 0.5) * 0.12;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(up ? 0.7 : -0.7);
      ctx.fillStyle = shade(col, -0.4 + tint); roundRectPath(ctx, -p * 0.58, -p * 0.2, p * 1.16, p * 0.4, p * 0.2); ctx.fill();
      ctx.fillStyle = shade(col, tint); roundRectPath(ctx, -p * 0.52, -p * 0.2 - 0.3, p * 1.04, p * 0.32, p * 0.16); ctx.fill();
      ctx.fillStyle = rgba(shade(col, 0.6), 0.55); ctx.fillRect(-p * 0.38, -p * 0.17, p * 0.7, p * 0.07); ctx.restore();
    }
    ctx.restore(); holes();
  },
  // flat-weave kilim: horizontal weft rows packed tight, with slit gaps where the colour changes
  slit(ctx, d, o = {}) {
    const { kind, col, x, y, s, key } = d, fill = isFilled(kind), lw = lineWidthOf(kind, s), h = s / 2, n = o.n ?? 8, p = s / n;
    if (!fill) { ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.38)'; ctx.lineWidth = lw + 2; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash([p * 0.8, p * 0.12]); ctx.stroke(); ctx.strokeStyle = rgba(shade(col, 0.5), 0.5); ctx.lineWidth = lw * 0.25; ctx.stroke(); ctx.restore(); return; }
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.fillStyle = shade(col, -0.45); ctx.fill(); ctx.clip();
    for (let j = 0; j <= n; j++) { const yy = y - h + j * p, sh = (hash(key, j) - 0.5) * 0.12; ctx.fillStyle = shade(col, sh); ctx.fillRect(x - h - 2, yy, s + 4, p * 0.86); ctx.fillStyle = rgba(shade(col, 0.5), 0.3); ctx.fillRect(x - h - 2, yy, s + 4, p * 0.2); ctx.fillStyle = rgba(shade(col, -0.5), 0.35); ctx.fillRect(x - h - 2, yy + p * 0.82, s + 4, p * 0.14);
      ctx.fillStyle = rgba(shade(col, -0.5), 0.25); for (let k = 0; k < 6; k++) ctx.fillRect(x - h + hash(key, j, k) * s, yy + p * 0.3, p * 0.5, p * 0.12); }
    ctx.restore();
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.strokeStyle = 'rgba(8,4,2,0.7)'; ctx.lineWidth = Math.max(1, s * 0.025); ctx.setLineDash([p * 0.9, p * 0.9]); ctx.stroke(); ctx.restore();
  },
  // white-on-white shadow work: a pale stitch seen through muslin, backstitched edge
  whitework(ctx, d, o = {}) {
    const { kind, col, x, y, s, key } = d, fill = isFilled(kind), lw = lineWidthOf(kind, s), h = s / 2;
    if (!fill) { ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(o.shadow ?? '#9a8f7c', 0.35); ctx.lineWidth = lw * 1.3; ctx.save(); ctx.translate(0.8, 1.4); ctx.stroke(); ctx.restore(); ctx.strokeStyle = col; ctx.lineWidth = lw * 0.7; ctx.setLineDash([lw * 0.9, lw * 0.35]); ctx.stroke(); ctx.strokeStyle = rgba('#fff', 0.7); ctx.lineWidth = lw * 0.18; ctx.stroke(); ctx.restore(); return; }
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.fillStyle = rgba(o.shadow ?? '#9a8f7c', 0.3); ctx.fill(); ctx.clip();
    ctx.strokeStyle = rgba(col, 0.9); ctx.lineWidth = Math.max(1, s * 0.03); ctx.beginPath(); const p = s * 0.1;
    for (let k = -n(s, p); k <= n(s, p); k++) { ctx.moveTo(x - h + k * p, y - h); ctx.lineTo(x + h + k * p, y + h); ctx.moveTo(x - h + k * p, y + h); ctx.lineTo(x + h + k * p, y - h); }
    ctx.stroke(); ctx.strokeStyle = rgba(o.shadow ?? '#9a8f7c', 0.35); ctx.lineWidth = Math.max(1, s * 0.012); ctx.stroke(); ctx.restore();
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.setLineDash([s * 0.07, s * 0.035]); ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.4, s * 0.045); ctx.stroke(); ctx.strokeStyle = rgba('#fff', 0.8); ctx.lineWidth = Math.max(0.8, s * 0.014); ctx.stroke(); ctx.restore(); void key;
  },
  // drawn-thread openwork: threads are pulled, the cloth shows through, bars are wrapped and a hemstitch frames it
  lacefill(ctx, d, o = {}) {
    const { kind, col, x, y, s } = d, fill = isFilled(kind), lw = lineWidthOf(kind, s), h = s / 2, n = o.n ?? 4, p = s / n;
    if (!fill) { ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = lw + 1.5; ctx.save(); ctx.translate(0.7, 1.2); ctx.stroke(); ctx.restore(); ctx.strokeStyle = col; ctx.lineWidth = lw * 0.55; ctx.stroke(); ctx.strokeStyle = o.under ?? 'rgba(40,60,90,0.6)'; ctx.lineWidth = lw * 0.55; ctx.setLineDash([lw * 0.18, lw * 0.5]); ctx.stroke(); ctx.restore(); return; }
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.fillStyle = o.under ?? 'rgba(30,48,76,0.85)'; ctx.fill(); ctx.clip();
    ctx.lineCap = 'round'; ctx.beginPath();
    for (let k = 0; k <= n; k++) { ctx.moveTo(x - h, y - h + k * p); ctx.lineTo(x + h, y - h + k * p); ctx.moveTo(x - h + k * p, y - h); ctx.lineTo(x - h + k * p, y + h); }
    ctx.save(); ctx.translate(p * 0.05, p * 0.12); ctx.strokeStyle = 'rgba(0,0,12,0.55)'; ctx.lineWidth = Math.max(1.6, p * 0.26); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = shade(col, -0.18); ctx.lineWidth = Math.max(1.5, p * 0.24); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.2, p * 0.17); ctx.stroke();
    ctx.strokeStyle = rgba('#fff', 0.8); ctx.lineWidth = Math.max(0.8, p * 0.07); ctx.stroke();
    ctx.strokeStyle = shade(col, -0.25); ctx.lineWidth = Math.max(1.2, p * 0.14); ctx.beginPath(); for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { const cx = x - h + i * p, cy = y - h + j * p, q = p * 0.2; ctx.moveTo(cx - q, cy - q); ctx.lineTo(cx + q, cy + q); ctx.moveTo(cx + q, cy - q); ctx.lineTo(cx - q, cy + q); } ctx.stroke();
    ctx.restore();
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, s * 0.07); ctx.stroke(); ctx.setLineDash([s * 0.03, s * 0.05]); ctx.strokeStyle = 'rgba(40,60,90,0.7)'; ctx.lineWidth = Math.max(1, s * 0.05); ctx.stroke(); ctx.restore();
  },
  // lace knitting: fine rows of knit stitches with yarn-over eyelets and small raised nupps
  lknit(ctx, d, o = {}) {
    const { kind, col, x, y, s, key } = d, fill = isFilled(kind), h = s / 2, n = o.n ?? 6, p = s / n;
    SKIN.knitv(ctx, d, { n });
    if (!fill) return;
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.clip();
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const cx = x - h + (i + 0.5) * p, cy = y - h + (j + 0.5) * p, t = (i + j * 2 + key) % 4;
      if (t === 0) { ctx.fillStyle = 'rgba(8,10,16,0.65)'; ctx.beginPath(); ctx.ellipse(cx, cy, p * 0.2, p * 0.28, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = rgba(shade(col, 0.4), 0.8); ctx.lineWidth = Math.max(1, p * 0.1); ctx.stroke(); }
      else if (t === 2) { ball(ctx, cx, cy, p * 0.2, shade(col, 0.15), false); } }
    ctx.restore();
  },
  // kantha: running stitch in echoing contour rows that ripple the layered cloth
  kantha(ctx, d, o = {}) {
    const { kind, col, x, y, s, key } = d, fill = isFilled(kind), lw = Math.max(1.6, s * 0.05);
    const dash = (sc, c, a = 1) => { ctx.save(); motifPath(ctx, kind, x, y, s * sc); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([s * 0.09, s * 0.05]); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = lw + 1; ctx.save(); ctx.translate(0.7, 1.1); ctx.stroke(); ctx.restore(); ctx.globalAlpha = a; ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.stroke(); ctx.strokeStyle = rgba(shade(c, 0.5), 0.5); ctx.lineWidth = lw * 0.3; ctx.stroke(); ctx.restore(); };
    ctx.save(); if (fill) { motifPath(ctx, kind, x, y, s); ctx.fillStyle = rgba(col, 0.2); ctx.fill(); ctx.strokeStyle = rgba('#000', 0.14); ctx.lineWidth = s * 0.06; ctx.stroke(); }
    ctx.restore();
    if (fill) { dash(1, col); dash(0.7, shade(col, hash(key, 1) > 0.5 ? 0.18 : -0.18)); dash(0.4, col); } else { dash(1, col); }
    void o;
  },
  // translucent patchwork: a silk piece with a folded seam allowance and a hand-stitched seam
  patch(ctx, d, o = {}) {
    const { kind, col, x, y, s, key } = d, fill = isFilled(kind), lw = lineWidthOf(kind, s);
    if (!fill) { ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(shade(col, -0.4), 0.55); ctx.lineWidth = lw * 1.25; ctx.stroke(); ctx.strokeStyle = rgba(col, 0.95); ctx.lineWidth = lw * 0.8; ctx.stroke(); ctx.setLineDash([lw * 0.5, lw * 0.4]); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(1, lw * 0.14); ctx.stroke(); ctx.restore(); return; }
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.fillStyle = rgba(col, 0.84); ctx.fill(); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 9; k++) { const t = y - s / 2 + (k + 0.5) * s / 9; ctx.moveTo(x - s / 2, t); ctx.lineTo(x + s / 2, t); const v = x - s / 2 + (k + 0.5) * s / 9; ctx.moveTo(v, y - s / 2); ctx.lineTo(v, y + s / 2); } ctx.stroke();
    const g = ctx.createLinearGradient(x - s / 2, y - s / 2, x + s / 2, y + s / 2); g.addColorStop(0, 'rgba(255,255,255,0.34)'); g.addColorStop(0.5, 'rgba(255,255,255,0.04)'); g.addColorStop(1, 'rgba(0,0,0,0.18)'); ctx.fillStyle = g; ctx.fillRect(x - s / 2, y - s / 2, s, s); ctx.restore();
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(shade(col, -0.45), 0.7); ctx.lineWidth = s * 0.07; ctx.stroke(); ctx.strokeStyle = rgba(shade(col, 0.4), 0.8); ctx.lineWidth = s * 0.025; ctx.save(); ctx.translate(-s * 0.015, -s * 0.015); ctx.stroke(); ctx.restore();
    ctx.setLineDash([s * 0.06, s * 0.05]); ctx.strokeStyle = rgba(o.seam ?? '#fff', 0.85); ctx.lineWidth = Math.max(1, s * 0.016); motifPath(ctx, kind, x, y, s * 0.88); ctx.stroke(); ctx.restore(); void key;
  },
  // tie-resist dots: dye-saturated cloth with tiny undyed flowers where the cloth was pinched and bound
  bandhani(ctx, d, o = {}) {
    const { kind, col, x, y, s, key } = d, fill = isFilled(kind), lw = lineWidthOf(kind, s), h = s / 2, n = o.n ?? 5, p = s / n, cream = o.cream ?? '#f7ecd2';
    const dot = (cx, cy, r) => { ctx.fillStyle = cream; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); ctx.fillStyle = rgba(col, 0.9); ctx.beginPath(); ctx.arc(cx, cy, r * 0.34, 0, TAU); ctx.fill(); ctx.strokeStyle = rgba(shade(col, -0.2), 0.7); ctx.lineWidth = Math.max(0.7, r * 0.2); ctx.beginPath(); ctx.arc(cx, cy, r * 0.95, 0, TAU); ctx.stroke(); };
    if (!fill) { ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(col, 0.35); ctx.lineWidth = lw * 1.5; ctx.stroke(); ctx.restore(); ctx.save(); motifPath(ctx, kind, x, y, s); ctx.setLineDash([0.01, p * 0.62]); ctx.lineCap = 'round'; ctx.strokeStyle = cream; ctx.lineWidth = Math.max(2.4, p * 0.34); ctx.stroke(); ctx.strokeStyle = rgba(col, 0.9); ctx.lineWidth = Math.max(1, p * 0.12); ctx.stroke(); ctx.restore(); return; }
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.fillStyle = col; ctx.fill(); ctx.clip();
    const g = ctx.createRadialGradient(x - h * 0.3, y - h * 0.3, 1, x, y, s); g.addColorStop(0, 'rgba(255,255,255,0.2)'); g.addColorStop(1, 'rgba(0,0,0,0.2)'); ctx.fillStyle = g; ctx.fillRect(x - h, y - h, s, s);
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) dot(x - h + (i + (j % 2) * 0.5) * p, y - h + (j + 0.1) * p * 0.92, p * 0.2 * (0.9 + hash(key, i, j) * 0.2));
    ctx.restore(); ctx.save(); motifPath(ctx, kind, x, y, s); ctx.strokeStyle = rgba(shade(col, -0.45), 0.6); ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke(); ctx.restore();
  },
  // loaded-brush petals: strokes pressed down and lifted, darker where the brush landed
  petal(ctx, d, o = {}) {
    const { kind, col, x, y, s, key } = d, fill = isFilled(kind), lw = lineWidthOf(kind, s), h = s / 2;
    if (ROSETTE.has(kind)) { // a flower head: each petal is one pressed and lifted brush stroke, darker at the rim
      const n = kind === 'hexagon' ? 6 : kind === 'ring' ? 9 : 5, R = s * (kind === 'ring' ? 0.4 : 0.42), a0 = hash(key, 3) * 0.5;
      ctx.save(); ctx.lineJoin = 'round';
      for (let k = 0; k < n; k++) {
        const a = a0 + (k / n) * TAU, pr = kind === 'ring' ? R * 0.34 : R * 0.62, d0 = kind === 'ring' ? R * 0.72 : R * 0.5;
        ctx.save(); ctx.translate(x + Math.cos(a) * d0, y + Math.sin(a) * d0); ctx.rotate(a);
        ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(pr * 0.1 + 1, pr * 0.2 + 1.4, pr * 0.9, pr * 0.62, 0, 0, TAU); ctx.fill();
        const g = ctx.createLinearGradient(-pr, 0, pr, 0); g.addColorStop(0, shade(col, -0.22)); g.addColorStop(0.7, col); g.addColorStop(1, shade(col, -0.45));
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, pr, pr * 0.6, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = rgba(shade(col, -0.55), 0.7); ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke();
        ctx.fillStyle = rgba(shade(col, 0.55), 0.6); ctx.beginPath(); ctx.ellipse(-pr * 0.18, -pr * 0.12, pr * 0.5, pr * 0.2, -0.2, 0, TAU); ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = shade(col, -0.55); ctx.beginPath(); ctx.arc(x, y, R * (kind === 'ring' ? 0.2 : 0.3), 0, TAU); ctx.fill();
      ctx.fillStyle = '#f2c230'; ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.3; ctx.moveTo(x + Math.cos(a) * R * 0.16 + R * 0.05, y + Math.sin(a) * R * 0.16); ctx.arc(x + Math.cos(a) * R * 0.16, y + Math.sin(a) * R * 0.16, Math.max(0.9, R * 0.05), 0, TAU); } ctx.fill();
      ctx.restore(); return;
    }
    if (!fill) { ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(shade(col, -0.45), 0.9); ctx.lineWidth = lw * 1.2; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw * 0.85; ctx.stroke(); ctx.strokeStyle = rgba(shade(col, 0.6), 0.6); ctx.lineWidth = lw * 0.22; ctx.save(); ctx.translate(-lw * 0.15, -lw * 0.18); ctx.stroke(); ctx.restore(); ctx.restore(); return; }
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = s * 0.05; ctx.save(); ctx.translate(s * 0.012, s * 0.025); ctx.stroke(); ctx.restore(); ctx.fillStyle = col; ctx.fill(); ctx.clip();
    const n = o.n ?? 6; ctx.lineCap = 'round';
    for (let k = 0; k < n; k++) { const a = (k / n) * TAU + hash(key, k) * 0.4, r1 = h * 1.1;
      const g = ctx.createLinearGradient(x, y, x + Math.cos(a) * r1, y + Math.sin(a) * r1); g.addColorStop(0, rgba(shade(col, -0.45), 0.75)); g.addColorStop(0.55, rgba(col, 0)); g.addColorStop(1, rgba(shade(col, 0.5), 0.55));
      ctx.strokeStyle = g; ctx.lineWidth = s * 0.17; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a + 0.4) * r1 * 0.6, y + Math.sin(a + 0.4) * r1 * 0.6, x + Math.cos(a) * r1, y + Math.sin(a) * r1); ctx.stroke(); }
    ctx.fillStyle = rgba(shade(col, -0.5), 0.8); ctx.beginPath(); ctx.arc(x, y, s * 0.06, 0, TAU); ctx.fill(); ctx.fillStyle = rgba('#fff', 0.55); ctx.beginPath(); ctx.arc(x - s * 0.04, y - s * 0.04, s * 0.025, 0, TAU); ctx.fill();
    ctx.restore(); ctx.save(); motifPath(ctx, kind, x, y, s); ctx.strokeStyle = rgba(shade(col, -0.5), 0.55); ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke(); ctx.restore();
  },
  // raised ridge: dark paste ridges drawn first, the fields between them painted flat
  ridge(ctx, d, o = {}) {
    const { kind, col, x, y, s } = d, fill = isFilled(kind), lw = lineWidthOf(kind, s), rc = o.ridge ?? '#1c1511';
    const rid = (w) => { ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = w + 3; ctx.save(); ctx.translate(w * 0.18, w * 0.3); ctx.stroke(); ctx.restore();
      ctx.strokeStyle = rc; ctx.lineWidth = w; ctx.stroke(); ctx.strokeStyle = 'rgba(255,240,220,0.5)'; ctx.lineWidth = Math.max(1, w * 0.22); ctx.save(); ctx.translate(-w * 0.2, -w * 0.26); ctx.stroke(); ctx.restore(); ctx.restore(); };
    if (!fill) { rid(lw * 0.85); ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(col, 0.9); ctx.lineWidth = lw * 0.22; ctx.stroke(); ctx.restore(); return; }
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.fillStyle = col; ctx.fill(); ctx.clip(); const g = ctx.createLinearGradient(x - s / 2, y - s / 2, x + s / 2, y + s / 2); g.addColorStop(0, 'rgba(255,255,255,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0.2)'); ctx.fillStyle = g; ctx.fillRect(x - s / 2, y - s / 2, s, s); ctx.restore();
    rid(Math.max(2.4, s * 0.1));
  },
  // plaited straw: pale splints running outward, cross strands at intervals
  straw(ctx, d, o = {}) {
    const { kind, col, x, y, s, key } = d, fill = isFilled(kind), lw = lineWidthOf(kind, s), h = s / 2, n = o.n ?? 6, p = s / n;
    if (!fill) { ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = lw + 2; ctx.stroke(); ctx.strokeStyle = shade(col, -0.2); ctx.lineWidth = lw; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = lw * 0.6; ctx.setLineDash([p * 0.9, p * 0.2]); ctx.stroke(); ctx.restore(); return; }
    ctx.save(); motifPath(ctx, kind, x, y, s); ctx.fillStyle = shade(col, -0.45); ctx.fill(); ctx.clip();
    for (let i = 0; i < n; i++) { const xx = x - h + (i + 0.5) * p, sh = (hash(key, i) - 0.5) * 0.14; ctx.fillStyle = shade(col, sh); ctx.fillRect(xx - p * 0.46, y - h - 1, p * 0.92, s + 2); ctx.fillStyle = rgba(shade(col, 0.55), 0.5); ctx.fillRect(xx - p * 0.4, y - h - 1, p * 0.14, s + 2); ctx.fillStyle = rgba(shade(col, -0.5), 0.4); ctx.fillRect(xx + p * 0.4, y - h - 1, p * 0.1, s + 2); }
    for (let j = 0; j < n; j += 2) { const yy = y - h + (j + 0.5) * p; ctx.fillStyle = rgba(shade(col, -0.45), 0.55); for (let i = (j / 2) % 2; i < n; i += 2) ctx.fillRect(x - h + i * p, yy - p * 0.12, p * 0.96, p * 0.24); }
    ctx.restore(); ctx.save(); motifPath(ctx, kind, x, y, s); ctx.strokeStyle = rgba(shade(col, -0.5), 0.6); ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke(); ctx.restore();
  },
  // fine silk satin stitch: very thin diagonal strands, each its own sheen
  satin(ctx, d, o = {}) {
    SKIN.threads(ctx, d, { n: o.n ?? 12, dir: 'd', lt: 0.85 });
    if (!isFilled(d.kind)) return;
    const { kind, x, y, s } = d; ctx.save(); motifPath(ctx, kind, x, y, s); ctx.clip();
    const g = ctx.createLinearGradient(x - s / 2, y - s / 2, x + s / 2, y + s / 2); g.addColorStop(0, 'rgba(255,255,255,0.32)'); g.addColorStop(0.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.2)'); ctx.fillStyle = g; ctx.fillRect(x - s / 2, y - s / 2, s, s); ctx.restore();
  },
});
const ROSETTE = new Set(['dot', 'hexagon', 'ring', 'solid']);
function n(s, p) { return Math.ceil(s / p) + 1; }
export { speck, mix };

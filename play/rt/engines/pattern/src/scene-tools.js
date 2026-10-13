// The maker's tools, drawn with form and animated by the scene runtime (scenes.js). Every tool is drawn with its working tip at
// (T.x, T.y) in virtual units; T = { x, y, a (seconds since the last stamp), t (clock), col (selected colour), u (cell size), dx, dy }.
import { rod, ball, poly, rgba, shade, mix, roundRectPath, hash, TAU, sheenLine, shadowed } from './scene-kit.js';

const press = (T) => Math.max(0, 1 - T.a / 0.45);               // 1 at the moment of a stroke, easing to 0
const bob = (T) => Math.sin(T.t * 2.1) * T.u * 0.03;
// a straight shaft from the tip, leaning by angle a (radians, + = top to the right); returns the far end
const shaft = (ctx, T, len, a, w, c, ox = 0, oy = 0) => {
  const x1 = T.x + ox, y1 = T.y + oy, x2 = x1 + Math.sin(a) * len, y2 = y1 - Math.cos(a) * len;
  rod(ctx, x1, y1, x2, y2, w, c); return [x2, y2];
};
const soft = (ctx, x, y, rx, ry, a = 0.3) => { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); };
const WOOD = '#b9854a', DARK = '#6a4524', STEEL = '#c9d0d8', BAMBOO = '#c8b46a';

export const TOOLS = {
  // boat shuttle with a spool of the working thread; its nose is the tip
  shuttle(ctx, S, T, o = {}) {
    const u = T.u, L = u * 2.8, H = u * 0.5, lift = press(T) * u * 0.1;
    soft(ctx, T.x + L * 0.5 + 3, T.y + u * 0.14, L * 0.5, H * 0.5);
    ctx.save(); ctx.translate(T.x + L * 0.5, T.y - H * 0.35 - lift); ctx.rotate(-0.05);
    const g = ctx.createLinearGradient(0, -H, 0, H); g.addColorStop(0, shade(o.wood ?? WOOD, 0.35)); g.addColorStop(0.5, o.wood ?? WOOD); g.addColorStop(1, shade(o.wood ?? WOOD, -0.45));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.quadraticCurveTo(-L * 0.15, -H * 1.1, L / 2, -H * 0.2); ctx.lineTo(L / 2, H * 0.2); ctx.quadraticCurveTo(-L * 0.15, H * 1.1, -L / 2, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2a1a0c'; ctx.beginPath(); ctx.ellipse(L * 0.04, 0, L * 0.26, H * 0.34, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? T.col : shade(T.col, -0.2); ctx.fillRect(-L * 0.18 + i * L * 0.06, -H * 0.26, L * 0.06, H * 0.52); }
    ctx.fillStyle = STEEL; ctx.beginPath(); ctx.arc(-L / 2 + 2, 0, u * 0.07, 0, TAU); ctx.fill();
    ctx.restore();
    sheenLine(ctx, [[T.x, T.y - H * 0.35], [T.x - u * 0.6, T.y - H * 0.25 + Math.sin(T.t * 3) * u * 0.05], [T.x - u * 1.2, T.y]], Math.max(1.6, u * 0.07), T.col);
  },
  // copper pen of the batik maker: bamboo handle, small cup of hot wax, one fine spout
  canting(ctx, S, T, o = {}) {
    const u = T.u, a = 0.75, p = press(T);
    soft(ctx, T.x + u * 0.5, T.y + u * 0.08, u * 0.7, u * 0.12);
    const [hx, hy] = shaft(ctx, T, u * 4.2, a, u * 0.2, BAMBOO, 0, -p * u * 0.05);
    ctx.save(); ctx.translate(T.x + Math.sin(a) * u * 0.55, T.y - Math.cos(a) * u * 0.55); ctx.rotate(a);
    const g = ctx.createLinearGradient(-u * 0.3, 0, u * 0.3, 0); g.addColorStop(0, '#f0b27a'); g.addColorStop(0.5, '#c8793a'); g.addColorStop(1, '#6d3a14');
    ctx.fillStyle = g; poly(ctx, [[-u * 0.1, u * 0.1], [u * 0.1, u * 0.1], [u * 0.34, -u * 0.55], [-u * 0.34, -u * 0.55]]); ctx.fill();
    ctx.fillStyle = '#fff3cc'; ctx.beginPath(); ctx.ellipse(0, -u * 0.55, u * 0.3, u * 0.09, 0, 0, TAU); ctx.fill();
    ctx.restore();
    if (T.a < 0.5) { ctx.fillStyle = '#fff3cc'; ctx.beginPath(); ctx.ellipse(T.x, T.y + T.a * u * 0.6 + 2, u * 0.04, u * 0.07, 0, 0, TAU); ctx.fill(); }
    void hx; void hy; void o;
  },
  // a reed, brush or stylus with a loaded tip: o = { len, w, tip, ball }
  stylus(ctx, S, T, o = {}) {
    const u = T.u, p = press(T), a = o.a ?? 0.6, len = u * (o.len ?? 4.2);
    soft(ctx, T.x + u * 0.4, T.y + u * 0.08, u * 0.5, u * 0.09);
    const end = shaft(ctx, T, len, a, u * (o.w ?? 0.17), o.body ?? BAMBOO, 0, -p * u * 0.04);
    if (o.nodes) { ctx.strokeStyle = 'rgba(60,40,10,0.6)'; ctx.lineWidth = 1.4; for (let k = 1; k < 4; k++) { const f = k / 4, x = T.x + (end[0] - T.x) * f, y = T.y + (end[1] - T.y) * f; ctx.beginPath(); ctx.moveTo(x - u * 0.1, y - u * 0.02); ctx.lineTo(x + u * 0.1, y + u * 0.02); ctx.stroke(); } }
    if (o.ferrule) { const f0 = 0.1, f1 = 0.27; rod(ctx, T.x + (end[0] - T.x) * f0, T.y + (end[1] - T.y) * f0, T.x + (end[0] - T.x) * f1, T.y + (end[1] - T.y) * f1, u * (o.w ?? 0.17) * 1.2, STEEL); }
    if (o.hair) { const x2 = T.x + Math.sin(a) * u * 0.55, y2 = T.y - Math.cos(a) * u * 0.55; ctx.fillStyle = T.col; ctx.beginPath(); ctx.moveTo(T.x, T.y); ctx.lineTo(x2 - Math.cos(a) * u * 0.15, y2 - Math.sin(a) * u * 0.15); ctx.lineTo(x2 + Math.cos(a) * u * 0.15, y2 + Math.sin(a) * u * 0.15); ctx.closePath(); ctx.fill(); }
    ball(ctx, T.x, T.y, u * (o.ball ?? 0.1), T.col, false);
  },
  // flat sign-painter's brush / feather brush: wide head
  brush(ctx, S, T, o = {}) {
    const u = T.u, a = o.a ?? 0.7, p = press(T), len = u * 4.4;
    soft(ctx, T.x + u * 0.5, T.y + u * 0.08, u * 0.6, u * 0.1);
    ctx.save(); ctx.translate(T.x, T.y - p * u * 0.05); ctx.rotate(a);
    const w = u * (o.w ?? 0.34);
    const g = ctx.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, shade(o.body ?? WOOD, 0.3)); g.addColorStop(1, shade(o.body ?? WOOD, -0.4));
    ctx.fillStyle = g; poly(ctx, [[-w * 0.5, -u * 0.9], [w * 0.5, -u * 0.9], [w * 0.35, -len], [-w * 0.35, -len]]); ctx.fill();
    ctx.fillStyle = STEEL; ctx.fillRect(-w * 0.62, -u * 1.15, w * 1.24, u * 0.3);
    ctx.fillStyle = T.col; ctx.beginPath(); ctx.moveTo(-w * 0.6, -u * 0.9); ctx.quadraticCurveTo(-w * 0.7, -u * 0.2, -w * 0.15, 0); ctx.quadraticCurveTo(w * 0.4, -u * 0.1, w * 0.6, -u * 0.9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-w * 0.3, -u * 0.8, w * 0.2, u * 0.5);
    ctx.restore();
  },
  // rake: five tines trailing in the gravel
  rake(ctx, S, T, o = {}) {
    const u = T.u, a = 0.55, p = press(T), n = 5, sp = u * 0.2;
    soft(ctx, T.x + u * 0.2, T.y + u * 0.18, u * 0.7, u * 0.14, 0.35);
    const hx = T.x, hy = T.y - u * 0.34 - p * u * 0.08;
    shaft(ctx, { x: hx, y: hy }, u * 5, a, u * 0.16, '#a98657');
    const g = ctx.createLinearGradient(0, hy - u * 0.08, 0, hy + u * 0.08); g.addColorStop(0, '#d9b57c'); g.addColorStop(1, '#7a5a2a');
    ctx.fillStyle = g; roundRectPath(ctx, hx - sp * 2.6, hy - u * 0.09, sp * 5.2, u * 0.18, 3); ctx.fill();
    ctx.strokeStyle = '#5a3d1c'; ctx.lineWidth = Math.max(1.5, u * 0.05); ctx.lineCap = 'round';
    for (let k = 0; k < n; k++) { ctx.beginPath(); ctx.moveTo(hx + (k - 2) * sp, hy + u * 0.05); ctx.lineTo(hx + (k - 2) * sp, T.y + u * 0.04); ctx.stroke(); }
    void o;
  },
  // chisel struck by a small hammer (tile cutter / stone setter); the hammer swings down on each stroke
  hammer(ctx, S, T, o = {}) {
    const u = T.u, p = press(T), swing = (1 - p) * 0.9;
    soft(ctx, T.x + u * 0.3, T.y + u * 0.1, u * 0.45, u * 0.1);
    if (o.chisel !== false) { rod(ctx, T.x, T.y, T.x + u * 0.12, T.y - u * 1.5, u * 0.14, STEEL); ctx.fillStyle = shade(STEEL, -0.2); poly(ctx, [[T.x - u * 0.07, T.y], [T.x + u * 0.07, T.y], [T.x, T.y + u * 0.12]]); ctx.fill(); }
    ctx.save(); ctx.translate(T.x + u * 0.12, T.y - u * 1.6); ctx.rotate(swing * 0.9 - 0.2 + bob(T) * 0.5);
    rod(ctx, 0, 0, u * 1.9, -u * 0.5, u * 0.18, '#a07040'); // handle to the right
    const g = ctx.createLinearGradient(-u * 0.3, 0, u * 0.3, 0); g.addColorStop(0, '#eef2f6'); g.addColorStop(1, '#6a727c');
    ctx.fillStyle = g; roundRectPath(ctx, -u * 0.34, -u * 0.26, u * 0.68, u * 0.52, 4); ctx.fill();
    ctx.restore();
    void o;
  },
  // needle with a thread trailing to a spool
  needle(ctx, S, T, o = {}) {
    const u = T.u, p = press(T), a = 0.85, len = u * 3.4;
    const x2 = T.x + Math.sin(a) * len, y2 = T.y - Math.cos(a) * len;
    const sx = x2 + u * 0.6, sy = y2 + u * 0.7 + Math.sin(T.t * 1.7) * u * 0.05;
    sheenLine(ctx, [[x2, y2], [x2 + u * 0.4, y2 + u * 0.1], [sx + u * 0.3, sy + u * 0.4], [sx + u * 0.8, sy + u * 1.6]], Math.max(1.4, u * 0.07), T.col);
    soft(ctx, T.x + u * 0.2, T.y + u * 0.1, u * 0.6, u * 0.09);
    const g = ctx.createLinearGradient(T.x, T.y, x2, y2); g.addColorStop(0, '#8e98a4'); g.addColorStop(0.5, '#f6f9fc'); g.addColorStop(1, '#7c858f');
    ctx.strokeStyle = g; ctx.lineWidth = Math.max(1.8, u * 0.075); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(T.x, T.y - p * u * 0.05); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = '#2a2f36'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(x2 - Math.sin(a) * u * 0.1, y2 + Math.cos(a) * u * 0.1, u * 0.03, u * 0.1, a, 0, TAU); ctx.stroke();
    if (o.thimble) { ctx.fillStyle = '#c9a050'; ctx.beginPath(); ctx.ellipse(x2 + u * 0.25, y2 - u * 0.15, u * 0.2, u * 0.32, a, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.3)'; for (let k = 0; k < 5; k++) ctx.fillRect(x2 + u * 0.15 + k * 0.5, y2 - u * 0.3 + k * 2, 1.4, 1.4); }
  },
  // carved block with a handle: lifts and presses; `o.round` for a calabash-gourd stamp
  block(ctx, S, T, o = {}) {
    const u = T.u, p = press(T), lift = (1 - p) * u * 0.45 + u * 0.12, w = u * (o.w ?? 0.95);
    soft(ctx, T.x + u * 0.1, T.y + u * 0.1, w * 0.55, w * 0.18, 0.25 + p * 0.1);
    ctx.save(); ctx.translate(T.x, T.y - lift);
    const col = o.body ?? '#a97a44';
    const g = ctx.createLinearGradient(-w / 2, -w / 2, w / 2, w / 2); g.addColorStop(0, shade(col, 0.3)); g.addColorStop(1, shade(col, -0.4));
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; roundRectPath(ctx, -w / 2 + 3, -w + 4, w, w, o.round ? w / 2 : 5); ctx.fill();
    ctx.fillStyle = g; roundRectPath(ctx, -w / 2, -w, w, w, o.round ? w / 2 : 5); ctx.fill();
    ctx.fillStyle = o.ink ?? T.col; roundRectPath(ctx, -w / 2 + 2, -4, w - 4, 6, 3); ctx.fill();
    ctx.fillStyle = shade(col, -0.1); roundRectPath(ctx, -w * 0.17, -w - u * 0.55, w * 0.34, u * 0.62, 5); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-w * 0.4, -w * 0.9); ctx.lineTo(w * 0.3, -w * 0.9); ctx.stroke();
    ctx.restore();
  },
  // ladle that pours a thin thread of hot liquid
  ladle(ctx, S, T, o = {}) {
    const u = T.u, a = 0.9, hx = T.x + Math.sin(a) * u * 0.9, hy = T.y - u * 0.9 - 0 - Math.cos(a) * 0.1;
    // stream of syrup from the lip to the work
    ctx.strokeStyle = rgba(T.col, 0.85); ctx.lineWidth = Math.max(1.6, u * 0.06); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(T.x, T.y - u * 0.75); ctx.lineTo(T.x + Math.sin(T.t * 9) * 1.2, T.y); ctx.stroke();
    ctx.save(); ctx.translate(T.x, T.y - u * 0.8); ctx.rotate(0.28);
    rod(ctx, u * 0.4, -u * 0.1, u * 3.4, -u * 1.4, u * 0.14, '#7a4a22');
    const g = ctx.createRadialGradient(u * 0.2, -u * 0.15, 2, u * 0.4, 0, u * 0.7); g.addColorStop(0, '#f0f3f6'); g.addColorStop(1, '#6a727c');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(u * 0.35, -u * 0.05, u * 0.55, u * 0.4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = shade(T.col, -0.1); ctx.beginPath(); ctx.ellipse(u * 0.35, -u * 0.1, u * 0.42, u * 0.28, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(u * 0.22, -u * 0.18, u * 0.14, u * 0.06, -0.4, 0, TAU); ctx.fill();
    ctx.restore(); void hx; void hy; void o;
  },
  // cone of henna paste: the tip draws a bead
  cone(ctx, S, T, o = {}) {
    const u = T.u, p = press(T), a = 0.55;
    soft(ctx, T.x + u * 0.3, T.y + u * 0.08, u * 0.4, u * 0.09);
    ctx.save(); ctx.translate(T.x, T.y - p * u * 0.04); ctx.rotate(a);
    const w = u * 0.62, L = u * 3.0, g = ctx.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, '#f5f1e4'); g.addColorStop(0.5, '#cfc8b4'); g.addColorStop(1, '#8a8470');
    ctx.fillStyle = g; poly(ctx, [[0, 0], [-w, -L], [w, -L]]); ctx.fill();
    ctx.fillStyle = T.col; poly(ctx, [[0, 0], [-w * 0.1, -u * 0.55], [w * 0.1, -u * 0.55]]); ctx.fill();
    ctx.strokeStyle = 'rgba(80,60,30,0.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-w * 0.1, -L * 0.2); ctx.lineTo(w * 0.7, -L * 0.8); ctx.stroke();
    ctx.restore(); void o;
  },
  // quill pen
  quill(ctx, S, T, o = {}) {
    const u = T.u, a = 0.8, p = press(T);
    soft(ctx, T.x + u * 0.3, T.y + u * 0.06, u * 0.5, u * 0.08);
    ctx.save(); ctx.translate(T.x, T.y - p * u * 0.04); ctx.rotate(a);
    rod(ctx, 0, 0, 0, -u * 1.6, u * 0.1, '#e9dfc5');
    ctx.fillStyle = '#f2ecdc'; ctx.beginPath(); ctx.moveTo(0, -u * 1.0); ctx.bezierCurveTo(-u * 0.9, -u * 2.0, -u * 0.5, -u * 3.6, u * 0.2, -u * 4.4); ctx.bezierCurveTo(u * 0.5, -u * 3.0, u * 0.5, -u * 2.0, u * 0.1, -u * 1.0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(120,100,70,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -u * 1.0); ctx.lineTo(u * 0.2, -u * 4.3); ctx.stroke();
    ctx.fillStyle = '#111'; poly(ctx, [[-u * 0.04, -u * 0.18], [u * 0.04, -u * 0.18], [0, 0]]); ctx.fill();
    ctx.restore(); void o;
  },
  // two knitting needles crossing, wool from a ball
  knit(ctx, S, T, o = {}) {
    const u = T.u, p = press(T), sw = Math.sin(T.t * 4) * 0.04 * (T.a < 0.6 ? 1 : 0.3);
    soft(ctx, T.x + u * 0.3, T.y + u * 0.1, u * 0.7, u * 0.1);
    for (const [a, c] of [[0.5 + sw + p * 0.08, '#d8b070'], [-0.1 - sw, '#c49a58']]) {
      const x2 = T.x + Math.sin(a) * u * 3.8, y2 = T.y - Math.cos(a) * u * 3.8; rod(ctx, T.x, T.y, x2, y2, u * 0.13, c);
      ball(ctx, x2, y2, u * 0.17, '#e8d4a0', false);
    }
    ball(ctx, T.x + u * 0.9, T.y + u * 1.0, u * 0.7, T.col, true);
    sheenLine(ctx, [[T.x + u * 0.45, T.y + u * 0.6], [T.x + u * 0.2, T.y + u * 0.2], [T.x, T.y]], Math.max(1.5, u * 0.07), T.col);
    void o;
  },
  // bead needle: a long fine needle with a bead on its point
  bead(ctx, S, T, o = {}) {
    const u = T.u, p = press(T), a = 0.9, len = u * 3.2;
    soft(ctx, T.x + u * 0.2, T.y + u * 0.08, u * 0.5, u * 0.08);
    shaft(ctx, T, len, a, Math.max(1.6, u * 0.06), '#e8edf2', 0, -p * u * 0.06);
    ball(ctx, T.x + Math.sin(a) * u * 0.5, T.y - Math.cos(a) * u * 0.5, u * 0.16, T.col, false);
    sheenLine(ctx, [[T.x + Math.sin(a) * len, T.y - Math.cos(a) * len], [T.x + u * 2.6, T.y - u * 0.9], [T.x + u * 3.4, T.y + u * 0.6]], Math.max(1.2, u * 0.05), '#f4efe0');
    void o;
  },
  // weaver's beater comb: strikes the new row down
  comb(ctx, S, T, o = {}) {
    const u = T.u, p = press(T), w = u * 1.8, lift = (1 - p) * u * 0.5 + u * 0.1;
    soft(ctx, T.x, T.y + u * 0.1, w * 0.5, u * 0.1, 0.25);
    ctx.save(); ctx.translate(T.x, T.y - lift);
    const g = ctx.createLinearGradient(0, -u * 1.2, 0, 0); g.addColorStop(0, shade(o.body ?? '#9a6a38', 0.3)); g.addColorStop(1, shade(o.body ?? '#9a6a38', -0.35));
    ctx.fillStyle = g; roundRectPath(ctx, -w / 2, -u * 1.1, w, u * 0.9, 5); ctx.fill();
    ctx.fillStyle = '#4a2f14'; for (let k = 0; k < 9; k++) ctx.fillRect(-w / 2 + 4 + k * (w - 8) / 8 - 1.5, -u * 0.22, 3, u * 0.22);
    rod(ctx, w * 0.3, -u * 1.0, w * 0.55, -u * 2.4, u * 0.2, '#7a4f26');
    ctx.restore();
  },
  trowel(ctx, S, T, o = {}) {
    const u = T.u, p = press(T), a = 0.7;
    soft(ctx, T.x + u * 0.3, T.y + u * 0.1, u * 0.6, u * 0.1);
    ctx.save(); ctx.translate(T.x, T.y - p * u * 0.06); ctx.rotate(a);
    const g = ctx.createLinearGradient(-u * 0.4, 0, u * 0.4, 0); g.addColorStop(0, '#f0f3f6'); g.addColorStop(1, '#7c858f');
    ctx.fillStyle = g; poly(ctx, [[0, 0], [-u * 0.42, -u * 1.1], [u * 0.42, -u * 1.1]]); ctx.fill();
    rod(ctx, 0, -u * 1.1, 0, -u * 1.7, u * 0.1, '#9aa3ad'); rod(ctx, 0, -u * 1.7, 0, -u * 3.3, u * 0.28, '#8a5a30');
    ctx.restore(); void o;
  },
  hook(ctx, S, T, o = {}) { // tambour hook: needle in a wooden handle
    const u = T.u, p = press(T), a = 0.55;
    soft(ctx, T.x + u * 0.3, T.y + u * 0.08, u * 0.5, u * 0.08);
    const e = shaft(ctx, T, u * 1.2, a, u * 0.07, '#d8dde2', 0, -p * u * 0.05);
    ctx.strokeStyle = '#d8dde2'; ctx.lineWidth = u * 0.07; ctx.beginPath(); ctx.arc(T.x - u * 0.03, T.y - u * 0.02, u * 0.07, 0.3, 3.4); ctx.stroke();
    rod(ctx, e[0], e[1], e[0] + Math.sin(a) * u * 2.4, e[1] - Math.cos(a) * u * 2.4, u * 0.36, '#8a5a30');
    sheenLine(ctx, [[T.x, T.y], [T.x - u * 0.6, T.y + u * 0.5], [T.x - u * 1.4, T.y + u * 0.3]], Math.max(1.4, u * 0.06), T.col);
    void o;
  },
  finger(ctx, S, T, o = {}) { // a pointing finger (the memory keeper reading the board)
    const u = T.u, p = press(T);
    ctx.save(); ctx.translate(T.x, T.y - p * u * 0.1); ctx.rotate(0.35);
    soft(ctx, u * 0.3, u * 0.5, u * 0.5, u * 0.1, 0.3);
    const g = ctx.createLinearGradient(-u * 0.3, 0, u * 0.3, 0); g.addColorStop(0, o.skin ?? '#d9a06a'); g.addColorStop(1, shade(o.skin ?? '#d9a06a', -0.35));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-u * 0.25, -u * 3); ctx.lineTo(-u * 0.22, -u * 0.25); ctx.quadraticCurveTo(0, u * 0.18, u * 0.22, -u * 0.25); ctx.lineTo(u * 0.25, -u * 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(0, -u * 0.12, u * 0.15, u * 0.1, 0, 0, TAU); ctx.fill();
    ctx.restore(); void o;
  },
  peg(ctx, S, T, o = {}) { // a hand-held turned piece being set
    const u = T.u, p = press(T), lift = (1 - p) * u * 0.4 + u * 0.1;
    soft(ctx, T.x + u * 0.1, T.y + u * 0.1, u * 0.3, u * 0.09);
    ctx.save(); ctx.translate(T.x, T.y - lift);
    rod(ctx, 0, 0, 0, -u * 1.2, u * 0.3, T.col); ball(ctx, 0, -u * 1.4, u * 0.28, shade(T.col, 0.1), false); ball(ctx, 0, -u * 0.2, u * 0.2, shade(T.col, -0.1), false);
    ctx.restore(); void o;
  },
  saw(ctx, S, T, o = {}) { // thin pull-saw / fine chisel
    const u = T.u, p = press(T), a = 0.9;
    soft(ctx, T.x + u * 0.5, T.y + u * 0.08, u * 0.8, u * 0.08);
    ctx.save(); ctx.translate(T.x, T.y); ctx.rotate(a + Math.sin(T.t * 14) * 0.02 * p);
    const g = ctx.createLinearGradient(0, -u * 0.2, 0, u * 0.2); g.addColorStop(0, '#f6f8fb'); g.addColorStop(1, '#8a929c'); ctx.fillStyle = g; ctx.fillRect(0, -u * 0.12, -u * 2.2 + 0, u * 0.24); ctx.restore();
    ctx.save(); ctx.translate(T.x, T.y); ctx.rotate(a); ctx.fillStyle = g; poly(ctx, [[0, -u * 0.12], [u * 2.2, -u * 0.22], [u * 2.2, u * 0.12], [0, u * 0.12]]); ctx.fill();
    rod(ctx, u * 2.2, -u * 0.05, u * 3.8, -u * 0.1, u * 0.3, '#caa66c'); ctx.restore(); void o;
  },
  // hand-lifted splint of bamboo that opens the warp threads
  splint(ctx, S, T, o = {}) {
    const u = T.u, p = press(T), a = 1.05;
    soft(ctx, T.x + u * 0.5, T.y + u * 0.08, u * 0.8, u * 0.07);
    shaft(ctx, T, u * 3.2, a, u * 0.1, '#e3d08a', 0, -p * u * 0.08);
    sheenLine(ctx, [[T.x, T.y], [T.x - u * 0.3, T.y - u * 0.4]], Math.max(1.4, u * 0.05), T.col);
    void o;
  },
  // the dyer's raffia tie
  tie(ctx, S, T, o = {}) {
    const u = T.u, p = press(T);
    soft(ctx, T.x, T.y + u * 0.1, u * 0.5, u * 0.1);
    ctx.save(); ctx.lineCap = 'round';
    for (let k = 0; k < 4; k++) { ctx.strokeStyle = k % 2 ? '#e8d8a0' : '#c8b070'; ctx.lineWidth = u * 0.12; ctx.beginPath(); ctx.ellipse(T.x, T.y - u * 0.1, u * (0.34 + k * 0.03 - p * 0.08), u * 0.18, 0, 0, TAU); ctx.stroke(); }
    ctx.strokeStyle = '#d8c488'; ctx.lineWidth = u * 0.1; ctx.beginPath(); ctx.moveTo(T.x, T.y - u * 0.3); ctx.quadraticCurveTo(T.x + u * 0.6, T.y - u * 1.4, T.x + u * 1.6, T.y - u * 1.9); ctx.stroke();
    ctx.restore(); void o;
  },
  // thread ball (temari): a pin and winding thread
  pin(ctx, S, T, o = {}) {
    const u = T.u, p = press(T);
    soft(ctx, T.x + u * 0.2, T.y + u * 0.06, u * 0.3, u * 0.07);
    const e = shaft(ctx, T, u * 1.6, 0.4, Math.max(1.6, u * 0.06), '#e8edf2', 0, -p * u * 0.05);
    ball(ctx, e[0], e[1], u * 0.22, T.col, false);
    void o;
  },
};
// scissors: two blades that snip open and shut
TOOLS.scissors = (ctx, S, T) => {
  const u = T.u, p = press(T), open = 0.12 + (1 - p) * 0.28;
  soft(ctx, T.x + u * 0.4, T.y + u * 0.08, u * 0.6, u * 0.09);
  for (const sgn of [-1, 1]) {
    const a = 0.7 + sgn * open;
    rod(ctx, T.x, T.y, T.x + Math.sin(a) * u * 1.3, T.y - Math.cos(a) * u * 1.3, u * 0.14, '#dfe5ea');
    rod(ctx, T.x + Math.sin(a) * u * 1.3, T.y - Math.cos(a) * u * 1.3, T.x + Math.sin(a + sgn * 0.2) * u * 2.1, T.y - Math.cos(a + sgn * 0.2) * u * 2.1, u * 0.3, '#c0392b');
  }
};
export const toolOf = (name) => TOOLS[name] ?? TOOLS.stylus;

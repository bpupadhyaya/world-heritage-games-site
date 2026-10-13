// Scenes, part D: painted and drawn crafts (warli, ndebele, alebrije, khokhloma, truck art, mehndi, tanghua, celtic) and the
// folk floor crafts (kolam, rangoli, paper cut).
import { ENV, SKIN, hash, rgba, mix, shade, roundRectPath, rod, ball, poly, speck, lines, weaveGrid, glow, vignette, TAU, sheenLine, motifPath, isFilled, lineWidthOf } from './scene-kit.js';
import { base, ground, frame, diagLines, tub } from './scene-parts.js';
import { frameAfter, drawStamp } from './art.js';

export const SCENES_D = {
  // warli: rice-paste figures on a mud wall under a thatched eave, drawn with a chewed bamboo twig
  warli: {
    mat: 'paint', pad: 0.08, snd: 'brush', pot: 'pot', tool: ['stylus', { nodes: true, w: 0.13, ball: 0.12, len: 4.4, a: 0.45 }], idle: [0.9, 0.97], place: ['drop', 'paint'],
    card: { paper: '#efe0c4', deco: 'tape' }, btn: { fill: '#3a1a0e', primary: '#f2ead6', primaryText: '#3a1a0e' }, order: ['card', 'board', 'pal'],
    env: (ctx, S) => { ENV.earth(ctx, S, { base: '#7a4a2e' }); const a = S.area; ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let i = 0; i < 14; i++) ctx.fillRect(a.x, a.y + i * a.h / 14, a.w, 1.5); },
    under: (ctx, S) => { // straw thatch along the top and a cow-dung painted border
      const b = S.box, t = Math.max(10, S.cell * 0.7); ctx.fillStyle = '#b8944a'; ctx.fillRect(b.x, b.y, b.w, t);
      ctx.strokeStyle = 'rgba(80,50,10,0.6)'; ctx.lineWidth = 1.4; ctx.beginPath(); for (let x = b.x; x < b.x + b.w; x += 4) { ctx.moveTo(x, b.y); ctx.lineTo(x + (hash(x, 3) - 0.5) * 6, b.y + t); } ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(b.x, b.y + t, b.w, 5);
    },
    base: base.sheet({ blur: 0.6 }), ground: ground.plaster({ a: 0.25 }),
    cell: (ctx, S, d) => SKIN.brushed(ctx, d, { streak: -0.1 }),
  },
  // Ndebele house wall: bold shapes outlined in black on a whitewashed wall, painted with a feather
  ndebele: {
    mat: 'paint', pad: 0.08, snd: 'brush', pot: 'cakes', tool: ['brush', { w: 0.3, body: '#f0e8d8', a: 0.85 }], idle: [0.9, 0.97], place: ['paint', 'drop'],
    card: { paper: '#f6f2e6', deco: 'plain' }, btn: { fill: '#111', primary: '#e0b030' }, order: ['board', 'pal', 'card'],
    env: (ctx, S) => { ENV.earth(ctx, S, { base: '#c9a878' }); const a = S.area; ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(a.x, a.y, a.w, a.h * 0.3); },
    under: (ctx, S) => { const r = S.rect, t = S.cell * 0.45; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = S.cell * 0.9; ctx.shadowOffsetY = S.cell * 0.3; ctx.fillStyle = '#f2ecdc'; ctx.fillRect(r.x - t, r.y - t, r.w + 2 * t, r.h + 2 * t); ctx.restore(); },
    base: undefined, ground: ground.plaster({ a: 0.12 }),
    cell: (ctx, S, d) => SKIN.outline(ctx, d, { line: '#f5f0e0', lw: 0.07 }),
    frame: (ctx, S) => { const r = S.rect; ctx.strokeStyle = '#f2ecdc'; ctx.lineWidth = S.cell * 0.4; ctx.strokeRect(r.x - S.cell * 0.2, r.y - S.cell * 0.2, r.w + S.cell * 0.4, r.h + S.cell * 0.4); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.strokeRect(r.x, r.y, r.w, r.h); },
  },
  // alebrije: carved copal-wood slab with a dark base coat, painted in tiny dots with a stylus
  alebrije: {
    mat: 'paint', pad: 0.1, snd: 'pop', pot: 'pot', tool: ['stylus', { body: '#2a2a2a', w: 0.13, ball: 0.17, len: 3.6, a: 0.5 }], idle: [0.9, 0.97], place: ['drop', 'sparkle'],
    card: { paper: '#f2e0b8', deco: 'tape' }, btn: { fill: '#2a1230', primary: '#f0a030' }, order: ['pal', 'board', 'card'],
    env: (ctx, S) => ENV.wood(ctx, S, { base: '#7a5230', plank: S.cell * 2.2, lampC: '#ffd8a0' }),
    under: (ctx, S) => { const r = S.rect, g = S.cell * 0.55; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = S.cell; ctx.shadowOffsetY = S.cell * 0.4; const gr = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); gr.addColorStop(0, '#d8a868'); gr.addColorStop(1, '#8a5a2a'); ctx.fillStyle = gr; roundRectPath(ctx, r.x - g, r.y - g, r.w + 2 * g, r.h + 2 * g, S.cell * 1.2); ctx.fill(); ctx.restore(); },
    base: undefined, ground: ground.planks({ size: 0.5 }),
    cell: (ctx, S, d) => SKIN.paste(ctx, d, { k: 0.9 }),
    frame: () => {}, clipRect: true,
  },
  // khokhloma: gold and red brushwork on black lacquer, set on a round turned plate
  khokhloma: {
    mat: 'paint', pad: 0.12, snd: 'brush', pot: 'cakes', tool: ['brush', { w: 0.2, body: '#a0602a', a: 0.6 }], idle: [0.9, 0.97], place: ['paint', 'sparkle'],
    card: { paper: '#f0e2c0', deco: 'scroll' }, btn: { fill: '#2a0a0a', primary: '#d8a030' }, order: ['card', 'board', 'pal'],
    env: (ctx, S) => ENV.plain(ctx, S, { base: '#3a0c0a', top: '#6a1a12', light: '#ffa060' }),
    under: (ctx, S) => { const r = S.rect, cx = r.x + r.w / 2, cy = r.y + r.h / 2, R = Math.hypot(r.w, r.h) / 2 + S.cell * 0.6;
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = S.cell * 1.1; ctx.shadowOffsetY = S.cell * 0.4; const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.2, cx, cy, R); g.addColorStop(0, '#d8a040'); g.addColorStop(0.9, '#8a5a1a'); g.addColorStop(1, '#4a2a0a'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill(); ctx.restore();
      ctx.strokeStyle = '#c0392b'; ctx.lineWidth = S.cell * 0.3; ctx.beginPath(); ctx.arc(cx, cy, R - S.cell * 0.2, 0, TAU); ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R - S.cell * 0.45, 0, TAU); ctx.stroke(); },
    base: base.sheet({ blur: 0.3, drop: 0.1, fill: '#0b0807' }), ground: (ctx, S) => { ctx.fillStyle = S.bg; ctx.fillRect(S.rect.x, S.rect.y, S.rect.w, S.rect.h); },
    cell: (ctx, S, d) => SKIN.brushed(ctx, d, { streak: 0.35 }),
    over: (ctx, S) => { const r = S.rect; const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w * 0.8, r.y + r.h); g.addColorStop(0, 'rgba(255,230,160,0.22)'); g.addColorStop(0.35, 'rgba(255,230,160,0)'); g.addColorStop(0.8, 'rgba(255,255,255,0.1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h); },
  },
  // Pakistani truck art: glossy enamel on a steel panel with a chrome border and jingling chains
  truck: {
    mat: 'paint', pad: 0.1, snd: 'brush', pot: 'pot', tool: ['brush', { w: 0.36, body: '#3a6ea5', a: 0.7 }], idle: [0.9, 0.97], place: ['paint', 'sparkle'],
    card: { paper: '#f6ecd0', deco: 'wood' }, btn: { fill: '#1a1a22', primary: '#f0c030' }, order: ['pal', 'board', 'card'], flip: true,
    env: (ctx, S) => { ENV.plain(ctx, S, { base: '#17171a', top: '#3a3a42', light: '#ffd070' }); const a = S.area; ctx.fillStyle = 'rgba(240,200,40,0.5)'; for (let x = a.x - 20; x < a.x + a.w; x += 70) ctx.fillRect(x, a.y + a.h * 0.88, 36, 6); },
    under: (ctx, S) => { // chrome frame, studs and hanging chains
      const r = S.rect, t = S.cell * 0.55, R = { x: r.x - t, y: r.y - t, w: r.w + 2 * t, h: r.h + 2 * t };
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = S.cell; ctx.shadowOffsetY = S.cell * 0.4; const g = ctx.createLinearGradient(R.x, R.y, R.x + R.w, R.y + R.h); g.addColorStop(0, '#f4f6f8'); g.addColorStop(0.3, '#8a929c'); g.addColorStop(0.55, '#e6eaee'); g.addColorStop(1, '#5a626c'); ctx.fillStyle = g; roundRectPath(ctx, R.x, R.y, R.w, R.h, 8); ctx.fill(); ctx.restore();
      for (let x = R.x + t; x < R.x + R.w; x += t * 1.6) { ball(ctx, x, R.y + t / 2, t * 0.2, '#fff', false); ball(ctx, x, R.y + R.h - t / 2, t * 0.2, '#fff', false); }
      ctx.strokeStyle = '#cfd6dc'; ctx.lineWidth = 2; for (let x = R.x + t; x < R.x + R.w; x += t * 1.1) { ctx.beginPath(); ctx.arc(x, R.y + R.h + t * 0.1, t * 0.45, 0, Math.PI); ctx.stroke(); }
    },
    base: undefined, ground: (ctx, S) => { const r = S.rect; ctx.fillStyle = S.bg; ctx.fillRect(r.x, r.y, r.w, r.h); const g = ctx.createLinearGradient(r.x, 0, r.x + r.w, 0); g.addColorStop(0, 'rgba(255,255,255,0.12)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0.1)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h); },
    cell: (ctx, S, d) => SKIN.outline(ctx, d, { line: '#101010', gloss: true, round: true, lw: 0.07 }),
    frame: () => {},
  },
  // mehndi: henna paste piped from a cone onto a palm
  mehndi: {
    mat: 'ink', pad: 0.05, padY: 0.04, snd: 'sugar', pot: 'cone', tool: 'cone', idle: [0.9, 0.97], place: ['drop', 'ring'], gridColor: '#b88a68', gridAlpha: 0.4,
    card: { paper: '#f6e8d4', deco: 'scroll' }, btn: { fill: '#4a1a10', primary: '#e8a02e' }, order: ['card', 'board', 'pal'],
    env: (ctx, S) => { ENV.cloth(ctx, S, { base: '#6a2a1a' }); const a = S.area; ctx.fillStyle = 'rgba(255,170,40,0.35)'; for (let i = 0; i < 28; i++) { const x = a.x + hash(i, 1) * a.w, y = a.y + hash(i, 2) * a.h; ctx.beginPath(); ctx.arc(x, y, 5 + hash(i, 3) * 6, 0, TAU); ctx.fill(); } },
    under: (ctx, S) => { // the palm: fingers above, a wrist below
      const r = S.rect, t = S.cell * 0.5, skin = '#e0b088', fw = (r.w + 2 * t) / 4.3, fl = Math.min(S.cell * 2.4, Math.max(0, r.y - S.box.y + t));
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = S.cell; ctx.shadowOffsetY = S.cell * 0.3;
      ctx.fillStyle = skin; roundRectPath(ctx, r.x - t, r.y - t, r.w + 2 * t, r.h + 2 * t, S.cell * 1.2); ctx.fill();
      for (let k = 0; k < 4; k++) { const x = r.x - t + k * (fw * 1.1) + fw * 0.1; roundRectPath(ctx, x, r.y - t - fl, fw, fl + t * 1.2, fw / 2); ctx.fill(); }
      ctx.restore();
    },
    base: undefined, ground: (ctx, S) => { const r = S.rect; const g = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h); g.addColorStop(0, shade(S.bg, 0.08)); g.addColorStop(1, shade(S.bg, -0.1)); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h); if (!S.lite) { lines(ctx, r, 'h', S.cell * 0.28, '#a06a40', 0.1, 1, 3, 4); lines(ctx, r, 'v', S.cell * 0.5, '#a06a40', 0.06, 1, 5, 6); } },
    cell: (ctx, S, d) => SKIN.paste(ctx, d, { k: 0.75 }),
    frame: () => {}, clipRect: true,
  },
  // tanghua: hot sugar syrup drawn onto a marble slab, set hard by the cold stone
  tanghua: {
    mat: 'ink', pad: 0.1, snd: 'sugar', pot: 'vat', tool: 'ladle', idle: [0.9, 0.97], place: ['drop', 'sparkle'], grid: false,
    card: { paper: '#f6efdc', deco: 'plain' }, btn: { fill: '#3a1a08', primary: '#f0b030' }, order: ['board', 'card', 'pal'],
    env: (ctx, S) => { ENV.wood(ctx, S, { base: '#4a2c14', plank: S.cell * 2, lampC: '#ffb060' }); },
    under: (ctx, S) => { const b = S.box; tub(ctx, b.x + b.w - S.cell * 0.9, b.y + b.h - S.cell * 0.9, S.cell * 0.8, '#d88a2a', '#a0602a'); const f = Math.sin(S.t * 8) * 0.1; ctx.fillStyle = 'rgba(255,140,40,0.7)'; ctx.beginPath(); ctx.ellipse(b.x + b.w - S.cell * 0.9, b.y + b.h - S.cell * 0.2, S.cell * (0.3 + f), S.cell * 0.12, 0, 0, TAU); ctx.fill(); },
    base: base.slab({ top: '#ebe8e0', side: '#a8a49a', thick: 0.3, r: 10 }),
    ground: (ctx, S) => { const r = S.rect; ctx.fillStyle = S.bg; ctx.fillRect(r.x, r.y, r.w, r.h); if (!S.lite) { ctx.strokeStyle = 'rgba(90,100,120,0.18)'; ctx.lineWidth = 1.4; ctx.beginPath(); for (let i = 0; i < 7; i++) { let x = r.x + hash(i, 1) * r.w, y = r.y; ctx.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (hash(i, k + 4) - 0.5) * r.w * 0.2; y += r.h / 6; ctx.lineTo(x, y); } } ctx.stroke(); } },
    cell: (ctx, S, d) => SKIN.paste(ctx, d, { k: 0.8, alpha: 0.95 }),
    frame: () => {},
  },
  // Celtic knotwork: gold and colour interlace on a vellum page, drawn with a quill from small pans of pigment
  celtic: {
    mat: 'weave', pad: 0.09, snd: 'soft', pot: 'cakes', tool: 'quill', idle: [0.9, 0.97], place: ['drop', 'sparkle'], gridColor: '#8a9a80', gridAlpha: 0.4,
    card: { paper: '#e9dcb4', deco: 'scroll', ink: '#2a1a0a' }, btn: { fill: '#10241a', primary: '#d8a840' }, order: ['board', 'card', 'pal'],
    env: (ctx, S) => { ENV.wood(ctx, S, { base: '#3a2a1a', plank: S.cell * 2.4, lampC: '#ffcc80' }); },
    under: (ctx, S) => { const b = S.box; ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(b.x + S.cell * 0.7, b.y + b.h - S.cell * 0.7, S.cell * 0.45, 0, TAU); ctx.fill(); ctx.fillStyle = '#4a5a7a'; ctx.beginPath(); ctx.arc(b.x + S.cell * 0.7, b.y + b.h - S.cell * 0.7, S.cell * 0.3, 0, TAU); ctx.fill(); },
    base: (ctx, S) => base.sheet({ blur: 0.9, drop: 0.3, grow: S.cell * 0.75, fill: '#e2d3a6' })(ctx, S), ground: ground.paper({}),
    cell: (ctx, S, d) => (d.kind === 'knot' ? drawStamp(ctx, 'weave', d.kind, d.x, d.y, d.s, d.col, d.key, d.bg) : SKIN.outline(ctx, d, { line: shade(d.col, -0.6), gloss: true, round: true, lw: 0.05 })),
  },
  // kolam: rice flour pinched out along a swept threshold floor
  kolam: {
    mat: 'powder', pad: 0.08, snd: 'soft', pot: 'heap', tool: 'finger', idle: [0.9, 0.97], place: ['puff', 'ring'], grid: false,
    card: { paper: '#f2ead8', deco: 'plain' }, btn: { fill: '#2a1c14', primary: '#f2ead8', primaryText: '#2a1c14' },
    env: (ctx, S) => { ENV.stone(ctx, S, { base: '#4a3f38', size: S.cell * 3.2 }); const a = S.area; ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 30; i++) ctx.fillRect(a.x + hash(i, 1) * a.w, a.y + hash(i, 2) * a.h, 18, 2); },
    base: base.sheet({ blur: 0.2, drop: 0.05 }),
    ground: (ctx, S) => { const r = S.rect; ctx.fillStyle = S.bg; ctx.fillRect(r.x, r.y, r.w, r.h); if (!S.lite) speck(ctx, r, 300, ['#000', '#fff'], 0.15, 1.6, 3); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); for (let j = 0; j < S.rows; j++) for (let i = 0; i < S.cols; i++) { const x = r.x + (i + 0.5) * S.cell, y = r.y + (j + 0.5) * S.cell; ctx.moveTo(x + 2.2, y); ctx.arc(x, y, Math.max(1.5, S.cell * 0.05), 0, TAU); } ctx.fill(); },
    cell: (ctx, S, d) => SKIN.grain(ctx, d, {}),
    frame: () => {},
  },
  // rangoli: coloured powder poured in a flower on a courtyard floor
  rangoli: {
    mat: 'powder', pad: 0.1, snd: 'soft', pot: 'heap', tool: 'finger', idle: [0.88, 0.97], place: ['puff', 'ring'], grid: false,
    card: { paper: '#f6eedc', deco: 'plain' }, btn: { fill: '#3a1a10', primary: '#f0b030' },
    env: (ctx, S) => { ENV.floorTiles(ctx, S, { c1: '#a89070', c2: '#8a7458', size: S.cell * 1.6 }); },
    base: (ctx, S) => { const B = S.B; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = S.cell * 0.5; ctx.fillStyle = S.bg; ctx.beginPath(); ctx.arc(B.cx, B.cy, B.R, 0, TAU); ctx.fill(); ctx.restore(); },
    ground: (ctx, S) => { const r = S.rect; ctx.fillStyle = S.bg; ctx.fillRect(r.x, r.y, r.w, r.h); if (!S.lite) speck(ctx, r, 360, ['#000', '#fff'], 0.15, 1.6, 7); },
    cell: (ctx, S, d) => SKIN.grain(ctx, d, {}),
    frame: () => {},
  },
  // folded paper cut with scissors on a cutting table
  papercut: {
    mat: 'paint', pad: 0.1, snd: 'soft', pot: 'cakes', tool: 'scissors', idle: [0.9, 0.97], place: ['puff', 'ring'], grid: false,
    card: { paper: '#f6f0e0', deco: 'tape' }, btn: { fill: '#3a1010', primary: '#e8c040' },
    env: (ctx, S) => ENV.cloth(ctx, S, { base: '#1d3a2a' }),
    base: (ctx, S) => { const B = S.B; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = S.cell * 0.8; ctx.shadowOffsetY = S.cell * 0.25; ctx.fillStyle = S.bg; ctx.beginPath(); ctx.arc(B.cx, B.cy, B.R, 0, TAU); ctx.fill(); ctx.restore(); },
    ground: ground.paper({}),
    cell: (ctx, S, d) => SKIN.outline(ctx, d, { line: shade(d.col, -0.4), lw: 0.03, round: true }),
    frame: () => {},
  },
};

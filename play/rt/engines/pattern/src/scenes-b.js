// Scenes, part B: looms (kente, dhaka, lamba, tartan, kuba, carpet, ikat), dye and print (adire, bogolan, adinkra, block printing).
import { ENV, SKIN, hash, rgba, mix, shade, roundRectPath, rod, ball, poly, speck, lines, weaveGrid, glow, vignette, TAU, sheenLine, motifPath, isFilled, lineWidthOf } from './scene-kit.js';
import { base, ground, frame, diagLines, tub } from './scene-parts.js';

const warpStripes = (ctx, S, a = 0.2) => { // warp-faced bands of the palette across the cloth
  const r = S.rect, n = Math.max(3, S.cols), w = r.w / n; ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  for (let i = 0; i < n; i++) { ctx.fillStyle = rgba(S.colors[(i * 3 + 1) % S.colors.length], a); ctx.fillRect(r.x + i * w, r.y, w, r.h); }
  ctx.restore();
};

export const SCENES_B = {
  // narrow strip woven on a heddle loom: weft-faced blocks, hanging heddles, beaten down with a comb
  kente: {
    mat: 'weave', pad: 0.06, padX: 0.07, snd: 'wood', pot: 'skein', tool: ['comb', { body: '#c08a46' }], idle: [0.9, 0.97], place: ['thread', 'puff'],
    card: { paper: '#ead9a6', deco: 'cloth' }, btn: { fill: '#2a1a0e', primary: '#e0a82e' }, order: ['pal', 'board', 'card'],
    env: (ctx, S) => { ENV.earth(ctx, S, { base: '#a2683a' }); ENV.wood(ctx, { ...S, area: { x: S.area.x, y: S.area.y, w: S.area.w, h: S.area.h } }, { base: 'rgba(0,0,0,0)', lamp: false }); },
    under: (ctx, S) => frame.loomH(ctx, S, { wood: '#5a3516', warp: '#f2e6c4', beam: 0.45, heddles: true, weights: true, density: 5 }),
    base: base.sheet(), ground: (ctx, S) => { ground.silk({ density: 5 })(ctx, S); warpStripes(ctx, S, 0.22); },
    cell: (ctx, S, d) => SKIN.threads(ctx, d, { n: 5, dir: 'h', lt: 0.35 }),
  },
  // Dhaka muslin: pale cotton, figures raised by hand with a fine bamboo splint
  dhaka: {
    mat: 'weave', pad: 0.09, snd: 'soft', pot: 'basket', tool: 'splint', idle: [0.88, 0.97], place: ['thread', 'ring'],
    card: { paper: '#f4f0e6', deco: 'clip' }, btn: { fill: '#26211b', primary: '#e8dcc0' }, flip: true,
    env: (ctx, S) => { ENV.plain(ctx, S, { base: '#a9b5ad', top: '#dfe6df' }); ENV.mat(ctx, S, { base: 'rgba(0,0,0,0)' }); weaveGrid(ctx, S.area, 18, '#fff', '#9aa8a0', 0.22); vignette(ctx, S.area, 0.3); },
    under: (ctx, S) => frame.loomH(ctx, S, { wood: '#c9b36a', warp: '#ffffff', beam: 0.38, density: 9, posts: false }),
    base: base.sheet({ blur: 0.7 }), ground: ground.silk({ density: 10, warp: '#ffffff' }),
    cell: (ctx, S, d) => SKIN.threads(ctx, d, { n: 8, dir: 'h', lt: 0.6 }),
  },
  // Malagasy silk lamba: striped warp, reed and weaving sword on a raffia mat
  lamba: {
    mat: 'weave', pad: 0.1, snd: 'thread', pot: 'spool', tool: 'saw', idle: [0.88, 0.97], place: ['thread', 'sparkle'],
    card: { paper: '#e9d3a8', deco: 'pins' }, btn: { fill: '#2a1210', primary: '#d8b04a' }, order: ['board', 'card', 'pal'],
    env: (ctx, S) => { ENV.mat(ctx, S, { base: '#9e4a2a', p: 12 }); glow(ctx, S.area.x + S.area.w * 0.5, S.area.y + S.area.h * 0.3, S.area.w, '#ffd8a0', 0.2); },
    under: (ctx, S) => frame.loomH(ctx, S, { wood: '#4a2a14', warp: '#e8d8b0', beam: 0.5, reed: true, density: 8 }),
    base: base.sheet(), ground: (ctx, S) => { ground.silk({ density: 8 })(ctx, S); const r = S.rect, n = S.cols * 2, w = r.w / n; ctx.save(); for (let i = 0; i < n; i += 2) { ctx.fillStyle = rgba(S.colors[(i / 2) % S.colors.length], 0.2); ctx.fillRect(r.x + i * w, r.y, w, r.h); } ctx.restore(); },
    cell: (ctx, S, d) => SKIN.threads(ctx, d, { n: 6, dir: 'v', lt: 0.55 }),
  },
  // tartan sett: twill-woven bands, the warp stripes in sett order above the cloth
  tartan: {
    mat: 'weave', pad: 0.1, snd: 'wood', pot: 'ball', tool: ['shuttle', { wood: '#7a4a24' }], idle: [0.86, 0.97], place: ['thread', 'puff'],
    card: { paper: '#e6dcc4', deco: 'tape' }, btn: { fill: '#1d2a3a', primary: '#d8b04a' }, flip: true,
    env: (ctx, S) => ENV.hills(ctx, S, { sky: '#5a6a8a', sky2: '#d89a6a' }),
    under: (ctx, S) => {
      const b = S.box, r = S.rect, bw = Math.max(8, S.cell * 0.45), top = b.y + bw * 0.7, bot = b.y + b.h - bw * 0.7, p = Math.max(2.4, S.cell / 5);
      rod(ctx, b.x + bw * 0.6, b.y, b.x + bw * 0.6, b.y + b.h, bw * 0.9, '#3a2a1a'); rod(ctx, b.x + b.w - bw * 0.6, b.y, b.x + b.w - bw * 0.6, b.y + b.h, bw * 0.9, '#3a2a1a');
      ctx.lineWidth = Math.max(1.2, p * 0.4);
      for (let x = r.x, i = 0; x <= r.x + r.w; x += p, i++) { const c = S.colors[Math.floor(i / Math.max(2, S.cell / p * 0.8)) % S.colors.length]; ctx.strokeStyle = rgba(c, 0.9); ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, r.y + 3); ctx.moveTo(x, r.y + r.h - 3); ctx.lineTo(x, bot); ctx.stroke(); }
      rod(ctx, b.x + bw * 0.3, top, b.x + b.w - bw * 0.3, top, bw, '#6a4a26'); rod(ctx, b.x + bw * 0.3, bot, b.x + b.w - bw * 0.3, bot, bw, '#6a4a26');
    },
    base: base.sheet(), ground: ground.silk({ density: 8, weft: '#000' }),
    cell: (ctx, S, d) => SKIN.threads(ctx, d, { n: 6, dir: 'h', lt: 0.25 }),
    over: (ctx, S) => { diagLines(ctx, S.rect, Math.max(3, S.cell / 5), '#000', 0.22, Math.max(1, S.cell * 0.05)); diagLines(ctx, S.rect, Math.max(3, S.cell / 5), '#fff', 0.1, Math.max(0.8, S.cell * 0.025), -1); },
  },
  // Kuba raffia cloth: cut-pile embroidery tufts on a plaited raffia ground
  kuba: {
    mat: 'weave', pad: 0.09, snd: 'soft', pot: 'basket', tool: ['needle', {}], idle: [0.88, 0.97], place: ['puff', 'ring'],
    card: { paper: '#dcc791', deco: 'plain' }, btn: { fill: '#2a2210', primary: '#c8a050' }, order: ['board', 'pal', 'card'],
    env: (ctx, S) => { ENV.mat(ctx, S, { base: '#4a5a28', p: 18 }); glow(ctx, S.area.x + S.area.w * 0.3, S.area.y + S.area.h * 0.2, S.area.w, '#f0e8a0', 0.14); },
    under: (ctx, S) => { const r = S.rect; ctx.save(); for (let k = 0; k < 3; k++) { const x = r.x - S.cell * 0.2 - k * 5, y = r.y + r.h * (0.2 + k * 0.28); ctx.strokeStyle = shade('#d8c07a', -0.1 * k); ctx.lineWidth = S.cell * 0.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x - S.cell, y - S.cell * 0.6, x - S.cell * 1.6, y + S.cell * 0.4, x - S.cell * 2.2, y - S.cell * 0.2); ctx.stroke(); } ctx.restore(); },
    base: base.sheet({ blur: 0.8 }), ground: ground.coarse({ density: 4, a: 0.5 }),
    cell: (ctx, S, d) => SKIN.pile(ctx, d, { n: 5 }),
  },
  // Persian carpet on an upright loom: rows of knots, cut by shears and packed with a comb
  carpet: {
    mat: 'weave', pad: 0.1, snd: 'wood', pot: 'skein', tool: ['comb', { body: '#7a4a24' }], idle: [0.9, 0.97], place: ['puff', 'sparkle'],
    card: { paper: '#e8dcc2', deco: 'scroll' }, btn: { fill: '#2a1210', primary: '#c8a050' }, order: ['card', 'board', 'pal'],
    env: (ctx, S) => ENV.stone(ctx, S, { base: '#5a5048', size: S.cell * 2.6 }),
    under: (ctx, S) => {
      frame.loomH(ctx, S, { wood: '#4a2a12', warp: '#efe6d0', beam: 0.65, density: 8 });
      const r = S.rect; ctx.strokeStyle = 'rgba(240,230,205,0.9)'; ctx.lineWidth = 1.4; ctx.beginPath(); for (let x = r.x; x <= r.x + r.w; x += 5) { ctx.moveTo(x, r.y + r.h); ctx.lineTo(x + (hash(x, 1) - 0.5) * 3, r.y + r.h + S.cell * 0.5); } ctx.stroke();
    },
    base: base.sheet(), ground: ground.coarse({ density: 6, a: 0.3 }),
    cell: (ctx, S, d) => SKIN.pile(ctx, d, { n: 7 }),
  },
  // ikat: resist-tied warp threads dyed before weaving; colour feathers at the tie edges
  ikat: {
    mat: 'dye', pad: 0.1, snd: 'soft', pot: 'vat', tool: 'tie', idle: [0.88, 0.97], place: ['puff', 'ring'],
    card: { paper: '#e9d8b4', deco: 'hem' }, btn: { fill: '#2a1a10', primary: '#d8a040' }, flip: true,
    env: (ctx, S) => { ENV.earth(ctx, S, { base: '#6a4a2e' }); const a = S.area; for (let i = 0; i < 6; i++) { const x = a.x + a.w * (0.1 + i * 0.16); ctx.strokeStyle = rgba(S.colors[i % S.colors.length], 0.7); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x, a.y); ctx.bezierCurveTo(x + 8, a.y + 30, x - 8, a.y + 60, x + 4, a.y + 92); ctx.stroke(); } },
    under: (ctx, S) => frame.loomH(ctx, S, { wood: '#5a3a1a', warp: '#e8dcc0', beam: 0.45, weights: true, density: 7 }),
    base: base.sheet(), ground: ground.silk({ density: 8 }),
    cell: (ctx, S, d) => {
      const { kind, col, x, y, s } = d; ctx.save(); motifPath(ctx, kind, x, y, s); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(col, 0.22); ctx.lineWidth = s * 0.2; ctx.stroke(); ctx.strokeStyle = rgba(col, 0.35); ctx.lineWidth = s * 0.1; ctx.stroke(); ctx.restore();
      SKIN.threads(ctx, d, { n: 6, dir: 'v', lt: 0.35 });
    },
  },
  // adire: cassava paste drawn with a feather on cloth, to be dipped in indigo vats
  adire: {
    mat: 'dye', pad: 0.1, snd: 'brush', pot: 'pot', tool: ['brush', { w: 0.2, body: '#7a5a34', a: 0.55 }], idle: [0.9, 0.97], place: ['drop', 'paint'],
    card: { paper: '#f1ece0', deco: 'tape' }, btn: { fill: '#16224a', primary: '#e8e2d0', primaryText: '#16224a' }, order: ['board', 'card', 'pal'],
    env: (ctx, S) => { ENV.plain(ctx, S, { base: '#c8a06a', top: '#ead9b0' }); speck(ctx, S.area, 500, ['#8a6a3a', '#fff'], 0.18, 2, 9); vignette(ctx, S.area, 0.3); },
    under: (ctx, S) => { const b = S.box; tub(ctx, b.x + S.cell * 0.9, b.y + b.h - S.cell * 0.9, S.cell * 0.85, '#1a2a6a', '#7a5a34'); tub(ctx, b.x + b.w - S.cell * 0.9, b.y + S.cell * 0.9, S.cell * 0.7, '#223a8a', '#7a5a34'); },
    base: base.sheet({ blur: 0.9, drop: 0.2 }), ground: ground.coarse({ density: 5, a: 0.3 }),
    cell: (ctx, S, d) => SKIN.brushed(ctx, d, { crack: true, streak: -0.25 }),
  },
  // bogolan: fermented mud painted with a reed, long strip laid on baked earth
  bogolan: {
    mat: 'dye', pad: 0.08, snd: 'brush', pot: 'pot', tool: ['stylus', { nodes: true, ball: 0.15, w: 0.15, len: 4.6, a: 0.5 }], idle: [0.9, 0.97], place: ['drop', 'puff'],
    card: { paper: '#e9dcc0', deco: 'tape' }, btn: { fill: '#2a1a10', primary: '#c89a58' }, order: ['pal', 'board', 'card'],
    env: (ctx, S) => { ENV.earth(ctx, S, { base: '#a2683a' }); const a = S.area; ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i < 18; i++) { let x = a.x + hash(i, 1) * a.w, y = a.y + hash(i, 2) * a.h; ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (hash(i, k + 3) - 0.5) * 50; y += (hash(i, k + 8) - 0.5) * 50; ctx.lineTo(x, y); } } ctx.stroke(); },
    under: (ctx, S) => { const b = S.box; tub(ctx, b.x + b.w - S.cell * 0.8, b.y + b.h - S.cell * 0.8, S.cell * 0.7, '#2a1a10', '#6a4424'); ball(ctx, b.x + S.cell * 0.8, b.y + b.h - S.cell * 0.7, S.cell * 0.4, '#b08a58'); },
    base: base.sheet({ blur: 0.8 }), ground: ground.coarse({ density: 4.5, a: 0.4 }),
    cell: (ctx, S, d) => SKIN.brushed(ctx, d, { crack: true, streak: -0.35 }),
  },
  // adinkra: calabash stamps inked from a bowl of bark dye, stamped between comb-drawn lines
  adinkra: {
    mat: 'print', pad: 0.08, snd: 'stamp', pot: 'pot', tool: ['block', { round: true, body: '#7a5524', ink: '#111', w: 0.9 }], idle: [0.9, 0.97], place: ['stamp', 'puff'],
    card: { paper: '#ead8b0', deco: 'cloth' }, btn: { fill: '#2a0e0a', primary: '#e0a82e' }, gridSolid: true, gridColor: '#2a1008', gridAlpha: 0.8, flip: true,
    env: (ctx, S) => { ENV.plain(ctx, S, { base: '#3a1812', top: '#6a2a1a', light: '#ffb070' }); weaveGrid(ctx, S.area, 12, '#000', '#fff', 0.08); },
    base: base.sheet({ blur: 1.0 }), ground: ground.coarse({ density: 4.5, a: 0.35 }),
    cell: (ctx, S, d) => SKIN.stamp(ctx, d, { fleck: d.bg }),
  },
  // wood-block printing: carved block pressed on cotton laid over a padded bench
  blockprint: {
    mat: 'print', pad: 0.08, snd: 'stamp', pot: 'pad', tool: ['block', { body: '#c9965a', w: 1.0 }], idle: [0.9, 0.97], place: ['stamp', 'ring'],
    card: { paper: '#f2ead6', deco: 'pins' }, btn: { fill: '#3a2a18', primary: '#d8a040' }, order: ['card', 'pal', 'board'],
    env: (ctx, S) => ENV.wood(ctx, S, { base: '#b08a58', plank: S.cell * 2.2, lampC: '#fff4d0' }),
    under: (ctx, S) => { const r = S.rect, t = S.cell * 0.5; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = S.cell; ctx.shadowOffsetY = S.cell * 0.3; ctx.fillStyle = '#5a6a8a'; ctx.fillRect(r.x - t, r.y - t, r.w + 2 * t, r.h + 2 * t); ctx.restore(); weaveGrid(ctx, { x: r.x - t, y: r.y - t, w: r.w + 2 * t, h: r.h + 2 * t }, 6, '#000', '#fff', 0.15); for (const [px, py] of [[r.x - t / 2, r.y - t / 2], [r.x + r.w + t / 2, r.y - t / 2], [r.x - t / 2, r.y + r.h + t / 2], [r.x + r.w + t / 2, r.y + r.h + t / 2]]) ball(ctx, px, py, t * 0.28, '#d8d8d8', false); },
    base: base.sheet({ blur: 0.2, drop: 0.05 }), ground: ground.coarse({ density: 5, a: 0.3 }),
    cell: (ctx, S, d) => SKIN.stamp(ctx, d, { fleck: d.bg }),
  },
};

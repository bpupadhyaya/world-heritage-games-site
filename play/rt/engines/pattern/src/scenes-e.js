// Scenes, part E: beads, tile, stone and joinery crafts (lukasa, zulu, macau, zellij, mosaic, mashrabiya, kumiko) and the Andean band.
import { ENV, SKIN, hash, rgba, mix, shade, roundRectPath, rod, ball, poly, speck, lines, weaveGrid, glow, vignette, TAU, sheenLine, motifPath, isFilled, lineWidthOf } from './scene-kit.js';
import { base, ground, frame, diagLines, tub } from './scene-parts.js';

export const SCENES_E = {
  // lukasa: a carved wooden memory board studded with beads and shells, read with a finger
  lukasa: {
    mat: 'bead', pad: 0.09, snd: 'bead', pot: 'beads', tool: ['finger', { skin: '#a8703e' }], idle: [0.9, 0.97], place: ['sparkle', 'ring'], grid: false,
    card: { paper: '#d9c49a', deco: 'wood', ink: '#2a1a0a' }, btn: { fill: '#241408', primary: '#d8a040' }, order: ['board', 'pal', 'card'],
    env: (ctx, S) => ENV.earth(ctx, S, { base: '#3a281a' }),
    under: (ctx, S) => { // the board's carved handles and rounded shoulders
      const r = S.rect, g = S.cell * 0.55; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = S.cell; ctx.shadowOffsetY = S.cell * 0.4;
      const gr = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); gr.addColorStop(0, '#9a6a3a'); gr.addColorStop(1, '#4a2a12'); ctx.fillStyle = gr; roundRectPath(ctx, r.x - g, r.y - g, r.w + 2 * g, r.h + 2 * g, S.cell * 1.6); ctx.fill(); ctx.restore();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; for (let i = 0; i < 12; i++) { const x = r.x - g * 0.5 + (r.w + g) * (i / 11); ctx.beginPath(); ctx.moveTo(x, r.y - g * 0.6); ctx.lineTo(x, r.y - g * 0.2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, r.y + r.h + g * 0.2); ctx.lineTo(x, r.y + r.h + g * 0.6); ctx.stroke(); }
    },
    base: undefined, ground: ground.planks({ dir: 'v', size: 0.7 }),
    cell: (ctx, S, d) => SKIN.beads(ctx, d, { r: 0.12 }),
    frame: () => {}, clipRect: true,
  },
  // Zulu beadwork: seed beads stitched in rows to a cloth backing with a fine needle
  zulu: {
    mat: 'bead', pad: 0.1, snd: 'bead', pot: 'beads', tool: 'bead', idle: [0.9, 0.97], place: ['sparkle', 'puff'], grid: false,
    card: { paper: '#efe2c8', deco: 'cloth' }, btn: { fill: '#3a1a10', primary: '#e0b040' }, flip: true,
    env: (ctx, S) => { ENV.cloth(ctx, S, { base: '#7a2a1a' }); const a = S.area; for (let i = 0; i < 36; i++) ball(ctx, a.x + hash(i, 1) * a.w, a.y + hash(i, 2) * a.h, 3.5, S.colors[i % S.colors.length], false); },
    base: base.sheet({ blur: 0.9 }), ground: (ctx, S) => { ground.coarse({ density: 6, a: 0.5 })(ctx, S); },
    cell: (ctx, S, d) => SKIN.beads(ctx, d, { r: 0.075 }),
  },
  // Macau pavement: small stones set in sand with a hammer, white and black limestone in waves
  macau: {
    mat: 'tile', pad: 0.08, snd: 'stone', pot: 'heap', tool: ['hammer', { chisel: false }], idle: [0.9, 0.97], place: ['tile', 'puff'], grid: false,
    card: { paper: '#e8e4d8', deco: 'tape' }, btn: { fill: '#26241e', primary: '#e8e4d0', primaryText: '#26241e' }, order: ['board', 'card', 'pal'],
    env: (ctx, S) => { ENV.stone(ctx, S, { base: '#6a665a', size: S.cell * 1.3 }); },
    under: (ctx, S) => { const r = S.rect, t = S.cell * 0.4; ctx.fillStyle = '#9a968a'; ctx.fillRect(r.x - t, r.y - t, r.w + 2 * t, r.h + 2 * t); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(r.x - t, r.y - t, r.w + 2 * t, 3); },
    base: undefined, ground: (ctx, S) => { const r = S.rect; ctx.fillStyle = S.bg; ctx.fillRect(r.x, r.y, r.w, r.h); if (!S.polar) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); const p = S.cell / 4; for (let x = r.x; x <= r.x + r.w; x += p) ctx.rect(x - 0.6, r.y, 1.2, r.h); for (let y = r.y; y <= r.y + r.h; y += p) ctx.rect(r.x, y - 0.6, r.w, 1.2); ctx.fill(); } },
    cell: (ctx, S, d) => SKIN.cobble(ctx, d, { n: 4, v: 0.1 }),
    frame: () => {}, clipRect: true,
  },
  // zellij: glazed tiles chipped to shape with a chisel and set in a plaster bed
  zellij: {
    mat: 'tile', pad: 0.09, snd: 'tile', pot: 'tile', tool: ['hammer', {}], idle: [0.9, 0.97], place: ['tile', 'sparkle'], grid: false,
    card: { paper: '#efe6d0', deco: 'studs' }, btn: { fill: '#10242a', primary: '#e0b040' }, order: ['pal', 'card', 'board'],
    env: (ctx, S) => ENV.floorTiles(ctx, S, { c1: '#4a6a72', c2: '#35525a', size: S.cell * 1.4 }),
    under: (ctx, S) => { const r = S.rect, t = S.cell * 0.4; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = S.cell; ctx.shadowOffsetY = S.cell * 0.35; ctx.fillStyle = '#d8d0bc'; ctx.fillRect(r.x - t, r.y - t, r.w + 2 * t, r.h + 2 * t); ctx.restore(); },
    base: undefined, ground: (ctx, S) => { const r = S.rect; ctx.fillStyle = '#cfc6b0'; ctx.fillRect(r.x, r.y, r.w, r.h); if (!S.lite) speck(ctx, r, 200, ['#000', '#fff'], 0.1, 1.6, 5); },
    cell: (ctx, S, d) => SKIN.tile(ctx, d, { grout: 'rgba(60,50,35,0.75)' }),
    frame: () => {}, clipRect: true,
  },
  // tessellated mosaic: tiny tesserae of stone pressed into a lime mortar floor with a trowel
  mosaic: {
    mat: 'tile', pad: 0.09, snd: 'stone', pot: 'heap', tool: 'trowel', idle: [0.9, 0.97], place: ['puff', 'tile'], grid: false,
    card: { paper: '#e9dcc2', deco: 'hem' }, btn: { fill: '#2a2418', primary: '#d0a850' }, order: ['board', 'pal', 'card'],
    env: (ctx, S) => ENV.floorTiles(ctx, S, { c1: '#a89a7a', c2: '#8d7e60', size: S.cell * 2.0 }),
    under: (ctx, S) => { const r = S.rect, t = S.cell * 0.5; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = S.cell * 0.9; ctx.shadowOffsetY = S.cell * 0.3; ctx.fillStyle = '#c9bc9a'; ctx.fillRect(r.x - t, r.y - t, r.w + 2 * t, r.h + 2 * t); ctx.restore(); },
    base: undefined, ground: (ctx, S) => { const r = S.rect; ctx.fillStyle = shade(S.bg, -0.15); ctx.fillRect(r.x, r.y, r.w, r.h); if (!S.polar && !S.lite) { const p = S.cell / 5; for (let y = r.y, j = 0; y < r.y + r.h; y += p, j++) for (let x = r.x, i = 0; x < r.x + r.w; x += p, i++) { ctx.fillStyle = shade(S.bg, (hash(i, j, 2) - 0.5) * 0.25); ctx.fillRect(x + 0.7, y + 0.7, p - 1.4, p - 1.4); } } },
    cell: (ctx, S, d) => SKIN.cobble(ctx, d, { n: 6, v: 0.3, joint: 'rgba(70,60,40,0.8)' }),
    frame: () => {}, clipRect: true,
  },
  // mashrabiya: turned walnut spindles pegged into a window screen that throws patterned sun on the wall
  mashrabiya: {
    mat: 'wood', pad: 0.1, snd: 'wood', pot: 'sticks', tool: 'peg', idle: [0.9, 0.97], place: ['puff', 'sparkle'], grid: false,
    card: { paper: '#efe2c6', deco: 'wood' }, btn: { fill: '#2a1a0c', primary: '#d8a850' }, order: ['card', 'board', 'pal'],
    env: (ctx, S) => { ENV.plain(ctx, S, { base: '#a07a4a', top: '#e8d4a8', light: '#fff0c0' }); const a = S.area; ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = '#fff2c0'; for (let i = -2; i < 8; i++) { ctx.beginPath(); ctx.moveTo(a.x + i * a.w / 6, a.y); ctx.lineTo(a.x + (i + 0.5) * a.w / 6, a.y); ctx.lineTo(a.x + (i - 1) * a.w / 6, a.y + a.h); ctx.lineTo(a.x + (i - 1.5) * a.w / 6, a.y + a.h); ctx.fill(); } ctx.restore(); },
    under: (ctx, S) => { // dark walnut window frame with a pointed arch
      const r = S.rect, t = S.cell * 0.6, R = { x: r.x - t, y: r.y - t, w: r.w + 2 * t, h: r.h + 2 * t };
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = S.cell; ctx.shadowOffsetY = S.cell * 0.3;
      const g = ctx.createLinearGradient(R.x, 0, R.x + R.w, 0); g.addColorStop(0, '#5a3a1c'); g.addColorStop(0.5, '#8a5e30'); g.addColorStop(1, '#4a2e14'); ctx.fillStyle = g; roundRectPath(ctx, R.x, R.y, R.w, R.h, S.cell * 0.5); ctx.fill(); ctx.restore();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.strokeRect(R.x + t * 0.3, R.y + t * 0.3, R.w - t * 0.6, R.h - t * 0.6);
    },
    base: undefined, ground: (ctx, S) => { const r = S.rect; ctx.fillStyle = S.bg; ctx.fillRect(r.x, r.y, r.w, r.h); const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,240,190,0.25)'); g.addColorStop(1, 'rgba(255,240,190,0)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h); },
    cell: (ctx, S, d) => SKIN.wood(ctx, d, { cap: 'round' }),
    frame: () => {}, clipRect: true,
  },
  // kumiko: slim cedar strips grooved and jointed into a lattice, cut with a fine saw
  kumiko: {
    mat: 'wood', pad: 0.09, snd: 'wood', pot: 'sticks', tool: 'saw', idle: [0.9, 0.97], place: ['puff', 'ring'], grid: false,
    card: { paper: '#f2ecde', deco: 'plain' }, btn: { fill: '#1c1810', primary: '#d8c090', primaryText: '#1c1810' }, order: ['pal', 'board', 'card'],
    env: (ctx, S) => { ENV.paper(ctx, S, { base: '#e6e0d0' }); const a = S.area; ctx.strokeStyle = 'rgba(80,60,30,0.35)'; ctx.lineWidth = 2; for (let x = a.x + a.w * 0.12; x < a.x + a.w; x += a.w * 0.38) { ctx.beginPath(); ctx.moveTo(x, a.y); ctx.lineTo(x, a.y + a.h); ctx.stroke(); } },
    under: (ctx, S) => { const r = S.rect, t = S.cell * 0.55; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = S.cell * 0.9; ctx.shadowOffsetY = S.cell * 0.3; const g = ctx.createLinearGradient(r.x, 0, r.x + r.w, 0); g.addColorStop(0, '#c8a46a'); g.addColorStop(1, '#a07840'); ctx.fillStyle = g; ctx.fillRect(r.x - t, r.y - t, r.w + 2 * t, r.h + 2 * t); ctx.restore(); },
    base: undefined, ground: (ctx, S) => { const r = S.rect; ctx.fillStyle = S.bg; ctx.fillRect(r.x, r.y, r.w, r.h); if (!S.lite) { lines(ctx, r, 'h', S.cell * 0.4, '#fff', 0.04, 1, 2, 3); } },
    cell: (ctx, S, d) => SKIN.wood(ctx, d, { cap: 'butt' }),
    frame: () => {}, clipRect: true,
  },
  // Andean woven band on a backstrap loom tied to a post
  andean: {
    mat: 'weave', pad: 0.1, snd: 'thread', pot: 'skein', tool: 'splint', idle: [0.88, 0.97], place: ['thread', 'puff'],
    card: { paper: '#ead8b0', deco: 'hem' }, btn: { fill: '#2a1210', primary: '#e0a030' },
    env: (ctx, S) => { ENV.earth(ctx, S, { base: '#8a6a44' }); glow(ctx, S.area.x + S.area.w * 0.5, S.area.y, S.area.w, '#fff0c0', 0.2); },
    under: (ctx, S) => frame.loomH(ctx, S, { wood: '#6a4a24', warp: '#f0e0c0', beam: 0.35, posts: false, density: 7 }),
    base: base.sheet(), ground: ground.silk({ density: 7 }),
    cell: (ctx, S, d) => SKIN.threads(ctx, d, { n: 6, dir: 'v', lt: 0.45 }),
  },
};

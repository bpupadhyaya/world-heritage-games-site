// Scenes, part C: embroidery and thread crafts (cross-stitch, tatreez, phulkari, suzani, sashiko, nordic knitting, temari, nanduti).
import { ENV, SKIN, hash, rgba, mix, shade, roundRectPath, rod, ball, poly, speck, lines, weaveGrid, glow, vignette, TAU, sheenLine, motifPath, isFilled, lineWidthOf } from './scene-kit.js';
import { base, ground, frame, diagLines, tub } from './scene-parts.js';
import { frameAfter } from './art.js';

const scissors = (ctx, x, y, u) => { // a pair of embroidery scissors lying on the table
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.5); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-u * 0.2, u * 0.12, u * 2, u * 0.3);
  rod(ctx, 0, 0, u * 1.9, -u * 0.1, u * 0.14, '#dfe5ea'); rod(ctx, 0, u * 0.05, u * 1.9, u * 0.22, u * 0.12, '#bfc7ce');
  ctx.strokeStyle = '#c9a050'; ctx.lineWidth = u * 0.1; ctx.beginPath(); ctx.ellipse(-u * 0.25, -u * 0.12, u * 0.25, u * 0.2, 0, 0, TAU); ctx.ellipse(-u * 0.25, u * 0.25, u * 0.25, u * 0.2, 0, 0, TAU); ctx.stroke(); ctx.restore();
};

export const SCENES_C = {
  // counted cross-stitch on aida, floss cards, scissors and thimble on the table
  crossstitch: {
    mat: 'stitch', pad: 0.1, snd: 'soft', pot: 'card', tool: 'needle', idle: [0.88, 0.97], place: ['thread', 'ring'], gridColor: '#8a98a8', gridAlpha: 0.5,
    card: { paper: '#f4f4ee', deco: 'pins', ink: '#22304a', sub: '#4a5a72', cap: '#3a4a66', label: 'CHART' }, btn: { fill: '#2a3a52', primary: '#e8c46a' }, order: ['pal', 'card', 'board'],
    env: (ctx, S) => { ENV.wood(ctx, S, { base: '#d8c8a2', plank: S.cell * 2.0, lampC: '#fffbe8' }); },
    under: (ctx, S) => { const b = S.box; scissors(ctx, b.x + S.cell * 0.6, b.y + b.h - S.cell * 0.5, S.cell * 0.95); ball(ctx, b.x + b.w - S.cell * 0.5, b.y + S.cell * 0.55, S.cell * 0.28, '#c9a050'); },
    base: base.sheet({ blur: 0.8 }), ground: ground.aida({ n: 4 }),
    cell: (ctx, S, d) => SKIN.cross(ctx, d, { n: 4, w: 0.3 }),
  },
  // tatreez: bold cross-stitch on dark linen held in a wooden hoop
  tatreez: {
    mat: 'stitch', pad: 0.1, snd: 'soft', pot: 'ball', tool: 'needle', idle: [0.9, 0.97], place: ['thread', 'puff'], gridColor: '#6a6a78', gridAlpha: 0.5,
    card: { paper: '#e8dcc6', deco: 'hem' }, btn: { fill: '#2a1218', primary: '#c8453a' }, flip: true,
    env: (ctx, S) => ENV.cloth(ctx, S, { base: '#4a2a28' }),
    base: undefined, ground: ground.coarse({ density: 4.5, a: 0.5 }),
    cell: (ctx, S, d) => SKIN.cross(ctx, d, { n: 3, w: 0.36 }),
    frame: (ctx, S) => frameAfter(ctx, 'stitch', S.rect, S.fd, S.polar, S.bg, S.pal.accent, S.cell),
  },
  // phulkari: long darning stitches in silk floss on coarse cotton, worked on a rope cot
  phulkari: {
    mat: 'weave', pad: 0.1, snd: 'thread', pot: 'skein', tool: ['needle', {}], idle: [0.9, 0.97], place: ['thread', 'sparkle'],
    card: { paper: '#ecd8b2', deco: 'cloth' }, btn: { fill: '#3a1a10', primary: '#e8a02e' }, order: ['board', 'pal', 'card'],
    env: (ctx, S) => ENV.rope(ctx, S, { base: '#a9845a', p: Math.max(14, S.cell * 0.5) }),
    base: base.sheet({ blur: 1.2 }), ground: ground.coarse({ density: 4, a: 0.5 }),
    cell: (ctx, S, d) => SKIN.threads(ctx, d, { n: 7, dir: 'h', lt: 0.7 }),
  },
  // suzani: couched silk on a large cotton panel stretched on a stand, worked with a tambour hook
  suzani: {
    mat: 'stitch', pad: 0.12, snd: 'thread', pot: 'basket', tool: 'hook', idle: [0.9, 0.97], place: ['thread', 'ring'],
    card: { paper: '#efe4cc', deco: 'scroll' }, btn: { fill: '#10343a', primary: '#e0a040' }, order: ['card', 'board', 'pal'],
    env: (ctx, S) => ENV.floorTiles(ctx, S, { c1: '#1d5a6a', c2: '#2a7a8a', size: S.cell * 1.5 }),
    under: (ctx, S) => frame.stretcher(ctx, S, { wood: '#8a5a2e', ties: 7, tie: '#e8e0c8', t: 0.5 }),
    base: base.sheet({ blur: 0.15, drop: 0.05 }), ground: ground.coarse({ density: 5, a: 0.3 }),
    cell: (ctx, S, d) => SKIN.threads(ctx, d, { n: 6, dir: 'v', lt: 0.6 }),
    frame: () => {},
  },
  // sashiko: white running stitches on indigo, long needle with a thimble ring
  sashiko: {
    mat: 'stitch', pad: 0.09, snd: 'thread', pot: 'spool', tool: ['needle', { thimble: true }], idle: [0.9, 0.97], place: ['thread', 'ring'], gridColor: '#ffffff', gridAlpha: 0.35,
    card: { paper: '#efeadb', deco: 'tape' }, btn: { fill: '#12234a', primary: '#f0ece0', primaryText: '#12234a' }, order: ['board', 'card', 'pal'],
    env: (ctx, S) => ENV.wood(ctx, S, { base: '#9a7a52', plank: S.cell * 2.4, lampC: '#fff0c8' }),
    under: (ctx, S) => { const r = S.rect; ctx.save(); ctx.translate(0, 0); ctx.fillStyle = shade(S.bg, -0.25); ctx.fillRect(r.x - S.cell * 0.15, r.y - S.cell * 0.15, r.w + S.cell * 0.3, r.h + S.cell * 0.3); ctx.restore(); },
    base: base.sheet({ blur: 0.7 }), ground: ground.coarse({ density: 5, a: 0.4 }),
    cell: (ctx, S, d) => SKIN.running(ctx, d, { w: 0.075 }),
    frame: (ctx, S) => { const r = S.rect; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.4; ctx.strokeRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8); ctx.setLineDash([]); ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.5; ctx.strokeRect(r.x, r.y, r.w, r.h); },
  },
  // Nordic colourwork: a round knitted yoke with stranded stars, needles and wool
  nordic: {
    mat: 'weave', pad: 0.08, snd: 'soft', pot: 'ball', tool: 'knit', idle: [0.88, 0.96], place: ['puff', 'ring'], grid: false,
    card: { paper: '#e6e2d6', deco: 'cloth' }, btn: { fill: '#1c2236', primary: '#e8e0c8', primaryText: '#1c2236' }, order: ['card', 'pal', 'board'],
    env: (ctx, S) => { ENV.wood(ctx, S, { base: '#5a4026', plank: S.cell * 2.2, lampC: '#ffcc80' }); },
    base: (ctx, S) => { const B = S.B; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = S.cell * 1.2; ctx.shadowOffsetY = S.cell * 0.4; ctx.fillStyle = S.bg; ctx.beginPath(); ctx.arc(B.cx, B.cy, B.R + S.cell * 0.55, 0, TAU); ctx.fill(); ctx.restore(); },
    ground: (ctx, S) => { // knitted rows as concentric rings
      const B = S.B; ctx.fillStyle = S.bg; ctx.fillRect(S.rect.x, S.rect.y, S.rect.w, S.rect.h); ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1.2;
      for (let r = B.R0; r < B.R; r += S.cell * 0.2) { ctx.beginPath(); ctx.arc(B.cx, B.cy, r, 0, TAU); ctx.stroke(); }
    },
    cell: (ctx, S, d) => SKIN.knit(ctx, d, { n: 4 }),
    frame: (ctx, S) => { // ribbed neckband round the hub and a rolled hem at the rim
      const B = S.B; ctx.save(); ctx.lineWidth = S.cell * 0.5; ctx.strokeStyle = shade(S.bg, 0.2); ctx.beginPath(); ctx.arc(B.cx, B.cy, B.R + S.cell * 0.28, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let a = 0; a < TAU; a += 0.09) { ctx.moveTo(B.cx + Math.cos(a) * (B.R + 2), B.cy + Math.sin(a) * (B.R + 2)); ctx.lineTo(B.cx + Math.cos(a) * (B.R + S.cell * 0.55), B.cy + Math.sin(a) * (B.R + S.cell * 0.55)); } ctx.stroke();
      ctx.fillStyle = '#15110d'; ctx.beginPath(); ctx.arc(B.cx, B.cy, B.R0 * 0.9, 0, TAU); ctx.fill(); ctx.strokeStyle = shade(S.bg, 0.25); ctx.lineWidth = S.cell * 0.25; ctx.stroke(); ctx.restore();
    },
  },
  // temari: a thread ball held in the palm, wrapped and pinned
  temari: {
    mat: 'stitch', pad: 0.12, snd: 'soft', pot: 'skein', tool: 'pin', idle: [0.86, 0.96], place: ['thread', 'sparkle'], grid: false,
    card: { paper: '#f1e4d6', deco: 'hem' }, btn: { fill: '#2a1a30', primary: '#e8a0b0', primaryText: '#2a1020' }, flip: true,
    env: (ctx, S) => { ENV.plain(ctx, S, { base: '#241830', top: '#4a3258', light: '#ffc8e0' }); const a = S.area; ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1; for (let i = 0; i < 30; i++) { ctx.beginPath(); ctx.arc(a.x + a.w / 2, a.y + a.h / 2, 20 + i * 26, 0, TAU); ctx.stroke(); } },
    under: (ctx, S) => { // an open palm under the ball, fingers curling up the sides
      const B = S.B, R = B.R, skin = '#d8a27a';
      const lim = (x0, y0, x1, y1, w) => { rod(ctx, x0, y0, x1, y1, w, skin); };
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = R * 0.2; ctx.shadowOffsetY = R * 0.08;
      ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(B.cx, B.cy + R * 0.82, R * 1.15, R * 0.62, 0, 0, TAU); ctx.fill(); ctx.restore();
      const g = ctx.createLinearGradient(B.cx - R, B.cy + R * 0.3, B.cx + R, B.cy + R * 1.4); g.addColorStop(0, shade(skin, 0.25)); g.addColorStop(1, shade(skin, -0.3)); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(B.cx, B.cy + R * 0.82, R * 1.15, R * 0.62, 0, 0, TAU); ctx.fill();
      lim(B.cx - R * 0.95, B.cy + R * 0.5, B.cx - R * 1.12, B.cy - R * 0.1, R * 0.26); lim(B.cx - R * 0.62, B.cy + R * 0.55, B.cx - R * 0.78, B.cy - R * 0.35, R * 0.24);
      lim(B.cx + R * 0.95, B.cy + R * 0.5, B.cx + R * 1.1, B.cy - R * 0.05, R * 0.26); lim(B.cx + R * 0.62, B.cy + R * 0.58, B.cx + R * 0.76, B.cy - R * 0.28, R * 0.24);
    },
    base: (ctx, S) => { const B = S.B; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = S.cell * 0.9; ctx.shadowOffsetY = S.cell * 0.3; ctx.fillStyle = S.bg; ctx.beginPath(); ctx.arc(B.cx, B.cy, B.R, 0, TAU); ctx.fill(); ctx.restore(); },
    ground: (ctx, S) => { // wound thread on the sphere: great circles
      const B = S.B; ctx.fillStyle = S.bg; ctx.fillRect(S.rect.x, S.rect.y, S.rect.w, S.rect.h); ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1.2;
      for (let k = 0; k < 24; k++) { ctx.beginPath(); ctx.ellipse(B.cx, B.cy, B.R, B.R * Math.abs(Math.cos((k / 24) * Math.PI)) + 0.5, (k * 0.9) % Math.PI, 0, TAU); ctx.stroke(); }
    },
    cell: (ctx, S, d) => SKIN.threads(ctx, d, { n: 6, dir: 'd', lt: 0.5 }),
    over: (ctx, S) => { // sphere shading
      const B = S.B; const g = ctx.createRadialGradient(B.cx - B.R * 0.38, B.cy - B.R * 0.42, B.R * 0.08, B.cx, B.cy, B.R * 1.02); g.addColorStop(0, 'rgba(255,255,255,0.28)'); g.addColorStop(0.45, 'rgba(255,255,255,0)'); g.addColorStop(0.8, 'rgba(0,0,0,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = g; ctx.fillRect(S.rect.x, S.rect.y, S.rect.w, S.rect.h);
    },
    frame: (ctx, S) => { const B = S.B; ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.arc(B.cx, B.cy, B.R0 * 0.55, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.stroke(); },
  },
  // ñandutí: spider-web lace worked on radial threads pinned to a card, over a dark cloth
  nanduti: {
    mat: 'stitch', pad: 0.1, snd: 'thread', pot: 'spool', tool: 'needle', idle: [0.9, 0.96], place: ['thread', 'sparkle'], grid: false,
    card: { paper: '#efe8d8', deco: 'pins' }, btn: { fill: '#10162a', primary: '#e8e2d0', primaryText: '#10162a' }, order: ['pal', 'card', 'board'],
    env: (ctx, S) => ENV.wood(ctx, S, { base: '#2a1c12', plank: S.cell * 2.0, lampC: '#ffc890' }),
    base: (ctx, S) => { const B = S.B; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = S.cell * 1.1; ctx.shadowOffsetY = S.cell * 0.35; ctx.fillStyle = S.bg; ctx.beginPath(); ctx.arc(B.cx, B.cy, B.R + S.cell * 0.4, 0, TAU); ctx.fill(); ctx.restore(); },
    ground: (ctx, S) => { // radial warp threads from the hub to the pins
      const B = S.B; ctx.fillStyle = S.bg; ctx.fillRect(S.rect.x, S.rect.y, S.rect.w, S.rect.h); ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let k = 0; k < S.cols * 2; k++) { const a = (k / (S.cols * 2)) * TAU; ctx.moveTo(B.cx + Math.cos(a) * B.R0, B.cy + Math.sin(a) * B.R0); ctx.lineTo(B.cx + Math.cos(a) * B.R, B.cy + Math.sin(a) * B.R); } ctx.stroke();
    },
    cell: (ctx, S, d) => SKIN.threads(ctx, d, { n: 5, dir: 'd', lt: 0.55 }),
    frame: (ctx, S) => { const B = S.B; const n = S.cols * 2; for (let k = 0; k < n; k++) { const a = (k / n) * TAU - Math.PI / 2, x = B.cx + Math.cos(a) * (B.R + S.cell * 0.22), y = B.cy + Math.sin(a) * (B.R + S.cell * 0.22); ball(ctx, x, y, Math.max(2.5, S.cell * 0.14), k % 4 ? '#e8e2d0' : '#c8453a', false); } ctx.fillStyle = '#e8e2d0'; ctx.beginPath(); ctx.arc(B.cx, B.cy, B.R0 * 0.8, 0, TAU); ctx.fill(); },
  },
};

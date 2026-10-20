// Scenes, part F (1.8.0): weaving, felt and dyed-cloth crafts that had no scene of their own: Kyrgyz felt, Turkmen carpet, Kashmiri kani
// shawl, Amazigh kilim, Bedouin ground loom, toquilla straw, Lao silk brocade, Basotho blanket, Korean patchwork wrap, tie-resist dyeing.
// Registered through the scene registry (scene-registry.js); no human figures, no religious symbols, text-free art.
import { ENV, SKIN, hash, rgba, mix, shade, roundRectPath, rod, ball, poly, speck, lines, weaveGrid, glow, vignette, TAU, sheenLine } from './scene-kit.js';
import { base, ground, frame, tub } from './scene-parts.js';
import { registerSceneSet } from './scene-registry.js';
import './scene-x.js';
import { plaitDisc } from './scene-craft.js';
import { bandhaniEnv, bandhaniGround, bandhaniOver, bandhaniSkin } from './scene-z.js';
import { TOQ_TILT, toquillaEnv, toquillaUnder, toquillaBase, toquillaGround, toquillaOver, toquillaFrame, toquillaSkin } from './scene-y.js';
void plaitDisc;

const fringe = (ctx, x0, x1, y, dir, len, c, seed) => { // warp ends hanging beyond the work
  ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = 1.3; ctx.beginPath();
  for (let x = x0; x <= x1; x += 3.2) { const l = len * (0.75 + hash(seed, x | 0) * 0.45); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + (hash(seed, x | 0, 2) - 0.5) * 6, y + dir * l * 0.5, x + (hash(seed, x | 0, 3) - 0.5) * 9, y + dir * l); }
  ctx.strokeStyle = rgba(c, 0.9); ctx.stroke(); ctx.restore();
};
const sunShaft = (ctx, a, c, al, x0, w) => { ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(a.x + a.w * x0, a.y); ctx.lineTo(a.x + a.w * (x0 + w), a.y); ctx.lineTo(a.x + a.w * (x0 + w - 0.35), a.y + a.h); ctx.lineTo(a.x + a.w * (x0 - 0.35), a.y + a.h); ctx.fill(); ctx.restore(); };
const posts = (ctx, S, wood, k = 0.5) => { const b = S.box, w = Math.max(8, S.cell * k); rod(ctx, b.x + w * 0.5, b.y, b.x + w * 0.5, b.y + b.h, w, wood); rod(ctx, b.x + b.w - w * 0.5, b.y, b.x + b.w - w * 0.5, b.y + b.h, w, wood); return w; };

const SCENES = {
  // Kyrgyz felt carpet: dyed wool felt in mirrored positive and negative shapes, cut with shears and sewn with a cord
  shyrdak: {
    mat: 'weave', pad: 0.13, snd: 'soft', pot: 'felt', tool: 'scissors', idle: [0.88, 0.96], place: ['puff', 'ring'], grid: false, light: 0.6,
    card: { paper: '#eee3c9', deco: 'cloth', ink: '#3a1e12', label: 'PATTERN' }, btn: { fill: '#2a1810', primary: '#d6a044' },
    env: (ctx, S) => { // the yurt floor: a woven reed mat under a low trellis wall
      ENV.mat(ctx, S, { base: '#a98450', p: Math.max(10, S.cell * 0.55) }); const a = S.area;
      ctx.save(); ctx.beginPath(); ctx.rect(a.x - 12, a.y, a.w + 24, a.h * 0.16); ctx.clip(); ctx.fillStyle = '#4a3220'; ctx.fillRect(a.x - 12, a.y, a.w + 24, a.h * 0.16);
      ctx.strokeStyle = '#c9a56a'; ctx.lineWidth = Math.max(2, S.cell * 0.12); const st = S.cell * 1.1; ctx.beginPath(); for (let x = a.x - st * 2; x < a.x + a.w + st * 2; x += st) { ctx.moveTo(x, a.y); ctx.lineTo(x + st * 1.3, a.y + a.h * 0.16); ctx.moveTo(x + st * 1.3, a.y); ctx.lineTo(x, a.y + a.h * 0.16); } ctx.stroke(); ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(a.x - 12, a.y + a.h * 0.16, a.w + 24, 6);
      for (let k = 0; k < 9; k++) { const x = a.x + hash(k, 5) * a.w, y = a.y + a.h * (0.2 + hash(k, 6) * 0.78); ctx.fillStyle = rgba(['#c0392b', '#2a5a9a', '#e8e0c8'][k % 3], 0.6); ctx.beginPath(); ctx.ellipse(x, y, S.cell * 0.4, S.cell * 0.16, hash(k, 7) * 3, 0, TAU); ctx.fill(); }
    },
    under: (ctx, S) => { // the underlay felt, a second colour showing around the cut-out top layer, scalloped
      const r = S.rect, t = S.cell * 0.55, R = { x: r.x - t, y: r.y - t, w: r.w + 2 * t, h: r.h + 2 * t };
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = S.cell * 1.2; ctx.shadowOffsetY = S.cell * 0.4; ctx.fillStyle = shade(S.colors[1] ?? '#a03020', -0.1); roundRectPath(ctx, R.x, R.y, R.w, R.h, S.cell * 0.2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip(); for (let k = 0; k < 140; k++) { ctx.strokeStyle = rgba(hash(k, 1) > 0.5 ? '#fff' : '#000', 0.12); ctx.lineWidth = 1; const x = R.x + hash(k, 2) * R.w, y = R.y + hash(k, 3) * R.h, an = hash(k, 4) * TAU; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(an) * 6, y + Math.sin(an) * 6); ctx.stroke(); } ctx.restore();
      ctx.strokeStyle = 'rgba(240,226,190,0.8)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.6; ctx.strokeRect(R.x + t * 0.3, R.y + t * 0.3, R.w - t * 0.6, R.h - t * 0.6); ctx.setLineDash([]);
    },
    base: base.sheet({ blur: 0.4, drop: 0.12 }),
    ground: (ctx, S) => { const r = S.rect; ctx.fillStyle = S.bg; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 160; i++) ctx.fillRect(r.x + hash(i, 1) * r.w, r.y + hash(i, 2) * r.h, 2.5, 1.2); const g = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h); g.addColorStop(0, 'rgba(255,255,255,0.1)'); g.addColorStop(1, 'rgba(0,0,0,0.15)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h); },
    cell: (ctx, S, d) => SKIN.felt(ctx, d, { cord: '#f2e8c8' }),
    frame: () => {},
  },
  // Turkmen carpet: dense wool pile knotted with a hook-knife, octagonal gul medallions, long warp fringe, lit by the tent lamp
  gul: {
    mat: 'weave', pad: 0.12, snd: 'thread', pot: 'hank', tool: 'knotknife', idle: [0.9, 0.97], place: ['thread', 'puff'], light: 0.8,
    card: { paper: '#e8d6b2', deco: 'studs', ink: '#3a120c', label: 'GUL CHART' }, btn: { fill: '#2a0d0a', primary: '#d8a850' },
    env: (ctx, S) => {
      ENV.plain(ctx, S, { base: '#150b08', top: '#46261a', light: '#ffb060' }); const a = S.area;
      ctx.save(); ctx.strokeStyle = 'rgba(210,150,80,0.12)'; ctx.lineWidth = 2; const st = S.cell * 1.7; ctx.beginPath(); for (let x = a.x - st * 3; x < a.x + a.w + st; x += st) { ctx.moveTo(x, a.y); ctx.lineTo(x + a.h * 0.5, a.y + a.h); ctx.moveTo(x + a.h * 0.5, a.y); ctx.lineTo(x, a.y + a.h); } ctx.stroke(); ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(a.x - 12, a.y, a.w + 24, a.h);
      glow(ctx, a.x + a.w * 0.5, a.y + a.h * 0.45, Math.max(a.w, a.h) * 0.75, '#ffb060', 0.28);
    },
    under: (ctx, S) => { // plaited skirt border bands in the carpet's own dark red and ivory, fringe beyond
      const r = S.rect, t = S.cell * 0.6, R = { x: r.x - t, y: r.y - t, w: r.w + 2 * t, h: r.h + 2 * t };
      fringe(ctx, R.x + 2, R.x + R.w - 2, R.y + 3, -1, S.cell * 1.0, '#e8dcc0', 11); fringe(ctx, R.x + 2, R.x + R.w - 2, R.y + R.h - 3, 1, S.cell * 1.0, '#e8dcc0', 12);
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = S.cell; ctx.shadowOffsetY = S.cell * 0.3; ctx.fillStyle = '#4a0e0a'; ctx.fillRect(R.x, R.y, R.w, R.h); ctx.restore();
      ctx.fillStyle = '#e8dcc0'; for (let x = R.x + t * 0.3; x < R.x + R.w - t * 0.2; x += t * 0.55) { ctx.fillRect(x, R.y + t * 0.3, t * 0.28, t * 0.28); ctx.fillRect(x, R.y + R.h - t * 0.58, t * 0.28, t * 0.28); }
      for (let y = R.y + t * 0.3; y < R.y + R.h - t * 0.2; y += t * 0.55) { ctx.fillRect(R.x + t * 0.3, y, t * 0.28, t * 0.28); ctx.fillRect(R.x + R.w - t * 0.58, y, t * 0.28, t * 0.28); }
      ctx.strokeStyle = 'rgba(240,200,120,0.55)'; ctx.lineWidth = 1.2; ctx.strokeRect(R.x + t * 0.8, R.y + t * 0.8, R.w - t * 1.6, R.h - t * 1.6);
    },
    base: () => {}, ground: (ctx, S) => { const r = S.rect; ctx.fillStyle = S.bg; ctx.fillRect(r.x, r.y, r.w, r.h); lines(ctx, r, 'h', Math.max(2, S.cell / 9), '#000', 0.22, 1, 0.4, 4); lines(ctx, r, 'v', Math.max(2, S.cell / 9), '#fff', 0.05, 1, 0.4, 6); },
    cell: (ctx, S, d) => SKIN.pile(ctx, d, { n: 8 }),
    frame: () => {}, clipRect: true,
  },
  // Kashmiri kani shawl: twill tapestry woven with many small spool bobbins, the talim chart read row by row above the cloth
  kani: {
    mat: 'weave', pad: 0.16, snd: 'wood', pot: 'bobbinpot', tool: 'kanispool', idle: [0.9, 0.97], place: ['thread', 'sparkle'], light: 0.9,
    card: { paper: '#e9dcc0', deco: 'pins', ink: '#3a2412', label: 'TALIM' }, btn: { fill: '#1e1410', primary: '#d89a50' },
    env: (ctx, S) => { ENV.wood(ctx, S, { base: '#2a1a10', plank: S.cell * 2.2, lampC: '#ffc480', lx: 0.3, ly: 0.2 }); },
    under: (ctx, S) => {
      frame.loomH(ctx, S, { wood: '#5a381c', warp: '#e6dcc6', beam: 0.46, density: 9, heddles: true });
      const r = S.rect, b = S.box, w = r.w, h = Math.max(10, S.cell * 0.42), y = b.y + Math.max(2, (r.y - b.y) * 0.1), n = Math.max(12, Math.round(w / (h * 0.9)));
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3; ctx.fillStyle = '#efe4c8'; ctx.fillRect(r.x, y, w, h); ctx.restore();
      for (let i = 0; i < n; i++) { ctx.fillStyle = S.colors[Math.floor(hash(i, 3) * S.colors.length)]; ctx.fillRect(r.x + (i + 0.12) * w / n, y + h * 0.15, w / n * 0.76, h * 0.7); }
      ctx.fillStyle = '#c0392b'; ctx.fillRect(r.x + w * 0.52, y - 3, 3, h + 6);
      for (let i = 0; i < 9; i++) { const x = r.x + (i + 0.5) * w / 9, yy = r.y + r.h + (b.y + b.h - r.y - r.h) * 0.12; ctx.strokeStyle = 'rgba(240,230,200,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, r.y + r.h); ctx.lineTo(x, yy + S.cell * 0.4); ctx.stroke(); rod(ctx, x, yy + S.cell * 0.2, x, yy + S.cell * 0.9, Math.max(3, S.cell * 0.14), '#a87444'); ctx.fillStyle = S.colors[i % S.colors.length]; ctx.fillRect(x - S.cell * 0.09, yy + S.cell * 0.3, S.cell * 0.18, S.cell * 0.3); }
    },
    base: base.sheet(), ground: (ctx, S) => { ground.silk({ density: 9 })(ctx, S); const r = S.rect; ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = -r.h; k < r.w; k += 4) { ctx.moveTo(r.x + k, r.y + r.h); ctx.lineTo(r.x + k + r.h, r.y); } ctx.stroke(); ctx.restore(); },
    cell: (ctx, S, d) => SKIN.threads(ctx, d, { n: 9, dir: 'd', lt: 0.5 }),
  },
  // Amazigh kilim: flat weave on an upright loom in a sunlit mud-walled room; weft packed with a wooden fork, slits at colour changes
  kilim: {
    mat: 'weave', pad: 0.11, snd: 'wood', pot: 'skein', tool: 'weavefork', idle: [0.88, 0.97], place: ['thread', 'puff'],
    card: { paper: '#f0e0c0', deco: 'tape', ink: '#4a2010', label: 'WEAVE CHART' }, btn: { fill: '#3a1c0e', primary: '#e8742e' },
    env: (ctx, S) => {
      ENV.earth(ctx, S, { base: '#b9865a' }); const a = S.area; sunShaft(ctx, a, '#fff0c8', 0.2, 0.55, 0.22); sunShaft(ctx, a, '#fff0c8', 0.12, 0.2, 0.1);
      ctx.fillStyle = 'rgba(70,40,20,0.3)'; for (let i = 0; i < 5; i++) ctx.fillRect(a.x, a.y + a.h * (0.1 + i * 0.2), a.w, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(a.x - 12, a.y + a.h * 0.9, a.w + 24, a.h * 0.1);
    },
    under: (ctx, S) => { const w = posts(ctx, S, '#6e4a26', 0.55); frame.loomH(ctx, S, { wood: '#5e3d1e', warp: '#f2e8d2', beam: 0.4, density: 5, posts: false }); const r = S.rect, y = r.y - (r.y - S.box.y) * 0.45; rod(ctx, r.x - w * 0.3, y, r.x + r.w + w * 0.3, y, w * 0.42, '#c8a468'); },
    base: base.sheet({ blur: 0.4 }), ground: (ctx, S) => { const r = S.rect, p = Math.max(2.4, S.cell / 8); ctx.fillStyle = S.bg; ctx.fillRect(r.x, r.y, r.w, r.h); lines(ctx, r, 'h', p, '#000', 0.2, p * 0.3, 0.4, 3); lines(ctx, r, 'h', p, '#fff', 0.14, p * 0.2, 0.4, 5); lines(ctx, r, 'v', p * 4, '#000', 0.05, 1, 0.3, 7); },
    cell: (ctx, S, d) => SKIN.slit(ctx, d, { n: 8 }),
  },
  // Bedouin ground loom: warp pegged out flat on the sand at dusk, goat-hair and wool bands, a flat sword beats the weft
  sadu: {
    mat: 'weave', pad: 0.2, padL: 0.06, snd: 'wood', pot: 'skein', tool: 'battensword', idle: [0.86, 0.97], place: ['thread', 'puff'], light: 0.85,
    card: { paper: '#e9d4a8', deco: 'hem', ink: '#32180c', label: 'BAND CHART' }, btn: { fill: '#2a1608', primary: '#e2923a' },
    env: (ctx, S) => {
      const a = S.area, g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#6a3a4a'); g.addColorStop(0.28, '#e89858'); g.addColorStop(0.42, '#d4a068'); g.addColorStop(1, '#6a4428'); ctx.fillStyle = g; ctx.fillRect(a.x - 12, a.y, a.w + 24, a.h);
      glow(ctx, a.x + a.w * 0.78, a.y + a.h * 0.2, a.w * 0.5, '#ffd89a', 0.5); ctx.fillStyle = '#ffe9b8'; ctx.beginPath(); ctx.arc(a.x + a.w * 0.78, a.y + a.h * 0.2, Math.max(8, a.w * 0.035), 0, TAU); ctx.fill();
      for (const [k, c] of [[0, '#8a5434'], [1, '#6e4228']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(a.x - 12, a.y + a.h * (0.36 + k * 0.05)); for (let i = 0; i <= 10; i++) ctx.lineTo(a.x + (a.w * i) / 10, a.y + a.h * (0.34 + k * 0.05) - Math.sin(i * 0.9 + k * 2) * a.h * 0.025 - (hash(i, k) * a.h * 0.015)); ctx.lineTo(a.x + a.w + 12, a.y + a.h); ctx.lineTo(a.x - 12, a.y + a.h); ctx.fill(); }
      speck(ctx, { x: a.x, y: a.y + a.h * 0.45, w: a.w, h: a.h * 0.55 }, 520, ['#3a2210', '#e8c088', '#a87a4a'], 0.4, 2, 30); vignette(ctx, a, 0.4);
    },
    under: (ctx, S) => { // warp lies flat from peg beam to peg beam; sticks are driven into the sand
      const r = S.rect, b = S.box, bw = Math.max(8, S.cell * 0.5), p = Math.max(2.6, S.cell / 5);
      ctx.save(); ctx.strokeStyle = 'rgba(220,200,170,0.75)'; ctx.lineWidth = Math.max(1, p * 0.3); ctx.beginPath(); for (let y = r.y; y <= r.y + r.h + 0.1; y += p) { ctx.moveTo(b.x + bw, y); ctx.lineTo(r.x + 3, y); ctx.moveTo(r.x + r.w - 3, y); ctx.lineTo(b.x + b.w - bw, y); } ctx.stroke(); ctx.restore();
      rod(ctx, b.x + bw * 0.6, b.y + bw, b.x + bw * 0.6, b.y + b.h - bw, bw, '#6a4a28'); rod(ctx, b.x + b.w - bw * 0.6, b.y + bw, b.x + b.w - bw * 0.6, b.y + b.h - bw, bw, '#6a4a28');
      for (const [x, y] of [[b.x + bw * 0.6, b.y + bw * 0.4], [b.x + bw * 0.6, b.y + b.h - bw * 0.4], [b.x + b.w - bw * 0.6, b.y + bw * 0.4], [b.x + b.w - bw * 0.6, b.y + b.h - bw * 0.4]]) { soft0(ctx, x, y + bw * 0.35, bw * 0.9); rod(ctx, x, y - bw * 0.3, x, y + bw * 0.5, bw * 0.55, '#8a5e34'); }
    },
    base: base.sheet({ blur: 0.5, drop: 0.12 }), ground: (ctx, S) => { ground.coarse({ density: 6, a: 0.3 })(ctx, S); const r = S.rect; lines(ctx, r, 'h', Math.max(2, S.cell * 0.12), '#000', 0.12, 1, 0.3, 8); },
    cell: (ctx, S, d) => SKIN.threads(ctx, d, { n: 5, dir: 'h', lt: 0.3 }),
  },
  // toquilla straw hat (1.10.0): a hat on its turned block seen from above and in front (scene.tilt): the straw is a diagonal over-under plait that spirals out
  // from the crown, the crown (inner rings) stands on a plaited wall above the brim, a braided rope finishes the edge. A dyed stamp is the plait's own strands
  // in another colour (aligned with it), the light comes from the upper left, palm shadows fall on the table.
  toquilla: {
    mat: 'weave', pad: 0.12, snd: 'soft', pot: 'strawhank', tool: 'strawpick', idle: [0.88, 0.97], place: ['thread', 'puff'], grid: false, light: false, tilt: TOQ_TILT, padL: 0.02,
    card: { paper: '#f1e8d0', deco: 'tape', ink: '#3a2a12', label: 'CROWN TO BRIM' }, btn: { fill: '#2e2412', primary: '#e8cf8a', primaryText: '#2e2412' },
    env: (ctx, S) => toquillaEnv(ctx, S),
    under: (ctx, S) => toquillaUnder(ctx, S),
    base: (ctx, S) => toquillaBase(ctx, S),
    ground: (ctx, S) => toquillaGround(ctx, S),
    cell: (ctx, S, d) => toquillaSkin(ctx, S, d),
    over: (ctx, S) => toquillaOver(ctx, S),
    frame: (ctx, S) => toquillaFrame(ctx, S),
  },
  // Lao silk brocade (sinh): supplementary weft in bright silk on a bamboo loom with leashes, on a slatted house veranda
  sinh: {
    mat: 'weave', pad: 0.1, snd: 'thread', pot: 'basket', tool: 'splint', idle: [0.9, 0.97], place: ['thread', 'sparkle'], light: 0.8,
    card: { paper: '#f1e6cc', deco: 'cloth', ink: '#40201c', label: 'PATTERN' }, btn: { fill: '#3a1a28', primary: '#e8b84a' },
    env: (ctx, S) => {
      const a = S.area; ENV.wood(ctx, S, { base: '#bf9a5a', plank: S.cell * 0.55, dir: 'v', lampC: '#fff4d0', lx: 0.8, ly: 0.1 });
      ctx.fillStyle = 'rgba(255,255,230,0.18)'; ctx.fillRect(a.x - 12, a.y, a.w + 24, a.h * 0.5); for (const x of [0.1, 0.9]) rod(ctx, a.x + a.w * x, a.y - 4, a.x + a.w * x, a.y + a.h, S.cell * 0.7, '#7a5226');
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let k = 0; k < 4; k++) ctx.fillRect(a.x - 12, a.y + a.h * (0.2 + k * 0.22), a.w + 24, 4);
    },
    under: (ctx, S) => { frame.loomH(ctx, S, { wood: '#a6803a', warp: '#f3e6c4', beam: 0.44, density: 8, heddles: true, reed: true }); const r = S.rect; for (const f of [0.28, 0.62]) { const y = r.y - (r.y - S.box.y) * f; rod(ctx, r.x - S.cell * 0.2, y, r.x + r.w + S.cell * 0.2, y, S.cell * 0.1, '#e8d49a'); } },
    base: base.sheet({ blur: 0.7 }), ground: ground.silk({ density: 9, weft: '#000' }),
    cell: (ctx, S, d) => SKIN.threads(ctx, d, { n: 7, dir: 'h', lt: 0.6 }),
  },
  // Basotho blanket: heavy wool with bold stripe bands and corn or flag motifs, pinned at the shoulder; highland dusk behind
  basotho: {
    mat: 'weave', pad: 0.18, snd: 'soft', pot: 'blanketstack', tool: 'blanketpin', idle: [0.9, 0.97], place: ['puff', 'ring'],
    card: { paper: '#ece2cb', deco: 'tape', ink: '#2a2a3a', label: 'BAND CHART' }, btn: { fill: '#1c2a3a', primary: '#e0a840' },
    env: (ctx, S) => { ENV.hills(ctx, S, { sky: '#4a5a86', sky2: '#e8b878' }); const a = S.area; for (let k = 0; k < 14; k++) { ctx.fillStyle = 'rgba(30,40,20,0.35)'; const x = a.x + hash(k, 1) * a.w; ctx.fillRect(x, a.y + a.h * 0.58, 3, a.h * 0.07); } ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(a.x - 12, a.y + a.h * 0.74, a.w + 24, a.h * 0.26); },
    under: (ctx, S) => { // the rest of the blanket: border bands in cream, black and the field colour, tasselled
      const r = S.rect, b = S.box, t = S.cell * 0.9, R = { x: r.x - t, y: r.y - t, w: r.w + 2 * t, h: r.h + 2 * t };
      fringe(ctx, R.x + 2, R.x + R.w - 2, R.y + 3, -1, S.cell * 0.8, '#efe6d0', 21); fringe(ctx, R.x + 2, R.x + R.w - 2, R.y + R.h - 3, 1, S.cell * 0.8, '#efe6d0', 22);
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = S.cell * 1.1; ctx.shadowOffsetY = S.cell * 0.4; ctx.fillStyle = shade(S.bg, -0.2); ctx.fillRect(R.x, R.y, R.w, R.h); ctx.restore();
      for (const [f, c] of [[0.1, '#efe6d0'], [0.3, '#16161a'], [0.5, '#efe6d0']]) { ctx.strokeStyle = c; ctx.lineWidth = Math.max(2, t * 0.12); ctx.strokeRect(R.x + t * f, R.y + t * f, R.w - 2 * t * f, R.h - 2 * t * f); }
      lines(ctx, R, 'h', 3, '#fff', 0.05, 1, 0.3, 3); void b;
    },
    base: () => {}, ground: (ctx, S) => { const r = S.rect; ctx.fillStyle = S.bg; ctx.fillRect(r.x, r.y, r.w, r.h); weaveGrid(ctx, r, Math.max(3, S.cell / 5), '#000', '#fff', 0.2); speck(ctx, r, 260, ['#fff', '#000'], 0.12, 1.8, 31); },
    cell: (ctx, S, d) => SKIN.pile(ctx, d, { n: 5 }), frame: () => {}, clipRect: true,
  },
  // Korean patchwork wrap: translucent ramie and silk scraps seamed together and held to a bright paper window
  bojagi: {
    mat: 'weave', pad: 0.12, snd: 'soft', pot: 'scraps', tool: 'needle', idle: [0.88, 0.97], place: ['thread', 'sparkle'], grid: false, light: 0.4,
    card: { paper: '#f6f0e0', deco: 'plain', ink: '#2a3a4a', label: 'PIECING' }, btn: { fill: '#243a4a', primary: '#f4efe0', primaryText: '#243a4a' },
    env: (ctx, S) => {
      ENV.paper(ctx, S, { base: '#f0e8d6' }); const a = S.area; glow(ctx, a.x + a.w * 0.5, a.y + a.h * 0.42, Math.max(a.w, a.h) * 0.8, '#fffbe8', 0.55);
      ctx.strokeStyle = 'rgba(90,60,30,0.28)'; ctx.lineWidth = Math.max(2, S.cell * 0.1); const st = S.cell * 2.4; ctx.beginPath(); for (let x = a.x + st * 0.3; x < a.x + a.w; x += st) { ctx.moveTo(x, a.y); ctx.lineTo(x, a.y + a.h); } for (let y = a.y + st * 0.3; y < a.y + a.h; y += st) { ctx.moveTo(a.x, y); ctx.lineTo(a.x + a.w, y); } ctx.stroke();
    },
    under: (ctx, S) => { // two thin bamboo rods hold the cloth up against the light, cords to a peg
      const r = S.rect, b = S.box, t = Math.max(5, S.cell * 0.22);
      ctx.save(); ctx.shadowColor = 'rgba(80,60,30,0.45)'; ctx.shadowBlur = S.cell * 0.9; ctx.shadowOffsetY = S.cell * 0.25; ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(r.x - t, r.y - t, r.w + 2 * t, r.h + 2 * t); ctx.restore();
      rod(ctx, r.x - t * 2, r.y - t * 1.2, r.x + r.w + t * 2, r.y - t * 1.2, t, '#b79a52'); rod(ctx, r.x - t * 2, r.y + r.h + t * 1.2, r.x + r.w + t * 2, r.y + r.h + t * 1.2, t, '#b79a52');
      ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(r.x - t * 2, r.y - t * 1.2); ctx.lineTo(r.x + r.w / 2, b.y); ctx.lineTo(r.x + r.w + t * 2, r.y - t * 1.2); ctx.stroke();
    },
    base: () => {}, ground: (ctx, S) => { const r = S.rect; ctx.fillStyle = rgba(S.bg, 0.55); ctx.fillRect(r.x, r.y, r.w, r.h); lines(ctx, r, 'v', Math.max(2.5, S.cell / 8), '#fff', 0.12, 1, 0.3, 3); lines(ctx, r, 'h', Math.max(2.5, S.cell / 8), '#fff', 0.1, 1, 0.3, 5); },
    cell: (ctx, S, d) => SKIN.patch(ctx, d, { seam: '#fff' }), frame: () => {}, clipRect: true,
  },
  // bandhani: cloth pinched into tiny points, bound with thread and dipped; undyed dots remain; terracotta courtyard with dye tubs
  bandhani: {
    mat: 'dye', pad: 0.15, snd: 'bead', pot: 'vat', tool: 'pinchbind', idle: [0.9, 0.97], place: ['drop', 'ring'], grid: false,
    card: { paper: '#f6e8cc', deco: 'cloth', ink: '#4a1a18', label: 'DOT PLAN' }, btn: { fill: '#4a1a18', primary: '#f0b33a' },
    env: (ctx, S) => bandhaniEnv(ctx, S, (c2, S2) => ENV.floorTiles(c2, S2, { c1: '#b86a44', c2: '#aa5e3a', size: S2.cell * 1.9 }), sunShaft),
    under: (ctx, S) => { const r = S.rect, t = S.cell * 0.4; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = S.cell * 0.9; ctx.shadowOffsetY = S.cell * 0.3; ctx.fillStyle = '#a89a86'; ctx.fillRect(r.x - t, r.y - t, r.w + 2 * t, r.h + 2 * t); ctx.restore(); ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(r.x - t, r.y - t, r.w + 2 * t, 2); },
    base: base.sheet({ blur: 0.3, drop: 0.08, fill: '#f6ecd4' }), ground: (ctx, S) => bandhaniGround(ctx, S, weaveGrid),
    cell: (ctx, S, d) => bandhaniSkin(ctx, S, d), over: (ctx, S) => bandhaniOver(ctx, S), frame: () => {}, clipRect: true,
  },
};
function soft0(ctx, x, y, r) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.4, 0, 0, TAU); ctx.fill(); }

const LAYOUT = {
  shyrdak: { order: ['card', 'pal', 'board'], tone: 0.12, pad: 0.13 },
  gul: { order: ['pal', 'board', 'card'], tone: 0.3, pad: 0.12 },
  kani: { order: ['board', 'card', 'pal'], tone: -0.1, pad: 0.16 },
  kilim: { order: ['pal', 'card', 'board'], tone: -0.15, pad: 0.11 },
  sadu: { order: ['pal', 'board', 'card'], tone: 0.15, pad: 0.14 },
  toquilla: { order: ['pal', 'board', 'card'], tone: -0.2, pad: 0.14 },
  sinh: { order: ['board', 'card', 'pal'], tone: -0.45, pad: 0.1 },
  basotho: { order: ['pal', 'card', 'board'], tone: 0.3, pad: 0.18 },
  bojagi: { order: ['pal', 'card', 'board'], tone: -0.5, pad: 0.12 },
  bandhani: { order: ['pal', 'card', 'board'], tone: -0.12, pad: 0.11 },
};
const RULES = [
  ['shyrdak', /shyrdak|ala.?kiyiz|kyrgyz felt|felt.?carpet/], ['gul', /turkmen|gul carpet|hali\b/], ['kani', /kani|talim/], ['kilim', /kilim|amazigh|berber/],
  ['sadu', /sadu|bedouin.*loom|ground.?loom/], ['toquilla', /toquilla|panama hat|straw hat/], ['sinh', /\bsinh\b|lao silk/], ['basotho', /basotho|blanket pattern/],
  ['bojagi', /bojagi|pojagi|patchwork wrap/], ['bandhani', /bandhani|bandhej|tie.?dye/],
];
registerSceneSet({ scenes: SCENES, layout: LAYOUT, rules: RULES, from: 'scenes-f.js' });
export const SCENES_F = SCENES;

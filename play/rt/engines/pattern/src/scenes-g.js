// Scenes, part G (1.8.0): lace, embroidery and folk painting crafts that had no scene of their own: bobbin lace, drawn-thread lace, lace
// knitting, white-on-white embroidery, layered-cloth kantha, pen-drawn cloth painting, silk embroidery, floral painting, painted cart
// panels, rickshaw tin art, Nubian wall painting, raised-ridge painting. Registered through the scene registry. No human figures, no
// religious symbols, text-free art.
import { ENV, SKIN, hash, rgba, mix, shade, roundRectPath, rod, ball, poly, speck, lines, weaveGrid, glow, vignette, TAU } from './scene-kit.js';
import { base, ground, frame } from './scene-parts.js';
import { registerSceneSet } from './scene-registry.js';
import './scene-x.js';
import { stitched } from './scene-craft.js';
import { lacePillow, laceGround, laceOver, laceFrame, laceSkin } from './scene-z.js';
import { suzhouEnv, suzhouGround, suzhouOver, suzhouFrame, suzhouSkin } from './scene-z.js';
import { lefkaraEnv, lefkaraUnder, lefkaraOver, lefkaraGround, chikanEnv, chikanUnder, chikanBase, chikanGround, wideRect, haapsaluGround, haapsaluSkin, kanthaEnv, kanthaUnder, kanthaGround, kanthaSkin, KANTHA_CLOTH } from './scene-y.js';

const dots = (ctx, a, n, seed, f) => { for (let i = 0; i < n; i++) f(a.x + hash(i, seed) * a.w, a.y + hash(i, seed + 1) * a.h, i); };

const SCENES = {
  // bobbin lace: pairs of bobbins crossed and twisted over a blue pricking card pinned to a striped lace pillow
  bobbinlace: {
    mat: 'stitch', pad: 0.15, snd: 'thread', pot: 'bobbinpot', tool: 'bobbinpair', idle: [0.88, 0.97], place: ['thread', 'sparkle'], grid: false,
    card: { paper: '#efe6d2', deco: 'pins', ink: '#1c2848', label: 'PRICKING' }, btn: { fill: '#1c1830', primary: '#e8cf8a', primaryText: '#2a1c10' },
    env: (ctx, S) => { ENV.wood(ctx, S, { base: '#3a2416', plank: S.cell * 2.6, lampC: '#ffd8a0', lx: 0.7, ly: 0.15 }); },
    under: (ctx, S) => lacePillow(ctx, S),
    base: () => {}, ground: (ctx, S) => laceGround(ctx, S),
    cell: (ctx, S, d) => laceSkin(ctx, S, d, SKIN), over: (ctx, S) => laceOver(ctx, S), clipRect: true, frame: (ctx, S) => laceFrame(ctx, S),
  },
  // Lefkara lace (1.10.0): drawn-thread squares and needle-woven bars on pale linen in a dark waxed frame, on a shaded terrace: whitewash wall with
  // blue louvred shutters, stone sill, terracotta floor, warm sun through the slats; the surround is dark so the white linen stands out
  lefkara: {
    mat: 'stitch', pad: 0.1, padL: 0.045, cardWL: 0.24, snd: 'soft', pot: 'card', tool: 'bodkin', idle: [0.9, 0.97], place: ['thread', 'ring'], grid: false, light: false,
    card: { paper: '#f6f2e6', deco: 'hem', ink: '#1c3c5c', label: 'PULLED THREAD' }, btn: { fill: '#1c3c5c', primary: '#f6f2e6', primaryText: '#1c3c5c' },
    env: (ctx, S) => lefkaraEnv(ctx, S),
    under: (ctx, S) => lefkaraUnder(ctx, S),
    base: () => {}, ground: (ctx, S) => lefkaraGround(ctx, S), over: (ctx, S) => lefkaraOver(ctx, S),
    cell: (ctx, S, d) => SKIN.lacefill(ctx, d, { n: 4, under: 'rgba(24,52,86,0.88)' }), frame: () => {},
  },
  // Haapsalu lace shawl: knitted flat with yarn-overs and nupps, then pinned out to dry on a blocking board
  haapsalu: {
    mat: 'weave', pad: 0.07, snd: 'soft', pot: 'ball', tool: 'laceknit', idle: [0.88, 0.97], place: ['puff', 'ring'], grid: false, light: 0.9,
    card: { paper: '#efeee8', deco: 'clip', ink: '#2a3a52', label: 'CHART' }, btn: { fill: '#26344a', primary: '#e6edf4', primaryText: '#26344a' },
    env: (ctx, S) => { ENV.wood(ctx, S, { base: '#c8b284', plank: S.cell * 3.0, dir: 'v', lampC: '#fff8e0', lx: 0.2, ly: 0.2 }); const a = S.area; ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(a.x - 12, a.y, a.w + 24, a.h); dots(ctx, a, 30, 11, (x, y, i) => { ctx.fillStyle = 'rgba(90,60,30,0.2)'; ctx.beginPath(); ctx.ellipse(x, y, S.cell * (0.1 + hash(i, 5) * 0.2), S.cell * 0.04, hash(i, 6) * 3, 0, TAU); ctx.fill(); }); },
    under: (ctx, S) => { // blocking board: a cork-green grid mat
      const r = S.rect, t = S.cell * 0.8, R = { x: r.x - t, y: r.y - t, w: r.w + 2 * t, h: r.h + 2 * t };
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = S.cell; ctx.shadowOffsetY = S.cell * 0.35; ctx.fillStyle = '#2c4e50'; roundRectPath(ctx, R.x, R.y, R.w, R.h, 6); ctx.fill(); ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = R.x; x <= R.x + R.w; x += S.cell * 0.5) { ctx.moveTo(x, R.y); ctx.lineTo(x, R.y + R.h); } for (let y = R.y; y <= R.y + R.h; y += S.cell * 0.5) { ctx.moveTo(R.x, y); ctx.lineTo(R.x + R.w, y); } ctx.stroke();
    },
    base: () => {},
    ground: (ctx, S) => haapsaluGround(ctx, S),
    cell: (ctx, S, d) => stitched(ctx, d, () => haapsaluSkin(ctx, S, d), 0.7),
    frame: (ctx, S) => { // blocking wires along the edges and T-pins every half cell
      const r = S.rect, st = S.cell * 0.5; ctx.strokeStyle = 'rgba(210,216,222,0.9)'; ctx.lineWidth = 1.6; ctx.strokeRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4);
      for (let x = r.x + st * 0.5; x < r.x + r.w; x += st) for (const y of [r.y - 2, r.y + r.h + 2]) { ball(ctx, x, y, Math.max(2, S.cell * 0.07), '#e8eef4', false); }
      for (let y = r.y + st * 0.5; y < r.y + r.h; y += st) for (const x of [r.x - 2, r.x + r.w + 2]) ball(ctx, x, y, Math.max(2, S.cell * 0.07), '#e8eef4', false);
    },
  },
  // Chikankari (1.10.0): raised white thread with a cast shadow on a mid-tone dyed muslin (a real value split), stretched on a frame; shadow work is a soft
  // milky shape seen through the cloth; a long needle stitches round each motif as it lands. In landscape the cloth runs out wide (blue block-print guide
  // in the margins, white hem stitch) and the reference card is a slim column. A carved screen throws lace-like light on the floor.
  chikankari: {
    mat: 'stitch', pad: 0.17, padL: 0.05, cardWL: 0.24, snd: 'soft', pot: 'chikanhank', tool: 'chikanneedle', idle: [0.9, 0.97], place: ['thread', 'ring'], grid: false, light: false,
    card: { paper: '#f7f2e6', deco: 'hem', ink: '#3a3226', label: 'BLOCK DESIGN' }, btn: { fill: '#3a3226', primary: '#f7f2e6', primaryText: '#3a3226' },
    env: (ctx, S) => chikanEnv(ctx, S),
    under: (ctx, S) => chikanUnder(ctx, S, frame.stretcher),
    base: (ctx, S) => chikanBase(ctx, S),
    ground: (ctx, S) => chikanGround(ctx, S),
    cell: (ctx, S, d) => SKIN.chikan(ctx, d, { shadow: '#2e3a4c' }), frame: () => {},
  },
  // nakshi kantha (1.10.0): old saris layered and quilted all over in rows of running stitch that ripple across the pale cloth (the ground is the stitching);
  // a motif is the same stitch, dense, in thread colour, rows in step with the cloth, contour rows echoing the shape. Courtyard clay in the dark around it.
  kantha: {
    mat: 'stitch', pad: 0.06, padL: 0.05, cardWL: 0.24, snd: 'thread', pot: 'skein', tool: ['chikanneedle', { thimble: true }], idle: [0.9, 0.97], place: ['thread', 'puff'], grid: false, light: false,
    card: { paper: '#efe2c6', deco: 'tape', ink: '#2a3a52', label: 'MOTIF' }, btn: { fill: '#1e3248', primary: '#f0b43a' },
    env: (ctx, S) => kanthaEnv(ctx, S),
    under: (ctx, S) => kanthaUnder(ctx, S),
    base: (ctx, S) => { const R = wideRect(S); ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = S.cell * 0.5; ctx.shadowOffsetY = S.cell * 0.14; ctx.fillStyle = KANTHA_CLOTH; ctx.fillRect(R.x, R.y, R.w, R.h); ctx.restore(); },
    ground: (ctx, S) => kanthaGround(ctx, S),
    cell: (ctx, S, d) => stitched(ctx, d, () => kanthaSkin(ctx, S, d)), frame: () => {},
  },
  // kalamkari (1.9.0): a bamboo pen draws iron-black mordant outlines on cotton pegged out on a river bank; the dye baths then colour the shapes in
  // order (params.process 'pen-dye'; without it the cells simply print as dyed, outlined shapes). Larger cloth, real cotton texture, river light.
  kalamkari: {
    mat: 'ink', pad: 0.14, snd: 'brush', pot: 'inkwell', tool: 'kalampen', idle: [0.88, 0.97], place: ['drop', 'paint'], grid: false,
    card: { paper: '#ecdcb6', deco: 'scroll', ink: '#2a1a10', label: 'DRAWING' }, btn: { fill: '#2a1810', primary: '#d89a3a' },
    env: (ctx, S) => {
      ENV.earth(ctx, S, { base: '#8a6a46' }); const a = S.area; const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h * 0.2); g.addColorStop(0, '#2e6272'); g.addColorStop(1, '#6a9494'); ctx.fillStyle = g; ctx.fillRect(a.x - 12, a.y, a.w + 24, a.h * 0.2);
      ctx.strokeStyle = 'rgba(255,255,255,0.34)'; ctx.lineWidth = 1.5; for (let k = 0; k < 18; k++) { const y = a.y + a.h * (0.02 + hash(k, 1) * 0.16), x = a.x + hash(k, 2) * a.w; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 14, y - 3, x + 30, y); ctx.stroke(); }
      const sun = ctx.createRadialGradient(a.x + a.w * 0.78, a.y + a.h * 0.03, 0, a.x + a.w * 0.78, a.y + a.h * 0.03, a.w * 0.5); sun.addColorStop(0, 'rgba(255,240,190,0.5)'); sun.addColorStop(1, 'rgba(255,240,190,0)'); ctx.fillStyle = sun; ctx.fillRect(a.x - 12, a.y, a.w + 24, a.h * 0.4);
      for (let k = 0; k < 6; k++) { ball(ctx, a.x + a.w * (0.08 + k * 0.18), a.y + a.h * (0.205 + hash(k, 4) * 0.02), S.cell * (0.28 + hash(k, 5) * 0.14), '#7a7468', false); }
      ctx.fillStyle = 'rgba(30,20,8,0.25)'; ctx.fillRect(a.x - 12, a.y + a.h * 0.2, a.w + 24, 3);
    },
    under: (ctx, S) => { // the cloth pegged out: stakes at the corners and midpoints joined by cord, a soft shadow beneath
      const r = S.rect, t = S.cell * 0.5, pts = [[r.x - t, r.y - t], [r.x + r.w / 2, r.y - t], [r.x + r.w + t, r.y - t], [r.x + r.w + t, r.y + r.h / 2], [r.x + r.w + t, r.y + r.h + t], [r.x + r.w / 2, r.y + r.h + t], [r.x - t, r.y + r.h + t], [r.x - t, r.y + r.h / 2]];
      ctx.strokeStyle = 'rgba(240,226,190,0.85)'; ctx.lineWidth = 1.4; for (let i = 0; i < 8; i++) { const [x, y] = pts[i]; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(Math.max(r.x, Math.min(x, r.x + r.w)), Math.max(r.y, Math.min(y, r.y + r.h))); ctx.stroke(); }
      for (const [x, y] of pts) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 4, S.cell * 0.14, S.cell * 0.07, 0, 0, TAU); ctx.fill(); rod(ctx, x, y - S.cell * 0.25, x, y + S.cell * 0.08, Math.max(3, S.cell * 0.1), '#7a5230'); }
    },
    base: base.sheet({ blur: 0.5, drop: 0.14 }),
    ground: (ctx, S) => {
      const r = S.rect, m = mix(S.bg, '#efe3c4', 0.35), p = Math.max(1.8, S.cell / 10);
      ctx.fillStyle = m; ctx.fillRect(r.x, r.y, r.w, r.h);
      lines(ctx, r, 'v', p, shade(m, -0.22), 0.22, p * 0.45, 0.4, 3); lines(ctx, r, 'h', p, shade(m, 0.3), 0.26, p * 0.45, 0.4, 5);
      if (!S.lite) speck(ctx, r, 170, [shade(m, -0.3), shade(m, 0.4)], 0.28, Math.max(1.2, S.cell * 0.04), 23);
      dots(ctx, r, 8, 20, (x, y, i) => { const R = S.cell * (0.5 + hash(i, 4) * 1.2); const g = ctx.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, 'rgba(150,100,50,0.13)'); g.addColorStop(1, 'rgba(150,100,50,0)'); ctx.fillStyle = g; ctx.fillRect(x - R, y - R, R * 2, R * 2); });
      const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,248,225,0.26)'); g.addColorStop(0.5, 'rgba(255,248,225,0)'); g.addColorStop(1, 'rgba(70,45,15,0.2)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = 'rgba(80,50,20,0.1)'; ctx.lineWidth = Math.max(2, S.cell * 0.16); ctx.beginPath(); ctx.moveTo(r.x, r.y + r.h * 0.38); ctx.quadraticCurveTo(r.x + r.w * 0.45, r.y + r.h * 0.33, r.x + r.w, r.y + r.h * 0.42); ctx.moveTo(r.x, r.y + r.h * 0.78); ctx.quadraticCurveTo(r.x + r.w * 0.5, r.y + r.h * 0.84, r.x + r.w, r.y + r.h * 0.76); ctx.stroke();
    },
    cell: (ctx, S, d) => SKIN.penwork(ctx, d, { line: '#241810', lw: 0.05 }), frame: () => {}, clipRect: true,
  },
  // Suzhou silk embroidery: hair-fine split silk in satin stitch on taut silk in a redwood frame, before a round moon window
  suzhou: {
    mat: 'stitch', pad: 0.08, snd: 'soft', pot: 'spool', tool: 'chikanneedle', idle: [0.9, 0.97], place: ['thread', 'sparkle'], grid: false, light: 0.8,
    card: { paper: '#e8efe4', deco: 'studs', ink: '#1c3a30', label: 'SKETCH' }, btn: { fill: '#14302a', primary: '#e8c46a' },
    env: (ctx, S) => suzhouEnv(ctx, S),
    under: (ctx, S) => frame.stretcher(ctx, S, { wood: '#7a2e1e', ties: 9, tie: '#efe6c8', t: 0.42 }),
    base: base.sheet({ blur: 0.2, drop: 0.05 }), ground: (ctx, S) => suzhouGround(ctx, S),
    cell: (ctx, S, d) => stitched(ctx, d, () => suzhouSkin(ctx, S, d)), over: (ctx, S) => suzhouOver(ctx, S), frame: (ctx, S) => suzhouFrame(ctx, S),
  },
  // Kalocsa floral painting: bold loaded-brush flowers in red, blue and green on a whitewashed farmhouse wall panel
  kalocsa: {
    mat: 'paint', pad: 0.08, snd: 'brush', pot: 'cakes', tool: ['stylus', { hair: true, body: '#8a5a30', w: 0.15, len: 3.9, a: 0.5, ferrule: true, ball: 0.02 }], idle: [0.9, 0.97], place: ['paint', 'drop'], grid: false, light: 0.9,
    card: { paper: '#fbf7ec', deco: 'plain', ink: '#14402a', label: 'FLOWER PLAN' }, btn: { fill: '#14402a', primary: '#f6f0e0', primaryText: '#14402a' },
    env: (ctx, S) => {
      ENV.plain(ctx, S, { base: '#d8d2c0', top: '#f2eddc', light: '#fffbe8' }); const a = S.area;
      ctx.fillStyle = '#2a6a4a'; ctx.fillRect(a.x - 12, a.y + a.h * 0.9, a.w + 24, a.h * 0.1); for (let x = a.x; x < a.x + a.w; x += S.cell * 0.9) { ctx.fillStyle = '#c0282c'; ctx.beginPath(); ctx.arc(x + S.cell * 0.2, a.y + a.h * 0.95, S.cell * 0.12, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8b830'; ctx.beginPath(); ctx.arc(x + S.cell * 0.55, a.y + a.h * 0.93, S.cell * 0.07, 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(a.x - 12, a.y + a.h * 0.9, a.w + 24, 4);
    },
    under: (ctx, S) => { const r = S.rect, t = S.cell * 0.4; ctx.save(); ctx.shadowColor = 'rgba(40,30,10,0.45)'; ctx.shadowBlur = S.cell * 0.8; ctx.shadowOffsetY = S.cell * 0.25; ctx.fillStyle = '#2a7a4a'; ctx.fillRect(r.x - t, r.y - t, r.w + 2 * t, r.h + 2 * t); ctx.restore(); ctx.fillStyle = '#f6f1e0'; ctx.fillRect(r.x - t * 0.55, r.y - t * 0.55, r.w + t * 1.1, r.h + t * 1.1); },
    base: () => {}, ground: (ctx, S) => { ground.plaster({ a: 0.08 })(ctx, S); },
    cell: (ctx, S, d) => SKIN.petal(ctx, d, { n: 6 }), frame: () => {}, clipRect: true,
  },
  // Sicilian cart: bold narrative colours with black outline on the yellow side panel of a wooden cart, a spoked wheel beside it
  sicilian: {
    mat: 'paint', pad: 0.16, snd: 'brush', pot: 'pot', tool: ['brush', { w: 0.26, body: '#8a5a30', a: 0.7 }], idle: [0.9, 0.97], place: ['paint', 'sparkle'], grid: false,
    card: { paper: '#f3e6c0', deco: 'wood', ink: '#3a1810', label: 'PANEL' }, btn: { fill: '#3a1a10', primary: '#f2c230' },
    env: (ctx, S) => {
      ENV.stone(ctx, S, { base: '#6e5d4c', size: S.cell * 2.6 }); const a = S.area; glow(ctx, a.x + a.w * 0.2, a.y + a.h * 0.05, a.w, '#ffb070', 0.3);
      const R = Math.min(a.w, a.h) * 0.3, cx = a.x - R * 0.2, cy = a.y + a.h * 0.9; ctx.save(); ctx.beginPath(); ctx.rect(a.x - 12, a.y, a.w + 24, a.h); ctx.clip();
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx + R * 0.1, cy + R * 0.95, R * 1.1, R * 0.2, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#c0282a'; ctx.lineWidth = R * 0.14; ctx.beginPath(); ctx.arc(cx, cy, R * 0.9, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#e8b21c'; ctx.lineWidth = R * 0.07; for (let k = 0; k < 12; k++) { const an = (k / 12) * TAU; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(an) * R * 0.85, cy + Math.sin(an) * R * 0.85); ctx.stroke(); }
      ctx.strokeStyle = '#1a1410'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke(); ball(ctx, cx, cy, R * 0.16, '#2a6ab0', false); ctx.restore();
    },
    under: (ctx, S) => { // the cart-side panel: raised moulding and a carved edge
      const r = S.rect, t = S.cell * 0.6, R = { x: r.x - t, y: r.y - t, w: r.w + 2 * t, h: r.h + 2 * t };
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = S.cell * 1.1; ctx.shadowOffsetY = S.cell * 0.4; ctx.fillStyle = '#b8281e'; roundRectPath(ctx, R.x, R.y, R.w, R.h, 6); ctx.fill(); ctx.restore();
      ctx.strokeStyle = '#2a5ea8'; ctx.lineWidth = t * 0.25; ctx.strokeRect(R.x + t * 0.22, R.y + t * 0.22, R.w - t * 0.44, R.h - t * 0.44);
      ctx.fillStyle = '#f2c230'; for (let x = R.x + t * 0.8; x < R.x + R.w - t * 0.4; x += t * 0.8) { ctx.beginPath(); ctx.arc(x, R.y + t * 0.5, t * 0.12, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x, R.y + R.h - t * 0.5, t * 0.12, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.4; ctx.strokeRect(R.x, R.y, R.w, R.h);
    },
    base: () => {}, ground: (ctx, S) => { ground.planks({ dir: 'v', size: 0.95 })(ctx, S); }, clipRect: true,
    cell: (ctx, S, d) => SKIN.outline(ctx, d, { line: '#16110c', lw: 0.065, round: true }), frame: () => {},
  },
  // rickshaw back-panel: glossy enamel on tin under a night street's bokeh, a scalloped foil trim and tinsel tassels
  rickshaw: {
    mat: 'paint', pad: 0.13, snd: 'pop', pot: 'enamel', tool: ['brush', { w: 0.2, body: '#d8c070', a: 0.55 }], idle: [0.9, 0.97], place: ['paint', 'sparkle'], grid: false,
    card: { paper: '#f6e8c8', deco: 'studs', ink: '#18205a', label: 'ART PANEL' }, btn: { fill: '#14184a', primary: '#f8d230' },
    env: (ctx, S) => {
      ENV.plain(ctx, S, { base: '#080a1c', top: '#1a2056' }); const a = S.area;
      for (let k = 0; k < 34; k++) { const x = a.x + hash(k, 1) * a.w, y = a.y + hash(k, 2) * a.h, R = S.cell * (0.25 + hash(k, 3) * 0.7); const c = ['#ff4f8a', '#ffd23a', '#2fd6a0', '#ff8a2a', '#38b8ff'][k % 5]; const g = ctx.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, rgba(c, 0.5)); g.addColorStop(0.8, rgba(c, 0.25)); g.addColorStop(1, rgba(c, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill(); }
      vignette(ctx, a, 0.4);
    },
    under: (ctx, S) => { // scalloped foil rim, rivets and hanging tinsel
      const r = S.rect, t = S.cell * 0.55, R = { x: r.x - t, y: r.y - t, w: r.w + 2 * t, h: r.h + 2 * t }, cols = ['#ff3d7f', '#ffd21e', '#19c37d', '#ff7a1a', '#2ab4ff'];
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = S.cell; ctx.shadowOffsetY = S.cell * 0.4; const g = ctx.createLinearGradient(R.x, R.y, R.x + R.w, R.y + R.h); g.addColorStop(0, '#e9eef2'); g.addColorStop(0.5, '#8c97a2'); g.addColorStop(1, '#d6dde3'); ctx.fillStyle = g; roundRectPath(ctx, R.x, R.y, R.w, R.h, t * 0.6); ctx.fill(); ctx.restore();
      let i = 0; for (let x = R.x + t * 0.5; x < R.x + R.w; x += t * 0.9, i++) { ball(ctx, x, R.y + t * 0.3, t * 0.28, cols[i % 5], false); ball(ctx, x, R.y + R.h - t * 0.3, t * 0.28, cols[(i + 2) % 5], false); }
      for (let y = R.y + t * 0.5; y < R.y + R.h; y += t * 0.9, i++) { ball(ctx, R.x + t * 0.3, y, t * 0.28, cols[i % 5], false); ball(ctx, R.x + R.w - t * 0.3, y, t * 0.28, cols[(i + 3) % 5], false); }
      for (let x = R.x + t; x < R.x + R.w - t * 0.5; x += t * 0.55) { ctx.strokeStyle = cols[((x / t) | 0) % 5]; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(x, R.y + R.h); ctx.quadraticCurveTo(x + (hash(x | 0, 2) - 0.5) * 10, R.y + R.h + t * 0.9, x + (hash(x | 0, 3) - 0.5) * 14, R.y + R.h + t * (1.2 + hash(x | 0, 4) * 0.8)); ctx.stroke(); }
    },
    base: () => {}, ground: (ctx, S) => { const r = S.rect; ctx.fillStyle = S.bg; ctx.fillRect(r.x, r.y, r.w, r.h); const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y); g.addColorStop(0, 'rgba(255,255,255,0.16)'); g.addColorStop(0.4, 'rgba(255,255,255,0)'); g.addColorStop(0.75, 'rgba(255,255,255,0.1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h); },
    cell: (ctx, S, d) => SKIN.outline(ctx, d, { line: '#10142e', gloss: true, round: true, lw: 0.05 }), frame: () => {}, clipRect: true,
  },
  // Nubian house painting: lime-white wall with turquoise, ochre and brown geometry, brushed on with palm fibre; mud-brick courses around it
  nubian: {
    mat: 'paint', pad: 0.09, snd: 'brush', pot: 'heap', tool: ['brush', { w: 0.46, body: '#bda55e', a: 0.8 }], idle: [0.9, 0.97], place: ['paint', 'puff'], grid: false,
    card: { paper: '#f2ead8', deco: 'tape', ink: '#12424c', label: 'WALL PLAN' }, btn: { fill: '#12424c', primary: '#f0b84a' },
    env: (ctx, S) => {
      const a = S.area, bh = S.cell * 0.9, bw = S.cell * 1.9; ctx.fillStyle = '#b07a4c'; ctx.fillRect(a.x - 12, a.y, a.w + 24, a.h);
      for (let y = a.y, j = 0; y < a.y + a.h; y += bh, j++) for (let x = a.x - (j % 2) * bw / 2, i = 0; x < a.x + a.w; x += bw, i++) { ctx.fillStyle = shade('#b07a4c', (hash(i, j, 4) - 0.5) * 0.22); ctx.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x + 1.5, y + 1.5, bw - 3, 2); }
      glow(ctx, a.x + a.w * 0.5, a.y, a.w, '#ffd890', 0.35); vignette(ctx, a, 0.45);
    },
    under: (ctx, S) => { const r = S.rect, t = S.cell * 0.55; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = S.cell; ctx.shadowOffsetY = S.cell * 0.3; ctx.fillStyle = '#e9e2cf'; ctx.fillRect(r.x - t, r.y - t, r.w + 2 * t, r.h + 2 * t); ctx.restore(); ctx.strokeStyle = '#1f8f9c'; ctx.lineWidth = t * 0.28; ctx.strokeStyle = '#1f8f9c'; ctx.strokeRect(r.x - t * 0.5, r.y - t * 0.5, r.w + t, r.h + t); ctx.strokeStyle = '#d89a30'; ctx.lineWidth = t * 0.1; ctx.strokeRect(r.x - t * 0.2, r.y - t * 0.2, r.w + t * 0.4, r.h + t * 0.4); },
    base: () => {}, ground: ground.plaster({ a: 0.1 }), clipRect: true,
    cell: (ctx, S, d) => SKIN.outline(ctx, d, { line: '#1a1816', lw: 0.055 }), frame: () => {},
  },
  // imigongo: ridges of fine dung paste drawn on a board with a spatula, then the fields between them painted flat
  imigongo: {
    mat: 'paint', pad: 0.18, snd: 'pop', pot: 'paste', tool: 'ridgeknife', idle: [0.9, 0.97], place: ['drop', 'puff'], grid: false,
    card: { paper: '#efe3c8', deco: 'wood', ink: '#2a1a10', label: 'RIDGE PLAN' }, btn: { fill: '#2a1a12', primary: '#e8742a' },
    env: (ctx, S) => {
      ENV.hills(ctx, S, { sky: '#8aa8c0', sky2: '#f0d8a0' }); const a = S.area; ctx.fillStyle = 'rgba(40,70,25,0.35)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(a.x - 12, a.y + a.h * (0.42 + k * 0.05)); for (let i = 0; i <= 10; i++) ctx.lineTo(a.x + a.w * i / 10, a.y + a.h * (0.4 + k * 0.05) - Math.sin(i + k) * a.h * 0.015); ctx.lineTo(a.x + a.w + 12, a.y + a.h); ctx.lineTo(a.x - 12, a.y + a.h); ctx.fill(); }
      ctx.fillStyle = 'rgba(70,40,20,0.45)'; ctx.fillRect(a.x - 12, a.y + a.h * 0.7, a.w + 24, a.h * 0.3);
    },
    under: (ctx, S) => { const r = S.rect, t = S.cell * 0.5; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = S.cell; ctx.shadowOffsetY = S.cell * 0.4; ctx.fillStyle = '#4a2a18'; ctx.beginPath(); ctx.moveTo(r.x - t, r.y - t * 0.6); for (let i = 0; i <= 20; i++) ctx.lineTo(r.x - t + (r.w + 2 * t) * i / 20, r.y - t * (0.7 + hash(i, 1) * 0.3)); ctx.lineTo(r.x + r.w + t, r.y + r.h + t); ctx.lineTo(r.x - t, r.y + r.h + t); ctx.closePath(); ctx.fill(); ctx.restore(); },
    base: () => {}, ground: (ctx, S) => { const r = S.rect; ctx.fillStyle = S.bg; ctx.fillRect(r.x, r.y, r.w, r.h); speck(ctx, r, 260, ['#000', '#fff'], 0.06, 1.8, 41); const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,255,255,0.1)'); g.addColorStop(1, 'rgba(0,0,0,0.1)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h); },
    cell: (ctx, S, d) => SKIN.ridge(ctx, d, { ridge: '#17110d' }), frame: () => {}, clipRect: true,
  },
};

const LAYOUT = {
  bobbinlace: { order: ['board', 'pal', 'card'], tone: -0.08, pad: 0.15 },
  lefkara: { order: ['card', 'board', 'pal'], tone: 0, pad: 0.1 },
  haapsalu: { order: ['board', 'pal', 'card'], tone: -0.25, pad: 0.07 },
  chikankari: { order: ['card', 'board', 'pal'], tone: 0, pad: 0.17 },
  kantha: { order: ['card', 'board', 'pal'], tone: 0, pad: 0.06 },
  kalamkari: { order: ['card', 'pal', 'board'], tone: 0.05, pad: 0.14 },
  suzhou: { order: ['board', 'pal', 'card'], tone: 0.22, pad: 0.08 },
  kalocsa: { order: ['card', 'pal', 'board'], tone: -0.28, pad: 0.08 },
  sicilian: { order: ['board', 'card', 'pal'], tone: 0.22, pad: 0.16 },
  rickshaw: { order: ['card', 'pal', 'board'], tone: 0.35, pad: 0.13 },
  nubian: { order: ['card', 'board', 'pal'], tone: -0.2, pad: 0.09 },
  imigongo: { order: ['pal', 'board', 'card'], tone: 0.02, pad: 0.18 },
};
const RULES = [
  ['bobbinlace', /bobbin.?lace|pillow lace/], ['lefkara', /lefkara|lefkaritika/], ['haapsalu', /haapsalu|lace.?(shawl )?knit|knitted lace/], ['chikankari', /chikan/],
  ['kantha', /kantha/], ['kalamkari', /kalamkari/], ['suzhou', /suzhou|su xiu/], ['kalocsa', /kalocsa/], ['sicilian', /sicilian.*cart|carretto/],
  ['rickshaw', /rickshaw/], ['nubian', /nubian/], ['imigongo', /imigongo/],
];
registerSceneSet({ scenes: SCENES, layout: LAYOUT, rules: RULES, from: 'scenes-g.js' });
export const SCENES_G = SCENES;

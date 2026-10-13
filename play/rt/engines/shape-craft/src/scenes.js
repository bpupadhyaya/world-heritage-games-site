// shape-craft scenes: every craft gets its own workshop (wall, bench, light, litter, tool dock, reference frame, held tool, words,
// sounds) chosen by a table keyed on the spec (`scene` param) or on the title, so game folders need not change.
// Pure drawing: no DOM, no randomness, no clocks (time arrives as an argument).
import { hash } from './geom.js';
import { tint, mix, rgba, rrect, shadowed, surface, displayCase } from './fx.js';
import { drawProp, drawHeld, lg, rg, ell, cast, TAU } from './props.js';

// ---- scene table -------------------------------------------------------------------------------------------------------------
// wall: backdrop kind; floor: bench material; hang/shelf: what is on the wall; dock: tools laid out on the bench edge;
// litter: bench debris; light: window | lamp; frame: how the reference is presented.
const S = {
  soapstone: { wall: 'plaster', wallC: '#b98a5c', floor: 'slab', floorC: '#8d7a68', light: 'window', hang: ['rasp', 'mallet', 'gouge'], litter: [{ k: 'dust', c: '#f0c9b8' }], dock: ['rasp', 'chisel', 'mallet', 'bowl', 'sponge'], dockKind: 'ledge', frame: 'plinth',
    block: 'soapstone', seat: 'sandbag', tool: 'rasp', cavity: 'dust', fx: { kind: 'dust', c: '#f4d2c2' }, pitch: 0.8, wave: 'triangle',
    words: { caption: 'Carve this animal', hint: 'Rasp away the stone outside the lit outline', hintBlind: 'Rasp away everything that is not the animal' } },
  lostwax: { wall: 'lamp', wallC: '#241810', floor: 'planks', floorC: '#3a2618', light: 'lamp', hang: [], litter: [{ k: 'wax', c: '#e9b64a' }], dock: ['waxloop', 'spirit', 'waxblock', 'tongs'], dockKind: 'tray', frame: 'tile',
    block: 'wax', seat: 'tray', tool: 'waxloop', cavity: 'dark', fx: { kind: 'curl', c: '#f2c35a' }, pitch: 1.5, wave: 'sine',
    words: { caption: 'Model this in wax', hint: 'Shave the wax away outside the lit outline', hintBlind: 'Shave the wax into the figure' } },
  lippan: { wall: 'mud', wallC: '#d8c3a3', floor: 'mud', floorC: '#a8704a', light: 'window', hang: [], litter: [{ k: 'mirror', c: '#d3e6ef' }, { k: 'dust', c: '#e9dcc3' }], dock: ['trowel', 'mudbowl', 'mirrors', 'pick'], dockKind: 'ledge', frame: 'mirror',
    block: 'mud', seat: 'mudrim', tool: 'pick', cavity: 'mirror', fx: { kind: 'dust', c: '#d9bf9d' }, pitch: 1.1, wave: 'triangle',
    words: { caption: 'Press this relief', hint: 'Tap the cells that become mirror: partners on the fold follow', hintBlind: 'Tap cells: partners on the fold follow' } },
  rishtan: { wall: 'arch', wallC: '#1d6f7a', floor: 'tile', floorC: '#9c6a46', light: 'window', hang: [], litter: [{ k: 'clay', c: '#c9805a' }], dock: ['bowl', 'pot:#1d9aa6', 'pot:#1a3d8f', 'pot:#2f8f6a', 'brush:#1a3d8f'], dockKind: 'ledge', frame: 'niche',
    rig: 'kick', tool: 'rib', top: 'open', words: { caption: 'Throw this bowl', shape: 'Drag across the clay to set the width of the bowl', glaze: 'Tap a band to paint it with a glaze', win: 'A bowl for the master potter', ok: 'A good bowl', retry: 'Back to the wheel' }, pitch: 0.9, wave: 'sine' },
  bluepottery: { wall: 'shelf', wallC: '#e9e2d0', floor: 'tile', floorC: '#c9bfa6', light: 'window', shelf: [{ k: 'jar', c: '#2b5fb0' }, { k: 'plate', c: '#2b5fb0' }, { k: 'jar', c: '#3b8ad0' }], litter: [], dock: ['pot:#1f4aa8', 'pot:#2aa6a0', 'brush:#1f4aa8', 'sponge'], dockKind: 'ledge', frame: 'rail',
    rig: 'wheel', tool: 'rib', top: 'open', words: { caption: 'Shape this vase', shape: 'Drag across the quartz clay to set its width', glaze: 'Tap a band to paint it in blue', win: 'A fine blue pot', ok: 'A good pot', retry: 'Back to the wheel' } },
  celadon: { wall: 'shelf', wallC: '#8a9a8a', floor: 'slab', floorC: '#a6ad9c', light: 'window', shelf: [{ k: 'jar', c: '#a9c4a4' }, { k: 'plate', c: '#bcd2b8' }], litter: [{ k: 'clay', c: '#cfd4c4' }], dock: ['bowl', 'sponge', 'pot:#8fb59a'], dockKind: 'cloth', frame: 'case',
    rig: 'wheel', tool: 'sponge', top: 'open', words: { caption: 'Throw this jar', shape: 'Drag across the clay to set its width', glaze: 'Tap a band to give it celadon glaze', win: 'A jade-green jar', ok: 'A good jar', retry: 'Back to the wheel' } },
  terracotta: { wall: 'earth', wallC: '#a8643a', floor: 'earth', floorC: '#8c5030', light: 'window', hang: [], litter: [{ k: 'clay', c: '#b0562f' }], dock: ['bowl', 'sponge', 'pot:#f2eadb', 'brush:#f2eadb'], dockKind: 'ledge', frame: 'rail',
    rig: 'wheel', tool: 'rib', top: 'open', words: { caption: 'Throw this jar', shape: 'Drag across the clay to set its width', glaze: 'Tap a band to paint it with slip', win: 'A fine jar', ok: 'A good jar', retry: 'Back to the wheel' } },
  matryoshka: { wall: 'lathe', wallC: '#4a2a1c', floor: 'planks', floorC: '#7a5230', light: 'window', hang: [], litter: [{ k: 'shavings', c: '#ecd7a3' }], dock: ['gouge', 'caliper', 'pot:#c8281f', 'pot:#f0b923', 'pot:#2f8a3e', 'brush:#c8281f'], dockKind: 'tray', frame: 'rail',
    rig: 'woodlathe', tool: 'gouge', top: 'solid', glazeTool: 'brush', words: { caption: 'Turn this doll', shape: 'Drag across the wood to set the width of the doll', glaze: 'Tap a band to paint it', win: 'A doll worth nesting', ok: 'A good doll', retry: 'Back to the lathe' }, pitch: 1.2, wave: 'sawtooth' },
  shibori: { wall: 'rope', wallC: '#d8dde6', floor: 'cloth', floorC: '#9a8466', light: 'window', hang: [], litter: [{ k: 'splash', c: '#1c3a8a' }], dock: ['clampboards', 'vat', 'needle'], dockKind: 'ledge', frame: 'cloth',
    sheet: 'cloth', words: { caption: 'Fold the cloth to this', hint: 'Folds made' }, pitch: 0.9, wave: 'sine' },
  origami: { wall: 'window', wallC: '#e9dfc9', floor: 'felt', floorC: '#3a5a4a', light: 'window', hang: [], litter: [{ k: 'scraps', c: '#d94c4c' }], dock: ['paper:#d94c4c', 'folder', 'paper:#2f7ac0'], dockKind: 'ledge', frame: 'card', sheet: 'washi',
    words: { caption: 'Fold the paper into this' }, pitch: 1.4, wave: 'sine' },
  papercut: { wall: 'paper', wallC: '#e9d9b4', floor: 'mat', floorC: '#2f4a3a', light: 'window', hang: [], litter: [{ k: 'scraps', c: '#c8201a' }], dock: ['knife', 'scissors', 'paper:#c8201a'], dockKind: 'ledge', frame: 'card',
    block: 'paper', seat: 'mat', tool: 'knife', cavity: 'mat', fx: { kind: 'flake', c: '#c8201a' }, pitch: 1.6, wave: 'triangle',
    words: { caption: 'Cut this design', hint: 'Tap cells to snip: partners on the fold are cut too', hintBlind: 'Tap cells to snip' } },
  chineseknot: { wall: 'silk', wallC: '#7a1020', floor: 'lacquer', floorC: '#5a0f16', light: 'lamp', hang: [], litter: [{ k: 'thread', c: '#d1202f' }], dock: ['spool:#d1202f', 'scissors', 'bead', 'pins'], dockKind: 'cloth', frame: 'card',
    board: 'cork', words: { caption: 'Tie this knot' }, pitch: 1.0, wave: 'triangle' },
  celtic: { wall: 'stone', wallC: '#4a5a46', floor: 'parchment', floorC: '#c9b684', light: 'lamp', hang: [], litter: [], dock: ['parchment', 'pins', 'spool:#2f6a3a'], dockKind: 'ledge', frame: 'card', board: 'parchment', words: { caption: 'Interlace this knot' } },
  mizuhiki: { wall: 'paper', wallC: '#efe6d4', floor: 'tatami', floorC: '#b9b27a', light: 'window', hang: [], litter: [{ k: 'thread', c: '#e8e2d2' }], dock: ['scissors', 'spool:#d94c4c', 'spool:#f5f1e6', 'bead'], dockKind: 'ledge', frame: 'card', board: 'washi', words: { caption: 'Tie this knot' } },
  turkshead: { wall: 'sea', wallC: '#233a4c', floor: 'planks', floorC: '#7a6a52', light: 'window', hang: [], litter: [{ k: 'thread', c: '#e8dcc0' }], dock: ['marlinspike', 'spool:#e8dcc0', 'scissors'], dockKind: 'rail', frame: 'rail', board: 'spar', words: { caption: 'Work this knot' } },
  wirecar: { wall: 'pegboard', wallC: '#4a4f57', floor: 'planks', floorC: '#6a5238', light: 'window', hang: ['pliers', 'cutters', 'coil'], litter: [{ k: 'wire', c: '#d9b45a' }], dock: ['pliers', 'cutters', 'coil:#d9b45a'], dockKind: 'rail', frame: 'peg',
    board: 'jig', tool: 'pliers', words: { caption: 'Bend this car', hint: 'Drag the white points; drag a wheel by its rim' }, pitch: 1.0, wave: 'triangle' },
  wirebicycle: { wall: 'earth', wallC: '#b98a5a', floor: 'earth', floorC: '#8a5e36', light: 'window', hang: ['pliers', 'coil'], litter: [{ k: 'wire', c: '#c8cfd6' }], dock: ['cutters', 'coil:#c8cfd6', 'pliers'], dockKind: 'rail', frame: 'peg', board: 'jig', tool: 'pliers', words: { caption: 'Bend this bicycle' } },
  wirebird: { wall: 'shelf', wallC: '#3a4a5a', floor: 'planks', floorC: '#4a3a2a', light: 'lamp', shelf: [{ k: 'bird', c: '#d9b45a' }], litter: [{ k: 'wire', c: '#d9b45a' }], dock: ['pliers', 'coil:#d9b45a', 'cutters'], dockKind: 'ledge', frame: 'peg', board: 'jig', tool: 'pliers', words: { caption: 'Bend this bird' } },
  maskcarve: { wall: 'tools', wallC: '#6a4a2e', floor: 'planks', floorC: '#8a5f38', light: 'window', hang: ['gouge', 'mallet', 'chisel'], litter: [{ k: 'shavings', c: '#d9b57a' }], dock: ['gouge', 'chisel', 'mallet', 'pot:#c8281f', 'brush:#c8281f'], dockKind: 'ledge', frame: 'plinth',
    block: 'wood', seat: 'bench', tool: 'gouge', cavity: 'dark', fx: { kind: 'chip', c: '#d1a56c' }, pitch: 0.8, wave: 'triangle', words: { caption: 'Carve this mask' } },
  claymodel: { wall: 'earth', wallC: '#a8643a', floor: 'earth', floorC: '#8c5030', light: 'window', hang: [], litter: [{ k: 'clay', c: '#b5603a' }], dock: ['pick', 'bowl', 'waxloop', 'sponge'], dockKind: 'ledge', frame: 'plinth',
    block: 'clay', seat: 'board', tool: 'waxloop', cavity: 'dark', fx: { kind: 'chip', c: '#b5603a' }, pitch: 0.9, wave: 'sine', words: { caption: 'Model this figure' } },
  candy: { wall: 'stall', wallC: '#2a3a5a', floor: 'tin', floorC: '#9aa0a8', light: 'lamp', hang: [], litter: [{ k: 'sugar', c: '#f0c870' }], dock: ['press', 'pick', 'tongs'], dockKind: 'tray', frame: 'card',
    block: 'candy', seat: 'tin', tool: 'pick', cavity: 'dark', fx: { kind: 'spark', c: '#ffe29a' }, pitch: 1.7, wave: 'square', words: { caption: 'Cut out this shape' } },
  agaseke: { wall: 'shelf', wallC: '#c9a272', floor: 'weave', floorC: '#a8884a', light: 'window', shelf: [{ k: 'jar', c: '#b5472f' }], litter: [{ k: 'grass', c: '#c9a85a' }], dock: ['awl', 'grass:#c9a85a', 'scissors'], dockKind: 'ledge', frame: 'rail', words: { caption: 'Weave this basket' } },
  okavango: { wall: 'earth', wallC: '#c9a272', floor: 'earth', floorC: '#b08a58', light: 'window', hang: [], litter: [{ k: 'grass', c: '#b08a3a' }], dock: ['awl', 'grass:#b08a3a', 'bowl'], dockKind: 'ledge', frame: 'plinth', words: { caption: 'Coil this basket' } },
};

const RULES = [
  [/soapstone|kisii|tabaka/, 'soapstone'], [/lost.?wax|dhokra|igun|cire/, 'lostwax'], [/lippan|mud.{0,12}mirror/, 'lippan'], [/rishtan/, 'rishtan'],
  [/blue pottery|jaipur/, 'bluepottery'], [/celadon/, 'celadon'], [/terracotta jar|amphora/, 'terracotta'], [/matryoshka|nesting doll/, 'matryoshka'],
  [/shibori|indigo/, 'shibori'], [/origami|paper folding/, 'origami'], [/paper cutting|jianzhi|papel picado|kirigami/, 'papercut'],
  [/chinese knot|chinese knotting|pan-chang/, 'chineseknot'], [/celtic|interlace/, 'celtic'], [/mizuhiki/, 'mizuhiki'], [/turk/, 'turkshead'],
  [/wire bicycle|bicycle/, 'wirebicycle'], [/wire bird/, 'wirebird'], [/wire car|galimoto/, 'wirecar'], [/mask/, 'maskcarve'],
  [/terracotta horse|bankura/, 'claymodel'], [/honeycomb|dalgona|candy/, 'candy'], [/peace basket|agaseke/, 'agaseke'], [/okavango|coiled basket/, 'okavango'],
];
const BY_TECH = { lathe: 'terracotta', carve: 'soapstone', cut: 'papercut', fold: 'origami', coil: 'agaseke', knot: 'chineseknot', bend: 'wirecar' };
const BY_MATERIAL = { stone: 'soapstone', clay: 'claymodel', wood: 'maskcarve', metal: 'lostwax', candy: 'candy', paper: 'papercut' };

export const SCENE_IDS = Object.keys(S);
export function resolveScene(P = {}, text = {}, technique = 'lathe') {
  let id = typeof P.scene === 'string' && S[P.scene] ? P.scene : null;
  if (!id) {
    const key = [text.title, text.native, ...(text.alt ?? []), P.figure, P.profile, P.layout].filter(Boolean).join(' ').toLowerCase();
    for (const [re, sid] of RULES) if (re.test(key)) { id = sid; break; }
  }
  if (!id) id = (technique === 'carve' && BY_MATERIAL[P.material]) || BY_TECH[technique] || 'soapstone';
  return { id, ...S[id] };
}

// ---- ground: wall, bench, light, litter -------------------------------------------------------------------------------------
const wallH = (r) => Math.max(70, Math.min(150, r.h * 0.26));

function planks(ctx, x, y, w, h, c, vertical = true, pl = 26) {
  ctx.fillStyle = lg(ctx, x, y, x, y + h, [[0, tint(c, 0.12)], [1, tint(c, -0.2)]]); ctx.fillRect(x, y, w, h);
  ctx.lineWidth = 1;
  for (let px = x + (vertical ? pl : 0); px < x + w; px += pl) { ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + h); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.beginPath(); ctx.moveTo(px + 1.5, y); ctx.lineTo(px + 1.5, y + h); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.beginPath();
  for (let k = 0; k < 30; k++) { const gx = x + hash(k, 11) * w, gy = y + hash(k, 12) * h; ctx.moveTo(gx, gy); ctx.lineTo(gx + (hash(k, 13) - 0.5) * 6, gy + h * 0.2); }
  ctx.stroke();
}
function speckle(ctx, x, y, w, h, n, c, a, seed = 1, sz = 2) {
  ctx.fillStyle = rgba(c, a); ctx.beginPath();
  for (let k = 0; k < n; k++) ctx.rect(x + hash(k, seed) * w, y + hash(k, seed + 1) * h, sz * (0.5 + hash(k, seed + 2)), sz * (0.5 + hash(k, seed + 3)));
  ctx.fill();
}

const WALL = {
  plaster(ctx, s, r, H) { ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.15)], [1, s.wallC]]); ctx.fillRect(r.x, r.y, r.w, H); speckle(ctx, r.x, r.y, r.w, H, 120, '#000000', 0.07, 5, 3); },
  tools(ctx, s, r, H) {
    planks(ctx, r.x, r.y, r.w, H, s.wallC, true, 34);
    const ry = r.y + H * 0.55; ctx.fillStyle = lg(ctx, 0, ry - 6, 0, ry + 6, [[0, '#caa06a'], [1, '#6a4524']]); ctx.fillRect(r.x, ry - 6, r.w, 12);
    s.hang.forEach((n, i) => { const x = r.x + r.w * ((i + 0.5) / s.hang.length) * 0.96 + r.w * 0.02; drawProp(ctx, n, x, ry + H * 0.2, H * 0.5, Math.PI / 2 + (i % 2 ? 0.1 : -0.1)); ctx.fillStyle = '#444'; ell(ctx, x, ry, 3, 3); ctx.fill(); });
  },
  lamp(ctx, s, r, H, t) {
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#0e0906'], [1, s.wallC]]); ctx.fillRect(r.x, r.y, r.w, H);
    const lx = r.x + r.w * 0.82; ctx.strokeStyle = '#54402a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, r.y); ctx.lineTo(lx, r.y + H * 0.35); ctx.stroke();
    ctx.fillStyle = lg(ctx, lx - 22, 0, lx + 22, 0, [[0, '#6a4a1e'], [0.5, '#d8a640'], [1, '#5a3c14']]); ctx.beginPath(); ctx.moveTo(lx - 8, r.y + H * 0.35); ctx.lineTo(lx + 8, r.y + H * 0.35); ctx.lineTo(lx + 24, r.y + H * 0.58); ctx.lineTo(lx - 24, r.y + H * 0.58); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff1c0'; ell(ctx, lx, r.y + H * 0.6, 12, 5); ctx.fill();
  },
  window(ctx, s, r, H) {
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.1)], [1, tint(s.wallC, -0.12)]]); ctx.fillRect(r.x, r.y, r.w, H);
    const wx = r.x + r.w * 0.12, ww = r.w * 0.26, wy = r.y + H * 0.28, wh = H * 0.62;
    ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#fff8dc'], [1, '#bcd8f0']]); ctx.fillRect(wx, wy, ww, wh);
    ctx.strokeStyle = '#4a3420'; ctx.lineWidth = 4; ctx.strokeRect(wx, wy, ww, wh); ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
  },
  mud(ctx, s, r, H) {
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.12)], [1, s.wallC]]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.strokeStyle = 'rgba(120,80,50,0.25)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let k = 0; k < 9; k++) { const x = r.x + r.w * (0.05 + hash(k, 21) * 0.9), y = r.y + H * (0.3 + hash(k, 22) * 0.6); ctx.beginPath(); ctx.arc(x, y, 9 + hash(k, 23) * 8, 3.4, 5.7); ctx.stroke(); }
    const n = Math.max(8, Math.round(r.w / 34));
    for (let k = 0; k < n; k++) { const x = r.x + (r.w * (k + 0.5)) / n, y = r.y + H * 0.82; ctx.save(); ctx.translate(x, y); ctx.rotate(hash(k, 3) * TAU); ctx.fillStyle = lg(ctx, -6, -6, 6, 6, [[0, '#ffffff'], [0.5, '#bfdbe8'], [1, '#6b8fa6']]); ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(6, -5); ctx.lineTo(4, 6); ctx.lineTo(-5, 3); ctx.closePath(); ctx.fill(); ctx.restore(); }
  },
  arch(ctx, s, r, H) {
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.1)], [1, tint(s.wallC, -0.3)]]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
    for (let q = 0; q < r.w + H; q += 22) { ctx.beginPath(); ctx.moveTo(r.x + q, r.y); ctx.lineTo(r.x + q - H, r.y + H); ctx.stroke(); }
    const n = 3;
    for (let k = 0; k < n; k++) {
      const cx = r.x + (r.w * (k + 0.5)) / n, aw = Math.min(r.w / n * 0.5, H * 0.62), top = r.y + H * 0.12, bot = r.y + H;
      ctx.beginPath(); ctx.moveTo(cx - aw / 2, bot); ctx.lineTo(cx - aw / 2, top + aw / 2); ctx.arc(cx, top + aw / 2, aw / 2, Math.PI, 0); ctx.lineTo(cx + aw / 2, bot); ctx.closePath();
      ctx.fillStyle = rg(ctx, cx, top + H * 0.2, 2, aw, [[0, '#3a2412'], [1, '#150c06']]); ctx.fill(); ctx.strokeStyle = '#e8d8a0'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = '#2f9ab0'; ctx.lineWidth = 2; ctx.stroke();
    }
  },
  shelf(ctx, s, r, H) {
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.08)], [1, tint(s.wallC, -0.18)]]); ctx.fillRect(r.x, r.y, r.w, H);
    const by = r.y + H * 0.88; ctx.fillStyle = lg(ctx, 0, by, 0, by + 10, [[0, '#d6b27a'], [1, '#6a4824']]); ctx.fillRect(r.x, by, r.w, 10);
    const items = s.shelf ?? [];
    items.forEach((it, i) => {
      const x = r.x + r.w * (0.1 + (0.8 * (i + 0.5)) / items.length), h = H * 0.62, y = by;
      cast(ctx, x + 3, y - 1, h * 0.35, 4, 0.3);
      if (it.k === 'plate') { ctx.fillStyle = lg(ctx, 0, y - h * 0.5, 0, y, [[0, '#fff'], [1, tint(it.c, 0.2)]]); ell(ctx, x, y - h * 0.4, h * 0.42, h * 0.4); ctx.fill(); ctx.strokeStyle = it.c; ctx.lineWidth = 3; ctx.stroke(); ell(ctx, x, y - h * 0.4, h * 0.2, h * 0.19); ctx.stroke(); }
      else if (it.k === 'bird') { ctx.strokeStyle = it.c; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.ellipse(x, y - h * 0.45, h * 0.28, h * 0.17, -0.3, 0, TAU); ctx.moveTo(x + h * 0.22, y - h * 0.58); ctx.lineTo(x + h * 0.36, y - h * 0.52); ctx.moveTo(x - h * 0.05, y - h * 0.3); ctx.lineTo(x - h * 0.05, y); ctx.moveTo(x + h * 0.08, y - h * 0.3); ctx.lineTo(x + h * 0.08, y); ctx.stroke(); }
      else { ctx.fillStyle = lg(ctx, x - h * 0.3, 0, x + h * 0.3, 0, [[0, tint(it.c, -0.35)], [0.35, tint(it.c, 0.3)], [1, tint(it.c, -0.5)]]); ctx.beginPath(); ctx.moveTo(x - h * 0.12, y - h); ctx.quadraticCurveTo(x - h * 0.4, y - h * 0.55, x - h * 0.28, y); ctx.lineTo(x + h * 0.28, y); ctx.quadraticCurveTo(x + h * 0.4, y - h * 0.55, x + h * 0.12, y - h); ctx.closePath(); ctx.fill(); }
    });
  },
  lathe(ctx, s, r, H) {
    planks(ctx, r.x, r.y, r.w, H, s.wallC, true, 40);
    const by = r.y + H * 0.9; ctx.fillStyle = lg(ctx, 0, by - 10, 0, by + 6, [[0, '#d09a5a'], [1, '#5a3818']]); ctx.fillRect(r.x, by - 8, r.w, 12);
    // a finished nest of dolls on the shelf, the drive belt and pulley
    const n = 5, bx = r.x + r.w * 0.8;
    for (let k = 0; k < n; k++) {
      const h = H * (0.22 + 0.13 * (n - k)) * 0.8, w = h * 0.62, x = bx - k * w * 1.05 + w * 1.6, cols = ['#c8281f', '#2c5fb3', '#2f8a3e', '#f0b923', '#c8281f'];
      cast(ctx, x + 2, by - 1, w * 0.55, 3, 0.3);
      ctx.fillStyle = lg(ctx, x - w / 2, 0, x + w / 2, 0, [[0, tint(cols[k], -0.35)], [0.35, tint(cols[k], 0.28)], [1, tint(cols[k], -0.5)]]);
      ctx.beginPath(); ctx.moveTo(x - w * 0.34, by - h * 0.88); ctx.quadraticCurveTo(x - w * 0.5, by - h * 0.45, x - w * 0.5, by - h * 0.1); ctx.lineTo(x - w * 0.4, by); ctx.lineTo(x + w * 0.4, by); ctx.lineTo(x + w * 0.5, by - h * 0.1); ctx.quadraticCurveTo(x + w * 0.5, by - h * 0.45, x + w * 0.34, by - h * 0.88); ctx.quadraticCurveTo(x, by - h * 1.02, x - w * 0.34, by - h * 0.88); ctx.fill();
      ctx.fillStyle = '#f6e6c8'; ell(ctx, x, by - h * 0.62, w * 0.2, h * 0.14); ctx.fill();
    }
    const px = r.x + r.w * 0.12, py = r.y + H * 0.45; ctx.fillStyle = rg(ctx, px, py, 2, 22, [[0, '#d8dde2'], [1, '#4c555e']]); ell(ctx, px, py, 20, 20); ctx.fill(); ctx.strokeStyle = '#1c1c1c'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(px - 20, py); ctx.lineTo(px - 20, r.y + H); ctx.moveTo(px + 20, py); ctx.lineTo(px + 20, r.y + H); ctx.stroke();
  },
  rope(ctx, s, r, H, t) {
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#cdd4df'], [1, '#aab4c4']]); ctx.fillRect(r.x, r.y, r.w, H);
    const y = r.y + H * 0.22; ctx.strokeStyle = '#6a5438'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(r.x, y); ctx.quadraticCurveTo(r.x + r.w / 2, y + 10, r.x + r.w, y); ctx.stroke();
    const cols = ['#173a8a', '#2b5fb0', '#0f2a66', '#4b7ac4']; const n = Math.max(3, Math.round(r.w / 90));
    for (let k = 0; k < n; k++) {
      const x = r.x + (r.w * (k + 0.5)) / n, w = r.w / n * 0.7, h = H * (0.5 + 0.25 * hash(k, 3)), sw = Math.sin(t * 1.2 + k) * 2;
      ctx.fillStyle = lg(ctx, x - w / 2, 0, x + w / 2, 0, [[0, tint(cols[k % 4], -0.2)], [0.5, cols[k % 4]], [1, tint(cols[k % 4], -0.35)]]);
      ctx.beginPath(); ctx.moveTo(x - w / 2, y + 4); ctx.lineTo(x + w / 2, y + 4); ctx.lineTo(x + w / 2 + sw, y + h); ctx.lineTo(x - w / 2 + sw, y + h); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1.5; for (let q = 1; q < 5; q++) { ctx.beginPath(); ctx.arc(x + sw * 0.5, y + h * 0.22 * q, w * 0.1 * q, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = '#d6b27a'; ctx.fillRect(x - w * 0.3, y - 2, 5, 12); ctx.fillRect(x + w * 0.3 - 5, y - 2, 5, 12);
    }
  },
  paper(ctx, s, r, H) {
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.12)], [1, s.wallC]]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.strokeStyle = 'rgba(120,70,30,0.35)'; ctx.lineWidth = 2; for (let k = 0; k < r.w; k += 46) { ctx.beginPath(); ctx.moveTo(r.x + k, r.y); ctx.lineTo(r.x + k, r.y + H); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(r.x, r.y + H * 0.5); ctx.lineTo(r.x + r.w, r.y + H * 0.5); ctx.stroke();
    // pasted red cut-outs
    for (let k = 0; k < 4; k++) { const x = r.x + r.w * (0.13 + k * 0.25), y = r.y + H * 0.55, q = H * 0.2; ctx.fillStyle = '#c8201a'; for (let p = 0; p < 6; p++) { ctx.save(); ctx.translate(x, y); ctx.rotate((p * TAU) / 6); ell(ctx, 0, -q * 0.55, q * 0.22, q * 0.5); ctx.fill(); ctx.restore(); } ctx.fillStyle = s.wallC; ell(ctx, x, y, q * 0.18, q * 0.18); ctx.fill(); }
  },
  silk(ctx, s, r, H) {
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.15)], [1, tint(s.wallC, -0.25)]]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 6; for (let q = 0; q < r.w; q += 38) { ctx.beginPath(); ctx.moveTo(r.x + q, r.y); ctx.lineTo(r.x + q + 6, r.y + H); ctx.stroke(); }
    // gold lattice window pattern and a hanging lantern
    ctx.strokeStyle = '#e0b84a'; ctx.lineWidth = 1.5; const g = 18; ctx.beginPath(); for (let x = r.x + r.w * 0.5; x < r.x + r.w; x += g) { ctx.moveTo(x, r.y + 8); ctx.lineTo(x, r.y + H - 8); } for (let y = r.y + 8; y < r.y + H - 8; y += g) { ctx.moveTo(r.x + r.w * 0.5, y); ctx.lineTo(r.x + r.w, y); } ctx.stroke();
    const lx = r.x + r.w * 0.2, ly = r.y + H * 0.58, lr = H * 0.22; ctx.strokeStyle = '#e0b84a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, r.y); ctx.lineTo(lx, ly - lr); ctx.stroke();
    ctx.fillStyle = rg(ctx, lx, ly, 2, lr * 1.4, [[0, '#ff7a4a'], [0.5, '#d1202f'], [1, '#7a0a14']]); ell(ctx, lx, ly, lr * 0.85, lr); ctx.fill(); ctx.strokeStyle = '#f0c14a'; ctx.stroke();
    ctx.strokeStyle = '#d1202f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx, ly + lr); ctx.lineTo(lx, ly + lr + H * 0.12); ctx.stroke();
  },
  stone(ctx, s, r, H) {
    ctx.fillStyle = s.wallC; ctx.fillRect(r.x, r.y, r.w, H); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
    const bh = H / 3; for (let row = 0; row < 3; row++) { const off = row % 2 ? 30 : 0; for (let x = r.x - off; x < r.x + r.w; x += 60) { ctx.strokeRect(x, r.y + row * bh, 60, bh); ctx.fillStyle = `rgba(255,255,255,${0.03 + hash(row, x | 0) * 0.05})`; ctx.fillRect(x + 1, r.y + row * bh + 1, 58, bh - 2); } }
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.35)']]); ctx.fillRect(r.x, r.y, r.w, H);
  },
  sea(ctx, s, r, H) {
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#6a8cb0'], [0.55, '#9ab8d0'], [0.56, '#233a4c'], [1, '#12202c']]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5; for (let k = 0; k < 10; k++) { const x = r.x + r.w * hash(k, 31), y = r.y + H * (0.62 + hash(k, 32) * 0.3); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 10, y - 3, x + 22, y); ctx.stroke(); }
    ctx.strokeStyle = '#d9c9a0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(r.x + r.w * 0.8, r.y); ctx.lineTo(r.x + r.w * 0.8, r.y + H * 0.8); ctx.moveTo(r.x + r.w * 0.8, r.y + H * 0.1); ctx.lineTo(r.x + r.w * 0.97, r.y + H * 0.6); ctx.stroke();
  },
  earth(ctx, s, r, H) { ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.12)], [1, tint(s.wallC, -0.15)]]); ctx.fillRect(r.x, r.y, r.w, H); speckle(ctx, r.x, r.y, r.w, H, 160, '#3a1c0c', 0.12, 8, 3); speckle(ctx, r.x, r.y, r.w, H, 70, '#ffffff', 0.08, 9, 2); },
  pegboard(ctx, s, r, H) {
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.1)], [1, tint(s.wallC, -0.25)]]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); for (let x = r.x + 12; x < r.x + r.w; x += 20) for (let y = r.y + 12; y < r.y + H; y += 20) { ctx.moveTo(x + 2, y); ctx.arc(x, y, 2, 0, TAU); } ctx.fill();
    const n = s.hang.length;
    s.hang.forEach((k, i) => { const x = r.x + r.w * (0.13 + (0.74 * i) / Math.max(1, n - 1)); ctx.save(); ctx.globalAlpha = 0.95; drawProp(ctx, k, x, r.y + H * 0.55, H * 0.7, Math.PI / 2 + 0.12 * (i - 1), { c: '#d9b45a' }); ctx.restore(); });
  },
  stall(ctx, s, r, H) {
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#101a30'], [1, s.wallC]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let k = 0; k < 14; k++) { const x = r.x + r.w * hash(k, 41), y = r.y + H * (0.1 + hash(k, 42) * 0.5); ctx.fillStyle = rg(ctx, x, y, 0, 9, [[0, 'rgba(255,226,140,0.9)'], [1, 'rgba(255,200,80,0)']]); ell(ctx, x, y, 9, 9); ctx.fill(); }
    ctx.fillStyle = '#c8281f'; ctx.beginPath(); for (let x = r.x; x < r.x + r.w; x += 28) { ctx.moveTo(x, r.y); ctx.lineTo(x + 28, r.y); ctx.lineTo(x + 14, r.y + 18); ctx.closePath(); } ctx.fill();
  },
};

const FLOOR_KIND = { slab: 'slate', planks: 'wood', mud: 'felt', tile: 'slate', cloth: 'weave', felt: 'felt', mat: 'mat', lacquer: 'felt', parchment: 'felt', tatami: 'weave', earth: 'felt', weave: 'weave', tin: 'slate' };
const FLOOR_EX = {
  tile(ctx, r, c) { const t = 46; ctx.lineWidth = 2; for (let y = r.y; y < r.y + r.h; y += t) for (let x = r.x; x < r.x + r.w; x += t) { ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.strokeRect(x, y, t, t); ctx.fillStyle = `rgba(255,255,255,${0.02 + hash(x | 0, y | 0) * 0.06})`; ctx.fillRect(x + 1, y + 1, t - 2, t - 2); } },
  tatami(ctx, r) { ctx.strokeStyle = 'rgba(40,50,10,0.5)'; ctx.lineWidth = 3; for (let x = r.x; x < r.x + r.w; x += 160) { ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); ctx.stroke(); } },
  lacquer(ctx, r, c) { const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h); g.addColorStop(0, 'rgba(255,255,255,0.12)'); g.addColorStop(0.4, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.25)'); ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.strokeStyle = '#d4a63a'; ctx.lineWidth = 3; ctx.strokeRect(r.x + 8, r.y + 8, r.w - 16, r.h - 16); },
  parchment(ctx, r) { speckle(ctx, r.x, r.y, r.w, r.h, 140, '#5a4018', 0.1, 17, 3); },
  tin(ctx, r) { ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 3; for (let y = r.y; y < r.y + r.h; y += 14) { ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke(); } },
  mud(ctx, r) { ctx.strokeStyle = 'rgba(70,40,20,0.22)'; ctx.lineWidth = 4; ctx.lineCap = 'round'; for (let k = 0; k < 26; k++) { const x = r.x + r.w * hash(k, 51), y = r.y + r.h * hash(k, 52); ctx.beginPath(); ctx.arc(x, y, 10 + hash(k, 53) * 10, 0.2, 2.8); ctx.stroke(); } },
  earth(ctx, r) { speckle(ctx, r.x, r.y, r.w, r.h, 220, '#2a1408', 0.18, 61, 3); speckle(ctx, r.x, r.y, r.w, r.h, 80, '#e8c898', 0.14, 62, 2); },
};

const LITTER = {
  dust(ctx, r, c) { for (let k = 0; k < 6; k++) { const x = r.x + r.w * hash(k, 71), y = r.y + r.h * (0.15 + hash(k, 72) * 0.85), q = 14 + hash(k, 73) * 26; ctx.fillStyle = rg(ctx, x, y, 0, q, [[0, rgba(c, 0.5)], [1, rgba(c, 0)]]); ell(ctx, x, y, q, q * 0.5); ctx.fill(); } },
  shavings(ctx, r, c) { for (let k = 0; k < 10; k++) { const x = r.x + r.w * hash(k, 74), y = r.y + r.h * (0.2 + hash(k, 75) * 0.8); ctx.strokeStyle = tint(c, (hash(k, 3) - 0.5) * 0.3); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, 5 + hash(k, 5) * 5, 0.4, 5.4); ctx.stroke(); } },
  wax(ctx, r, c) { for (let k = 0; k < 7; k++) { const x = r.x + r.w * hash(k, 76), y = r.y + r.h * (0.3 + hash(k, 77) * 0.7); ctx.fillStyle = rgba(c, 0.8); ell(ctx, x, y, 3 + hash(k, 3) * 5, 2 + hash(k, 4) * 3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ell(ctx, x - 1, y - 1, 1.5, 1); ctx.fill(); } },
  mirror(ctx, r, c) { for (let k = 0; k < 8; k++) { const x = r.x + r.w * hash(k, 78), y = r.y + r.h * (0.3 + hash(k, 79) * 0.7); ctx.save(); ctx.translate(x, y); ctx.rotate(hash(k, 4) * TAU); ctx.fillStyle = lg(ctx, -4, -4, 4, 4, [[0, '#fff'], [1, c]]); ctx.beginPath(); ctx.moveTo(-4, -3); ctx.lineTo(4, -4); ctx.lineTo(3, 4); ctx.closePath(); ctx.fill(); ctx.restore(); } },
  clay(ctx, r, c) { for (let k = 0; k < 8; k++) { const x = r.x + r.w * hash(k, 80), y = r.y + r.h * (0.3 + hash(k, 81) * 0.7); ctx.fillStyle = rgba(tint(c, -0.1), 0.85); ell(ctx, x, y, 4 + hash(k, 3) * 6, 3 + hash(k, 4) * 3, hash(k, 6)); ctx.fill(); } },
  splash(ctx, r, c) { for (let k = 0; k < 8; k++) { const x = r.x + r.w * hash(k, 82), y = r.y + r.h * (0.3 + hash(k, 83) * 0.7), q = 3 + hash(k, 3) * 8; ctx.fillStyle = rgba(c, 0.55); ell(ctx, x, y, q, q * 0.7); ctx.fill(); for (let d = 0; d < 3; d++) { ell(ctx, x + (hash(k, d + 9) - 0.5) * q * 3, y + (hash(k, d + 12) - 0.5) * q * 2, 1.5, 1.5); ctx.fill(); } } },
  scraps(ctx, r, c) { for (let k = 0; k < 7; k++) { const x = r.x + r.w * hash(k, 84), y = r.y + r.h * (0.3 + hash(k, 85) * 0.7); ctx.save(); ctx.translate(x, y); ctx.rotate(hash(k, 4) * TAU); ctx.fillStyle = tint(c, (hash(k, 7) - 0.5) * 0.2); ctx.fillRect(-5, -3, 10, 6); ctx.restore(); } },
  thread(ctx, r, c) { ctx.strokeStyle = rgba(c, 0.8); ctx.lineWidth = 2; ctx.lineCap = 'round'; for (let k = 0; k < 4; k++) { const x = r.x + r.w * hash(k, 86), y = r.y + r.h * (0.4 + hash(k, 87) * 0.6); ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 20, y - 14, x + 30, y + 14, x + 52, y + 2); ctx.stroke(); } },
  wire(ctx, r, c) { ctx.strokeStyle = c; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; for (let k = 0; k < 5; k++) { const x = r.x + r.w * hash(k, 88), y = r.y + r.h * (0.4 + hash(k, 89) * 0.6); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 8 + hash(k, 3) * 14, y + (hash(k, 4) - 0.5) * 10); ctx.stroke(); } },
  sugar(ctx, r, c) { for (let k = 0; k < 16; k++) { ctx.fillStyle = rgba(c, 0.8); ctx.fillRect(r.x + r.w * hash(k, 90), r.y + r.h * (0.3 + hash(k, 91) * 0.7), 2.5, 2.5); } },
  grass(ctx, r, c) { ctx.strokeStyle = c; ctx.lineWidth = 2; for (let k = 0; k < 8; k++) { const x = r.x + r.w * hash(k, 92), y = r.y + r.h * (0.4 + hash(k, 93) * 0.6); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 20, y + (hash(k, 4) - 0.5) * 8); ctx.stroke(); } },
};

// Dock: how big the strip of tools along the bottom of the work rect is.
export function dockHeight(r) { return Math.max(46, Math.min(78, r.h * 0.16)); }
export const wallLift = (r) => Math.round(0.6 * wallH(r));
export function splitWork(r) { const d = dockHeight(r); return { work: { x: r.x, y: r.y, w: r.w, h: r.h - d }, dock: { x: r.x, y: r.y + r.h - d, w: r.w, h: d } }; }

export function drawGround(ctx, s, r, t) {
  ctx.save(); rrect(ctx, r.x, r.y, r.w, r.h, 16); ctx.clip();
  surface(ctx, r, FLOOR_KIND[s.floor] ?? 'wood', mix('#101010', s.floorC, 0.95));
  FLOOR_EX[s.floor]?.(ctx, r, s.floorC);
  const H = wallH(r);
  (WALL[s.wall] ?? WALL.plaster)(ctx, s, r, H, t);
  // bench lip where the wall meets the bench
  ctx.fillStyle = lg(ctx, 0, r.y + H - 2, 0, r.y + H + 12, [[0, 'rgba(0,0,0,0.55)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(r.x, r.y + H - 2, r.w, 14);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(r.x, r.y + H - 3, r.w, 2);
  for (const l of s.litter ?? []) LITTER[l.k]?.(ctx, { x: r.x, y: r.y + H, w: r.w, h: r.h - H }, l.c);
  if (s.light === 'window') { // a slanted beam of daylight across the bench
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w * 0.5, r.y + r.h); g.addColorStop(0, 'rgba(255,240,200,0.14)'); g.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(r.x + r.w * 0.1, r.y + H * 0.3); ctx.lineTo(r.x + r.w * 0.42, r.y + H * 0.3); ctx.lineTo(r.x + r.w * 0.9, r.y + r.h); ctx.lineTo(r.x + r.w * 0.3, r.y + r.h); ctx.closePath(); ctx.fill(); ctx.restore();
  } else if (s.light === 'lamp') {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const cx = r.x + r.w * 0.78, cy = r.y + H * 0.9, g = ctx.createRadialGradient(cx, cy, 8, cx, cy + r.h * 0.2, r.w * 0.8); g.addColorStop(0, 'rgba(255,200,110,0.3)'); g.addColorStop(1, 'rgba(255,170,60,0)');
    ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.restore();
  }
  const sg = ctx.createLinearGradient(0, r.y, 0, r.y + 46); sg.addColorStop(0, 'rgba(0,0,0,0.55)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = sg; ctx.fillRect(r.x, r.y, r.w, 46);
  ctx.restore();
}

// The tool dock: a strip of tools and supplies laid out along the bottom of the work rect.
export function drawDock(ctx, s, d, t) {
  const n = s.dock.length;
  ctx.save();
  const kind = s.dockKind;
  if (kind === 'tray') { rrect(ctx, d.x + 6, d.y + 4, d.w - 12, d.h - 8, 10); ctx.fillStyle = lg(ctx, 0, d.y, 0, d.y + d.h, [[0, 'rgba(0,0,0,0.5)'], [1, 'rgba(0,0,0,0.25)']]); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; ctx.stroke(); }
  else if (kind === 'ledge') { ctx.fillStyle = lg(ctx, 0, d.y, 0, d.y + d.h, [[0, 'rgba(0,0,0,0.38)'], [1, 'rgba(0,0,0,0.12)']]); ctx.fillRect(d.x, d.y, d.w, d.h); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(d.x, d.y, d.w, 2); }
  else if (kind === 'cloth') { ctx.fillStyle = 'rgba(245,235,215,0.22)'; rrect(ctx, d.x + 8, d.y + 6, d.w - 16, d.h - 10, 6); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]); }
  const sz = Math.min(d.h * 1.45, (d.w / n) * 1.05);
  s.dock.forEach((spec, i) => {
    const [name, c] = spec.split(':'), x = d.x + (d.w * (i + 0.5)) / n, y = d.y + d.h * 0.52, rot = (i % 2 ? 1 : -1) * 0.14;
    drawProp(ctx, name, x, y, sz * (name === 'pot' || name === 'bowl' || name === 'sponge' || name === 'vat' || name === 'bead' ? 0.95 : 1), ['pot', 'bowl', 'sponge', 'vat', 'spirit', 'coil', 'bead', 'mudbowl', 'mirrors', 'spool', 'stone', 'paper', 'press', 'waxblock', 'pins', 'grass'].includes(name) ? 0 : rot, { c, t });
  });
  ctx.restore();
}

// ---- reference frames --------------------------------------------------------------------------------------------------------
// Draws the frame in which the finished piece is shown and returns the inner rect the technique draws its target in.
export function drawFrame(ctx, s, r, pal) {
  const { x, y, w, h } = r, k = s.frame;
  if (k === 'case' || !FRAMES[k]) return { inner: displayCase(ctx, r, pal.accent, pal.bg), glass: true };
  return { inner: FRAMES[k](ctx, s, x, y, w, h, pal), glass: false };
}
const FRAMES = {
  plinth(ctx, s, x, y, w, h, pal) {
    shadowed(ctx, () => { rrect(ctx, x, y, w, h, 12); ctx.fillStyle = '#17120e'; ctx.fill(); }, { blur: 14, dy: 6, a: 0.5 });
    ctx.save(); rrect(ctx, x, y, w, h, 12); ctx.clip();
    ctx.fillStyle = rg(ctx, x + w / 2, y + h * 0.1, 4, h * 1.1, [[0, 'rgba(255,238,200,0.95)'], [0.5, 'rgba(120,96,70,1)'], [1, '#1b140f']]); ctx.fillRect(x, y, w, h);
    ctx.fillStyle = lg(ctx, 0, y + h * 0.87, 0, y + h, [[0, '#d9c3a0'], [1, '#6a5640']]); ctx.fillRect(x, y + h * 0.87, w, h * 0.13);
    ctx.fillStyle = '#e9cd7a'; ctx.fillRect(x + w * 0.36, y + h * 0.915, w * 0.28, 4);
    ctx.restore(); ctx.strokeStyle = tint(pal.accent, -0.2); ctx.lineWidth = 3; rrect(ctx, x, y, w, h, 12); ctx.stroke();
    return { x: x + 4, y: y + 4, w: w - 8, h: h - 8 };
  },
  card(ctx, s, x, y, w, h, pal) {
    shadowed(ctx, () => { rrect(ctx, x, y, w, h, 4); ctx.fillStyle = '#efe6d2'; ctx.fill(); }, { blur: 12, dy: 6, a: 0.5 });
    ctx.fillStyle = lg(ctx, x, y, x + w, y + h, [[0, '#fbf5e6'], [1, '#d9cfb6']]); rrect(ctx, x, y, w, h, 4); ctx.fill();
    ctx.fillStyle = 'rgba(30,24,16,0.88)'; rrect(ctx, x + 7, y + 7, w - 14, h - 14, 2); ctx.fill();
    ctx.fillStyle = rg(ctx, x + w / 2, y + h * 0.3, 2, w, [[0, 'rgba(255,255,255,0.22)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(x + 7, y + 7, w - 14, h - 14);
    ctx.fillStyle = lg(ctx, 0, 0, 1, 0, [[0, '#f2e6a0'], [1, '#d9c868']]); ctx.save(); ctx.translate(x + w / 2, y + 1); ctx.rotate(-0.05); ctx.globalAlpha = 0.85; ctx.fillRect(-w * 0.14, -7, w * 0.28, 16); ctx.restore();
    return { x: x + 7, y: y + 7, w: w - 14, h: h - 14 };
  },
  peg(ctx, s, x, y, w, h, pal) {
    shadowed(ctx, () => { rrect(ctx, x, y, w, h, 8); ctx.fillStyle = '#2a2c30'; ctx.fill(); }, { blur: 12, dy: 6, a: 0.5 });
    ctx.fillStyle = lg(ctx, x, y, x + w, y + h, [[0, '#4a4e56'], [1, '#262830']]); rrect(ctx, x, y, w, h, 8); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); for (let gx = x + 12; gx < x + w - 4; gx += 16) for (let gy = y + 12; gy < y + h - 4; gy += 16) { ctx.moveTo(gx + 1.8, gy); ctx.arc(gx, gy, 1.8, 0, TAU); } ctx.fill();
    ctx.fillStyle = 'rgba(14,16,20,0.78)'; rrect(ctx, x + 8, y + 8, w - 16, h - 16, 4); ctx.fill();
    ctx.strokeStyle = '#c8cfd6'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 18, y + 8); ctx.lineTo(x + 18, y + 2); ctx.moveTo(x + w - 18, y + 8); ctx.lineTo(x + w - 18, y + 2); ctx.stroke();
    return { x: x + 8, y: y + 8, w: w - 16, h: h - 16 };
  },
  niche(ctx, s, x, y, w, h, pal) {
    ctx.save(); const ar = w * 0.5;
    const path = () => { ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + ar); ctx.arc(x + w / 2, y + ar, ar, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.closePath(); };
    shadowed(ctx, () => { path(); ctx.fillStyle = '#e8d8a0'; ctx.fill(); }, { blur: 14, dy: 6, a: 0.5 });
    path(); ctx.fillStyle = lg(ctx, x, y, x + w, y, [[0, '#2f9ab0'], [0.5, '#e8d8a0'], [1, '#1a4a9a']]); ctx.fill();
    const q = 7; ctx.save(); path(); ctx.clip();
    ctx.fillStyle = '#1b1008'; ctx.beginPath(); ctx.moveTo(x + q, y + h); ctx.lineTo(x + q, y + ar); ctx.arc(x + w / 2, y + ar, ar - q, Math.PI, 0); ctx.lineTo(x + w - q, y + h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = rg(ctx, x + w / 2, y + h * 0.3, 2, w, [[0, 'rgba(255,220,160,0.65)'], [1, 'rgba(60,40,20,0)']]); ctx.fillRect(x, y, w, h);
    ctx.fillStyle = lg(ctx, 0, y + h * 0.88, 0, y + h, [[0, '#c9a06a'], [1, '#6a4a2a']]); ctx.fillRect(x, y + h * 0.88, w, h * 0.12);
    ctx.restore(); ctx.restore();
    return { x: x + q, y: y + ar * 0.35, w: w - q * 2, h: h - ar * 0.35 - 2 };
  },
  rail(ctx, s, x, y, w, h, pal) {
    shadowed(ctx, () => { rrect(ctx, x, y, w, h, 8); ctx.fillStyle = '#3a2418'; ctx.fill(); }, { blur: 12, dy: 6, a: 0.5 });
    planks(ctx, x, y, w, h, '#6a4a30', true, 26);
    ctx.save(); rrect(ctx, x, y, w, h, 8); ctx.clip(); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, y, w, h); ctx.restore();
    ctx.fillStyle = lg(ctx, 0, y + h - 18, 0, y + h, [[0, '#e9cf9a'], [1, '#8a6034']]); rrect(ctx, x - 4, y + h - 16, w + 8, 14, 4); ctx.fill();
    ctx.strokeStyle = '#d6b05a'; ctx.lineWidth = 2; rrect(ctx, x, y, w, h, 8); ctx.stroke();
    return { x: x + 4, y: y + 4, w: w - 8, h: h - 20 };
  },
  cloth(ctx, s, x, y, w, h, pal) {
    ctx.strokeStyle = '#6a5438'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 6, y + 4); ctx.quadraticCurveTo(x + w / 2, y + 12, x + w + 6, y + 4); ctx.stroke();
    shadowed(ctx, () => { ctx.fillStyle = '#f2efe6'; ctx.fillRect(x + 4, y + 10, w - 8, h - 14); }, { blur: 12, dy: 8, a: 0.4 });
    ctx.fillStyle = lg(ctx, x, y, x + w, y + h, [[0, '#2a4a9a'], [0.22, '#e8ecf4'], [0.78, '#e8ecf4'], [1, '#14307a']]); ctx.fillRect(x + 4, y + 10, w - 8, h - 14);
    ctx.strokeStyle = 'rgba(30,50,110,0.14)'; ctx.lineWidth = 1; ctx.beginPath(); for (let q = x + 6; q < x + w - 6; q += 5) { ctx.moveTo(q, y + 10); ctx.lineTo(q, y + h - 4); } ctx.stroke();
    for (const px of [x + w * 0.2, x + w * 0.8]) { ctx.fillStyle = lg(ctx, px - 6, 0, px + 6, 0, [[0, '#e0b872'], [1, '#8a6030']]); rrect(ctx, px - 6, y - 2, 12, 24, 3); ctx.fill(); }
    return { x: x + 12, y: y + 20, w: w - 24, h: h - 30 };
  },
  mirror(ctx, s, x, y, w, h, pal) {
    shadowed(ctx, () => { rrect(ctx, x, y, w, h, 14); ctx.fillStyle = '#7a5434'; ctx.fill(); }, { blur: 14, dy: 6, a: 0.5 });
    ctx.fillStyle = lg(ctx, x, y, x + w, y + h, [[0, '#d2b692'], [1, '#9a7650']]); rrect(ctx, x, y, w, h, 14); ctx.fill();
    ctx.strokeStyle = 'rgba(80,50,30,0.35)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.arc(x + w * hash(k, 33), y + h * hash(k, 34), 8, 3.4, 5.6); ctx.stroke(); }
    const n = Math.round((w + h) / 18);
    for (let k = 0; k < n; k++) { const u = k / n, per = (w + h) * 2, d = u * per; let px, py; if (d < w) { px = x + d; py = y + 6; } else if (d < w + h) { px = x + w - 6; py = y + d - w; } else if (d < 2 * w + h) { px = x + w - (d - w - h); py = y + h - 6; } else { px = x + 6; py = y + h - (d - 2 * w - h); } ctx.save(); ctx.translate(px, py); ctx.rotate(hash(k, 3) * TAU); ctx.fillStyle = lg(ctx, -4, -4, 4, 4, [[0, '#fff'], [1, '#7f9db0']]); ctx.fillRect(-3.5, -3.5, 7, 7); ctx.restore(); }
    ctx.fillStyle = 'rgba(30,18,10,0.85)'; rrect(ctx, x + 14, y + 14, w - 28, h - 28, 6); ctx.fill();
    return { x: x + 14, y: y + 14, w: w - 28, h: h - 28 };
  },
  tile(ctx, s, x, y, w, h, pal) {
    shadowed(ctx, () => { rrect(ctx, x, y, w, h, 6); ctx.fillStyle = '#6a3a1e'; ctx.fill(); }, { blur: 12, dy: 6, a: 0.5 });
    ctx.fillStyle = lg(ctx, x, y, x + w, y + h, [[0, '#c0794a'], [1, '#7a3f22']]); rrect(ctx, x, y, w, h, 6); ctx.fill();
    speckle(ctx, x, y, w, h, 90, '#2a1208', 0.18, 95, 2.4);
    ctx.fillStyle = 'rgba(16,10,6,0.82)'; rrect(ctx, x + 10, y + 10, w - 20, h - 20, 4); ctx.fill();
    ctx.fillStyle = rg(ctx, x + w * 0.5, y + h * 0.3, 2, w * 0.9, [[0, 'rgba(255,200,120,0.35)'], [1, 'rgba(255,200,120,0)']]); ctx.fillRect(x + 10, y + 10, w - 20, h - 20);
    return { x: x + 10, y: y + 10, w: w - 20, h: h - 20 };
  },
};

// A hand tool at the pointer.
export function drawTool(ctx, s, kind, x, y, size, t, o = {}) { drawHeld(ctx, kind ?? s.tool ?? 'chisel', x, y, size, t, o); }

// Small tone helper: scene pitch and wave so each craft sounds like its own tool.
export function toneOf(s, freq, o = {}) { return { freq: freq * (s.pitch ?? 1), type: s.wave ?? o.type ?? 'triangle', ...o }; }

// A small stage for the title screen: the workshop wall, bench and a few tools framed in a rounded panel.
export function drawStage(ctx, s, rect, t) {
  const r = { x: rect.x, y: rect.y, w: rect.w, h: rect.h };
  ctx.save(); shadowed(ctx, () => { rrect(ctx, r.x, r.y, r.w, r.h, 20); ctx.fillStyle = '#000'; ctx.fill(); }, { blur: 18, dy: 8, a: 0.5 });
  drawGround(ctx, s, r, t);
  const d = { x: r.x, y: r.y + r.h - Math.min(70, r.h * 0.2), w: r.w, h: Math.min(70, r.h * 0.2) };
  ctx.save(); rrect(ctx, r.x, r.y, r.w, r.h, 20); ctx.clip(); drawDock(ctx, s, d, t); ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2; rrect(ctx, r.x, r.y, r.w, r.h, 20); ctx.stroke();
  ctx.restore();
  return { x: r.x, y: r.y, w: r.w, h: r.h - d.h };
}

// What the block sits on while it is worked: a sandbag, a brass tray, a rim of mud and mirrors, a cutting mat, a bench board.
export function drawSeat(ctx, kind, x, y, w, h, cs, base, t = 0) {
  const m = cs * 0.9;
  const X = x - m, Y = y - m, Wd = w + m * 2, Ht = h + m * 2;
  ctx.save();
  if (kind === 'sandbag') {
    shadowed(ctx, () => { rrect(ctx, X, Y + m * 0.2, Wd, Ht, m * 1.2); ctx.fillStyle = '#6a5436'; ctx.fill(); }, { blur: 20, dy: 12, a: 0.55 });
    rrect(ctx, X, Y + m * 0.2, Wd, Ht, m * 1.2); ctx.fillStyle = lg(ctx, X, Y, X + Wd, Y + Ht, [[0, '#c9ab76'], [1, '#7a5e36']]); ctx.fill();
    ctx.save(); rrect(ctx, X, Y + m * 0.2, Wd, Ht, m * 1.2); ctx.clip(); ctx.strokeStyle = 'rgba(60,40,15,0.28)'; ctx.lineWidth = 1;
    for (let q = 0; q < Wd + Ht; q += 5) { ctx.beginPath(); ctx.moveTo(X + q, Y); ctx.lineTo(X + q - Ht, Y + Ht); ctx.stroke(); }
    ctx.restore(); ctx.strokeStyle = 'rgba(40,24,8,0.5)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); rrect(ctx, X + 5, Y + m * 0.2 + 5, Wd - 10, Ht - 10, m); ctx.stroke(); ctx.setLineDash([]);
  } else if (kind === 'tray') {
    shadowed(ctx, () => { rrect(ctx, X, Y, Wd, Ht, 10); ctx.fillStyle = '#5a3c10'; ctx.fill(); }, { blur: 20, dy: 12, a: 0.6 });
    rrect(ctx, X, Y, Wd, Ht, 10); ctx.fillStyle = lg(ctx, X, Y, X + Wd, Y + Ht, [[0, '#f4d98a'], [0.4, '#b98a2c'], [1, '#6a4a12']]); ctx.fill();
    rrect(ctx, X + 6, Y + 6, Wd - 12, Ht - 12, 6); ctx.fillStyle = lg(ctx, X, Y, X + Wd, Y + Ht, [[0, '#7a5416'], [1, '#c9a04a']]); ctx.fill();
  } else if (kind === 'mudrim') {
    shadowed(ctx, () => { rrect(ctx, X, Y, Wd, Ht, m * 0.9); ctx.fillStyle = '#5a3a22'; ctx.fill(); }, { blur: 18, dy: 10, a: 0.55 });
    rrect(ctx, X, Y, Wd, Ht, m * 0.9); ctx.fillStyle = lg(ctx, X, Y, X + Wd, Y + Ht, [[0, '#e0c9a4'], [1, '#a88660']]); ctx.fill();
    ctx.strokeStyle = 'rgba(110,70,40,0.35)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    const pts = Math.round((Wd + Ht) / 14);
    for (let k = 0; k < pts; k++) {
      const d = ((k + 0.5) / pts) * (Wd + Ht) * 2; let px, py;
      if (d < Wd) { px = X + d; py = Y + m * 0.5; } else if (d < Wd + Ht) { px = X + Wd - m * 0.5; py = Y + (d - Wd); } else if (d < 2 * Wd + Ht) { px = X + Wd - (d - Wd - Ht); py = Y + Ht - m * 0.5; } else { px = X + m * 0.5; py = Y + Ht - (d - 2 * Wd - Ht); }
      ctx.save(); ctx.translate(px, py); ctx.rotate(hash(k, 9) * TAU); ctx.fillStyle = lg(ctx, -m * 0.25, -m * 0.25, m * 0.25, m * 0.25, [[0, '#ffffff'], [0.5, '#bcd8e8'], [1, '#5d83a0']]);
      const gl = (Math.sin(t * 2 + k) + 1) / 2; ctx.beginPath(); ctx.moveTo(-m * 0.22, -m * 0.14); ctx.lineTo(m * 0.24, -m * 0.2); ctx.lineTo(m * 0.18, m * 0.22); ctx.lineTo(-m * 0.2, m * 0.16); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = `rgba(90,60,30,${0.5 + gl * 0.1})`; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
    }
  } else if (kind === 'mat') {
    shadowed(ctx, () => { rrect(ctx, X, Y, Wd, Ht, 6); ctx.fillStyle = '#16251c'; ctx.fill(); }, { blur: 14, dy: 8, a: 0.5 });
    rrect(ctx, X, Y, Wd, Ht, 6); ctx.fillStyle = lg(ctx, X, Y, X + Wd, Y + Ht, [[0, '#3f6a52'], [1, '#27402f']]); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); for (let q = 0; q <= Wd; q += cs) { ctx.moveTo(X + q, Y); ctx.lineTo(X + q, Y + (q % (cs * 5) < 1 ? m * 0.7 : m * 0.4)); } for (let q = 0; q <= Ht; q += cs) { ctx.moveTo(X, Y + q); ctx.lineTo(X + (q % (cs * 5) < 1 ? m * 0.7 : m * 0.4), Y + q); } ctx.stroke();
  } else if (kind === 'tin') {
    shadowed(ctx, () => { rrect(ctx, X, Y, Wd, Ht, m); ctx.fillStyle = '#3a3e44'; ctx.fill(); }, { blur: 18, dy: 10, a: 0.55 });
    rrect(ctx, X, Y, Wd, Ht, m); ctx.fillStyle = lg(ctx, X, Y, X + Wd, Y + Ht, [[0, '#e8ecf0'], [0.5, '#9aa2aa'], [1, '#5a626a']]); ctx.fill();
    rrect(ctx, X + 6, Y + 6, Wd - 12, Ht - 12, m * 0.8); ctx.fillStyle = lg(ctx, X, Y, X + Wd, Y + Ht, [[0, '#6a727a'], [1, '#b8c0c8']]); ctx.fill();
  } else { // bench / board: a wooden slab under the piece
    shadowed(ctx, () => { rrect(ctx, X, Y, Wd, Ht, 8); ctx.fillStyle = '#4a2e18'; ctx.fill(); }, { blur: 18, dy: 10, a: 0.55 });
    planks(ctx, X, Y, Wd, Ht, kind === 'board' ? '#a8845a' : '#9a6a3a', false, Math.max(18, cs * 1.4));
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2; rrect(ctx, X, Y, Wd, Ht, 8); ctx.stroke();
  }
  ctx.restore();
}

// shape-craft workshops for the metal and shell crafts (inlay, polish, forge); registered like the paint scenes.
import { registerSceneSet } from './registry.js';
import { hash } from './geom.js';
import { tint, rgba, rrect } from './fx.js';
import { lg, rg, ell, cast, TAU } from './props.js';

const walls = {
  forgewall(ctx, s, r, H, t) { // soot-black brick above a glowing hearth
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#0d0907'], [1, s.wallC]]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.strokeStyle = 'rgba(255,170,90,0.07)'; ctx.lineWidth = 2; const bh = H / 4;
    for (let row = 0; row < 4; row++) { const off = row % 2 ? 26 : 0; for (let x = r.x - off; x < r.x + r.w; x += 52) ctx.strokeRect(x, r.y + row * bh, 52, bh); }
    // 1.8.0: the fire pot is drawn by the technique; the wall keeps only a faint warm glow and a hanging rail of tools
    const hx = r.x + r.w * 0.78, hy = r.y + H * 0.9, flick = 0.85 + 0.15 * Math.sin(t * 7) * Math.sin(t * 3.1);
    ctx.fillStyle = rg(ctx, hx, hy, 4, H * 1.2, [[0, `rgba(255,150,60,${0.3 * flick})`], [1, 'rgba(255,60,0,0)']]); ctx.fillRect(r.x, r.y, r.w, H);
  },
};
const T = (c, h) => ({ caption: c, hint: h });
const scenes = {
  bidri: { wall: 'tools', wallC: '#4a4440', floor: 'slab', floorC: '#6a6a66', light: 'lamp', hang: ['chisel', 'mallet', 'pliers'], litter: [{ k: 'wire', c: '#c8cfd6' }, { k: 'dust', c: '#aab0b4' }], dock: ['chisel', 'mallet', 'coil:#c8cfd6', 'pliers', 'awl'], dockKind: 'tray', frame: 'case', words: T('Inlay this plate', 'Engrave, set the silver wire, peen it flat'), pitch: 1.2, wave: 'sine' },
  najeon: { wall: 'lamp', wallC: '#241812', floor: 'lacquer', floorC: '#2a1814', light: 'lamp', litter: [{ k: 'scraps', c: '#e6dfe8' }], dock: ['knife', 'pins', 'sponge', 'paper:#e6dfe8', 'bowl'], dockKind: 'cloth', frame: 'tile', words: T('Inlay this panel', 'Cut the pearl, set the pieces, polish'), pitch: 1.4, wave: 'sine' },
  aranmula: { wall: 'stone', wallC: '#6a5a44', floor: 'slab', floorC: '#8a7a64', light: 'window', litter: [{ k: 'dust', c: '#d6b890' }], dock: ['sponge', 'bowl', 'tongs', 'vat', 'sponge'], dockKind: 'ledge', frame: 'case', words: T('Cast and polish this mirror', 'Mix the alloy, cast it, then polish through the grits'), pitch: 1.0, wave: 'sine' },
  forge: { wall: 'forgewall', wallC: '#2a1a12', floor: 'slab', floorC: '#34302c', light: 'lamp', litter: [{ k: 'dust', c: '#4a3a30' }], dock: ['gauge'], dockKind: 'rail', frame: 'plinth', words: T('Forge this bar', 'Heat it orange, then strike on the beat'), pitch: 0.8, wave: 'triangle' },
};
registerSceneSet({
  scenes: Object.fromEntries(Object.entries(scenes).map(([id, s]) => [id, { ...s, hang: s.hang ?? [] }])),
  rules: [['bidri', /bidri/], ['najeon', /najeon|chilgi/], ['aranmula', /aranmula/], ['forge', /blacksmith|forge/]],
  walls, soundMat: Object.fromEntries(Object.keys(scenes).map((id) => [id, 'wire'])),
});
void tint; void cast; void TAU;

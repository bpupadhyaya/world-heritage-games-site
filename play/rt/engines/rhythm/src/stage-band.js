// Band stages (1.10.0): a small ensemble on one stage, each lane `row` (0..3) belonging to one instrument of the band.
//   mariachi: violin (bowed notes), trumpet (valve fingerings), vihuela (strummed chords), guitarron (bass strings)
//   mento: rumba box (thumb-struck tongues), banjo (strum), guitar (strum), maracas (shake)
// Four cells: 2x2 on a portrait screen, four in a row on a landscape one (the instruments turn to fit). No players are drawn.
import { clamp, mix, rgba, lighter, darker, rrect, circ, ell, hgrad, vgrad, rgrad, grain, hash, TAU } from './instr-art.js';
import { wood, shadow, skin as skinFill, rosette, studs, pin } from './instr-art.js';
import { glow } from './art.js';
import { registerStringStage } from './registry.js';
import { createBoardStage, STR_COL } from './board-kit.js';
import { stringLine, lerp } from './stagekit.js';
import { EXT } from './strings.js';
import './stage-necks.js';

const BAND = {
  mariachi: { kinds: ['violin', 'trumpet', 'vihuela', 'guitarron'], match: /mariachi|ranchera|jalisco/ },
  mento: { kinds: ['rumba', 'banjo', 'guitar', 'maracas'], match: /\bmento\b|rumba.?box|marimbula/ },
};
const VOICE = { violin: 'bow-fiddle', trumpet: 'brass', vihuela: null, guitarron: 'bass-pluck', rumba: 'rumba', banjo: null, guitar: null, maracas: 'maraca' };
const NAMES = { violin: 'Violin', trumpet: 'Trumpet', vihuela: 'Vihuela', guitarron: 'Guitarron', rumba: 'Rumba box', banjo: 'Banjo', guitar: 'Guitar', maracas: 'Maracas' };

const brass = (ctx, x0, x1) => hgrad(ctx, x0, x1, [[0, '#7a5214'], [0.18, '#e8c25a'], [0.38, '#fff0a8'], [0.55, '#d6a63a'], [0.8, '#a87a22'], [1, '#5a3a0c']]);

for (const [id, def] of Object.entries(BAND)) {
  registerStringStage({
    id, match: def.match,
    build: (S, lanes, P) => {
      const st = createBoardStage(id, S, lanes, P, {
        material: 'steel',
        voiceOf: (i, l) => VOICE[def.kinds[clamp(l.row ?? 0, 0, 3)]] ?? null,
        layout(F, K) {
          const { W, H } = F, rot = !!F.landscape;
          // wide frames hold the four cells along u (rotated instruments); tall frames 2x2
          const cells = def.kinds.map((kind, k) => {
            if (!rot) { const cw = W / 2 - 8, ch = H / 2 - 6; return { kind, k, rot: false, v: (k % 2 ? 1 : -1) * W / 4, u: ch / 2 + 3 + Math.floor(k / 2) * (ch + 6), A: cw / 2 * 0.94, L: ch * 0.94 }; }
            const cu = H / 4 - 6; return { kind, k, rot: true, v: 0, u: cu / 2 + 3 + k * (cu + 6), A: cu / 2 * 0.94, L: W * 0.94 };
          });
          const pt = (c, x, y) => (c.rot ? [c.v - y, c.u + x] : [c.v + x, c.u + y]);
          const G = { W, H, cells, pt };
          const spots = {}, strings = new Array(K.N).fill(null);
          cells.forEach((c) => {
            const mine = K.lanes.map((l, i) => i).filter((i) => clamp(K.lanes[i].row ?? 0, 0, 3) === c.k).sort((a, b) => K.lanes[a].hz - K.lanes[b].hz);
            c.lanes = mine;
            const { A, L } = c, n = mine.length;
            const put = (i, x, y, r, extra = {}) => { const [v, u] = pt(c, x, y); spots[i] = { v, u, r, dist: (lv, lu) => Math.hypot(lv - v, lu - u) / r, ...extra }; };
            if (c.kind === 'violin') { mine.forEach((i, r) => { const s = r % 4; put(i, lerp(-A * 0.2, A * 0.2, s / 3), lerp(-L * 0.3, L * 0.18, n > 1 ? r / (n - 1) : 0.5), 24); }); }
            else if (c.kind === 'trumpet') { mine.forEach((i, r) => put(i, lerp(-A * 0.82, A * 0.82, n > 1 ? r / (n - 1) : 0.5), L * 0.43, Math.min(A * 0.34, 30), { chip: true })); }
            else if (c.kind === 'guitarron') { mine.forEach((i, r) => put(i, lerp(-A * 0.26, A * 0.26, n > 1 ? r / (n - 1) : 0.5), lerp(L * 0.05, L * 0.3, r % 2 ? 0.2 : 0.8), 24)); }
            else if (c.kind === 'rumba') { const bh = L * 0.62, y0 = -L * 0.3, base = y0 + bh * 0.54; mine.forEach((i, r) => { const f = n > 1 ? r / (n - 1) : 0.5, len = lerp(bh * 0.46, bh * 0.28, f); put(i, lerp(-A * 0.5, A * 0.5, f), base - len + 20, 26, { tongue: true }); }); }
            else if (c.kind === 'maracas') { mine.forEach((i, r) => put(i, 0, (r - (n - 1) / 2) * L * 0.2, Math.min(A * 0.5, L * 0.18), { shake: true })); }
            else { // strummed instruments: bands across the strings, stacked
              mine.forEach((i, r) => { const [v, u] = pt(c, 0, L * 0.08 + (r - (n - 1) / 2) * 46); const hwv = c.rot ? 13 : A * 0.5, hwu = c.rot ? A * 0.5 : 13; spots[i] = { v, u, r: 13, hw: c.rot ? 22 : A * 0.52, hh: c.rot ? A * 0.5 : 20, dist: (lv, lu) => Math.max(Math.abs(lv - v) / (c.rot ? 22 : A * 0.52), Math.abs(lu - u) / (c.rot ? A * 0.5 : 20)), band: true }; void hwv; void hwu; });
            }
          });
          return { G, strings, spots };
        },
        back(ctx, G, rt, h) {
          G.cells.forEach((c) => {
            const { A, L } = c;
            ctx.save(); ctx.translate(c.v, c.u); if (c.rot) ctx.rotate(Math.PI / 2);
            // stage floor patch under each instrument
            ctx.fillStyle = 'rgba(255,255,255,0.045)'; rrect(ctx, -A * 1.02, -L / 2, A * 2.04, L, 18); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1.6; ctx.stroke();
            const e = Math.max(0, ...c.lanes.map((i) => rt.flash[i] * 0.95 + (rt.hold[i] ?? 0) * 0.4));
            const draw = { violin, trumpet, vihuela: (...a) => guitarLike(...a, 'vihuela'), guitar: (...a) => guitarLike(...a, 'guitar'), banjo, guitarron, rumba, maracas }[c.kind];
            draw(ctx, A, L, c, rt, e, h);
            ctx.restore();
          });
        },
        special(ctx, G, rt, i, sp, f, h) {
          const l = h.K.lanes[i];
          if (sp.chip) { // trumpet fingering chip: three valve dots, the pressed ones filled
            const pat = (String(l.name).match(/[123]/g) ?? []).map(Number), r = sp.r;
            ctx.save(); ctx.fillStyle = rgba(l.color, 0.18 + 0.4 * f); rrect(ctx, sp.v - r * 1.0, sp.u - r * 0.8, r * 2, r * 1.6, 10); ctx.fill(); ctx.strokeStyle = rgba(lighter(l.color, 0.4), 0.7 + 0.3 * f); ctx.lineWidth = 2.4; ctx.stroke();
            for (let k = 0; k < 3; k++) { const dx = (k - 1) * r * 0.52; ctx.fillStyle = pat.includes(k + 1) ? lighter(l.color, 0.45) : 'rgba(255,255,255,0.18)'; circ(ctx, sp.v + dx, sp.u - r * 0.22, r * 0.17); ctx.fill(); }
            ctx.restore(); h.strikeFx(ctx, rt, i, sp, l.color);
            h.labels.push({ v: sp.v, u: sp.u + r * 0.5, s: l.name, w: r * 2.2, col: l.color, f, o: {} }); return true;
          }
          if (sp.tongue || sp.shake) return false;
          return false;
        },
      });
      st.strumPitches = (i) => { const hz = lanes[i].hz; return [hz, hz * 1.26, hz * 1.5, hz * 2]; };
      return st;
    },
  });
}

// ---- instruments (local frame: x across, y along, origin at the cell centre) -------------------------------------------------------------
function violin(ctx, A, L, c, rt, e, h) {
  const w = Math.min(A * 1.5, L * 0.5), bl = L * 0.46, by = -L * 0.02;
  const out = EXT.bodies.violin;
  ctx.save(); ctx.translate(0, by);
  shadow(ctx, () => out(ctx, w, bl), 6, 8, 0.4);
  wood(ctx, () => out(ctx, w, bl), { x0: -w / 2, y0: 0, x1: w / 2, y1: bl }, '#b0612a', { seed: 5, n: 14, bevel: 'rgba(255,214,150,0.45)', hl: 0.14 });
  EXT.faces.violin(ctx, { bw: w, bl }, { out });
  ctx.restore();
  // neck, scroll, strings, bridge
  const nx = w * 0.07, nutY = -L * 0.4, brY = by + bl * 0.64;
  ctx.fillStyle = hgrad(ctx, -nx, nx, [[0, '#0a0604'], [0.5, '#2a1a10'], [1, '#0a0604']]); ctx.beginPath(); ctx.moveTo(-nx * 0.8, nutY); ctx.lineTo(nx * 0.8, nutY); ctx.lineTo(nx * 1.15, by + bl * 0.1); ctx.lineTo(-nx * 1.15, by + bl * 0.1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5a2c12'; rrect(ctx, -nx * 1.1, nutY - L * 0.06, nx * 2.2, L * 0.06, 6); ctx.fill(); ctx.strokeStyle = '#2a1408'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, nutY - L * 0.075, nx * 1.1, 0, TAU); ctx.stroke();
  for (let k = 0; k < 4; k++) { const x = lerp(-nx * 0.6, nx * 0.6, k / 3), xb = lerp(-nx * 1.1, nx * 1.1, k / 3); stringLine(ctx, x, nutY, xb, brY, 8 * e, rt.anim * 80 + k, 1.6, e > 0.04 ? '#fff' : '#e8e4d8', '#fff'); }
  ctx.fillStyle = vgrad(ctx, brY - 10, brY + 6, [[0, '#f0d9a8'], [1, '#8a5a24']]); ctx.beginPath(); ctx.moveTo(-nx * 1.5, brY + 6); ctx.quadraticCurveTo(0, brY - 12, nx * 1.5, brY + 6); ctx.lineTo(nx * 1.3, brY + 7); ctx.quadraticCurveTo(0, brY - 5, -nx * 1.3, brY + 7); ctx.closePath(); ctx.fill();
  // the bow sweeps while a note sounds
  const sway = Math.sin(rt.anim * 6) * w * 0.2 * Math.min(1, e * 1.6);
  ctx.save(); ctx.translate(sway, brY - 6); ctx.rotate(0.05);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, -w * 0.55 + 3, 4, w * 1.1, 5, 2); ctx.fill(); ctx.fillStyle = 'rgba(250,246,232,0.96)'; rrect(ctx, -w * 0.5, -3, w, 6, 3); ctx.fill(); ctx.fillStyle = vgrad(ctx, -10, -3, [[0, '#a8452a'], [1, '#2a0c04']]); rrect(ctx, -w * 0.55, -9, w * 1.1, 6, 3); ctx.fill(); ctx.restore();
  void c; void h;
}

function trumpet(ctx, A, L, c, rt, e, h) {
  // side view, lying along x: mouthpiece at the left, a loop of tubing with three piston valves across it, the bell flaring to the right
  const hh = L * 0.55, cy = -L * 0.1, y1 = cy - hh * 0.14, y2 = cy + hh * 0.14, xl = -A * 0.55, xr = A * 0.5;
  const tube = (w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-A * 0.9, y2); ctx.lineTo(xl + 14, y2); ctx.lineTo(xr - 14, y2); ctx.arc(xr - 14, cy, (y2 - y1) / 2, Math.PI / 2, -Math.PI / 2, true); ctx.lineTo(xl + 14, y1); ctx.arc(xl + 14, cy, (y2 - y1) / 2, -Math.PI / 2, Math.PI / 2, true); ctx.stroke(); };
  const bgrad = (y0, y1b) => vgrad(ctx, y0, y1b, [[0, '#7a5214'], [0.25, '#f6d777'], [0.45, '#fff2b0'], [0.7, '#c9962a'], [1, '#5a3a0c']]);
  ctx.save(); ctx.translate(5, 8); tube(15, 'rgba(0,0,0,0.38)'); ctx.restore();
  tube(15, '#5a3a0c'); tube(11, bgrad(y1 - 8, y2 + 8)); tube(3, 'rgba(255,255,235,0.6)');
  // bell
  const bx0 = xr - 6, bx1 = A * 0.96, br = hh * 0.34;
  const bell = () => { ctx.beginPath(); ctx.moveTo(bx0, y1 - 6); ctx.bezierCurveTo(bx0 + (bx1 - bx0) * 0.5, y1 - 8, bx0 + (bx1 - bx0) * 0.8, y1 - br * 0.3, bx1, y1 - br); ctx.lineTo(bx1, y1 + br); ctx.bezierCurveTo(bx0 + (bx1 - bx0) * 0.8, y1 + br * 0.3, bx0 + (bx1 - bx0) * 0.5, y1 + 8, bx0, y1 + 6); ctx.closePath(); };
  shadow(ctx, bell, 5, 8, 0.36); bell(); ctx.fillStyle = bgrad(y1 - br, y1 + br); ctx.fill(); ctx.strokeStyle = '#5a3a0c'; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.fillStyle = rgrad(ctx, bx1, y1, 2, br, [[0, '#120a02'], [0.65, '#46300c'], [1, '#d6a63a']]); ell(ctx, bx1, y1, A * 0.035, br); ctx.fill(); ctx.strokeStyle = '#f0d070'; ctx.lineWidth = 2.4; ctx.stroke();
  // mouthpiece
  ctx.fillStyle = hgrad(ctx, -A * 1.0, -A * 0.84, [[0, '#8a6a20'], [0.5, '#fff0b0'], [1, '#7a5a18']]); rrect(ctx, -A * 0.98, y2 - 9, A * 0.16, 18, 6); ctx.fill(); ctx.strokeStyle = '#5a3a0c'; ctx.lineWidth = 1.6; ctx.stroke();
  // valves: the ones named by the sounding lane are pressed down
  const active = new Set(); c.lanes.forEach((i) => { if (rt.flash[i] > 0.2) (String(h.K.lanes[i].name).match(/[123]/g) ?? []).forEach((d) => active.add(Number(d))); });
  for (let k = 0; k < 3; k++) {
    const vx = lerp(-A * 0.18, A * 0.34, k / 2), top = y1 - hh * 0.2, bot = y2 + hh * 0.12, press = active.has(k + 1) ? 10 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, vx - 10 + 4, top + 6, 20, bot - top, 7); ctx.fill();
    ctx.fillStyle = hgrad(ctx, vx - 10, vx + 10, [[0, '#7a5214'], [0.3, '#fff0a8'], [0.6, '#d6a63a'], [1, '#5a3a0c']]); rrect(ctx, vx - 10, top, 20, bot - top, 7); ctx.fill(); ctx.strokeStyle = '#5a3a0c'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = '#3a3a40'; rrect(ctx, vx - 2.5, top - 18 + press, 5, 18, 2); ctx.fill();
    ctx.fillStyle = rgrad(ctx, vx, top - 20 + press, 1, 9, [[0, '#fff6e0'], [0.7, '#e8ddc0'], [1, '#8a8068']]); circ(ctx, vx, top - 20 + press, 9); ctx.fill(); ctx.strokeStyle = '#4a4030'; ctx.lineWidth = 1.2; ctx.stroke();
  }
  if (e > 0.05) glow(ctx, bx1, y1, A * 0.8, '#ffe9a0', 0.3 * e);
}

function guitarLike(ctx, A, L, c, rt, e, h, kind) {
  const vih = kind === 'vihuela', w = Math.min(A * (vih ? 1.35 : 1.6), L * 0.44), bl = L * (vih ? 0.42 : 0.5), by = L * 0.0;
  ctx.save(); ctx.translate(0, by);
  const col = vih ? '#a8522a' : '#c47a34';
  shadow(ctx, () => EXT.bodies.guitar(ctx, w, bl), 6, 8, 0.4);
  wood(ctx, () => EXT.bodies.guitar(ctx, w, bl), { x0: -w / 2, y0: 0, x1: w / 2, y1: bl }, col, { seed: 12, n: 16, bevel: 'rgba(255,230,170,0.5)', hl: 0.12 });
  rosette(ctx, 0, bl * 0.46, w * 0.1, { ring: '#f3e0b0', mid: '#4a2810', spokes: 12 });
  ctx.fillStyle = '#2a1408'; rrect(ctx, -w * 0.22, bl * 0.82, w * 0.44, 12, 4); ctx.fill(); ctx.fillStyle = 'rgba(255,240,200,0.8)'; ctx.fillRect(-w * 0.2, bl * 0.82 + 2, w * 0.4, 2);
  ctx.restore();
  const nx = w * 0.075, nutY = -L * 0.4;
  ctx.fillStyle = hgrad(ctx, -nx, nx, [[0, '#120a06'], [0.5, '#3a2414'], [1, '#120a06']]); ctx.beginPath(); ctx.moveTo(-nx * 0.9, nutY); ctx.lineTo(nx * 0.9, nutY); ctx.lineTo(nx * 1.1, by + 6); ctx.lineTo(-nx * 1.1, by + 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2a160a'; rrect(ctx, -nx * 1.5, nutY - L * 0.09, nx * 3, L * 0.09, 6); ctx.fill();
  for (let k = 0; k < 3; k++) { for (const s of [-1, 1]) pin(ctx, s * nx * 2.0, nutY - L * 0.075 + k * L * 0.026, 4.6, '#e0d6bc'); }
  for (let k = 0; k < 7; k++) { const u = lerp(nutY + L * 0.04, by, 1 - 2 ** (-k / 6) / 1.0 * 0 - (1 - k / 7) * 0 ); void u; }
  const sy1 = by + bl * 0.82;
  for (let k = 0; k < 6; k++) { const x0 = lerp(-nx * 0.8, nx * 0.8, k / 5), x1 = lerp(-w * 0.18, w * 0.18, k / 5); const en = Math.max(e, 0); stringLine(ctx, x0, nutY, x1, sy1, 7 * en, rt.anim * 80 + k, 1.4 + (5 - k) * 0.12, en > 0.04 ? '#fff' : '#e4e0d2', '#fff'); }
  void c; void h;
}

function banjo(ctx, A, L, c, rt, e, h) {
  const w = Math.min(A * 1.7, L * 0.5), bl = w, by = L * 0.02;
  ctx.save(); ctx.translate(0, by);
  shadow(ctx, () => EXT.bodies.banjo(ctx, w, bl), 6, 8, 0.4);
  EXT.faces.banjo(ctx, { bw: w, bl }, {});
  ctx.restore();
  const nx = w * 0.07, nutY = -L * 0.4;
  ctx.fillStyle = hgrad(ctx, -nx, nx, [[0, '#120a06'], [0.5, '#3a2414'], [1, '#120a06']]); ctx.beginPath(); ctx.moveTo(-nx, nutY); ctx.lineTo(nx, nutY); ctx.lineTo(nx * 1.1, by + 4); ctx.lineTo(-nx * 1.1, by + 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2a160a'; rrect(ctx, -nx * 1.6, nutY - L * 0.07, nx * 3.2, L * 0.07, 6); ctx.fill();
  const by1 = by + bl * 0.6;
  for (let k = 0; k < 5; k++) { const x0 = lerp(-nx * 0.8, nx * 0.8, k / 4), x1 = lerp(-w * 0.12, w * 0.12, k / 4); stringLine(ctx, x0, nutY, x1, by1, 6 * e, rt.anim * 85 + k, 1.4, e > 0.04 ? '#fff' : '#dfe4ee', '#fff'); }
  ctx.fillStyle = '#e9d7a8'; rrect(ctx, -w * 0.14, by1 - 4, w * 0.28, 8, 3); ctx.fill();
  void c; void h;
}

function guitarron(ctx, A, L, c, rt, e, h) {
  const w = Math.min(A * 1.7, L * 0.5), bl = L * 0.5, by = L * 0.0;
  ctx.save(); ctx.translate(0, by);
  shadow(ctx, () => EXT.bodies.chonguri(ctx, w, bl), 7, 9, 0.42);
  wood(ctx, () => EXT.bodies.chonguri(ctx, w, bl), { x0: -w / 2, y0: 0, x1: w / 2, y1: bl }, '#8a3e1a', { seed: 22, n: 16, bevel: 'rgba(255,214,150,0.4)', hl: 0.12 });
  rosette(ctx, 0, bl * 0.45, w * 0.12, { ring: '#f3e0b0', mid: '#3a1c08', spokes: 14 });
  ctx.restore();
  const nx = w * 0.09, nutY = -L * 0.4;
  ctx.fillStyle = hgrad(ctx, -nx, nx, [[0, '#120a06'], [0.5, '#3a2414'], [1, '#120a06']]); ctx.beginPath(); ctx.moveTo(-nx, nutY); ctx.lineTo(nx, nutY); ctx.lineTo(nx * 1.2, by + 6); ctx.lineTo(-nx * 1.2, by + 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2a160a'; rrect(ctx, -nx * 1.6, nutY - L * 0.07, nx * 3.2, L * 0.07, 6); ctx.fill();
  const y1 = by + bl * 0.82;
  for (let k = 0; k < 6; k++) { const x0 = lerp(-nx * 0.8, nx * 0.8, k / 5), x1 = lerp(-w * 0.2, w * 0.2, k / 5); stringLine(ctx, x0, nutY, x1, y1, 7 * e, rt.anim * 60 + k, 2.4 - k * 0.15, e > 0.04 ? '#fff' : (k < 3 ? '#d2ad6c' : '#e4e0d2'), '#fff'); }
  void c; void h;
}

function rumba(ctx, A, L, c, rt, e, h) {
  // a wooden box with a round hole; steel tongues of different lengths on the top, fixed at the bottom edge
  const bw = A * 1.6, bh = L * 0.62, y0 = -L * 0.3;
  const box = () => rrect(ctx, -bw / 2, y0, bw, bh, 14);
  shadow(ctx, box, 7, 10, 0.4);
  wood(ctx, box, { x0: -bw / 2, y0, x1: bw / 2, y1: y0 + bh }, '#8c5224', { seed: 31, n: 14, bevel: 'rgba(255,214,150,0.45)', hl: 0.12 });
  ctx.fillStyle = rgrad(ctx, 0, y0 + bh * 0.72, 0, bw * 0.16, [[0, '#050301'], [0.8, '#150a04'], [1, '#2a180a']]); circ(ctx, 0, y0 + bh * 0.74, bw * 0.13); ctx.fill(); ctx.strokeStyle = '#e8d3a0'; ctx.lineWidth = 4; ctx.stroke();
  const n = c.lanes.length, bar = rrect;
  ctx.fillStyle = '#2a160a'; bar(ctx, -bw * 0.4, y0 + bh * 0.52, bw * 0.8, 14, 5); ctx.fill();
  c.lanes.forEach((i, r) => {
    const sp = h.spots[i], f = rt.flash[i], len = lerp(bh * 0.46, bh * 0.28, n > 1 ? r / (n - 1) : 0.5), tw = Math.max(16, bw * 0.16);
    const x = c.rot ? (sp.u - c.u) : sp.v - c.v;
    const wob = Math.sin(rt.anim * 70) * 6 * f;
    const base = y0 + bh * 0.54;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, x - tw / 2 + 3, base - len + 4, tw, len, 4); ctx.fill();
    ctx.fillStyle = hgrad(ctx, x - tw / 2, x + tw / 2, [[0, '#6a6e78'], [0.3, '#f2f4f8'], [0.7, '#a8acb8'], [1, '#5a5e68']]); rrect(ctx, x - tw / 2 + wob * 0.2, base - len, tw, len, 4); ctx.fill(); ctx.strokeStyle = 'rgba(20,20,30,0.6)'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = '#d9b46a'; circ(ctx, x, base + 2, 3.4); ctx.fill();
  });
}

function maracas(ctx, A, L, c, rt, e, h) {
  c.lanes.forEach((i) => {
    const sp = h.spots[i], f = rt.flash[i], r = sp.r, sh = Math.sin(rt.anim * 46) * 7 * f;
    const lx = c.rot ? (sp.u - c.u) : sp.v - c.v, ly = c.rot ? -(sp.v - c.v) : sp.u - c.u;
    for (const d of [-1, 1]) {
      ctx.save(); ctx.translate(lx + d * r * 0.55 + sh * d, ly); ctx.rotate(d * 0.32 + sh * 0.03);
      ctx.fillStyle = 'rgba(0,0,0,0.32)'; ell(ctx, 5, r * 0.5 + 6, r * 0.42, r * 0.56); ctx.fill();
      ctx.fillStyle = hgrad(ctx, -4, 4, [[0, '#5a3010'], [0.4, '#c88a46'], [1, '#4a2808']]); rrect(ctx, -4, r * 0.2, 8, r * 0.78, 4); ctx.fill();
      ctx.fillStyle = rgrad(ctx, 0, -r * 0.3, 2, r * 0.6, [[0, lighter(h.K.lanes[i].color, 0.55)], [0.6, h.K.lanes[i].color], [1, darker(h.K.lanes[i].color, 0.55)]], -r * 0.14, -r * 0.46); ell(ctx, 0, -r * 0.3, r * 0.4, r * 0.54); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -r * 0.3, r * 0.3, 3.6, 5.1); ctx.stroke();
      ctx.restore();
    }
  });
  void A; void L; void e;
}

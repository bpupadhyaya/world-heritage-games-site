// Gong stages (1.21.0): the gong ageng (one huge hung gong in a carved frame), the bonang (two rows of kettle gongs on cords in a cradle) and the kyi waing
// (a ring of kettle gongs in a carved circular frame). Each has its own picture, room and voice; no performer and no hands, a padded beater visits the struck gong.
// Lane names pick the zone (regex per stage) and otherwise the lanes take the zones from low to high pitch. Pitch comes from the lane's hz.
import { registerDrumStage } from './registry.js';
import { createDrumStage, eSpot, assignZones, staticLayer } from './drum-kit.js';
import { room } from './room-kit.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, circ, ell, hash, TAU, PI, lerp, zf, glow, discGong, potGong, ringSpot, padBeater, hangCord, beam, scrollBand, lamp, rings, swag, metalH } from './gong-kit.js';

// a stage maker like mkRattle, with the cached screen-space room as the backdrop
export function mkGong(id, match, { orn, wall, floor, rail, light, vig, zones, build, voice }) {
  registerDrumStage({ id, match, build: (S, lanes, P) => {
    const zoneOf = [], layer = staticLayer();
    return createDrumStage(id, S, lanes, P, {
      dress: () => ({ custom: (ctx, F, rt, S2, scene) => layer(ctx, { x: F.area.x, y: F.area.y, w: F.area.w, h: F.area.h }, (g) => room(g, F, rt, scene, { wall, floor, rail, light, vig, orn })) }),
      heroClean: true, voiceOf: (i) => voice ?? `gx-${id}-${zoneOf[i] ?? zones[0][0]}`,
      build: (K) => {
        const keyOf = assignZones(K, zones.map(([key, re]) => ({ key, re })));
        for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
        const sc = build(K, keyOf);
        const spots = new Array(K.N).fill(null);
        for (let i = 0; i < K.N; i++) spots[i] = sc.by[keyOf[i]] ?? null;
        return { ref: sc.ref, view: sc.view, wallU: sc.wallU, spots, draw: (ctx, rt, G) => sc.draw(ctx, rt, (...ks) => zf(K, keyOf, rt, ...ks), G), front: sc.front };
      },
    });
  } });
}

// the beater visits a struck spot: the head is at (x,y) on the strike and draws back along `dir` as the flash fades
export function visit(ctx, x, y, f, o = {}) {
  if (f < 0.06) return;
  const { dir = [0.5, -1], back = 90, len = 230, hr = 17, ang = -2.05, pad = '#eadfc6', wood = '#c89a58' } = o, e = 1 - Math.pow(1 - clamp(f * 1.15, 0, 1), 2);
  const d = Math.hypot(dir[0], dir[1]) || 1, hx = x + dir[0] / d * back * (1 - e), hy = y + dir[1] / d * back * (1 - e);
  ctx.save(); ctx.globalAlpha = clamp(f * 3, 0, 1);
  padBeater(ctx, hx - Math.cos(ang) * (len + hr * 0.3), hy - Math.sin(ang) * (len + hr * 0.3), ang, len, hr, { pad, wood });
  ctx.restore();
}

// ============================================================ GONG AGENG (one huge hung gong) =============================================
const AGENG_ZONES = [['boss', /boss|centre|center|knob|nipple|pencu/], ['face', /face|body|open|belly/], ['rim', /rim|edge|flange/]];
mkGong('ageng', /gong.?ageng|gong.?gedhe|gong.?agung|ageng|great.?gong/, {
  wall: { kind: 'panel', c1: '#4a1511', accent: '#e8c260', pw: 170 }, floor: { kind: 'planks', c1: '#3a2212', c2: '#5a3a1e', ph: 56 }, rail: '#2a140a', light: '#ffcf90',
  orn(ctx, A, wallB, rt) {
    const t = rt?.anim ?? 0;
    for (const fx of [0.09, 0.91]) { const x = A.x + A.w * fx, w = Math.min(A.w * 0.07, 60); beam(ctx, x - w / 2, A.y, w, wallB - A.y, '#6a1e16', { vertical: true, grain: false }); for (const g of [0.2, 0.55, 0.85]) { ctx.fillStyle = hgrad(ctx, x - w / 2 - 4, x + w / 2 + 4, [[0, '#6a4a10'], [0.3, '#f0d070'], [0.6, '#b8902a'], [1, '#5a3a08']]); ctx.fillRect(x - w / 2 - 4, A.y + (wallB - A.y) * g, w + 8, (wallB - A.y) * 0.03); } }
    for (const fx of [0.3, 0.5, 0.7]) lamp(ctx, A.x + A.w * fx, A.y + 6, Math.max(9, A.w * 0.012), t);
  },
  zones: AGENG_ZONES,
  build: (K) => {
    const tall = K.tall, ref = tall ? { w: 780, h: 980 } : { w: 1040, h: 600 }, R = tall ? 262 : 214, cy = tall ? 500 : 330, beamY = tall ? 64 : 40, postW = tall ? 58 : 44, hw = R + (tall ? 92 : 98);
    const groundY = tall ? 900 : 560, by = {};
    by.boss = eSpot(0, cy, R * 0.22, R * 0.22, 0, { apk: 0.95 });
    by.face = ringSpot(0, cy, R * 0.94, R * 0.94, 0.36, 0.84, PI * 0.5);
    by.rim = ringSpot(0, cy, R, R, 0.88, 1.02, PI * 0.2);
    return { ref, by, wallU: groundY - 36,
      draw(ctx, rt, fl) {
        const fb = fl('boss'), ff = fl('face'), fr = fl('rim'), fa = Math.max(fb, ff, fr), sw = Math.sin(rt.anim * 13) * fa * 0.03;
        // the stand: two carved posts on plinths and a beam with gilt scrollwork
        for (const sx of [-1, 1]) {
          const x = sx * hw - postW / 2;
          ctx.fillStyle = 'rgba(0,0,0,0.4)'; ell(ctx, sx * hw + 10, groundY + 8, postW * 1.6, 16); ctx.fill();
          beam(ctx, x - 14, groundY - 36, postW + 28, 40, '#5a1a14', { round: 10, grain: false }); beam(ctx, x - 6, groundY - 62, postW + 12, 30, '#6a1e16', { round: 8, grain: false });
          beam(ctx, x, beamY, postW, groundY - 62 - beamY, '#7a1f18', { vertical: true, grain: false, round: 10 });
          ctx.save(); ctx.beginPath(); ctx.rect(x, beamY + 60, postW, groundY - 150 - beamY); ctx.clip();
          ctx.translate(x + postW / 2, 0); ctx.rotate(PI / 2); scrollBand(ctx, beamY + 70, groundY - 140, 0, postW * 0.5, '#e8c260'); ctx.restore();
          ctx.fillStyle = hgrad(ctx, x - 6, x + postW + 6, [[0, '#6a4a10'], [0.3, '#f0d070'], [0.6, '#b8902a'], [1, '#5a3a08']]); ctx.fillRect(x - 6, beamY + 24, postW + 12, 16); ctx.fillRect(x - 6, groundY - 132, postW + 12, 14);
        }
        beam(ctx, -hw - postW / 2 - 24, beamY - 30, 2 * hw + postW + 48, 64, '#7a1f18', { round: 18, grain: false });
        scrollBand(ctx, -hw - postW / 2 - 6, hw + postW / 2 + 6, beamY + 2, 40, '#e8c260');
        ctx.strokeStyle = rgba('#f0d070', 0.55); ctx.lineWidth = 2; rrect(ctx, -hw - postW / 2 - 24, beamY - 30, 2 * hw + postW + 48, 64, 18); ctx.stroke();
        for (const sx of [-1, 1]) { ctx.fillStyle = rgrad(ctx, sx * (hw + postW / 2 + 4), beamY - 36, 0, 22, [[0, '#fff0b0'], [0.5, '#e0b040'], [1, '#6a4a10']], sx * (hw + postW / 2) - 6, beamY - 42); circ(ctx, sx * (hw + postW / 2 + 4), beamY - 28, 18); ctx.fill(); }
        // the gong hangs on two cords from the beam and swings a little
        ctx.save(); ctx.translate(0, beamY + 30); ctx.rotate(sw); ctx.translate(0, -(beamY + 30));
        const ax = R * 0.6, ay = cy - R * 0.8;
        hangCord(ctx, -ax * 0.7, beamY + 30, -ax, ay, { w: 8, tassel: { len: 34, col: '#b8252a' } }); hangCord(ctx, ax * 0.7, beamY + 30, ax, ay, { w: 8, tassel: { len: 34, col: '#b8252a' } });
        ctx.fillStyle = 'rgba(0,0,0,0.38)'; circ(ctx, 14, cy + 22, R); ctx.fill();
        discGong(ctx, 0, cy, R, { col: '#b98a3a', boss: 0.2, rimW: 0.12, hammer: 0.7, rings: 6, f: fa * 0.6, bossCol: '#d8aa50' });
        for (const sx of [-1, 1]) { ctx.fillStyle = '#2a1608'; circ(ctx, sx * ax, ay, 8); ctx.fill(); }
        ctx.restore();
        if (fb > 0.05) rings(ctx, 0, cy, R * 0.3, fb); if (ff > 0.05) rings(ctx, 0, cy, R * 0.72, ff); if (fr > 0.05) rings(ctx, 0, cy, R * 1.04, fr);
        glow(ctx, 0, cy, R * 1.3, '#ffd27a', 0.2 * fa);
        // the beater: it rests against the right post and swings to whichever zone is struck
        const idle = !(fa > 0.06);
        if (idle) padBeater(ctx, hw + postW * 0.2, groundY - 96, -1.9, 250, 22, { pad: '#eadfc6' });
        const tgt = fb >= ff && fb >= fr ? [0, cy] : ff >= fr ? [R * 0.52 * 0.78, cy + R * 0.52 * 0.62] : [R * 0.9 * 0.7, cy + R * 0.9 * 0.7];
        visit(ctx, tgt[0], tgt[1], fa, { dir: [0.55, 0.9], back: 120, len: 260, hr: 22, ang: -2.25 });
      } };
  },
});
void mix; void lerp; void swag; void metalH; void lighter; void darker; void vgrad; void TAU; void hash; void hangCord;

// ============================================================ BONANG (two rows of kettle gongs in a cradle) ================================
mkGong('bonang', /bonang|rancak/, {
  voice: 'gx-bonang',
  wall: { kind: 'plaster', c1: '#2a2f3a', c2: '#3a2c2a', seed: 4 }, floor: { kind: 'planks', c1: '#4a2c16', c2: '#6a4220', ph: 58 }, rail: '#241208', light: '#ffd9a0', vig: 0.6,
  orn(ctx, A, wallB, rt) {
    // a batik cloth hung behind: indigo and cream knife-pattern lozenges
    const x0 = A.x + A.w * 0.12, w = A.w * 0.76, y0 = A.y + (wallB - A.y) * 0.08, h = (wallB - A.y) * 0.62;
    ctx.fillStyle = '#1c2552'; rrect(ctx, x0, y0, w, h, 4); ctx.fill();
    const s = Math.max(34, Math.min(w, h) / 6);
    ctx.save(); rrect(ctx, x0, y0, w, h, 4); ctx.clip();
    for (let r = 0; r * s < h + s; r++) for (let c = 0; c * s < w + s; c++) { const x = x0 + c * s + (r % 2 ? s / 2 : 0), y = y0 + r * s; ctx.strokeStyle = 'rgba(232,214,160,0.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - s * 0.4); ctx.quadraticCurveTo(x + s * 0.42, y, x, y + s * 0.4); ctx.quadraticCurveTo(x - s * 0.42, y, x, y - s * 0.4); ctx.stroke(); ctx.fillStyle = 'rgba(214,170,80,0.5)'; circ(ctx, x, y, s * 0.06); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x0, y0, w, h * 0.12); ctx.restore();
    ctx.strokeStyle = 'rgba(232,200,120,0.6)'; ctx.lineWidth = 3; rrect(ctx, x0, y0, w, h, 4); ctx.stroke();
    void rt;
  },
  zones: Array.from({ length: 10 }, (_, i) => [`p${i}`, null]),
  build: (K) => {
    const tall = K.tall, N = Math.min(K.N, 12), perRow = Math.ceil(N / 2), ref = tall ? { w: 690, h: 820 } : { w: 1080, h: 600 };
    const gap = tall ? (ref.w - 120) / perRow : (ref.w - 200) / perRow, x0 = -gap * (perRow - 1) / 2;
    const rowsY = tall ? [370, 566] : [250, 430], Rmax = tall ? 54 : 62, Rmin = tall ? 44 : 50, floorY = tall ? 440 : 330;
    const by = {}, pots = [];
    for (let i = 0; i < N; i++) {
      const row = i < perRow ? 0 : 1, c = row === 0 ? i : i - perRow, nrow = row === 0 ? perRow : N - perRow, back = row === 1;   // the low row stands in front; the high row sits behind it
      const R = lerp(Rmax, Rmin, nrow > 1 ? c / (nrow - 1) : 0) * (back ? 0.92 : 1), x = x0 + c * gap, y = back ? rowsY[0] : rowsY[1];
      pots.push({ x, y, R, back, tone: ['#b98a3a', '#c4963f', '#a97c32'][i % 3] });
      by[`p${i}`] = eSpot(x, y + R * 0.18, R * 1.0, R * 0.78, 0, { apk: 0.8 });
    }
    const xa = x0 - Rmax - 38, xb = x0 + gap * (perRow - 1) + Rmax + 38, railB = rowsY[0] - Rmax * 0.82, railM = (rowsY[0] + rowsY[1]) / 2 + 18, railF = rowsY[1] + Rmax * 1.0 + 20, legB = floorY + (tall ? 250 : 190);
    return { ref, by, wallU: floorY,
      draw(ctx, rt, fl) {
        const potDraw = (back) => pots.forEach((p, i) => {
          if (p.back !== back) return; const f = fl(`p${i}`), jig = Math.sin(rt.anim * 30 + i) * f * 2.2;
          potGong(ctx, p.x, p.y + jig, p.R, { col: p.tone, ryk: 0.62, wall: p.R * 0.42, boss: 0.26, f });
          if (f > 0.05) { rings(ctx, p.x, p.y, p.R * 1.1, f); glow(ctx, p.x, p.y, p.R * 1.9, '#ffd27a', 0.3 * f); }
        });
        const cords = (back, y0, y1) => { for (const p of pots) if (p.back === back) for (const d of [-0.42, 0.42]) hangCord(ctx, p.x + d * p.R, y0, p.x + d * p.R, y1, { w: 6, col: '#e8d6a0' }); };
        // the cradle: two end frames on feet, three rails; each pot lies on a pair of cords between two rails
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ell(ctx, (xa + xb) / 2 + 14, legB + 10, (xb - xa) / 2 + 40, 24); ctx.fill();
        for (const sx of [xa, xb - 34]) { beam(ctx, sx - 12, legB - 28, 58, 36, '#5a1814', { round: 10, grain: false }); beam(ctx, sx, railB - 30, 34, legB - railB + 8, '#7a1a16', { vertical: true, round: 12, grain: false }); ctx.save(); ctx.beginPath(); ctx.rect(sx, railB + 40, 34, legB - railB - 70); ctx.clip(); ctx.translate(sx + 17, 0); ctx.rotate(PI / 2); scrollBand(ctx, railB + 50, legB - 40, 0, 16, '#e8c260'); ctx.restore(); }
        beam(ctx, xa, railB - 10, xb - xa, 24, '#8a1f1a', { round: 10, grain: false }); scrollBand(ctx, xa + 40, xb - 40, railB + 2, 16, '#e8c260');
        cords(true, railB + 8, railM); potDraw(true);
        beam(ctx, xa, railM - 10, xb - xa, 28, '#7a1a16', { round: 10, grain: false }); scrollBand(ctx, xa + 40, xb - 40, railM + 4, 18, '#e8c260');
        cords(false, railM + 8, railF); potDraw(false);
        beam(ctx, xa, railF - 8, xb - xa, 36, '#8a1f1a', { round: 12, grain: false }); scrollBand(ctx, xa + 40, xb - 40, railF + 10, 22, '#e8c260');
        for (const sx of [xa, xb - 34]) { ctx.fillStyle = rgrad(ctx, sx + 17, railB - 38, 0, 20, [[0, '#fff0b0'], [0.5, '#e0b040'], [1, '#6a4a10']], sx + 10, railB - 46); circ(ctx, sx + 17, railB - 30, 16); ctx.fill(); }
        // beaters visit the two most recently struck pots; at rest they lie across the front rail
        const lit = pots.map((p, i) => ({ p, f: fl(`p${i}`) })).filter((q) => q.f > 0.06).sort((a, b) => b.f - a.f).slice(0, 2);
        lit.forEach((q, k) => visit(ctx, q.p.x, q.p.y - q.p.R * 0.08, q.f, { dir: [k ? 0.7 : -0.5, -1], back: 70, len: 210, hr: 14, ang: k ? -2.3 : -0.85, pad: '#d9c8a0' }));
        if (!lit.length) { padBeater(ctx, xb - 300, railF + 2, -0.04, 250, 14, { pad: '#d9c8a0' }); padBeater(ctx, xb - 290, railF + 20, -0.1, 250, 14, { pad: '#d9c8a0' }); }
      } };
  },
});

// ============================================================ KYI WAING (a ring of gongs in a carved circular frame) ==========================
mkGong('kyiwaing', /kyi.?waing|kyi.?wine|gong.?circle|circle.?gong|khong.?wong/, {
  voice: 'gx-circle',
  wall: { kind: 'curtain', c1: '#5a1a2a' }, floor: { kind: 'mat', c1: '#9a7a46', c2: '#7a5a30', size: 30 }, rail: '#2a120a', light: '#ffd8a0', vig: 0.6,
  orn(ctx, A, wallB, rt) {
    // gilt curtain trim and two hanging lamps
    ctx.fillStyle = vgrad(ctx, A.y, A.y + (wallB - A.y) * 0.13, [[0, '#3a0e18'], [1, '#6a1a2c']]); ctx.fillRect(A.x, A.y, A.w, (wallB - A.y) * 0.13);
    scrollBand(ctx, A.x + 10, A.x + A.w - 10, A.y + (wallB - A.y) * 0.11, (wallB - A.y) * 0.07, '#e8c260');
    for (const fx of [0.22, 0.78]) { ctx.strokeStyle = '#d8c08a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(A.x + A.w * fx, A.y); ctx.lineTo(A.x + A.w * fx, A.y + (wallB - A.y) * 0.2); ctx.stroke(); lamp(ctx, A.x + A.w * fx, A.y + (wallB - A.y) * 0.2, Math.max(9, A.w * 0.014), rt?.anim ?? 0); }
  },
  zones: Array.from({ length: 12 }, (_, i) => [`g${i}`, null]),
  build: (K) => {
    const tall = K.tall, N = Math.min(K.N, 12), ref = tall ? { w: 800, h: 900 } : { w: 1100, h: 560 };
    const cx = 0, cy = tall ? 430 : 290, rx = tall ? 318 : 440, ry = tall ? 250 : 190, by = {}, gongs = [];
    for (let i = 0; i < N; i++) {
      const a = PI * 0.5 + PI * 0.32 + (i / N) * TAU * 0.98 + 0.12, x = cx + Math.cos(a) * rx * 0.86, y = cy + Math.sin(a) * ry * 0.86;   // the lowest gong sits at the front left and the ring climbs clockwise
      const R = lerp(tall ? 56 : 54, tall ? 40 : 38, i / Math.max(1, N - 1)) * (0.88 + 0.12 * Math.sin(a) * 0.5 + 0.1);
      gongs.push({ x, y, R, a });
      by[`g${i}`] = eSpot(x, y + R * 0.15, R * 0.95, R * 0.74, 0, { apk: 0.8 });
    }
    return { ref, by, wallU: cy - ry - 50,
      draw(ctx, rt, fl) {
        // the frame: an outer carved wall (lacquer, gilt) seen from above, an inner velvet floor
        const wall = (o, a0, a1, hgt) => { ctx.beginPath(); ctx.ellipse(cx, cy + hgt, rx + o, ry + o * 0.7, 0, a0, a1); };
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ell(ctx, cx + 12, cy + 56, rx + 52, ry + 40); ctx.fill();
        // legs
        for (const a of [PI * 0.12, PI * 0.88, PI * 1.5]) { const x = cx + Math.cos(a) * (rx + 10), y = cy + Math.sin(a) * (ry + 10) * 0.95; beam(ctx, x - 17, y + 8, 34, 86, '#6a1814', { vertical: true, round: 12, grain: false }); }
        // the front lip band (lower half of the ring wall seen from the front)
        ctx.beginPath(); ctx.ellipse(cx, cy + 32, rx + 34, ry + 26, 0, 0, PI); ctx.ellipse(cx, cy, rx + 34, ry + 26, 0, PI, 0, true); ctx.closePath();
        ctx.fillStyle = hgrad(ctx, cx - rx, cx + rx, [[0, '#4a0e0c'], [0.2, '#9a2a1c'], [0.5, '#7a1e16'], [0.8, '#9a2a1c'], [1, '#4a0e0c']]); ctx.fill();
        ctx.save(); ctx.clip(); ctx.strokeStyle = rgba('#e8c260', 0.7); ctx.lineWidth = 3; for (let k = 0; k < 44; k++) { const a = (k / 44) * PI, x = cx + Math.cos(a) * (rx + 30), y = cy + 14 + Math.sin(a) * (ry + 22); ctx.fillStyle = rgba('#e8c260', 0.5); circ(ctx, x, y, 5); ctx.fill(); } ctx.restore();
        // the top ring of the frame
        ctx.beginPath(); ctx.ellipse(cx, cy, rx + 34, ry + 26, 0, 0, TAU); ctx.ellipse(cx, cy, rx - 26, ry - 20, 0, 0, TAU, true);
        ctx.fillStyle = rgrad(ctx, cx, cy, ry * 0.7, rx + 34, [[0, '#7a1e16'], [0.8, '#a82a1c'], [1, '#6a1812']]); ctx.fill('evenodd');
        ctx.strokeStyle = rgba('#f0d070', 0.8); ctx.lineWidth = 3; ell(ctx, cx, cy, rx + 34, ry + 26); ctx.stroke(); ell(ctx, cx, cy, rx - 26, ry - 20); ctx.stroke();
        for (let k = 0; k < 36; k++) { const a = (k / 36) * TAU; ctx.fillStyle = rgba('#f0d070', 0.7); circ(ctx, cx + Math.cos(a) * (rx + 4), cy + Math.sin(a) * (ry + 3), 5.4); ctx.fill(); }
        // the floor inside, red velvet with a gilt border
        ell(ctx, cx, cy, rx - 26, ry - 20); ctx.fillStyle = rgrad(ctx, cx, cy, 20, rx, [[0, '#7a1a26'], [1, '#2a0810']]); ctx.fill();
        ctx.strokeStyle = rgba('#e8c260', 0.45); ctx.lineWidth = 2; ell(ctx, cx, cy, rx * 0.55, ry * 0.52); ctx.stroke(); ell(ctx, cx, cy, rx * 0.3, ry * 0.28); ctx.stroke();
        // gongs: back ones first
        const order = gongs.map((g, i) => i).sort((a, b) => gongs[a].y - gongs[b].y);
        order.forEach((i) => {
          const g = gongs[i], f = fl(`g${i}`), jig = Math.sin(rt.anim * 30 + i) * f * 2;
          potGong(ctx, g.x, g.y + jig, g.R, { col: ['#c4963f', '#b98a3a', '#d0a24a'][i % 3], ryk: 0.6, wall: g.R * 0.46, boss: 0.28, f });
          if (f > 0.05) { rings(ctx, g.x, g.y, g.R * 1.1, f); glow(ctx, g.x, g.y, g.R * 2, '#ffd27a', 0.32 * f); }
        });
        const lit = gongs.map((g, i) => ({ g, f: fl(`g${i}`) })).filter((q) => q.f > 0.06).sort((a, b) => b.f - a.f).slice(0, 2);
        lit.forEach((q, k) => visit(ctx, q.g.x, q.g.y - q.g.R * 0.1, q.f, { dir: [k ? 0.7 : -0.6, -1], back: 70, len: 210, hr: 14, ang: k ? -2.2 : -0.9, pad: '#e8dcc0' }));
      } };
  },
});

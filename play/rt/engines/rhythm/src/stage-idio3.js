// Bells & Log Drums stages II (1.27.0): the ikoro (a tall standing hollowed log in a forest clearing), the obrom (a long log lying on cross-logs, two hollows linked by a channel,
// savanna dusk) and the adomba (four brass cup bells with hanging iron clappers on a carved bar in a courtyard). Each has its own silhouette, material, light and voice.
// No performer and no hands: bare sticks visit the log drums; the clappers swing against the bell lips.
import { rSpot, eSpot } from './drum-kit.js';
import { mkGong, visit } from './stage-gongs.js';
import { WALLS } from './room-kit.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU, PI, lerp, glow, beam, rings, padBeater } from './gong-kit.js';

const poly = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
const STICK = { pad: '#c9a26a', wood: '#7a5430' };

// ============================================================ shared: a log's bark texture and growth rings ===============================
function bark(ctx, x, y, w, h, seed, vertical) {
  grain(ctx, x, y, w, h, '#120804', 0.55, seed, vertical, Math.max(8, Math.round(Math.min(w, h) / 5)));
  for (let k = 0; k < 40; k++) {
    const px = x + hash(seed + k * 2.7) * w, py = y + hash(seed + k * 4.1) * h, l = (vertical ? h : w) * (0.05 + 0.12 * hash(seed + k));
    ctx.strokeStyle = `rgba(10,4,0,${0.25 + 0.3 * hash(seed + k + 9)})`; ctx.lineWidth = 1.6 + 2 * hash(seed + k + 3);
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(vertical ? px + (hash(seed + k) - 0.5) * 6 : px + l, vertical ? py + l : py + (hash(seed + k) - 0.5) * 6); ctx.stroke();
  }
  for (let k = 0; k < 14; k++) { ctx.fillStyle = `rgba(90,130,60,${0.1 + 0.18 * hash(seed + k + 20)})`; ell(ctx, x + hash(seed + k * 6.1) * w, y + hash(seed + k * 3.3) * h, 6 + 20 * hash(seed + k), 4 + 10 * hash(seed + k + 1)); ctx.fill(); }
}
function ringsFace(ctx, cx, cy, rx, ry, col) {
  ctx.fillStyle = rgrad(ctx, cx, cy, 0, rx, [[0, lighter(col, 0.25)], [1, darker(col, 0.15)]]); ell(ctx, cx, cy, rx, ry); ctx.fill();
  ctx.strokeStyle = 'rgba(70,36,14,0.55)'; ctx.lineWidth = 1.6;
  for (let k = 1; k <= 7; k++) { ctx.beginPath(); ctx.ellipse(cx + (hash(k) - 0.5) * 4, cy + (hash(k + 4) - 0.5) * 2, rx * k / 7.4, ry * k / 7.4, 0, 0, TAU); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(40,18,6,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + rx * 0.7, cy - ry * 0.3); ctx.stroke();
  ctx.strokeStyle = 'rgba(30,12,4,0.9)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.stroke();
}

// ============================================================ IKORO (a tall hollowed standing log in a forest clearing) ====================
// A big upright trunk of dark bark, flat sawn top with growth rings, a vertical slit that pinches at the waist (thick left lip, thin right lip), carved bands of chevrons
// near the top and foot, buttress roots. Room: forest, green-gold light, shafts of sun, moss and leaf litter.
WALLS.forest = (ctx, A, b, o) => {
  const h = b - A.y; ctx.fillStyle = vgrad(ctx, A.y, b, [[0, '#0b1a12'], [0.5, '#1d3a22'], [1, '#3b5a2a']]); ctx.fillRect(A.x, A.y, A.w, h);
  for (let k = 0; k < 9; k++) { const x = A.x + A.w * (k + hash(k * 3.3)) / 9, w = A.w * (0.03 + 0.04 * hash(k + 2)); ctx.fillStyle = `rgba(8,16,8,${0.5 + 0.3 * hash(k)})`; ctx.fillRect(x, A.y, w, h); ctx.fillStyle = 'rgba(120,160,70,0.14)'; ctx.fillRect(x, A.y, w * 0.25, h); }
  for (let k = 0; k < 70; k++) { ctx.fillStyle = `rgba(${40 + 60 * hash(k)},${110 + 80 * hash(k + 3)},50,${0.12 + 0.2 * hash(k + 5)})`; ell(ctx, A.x + hash(k * 2.3) * A.w, A.y + hash(k * 1.7 + 2) * h * 0.6, 24 + 70 * hash(k + 7), 12 + 30 * hash(k + 9)); ctx.fill(); }
  // sun shafts
  for (let k = 0; k < 4; k++) { const x0 = A.x + A.w * (0.12 + 0.24 * k + 0.05 * hash(k)); ctx.fillStyle = vgrad(ctx, A.y, b, [[0, 'rgba(255,244,170,0.3)'], [1, 'rgba(255,244,170,0)']]); poly(ctx, [[x0, A.y], [x0 + A.w * 0.05, A.y], [x0 + A.w * 0.2, b], [x0 + A.w * 0.08, b]]); ctx.fill(); }
};
const IK = [['low', /low|thick|left|deep|boom/], ['high', /high|thin|right|bright|ring/], ['body', /body|bark|trunk|belly|side/], ['rim', /rim|top|end|edge|click/]];
mkGong('ikoro', /ikoro|standing.?log|upright.?log|giant.?log|log.?post/, {
  wall: { kind: 'forest' }, floor: { kind: 'earth', c1: '#3c4a22' }, rail: '#1a2a12', light: '#ffeaa0', vig: 0.56, zones: IK,
  build: (K) => {
    const tall = K.tall, ref = tall ? { w: 780, h: 980 } : { w: 1100, h: 620 }, by = {};
    const R = tall ? 128 : 112, T = tall ? 120 : 70, B = tall ? 830 : 530, Hh = B - T, ym = T + Hh * 0.5, s0 = T + Hh * 0.12, s1 = T + Hh * 0.8, sw = R * 0.34;
    by.low = rSpot(-R * 0.52, ym, R * 0.34, Hh * 0.28, 0, {}); by.high = rSpot(R * 0.52, ym, R * 0.34, Hh * 0.28, 0, {});
    by.body = rSpot(0, s1 + (B - s1) * 0.5, R * 0.8, (B - s1) * 0.4, 0, {}); by.rim = eSpot(0, T, R * 0.8, R * 0.2, 0, {});
    return { ref, by, wallU: B - 40,
      draw(ctx, rt, fl) {
        const fL = fl('low'), fH = fl('high'), fB = fl('body'), fR = fl('rim'), fm = Math.max(fL, fH, fB, fR), wob = Math.sin(rt.anim * 42) * fm * 1.2;
        const xw = (y) => R * (1 + 0.05 * Math.sin((y - T) * 0.012) + (y > B - 70 ? 0.28 * Math.pow((y - (B - 70)) / 70, 2) : 0) - 0.04 * (1 - (y - T) / Hh));
        const trunk = (g) => { g.beginPath(); g.moveTo(-xw(T), T); for (let y = T; y <= B; y += 10) g.lineTo(-xw(y), y); g.ellipse(0, B, xw(B), R * 0.2, 0, PI, 0, true); for (let y = B; y >= T; y -= 10) g.lineTo(xw(y), y); g.closePath(); };
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ell(ctx, 18, B + 6, R * 1.9, R * 0.26); ctx.fill();
        ctx.save(); ctx.translate(0, wob);
        trunk(ctx); ctx.fillStyle = hgrad(ctx, -R * 1.2, R * 1.2, [[0, '#0c0602'], [0.18, '#5a3a1e'], [0.4, '#3a2410'], [0.7, '#241406'], [1, '#080402']]); ctx.fill();
        ctx.save(); trunk(ctx); ctx.clip(); bark(ctx, -R * 1.3, T, R * 2.6, Hh + 40, 7, true);
        // carved chevron bands near the top and above the foot, with a chalked line
        for (const [y0, hb] of [[T + Hh * 0.025, Hh * 0.075], [B - Hh * 0.13, Hh * 0.075]]) {
          ctx.fillStyle = 'rgba(20,8,2,0.55)'; ctx.fillRect(-R * 1.2, y0, R * 2.4, hb);
          const n = 8, cw = R * 2 / n; for (let k = 0; k < n; k++) { const x = -R + k * cw; ctx.fillStyle = '#e8d6a8'; poly(ctx, [[x + 2, y0 + 4], [x + cw / 2, y0 + hb - 4], [x + cw - 2, y0 + 4], [x + cw - 8, y0 + 4], [x + cw / 2, y0 + hb - 14], [x + 8, y0 + 4]]); ctx.fill(); }
          ctx.fillStyle = 'rgba(232,214,168,0.7)'; ctx.fillRect(-R * 1.2, y0 - 2, R * 2.4, 3); ctx.fillRect(-R * 1.2, y0 + hb, R * 2.4, 3);
        }
        // roundness: soft light from the upper left
        ctx.fillStyle = hgrad(ctx, -R, R, [[0, 'rgba(0,0,0,0.5)'], [0.2, 'rgba(255,230,160,0.2)'], [0.4, 'rgba(0,0,0,0)'], [0.8, 'rgba(0,0,0,0.25)'], [1, 'rgba(0,0,0,0.6)']]); ctx.fillRect(-R * 1.3, T, R * 2.6, Hh + 40);
        // the slit: a vertical lens that pinches at the waist
        const hw = (y) => sw * (1 - 0.5 * Math.exp(-Math.pow((y - ym) / (Hh * 0.13), 2))) * (0.7 + 0.3 * Math.sin(Math.PI * clamp((y - s0) / (s1 - s0), 0, 1)));
        const slit = (g, grow = 0) => { g.beginPath(); for (let y = s0; y <= s1; y += 8) { const x = -hw(y) - grow; y === s0 ? g.moveTo(x, y) : g.lineTo(x, y); } for (let y = s1; y >= s0; y -= 8) g.lineTo(hw(y) + grow, y); g.closePath(); };
        slit(ctx, 14); ctx.fillStyle = '#5a3418'; ctx.fill(); slit(ctx, 9); ctx.fillStyle = '#e4bc82'; ctx.fill(); slit(ctx, 4); ctx.fillStyle = '#9a6a38'; ctx.fill();
        slit(ctx); ctx.fillStyle = hgrad(ctx, -sw, sw, [[0, '#020100'], [0.5, '#100803'], [1, '#2a1608']]); ctx.fill(); ctx.strokeStyle = 'rgba(10,4,0,0.95)'; ctx.lineWidth = 2.4; ctx.stroke();
        if (fL > 0.05) { ctx.fillStyle = `rgba(255,220,150,${0.4 * fL})`; rrect(ctx, -R * 0.86, ym - Hh * 0.3, R * 0.7, Hh * 0.6, 12); ctx.fill(); }
        if (fH > 0.05) { ctx.fillStyle = `rgba(255,220,150,${0.4 * fH})`; rrect(ctx, R * 0.16, ym - Hh * 0.3, R * 0.7, Hh * 0.6, 12); ctx.fill(); }
        if (fB > 0.05) { ctx.fillStyle = `rgba(255,220,150,${0.34 * fB})`; ctx.fillRect(-R * 1.2, s1 + 10, R * 2.4, B - s1); }
        ctx.restore(); trunk(ctx); ctx.strokeStyle = 'rgba(8,4,0,0.9)'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke();
        // sawn top
        ringsFace(ctx, 0, T, xw(T), R * 0.2, '#c8985a');
        if (fR > 0.05) { ctx.fillStyle = `rgba(255,235,180,${0.4 * fR})`; ell(ctx, 0, T, xw(T), R * 0.2); ctx.fill(); }
        ctx.restore();
        // moss on the sawn top and shoulders, small shelf fungi, and drifting motes of pollen
        ctx.fillStyle = 'rgba(96,150,60,0.7)'; for (let k = 0; k < 7; k++) { ell(ctx, (hash(k * 3.1) - 0.5) * xw(T) * 1.5, T + R * 0.05 + hash(k) * 8, 14 + 16 * hash(k + 2), 5 + 5 * hash(k + 4)); ctx.fill(); }
        for (const [fy, sd] of [[0.55, 1], [0.7, -1]]) { const x0 = sd * xw(T + Hh * fy) * 0.97, y0 = T + Hh * fy; ctx.fillStyle = '#d8b878'; ctx.beginPath(); ctx.ellipse(x0, y0, 26, 9, 0, PI, 0); ctx.fill(); ctx.fillStyle = '#7a5a30'; ctx.beginPath(); ctx.ellipse(x0, y0, 26, 5, 0, 0, PI); ctx.fill(); }
        for (let k = 0; k < 16; k++) { const mx = ((hash(k * 4.3) - 0.5) * R * 5), my = T + Hh * hash(k * 2.9) - ((rt.anim * 14 * (0.4 + hash(k))) % 60); ctx.fillStyle = `rgba(255,244,170,${0.25 + 0.4 * hash(k + 6)})`; circ(ctx, mx, my, 2 + 2.4 * hash(k + 1)); ctx.fill(); }
        // roots creeping on the ground
        ctx.lineCap = 'round'; for (const [dx, dy, l] of [[-1, 0.1, 1.1], [1, 0.05, 1.2], [-0.5, 0.35, 0.8], [0.6, 0.38, 0.8]]) { ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(dx * R * 0.9, B - 6); ctx.quadraticCurveTo(dx * R * 1.5, B + dy * 60, dx * R * (1.4 + l * 0.5), B + dy * 90 + 6); ctx.stroke(); ctx.strokeStyle = 'rgba(160,120,60,0.35)'; ctx.lineWidth = 4; ctx.stroke(); }
        const tg = [[fL, -R * 0.5, ym], [fH, R * 0.5, ym], [fB, 0, s1 + (B - s1) * 0.5], [fR, 0, T]].sort((a, b) => b[0] - a[0])[0];
        visit(ctx, tg[1], tg[2], tg[0], { dir: [tg[1] < 0 ? -0.9 : 0.9, -0.5], back: 120, len: 270, hr: 9, ang: tg[1] < 0 ? -0.5 : -PI + 0.5, ...STICK });
        if (!(tg[0] > 0.06)) { padBeater(ctx, -R * 2.4, B + 40, -0.06, 250, 9, STICK); padBeater(ctx, R * 0.8, B + 62, PI + 0.04, 250, 9, STICK); }
      } };
  },
});

// ============================================================ OBROM (a long log on cross-logs, two hollows linked by a channel) ===========
// A long round log seen from the side and a little above: bark sides, a pale top strip with two oval hollows joined by a narrow channel (the left hollow deeper), the left
// end sawn with growth rings. It lies on two crossed supports. Room: savanna at dusk: orange sky and sun, an acacia silhouette, dry grass, packed red earth.
WALLS.dusk = (ctx, A, b, o) => {
  const h = b - A.y; ctx.fillStyle = vgrad(ctx, A.y, b, [[0, '#3a2a5a'], [0.35, '#c4503a'], [0.7, '#f4a04a'], [1, '#f8d078']]); ctx.fillRect(A.x, A.y, A.w, h);
  ctx.fillStyle = rgrad(ctx, A.x + A.w * 0.3, b - h * 0.14, 0, h * 0.5, [[0, 'rgba(255,240,180,0.9)'], [0.3, 'rgba(255,200,110,0.5)'], [1, 'rgba(255,160,80,0)']]); ctx.fillRect(A.x, A.y, A.w, h);
  ctx.fillStyle = '#fff4c8'; circ(ctx, A.x + A.w * 0.3, b - h * 0.14, h * 0.07); ctx.fill();
  for (let k = 0; k < 3; k++) { ctx.fillStyle = `rgba(110,40,50,${0.25 + 0.1 * k})`; ell(ctx, A.x + A.w * (0.2 + 0.3 * k), A.y + h * (0.18 + 0.1 * k), A.w * 0.2, h * 0.02); ctx.fill(); }
  // far hills and an acacia
  ctx.fillStyle = '#6a2a3a'; ctx.beginPath(); ctx.moveTo(A.x, b); for (let i = 0; i <= 20; i++) ctx.lineTo(A.x + A.w * i / 20, b - h * (0.1 + 0.05 * Math.sin(i * 0.8) + 0.03 * hash(i))); ctx.lineTo(A.x + A.w, b); ctx.fill();
  const tx = A.x + A.w * 0.9, ty = b - h * 0.1; ctx.fillStyle = '#1e1020'; ctx.strokeStyle = '#1e1020'; ctx.lineWidth = Math.max(6, A.w * 0.012); ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx - 6, ty - h * 0.14, tx + 10, ty - h * 0.22); ctx.stroke();
  ell(ctx, tx + 6, ty - h * 0.25, A.w * 0.14, h * 0.045); ctx.fill(); ell(ctx, tx - A.w * 0.06, ty - h * 0.21, A.w * 0.08, h * 0.03); ctx.fill();
  ctx.strokeStyle = 'rgba(40,16,8,0.7)'; ctx.lineWidth = 2; for (let k = 0; k < 120; k++) { const x = A.x + A.w * hash(k * 2.1), y0 = b - 2; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + (hash(k) - 0.5) * 8, y0 - 8 - 16 * hash(k + 3)); ctx.stroke(); }
};
const OB = [['low', /low|left|deep|boom|big/], ['high', /high|right|small|bright|ring/], ['body', /body|bark|side|belly|log/], ['rim', /rim|end|edge|click|channel/]];
mkGong('obrom', /obrom|two.?hollow|lying.?log/, {
  wall: { kind: 'dusk' }, floor: { kind: 'earth', c1: '#9a4a2c' }, rail: '#4a1c10', light: '#ffd890', vig: 0.5, zones: OB,
  build: (K) => {
    const tall = K.tall, ref = tall ? { w: 780, h: 900 } : { w: 1180, h: 600 }, by = {};
    const L = tall ? 330 : 470, H = tall ? 215 : 150, yT = tall ? 330 : 170, yB = yT + H, topH = H * 0.56, lx = -L * 0.46, rx2 = L * 0.4, hy = yT + topH * 0.5;
    by.low = eSpot(lx, hy, L * 0.17, topH * 0.3, 0, {}); by.high = eSpot(rx2, hy, L * 0.13, topH * 0.27, 0, {}); by.body = rSpot(0, yT + topH + (H - topH) * 0.4, L * 0.7, H * 0.18, 0, {}); by.rim = eSpot(L * 0.92, yT + H * 0.5, L * 0.07, H * 0.45, 0, {});
    const floorY = yB + (tall ? 120 : 76);
    return { ref, by, wallU: yB + 40,
      draw(ctx, rt, fl) {
        const fL = fl('low'), fH = fl('high'), fB = fl('body'), fR = fl('rim'), fm = Math.max(fL, fH, fB, fR), wob = Math.sin(rt.anim * 40) * fm * 1.3;
        ctx.fillStyle = 'rgba(40,12,4,0.5)'; ell(ctx, 10, yB + (tall ? 98 : 62), L * 1.1, 20); ctx.fill();
        // crossed supports: two short logs lying crosswise, each propped on a wedge
        for (const sx of [-0.58, 0.58]) { const x0 = sx * L; ctx.save(); ctx.translate(x0, yB + (tall ? 52 : 36)); beam(ctx, -52, -22, 104, 62, '#4a2a14', { round: 26, seed: 3 + sx * 4, vertical: false }); ctx.restore(); ctx.fillStyle = '#2a1408'; poly(ctx, [[x0 - 40, yB + 6], [x0 + 40, yB + 6], [x0 + 30, yB + 30], [x0 - 30, yB + 30]]); ctx.fill(); }
        ctx.save(); ctx.translate(0, wob);
        const log = (g) => { g.beginPath(); g.moveTo(-L + H * 0.3, yT); g.lineTo(L - H * 0.3, yT); g.quadraticCurveTo(L + 8, yT, L + 8, yT + H * 0.5); g.quadraticCurveTo(L + 8, yB, L - H * 0.3, yB); g.lineTo(-L + H * 0.3, yB); g.quadraticCurveTo(-L - 8, yB, -L - 8, yT + H * 0.5); g.quadraticCurveTo(-L - 8, yT, -L + H * 0.3, yT); g.closePath(); };
        log(ctx); ctx.fillStyle = vgrad(ctx, yT, yB, [[0, '#9a6a3a'], [0.25, '#6a4220'], [0.6, '#3a2210'], [1, '#150a04']]); ctx.fill();
        ctx.save(); log(ctx); ctx.clip(); bark(ctx, -L - 10, yT, 2 * L + 20, H, 13, false);
        // the top: a pale worn strip with the two hollows and the channel
        ctx.fillStyle = vgrad(ctx, yT, yT + topH, [[0, '#c89a5e'], [0.5, '#a8703c'], [1, '#6a4020']]); ctx.beginPath(); ctx.moveTo(-L + 14, yT + 2); ctx.lineTo(L - 14, yT + 2); ctx.lineTo(L - 4, yT + topH); ctx.lineTo(-L + 4, yT + topH); ctx.closePath(); ctx.fill();
        grain(ctx, -L, yT, 2 * L, topH, '#3a1a08', 0.35, 21, false, 20);
        const hol = (cx, rx, ry, deep) => { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, cx + 3, hy + 6, rx + 6, ry + 5); ctx.fill(); ctx.fillStyle = rgrad(ctx, cx, hy, 0, rx, [[0, deep ? '#020100' : '#0c0602'], [0.75, '#2a1408'], [1, '#6a4020']], cx - rx * 0.2, hy - ry * 0.3); ell(ctx, cx, hy, rx, ry); ctx.fill(); ctx.strokeStyle = 'rgba(14,6,0,0.9)'; ctx.lineWidth = 2.4; ctx.stroke(); ctx.strokeStyle = 'rgba(255,224,170,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, hy, rx, ry, 0, 0.15, PI - 0.15); ctx.stroke(); ctx.strokeStyle = 'rgba(120,70,30,0.9)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(cx, hy, rx + 6, ry + 5, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = 'rgba(240,200,140,0.7)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(cx, hy - 1, rx + 9, ry + 8, 0, PI * 1.05, PI * 1.9); ctx.stroke(); };
        ctx.fillStyle = '#1a0c04'; rrect(ctx, lx, hy - 9, rx2 - lx, 18, 9); ctx.fill(); ctx.strokeStyle = 'rgba(255,224,170,0.4)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(lx, hy + 9); ctx.lineTo(rx2, hy + 9); ctx.stroke();
        hol(lx, L * 0.17, topH * 0.36, true); hol(rx2, L * 0.13, topH * 0.32, false);
        if (fL > 0.05) { ctx.fillStyle = `rgba(255,224,160,${0.4 * fL})`; ell(ctx, lx, hy, L * 0.2, topH * 0.44); ctx.fill(); }
        if (fH > 0.05) { ctx.fillStyle = `rgba(255,224,160,${0.4 * fH})`; ell(ctx, rx2, hy, L * 0.16, topH * 0.4); ctx.fill(); }
        for (const fx of [-0.72, 0.72]) { const rxp = L * fx; ctx.fillStyle = hgrad(ctx, rxp - 14, rxp + 14, [[0, '#2a1608'], [0.4, '#b88a4e'], [1, '#2a1608']]); ctx.fillRect(rxp - 12, yT, 24, H); ctx.strokeStyle = 'rgba(14,6,0,0.7)'; ctx.lineWidth = 2; ctx.strokeRect(rxp - 12, yT, 24, H); for (let k = 0; k < 8; k++) { ctx.fillStyle = 'rgba(14,6,0,0.5)'; ctx.fillRect(rxp - 12, yT + k * H / 8 + 3, 24, 3); } }
        // carved zigzag band along the side
        const zy = yT + topH + (H - topH) * 0.5; ctx.strokeStyle = '#e8d4a0'; ctx.lineWidth = 3.4; ctx.beginPath(); for (let k = 0; k <= 40; k++) { const x = -L * 0.9 + (1.8 * L) * k / 40, y = zy + (k % 2 ? 7 : -7); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
        if (fB > 0.05) { ctx.fillStyle = `rgba(255,224,160,${0.3 * fB})`; ctx.fillRect(-L, yT + topH, 2 * L, H - topH); }
        ctx.fillStyle = hgrad(ctx, -L, L, [[0, 'rgba(0,0,0,0.35)'], [0.12, 'rgba(0,0,0,0)'], [0.9, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.4)']]); ctx.fillRect(-L - 10, yT, 2 * L + 20, H);
        ctx.restore(); log(ctx); ctx.strokeStyle = 'rgba(14,6,0,0.9)'; ctx.lineWidth = 3; ctx.stroke();
        // the right end: sawn face with growth rings, seen at a glancing angle
        ringsFace(ctx, L + 2, yT + H * 0.5, H * 0.16, H * 0.46, '#c8985a');
        if (fR > 0.05) { ctx.fillStyle = `rgba(255,235,180,${0.45 * fR})`; ell(ctx, L + 2, yT + H * 0.5, H * 0.16, H * 0.46); ctx.fill(); }
        ctx.restore();
        for (let k = 0; k < 26; k++) { const gx2 = (hash(k * 5.3) - 0.5) * L * 2.6, gy = floorY + (tall ? 190 : 120) * hash(k + 3) + 10; ctx.strokeStyle = `rgba(${150 + 40 * hash(k)},${100 + 30 * hash(k + 2)},50,0.85)`; ctx.lineWidth = 2.4; for (let j = -1; j <= 1; j++) { ctx.beginPath(); ctx.moveTo(gx2, gy); ctx.quadraticCurveTo(gx2 + j * 5, gy - 14, gx2 + j * 11, gy - 26 - 10 * hash(k + j)); ctx.stroke(); } }
        for (let k = 0; k < 6; k++) { ctx.fillStyle = '#d8b078'; poly(ctx, [[-L * 0.9 + k * 80, floorY + 8], [-L * 0.9 + k * 80 + 14, floorY + 3], [-L * 0.9 + k * 80 + 20, floorY + 12]]); ctx.fill(); }
        const tg = [[fL, lx, hy], [fH, rx2, hy], [fB, 0, yT + topH + (H - topH) * 0.4], [fR, L, yT + H * 0.5]].sort((a, b) => b[0] - a[0])[0];
        visit(ctx, tg[1], tg[2], tg[0], { dir: [0.5, -0.9], back: 120, len: 250, hr: 9, ang: 2.2, ...STICK });
        if (!(tg[0] > 0.06)) { padBeater(ctx, -L * 0.5, floorY + (tall ? 36 : 22), -0.03, 250, 9, STICK); padBeater(ctx, -L * 0.2, floorY + (tall ? 62 : 40), 0.03, 230, 9, STICK); }
      } };
  },
});

// ============================================================ ADOMBA (four brass cup bells with swinging iron clappers on a carved bar) =====
// Each bell is an inverted cup of cast brass, wider and shallower than a church bell, with a flared lip, a loop and an iron clapper hanging inside on a rod that swings out
// and knocks the lip when the bell is struck. They hang from a carved wooden bar on cords. Room: a whitewashed courtyard, a blue door, a strip of woven cloth in bands.
WALLS.courtyard = (ctx, A, b, o) => {
  const h = b - A.y; ctx.fillStyle = vgrad(ctx, A.y, b, [[0, '#e8dcc0'], [1, '#d4c4a0']]); ctx.fillRect(A.x, A.y, A.w, h);
  for (let k = 0; k < 120; k++) { ctx.fillStyle = `rgba(120,96,64,${0.03 + 0.05 * hash(k)})`; ell(ctx, A.x + hash(k * 2.3) * A.w, A.y + hash(k * 3.1 + 1) * h, 8 + 30 * hash(k + 2), 4 + 12 * hash(k + 4)); ctx.fill(); }
  // a deep blue wooden door with a lintel and iron studs, and a woven cloth hung on a rail
  const dw = Math.min(A.w * 0.3, 280), dx = A.x + A.w * 0.5 - dw / 2, dy = A.y + h * 0.1;
  ctx.fillStyle = 'rgba(60,40,20,0.35)'; ctx.fillRect(dx - 12, dy - 12, dw + 24, b - dy + 12);
  ctx.fillStyle = hgrad(ctx, dx, dx + dw, [[0, '#0c2a5a'], [0.5, '#1a4a8a'], [1, '#0c2a5a']]); rrect(ctx, dx, dy, dw, b - dy + 4, dw * 0.2); ctx.fill(); ctx.strokeStyle = '#0a1a34'; ctx.lineWidth = 3; ctx.stroke();
  for (let k = 1; k < 5; k++) { ctx.strokeStyle = 'rgba(0,0,20,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(dx + dw * k / 5, dy + 6); ctx.lineTo(dx + dw * k / 5, b); ctx.stroke(); }
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { ctx.fillStyle = '#c8a050'; circ(ctx, dx + dw * (0.2 + 0.2 * c), dy + (b - dy) * (0.2 + 0.18 * r), 4); ctx.fill(); }
  const cx0 = A.x + A.w * 0.06, cw = A.w * 0.2, cy0 = A.y + h * 0.16, ch = h * 0.36;
  for (const [xx] of [[cx0], [A.x + A.w - cw - A.w * 0.06]]) { ctx.fillStyle = '#4a2a10'; ctx.fillRect(xx - 6, cy0 - 8, cw + 12, 8); const cols = ['#c8342a', '#e8b030', '#1a6a3a', '#111', '#e8b030', '#c8342a']; for (let k = 0; k < 6; k++) { ctx.fillStyle = cols[k]; ctx.fillRect(xx + k * cw / 6, cy0, cw / 6 + 1, ch); } for (let k = 0; k < 6; k++) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let j = 0; j < 5; j++) ctx.fillRect(xx + k * cw / 6 + 4, cy0 + 12 + j * ch / 5, cw / 6 - 8, 3); } ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(xx, cy0 + ch - 6, cw, 6); }
};
const AD = [['big', /big|low|deep|large|boom/], ['mid', /mid.*low|^mid$|medium|middle/], ['small', /mid.*high|small|high/], ['tiny', /tiny|top|bright|little|clapper/]];
function cup(ctx, cx, ytop, w, h, f, ph, seed, pal = null) {
  // a cup bell: loop, domed crown, a gently flared body, a thick lip; returns the lip centre
  const wt = pal ? w * 0.42 : w * 0.34, prof = pal ? (t) => w * (0.42 + 0.4 * Math.sin(Math.min(1, t * 1.2) * PI / 2) + 0.2 * Math.pow(t, 7)) : (t) => wt + (w - wt) * (1 - Math.pow(1 - t, 2.2)) + w * 0.14 * Math.pow(t, 6);
  const body = (g) => { g.beginPath(); if (pal) { const t0 = 0.1, w0 = prof(t0); g.moveTo(cx - w0, ytop + h * t0); g.bezierCurveTo(cx - w0, ytop - h * 0.02, cx + w0, ytop - h * 0.02, cx + w0, ytop + h * t0); for (let i = 2; i <= 18; i++) { const t = i / 18; if (t > t0) g.lineTo(cx + prof(t), ytop + h * t); } g.ellipse(cx, ytop + h, w * 1.14, w * 0.18, 0, 0, PI); for (let i = 18; i >= 2; i--) { const t = i / 18; if (t > t0) g.lineTo(cx - prof(t), ytop + h * t); } g.closePath(); return; }
    g.moveTo(cx - wt, ytop + 4); for (let i = 0; i <= 18; i++) { const t = i / 18; g.lineTo(cx - prof(t), ytop + h * t); } g.ellipse(cx, ytop + h, w * 1.14, w * 0.18, 0, PI, 0, true); for (let i = 18; i >= 0; i--) { const t = i / 18; g.lineTo(cx + prof(t), ytop + h * t); } g.closePath(); };
  ctx.strokeStyle = '#3a2410'; ctx.lineWidth = w * 0.12; ctx.beginPath(); ctx.ellipse(cx, ytop - w * 0.2, w * 0.22, w * 0.28, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#d8a850'; ctx.lineWidth = w * 0.05; ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.save(); ctx.translate(12, 12); body(ctx); ctx.fill(); ctx.restore();
  // the mouth, dark, with the clapper hanging inside and below
  ctx.fillStyle = '#0a0604'; ell(ctx, cx, ytop + h, w * 1.1, w * 0.17); ctx.fill();
  const sw2 = Math.sin(ph) * f, cl = pal?.paddle ? h * 1.0 : h * 0.55, ax = cx, ay = ytop + h * 0.25, tx = ax + Math.sin(0.12 + sw2 * 0.55) * cl, ty = ay + Math.cos(0.12 + sw2 * 0.55) * cl;
  if (pal?.paddle) { ctx.save(); ctx.translate(ax, ay); ctx.rotate(0.12 + sw2 * 0.55); ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, cl * 0.7); ctx.stroke(); ctx.fillStyle = vgrad(ctx, cl * 0.55, cl * 1.15, [[0, '#d8b070'], [1, '#6a4420']]); rrect(ctx, -w * 0.22, cl * 0.6, w * 0.44, cl * 0.5, 6); ctx.fill(); ctx.strokeStyle = 'rgba(30,14,4,0.9)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
  else { ctx.strokeStyle = '#1a1410'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(tx, ty); ctx.stroke(); ctx.fillStyle = rgrad(ctx, tx - 2, ty - 2, 0, 11, [[0, '#9aa0a8'], [1, '#1a1c20']]); circ(ctx, tx, ty, 9); ctx.fill(); }
  body(ctx); ctx.fillStyle = hgrad(ctx, cx - w, cx + w, pal ? pal.body : [[0, '#4a2c08'], [0.16, '#f2d070'], [0.34, '#c8982a'], [0.55, '#a0721a'], [0.82, '#5a3a0c'], [1, '#2a1804']]); ctx.fill();
  ctx.save(); body(ctx); ctx.clip();
  if (pal) { for (let k = 0; k < 46; k++) { const t = 0.12 + 0.8 * hash(seed + k * 1.9), xx = cx + (hash(seed + k * 3.7) - 0.5) * prof(t) * 1.7; ctx.fillStyle = hash(k + seed) > 0.5 ? 'rgba(255,200,150,0.13)' : 'rgba(0,0,0,0.22)'; ell(ctx, xx, ytop + h * t, 8 + 14 * hash(seed + k), 4 + 8 * hash(seed + k + 2)); ctx.fill(); }
    for (let k = 0; k < 11; k++) { const xx = cx - prof(0.22) * 0.9 + (2 * prof(0.22) * 0.9) * k / 10; ctx.fillStyle = rgrad(ctx, xx - 1, ytop + h * 0.22 - 1, 0, 6, [[0, '#d8c0a0'], [1, '#3a2418']]); circ(ctx, xx, ytop + h * 0.22, 4.4); ctx.fill(); }
    ctx.fillStyle = hgrad(ctx, cx - w, cx + w, [[0, 'rgba(0,0,0,0.3)'], [0.3, 'rgba(210,190,170,0.5)'], [1, 'rgba(0,0,0,0.3)']]); ctx.fillRect(cx - w * 1.2, ytop + h * 0.9, w * 2.4, h * 0.1); }
  for (const t of [0.12, 0.62, 0.86]) { const y = ytop + h * t, ww = prof(t); ctx.fillStyle = hgrad(ctx, cx - ww, cx + ww, [[0, '#3a2408'], [0.25, '#f6dc88'], [0.55, '#8a6218'], [1, '#2a1804']]); ctx.fillRect(cx - ww, y - 3, 2 * ww, 7); }
  ctx.strokeStyle = 'rgba(60,34,6,0.7)'; ctx.lineWidth = 2; for (let k = 0; k < 5; k++) { const y = ytop + h * (0.2 + 0.08 * k); ctx.beginPath(); for (let i = 0; i <= 16; i++) { const x = cx - prof(0.3) + 2 * prof(0.3) * i / 16; i ? ctx.lineTo(x, y + (i % 2 ? 4 : -4)) : ctx.moveTo(x, y); } ctx.stroke(); }
  for (let k = 0; k < 40; k++) { ctx.fillStyle = `rgba(255,236,160,${0.08 * hash(seed + k)})`; ell(ctx, cx + (hash(seed + k * 2.1) - 0.5) * w * 1.4, ytop + h * hash(seed + k * 3.3), 3 + 6 * hash(seed + k), 2 + 4 * hash(seed + k + 1)); ctx.fill(); }
  ctx.restore(); body(ctx); ctx.strokeStyle = 'rgba(40,22,2,0.9)'; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.strokeStyle = pal ? 'rgba(200,190,175,0.7)' : 'rgba(255,230,150,0.8)'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.ellipse(cx, ytop + h, w * 1.14, w * 0.18, 0, 0.05, PI - 0.05); ctx.stroke();
  if (f > 0.05) { ctx.globalCompositeOperation = 'lighter'; body(ctx); ctx.fillStyle = `rgba(255,220,130,${0.34 * f})`; ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
  return [tx, ty];
}
mkGong('adomba', /adomba|cup.?bell|clapper.?bell|hand.?bell.?clapper|effutu/, {
  wall: { kind: 'courtyard' }, floor: { kind: 'stone', c1: '#b8a88a' }, rail: '#7a4a24', light: '#fff0c0', vig: 0.46, zones: AD,
  build: (K) => {
    const tall = K.tall, ref = tall ? { w: 780, h: 900 } : { w: 1120, h: 600 }, by = {};
    const gx = tall ? 150 : 218, xs = [-1.5, -0.5, 0.5, 1.5].map((m) => m * gx), ws = tall ? [74, 62, 52, 43] : [84, 71, 59, 49], hs = tall ? [190, 160, 135, 112] : [166, 140, 118, 98];
    const barY = tall ? 150 : 86, drop = [tall ? 150 : 96, tall ? 150 : 96, tall ? 150 : 96, tall ? 150 : 96], keys = ['big', 'mid', 'small', 'tiny'];
    keys.forEach((k, i) => { by[k] = eSpot(xs[i], barY + drop[i] + hs[i] * 0.55, ws[i] * 0.9, hs[i] * 0.34, 0, {}); });
    const floorY = tall ? 820 : 540;
    return { ref, by, wallU: floorY - 30,
      draw(ctx, rt, fl) {
        const fs = keys.map((k) => fl(k)), fm = Math.max(...fs);
        // the carved bar on two posts, with cords down to each bell
        for (const sx of [-1, 1]) { beam(ctx, sx * gx * 2.3 - 22, barY - 12, 44, floorY - barY + 12, '#5a3418', { vertical: true, round: 8, seed: 5 + sx }); }
        beam(ctx, -gx * 2.4, barY - 24, gx * 4.8, 46, '#6a3c1c', { round: 10, seed: 9 });
        ctx.fillStyle = '#e8b030'; for (let k = 0; k < 9; k++) { poly(ctx, [[-gx * 2.3 + k * gx * 0.575, barY - 8], [-gx * 2.3 + k * gx * 0.575 + 12, barY + 8], [-gx * 2.3 + k * gx * 0.575 - 12, barY + 8]]); ctx.fill(); }
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 10, floorY + 8, gx * 2.7, 20); ctx.fill();
        keys.forEach((k, i) => {
          const tilt = Math.sin(rt.anim * 24 + i) * fs[i] * 0.03; ctx.save(); ctx.translate(xs[i], barY + 14); ctx.rotate(tilt); ctx.translate(-xs[i], -(barY + 14));
          ctx.strokeStyle = '#4a2c14'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(xs[i], barY + 20); ctx.lineTo(xs[i], barY + drop[i] - ws[i] * 0.5); ctx.stroke();
          cup(ctx, xs[i], barY + drop[i], ws[i], hs[i], fs[i], rt.anim * 38 + i, 11 + i * 7); ctx.restore();
          if (fs[i] > 0.05) { rings(ctx, xs[i], barY + drop[i] + hs[i] * 0.6, ws[i] * 1.1, fs[i], '255,236,170'); glow(ctx, xs[i], barY + drop[i] + hs[i] * 0.6, ws[i] * 2.6, '#ffd070', 0.26 * fs[i]); }
        });
        void fm;
      } };
  },
});

// ============================================================ PHYE GHAN (a big iron wind bell with a wooden paddle clapper, hung under a hill-house eave) ====
// One tall, slim dark iron bell, rust-brown with a pale lip, hangs from a bamboo beam; a flat wooden paddle hangs inside and the wind swings it against the bell wall.
// Room: a bright mountain morning: blue sky, white cloud, green stepped terraces, a stone wall; wind streaks.
WALLS.terrace = (ctx, A, b, o) => {
  const h = b - A.y; ctx.fillStyle = vgrad(ctx, A.y, b, [[0, '#5a9ad8'], [0.5, '#a8d0f0'], [1, '#e8f0f0']]); ctx.fillRect(A.x, A.y, A.w, h);
  for (let k = 0; k < 6; k++) { ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.3 * hash(k)})`; ell(ctx, A.x + A.w * (hash(k * 3) * 0.9 + 0.05), A.y + h * (0.1 + 0.3 * hash(k + 4)), A.w * (0.08 + 0.1 * hash(k + 2)), h * 0.035); ctx.fill(); }
  for (const [top, c] of [[0.52, '#7a9ab0'], [0.4, '#5a8a98']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(A.x, b); for (let i = 0; i <= 24; i++) ctx.lineTo(A.x + A.w * i / 24, b - h * (top + 0.08 * Math.sin(i * 0.5 + top * 9) + 0.04 * hash(i + top * 20))); ctx.lineTo(A.x + A.w, b); ctx.fill(); }
  { ctx.fillStyle = 'rgba(255,255,255,0.85)'; const pk = [[0.18, 0.62], [0.46, 0.7], [0.78, 0.58]]; for (const [fx, ph] of pk) { const x = A.x + A.w * fx, y = b - h * ph, sz = h * 0.09; poly(ctx, [[x, y], [x + sz * 0.55, y + sz * 0.9], [x + sz * 0.2, y + sz * 0.75], [x, y + sz * 1.0], [x - sz * 0.25, y + sz * 0.8], [x - sz * 0.55, y + sz * 0.9]]); ctx.fill(); }
    ctx.fillStyle = vgrad(ctx, b - h * 0.5, b - h * 0.3, [[0, 'rgba(235,245,250,0)'], [0.6, 'rgba(235,245,250,0.55)'], [1, 'rgba(235,245,250,0)']]); ctx.fillRect(A.x, b - h * 0.5, A.w, h * 0.2); }
  for (let t = 4; t >= 0; t--) {
    const y = b - h * (0.02 + 0.115 * t) - h * 0.16, amp = 3 + t * 2, ph = t * 1.7;
    ctx.fillStyle = `rgb(${52 + 18 * (4 - t)},${118 + 14 * (4 - t)},${50 + 6 * (4 - t)})`; ctx.beginPath(); ctx.moveTo(A.x, b);
    for (let i = 0; i <= 24; i++) ctx.lineTo(A.x + A.w * i / 24, y - amp * Math.sin(i * 0.6 + ph)); ctx.lineTo(A.x + A.w, b); ctx.fill();
    ctx.strokeStyle = 'rgba(20,70,30,0.35)'; ctx.lineWidth = 2; for (let r = 1; r < 4; r++) { ctx.beginPath(); for (let i = 0; i <= 24; i++) { const x = A.x + A.w * i / 24, yy = y + r * h * 0.022 - amp * Math.sin(i * 0.6 + ph); i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); } ctx.stroke(); }
    ctx.fillStyle = 'rgba(96,90,76,0.85)'; ctx.beginPath(); for (let i = 0; i <= 24; i++) { const x = A.x + A.w * i / 24, yy = y - amp * Math.sin(i * 0.6 + ph); i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); } for (let i = 24; i >= 0; i--) ctx.lineTo(A.x + A.w * i / 24, y - amp * Math.sin(i * 0.6 + ph) + h * 0.016); ctx.fill();
  }
  const hx = A.x + A.w * 0.82, hy = b - h * 0.02 - h * 0.16 - h * 0.115 * 2 + 4, hw = Math.min(A.w * 0.12, h * 0.16); ctx.fillStyle = '#efe8d8'; ctx.fillRect(hx, hy - hw * 0.5, hw, hw * 0.5); ctx.fillStyle = '#3a3a40'; poly(ctx, [[hx - 8, hy - hw * 0.5], [hx + hw / 2, hy - hw * 0.9], [hx + hw + 8, hy - hw * 0.5]]); ctx.fill(); ctx.fillStyle = '#5a4a30'; ctx.fillRect(hx + hw * 0.4, hy - hw * 0.3, hw * 0.2, hw * 0.3);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; for (let k = 0; k < 7; k++) { const x = A.x + A.w * (0.05 + 0.13 * k), y = A.y + h * (0.3 + 0.08 * hash(k)); ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 30, y - 8, x + 50, y + 10, x + 90, y); ctx.stroke(); }
};
const PG = [['lip', /lip|rim|low|deep/], ['waist', /waist|body|mid/], ['shoulder', /shoulder|upper|high/], ['paddle', /paddle|clapper|wood|tick/]];
mkGong('windbell', /phye|wind.?bell|paddle.?clapper|sunuwar/, {
  wall: { kind: 'terrace' }, floor: { kind: 'stone', c1: '#a8a090' }, rail: '#5a5448', light: '#fff4d0', vig: 0.4, zones: PG,
  build: (K) => {
    const tall = K.tall, ref = tall ? { w: 780, h: 940 } : { w: 1100, h: 620 }, by = {};
    const bw = tall ? 150 : 110, bh = tall ? 400 : 290, barY = tall ? 90 : 46, top = barY + (tall ? 86 : 56), px = tall ? 300 : 360, floorY = tall ? 840 : 560;
    by.lip = eSpot(0, top + bh * 0.88, bw * 0.9, bh * 0.06, 0, {}); by.waist = eSpot(0, top + bh * 0.58, bw * 0.78, bh * 0.1, 0, {}); by.shoulder = eSpot(0, top + bh * 0.3, bw * 0.62, bh * 0.09, 0, {}); by.paddle = eSpot(0, top + bh * 1.02, bw * 0.5, bh * 0.07, 0, {});
    return { ref, by, wallU: floorY - 24,
      draw(ctx, rt, fl) {
        const f = { lip: fl('lip'), waist: fl('waist'), shoulder: fl('shoulder'), paddle: fl('paddle') }, fm = Math.max(f.lip, f.waist, f.shoulder, f.paddle);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 8, floorY + 8, px + 60, 18); ctx.fill();
        for (const sx of [-1, 1]) beam(ctx, sx * px - 18, barY, 36, floorY - barY, '#8a6a30', { vertical: true, round: 14, seed: 4 + sx });
        for (const sx of [-1, 1]) for (let k = 0; k < 9; k++) { const x0 = sx * (px + 10), y0 = barY - 4 + k * 6, ang = (sx > 0 ? -0.3 : PI + 0.3) + (k - 4) * 0.22 * -sx, l = (tall ? 120 : 90) * (0.6 + 0.4 * hash(k + sx)); ctx.save(); ctx.translate(x0, y0); ctx.rotate(ang); ctx.fillStyle = k % 2 ? '#2e6a30' : '#3e8a3c'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(l * 0.5, -9, l, 0); ctx.quadraticCurveTo(l * 0.5, 9, 0, 0); ctx.fill(); ctx.restore(); }

        beam(ctx, -px - 40, barY - 18, 2 * px + 80, 38, '#9a7a38', { round: 16, seed: 8 });
        ctx.fillStyle = '#5a4a24'; for (const sx of [-1, 1]) for (const dy of [0.2, 0.5, 0.8]) ctx.fillRect(sx * px - 20, barY + (floorY - barY) * dy, 40, 5);
        const sway = Math.sin(rt.anim * 6) * 0.015 + Math.sin(rt.anim * 30) * fm * 0.02; ctx.save(); ctx.translate(0, barY + 14); ctx.rotate(sway); ctx.translate(0, -(barY + 14));
        ctx.strokeStyle = '#3a2a14'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, barY + 16); ctx.lineTo(0, top - bw * 0.3); ctx.stroke();
        cup(ctx, 0, top, bw, bh, fm, rt.anim * 30, 5, { paddle: true, body: [[0, '#1a0c08'], [0.16, '#8a5a40'], [0.34, '#5a3828'], [0.55, '#3e281c'], [0.82, '#24160e'], [1, '#0c0604']] });
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        for (let k = 0; k < 4; k++) { const ph = rt.anim * 1.6 + k * 1.57, x0 = -px * 0.9 + ((ph * 80) % (px * 1.8)), y0 = top + bh * (0.15 + 0.22 * k); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.bezierCurveTo(x0 + 40, y0 - 14, x0 + 70, y0 + 16, x0 + 110, y0 + 2); ctx.bezierCurveTo(x0 + 130, y0 - 6, x0 + 140, y0 + 6, x0 + 128, y0 + 10); ctx.stroke(); }
        if (fm > 0.05) { rings(ctx, 0, top + bh * 0.6, bw * 1.1, fm, '255,240,210'); glow(ctx, 0, top + bh * 0.6, bw * 2.4, '#fff0c0', 0.2 * fm); }
      } };
  },
});
void TAU; void mix; void rgba; void lighter; void darker; void lerp; void poly; void glow;

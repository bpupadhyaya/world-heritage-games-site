// shape-craft `paint` workshops (registerSceneSet): one room per tradition so no two painting games share a backdrop, a dock of the real
// tools and pots, or a sound. Scene ids equal the figure ids in src/paint-figures/.
import { registerSceneSet } from './registry.js';
import { hash } from './geom.js';
import { WALL } from './scenes.js';
import { tint, mix, rgba, rrect } from './fx.js';
import { lg, rg, ell, cast, TAU } from './props.js';

const reedTone = ['#e8d4a0', '#b89a5a', '#6a5230'];
const props = {
  kalam(ctx, s, o = {}) { // a cut reed pen
    const h = s * 0.045;
    rrect(ctx, -s / 2, -h / 2, s * 0.86, h, h / 2); ctx.fillStyle = lg(ctx, 0, -h / 2, 0, h / 2, [[0, reedTone[0]], [0.5, reedTone[1]], [1, reedTone[2]]]); ctx.fill();
    ctx.strokeStyle = 'rgba(60,40,10,0.5)'; ctx.lineWidth = 1.2; for (const f of [-0.12, 0.18]) { ctx.beginPath(); ctx.moveTo(s * f, -h / 2); ctx.lineTo(s * f, h / 2); ctx.stroke(); }
    ctx.fillStyle = lg(ctx, 0, -h / 2, 0, h / 2, [[0, reedTone[0]], [1, reedTone[2]]]); ctx.beginPath(); ctx.moveTo(s * 0.36, -h / 2); ctx.lineTo(s / 2, -h * 0.08); ctx.lineTo(s / 2, h * 0.08); ctx.lineTo(s * 0.36, h / 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = o.c ?? '#24160e'; ctx.beginPath(); ctx.moveTo(s * 0.44, -h * 0.28); ctx.lineTo(s / 2, -h * 0.07); ctx.lineTo(s / 2, h * 0.07); ctx.lineTo(s * 0.44, h * 0.28); ctx.closePath(); ctx.fill();
  },
  tjanting(ctx, s) { // wooden handle, copper cup of hot wax, a fine spout
    const h = s * 0.07;
    rrect(ctx, -s / 2, -h / 2, s * 0.5, h, h / 2); ctx.fillStyle = lg(ctx, 0, -h / 2, 0, h / 2, [[0, '#d09a5a'], [0.5, '#9a6a34'], [1, '#4a2e14']]); ctx.fill();
    ctx.fillStyle = lg(ctx, 0, -s * 0.09, 0, s * 0.09, [[0, '#f0b080'], [0.5, '#c0683a'], [1, '#6a2e16']]); ctx.beginPath(); ctx.ellipse(s * 0.12, 0, s * 0.11, s * 0.085, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f1dfa0'; ctx.beginPath(); ctx.ellipse(s * 0.12, -s * 0.01, s * 0.085, s * 0.05, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#b8662f'; ctx.lineWidth = s * 0.022; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * 0.2, s * 0.02); ctx.quadraticCurveTo(s * 0.36, s * 0.0, s / 2, -s * 0.03); ctx.stroke();
    ctx.fillStyle = '#f4e3a6'; ctx.beginPath(); ctx.arc(s / 2, -s * 0.03, s * 0.014, 0, TAU); ctx.fill();
  },
  kistka(ctx, s) { // egg stylus: a stick with a brass funnel
    const h = s * 0.045;
    rrect(ctx, -s / 2, -h / 2, s * 0.62, h, h / 2); ctx.fillStyle = lg(ctx, 0, -h / 2, 0, h / 2, [[0, '#e6c48a'], [0.5, '#a67a42'], [1, '#5a3a1a']]); ctx.fill();
    ctx.fillStyle = lg(ctx, 0, -h, 0, h, [[0, '#fff0b0'], [0.5, '#d9a431'], [1, '#6a4a10']]); ctx.beginPath(); ctx.moveTo(s * 0.1, -h * 0.9); ctx.lineTo(s * 0.4, -h * 0.35); ctx.lineTo(s * 0.4, h * 0.35); ctx.lineTo(s * 0.1, h * 0.9); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#d9a431'; ctx.lineWidth = s * 0.014; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * 0.4, 0); ctx.lineTo(s / 2, 0); ctx.stroke();
  },
  ricestick(ctx, s) { // a chewed bamboo twig dipped in rice paste
    const h = s * 0.04;
    rrect(ctx, -s / 2, -h / 2, s * 0.9, h, h / 2); ctx.fillStyle = lg(ctx, 0, -h / 2, 0, h / 2, [[0, '#e0d090'], [0.5, '#a89a50'], [1, '#5a5020']]); ctx.fill();
    ctx.strokeStyle = 'rgba(40,40,10,0.45)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-s * 0.1, -h / 2); ctx.lineTo(-s * 0.1, h / 2); ctx.stroke();
    ctx.fillStyle = '#f7f1e3'; ctx.beginPath(); ctx.ellipse(s * 0.43, 0, s * 0.07, h * 0.8, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(s * 0.4, -h * 0.5, s * 0.05, h * 0.2);
  },
  waxpot(ctx, s) { // copper pot of melted wax on a little flame
    const r = s * 0.3; cast(ctx, 2, r * 0.9, r * 1.1, r * 0.28);
    ctx.fillStyle = lg(ctx, -r, 0, r, 0, [[0, '#7a3a1a'], [0.35, '#e0905a'], [1, '#6a2e14']]); ctx.beginPath(); ctx.moveTo(-r * 0.95, -r * 0.2); ctx.quadraticCurveTo(-r * 1.1, r * 0.85, 0, r * 0.9); ctx.quadraticCurveTo(r * 1.1, r * 0.85, r * 0.95, -r * 0.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f1dfa0'; ell(ctx, 0, -r * 0.2, r * 0.9, r * 0.3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ell(ctx, -r * 0.25, -r * 0.25, r * 0.35, r * 0.1); ctx.fill();
    ctx.fillStyle = '#ffb040'; ctx.beginPath(); ctx.moveTo(-r * 0.2, r * 1.15); ctx.quadraticCurveTo(0, r * 0.7, r * 0.2, r * 1.15); ctx.fill();
  },
  candle(ctx, s) {
    const w = s * 0.12; cast(ctx, 1, s * 0.34, w * 1.4, w * 0.4);
    rrect(ctx, -w / 2, -s * 0.2, w, s * 0.52, w * 0.3); ctx.fillStyle = lg(ctx, -w / 2, 0, w / 2, 0, [[0, '#fff6dc'], [0.5, '#f1e2b0'], [1, '#bda870']]); ctx.fill();
    const f = rg(ctx, 0, -s * 0.3, 1, s * 0.22, [[0, 'rgba(255,230,150,0.9)'], [1, 'rgba(255,160,40,0)']]); ctx.fillStyle = f; ell(ctx, 0, -s * 0.3, s * 0.2, s * 0.24); ctx.fill();
    ctx.fillStyle = '#ffd36a'; ctx.beginPath(); ctx.moveTo(0, -s * 0.46); ctx.quadraticCurveTo(w * 0.8, -s * 0.28, 0, -s * 0.2); ctx.quadraticCurveTo(-w * 0.8, -s * 0.28, 0, -s * 0.46); ctx.fill();
  },
};

// 1.8.0: the painting panel is large and centred, so wall props must live in the margins beside it (never half hidden behind it).
function sideRects(r, s) {
  const dk = Math.max(46, Math.min(78, r.h * 0.16)), ph = r.h - dk - 56, pw = Math.min(r.w - 12, ph * (s.ar ?? 1)), m = (r.w - pw) / 2;
  return m >= 34 ? [{ x: r.x, y: r.y, w: m * 0.9, h: r.h }, { x: r.x + r.w - m * 0.9, y: r.y, w: m * 0.9, h: r.h }] : [];
}
const sideWall = (base, key) => (ctx, s, r, H, t) => {
  WALL[base](ctx, { ...s, [key]: [] }, r, H, t);
  const sides = sideRects(r, s), items = s[key] ?? [];
  sides.forEach((sr, i) => {
    const mine = items.filter((_, k) => k % 2 === i).slice(0, 1); if (!mine.length) return;
    ctx.save(); ctx.beginPath(); ctx.rect(sr.x, r.y, sr.w, H + 2); ctx.clip();
    WALL[base](ctx, { ...s, [key]: mine }, { ...r, x: sr.x, w: sr.w }, H, t);
    ctx.restore();
  });
};
const walls = {
  // 1.8.0 side walls: nothing sits behind the centred panel; props live in the margins beside it
  paintmarket(ctx, s, r, H) { // corrugated sheet; painted boards hang on nails, one in each margin
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.12)], [1, tint(s.wallC, -0.2)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let x = r.x; x < r.x + r.w; x += 14) { ctx.fillStyle = lg(ctx, x, 0, x + 14, 0, [[0, 'rgba(255,255,255,0.18)'], [0.5, 'rgba(0,0,0,0.0)'], [1, 'rgba(0,0,0,0.22)']]); ctx.fillRect(x, r.y, 14, H); }
    const cols = [['#f6c928', '#1f4fa8', '#d63a2a'], ['#d63a2a', '#f6c928', '#1f4fa8'], ['#2f9a4a', '#f08a1e', '#171717'], ['#1f4fa8', '#f6c928', '#d63a2a']];
    sideRects(r, s).forEach((sr, i) => { const bw = Math.min(sr.w * 0.78, H * 0.7), bh = bw * 1.05, bx = sr.x + (sr.w - bw) / 2, by = r.y + H * 0.2, c = cols[i];
      ctx.save(); ctx.translate(bx + bw / 2, by); ctx.rotate((i ? 1 : -1) * 0.05); cast(ctx, 3, bh + 3, bw * 0.5, 4, 0.3); ctx.fillStyle = c[0]; ctx.fillRect(-bw / 2, 0, bw, bh); ctx.fillStyle = c[1]; ctx.beginPath(); ctx.ellipse(0, bh * 0.45, bw * 0.3, bh * 0.2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = c[2]; ctx.fillRect(-bw / 2, bh * 0.82, bw, bh * 0.1);
      ctx.fillStyle = '#e8e2d0'; ell(ctx, 0, 4, 3, 3); ctx.fill(); ctx.restore(); });
  },
  paintcloth(ctx, s, r, H, t) { // dyed cloths drying on a line, hung in the margins
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#e9e1cf'], [1, '#c9bda0']]); ctx.fillRect(r.x, r.y, r.w, H);
    const y = r.y + H * 0.1; ctx.strokeStyle = '#6a5438'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(r.x, y); ctx.quadraticCurveTo(r.x + r.w / 2, y + 8, r.x + r.w, y); ctx.stroke();
    const cols = ['#a8322a', '#27468f', '#d9a21e', '#3f7a46'];
    sideRects(r, s).forEach((sr, i) => { const n = Math.max(1, Math.floor(sr.w / 62)); for (let k = 0; k < n; k++) { const x = sr.x + (sr.w * (k + 0.5)) / n, w = (sr.w / n) * 0.74, h = H * (0.62 + 0.2 * hash(k + i * 3, 3)), sw = Math.sin(t * 1.1 + k + i) * 2.5, c = cols[(k + i * 2) % cols.length];
      ctx.fillStyle = lg(ctx, x - w / 2, 0, x + w / 2, 0, [[0, tint(c, -0.15)], [0.5, c], [1, tint(c, -0.3)]]); ctx.beginPath(); ctx.moveTo(x - w / 2, y + 4); ctx.lineTo(x + w / 2, y + 4); ctx.lineTo(x + w / 2 + sw, y + h); ctx.lineTo(x - w / 2 + sw, y + h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = rgba('#f1e6c9', 0.55); for (let q = 0; q < 5; q++) { ell(ctx, x + sw * 0.5 + (hash(k + i, q) - 0.5) * w * 0.6, y + h * (0.2 + q * 0.14), 2.4, 2.4); ctx.fill(); }
      ctx.fillStyle = '#d6b27a'; ctx.fillRect(x - w * 0.3, y - 2, 5, 12); ctx.fillRect(x + w * 0.3 - 5, y - 2, 5, 12); } });
  },
  paintboxes(ctx, s, r, H, t) { // dark wall, a hanging lamp and a shelf of finished lacquer boxes
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#0e0906'], [1, s.wallC]]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.strokeStyle = 'rgba(226,179,74,0.07)'; ctx.lineWidth = 2; for (let x = r.x; x < r.x + r.w; x += 40) { ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + H); ctx.stroke(); }
    const by = r.y + H * 0.9; ctx.fillStyle = lg(ctx, 0, by, 0, by + 9, [[0, '#caa062'], [1, '#4a2e14']]); ctx.fillRect(r.x, by, r.w, 9);
    const box = (x, h, c, lid) => { const w = h * 1.15; cast(ctx, x + 2, by, w * 0.55, 3, 0.35);
      ctx.fillStyle = lg(ctx, x - w / 2, 0, x + w / 2, 0, [[0, tint(c, -0.35)], [0.35, tint(c, 0.18)], [1, tint(c, -0.5)]]); rrect(ctx, x - w / 2, by - h, w, h, 4); ctx.fill();
      ctx.fillStyle = lg(ctx, x - w / 2, 0, x + w / 2, 0, [[0, tint(lid, -0.3)], [0.4, tint(lid, 0.25)], [1, tint(lid, -0.45)]]); rrect(ctx, x - w / 2 - 2, by - h * 1.22, w + 4, h * 0.3, 4); ctx.fill();
      ctx.strokeStyle = '#e2b34a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - w / 2, by - h * 0.55); ctx.lineTo(x + w / 2, by - h * 0.55); ctx.stroke(); ctx.fillStyle = '#e2b34a'; ell(ctx, x, by - h * 0.78, w * 0.14, w * 0.14); ctx.fill(); ctx.fillStyle = c; ell(ctx, x, by - h * 0.78, w * 0.06, w * 0.06); ctx.fill(); };
    const spec = [[0.5, '#7a1c18', '#16100c'], [0.7, '#1c3f78', '#7a1c18'], [0.42, '#2d6a44', '#16100c'], [0.6, '#16100c', '#c8321f']];
    // boxes in the margins, a taller stack nearer the panel; the corners above a round plate stay free
    sideRects(r, s).forEach((sr, i) => { const n = sr.w > 70 ? 2 : 1; for (let k = 0; k < n; k++) { const [f, c, l] = spec[(i * 2 + k) % spec.length], x = sr.x + (sr.w * (k + 0.5)) / n; box(x, H * f * 0.78, c, l); } });
  },
  paintshelf: sideWall('shelf', 'shelf'),
  painttools: sideWall('tools', 'hang'),
  nordic(ctx, s, r, H) { // blue-grey panelled wall with a rosemaled frieze and a plate on a rail
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.1)], [1, tint(s.wallC, -0.2)]]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; for (let x = r.x; x < r.x + r.w; x += 44) { ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + H); ctx.stroke(); }
    ctx.lineCap = 'round';
    for (let x = r.x + 18; x < r.x + r.w - 10; x += 52) { ctx.strokeStyle = '#f1e6c9'; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.arc(x, r.y + H * 0.38, 9, 0.6, 5.2); ctx.stroke(); ctx.strokeStyle = '#d9a431'; ctx.beginPath(); ctx.arc(x + 24, r.y + H * 0.4, 6, 3.6, 8.4); ctx.stroke(); ctx.fillStyle = '#b8322a'; ell(ctx, x + 12, r.y + H * 0.34, 2.6, 2.6); ctx.fill(); }
    ctx.fillStyle = lg(ctx, 0, r.y + H * 0.78, 0, r.y + H * 0.88, [[0, '#d6b27a'], [1, '#6a4824']]); ctx.fillRect(r.x, r.y + H * 0.78, r.w, 8);
    const sr = sideRects(r, s)[1], px = sr ? sr.x + sr.w / 2 : r.x + r.w * 0.92, py = r.y + H * 0.58; cast(ctx, px + 3, py + H * 0.18, H * 0.2, 3, 0.3);
    ctx.fillStyle = rg(ctx, px - 4, py - 4, 2, H * 0.24, [[0, '#fff'], [1, '#d8d2c0']]); ell(ctx, px, py, H * 0.22, H * 0.22); ctx.fill(); ctx.strokeStyle = '#2f5d62'; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = '#b8322a'; ctx.lineWidth = 2; ell(ctx, px, py, H * 0.13, H * 0.13); ctx.stroke();
  },
  mudhut(ctx, s, r, H) { // red-ochre mud wall under a thatch eave with bamboo poles
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.1)], [1, tint(s.wallC, -0.12)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let k = 0; k < 40; k++) { const x = r.x + hash(k, 3) * r.w, y = r.y + H * (0.25 + hash(k, 4) * 0.7); ctx.fillStyle = rgba(hash(k, 5) > 0.5 ? '#3a160a' : '#e0a070', 0.1); ell(ctx, x, y, 8 + hash(k, 6) * 16, 3 + hash(k, 7) * 4); ctx.fill(); }
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H * 0.3, [[0, '#6a5420'], [1, '#a8863a']]); ctx.fillRect(r.x, r.y, r.w, H * 0.3);
    ctx.strokeStyle = 'rgba(40,28,6,0.55)'; ctx.lineWidth = 1.4; ctx.beginPath(); for (let x = r.x; x < r.x + r.w; x += 7) { ctx.moveTo(x, r.y); ctx.lineTo(x - 4 + hash(x | 0, 2) * 8, r.y + H * (0.28 + hash(x | 0, 3) * 0.08)); } ctx.stroke();
    for (const f of [0.12, 0.5, 0.88]) { const x = r.x + r.w * f; ctx.fillStyle = lg(ctx, x - 5, 0, x + 5, 0, [[0, '#c9b060'], [0.4, '#e6d492'], [1, '#6a5a20']]); ctx.fillRect(x - 5, r.y + H * 0.28, 10, H * 0.72); }
    ctx.strokeStyle = '#f7f1e3'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(r.x + r.w * 0.28, r.y + H * 0.62, 11, 0, TAU); ctx.moveTo(r.x + r.w * 0.66, r.y + H * 0.78); ctx.lineTo(r.x + r.w * 0.7, r.y + H * 0.56); ctx.lineTo(r.x + r.w * 0.74, r.y + H * 0.78); ctx.stroke();
  },
  market(ctx, s, r, H) { // roadside: corrugated sheet and painted boards on nails
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.12)], [1, tint(s.wallC, -0.2)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let x = r.x; x < r.x + r.w; x += 14) { ctx.fillStyle = lg(ctx, x, 0, x + 14, 0, [[0, 'rgba(255,255,255,0.18)'], [0.5, 'rgba(0,0,0,0.0)'], [1, 'rgba(0,0,0,0.22)']]); ctx.fillRect(x, r.y, 14, H); }
    const cols = [['#f6c928', '#1f4fa8', '#d63a2a'], ['#2f9a4a', '#f08a1e', '#171717'], ['#d63a2a', '#f6c928', '#1f4fa8']];
    cols.forEach((c, i) => { const bw = Math.min(r.w * 0.2, H * 0.9), bx = r.x + r.w * (0.12 + i * 0.3), by = r.y + H * 0.12, bh = H * 0.7; ctx.save(); ctx.translate(bx + bw / 2, by); ctx.rotate((i - 1) * 0.04); cast(ctx, 3, bh + 3, bw * 0.5, 4, 0.3); ctx.fillStyle = c[0]; ctx.fillRect(-bw / 2, 0, bw, bh); ctx.fillStyle = c[1]; ell(ctx, 0, bh * 0.5, bw * 0.3, bh * 0.2); ctx.fill(); ctx.fillStyle = c[2]; ctx.beginPath(); ctx.moveTo(bw * 0.2, bh * 0.45); ctx.lineTo(bw * 0.42, bh * 0.52); ctx.lineTo(bw * 0.2, bh * 0.56); ctx.fill(); ctx.strokeStyle = '#171717'; ctx.lineWidth = 2; ctx.strokeRect(-bw / 2, 0, bw, bh); ctx.restore(); });
  },
  clothline(ctx, s, r, H, t) { // dyed cloths drying on a line
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#e9e1cf'], [1, '#c9bda0']]); ctx.fillRect(r.x, r.y, r.w, H);
    const y = r.y + H * 0.14; ctx.strokeStyle = '#6a5438'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(r.x, y); ctx.quadraticCurveTo(r.x + r.w / 2, y + 12, r.x + r.w, y); ctx.stroke();
    const cols = ['#a8322a', '#27468f', '#d9a21e', '#3f7a46', '#f1e6c9']; const n = Math.max(3, Math.round(r.w / 100));
    for (let k = 0; k < n; k++) { const x = r.x + (r.w * (k + 0.5)) / n, w = (r.w / n) * 0.74, h = H * (0.55 + 0.3 * hash(k, 3)), sw = Math.sin(t * 1.1 + k) * 2.5, c = cols[k % cols.length];
      ctx.fillStyle = lg(ctx, x - w / 2, 0, x + w / 2, 0, [[0, tint(c, -0.15)], [0.5, c], [1, tint(c, -0.3)]]); ctx.beginPath(); ctx.moveTo(x - w / 2, y + 4); ctx.lineTo(x + w / 2, y + 4); ctx.lineTo(x + w / 2 + sw, y + h); ctx.lineTo(x - w / 2 + sw, y + h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = rgba('#f1e6c9', 0.55); for (let q = 0; q < 6; q++) { ell(ctx, x + sw * 0.5 + (hash(k, q) - 0.5) * w * 0.6, y + h * (0.2 + q * 0.12), 2.6, 2.6); ctx.fill(); }
      ctx.fillStyle = '#d6b27a'; ctx.fillRect(x - w * 0.3, y - 2, 5, 12); ctx.fillRect(x + w * 0.3 - 5, y - 2, 5, 12); }
  },
  forest(ctx, s, r, H) { // dusk forest
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#1b3a3a'], [1, tint(s.wallC, -0.2)]]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.fillStyle = 'rgba(255,240,200,0.8)'; ell(ctx, r.x + r.w * 0.82, r.y + H * 0.3, 11, 11); ctx.fill();
    for (let k = 0; k < 9; k++) { const x = r.x + r.w * (k + 0.5) / 9, h = H * (0.5 + hash(k, 5) * 0.45); ctx.fillStyle = rgba('#0a1c1c', 0.85); ctx.beginPath(); ctx.moveTo(x - 4, r.y + H); ctx.lineTo(x - 2, r.y + H - h); ctx.lineTo(x + 2, r.y + H - h); ctx.lineTo(x + 4, r.y + H); ctx.fill(); ell(ctx, x, r.y + H - h, 22 + hash(k, 6) * 14, 16 + hash(k, 7) * 10); ctx.fill(); }
    for (let k = 0; k < 14; k++) { const x = r.x + r.w * hash(k, 8), y = r.y + H * (0.3 + hash(k, 9) * 0.6); ctx.fillStyle = rg(ctx, x, y, 0, 5, [[0, 'rgba(255,240,120,0.95)'], [1, 'rgba(255,240,120,0)']]); ell(ctx, x, y, 5, 5); ctx.fill(); }
  },
  hearth(ctx, s, r, H) { // dark panelled wall, a shelf of dyed eggs and a candle glow
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#1c120c'], [1, s.wallC]]); ctx.fillRect(r.x, r.y, r.w, H);
    ctx.strokeStyle = 'rgba(255,220,160,0.08)'; ctx.lineWidth = 2; for (let x = r.x; x < r.x + r.w; x += 38) { ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + H); ctx.stroke(); }
    const by = r.y + H * 0.84; ctx.fillStyle = lg(ctx, 0, by, 0, by + 9, [[0, '#d09a5a'], [1, '#5a3818']]); ctx.fillRect(r.x, by, r.w, 9);
    const cols = ['#f1c232', '#d3401a', '#2b1710', '#f5efe2', '#d3401a', '#f1c232', '#2b1710']; const n = Math.max(5, Math.round(r.w / 62));
    for (let k = 0; k < n; k++) { const x = r.x + r.w * ((k + 0.5) / n) * 0.7 + r.w * 0.02, c = cols[k % cols.length], eh = H * 0.34; cast(ctx, x + 2, by, eh * 0.28, 3, 0.3); ctx.fillStyle = rg(ctx, x - eh * 0.1, by - eh * 0.65, 2, eh * 0.6, [[0, tint(c, 0.4)], [1, tint(c, -0.35)]]); ctx.beginPath(); ctx.ellipse(x, by - eh * 0.5, eh * 0.28, eh * 0.5, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = rgba('#f5efe2', 0.7); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - eh * 0.27, by - eh * 0.5); ctx.quadraticCurveTo(x, by - eh * 0.44, x + eh * 0.27, by - eh * 0.5); ctx.stroke(); }
    const gx = r.x + r.w * 0.86, gy = by - H * 0.2; ctx.fillStyle = rg(ctx, gx, gy, 2, H * 0.7, [[0, 'rgba(255,210,120,0.55)'], [1, 'rgba(255,160,60,0)']]); ctx.fillRect(r.x, r.y, r.w, H);
  },
};

const T = (c, h) => ({ caption: c, hint: h });
const scenes = {
  petrykivka: { wall: 'paintshelf', wallC: '#c9a273', floor: 'planks', floorC: '#6a4a30', light: 'window', shelf: [{ k: 'plate', c: '#c8301f' }, { k: 'jar', c: '#e8602a' }, { k: 'plate', c: '#2a5db8' }], litter: [{ k: 'splash', c: '#e8602a' }], dock: ['brush:#e8602a', 'pot:#f4b82a', 'pot:#e8602a', 'pot:#2f8a45', 'pot:#d3163e', 'sponge'], dockKind: 'ledge', frame: 'rail', words: T('Paint this panel', 'Press the loaded brush and flick in toward the centre'), pitch: 1.1, wave: 'triangle' },
  rosemaling: { wall: 'nordic', wallC: '#4a6a78', floor: 'planks', floorC: '#8a6a44', light: 'window', litter: [{ k: 'dust', c: '#e0c08a' }], dock: ['brush:#d9a431', 'pot:#b8322a', 'pot:#d9a431', 'pot:#4f9a5a', 'pot:#f1e6c9', 'bowl'], dockKind: 'ledge', frame: 'niche', words: T('Paint this bowl', 'Start each scroll at its thick end'), pitch: 1.0, wave: 'sine' },
  dala: { wall: 'painttools', wallC: '#8a6038', floor: 'planks', floorC: '#a07848', light: 'window', hang: ['gouge', 'mallet', 'brush'], litter: [{ k: 'dust', c: '#e8cd96' }], dock: ['brush:#c9302c', 'pot:#c9302c', 'pot:#2b5aa8', 'pot:#f6f0e2', 'pot:#3a8f4d', 'sponge'], dockKind: 'ledge', frame: 'plinth', words: T('Paint this horse', 'Flood the horse red, then the blue band'), pitch: 0.9, wave: 'triangle' },
  kashmiri: { wall: 'paintboxes', wallC: '#2a1a10', floor: 'lacquer', floorC: '#3a1a10', light: 'lamp', litter: [], dock: ['brush:#e2b34a', 'pot:#e2b34a', 'pot:#c8321f', 'pot:#2f7d4e', 'pot:#2a4f9c', 'pot:#efe3c6'], dockKind: 'tray', frame: 'tile', words: T('Paint this plate', 'Keep the gold line steady'), pitch: 1.3, wave: 'sine' },
  tingatinga: { wall: 'paintmarket', wallC: '#5a8aa8', floor: 'earth', floorC: '#a8703a', light: 'window', litter: [{ k: 'splash', c: '#f6c928' }], dock: ['brush:#d63a2a', 'pot:#f6c928', 'pot:#1f4fa8', 'pot:#d63a2a', 'pot:#2f9a4a', 'pot:#171717'], dockKind: 'ledge', frame: 'peg', words: T('Paint this board', 'Tap a shape to flood it with enamel'), pitch: 1.0, wave: 'triangle' },
  lukchup: { wall: 'stall', wallC: '#1d3a3a', floor: 'weave', floorC: '#b79a58', light: 'lamp', litter: [{ k: 'sugar', c: '#f0e0b0' }], dock: ['brush:#d62d20', 'pot:#f0b429', 'pot:#d62d20', 'pot:#5b2a86', 'pot:#2f8a3a', 'bowl'], dockKind: 'tray', frame: 'card', words: T('Paint these fruits', 'Fill each pale fruit with its colour'), pitch: 1.4, wave: 'sine' },
  madhubani: { wall: 'mud', wallC: '#e6d3a8', floor: 'weave', floorC: '#c9a96a', light: 'window', litter: [{ k: 'scraps', c: '#b83a2a' }], dock: ['kalam', 'pot:#1b1410', 'pot:#b83a2a', 'pot:#e6a824', 'pot:#3d8a4a', 'pot:#2b4a8f'], dockKind: 'ledge', frame: 'card', words: T('Paint this picture', 'Ink outlines first, then the natural colours'), pitch: 1.1, wave: 'triangle' },
  kalamkari: { wall: 'paintcloth', wallC: '#e9e1cf', floor: 'earth', floorC: '#b08a58', light: 'window', litter: [{ k: 'splash', c: '#27468f' }], dock: ['kalam', 'pot:#241a14', 'pot:#a8322a', 'pot:#27468f', 'pot:#d9a21e', 'pot:#3f7a46'], dockKind: 'cloth', frame: 'rail', words: T('Paint this cloth', 'Reed-pen outlines, then the dyes'), pitch: 1.0, wave: 'triangle' },
  gond: { wall: 'forest', wallC: '#2a3a30', floor: 'planks', floorC: '#4a3626', light: 'lamp', litter: [{ k: 'splash', c: '#e0a030' }], dock: ['brush:#e0a030', 'pot:#e0a030', 'pot:#f4eedd', 'pot:#2fa39a', 'pot:#f5d142', 'pot:#c8402a'], dockKind: 'ledge', frame: 'plinth', words: T('Paint this deer', 'Fill the shapes, then draw the dotted rows'), pitch: 1.0, wave: 'triangle' },
  warli: { wall: 'mudhut', wallC: '#a24a2a', floor: 'mud', floorC: '#8a4a2a', light: 'window', litter: [{ k: 'dust', c: '#d9bf9d' }], dock: ['ricestick', 'bowl', 'ricestick', 'sponge'], dockKind: 'ledge', frame: 'rail', words: T('Paint this wall', 'Rice paste only: lines, triangles and circles'), pitch: 0.8, wave: 'triangle' },
  batik: { wall: 'rope', wallC: '#d8dde6', floor: 'cloth', floorC: '#9a8466', light: 'window', litter: [{ k: 'wax', c: '#f1dfa0' }], dock: ['tjanting', 'waxpot', 'vat:#2f63b0', 'vat:#12285a', 'sponge'], dockKind: 'cloth', frame: 'cloth', words: T('Wax this cloth', 'Wax keeps the cloth pale; then dip it in the dye'), pitch: 0.9, wave: 'sine' },
  pysanka: { wall: 'hearth', wallC: '#4a3020', floor: 'planks', floorC: '#5a3a24', light: 'lamp', litter: [{ k: 'wax', c: '#f1dfa0' }], dock: ['kistka', 'waxpot', 'candle', 'vat:#f1c232', 'vat:#d3401a'], dockKind: 'tray', frame: 'niche', words: T('Wax this egg', 'Draw with the hot wax, then dip the egg in the dye'), pitch: 1.5, wave: 'sine' },
};

// 1.8.0: ONE palette display. The pots that used to stand in the dock repeated the colour buttons and the load bar, so the dock is now
// [the tool, the gauge slot (the colour in hand and what is left on it, drawn by the technique), one supply].
scenes.dala.ar = 1.15; scenes.kashmiri.ar = 1.12;
const SUPPLY = { petrykivka: 'sponge', rosemaling: 'bowl', dala: 'sponge', kashmiri: 'bowl', tingatinga: 'sponge', lukchup: 'bowl', madhubani: 'bowl', kalamkari: 'bowl', gond: 'sponge', warli: 'bowl', batik: 'vat:#2f63b0', pysanka: 'candle' };
for (const [id, sc] of Object.entries(scenes)) sc.dock = [sc.dock[0], 'gauge', SUPPLY[id]];
props.gauge = () => {};

registerSceneSet({
  scenes: Object.fromEntries(Object.entries(scenes).map(([id, s]) => [id, { ...s, hang: s.hang ?? [] }])),
  // word routes only for words that cannot belong to another craft; specs should still name `scene` (the figure id) explicitly
  rules: [['petrykivka', /petrykivka|petrikivka/], ['rosemaling', /rosemaling|rosemalling/], ['tingatinga', /tinga.?tinga/], ['lukchup', /luk chup|lukchup/], ['madhubani', /madhubani|mithila/], ['kalamkari', /kalamkari/], ['warli', /warli/], ['pysanka', /pysanka|pisanki|kraslice/]],
  walls, props,
  soundMat: Object.fromEntries(Object.keys(scenes).map((id) => [id, 'clay'])),
});
void mix;

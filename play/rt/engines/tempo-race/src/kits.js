// Course kits for the tempo-race engine: each recognised race gets its own venue dressing, screen orientation, control
// pads, colours and sounds, chosen from the game title (or params.scene), so games on this engine do not share one
// surface. Pure canvas, deterministic (hash of an index), no assets.
import { hash, shade } from './draw.js';

const TAU = Math.PI * 2;
export const KIT_IDS = ['bakiak', 'camel', 'skate', 'cheese', 'kambala', 'nouka'];
export function kitOf(P, title) {
  if (P.scene && KIT_IDS.includes(P.scene)) return P.scene;
  const t = `${title ?? ''}`.toLowerCase();
  if (/bakiak|clog/.test(t)) return 'bakiak';
  if (/camel/.test(t)) return 'camel';
  if (/skat|canal/.test(t)) return 'skate';
  if (/cheese/.test(t)) return 'cheese';
  if (/kambala|buffalo/.test(t)) return 'kambala';
  if (/nouka|boat race|baich/.test(t)) return 'nouka';
  return null;
}

const quad = (ctx, a, b, c, d) => { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); };
const PEOPLE = ['#e8453a', '#f2c14e', '#2d7bd6', '#f4f0e4', '#3fa856', '#c25b9a', '#e8873a'];
const SKINS = ['#e9bf94', '#c99366', '#8a5a3a', '#f0cfa8'];

// continuous strip along the course on both sides at offsets [o0, o1] from the track edge, in segments of len metres
function strip(c, o0, o1, len, fn) {
  const { proj, sBack, sFwd, trackW } = c;
  const s0 = Math.floor(sBack / len) * len;
  for (const side of [-1, 1]) for (let s = s0; s < sFwd + len; s += len) {
    const a = proj(s, side * (trackW / 2 + o0)), b = proj(s + len, side * (trackW / 2 + o0)), d = proj(s, side * (trackW / 2 + o1)), e = proj(s + len, side * (trackW / 2 + o1));
    fn(a, b, e, d, side, Math.round(s / len));
  }
}
function crowdDots(ctx, p, q, n, size, seed, t, jump = 0) {
  for (let i = 0; i < n; i++) {
    const f = (i + 0.5) / n, x = p[0] + (q[0] - p[0]) * f, y = p[1] + (q[1] - p[1]) * f;
    const k = seed * 13 + i, bob = Math.abs(Math.sin(t * 5 + k)) * size * 0.5 * jump;
    ctx.fillStyle = PEOPLE[Math.floor(hash(k) * PEOPLE.length)]; ctx.beginPath(); ctx.arc(x, y - bob, size, 0, TAU); ctx.fill();
    ctx.fillStyle = SKINS[Math.floor(hash(k + 5) * SKINS.length)]; ctx.beginPath(); ctx.arc(x, y - bob, size * 0.5, 0, TAU); ctx.fill();
  }
}

const DECOR = {
  // sports-day course: raked timber bleachers with a crowd and a painted rope along the plank track
  bakiak(c) {
    const { ctx, laneW, t, proj, sBack, sFwd, trackW } = c;
    // timber boards laid across the track every two metres
    ctx.strokeStyle = 'rgba(40,20,6,0.35)'; ctx.lineWidth = 2;
    for (let s = Math.floor(sBack / 2) * 2; s < sFwd; s += 2) { const a = proj(s, -trackW / 2), b = proj(s, trackW / 2); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    strip(c, laneW * 0.18, laneW * 1.7, 5, (a, b, e, d, side, k) => {
      ctx.fillStyle = '#7a5230'; quad(ctx, a, b, e, d); ctx.fill();
      ctx.strokeStyle = 'rgba(30,16,6,0.55)'; ctx.lineWidth = 2;
      for (let j = 1; j < 3; j++) { const u = j / 3; ctx.beginPath(); ctx.moveTo(a[0] + (d[0] - a[0]) * u, a[1] + (d[1] - a[1]) * u); ctx.lineTo(b[0] + (e[0] - b[0]) * u, b[1] + (e[1] - b[1]) * u); ctx.stroke(); }
      for (let j = 0; j < 3; j++) { const u = (j + 0.5) / 3; crowdDots(ctx, [a[0] + (d[0] - a[0]) * u, a[1] + (d[1] - a[1]) * u], [b[0] + (e[0] - b[0]) * u, b[1] + (e[1] - b[1]) * u], 4, laneW * 0.11, k * 3 + j + side, t, 0.7); }
    });
    // bunting rope along the track edge
    strip(c, laneW * 0.03, laneW * 0.12, 2.5, (a, b, e, d, side, k) => { ctx.fillStyle = k % 2 ? '#e8453a' : '#f4f0e4'; quad(ctx, a, b, e, d); ctx.fill(); });
  },
  // desert racecourse: white rail with posts, packed-sand verge, striped pavilions with robed spectators and dune shadows
  camel(c) {
    const { ctx, laneW, t } = c;
    // darker packed-sand verge and the long shadow the rail casts
    strip(c, 0, laneW * 0.9, 20, (a, b, e, d) => { ctx.fillStyle = 'rgba(120,80,30,0.22)'; quad(ctx, a, b, e, d); ctx.fill(); });
    strip(c, laneW * 0.1, laneW * 0.25, 20, (a, b, e, d) => { ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = Math.max(3, laneW * 0.1); ctx.beginPath(); ctx.moveTo((a[0] + d[0]) / 2 + 3, (a[1] + d[1]) / 2 + 5); ctx.lineTo((b[0] + e[0]) / 2 + 3, (b[1] + e[1]) / 2 + 5); ctx.stroke(); ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = Math.max(3, laneW * 0.08); ctx.beginPath(); ctx.moveTo((a[0] + d[0]) / 2, (a[1] + d[1]) / 2); ctx.lineTo((b[0] + e[0]) / 2, (b[1] + e[1]) / 2); ctx.stroke(); });
    strip(c, laneW * 0.1, laneW * 0.25, 4, (a, b, e, d) => { ctx.fillStyle = '#b8382a'; ctx.beginPath(); ctx.arc((a[0] + d[0]) / 2, (a[1] + d[1]) / 2, laneW * 0.07, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc((a[0] + d[0]) / 2 - 1, (a[1] + d[1]) / 2 - 1, laneW * 0.025, 0, TAU); ctx.fill(); });
    // pavilions every 36 m: a striped canopy seen from above with a hard shadow and a row of spectators
    strip(c, laneW * 0.55, laneW * 1.9, 36, (a, b, e, d, side, k) => {
      const x0 = (a[0] + d[0]) / 2 + (b[0] - a[0]) * 0.15, y0 = (a[1] + d[1]) / 2 + (b[1] - a[1]) * 0.15, x1 = (b[0] + e[0]) / 2 - (b[0] - a[0]) * 0.15, y1 = (b[1] + e[1]) / 2 - (b[1] - a[1]) * 0.15;
      const nx = (d[0] - a[0]) * 0.32, ny = (d[1] - a[1]) * 0.32;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; quad(ctx, [x0 + 6, y0 + 8], [x1 + 6, y1 + 8], [x1 + nx + 6, y1 + ny + 8], [x0 + nx + 6, y0 + ny + 8]); ctx.fill();
      const N = 7;
      for (let i = 0; i < N; i++) {
        const u0 = i / N, u1 = (i + 1) / N;
        ctx.fillStyle = i % 2 ? '#f6ecd0' : (k % 2 ? '#c8452d' : '#2d7a8a');
        quad(ctx, [x0 + (x1 - x0) * u0, y0 + (y1 - y0) * u0], [x0 + (x1 - x0) * u1, y0 + (y1 - y0) * u1], [x0 + (x1 - x0) * u1 + nx, y0 + (y1 - y0) * u1 + ny], [x0 + (x1 - x0) * u0 + nx, y0 + (y1 - y0) * u0 + ny]); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      const px = (x0 + x1) / 2 - nx * 0.25, py = (y0 + y1) / 2 - ny * 0.25;
      crowdDots(ctx, [x0 - nx * 0.25, y0 - ny * 0.25], [x1 - nx * 0.25, y1 - ny * 0.25], 6, laneW * 0.1, k * 5 + side, t, 1);
      void px; void py;
    });
  },
  // frozen canal: snow banks, a windmill-lit towpath, tall reeds and stalls with striped awnings
  skate(c) {
    const { ctx, laneW, t } = c;
    void t; void laneW; void ctx;
  },
  // hillside: deep-green slope, orange safety netting on stakes, banked crowds in the upper rows
  cheese(c) {
    const { ctx, laneW, t } = c;
    strip(c, laneW * 0.12, laneW * 0.22, 3, (a, b, e, d, side, k) => { ctx.strokeStyle = '#ff8a1e'; ctx.lineWidth = Math.max(4, laneW * 0.1); ctx.beginPath(); ctx.moveTo((a[0] + d[0]) / 2, (a[1] + d[1]) / 2); ctx.lineTo((b[0] + e[0]) / 2, (b[1] + e[1]) / 2); ctx.stroke(); if (k % 3 === 0) { ctx.fillStyle = '#5a3a1c'; ctx.beginPath(); ctx.arc((a[0] + d[0]) / 2, (a[1] + d[1]) / 2, laneW * 0.07, 0, TAU); ctx.fill(); } });
    strip(c, laneW * 0.3, laneW * 1.3, 6, (a, b, e, d, side, k) => { ctx.fillStyle = 'rgba(20,50,10,0.25)'; quad(ctx, a, b, e, d); ctx.fill(); crowdDots(ctx, [(a[0] + d[0]) / 2, (a[1] + d[1]) / 2], [(b[0] + e[0]) / 2, (b[1] + e[1]) / 2], 5, laneW * 0.1, k + side * 7, t, 1); });
  },
  // flooded paddy lanes: glassy water bunds with reflections, standing watchers under umbrellas
  kambala(c) {
    const { ctx, laneW, t } = c;
    strip(c, 0, laneW * 2.6, 8, (a, b, e, d, side, k) => {
      ctx.fillStyle = k % 2 ? 'rgba(120,190,150,0.55)' : 'rgba(150,210,170,0.5)'; quad(ctx, a, b, e, d); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo((a[0] + d[0]) / 2 + Math.sin(t + k) * 2, (a[1] + d[1]) / 2); ctx.lineTo((b[0] + e[0]) / 2, (b[1] + e[1]) / 2); ctx.stroke();
      ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = Math.max(3, laneW * 0.12); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      if (k % 2 === 0) {
        const x = (a[0] + b[0]) / 2 + (d[0] - a[0]) * 0.18, y = (a[1] + b[1]) / 2 + (d[1] - a[1]) * 0.18, r = laneW * 0.34;
        const c1 = ['#e8453a', '#f2c14e', '#2d7bd6'][Math.abs(k + side) % 3];
        crowdDots(ctx, [x - r * 1.4, y + r * 0.9], [x + r * 1.1, y + r * 1.2], 3, laneW * 0.09, k + 3, t, 0.5);
        ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(x + r * 0.35, y + r * 0.55, r, r * 0.75, 0, 0, TAU); ctx.fill();
        for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? c1 : '#fff7e0'; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, (i / 8) * TAU, ((i + 1) / 8) * TAU); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.55, 0, TAU); ctx.fill();
        ctx.fillStyle = '#3a2a18'; ctx.beginPath(); ctx.arc(x, y, r * 0.1, 0, TAU); ctx.fill();
      }
    });
  },
  // river: wide reed banks, moored fishing boats and village huts on stilts
  nouka(c) {
    const { ctx, laneW, t } = c;
    strip(c, 0, laneW * 0.35, 6, (a, b, e, d, side, k) => { ctx.fillStyle = k % 2 ? '#7aa84a' : '#5f9a3c'; quad(ctx, a, b, e, d); ctx.fill(); });
    strip(c, laneW * 0.35, laneW * 2.2, 10, (a, b, e, d, side, k) => {
      ctx.fillStyle = '#4a7a34'; quad(ctx, a, b, e, d); ctx.fill();
      const x = (a[0] + e[0]) / 2, y = (a[1] + e[1]) / 2;
      if (k % 3 === 0) { ctx.fillStyle = '#8a5a2a'; ctx.fillRect(x - laneW * 0.35, y - laneW * 0.1, laneW * 0.7, laneW * 0.35); ctx.fillStyle = '#d6b860'; ctx.beginPath(); ctx.moveTo(x - laneW * 0.5, y - laneW * 0.1); ctx.lineTo(x + laneW * 0.5, y - laneW * 0.1); ctx.lineTo(x, y - laneW * 0.55); ctx.closePath(); ctx.fill(); }
      else if (k % 3 === 1) { ctx.fillStyle = '#9a6a3a'; ctx.beginPath(); ctx.ellipse(x, y, laneW * 0.45, laneW * 0.14, 0.3, 0, TAU); ctx.fill(); ctx.strokeStyle = '#e8d8a8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - laneW * 0.4, y); ctx.lineTo(x + laneW * 0.4, y); ctx.stroke(); }
    });
    void t;
  },
};

// pad skin: [left, right, single] base colours and the surface pattern
const PAD = {
  bakiak: { colors: ['#8a5a2a', '#6a4220', '#7a4a22'], weave: 'planks', radius: 8 },
  camel: { colors: ['#b8843a', '#b8843a', '#a8742c'], weave: 'rope', radius: 30 },
  skate: { colors: ['#3a6a98', '#3a6a98', '#4a86b8'], weave: 'ice', radius: 30 },
  cheese: { colors: ['#3f7a2a', '#7a3a2a', '#3f7a2a'], weave: 'dots', radius: 10 },
  kambala: { colors: ['#6b4a2c', '#6b4a2c', '#5a3a1c'], weave: 'mud', radius: 22 },
  nouka: { colors: ['#2a6a6a', '#6a3a2a', '#2a6a6a'], weave: 'ripple', radius: 40 },
};

const KITS = {
  bakiak: { orient: 'up', regF: 0.3, colors: { ground: '#8f5f30', ground2: '#a87440', bank: '#4f9a3a', edge: '#fff8e0' }, scenery: 'banners', tone: { stroke: (g) => ({ freq: g === 'perfect' ? 300 : 220, to: 160, dur: 0.07, type: 'square', vol: 0.18 }) } },
  camel: { orient: 'right', regF: 0.24, colors: { ground: '#dcb272', ground2: '#ecc88c', bank: '#caa066' }, scenery: 'dunes', tone: { stroke: (g) => ({ freq: g === 'perfect' ? 180 : 140, to: 90, dur: 0.12, type: 'triangle', vol: 0.3 }) } },
  skate: { orient: 'up', regF: 0.2, colors: { bank: '#dbe7f2' }, scenery: 'windmill', tone: { stroke: (g) => ({ freq: g === 'perfect' ? 1800 : 1300, to: 900, dur: 0.1, type: 'sawtooth', vol: 0.06 }) } },
  cheese: { orient: 'up', regF: 0.27, colors: { bank: '#2f5a1f' }, scenery: 'trees', tone: { stroke: (g) => ({ freq: g === 'perfect' ? 520 : 380, dur: 0.05, type: 'square', vol: 0.12 }) } },
  kambala: { orient: 'up', regF: 0.3, colors: { bank: '#4d8a52' }, scenery: 'palms', tone: { stroke: (g) => ({ freq: g === 'perfect' ? 130 : 100, to: 60, dur: 0.15, type: 'sine', vol: 0.45 }) } },
  nouka: { orient: 'right', regF: 0.32, colors: {}, scenery: 'huts', tone: { stroke: (g) => ({ freq: g === 'perfect' ? 200 : 160, to: 110, dur: 0.1, type: 'triangle', vol: 0.4 }) } },
};

// something drawn under each racer (the clog plank): x, y, heading, size
const UNDER = {
  bakiak(ctx, x, y, ang, rs) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    const L = rs * 1.7, H = rs * 0.3;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-L + 5, -H + 6, L * 2, H * 2);
    const pg = ctx.createLinearGradient(0, -H, 0, H); pg.addColorStop(0, '#e1ad6c'); pg.addColorStop(0.5, '#c08a4c'); pg.addColorStop(1, '#8a5a2a');
    ctx.fillStyle = pg; ctx.fillRect(-L, -H, L * 2, H * 2);
    ctx.strokeStyle = 'rgba(70,36,10,0.35)'; ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-L, -H + (H * 2 * i) / 5); ctx.lineTo(L, -H + (H * 2 * i) / 5 + (i % 2 ? 1.5 : -1.5)); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,240,200,0.35)'; ctx.fillRect(-L, -H, L * 2, 2);
    ctx.strokeStyle = 'rgba(50,25,6,0.7)'; ctx.lineWidth = 1.5; ctx.strokeRect(-L, -H, L * 2, H * 2);
    ctx.fillStyle = '#5a3414'; for (const f of [-1, 1]) { ctx.fillRect(f * L * 0.62 - rs * 0.1, -H - 1, rs * 0.2, H * 2 + 2); }
    ctx.strokeStyle = '#e8d8a8'; ctx.lineWidth = Math.max(2, rs * 0.06); for (const f of [-0.3, 0.3]) { ctx.beginPath(); ctx.moveTo(f * L, -H * 0.4); ctx.lineTo(f * L * 0.2, -H * 0.1); ctx.moveTo(f * L, H * 0.4); ctx.lineTo(f * L * 0.2, H * 0.1); ctx.stroke(); }
    ctx.restore();
  },
};
export function createKit(id) {
  if (!id || !KITS[id]) return null;
  const k = KITS[id];
  return { id, ...k, pad: PAD[id], decor: DECOR[id], under: UNDER[id] };
}

// pad surface pattern, clipped to the pad
export function padSurface(ctx, kind, x, y, w, h, t) {
  ctx.strokeStyle = 'rgba(255,255,255,0.09)'; ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1.5;
  switch (kind) {
    case 'planks': for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x, y + (h * i) / 6); ctx.lineTo(x + w, y + (h * i) / 6); ctx.stroke(); } ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x + w * (0.15 + 0.7 * hash(i * 3)), y + h * (0.1 + 0.8 * hash(i * 5 + 1)), 3, 0, TAU); ctx.fill(); } break;
    case 'rope': for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.ellipse(x + w / 2, y + h * 0.45, w * (0.1 + i * 0.05), h * (0.08 + i * 0.04), 0, 0, TAU); ctx.stroke(); } break;
    case 'ice': for (let i = 0; i < 6; i++) { const yy = y + h * (0.2 + i * 0.13); ctx.beginPath(); ctx.moveTo(x + w * 0.1, yy + h * 0.1); ctx.quadraticCurveTo(x + w * 0.5, yy - h * 0.1, x + w * 0.9, yy + h * 0.05); ctx.stroke(); } break;
    case 'dots': for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc(x + ((i % 10) + 0.5) * w / 10, y + (Math.floor(i / 10) + 0.5) * h / 4, 2.4, 0, TAU); ctx.fill(); } break;
    case 'mud': for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(x + w * hash(i * 7), y + h * hash(i * 11 + 2), 14 + hash(i) * 22, 5 + hash(i + 3) * 6, 0, 0, TAU); ctx.fill(); } break;
    case 'ripple': for (let i = 0; i < 5; i++) { const r = ((i + (t * 0.6) % 1) / 5); ctx.beginPath(); ctx.ellipse(x + w / 2, y + h * 0.45, w * 0.1 + w * 0.4 * r, h * 0.06 + h * 0.3 * r, 0, 0, TAU); ctx.stroke(); } break;
    default: break;
  }
}
export { shade };

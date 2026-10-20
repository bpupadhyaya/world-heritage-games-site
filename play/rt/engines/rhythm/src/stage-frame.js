// Frame-drum stages (1.11.0): pandeiro (Brazil; a hand tambourine with pairs of metal jingles) and rabana (Sri Lanka; a large painted
// frame drum laid on the floor and played by a circle of players, so its head is split into four quarters, one for each player).
// Seen from above. No performer is drawn: the struck zone flares, the skin shivers and, on the pandeiro, the jingles shiver and glint.
//   pandeiro zones: palm (centre), thumb (lower left), fingers (top), slap (right), rim (frame, lower right), shake (the rest of the frame)
//   rabana zones: centre, and four quarters of the ring, named by compass: lane names left unmatched take them low to high.
import { registerDrumStage } from './registry.js';
import { createDrumStage, eSpot, eRing, eSector, assignZones, skinHead, dropShadow, studRing } from './drum-kit.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU } from './drum-kit.js';
import { hand, limb } from './dancers.js';

const lerp = (a, b, t) => a + (b - a) * t;
const PI = Math.PI, d2r = (d) => d * PI / 180;

// ---- pandeiro -------------------------------------------------------------------------------------------------------------------------------
const PAN_ZONES = [['th', /thumb|bass|pa\b|polegar/], ['c', /palm|centre|center|tom|open/], ['fi', /finger|tap|dedo|ti\b/], ['sl', /slap|crack|tak|tapa/], ['rim', /rim|frame|edge|aro/], ['sh', /shake|jingle|plat|chocalho/]];

registerDrumStage({
  id: 'pandeiro', match: /pandeiro|tambourine|pandero|daf.?zang|tamburin/,
  build: (S, lanes, P) => { const zoneOf = []; return createDrumStage('pandeiro', S, lanes, P, {
    dress: () => ({ kind: 'planks', base: '#3e2a1c', rugKind: 'stripes', rugBase: '#173a2e', rugA: '#c9a040', rugB: '#1f4a8a', light: '#ffe2ac' }),
    voiceOf: (i) => `pandeiro-${zoneOf[i] ?? 'c'}`,
    build: (K) => {
      const ref = { w: 760, h: 760 }, cx = 0, cy = 380, R = 318, fw = 62, rh = R - fw, keyOf = assignZones(K, PAN_ZONES.map(([key, re]) => ({ key, re })));
      for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const by = {};
      by.c = eSpot(cx, cy, rh * 0.36, rh * 0.36, 0, { apk: 0.95 });
      by.th = eSector(cx, cy, rh, rh, 0, 0.55, 0.97, d2r(95), d2r(175));
      by.fi = eSector(cx, cy, rh, rh, 0, 0.55, 0.97, d2r(-135), d2r(-45));
      by.sl = eSector(cx, cy, rh, rh, 0, 0.55, 0.97, d2r(-30), d2r(40));
      const rr = R / rh;   // frame ring in head-radius units
      by.rim = eSector(cx, cy, rh, rh, 0, 1.03, rr, d2r(40), d2r(120));
      by.sh = eSector(cx, cy, rh, rh, 0, 1.03, rr, d2r(125), d2r(125 + 255));
      const spots = new Array(K.N).fill(null);
      for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
      return { ref, spots,
        draw(ctx, rt) {
          const fl = (k) => { let m = 0; for (let i = 0; i < K.N; i++) if (keyOf[i] === k) m = Math.max(m, rt.flash[i]); return m; };
          const vib = Math.max(fl('c'), fl('th'), fl('fi'), fl('sl')), shake = Math.max(fl('sh'), fl('rim') * 0.6, vib * 0.5);
          dropShadow(ctx, () => { ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); }, 16, 26, 0.42);
          // the wooden frame, lathe-turned with a lit bevel
          ctx.fillStyle = rgrad(ctx, cx, cy, rh, R, [[0, '#9a5a2c'], [0.5, '#b8743c'], [1, '#6a3a1c']], cx - R * 0.25, cy - R * 0.3); circ(ctx, cx, cy, R); ctx.fill();
          ctx.save(); circ(ctx, cx, cy, R); ctx.clip(); grain(ctx, cx - R, cy - R, 2 * R, 2 * R, '#3a1c0a', 0.4, 9, false, 26); ctx.restore();
          ctx.strokeStyle = 'rgba(255,224,170,0.5)'; ctx.lineWidth = 3; circ(ctx, cx, cy, R - 2); ctx.stroke();
          ctx.strokeStyle = 'rgba(30,14,4,0.5)'; ctx.lineWidth = 2.5; circ(ctx, cx, cy, R - fw * 0.5); ctx.stroke();
          // the head
          ctx.save(); ctx.translate(cx, cy);
          ctx.fillStyle = 'rgba(0,0,0,0.38)'; circ(ctx, 0, 0, rh + 6); ctx.fill();
          skinHead(ctx, rh, rh, { tint: '#f1e7cf', edge: '#bba67c', seed: 8, vib, wear: 0.8 });
          ctx.restore();
          // eight slots in the frame, each with a pair of brass jingles that shiver after a hit
          const n = 8;
          for (let k = 0; k < n; k++) {
            const a = (k + 0.5) / n * TAU, rm = rh + fw * 0.5 + 1, x = cx + Math.cos(a) * rm, y = cy + Math.sin(a) * rm;
            ctx.save(); ctx.translate(x, y); ctx.rotate(a);
            ctx.fillStyle = '#120a04'; rrect(ctx, -fw * 0.42, -fw * 0.24, fw * 0.84, fw * 0.48, 7); ctx.fill();
            ctx.strokeStyle = 'rgba(255,210,150,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
            for (const sgn of [-1, 1]) {
              const jx = Math.sin(rt.anim * 90 + k * 1.7 + sgn) * shake * 4, jy = sgn * (fw * 0.1) + Math.cos(rt.anim * 77 + k) * shake * 2.4;
              ctx.fillStyle = 'rgba(0,0,0,0.4)'; ell(ctx, jx + 2, jy + 3, fw * 0.34, fw * 0.12); ctx.fill();
              ctx.fillStyle = vgrad(ctx, jy - fw * 0.12, jy + fw * 0.12, [[0, '#fff3b0'], [0.45, '#e0b440'], [1, '#7a5612']]); ell(ctx, jx, jy, fw * 0.34, fw * 0.115); ctx.fill();
              ctx.strokeStyle = 'rgba(255,248,200,0.8)'; ctx.lineWidth = 1.2; ell(ctx, jx, jy, fw * 0.34, fw * 0.115); ctx.stroke();
              if (shake > 0.2 && (k + (sgn > 0 ? 1 : 0)) % 3 === 0) { ctx.fillStyle = `rgba(255,255,230,${0.8 * shake})`; ctx.save(); ctx.translate(jx - fw * 0.1, jy - 1); ctx.rotate(0.7); ctx.fillRect(-4, -0.7, 8, 1.4); ctx.rotate(1.57); ctx.fillRect(-4, -0.7, 8, 1.4); ctx.restore(); }
            }
            ctx.restore();
          }
          // tuning screws between the slots
          for (let k = 0; k < n; k++) { const a = k / n * TAU, rm = rh + fw * 0.5 + 1, x = cx + Math.cos(a) * rm, y = cy + Math.sin(a) * rm;
            ctx.fillStyle = 'rgba(0,0,0,0.45)'; circ(ctx, x + 1.5, y + 2.4, 7); ctx.fill(); ctx.fillStyle = rgrad(ctx, x, y, 0, 8, [[0, '#f6f6f2'], [0.6, '#b9bec6'], [1, '#5a5f68']], x - 2, y - 2); circ(ctx, x, y, 6.5); ctx.fill();
            ctx.strokeStyle = 'rgba(30,30,40,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 3, y - 3); ctx.lineTo(x + 3, y + 3); ctx.stroke(); }
          // a ribbon tied through the frame at the lower left, in green, yellow and blue strands that sway a little, and a brass inlay ring in the wood
          ctx.strokeStyle = 'rgba(255,224,150,0.5)'; ctx.lineWidth = 2; circ(ctx, cx, cy, R - fw * 0.15); ctx.stroke();
          { const ax = cx + Math.cos(d2r(150)) * (R - fw * 0.5), ay = cy + Math.sin(d2r(150)) * (R - fw * 0.5), sw = Math.sin(rt.anim * 2.4) * 6 + shake * Math.sin(rt.anim * 30) * 6;
            [['#c8452f', -30, 0], ['#f0c82e', 0, 8], ['#1f8a8a', 30, 16]].forEach(([c, off, dl]) => {
              const path = () => { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.bezierCurveTo(ax - 40 + off * 0.3 + sw, ay + 50, ax - 70 + off + sw * 1.4, ay + 110 + dl, ax - 60 + off * 1.3 + sw * 2, ay + 190 + dl * 2); };
              ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 14; ctx.save(); ctx.translate(7, 10); path(); ctx.stroke(); ctx.restore();
              ctx.strokeStyle = darker(c, 0.35); ctx.lineWidth = 13; path(); ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = 10; path(); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2.4; ctx.save(); ctx.translate(-2, -2); path(); ctx.stroke(); ctx.restore(); });
            ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, ax + 2, ay + 4, 17); ctx.fill(); ctx.fillStyle = rgrad(ctx, ax - 4, ay - 4, 0, 18, [[0, '#e88a6a'], [0.6, '#a8321f'], [1, '#4a1008']]); circ(ctx, ax, ay, 15); ctx.fill(); ctx.fillStyle = '#f0c82e'; circ(ctx, ax, ay, 6); ctx.fill(); }
          void mix; void rgba; void lighter; void hash; void hgrad; void eRing;
        } };
    },
  }); },
});

// ---- rabana ---------------------------------------------------------------------------------------------------------------------------------
const RAB_ZONES = [['c', /dum|centre|center|boom|bass/], ['n', /north|top|tak|ta\b/], ['e', /east|right|tik|ti\b/], ['w', /west|left|ping|ka\b/], ['s', /south|bottom|rim|rap/]];

registerDrumStage({
  id: 'rabana', match: /raban|rabān|rabaan|floor.?drum|rabana/,
  build: (S, lanes, P) => { const zoneOf = []; return createDrumStage('rabana', S, lanes, P, {
    dress: () => ({ kind: 'earth', base: '#8a6a40', rugKind: 'stripes', rugBase: '#e8dcc0', rugA: '#b83a2a', rugB: '#2a6a4a', light: '#ffe6b0', rugPad: 0.02 }),
    voiceOf: (i) => `rabana-${zoneOf[i] ?? 'c'}`,
    build: (K) => {
      const ref = { w: 840, h: 840 }, cx = 0, cy = 420, R = 372, fw = 78, rh = R - fw, keyOf = assignZones(K, RAB_ZONES.map(([key, re]) => ({ key, re })));
      for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const by = {};
      by.c = eSpot(cx, cy, rh * 0.34, rh * 0.34, 0, { apk: 0.95 });
      by.n = eSector(cx, cy, rh, rh, 0, 0.5, 0.97, d2r(-135), d2r(-45));
      by.e = eSector(cx, cy, rh, rh, 0, 0.5, 0.97, d2r(-45), d2r(45));
      by.s = eSector(cx, cy, rh, rh, 0, 0.5, 0.97, d2r(45), d2r(135));
      by.w = eSector(cx, cy, rh, rh, 0, 0.5, 0.97, d2r(135), d2r(225));
      const spots = new Array(K.N).fill(null);
      for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
      return { ref, spots,
        draw(ctx, rt) {
          let vib = 0; for (let i = 0; i < K.N; i++) vib = Math.max(vib, rt.flash[i]);
          dropShadow(ctx, () => { ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); }, 18, 30, 0.45);
          // the deep frame, painted in wedges of red, cream and green with brass studs
          ctx.save(); circ(ctx, cx, cy, R); ctx.clip();
          const cols = ['#b83a2a', '#efe2c0', '#2a6a4a', '#efe2c0'];
          for (let k = 0; k < 24; k++) { ctx.fillStyle = cols[k % 4]; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R + 2, k / 24 * TAU, (k + 1) / 24 * TAU); ctx.closePath(); ctx.fill(); }
          ctx.fillStyle = rgrad(ctx, cx, cy, rh, R, [[0, 'rgba(0,0,0,0.35)'], [0.35, 'rgba(0,0,0,0)'], [0.75, 'rgba(255,255,255,0.14)'], [1, 'rgba(0,0,0,0.4)']], cx - R * 0.25, cy - R * 0.3); ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
          ctx.restore();
          ctx.strokeStyle = 'rgba(255,236,190,0.55)'; ctx.lineWidth = 3; circ(ctx, cx, cy, R - 2); ctx.stroke();
          ctx.save(); ctx.translate(cx, cy); studRing(ctx, R - fw * 0.5, R - fw * 0.5, 24, 6.5, '#e8c868', 0.1); ctx.restore();
          ctx.save(); ctx.translate(cx, cy);
          ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, 0, 0, rh + 8); ctx.fill();
          skinHead(ctx, rh, rh, { tint: '#f0e2bf', edge: '#b49660', seed: 12, vib, wear: 0.9 });
          // four faint seams mark the quarters of the players
          ctx.strokeStyle = 'rgba(120,80,40,0.22)'; ctx.lineWidth = 2; for (const a of [-PI / 4, PI / 4, 3 * PI / 4, 5 * PI / 4]) { ctx.beginPath(); ctx.moveTo(Math.cos(a) * rh * 0.5, Math.sin(a) * rh * 0.5); ctx.lineTo(Math.cos(a) * rh * 0.97, Math.sin(a) * rh * 0.97); ctx.stroke(); }
          ctx.restore();
          // the four players seated round the drum, seen as two hands each and a sleeved forearm: the hands hover on the frame, the ones of the struck quarter press the skin
          const fq = (k) => { let m = 0; for (let i = 0; i < K.N; i++) if (keyOf[i] === k) m = Math.max(m, rt.flash[i]); return m; };
          [['n', -PI / 2, '#b83a2a', '#a8683f'], ['e', 0, '#2a6a4a', '#c98e63'], ['s', PI / 2, '#e0a82e', '#8a5434'], ['w', PI, '#2a58b8', '#d49a6c']].forEach(([k, a, sleeve, skin], q) => {
            const f = fq(k), ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux;
            for (const sd of [-1, 1]) {
              const hit = sd > 0 ? f : f * 0.0, bob = Math.sin(rt.anim * 2.2 + q * 1.3 + sd) * 4;
              const r = lerp(R + 18, rh * 0.62, clamp(hit * 1.4, 0, 1)) + bob * (1 - hit), off = sd * rh * 0.3 * (1 - hit * 0.3);
              const hx = cx + ux * r + px * off, hy = cy + uy * r + py * off, ex = cx + ux * (R + 150) + px * off * 1.4, ey = cy + uy * (R + 150) + py * off * 1.4;
              ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, hx + 9, hy + 14, 34, 22); ctx.fill();
              limb(ctx, ex, ey, hx - ux * 30, hy - uy * 30, 46, sleeve, true);
              ctx.strokeStyle = '#efe2c0'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx - ux * 32 - px * 22, hy - uy * 32 - py * 22); ctx.lineTo(hx - ux * 32 + px * 22, hy - uy * 32 + py * 22); ctx.stroke();
              hand(ctx, hx - ux * 28, hy - uy * 28, a + PI, 118, { skin, open: 0.12 + 0.3 * hit, side: sd, curl: 0.2 - 0.15 * hit });
            }
          });
          void mix; void rgba; void lighter; void darker; void hash; void hgrad; void vgrad; void grain; void eRing;
        } };
    },
  }); },
});

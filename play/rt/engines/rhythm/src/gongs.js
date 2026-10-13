// Gong ensembles as the play surface: a row of small bossed gongs lying on cords, big hanging gongs wearing the cycle ring,
// and the accompanying drum. Cues are rings closing on each boss; the cycle cursor sweeps around the big gong.
import { clamp, mix, rgba, lighter, darker, glow, rrect, grain, hgrad, vgrad, rgrad, ell, circ, TAU, gong as gongArt } from './art.js';
import { makeBox, circleSpot, finishSpots, hitSpots, pill } from './stagekit.js';
import { stick } from './pads.js';

export function gongId(key) { return /kulintang|kolintang|kolintan/.test(String(key || '').toLowerCase()) ? 'kulintang' : 'gamelan'; }

export function createGongStage(id, S, lanes, P) {
  const N = lanes.length;
  const st = { id, kind: 'gongs', spots: new Array(N).fill(null), voice: 'gong', F: null };
  const spots = st.spots;
  const nm = (i) => lanes[i].name.toLowerCase();
  const big = lanes.map((_, i) => i).filter((i) => /agung|^gong|ageng|gandingan|kempul|kenong/.test(nm(i)));
  const drum = lanes.map((_, i) => i).filter((i) => /dabakan|drum|kendang|kendhang/.test(nm(i)));
  const small = lanes.map((_, i) => i).filter((i) => /babandil|bandil/.test(nm(i)));
  const row = lanes.map((_, i) => i).filter((i) => !big.includes(i) && !drum.includes(i) && !small.includes(i)).sort((a, b) => lanes[a].hz - lanes[b].hz);
  const ref = { w: 1000, h: 760 };
  let variant = '';
  const place = (portrait) => {
    if (variant === (portrait ? 'p' : 'l')) return;
    variant = portrait ? 'p' : 'l';
    ref.w = portrait ? 780 : 1000; ref.h = portrait ? 1000 : 600;
    const two = row.length > 6 && id !== 'kulintang';
    const perRow = two ? Math.ceil(row.length / 2) : row.length;
    const rowU = portrait ? (id === 'kulintang' ? 640 : 600) : (id === 'kulintang' ? 440 : 400);
    const pitch = portrait ? Math.min(96, (ref.w - 80) / Math.max(1, perRow)) : 108;
    row.forEach((i, k) => {
      const r = two ? Math.floor(k / perRow) : 0, c = two ? k % perRow : k;
      const n = two ? (r === 1 ? row.length - perRow : perRow) : row.length;
      const t = row.length > 1 ? k / (row.length - 1) : 0, rad = Math.min(pitch * 0.46, id === 'kulintang' ? 66 - 24 * t : 72 - 14 * t);
      spots[i] = circleSpot((c - (n - 1) / 2) * (two ? Math.max(pitch, 120) : pitch) + (!portrait && id === 'kulintang' ? 40 : 0), rowU + (r ? 140 : 0), rad, { gong: true, rad });
    });
    big.forEach((i, k) => { const rad = 120 - 24 * (k > 0); spots[i] = circleSpot(portrait ? -170 + k * 250 : -300 + k * 150, portrait ? 250 : 190, rad, { big: true, rad, cycle: k === 0 }); });
    drum.forEach((i, k) => { spots[i] = circleSpot(portrait ? 250 + k * 30 : 330 + k * 40, portrait ? 300 : 150, 80, { drum: true, rad: 80 }); });
    small.forEach((i, k) => { spots[i] = circleSpot((portrait ? -90 : -60) + k * 150, portrait ? 860 : 540, 58, { gong: true, rad: 58 }); });
    for (let i = 0; i < N; i++) if (!spots[i]) spots[i] = circleSpot(0, 60 + 50 * i, 34, { gong: true, rad: 34 });
  };
  place(false);

  st.layout = (area) => { place(area.h > area.w * 1.05); st.F = makeBox(area, ref.w, ref.h, { top: 40, bottom: 10, side: 12, tilt: id === 'kulintang' && area.h > area.w * 1.05 ? -0.12 : 0 }); finishSpots(st.F, spots); };
  st.hit = (x, y) => (st.F ? hitSpots(st.F, spots, x, y) : -1);
  st.anchor = (i) => ({ x: spots[i]?.x ?? 0, y: spots[i]?.y ?? 0 });

  st.draw = (g, rt) => {
    const { ctx } = g, F = st.F;
    if (!F) return;
    ctx.save(); F.apply(ctx);
    const frameW = 960;
    // carved wooden stand for the hanging gongs
    if (big.length) {
      const bx = big.map((i) => spots[i].v), lo = Math.min(...bx) - 190, hi = Math.max(...bx) + 190;
      for (const x of [lo, hi]) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, x + 6, 40, 34, 380, 12); ctx.fill(); ctx.fillStyle = hgrad(ctx, x, x + 34, [[0, '#3a1c0a'], [0.5, '#a8682c'], [1, '#3a1c0a']]); rrect(ctx, x, 30, 34, 380, 12); ctx.fill(); }
      ctx.fillStyle = hgrad(ctx, lo, hi, [[0, '#4a2610'], [0.5, '#b87a38'], [1, '#4a2610']]); rrect(ctx, lo - 10, 22, hi - lo + 54, 44, 14); ctx.fill();
      ctx.strokeStyle = 'rgba(255,225,170,0.4)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(255,225,150,0.8)'; for (let k = 0; k < 9; k++) { circ(ctx, lo + 14 + k * ((hi - lo) / 8), 44, 5); ctx.fill(); }
    }
    // the rack of small gongs: two cords with a wooden frame
    if (row.length || small.length) {
      const us = row.length ? [...new Set(row.map((i) => spots[i].u))] : [];
      const x0 = row.length ? Math.min(...row.map((i) => spots[i].v)) - 100 : -300, x1 = row.length ? Math.max(...row.map((i) => spots[i].v)) + 100 : 300;
      for (const u of us) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, x0 + 8, u - 30 + 12, x1 - x0, 60, 18); ctx.fill();
        ctx.fillStyle = vgrad(ctx, u - 30, u + 40, [[0, '#7a4a22'], [1, '#2a170a']]); rrect(ctx, x0, u - 30, x1 - x0, 66, 18); ctx.fill();
        for (const d of [-14, 14]) { ctx.strokeStyle = '#e8d0a0'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x0 + 10, u + d); ctx.lineTo(x1 - 10, u + d); ctx.stroke(); }
      }
    }
    // drum (dabakan): a long goblet seen from the front, head at the top
    drum.forEach((i) => {
      const sp = spots[i], l = lanes[i], f = rt.flash[i];
      const bu = sp.u + (ref.h > 800 ? 330 : 270);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, sp.v + 6, bu + 10, 120, 20); ctx.fill();
      ctx.beginPath(); ctx.moveTo(sp.v - 84, sp.u); ctx.bezierCurveTo(sp.v - 92, sp.u + 170, sp.v - 50, sp.u + 250, sp.v - 64, bu); ctx.lineTo(sp.v + 64, bu); ctx.bezierCurveTo(sp.v + 50, sp.u + 250, sp.v + 92, sp.u + 170, sp.v + 84, sp.u); ctx.closePath();
      ctx.fillStyle = hgrad(ctx, sp.v - 100, sp.v + 100, [[0, '#3a1c0a'], [0.3, '#b87a38'], [0.7, '#8a5a24'], [1, '#2a1408']]); ctx.fill();
      ctx.fillStyle = '#d8c598'; ell(ctx, sp.v, sp.u, 90, 34); ctx.fill();
      ctx.fillStyle = rgrad(ctx, sp.v, sp.u, 2, 84, [[0, '#fff4d8'], [1, '#bd9f6c']]); ell(ctx, sp.v, sp.u, 80, 27); ctx.fill();
      if (f > 0.03) { glow(ctx, sp.v, sp.u, 130, l.color, 0.5 * f); }
    });
    const cyc = rt.cycle;
    big.forEach((i) => {
      const sp = spots[i], l = lanes[i], f = rt.flash[i];
      // hanging cords
      ctx.strokeStyle = '#e8d0a0'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(sp.v - 40, 60); ctx.lineTo(sp.v - sp.rad * 0.75, sp.u - sp.rad * 0.5); ctx.moveTo(sp.v + 40, 60); ctx.lineTo(sp.v + sp.rad * 0.75, sp.u - sp.rad * 0.5); ctx.stroke();
      const sw = Math.sin(rt.anim * 18) * f * 4;
      gongArt(ctx, S, sp.v + sw, sp.u, sp.rad, l.color, f);
      if (sp.cycle && cyc) { // the cycle ring and its sweeping cursor
        const R = sp.rad + 34, n = cyc.beats;
        ctx.strokeStyle = 'rgba(255,225,170,0.25)'; ctx.lineWidth = 2; circ(ctx, sp.v, sp.u, R); ctx.stroke();
        for (let b = 0; b < n; b++) { const a = -Math.PI / 2 + (b / n) * TAU, down = b % cyc.meter === 0; ctx.fillStyle = down ? 'rgba(255,225,150,0.95)' : 'rgba(255,255,255,0.4)'; circ(ctx, sp.v + Math.cos(a) * R, sp.u + Math.sin(a) * R, down ? 6 : 3.5); ctx.fill(); }
        const ca = -Math.PI / 2 + (cyc.pos / n) * TAU;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 8; k++) { ctx.strokeStyle = rgba('#ffd98a', 0.5 * (1 - k / 8)); ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(sp.v, sp.u, R, ca - (k + 1) * 0.07, ca - k * 0.07); ctx.stroke(); } ctx.restore();
        ctx.fillStyle = '#fff3c8'; circ(ctx, sp.v + Math.cos(ca) * R, sp.u + Math.sin(ca) * R, 9); ctx.fill();
      }
    });
    [...row, ...small].forEach((i) => {
      const sp = spots[i], l = lanes[i], f = rt.flash[i];
      gongArt(ctx, S, sp.v, sp.u, sp.rad, l.color, f);
      if (f > 0.04) { const d = (i % 2 ? 1 : -1); stick(ctx, sp.v + d * 8, sp.u - 10 - 100 * (1 - f), d * 0.25, 230, 13, '#d9b27a', '#7a2c1a', f * 1.7); }
    });
    // approach rings
    for (let k = rt.list.length - 1; k >= 0; k--) {
      const t = rt.list[k];
      if (t.state && t.state !== 'pending' && t.state !== 'miss') continue;
      const tau = (t.t - rt.clock) / rt.look;
      if (tau > 1.0 || tau < -0.25) continue;
      const sp = spots[t.lane], l = lanes[t.lane], miss = t.state === 'miss';
      const a = (rt.soft ? 0.5 : 1) * (miss ? 0.35 : 1) * clamp((1.05 - tau) * 8, 0, 1) * clamp((tau + 0.25) * 6, 0, 1);
      const col = miss ? mix(l.color, '#555555', 0.6) : l.color, R = (sp.rad ?? sp.r) * (1.0 + 0.9 * clamp(tau, 0, 1.1));
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = rgba(lighter(col, 0.5), 0.95); ctx.lineWidth = 4; circ(ctx, sp.v, sp.u, R); ctx.stroke(); ctx.strokeStyle = rgba(col, 0.4); ctx.lineWidth = 9; ctx.stroke();
      glow(ctx, sp.v, sp.u, (sp.rad ?? sp.r) * 1.8, col, 0.3 * (1 - clamp(tau, 0, 1)) + 0.1); ctx.restore();
    }
    void frameW;
    ctx.restore();
    const size = g.px(15);
    lanes.forEach((l, i) => { const sp = spots[i], [x, y] = F.map(sp.v, sp.u + (sp.big ? sp.rad * 0.0 : 0)); pill(ctx, l.name, x, y + (sp.gong ? sp.rad * F.scale * 1.15 : 0), 84, size, l.color, rt.flash[i]); });
  };
  return st;
}

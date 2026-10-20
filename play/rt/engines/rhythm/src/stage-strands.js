// Strands and bands of small hard things (1.19.0): the ekpili (seed-shell strands on a bar), the yomyom (rows of brass pellet bells) and the matlhowa
// (cocoons filled with pebbles, stitched on a leather band). Each is drawn hanging, threaded or laid out as a lit object; a stroke sets the strands
// swinging and the little things clack against each other. No performer, no hands, no limbs.
import { eSpot, dropShadow } from './drum-kit.js';
import { mkRattle } from './stage-rattles.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU, glow, lerp, solid, ball, cord, handle, makeOrient } from './rattle-kit.js';

// ============================================================ EKPILI (seed-shell strands) ================================
mkRattle('ekpili', /ekpili|seed.?shell|shell.?rattle|\bide\b|iyok/, {
  dress: () => ({ kind: 'planks', base: '#5a3e2a', rugKind: 'zigzag', rugBase: '#2a3a30', rugA: '#f0cc6a', rugB: '#c8503a', light: '#ffe8bc' }),
  zones: [['flick', /flick|top|tick|tap/], ['sway', /sway|swing|shake|wave/], ['clack', /clack|clap|knock|bottom|stamp|step/]],
  build: (K) => {
    const tall = K.tall, ref = tall ? { w: 600, h: 760 } : { w: 920, h: 520 };
    const bar = tall ? 70 : 54, barW = tall ? 480 : 700, nS = tall ? 4 : 6, nShell = tall ? 8 : 6, gap = tall ? 78 : 66, sw = tall ? 30 : 27;
    const by = {}, midY = bar + 20 + nShell * gap * 0.5;
    by.flick = eSpot(0, bar + 56, barW * 0.5, 50, 0, { apk: 0.9 });
    by.sway = eSpot(0, midY, barW * 0.5, nShell * gap * 0.2, 0, { apk: 0.9 });
    by.clack = eSpot(0, bar + 20 + nShell * gap * 0.88, barW * 0.5, 54, 0, { apk: 0.9 });
    return { ref, by,
      draw(ctx, rt, fl) {
        const sway = fl('sway'), fk = fl('flick'), ck = fl('clack'), amp = Math.max(sway * 0.34, fk * 0.12, ck * 0.2);
        // the bar: a carved wooden rod with a knob at each end, hung by two cords
        for (const sx of [-1, 1]) cord(ctx, sx * barW * 0.4, 0, sx * barW * 0.4, bar - 6, 0, 7, '#d8c08a');
        handle(ctx, -barW / 2 - 12, bar, 0, barW + 24, 26, '#7a4a26', { ring: [0.06, 0.94, 0.5], seed: 8 });
        for (const sx of [-1, 1]) { ctx.fillStyle = '#3a2210'; circ(ctx, sx * (barW / 2 + 14), bar, 17); ctx.fill(); ctx.fillStyle = 'rgba(255,220,160,0.4)'; circ(ctx, sx * (barW / 2 + 10), bar - 5, 6); ctx.fill(); }
        for (let i = 0; i < nS; i++) {
          const px = lerp(-barW / 2 + 54, barW / 2 - 54, i / (nS - 1)), ph = i * 0.9, th = amp * Math.sin(rt.anim * 17 + ph) * (1 - 0.15 * (i % 2));
          ctx.save(); ctx.translate(px, bar + 10); ctx.rotate(th + 0.015 * Math.sin(i * 2.1));
          ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(3, 4); ctx.lineTo(3, 20 + nShell * gap); ctx.stroke();
          ctx.strokeStyle = '#d8c08a'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 12 + nShell * gap); ctx.stroke();
          for (let k = 0; k < nShell; k++) {
            const y = 34 + k * gap, flip = (k + i) % 2 ? 1 : -1, tw = Math.sin(rt.anim * 25 + k * 1.3 + i) * ck * 0.5 + flip * 0.12;
            ctx.save(); ctx.translate(0, y); ctx.rotate(tw);
            // a halved seed: an oval cup, ridged, pale inside rim, darker toward the edge
            const w = sw * (0.82 + 0.34 * hash(i * 7 + k)), h = w * 1.28;
            ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, 4, 6, w, h); ctx.fill();
            ctx.fillStyle = rgrad(ctx, 0, 0, 0, w * 1.1, [[0, '#f0c488'], [0.5, '#b87840'], [1, '#5a3014']], -w * 0.3, -h * 0.4); ell(ctx, 0, 0, w, h); ctx.fill();
            ctx.save(); ell(ctx, 0, 0, w, h); ctx.clip(); ctx.strokeStyle = 'rgba(30,12,4,0.5)'; ctx.lineWidth = 1.6; for (let q = -3; q <= 3; q++) { ctx.beginPath(); ctx.ellipse(0, 0, w * 0.2 * Math.abs(q) + 1, h * 1.1, 0, 0, TAU); ctx.stroke(); }
            ctx.fillStyle = flip > 0 ? '#f4dcae' : '#4a2a14'; ell(ctx, 0, h * 0.1, w * 0.55, h * 0.4); ctx.fill(); ctx.fillStyle = 'rgba(255,255,244,0.62)'; ell(ctx, -w * 0.35, -h * 0.45, w * 0.24, h * 0.11); ctx.fill(); ctx.fillStyle = 'rgba(255,255,244,0.3)'; ell(ctx, -w * 0.5, h * 0.05, w * 0.07, h * 0.28); ctx.fill(); ctx.restore();
            ctx.strokeStyle = 'rgba(20,8,0,0.7)'; ctx.lineWidth = 2; ell(ctx, 0, 0, w, h); ctx.stroke();
            ctx.fillStyle = '#d8c08a'; circ(ctx, 0, -h, 4); ctx.fill();
            ctx.restore();
          }
          ctx.restore();
        }
        if (Math.max(ck, sway) > 0.1) glow(ctx, 0, midY, barW * 0.5, '#ffd9a0', 0.18 * Math.max(ck, sway));
      } };
  },
});

// ============================================================ YOMYOM (brass pellet bells) ================================
mkRattle('yomyom', /yom.?yom|pellet|brass.?bell|crotal/, {
  dress: () => ({ kind: 'cloth', base: '#34231a', accent: '#d8a850', rugKind: null, light: '#ffe6b0' }),
  zones: [['high', /high|small|top|bright/], ['mid', /mid|medium|jingle/], ['low', /low|large|big|deep|swing/]],
  build: (K) => {
    const tall = K.tall, ref = tall ? { w: 600, h: 780 } : { w: 980, h: 520 };
    const rows = [{ key: 'high', r: tall ? 27 : 24, n: tall ? 10 : 17, c: 0 }, { key: 'mid', r: tall ? 35 : 31, n: tall ? 8 : 13, c: 1 }, { key: 'low', r: tall ? 45 : 40, n: tall ? 6 : 10, c: 2 }];
    const W = tall ? 520 : 880, yAt = (j) => (tall ? 130 + j * 250 : 100 + j * 150), by = {};
    rows.forEach((rw, j) => { by[rw.key] = eSpot(0, yAt(j), W * 0.52, rw.r * 2.4, 0, { apk: 0.9 }); });
    return { ref, by,
      draw(ctx, rt, fl) {
        rows.forEach((rw, j) => {
          const f = fl(rw.key), y0 = yAt(j), phs = j * 1.7;
          // the leather thong the row is threaded on: two strands that wave gently
          const yy = (x) => y0 + Math.sin(x / W * Math.PI * 2 + phs) * 22 + Math.sin(rt.anim * 28 + x * 0.02) * f * 7;
          ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 9; ctx.beginPath(); for (let k = 0; k <= 40; k++) { const x = -W / 2 + W * k / 40; if (k) ctx.lineTo(x + 3, yy(x) + 5); else ctx.moveTo(x + 3, yy(x) + 5); } ctx.stroke();
          ctx.strokeStyle = '#6a3a1c'; ctx.lineWidth = 7; ctx.beginPath(); for (let k = 0; k <= 40; k++) { const x = -W / 2 + W * k / 40; if (k) ctx.lineTo(x, yy(x)); else ctx.moveTo(x, yy(x)); } ctx.stroke();
          ctx.strokeStyle = '#b57a42'; ctx.lineWidth = 2.4; ctx.beginPath(); for (let k = 0; k <= 40; k++) { const x = -W / 2 + W * k / 40; if (k) ctx.lineTo(x, yy(x) - 1.5); else ctx.moveTo(x, yy(x) - 1.5); } ctx.stroke();
          for (let k = 0; k < rw.n; k++) {
            const x = -W / 2 + 24 + (W - 48) * (k + 0.5) / rw.n, jig = Math.sin(rt.anim * 34 + k * 1.9 + j) * f * 9, y = yy(x) + rw.r * 0.9 + jig;
            const tone = ['#e6b04a', '#d9a03c', '#c98a2e'][(k + j) % 3];
            ctx.strokeStyle = '#4a2a14'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, yy(x)); ctx.lineTo(x, y - rw.r * 0.7); ctx.stroke();
            ball(ctx, x, y, rw.r, tone, { slit: true, hi: 0.9 });
            ctx.fillStyle = '#4a2a14'; rrect(ctx, x - rw.r * 0.22, y - rw.r * 1.18, rw.r * 0.44, rw.r * 0.4, 3); ctx.fill();
            if (f > 0.15) { ctx.fillStyle = rgba('#fff2c0', 0.55 * f); circ(ctx, x - rw.r * 0.3, y - rw.r * 0.35, rw.r * 0.3); ctx.fill(); }
          }
          if (f > 0.1) glow(ctx, 0, y0 + 24, W * 0.5, '#ffd27a', 0.24 * f);
        });
      } };
  },
});

// ============================================================ MATLHOWA (cocoon leg band) ================================
mkRattle('matlhowa', /matlhowa|cocoon|leg.?rattle|ankle.?rattle|shin.?rattle/, {
  dress: () => ({ kind: 'earth', base: '#8a6a44', rugKind: 'diamond', rugBase: '#4a2a1c', rugA: '#e0bc78', rugB: '#a8482a', light: '#ffe8bc' }),
  zones: [['shake', /shake|rattle|top|upper/], ['stamp', /stamp|step|stomp|beat/], ['flick', /flick|tick|low|lower|tap/]],
  build: (K) => {
    const tall = K.tall, ref = tall ? { w: 520, h: 860 } : { w: 960, h: 440 }, Y0 = 430, view = tall ? { dx: 0.1 } : undefined;
    const OR = makeOrient(tall, ref, Y0, eSpot);
    const bw = 276, top = 60, bot = 800, by = {};
    by.shake = OR.ES(0, top + 150, bw * 0.62, 130, { apk: 0.9 });
    by.stamp = OR.ES(0, (top + bot) / 2 + 20, bw * 0.62, 120, { apk: 0.9 });
    by.flick = OR.ES(0, bot - 150, bw * 0.62, 130, { apk: 0.9 });
    const rowsN = 9, colsN = 3;
    return { ref, view, by,
      draw(ctx, rt, fl) {
        const sh = fl('shake'), st = fl('stamp'), fk = fl('flick');
        OR.begin(ctx);
        // the leather band: dark, stitched at both edges, with thong ties hanging from the upper end
        const band = (g) => rrect(g, -bw / 2, top, bw, bot - top, 26);
        dropShadow(ctx, band, 16, 22, 0.42);
        ctx.fillStyle = hgrad(ctx, -bw / 2, bw / 2, [[0, '#4a2a14'], [0.3, '#a8703a'], [0.6, '#8a5a2c'], [1, '#3a2010']]); band(ctx); ctx.fill();
        ctx.save(); band(ctx); ctx.clip(); grain(ctx, -bw / 2, top, bw, bot - top, '#1a0a04', 0.4, 5, true, 24); ctx.restore();
        ctx.strokeStyle = 'rgba(255,214,150,0.35)'; ctx.lineWidth = 2; band(ctx); ctx.stroke();
        ctx.strokeStyle = '#e0c88a'; ctx.lineWidth = 2.4; ctx.setLineDash([9, 7]); for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * (bw / 2 - 14), top + 16); ctx.lineTo(sx * (bw / 2 - 14), bot - 16); ctx.stroke(); } ctx.setLineDash([]);
        for (let k = 0; k < 3; k++) cord(ctx, (k - 1) * 26, top + 8, (k - 1) * 40 + 8 * Math.sin(rt.anim * 20) * st, top - 34 - k * 4, 0, 6, '#d8c08a');
        // the cocoons: oval silk cases sewn on in rows, each with a few pebbles that shift when shaken
        const cw = 40, ch = 26, gx = (bw - 78) / (colsN - 1), gy = (bot - top - 80) / (rowsN - 1);
        for (let r = 0; r < rowsN; r++) for (let c = 0; c < colsN; c++) {
          const zone = r < 3 ? sh : r > 6 ? fk : st, f = Math.max(zone, st * 0.5), jx = Math.sin(rt.anim * 30 + r * 1.3 + c * 2.1) * f * 5, jy = Math.cos(rt.anim * 26 + r + c) * f * 4;
          const x = -bw / 2 + 31 + c * gx + jx + (r % 2 ? 0 : 0), y = top + 40 + r * gy + jy, rot = (hash(r * 3 + c) - 0.5) * 0.5 + Math.sin(rt.anim * 24 + r) * f * 0.2;
          ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 2 + rot);
          const pea = (g) => { g.beginPath(); for (let k = 0; k <= 40; k++) { const t = (k / 40) * TAU, c = Math.cos(t), sn = Math.sin(t); g.lineTo(c * cw * (1 + 0.04 * Math.abs(sn)), sn * ch * (1 - 0.16 * Math.exp(-((c * 3.2) ** 2)))); } g.closePath(); };
          ctx.save(); ctx.translate(5, 8); pea(ctx); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill(); ctx.restore();
          pea(ctx); ctx.fillStyle = rgrad(ctx, -cw * 0.2, -ch * 0.3, 0, cw * 1.1, [[0, '#f6eed6'], [0.5, '#d4c294'], [1, '#6a5430']], -cw * 0.3, -ch * 0.4); ctx.fill();
          ctx.save(); pea(ctx); ctx.clip(); ctx.strokeStyle = 'rgba(90,64,28,0.4)'; ctx.lineWidth = 1.2; for (let q = 0; q < 12; q++) { ctx.beginPath(); ctx.moveTo(-cw, (q - 6) * 3.4); ctx.bezierCurveTo(-cw * 0.4, (q - 6) * 3.4 + 5, cw * 0.4, (q - 6) * 3.4 - 5, cw, (q - 6) * 3.4); ctx.stroke(); }
          for (let q = 0; q < 3; q++) { ctx.fillStyle = `rgba(40,28,14,${0.2 + 0.3 * f})`; ell(ctx, Math.sin(rt.anim * 20 + q * 2 + r) * cw * 0.45 * f + (q - 1) * cw * 0.28, Math.cos(rt.anim * 17 + q + c) * ch * 0.4 * f, 4.5, 3.5); ctx.fill(); }
          ctx.fillStyle = 'rgba(80,56,24,0.45)'; ctx.fillRect(-2, -ch, 4, 2 * ch);   // the waist of the cocoon
          ctx.fillStyle = 'rgba(255,255,244,0.5)'; ell(ctx, -cw * 0.4, -ch * 0.45, cw * 0.22, ch * 0.1); ctx.fill(); ctx.restore();
          ctx.strokeStyle = 'rgba(60,40,14,0.75)'; ctx.lineWidth = 2; pea(ctx); ctx.stroke();
          ctx.strokeStyle = '#e0c88a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -ch - 3); ctx.lineTo(0, ch + 3); ctx.stroke();   // the stitch that holds it to the leather
          ctx.restore();
        }
        if (st > 0.1) glow(ctx, 0, (top + bot) / 2, bw * 1.4, '#ffd9a0', 0.2 * st);
        OR.end(ctx);
      } };
  },
});

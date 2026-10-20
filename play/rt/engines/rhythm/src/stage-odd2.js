// Odd instruments II (1.21.0): the washtub bass (an upturned tub, a broomstick and one cord), the friction drum (a drum with a rod through its skin, rubbed
// to make the lion's roar) and the ugly stick (a pole hung with bells, bottle caps and tin, stamped on a board). Each has its own picture, room and voice.
// No performer and no hands: the cord and the rod move, the pieces jump. Lane names or pitch order give the zones.
import { eSpot, eRing, rSpot, skinHead } from './drum-kit.js';
import { mkGong } from './stage-gongs.js';
import { registerStrikeVoice, registerSynthVoice } from './voice-registry.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU, PI, lerp, glow, beam, rings, lamp, hangCord } from './gong-kit.js';

// ============================================================ WASHTUB BASS =====================================================================
mkGong('washtub', /wash.?tub|tub.?bass|gutbucket|gut.?bucket|bass.?tub/, {
  voice: null,
  wall: { kind: 'timber', c1: '#5a4a38', c2: '#7a6850', log: 80 }, floor: { kind: 'planks', c1: '#6a5030', c2: '#8a6a40', ph: 70 }, rail: '#2a1e10', light: '#ffe0a8', vig: 0.58,
  orn(ctx, A, wallB, rt) { const x = A.x + A.w * 0.16, y = A.y + (wallB - A.y) * 0.22; ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, A.y); ctx.lineTo(x, y - 12); ctx.stroke(); lamp(ctx, x, y, Math.max(11, A.w * 0.016), rt?.anim ?? 0, '#ffc070'); },
  zones: [['slap', /slap|tub|thump|bucket|body|knock/], ['s0', /low|open|bottom|deep/], ['s3', /top|high/], ['s1', /mid.?low|second|^mid$/], ['s2', /mid.?high|third/]],
  build: (K) => {
    const tall = K.tall, ref = tall ? { w: 700, h: 920 } : { w: 1060, h: 600 }, by = {};
    const tx = tall ? -10 : -80, ty = tall ? 650 : 400, rx = tall ? 262 : 230, ry = rx * 0.36, wallH = tall ? 190 : 150, px = tall ? 170 : 140, py = tall ? 70 : 40, hx = px - 10, hy = ty - 8;
    // the cord runs from the eye at the top of the broomstick down to the middle of the tub
    const cx0 = tx + rx * 0.02, cy0 = ty + 2, sx = px - 4, sy = py + 28, at = (t) => [lerp(sx, cx0, t), lerp(sy, cy0, t)];
    [[0.22, 's0'], [0.42, 's1'], [0.62, 's2'], [0.8, 's3']].forEach(([t, k]) => { const [x, y] = at(t); by[k] = eSpot(x, y, tall ? 52 : 44, tall ? 52 : 44, 0, { apk: 0.9 }); });
    by.slap = eSpot(tx - rx * 0.36, ty + ry * 0.2, rx * 0.46, ry * 0.7, 0, { apk: 0.85 });
    return { ref, by, wallU: ty - ry - 30,
      draw(ctx, rt, fl) {
        const fs = ['s0', 's1', 's2', 's3'].map((k) => fl(k)), fa = Math.max(...fs), fsl = fl('slap');
        ctx.fillStyle = 'rgba(0,0,0,0.42)'; ell(ctx, tx + 24, ty + wallH + ry * 0.9, rx * 1.05, ry * 0.7); ctx.fill();
        const jig = Math.sin(rt.anim * 40) * fsl * 3;
        ctx.save(); ctx.translate(0, jig);
        // the tub: galvanized steel, ribbed, with two handles
        for (const sgn of [-1, 1]) { ctx.strokeStyle = '#6a7078'; ctx.lineWidth = 11; ctx.beginPath(); ctx.ellipse(tx + sgn * rx * 0.99, ty + wallH * 0.2, 28, 40, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#d0d6de'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(tx + sgn * rx * 0.99 - 2, ty + wallH * 0.2 - 2, 28, 40, 0, PI * 1.1, PI * 1.7); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(tx - rx, ty); ctx.lineTo(tx - rx * 1.04, ty + wallH); ctx.ellipse(tx, ty + wallH, rx * 1.04, ry * 1.04, 0, PI, 0, true); ctx.lineTo(tx + rx, ty); ctx.ellipse(tx, ty, rx, ry, 0, 0, PI); ctx.closePath();
        ctx.fillStyle = hgrad(ctx, tx - rx, tx + rx, [[0, '#5a626c'], [0.16, '#e4e8ee'], [0.34, '#b4bcc6'], [0.6, '#8a929c'], [0.86, '#c0c8d2'], [1, '#4a525c']]); ctx.fill();
        ctx.save(); ctx.clip(); for (const q of [0.22, 0.5, 0.78]) { const y = ty + wallH * q; ctx.strokeStyle = 'rgba(40,48,60,0.45)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(tx, y, rx * 1.02, ry * 1.02, 0, 0.02, PI - 0.02); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(tx, y - 3, rx * 1.02, ry * 1.02, 0, 0.04, PI - 0.04); ctx.stroke(); }
        for (let k = 0; k < 22; k++) { ctx.fillStyle = `rgba(90,60,40,${0.06 + 0.1 * hash(k)})`; ell(ctx, tx + (hash(k * 2.1) - 0.5) * rx * 2, ty + wallH * hash(k * 3.3), 6 + 20 * hash(k), 2 + 6 * hash(k + 4)); ctx.fill(); }   // rust bloom
        ctx.restore();
        // the top of the upturned tub: the base with a rolled edge, rust, a hole for the cord
        ell(ctx, tx, ty, rx, ry); ctx.fillStyle = rgrad(ctx, tx - rx * 0.3, ty - ry * 0.4, 10, rx, [[0, '#e8ecf2'], [0.5, '#a6aeb8'], [1, '#6a727c']]); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ell(ctx, tx, ty, rx, ry); ctx.stroke();
        ctx.strokeStyle = 'rgba(40,50,64,0.4)'; ctx.lineWidth = 2; ell(ctx, tx, ty, rx * 0.86, ry * 0.86); ctx.stroke(); ell(ctx, tx, ty, rx * 0.5, ry * 0.5); ctx.stroke();
        for (let k = 0; k < 14; k++) { ctx.fillStyle = `rgba(110,70,40,${0.08 + 0.14 * hash(k + 11)})`; ell(ctx, tx + (hash(k * 1.9) - 0.5) * rx * 1.6, ty + (hash(k * 2.7 + 1) - 0.5) * ry * 1.6, 8 + 22 * hash(k + 2), 3 + 7 * hash(k + 6)); ctx.fill(); }
        ctx.restore();
        if (fsl > 0.05) { glow(ctx, tx - rx * 0.36, ty + ry * 0.2, rx * 0.8, '#ffe8b0', 0.3 * fsl); rings(ctx, tx - rx * 0.36, ty + ry * 0.2, rx * 0.4, fsl); }
        // the broomstick stands on the rim of the tub, held by the pull of the cord
        const tilt = Math.sin(rt.anim * 30) * fa * 0.004;
        ctx.save(); ctx.translate(hx, hy); ctx.rotate(tilt); ctx.translate(-hx, -hy);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(px - 6 + 10, py + 6, 18, hy - py); beam(ctx, px - 12, py, 24, hy - py + 4, '#b88a52', { vertical: true, round: 8 });
        ctx.fillStyle = '#5a3a1e'; ctx.beginPath(); ctx.moveTo(px - 18, hy + 2); ctx.lineTo(px + 18, hy + 2); ctx.lineTo(px + 14, hy + 18); ctx.lineTo(px - 14, hy + 18); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#8a8e96'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(sx + 2, py + 22, 9, 0, TAU); ctx.stroke(); ctx.fillStyle = '#c8ccd2'; circ(ctx, px, py + 12, 5); ctx.fill();
        ctx.restore();
        // the cord, trembling on a pluck; marks for the four places
        const [ex, ey] = at(1), [ax, ay] = at(0), len = Math.hypot(ex - ax, ey - ay), nx = -(ey - ay) / len, ny = (ex - ax) / len;
        ctx.save(); ctx.lineCap = 'round';
        const path = (amp) => { ctx.beginPath(); for (let k = 0; k <= 28; k++) { const t = k / 28, p = at(t), d = amp * Math.sin(PI * t) * Math.cos(rt.anim * 46 + t * 7) * (1 + 0.4 * Math.sin(t * 22)); if (k) ctx.lineTo(p[0] + nx * d, p[1] + ny * d); else ctx.moveTo(p[0] + nx * d, p[1] + ny * d); } };
        path(fa * 16); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 9; ctx.save(); ctx.translate(5, 6); ctx.stroke(); ctx.restore();
        path(fa * 16); ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 7; ctx.stroke(); path(fa * 16); ctx.strokeStyle = '#e0c690'; ctx.lineWidth = 3; ctx.setLineDash([5, 6]); ctx.stroke(); ctx.setLineDash([]);
        for (const [t, k] of [[0.22, 's0'], [0.42, 's1'], [0.62, 's2'], [0.8, 's3']]) { const [x, y] = at(t), f = fl(k); ctx.fillStyle = f > 0.05 ? '#fff0b0' : '#c8302a'; circ(ctx, x, y, 7 + 3 * f); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; circ(ctx, x, y, 7 + 3 * f); ctx.stroke(); if (f > 0.05) glow(ctx, x, y, 60, '#ffe090', 0.5 * f); }
        ctx.fillStyle = '#3a2a1c'; circ(ctx, cx0, cy0, 11); ctx.fill(); ctx.fillStyle = '#b8bcc4'; circ(ctx, cx0, cy0, 7); ctx.fill();
        ctx.restore();
      } };
  },
});
const WT = [41.2, 49, 55, 61.7];
registerStrikeVoice('gx-washtub-s0', (c) => { c.voice(c.audio, 'pluck', { hz: c.hz, vel: c.vel, dur: 0.9, inst: 'guitarron', preset: { t60: 0.7, bright: 0.2, pos: 0.3, body: [[90, 5, 10], [190, 3, 5]], wet: 0.1 }, hard: 0.5 }); c.evoice(c.audio, 'skin', { hz: Math.max(60, c.hz * 0.8), dur: 0.22, drop: 1.25, modes: [[1, 1, 1], [1.5, 0.3, 0.6]], lp: 600, gain: 0.5, vel: c.vel }); });
for (const k of ['s1', 's2', 's3']) registerStrikeVoice(`gx-washtub-${k}`, (c) => { c.voice(c.audio, 'pluck', { hz: c.hz, vel: c.vel, dur: 0.8, inst: 'guitarron', preset: { t60: 0.6, bright: 0.28, pos: 0.3, body: [[90, 5, 10], [190, 3, 5]], wet: 0.1 }, hard: 0.55 }); c.evoice(c.audio, 'skin', { hz: Math.max(60, c.hz * 0.7), dur: 0.16, drop: 1.2, modes: [[1, 1, 1]], lp: 700, gain: 0.35, vel: c.vel }); });
registerStrikeVoice('gx-washtub-slap', (c) => { c.evoice(c.audio, 'skin', { hz: 150, dur: 0.18, drop: 1.4, modes: [[1, 1, 1], [1.8, 0.5, 0.6], [2.7, 0.3, 0.4]], click: { f: 2400, gain: 0.5 }, lp: 3600, gain: 0.6, vel: c.vel }); c.evoice(c.audio, 'metal', { hz: 420, dur: 0.5, partials: [[1, 1, 1], [2.6, 0.5, 0.6], [4.5, 0.3, 0.4]], gain: 0.07, strike: 0, vel: c.vel }); });
void WT;

// ============================================================ FRICTION DRUM (the lion's roar) ===================================================
registerSynthVoice('growl', (audio, p, o) => {
  const { ac, t } = o, hz = clamp(p.hz, 40, 400), D = clamp(p.dur ?? 0.9, 0.2, 3), g0 = (p.gain ?? 0.5) * Math.pow(clamp(p.vel ?? 0.8, 0.05, 1.2), 1.15);
  const out = ac.createGain(); out.connect(audio.out); if (audio.send) { const w = ac.createGain(); w.gain.value = 0.12; out.connect(w); w.connect(audio.send); }
  const env = ac.createGain(); env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(Math.max(0.0001, g0), t + 0.12); env.gain.setValueAtTime(Math.max(0.0001, g0 * 0.9), t + Math.max(0.15, D - 0.2)); env.gain.exponentialRampToValueAtTime(0.0001, t + D + 0.15);
  const os = ac.createOscillator(); os.type = 'sawtooth'; os.frequency.setValueAtTime(hz * (p.from ?? 0.8), t); os.frequency.exponentialRampToValueAtTime(hz, t + 0.18); os.frequency.linearRampToValueAtTime(hz * (p.to ?? 0.9), t + D);
  const am = ac.createGain(), lf = ac.createOscillator(); lf.type = 'square'; lf.frequency.value = p.rate ?? 24; const lg = ac.createGain(); lg.gain.value = 0.5; am.gain.value = 0.5; lf.connect(lg); lg.connect(am.gain);
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = p.lp ?? 520; lp.Q.value = 2.5;
  os.connect(am); am.connect(lp); lp.connect(env); env.connect(out);
  const n = ac.createBufferSource(); n.buffer = audio.noise(); n.loop = true; const nb = ac.createBiquadFilter(); nb.type = 'bandpass'; nb.frequency.value = hz * 3.2; nb.Q.value = 1.2; const ng = ac.createGain(); ng.gain.value = 0.08; n.connect(nb); nb.connect(ng); ng.connect(env); n.start(t); n.stop(t + D + 0.3);
  os.start(t); os.stop(t + D + 0.3); lf.start(t); lf.stop(t + D + 0.3);
  audio.voices = (audio.voices ?? 0) + 1; let d = false; os.addEventListener('ended', () => { if (!d) { d = true; audio.voices = Math.max(0, (audio.voices ?? 1) - 1); } });
  return null;
});
mkGong('friction', /friction.?drum|lion.?drum|roaring.?drum|rubbing.?drum|namalwa/, {
  wall: { kind: 'plaster', c1: '#9a4a2a', c2: '#d88a4a', seed: 6 }, floor: { kind: 'earth', c1: '#8a5a34' }, rail: '#5a3418', light: '#ffc890', vig: 0.55,
  orn(ctx, A, wallB) {
    // a low sun and the black shapes of acacia trees
    const sx = A.x + A.w * 0.72, sy = A.y + (wallB - A.y) * 0.62, r = Math.min(A.w, wallB - A.y) * 0.13;
    glow(ctx, sx, sy, r * 5, '#ffd890', 0.5); ctx.fillStyle = rgrad(ctx, sx, sy, 0, r, [[0, '#fff2c0'], [1, '#f0a850']]); circ(ctx, sx, sy, r); ctx.fill();
    for (const [fx, sc] of [[0.12, 1], [0.88, 0.78]]) {
      const x = A.x + A.w * fx, y = wallB, h = (wallB - A.y) * 0.54 * sc, w = h * 0.1; ctx.fillStyle = '#26130a';
      ctx.beginPath(); ctx.moveTo(x - w, y); ctx.bezierCurveTo(x - w * 0.5, y - h * 0.4, x - w * 0.9, y - h * 0.7, x - w * 0.2, y - h); ctx.lineTo(x + w * 0.4, y - h); ctx.bezierCurveTo(x + w * 0.6, y - h * 0.7, x + w * 0.4, y - h * 0.4, x + w, y); ctx.closePath(); ctx.fill();
      for (const [dx, dy, rr] of [[-0.05, 0, 0.5], [0.4, 0.08, 0.38], [-0.45, 0.1, 0.34], [0.1, 0.16, 0.3]]) { ctx.beginPath(); ctx.ellipse(x + dx * h, y - h * (1 - dy), h * rr, h * rr * 0.17, 0, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = '#26130a'; ctx.lineWidth = w * 0.5; ctx.beginPath(); ctx.moveTo(x, y - h * 0.78); ctx.lineTo(x + h * 0.32, y - h * 0.92); ctx.moveTo(x, y - h * 0.82); ctx.lineTo(x - h * 0.32, y - h * 0.94); ctx.stroke();
    }
  },
  zones: [['hi', /high|upper|top/], ['lo', /low|lower|deep|growl/], ['skin', /skin|head|tap|top.?hit|boom/], ['shell', /shell|side|body|wood|rim/]],
  voice: null,
  build: (K) => {
    const tall = K.tall, ref = tall ? { w: 700, h: 940 } : { w: 1060, h: 620 }, by = {};
    const cx = tall ? -20 : -110, rx = tall ? 200 : 215, ry = rx * 0.34, topY = tall ? 600 : 368, hgt = tall ? 260 : 190, rodTop = tall ? 70 : 36;
    by.hi = eSpot(cx, lerp(rodTop, topY, 0.26), 46, (topY - rodTop) * 0.18, 0, { apk: 0.9 }); by.lo = eSpot(cx, lerp(rodTop, topY, 0.64), 46, (topY - rodTop) * 0.18, 0, { apk: 0.9 });
    by.skin = eSpot(cx + rx * 0.4, topY + ry * 0.12, rx * 0.5, ry * 0.7, 0, { apk: 0.8 }); by.shell = eSpot(cx, topY + hgt * 0.62 + ry * 0.4, rx * 0.8, hgt * 0.26, 0, { apk: 0.8 });
    return { ref, by, wallU: topY - 40,
      draw(ctx, rt, fl) {
        const fh = fl('hi'), flo = fl('lo'), fsk = fl('skin'), fsh = fl('shell'), fr = Math.max(fh, flo);
        ctx.fillStyle = 'rgba(0,0,0,0.42)'; ell(ctx, cx + 20, topY + hgt + ry * 0.8, rx * 1.12, ry * 0.8); ctx.fill();
        // the shell: a carved wooden barrel with chevron bands and lacing to the skin
        const body = (g) => { g.beginPath(); g.moveTo(cx - rx, topY); g.quadraticCurveTo(cx - rx * 1.1, topY + hgt * 0.5, cx - rx * 0.82, topY + hgt); g.ellipse(cx, topY + hgt, rx * 0.82, ry * 0.82, 0, PI, 0, true); g.quadraticCurveTo(cx + rx * 1.1, topY + hgt * 0.5, cx + rx, topY); g.ellipse(cx, topY, rx, ry, 0, 0, PI); g.closePath(); };
        body(ctx); ctx.fillStyle = hgrad(ctx, cx - rx, cx + rx, [[0, '#3a1c0a'], [0.22, '#b87a3c'], [0.5, '#8a5a28'], [0.82, '#4a2810'], [1, '#2a1406']]); ctx.fill();
        ctx.save(); body(ctx); ctx.clip(); grain(ctx, cx - rx, topY, 2 * rx, hgt + ry, '#2a1406', 0.4, 7, true, 14);
        for (const q of [0.34, 0.66]) { const y = topY + hgt * q; ctx.strokeStyle = 'rgba(30,14,4,0.7)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(cx, y, rx * (1.04 - 0.2 * q), ry * (1 - 0.2 * q), 0, 0.02, PI - 0.02); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(240,214,160,0.75)'; ctx.lineWidth = 4; ctx.beginPath(); for (let k = 0; k <= 16; k++) { const x = cx - rx * 0.96 + (rx * 1.92 * k) / 16, y = topY + hgt * 0.5 + (k % 2 ? 16 : -16) + ry * 0.7 * Math.sin(((k / 16) * PI)) * 0.4; if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke();
        ctx.fillStyle = hgrad(ctx, cx - rx, cx + rx, [[0.14, 'rgba(255,255,255,0)'], [0.24, 'rgba(255,236,200,0.3)'], [0.34, 'rgba(255,255,255,0)']]); ctx.fillRect(cx - rx * 1.2, topY, rx * 2.4, hgt + ry);
        ctx.fillStyle = vgrad(ctx, topY + hgt - 50, topY + hgt + ry, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.45)']]); ctx.fillRect(cx - rx * 1.2, topY + hgt - 50, rx * 2.4, 90); ctx.restore();
        body(ctx); ctx.strokeStyle = rgba('#1a0c04', 0.8); ctx.lineWidth = 2; ctx.stroke();
        if (fsh > 0.05) { glow(ctx, cx, topY + hgt * 0.62, rx * 1.1, '#ffd890', 0.3 * fsh); rings(ctx, cx, topY + hgt * 0.62, rx * 0.8, fsh); }
        // the hide with lacing
        ctx.save(); ctx.translate(cx, topY); ctx.scale(1, ry / rx); ctx.fillStyle = '#6a4222'; circ(ctx, 0, 0, rx + 10); ctx.fill(); skinHead(ctx, rx, rx, { tint: '#d8c090', edge: '#8a6a3a', seed: 11, wear: 0.4, vib: fsk }); ctx.restore();
        for (let k = 0; k < 22; k++) { const a = (k / 22) * PI, x = cx + Math.cos(a) * (rx + 4), y = topY + Math.sin(a) * (ry + 4); ctx.strokeStyle = '#c8b080'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 4, y + 26 + Math.sin(a) * 6); ctx.stroke(); }
        if (fsk > 0.05) { glow(ctx, cx, topY, rx * 1.2, '#fff0c0', 0.25 * fsk); rings(ctx, cx + rx * 0.4, topY, rx * 0.5, fsk); }
        // the rod passes through the middle of the skin, tied with a leather band; a wet cloth slides along it
        const rw = 28, shake = Math.sin(rt.anim * 50) * fr * 2;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(cx - rw / 2 + 8 + shake, rodTop + 8, rw, topY - rodTop); beam(ctx, cx - rw / 2 + shake, rodTop, rw, topY - rodTop + 6, '#c89a58', { vertical: true, round: 8 });
        for (const y of [topY - 26, topY - 12]) { ctx.fillStyle = '#4a2a14'; rrect(ctx, cx - rw / 2 - 4 + shake, y, rw + 8, 9, 3); ctx.fill(); }
        const cl = (f, y0) => { const y = y0 + (1 - Math.min(1, f * 1.3)) * 22 + Math.sin(rt.anim * 28) * f * 18; ctx.fillStyle = f > 0.05 ? '#f4f0e0' : '#d8d2bc'; rrect(ctx, cx - rw / 2 - 7 + shake, y, rw + 14, 54, 8); ctx.fill(); ctx.strokeStyle = 'rgba(80,60,40,0.45)'; ctx.lineWidth = 1.6; for (const q of [14, 28, 42]) { ctx.beginPath(); ctx.moveTo(cx - rw / 2 - 7 + shake, y + q); ctx.lineTo(cx + rw / 2 + 7 + shake, y + q + 2); ctx.stroke(); } ctx.fillStyle = 'rgba(110,170,220,0.5)'; for (let k = 0; k < 3; k++) { circ(ctx, cx - 6 + k * 6 + shake, y + 50 + 4 * k, 2.4); ctx.fill(); } };
        cl(fh, lerp(rodTop, topY, 0.26) - 26); cl(flo, lerp(rodTop, topY, 0.64) - 26);
        if (fr > 0.05) for (let k = 0; k < 3; k++) { const p = clamp(((rt.anim * 2.4 + k * 0.33) % 1), 0, 1); ctx.strokeStyle = `rgba(255,224,170,${0.5 * fr * (1 - p)})`; ctx.lineWidth = 4 - k; ctx.beginPath(); ctx.arc(cx, lerp(rodTop, topY, fh >= flo ? 0.26 : 0.64), 50 + 150 * p, -PI * 0.9, -PI * 0.1); ctx.stroke(); }
      } };
  },
});
registerStrikeVoice('gx-friction-hi', (c) => c.evoice(c.audio, 'growl', { hz: Math.max(60, c.hz), dur: Math.max(0.5, Math.min(1.4, c.dur)), rate: 30, vel: c.vel, from: 0.8, to: 1.04, lp: 700 }));
registerStrikeVoice('gx-friction-lo', (c) => c.evoice(c.audio, 'growl', { hz: Math.max(50, c.hz), dur: Math.max(0.6, Math.min(1.6, c.dur)), rate: 20, vel: c.vel, from: 0.8, to: 0.92, lp: 520 }));
registerStrikeVoice('gx-friction-skin', (c) => c.evoice(c.audio, 'skin', { hz: c.hz, dur: 0.3, drop: 1.35, glide: 0.05, modes: [[1, 1, 1], [1.6, 0.4, 0.6]], click: { f: 900, gain: 0.35 }, lp: 1500, gain: 0.7, vel: c.vel }));
registerStrikeVoice('gx-friction-shell', (c) => c.evoice(c.audio, 'woodtok', { hz: c.hz, dur: 0.12, hollow: 2, overtone: 2.2, gain: 0.7, vel: c.vel }));

// ============================================================ UGLY STICK =======================================================================
mkGong('uglystick', /ugly.?stick|stomp.?stick|bell.?stick|jingle.?stick/, {
  wall: { kind: 'panel', c1: '#d8cdb0', accent: '#b09a70', pw: 120, motif: false }, floor: { kind: 'planks', c1: '#6a4a2a', c2: '#8a6438', ph: 66 }, rail: '#3a2410', light: '#fff0c8', vig: 0.45,
  orn(ctx, A, wallB, rt) { ctx.fillStyle = 'rgba(176,60,40,0.14)'; for (let k = 0; k < A.w / 40; k++) if (k % 2) ctx.fillRect(A.x + k * 40, A.y, 40, wallB - A.y); const x = A.x + A.w * 0.84, y = A.y + (wallB - A.y) * 0.3; ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, A.y); ctx.lineTo(x, y - 10); ctx.stroke(); lamp(ctx, x, y, Math.max(10, A.w * 0.015), rt?.anim ?? 0); },
  zones: [['bells', /bell|jingle|top|ring/], ['caps', /cap|rattle|crown|disc/], ['tin', /tin|can|cup|pan|clang/], ['stomp', /stomp|boot|heel|floor|board|beat|bass/]],
  voice: null,
  build: (K) => {
    const tall = K.tall, ref = tall ? { w: 700, h: 920 } : { w: 1000, h: 600 }, by = {};
    const px = tall ? 0 : -60, top = tall ? 60 : 36, bot = tall ? 760 : 470, S = tall ? 1 : 0.62, yAt = (t) => lerp(top, bot, t);
    // in landscape the whole stick leans across; tall: it stands up. Items hang along the pole
    by.bells = eSpot(px, yAt(0.12), 120 * S + 20, 96 * S + 20, 0, { apk: 0.8 }); by.caps = eSpot(px, yAt(0.36), 180 * S + 30, 64 * S + 16, 0, { apk: 0.8 });
    by.tin = eSpot(px, yAt(0.63), 108 * S + 20, 90 * S + 16, 0, { apk: 0.8 }); by.stomp = eSpot(px, bot + 50 * S, 190 * S + 30, 50 * S + 12, 0, { apk: 0.8 });
    return { ref, by, wallU: bot - 120 * S,
      draw(ctx, rt, fl) {
        const fb = fl('bells'), fc = fl('caps'), ft = fl('tin'), fs = fl('stomp'), t = rt.anim, boardY = bot + 28 * S;
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ell(ctx, px + 14, boardY + 40 * S, 230 * S, 26 * S); ctx.fill();
        // the stomp board
        beam(ctx, px - 200 * S, boardY, 400 * S, 34 * S, '#8a5a2c', { round: 6 }); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(px - 190 * S, boardY + 34 * S, 380 * S, 8 * S);
        const lift = (1 - Math.min(1, fs * 1.4)) * 26 * S * (fs > 0.04 ? 1 : 0.0);
        ctx.save(); ctx.translate(0, -lift);
        // the pole: a long stick painted in spiral stripes
        const pw = 22 * (tall ? 1 : 0.8); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(px - pw / 2 + 10, top + 10, pw, bot - top); ctx.fillStyle = hgrad(ctx, px - pw / 2, px + pw / 2, [[0, '#4a2a14'], [0.3, '#c89a58'], [0.7, '#9a6a34'], [1, '#3a2010']]); ctx.fillRect(px - pw / 2, top, pw, bot - top);
        ctx.save(); ctx.beginPath(); ctx.rect(px - pw / 2, top, pw, bot - top); ctx.clip(); for (let k = -4; k * 34 < bot - top + 40; k++) { ctx.strokeStyle = k % 2 ? '#c8302a' : '#f0e8d0'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(px - pw, top + k * 34 + 10); ctx.lineTo(px + pw, top + k * 34 - 12); ctx.stroke(); } ctx.restore();
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(px - pw / 2 + 3, top, 4, bot - top);
        // bells at the top: a cluster on a hook with ribbons
        const by0 = yAt(0.12); ctx.save(); ctx.translate(px, top + 10); ctx.rotate(Math.sin(t * 34) * fb * 0.14); ctx.translate(-px, -(top + 10));
        for (const [dx, dy, r, col] of [[-44, by0 - top - 36, 22, '#d8aa3c'], [44, by0 - top - 30, 22, '#d8aa3c'], [-20, by0 - top + 18, 26, '#e4b848'], [24, by0 - top + 22, 26, '#c8962c'], [0, by0 - top + 62, 22, '#d8aa3c']]) {
          const x = px + dx * S, y = top + dy * S + 10; hangCord(ctx, px, top + 10, x, y - r * S * 0.6, { w: 3, col: '#e8d6a0' });
          ctx.fillStyle = 'rgba(0,0,0,0.3)'; circ(ctx, x + 6, y + 8, r * S); ctx.fill(); ctx.fillStyle = rgrad(ctx, x - r * S * 0.3, y - r * S * 0.3, 0, r * S * 1.1, [[0, '#fff2c0'], [0.45, col], [1, darker(col, 0.55)]]); circ(ctx, x, y, r * S); ctx.fill(); ctx.strokeStyle = 'rgba(40,20,0,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - r * S * 0.6, y + r * S * 0.35); ctx.quadraticCurveTo(x, y + r * S * 0.55, x + r * S * 0.6, y + r * S * 0.35); ctx.stroke(); }
        for (const [rx2, col] of [[-1, '#c8302a'], [1, '#2a6ab0']]) { ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(px + rx2 * 6, top + 14); ctx.quadraticCurveTo(px + rx2 * 40 * S, top + 70 * S, px + rx2 * (60 + 10 * Math.sin(t * 8)) * S, top + 120 * S); ctx.stroke(); }
        ctx.restore();
        // the slat of flattened bottle caps
        const cy = yAt(0.36); ctx.save(); ctx.translate(px, cy); ctx.rotate(Math.sin(t * 40) * fc * 0.04); ctx.translate(-px, -cy);
        beam(ctx, px - 170 * S, cy - 10 * S, 340 * S, 20 * S, '#8a5a2c', { round: 5 });
        for (let k = 0; k < 7; k++) { const x = px - 150 * S + k * 50 * S, jy = Math.sin(t * 50 + k * 1.7) * fc * 6; ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, cy - 2); ctx.lineTo(x, cy + 30 * S + jy); ctx.stroke(); for (let j = 0; j < 3; j++) { const yy = cy + (8 + j * 9) * S + jy * (0.3 + j * 0.3); ctx.fillStyle = ['#d8302a', '#d8aa2a', '#3a8ad0'][(k + j) % 3]; ctx.beginPath(); ctx.ellipse(x, yy, 16 * S, 5.5 * S, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.4; ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(x, yy + 1.5, 16 * S, 5.5 * S, 0, 0.1, PI - 0.1); ctx.stroke(); } }
        ctx.restore();
        // a tin can and a pie plate nailed to the pole
        const ty = yAt(0.63); ctx.save(); ctx.translate(px, ty); ctx.rotate(Math.sin(t * 36) * ft * 0.05); ctx.translate(-px, -ty);
        const can = (g) => rrect(g, px - 56 * S, ty - 40 * S, 112 * S, 94 * S, 10 * S); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.save(); ctx.translate(10, 12); can(ctx); ctx.fill(); ctx.restore(); can(ctx); ctx.fillStyle = hgrad(ctx, px - 56 * S, px + 56 * S, [[0, '#6a727c'], [0.2, '#e8ecf0'], [0.45, '#b0b8c2'], [0.8, '#8a929c'], [1, '#4a525c']]); ctx.fill();
        ctx.fillStyle = '#c8302a'; ctx.fillRect(px - 56 * S, ty - 8 * S, 112 * S, 30 * S); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(px - 56 * S, ty + 2 * S, 112 * S, 6 * S);
        ctx.strokeStyle = 'rgba(40,50,64,0.5)'; ctx.lineWidth = 2.4; for (const q of [-30, 38]) { ctx.beginPath(); ctx.moveTo(px - 56 * S, ty + q * S); ctx.lineTo(px + 56 * S, ty + q * S); ctx.stroke(); } can(ctx); ctx.strokeStyle = 'rgba(30,38,50,0.7)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
        // the boot heel: a black rubber sole on the foot of the stick
        ctx.fillStyle = '#16120e'; ctx.beginPath(); ctx.moveTo(px - 28 * S, bot - 20 * S); ctx.lineTo(px + 28 * S, bot - 20 * S); ctx.lineTo(px + 56 * S, boardY); ctx.lineTo(px - 56 * S, boardY); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(px - 20 * S, bot - 18 * S, 6 * S, boardY - bot + 18 * S);
        ctx.restore();
        if (fs > 0.05) { glow(ctx, px, boardY, 190 * S, '#ffd890', 0.3 * fs); rings(ctx, px, boardY + 6, 120 * S, fs); }
        if (fb > 0.05) glow(ctx, px, yAt(0.12), 150 * S, '#ffd890', 0.25 * fb);
        if (fc > 0.05) glow(ctx, px, yAt(0.36), 200 * S, '#ffd890', 0.2 * fc);
        if (ft > 0.05) { glow(ctx, px, yAt(0.63), 130 * S, '#e0f0ff', 0.25 * ft); rings(ctx, px, yAt(0.63), 80 * S, ft); }
      } };
  },
});
registerStrikeVoice('gx-uglystick-bells', (c) => c.evoice(c.audio, 'jingle', { n: 9, f: 3600, spread: 0.14, dur: 0.3, gain: 0.22, vel: c.vel, wet: 0.14 }));
registerStrikeVoice('gx-uglystick-caps', (c) => c.evoice(c.audio, 'jingle', { n: 12, f: 5400, spread: 0.12, dur: 0.14, gain: 0.2, vel: c.vel, wet: 0.08 }));
registerStrikeVoice('gx-uglystick-tin', (c) => c.evoice(c.audio, 'metal', { hz: c.hz, dur: 0.5, partials: [[1, 1, 1], [2.3, 0.6, 0.6], [3.8, 0.4, 0.4], [5.6, 0.25, 0.3]], gain: 0.32, strike: 0.6, vel: c.vel }));
registerStrikeVoice('gx-uglystick-stomp', (c) => { c.evoice(c.audio, 'foot', { hz: c.hz, floor: 'wood', shoe: 'hard', gain: 1.0, dur: 0.2, vel: c.vel }); c.evoice(c.audio, 'jingle', { n: 6, f: 4200, spread: 0.1, dur: 0.2, gain: 0.12, vel: c.vel, delay: 0.01 }); });
void mix; void eRing; void rSpot; void vgrad; void lighter;

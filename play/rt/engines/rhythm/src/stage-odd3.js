// Odd instruments III (1.21.0): the rainstick (a long cactus tube lying on two cradles, its inside shown through a cut window with seeds trickling down past the
// spines). Own picture, room and voice (`rainfall` recipe). No performer and no hands: the tube rocks and the seeds run faster when it is played.
import { eSpot } from './drum-kit.js';
import { mkGong } from './stage-gongs.js';
import { registerStrikeVoice, registerSynthVoice } from './voice-registry.js';
import { clamp, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU, PI, lerp, glow, beam, rings } from './gong-kit.js';

// rainfall: sparse bursts of filtered noise like drops on leaves, thinning out toward the end. p: dur, density (bursts per s), f (band centre), q, gain
registerSynthVoice('rainfall', (audio, p, o) => {
  const { ac, t } = o, D = clamp(p.dur ?? 1.5, 0.2, 4), n = Math.round(clamp((p.density ?? 60) * D, 4, 160)), g0 = (p.gain ?? 0.16) * Math.pow(clamp(p.vel ?? 0.8, 0.05, 1.2), 1.1);
  const out = ac.createGain(); out.connect(audio.out); if (audio.send) { const w = ac.createGain(); w.gain.value = 0.16; out.connect(w); w.connect(audio.send); }
  let first = null;
  for (let k = 0; k < n; k++) {
    const u = k / n, tt = t + D * Math.pow(hash2(k * 1.7), 0.9) * 0.98, a = g0 * (1 - 0.8 * (tt - t) / D) * (0.5 + 0.7 * hash2(k * 3.3 + 1)), f = (p.f ?? 4200) * (0.6 + 0.9 * hash2(k * 2.1 + 5));
    const src = ac.createBufferSource(); src.buffer = audio.noise(); src.loop = true; src.start(tt, (k * 0.37) % 1.6); src.stop(tt + 0.05);
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = clamp(f, 500, 12000); bp.Q.value = p.q ?? 2.2; const eg = ac.createGain();
    eg.gain.setValueAtTime(0.0001, tt); eg.gain.linearRampToValueAtTime(Math.max(0.0001, a), tt + 0.002); eg.gain.exponentialRampToValueAtTime(0.0001, tt + (p.tail ?? 0.03));
    src.connect(bp); bp.connect(eg); eg.connect(out); if (!first) first = src; void u;
  }
  if (first) { audio.voices = (audio.voices ?? 0) + 1; let d = false; first.addEventListener('ended', () => { if (!d) { d = true; audio.voices = Math.max(0, (audio.voices ?? 1) - 1); } }); }
  return null;
});
function hash2(n) { const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); }

mkGong('rainstick', /rain.?stick|rain.?tube|rain.?shaker/, {
  voice: null,
  wall: { kind: 'plaster', c1: '#6a4a3a', c2: '#8a5a44', seed: 9 }, floor: { kind: 'earth', c1: '#7a5a3a' }, rail: '#3a2416', light: '#ffd8a0', vig: 0.55,
  orn(ctx, A, wallB) {
    // a far line of hills under a warm sky, and a hanging woven band
    const g = vgrad(ctx, A.y, wallB, [[0, '#d89a6a'], [0.6, '#e8c08a'], [1, '#a8704a']]); ctx.fillStyle = g; ctx.fillRect(A.x, A.y, A.w, wallB - A.y);
    for (const [c, off, amp] of [['#9a6a4a', 0.62, 0.08], ['#7a4a34', 0.74, 0.1], ['#5a3424', 0.86, 0.07]]) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(A.x, wallB); for (let k = 0; k <= 24; k++) { const x = A.x + A.w * k / 24, y = A.y + (wallB - A.y) * (off + amp * Math.sin(k * 0.7 + off * 9) + amp * 0.5 * Math.sin(k * 1.9)); ctx.lineTo(x, y); } ctx.lineTo(A.x + A.w, wallB); ctx.closePath(); ctx.fill(); }
    const sx = A.x + A.w * 0.8, sy = A.y + (wallB - A.y) * 0.3, r = Math.min(A.w, wallB - A.y) * 0.08; glow(ctx, sx, sy, r * 6, '#fff0c0', 0.4); ctx.fillStyle = '#fff4d0'; circ(ctx, sx, sy, r); ctx.fill();
  },
  zones: [['tap', /tap|knock|cap|thud/], ['drops', /drop|last|end|tick|trickle/], ['heavy', /heavy|storm|cascade|downpour|big/], ['soft', /soft|light|slow|rain|mist|tilt/]],
  build: (K) => {
    const tall = K.tall, ref = tall ? { w: 720, h: 900 } : { w: 1100, h: 560 }, by = {}, ang = tall ? 1.18 : -0.3, len = tall ? 800 : 920, th = tall ? 100 : 92, cx = 0, cy = tall ? 450 : 290;
    const P = (u, v) => [cx + Math.cos(ang) * u - Math.sin(ang) * v, cy + Math.sin(ang) * u + Math.cos(ang) * v];   // tube space (along, across) to design space
    const [dx, dy] = P(-len * 0.3, 0), [hx, hy] = P(0, 0), [ex, ey] = P(len * 0.36, 0);
    const [tx, ty] = P(-len * 0.5 + 16, 0); by.tap = eSpot(tx, ty, th * 0.5, th * 0.65, ang, { apk: 0.9 }); by.soft = eSpot(dx + Math.cos(ang) * 40, dy + Math.sin(ang) * 40, th * 0.9, th * 1.1, ang, { apk: 0.9 }); by.heavy = eSpot(hx, hy, th * 0.9, th * 1.1, ang, { apk: 0.9 }); by.drops = eSpot(ex, ey, th * 0.8, th * 1.0, ang, { apk: 0.9 });
    return { ref, by, wallU: tall ? 560 : 340,
      draw(ctx, rt, fl) {
        const fs = fl('soft'), fh = fl('heavy'), fd = fl('drops'), ftp = fl('tap'), fa = Math.max(fs, fh, fd, ftp * 0.6), t = rt.anim, rock = Math.sin(t * 9) * fa * 0.03;
        // two carved cradles
        for (const u of [-len * 0.3, len * 0.3]) { const [x, y] = P(u, 0), fy = y + th * 1.7; ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, x + 14, fy + 38, 76, 16); ctx.fill(); beam(ctx, x - 14, y + th * 0.5, 28, fy - y - th * 0.5 + 36, '#5a3a20', { vertical: true, round: 8 }); beam(ctx, x - 56, fy + 20, 112, 24, '#4a2e18', { round: 8 }); ctx.fillStyle = '#6a4424'; ctx.beginPath(); ctx.moveTo(x - 58, y + th * 0.3); ctx.quadraticCurveTo(x, y + th * 0.95, x + 58, y + th * 0.3); ctx.lineTo(x + 40, y + th * 0.3); ctx.quadraticCurveTo(x, y + th * 0.62, x - 40, y + th * 0.3); ctx.closePath(); ctx.fill(); }
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang + rock); ctx.translate(-cx, -cy);
        const x0 = cx - len / 2, y0 = cy - th / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.38)'; rrect(ctx, x0 + 12, y0 + 18, len, th, th * 0.3); ctx.fill();
        // the cactus tube
        const tube = (g) => rrect(g, x0, y0, len, th, th * 0.26); tube(ctx); ctx.fillStyle = vgrad(ctx, y0, y0 + th, [[0, '#d8bc7c'], [0.3, '#b8944c'], [0.7, '#7a5a2c'], [1, '#3e2a14']]); ctx.fill();
        ctx.save(); tube(ctx); ctx.clip(); grain(ctx, x0, y0, len, th, '#3a2610', 0.45, 5, false, 12);
        // spirals of spines: short dark dashes in helical rows
        for (let r = 0; r < 5; r++) for (let k = 0; k < 64; k++) { const x = x0 + 20 + (len - 40) * (k / 63), phase = (k * 0.55 + r * 1.26) % TAU, y = y0 + th * (0.5 + 0.46 * Math.sin(phase)), vis = Math.cos(phase); if (vis < 0) continue; ctx.strokeStyle = `rgba(250,240,210,${0.5 * vis + 0.1})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 4, y + (y < y0 + th / 2 ? -5 : 5)); ctx.stroke(); }
        // painted bands near both ends: triangles in ochre, white and black
        for (const side of [0, 1]) for (let k = 0; k < 2; k++) { const bx = side ? x0 + len - 112 + k * 44 : x0 + 20 + k * 44; ctx.fillStyle = k ? '#f0e4c8' : '#2a1408'; ctx.fillRect(bx, y0, 22, th); for (let j = 0; j < 5; j++) { ctx.fillStyle = k ? '#2a1408' : '#e0a040'; ctx.beginPath(); ctx.moveTo(bx, y0 + j * th / 5); ctx.lineTo(bx + 22, y0 + (j + 0.5) * th / 5); ctx.lineTo(bx, y0 + (j + 1) * th / 5); ctx.closePath(); ctx.fill(); } }
        ctx.fillStyle = hgrad(ctx, x0, x0 + len, [[0, 'rgba(0,0,0,0.25)'], [0.1, 'rgba(0,0,0,0)'], [0.9, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.3)']]); ctx.fillRect(x0, y0, len, th);
        ctx.fillStyle = 'rgba(255,248,224,0.26)'; ctx.fillRect(x0, y0 + th * 0.1, len, th * 0.1);
        ctx.restore(); tube(ctx); ctx.strokeStyle = rgba('#2a1608', 0.8); ctx.lineWidth = 2.4; ctx.stroke();
        // the cut window: the inside with spines and trickling seeds
        const wx = x0 + len * 0.26, ww = len * 0.48, wy = y0 + th * 0.18, wh = th * 0.64; ctx.fillStyle = '#140a04'; rrect(ctx, wx, wy, ww, wh, 14); ctx.fill();
        ctx.save(); rrect(ctx, wx, wy, ww, wh, 14); ctx.clip(); ctx.fillStyle = vgrad(ctx, wy, wy + wh, [[0, '#3a2412'], [1, '#0c0602']]); ctx.fillRect(wx, wy, ww, wh);
        ctx.strokeStyle = 'rgba(230,210,160,0.55)'; ctx.lineWidth = 2; for (let k = 0; k < 34; k++) { const x = wx + ww * (k / 33), a = (k % 2 ? 1 : -1); ctx.beginPath(); ctx.moveTo(x, wy + (k % 2 ? 2 : wh - 2)); ctx.lineTo(x + 12 * a * 0 + 14, wy + wh * (k % 2 ? 0.45 : 0.55)); ctx.stroke(); }
        const speed = 0.4 + 2.8 * fa; for (let k = 0; k < 46; k++) { const ph = (hash2(k * 1.3) + t * speed * (0.4 + 0.6 * hash2(k + 3))) % 1, x = wx + ww * (1 - ph) * 0.96 + 6, y = wy + wh * (0.15 + 0.7 * hash2(k * 5.1)) + Math.sin(t * 30 + k) * 2 * fa; ctx.fillStyle = ['#e8d8a8', '#c88a4a', '#f0c8a0', '#8a5a30'][k % 4]; ell(ctx, x, y, 3.4, 2.4); ctx.fill(); }
        ctx.restore(); ctx.strokeStyle = '#4a2c14'; ctx.lineWidth = 7; rrect(ctx, wx, wy, ww, wh, 14); ctx.stroke(); ctx.strokeStyle = 'rgba(255,230,180,0.4)'; ctx.lineWidth = 2; rrect(ctx, wx + 3, wy + 3, ww - 6, wh - 6, 12); ctx.stroke();
        // leather end caps with a stitched seam
        for (const sx of [x0 - 6, x0 + len - 26]) { ctx.fillStyle = hgrad(ctx, sx, sx + 32, [[0, '#2a1608'], [0.4, '#8a5a30'], [1, '#2a1608']]); rrect(ctx, sx, y0 - 4, 32, th + 8, 10); ctx.fill(); ctx.strokeStyle = 'rgba(240,210,150,0.6)'; ctx.lineWidth = 1.6; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(sx + 16, y0); ctx.lineTo(sx + 16, y0 + th); ctx.stroke(); ctx.setLineDash([]); }
        ctx.restore();
        for (const [f, k] of [[fs, 'soft'], [fh, 'heavy'], [fd, 'drops'], [ftp, 'tap']]) if (f > 0.05) { const sp = by[k]; glow(ctx, sp.v, sp.u, th * 1.3, '#ffe0a0', 0.28 * f); rings(ctx, sp.v, sp.u, th * 0.7, f); }
      } };
  },
});
registerStrikeVoice('gx-rainstick-soft', (c) => c.evoice(c.audio, 'rainfall', { dur: 2.2, density: 70, f: 4200, q: 2, gain: 0.5, tail: 0.04, vel: c.vel }));
registerStrikeVoice('gx-rainstick-heavy', (c) => c.evoice(c.audio, 'rainfall', { dur: 1.3, density: 120, f: 3200, q: 1.6, gain: 0.7, tail: 0.035, vel: c.vel }));
registerStrikeVoice('gx-rainstick-drops', (c) => c.evoice(c.audio, 'rainfall', { dur: 0.7, density: 16, f: 5600, q: 3, gain: 0.9, tail: 0.05, vel: c.vel }));
registerStrikeVoice('gx-rainstick-tap', (c) => c.evoice(c.audio, 'skin', { hz: 190, dur: 0.18, drop: 1.3, modes: [[1, 1, 1], [1.7, 0.4, 0.5]], click: { f: 1500, gain: 0.4 }, lp: 1800, gain: 0.55, vel: c.vel }));

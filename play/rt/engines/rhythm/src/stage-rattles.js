// Shaken idiophones (1.19.0): maracas, the kashaka (two gourds on a cord), the nyo basket rattle, the cog rattle (ratchet) and the opa tube gourd.
// Each is drawn as the play surface with its own body, decoration and motion; no performer and no hands are drawn. A lane is a zone of the
// instrument (a gourd, the base, the wheel, an opening); lane names pick the zone, otherwise lanes take the zones from low to high pitch.
import { registerDrumStage } from './registry.js';
import { createDrumStage, eSpot, eRing, assignZones, dropShadow } from './drum-kit.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU, glow, lerp, zoneFlash, solid, metalFill, ball, cord, quad, grains, weave, paintBand, handle } from './rattle-kit.js';

export function mkRattle(id, match, { dress, zones, build }) {
  registerDrumStage({ id, match, build: (S, lanes, P) => {
    const zoneOf = [];
    return createDrumStage(id, S, lanes, P, {
      dress, heroClean: true, voiceOf: (i) => `${id}-${zoneOf[i] ?? zones[0][0]}`,
      build: (K) => {
        const keyOf = assignZones(K, zones.map(([key, re]) => ({ key, re })));
        for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
        const sc = build(K, keyOf);
        const spots = new Array(K.N).fill(null);
        for (let i = 0; i < K.N; i++) spots[i] = sc.by[keyOf[i]] ?? null;
        return { ref: sc.ref, view: sc.view, spots, draw: (ctx, rt, G) => sc.draw(ctx, rt, (...keys) => zoneFlash(K, keyOf, rt, ...keys), G), front: sc.front };
      },
    });
  } });
}

// ============================================================ MARACAS ======================================================
mkRattle('maracas', /maraca/, {
  dress: () => ({ kind: 'planks', base: '#2a1c14', rugKind: 'diamond', rugBase: '#1c4a52', rugA: '#f0c060', rugB: '#a8322a', light: '#ffe6b0' }),
  zones: [['left', /left|izq|l\b/], ['right', /right|der|r\b/], ['both', /both|pair|roll|double|dos/]],
  build: (K) => {
    const tall = K.tall, ref = tall ? { w: 540, h: 600 } : { w: 780, h: 470 };
    const gry = tall ? 138 : 118, grx = tall ? 112 : 96, hl = tall ? 200 : 150, lean = tall ? 0.21 : 0.3;
    const px = tall ? 46 : 110, py = ref.h - (tall ? 42 : 36);
    const tip = (sx) => { const a = sx * lean, d = hl + gry; return [sx * px + Math.sin(a) * d, py - Math.cos(a) * d]; };
    const by = {};
    for (const [key, sx] of [['left', -1], ['right', 1]]) { const [x, y] = tip(sx); by[key] = eSpot(x, y, grx * 1.02, gry * 1.02, sx * lean, { apk: 0.78 }); }
    by.both = eSpot(0, py - hl * 0.5, tall ? 130 : 150, tall ? 62 : 52, 0, { apk: 0.9 });
    const PAINT = { left: { base: '#e48a2a', band: 'dots', c1: '#1c1008', c2: '#f6e0a0' }, right: { base: '#b02a2a', band: 'zig', c1: '#f4e6c0', c2: '#f0b84a' } };
    return { ref, by,
      draw(ctx, rt, fl) {
        const both = fl('both');
        for (const [key, sx] of [['left', -1], ['right', 1]]) {
          const f = Math.max(fl(key), both * 0.9), sw = Math.sin(rt.anim * 42 + (sx > 0 ? 1.3 : 0)) * f * 0.2;
          const a = sx * lean + sw, p = PAINT[key];
          ctx.save(); ctx.translate(sx * px, py); ctx.rotate(a);
          handle(ctx, 0, 0, -Math.PI / 2, hl + 10, tall ? 34 : 28, '#d6a560', { ring: [0.3, 0.55, 0.8], seed: 4 + sx });
          ctx.fillStyle = darker('#d6a560', 0.5); circ(ctx, 0, 0, tall ? 22 : 18); ctx.fill();   // the knob at the end of the handle
          ctx.fillStyle = lighter('#d6a560', 0.3); circ(ctx, -4, -5, tall ? 9 : 7); ctx.fill();
          const cy = -(hl + gry * 0.88);
          const egg = (g) => { g.beginPath(); for (let k = 0; k <= 60; k++) { const t = (k / 60) * TAU, s = Math.sin(t), c = Math.cos(t), w = 1 + 0.07 * s; g.lineTo(c * grx * w, cy + s * gry); } g.closePath(); };
          dropShadow(ctx, egg, 14, 18, 0.4);
          solid(ctx, egg, 0, cy, grx, gry, p.base, { dark: 0.6, light: 0.5, speck: 0.5, seed: 11 + sx });
          ctx.save(); egg(ctx); ctx.clip();
          const bandH = gry * 0.34;
          for (const q of [-0.46, 0.38]) { ctx.fillStyle = rgba(darker(p.base, 0.55), 0.35); ctx.fillRect(-grx, cy + gry * q - bandH * 0.5, 2 * grx, bandH); paintBand(ctx, p.band, -grx * 1.1, grx * 1.1, cy + gry * q, bandH, p.c1, p.c2); }
          ctx.strokeStyle = rgba(p.c2, 0.9); ctx.lineWidth = 5; for (const q of [-0.78, 0.0, 0.8]) { ctx.beginPath(); for (let k = 0; k <= 24; k++) { const t = k / 24, x = -grx * 1.1 + 2.2 * grx * t; if (k) ctx.lineTo(x, cy + gry * (q + 0.04 * Math.sin(t * 9))); else ctx.moveTo(x, cy + gry * (q + 0.04 * Math.sin(0))); } ctx.stroke(); }
          ctx.fillStyle = rgrad(ctx, -grx * 0.34, cy - gry * 0.4, 0, grx * 0.9, [[0, 'rgba(255,255,236,0.5)'], [1, 'rgba(255,255,236,0)']]); ctx.fillRect(-grx, cy - gry, 2 * grx, 2 * gry);
          ctx.restore();
          // collar where the gourd meets the handle
          ctx.fillStyle = vgrad(ctx, cy + gry * 0.84, cy + gry * 1.0, [[0, lighter('#5a3a1a', 0.2)], [1, darker('#3a2210', 0.2)]]); ell(ctx, 0, cy + gry * 0.93, grx * 0.3, gry * 0.075); ctx.fill();
          if (f > 0.05) grains(ctx, 0, cy, grx * 1.5, f, rt.anim, { n: 11, r: 4.5, col: '#f6e6b0' });
          ctx.restore();
        }
      } };
  },
});

// ============================================================ KASHAKA ======================================================
// two small gourds joined by a cord: one is held, the other is spun round the hand
mkRattle('kashaka', /kashaka/, {
  dress: () => ({ kind: 'cloth', base: '#1c4a4c', accent: '#f0c868', rugKind: 'diamond', rugBase: '#8a2a22', rugA: '#f0c868', rugB: '#1c4a4c', light: '#ffe2b0' }),
  zones: [['held', /held|hold|hand|grip|beat|tap/], ['spin', /spin|swing|whirl|orbit|round/], ['catch', /catch|snap|cord|string|stop/]],
  build: (K) => {
    const tall = K.tall, ref = tall ? { w: 700, h: 700 } : { w: 940, h: 500 };
    const hx = 0, hy = tall ? 380 : 262, R = tall ? 232 : 186, gr = tall ? 104 : 90;
    const by = {};
    by.held = eSpot(hx, hy, gr * 1.1, gr * 1.35, 0, { apk: 0.8 });
    by.spin = eRing(hx, hy, R * 1.12, R * 1.12, 0, 0.74, 1.26, -Math.PI * 0.62, {});
    by.catch = eSpot(hx + R * 0.8, hy + R * 0.12, tall ? 60 : 52, tall ? 60 : 52, 0, { apk: 0.9 });
    let ang = -Math.PI * 0.62, vel = 0, last = 0;
    return { ref, by,
      draw(ctx, rt, fl) {
        const sp = fl('spin'), ht = fl('held'), ct = fl('catch');
        const dt = clamp(rt.anim - last, 0, 0.1); last = rt.anim; vel += (sp * 9 - vel * 2.4 + 0.3) * dt * 3.2; vel = clamp(vel, 0.3, 11); ang += vel * dt * (1 - ct * 0.6);
        const sx = hx + Math.cos(ang) * R, sy = hy + Math.sin(ang) * R * 0.98;
        // the orbit it travels on: a faint worn ring in the dust, and a fan of motion where it speeds up
        ctx.strokeStyle = 'rgba(255,236,190,0.28)'; ctx.lineWidth = 6; ctx.setLineDash([2, 14]); ctx.lineCap = 'round'; circ(ctx, hx, hy, R); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = rgba('#fff0c0', 0.1 + 0.25 * clamp(vel / 6, 0, 1)); ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(hx, hy, R, ang - 1.2 - vel * 0.06, ang); ctx.stroke();
        for (let k = 1; k <= 9; k++) { const a2 = ang - k * 0.09 * (0.4 + vel / 8), al = (0.2 * (1 - k / 10)) * clamp(vel / 5, 0, 1); ctx.fillStyle = rgba('#f0d6a0', al); circ(ctx, hx + Math.cos(a2) * R, hy + Math.sin(a2) * R * 0.98, gr * (1 - k * 0.05)); ctx.fill(); }
        // the cord from the held gourd's neck to the spinning one
        const nx = hx, ny = hy - gr * 1.05;
        cord(ctx, nx, ny, sx, sy, 0, tall ? 9 : 8, '#e8d098');
        const gourd = (x, y, r, rot, hotA, seed) => {
          ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
          // a small bottle gourd: a round belly, a short neck, a burnt band of triangles and a binding of fibre at the neck
          const body = (g) => { g.beginPath(); for (let k = 0; k <= 60; k++) { const t = (k / 60) * TAU, c = Math.cos(t), s = Math.sin(t), neck = s < -0.1 ? 1 - 0.46 * Math.pow(Math.min(1, (-s - 0.1) / 0.9), 1.3) : 1; g.lineTo(c * r * neck, s * r * 1.14); } g.closePath(); };
          dropShadow(ctx, body, 10, 14, 0.4);
          solid(ctx, body, 0, r * 0.1, r, r * 1.14, seed ? '#d4a04a' : '#c58a36', { speck: 0.7, seed: 17 + seed, dark: 0.66, spec: 0.7 });
          ctx.save(); body(ctx); ctx.clip();
          ctx.strokeStyle = rgba('#3a1a08', 0.5); ctx.lineWidth = 3; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(0, r * 0.1, r * 0.22 * Math.abs(k) + 2, r * 1.14, 0, 0, TAU); ctx.stroke(); }
          ctx.fillStyle = rgba('#2a1004', 0.35); ctx.fillRect(-r, r * 0.12, 2 * r, r * 0.38); paintBand(ctx, 'tri', -r, r, r * 0.31, r * 0.34, '#3a1808', '#f0d79a'); paintBand(ctx, 'zig', -r, r, -r * 0.1, r * 0.22, '#3a1808');
          ctx.restore();
          for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? '#c4a468' : '#e0c48a'; rrect(ctx, -r * 0.24, -r * 1.14 + k * r * 0.07, r * 0.48, r * 0.075, 3); ctx.fill(); }
          ctx.fillStyle = vgrad(ctx, -r * 1.32, -r * 1.06, [[0, '#8a6a34'], [1, '#3a2410']]); rrect(ctx, -r * 0.2, -r * 1.34, r * 0.4, r * 0.24, 6); ctx.fill();
          if (hotA > 0.05) { glow(ctx, 0, 0, r * 2.2, '#ffe6a0', 0.45 * hotA); grains(ctx, 0, 0, r * 1.7, hotA, rt.anim, { n: 8, r: 3.6 }); }
          ctx.restore();
        };
        gourd(hx, hy, gr, Math.sin(rt.anim * 40) * ht * 0.2, ht, 0);
        gourd(sx, sy, gr * 0.88, ang + Math.PI / 2 + 0.3, Math.max(sp, ct), 1);
        // a small wooden peg where the cord is looped round the finger of the held gourd
        ctx.fillStyle = '#7a5a30'; ell(ctx, nx, ny, 9, 6); ctx.fill();
      } };
  },
});

// ============================================================ NYO BASKET RATTLE ============================================
mkRattle('nyo', /\bny[oọ]\b|nyọ|ishaka|basket.?rattle|osha\b/, {
  dress: () => ({ kind: 'earth', base: '#5e3e24', rugKind: 'stripes', rugBase: '#1e2a2a', rugA: '#e2b04a', rugB: '#a8392a', light: '#ffe0a8' }),
  zones: [['strike', /strike|base|bottom|knock|calabash|beat|thump/], ['tick', /tick|rim|tap|click|edge|clack/], ['shake', /shake|rattle|basket|top|swish/]],
  build: (K) => {
    const tall = K.tall, ref = tall ? { w: 540, h: 660 } : { w: 760, h: 500 };
    const cx = 0, cy = ref.h * (tall ? 0.52 : 0.5), R = tall ? 236 : 200;
    const by = {};
    by.shake = eSpot(cx, cy - R * 0.6, R * 0.66, R * 0.36, 0, { apk: 0.9 });
    by.tick = eSpot(cx, cy - R * 0.02, R * 0.82, R * 0.1, 0, { apk: 0.9 });
    by.strike = eSpot(cx, cy + R * 0.6, R * 0.6, R * 0.32, 0, { apk: 0.9 });
    return { ref, by,
      draw(ctx, rt, fl) {
        const sh = fl('shake'), st = fl('strike'), tk = fl('tick');
        const jig = Math.sin(rt.anim * 44) * sh * 5, jig2 = Math.cos(rt.anim * 38) * sh * 3;
        // calabash bowl: the lower half of a round gourd, burnt with a band of patterns
        const bowl = (g) => { g.beginPath(); g.moveTo(cx - R, cy); g.bezierCurveTo(cx - R, cy + R * 1.12, cx + R, cy + R * 1.12, cx + R, cy); g.closePath(); };
        dropShadow(ctx, bowl, 18, 24, 0.42);
        solid(ctx, bowl, cx, cy + R * 0.3, R, R * 0.8, '#b97a34', { speck: 0.55, seed: 21, dark: 0.66 });
        ctx.save(); bowl(ctx); ctx.clip();
        ctx.strokeStyle = 'rgba(40,16,4,0.7)'; ctx.lineWidth = 4;
        for (let b = 0; b < 3; b++) { ctx.beginPath(); for (let k = 0; k <= 36; k++) { const t = k / 36, x = cx - R + 2 * R * t, yb = cy + R * (0.22 + 0.2 * b) + (b % 2 ? 1 : -1) * 7 * Math.sin(t * 24); if (k) ctx.lineTo(x, yb); else ctx.moveTo(x, yb); } ctx.stroke(); }
        for (let k = 0; k < 12; k++) { const x = cx - R * 0.82 + k * R * 0.15; ctx.fillStyle = 'rgba(40,16,4,0.6)'; ctx.beginPath(); ctx.moveTo(x, cy + R * 0.48); ctx.lineTo(x + R * 0.07, cy + R * 0.58); ctx.lineTo(x - R * 0.07, cy + R * 0.58); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle = rgrad(ctx, cx, cy + R * 0.95, 0, R * 0.7, [[0, `rgba(255,240,200,${0.1 + 0.4 * st})`], [1, 'rgba(255,240,200,0)']]); ctx.fillRect(cx - R, cy, 2 * R, R * 1.2);
        ctx.restore();
        // the woven dome sits on the bowl: coiled strands in black, natural and red, shaking a little
        ctx.save(); ctx.translate(jig, jig2);
        const dome = (g) => { g.beginPath(); g.moveTo(cx - R * 0.96, cy + 4); g.bezierCurveTo(cx - R * 0.98, cy - R * 0.86, cx - R * 0.4, cy - R * 1.04, cx, cy - R * 1.04); g.bezierCurveTo(cx + R * 0.4, cy - R * 1.04, cx + R * 0.98, cy - R * 0.86, cx + R * 0.96, cy + 4); g.closePath(); };
        dropShadow(ctx, dome, 12, 16, 0.36);
        dome(ctx); ctx.fillStyle = '#2a1a0c'; ctx.fill();
        ctx.save(); dome(ctx); ctx.clip();
        weave(ctx, cx - R, cy - R * 1.1, 2 * R, R * 1.2, '#e8cc8a', '#b8903e', R * 0.07, { band: (i, j) => { const r = Math.floor(j / 3) % 4; return r === 1 ? ((i + j) % 2 ? '#1c1208' : '#2a1a0c') : r === 3 ? ((i + j) % 2 ? '#b02e22' : '#8a2218') : null; } });
        ctx.fillStyle = rgrad(ctx, cx - R * 0.34, cy - R * 0.62, 0, R * 1.0, [[0, 'rgba(255,248,220,0.34)'], [0.6, 'rgba(255,248,220,0)'], [1, 'rgba(0,0,0,0.34)']]); ctx.fillRect(cx - R, cy - R * 1.1, 2 * R, R * 1.2);
        ctx.restore();
        ctx.strokeStyle = 'rgba(20,10,2,0.6)'; ctx.lineWidth = 3; dome(ctx); ctx.stroke();
        // plaited fibre loop on top and the knot that ties it
        ctx.strokeStyle = '#d2b070'; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(cx - R * 0.14, cy - R * 1.0); ctx.bezierCurveTo(cx - R * 0.2, cy - R * 1.32, cx + R * 0.2, cy - R * 1.32, cx + R * 0.14, cy - R * 1.0); ctx.stroke();
        ctx.strokeStyle = '#7a5a2a'; ctx.lineWidth = 3; ctx.setLineDash([5, 6]); ctx.stroke(); ctx.setLineDash([]);
        if (sh > 0.05) grains(ctx, cx, cy - R * 0.5, R * 1.1, sh, rt.anim, { n: 14, r: 4.5, col: '#f2e2b0' });
        ctx.restore();
        // the rim: a fibre-bound ring where dome and bowl meet
        ctx.fillStyle = vgrad(ctx, cy - 10, cy + 12, [[0, '#d8bc7e'], [1, '#6a4a22']]); rrect(ctx, cx - R * 0.99, cy - 8, R * 1.98, 20, 10); ctx.fill();
        ctx.strokeStyle = rgba('#2a1608', 0.55); ctx.lineWidth = 2; for (let x = cx - R * 0.97; x < cx + R * 0.97; x += 11) { ctx.beginPath(); ctx.moveTo(x, cy - 7); ctx.lineTo(x + 6, cy + 10); ctx.stroke(); }
        if (tk > 0.05) { ctx.strokeStyle = rgba('#fff2c8', 0.6 * tk); ctx.lineWidth = 3; rrect(ctx, cx - R * 0.99, cy - 8, R * 1.98, 20, 10); ctx.stroke(); }
      } };
  },
});

// ============================================================ COG RATTLE (ratchet) ========================================
mkRattle('cograttle', /kakradaa|cog.?rattle|ratchet|football.?rattle/, {
  dress: () => ({ kind: 'planks', base: '#3a2a1e', rugKind: 'kente', rugBase: '#2a1c12', rugA: '#e0a83a', rugB: '#b0382a', light: '#ffe0a8' }),
  zones: [['tongue', /tongue|click|tick|blade|tap/], ['wheel', /wheel|whirl|spin|rasp|cog|turn/], ['handle', /handle|grip|swing|shake|axle/]],
  build: (K) => {
    // the rattle is designed standing up (wheel above, handle below); a wide screen lays it down with the handle to the right
    const tall = K.tall, ref = tall ? { w: 460, h: 820 } : { w: 830, h: 470 };
    const cx = 0, cy = 300, R = 206, hlen = 1.4, Y0 = 405;
    const O = (x, y) => (tall ? [x, y] : [y - Y0, -x + ref.h / 2]);
    const ES = (x, y, rx, ry, o) => { const [a, b] = O(x, y); return tall ? eSpot(a, b, rx, ry, 0, o) : eSpot(a, b, ry, rx, 0, o); };
    const by = {};
    by.wheel = ES(cx, cy, R * 0.74, R * 0.74, { apk: 0.86 });
    by.tongue = ES(cx + R * 0.02, cy - R * 1.12, R * 0.36, R * 0.16, { apk: 0.9 });
    by.handle = ES(cx, cy + R * (0.7 + hlen / 2), R * 0.34, R * hlen * 0.4, { apk: 0.9 });
    let rot = 0, vel = 0, last = 0;
    return { ref, by,
      draw(ctx, rt, fl) {
        const wh = fl('wheel'), tg = fl('tongue'), hd = fl('handle');
        const dt = clamp(rt.anim - last, 0, 0.1); last = rt.anim; vel += ((wh + hd) * 16 - vel * 3.2) * dt * 3; rot += vel * dt;
        const teeth = 16, swing = Math.sin(rt.anim * 40) * hd * 0.07;
        ctx.save(); if (!tall) { ctx.translate(-Y0, ref.h / 2); ctx.rotate(-Math.PI / 2); }
        ctx.save(); ctx.translate(cx, cy + R * 0.8); ctx.rotate(swing); ctx.translate(-cx, -(cy + R * 0.8));
        // the handle: a turned wooden grip that is also the axle; a lanyard loops through its end
        handle(ctx, cx, cy + R * 0.7, Math.PI / 2, R * hlen, R * 0.34, '#a86a34', { ring: [0.1, 0.55, 0.88], seed: 9 });
        ctx.strokeStyle = '#d8b878'; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(cx, cy + R * (0.7 + hlen + 0.1), R * 0.12, R * 0.17, 0, 0, TAU); ctx.stroke();
        // frame: two wooden plates and the box that holds the tongue
        const frame = (g) => rrect(g, cx - R * 0.96, cy - R * 1.36, R * 1.92, R * 2.2, R * 0.12);
        dropShadow(ctx, frame, 16, 22, 0.42);
        ctx.fillStyle = hgrad(ctx, cx - R, cx + R, [[0, '#6a3a1a'], [0.24, '#c47a3a'], [0.5, '#a86a34'], [1, '#4a2410']]); frame(ctx); ctx.fill();
        ctx.save(); frame(ctx); ctx.clip(); grain(ctx, cx - R, cy - R * 1.4, 2 * R, R * 2.3, '#2a1204', 0.4, 8, true, 22); ctx.restore();
        ctx.strokeStyle = 'rgba(255,214,150,0.4)'; ctx.lineWidth = 2.5; frame(ctx); ctx.stroke();
        // the round window where the toothed wheel turns
        const win = R * 0.86;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; circ(ctx, cx + 3, cy + 4, win + 9); ctx.fill();
        ctx.fillStyle = '#26160a'; circ(ctx, cx, cy, win + 7); ctx.fill();
        ctx.fillStyle = rgrad(ctx, cx, cy, win * 0.3, win, [[0, '#120a04'], [1, '#050301']]); circ(ctx, cx, cy, win); ctx.fill();
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
        // the cogwheel: wooden disc with square teeth, spokes cut out between
        const cw = win * 0.92, ci = win * 0.7;
        ctx.beginPath(); for (let k = 0; k < teeth; k++) { const a0 = (k / teeth) * TAU, a1 = ((k + 0.5) / teeth) * TAU, aa = ((k + 0.12) / teeth) * TAU, ab = ((k + 0.38) / teeth) * TAU;
          ctx.lineTo(Math.cos(a0) * ci, Math.sin(a0) * ci); ctx.lineTo(Math.cos(aa) * cw, Math.sin(aa) * cw); ctx.lineTo(Math.cos(ab) * cw, Math.sin(ab) * cw); ctx.lineTo(Math.cos(a1) * ci, Math.sin(a1) * ci); } ctx.closePath();
        ctx.fillStyle = rgrad(ctx, -cw * 0.3, -cw * 0.3, 0, cw * 1.2, [[0, '#e0a868'], [0.6, '#b27438'], [1, '#6a3a18']]); ctx.fill(); ctx.strokeStyle = 'rgba(30,12,2,0.75)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.save(); ctx.clip(); grain(ctx, -cw, -cw, 2 * cw, 2 * cw, '#3a1c08', 0.35, 5, false, 16); ctx.restore();
        for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; ctx.fillStyle = '#0c0603'; ctx.beginPath(); ctx.arc(0, 0, ci * 0.84, a + 0.1, a + TAU / 6 - 0.1); ctx.arc(0, 0, ci * 0.34, a + TAU / 6 - 0.16, a + 0.16, true); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle = rgrad(ctx, -ci * 0.12, -ci * 0.12, 0, ci * 0.36, [[0, '#f0d29a'], [1, '#7a4a20']]); circ(ctx, 0, 0, ci * 0.3); ctx.fill();
        ctx.fillStyle = '#2a160a'; circ(ctx, 0, 0, ci * 0.1); ctx.fill();
        ctx.restore();
        if (vel > 1.2) { ctx.strokeStyle = rgba('#fff0c8', clamp(vel / 24, 0, 0.45)); ctx.lineWidth = 7; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(cx, cy, win * (0.82 + 0.05 * k), rot * 0.8 + k * 1.6, rot * 0.8 + k * 1.6 + 0.9); ctx.stroke(); } }
        // the tongue: a springy wooden blade fixed at the top of the frame whose tip rides on the teeth and flicks off each one
        const tipY = cy - win * 0.93, flick = Math.sin(rot * teeth) * 0.5 + 0.5, bend = -(flick * 0.22 + tg * 0.2);
        ctx.save(); ctx.translate(cx - R * 0.5, cy - R * 1.2); ctx.rotate(0.05 + bend);
        const tl = Math.hypot(R * 0.5, tipY - (cy - R * 1.2)) + R * 0.1;
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(3, 6, tl, R * 0.1);
        ctx.fillStyle = vgrad(ctx, 0, R * 0.1, [[0, '#f0d29a'], [1, '#a2703a']]); ctx.fillRect(0, 0, tl, R * 0.1);
        ctx.strokeStyle = 'rgba(60,30,8,0.7)'; ctx.lineWidth = 1.5; ctx.strokeRect(0, 0, tl, R * 0.1);
        ctx.restore();
        ctx.fillStyle = '#4a2a12'; rrect(ctx, cx - R * 0.66, cy - R * 1.28, R * 0.3, R * 0.2, 6); ctx.fill();
        ctx.fillStyle = '#d0d4d8'; circ(ctx, cx - R * 0.58, cy - R * 1.18, 6); ctx.fill(); circ(ctx, cx - R * 0.44, cy - R * 1.18, 6); ctx.fill();
        if (tg > 0.05) { glow(ctx, cx, tipY, 60, '#ffe6a0', 0.5 * tg); }
        ctx.restore(); ctx.restore();
      } };
  },
});

// ============================================================ OPA TUBE GOURD ===============================================
mkRattle('opa', /\bop[aọ]\b|opa tubular|tube.?gourd|tubular.?gourd|shantu/, {
  dress: () => ({ kind: 'reeds', base: '#a07a46', light: '#ffe6b0' }),
  zones: [['beat', /beat|strike|slap|knock|low|thigh|arm/], ['cover', /cover|close|stop|palm|hand|mouth/], ['open', /open|lift|high|release|ring/]],
  build: (K) => {
    const tall = K.tall, ref = tall ? { w: 560, h: 760 } : { w: 960, h: 520 };
    // a long open tube gourd lies along a diagonal and bows gently: the wide mouth at the upper end, the narrow lower end beaten
    const a0 = tall ? -1.12 : -0.4, len = tall ? 800 : 880, w0 = tall ? 120 : 112, bow = tall ? 26 : 22;
    const cx = 0, cy = ref.h * 0.5, bt0 = Math.cos(a0), bt1 = Math.sin(a0);
    const prof = (t) => { const b = Math.exp(-(((t - 0.76) / 0.22) ** 2)); return w0 * (0.36 + 0.5 * b + 0.14 * t) * 0.5; };   // half width: slim, a swelling near the mouth
    const off = (t) => -bow * Math.sin(Math.PI * t);
    const P = (t, u = 0) => { const x = len * (t - 0.5), y = off(t) + u; return [cx + x * bt0 - y * bt1, cy + x * bt1 + y * bt0]; };
    const by = {}, m = P(0.9), b = P(0.24), o = P(0.54);
    by.cover = eSpot(m[0], m[1], w0 * 0.78, w0 * 0.78, 0, { apk: 0.9 });
    by.beat = eSpot(b[0], b[1], w0 * 0.48, w0 * 0.72, a0, { apk: 0.85 });
    by.open = eSpot(o[0], o[1], w0 * 0.5, w0 * 0.72, a0, { apk: 0.85 });
    return { ref, by,
      draw(ctx, rt, fl) {
        const bt = fl('beat'), cv = fl('cover'), op = fl('open');
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a0); ctx.translate(-cx, -cy);
        const x0 = cx - len / 2, x1 = cx + len / 2, X = (t) => x0 + len * t, Y = (t) => cy + off(t), steps = 56;
        const body = (g) => { g.beginPath(); for (let k = 0; k <= steps; k++) { const t = k / steps; g.lineTo(X(t), Y(t) - prof(t)); } for (let k = steps; k >= 0; k--) { const t = k / steps; g.lineTo(X(t), Y(t) + prof(t)); } g.closePath(); };
        dropShadow(ctx, body, 14, 22, 0.4);
        // the skin: green-gold toward the narrow end, deep gold at the swelling, lit along the top edge
        ctx.fillStyle = hgrad(ctx, x0, x1, [[0, '#a89a4a'], [0.3, '#c9a850'], [0.7, '#d99a38'], [1, '#b8782a']]); body(ctx); ctx.fill();
        ctx.save(); body(ctx); ctx.clip();
        for (let k = 0; k < 160; k++) { const t = hash(k); ctx.fillStyle = `rgba(70,36,8,${0.05 + 0.14 * hash(k + 3)})`; ell(ctx, X(t), Y(t) + (hash(k + 50) - 0.5) * prof(t) * 1.9, 2 + 6 * hash(k + 9), 1 + 2.4 * hash(k + 4)); ctx.fill(); }
        for (let k = 0; k < 12; k++) { const t = hash(k * 2 + 1); ctx.fillStyle = `rgba(250,236,170,${0.08 + 0.1 * hash(k)})`; ell(ctx, X(t), Y(t) - prof(t) * 0.3, 10 + 20 * hash(k + 4), 3 + 5 * hash(k + 2)); ctx.fill(); }
        // burnt chevrons around the middle and two plaited bands
        for (let k = 0; k < 15; k++) { const t = 0.34 + 0.3 * (k / 14), pr = prof(t) * 0.55; ctx.fillStyle = 'rgba(46,20,6,0.62)'; ctx.beginPath(); ctx.moveTo(X(t), Y(t) - pr); ctx.lineTo(X(t) + 8, Y(t)); ctx.lineTo(X(t), Y(t) + pr); ctx.lineTo(X(t) - 8, Y(t)); ctx.closePath(); ctx.fill(); }
        for (const t of [0.3, 0.66]) { const pr = prof(t); ctx.fillStyle = 'rgba(40,18,4,0.8)'; ctx.fillRect(X(t), Y(t) - pr - 4, 5, 2 * pr + 8); ctx.fillStyle = 'rgba(250,230,170,0.35)'; ctx.fillRect(X(t) + 6, Y(t) - pr - 4, 2, 2 * pr + 8); }
        for (const t of [0.05, 0.9]) { const pr = prof(t) + 6; ctx.fillStyle = vgrad(ctx, Y(t) - pr, Y(t) + pr, [[0, '#e6d2a0'], [0.5, '#b28a4a'], [1, '#6a4a22']]); ctx.fillRect(X(t) - 10, Y(t) - pr, 20, 2 * pr); ctx.strokeStyle = 'rgba(60,30,8,0.7)'; ctx.lineWidth = 1.5; for (let q = -pr; q < pr; q += 6) { ctx.beginPath(); ctx.moveTo(X(t) - 10, Y(t) + q); ctx.lineTo(X(t) + 10, Y(t) + q + 4); ctx.stroke(); } }
        ctx.fillStyle = vgrad(ctx, cy - w0, cy + w0, [[0, 'rgba(255,248,214,0.42)'], [0.22, 'rgba(255,248,214,0.0)'], [0.7, 'rgba(0,0,0,0)'], [1, 'rgba(30,12,2,0.4)']]); ctx.fillRect(x0 - 20, cy - w0 * 1.3, len + 40, w0 * 2.6);
        ctx.restore();
        ctx.strokeStyle = 'rgba(30,12,2,0.6)'; ctx.lineWidth = 3; body(ctx); ctx.stroke();
        // the openings: the dark bore at the wide upper end, a small ringed hole at the narrow end
        const r1 = prof(1) * 1.25, r0 = prof(0);
        ctx.fillStyle = vgrad(ctx, Y(1) - r1, Y(1) + r1, [[0, '#f0d08a'], [1, '#8a5a22']]); ell(ctx, X(1), Y(1), r1 * 0.4, r1); ctx.fill();
        ctx.fillStyle = rgrad(ctx, X(1) + 3, Y(1), 0, r1, [[0, '#040201'], [0.8, '#140a04'], [1, '#2a160a']]); ell(ctx, X(1) + 2, Y(1), r1 * 0.3, r1 * 0.8); ctx.fill();
        ctx.fillStyle = '#1a0c04'; ell(ctx, X(0), Y(0), r0 * 0.36, r0 * 0.86); ctx.fill(); ctx.strokeStyle = rgba('#f0d08a', 0.65); ctx.lineWidth = 2.4; ctx.stroke();
        // air leaves the open mouth in pulses; a palm-shaped pad closes it when the cover lane sounds
        const live = Math.max(op, bt * 0.6, 0.1);
        for (let k = 0; k < 3; k++) { const p = ((rt.anim * 0.7 + k / 3) % 1); ctx.strokeStyle = rgba('#fff0c8', 0.5 * (1 - p) * live); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(X(1) + 20 + p * 100, Y(1), 14 + p * 30, r1 * (0.5 + p * 0.5), 0, -1.2, 1.2); ctx.stroke(); }
        const pad = clamp(cv * 1.4, 0, 1), padX = X(1) + 38 - pad * 36;
        ctx.save(); ctx.globalAlpha = 0.22 + 0.7 * pad; ctx.fillStyle = vgrad(ctx, Y(1) - r1, Y(1) + r1, [[0, '#8a5a38'], [1, '#4a2a16']]); ell(ctx, padX, Y(1), r1 * 0.34, r1 * 1.15); ctx.fill(); ctx.strokeStyle = rgba('#f0c898', 0.7); ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
        if (bt > 0.05) glow(ctx, X(0.24), Y(0.24), w0 * 1.6, '#ffe6a0', 0.5 * bt);
        ctx.restore();
      } };
  },
});

// Asian drums, first half (1.23.0): janggu (Korea), kakko (Japan), kendang (Indonesia). Each is its own picture, own room, own composition and voice:
// the janggu is an hourglass lying flat on a low cradle in a paper-doored room; the kakko a small laced barrel seen from the front on a lacquered stand in a
// vermilion court; the kendang a long cone seen in perspective, its big head toward you, in a teak pavilion. No performer, no hands: a stick or mallet
// visits the struck place and the skin shivers.
import { registerDrumStage } from './registry.js';
import { createDrumStage, eSpot, eRing, eSector, rectSpot, assignZones, staticLayer, rot2 } from './drum-kit.js';
import { defVoice } from './voice-synth2.js';
import { pool, vignette } from './set.js';
import { floorShadow, foot, tube, bolt, blob, speckle, bulb, skinHead, hoop, shiver, headSide, taperBody, chromeH } from './drum-side.js';
import { PI, TAU, clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, lerp, d2r, fl, woodH, stick, visitStick, cordRim, thread, tassel } from './asia-kit.js';

const wallBottom = (F, scene) => Math.min(F.area.y + F.area.h - 40, F.map(0, scene.wallU)[1]);
const withLayer = (draw) => () => { const layer = staticLayer(); return { custom: (ctx, F, rt, S2, scene) => layer(ctx, { x: F.area.x, y: F.area.y, w: F.area.w, h: F.area.h }, (g) => draw(g, F, rt, S2, scene)) }; };

// ======================================================================================================================================================
// JANGGU: the Korean hourglass drum lying on a low wooden cradle. A big thick head on the left, a small thin one on the right, red cords zigzagging between
// the two hoops with leather rings that slide along them. Room: a hanok with oiled-paper lattice doors, the shadow of a pine branch, a golden paper floor.
// ======================================================================================================================================================
const JANG = [['kung', /kung|gung|left.*(centre|center|head)|bass|^low/], ['deok', /deok|duk|both|waist|cord/], ['dak', /^dak|tak|right.*(centre|center)|high/], ['gi', /^gi|^ddak|^ttak|right.*rim|rim|stick.?rim/], ['kerim', /kerim|left.*rim|edge|roll/]];
function hanok(ctx, F, rt, S, scene) {
  const A = F.area, wallB = wallBottom(F, scene), wallH = wallB - A.y;
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
  // oiled paper behind a lattice: warm, brighter in the middle, a darker timber frame round the doors
  ctx.fillStyle = rgrad(ctx, A.x + A.w * 0.6, A.y + wallH * 0.38, 0, Math.max(A.w, wallH) * 0.85, [[0, '#fbeec6'], [0.5, '#f0d89a'], [1, '#c99a52']]); ctx.fillRect(A.x, A.y, A.w, wallH);
  // the shadow of a pine branch on the paper
  ctx.save(); ctx.globalAlpha = 0.28; ctx.strokeStyle = '#4a3418'; ctx.lineCap = 'round';
  const bx = A.x + A.w * 0.96, by = A.y + wallH * 0.18;
  ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(A.x + A.w * 0.72, by + wallH * 0.06, A.x + A.w * 0.46, by + wallH * 0.2); ctx.stroke();
  ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(A.x + A.w * 0.76, by + wallH * 0.05); ctx.quadraticCurveTo(A.x + A.w * 0.66, by - wallH * 0.05, A.x + A.w * 0.58, by - wallH * 0.06); ctx.stroke();
  for (let k = 0; k < 90; k++) { const t = hash(k * 2 + 1), x = lerp(bx, A.x + A.w * 0.46, t) + (hash(k) - 0.5) * 46, y = lerp(by, by + wallH * 0.2, t * t) + (hash(k + 5) - 0.5) * 54 + (hash(k + 3) > 0.5 ? -wallH * 0.05 * (1 - t) : 0), a = (hash(k + 9) - 0.5) * 2.4;
    ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 34, y + Math.sin(a) * 34); ctx.stroke(); }
  ctx.restore();
  // lattice: vertical rails with horizontal bars at three heights, timber frame
  const fr = Math.max(8, A.w * 0.012), cols = A.w > A.h ? 14 : 8, cw = A.w / cols;
  ctx.strokeStyle = '#4a2c14'; ctx.lineWidth = fr * 0.55;
  for (let k = 1; k < cols; k++) { ctx.beginPath(); ctx.moveTo(A.x + k * cw, A.y); ctx.lineTo(A.x + k * cw, wallB); ctx.stroke(); }
  const rows = Math.max(4, Math.round(wallH / (cw * 1.15)));
  for (let r = 1; r < rows; r++) { const y = A.y + r * wallH / rows; ctx.beginPath(); ctx.moveTo(A.x, y); ctx.lineTo(A.x + A.w, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,236,190,0.38)'; ctx.lineWidth = 1.4;
  for (let k = 1; k < cols; k++) { ctx.beginPath(); ctx.moveTo(A.x + k * cw - fr * 0.3, A.y); ctx.lineTo(A.x + k * cw - fr * 0.3, wallB); ctx.stroke(); }
  // a door seam (two sliding leaves), heavier posts at the middle and the sides, a lintel
  for (const fx of [0, 0.5, 1]) { const x = A.x + A.w * fx, w = fr * 1.6; ctx.fillStyle = hgrad(ctx, x - w, x + w, [[0, '#2a1608'], [0.35, '#6a4020'], [0.6, '#4a2a12'], [1, '#22120a']]); ctx.fillRect(x - w, A.y, 2 * w, wallH); }
  ctx.fillStyle = vgrad(ctx, A.y, A.y + wallH * 0.07, [[0, '#2a1608'], [0.6, '#5a361a'], [1, '#2a1608']]); ctx.fillRect(A.x, A.y, A.w, wallH * 0.07);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(A.x, A.y + wallH * 0.07, A.w, 7);
  // a paper lantern hanging at the right, glowing
  const lx = A.x + A.w * 0.84, ly = A.y + wallH * 0.32, lw = Math.min(A.w * 0.09, 64), lh = lw * 1.45;
  ctx.strokeStyle = '#2a1608'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx, A.y + wallH * 0.07); ctx.lineTo(lx, ly - lh * 0.5); ctx.stroke();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgrad(ctx, lx, ly, 0, lw * 3, [[0, 'rgba(255,210,120,0.5)'], [1, 'rgba(255,210,120,0)']]); ctx.fillRect(lx - lw * 3, ly - lw * 3, lw * 6, lw * 6); ctx.restore();
  ctx.fillStyle = hgrad(ctx, lx - lw, lx + lw, [[0, '#d27a30'], [0.35, '#ffd78a'], [0.7, '#f0a850'], [1, '#b8602a']]); ell(ctx, lx, ly, lw, lh * 0.5); ctx.fill();
  ctx.strokeStyle = 'rgba(120,50,10,0.55)'; ctx.lineWidth = 1.5; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(lx, ly, lw * (1 - Math.abs(k) * 0.01), lh * 0.5, 0, 0, TAU); void k; } for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.ellipse(lx, ly, lw, lh * 0.5 * (k / 5) * 0 + lh * 0.5, 0, 0, TAU); void k; }
  for (let k = 1; k < 4; k++) { const yy = ly - lh * 0.5 + lh * k / 4; ctx.beginPath(); ctx.moveTo(lx - lw * Math.sqrt(1 - Math.pow((yy - ly) / (lh * 0.5), 2)), yy); ctx.lineTo(lx + lw * Math.sqrt(1 - Math.pow((yy - ly) / (lh * 0.5), 2)), yy); ctx.stroke(); }
  ctx.fillStyle = '#3a1e0c'; rrect(ctx, lx - lw * 0.4, ly - lh * 0.5 - 6, lw * 0.8, 9, 3); ctx.fill(); rrect(ctx, lx - lw * 0.4, ly + lh * 0.5 - 3, lw * 0.8, 9, 3); ctx.fill();
  for (const k of [-1, 0, 1]) { ctx.strokeStyle = '#c4262e'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(lx + k * lw * 0.22, ly + lh * 0.5 + 6); ctx.lineTo(lx + k * lw * 0.3, ly + lh * 0.5 + 34); ctx.stroke(); }
  // skirting and the golden paper floor with long seams
  ctx.fillStyle = vgrad(ctx, wallB - 16, wallB, [[0, '#6a4020'], [1, '#2a1608']]); ctx.fillRect(A.x, wallB - 16, A.w, 16);
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(A.x, wallB, A.w, 6);
  const fh = A.y + A.h - wallB;
  ctx.fillStyle = vgrad(ctx, wallB, A.y + A.h, [[0, '#c48a34'], [0.5, '#a86a22'], [1, '#6a3c12']]); ctx.fillRect(A.x, wallB, A.w, fh);
  for (let k = -9; k <= 9; k++) { ctx.strokeStyle = 'rgba(60,28,6,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(A.x + A.w / 2 + k * A.w * 0.03, wallB); ctx.lineTo(A.x + A.w / 2 + k * A.w * 0.16, A.y + A.h); ctx.stroke(); }
  for (let k = 0; k < 160; k++) { ctx.strokeStyle = `rgba(${hash(k) > 0.5 ? '255,226,150' : '70,34,8'},${0.06 + 0.08 * hash(k + 3)})`; ctx.lineWidth = 1.5; const x = A.x + A.w * hash(k * 3 + 1), y = wallB + fh * hash(k * 5 + 2); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 30 + 60 * hash(k + 7), y + (hash(k + 8) - 0.5) * 6); ctx.stroke(); }
  // light from the doors spilling on the floor
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgrad(ctx, A.x + A.w * 0.55, wallB + fh * 0.08, 0, A.w * 0.7, [[0, 'rgba(255,224,150,0.42)'], [1, 'rgba(255,224,150,0)']]); ctx.fillRect(A.x, wallB, A.w, fh); ctx.restore();
  ctx.restore();
  vignette(ctx, A, 0.5);
}
registerDrumStage({
  id: 'janggu', match: /janggu|jang.?go|changgo|changgu|hourglass.*(korea|hide)/,
  build: (S, lanes, P) => { const zoneOf = []; return createDrumStage('janggu', S, lanes, P, {
    heroClean: true,
    dress: withLayer(hanok),
    voiceOf: (i) => `janggu-${zoneOf[i] ?? 'kung'}`,
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 960 } : { w: 1040, h: 580 }, keyOf = assignZones(K, JANG.map(([key, re]) => ({ key, re })));
      for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const Lh = tall ? 262 : 330, rL = tall ? 184 : 156, rR = tall ? 144 : 120, rw = tall ? 36 : 33, aK = 0.4, rot = tall ? -0.11 : -0.05, cx = tall ? 10 : 0, cy = tall ? 540 : 280;
      const at = (x, y) => { const [a, b] = rot2(x, y, rot); return [cx + a, cy + b]; };
      const by = {}, aL = rL * aK, aR = rR * aK;
      { const [x, y] = at(-Lh - aL * 0.15, 0); by.kung = eSpot(x, y, aL * 0.95, rL * 0.56, rot, { apk: 0.95 }); by.kerim = eRing(x, y, aL * 1.0, rL * 1.0, rot, 0.7, 1.0, -PI / 2); }
      { const [x, y] = at(Lh + aR * 0.15, 0); by.dak = eSpot(x, y, aR * 0.95, rR * 0.56, rot, { apk: 0.95 }); by.gi = eRing(x, y, aR * 1.0, rR * 1.0, rot, 0.7, 1.0, PI / 2); }
      { const [x, y] = at(0, 0); by.deok = rectSpot(x, y, 70, rw + 38, rot, { rad: 18, ap: { cx: x, cy: y, rx: 58, ry: rw + 26, rot, rect: true, rad: 14 } }); }
      const spots = new Array(K.N).fill(null); for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
      const col = '#6a3220', cord = '#d02c34';
      const rAt = (t) => { const u = (t - 0.5) * 2, rE = t < 0.5 ? rL : rR, s = Math.abs(u); return rw + (rE - rw) * Math.pow(s, 2.3); };
      const botAt = (sx, r) => cy + sx * Lh * Math.sin(rot) + r * Math.cos(rot), tops = [botAt(-0.62, rAt(0.19)), botAt(0.58, rAt(0.79))], yG = Math.max(tops[0], tops[1]) + 30, plH = 24;
      return { ref, spots, wallU: yG + plH + 24, draw(ctx, rt) {
        const vk = fl(K, keyOf, rt, 'kung'), vkr = fl(K, keyOf, rt, 'kerim'), vd = fl(K, keyOf, rt, 'dak'), vg = fl(K, keyOf, rt, 'gi'), vo = fl(K, keyOf, rt, 'deok');
        // a low wooden platform with two curved saddles under the cups
        const plx0 = cx - Lh * 1.18, plx1 = cx + Lh * 1.18;
        floorShadow(ctx, cx, yG + plH + 12, Lh * 1.3, 38, 0.55);
        ctx.fillStyle = 'rgba(0,0,0,0.38)'; rrect(ctx, plx0 + 8, yG + 8, plx1 - plx0, plH + 18, 6); ctx.fill();
        ctx.fillStyle = vgrad(ctx, yG, yG + plH + 14, [[0, '#7a4a24'], [0.25, '#5a3418'], [1, '#2a1608']]); rrect(ctx, plx0, yG, plx1 - plx0, plH + 14, 6); ctx.fill();
        ctx.save(); rrect(ctx, plx0, yG, plx1 - plx0, plH + 14, 6); ctx.clip(); grain(ctx, plx0, yG, plx1 - plx0, plH + 14, '#1a0a04', 0.5, 9, false, 6); ctx.restore();
        ctx.strokeStyle = 'rgba(10,4,2,0.8)'; ctx.lineWidth = 2.2; rrect(ctx, plx0, yG, plx1 - plx0, plH + 14, 6); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,214,150,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(plx0 + 10, yG + 3); ctx.lineTo(plx1 - 10, yG + 3); ctx.stroke();
        for (const sx of [-0.62, 0.58]) {
          const x0 = cx + sx * Lh * Math.cos(rot), rr = (sx < 0 ? rL : rR) * 0.62, top = tops[sx < 0 ? 0 : 1] - 6;
          ctx.beginPath(); ctx.moveTo(x0 - rr, yG + 2); ctx.lineTo(x0 - rr * 0.92, top + 16); ctx.quadraticCurveTo(x0, top - 22, x0 + rr * 0.92, top + 16); ctx.lineTo(x0 + rr, yG + 2); ctx.closePath();
          ctx.fillStyle = woodH(ctx, x0 - rr, x0 + rr, '#5a3418'); ctx.fill(); ctx.strokeStyle = 'rgba(10,4,2,0.85)'; ctx.lineWidth = 2.4; ctx.stroke();
          ctx.save(); ctx.clip(); grain(ctx, x0 - rr, top - 22, 2 * rr, yG - top + 24, '#1a0a04', 0.4, 5, true, 10); ctx.restore();
          ctx.strokeStyle = 'rgba(214,170,74,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 - rr * 0.8, yG - 10); ctx.lineTo(x0 + rr * 0.8, yG - 10); ctx.stroke();
        }
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
        // the shell: an hourglass of red-brown lacquered wood with a gold line at each cup
        const N = 48, path = () => { ctx.beginPath(); for (let k = 0; k <= N; k++) { const t = k / N; ctx.lineTo(-Lh + 2 * Lh * t, -rAt(t)); } for (let k = N; k >= 0; k--) { const t = k / N; ctx.lineTo(-Lh + 2 * Lh * t, rAt(t)); } ctx.closePath(); };
        ctx.save(); ctx.translate(8, 14); path(); ctx.fillStyle = 'rgba(0,0,0,0.34)'; ctx.fill(); ctx.restore();
        path(); ctx.fillStyle = vgrad(ctx, -rL, rL, [[0, darker(col, 0.65)], [0.14, lighter(col, 0.38)], [0.3, lighter(col, 0.14)], [0.55, col], [0.85, darker(col, 0.5)], [1, darker(col, 0.78)]]); ctx.fill();
        ctx.save(); path(); ctx.clip();
        grain(ctx, -Lh, -rL, 2 * Lh, 2 * rL, darker(col, 0.74), 0.3, 11, false, 40);
        ctx.fillStyle = vgrad(ctx, -rL, rL, [[0.12, 'rgba(255,255,255,0)'], [0.2, 'rgba(255,238,210,0.3)'], [0.3, 'rgba(255,255,255,0)']]); ctx.fillRect(-Lh, -rL, 2 * Lh, 2 * rL);
        for (const t of [0.1, 0.9]) { const x = -Lh + 2 * Lh * t, r = rAt(t); ctx.strokeStyle = 'rgba(214,170,74,0.85)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, -r); ctx.lineTo(x, r); ctx.stroke(); ctx.strokeStyle = 'rgba(20,6,2,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 4, -r); ctx.lineTo(x + 4, r); ctx.stroke(); }
        ctx.restore(); path(); ctx.strokeStyle = 'rgba(20,6,2,0.85)'; ctx.lineWidth = 2.5; ctx.stroke();
        // heads: a hoop of wood bound in leather, a thick pale hide on the left and a thin bright one on the right
        const head = (hx, r, a, tint, edge, v, seed, rimCol) => {
          ctx.save(); ctx.translate(hx, 0); ctx.scale(a / r, 1);
          ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, r * 0.12, r * 0.08, r + 12, r + 12); ctx.fill();
          hoop(ctx, r, r, r * 0.13, { kind: 'wood', col: rimCol });
          ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 0, 0, r + 1, r + 1); ctx.fill();
          skinHead(ctx, r, r, { tint, edge, seed, vib: v, wear: 0.9 });
          ctx.restore();
          ctx.strokeStyle = 'rgba(255,240,210,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(hx, 0, a + 2, r * 1.06, 0, PI * 1.05, PI * 1.45); ctx.stroke();
          void edge;
        };
        // red cords between the two hoops: a lattice crossing at the waist
        const n = 7, pa = (k, side) => { const ph = d2r(-78 + 156 * k / (n - 1)); return [side * Lh + (side < 0 ? 1 : -1) * Math.cos(ph) * (side < 0 ? aL : aR) * 0.95, Math.sin(ph) * (side < 0 ? rL : rR) * 1.04]; };
        const cords = []; for (let k = 0; k < n; k++) { if (k + 1 < n) cords.push([pa(k, -1), pa(k + 1, 1)]); if (k > 0) cords.push([pa(k, -1), pa(k - 1, 1)]); }
        head(-Lh, rL, aL, '#e6cf9c', '#9c7440', vk + vkr * 0.7, 6, '#5a3820'); head(Lh, rR, aR, '#f2e4bc', '#c0a066', vd + vg * 0.7, 13, '#5a3820');
        for (const [[x0, y0], [x1, y1]] of cords) thread(ctx, x0, y0, x1, y1, 5.4, cord);
        // leather straps on the hoops where the cords tie
        for (let k = 0; k < n; k++) for (const side of [-1, 1]) { const [x, y] = pa(k, side), w = 11; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(y, side * 60) * 0.3); ctx.fillStyle = '#2a1408'; rrect(ctx, -w / 2 - 1.5, -13, w + 3, 26, 4); ctx.fill(); ctx.fillStyle = vgrad(ctx, -13, 13, [[0, '#d46a3c'], [1, '#7a2a14']]); rrect(ctx, -w / 2, -12, w, 24, 3.5); ctx.fill(); ctx.restore(); }
        // sliding leather rings at the waist
        for (const dx of [-26, 26]) { const r = rAt(0.5 + dx / (2 * Lh)) + 7; ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, dx + 5, 8, 11, r + 6); ctx.fill(); ctx.fillStyle = hgrad(ctx, dx - 11, dx + 11, [[0, '#4a1a0c'], [0.35, '#d4663a'], [0.7, '#a63a1c'], [1, '#3a1208']]); ell(ctx, dx, 0, 10, r + 6); ctx.fill(); ctx.strokeStyle = 'rgba(20,6,2,0.8)'; ctx.lineWidth = 2; ctx.stroke(); }
        if (vo > 0.05) { ctx.fillStyle = `rgba(255,230,170,${0.35 * vo})`; rrect(ctx, -70, -rw - 38, 140, 2 * rw + 76, 18); ctx.fill(); }
        ctx.restore();
        // the sticks: a bamboo switch for the right head, a knobbed mallet for the left
        const [rx0, ry0] = at(Lh + aR * 0.15, 0), [lx0, ly0] = at(-Lh - aL * 0.15, 0);
        visitStick(ctx, rx0 - 6, ry0 - 4, Math.max(vd, vg), { ang: 2.62, dir: [0.8, -0.6], back: 120, len: tall ? 250 : 340, w: 9, col: '#d9b86e', nodes: [0.22, 0.52, 0.8] });
        visitStick(ctx, lx0 + 8, ly0 - 6, Math.max(vk, vkr), { ang: 0.55, dir: [-0.8, -0.6], back: 120, len: tall ? 220 : 300, w: 15, col: '#b8864a', knob: { r: 19, col: '#8a5a2a' } });
        // a second pair lying on the floor in front
        
        // on the floor: a white moon jar and the two sticks laid side by side
        { const jx = tall ? cx - 300 : cx - 430, jy = yG + plH + (tall ? 96 : 58), jr = tall ? 54 : 44;
          floorShadow(ctx, jx + 10, jy + jr * 0.92, jr * 1.4, 12, 0.5);
          ctx.fillStyle = rgrad(ctx, jx - jr * 0.35, jy - jr * 0.4, 0, jr * 1.4, [[0, '#ffffff'], [0.45, '#ece6d4'], [1, '#a49c84']]); ell(ctx, jx, jy, jr, jr * 0.96); ctx.fill();
          ctx.strokeStyle = 'rgba(80,70,50,0.6)'; ctx.lineWidth = 2; ctx.stroke();
          ctx.fillStyle = '#2a2418'; ell(ctx, jx, jy - jr * 0.9, jr * 0.4, jr * 0.12); ctx.fill(); ctx.strokeStyle = '#d8d0b8'; ctx.lineWidth = 4; ctx.stroke();
          ctx.strokeStyle = 'rgba(120,100,70,0.25)'; ctx.lineWidth = 1; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.moveTo(jx + (hash(k) - 0.5) * jr, jy + (hash(k + 3) - 0.5) * jr); ctx.lineTo(jx + (hash(k + 5) - 0.5) * jr * 1.5, jy + (hash(k + 7) - 0.5) * jr * 1.4); ctx.stroke(); } }
        { const sy = yG + plH + (tall ? 86 : 54), sx = cx - (tall ? 170 : 150); stick(ctx, sx, sy, -0.02, tall ? 280 : 260, 14, { col: '#b8864a', knob: { r: 19, col: '#8a5a2a' } }); stick(ctx, sx + 20, sy + 26, 0.01, tall ? 300 : 280, 8, { col: '#d9b86e', nodes: [0.2, 0.5, 0.78] }); }
        void shiver; void headSide; void taperBody; void chromeH; void foot; void tube; void bolt; void blob; void speckle; void bulb; void pool; void mix; void clamp; void rgba; void lighter; void darker; void cordRim; void tassel; void eSector; void d2r;
      } };
    },
  }); },
});
// the left head is thick and deep, the right thin and bright; "deok" is both heads at once
defVoice('janggu-kung', 'skin', { dur: 0.5, drop: 1.18, glide: 0.06, modes: [[1, 1, 1], [1.62, 0.5, 0.55], [2.3, 0.3, 0.4]], shell: { f: 160, q: 5, gain: 0.4, dur: 0.22 }, click: { f: 1400, gain: 0.3 }, lp: 2600, gain: 0.7 });
defVoice('janggu-kerim', 'skin', { dur: 0.16, drop: 1.1, glide: 0.02, modes: [[1, 1, 1], [2.3, 0.6, 0.6], [3.4, 0.4, 0.4]], click: { f: 2600, gain: 0.7, dur: 0.02 }, lp: 6000, gain: 0.5 });
defVoice('janggu-dak', 'skin', { dur: 0.2, drop: 1.07, glide: 0.02, modes: [[1, 1, 1], [1.9, 0.6, 0.6], [2.8, 0.45, 0.5]], click: { f: 4200, q: 1, gain: 0.95, dur: 0.02 }, shell: { f: 900, q: 8, gain: 0.2, dur: 0.1 }, lp: 9000, gain: 0.5 });
defVoice('janggu-gi', 'woodtok', { dur: 0.08, gain: 0.5, hollow: 1.9, overtone: 3.6 });
defVoice('janggu-deok', 'skin', { dur: 0.32, drop: 1.1, glide: 0.04, modes: [[1, 1, 1], [1.62, 0.5, 0.5], [2.6, 0.55, 0.6], [3.9, 0.4, 0.4]], click: { f: 3600, gain: 0.8, dur: 0.02 }, shell: { f: 200, q: 5, gain: 0.35, dur: 0.18 }, lp: 8000, gain: 0.6 });


// ======================================================================================================================================================
// KAKKO: the small laced barrel of the Japanese court orchestra, seen from the front on a low lacquered stand, its near head turned to you and its body
// running away to the right. Two thin sticks. Room: a vermilion court at dusk: two lacquered pillars, a black beam with gilt nail covers, a half-rolled blind,
// roofs against a violet sky, and a polished black floor with a round straw mat.
// ======================================================================================================================================================
const KAK = [['c', /centre|center|^ten|^tan|^high|^ta$/], ['e', /edge|^tsu|ring|^ra$/], ['r', /rim|hoop|click|kara|ko$/], ['l', /lace|cord|body|side|roll|shell|^low/]];
function vermilionCourt(ctx, F, rt, S, scene) {
  const A = F.area, wallB = wallBottom(F, scene), wallH = wallB - A.y;
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
  // dusk sky seen between the pillars
  ctx.fillStyle = vgrad(ctx, A.y, wallB, [[0, '#17123e'], [0.4, '#44245e'], [0.75, '#a4465a'], [1, '#e08a52']]); ctx.fillRect(A.x, A.y, A.w, wallH);
  for (let k = 0; k < 50; k++) { ctx.fillStyle = `rgba(255,240,220,${0.25 + 0.5 * hash(k)})`; circ(ctx, A.x + A.w * hash(k * 3 + 1), A.y + wallH * 0.5 * hash(k * 7 + 2) * hash(k + 4), 0.6 + hash(k + 9) * 1.3); ctx.fill(); }
  ctx.fillStyle = rgrad(ctx, A.x + A.w * 0.72, A.y + wallH * 0.3, 0, wallH * 0.14, [[0, 'rgba(255,248,226,0.95)'], [0.4, 'rgba(255,236,190,0.5)'], [1, 'rgba(255,220,160,0)']]); ctx.fillRect(A.x, A.y, A.w, wallH);
  ctx.fillStyle = '#fff4d8'; circ(ctx, A.x + A.w * 0.72, A.y + wallH * 0.3, wallH * 0.035); ctx.fill();
  // far roofs: layers of dark tiled silhouettes with a few warm windows and lanterns
  const roof = (y0, h, col, seed, a) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(A.x, y0 + h); let x = A.x; while (x < A.x + A.w + 40) { const w = 80 + 120 * hash(seed + x * 0.01), hh = h * (0.35 + 0.6 * hash(seed + x * 0.02 + 3)); ctx.lineTo(x, y0 + h - hh * 0.4); ctx.quadraticCurveTo(x + w * 0.2, y0 + h - hh, x + w * 0.5, y0 + h - hh); ctx.quadraticCurveTo(x + w * 0.8, y0 + h - hh, x + w, y0 + h - hh * 0.4); x += w; } ctx.lineTo(A.x + A.w + 40, y0 + h); ctx.closePath(); ctx.globalAlpha = a; ctx.fill(); ctx.globalAlpha = 1; };
  roof(A.y + wallH * 0.52, wallH * 0.3, '#3a1c48', 3, 0.9); roof(A.y + wallH * 0.62, wallH * 0.28, '#241038', 9, 1);
  for (let k = 0; k < 9; k++) { const x = A.x + A.w * (0.12 + 0.76 * hash(k * 5 + 1)), y = A.y + wallH * (0.7 + 0.18 * hash(k + 2)); bulb(ctx, x, y, 3.6, '#ffc27a'); }
  // vermilion pillars with black plinths and gilt bands
  const pw = Math.min(A.w * 0.15, wallH * 0.17), bh = wallH * 0.09;
  for (const px of [A.x + pw * 0.45, A.x + A.w - pw * 0.45]) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(px - pw / 2 + 10, A.y, pw, wallH);
    ctx.fillStyle = hgrad(ctx, px - pw / 2, px + pw / 2, [[0, '#5a1208'], [0.18, '#d4442a'], [0.38, '#f0663c'], [0.65, '#b02a18'], [1, '#4a0e06']]); ctx.fillRect(px - pw / 2, A.y, pw, wallH);
    for (let k = 0; k < 40; k++) { ctx.strokeStyle = `rgba(60,8,2,${0.06 + 0.08 * hash(k)})`; ctx.lineWidth = 1.4; ctx.beginPath(); const y = A.y + wallH * hash(k * 2 + 1); ctx.moveTo(px - pw / 2 + pw * hash(k + 3), y); ctx.lineTo(px - pw / 2 + pw * hash(k + 5), y + 60 * hash(k + 7)); ctx.stroke(); }
    ctx.fillStyle = hgrad(ctx, px - pw * 0.62, px + pw * 0.62, [[0, '#0a0606'], [0.3, '#4a3a38'], [0.6, '#1a1210'], [1, '#080404']]); ctx.fillRect(px - pw * 0.62, wallB - bh, pw * 1.24, bh);
    for (const f of [0.22, 0.3]) { ctx.fillStyle = hgrad(ctx, px - pw / 2 - 3, px + pw / 2 + 3, [[0, '#6a4a10'], [0.3, '#f4d676'], [0.62, '#b8902a'], [1, '#5a3a08']]); ctx.fillRect(px - pw / 2 - 3, A.y + wallH * f, pw + 6, wallH * 0.012); }
  }
  // beam, gilt nail covers and the half-rolled blind with tassels
  const beamH = wallH * 0.09; ctx.fillStyle = vgrad(ctx, A.y, A.y + beamH, [[0, '#1c1210'], [0.5, '#3a2622'], [1, '#120a08']]); ctx.fillRect(A.x, A.y, A.w, beamH);
  ctx.fillStyle = '#d8aa44'; ctx.fillRect(A.x, A.y + beamH - 5, A.w, 4);
  for (let k = 0; k < 11; k++) { const x = A.x + (k + 0.5) * A.w / 11; ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, x + 2, A.y + beamH * 0.5 + 2, 6); ctx.fill(); ctx.fillStyle = rgrad(ctx, x - 2, A.y + beamH * 0.45, 0, 8, [[0, '#fff0b0'], [1, '#a8801e']]); circ(ctx, x, A.y + beamH * 0.5, 6); ctx.fill(); }
  const bl0 = A.x + pw, bl1 = A.x + A.w - pw, bt = A.y + beamH, bb = A.y + wallH * 0.3;
  ctx.fillStyle = vgrad(ctx, bt, bb, [[0, '#a07a3c'], [1, '#d6b46c']]); ctx.beginPath(); ctx.moveTo(bl0, bt); ctx.lineTo(bl1, bt); ctx.quadraticCurveTo(bl1 - 20, bb - 18, bl1 - 60, bb); ctx.quadraticCurveTo((bl0 + bl1) / 2, bb + 22, bl0 + 60, bb); ctx.quadraticCurveTo(bl0 + 20, bb - 18, bl0, bt); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.clip(); for (let x = bl0; x < bl1; x += 7) { ctx.strokeStyle = 'rgba(70,40,10,0.45)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, bt); ctx.lineTo(x, bb + 30); ctx.stroke(); } for (let y = bt + 20; y < bb; y += 36) { ctx.strokeStyle = 'rgba(60,30,8,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bl0, y); ctx.lineTo(bl1, y); ctx.stroke(); } ctx.restore();
  ctx.fillStyle = vgrad(ctx, bt, bt + 26, [[0, '#6a1410'], [1, '#a82820']]); ctx.fillRect(bl0, bt, bl1 - bl0, 24); ctx.fillStyle = '#e8c260'; for (let x = bl0 + 14; x < bl1; x += 34) { ctx.beginPath(); ctx.moveTo(x, bt + 12); ctx.lineTo(x + 7, bt + 6); ctx.lineTo(x + 14, bt + 12); ctx.lineTo(x + 7, bt + 18); ctx.closePath(); ctx.fill(); }
  tassel(ctx, bl0 + 60, bb - 6, wallH * 0.08, '#c8302a', 16); tassel(ctx, bl1 - 60, bb - 6, wallH * 0.08, '#c8302a', 16);
  // the floor: black lacquer with a vermilion reflection of each pillar, seams, a soft glow under the lamp
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(A.x, wallB - 2, A.w, 7);
  const fh = A.y + A.h - wallB; ctx.fillStyle = vgrad(ctx, wallB, A.y + A.h, [[0, '#1e1210'], [0.5, '#120a0a'], [1, '#060404']]); ctx.fillRect(A.x, wallB, A.w, fh);
  for (const px of [A.x + pw * 0.45, A.x + A.w - pw * 0.45]) { ctx.fillStyle = vgrad(ctx, wallB, wallB + fh * 0.8, [[0, 'rgba(240,90,50,0.38)'], [1, 'rgba(240,90,50,0)']]); ctx.fillRect(px - pw / 2, wallB, pw, fh * 0.8); }
  for (let k = 1; k < 7; k++) { const yy = wallB + fh * Math.pow(k / 7, 1.5); ctx.strokeStyle = 'rgba(255,200,160,0.09)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(A.x, yy); ctx.lineTo(A.x + A.w, yy); ctx.stroke(); }
  for (let k = -8; k <= 8; k++) { ctx.strokeStyle = 'rgba(255,200,160,0.07)'; ctx.beginPath(); ctx.moveTo(A.x + A.w / 2 + k * A.w * 0.03, wallB); ctx.lineTo(A.x + A.w / 2 + k * A.w * 0.15, A.y + A.h); ctx.stroke(); }
  ctx.restore();
  pool(ctx, A.x + A.w * 0.5, wallB + fh * 0.2, A.w * 0.45, A.h * 0.24, '#ffb07a', 0.28); vignette(ctx, A, 0.5);
}
registerDrumStage({
  id: 'kakko', match: /kakko|kakku|jian?gu|hing.?ku/,
  build: (S, lanes, P) => { const zoneOf = []; return createDrumStage('kakko', S, lanes, P, {
    heroClean: true,
    dress: withLayer(vermilionCourt),
    voiceOf: (i) => `kakko-${zoneOf[i] ?? 'c'}`,
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 960 } : { w: 1040, h: 580 }, keyOf = assignZones(K, KAK.map(([key, re]) => ({ key, re })));
      for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const R = tall ? 146 : 120, hx = tall ? -66 : -120, hy = tall ? 470 : 262, rot = -0.14, ax = 0.78, bx = tall ? 226 : 226, byv = tall ? -56 : -40, far = 0.84, by = {};
      const nx = hx, ny = hy;     // near head centre
      const fx = hx + bx, fy = hy + byv;
      by.c = eSpot(nx, ny, R * ax * 0.46, R * 0.46, rot, { apk: 0.95 });
      by.e = eRing(nx, ny, R * ax * 0.98, R * 0.98, rot, 0.66, 1.0, -PI / 2);
      by.r = eSector(nx, ny, R * ax, R, rot, 1.04, 1.26, d2r(200), d2r(320), { cueR: R * 0.11 });
      { const [a, b] = rot2(bx * 0.58, byv * 0.58 + R * 0.5, 0); by.l = rectSpot(nx + a, ny + b, bx * 0.2, R * 0.2, -0.1, { rad: 14 }); }
      const spots = new Array(K.N).fill(null); for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
      return { ref, spots, wallU: ny + R + (tall ? 200 : 128), draw(ctx, rt) {
        const vc = fl(K, keyOf, rt, 'c', 'e', 'r'), vl = fl(K, keyOf, rt, 'l');
        const yG = ny + R + (tall ? 150 : 104);
        // a round straw mat with a brocade edge, and the stand
        ctx.save(); ctx.translate((nx + fx) / 2 + 20, yG + 16); ctx.scale(1, 0.34);
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; circ(ctx, 14, 26, 330); ctx.fill();
        ctx.fillStyle = rgrad(ctx, -60, -60, 0, 330, [[0, '#d8c488'], [1, '#8a7236']]); circ(ctx, 0, 0, 320); ctx.fill();
        for (let k = 1; k < 14; k++) { ctx.strokeStyle = `rgba(80,56,16,${0.22})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 320 * k / 14, 0, TAU); ctx.stroke(); }
        ctx.strokeStyle = '#7a1c18'; ctx.lineWidth = 26; ctx.beginPath(); ctx.arc(0, 0, 330, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#e8c260'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 345, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 316, 0, TAU); ctx.stroke();
        for (let k = 0; k < 36; k++) { const a = k / 36 * TAU; ctx.fillStyle = '#e8c260'; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 331, Math.sin(a) * 331, 7, 3.5, a + PI / 2, 0, TAU); ctx.fill(); }
        ctx.restore();
        const sw = (bx + 2 * R * ax) * 0.5;
        const rF = R * far;
        // the stand: a low black lacquered table with a gilt edge and four short legs, under the barrel
        const topY = ny + R * 0.94, sx0 = nx - R * 0.74, sx1 = fx + rF * 0.78, bk = 40;
        const quad = [[sx0, topY + 6], [sx1, topY - 36], [sx1 + bk, topY - 36 - bk * 0.55], [sx0 + bk, topY + 6 - bk * 0.55]];
        for (const [lx, ly, w, lh] of [[sx0 + 14, topY + 26, 22, yG - topY - 20], [sx1 - 10, topY - 12, 20, yG - topY + 20], [sx0 + bk + 12, topY - 16, 14, yG - topY + 4], [sx1 + bk - 8, topY - 44, 14, yG - topY + 36]]) {
          ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(lx + 8, Math.min(yG + 6, ly + lh + 6), w * 1.2, 6, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = woodH(ctx, lx - w, lx + w, '#2a1610'); rrect(ctx, lx - w * 0.5, ly, w, lh, 5); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#d8aa44'; ctx.fillRect(lx - w * 0.5, ly + lh - 14, w, 4); }
        ctx.beginPath(); quad.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fillStyle = vgrad(ctx, topY - 70, topY + 10, [[0, '#3a2620'], [1, '#14090a']]); ctx.fill(); ctx.strokeStyle = '#d8aa44'; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx0, topY + 6); ctx.lineTo(sx1, topY - 36); ctx.lineTo(sx1, topY - 20); ctx.lineTo(sx0, topY + 22); ctx.closePath(); ctx.fillStyle = vgrad(ctx, topY - 30, topY + 22, [[0, '#2a1814'], [1, '#0c0605']]); ctx.fill(); ctx.strokeStyle = '#d8aa44'; ctx.lineWidth = 2; ctx.stroke();
        // the body: a black-lacquered barrel receding up and to the right; its far head ring peeks out behind
        ctx.save(); ctx.translate(fx, fy); ctx.rotate(rot);
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ell(ctx, 8, 10, rF * ax + 8, rF + 8); ctx.fill();
        hoop(ctx, rF * ax, rF, rF * 0.11, { kind: 'wood', col: '#241812' });
        ctx.fillStyle = '#34120e'; ell(ctx, 0, 0, rF * ax, rF); ctx.fill();
        ctx.restore();
        const bodyPath = () => { const t0 = rot2(0, -R, rot), b0 = rot2(0, R, rot), t1 = rot2(0, -rF, rot), b1 = rot2(0, rF, rot); ctx.beginPath(); ctx.moveTo(nx + t0[0], ny + t0[1]); ctx.bezierCurveTo((nx + fx) / 2 - 20 + t0[0], (ny + fy) / 2 - R * 1.18, (nx + fx) / 2 + 40 + t1[0], (ny + fy) / 2 - rF * 1.22, fx + t1[0], fy + t1[1]); ctx.lineTo(fx + b1[0], fy + b1[1]); ctx.bezierCurveTo((nx + fx) / 2 + 20 + b1[0], (ny + fy) / 2 + rF * 1.16, (nx + fx) / 2 - 30 + b0[0], (ny + fy) / 2 + R * 1.2, nx + b0[0], ny + b0[1]); ctx.closePath(); };
        bodyPath(); ctx.fillStyle = vgrad(ctx, ny - R * 1.2, ny + R * 1.2, [[0, '#c8785a'], [0.14, '#8a2a1c'], [0.4, '#52140e'], [0.78, '#2a0a08'], [1, '#5a2018']]); ctx.fill();
        ctx.save(); bodyPath(); ctx.clip();
        ctx.fillStyle = vgrad(ctx, ny - R * 1.2, ny + R * 0.2, [[0.1, 'rgba(255,255,255,0)'], [0.2, 'rgba(255,240,220,0.32)'], [0.34, 'rgba(255,255,255,0)']]); ctx.fillRect(nx - 10, ny - R * 1.3, bx + 40, R * 1.6);
        // gold bands near each head, and a gilt vine between
        for (const t of [0.1, 0.9]) { const x = lerp(nx, fx, t), y = lerp(ny, fy, t), r = lerp(R, rF, t); ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.strokeStyle = '#e8c260'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(0, 0, r * ax * 0.6, r * 1.02, 0, -PI / 2, PI / 2); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,230,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(-2, -1, r * ax * 0.6, r * 1.0, 0, -PI / 2 - 0.2, 0); ctx.stroke(); ctx.restore(); }
        ctx.strokeStyle = 'rgba(232,194,96,0.55)'; ctx.lineWidth = 2.5; ctx.beginPath(); for (let k = 0; k <= 40; k++) { const t = 0.2 + 0.6 * k / 40, x = lerp(nx, fx, t), y = lerp(ny, fy, t) - R * 0.34 * (1 - t * 0.2) + Math.sin(k * 0.9) * 8; if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
        ctx.restore(); bodyPath(); ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.lineWidth = 2.5; ctx.stroke();
        if (vl > 0.05) { bodyPath(); ctx.fillStyle = `rgba(255,220,160,${0.2 * vl})`; ctx.fill(); }
        // laced cords from the near hoop to the far hoop
        const cordN = 9; for (let k = 0; k < cordN; k++) { const ph = d2r(-132 + 112 * k / (cordN - 1)), ph2 = ph + d2r(7), a0 = rot2(R * ax * Math.cos(ph) * 1.04, R * Math.sin(ph) * 1.04, rot), a1 = rot2(rF * ax * Math.cos(ph2) * 1.0, rF * Math.sin(ph2) * 1.0, rot); thread(ctx, nx + a0[0], ny + a0[1], fx + a1[0], fy + a1[1], 5, k % 2 ? '#d8302a' : '#efe0c0'); }
        // the near head
        ctx.save(); ctx.translate(nx, ny); ctx.rotate(rot); ctx.scale(ax, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ell(ctx, R * 0.07, R * 0.09, R + 14, R + 14); ctx.fill();
        hoop(ctx, R, R, R * 0.125, { kind: 'wood', col: '#2a1a14' });
        ctx.restore(); ctx.save(); ctx.translate(nx, ny); ctx.rotate(rot); cordRim(ctx, R * ax * 1.14, R * 1.14, R * 0.075, '#d8302a', 56); ctx.scale(ax, 1);
        ctx.strokeStyle = '#d8aa44'; ctx.lineWidth = 3; ell(ctx, 0, 0, R * 1.02, R * 1.02); ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.32)'; ell(ctx, 0, 0, R + 1, R + 1); ctx.fill();
        skinHead(ctx, R, R, { tint: '#f4e8c4', edge: '#c6a468', seed: 21, vib: vc, wear: 0.4 });
        ctx.strokeStyle = 'rgba(70,40,16,0.45)'; ctx.lineWidth = 2.2; ell(ctx, 0, 0, R * 0.5, R * 0.5); ctx.stroke(); ell(ctx, 0, 0, R * 0.66, R * 0.66); ctx.stroke();
        ctx.restore();
        // the near cord knots on the hoop
        for (let k = 0; k < 8; k++) { const ph = d2r(-150 + 210 * k / 7), a = rot2(R * ax * Math.cos(ph) * 1.13, R * Math.sin(ph) * 1.13, rot); ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, nx + a[0] + 2, ny + a[1] + 3, 7.5); ctx.fill(); ctx.fillStyle = rgrad(ctx, nx + a[0] - 2, ny + a[1] - 2, 0, 9, [[0, '#ff9a7a'], [1, '#8a1810']]); circ(ctx, nx + a[0], ny + a[1], 7); ctx.fill(); }
        // sticks resting on the stand, and the striking stick
        stick(ctx, nx - 40, yG + (tall ? 70 : 34), -0.04, 230, 11, { col: '#d8bc8a', tip: 0.5 }); stick(ctx, nx - 20, yG + (tall ? 92 : 46), -0.01, 232, 11, { col: '#caa870', tip: 0.5 });
        const [cxs, cys] = [nx, ny];
        visitStick(ctx, cxs - R * 0.2, cys - R * 0.1, Math.max(fl(K, keyOf, rt, 'c'), fl(K, keyOf, rt, 'e'), fl(K, keyOf, rt, 'r')), { ang: 0.85, dir: [-0.7, -0.8], back: 120, len: tall ? 240 : 300, w: 12, col: '#e0c48c', tip: 0.5 });
        void foot; void tube; void bolt; void blob; void speckle; void mix; void clamp; void rgba; void lighter; void darker; void cordRim; void shiver; void headSide; void taperBody; void chromeH; void rgrad; void grain;
      } };
    },
  }); },
});
defVoice('kakko-c', 'skin', { dur: 0.16, drop: 1.06, glide: 0.015, modes: [[1, 1, 1], [1.75, 0.6, 0.6], [2.7, 0.45, 0.5], [3.9, 0.3, 0.4]], click: { f: 5200, q: 1, gain: 1.0, dur: 0.018 }, shell: { f: 1500, q: 8, gain: 0.25, dur: 0.1 }, lp: 12000, gain: 0.5 });
defVoice('kakko-e', 'skin', { dur: 0.1, drop: 1.04, glide: 0.01, modes: [[1, 1, 1], [2.1, 0.7, 0.6], [3.4, 0.5, 0.5]], click: { f: 6200, q: 1, gain: 1.0, dur: 0.014 }, lp: 12000, gain: 0.44 });
defVoice('kakko-r', 'woodtok', { dur: 0.06, gain: 0.5, hollow: 2.4, overtone: 4.2 });
defVoice('kakko-l', 'woodtok', { dur: 0.12, gain: 0.5, hollow: 1.5, overtone: 2.8 });

// ======================================================================================================================================================
// KENDANG: the long conical drum of the gamelan, lying on the floor with the big head toward you. Straps run in a diamond lattice between the two hoops, the
// body is pale jackfruit wood. Room: a teak pavilion, carved pillars on stone bases, a layered ceiling above and a woven batik mat under the drum.
// ======================================================================================================================================================
const KEN = [['dung', /dung|bem|big.*(centre|center)|^low|bass|gede/], ['tak', /^tak|big.*(edge|rim|slap)|^pak|plak/], ['tong', /tong|dang|small.*(centre|center)|^high|ketipung/], ['ket', /ket|tut|small.*(edge|rim|slap)|^tek/], ['body', /body|shell|cap|wood|side/]];
function teakPavilion(ctx, F, rt, S, scene) {
  const A = F.area, wallB = wallBottom(F, scene), wallH = wallB - A.y;
  ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
  // carved teak screen at the back: panels with diamond fretwork
  ctx.fillStyle = vgrad(ctx, A.y, wallB, [[0, '#2a1408'], [0.5, '#5a3016'], [1, '#6e3e1c']]); ctx.fillRect(A.x, A.y, A.w, wallH);
  const pn = A.w > A.h ? 5 : 3, pwd = A.w / pn;
  for (let k = 0; k < pn; k++) {
    const x = A.x + k * pwd, y0 = A.y + wallH * 0.3, y1 = wallB - wallH * 0.06;
    ctx.fillStyle = vgrad(ctx, y0, y1, [[0, '#8a5424'], [1, '#6a3c18']]); rrect(ctx, x + pwd * 0.1, y0, pwd * 0.8, y1 - y0, 8); ctx.fill();
    ctx.save(); rrect(ctx, x + pwd * 0.1, y0, pwd * 0.8, y1 - y0, 8); ctx.clip(); grain(ctx, x, y0, pwd, y1 - y0, '#2a1204', 0.5, k * 7 + 2, true, 20);
    const d = pwd * 0.16; ctx.strokeStyle = 'rgba(30,12,2,0.7)'; ctx.lineWidth = 3;
    for (let yy = y0 - d; yy < y1 + d; yy += d) for (let xx = x; xx < x + pwd + d; xx += d) { ctx.beginPath(); ctx.moveTo(xx, yy + d / 2); ctx.lineTo(xx + d / 2, yy); ctx.lineTo(xx + d, yy + d / 2); ctx.lineTo(xx + d / 2, yy + d); ctx.closePath(); ctx.stroke(); ctx.fillStyle = 'rgba(232,194,96,0.45)'; circ(ctx, xx + d / 2, yy + d / 2, 2.4); ctx.fill(); }
    ctx.restore(); rrect(ctx, x + pwd * 0.1, y0, pwd * 0.8, y1 - y0, 8); ctx.strokeStyle = '#e8c260'; ctx.lineWidth = 2.5; ctx.stroke();
  }
  // a gong rack at the back: a carved bar with three hung gongs of different sizes
  { const gx = A.x + A.w * 0.5, gy = A.y + wallH * 0.2, gw = Math.min(A.w * 0.46, 360);
    ctx.fillStyle = vgrad(ctx, gy, gy + 18, [[0, '#8a5a22'], [1, '#3a1e08']]); rrect(ctx, gx - gw / 2, gy, gw, 16, 6); ctx.fill(); ctx.strokeStyle = '#e8c260'; ctx.lineWidth = 2.5; ctx.stroke();
    for (const sx of [-1, 1]) { ctx.fillStyle = hgrad(ctx, gx + sx * gw / 2 - 12, gx + sx * gw / 2 + 12, [[0, '#2a1204'], [0.5, '#7a4a20'], [1, '#2a1204']]); ctx.fillRect(gx + sx * gw / 2 - 11, gy, 22, wallH * 0.62); }
    for (const [dx, r] of [[-gw * 0.3, gw * 0.15], [0, gw * 0.1], [gw * 0.28, gw * 0.125]]) { const yy = gy + 16 + r * 1.9;
      ctx.strokeStyle = '#120804'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(gx + dx - r * 0.5, gy + 16); ctx.lineTo(gx + dx, yy - r); ctx.lineTo(gx + dx + r * 0.5, gy + 16); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; circ(ctx, gx + dx + 6, yy + 7, r); ctx.fill();
      ctx.fillStyle = rgrad(ctx, gx + dx - r * 0.35, yy - r * 0.35, 0, r * 1.3, [[0, '#f4d676'], [0.5, '#b8801c'], [1, '#4a2c08']]); circ(ctx, gx + dx, yy, r); ctx.fill(); ctx.strokeStyle = '#2a1604'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,240,180,0.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(gx + dx, yy, r * 0.78, 0, TAU); ctx.stroke();
      ctx.fillStyle = rgrad(ctx, gx + dx - r * 0.1, yy - r * 0.1, 0, r * 0.4, [[0, '#fff3b8'], [1, '#9a6a14']]); circ(ctx, gx + dx, yy, r * 0.28); ctx.fill(); } }
  // joglo ceiling: stepped beams in nested rectangles, gilt along the edges, a hanging brass lamp
  { const steps = 4, bh = wallH * 0.05; for (let k = 0; k < steps; k++) { const y = A.y + k * bh * 0.9, ins = k * A.w * 0.012; ctx.fillStyle = vgrad(ctx, y, y + bh, [[0, ['#2a1204', '#3a1c0a', '#4a2610', '#5a3214'][k]], [1, '#1a0a02']]); ctx.fillRect(A.x + ins, y, A.w - 2 * ins, bh); ctx.fillStyle = '#e8c260'; ctx.fillRect(A.x + ins, y + bh - 3, A.w - 2 * ins, 2.4); for (let x = A.x + ins + 10; x < A.x + A.w - ins; x += 24) { ctx.fillStyle = 'rgba(232,194,96,0.5)'; ctx.beginPath(); ctx.moveTo(x, y + bh * 0.55); ctx.lineTo(x + 6, y + bh * 0.2); ctx.lineTo(x + 12, y + bh * 0.55); ctx.lineTo(x + 6, y + bh * 0.85); ctx.closePath(); ctx.fill(); } } }
  // two carved teak pillars on stone bases, brass rings
  const pw = Math.min(A.w * 0.12, wallH * 0.14);
  for (const px of [A.x + pw * 0.62, A.x + A.w - pw * 0.62]) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(px - pw / 2 + 9, A.y + wallH * 0.06, pw, wallH * 0.94);
    ctx.fillStyle = hgrad(ctx, px - pw / 2, px + pw / 2, [[0, '#2a1204'], [0.22, '#a8662c'], [0.45, '#7a4620'], [0.78, '#4a2610'], [1, '#1e0c04']]); ctx.fillRect(px - pw / 2, A.y + wallH * 0.06, pw, wallH * 0.94);
    for (let k = 0; k < 40; k++) { ctx.strokeStyle = `rgba(30,12,2,${0.06 + 0.1 * hash(k)})`; ctx.lineWidth = 1.5; const y = A.y + wallH * hash(k * 2 + 1); ctx.beginPath(); ctx.moveTo(px - pw / 2 + pw * hash(k + 3), y); ctx.lineTo(px - pw / 2 + pw * hash(k + 5), y + 70 * hash(k + 7)); ctx.stroke(); }
    for (const f of [0.18, 0.7]) { ctx.fillStyle = hgrad(ctx, px - pw / 2 - 4, px + pw / 2 + 4, [[0, '#6a4410'], [0.3, '#f4d676'], [0.62, '#b8902a'], [1, '#5a3a08']]); ctx.fillRect(px - pw / 2 - 4, A.y + wallH * f, pw + 8, wallH * 0.022); }
    ctx.fillStyle = hgrad(ctx, px - pw * 0.7, px + pw * 0.7, [[0, '#4a4640'], [0.35, '#9a948a'], [0.7, '#5a564e'], [1, '#2a2620']]); ctx.fillRect(px - pw * 0.7, wallB - wallH * 0.08, pw * 1.4, wallH * 0.08);
  }
  // floor: pale stone slabs, and a batik runner under the whole play area
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(A.x, wallB - 2, A.w, 6);
  const fh = A.y + A.h - wallB; ctx.fillStyle = vgrad(ctx, wallB, A.y + A.h, [[0, '#b4a890'], [1, '#6a604c']]); ctx.fillRect(A.x, wallB, A.w, fh);
  for (let k = 1; k < 6; k++) { const yy = wallB + fh * Math.pow(k / 6, 1.4); ctx.strokeStyle = 'rgba(40,30,16,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(A.x, yy); ctx.lineTo(A.x + A.w, yy); ctx.stroke(); }
  for (let k = -7; k <= 7; k++) { ctx.strokeStyle = 'rgba(40,30,16,0.28)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(A.x + A.w / 2 + k * A.w * 0.04, wallB); ctx.lineTo(A.x + A.w / 2 + k * A.w * 0.2, A.y + A.h); ctx.stroke(); }
  speckle(ctx, A.x, wallB, A.w, fh, 150, '#2a2010', 0.25, 3, 0.8, 2.2);
  ctx.restore();
  pool(ctx, A.x + A.w / 2, wallB + fh * 0.2, A.w * 0.5, A.h * 0.26, '#ffd8a0', 0.3); vignette(ctx, A, 0.5);
}
function parang(ctx, x, y, w, h) {   // a batik mat: diagonal bands of sogan brown and indigo with cream curls
  ctx.save(); rrect(ctx, x, y, w, h, 8); ctx.clip();
  ctx.fillStyle = '#c8a46a'; ctx.fillRect(x, y, w, h);
  const s = 46;
  for (let k = -Math.ceil(h / s); k < (w + h) / s; k++) { const x0 = x + k * s; ctx.fillStyle = k % 2 ? '#4a2812' : '#1c2c4c'; ctx.beginPath(); ctx.moveTo(x0, y + h); ctx.lineTo(x0 + s * 0.5, y + h); ctx.lineTo(x0 + s * 0.5 + h, y); ctx.lineTo(x0 + h, y); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#efe0b8'; ctx.lineWidth = 2; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(x0 + s * 0.25, y + h); ctx.lineTo(x0 + s * 0.25 + h, y); ctx.stroke(); ctx.setLineDash([]); }
  speckle(ctx, x, y, w, h, 200, '#1a0c04', 0.18, 3, 0.6, 1.6);
  ctx.restore(); rrect(ctx, x, y, w, h, 8); ctx.strokeStyle = '#2a1408'; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#e8c260'; ctx.lineWidth = 1.6; rrect(ctx, x + 7, y + 7, w - 14, h - 14, 5); ctx.stroke();
}
registerDrumStage({
  id: 'kendang', match: /kendang|kendhang|gendang|kendang.?(gede|ageng|batangan)|ketipung/,
  build: (S, lanes, P) => { const zoneOf = []; return createDrumStage('kendang', S, lanes, P, {
    heroClean: true,
    dress: withLayer(teakPavilion),
    voiceOf: (i) => `kendang-${zoneOf[i] ?? 'dung'}`,
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 780, h: 960 } : { w: 1040, h: 580 }, keyOf = assignZones(K, KEN.map(([key, re]) => ({ key, re })));
      for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const R1 = tall ? 150 : 128, R2 = R1 * 0.6, Lh = tall ? 236 : 290, rot = tall ? -0.5 : -0.2, aK = 0.62, cx = tall ? 20 : 0, cy = tall ? 560 : 330;
      const at = (x, y) => { const [a, b] = rot2(x, y, rot); return [cx + a, cy + b]; };
      const by = {}; const a1 = R1 * aK, a2 = R2 * aK;
      { const [x, y] = at(-Lh, 0); by.dung = eSpot(x, y, a1 * 0.9, R1 * 0.52, rot, { apk: 0.95 }); by.tak = eRing(x, y, a1 * 1.0, R1 * 1.0, rot, 0.66, 1.0, PI / 2); }
      { const [x, y] = at(Lh, 0); by.tong = eSpot(x, y, a2 * 0.9, R2 * 0.52, rot, { apk: 0.95 }); by.ket = eRing(x, y, a2 * 1.0, R2 * 1.0, rot, 0.62, 1.0, -PI / 2); }
      { const [x, y] = at(-Lh * 0.1, -R1 * 0.55); by.body = rectSpot(x, y, Lh * 0.28, R1 * 0.16, rot, { rad: 10 }); }
      const spots = new Array(K.N).fill(null); for (let i = 0; i < K.N; i++) spots[i] = by[keyOf[i]] ?? null;
      const col = '#c28a48', strap = '#6a3216';
      const rAt = (t) => lerp(R1, R2, t) + Math.sin(PI * t) * R1 * 0.12;
      return { ref, spots, wallU: cy + R1 + (tall ? 110 : 40), draw(ctx, rt) {
        const v1 = fl(K, keyOf, rt, 'dung'), v1b = fl(K, keyOf, rt, 'tak'), v2 = fl(K, keyOf, rt, 'tong'), v2b = fl(K, keyOf, rt, 'ket'), vb = fl(K, keyOf, rt, 'body');
        const yG = cy + R1 + (tall ? 90 : 20);
        // batik mat
        { const mw = tall ? 690 : 880, mh = tall ? 420 : 250, mx = cx - mw / 2, my = yG - mh * 0.34; ctx.save(); ctx.translate(mx + mw / 2, my + mh / 2); ctx.transform(1, 0, -0.18, 0.9, 0, 0); ctx.translate(-mw / 2, -mh / 2); ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, 10, 14, mw, mh, 8); ctx.fill(); parang(ctx, 0, 0, mw, mh); ctx.restore(); }
        floorShadow(ctx, cx + 30, cy + R1 * 1.02, Lh * 1.3, 60, 0.6);
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
        const N = 48, path = () => { ctx.beginPath(); for (let k = 0; k <= N; k++) { const t = k / N; ctx.lineTo(-Lh + 2 * Lh * t, -rAt(t)); } for (let k = N; k >= 0; k--) { const t = k / N; ctx.lineTo(-Lh + 2 * Lh * t, rAt(t)); } ctx.closePath(); };
        ctx.save(); ctx.translate(8, 14); path(); ctx.fillStyle = 'rgba(0,0,0,0.34)'; ctx.fill(); ctx.restore();
        path(); ctx.fillStyle = vgrad(ctx, -R1, R1, [[0, darker(col, 0.62)], [0.14, lighter(col, 0.4)], [0.3, lighter(col, 0.16)], [0.55, col], [0.85, darker(col, 0.5)], [1, darker(col, 0.78)]]); ctx.fill();
        ctx.save(); path(); ctx.clip(); grain(ctx, -Lh, -R1, 2 * Lh, 2 * R1, darker(col, 0.7), 0.36, 17, false, 36);
        ctx.fillStyle = vgrad(ctx, -R1, R1, [[0.1, 'rgba(255,255,255,0)'], [0.2, 'rgba(255,244,214,0.3)'], [0.3, 'rgba(255,255,255,0)']]); ctx.fillRect(-Lh, -R1, 2 * Lh, 2 * R1);
        // carved bands
        for (const t of [0.08, 0.92]) { const x = -Lh + 2 * Lh * t, r = rAt(t); ctx.strokeStyle = 'rgba(60,28,6,0.65)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, -r); ctx.lineTo(x, r); ctx.stroke(); }
        ctx.restore(); path(); ctx.strokeStyle = 'rgba(40,18,4,0.85)'; ctx.lineWidth = 2.5; ctx.stroke();
        // heads
        const head = (hx, r, a, tint, edge, v, seed) => { ctx.save(); ctx.translate(hx, 0); ctx.scale(a / r, 1); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, r * 0.1, r * 0.08, r + 12, r + 12); ctx.fill(); hoop(ctx, r, r, r * 0.13, { kind: 'rope', col: '#7a4a22' }); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 0, 0, r + 1, r + 1); ctx.fill(); skinHead(ctx, r, r, { tint, edge, seed, vib: v, wear: 0.9 }); ctx.restore(); };
        head(-Lh, R1, a1, '#ecd9aa', '#a98444', v1 + v1b * 0.7, 5); head(Lh, R2, a2, '#f1e2b6', '#b89658', v2 + v2b * 0.7, 9);
        // diamond lattice of leather straps between the two hoops
        const nS = 9, pa = (k, side) => { const ph = d2r(-72 + 144 * k / (nS - 1)); const r = side < 0 ? R1 : R2, a = side < 0 ? a1 : a2; return [side * (Lh - 4) + (side < 0 ? -1 : 1) * Math.cos(ph) * a * 0.15, Math.sin(ph) * r * 0.99]; };
        for (let k = 0; k < nS; k++) { const [x0, y0] = pa(k, -1); if (k + 1 < nS) { const [x1, y1] = pa(k + 1, 1); thread(ctx, x0, y0, x1, y1, 6.5, strap); } if (k > 0) { const [x1, y1] = pa(k - 1, 1); thread(ctx, x0, y0, x1, y1, 6.5, '#8a4624'); } }
        for (let k = 0; k < nS; k++) for (const side of [-1, 1]) { const [x, y] = pa(k, side); ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, x + 2, y + 3, 6.5); ctx.fill(); ctx.fillStyle = rgrad(ctx, x - 2, y - 2, 0, 8, [[0, '#d8a060'], [1, '#5a2c10']]); circ(ctx, x, y, 6); ctx.fill(); }
        if (vb > 0.05) { ctx.fillStyle = `rgba(255,230,170,${0.3 * vb})`; rrect(ctx, -Lh * 0.38, -R1 * 0.71, Lh * 0.56, R1 * 0.32, 10); ctx.fill(); }
        ctx.restore();
        // the beating hands are not drawn; a small wooden mallet rests on the mat and a thin stick strikes the small head
        const [sx0, sy0] = at(Lh, 0), [bx0, by0] = at(-Lh, 0);
        visitStick(ctx, sx0 + 4, sy0 - 4, Math.max(v2, v2b), { ang: 2.55, dir: [0.8, -0.65], back: 120, len: tall ? 230 : 300, w: 9, col: '#d9b86e', nodes: [0.3, 0.6] });
        visitStick(ctx, bx0 - 2, by0 + 4, Math.max(v1, v1b), { ang: -0.6, dir: [-0.75, 0.7], back: 110, len: tall ? 210 : 270, w: 14, col: '#b8864a', knob: { r: 17, col: '#7a4c20' } });
        void foot; void tube; void bolt; void blob; void mix; void clamp; void rgba; void cordRim; void shiver; void headSide; void taperBody; void chromeH; void tassel; void eSector;
      } };
    },
  }); },
});
defVoice('kendang-dung', 'skin', { dur: 0.42, drop: 1.2, glide: 0.06, modes: [[1, 1, 1], [1.55, 0.45, 0.5], [2.2, 0.28, 0.4]], shell: { f: 150, q: 5, gain: 0.4, dur: 0.2 }, click: { f: 1100, gain: 0.3 }, lp: 2400, gain: 0.72 });
defVoice('kendang-tak', 'skin', { dur: 0.13, drop: 1.08, glide: 0.02, modes: [[1, 1, 1], [2.2, 0.65, 0.6], [3.3, 0.4, 0.4]], click: { f: 2800, gain: 0.8, dur: 0.02 }, lp: 6500, gain: 0.5 });
defVoice('kendang-tong', 'skin', { dur: 0.26, drop: 1.1, glide: 0.03, modes: [[1, 1, 1], [1.75, 0.5, 0.55], [2.6, 0.35, 0.45]], click: { f: 3400, gain: 0.5, dur: 0.02 }, shell: { f: 500, q: 6, gain: 0.25, dur: 0.14 }, lp: 7500, gain: 0.55 });
defVoice('kendang-ket', 'skin', { dur: 0.09, drop: 1.06, glide: 0.015, modes: [[1, 1, 1], [2.4, 0.6, 0.55], [3.6, 0.4, 0.4]], click: { f: 5000, q: 1, gain: 1.0, dur: 0.016 }, lp: 10000, gain: 0.46 });
defVoice('kendang-body', 'woodtok', { dur: 0.1, gain: 0.5, hollow: 1.6, overtone: 3.2 });

export { wallBottom, withLayer };

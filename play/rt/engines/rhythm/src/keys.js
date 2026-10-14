// Keyed and barred instruments as the play surface: xylophone bars hung over gourds, mbira tines on their board,
// carillon batons wired to bells with a pedal board, bandoneon buttons on a hand box with moving bellows.
// A player reaches for the notes about to fall due (performer.js); the instrument stands on a dressed surface (set.js).
// Cues fall onto the bar, tine tip or baton; the struck part moves (mallet, flexing tine, swinging bell, opening bellows).
import { clamp, mix, rgba, lighter, darker, glow, rrect, grain, hgrad, vgrad, rgrad, hash, ell, circ, TAU, bell as bellArt } from './art.js';
import { makeBox, makeFrame, rectSpot, circleSpot, finishSpots, hitSpots, pill, lerp } from './stagekit.js';
import { stick, hand, createPlayer } from './performer.js';
import { setting } from './set.js';
export { stick };

const VIEW = { balafon: { tilt: 0, dy: 0 }, timbila: { tilt: 0, dy: 0 }, mbira: {}, carillon: { dy: 0.0 } };
const IDS = [[/carillon/, 'carillon'], [/mbira|kalimba|likembe|sanza/, 'mbira'], [/bandoneon|accordion|concertina/, 'bandoneon'], [/timbila|amadinda|embaire|chopi/, 'timbila'], [/balafon|marimba|xylophone|gyil|kulintang/, 'balafon']];
export function keyId(key) { const k = String(key || '').toLowerCase(); for (const [re, id] of IDS) if (re.test(k)) return id; return 'balafon'; }

export function createKeyStage(id, S, lanes, P) {
  const N = lanes.length;
  const st = { id, kind: 'keys', spots: new Array(N).fill(null), voice: id === 'mbira' ? 'tine' : id === 'carillon' ? 'bell' : 'bar', F: null };
  const spots = st.spots;
  const order = lanes.map((_, i) => i).sort((a, b) => lanes[a].hz - lanes[b].hz);
  const nm = (i) => lanes[i].name.toLowerCase();
  let ref = { w: 800, h: 700 }, drawScene = () => {}, dress = { kind: 'planks' }, plr = null, player = null;
  let land = false, tall = false, built = false;

  // a falling bead with a short trail that lands on (v,u); `h` makes it slide in horizontally from (fromV)
  const drop = (ctx, t, tau, rt, v, u, from, horizontal = false) => {
    const l = lanes[t.lane], miss = t.state === 'miss';
    const a = (rt.soft ? 0.5 : 1) * (miss ? 0.35 : 1) * clamp((1.05 - tau) * 8, 0, 1) * clamp((tau + 0.25) * 6, 0, 1);
    const col = miss ? mix(l.color, '#555555', 0.6) : l.color, p = clamp(1 - tau, 0, 1.05);
    const x = horizontal ? lerp(from, v, p) : v, y = horizontal ? u : lerp(from, u, p);
    ctx.save(); ctx.globalAlpha = a * 0.5; ctx.strokeStyle = rgba(col, 0.9); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(horizontal ? from : v, horizontal ? u : from); ctx.lineTo(x, y); ctx.stroke(); ctx.restore();
    glow(ctx, x, y, 40 + 26 * p, col, 0.4 * a);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = rgba(lighter(col, 0.55), 0.95); circ(ctx, x, y, 13 + 4 * p); ctx.fill(); ctx.strokeStyle = rgba(col, 1); ctx.lineWidth = 3; ctx.stroke();
    const sc = 1 + 0.8 * clamp(tau, 0, 1);
    ctx.strokeStyle = rgba(lighter(col, 0.45), 0.9); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(v, u, 24 * sc, 0, TAU); ctx.stroke(); ctx.restore();
  };
  const eachCue = (rt, fn) => {
    for (let k = rt.list.length - 1; k >= 0; k--) {
      const t = rt.list[k];
      if (t.state && t.state !== 'pending' && t.state !== 'miss') continue;
      const tau = (t.t - rt.clock) / rt.look;
      if (tau > 1.0 || tau < -0.25) continue;
      fn(t, tau);
    }
  };
  // a gourd resonator: a ball with a neck, a stitched cap and a small hole closed with membrane
  const gourd = (ctx, x, y, r, timb, tone) => {
    ctx.fillStyle = 'rgba(0,0,0,0.34)'; ell(ctx, x + 5, y + 8, r, r * 1.08); ctx.fill();
    ctx.fillStyle = rgrad(ctx, x, y, 2, r * 1.2, timb ? [[0, '#f2dcae'], [0.6, '#c89a52'], [1, '#6a4416']] : [[0, '#ecc884'], [0.6, '#a8742e'], [1, '#4a2c0c']], x - r * 0.35, y - r * 0.38);
    ell(ctx, x, y, r, r * 1.08); ctx.fill();
    ctx.strokeStyle = 'rgba(70,40,10,0.35)'; ctx.lineWidth = 1.5; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x, y, r * (k / 4), r * 1.08, 0, -1.2, 1.2); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ell(ctx, x - r * 0.34, y - r * 0.4, r * 0.24, r * 0.12); ctx.fill();
    if (!timb) { ctx.fillStyle = 'rgba(245,235,205,0.65)'; circ(ctx, x, y - r * 0.28, r * 0.26); ctx.fill(); ctx.strokeStyle = 'rgba(70,40,10,0.75)'; ctx.lineWidth = 1.5; ctx.stroke(); }
    void tone;
  };
  // a wooden bar in its orientation: lit upper left, rounded ends, bevel highlight, cord holes and a lane-colour tab
  const bar = (ctx, x, y, w, h, base, col, f, seed, vertical) => {
    const w2 = mix(base, col, 0.18), r = Math.min(w, h) * 0.2;
    ctx.fillStyle = 'rgba(0,0,0,0.42)'; rrect(ctx, x + 4, y + 7, w, h, r); ctx.fill();
    ctx.fillStyle = vertical ? hgrad(ctx, x, x + w, [[0, darker(w2, 0.5)], [0.3, lighter(w2, 0.3)], [0.65, w2], [1, darker(w2, 0.55)]]) : vgrad(ctx, y, y + h, [[0, lighter(w2, 0.28)], [0.35, w2], [1, darker(w2, 0.55)]]);
    rrect(ctx, x, y, w, h, r); ctx.fill();
    ctx.save(); rrect(ctx, x, y, w, h, r); ctx.clip();
    grain(ctx, x, y, w, h, darker(w2, 0.7), 0.3, seed * 5 + 2, vertical, Math.max(4, Math.round((vertical ? w : h) / 7)));
    if (f > 0.02) { ctx.fillStyle = rgba(lighter(col, 0.5), 0.5 * f); ctx.fillRect(x, y, w, h); }
    ctx.restore();
    ctx.strokeStyle = rgba(lighter(w2, 0.6), 0.55); ctx.lineWidth = 1.5; rrect(ctx, x, y, w, h, r); ctx.stroke();
    ctx.fillStyle = 'rgba(15,8,2,0.75)';
    if (vertical) { circ(ctx, x + w / 2, y + h * 0.22, 3.4); ctx.fill(); circ(ctx, x + w / 2, y + h * 0.78, 3.4); ctx.fill(); ctx.fillStyle = rgba(col, 0.95); rrect(ctx, x + w * 0.18, y + 6, w * 0.64, 7, 3); ctx.fill(); }
    else { circ(ctx, x + w * 0.22, y + h / 2, 3.4); ctx.fill(); circ(ctx, x + w * 0.78, y + h / 2, 3.4); ctx.fill(); ctx.fillStyle = rgba(col, 0.95); rrect(ctx, x + 6, y + h * 0.18, 7, h * 0.64, 3); ctx.fill(); }
  };

  function sceneBars() {
    const timb = id === 'timbila';
    const wood = timb ? '#c4915a' : S.wood;
    const rank = new Array(N); order.forEach((lane, r) => { rank[lane] = r; });
    dress = timb ? { kind: 'earth', base: '#8a6038', rugKind: 'zigzag', rugBase: '#3a2a1c', rugA: '#e8c070', rugB: '#6a8a4a', light: '#ffd18a' } : { kind: 'earth', base: '#7a5836', rugKind: 'stripes', rugBase: '#4a2c1a', rugA: '#e0b878', rugB: '#8a3a22', light: '#ffd18a' };
    if (!tall) {
      const bw = clamp(900 / N, 44, 108), gap = bw * 0.14, total = N * bw + (N - 1) * gap;
      const Lmax = 340, Lmin = 210, mid = 250;
      ref = { w: Math.max(620, total + 120), h: 600 };
      const geo = lanes.map((_, i) => { const r = rank[i], t = N > 1 ? r / (N - 1) : 0, L = lerp(Lmax, Lmin, t), v = -total / 2 + r * (bw + gap) + bw / 2; return { v, L, u0: mid - L / 2 }; });
      lanes.forEach((_, i) => { const g = geo[i]; spots[i] = rectSpot(g.v, mid, bw / 2 + gap / 2, g.L / 2, { geo: g, labelV: g.v, labelU: g.u0 + 30 }); });
      plr = { tool: 'stick', toolLen: 150, toolW: 15, wood: '#e6c58e', head: '#7a2c1a', headR: 1.05, shirt: '#b8422a', trim: '#f0d060', headwear: 'wrap', hat: '#1f5a3c', hands: 2, sit: 0.0 };
      drawScene = (ctx, rt) => {
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 0, ref.h - 22, total / 2 + 90, 24); ctx.fill();
        const railW = total + 90;
        for (const u of [mid - Lmax * 0.34, mid + Lmax * 0.34]) {
          ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, -railW / 2 + 6, u + 6, railW, 22, 10); ctx.fill();
          ctx.fillStyle = vgrad(ctx, u, u + 22, [[0, lighter('#7a4a22', 0.3)], [1, '#2a170a']]); rrect(ctx, -railW / 2, u, railW, 22, 10); ctx.fill();
        }
        lanes.forEach((l, i) => { const g = geo[i], gr = clamp(bw * 0.62 * (g.L / 380), 24, 68), gu = mid + g.L / 2 + gr + 16; gourd(ctx, g.v, gu, gr, timb); });
        lanes.forEach((l, i) => { const g = geo[i], f = rt.flash[i]; bar(ctx, g.v - bw / 2, g.u0 + 2 * f, bw, g.L, wood, l.color, f, i, true); if (f > 0.03) glow(ctx, g.v, g.u0 + g.L / 2, g.L * 0.7, l.color, 0.45 * f); });
        eachCue(rt, (t, tau) => { const g = geo[t.lane]; drop(ctx, t, tau, rt, g.v, mid, 30); });
      };
    } else {
      const p = clamp(640 / N, 40, 74), bt = p * 0.88, total = N * p;
      const Lmax = 400, Lmin = 250, vc = 0, u0 = 60;
      ref = { w: Lmax + 250, h: total + 120 };
      const geo = lanes.map((_, i) => { const r = rank[i], t = N > 1 ? r / (N - 1) : 0, L = lerp(Lmax, Lmin, t), u = u0 + (N - 1 - r) * p + p / 2; return { v: vc, L, u }; });
      lanes.forEach((_, i) => { const g = geo[i]; spots[i] = rectSpot(g.v, g.u, g.L / 2, p / 2, { geo: g, labelV: g.v, labelU: g.u }); });
      plr = { tool: 'stick', toolLen: 140, toolW: 14, wood: '#e6c58e', head: '#7a2c1a', headR: 1.05, shirt: '#b8422a', trim: '#f0d060', headwear: 'wrap', hat: '#1f5a3c', hands: 2, side: 'right', sit: 0.0 };
      drawScene = (ctx, rt) => {
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 12, ref.h - 14, ref.w * 0.4, 20); ctx.fill();
        const rv = Lmax * 0.34;
        for (const v of [vc - rv, vc + rv]) {
          ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, v - 11 + 6, u0 - 20 + 6, 22, total + 40, 10); ctx.fill();
          ctx.fillStyle = hgrad(ctx, v - 11, v + 11, [[0, lighter('#7a4a22', 0.3)], [1, '#2a170a']]); rrect(ctx, v - 11, u0 - 20, 22, total + 40, 10); ctx.fill();
        }
        lanes.forEach((l, i) => { const g = geo[i], gr = clamp(p * 0.6 * (g.L / 380), 18, 44); gourd(ctx, g.v - g.L / 2 - gr - 12, g.u, gr, timb); });
        lanes.forEach((l, i) => { const g = geo[i], f = rt.flash[i]; bar(ctx, g.v - g.L / 2 + 2 * f, g.u - bt / 2, g.L, bt, wood, l.color, f, i, false); if (f > 0.03) glow(ctx, g.v, g.u, g.L * 0.7, l.color, 0.45 * f); });
        eachCue(rt, (t, tau) => { const g = geo[t.lane]; drop(ctx, t, tau, rt, g.v, g.u, g.v + Lmax / 2 + 120, true); });
      };
    }
  }

  function sceneMbira() {
    ref = { w: 800, h: land ? 580 : 760 };
    dress = { kind: 'earth', base: '#7a5230', rugKind: 'kente', rugBase: '#4a1c14', rugA: '#e8b84a', rugB: '#2a6a4a', light: '#ffd18a' };
    const bw = 700, bh = land ? 380 : 450, cu = land ? 290 : 380;
    const rank = new Array(N); order.forEach((lane, r) => { rank[lane] = r; });
    const pitch = Math.max(40, Math.min(64, (bw - 110) / Math.max(1, N)));
    const brU = cu + 40;
    lanes.forEach((_, i) => {
      const r = rank[i], t = N > 1 ? r / (N - 1) : 0.5, v = (r - (N - 1) / 2) * pitch;
      const back = r % 2 === 0, len = ((back ? 300 : 230) * (1 - 0.18 * Math.abs(t - 0.5) * 2) - 20 * (1 - t)) * (land ? 0.8 : 1);
      spots[i] = circleSpot(v, brU - len + 18, 33, { len, v, tipU: brU - len, back });
    });
    plr = { tool: 'thumb', side: 'bottom', hands: 2, shirt: '#8a3a22', trim: '#f0d060', sleeve: 'short', sit: -0.02, shoulder: 1.1 };
    drawScene = (ctx, rt) => {
      const wood = S.wood;
      ctx.fillStyle = 'rgba(0,0,0,0.34)'; ell(ctx, 0, ref.h - 30, 400, 24); ctx.fill();
      // the gourd resonator the board sits in: a big bowl with a turned-out rim
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 14, cu + (land ? 168 : 218), 410, land ? 205 : 255); ctx.fill();
      ctx.fillStyle = rgrad(ctx, 0, cu + 190, 30, 440, [[0, '#e4b868'], [0.6, '#9a6428'], [1, '#3a2008']], -90, cu + 90); ell(ctx, 0, cu + (land ? 150 : 200), 400, land ? 200 : 250); ctx.fill();
      ctx.strokeStyle = 'rgba(255,225,170,0.35)'; ctx.lineWidth = 4; ctx.stroke();
      ctx.save(); ell(ctx, 0, cu + (land ? 150 : 200), 400, land ? 200 : 250); ctx.clip(); grain(ctx, -400, cu - 60, 800, 520, '#2a1206', 0.3, 12, false, 16); ctx.restore();
      // the board
      ctx.fillStyle = 'rgba(0,0,0,0.38)'; rrect(ctx, -bw / 2 + 8, cu - bh / 2 + 12, bw, bh, 34); ctx.fill();
      ctx.fillStyle = hgrad(ctx, -bw / 2, bw / 2, [[0, darker(wood, 0.5)], [0.2, lighter(wood, 0.2)], [0.55, wood], [0.9, darker(wood, 0.35)], [1, darker(wood, 0.6)]]); rrect(ctx, -bw / 2, cu - bh / 2, bw, bh, 34); ctx.fill();
      ctx.save(); rrect(ctx, -bw / 2, cu - bh / 2, bw, bh, 34); ctx.clip(); grain(ctx, -bw / 2, cu - bh / 2, bw, bh, '#2a1206', 0.35, 21, false, 14);
      // carved ornament: a row of triangles under the bar and a zigzag along the edge
      ctx.fillStyle = 'rgba(30,14,4,0.45)'; for (let k = -6; k <= 6; k++) { const x = k * 46, y = cu + bh * 0.2; ctx.beginPath(); ctx.moveTo(x - 18, y); ctx.lineTo(x + 18, y); ctx.lineTo(x, y + 34); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,225,170,0.45)'; ctx.lineWidth = 3; rrect(ctx, -bw / 2, cu - bh / 2, bw, bh, 34); ctx.stroke();
      ctx.fillStyle = '#100803'; ell(ctx, 0, cu + bh * 0.32, 70, 26); ctx.fill(); ctx.strokeStyle = 'rgba(232,211,160,0.8)'; ctx.lineWidth = 3; ctx.stroke();
      // rattling bottle caps strung on wire loops at both ends
      const shake = lanes.reduce((m, _, i) => Math.max(m, rt.flash[i]), 0);
      for (const d of [-1, 1]) for (let k = 0; k < 3; k++) {
        const x = d * (bw / 2 - 70 - k * 36) + Math.sin(rt.anim * 55 + k * 2) * 3 * shake, y = cu + bh * 0.32 + k * 18;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; circ(ctx, x + 3, y + 4, 16); ctx.fill();
        ctx.fillStyle = rgrad(ctx, x, y, 1, 17, [[0, '#f4f4f0'], [0.6, '#b8bcc4'], [1, '#6a6e78']], x - 5, y - 5); circ(ctx, x, y, 16); ctx.fill();
        ctx.strokeStyle = 'rgba(60,60,70,0.7)'; ctx.lineWidth = 2; ctx.stroke(); circ(ctx, x, y, 6); ctx.stroke();
      }
      // holding bar across the tines
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, -bw / 2 + 62, brU - 6, bw - 112, 30, 12); ctx.fill();
      ctx.fillStyle = vgrad(ctx, brU - 18, brU + 20, [[0, '#d8dce2'], [0.5, '#8a909a'], [1, '#3a3e46']]); rrect(ctx, -bw / 2 + 56, brU - 12, bw - 112, 26, 12); ctx.fill();
      // tines: metal strips of different lengths, tips flattened for the thumbs
      lanes.forEach((l, i) => {
        const sp = spots[i], f = rt.flash[i], w = 24, v = sp.v + Math.sin(rt.anim * 90 + i) * 2.6 * f;
        ctx.fillStyle = 'rgba(0,0,0,0.38)'; rrect(ctx, v - w / 2 + 5, sp.tipU + 6, w, sp.len + 8, 10); ctx.fill();
        ctx.fillStyle = hgrad(ctx, v - w / 2, v + w / 2, [[0, '#5c646e'], [0.35, '#f0f3f6'], [0.7, '#a6afba'], [1, '#444c56']]); rrect(ctx, v - w / 2, sp.tipU, w, sp.len + 20, 10); ctx.fill();
        ctx.fillStyle = hgrad(ctx, v - 20, v + 20, [[0, '#7a828c'], [0.5, '#fafbfc'], [1, '#6a727c']]); rrect(ctx, v - 20, sp.tipU - 2, 40, 28, 12); ctx.fill();
        ctx.fillStyle = rgba(l.color, 0.95); circ(ctx, v, sp.tipU + 36, 5); ctx.fill();
        if (f > 0.03) glow(ctx, v, sp.tipU + 30, 90, l.color, 0.5 * f);
      });
      eachCue(rt, (t, tau) => { const sp = spots[t.lane]; drop(ctx, t, tau, rt, sp.v, sp.tipU + 10, sp.tipU - 150); });
    };
  }

  function sceneCarillon() {
    ref = { w: 920, h: land ? 700 : 980 };
    dress = { kind: 'stone', base: '#4a4640', accent: '#6a665c', size: 110, rugKind: null, light: '#ffe0a8', vig: 0.6 };
    const archB = land ? 400 : 520;
    const pedals = lanes.map((_, i) => i).filter((i) => /pedal/.test(nm(i)));
    const batons = lanes.map((_, i) => i).filter((i) => !pedals.includes(i)).sort((a, b) => lanes[a].hz - lanes[b].hz);
    const bu = land ? 450 : 560, pu = land ? 600 : 830;
    const bwid = Math.min(96, 760 / Math.max(1, batons.length));
    batons.forEach((i, k) => {
      const v = (k - (batons.length - 1) / 2) * (bwid + 8);
      spots[i] = rectSpot(v, bu, bwid / 2, 52, { baton: true, bell: { v, u: (land ? 170 : 210) + (k % 2) * (land ? 60 : 90), w: (land ? 100 : 128) - (land ? 52 : 70) * (k / Math.max(1, batons.length - 1)) * 0.9 } });
    });
    pedals.forEach((i, k) => {
      const v = (k - (pedals.length - 1) / 2) * 240;
      spots[i] = rectSpot(v, pu, 105, 44, { pedal: true, bell: { v: v * 0.9, u: land ? 270 : 400, w: land ? 120 : 150 } });
    });
    plr = {
      tool: 'fist', side: 'bottom', hands: 2, shirt: '#3a3a52', trim: '#d8b868', sleeve: 'long', sit: 0.0, shoulder: 1.2,
      aim: (i, sp, G) => { if (sp.pedal) return []; return [{ h: sp.x < G.cx ? 0 : 1, x: sp.x, y: sp.y }]; },
    };
    drawScene = (ctx, rt) => {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 0, ref.h - 30, 440, 24); ctx.fill();
      const arch = (c) => { c.beginPath(); c.moveTo(-440, archB); c.lineTo(-440, 140); c.quadraticCurveTo(-440, 20, 0, 20); c.quadraticCurveTo(440, 20, 440, 140); c.lineTo(440, archB); };
      arch(ctx); ctx.strokeStyle = 'rgba(0,0,0,0.38)'; ctx.lineWidth = 36; ctx.save(); ctx.translate(8, 8); ctx.stroke(); ctx.restore();
      ctx.strokeStyle = hgrad(ctx, -440, 440, [[0, '#4a2c14'], [0.5, '#9a6a34'], [1, '#4a2c14']]); ctx.lineWidth = 32; arch(ctx); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,225,170,0.3)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = vgrad(ctx, 92, 124, [[0, '#9a6a34'], [1, '#2a170a']]); rrect(ctx, -420, 92, 840, 30, 10); ctx.fill();
      const ring = (sp, i) => {
        const l = lanes[i], f = rt.flash[i], b = sp.bell, w = b.w, h = Math.min(w * 1.15, 160), top = b.u - h * 0.5;
        ctx.strokeStyle = rgba('#d9c9a0', 0.8); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sp.v, sp.u - 52); ctx.lineTo(b.v, top + h * 0.9); ctx.stroke();
        bellArt(ctx, S, b.v, top - 12, w, h, l.color, f, Math.sin(rt.anim * 14 + i) * 0.22 * f);
      };
      batons.forEach((i) => ring(spots[i], i));
      pedals.forEach((i) => { const sp = spots[i], l = lanes[i], f = rt.flash[i], b = sp.bell; ctx.strokeStyle = rgba('#d9c9a0', 0.8); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sp.v, sp.u - 40); ctx.lineTo(b.v, b.u + 80); ctx.stroke(); bellArt(ctx, S, b.v, b.u - 110, b.w, b.w * 1.1, l.color, f, Math.sin(rt.anim * 10 + i) * 0.18 * f); });
      // baton keyboard: wooden handles pressed with the side of the fist
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, -436, bu - 62, 880, 150, 22); ctx.fill();
      ctx.fillStyle = vgrad(ctx, bu - 70, bu + 80, [[0, '#3a200e'], [1, '#150a04']]); rrect(ctx, -440, bu - 70, 880, 150, 22); ctx.fill();
      batons.forEach((i) => {
        const sp = spots[i], l = lanes[i], f = rt.flash[i], x = sp.v - bwid / 2 + 3, w = bwid - 6, y = sp.u - 56 + 8 * f;
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, x + 3, y + 6, w, 112, 14); ctx.fill();
        ctx.fillStyle = hgrad(ctx, x, x + w, [[0, darker('#c8964a', 0.4)], [0.35, lighter('#c8964a', 0.35)], [1, darker('#c8964a', 0.5)]]); rrect(ctx, x, y, w, 112, 14); ctx.fill();
        ctx.fillStyle = rgba(l.color, 0.5 + 0.5 * f); rrect(ctx, x + 6, y + 8, w - 12, 10, 4); ctx.fill();
        ctx.strokeStyle = 'rgba(255,240,200,0.5)'; ctx.lineWidth = 1.5; rrect(ctx, x, y, w, 112, 14); ctx.stroke();
        if (f > 0.03) glow(ctx, sp.v, y + 56, 90, l.color, 0.5 * f);
      });
      if (pedals.length) {
        ctx.fillStyle = vgrad(ctx, pu - 60, pu + 60, [[0, '#2a170a'], [1, '#100804']]); rrect(ctx, -440, pu - 62, 880, 124, 20); ctx.fill();
        pedals.forEach((i) => {
          const sp = spots[i], l = lanes[i], f = rt.flash[i], x = sp.v - 105, y = sp.u - 38 + 9 * f;
          ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, x + 4, y + 7, 210, 76, 12); ctx.fill();
          ctx.fillStyle = hgrad(ctx, x, x + 210, [[0, darker('#b8863c', 0.45)], [0.5, lighter('#b8863c', 0.3)], [1, darker('#b8863c', 0.5)]]); rrect(ctx, x, y, 210, 76, 12); ctx.fill();
          ctx.fillStyle = rgba(l.color, 0.5 + 0.5 * f); rrect(ctx, x + 12, y + 8, 186, 9, 4); ctx.fill();
          if (f > 0.03) glow(ctx, sp.v, sp.u, 140, l.color, 0.45 * f);
        });
        // two shoes: the player's feet rest at the ends of the pedal board and stamp the pedal that is sounding
        const sole = (x, y, down) => {
          ctx.fillStyle = 'rgba(0,0,0,0.4)'; ell(ctx, x + 8, y + 22, 54, 20); ctx.fill();
          ctx.fillStyle = hgrad(ctx, x - 50, x + 50, [[0, '#0c0806'], [0.4, '#5a4a3c'], [1, '#14100c']]);
          ctx.beginPath(); ctx.moveTo(x - 46, y - 24); ctx.quadraticCurveTo(x - 50, y + 20, x - 30, y + 28); ctx.lineTo(x + 40, y + 28); ctx.quadraticCurveTo(x + 62, y + 26, x + 56, y - 4); ctx.quadraticCurveTo(x + 40, y - 30, x - 10, y - 30); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(255,230,190,0.35)'; ctx.lineWidth = 2; ctx.stroke();
          void down;
        };
        const act = pedals.reduce((m, i) => (rt.flash[i] > (m?.f ?? 0.05) ? { i, f: rt.flash[i] } : m), null);
        const lx = -ref.w * 0.36, rx = ref.w * 0.36;
        sole(act && spots[act.i].v < 0 ? spots[act.i].v : lx, pu + 90 + (act && spots[act.i].v < 0 ? -50 * act.f : 0), act);
        sole(act && spots[act.i].v >= 0 ? spots[act.i].v : rx, pu + 90 + (act && spots[act.i].v >= 0 ? -50 * act.f : 0), act);
      }
      eachCue(rt, (t, tau) => {
        const sp = spots[t.lane], b = sp.bell, l = lanes[t.lane], miss = t.state === 'miss';
        const a = (rt.soft ? 0.5 : 1) * (miss ? 0.35 : 1) * clamp((1.05 - tau) * 8, 0, 1) * clamp((tau + 0.25) * 6, 0, 1);
        const col = miss ? mix(l.color, '#555555', 0.6) : l.color, p = clamp(1 - tau, 0, 1.05), top = sp.pedal ? b.u + 70 : b.u + 40;
        const x = lerp(b.v, sp.v, p), y = lerp(top, sp.u - (sp.pedal ? 24 : 40), p);
        glow(ctx, x, y, 44, col, 0.4 * a);
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = rgba(lighter(col, 0.55), 0.95); circ(ctx, x, y, 14); ctx.fill(); ctx.strokeStyle = rgba(col, 1); ctx.lineWidth = 3; ctx.stroke();
        const sc = 1 + 0.8 * clamp(tau, 0, 1); ctx.strokeStyle = rgba(lighter(col, 0.45), 0.9); ctx.lineWidth = 2.5; rrect(ctx, sp.v - sp.hw * sc, sp.u - sp.hh * 0.9 * sc, sp.hw * 2 * sc, sp.hh * 1.8 * sc, 14); ctx.stroke(); ctx.restore();
      });
    };
  }

  // The bandoneon lies along the long axis: left (bass) box, black bellows, right (treble) box with the buttons.
  let rotFrame = false;
  function sceneBandoneon() {
    rotFrame = true;
    dress = { kind: 'pub', base: '#2a1a12', rugKind: 'diamond', rugBase: '#4a1220', rugA: '#c8a050', rugB: '#1a1a2a', light: '#ffc890', vig: 0.65 };
    const dir = lanes.map((_, i) => (/pull/.test(nm(i)) ? 1 : /push/.test(nm(i)) ? -1 : 0));
    const bass = lanes.map((_, i) => i).filter((i) => /marcato|bass|low/.test(nm(i)));
    const treble = lanes.map((_, i) => i).filter((i) => !bass.includes(i)).sort((a, b) => lanes[a].hz - lanes[b].hz);
    let open = 0, lastAnim = 0, geo = { bw: 400, bl: 400, H: 900, W: 600 };
    st.place = (F) => {
      const { W, H } = F, bw = Math.min(W * 0.94, 470), bl = Math.min(H * 0.34, 470);
      geo = { bw, bl, W, H };
      const cols = 3, per = Math.ceil(treble.length / cols), pitch = Math.min(bw / 3.3, 92), u0 = H - bl;
      treble.forEach((i, k) => {
        const c = k % cols, r = Math.floor(k / cols);
        spots[i] = circleSpot((c - 1) * pitch * 1.02, u0 + bl / 2 + (r - (per - 1) / 2) * pitch + (c % 2 ? pitch / 2 : 0) - pitch / 4, pitch * 0.42, { dir: dir[i] });
      });
      bass.forEach((i, k) => { spots[i] = circleSpot(0, bl / 2 + (k - (bass.length - 1) / 2) * 110, 52, { dir: dir[i], bass: true }); });
    };
    drawScene = (ctx, rt) => {
      const { bw, bl, H } = geo, wood = '#241c18';
      const boxDraw = (u0, hand_) => {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, -bw / 2 + 10, u0 + 14, bw, bl, 30); ctx.fill();
        ctx.fillStyle = hgrad(ctx, -bw / 2, bw / 2, [[0, '#0c0806'], [0.3, '#4a3a30'], [0.6, wood], [1, '#0a0605']]); rrect(ctx, -bw / 2, u0, bw, bl, 30); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.08)'; rrect(ctx, -bw / 2 + 8, u0 + 6, bw * 0.5, 14, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(215,180,110,0.8)'; ctx.lineWidth = 5; rrect(ctx, -bw / 2 + 12, u0 + 12, bw - 24, bl - 24, 22); ctx.stroke();
        ctx.strokeStyle = 'rgba(215,180,110,0.5)'; ctx.lineWidth = 3;
        for (const [sx, sy] of [[-1, 0], [1, 0], [-1, 1], [1, 1]]) { const x = sx * (bw / 2 - 26), y = u0 + (sy ? bl - 26 : 26), dy = sy ? -1 : 1; ctx.beginPath(); ctx.moveTo(x, y + dy * 70); ctx.quadraticCurveTo(x, y, x - sx * 70, y); ctx.stroke(); }
        // a leather hand strap across the side and the hand that holds it
        const sx = hand_ * (bw / 2 + 4);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, sx - 22 + 5, u0 + bl * 0.2 + 8, 44, bl * 0.6, 14); ctx.fill();
        ctx.fillStyle = hgrad(ctx, sx - 22, sx + 22, [[0, '#2a1608'], [0.5, '#8a5a2a'], [1, '#2a1608']]); rrect(ctx, sx - 22, u0 + bl * 0.2, 44, bl * 0.6, 14); ctx.fill();
        ctx.strokeStyle = 'rgba(240,210,150,0.5)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, u0 + bl * 0.24); ctx.lineTo(sx, u0 + bl * 0.76); ctx.stroke(); ctx.setLineDash([]);
      };
      const dtv = clamp(rt.anim - lastAnim, 0, 0.1); lastAnim = rt.anim;
      let want = open;
      lanes.forEach((_, i) => { if (rt.flash[i] > 0.3 && dir[i]) want = dir[i]; });
      open += (want - open) * clamp(dtv * 8, 0, 1);
      const bu0 = bl, bu1 = H - bl, folds = 18, amp = 6 + 14 * (1 - Math.abs(open)) + 6 * Math.abs(open), bwid = bw * (0.92 - 0.06 * open);
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, -bwid / 2 + 8, bu0 + 12, bwid, bu1 - bu0, 12); ctx.fill();
      for (let k = 0; k < folds; k++) {
        const u0 = lerp(bu0, bu1, k / folds), u1 = lerp(bu0, bu1, (k + 1) / folds);
        ctx.fillStyle = vgrad(ctx, u0, u1, [[0, k % 2 ? '#1a1412' : '#3a2e28'], [1, k % 2 ? '#0c0908' : '#1a1412']]);
        ctx.beginPath(); ctx.moveTo(-bwid / 2 + (k % 2 ? amp : -amp), u0); ctx.lineTo(bwid / 2 + (k % 2 ? -amp : amp), u0); ctx.lineTo(bwid / 2 + (k % 2 ? amp : -amp), u1); ctx.lineTo(-bwid / 2 + (k % 2 ? -amp : amp), u1); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(238,230,210,0.5)'; ctx.lineWidth = 2; ctx.stroke();
      }
      boxDraw(0, -1); boxDraw(H - bl, 1);
      lanes.forEach((l, i) => {
        const sp = spots[i], f = rt.flash[i], r = sp.r * 0.9, x = sp.v, y = sp.u;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; circ(ctx, x + 2, y + 5, r + 6); ctx.fill();
        ctx.fillStyle = rgrad(ctx, x, y, 2, r + 8, [[0, '#8a909a'], [0.6, '#4a505a'], [1, '#1a1e24']], x - 8, y - 8); circ(ctx, x, y, r + 7); ctx.fill();
        ctx.fillStyle = rgrad(ctx, x, y, 2, r, [[0, f > 0.02 ? lighter(l.color, 0.8) : '#ffffff'], [0.6, f > 0.02 ? lighter(l.color, 0.3) : '#e8e0d0'], [1, f > 0.02 ? l.color : '#a89e8a']], x - r * 0.3, y - r * 0.35); circ(ctx, x, y, r); ctx.fill();
        ctx.strokeStyle = rgba(l.color, 0.95); ctx.lineWidth = 4; ctx.stroke();
        if (sp.dir) { ctx.fillStyle = sp.dir > 0 ? '#e0b030' : '#40a6d8'; const ax = x + r * 0.85, ay = y - r * 0.85; circ(ctx, ax, ay, 14); ctx.fill(); ctx.strokeStyle = '#10161c'; ctx.lineWidth = 3; const s = sp.dir; ctx.beginPath(); ctx.moveTo(ax - 7 * s, ay); ctx.lineTo(ax + 6 * s, ay); ctx.moveTo(ax + 1 * s, ay - 6); ctx.lineTo(ax + 7 * s, ay); ctx.lineTo(ax + 1 * s, ay + 6); ctx.stroke(); }
        if (f > 0.03) glow(ctx, x, y, 110, l.color, 0.5 * f);
      });
      // the two hands: the left hand on the bass box, the right on the treble box, fingers over the buttons, moving with the bellows
      const lift = (v) => 14 * v;
      hand(ctx, -bw / 2 + 4, bl * 0.5 + lift(open), 96, Math.PI / 2, 0.97, '#d89a70');
      hand(ctx, bw / 2 - 4, H - bl * 0.5 - lift(open), 96, -Math.PI / 2, 0.97, '#d89a70');
      eachCue(rt, (t, tau) => { const sp = spots[t.lane]; drop(ctx, t, tau, rt, sp.v, sp.u, sp.u - 260); });
    };
  }

  const BUILD = { balafon: sceneBars, timbila: sceneBars, mbira: sceneMbira, carillon: sceneCarillon, bandoneon: sceneBandoneon };
  const build = () => {
    for (let i = 0; i < N; i++) spots[i] = null;
    plr = null; rotFrame = false;
    (BUILD[id] ?? sceneBars)();
    for (let i = 0; i < N; i++) if (!spots[i]) spots[i] = circleSpot(0, 40 + 50 * i, 30);
    player = plr ? createPlayer({ key: `${P.instrument ?? ''}${id}`, ...plr }) : null;
  };

  st.layout = (area) => {
    const nl = area.w > area.h * 1.45, nt = area.h > area.w * 0.95;
    if (nl !== land || nt !== tall || !built) { land = nl; tall = nt; built = true; build(); }
    if (rotFrame) { st.F = makeFrame(area, { top: 40, bottom: 10, side: 12, tilt: 0.3, dx: 0.04, zoom: 0.92 }); st.place(st.F); } else st.F = makeBox(area, ref.w, ref.h, { top: 40, bottom: 10, side: 12, ...(VIEW[id] ?? {}) });
    finishSpots(st.F, spots);
  };
  st.hit = (x, y) => (st.F ? hitSpots(st.F, spots, x, y) : -1);
  st.anchor = (i) => ({ x: spots[i]?.x ?? 0, y: spots[i]?.y ?? 0 });

  st.draw = (g, rt) => {
    const { ctx } = g, F = st.F;
    if (!F) return;
    setting(ctx, F, dress.kind, S, rt, dress);
    if (player) { player.update(F, rt, spots, lanes); player.back(ctx, F, rt); }
    ctx.save(); F.apply(ctx); drawScene(ctx, rt); ctx.restore();
    if (player) player.front(ctx, F, rt, spots);
    const size = g.px(15);
    lanes.forEach((l, i) => {
      const sp = spots[i];
      let v = sp.v, u = sp.u;
      if (sp.labelV != null) { v = sp.labelV; u = sp.labelU; }
      else if (sp.geo) u = sp.geo.u0 + 34;
      if (sp.tipU != null) u = sp.tipU + 70;
      const [x, y] = F.map(v, u);
      pill(ctx, l.name, x, y, Math.max(46, (sp.hw ? sp.hw * 2 : 80) * (F.scale ?? 1)), size, l.color, rt.flash[i]);
    });
  };
  return st;
}

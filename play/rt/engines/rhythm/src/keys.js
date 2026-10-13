// Keyed and barred instruments as the play surface: xylophone bars hung over gourds, mbira tines on their board,
// carillon batons wired to bells with a pedal board, bandoneon buttons on a hand box with moving bellows.
// Cues fall onto the bar, tine tip or baton; the struck part moves (mallet, flexing tine, swinging bell, opening bellows).
import { clamp, mix, rgba, lighter, darker, glow, rrect, grain, hgrad, vgrad, rgrad, hash, ell, circ, TAU, bell as bellArt } from './art.js';
import { makeBox, makeFrame, rectSpot, circleSpot, finishSpots, hitSpots, pill, lerp } from './stagekit.js';
import { stick } from './pads.js';

const VIEW = { balafon: { tilt: -0.14, dy: -0.04 }, timbila: { tilt: 0.1, dy: 0.05 }, mbira: { dx: 0.0, dy: -0.12, zoom: 0.9, tilt: -0.3 }, carillon: { dy: 0.0 } };
const IDS = [[/carillon/, 'carillon'], [/mbira|kalimba|likembe|sanza/, 'mbira'], [/bandoneon|accordion|concertina/, 'bandoneon'], [/timbila|amadinda|embaire|chopi/, 'timbila'], [/balafon|marimba|xylophone|gyil|kulintang/, 'balafon']];
export function keyId(key) { const k = String(key || '').toLowerCase(); for (const [re, id] of IDS) if (re.test(k)) return id; return 'balafon'; }

export function createKeyStage(id, S, lanes, P) {
  const N = lanes.length;
  const st = { id, kind: 'keys', spots: new Array(N).fill(null), voice: id === 'mbira' ? 'tine' : id === 'carillon' ? 'bell' : 'bar', F: null };
  const spots = st.spots;
  const order = lanes.map((_, i) => i).sort((a, b) => lanes[a].hz - lanes[b].hz);
  const nm = (i) => lanes[i].name.toLowerCase();
  let ref = { w: 800, h: 700 }, drawScene = () => {};

  // a falling bead with a short trail that lands on (v,u)
  const drop = (ctx, t, tau, rt, v, u, fromU, a0 = 1) => {
    const l = lanes[t.lane], miss = t.state === 'miss';
    const a = a0 * (rt.soft ? 0.5 : 1) * (miss ? 0.35 : 1) * clamp((1.05 - tau) * 8, 0, 1) * clamp((tau + 0.25) * 6, 0, 1);
    const col = miss ? mix(l.color, '#555555', 0.6) : l.color, p = clamp(1 - tau, 0, 1.05);
    const y = lerp(fromU, u, p);
    ctx.save(); ctx.globalAlpha = a * 0.5; ctx.strokeStyle = rgba(col, 0.9); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(v, fromU); ctx.lineTo(v, y); ctx.stroke(); ctx.restore();
    glow(ctx, v, y, 40 + 26 * p, col, 0.4 * a);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = rgba(lighter(col, 0.55), 0.95); circ(ctx, v, y, 13 + 4 * p); ctx.fill(); ctx.strokeStyle = rgba(col, 1); ctx.lineWidth = 3; ctx.stroke();
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

  function sceneBars() {
    const timb = id === 'timbila';
    const bw = clamp(820 / N, 44, 104), gap = bw * 0.14, total = N * bw + (N - 1) * gap;
    ref = { w: Math.max(560, total + 120), h: land ? 600 : 760 };
    const rank = new Array(N); order.forEach((lane, r) => { rank[lane] = r; });
    const Lmax = land ? 340 : 430, Lmin = N > 1 ? (land ? 200 : 250) : Lmax, mid = land ? 235 : 290;
    const geo = lanes.map((_, i) => {
      const r = rank[i], t = N > 1 ? r / (N - 1) : 0, L = lerp(Lmax, Lmin, t), v = -total / 2 + r * (bw + gap) + bw / 2;
      return { v, L, u0: mid - L / 2 };
    });
    lanes.forEach((_, i) => { const g = geo[i]; spots[i] = rectSpot(g.v, mid, bw / 2 + gap / 2, g.L / 2, { geo: g }); });
    drawScene = (ctx, rt) => {
      const wood = timb ? '#c4915a' : S.wood;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 0, ref.h - 22, total / 2 + 80, 22); ctx.fill();
      // frame: two long rails with legs
      const railW = total + 80;
      for (const u of [mid - Lmax * 0.34, mid + Lmax * 0.34]) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, -railW / 2 + 6, u + 6, railW, 22, 10); ctx.fill();
        ctx.fillStyle = vgrad(ctx, u, u + 22, [[0, lighter('#7a4a22', 0.3)], [1, '#2a170a']]); rrect(ctx, -railW / 2, u, railW, 22, 10); ctx.fill();
      }
      // gourd resonators under the bars
      lanes.forEach((l, i) => {
        const g = geo[i], gr = clamp(bw * 0.62 * (g.L / 380), 24, 66), gu = mid + g.L / 2 + gr + 18;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, g.v + 4, gu + 6, gr, gr * 1.15); ctx.fill();
        ctx.fillStyle = rgrad(ctx, g.v, gu, 2, gr * 1.2, timb ? [[0, '#f2dcae'], [0.6, '#c89a52'], [1, '#6a4416']] : [[0, '#e8c27a'], [0.6, '#a8742e'], [1, '#4a2c0c']], g.v - gr * 0.3, gu - gr * 0.3);
        ell(ctx, g.v, gu, gr, gr * 1.15); ctx.fill();
        if (!timb) { ctx.fillStyle = 'rgba(245,235,205,0.55)'; circ(ctx, g.v, gu - gr * 0.3, gr * 0.28); ctx.fill(); ctx.strokeStyle = 'rgba(70,40,10,0.7)'; ctx.lineWidth = 1.5; ctx.stroke(); }
        ctx.strokeStyle = 'rgba(255,230,170,0.35)'; ctx.lineWidth = 1.5; ell(ctx, g.v, gu, gr, gr * 1.15); ctx.stroke();
      });
      // bars
      lanes.forEach((l, i) => {
        const g = geo[i], f = rt.flash[i], x = g.v - bw / 2, y = g.u0 + 2 * f, w = bw, h = g.L, w2 = mix(wood, l.color, 0.2);
        ctx.fillStyle = 'rgba(0,0,0,0.42)'; rrect(ctx, x + 4, y + 7, w, h, w * 0.16); ctx.fill();
        ctx.fillStyle = hgrad(ctx, x, x + w, [[0, darker(w2, 0.5)], [0.3, lighter(w2, 0.3)], [0.65, w2], [1, darker(w2, 0.55)]]); rrect(ctx, x, y, w, h, w * 0.16); ctx.fill();
        ctx.save(); rrect(ctx, x, y, w, h, w * 0.16); ctx.clip();
        grain(ctx, x, y, w, h, darker(w2, 0.7), 0.3, i * 5 + 2, true, Math.max(4, Math.round(w / 7)));
        if (f > 0.02) { ctx.fillStyle = rgba(lighter(l.color, 0.5), 0.5 * f); ctx.fillRect(x, y, w, h); }
        ctx.restore();
        ctx.strokeStyle = rgba(lighter(w2, 0.6), 0.55); ctx.lineWidth = 1.5; rrect(ctx, x, y, w, h, w * 0.16); ctx.stroke();
        // cord holes at the nodes, lane colour tab at the top
        ctx.fillStyle = 'rgba(15,8,2,0.75)'; circ(ctx, g.v, y + h * 0.22, 3.4); ctx.fill(); circ(ctx, g.v, y + h * 0.78, 3.4); ctx.fill();
        ctx.fillStyle = rgba(l.color, 0.95); rrect(ctx, x + w * 0.18, y + 6, w * 0.64, 7, 3); ctx.fill();
        if (f > 0.03) glow(ctx, g.v, y + h / 2, h * 0.7, l.color, 0.45 * f);
      });
      eachCue(rt, (t, tau) => { const g = geo[t.lane]; drop(ctx, t, tau, rt, g.v, mid, 30); });
      // mallets: rubber-headed sticks that dip onto the struck bar
      lanes.forEach((l, i) => {
        const f = rt.flash[i], g = geo[i];
        if (f > 0.04) { const d = rank[i] % 2 ? 1 : -1; stick(ctx, g.v + d * 14, mid - 30 - 110 * (1 - f), d * 0.22, 300, 14, '#e6c58e', '#7a2c1a', f * 1.7); }
      });
      for (const d of [-1, 1]) stick(ctx, d * (ref.w / 2 - 36), 60, d * 0.1, 240, 13, '#e6c58e', '#7a2c1a', 0.7);
    };
  }

  function sceneMbira() {
    ref = { w: 860, h: land ? 560 : 720 };
    const bw = 720, bh = land ? 380 : 440, cu = land ? 290 : 380;
    const rank = new Array(N); order.forEach((lane, r) => { rank[lane] = r; });
    const pitch = Math.max(40, Math.min(66, (bw - 120) / Math.max(1, N)));
    const brU = cu + 40;
    lanes.forEach((_, i) => {
      const r = rank[i], t = N > 1 ? r / (N - 1) : 0.5, v = (r - (N - 1) / 2) * pitch;
      const back = r % 2 === 0, len = ((back ? 300 : 230) * (1 - 0.18 * Math.abs(t - 0.5) * 2) - 20 * (1 - t)) * (land ? 0.8 : 1);
      spots[i] = circleSpot(v, brU - len + 18, 33, { len, v, tipU: brU - len, back });
    });
    drawScene = (ctx, rt) => {
      const wood = S.wood;
      ctx.fillStyle = 'rgba(0,0,0,0.34)'; ell(ctx, 0, ref.h - 30, 400, 24); ctx.fill();
      // the gourd bowl the board sits in
      ctx.fillStyle = rgrad(ctx, 0, cu + 190, 30, 440, [[0, '#d9a85c'], [0.6, '#8a5a24'], [1, '#3a2008']], -80, cu + 100); ell(ctx, 0, cu + (land ? 150 : 200), 400, land ? 200 : 250); ctx.fill();
      ctx.strokeStyle = 'rgba(255,225,170,0.3)'; ctx.lineWidth = 3; ctx.stroke();
      // the board
      ctx.fillStyle = 'rgba(0,0,0,0.38)'; rrect(ctx, -bw / 2 + 8, cu - bh / 2 + 12, bw, bh, 34); ctx.fill();
      ctx.fillStyle = hgrad(ctx, -bw / 2, bw / 2, [[0, darker(wood, 0.5)], [0.2, lighter(wood, 0.2)], [0.55, wood], [0.9, darker(wood, 0.35)], [1, darker(wood, 0.6)]]); rrect(ctx, -bw / 2, cu - bh / 2, bw, bh, 34); ctx.fill();
      ctx.save(); rrect(ctx, -bw / 2, cu - bh / 2, bw, bh, 34); ctx.clip(); grain(ctx, -bw / 2, cu - bh / 2, bw, bh, '#2a1206', 0.35, 21, false, 14); ctx.restore();
      ctx.strokeStyle = 'rgba(255,225,170,0.45)'; ctx.lineWidth = 3; rrect(ctx, -bw / 2, cu - bh / 2, bw, bh, 34); ctx.stroke();
      // the sound hole
      ctx.fillStyle = '#100803'; ell(ctx, 0, cu + bh * 0.3, 70, 26); ctx.fill(); ctx.strokeStyle = 'rgba(232,211,160,0.8)'; ctx.lineWidth = 3; ctx.stroke();
      // rattling bottle caps strung on wire loops at both ends
      const shake = lanes.reduce((m, _, i) => Math.max(m, rt.flash[i]), 0);
      for (const d of [-1, 1]) for (let k = 0; k < 3; k++) {
        const x = d * (bw / 2 - 70 - k * 36) + Math.sin(rt.anim * 55 + k * 2) * 3 * shake, y = cu + bh * 0.3 + k * 18;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; circ(ctx, x + 3, y + 4, 16); ctx.fill();
        ctx.fillStyle = rgrad(ctx, x, y, 1, 17, [[0, '#f4f4f0'], [0.6, '#b8bcc4'], [1, '#6a6e78']], x - 5, y - 5); circ(ctx, x, y, 16); ctx.fill();
        ctx.strokeStyle = 'rgba(60,60,70,0.7)'; ctx.lineWidth = 2; ctx.stroke(); circ(ctx, x, y, 6); ctx.stroke();
      }
      // holding bar across the tines
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
      // thumbs: two thumbs pressing the tips (lit tine = thumb on it)
      lanes.forEach((l, i) => { const f = rt.flash[i], sp = spots[i]; if (f > 0.04) { ctx.save(); ctx.globalAlpha = Math.min(1, f * 1.8); ctx.translate(sp.v + 4, sp.tipU + 4 - 26 * (1 - f)); ctx.rotate(-0.2); ctx.fillStyle = rgrad(ctx, 0, 0, 2, 40, [[0, '#ffe0c0'], [0.7, '#e2a577'], [1, '#a8683c']], -8, -8); ell(ctx, 0, 0, 20, 36); ctx.fill(); ctx.strokeStyle = 'rgba(100,50,20,0.4)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); } });
    };
  }

  function sceneCarillon() {
    ref = { w: 920, h: land ? 660 : 960 };
    const archB = land ? 400 : 520;
    const pedals = lanes.map((_, i) => i).filter((i) => /pedal/.test(nm(i)));
    const batons = lanes.map((_, i) => i).filter((i) => !pedals.includes(i)).sort((a, b) => lanes[a].hz - lanes[b].hz);
    const bu = land ? 450 : 560, pu = land ? 590 : 820;
    const bwid = Math.min(96, 760 / Math.max(1, batons.length));
    batons.forEach((i, k) => {
      const v = (k - (batons.length - 1) / 2) * (bwid + 8);
      spots[i] = rectSpot(v, bu, bwid / 2, 52, { baton: true, bell: { v, u: (land ? 170 : 210) + (k % 2) * (land ? 60 : 90), w: (land ? 100 : 128) - (land ? 52 : 70) * (k / Math.max(1, batons.length - 1)) * 0.9 } });
    });
    pedals.forEach((i, k) => {
      const v = (k - (pedals.length - 1) / 2) * 240;
      spots[i] = rectSpot(v, pu, 105, 44, { pedal: true, bell: { v: v * 0.9, u: land ? 270 : 400, w: land ? 120 : 150 } });
    });
    drawScene = (ctx, rt) => {
      // tower frame and the bell beam
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 0, ref.h - 30, 440, 24); ctx.fill();
      const arch = (c) => { c.beginPath(); c.moveTo(-440, archB); c.lineTo(-440, 140); c.quadraticCurveTo(-440, 20, 0, 20); c.quadraticCurveTo(440, 20, 440, 140); c.lineTo(440, archB); };
      arch(ctx); ctx.strokeStyle = 'rgba(0,0,0,0.38)'; ctx.lineWidth = 36; ctx.save(); ctx.translate(8, 8); ctx.stroke(); ctx.restore();
      ctx.strokeStyle = hgrad(ctx, -440, 440, [[0, '#4a2c14'], [0.5, '#8a5a2a'], [1, '#4a2c14']]); ctx.lineWidth = 32; arch(ctx); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,225,170,0.3)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = vgrad(ctx, 92, 124, [[0, '#8a5a2a'], [1, '#2a170a']]); rrect(ctx, -420, 92, 840, 30, 10); ctx.fill();
      // bells hung from the beam, each swinging when its baton is pulled
      const ring = (sp, i) => {
        const l = lanes[i], f = rt.flash[i], b = sp.bell, w = b.w, h = Math.min(w * 1.15, 160);
        const top = b.u - h * 0.5;
        // wire from baton up to the bell
        ctx.strokeStyle = rgba('#d9c9a0', 0.8); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sp.v, sp.u - 52); ctx.lineTo(b.v, top + h * 0.9); ctx.stroke();
        bellArt(ctx, S, b.v, top - 12, w, h, l.color, f, Math.sin(rt.anim * 14 + i) * 0.22 * f);
      };
      batons.forEach((i) => ring(spots[i], i));
      pedals.forEach((i) => { const sp = spots[i], l = lanes[i], f = rt.flash[i], b = sp.bell; ctx.strokeStyle = rgba('#d9c9a0', 0.8); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sp.v, sp.u - 40); ctx.lineTo(b.v, b.u + 80); ctx.stroke(); bellArt(ctx, S, b.v, b.u - 110, b.w, b.w * 1.1, l.color, f, Math.sin(rt.anim * 10 + i) * 0.18 * f); });
      // baton keyboard: wooden handles pressed with the side of the fist
      ctx.fillStyle = vgrad(ctx, bu - 70, bu + 80, [[0, '#3a200e'], [1, '#150a04']]); rrect(ctx, -440, bu - 70, 880, 150, 22); ctx.fill();
      batons.forEach((i) => {
        const sp = spots[i], l = lanes[i], f = rt.flash[i], x = sp.v - bwid / 2 + 3, w = bwid - 6, y = sp.u - 56 + 8 * f;
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, x + 3, y + 6, w, 112, 14); ctx.fill();
        ctx.fillStyle = hgrad(ctx, x, x + w, [[0, darker('#c8964a', 0.4)], [0.35, lighter('#c8964a', 0.35)], [1, darker('#c8964a', 0.5)]]); rrect(ctx, x, y, w, 112, 14); ctx.fill();
        ctx.fillStyle = rgba(l.color, 0.5 + 0.5 * f); rrect(ctx, x + 6, y + 8, w - 12, 10, 4); ctx.fill();
        ctx.strokeStyle = 'rgba(255,240,200,0.5)'; ctx.lineWidth = 1.5; rrect(ctx, x, y, w, 112, 14); ctx.stroke();
        if (f > 0.03) glow(ctx, sp.v, y + 56, 90, l.color, 0.5 * f);
      });
      // pedal board
      if (pedals.length) {
        ctx.fillStyle = vgrad(ctx, pu - 60, pu + 60, [[0, '#2a170a'], [1, '#100804']]); rrect(ctx, -440, pu - 62, 880, 124, 20); ctx.fill();
        pedals.forEach((i) => {
          const sp = spots[i], l = lanes[i], f = rt.flash[i], x = sp.v - 105, y = sp.u - 38 + 9 * f;
          ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, x + 4, y + 7, 210, 76, 12); ctx.fill();
          ctx.fillStyle = hgrad(ctx, x, x + 210, [[0, darker('#b8863c', 0.45)], [0.5, lighter('#b8863c', 0.3)], [1, darker('#b8863c', 0.5)]]); rrect(ctx, x, y, 210, 76, 12); ctx.fill();
          ctx.fillStyle = rgba(l.color, 0.5 + 0.5 * f); rrect(ctx, x + 12, y + 8, 186, 9, 4); ctx.fill();
          if (f > 0.03) glow(ctx, sp.v, sp.u, 140, l.color, 0.45 * f);
        });
      }
      // cues: a bead slides down the wire from the bell to its baton or pedal
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
      const { bw, bl, W, H } = geo, wood = '#241c18';
      const boxDraw = (u0) => {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, -bw / 2 + 10, u0 + 14, bw, bl, 30); ctx.fill();
        ctx.fillStyle = hgrad(ctx, -bw / 2, bw / 2, [[0, '#0c0806'], [0.3, '#3a2e28'], [0.6, wood], [1, '#0a0605']]); rrect(ctx, -bw / 2, u0, bw, bl, 30); ctx.fill();
        ctx.strokeStyle = 'rgba(215,180,110,0.8)'; ctx.lineWidth = 5; rrect(ctx, -bw / 2 + 12, u0 + 12, bw - 24, bl - 24, 22); ctx.stroke();
        ctx.strokeStyle = 'rgba(215,180,110,0.5)'; ctx.lineWidth = 3;
        for (const [sx, sy] of [[-1, 0], [1, 0], [-1, 1], [1, 1]]) { const x = sx * (bw / 2 - 26), y = u0 + (sy ? bl - 26 : 26), dy = sy ? -1 : 1; ctx.beginPath(); ctx.moveTo(x, y + dy * 70); ctx.quadraticCurveTo(x, y, x - sx * 70, y); ctx.stroke(); }
      };
      const dtv = clamp(rt.anim - lastAnim, 0, 0.1); lastAnim = rt.anim;
      let want = open;
      lanes.forEach((_, i) => { if (rt.flash[i] > 0.3 && dir[i]) want = dir[i]; });
      open += (want - open) * clamp(dtv * 8, 0, 1);
      // bellows between the boxes: folds across the long axis, pale edges, flexing with push and pull
      const bu0 = bl, bu1 = H - bl, folds = 18, amp = 6 + 14 * (1 - Math.abs(open)) + 6 * Math.abs(open), bwid = bw * (0.92 - 0.06 * open);
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, -bwid / 2 + 8, bu0 + 12, bwid, bu1 - bu0, 12); ctx.fill();
      for (let k = 0; k < folds; k++) {
        const u0 = lerp(bu0, bu1, k / folds), u1 = lerp(bu0, bu1, (k + 1) / folds);
        ctx.fillStyle = vgrad(ctx, u0, u1, [[0, k % 2 ? '#1a1412' : '#2e2420'], [1, k % 2 ? '#0c0908' : '#1a1412']]);
        ctx.beginPath(); ctx.moveTo(-bwid / 2 + (k % 2 ? amp : -amp), u0); ctx.lineTo(bwid / 2 + (k % 2 ? -amp : amp), u0); ctx.lineTo(bwid / 2 + (k % 2 ? amp : -amp), u1); ctx.lineTo(-bwid / 2 + (k % 2 ? -amp : amp), u1); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(238,230,210,0.5)'; ctx.lineWidth = 2; ctx.stroke();
      }
      boxDraw(0); boxDraw(H - bl);
      lanes.forEach((l, i) => {
        const sp = spots[i], f = rt.flash[i], r = sp.r * 0.9, x = sp.v, y = sp.u + (sp.bass ? 0 : H - bl) * 0;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; circ(ctx, x + 2, y + 5, r + 6); ctx.fill();
        ctx.fillStyle = rgrad(ctx, x, y, 2, r + 8, [[0, '#8a909a'], [0.6, '#4a505a'], [1, '#1a1e24']], x - 8, y - 8); circ(ctx, x, y, r + 7); ctx.fill();
        ctx.fillStyle = rgrad(ctx, x, y, 2, r, [[0, f > 0.02 ? lighter(l.color, 0.8) : '#ffffff'], [0.6, f > 0.02 ? lighter(l.color, 0.3) : '#e8e0d0'], [1, f > 0.02 ? l.color : '#a89e8a']], x - r * 0.3, y - r * 0.35); circ(ctx, x, y, r); ctx.fill();
        ctx.strokeStyle = rgba(l.color, 0.95); ctx.lineWidth = 4; ctx.stroke();
        if (sp.dir) { ctx.fillStyle = sp.dir > 0 ? '#e0b030' : '#40a6d8'; const ax = x + r * 0.85, ay = y - r * 0.85; circ(ctx, ax, ay, 14); ctx.fill(); ctx.strokeStyle = '#10161c'; ctx.lineWidth = 3; const s = sp.dir; ctx.beginPath(); ctx.moveTo(ax - 7 * s, ay); ctx.lineTo(ax + 6 * s, ay); ctx.moveTo(ax + 1 * s, ay - 6); ctx.lineTo(ax + 7 * s, ay); ctx.lineTo(ax + 1 * s, ay + 6); ctx.stroke(); }
        if (f > 0.03) glow(ctx, x, y, 110, l.color, 0.5 * f);
      });
      eachCue(rt, (t, tau) => { const sp = spots[t.lane]; drop(ctx, t, tau, rt, sp.v, sp.u, sp.u - 260); });
      void W;
    };
  }

  let land = false, built = false;
  const BUILD = { balafon: sceneBars, timbila: sceneBars, mbira: sceneMbira, carillon: sceneCarillon, bandoneon: sceneBandoneon };
  const build = () => { (BUILD[id] ?? sceneBars)(); for (let i = 0; i < N; i++) if (!spots[i]) spots[i] = circleSpot(0, 40 + 50 * i, 30); };

  st.layout = (area) => {
    const nl = area.w > area.h * 1.45;
    if (nl !== land || !built) { land = nl; built = true; build(); }
    if (rotFrame) { st.F = makeFrame(area, { top: 40, bottom: 10, side: 12, tilt: 0.3, dx: 0.04, zoom: 0.92 }); st.place(st.F); } else st.F = makeBox(area, ref.w, ref.h, { top: 40, bottom: 10, side: 12, ...(VIEW[id] ?? {}) });
    finishSpots(st.F, spots);
  };
  st.hit = (x, y) => (st.F ? hitSpots(st.F, spots, x, y) : -1);
  st.anchor = (i) => ({ x: spots[i]?.x ?? 0, y: spots[i]?.y ?? 0 });

  st.draw = (g, rt) => {
    const { ctx } = g, F = st.F;
    if (!F) return;
    ctx.save(); F.apply(ctx); drawScene(ctx, rt); ctx.restore();
    const size = g.px(15);
    lanes.forEach((l, i) => {
      const sp = spots[i];
      let v = sp.v, u = sp.u;
      if (sp.geo) u = sp.geo.u0 + sp.geo.L * 0.5 - sp.geo.L * 0.5 + 34;     // names sit near the top of each bar
      if (sp.tipU != null) u = sp.tipU + 70;
      if (sp.sx != null) v = sp.sx;
      const [x, y] = F.map(v, u);
      pill(ctx, l.name, x, y, Math.max(46, (sp.hw ? sp.hw * 2 : 80) * (F.scale ?? 1)), size, l.color, rt.flash[i]);
    });
  };
  return st;
}

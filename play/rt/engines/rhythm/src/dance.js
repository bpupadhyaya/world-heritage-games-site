// Dances as the play surface: the dance floor (boards, footprint pads, handkerchiefs, a ribbon pole) or the dancer's own body
// (thigh, knee, boot, hands) for slap dances. Each lane is a place on it; rings close on the place when the step falls due.
import { clamp, mix, rgba, lighter, darker, glow, rrect, grain, hgrad, vgrad, rgrad, ell, circ, TAU, stepIcon, kerchief, footprint } from './art.js';
import { makeBox, circleSpot, rectSpot, finishSpots, hitSpots, pill } from './stagekit.js';

const VIEW = { cueca: { tilt: 0.08, dx: -0.1, dy: -0.12, zoom: 0.95 }, pole: { tilt: 0, zoom: 1 }, body: { dx: 0.1 }, floor: { tilt: -0.12, dy: 0.1, zoom: 0.92 }, dabke: { tilt: 0.04, dx: 0, dy: -0.2, zoom: 0.84 }, kolo: { tilt: -0.3, dx: 0.1, dy: 0.15, zoom: 0.82 } };
export function danceId(key) {
  const k = String(key || '').toLowerCase();
  if (/cueca|kerchief|handkerchief/.test(k)) return 'cueca';
  if (/ribbon|pole|maypole/.test(k)) return 'pole';
  if (/schuhplattler|gumboot|slap/.test(k)) return 'body';
  if (/dabke/.test(k)) return 'dabke';
  if (/kolo/.test(k)) return 'kolo';
  return 'floor';
}

export function createDanceStage(id, S, lanes, P) {
  const N = lanes.length;
  const st = { id, kind: 'dance', spots: new Array(N).fill(null), voice: 'step', F: null };
  const spots = st.spots;
  const nm = (i) => lanes[i].name.toLowerCase();
  const icon = (i) => lanes[i].icon || (/left|izq|\bl\b/.test(nm(i)) ? 'foot-l' : /right|der|\br\b/.test(nm(i)) ? 'foot-r' : /clap|palm/.test(nm(i)) ? 'clap' : /thigh|knee|slap|boot|escob/.test(nm(i)) ? 'slap' : 'stomp');
  const bodyScene = lanes.some((_, i) => /thigh|knee|heel|boot|shin|hip|chest/.test(nm(i))) || id === 'body';
  const ref = { w: 780, h: 900 };
  let land = false, built = false;
  const anchors = new Array(N).fill(null);
  const build = () => {
    for (let i = 0; i < N; i++) { spots[i] = null; anchors[i] = null; }
    ref.w = land ? 1160 : 780; ref.h = bodyScene ? (land ? 600 : 960) : (land ? 560 : 900);
  if (bodyScene) {
    let slapIdx = 0;
    lanes.forEach((_, i) => {
      const ic = icon(i), n = nm(i);
      let v = 0, u = 700, r = 66;
      if (/thigh/.test(n)) { v = 96; u = 560; r = 74; }
      else if (/knee/.test(n)) { v = -90; u = 690; r = 66; }
      else if (/left boot/.test(n)) { v = -92; u = 840; r = 70; }
      else if (/right boot/.test(n)) { v = 92; u = 840; r = 70; }
      else if (/heel/.test(n)) { v = 100; u = 840; r = 66; }
      else if (ic === 'clap') { v = 0; u = 330; r = 84; }
      else if (ic === 'stomp') { v = 0; u = 905; r = 76; }
      else if (ic === 'foot-l') { v = -210; u = 840; r = 64; }
      else if (ic === 'foot-r') { v = 210; u = 840; r = 64; }
      else { v = (slapIdx % 2 ? 1 : -1) * 140; u = 470 + 90 * Math.floor(slapIdx / 2); slapIdx++; }
      spots[i] = circleSpot(v, u, r, { ic });
    });
  } else {
    const L = [], R = [], C = [], H = [], X = [];
    lanes.forEach((_, i) => { const ic = icon(i); (ic === 'foot-l' ? L : ic === 'foot-r' ? R : ic === 'clap' ? H : ic === 'stomp' ? C : X).push(i); });
    const put = (list, fn) => list.forEach((i, k) => { const [v, u] = fn(k, list.length); spots[i] = circleSpot(v, u, 78, { ic: icon(i) }); });
    if (id === 'pole') {
      const all = lanes.map((_, i) => i), cu = land ? 280 : 450, rr = land ? 215 : 270;
      all.forEach((i, k) => { const a = -Math.PI / 2 + (k / N) * TAU + 0.4; spots[i] = circleSpot(Math.cos(a) * rr * (land ? 1.5 : 1), cu + Math.sin(a) * rr, 74, { ic: icon(i) }); });
    } else {
      if (land) {
        put(L, (k) => [-330, 280 + k * 170]); put(R, (k) => [330, 280 + k * 170]);
        put(C, (k, n) => [(k - (n - 1) / 2) * 190, 450]);
        put(H, (k, n) => [(k - (n - 1) / 2) * 190, 120]);
        put(X, (k, n) => [(k - (n - 1) / 2) * 190, 285]);
      } else {
        put(L, (k) => [-180, 560 + k * 170]); put(R, (k) => [180, 560 + k * 170]);
        put(C, (k, n) => [(k - (n - 1) / 2) * 190, 740]);
        put(H, (k, n) => [(k - (n - 1) / 2) * 190, 260]);
        put(X, (k, n) => [(k - (n - 1) / 2) * 190, 420]);
      }
      if (!L.length && !R.length && !C.length) lanes.forEach((_, i) => { if (!spots[i]) spots[i] = circleSpot(0, 700, 74); });
    }
  }

    if (bodyScene && land) { // wide screens: the pads stand in two columns beside a smaller figure, tied to the body part by a line
      const order = lanes.map((_, i) => i).sort((p, q) => spots[p].u - spots[q].u);
      const left = order.filter((i) => spots[i].v < 0), right = order.filter((i) => spots[i].v >= 0);
      const rows = Math.max(left.length, right.length);
      const place = (list, side) => list.forEach((i, k) => {
        anchors[i] = { v: spots[i].v * 0.6, u: 20 + spots[i].u * 0.6 };
        spots[i] = circleSpot(side * 330, 90 + k * (rows > 1 ? 420 / (rows - 1) : 0), 66, { ic: spots[i].ic });
      });
      place(left, -1); place(right, 1);
    }
    for (let i = 0; i < N; i++) if (!spots[i]) spots[i] = circleSpot(0, 100 + 70 * i, 60, { ic: 'stomp' });
  };

  st.layout = (area) => {
    const nl = area.w > area.h * 1.4;
    if (nl !== land || !built) { land = nl; built = true; build(); }
    st.F = makeBox(area, ref.w, ref.h, { top: 40, bottom: 10, side: 12, ...(VIEW[id] ?? {}), ...(VIEW[bodyScene ? 'body' : id] ?? {}) }); finishSpots(st.F, spots);
  };
  st.hit = (x, y) => (st.F ? hitSpots(st.F, spots, x, y) : -1);
  st.anchor = (i) => ({ x: spots[i]?.x ?? 0, y: spots[i]?.y ?? 0 });

  const floor = (ctx, rt) => {
    const fl = S.floor;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, -ref.w / 2 + 14, 24, ref.w - 8, ref.h - 20, 36); ctx.fill();
    ctx.fillStyle = vgrad(ctx, 0, ref.h, [[0, lighter(fl, 0.18)], [1, darker(fl, 0.35)]]); rrect(ctx, -ref.w / 2 + 6, 10, ref.w - 12, ref.h - 22, 34); ctx.fill();
    ctx.save(); rrect(ctx, -ref.w / 2 + 6, 10, ref.w - 12, ref.h - 22, 34); ctx.clip();
    grain(ctx, -ref.w / 2, 0, ref.w, ref.h, '#1a0e06', 0.35, 31, false, 20);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 3; for (let x = -ref.w / 2 + 130; x < ref.w / 2; x += 130) { ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x, ref.h); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,225,170,0.45)'; ctx.lineWidth = 4; rrect(ctx, -ref.w / 2 + 6, 10, ref.w - 12, ref.h - 22, 34); ctx.stroke();
    void rt;
  };

  const figure = (ctx, rt) => {
    const skin = '#e2a577', jacket = mix(S.floor, '#2e6a4a', 0.6), pants = '#6a4a28';
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 10, 925, 300, 26); ctx.fill();
    // legs
    for (const d of [-1, 1]) { ctx.fillStyle = hgrad(ctx, d * 92 - 56, d * 92 + 56, [[0, darker(pants, 0.5)], [0.4, lighter(pants, 0.2)], [1, darker(pants, 0.5)]]); rrect(ctx, d * 92 - 56, 470, 112, 360, 40); ctx.fill(); }
    // boots
    for (const d of [-1, 1]) { ctx.fillStyle = hgrad(ctx, d * 92 - 70, d * 92 + 70, [[0, '#0c0806'], [0.4, '#4a4038'], [1, '#0c0806']]); rrect(ctx, d * 92 - 70, 800, 140, 100, 34); ctx.fill(); }
    // torso and arms
    ctx.fillStyle = hgrad(ctx, -150, 150, [[0, darker(jacket, 0.5)], [0.35, lighter(jacket, 0.18)], [1, darker(jacket, 0.5)]]); rrect(ctx, -150, 180, 300, 330, 60); ctx.fill();
    ctx.fillStyle = '#e8d8a8'; rrect(ctx, -100, 200, 200, 70, 30); ctx.fill();
    for (const d of [-1, 1]) { ctx.save(); ctx.translate(d * 180, 260); ctx.rotate(d * -0.28); ctx.fillStyle = hgrad(ctx, -34, 34, [[0, darker(jacket, 0.5)], [0.5, jacket], [1, darker(jacket, 0.5)]]); rrect(ctx, -34, 0, 68, 250, 32); ctx.fill(); ctx.fillStyle = skin; circ(ctx, 0, 262, 34); ctx.fill(); ctx.restore(); }
    // head with a felt hat
    ctx.fillStyle = rgrad(ctx, 0, 110, 4, 62, [[0, lighter(skin, 0.3)], [1, darker(skin, 0.3)]], -14, 94); circ(ctx, 0, 118, 58); ctx.fill();
    ctx.fillStyle = '#3a4a30'; ctx.beginPath(); ctx.moveTo(-90, 80); ctx.quadraticCurveTo(0, 20, 90, 80); ctx.lineTo(60, 60); ctx.quadraticCurveTo(0, -20, -60, 60); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8d8a8'; ctx.fillRect(-4, 4, 8, 40);
    void rt;
  };

  st.draw = (g, rt) => {
    const { ctx } = g, F = st.F;
    if (!F) return;
    ctx.save(); F.apply(ctx);
    if (bodyScene) {
      if (land) { ctx.save(); ctx.translate(0, 20); ctx.scale(0.6, 0.6); figure(ctx, rt); ctx.restore();
        lanes.forEach((l, i) => { const a = anchors[i], sp = spots[i]; if (!a) return; ctx.strokeStyle = rgba(l.color, 0.55 + 0.4 * rt.flash[i]); ctx.lineWidth = 3; ctx.setLineDash([8, 7]); ctx.beginPath(); ctx.moveTo(sp.v + (sp.v < 0 ? sp.r : -sp.r), sp.u); ctx.lineTo(a.v, a.u); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = rgba(l.color, 0.9); circ(ctx, a.v, a.u, 7); ctx.fill(); });
      } else figure(ctx, rt);
    }
    else {
      floor(ctx, rt);
      if (id === 'cueca') {
        const fl = lanes.reduce((m, _, i) => Math.max(m, rt.flash[i]), 0);
        kerchief(ctx, -300, 90, 190, '#d8362e', rt.anim + fl * 2, -0.3);
        kerchief(ctx, 120, 70, 190, '#f2f2ee', rt.anim + 1.3 + fl * 2, -0.1);
      }
      if (id === 'pole') { // maypole seen from above with ribbons
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; circ(ctx, 8, 460, 70); ctx.fill();
        for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU + rt.anim * 0.15; ctx.strokeStyle = rgba(lanes[k % N].color, 0.75); ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(0, 450); ctx.quadraticCurveTo(Math.cos(a + 0.6) * 160, 450 + Math.sin(a + 0.6) * 160, Math.cos(a) * 280, 450 + Math.sin(a) * 280); ctx.stroke(); }
        ctx.fillStyle = rgrad(ctx, 0, 450, 2, 60, [[0, '#f0d9a0'], [1, '#6a4a22']]); circ(ctx, 0, 450, 54); ctx.fill();
      }
      // footprint trail ghosts show where the dancer travels
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let k = 0; k < 6; k++) footprint(ctx, (k % 2 ? 1 : -1) * 38, 120 + k * 120, 34, k % 2 === 0, 'rgba(255,255,255,0.05)', null, 1);
    }
    // pads
    lanes.forEach((l, i) => {
      const sp = spots[i], f = rt.flash[i], c = l.color, s = sp.r * (1 + 0.12 * f);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, sp.v - s + 4, sp.u - s + 8, s * 2, s * 2, 24); ctx.fill();
      ctx.fillStyle = vgrad(ctx, sp.u - s, sp.u + s, [[0, mix(lighter(S.floor, 0.1), c, 0.35 + 0.35 * f)], [1, mix(darker(S.floor, 0.45), c, 0.28 + 0.35 * f)]]); rrect(ctx, sp.v - s, sp.u - s, s * 2, s * 2, 24); ctx.fill();
      ctx.strokeStyle = rgba(lighter(c, 0.4 + 0.4 * f), 0.95); ctx.lineWidth = 3.5; ctx.stroke();
      if (f > 0.03) glow(ctx, sp.v, sp.u, s * 2.2, c, 0.5 * f);
      stepIcon(ctx, sp.ic ?? 'stomp', sp.v + 2, sp.u + 3, s * 0.52, 'rgba(0,0,0,0.4)', 0);
      stepIcon(ctx, sp.ic ?? 'stomp', sp.v, sp.u - 2, s * 0.52, lighter(c, 0.82), f);
    });
    // approach rings
    for (let k = rt.list.length - 1; k >= 0; k--) {
      const t = rt.list[k];
      if (t.state && t.state !== 'pending' && t.state !== 'miss') continue;
      const tau = (t.t - rt.clock) / rt.look;
      if (tau > 1.0 || tau < -0.25) continue;
      const sp = spots[t.lane], l = lanes[t.lane], miss = t.state === 'miss';
      const a = (rt.soft ? 0.5 : 1) * (miss ? 0.35 : 1) * clamp((1.05 - tau) * 8, 0, 1) * clamp((tau + 0.25) * 6, 0, 1);
      const col = miss ? mix(l.color, '#555555', 0.6) : l.color, s = sp.r * (1.02 + 0.75 * clamp(tau, 0, 1.1));
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = rgba(lighter(col, 0.5), 0.95); ctx.lineWidth = 4; rrect(ctx, sp.v - s, sp.u - s, s * 2, s * 2, 26 + 20 * tau); ctx.stroke();
      ctx.strokeStyle = rgba(col, 0.4); ctx.lineWidth = 9; ctx.stroke(); ctx.restore();
    }
    ctx.restore();
    const size = g.px(15);
    lanes.forEach((l, i) => { const sp = spots[i], [x, y] = F.map(sp.v, sp.u + sp.r * 0.92); pill(ctx, l.name, x, y, Math.max(70, sp.r * F.scale * 2), size, l.color, rt.flash[i]); });
  };
  return st;
}

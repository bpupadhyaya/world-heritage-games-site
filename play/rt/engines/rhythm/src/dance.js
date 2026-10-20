// Dances as the play surface: a circle of dancers (kolo), a line (dabke), a pair with handkerchiefs (cueca), a maypole with plaited
// ribbons, or the dancer's own body (schuhplattler). Each lane is a painted mark on the floor (or a part of the body); a ring
// closes on it when the step falls due. The dancers step, bob and wave with the music (dancers.js); the floor is dressed (set.js).
import { clamp, mix, rgba, lighter, darker, glow, rrect, hgrad, vgrad, rgrad, hash, ell, circ, TAU, stepIcon, kerchief, footprint } from './art.js';
import { stageIdFor } from './registry.js';
import { makeBox, circleSpot, finishSpots, hitSpots, pill } from './stagekit.js';
import { setting } from './set.js';
import { dancerTop, limb, bunting } from './dancers.js';

export const VIEW = { cueca: { zoom: 1.0 }, pole: { zoom: 1.0 }, body: { zoom: 1.0 }, floor: { zoom: 1.0 }, dabke: { zoom: 1.0 }, kolo: { zoom: 1.0 } };
export const IDS = [[/cueca|kerchief|handkerchief/, 'cueca'], [/ribbon|pole|maypole/, 'pole'], [/schuhplattler|gumboot|slap/, 'body'], [/dabke/, 'dabke'], [/kolo/, 'kolo']];
export const danceId = (key) => stageIdFor('steps', key);   // routes live in registry.js; new dances: registerDanceStage

export const DRESS = {
  kolo: { set: { kind: 'meadow', base: '#3d6a32', light: '#fff0c0' }, ring: true },
  dabke: { set: { kind: 'tiles', base: '#2e5c70', accent: '#d9b45a', light: '#ffe6b0' } },
  cueca: { set: { kind: 'planks', base: '#6a4224', light: '#ffe0b0' } },
  pole: { set: { kind: 'meadow', base: '#4a7a36', light: '#fff4c8' } },
  body: { set: { kind: 'planks', base: '#5a3a22', light: '#ffe6b8' } },
  floor: { set: { kind: 'planks', base: '#5a4630', light: '#ffe0b0' } },
};

export function createDanceStage(id, S, lanes, P, key = '') {
  const gumboot = /gumboot/i.test(String(key));
  const N = lanes.length;
  const st = { id, kind: 'dance', spots: new Array(N).fill(null), voice: 'step', F: null };
  const spots = st.spots;
  const nm = (i) => lanes[i].name.toLowerCase();
  const icon = (i) => lanes[i].icon || (/left|izq|\bl\b/.test(nm(i)) ? 'foot-l' : /right|der|\br\b/.test(nm(i)) ? 'foot-r' : /clap|palm/.test(nm(i)) ? 'clap' : /thigh|knee|slap|boot|escob/.test(nm(i)) ? 'slap' : 'stomp');
  const bodyScene = lanes.some((_, i) => /thigh|knee|heel|boot|shin|hip|chest/.test(nm(i))) || id === 'body';
  const ref = { w: 780, h: 940 };
  let land = false, built = false;
  const anchors = new Array(N).fill(null);
  const dress = gumboot ? { set: { kind: 'stone', base: '#4a4844', accent: '#6a665e', size: 130, light: '#ffe6b8' } } : (DRESS[bodyScene ? 'body' : id] ?? DRESS.floor);
  let center = { v: 0, u: 450 };

  const build = () => {
    for (let i = 0; i < N; i++) { spots[i] = null; anchors[i] = null; }
    ref.w = land ? 1160 : 780; ref.h = land ? 600 : 940;
    const rp = land ? 64 : 72;
    if (bodyScene) {
      ref.h = land ? 600 : 960;
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
      const put = (list, fn) => list.forEach((i, k) => { const [v, u] = fn(k, list.length); spots[i] = circleSpot(v, u, rp, { ic: icon(i) }); });
      if (id === 'pole') {
        center = { v: 0, u: land ? 300 : 440 };
        const rr = land ? 120 : 170;
        lanes.forEach((_, i) => { const a = -Math.PI / 2 + (i / N) * TAU + 0.4; spots[i] = circleSpot(Math.cos(a) * rr * (land ? 1.15 : 1), center.u + Math.sin(a) * rr, rp - 4, { ic: icon(i) }); });
      } else {
        let cu, gap, dv;
        const tight = id === 'kolo';
        if (tight) { center = { v: 0, u: land ? 300 : 440 }; cu = center.u; gap = land ? 92 : 112; dv = 105; }
        else { cu = land ? 410 : 650; gap = land ? 250 : 180; dv = land ? 100 : 130; }
        put(L, (k) => [-gap, cu + k * dv]); put(R, (k) => [gap, cu + k * dv]);
        put(C, (k, n) => [(k - (n - 1) / 2) * (tight ? 120 : 190), cu + (tight ? 112 : dv + 4)]);
        put(H, (k, n) => [(k - (n - 1) / 2) * (tight ? 120 : 190), cu - (tight ? 112 : land ? 108 : dv + 8)]);
        put(X, (k, n) => [(k - (n - 1) / 2) * (tight ? 120 : 190), cu + (tight ? 0 : -6)]);
        if (!L.length && !R.length && !C.length) lanes.forEach((_, i) => { if (!spots[i]) spots[i] = circleSpot(0, cu, rp); });
      }
    }
    if (bodyScene && land) { // wide screens: the pads stand in two columns beside a smaller figure, tied to the body part by a line
      const order = lanes.map((_, i) => i).sort((p, q) => spots[p].u - spots[q].u);
      const left = order.filter((i) => spots[i].v < 0), right = order.filter((i) => spots[i].v >= 0);
      const rows = Math.max(left.length, right.length);
      const place = (list, side) => list.forEach((i, k) => {
        anchors[i] = { v: spots[i].v * 0.6, u: 20 + spots[i].u * 0.6 };
        spots[i] = circleSpot(side * 380, 90 + k * (rows > 1 ? 420 / (rows - 1) : 0), 66, { ic: spots[i].ic });
      });
      place(left, -1); place(right, 1);
    }
    for (let i = 0; i < N; i++) if (!spots[i]) spots[i] = circleSpot(0, 100 + 70 * i, 60, { ic: 'stomp' });
  };

  st.layout = (area) => {
    const nl = area.w > area.h * 1.4;
    if (nl !== land || !built) { land = nl; built = true; build(); }
    st.F = makeBox(area, ref.w, ref.h, { top: 40, bottom: 10, side: 12, ...(VIEW[bodyScene ? 'body' : id] ?? {}) }); finishSpots(st.F, spots);
  };
  st.hit = (x, y) => (st.F ? hitSpots(st.F, spots, x, y) : -1);
  st.anchor = (i) => ({ x: spots[i]?.x ?? 0, y: spots[i]?.y ?? 0 });

  // ---- figures -------------------------------------------------------------------------------------------------------------
  const PEOPLE = {
    kolo: [
      { shirt: '#f3efe4', vest: '#a82a2a', bottom: '#27304a', hair: '#2a1a12', hat: 'hair' },
      { shirt: '#f6f0e0', vest: '#2a4a8a', bottom: '#8a2a2a', hair: '#5a3a1a', hat: 'scarf', hatCol: '#d8b040', skirt: true },
    ],
    slav: [
      { shirt: '#f6f0e0', vest: '#a82a2a', bottom: '#1c2a5a', hair: '#4a2a12', hat: 'hair', trim: '#c8302a' },
      { shirt: '#f8f2e4', vest: '#2a6a3a', bottom: '#8a1f2a', hair: '#c8903a', hat: 'scarf', hatCol: '#d8362e', skirt: true, trim: '#e8c040' },
    ],
    dabke: [
      { shirt: '#e8e2d2', vest: '#2a2a32', bottom: '#2a2a3a', hair: '#1a1210', hat: 'kufiya' },
      { shirt: '#f0e6d0', vest: '#7a1f2a', bottom: '#3a2a50', hair: '#2a1a12', hat: 'hair' },
    ],
  };
  const flashMax = (rt) => lanes.reduce((m, _, i) => Math.max(m, rt.flash[i]), 0);
  const beatPhase = (rt) => (((rt.clock / Math.max(0.2, rt.spb)) % 2) + 2) % 2;   // 0..2: even and odd beats alternate the stepping foot

  const sceneKolo = (ctx, rt) => {
    const cx = center.v, cy = center.u, R = land ? 245 : 290, n = 9, s = land ? 100 : 150;
    ctx.strokeStyle = 'rgba(120,88,52,0.5)'; ctx.lineWidth = s * 1.15; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(70,46,24,0.3)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, R - s * 0.58, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, R + s * 0.58, 0, TAU); ctx.stroke();
    const bp = beatPhase(rt), hit = flashMax(rt), rot = rt.anim * 0.1;
    const pts = [];
    for (let k = 0; k < n; k++) { const a = rot + (k / n) * TAU; pts.push({ a, x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R }); }
    pts.forEach((p, k) => {
      const q = pts[(k + 1) % n], m = [(p.x + q.x) / 2, (p.y + q.y) / 2];
      limb(ctx, p.x, p.y, m[0], m[1], s * 0.2, k % 2 ? '#e8e0cc' : '#f3efe4', true); limb(ctx, q.x, q.y, m[0], m[1], s * 0.2, k % 2 ? '#f3efe4' : '#e8e0cc', false);
      ctx.fillStyle = '#d49a6c'; circ(ctx, m[0], m[1], s * 0.1); ctx.fill();
    });
    pts.forEach((p, k) => {
      const kind = PEOPLE.kolo[k % 2], fa = p.a + Math.PI / 2;
      const step = Math.sin(Math.PI * (bp + (k % 2 ? 1 : 0))) * 0.9, q = pts[(k + 1) % n], pr = pts[(k + n - 1) % n];
      dancerTop(ctx, p.x, p.y, s, { face: fa, ...kind, step, bob: hit * 0.7 + 0.2 * Math.abs(step), handL: [(p.x + pr.x) / 2, (p.y + pr.y) / 2], handR: [(p.x + q.x) / 2, (p.y + q.y) / 2], skin: ['#e8b890', '#d49a6c', '#c88a5a', '#f0c8a0'][k % 4], trim: '#e3b030' });
    });
  };

  const sceneDabke = (ctx, rt) => {
    const n = land ? 8 : 6, s = land ? 120 : 130, y0 = land ? 150 : 240, span = land ? 900 : 520;
    const bp = beatPhase(rt), hit = flashMax(rt);
    const xs = Array.from({ length: n }, (_, k) => -span / 2 + (k / (n - 1)) * span);
    xs.forEach((x, k) => { if (k < n - 1) { limb(ctx, x, y0 + 8, (x + xs[k + 1]) / 2, y0 - 6, s * 0.2, '#ece4d0', true); limb(ctx, xs[k + 1], y0 + 8, (x + xs[k + 1]) / 2, y0 - 6, s * 0.2, '#e4dcc8', false); } });
    xs.forEach((x, k) => {
      const kind = (id === 'dabke' ? PEOPLE.dabke : PEOPLE.slav)[k % 2 && k < n - 1 ? 1 : 0], lead = k === n - 1;
      const step = Math.sin(Math.PI * (bp + (k % 2 ? 0.5 : 0))) * 0.8;
      const hl = k > 0 ? [(x + xs[k - 1]) / 2, y0 - 4] : [x - s * 0.5, y0 + 26];
      const hr = lead ? [x + s * 0.6, y0 - s * 0.55 - hit * 14] : [(x + xs[k + 1]) / 2, y0 - 4];
      dancerTop(ctx, x, y0 + (k % 2) * 6, s, { face: Math.PI / 2, ...kind, step, bob: hit * 0.8 + 0.15 * Math.abs(step), handL: hl, handR: hr, skin: ['#d49a6c', '#c88a5a', '#e0b080'][k % 3], trim: '#d8b45a' });
      if (lead) kerchief(ctx, hr[0], hr[1], s * 0.9, '#f4f2ec', rt.anim * 1.2 + hit * 2, -0.9);
    });
  };

  const sceneCueca = (ctx, rt) => {
    const hit = flashMax(rt), bp = beatPhase(rt);
    const s = land ? 140 : 170, t = rt.anim;
    const my = land ? 240 : 330, mx = land ? -180 : -165, wx = land ? 190 : 175, wy = my - 30;
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse((mx + wx) / 2, (my + wy) / 2, land ? 420 : 330, land ? 190 : 250, 0, 0, TAU); ctx.stroke();
    const sway = Math.sin(t * 1.4) * 0.12;
    const mf = -0.12 + sway, wf = Math.PI + 0.12 - sway;
    const mh = [mx + 70, my - s * 0.62 - hit * 10], wh = [wx - 70, wy - s * 0.62 - hit * 10];
    dancerTop(ctx, mx, my, s, { face: mf, shirt: '#2a3a5a', vest: '#8a2a2a', trim: '#e8d8a0', bottom: '#3a2a20', hat: 'chupalla', hatCol: '#dcc27a', skin: '#d49a6c', step: Math.sin(Math.PI * bp) * 0.8, bob: hit * 0.7, handR: mh, handL: [mx - 28, my + 40], shoe: '#2a1608' });
    dancerTop(ctx, wx, wy, s, { face: wf, shirt: '#f2e6c8', bottom: '#b8322a', trim: '#f0d060', hat: 'hair', hair: '#1a1210', skin: '#e8b890', skirt: true, step: Math.sin(Math.PI * (bp + 1)) * 0.8, bob: hit * 0.7, handL: wh, handR: [wx + 30, wy + 40], sleeve: '#f2e6c8' });
    kerchief(ctx, mh[0], mh[1], s * 0.85, '#d8362e', t * 1.4 + hit * 2, -0.35);
    kerchief(ctx, wh[0], wh[1], s * 0.85, '#f4f2ee', t * 1.4 + 1.3 + hit * 2, -2.6);
    bunting(ctx, -ref.w / 2 + 20, 38, ref.w / 2 - 20, 38, land ? 22 : 16, ['#d8362e', '#f4f2ee', '#2a58b8'], 26, t);
  };

  const scenePole = (ctx, rt) => {
    const cx = center.v, cy = center.u, R = land ? 250 : 300, n = 8, s = land ? 88 : 124, t = rt.anim, hit = flashMax(rt), bp = beatPhase(rt);
    const cols = ['#d8362e', '#f2c230', '#2a8a4a', '#2a58b8', '#e86aa0', '#f08a28', '#7a3ab8', '#2ab8b8'];
    ctx.strokeStyle = 'rgba(150,120,60,0.35)'; ctx.lineWidth = s * 1.05; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    const dancers = [];
    for (let k = 0; k < n; k++) {
      const dir = k % 2 ? 1 : -1, a = (k / n) * TAU + dir * t * 0.32, rr = R * (1 + 0.1 * Math.sin(t * 0.9 + k * Math.PI) * (k % 2 ? 1 : -1));
      dancers.push({ k, a, dir, x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr });
    }
    ctx.fillStyle = 'rgba(0,0,0,0.38)'; circ(ctx, cx + 10, cy + 14, 62); ctx.fill();
    ctx.fillStyle = rgrad(ctx, cx, cy, 2, 58, [[0, '#f6e2b0'], [0.6, '#b8884a'], [1, '#5a3a1a']], cx - 14, cy - 18); circ(ctx, cx, cy, 56); ctx.fill();
    dancers.forEach((d) => {
      const col = cols[d.k % cols.length], hx = d.x - Math.cos(d.a) * s * 0.55, hy = d.y - Math.sin(d.a) * s * 0.55, mx = (cx + hx) / 2, my = (cy + hy) / 2;
      const px = -Math.sin(d.a), py = Math.cos(d.a), bend = Math.sin(t * 2 + d.k) * 16 + d.dir * 22;
      ctx.save(); ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(cx + 4, cy + 7); ctx.quadraticCurveTo(mx + px * bend + 4, my + py * bend + 7, hx + 4, hy + 7); ctx.stroke();
      ctx.strokeStyle = darker(col, 0.3); ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.quadraticCurveTo(mx + px * bend, my + py * bend, hx, hy); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 8; ctx.stroke();
      ctx.strokeStyle = lighter(col, 0.5); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx - 1, cy - 1); ctx.quadraticCurveTo(mx + px * bend - 1, my + py * bend - 1, hx - 1, hy - 1); ctx.stroke();
      ctx.restore();
    });
    ctx.fillStyle = rgrad(ctx, cx, cy, 1, 26, [[0, '#fff6d8'], [1, '#8a5a24']], cx - 6, cy - 8); circ(ctx, cx, cy, 24); ctx.fill();
    dancers.forEach((d) => {
      const fa = d.a + (d.dir > 0 ? Math.PI / 2 : -Math.PI / 2), col = cols[d.k % cols.length];
      const step = Math.sin(Math.PI * (bp + (d.k % 2 ? 1 : 0))) * 0.9;
      const hx = d.x - Math.cos(d.a) * s * 0.5, hy = d.y - Math.sin(d.a) * s * 0.5;
      dancerTop(ctx, d.x, d.y, s, { face: fa, shirt: d.k % 2 ? '#f6f0e2' : '#2a4a8a', vest: col, bottom: d.k % 2 ? '#c0392b' : '#3a2a20', skirt: d.k % 2 === 1, hair: ['#2a1a12', '#8a5a2a', '#e0b858', '#1a1210'][d.k % 4], hat: d.k % 2 ? 'scarf' : 'hair', hatCol: col, trim: '#f0d060', step, bob: hit * 0.7 + 0.15 * Math.abs(step), handR: [hx, hy], skin: ['#e8b890', '#d49a6c', '#c88a5a', '#f0c8a0'][d.k % 4] });
    });
  };

  // schuhplattler: the whole dancer in front view, with the slapped parts reacting
  const sceneBody = (ctx, rt) => {
    const f = (re) => lanes.reduce((m, _, i) => (re.test(nm(i)) ? Math.max(m, rt.flash[i]) : m), 0);
    const thigh = f(/thigh|slap/), knee = f(/knee/), heel = f(/heel|boot/), clap = f(/clap|palm/), stomp = f(/stomp/);
    const squash = stomp * 10, bob = flashMax(rt) * 6;
    const skin = '#e2a577', pants = gumboot ? '#3a5a88' : '#6a4a28', shirt = gumboot ? '#4a6a98' : '#f2eee0', socks = gumboot ? '#f4f4ee' : '#e8e4d8', vest = gumboot ? '#d8a020' : '#2e5a34';
    ctx.fillStyle = 'rgba(0,0,0,0.34)'; ell(ctx, 10, 925, 300, 26); ctx.fill();
    for (const d of [-1, 1]) {
      const lift = d < 0 ? knee * 70 : heel * 60, x = d * 92, y0 = 500 + squash * 0.4;
      ctx.fillStyle = hgrad(ctx, x - 52, x + 52, [[0, darker(socks, 0.5)], [0.4, lighter(socks, 0.1)], [1, darker(socks, 0.5)]]); rrect(ctx, x - 40, y0 + 190 - lift, 80, 150, 30); ctx.fill();
      if (!gumboot) { ctx.strokeStyle = 'rgba(200,60,50,0.6)'; ctx.lineWidth = 5; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - 40, y0 + 230 + k * 22 - lift); ctx.lineTo(x + 40, y0 + 230 + k * 22 - lift); ctx.stroke(); } }
      ctx.fillStyle = hgrad(ctx, x - 58, x + 58, [[0, darker(pants, 0.5)], [0.35, lighter(pants, 0.25)], [1, darker(pants, 0.55)]]); rrect(ctx, x - 56, y0, 112, 230 - lift * 0.3, 40); ctx.fill();
      ctx.strokeStyle = 'rgba(240,215,160,0.55)'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(x - 50, y0 + 6); ctx.lineTo(x - 50, y0 + 220 - lift * 0.3); ctx.stroke(); ctx.setLineDash([]);
      const sy = 800 + squash - lift;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, x + 6, 905 + squash, 76, 14); ctx.fill();
      ctx.fillStyle = hgrad(ctx, x - 70, x + 70, gumboot ? [[0, '#9aa0a8'], [0.4, '#f4f4f0'], [1, '#8a9098']] : [[0, '#0c0806'], [0.4, '#58483c'], [1, '#0c0806']]); rrect(ctx, x - 66, sy - (gumboot ? 70 : 0), 132, 100 - squash + (gumboot ? 70 : 0), 34); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; rrect(ctx, x - 50, sy + 10, 60, 14, 7); ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; rrect(ctx, -150 + 10, 190 + 12 + bob, 300, 340, 60); ctx.fill();
    ctx.fillStyle = hgrad(ctx, -150, 150, [[0, darker(shirt, 0.45)], [0.35, lighter(shirt, 0.1)], [1, darker(shirt, 0.5)]]); rrect(ctx, -150, 180 + bob, 300, 340, 60); ctx.fill();
    ctx.fillStyle = hgrad(ctx, -150, 150, [[0, darker(vest, 0.5)], [0.4, lighter(vest, 0.18)], [1, darker(vest, 0.55)]]);
    rrect(ctx, -120, 270 + bob, 240, 250, 40); ctx.fill();
    for (const d of [-1, 1]) { ctx.fillStyle = '#7a4a22'; rrect(ctx, d * 78 - 18, 190 + bob, 36, 300, 14); ctx.fill(); ctx.fillStyle = '#e8c868'; ctx.fillRect(d * 78 - 12, 190 + bob, 24, 6); }
    ctx.fillStyle = '#7a4a22'; rrect(ctx, -120, 330 + bob, 240, 24, 8); ctx.fill();
    ctx.fillStyle = '#e8c868'; for (let k = 0; k < 3; k++) { circ(ctx, -60 + k * 60, 342 + bob, 6); ctx.fill(); }
    const handRx = 150 - 40 * thigh - 120 * clap, handRy = 520 + 20 * thigh - 220 * clap;
    for (const d of [-1, 1]) {
      const sx = d * 150, sy = 240 + bob, hx = d > 0 ? handRx : -150 + 120 * clap, hy = d > 0 ? handRy : 520 - 220 * clap;
      limb(ctx, sx, sy, d * 190, (sy + hy) / 2, 66, shirt, true); limb(ctx, d * 190, (sy + hy) / 2, hx, hy, 56, shirt, false);
      ctx.fillStyle = rgrad(ctx, hx, hy, 0, 40, [[0, lighter(skin, 0.3)], [1, darker(skin, 0.3)]], hx - 8, hy - 8); circ(ctx, hx, hy, 34); ctx.fill();
    }
    ctx.fillStyle = rgrad(ctx, 0, 118 + bob, 4, 62, [[0, lighter(skin, 0.3)], [1, darker(skin, 0.3)]], -14, 94 + bob); circ(ctx, 0, 118 + bob, 58); ctx.fill();
    if (gumboot) { // a miner's hard hat with a lamp
      ctx.fillStyle = hgrad(ctx, -80, 80, [[0, '#a07810'], [0.35, '#f4c428'], [1, '#8a6a10']]);
      ctx.beginPath(); ctx.moveTo(-84, 96 + bob); ctx.quadraticCurveTo(0, -4 + bob, 84, 96 + bob); ctx.lineTo(96, 100 + bob); ctx.lineTo(-96, 100 + bob); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff6c0'; circ(ctx, 0, 46 + bob, 14); ctx.fill(); ctx.strokeStyle = '#6a5008'; ctx.lineWidth = 4; ctx.stroke();
    } else {
      ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.moveTo(-70, 120 + bob); ctx.quadraticCurveTo(0, 60 + bob, 70, 120 + bob); ctx.lineTo(60, 140 + bob); ctx.quadraticCurveTo(0, 90 + bob, -60, 140 + bob); ctx.closePath(); ctx.fill();
      ctx.fillStyle = hgrad(ctx, -92, 92, [[0, '#1a2a1c'], [0.4, '#4a6a48'], [1, '#14221a']]);
      ctx.beginPath(); ctx.moveTo(-96, 90 + bob); ctx.quadraticCurveTo(0, 20 + bob, 96, 90 + bob); ctx.lineTo(62, 74 + bob); ctx.quadraticCurveTo(0, -30 + bob, -62, 74 + bob); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#e8d8a8'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-60, 70 + bob); ctx.quadraticCurveTo(0, -20 + bob, 60, 70 + bob); ctx.stroke();
      ctx.strokeStyle = '#f2eee0'; ctx.lineWidth = 3; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.moveTo(30, 10 + bob); ctx.lineTo(48 + k * 7, -40 + bob + Math.abs(k - 4) * 3); ctx.stroke(); }
    }
  };

  const padDisc = (ctx, l, sp, f) => {
    const c = l.color, s = sp.r * (1 + 0.1 * f);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, sp.v + 4, sp.u + 8, s); ctx.fill();
    ctx.fillStyle = rgrad(ctx, sp.v, sp.u, s * 0.1, s * 1.05, [[0, mix('#2a2018', c, 0.25 + 0.4 * f)], [0.7, mix('#14100a', c, 0.18 + 0.35 * f)], [1, mix('#0a0806', c, 0.4)]], sp.v - s * 0.3, sp.u - s * 0.35); circ(ctx, sp.v, sp.u, s); ctx.fill();
    ctx.strokeStyle = rgba(lighter(c, 0.35 + 0.4 * f), 0.98); ctx.lineWidth = 5; circ(ctx, sp.v, sp.u, s - 2); ctx.stroke();
    ctx.strokeStyle = rgba(c, 0.35); ctx.lineWidth = 2; circ(ctx, sp.v, sp.u, s * 0.82); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ell(ctx, sp.v - s * 0.2, sp.u - s * 0.45, s * 0.55, s * 0.2); ctx.fill();
    if (f > 0.03) { glow(ctx, sp.v, sp.u, s * 2.2, c, 0.5 * f); for (let k = 0; k < 2; k++) { const p = clamp((1 - f) * 1.3 - k * 0.15, 0, 1); ctx.strokeStyle = rgba('#ffffff', 0.55 * (1 - p)); ctx.lineWidth = 3; circ(ctx, sp.v, sp.u, s * (0.9 + 0.8 * p)); ctx.stroke(); } }
    stepIcon(ctx, sp.ic ?? 'stomp', sp.v + 2, sp.u + 3, s * 0.5, 'rgba(0,0,0,0.5)', 0);
    stepIcon(ctx, sp.ic ?? 'stomp', sp.v, sp.u - 2, s * 0.5, lighter(c, 0.8), f);
  };

  st.draw = (g, rt) => {
    const { ctx } = g, F = st.F;
    if (!F) return;
    setting(ctx, F, dress.set.kind, S, rt, { ...dress.set, rugKind: null });
    ctx.save(); F.apply(ctx);
    if (bodyScene) {
      if (land) {
        ctx.save(); ctx.translate(0, 20); ctx.scale(0.6, 0.6); sceneBody(ctx, rt); ctx.restore();
        lanes.forEach((l, i) => { const a = anchors[i], sp = spots[i]; if (!a) return; ctx.strokeStyle = rgba(l.color, 0.55 + 0.4 * rt.flash[i]); ctx.lineWidth = 3; ctx.setLineDash([8, 7]); ctx.beginPath(); ctx.moveTo(sp.v + (sp.v < 0 ? sp.r : -sp.r), sp.u); ctx.lineTo(a.v, a.u); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = rgba(l.color, 0.9); circ(ctx, a.v, a.u, 7); ctx.fill(); });
      } else sceneBody(ctx, rt);
      if (!land && !gumboot) bunting(ctx, -ref.w / 2 + 20, 24, ref.w / 2 - 20, 24, 12, ['#2a58b8', '#f4f2ee'], 22, rt.anim);
    } else if (id === 'kolo') sceneKolo(ctx, rt);
    else if (id === 'dabke') sceneDabke(ctx, rt);
    else if (id === 'cueca') sceneCueca(ctx, rt);
    else if (id === 'pole') scenePole(ctx, rt);
    else sceneDabke(ctx, rt);
    lanes.forEach((l, i) => padDisc(ctx, l, spots[i], rt.flash[i]));
    for (let k = rt.list.length - 1; k >= 0; k--) {
      const t = rt.list[k];
      if (t.state && t.state !== 'pending' && t.state !== 'miss') continue;
      const tau = (t.t - rt.clock) / rt.look;
      if (tau > 1.0 || tau < -0.25) continue;
      const sp = spots[t.lane], l = lanes[t.lane], miss = t.state === 'miss';
      const a = (rt.soft ? 0.5 : 1) * (miss ? 0.35 : 1) * clamp((1.05 - tau) * 8, 0, 1) * clamp((tau + 0.25) * 6, 0, 1);
      const col = miss ? mix(l.color, '#555555', 0.6) : l.color, s = sp.r * (1.02 + 0.8 * clamp(tau, 0, 1.1));
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 10; circ(ctx, sp.v + 1, sp.u + 2, s); ctx.stroke();
      ctx.strokeStyle = rgba(lighter(col, 0.5), 0.98); ctx.lineWidth = 4.5; circ(ctx, sp.v, sp.u, s); ctx.stroke();
      ctx.strokeStyle = rgba(col, 0.45); ctx.lineWidth = 10; ctx.stroke(); ctx.restore();
    }
    ctx.restore();
    const size = g.px(15);
    lanes.forEach((l, i) => { const sp = spots[i], [x, y] = F.map(sp.v, sp.u + sp.r * 0.92); pill(ctx, l.name, x, y, Math.max(70, sp.r * F.scale * 2), size, l.color, rt.flash[i]); });
  };
  void footprint; void hash; void vgrad;
  return st;
}

// String instruments as the play surface: lutes and fiddles (neck, frets, body, bridge), the monochord (rod, gourd, harmonics)
// and harp-like zithers (qanun, harp, kora) whose strings ARE the lanes. Notes travel along the real string to the finger position.
import { clamp, mix, rgba, lighter, darker, glow, rrect, text, grain, hgrad, vgrad, rgrad, hash, gem, ell, circ, TAU } from './art.js';
import { makeFrame, circleSpot, rectSpot, finishSpots, hitSpots, pill, stringLine, lerp } from './stagekit.js';

// ---- which instrument is it? -----------------------------------------------------------------------------------------
const IDS = [
  [/dan.?bau|monochord/, 'danbau'], [/kamancha|kemanche|spike fiddle/, 'kamancha'], [/morin|khuur|matouqin|horse.?head/, 'morin'],
  [/goje|goge|one.?string/, 'goje'], [/qanun|kanun|kanoon/, 'qanun'], [/joropo|llanero|arpa|harp/, 'harp'], [/\bkora\b/, 'kora'],
  [/charango/, 'charango'], [/balalaika/, 'balalaika'], [/ukulele/, 'ukulele'], [/buzuq|bouzouki|bozuk/, 'buzuq'],
  [/rabab|rubab|rebab/, 'rabab'], [/panduri|chonguri/, 'panduri'], [/dombra|dombyra|komuz|saz|baglama/, 'dombra'],
];
export function stringId(key) { const k = String(key || '').toLowerCase(); for (const [re, id] of IDS) if (re.test(k)) return id; return 'lute'; }

// n = courses (physical strings the player can use), per = strings per course, fr = frets drawn (0 = fretless)
const PROF = {
  charango: { tilt: 0.12, dx: -0.12, zoom: 0.9, type: 'lute', n: 5, per: 2, fr: 12, body: 'charango', head: 'flat', pegs: 10, hole: 'round', wood: '#d3a050', edge: '#4a2a12', fb: '#2b1a0c', headF: 0.11, neckF: 0.38, bwr: 0.92, nutW: 0.30, brW: 0.50, gut: true, lps: false, tag: 'finger' },
  balalaika: { tilt: 0.55, dx: -0.1, zoom: 0.92, type: 'lute', n: 3, per: 1, fr: 14, body: 'tri', head: 'bent', pegs: 3, hole: 'round', wood: '#dba85a', edge: '#6a3a14', fb: '#241407', headF: 0.10, neckF: 0.44, bwr: 1.02, nutW: 0.15, brW: 0.30, gut: true, tag: 'finger' },
  ukulele: { tilt: 0.1, dx: -0.06, zoom: 0.98, type: 'lute', n: 4, per: 1, fr: 12, body: 'eight', head: 'round', pegs: 4, hole: 'round', wood: '#c4793a', edge: '#3a1d0a', fb: '#2a170a', headF: 0.10, neckF: 0.31, bwr: 0.72, nutW: 0.22, brW: 0.34, gut: true, lps: true, tag: 'finger' },
  buzuq: { lying: -1, type: 'lute', n: 3, per: 2, fr: 18, body: 'pear', head: 'angled', pegs: 6, hole: 'rosette', wood: '#a8662c', edge: '#2a1408', fb: '#1b0f06', headF: 0.11, neckF: 0.50, bwr: 0.95, nutW: 0.20, brW: 0.36, tag: 'mizrab', frets: 'moving' },
  rabab: { tilt: 0.5, dx: 0.12, zoom: 0.86, type: 'lute', n: 3, per: 1, fr: 9, body: 'rabab', head: 'wide', pegs: 6, hole: 'skin', wood: '#8a4a22', edge: '#2c1608', fb: '#1e1008', headF: 0.13, neckF: 0.30, bwr: 0.68, nutW: 0.20, brW: 0.34, tag: 'finger', sympa: 8 },
  panduri: { tilt: -0.5, dx: -0.12, zoom: 0.88, type: 'lute', n: 3, per: 1, fr: 7, body: 'pear', head: 'small', pegs: 3, hole: 'two', wood: '#8d5a2c', edge: '#2e1a0a', fb: '#2a1a0c', headF: 0.08, neckF: 0.46, bwr: 0.70, nutW: 0.15, brW: 0.30, tag: 'finger' },
  dombra: { type: 'lute', n: 2, per: 1, fr: 9, body: 'dombra', head: 'small', pegs: 2, hole: 'round', wood: '#b57a3c', edge: '#3a200c', fb: '#24140a', headF: 0.08, neckF: 0.50, bwr: 0.82, nutW: 0.10, brW: 0.22, tag: 'finger' },
  lute: { type: 'lute', n: 4, per: 1, fr: 12, body: 'pear', head: 'round', pegs: 4, hole: 'round', wood: '#a85f2b', edge: '#2e1a0a', fb: '#24140a', headF: 0.10, neckF: 0.42, bwr: 0.85, nutW: 0.18, brW: 0.34, tag: 'finger' },
  kamancha: { tilt: -0.08, dx: -0.12, zoom: 0.95, type: 'fiddle', n: 4, per: 1, fr: 0, body: 'bowl', head: 'kam', pegs: 4, hole: 'none', wood: '#7a4521', edge: '#2e1608', fb: '#1c0e06', headF: 0.14, neckF: 0.44, bwr: 0.98, nutW: 0.10, brW: 0.20, bow: true, spike: true, skin: true },
  morin: { tilt: 0, dx: -0.24, zoom: 0.8, type: 'fiddle', n: 2, per: 1, fr: 0, body: 'trap', head: 'horse', pegs: 2, hole: 'f', wood: '#6e3a1a', edge: '#2a1408', fb: '#1c0e06', headF: 0.19, neckF: 0.34, bwr: 0.82, nutW: 0.09, brW: 0.18, bow: true, skin: true },
  goje: { tilt: 0.75, dx: 0.2, zoom: 0.8, type: 'fiddle', n: 1, per: 1, fr: 0, body: 'bowl', head: 'curl', pegs: 1, hole: 'sound', wood: '#a8782f', edge: '#40240c', fb: '#2a170a', headF: 0.13, neckF: 0.36, bwr: 0.9, nutW: 0.0, brW: 0.0, bow: true, skin: true },
  danbau: { type: 'mono' }, qanun: { type: 'qanun' }, harp: { type: 'harp' }, kora: { type: 'kora' },
};
const SPECIAL = [[/strum|chord|tremolo|cuatro/i, 'strum'], [/maraca|shaker/i, 'shaker'], [/drum/i, 'tap']];
const STR_COL = { steel: ['#dfe4ee', '#ffffff'], bronze: ['#d2ad6c', '#fff0c0'], gut: ['#f1ead2', '#ffffff'], hair: ['#efe8d6', '#ffffff'] };
const SKIN = '#e9b98f';

export function createStringStage(id, S, lanes, P) {
  const prof = PROF[id] ?? PROF.lute;
  const N = lanes.length;
  const spots = new Array(N).fill(null);
  const cls = lanes.map((l) => SPECIAL.find(([re]) => re.test(l.name))?.[1] ?? 'note');
  const st = { id, kind: 'strings', spots, voice: prof.bow ? 'bow' : 'pluck', bowed: !!prof.bow, strumLanes: [], F: null, G: null };
  cls.forEach((c, i) => { if (c === 'strum') st.strumLanes.push(i); });

  // ---- lane -> string assignment (neck instruments) ---------------------------------------------------------------------
  const noteIdx = lanes.map((_, i) => i).filter((i) => cls[i] === 'note');
  const groups = [];
  const semis = (i, base) => 12 * Math.log2(lanes[i].hz / base);
  if (prof.type === 'lute' || prof.type === 'fiddle') {
    const digit = noteIdx.length && noteIdx.every((i) => /^\d+\s/.test(lanes[i].name));
    const explicit = noteIdx.length && noteIdx.every((i) => Number.isInteger(lanes[i].string));
    if (explicit) {
      const by = new Map();
      for (const i of noteIdx) { const k = lanes[i].string; if (!by.has(k)) by.set(k, []); by.get(k).push(i); }
      [...by.keys()].sort((a, b) => a - b).forEach((k) => groups.push({ key: `e${k}`, idx: by.get(k), fixed: k }));
    } else if (prof.lps && noteIdx.length <= prof.n) noteIdx.forEach((i) => groups.push({ key: `s${i}`, idx: [i] }));
    else if (digit) {
      const by = new Map();
      for (const i of noteIdx) { const d = Number(/^\d+/.exec(lanes[i].name)[0]); if (!by.has(d)) by.set(d, []); by.get(d).push(i); }
      [...by.keys()].sort((a, b) => b - a).forEach((d) => groups.push({ key: `d${d}`, idx: by.get(d) }));
    } else {
      const by = new Map();
      for (const i of noteIdx) {
        const key = /drone/i.test(lanes[i].name) ? `drone${i}` : `r${lanes[i].row}`;
        if (!by.has(key)) by.set(key, []);
        by.get(key).push(i);
      }
      [...by.values()].map((idx) => ({ key: 'r', idx })).sort((a, b) => Math.min(...a.idx.map((i) => lanes[i].hz)) - Math.min(...b.idx.map((i) => lanes[i].hz))).forEach((g) => groups.push(g));
    }
    for (const g of groups) g.idx.sort((a, b) => lanes[a].hz - lanes[b].hz);
    const n = Math.max(prof.n, groups.length);
    st.nStr = n;
    const start = groups.length >= n ? 0 : Math.floor((n - groups.length) / 2 * (prof.centre ? 1 : 0));
    groups.forEach((g, gi) => { g.s = g.fixed != null ? Math.min(g.fixed, n - 1) : start + gi; });
  }
  const laneString = new Array(N).fill(-1);
  for (const g of groups) for (const i of g.idx) laneString[i] = g.s;

  // ---- geometry per frame ------------------------------------------------------------------------------------------------
  st.layout = (area) => {
    const F = makeFrame(area, { top: 40, bottom: 10, side: 12, tilt: prof.tilt, lying: prof.lying, dx: prof.dx, zoom: prof.zoom });
    st.F = F;
    if (prof.type === 'lute' || prof.type === 'fiddle') layoutNeck(F);
    else if (prof.type === 'mono') layoutMono(F);
    else layoutHarp(F);
    finishSpots(F, spots);
  };

  function layoutNeck(F) {
    const { W, H } = F, n = st.nStr;
    const headH = H * prof.headF, nutU = headH;
    const spikeH = prof.spike ? H * 0.06 : 0;
    const bodyU = H * (prof.headF + prof.neckF), bl = H - bodyU - 10 - spikeH;
    const bw = Math.min(W * 0.94, bl * prof.bwr);
    const bridgeU = bodyU + bl * (prof.body === 'tri' ? 0.80 : prof.body === 'eight' ? 0.80 : prof.body === 'bowl' || prof.body === 'gourd' ? 0.70 : prof.body === 'trap' ? 0.78 : 0.82);
    const fbEnd = prof.fr ? bodyU + bl * (prof.body === 'eight' ? 0.30 : 0.22) : bodyU + bl * 0.02;
    const nutW = Math.max(n > 1 ? 54 * (n - 1) : 0, bw * prof.nutW), brW = Math.max(n > 1 ? 66 * (n - 1) : 0, bw * prof.brW);
    const holeU = bodyU + bl * (prof.body === 'tri' ? 0.52 : prof.body === 'eight' ? 0.52 : 0.46);
    const G = { W, H, headH, nutU, bodyU, bl, bw, bridgeU, fbEnd, nutW, brW, holeU, n, spikeH, tailU: bodyU + bl };
    st.G = G;
    const vNut = (i) => (n > 1 ? (i - (n - 1) / 2) * (nutW / (n - 1)) : 0);
    const vBr = (i) => (n > 1 ? (i - (n - 1) / 2) * (brW / (n - 1)) : 0);
    G.vAt = (i, u) => lerp(vNut(i), vBr(i), (u - nutU) / (bridgeU - nutU));
    G.vNut = vNut; G.vBr = vBr;
    const fretCurve = (k) => 1 - 2 ** (-k / (12 * 1.6));
    const maxSemi = Math.max(prof.fr || 0, 7, ...groups.map((g) => (g.idx.length ? Math.round(semis(g.idx[g.idx.length - 1], lanes[g.idx[0]].hz)) : 0)));
    G.nf = prof.fr ? Math.max(prof.fr, maxSemi > prof.fr ? prof.fr : 0) : 0;
    G.fretU = (k) => nutU + (fbEnd - nutU) * (fretCurve(k) / fretCurve(Math.max(G.nf || 12, 12)));
    const posU = (sm) => (prof.fr ? (G.fretU(Math.max(0, Math.floor(sm) - 1)) + G.fretU(Math.floor(sm))) / 2 + (sm % 1) * 0 : nutU + (fbEnd - nutU) * (fretCurve(sm) / fretCurve(Math.max(maxSemi, 8))));
    const spacing = n > 1 ? brW / (n - 1) : 80, R = clamp(spacing * 0.5, 26, 36);
    const gap = 50;
    for (const g of groups) {
      const open = lanes[g.idx[0]].hz;
      let prev = -1;
      g.idx.forEach((i, k) => {
        const ef = Number.isInteger(lanes[i].fret);
        let sm = ef ? lanes[i].fret : Math.max(0, semis(i, open));
        if (prof.fr) { sm = Math.round(sm); if (k > 0 && sm <= prev && !ef) sm = prev + 1; prev = sm; }
        const isOpen = ef ? sm === 0 : k === 0;
        let u = isOpen ? nutU - 15 : posU(Math.min(Math.max(sm, 1), G.nf || 99));
        if (!isOpen && k > 0) { const pu = spots[g.idx[k - 1]].u; if (u < pu + gap) u = pu + gap; }
        spots[i] = circleSpot(G.vAt(g.s, u), u, R, { string: g.s, open: isOpen });
      });
      // pull the whole group back inside the playable length if it overran
      const last = spots[g.idx[g.idx.length - 1]];
      const limit = bridgeU - 12 - (prof.fr ? 0 : 0);
      if (last.u > limit && g.idx.length > 1) {
        const first = nutU + 2 * 0, span = limit - first;
        g.idx.forEach((i, k) => { if (k === 0) return; const u = first + (span * k) / (g.idx.length - 1) * 1.0; spots[i].u = Math.min(u + 20, limit); spots[i].v = G.vAt(g.s, spots[i].u); });
      }
    }
    // special lanes: strum bands over the sound hole (stacked), shakers and body taps
    const stru = st.strumLanes, hw = Math.max(brW, nutW) / 2 + 26;
    const zoneTop = bodyU + bl * 0.14, zoneBot = bridgeU - 6, bandH = clamp((zoneBot - zoneTop) / Math.max(1, stru.length), 26, 54);
    stru.forEach((i, k) => {
      const u = stru.length === 1 ? (holeU + bridgeU) / 2 : zoneTop + bandH * (k + 0.5);
      const w = G.vAt(0, u), wr = G.vAt(n - 1, u);
      spots[i] = rectSpot((w + wr) / 2, u, Math.max(Math.abs(wr - w) / 2 + 30, hw * 0.7), bandH / 2 + 2, { band: true, u0: u });
    });
    if (prof.type === 'fiddle') { // body drumming (goje) sits on the skin face
      const taps = lanes.map((_, i) => i).filter((i) => cls[i] === 'tap');
      taps.forEach((i, k) => {
        const cu = bodyU + bl * 0.5, rr = bw * 0.22;
        spots[i] = circleSpot(k === 0 ? -bw * 0.17 : bw * 0.17, cu + (k === 0 ? bl * 0.12 : -bl * 0.12), clamp(rr * 0.8, 28, 50), { tap: true });
      });
    }
    // anything left over (unknown names) gets a place on the lower bout
    let extra = 0;
    for (let i = 0; i < N; i++) if (!spots[i]) { spots[i] = circleSpot(((extra % 3) - 1) * bw * 0.28, bodyU + bl * (0.6 + 0.12 * Math.floor(extra / 3)), 30, { tap: true }); extra++; }
  }

  function layoutMono(F) {
    const { W, H } = F;
    const top = H * 0.16, bot = H * 0.95, bw = clamp(W * 0.13, 56, 92);
    const G = { W, H, top, bot, bw, rodU: top, gourdU: H * 0.36 };
    st.G = G;
    const stringV = 0;
    const nodes = lanes.map((l, i) => { const m = /\bH(\d+)\b/i.exec(l.name); return m ? { i, h: Number(m[1]), bend: /\b(dn|down|up)\b/i.test(l.name) ? (/up/i.test(l.name) ? 1 : -1) : 0 } : null; }).filter(Boolean);
    const len = bot - top - 20, u0 = top + 20;
    const hs = [...new Set(nodes.filter((n) => !n.bend).map((n) => n.h))].sort((a, b) => b - a);
    const hmax = Math.max(8, ...hs);
    const pos = (h) => { const real = (1 / h - 1 / hmax) / (0.5 - 1 / hmax); const rank = (hs.length > 1 ? (hs.length - 1 - hs.indexOf(h)) / (hs.length - 1) : 0.5); return bot - 20 - len * 0.82 * (1 - (0.5 * real + 0.5 * (1 - rank))) ; };
    G.pos = pos;
    // base notes sit on the string; bend notes sit beside their node (left = bend down, right = bend up)
    nodes.forEach((n) => { const u = pos(n.h); spots[n.i] = circleSpot(n.bend * (bw * 0.5 + 52), u, 30, { node: true, bend: n.bend }); });
    for (let i = 0; i < N; i++) if (!spots[i]) spots[i] = circleSpot(0, bot - 60 - i * 8, 30, {});
    G.stringV = stringV;
  }

  function layoutHarp(F) {
    const { W, H } = F;
    const G = { W, H };
    st.G = G;
    if (prof.type === 'qanun') {
      const x0 = -W * 0.46, x1 = W * 0.46, cnt = N, topU = H * 0.05, bridgeL = H * 0.90, bridgeR = H * 0.60;
      G.board = { x0, x1, topU, bridgeL, bridgeR };
      G.stringU = (k) => ({ top: topU + 26, bot: lerp(bridgeL, bridgeR, (k + 0.5) / cnt) });
      for (let k = 0; k < cnt; k++) {
        const v = lerp(x0 + 30, x1 - 30, (k + 0.5) / cnt), s = G.stringU(k), u = s.bot - 50 - (k % 2) * 40;
        spots[k] = circleSpot(v, u, clamp(((x1 - x0 - 60) / cnt) * 0.5, 22, 34), { string: k });
      }
    } else if (prof.type === 'harp') {
      const propsH = H * 0.17, hh = H - propsH - 8;
      G.hh = hh; G.NS = 21;
      // the harp: pillar on the right, curved neck on top, sound box at the bottom, strings between neck and soundboard
      const NS = G.NS, left = -W * 0.40, right = W * 0.34;
      G.frame = { left, right, neckTop: H * 0.03, boxTop: hh * 0.74, boxBot: hh };
      const cnt = N;
      const mainIdx = lanes.map((_, i) => i).filter((i) => cls[i] === 'note').sort((a, b) => lanes[a].hz - lanes[b].hz);
      G.strU = (s) => { // string s of NS: top on the curved neck, bottom on the slanted soundboard
        const t = s / (NS - 1), x = lerp(left, right, t);
        return { x, top: G.frame.neckTop + 30 + 70 * Math.sin(t * 2.0) * 0.6 + 160 * (1 - t) * (1 - t) * 0 + t * 110, bot: lerp(G.frame.boxTop + 24, G.frame.boxTop + hh * 0.12, 1 - t) - 0 };
      };
      // lanes take the strings their pitch implies: bass trio low, melody higher
      const lo = Math.min(...mainIdx.map((i) => lanes[i].hz)), hi = Math.max(...mainIdx.map((i) => lanes[i].hz));
      let used = new Set(), prevS = -9;
      mainIdx.forEach((i, rank) => {
        let sIdx = Math.round(((Math.log2(lanes[i].hz) - Math.log2(lo)) / Math.max(0.1, Math.log2(hi) - Math.log2(lo))) * (NS - 3)) + 1;
        if (sIdx < prevS + 2) sIdx = prevS + 2;
        sIdx = Math.min(sIdx, NS - 2); while (used.has(sIdx)) sIdx--;
        prevS = sIdx; used.add(sIdx);
        const su = G.strU(sIdx), u = lerp(su.top, su.bot, 0.5 + 0.14 * (rank % 2 ? 1 : -1));
        spots[i] = circleSpot(su.x, u, 26, { string: sIdx });
      });
      G.used = used;
      // props: the cuatro (strum) and the maracas (shake)
      const pu = hh + 14 + (H - hh - 14) / 2 - 4;
      lanes.forEach((l, i) => {
        if (cls[i] === 'strum') spots[i] = rectSpot(-W * 0.22, pu, W * 0.22, propsH * 0.36, { band: false });
        else if (cls[i] === 'shaker') spots[i] = circleSpot(W * 0.22, pu, Math.min(propsH * 0.42, 54), {});
      });
      G.propsU = pu;
    } else { // kora
      const boxU = H * 0.70, boxH = H * 0.28;
      G.boxU = boxU; G.boxH = boxH; G.bridgeU = boxU + boxH * 0.14;
      const left = lanes.map((_, i) => i).filter((i) => lanes[i].row === 0), right = lanes.map((_, i) => i).filter((i) => lanes[i].row !== 0);
      G.sets = [left, right];
      const neckX = 0;
      [left, right].forEach((set, si) => {
        const sgn = si === 0 ? -1 : 1;
        set.forEach((i, k) => {
          const t = set.length > 1 ? k / (set.length - 1) : 0.5;
          const topU = H * 0.04 + t * H * 0.42, topV = neckX + sgn * 16;
          const botV = sgn * (24 + t * W * 0.20), botU = G.bridgeU;
          spots[i] = circleSpot(lerp(topV, botV, 0.62) + sgn * 6 + sgn * 0, lerp(topU, botU, 0.62), 25, { string: i, topU, topV, botV, botU, set: si });
        });
      });
    }
    for (let i = 0; i < N; i++) if (!spots[i]) spots[i] = circleSpot(0, H * 0.5 + i * 10, 28, {});
  }

  st.hit = (x, y) => (st.F ? hitSpots(st.F, spots, x, y) : -1);
  st.anchor = (i) => ({ x: spots[i]?.x ?? 0, y: spots[i]?.y ?? 0 });

  // a strum sounds the open strings low to high; a chord lane sounds a triad on its own root
  st.strumPitches = (i) => {
    const hz = lanes[i].hz;
    if (/chord/i.test(lanes[i].name)) return [hz, hz * 1.26, hz * 1.5, hz * 2];
    const open = groups.map((g) => lanes[g.idx[0]].hz).sort((a, b) => a - b);
    return open.length > 1 ? open : [hz, hz * 1.5, hz * 2];
  };

  let lastAnimT = 0;
  // ---- gestures (presentation + extra quiet sounds; scoring only ever reads taps) ---------------------------------------------------------
  const kick = new Array(40).fill(0);       // extra ring energy per string after a swipe across it
  let drag = null, lastP = null, bowSpeed = 0, bendLive = 0, lastTone = -9, lastAt = 0;
  // the string lines the swipe can cross: [{ v(u), hz, idx, u0, u1 }]
  const swipeLines = () => {
    const G = st.G, out = [];
    if (!G) return out;
    if (prof.type === 'lute' || prof.type === 'fiddle') {
      const zt = G.holeU - G.bl * 0.22, zb = G.bridgeU + 12;
      for (let s = 0; s < G.n; s++) {
        const g = groups.find((q) => q.s === s), hz = g ? lanes[g.idx[0]].hz : (lanes.find((_, i) => laneString[i] < 0)?.hz ?? 220) * (1 + s * 0.12);
        out.push({ idx: s, v: (u) => G.vAt(s, u), hz, u0: zt, u1: zb });
      }
    } else if (prof.type === 'qanun') {
      lanes.forEach((l, i) => out.push({ idx: i, v: () => spots[i].v, hz: l.hz, u0: G.board.topU + 40, u1: G.board.bridgeL }));
    } else if (prof.type === 'harp' || prof.type === 'kora') {
      lanes.forEach((l, i) => { if (spots[i] && (spots[i].string != null)) out.push({ idx: i, v: () => spots[i].v, hz: l.hz, u0: spots[i].u - 150, u1: spots[i].u + 120 }); });
    }
    return out;
  };
  // returns extra tones to play for this pointer sample
  st.pointer = (p) => {
    const out = [];
    if (!st.F || !p) return out;
    const [lv, lu] = st.F.inv(p.x, p.y);
    if (p.pressed) { drag = { lv, lu }; lastP = { lv, lu }; bowSpeed = 0; }
    if (!p.down) { lastP = null; drag = null; bendLive *= 0.9; bowSpeed *= 0.8; return out; }
    if (lastP) {
      const dv = lv - lastP.lv, du = lu - lastP.lu;
      bowSpeed = bowSpeed * 0.7 + Math.min(40, Math.abs(prof.bow ? dv : dv)) * 0.3;
      if (prof.type === 'mono' && drag) bendLive = clamp(-(lu - drag.lu) / 150, -1, 1);
      // a sweep across several strings sounds each one softly (strum, glissando)
      for (const ln of swipeLines()) {
        if (lu < ln.u0 || lu > ln.u1) continue;
        const a = lastP.lv - ln.v(lastP.lu), b = lv - ln.v(lu);
        if ((a <= 0 && b > 0) || (a >= 0 && b < 0)) {
          kick[ln.idx] = 1;
          if (p.clock - lastAt > 0.012) out.push({ freq: ln.hz, to: ln.hz * 0.997, dur: 0.5, type: prof.bow ? 'sine' : 'triangle', vol: 0.07 });
        }
      }
      if (prof.bow && bowSpeed > 4 && p.sounding && p.clock - lastTone > 0.1) { lastTone = p.clock; out.push({ freq: p.sounding.hz, dur: 0.22, type: 'sine', vol: 0.05 }); }
      if (prof.type === 'mono' && Math.abs(bendLive) > 0.08 && p.sounding && p.clock - lastTone > 0.12) { lastTone = p.clock; out.push({ freq: p.sounding.hz * 2 ** (bendLive * 2 / 12), dur: 0.2, type: 'triangle', vol: 0.07 }); }
    }
    lastAt = p.clock;
    lastP = { lv, lu };
    return out;
  };
  const decayKick = (dt) => { for (let i = 0; i < kick.length; i++) kick[i] = Math.max(0, kick[i] - dt * 3); bowSpeed *= 1 - Math.min(1, dt * 3); if (!drag) bendLive *= 1 - Math.min(1, dt * 4); };

  // ---- shared pieces ---------------------------------------------------------------------------------------------------------
  const woodGrad = (ctx, x0, x1, c) => hgrad(ctx, x0, x1, [[0, darker(c, 0.5)], [0.25, lighter(c, 0.22)], [0.55, c], [0.85, darker(c, 0.3)], [1, darker(c, 0.6)]]);
  const peg = (ctx, v, u, s, col, vert = false) => {
    ctx.save(); ctx.translate(v, u);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ell(ctx, 2, 3, s * (vert ? 0.5 : 1), s * (vert ? 1 : 0.5)); ctx.fill();
    ctx.fillStyle = rgrad(ctx, 0, 0, 0, s, [[0, lighter(col, 0.55)], [0.6, col], [1, darker(col, 0.5)]], -s * 0.3, -s * 0.3);
    ell(ctx, 0, 0, s * (vert ? 0.5 : 1), s * (vert ? 1 : 0.55)); ctx.fill();
    ctx.restore();
  };

  const OUT = {
    pear: (ctx, w, l) => { const a = w / 2; ctx.beginPath(); ctx.moveTo(-w * 0.2, 0); ctx.bezierCurveTo(-w * 0.28, l * 0.12, -a, l * 0.2, -a, l * 0.56); ctx.bezierCurveTo(-a, l * 0.9, -w * 0.24, l, 0, l); ctx.bezierCurveTo(w * 0.24, l, a, l * 0.9, a, l * 0.56); ctx.bezierCurveTo(a, l * 0.2, w * 0.28, l * 0.12, w * 0.2, 0); ctx.closePath(); },
    dombra: (ctx, w, l) => { const a = w / 2; ctx.beginPath(); ctx.moveTo(-w * 0.14, 0); ctx.bezierCurveTo(-w * 0.2, l * 0.1, -a, l * 0.18, -a, l * 0.5); ctx.bezierCurveTo(-a, l * 0.88, -w * 0.3, l, 0, l); ctx.bezierCurveTo(w * 0.3, l, a, l * 0.88, a, l * 0.5); ctx.bezierCurveTo(a, l * 0.18, w * 0.2, l * 0.1, w * 0.14, 0); ctx.closePath(); },
    charango: (ctx, w, l) => { const a = w / 2; ctx.beginPath(); ctx.moveTo(-w * 0.2, 0); ctx.bezierCurveTo(-w * 0.34, l * 0.1, -a, l * 0.22, -a * 0.96, l * 0.5); ctx.bezierCurveTo(-a * 0.98, l * 0.8, -w * 0.3, l, 0, l); ctx.bezierCurveTo(w * 0.3, l, a * 0.98, l * 0.8, a * 0.96, l * 0.5); ctx.bezierCurveTo(a, l * 0.22, w * 0.34, l * 0.1, w * 0.2, 0); ctx.closePath(); },
    tri: (ctx, w, l) => { ctx.beginPath(); ctx.moveTo(-w * 0.1, 0); ctx.lineTo(w * 0.1, 0); ctx.lineTo(w * 0.455, l * 0.86); ctx.quadraticCurveTo(w * 0.52, l * 0.99, w * 0.4, l * 0.995); ctx.quadraticCurveTo(0, l * 1.03, -w * 0.4, l * 0.995); ctx.quadraticCurveTo(-w * 0.52, l * 0.99, -w * 0.455, l * 0.86); ctx.closePath(); },
    eight: (ctx, w, l) => { const a = w / 2; ctx.beginPath(); ctx.moveTo(-w * 0.2, 0); ctx.bezierCurveTo(-w * 0.34, l * 0.06, -a * 0.8, l * 0.14, -a * 0.82, l * 0.3); ctx.bezierCurveTo(-a * 0.84, l * 0.4, -a * 0.58, l * 0.43, -a * 0.6, l * 0.5); ctx.bezierCurveTo(-a * 0.64, l * 0.6, -a * 1.0, l * 0.62, -a, l * 0.8); ctx.bezierCurveTo(-a, l * 0.96, -w * 0.2, l, 0, l); ctx.bezierCurveTo(w * 0.2, l, a, l * 0.96, a, l * 0.8); ctx.bezierCurveTo(a * 1.0, l * 0.62, a * 0.64, l * 0.6, a * 0.6, l * 0.5); ctx.bezierCurveTo(a * 0.58, l * 0.43, a * 0.84, l * 0.4, a * 0.82, l * 0.3); ctx.bezierCurveTo(a * 0.8, l * 0.14, w * 0.34, l * 0.06, w * 0.2, 0); ctx.closePath(); },
    rabab: (ctx, w, l) => { const a = w / 2; ctx.beginPath(); ctx.moveTo(-w * 0.16, 0); ctx.bezierCurveTo(-w * 0.36, l * 0.02, -a * 0.66, l * 0.1, -a * 0.62, l * 0.24); ctx.bezierCurveTo(-a * 0.58, l * 0.34, -a * 0.28, l * 0.34, -a * 0.34, l * 0.42); ctx.bezierCurveTo(-a * 0.5, l * 0.48, -a * 1.0, l * 0.5, -a, l * 0.72); ctx.bezierCurveTo(-a, l * 0.95, -w * 0.2, l, 0, l); ctx.bezierCurveTo(w * 0.2, l, a, l * 0.95, a, l * 0.72); ctx.bezierCurveTo(a, l * 0.5, a * 0.5, l * 0.48, a * 0.34, l * 0.42); ctx.bezierCurveTo(a * 0.28, l * 0.34, a * 0.58, l * 0.34, a * 0.62, l * 0.24); ctx.bezierCurveTo(a * 0.66, l * 0.1, w * 0.36, l * 0.02, w * 0.16, 0); ctx.closePath(); },
    bowl: (ctx, w, l) => { ctx.beginPath(); ctx.ellipse(0, l / 2, w / 2, l / 2, 0, 0, TAU); ctx.closePath(); },
    gourd: (ctx, w, l) => { ctx.beginPath(); ctx.moveTo(-w * 0.12, 0); ctx.bezierCurveTo(-w * 0.5, l * 0.04, -w * 0.58, l * 0.7, 0, l); ctx.bezierCurveTo(w * 0.58, l * 0.7, w * 0.5, l * 0.04, w * 0.12, 0); ctx.closePath(); },
    trap: (ctx, w, l) => { const r = 14; ctx.beginPath(); ctx.moveTo(-w * 0.27 + r, 0); ctx.lineTo(w * 0.27 - r, 0); ctx.quadraticCurveTo(w * 0.27, 0, w * 0.28, r * 0.9); ctx.lineTo(w * 0.5 - 3, l - r); ctx.quadraticCurveTo(w * 0.5, l, w * 0.5 - r, l); ctx.lineTo(-w * 0.5 + r, l); ctx.quadraticCurveTo(-w * 0.5, l, -w * 0.5 + 3, l - r); ctx.lineTo(-w * 0.28, r * 0.9); ctx.quadraticCurveTo(-w * 0.27, 0, -w * 0.27 + r, 0); ctx.closePath(); },
  };

  const paintBody = (ctx, G) => {
    const { bw, bl } = G, kind = prof.body, out = OUT[kind] ?? OUT.pear;
    ctx.save(); ctx.translate(G.W * 0 + 0, G.bodyU);
    // drop shadow
    ctx.save(); ctx.translate(6, 9); out(ctx, bw, bl); ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fill(); ctx.restore();
    const skin = prof.skin && (kind === 'bowl' || kind === 'gourd' || kind === 'trap');
    // shell rim visible around a skin face
    out(ctx, bw, bl);
    ctx.fillStyle = woodGrad(ctx, -bw / 2, bw / 2, prof.wood); ctx.fill();
    ctx.save(); out(ctx, bw, bl); ctx.clip();
    grain(ctx, -bw / 2, 0, bw, bl, darker(prof.wood, 0.7), 0.35, 11 + (id.length * 7), true, Math.max(14, Math.round(bw / 12)));
    ctx.fillStyle = vgrad(ctx, 0, bl, [[0, 'rgba(0,0,0,0.38)'], [0.2, 'rgba(0,0,0,0)'], [0.8, 'rgba(0,0,0,0.05)'], [1, 'rgba(0,0,0,0.35)']]); ctx.fillRect(-bw, 0, bw * 2, bl);
    ctx.restore();
    if (skin) { // stretched parchment inside a wooden hoop
      ctx.save(); ctx.translate(0, 0);
      const inset = kind === 'trap' ? 0.88 : 0.86;
      ctx.translate(0, bl * (1 - inset) / 2); ctx.scale(inset, inset);
      out(ctx, bw, bl); ctx.fillStyle = hgrad(ctx, -bw / 2, bw / 2, [[0, '#cdb88c'], [0.35, '#f6ecd0'], [0.65, '#ead9b0'], [1, '#bfa77a']]); ctx.fill();
      ctx.save(); out(ctx, bw, bl); ctx.clip();
      ctx.strokeStyle = 'rgba(120,90,50,0.16)'; ctx.lineWidth = 1;
      for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc((hash(k) - 0.5) * bw * 0.4, bl * (0.2 + 0.12 * k), bw * (0.12 + 0.08 * k), hash(k + 3) * 6, hash(k + 3) * 6 + 2.4); ctx.stroke(); }
      ctx.fillStyle = vgrad(ctx, 0, bl, [[0, 'rgba(60,35,10,0.25)'], [0.3, 'rgba(0,0,0,0)'], [1, 'rgba(60,35,10,0.2)']]); ctx.fillRect(-bw, 0, bw * 2, bl);
      ctx.restore();
      ctx.strokeStyle = darker(prof.wood, 0.4); ctx.lineWidth = 3; out(ctx, bw, bl); ctx.stroke();
      ctx.restore();
    } else {
      // soundboard bevel + binding
      ctx.save(); out(ctx, bw, bl); ctx.clip();
      ctx.strokeStyle = prof.id === 'x' ? '#000' : '#f0dfb4'; ctx.lineWidth = 10; ctx.globalAlpha = 0.85; out(ctx, bw, bl); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.strokeStyle = darker(prof.wood, 0.65); ctx.lineWidth = 4; out(ctx, bw, bl); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  };

  const hexRing = (ctx, cx, cy, r, c) => { // armadillo-shell scutes around a rosette
    ctx.strokeStyle = rgba(c, 0.55); ctx.lineWidth = 1.4;
    for (let k = 0; k < 18; k++) { const a = (k / 18) * TAU; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; ctx.beginPath(); for (let j = 0; j < 6; j++) { const b = (j / 6) * TAU + a; ctx.lineTo(x + Math.cos(b) * r * 0.19, y + Math.sin(b) * r * 0.19); } ctx.closePath(); ctx.stroke(); }
  };

  const faceDetail = (ctx, G) => {
    const { bw, bl, bodyU } = G, hu = G.holeU - bodyU;
    ctx.save(); ctx.translate(0, bodyU);
    const hr = clamp(Math.min(bw * 0.17, bl * 0.12), 16, 70);
    const hole = (cx, cy, r, ring = true) => {
      if (ring) { for (const [k, c] of [[1.5, '#ead7a4'], [1.3, '#3a2210'], [1.15, '#cfa65c']]) { circ(ctx, cx, cy, r * k); ctx.fillStyle = c; ctx.fill(); } }
      ctx.fillStyle = rgrad(ctx, cx, cy, 0, r, [[0, '#000'], [0.75, '#150a04'], [1, '#33200f']]); circ(ctx, cx, cy, r); ctx.fill();
    };
    if (prof.hole === 'round') {
      hole(0, hu, hr);
      if (id === 'charango') hexRing(ctx, 0, hu, hr * 1.95, '#4a2a12');

    } else if (prof.hole === 'rosette') { // buzuq: carved rosette between two small holes
      hole(0, hu, hr * 1.1);
      ctx.strokeStyle = 'rgba(245,225,170,0.9)'; ctx.lineWidth = 2.5;
      for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * hr * 1.7, hu + Math.sin(a) * hr * 1.7); ctx.lineTo(Math.cos(a) * hr * 2.3, hu + Math.sin(a) * hr * 2.3); ctx.stroke(); }
      ctx.fillStyle = 'rgba(10,6,4,0.5)'; ctx.beginPath(); ctx.moveTo(bw * 0.2, hu + hr * 2.3); ctx.quadraticCurveTo(bw * 0.4, hu + hr * 1.6, bw * 0.42, hu + hr * 3.4); ctx.quadraticCurveTo(bw * 0.3, hu + hr * 3.2, bw * 0.2, hu + hr * 2.3); ctx.fill();
      ctx.strokeStyle = 'rgba(245,225,170,0.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, hu, hr * 3.1, 0.4, 2.7); ctx.stroke();
    } else if (prof.hole === 'two') { // panduri: a pair of small round holes
      hole(bw * 0.22, hu - hr * 0.9, hr * 0.34, true); hole(bw * 0.3, hu + hr * 0.2, hr * 0.26, true); hole(bw * 0.2, hu + hr * 1.0, hr * 0.2, true);
    } else if (prof.hole === 'skin') { // rabab: parchment belly in the lower chamber, stitched
      ctx.save(); OUT.rabab(ctx, bw, bl); ctx.clip();
      ctx.fillStyle = hgrad(ctx, -bw / 2, bw / 2, [[0, '#c9b085'], [0.4, '#f4e8c8'], [0.7, '#e2cfa0'], [1, '#b99e6c']]);
      ctx.fillRect(-bw, bl * 0.46, bw * 2, bl);
      ctx.fillStyle = 'rgba(60,35,12,0.55)';
      for (let k = 0; k < 26; k++) { const a = (k / 25) * Math.PI; circ(ctx, -bw * 0.5 + (k / 25) * bw, bl * 0.47 + Math.sin(a) * 0, 2.3); ctx.fill(); }
      ctx.strokeStyle = 'rgba(80,50,20,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-bw, bl * 0.47); ctx.lineTo(bw, bl * 0.47); ctx.stroke();
      ctx.restore();
      for (const d of [-1, 0, 1]) hole(d * bw * 0.12, bl * 0.18 + Math.abs(d) * 6, hr * 0.32, false);
    } else if (prof.hole === 'sound') { // goje: little round sound holes in the skin and a ring of studs
      hole(-bw * 0.14, bl * 0.2, hr * 0.28, false); hole(bw * 0.14, bl * 0.2, hr * 0.28, false);
      ctx.fillStyle = '#8c6a34';
      for (let k = 0; k < 20; k++) { const a = (k / 20) * TAU; circ(ctx, Math.cos(a) * bw * 0.4, bl * 0.52 + Math.sin(a) * bl * 0.4, 2.6); ctx.fill(); }
    } else if (prof.hole === 'f') { // morin khuur: two f-shaped sound holes
      for (const d of [-1, 1]) { ctx.save(); ctx.translate(d * bw * 0.2, bl * 0.4); ctx.rotate(-d * 0.15); ctx.fillStyle = '#1a0d05'; rrect(ctx, -4, -bl * 0.1, 8, bl * 0.2, 4); ctx.fill(); circ(ctx, d * -4, -bl * 0.1, 6); ctx.fill(); circ(ctx, d * 4, bl * 0.1, 6); ctx.fill(); ctx.restore(); }
    }
    if (id === 'kamancha') { // mother-of-pearl dots round the skin, and the spike beneath
      ctx.fillStyle = 'rgba(255,248,230,0.92)';
      for (let k = 0; k < 30; k++) { const a = (k / 30) * TAU; circ(ctx, Math.cos(a) * bw * 0.485, bl * 0.5 + Math.sin(a) * bl * 0.485, 2.6); ctx.fill(); }
    }
    ctx.restore();
  };

  const headDraw = (ctx, G, rt) => {
    const { nutU, headH } = G, n = G.n, w0 = Math.max(G.nutW + 34, 40);
    const wood = darker(prof.wood, 0.45);
    ctx.save();
    const body = () => {
      ctx.beginPath();
      if (prof.head === 'horse') { // carved horse head: arched neck, ears, muzzle
        const h = headH;
        ctx.moveTo(-14, nutU); ctx.lineTo(-18, h * 0.62); ctx.bezierCurveTo(-34, h * 0.5, -46, h * 0.3, -44, h * 0.14);
        ctx.bezierCurveTo(-48, h * 0.08, -40, 4, -32, h * 0.08); ctx.lineTo(-28, 2); ctx.lineTo(-20, h * 0.1); // ear
        ctx.bezierCurveTo(-6, h * 0.0, 14, h * 0.02, 26, h * 0.16); ctx.lineTo(34, h * 0.12);
        ctx.bezierCurveTo(46, h * 0.22, 48, h * 0.4, 36, h * 0.46); ctx.bezierCurveTo(30, h * 0.5, 24, h * 0.5, 22, h * 0.58);
        ctx.bezierCurveTo(26, h * 0.8, 20, h * 0.92, 14, nutU); ctx.closePath();
      } else if (prof.head === 'kam') {
        ctx.moveTo(-13, nutU); ctx.lineTo(-17, headH * 0.4); ctx.quadraticCurveTo(-26, headH * 0.14, -10, headH * 0.06); ctx.quadraticCurveTo(0, -2, 10, headH * 0.06); ctx.quadraticCurveTo(26, headH * 0.14, 17, headH * 0.4); ctx.lineTo(13, nutU); ctx.closePath();
      } else if (prof.head === 'curl') {
        ctx.moveTo(-9, nutU); ctx.lineTo(-10, headH * 0.4); ctx.bezierCurveTo(-26, headH * 0.34, -28, headH * 0.04, -6, headH * 0.04); ctx.bezierCurveTo(8, headH * 0.04, 12, headH * 0.2, 4, headH * 0.26); ctx.lineTo(10, nutU); ctx.closePath();
      } else if (prof.head === 'bent') {
        ctx.moveTo(-w0 * 0.5, nutU); ctx.lineTo(-w0 * 0.58, headH * 0.18); ctx.quadraticCurveTo(0, -4, w0 * 0.58, headH * 0.18); ctx.lineTo(w0 * 0.5, nutU); ctx.closePath();
      } else if (prof.head === 'angled') {
        ctx.moveTo(-w0 * 0.5, nutU); ctx.lineTo(-w0 * 0.72, headH * 0.34); ctx.lineTo(-w0 * 0.55, 2); ctx.lineTo(w0 * 0.55, 2); ctx.lineTo(w0 * 0.72, headH * 0.34); ctx.lineTo(w0 * 0.5, nutU); ctx.closePath();
      } else if (prof.head === 'wide') {
        ctx.moveTo(-w0 * 0.5, nutU); ctx.lineTo(-w0 * 0.95, headH * 0.7); ctx.lineTo(-w0 * 0.95, headH * 0.1); ctx.quadraticCurveTo(0, -10, w0 * 0.95, headH * 0.1); ctx.lineTo(w0 * 0.95, headH * 0.7); ctx.lineTo(w0 * 0.5, nutU); ctx.closePath();
      } else if (prof.head === 'flat') {
        rrect(ctx, -w0 * 0.78, 2, w0 * 1.56, headH - 2, 14);
      } else if (prof.head === 'small') {
        ctx.moveTo(-w0 * 0.45, nutU); ctx.lineTo(-w0 * 0.6, headH * 0.3); ctx.quadraticCurveTo(0, -6, w0 * 0.6, headH * 0.3); ctx.lineTo(w0 * 0.45, nutU); ctx.closePath();
      } else { // round
        ctx.moveTo(-w0 * 0.44, nutU); ctx.bezierCurveTo(-w0 * 0.8, headH * 0.7, -w0 * 0.6, 0, 0, 0); ctx.bezierCurveTo(w0 * 0.6, 0, w0 * 0.8, headH * 0.7, w0 * 0.44, nutU); ctx.closePath();
      }
    };
    ctx.save(); ctx.translate(4, 6); body(); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill(); ctx.restore();
    body(); ctx.fillStyle = hgrad(ctx, -w0, w0, [[0, darker(wood, 0.4)], [0.4, lighter(wood, 0.25)], [1, darker(wood, 0.5)]]); ctx.fill();
    ctx.strokeStyle = 'rgba(255,225,170,0.4)'; ctx.lineWidth = 1.6; ctx.stroke();
    if (prof.head === 'horse') { // eye, mane tassel and the two big pegs behind the head
      circ(ctx, 14, headH * 0.26, 3); ctx.fillStyle = '#f0e0c0'; ctx.fill(); circ(ctx, 14, headH * 0.26, 1.6); ctx.fillStyle = '#100800'; ctx.fill();
      ctx.strokeStyle = '#d8c6a0'; ctx.lineWidth = 2; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(-24 + k * 0.5, headH * 0.14 + k * headH * 0.07); ctx.lineTo(-40, headH * 0.2 + k * headH * 0.08); ctx.stroke(); }
      peg(ctx, -30, headH * 0.66, 14, '#e8d2a0', true); peg(ctx, 30, headH * 0.72, 14, '#e8d2a0', true);
    } else {
      const per = Math.ceil(prof.pegs / 2);
      for (let k = 0; k < prof.pegs; k++) {
        const left = prof.pegs === 1 ? true : k % 2 === 0, row = Math.floor(k / 2), cnt = prof.head === 'wide' ? 3 : per;
        const u = headH * (0.2 + 0.7 * (cnt > 1 ? row / (cnt - 1) : 0.5)) * (prof.head === 'flat' ? 0.9 : 0.85) + (prof.head === 'wide' ? 4 : 0);
        const side = (left ? -1 : 1) * (w0 * (prof.head === 'wide' ? 0.95 : prof.head === 'flat' ? 0.78 : 0.55));
        peg(ctx, side, u, prof.head === 'wide' ? 12 : 9, left ? '#efe0b8' : '#efe0b8');
      }
    }
    // nut
    ctx.fillStyle = '#f2ead4'; rrect(ctx, -Math.max(G.nutW / 2 + 12, 14), nutU - 3, Math.max(G.nutW + 24, 28), 6, 3); ctx.fill();
    ctx.restore();
  };

  const neckDraw = (ctx, G) => {
    const { nutU, fbEnd, bridgeU, nutW, brW } = G, ext = prof.fr ? 0 : 0;
    const wAt = (u) => lerp(nutW, brW, (u - nutU) / (bridgeU - nutU)) + 26;
    const end = fbEnd + ext;
    // neck wood (runs under the body join)
    ctx.beginPath(); ctx.moveTo(-wAt(nutU) / 2 - 3, nutU); ctx.lineTo(wAt(nutU) / 2 + 3, nutU); ctx.lineTo(wAt(end) / 2 + 3, end); ctx.lineTo(-wAt(end) / 2 - 3, end); ctx.closePath();
    ctx.fillStyle = hgrad(ctx, -wAt(end) / 2, wAt(end) / 2, [[0, darker(prof.wood, 0.55)], [0.3, lighter(prof.wood, 0.1)], [0.7, prof.wood], [1, darker(prof.wood, 0.6)]]); ctx.fill();
    // fingerboard
    ctx.save(); ctx.translate(2, 3);
    ctx.beginPath(); ctx.moveTo(-wAt(nutU) / 2 + 3, nutU); ctx.lineTo(wAt(nutU) / 2 - 3, nutU); ctx.lineTo(wAt(end) / 2 - 3, end); ctx.lineTo(-wAt(end) / 2 + 3, end); ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.moveTo(-wAt(nutU) / 2 + 3, nutU); ctx.lineTo(wAt(nutU) / 2 - 3, nutU); ctx.lineTo(wAt(end) / 2 - 3, end); ctx.lineTo(-wAt(end) / 2 + 3, end); ctx.closePath();
    ctx.fillStyle = hgrad(ctx, -wAt(end) / 2, wAt(end) / 2, [[0, mix(prof.fb, '#000', 0.2)], [0.5, lighter(prof.fb, 0.18)], [1, mix(prof.fb, '#000', 0.2)]]); ctx.fill();
    ctx.save(); ctx.clip(); grain(ctx, -wAt(end) / 2, nutU, wAt(end), end - nutU, '#000', 0.45, 5, true, 10); ctx.restore();
    if (prof.fr) {
      const nf = G.nf;
      for (let k = 1; k <= nf; k++) {
        const u = G.fretU(k), w = wAt(u) / 2 - 2;
        ctx.strokeStyle = prof.frets === 'moving' ? '#a08a60' : '#e8e2d0'; ctx.lineWidth = prof.frets === 'moving' ? 2.2 : 3; ctx.beginPath(); ctx.moveTo(-w, u); ctx.lineTo(w, u); ctx.stroke();
        if (prof.frets !== 'moving') { ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-w, u - 1.5); ctx.lineTo(w, u - 1.5); ctx.stroke(); }
      }
      ctx.fillStyle = 'rgba(245,235,205,0.75)';
      for (const k of [3, 5, 7, 9, 12]) if (k <= nf) { const u = (G.fretU(k - 1) + G.fretU(k)) / 2; if (k === 12) { circ(ctx, -9, u, 4); ctx.fill(); circ(ctx, 9, u, 4); ctx.fill(); } else { circ(ctx, 0, u, 4); ctx.fill(); } }
    }
  };

  const bridgeDraw = (ctx, G) => {
    const { bridgeU, brW } = G, w = brW + 40;
    if (prof.type === 'fiddle') { // arched bridge on the skin
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.moveTo(-w / 2 + 3, bridgeU + 6); ctx.quadraticCurveTo(0, bridgeU - 14, w / 2 + 3, bridgeU + 6); ctx.lineTo(w / 2 + 3, bridgeU + 12); ctx.lineTo(-w / 2 + 3, bridgeU + 12); ctx.fill();
      ctx.fillStyle = vgrad(ctx, bridgeU - 12, bridgeU + 8, [[0, '#f0d9a8'], [1, '#8a5a24']]);
      ctx.beginPath(); ctx.moveTo(-w / 2, bridgeU + 6); ctx.quadraticCurveTo(0, bridgeU - 16, w / 2, bridgeU + 6); ctx.lineTo(w / 2 - 6, bridgeU + 8); ctx.quadraticCurveTo(0, bridgeU - 6, -w / 2 + 6, bridgeU + 8); ctx.closePath(); ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; rrect(ctx, -w / 2 + 3, bridgeU - 3, w, 15, 5); ctx.fill();
      ctx.fillStyle = vgrad(ctx, bridgeU - 6, bridgeU + 9, [[0, '#7a4a28'], [0.4, '#2c170a'], [1, '#150a04']]); rrect(ctx, -w / 2, bridgeU - 6, w, 15, 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,240,200,0.85)'; ctx.fillRect(-w / 2 + 6, bridgeU - 5, w - 12, 2);
    }
  };

  const strStyle = (i, n) => {
    const f = n > 1 ? i / (n - 1) : 0.5;
    if (prof.bow) return { w: 2.8 - 0.7 * f, c: STR_COL.hair };
    if (prof.gut) return { w: 2.6 - 1.2 * f, c: f < 0.45 ? STR_COL.bronze : STR_COL.gut };
    return { w: 2.8 - 1.4 * f, c: f < 0.35 ? STR_COL.bronze : STR_COL.steel };
  };

  // ---- the draw ------------------------------------------------------------------------------------------------------------------
  st.draw = (g, rt) => {
    const { ctx } = g, F = st.F, G = st.G;
    if (!F) return;
    decayKick(clamp(rt.anim - lastAnimT, 0, 0.1)); lastAnimT = rt.anim;
    const labels = [];
    ctx.save(); F.apply(ctx);
    if (prof.type === 'lute' || prof.type === 'fiddle') drawNeckInstrument(ctx, g, rt, G, labels);
    else if (prof.type === 'mono') drawMono(ctx, g, rt, G, labels);
    else if (prof.type === 'qanun') drawQanun(ctx, g, rt, G, labels);
    else if (prof.type === 'harp') drawHarp(ctx, g, rt, G, labels);
    else drawKora(ctx, g, rt, G, labels);
    ctx.restore();
    // names and approach markers sit upright in screen space
    const size = g.px(15);
    for (const l of labels) {
      const [x, y] = F.map(l.v, l.u);
      pill(ctx, l.s, x, y, l.w, size, l.col, l.f, l.o);
    }
  };

  // energy of each string: struck lanes ring it, strum lanes sweep across
  const stringEnergy = (rt, n) => {
    const e = new Array(n).fill(0);
    lanes.forEach((_, i) => {
      const f = rt.flash[i] * 0.95 + (rt.hold[i] ?? 0) * 0.45;
      if (f <= 0.01) return;
      if (cls[i] === 'strum') { for (let s = 0; s < n; s++) e[s] = Math.max(e[s], clamp(f * 1.5 - s * 0.09, 0, 1)); }
      else if (laneString[i] >= 0) e[laneString[i]] = Math.max(e[laneString[i]], f);
    });
    for (let s = 0; s < n; s++) e[s] = Math.max(e[s], kick[s] * 0.8);
    return e;
  };

  // the cue for one target: a gem slides from the head along the string to the fingered position, ringed by a closing outline
  const cueNeck = (ctx, t, tau, rt, G, labels) => {
    const sp = spots[t.lane], l = lanes[t.lane];
    if (!sp) return;
    const miss = t.state === 'miss', a = (rt.soft ? 0.5 : 1) * (miss ? 0.35 : 1) * clamp((1.05 - tau) * 8, 0, 1) * clamp((tau + 0.25) * 6, 0, 1);
    const col = miss ? mix(l.color, '#555555', 0.6) : l.color, p = clamp(1 - tau, 0, 1.05);
    if (sp.band) { // strum: a bar slides down across all strings
      const u = lerp(G.nutU, sp.u, Math.min(1, p)), hw = sp.hw * (0.85 + 0.15 * p);
      ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = rgba(col, 0.28); rrect(ctx, -hw, u - 9, hw * 2, 18, 9); ctx.fill();
      ctx.strokeStyle = rgba(lighter(col, 0.5), 0.95); ctx.lineWidth = 3; rrect(ctx, -hw, u - 9, hw * 2, 18, 9); ctx.stroke();
      ctx.restore();
      return;
    }
    const v0 = sp.string != null && G.vAt ? G.vAt(sp.string, G.nutU - 30) : sp.v, u0 = (G.nutU ?? 0) - 30;
    const x = lerp(v0, sp.v, p), y = lerp(u0, sp.u, p);
    // faint guide along the string
    ctx.save(); ctx.globalAlpha = a * 0.55; ctx.strokeStyle = rgba(col, 0.6); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(v0, u0); ctx.lineTo(x, y); ctx.stroke(); ctx.restore();
    glow(ctx, x, y, 34 + 40 * p, col, 0.34 * a);
    gem(ctx, 'bead', x, y, 15 + 3 * p, col, a, null);
    // approach outline closing on the spot
    const s = 1 + 0.9 * clamp(tau, 0, 1);
    ctx.save(); ctx.globalAlpha = a * 0.9; ctx.strokeStyle = rgba(lighter(col, 0.45), 0.9); ctx.lineWidth = 2.5;
    rrect(ctx, sp.v - 31 * s, sp.u - 17 * s, 62 * s, 34 * s, 17 * s); ctx.stroke(); ctx.restore();
  };

  function cues(ctx, rt, G, labels, fn) {
    for (let k = rt.list.length - 1; k >= 0; k--) {
      const t = rt.list[k];
      if (t.state && t.state !== 'pending' && t.state !== 'miss') continue;
      const tau = (t.t - rt.clock) / rt.look;
      if (tau > 1.0 || tau < -0.25) continue;
      fn(ctx, t, tau, rt, G, labels);
    }
  }

  const strikeFx = (ctx, rt, i, sp, col) => {
    const f = rt.flash[i];
    if (f > 0.03) { glow(ctx, sp.v, sp.u, 70, col, 0.55 * f); ctx.strokeStyle = rgba('#ffffff', 0.7 * f); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sp.v, sp.u, 20 + 36 * (1 - f), 0, TAU); ctx.stroke(); }
  };

  const finger = (ctx, v, u, f) => { // a fingertip pressing the string
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; circ(ctx, v + 3, u + 4, 13); ctx.fill();
    ctx.fillStyle = rgrad(ctx, v, u, 0, 15, [[0, '#ffe0c0'], [0.7, SKIN], [1, '#a8683c']], v - 4, u - 5); circ(ctx, v, u, 13 + 2 * f); ctx.fill();
    ctx.strokeStyle = 'rgba(90,40,10,0.5)'; ctx.lineWidth = 1.2; ctx.stroke();
  };

  const pick = (ctx, v, u, ang, col) => {
    ctx.save(); ctx.translate(v, u); ctx.rotate(ang);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.moveTo(3, -22); ctx.quadraticCurveTo(24, -6, 3, 24); ctx.quadraticCurveTo(-18, -6, 3, -22); ctx.fill();
    ctx.fillStyle = vgrad(ctx, -22, 22, [[0, lighter(col, 0.6)], [1, darker(col, 0.15)]]);
    ctx.beginPath(); ctx.moveTo(0, -24); ctx.quadraticCurveTo(22, -8, 0, 22); ctx.quadraticCurveTo(-22, -8, 0, -24); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  };

  const bowDraw = (ctx, G, rt, e, activeV, u) => {
    // a long bow lying across the strings, drawn along v; slides with the sounding string
    const len = Math.min(Math.max(G.bw * 1.5, 260), G.W * 0.96), hold = Math.max(...e, 0);
    const sway = Math.sin(rt.anim * (5.2 + bowSpeed * 0.12)) * len * (0.16 + Math.min(0.1, bowSpeed * 0.01)) * Math.min(1, hold * 1.6 + bowSpeed * 0.05);
    const drag = 0;
    const tilt = activeV * 0.0006, x0 = -len / 2 + sway + drag, x1 = len / 2 + sway + drag, y = u + activeV * 0.04 * 0;
    ctx.save(); ctx.translate(0, y); ctx.rotate(tilt);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, x0 + 4, 8, x1 - x0, 7, 3); ctx.fill();
    // hair ribbon
    ctx.fillStyle = 'rgba(250,246,232,0.96)'; rrect(ctx, x0 + 14, -2, x1 - x0 - 24, 8, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(160,140,100,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0 + 16, 2); ctx.lineTo(x1 - 12, 2); ctx.stroke();
    // stick, frog and tip
    ctx.fillStyle = vgrad(ctx, -12, -2, [[0, '#a8452a'], [0.5, '#6a2410'], [1, '#2a0c04']]); rrect(ctx, x0, -10, x1 - x0, 7, 3.5); ctx.fill();
    ctx.fillStyle = '#12100e'; rrect(ctx, x0 - 6, -14, 34, 16, 5); ctx.fill();
    ctx.fillStyle = '#e8c868'; ctx.fillRect(x0 + 24, -13, 3, 14);
    ctx.fillStyle = '#f0ead8'; ctx.beginPath(); ctx.moveTo(x1, -10); ctx.lineTo(x1 + 12, -3); ctx.lineTo(x1, 6); ctx.fill();
    ctx.restore();
    // rosin dust while a string sounds
    if (hold > 0.08 || bowSpeed > 3) {
      for (let k = 0; k < 7; k++) {
        const ph = (rt.anim * 1.6 + k * 0.173) % 1, dx = (hash(k + 3) - 0.5) * 24 + sway * 0.4, dy = 8 + ph * 30;
        ctx.fillStyle = `rgba(255,236,190,${(1 - ph) * 0.65 * Math.min(1, hold)})`; circ(ctx, activeV + dx, u + dy, 1.4 + 1.8 * (1 - ph)); ctx.fill();
      }
    }
  };

  function drawNeckInstrument(ctx, g, rt, G, labels) {
    const n = G.n, e = stringEnergy(rt, n);
    const fiddle = prof.type === 'fiddle';
    // sympathetic strings of the rabab run beside the neck
    neckDraw(ctx, G);
    paintBody(ctx, G);
    faceDetail(ctx, G);
    // fingerboard over the soundboard again so the strings read as one object
    neckDraw(ctx, G);
    headDraw(ctx, G, rt);
    if (prof.spike) { const u = G.tailU; ctx.fillStyle = vgrad(ctx, u, u + G.spikeH, [[0, '#8a8a92'], [1, '#2a2a30']]); ctx.beginPath(); ctx.moveTo(-6, u - 4); ctx.lineTo(6, u - 4); ctx.lineTo(1.5, u + G.spikeH); ctx.lineTo(-1.5, u + G.spikeH); ctx.closePath(); ctx.fill(); }
    bridgeDraw(ctx, G);
    if (fiddle || true) { // tailpiece cord
      ctx.strokeStyle = 'rgba(30,18,8,0.7)'; ctx.lineWidth = 3;
      const tu = Math.min(G.tailU - 10, G.bridgeU + (G.tailU - G.bridgeU) * 0.78);
      ctx.beginPath(); ctx.moveTo(-G.brW / 2, G.bridgeU + 8); ctx.lineTo(-G.brW * 0.1, tu); ctx.lineTo(G.brW * 0.1, tu); ctx.lineTo(G.brW / 2, G.bridgeU + 8); ctx.stroke();
      if (n === 1) { ctx.beginPath(); ctx.moveTo(0, G.bridgeU + 8); ctx.lineTo(0, tu); ctx.stroke(); }
    }
    if (prof.sympa) { // a row of fine sympathetic strings with their own small pegs down the left of the neck
      const ns = prof.sympa, u0 = G.nutU + 18, u1 = G.fbEnd + (G.bridgeU - G.fbEnd) * 0.35;
      for (let k = 0; k < ns; k++) {
        const pu = lerp(u0, u1, k / (ns - 1)), pv = -(lerp(G.nutW, G.brW, (pu - G.nutU) / (G.bridgeU - G.nutU)) / 2 + 40);
        ctx.fillStyle = '#e8dcc0'; circ(ctx, pv - 10, pu, 4.5); ctx.fill();
        ctx.strokeStyle = 'rgba(235,235,240,0.55)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(pv - 6, pu); ctx.lineTo(-G.brW * 0.62 + k * 3, G.bridgeU + 4); ctx.stroke();
      }
    }
    // strings: courses of `per` lines, each rings with its own energy
    for (let i = 0; i < n; i++) {
      const sty = strStyle(i, n), amp = 11 * e[i] * (fiddle ? 1.15 : 1);
      for (let j = 0; j < prof.per; j++) {
        const o = prof.per > 1 ? (j - (prof.per - 1) / 2) * 5 : 0;
        const ph = rt.anim * 80 + i * 1.9 + j * 0.8;
        stringLine(ctx, G.vNut(i) + o * 0.6, G.nutU, G.vBr(i) + o, G.bridgeU, amp, ph, sty.w, e[i] > 0.04 ? lighter(sty.c[0], 0.35) : sty.c[0], sty.c[1]);
      }
      if (e[i] > 0.05) glow(ctx, G.vAt(i, (G.nutU + G.bridgeU) / 2), (G.nutU + G.bridgeU) / 2, 70, '#ffe4a8', 0.18 * e[i]);
    }
    // marks where each lane sounds: closing outlines and gems from the head to the finger position
    cues(ctx, rt, G, labels, cueNeck);
    // static receptors (a dim ring that lights when the lane sounds) and the left-hand fingers
    lanes.forEach((l, i) => {
      const sp = spots[i];
      if (!sp) return;
      const f = rt.flash[i];
      if (sp.band) { // strum bands
        ctx.save();
        ctx.fillStyle = rgba(l.color, 0.18 + 0.34 * f); rrect(ctx, sp.v - sp.hw, sp.u - sp.hh, sp.hw * 2, sp.hh * 2, 14); ctx.fill();
        ctx.strokeStyle = rgba(lighter(l.color, 0.4 + 0.4 * f), 0.7 + 0.3 * f); ctx.lineWidth = 2.6; ctx.stroke();
        ctx.strokeStyle = rgba('#ffffff', 0.35 + 0.4 * f); ctx.lineWidth = 2.5;
        for (let cx2 = sp.v - sp.hw + 34; cx2 < sp.v + sp.hw - 90; cx2 += 46) { ctx.beginPath(); ctx.moveTo(cx2, sp.u - 7); ctx.lineTo(cx2 + 10, sp.u); ctx.lineTo(cx2, sp.u + 7); ctx.stroke(); }
        ctx.restore();
        // the strumming hand: a swept arc over the strings when it fires
        if (f > 0.05) { ctx.strokeStyle = rgba('#ffffff', 0.8 * f); ctx.lineWidth = 5; ctx.beginPath(); const sw = (1 - f) * 2 - 1; ctx.moveTo(sw * sp.hw * 0.9, sp.u - sp.hh); ctx.lineTo(sw * sp.hw * 0.9 + 14, sp.u + sp.hh); ctx.stroke(); finger(ctx, sw * sp.hw * 0.9, sp.u, 0.3); }
        labels.push({ v: sp.v + sp.hw - 6 + (st.strumLanes.indexOf(i) % 2) * 34, u: sp.u, s: l.name, w: 120, col: l.color, f, o: {} });
        return;
      }
      if (sp.tap) { // body drumming on the skin
        const r = sp.r;
        ctx.fillStyle = rgba(l.color, 0.2 + 0.4 * f); circ(ctx, sp.v, sp.u, r); ctx.fill();
        ctx.strokeStyle = rgba(lighter(l.color, 0.3), 0.9); ctx.lineWidth = 3; ctx.stroke();
        if (f > 0.05) { glow(ctx, sp.v, sp.u, r * 2.2, l.color, 0.5 * f); finger(ctx, sp.v, sp.u - 8 * (1 - f), f); }
        labels.push({ v: sp.v, u: sp.u, s: l.name, w: r * 2.6, col: l.color, f, o: {} });
        return;
      }
      if (sp.open) { ctx.fillStyle = rgba(l.color, 0.2 + 0.35 * f); circ(ctx, sp.v, sp.u, 20); ctx.fill(); ctx.strokeStyle = rgba(lighter(l.color, 0.4), 0.9); ctx.lineWidth = 2.5; ctx.stroke(); }
      else { ctx.strokeStyle = rgba(lighter(l.color, 0.4), 0.55 + 0.4 * f); ctx.lineWidth = 2; rrect(ctx, sp.v - 30, sp.u - 16, 60, 32, 16); ctx.stroke(); }
      strikeFx(ctx, rt, i, sp, l.color);
      if (!sp.open && f > 0.04) finger(ctx, sp.v, sp.u, f);
      labels.push({ v: sp.v, u: sp.u, s: l.name, w: sp.open ? 96 : Math.max(60, sp.r * 2.4), col: l.color, f, o: {} });
    });
    // the playing hand: bow for fiddles, plectrum / finger near the sound hole otherwise
    const act = e.reduce((b, v, i) => (v > e[b] ? i : b), 0);
    const pu = fiddle ? G.bridgeU - Math.max(40, G.bl * 0.16) : (G.holeU + G.bridgeU) / 2 - 6;
    if (fiddle) bowDraw(ctx, G, rt, e, G.vAt(act, pu), pu);
    else if (e[act] > 0.04) {
      const f = e[act], dv = (1 - f) * 18 * Math.sin(rt.anim * 40);
      if (prof.tag === 'mizrab') pick(ctx, G.vAt(act, pu) + 12 + dv, pu, 0.9 - 0.5 * f, '#f0e6d0'); else finger(ctx, G.vAt(act, pu) + 10 + dv, pu + 6, f);
    }
  }

  function drawMono(ctx, g, rt, G, labels) {
    const { W, H, top, bot, bw } = G;
    const e = Math.max(0, ...lanes.map((_, i) => rt.flash[i] * 0.95 + (rt.hold[i] ?? 0) * 0.4));
    let bend = 0;
    lanes.forEach((_, i) => { const sp = spots[i]; if (sp?.bend) bend += sp.bend * rt.flash[i]; });
    bend = clamp(bend + bendLive, -1, 1);
    const idle = Math.sin(rt.anim * 1.7) * 2;
    const tipV = bend * 64 + idle * 0.4, tipU = top - H * 0.12;
    // sound box (a long slim board) and cast shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, -bw / 2 + 7, top + 10, bw, bot - top, 10); ctx.fill();
    const grad = hgrad(ctx, -bw / 2, bw / 2, [[0, '#4a2610'], [0.2, '#a4672f'], [0.5, '#c88a46'], [0.8, '#8a521f'], [1, '#3a1c0a']]);
    ctx.fillStyle = grad; rrect(ctx, -bw / 2, top, bw, bot - top, 10); ctx.fill();
    ctx.save(); rrect(ctx, -bw / 2, top, bw, bot - top, 10); ctx.clip(); grain(ctx, -bw / 2, top, bw, bot - top, '#2a1206', 0.4, 9, true, 16); ctx.restore();
    ctx.strokeStyle = 'rgba(255,225,170,0.55)'; ctx.lineWidth = 2; rrect(ctx, -bw / 2, top, bw, bot - top, 10); ctx.stroke();
    // harmonic marks (little pearl dots down the board at the node positions)
    for (const h of [2, 3, 4, 5, 6, 7, 8]) { const u = G.pos(h); ctx.fillStyle = 'rgba(250,240,210,0.85)'; circ(ctx, -bw * 0.32, u, 3); ctx.fill(); }
    // peg and bridge at the foot
    ctx.fillStyle = '#d9c9a0'; rrect(ctx, -bw * 0.4, bot - 24, bw * 0.8, 10, 4); ctx.fill();
    peg(ctx, 0, bot - 4, 16, '#e8d2a0');
    ctx.restore();
    // the gourd resonator hangs off the upper end of the board on a cord
    const gu = G.gourdU, gv = bw * 0.5 + 38;
    ctx.save();
    ctx.strokeStyle = '#2a1608'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(bw / 2, gu - 14); ctx.quadraticCurveTo(bw / 2 + 20, gu - 24, gv - 8, gu - 30); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, gv + 5, gu + 9, 46, 54); ctx.fill();
    ctx.fillStyle = rgrad(ctx, gv, gu, 8, 62, [[0, '#f0c070'], [0.55, '#b87a2a'], [1, '#5a3410']], gv - 14, gu - 18); ell(ctx, gv, gu, 44, 52); ctx.fill();
    ctx.strokeStyle = 'rgba(255,230,170,0.5)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#1a0d05'; ell(ctx, gv - 20, gu + 4, 6, 20); ctx.fill();
    ctx.restore();
    // the flexible rod rising from the box end, tip bending with the pitch
    const bu = top + 6;
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(6, bu + 6); ctx.bezierCurveTo(6 + tipV * 0.1, bu - H * 0.05, tipV * 0.7 + 6, tipU + 40, tipV + 6, tipU + 6); ctx.stroke();
    ctx.strokeStyle = vgrad(ctx, tipU, bu, [[0, '#e8d6a2'], [0.5, '#b88c46'], [1, '#6a4416']]); ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(0, bu); ctx.bezierCurveTo(tipV * 0.1, bu - H * 0.05, tipV * 0.7, tipU + 40, tipV, tipU); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-2, bu); ctx.bezierCurveTo(tipV * 0.1 - 2, bu - H * 0.05, tipV * 0.7 - 2, tipU + 40, tipV - 2, tipU); ctx.stroke();
    ctx.fillStyle = '#c9a050'; circ(ctx, tipV, tipU, 8); ctx.fill();
    // bamboo node rings
    ctx.restore();
    // the single steel string from the rod tip to the foot, ringing with the struck node
    const sty = STR_COL.steel;
    stringLine(ctx, tipV, tipU, 0, bot - 14, 12 * e, rt.anim * 70, 2.6, e > 0.04 ? lighter(sty[0], 0.4) : sty[0], sty[1]);
    if (e > 0.05) glow(ctx, 0, (top + bot) / 2, 120, '#ffe0a0', 0.2 * e);
    // cues: a gem runs down from the rod tip to the node
    cues(ctx, rt, G, labels, (c, t, tau, r, GG, lab) => {
      const sp = spots[t.lane], l = lanes[t.lane];
      const miss = t.state === 'miss', a = (rt.soft ? 0.5 : 1) * (miss ? 0.35 : 1) * clamp((1.05 - tau) * 8, 0, 1) * clamp((tau + 0.25) * 6, 0, 1);
      const col = miss ? mix(l.color, '#555', 0.6) : l.color, p = clamp(1 - tau, 0, 1.05);
      const x = lerp(0, sp.v, p), y = lerp(tipU + 20, sp.u, p);
      c.save(); c.globalAlpha = a * 0.5; c.strokeStyle = rgba(col, 0.8); c.lineWidth = 4; c.beginPath(); c.moveTo(0, tipU + 20); c.lineTo(x, y); c.stroke(); c.restore();
      glow(c, x, y, 34 + 30 * p, col, 0.34 * a); gem(c, 'bead', x, y, 15 + 3 * p, col, a, null);
      const s = 1 + 0.9 * clamp(tau, 0, 1);
      c.save(); c.globalAlpha = a * 0.9; c.strokeStyle = rgba(lighter(col, 0.45), 0.9); c.lineWidth = 2.5; rrect(c, sp.v - 31 * s, sp.u - 17 * s, 62 * s, 34 * s, 17 * s); c.stroke(); c.restore();
      void lab; void r; void GG;
    });
    lanes.forEach((l, i) => {
      const sp = spots[i], f = rt.flash[i];
      ctx.strokeStyle = rgba(lighter(l.color, 0.4), 0.55 + 0.4 * f); ctx.lineWidth = 2; rrect(ctx, sp.v - 30, sp.u - 16, 60, 32, 16); ctx.stroke();
      if (sp.bend) { // a little arrow shows which way the rod is bent
        ctx.strokeStyle = rgba(l.color, 0.9); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sp.v - sp.bend * 6, sp.u + 24); ctx.lineTo(sp.v + sp.bend * 20, sp.u + 24); ctx.lineTo(sp.v + sp.bend * 12, sp.u + 17); ctx.moveTo(sp.v + sp.bend * 20, sp.u + 24); ctx.lineTo(sp.v + sp.bend * 12, sp.u + 31); ctx.stroke();
      }
      strikeFx(ctx, rt, i, sp, l.color);
      if (f > 0.04) { finger(ctx, 0, sp.u, f); }
      labels.push({ v: sp.v, u: sp.u, s: l.name, w: 110, col: l.color, f, o: {} });
    });
    // the picking hand at the foot
    if (e > 0.04) pick(ctx, 20 + (1 - e) * 10, bot - 70, 0.7, '#f4ead0');
  }

  function drawQanun(ctx, g, rt, G, labels) {
    const { x0, x1, topU, bridgeL, bridgeR } = G.board, cnt = N;
    const bu = (v) => lerp(bridgeL, bridgeR, (v - x0) / (x1 - x0));
    // the board: a long trapezoid with a slanted bridge edge
    const outline = () => { ctx.beginPath(); ctx.moveTo(x0 - 14, topU); ctx.lineTo(x1 + 14, topU); ctx.lineTo(x1 + 14, bridgeR + 30); ctx.lineTo(x0 - 14, bridgeL + 40); ctx.closePath(); };
    ctx.save(); ctx.translate(7, 10); outline(); ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fill(); ctx.restore();
    outline(); ctx.fillStyle = hgrad(ctx, x0, x1, [[0, '#4a2a12'], [0.2, '#9a6030'], [0.55, '#b87a3c'], [0.85, '#8a5226'], [1, '#3a1d0a']]); ctx.fill();
    ctx.save(); outline(); ctx.clip();
    grain(ctx, x0, topU, x1 - x0, H(), '#2a1206', 0.4, 4, true, 22);
    // inlaid border
    ctx.strokeStyle = 'rgba(245,225,170,0.8)'; ctx.lineWidth = 3; outline(); ctx.stroke();
    ctx.strokeStyle = 'rgba(30,14,4,0.9)'; ctx.lineWidth = 8; ctx.setLineDash([14, 10]); ctx.translate(0, 0); outline(); ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1; ctx.setLineDash([]);
    // three rosette sound holes
    for (const [rv, ru, rr] of [[0.28, 0.54, 0.075], [0.5, 0.62, 0.06], [0.72, 0.5, 0.05]]) {
      const cx = lerp(x0, x1, rv), cu = lerp(topU + 40, bridgeL - 40, ru) * 0.86;
      circ(ctx, cx, cu, (x1 - x0) * rr * 1.5); ctx.fillStyle = '#e8d3a0'; ctx.fill();
      circ(ctx, cx, cu, (x1 - x0) * rr * 1.18); ctx.fillStyle = '#2a1608'; ctx.fill();
      circ(ctx, cx, cu, (x1 - x0) * rr); ctx.fillStyle = '#0c0603'; ctx.fill();
      ctx.strokeStyle = 'rgba(232,211,160,0.9)'; ctx.lineWidth = 2; for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (x1 - x0) * rr * 1.6, cu + Math.sin(a) * (x1 - x0) * rr * 1.6); ctx.lineTo(cx + Math.cos(a) * (x1 - x0) * rr * 2.0, cu + Math.sin(a) * (x1 - x0) * rr * 2.0); ctx.stroke(); }
    }
    // parchment patch under the bridge
    ctx.beginPath(); ctx.moveTo(x1 + 14, bridgeR - 30); ctx.lineTo(x0 + (x1 - x0) * 0.2, bridgeL - 120 + 12); ctx.lineTo(x0 - 14, bridgeL - 90); ctx.lineTo(x0 - 14, bridgeL + 40); ctx.lineTo(x1 + 14, bridgeR + 30); ctx.closePath();
    ctx.fillStyle = hgrad(ctx, x0, x1, [[0, '#cdb88c'], [0.5, '#f4e8c8'], [1, '#c9b085']]); ctx.fill();
    ctx.restore();
    // lever block along the top edge
    ctx.fillStyle = vgrad(ctx, topU, topU + 26, [[0, '#2a1608'], [1, '#6a4020']]); rrect(ctx, x0 - 14, topU, x1 - x0 + 28, 30, 6); ctx.fill();
    for (let k = 0; k < cnt; k++) { const v = lerp(x0 + 30, x1 - 30, (k + 0.5) / cnt); ctx.fillStyle = '#d7b866'; circ(ctx, v, topU + 12, 4.5); ctx.fill(); ctx.fillStyle = '#f2ead4'; rrect(ctx, v - 5, topU + 20, 10, 5, 2); ctx.fill(); }
    // bridge: a wooden bar following the slanted edge
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, bridgeL + 4); ctx.lineTo(x1, bridgeR + 4); ctx.stroke();
    ctx.strokeStyle = '#e8d3a0'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x0, bridgeL); ctx.lineTo(x1, bridgeR); ctx.stroke();
    // strings: a triple course each
    const e = new Array(cnt).fill(0);
    lanes.forEach((_, i) => { e[i] = rt.flash[i] * 0.95 + (rt.hold[i] ?? 0) * 0.4; });
    // glissando: the whole board shimmers when the pointer sweeps it
    for (let k = 0; k < cnt; k++) {
      const v = lerp(x0 + 30, x1 - 30, (k + 0.5) / cnt), s = G.stringU(k);
      for (let j = -1; j <= 1; j++) stringLine(ctx, v + j * 4, s.top, v + j * 4, s.bot, 8 * e[k], rt.anim * 75 + k * 1.3 + j, 1.4 + (1 - k / cnt) * 0.9, e[k] > 0.04 ? '#ffffff' : (k < cnt * 0.4 ? STR_COL.bronze[0] : STR_COL.steel[0]), STR_COL.steel[1], 0.2);
    }
    cues(ctx, rt, G, labels, (c, t, tau) => {
      const sp = spots[t.lane], l = lanes[t.lane], s = G.stringU(t.lane);
      const miss = t.state === 'miss', a = (rt.soft ? 0.5 : 1) * (miss ? 0.35 : 1) * clamp((1.05 - tau) * 8, 0, 1) * clamp((tau + 0.25) * 6, 0, 1);
      const col = miss ? mix(l.color, '#555', 0.6) : l.color, p = clamp(1 - tau, 0, 1.05);
      const y = lerp(s.top, sp.u, p);
      glow(c, sp.v, y, 34 + 30 * p, col, 0.34 * a); gem(c, 'bead', sp.v, y, 14 + 3 * p, col, a, null);
      const sc = 1 + 0.9 * clamp(tau, 0, 1);
      c.save(); c.globalAlpha = a * 0.9; c.strokeStyle = rgba(lighter(col, 0.45), 0.9); c.lineWidth = 2.5; rrect(c, sp.v - 22 * sc, sp.u - 15 * sc, 44 * sc, 30 * sc, 15 * sc); c.stroke(); c.restore();
    });
    lanes.forEach((l, i) => {
      const sp = spots[i], f = rt.flash[i];
      ctx.strokeStyle = rgba(lighter(l.color, 0.4), 0.55 + 0.4 * f); ctx.lineWidth = 2; rrect(ctx, sp.v - 22, sp.u - 15, 44, 30, 15); ctx.stroke();
      strikeFx(ctx, rt, i, sp, l.color);
      // plectrum ring on the finger that plucks
      if (f > 0.04) { finger(ctx, sp.v + 4, sp.u + 20 * (1 - f), f); }
      labels.push({ v: sp.v, u: sp.u, s: l.name, w: 50, col: l.color, f, o: {} });
    });
    function H() { return G.H; }
  }

  function drawHarp(ctx, g, rt, G, labels) {
    const { left, right, neckTop, boxTop, boxBot } = G.frame, NS = G.NS;
    // soundbox (a tapering wooden chest) with the slanted soundboard on top
    const pillarX = right + 40;
    ctx.save();
    // cast shadow
    ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.beginPath(); ctx.moveTo(left - 20 + 8, boxTop + 40); ctx.lineTo(pillarX + 8, boxTop - 40); ctx.lineTo(pillarX + 8, boxBot + 10); ctx.lineTo(left + 20 + 8, boxBot + 10); ctx.fill();
    // the box
    const wood = '#8a4a1e';
    ctx.beginPath(); ctx.moveTo(left - 20, boxTop + 40); ctx.lineTo(pillarX, boxTop - 40); ctx.lineTo(pillarX, boxBot); ctx.lineTo(left + 20, boxBot); ctx.closePath();
    ctx.fillStyle = hgrad(ctx, left, pillarX, [[0, darker(wood, 0.5)], [0.3, lighter(wood, 0.25)], [0.65, wood], [1, darker(wood, 0.5)]]); ctx.fill();
    ctx.save(); ctx.clip(); grain(ctx, left, boxTop - 40, pillarX - left, boxBot - boxTop + 40, '#2a1206', 0.4, 6, true, 18);
    // pale soundboard strip along the top edge with the string holes
    ctx.fillStyle = 'rgba(245,225,170,0.4)'; ctx.beginPath(); ctx.moveTo(left - 20, boxTop + 40); ctx.lineTo(pillarX, boxTop - 40); ctx.lineTo(pillarX, boxTop - 12); ctx.lineTo(left - 20, boxTop + 70); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,225,170,0.55)'; ctx.lineWidth = 2.5; ctx.stroke();
    // curved neck from the pillar's top toward the left
    const nk = (w) => { ctx.beginPath(); ctx.moveTo(pillarX, boxTop - 40); ctx.lineTo(pillarX, neckTop + 40); ctx.bezierCurveTo(pillarX, neckTop - 10, right * 0.2, neckTop - 24, left - 6, neckTop + 56); ctx.lineWidth = w; };
    nk(26); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.save(); ctx.translate(7, 8); ctx.stroke(); ctx.restore();
    nk(24); ctx.strokeStyle = hgrad(ctx, left, pillarX, [[0, '#4a2610'], [0.5, '#b97b3a'], [1, '#6a3a16']]); ctx.stroke();
    nk(4); ctx.strokeStyle = 'rgba(255,230,170,0.5)'; ctx.stroke();
    ctx.restore();
    // all strings of the harp (those that are lanes shine)
    const used = G.used;
    const e = new Array(NS).fill(0);
    lanes.forEach((_, i) => { const sp = spots[i]; if (sp && sp.string != null) e[sp.string] = Math.max(e[sp.string], rt.flash[i] * 0.95 + (rt.hold[i] ?? 0) * 0.4); });
    for (let s = 0; s < NS; s++) {
      const su = G.strU(s), played = used.has(s), bass = s < NS * 0.3;
      const col = bass ? STR_COL.bronze : STR_COL.gut;
      stringLine(ctx, su.x, su.top, su.x, su.bot, 7 * e[s], rt.anim * 75 + s * 1.7, played ? (bass ? 3.2 : 2.4) : 1.4, e[s] > 0.04 ? '#ffffff' : (played ? col[0] : mix(col[0], '#3a2410', 0.5)), played ? col[1] : null);
      ctx.fillStyle = '#d6b45c'; circ(ctx, su.x, su.top - 2, 3.6); ctx.fill();
    }
    cues(ctx, rt, G, labels, (c, t, tau) => {
      const sp = spots[t.lane], l = lanes[t.lane];
      if (sp.string == null) { // props: a ring closes on the zone
        const miss = t.state === 'miss', a = (miss ? 0.35 : 1) * clamp((1.05 - tau) * 8, 0, 1);
        const sc = 1 + 1.2 * clamp(tau, 0, 1);
        c.save(); c.globalAlpha = a; c.strokeStyle = rgba(lighter(l.color, 0.45), 0.95); c.lineWidth = 3; c.beginPath(); c.arc(sp.v, sp.u, (sp.r ?? 40) * sc, 0, TAU); c.stroke(); c.restore();
        return;
      }
      const su = G.strU(sp.string);
      const miss = t.state === 'miss', a = (rt.soft ? 0.5 : 1) * (miss ? 0.35 : 1) * clamp((1.05 - tau) * 8, 0, 1) * clamp((tau + 0.25) * 6, 0, 1);
      const col = miss ? mix(l.color, '#555', 0.6) : l.color, p = clamp(1 - tau, 0, 1.05);
      const y = lerp(su.top, sp.u, p);
      glow(c, sp.v, y, 34 + 26 * p, col, 0.34 * a); gem(c, 'bead', sp.v, y, 13 + 3 * p, col, a, null);
      const sc2 = 1 + 0.9 * clamp(tau, 0, 1);
      c.save(); c.globalAlpha = a * 0.9; c.strokeStyle = rgba(lighter(col, 0.45), 0.9); c.lineWidth = 2.5; rrect(c, sp.v - 24 * sc2, sp.u - 15 * sc2, 48 * sc2, 30 * sc2, 15 * sc2); c.stroke(); c.restore();
    });
    // props: the little four-string cuatro and a pair of maracas
    ctx.save();
    lanes.forEach((l, i) => {
      const sp = spots[i], f = rt.flash[i];
      if (cls[i] === 'strum') {
        const cx = sp.v, cu = sp.u, hw = sp.hw, hh = sp.hh;
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, cx + 6, cu + 8, hw * 0.5, hh * 1.0); ctx.fill();
        ctx.fillStyle = hgrad(ctx, cx - hw, cx + hw, [[0, '#6a3410'], [0.4, '#c88a46'], [1, '#5a2c0c']]); rrect(ctx, cx - hw * 0.55, cu - hh * 0.9, hw * 1.1, hh * 1.8, hh * 0.7); ctx.fill();
        ctx.fillStyle = '#100804'; circ(ctx, cx, cu, hh * 0.38); ctx.fill();
        ctx.strokeStyle = rgba(lighter(l.color, 0.4), 0.55 + 0.45 * f); ctx.lineWidth = 3; ctx.setLineDash([9, 6]); rrect(ctx, cx - hw, cu - hh, hw * 2, hh * 2, 14); ctx.stroke(); ctx.setLineDash([]);
        for (let k = 0; k < 4; k++) { const v = cx - hw * 0.28 + k * hw * 0.186; stringLine(ctx, v, cu - hh * 0.9, v, cu + hh * 0.9, 4 * f, rt.anim * 80 + k, 1.4, '#e8e4d8', '#fff'); }
        labels.push({ v: cx, u: cu + hh + 16, s: l.name, w: 100, col: l.color, f, o: {} });
      } else if (cls[i] === 'shaker') {
        const cx = sp.v, cu = sp.u, r = sp.r, sh = Math.sin(rt.anim * 40) * 5 * f;
        for (const d of [-1, 1]) {
          ctx.save(); ctx.translate(cx + d * r * 0.45 + sh * d, cu); ctx.rotate(d * 0.3 + sh * 0.03);
          ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 4, r * 0.35 + 5, r * 0.3, r * 0.42); ctx.fill();
          ctx.fillStyle = '#6a3a1a'; rrect(ctx, -3, r * 0.1, 6, r * 0.6, 3); ctx.fill();
          ctx.fillStyle = rgrad(ctx, 0, -r * 0.25, 2, r * 0.45, [[0, lighter(l.color, 0.5)], [0.6, l.color], [1, darker(l.color, 0.5)]], -r * 0.1, -r * 0.35); ell(ctx, 0, -r * 0.22, r * 0.3, r * 0.4); ctx.fill();
          ctx.restore();
        }
        ctx.strokeStyle = rgba(lighter(l.color, 0.4), 0.55 + 0.45 * f); ctx.lineWidth = 3; circ(ctx, cx, cu, r); ctx.stroke();
        labels.push({ v: cx, u: cu + r + 16, s: l.name, w: 100, col: l.color, f, o: {} });
      } else {
        ctx.strokeStyle = rgba(lighter(l.color, 0.4), 0.55 + 0.4 * f); ctx.lineWidth = 2; rrect(ctx, sp.v - 24, sp.u - 15, 48, 30, 15); ctx.stroke();
        strikeFx(ctx, rt, i, sp, l.color);
        if (f > 0.04) finger(ctx, sp.v + 6, sp.u + 16 * (1 - f), f);
        labels.push({ v: sp.v, u: sp.u, s: l.name, w: 70, col: l.color, f, o: {} });
      }
    });
    ctx.restore();
  }

  function drawKora(ctx, g, rt, G, labels) {
    const { W, H, boxU, boxH } = G;
    const bw = Math.min(W * 0.78, boxH * 1.5);
    // long neck (a polished pole through the gourd) and the two hand posts
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, -9 + 6, H * 0.02 + 8, 18, boxU - H * 0.02 + boxH * 0.4, 8); ctx.fill();
    ctx.fillStyle = hgrad(ctx, -9, 9, [[0, '#3a1c0a'], [0.5, '#c88a46'], [1, '#4a2610']]); rrect(ctx, -9, H * 0.02, 18, boxU - H * 0.02 + boxH * 0.4, 8); ctx.fill();
    // calabash with a taut skin
    ctx.fillStyle = 'rgba(0,0,0,0.38)'; ell(ctx, 9, boxU + boxH * 0.5 + 10, bw / 2, boxH * 0.5); ctx.fill();
    ctx.fillStyle = rgrad(ctx, 0, boxU + boxH * 0.5, boxH * 0.2, bw * 0.6, [[0, '#f6ecd0'], [0.65, '#e4d1a2'], [1, '#a98b58']], -bw * 0.1, boxU + boxH * 0.3);
    ell(ctx, 0, boxU + boxH * 0.5, bw / 2, boxH * 0.5); ctx.fill();
    ctx.strokeStyle = '#5a3a18'; ctx.lineWidth = 6; ctx.stroke();
    ctx.fillStyle = '#6a4a22';
    for (let k = 0; k < 34; k++) { const a = (k / 34) * TAU; circ(ctx, Math.cos(a) * bw * 0.46, boxU + boxH * 0.5 + Math.sin(a) * boxH * 0.46, 2.6); ctx.fill(); }
    // two small sound holes
    ctx.fillStyle = '#1a0d05'; circ(ctx, -bw * 0.28, boxU + boxH * 0.55, 8); ctx.fill(); circ(ctx, bw * 0.28, boxU + boxH * 0.55, 8); ctx.fill();
    ctx.restore();
    // the tall notched bridge standing on the skin
    const bu = G.bridgeU + boxH * 0.1;
    ctx.fillStyle = vgrad(ctx, bu - 4, bu + 20, [[0, '#e0c48a'], [1, '#6a4416']]); rrect(ctx, -bw * 0.26, bu, bw * 0.52, 18, 6); ctx.fill();
    // strings in two fans
    const e = lanes.map((_, i) => rt.flash[i] * 0.95 + (rt.hold[i] ?? 0) * 0.4);
    G.sets.forEach((set, si) => set.forEach((i, k) => {
      const sp = spots[i], t = set.length > 1 ? k / (set.length - 1) : 0.5;
      const sty = si === 0 ? STR_COL.gut : STR_COL.steel;
      stringLine(ctx, sp.topV, sp.topU, sp.botV, sp.botU, 7 * e[i], rt.anim * 70 + i * 1.7, 2.2, e[i] > 0.04 ? '#fff' : sty[0], sty[1]);
      // tuning rings on the neck
      ctx.strokeStyle = '#8a4a1e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-9, sp.topU); ctx.lineTo(9, sp.topU); ctx.stroke();
      void t;
    }));
    // hand posts and thumbs
    ctx.fillStyle = '#c88a46'; rrect(ctx, -bw * 0.5, boxU + boxH * 0.2, 10, boxH * 0.7, 5); ctx.fill(); rrect(ctx, bw * 0.5 - 10, boxU + boxH * 0.2, 10, boxH * 0.7, 5); ctx.fill();
    cues(ctx, rt, G, labels, (c, t, tau) => {
      const sp = spots[t.lane], l = lanes[t.lane];
      const miss = t.state === 'miss', a = (rt.soft ? 0.5 : 1) * (miss ? 0.35 : 1) * clamp((1.05 - tau) * 8, 0, 1) * clamp((tau + 0.25) * 6, 0, 1);
      const col = miss ? mix(l.color, '#555', 0.6) : l.color, p = clamp(1 - tau, 0, 1.05);
      const x = lerp(sp.topV, sp.v, p), y = lerp(sp.topU, sp.u, p);
      glow(c, x, y, 34 + 26 * p, col, 0.34 * a); gem(c, 'bead', x, y, 13 + 3 * p, col, a, null);
      const sc = 1 + 0.9 * clamp(tau, 0, 1);
      c.save(); c.globalAlpha = a * 0.9; c.strokeStyle = rgba(lighter(col, 0.45), 0.9); c.lineWidth = 2.5; rrect(c, sp.v - 24 * sc, sp.u - 15 * sc, 48 * sc, 30 * sc, 15 * sc); c.stroke(); c.restore();
    });
    lanes.forEach((l, i) => {
      const sp = spots[i], f = rt.flash[i];
      ctx.strokeStyle = rgba(lighter(l.color, 0.4), 0.55 + 0.4 * f); ctx.lineWidth = 2; rrect(ctx, sp.v - 24, sp.u - 15, 48, 30, 15); ctx.stroke();
      strikeFx(ctx, rt, i, sp, l.color);
      if (f > 0.04) finger(ctx, sp.v + (sp.set === 0 ? -14 : 14), sp.u, f);
      labels.push({ v: sp.v, u: sp.u, s: l.name, w: 50, col: l.color, f, o: {} });
    });
  }

  return st;
}

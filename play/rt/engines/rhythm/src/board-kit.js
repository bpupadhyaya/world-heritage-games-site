// Board kit (1.10.0): the shared stage skeleton for string instruments whose strings ARE the lanes (zithers, harps, tube zithers, bows).
// A stage file supplies a small definition (geometry, a painter for the body, optional hardware over the strings and specials);
// the kit supplies everything the player touches: the strings with ringing energy, cue beads travelling the real string to the
// plucking place, closing rings, strike light, fingertip, labels, glissando swipes and hit testing.
//
//   def = {
//     frame: { top, bottom, side, tilt, dx, zoom, lying },              // makeFrame options
//     bowed: false, sustained: false,
//     voiceOf(i, lane, cls) -> voice kind | null,                      // which synth recipe a lane triggers (see voice-strings.js)
//     layout(F, K) -> { G, strings: [ {v0,u0,v1,u1, sv,su, r, w, col, hi} per lane | null ], extra: [ {v0,u0,v1,u1,w,col,hi,dim} ],
//                       spots: { [laneIndex]: spot } (specials), top (u where cues start for band lanes) },
//     back(ctx, G, rt, h)   body and hardware under the strings
//     front(ctx, G, rt, h)  hardware over the strings (bridges, hands, props)
//     special(ctx, G, rt, i, sp, f, h) -> true when the lane is drawn by the stage (a prop, a body knock)
//   }
//   K = { lanes, N, cls, noteIdx, strumIdx, tapIdx, shakeIdx }
import { clamp, mix, rgba, lighter, darker, glow, rrect, grain, hgrad, vgrad, rgrad, circ, ell, gem, TAU } from './art.js';
import { makeFrame, makeBox, circleSpot, rectSpot, finishSpots, hitSpots, pill, stringLine, lerp } from './stagekit.js';

export const STR_COL = { steel: ['#dfe4ee', '#ffffff'], bronze: ['#d2ad6c', '#fff0c0'], gut: ['#f1ead2', '#ffffff'], silk: ['#f4ead6', '#ffffff'], brass: ['#e0b860', '#fff2c0'], red: ['#c8493a', '#ffb09a'], hair: ['#efe8d6', '#ffffff'] };
const SKIN = '#e9b98f';
const SPECIAL = [[/gliss|strum|rake|sweep|chord|run\b/i, 'strum'], [/shake|caxixi|rattle|maraca/i, 'shaker'], [/knock|body|thump|tap\b/i, 'tap']];

export function createBoardStage(id, S, lanes, P, def) {
  const N = lanes.length;
  const spots = new Array(N).fill(null);
  const cls = lanes.map((l) => SPECIAL.find(([re]) => re.test(l.name))?.[1] ?? 'note');
  const idxOf = (c) => lanes.map((_, i) => i).filter((i) => cls[i] === c);
  const K = { lanes, N, cls, noteIdx: idxOf('note'), strumIdx: idxOf('strum'), tapIdx: idxOf('tap'), shakeIdx: idxOf('shaker'), prof: def };
  const st = { id, kind: 'strings', spots, voice: def.bowed ? 'bow' : 'pluck', bowed: !!def.bowed, sustained: !!def.sustained, strumLanes: [], F: null, G: null };
  cls.forEach((c, i) => { if (c === 'strum') st.strumLanes.push(i); });
  if (def.voiceOf) st.voiceOf = (i) => def.voiceOf(i, lanes[i], cls[i]);
  let L = null;            // the current layout result
  const kick = new Array(40).fill(0);

  st.layout = (area) => {
    const F = def.box ? makeBox(area, def.box.w, def.box.h, { top: 40, bottom: 10, side: 12, ...(def.frame ?? {}) }) : makeFrame(area, { top: 40, bottom: 10, side: 12, ...(def.frame ?? {}) });
    st.F = F;
    L = def.layout(F, K);
    st.G = L.G;
    for (let i = 0; i < N; i++) {
      const s = L.strings?.[i];
      spots[i] = L.spots?.[i] ?? (s ? circleSpot(s.sv, s.su, s.r ?? 26, { string: i }) : null);
    }
    // strum lanes without a drawn band sweep the strings at the plucking place
    for (const i of K.strumIdx) if (!spots[i]) {
      const ss = (L.strings ?? []).filter(Boolean);
      const vs = ss.map((s) => s.sv), us = ss.map((s) => s.su), vmin = Math.min(...vs), vmax = Math.max(...vs);
      const k = K.strumIdx.indexOf(i), cnt = K.strumIdx.length, u = Math.min(...us) + (Math.max(...us) - Math.min(...us)) * 0.5;
      spots[i] = rectSpot((vmin + vmax) / 2, u + (k - (cnt - 1) / 2) * 52, (vmax - vmin) / 2 + 32, 22, { band: true });
    }
    for (let i = 0; i < N; i++) if (!spots[i]) spots[i] = circleSpot(0, L.G.H * 0.5 + i * 12, 28, {});
    finishSpots(F, spots);
  };

  st.hit = (x, y) => (st.F ? hitSpots(st.F, spots, x, y) : -1);
  st.anchor = (i) => ({ x: spots[i]?.x ?? 0, y: spots[i]?.y ?? 0 });
  st.strumPitches = (i) => {
    const hz = lanes[i].hz;
    const all = K.noteIdx.map((j) => lanes[j].hz).sort((a, b) => a - b);
    if (def.strumUp === false) return all;
    return all.length > 1 ? (/down|desc|fall/i.test(lanes[i].name) ? all.slice().reverse() : all) : [hz, hz * 1.5, hz * 2];
  };

  // ---- swipes: a sweep across strings sounds each one softly (never scored) -------------------------------------------------
  let lastP = null, lastAt = 0, lastAnim = 0;
  const lines = () => (L?.strings ?? []).map((s, i) => (s && cls[i] === 'note' && !s.hide ? { idx: i, s, hz: lanes[i].hz } : null)).filter(Boolean);
  st.pointer = (p) => {
    const out = [];
    if (!st.F || !p) return out;
    const [lv, lu] = st.F.inv(p.x, p.y);
    if (p.pressed) lastP = { lv, lu };
    if (!p.down) { lastP = null; return out; }
    if (lastP) {
      for (const ln of lines()) {
        const { v0, u0, v1, u1 } = ln.s;
        const at = (u) => lerp(v0, v1, clamp((u - u0) / ((u1 - u0) || 1), 0, 1));
        const lo = Math.min(u0, u1), hi = Math.max(u0, u1);
        if (lu < lo || lu > hi) continue;
        const a = lastP.lv - at(lastP.lu), b = lv - at(lu);
        if ((a <= 0 && b > 0) || (a >= 0 && b < 0)) { kick[ln.idx] = 1; if (p.clock - lastAt > 0.012) out.push({ freq: ln.hz, to: ln.hz * 0.997, dur: 0.5, type: def.bowed ? 'sine' : 'triangle', vol: 0.07 }); }
      }
    }
    lastAt = p.clock; lastP = { lv, lu };
    return out;
  };

  // ---- helpers handed to the painters ------------------------------------------------------------------------------------
  const finger = (ctx, v, u, f) => {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; circ(ctx, v + 3, u + 4, 13); ctx.fill();
    ctx.fillStyle = rgrad(ctx, v, u, 0, 15, [[0, '#ffe0c0'], [0.7, SKIN], [1, '#a8683c']], v - 4, u - 5); circ(ctx, v, u, 13 + 2 * f); ctx.fill();
    ctx.strokeStyle = 'rgba(90,40,10,0.5)'; ctx.lineWidth = 1.2; ctx.stroke();
  };
  const pick = (ctx, v, u, ang, col = '#f0e6d0') => {
    ctx.save(); ctx.translate(v, u); ctx.rotate(ang);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.moveTo(3, -22); ctx.quadraticCurveTo(24, -6, 3, 24); ctx.quadraticCurveTo(-18, -6, 3, -22); ctx.fill();
    ctx.fillStyle = vgrad(ctx, -22, 22, [[0, lighter(col, 0.6)], [1, darker(col, 0.15)]]);
    ctx.beginPath(); ctx.moveTo(0, -24); ctx.quadraticCurveTo(22, -8, 0, 22); ctx.quadraticCurveTo(-22, -8, 0, -24); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  };
  const strikeFx = (ctx, rt, i, sp, col) => {
    const f = rt.flash[i];
    if (f > 0.03) { glow(ctx, sp.v, sp.u, 70, col, 0.55 * f); ctx.strokeStyle = rgba('#ffffff', 0.7 * f); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sp.v, sp.u, 20 + 36 * (1 - f), 0, TAU); ctx.stroke(); }
  };
  const energy = (rt) => {
    const e = new Array(N).fill(0);
    lanes.forEach((_, i) => {
      const f = rt.flash[i] * 0.95 + (rt.hold[i] ?? 0) * 0.45;
      if (f <= 0.01) return;
      if (cls[i] === 'strum') { K.noteIdx.forEach((j, r) => { e[j] = Math.max(e[j], clamp(f * 1.5 - r * 0.09, 0, 1)); }); }
      else e[i] = Math.max(e[i], f);
    });
    for (let i = 0; i < N; i++) e[i] = Math.max(e[i], kick[i] * 0.8);
    return e;
  };
  const strStyle = (i, s) => {
    const nn = Math.max(1, K.noteIdx.length - 1), r = Math.max(0, K.noteIdx.indexOf(i)), f = r / nn;
    const mat = def.material ?? 'steel';
    if (mat === 'silk') return { w: 3.4 - 1.2 * f, c: STR_COL.silk };
    if (mat === 'gut') return { w: 3.0 - 1.2 * f, c: f < 0.4 ? STR_COL.bronze : STR_COL.gut };
    if (mat === 'brass') return { w: 2.8 - 1.2 * f, c: STR_COL.brass };
    return { w: 2.8 - 1.4 * f, c: f < 0.35 ? STR_COL.bronze : STR_COL.steel };
  };
  const H = { finger, pick, strikeFx, strStyle, STR_COL, cls, K, kick, lerp, spots, e: null };

  const cueGem = (ctx, t, tau, rt, labels) => {
    const sp = spots[t.lane], l = lanes[t.lane], s = L.strings?.[t.lane];
    if (!sp) return;
    const miss = t.state === 'miss', a = (rt.soft ? 0.5 : 1) * (miss ? 0.35 : 1) * clamp((1.05 - tau) * 8, 0, 1) * clamp((tau + 0.25) * 6, 0, 1);
    const col = miss ? mix(l.color, '#555555', 0.6) : l.color, p = clamp(1 - tau, 0, 1.05), sc = 1 + 0.9 * clamp(tau, 0, 1);
    if (sp.band) { // a sweep bar slides across the strings
      const u = lerp(L.top ?? (sp.u - 140), sp.u, Math.min(1, p)), hw = sp.hw * (0.85 + 0.15 * p);
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = rgba(col, 0.28); rrect(ctx, sp.v - hw, u - 9, hw * 2, 18, 9); ctx.fill();
      ctx.strokeStyle = rgba(lighter(col, 0.5), 0.95); ctx.lineWidth = 3; rrect(ctx, sp.v - hw, u - 9, hw * 2, 18, 9); ctx.stroke(); ctx.restore();
      return;
    }
    if (!s) { // a prop or body zone: a ring closes on it
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = rgba(lighter(col, 0.45), 0.95); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sp.v, sp.u, (sp.r ?? 36) * (1 + 1.1 * clamp(tau, 0, 1)), 0, TAU); ctx.stroke(); ctx.restore();
      return;
    }
    const x = lerp(s.v0, sp.v, p), y = lerp(s.u0, sp.u, p);
    ctx.save(); ctx.globalAlpha = a * 0.5; ctx.strokeStyle = rgba(col, 0.7); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(s.v0, s.u0); ctx.lineTo(x, y); ctx.stroke(); ctx.restore();
    glow(ctx, x, y, 34 + 34 * p, col, 0.34 * a); gem(ctx, 'bead', x, y, 14 + 3 * p, col, a, null);
    ctx.save(); ctx.globalAlpha = a * 0.9; ctx.strokeStyle = rgba(lighter(col, 0.45), 0.9); ctx.lineWidth = 2.5; rrect(ctx, sp.v - 24 * sc, sp.u - 15 * sc, 48 * sc, 30 * sc, 15 * sc); ctx.stroke(); ctx.restore();
  };

  st.draw = (g, rt) => {
    const { ctx } = g, F = st.F, G = st.G;
    if (!F || !L) return;
    const dt = clamp(rt.anim - lastAnim, 0, 0.1); lastAnim = rt.anim;
    for (let i = 0; i < kick.length; i++) kick[i] = Math.max(0, kick[i] - dt * 3);
    const labels = [], e = energy(rt);
    H.e = e; H.labels = labels;
    ctx.save(); F.apply(ctx);
    def.back?.(ctx, G, rt, H);
    for (const x of L.extra ?? []) {
      stringLine(ctx, x.v0, x.u0, x.v1, x.u1, 0, 0, x.w ?? 1.6, x.dim ? mix(x.col ?? '#cfcfd6', '#3a2410', 0.5) : (x.col ?? '#cfcfd6'), x.hi ?? null);
    }
    (L.strings ?? []).forEach((s, i) => {
      if (!s || cls[i] !== 'note' || s.hide) return;
      const sty = s.col ? { w: s.w ?? 2.4, c: [s.col, s.hi ?? '#ffffff'] } : strStyle(i, s);
      const en = e[i];
      stringLine(ctx, s.v0, s.u0, s.v1, s.u1, (s.amp ?? 8) * en, rt.anim * 75 + i * 1.7, s.w ?? sty.w, en > 0.04 ? '#ffffff' : sty.c[0], sty.c[1], 0.2);
      if (en > 0.05) glow(ctx, s.sv, s.su, 60, '#ffe4a8', 0.16 * en);
    });
    def.front?.(ctx, G, rt, H);
    for (let k = rt.list.length - 1; k >= 0; k--) {
      const t = rt.list[k];
      if (t.state && t.state !== 'pending' && t.state !== 'miss') continue;
      const tau = (t.t - rt.clock) / rt.look;
      if (tau > 1.0 || tau < -0.25) continue;
      cueGem(ctx, t, tau, rt, labels);
    }
    lanes.forEach((l, i) => {
      const sp = spots[i], f = rt.flash[i];
      if (!sp) return;
      if (def.special?.(ctx, G, rt, i, sp, f, H)) return;
      if (sp.band) {
        ctx.save(); ctx.fillStyle = rgba(l.color, 0.16 + 0.34 * f); rrect(ctx, sp.v - sp.hw, sp.u - sp.hh, sp.hw * 2, sp.hh * 2, 14); ctx.fill();
        ctx.strokeStyle = rgba(lighter(l.color, 0.4 + 0.4 * f), 0.7 + 0.3 * f); ctx.lineWidth = 2.6; ctx.stroke();
        ctx.strokeStyle = rgba('#ffffff', 0.35 + 0.4 * f); ctx.lineWidth = 2.5;
        for (let x = sp.v - sp.hw + 34; x < sp.v + sp.hw - 80; x += 46) { ctx.beginPath(); ctx.moveTo(x, sp.u - 7); ctx.lineTo(x + 10, sp.u); ctx.lineTo(x, sp.u + 7); ctx.stroke(); }
        ctx.restore();
        if (f > 0.05) { const sw = (1 - f) * 2 - 1; ctx.strokeStyle = rgba('#ffffff', 0.8 * f); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(sp.v + sw * sp.hw * 0.9, sp.u - sp.hh); ctx.lineTo(sp.v + sw * sp.hw * 0.9 + 14, sp.u + sp.hh); ctx.stroke(); finger(ctx, sp.v + sw * sp.hw * 0.9, sp.u, 0.3); }
        labels.push({ v: sp.v + sp.hw - 26, u: sp.u, s: l.name, w: 110, col: l.color, f, o: {} });
        return;
      }
      if (!L.strings?.[i]) { // an unmapped prop zone
        ctx.strokeStyle = rgba(lighter(l.color, 0.4), 0.55 + 0.4 * f); ctx.lineWidth = 3; circ(ctx, sp.v, sp.u, sp.r); ctx.stroke();
        strikeFx(ctx, rt, i, sp, l.color);
        labels.push({ v: sp.v, u: sp.u, s: l.name, w: sp.r * 2.4, col: l.color, f, o: {} });
        return;
      }
      ctx.strokeStyle = rgba(lighter(l.color, 0.4), 0.55 + 0.4 * f); ctx.lineWidth = 2; rrect(ctx, sp.v - 24, sp.u - 15, 48, 30, 15); ctx.stroke();
      strikeFx(ctx, rt, i, sp, l.color);
      if (f > 0.04) { if (def.plectrum) pick(ctx, sp.v + 14 + (1 - f) * 12, sp.u, 0.9 - 0.5 * f); else finger(ctx, sp.v + 6, sp.u + 18 * (1 - f), f); }
      labels.push({ v: sp.v, u: sp.u, s: l.name, w: Math.max(50, sp.r * 2.2), col: l.color, f, o: {} });
    });
    ctx.restore();
    const size = g.px(15);
    for (const lb of labels) { const [x, y] = F.map(lb.v, lb.u); pill(ctx, lb.s, x, y, lb.w, size, lb.col, lb.f, lb.o); }
  };
  return st;
}

// how many strings the layout should draw for `cnt` lanes: helper for stages that centre the lanes on a bigger instrument
// assign each lane (given its across-position v, in order) the smallest row 0..rows-1 whose previous lane is at least `gap` away,
// so neighbouring receptors stagger along the string instead of overlapping
export function stagger(vs, gap = 54, rows = 4) {
  const last = new Array(rows).fill(-1e9), out = [];
  for (const v of vs) {
    let r = 0, best = -1;
    for (let k = 0; k < rows; k++) if (Math.abs(v - last[k]) >= gap) { r = k; best = k; break; }
    if (best < 0) { let m = 0; for (let k = 1; k < rows; k++) if (Math.abs(v - last[k]) > Math.abs(v - last[m])) m = k; r = m; }
    last[r] = v; out.push(r);
  }
  return out;
}
export function centred(total, cnt) { return Math.max(0, Math.floor((total - cnt) / 2)); }
export { hgrad, vgrad, rgrad, grain, ell, darker, lighter };

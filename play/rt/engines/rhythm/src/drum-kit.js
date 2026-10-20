// Drum kit (1.11.0): the skeleton and the painting helpers shared by the hand-drum stages (stage-barrel, stage-goblet, stage-hourglass,
// stage-cajon, stage-frame, stage-rattle, stage-ensemble). Plain canvas 2D, no state beyond the stage closure, no DOM, no clock.
//
// A drum stage is described by `def`:
//   def.dress(tall)        -> setting for set.js ({ kind, base, rugKind, ..., light })
//   def.build(K)           -> { ref: {w,h}, view?: {tilt, zoom, dx, dy}, spots: [lane spot...], draw(ctx, rt, G) }
//                            K = { lanes, N, order (lane indexes low to high), nm(i), tall, S, P, id }
//   def.voiceOf(i, lane)   -> voice kind for the lane (registered in voice-drums.js), or null
//   def.sound              -> optional stage.sound hook
// The scene is rebuilt when the screen turns between portrait and landscape (the drum is laid out differently in each).
// Spots are in the design space (v across, u down) of the scene's box; zone shapes are ellipses, rings of ellipses or rotated rectangles
// so a drum can lie at any angle. Cues are rings closing on the zone, strikes light the zone, flare the glow and spread a ripple.
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU } from './instr-art.js';
import { glow, text } from './art.js';
import { makeBox, finishSpots, hitSpots, pill, isHero } from './stagekit.js';
import { setting } from './set.js';

export { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU, glow, text };

export const rot2 = (x, y, a) => { const c = Math.cos(a), s = Math.sin(a); return [x * c - y * s, x * s + y * c]; };

// ---- zone shapes ---------------------------------------------------------------------------------------------------------------
// every spot: { v, u (label anchor), r, ap: {cx,cy,rx,ry,rot,rect?}, dist(lv,lu) (<=1 inside), path(ctx), evenodd? }
// a filled ellipse zone centred (cx,cy), radii rx,ry, turned by rot
export function eSpot(cx, cy, rx, ry, rot = 0, o = {}) {
  const c = Math.cos(rot), s = Math.sin(rot);
  const [ax, ay] = rot2(o.ox ?? 0, o.oy ?? 0, rot);
  return { v: cx + ax, u: cy + ay, r: Math.min(rx, ry), ap: o.ap ?? { cx: cx + ax, cy: cy + ay, rx: rx * (o.apk ?? 0.8), ry: ry * (o.apk ?? 0.8), rot },
    dist: (lv, lu) => { const dx = lv - cx, dy = lu - cy; return Math.hypot((dx * c + dy * s) / rx, (-dx * s + dy * c) / ry); },
    path: (g) => { g.beginPath(); g.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); }, ...(o.extra ?? {}) };
}
// a ring between f0 and f1 (fractions of rx,ry) of the ellipse at (cx,cy); label and cue sit at angle `ang` (local, radians)
export function eRing(cx, cy, rx, ry, rot, f0, f1, ang = -Math.PI / 2, o = {}) {
  const c = Math.cos(rot), s = Math.sin(rot), fm = (f0 + f1) / 2, hw = (f1 - f0) / 2;
  const [ax, ay] = rot2(Math.cos(ang) * rx * fm, Math.sin(ang) * ry * fm, rot);
  const cueR = Math.max(10, Math.min(rx, ry) * hw * 1.1);
  return { v: cx + ax, u: cy + ay, r: Math.min(rx, ry) * hw, evenodd: true, ap: o.ap ?? { cx: cx + ax, cy: cy + ay, rx: cueR, ry: cueR, rot },
    dist: (lv, lu) => { const dx = lv - cx, dy = lu - cy, px = (dx * c + dy * s) / rx, py = (-dx * s + dy * c) / ry, d = Math.hypot(px, py); return d < f0 ? 1 + (f0 - d) / hw * 1.6 : d > f1 ? 1 + (d - f1) / hw * 1.6 : Math.abs(d - fm) / hw * 0.9; },
    path: (g) => { g.beginPath(); g.ellipse(cx, cy, Math.max(0.1, rx * f1), Math.max(0.1, ry * f1), rot, 0, TAU); g.ellipse(cx, cy, Math.max(0.1, rx * f0), Math.max(0.1, ry * f0), rot, 0, TAU, true); }, ...(o.extra ?? {}) };
}
// a sector of the ring f0..f1 between angles a0..a1 (local, radians, canvas orientation: 0 = +x, PI/2 = down); a1 may exceed a0 + PI
export function eSector(cx, cy, rx, ry, rot, f0, f1, a0, a1, o = {}) {
  const c = Math.cos(rot), s = Math.sin(rot), fm = (f0 + f1) / 2, hw = (f1 - f0) / 2, span = a1 - a0, am = (a0 + a1) / 2;
  const [ax, ay] = rot2(Math.cos(am) * rx * fm, Math.sin(am) * ry * fm, rot);
  const cueR = o.cueR ?? Math.max(10, Math.min(rx, ry) * hw * 1.05);
  const tw = (a) => ((a % TAU) + TAU) % TAU;
  return { v: cx + ax, u: cy + ay, r: Math.min(rx, ry) * Math.min(hw, span * fm * 0.5), evenodd: false, ap: o.ap ?? { cx: cx + ax, cy: cy + ay, rx: cueR, ry: cueR, rot },
    dist: (lv, lu) => { const dx = lv - cx, dy = lu - cy, px = (dx * c + dy * s) / rx, py = (-dx * s + dy * c) / ry, d = Math.hypot(px, py), th = Math.atan2(py, px), dd = tw(th - a0);
      const radial = d < f0 ? 1 + (f0 - d) / hw * 1.6 : d > f1 ? 1 + (d - f1) / hw * 1.6 : Math.abs(d - fm) / hw * 0.9;
      const ang = dd <= span ? 0 : Math.min(dd - span, TAU - dd) * fm / (hw * 0.9);
      return Math.max(radial, 0.9 * (ang > 0 ? 1 + ang : 0)); },
    path: (g) => { g.beginPath(); g.ellipse(cx, cy, Math.max(0.1, rx * f1), Math.max(0.1, ry * f1), rot, a0, a1); g.ellipse(cx, cy, Math.max(0.1, rx * f0), Math.max(0.1, ry * f0), rot, a1, a0, true); g.closePath(); }, ...(o.extra ?? {}) };
}
// a rotated rounded rectangle zone
export function rSpot(cx, cy, hw, hh, rot = 0, o = {}) {
  const c = Math.cos(rot), s = Math.sin(rot), rad = o.rad ?? Math.min(hw, hh) * 0.3;
  return { v: cx, u: cy, r: Math.min(hw, hh), ap: o.ap ?? { cx, cy, rx: hw * 0.9, ry: hh * 0.9, rot, rect: true, rad },
    dist: (lv, lu) => { const dx = lv - cx, dy = lu - cy; return Math.max(Math.abs((dx * c + dy * s) / hw), Math.abs((-dx * s + dy * c) / hh)); },
    path: (g) => { g.save(); g.translate(cx, cy); g.rotate(rot); rrect(g, -hw, -hh, 2 * hw, 2 * hh, rad); g.restore(); }, ...(o.extra ?? {}) };
}
// path() of rSpot uses save/restore around rrect, which would drop the path; build it with transformed points instead
export function rSpotPath(cx, cy, hw, hh, rot, rad) {
  return (g) => {
    const pts = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([x, y]) => { const [a, b] = rot2(x, y, rot); return [cx + a, cy + b]; });
    const rr = Math.min(rad, hw, hh);
    g.beginPath();
    for (let i = 0; i < 4; i++) { const p0 = pts[(i + 3) % 4], p1 = pts[i], p2 = pts[(i + 1) % 4]; const l0 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), l2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const a = [p1[0] + (p0[0] - p1[0]) * rr / l0, p1[1] + (p0[1] - p1[1]) * rr / l0], b = [p1[0] + (p2[0] - p1[0]) * rr / l2, p1[1] + (p2[1] - p1[1]) * rr / l2];
      if (i === 0) g.moveTo(a[0], a[1]); else g.lineTo(a[0], a[1]);
      g.quadraticCurveTo(p1[0], p1[1], b[0], b[1]); }
    g.closePath();
  };
}
export function rectSpot(cx, cy, hw, hh, rot = 0, o = {}) { const sp = rSpot(cx, cy, hw, hh, rot, o); sp.path = rSpotPath(cx, cy, hw, hh, rot, o.rad ?? Math.min(hw, hh) * 0.3); return sp; }

// lane -> zone key. defs: [{ key, re }] ordered low to high; lanes whose name matches take that key, the rest take the free keys by pitch.
export function assignZones(K, defs) {
  const keyOf = new Array(K.N).fill(null), used = new Set();
  for (let i = 0; i < K.N; i++) { const n = K.nm(i); const d = defs.find((q) => q.re && q.re.test(n) && !used.has(q.key)); if (d) { keyOf[i] = d.key; used.add(d.key); } }
  const free = defs.filter((q) => !used.has(q.key));
  for (const i of K.order) if (!keyOf[i]) { const d = free.shift(); if (d) { keyOf[i] = d.key; used.add(d.key); } }
  return keyOf;
}

// ---- strike feedback -----------------------------------------------------------------------------------------------------------
function zonePaint(ctx, sp, col, f) {
  sp.path(ctx);
  if (!sp.noFill) {   // noFill zones (hands, figures drawn by the stage itself) keep only the ring: no tint over the picture
    ctx.save();
    ctx.fillStyle = rgba(col, 0.08 + 0.5 * f); ctx.fill(sp.evenodd ? 'evenodd' : 'nonzero');
    ctx.clip(sp.evenodd ? 'evenodd' : 'nonzero');
    ctx.fillStyle = rgrad(ctx, sp.v - sp.r * 0.25, sp.u - sp.r * 0.3, 0, sp.r * 2.4, [[0, rgba('#ffffff', 0.18 + 0.32 * f)], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(sp.v - sp.r * 4, sp.u - sp.r * 4, sp.r * 8, sp.r * 8);
    ctx.restore();
    sp.path(ctx);
  }
  sp.path(ctx);
  ctx.strokeStyle = 'rgba(20,10,2,0.45)'; ctx.lineWidth = 5 + 2 * f; ctx.save(); ctx.translate(1.5, 2); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = rgba(lighter(col, 0.5), 0.78 + 0.22 * f); ctx.lineWidth = 3 + 2 * f; ctx.stroke();
}
function ripple(ctx, sp, col, f) {
  if (f <= 0.04) return;
  const a = sp.ap;
  glow(ctx, a.cx, a.cy, Math.min(170, Math.max(a.rx, a.ry) * 1.6 + 30), col, 0.5 * f);
  for (let k = 0; k < 3; k++) { const p = clamp((1 - f) * 1.3 - k * 0.16, 0, 1); if (p <= 0) continue; ctx.strokeStyle = rgba('#ffffff', 0.6 * (1 - p)); ctx.lineWidth = 3.5 - k; ctx.beginPath(); ctx.ellipse(a.cx, a.cy, Math.min(a.rx * (0.55 + 1.4 * p), a.rx + 60 * p), Math.min(a.ry * (0.55 + 1.4 * p), a.ry + 60 * p), a.rot, 0, TAU); ctx.stroke(); }
}
function approach(ctx, sp, col, tau, al) {
  const a = sp.ap, kk = 1 - clamp(tau, 0, 1);
  // the ring closes from a bounded distance: wide zones do not send a huge frame across the drum
  const e = clamp(tau, 0, 1.1) * (Math.min(60, 0.75 * Math.min(a.rx, a.ry) + 16));
  ctx.save(); ctx.globalAlpha = al;
  const ring = (lw, style, dx = 0, dy = 0) => {
    ctx.strokeStyle = style; ctx.lineWidth = lw;
    if (a.rect) { ctx.save(); ctx.translate(a.cx + dx, a.cy + dy); ctx.rotate(a.rot); rrect(ctx, -a.rx - e, -a.ry - e, 2 * (a.rx + e), 2 * (a.ry + e), (a.rad ?? 20) + e); ctx.stroke(); ctx.restore(); }
    else { ctx.beginPath(); ctx.ellipse(a.cx + dx, a.cy + dy, a.rx + e, a.ry + e, a.rot, 0, TAU); ctx.stroke(); }
  };
  ring(9, 'rgba(0,0,0,0.35)', 1.5, 2); ring(4.5, rgba(lighter(col, 0.5), 0.98)); ring(10, rgba(col, 0.5));
  glow(ctx, a.cx, a.cy, Math.min(150, Math.max(a.rx, a.ry) * 1.3) + 30 * kk, col, 0.18 + 0.4 * kk);
  ctx.fillStyle = rgba(lighter(col, 0.55), 0.95); circ(ctx, a.cx, a.cy, 6 + 7 * kk); ctx.fill();
  ctx.restore();
}

// ---- the stage object -------------------------------------------------------------------------------------------------------------
export function createDrumStage(id, S, lanes, P, def) {
  const N = lanes.length;
  const st = { id, kind: 'pads', spots: new Array(N).fill(null), voice: 'drum', F: null };
  const spots = st.spots;
  const order = lanes.map((_, i) => i).sort((a, b) => lanes[a].hz - lanes[b].hz);
  const nm = (i) => String(lanes[i].name).toLowerCase();
  let scene = null, tall = null, dress = {};
  const build = (isTall) => {
    const K = { lanes, N, order, nm, tall: isTall, S, P, id };
    scene = def.build(K);
    dress = def.dress ? def.dress(isTall) : { kind: 'planks' };
    for (let i = 0; i < N; i++) spots[i] = scene.spots[i] ?? eSpot(0, scene.ref.h * (0.2 + 0.05 * i), 40, 40);
  };
  st.layout = (area) => {
    const t = area.h > area.w * (def.tallRatio ?? 1.05);
    if (t !== tall || !scene) { tall = t; build(t); }
    st.F = makeBox(area, scene.ref.w, scene.ref.h, { top: 40, bottom: 10, side: 12, ...(scene.view ?? {}) });
    finishSpots(st.F, spots);
  };
  st.hit = (x, y) => (st.F ? hitSpots(st.F, spots, x, y) : -1);
  st.anchor = (i) => ({ x: spots[i]?.x ?? 0, y: spots[i]?.y ?? 0 });
  // 1.29.0: a scene may place the burst and the judgement text away from the pad (scene.pop[i] = [v, u] in design space), so they never cover the pad's label
  st.popAnchor = (i) => { const q = scene?.pop?.[i]; if (!q || !st.F) return null; const [x, y] = st.F.map(q[0], q[1]); return { x, y }; };
  if (def.voiceOf) st.voiceOf = (i) => def.voiceOf(i, lanes[i], st);
  if (def.sound) st.sound = def.sound;
  st.sustained = !!def.sustained;
  st.draw = (g, rt) => {
    const { ctx } = g, F = st.F;
    if (!F || !scene) return;
    try { F.base = ctx.getTransform(); } catch { F.base = null; }   // 1.25.2: the screen-space (virtual-unit) transform of this frame, which F.area is expressed in; areaInDesign needs it at devicePixelRatio > 1
    if (dress.custom) dress.custom(ctx, F, rt, S, scene); else setting(ctx, F, dress.kind ?? 'planks', S, rt, dress);   // 1.20.0: custom = a stage-drawn backdrop in screen space (scene.floorU gives the floor line)
    ctx.save(); F.apply(ctx);
    scene.draw(ctx, rt, { F, lanes, spots, tall });
    lanes.forEach((l, i) => { const sp = spots[i]; if (!sp || sp.hidden) return; if (def.heroClean && isHero()) return; zonePaint(ctx, sp, l.color, rt.flash[i]); ripple(ctx, sp, l.color, rt.flash[i]); });   // 1.19.0: heroClean stages show the bare instrument on the title
    if (scene.front) scene.front(ctx, rt, { F, lanes, spots, tall });
    for (let k = rt.list.length - 1; k >= 0; k--) {
      const t = rt.list[k];
      if (t.state && t.state !== 'pending' && t.state !== 'miss') continue;
      const tau = (t.t - rt.clock) / rt.look;
      if (tau > 1.0 || tau < -0.25) continue;
      const miss = t.state === 'miss', al = (rt.soft ? 0.5 : 1) * (miss ? 0.35 : 1) * clamp((1.05 - tau) * 8, 0, 1) * clamp((tau + 0.25) * 6, 0, 1);
      const col = miss ? mix(lanes[t.lane].color, '#555555', 0.6) : lanes[t.lane].color;
      approach(ctx, spots[t.lane], col, tau, al);
    }
    ctx.restore();
    const size = g.px(16);
    lanes.forEach((l, i) => { const sp = spots[i]; if (!sp || sp.hidden) return; const [x, y] = F.map(sp.v, sp.u); pill(ctx, l.name, x, y, Math.max(70, sp.r * F.scale * 2.2), size, l.color, rt.flash[i]); });
  };
  return st;
}

// A cached static layer (1.13.0): paint(ctx) draws things that never change between frames (a shell with ornament, a cloth) in the CURRENT local space;
// the first frame at a given pixel scale paints them into an offscreen canvas covering the local box { x, y, w, h } and every later frame is one drawImage.
// Falls back to painting directly when there is no offscreen canvas or the context cannot report its transform (headless null contexts).
export function staticLayer() {
  let cv = null, key = '';
  return (ctx, box, paint) => {
    let sc = 0;
    try { const m = ctx.getTransform(); sc = Math.hypot(m.a, m.b); } catch { sc = 0; }
    const Off = globalThis.OffscreenCanvas, doc = globalThis.document;
    if (!(sc > 0) || (!Off && !doc?.createElement)) { paint(ctx); return; }
    sc = Math.min(3, Math.max(0.25, Math.round(sc * 8) / 8));
    const k = `${sc}|${box.x}|${box.y}|${box.w}|${box.h}`;
    if (!cv || key !== k) {
      const w = Math.ceil(box.w * sc), h = Math.ceil(box.h * sc);
      cv = Off ? new Off(w, h) : Object.assign(doc.createElement('canvas'), { width: w, height: h });
      const g = cv.getContext('2d'); g.scale(sc, sc); g.translate(-box.x, -box.y); paint(g); key = k;
    }
    ctx.drawImage(cv, box.x, box.y, box.w, box.h);
  };
}

// ---- painting helpers ------------------------------------------------------------------------------------------------------------
// the lit "key light" direction used everywhere: upper left. Shadows fall to the lower right.
export function dropShadow(ctx, path, dx = 12, dy = 18, a = 0.4) { ctx.save(); ctx.translate(dx, dy); path(ctx); ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.fill(); ctx.restore(); }

// A stretched hide, drawn in LOCAL coordinates (call after translate/rotate): mottled cream, pores, veins, a worn playing patch, an
// occlusion ring where the skin dips under the hoop and a soft key-light sheen. o: { tint, edge, seed, wear, vib, paste: [{ r, dx, dy, col, rim }] }
export function skinHead(ctx, rx, ry, o = {}) {
  const { tint = '#efe0bd', edge = '#bf9f6b', seed = 5, wear = 0.5, vib = 0, paste = [] } = o;
  ctx.save(); ell(ctx, 0, 0, rx, ry); ctx.clip();
  ctx.fillStyle = rgrad(ctx, 0, 0, 0, Math.max(rx, ry) * 1.12, [[0, lighter(tint, 0.35)], [0.55, tint], [1, edge]], -rx * 0.22, -ry * 0.28); ctx.fillRect(-rx, -ry, 2 * rx, 2 * ry);
  for (let k = 0; k < 40; k++) {
    const a = hash(seed + k) * TAU, d = Math.sqrt(hash(seed + k + 40)), px = Math.cos(a) * d * rx * 0.95, py = Math.sin(a) * d * ry * 0.95;
    ctx.fillStyle = `rgba(${120 + 50 * hash(k)},${86 + 36 * hash(k + 3)},${46},${0.04 + 0.08 * hash(seed + k + 9)})`; ell(ctx, px, py, rx * (0.05 + 0.12 * hash(k + 7)), ry * (0.04 + 0.1 * hash(k + 5))); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(120,84,40,0.15)'; ctx.lineWidth = 1.2;
  for (let k = 0; k < 6; k++) { ctx.beginPath(); const a0 = hash(seed + k * 2) * TAU; ctx.ellipse((hash(seed + k) - 0.5) * rx * 0.5, (hash(seed + k + 5) - 0.5) * ry * 0.5, rx * (0.25 + 0.14 * k), ry * (0.25 + 0.14 * k), 0, a0, a0 + 1.5 + hash(k) * 1.2); ctx.stroke(); }
  for (let k = 0; k < 80; k++) { const a = hash(seed + k * 3) * TAU, d = Math.sqrt(hash(seed + k * 5 + 1)); ctx.fillStyle = 'rgba(70,40,20,0.2)'; circ(ctx, Math.cos(a) * d * rx, Math.sin(a) * d * ry, 0.7 + hash(k) * 1.0); ctx.fill(); }
  // the worn patch where the hands land
  ctx.fillStyle = rgrad(ctx, 0, 0, 0, Math.min(rx, ry) * 0.7, [[0, `rgba(120,86,44,${0.22 * wear})`], [1, 'rgba(120,86,44,0)']]); ctx.fillRect(-rx, -ry, 2 * rx, 2 * ry);
  for (const p of paste) {   // loaded or tuning paste: a dark disc, thicker in the middle, with a raised wet-look rim
    const pr = p.r ?? 0.4, px = (p.dx ?? 0) * rx, py = (p.dy ?? 0) * ry, col = p.col ?? '#1a1612';
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, px + rx * 0.02, py + ry * 0.04, rx * pr, ry * pr); ctx.fill();
    ctx.fillStyle = rgrad(ctx, px, py, 0, rx * pr, [[0, lighter(col, 0.12)], [0.7, col], [1, darker(col, 0.35)]], px - rx * pr * 0.3, py - ry * pr * 0.35); ell(ctx, px, py, rx * pr, ry * pr); ctx.fill();
    ctx.strokeStyle = rgba(lighter(col, 0.6), 0.35); ctx.lineWidth = 2; ell(ctx, px, py, rx * pr * 0.94, ry * pr * 0.94); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.16)'; ell(ctx, px - rx * pr * 0.3, py - ry * pr * 0.4, rx * pr * 0.34, ry * pr * 0.16); ctx.fill();
  }
  ctx.fillStyle = rgrad(ctx, 0, 0, Math.min(rx, ry) * 0.72, Math.max(rx, ry) * 1.04, [[0, 'rgba(50,28,10,0)'], [1, 'rgba(50,28,10,0.5)']]); ctx.fillRect(-rx, -ry, 2 * rx, 2 * ry);
  ctx.fillStyle = rgrad(ctx, -rx * 0.3, -ry * 0.38, 0, Math.max(rx, ry) * 0.7, [[0, 'rgba(255,255,255,0.34)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-rx, -ry, 2 * rx, 2 * ry);
  if (vib > 0.03) {   // the skin shivers after a stroke: pale rings travel to the edge
    for (let k = 0; k < 3; k++) { const p = clamp((1 - vib) * 1.4 - k * 0.2, 0, 1); if (p <= 0) continue; ctx.strokeStyle = `rgba(255,248,226,${0.5 * (1 - p) * vib})`; ctx.lineWidth = 3; ell(ctx, 0, 0, rx * (0.2 + 0.8 * p), ry * (0.2 + 0.8 * p)); ctx.stroke(); }
  }
  ctx.restore();
}

// a hoop around an elliptical head (local coords): metal, wood, or a bound rope ring
export function hoop(ctx, rx, ry, w, o = {}) {
  const { kind = 'metal', col = '#c9ccd2', seed = 2 } = o;
  const path = () => { ctx.beginPath(); ctx.ellipse(0, 0, rx + w, ry + w, 0, 0, TAU); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU, true); };
  ctx.save();
  path(); ctx.fillStyle = rgrad(ctx, 0, 0, Math.min(rx, ry), Math.max(rx, ry) + w, [[0, lighter(col, 0.2)], [0.5, col], [1, darker(col, 0.55)]], -rx * 0.3, -ry * 0.4); ctx.fill('evenodd');
  ctx.save(); path(); ctx.clip('evenodd');
  if (kind === 'wood') grain(ctx, -rx - w, -ry - w, 2 * (rx + w), 2 * (ry + w), darker(col, 0.7), 0.4, seed, false, 18);
  if (kind === 'rope') { const n = 46; for (let k = 0; k < n; k++) { const a = (k / n) * TAU, rr = (rx + w * 0.5), r2 = (ry + w * 0.5); ctx.strokeStyle = k % 2 ? rgba(darker(col, 0.5), 0.55) : rgba(lighter(col, 0.45), 0.4); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * (rx + 1), Math.sin(a) * (ry + 1)); ctx.lineTo(Math.cos(a + 0.22) * (rx + w), Math.sin(a + 0.22) * (ry + w)); ctx.stroke(); void rr; void r2; } }
  if (kind === 'metal') { ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, rx + w * 0.62, ry + w * 0.62, 0, Math.PI * 1.05, Math.PI * 1.7); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = rgba(darker(col, 0.75), 0.8); ctx.lineWidth = 2; ell(ctx, 0, 0, rx + w, ry + w); ctx.stroke(); ell(ctx, 0, 0, rx, ry); ctx.stroke();
  ctx.strokeStyle = rgba(lighter(col, 0.6), 0.5); ctx.lineWidth = 1.4; ell(ctx, 0, 0, rx + w - 2, ry + w - 2); ctx.stroke();
  ctx.restore();
}

// round-headed studs / tacks on a circle path of an ellipse (local coords)
export function studRing(ctx, rx, ry, n, size, col = '#e8c868', ph = 0) {
  for (let k = 0; k < n; k++) {
    const a = ph + (k / n) * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    ctx.fillStyle = 'rgba(0,0,0,0.42)'; circ(ctx, x + size * 0.3, y + size * 0.45, size); ctx.fill();
    ctx.fillStyle = rgrad(ctx, x, y, 0, size * 1.1, [[0, lighter(col, 0.75)], [0.55, col], [1, darker(col, 0.55)]], x - size * 0.3, y - size * 0.35); circ(ctx, x, y, size); ctx.fill();
  }
}

// a cylinder body in local coords: axis along x from x0 to x1, radius profile r(t) (t 0..1), shaded across y like a lit tube.
// returns the closed outline path function.
export function barrelPath(x0, x1, rAt, steps = 40) {
  return (ctx) => {
    ctx.beginPath();
    for (let k = 0; k <= steps; k++) { const t = k / steps; ctx.lineTo(x0 + (x1 - x0) * t, -rAt(t)); }
    for (let k = steps; k >= 0; k--) { const t = k / steps; ctx.lineTo(x0 + (x1 - x0) * t, rAt(t)); }
    ctx.closePath();
  };
}
export function tubeShade(ctx, path, ybox, base, o = {}) {
  const { hl = 0.26, dark = 0.55, spec = 0.22 } = o;
  path(ctx); ctx.fillStyle = vgrad(ctx, -ybox, ybox, [[0, darker(base, dark)], [0.18, lighter(base, hl)], [0.34, lighter(base, hl * 0.6)], [0.55, base], [0.82, darker(base, 0.35)], [1, darker(base, dark + 0.12)]]); ctx.fill();
  if (spec > 0) { ctx.save(); path(ctx); ctx.clip(); ctx.fillStyle = vgrad(ctx, -ybox, ybox, [[0, 'rgba(255,255,255,0)'], [0.16, `rgba(255,252,236,${spec})`], [0.26, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-4000, -ybox, 8000, ybox * 2); ctx.restore(); }
}

// a braided/laced strap zigzag between two rings (local coords), used by barrel drums
export function lacing(ctx, pts0, pts1, col, w) {
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const n = Math.min(pts0.length, pts1.length);
  for (const [lw, c, dx, dy] of [[w + 3, 'rgba(0,0,0,0.38)', 2, 3], [w, darker(col, 0.35), 0, 0], [w * 0.6, col, -0.4, -0.4], [w * 0.2, lighter(col, 0.55), -w * 0.18, -w * 0.18]]) {
    ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath();
    for (let k = 0; k < n; k++) { const a = pts0[k], b = pts1[k], b2 = pts1[(k + 1) % n]; ctx.moveTo(a[0] + dx, a[1] + dy); ctx.lineTo(b[0] + dx, b[1] + dy); ctx.moveTo(a[0] + dx, a[1] + dy); ctx.lineTo(b2[0] + dx, b2[1] + dy); }
    ctx.stroke();
  }
  ctx.restore();
}

// a wooden stick (beater) in local coords: from (x,y) at angle ang, length len
export function beater(ctx, x, y, ang, len, w, o = {}) {
  const { wood = '#d8b27a', head = null, a = 1 } = o;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.beginPath(); ctx.moveTo(0, -w * 0.5 + 6); ctx.lineTo(len, -w * 0.3 + 6); ctx.lineTo(len, w * 0.3 + 6); ctx.lineTo(0, w * 0.5 + 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = vgrad(ctx, -w * 0.5, w * 0.5, [[0, lighter(wood, 0.35)], [0.5, wood], [1, darker(wood, 0.5)]]);
  ctx.beginPath(); ctx.moveTo(0, -w * 0.5); ctx.lineTo(len, -w * 0.3); ctx.lineTo(len, w * 0.3); ctx.lineTo(0, w * 0.5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rgba(darker(wood, 0.7), 0.6); ctx.lineWidth = 1.5; ctx.stroke();
  if (head) { ctx.fillStyle = rgrad(ctx, len, 0, 0, w * 0.9, [[0, lighter(head, 0.4)], [1, darker(head, 0.4)]], len - w * 0.2, -w * 0.2); circ(ctx, len, 0, w * 0.62); ctx.fill(); }
  ctx.restore();
}

// V-straps (zigzag lacing) over the front of a shell that runs along local x from xL to xR with radius profile rAt(t).
// Each strap is drawn with its own foreshortening so it hugs the bulge; ends turn round the hoops in leather loops.
export function vStraps(ctx, o) {
  const { xL, xR, rAt, n = 7, col = '#c8452f', w = 11, rL = 0, rR = 0, aL = 0, aR = 0, squeeze = 0 } = o;
  const nSeg = n * 2 + 1, dphi = Math.PI / (n * 2 - 0.6), zig = [];
  for (let k = 0; k < nSeg; k++) zig.push(-Math.PI / 2 - dphi * 0.4 + k * dphi);
  const lerpn = (a, b, t) => a + (b - a) * t;
  for (let k = 0; k < nSeg - 1; k++) {
    const pa = zig[k], pb = zig[k + 1], fromLeft = k % 2 === 0, pL = fromLeft ? pa : pb, pR = fromLeft ? pb : pa, mid = (pL + pR) / 2;
    if (Math.cos(mid) < 0.02) continue;
    for (const [c, ww, dy] of [['rgba(0,0,0,0.38)', w + 3, 4], [darker(col, 0.45), w, 0], [col, w * 0.66, -0.6], [lighter(col, 0.55), w * 0.2, -w * 0.2]]) {
      ctx.strokeStyle = c; ctx.lineWidth = ww * (0.5 + 0.5 * Math.cos(mid)); ctx.lineCap = 'round'; ctx.beginPath();
      for (let s = 0; s <= 24; s++) { const t = s / 24, ph = lerpn(pL, pR, t), r = rAt(t) * (1 - squeeze * Math.sin(Math.PI * t) * 0.0) + 1.5, y = r * Math.sin(ph) + dy, x = lerpn(xL + aL, xR - aR, t); if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
    }
  }
  for (let k = 0; k < nSeg; k++) { const ph = zig[k]; if (Math.cos(ph) < 0.1) continue; const left = k % 2 === 0, x = left ? xL + aL : xR - aR, r = left ? rL : rR;
    ctx.fillStyle = darker(col, 0.4); ell(ctx, x, r * Math.sin(ph), 5 + 2 * Math.cos(ph), 6.5); ctx.fill(); ctx.fillStyle = lighter(col, 0.3); ell(ctx, x - 1, r * Math.sin(ph) - 1.5, 2.4, 3.2); ctx.fill(); }
}

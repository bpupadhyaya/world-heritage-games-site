// A performer for the drum, bar and gong stages: a seated (or standing) player whose arms reach with a two-bone IK to the notes
// that are about to fall due, strike them when they sound and lift away again. The torso is drawn behind the instrument and the
// arms, hands and sticks in front of it, all in screen space with the same upper-left key light.
// Presentation only: it reads the activity's runtime (flash, pending targets, clock) and never touches scoring.
import { clamp, mix, rgba, lighter, darker, rrect, ell, circ, TAU, hgrad, vgrad, rgrad } from './art.js';
import { instrumentBox } from './set.js';

const SKINS = ['#e9b48a', '#d49a6c', '#b87a4d', '#8d5a36', '#6b4226', '#f0c8a0'];

// a simple hand: palm, four fingers fanned, thumb; (x,y) = palm centre, s = size, rot in radians
export function hand(ctx, x, y, s, rot, a = 1, col = '#e0a678') {
  if (a <= 0.02) return;
  ctx.save(); ctx.globalAlpha = clamp(a, 0, 1); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ell(ctx, 6, 9, s * 0.52, s * 0.62); ctx.fill();
  const body = rgrad(ctx, 0, 0, 0, s * 0.8, [[0, lighter(col, 0.35)], [0.7, col], [1, darker(col, 0.35)]], -s * 0.15, -s * 0.2);
  ctx.fillStyle = body; ell(ctx, 0, 0, s * 0.46, s * 0.52); ctx.fill();
  for (let k = 0; k < 4; k++) { const a2 = (k - 1.5) * 0.26, len = s * (0.62 - 0.07 * Math.abs(k - 1.5)); ctx.save(); ctx.rotate(a2); rrect(ctx, -s * 0.085, -s * 0.28 - len, s * 0.17, len, s * 0.085); ctx.fillStyle = body; ctx.fill(); ctx.restore(); }
  ctx.save(); ctx.rotate(-1.05); rrect(ctx, -s * 0.09, -s * 0.5, s * 0.18, s * 0.42, s * 0.09); ctx.fillStyle = body; ctx.fill(); ctx.restore();
  ctx.restore();
}
export function stick(ctx, x, y, ang, len, w, wood = '#e6c58e', head = '#c9955a', a = 1) {
  if (a <= 0.02) return;
  ctx.save(); ctx.globalAlpha = clamp(a, 0, 1); ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, 5, 6, w, len, w / 2); ctx.fill();
  ctx.fillStyle = hgrad(ctx, 0, w, [[0, lighter(wood, 0.3)], [0.5, wood], [1, darker(wood, 0.4)]]); rrect(ctx, 0, 0, w, len, w / 2); ctx.fill();
  ctx.fillStyle = rgrad(ctx, w / 2, 0, 0, w * 1.1, [[0, lighter(head, 0.4)], [1, darker(head, 0.3)]], w * 0.35, -w * 0.2); circ(ctx, w / 2, 0, w * 0.95); ctx.fill();
  ctx.restore();
}

// a shaded capsule from (x0,y0) to (x1,y1): body colour, a lit upper-left edge, a shaded lower-right edge, a soft ground shadow
function capsule(ctx, x0, y0, x1, y1, w, col, shadow = true) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (shadow) { ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0 + 5, y0 + 8); ctx.lineTo(x1 + 5, y1 + 8); ctx.stroke(); }
  ctx.strokeStyle = darker(col, 0.32); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  const sgn = nx + ny < 0 ? 1 : -1; // lit side faces the upper left
  ctx.strokeStyle = col; ctx.lineWidth = w * 0.78; ctx.beginPath(); ctx.moveTo(x0 + nx * sgn * w * 0.06, y0 + ny * sgn * w * 0.06); ctx.lineTo(x1 + nx * sgn * w * 0.06, y1 + ny * sgn * w * 0.06); ctx.stroke();
  ctx.strokeStyle = lighter(col, 0.38); ctx.lineWidth = w * 0.28; ctx.beginPath(); ctx.moveTo(x0 + nx * sgn * w * 0.2, y0 + ny * sgn * w * 0.2); ctx.lineTo(x1 + nx * sgn * w * 0.2, y1 + ny * sgn * w * 0.2); ctx.stroke();
  ctx.restore();
}

// regional palettes are chosen from the instrument key so the same game always has the same player
const hashStr = (s) => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) % 99991; return h; };

// one person: torso, neck, head with a few quiet face marks and headwear (shoulders at (cx, sy), shoulder width shw)
function person(ctx, p, A, breathe, bot, room) {
  const { cx, sy, shw, skin, shirt, trim, hw, hc } = p;
  const tw = shw * 1.28, t0 = sy + (bot ? 6 : -4), t1 = bot ? sy + shw * 2.4 : sy + shw * 2.1;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, cx + 8, t0 + (t1 - t0) * 0.5, tw * 0.62, (t1 - t0) * 0.52); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - tw / 2, t0 + shw * 0.1 + breathe);
  ctx.quadraticCurveTo(cx - tw / 2, t0 - shw * 0.04 + breathe, cx - tw * 0.3, t0 - shw * 0.06 + breathe);
  ctx.quadraticCurveTo(cx, t0 - shw * 0.12 + breathe, cx + tw * 0.3, t0 - shw * 0.06 + breathe);
  ctx.quadraticCurveTo(cx + tw / 2, t0 - shw * 0.04 + breathe, cx + tw / 2, t0 + shw * 0.1 + breathe);
  ctx.lineTo(cx + tw * 0.44, t1); ctx.lineTo(cx - tw * 0.44, t1); ctx.closePath();
  ctx.fillStyle = hgrad(ctx, cx - tw / 2, cx + tw / 2, [[0, darker(shirt, 0.5)], [0.25, lighter(shirt, 0.22)], [0.6, shirt], [1, darker(shirt, 0.55)]]); ctx.fill();
  ctx.strokeStyle = rgba(lighter(shirt, 0.6), 0.4); ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = trim; ctx.fillRect(cx - 3, t0 + shw * 0.08, 6, (t1 - t0) * 0.7);
  ctx.fillStyle = rgba(trim, 0.7); for (let k = 0; k < 6; k++) { circ(ctx, cx, t0 + shw * 0.18 + k * shw * 0.17, 4); ctx.fill(); }
  if (bot || room < 96) return;
  const hr = clamp(shw * 0.2, 24, 60), hy = sy - shw * 0.2 - hr * 1.15 + breathe * 0.4;
  ctx.fillStyle = vgrad(ctx, hy, sy, [[0, lighter(skin, 0.05)], [1, darker(skin, 0.4)]]); rrect(ctx, cx - hr * 0.42, hy, hr * 0.84, sy - hy, hr * 0.3); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(ctx, cx + 4, hy + hr * 1.1, hr * 1.05, hr * 1.2); ctx.fill();
  ctx.fillStyle = rgrad(ctx, cx, hy, 2, hr * 1.3, [[0, lighter(skin, 0.3)], [0.65, skin], [1, darker(skin, 0.4)]], cx - hr * 0.35, hy - hr * 0.35); ell(ctx, cx, hy, hr * 0.92, hr * 1.1); ctx.fill();
  ctx.strokeStyle = rgba(darker(skin, 0.6), 0.5); ctx.lineWidth = 1.5; ctx.stroke();
  for (const d of [-1, 1]) { ctx.fillStyle = darker(skin, 0.12); ell(ctx, cx + d * hr * 0.9, hy + hr * 0.1, hr * 0.14, hr * 0.26); ctx.fill(); }
  { const ey = hy + hr * 0.08;
    ctx.strokeStyle = 'rgba(32,18,10,0.75)'; ctx.lineWidth = Math.max(1.5, hr * 0.07); ctx.lineCap = 'round';
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + d * hr * 0.2, ey - hr * 0.22); ctx.lineTo(cx + d * hr * 0.52, ey - hr * 0.25); ctx.stroke(); }
    ctx.fillStyle = 'rgba(30,16,8,0.9)'; for (const d of [-1, 1]) { ell(ctx, cx + d * hr * 0.36, ey, hr * 0.085, hr * 0.06); ctx.fill(); }
    ctx.strokeStyle = rgba(darker(skin, 0.5), 0.5); ctx.lineWidth = Math.max(1.2, hr * 0.05);
    ctx.beginPath(); ctx.moveTo(cx - hr * 0.02, ey + hr * 0.02); ctx.lineTo(cx - hr * 0.07, ey + hr * 0.3); ctx.lineTo(cx + hr * 0.08, ey + hr * 0.33); ctx.stroke();
    ctx.strokeStyle = 'rgba(110,40,30,0.7)'; ctx.beginPath(); ctx.arc(cx, ey + hr * 0.46, hr * 0.2, 0.25, Math.PI - 0.25); ctx.stroke(); }
  if (hw === 'cap' || hw === 'hat') {
    ctx.fillStyle = hgrad(ctx, cx - hr, cx + hr, [[0, darker(hc, 0.4)], [0.35, lighter(hc, 0.2)], [1, darker(hc, 0.5)]]);
    ctx.beginPath(); ctx.ellipse(cx, hy - hr * 0.35, hr * 0.98, hr * 0.78, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
    if (hw === 'hat') { ctx.fillStyle = darker(hc, 0.3); ell(ctx, cx, hy - hr * 0.35, hr * 1.5, hr * 0.28); ctx.fill(); ctx.fillStyle = hgrad(ctx, cx - hr, cx + hr, [[0, darker(hc, 0.4)], [0.35, lighter(hc, 0.2)], [1, darker(hc, 0.5)]]); ctx.beginPath(); ctx.ellipse(cx, hy - hr * 0.5, hr * 0.8, hr * 0.7, 0, Math.PI, TAU); ctx.fill(); }
  } else if (hw === 'wrap') {
    ctx.fillStyle = hgrad(ctx, cx - hr, cx + hr, [[0, darker(hc, 0.45)], [0.3, lighter(hc, 0.25)], [1, darker(hc, 0.5)]]);
    ctx.beginPath(); ctx.ellipse(cx, hy - hr * 0.3, hr * 1.02, hr * 0.85, 0, Math.PI * 0.95, TAU * 1.0 + 0.1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(lighter(hc, 0.5), 0.55); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, hy - hr * 0.2, hr * 0.8, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
  } else {
    ctx.fillStyle = hgrad(ctx, cx - hr, cx + hr, [[0, '#0e0a08'], [0.4, '#3a2a22'], [1, '#0a0605']]);
    ctx.beginPath(); ctx.ellipse(cx, hy - hr * 0.2, hr * 0.98, hr * 0.92, 0, Math.PI * 0.98, TAU * 1.0 + 0.05); ctx.closePath(); ctx.fill();
  }
}

// a head and shoulders turned by `ang` (0 = upright, head above the shoulders): used for the wind players at the mouthpiece
export function bust(ctx, x, y, hr, ang, o = {}) {
  const skin = o.skin ?? '#d49a6c', shirt = o.shirt ?? '#2d5f7a', hw = o.hw ?? 'cap', hc = o.hc ?? '#e3b778', puff = o.puff ?? 0;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  // shoulders and neck (below the head)
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 6, hr * 2.3, hr * 2.0, hr * 1.2); ctx.fill();
  ctx.fillStyle = hgrad(ctx, -hr * 2, hr * 2, [[0, darker(shirt, 0.5)], [0.3, lighter(shirt, 0.2)], [0.65, shirt], [1, darker(shirt, 0.55)]]);
  ctx.beginPath(); ctx.moveTo(-hr * 2.2, hr * 3.6); ctx.quadraticCurveTo(-hr * 2.3, hr * 1.5, -hr * 0.9, hr * 1.35); ctx.lineTo(hr * 0.9, hr * 1.35); ctx.quadraticCurveTo(hr * 2.3, hr * 1.5, hr * 2.2, hr * 3.6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = vgrad(ctx, hr * 0.6, hr * 1.5, [[0, skin], [1, darker(skin, 0.4)]]); rrect(ctx, -hr * 0.42, hr * 0.6, hr * 0.84, hr * 0.9, hr * 0.3); ctx.fill();
  // head
  ctx.fillStyle = rgrad(ctx, 0, 0, 2, hr * 1.3, [[0, lighter(skin, 0.3)], [0.65, skin], [1, darker(skin, 0.4)]], -hr * 0.35, -hr * 0.35); ell(ctx, 0, 0, hr * (0.92 + puff), hr * 1.1); ctx.fill();
  ctx.strokeStyle = rgba(darker(skin, 0.6), 0.5); ctx.lineWidth = 1.5; ctx.stroke();
  for (const d of [-1, 1]) { ctx.fillStyle = darker(skin, 0.12); ell(ctx, d * hr * 0.92 * (1 + puff), hr * 0.1, hr * 0.14, hr * 0.26); ctx.fill(); }
  const ey = hr * 0.08;
  ctx.strokeStyle = 'rgba(32,18,10,0.8)'; ctx.lineWidth = Math.max(1.5, hr * 0.07); ctx.lineCap = 'round';
  for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d * hr * 0.36, ey, hr * 0.11, 0.2, Math.PI - 0.2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(d * hr * 0.2, ey - hr * 0.22); ctx.lineTo(d * hr * 0.52, ey - hr * 0.25); ctx.stroke(); }
  ctx.strokeStyle = rgba(darker(skin, 0.5), 0.5); ctx.lineWidth = Math.max(1.2, hr * 0.05); ctx.beginPath(); ctx.moveTo(-hr * 0.02, ey + hr * 0.02); ctx.lineTo(-hr * 0.07, ey + hr * 0.3); ctx.lineTo(hr * 0.08, ey + hr * 0.33); ctx.stroke();
  ctx.fillStyle = 'rgba(150,60,50,0.85)'; ell(ctx, 0, ey + hr * 0.6, hr * 0.17, hr * 0.09); ctx.fill();
  if (puff > 0.01) { ctx.fillStyle = 'rgba(255,200,170,0.2)'; for (const d of [-1, 1]) { ell(ctx, d * hr * 0.62, hr * 0.38, hr * 0.28, hr * 0.26); ctx.fill(); } }
  if (hw === 'cap' || hw === 'hat') {
    ctx.fillStyle = hgrad(ctx, -hr, hr, [[0, darker(hc, 0.4)], [0.35, lighter(hc, 0.2)], [1, darker(hc, 0.5)]]);
    ctx.beginPath(); ctx.ellipse(0, -hr * 0.35, hr * 0.98, hr * 0.78, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
  } else if (hw === 'wrap') {
    ctx.fillStyle = hgrad(ctx, -hr, hr, [[0, darker(hc, 0.45)], [0.3, lighter(hc, 0.25)], [1, darker(hc, 0.5)]]);
    ctx.beginPath(); ctx.ellipse(0, -hr * 0.3, hr * 1.02, hr * 0.85, 0, Math.PI * 0.95, TAU + 0.1); ctx.closePath(); ctx.fill();
  } else {
    ctx.fillStyle = hgrad(ctx, -hr, hr, [[0, '#0e0a08'], [0.4, '#3a2a22'], [1, '#0a0605']]);
    ctx.beginPath(); ctx.ellipse(0, -hr * 0.2, hr * 0.98, hr * 0.92, 0, Math.PI * 0.98, TAU + 0.05); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

export function createPlayer(cfg = {}) {
  const key = cfg.key ?? '';
  const skin = cfg.skin ?? SKINS[hashStr(key) % SKINS.length];
  const skin2 = SKINS[(hashStr(key) + 2) % SKINS.length];
  const shirt = cfg.shirt ?? '#2d5f7a', trim = cfg.trim ?? '#e3b778';
  const nHands = cfg.hands ?? 2;
  const L = { toolLen: cfg.toolLen ?? 64, toolW: cfg.toolW ?? 10, tool: cfg.tool ?? 'stick' };
  const toolOf = (k) => (cfg.toolOf ? cfg.toolOf(k) : L.tool);
  const hs = Array.from({ length: nHands }, () => ({ x: 0, y: 0, tx: 0, ty: 0, lane: -1, hitT: -9, init: false }));
  let lastAnim = 0;
  const prev = [];
  const st = { hands: hs, geo: null, people: [] };

  // two-bone IK: elbow position between shoulder s and wrist w
  const elbow = (s, w, l1, l2, out) => {
    const dx = w.x - s.x, dy = w.y - s.y, raw = Math.hypot(dx, dy) || 1, d = clamp(raw, 1, l1 + l2 - 1), ux = dx / raw, uy = dy / raw;
    const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    return { x: s.x + ux * a + (-uy) * h * out, y: s.y + uy * a + ux * h * out };
  };
  // where the wrist is for a hand whose tool tip is at (hh.x, hh.y)
  const wristOf = (k, hh, s) => {
    const tool = toolOf(k);
    if (tool === 'pestle') { const d = cfg.pestleDir(k), g = st.geo ? st.geo.grip : 200; return { x: hh.x + d.x * g, y: hh.y + d.y * g }; }
    const len = tool === 'stick' ? L.toolLen : 0, dx = hh.x - s.x, dy = hh.y - s.y, dd = Math.hypot(dx, dy) || 1;
    return { x: hh.x - (dx / dd) * len, y: hh.y - (dy / dd) * len };
  };

  st.update = (F, rt, spots, lanes) => {
    const A = F.area, bb = instrumentBox(F), dt = clamp(rt.anim - lastAnim, 0, 0.1); lastAnim = rt.anim;
    const bw = bb.x1 - bb.x0, bh = bb.y1 - bb.y0, cx = (bb.x0 + bb.x1) / 2 + (cfg.dx ?? 0) * bw;
    const side = cfg.side ?? 'top';
    const shw = clamp(Math.min(bw * 0.72, A.w * 0.62), 120, 340) * (cfg.shoulder ?? 1);
    let sy;
    if (side === 'bottom') sy = Math.min(A.y + A.h + 40, bb.y1 + (cfg.sit ?? 0.1) * bh + 20);
    else if (side === 'left' || side === 'right') sy = (bb.y0 + bb.y1) / 2;
    else sy = clamp(bb.y0 + (cfg.sit ?? 0.0) * bh - 6, A.y + 52, A.y + A.h * 0.6);
    const G = st.geo && st.geo.A === A ? st.geo : { A };
    Object.assign(G, { cx, sy, shw, bb, side, F });
    st.geo = G;
    if (cfg.lenOf) { G.plen = cfg.lenOf(G); G.grip = cfg.gripOf(G); }
    // shoulders: a custom pair (two standing players) or the two shoulders of one seated player
    const sxs = side === 'left' ? bb.x0 + (cfg.sit ?? 0.0) * bw - 6 : bb.x1 - (cfg.sit ?? 0.0) * bw + 6;
    let sh = side === 'left' || side === 'right' ? [{ x: sxs, y: sy - shw / 2 }, { x: sxs, y: sy + shw / 2 }] : [{ x: cx - shw / 2, y: sy }, { x: cx + shw / 2, y: sy }];
    if (cfg.shoulderPos) sh = cfg.shoulderPos(G, spots);
    st.sh = sh;
    if (cfg.twin) { const pw = cfg.personW ? cfg.personW(G) : clamp(A.w * 0.34, 110, 260); st.people = sh.map((s, k) => ({ cx: s.x, sy: s.y, shw: pw, skin: k ? skin2 : skin, shirt: k ? (cfg.shirt2 ?? mix(shirt, '#ffffff', 0.2)) : shirt, trim, hw: cfg.headwear ?? 'cap', hc: cfg.hat ?? trim })); }
    else st.people = [{ cx: side === 'left' || side === 'right' ? sxs : cx, cy: sy, sy, shw, skin, shirt, trim, hw: cfg.headwear ?? 'cap', hc: cfg.hat ?? trim }];
    // which hand goes where for lane i: a list of { h, x, y } (a combined stroke may use both hands)
    const aim = (i) => {
      const sp = spots[i];
      if (!sp) return [];
      if (cfg.aim) return cfg.aim(i, sp, G);
      const h = cfg.handOf ? cfg.handOf(i, sp, G) : (nHands === 1 ? 0 : (sp.x < cx - 2 ? 0 : sp.x > cx + 2 ? 1 : i % 2));
      return [{ h: clamp(h, 0, nHands - 1), x: sp.x, y: sp.y }];
    };
    lanes.forEach((_, i) => {
      const f = rt.flash[i] ?? 0;
      if (f > 0.6 && (prev[i] ?? 0) <= 0.6) for (const a of aim(i)) { const hh = hs[a.h]; hh.lane = i; hh.hitT = rt.anim; hh.hx = a.x; hh.hy = a.y; }
      prev[i] = f;
    });
    // targets: the next due note of each hand, else the last strike, else a rest pose over the instrument
    const pend = [];
    for (const t of rt.list) if (!t.state || t.state === 'pending') pend.push(t);
    if (rt.demos) for (const t of rt.demos) pend.push(t);
    hs.forEach((hh, k) => {
      let next = null, nx = 0, ny = 0;
      for (const t of pend) {
        const dtn = t.t - rt.clock;
        if (dtn < -0.1 || dtn > 0.7) continue;
        for (const a of aim(t.lane)) if (a.h === k && (!next || t.t < next.t)) { next = t; nx = a.x; ny = a.y; }
      }
      const sinceHit = rt.anim - hh.hitT;
      let tx, ty, raise;
      if (next) { tx = nx; ty = ny; raise = clamp((next.t - rt.clock) / 0.32, 0, 1); }
      else if (hh.lane >= 0 && sinceHit < 0.5 && hh.hx != null) { tx = hh.hx; ty = hh.hy; raise = clamp(sinceHit / 0.22, 0, 1) * 0.85; }
      else if (cfg.restOf) { const r = cfg.restOf(k, spots, G); tx = r.x; ty = r.y; raise = r.raise ?? 0.2; }
      else { tx = cx + (k === 0 ? -1 : 1) * Math.min(bw * 0.18, 70); ty = bb.y0 + bh * 0.46 + Math.sin(rt.anim * 1.7 + k * 2.1) * 4; raise = 0.55; if (nHands === 1) tx = cx; }
      const tool = toolOf(k), lift = tool === 'stick' ? L.toolLen * 0.9 + 14 : tool === 'pestle' ? (cfg.lift ?? 90) : 30;
      hh.tx = tx; hh.ty = ty - raise * lift; hh.raise = raise;
      if (!hh.init) { hh.x = hh.tx; hh.y = hh.ty; hh.init = true; }
      const e = clamp(dt * 24, 0, 1);
      hh.x += (hh.tx - hh.x) * e; hh.y += (hh.ty - hh.y) * e;
    });
    // arm length: long enough that every note stays in reach (a hand is never parted from its stick), never shorter than a natural arm
    const shOf = (k) => sh[nHands === 1 ? 0 : Math.min(k, sh.length - 1)] ?? sh[0];
    let dmax = 0;
    hs.forEach((hh, k) => { const w = wristOf(k, hh, shOf(k)); dmax = Math.max(dmax, Math.hypot(w.x - shOf(k).x, w.y - shOf(k).y)); });
    const base = cfg.twin ? st.people[0].shw * 0.8 : shw * 0.8;
    const want = clamp(Math.max(base, dmax / 1.88), base, Math.max(base, shw * 1.15));
    G.armL = G.armL == null ? want : G.armL + (want - G.armL) * clamp(dt * 8, 0, 1);
    const l1 = G.armL * 0.52, l2 = G.armL * 0.5;
    hs.forEach((hh, k) => {
      const s2 = shOf(k), wr = wristOf(k, hh, s2);
      hh.elbow = elbow(s2, wr, l1, l2, (side === 'left' || side === 'right') ? ((s2.y < sy ? 1 : -1) * (side === 'left' ? 1 : -1)) : (s2.x < cx ? -1 : 1) * (side === 'bottom' ? -1 : 1));
      hh.wrist = wr; hh.shoulder = s2;
    });
  };

  // torso, neck and head: behind the instrument
  st.back = (ctx, F, rt) => {
    const G = st.geo;
    if (!G) return;
    const { A } = G, bot = G.side === 'bottom';
    ctx.save();
    ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
    const breathe = Math.sin(rt.anim * 1.8) * 1.5 + (rt.pul ?? 0) * 2;
    for (const p of st.people) {
      if (G.side === 'left' || G.side === 'right') {
        // the player sits to one side: draw upright in a frame turned so that "up" points away from the instrument
        const dir = G.side === 'left' ? -1 : 1, room = G.side === 'left' ? p.cx - A.x : A.x + A.w - p.cx;
        ctx.save(); ctx.translate(p.cx, p.cy); ctx.rotate(dir * Math.PI / 2);
        person(ctx, { ...p, cx: 0, sy: 0 }, A, breathe, false, room);
        ctx.restore();
      } else person(ctx, p, A, breathe, bot, p.sy - A.y);
    }
    ctx.restore();
  };

  const drawFist = (ctx, x, y, r, ang, col) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 4, 7, r * 1.1, r * 0.95); ctx.fill();
    ctx.fillStyle = rgrad(ctx, 0, 0, 1, r * 1.4, [[0, lighter(col, 0.38)], [0.65, col], [1, darker(col, 0.4)]], -r * 0.2, -r * 0.3); ell(ctx, 0, 0, r * 1.15, r * 0.95); ctx.fill();
    ctx.strokeStyle = rgba(darker(col, 0.6), 0.55); ctx.lineWidth = 1.2;
    for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(r * 0.3, k * r * 0.3); ctx.lineTo(r * 0.95, k * r * 0.3); ctx.stroke(); }
    ctx.restore();
  };

  // upper arms, forearms, hands and the tools: in front of the instrument
  st.front = (ctx, F, rt) => {
    const G = st.geo;
    if (!G) return;
    const { A } = G;
    ctx.save();
    ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
    hs.forEach((hh, k) => {
      if (!hh.wrist) return;
      const s = hh.shoulder, e = hh.elbow, w = hh.wrist, tool = toolOf(k);
      const person_ = cfg.twin ? st.people[Math.min(k, st.people.length - 1)] : st.people[0];
      const sleeveCol = person_.shirt, armSkin = person_.skin;
      const fw = G.armL * 0.125, aw = G.armL * 0.16, cuff = cfg.sleeve === 'long';
      capsule(ctx, s.x, s.y, e.x, e.y, aw, sleeveCol);
      ctx.fillStyle = sleeveCol; circ(ctx, s.x, s.y, aw * 0.62); ctx.fill();
      capsule(ctx, e.x, e.y, w.x, w.y, fw, cuff ? sleeveCol : armSkin);
      { // a trimmed cuff at the wrist and a seam over the shoulder
        const dx = w.x - e.x, dy = w.y - e.y, Ld = Math.hypot(dx, dy) || 1, ux = dx / Ld, uy = dy / Ld;
        if (cuff || cfg.cuff) { ctx.save(); ctx.lineCap = 'butt'; ctx.strokeStyle = person_.trim ?? '#e3b778'; ctx.lineWidth = fw * 0.22; ctx.beginPath(); ctx.moveTo(w.x - ux * fw * 0.5 - uy * fw * 0.45, w.y - uy * fw * 0.5 + ux * fw * 0.45); ctx.lineTo(w.x - ux * fw * 0.5 + uy * fw * 0.45, w.y - uy * fw * 0.5 - ux * fw * 0.45); ctx.stroke(); ctx.restore(); }
      }
      if (!cuff) {
        const dx = w.x - e.x, dy = w.y - e.y, Ld = Math.hypot(dx, dy) || 1;
        capsule(ctx, e.x - (dx / Ld) * 4, e.y - (dy / Ld) * 4, e.x + (dx / Ld) * Ld * 0.22, e.y + (dy / Ld) * Ld * 0.22, fw * 1.12, sleeveCol, false);
      }
      const ang = Math.atan2(hh.y - s.y, hh.x - s.x);
      if (tool === 'stick') {
        ctx.save(); ctx.lineCap = 'round';
        const w2 = L.toolW, x0 = w.x, y0 = w.y, x1 = hh.x, y1 = hh.y;
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = w2; ctx.beginPath(); ctx.moveTo(x0 + 5, y0 + 8); ctx.lineTo(x1 + 5, y1 + 8); ctx.stroke();
        ctx.strokeStyle = darker(cfg.wood ?? '#e6c58e', 0.35); ctx.lineWidth = w2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.strokeStyle = cfg.wood ?? '#e6c58e'; ctx.lineWidth = w2 * 0.6; ctx.beginPath(); ctx.moveTo(x0 - 1, y0 - 1); ctx.lineTo(x1 - 1, y1 - 1); ctx.stroke();
        ctx.strokeStyle = lighter(cfg.wood ?? '#e6c58e', 0.55); ctx.lineWidth = w2 * 0.2; ctx.beginPath(); ctx.moveTo(x0 - 2, y0 - 2); ctx.lineTo(x1 - 2, y1 - 2); ctx.stroke();
        const hr = w2 * (cfg.headR ?? 1.0), hc = cfg.head ?? '#c9955a';
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; circ(ctx, x1 + 4, y1 + 7, hr); ctx.fill();
        ctx.fillStyle = rgrad(ctx, x1, y1, 0, hr * 1.1, [[0, lighter(hc, 0.5)], [0.6, hc], [1, darker(hc, 0.45)]], x1 - hr * 0.35, y1 - hr * 0.35); circ(ctx, x1, y1, hr); ctx.fill();
        ctx.restore();
        drawFist(ctx, w.x, w.y, fw * 0.62, ang, armSkin);
      } else if (tool === 'pestle') {
        const d = cfg.pestleDir(k), len = G.plen, wood = cfg.wood ?? '#a8742f', pw = (cfg.pestleW ?? 34) * (G.F.scale ?? 1);
        const ex = hh.x + d.x * len, ey = hh.y + d.y * len;
        ctx.save(); ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = pw; ctx.beginPath(); ctx.moveTo(hh.x + 9, hh.y + 12); ctx.lineTo(ex + 9, ey + 12); ctx.stroke();
        ctx.strokeStyle = darker(wood, 0.45); ctx.lineWidth = pw; ctx.beginPath(); ctx.moveTo(hh.x, hh.y); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.strokeStyle = wood; ctx.lineWidth = pw * 0.66; ctx.beginPath(); ctx.moveTo(hh.x - 2, hh.y - 2); ctx.lineTo(ex - 2, ey - 2); ctx.stroke();
        ctx.strokeStyle = lighter(wood, 0.5); ctx.lineWidth = pw * 0.2; ctx.beginPath(); ctx.moveTo(hh.x - 5, hh.y - 4); ctx.lineTo(ex - 5, ey - 4); ctx.stroke();
        // the thick pounding end
        const hr = pw * 0.88;
        ctx.fillStyle = rgrad(ctx, hh.x, hh.y, 0, hr * 1.2, [[0, lighter(wood, 0.4)], [0.6, wood], [1, darker(wood, 0.55)]], hh.x - hr * 0.3, hh.y - hr * 0.3); circ(ctx, hh.x, hh.y, hr); ctx.fill();
        ctx.restore();
        drawFist(ctx, w.x, w.y, fw * 0.7, Math.atan2(d.y, d.x), armSkin);
        drawFist(ctx, w.x + d.x * G.plen * 0.14, w.y + d.y * G.plen * 0.14, fw * 0.62, Math.atan2(d.y, d.x), armSkin);
      } else if (tool === 'palm') {
        hand(ctx, hh.x, hh.y, fw * 2.1, ang + Math.PI / 2, 1, armSkin);
      } else if (tool === 'thumb') {
        ctx.save(); ctx.translate(hh.x, hh.y); ctx.rotate(ang + Math.PI / 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, 4, 8, fw * 0.5, fw * 0.8); ctx.fill();
        ctx.fillStyle = rgrad(ctx, 0, 0, 1, fw, [[0, lighter(armSkin, 0.35)], [0.7, armSkin], [1, darker(armSkin, 0.4)]], -fw * 0.15, -fw * 0.2); ell(ctx, 0, 0, fw * 0.5, fw * 0.85); ctx.fill();
        ctx.fillStyle = rgba('#ffffff', 0.4); ell(ctx, -fw * 0.1, -fw * 0.2, fw * 0.14, fw * 0.3); ctx.fill();
        ctx.restore();
      } else {
        drawFist(ctx, hh.x, hh.y, fw * 0.7, ang, armSkin);
      }
    });
    ctx.restore();
    void F; void rt;
  };
  st.cfg = cfg;
  return st;
}

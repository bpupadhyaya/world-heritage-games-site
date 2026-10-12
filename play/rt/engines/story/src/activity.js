// Story and performance activity (docs/ENGINE-CONTRACT.md "Activity engines").
// A short branching story told on a drawn stage (shadow screen, marionette theatre, glove booth, water pond, mask stage,
// caravan map, verse page). The player's choices move meters (wit, goodwill, wealth ...) and gather wisdom points; the
// scene graph ends in an ending that sets 0-3 stars. All art is drawn from primitives; all text comes from params.
import { drawFigure, drawBackdrop, drawCurtains } from './figures.js';

export const STAGES = ['shadow', 'marionette', 'glove', 'water', 'mask', 'caravan', 'verse'];
export const SLOTS = { left: 0.2, midleft: 0.36, center: 0.5, midright: 0.64, right: 0.8 };
export const DEFAULTS = {
  stage: 'marionette',
  start: 'start',
  cast: {},
  meters: [{ id: 'wit', label: 'Wit', start: 0, max: 5 }],
  scenes: { start: { text: 'The story begins.', end: true } },
  endings: [{ id: 'done', stars: 1, headline: 'The end', text: 'The tale is told.' }],
  route: [],
  look: {},
  speed: 90,
};

const STAGE_LOOK = {
  shadow: { wall: '#0d0705', screen: '#f7e2a8', screenEdge: '#d89a3c', lamp: '#fff2c0', frame: '#4a2c14', curtain: '#6b1d1d' },
  marionette: { wall: '#2b3d58', floor: '#7a5230', curtain: '#9c2a2a', frame: '#4a2c14', far: '#1d2a40', near: '#35507a', glow: '#f5d27a' },
  glove: { wall: '#3d5a52', floor: '#7a5230', curtain: '#c0442e', frame: '#5a3a1c', far: '#27403a', near: '#4a7068', glow: '#f5d27a' },
  water: { wall: '#7a2a1c', floor: '#2a6f86', curtain: '#b3261e', frame: '#4a2c14', far: '#5a1d12', near: '#a04a2c', glow: '#f5d27a' },
  mask: { wall: '#493a5c', floor: '#8a6038', curtain: '#7a2230', frame: '#4a2c14', far: '#2e2440', near: '#5e4a78', glow: '#f5d27a' },
  caravan: { wall: '#e8d6a8', floor: '#c9a35e', curtain: '#b3261e', frame: '#5a3a1c', far: '#a67c3a', near: '#c9a35e', glow: '#fff1b8', ink: '#4a3420' },
  verse: { wall: '#f1e6c8', floor: '#f1e6c8', curtain: '#5a3a1c', frame: '#8a6a3a', far: '#d8c79a', near: '#e6d6a8', glow: '#c9a35e', ink: '#3a2a18' },
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function createActivity(userParams, env) {
  const P = { ...DEFAULTS, ...userParams };
  P.look = { ...STAGE_LOOK[P.stage] ?? STAGE_LOOK.marionette, ...(P.look ?? {}) };
  const { palette: pal, audio } = env;
  const scenes = P.scenes;
  const meterDefs = P.meters;
  const tone = (o) => { try { audio?.tone(o); } catch { /* sound is optional */ } };

  // ---- story graph helpers -------------------------------------------------------------------------------------
  const optionsOf = (scene) => {
    if (!scene) return [];
    if (scene.puzzle) {
      const pz = scene.puzzle, right = pz.right ?? {}, wrong = pz.wrong ?? {};
      return pz.options.map((text, i) => {
        const ok = i === pz.answer, src = ok ? right : wrong;
        return { text, pts: ok ? (right.pts ?? 2) : (wrong.pts ?? 0), effects: src.effects, set: src.set, next: src.next ?? right.next, correct: ok, verse: pz.addVerse ? text : undefined };
      });
    }
    if (scene.choices?.length) return scene.choices;
    if (scene.next) return [{ text: scene.cont ?? 'Continue', next: scene.next, pts: 0 }];
    return [];
  };
  const isEnd = (id) => !scenes[id] || scenes[id].end === true || optionsOf(scenes[id]).length === 0;
  const maxPts = (() => {
    const memo = new Map();
    const go = (id, stack) => {
      if (isEnd(id)) return 0;
      if (memo.has(id)) return memo.get(id);
      if (stack.has(id)) return 0;
      stack.add(id);
      let best = 0;
      for (const o of optionsOf(scenes[id])) best = Math.max(best, (o.pts ?? 0) + go(o.next, stack));
      stack.delete(id); memo.set(id, best); return best;
    };
    return go(P.start, new Set());
  })();

  const meetsWhen = (w, S) => {
    if (!w) return true;
    for (const [m, v] of Object.entries(w.min ?? {})) if ((S.meters[m] ?? 0) < v) return false;
    for (const [m, v] of Object.entries(w.max ?? {})) if ((S.meters[m] ?? 0) > v) return false;
    for (const f of w.flags ?? []) if (!S.flags.includes(f)) return false;
    for (const f of w.notFlags ?? []) if (S.flags.includes(f)) return false;
    if (w.pts != null && S.pts < w.pts) return false;
    return true;
  };

  // ---- state -----------------------------------------------------------------------------------------------------
  let S;       // story state
  let V;       // view state (animation only; still deterministic from dt)
  let layout = null;
  let done = null;
  let tip = '';

  const enable = (o) => {
    const need = o.requires ?? {};
    for (const [m, v] of Object.entries(need)) if ((S.meters[m] ?? 0) < v) return false;
    for (const f of o.needFlags ?? []) if (!S.flags.includes(f)) return false;
    return true;
  };
  const currentOptions = () => {
    const sc = scenes[S.scene];
    let opts = optionsOf(sc);
    if (isEnd(S.scene)) opts = [{ text: 'Take a bow', end: true, pts: 0 }];
    const en = opts.map(enable);
    const any = en.some(Boolean);
    return opts.map((o, i) => ({ ...o, enabled: any ? en[i] : true }));
  };

  const enterScene = (id) => {
    S.scene = id;
    const sc = scenes[id];
    V.revealT = 0; V.scroll = 0; V.hover = -1; V.wait = 0;
    if (sc?.verse) S.poem.push(sc.verse);
    if (sc?.stop != null) S.stop = sc.stop;
    const on = new Set((sc?.on ?? []).map((e) => e.who));
    for (const e of sc?.on ?? []) {
      const tx = SLOTS[e.at] ?? SLOTS.center;
      if (!V.figs[e.who]) V.figs[e.who] = { x: tx < 0.5 ? -0.12 : 1.12, alpha: 1 };
      Object.assign(V.figs[e.who], { target: tx, pose: e.pose ?? 'idle', face: e.face, out: false });
    }
    for (const [who, f] of Object.entries(V.figs)) if (!on.has(who)) { f.out = true; f.target = f.x < 0.5 ? -0.15 : 1.15; }
    if (isEnd(id)) {
      S.ending = P.endings.find((e) => meetsWhen(e.when, S)) ?? P.endings[P.endings.length - 1];
      tone({ freq: 330, to: 660, dur: 0.3, type: 'triangle', vol: 0.5 });
    } else tone({ freq: P.stage === 'shadow' ? 196 : 523, to: P.stage === 'shadow' ? 160 : 392, dur: 0.12, type: P.stage === 'shadow' ? 'triangle' : 'square', vol: 0.25 });
  };

  const init = () => {
    S = { scene: P.start, meters: {}, flags: [], pts: 0, poem: [], stop: 0, steps: 0, ending: null, log: [] };
    for (const m of meterDefs) S.meters[m.id] = m.start ?? 0;
    V = { t: 0, revealT: 0, scroll: 0, hover: -1, wait: 0, figs: {}, flash: [], down: null, ready: false };
    done = null; tip = '';
    enterScene(P.start);
  };
  init();

  const apply = (o) => {
    for (const [m, d] of Object.entries(o.effects ?? {})) {
      const def = meterDefs.find((x) => x.id === m);
      if (!def) continue;
      const before = S.meters[m];
      S.meters[m] = clamp(before + d, 0, def.max ?? 99);
      const real = S.meters[m] - before;
      if (real) {
        V.flash.push({ m, d: real, age: 0 });
        tone({ freq: real > 0 ? 600 : 220, to: real > 0 ? 900 : 160, dur: 0.14, type: 'triangle', vol: 0.3 });
      }
    }
    for (const f of o.set ?? []) if (!S.flags.includes(f)) S.flags.push(f);
    for (const f of o.clear ?? []) S.flags = S.flags.filter((x) => x !== f);
    S.pts += o.pts ?? 0;
  };

  const choose = (i) => {
    if (done) return;
    const opts = currentOptions();
    const o = opts[i];
    if (!o) return;
    if (!o.enabled) { tip = 'You cannot do that yet.'; return; }
    tip = '';
    if (o.end) {
      const e = S.ending ?? P.endings[P.endings.length - 1];
      done = { score: S.pts, max: Math.max(maxPts, S.pts), stars: clamp(e.stars ?? 0, 0, 3), headline: e.headline ?? 'The end', detail: `${S.pts} of ${Math.max(maxPts, S.pts)} wise points` };
      return;
    }
    S.steps++;
    S.log.push(o.text);
    apply(o);
    if (o.verse) S.poem.push(o.verse);
    tone({ freq: 440, dur: 0.05, type: 'triangle', vol: 0.3 });
    enterScene(o.next);
  };

  // ---- time ------------------------------------------------------------------------------------------------------
  const tick = (dt) => {
    V.t += dt; V.revealT += dt;
    for (const f of Object.values(V.figs)) {
      const d = f.target - f.x, step = 1.1 * dt;
      f.x = Math.abs(d) <= step ? f.target : f.x + Math.sign(d) * step;
      if (f.out) f.alpha = clamp(f.alpha - dt * 1.4, 0, 1);
      else f.alpha = clamp((f.alpha ?? 1) + dt * 2, 0, 1);
    }
    for (const fl of V.flash) fl.age += dt;
    V.flash = V.flash.filter((fl) => fl.age < 1.4);
  };

  // ---- text blocks -----------------------------------------------------------------------------------------------
  const sceneBody = () => {
    const sc = scenes[S.scene] ?? {};
    if (isEnd(S.scene)) {
      const e = S.ending ?? {};
      return { name: e.headline ?? 'The end', text: [sc.text, e.text].filter(Boolean).join(' '), prompt: '', ending: true };
    }
    return { name: sc.speaker && P.cast[sc.speaker] ? P.cast[sc.speaker].name : '', text: sc.text ?? '', prompt: sc.puzzle?.prompt ?? '' };
  };
  const totalChars = () => { const b = sceneBody(); return b.text.length + b.prompt.length; };
  const revealed = () => V.revealT * P.speed >= totalChars();

  // ---- layout + drawing ------------------------------------------------------------------------------------------
  const figSlotX = (R, f) => R.x + R.w * f.x;

  function drawFigures(g, R, floorY, H, o) {
    const { ctx } = g;
    const sc = scenes[S.scene] ?? {};
    const order = Object.entries(V.figs).filter(([, f]) => f.alpha > 0.01).sort((a, b) => a[1].x - b[1].x);
    for (const [who, f] of order) {
      const c = P.cast[who];
      if (!c) continue;
      const speaking = sc.speaker === who && !isEnd(S.scene) && !f.out;
      const flip = f.face ? f.face === 'left' : f.target > 0.56 || (f.out && f.x > 0.5 && f.target > 0.5);
      const base = floorY + (o.sink ?? 0);
      drawFigure(ctx, c, figSlotX(R, f), base, H, {
        style: o.style, cut: o.cut, t: V.t, pose: f.pose, speaking: speaking && V.revealT * P.speed < totalChars() + 8, flip,
        strings: o.stringsY != null ? o.stringsY - base : null,
        rods: o.rodsY != null ? o.rodsY - base : null,
        alpha: (f.alpha ?? 1) * (o.alpha ?? 1),
      });
    }
  }

  function drawWood(ctx, R, col, y0) {
    ctx.fillStyle = col; ctx.fillRect(R.x, y0, R.w, R.y + R.h - y0);
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 2;
    const n = 5;
    for (let i = 1; i < n; i++) { const y = y0 + ((R.y + R.h - y0) * i) / n; ctx.beginPath(); ctx.moveTo(R.x, y); ctx.lineTo(R.x + R.w, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(R.x, y0, R.w, 3);
  }

  function drawMap(g, M) {
    const { ctx } = g;
    const L = P.look;
    const grd = ctx.createLinearGradient(M.x, M.y, M.x, M.y + M.h);
    grd.addColorStop(0, '#f0deb0'); grd.addColorStop(1, '#d9bd7e');
    ctx.fillStyle = grd; g.rr(ctx, M.x, M.y, M.w, M.h, 10); ctx.fill();
    ctx.strokeStyle = L.frame; ctx.lineWidth = 3; ctx.stroke();
    // soft land shapes for texture
    ctx.fillStyle = 'rgba(160,120,60,0.18)';
    ctx.beginPath(); ctx.ellipse(M.x + M.w * 0.25, M.y + M.h * 0.7, M.w * 0.22, M.h * 0.2, 0.2, 0, Math.PI * 2); ctx.ellipse(M.x + M.w * 0.72, M.y + M.h * 0.35, M.w * 0.2, M.h * 0.22, -0.3, 0, Math.PI * 2); ctx.fill();
    const r = P.route;
    if (!r.length) return;
    const pt = (i) => ({ x: M.x + M.w * (0.08 + 0.84 * r[i].x), y: M.y + M.h * (0.12 + 0.76 * r[i].y) });
    const cur = clamp(S.stop, 0, r.length - 1);
    const path = (from, to) => {
      ctx.beginPath(); const a = pt(from); ctx.moveTo(a.x, a.y);
      for (let i = from + 1; i <= to; i++) { const p0 = pt(i - 1), p1 = pt(i); ctx.quadraticCurveTo((p0.x + p1.x) / 2, p0.y, p1.x, p1.y); }
    };
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(90,60,30,0.55)'; ctx.lineWidth = 3; ctx.setLineDash([2, 9]);
    if (cur < r.length - 1) { path(cur, r.length - 1); ctx.stroke(); }
    ctx.setLineDash([]); ctx.strokeStyle = '#a2321e'; ctx.lineWidth = 4;
    if (cur > 0) { path(0, cur); ctx.stroke(); }
    r.forEach((w, i) => {
      const p = pt(i);
      ctx.fillStyle = i <= cur ? '#a2321e' : '#6b5330'; ctx.beginPath(); ctx.arc(p.x, p.y, i === cur ? 7 : 5, 0, Math.PI * 2); ctx.fill();
      const above = i % 2 === 0;
      g.label(ctx, w.name, clamp(p.x, M.x + 40, M.x + M.w - 40), p.y + (above ? -16 : 18), g.px(15), '#3a2a18', 'center', '600');
    });
    const p = pt(cur);
    const bob = Math.sin(V.t * 3) * 2;
    ctx.strokeStyle = pal.accent; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, 13 + bob, 0, Math.PI * 2); ctx.stroke();
  }

  function drawStage(g, S0) {
    const { ctx } = g;
    const L = P.look, t = V.t;
    const sc = scenes[S.scene] ?? {};
    const bg = sc.bg ?? 'stage';
    ctx.save(); ctx.beginPath(); ctx.rect(S0.x, S0.y, S0.w, S0.h); ctx.clip();
    ctx.fillStyle = L.wall ?? '#222'; ctx.fillRect(S0.x, S0.y, S0.w, S0.h);
    const kind = P.stage;
    if (kind === 'shadow') {
      const inset = S0.w * 0.04;
      const I = { x: S0.x + inset, y: S0.y + inset * 0.8, w: S0.w - inset * 2, h: S0.h - inset * 1.6 };
      const flick = 0.92 + 0.08 * Math.sin(t * 9) * Math.sin(t * 3.7);
      const rg = ctx.createRadialGradient(I.x + I.w / 2, I.y + I.h * 0.35, I.h * 0.05, I.x + I.w / 2, I.y + I.h * 0.5, Math.max(I.w, I.h) * 0.75 * flick);
      rg.addColorStop(0, L.lamp); rg.addColorStop(0.55, L.screen); rg.addColorStop(1, L.screenEdge);
      ctx.fillStyle = rg; ctx.fillRect(I.x, I.y, I.w, I.h);
      const floorY = I.y + I.h * 0.9;
      drawBackdrop(ctx, bg, I, floorY, { far: 'rgba(40,20,8,0.7)', near: 'rgba(40,20,8,0.5)', glow: L.lamp }, t);
      ctx.fillStyle = 'rgba(30,14,6,0.8)'; ctx.fillRect(I.x, floorY, I.w, 4);
      drawFigures(g, I, floorY, I.h * 0.55, { style: 'shadow', cut: L.lamp, rodsY: I.y + I.h });
      ctx.fillStyle = 'rgba(60,30,10,0.35)'; ctx.fillRect(I.x, floorY + 4, I.w, I.y + I.h - floorY - 4);
      ctx.strokeStyle = L.frame; ctx.lineWidth = inset; ctx.strokeRect(I.x - inset / 2, I.y - inset * 0.4, I.w + inset, I.h + inset * 0.8);
    } else if (kind === 'marionette' || kind === 'mask' || kind === 'glove' || kind === 'water') {
      const floorY = S0.y + S0.h * (kind === 'glove' ? 0.8 : 0.86);
      const I = { x: S0.x, y: S0.y, w: S0.w, h: S0.h };
      const g2 = ctx.createLinearGradient(0, S0.y, 0, floorY); g2.addColorStop(0, L.wall); g2.addColorStop(1, L.near);
      ctx.fillStyle = g2; ctx.fillRect(S0.x, S0.y, S0.w, floorY - S0.y);
      drawBackdrop(ctx, bg, I, floorY, { far: L.far, near: L.near, glow: L.glow }, t);
      if (kind === 'water') {
        const wg = ctx.createLinearGradient(0, floorY - S0.h * 0.1, 0, S0.y + S0.h); wg.addColorStop(0, '#3d93ab'); wg.addColorStop(1, L.floor);
        ctx.fillStyle = wg; ctx.fillRect(S0.x, floorY - S0.h * 0.1, S0.w, S0.h);
        drawFigures(g, I, floorY, S0.h * 0.5, { style: 'color', sink: 0 });
        ctx.fillStyle = 'rgba(40,130,160,0.55)'; ctx.fillRect(S0.x, floorY, S0.w, S0.h);
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
        for (let r = 0; r < 5; r++) for (let i = 0; i < 4; i++) { const px = S0.x + S0.w * (((i * 0.27 + r * 0.13 + t * 0.02) % 1)); const py = floorY + S0.h * (0.02 + r * 0.025); ctx.beginPath(); ctx.ellipse(px, py, 14 + r * 3, 3, 0, 0, Math.PI * 2); ctx.stroke(); }
        for (const f of Object.values(V.figs)) { if (f.alpha < 0.05) continue; const px = figSlotX(I, f); const rr0 = 8 + 4 * Math.sin(t * 2 + px); ctx.beginPath(); ctx.ellipse(px, floorY + 6, 26 + rr0, 6, 0, 0, Math.PI * 2); ctx.stroke(); }
      } else {
        drawWood(ctx, I, L.floor, floorY);
        if (kind === 'glove') {
          drawFigures(g, I, floorY + S0.h * 0.22, S0.h * 0.7, { style: 'color' });
          ctx.fillStyle = L.frame; ctx.fillRect(S0.x, floorY, S0.w, S0.h * 0.22);
          ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(S0.x, floorY, S0.w, 4);
        } else {
          const topY = S0.y + S0.h * 0.12;
          drawFigures(g, I, floorY, S0.h * 0.52, { style: 'color', stringsY: kind === 'marionette' ? topY : null });
        }
      }
      drawCurtains(ctx, { x: S0.x, y: S0.y, w: S0.w, h: floorY - S0.y + (kind === 'water' ? S0.h * 0.1 : 0) }, L.curtain, t);
      if (kind === 'glove') {
        ctx.fillStyle = L.curtain; for (let i = 0; i < 12; i++) { if (i % 2) continue; ctx.fillRect(S0.x + (S0.w * i) / 12, S0.y, S0.w / 12, S0.h * 0.1); }
      }
    } else if (kind === 'caravan') {
      const M = { x: S0.x + 8, y: S0.y + 8, w: S0.w - 16, h: S0.h * 0.56 };
      drawMap(g, M);
      const V0 = { x: S0.x, y: M.y + M.h + 6, w: S0.w, h: S0.y + S0.h - (M.y + M.h + 6) };
      const floorY = V0.y + V0.h * 0.9;
      const sky = ctx.createLinearGradient(0, V0.y, 0, floorY); sky.addColorStop(0, '#f6d89a'); sky.addColorStop(1, '#f0b86a');
      ctx.fillStyle = sky; ctx.fillRect(V0.x, V0.y, V0.w, V0.h);
      drawBackdrop(ctx, bg, V0, floorY, { far: '#b27a3c', near: '#c9954c', glow: '#fff1b8' }, t);
      ctx.fillStyle = '#c9a35e'; ctx.fillRect(V0.x, floorY, V0.w, V0.y + V0.h - floorY);
      drawFigures(g, V0, floorY, V0.h * 0.78, { style: 'color' });
    } else {
      // verse: an ivory page with a decorated border and the verse so far
      const pg = ctx.createLinearGradient(0, S0.y, 0, S0.y + S0.h); pg.addColorStop(0, '#f6edd2'); pg.addColorStop(1, '#e6d6a8');
      ctx.fillStyle = pg; ctx.fillRect(S0.x, S0.y, S0.w, S0.h);
      ctx.strokeStyle = L.frame; ctx.lineWidth = 4; ctx.strokeRect(S0.x + 8, S0.y + 8, S0.w - 16, S0.h - 16);
      ctx.lineWidth = 1.5; ctx.strokeRect(S0.x + 15, S0.y + 15, S0.w - 30, S0.h - 30);
      ctx.fillStyle = L.glow; for (const [cx, cy] of [[S0.x + 12, S0.y + 12], [S0.x + S0.w - 12, S0.y + 12], [S0.x + 12, S0.y + S0.h - 12], [S0.x + S0.w - 12, S0.y + S0.h - 12]]) { ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fill(); }
      const baseY = S0.y + S0.h * 0.36;
      const I = { x: S0.x, y: S0.y, w: S0.w, h: S0.h };
      drawFigures(g, I, baseY, S0.h * 0.34, { style: 'color' });
      const lines = S.poem.slice(-4);
      const size = g.px(S0.h > 200 ? 21 : 17);
      let y = baseY + size * 1.6;
      ctx.strokeStyle = L.glow; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(S0.x + S0.w * 0.2, y - size * 0.9); ctx.lineTo(S0.x + S0.w * 0.8, y - size * 0.9); ctx.stroke();
      lines.forEach((ln, i) => {
        const wrapped = g.wrap(ctx, ln, S0.w - 60, size);
        wrapped.forEach((w) => { g.label(ctx, w, S0.x + S0.w / 2, y, size, i === lines.length - 1 ? '#7a1f14' : L.ink, 'center', i === lines.length - 1 ? '700' : '500'); y += size * 1.3; });
        y += size * 0.2;
      });
    }
    ctx.restore();
  }

  function render(g, area) {
    const { ctx } = g;
    const px = g.px;
    const landscape = area.w > area.h * 1.2;
    const gap = 8;
    const body = sceneBody();
    const opts = currentOptions();
    const stageRect = {}, lowerRect = {};
    let metersRect;
    if (landscape) {
      const lw = Math.floor(area.w * 0.54);
      metersRect = { x: area.x, y: area.y + area.h - px(34), w: lw, h: px(32) };
      Object.assign(stageRect, { x: area.x, y: area.y, w: lw, h: area.h - px(34) - gap });
      Object.assign(lowerRect, { x: area.x + lw + gap, y: area.y, w: area.w - lw - gap, h: area.h });
    }
    const tw = (landscape ? lowerRect.w : area.w) - 28;
    const fs = px(23), os = px(20);
    const lines = g.wrap(ctx, body.text, tw, fs);
    const plines = body.prompt ? g.wrap(ctx, body.prompt, tw * 0.9, px(22)) : [];
    const nameH = body.name ? px(30) : 0;
    const textH = nameH + lines.length * fs * 1.32 + (plines.length ? plines.length * px(22) * 1.32 + 10 : 0) + 22;
    const optH = opts.map((o) => Math.max(px(50), g.wrap(ctx, o.text, tw - 52, os).length * os * 1.25 + px(20)));
    const optsH = optH.reduce((a, b) => a + b + gap, 0);
    const contentH = textH + gap + optsH;
    if (!landscape) {
      const metersH = px(34);
      const minStage = Math.min(area.h * 0.3, 210);
      const stageH = clamp(area.h - metersH - gap * 2 - contentH, minStage, area.h * 0.6);
      Object.assign(stageRect, { x: area.x, y: area.y, w: area.w, h: stageH });
      metersRect = { x: area.x, y: area.y + stageH + gap / 2, w: area.w, h: px(32) };
      const ly = metersRect.y + metersH + gap / 2;
      Object.assign(lowerRect, { x: area.x, y: ly, w: area.w, h: area.y + area.h - ly });
    }
    const maxScroll = Math.max(0, contentH - lowerRect.h + 4);
    V.scroll = clamp(V.scroll, 0, maxScroll);

    drawStage(g, stageRect);

    // meters strip
    const n = meterDefs.length;
    const cw = (metersRect.w - (n - 1) * 6) / Math.max(1, n);
    meterDefs.forEach((m, i) => {
      const x = metersRect.x + i * (cw + 6), v = S.meters[m.id] ?? 0, mx = m.max ?? 5;
      g.rr(ctx, x, metersRect.y, cw, metersRect.h, 10); ctx.fillStyle = pal.panel; ctx.fill();
      const lab = g.px(15);
      g.label(ctx, m.label ?? m.id, x + 10, metersRect.y + metersRect.h / 2, lab, pal.ink, 'left', '600');
      const bx = x + 10 + Math.min(cw * 0.42, (m.label ?? m.id).length * lab * 0.62 + 8), bw = x + cw - 10 - bx;
      if (bw > 20) {
        if (mx <= 8) {
          const pw = bw / mx;
          for (let k = 0; k < mx; k++) { ctx.fillStyle = k < v ? pal.accent : 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.arc(bx + pw * (k + 0.5), metersRect.y + metersRect.h / 2, Math.min(pw * 0.32, metersRect.h * 0.24), 0, Math.PI * 2); ctx.fill(); }
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(bx, metersRect.y + metersRect.h / 2 - 4, bw, 8);
          ctx.fillStyle = pal.accent; ctx.fillRect(bx, metersRect.y + metersRect.h / 2 - 4, bw * (v / mx), 8);
        }
      }
      for (const fl of V.flash) if (fl.m === m.id) g.label(ctx, `${fl.d > 0 ? '+' : ''}${fl.d}`, x + cw - 18, metersRect.y - fl.age * 14, px(20), fl.d > 0 ? pal.good : pal.bad, 'center', '800');
    });

    // lower block (text + options), scrollable
    ctx.save(); ctx.beginPath(); ctx.rect(lowerRect.x, lowerRect.y, lowerRect.w, lowerRect.h); ctx.clip();
    let y = lowerRect.y - V.scroll;
    g.rr(ctx, lowerRect.x, y, lowerRect.w, textH, 14); ctx.fillStyle = pal.panel; ctx.fill();
    let shown = Math.floor(V.revealT * P.speed);
    const tx = lowerRect.x + 14;
    let ty = y + 10;
    if (body.name) { g.label(ctx, body.name, tx, ty + nameH / 2 - 2, px(21), body.ending ? pal.accent : '#f3b95f', 'left', '800'); ty += nameH; }
    for (const ln of lines) {
      const part = ln.slice(0, Math.max(0, shown)); shown -= ln.length + 1;
      if (part) g.label(ctx, part, tx, ty + fs * 0.66, fs, pal.ink, 'left', '400');
      ty += fs * 1.32;
    }
    if (plines.length) {
      ty += 6;
      for (const ln of plines) { const part = ln.slice(0, Math.max(0, shown)); shown -= ln.length + 1; if (part) g.label(ctx, part, tx, ty + px(22) * 0.66, px(22), pal.accent, 'left', '700'); ty += px(22) * 1.32; }
    }
    y += textH + gap;
    const hits = [];
    const ready = revealed();
    opts.forEach((o, i) => {
      const h = optH[i], x = lowerRect.x, w = lowerRect.w;
      hits.push({ x, y, w, h });
      if (ready) {
        const hot = V.hover === i;
        g.rr(ctx, x, y, w, h, Math.min(16, h / 2)); ctx.globalAlpha = o.enabled ? 1 : 0.4;
        ctx.fillStyle = hot ? pal.accent : (o.end ? pal.accent : pal.panel); ctx.fill();
        ctx.strokeStyle = o.end || hot ? pal.accent : pal.dim; ctx.lineWidth = 2; ctx.stroke();
        const dark = hot || o.end;
        if (opts.length > 1) { g.label(ctx, String(i + 1), x + 24, y + h / 2, os * 1.05, dark ? '#1b1b1b' : pal.accent, 'center', '800'); }
        const wl = g.wrap(ctx, o.text, tw - 52, os);
        const startY = y + h / 2 - ((wl.length - 1) * os * 1.25) / 2;
        wl.forEach((l, k) => g.label(ctx, l, opts.length > 1 ? x + 46 : x + w / 2, startY + k * os * 1.25, os, dark ? '#1b1b1b' : pal.ink, opts.length > 1 ? 'left' : 'center', '600'));
        ctx.globalAlpha = 1;
      }
      y += h + gap;
    });
    ctx.restore();
    layout = { lowerRect, hits, textRect: { x: lowerRect.x, y: lowerRect.y - V.scroll, w: lowerRect.w, h: textH }, maxScroll };
  }

  // ---- input -----------------------------------------------------------------------------------------------------
  const tap = (x, y) => {
    if (!layout || done) return;
    const lr = layout.lowerRect;
    if (!revealed()) { V.revealT = totalChars() / P.speed + 0.01; return; }
    if (x < lr.x || x > lr.x + lr.w || y < lr.y || y > lr.y + lr.h) return;
    const i = layout.hits.findIndex((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
    if (i >= 0) choose(i);
  };

  const keyChoice = (keys) => {
    if (!keys?.pressed || done) return;
    const n = currentOptions().length;
    for (let i = 0; i < Math.min(n, 9); i++) if (keys.pressed.has(`Digit${i + 1}`) || keys.pressed.has(String(i + 1))) { if (!revealed()) V.revealT = 999; else choose(i); return; }
    if (n === 1 && (keys.pressed.has('Space') || keys.pressed.has('Enter') || keys.pressed.has(' '))) { if (!revealed()) V.revealT = 999; else choose(0); }
  };

  const scrollInput = (input) => {
    const p = input.pointer;
    if (input.wheel && layout) V.scroll = clamp(V.scroll + input.wheel.dy, 0, layout.maxScroll);
    if (p.pressed) V.down = { x: p.x, y: p.y, sy: V.scroll, moved: false };
    if (V.down && p.down && layout) {
      const dy = p.y - V.down.y;
      if (Math.abs(dy) > 12 && layout.maxScroll > 0) { V.down.moved = true; V.scroll = clamp(V.down.sy - dy, 0, layout.maxScroll); }
    }
    if (p.released && V.down) {
      if (!V.down.moved) tap(p.x, p.y);
      V.down = null;
    }
  };

  const bestOption = () => {
    const opts = currentOptions();
    let bi = 0, bp = -Infinity;
    opts.forEach((o, i) => { if (o.enabled && (o.pts ?? 0) > bp) { bp = o.pts ?? 0; bi = i; } });
    return bi;
  };

  const act = {
    init,
    point(id) {
      if (!layout) return null;
      const m = /^choice:(\d+)$/.exec(id);
      if (m) { const h = layout.hits[Number(m[1])]; return h ? { x: h.x + h.w / 2, y: h.y + h.h / 2 } : null; }
      if (id === 'text') { const r = layout.textRect; return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }
      return null;
    },
    update(dt, input) {
      if (done) return;
      tick(dt);
      keyChoice(input.keys);
      scrollInput(input);
    },
    attract(dt) {
      if (done) return;
      tick(dt);
      if (!revealed()) return;
      V.wait += dt;
      const read = 0.9 + totalChars() * 0.02;
      if (V.wait < read) return;
      const i = bestOption();
      V.hover = i;
      if (V.wait >= read + 0.7) choose(i);
    },
    render,
    status() {
      const e = isEnd(S.scene);
      return { score: S.pts, max: Math.max(maxPts, 1), label: tip || (e ? 'The tale ends' : 'Choose wisely') };
    },
    result: () => done,
    hint() {
      const opts = currentOptions();
      const i = bestOption();
      if (opts.length <= 1) return 'Tap to carry the story on.';
      const sc = scenes[S.scene] ?? {};
      if (sc.hint) return sc.hint;
      return `Think about what the story needs: option ${i + 1} looks wisest.`;
    },
    rules() {
      const lines = [`Every choice moves the meters (${meterDefs.map((m) => m.label ?? m.id).join(', ')}) and earns wisdom points.`, 'The ending you reach decides your stars: one to three.'];
      const k = { shadow: 'The tale is played as shadows on a lit screen.', marionette: 'The tale is played by puppets hung from strings.', glove: 'The tale is played by hand puppets in a booth.', water: 'The tale is played by puppets standing on a pond.', mask: 'The tale is played by masked stock characters.', caravan: 'The tale follows a journey along a map.', verse: 'The tale is a contest of verse; the lines you pick are written on the page.' }[P.stage];
      return k ? [k, ...lines] : lines;
    },
    getState: () => ({
      stage: P.stage, scene: S.scene, meters: S.meters, flags: S.flags, pts: S.pts, max: maxPts, steps: S.steps, stop: S.stop, poem: S.poem,
      ending: S.ending?.id ?? null, options: currentOptions().map((o) => ({ text: o.text, pts: o.pts ?? 0, enabled: o.enabled, next: o.next ?? null })),
      isEnd: isEnd(S.scene), revealed: revealed(), done: !!done,
    }),
    // exposed for tests and tools
    graph: { scenes, maxPts, start: P.start },
  };
  return act;
}

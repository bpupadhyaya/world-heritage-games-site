// Dice activity: shared presentation + flow for every dice-cup game. A rules module (src/games/*.js) supplies the game; this file
// supplies the table, the cup, the tumbling dice, the hand-written score sheet, the buttons, the sounds and the fluid layout.
import { createStage } from './stage.js';
import { drawTray, trayRects, tint } from './tray.js';
import { drawSheet } from './sheet.js';
import { drawDie } from './die.js';
import { drawCup } from './tray.js';
import { DICE_SOUND } from './sound.js';
import { mul, rotZ, rotX, restRotation } from './math3.js';
import { createGenerala } from './games/generala.js';
import { createCaptain } from './games/captain.js';
import { createTenThousand } from './games/tenthousand.js';
import { createMia } from './games/mia.js';

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const merge = (a, b) => { if (!isObj(a) || !isObj(b)) return b === undefined ? a : b; const o = { ...a }; for (const k of Object.keys(b)) o[k] = merge(a[k], b[k]); return o; };

export const DEFAULTS = {
  game: 'generala', dice: 5, throws: 3, level: 'normal', first: 'player', servidaWins: true,
  table: { kind: 'felt', surface: '#1c6b4b', surface2: '#2b8a62', rim: '#5a331b', rim2: '#93603a', trim: '#d6aa4e', rimW: 0.05, round: 0.07, rope: false, cloth: '#2f6fb8', seed: 3, sound: 'felt' },
  dieLook: { body: '#f3ead2', pip: '#1a1a1a', pip1: null, gloss: 0.55, round: 0.2, pipSize: 1, shadow: 0.5 },
  cup: { leather: '#7b4a26', band: '#d9ad55', stitch: '#ecd9a6' },
  paper: { paper: '#efe2bf', ink: '#26323f', line: '#a9966c', accent: '#b3402b', die: '#f1e8d0', pip: '#232323' },
};
const GAMES = { generala: createGenerala, captain: createCaptain, tenthousand: createTenThousand, mia: createMia };

export function createActivity(userParams, env) {
  const P = merge(DEFAULTS, userParams ?? {});
  const { rng, ui } = env;
  let clock = 0, auto = false;
  const matSound = P.table.sound ?? 'felt';
  const sfx = (name, a) => { try { (DICE_SOUND[name] ?? (() => {}))(env.audio, a); } catch { /* audio is optional */ } };
  const events = (type, d) => {
    if (type === 'rattle') sfx('rattle', { n: d.n });
    else if (type === 'pour') sfx('pour');
    else if (type === 'knock') sfx('knock', { vel: d.vel, mat: matSound, soft: d.soft, pan: ((d.id ?? 0) % 5 - 2) * 0.18 });
    else if (type === 'wall') sfx('rail', { vel: 0.6 });
    else if (type === 'slide') sfx('keep');
    else if (type === 'slam') sfx('cupDown');
    else if (type === 'lift') sfx('cupLift');
  };
  const stage = createStage({ rng, n: P.dice, events });
  const burstAt = (u, v, o) => { if (lay) ui.burst?.(lay.m.X(u), lay.m.Y(v), o); };
  const fxv = (kind) => {
    if (kind === 'great') { burstAt(0.5, 0.5, { n: 46, kind: 'confetti', colors: ['#f2c14e', '#e0603a', '#58c27d', '#6db3ff', '#fff3c4'], speed: 560, life: 1.6, size: 14 }); burstAt(0.5, 0.5, { n: 18, kind: 'spark', colors: ['#fff3c4', '#f2c14e'], speed: 380, life: 1, size: 12 }); }
    else if (kind === 'good') burstAt(0.5, 0.5, { n: 12, kind: 'spark', colors: ['#fff3c4', '#f2c14e'], speed: 300, life: 0.9, size: 10 });
  };
  const c = { P, env, rng, stage, now: () => clock, sfx: (n, a) => { sfx(n, a); if (n === 'great' || n === 'good') fxv(n); }, auto: () => auto, ui, pace: () => (auto ? 0.55 : 1) };
  const game = GAMES[P.game](c);
  let lay = null, pressed = null, pressT = -9;

  const init = () => { clock = 0; auto = false; game.init(); };
  init();

  // ---- layout -------------------------------------------------------------------------------------------------------------------
  const layout = (g, area) => {
    const { px } = g;
    const gap = Math.max(8, px(10));
    const bh = ui.buttonH(56);
    const portrait = area.h > area.w * 0.9;
    const nRows = game.layoutRows ? game.layoutRows() : game.sheet().rows.length + 2.3;
    let tray, sheet, ctl;
    if (portrait) {
      const minRow = Math.max(px(30), 24);
      const sheetPref = Math.max(nRows * minRow, Math.min(nRows * Math.max(px(46), 30), area.h * 0.5));
      let th = area.h - bh - 2 * gap - sheetPref;
      th = Math.max(Math.min(area.w * 0.6, area.h * 0.4), Math.min(th, area.w * 0.86));
      th = Math.min(th, area.h - bh - 2 * gap - nRows * Math.max(20, px(22)));
      tray = { x: area.x, y: area.y, w: area.w, h: th };
      ctl = { x: area.x, y: tray.y + th + gap, w: area.w, h: bh };
      sheet = { x: area.x, y: ctl.y + bh + gap, w: area.w, h: area.y + area.h - (ctl.y + bh + gap) };
    } else {
      const lw = Math.min(area.w * 0.58, (area.h - bh - gap) * 1.75);
      tray = { x: area.x, y: area.y, w: lw, h: area.h - bh - gap };
      ctl = { x: area.x, y: tray.y + tray.h + gap, w: lw, h: bh };
      sheet = { x: area.x + lw + gap * 1.5, y: area.y, w: area.w - lw - gap * 1.5, h: area.h };
    }
    const { surf } = trayRects(tray, P.table);
    const m = stage.metrics(surf);
    return { portrait, tray, ctl, sheet, surf, m, gap };
  };

  // ---- buttons ------------------------------------------------------------------------------------------------------------------
  const drawButton = (g, r, b) => {
    const { ctx } = g, pal = g.pal;
    const down = pressed === b.id && b.id && !b.off;
    const dip = down ? 2 : 0;
    const body = b.primary ? pal.accent : tint(pal.panel, 1.15, 6);
    const rad = Math.min(r.h * 0.34, 26), depth = Math.max(3, Math.min(7, r.h * 0.09)) * (down ? 0.3 : 1);
    ctx.save();
    if (b.off) ctx.globalAlpha = 0.5;
    ui.rr(ctx, r.x, r.y + depth, r.w, r.h, rad); ctx.fillStyle = b.primary ? tint(body, 0.5) : tint(pal.panel, 0.5); ctx.fill();
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = depth * 0.6;
    ui.rr(ctx, r.x, r.y + dip, r.w, r.h, rad); ctx.fillStyle = tint(body, 0.84); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    const gr = ctx.createLinearGradient(0, r.y, 0, r.y + r.h); gr.addColorStop(0, tint(body, 1.22, 8)); gr.addColorStop(1, tint(body, 0.86));
    ui.rr(ctx, r.x, r.y + dip, r.w, r.h, rad); ctx.fillStyle = gr; ctx.fill();
    ui.rr(ctx, r.x + 1.5, r.y + dip + 1.5, r.w - 3, r.h - 3, rad - 1.5); ctx.lineWidth = 2; ctx.strokeStyle = `rgba(255,255,255,${b.primary ? 0.5 : 0.2})`; ctx.stroke();
    ui.rr(ctx, r.x, r.y + dip, r.w, r.h, rad); ctx.lineWidth = 1.5; ctx.strokeStyle = b.primary ? tint(body, 0.55) : 'rgba(0,0,0,0.5)'; ctx.stroke();
    ui.gloss(ctx, r.x, r.y + dip, r.w, r.h, rad, b.primary ? 0.22 : 0.1);
    if (b.primary && !b.off && !g.reduced) {   // slow shine: invites the next action
      const ph = (g.t % 3.2) / 3.2;
      if (ph < 0.38) { const u = ph / 0.38, sx = r.x - r.h + (r.w + r.h * 2) * u; ctx.save(); ui.rr(ctx, r.x, r.y, r.w, r.h, rad); ctx.clip(); ctx.beginPath(); ctx.moveTo(sx, r.y); ctx.lineTo(sx + r.h * 0.5, r.y); ctx.lineTo(sx - r.h * 0.1, r.y + r.h); ctx.lineTo(sx - r.h * 0.6, r.y + r.h); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fill(); ctx.restore(); }
    }
    const fg = b.primary ? ui.onColor(body) : pal.ink;
    let fs = Math.min(g.px(26), r.h * 0.42);
    ctx.font = `700 ${Math.round(fs)}px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif`;
    const maxW = r.w - 24;
    const tw = ctx.measureText(b.label).width;
    if (tw > maxW) { fs *= maxW / tw; ctx.font = `700 ${Math.round(fs)}px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif`; }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (!b.primary) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillText(b.label, r.x + r.w / 2, r.y + dip + r.h / 2 + 1.5); }
    ctx.fillStyle = fg; ctx.fillText(b.label, r.x + r.w / 2, r.y + dip + r.h / 2 + 1);
    ctx.restore();
  };
  const buttonRects = (ctl) => {
    const bs = game.buttons();
    if (!bs.length) return [];
    const gap = 10;
    if (bs.length === 1) return [{ ...bs[0], x: ctl.x, y: ctl.y, w: ctl.w, h: ctl.h }];
    const w2 = ctl.w * 0.34;
    return [{ ...bs[0], x: ctl.x, y: ctl.y, w: ctl.w - w2 - gap, h: ctl.h }, { ...bs[1], x: ctl.x + ctl.w - w2, y: ctl.y, w: w2, h: ctl.h }];
  };

  // ---- drawing --------------------------------------------------------------------------------------------------------------------
  const drawBanner = (g, L) => {
    const { ctx, px } = g, b = game.banner(), m = L.m;
    const x = m.surf.x + m.surf.w * 0.04, y = m.Y(0.075);
    const fs = Math.min(px(26), m.surf.h * 0.075);
    const u = Math.min(1, b.t / 0.3);
    ctx.save(); ctx.globalAlpha = 0.55 + 0.45 * u;
    ctx.font = `800 ${Math.round(fs)}px "Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const maxW = m.surf.w * (L.portrait ? 0.6 : 0.56);
    let txt = b.text;
    while (txt.length > 4 && ctx.measureText(txt).width > maxW) txt = txt.slice(0, -2);
    if (txt !== b.text) txt += '…';
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillText(txt, x + 1.5, y + 2.2);
    ctx.fillStyle = P.table.trim || '#e6c36a'; ctx.fillText(txt, x, y);
    ctx.restore();
    const st = game.getState();
    if (st.throws != null && P.game !== 'tenthousand') {   // three pips: throws used
      const r = m.S * 0.2, cy = y + fs * 0.95;
      for (let i = 0; i < P.throws; i++) {
        ctx.beginPath(); ctx.arc(x + r + i * r * 2.7, cy, r, 0, 6.3);
        ctx.fillStyle = i < st.throws ? (P.table.trim || '#e6c36a') : 'rgba(0,0,0,0.35)'; ctx.fill();
        ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(255,240,200,0.5)'; ctx.stroke();
      }
    }
  };

  const render = (g, area) => { try { render0(g, area); } catch (e) { console.error('DICE RENDER', e && e.stack); throw e; } };
  const render0 = (g, area) => {
    const { ctx } = g;
    const L = lay = layout(g, area);
    drawTray(ctx, ui, L.tray, P.table, L.m, { n: P.dice, rack: P.game !== 'mia' });
    ctx.save(); ctx.beginPath(); ctx.rect(L.tray.x, L.tray.y, L.tray.w, L.tray.h); ctx.clip();
    drawBanner(g, L);
    if (stage.hid.phase !== 'none') { stage.drawDice(ctx, L.m, { ...P.dieLook }, {}); stage.drawCup(ctx, L.m, P.dieLook, P.cup); }
    else { stage.drawCup(ctx, L.m, P.dieLook, P.cup); stage.drawDice(ctx, L.m, { ...P.dieLook }, {}); }
    ctx.restore();
    const rects = buttonRects(L.ctl);
    L.buttons = rects;
    for (const b of rects) drawButton(g, b, b);
    const sh = game.panel ? game.panel(g, L.sheet, { now: clock }) : drawSheet(g, L.sheet, game.sheet(), { now: clock, paper: P.paper });
    L.rows = sh.hits;
  };

  // ---- input ----------------------------------------------------------------------------------------------------------------------
  const inside = (r, x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  const handlePointer = (p) => {
    if (!lay) return;
    if (p.pressed) {
      const b = lay.buttons?.find((r) => inside(r, p.x, p.y) && !r.off);
      if (b) { pressed = b.id; pressT = clock; sfx('pencil'); game.onButton(b.id); return; }
      const di = stage.hit(p.x, p.y, lay.m);
      if (di >= 0) { game.onDie(di); return; }
      const row = lay.rows?.find((r) => r.open && inside(r, p.x, p.y));
      if (row) { game.onRow(row.id); return; }
    }
    if (!p.down) pressed = null;
  };
  const update = (dt, input) => {
    clock += dt;
    stage.update(dt);
    if (!auto) handlePointer(input.pointer);
    game.update(dt);
    if (pressed && clock - pressT > 0.25) pressed = null;
  };
  const attract = (dt) => { auto = true; clock += dt; stage.update(dt); game.update(dt); };

  const titleArt = (g, rect) => {
    const { ctx } = g, T = P.table, t = g.t;
    const r = rect.r;
    ctx.save();
    // medallion: a round felt tray with a brass rim
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
    ctx.beginPath(); ctx.arc(rect.cx, rect.cy, r, 0, 6.3); ctx.fillStyle = T.rim; ctx.fill(); ctx.restore();
    ctx.save();
    const rg = ctx.createLinearGradient(rect.cx, rect.cy - r, rect.cx, rect.cy + r); rg.addColorStop(0, T.rim2); rg.addColorStop(1, tint(T.rim, 0.6));
    ctx.beginPath(); ctx.arc(rect.cx, rect.cy, r, 0, 6.3); ctx.fillStyle = rg; ctx.fill();
    ctx.beginPath(); ctx.arc(rect.cx, rect.cy, r * 0.9, 0, 6.3); ctx.lineWidth = 3; ctx.strokeStyle = T.trim; ctx.stroke();
    const sg = ctx.createRadialGradient(rect.cx, rect.cy - r * 0.2, r * 0.1, rect.cx, rect.cy, r * 0.88); sg.addColorStop(0, T.surface2); sg.addColorStop(1, T.surface);
    ctx.beginPath(); ctx.arc(rect.cx, rect.cy, r * 0.88, 0, 6.3); ctx.fillStyle = sg; ctx.fill();
    ctx.beginPath(); ctx.arc(rect.cx, rect.cy, r * 0.88, 0, 6.3); ctx.clip();
    const sh = ctx.createRadialGradient(rect.cx, rect.cy, r * 0.6, rect.cx, rect.cy, r * 0.9); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.5)'); ctx.fillStyle = sh; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    const S = r * 0.2;
    const spots = [[-0.46, 0.34, 6, 0.5], [0.0, 0.5, 3, -0.35], [0.46, 0.3, 5, 0.2]];
    ctx.save(); ctx.beginPath(); ctx.arc(rect.cx, rect.cy, r * 0.88, 0, 6.3); ctx.clip();
    const bob = Math.sin(t * 1.2) * 0.04;
    drawCup(ctx, { x: rect.cx + r * 0.1, y: rect.cy + r * 0.05, h: S * 3.2, tilt: -0.9 + bob, lift: S * 0.6, t }, P.cup);
    for (const [dx, dy] of spots) DICE_SHADOW(ctx, rect.cx + dx * r, rect.cy + dy * r + S * 0.9, S);
    spots.forEach(([dx, dy, v, yaw]) => {
      const x = rect.cx + dx * r, y = rect.cy + dy * r - S * 0.55;
      const R = mul(rotZ(yaw + Math.sin(t * 0.9 + dx * 5) * 0.1), mul(rotX(bob), restRotation(v, 0)));
      drawDie(ctx, { x, y, S, R }, P.dieLook);
    });
    ctx.restore();
  };
  const DICE_SHADOW = (ctx, x, y, S) => {
    ctx.save(); ctx.translate(x + S * 0.2, y); ctx.scale(1, 0.4);
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, S * 1.2); gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, S * 1.2, 0, 6.3); ctx.fill(); ctx.restore();
  };

  return {
    init, update, attract, render, titleArt,
    status: () => game.status(), result: () => game.result(), hint: () => game.hint(), rules: () => game.rules(),
    point: (id) => {
      if (!lay) return null;
      if (id.startsWith('die')) { const i = Number(id.slice(3)); const p = stage.diePos(i, lay.m); return { x: p.x, y: p.y }; }
      if (id.startsWith('btn:')) { const b = lay.buttons?.find((r) => r.id === id.slice(4)); return b ? { x: b.x + b.w / 2, y: b.y + b.h / 2 } : null; }
      if (id.startsWith('row:')) { const r = lay.rows?.find((q) => q.id === id.slice(4)); return r ? { x: r.x + r.w / 2, y: r.y + r.h / 2 } : null; }
      return null;
    },
    getState: () => ({ game: game.getState(), stage: stage.getState() }),
    _game: game,
  };
}

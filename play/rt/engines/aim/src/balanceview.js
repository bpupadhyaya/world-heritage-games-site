// Balance view (mode "balance"): a stack of pieces; strike one out sideways without toppling the rest (Daruma Otoshi style).
// Power comes from pulling the mallet back (drag) or a meter. A clean strike falls inside the piece's window.
// Rendering: a room with a lit floor, lacquered pieces shaded like turned wood, a painted head, a mallet that swings,
// a struck piece that flies and bounces, and dust and a little shake on every strike.
import { drawBackdrop, createFx, palFor, inferSetting, mix, dark, light, alpha, vgrad, hgrad, poly, rrect, clamp } from './scenery.js';

const TAU = Math.PI * 2;
const MAXPULL = 170;

export function createBalance(P, env, host) {
  const B = P.stack, LK = P.look;
  const setting = inferSetting(P, env.text?.title);
  const pal = palFor(setting, {});
  const fx = createFx(env);
  const tone = (o) => env.audio?.tone?.(o);
  let blocks = [], flying = [], wobble = 0, head = null, layout = null, aim = null, floats = [], sel = -1, ai = null, over = false, clock = 0;
  let swing = null, planCache = null;
  const meter = { t: 0, power: 0 };

  const reset = () => {
    blocks = Array.from({ length: B.blocks }, (_, i) => ({ c: B.colors[i % B.colors.length], y: i, vis: i }));
    head = { y: B.blocks, vis: B.blocks, fall: 0, fy: 0, fr: 0 };
    flying = []; wobble = 0; aim = null; floats = []; sel = -1; meter.t = 0; ai = null; over = false; swing = null; planCache = null; fx.reset();
  };

  // level 0 = bottom. Heavier load above needs a firmer strike.
  const windowFor = (i) => { const k = 1 + B.load * (blocks.length - 1 - i); return [B.window[0] * k, B.window[1] * k]; };

  const strike = (i, power) => {
    if (!host.canThrow() || over || i < 0 || i >= blocks.length) return;
    host.thrown();
    const [lo, hi] = windowFor(i);
    let gain = 0, note = '';
    const hitY = layout ? layout.baseY - (i + 0.5) * layout.bh : 0, hitX = layout ? layout.cx - 0.5 * layout.bw : 0;
    swing = { t: 0, level: i, power };
    if (power < lo) {
      wobble += B.weak; note = 'too soft'; tone({ freq: 160, dur: 0.1, type: 'square', vol: 0.3 });
      if (layout) { fx.dust(hitX, hitY, layout.bh * 0.15, 'rgba(230,215,180,0.6)', 3); fx.kick(2); }
    } else if (power > hi) {
      wobble += B.strong; note = 'too hard';
      const b = blocks.splice(i, 1)[0]; flying.push({ ...b, x: 0, y: 0, vx: 6, vy: -4, rot: 0 });
      if (i < blocks.length) { const n = blocks.splice(i, 1)[0]; flying.push({ ...n, x: 0, y: 0, vx: 4, vy: -3, rot: 0 }); }
      tone({ freq: 140, to: 80, dur: 0.2, type: 'sawtooth', vol: 0.4 });
      fx.sfx(0.05, { freq: 90, to: 50, dur: 0.15, type: 'sine', vol: 0.5 });
      if (layout) { fx.dust(hitX, hitY, layout.bh * 0.25, 'rgba(230,215,180,0.7)', 8); fx.shards(hitX, hitY, layout.bh * 0.1, [b.c, '#f3e2b4'], 8); fx.kick(7); }
    } else {
      const b = blocks.splice(i, 1)[0]; flying.push({ ...b, x: 0, y: 0, vx: 4 + power * 6, vy: -2.2 - power * 2, rot: 0 });
      gain = 1; note = 'clean'; wobble = wobble * 0.5 + B.settle;
      tone({ freq: 520, to: 880, dur: 0.15, type: 'triangle' });
      fx.sfx(0, { freq: 150, to: 80, dur: 0.1, type: 'sine', vol: 0.5 });   // wood on wood
      fx.sfx(0.03, { freq: 1500, dur: 0.03, type: 'square', vol: 0.1 });
      if (layout) { fx.sparks(hitX, hitY, layout.bh * 0.12); fx.dust(hitX, hitY, layout.bh * 0.15, 'rgba(255,240,200,0.6)', 4); fx.kick(4); }
    }
    blocks.forEach((b, k) => { b.y = k; });
    head.y = blocks.length;
    floats.push({ text: gain ? '+1' : note, t: 0, y: i });
    let end = false;
    if (wobble >= 1) { over = true; end = true; head.fall = 1; note = 'toppled'; floats.push({ text: 'The stack falls', t: 0, y: 2 }); tone({ freq: 200, to: 60, dur: 0.5, type: 'sawtooth' }); fx.kick(9); }
    else if (blocks.length === 0) { over = true; end = true; gain += B.headBonus; floats.push({ text: `Head home +${B.headBonus}`, t: 0, y: 1 }); fx.sfx(0.15, { freq: 880, to: 1320, dur: 0.25, type: 'triangle', vol: 0.35 }); }
    host.settle(gain, { over: end });
    planCache = null; ai = null; sel = -1;
  };

  const levelAt = (sy) => {
    const L = layout; if (!L) return -1;
    const k = Math.floor((L.baseY - sy) / L.bh);
    return k >= 0 && k < blocks.length ? k : -1;
  };

  const tick = (dt) => {
    clock += dt;
    fx.update(dt);
    if (swing) { swing.t += dt; if (swing.t > 0.5) swing = null; }
    for (const f of floats) f.t += dt;
    floats = floats.filter((f) => f.t < 1.5);
    for (const b of flying) { b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 14 * dt; b.rot += dt * 9; b.vx *= 0.995; if (b.y > 0.9 && b.vy > 0) { b.y = 0.9; b.vy = -b.vy * 0.4; b.vx *= 0.7; } }
    flying = flying.filter((b) => b.x < 16);
    for (const b of blocks) b.vis += (b.y - b.vis) * Math.min(1, dt * 14);
    head.vis += (head.y - head.vis) * Math.min(1, dt * 10);
    if (head.fall) { head.fy += dt * 6; head.fr += dt * 2; }
    wobble = Math.max(0, wobble - dt * 0.02);
    if (!host.canThrow() || over) { aim = null; return false; }
    if (P.controls === 'meter' && sel >= 0) { meter.t += dt; meter.power = 0.5 - 0.5 * Math.cos((meter.t * 2 * Math.PI) / 1.5); }
    return true;
  };

  const update = (dt, input) => {
    if (!tick(dt) || !layout) return;
    const p = input.pointer, a = layout.area;
    const inside = p.x >= a.x && p.x <= a.x + a.w && p.y >= a.y && p.y <= a.y + a.h;
    if (P.controls === 'meter') {
      if (p.pressed && inside) {
        if (sel < 0) { const l = levelAt(p.y); if (l >= 0) { sel = l; meter.t = 0; tone({ freq: 480, dur: 0.05 }); } }
        else strike(sel, meter.power);
      }
      return;
    }
    if (p.pressed && inside) aim = { ax: p.x, ay: p.y, cx: p.x, cy: p.y, level: levelAt(p.y) };
    if (aim && (p.down || p.released)) { aim.cx = p.x; aim.cy = p.y; }
    if (aim && p.released) {
      const pull = aim.ax - aim.cx;
      if (aim.level >= 0 && pull > 10) strike(aim.level, clamp((pull - 10) / (MAXPULL - 10), 0, 1));
      aim = null;
    }
  };

  const plan = () => {
    // strike the bottom piece at the middle of its window: the stack settles evenly
    const i = 0, [lo, hi] = windowFor(i);
    return { level: i, power: (lo + hi) / 2 };
  };

  const screenFor = (pl) => {
    const y = layout.baseY - (pl.level + 0.5) * layout.bh;
    const ax = layout.area.x + layout.area.w * 0.55, cx = ax - (10 + pl.power * (MAXPULL - 10));
    return { ax, ay: y, cx, cy: y };
  };

  // The computer: select the bottom piece, draw the mallet back slowly, strike at the middle of the window.
  const attract = (dt) => {
    if (!tick(dt)) { ai = null; return; }
    const pl = plan();
    if (P.controls === 'meter') {
      if (sel < 0) { if (!ai) ai = { t: 0 }; ai.t += dt; if (ai.t > 0.5) { sel = pl.level; meter.t = 0; ai = null; } }
      else if (Math.abs(meter.power - pl.power) < 0.02 && meter.t > 0.3) strike(sel, meter.power);
      return;
    }
    if (!ai) ai = { t: 0 };
    ai.t += dt;
    const k = clamp((ai.t - 0.3) / 0.8, 0, 1);
    aim = { ai: true, level: pl.level, pullFrac: pl.power * k };
    if (ai.t >= 1.2) { aim = null; ai = null; strike(pl.level, pl.power); }
  };

  // ---- drawing ---------------------------------------------------------------------------------------------------
  const render = (g, area) => {
    const { ctx } = g;
    const bar = 40;
    const bh = Math.min((area.h - bar - 80) / (B.blocks + 2.2), area.w / 6, 64), bw = Math.min(area.w * 0.42, bh * 3.2);
    const baseY = area.y + area.h - bar - 24, cx = area.x + area.w * 0.55;
    layout = { area, bh, bw, baseY, cx };
    const off = fx.offset();
    ctx.save();
    ctx.beginPath(); ctx.rect(area.x, area.y, area.w, area.h); ctx.clip();
    ctx.translate(off.x, off.y);
    // room, floor and a lamp pool of light on the mat
    const hy = area.y + (baseY - area.y) * 0.5;
    const P2 = { ...pal };
    drawBackdrop(ctx, setting === 'dojo' || setting === 'hall' ? setting : 'dojo', { x: area.x - 10, y: area.y, w: area.w + 20, h: area.h }, hy, P2, clock, 0);
    const fl = LK.lane ?? pal.ground;
    ctx.fillStyle = vgrad(ctx, hy, area.y + area.h, [[0, dark(fl, 0.3)], [0.45, fl], [1, dark(fl, 0.4)]]); ctx.fillRect(area.x - 10, hy, area.w + 20, area.y + area.h - hy);
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let j = -8; j <= 8; j++) { ctx.moveTo(cx + j * 14, hy); ctx.lineTo(cx + j * area.w * 0.22, area.y + area.h); }
    for (let i = 1; i < 6; i++) { const y = hy + (area.y + area.h - hy) * Math.pow(i / 6, 1.7); ctx.moveTo(area.x, y); ctx.lineTo(area.x + area.w, y); }
    ctx.stroke();
    const lp = ctx.createRadialGradient(cx, baseY, 4, cx, baseY, area.w * 0.5);
    lp.addColorStop(0, 'rgba(255,225,160,0.45)'); lp.addColorStop(1, 'rgba(255,225,160,0)');
    ctx.save(); ctx.translate(0, baseY); ctx.scale(1, 0.4); ctx.translate(0, -baseY); ctx.fillStyle = lp; ctx.fillRect(area.x, baseY - area.w * 0.5, area.w, area.w); ctx.restore();
    // low stand under the stack
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(cx, baseY + 14, bw * 0.95, 11, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = hgrad(ctx, cx - bw * 0.8, cx + bw * 0.8, [[0, light(LK.edge, 0.25)], [0.5, LK.edge], [1, dark(LK.edge, 0.4)]]);
    rrect(ctx, cx - bw * 0.75, baseY, bw * 1.5, 14, 5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(cx - bw * 0.7, baseY + 1, bw * 1.4, 2);

    const sway = Math.sin(clock * 9) * Math.min(1, wobble) * wobble * bw * 0.08;
    const blockY = (v) => baseY - (v + 1) * bh;
    // pieces: turned wood, lit from the upper left, with a lacquer band and a thin glint
    blocks.forEach((b, i) => {
      const y = blockY(b.vis), x = cx - bw / 2 + sway * (1 + i * 0.3);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; rrect(ctx, x + 3, y + 5, bw, bh - 2, bh * 0.3); ctx.fill();
      ctx.fillStyle = hgrad(ctx, x, x + bw, [[0, dark(b.c, 0.25)], [0.18, light(b.c, 0.3)], [0.5, b.c], [1, dark(b.c, 0.5)]]);
      rrect(ctx, x, y + 1, bw, bh - 2, bh * 0.28); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.28)'; rrect(ctx, x + bw * 0.12, y + bh * 0.16, bw * 0.76, bh * 0.14, bh * 0.07); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x + bw * 0.06, y + bh * 0.72, bw * 0.88, 2);
      if (sel === i || (aim && aim.level === i)) {
        ctx.strokeStyle = LK.guide; ctx.lineWidth = 4; rrect(ctx, x - 4, y - 2, bw + 8, bh + 2, bh * 0.32); ctx.stroke();
        ctx.strokeStyle = alpha(LK.guide, 0.35); ctx.lineWidth = 9; ctx.stroke();
      }
    });
    // the head: red face with a white mask, painted eyes, brows and moustache
    {
      const hx = cx + sway * (1 + blocks.length * 0.3) + (head.fall ? head.fy * bw * 0.6 : 0), hr = bh * 0.7;
      const hy2 = blockY(head.vis) - hr * 0.55 + (head.fall ? head.fy * head.fy * bh * 0.8 : 0);
      ctx.save(); ctx.translate(hx, hy2); ctx.rotate(head.fall ? head.fr * 2.2 : 0);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, hr * 0.95, hr * 0.9, hr * 0.18, 0, 0, TAU); ctx.fill();
      const gr = ctx.createRadialGradient(-hr * 0.35, -hr * 0.4, hr * 0.1, 0, 0, hr * 1.15);
      gr.addColorStop(0, light(LK.head, 0.35)); gr.addColorStop(0.6, LK.head); gr.addColorStop(1, dark(LK.head, 0.45));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, hr, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#f6efde'; ctx.beginPath(); ctx.ellipse(0, hr * 0.05, hr * 0.7, hr * 0.5, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = Math.max(2, hr * 0.1); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-hr * 0.5, -hr * 0.28); ctx.quadraticCurveTo(-hr * 0.28, -hr * 0.45, -hr * 0.06, -hr * 0.28); ctx.moveTo(hr * 0.5, -hr * 0.28); ctx.quadraticCurveTo(hr * 0.28, -hr * 0.45, hr * 0.06, -hr * 0.28); ctx.stroke();
      ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(-hr * 0.28, -hr * 0.1, hr * 0.1, 0, TAU); ctx.arc(hr * 0.28, -hr * 0.1, hr * 0.1, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-hr * 0.31, -hr * 0.13, hr * 0.035, 0, TAU); ctx.arc(hr * 0.25, -hr * 0.13, hr * 0.035, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = Math.max(1.5, hr * 0.07); ctx.beginPath(); ctx.moveTo(-hr * 0.32, hr * 0.2); ctx.quadraticCurveTo(0, hr * 0.38, hr * 0.32, hr * 0.2); ctx.stroke();
      ctx.restore();
      ctx.lineCap = 'butt';
    }
    // the struck pieces fly off, tumbling and bouncing, with a short motion streak
    for (const b of flying) {
      for (let k = 3; k >= 0; k--) {
        ctx.save(); ctx.globalAlpha = k === 0 ? 1 : 0.18 * (4 - k) * 0.5;
        ctx.translate(cx + (b.x - k * 0.25) * bh * 0.9, blockY(0) + bh / 2 + b.y * bh); ctx.rotate(b.rot - k * 0.2);
        ctx.fillStyle = hgrad(ctx, -bw / 2, bw / 2, [[0, light(b.c, 0.2)], [1, dark(b.c, 0.4)]]);
        rrect(ctx, -bw / 2, -bh / 2 + 1, bw, bh - 2, bh * 0.28); ctx.fill(); ctx.restore();
      }
    }
    // mallet: pulled back while aiming, swings in on the strike
    const hitLevel = swing ? swing.level : (aim && aim.level >= 0 ? aim.level : sel >= 0 ? sel : 0);
    const my = baseY - (Math.min(hitLevel, Math.max(0, B.blocks - 1)) + 0.5) * bh;
    const pullAim = aim ? (aim.ai ? aim.pullFrac : clamp((aim.ax - aim.cx - 10) / (MAXPULL - 10), 0, 1)) : sel >= 0 ? meter.power : 0;
    let pullV = pullAim;
    let swingAng = 0;
    if (swing) { const k = clamp(swing.t / 0.12, 0, 1); pullV = swing.power * (1 - k) + (-0.25) * k * (swing.t < 0.12 ? 1 : 1 - clamp((swing.t - 0.12) / 0.3, 0, 1)); swingAng = -0.5 * (1 - k); }
    const mx = cx - bw / 2 - 26 - pullV * 90;
    ctx.save(); ctx.translate(mx, my); ctx.rotate(swingAng - pullAim * 0.15);
    ctx.fillStyle = hgrad(ctx, -140, -40, [[0, light(LK.mallet, 0.2)], [1, dark(LK.mallet, 0.3)]]);
    rrect(ctx, -135, -5, 100, 10, 4); ctx.fill();
    ctx.fillStyle = vgrad(ctx, -bh * 0.3, bh * 0.3, [[0, light(LK.mallet, 0.35)], [0.5, LK.mallet], [1, dark(LK.mallet, 0.45)]]);
    rrect(ctx, -46, -bh * 0.3, 52, bh * 0.6, 8); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-40, -bh * 0.24, 40, 4);
    ctx.restore();
    // power gauge with the clean window of the chosen piece
    const lv = aim && aim.level >= 0 ? aim.level : sel;
    const gx = area.x + 16, gw = Math.min(190, area.w * 0.42), gy = area.y + 26;
    rrect(ctx, gx - 8, gy - 28, gw + 16, 52, 10); ctx.fillStyle = 'rgba(12,8,6,0.55)'; ctx.fill();
    if (lv >= 0) {
      rrect(ctx, gx, gy, gw, 16, 8); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();
      if (P.showWindow) { const [lo, hi] = windowFor(lv); rrect(ctx, gx + lo * gw, gy, (Math.min(1, hi) - lo) * gw, 16, 8); ctx.fillStyle = LK.good; ctx.fill(); }
      ctx.fillStyle = LK.guide; ctx.fillRect(gx + pullAim * gw - 2, gy - 4, 4, 24);
      g.label(ctx, 'Strike strength', gx, gy - 12, g.px(16), LK.hudText, 'left', '600');
    } else if (!over) g.label(ctx, P.controls === 'meter' ? 'Tap a piece, then tap to strike' : 'Press a piece, pull back, release', area.x + area.w / 2, area.y + 18, g.px(20), LK.hudText);
    // wobble gauge
    const wx = area.x + area.w - 54;
    rrect(ctx, wx - 26, area.y + 12, 58, 130, 10); ctx.fillStyle = 'rgba(12,8,6,0.55)'; ctx.fill();
    rrect(ctx, wx, area.y + 20, 14, 90, 7); ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill();
    const wh = 90 * Math.min(1, wobble);
    if (wh > 2) { rrect(ctx, wx, area.y + 20 + 90 - wh, 14, wh, 7); ctx.fillStyle = wobble > 0.6 ? '#e0603a' : LK.guide; ctx.fill(); }
    g.label(ctx, 'Wobble', wx + 7, area.y + 126, g.px(14), LK.hudText, 'center', '600');
    fx.draw(ctx);
    for (const f of floats) { const k = f.t / 1.5; ctx.globalAlpha = 1 - k * k; g.label(ctx, f.text, cx, baseY - (f.y + 1) * bh - f.t * 30, g.px(28 * (1 + 0.4 * Math.max(0, 1 - f.t * 6))), LK.float, 'center', '800'); ctx.globalAlpha = 1; }
    ctx.restore();
    const hy3 = area.y + area.h - bar / 2, left = host.throwsLeft();
    for (let i = 0; i < P.rounds.throws; i++) { ctx.fillStyle = i < left ? LK.guide : 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(area.x + 18 + i * 20, hy3, 7, 0, TAU); ctx.fill(); }
    void mix; void poly;
  };

  void planCache;
  return {
    reset, update, attract, render,
    busy: () => false,
    endGain: () => 0,
    point(id) {
      if (!layout) return null;
      if (id === 'tap') return { x: layout.area.x + layout.area.w / 2, y: layout.area.y + layout.area.h / 2 };
      if (id === 'anchor' || id === 'release') { const pl = plan(); const s = screenFor(pl); return id === 'anchor' ? { x: s.ax, y: s.ay } : { x: s.cx, y: s.cy }; }
      return null;
    },
    hint: () => 'Strike the bottom piece firmly but not hard: stay inside the green window, and let the stack settle.',
    state: () => ({ blocks: blocks.length, wobble: Math.round(wobble * 100) / 100, over }),
  };
}

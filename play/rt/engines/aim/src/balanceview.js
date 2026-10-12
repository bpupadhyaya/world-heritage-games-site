// Balance view (mode "balance"): a stack of pieces; strike one out sideways without toppling the rest (Daruma Otoshi style).
// Power comes from pulling the mallet back (drag) or a meter. A clean strike falls inside the piece's window.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const MAXPULL = 170;

export function createBalance(P, env, host) {
  const B = P.stack, LK = P.look;
  const tone = (o) => env.audio?.tone?.(o);
  let blocks = [], flying = [], wobble = 0, head = null, layout = null, aim = null, floats = [], sel = -1, meterT = 0, ai = null, over = false, pause = 0, clock = 0;
  const meter = { t: 0, power: 0 };

  const reset = () => {
    blocks = Array.from({ length: B.blocks }, (_, i) => ({ c: B.colors[i % B.colors.length], y: i, vis: i }));
    head = { y: B.blocks, vis: B.blocks, fall: 0 };
    flying = []; wobble = 0; aim = null; floats = []; sel = -1; meter.t = 0; ai = null; over = false; pause = 0;
  };

  // level 0 = bottom. Heavier load above needs a firmer strike.
  const windowFor = (i) => { const k = 1 + B.load * (blocks.length - 1 - i); return [B.window[0] * k, B.window[1] * k]; };

  const strike = (i, power) => {
    if (!host.canThrow() || over || i < 0 || i >= blocks.length) return;
    host.thrown();
    const [lo, hi] = windowFor(i);
    let gain = 0, note = '';
    if (power < lo) { wobble += B.weak; note = 'too soft'; tone({ freq: 160, dur: 0.1, type: 'square', vol: 0.3 }); }
    else if (power > hi) {
      wobble += B.strong; note = 'too hard';
      const b = blocks.splice(i, 1)[0]; flying.push({ ...b, x: 0, vx: 6, rot: 0 });
      if (i < blocks.length) { const n = blocks.splice(i, 1)[0]; flying.push({ ...n, x: 0, vx: 4, rot: 0 }); }
      tone({ freq: 140, to: 80, dur: 0.2, type: 'sawtooth', vol: 0.4 });
    } else {
      const b = blocks.splice(i, 1)[0]; flying.push({ ...b, x: 0, vx: 4 + power * 6, rot: 0 });
      gain = 1; note = 'clean'; wobble = wobble * 0.5 + B.settle;
      tone({ freq: 520, to: 880, dur: 0.15, type: 'triangle' });
    }
    blocks.forEach((b, k) => { b.y = k; });
    head.y = blocks.length;
    floats.push({ text: gain ? '+1' : note, t: 0, y: i });
    let end = false;
    if (wobble >= 1) { over = true; end = true; head.fall = 1; note = 'toppled'; floats.push({ text: 'The stack falls', t: 0, y: 2 }); tone({ freq: 200, to: 60, dur: 0.5, type: 'sawtooth' }); }
    else if (blocks.length === 0) { over = true; end = true; gain += B.headBonus; floats.push({ text: `Head home +${B.headBonus}`, t: 0, y: 1 }); }
    host.settle(gain, { over: end });
    planCache = null; ai = null; sel = -1;
  };
  let planCache = null;

  const levelAt = (sy) => {
    const L = layout; if (!L) return -1;
    const k = Math.floor((L.baseY - sy) / L.bh);
    return k >= 0 && k < blocks.length ? k : -1;
  };

  const tick = (dt) => {
    clock += dt;
    for (const f of floats) f.t += dt;
    floats = floats.filter((f) => f.t < 1.5);
    for (const b of flying) { b.x += b.vx * dt; b.rot += dt * 8; b.vx *= 0.995; }
    flying = flying.filter((b) => b.x < 14);
    for (const b of blocks) b.vis += (b.y - b.vis) * Math.min(1, dt * 14);
    head.vis += (head.y - head.vis) * Math.min(1, dt * 10);
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

  const render = (g, area) => {
    const { ctx } = g;
    const bar = 40;
    const bh = Math.min((area.h - bar - 80) / (B.blocks + 2.2), area.w / 6, 64), bw = Math.min(area.w * 0.42, bh * 3.2);
    const baseY = area.y + area.h - bar - 24, cx = area.x + area.w * 0.55;
    layout = { area, bh, baseY, cx };
    ctx.fillStyle = LK.surround; ctx.fillRect(area.x, area.y, area.w, area.h);
    ctx.fillStyle = LK.lane; ctx.fillRect(area.x, baseY, area.w, area.y + area.h - baseY - bar);
    ctx.fillStyle = LK.edge; ctx.fillRect(cx - bw * 0.75, baseY, bw * 1.5, 12);
    const sway = Math.sin(clock * 9) * Math.min(1, wobble) * wobble * bw * 0.08;
    const blockY = (v) => baseY - (v + 1) * bh;
    blocks.forEach((b, i) => {
      const y = blockY(b.vis), x = cx - bw / 2 + sway * (1 + i * 0.3);
      g.rr(ctx, x, y + 1, bw, bh - 2, 8); ctx.fillStyle = b.c; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x + 6, y + 6, bw - 12, 5);
      if (sel === i || (aim && aim.level === i)) { ctx.strokeStyle = LK.guide; ctx.lineWidth = 4; g.rr(ctx, x - 3, y - 1, bw + 6, bh + 2, 10); ctx.stroke(); }
    });
    // the head
    const hy = blockY(head.vis) + (head.fall ? 0 : 0), hx = cx + sway * (1 + blocks.length * 0.3), hr = bh * 0.62;
    ctx.save(); ctx.translate(hx, hy - hr * 0.6 + (head.fall ? hr * 0.2 : 0)); ctx.rotate(head.fall ? 0.9 : 0);
    ctx.fillStyle = LK.head; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, hr, 0, 6.3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-hr * 0.35, -hr * 0.1, hr * 0.2, 0, 6.3); ctx.arc(hr * 0.35, -hr * 0.1, hr * 0.2, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(-hr * 0.35, -hr * 0.1, hr * 0.08, 0, 6.3); ctx.arc(hr * 0.35, -hr * 0.1, hr * 0.08, 0, 6.3); ctx.fill();
    ctx.restore();
    for (const b of flying) {
      ctx.save(); ctx.translate(cx + b.x * bh * 0.9, blockY(b.vis) + bh / 2); ctx.rotate(b.rot);
      ctx.fillStyle = b.c; ctx.fillRect(-bw / 2, -bh / 2 + 1, bw, bh - 2); ctx.restore();
    }
    // mallet and power guide
    const my = aim && aim.level >= 0 ? baseY - (aim.level + 0.5) * bh : sel >= 0 ? baseY - (sel + 0.5) * bh : baseY - bh * 0.5;
    const pull = aim ? (aim.ai ? aim.pullFrac : clamp((aim.ax - aim.cx - 10) / (MAXPULL - 10), 0, 1)) : sel >= 0 ? meter.power : 0;
    const mx = cx - bw / 2 - 30 - pull * 90;
    ctx.fillStyle = LK.mallet; g.rr(ctx, mx - 44, my - bh * 0.28, 52, bh * 0.56, 8); ctx.fill();
    ctx.fillRect(mx - 130, my - 5, 90, 10);
    // power gauge with the clean window of the chosen piece
    const lv = aim && aim.level >= 0 ? aim.level : sel;
    if (lv >= 0) {
      const gx = area.x + 16, gw = Math.min(190, area.w * 0.42), gy = area.y + 22;
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(gx, gy, gw, 16);
      if (P.showWindow) { const [lo, hi] = windowFor(lv); ctx.fillStyle = LK.good; ctx.fillRect(gx + lo * gw, gy, (Math.min(1, hi) - lo) * gw, 16); }
      ctx.fillStyle = LK.guide; ctx.fillRect(gx + pull * gw - 2, gy - 4, 4, 24);
      g.label(ctx, 'Strike strength', gx, gy - 12, g.px(16), LK.hudText, 'left', '600');
    } else if (!over) g.label(ctx, P.controls === 'meter' ? 'Tap a piece, then tap to strike' : 'Press a piece, pull back, release', area.x + area.w / 2, area.y + 16, g.px(20), LK.hudText);
    // wobble gauge
    const wx = area.x + area.w - 34;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(wx, area.y + 20, 14, 90);
    ctx.fillStyle = wobble > 0.6 ? '#e0603a' : LK.guide; ctx.fillRect(wx, area.y + 20 + 90 * (1 - Math.min(1, wobble)), 14, 90 * Math.min(1, wobble));
    g.label(ctx, 'Wobble', wx + 7, area.y + 124, g.px(14), LK.hudText);
    for (const f of floats) { ctx.globalAlpha = 1 - f.t / 1.5; g.label(ctx, f.text, cx, baseY - (f.y + 1) * bh - f.t * 30, g.px(28), LK.float, 'center', '800'); ctx.globalAlpha = 1; }
    const hy2 = area.y + area.h - bar / 2, left = host.throwsLeft();
    for (let i = 0; i < P.rounds.throws; i++) { ctx.fillStyle = i < left ? LK.guide : 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(area.x + 18 + i * 20, hy2, 7, 0, 6.3); ctx.fill(); }
  };

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

// Mia: two dice hidden under a cup. The roller looks, announces a (possibly false) value higher than the one before, and the next player
// either calls the bluff (the cup is lifted) or takes the cup and throws, announcing something higher still. Mia (2-1) is the top.
// The loser of a challenge loses a life; first player out of lives loses.
import { drawDie } from '../die.js';
import { restRotation, mul, rotX } from '../math3.js';
import { tint, alpha } from '../tray.js';

export const LADDER = [31, 32, 41, 42, 43, 51, 52, 53, 54, 61, 62, 63, 64, 65, 11, 22, 33, 44, 55, 66, 21];
export const rankOf = (code) => LADDER.indexOf(code);
export const codeOf = (a, b) => { const hi = Math.max(a, b), lo = Math.min(a, b); return hi === lo ? hi * 11 : hi === 2 && lo === 1 ? 21 : hi * 10 + lo; };
export const nameOf = (code) => (code === 21 ? 'Mia' : code % 11 === 0 ? `Pair of ${code / 11}s` : `${Math.floor(code / 10)} - ${code % 10}`);
// probability that a fair roll is at least `rank` (the 21 outcomes are not equally likely: doubles 1/36, others 2/36)
const P_RANK = LADDER.map((code) => (code % 11 === 0 && code !== 21 ? 1 : code === 21 ? 2 : 2) / 36);
export const pAtLeast = (rank) => P_RANK.slice(rank).reduce((a, b) => a + b, 0);
const LIVES = 5;

export function createMia(c) {
  const { P, stage, rng } = c;
  const S = {};
  const isAI = (seat) => seat === 1 || c.auto();
  const mine = () => !isAI(S.seat);
  const say = (t) => { S.banner = t; S.bannerT = c.now(); S.ov = true; };
  const init = () => {
    Object.assign(S, { lives: [LIVES, LIVES], roller: P.first === 'computer' ? 1 : 0, actual: null, ann: null, annBy: null, phase: 'start', wait: 0.7, log: [], pickCode: null, banner: '', bannerT: 0, ov: false, stats: { shown: 0, caught: 0, calls: 0, opp: 0 }, loser: null });
    stage.reset();
  };
  const roll = () => {
    const a = 1 + rng.int(6), b = 1 + rng.int(6);
    S.actual = codeOf(a, b); S.vals = [a, b];
    stage.hiddenRoll([a, b]); S.phase = 'rolling';
  };
  const addLog = (t) => { S.log.push(t); if (S.log.length > 4) S.log.shift(); };
  const announce = (code) => {
    S.ann = code; S.annBy = S.roller; addLog(`${S.roller === 0 ? (c.auto() ? 'Teacher' : 'You') : 'Computer'}: ${nameOf(code)}`);
    c.sfx('pencil'); S.phase = 'decide'; S.wait = 0.9; stage.lift(false);
    if (S.roller === 0) S.stats.shown++;
    S.pickCode = null;
  };
  const legal = () => LADDER.filter((x) => S.ann == null || rankOf(x) > rankOf(S.ann));
  // ---- the challenge ------------------------------------------------------------------------------------------------------------
  const callBluff = (caller) => {
    S.caller = caller; S.phase = 'revealing'; stage.lift(true); S.wait = 1.3;
  };
  const resolve = () => {
    const caller = S.caller, liar = rankOf(S.actual) < rankOf(S.ann);
    const loser = liar ? S.annBy : caller;
    const cost = !liar && S.actual === 21 ? 2 : 1;
    S.lives[loser] = Math.max(0, S.lives[loser] - cost); S.loser = loser;
    if (S.annBy === 0) { if (liar) S.stats.caught++; }
    if (caller === 1) S.stats.calls++;
    addLog(`${liar ? 'It was a bluff' : 'It was true'}: ${nameOf(S.actual)}`);
    say(liar ? (S.annBy === 0 ? 'Caught bluffing!' : 'Computer was bluffing!') : (caller === 0 ? 'It was true: you lose a life' : 'The computer called wrongly'));
    c.sfx(loser === 0 ? 'bad' : 'good'); S.phase = 'resolved'; S.wait = 1.8;
  };
  const next = () => {
    if (S.lives[0] <= 0 || S.lives[1] <= 0) { S.phase = 'over'; return; }
    S.roller = S.loser; S.ann = null; S.annBy = null; S.actual = null; S.phase = 'start'; S.wait = 0.6; S.ov = false; stage.clearHidden();
  };
  // ---- computer -----------------------------------------------------------------------------------------------------------------
  const lv = () => P.level ?? 'normal';
  const bluffRate = () => (S.stats.caught + 1) / (S.stats.shown + 3);
  const aiAnnounce = () => {
    const actual = S.actual, opts = legal(), ra = rankOf(actual);
    const callRate = (S.stats.calls + 1) / (S.stats.opp + 3);   // how often the other side calls me
    const ok = ra > (S.ann == null ? -1 : rankOf(S.ann));
    const r = rng.next();
    if (ok) {
      // truthful, sometimes a little inflated; inflate less if the player calls a lot
      const inflate = lv() === 'easy' ? 0 : 0.12 * (1 - callRate);
      if (r < inflate && opts.length > 1) { const hi = opts.filter((x) => rankOf(x) > ra); if (hi.length) return hi[0]; }
      return actual;
    }
    if (opts.length === 0) return 21;
    // forced to lie: the smallest legal raise, or a bolder lie now and then
    const bold = lv() === 'hard' ? 0.3 : lv() === 'easy' ? 0.1 : 0.2;
    const idx = r < bold ? Math.min(opts.length - 1, 1 + Math.floor(rng.next() * 4)) : 0;
    return opts[idx];
  };
  const aiDecide = () => {
    const a = S.ann; if (a === 21) return 'call';
    const ra = rankOf(a);
    const truthful = Math.min(0.97, pAtLeast(ra) + (1 - bluffRate()) * 0.1 + (ra <= 4 ? 0.28 : 0) - (ra >= 14 ? 0.05 : 0));  // chance the claim is true
    const q = pAtLeast(ra + 1);          // chance my own throw genuinely beats it
    const uCall = 1 - 2 * truthful - (a === 21 ? 1 : 0);    // +1 if it was a lie, -1 (or worse) if true
    const uRaise = -0.35 - (1 - q) * 0.45;
    const noise = (rng.next() - 0.5) * (lv() === 'easy' ? 0.9 : lv() === 'hard' ? 0.2 : 0.5);
    return uCall + noise > uRaise ? 'call' : 'raise';
  };
  const update = (dt) => {
    if (S.phase === 'over') return;
    const busy = stage.busy();
    if (busy) return;
    if (S.phase === 'rolling') { S.phase = 'peek'; S.wait = 0.5; return; }
    if (S.phase === 'resolved') { S.wait -= dt; if (S.wait <= 0) next(); return; }
    if (S.phase === 'revealing') { S.wait -= dt; if (S.wait <= 0) resolve(); return; }
    S.wait -= dt / c.pace();
    if (S.wait > 0) return;
    if (S.phase === 'start') { roll(); return; }
    if (S.phase === 'peek') {
      if (isAI(S.roller)) { announce(aiAnnounce()); }
      else { S.phase = 'announce'; }
      return;
    }
    if (S.phase === 'decide') {
      const decider = 1 - S.roller;
      if (!isAI(decider)) return;     // the player chooses with the buttons
      if (decider === 1) S.stats.opp++;
      const d = aiDecide();
      if (d === 'call') callBluff(decider); else { S.roller = decider; S.phase = 'start'; S.wait = 0.4; stage.clearHidden(); }
    }
  };
  // ---- player ---------------------------------------------------------------------------------------------------------------------
  const onDie = () => {};
  const onRow = (id) => {
    if (S.phase !== 'announce' || !mine() || S.roller !== 0) return;
    const code = Number(id.slice(1)); if (!legal().includes(code)) return;
    if (S.pickCode === code) announce(code); else { S.pickCode = code; c.sfx('pencil'); }
  };
  const onButton = (id) => {
    if (!mine() && S.phase !== 'decide') return;
    if (id === 'look' && S.phase === 'announce') { stage.lift(!stage.revealed()); }
    else if (id === 'say' && S.phase === 'announce' && S.pickCode) announce(S.pickCode);
    else if (id === 'call' && S.phase === 'decide' && S.roller === 1) callBluff(0);
    else if (id === 'raise' && S.phase === 'decide' && S.roller === 1 && S.ann !== 21) { S.roller = 0; S.phase = 'start'; S.wait = 0.3; stage.clearHidden(); }
  };
  const buttons = () => {
    if (S.phase === 'announce' && S.roller === 0) {
      const look = { id: 'look', label: stage.revealed() ? 'Cover the cup' : 'Look under the cup' };
      return S.pickCode ? [{ id: 'say', label: `Announce ${nameOf(S.pickCode)}`, primary: true }, look] : [{ ...look, primary: true }, { id: 'wait', label: 'Choose a value', off: true }];
    }
    if (S.phase === 'decide' && S.roller === 1 && !c.auto()) {
      return [{ id: 'call', label: 'Call bluff: lift the cup', primary: true }, { id: 'raise', label: 'Throw', off: S.ann === 21 }];
    }
    return [{ id: 'wait', label: c.auto() ? 'Watch and learn' : S.phase === 'resolved' ? 'Next round' : 'Computer is playing', off: true }];
  };
  const result = () => {
    if (S.phase !== 'over') return null;
    const win = S.lives[0] > 0, left = S.lives[0], oppLeft = S.lives[1];
    return { score: win ? 50 + left * 10 : oppLeft === 0 ? 0 : 10 * (LIVES - oppLeft), max: 100, stars: win ? (left >= 4 ? 3 : 2) : oppLeft <= 1 ? 1 : 0, headline: win ? 'The computer is out of lives' : 'You are out of lives', detail: `Lives left: you ${S.lives[0]} · computer ${S.lives[1]}` };
  };
  const hint = () => {
    if (S.phase === 'announce') {
      const cur = S.actual, opts = legal();
      if (cur != null && rankOf(cur) > (S.ann == null ? -1 : rankOf(S.ann))) return `Your dice beat it: announce ${nameOf(cur)}, or bluff a little higher.`;
      return opts.length ? `Your dice are too low: you must bluff. ${nameOf(opts[0])} is the smallest lie.` : 'Announce Mia.';
    }
    if (S.phase === 'decide' && S.roller === 1) { const a = S.ann; return a === 21 ? 'Mia can only be called.' : `The chance a fair throw reaches ${nameOf(a)} is ${Math.round(pAtLeast(rankOf(a)) * 100)} percent.`; }
    return 'Look under the cup, announce a value higher than the last one; it may be a bluff.';
  };
  const banner = () => {
    if (S.ov && c.now() - S.bannerT < 2.4) return { text: S.banner, t: c.now() - S.bannerT };
    let t = c.auto() ? 'Watch and learn' : S.phase === 'announce' ? 'Look, then announce' : S.phase === 'decide' ? (S.roller === 1 ? 'Believe it or call' : 'Computer decides') : 'Mia';
    if (S.ann != null && S.phase !== 'resolved') t = `${nameOf(S.ann)} announced`;
    return { text: t, t: 9 };
  };
  const status = () => ({ score: S.lives[0], max: LIVES, frac: S.lives[0] / LIVES, label: `Lives: you ${S.lives[0]} · computer ${S.lives[1]}` });
  const rules = () => [
    'Two dice are shaken in a cup and slammed down covered. Only the thrower looks.',
    'The thrower announces a value that must be higher than the last announcement. It may be a lie.',
    'The next player either calls the bluff (the cup is lifted) or takes the cup, throws and announces something higher still.',
    'Values from the bottom: 31, 32, 41, 42, 43, 51, 52, 53, 54, 61, 62, 63, 64, 65 (higher die first), then the pairs 11 to 66, then Mia (2 and 1), the highest.',
    'If the dice are lower than the announcement the announcer loses a life; if they are as high or higher the caller loses one. Calling a true Mia costs two.',
    'Mia cannot be raised, only called. Five lives each; the first to lose them all loses.',
  ];

  // ---- the panel: lives on coasters, the log, and the ladder of values ---------------------------------------------------------
  const panel = (g, rect, o) => {
    const { ctx, ui, px } = g, now = o.now;
    const { x, y, w, h } = rect;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 7;
    ui.rr(ctx, x, y, w, h, 18); ctx.fillStyle = '#263a52'; ctx.fill(); ctx.restore();
    ctx.save(); ui.rr(ctx, x, y, w, h, 18); ctx.clip();
    const bg = ctx.createLinearGradient(x, y, x, y + h); bg.addColorStop(0, '#2f4a6a'); bg.addColorStop(1, '#1d2e45'); ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
    ui.texture(ctx, x, y, w, h, { kind: 'paper', alpha: 0.12, dark: '#000', light: '#9fc2e8' });
    // lives as beer mats
    const pad = Math.max(10, w * 0.03), cr = Math.min(h * 0.045, w * 0.032, 22);
    const rowH = Math.max(cr * 2.2, px(30));
    ['You', 'Computer'].forEach((nm, si) => {
      const yy = y + pad + si * rowH + rowH / 2;
      ctx.font = `800 ${Math.round(Math.min(px(21), rowH * 0.5))}px "Iowan Old Style",Palatino,Georgia,serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = si === 0 ? '#9fd0ff' : '#ffb4a8';
      ctx.fillText(si === 0 && c.auto() ? 'Teacher' : nm, x + pad, yy);
      for (let k = 0; k < LIVES; k++) {
        const cx = x + w - pad - cr - (LIVES - 1 - k) * cr * 2.25, alive = k < S.lives[si];
        ctx.save(); ctx.translate(cx, yy); ctx.globalAlpha = alive ? 1 : 0.28;
        const gr = ctx.createRadialGradient(-cr * 0.3, -cr * 0.3, cr * 0.1, 0, 0, cr); gr.addColorStop(0, '#f6e7c1'); gr.addColorStop(1, '#c9ab6b');
        ctx.beginPath(); ctx.arc(0, 0, cr, 0, 6.3); ctx.fillStyle = gr; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#7a5a28'; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, cr * 0.62, 0, 6.3); ctx.lineWidth = 1.5; ctx.strokeStyle = si === 0 ? '#2d6bb0' : '#b3402b'; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, cr * 0.28, 0, 6.3); ctx.fillStyle = si === 0 ? '#2d6bb0' : '#b3402b'; ctx.fill();
        ctx.restore();
      }
    });
    // log
    let yy = y + pad + rowH * 2 + 8;
    const lf = Math.min(px(19), rowH * 0.46);
    ctx.font = `italic 600 ${Math.round(lf)}px "Iowan Old Style",Palatino,Georgia,serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const logRows = Math.min(2, S.log.length);
    S.log.slice(-logRows).forEach((t, i, arr) => { ctx.fillStyle = `rgba(235,240,250,${0.45 + 0.5 * ((i + 1) / arr.length)})`; ctx.fillText(t, x + pad, yy + lf * 0.7 + i * lf * 1.35); });
    yy += lf * 1.35 * 2 + 8;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.moveTo(x + pad, yy - 3); ctx.lineTo(x + w - pad, yy - 3); ctx.stroke();
    // ladder: 3 columns x 7 rows, lowest at the top-left, Mia last
    const cols = 3, rows = 7, gx = 8, gy = 6;
    const avail = y + h - yy - pad * 0.6;
    const cw = (w - 2 * pad - gx * (cols - 1)) / cols, ch = Math.min((avail - gy * (rows - 1)) / rows, 70);
    const hits = [];
    const legalSet = new Set(S.phase === 'announce' && S.roller === 0 ? legal() : []);
    LADDER.forEach((code, i) => {
      const r = i % rows, cI = Math.floor(i / rows);
      const cx0 = x + pad + cI * (cw + gx), cy0 = yy + r * (ch + gy);
      const isLegal = legalSet.has(code), isAnn = S.ann === code, isPick = S.pickCode === code;
      const dead = S.ann != null && rankOf(code) <= rankOf(S.ann) && !isAnn;
      ctx.save();
      ui.rr(ctx, cx0, cy0, cw, ch, Math.min(12, ch * 0.3));
      ctx.fillStyle = isPick ? '#f2c14e' : isAnn ? '#c8452d' : isLegal ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.05)'; ctx.fill();
      ctx.lineWidth = isLegal ? 1.6 : 1; ctx.strokeStyle = isPick ? '#fff3c4' : isAnn ? '#ffd0c0' : isLegal ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'; ctx.stroke();
      ctx.globalAlpha = dead ? 0.35 : 1;
      const a = code === 21 ? 2 : Math.floor(code / 10) % 10 || code / 11, b2 = code === 21 ? 1 : code % 11 === 0 ? code / 11 : code % 10;
      const hiV = code % 11 === 0 && code !== 21 ? code / 11 : Math.floor(code / 10), loV = code % 11 === 0 && code !== 21 ? code / 11 : code % 10;
      void a; void b2;
      const fs = Math.min(ch * 0.62, cw * 0.17), fx = cx0 + cw * 0.13;
      mini(ctx, fx + fs * 0.5, cy0 + ch / 2, fs, hiV, isPick ? '#fff' : '#f1e8d0');
      mini(ctx, fx + fs * 1.7, cy0 + ch / 2, fs, loV, isPick ? '#fff' : '#f1e8d0');
      ctx.font = `800 ${Math.round(Math.min(ch * 0.42, px(19)))}px system-ui,sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = isPick ? '#2a1d05' : '#eaf2ff';
      ctx.fillText(code === 21 ? 'Mia' : code % 11 === 0 ? 'pair' : `${hiV}${loV}`, fx + fs * 2.5, cy0 + ch / 2 + 1);
      ctx.restore();
      if (code === 21) { ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = 2; ui.rr(ctx, cx0, cy0, cw, ch, Math.min(12, ch * 0.3)); ctx.stroke(); }
      hits.push({ id: `v${code}`, x: cx0, y: cy0, w: cw, h: ch, open: isLegal });
    });
    ctx.restore();
    void now; void tint; void alpha; void drawDie; void restRotation; void mul; void rotX;
    return { hits };
  };
  function mini(ctx, cx, cy, s, v, body) {
    const r = s * 0.2, x = cx - s / 2, y = cy - s / 2;
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + s, y, x + s, y + s, r); ctx.arcTo(x + s, y + s, x, y + s, r); ctx.arcTo(x, y + s, x, y, r); ctx.arcTo(x, y, x + s, y, r); ctx.closePath();
    ctx.fillStyle = body; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.stroke();
    const Pp = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]] }[v] ?? [];
    ctx.fillStyle = v === 1 ? '#b3202a' : '#222';
    for (const [a, b] of Pp) { ctx.beginPath(); ctx.arc(cx + a * s * 0.26, cy + b * s * 0.26, s * 0.1, 0, 6.3); ctx.fill(); }
  }
  const sheet = () => ({ cols: [{ name: 'You', ink: '#000' }, { name: 'Computer', ink: '#000' }], rows: [], totals: [0, 0] });
  return { init, update, onDie, onRow, onButton, buttons, sheet, panel, layoutRows: () => 13, result, hint, status, rules, banner, getState: () => ({ seat: S.roller, phase: S.phase, lives: S.lives.slice(), ann: S.ann, pick: S.pickCode, actual: S.actual }), S };
}

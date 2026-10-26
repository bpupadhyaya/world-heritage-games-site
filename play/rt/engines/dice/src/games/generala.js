// Generala (five-dice cup game of the Rio de la Plata): five dice, up to three throws a turn, ten boxes per player.
// Pure rules + a deterministic opponent; the activity owns drawing, input and timing.
import { counts, sum, lcg, words, word1, starsFor } from '../common.js';

export const CATS = ['1', '2', '3', '4', '5', '6', 'E', 'F', 'P', 'G'];
const NAMES = { E: 'Escalera', F: 'Full', P: 'Poker', G: 'Generala' };
const SUBS = { E: 'a straight', F: 'three and two', P: 'four alike', G: 'five alike' };
const PARX = JSON.parse(globalThis.__PAR ?? 'null');
const PAR = PARX ?? { 1: 2.6, 2: 5.2, 3: 7.8, 4: 10.4, 5: 13, 6: 15.6, E: 12, F: 14, P: 12, G: 5 };

export function scoreOf(cat, dice, servida) {
  const c = counts(dice);
  const mx = Math.max(...c);
  if (cat >= '1' && cat <= '6' && cat.length === 1) return Number(cat) * c[Number(cat)];
  if (cat === 'E') {
    const has = (v) => c[v] === 1;
    const ok = (has(1) && has(2) && has(3) && has(4) && has(5)) || (has(2) && has(3) && has(4) && has(5) && has(6)) || (has(3) && has(4) && has(5) && has(6) && has(1));
    return ok ? 20 + (servida ? 5 : 0) : 0;
  }
  if (cat === 'F') return mx === 3 && c.includes(2) ? 30 + (servida ? 5 : 0) : 0;
  if (cat === 'P') return mx >= 4 ? 40 + (servida ? 5 : 0) : 0;
  if (cat === 'G') return mx === 5 ? 50 : 0;
  return 0;
}

export function createGenerala(c) {
  const { P, env, stage, rng } = c;
  const MAXT = P.throws ?? 3;
  const S = {};
  const fresh = () => ({ cells: Object.fromEntries(CATS.map((k) => [k, null])), doble: false });
  const total = (seat) => CATS.reduce((a, k) => a + (S.sheets[seat].cells[k] ? S.sheets[seat].cells[k].v : 0), 0);
  const isAI = (seat) => seat === 1 || c.auto();
  const dice = () => stage.values();
  const open = (seat) => CATS.filter((k) => S.sheets[seat].cells[k] == null);

  const init = () => {
    Object.assign(S, { sheets: [fresh(), fresh()], seat: P.first === 'computer' ? 1 : 0, throws: 0, phase: 'ready', pick: null, wait: 0.6, banner: '', bannerT: 0, win: null, history: [], rolledOnce: false, servidaWin: null });
    stage.reset();
    announce();
  };
  const announce = () => { S.bannerOverride = false; S.bannerT = c.now(); };
  const say = (t) => { S.banner = t; S.bannerT = c.now(); S.bannerOverride = true; };

  const doRoll = () => {
    const ids = stage.dice.filter((d) => !d.held).map((d) => d.i);
    if (!ids.length || S.throws >= MAXT) return false;
    S.pick = null;
    stage.roll(ids);
    S.phase = 'rolling';
    return true;
  };
  const preview = (seat) => {
    const d = dice();
    const out = {};
    for (const k of open(seat)) out[k] = scoreOf(k, d, S.throws === 1);
    return out;
  };
  const write = (seat, cat) => {
    const d = dice(), servida = S.throws === 1;
    let v = scoreOf(cat, d, servida);
    const cell = { v, at: c.now(), cross: v === 0 };
    S.sheets[seat].cells[cat] = cell;
    const cn = counts(d);
    let msg = v === 0 ? 'Crossed out' : '';
    if (Math.max(...cn) === 5 && !S.sheets[seat].doble && S.sheets[seat].cells.G && S.sheets[seat].cells.G.v === 50 && cat !== 'G') {
      S.sheets[seat].doble = true; S.sheets[seat].cells.G.v = 100; S.sheets[seat].cells.G.at = c.now(); msg = 'Generala doble! The Generala box is now worth 100';
      c.sfx('great');
    } else if (cat === 'G' && v === 50 && !S.sheets[seat].doble && false) { /* a first generala on the sheet is worth 50 */ }
    if (v > 0) { c.sfx('write'); if (servida && cat !== '1' && cat.length === 1 && 'EFPG'.includes(cat)) { msg = `${NAMES[cat]} served! +5`; if (cat === 'G') msg = 'Generala served!'; } }
    else c.sfx('pencil');
    if (msg) say(msg);
    if (cat === 'G' && v === 50 && servida && P.servidaWins !== false) { S.servidaWin = seat; }
    S.phase = 'scored'; S.wait = 1.15; S.pick = null;
  };
  const nextTurn = () => {
    const done = (s) => open(s).length === 0;
    if (S.servidaWin != null || (done(0) && done(1))) { S.phase = 'over'; return; }
    let nx = 1 - S.seat;
    if (done(nx)) nx = S.seat;
    S.seat = nx; S.throws = 0; S.phase = 'ready'; S.wait = 0.55; S.pick = null;
    stage.collect(); announce();
  };

  // ---- computer (and Watch and learn) -----------------------------------------------------------------------------------
  const utility = (cat, d, servida) => scoreOf(cat, d, servida) - PAR[cat];
  const bestCat = (seat, d, servida) => {
    let best = null;
    for (const k of open(seat)) { const u = utility(k, d, servida); if (!best || u > best.u + 1e-9) best = { k, u }; }
    return best;
  };
  const masks = (d) => {
    const seen = new Map();
    for (let m = 0; m < 32; m++) {
      const held = []; for (let i = 0; i < 5; i++) if (m & (1 << i)) held.push(d[i]);
      const key = held.slice().sort().join('');
      if (!seen.has(key)) seen.set(key, { m, held });
    }
    return [...seen.values()];
  };
  const level = () => (P.level ?? 'normal');
  const think = (seat, d, left, servidaNow, seed = null) => {
    const rnd = lcg(seed ?? rng.int(1 << 30) + 17);
    const cat = bestCat(seat, d, servidaNow);
    if (left === 0) return { act: 'score', cat: cat.k };
    const lv = level();
    const M = lv === 'hard' ? 36 : 28;
    const evalHold = (held, lf, depth) => {
      const free = 5 - held.length; if (free === 0) return bestCat(seat, held, false)?.u ?? -99;
      let tot = 0;
      for (let s = 0; s < M; s++) {
        const nd = held.slice(); for (let j = 0; j < free; j++) nd.push(1 + Math.floor(rnd() * 6));
        let v = bestCat(seat, nd, false)?.u ?? -99;
        if (lf > 1 && depth > 0) {
          // one more throw: best hold of the new dice by a cheap heuristic (keep the most frequent value) else score
          const cn = counts(nd); let top = 1; for (let q = 1; q <= 6; q++) if (cn[q] > cn[top] || (cn[q] === cn[top] && q > top)) top = q;
          const kept = nd.filter((x) => x === top); let t2 = 0;
          for (let s2 = 0; s2 < 10; s2++) { const nd2 = kept.slice(); for (let j = kept.length; j < 5; j++) nd2.push(1 + Math.floor(rnd() * 6)); t2 += bestCat(seat, nd2, false)?.u ?? -99; }
          v = Math.max(v, t2 / 10);
        }
        tot += v;
      }
      return tot / M;
    };
    let best = { v: -1e9, held: [] };
    const depth = lv === 'easy' ? 0 : 1;
    for (const { held } of masks(d)) {
      if (held.length === 5) continue;
      const v = evalHold(held, left, depth);
      if (v > best.v) best = { v, held };
    }
    if (lv === 'easy' && rnd() < 0.3) { const cn = counts(d); let top = 1; for (let q = 1; q <= 6; q++) if (cn[q] >= cn[top]) top = q; best = { v: best.v, held: d.filter((x) => x === top) }; }
    if (best.v > cat.u + 0.25 && !(lv === 'easy' && rnd() < 0.15)) {
      // map held values back onto dice indices
      const need = best.held.slice(), keep = [];
      d.forEach((v, i) => { const j = need.indexOf(v); if (j >= 0) { need.splice(j, 1); keep.push(i); } });
      return { act: 'roll', keep, value: best.v };
    }
    return { act: 'score', cat: cat.k };
  };

  const doAI = () => {
    const seat = S.seat, d = dice();
    if (S.phase === 'ready') { doRoll(); return; }
    const left = MAXT - S.throws, plan = think(seat, d, left, S.throws === 1);
    if (plan.act === 'score') { S.pick = plan.cat; S.phase = 'picking'; S.wait = 0.75; return; }
    // keep, then roll after a pause
    stage.dice.forEach((x, i) => stage.setHeld(i, plan.keep.includes(i)));
    if (plan.keep.length) c.sfx('keep');
    S.phase = 'holding'; S.wait = 0.8;
  };

  const update = (dt) => {
    if (S.phase === 'over') return;
    const busy = stage.busy();
    if (S.phase === 'rolling' && !busy) {
      S.throws++; S.phase = 'choose'; S.wait = 0.9;
      const d = dice(), cn = counts(d), mx = Math.max(...cn);
      if (mx === 5) { c.sfx('great'); say(S.throws === 1 ? 'Generala served!' : 'Generala!'); }
      else if (scoreOf('P', d, false) || scoreOf('F', d, false) || scoreOf('E', d, false)) c.sfx('good');
      if (S.throws >= MAXT) S.wait = 1.0;
      return;
    }
    if (busy) return;
    if (S.phase === 'scored') { S.wait -= dt; if (S.wait <= 0) nextTurn(); return; }
    if (S.phase === 'ready' || S.phase === 'choose' || S.phase === 'holding' || S.phase === 'picking') {
      if (!isAI(S.seat)) {
        return;
      }
      S.wait -= dt / c.pace(); if (S.wait > 0) return;
      if (S.phase === 'holding') { doRoll(); return; }
      if (S.phase === 'picking') { write(S.seat, S.pick); return; }
      doAI();
    }
  };

  // ---- player actions ------------------------------------------------------------------------------------------------------
  const mine = () => !isAI(S.seat);
  const canKeep = () => mine() && S.phase === 'choose' && S.throws < MAXT;
  const onDie = (i) => {
    if (!canKeep()) return;
    const d = stage.dice[i]; if (!d.shown) return;
    stage.setHeld(i, !d.held); c.sfx('keep');
  };
  const onRow = (id) => {
    if (!mine() || S.phase !== 'choose') return;
    if (S.sheets[0].cells[id] != null) return;
    if (S.pick === id) { write(0, id); return; }
    S.pick = id; c.sfx('pencil');
  };
  const onButton = (id) => {
    if (!mine()) return;
    if (id === 'roll' && (S.phase === 'ready' || S.phase === 'choose')) doRoll();
    else if (id === 'write' && S.pick) write(0, S.pick);
  };
  const label = (k) => (k.length === 1 && k <= '6' ? `${words[Number(k)][0].toUpperCase()}${words[Number(k)].slice(1)}` : NAMES[k]);
  const buttons = () => {
    const m = mine();
    if (!m) return [{ id: 'wait', label: c.auto() ? 'Watch and learn' : 'Computer is playing', off: true, primary: false }];
    if (S.phase === 'ready') return [{ id: 'roll', label: 'Shake and throw', primary: true }];
    if (S.phase === 'rolling') return [{ id: 'wait', label: 'Rolling...', off: true }];
    if (S.phase === 'scored') return [{ id: 'wait', label: 'Written', off: true }];
    if (S.phase === 'choose') {
      if (S.pick) {
        const v = scoreOf(S.pick, dice(), S.throws === 1);
        return [{ id: 'write', label: v ? `Write ${v} in ${label(S.pick)}` : `Cross out ${label(S.pick)}`, primary: true }, ...(S.throws < MAXT && stage.dice.some((d) => !d.held) ? [{ id: 'roll', label: `Throw again`, primary: false }] : [])];
      }
      if (S.throws < MAXT && stage.dice.some((d) => !d.held)) return [{ id: 'roll', label: `Throw again (${MAXT - S.throws} left)`, primary: true }];
      return [{ id: 'wait', label: 'Choose a box on the sheet', off: true }];
    }
    return [];
  };

  const sheet = () => {
    const p = S.phase === 'choose' && mine() ? preview(0) : {};
    return {
      cols: [{ name: c.auto() ? 'Teacher' : 'You', ink: '#1f3a73' }, { name: 'Computer', ink: '#9a2d22' }],
      active: S.phase === 'over' ? -1 : S.seat,
      totalLabel: 'Total',
      rows: CATS.map((k) => ({
        id: k, label: label(k), sub: SUBS[k], face: k.length === 1 && k <= '6' ? Number(k) : null,
        cells: [S.sheets[0].cells[k], S.sheets[1].cells[k]], preview: p[k] ?? null, picked: S.pick === k, open: mine() && S.phase === 'choose' && S.sheets[0].cells[k] == null,
      })),
      totals: [total(0), total(1)],
    };
  };
  const result = () => {
    if (S.phase !== 'over') return null;
    const a = total(0), b = total(1);
    const sw = S.servidaWin;
    const win = sw != null ? sw === 0 : a > b;
    const stars = sw != null ? (sw === 0 ? 3 : 0) : starsFor(a, b, 40);
    return { score: a, max: 300, stars, headline: sw === 0 ? 'Generala served: you win!' : sw === 1 ? 'Generala served for the computer' : win ? (stars === 3 ? 'A fine victory' : 'You win') : a === b ? 'A tie' : 'The computer wins', detail: `You ${a} · Computer ${b}` };
  };
  const hint = () => {
    if (!mine()) return 'The computer is rolling.';
    if (S.phase === 'ready') return 'Shake the cup: up to three throws a turn.';
    if (S.phase !== 'choose') return '';
    const p = think(0, dice(), MAXT - S.throws, S.throws === 1, 4242 + S.throws + dice().join('').length);
    if (p.act === 'score') { const v = scoreOf(p.cat, dice(), S.throws === 1); return v ? `Write ${v} in ${label(p.cat)}.` : `Cross out ${label(p.cat)}: it costs the least.`; }
    stage.mark(p.keep);
    const kept = p.keep.map((i) => dice()[i]);
    const cn = counts(kept); const top = [1, 2, 3, 4, 5, 6].filter((v) => cn[v]).map((v) => `${cn[v] > 1 ? word1[cn[v]] + ' ' : 'the '}${v}${cn[v] > 1 ? 's' : ''}`);
    return kept.length ? `Keep ${top.join(' and ')}, throw the rest.` : 'Throw all five again.';
  };
  const status = () => ({ score: total(0), max: 300, label: `You ${total(0)} · Computer ${total(1)}` });
  const rules = () => [
    'Each turn you may throw the five dice up to three times, keeping any dice you like between throws.',
    'Numbers 1 to 6: add up the dice showing that number. Escalera (five in a row; 3-4-5-6-1 counts) 20. Full (three and two) 30. Poker (four alike) 40. Generala (five alike) 50.',
    'Escalera, Full and Poker made on the very first throw ("served") score 5 extra. A Generala served on the first throw wins the whole game.',
    'A second Generala after you already hold 50 in the Generala box makes it 100 (Generala doble).',
    'When no box fits you must cross one out for nothing. Ten boxes each; the higher total wins.',
  ];
  const banner = () => {
    const fresh = c.now() - S.bannerT < 2.2 && S.bannerOverride;
    if (fresh) return { text: S.banner, t: c.now() - S.bannerT };
    const t = S.phase === 'over' ? 'Game over' : c.auto() ? 'Watch and learn' : S.seat === 0 ? 'Your turn' : "Computer's turn";
    return { text: t, t: 9 };
  };
  return { init, update, onDie, onRow, onButton, buttons, sheet, result, hint, status, rules, banner, getState: () => ({ seat: S.seat, phase: S.phase, throws: S.throws, pick: S.pick, a: total(0), b: total(1), sw: S.servidaWin, cells: [S.sheets[0].cells, S.sheets[1].cells].map((x) => CATS.map((k) => (x[k] ? x[k].v : null))) }), S };
}

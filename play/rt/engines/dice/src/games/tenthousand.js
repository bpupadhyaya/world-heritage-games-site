// Ten Thousand: six dice, push your luck. Set aside scoring dice, throw the rest or bank the turn's points; a throw with nothing
// that scores is a bust and the turn's points are lost. Using all six dice ("hot dice") gives six fresh dice. First to the target wins.
import { counts, starsFor } from '../common.js';

// Score a SET of dice in which every die must count (returns null when some die scores nothing).
export function scoreSet(vals) {
  const n = vals.length; if (!n) return null;
  const c = counts(vals);
  if (n === 6 && c.slice(1).every((x) => x === 1)) return 1500;                       // straight 1-6
  if (n === 6 && c.slice(1).filter((x) => x === 2).length === 3) return 1500;          // three pairs
  let total = 0;
  for (let v = 1; v <= 6; v++) {
    const k = c[v]; if (!k) continue;
    if (k >= 3) total += (v === 1 ? 1000 : v * 100) * 2 ** (k - 3);
    else if (v === 1) total += 100 * k;
    else if (v === 5) total += 50 * k;
    else return null;
  }
  return total;
}
// best score from any subset of the rolled dice (null if the throw busts); also the dice that can score at all
export function bestSubset(vals) {
  let best = null;
  const n = vals.length;
  for (let m = 1; m < 1 << n; m++) {
    const sub = []; for (let i = 0; i < n; i++) if (m & (1 << i)) sub.push(vals[i]);
    const s = scoreSet(sub); if (s != null && (!best || s > best.score)) best = { score: s, mask: m };
  }
  return best;
}

export function createTenThousand(c) {
  const { P, stage } = c;
  const TARGET = P.target ?? 10000, ENTRY = P.entry ?? 500;
  const S = {};
  const isAI = (seat) => seat === 1 || c.auto();
  const mine = () => !isAI(S.seat);
  const say = (t) => { S.banner = t; S.bannerT = c.now(); S.ov = true; };
  const init = () => {
    Object.assign(S, { seat: P.first === 'computer' ? 1 : 0, total: [0, 0], on: [false, false], turnPts: 0, aside: [], phase: 'ready', wait: 0.6, hist: [], banner: '', bannerT: 0, ov: false, win: null });
    stage.reset();
  };
  const free = () => stage.dice.filter((d) => !S.aside.includes(d.i));
  const sel = () => free().filter((d) => d.held).map((d) => d.i);
  const selScore = () => { const s = sel(); return s.length ? scoreSet(s.map((i) => stage.dice[i].v)) : 0; };
  const doRoll = () => {
    const ids = free().map((d) => d.i);
    if (!ids.length) return false;
    stage.roll(ids); S.phase = 'rolling'; return true;
  };
  const afterRoll = () => {
    const vals = free().map((d) => d.v);
    if (!bestSubset(vals)) { S.phase = 'bust'; S.wait = 1.5; c.sfx('bust'); say('Bust! No scoring dice'); return; }
    S.phase = 'choose'; S.wait = 0.8;
  };
  const bank = (pts) => {
    const seat = S.seat;
    const val = S.turnPts + pts;
    S.total[seat] += val; S.on[seat] = true;
    S.hist.push({ seat, v: val, bust: false, at: c.now() });
    c.sfx('write'); if (val >= 1000) { c.sfx('great'); say(`${val} banked!`); } else say(`${val} banked`);
    if (S.total[seat] >= TARGET) { S.win = seat; S.phase = 'scored'; S.wait = 1.4; S.finish = true; return; }
    S.phase = 'scored'; S.wait = 1.1;
  };
  const endTurn = () => {
    if (S.finish) { S.phase = 'over'; return; }
    S.seat = 1 - S.seat; S.turnPts = 0; S.aside = []; S.phase = 'ready'; S.wait = 0.6; S.ov = false;
    stage.collect(); for (const d of stage.dice) d.held = false;
  };
  // set the chosen dice aside; returns whether the next throw is a fresh six (hot dice)
  const commit = () => {
    const s = sel(), pts = selScore();
    S.turnPts += pts; S.aside.push(...s);
    c.sfx('write');
    if (S.aside.length === stage.dice.length) { S.aside = []; for (const d of stage.dice) { d.held = false; } stage.collect(); S.hot = true; say('Hot dice! Throw all six again'); c.sfx('great'); return true; }
    return false;
  };
  // ---- computer -------------------------------------------------------------------------------------------------------------
  const aiPick = () => {
    const vals = free().map((d) => d.v), ds = free().map((d) => d.i);
    const best = bestSubset(vals); if (!best) return null;
    // all dice that can score on their own or in a group; drop lone 5s when that leaves enough dice to keep going
    const take = []; const cnt = counts(vals);
    ds.forEach((i, k) => { const v = vals[k]; if (cnt[v] >= 3 || v === 1 || v === 5) take.push(i); });
    let pick = take;
    if (scoreSet(pick.map((i) => stage.dice[i].v)) == null) pick = ds.filter((_, k) => best.mask & (1 << k));
    const lone5 = pick.filter((i) => stage.dice[i].v === 5 && cnt[5] < 3);
    if (lone5.length && pick.length - lone5.length >= 1 && ds.length - pick.length + lone5.length >= 3) pick = pick.filter((i) => !lone5.includes(i));
    if (scoreSet(pick.map((i) => stage.dice[i].v)) == null) pick = ds.filter((_, k) => best.mask & (1 << k));
    return pick;
  };
  const aiShouldBank = (afterPts, remaining) => {
    const lv = P.level ?? 'normal', seat = S.seat;
    const turn = S.turnPts + afterPts;
    if (!S.on[seat] && turn < ENTRY) return false;
    if (remaining === 0 || remaining === 6) return false;       // hot dice: always throw again
    if (S.total[seat] + turn >= TARGET) return true;
    const base = lv === 'easy' ? 300 : lv === 'hard' ? 450 : 350;
    const need = { 1: 200, 2: 300, 3: 450, 4: 650, 5: 1000 }[remaining] ?? 400;
    const behind = S.total[1 - seat] - S.total[seat] > 2000 ? 1.4 : 1;
    return turn >= Math.max(lv === 'hard' ? 300 : 250, Math.min(need, base * 1.6)) * (1 / behind) * (lv === 'easy' ? 0.7 : 1);
  };
  const update = (dt) => {
    if (S.phase === 'over') return;
    const busy = stage.busy();
    if (S.phase === 'rolling' && !busy) { afterRoll(); return; }
    if (busy) return;
    if (S.phase === 'bust') { S.wait -= dt; if (S.wait <= 0) { S.hist.push({ seat: S.seat, v: 0, bust: true, at: c.now() }); endTurn(); } return; }
    if (S.phase === 'scored') { S.wait -= dt; if (S.wait <= 0) endTurn(); return; }
    if (S.phase === 'ready' || S.phase === 'choose' || S.phase === 'holding') {
      if (!isAI(S.seat)) return;
      S.wait -= dt / c.pace(); if (S.wait > 0) return;
      if (S.phase === 'ready') { doRoll(); return; }
      if (S.phase === 'holding') {
        const pts = selScore(); const remaining = free().length - sel().length;
        const bankNow = aiShouldBank(pts, remaining);
        if (bankNow) bank(pts); else { const hot = commit(); S.phase = 'wait2'; S.wait = hot ? 1.1 : 0.45; }
        return;
      }
      const pick = aiPick();
      free().forEach((d) => stage.setHeld(d.i, pick.includes(d.i)));
      S.phase = 'holding'; S.wait = 0.8; return;
    }
    if (S.phase === 'wait2') { S.wait -= dt; if (S.wait <= 0) { S.hot = false; doRoll(); } }
  };
  // ---- player ---------------------------------------------------------------------------------------------------------------
  const onDie = (i) => {
    if (!mine() || S.phase !== 'choose' || S.aside.includes(i)) return;
    const d = stage.dice[i]; if (!d.shown) return;
    stage.setHeld(i, !d.held); c.sfx('keep');
  };
  const onRow = () => {};
  const onButton = (id) => {
    if (!mine()) return;
    if (id === 'roll' && S.phase === 'ready') doRoll();
    else if (id === 'roll' && S.phase === 'choose' && selScore() > 0) { const hot = commit(); S.phase = 'wait2'; S.wait = hot ? 1.0 : 0.35; }
    else if (id === 'bank' && S.phase === 'choose' && selScore() > 0) { const pts = selScore(); if (!S.on[0] && S.turnPts + pts < ENTRY) return; bank(pts); }
  };
  const buttons = () => {
    if (!mine()) return [{ id: 'wait', label: c.auto() ? 'Watch and learn' : 'Computer is playing', off: true }];
    if (S.phase === 'ready') return [{ id: 'roll', label: 'Shake and throw', primary: true }];
    if (S.phase === 'choose') {
      const pts = selScore(), turn = S.turnPts + (pts || 0);
      if (!pts) return [{ id: 'wait', label: sel().length ? 'Every kept die must score' : 'Slide the scoring dice aside', off: true }];
      const rem = free().length - sel().length;
      const canBank = S.on[0] || turn >= ENTRY;
      return [{ id: 'roll', label: rem === 0 ? 'Hot dice: throw all six' : `Throw ${rem} more`, primary: true }, { id: 'bank', label: canBank ? `Bank ${turn}` : `Need ${ENTRY}`, off: !canBank }];
    }
    return [{ id: 'wait', label: S.phase === 'bust' ? 'Bust' : S.phase === 'rolling' ? 'Rolling...' : '...', off: true }];
  };
  const sheet = () => {
    const rows = [];
    const rounds = []; // pair the history by turn number
    let cur = null;
    S.hist.forEach((h) => { if (!cur || cur[h.seat] != null) { cur = [null, null]; rounds.push(cur); } cur[h.seat] = h; });
    const last = rounds.slice(-6);
    const base = rounds.length - last.length;
    last.forEach((r, k) => rows.push({ id: `t${base + k}`, label: `Turn ${base + k + 1}`, cells: [0, 1].map((s) => (r[s] ? { v: r[s].bust ? 0 : r[s].v, at: r[s].at, cross: r[s].bust } : null)), open: false }));
    while (rows.length < 6) rows.push({ id: `e${rows.length}`, label: `Turn ${rows.length + 1 + base}`, cells: [null, null], open: false });
    const livePts = S.phase === 'choose' || S.phase === 'rolling' || S.phase === 'holding' ? S.turnPts + (selScore() || 0) : S.turnPts;
    rows.push({ id: 'now', kind: 'normal', label: 'This turn', sub: S.on[S.seat] || S.total[S.seat] ? '' : `${ENTRY} to open`, bold: true, cells: [S.seat === 0 && livePts ? { v: livePts, at: -9 } : null, S.seat === 1 && livePts ? { v: livePts, at: -9 } : null], picked: !!livePts, open: false });
    return { cols: [{ name: c.auto() ? 'Teacher' : 'You', ink: '#4a2a12' }, { name: 'Computer', ink: '#7a1f1f' }], active: S.phase === 'over' ? -1 : S.seat, totalLabel: `To ${TARGET}`, headNote: 'Banked', rows, totals: S.total };
  };
  const result = () => {
    if (S.phase !== 'over') return null;
    const a = S.total[0], b = S.total[1], win = S.win === 0;
    return { score: a, max: TARGET, stars: win ? (b < TARGET * 0.6 ? 3 : 2) : starsFor(a, b, 3000), headline: win ? 'You reach the target first' : 'The computer gets there first', detail: `You ${a} · Computer ${b}` };
  };
  const hint = () => {
    if (!mine()) return 'The computer is throwing.';
    if (S.phase === 'ready') return `Throw the six dice. Open with ${ENTRY} points in one turn.`;
    if (S.phase !== 'choose') return '';
    const pick = aiPick(); stage.mark(pick);
    const pts = scoreSet(pick.map((i) => stage.dice[i].v));
    const rem = free().length - pick.length;
    return aiShouldBank(pts, rem) ? `Set these aside (${pts}) and bank ${S.turnPts + pts}.` : `Set these aside (${pts}) and throw ${rem || 6} again.`;
  };
  const banner = () => {
    if (S.ov && c.now() - S.bannerT < 2.4) return { text: S.banner, t: c.now() - S.bannerT };
    const lp = S.turnPts + (S.phase === 'choose' ? selScore() || 0 : 0);
    const who = S.phase === 'over' ? 'Game over' : c.auto() ? 'Watch and learn' : S.seat === 0 ? 'Your turn' : "Computer's turn";
    return { text: lp ? `${who} · ${lp}` : who, t: 9 };
  };
  const status = () => ({ score: S.total[0], max: TARGET, frac: Math.min(1, Math.max(S.total[0], S.total[1]) / TARGET), label: `You ${S.total[0]} · Computer ${S.total[1]}` });
  const rules = () => [
    'Throw six dice. Set aside the dice that score, then throw the rest again or bank the points you have this turn.',
    'A single 1 scores 100, a single 5 scores 50. Three alike score 100 times the number (three 1s: 1000); each extra die of that number doubles it.',
    'Six in a row (1 to 6) or three pairs score 1500.',
    'If a throw has nothing that scores, you bust: the points of this turn are lost and the turn passes.',
    'When all six dice have scored you may throw all six again (hot dice).',
    `You must collect ${ENTRY} points in a single turn before your first bank. First to ${TARGET} wins.`,
  ];
  return { init, update, onDie, onRow, onButton, buttons, sheet, result, hint, status, rules, banner, getState: () => ({ seat: S.seat, phase: S.phase, total: S.total.slice(), turnPts: S.turnPts, aside: S.aside.slice(), sel: sel() }), S };
}

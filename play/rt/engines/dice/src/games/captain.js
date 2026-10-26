// Ship, Captain and Crew: five dice, three throws a turn. A 6 (the ship) must be locked first, then a 5 (the captain), then a 4 (the crew).
// The other two dice are the cargo; their sum is the turn's score. No full crew by the end of the third throw scores nothing.
// Five turns each; the bigger cargo total wins.
import { starsFor } from '../common.js';

const ROLES = [{ v: 6, name: 'Ship' }, { v: 5, name: 'Captain' }, { v: 4, name: 'Crew' }];

export function createCaptain(c) {
  const { P, stage, rng } = c;
  const MAXT = P.throws ?? 3, ROUNDS = P.rounds ?? 5;
  const S = {};
  const isAI = (seat) => seat === 1 || c.auto();
  const total = (seat) => S.cells[seat].reduce((a, x) => a + (x ? x.v : 0), 0);
  const say = (t) => { S.banner = t; S.bannerT = c.now(); S.over = true; };
  const init = () => {
    Object.assign(S, { seat: P.first === 'computer' ? 1 : 0, turn: 0, throws: 0, locked: 0, phase: 'ready', wait: 0.6, cells: [[], []], banner: '', bannerT: 0, over: false, stop: false, last: null });
    stage.reset();
  };
  const cargo = () => stage.dice.filter((d) => !d.tag).map((d) => d.i);
  const mine = () => !isAI(S.seat);
  const doRoll = () => {
    const ids = stage.dice.filter((d) => !d.held).map((d) => d.i);
    if (!ids.length || S.throws >= MAXT) return false;
    stage.roll(ids); S.phase = 'rolling'; return true;
  };
  // lock the next ranks found among the free dice, in order
  const autoLock = () => {
    let any = false;
    while (S.locked < 3) {
      const need = ROLES[S.locked].v;
      const d = stage.dice.find((x) => !x.tag && x.v === need);
      if (!d) break;
      d.tag = `${ROLES[S.locked].name}`; stage.setHeld(d.i, true); S.locked++; any = true; c.sfx('good');
      say(`${ROLES[S.locked - 1].name} on board!`);
    }
    return any;
  };
  const cargoSum = () => stage.dice.filter((d) => !d.tag).reduce((a, d) => a + d.v, 0);
  const finishTurn = (v) => {
    S.cells[S.seat].push({ v, at: c.now(), cross: v === 0 });
    S.last = v;
    if (v === 0) { c.sfx('bad'); say('No full crew: nothing scored'); } else { c.sfx('write'); if (v >= 11) { c.sfx('great'); say(`A rich cargo: ${v}!`); } }
    S.phase = 'scored'; S.wait = 1.3;
  };
  const nextTurn = () => {
    const done = S.cells[0].length >= ROUNDS && S.cells[1].length >= ROUNDS;
    if (done) { S.phase = 'over'; return; }
    let nx = 1 - S.seat; if (S.cells[nx].length >= ROUNDS) nx = S.seat;
    if (nx === 0 && S.cells[0].length === S.cells[1].length) S.turn++;
    S.seat = nx; S.throws = 0; S.locked = 0; S.phase = 'ready'; S.wait = 0.6; S.over = false; stage.collect();
    for (const d of stage.dice) { d.tag = ''; }
  };
  // after a throw settles: lock ranks, then either the turn is over or the player decides
  const afterRoll = () => {
    S.throws++; autoLock();
    if (S.locked === 3) {
      if (S.throws >= MAXT) { finishTurn(cargoSum()); return; }
      S.phase = 'choose'; S.wait = 0.8; return;
    }
    if (S.throws >= MAXT) { finishTurn(0); return; }
    S.phase = 'choose'; S.wait = 0.7;
  };
  // computer: with a full crew keep a high cargo die and throw the low one, stop when the cargo is good enough
  const aiDecide = () => {
    if (S.locked < 3) return { act: 'roll', keep: [] };
    const left = MAXT - S.throws, free = stage.dice.filter((d) => !d.tag);
    const sum = cargoSum(), lv = P.level ?? 'normal';
    const stopAt = lv === 'easy' ? 8 : lv === 'hard' ? 10 : 9;
    if (left === 0 || sum >= stopAt + (left === 1 ? -1 : 0) || sum >= 11) return { act: 'stop' };
    const keep = free.filter((d) => d.v >= (left > 1 ? 5 : 4)).map((d) => d.i);
    if (keep.length === free.length) return { act: 'stop' };
    return { act: 'roll', keep };
  };
  const update = (dt) => {
    if (S.phase === 'over') return;
    const busy = stage.busy();
    if (S.phase === 'rolling' && !busy) { afterRoll(); return; }
    if (busy) return;
    if (S.phase === 'scored') { S.wait -= dt; if (S.wait <= 0) nextTurn(); return; }
    if (S.phase === 'ready' || S.phase === 'choose' || S.phase === 'holding') {
      if (!isAI(S.seat)) return;
      S.wait -= dt / c.pace(); if (S.wait > 0) return;
      if (S.phase === 'ready') { doRoll(); return; }
      if (S.phase === 'holding') { doRoll(); return; }
      const a = aiDecide();
      if (a.act === 'stop') { finishTurn(cargoSum()); return; }
      stage.dice.forEach((d) => { if (!d.tag) stage.setHeld(d.i, a.keep.includes(d.i)); });
      S.phase = 'holding'; S.wait = 0.7;
    }
  };
  const onDie = (i) => {
    if (!mine() || S.phase !== 'choose' || S.locked < 3 || S.throws >= MAXT) return;
    const d = stage.dice[i]; if (!d.shown || d.tag) return;
    stage.setHeld(i, !d.held); c.sfx('keep');
  };
  const onRow = () => {};
  const onButton = (id) => {
    if (!mine()) return;
    if (id === 'roll' && (S.phase === 'ready' || S.phase === 'choose')) doRoll();
    else if (id === 'stop' && S.phase === 'choose' && S.locked === 3) finishTurn(cargoSum());
  };
  const buttons = () => {
    if (!mine()) return [{ id: 'wait', label: c.auto() ? 'Watch and learn' : 'Computer is playing', off: true }];
    if (S.phase === 'ready') return [{ id: 'roll', label: 'Shake and throw', primary: true }];
    if (S.phase === 'choose') {
      const left = MAXT - S.throws;
      if (S.locked === 3) return [{ id: 'stop', label: `Take cargo ${cargoSum()}`, primary: true }, ...(left > 0 && stage.dice.some((d) => !d.held) ? [{ id: 'roll', label: 'Throw cargo' }] : [])];
      return [{ id: 'roll', label: `Throw again (${left} left)`, primary: true }];
    }
    return [{ id: 'wait', label: S.phase === 'rolling' ? 'Rolling...' : 'Written', off: true }];
  };
  const sheet = () => {
    const rows = [];
    for (let r = 0; r < ROUNDS; r++) rows.push({ id: `r${r}`, label: `Voyage ${r + 1}`, cells: [S.cells[0][r] ?? null, S.cells[1][r] ?? null], preview: null, picked: false, open: false });
    return { cols: [{ name: c.auto() ? 'Teacher' : 'You', ink: '#1d2f55' }, { name: 'Computer', ink: '#8a2a1e' }], active: S.phase === 'over' ? -1 : S.seat, totalLabel: 'Cargo', headNote: 'Ship · Captain · Crew', rows, totals: [total(0), total(1)] };
  };
  const result = () => {
    if (S.phase !== 'over') return null;
    const a = total(0), b = total(1), win = a > b;
    return { score: a, max: ROUNDS * 12, stars: starsFor(a, b, 10), headline: win ? (a - b >= 10 ? 'A fine captain' : 'Fair winds: you win') : a === b ? 'A tie' : 'The computer takes the cargo', detail: `You ${a} · Computer ${b}` };
  };
  const hint = () => {
    if (!mine()) return 'The computer is throwing.';
    if (S.phase === 'ready') return 'Lock a 6 (ship), then a 5 (captain), then a 4 (crew).';
    if (S.phase !== 'choose') return '';
    if (S.locked < 3) return `Next you need a ${ROLES[S.locked].v}: the ${ROLES[S.locked].name}.`;
    const a = aiDecide();
    if (a.act === 'stop') return `Take the cargo: ${cargoSum()} is good.`;
    stage.mark(a.keep);
    return a.keep.length ? 'Keep the high cargo die and throw the other.' : 'Throw both cargo dice again.';
  };
  const banner = () => {
    if (S.over && c.now() - S.bannerT < 2.4) return { text: S.banner, t: c.now() - S.bannerT };
    const nxt = S.locked < 3 ? `Need the ${ROLES[S.locked].v}` : 'Cargo';
    const who = S.phase === 'over' ? 'Voyage done' : c.auto() ? 'Watch and learn' : S.seat === 0 ? 'Your throw' : "Computer's throw";
    return { text: S.phase === 'choose' || S.phase === 'ready' ? `${who} · ${nxt}` : who, t: 9 };
  };
  const status = () => ({ score: total(0), max: ROUNDS * 12, label: `You ${total(0)} · Computer ${total(1)}` });
  const rules = () => [
    'Five dice, up to three throws a turn.',
    'You must lock a 6 first (the ship), then a 5 (the captain), then a 4 (the crew). They can fall in the same throw if they come in that order.',
    'The two other dice are the cargo; their total is your score for the turn. You may keep a good cargo die and throw only the other.',
    'If you do not have ship, captain and crew by the end of the third throw, the turn scores nothing.',
    'Five turns each; the bigger cargo total wins.',
  ];
  return { init, update, onDie, onRow, onButton, buttons, sheet, result, hint, status, rules, banner, getState: () => ({ seat: S.seat, phase: S.phase, throws: S.throws, locked: S.locked, a: total(0), b: total(1), cells: S.cells.map((x) => x.map((y) => y.v)) }), S };
}

// Chess-family rules module, entirely data driven (see ../README.md and ../spec.schema.json).
//
// Board: cols x rows, node ids "c,r", row 0 = top of the screen. Player 0 starts at the bottom and moves up the screen.
// Move descriptions in the piece table are written from the owner's point of view: +dr = forward (toward the opponent).
// state = { board: number[cols*rows] (0 empty, +(type+1) player 0, -(type+1) player 1), turn, plies, cr, ep, epp,
//           hist, hc, cm, cs, cl, bare, res, last }
import { gid } from '../../../platform/engine-kit/helpers.js';

export const DEFAULTS = {
  cols: 8, rows: 8, style: 'cells', setupSymmetry: 'mirror', firstMove: 0,
  kingRule: 'check', stalemate: 'draw', bareKing: 'none', facingGenerals: 'allowed',
  enPassant: false, castling: null, palace: null, river: null, pass: false,
  repetition: 3, halfmoveLimit: 0, counting: null, maxPlies: 300,
};

const ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAG = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
const SHORT = {
  orth: ORTH, diag: DIAG, all: [...ORTH, ...DIAG],
  knight: [[1, 2], [-1, 2], [1, -2], [-1, -2], [2, 1], [-2, 1], [2, -1], [-2, -1]],
  alfil: [[2, 2], [-2, 2], [2, -2], [-2, -2]],
  dabbaba: [[2, 0], [-2, 0], [0, 2], [0, -2]],
  forward: [[0, 1]], back: [[0, -1]], side: [[1, 0], [-1, 0]],
  fdiag: [[1, 1], [-1, 1]], bdiag: [[1, -1], [-1, -1]],
};
const sgn = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
const CAP = { yes: 0, no: 1, only: 2 };
const WHEN = { any: 0, crossed: 1, home: 2 };
const FL_EP = 1, FL_CASTLE = 2, FL_PASS = 4;

function symImages([x, y]) {
  const out = new Map();
  for (const [a, b] of [[x, y], [y, x]]) for (const sa of [1, -1]) for (const sb of [1, -1]) out.set(`${a * sa},${b * sb}`, [a * sa, b * sb]);
  return [...out.values()];
}

function expandDirs(list, sym) {
  const out = [];
  for (const e of list ?? []) {
    if (typeof e === 'string') { if (!SHORT[e]) throw new Error(`chess: unknown direction set "${e}"`); out.push(...SHORT[e]); }
    else if (Array.isArray(e) && e.length === 2) out.push(...(sym ? symImages(e) : [e]));
    else throw new Error('chess: dirs entries are names or [dc, dr] pairs');
  }
  return out;
}

// squares that must be empty between a leaper and its target (spec orientation: +dr forward)
function legVia(dc, dr) {
  const a = Math.abs(dc), b = Math.abs(dr);
  if (a === b) { const v = []; for (let i = 1; i < a; i++) v.push([sgn(dc) * i, sgn(dr) * i]); return v; }
  if (b > a) { const v = [[0, sgn(dr)]]; if (b === 3) v.push([sgn(dc), 2 * sgn(dr)]); return v; }
  const v = [[sgn(dc), 0]]; if (a === 3) v.push([2 * sgn(dc), sgn(dr)]);
  return v;
}

export function createRules(userParams = {}) {
  const P = { ...DEFAULTS, ...userParams };
  const cols = P.cols, rows = P.rows, N = cols * rows;
  const COL = new Int16Array(N), ROW = new Int16Array(N), ID = new Array(N);
  for (let i = 0; i < N; i++) { COL[i] = i % cols; ROW[i] = (i / cols) | 0; ID[i] = gid(COL[i], ROW[i]); }
  const sqOf = (c, r) => r * cols + c;
  const rel = (sq, o) => (o === 0 ? rows - 1 - ROW[sq] : ROW[sq]); // rank counted from the owner's back rank
  const absRow = (rk, o) => (o === 0 ? rows - 1 - rk : rk);

  // ---- palace, river, confinement ---------------------------------------------------------------------------
  const pmask = new Uint8Array(N); // palace diagonal edges: bit0 (+1,+1) bit1 (+1,-1) bit2 (-1,+1) bit3 (-1,-1) in screen coordinates
  const dirBit = (dc, dr) => (dc > 0 ? 0 : 2) + (dr > 0 ? 0 : 1);
  const palaceTab = [new Uint8Array(N), new Uint8Array(N)];
  const halfTab = [new Uint8Array(N), new Uint8Array(N)];
  if (P.palace) {
    const [c0, c1] = P.palace.cols, [r0, r1] = P.palace.rows;
    for (let o = 0; o < 2; o++) {
      for (let rk = r0; rk <= r1; rk++) for (let c = c0; c <= c1; c++) palaceTab[o][sqOf(c, absRow(rk, o))] = 1;
      if (P.palace.diagonals) {
        const cc = (c0 + c1) / 2, cr = absRow((r0 + r1) / 2, o);
        for (const c of [c0, c1]) for (const rk of [r0, r1]) {
          const r = absRow(rk, o), dc = sgn(cc - c), dr = sgn(cr - r);
          pmask[sqOf(c, r)] |= 1 << dirBit(dc, dr);
          pmask[sqOf(cc, cr)] |= 1 << dirBit(-dc, -dr);
        }
      }
    }
  }
  const crossedFrom = P.river ? P.river.ownRows : 1e9;
  if (P.river) for (let o = 0; o < 2; o++) for (let i = 0; i < N; i++) halfTab[o][i] = rel(i, o) < crossedFrom ? 1 : 0;
  const confTab = { palace: palaceTab, half: halfTab };

  // ---- piece table ------------------------------------------------------------------------------------------
  const keys = Object.keys(P.pieces ?? {});
  if (!keys.length) throw new Error('chess: params.pieces is required');
  const typeIdx = {};
  keys.forEach((k, i) => { if (k.length !== 1 || k === '.' || k === ' ') throw new Error(`chess: piece code "${k}" must be one character`); typeIdx[k] = i; });
  const PIECE_KEYS = new Set(['name', 'label', 'label1', 'royal', 'pawn', 'value', 'valueCrossed', 'promote', 'confine', 'moves']);
  const ITEM_KEYS = new Set(['kind', 'dirs', 'sym', 'range', 'capture', 'when', 'fromRank', 'palaceOnly', 'blockLeg', 'forbidScreen', 'forbidTarget']);
  const bad = (m) => { throw new Error(`chess: ${m}`); };
  if (!Array.isArray(P.setup) || !P.setup.length) bad('params.setup is required (array of rows from the back rank outward)');
  const T = keys.map((key, t) => {
    const d = P.pieces[key];
    for (const k of Object.keys(d)) if (!PIECE_KEYS.has(k)) bad(`piece "${key}": unknown field "${k}"`);
    if (d.confine && !confTab[d.confine]) bad(`piece "${key}": confine must be palace or half`);
    if (d.confine && !(d.confine === 'palace' ? P.palace : P.river)) bad(`piece "${key}": confine "${d.confine}" needs params.${d.confine === 'palace' ? 'palace' : 'river'}`);
    for (const it of d.moves ?? []) {
      for (const k of Object.keys(it)) if (!ITEM_KEYS.has(k)) bad(`piece "${key}": unknown move field "${k}"`);
      if (it.kind && !['leap', 'ride', 'hop'].includes(it.kind)) bad(`piece "${key}": kind must be leap, ride or hop`);
      if (it.capture && CAP[it.capture] === undefined) bad(`piece "${key}": capture must be yes, no or only`);
      if (it.when && WHEN[it.when] === undefined) bad(`piece "${key}": when must be any, crossed or home`);
      if (it.when === 'crossed' && !P.river) bad(`piece "${key}": when:"crossed" needs params.river`);
      if (it.palaceOnly && !P.palace?.diagonals) bad(`piece "${key}": palaceOnly needs params.palace.diagonals`);
    }
    const type = {
      t, key, name: d.name ?? key, label: d.label ?? key, label1: d.label1 ?? d.label ?? key,
      royal: !!d.royal, pawn: !!d.pawn, value: d.value ?? 100, valueCrossed: d.valueCrossed ?? d.value ?? 100,
      promote: d.promote ? { rank: d.promote.rank, to: d.promote.to.map((k) => { if (typeIdx[k] === undefined) throw new Error(`chess: promote.to "${k}" is not a piece`); return typeIdx[k]; }), optional: !!d.promote.optional } : null,
      conf: d.confine ? [confTab[d.confine][0], confTab[d.confine][1]] : null,
      items: [[], []],
    };
    for (let o = 0; o < 2; o++) {
      for (const it of d.moves ?? []) {
        const kind = it.kind ?? 'leap';
        const dirs = expandDirs(it.dirs, it.sym).map(([dc, dr]) => {
          const via = kind === 'leap' && it.blockLeg ? legVia(dc, dr) : [];
          const f = o === 0 ? -1 : 1;
          return { dc, dr: dr * f, via: via.map(([a, b]) => [a, b * f]), diag: Math.abs(dc) === Math.abs(dr) && dc !== 0 };
        });
        type.items[o].push({
          kind, dirs, range: it.range ?? 99, cap: CAP[it.capture ?? 'yes'], when: WHEN[it.when ?? 'any'],
          fromRank: it.fromRank ?? -1, palaceOnly: !!it.palaceOnly,
          forbidScreen: new Set((it.forbidScreen ?? []).map((k) => typeIdx[k])), forbidTarget: new Set((it.forbidTarget ?? []).map((k) => typeIdx[k])),
        });
      }
    }
    return type;
  });
  const royalType = T.findIndex((x) => x.royal);
  // plain riders (no palace/rank conditions) are grouped by direction so the attack test walks each ray once
  const rays = [[], []];
  for (let by = 0; by < 2; by++) {
    const byKey = new Map();
    for (const ty of T) for (const it of ty.items[by]) {
      if (it.kind !== 'ride' || it.cap === 1 || it.palaceOnly || it.when || it.fromRank >= 0) continue;
      it.grouped = true;
      for (const d of it.dirs) {
        const k = `${d.dc},${d.dr}`;
        if (!byKey.has(k)) byKey.set(k, { dc: d.dc, dr: d.dr, ent: [] });
        byKey.get(k).ent.push({ t: ty.t, range: it.range, ft: it.forbidTarget, conf: ty.conf ? ty.conf[by] : null });
      }
    }
    rays[by] = [...byKey.values()];
  }
  const checkMode = P.kingRule === 'check';

  // ---- castling (standard: king two squares toward a corner rook) -------------------------------------------
  let CA = null;
  if (P.castling) {
    const kt = typeIdx[P.castling.king], rt = typeIdx[P.castling.rook], row0 = P.setup[0];
    const kc = row0.indexOf(P.castling.king);
    let rl = -1, rr = -1;
    for (let c = 0; c < cols; c++) if (row0[c] === P.castling.rook) { if (c < kc) rl = c; if (c > kc && rr < 0) rr = c; }
    CA = { kt, rt, kc, rooks: [rl, rr] };
  }

  // ---- reverse attack test: can player `by` capture on `sq`? -----------------------------------------------------
  const edgeOk = (sq, dc, dr) => (pmask[sq] >> dirBit(dc, dr)) & 1;
  function presence(board, by) {
    let m = 0;
    for (let i = 0; i < N; i++) { const v = board[i]; if (v !== 0 && (v > 0) === (by === 0)) m |= 1 << (Math.abs(v) - 1); }
    return m;
  }
  // mask: bit t set when player `by` may have a piece of type t (superset is fine); computed when omitted
  function attacked(board, sq, by, mask = presence(board, by)) {
    const sc = COL[sq], sr = ROW[sq];
    const tv = board[sq], tt = tv === 0 ? -1 : Math.abs(tv) - 1;
    const rl = rays[by];
    for (let ri = 0; ri < rl.length; ri++) {
      const d = rl[ri];
      let c = sc, r = sr;
      for (let k = 1; ; k++) {
        c -= d.dc; r -= d.dr;
        if (c < 0 || r < 0 || c >= cols || r >= rows) break;
        const v = board[r * cols + c];
        if (v === 0) continue;
        if ((v > 0) === (by === 0)) {
          const t = Math.abs(v) - 1;
          if (mask & (1 << t)) {
            for (const e of d.ent) if (e.t === t && k <= e.range && (tt < 0 || !e.ft.has(tt)) && (!e.conf || e.conf[sq])) return true;
          }
        }
        break;
      }
    }
    for (let t = 0; t < T.length; t++) {
      if (!(mask & (1 << t))) continue;
      const ty = T[t];
      if (ty.conf && !ty.conf[by][sq]) continue;
      const code = by === 0 ? t + 1 : -(t + 1);
      const items = ty.items[by];
      for (let ii = 0; ii < items.length; ii++) {
        const it = items[ii];
        if (it.cap === 1 || it.grouped) continue;
        if (tt >= 0 && it.forbidTarget.has(tt)) continue;
        const dirs = it.dirs;
        for (let di = 0; di < dirs.length; di++) {
          const d = dirs[di];
          if (it.kind === 'leap') {
            const fc = sc - d.dc, fr = sr - d.dr;
            if (fc < 0 || fr < 0 || fc >= cols || fr >= rows) continue;
            const f = fr * cols + fc;
            if (board[f] !== code) continue;
            if (it.when || it.fromRank >= 0) {
              const rk = rel(f, by);
              if (it.when === 1 && rk < crossedFrom) continue;
              if (it.when === 2 && rk >= crossedFrom) continue;
              if (it.fromRank >= 0 && rk !== it.fromRank) continue;
            }
            let ok = true;
            for (const v of d.via) if (board[(fr + v[1]) * cols + fc + v[0]] !== 0) { ok = false; break; }
            if (!ok) continue;
            if (it.palaceOnly && d.diag) {
              const s1 = sgn(d.dc), s2 = sgn(d.dr), n = Math.abs(d.dc);
              for (let k = 0; k < n; k++) if (!edgeOk(sqOf(fc + s1 * k, fr + s2 * k), s1, s2)) { ok = false; break; }
              if (!ok) continue;
            }
            return true;
          } else if (it.kind === 'ride') {
            let c = sc, r = sr;
            for (let k = 1; k <= it.range; k++) {
              const pc = c, pr = r; c -= d.dc; r -= d.dr;
              if (c < 0 || r < 0 || c >= cols || r >= rows) break;
              const s = r * cols + c;
              if (it.palaceOnly && d.diag && !edgeOk(s, d.dc, d.dr)) break;
              const v = board[s];
              if (v === 0) continue;
              if (v === code) {
                const rk = rel(s, by);
                if ((it.when !== 1 || rk >= crossedFrom) && (it.when !== 2 || rk < crossedFrom) && (it.fromRank < 0 || rk === it.fromRank)) return true;
              }
              break;
            }
          } else { // hop: screen, then the first piece beyond it
            let c = sc, r = sr, seenScreen = false;
            for (;;) {
              c -= d.dc; r -= d.dr;
              if (c < 0 || r < 0 || c >= cols || r >= rows) break;
              const s = r * cols + c;
              if (it.palaceOnly && d.diag && !edgeOk(s, d.dc, d.dr)) break;
              const v = board[s];
              if (v === 0) continue;
              if (!seenScreen) { if (it.forbidScreen.has(Math.abs(v) - 1)) break; seenScreen = true; continue; }
              if (v === code) return true;
              break;
            }
          }
        }
      }
    }
    return false;
  }

  // ---- pseudo-legal generation ------------------------------------------------------------------------------
  // out entries: { a, b, pr, fl, rf, rt, g }
  function emit(out, sq, to, captured, ty, o) {
    const gain = captured ? T[Math.abs(captured) - 1].value / 10 : 0;
    if (ty.promote && rel(to, o) >= ty.promote.rank) {
      for (const p of ty.promote.to) out.push({ a: sq, b: to, pr: p, fl: 0, rf: -1, rt: -1, g: gain + T[p].value / 10 });
      if (ty.promote.optional) out.push({ a: sq, b: to, pr: -1, fl: 0, rf: -1, rt: -1, g: gain });
    } else out.push({ a: sq, b: to, pr: -1, fl: 0, rf: -1, rt: -1, g: gain });
  }

  // generates from square `from`; with stopAny it returns after the first square that produced moves (lazy legality
  // checks for leaf nodes). Returns the next square to continue from (N when finished).
  function gen(board, s, o, out, capsOnly = false, from = 0, stopAny = false) {
    for (let sq = from; sq < N; sq++) {
      if (stopAny && out.length) return sq;
      const v = board[sq];
      if (v === 0 || (v > 0) !== (o === 0)) continue;
      const t = Math.abs(v) - 1, ty = T[t];
      const items = ty.items[o];
      const c0 = COL[sq], r0 = ROW[sq], rk = rel(sq, o), conf = ty.conf ? ty.conf[o] : null;
      for (let ii = 0; ii < items.length; ii++) {
        const it = items[ii];
        if (it.when === 1 && rk < crossedFrom) continue;
        if (it.when === 2 && rk >= crossedFrom) continue;
        if (it.fromRank >= 0 && rk !== it.fromRank) continue;
        if (capsOnly && it.cap === 1) continue;
        const dirs = it.dirs;
        for (let di = 0; di < dirs.length; di++) {
          const d = dirs[di];
          if (it.kind === 'leap') {
            const c = c0 + d.dc, r = r0 + d.dr;
            if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
            const to = r * cols + c;
            if (conf && !conf[to]) continue;
            let ok = true;
            for (const vv of d.via) if (board[(r0 + vv[1]) * cols + c0 + vv[0]] !== 0) { ok = false; break; }
            if (!ok) continue;
            if (it.palaceOnly && d.diag) {
              const s1 = sgn(d.dc), s2 = sgn(d.dr), n = Math.abs(d.dc);
              for (let k = 0; k < n; k++) if (!edgeOk(sqOf(c0 + s1 * k, r0 + s2 * k), s1, s2)) { ok = false; break; }
              if (!ok) continue;
            }
            const tv = board[to];
            if (tv === 0) {
              if (it.cap !== 2) { if (!capsOnly) emit(out, sq, to, 0, ty, o); }
              else if (s.ep === to && ty.pawn && P.enPassant) out.push({ a: sq, b: to, pr: -1, fl: FL_EP, rf: -1, rt: -1, g: 10 });
            } else if ((tv > 0) !== (o === 0)) {
              if (it.cap !== 1 && !it.forbidTarget.has(Math.abs(tv) - 1)) emit(out, sq, to, tv, ty, o);
            }
          } else if (it.kind === 'ride') {
            let c = c0, r = r0;
            for (let k = 1; k <= it.range; k++) {
              if (it.palaceOnly && d.diag && !edgeOk(sqOf(c, r), d.dc, d.dr)) break;
              c += d.dc; r += d.dr;
              if (c < 0 || r < 0 || c >= cols || r >= rows) break;
              const to = r * cols + c;
              if (conf && !conf[to]) break;
              const tv = board[to];
              if (tv === 0) { if (it.cap !== 2 && !capsOnly) emit(out, sq, to, 0, ty, o); continue; }
              if ((tv > 0) !== (o === 0) && it.cap !== 1 && !it.forbidTarget.has(Math.abs(tv) - 1)) emit(out, sq, to, tv, ty, o);
              break;
            }
          } else { // hop
            let c = c0, r = r0, screen = false;
            for (;;) {
              if (it.palaceOnly && d.diag && !edgeOk(sqOf(c, r), d.dc, d.dr)) break;
              c += d.dc; r += d.dr;
              if (c < 0 || r < 0 || c >= cols || r >= rows) break;
              const to = r * cols + c;
              const tv = board[to];
              if (!screen) {
                if (tv === 0) continue;
                if (it.forbidScreen.has(Math.abs(tv) - 1)) break;
                screen = true; continue;
              }
              if (tv === 0) { if (it.cap !== 2 && !capsOnly) emit(out, sq, to, 0, ty, o); continue; }
              if ((tv > 0) !== (o === 0) && it.cap !== 1 && !it.forbidTarget.has(Math.abs(tv) - 1)) emit(out, sq, to, tv, ty, o);
              break;
            }
          }
        }
      }
      // castling
      if (CA && !capsOnly && t === CA.kt && s.cr) {
        const home = sqOf(CA.kc, absRow(0, o));
        if (sq === home) {
          for (let side = 0; side < 2; side++) {
            if (!(s.cr & (1 << (o * 2 + side))) || CA.rooks[side] < 0) continue;
            const rsq = sqOf(CA.rooks[side], absRow(0, o));
            if (board[rsq] !== (o === 0 ? CA.rt + 1 : -(CA.rt + 1))) continue;
            const dir = side === 0 ? -1 : 1;
            let clear = true;
            for (let c = Math.min(CA.kc, CA.rooks[side]) + 1; c < Math.max(CA.kc, CA.rooks[side]); c++) if (board[sqOf(c, absRow(0, o))] !== 0) { clear = false; break; }
            if (!clear) continue;
            if (attacked(board, home, 1 - o) || attacked(board, sqOf(CA.kc + dir, absRow(0, o)), 1 - o) || attacked(board, sqOf(CA.kc + 2 * dir, absRow(0, o)), 1 - o)) continue;
            out.push({ a: home, b: sqOf(CA.kc + 2 * dir, absRow(0, o)), pr: -1, fl: FL_CASTLE, rf: rsq, rt: sqOf(CA.kc + dir, absRow(0, o)), g: 1 });
          }
        }
      }
    }
    return N;
  }

  function royals(board) {
    const k = [-1, -1];
    if (royalType < 0) return k;
    for (let i = 0; i < N; i++) {
      const v = board[i];
      if (v !== 0 && T[Math.abs(v) - 1].royal) k[v > 0 ? 0 : 1] = i;
    }
    return k;
  }

  const facing = (board, k0, k1) => {
    if (k0 < 0 || k1 < 0 || COL[k0] !== COL[k1]) return false;
    const c = COL[k0], lo = Math.min(ROW[k0], ROW[k1]), hi = Math.max(ROW[k0], ROW[k1]);
    for (let r = lo + 1; r < hi; r++) if (board[r * cols + c] !== 0) return false;
    return true;
  };

  // is `m` legal for player o? Works on `board` in place and restores it.
  function legalMove(board, s, m, o, ks, emask) {
    if (!checkMode && P.facingGenerals !== 'illegal') return true;
    const pa = board[m.a], pb = board[m.b];
    let epSq = -1, epV = 0, rv = 0;
    if (m.fl === FL_EP) { epSq = s.epp; epV = board[epSq]; board[epSq] = 0; }
    if (m.fl === FL_CASTLE) { rv = board[m.rf]; board[m.rt] = rv; board[m.rf] = 0; }
    if (m.fl !== FL_PASS) { board[m.b] = m.pr >= 0 ? (o === 0 ? m.pr + 1 : -(m.pr + 1)) : pa; board[m.a] = 0; }
    const isRoyal = T[Math.abs(pa) - 1].royal;
    const nk = isRoyal ? m.b : ks[o];
    let bad = false;
    if (checkMode && nk >= 0 && attacked(board, nk, 1 - o, emask)) bad = true;
    if (!bad && P.facingGenerals === 'illegal') {
      const k0 = o === 0 ? nk : ks[0], k1 = o === 1 ? nk : ks[1];
      if (facing(board, k0, k1)) bad = true;
    }
    if (m.fl !== FL_PASS) { board[m.a] = pa; board[m.b] = pb; }
    if (m.fl === FL_EP) board[epSq] = epV;
    if (m.fl === FL_CASTLE) { board[m.rf] = rv; board[m.rt] = 0; }
    return !bad;
  }

  function inCheck(board, o) {
    if (!checkMode) return false;
    const ks = royals(board);
    return ks[o] >= 0 && attacked(board, ks[o], 1 - o);
  }

  const cache = new WeakMap(); // state -> legal move list
  const termCache = new WeakMap();
  const idMove = (m) => ({ from: ID[m.a], to: ID[m.b], a: m.a, b: m.b, pr: m.pr, fl: m.fl, rf: m.rf, rt: m.rt, gain: m.g });

  function legal(s, firstOnly = false) {
    const hit = cache.get(s);
    if (hit) return hit;
    const o = s.turn, board = Int8Array.from(s.board);
    const ks = royals(board);
    const out = [];
    const em = presence(board, 1 - o);
    if (firstOnly) {
      let from = 0;
      while (from < N) {
        const list = [];
        from = gen(board, s, o, list, false, from, true);
        for (const m of list) if (legalMove(board, s, m, o, ks, em)) return [idMove(m)];
      }
      if (P.pass && ks[o] >= 0) { const m = { a: ks[o], b: ks[o], pr: -1, fl: FL_PASS, rf: -1, rt: -1, g: -5 }; if (legalMove(board, s, m, o, ks, em)) return [idMove(m)]; }
      return out;
    }
    const list = [];
    gen(board, s, o, list);
    if (P.pass && ks[o] >= 0) list.push({ a: ks[o], b: ks[o], pr: -1, fl: FL_PASS, rf: -1, rt: -1, g: -5 });
    for (const m of list) if (legalMove(board, s, m, o, ks, em)) out.push(idMove(m));
    cache.set(s, out);
    return out;
  }

  // ---- state transitions ------------------------------------------------------------------------------------
  function hashOf(board, turn, cr, ep) {
    let h = (2166136261 ^ (turn + 1)) | 0;
    for (let i = 0; i < N; i++) { const v = board[i]; if (v !== 0) h = Math.imul(h ^ (i * 64 + v + 32), 16777619); }
    h = Math.imul(h ^ (cr + 7), 16777619);
    return (Math.imul(h ^ (ep + 3), 16777619)) | 0;
  }

  function init() {
    const board = new Array(N).fill(0);
    P.setup.forEach((rowStr, rk) => {
      for (let c = 0; c < cols; c++) {
        const ch = rowStr[c];
        if (!ch || ch === '.' || ch === ' ') continue;
        const t = typeIdx[ch];
        if (t === undefined) throw new Error(`chess: setup uses unknown piece "${ch}"`);
        board[sqOf(c, absRow(rk, 0))] = t + 1;
        const c1 = P.setupSymmetry === 'rotate' ? cols - 1 - c : c;
        board[sqOf(c1, absRow(rk, 1))] = -(t + 1);
      }
    });
    const cr = CA ? 15 : 0;
    return { board, turn: P.firstMove, plies: 0, cr, ep: -1, epp: -1, hist: [hashOf(board, P.firstMove, cr, -1)], hc: 0, cm: 0, cs: 0, cl: 0, bare: -1, res: null, last: null };
  }

  const crClear = (cr, sq) => {
    if (!CA) return cr;
    for (let o = 0; o < 2; o++) {
      const home = sqOf(CA.kc, absRow(0, o));
      if (sq === home) cr &= ~(3 << (o * 2));
      for (let side = 0; side < 2; side++) if (CA.rooks[side] >= 0 && sq === sqOf(CA.rooks[side], absRow(0, o))) cr &= ~(1 << (o * 2 + side));
    }
    return cr;
  };

  function apply(s, m) {
    const o = s.turn, q = 1 - o, b = s.board.slice();
    const a = m.a, to = m.b;
    const piece = b[a], t = Math.abs(piece) - 1, ty = T[t];
    let cap = m.fl === FL_PASS ? 0 : b[to];
    if (m.fl === FL_EP) { cap = b[s.epp]; b[s.epp] = 0; }
    let cr = s.cr, ep = -1, epp = -1;
    if (m.fl !== FL_PASS) {
      b[a] = 0;
      b[to] = m.pr >= 0 ? (o === 0 ? m.pr + 1 : -(m.pr + 1)) : piece;
      if (m.fl === FL_CASTLE) { b[m.rt] = b[m.rf]; b[m.rf] = 0; }
      cr = crClear(crClear(cr, a), to);
      if (P.enPassant && ty.pawn && COL[a] === COL[to] && Math.abs(ROW[a] - ROW[to]) === 2) { ep = sqOf(COL[a], (ROW[a] + ROW[to]) / 2); epp = to; }
    }
    const irreversible = cap !== 0 || ty.pawn || cr !== s.cr || m.fl === FL_CASTLE;
    const plies = s.plies + 1;
    const hc = irreversible ? 0 : s.hc + 1;
    const h = hashOf(b, q, cr, ep);
    const hist = irreversible ? [h] : s.hist.concat(h);
    const next = {
      board: b, turn: q, plies, cr, ep, epp, hist, hc, cm: s.cm, cs: s.cs, cl: s.cl, bare: -1, res: null,
      last: { path: [ID[a], ID[to]], to: ID[to], captured: cap !== 0 ? [ID[m.fl === FL_EP ? s.epp : to]] : [], gain: cap !== 0 ? 1 : 0 },
    };

    // one scan: material per side, pawns, royals
    const nonRoyal = [0, 0], royalCount = [0, 0], pawns = [0, 0];
    const counts = [new Array(T.length).fill(0), new Array(T.length).fill(0)];
    for (let i = 0; i < N; i++) {
      const v = b[i];
      if (v === 0) continue;
      const w = v > 0 ? 0 : 1, tt = Math.abs(v) - 1;
      if (T[tt].royal) royalCount[w]++; else nonRoyal[w]++;
      if (T[tt].pawn) pawns[w]++;
      counts[w][tt]++;
    }
    let res = null;
    if (cap !== 0 && T[Math.abs(cap) - 1].royal && (P.kingRule === 'capture' || royalCount[q] === 0)) res = o;
    if (res === null && s.bare === o) {
      // the player who was bared had one reply: if they bared the baring player too it is a draw, else the baring player wins
      res = nonRoyal[q] === 0 ? 'draw' : q;
    }
    if (res === null && royalType >= 0 && nonRoyal[0] === 0 && nonRoyal[1] === 0 && royalCount[0] > 0 && royalCount[1] > 0) res = 'draw';
    if (res === null && P.bareKing !== 'none' && nonRoyal[q] === 0 && royalCount[q] > 0) {
      if (nonRoyal[o] === 0) res = 'draw';
      else if (P.bareKing === 'loss') res = o;
      else next.bare = q; // delayed: q may reply once; baring back is a draw
    }
    if (res === null && P.facingGenerals === 'draw') {
      const ks = royals(b);
      if (facing(b, ks[0], ks[1])) res = 'draw';
    }
    if (res === null && P.counting && pawns[0] + pawns[1] === 0 && royalType >= 0) {
      let mode = 1, limit = P.counting.honour ?? 64;
      const weak = nonRoyal[0] === 0 ? 0 : nonRoyal[1] === 0 ? 1 : -1;
      if (weak >= 0 && nonRoyal[1 - weak] > 0) {
        mode = 2; limit = P.counting.bareDefault ?? 64;
        const c = counts[1 - weak];
        for (const rule of P.counting.bare ?? []) {
          if (Object.entries(rule.pieces).every(([k, n]) => c[typeIdx[k]] >= n)) { limit = rule.limit; break; }
        }
      }
      if (next.cm !== mode || next.cl !== limit) { next.cm = mode; next.cl = limit; next.cs = plies; }
      if (plies - next.cs >= 2 * next.cl) res = 'draw';
    } else if (P.counting && pawns[0] + pawns[1] > 0) { next.cm = 0; next.cl = 0; next.cs = plies; }
    if (res === null && P.repetition > 1) {
      let n = 0;
      for (let i = 0; i < hist.length; i++) if (hist[i] === h) n++;
      if (n >= P.repetition) res = 'draw';
    }
    if (res === null && P.halfmoveLimit > 0 && hc >= P.halfmoveLimit) res = 'draw';
    if (res === null && plies >= P.maxPlies) res = 'draw';
    next.res = res;
    return next;
  }

  function winner(s) {
    if (s.res !== null && s.res !== undefined) return s.res;
    let r = termCache.get(s);
    if (r !== undefined) return r;
    r = null;
    const o = s.turn;
    if (legal(s, true).length === 0) {
      r = inCheck(s.board, o) ? 1 - o : P.stalemate === 'loss' ? 1 - o : P.stalemate === 'win' ? o : 'draw';
    }
    termCache.set(s, r);
    return r;
  }

  function moves(s) {
    if (s.res !== null && s.res !== undefined) return [];
    return legal(s, false);
  }

  // ---- evaluation -----------------------------------------------------------------------------------------
  const cen = new Int16Array(N);
  for (let i = 0; i < N; i++) cen[i] = Math.round(4 * ((cols / 2 - Math.abs(COL[i] + 0.5 - cols / 2)) / (cols / 2) + (rows / 2 - Math.abs(ROW[i] + 0.5 - rows / 2)) / (rows / 2)));

  function evaluate(s, player) {
    const b = s.board;
    let mat0 = 0, mat1 = 0, pos0 = 0, pos1 = 0, k0 = -1, k1 = -1;
    const pm = [0, 0];
    for (let i = 0; i < N; i++) {
      const v = b[i];
      if (v === 0) continue;
      const o = v > 0 ? 0 : 1, ty = T[Math.abs(v) - 1], rk = rel(i, o);
      pm[o] |= 1 << ty.t;
      if (ty.royal) { if (o === 0) k0 = i; else k1 = i; continue; }
      let val = rk >= crossedFrom ? ty.valueCrossed : ty.value, p = 0;
      if (ty.pawn) p = rk * 4; else p = cen[i];
      if (o === 0) { mat0 += val; pos0 += p; } else { mat1 += val; pos1 += p; }
    }
    let score = (mat0 - mat1) + (pos0 - pos1);
    // converting an advantage: drive the bare side's royal to the edge and bring ours close
    const diff = mat0 - mat1;
    if (k0 >= 0 && k1 >= 0 && Math.abs(diff) >= 250) {
      const strong = diff > 0 ? k0 : k1, weak = diff > 0 ? k1 : k0;
      const toEdge = Math.abs(COL[weak] + 0.5 - cols / 2) + Math.abs(ROW[weak] + 0.5 - rows / 2);
      const dist = Math.abs(COL[strong] - COL[weak]) + Math.abs(ROW[strong] - ROW[weak]);
      const bonus = 12 * toEdge - 6 * dist;
      score += diff > 0 ? bonus : -bonus;
    }
    // hanging pieces: the side to move wins the most valuable capture that is not defended
    let swing = 0;
    const caps = [];
    gen(b, s, s.turn, caps, true);
    for (const m of caps) {
      const victim = b[m.b], mover = b[m.a];
      if (victim === 0) continue;
      const vv = T[Math.abs(victim) - 1];
      if (vv.royal) { swing = Math.max(swing, 50); continue; }
      const vVal = (rel(m.b, 1 - s.turn) >= crossedFrom ? vv.valueCrossed : vv.value);
      const defended = attacked(b, m.b, 1 - s.turn, pm[1 - s.turn]);
      const net = defended ? vVal - T[Math.abs(mover) - 1].value : vVal;
      if (net > swing) swing = net;
    }
    score += s.turn === 0 ? swing : -swing;
    return player === 0 ? score : -score;
  }

  // ---- presentation -----------------------------------------------------------------------------------------
  const points = P.style === 'points';
  const mg = 0.55;
  const W = points ? cols - 1 + 2 * mg : cols, H = points ? rows - 1 + 2 * mg : rows;
  const nodes = [];
  const rad = (points ? 0.43 : 0.5) / Math.min(W, H);
  for (let i = 0; i < N; i++) {
    nodes.push({
      id: ID[i], x: ((points ? mg + COL[i] : COL[i] + 0.5)) / W, y: ((points ? mg + ROW[i] : ROW[i] + 0.5)) / H,
      r: rad, shape: points ? 'dot' : 'cell', ...(points ? {} : { tone: (COL[i] + ROW[i]) % 2 }),
    });
  }
  const lines = [];
  if (points) {
    for (let r = 0; r < rows; r++) lines.push([ID[sqOf(0, r)], ID[sqOf(cols - 1, r)]]);
    for (let c = 0; c < cols; c++) {
      if (!P.river || c === 0 || c === cols - 1) lines.push([ID[sqOf(c, 0)], ID[sqOf(c, rows - 1)]]);
      else {
        const cut = absRow(P.river.ownRows, 0) + 0; // first row of the upper half's last rank
        lines.push([ID[sqOf(c, 0)], ID[sqOf(c, cut)]]);
        lines.push([ID[sqOf(c, cut + 1)], ID[sqOf(c, rows - 1)]]);
      }
    }
    if (P.palace?.diagonals) {
      const [c0, c1] = P.palace.cols, [r0, r1] = P.palace.rows;
      for (let o = 0; o < 2; o++) {
        const ra = absRow(r0, o), rb = absRow(r1, o);
        lines.push([ID[sqOf(c0, ra)], ID[sqOf(c1, rb)]]);
        lines.push([ID[sqOf(c1, ra)], ID[sqOf(c0, rb)]]);
      }
    }
  }

  function describe(s) {
    const pieces = [];
    for (let i = 0; i < N; i++) {
      const v = s.board[i];
      if (v === 0) continue;
      const o = v > 0 ? 0 : 1, ty = T[Math.abs(v) - 1];
      pieces.push({ node: ID[i], owner: o, kind: ty.royal ? 'king' : ty.key, label: o === 0 ? ty.label : ty.label1 });
    }
    const res = winner(s);
    let status = '';
    if (res === null && inCheck(s.board, s.turn)) status = 'Check';
    return { aspect: W / H, nodes, lines, pieces, last: s.last ? s.last.path : [], status };
  }

  return { id: 'chess', players: 2, init, moves, apply, winner, evaluate, describe, pieceTable: T.map((x) => ({ key: x.key, name: x.name })) };
}

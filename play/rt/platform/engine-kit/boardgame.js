// Generic presenter + flow for turn-based abstract board games. An engine supplies only a RULES module:
//   rules = { id, init(params, rng) -> state, moves(state) -> move[], apply(state, move) -> state, winner(state) -> null|0|1|'draw',
//             evaluate(state, player) -> number, describe(state) -> { aspect, nodes, lines, pieces, scores?, players?, last?, status? },
//             chance?(state) -> null | [{ p, state }] }
// state is plain JSON with numeric `turn` (whose move it is). A move is JSON; the UI understands move.from / move.to
// (node ids): "from only" = tap that node to play it (sowing, passing), "to only" = placement, both = select then target.
// Everything drawn is derived from describe(); all timing comes from dt, all randomness from env.rng (kit contract).
import { chooseMove, LEVELS } from './ai.js';
import { createUI, shade, rgba } from './ui.js';

const PALETTE = { bg: '#17212b', panel: '#223140', board: '#c9a86a', line: '#4a3820', cell0: '#d9bb82', cell1: '#b8935a', node: '#4a3820', p0: '#d64b3c', p1: '#2d7bd6', accent: '#f2c14e', ink: '#f5f1e8', dim: '#9fb0c3', good: '#58c27d' };
const AI_DELAY = 0.55;
const MAX_PLIES = 1500;

export function createBoardEngine({ rules, spec = {}, theme = {}, text = {}, title = null, options = {} }) {
  const params = spec.params ?? {};
  const pal = { ...PALETTE, ...(theme.palette ?? {}) };
  const meta = { width: 720, height: 1280, fluid: { short: 720 } };
  const T = {
    title: title ?? text.title ?? rules.id ?? 'Game',
    native: text.native ?? '',
    summary: text.summary ?? '',
    countries: text.countries ?? [],
    howToPlay: text.howToPlay ?? [],
    rules: text.rules ?? [],
    heritage: text.heritageNote ?? '',
  };

  function createGame(env) {
    const { rng, storage, audio } = env;
    const zoom = () => Math.min(3, Math.max(0.6, Number(env.config?.textScale ?? env.config?.zoom ?? 1) || 1));
    const px = (base) => Math.max(base * zoom(), 12 / (meta.cssPerUnit || 1));
    const autoplay = options.autoplay === true; // attract mode: both sides computer, pointer ignored (store screenshots, previews)
    const ui = createUI({ pal, meta, px, audio, config: env.config, options, name: T.title, theme });
    const firstSentence = (s) => { const m = /^.{20,}?[.!?](\s|$)/.exec(String(s)); return m ? m[0].trim() : String(s).slice(0, 140); };
    let drag = null, maxScroll = 0, bestNew = false, shownResult = false;
    const state = { scene: autoplay ? 'play' : 'title', mode: autoplay ? 'watch' : 'ai', human: 0, level: 'normal', game: rules.init(params, rng.fork()), history: [], ply: 0, selected: null, msg: '', t: 0, wait: 0, overT: 0, hint: null, page: 0, scroll: 0, sceneT: 0, winner: null, moveT: -9, resT: 0 };
    
    storage.get('prefs', null).then((v) => { if (v) { if (LEVELS.some((l) => l.id === v.level)) state.level = v.level; if (v.mode === 'ai' || v.mode === 'two') state.mode = v.mode; } });
    const savePrefs = () => storage.set('prefs', { level: state.level, mode: state.mode });

    const newGame = () => { Object.assign(state, { game: rules.init(params, rng.fork()), history: [], ply: 0, selected: null, msg: '', wait: AI_DELAY, overT: 0, hint: null, winner: null, moveT: -9 }); shownResult = false; };
    const go = (scene) => { state.scene = scene; state.sceneT = 0; state.scroll = 0; };
    const humanTurn = () => state.mode === 'two' || (state.mode === 'ai' && state.game.turn === state.human);

    const playMove = (m) => {
      state.history.push(state.game);
      state.game = rules.apply(state.game, m);
      state.ply++; state.selected = null; state.hint = null; state.msg = ''; state.wait = AI_DELAY;
      const cap = state.game.last?.captured?.length ?? state.game.last?.gain ?? 0;
      if (cap) { ui.sfx.hit(); ui.sfx.miss(); } else ui.sfx.select();
      state.moveT = state.t;
    };
    const undo = () => {
      if (!state.history.length) return;
      const steps = state.mode === 'ai' ? 2 : 1;
      if (state.mode === 'watch') return;
      for (let i = 0; i < steps && state.history.length; i++) state.game = state.history.pop();
      state.ply = Math.max(0, state.ply - steps); state.selected = null; state.hint = null; state.winner = null; state.msg = '';
      if (state.mode === 'ai' && state.game.turn !== state.human && state.history.length) { state.game = state.history.pop(); state.ply = Math.max(0, state.ply - 1); }
    };

    // ---- geometry ---------------------------------------------------------------------------------------------
    const boardRect = (aspect) => {
      const W = meta.width, H = meta.height;
      const top = px(78) + 20, bottom = px(70) + 30;
      const areaW = W - 24, areaH = H - top - bottom;
      let w = areaW, h = w / aspect;
      if (h > areaH) { h = areaH; w = h * aspect; }
      return { x: (W - w) / 2, y: top + (areaH - h) / 2, w, h };
    };
    const nodeAt = (d, rect, x, y) => {
      let best = null, bd = Infinity;
      for (const n of d.nodes) {
        const nx = rect.x + n.x * rect.w, ny = rect.y + n.y * rect.h;
        const r = Math.max(14, (n.r ?? 0.04) * Math.min(rect.w, rect.h));
        const dist = Math.hypot(nx - x, ny - y);
        if (dist <= r * 1.35 && dist < bd) { best = n.id; bd = dist; }
      }
      return best;
    };

    // ---- input ------------------------------------------------------------------------------------------------
    const tapBoard = (x, y) => {
      if (!humanTurn() || state.winner !== null) return;
      const d = rules.describe(state.game), rect = boardRect(d.aspect ?? 1);
      const n = nodeAt(d, rect, x, y);
      if (n === null) { state.selected = null; return; }
      const moves = rules.moves(state.game);
      if (state.selected !== null) {
        const hit = moves.find((m) => m.from === state.selected && m.to === n);
        if (hit) return playMove(hit);
      }
      const direct = moves.find((m) => (m.from === n && m.to === undefined) || (m.from === undefined && m.to === n));
      if (direct && !moves.some((m) => m.from === n && m.to !== undefined)) return playMove(direct);
      if (moves.some((m) => m.from === n && m.to !== undefined)) { state.selected = n; state.msg = ''; return; }
      state.selected = null;
      state.msg = text.illegal ?? 'That is not a legal move.';
    };

    const press = (id) => {
      ui.press(id);
      if (id === 'back' || id === 'menu') ui.sfx.back(); else if (id === 'up' || id === 'down') ui.sfx.whoosh(); else ui.sfx.tap();
      if (id === 'ai') { state.mode = 'ai'; savePrefs(); newGame(); go('play'); }
      else if (id === 'two') { state.mode = 'two'; savePrefs(); newGame(); go('play'); }
      else if (id === 'watch') { state.mode = 'watch'; newGame(); go('play'); }
      else if (id === 'level') { const i = LEVELS.findIndex((l) => l.id === state.level); state.level = LEVELS[(i + 1) % LEVELS.length].id; savePrefs(); }
      else if (id === 'side') { state.human = 1 - state.human; }
      else if (id === 'howto') { state.page = 0; go('rules'); }
      else if (id === 'menu') go('title');
      else if (id === 'back') go(state.history.length || state.ply ? 'play' : 'title');
      else if (id === 'undo') undo();
      else if (id === 'new' || id === 'again') { newGame(); go('play'); }
      else if (id === 'hint') {
        if (humanTurn() && state.winner === null) { const m = chooseMove(rules, state.game, { level: 'hard' }); state.hint = m ? { from: m.from, to: m.to } : null; }
      } else if (id === 'up') state.scroll = Math.max(0, state.scroll - 220);
      else if (id === 'down') state.scroll = Math.min(maxScroll || 1e9, state.scroll + 220);
    };

    // ---- flow -------------------------------------------------------------------------------------------------
    if (options.begin === true && !autoplay) press('ai'); // bucket apps: About + How to play were shown on the previous page

    const update = (dt, input) => {
      state.t += dt; state.sceneT += dt;
      ui.update(dt, input);
      const p = input.pointer;
      if (p.pressed && !autoplay) {
        const id = ui.hit(p.x, p.y);
        if (id) press(id);
        else if (state.scene === 'play') tapBoard(p.x, p.y);
        else if (state.scene === 'rules') drag = { y: p.y, s: state.scroll };
      }
      if (drag) { if (p.down) state.scroll = Math.max(0, Math.min(maxScroll || 1e9, drag.s - (p.y - drag.y))); else drag = null; }
      if (input.wheel && state.scene === 'rules') state.scroll = Math.max(0, Math.min(maxScroll || 1e9, state.scroll + input.wheel.dy));
      if (!autoplay && state.scene === 'title' && input.keys?.pressed?.has('Enter')) press('ai'); // keyboard: Enter starts a game against the computer
      if (state.scene !== 'play') return;
      if (state.winner === null) {
        const w = rules.winner(state.game);
        if (w !== null && w !== undefined) { state.winner = w; state.overT = 0; state.resT = 0; }
        else if (state.ply >= MAX_PLIES) { state.winner = 'draw'; state.overT = 0; }
      }
      if (state.winner !== null) {
        const prev = state.overT; state.overT += dt;
        const youWon = state.winner !== 'draw' && (state.mode !== 'ai' || state.winner === state.human);
        ui.resultTick(prev, state.overT, { stars: 0, win: youWon, newBest: false });
        if (autoplay && !options.shot && state.overT > 5) { newGame(); }   // attract mode loops so previews never freeze
        return;
      }
      state.wait -= dt;
      if (state.wait > 0) return;
      const outcomes = rules.chance ? rules.chance(state.game) : null;
      if (outcomes) { // chance node: sampled from env.rng, never by the player's input
        let r = rng.next(), pick = outcomes[outcomes.length - 1];
        for (const o of outcomes) { if (r < o.p) { pick = o; break; } r -= o.p; }
        state.history.push(state.game); state.game = pick.state; state.wait = 0.25; return;
      }
      if (!humanTurn()) {
        const m = chooseMove(rules, state.game, { level: state.mode === 'watch' ? 'normal' : state.level, rng });
        if (m) playMove(m); else { state.winner = 'draw'; }
      }
    };

    // ---- drawing ----------------------------------------------------------------------------------------------
    const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
    const label = (ctx, s, x, y, size, color = pal.ink, align = 'center', weight = '600') => { ctx.fillStyle = color; ctx.font = `${weight} ${Math.round(size)}px system-ui, sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(String(s), x, y); };
    const wrap = (ctx, s, maxW, size) => {
      ctx.font = `400 ${Math.round(size)}px system-ui, sans-serif`;
      const lines = []; let line = '';
      for (const word of String(s).split(' ')) { const next = line ? `${line} ${word}` : word; if (line && ctx.measureText(next).width > maxW) { lines.push(line); line = word; } else line = next; }
      if (line) lines.push(line); return lines;
    };
    const button = (ctx, id, text_, x, y, w, h, { primary = false, off = false } = {}) => {
      hits.push({ id, x, y, w, h });
      rr(ctx, x, y, w, h, Math.min(16, h / 2));
      ctx.fillStyle = primary ? pal.accent : pal.panel; ctx.globalAlpha = off ? 0.45 : 1; ctx.fill();
      ctx.strokeStyle = primary ? pal.accent : pal.dim; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1;
      label(ctx, text_, x + w / 2, y + h / 2, Math.min(px(26), h * 0.5), primary ? '#1b1b1b' : pal.ink);
    };
    const playerName = (d, p) => {
      const n = d.players?.[p]?.name ?? (p === 0 ? 'Player 1' : 'Player 2');
      if (state.mode === 'ai') return p === state.human ? `${n} (you)` : `${n} (computer)`;
      return n;
    };

    const drawBoard = (ctx, d, rect, legal) => {
      rr(ctx, rect.x, rect.y, rect.w, rect.h, Math.min(24, rect.w * 0.04)); ctx.fillStyle = pal.board; ctx.fill();
      ctx.strokeStyle = pal.line; ctx.lineWidth = Math.max(2, rect.w * 0.006);
      const P = (id) => d.nodes.find((n) => n.id === id);
      const byId = new Map(d.nodes.map((n) => [n.id, n]));
      for (const l of d.lines ?? []) {
        ctx.beginPath();
        l.forEach((id, i) => { const n = byId.get(id); const x = rect.x + n.x * rect.w, y = rect.y + n.y * rect.h; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
        ctx.stroke();
      }
      const unit = Math.min(rect.w, rect.h);
      const pieces = new Map();
      for (const pc of d.pieces ?? []) { if (!pieces.has(pc.node)) pieces.set(pc.node, []); pieces.get(pc.node).push(pc); }
      const lastSet = new Set(d.last ?? []);
      for (const n of d.nodes) {
        const x = rect.x + n.x * rect.w, y = rect.y + n.y * rect.h, r = (n.r ?? 0.04) * unit;
        if (n.shape === 'cell') { ctx.fillStyle = n.tone ? pal.cell1 : pal.cell0; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
        else if (n.shape === 'pit') { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fill(); ctx.strokeStyle = pal.line; ctx.stroke(); }
        else if (n.shape === 'store') { const w = (n.w ?? 0.1) * rect.w, h = (n.h ?? 0.3) * rect.h; rr(ctx, x - w / 2, y - h / 2, w, h, Math.min(w, h) / 2); ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fill(); ctx.strokeStyle = pal.line; ctx.stroke(); }
        else if (n.shape !== 'none') { ctx.beginPath(); ctx.arc(x, y, Math.max(3, r * 0.22), 0, Math.PI * 2); ctx.fillStyle = pal.node; ctx.fill(); }
        if (lastSet.has(n.id)) { ctx.strokeStyle = pal.good; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r * 1.1, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = Math.max(2, rect.w * 0.006); ctx.strokeStyle = pal.line; }
      }
      for (const [id, list] of pieces) {
        const n = byId.get(id), x = rect.x + n.x * rect.w, y = rect.y + n.y * rect.h, r = (n.r ?? 0.04) * unit;
        if (n.shape === 'pit' || n.shape === 'store') {
          const count = list.reduce((a, p) => a + (p.count ?? 1), 0);
          if (count <= 10 && n.shape === 'pit') {
            for (let i = 0; i < count; i++) { const a = (i / Math.max(1, count)) * Math.PI * 2 + 0.5, rad = count === 1 ? 0 : r * 0.5; ctx.beginPath(); ctx.arc(x + Math.cos(a) * rad, y + Math.sin(a) * rad, Math.max(3, r * 0.2), 0, Math.PI * 2); ctx.fillStyle = list[0].owner === 1 ? pal.p1 : list[0].owner === 0 ? pal.p0 : pal.accent; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.stroke(); }
          } else label(ctx, count, x, y, Math.max(14, r * 0.9), pal.ink, 'center', '700');
          if (count && count <= 10 && n.shape === 'pit') label(ctx, count, x, y + r * (n.labelDy ?? 1.25), Math.max(11, r * 0.45), pal.dim, 'center', '600');
        } else {
          const owner = list[0].owner;
          ctx.beginPath(); ctx.arc(x, y, r * 0.78, 0, Math.PI * 2);
          ctx.fillStyle = owner === 1 ? pal.p1 : pal.p0; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3; ctx.stroke();
          if (list[0].kind === 'king') { ctx.beginPath(); ctx.arc(x, y, r * 0.4, 0, Math.PI * 2); ctx.strokeStyle = pal.accent; ctx.lineWidth = 3; ctx.stroke(); }
          if (list[0].label) label(ctx, list[0].label, x, y, r * 0.9, '#fff', 'center', '700');
          if (list.length > 1 || (list[0].count ?? 1) > 1) label(ctx, list.reduce((a, p) => a + (p.count ?? 1), 0), x + r * 0.6, y - r * 0.6, Math.max(11, r * 0.5), pal.accent, 'center', '700');
        }
      }
      // interaction hints
      if (humanTurn() && state.winner === null) {
        const pulse = 0.5 + 0.5 * Math.sin(state.t * 5);
        const froms = new Set(legal.filter((m) => m.from !== undefined && (state.selected === null || m.from === state.selected || true)).map((m) => m.from));
        const tos = new Set(legal.filter((m) => m.to !== undefined && (state.selected === null ? m.from === undefined : m.from === state.selected)).map((m) => m.to));
        for (const id of state.selected === null ? froms : []) { const n = byId.get(id); if (!n) continue; ctx.beginPath(); ctx.arc(rect.x + n.x * rect.w, rect.y + n.y * rect.h, (n.r ?? 0.04) * unit * (1.05 + 0.1 * pulse), 0, Math.PI * 2); ctx.strokeStyle = pal.accent; ctx.lineWidth = 3; ctx.globalAlpha = 0.55 + 0.4 * pulse; ctx.stroke(); ctx.globalAlpha = 1; }
        for (const id of tos) { const n = byId.get(id); if (!n) continue; ctx.beginPath(); ctx.arc(rect.x + n.x * rect.w, rect.y + n.y * rect.h, Math.max(6, (n.r ?? 0.04) * unit * 0.45), 0, Math.PI * 2); ctx.fillStyle = pal.good; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1; }
        if (state.selected !== null) { const n = byId.get(state.selected); if (n) { ctx.beginPath(); ctx.arc(rect.x + n.x * rect.w, rect.y + n.y * rect.h, (n.r ?? 0.04) * unit * 1.2, 0, Math.PI * 2); ctx.strokeStyle = pal.good; ctx.lineWidth = 4; ctx.stroke(); } }
        if (state.hint) for (const id of [state.hint.from, state.hint.to]) { const n = id !== undefined ? byId.get(id) : null; if (!n) continue; ctx.beginPath(); ctx.arc(rect.x + n.x * rect.w, rect.y + n.y * rect.h, (n.r ?? 0.04) * unit * 1.3, 0, Math.PI * 2); ctx.strokeStyle = '#ffffff'; ctx.setLineDash([8, 6]); ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]); }
      }
    };

    const render = (ctx) => {
      hits = [];
      const W = meta.width, H = meta.height;
      ctx.fillStyle = pal.bg; ctx.fillRect(0, 0, W, H);
      if (state.scene === 'title') return renderTitle(ctx, W, H);
      if (state.scene === 'rules') return renderRules(ctx, W, H);
      const d = rules.describe(state.game);
      const legal = rules.moves(state.game);
      // header: names, scores, turn
      label(ctx, T.title, W / 2, 28, px(30), pal.ink, 'center', '700');
      const status = state.winner !== null ? '' : state.mode === 'watch' ? 'Watch and learn: the computer plays both sides' : humanTurn() ? (state.mode === 'two' ? `${playerName(d, state.game.turn)}: your move` : 'Your move') : 'Computer is thinking…';
      label(ctx, state.msg || d.status || status, W / 2, 28 + px(34), px(22), state.msg ? pal.accent : pal.dim, 'center', '500');
      if (d.scores) { label(ctx, `${d.scores[0]}`, 40, 28, px(34), pal.p0, 'center', '700'); label(ctx, `${d.scores[1]}`, W - 40, 28, px(34), pal.p1, 'center', '700'); }
      const rect = boardRect(d.aspect ?? 1);
      drawBoard(ctx, d, rect, legal);
      // footer
      const bw = Math.min(150, (W - 40) / 4 - 8), bh = Math.max(44 / (meta.cssPerUnit || 1), px(54)), by = H - bh - 18;
      const names = [['menu', 'Menu'], ['undo', 'Undo'], ['hint', 'Hint'], ['new', 'New']];
      const total = names.length * bw + (names.length - 1) * 10; let x = (W - total) / 2;
      for (const [id, t] of names) { button(ctx, id, t, x, by, bw, bh, { off: id === 'undo' && !state.history.length }); x += bw + 10; }
      if (state.winner !== null && state.overT > 0.4 && !options.shot) {
        rr(ctx, W * 0.1, H * 0.34, W * 0.8, H * 0.26, 24); ctx.fillStyle = 'rgba(10,16,22,0.94)'; ctx.fill(); ctx.strokeStyle = pal.accent; ctx.lineWidth = 3; ctx.stroke();
        const w = state.winner; const msg = w === 'draw' ? 'A draw' : state.mode === 'watch' ? `${playerName(d, w)} wins` : state.mode === 'ai' ? (w === state.human ? 'You win!' : 'The computer wins') : `${playerName(d, w)} wins`;
        label(ctx, msg, W / 2, H * 0.34 + H * 0.08, px(46), pal.accent, 'center', '800');
        button(ctx, 'again', 'Play again', W / 2 - 200, H * 0.34 + H * 0.15, 190, px(58), { primary: true });
        button(ctx, 'menu', 'Menu', W / 2 + 10, H * 0.34 + H * 0.15, 190, px(58));
      }
    };

    const renderTitle = (ctx, W, H) => {
      let y = H * 0.1;
      label(ctx, T.title, W / 2, y, px(56), pal.accent, 'center', '800'); y += px(52);
      if (T.native) { label(ctx, T.native, W / 2, y, px(30), pal.ink, 'center', '500'); y += px(40); }
      if (T.countries.length) { label(ctx, T.countries.slice(0, 3).join(' · '), W / 2, y, px(22), pal.dim); y += px(38); }
      ctx.fillStyle = pal.dim;
      for (const line of wrap(ctx, T.summary, W - 80, px(24)).slice(0, 5)) { label(ctx, line, W / 2, y, px(24), pal.ink, 'center', '400'); y += px(32); }
      y = Math.max(y + 20, H * 0.5);
      const bw = Math.min(460, W - 60), bh = Math.max(46 / (meta.cssPerUnit || 1), px(64));
      button(ctx, 'ai', 'Play the computer', (W - bw) / 2, y, bw, bh, { primary: true }); y += bh + 14;
      button(ctx, 'two', 'Two players', (W - bw) / 2, y, bw, bh); y += bh + 14;
      button(ctx, 'watch', 'Watch and learn', (W - bw) / 2, y, bw, bh); y += bh + 14;
      button(ctx, 'level', `Computer: ${state.level[0].toUpperCase()}${state.level.slice(1)}`, (W - bw) / 2, y, bw / 2 - 6, bh);
      button(ctx, 'side', `You play: ${state.human === 0 ? 'first' : 'second'}`, (W - bw) / 2 + bw / 2 + 6, y, bw / 2 - 6, bh); y += bh + 14;
      button(ctx, 'howto', 'How to play and rules', (W - bw) / 2, y, bw, bh);
    };

    const renderRules = (ctx, W, H) => {
      const lines = [];
      const size = px(24);
      ctx.font = `400 ${Math.round(size)}px system-ui, sans-serif`;
      lines.push({ t: 'How to play', h: true });
      T.howToPlay.forEach((s, i) => wrap(ctx, `${i + 1}. ${s}`, W - 70, size).forEach((l) => lines.push({ t: l })));
      if (T.rules.length) { lines.push({ t: '' }, { t: 'Rules', h: true }); T.rules.forEach((s) => wrap(ctx, `• ${s}`, W - 70, size).forEach((l) => lines.push({ t: l }))); }
      if (T.heritage) { lines.push({ t: '' }, { t: 'About the tradition', h: true }); wrap(ctx, T.heritage, W - 70, size).forEach((l) => lines.push({ t: l })); }
      const lh = size * 1.4, top = 70, bottom = H - 110;
      const maxScroll = Math.max(0, lines.length * lh - (bottom - top));
      state.scroll = Math.min(state.scroll, maxScroll);
      ctx.save(); ctx.beginPath(); ctx.rect(0, top, W, bottom - top); ctx.clip();
      lines.forEach((l, i) => { const y = top + i * lh - state.scroll + lh / 2; if (l.h) label(ctx, l.t, 36, y, size * 1.15, pal.accent, 'left', '700'); else label(ctx, l.t, 36, y, size, pal.ink, 'left', '400'); });
      ctx.restore();
      label(ctx, T.title, W / 2, 34, px(30), pal.ink, 'center', '700');
      const bh = Math.max(44 / (meta.cssPerUnit || 1), px(54));
      button(ctx, 'back', 'Back', 20, H - bh - 18, 150, bh, { primary: true });
      button(ctx, 'up', 'Up', W - 340, H - bh - 18, 150, bh, { off: state.scroll <= 0 });
      button(ctx, 'down', 'Down', W - 170, H - bh - 18, 150, bh, { off: state.scroll >= maxScroll });
    };

    // virtual-resolution point of a board node (tests and accessibility helpers tap exactly where the player would)
    const nodePoint = (id) => {
      const d = rules.describe(state.game), rect = boardRect(d.aspect ?? 1), n = d.nodes.find((x) => x.id === id);
      return n ? { x: rect.x + n.x * rect.w, y: rect.y + n.y * rect.h } : null;
    };
    return {
      update,
      render,
      nodePoint,
      getState: () => ({ scene: state.scene, mode: state.mode, level: state.level, human: state.human, ply: state.ply, winner: state.winner, turn: state.game.turn, game: state.game }),
    };
  }

  return { meta, createGame, rules };
}

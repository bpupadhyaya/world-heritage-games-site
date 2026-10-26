// Generic presenter + flow for turn-based abstract board games. An engine supplies only a RULES module:
//   rules = { id, init(params, rng) -> state, moves(state) -> move[], apply(state, move) -> state, winner(state) -> null|0|1|'draw',
//             evaluate(state, player) -> number, describe(state) -> { aspect, nodes, lines, pieces, scores?, players?, last?, status? },
//             chance?(state) -> null | [{ p, state }] }
// state is plain JSON with numeric `turn` (whose move it is). A move is JSON; the UI understands move.from / move.to
// (node ids): "from only" = tap that node to play it (sowing, passing), "to only" = placement, both = select then target.
// Everything drawn is derived from describe(); all timing comes from dt, all randomness from env.rng (kit contract).
import { chooseMove, LEVELS } from './ai.js';
import { createUI, shade, rgba } from './ui.js';
import { createMenu } from './menu.js';
import { createLook } from './look.js';

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
    const look = createLook(theme.look, pal, ui);   // optional material-true skin (docs/BOARD-LOOK.md); null = the plain presenter
    const firstSentence = (s) => { const m = /^.{20,}?[.!?](\s|$)/.exec(String(s)); return m ? m[0].trim() : String(s).slice(0, 140); };
    let drag = null, maxScroll = 0;
    const state = { scene: autoplay ? 'play' : 'title', mode: autoplay ? 'watch' : 'ai', human: 0, level: 'normal', game: rules.init(params, rng.fork()), history: [], ply: 0, selected: null, msg: '', t: 0, wait: 0, overT: 0, hint: null, page: 0, scroll: 0, sceneT: 0, winner: null, moveT: -9, resT: 0 };
    
    storage.get('prefs', null).then((v) => { if (v) { if (LEVELS.some((l) => l.id === v.level)) state.level = v.level; if (v.mode === 'ai' || v.mode === 'two') state.mode = v.mode; } });
    const savePrefs = () => storage.set('prefs', { level: state.level, mode: state.mode });

    const levelLabel = () => `${state.level[0].toUpperCase()}${state.level.slice(1)}`;
    const menu = createMenu({
      ui, env, T, text, quiet: autoplay || options.shot === true,
      extras: () => rules.menuItems?.() ?? [],
      settingsBlocks: () => [{ h: 'Game', buttons: [{ id: 'level', label: `Computer: ${levelLabel()}`, icon: 'flag' }, { id: 'side', label: `You play: ${state.human === 0 ? 'first' : 'second'}` }] }],
    });

    const newGame = () => { Object.assign(state, { game: rules.init(params, rng.fork()), history: [], ply: 0, selected: null, msg: '', wait: AI_DELAY, overT: 0, hint: null, winner: null, moveT: -9 }); };
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
    const lookMargin = () => (look ? Math.max(10, Math.min(meta.width, meta.height) * (look.spec.board?.border ? 0.045 : 0.03)) : 0);
    // wide boards (mancala) turn a quarter so they use the height of a portrait screen; pits stay big and tappable
    const portraitArea = () => { const a = ui.layout(meta.width, meta.height, { footer: !autoplay }).area; return a.h > a.w * 1.12; };
    const view = (d) => {
      if (!look || look.spec.rotate === false || (d.aspect ?? 1) < 1.45 || !portraitArea()) return d;
      const nodes = d.nodes.map((n) => ({ ...n, x: 1 - n.y, y: n.x, ...(n.shape === 'store' ? { w: n.h, h: n.w } : {}) }));
      return { ...d, aspect: 1 / d.aspect, nodes };
    };
    const describe = (st) => view(rules.describe(st));
    const boardRect = (aspect) => {
      const W = meta.width, H = meta.height;
      const a = ui.layout(W, H, { footer: !autoplay }).area;
      const m = lookMargin();
      const areaW = a.w - 8 - 2 * m, areaH = a.h - 16 - 2 * m;
      let w = areaW, h = w / aspect;
      if (h > areaH) { h = areaH; w = h * aspect; }
      return { x: a.x + (a.w - w) / 2, y: a.y + 8 + (areaH - h) / 2, w, h };
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
      const d = describe(state.game), rect = boardRect(d.aspect ?? 1);
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
      const m = menu.press(id);
      if (m === 'open') { state.page = 0; go('rules'); }   // every menu page keeps the scene name 'rules'
      else if (m === 'stay') { /* a setting changed */ }
      else if (id === 'ai') { state.mode = 'ai'; savePrefs(); newGame(); go('play'); }
      else if (id === 'two') { state.mode = 'two'; savePrefs(); newGame(); go('play'); }
      else if (id === 'watch') { state.mode = 'watch'; newGame(); go('play'); }
      else if (id === 'level') { const i = LEVELS.findIndex((l) => l.id === state.level); state.level = LEVELS[(i + 1) % LEVELS.length].id; savePrefs(); }
      else if (id === 'side') { state.human = 1 - state.human; }
      else if (id === 'menu') { menu.close(); go('title'); }
      else if (id === 'back') { menu.close(); go('title'); }
      else if (id === 'undo') undo();
      else if (id === 'new' || id === 'again') { newGame(); go('play'); }
      else if (id === 'hint') {
        if (humanTurn() && state.winner === null) { const m = chooseMove(rules, state.game, { level: 'hard' }); state.hint = m ? { from: m.from, to: m.to } : null; }
      } else if (id === 'up') state.scroll = Math.max(0, state.scroll - 220);
      else if (id === 'down') state.scroll = Math.min(maxScroll || 1e9, state.scroll + 220);
    };

    // ---- flow -------------------------------------------------------------------------------------------------
    try { globalThis.__whgForce = (what) => { if (what === 'result' && state.scene === 'play' && state.winner === null) { state.winner = 0; state.overT = 0; state.resT = 0; } }; } catch { /* no globalThis */ }
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
      if (!autoplay && state.scene === 'rules') {   // keyboard: Enter / Space / Escape leave the rules page, arrows scroll
        const k = input.keys?.pressed;
        if (k && (k.has('Enter') || k.has('Space') || k.has('Escape'))) press('back');
        else if (k?.has('ArrowDown')) press('down');
        else if (k?.has('ArrowUp')) press('up');
      }
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
        if (autoplay && !options.shot && meta.cssPerUnit && state.overT > 5) { newGame(); }   // attract mode loops so previews never freeze
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
    const rr = ui.rr;
    const label = (ctx, s, x, y, size, color = pal.ink, align = 'center', weight = '600') => { ctx.fillStyle = color; ctx.font = `${weight} ${Math.round(size)}px system-ui, sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(String(s), x, y); };
    const playerName = (d, p) => {
      const n = look?.spec.sides?.[p] ?? d.players?.[p]?.name ?? (p === 0 ? 'Player 1' : 'Player 2');
      if (state.mode === 'ai') return p === state.human ? `${n} (you)` : `${n} (computer)`;
      return n;
    };
    const ownerColor = (o) => (o === 1 ? pal.p1 : pal.p0);

    const drawBoard = (ctx, d, rect, legal) => {
      const unit = Math.min(rect.w, rect.h);
      const corner = Math.min(24, rect.w * 0.04), frame = Math.max(3, unit * 0.012);
      const lm = lookMargin();
      if (look) look.body(ctx, { x: rect.x - lm, y: rect.y - lm, w: rect.w + 2 * lm, h: rect.h + 2 * lm }, d, lm);
      else {
      // body: soft shadow, gradient, grain, bevel
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = unit * 0.05; ctx.shadowOffsetY = unit * 0.02;
        rr(ctx, rect.x, rect.y, rect.w, rect.h, corner); ctx.fillStyle = shade(pal.board, -0.25); ctx.fill();
        ctx.restore();
        rr(ctx, rect.x, rect.y, rect.w, rect.h, corner); ctx.fillStyle = ui.vgrad(ctx, rect.y, rect.y + rect.h, [[0, shade(pal.board, 0.14)], [0.5, pal.board], [1, shade(pal.board, -0.16)]]); ctx.fill();
        ctx.save(); rr(ctx, rect.x, rect.y, rect.w, rect.h, corner); ctx.clip();
        ui.texture(ctx, rect.x, rect.y, rect.w, rect.h, { kind: 'grain', alpha: 0.1, dark: shade(pal.board, -0.6) });
        ctx.restore();
        rr(ctx, rect.x + frame / 2, rect.y + frame / 2, rect.w - frame, rect.h - frame, corner); ctx.lineWidth = frame; ctx.strokeStyle = shade(pal.board, -0.42); ctx.stroke();
        rr(ctx, rect.x + frame * 1.5, rect.y + frame * 1.5, rect.w - frame * 3, rect.h - frame * 3, Math.max(2, corner - frame)); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.stroke();
      }
      const byId = new Map(d.nodes.map((n) => [n.id, n]));
      const lw = Math.max(2, rect.w * 0.006);
      const strokeLines = (dx, dy, color) => {
        ctx.beginPath();
        for (const l of d.lines ?? []) l.forEach((id, i) => { const n = byId.get(id); const x = rect.x + n.x * rect.w + dx, y = rect.y + n.y * rect.h + dy; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
        ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.stroke();
      };
      if (look) look.lines(ctx, rect, d, byId);
      else if (d.lines?.length) { strokeLines(0, lw * 0.9, 'rgba(255,255,255,0.28)'); strokeLines(0, 0, pal.line); }
      const pieces = new Map();
      for (const pc of d.pieces ?? []) { if (!pieces.has(pc.node)) pieces.set(pc.node, []); pieces.get(pc.node).push(pc); }
      const lastSet = new Set(d.last ?? []);
      for (const n of d.nodes) {
        const x = rect.x + n.x * rect.w, y = rect.y + n.y * rect.h, r = (n.r ?? 0.04) * unit;
        if (look) { look.node(ctx, n, x, y, r, rect, lastSet.has(n.id)); continue; }
        if (n.shape === 'cell') {
          ctx.fillStyle = n.tone ? pal.cell1 : pal.cell0; ctx.fillRect(x - r, y - r, r * 2, r * 2);
          ctx.fillStyle = ui.vgrad(ctx, y - r, y + r, [[0, 'rgba(255,255,255,0.14)'], [1, 'rgba(0,0,0,0.12)']]); ctx.fillRect(x - r, y - r, r * 2, r * 2);
        } else if (n.shape === 'pit') {
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
          const gr = ctx.createRadialGradient(x, y + r * 0.2, r * 0.1, x, y, r); gr.addColorStop(0, 'rgba(0,0,0,0.5)'); gr.addColorStop(0.75, 'rgba(0,0,0,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0.15)');
          ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y + 1.5, r, 0.1, Math.PI - 0.1); ctx.stroke();
          ctx.strokeStyle = pal.line; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
        } else if (n.shape === 'store') {
          const w = (n.w ?? 0.1) * rect.w, h = (n.h ?? 0.3) * rect.h; rr(ctx, x - w / 2, y - h / 2, w, h, Math.min(w, h) / 2);
          ctx.fillStyle = ui.vgrad(ctx, y - h / 2, y + h / 2, [[0, 'rgba(0,0,0,0.5)'], [1, 'rgba(0,0,0,0.22)']]); ctx.fill(); ctx.strokeStyle = pal.line; ctx.lineWidth = lw; ctx.stroke();
        } else if (n.shape !== 'none') {
          const rad = Math.max(3, r * 0.22);
          ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fillStyle = pal.node; ctx.fill();
          ctx.beginPath(); ctx.arc(x - rad * 0.25, y - rad * 0.3, rad * 0.4, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();
        }
        if (lastSet.has(n.id)) { ctx.strokeStyle = pal.good; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r * 1.1, 0, Math.PI * 2); ctx.stroke(); }
      }
      const landT = state.t - state.moveT, drop = landT < 0.28 && !ui.reduced() ? (1 - ui.easeOutBack(landT / 0.28)) : 0;
      const ball = (x, y, rad, col, ring) => {      // glossy bead / disc with cast shadow
        ctx.beginPath(); ctx.ellipse(x + rad * 0.12, y + rad * 0.2, rad * 1.02, rad * 0.92, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
        const gr = ctx.createRadialGradient(x - rad * 0.35, y - rad * 0.4, rad * 0.1, x, y, rad * 1.05);
        gr.addColorStop(0, shade(col, 0.55)); gr.addColorStop(0.45, col); gr.addColorStop(1, shade(col, -0.45));
        ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fillStyle = gr; ctx.fill();
        if (ring) { ctx.lineWidth = Math.max(1.5, rad * 0.1); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.stroke(); }
        ctx.beginPath(); ctx.ellipse(x - rad * 0.28, y - rad * 0.4, rad * 0.4, rad * 0.22, -0.5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
      };
      for (const [id, list] of pieces) {
        const n = byId.get(id), x = rect.x + n.x * rect.w, y = rect.y + n.y * rect.h, r = (n.r ?? 0.04) * unit;
        if (n.shape === 'pit' || n.shape === 'store') {
          const count = list.reduce((a, p) => a + (p.count ?? 1), 0);
          const col = list[0].owner === 1 ? pal.p1 : list[0].owner === 0 ? pal.p0 : pal.accent;
          if (look) {
            const own = list[0].owner === 1 ? 1 : 0;
            if (count && n.shape === 'pit') look.seeds(ctx, x, y, r, count, own);
            if (count && n.shape === 'store') label(ctx, count, x, y, Math.max(14, r * 0.9), pal.ink, 'center', '800');
            else if (count) { const bx = x + r * 0.72, by = y + r * 0.74, br = Math.max(9, r * 0.27); ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fillStyle = 'rgba(20,12,6,0.86)'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.stroke(); label(ctx, count, bx, by + 0.5, Math.max(11, br * 1.1), '#fff', 'center', '800'); }
          } else if (count <= 10 && n.shape === 'pit') {
            for (let i = 0; i < count; i++) { const a = (i / Math.max(1, count)) * Math.PI * 2 + 0.5, rad = count === 1 ? 0 : r * 0.5; ball(x + Math.cos(a) * rad, y + Math.sin(a) * rad, Math.max(3.5, r * 0.22), col, false); }
          } else label(ctx, count, x, y, Math.max(14, r * 0.9), pal.ink, 'center', '700');
          if (!look && count && count <= 10 && n.shape === 'pit') label(ctx, count, x, y + r * (n.labelDy ?? 1.25), Math.max(11, r * 0.45), pal.dim, 'center', '600');
        } else {
          const owner = list[0].owner;
          const isLast = lastSet.has(id);
          const yy = y - (isLast ? drop * r * 0.8 : 0);
          if (look) look.piece(ctx, x, yy, r, owner, list[0].kind, list[0].label, id);
          else {
          ball(x, yy, r * 0.78, ownerColor(owner), true);
          if (list[0].kind === 'king') { ctx.beginPath(); ctx.arc(x, yy, r * 0.4, 0, Math.PI * 2); ctx.strokeStyle = pal.accent; ctx.lineWidth = 3; ctx.stroke(); }
          if (list[0].label) label(ctx, list[0].label, x, yy, r * 0.9, '#fff', 'center', '700');
          }
          if (list.length > 1 || (list[0].count ?? 1) > 1) label(ctx, list.reduce((a, p) => a + (p.count ?? 1), 0), x + r * 0.6, y - r * 0.6, Math.max(11, r * 0.5), pal.accent, 'center', '700');
        }
      }
      // interaction hints
      if (humanTurn() && state.winner === null) {
        const pulse = ui.reduced() ? 0.5 : 0.5 + 0.5 * Math.sin(state.t * 5);
        const froms = new Set(legal.filter((m) => m.from !== undefined).map((m) => m.from));
        const tos = new Set(legal.filter((m) => m.to !== undefined && (state.selected === null ? m.from === undefined : m.from === state.selected)).map((m) => m.to));
        for (const id of state.selected === null ? froms : []) { const n = byId.get(id); if (!n) continue; ctx.beginPath(); ctx.arc(rect.x + n.x * rect.w, rect.y + n.y * rect.h, (n.r ?? 0.04) * unit * (1.05 + 0.1 * pulse), 0, Math.PI * 2); ctx.strokeStyle = pal.accent; ctx.lineWidth = 3; ctx.globalAlpha = 0.55 + 0.4 * pulse; ctx.stroke(); ctx.globalAlpha = 1; }
        for (const id of tos) { const n = byId.get(id); if (!n) continue; const px0 = rect.x + n.x * rect.w, py0 = rect.y + n.y * rect.h, rd = Math.max(6, (n.r ?? 0.04) * unit * (0.4 + 0.08 * pulse)); ctx.beginPath(); ctx.arc(px0, py0, rd, 0, Math.PI * 2); ctx.fillStyle = rgba(pal.good, 0.85); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.stroke(); }
        if (state.selected !== null) { const n = byId.get(state.selected); if (n) { ctx.beginPath(); ctx.arc(rect.x + n.x * rect.w, rect.y + n.y * rect.h, (n.r ?? 0.04) * unit * 1.2, 0, Math.PI * 2); ctx.strokeStyle = pal.good; ctx.lineWidth = 4; ctx.stroke(); } }
        if (state.hint) for (const id of [state.hint.from, state.hint.to]) { const n = id !== undefined ? byId.get(id) : null; if (!n) continue; ctx.beginPath(); ctx.arc(rect.x + n.x * rect.w, rect.y + n.y * rect.h, (n.r ?? 0.04) * unit * 1.3, 0, Math.PI * 2); ctx.strokeStyle = '#ffffff'; ctx.setLineDash([8, 6]); ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]); }
      }
    };

    const render = (ctx) => {
      ui.begin();
      const W = meta.width, H = meta.height;
      ui.background(ctx, 0, 0, W, H);
      if (look && state.scene === 'play') look.ground(ctx, W, H);
      ui.sceneBegin(ctx, state.sceneT);
      if (state.scene === 'title') renderTitle(ctx, W, H);
      else if (state.scene === 'rules') renderRules(ctx, W, H);
      else renderPlay(ctx, W, H);
      ui.sceneEnd(ctx, W, H, state.sceneT);
    };

    const renderPlay = (ctx, W, H) => {
      const d = describe(state.game);
      const legal = rules.moves(state.game);
      const status = state.winner !== null ? '' : state.mode === 'watch' ? 'Watch and learn: the computer plays both sides' : humanTurn() ? (state.mode === 'two' ? `${playerName(d, state.game.turn)}: your move` : 'Your move') : 'Computer is thinking…';
      const turn = state.winner === null ? state.game.turn : -1;
      const chips = [0, 1].map((p) => ({ label: d.scores ? String(d.scores[p]) : (state.mode === 'ai' ? (p === state.human ? 'You' : 'CPU') : ((look?.spec.sides?.[p] ?? '').length > 9 ? look.spec.sides[p].split(' ')[0] : (look?.spec.sides?.[p] ?? `P${p + 1}`))), color: ownerColor(p), active: turn === p }));
      ui.header(ctx, W, { title: T.title, sub: state.msg || d.status || status, subAccent: !!state.msg, chips });
      drawBoard(ctx, d, boardRect(d.aspect ?? 1), legal);
      if (!autoplay) ui.footer(ctx, W, H, [{ id: 'menu', label: 'Menu', icon: 'menu' }, { id: 'undo', label: 'Undo', icon: 'undo', off: !state.history.length }, { id: 'hint', label: 'Hint', icon: 'hint' }, { id: 'new', label: 'New', icon: 'plus' }]);
      if (state.winner !== null && state.overT > 0.4 && !options.shot) {
        const w = state.winner;
        const msg = w === 'draw' ? 'A draw' : state.mode === 'watch' ? `${playerName(d, w)} wins` : state.mode === 'ai' ? (w === state.human ? 'You win!' : 'The computer wins') : `${playerName(d, w)} wins`;
        ui.clearHits();
        ui.resultCard(ctx, W, H, {
          rt: state.overT - 0.4, headline: msg, stars: null, note: T.heritage ? firstSentence(T.heritage) : '',
          buttons: [{ id: 'again', label: 'Play again', primary: true, icon: 'restart' }, { id: 'menu', label: 'Menu', icon: 'menu' }],
        });
      } else ui.particles(ctx);
    };

    const titleD = rules.describe(state.game);   // opening position, captured before any move (never re-inits: rng stays untouched)
    const titleHero = (c, r) => {
      if (rules.titleArt) return rules.titleArt({ ctx: c, pal, ui, px, t: state.t }, r);
      const asp = titleD.aspect ?? 1; let bw = r.w * 0.96, bh = bw / asp;
      if (bh > r.h * 0.96) { bh = r.h * 0.96; bw = bh * asp; }
      drawBoard(c, titleD, { x: r.cx - bw / 2, y: r.cy - bh / 2, w: bw, h: bh }, []);
    };
    const renderTitle = (ctx, W, H) => {
      ui.titleScreen(ctx, W, H, {
        title: T.title, native: T.native, countries: T.countries, summary: T.summary, hero: titleHero,
        rows: [[{ id: 'ai', label: 'Play the computer', icon: 'bot', primary: true }]],
        grid: [
          { id: 'two', label: 'Two players', icon: 'people' }, { id: 'watch', label: 'Watch and learn', icon: 'eye' },
          { id: 'level', label: `Computer: ${levelLabel()}`, icon: 'flag' },
          ...(T.howToPlay.length ? [{ id: 'howto', label: 'How to play', icon: 'book' }] : []),
          ...menu.items(),
        ],
      });
    };

    const renderRules = (ctx, W, H) => {
      const r = menu.render(ctx, W, H, state.scroll);
      maxScroll = r.maxScroll; state.scroll = r.scroll;
    };

    // virtual-resolution point of a board node (tests and accessibility helpers tap exactly where the player would)
    const nodePoint = (id) => {
      const d = describe(state.game), rect = boardRect(d.aspect ?? 1), n = d.nodes.find((x) => x.id === id);
      return n ? { x: rect.x + n.x * rect.w, y: rect.y + n.y * rect.h } : null;
    };
    return {
      update,
      render,
      nodePoint,
      // Free-preview timer (kit preview.js): only a real game against the computer or a friend counts; title, menus, watch mode and the finished board are free.
      isPreviewExempt: () => state.scene !== 'play' || state.mode === 'watch' || autoplay || state.winner !== null,
      getState: () => ({ scene: state.scene, mode: state.mode, level: state.level, human: state.human, ply: state.ply, winner: state.winner, turn: state.game.turn, game: state.game }),
    };
  }

  return { meta, createGame, rules };
}

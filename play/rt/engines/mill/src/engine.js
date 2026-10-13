// mill engine: createEngine(spec, theme, text) -> { meta, createGame, rules }  (docs/ENGINE-CONTRACT.md)
// Dara-style games (6 by 5 grid, exact runs) are shown the way the tradition plays them: scratched in sand, pebbles against twigs.
// The shared board shell only knows plain boards, so skinRules() wraps describe() and paints the sand board (src/dara.js) from
// getters that the shell reads while it draws; everything else (header, footer, menus, hit testing) stays the shell's.
import { createBoardEngine } from '../../../platform/engine-kit/index.js';
import { createRules } from './rules.js';
import { daraLayout, paintDara, paintDaraTitle } from './dara.js';

export const ENGINE_ID = 'mill';
export { createRules };

const wantsSand = (spec, text, P) => {
  const look = spec.params?.look ?? 'auto';
  if (look === 'plain') return false;
  if (look === 'sand') return P.board === 'grid';
  return P.board === 'grid' && (String(spec.variant ?? '').toLowerCase() === 'dara' || /\b(dara|derrah|doki|dili)\b/i.test(`${text.title ?? ''} ${text.native ?? ''}`));
};

function skinRules(rules, art) {
  const P = rules.params, B = rules.board, L = daraLayout(P.cols, P.rows);
  const cells = B.ids.map((id, i) => ({ node: id, c: B.gridPos[i][0], r: B.gridPos[i][1] }));
  const byNode = new Map(cells.map((c) => [c.node, c]));
  const model = (s, d) => ({ cols: P.cols, rows: P.rows, cells, byNode, pieces: d.pieces, hand: s ? [s.hand[0], s.hand[1]] : [0, 0], born: art.born, puffs: art.puffs });
  const out = {
    ...rules,
    describe(s) {
      const d = rules.describe(s);
      const nodes = d.nodes.map((n) => { const [x, y] = L.node(byNode.get(n.id).c, byNode.get(n.id).r); return { id: n.id, x, y, r: L.r, shape: 'none' }; });
      let nodesDone = false, piecesDone = false;
      const painted = (which) => art.ctx && !art.busy && art.rect && !(which === 'n' ? nodesDone : piecesDone);
      return {
        ...d, aspect: L.aspect, lines: [],
        get nodes() {
          if (painted('n')) { nodesDone = true; art.paintBoard(model(s, d)); }
          return nodes;
        },
        get pieces() { return art.ctx && !art.busy && art.rect ? [] : d.pieces; },   // painted with the board; the shell draws none
      };
    },
    titleArt({ ctx, pal, t }, rect) {
      const placed = { '1,1': 0, '2,1': 0, '3,1': 0, '1,3': 1, '2,3': 1, '4,2': 1, '5,0': 0, '0,4': 1 };
      const pieces = Object.entries(placed).map(([node, owner]) => ({ node, owner }));
      paintDaraTitle(ctx, rect, { cols: P.cols, rows: P.rows, cells, byNode, pieces, hand: [P.pieces - 4, P.pieces - 4] }, pal, t);
    },
  };
  return out;
}

export function createEngine(spec = {}, theme = {}, text = {}, options = {}) {
  const rules = createRules(spec.params ?? {});
  if (!wantsSand(spec, text, rules.params)) return createBoardEngine({ rules, spec, theme, text, options });
  const art = { ctx: null, busy: false, rect: null, born: {}, puffs: [], t: 0, prev: null, pal: null, paintBoard: null };
  const pal = { p0: '#c4502f', p1: '#2c4a9a', ...(theme.palette ?? {}) };
  const sandTheme = { ...theme, palette: { ...(theme.palette ?? {}), board: '#8a6232' } };
  const base = createBoardEngine({ rules: skinRules(rules, art), spec, theme: sandTheme, text, options });
  return {
    ...base,
    rules,
    createGame(env) {
      const inner = base.createGame(env);   // may be a promise in some hosts
      const wrap = (game) => {
        const P = rules.params, ids = rules.board.ids, last = ids[ids.length - 1];
        const rectOf = () => {
          art.busy = true;
          try {
            const p0 = game.nodePoint(ids[0]), p1 = game.nodePoint(last);
            if (!p0 || !p1) return null;
            const L = daraLayout(P.cols, P.rows), g0 = rules.board.gridPos[0], g1 = rules.board.gridPos[ids.length - 1];
            const dx = (p1.x - p0.x) / Math.max(1, g1[0] - g0[0]), dy = (p1.y - p0.y) / Math.max(1, g1[1] - g0[1]);
            return { x: p0.x - (0.5 + 0.4) * dx, y: p0.y - 1.55 * dy, w: dx * L.W, h: dy * L.H };
          } finally { art.busy = false; }
        };
        art.pal = pal;
        art.paintBoard = (model) => {
          const r = art.rect;
          // new pieces drop in; vanished ones leave a scuff of dust
          const now = new Map(model.pieces.map((p) => [p.node, p.owner]));
          let changed = 0;
          for (const [node, owner] of now) if (art.prev?.get(node) !== owner) changed++;
          const animate = art.prev !== null && changed <= 3;   // first frame, undo, restart: no animation
          if (animate) {
            for (const [node, owner] of now) if (art.prev.get(node) !== owner) art.born[node] = art.t;
            for (const [node] of art.prev) if (!now.has(node)) { const c = model.byNode.get(node); art.puffs.push({ c: c.c, r: c.r, t0: art.t }); delete art.born[node]; }
          } else { art.born = {}; art.puffs = []; }
          art.puffs = art.puffs.filter((p) => art.t - p.t0 < 0.6);
          art.prev = now;
          const ctx = art.ctx, unit = Math.min(r.w, r.h), frame = Math.max(3, unit * 0.012), corner = Math.max(2, Math.min(24, r.w * 0.04) - frame), ins = frame * 1.4;
          ctx.save(); ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(r.x + ins, r.y + ins, r.w - ins * 2, r.h - ins * 2, corner); else ctx.rect(r.x + ins, r.y + ins, r.w - ins * 2, r.h - ins * 2);
          ctx.clip();
          paintDara(ctx, r, { ...model, puffs: art.puffs, born: art.born }, art.pal, art.t);
          ctx.restore();
        };
        let seen = null;
        return {
          ...game,
          update(dt, input) {
            art.t += dt;
            game.update(dt, input);
            // a quiet clack of pebble or twig when the position changes
            const st = game.getState?.().game;
            if (st && seen && env.audio?.tone) {
              let placed = 0, gone = 0;
              for (let i = 0; i < st.b.length; i++) { if (seen[i] < 0 && st.b[i] >= 0) placed = st.b[i] + 1; if (seen[i] >= 0 && st.b[i] < 0) gone++; }
              if (placed === 1) env.audio.tone({ freq: 640, to: 420, dur: 0.05, type: 'square', vol: 0.05 });
              else if (placed === 2) env.audio.tone({ freq: 190, to: 130, dur: 0.07, type: 'triangle', vol: 0.12 });
              else if (gone) env.audio.tone({ freq: 300, to: 120, dur: 0.14, type: 'sawtooth', vol: 0.04 });
            }
            if (st) seen = st.b.slice();
          },
          render(ctx, view) {
            art.rect = rectOf(); art.ctx = ctx;
            try { return game.render(ctx, view); } finally { art.ctx = null; }
          },
        };
      };
      return inner && typeof inner.then === 'function' ? inner.then(wrap) : wrap(inner);
    },
  };
}

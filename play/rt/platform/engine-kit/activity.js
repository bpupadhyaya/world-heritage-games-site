// Generic presenter + flow for single-player ACTIVITY games (crafts, instruments, dances, races, aiming, bouts, stories):
// everything that is not a turn-based board game. An engine supplies an ACTIVITY factory; the shell supplies title, rules page,
// header, footer, result overlay with stars, best score, attract mode (store screenshots), text zoom and sounds.
//
//   createActivity(params, env) -> {
//     init(),                          // (re)start a round
//     update(dt, input),               // input = kit snapshot (pointer {x,y,down,pressed,released}, keys); virtual coords of the area below
//     render(g, area),                 // g = { ctx, pal, px, label, rr, wrap, text }; draw inside area = { x, y, w, h }
//     status(),                        // { score, max, label? } for the header
//     result(),                        // null while playing, else { score, max, stars: 0-3, headline, detail? }
//     hint?(), attract?(dt, input),    // optional: a tip string; synthetic input for Watch and learn / screenshots
//     rules?(),                        // optional extra rules lines
//     getState()                       // JSON (determinism hash, tests)
//   }
//   g also carries the shared chrome helpers: g.ui (panel, gloss, button, sparkle, burst, star, texture, vignette, text, title, sfx,
//   count, insets ...; see docs/ENGINE-CONTRACT.md "Shared chrome"), g.t (seconds since the scene began), g.reduced.
//   Optional: act.titleArt?(g, rect) draws the hero art on the title screen (rect = {x,y,w,h,cx,cy,r}); status() may also return
//   { frac (0..1 progress bar), combo (streak chip) }; result() may return { note } (one line about the tradition).
// Same kit contract as every game: no DOM, no Math.random, no Date.now; randomness only via env.rng, time only via dt.

const PALETTE = { bg: '#17212b', panel: '#223140', accent: '#f2c14e', ink: '#f5f1e8', dim: '#9fb0c3', good: '#58c27d', bad: '#e0603a', line: '#4a3820', a: '#d64b3c', b: '#2d7bd6' };

import { createUI } from './ui.js';
import { createMenu } from './menu.js';

export function createActivityEngine({ createActivity, spec = {}, theme = {}, text = {}, title = null, options = {} }) {
  const params = spec.params ?? {};
  const pal = { ...PALETTE, ...(theme.palette ?? {}) };
  const meta = { width: 720, height: 1280, fluid: { short: 720 } };
  const T = { title: title ?? text.title ?? 'Game', native: text.native ?? '', summary: text.summary ?? '', countries: text.countries ?? [], howToPlay: text.howToPlay ?? [], rules: text.rules ?? [], heritage: text.heritageNote ?? '' };
  const firstSentence = (s) => { const m = /^.{20,}?[.!?](\s|$)/.exec(String(s)); return m ? m[0].trim() : String(s).slice(0, 140); };

  function createGame(env) {
    const { rng, storage, audio } = env;
    const zoom = () => Math.min(3, Math.max(0.6, Number(env.config?.textScale ?? env.config?.zoom ?? 1) || 1));
    const px = (base) => Math.max(base * zoom(), 12 / (meta.cssPerUnit || 1));
    const autoplay = options.autoplay === true;
    const ui = createUI({ pal, meta, px, audio, config: env.config, options, name: T.title, theme });
    const act = createActivity(params, { rng, text, palette: pal, theme, audio, config: env.config, ui });
    const state = { scene: autoplay ? 'play' : 'title', watch: autoplay, best: null, t: 0, sceneT: 0, scroll: 0, maxScroll: 0, outcome: null, outcomeT: 0, newBest: false, tip: '', st: null };
    let drag = null;
    const menu = createMenu({
      ui, env, T, text, quiet: autoplay || options.shot === true,
      extraRules: () => act.rules?.() ?? [], extras: () => act.menuItems?.() ?? [],
      best: () => state.best, resetBest: () => { state.best = null; storage.set('best', null); },
    });
    storage.get('best', null).then((v) => { if (v && typeof v.score === 'number') state.best = v; });

    const start = (watch = false) => { act.init(); state.watch = watch; state.outcome = null; state.outcomeT = 0; state.newBest = false; state.tip = ''; ui.countReset('score', 0); go('play'); };
    const go = (scene) => { state.scene = scene; state.sceneT = 0; state.scroll = 0; };
    const finish = (res) => {
      state.outcome = res; state.outcomeT = 0; state.newBest = false;
      if (!state.watch && (!state.best || res.score > state.best.score)) { state.newBest = !!state.best || res.score > 0; state.best = { score: res.score, stars: res.stars }; storage.set('best', state.best); }
    };
    const press = (id) => {
      ui.press(id);
      if (id === 'back' || id === 'menu') ui.sfx.back(); else if (id === 'up' || id === 'down') ui.sfx.whoosh(); else ui.sfx.tap();
      const m = menu.press(id);
      if (m === 'open') go('rules');   // every menu page keeps the scene name 'rules' (card pages share one scene)
      else if (m === 'stay') { /* a setting changed on the current page */ }
      else if (id === 'play') start(false);
      else if (id === 'watch') start(true);
      else if (id === 'menu') go('title');
      else if (id === 'back') { menu.close(); go('title'); }
      else if (id === 'again' || id === 'restart') start(state.watch);
      else if (id === 'hint') state.tip = act.hint?.() ?? 'Take your time: there is no clock on the first try.';
      else if (id === 'up') state.scroll = Math.max(0, state.scroll - 220);
      else if (id === 'down') state.scroll = Math.min(state.maxScroll || 1e9, state.scroll + 220);
    };

    // QA hook (tools/whg fluid): jump to the result card without playing a whole round.
    try { globalThis.__whgForce = (what) => { if (what === 'result' && state.scene === 'play' && !state.outcome) finish({ score: 2, max: 3, stars: 2, headline: 'Well done', detail: '' }); }; } catch { /* no globalThis */ }
    if (options.begin === true && !autoplay) start(false); // bucket apps: the page that links here already showed About + How to play

    const update = (dt, input) => {
      state.t += dt; state.sceneT += dt;
      ui.update(dt, input);
      const p = input.pointer;
      let consumed = false;
      if (p.pressed && !autoplay) {
        const id = ui.hit(p.x, p.y);
        if (id) { press(id); consumed = true; }
        else if (state.scene === 'rules') drag = { y: p.y, s: state.scroll };
      }
      if (drag) { if (p.down) state.scroll = Math.max(0, Math.min(state.maxScroll || 1e9, drag.s - (p.y - drag.y))); else drag = null; }
      if (!autoplay && state.scene === 'title' && input.keys?.pressed?.has('Enter')) press('play');
      if (!autoplay && state.scene === 'rules') {   // keyboard: Enter / Space / Escape leave the rules page, arrows scroll
        const k = input.keys?.pressed;
        if (k && (k.has('Enter') || k.has('Space') || k.has('Escape'))) press('back');
        else if (k?.has('ArrowDown')) press('down');
        else if (k?.has('ArrowUp')) press('up');
      }
      if (input.wheel && state.scene === 'rules') state.scroll = Math.max(0, Math.min(state.maxScroll || 1e9, state.scroll + input.wheel.dy));
      if (state.scene !== 'play') return;
      if (state.outcome) {
        const prev = state.outcomeT; state.outcomeT += dt;
        ui.resultTick(prev, state.outcomeT, { stars: state.outcome.stars ?? 0, win: (state.outcome.stars ?? 1) > 0, newBest: state.newBest });
        if (autoplay && !options.shot && meta.cssPerUnit && state.outcomeT > 5) start(true);   // attract mode loops so live previews never freeze
        return;
      }
      if (state.watch || autoplay) act.attract ? act.attract(dt, input) : act.update(dt, input);
      else if (!consumed) act.update(dt, input);
      else act.update(dt, { ...input, pointer: { ...p, pressed: false, released: false, down: false } });
      state.st = act.status?.() ?? null;
      const r = act.result();
      if (r) finish(r);
    };

    // ---- drawing helpers (kept for engines: g.label / g.rr / g.wrap) ---------------------------------------------
    const rr = ui.rr;
    const label = (ctx, s, x, y, size, color = pal.ink, align = 'center', weight = '600') => { ctx.fillStyle = color; ctx.font = `${weight} ${Math.round(size)}px system-ui, sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(String(s), x, y); };
    const wrap = (ctx, s, maxW, size) => ui.wrap(ctx, s, maxW, size);
    const g = { pal, px, label, rr, wrap, text, ui, reduced: ui.reduced(), t: 0 };

    const heroArt = act.titleArt ? (ctx, rect) => act.titleArt({ ...g, ctx, t: state.t }, rect) : null;

    const render = (ctx) => {
      ui.begin();
      const W = meta.width, H = meta.height;
      ui.background(ctx, 0, 0, W, H);
      ui.sceneBegin(ctx, state.sceneT);
      if (state.scene === 'title') renderTitle(ctx, W, H);
      else if (state.scene === 'rules') renderRules(ctx, W, H);
      else renderPlay(ctx, W, H);
      ui.sceneEnd(ctx, W, H, state.sceneT);
    };

    const renderPlay = (ctx, W, H) => {
      const L = ui.layout(W, H, { footer: !autoplay });
      const st = state.st ?? act.status?.() ?? {};
      const sub = state.tip || (state.watch ? 'Watch and learn' : st.label ?? '');
      const frac = typeof st.frac === 'number' ? st.frac : st.max ? (st.score ?? 0) / st.max : null;
      ui.header(ctx, W, { title: T.title, sub, subAccent: !!state.tip, score: st.score ?? null, max: st.max ?? null, frac, combo: st.combo ?? 0 });
      const area = L.area;
      ctx.save(); ctx.beginPath(); ctx.rect(area.x, area.y, area.w, area.h); ctx.clip();
      act.render({ ...g, ctx, t: state.sceneT }, area);
      ctx.restore();
      if (!autoplay) ui.footer(ctx, W, H, [{ id: 'menu', label: 'Menu', icon: 'menu' }, { id: 'hint', label: 'Hint', icon: 'hint' }, { id: 'restart', label: 'Restart', icon: 'restart' }]);
      if (state.outcome && !options.shot) {   // store screenshots (?shot=1) keep the finished board visible
        const o = state.outcome;
        ui.clearHits();
        ui.resultCard(ctx, W, H, {
          rt: state.outcomeT, headline: o.headline ?? 'Well done', stars: o.stars ?? 0, score: o.score ?? null, max: o.max ?? null, detail: o.detail ?? '',
          best: state.best && !state.watch ? state.best : null, newBest: state.newBest && !state.watch,
          note: o.note ?? (T.heritage ? firstSentence(T.heritage) : ''),
          buttons: [{ id: 'again', label: 'Play again', primary: true, icon: 'restart' }, { id: 'menu', label: 'Menu', icon: 'menu' }],
        });
      } else ui.particles(ctx);
    };

    const renderTitle = (ctx, W, H) => {
      ui.titleScreen(ctx, W, H, {
        title: T.title, native: T.native, countries: T.countries, summary: T.summary, best: state.best, hero: heroArt,
        rows: [[{ id: 'play', label: 'Play', icon: 'play', primary: true }]],
        grid: [{ id: 'watch', label: 'Watch and learn', icon: 'eye' }, ...(T.howToPlay.length ? [{ id: 'howto', label: 'How to play', icon: 'book' }] : []), ...menu.items()],
      });
    };

    const renderRules = (ctx, W, H) => {
      const r = menu.render(ctx, W, H, state.scroll);
      state.maxScroll = r.maxScroll; state.scroll = r.scroll;
    };

    return {
      update, render,
      point: (id) => act.point?.(id) ?? null,   // tests tap exactly where a player would
      // Free-preview timer (kit preview.js): only real play counts. Title, menu pages, "Watch and learn" and the result card are free.
      isPreviewExempt: () => state.scene !== 'play' || state.watch || autoplay || !!state.outcome,
      getState: () => ({ scene: state.scene, watch: state.watch, outcome: state.outcome, best: state.best, activity: act.getState?.() ?? null }),
    };
  }
  return { meta, createGame };
}

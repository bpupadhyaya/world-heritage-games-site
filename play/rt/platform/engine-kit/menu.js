// Shared MENU model for the title screen of every engine shell (activity + board): which items the title grid shows, the content
// of each card page (How to play, Rules, About, Credits, Settings, engine extras) and the persisted settings (sound, text size).
// Pure data + a render call into g.ui.cardPage; no DOM, no Math.random, no Date.now (time comes from ui.now()).
//
//   const menu = createMenu({ ui, env, T, extras, settingsBlocks, best, resetBest, quiet })
//   menu.items()            -> [{ id, label, icon }]  grid items for the title (only those with content)
//   menu.press(id)          -> 'open' (a page is now shown) | 'stay' (a setting changed) | null (not a menu id)
//   menu.render(ctx, W, H, scroll) -> { maxScroll, scroll }   draws the current page via ui.cardPage
//   menu.close()            -> leave the page
// Settings are saved with env.storage under "settings": { sound: bool, text: 0.85 | 1 | 1.15 | 1.3 }.
export const TEXT_STEPS = [0.85, 1, 1.15, 1.3];
const list = (v) => (Array.isArray(v) ? v.map((s) => String(s)).filter(Boolean) : []);

export function createMenu({ ui, env, T, extraRules = () => [], extras = () => [], settingsBlocks = () => [], best = () => null, resetBest = () => {}, quiet = false, text = {} }) {
  const st = { page: null, sound: true, text: 1, confirmUntil: -1 };
  const audio = env.audio, storage = env.storage;
  const apply = () => {
    try { audio?.setMuted?.(!st.sound); } catch { /* optional */ }
    if (env.config && (st.text !== 1 || env.config.__menuText)) { env.config.textScale = st.text; env.config.__menuText = st.text !== 1; }
  };
  const save = () => { try { storage?.set?.('settings', { sound: st.sound, text: st.text }); } catch { /* optional */ } };
  if (!quiet) {   // screenshots and attract mode (?shot=1 / ?autoplay=1) never read user settings
    Promise.resolve(storage?.get?.('settings', null)).then((v) => {
      if (!v) return;
      if (typeof v.sound === 'boolean') st.sound = v.sound;
      if (TEXT_STEPS.includes(v.text)) st.text = v.text;
      apply();
    }).catch(() => {});
  }

  const extraItems = () => { try { return (extras() ?? []).filter((x) => x && x.id && x.page); } catch { return []; } };
  const rulesList = () => [...list(T.rules), ...list(extraRules())];
  const aboutBlocks = () => {
    const facts = [];
    if (T.native) facts.push(['Native name', T.native]);
    const alt = list(text.alt).filter((a) => a !== T.native && a !== T.title);
    if (alt.length) facts.push(['Also known as', alt.join(', ')]);
    if (T.countries?.length) facts.push(['Where', T.countries.join(', ')]);
    const blocks = [];
    if (facts.length) blocks.push({ facts });
    if (T.heritage) blocks.push({ para: T.heritage });
    if (blocks.length) blocks.push({ para: 'This game is one of a growing collection of traditional games, crafts and music from around the world. Sources are listed in the World Heritage Games encyclopedia.', italic: true });
    return blocks;
  };
  const creditLines = () => [...list(text.credits), ...list(text.photos), ...list(text.licences), ...list(text.licenses)];

  const hasPage = {
    howto: () => list(T.howToPlay).length > 0,
    rules: () => rulesList().length > 0,
    about: () => aboutBlocks().length > 0,
    credits: () => creditLines().length > 0,
    settings: () => true,
  };
  const items = () => {
    const out = [];
    if (hasPage.rules()) out.push({ id: 'rules', label: 'Rules', icon: 'list' });
    for (const x of extraItems()) out.push({ id: 'x:' + x.id, label: String(x.label ?? x.id), icon: x.icon ?? 'note' });
    if (hasPage.about()) out.push({ id: 'about', label: 'About', icon: 'info' });
    if (hasPage.credits()) out.push({ id: 'credits', label: 'Credits', icon: 'star' });
    out.push({ id: 'settings', label: 'Settings', icon: 'gear' });
    return out;
  };

  const settingsPage = () => {
    const confirming = ui.now() < st.confirmUntil;
    const blocks = [
      { h: 'Sound', buttons: [{ id: 'set:sound', label: st.sound ? 'Sound: on' : 'Sound: off', icon: st.sound ? 'sound' : 'mute' }] },
      { h: 'Text size', para: `Currently ${Math.round(st.text * 100)} percent.`, buttons: [{ id: 'set:tdown', label: 'A-  Smaller', off: st.text <= TEXT_STEPS[0] }, { id: 'set:tup', label: 'A+  Larger', off: st.text >= TEXT_STEPS[TEXT_STEPS.length - 1] }] },
      ...settingsBlocks(),
    ];
    const b = best();
    if (b && typeof b.score === 'number') blocks.push({ h: 'Progress', para: `Best score: ${b.score}${b.stars ? `, ${b.stars} of 3 stars` : ''}.`, buttons: [{ id: 'set:reset', label: confirming ? 'Tap again to confirm' : 'Reset best score', icon: 'trash', primary: confirming }] });
    return blocks;
  };
  const pageDef = (id) => {
    if (id === 'howto') return { blocks: [{ h: 'How to play', steps: list(T.howToPlay) }] };
    if (id === 'rules') return { blocks: [{ h: 'Rules', bullets: rulesList() }] };
    if (id === 'about') return { blocks: [{ h: 'About this tradition' }, ...aboutBlocks()] };
    if (id === 'credits') return { blocks: [{ h: 'Credits', bullets: creditLines() }, { para: 'Written and made for World Heritage Games.', italic: true }] };
    if (id === 'settings') return { blocks: [{ h: 'Settings' }, ...settingsPage()] };
    if (id && id.startsWith('x:')) { const x = extraItems().find((e) => 'x:' + e.id === id); if (x) { let blocks = []; try { blocks = typeof x.page.blocks === 'function' ? x.page.blocks() : x.page.blocks; } catch { /* engine error never breaks the menu */ } return { blocks: [{ h: x.page.title ?? x.label ?? x.id }, ...(blocks ?? [])] }; } }
    return { blocks: [] };
  };

  const press = (id) => {
    if (id === 'howto' || id === 'rules' || id === 'about' || id === 'credits' || id === 'settings' || (typeof id === 'string' && id.startsWith('x:'))) {
      st.page = id; st.confirmUntil = -1; return 'open';
    }
    if (typeof id !== 'string' || !id.startsWith('set:')) return null;
    const k = id.slice(4);
    if (k === 'sound') { if (st.sound) ui.sfx.tap(); st.sound = !st.sound; apply(); save(); if (st.sound) ui.sfx.select(); }
    else if (k === 'tdown' || k === 'tup') {
      const i = TEXT_STEPS.indexOf(st.text), j = Math.max(0, Math.min(TEXT_STEPS.length - 1, i + (k === 'tup' ? 1 : -1)));
      if (j !== i) { st.text = TEXT_STEPS[j]; apply(); save(); ui.sfx.select(); } else ui.sfx.miss();
    } else if (k === 'reset') {
      if (ui.now() < st.confirmUntil) { st.confirmUntil = -1; resetBest(); ui.sfx.good(); } else { st.confirmUntil = ui.now() + 3; ui.sfx.miss(); }
    }
    return 'stay';
  };
  const render = (ctx, W, H, scroll) => {
    const d = pageDef(st.page);
    return ui.cardPage(ctx, W, H, { title: T.title, blocks: d.blocks, scroll });
  };
  return { items, press, render, close: () => { st.page = null; st.confirmUntil = -1; }, get page() { return st.page; }, state: st };
}

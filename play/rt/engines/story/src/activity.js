// Story and performance activity (docs/ENGINE-CONTRACT.md "Activity engines").
// A short branching story told on a drawn stage (shadow screen, marionette theatre, glove booth, water pond, mask stage,
// caravan map, verse page). The player's choices move meters (wit, goodwill, wealth ...) and gather wisdom points; the
// scene graph ends in an ending that sets 0-3 stars. All art is drawn from primitives; all text comes from params.
import { mix, dark, light, alpha, vgrad, rrPath } from './figures.js';
import { drawSceneArt } from './stages.js';
import { THEATRES } from './theatres.js';
import { makeSoundscape } from './sound.js';
import { resolveSkin, pattern, drawCard, drawNamePlate, drawPlaque, drawMedallion, drawBead } from './skins.js';
import { voice, fx } from '../../../platform/engine-kit/synth.js';

export const STAGES = ['shadow', 'marionette', 'glove', 'water', 'mask', 'caravan', 'verse'];
export const SLOTS = { left: 0.2, midleft: 0.36, center: 0.5, midright: 0.64, right: 0.8 };
export const DEFAULTS = {
  stage: 'marionette',
  start: 'start',
  cast: {},
  meters: [{ id: 'wit', label: 'Wit', start: 0, max: 5 }],
  scenes: { start: { text: 'The story begins.', end: true } },
  endings: [{ id: 'done', stars: 1, headline: 'The end', text: 'The tale is told.' }],
  route: [],
  look: {},
  speed: 90,
  setting: null,
};

const STAGE_LOOK = {
  shadow: { wall: '#0d0705', screen: '#f7e2a8', screenEdge: '#d89a3c', lamp: '#fff2c0', frame: '#4a2c14', curtain: '#6b1d1d' },
  marionette: { wall: '#2b3d58', floor: '#7a5230', curtain: '#9c2a2a', frame: '#4a2c14', far: '#1d2a40', near: '#35507a', glow: '#f5d27a' },
  glove: { wall: '#3d5a52', floor: '#7a5230', curtain: '#c0442e', frame: '#5a3a1c', far: '#27403a', near: '#4a7068', glow: '#f5d27a' },
  water: { wall: '#7a2a1c', floor: '#2a6f86', curtain: '#b3261e', frame: '#4a2c14', far: '#5a1d12', near: '#a04a2c', glow: '#f5d27a' },
  mask: { wall: '#493a5c', floor: '#8a6038', curtain: '#7a2230', frame: '#4a2c14', far: '#2e2440', near: '#5e4a78', glow: '#f5d27a' },
  caravan: { wall: '#e8d6a8', floor: '#c9a35e', curtain: '#b3261e', frame: '#5a3a1c', far: '#a67c3a', near: '#c9a35e', glow: '#fff1b8', ink: '#4a3420' },
  verse: { wall: '#f1e6c8', floor: '#f1e6c8', curtain: '#5a3a1c', frame: '#8a6a3a', far: '#d8c79a', near: '#e6d6a8', glow: '#c9a35e', ink: '#3a2a18' },
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SERIF = 'Georgia, "Times New Roman", serif';
const fract = (x) => x - Math.floor(x);
const hash = (n) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);

// The setting picks props and dressing (gunungan, tulip arch, marigold garlands, bamboo pavilion ...). It is read from
// params.setting, or guessed from the title / cast so that games written before it existed still look distinct.
export const SETTINGS = ['generic', 'wayang', 'karagoz', 'kathputli', 'yokethe', 'bohemian', 'aragoz', 'vietnam', 'commedia', 'silkroad', 'sahel', 'persian', 'malagasy'];
function inferSetting(P, title) {
  if (P.setting && SETTINGS.includes(P.setting)) return P.setting;
  const hay = `${title ?? ''} ${Object.values(P.cast ?? {}).map((c) => c.name).join(' ')} ${Object.keys(P.cast ?? {}).join(' ')}`.toLowerCase();
  const has = (re) => re.test(hay);
  if (P.stage === 'shadow') return has(/wayang|kancil|java|indones/) ? 'wayang' : has(/karag|hacivat|turk/) ? 'karagoz' : 'generic';
  if (P.stage === 'marionette') return has(/kathputli|raja|rajasthan|india/) ? 'kathputli' : has(/yoke|myanmar|burm/) ? 'yokethe' : 'bohemian';
  if (P.stage === 'glove') return 'aragoz';
  if (P.stage === 'water') return 'vietnam';
  if (P.stage === 'mask') return 'commedia';
  if (P.stage === 'caravan') return has(/sahel|salt|timbuktu|mali|niger|camel.*salt/) ? 'sahel' : 'silkroad';
  if (P.stage === 'verse') return has(/hira|gasy|madagas|rabe|troupe/) ? 'malagasy' : 'persian';
  return 'generic';
}

export function createActivity(userParams, env) {
  const P = { ...DEFAULTS, ...userParams };
  P.setting = inferSetting(P, env.text?.title);
  const TH = THEATRES[P.setting] ?? null;
  P.look = { ...STAGE_LOOK[P.stage] ?? STAGE_LOOK.marionette, ...(TH?.look ?? {}), ...(P.look ?? {}) };
  const { palette: pal, audio } = env;
  const skin = resolveSkin(TH?.skin, pal);
  const snd = makeSoundscape(P.setting, skin.snd);
  const scenes = P.scenes;
  const meterDefs = P.meters;
  const tone = (o) => { try { audio?.tone(o); } catch { /* sound is optional */ } };
  // natural voice when the shared synth graph exists (platform/engine-kit/synth.js), the plain tone otherwise
  const play = (e) => {
    try {
      env.options?.soundLog?.push({ t: Math.round((V?.t ?? 0) * 1000) / 1000, kind: e.v ? (e.v.fx ?? e.v.voice) : 'tone' });
      if (e.v && audio?.context) { if (e.v.fx ? fx(audio, e.v.fx, e.v.p) : voice(audio, e.v.voice, e.v.p)) return; }
    } catch { /* sound is optional */ }
    if (!audio?.context) tone(e.o);
  };

  // ---- story graph helpers -------------------------------------------------------------------------------------
  const optionsOf = (scene) => {
    if (!scene) return [];
    if (scene.puzzle) {
      const pz = scene.puzzle, right = pz.right ?? {}, wrong = pz.wrong ?? {};
      return pz.options.map((text, i) => {
        const ok = i === pz.answer, src = ok ? right : wrong;
        return { text, pts: ok ? (right.pts ?? 2) : (wrong.pts ?? 0), effects: src.effects, set: src.set, next: src.next ?? right.next, correct: ok, verse: pz.addVerse ? text : undefined };
      });
    }
    if (scene.choices?.length) return scene.choices;
    if (scene.next) return [{ text: scene.cont ?? 'Continue', next: scene.next, pts: 0 }];
    return [];
  };
  const isEnd = (id) => !scenes[id] || scenes[id].end === true || optionsOf(scenes[id]).length === 0;
  const maxPts = (() => {
    const memo = new Map();
    const go = (id, stack) => {
      if (isEnd(id)) return 0;
      if (memo.has(id)) return memo.get(id);
      if (stack.has(id)) return 0;
      stack.add(id);
      let best = 0;
      for (const o of optionsOf(scenes[id])) best = Math.max(best, (o.pts ?? 0) + go(o.next, stack));
      stack.delete(id); memo.set(id, best); return best;
    };
    return go(P.start, new Set());
  })();

  const meetsWhen = (w, S) => {
    if (!w) return true;
    for (const [m, v] of Object.entries(w.min ?? {})) if ((S.meters[m] ?? 0) < v) return false;
    for (const [m, v] of Object.entries(w.max ?? {})) if ((S.meters[m] ?? 0) > v) return false;
    for (const f of w.flags ?? []) if (!S.flags.includes(f)) return false;
    for (const f of w.notFlags ?? []) if (S.flags.includes(f)) return false;
    if (w.pts != null && S.pts < w.pts) return false;
    return true;
  };

  // ---- state -----------------------------------------------------------------------------------------------------
  let S;       // story state
  let V;       // view state (animation only; deterministic from dt)
  let layout = null;
  let done = null;
  let tip = '';

  const enable = (o) => {
    const need = o.requires ?? {};
    for (const [m, v] of Object.entries(need)) if ((S.meters[m] ?? 0) < v) return false;
    for (const f of o.needFlags ?? []) if (!S.flags.includes(f)) return false;
    return true;
  };
  const currentOptions = () => {
    const sc = scenes[S.scene];
    let opts = optionsOf(sc);
    if (isEnd(S.scene)) opts = [{ text: 'Take a bow', end: true, pts: 0 }];
    const en = opts.map(enable);
    const any = en.some(Boolean);
    return opts.map((o, i) => ({ ...o, enabled: any ? en[i] : true }));
  };

  const sfx = (delay, o, v = null) => { V.sfx.push({ at: V.t + delay, o, v }); };
  const burst = (n, type, cols, y = 0.82) => {
    for (let i = 0; i < n; i++) {
      const h = hash(V.pc++);
      V.parts.push({ x: 0.08 + 0.84 * h, y, vx: (hash(V.pc + 3) - 0.5) * 0.12, vy: -(0.22 + 0.3 * hash(V.pc + 7)), age: 0, life: 1.1 + 0.7 * hash(V.pc + 11), size: 0.8 + hash(V.pc + 5) * 0.9, type, col: cols[i % cols.length] });
    }
    if (V.parts.length > 60) V.parts.splice(0, V.parts.length - 60);
  };

  const enterScene = (id) => {
    S.scene = id;
    const sc = scenes[id];
    V.revealT = 0; V.voiceN = 0; V.scroll = 0; V.hover = -1; V.wait = 0; V.trans = S.steps > 0 ? 1 : 0; V.endT = 0;
    if (sc?.verse) { S.poem.push(sc.verse); V.lineAge = 0; }
    if (sc?.stop != null) S.stop = sc.stop;
    const on = new Set((sc?.on ?? []).map((e) => e.who));
    for (const e of sc?.on ?? []) {
      const tx = SLOTS[e.at] ?? SLOTS.center;
      if (!V.figs[e.who]) V.figs[e.who] = { x: tx < 0.5 ? -0.12 : 1.12, alpha: 1, a1: 0.1, a2: 0.1, lean: 0 };
      Object.assign(V.figs[e.who], { target: tx, pose: e.pose ?? 'idle', face: e.face, out: false });
    }
    for (const [who, f] of Object.entries(V.figs)) if (!on.has(who)) { f.out = true; f.target = f.x < 0.5 ? -0.15 : 1.15; }
    if (isEnd(id)) {
      S.ending = P.endings.find((e) => meetsWhen(e.when, S)) ?? P.endings[P.endings.length - 1];
      const n = clamp(S.ending.stars ?? 0, 0, 3);
      for (let k = 0; k < n; k++) for (const e of snd.star(k)) sfx(0.85 + 0.42 * k + e.at, e.o, e.v);
      for (const e of (n > 0 ? snd.good(2) : snd.bad())) sfx(0.2 + e.at, e.o, e.v);
      V.crowd.cheer = n > 0 ? 1 : 0.4; V.crowd.mood = n > 0 ? 1 : -1;
      if (n > 0) burst(14, 'star', ['#ffe27a', '#fff3b0', '#ffb23a']);
    } else {
      if (V.startT !== undefined) for (const e of snd.scene()) sfx(e.at, e.o, e.v);   // the opening scene is silent (1.4.2)
    }
  };

  const init = () => {
    S = { scene: P.start, meters: {}, flags: [], pts: 0, poem: [], stop: 0, steps: 0, ending: null, log: [] };
    for (const m of meterDefs) S.meters[m.id] = m.start ?? 0;
    V = { voiceN: 0, t: 0, revealT: 0, scroll: 0, hover: -1, wait: 0, figs: {}, flash: [], down: null, ready: false, trans: 0, endT: 0, lineAge: 9, crowd: { cheer: 0, mood: 0 }, parts: [], pc: 1, sfx: [], ptr: null };
    done = null; tip = '';
    enterScene(P.start);
  };
  init();

  const apply = (o) => {
    let net = 0;
    for (const [m, d] of Object.entries(o.effects ?? {})) {
      const def = meterDefs.find((x) => x.id === m);
      if (!def) continue;
      const before = S.meters[m];
      S.meters[m] = clamp(before + d, 0, def.max ?? 99);
      const real = S.meters[m] - before;
      if (real) {
        net += real;
        V.flash.push({ m, d: real, age: 0 });
      }
    }
    for (const f of o.set ?? []) if (!S.flags.includes(f)) S.flags.push(f);
    for (const f of o.clear ?? []) S.flags = S.flags.filter((x) => x !== f);
    S.pts += o.pts ?? 0;
    return net;
  };

  const choose = (i) => {
    if (done) return;
    const opts = currentOptions();
    const o = opts[i];
    if (!o) return;
    if (!o.enabled) { tip = 'You cannot do that yet.'; return; }
    if (V.startT === undefined) { V.startT = V.t; V.beat = 0; V.beatAt = V.t; }   // the first real choice starts the ensemble (1.4.2)
    tip = '';
    if (o.end) {
      const e = S.ending ?? P.endings[P.endings.length - 1];
      done = { score: S.pts, max: Math.max(maxPts, S.pts), stars: clamp(e.stars ?? 0, 0, 3), headline: e.headline ?? 'The end', detail: `${S.pts} of ${Math.max(maxPts, S.pts)} wise points` };
      return;
    }
    for (const e of snd.tap()) sfx(0, e.o, e.v);
    S.steps++;
    S.log.push(o.text);
    const net = apply(o);
    if (o.verse) { S.poem.push(o.verse); V.lineAge = 0; }
    // audience reaction: warm applause for wise choices, a murmur for rash ones
    const good = (o.pts ?? 0) > 0 || net > 0 || o.correct === true;
    const bad = !good && (net < 0 || o.correct === false);
    V.crowd.mood = good ? 1 : bad ? -1 : 0;
    V.crowd.cheer = good ? 1 : bad ? 0.7 : 0.25;
    if (good) {
      burst(10 + Math.min(8, (o.pts ?? 0) * 2), 'star', ['#ffe27a', '#fff3b0', '#ffb23a']);
      burst(4, 'heart', ['#ff7a8a', '#ff9eb0']);
      for (const e of snd.good(o.pts ?? 0)) sfx(e.at, e.o, e.v);
    } else if (bad) {
      burst(3, 'puff', ['#e0a0a0']);
      for (const e of snd.bad()) sfx(e.at, e.o, e.v);
    } else for (const e of snd.neutral()) sfx(e.at, e.o, e.v);
    enterScene(o.next);
  };

  // ---- time ------------------------------------------------------------------------------------------------------
  const poseTargets = (f, who, sc) => {
    const speaking = sc.speaker === who && !isEnd(S.scene) && !f.out && V.revealT * P.speed < totalChars() + 8;
    const wave = Math.sin(V.t * 7 + (f.x ?? 0) * 5);
    const talk = Math.sin(V.t * 5 + (f.x ?? 0) * 3);
    let a1 = 0.1, a2 = 0.1;
    switch (f.pose) {
      case 'cheer': a1 = 2.5 + wave * 0.25; a2 = 2.5 - wave * 0.25; break;
      case 'point': a1 = 0.18; a2 = 1.5; break;
      case 'bow': a1 = 0.35; a2 = 0.35; break;
      case 'slump': a1 = 0.04; a2 = 0.04; break;
      case 'hold': a1 = 0.1; a2 = 0.95; break;
      default: break;
    }
    if (speaking && f.pose !== 'cheer' && f.pose !== 'point') { a2 = 0.95 + talk * 0.32; a1 = 0.14 + Math.max(0, -talk) * 0.1; }
    return { a1, a2, speaking, lean: f.pose === 'bow' ? 0.32 : f.pose === 'slump' ? 0.2 : 0 };
  };

  const tick = (dt) => {
    V.t += dt; V.revealT += dt; V.endT += dt; V.lineAge += dt;
    // no talking blips while the text types out (1.4.1): the readout is silent; the tradition's ensemble and the event cues carry the sound
    // the tradition's ensemble: a quiet looping pattern that fades in over the first seconds of the play
    // 1.4.2: silent until the first choice; then it fades in over 6 s, sits well below the cues (x0.6), and stops when the story ends
    if (audio?.context && V.startT !== undefined && !done) {
      let guard = 0;
      while (V.t >= V.beatAt && guard++ < 4) {
        const gain = clamp((V.t - V.startT) / 6, 0, 1) * 0.6 * (V.revealT * P.speed < totalChars() ? 0.7 : 1);
        for (const e of snd.ambient(V.beat, gain)) play(e);
        V.beat++; V.beatAt += snd.step;
      }
    }
    V.trans = Math.max(0, V.trans - dt * 3.2);
    V.crowd.cheer = Math.max(0, V.crowd.cheer - dt * 0.55);
    const sc = scenes[S.scene] ?? {};
    for (const [who, f] of Object.entries(V.figs)) {
      const d = f.target - f.x, step = 1.1 * dt;
      f.walk = Math.abs(d) > step;
      f.x = Math.abs(d) <= step ? f.target : f.x + Math.sign(d) * step;
      if (f.out) f.alpha = clamp(f.alpha - dt * 1.4, 0, 1);
      else f.alpha = clamp((f.alpha ?? 1) + dt * 2, 0, 1);
      const tg = poseTargets(f, who, sc);
      const k = Math.min(1, dt * 9);
      f.a1 += (tg.a1 - f.a1) * k; f.a2 += (tg.a2 - f.a2) * k; f.lean += (tg.lean - f.lean) * k; f.speaking = tg.speaking;
    }
    for (const fl of V.flash) fl.age += dt;
    V.flash = V.flash.filter((fl) => fl.age < 1.4);
    for (const p of V.parts) p.age += dt;
    V.parts = V.parts.filter((p) => p.age < p.life);
    if (V.sfx.length) {
      const due = V.sfx.filter((e) => e.at <= V.t);
      if (due.length) { V.sfx = V.sfx.filter((e) => e.at > V.t); for (const e of due) play(e); }
    }
  };

  // ---- text blocks -----------------------------------------------------------------------------------------------
  const sceneBody = () => {
    const sc = scenes[S.scene] ?? {};
    if (isEnd(S.scene)) {
      const e = S.ending ?? {};
      return { name: e.headline ?? 'The end', text: [sc.text, e.text].filter(Boolean).join(' '), prompt: '', ending: true };
    }
    return { name: sc.speaker && P.cast[sc.speaker] ? P.cast[sc.speaker].name : '', text: sc.text ?? '', prompt: sc.puzzle?.prompt ?? '' };
  };
  const totalChars = () => { const b = sceneBody(); return b.text.length + b.prompt.length; };
  const revealed = () => V.revealT * P.speed >= totalChars();

  // ---- the view handed to the stage painters ---------------------------------------------------------------------
  const buildView = () => {
    const sc = scenes[S.scene] ?? {};
    const figs = [];
    for (const [who, f] of Object.entries(V.figs)) {
      const c = P.cast[who];
      if (!c || f.alpha < 0.01) continue;
      const flip = f.face ? f.face === 'left' : f.target > 0.56 || (f.out && f.x > 0.5 && f.target > 0.5);
      figs.push({ who, c: { ...c, phase: c.phase ?? (who.length * 0.7) }, x: f.x, pose: f.pose, speaking: !!f.speaking, flip, alpha: f.alpha, a1: f.a1, a2: f.a2, lean: f.lean, walk: !!f.walk });
    }
    figs.sort((a, b) => a.x - b.x);
    const spk = sc.speaker && V.figs[sc.speaker];
    return {
      kind: P.stage, setting: P.setting, L: P.look, bg: sc.bg ?? 'stage', t: V.t, figs, poem: S.poem, route: P.route, stop: S.stop,
      spotX: spk && !spk.out ? clamp(spk.x, 0.1, 0.9) : null, crowd: V.crowd, parts: V.parts,
      endStars: isEnd(S.scene) && S.ending ? { n: clamp(S.ending.stars ?? 0, 0, 3), age: V.endT } : null,
      trans: V.trans, transKind: skin.trans, transCol: skin.transCol, lineAge: V.lineAge, opening: S.steps === 0 || isEnd(S.scene), speakerName: sc.speaker ?? null,
    };
  };

  // Large rendering of the setting for the title screen and the store art: three of the cast on the stage.
  const titleView = (t) => {
    const names = Object.keys(P.cast);
    const people = names.filter((n) => !['beast', 'croc', 'camel', 'duck'].includes(P.cast[n].kind));
    const pick = (people.length >= 2 ? people : names).slice(0, 3);
    const slots = pick.length === 1 ? [0.5] : pick.length === 2 ? [0.34, 0.66] : [0.24, 0.5, 0.76];
    const figs = pick.map((n, i) => ({ who: n, c: { ...P.cast[n], phase: n.length * 0.7 }, x: slots[i], pose: i === 1 ? 'cheer' : 'idle', speaking: false, flip: slots[i] > 0.56, alpha: 1, a1: i === 1 ? 2.4 : 0.12, a2: i === 1 ? 2.4 : 0.12, lean: 0, walk: false }));
    const first = scenes[P.start] ?? {};
    return {
      kind: P.stage, setting: P.setting, L: P.look, bg: first.bg ?? 'stage', t, figs, poem: first.verse ? [first.verse] : [P.cast[pick[0]]?.name ?? ''].filter(Boolean),
      route: P.route, stop: 0, spotX: figs.length ? 0.5 : null, crowd: { cheer: 0.6, mood: 1 }, parts: [], endStars: null, trans: 0, lineAge: 9, opening: true,
    };
  };

  // ---- drawing helpers for the lacquered UI ---------------------------------------------------------------------
  const lacquer = (ctx, x, y, w, h, r, base, o = {}) => {
    ctx.save();
    if (o.shadow !== false) { rrPath(ctx, x + 1, y + (o.pressed ? 1 : 3), w, h, r); ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fill(); }
    rrPath(ctx, x, y + (o.pressed ? 2 : 0), w, h, r);
    ctx.fillStyle = vgrad(ctx, y, y + h, [[0, light(base, o.hot ? 0.28 : 0.14)], [0.5, base], [1, dark(base, 0.38)]]); ctx.fill();
    ctx.clip();
    // gloss band on the upper half
    ctx.fillStyle = vgrad(ctx, y, y + h * 0.5, [[0, 'rgba(255,255,255,0.22)'], [1, 'rgba(255,255,255,0.02)']]);
    ctx.fillRect(x, y, w, h * 0.5);
    ctx.restore();
    rrPath(ctx, x + 0.75, y + 0.75 + (o.pressed ? 2 : 0), w - 1.5, h - 1.5, r); ctx.strokeStyle = o.edge ?? 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
    rrPath(ctx, x + 3, y + 3 + (o.pressed ? 2 : 0), w - 6, h - 6, Math.max(2, r - 3)); ctx.strokeStyle = o.inner ?? 'rgba(255,225,150,0.35)'; ctx.lineWidth = 1; ctx.stroke();
  };
  const txt = (ctx, s, x, y, size, color, align = 'left', weight = '400', family = 'system-ui, sans-serif') => {
    ctx.fillStyle = color; ctx.font = `${weight} ${Math.round(size)}px ${family}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(String(s), x, y);
  };

  // ---- layout + drawing ------------------------------------------------------------------------------------------
  function render(g, area) {
    const { ctx } = g;
    const px = g.px;
    const landscape = area.w > area.h * 1.2;
    const gap = 8;
    const body = sceneBody();
    const opts = currentOptions();
    const stageRect = {}, lowerRect = {};
    let metersRect;
    if (landscape) {
      const lw = Math.floor(area.w * 0.54);
      metersRect = { x: area.x, y: area.y + area.h - px(34) - 6, w: lw, h: px(32) };
      Object.assign(stageRect, { x: area.x, y: area.y, w: lw, h: area.h - px(34) - gap - 6 });
      Object.assign(lowerRect, { x: area.x + lw + gap, y: area.y, w: area.w - lw - gap, h: area.h });
    }
    const tw = (landscape ? lowerRect.w : area.w) - 34;
    // text block metrics at scale k; in landscape the column grows (up to 1.4x) so it fills the height instead of leaving a void
    const meas = (k) => {
      const fs = px(22) * k, os = px(19) * k;
      const lines = g.wrap(ctx, body.text, tw, fs);
      let plines = [];
      if (body.prompt) { // the prompt is set in bold serif: measure with that font so it never runs off the card
        ctx.save(); ctx.font = `700 ${Math.round(px(21) * k)}px ${SERIF}`;
        let cur = '';
        for (const w of body.prompt.split(/\s+/)) { const tr = cur ? `${cur} ${w}` : w; if (cur && ctx.measureText(tr).width > tw - 8) { plines.push(cur); cur = w; } else cur = tr; }
        if (cur) plines.push(cur);
        ctx.restore();
      }
      const nameH = body.name ? px(34) * k : 0;
      const textH = nameH + lines.length * fs * 1.34 + (plines.length ? plines.length * px(21) * k * 1.34 + 10 : 0) + 26;
      const optH = opts.map((o) => Math.max(px(52) * k, g.wrap(ctx, o.text, tw - 56, os).length * os * 1.26 + px(22) * k));
      const optsH = optH.reduce((a, b) => a + b + gap + 1, 0);
      return { k, fs, os, lines, plines, nameH, textH, optH, optsH, contentH: textH + gap + optsH };
    };
    let M = meas(1);
    if (landscape) { for (let k = 1.4; k > 1.01; k -= 0.06) { const c = meas(k); if (c.contentH <= area.h * 0.9) { M = c; break; } } }
    const { fs, os, lines, plines, nameH, textH, optH, contentH } = M;
    const ks = M.k;
    if (!landscape) {
      const metersH = px(34);
      const minStage = Math.min(area.h * 0.32, 230);
      const stageH = clamp(area.h - metersH - gap * 2 - contentH, minStage, area.h * 0.76);
      Object.assign(stageRect, { x: area.x, y: area.y, w: area.w, h: stageH });
      metersRect = { x: area.x, y: area.y + stageH + gap / 2, w: area.w, h: px(32) };
      const ly = metersRect.y + metersH + gap / 2;
      Object.assign(lowerRect, { x: area.x, y: ly, w: area.w, h: area.y + area.h - ly });
    }
    const maxScroll = Math.max(0, contentH - lowerRect.h + 4);
    V.scroll = clamp(V.scroll, 0, maxScroll);

    drawSceneArt(g, stageRect, buildView());

    // meters: lacquered pills with glowing beads
    const n = meterDefs.length;
    const cw = (metersRect.w - (n - 1) * 6) / Math.max(1, n);
    meterDefs.forEach((m, i) => {
      const x = metersRect.x + i * (cw + 6), v = S.meters[m.id] ?? 0, mx = m.max ?? 5;
      const cy = metersRect.y + metersRect.h / 2;
      lacquer(ctx, x, metersRect.y, cw, metersRect.h, metersRect.h / 2, skin.meter.fill, { shadow: false, inner: skin.meter.edge });
      const lab = px(15);
      const label = m.label ?? m.id;
      txt(ctx, label, x + 12, cy, lab, skin.meter.ink, 'left', '700');
      const bx = x + 12 + Math.min(cw * 0.42, label.length * lab * 0.62 + 8), bw = x + cw - 12 - bx;
      if (bw > 20) {
        if (mx <= 8) {
          const pw = bw / mx;
          for (let k = 0; k < mx; k++) {
            const bxk = bx + pw * (k + 0.5), r = Math.min(pw * 0.34, metersRect.h * 0.26);
            drawBead(ctx, skin, bxk, cy, r, k < v, V.t);
          }
        } else {
          rrPath(ctx, bx, cy - 5, bw, 10, 5); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
          if (v > 0) { rrPath(ctx, bx, cy - 5, Math.max(10, bw * (v / mx)), 10, 5); ctx.fillStyle = vgrad(ctx, cy - 5, cy + 5, [[0, light(pal.accent, 0.4)], [1, dark(pal.accent, 0.2)]]); ctx.fill(); }
        }
      }
      for (const fl of V.flash) if (fl.m === m.id) { ctx.globalAlpha = clamp(1.4 - fl.age, 0, 1); txt(ctx, `${fl.d > 0 ? '+' : ''}${fl.d}`, x + cw - 20, metersRect.y - fl.age * 16, px(20), fl.d > 0 ? pal.good : pal.bad, 'center', '800'); ctx.globalAlpha = 1; }
    });

    if (landscape) { // lectern panel behind the column: tinted velvet with the tradition's pattern, so the side never reads as a void
      ctx.save(); rrPath(ctx, lowerRect.x, lowerRect.y, lowerRect.w, lowerRect.h, 14); ctx.clip();
      ctx.fillStyle = vgrad(ctx, lowerRect.y, lowerRect.y + lowerRect.h, [[0, alpha(skin.card.top, 0.2)], [1, alpha(skin.card.bot, 0.5)]]); ctx.fillRect(lowerRect.x, lowerRect.y, lowerRect.w, lowerRect.h);
      if (skin.card.pattern) pattern(ctx, skin.card.pattern, lowerRect.x, lowerRect.y, lowerRect.w, lowerRect.h, skin.card.patCol ?? skin.card.edge, 0.07);
      const lg = ctx.createRadialGradient(lowerRect.x + lowerRect.w / 2, lowerRect.y + lowerRect.h * 0.45, 10, lowerRect.x + lowerRect.w / 2, lowerRect.y + lowerRect.h * 0.45, lowerRect.h * 0.8);
      lg.addColorStop(0, 'rgba(255,230,170,0.08)'); lg.addColorStop(1, 'rgba(0,0,0,0.3)'); ctx.fillStyle = lg; ctx.fillRect(lowerRect.x, lowerRect.y, lowerRect.w, lowerRect.h);
      ctx.restore();
      rrPath(ctx, lowerRect.x + 0.5, lowerRect.y + 0.5, lowerRect.w - 1, lowerRect.h - 1, 14); ctx.strokeStyle = alpha(skin.card.edge, 0.35); ctx.lineWidth = 1; ctx.stroke();
    }
    // lower block: dialogue card and lacquered choice plaques, scrollable
    ctx.save(); ctx.beginPath(); ctx.rect(lowerRect.x - 4, lowerRect.y, lowerRect.w + 8, lowerRect.h); ctx.clip();
    let y = lowerRect.y - V.scroll + (landscape && contentH < lowerRect.h ? Math.floor((lowerRect.h - contentH) * 0.42) : 0);
    const cardX = lowerRect.x + 2, cardW = lowerRect.w - 4;
    // card
    drawCard(ctx, skin, cardX, y, cardW, textH, V.t);
    const inkC = skin.card.ink, hiC = skin.card.accent;
    let shown = Math.floor(V.revealT * P.speed);
    const tx = cardX + 16;
    let ty = y + 12;
    if (body.name) {
      const nw = Math.min(cardW - 32, (body.name.length * px(18) * ks * 0.62) + 28);
      drawNamePlate(ctx, skin, tx - 4, ty - 2, nw, nameH - 6, body.ending);
      txt(ctx, body.name, tx + 10, ty + (nameH - 6) / 2 - 2, px(18) * ks, body.ending ? '#1b1206' : skin.name.ink, 'left', '800', SERIF);
      ty += nameH;
    }
    for (const ln of lines) {
      const part = ln.slice(0, Math.max(0, shown)); shown -= ln.length + 1;
      if (part) txt(ctx, part, tx, ty + fs * 0.66, fs, inkC, 'left', '400');
      ty += fs * 1.34;
    }
    if (plines.length) {
      ty += 6;
      for (const ln of plines) { const part = ln.slice(0, Math.max(0, shown)); shown -= ln.length + 1; if (part) txt(ctx, part, tx, ty + px(21) * ks * 0.66, px(21) * ks, hiC, 'left', '700', SERIF); ty += px(21) * ks * 1.34; }
    }
    if (!revealed()) { // small "skip" hint caret while the voice is typing
      const bl = 0.5 + 0.5 * Math.sin(V.t * 8);
      ctx.globalAlpha = 0.4 + 0.5 * bl; txt(ctx, '▾', cardX + cardW - 20, y + textH - 16, px(16), hiC, 'center', '700'); ctx.globalAlpha = 1;
    }
    y += textH + gap;
    const hits = [];
    const ready = revealed();
    const ptr = V.ptr;
    opts.forEach((o, i) => {
      const h = optH[i], x = lowerRect.x + 2, w = lowerRect.w - 4;
      hits.push({ x, y, w, h });
      if (ready) {
        const over = ptr && ptr.x >= x && ptr.x <= x + w && ptr.y >= y && ptr.y <= y + h && ptr.y >= lowerRect.y && ptr.y <= lowerRect.y + lowerRect.h;
        const hot = V.hover === i || (over && o.enabled);
        const pressed = over && ptr.down && o.enabled;
        const appear = clamp((V.revealT * P.speed - totalChars()) / 1 + 1, 0, 1); // plaques settle in once the voice finishes
        const lift = (1 - clamp((V.revealT - totalChars() / P.speed) * 5 - i * 0.4, 0, 1)) * 8;
        ctx.globalAlpha = (o.enabled ? 1 : 0.42) * (appear > 0 ? 1 : 0);
        drawPlaque(ctx, skin, x, y + lift, w, h, { hot, pressed, end: o.end });
        const ink = o.end ? skin.plaque.inkEnd : skin.plaque.ink;
        if (opts.length > 1) {
          const br = Math.min(h * 0.3, px(17) * ks);
          drawMedallion(ctx, skin, x + 26, y + lift + h / 2 + (pressed ? 2 : 0), br, String(i + 1), txt, px(0) * 0.95);
        }
        const wl = g.wrap(ctx, o.text, tw - 56, os);
        const startY = y + lift + h / 2 - ((wl.length - 1) * os * 1.26) / 2 + (pressed ? 2 : 0);
        wl.forEach((l, k) => txt(ctx, l, opts.length > 1 ? x + 26 + Math.min(h * 0.3, px(17) * ks) + 12 : x + w / 2, startY + k * os * 1.26, os, ink, opts.length > 1 ? 'left' : 'center', '600'));
        ctx.globalAlpha = 1;
      }
      y += h + gap + 1;
    });
    ctx.restore();
    layout = { lowerRect, hits, textRect: { x: lowerRect.x, y: lowerRect.y - V.scroll, w: lowerRect.w, h: textH }, maxScroll };
  }

  // ---- input -----------------------------------------------------------------------------------------------------
  const tap = (x, y) => {
    if (!layout || done) return;
    const lr = layout.lowerRect;
    if (!revealed()) { V.revealT = totalChars() / P.speed + 0.01; return; }
    if (x < lr.x || x > lr.x + lr.w || y < lr.y || y > lr.y + lr.h) return;
    const i = layout.hits.findIndex((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
    if (i >= 0) choose(i);
  };

  const keyChoice = (keys) => {
    if (!keys?.pressed || done) return;
    const n = currentOptions().length;
    for (let i = 0; i < Math.min(n, 9); i++) if (keys.pressed.has(`Digit${i + 1}`) || keys.pressed.has(String(i + 1))) { if (!revealed()) V.revealT = 999; else choose(i); return; }
    if (n === 1 && (keys.pressed.has('Space') || keys.pressed.has('Enter') || keys.pressed.has(' '))) { if (!revealed()) V.revealT = 999; else choose(0); }
  };

  const scrollInput = (input) => {
    const p = input.pointer;
    V.ptr = p.down || p.released || p.pressed ? { x: p.x, y: p.y, down: !!p.down } : (V.ptr && p.x != null ? { x: p.x, y: p.y, down: false } : null);
    if (input.wheel && layout) V.scroll = clamp(V.scroll + input.wheel.dy, 0, layout.maxScroll);
    if (p.pressed) V.down = { x: p.x, y: p.y, sy: V.scroll, moved: false };
    if (V.down && p.down && layout) {
      const dy = p.y - V.down.y;
      if (Math.abs(dy) > 12 && layout.maxScroll > 0) { V.down.moved = true; V.scroll = clamp(V.down.sy - dy, 0, layout.maxScroll); }
    }
    if (p.released && V.down) {
      if (!V.down.moved) tap(p.x, p.y);
      V.down = null;
    }
  };

  const bestOption = () => {
    const opts = currentOptions();
    let bi = 0, bp = -Infinity;
    opts.forEach((o, i) => { if (o.enabled && (o.pts ?? 0) > bp) { bp = o.pts ?? 0; bi = i; } });
    return bi;
  };

  const act = {
    init,
    point(id) {
      if (!layout) return null;
      const m = /^choice:(\d+)$/.exec(id);
      if (m) { const h = layout.hits[Number(m[1])]; return h ? { x: h.x + h.w / 2, y: h.y + h.h / 2 } : null; }
      if (id === 'text') { const r = layout.textRect; return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }
      return null;
    },
    update(dt, input) {
      tick(dt);
      if (done) return;
      keyChoice(input.keys);
      scrollInput(input);
    },
    attract(dt) {
      if (done) return;
      tick(dt);
      if (!revealed()) return;
      V.wait += dt;
      const read = 0.9 + totalChars() * 0.02;
      if (V.wait < read) return;
      const i = bestOption();
      V.hover = i;
      if (V.wait >= read + 0.7) choose(i);
    },
    render,
    // Optional: a large rendering of the setting for the title screen (the shell may call it with any rect).
    titleArt(g, rect) {
      drawSceneArt(g, rect, titleView(V.t + 1.3));
    },
    status() {
      const e = isEnd(S.scene);
      return { score: S.pts, max: Math.max(maxPts, 1), label: tip || (e ? 'The tale ends' : 'Choose wisely') };
    },
    result: () => done,
    hint() {
      const opts = currentOptions();
      const i = bestOption();
      if (opts.length <= 1) return 'Tap to carry the story on.';
      const sc = scenes[S.scene] ?? {};
      if (sc.hint) return sc.hint;
      return `Think about what the story needs: option ${i + 1} looks wisest.`;
    },
    rules() {
      const lines = [`Every choice moves the meters (${meterDefs.map((m) => m.label ?? m.id).join(', ')}) and earns wisdom points.`, 'The ending you reach decides your stars: one to three.'];
      const k = { shadow: 'The tale is played as shadows on a lit screen.', marionette: 'The tale is played by puppets hung from strings.', glove: 'The tale is played by hand puppets in a booth.', water: 'The tale is played by puppets standing on a pond.', mask: 'The tale is played by masked stock characters.', caravan: 'The tale follows a journey along a map.', verse: 'The tale is a contest of verse; the lines you pick are written on the page.' }[P.stage];
      return k ? [k, ...lines] : lines;
    },
    getState: () => ({
      stage: P.stage, scene: S.scene, meters: S.meters, flags: S.flags, pts: S.pts, max: maxPts, steps: S.steps, stop: S.stop, poem: S.poem,
      ending: S.ending?.id ?? null, options: currentOptions().map((o) => ({ text: o.text, pts: o.pts ?? 0, enabled: o.enabled, next: o.next ?? null })),
      isEnd: isEnd(S.scene), revealed: revealed(), done: !!done,
    }),
    // exposed for tests and tools
    graph: { scenes, maxPts, start: P.start },
  };
  return act;
}

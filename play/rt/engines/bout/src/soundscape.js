// Bout sound: each tradition has its own accompaniment (the instruments that really sound at these contests), and every on-screen
// event maps to one sound that belongs to it. Built on platform/engine-kit/synth.js voices, so nothing here is a beep.
//   kendang + gong (silat), parai frame drum (silambam), sabar drums (laamb), dhol (kushti), rabana (kotta pora), stick clack and
//   stamping (Nguni), bamboo/rattan clack (arnis), tama/talking drum duel (moraingy).
// Silence where nothing should sound: the accompaniment pauses in the result break and when the game is over.
import { voice, fx } from '../../../platform/engine-kit/synth.js';

// one step = an eighth note. Each event: [voice|fx, params]. 'd' voices use V.drum styles.
const D = (style, hz, vel = 0.5, pan = 0) => ['drum', { style, hz, vel, pan }];
const X = (kind, p) => ['fx', kind, p];
const KITS = {
  silat: {   // kendang batangan (low) and ketipung (high) with a gong on the bar line; steady, ceremonial
    bpm: 104, mat: 'skin',
    pat: [[D('bass', 84, 0.5, -0.15), ['gong', { hz: 150, vel: 0.35, dur: 2.2 }]], [], [D('rim', 520, 0.3, 0.2)], [D('tone', 170, 0.35, 0.1)], [D('bass', 90, 0.42, -0.15)], [], [D('rim', 560, 0.3, 0.2)], [D('rim', 520, 0.26, 0.2), D('tone', 190, 0.32)]],
    accent: () => D('tone', 190, 0.6), big: ['gong', { hz: 150, vel: 0.55, dur: 2.6 }],
  },
  silambam: {   // parai frame drum and clacking staves
    bpm: 118, mat: 'wood',
    pat: [[D('frame', 190, 0.5), X('tick', { hz: 1500, vel: 0.28 })], [], [D('frame', 260, 0.32)], [X('tick', { hz: 1800, vel: 0.22 })], [D('frame', 190, 0.45)], [D('frame', 240, 0.28)], [D('frame', 300, 0.3), X('tick', { hz: 1500, vel: 0.26 })], []],
    accent: () => D('frame', 170, 0.7), big: null,
  },
  laamb: {   // sabar ensemble: fast, interlocking tama and bass drum, the sound of a Senegalese arena
    bpm: 132, mat: 'skin',
    pat: [[D('bass', 100, 0.55), D('slap', 700, 0.3)], [D('rim', 600, 0.3)], [D('dayan', 380, 0.34)], [D('slap', 640, 0.3)], [D('bass', 90, 0.48)], [D('dayan', 420, 0.3), D('rim', 640, 0.22)], [D('slap', 700, 0.32)], [D('rim', 560, 0.26)]],
    accent: () => D('bass', 95, 0.75), big: null,
  },
  kushti: {   // dhol: bass stroke and treble stroke, a slow akhara beat
    bpm: 88, mat: 'clay',
    pat: [[D('bayan', 85, 0.6)], [], [D('dayan', 320, 0.35)], [], [D('bayan', 85, 0.5), D('dayan', 340, 0.28)], [], [D('dayan', 320, 0.32)], [D('dayan', 360, 0.26)]],
    accent: () => D('bayan', 80, 0.8), big: null,
  },
  kotta: {   // rabana: a festival beat; the pillows themselves are soft thuds
    bpm: 108, mat: 'skin',
    pat: [[D('frame', 210, 0.4)], [D('rim', 700, 0.18)], [D('frame', 260, 0.28)], [D('rim', 700, 0.18)], [D('frame', 210, 0.4)], [], [D('frame', 280, 0.26)], [D('rim', 740, 0.18)]],
    accent: () => D('frame', 190, 0.55), big: null,
  },
  nguni: {   // stick clack and foot stamping, the sound of the stick-fighting yard
    bpm: 96, mat: 'wood',
    pat: [[X('tick', { hz: 1300, vel: 0.3 }), ['stomp', { hz: 70, vel: 0.35 }]], [], [X('tick', { hz: 1500, vel: 0.22 })], [], [X('tick', { hz: 1300, vel: 0.28 }), ['stomp', { hz: 74, vel: 0.3 }]], [], [X('tick', { hz: 1500, vel: 0.22 }), ['clap', { vel: 0.18 }]], []],
    accent: () => ['stomp', { hz: 70, vel: 0.6 }], big: null,
  },
  arnis: {   // rattan clack pattern (the practice "abecedario" count), quiet
    bpm: 100, mat: 'wood',
    pat: [[X('tick', { hz: 1700, vel: 0.28 })], [X('tick', { hz: 1400, vel: 0.2 })], [X('tick', { hz: 1700, vel: 0.28 })], [], [X('tick', { hz: 1700, vel: 0.28 })], [X('tick', { hz: 1400, vel: 0.2 })], [], [X('tick', { hz: 1900, vel: 0.2 })]],
    accent: () => X('impact', { mat: 'wood', vel: 0.6 }), big: null,
  },
  moraingy: {   // drum duel: high and low drums answering each other
    bpm: 124, mat: 'skin',
    pat: [[D('tone', 150, 0.5)], [], [D('rim', 520, 0.3)], [D('tone', 220, 0.3)], [D('tone', 150, 0.46)], [D('rim', 560, 0.26)], [], [D('tone', 240, 0.34), D('rim', 600, 0.24)]],
    accent: () => D('tone', 140, 0.7), big: null,
  },
};
KITS.default = KITS.nguni;

export function createSoundscape(A, spId) {
  const K = KITS[spId] ?? KITS.default;
  const ok = !!A?.context;
  let acc = 0, idx = 0;
  const play = (e, delay = 0, k = 1) => {
    if (!ok || !e) return;
    const [kind, a, b] = e;
    if (kind === 'drum') voice(A, 'drum', { ...a, vel: (a.vel ?? 0.5) * k, delay });
    else if (kind === 'fx') fx(A, a, { ...b, vel: (b.vel ?? 0.5) * k, delay });
    else if (kind === 'gong') voice(A, 'gong', { ...a, vel: (a.vel ?? 0.4) * k, delay });
    else voice(A, kind, { ...a, vel: (a.vel ?? 0.4) * k, delay });
  };
  const step = (e, delay = 0, k = 1) => {
    // events are written as ['gong', {..}] or ['stomp', {..}] or ['drum', {..}] or ['fx', kind, {..}]
    play(e, delay, k);
  };
  const stepDur = 60 / K.bpm / 2;
  return {
    mat: K.mat,
    // accompaniment: call every frame with the time step; `energy` 0..1 raises the volume as the crowd gets excited
    beat(dt, active, energy = 0) {
      if (!ok || !active) { acc = 0; return; }
      acc += Math.min(dt, 0.2);
      let n = 0;
      while (acc >= stepDur && n++ < 3) {
        acc -= stepDur;
        for (const e of K.pat[idx % K.pat.length]) step(e, 0, 0.55 + 0.45 * energy);
        idx++;
      }
    },
    // the player committed a move: a body sound that matches the kind of move, at the quality of the timing
    move(q, kind) {
      if (!ok) return;
      const v = 0.3 + 0.2 * q;
      if (kind === 'strike') { fx(A, 'whoosh', { vel: v, dur: 0.12 }); if (K.mat === 'wood') fx(A, 'tick', { hz: 1700, vel: 0.35 * q }); }
      else if (kind === 'throw') { fx(A, 'whoosh', { vel: v * 0.8, dur: 0.2, down: true }); voice(A, 'step', { hz: 110, vel: 0.35, delay: 0.05 }); }
      else if (kind === 'push') voice(A, 'step', { hz: 95, vel: 0.4 + 0.1 * q });
      else if (kind === 'grip') voice(A, 'slap', { vel: 0.3 });
      else if (kind === 'guard') { fx(A, 'tick', { hz: K.mat === 'wood' ? 1200 : 800, vel: 0.35 }); }
      else fx(A, 'pop', { vel: 0.18, hz: 380 });
    },
    // exchange resolved. tone: good (you landed) | bad (you were hit) | neutral (clash). big: a fall or push-out
    hit(tone, big) {
      if (!ok) return;
      const m = K.mat;
      if (tone === 'neutral') { fx(A, 'impact', { mat: m, vel: 0.45 }); return; }
      const side = tone === 'good' ? 0.18 : -0.18;
      fx(A, 'impact', { mat: m, vel: tone === "good" ? 0.75 : 0.55, hz: tone === 'good' ? 220 : 160, pan: side });
      if (m !== 'wood') voice(A, 'step', { hz: tone === 'good' ? 80 : 62, vel: 0.4, delay: 0.01 });
      if (m === 'wood') fx(A, 'impact', { mat: 'wood', vel: 0.5, hz: 330, delay: 0.035 });
      if (tone === 'good') play(K.accent(), 0.03);
      fx(A, 'murmur', { vel: big ? 0.45 : 0.2, dur: big ? 1.1 : 0.5, hz: tone === 'good' ? 640 : 460, delay: 0.05 });
      if (big) { play(K.big, 0.05); voice(A, 'stomp', { hz: 55, vel: 0.7, delay: 0.1 }); }
    },
    // a round ended: a short flourish in the tradition's drum voice, rising for a win, one low stroke for a loss
    roundEnd(win) {
      if (!ok) return;
      if (win) {
        for (let i = 0; i < 4; i++) play(K.accent(), i * 0.11, 0.8 + i * 0.07);
        play(K.big ?? K.accent(), 0.5);
        fx(A, 'murmur', { vel: 0.5, dur: 1.4, hz: 700, delay: 0.1 });
      } else {
        play(K.accent(), 0, 0.7); fx(A, 'murmur', { vel: 0.3, dur: 0.9, hz: 380, delay: 0.1 });
      }
    },
    deny() { if (ok) voice(A, 'step', { hz: 70, vel: 0.2 }); },
  };
}

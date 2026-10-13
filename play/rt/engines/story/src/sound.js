// Story engine soundscapes (1.4.0). One authored soundscape per tradition: a quiet looping ensemble that belongs to the
// theatre on screen (gamelan colotomy for wayang, cheo drum and dan bau for the water pond, hsaing waing circle for yoke the,
// dholak and harmonium drone for kathputli, ...) plus a small set of event cues (choice tap, wise, rash, neutral, new scene,
// star) played on that tradition's own lead instrument. Nothing is random: every note is a fixed degree of the tradition's
// scale, and puppet voices keep one pitch per speaker. Pure audio data; it never touches game state.

const hash = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; };

// event helpers: { at, o: plain tone fallback, v: natural voice/fx }
const V = (voice, p, at = 0) => ({ at, o: { freq: p.hz, dur: p.dur ?? 0.3, type: 'sine', vol: Math.min(0.2, (p.vel ?? 0.5) * 0.25) }, v: { voice, p } });
const X = (fx, p, at = 0) => ({ at, o: { freq: p.hz ?? 800, dur: p.dur ?? 0.1, type: 'triangle', vol: 0.06 }, v: { fx, p } });

// A tradition: tonic (Hz), scale ratios, step length s, cycle length n, pat(step, cycle, d) -> events (relative at = 0),
// lead: how the cue notes are played, tap: UI tap Hz, scene: 'page' | 'splash' | 'curtain'.
const lead = (voice, extra = {}, oct = 1, dur = 0.7, vel = 0.7) => (hz, at = 0, v = 1) => V(voice, { hz: hz * 2 ** (oct - 1), dur, vel: vel * v, ...extra }, at);

const T = {
  // slendro gamelan: saron balungan, kenong, kempul, gong ageng, kendang (16-beat gong cycle)
  wayang: (r, sc) => {
    const B = [2, 3, 4, 3, 2, 3, 4, 2, 1, 2, 3, 2, 0, 1, 2, 0], d = (i, o = 0) => r * sc[i % 5] * 2 ** (o + Math.floor(i / 5));
    return {
      step: 0.56, n: 16, tap: 520, scene: 'page', lead: lead('bar', {}, 2, 0.9, 0.8),
      pat: (s) => {
        const e = [V('bar', { hz: d(B[s], 1), dur: 0.9, vel: 0.24 })];
        if (s === 0) e.push(V('gong', { hz: r * 0.5, dur: 2.6, vel: 0.5 }));
        if (s === 8) e.push(V('gong', { hz: r * 0.5 * sc[3], dur: 1.6, vel: 0.3 }));
        if (s === 4 || s === 12) e.push(V('bell', { hz: d(s === 4 ? 2 : 3, 0), dur: 1.0, vel: 0.2 }));
        if (s % 4 === 2) e.push(V('drum', { hz: 150, style: 'dayan', vel: 0.2 }));
        if (s === 0 || s === 8) e.push(V('drum', { hz: 85, style: 'bayan', vel: 0.2 }));
        return e;
      },
    };
  },
  // water puppet pond: cheo drum, dan bau phrase, a water drop now and then
  vietnam: (r, sc) => {
    const M = { 0: 4, 3: 2, 6: 3, 10: 1, 12: 0 }, d = (i, o = 0) => r * sc[i % 5] * 2 ** (o + Math.floor(i / 5));
    return {
      step: 0.5, n: 16, tap: 640, scene: 'splash', lead: lead('monochord', { bend: 120 }, 1, 1.1, 0.7),
      pat: (s, c) => {
        const e = [];
        if (s === 0 || s === 8) e.push(V('drum', { hz: 118, style: 'tone', vel: 0.28 }));
        if (s === 4 || s === 12) e.push(V('drum', { hz: 330, style: 'rim', vel: 0.16 }));
        if (s in M) e.push(V('monochord', { hz: d(M[s], 1), dur: 1.2, vel: 0.3 }));
        if (s === 14 && c % 2 === 0) e.push(X('splash', { vel: 0.1 }));
        return e;
      },
    };
  },
  // Burmese hsaing waing: tuned circle drum run, kyi waing gong circle, hne oboe line
  yokethe: (r, sc) => {
    const R = [0, 2, 1, 3, 2, 4, 3, 1, 0, 2, 1, 3, 4, 3, 2, 0], d = (i, o = 0) => r * sc[i % 5] * 2 ** (o + Math.floor(i / 5));
    return {
      step: 0.36, n: 16, tap: 560, scene: 'curtain', lead: lead('bell', {}, 2, 0.9, 0.7),
      pat: (s, c) => {
        const e = [V('drum', { hz: d(R[s], 0) * 0.8, style: 'tone', vel: s % 2 ? 0.1 : 0.2 })];
        if (s % 4 === 0) e.push(V('bell', { hz: d(R[(s + 4) % 16] , 1), dur: 0.8, vel: 0.16 }));
        if (s === 0) e.push(V('gong', { hz: r * 0.5, dur: 2.0, vel: 0.36 }));
        if (s === 8) e.push(V('gong', { hz: r * 0.5 * sc[2], dur: 1.4, vel: 0.2 }));
        if (s === 0 && c % 2 === 0) e.push(V('reed', { hz: d(4, 0), dur: 1.8, vel: 0.2 }));
        if (s === 8 && c % 2 === 1) e.push(V('reed', { hz: d(3, 0), dur: 1.4, vel: 0.18 }));
        return e;
      },
    };
  },
  // Czech puppet theatre: music box waltz over a plucked bass
  bohemian: (r, sc) => {
    const M = { 0: 4, 2: 2, 3: 3, 5: 1, 6: 2, 8: 0, 9: 1, 11: 0 }, d = (i, o = 0) => r * sc[i % 6 % sc.length] * 2 ** o;
    return {
      step: 0.3, n: 12, tap: 700, scene: 'curtain', lead: lead('bell', {}, 2, 0.8, 0.65),
      pat: (s) => {
        const e = [];
        if (s % 3 === 0) e.push(V('pluck', { hz: r * 0.5 * (s % 6 === 0 ? 1 : 1.5), dur: 0.5, vel: 0.26, inst: 'guitar' }));
        else e.push(V('pluck', { hz: r * 1.5, dur: 0.25, vel: 0.1, inst: 'guitar' }));
        if (s in M) e.push(V('tine', { hz: d(M[s], 2), dur: 0.7, vel: 0.22 }));
        return e;
      },
    };
  },
  // Rajasthani street show: dholak, harmonium drone, bansuri
  kathputli: (r, sc) => {
    const d = (i, o = 0) => r * sc[i % 5] * 2 ** (o + Math.floor(i / 5)), F = { 0: 2, 3: 3, 5: 4, 8: 2 };
    return {
      step: 0.3, n: 16, tap: 600, scene: 'curtain', lead: lead('breath', {}, 2, 0.7, 0.8),
      pat: (s, c) => {
        const e = [];
        if (s % 2 === 0) e.push(V('drum', { hz: 230, style: 'dayan', vel: s % 4 === 0 ? 0.2 : 0.12 }));
        if (s === 0 || s === 8 || s === 10) e.push(V('drum', { hz: 82, style: 'bayan', vel: 0.22 }));
        if (s === 4 || s === 12) e.push(V('drum', { hz: 400, style: 'rim', vel: 0.1 }));
        if (s === 0) { e.push(V('reed', { hz: r, dur: 4.6, vel: 0.1 })); e.push(V('reed', { hz: r * sc[3], dur: 4.6, vel: 0.07 })); }
        if (c % 2 === 1 && s in F) e.push(V('breath', { hz: d(F[s], 1), dur: 0.8, vel: 0.16 }));
        return e;
      },
    };
  },
  // Karagoz coffeehouse: darbuka rhythm and oud phrase
  karagoz: (r, sc) => {
    const O = { 0: 0, 3: 1, 6: 2, 8: 1, 11: 3, 14: 0 }, d = (i, o = 0) => r * sc[i % 5] * 2 ** (o + Math.floor(i / 5));
    return {
      step: 0.3, n: 16, tap: 560, scene: 'curtain', lead: lead('pluck', { inst: 'oud' }, 1, 0.7, 0.8),
      pat: (s) => {
        const e = [];
        if (s === 0 || s === 8 || s === 10) e.push(V('drum', { hz: 100, style: 'bayan', vel: 0.24 }));
        if (s === 4 || s === 12 || s === 6 || s === 14) e.push(V('drum', { hz: 360, style: 'rim', vel: 0.12 }));
        if (s in O) e.push(V('pluck', { hz: d(O[s], 0), dur: 0.7, vel: 0.26, inst: 'oud' }));
        return e;
      },
    };
  },
  // Egyptian booth: tabl baladi maqsum and a shrill mizmar
  aragoz: (r, sc) => {
    const Z = { 0: 0, 3: 1, 6: 2, 10: 1, 13: 0 }, d = (i, o = 0) => r * sc[i % 5] * 2 ** (o + Math.floor(i / 5));
    return {
      step: 0.28, n: 16, tap: 600, scene: 'curtain', lead: lead('reed', {}, 2, 0.5, 0.8),
      pat: (s) => {
        const e = [];
        if (s === 0 || s === 8 || s === 10) e.push(V('drum', { hz: 90, style: 'bayan', vel: 0.26 }));
        if (s === 4 || s === 12 || s === 6 || s === 14) e.push(V('drum', { hz: 340, style: 'rim', vel: 0.14 }));
        if (s in Z) e.push(V('reed', { hz: d(Z[s], 1), dur: 0.5, vel: 0.13 }));
        return e;
      },
    };
  },
  // Persian reading of verse: santur arpeggio, ney held notes, a whisper of tonbak
  persian: (r, sc) => {
    const A = [0, 2, 4, 2, 1, 3, 2, 0], d = (i, o = 0) => r * sc[i % 5] * 2 ** (o + Math.floor(i / 5));
    return {
      step: 0.46, n: 16, tap: 700, scene: 'page', lead: lead('pluck', { inst: 'santur' }, 1, 1.0, 0.75),
      pat: (s, c) => {
        const e = [];
        if (s % 2 === 0) e.push(V('pluck', { hz: d(A[(s / 2) % 8], 1), dur: 0.9, vel: 0.2, inst: 'santur' }));
        if (s === 0 && c % 2 === 0) e.push(V('breath', { hz: d(2, 1), dur: 2.6, vel: 0.1 }));
        if (s === 8 && c % 2 === 1) e.push(V('breath', { hz: d(4, 0), dur: 2.2, vel: 0.1 }));
        if (s === 0 || s === 8) e.push(V('drum', { hz: 120, style: 'frame', vel: 0.1 }));
        return e;
      },
    };
  },
  // Sahel caravan: kora ostinato, djembe, a breath of wind
  sahel: (r, sc) => {
    const K = [0, 2, 4, 2, 1, 3, 4, 3], d = (i, o = 0) => r * sc[i % 5] * 2 ** (o + Math.floor(i / 5));
    return {
      step: 0.36, n: 16, tap: 520, scene: 'wind', lead: lead('pluck', { inst: 'kora' }, 1, 1.0, 0.75),
      pat: (s, c) => {
        const e = [V('pluck', { hz: d(K[s % 8], 1 + (s >= 8 ? 1 : 0) * 0), dur: 0.8, vel: s % 4 === 0 ? 0.2 : 0.13, inst: 'kora' })];
        if (s === 0 || s === 8) e.push(V('drum', { hz: 72, style: 'bass', vel: 0.22 }));
        if (s === 6 || s === 14) e.push(V('drum', { hz: 190, style: 'tone', vel: 0.12 }));
        if (s === 5 && c % 2 === 0) e.push(X('whoosh', { dur: 1.8, vel: 0.07 }));
        return e;
      },
    };
  },
  // Malagasy village contest: valiha arpeggio over a bass drum
  malagasy: (r, sc) => {
    const A = [0, 2, 4, 2, 0, 3, 4, 2], d = (i, o = 0) => r * sc[i % 5] * 2 ** (o + Math.floor(i / 5));
    return {
      step: 0.3, n: 16, tap: 600, scene: 'curtain', lead: lead('pluck', { inst: 'valiha harp' }, 1, 0.8, 0.75),
      pat: (s) => {
        const e = [];
        if (s % 2 === 0) e.push(V('pluck', { hz: d(A[(s / 2) % 8], 1), dur: 0.6, vel: 0.2, inst: 'valiha harp' }));
        if (s === 0 || s === 8) e.push(V('drum', { hz: 78, style: 'bass', vel: 0.26 }));
        if (s === 4 || s === 12) e.push(V('drum', { hz: 200, style: 'tone', vel: 0.14 }));
        if (s === 6 || s === 14) e.push(V('drum', { hz: 420, style: 'rim', vel: 0.08 }));
        return e;
      },
    };
  },
  // settings without their own tradition: a gentle pulse in the skin's own colour
  generic: (r, sc) => {
    const d = (i, o = 0) => r * sc[i % 5] * 2 ** (o + Math.floor(i / 5)), A = [0, 2, 4, 2];
    return {
      step: 0.5, n: 16, tap: 560, scene: 'page', lead: lead('bell', {}, 2, 0.8, 0.6),
      pat: (s) => {
        const e = [];
        if (s % 4 === 0) e.push(V('pluck', { hz: d(A[(s / 4) % 4], 1), dur: 0.8, vel: 0.16, inst: 'harp' }));
        if (s === 0) e.push(V('drum', { hz: 100, style: 'tone', vel: 0.16 }));
        return e;
      },
    };
  },
};

export function makeSoundscape(setting, snd = {}) {
  const sc = snd.scale ?? [1, 1.125, 1.25, 1.5, 1.667], r = snd.root ?? 261;
  const S = (T[setting] ?? T.generic)(r, sc.length >= 5 ? sc : [...sc, ...sc]);
  const note = (i, oct = 1) => r * sc[((i % sc.length) + sc.length) % sc.length] * 2 ** (oct + Math.floor(i / sc.length) - 1);
  return {
    step: S.step, n: S.n,
    // events for one ambient step (relative times 0); `gain` fades the ensemble in
    ambient: (k, gain = 1) => S.pat(k % S.n, Math.floor(k / S.n)).map((e) => scaleVel(e, gain)),
    tap: () => [X('pop', { hz: S.tap, vel: 0.5 })],
    good: (pts) => [0, 2, 4, ...(pts > 1 ? [5] : [])].map((deg, k) => S.lead(note(deg, 1), 0.02 + k * 0.1, 0.8 + k * 0.05)),
    bad: () => [V('drum', { hz: 70, style: 'bass', vel: 0.55 }, 0), X('bad', { hz: r * 0.62, vel: 0.5 }, 0.04)],
    neutral: () => [S.lead(note(0, 1), 0.02, 0.6)],
    scene: () => S.scene === 'splash' ? [X('splash', { vel: 0.14 })] : S.scene === 'wind' ? [X('whoosh', { dur: 0.7, vel: 0.1 })] : [X('scrape', { hz: S.scene === 'page' ? 2400 : 1500, dur: S.scene === 'page' ? 0.14 : 0.3, vel: 0.5 })],
    star: (i) => [S.lead(note([0, 2, 4][i % 3], 2), 0, 0.9), S.lead(note([0, 2, 4][i % 3], 1), 0.04, 0.5)],
    // one puppet's voice: constant pitch per speaker, vowel colour moves with the syllable
    voice: (i, who = '') => {
      const f0 = (105 + hash(who) * 110) * (snd.voiceLow ? 0.7 : 1);
      return [i % 4 === 3 ? X('murmur', { hz: f0 * 2.2, dur: 0.3, vel: 0.35 }) : X('blip', { hz: f0, vowel: i, dur: 0.08, vel: 0.5 })];
    },
  };
}
function scaleVel(e, g) {
  if (g >= 1) return e;
  const p = { ...e.v.p, vel: (e.v.p.vel ?? 0.5) * g };
  return { ...e, v: { ...e.v, p } };
}

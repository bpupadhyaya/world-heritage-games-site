// shape-craft `paint` foley: every sound is the tool on the surface, never a tone. Built from platform/engine-kit/synth.js voices
// (filtered noise for bristles, wax and rice paste, a wet splash for the dip, a soft pat for a dab, a rising wash for a flood fill, a
// plunge and bubbling for the dye bath, a small ring when the wax is melted away). Audio only; a no-op without an AudioContext.
import { fx as shared } from '../../../platform/engine-kit/synth.js';

// voice by tool: where the bristles, nib or stick scratch, and how hard
const VOICE = {
  brush: { hz: 3300, spread: 900, dur: 0.1, vel: 0.64, body: 0.18 },
  fine: { hz: 4300, spread: 900, dur: 0.07, vel: 0.51, body: 0.1 },
  dab: { hz: 2200, spread: 500, dur: 0.1, vel: 0.69, body: 0.4 },
  reed: { hz: 3800, spread: 1200, dur: 0.06, vel: 0.69, body: 0.0 },
  pen: { hz: 4600, spread: 1000, dur: 0.05, vel: 0.60, body: 0.0 },
  wax: { hz: 2400, spread: 600, dur: 0.09, vel: 0.55, body: 0.12 },
  stylus: { hz: 5200, spread: 900, dur: 0.05, vel: 0.55, body: 0.0 },
  stick: { hz: 1500, spread: 500, dur: 0.12, vel: 0.83, body: 0.3 },
  dots: { hz: 4100, spread: 800, dur: 0.06, vel: 0.60, body: 0.0 },
  nib: { hz: 3000, spread: 900, dur: 0.07, vel: 0.62, body: 0.0 },     // 1.25.0: a reed edge on paper (a dry scratch with a little weight)
  nibfine: { hz: 3600, spread: 900, dur: 0.06, vel: 0.55, body: 0.0 },
  wedge: { hz: 1200, spread: 300, dur: 0.05, vel: 0.2, body: 0.0 },    // a stylus pressed into wet clay (the thock is on release)
  point: { hz: 5600, spread: 900, dur: 0.05, vel: 0.5, body: 0.0 },    // a hard point scratching a dry leaf
};
export function createPaintSound(audio, tool = 'brush') {
  const V = VOICE[tool] ?? VOICE.brush;
  const F = (kind, p) => { try { return shared(audio, kind, p); } catch { return false; } };
  let carried = 0;
  const self = {
    // the loaded tool is pulled over the surface: called as the line grows, v = pointer speed in design units per second
    stroke(len, v = 0.5, load = 1) {
      carried += len;
      if (carried < 0.022) return;
      carried = 0;
      const sp = Math.min(1, v / 1.2), dry = load < 0.25 ? 1 : 0;
      F('scrape', { hz: V.hz * (0.85 + sp * 0.4) + dry * 900, dur: V.dur * (1.25 - sp * 0.5), vel: V.vel * (0.6 + sp * 0.6) * (dry ? 1.3 : 1) });
      if (V.body && !dry) F('impact', { mat: tool === 'stick' ? 'clay' : 'wood', hz: 190 + sp * 60, vel: V.body * 0.3 });
    },
    // the tool touches down and lifts
    down() { carried = 0; F('tick', { hz: tool === 'stick' ? 700 : tool === 'wedge' ? 600 : 2400, vel: tool === 'dab' ? 0.5 : tool === 'wedge' ? 0.2 : 0.35 }); },
    up() { if (tool === 'wedge') { F('impact', { mat: 'clay', hz: 120, vel: 0.55 }); F('scrape', { hz: 900, dur: 0.06, vel: 0.25, delay: 0.02 }); } else F('scrape', { hz: V.hz * 0.8, dur: 0.05, vel: V.vel * 0.45 }); },
    dab() { F('impact', { mat: 'clay', hz: 150, vel: 0.38 }); F('scrape', { hz: 2600, dur: 0.07, vel: 0.5, delay: 0.01 }); },
    // dip into the paint or wax: the tool slides into the pot and comes out thick
    dip() { F('splash', { vel: 0.55 }); F('tick', { hz: 900, vel: 0.35, delay: 0.05 }); F('scrape', { hz: 1500, dur: 0.18, vel: 0.5, delay: 0.1 }); },
    wash() { F('whoosh', { dur: 0.35, vel: 0.45, down: false }); F('scrape', { hz: 1800, dur: 0.3, vel: 0.6, delay: 0.04 }); },
    undo() { F('pop', { vel: 0.4 }); },
    mode() { F('tick', { hz: 1800, vel: 0.35 }); },
    layer() { F('whoosh', { dur: 0.22, vel: 0.45, down: true }); },
    // the whole cloth or egg is lowered into the dye bath and brought out
    dye() { F('splash', { vel: 0.45 }); F('whoosh', { dur: 0.5, vel: 0.45, down: true, delay: 0.05 }); F('thud', { hz: 85, vel: 0.4, delay: 0.25 }); F('splash', { vel: 0.4, delay: 0.7 }); },
    melt() { F('whoosh', { dur: 0.7, vel: 0.4, down: false }); F('ring', { hz: 1760, dur: 0.6, vel: 0.35, delay: 0.1 }); },
    gild() { F('whoosh', { dur: 0.7, vel: 0.35, down: false }); F('ring', { hz: 2637, dur: 0.7, vel: 0.28, delay: 0.1 }); F('ring', { hz: 3520, dur: 0.5, vel: 0.2, delay: 0.3 }); },
    gloss() { F('splash', { vel: 0.4 }); F('ring', { hz: 2093, dur: 0.5, vel: 0.3, delay: 0.1 }); },
    win(stars) { F('good', { hz: 660 + stars * 60, vel: 0.6 }); },
  };
  return self;
}

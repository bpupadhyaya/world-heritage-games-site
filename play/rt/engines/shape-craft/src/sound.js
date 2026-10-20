// shape-craft sound: every event plays the sound of the tool on the material that is on screen (chisel on stone, scraper in
// wax, trowel in mud, rib on wet clay, brush on glaze, cloth pressed flat, silk cord pulled, wire bent and released), built
// from the shared natural voices in platform/engine-kit/synth.js. No random pitches: variety comes from a fixed cell hash.
// Audio only; it never touches game state (and is a no-op without an AudioContext, so headless tests are unaffected).
import { fx as shared, voice as sharedVoice } from '../../../platform/engine-kit/synth.js';
import { hash } from './geom.js';
import { EXT } from './registry.js';

// material of the thing the tool works on, by scene id (falls back to the block material / technique)
const MAT = {
  soapstone: 'stone', lostwax: 'wax', lippan: 'mud', maskcarve: 'wood', claymodel: 'clay', candy: 'candy',
  rishtan: 'clay', bluepottery: 'clay', celadon: 'clay', terracotta: 'clay', matryoshka: 'wood',
  shibori: 'cloth', origami: 'paper', papercut: 'paper',
  chineseknot: 'silk', celtic: 'rope', mizuhiki: 'paper-cord', turkshead: 'rope',
  wirecar: 'wire', wirebicycle: 'wire', wirebird: 'wire', agaseke: 'grass', okavango: 'grass',
};

export function createSound(audio, scene, material, technique) {
  const mat = MAT[scene?.id] ?? EXT.soundMat[scene?.id] ?? ({ stone: 'stone', clay: 'clay', wood: 'wood', metal: 'wire', candy: 'candy', paper: 'paper' }[material] ?? EXT.techniques.get(technique)?.mat ?? (technique === 'bend' ? 'wire' : technique === 'knot' ? 'silk' : technique === 'fold' ? 'paper' : 'clay'));
  let clock = 0, lastScrape = -9, lastTick = -9;
  const F = (kind, p) => { try { return shared(audio, kind, p); } catch { return false; } };
  const V = (kind, p) => { try { return sharedVoice(audio, kind, p); } catch { return false; } };
  const gate = (name, gap) => { if (clock - (name === 's' ? lastScrape : lastTick) < gap) return false; if (name === 's') lastScrape = clock; else lastTick = clock; return true; };
  const self = {
    tick(t) { clock = t; },
    mat,

    // ---- carve and cut ---------------------------------------------------------------------------------------------
    // one cell removed; h is a fixed hash of the cell so strikes differ without randomness
    chip(h = 0.5, broad = false) {
      const v = broad ? 1 : 0.8;
      if (mat === 'stone') { F('impact', { mat: 'stone', hz: 330 + h * 140, vel: 0.7 * v }); if (gate('s', 0.045)) F('scrape', { hz: 2800 + h * 1400, dur: 0.07, vel: 0.5 }); }
      else if (mat === 'wax') { if (gate('s', 0.05)) F('scrape', { hz: 900 + h * 400, dur: 0.12, vel: 0.5 }); F('impact', { mat: 'clay', hz: 180 + h * 40, vel: 0.22 }); }
      else if (mat === 'mud') { F('impact', { mat: 'clay', hz: 200 + h * 90, vel: 0.55 * v }); if (gate('s', 0.06)) F('scrape', { hz: 1200, dur: 0.1, vel: 0.35 }); }
      else if (mat === 'wood') { F('impact', { mat: 'wood', hz: 260 + h * 160, vel: 0.65 * v }); if (gate('s', 0.05)) F('scrape', { hz: 1800 + h * 800, dur: 0.08, vel: 0.35 }); }
      else if (mat === 'candy') { F('tick', { hz: 1500 + h * 700, vel: 0.5 }); F('impact', { mat: 'stone', hz: 520, vel: 0.35 }); }
      else if (mat === 'paper') { if (gate('s', 0.04)) F('scrape', { hz: 4200 + h * 1800, dur: 0.05, vel: 0.55 }); F('tick', { hz: 2600 + h * 900, vel: 0.35 }); }
      else F('impact', { mat: 'clay', hz: 220 + h * 90, vel: 0.5 });
    },
    // 1.14.0: a cloth rubbing wax into the finished carving: a soft dry hush, a faint squeak now and then
    rub(h = 0.5) { if (gate('s', 0.07)) F('scrape', { hz: 1500 + h * 700, dur: 0.1, vel: 0.22 }); },
    // a cell restored (mending a cut, undo of a carve stroke)
    mend() { F('pop', { vel: 0.5 }); },
    // a mirror pressed into the mud (Lippan): wet pat, then a small glass tink
    mirror(h = 0.5) { F('impact', { mat: 'clay', hz: 160, vel: 0.5 }); F('ring', { hz: 2100 + h * 900, dur: 0.25, vel: 0.35, delay: 0.02 }); },

    // ---- lathe -----------------------------------------------------------------------------------------------------
    // a wall row set to a new width: the rib moves wet clay (low squelch) or the gouge takes a shaving off the wood
    shape(r, steps) {
      if (!gate('s', 0.06)) return;
      const k = steps ? r / steps : 0.5;
      if (mat === 'wood') F('scrape', { hz: 2400 + k * 1600, dur: 0.1, vel: 0.5 });
      else { F('scrape', { hz: 500 + k * 500, dur: 0.14, vel: 0.5 }); F('impact', { mat: 'clay', hz: 110 + k * 60, vel: 0.22 }); }
    },
    glazeBand(i) { // a brush loaded with slip or glaze laid on a band
      F('scrape', { hz: 2100 + (i % 4) * 150, dur: 0.16, vel: 0.5 });
      if (mat === 'wood') F('impact', { mat: 'wood', hz: 330, vel: 0.22 });
      else F('ring', { hz: 1760, dur: 0.12, vel: 0.12 });
    },
    toGlaze() { F('whoosh', { dur: 0.22, vel: 0.35 }); },
    // finished vessel: struck once, it rings (fired clay) or knocks (turned wood)
    vesselDone(stars) {
      if (mat === 'wood') { F('impact', { mat: 'wood', hz: 300, vel: 0.8 }); F('impact', { mat: 'wood', hz: 390, vel: 0.6, delay: 0.14 }); }
      else F('ring', { hz: 1180 + stars * 90, dur: 0.9, vel: 0.7 });
    },

    // ---- fold ------------------------------------------------------------------------------------------------------
    fold(dir = 0) {
      if (mat === 'cloth') { F('whoosh', { dur: 0.2, vel: 0.35, down: dir > 0 }); F('scrape', { hz: 700, dur: 0.2, vel: 0.5, delay: 0.12 }); F('thud', { hz: 90, vel: 0.35, delay: 0.3 }); }
      else { F('whoosh', { dur: 0.16, vel: 0.3, down: false }); F('scrape', { hz: 3600, dur: 0.18, vel: 0.5, delay: 0.1 }); F('tick', { hz: 1800, vel: 0.3, delay: 0.3 }); }
    },
    unfold() { F('whoosh', { dur: 0.22, vel: 0.3, down: true }); },

    // ---- knot ------------------------------------------------------------------------------------------------------
    pin() { F('pop', { vel: 0.6 }); },
    cord(n = 0) { // one step of cord drawn through the lattice: a short dry slide, slightly different each step
      if (!gate('s', 0.03)) return;
      const hz = mat === 'silk' ? 3400 : mat === 'paper-cord' ? 2800 : 1500;
      F('scrape', { hz: hz + (n % 5) * 140, dur: mat === 'rope' ? 0.09 : 0.07, vel: 0.5 });
      if (mat === 'rope') F('thud', { hz: 130, vel: 0.12 });
    },
    cross() { F('pop', { vel: 0.35 }); }, // the cord passes over/under itself
    close() { // loop closed: the cord is pulled snug, then a soft chime
      F('whoosh', { dur: 0.25, vel: 0.45, down: true });
      F('chime', { hz: mat === 'silk' ? 880 : 660, vel: 0.5, delay: 0.2 });
    },

    // ---- bend ------------------------------------------------------------------------------------------------------
    wireGrab() { F('impact', { mat: 'metal', hz: 700, vel: 0.15 }); },
    wireMove(u = 0.5) { if (gate('t', 0.055)) F('scrape', { hz: 3000 + u * 1800, dur: 0.04, vel: 0.35 }); },
    wireSet() { F('impact', { mat: 'metal', hz: 900, vel: 0.5 }); F('ring', { hz: 2600, dur: 0.35, vel: 0.2, delay: 0.01 }); },

    // ---- coil ------------------------------------------------------------------------------------------------------
    stitch(c = 0) { F('scrape', { hz: 1800 + c * 150, dur: 0.07, vel: 0.5 }); F('pop', { vel: 0.3, delay: 0.05 }); },
    // 1.13.0 weaving (mats and the new basket forms): one strip pulled over and under, in the voice of the fibre on screen
    weave(c = 0) {
      const k = scene?.pitch ?? 1, v = c % 4;
      if (mat === 'cane') { F('impact', { mat: 'wood', hz: (620 + v * 60) * k, vel: 0.45 }); if (gate('s', 0.04)) F('scrape', { hz: 3300 * k, dur: 0.05, vel: 0.4 }); }
      else if (mat === 'reed') { if (gate('s', 0.03)) F('scrape', { hz: (2300 + v * 120) * k, dur: 0.09, vel: 0.45 }); F('tick', { hz: 1500 * k, vel: 0.22, delay: 0.04 }); }
      else if (mat === 'palm') { F('scrape', { hz: (1400 + v * 90) * k, dur: 0.12, vel: 0.5 }); F('thud', { hz: 150, vel: 0.12, delay: 0.05 }); }
      else if (mat === 'jute') { F('scrape', { hz: (850 + v * 60) * k, dur: 0.1, vel: 0.5 }); F('thud', { hz: 105 * k, vel: 0.2, delay: 0.04 }); }
      else if (mat === 'silk') { F('scrape', { hz: (4300 + v * 160) * k, dur: 0.05, vel: 0.4 }); F('tick', { hz: 3100 * k, vel: 0.2, delay: 0.03 }); }
      else if (mat === 'bamboo') { F('impact', { mat: 'wood', hz: (410 + v * 40) * k, vel: 0.5 }); F('ring', { hz: 1150 * k, dur: 0.18, vel: 0.12, delay: 0.01 }); }
      else if (mat === 'willow') { F('scrape', { hz: (1900 + v * 110) * k, dur: 0.08, vel: 0.5 }); F('pop', { vel: 0.3, delay: 0.05 }); }
      else if (mat === 'cord') { F('scrape', { hz: (1150 + v * 70) * k, dur: 0.09, vel: 0.45 }); F('thud', { hz: 130 * k, vel: 0.16, delay: 0.03 }); }
      else { F('scrape', { hz: 1800 + c * 150, dur: 0.07, vel: 0.5 }); F('pop', { vel: 0.3, delay: 0.05 }); }
    },

    // the wax model is invested and the bronze poured: a hiss of steam, the metal settling, then it rings
    cast() { F('whoosh', { dur: 0.6, vel: 0.4, down: true }); F('splash', { vel: 0.3, delay: 0.25 }); F('impact', { mat: 'metal', hz: 560, vel: 0.6, delay: 0.9 }); F('ring', { hz: 880, dur: 1.2, vel: 0.5, delay: 0.9 }); },

    // ---- shared ----------------------------------------------------------------------------------------------------
    win(stars) { // the piece is judged
      if (mat === 'wire') { F('ring', { hz: 1568, dur: 0.8, vel: 0.5 }); F('ring', { hz: 1976, dur: 0.8, vel: 0.35, delay: 0.1 }); }
      else if (mat === 'wax') { F('impact', { mat: 'metal', hz: 600, vel: 0.7 }); V('bell', { hz: 523, dur: 1.4, vel: 0.55, delay: 0.1 }); }
      else F('good', { hz: 660 + stars * 60, vel: 0.7 });
    },
  };
  void hash;
  return self;
}

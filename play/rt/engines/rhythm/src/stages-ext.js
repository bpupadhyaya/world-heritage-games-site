// EXTENSION MANIFEST for stages. One import line per new stage file (a side-effect import: the file calls registerStringStage /
// registerDrumStage / registerWindStage / registerKeyStage / registerGongStage / registerDanceStage / registerVoiceStage).
// Order matters only between extensions that match the same key: the earlier import wins. Extension routes always beat built-ins.
// Add your line at the end of its family's block to keep merges trivial:
//
// -- strings (lutes, fiddles, zithers, harps) --
import './stage-zithers.js';
import './stage-tube.js';
import './stage-archedharp.js';
import './stage-mouthharp.js';
import './stage-berimbau.js';
import './stage-necks.js';
import './stage-necks2.js';
import './stage-necks3.js';
import './stage-necks4.js';
import './stage-lyres.js';
import './stage-fiddles2.js';
import './stage-band.js';
// -- drums and pads --
import './stage-barrel.js';
import './stage-goblet.js';
import './stage-drums2.js';
import './stage-drums3.js';
import './stage-hourglass.js';
import './stage-cajon.js';
import './stage-frame.js';
import './stage-rattle.js';
import './stage-ensemble.js';
import './stage-rattles.js';
import './stage-scrapers.js';
import './stage-strands.js';
// -- winds --
import './stage-oboes.js';
import './stage-bagpipes.js';
import './stage-horns.js';
import './stage-flutes.js';
// -- keys, gongs --
import './stage-bars.js';
import './stage-lamellophones.js';
import './stage-gongs.js';
import './stage-asia1.js';
import './stage-asia2.js';
import './stage-island1.js';
import './stage-island2.js';
import './stage-chimes.js';
import './stage-bells.js';
import './stage-idio2.js';
import './stage-idio3.js';
import './stage-odd1.js';
import './stage-odd2.js';
import './stage-odd3.js';
// -- dance --
import './stage-dance-hero.js';
import './stage-dance-hero-gumboot.js';
import './stage-dance-hero-sword.js';
import './stage-dance-hero-poles.js';
import './stage-dance-hero-kathak.js';
import './stage-dance-hero-fan.js';
import './stage-dance-hero-umbrella.js';
import './stage-dance-hero-bell.js';
import './stage-dance-hero-chain.js';
import './stage-dance-sticks.js';
import './stage-dance-ring.js';
import './stage-dance-solo.js';
import './stage-dance-line.js';
import './stage-dance-folk.js';
// -- voice --
export {};

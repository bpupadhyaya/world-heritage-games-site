// EXTENSION MANIFEST for voices and timbres. One import line per new voice file (a side-effect import: the file calls registerTimbre,
// registerLaneVoice, registerStrikeVoice, registerSynthVoice, registerWindSynth from ./voice-registry.js). See README "How to add a voice".
// -- timbres / lane voices --
// -- engine-local synth recipes (strings, drums, voice) --
import './voice-strings.js';
import './voice-necks2.js';
import './voice-necks3.js';
import './voice-necks4.js';
import './voice-lyres.js';
import './voice-fiddles2.js';
import './voice-synth2.js';
import './voice-drums.js';
import './voice-dance.js';
import './voice-rattles.js';
import './voice-gongs.js';
import './voice-idio2.js';
import './voice-idio3.js';
import './voice-sticks.js';
// -- wind synth recipes --
import './voice-winds3.js';
export {};

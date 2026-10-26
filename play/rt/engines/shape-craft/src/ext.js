// EXTENSION MANIFEST for shape-craft. One import line per new file; each file calls the register* functions of ./registry.js.
// Imported once by activity.js. Add your line at the end of its block (keeps merges trivial). See README "How to add a technique / figure / scene".
// -- techniques (registerTechnique) --
import './tech-paint.js';   // 1.6.0: paint (freehand brush work, region fill, wax resist)
import './tech-forge.js';   // 1.7.0: forge (heat, timed hammer blows, draw a bar to a profile)
import './tech-polish.js';  // 1.7.0: polish (cast and polish a metal mirror through the grits)
import './tech-inlay.js';   // 1.7.0: inlay (silver wire in engraved metal, mother-of-pearl in lacquer)
import './tech-basket.js';  // 1.9.0: basket (basketry in three quarter view: eight forms, four weaves)
import './tech-marble.js';  // 1.16.0: marble (paper marbling on a tray of size: drops, needle, comb, lay the paper)
import './tech-sheet.js';    // 1.16.0: sheet (papermaking by hand: form, couch, finish)
import './tech-braid.js';    // 1.17.0: braid (plaiting flat braids: tap the strand that goes over)
import './tech-disk.js';     // 1.17.0: disk (round braiding on a 32-notch disk: kumihimo)
import './tech-mat.js';     // 1.13.0: mat (flat plaiting seen from above: eight strip styles, five weaves, ten designs, five frames)
// -- carve and bend figures, profiles, props (registerFigure / registerBendFigure / registerProfile / registerProp) --
import './figures-wood.js';   // 1.9.0: carve silhouettes lovespoon, door, family; turned profile toptoy
import './figures-wood2.js';  // 1.11.0: finer carve silhouettes lovespoon-fine, door-arched, family-fine
import './figures-wood3.js';  // 1.14.0: carve silhouettes forcola, clog, akan-stool, zafimaniry, szekler-gate, decoy, chip-rosette (Carved Wood)
import './figures-lac.js';    // 1.15.0: carve silhouette peony-roundel (carved red lacquer)
import './figures-wood4.js';  // 1.14.4: carve silhouettes netsuke-cat, vetrunge, pit-boat, bullock-cart, pith-flower, chinar-panel
// -- scenes (registerSceneSet) --
import './scenes-paint.js';   // 1.6.0: twelve folk-painting workshops
import './scenes-metal.js';   // 1.7.0: workshops for inlay, polish and forge
import './scenes-basket.js';  // 1.9.0: eight basketry workshops
import './scenes-wood.js';    // 1.9.0: workshops lovespoon, swahili, shona, channapatna
import './scenes-wood2.js';   // 1.14.0: workshops venice, dutch, kumasi, mada, szekler, marsh, chalet (Carved Wood)
import './scenes-wood3.js';   // 1.14.4: workshops curonian, suzhou (Carved Wood)
import './scenes-folk.js';    // 1.9.0: Kalocsa workshop
import './scenes-folk2.js';   // 1.14.2: seven Painted Folk Art workshops
import './scenes-pottery.js'; // 1.9.0: lathe workshops marginea, boleslawiec, deruta; profile tazza
import './scenes-tiles.js';   // 1.9.0: four tile-painting workshops (azulejo, iznik, talavera, delft)
import './scenes-clay-americas.js'; // 1.12.0: eight Americas pottery workshops (oaxaca, atzompa, chamba, pomaire, chulucanas, mataortiz, metepec, saramenha); profiles cantaro, atzjug, ollachamba, greda, chuluvase, olla, florero
import './scenes-mat.js';    // 1.13.0: eight flat-mat workshops
import './scenes-basket2.js'; // 1.13.0: six workshops for the new basket forms (nantucket, orchard, coppice, cabin, terrace, rattanyard)
import './scenes-dolls.js';  // 1.15.0: doll workshops and profiles (kokeshi ...); doll.js decorations are imported by vessel.js
import './scenes-lacquer.js'; // 1.15.0: lacquer workshops wajima, yun; profiles owan, hsun
import './scenes-paper.js';  // 1.16.0: papermaking workshops (ebruatelier)
import './scenes-braid.js';  // 1.17.0: braiding workshops (gaitan, trenzado, strawyard)
import './doll2.js';          // 1.19.0: doll decorations vanka, kimekomi, budao (added to DECO / MARKS of doll.js)
import './scenes-dolls2.js';  // 1.19.0: workshops izba, kimekomi, tumbler; profiles vanka, kimekomi, budao
import './scenes-jewel.js';  // 1.21.0: six jewellers' workshops (tarakasi, chengdu, kruja, meenakari, minakari, kabyle) for the figure tables of paint-figures/jewel.js
import './scenes-script.js';  // 1.25.0: scribes' rooms (babylon, ustav ...) for paint-figures/script.js
import './scenes-glass.js';  // 1.22.0: glassblowing workshops murano, hebron, bohemia; profiles goblet, hebronjug, crystalvase (the look is glass.js, called by vessel.js)
// -- 1.26.0 Kitchen Crafts of the World (one owner per file pair) --
import './tech-dough.js';            // dough: pleating, shaping and moulding (khinkali, jiaozi, pasta, maamoul ...)
import './scenes-kitchen-dough.js';  // kitchens for the dough games
import './tech-pull.js';             // pull: hand-pulled noodles
import './tech-bake.js';             // bake: stretch, slap and peel flatbread
import './scenes-kitchen-fire.js';   // noodle shop and tonir kitchens
import './tech-pour.js';             // pour: tea poured from a height
import './scenes-kitchen-tea.js';    // tea rooms
import './tech-brew.js';             // brew: pot on the heat (coffee foam, boiled palm sugar)
import './scenes-kitchen-coffee.js'; // coffee and sugar kitchens
import './scenes-kitchen-sweet.js';  // paint-based sweets: scenes for the paint figures taffy and nerikiri
export {};

// shape-craft `paint` figure tables: one file per tradition, each exporting (rng, variation) => design.
// design = { id, name, ar, ground, surface: { kind, shape }, symmetry: { kind, n? }, palette: [{ name, color, metal? }], finish?, layers: [layer] }
// layer  = { name, tool, colors: [palette index], strokes: [guide strokes], regions: [fill regions], resist?: { dye, label }, hint, wLine?, wFill? }
// Strokes and regions listed once are repeated by the engine under the design's symmetry (noSym: true marks a shape that is already symmetric).
import { symMaps, orbitLines, polyBox, polyLen, toolOf } from '../paint-stroke.js';
import { petrykivka } from './petrykivka.js';
import { rosemaling } from './rosemaling.js';
import { dala } from './dala.js';
import { kashmiri } from './kashmiri.js';
import { tingatinga } from './tingatinga.js';
import { lukchup } from './lukchup.js';
import { madhubani } from './madhubani.js';
import { kalamkari } from './kalamkari.js';
import { gond } from './gond.js';
import { warli } from './warli.js';
import { batik } from './batik.js';
import { pysanka } from './pysanka.js';
import { azulejo, iznik, talavera, delft } from './tiles.js';
import { kalocsa } from './kalocsa.js';
import { nubian } from './nubian.js';
import { tarakasi, albanian, chengdu, meenakari, minakari, kabyle } from './jewel.js';
import { maasai } from './bead.js';
import { babylon, ustav, tughra, tazhib, lontar, enluminure } from './script.js';
import { hexsign, zhostovo, cicmany, taptap, screenpaint, zalipie, kroszonka } from './folk2.js';

export const DESIGNS = { petrykivka, rosemaling, dala, kashmiri, tingatinga, lukchup, madhubani, kalamkari, gond, warli, batik, pysanka, azulejo, iznik, talavera, delft, kalocsa, nubian, hexsign, zhostovo, cicmany, taptap, screenpaint, zalipie, kroszonka, tarakasi, albanian, chengdu, meenakari, minakari, kabyle, maasai, babylon, ustav, tughra, tazhib, lontar, enluminure };
export const DESIGN_IDS = Object.keys(DESIGNS);

const centre = (pts) => { const b = polyBox(pts); return [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2]; };
function expandRegions(regions, maps) {
  const fixed = regions.filter((r) => r.noSym), out = [...fixed];
  const imgs = regions.filter((r) => !r.noSym).map((r) => {
    const list = [];
    for (const f of maps) { const pts = r.pts.map(f), c = centre(pts); if (!list.some((q) => Math.hypot(centre(q.pts)[0] - c[0], centre(q.pts)[1] - c[1]) < 0.01)) list.push({ ...r, pts }); }
    return list;
  });
  for (let m = 0; m < maps.length; m++) for (const l of imgs) if (l[m]) out.push(l[m]);
  return out;
}
function expandStrokes(strokes, maps) {
  const fixed = strokes.filter((s) => s.noSym), out = [...fixed];
  const imgs = strokes.filter((s) => !s.noSym).map((s) => orbitLines(s.pts, maps).map((pts) => ({ ...s, pts })));
  for (let m = 0; m < maps.length; m++) for (const l of imgs) if (l[m]) out.push(l[m]);
  return out;
}
const hex = (c) => { const m = /^#?([0-9a-f]{6})$/i.exec(c ?? ''); const n = m ? parseInt(m[1], 16) : 0x808080; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = (a) => '#' + a.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const lumOf = (c) => { const [r, g, b] = hex(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
const blend = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t));
// opts (1.8.0, all optional): ground = colour override, pale = true switches to a light ground and darkens any pigment that would vanish on it,
// wash = true adds the mordant / wash step to designs that have one
// A tool only carries 1/use of a unit of length before it runs dry, so a guide longer than that is split into strokes the player can lay in one pull (1.8.0).
function splitLong(strokes, tool) {   // tool = the tool's numbers (1.25.0: with the design's overrides)
  const cap = 0.8 / Math.max(0.05, tool.use), out = [];
  for (const g of strokes) {
    const L = polyLen(g.pts), n = Math.ceil(L / cap);
    if (n <= 1 || g.closed && false) { out.push(g); continue; }
    const per = Math.ceil((g.pts.length - 1) / n);
    for (let k = 0; k < n; k++) { const seg = g.pts.slice(k * per, Math.min(g.pts.length, (k + 1) * per + 1)); if (seg.length >= 2) out.push({ ...g, pts: seg, closed: false }); }
  }
  return out;
}
export function buildDesign(id, rng, variation = 1, opts = {}) {
  const f = DESIGNS[id] ?? petrykivka, d = f(rng, variation, opts), maps = symMaps(d.symmetry, d.ar);
  if (opts.ground || opts.pale) {
    d.ground = opts.ground ?? blend(d.ground, '#f3e8cf', 0.84);
    if (d.surface.kind === 'panel' || d.surface.kind === 'board') d.paleGround = true;
    d.palette = d.palette.map((c) => (Math.abs(lumOf(c.color) - lumOf(d.ground)) < 0.28 ? { ...c, color: blend(c.color, lumOf(d.ground) > 0.5 ? '#2a1a10' : '#ffffff', 0.62) } : c));
  }
  if (maps.length > 1) d.layers = d.layers.map((L) => ({ ...L, strokes: expandStrokes(L.strokes, maps), regions: expandRegions(L.regions, maps) }));
  d.layers = d.layers.map((L) => {
    const used = [...L.strokes.map((g) => g.col), ...L.regions.map((r) => r.col)].filter((c) => c != null);
    return { ...L, strokes: splitLong(L.strokes, { ...toolOf(L.tool), ...(d.tools?.[L.tool] ?? {}) }), colors: [...L.colors, ...used.filter((c, i) => used.indexOf(c) === i && !L.colors.includes(c))] };   // every colour a guide needs is on offer
  });
  return d;
}

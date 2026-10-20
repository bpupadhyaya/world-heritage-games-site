// shape-craft `basket` technique (1.9.0): basketry seen in three quarter view, one ring per row, each form with its own silhouette,
// weave and colourway. The player lays the stitches of the visible front of every ring (as in `coil`) but the basket is a solid:
// rings are lit as a cylinder, stitches are foreshortened towards the edges, rims show their inside, lids, feet, handles and straps
// are part of the form. Forms: peace, bowl, bolga, kiondo, mesob, skep, tray, lutsambo (1.9.0); trug, hooped, pack, lightship, hat, stool (1.13.0) (see FORMS).
// Styles: coil (bound rope), twine (twined sisal), plait (over and under strips), skep (lashed straw bundle); 1.13.0: slat (overlapping boards), rattan (fine weft over staves), hoop (willow weft over ribs).
import { registerTechnique } from './registry.js';
import { clamp, starsFor, hash } from './geom.js';
import { tint, rrect, rgba, mix, shadowed, shelf } from './fx.js';
import { lg, rg, ell, TAU } from './props.js';

// radii are fractions of the widest ring; aspect = total height / widest diameter (rows share it equally)
// body: player rows (resampled to params.rows); foot, lid: pre-woven rows added below and above (never laid by the player)
const FORMS = {
  peace: { body: [0.66, 0.88, 0.99, 1, 0.97, 0.93, 0.9, 0.89], lid: [0.92, 0.88, 0.78, 0.65, 0.5, 0.33, 0.18], aspect: 1.12, tilt: 0.19, knob: 'tuft', open: false, defRows: 9, autoPat: [1, 0] },
  bowl: { body: [0.42, 0.62, 0.78, 0.9, 0.99, 1.05, 1.08], aspect: 0.56, tilt: 0.24, wfrac: 0.4, open: true, defRows: 8, autoPat: [1, 0] },
  bolga: { body: [0.76, 0.8, 0.86, 0.92, 0.98, 1.03, 1.06], aspect: 0.78, tilt: 0.2, wfrac: 0.29, open: true, handles: 'loops', defRows: 9, autoPat: [1, 0] },
  kiondo: { body: [0.52, 0.8, 0.96, 1, 0.96, 0.89, 0.82, 0.8], aspect: 0.88, tilt: 0.18, wfrac: 0.4, open: true, strap: true, defRows: 9, autoPat: [1, 0] },
  mesob: { foot: [0.46, 0.4, 0.42, 0.56, 0.78], body: [0.86, 0.98, 1, 1, 0.94], lid: [0.74, 0.66, 0.54, 0.4, 0.26, 0.14], aspect: 0.98, tilt: 0.17, knob: 'ball', open: false, defRows: 5, autoPat: [1, 2, 0] },
  skep: { body: [1, 1, 0.99, 0.95, 0.88, 0.76, 0.6, 0.4, 0.2], aspect: 0.82, tilt: 0.17, open: false, door: true, knob: 'cap', defRows: 9, autoPat: [1, 0] },
  tray: { body: [0.72, 0.85, 0.95, 1, 1.04], aspect: 0.3, tilt: 0.46, wfrac: 0.44, open: true, floor: true, defRows: 6, autoPat: [1, 0] },
  // 1.13.0: trug (overlapping boards, bentwood arch), hooped (willow weft over ribs, round bail), pack (ash splint, shoulder straps, flat cover),
  // lightship (oak staves with rattan weft, turned base, lid, swing handle), hat (a cone seen from the side), stool (cane seat on four legs)
  trug: { body: [0.8, 0.9, 0.97, 1, 1.03], aspect: 0.4, tilt: 0.4, wfrac: 0.47, open: true, handles: 'arch', headroom: 0.62, weave: true, defRows: 6, autoPat: [1, 0] },
  hooped: { body: [0.72, 0.92, 1, 1, 0.96, 0.91, 0.88], aspect: 0.86, tilt: 0.2, wfrac: 0.4, open: true, handles: 'bail', headroom: 0.5, ribs: 3, weave: true, defRows: 9, autoPat: [1, 0] },
  pack: { body: [0.8, 0.92, 0.99, 1, 1, 0.98, 0.95, 0.92], lid: [0.94, 0.93], aspect: 1.2, tilt: 0.18, wfrac: 0.36, open: false, knob: 'loop', packStraps: true, weave: true, defRows: 9, autoPat: [1] },
  lightship: { foot: [0.92, 0.95], body: [0.9, 0.98, 1, 1, 0.97, 0.94], lid: [0.97, 0.93, 0.8, 0.55], aspect: 0.86, tilt: 0.2, wfrac: 0.4, open: false, knob: 'ball', handles: 'swing', headroom: 0.46, weave: true, defRows: 7, autoPat: [1] },
  hat: { body: [1, 0.92, 0.82, 0.7, 0.58, 0.44, 0.29, 0.13], aspect: 0.46, tilt: 0.27, wfrac: 0.47, open: false, knob: 'point', weave: true, defRows: 8, autoPat: [1, 0] },
  stool: { foot: [0.84, 0.84, 0.84, 0.84, 0.84, 0.84, 0.84], body: [1, 1, 1.02, 1.02], aspect: 0.74, tilt: 0.34, wfrac: 0.4, open: false, seat: true, floor: true, legRows: 7, weave: true, defRows: 4, autoPat: [1, 0] },
  lutsambo: { body: [0.46, 0.74, 0.94, 1, 0.92, 0.82, 0.76], lid: [0.84, 0.78, 0.68, 0.54, 0.36], aspect: 1.12, tilt: 0.19, knob: 'tuft', open: false, defRows: 8, autoPat: [1, 0, 2] },
};
export const BASKET_FORMS = Object.keys(FORMS);
// silhouette of a form as a list of [radius fraction, height fraction] from the floor up (tests compare forms with it)
export const formOutline = (name, rows = 0) => { const F = FORMS[name], R = rows || F.defRows, rad = [...(F.foot ?? []), ...resample(F.body, R), ...(F.lid ?? [])]; return { aspect: F.aspect, pts: rad.map((r, i) => [r, (i + 0.5) / rad.length]) }; };
export const BASKET_DEFAULTS = { form: 'peace', rows: 0, stitches: 13, motif: 'triangles', style: 'coil', palette: [{ name: 'Sisal', color: '#d9b878' }, { name: 'Dark', color: '#2d1d14' }, { name: 'Rust', color: '#a8472a' }], colors: 3, period: 6, leather: '#6b3f22', guide: true, tolerance: 0, variation: 0 };

function resample(keys, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1), x = t * (keys.length - 1), i0 = Math.min(keys.length - 2, Math.floor(x)), f = x - i0, s = (1 - Math.cos(f * Math.PI)) / 2;
    out.push(keys[i0] * (1 - s) + keys[i0 + 1] * s);
  }
  return out;
}
// pattern grids: colour index per stitch; m = distance from the nearest side (mirror), the front of a ring is symmetric
function motifColor(P, r, j, N, ph, zone, second, nC) {
  const m = Math.min(j, N - 1 - j), per = P.period, jj = (m + ph) % per, d = Math.abs(jj - per / 2), k = r % (zone + 2), A = nC > 2 ? 2 : 1;
  switch (P.motif) {
    case 'bands': return Math.floor(r / 2) % 2 ? 1 : (r % 5 === 4 ? second : 0);
    case 'stripes': return Math.floor(m / 2 + ph) % 2 ? 1 : 0;
    case 'zigzag': return Math.abs(((r + m + ph) % per) - per / 2) < 1.2 ? 1 : 0;
    case 'diamonds': { const e = d + Math.abs((r % per) - per / 2); return e <= per / 2 - 0.5 ? 1 : (e <= per / 2 + 0.6 && second > 1 ? second : 0); }
    case 'chevron': { const e = (m + ph + r) % per; return e < 2 ? 1 : e === 2 && nC > 2 ? A : 0; }
    case 'steps': { const e = ((j + r * 2 + ph) % (per + 2)); return e < 2 ? 1 : e === 2 && nC > 2 ? A : 0; }
    case 'checker': return ((Math.floor(j / 2) + Math.floor(r / 2)) % 2) ? 1 : (nC > 2 && r % 4 === 3 ? A : 0);
    case 'eyes': { const cy = r % (per + 1), e = Math.abs(jj - per / 2); return (cy === 2 && e < 1.5) ? 1 : (cy === 2 && e < 0.4) ? A : ((cy === 1 || cy === 3) && e < 0.6 && nC > 2 ? A : 0); }
    case 'lozenges': { const e = Math.abs((r % 4) - 1.5) + Math.abs((((j + 2 * ph) % 6) - 2.5) * 0.6); return e < 1.1 ? 1 : 0; }
    case 'solid': return r % 5 === 2 ? 1 : r % 5 === 3 && nC > 2 ? A : 0;
    case 'spiral': return ((j + r * 2 + ph) % per) < Math.max(2, per / 3) ? 1 : 0;
    case 'herring': { const e = (r + (Math.floor(j / 2) % 2 ? j : -j) + 40 + ph) % 4; return e === 0 ? 1 : e === 1 && nC > 2 ? A : 0; }
    default: return k < zone && d <= zone - 1 - k + 0.5 ? (r % (2 * (zone + 2)) < zone + 2 ? 1 : second) : 0; // triangles
  }
}

export function createBasket(P0, env) {
  const { rng, fx, sound } = env;
  const SC = P0.scene ?? {};
  const FORM = FORMS[P0.form] ?? FORMS.peace;
  const P = { ...P0, rows: P0.rows || FORM.defRows };
  const R = P.rows, N = P.stitches, total = R * N, nC = clamp(P.colors, 2, P.palette.length);
  const foot = FORM.foot ?? [], lid = FORM.lid ?? [];
  const bodyRad = resample(FORM.body, R), nRows = foot.length + R + lid.length;
  const rad = [...foot, ...bodyRad, ...lid], playerStart = foot.length;
  const autoPat = P.autoPat ?? FORM.autoPat ?? [1, 0];
  let SMALL = false;
  let clock = 0, target, board, cursor, done, geo = null, acc = 0, lastLaid = -1, lastLaidAt = -9, grid = null;

  const makeTarget = () => {
    const t = new Array(total).fill(0), ph = rng.int(P.period), zone = 2 + rng.int(2), second = nC > 2 ? 2 : 1;
    for (let r = 0; r < R; r++) for (let j = 0; j < N; j++) t[r * N + j] = Math.min(nC - 1, motifColor(P, r, j, N, ph, zone, second, nC));
    return t;
  };
  const init = () => { target = makeTarget(); board = new Array(total).fill(-1); cursor = 0; done = null; acc = 0; };
  init();
  const share = () => { const cnt = new Array(P.palette.length).fill(0); target.forEach((c) => cnt[c]++); return Math.max(...cnt) / total; };
  const score = () => {
    let ok = 0; for (let i = 0; i < total; i++) if (board[i] === target[i]) ok++;
    const base = share();
    return { score: Math.round(100 * clamp((ok / total - base) / Math.max(1e-6, 1 - base), 0, 1)), ok };
  };
  const finish = () => {
    const r = score(), stars = starsFor(r.score);
    done = { score: r.score, max: 100, stars, headline: stars === 3 ? (SC.words?.win ?? 'A true weave') : stars ? (SC.words?.ok ?? 'A sound basket') : 'Unpick and begin again', detail: `${r.ok} of ${total} stitches match; ${Math.floor(cursor / N)} rows built` };
  };

  // ---- geometry -----------------------------------------------------------------------------------------------------
  const G = (area, small) => {
    const extra = (FORM.strap ? 0.4 : 0) + (FORM.handles ? 0.1 : 0) + (FORM.knob ? 0.1 : 0) + (FORM.headroom ?? 0);
    const tilt = P.tilt ?? FORM.tilt, rtop = rad[nRows - 1], r0 = rad[0];
    const topRoom = small ? 0.92 : 0.9;
    // height of the solid plus the rim ellipse above it and the sag of the base ring below it, all in units of Wm
    const Wm = Math.min(area.w * (FORM.wfrac ?? 0.45), (area.h * topRoom) / (2 * FORM.aspect * (1 + extra) + (rtop + r0) * tilt)), Hb = FORM.aspect * 2 * Wm, rowH = Hb / nRows;
    const base = area.y + area.h * (small ? 0.97 : 0.97) - r0 * tilt * Wm * 1.1 - (small ? area.h * 0.06 : area.h * 0.01), cx = area.x + area.w / 2;
    return { cx, base, rowH, Wm, Hb, tilt, small };
  };
  const yMidOf = (g, k) => g.base - (k + 0.5) * g.rowH;

  // ---- drawing --------------------------------------------------------------------------------------------------------
  const fibre = P.palette[0].color;
  const shadeK = (phi) => { const b = 0.55 * Math.cos(phi) + 0.45 * Math.sin(phi); return clamp((b - 0.22) * 0.5, -0.4, 0.2); };
  const bodyGrad = (ctx, cx, rr, col) => lg(ctx, cx - rr, 0, cx + rr, 0, [[0, tint(col, 0.16)], [0.28, tint(col, 0.1)], [0.62, tint(col, -0.12)], [1, tint(col, -0.46)]]);

  const stitchShape = (ctx, st, w, h, col, k, popScale, r, j) => {
    const cl = tint(col, k);
    const sl = w * 0.22;
    if (st === 'plait') {
      const vert = (r + j) % 2 === 0, hw = (vert ? w * 0.4 : w * 0.56) * popScale, hh = (vert ? h * 0.62 : h * 0.34) * popScale;
      ctx.fillStyle = 'rgba(0,0,0,0.32)'; rrect(ctx, -hw + 1.2, -hh + 1.5, hw * 2, hh * 2, Math.min(hw, hh) * 0.28); ctx.fill();
      const gr = vert ? lg(ctx, -hw, 0, hw, 0, [[0, tint(cl, 0.22)], [0.5, cl], [1, tint(cl, -0.28)]]) : lg(ctx, 0, -hh, 0, hh, [[0, tint(cl, 0.2)], [0.5, cl], [1, tint(cl, -0.3)]]);
      rrect(ctx, -hw, -hh, hw * 2, hh * 2, Math.min(hw, hh) * 0.28); ctx.fillStyle = gr; ctx.fill();
      ctx.strokeStyle = rgba(tint(col, -0.5), 0.35); ctx.lineWidth = 0.8; ctx.beginPath();
      for (let q = -1; q <= 1; q++) { if (vert) { ctx.moveTo(q * hw * 0.5, -hh * 0.9); ctx.lineTo(q * hw * 0.5, hh * 0.9); } else { ctx.moveTo(-hw * 0.9, q * hh * 0.5); ctx.lineTo(hw * 0.9, q * hh * 0.5); } }
      ctx.stroke();
    } else if (st === 'slat') { // overlapping boards with grain and copper tacks
      const hw = w * 0.54 * popScale, hh = h * 0.56 * popScale;
      ctx.fillStyle = 'rgba(0,0,0,0.42)'; rrect(ctx, -hw + 0.8, -hh + 2, hw * 2, hh * 2, 1.5); ctx.fill();
      ctx.fillStyle = lg(ctx, 0, -hh, 0, hh, [[0, tint(cl, 0.16)], [0.55, cl], [1, tint(cl, -0.34)]]); rrect(ctx, -hw, -hh, hw * 2, hh * 2, 1.5); ctx.fill();
      if (!SMALL) {
        ctx.strokeStyle = rgba(tint(col, -0.55), 0.22); ctx.lineWidth = 0.8; ctx.beginPath();
        for (let q = -1; q <= 1; q++) { ctx.moveTo(-hw * 0.95, q * hh * 0.5 + (hash(r, j, 3) - 0.5) * 2); ctx.lineTo(hw * 0.95, q * hh * 0.5 + (hash(r, j, 4) - 0.5) * 2); }
        ctx.stroke(); ctx.fillStyle = '#d9985c'; const tr = Math.max(0.9, h * 0.07); ctx.beginPath(); ctx.arc(-hw * 0.78, hh * 0.25, tr, 0, TAU); ctx.arc(hw * 0.78, hh * 0.25, tr, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(-hw, -hh, hw * 2, Math.max(1, hh * 0.18));
      }
    } else if (st === 'rattan') { // fine rattan weft passing over an oak stave
      const hw = w * 0.68 * popScale, hh = h * 0.47 * popScale;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, -hw + 0.8, -hh + 1.6, hw * 2, hh * 2, hh * 0.8); ctx.fill();
      ctx.fillStyle = lg(ctx, 0, -hh, 0, hh, [[0, tint(cl, 0.22)], [0.5, cl], [1, tint(cl, -0.34)]]); rrect(ctx, -hw, -hh, hw * 2, hh * 2, hh * 0.8); ctx.fill();
      if (!SMALL) { ctx.strokeStyle = rgba(tint(col, -0.5), 0.3); ctx.lineWidth = 0.8; ctx.beginPath(); for (let q = -2; q <= 2; q++) { ctx.moveTo(q * hw * 0.4 - hw * 0.15, -hh); ctx.lineTo(q * hw * 0.4 + hw * 0.15, hh); } ctx.stroke(); }
      const sw = Math.max(1.6, w * 0.17), sx = hw * 0.86; ctx.fillStyle = lg(ctx, sx - sw, 0, sx + sw, 0, [[0, tint(P.leather, 0.3)], [0.5, P.leather], [1, tint(P.leather, -0.4)]]); rrect(ctx, sx - sw, -h * 0.5, sw * 2, h, sw * 0.6); ctx.fill();
    } else if (st === 'hoop') { // willow weft, ribs are added over it
      const hw = w * 0.6 * popScale, hh = h * 0.42 * popScale;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, -hw + 0.8, -hh + 1.6, hw * 2, hh * 2, hh * 0.9); ctx.fill();
      ctx.fillStyle = lg(ctx, 0, -hh, 0, hh, [[0, tint(cl, 0.2)], [0.5, cl], [1, tint(cl, -0.36)]]); rrect(ctx, -hw, -hh, hw * 2, hh * 2, hh * 0.9); ctx.fill();
      if (!SMALL) { ctx.strokeStyle = rgba(tint(col, -0.5), 0.3); ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-hw * 0.9, -hh * 0.1); ctx.lineTo(hw * 0.9, hh * 0.1); ctx.moveTo(-hw * 0.8, hh * 0.4); ctx.lineTo(hw * 0.8, hh * 0.5); ctx.stroke(); }
    } else if (st === 'twine') { // a twisted cord laid on the slant
      const hw = w * 0.62 * popScale, hh = h * 0.74 * popScale;
      ctx.rotate(0.5);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, -hw + 1.2, -hh + 1.5, hw * 2, hh * 2, hw * 0.9); ctx.fill();
      ctx.fillStyle = lg(ctx, -hw, 0, hw, 0, [[0, tint(cl, 0.24)], [0.5, cl], [1, tint(cl, -0.34)]]); rrect(ctx, -hw, -hh, hw * 2, hh * 2, hw * 0.9); ctx.fill();
      ctx.save(); rrect(ctx, -hw, -hh, hw * 2, hh * 2, hw * 0.9); ctx.clip();
      ctx.strokeStyle = rgba(tint(col, -0.55), 0.45); ctx.lineWidth = Math.max(0.9, hw * 0.16);
      for (let q = -2; q <= 2; q++) { ctx.beginPath(); ctx.moveTo(-hw, q * hh * 0.42 + hh * 0.18); ctx.lineTo(hw, q * hh * 0.42 - hh * 0.18); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = Math.max(0.8, hw * 0.1); ctx.beginPath(); ctx.moveTo(-hw * 0.4, -hh); ctx.lineTo(-hw * 0.4, hh); ctx.stroke(); ctx.restore();
    } else {
      const hw = w * 0.5 * popScale, hh = h * 0.5 * popScale, skep = st === 'skep', slant = skep ? sl * 1.4 : sl;
      ctx.beginPath(); ctx.moveTo(-hw + slant, -hh); ctx.lineTo(hw + slant, -hh); ctx.lineTo(hw - slant, hh); ctx.lineTo(-hw - slant, hh); ctx.closePath();
      ctx.fillStyle = lg(ctx, -hw, 0, hw, 0, [[0, tint(cl, 0.24)], [0.45, cl], [1, tint(cl, -0.34)]]); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.34)'; ctx.lineWidth = 0.9; ctx.stroke();
      if (!SMALL) { ctx.strokeStyle = 'rgba(255,255,255,0.34)'; ctx.lineWidth = Math.max(0.8, hw * 0.16); ctx.beginPath(); ctx.moveTo(-hw * 0.35 + slant, -hh * 0.82); ctx.lineTo(-hw * 0.35 - slant, hh * 0.82); ctx.stroke(); }
    }
  };

  // one ring: groove, rope, highlight, then its stitches
  const paintRow = (ctx, g, k, colors, curRow, t, small, isAuto, rowIdx) => {
    const rr = rad[k] * g.Wm, ry = rr * g.tilt, yMid = yMidOf(g, k), rh = g.rowH, cx = g.cx;
    const path = () => { ctx.beginPath(); ctx.ellipse(cx, yMid, rr, ry, 0, 0, Math.PI, false); };
    ctx.lineCap = 'round';
    path(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = rh * 1.04; ctx.save(); ctx.translate(0, rh * 0.07); ctx.stroke(); ctx.restore();
    path(); ctx.strokeStyle = bodyGrad(ctx, cx, rr, tint(fibre, -0.16)); ctx.lineWidth = rh * 0.97; ctx.stroke();
    path(); ctx.strokeStyle = bodyGrad(ctx, cx, rr, fibre); ctx.lineWidth = rh * 0.8; ctx.stroke();
    if (!small) { path(); ctx.save(); ctx.translate(0, -rh * 0.22); ctx.strokeStyle = lg(ctx, cx - rr, 0, cx + rr, 0, [[0, 'rgba(255,255,255,0.3)'], [0.5, 'rgba(255,255,255,0.12)'], [1, 'rgba(255,255,255,0)']]); ctx.lineWidth = rh * 0.2; ctx.stroke(); ctx.restore(); }
    if (P.style === 'skep' && !small) { // straw streaks along the bundle
      ctx.strokeStyle = 'rgba(70,40,10,0.22)'; ctx.lineWidth = 0.8;
      for (let q = -1; q <= 1; q += 1) { ctx.beginPath(); ctx.ellipse(cx, yMid + q * rh * 0.22, rr, ry, 0, 0, Math.PI, false); ctx.stroke(); }
    }
    SMALL = small;
    for (let j = 0; j < N; j++) {
      const v = colors[j]; if (v < 0) continue;
      const u = (j + 0.5) / N, phi = u * Math.PI, x = cx - rr * Math.cos(phi), y = yMid + ry * Math.sin(phi);
      const ang = Math.atan2(ry * Math.cos(phi), rr * Math.sin(phi));
      const dx = (rr * Math.PI) / N, w = Math.max(dx * 0.34, dx * Math.sin(phi)) * 1.02, h = rh * (P.style === 'skep' ? 0.9 : 0.82);
      let pop = 1;
      if (!isAuto && rowIdx * N + j === lastLaid && t - lastLaidAt < 0.25) pop = 1 + 0.35 * (1 - (t - lastLaidAt) / 0.25);
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang * 0.9);
      stitchShape(ctx, P.style, w, h, P.palette[v].color, shadeK(phi), pop, rowIdx ?? k, j);
      ctx.restore();
    }
    if (FORM.ribs) { // the hoops the weft is woven over, standing across the ring
      for (let j = FORM.ribs - 1; j < N - 1; j += FORM.ribs) {
        const u = (j + 1) / N, phi = u * Math.PI, x = cx - rr * Math.cos(phi), y = yMid + ry * Math.sin(phi), dx = (rr * Math.PI) / N, rw = Math.max(dx * 0.22, dx * 0.5 * Math.sin(phi)), ang = Math.atan2(ry * Math.cos(phi), rr * Math.sin(phi));
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang * 0.9); ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, -rw + 1, -rh * 0.56, rw * 2, rh * 1.12, rw * 0.5); ctx.fill();
        ctx.fillStyle = lg(ctx, -rw, 0, rw, 0, [[0, tint(P.leather, 0.35)], [0.5, P.leather], [1, tint(P.leather, -0.45)]]); rrect(ctx, -rw, -rh * 0.54, rw * 2, rh * 1.08, rw * 0.5); ctx.fill(); ctx.restore();
      }
    }
    if (curRow === rowIdx && !isAuto && !small) { path(); ctx.strokeStyle = 'rgba(242,193,78,0.5)'; ctx.lineWidth = rh * 1.1; ctx.stroke(); }
  };
  const autoColors = (i) => new Array(N).fill(0).map((_, j) => { const a = autoPat[(i + (P.style === 'plait' ? 0 : Math.floor(j / 4) * 0)) % autoPat.length]; return Math.min(a, P.palette.length - 1); });

  const interior = (ctx, g, k) => { // inside of an open rim: the far wall with its own rings, or the plaited floor of a tray
    const rr = rad[k] * g.Wm, ry = rr * g.tilt, yc = yMidOf(g, k) - g.rowH * 0.5, cx = g.cx;
    ctx.beginPath(); ctx.ellipse(cx, yc, rr * 0.99, ry * 0.99, 0, 0, TAU);
    ctx.fillStyle = rg(ctx, cx, yc + ry * 0.3, 2, rr, [[0, tint(fibre, -0.72)], [0.7, tint(fibre, -0.58)], [1, tint(fibre, -0.3)]]); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, yc, rr * 0.99, ry * 0.99, 0, 0, TAU); ctx.clip();
    if (FORM.floor) { // the floor of a tray: rings of plait from the middle outwards
      const rings = 7;
      for (let q = rings; q >= 1; q--) {
        const f = q / rings, ra = rr * 0.96 * f, rb = ry * 0.96 * f, n = Math.max(8, Math.round((TAU * ra) / (g.rowH * 0.78)));
        ctx.fillStyle = tint(fibre, -0.25 - 0.04 * (rings - q)); ctx.beginPath(); ctx.ellipse(cx, yc, ra, rb, 0, 0, TAU); ctx.fill();
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU, x = cx + Math.cos(a) * ra * 0.9, y = yc + Math.sin(a) * rb * 0.9, ci = autoColors(q + (P.style === 'plait' ? 0 : 0))[0], col = P.palette[(q + i) % 3 === 0 ? Math.min(ci, P.palette.length - 1) : 0].color;
          ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(rb * Math.cos(a), ra * Math.sin(a)) * -1 + Math.PI / 2 * 0); ctx.fillStyle = tint(col, -0.2 - 0.03 * (rings - q) + (i % 2 ? 0.06 : 0)); const w2 = (TAU * ra) / n * 0.46, h2 = Math.max(2, (ra / rings) * 0.34);
          rrect(ctx, -w2, -h2 * 0.5, w2 * 2, h2, 1.5); ctx.fill(); ctx.restore();
        }
      }
    } else { // the far wall seen from inside: the next rings down, darker with depth
      for (let d = 1; d <= 6 && k - d >= 0; d++) {
        const kk = k - d, r2 = rad[kk] * g.Wm, ry2 = r2 * g.tilt, y2 = yMidOf(g, kk) - ry2;
        if (y2 > yc + ry * 0.95) break;
        ctx.beginPath(); ctx.ellipse(cx, yMidOf(g, kk), r2, ry2, 0, Math.PI, TAU, false);
        ctx.strokeStyle = tint(fibre, -0.5 - 0.06 * d); ctx.lineWidth = g.rowH * 0.92; ctx.stroke();
        ctx.strokeStyle = rgba(tint(fibre, 0.1 - 0.08 * d), 0.3); ctx.lineWidth = Math.max(1, g.rowH * 0.12); ctx.save(); ctx.translate(0, -g.rowH * 0.25); ctx.stroke(); ctx.restore();
      }
      ctx.fillStyle = rg(ctx, cx, yc + ry * 0.5, 2, rr, [[0, 'rgba(0,0,0,0.5)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(cx - rr, yc - ry, rr * 2, ry * 2);
    }
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(cx, yc, rr, ry, 0, Math.PI, TAU, false);
    ctx.strokeStyle = bodyGrad(ctx, cx, rr, tint(fibre, -0.1)); ctx.lineWidth = g.rowH * 0.62; ctx.lineCap = 'round'; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = Math.max(1, g.rowH * 0.1); ctx.beginPath(); ctx.ellipse(cx, yc, rr, ry, 0, Math.PI * 1.1, Math.PI * 1.9, false); ctx.stroke();
  };

  const topCap = (ctx, g, k, colIdx) => { // flat top of a closed form
    const rr = rad[k] * g.Wm, yc = yMidOf(g, k) - g.rowH * 0.5, ry = rr * g.tilt, cx = g.cx;
    ctx.beginPath(); ctx.ellipse(cx, yc, rr, ry, 0, 0, TAU);
    ctx.fillStyle = rg(ctx, cx - rr * 0.3, yc - ry * 0.3, 1, rr * 1.1, [[0, tint(P.palette[colIdx].color, 0.2)], [1, tint(P.palette[colIdx].color, -0.35)]]); ctx.fill();
  };
  const knob = (ctx, g, k) => {
    const rr = Math.max(g.Wm * 0.07, 6), yc = yMidOf(g, k) - g.rowH * 0.5, cx = g.cx, kind = FORM.knob, c2 = P.palette[Math.min(1, P.palette.length - 1)].color;
    if (kind === 'point') { // the tip of a hat: a small plaited cone
      const cc = P.palette[Math.min(1, P.palette.length - 1)].color; ctx.fillStyle = lg(ctx, cx - rr, 0, cx + rr, 0, [[0, tint(cc, 0.25)], [0.6, cc], [1, tint(cc, -0.45)]]);
      ctx.beginPath(); ctx.moveTo(cx - rr * 0.9, yc + 2); ctx.lineTo(cx, yc - rr * 2.1); ctx.lineTo(cx + rr * 0.9, yc + 2); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.stroke();
    } else if (kind === 'loop') { // a leather carrying loop sewn to the cover
      leatherStrap(ctx, [[cx - rr * 2.2, yc], [cx - rr * 2.2, yc - rr * 4.2], [cx + rr * 2.2, yc - rr * 4.2], [cx + rr * 2.2, yc]], Math.max(4, rr * 1.0), P.leather);
    } else if (kind === 'tuft') { // bound tuft of grass
      for (let q = -3; q <= 3; q++) { ctx.strokeStyle = tint(fibre, (q % 2 ? 0.1 : -0.2)); ctx.lineWidth = Math.max(1.4, rr * 0.34); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx, yc); ctx.quadraticCurveTo(cx + q * rr * 0.4, yc - rr * 2.2, cx + q * rr * 0.9, yc - rr * 3 + Math.abs(q) * rr * 0.4); ctx.stroke(); }
      ctx.fillStyle = c2; rrect(ctx, cx - rr * 0.8, yc - rr * 0.9, rr * 1.6, rr * 1.1, 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(cx, yc - rr * 0.7, rr * 1.05, 0, TAU); ctx.fillStyle = rg(ctx, cx - rr * 0.3, yc - rr * 1.1, 1, rr * 1.4, [[0, tint(c2, 0.35)], [1, tint(c2, -0.4)]]); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke();
    }
  };
  const leatherStrap = (ctx, pts, wd, col) => {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]); };
    path(); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = wd * 1.25; ctx.save(); ctx.translate(2, 3); ctx.stroke(); ctx.restore();
    path(); ctx.strokeStyle = tint(col, -0.3); ctx.lineWidth = wd * 1.08; ctx.stroke();
    path(); ctx.strokeStyle = col; ctx.lineWidth = wd * 0.82; ctx.stroke();
    path(); ctx.strokeStyle = 'rgba(255,230,190,0.28)'; ctx.lineWidth = Math.max(1, wd * 0.16); ctx.save(); ctx.translate(-wd * 0.18, -wd * 0.2); ctx.stroke(); ctx.restore();
    ctx.setLineDash([wd * 0.5, wd * 0.5]); path(); ctx.strokeStyle = rgba(tint(col, 0.5), 0.55); ctx.lineWidth = Math.max(0.8, wd * 0.08); ctx.stroke(); ctx.setLineDash([]);
  };

  const bow = (ctx, pts, wd, col, flat) => { // a bent wooden bow (flat band or round rod) lit from the left
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]); };
    path(); ctx.strokeStyle = 'rgba(0,0,0,0.38)'; ctx.lineWidth = wd * 1.2; ctx.save(); ctx.translate(2.5, 4); ctx.stroke(); ctx.restore();
    path(); ctx.strokeStyle = tint(col, -0.38); ctx.lineWidth = wd * 1.04; ctx.stroke();
    path(); ctx.strokeStyle = col; ctx.lineWidth = wd * 0.8; ctx.stroke();
    path(); ctx.strokeStyle = 'rgba(255,236,200,0.34)'; ctx.lineWidth = Math.max(1, wd * (flat ? 0.2 : 0.16)); ctx.save(); ctx.translate(-wd * 0.2, -wd * 0.2); ctx.stroke(); ctx.restore();
    if (flat) { ctx.strokeStyle = rgba(tint(col, -0.55), 0.3); ctx.lineWidth = 0.8; ctx.setLineDash([wd * 1.2, wd * 0.9]); path(); ctx.stroke(); ctx.setLineDash([]); }
    for (const [x, y] of [pts[0], pts[3]]) { ctx.fillStyle = flat ? '#b88a3e' : tint(col, -0.2); ctx.beginPath(); ctx.arc(x, y, Math.max(2.4, wd * 0.5), 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.stroke(); }
  };
  const legs = (ctx, g, back) => { // four turned cane legs and a rung ring under a stool seat
    const k0 = playerStart, rA = rad[k0] * g.Wm, ryA = rA * g.tilt, yA = yMidOf(g, k0) + g.rowH * 0.45, yB = g.base, lw = g.Wm * 0.11;
    for (const a of [Math.PI * 0.16, Math.PI * 0.84, -Math.PI * 0.16, -Math.PI * 0.84]) {
      if ((Math.sin(a) < 0) !== back) continue;
      const xa = g.cx + rA * 0.86 * Math.cos(a), ya = yA + ryA * 0.86 * Math.sin(a), xb = g.cx + rA * 1.08 * Math.cos(a), yb = yB + ryA * 1.0 * Math.sin(a) * 1.0;
      ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.38)'; ctx.lineWidth = lw * 1.2; ctx.beginPath(); ctx.moveTo(xa + 3, ya); ctx.lineTo(xb + 3, yb + 2); ctx.stroke();
      ctx.strokeStyle = tint(fibre, -0.45); ctx.lineWidth = lw * 1.05; ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xb, yb); ctx.stroke();
      ctx.strokeStyle = tint(fibre, -0.08); ctx.lineWidth = lw * 0.78; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = Math.max(1, lw * 0.16); ctx.beginPath(); ctx.moveTo(xa - lw * 0.2, ya); ctx.lineTo(xb - lw * 0.2, yb); ctx.stroke();
      ctx.fillStyle = tint(fibre, -0.3); const cx2 = (xa + xb) / 2, cy2 = (ya + yb) / 2; ctx.beginPath(); ctx.ellipse(cx2, cy2, lw * 0.62, lw * 0.34, 0, 0, TAU); ctx.fill();
    }
    const rr = rA * 0.96, yr = yA + (yB - yA) * 0.55, ry = rr * g.tilt;
    ctx.strokeStyle = tint(fibre, -0.35); ctx.lineWidth = lw * 0.5; ctx.beginPath(); ctx.ellipse(g.cx, yr, rr, ry, 0, back ? Math.PI : 0, back ? TAU : Math.PI, false); ctx.stroke();
    ctx.strokeStyle = tint(fibre, 0.05); ctx.lineWidth = lw * 0.3; ctx.stroke();
  };

  // smooth outline of the solid (edges follow the profile, rim at the top, the sag of the base ring at the bottom)
  const silhouette = (ctx, g) => {
    const bulge = g.rowH * 0.1, L = [], Rr = [];
    for (let k = 0; k < nRows; k++) { const rr = rad[k] * g.Wm + bulge, y = yMidOf(g, k); L.push([g.cx - rr, y]); Rr.push([g.cx + rr, y]); }
    const r0 = rad[0] * g.Wm + bulge, rt = rad[nRows - 1] * g.Wm + bulge, yTop = yMidOf(g, nRows - 1) - g.rowH * 0.5;
    ctx.beginPath(); ctx.moveTo(L[0][0], g.base);
    for (let i = 0; i < nRows - 1; i++) { const m = [(L[i][0] + L[i + 1][0]) / 2, (L[i][1] + L[i + 1][1]) / 2]; ctx.quadraticCurveTo(L[i][0], L[i][1], m[0], m[1]); }
    ctx.lineTo(L[nRows - 1][0], L[nRows - 1][1]); ctx.lineTo(g.cx - rt, yTop);
    ctx.ellipse(g.cx, yTop, rt, rt * g.tilt + g.rowH * 0.35, 0, Math.PI, TAU, false);
    ctx.lineTo(Rr[nRows - 1][0], Rr[nRows - 1][1]);
    for (let i = nRows - 1; i > 0; i--) { const m = [(Rr[i][0] + Rr[i - 1][0]) / 2, (Rr[i][1] + Rr[i - 1][1]) / 2]; ctx.quadraticCurveTo(Rr[i][0], Rr[i][1], m[0], m[1]); }
    ctx.lineTo(Rr[0][0], g.base);
    ctx.ellipse(g.cx, g.base, r0, r0 * g.tilt + 1, 0, 0, Math.PI, false);
    ctx.closePath();
  };
  // light over the whole solid: dark at the right edge, soft at the left, darker near the floor
  const formShade = (ctx, g) => {
    const wide = g.Wm * 1.2, y0 = g.base - g.Hb;
    ctx.fillStyle = lg(ctx, g.cx - wide, 0, g.cx + wide, 0, [[0, 'rgba(0,0,0,0.3)'], [0.14, 'rgba(0,0,0,0.02)'], [0.34, 'rgba(255,240,210,0.07)'], [0.62, 'rgba(0,0,0,0.0)'], [0.88, 'rgba(0,0,0,0.22)'], [1, 'rgba(0,0,0,0.42)']]);
    ctx.fillRect(g.cx - wide, y0 - g.Hb * 0.3, wide * 2, g.Hb * 1.5);
    ctx.fillStyle = lg(ctx, 0, g.base - g.rowH * 2.2, 0, g.base + g.rowH, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.34)']]); ctx.fillRect(g.cx - wide, g.base - g.rowH * 2.2, wide * 2, g.rowH * 3.4);
  };

  const paintBasket = (ctx, g, gridFor, curRow, t, small) => {
    const nOpenRows = FORM.open ? R : 0;
    // contact shadow
    const r0 = rad[0] * g.Wm;
    ctx.fillStyle = rg(ctx, g.cx + r0 * 0.12, g.base + g.rowH * 0.1, 1, r0 * 1.25, [[0, 'rgba(0,0,0,0.5)'], [0.7, 'rgba(0,0,0,0.22)'], [1, 'rgba(0,0,0,0)']]);
    ctx.beginPath(); ctx.ellipse(g.cx + r0 * 0.12, g.base + g.rowH * 0.1, r0 * 1.25, Math.max(4, r0 * g.tilt * 1.15), 0, 0, TAU); ctx.fill();
    // handles that sit behind the body: bolga loops (drawn first so the rim hides their roots)
    const lastK = nRows - 1, topRad = rad[lastK] * g.Wm, yTop = yMidOf(g, lastK) - g.rowH * 0.5;
    if (FORM.strap) {
      const hw = g.Wm * 0.1;
      leatherStrap(ctx, [[g.cx - topRad * 0.98, yTop + g.rowH * 0.2], [g.cx - topRad * 1.15, yTop - g.Hb * 0.62], [g.cx + topRad * 1.15, yTop - g.Hb * 0.62], [g.cx + topRad * 0.98, yTop + g.rowH * 0.2]], hw, P.leather);
    }
    if (FORM.handles === 'arch' || FORM.handles === 'bail' || FORM.handles === 'swing') { // bentwood or willow bows standing over the basket
      const hh = FORM.handles === 'arch' ? g.Hb * 1.45 : FORM.handles === 'bail' ? g.Hb * 1.2 : g.Hb * 0.95, yb = yTop + g.rowH * 0.3, xx = topRad * (FORM.handles === 'swing' ? 0.99 : 0.97);
      const pts = FORM.handles === 'swing' ? [[g.cx - xx, yb], [g.cx - xx * 0.98, yb - hh * 1.25], [g.cx + xx * 0.98, yb - hh * 1.25], [g.cx + xx, yb]] : [[g.cx - xx, yb], [g.cx - xx * 1.05, yb - hh * 1.3], [g.cx + xx * 1.05, yb - hh * 1.3], [g.cx + xx, yb]];
      bow(ctx, pts, FORM.handles === 'bail' ? g.Wm * 0.045 : g.Wm * (FORM.handles === 'swing' ? 0.075 : 0.085), P.leather, FORM.handles !== 'bail');
    }
    if (FORM.legRows) legs(ctx, g, true);
    ctx.save(); silhouette(ctx, g); ctx.clip();
    for (let k = 0; k < nRows; k++) {
      if (FORM.legRows && k < FORM.legRows) continue;
      const isAuto = k < playerStart || k >= playerStart + R, rowIdx = k - playerStart;
      if (FORM.open && k === nRows - 1) interior(ctx, g, k);
      const cols = isAuto ? autoColors(k) : gridFor.slice(rowIdx * N, rowIdx * N + N);
      paintRow(ctx, g, k, cols, curRow, t, small, isAuto, isAuto ? null : rowIdx);
    }
    if (FORM.legRows) { ctx.save(); ctx.beginPath(); ctx.rect(g.cx - g.Wm * 2, 0, g.Wm * 4, yMidOf(g, playerStart) + g.rowH * 0.5); ctx.clip(); formShade(ctx, g); ctx.restore(); } else formShade(ctx, g);
    if (lid.length) { // the lid's shadow on the body below it
      const k = playerStart + R - 1, rr = rad[k] * g.Wm, ry = rr * g.tilt, y = yMidOf(g, k) - g.rowH * 0.1;
      ctx.beginPath(); ctx.ellipse(g.cx, y, rr, ry, 0, 0, Math.PI, false); ctx.strokeStyle = 'rgba(0,0,0,0.34)'; ctx.lineWidth = g.rowH * 0.5; ctx.stroke();
    }
    ctx.restore();
    void nOpenRows;
    if (FORM.seat) interior(ctx, g, nRows - 1); // the woven seat of a stool
    if (FORM.legRows) legs(ctx, g, false);
    if (FORM.packStraps) { // two leather shoulder straps down the front, riveted, and a bottom loop
      for (const u of [0.2, 0.8]) {
        const phi = u * Math.PI, pts = []; for (let k = nRows - 1; k >= 0; k--) { const rr = rad[k] * g.Wm; pts.push([g.cx - rr * Math.cos(phi), yMidOf(g, k) + rr * g.tilt * Math.sin(phi)]); }
        const sw = g.Wm * 0.1; ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
        const tr = () => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); };
        tr(); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = sw * 1.2; ctx.save(); ctx.translate(2, 3); ctx.stroke(); ctx.restore();
        tr(); ctx.strokeStyle = tint(P.leather, -0.3); ctx.lineWidth = sw * 1.05; ctx.stroke(); tr(); ctx.strokeStyle = P.leather; ctx.lineWidth = sw * 0.84; ctx.stroke();
        tr(); ctx.strokeStyle = 'rgba(255,225,185,0.26)'; ctx.lineWidth = Math.max(1, sw * 0.16); ctx.save(); ctx.translate(-sw * 0.2, 0); ctx.stroke(); ctx.restore();
        for (const [x, y] of [pts[0], pts[Math.floor(pts.length / 2)], pts[pts.length - 1]]) { ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.arc(x, y, Math.max(2, sw * 0.18), 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 0.8; ctx.stroke(); }
      }
    }
    if (!FORM.open && !FORM.seat) {
      if (FORM.knob || FORM.door !== undefined) topCap(ctx, g, nRows - 1, 0);
      if (FORM.knob) knob(ctx, g, nRows - 1);
    }
    if (FORM.handles === 'swing') { // brass ears where the swing handle is pinned
      const yb = yTop + g.rowH * 0.3; for (const sd of [-1, 1]) { const x = g.cx + sd * topRad * 0.99; ctx.fillStyle = lg(ctx, x - 6, 0, x + 6, 0, [[0, '#f2d07a'], [0.5, '#b88a2e'], [1, '#5a3c0c']]); rrect(ctx, x - 5, yb - 7, 10, 18, 3); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1; ctx.stroke(); }
    }
    if (FORM.door) { // the skep's entrance: a dark arch low on the front
      const yd = yMidOf(g, 1) + g.rowH * 0.3, dw = g.Wm * 0.2, dh = g.rowH * 2.1;
      ctx.beginPath(); ctx.moveTo(g.cx - dw, yd + g.rowH * 0.5); ctx.lineTo(g.cx - dw, yd - dh * 0.4); ctx.quadraticCurveTo(g.cx, yd - dh * 1.35, g.cx + dw, yd - dh * 0.4); ctx.lineTo(g.cx + dw, yd + g.rowH * 0.5); ctx.closePath();
      ctx.fillStyle = rg(ctx, g.cx, yd, 1, dw * 1.6, [[0, '#0c0804'], [1, '#2a1a0c']]); ctx.fill(); ctx.strokeStyle = 'rgba(255,230,170,0.3)'; ctx.lineWidth = 1.2; ctx.stroke();
    }
    if (FORM.handles === 'loops') {
      const hw = g.Wm * 0.07, yh = yTop + g.rowH * 1.1;
      for (const sd of [-1, 1]) leatherStrap(ctx, [[g.cx + sd * topRad * 0.96, yh], [g.cx + sd * topRad * 1.45, yh - g.Hb * 0.04], [g.cx + sd * topRad * 1.5, yh + g.Hb * 0.36], [g.cx + sd * topRad * 1.02, yh + g.Hb * 0.34]], hw, P.leather);
    }
    if (!small && curRow >= 0 && cursor < total) { // the stitch to lay next
      const k = playerStart + Math.floor(cursor / N), j = cursor % N, rr = rad[k] * g.Wm, ry = rr * g.tilt, phi = ((j + 0.5) / N) * Math.PI;
      const x = g.cx - rr * Math.cos(phi), y = yMidOf(g, k) + ry * Math.sin(phi), pulse = 0.6 + 0.4 * Math.sin(t * 5);
      ctx.beginPath(); ctx.ellipse(x, y, Math.max(7, g.rowH * 0.55), g.rowH * 0.58, 0, 0, TAU); ctx.strokeStyle = rgba('#ffe08a', 0.55 + 0.4 * pulse); ctx.lineWidth = 2.6; ctx.stroke();
    }
  };

  // ---- interface ------------------------------------------------------------------------------------------------------
  const burst = (idx) => {
    if (!geo || !fx) return;
    const r = Math.floor(idx / N), j = idx % N, k = playerStart + r, rr = rad[k] * geo.Wm, phi = ((j + 0.5) / N) * Math.PI;
    fx.emit('spark', geo.cx - rr * Math.cos(phi), yMidOf(geo, k) + rr * geo.tilt * Math.sin(phi), { count: 3, color: '#fff4c8', size: Math.max(3, geo.rowH * 0.2), speed: 60, life: 0.4, gravity: 40, spread: 3 });
  };
  const items = () => {
    const out = [];
    for (let i = 0; i < nC; i++) out.push({ id: `stitch:${i}`, kind: 'swatch', color: P.palette[i].color, name: P.palette[i].name, off: cursor >= total });
    out.push({ id: 'undo', kind: 'btn', label: 'Undo', off: cursor === 0 });
    out.push({ id: 'check', kind: 'btn', label: 'Check', primary: true });
    return out;
  };
  const control = (id) => {
    if (done) return;
    if (id.startsWith('stitch:')) {
      if (cursor >= total) return;
      const c = Number(id.slice(7)); lastLaid = cursor; lastLaidAt = clock; board[cursor++] = c; (FORM.weave ? sound?.weave(c) : sound?.stitch(c)); burst(lastLaid);
    } else if (id === 'undo') { if (cursor > 0) board[--cursor] = -1; }
    else if (id === 'check') finish();
  };
  const draw = (g, Rt, t) => {
    const { ctx, pal } = g; clock = t;
    const W = Rt.work, area = { x: W.x, y: W.y + 6, w: W.w, h: W.h - 6 - (P.guide && cursor < total ? Math.min(70, W.h * 0.2) : 0) };
    geo = G(area, false);
    const row = Math.min(R - 1, Math.floor(cursor / N));
    paintBasket(ctx, geo, board, cursor < total ? row : -1, t, false);
    if (P.guide && cursor < total) {
      const gw = Math.min(W.w * 0.7, 40 * N), sw = gw / N, gx = geo.cx - gw / 2, gh = Math.max(16, sw * 0.7), gy = W.y + W.h - gh - 12;
      ctx.fillStyle = 'rgba(0,0,0,0.38)'; rrect(ctx, gx - 8, gy - 8, gw + 16, gh + 16, 10); ctx.fill();
      for (let j = 0; j < N; j++) {
        const col = P.palette[target[row * N + j]].color, gg = ctx.createLinearGradient(0, gy, 0, gy + gh); gg.addColorStop(0, tint(col, 0.2)); gg.addColorStop(1, tint(col, -0.25));
        rrect(ctx, gx + j * sw + 1.5, gy, sw - 3, gh, 4); ctx.fillStyle = gg; ctx.fill();
        if (row * N + j === cursor) { ctx.strokeStyle = pal.accent; ctx.lineWidth = 3; rrect(ctx, gx + j * sw, gy - 2, sw, gh + 4, 5); ctx.stroke(); }
      }
      g.label(ctx, `Row ${row + 1} of ${R}: copy this row`, geo.cx, gy - 18, g.px(21), pal.dim, 'center', '500');
    }
    g.label(ctx, `Stitch ${Math.min(cursor + 1, total)} of ${total}`, W.x + 16, W.y + 20, g.px(22), pal.dim, 'left', '500');
    const th = Rt.thumb, tg = G({ x: th.x, y: th.y + th.h * 0.02, w: th.w, h: th.h * 0.9 }, true);
    shelf(ctx, th.x + th.w / 2, tg.base + 4, th.w * 0.36);
    paintBasket(ctx, tg, target, -1, t, true);
  };
  const titleArt = (g, S, t) => {
    const { ctx } = g, tg = G({ x: S.x, y: S.y, w: S.w, h: S.h * 0.96 }, false);
    paintBasket(ctx, tg, target, -1, t, false);
  };
  const attract = (dt) => {
    if (done) return;
    acc += dt; if (acc < 0.05) return; acc = 0;
    if (cursor < total) { board[cursor] = target[cursor]; cursor++; (FORM.weave ? sound?.weave(target[cursor - 1]) : sound?.stitch(target[cursor - 1])); } else finish();
  };
  return {
    init, items, control, work: () => {}, draw, attract, titleArt, result: () => done,
    score: () => score().score,
    info: () => [`Rows: ${R}`, `Stitches per row: ${N}`],
    caption: SC.words?.caption ?? 'Weave this basket',
    hint() {
      if (cursor >= total) return 'The basket is built: press Check.';
      const row = Math.floor(cursor / N), j = cursor % N;
      return `Stitch ${j + 1} of row ${row + 1} should be ${P.palette[target[cursor]].name}.`;
    },
    rules: () => ['Rows are laid from the base upwards, left to right across the front; undo takes back the last stitch.', 'The lid, foot and handles are already made.', 'Score: stitches with the right colour, measured beyond what the plain fibre colour would give.'],
    point() { return null; },
    state: () => ({ technique: 'basket', form: P.form, style: P.style, rows: R, stitches: N, board, target, cursor }),
  };
}
void mix; void shadowed; void ell; void hash;
registerTechnique('basket', { make: (P, env) => createBasket({ ...BASKET_DEFAULTS, ...P }, env), scene: 'bk-peace', mat: 'grass' });

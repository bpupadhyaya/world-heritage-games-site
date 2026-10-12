// coil: build a basket wall row by row; every tap lays one stitch of the chosen colour. Rows follow the basket's profile.
import { clamp, profileRadii, shade, normIoU, starsFor } from './geom.js';

export const COIL_DEFAULTS = { profile: 'basket', rows: 10, stitches: 12, motif: 'triangles', style: 'coil', palette: [{ name: 'Sisal', color: '#d9b878' }, { name: 'Dark', color: '#2d1d14' }, { name: 'Rust', color: '#a8472a' }], colors: 2, period: 6, guide: true, tolerance: 0, variation: 0.03 };

export function createCoil(P, env) {
  const { rng, audio } = env;
  const R = P.rows, N = P.stitches, total = R * N;
  const nColors = clamp(P.colors, 2, P.palette.length);
  let target, board, cursor, done, geo = null, rects = null, widths, acc = 0;

  const makeTarget = () => {
    const t = new Array(total).fill(0);
    const ph = rng.int(P.period), zone = 2 + rng.int(2), second = nColors > 2 ? 2 : 1;
    for (let r = 0; r < R; r++) for (let j = 0; j < N; j++) {
      const m = Math.min(j, N - 1 - j), jj = (m + ph) % P.period, d = Math.abs(jj - P.period / 2), k = r % (zone + 2);
      let c = 0;
      switch (P.motif) {
        case 'bands': c = Math.floor(r / 2) % 2 ? 1 : (r % 5 === 4 ? second : 0); break;
        case 'stripes': c = Math.floor(m / 2 + ph) % 2 ? 1 : 0; break;
        case 'zigzag': c = Math.abs(((r + m + ph) % (P.period)) - P.period / 2) < 1.2 ? 1 : 0; break;
        case 'diamonds': c = d + Math.abs((r % P.period) - P.period / 2) <= P.period / 2 - 0.5 ? 1 : (d + Math.abs((r % P.period) - P.period / 2) <= P.period / 2 + 0.6 && second > 1 ? second : 0); break;
        default: c = k < zone && d <= zone - 1 - k + 0.5 ? (r % (2 * (zone + 2)) < zone + 2 ? 1 : second) : 0; // triangles
      }
      t[r * N + j] = c;
    }
    return t;
  };
  const init = () => { target = makeTarget(); board = new Array(total).fill(-1); cursor = 0; done = null; acc = 0; widths = profileRadii(P.profile, R, 100, P.variation, rng, P.explicitProfile); };
  init();

  const share = () => { const cnt = new Array(P.palette.length).fill(0); target.forEach((c) => cnt[c]++); return Math.max(...cnt) / total; };
  const score = () => {
    let ok = 0;
    for (let i = 0; i < total; i++) if (board[i] === target[i]) ok++;
    const acc2 = ok / total, base = share();
    return { score: Math.round(100 * clamp((acc2 - base) / Math.max(1e-6, 1 - base) , 0, 1)), ok };
  };
  const finish = () => {
    const r = score(), stars = starsFor(r.score);
    done = { score: r.score, max: 100, stars, headline: stars === 3 ? 'A true weave' : stars ? 'A sound basket' : 'Unpick and begin again', detail: `${r.ok} of ${total} stitches match; ${Math.floor(cursor / N)} rows built` };
  };

  const items = () => {
    const out = [];
    for (let i = 0; i < nColors; i++) out.push({ id: `stitch:${i}`, kind: 'swatch', color: P.palette[i].color, name: P.palette[i].name, off: cursor >= total });
    out.push({ id: 'undo', kind: 'btn', label: 'Undo', off: cursor === 0 });
    out.push({ id: 'check', kind: 'btn', label: 'Check', primary: true });
    return out;
  };
  const control = (id) => {
    if (done) return;
    if (id.startsWith('stitch:')) {
      if (cursor >= total) return;
      const c = Number(id.slice(7)); board[cursor++] = c;
      audio?.tone({ freq: 300 + c * 110, dur: 0.05, type: 'triangle', vol: 0.18 });
    } else if (id === 'undo') { if (cursor > 0) board[--cursor] = -1; }
    else if (id === 'check') finish();
  };

  const drawStitch = (ctx, x, y, w, h, color, empty) => {
    if (empty) { ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2); return; }
    const rx = Math.min(w, h) * 0.28;
    if (P.style === 'weave') {
      ctx.fillStyle = color; ctx.fillRect(x + 0.5, y + 0.5, w - 1, h - 1);
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x + 0.5, y + 0.5, w - 1, h * 0.28);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 0.5, y + h * 0.78, w - 1, h * 0.22);
      return;
    }
    ctx.beginPath(); ctx.moveTo(x + rx, y); ctx.arcTo(x + w, y, x + w, y + h, rx); ctx.arcTo(x + w, y + h, x, y + h, rx); ctx.arcTo(x, y + h, x, y, rx); ctx.arcTo(x, y, x + w, y, rx); ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(x + w * 0.12, y + h * 0.14, w * 0.76, h * 0.16);
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(x + w * 0.1, y + h * 0.78, w * 0.8, h * 0.13);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + w * 0.5 - 1, y + h * 0.2, 2, h * 0.6);   // binding stitch
  };
  const paintBasket = (ctx, grid, cx, base, rowH, maxHalf, curRow, upTo) => {
    for (let r = 0; r < R; r++) {
      const rad = (widths[r] / 100) * maxHalf, sw = (rad * 2) / N, y = base - (r + 1) * rowH;
      for (let j = 0; j < N; j++) {
        const u = (j + 0.5) / N * 2 - 1, sag = rowH * 0.28 * (1 - u * u) * (upTo === null ? 1 : 1);
        const idx = r * N + j, v = grid[idx];
        drawStitch(ctx, cx - rad + j * sw, y + sag - rowH * 0.12, sw, rowH * 0.9, v >= 0 ? P.palette[v].color : '#000', v < 0);
      }
      if (r === curRow) { ctx.strokeStyle = 'rgba(242,193,78,0.9)'; ctx.lineWidth = 2.5; ctx.strokeRect(cx - rad - 3, y - rowH * 0.1, rad * 2 + 6, rowH * 1.1); }
    }
  };

  const draw = (g, Rt, t) => {
    const { ctx, pal } = g;
    rects = Rt;
    const W = Rt.work;
    const maxHalf = Math.min(W.w * 0.46, W.h * 0.5), Hb = Math.min(W.h * 0.74, maxHalf * 1.45), rowH = Hb / R, base = W.y + W.h * 0.86 , cx = W.x + W.w / 2;
    geo = { cx, base, rowH, maxHalf };
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.beginPath(); ctx.ellipse(cx, base + rowH * 0.2, maxHalf * 1.05, rowH * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    paintBasket(ctx, board, cx, base, rowH, maxHalf, Math.min(R - 1, Math.floor(cursor / N)), null);
    // guide strip: the row being laid
    const row = Math.min(R - 1, Math.floor(cursor / N));
    if (P.guide && cursor < total) {
      const gw = Math.min(W.w * 0.7, 36 * N), sw = gw / N, gx = cx - gw / 2, gy = W.y + W.h * 0.93 - 4, gh = Math.max(16, sw * 0.8);
      for (let j = 0; j < N; j++) {
        ctx.fillStyle = P.palette[target[row * N + j]].color; ctx.fillRect(gx + j * sw + 1, gy, sw - 2, gh);
        if (row * N + j === cursor) { ctx.strokeStyle = pal.accent; ctx.lineWidth = 3; ctx.strokeRect(gx + j * sw, gy - 2, sw, gh + 4); }
      }
      g.label(ctx, `Row ${row + 1} of ${R}: copy this row`, cx, gy - 12, g.px(16), pal.dim, 'center', '500');
    }
    // thumbnail
    const th = Rt.thumb, tH = th.h * 0.9, tRow = tH / R, tHalf = Math.min(th.w * 0.46, tH * 0.5);
    paintBasket(ctx, target, th.x + th.w / 2, th.y + th.h * 0.96, tRow, tHalf, -1, null);
    g.label(ctx, `Stitch ${Math.min(cursor + 1, total)} of ${total}`, W.x + W.w / 2, W.y + 12, g.px(18), pal.dim, 'center', '500');
  };

  const attract = (dt) => {
    if (done) return;
    acc += dt;
    if (acc < 0.05) return; acc = 0;
    if (cursor < total) { board[cursor] = target[cursor]; cursor++; audio?.tone({ freq: 300 + target[cursor - 1] * 110, dur: 0.04, vol: 0.12 }); }
    else finish();
  };

  return {
    init, items, control, work: () => {}, draw, attract, result: () => done,
    score: () => score().score,
    info: () => [`Rows: ${R}`, `Stitches per row: ${N}`],
    caption: 'Coil this basket',
    hint() {
      if (cursor >= total) return 'The basket is built: press Check.';
      const row = Math.floor(cursor / N), j = cursor % N;
      return `Stitch ${j + 1} of row ${row + 1} should be ${P.palette[target[cursor]].name}.`;
    },
    rules: () => ['Rows are laid from the base upwards, left to right; undo takes back the last stitch.', 'Score: stitches with the right colour, measured beyond what the plain fibre colour would give.'],
    point(id) { return null; },
    state: () => ({ technique: 'coil', rows: R, stitches: N, board, target, cursor }),
  };
}

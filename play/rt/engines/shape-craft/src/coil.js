// coil: build a basket wall row by row; every tap lays one stitch of the chosen colour. Rows follow the basket's profile.
import { clamp, profileRadii, normIoU, starsFor, hash } from './geom.js';
import { tint, rrect, rgba, mix, shadowed, shelf, litEdge } from './fx.js';

export const COIL_DEFAULTS = { profile: 'basket', rows: 10, stitches: 12, motif: 'triangles', style: 'coil', palette: [{ name: 'Sisal', color: '#d9b878' }, { name: 'Dark', color: '#2d1d14' }, { name: 'Rust', color: '#a8472a' }], colors: 2, period: 6, guide: true, tolerance: 0, variation: 0.03 };

export function createCoil(P, env) {
  const { rng, audio, fx } = env;
  const SC = P.scene ?? {};
  let clock = 0, laidAt = [];
  const R = P.rows, N = P.stitches, total = R * N;
  const nColors = clamp(P.colors, 2, P.palette.length);
  let target, board, cursor, done, geo = null, rects = null, widths, acc = 0, lastLaid = -1, lastLaidAt = -9;

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

  const burst = (idx) => {
    if (!geo || !fx) return;
    const r = Math.floor(idx / N), j = idx % N, rad = (widths[r] / 100) * geo.maxHalf, sw = (rad * 2) / N;
    fx.emit('spark', geo.cx - rad + (j + 0.5) * sw, geo.base - (r + 0.5) * geo.rowH, { count: 3, color: '#fff4c8', size: Math.max(3, geo.rowH * 0.2), speed: 60, life: 0.4, gravity: 40, spread: 3 });
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
      const c = Number(id.slice(7)); lastLaid = cursor; lastLaidAt = clock; board[cursor++] = c;
      audio?.tone({ freq: 300 + c * 110, dur: 0.05, type: 'triangle', vol: 0.18 });
      burst(lastLaid);
    } else if (id === 'undo') { if (cursor > 0) board[--cursor] = -1; }
    else if (id === 'check') finish();
  };

  // One coil of the basket: a rope of fibre bent into a smile (front view), with the binding stitches wrapped over it.
  const paintBasket = (ctx, grid, cx, base, rowH, maxHalf, curRow, t, small) => {
    const fibre = P.palette[0].color;
    for (let r = 0; r < R; r++) {
      const rad = (widths[r] / 100) * maxHalf, sw = (rad * 2) / N, yMid = base - (r + 0.5) * rowH, sagH = rowH * 0.34;
      const bandPath = () => { ctx.beginPath(); ctx.moveTo(cx - rad, yMid); ctx.quadraticCurveTo(cx, yMid + sagH * 2, cx + rad, yMid); };
      ctx.lineCap = 'round';
      // the rope itself: shadow, body, highlight
      bandPath(); ctx.strokeStyle = 'rgba(0,0,0,0.38)'; ctx.lineWidth = rowH * 1.0; ctx.translate(0, rowH * 0.06); ctx.stroke(); ctx.translate(0, -rowH * 0.06);
      bandPath(); ctx.strokeStyle = tint(fibre, -0.28); ctx.lineWidth = rowH * 0.94; ctx.stroke();
      bandPath(); ctx.strokeStyle = fibre; ctx.lineWidth = rowH * 0.74; ctx.stroke();
      if (!small) { bandPath(); ctx.translate(0, -rowH * 0.2); ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = rowH * 0.2; ctx.stroke(); ctx.translate(0, rowH * 0.2); }
      // binding stitches
      for (let j = 0; j < N; j++) {
        const idx = r * N + j, v = grid[idx]; if (v < 0) continue;
        const u = (j + 0.5) / N, x = cx - rad + u * rad * 2, yy = yMid + sagH * 2 * 2 * u * (1 - u) * 0.5 * 2 - 0;
        const col = P.palette[v].color;
        let pop = 1;
        if (idx === lastLaid && t - lastLaidAt < 0.25) pop = 1 + 0.35 * (1 - (t - lastLaidAt) / 0.25);
        const hw = sw * 0.46 * pop, hh = rowH * 0.4 * pop, sl = sw * 0.18;
        ctx.save(); ctx.translate(x, yy);
        if (P.style === 'weave') {
          const g2 = ctx.createLinearGradient(0, -hh, 0, hh); g2.addColorStop(0, tint(col, 0.22)); g2.addColorStop(0.5, col); g2.addColorStop(1, tint(col, -0.3));
          rrect(ctx, -hw, -hh, hw * 2, hh * 2, Math.min(hw, hh) * 0.3); ctx.fillStyle = g2; ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-hw, (j + r) % 2 ? -hh * 0.1 : hh * 0.2, hw * 2, hh * 0.18);
        } else {
          ctx.beginPath(); ctx.moveTo(-hw + sl, -hh); ctx.lineTo(hw + sl, -hh); ctx.lineTo(hw - sl, hh); ctx.lineTo(-hw - sl, hh); ctx.closePath();
          const g2 = ctx.createLinearGradient(-hw, 0, hw, 0); g2.addColorStop(0, tint(col, 0.2)); g2.addColorStop(0.45, col); g2.addColorStop(1, tint(col, -0.32));
          ctx.fillStyle = g2; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.stroke();
          if (!small) { ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = Math.max(1, hw * 0.18); ctx.beginPath(); ctx.moveTo(-hw * 0.4 + sl, -hh * 0.8); ctx.lineTo(-hw * 0.4 - sl, hh * 0.8); ctx.stroke(); }
        }
        ctx.restore();
      }
      if (r === curRow && !small) { bandPath(); ctx.strokeStyle = 'rgba(242,193,78,0.55)'; ctx.lineWidth = rowH * 1.08; ctx.stroke(); }
    }
  };

  const draw = (g, Rt, t) => {
    const { ctx, pal } = g;
    rects = Rt; clock = t;
    const W = Rt.work;
    const maxHalf = Math.min(W.w * 0.44, W.h * 0.48), Hb = Math.min(W.h * 0.7, maxHalf * 1.45), rowH = Hb / R, base = W.y + W.h * 0.84, cx = W.x + W.w / 2;
    geo = { cx, base, rowH, maxHalf };
    // contact shadow on the mat
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(cx, base + rowH * 0.1, maxHalf * (widths[0] / 100) * 1.1 + 6, rowH * 0.5, 0, 0, 6.2832); ctx.fill();
    paintBasket(ctx, board, cx, base, rowH, maxHalf, Math.min(R - 1, Math.floor(cursor / N)), t, false);
    // soft form shading across the whole basket
    // guide strip: the row being laid
    const row = Math.min(R - 1, Math.floor(cursor / N));
    if (P.guide && cursor < total) {
      const gw = Math.min(W.w * 0.7, 40 * N), sw = gw / N, gx = cx - gw / 2, gy = W.y + W.h * 0.935 - 4, gh = Math.max(18, sw * 0.8);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, gx - 8, gy - 8, gw + 16, gh + 16, 10); ctx.fill();
      for (let j = 0; j < N; j++) {
        const col = P.palette[target[row * N + j]].color;
        const gg = ctx.createLinearGradient(0, gy, 0, gy + gh); gg.addColorStop(0, tint(col, 0.2)); gg.addColorStop(1, tint(col, -0.25));
        rrect(ctx, gx + j * sw + 1.5, gy, sw - 3, gh, 4); ctx.fillStyle = gg; ctx.fill();
        if (row * N + j === cursor) { ctx.strokeStyle = pal.accent; ctx.lineWidth = 3; rrect(ctx, gx + j * sw, gy - 2, sw, gh + 4, 5); ctx.stroke(); }
      }
      g.label(ctx, `Row ${row + 1} of ${R}: copy this row`, cx, gy - 20, g.px(22), pal.dim, 'center', '500');
    }
    // reference on its shelf
    const th = Rt.thumb, tH = th.h * 0.74, tRow = tH / R, tHalf = Math.min(th.w * 0.4, tH * 0.5), tb = th.y + th.h * 0.88;
    shelf(ctx, th.x + th.w / 2, tb + 4, th.w * 0.36);
    paintBasket(ctx, target, th.x + th.w / 2, tb, tRow, tHalf, -1, t, true);
    g.label(ctx, `Stitch ${Math.min(cursor + 1, total)} of ${total}`, W.x + W.w / 2, W.y + 26, g.px(24), pal.dim, 'center', '500');
  };
  const titleArt = (g, S, t) => {
    const { ctx } = g;
    const maxHalf = S.w * 0.42, Hb = Math.min(S.h * 0.8, maxHalf * 1.5), rowH = Hb / R, base = S.y + S.h * 0.88, cx = S.x + S.w / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(cx, base + rowH * 0.1, maxHalf * (widths[0] / 100) * 1.1 + 6, rowH * 0.5, 0, 0, 6.2832); ctx.fill();
    paintBasket(ctx, target, cx, base, rowH, maxHalf, -1, t, false);
  };

  const attract = (dt) => {
    if (done) return;
    acc += dt;
    if (acc < 0.05) return; acc = 0;
    if (cursor < total) { board[cursor] = target[cursor]; cursor++; audio?.tone({ freq: 300 + target[cursor - 1] * 110, dur: 0.04, vol: 0.12 }); }
    else finish();
  };

  return {
    init, items, control, work: () => {}, draw, attract, titleArt, result: () => done,
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

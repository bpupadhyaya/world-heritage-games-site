// Scenes, part A: weaving, dyeing and printing crafts.
import { ENV, SKIN, hash, rgba, mix, shade, lum, roundRectPath, rod, ball, poly, speck, lines, weaveGrid, glow, vignette, TAU, sheenLine, motifPath, isFilled, lineWidthOf } from './scene-kit.js';
import { base, ground, frame } from './scene-parts.js';

export const SCENES_A = {
  // dark silk on a frame loom, gold supplementary weft floats laid by a boat shuttle
  songket: {
    mat: 'weave', pad: 0.1, snd: 'thread', pot: 'spool', tool: 'shuttle', idle: [0.86, 0.97], place: ['thread', 'sparkle'],
    card: { paper: '#efe3c9', deco: 'hem' }, btn: { fill: '#3a1d2b', primary: '#d9a93a' },
    env: (ctx, S) => ENV.wood(ctx, S, { base: '#2b1a12', plank: S.cell * 2.6, lampC: '#ffc880' }),
    under: (ctx, S) => frame.loomH(ctx, S, { wood: '#6b3f1e', warp: '#cdbfe0', beam: 0.5, density: 6 }),
    base: base.sheet(), ground: ground.silk({ density: 7 }),
    cell: (ctx, S, d) => SKIN.threads(ctx, d, { n: 6, dir: 'h' }),
  },
  // raked gravel in a framed garden: rocks standing in it, grooves drawn by a bamboo rake
  karesansui: {
    mat: 'sand', pad: 0.09, snd: 'gravel', tool: 'rake', idle: [0.9, 0.96], place: ['rake'], grid: false, light: 0.7,
    card: { paper: '#e8e3d2', deco: 'plain', ink: '#2c3a2a', sub: '#586450', cap: '#4a5a3e' }, btn: { fill: '#2c3626', primary: '#cfd8b0', edge: '#8a9a70' },
    pot: 'heap',
    env: (ctx, S) => {
      ENV.earth(ctx, S, { base: '#4b5a32' });
      const a = S.area; ctx.fillStyle = 'rgba(120,150,70,0.5)'; ctx.beginPath(); for (let i = 0; i < 40; i++) { const x = a.x + hash(i, 1) * a.w, y = a.y + hash(i, 2) * a.h; ctx.moveTo(x + 6, y); ctx.ellipse(x, y, 6 + hash(i, 3) * 10, 3 + hash(i, 4) * 5, 0, 0, TAU); } ctx.fill();
    },
    under: (ctx, S) => { // cedar border boards
      const r = S.rect, t = Math.max(8, S.cell * 0.55), R = { x: r.x - t, y: r.y - t, w: r.w + 2 * t, h: r.h + 2 * t };
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = S.cell * 1.1; ctx.shadowOffsetY = S.cell * 0.35; ctx.fillStyle = '#000'; ctx.fillRect(R.x, R.y, R.w, R.h); ctx.restore();
      rod(ctx, R.x, R.y + t / 2, R.x + R.w, R.y + t / 2, t, '#8a6a42', 'butt'); rod(ctx, R.x, R.y + R.h - t / 2, R.x + R.w, R.y + R.h - t / 2, t, '#6e5233', 'butt');
      rod(ctx, R.x + t / 2, R.y, R.x + t / 2, R.y + R.h, t, '#7a5a38', 'butt'); rod(ctx, R.x + R.w - t / 2, R.y, R.x + R.w - t / 2, R.y + R.h, t, '#7a5a38', 'butt');
    },
    base: base.sheet({ fill: '#b8b2a0', blur: 0.2, drop: 0.05 }), ground: ground.sand({}),
    cell: (ctx, S, d) => {
      const { kind, col, x, y, s, key } = d;
      if (isFilled(kind)) { // a rock with moss on its shoulder
        const n = kind === 'checker' ? 2 : 1;
        for (let k = 0; k < n; k++) {
          const cx = x + (n === 2 ? (k ? 0.22 : -0.2) * s : 0), cy = y + (n === 2 ? (k ? 0.18 : -0.16) * s : 0), R = s * (n === 2 ? 0.2 : 0.38) * (0.9 + hash(key, k) * 0.2);
          ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx + R * 0.25, cy + R * 0.55, R * 1.1, R * 0.5, 0, 0, TAU); ctx.fill();
          const pts = []; for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU, rr = R * (0.8 + hash(key, i + k * 9) * 0.35); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.82]); }
          const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R * 1.2); g.addColorStop(0, shade(col, 0.5)); g.addColorStop(0.6, col); g.addColorStop(1, shade(col, -0.55));
          ctx.fillStyle = g; poly(ctx, pts); ctx.fill(); ctx.clip();
          ctx.fillStyle = 'rgba(95,130,50,0.65)'; ctx.beginPath(); ctx.ellipse(cx - R * 0.2, cy - R * 0.55, R * 0.7, R * 0.3, -0.2, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 5; i++) ctx.fillRect(cx - R + hash(key, i + 40) * R * 2, cy - R * 0.4 + hash(key, i + 50) * R, 2, 2);
          ctx.restore();
        }
      } else { // raked furrows: two grooves with a ridge between, following the path
        const lw = lineWidthOf(kind, s), bg = S.bg;
        ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; motifPath(ctx, kind, x, y, s);
        ctx.strokeStyle = shade(bg, -0.55); ctx.lineWidth = lw * 1.5; ctx.stroke();
        ctx.strokeStyle = mix(shade(bg, 0.25), col, 0.2); ctx.lineWidth = lw * 1.0; ctx.stroke();
        ctx.strokeStyle = shade(bg, -0.5); ctx.lineWidth = lw * 0.28; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = lw * 0.14; ctx.translate(-lw * 0.35, -lw * 0.38); ctx.stroke();
        ctx.restore();
      }
    },
    frame: () => {},
  },
  // cloth stretched on a bamboo frame, hot wax drawn with a canting
  batik: {
    mat: 'dye', pad: 0.11, snd: 'wax', pot: 'vat', tool: 'canting', idle: [0.88, 0.97], place: ['wax', 'ring'], gridColor: '#6a6a80', gridAlpha: 0.45,
    card: { paper: '#efe6cc', deco: 'tape' }, btn: { fill: '#1d2a52', primary: '#e0a83a' },
    env: (ctx, S) => ENV.wood(ctx, S, { base: '#8a6a3c', plank: S.cell * 1.8, lampC: '#fff0c0' }),
    under: (ctx, S) => {
      const b = S.box, r = Math.max(10, S.cell * 0.55), cx = b.x + r * 1.1, cy = b.y + b.h - r * 1.1; // the wax pan over a small flame
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx + 3, cy + r * 0.55, r * 1.05, r * 0.45, 0, 0, TAU); ctx.fill();
      const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 2, cx, cy, r); g.addColorStop(0, '#e9a56a'); g.addColorStop(1, '#6d3a14'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff3cc'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.72, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,200,90,0.5)'; ctx.beginPath(); ctx.ellipse(cx - r * 0.2, cy - r * 0.2, r * 0.3, r * 0.14, -0.4, 0, TAU); ctx.fill();
      const f = Math.sin(S.t * 9) * 0.1; ctx.fillStyle = '#ffb84a'; ctx.beginPath(); ctx.moveTo(cx - r * 0.2, cy + r * 1.0); ctx.quadraticCurveTo(cx + f * r, cy + r * 0.6, cx, cy + r * 1.0 - r * (0.6 + f)); ctx.quadraticCurveTo(cx + r * 0.3, cy + r * 0.7, cx + r * 0.2, cy + r * 1.0); ctx.fill();
      frame.stretcher(ctx, S, { wood: '#c4a468', ties: 6, tie: '#f4ead2', t: 0.36 });
    },
    base: base.sheet({ blur: 0.15, drop: 0.05 }), ground: ground.coarse({ density: 5.5, a: 0.3 }),
    cell: (ctx, S, d) => SKIN.wax(ctx, d, {}),
    frame: () => {},
  },
};

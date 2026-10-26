// Board LOOK layer: material-true boards, pits, cells and pieces for the shared board presenter (boardgame.js).
// A game opts in with theme.look (see docs/BOARD-LOOK.md); without it the plain presenter draws exactly as before.
// Pure canvas drawing, deterministic (no Math.random, no Date.now): texture and speckle come from hashed seeds.
import { shade, mix, rgba, luminance } from './ui.js';

const TAU = Math.PI * 2;
const hash = (s) => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);

const KIND_ALIAS = {
  king: 'king', noyon: 'king', dejazmatch: 'king', shah: 'king', general: 'king', royal: 'king',
  queen: 'queen', ferz: 'queen', fers: 'queen', bers: 'queen', vizier: 'queen', sew: 'queen', ferzan: 'queen',
  rook: 'rook', chariot: 'rook', tereg: 'rook', castle: 'rook', tower: 'rook', R: 'rook', rukh: 'rook', medeq: 'rook',
  bishop: 'bishop', fil: 'elephant', elephant: 'elephant', alfil: 'elephant', B: 'bishop', fiil: 'elephant',
  camel: 'camel', teme: 'camel', temee: 'camel', teme_: 'camel',
  knight: 'knight', horse: 'knight', mori: 'knight', ferese: 'knight', N: 'knight', morin: 'knight', fares: 'knight',
  pawn: 'pawn', hu: 'pawn', soldier: 'pawn', P: 'pawn', foot: 'pawn', beles: 'pawn',
};
const FIGURE_KINDS = new Set(['king', 'queen', 'rook', 'bishop', 'elephant', 'camel', 'knight', 'pawn', 'lion', 'khan', 'sew', 'negus']);
export const canonicalKind = (k, map) => map?.[k] ?? (FIGURE_KINDS.has(k) ? k : null) ?? KIND_ALIAS[k] ?? KIND_ALIAS[String(k).toLowerCase()] ?? null;

export function createLook(spec, pal, ui) {
  if (!spec || typeof spec !== 'object') return null;
  const LK = spec;
  const G = spec.ground ?? null, B = spec.board ?? {}, N = spec.node ?? {}, L = spec.line ?? {}, C = spec.cell ?? {};
  const P = [spec.pieces?.[0] ?? {}, spec.pieces?.[1] ?? {}];
  const S = spec.seed ?? {};
  const rr = ui.rr;
  const light = (c, a) => shade(c, a), dark = (c, a) => shade(c, -a);

  // ---------------------------------------------------------------- ground (the table under the board)
  let gcache = null, gkey = '';
  const makeCanvas = (w, h) => { try { if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h); const d = globalThis.document; if (d?.createElement) { const c = d.createElement('canvas'); c.width = w; c.height = h; return c; } } catch { /* no canvas */ } return null; };
  function ground(ctx, W, H) {
    if (!G || G.style === 'none') return;
    const key = `${W}x${H}`;
    if (gcache && gkey === key) { ctx.drawImage(gcache, 0, 0, W, H); return; }
    const oc = makeCanvas(Math.round(W * 1.5), Math.round(H * 1.5));
    const c2 = oc?.getContext?.('2d');
    if (!c2) { paintGround(ctx, W, H); return; }
    c2.scale(1.5, 1.5); paintGround(c2, W, H); gcache = oc; gkey = key; ctx.drawImage(oc, 0, 0, W, H);
  }
  function paintGround(ctx, W, H) {
    const base = G.color ?? '#3a2a1c', r = mulberry(hash(`${G.style}${base}`));
    ctx.save();
    ctx.fillStyle = ui.vgrad(ctx, 0, H, [[0, light(base, 0.08)], [0.6, base], [1, dark(base, 0.3)]]); ctx.fillRect(0, 0, W, H);
    const st = G.style;
    if (st === 'felt') {
      const nap = G.nap ?? 1; for (let i = 0; i < 420 * nap * 3; i++) { ctx.fillStyle = rgba(r() > 0.5 ? '#ffffff' : '#000000', 0.035 + 0.03 * nap); ctx.save(); ctx.translate(r() * W, r() * H); ctx.rotate(r() * 6.28); ctx.fillRect(0, 0, 3 + r() * 5, 1); ctx.restore(); }
    } else if (st === 'wood') {
      const ph = Math.max(70, H / 10);
      for (let y = 0, i = 0; y < H; y += ph, i++) {
        ctx.fillStyle = rgba(i % 2 ? '#000000' : '#ffffff', 0.045); ctx.fillRect(0, y, W, ph);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, y, W, 2); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(0, y + 2, W, 1.5);
        ctx.strokeStyle = rgba('#000000', 0.07); ctx.lineWidth = 1.2; ctx.beginPath();
        for (let k = 0; k < 7; k++) { const yy = y + 8 + r() * (ph - 16), wob = (r() - 0.5) * 8; ctx.moveTo(0, yy); ctx.quadraticCurveTo(W / 2, yy + wob, W, yy - wob / 2); }
        ctx.stroke();
      }
    } else if (st === 'mat') {
      const s = 26;
      for (let y = 0, j = 0; y < H; y += s, j++) for (let x = (j % 2) * s / 2 - s; x < W; x += s) { ctx.fillStyle = rgba(((x / s + j) | 0) % 2 ? '#000000' : '#ffffff', 0.025); ctx.fillRect(x, y, s - 2, s - 2); }
      ctx.strokeStyle = rgba('#000000', 0.08); ctx.lineWidth = 1; ctx.beginPath(); for (let y = 0; y < H; y += s) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke();
    } else if (st === 'sand') {
      for (let i = 0; i < 520; i++) { ctx.fillStyle = rgba(r() > 0.5 ? '#ffffff' : '#5a3d1a', 0.06); ctx.fillRect(r() * W, r() * H, 1.5 + r() * 2, 1.5 + r() * 2); }
      ctx.strokeStyle = rgba('#5a3d1a', 0.07); ctx.lineWidth = 2; ctx.beginPath();
      for (let k = 0; k < 14; k++) { const y0 = (k + 0.5) * H / 14; ctx.moveTo(0, y0); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, y0 + Math.sin(x * 0.02 + k) * 6); }
      ctx.stroke();
    } else if (st === 'stone') {
      const s = Math.max(90, W / 5);
      for (let y = 0, j = 0; y < H; y += s * 0.8, j++) for (let x = (j % 2) * s / 2 - s; x < W; x += s) {
        ctx.fillStyle = rgba(r() > 0.5 ? '#ffffff' : '#000000', 0.05 + r() * 0.04); ctx.fillRect(x + 2, y + 2, s - 4, s * 0.8 - 4);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2; ctx.strokeRect(x, y, s, s * 0.8);
      }
    } else if (st === 'silk') {
      for (let k = 0; k < 40; k++) { const x = (k / 40) * W; ctx.fillStyle = rgba(k % 2 ? '#ffffff' : '#000000', 0.03); ctx.fillRect(x, 0, W / 40, H); }
      const gl = ctx.createLinearGradient(0, 0, W, H); gl.addColorStop(0.2, 'rgba(255,255,255,0)'); gl.addColorStop(0.5, 'rgba(255,255,255,0.1)'); gl.addColorStop(0.8, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    } else if (st === 'ink') {
      for (let k = 0; k < 9; k++) { ctx.fillStyle = rgba('#ffffff', 0.02); ctx.beginPath(); ctx.ellipse(r() * W, r() * H, 80 + r() * 160, 40 + r() * 90, r() * 3, 0, TAU); ctx.fill(); }
    }
    const vg = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.25, W / 2, H * 0.5, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // ---------------------------------------------------------------- board body
  let bcache = null, bkey = '';
  function body(ctx, rect, d, m = 0) {   // static art: painted once into an offscreen canvas, then blitted every frame
    const unit = Math.min(rect.w, rect.h), pad = Math.ceil(unit * 0.16), key = `${rect.w | 0}x${rect.h | 0}:${m | 0}`;
    const S = Math.min(2, 2400 / Math.max(rect.w + 2 * pad, rect.h + 2 * pad));
    if (bcache && bkey === key) { ctx.drawImage(bcache, rect.x - pad, rect.y - pad, rect.w + 2 * pad, rect.h + 2 * pad); return; }
    const oc = makeCanvas(Math.max(1, Math.round((rect.w + 2 * pad) * S)), Math.max(1, Math.round((rect.h + 2 * pad) * S)));
    const c2 = oc?.getContext?.('2d');
    if (!c2) { paintBody(ctx, rect, d, m); return; }
    c2.scale(S, S); paintBody(c2, { x: pad, y: pad, w: rect.w, h: rect.h }, d, m); bcache = oc; bkey = key;
    ctx.drawImage(oc, rect.x - pad, rect.y - pad, rect.w + 2 * pad, rect.h + 2 * pad);
  }
  function paintBody(ctx, rect, d, m = 0) {
    const { x, y, w, h } = rect, unit = Math.min(w, h);
    const col = B.color ?? pal.board, rim = B.rim ?? dark(col, 0.45), st = B.style ?? 'wood';
    const corner = B.corner ?? Math.min(26, w * 0.045), frame = m ? Math.max(5, m * 0.92) : Math.max(5, unit * (B.frameWidth ?? 0.028));
    const r = mulberry(hash(`${st}${col}`));
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = unit * 0.07; ctx.shadowOffsetY = unit * 0.035;
    rr(ctx, x, y, w, h, corner); ctx.fillStyle = dark(col, 0.4); ctx.fill();
    ctx.restore();
    // slab thickness (side face)
    rr(ctx, x, y + unit * 0.012, w, h, corner); ctx.fillStyle = dark(rim, 0.25); ctx.fill();
    // top face
    rr(ctx, x, y, w, h, corner);
    if (st === 'lacquer') ctx.fillStyle = ui.vgrad(ctx, y, y + h, [[0, light(col, 0.22)], [0.3, col], [1, dark(col, 0.35)]]);
    else if (st === 'stone') ctx.fillStyle = ui.vgrad(ctx, y, y + h, [[0, light(col, 0.12)], [0.5, col], [1, dark(col, 0.2)]]);
    else ctx.fillStyle = ui.vgrad(ctx, y, y + h, [[0, light(col, 0.14)], [0.5, col], [1, dark(col, 0.18)]]);
    ctx.fill();
    ctx.save(); rr(ctx, x, y, w, h, corner); ctx.clip();
    texture(ctx, st, x, y, w, h, col, r);
    // frame
    if (st !== 'scroll') {
      ctx.lineWidth = frame; ctx.strokeStyle = rim; rr(ctx, x + frame / 2, y + frame / 2, w - frame, h - frame, Math.max(2, corner - frame / 2)); ctx.stroke();
      ctx.lineWidth = 1.5; ctx.strokeStyle = rgba('#ffffff', st === 'lacquer' ? 0.35 : 0.22); rr(ctx, x + frame, y + frame, w - frame * 2, h - frame * 2, Math.max(2, corner - frame)); ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = rgba('#000000', 0.35); rr(ctx, x + frame - 1.5, y + frame - 1.5, w - frame * 2 + 3, h - frame * 2 + 3, Math.max(2, corner - frame + 1)); ctx.stroke();
      if (B.inlay) { ctx.lineWidth = Math.max(2, frame * 0.22); ctx.strokeStyle = B.inlay; rr(ctx, x + frame * 0.5, y + frame * 0.5, w - frame, h - frame, Math.max(2, corner - frame / 2)); ctx.stroke(); }
      if (B.border) border(ctx, x, y, w, h, frame, B.border);
      if (B.stitch && st === 'cloth') { ctx.setLineDash([frame * 0.35, frame * 0.25]); ctx.lineWidth = Math.max(1.5, frame * 0.1); ctx.strokeStyle = B.stitch; rr(ctx, x + frame * 1.35, y + frame * 1.35, w - frame * 2.7, h - frame * 2.7, 4); ctx.stroke(); ctx.setLineDash([]); }
      if (B.studs) { for (const [sx, sy] of [[x + frame * 0.5, y + frame * 0.5], [x + w - frame * 0.5, y + frame * 0.5], [x + frame * 0.5, y + h - frame * 0.5], [x + w - frame * 0.5, y + h - frame * 0.5]]) stud(ctx, sx, sy, frame * 0.34, B.studs); }
    }
    ctx.restore();
    if (B.divider) { const hor = w >= h; ctx.save(); ctx.lineCap = 'round'; const dc = B.divider; const L1 = hor ? [x + frame * 1.4, y + h / 2, x + w - frame * 1.4, y + h / 2] : [x + w / 2, y + frame * 1.4, x + w / 2, y + h - frame * 1.4]; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = frame * 0.55; ctx.beginPath(); ctx.moveTo(L1[0], L1[1] + (hor ? 1.5 : 0)); ctx.lineTo(L1[2], L1[3] + (hor ? 1.5 : 0)); ctx.stroke(); ctx.strokeStyle = dc; ctx.lineWidth = frame * 0.42; ctx.beginPath(); ctx.moveTo(L1[0], L1[1]); ctx.lineTo(L1[2], L1[3]); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = Math.max(1, frame * 0.1); ctx.beginPath(); ctx.moveTo(L1[0] - (hor ? 0 : frame * 0.1), L1[1] - (hor ? frame * 0.12 : 0)); ctx.lineTo(L1[2] - (hor ? 0 : frame * 0.1), L1[3] - (hor ? frame * 0.12 : 0)); ctx.stroke(); ctx.restore(); }
    if (st === 'scroll') scrollEnds(ctx, rect, col);
    if (B.band) band(ctx, rect, d);
  }
  function border(ctx, x, y, w, h, frame, b) {
    const pat = b.pattern ?? 'zigzag', col = b.color ?? pal.accent, u = frame * (b.unit ?? 1.5), fw = frame * 0.72;
    const edge = (ox, oy, ang, len) => {
      ctx.save(); ctx.translate(ox, oy); ctx.rotate(ang); ctx.beginPath(); ctx.rect(0, -frame, len, frame * 2); ctx.clip();
      ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.2, fw * 0.22); ctx.lineJoin = 'round';
      const n = Math.max(2, Math.round(len / u)), q = len / n;
      for (let i = 0; i < n; i++) {
        const cx = i * q + q / 2;
        if (pat === 'zigzag') { ctx.beginPath(); ctx.moveTo(cx - q / 2, fw * 0.5); ctx.lineTo(cx, -fw * 0.5); ctx.lineTo(cx + q / 2, fw * 0.5); ctx.stroke(); }
        else if (pat === 'diamond') { ctx.beginPath(); ctx.moveTo(cx, -fw * 0.5); ctx.lineTo(cx + q * 0.32, 0); ctx.lineTo(cx, fw * 0.5); ctx.lineTo(cx - q * 0.32, 0); ctx.closePath(); ctx.fill(); }
        else if (pat === 'dots') { ctx.beginPath(); ctx.arc(cx, 0, fw * 0.28, 0, TAU); ctx.fill(); }
        else if (pat === 'meander') { const a = q * 0.42, t = fw * 0.5; ctx.beginPath(); ctx.moveTo(cx - a, t); ctx.lineTo(cx - a, -t); ctx.lineTo(cx + a, -t); ctx.lineTo(cx + a, t * 0.2); ctx.lineTo(cx, t * 0.2); ctx.lineTo(cx, -t * 0.1); ctx.stroke(); }
        else if (pat === 'horn') { ctx.beginPath(); ctx.arc(cx - q * 0.15, 0, fw * 0.4, Math.PI * 0.2, Math.PI * 1.75); ctx.arc(cx - q * 0.15, 0, fw * 0.17, Math.PI * 1.75, Math.PI * 0.3, true); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx + q * 0.12, -fw * 0.35); ctx.lineTo(cx + q * 0.34, 0); ctx.lineTo(cx + q * 0.12, fw * 0.35); ctx.stroke(); }
      }
      ctx.restore();
    };
    const m = frame * 0.5;
    edge(x + frame * 0.1, y + m, 0, w - frame * 0.2); edge(x + w - m, y + frame * 0.1, Math.PI / 2, h - frame * 0.2); edge(x + w - frame * 0.1, y + h - m, Math.PI, w - frame * 0.2); edge(x + m, y + h - frame * 0.1, -Math.PI / 2, h - frame * 0.2);
  }
  function stud(ctx, x, y, r, c) {
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r); g.addColorStop(0, light(c, 0.6)); g.addColorStop(0.5, c); g.addColorStop(1, dark(c, 0.5));
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = rgba('#000000', 0.4); ctx.lineWidth = 1; ctx.stroke();
  }
  function texture(ctx, st, x, y, w, h, col, r) {
    if (st === 'wood' || st === 'carved') {
      const seams = B.planks ?? 0;
      for (let k = 0; k < 26; k++) {
        const yy = y + r() * h; ctx.strokeStyle = rgba(r() > 0.5 ? '#000000' : light(col, 0.4), 0.06 + r() * 0.07); ctx.lineWidth = 1 + r() * 1.6; ctx.beginPath();
        const wob = (r() - 0.5) * h * 0.04; ctx.moveTo(x, yy); ctx.bezierCurveTo(x + w * 0.3, yy + wob, x + w * 0.7, yy - wob, x + w, yy + wob * 0.5); ctx.stroke();
      }
      for (let k = 0; k < 5; k++) { const kx = x + r() * w, ky = y + r() * h, kr = 5 + r() * 9; ctx.strokeStyle = rgba('#000000', 0.09); ctx.lineWidth = 1.2; for (let q = 1; q <= 3; q++) { ctx.beginPath(); ctx.ellipse(kx, ky, kr * q * 0.7, kr * q * 0.38, 0, 0, TAU); ctx.stroke(); } }
      for (let s = 1; s <= seams; s++) { const sx = x + (w * s) / (seams + 1); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(sx - 1, y, 2, h); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(sx + 1, y, 1.5, h); }
    } else if (st === 'sand') {
      for (let k = 0; k < 600; k++) { ctx.fillStyle = rgba(r() > 0.5 ? '#ffffff' : '#5a3d1a', 0.07); ctx.fillRect(x + r() * w, y + r() * h, 1.5 + r() * 2.2, 1.5 + r() * 2.2); }
      ctx.strokeStyle = rgba('#5a3d1a', 0.1); ctx.lineWidth = 1.6;
      for (let k = 0; k < 9; k++) { const yy = y + ((k + 0.5) * h) / 9; ctx.beginPath(); ctx.moveTo(x, yy); for (let xx = 0; xx <= w; xx += 30) ctx.lineTo(x + xx, yy + Math.sin(xx * 0.03 + k * 1.7) * 4); ctx.stroke(); }
    } else if (st === 'stone') {
      for (let k = 0; k < 700; k++) { ctx.fillStyle = rgba(r() > 0.45 ? '#ffffff' : '#000000', 0.06 + r() * 0.06); ctx.fillRect(x + r() * w, y + r() * h, 1 + r() * 2.5, 1 + r() * 2.5); }
      ctx.strokeStyle = rgba('#000000', 0.18); ctx.lineWidth = 1.4;
      for (let k = 0; k < 3; k++) { let cx = x + r() * w, cy = y + r() * h; ctx.beginPath(); ctx.moveTo(cx, cy); for (let q = 0; q < 6; q++) { cx += (r() - 0.4) * 40; cy += (r() - 0.3) * 40; ctx.lineTo(cx, cy); } ctx.stroke(); }
    } else if (st === 'ripple') {
      const cx = x + w / 2, cy = y + h / 2, rg = ctx.createRadialGradient(cx, cy, 5, cx, cy, Math.max(w, h) * 0.7); rg.addColorStop(0, rgba(light(col, 0.35), 0.5)); rg.addColorStop(1, rgba(dark(col, 0.5), 0.55)); ctx.fillStyle = rg; ctx.fillRect(x, y, w, h);
      for (let k = 1; k <= 11; k++) { ctx.beginPath(); ctx.ellipse(cx, cy, k * w * 0.05, k * h * 0.045, 0, 0, TAU); ctx.strokeStyle = rgba('#ffffff', 0.12 - k * 0.007); ctx.lineWidth = 1.6; ctx.stroke(); }
      for (let k = 0; k < 14; k++) { const rx = x + r() * w, ry = y + r() * h; ctx.strokeStyle = rgba('#ffffff', 0.1); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.quadraticCurveTo(rx + 12, ry - 5, rx + 26, ry); ctx.stroke(); }
    } else if (st === 'clay') {
      for (let k = 0; k < 900; k++) { ctx.fillStyle = rgba(r() > 0.5 ? '#ffffff' : '#3a1a08', 0.05 + r() * 0.05); ctx.fillRect(x + r() * w, y + r() * h, 1 + r() * 2.5, 1 + r() * 2.5); }
      for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.ellipse(x + r() * w, y + r() * h, 30 + r() * w * 0.25, 14 + r() * h * 0.12, r() * 3, 0, TAU); ctx.strokeStyle = rgba('#ffffff', 0.07); ctx.lineWidth = 6; ctx.stroke(); }
    } else if (st === 'lacquer') {
      const gl = ctx.createLinearGradient(x, y, x + w, y + h * 0.7); gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(0.35, 'rgba(255,255,255,0.14)'); gl.addColorStop(0.5, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.fillRect(x, y, w, h);
      for (let k = 0; k < 60; k++) { ctx.fillStyle = rgba(B.inlay ?? '#d6b45a', 0.05 + r() * 0.05); ctx.fillRect(x + r() * w, y + r() * h, 1 + r() * 1.5, 1 + r() * 1.5); }
    } else if (st === 'cloth') {
      const s = 9; ctx.lineWidth = 1;
      ctx.beginPath(); for (let i = 0; i * s < w; i++) { ctx.moveTo(x + i * s, y); ctx.lineTo(x + i * s, y + h); } ctx.strokeStyle = rgba('#ffffff', 0.06); ctx.stroke();
      ctx.beginPath(); for (let j = 0; j * s < h; j++) { ctx.moveTo(x, y + j * s + s / 2); ctx.lineTo(x + w, y + j * s + s / 2); } ctx.strokeStyle = rgba('#000000', 0.1); ctx.stroke();
      if (B.motif) { ctx.fillStyle = rgba(B.motif, 0.18); const m = Math.max(18, w / 14); for (let i = 0; i * m < w; i++) for (const yy of [y + m * 0.2, y + h - m * 0.9]) { ctx.save(); ctx.translate(x + i * m + m / 2, yy + m * 0.35); ctx.rotate(Math.PI / 4); ctx.fillRect(-m * 0.22, -m * 0.22, m * 0.44, m * 0.44); ctx.restore(); } }
    } else if (st === 'scroll') {
      for (let k = 0; k < 8; k++) { ctx.fillStyle = rgba('#7a5a2a', 0.04); ctx.beginPath(); ctx.ellipse(x + r() * w, y + r() * h, 30 + r() * w * 0.2, 20 + r() * h * 0.1, r() * 3, 0, TAU); ctx.fill(); }
      for (let k = 0; k < 160; k++) { ctx.strokeStyle = rgba('#7a5a2a', 0.07); ctx.lineWidth = 1; const sx = x + r() * w, sy = y + r() * h, a = r() * TAU, l = 4 + r() * 10; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(a) * l, sy + Math.sin(a) * l); ctx.stroke(); }
    }
  }
  function scrollEnds(ctx, rect, col) {
    const { x, y, w, h } = rect, rh = Math.max(10, h * 0.018);
    for (const yy of [y - rh * 0.1, y + h - rh * 0.9]) {
      rr(ctx, x - rh * 0.8, yy, w + rh * 1.6, rh * 1.4, rh * 0.7);
      ctx.fillStyle = ui.vgrad(ctx, yy, yy + rh * 1.4, [[0, light(B.rim ?? '#7a4a22', 0.35)], [0.5, B.rim ?? '#7a4a22'], [1, dark(B.rim ?? '#7a4a22', 0.45)]]); ctx.fill();
    }
  }
  function band(ctx, rect, d) { /* reserved for per-game title bands */ }

  // ---------------------------------------------------------------- lines
  function lines(ctx, rect, d, byId) {
    if (!d.lines?.length) return;
    const lw = Math.max(2, rect.w * (L.width ?? 0.0065)), st = L.style ?? 'incised', col = L.color ?? pal.line;
    const path = (dx, dy) => {
      ctx.beginPath();
      for (const l of d.lines) l.forEach((id, i) => { const n = byId.get(id); const px = rect.x + n.x * rect.w + dx, py = rect.y + n.y * rect.h + dy; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
    };
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (st === 'road') {
      const segs = d.lines.map((l) => l.map((id) => byId.get(id))).filter((l) => l.every(Boolean));
      const lens = segs.map((l) => Math.hypot((l[l.length - 1].x - l[0].x) * rect.w, (l[l.length - 1].y - l[0].y) * rect.h)).sort((a, b) => a - b);
      const med = lens[Math.floor(lens.length / 2)] || 1, isJump = (l) => Math.hypot((l[l.length - 1].x - l[0].x) * rect.w, (l[l.length - 1].y - l[0].y) * rect.h) > med * 1.8;
      const rw = Math.max(8, rect.w * (L.roadWidth ?? 0.05)), rc = L.roadColor ?? '#d8b878';
      const roadPath = (dx, dy) => { ctx.beginPath(); for (const l of segs) { if (isJump(l)) continue; l.forEach((n, i) => { const px = rect.x + n.x * rect.w + dx, py = rect.y + n.y * rect.h + dy; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }); } };
      roadPath(0, rw * 0.12); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = rw * 1.18; ctx.stroke();
      roadPath(0, 0); ctx.strokeStyle = col; ctx.lineWidth = rw * 1.12; ctx.stroke();
      roadPath(0, 0); ctx.strokeStyle = rc; ctx.lineWidth = rw; ctx.stroke();
      roadPath(0, -rw * 0.12); ctx.strokeStyle = rgba('#ffffff', 0.22); ctx.lineWidth = rw * 0.3; ctx.stroke();
      for (const l of segs) { if (!isJump(l)) continue; const a = l[0], b = l[l.length - 1], ax = rect.x + a.x * rect.w, ay = rect.y + a.y * rect.h, bx = rect.x + b.x * rect.w, by = rect.y + b.y * rect.h, mx = (ax + bx) / 2 + (by - ay) * 0.18, my = (ay + by) / 2 - (bx - ax) * 0.18;
        ctx.setLineDash([rw * 0.5, rw * 0.35]); ctx.lineWidth = Math.max(2.5, rw * 0.22); ctx.strokeStyle = L.jumpColor ?? pal.accent; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, my, bx, by); ctx.stroke(); ctx.setLineDash([]);
        const ang = Math.atan2(by - my, bx - mx); ctx.fillStyle = L.jumpColor ?? pal.accent; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - Math.cos(ang - 0.4) * rw * 0.7, by - Math.sin(ang - 0.4) * rw * 0.7); ctx.lineTo(bx - Math.cos(ang + 0.4) * rw * 0.7, by - Math.sin(ang + 0.4) * rw * 0.7); ctx.closePath(); ctx.fill(); }
    } else if (st === 'inlay') { path(0, lw * 0.6); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = lw * 1.2; ctx.stroke(); path(0, 0); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); path(0, -lw * 0.25); ctx.strokeStyle = rgba('#ffffff', 0.35); ctx.lineWidth = lw * 0.3; ctx.stroke(); }
    else if (st === 'ink') { path(0, 0); ctx.strokeStyle = rgba(col, 0.9); ctx.lineWidth = lw * 1.1; ctx.stroke(); path(lw * 0.4, lw * 0.3); ctx.strokeStyle = rgba(col, 0.25); ctx.lineWidth = lw * 1.6; ctx.stroke(); }
    else if (st === 'scratch') { path(0, 0); ctx.strokeStyle = rgba(col, 0.75); ctx.lineWidth = lw * 1.15; ctx.setLineDash([lw * 9, lw * 0.7, lw * 4, lw * 0.9]); ctx.stroke(); ctx.setLineDash([]); path(0, lw * 0.9); ctx.strokeStyle = rgba('#ffffff', 0.22); ctx.lineWidth = lw * 0.7; ctx.stroke(); }
    else { /* incised groove */ path(0, lw * 0.9); ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = lw; ctx.stroke(); path(0, 0); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); path(0, -lw * 0.35); ctx.strokeStyle = rgba('#000000', 0.25); ctx.lineWidth = lw * 0.45; ctx.stroke(); }
    ctx.restore();
  }

  // ---------------------------------------------------------------- nodes
  function node(ctx, n, x, y, r, rect, lastHit) {
    const unit = Math.min(rect.w, rect.h), st = n.shape;
    if (st === 'cell') {
      const light1 = C.light ?? pal.cell0, dark1 = C.dark ?? pal.cell1, c0 = n.tone ? dark1 : light1;
      const tile = C.style ?? 'inset', bev = Math.max(1.5, r * 0.07);
      if (tile === 'hole' || tile === 'ring') { holeCell(ctx, x, y, r, tile, n); cellDecor(ctx, n, x, y, r); if (lastHit) lastRing(ctx, x, y, r * 1.1); return; }
      ctx.fillStyle = c0; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      if (tile === 'woven') {
        const k = 4, q = (r * 2) / k; ctx.save(); ctx.beginPath(); ctx.rect(x - r, y - r, r * 2, r * 2); ctx.clip();
        for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) { const on = (i + j) % 2; ctx.fillStyle = rgba(on ? '#000000' : '#ffffff', on ? 0.16 : 0.14); ctx.fillRect(x - r + i * q + 1, y - r + j * q + 1, q - 2, q - 2); }
        ctx.restore(); ctx.strokeStyle = rgba('#000000', 0.3); ctx.lineWidth = 1.2; ctx.strokeRect(x - r + 0.6, y - r + 0.6, r * 2 - 1.2, r * 2 - 1.2);
      } else if (tile === 'tile') {
        ctx.fillStyle = ui.vgrad(ctx, y - r, y + r, [[0, rgba('#ffffff', 0.22)], [1, rgba('#000000', 0.18)]]); ctx.fillRect(x - r, y - r, r * 2, r * 2);
        ctx.fillStyle = rgba('#ffffff', 0.3); ctx.fillRect(x - r, y - r, r * 2, bev); ctx.fillRect(x - r, y - r, bev, r * 2);
        ctx.fillStyle = rgba('#000000', 0.3); ctx.fillRect(x - r, y + r - bev, r * 2, bev); ctx.fillRect(x + r - bev, y - r, bev, r * 2);
      } else {
        const mo = mulberry(hash(`${n.id}${c0}`));
        ctx.fillStyle = ui.vgrad(ctx, y - r, y + r, [[0, rgba('#ffffff', 0.14)], [1, rgba('#000000', 0.12)]]); ctx.fillRect(x - r, y - r, r * 2, r * 2);
        for (let k = 0; k < 4; k++) { ctx.strokeStyle = rgba('#000000', 0.06); ctx.lineWidth = 1; ctx.beginPath(); const yy = y - r + mo() * r * 2; ctx.moveTo(x - r, yy); ctx.lineTo(x + r, yy + (mo() - 0.5) * r * 0.2); ctx.stroke(); }
        ctx.strokeStyle = rgba('#000000', 0.22); ctx.lineWidth = 1.2; ctx.strokeRect(x - r + 0.6, y - r + 0.6, r * 2 - 1.2, r * 2 - 1.2);
      }
      cellDecor(ctx, n, x, y, r);
    } else if (st === 'pit') {
      pit(ctx, x, y, r);
      cellDecor(ctx, n, x, y, r, true);
    } else if (st === 'store') {
      const w = (n.w ?? 0.1) * rect.w, h = (n.h ?? 0.3) * rect.h, rad = Math.min(w, h) / 2;
      rr(ctx, x - w / 2 - 2, y - h / 2 - 2, w + 4, h + 4, rad + 2); ctx.fillStyle = rgba('#ffffff', 0.22); ctx.fill();
      rr(ctx, x - w / 2, y - h / 2, w, h, rad); ctx.fillStyle = ui.vgrad(ctx, y - h / 2, y + h / 2, [[0, 'rgba(0,0,0,0.7)'], [0.5, 'rgba(0,0,0,0.45)'], [1, 'rgba(0,0,0,0.28)']]); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = rgba(L.color ?? pal.line, 0.9); ctx.stroke();
      rr(ctx, x - w / 2 + 3, y - h / 2 + 3, w - 6, h - 6, rad - 2); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.stroke();
    } else if (st !== 'none') {
      const ns = N.style ?? 'dot', nc = N.color ?? pal.node, rad = Math.max(4, r * (N.size ?? 0.26));
      if (ns === 'hole') {
        const g = ctx.createRadialGradient(x - rad * 0.3, y - rad * 0.3, rad * 0.1, x, y, rad * 1.15); g.addColorStop(0, rgba('#000000', 0.55)); g.addColorStop(0.7, rgba('#000000', 0.8)); g.addColorStop(1, rgba('#000000', 0.9));
        ctx.beginPath(); ctx.arc(x, y, rad * 1.1, 0, TAU); ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y + 1, rad * 1.1, 0.15, Math.PI - 0.15); ctx.strokeStyle = rgba('#ffffff', 0.35); ctx.lineWidth = 1.6; ctx.stroke();
      } else if (ns === 'ring') {
        ctx.beginPath(); ctx.arc(x, y, rad * 1.5, 0, TAU); ctx.strokeStyle = nc; ctx.lineWidth = Math.max(2, rad * 0.36); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y + 1.2, rad * 1.5, 0, TAU); ctx.strokeStyle = rgba('#ffffff', 0.22); ctx.lineWidth = 1.4; ctx.stroke();
      } else if (ns === 'gem') {
        const g = ctx.createRadialGradient(x - rad * 0.3, y - rad * 0.4, rad * 0.1, x, y, rad * 1.1); g.addColorStop(0, light(nc, 0.6)); g.addColorStop(0.5, nc); g.addColorStop(1, dark(nc, 0.5));
        ctx.beginPath(); ctx.arc(x, y, rad * 1.05, 0, TAU); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = rgba('#000000', 0.4); ctx.lineWidth = 1; ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fillStyle = nc; ctx.fill();
        ctx.beginPath(); ctx.arc(x - rad * 0.25, y - rad * 0.3, rad * 0.4, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();
      }
    }
    if (lastHit) { if (st === 'store') { const w = (n.w ?? 0.1) * rect.w, h = (n.h ?? 0.3) * rect.h; ctx.strokeStyle = pal.good; ctx.lineWidth = 3; rr(ctx, x - w / 2 - 3, y - h / 2 - 3, w + 6, h + 6, Math.min(w, h) / 2 + 3); ctx.stroke(); } else lastRing(ctx, x, y, r * 1.1); }
  }
  function lastRing(ctx, x, y, rad) { ctx.strokeStyle = pal.good; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.stroke(); }

  function holeCell(ctx, x, y, r, tile, n) {
    const rad = r * 0.62;
    if (tile === 'ring') { ctx.beginPath(); ctx.arc(x, y, rad * 1.2, 0, TAU); ctx.strokeStyle = N.color ?? pal.node; ctx.lineWidth = Math.max(2, r * 0.12); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y + 1.2, rad * 1.2, 0, TAU); ctx.strokeStyle = rgba('#ffffff', 0.22); ctx.lineWidth = 1.4; ctx.stroke(); return; }
    const sp = n.tone ? (C.dark ?? pal.cell1) : (C.light ?? pal.cell0);
    ctx.beginPath(); ctx.arc(x, y, rad * 1.28, 0, TAU); ctx.fillStyle = rgba(sp, 0.35); ctx.fill();
    const g = ctx.createRadialGradient(x - rad * 0.3, y - rad * 0.35, rad * 0.1, x, y, rad * 1.1); g.addColorStop(0, '#0a0604'); g.addColorStop(0.7, '#1a100a'); g.addColorStop(1, '#2a1a10');
    ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y + 1, rad, 0.15, Math.PI - 0.15); ctx.strokeStyle = rgba('#ffffff', 0.4); ctx.lineWidth = 1.6; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, rad, Math.PI * 1.1, Math.PI * 1.9); ctx.strokeStyle = rgba('#000000', 0.5); ctx.lineWidth = 1.6; ctx.stroke();
  }
  const MARK_COLOR = () => spec.marks?.color ?? pal.accent;
  function drawMark(ctx, kind, x, y, r) {
    const c = MARK_COLOR(); ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1.6, r * 0.11); ctx.strokeStyle = c; ctx.fillStyle = c;
    if (kind === 'rosette') {
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r * 0.36, y + Math.sin(a) * r * 0.36, r * 0.2, r * 0.1, a, 0, TAU); ctx.globalAlpha = 0.9; ctx.fill(); }
      ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(x, y, r * 0.13, 0, TAU); ctx.fillStyle = light(c, 0.4); ctx.fill();
    } else if (kind === 'arch') { ctx.beginPath(); ctx.moveTo(x - r * 0.55, y + r * 0.35); ctx.quadraticCurveTo(x, y - r * 0.7, x + r * 0.55, y + r * 0.35); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - r * 0.62, y + r * 0.42); ctx.lineTo(x + r * 0.62, y + r * 0.42); ctx.stroke(); }
    else if (kind === 'down') { ctx.beginPath(); ctx.moveTo(x - r * 0.4, y - r * 0.2); ctx.lineTo(x, y + r * 0.35); ctx.lineTo(x + r * 0.4, y - r * 0.2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y - r * 0.5); ctx.lineTo(x, y + r * 0.3); ctx.stroke(); }
    else if (kind === 'up') { ctx.beginPath(); ctx.moveTo(x - r * 0.4, y + r * 0.2); ctx.lineTo(x, y - r * 0.35); ctx.lineTo(x + r * 0.4, y + r * 0.2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y + r * 0.5); ctx.lineTo(x, y - r * 0.3); ctx.stroke(); }
    else if (kind === 'pause') { ctx.fillRect(x - r * 0.3, y - r * 0.35, r * 0.2, r * 0.7); ctx.fillRect(x + r * 0.1, y - r * 0.35, r * 0.2, r * 0.7); }
    else if (kind === 'star') { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r * 0.18 : r * 0.42; ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * q, y + Math.sin(a) * q); } ctx.closePath(); ctx.fill(); }
    else if (kind === 'boat') { ctx.beginPath(); ctx.moveTo(x - r * 0.5, y + r * 0.1); ctx.quadraticCurveTo(x, y + r * 0.55, x + r * 0.5, y + r * 0.1); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, y + r * 0.05); ctx.lineTo(x, y - r * 0.5); ctx.lineTo(x + r * 0.32, y - r * 0.05); ctx.closePath(); ctx.stroke(); }
    else if (kind === 'mountain') { ctx.beginPath(); ctx.moveTo(x - r * 0.55, y + r * 0.35); ctx.lineTo(x - r * 0.1, y - r * 0.35); ctx.lineTo(x + r * 0.2, y + r * 0.1); ctx.lineTo(x + r * 0.35, y - r * 0.12); ctx.lineTo(x + r * 0.6, y + r * 0.35); ctx.closePath(); ctx.fill(); }
    else if (kind === 'wave') { ctx.beginPath(); for (let k = 0; k < 2; k++) { const yy = y - r * 0.12 + k * r * 0.3; ctx.moveTo(x - r * 0.55, yy); ctx.bezierCurveTo(x - r * 0.3, yy - r * 0.22, x - r * 0.1, yy + r * 0.22, x + r * 0.1, yy); ctx.bezierCurveTo(x + r * 0.3, yy - r * 0.22, x + r * 0.4, yy + r * 0.1, x + r * 0.55, yy); } ctx.stroke(); }
    else if (kind === 'house') { ctx.beginPath(); ctx.moveTo(x - r * 0.5, y + r * 0.35); ctx.lineTo(x - r * 0.5, y - r * 0.05); ctx.lineTo(x, y - r * 0.45); ctx.lineTo(x + r * 0.5, y - r * 0.05); ctx.lineTo(x + r * 0.5, y + r * 0.35); ctx.closePath(); ctx.stroke(); }
    else if (kind === 'flag') { ctx.beginPath(); ctx.moveTo(x - r * 0.3, y + r * 0.5); ctx.lineTo(x - r * 0.3, y - r * 0.5); ctx.lineTo(x + r * 0.45, y - r * 0.25); ctx.lineTo(x - r * 0.3, y); ctx.stroke(); }
    ctx.restore();
  }
  function cellDecor(ctx, n, x, y, r, pitShape) {
    const lab = spec.labels?.[n.id], mk = spec.marks?.[n.id] ?? (n.tone && C.mark ? C.mark : null);
    if (mk && mk !== 'none' && (!pitShape || spec.marks?.[n.id])) drawMark(ctx, mk, x, y - (lab ? r * 0.18 : 0), r * (lab ? 0.8 : 1));
    if (lab) { ctx.fillStyle = spec.labelColor ?? rgba('#000000', 0.72); ctx.font = `700 ${Math.max(9, Math.round(r * (spec.labelSize ?? 0.3)))}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(lab), x, y + r * (mk ? 0.66 : 0.1), r * 1.9); }
  }
  function pit(ctx, x, y, r) {
    const col = B.color ?? pal.board, depth = S.depth ?? 1;
    // rim (raised lip), then a bowl whose light falls from the upper left
    const rim = ctx.createRadialGradient(x - r * 0.4, y - r * 0.5, r * 0.2, x, y, r * 1.18); rim.addColorStop(0, light(col, 0.3)); rim.addColorStop(1, dark(col, 0.35));
    ctx.beginPath(); ctx.arc(x, y + r * 0.03, r * 1.14, 0, TAU); ctx.fillStyle = rim; ctx.fill();
    const bowl = ctx.createRadialGradient(x + r * 0.28, y + r * 0.35, r * 0.1, x - r * 0.1, y - r * 0.1, r * 1.05);
    bowl.addColorStop(0, rgba('#000000', 0.18 * depth)); bowl.addColorStop(0.55, rgba('#000000', 0.5 * depth)); bowl.addColorStop(1, rgba('#000000', 0.82 * depth));
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = shade(col, -0.55); ctx.fill(); ctx.fillStyle = bowl; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r, Math.PI * 0.05, Math.PI * 0.95); ctx.strokeStyle = rgba('#ffffff', 0.32); ctx.lineWidth = Math.max(1.5, r * 0.06); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r, Math.PI * 1.08, Math.PI * 1.92); ctx.strokeStyle = rgba('#000000', 0.5); ctx.lineWidth = Math.max(1.5, r * 0.07); ctx.stroke();
  }

  // ---------------------------------------------------------------- seeds (inside pits)
  function seeds(ctx, x, y, r, count, owner) {
    const st = S.style ?? 'nut', sc = Array.isArray(S.colors?.[0]) ? S.colors[owner === 1 ? 1 : 0] : S.colors, cols = sc ?? (owner === 1 ? [pal.p1] : [pal.p0]);
    const shown = Math.min(count, 28), size = clamp(r * (0.34 - 0.0045 * shown), r * 0.16, r * 0.3);
    for (let i = 0; i < shown; i++) {
      const rad = r * 0.66 * Math.sqrt((i + 0.5) / Math.max(shown, 3)), a = i * 2.39996 + 0.7;
      const sx = x + Math.cos(a) * rad, sy = y + Math.sin(a) * rad * 0.92, rot = (i * 1.7) % Math.PI, c = cols[(i + owner) % cols.length];
      seed(ctx, st, sx, sy, size, c, rot);
    }
  }
  function seed(ctx, st, x, y, s, c, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.ellipse(s * 0.12, s * 0.26, s * 1.05, s * 0.78, 0, 0, TAU); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
    if (st === 'cowrie') {
      const g = ctx.createRadialGradient(-s * 0.3, -s * 0.35, s * 0.1, 0, 0, s * 1.2); g.addColorStop(0, '#fffdf4'); g.addColorStop(0.6, c); g.addColorStop(1, dark(c, 0.4));
      ctx.beginPath(); ctx.ellipse(0, 0, s * 1.1, s * 0.78, 0, 0, TAU); ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-s * 0.85, 0); ctx.quadraticCurveTo(0, -s * 0.18, s * 0.85, 0); ctx.strokeStyle = rgba('#3a2a14', 0.75); ctx.lineWidth = Math.max(1, s * 0.12); ctx.stroke();
      ctx.beginPath(); for (let k = -3; k <= 3; k++) { ctx.moveTo(k * s * 0.24, -s * 0.12); ctx.lineTo(k * s * 0.24, s * 0.1); } ctx.strokeStyle = rgba('#3a2a14', 0.45); ctx.lineWidth = 1; ctx.stroke();
    } else if (st === 'pebble') {
      const g = ctx.createRadialGradient(-s * 0.35, -s * 0.4, s * 0.1, 0, 0, s * 1.2); g.addColorStop(0, light(c, 0.5)); g.addColorStop(0.55, c); g.addColorStop(1, dark(c, 0.45));
      ctx.beginPath(); ctx.ellipse(0, 0, s * 1.0, s * 0.82, 0, 0, TAU); ctx.fillStyle = g; ctx.fill();
    } else if (st === 'bean') {
      const g = ctx.createLinearGradient(0, -s, 0, s); g.addColorStop(0, light(c, 0.35)); g.addColorStop(1, dark(c, 0.45));
      ctx.beginPath(); ctx.moveTo(-s, 0); ctx.bezierCurveTo(-s * 0.9, -s * 0.9, s * 0.9, -s * 0.9, s, 0); ctx.bezierCurveTo(s * 0.9, s * 0.8, -s * 0.9, s * 0.8, -s, 0); ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.ellipse(-s * 0.15, -s * 0.28, s * 0.4, s * 0.14, -0.2, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
    } else { // nut / seed: glossy oval
      const g = ctx.createRadialGradient(-s * 0.3, -s * 0.4, s * 0.1, 0, 0, s * 1.2); g.addColorStop(0, light(c, 0.55)); g.addColorStop(0.5, c); g.addColorStop(1, dark(c, 0.5));
      ctx.beginPath(); ctx.ellipse(0, 0, s * 1.08, s * 0.82, 0, 0, TAU); ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.ellipse(-s * 0.3, -s * 0.34, s * 0.42, s * 0.18, -0.4, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.42)'; ctx.fill();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- pieces
  const shadow = (ctx, x, y, r, k = 1) => { ctx.beginPath(); ctx.ellipse(x + r * 0.14, y + r * 0.26, r * 1.02 * k, r * 0.82 * k, 0, 0, TAU); ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fill(); };
  function stone(ctx, x, y, r, c, seedKey, o) {
    const rs = mulberry(hash(seedKey)), pts = 14, rx = r * 0.98, ry = r * 0.86;
    shadow(ctx, x, y, r * 0.95, 1.02);
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) { const a = (i / pts) * TAU, k = 1 + (rs() - 0.5) * 0.09; const px = x + Math.cos(a) * rx * k, py = y + Math.sin(a) * ry * k; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.closePath();
    const g = ctx.createRadialGradient(x - rx * 0.4, y - ry * 0.5, r * 0.1, x, y, r * 1.1); g.addColorStop(0, light(c, 0.5)); g.addColorStop(0.5, c); g.addColorStop(1, dark(c, 0.5));
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = Math.max(1, r * 0.05); ctx.strokeStyle = rgba('#000000', 0.35); ctx.stroke();
    for (let k = 0; k < 7; k++) { ctx.fillStyle = rgba(rs() > 0.5 ? '#ffffff' : '#000000', 0.18); const a = rs() * TAU, d = rs() * 0.7; ctx.beginPath(); ctx.arc(x + Math.cos(a) * rx * d, y + Math.sin(a) * ry * d, Math.max(0.8, r * 0.05 * (0.5 + rs())), 0, TAU); ctx.fill(); }
    if (o.vein) { ctx.strokeStyle = rgba(o.vein, 0.55); ctx.lineWidth = Math.max(1, r * 0.06); ctx.beginPath(); ctx.moveTo(x - rx * 0.7, y + ry * 0.1); ctx.quadraticCurveTo(x, y - ry * 0.5, x + rx * 0.7, y - ry * 0.05); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(x - rx * 0.32, y - ry * 0.42, rx * 0.34, ry * 0.18, -0.5, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.32)'; ctx.fill();
  }
  function disc(ctx, x, y, r, c, o, label) {
    const th = r * 0.2, rad = r * 0.86;
    shadow(ctx, x, y + th * 0.5, r * 0.96);
    ctx.beginPath(); ctx.ellipse(x, y + th, rad, rad * 0.97, 0, 0, TAU); ctx.fillStyle = dark(c, 0.55); ctx.fill();
    const g = ctx.createRadialGradient(x - rad * 0.35, y - rad * 0.4, rad * 0.1, x, y, rad * 1.1); g.addColorStop(0, light(c, 0.5)); g.addColorStop(0.55, c); g.addColorStop(1, dark(c, 0.3));
    ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = rgba('#000000', 0.4); ctx.stroke();
    ctx.lineWidth = Math.max(1, r * 0.04);
    for (const k of [0.82, 0.62]) { ctx.beginPath(); ctx.arc(x, y, rad * k, 0, TAU); ctx.strokeStyle = rgba('#000000', 0.22); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y + 1, rad * k, 0.1, Math.PI - 0.1); ctx.strokeStyle = rgba('#ffffff', 0.16); ctx.stroke(); }
    if (o.ring) { ctx.beginPath(); ctx.arc(x, y, rad * 0.9, 0, TAU); ctx.strokeStyle = o.ring; ctx.lineWidth = Math.max(1.5, r * 0.07); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(x - rad * 0.3, y - rad * 0.42, rad * 0.35, rad * 0.16, -0.5, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill();
  }
  function bead(ctx, x, y, r, c, ring) {
    shadow(ctx, x, y, r);
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.05); g.addColorStop(0, light(c, 0.55)); g.addColorStop(0.45, c); g.addColorStop(1, dark(c, 0.45));
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = g; ctx.fill();
    if (ring) { ctx.lineWidth = Math.max(1.5, r * 0.1); ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(x - r * 0.28, y - r * 0.4, r * 0.4, r * 0.22, -0.5, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
  }
  function coin(ctx, x, y, r, c) {
    shadow(ctx, x, y, r * 0.9);
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); g.addColorStop(0, light(c, 0.55)); g.addColorStop(0.55, c); g.addColorStop(1, dark(c, 0.45));
    ctx.beginPath(); ctx.arc(x, y, r * 0.86, 0, TAU); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = rgba('#000000', 0.4); ctx.lineWidth = 1.2; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * 0.7, 0, TAU); ctx.strokeStyle = rgba('#000000', 0.25); ctx.lineWidth = 1; ctx.stroke();
    const q = r * 0.2; ctx.fillStyle = rgba('#000000', 0.78); ctx.fillRect(x - q, y - q, q * 2, q * 2); ctx.strokeStyle = rgba('#ffffff', 0.25); ctx.strokeRect(x - q, y - q, q * 2, q * 2);
  }
  function cone(ctx, x, y, r, c) {   // turned pawn / peg seen from the front-top
    shadow(ctx, x, y + r * 0.1, r * 0.9);
    const h = r * 1.5, bw = r * 0.84;
    const side = ctx.createLinearGradient(x - bw, 0, x + bw, 0); side.addColorStop(0, dark(c, 0.35)); side.addColorStop(0.35, light(c, 0.35)); side.addColorStop(1, dark(c, 0.5));
    ctx.beginPath(); ctx.ellipse(x, y + r * 0.62, bw, bw * 0.36, 0, 0, TAU); ctx.fillStyle = dark(c, 0.5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - bw, y + r * 0.62); ctx.bezierCurveTo(x - bw * 0.9, y + r * 0.1, x - bw * 0.3, y - r * 0.1, x - bw * 0.28, y - r * 0.5); ctx.lineTo(x + bw * 0.28, y - r * 0.5); ctx.bezierCurveTo(x + bw * 0.3, y - r * 0.1, x + bw * 0.9, y + r * 0.1, x + bw, y + r * 0.62); ctx.closePath(); ctx.fillStyle = side; ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y + r * 0.62, bw, bw * 0.36, 0, 0, Math.PI); ctx.fillStyle = side; ctx.fill();
    const hg = ctx.createRadialGradient(x - r * 0.2, y - r * 0.9, r * 0.05, x, y - r * 0.7, r * 0.55); hg.addColorStop(0, light(c, 0.65)); hg.addColorStop(0.55, c); hg.addColorStop(1, dark(c, 0.45));
    ctx.beginPath(); ctx.arc(x, y - r * 0.68, r * 0.46, 0, TAU); ctx.fillStyle = hg; ctx.fill();
    void h;
  }
  function bug(ctx, x, y, r, c, rot = 0) {   // water bug for lake-board games
    shadow(ctx, x, y, r * 0.8);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.strokeStyle = dark(c, 0.5); ctx.lineWidth = Math.max(1.5, r * 0.09); ctx.lineCap = 'round';
    for (const [lx, ly] of [[-0.9, -0.7], [-1, 0], [-0.9, 0.7], [0.9, -0.7], [1, 0], [0.9, 0.7]]) { ctx.beginPath(); ctx.moveTo(lx * r * 0.25, ly * r * 0.2); ctx.quadraticCurveTo(lx * r * 0.7, ly * r * 0.9, lx * r * 0.95, ly * r * 0.55); ctx.stroke(); }
    const g = ctx.createRadialGradient(-r * 0.2, -r * 0.3, r * 0.05, 0, 0, r * 0.9); g.addColorStop(0, light(c, 0.55)); g.addColorStop(0.5, c); g.addColorStop(1, dark(c, 0.5));
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.62, r * 0.48, 0, 0, TAU); ctx.fillStyle = g; ctx.fill(); ctx.beginPath(); ctx.arc(r * 0.55, 0, r * 0.22, 0, TAU); ctx.fillStyle = dark(c, 0.3); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-r * 0.3, 0); ctx.lineTo(r * 0.3, 0); ctx.strokeStyle = rgba('#000000', 0.3); ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }


  function peg(ctx, x, y, r, c, head) {
    shadow(ctx, x, y + r * 0.1, r * 0.8);
    const bw = r * 0.55, top = y - r * 0.2;
    const side = ctx.createLinearGradient(x - bw, 0, x + bw, 0); side.addColorStop(0, dark(c, 0.4)); side.addColorStop(0.35, light(c, 0.4)); side.addColorStop(1, dark(c, 0.5));
    ctx.beginPath(); ctx.ellipse(x, y + r * 0.62, bw, bw * 0.34, 0, 0, TAU); ctx.fillStyle = dark(c, 0.5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - bw, y + r * 0.62); ctx.lineTo(x - bw * 0.8, top); ctx.lineTo(x + bw * 0.8, top); ctx.lineTo(x + bw, y + r * 0.62); ctx.closePath(); ctx.fillStyle = side; ctx.fill(); ctx.strokeStyle = rgba('#000000', 0.4); ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y + r * 0.62, bw, bw * 0.34, 0, 0, Math.PI); ctx.fillStyle = side; ctx.fill();
    const hc = light(c, 0.15), hx = x, hy = top - r * 0.12;
    const hg = ctx.createLinearGradient(hx - r * 0.5, 0, hx + r * 0.5, 0); hg.addColorStop(0, light(c, 0.45)); hg.addColorStop(1, dark(c, 0.35));
    ctx.fillStyle = hg; ctx.strokeStyle = rgba('#000000', 0.45); ctx.lineWidth = Math.max(1, r * 0.04);
    ctx.beginPath();
    if (head === 'jackal') { ctx.moveTo(hx - r * 0.36, top); ctx.lineTo(hx - r * 0.34, hy - r * 0.2); ctx.lineTo(hx - r * 0.2, hy - r * 0.62); ctx.lineTo(hx - r * 0.06, hy - r * 0.26); ctx.lineTo(hx + r * 0.12, hy - r * 0.26); ctx.lineTo(hx + r * 0.2, hy - r * 0.64); ctx.lineTo(hx + r * 0.34, hy - r * 0.2); ctx.lineTo(hx + r * 0.62, hy + r * 0.02); ctx.lineTo(hx + r * 0.32, hy + r * 0.12); ctx.lineTo(hx + r * 0.32, top); }
    else { ctx.moveTo(hx - r * 0.38, top); ctx.lineTo(hx - r * 0.4, hy - r * 0.15); ctx.bezierCurveTo(hx - r * 0.42, hy - r * 0.55, hx - r * 0.1, hy - r * 0.55, hx, hy - r * 0.3); ctx.lineTo(hx + r * 0.2, hy - r * 0.3); ctx.lineTo(hx + r * 0.6, hy); ctx.lineTo(hx + r * 0.3, hy + r * 0.14); ctx.lineTo(hx + r * 0.3, top); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(hx + r * 0.16, hy - r * 0.08, Math.max(1.2, r * 0.05), 0, TAU); ctx.fillStyle = rgba('#ffffff', 0.9); ctx.fill();
    void hc;
  }
  function bird(ctx, x, y, r, c, st) {
    shadow(ctx, x, y + r * 0.2, r * 0.8);
    ctx.save(); ctx.translate(x, y);
    const g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, light(c, 0.4)); g.addColorStop(1, dark(c, 0.45));
    ctx.fillStyle = g; ctx.strokeStyle = rgba('#000000', 0.5); ctx.lineWidth = Math.max(1, r * 0.04);
    if (st === 'vulture') {
      ctx.beginPath(); ctx.moveTo(0, -r * 0.1); ctx.bezierCurveTo(-r * 0.5, -r * 0.7, -r * 1.1, -r * 0.5, -r * 1.2, r * 0.1); ctx.lineTo(-r * 0.9, r * 0.02); ctx.lineTo(-r * 0.8, r * 0.2); ctx.lineTo(-r * 0.5, r * 0.1); ctx.lineTo(-r * 0.3, r * 0.5); ctx.lineTo(0, r * 0.7); ctx.lineTo(r * 0.3, r * 0.5); ctx.lineTo(r * 0.5, r * 0.1); ctx.lineTo(r * 0.8, r * 0.2); ctx.lineTo(r * 0.9, r * 0.02); ctx.lineTo(r * 1.2, r * 0.1); ctx.bezierCurveTo(r * 1.1, -r * 0.5, r * 0.5, -r * 0.7, 0, -r * 0.1); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -r * 0.28, r * 0.2, 0, TAU); ctx.fillStyle = '#d9a07a'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.05, -r * 0.2); ctx.lineTo(0, -r * 0.02); ctx.lineTo(r * 0.06, -r * 0.2); ctx.fillStyle = '#3a2a1a'; ctx.fill();
    } else {
      ctx.beginPath(); ctx.ellipse(0, r * 0.1, r * 0.6, r * 0.42, -0.2, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.5, r * 0.18); ctx.lineTo(-r * 0.95, r * 0.5); ctx.lineTo(-r * 0.6, r * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(r * 0.5, -r * 0.25, r * 0.26, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r * 0.72, -r * 0.3); ctx.lineTo(r * 1.05, -r * 0.2); ctx.lineTo(r * 0.72, -r * 0.14); ctx.closePath(); ctx.fillStyle = '#c9a23a'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(r * 0.56, -r * 0.3, Math.max(1.2, r * 0.05), 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-r * 0.1, r * 0.05); ctx.quadraticCurveTo(-r * 0.3, -r * 0.35, r * 0.2, -r * 0.1); ctx.strokeStyle = rgba('#ffffff', 0.25); ctx.lineWidth = Math.max(1.5, r * 0.09); ctx.stroke();
    }
    ctx.restore();
  }

  // chess-family silhouettes: turned pedestal + a figure path, lit from the left, drawn at height h above the foot
  function figure(ctx, kind, x, y, r, c, accent) {
    const w = r * 0.88, top = y - r * 1.12, foot = y + r * 0.74;
    shadow(ctx, x, y + r * 0.34, r * 0.94, 0.95);
    const g = ctx.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, dark(c, 0.38)); g.addColorStop(0.32, light(c, 0.42)); g.addColorStop(0.6, c); g.addColorStop(1, dark(c, 0.5));
    const fillShape = (fn) => { ctx.beginPath(); fn(); ctx.closePath(); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = Math.max(1, r * 0.04); ctx.strokeStyle = rgba('#000000', 0.45); ctx.stroke(); };
    // pedestal
    const ped = () => { ctx.ellipse(x, foot - r * 0.08, w * 0.96, r * 0.2, 0, 0, TAU); };
    fillShape(ped);
    fillShape(() => { ctx.moveTo(x - w * 0.82, foot - r * 0.12); ctx.lineTo(x - w * 0.82, foot - r * 0.3); ctx.quadraticCurveTo(x, foot - r * 0.44, x + w * 0.82, foot - r * 0.3); ctx.lineTo(x + w * 0.82, foot - r * 0.12); ctx.quadraticCurveTo(x, foot + r * 0.12, x - w * 0.82, foot - r * 0.12); });
    const bodyBase = foot - r * 0.3, H = bodyBase - top;
    const stem = (wb, wt, ht) => { ctx.moveTo(x - wb, bodyBase); ctx.bezierCurveTo(x - wb * 0.8, bodyBase - H * 0.3, x - wt, bodyBase - H * 0.4, x - wt, bodyBase - H * ht); ctx.lineTo(x + wt, bodyBase - H * ht); ctx.bezierCurveTo(x + wt, bodyBase - H * 0.4, x + wb * 0.8, bodyBase - H * 0.3, x + wb, bodyBase); };
    const k = kind;
    if (k === 'pawn') {
      fillShape(() => stem(w * 0.7, w * 0.26, 0.6)); fillShape(() => { ctx.ellipse(x, bodyBase - H * 0.6, w * 0.46, r * 0.14, 0, 0, TAU); });
      const hg = ctx.createRadialGradient(x - w * 0.2, bodyBase - H * 0.86, w * 0.05, x, bodyBase - H * 0.8, w * 0.5); hg.addColorStop(0, light(c, 0.6)); hg.addColorStop(0.55, c); hg.addColorStop(1, dark(c, 0.5));
      ctx.beginPath(); ctx.arc(x, bodyBase - H * 0.78, w * 0.42, 0, TAU); ctx.fillStyle = hg; ctx.fill(); ctx.strokeStyle = rgba('#000000', 0.4); ctx.stroke();
    } else if (k === 'rook') {
      fillShape(() => stem(w * 0.74, w * 0.5, 0.72));
      fillShape(() => { const yb = bodyBase - H * 0.72, yt = bodyBase - H * 1.0, ww = w * 0.74; ctx.moveTo(x - ww, yb); ctx.lineTo(x - ww, yt); ctx.lineTo(x - ww * 0.55, yt); ctx.lineTo(x - ww * 0.55, yt + H * 0.1); ctx.lineTo(x - ww * 0.18, yt + H * 0.1); ctx.lineTo(x - ww * 0.18, yt); ctx.lineTo(x + ww * 0.18, yt); ctx.lineTo(x + ww * 0.18, yt + H * 0.1); ctx.lineTo(x + ww * 0.55, yt + H * 0.1); ctx.lineTo(x + ww * 0.55, yt); ctx.lineTo(x + ww, yt); ctx.lineTo(x + ww, yb); });
    } else if (k === 'bishop') {
      fillShape(() => stem(w * 0.72, w * 0.28, 0.58));
      ctx.beginPath(); ctx.moveTo(x - w * 0.5, bodyBase - H * 0.58); ctx.bezierCurveTo(x - w * 0.62, bodyBase - H * 0.8, x - w * 0.2, bodyBase - H * 0.92, x, bodyBase - H * 1.02); ctx.bezierCurveTo(x + w * 0.2, bodyBase - H * 0.92, x + w * 0.62, bodyBase - H * 0.8, x + w * 0.5, bodyBase - H * 0.58); ctx.closePath(); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = rgba('#000000', 0.45); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - w * 0.12, bodyBase - H * 0.88); ctx.lineTo(x + w * 0.18, bodyBase - H * 0.7); ctx.strokeStyle = rgba('#000000', 0.55); ctx.lineWidth = Math.max(1.5, r * 0.08); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, bodyBase - H * 1.05, w * 0.12, 0, TAU); ctx.fillStyle = accent ?? light(c, 0.5); ctx.fill();
    } else if (k === 'queen') {
      fillShape(() => stem(w * 0.76, w * 0.3, 0.7));
      fillShape(() => { const yb = bodyBase - H * 0.66, ww = w * 0.62; ctx.moveTo(x - ww * 0.5, yb); for (let i = 0; i < 5; i++) { const px = x - ww + (i * ww * 2) / 4; ctx.lineTo(px, bodyBase - H * (i % 2 ? 0.88 : 1.0)); } ctx.lineTo(x + ww * 0.5, yb); });
      for (const i of [0, 2, 4]) { ctx.beginPath(); ctx.arc(x - w * 0.62 + (i * w * 1.24) / 4, bodyBase - H * 1.04, w * 0.09, 0, TAU); ctx.fillStyle = accent ?? light(c, 0.55); ctx.fill(); }
    } else if (k === 'king') {
      fillShape(() => stem(w * 0.78, w * 0.32, 0.72));
      fillShape(() => { const yb = bodyBase - H * 0.68, ww = w * 0.58; ctx.moveTo(x - ww, yb); ctx.quadraticCurveTo(x - ww * 1.05, bodyBase - H * 0.92, x - ww * 0.5, bodyBase - H * 0.96); ctx.lineTo(x + ww * 0.5, bodyBase - H * 0.96); ctx.quadraticCurveTo(x + ww * 1.05, bodyBase - H * 0.92, x + ww, yb); });
      ctx.beginPath(); ctx.arc(x, bodyBase - H * 1.02, w * 0.17, 0, TAU); ctx.fillStyle = accent ?? light(c, 0.6); ctx.fill(); ctx.strokeStyle = rgba('#000000', 0.4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - w * 0.14, bodyBase - H * 0.78); ctx.lineTo(x + w * 0.14, bodyBase - H * 0.78); ctx.strokeStyle = accent ?? light(c, 0.6); ctx.lineWidth = Math.max(1.5, r * 0.07); ctx.stroke();
    } else if (k === 'knight') {
      fillShape(() => stem(w * 0.74, w * 0.5, 0.42));
      fillShape(() => { const b = bodyBase - H * 0.4; ctx.moveTo(x - w * 0.62, b); ctx.bezierCurveTo(x - w * 0.7, b - H * 0.3, x - w * 0.5, b - H * 0.6, x - w * 0.1, bodyBase - H * 0.98); ctx.lineTo(x + w * 0.05, bodyBase - H * 1.08); ctx.lineTo(x + w * 0.2, bodyBase - H * 0.96); ctx.bezierCurveTo(x + w * 0.5, bodyBase - H * 0.92, x + w * 0.86, bodyBase - H * 0.74, x + w * 0.92, bodyBase - H * 0.62); ctx.quadraticCurveTo(x + w * 0.8, bodyBase - H * 0.56, x + w * 0.5, bodyBase - H * 0.62); ctx.quadraticCurveTo(x + w * 0.3, bodyBase - H * 0.6, x + w * 0.3, bodyBase - H * 0.4); ctx.lineTo(x + w * 0.62, b); });
      ctx.beginPath(); ctx.arc(x + w * 0.2, bodyBase - H * 0.8, Math.max(1.4, r * 0.06), 0, TAU); ctx.fillStyle = rgba('#000000', 0.8); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - w * 0.12, bodyBase - H * 0.96); ctx.quadraticCurveTo(x - w * 0.4, bodyBase - H * 0.7, x - w * 0.46, bodyBase - H * 0.45); ctx.strokeStyle = rgba('#000000', 0.35); ctx.lineWidth = Math.max(1.5, r * 0.08); ctx.stroke();
    } else if (k === 'elephant') {
      fillShape(() => stem(w * 0.78, w * 0.62, 0.42));
      fillShape(() => { const b = bodyBase - H * 0.4; ctx.moveTo(x - w * 0.72, b); ctx.bezierCurveTo(x - w * 0.8, b - H * 0.35, x - w * 0.4, bodyBase - H * 0.98, x + w * 0.1, bodyBase - H * 0.98); ctx.bezierCurveTo(x + w * 0.5, bodyBase - H * 0.98, x + w * 0.62, bodyBase - H * 0.8, x + w * 0.62, bodyBase - H * 0.6); ctx.bezierCurveTo(x + w * 0.62, bodyBase - H * 0.4, x + w * 0.95, bodyBase - H * 0.4, x + w * 0.9, bodyBase - H * 0.2); ctx.lineTo(x + w * 0.66, bodyBase - H * 0.24); ctx.bezierCurveTo(x + w * 0.66, bodyBase - H * 0.5, x + w * 0.34, bodyBase - H * 0.5, x + w * 0.38, bodyBase - H * 0.4); ctx.lineTo(x + w * 0.62, b); });
      ctx.beginPath(); ctx.moveTo(x + w * 0.4, bodyBase - H * 0.58); ctx.quadraticCurveTo(x + w * 0.9, bodyBase - H * 0.6, x + w * 0.86, bodyBase - H * 0.4); ctx.strokeStyle = '#f4efe0'; ctx.lineWidth = Math.max(2, r * 0.1); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + w * 0.22, bodyBase - H * 0.82, Math.max(1.4, r * 0.06), 0, TAU); ctx.fillStyle = rgba('#000000', 0.8); ctx.fill();
    } else if (k === 'camel') {
      fillShape(() => stem(w * 0.74, w * 0.52, 0.4));
      fillShape(() => { const b = bodyBase - H * 0.38; ctx.moveTo(x - w * 0.7, b); ctx.bezierCurveTo(x - w * 0.8, b - H * 0.3, x - w * 0.52, bodyBase - H * 0.8, x - w * 0.3, bodyBase - H * 0.8); ctx.bezierCurveTo(x - w * 0.12, bodyBase - H * 0.8, x - w * 0.1, bodyBase - H * 0.62, x + w * 0.08, bodyBase - H * 0.7); ctx.bezierCurveTo(x + w * 0.2, bodyBase - H * 0.74, x + w * 0.2, bodyBase - H * 0.96, x + w * 0.4, bodyBase - H * 1.04); ctx.lineTo(x + w * 0.7, bodyBase - H * 0.98); ctx.lineTo(x + w * 0.74, bodyBase - H * 0.88); ctx.lineTo(x + w * 0.5, bodyBase - H * 0.8); ctx.bezierCurveTo(x + w * 0.42, bodyBase - H * 0.6, x + w * 0.4, bodyBase - H * 0.5, x + w * 0.5, b); });
      ctx.beginPath(); ctx.arc(x + w * 0.5, bodyBase - H * 0.94, Math.max(1.2, r * 0.05), 0, TAU); ctx.fillStyle = rgba('#000000', 0.8); ctx.fill();
    } else if (k === 'sew') {
      fillShape(() => stem(w * 0.74, w * 0.34, 0.5));
      fillShape(() => { ctx.ellipse(x, bodyBase - H * 0.52, w * 0.5, r * 0.13, 0, 0, TAU); });
      for (const dx of [-0.34, 0, 0.34]) { ctx.beginPath(); ctx.arc(x + w * dx, bodyBase - H * (dx ? 0.72 : 0.8), w * 0.17, 0, TAU); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = rgba('#000000', 0.4); ctx.stroke(); }
    } else if (k === 'negus') {
      fillShape(() => stem(w * 0.78, w * 0.32, 0.66));
      fillShape(() => { const yb = bodyBase - H * 0.64, ww = w * 0.6; ctx.moveTo(x - ww, yb); ctx.quadraticCurveTo(x - ww * 1.05, bodyBase - H * 0.86, x - ww * 0.5, bodyBase - H * 0.9); ctx.lineTo(x + ww * 0.5, bodyBase - H * 0.9); ctx.quadraticCurveTo(x + ww * 1.05, bodyBase - H * 0.86, x + ww, yb); });
      ctx.strokeStyle = accent ?? light(c, 0.6); ctx.lineWidth = Math.max(1.5, r * 0.07); ctx.lineCap = 'round';
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * w * 0.08, bodyBase - H * 0.9); ctx.lineTo(x + i * w * 0.26, bodyBase - H * 1.06); ctx.stroke(); ctx.beginPath(); ctx.arc(x + i * w * 0.26, bodyBase - H * 1.08, w * 0.05, 0, TAU); ctx.fillStyle = accent ?? light(c, 0.6); ctx.fill(); }
    } else if (k === 'khan') {
      fillShape(() => stem(w * 0.78, w * 0.32, 0.7));
      fillShape(() => { const yb = bodyBase - H * 0.66, ww = w * 0.56; ctx.moveTo(x - ww, yb); ctx.lineTo(x - ww * 0.8, bodyBase - H * 0.84); ctx.lineTo(x, bodyBase - H * 1.12); ctx.lineTo(x + ww * 0.8, bodyBase - H * 0.84); ctx.lineTo(x + ww, yb); });
      ctx.beginPath(); ctx.arc(x, bodyBase - H * 1.14, w * 0.1, 0, TAU); ctx.fillStyle = accent ?? light(c, 0.6); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - w * 0.46, bodyBase - H * 0.72); ctx.lineTo(x + w * 0.46, bodyBase - H * 0.72); ctx.strokeStyle = accent ?? light(c, 0.6); ctx.lineWidth = Math.max(1.5, r * 0.07); ctx.stroke();
    } else if (k === 'lion') {
      fillShape(() => stem(w * 0.76, w * 0.36, 0.6));
      const hy = bodyBase - H * 0.8, mr = w * 0.62;
      ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU, rad = mr * (i % 2 ? 0.8 : 1.02); ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rad, hy + Math.sin(a) * rad * 0.95); } ctx.closePath(); ctx.fillStyle = dark(c, 0.25); ctx.fill(); ctx.strokeStyle = rgba('#000000', 0.45); ctx.lineWidth = Math.max(1, r * 0.04); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, hy + w * 0.04, w * 0.4, 0, TAU); ctx.fillStyle = g; ctx.fill(); ctx.stroke();
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(x + sx * w * 0.14, hy - w * 0.02, Math.max(1.2, r * 0.05), 0, TAU); ctx.fillStyle = rgba('#000000', 0.85); ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(x - w * 0.08, hy + w * 0.12); ctx.lineTo(x + w * 0.08, hy + w * 0.12); ctx.lineTo(x, hy + w * 0.2); ctx.closePath(); ctx.fillStyle = rgba('#000000', 0.7); ctx.fill();
    } else { fillShape(() => stem(w * 0.7, w * 0.3, 0.8)); }
    // specular strip
    ctx.beginPath(); ctx.moveTo(x - w * 0.34, bodyBase - H * 0.1); ctx.quadraticCurveTo(x - w * 0.3, bodyBase - H * 0.5, x - w * 0.2, bodyBase - H * 0.68); ctx.strokeStyle = 'rgba(255,255,255,0.26)'; ctx.lineWidth = Math.max(1.5, r * 0.09); ctx.lineCap = 'round'; ctx.stroke();
  }

  function pieceStyle(owner, kind, d) {
    const spec = P[owner === 1 ? 1 : 0], col = spec.color ?? (owner === 1 ? pal.p1 : pal.p0);
    return { spec, col };
  }
  function piece(ctx, x, y, r, owner, kind, label, nodeId, countBadge) {
    const { spec, col } = pieceStyle(owner, kind), ck = canonicalKind(kind, LK.kindMap), st = spec.style ?? 'bead';
    const useFigure = (st === 'figure' || spec.figures) && ck && FIGURE_KINDS.has(ck);
    if (useFigure) figure(ctx, ck, x, y, r * (spec.scale ?? 1), col, spec.accent);
    else if (st === 'stone') stone(ctx, x, y, r * 0.86 * (spec.scale ?? 1), col, `${owner}${nodeId ? hash(nodeId) % 3 : 0}`, spec);
    else if (st === 'disc') disc(ctx, x, y, r * 0.92 * (spec.scale ?? 1), col, spec, label);
    else if (st === 'coin') coin(ctx, x, y, r * 0.95 * (spec.scale ?? 1), col);
    else if (st === 'cone' || st === 'pawn') cone(ctx, x, y, r * 0.9 * (spec.scale ?? 1), col);
    else if (st === 'peg') peg(ctx, x, y, r * 0.95 * (spec.scale ?? 1), col, spec.head ?? ((nodeId && owner === 1) ? 'jackal' : 'hound'));
    else if (st === 'crow' || st === 'vulture') bird(ctx, x, y, r * 0.92 * (spec.scale ?? 1), col, st);
    else if (st === 'bug') bug(ctx, x, y, r * 0.95 * (spec.scale ?? 1), col, owner === 1 ? Math.PI : 0);
    else if (st === 'cowrie') seed(ctx, 'cowrie', x, y, r * 0.8 * (spec.scale ?? 1), col, owner * 0.6);
    else bead(ctx, x, y, r * 0.78 * (spec.scale ?? 1), col, spec.ring !== false);
    if (kind === 'king' && !useFigure && st !== 'figure') { ctx.beginPath(); ctx.arc(x, y, r * 0.4, 0, TAU); ctx.strokeStyle = pal.accent; ctx.lineWidth = 3; ctx.stroke(); }
    if (label && !useFigure && spec.labels !== false) {
      ctx.fillStyle = spec.labelColor ?? '#fff'; ctx.font = `700 ${Math.round(r * 0.9)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(label), x, y + r * 0.03);
    }
    void countBadge;
  }

  return { ground, body, lines, node, seeds, piece, spec: LK, hasFigures: P.some((p) => p.style === 'figure' || p.figures) };
}

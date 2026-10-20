// shape-craft 1.15.0: workshops and profiles for turned and painted folk dolls (lathe, `vessel: 'fine'`, `dome`, `still`, `deco`). Dolls are objects:
// each workshop has its own wall, floor, light, dock and palette and shows a shelf of finished dolls of its own tradition.
import { registerSceneSet, registerProfile } from './registry.js';
import { hash } from './geom.js';
import { tint, rgba, mix, rrect } from './fx.js';
import { lg, rg, ell, cast, TAU } from './props.js';

// ---- profiles (bottom to top, 12 rows) ----------------------------------------------------------------------------------------------------
registerProfile('tsuchiyu', [0.44, 0.48, 0.5, 0.5, 0.48, 0.46, 0.44, 0.4, 0.34, 0.3, 0.66, 0.78, 0.74, 0.58]);   // slim body, long neck, big round head (Tsuchiyu)
registerProfile('daruma', [0.46, 0.7, 0.88, 0.98, 1, 0.98, 0.94, 0.86, 0.74, 0.6, 0.5]);                          // a round egg, widest in the lower third (Takasaki)
registerProfile('peg', [0.52, 0.55, 0.56, 0.55, 0.52, 0.47, 0.4, 0.34, 0.3, 0.46, 0.62, 0.6]);                  // turned doll: bell skirt, narrow waist, small round head (Val Gardena)
registerProfile('nutcracker', [0.62, 0.64, 0.52, 0.5, 0.52, 0.58, 0.64, 0.68, 0.7, 0.4, 0.58, 0.6, 0.66, 0.5, 0.46, 0.48]);   // boots, slim legs, a coat that widens to the shoulders, a neck, a head, a tall hat with a brim (Erzgebirge)
registerProfile('kokeshi', [0.5, 0.54, 0.56, 0.56, 0.55, 0.52, 0.48, 0.36, 0.64, 0.8, 0.8, 0.62]);   // straight body, slim neck, round head (Naruko)

// a small finished doll for the wall shelf: body, head, hair cap, a colour band and a ring of red
function miniKokeshi(ctx, x, y, h, c, hair, red) {
  const bw = h * 0.2, hr = h * 0.17;
  cast(ctx, x + h * 0.05, y, bw * 1.5, h * 0.04, 0.35);
  ctx.beginPath(); ctx.moveTo(x - bw, y); ctx.lineTo(x - bw * 1.05, y - h * 0.62); ctx.lineTo(x - bw * 0.5, y - h * 0.7); ctx.lineTo(x + bw * 0.5, y - h * 0.7); ctx.lineTo(x + bw * 1.05, y - h * 0.62); ctx.lineTo(x + bw, y); ctx.closePath();
  ctx.fillStyle = lg(ctx, x - bw, 0, x + bw, 0, [[0, tint(c, -0.45)], [0.3, tint(c, 0.2)], [1, tint(c, -0.55)]]); ctx.fill();
  ctx.fillStyle = red; ctx.fillRect(x - bw * 1.02, y - h * 0.18, bw * 2.04, h * 0.05); ctx.fillRect(x - bw * 1.04, y - h * 0.5, bw * 2.08, h * 0.04);
  ell(ctx, x, y - h * 0.3, bw * 0.46, bw * 0.46); ctx.fillStyle = red; ctx.fill();
  const hy = y - h * 0.84;
  ctx.fillStyle = lg(ctx, x - hr, 0, x + hr, 0, [[0, tint(c, -0.4)], [0.35, tint(c, 0.25)], [1, tint(c, -0.5)]]); ell(ctx, x, hy, hr, hr); ctx.fill();
  ctx.save(); ell(ctx, x, hy, hr, hr); ctx.clip(); ctx.fillStyle = hair; ctx.fillRect(x - hr, hy - hr, hr * 2, hr * 1.05); ctx.fillRect(x - hr, hy - hr * 0.1, hr * 0.3, hr * 1.1); ctx.fillRect(x + hr * 0.7, hy - hr * 0.1, hr * 0.3, hr * 1.1); ctx.restore();
}

function miniDaruma(ctx, x, y, h, c, gold) {
  const w = h * 0.36; cast(ctx, x + h * 0.04, y, w * 1.2, h * 0.05, 0.35);
  ctx.beginPath(); ctx.moveTo(x - w * 0.6, y); ctx.bezierCurveTo(x - w * 1.25, y - h * 0.3, x - w * 1.0, y - h * 0.95, x, y - h); ctx.bezierCurveTo(x + w * 1.0, y - h * 0.95, x + w * 1.25, y - h * 0.3, x + w * 0.6, y); ctx.closePath();
  ctx.fillStyle = lg(ctx, x - w, 0, x + w, 0, [[0, tint(c, -0.5)], [0.3, tint(c, 0.2)], [1, tint(c, -0.55)]]); ctx.fill();
  ctx.fillStyle = '#f7efe2'; ctx.beginPath(); ctx.ellipse(x, y - h * 0.66, w * 0.62, h * 0.2, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = gold; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = '#14100e'; for (const sx of [-1, 1]) { ctx.fillRect(x + sx * w * 0.3 - w * 0.12, y - h * 0.74, w * 0.24, h * 0.025); ctx.beginPath(); ctx.arc(x + sx * w * 0.3, y - h * 0.65, h * 0.02, 0, TAU); ctx.fill(); }
}
function miniPeg(ctx, x, y, h, dress, red) {
  const w = h * 0.2; cast(ctx, x + h * 0.04, y, w * 1.4, h * 0.04, 0.35);
  ctx.beginPath(); ctx.moveTo(x - w * 1.1, y); ctx.lineTo(x - w * 0.45, y - h * 0.6); ctx.lineTo(x + w * 0.45, y - h * 0.6); ctx.lineTo(x + w * 1.1, y); ctx.closePath();
  ctx.fillStyle = lg(ctx, x - w, 0, x + w, 0, [[0, tint(dress, -0.45)], [0.3, tint(dress, 0.2)], [1, tint(dress, -0.5)]]); ctx.fill();
  ctx.fillStyle = '#f6efe0'; ctx.beginPath(); ctx.moveTo(x - w * 0.5, y - h * 0.5); ctx.lineTo(x + w * 0.5, y - h * 0.5); ctx.lineTo(x + w * 0.75, y - h * 0.06); ctx.lineTo(x - w * 0.75, y - h * 0.06); ctx.closePath(); ctx.fill();
  const hy = y - h * 0.74; ctx.fillStyle = '#f3d4b0'; ell(ctx, x, hy, w * 0.55, w * 0.58); ctx.fill(); ctx.fillStyle = red; ctx.beginPath(); ctx.arc(x, hy - w * 0.05, w * 0.6, Math.PI, 0); ctx.fill();
}

// ---- walls --------------------------------------------------------------------------------------------------------------------------------
const walls = {
  onsen(ctx, s, r, H, t) { // Naruko: a dark cedar-board wall of a hot-spring inn, a snowy window with steam, a shelf of finished dolls
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.08)], [1, tint(s.wallC, -0.25)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let x = r.x; x < r.x + r.w; x += 26) { ctx.strokeStyle = 'rgba(0,0,0,0.38)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + H); ctx.stroke(); ctx.strokeStyle = 'rgba(255,225,180,0.06)'; ctx.beginPath(); ctx.moveTo(x + 2, r.y); ctx.lineTo(x + 2, r.y + H); ctx.stroke(); }
    for (let k = 0; k < 40; k++) { ctx.fillStyle = `rgba(0,0,0,${0.05 + 0.07 * hash(k, 3)})`; const x = r.x + r.w * hash(k, 1), y = r.y + H * hash(k, 2); ctx.fillRect(x, y, 1.5, 6 + 20 * hash(k, 4)); }
    // shoji window with a snowy ridge and steam
    const wx = r.x + r.w * 0.06, ww = r.w * 0.34, wy = r.y + H * 0.14, wh = H * 0.52;
    ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#c7d6e6'], [1, '#f3f1ea']]); ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = '#f9fbff'; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + wh * 0.62); ctx.lineTo(wx + ww * 0.3, wy + wh * 0.38); ctx.lineTo(wx + ww * 0.5, wy + wh * 0.55); ctx.lineTo(wx + ww * 0.78, wy + wh * 0.3); ctx.lineTo(wx + ww, wy + wh * 0.6); ctx.lineTo(wx + ww, wy + wh); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(120,150,180,0.35)'; ctx.beginPath(); ctx.moveTo(wx + ww * 0.3, wy + wh * 0.38); ctx.lineTo(wx + ww * 0.5, wy + wh * 0.55); ctx.lineTo(wx + ww * 0.36, wy + wh * 0.6); ctx.closePath(); ctx.fill();
    for (let k = 0; k < 3; k++) { const sx = wx + ww * (0.25 + 0.25 * k), ph = (t * 0.25 + k * 0.33) % 1; ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - ph)})`; ell(ctx, sx + Math.sin(ph * 6) * 5, wy + wh * (0.95 - ph * 0.6), ww * 0.1 * (1 + ph), ww * 0.05 * (1 + ph)); ctx.fill(); }
    ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 4; ctx.strokeRect(wx, wy, ww, wh);
    ctx.lineWidth = 2; for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(wx + (ww * k) / 3, wy); ctx.lineTo(wx + (ww * k) / 3, wy + wh); ctx.stroke(); } for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(wx, wy + (wh * k) / 4); ctx.lineTo(wx + ww, wy + (wh * k) / 4); ctx.stroke(); }
    // shelf of finished dolls
    const sx0 = r.x + r.w * 0.48, sx1 = r.x + r.w * 0.97, sy = r.y + H * 0.72;
    ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 8, [[0, '#b58452'], [1, '#4a2c16']]); ctx.fillRect(sx0 - 6, sy, sx1 - sx0 + 12, 8);
    const n = Math.max(3, Math.min(7, Math.round((sx1 - sx0) / 38))), cols = ['#ecd09c', '#e3c286', '#f0d8aa', '#dcb878'];
    for (let k = 0; k < n; k++) miniKokeshi(ctx, sx0 + ((sx1 - sx0) * (k + 0.5)) / n, sy, H * (0.5 + 0.1 * hash(k, 8)), cols[k % 4], '#17110f', k % 2 ? '#c4302b' : '#2f7a46');
  },
  yuya(ctx, s, r, H, t) { // Tsuchiyu: an indigo bath-house curtain with a white mark, a paper lantern, snow-laden cedars and rising steam
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, '#10162e'], [1, tint(s.wallC, -0.2)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let k = 0; k < 30; k++) { ctx.fillStyle = `rgba(255,255,255,${0.2 + 0.5 * hash(k, 7)})`; ctx.fillRect(r.x + r.w * hash(k, 1), r.y + H * 0.34 * hash(k, 2), 1.5, 1.5); }
    // snowy cedars
    for (let k = 0; k < 7; k++) { const x = r.x + r.w * (0.05 + 0.14 * k) + hash(k, 3) * 10, hh = H * (0.35 + 0.15 * hash(k, 4)), y = r.y + H * 0.62; ctx.fillStyle = '#0c1a1a'; ctx.beginPath(); ctx.moveTo(x, y - hh); for (let q = 1; q <= 4; q++) { ctx.lineTo(x + hh * 0.08 * q + 4, y - hh + q * hh * 0.22); ctx.lineTo(x + hh * 0.04 * q, y - hh + q * hh * 0.22); } ctx.lineTo(x, y); ctx.lineTo(x - hh * 0.04 * 4, y - hh * 0.2); for (let q = 4; q >= 1; q--) { ctx.lineTo(x - hh * 0.04 * q, y - hh + q * hh * 0.22); ctx.lineTo(x - hh * 0.08 * q - 4, y - hh + q * hh * 0.22); } ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(240,248,255,0.55)'; ctx.beginPath(); ctx.moveTo(x, y - hh); ctx.lineTo(x + hh * 0.14, y - hh * 0.55); ctx.lineTo(x - hh * 0.14, y - hh * 0.55); ctx.fill(); }
    // curtain panels (noren) hanging from a pole
    ctx.fillStyle = '#4a3320'; ctx.fillRect(r.x, r.y + H * 0.08, r.w, 6);
    const n = Math.max(3, Math.round(r.w / 90)), cw = r.w / n;
    for (let k = 0; k < n; k++) { const x = r.x + k * cw; ctx.fillStyle = lg(ctx, x, 0, x + cw, 0, [[0, '#1d3a86'], [0.5, '#2a4fa8'], [1, '#1b3380']]); ctx.fillRect(x + 2, r.y + H * 0.08 + 6, cw - 4, H * 0.3); ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + cw / 2, r.y + H * 0.08 + 6); ctx.lineTo(x + cw / 2, r.y + H * 0.38 + 6); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(x + cw / 2, r.y + H * 0.22, cw * 0.14, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a4fa8'; ctx.beginPath(); ctx.arc(x + cw / 2, r.y + H * 0.22, cw * 0.07, 0, TAU); ctx.fill(); }
    // lantern
    const lx = r.x + r.w * 0.86, ly = r.y + H * 0.58; ctx.strokeStyle = '#4a3320'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, r.y + H * 0.38 + 6); ctx.lineTo(lx, ly - 20); ctx.stroke();
    ctx.fillStyle = rg(ctx, lx, ly, 2, 34, [[0, '#fff2b8'], [1, '#e8802a']]); ell(ctx, lx, ly, 17, 24); ctx.fill(); ctx.strokeStyle = '#7a3a12'; ctx.lineWidth = 1.5; for (let q = -1; q <= 1; q++) { ctx.beginPath(); ctx.ellipse(lx, ly, 17, Math.abs(q) * 8 + 2, 0, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,200,110,0.18)'; ell(ctx, lx, ly, 60, 70); ctx.fill();
    // shelf of long-necked dolls
    const sx0 = r.x + r.w * 0.06, sx1 = r.x + r.w * 0.74, sy = r.y + H * 0.84; ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 7, [[0, '#a87a4a'], [1, '#3a2412']]); ctx.fillRect(sx0 - 6, sy, sx1 - sx0 + 12, 7);
    const nn = Math.max(3, Math.min(8, Math.round((sx1 - sx0) / 34))); for (let k = 0; k < nn; k++) miniKokeshi(ctx, sx0 + ((sx1 - sx0) * (k + 0.5)) / nn, sy, H * (0.34 + 0.06 * hash(k, 8)), '#ecd29c', '#15110f', k % 2 ? '#c8282c' : '#233a78');
    for (let k = 0; k < 4; k++) { const ph = (t * 0.18 + k * 0.27) % 1; ctx.fillStyle = `rgba(255,255,255,${0.16 * (1 - ph)})`; ell(ctx, r.x + r.w * (0.2 + 0.2 * k) + Math.sin(ph * 5 + k) * 8, r.y + H * (0.95 - ph * 0.55), 22 * (1 + ph), 10 * (1 + ph)); ctx.fill(); }
  },
  darumashop(ctx, s, r, H, t) { // Takasaki: a deep red paper wall with a gold border, tiers of red wishing dolls in all sizes, paper lanterns
    ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.05)], [1, tint(s.wallC, -0.3)]]); ctx.fillRect(r.x, r.y, r.w, H);
    for (let y = r.y; y < r.y + H; y += 34) { ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke(); }
    ctx.fillStyle = '#e2ab35'; ctx.fillRect(r.x, r.y + H * 0.04, r.w, 4); ctx.fillRect(r.x, r.y + H * 0.045 + 10, r.w, 2);
    for (let tier = 0; tier < 2; tier++) { const sy = r.y + H * (0.46 + 0.42 * tier), hh = H * (0.3 - tier * 0.06); ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 7, [[0, '#d8a85a'], [1, '#4a2c12']]); ctx.fillRect(r.x + 4, sy, r.w - 8, 7);
      const n = Math.max(4, Math.round(r.w / (46 - tier * 8))); for (let k = 0; k < n; k++) miniDaruma(ctx, r.x + 10 + ((r.w - 20) * (k + 0.5)) / n, sy, hh * (0.62 + 0.38 * hash(k, 9 + tier)), '#c41f26', '#e2ab35'); }
    for (let k = 0; k < 3; k++) { const x = r.x + r.w * (0.2 + 0.3 * k); ctx.strokeStyle = '#2a0a0c'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, r.y + H * 0.05); ctx.lineTo(x, r.y + H * 0.1); ctx.stroke(); ctx.fillStyle = rg(ctx, x, r.y + H * 0.14, 1, 20, [[0, '#ffe9a8'], [1, '#e2753a']]); ell(ctx, x, r.y + H * 0.14, 12, 17); ctx.fill(); }
  },
  alpine(ctx, s, r, H, t) { // Val Gardena: knotty pine boards, a window onto pale peaks and spruce, a shelf of small turned dolls, a carving knife on the wall
    for (let x = r.x, k = 0; x < r.x + r.w; x += 38, k++) { ctx.fillStyle = lg(ctx, x, 0, x + 38, 0, [[0, tint(s.wallC, -0.08 + 0.06 * hash(k, 3))], [1, tint(s.wallC, 0.08 * hash(k, 4))]]); ctx.fillRect(x, r.y, 38, H); ctx.strokeStyle = 'rgba(60,34,14,0.5)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + H); ctx.stroke(); }
    for (let k = 0; k < 8; k++) { const x = r.x + r.w * hash(k, 5), y = r.y + H * (0.1 + 0.8 * hash(k, 6)); ctx.strokeStyle = 'rgba(70,40,16,0.45)'; ctx.lineWidth = 1.2; ell(ctx, x, y, 6, 9); ctx.stroke(); ell(ctx, x, y, 3, 5); ctx.stroke(); }
    const wx = r.x + r.w * 0.5, ww = r.w * 0.38, wy = r.y + H * 0.14, wh = H * 0.5; ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#a8d0f0'], [1, '#e8f2fa']]); ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = '#f4f8fc'; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx + ww * 0.18, wy + wh * 0.42); ctx.lineTo(wx + ww * 0.3, wy + wh * 0.55); ctx.lineTo(wx + ww * 0.5, wy + wh * 0.22); ctx.lineTo(wx + ww * 0.72, wy + wh * 0.5); ctx.lineTo(wx + ww * 0.85, wy + wh * 0.36); ctx.lineTo(wx + ww, wy + wh * 0.6); ctx.lineTo(wx + ww, wy + wh); ctx.fill(); ctx.fillStyle = 'rgba(130,160,200,0.45)'; ctx.beginPath(); ctx.moveTo(wx + ww * 0.5, wy + wh * 0.22); ctx.lineTo(wx + ww * 0.72, wy + wh * 0.5); ctx.lineTo(wx + ww * 0.55, wy + wh * 0.55); ctx.fill();
    ctx.fillStyle = '#1e4a30'; for (let k = 0; k < 4; k++) { const x = wx + ww * (0.12 + 0.26 * k), y = wy + wh; ctx.beginPath(); ctx.moveTo(x, y - wh * 0.4); ctx.lineTo(x + ww * 0.07, y); ctx.lineTo(x - ww * 0.07, y); ctx.fill(); }
    ctx.strokeStyle = '#d8c8a0'; ctx.lineWidth = 6; ctx.strokeRect(wx, wy, ww, wh); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
    const sx0 = r.x + r.w * 0.03, sx1 = r.x + r.w * 0.45, sy = r.y + H * 0.56; ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 7, [[0, '#d9b078'], [1, '#6a4420']]); ctx.fillRect(sx0 - 6, sy, sx1 - sx0 + 12, 7);
    const n = Math.max(3, Math.min(6, Math.round((sx1 - sx0) / 30))); for (let k = 0; k < n; k++) miniPeg(ctx, sx0 + ((sx1 - sx0) * (k + 0.5)) / n, sy, H * (0.26 + 0.04 * hash(k, 8)), ['#2b5aa4', '#2f7a46', '#7a3a8a', '#c4282a'][k % 4], '#c4282a');
    ctx.save(); ctx.translate(r.x + r.w * 0.12, r.y + H * 0.2); ctx.rotate(-0.4); ctx.fillStyle = '#c9ced2'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(54, -4); ctx.lineTo(60, 2); ctx.lineTo(0, 6); ctx.fill(); ctx.fillStyle = '#6a4420'; ctx.fillRect(-26, -1, 26, 9); ctx.restore();
  },
};

walls.seiffen = function (ctx, s, r, H, t) { // the Ore Mountains: dark timber, a window onto snowy spruce, a shelf of small nutcrackers and a candle arch
  ctx.fillStyle = lg(ctx, 0, r.y, 0, r.y + H, [[0, tint(s.wallC, 0.08)], [1, tint(s.wallC, -0.3)]]); ctx.fillRect(r.x, r.y, r.w, H);
  for (let x = r.x; x < r.x + r.w; x += 32) { ctx.strokeStyle = 'rgba(0,0,0,0.36)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + H); ctx.stroke(); }
  const wx = r.x + r.w * 0.5, ww = r.w * 0.34, wy = r.y + H * 0.1, wh = H * 0.5; ctx.fillStyle = lg(ctx, 0, wy, 0, wy + wh, [[0, '#9ab4d0'], [1, '#e8eef4']]); ctx.fillRect(wx, wy, ww, wh);
  for (let k = 0; k < 6; k++) { const x = wx + ww * (0.08 + 0.17 * k), y = wy + wh; ctx.fillStyle = '#1e3a2c'; ctx.beginPath(); ctx.moveTo(x, y - wh * (0.45 + 0.1 * hash(k, 3))); ctx.lineTo(x + ww * 0.07, y); ctx.lineTo(x - ww * 0.07, y); ctx.fill(); ctx.fillStyle = 'rgba(240,248,255,0.9)'; ctx.beginPath(); ctx.moveTo(x, y - wh * (0.45 + 0.1 * hash(k, 3))); ctx.lineTo(x + ww * 0.035, y - wh * 0.28); ctx.lineTo(x - ww * 0.035, y - wh * 0.28); ctx.fill(); }
  ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 6; ctx.strokeRect(wx, wy, ww, wh); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.stroke();
  const ax = r.x + r.w * 0.04, aw = r.w * 0.4, ay = r.y + H * 0.64; ctx.strokeStyle = '#6a4220'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(ax + aw / 2, ay - H * 0.4, ax + aw, ay); ctx.stroke(); for (let k = 0; k < 5; k++) { const f = (k + 0.5) / 5, x = ax + aw * f, y = ay - H * 0.4 * 2 * f * (1 - f) * 0.5 * 1.0; ctx.fillStyle = '#f4efe0'; ctx.fillRect(x - 2, y - 16, 4, 16); ctx.fillStyle = rgba('#ffd060', 0.95); ctx.beginPath(); ctx.ellipse(x, y - 20, 3, 6 + Math.sin((t ?? 0) * 6 + k) * 1.2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = rgba('#ffd060', 0.16); ctx.beginPath(); ctx.arc(x, y - 20, 16, 0, TAU); ctx.fill(); }
  const sy = r.y + H * 0.82, sx0 = r.x + r.w * 0.04, sx1 = r.x + r.w * 0.96; ctx.fillStyle = lg(ctx, 0, sy, 0, sy + 7, [[0, '#a8744a'], [1, '#3a2412']]); ctx.fillRect(sx0 - 4, sy, sx1 - sx0 + 8, 7); const n = Math.max(5, Math.min(12, Math.round((sx1 - sx0) / 30)));
  for (let k = 0; k < n; k++) { const x = sx0 + ((sx1 - sx0) * (k + 0.5)) / n, h2 = H * (0.2 + 0.03 * hash(k, 4)); cast(ctx, x + 2, sy, 8, 2, 0.4); ctx.fillStyle = '#16120f'; ctx.fillRect(x - 5, sy - h2, 10, h2 * 0.2); ctx.fillStyle = '#b8241c'; ctx.fillRect(x - 6, sy - h2 * 0.8, 12, h2 * 0.45); ctx.fillStyle = '#f4efe4'; ctx.fillRect(x - 6, sy - h2 * 0.35, 12, h2 * 0.28); ctx.fillStyle = '#16120f'; ctx.fillRect(x - 6, sy - h2 * 0.07, 12, h2 * 0.07); ctx.fillStyle = '#f0d4b0'; ctx.beginPath(); ctx.arc(x, sy - h2 * 0.82, 4, 0, TAU); ctx.fill(); }
};
const floorKinds = {};
const floorEx = {};
const litter = {};
const frames = {};

// ---- workshops -----------------------------------------------------------------------------------------------------------------------------
const T = (c, shape, glaze, touch, win, ok) => ({ caption: c, shape, glaze, touch, touchBtn: 'Paint face', win, ok, retry: 'Back to the lathe' });
const W = (c, shape, glaze, win, ok) => ({ caption: c, shape, glaze, win, ok, retry: 'Back to the lathe' });
const scenes = {
  onsen: { wall: 'onsen', wallC: '#6a4026', floor: 'planks', floorC: '#8a6a44', light: 'window', litter: [{ k: 'shavings', c: '#f2dcae' }], dock: ['gouge', 'caliper', 'brush:#c4302b', 'pot:#c4302b', 'pot:#17110f', 'pot:#2f7a46'], dockKind: 'tray', frame: 'niche',
    rig: 'stand', standC: '#8a5a32', tool: 'gouge', top: 'solid', vessel: 'fine', view: 0.1, wscale: 1, aspect: 0.46, hscale: 0.78, dome: 0.9, still: true, grain: true, deco: 'kokeshi', headAt: 0.02, chestAt: 0.56,
    motifs: ['none'], matt: true, sheen: 0.15,
    words: T('Turn and paint this doll', 'Drag across the wood to set the width of the doll', 'Tap a band to paint it', 'Tap each glowing mark to paint the face', 'A doll for a hot-spring shelf', 'A good doll'), pitch: 1.1, wave: 'triangle' },
  seiffen: { wall: 'seiffen', wallC: '#4a3220', floor: 'planks', floorC: '#7a5a38', light: 'lamp', litter: [{ k: 'shavings', c: '#f2dcae' }], dock: ['gouge', 'caliper', 'brush:#16120f', 'pot:#b8241c', 'pot:#f4efe4', 'pot:#16120f'], dockKind: 'tray', frame: 'rail',
    rig: 'stand', standC: '#6a4426', tool: 'gouge', top: 'solid', vessel: 'fine', view: 0.1, wscale: 1, aspect: 0.4, hscale: 0.8, dome: 0.4, still: true, grain: true, deco: 'nutcracker', headAt: 0.27, headK: 0.62, matt: true, sheen: 0.2,
    words: T('Turn and paint this soldier', 'Drag across the wood to set the width of the figure', 'Tap a band to paint it', 'Tap each glowing mark to paint the face', 'A soldier for the shelf', 'A good figure'), pitch: 1.05, wave: 'triangle' },
  yuya: { wall: 'yuya', wallC: '#26335e', floor: 'planks', floorC: '#6a5238', light: 'lamp', litter: [{ k: 'shavings', c: '#f2dcae' }], dock: ['gouge', 'caliper', 'brush:#c8282c', 'pot:#c8282c', 'pot:#233a78', 'pot:#15110f'], dockKind: 'tray', frame: 'plinth',
    rig: 'stand', standC: '#5a3c22', tool: 'gouge', top: 'solid', vessel: 'fine', view: 0.1, wscale: 1, aspect: 0.44, hscale: 0.78, dome: 0.9, still: true, grain: true, deco: 'tsuchiyu', headAt: 0.02, matt: true, sheen: 0.12,
    words: T('Turn and paint this doll', 'Drag across the wood to set the width of the doll', 'Tap a band to paint it', 'Tap each glowing mark to paint the face', 'A doll with a long neck', 'A good doll'), pitch: 0.95, wave: 'triangle' },
  darumashop: { wall: 'darumashop', wallC: '#7a1a20', floor: 'planks', floorC: '#5a3624', light: 'lamp', litter: [{ k: 'scraps', c: '#f2e6d0' }], dock: ['brush:#14100e', 'pot:#14100e', 'pot:#e2ab35', 'pot:#c41f26', 'paper'], dockKind: 'tray', frame: 'rail',
    rig: 'stand', standC: '#2a1a12', tool: 'sponge', top: 'solid', vessel: 'fine', view: 0.1, wscale: 1, aspect: 0.52, hscale: 0.74, dome: 0.85, still: true, deco: 'daruma', headAt: 0.28, headK: 0.66, matt: false, sheen: 0.5,
    words: { caption: 'Mould and paint this doll', shape: 'Drag across the paper-mache to set its width', glaze: 'Tap a band to paint it', touch: 'Dot each eye: the first wish is made with the left', touchBtn: 'Dot the eyes', win: 'A doll ready for a wish', ok: 'A good doll', retry: 'Back to the mould' }, pitch: 0.85, wave: 'sine' },
  alpine: { wall: 'alpine', wallC: '#c89a5a', floor: 'planks', floorC: '#9a7240', light: 'window', litter: [{ k: 'shavings', c: '#f5e2b8' }], dock: ['knife', 'caliper', 'brush:#2b5aa4', 'pot:#2b5aa4', 'pot:#c4282a', 'pot:#f6efe0'], dockKind: 'tray', frame: 'niche',
    rig: 'stand', standC: '#8a6038', tool: 'gouge', top: 'solid', vessel: 'fine', view: 0.1, wscale: 1, aspect: 0.46, hscale: 0.78, dome: 0.9, still: true, grain: true, deco: 'peg', headAt: 0.02, matt: true, sheen: 0.18,
    words: T('Turn and paint this doll', 'Drag across the wood to set the width of the doll', 'Tap a band to paint the dress', 'Tap each glowing mark to paint the face', 'A doll for the Christmas shelf', 'A good doll'), pitch: 1.2, wave: 'triangle' },
};
registerSceneSet({
  scenes: Object.fromEntries(Object.entries(scenes).map(([id, s]) => [id, { ...s, hang: [] }])),
  rules: [['seiffen', /nutcracker|seiffen|erzgebirge/i], ['yuya', /tsuchiyu/i], ['darumashop', /daruma/i], ['alpine', /peg (wooden )?doll|val gardena|gr[oö]den/i], ['onsen', /kokeshi/i]],
  walls, floorKinds, floorEx, litter, frames,
  soundMat: { seiffen: 'wood', onsen: 'wood', yuya: 'wood', darumashop: 'clay', alpine: 'wood' },
});

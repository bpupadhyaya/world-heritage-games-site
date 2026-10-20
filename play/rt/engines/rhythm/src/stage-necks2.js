// Neck instruments, second wave (1.16.0): the plucked lutes of East and Southeast Asia and Central Asia, added through the same EXT hooks
// as stage-necks.js (data rows plus new bodies, heads, soundboards and extras for the lute stage in strings.js).
// biwa, shamisen, sanshin, moon lute (an-nguyet / yueqin), ruan, liuqin, dutar, hasapi, phin, gambus, an-tinh.
import { clamp, mix, rgba, lighter, darker, rrect, circ, ell, hgrad, vgrad, rgrad, hash, grain, TAU } from './art.js';
import { pythonSkin, rosette, inlay, studs, wrap, peg as pegBar } from './instr-art.js';
import { lerp } from './stagekit.js';
import { EXT } from './strings.js';
import { registerStringStage } from './registry.js';

const mir = (ctx, w, l, pts) => { // right-half outline from the top, mirrored (same convention as stage-necks.js)
  ctx.beginPath(); ctx.moveTo(-pts[0][0] * w, pts[0][1] * l);
  for (let i = 1; i < pts.length; i++) { const p = pts[i]; ctx.bezierCurveTo(-p[0] * w, p[1] * l, -p[2] * w, p[3] * l, -p[4] * w, p[5] * l); }
  for (let i = pts.length - 1; i >= 1; i--) { const p = pts[i], q = pts[i - 1]; ctx.bezierCurveTo(p[2] * w, p[3] * l, p[0] * w, p[1] * l, (q.length === 2 ? q[0] : q[4]) * w, (q.length === 2 ? q[1] : q[5]) * l); }
  ctx.closePath();
};
const wAt = (G, u) => lerp(G.nutW, G.brW, (u - G.nutU) / (G.bridgeU - G.nutU)) + 26;
const star = (ctx, x, y, r, n = 8, k = 0.45) => { ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * TAU - Math.PI / 2, rr = i % 2 ? r * k : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); };

// a plectrum (bachi): the broad edge strikes at (0,0), the handle runs to +x; `ang` swings it
const bachiShape = (ctx, w, len) => { ctx.beginPath(); ctx.moveTo(0, -w / 2); ctx.quadraticCurveTo(-w * 0.2, 0, 0, w / 2); ctx.lineTo(len, w * 0.13); ctx.quadraticCurveTo(len + 8, 0, len, -w * 0.13); ctx.closePath(); };
const bachi = (ctx, v, u, ang, w, len, c0, c1) => {
  ctx.save(); ctx.translate(v, u); ctx.rotate(ang);
  ctx.save(); ctx.translate(4, 6); bachiShape(ctx, w, len); ctx.fillStyle = 'rgba(0,0,0,0.34)'; ctx.fill(); ctx.restore();
  bachiShape(ctx, w, len); ctx.fillStyle = hgrad(ctx, -w * 0.2, len, [[0, c0], [0.35, c1], [1, darker(c0, 0.25)]]); ctx.fill();
  ctx.strokeStyle = 'rgba(40,24,10,0.55)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(w * 0.08, -w * 0.32); ctx.quadraticCurveTo(w * 0.34, 0, w * 0.08, w * 0.32); ctx.stroke();
  ctx.restore();
};
const activeString = (G, e) => { let a = 0; e.forEach((v, i) => { if (v > e[a]) a = i; }); return a; };

// ---- bodies ---------------------------------------------------------------------------------------------------------------------
const B = EXT.bodies;
B.biwa = (ctx, w, l) => mir(ctx, w, l, [[0.2, 0], [0.26, 0.1, 0.5, 0.18, 0.5, 0.52], [0.5, 0.86, 0.3, 1, 0, 1]]);   // a broad pear: shoulders, deep belly
B.shamisen = (ctx, w, l) => { const r = Math.min(w, l) * 0.13; ctx.beginPath(); ctx.moveTo(-w / 2 + r, 0); ctx.lineTo(w / 2 - r, 0); ctx.quadraticCurveTo(w / 2, 0, w / 2, r); ctx.lineTo(w / 2, l - r); ctx.quadraticCurveTo(w / 2, l, w / 2 - r, l); ctx.lineTo(-w / 2 + r, l); ctx.quadraticCurveTo(-w / 2, l, -w / 2, l - r); ctx.lineTo(-w / 2, r); ctx.quadraticCurveTo(-w / 2, 0, -w / 2 + r, 0); ctx.closePath(); };
B.sanshin = (ctx, w, l) => { ctx.beginPath(); const n = 60, e = 2.7; for (let i = 0; i <= n; i++) { const a = (i / n) * TAU, c = Math.cos(a), s = Math.sin(a); const x = Math.sign(c) * Math.abs(c) ** (2 / e) * w / 2, y = l / 2 + Math.sign(s) * Math.abs(s) ** (2 / e) * l / 2; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.closePath(); };
B.moon = (ctx, w, l) => { ctx.beginPath(); ctx.ellipse(0, l / 2, w / 2, l / 2, 0, 0, TAU); ctx.closePath(); };
B.dutar = (ctx, w, l) => mir(ctx, w, l, [[0.07, 0], [0.12, 0.05, 0.5, 0.16, 0.5, 0.5], [0.5, 0.84, 0.28, 1, 0, 1]]);   // a slim half-pear running into the neck

B.hasapi = (ctx, w, l) => mir(ctx, w, l, [[0.1, 0], [0.3, 0.08, 0.5, 0.3, 0.5, 0.56], [0.5, 0.86, 0.3, 0.97, 0.06, 1]]);   // a carved boat hull
B.phin = (ctx, w, l) => mir(ctx, w, l, [[0.2, 0], [0.34, 0.02, 0.4, 0.1, 0.42, 0.26], [0.44, 0.4, 0.5, 0.5, 0.5, 0.68], [0.5, 0.9, 0.44, 1, 0.3, 1], [0.15, 1, 0.05, 1, 0, 1]]);   // an ear-shaped block, flat at the foot
B.gambus = (ctx, w, l) => mir(ctx, w, l, [[0.14, 0], [0.4, 0.04, 0.5, 0.2, 0.5, 0.5], [0.5, 0.84, 0.34, 1, 0, 1]]);   // a deep, round-bellied pear
B.tinh = (ctx, w, l) => mir(ctx, w, l, [[0.08, 0], [0.14, 0.03, 0.17, 0.12, 0.17, 0.22], [0.17, 0.3, 0.5, 0.26, 0.5, 0.6], [0.5, 0.94, 0.28, 1, 0, 1]]);   // a bottle gourd: small neck lobe, big belly

// ---- heads ----------------------------------------------------------------------------------------------------------------------
const Hd = EXT.heads;
Hd.biwa = {   // a broad peg box that bends back, two big pegs a side
  path: (ctx, { nutU, headH, G }) => { const hw = G.nutW / 2 + 26; ctx.beginPath(); ctx.moveTo(-hw * 0.62, nutU); ctx.lineTo(-hw * 0.86, headH * 0.52); ctx.quadraticCurveTo(-hw * 1.1, headH * 0.12, -hw * 0.72, headH * 0.04); ctx.quadraticCurveTo(0, -headH * 0.1, hw * 0.72, headH * 0.04); ctx.quadraticCurveTo(hw * 1.1, headH * 0.12, hw * 0.86, headH * 0.52); ctx.lineTo(hw * 0.62, nutU); ctx.closePath(); },
  deco: (ctx, { headH, G }) => { const hw = G.nutW / 2 + 26;
    ctx.strokeStyle = '#e0b658'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-hw * 0.62, headH * 0.2); ctx.quadraticCurveTo(0, headH * 0.02, hw * 0.62, headH * 0.2); ctx.stroke();
    ctx.fillStyle = 'rgba(224,182,88,0.9)'; star(ctx, 0, headH * 0.42, 9, 6, 0.5); ctx.fill();
    for (const [sx, k] of [[-1, 0.32], [1, 0.32], [-1, 0.66], [1, 0.66]]) pegBar(ctx, sx * hw * 1.0, headH * k, 40, 11, '#efe1b4', 0); },
};
Hd.shamisen = {   // a slender neck end with a spoon top, three big pegs
  path: (ctx, { nutU, headH, G }) => { const hw = Math.max(18, G.nutW / 2 + 8); ctx.beginPath(); ctx.moveTo(-hw, nutU); ctx.lineTo(-hw * 0.95, headH * 0.4); ctx.bezierCurveTo(-hw * 1.2, headH * 0.2, -hw * 0.7, 0, 0, 0); ctx.bezierCurveTo(hw * 0.7, 0, hw * 1.2, headH * 0.2, hw * 0.95, headH * 0.4); ctx.lineTo(hw, nutU); ctx.closePath(); },
  deco: (ctx, { headH, G }) => { const hw = Math.max(18, G.nutW / 2 + 8);
    ctx.fillStyle = '#b3301c'; rrect(ctx, -hw * 0.5, headH * 0.1, hw, 9, 4); ctx.fill();
    for (const [sx, k] of [[-1, 0.3], [1, 0.46], [-1, 0.64]]) { pegBar(ctx, sx * (hw + 10), headH * k, 54, 13, '#3a1a10', 0); ctx.fillStyle = '#f4ead0'; circ(ctx, sx * (hw + 10) + sx * 27, headH * k, 8); ctx.fill(); } },
};
Hd.sanshin = {   // a narrow neck end topped by a rounded cap, three round-headed pegs
  path: (ctx, { nutU, headH, G }) => { const hw = Math.max(16, G.nutW / 2 + 6); ctx.beginPath(); ctx.moveTo(-hw, nutU); ctx.lineTo(-hw, headH * 0.5); ctx.bezierCurveTo(-hw * 1.15, headH * 0.1, hw * 1.15, headH * 0.1, hw, headH * 0.5); ctx.lineTo(hw, nutU); ctx.closePath(); },
  deco: (ctx, { headH, G }) => { const hw = Math.max(16, G.nutW / 2 + 6);
    for (const [sx, k] of [[-1, 0.36], [1, 0.52], [-1, 0.68]]) { pegBar(ctx, sx * (hw + 8), headH * k, 36, 12, '#c8962c', 0); ctx.fillStyle = '#e7c158'; circ(ctx, sx * (hw + 8) + sx * 18, headH * k, 9); ctx.fill(); ctx.strokeStyle = 'rgba(70,40,6,0.7)'; ctx.lineWidth = 1.5; ctx.stroke(); } },
};
Hd.moon = {   // a flat, slightly flared peg head with two long pegs a side
  path: (ctx, { nutU, headH, G }) => { const hw = G.nutW / 2 + 20; ctx.beginPath(); ctx.moveTo(-hw * 0.7, nutU); ctx.lineTo(-hw, headH * 0.3); ctx.quadraticCurveTo(-hw, 0, -hw * 0.5, 2); ctx.lineTo(hw * 0.5, 2); ctx.quadraticCurveTo(hw, 0, hw, headH * 0.3); ctx.lineTo(hw * 0.7, nutU); ctx.closePath(); },
  deco: (ctx, { headH, G }) => { const hw = G.nutW / 2 + 20;
    for (const [sx, k] of [[-1, 0.28], [1, 0.28], [-1, 0.66], [1, 0.66]]) { pegBar(ctx, sx * (hw + 12), headH * k, 54, 10, '#5a2a14', 0); ctx.fillStyle = '#f2e3b4'; circ(ctx, sx * (hw + 12) + sx * 27, headH * k, 7); ctx.fill(); }
    ctx.strokeStyle = '#e8c35a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, headH * 0.4, headH * 0.16, 0, TAU); ctx.stroke(); },
};
Hd.dutar = {   // a small round cap on a thin neck, two side pegs
  path: (ctx, { nutU, headH, G }) => { const hw = Math.max(16, G.nutW / 2 + 6); ctx.beginPath(); ctx.moveTo(-hw, nutU); ctx.lineTo(-hw, headH * 0.55); ctx.bezierCurveTo(-hw * 1.1, headH * 0.1, hw * 1.1, headH * 0.1, hw, headH * 0.55); ctx.lineTo(hw, nutU); ctx.closePath(); },
  deco: (ctx, { headH, G }) => { const hw = Math.max(16, G.nutW / 2 + 6);
    for (const [sx, k] of [[-1, 0.36], [1, 0.64]]) { pegBar(ctx, sx * (hw + 6), headH * k, 34, 11, '#4a2810', 0); ctx.fillStyle = '#d8c8a0'; circ(ctx, sx * (hw + 6) + sx * 17, headH * k, 7); ctx.fill(); } },
};

Hd.hasapi = {   // a carved prow with a knob, two pegs
  path: (ctx, { nutU, headH, G }) => { const hw = Math.max(18, G.nutW / 2 + 8); ctx.beginPath(); ctx.moveTo(-hw, nutU); ctx.lineTo(-hw * 0.9, headH * 0.5); ctx.bezierCurveTo(-hw * 1.2, headH * 0.3, -hw * 0.5, headH * 0.04, 0, headH * 0.04); ctx.bezierCurveTo(hw * 0.5, headH * 0.04, hw * 1.2, headH * 0.3, hw * 0.9, headH * 0.5); ctx.lineTo(hw, nutU); ctx.closePath(); },
  deco: (ctx, { headH, G }) => { const hw = Math.max(18, G.nutW / 2 + 8); ctx.fillStyle = '#b3301c'; circ(ctx, 0, headH * 0.22, hw * 0.38); ctx.fill(); ctx.fillStyle = '#f2ead6'; circ(ctx, 0, headH * 0.22, hw * 0.16); ctx.fill();
    for (const [sx, k] of [[-1, 0.5], [1, 0.62]]) { pegBar(ctx, sx * (hw + 8), headH * k, 36, 11, '#2a1608', 0); } },
};
Hd.phin = {   // a swept-back head ending in a curl, three side pegs
  path: (ctx, { nutU, headH, G }) => { const hw = Math.max(18, G.nutW / 2 + 10); ctx.beginPath(); ctx.moveTo(-hw, nutU); ctx.lineTo(-hw * 0.9, headH * 0.5); ctx.bezierCurveTo(-hw * 1.1, headH * 0.2, -hw * 0.2, headH * 0.02, hw * 0.7, headH * 0.04); ctx.bezierCurveTo(hw * 1.5, headH * 0.06, hw * 1.5, headH * 0.3, hw * 0.9, headH * 0.3); ctx.bezierCurveTo(hw * 0.7, headH * 0.3, hw * 0.7, headH * 0.4, hw * 0.9, headH * 0.5); ctx.lineTo(hw, nutU); ctx.closePath(); },
  deco: (ctx, { headH, G }) => { const hw = Math.max(18, G.nutW / 2 + 10); ctx.strokeStyle = '#e8c35a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(hw * 1.0, headH * 0.17, headH * 0.08, 0, TAU); ctx.stroke();
    for (const [sx, k] of [[-1, 0.3], [-1, 0.56], [1, 0.7]]) pegBar(ctx, sx * (hw + 10), headH * k, 40, 11, '#6a2a12', 0); },
};
Hd.gambus = {   // the lute's neck bends back: a broad, angled peg box with six side pegs
  path: (ctx, { nutU, headH, G }) => { const hw = G.nutW / 2 + 28; ctx.beginPath(); ctx.moveTo(-hw * 0.7, nutU); ctx.lineTo(-hw * 1.05, headH * 0.5); ctx.lineTo(-hw * 0.8, headH * 0.03); ctx.lineTo(hw * 0.8, headH * 0.03); ctx.lineTo(hw * 1.05, headH * 0.5); ctx.lineTo(hw * 0.7, nutU); ctx.closePath(); },
  deco: (ctx, { headH, G }) => { const hw = G.nutW / 2 + 28; for (let k = 0; k < 6; k++) { const sx = k % 2 ? 1 : -1, r = Math.floor(k / 2); pegBar(ctx, sx * (hw * 1.05 + 8), headH * (0.18 + r * 0.26), 36, 9, '#e8d6a0', 0); }
    ctx.fillStyle = 'rgba(232,195,90,0.85)'; star(ctx, 0, headH * 0.5, 12, 8, 0.5); ctx.fill(); },
};
Hd.tinh = {   // a slim, curled head with two big pegs
  path: (ctx, { nutU, headH }) => { ctx.beginPath(); ctx.moveTo(-9, nutU); ctx.lineTo(-10, headH * 0.4); ctx.bezierCurveTo(-24, headH * 0.34, -26, headH * 0.04, -4, headH * 0.04); ctx.bezierCurveTo(14, headH * 0.04, 20, headH * 0.22, 10, headH * 0.3); ctx.lineTo(10, nutU); ctx.closePath(); },
  deco: (ctx, { headH }) => { pegBar(ctx, -24, headH * 0.6, 40, 12, '#4a2a10', 0); pegBar(ctx, 24, headH * 0.72, 40, 12, '#4a2a10', 0); },
};

// ---- soundboard details (ctx translated to the body top; bw x bl) -------------------------------------------------------------------
const Fc = EXT.faces;
Fc.biwa = (ctx, G, { out }) => { const { bw, bl } = G;
  ctx.save(); out(ctx, bw, bl); ctx.clip();
  // the dark plectrum plate across the belly, a pair of crescent sound holes, a thin inlaid border
  const pu = bl * 0.56, ph = bl * 0.3;
  ctx.fillStyle = vgrad(ctx, pu, pu + ph, [[0, '#4a2a16'], [0.5, '#2a160a'], [1, '#150a04']]);
  ctx.beginPath(); ctx.moveTo(-bw * 0.4, pu); ctx.quadraticCurveTo(0, pu - ph * 0.12, bw * 0.4, pu); ctx.lineTo(bw * 0.5, pu + ph * 0.9); ctx.lineTo(-bw * 0.5, pu + ph * 0.9); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(240,215,150,0.8)'; ctx.lineWidth = 3; ctx.stroke();
  for (const sx of [-1, 1]) { ctx.save(); ctx.translate(sx * bw * 0.26, bl * 0.3); ctx.rotate(sx * -0.28); ctx.fillStyle = '#0c0603'; ctx.beginPath(); ctx.arc(0, 0, bw * 0.09, Math.PI * 0.1, Math.PI * 0.9, false); ctx.arc(0, -bw * 0.02, bw * 0.07, Math.PI * 0.9, Math.PI * 0.1, true); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(240,215,150,0.85)'; ctx.lineWidth = 2.6; ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = 'rgba(232,196,110,0.9)'; star(ctx, 0, bl * 0.2, bw * 0.045, 8, 0.5); ctx.fill();
  ctx.restore(); };
Fc.shamisen = (ctx, G, { out }) => { const { bw, bl } = G;
  // the skin sits inside the hoop; the lower part carries a dark protective patch where the plectrum lands
  ctx.save(); ctx.translate(0, bl * 0.07); ctx.scale(0.86, 0.86); out(ctx, bw, bl); ctx.clip();
  const pu = bl * 0.55, ph = bl * 0.3;
  ctx.fillStyle = 'rgba(70,32,18,0.22)'; ctx.beginPath(); ctx.moveTo(-bw * 0.36, pu); ctx.quadraticCurveTo(0, pu - ph * 0.12, bw * 0.36, pu); ctx.lineTo(bw * 0.4, pu + ph); ctx.quadraticCurveTo(0, pu + ph * 1.08, -bw * 0.4, pu + ph); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(90,50,26,0.5)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = 'rgba(120,90,50,0.35)'; ctx.lineWidth = 1.2; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(-bw * 0.3 + k * 6, pu + ph * 0.15 + k * 8); ctx.lineTo(bw * 0.3 - k * 6, pu + ph * 0.15 + k * 8); ctx.stroke(); }
  ctx.restore();
  // rim studs (the skin is tacked/pinned to the hoop)
  const pts = []; const r = Math.min(bw, bl) * 0.13, ins = 0.045; for (let k = 0; k < 11; k++) { const t = (k + 0.5) / 11; pts.push([-bw / 2 + r + t * (bw - 2 * r), bl * ins], [-bw / 2 + r + t * (bw - 2 * r), bl * (1 - ins)]); }
  studs(ctx, pts, Math.max(2.4, bw * 0.009), '#caa860'); };
Fc.sanshin = (ctx, G, { out }) => { const { bw, bl } = G;
  ctx.save(); ctx.translate(0, bl * 0.07); ctx.scale(0.86, 0.86); out(ctx, bw, bl); ctx.clip();
  pythonSkin(ctx, () => out(ctx, bw, bl), { x0: -bw / 2, y0: 0, x1: bw / 2, y1: bl }, { base: '#d3bc88', mark: '#4a3218', s: Math.max(15, bw / 11) });
  ctx.restore();
  ctx.strokeStyle = 'rgba(232,200,130,0.7)'; ctx.lineWidth = 2.4; ctx.save(); ctx.translate(0, bl * 0.07); ctx.scale(0.86, 0.86); out(ctx, bw, bl); ctx.stroke(); ctx.restore();
  // the hoop is lacquered red-black with a gold line, the skin has a tiny scuff patch under the bridge
  ctx.strokeStyle = 'rgba(200,60,40,0.8)'; ctx.lineWidth = 4; ctx.save(); ctx.translate(0, bl * 0.02); ctx.scale(0.96, 0.96); out(ctx, bw, bl); ctx.stroke(); ctx.restore(); };
Fc.moon = (ctx, G, { hole, hr }) => { const { bw, bl } = G, cx = 0, cy = bl / 2, R = Math.min(bw, bl) / 2;
  // a flat disc: bevel ring, ring of mother-of-pearl dots, two small crescent holes and an inlaid blossom under the strings
  ctx.strokeStyle = 'rgba(232,200,120,0.85)'; ctx.lineWidth = 3; circ(ctx, cx, cy, R * 0.9); ctx.stroke(); circ(ctx, cx, cy, R * 0.8); ctx.stroke();
  ctx.fillStyle = 'rgba(250,240,214,0.95)'; for (let k = 0; k < 36; k++) { const a = (k / 36) * TAU; circ(ctx, cx + Math.cos(a) * R * 0.85, cy + Math.sin(a) * R * 0.85, 2.6); ctx.fill(); }
  for (const sx of [-1, 1]) { ctx.save(); ctx.translate(sx * R * 0.34, cy - R * 0.38); ctx.rotate(sx * 0.4); ctx.fillStyle = '#0c0603'; ctx.beginPath(); ctx.arc(0, 0, R * 0.1, Math.PI * 0.05, Math.PI * 0.95, false); ctx.arc(0, -R * 0.03, R * 0.075, Math.PI * 0.95, Math.PI * 0.05, true); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(240,215,150,0.9)'; ctx.lineWidth = 2.4; ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = 'rgba(232,196,110,0.9)'; star(ctx, cx, cy + R * 0.12, R * 0.3, 12, 0.7); ctx.fill();
  ctx.fillStyle = 'rgba(120,30,20,0.85)'; star(ctx, cx, cy + R * 0.12, R * 0.2, 12, 0.7); ctx.fill();
  ctx.fillStyle = 'rgba(250,240,214,0.95)'; circ(ctx, cx, cy + R * 0.12, R * 0.05); ctx.fill(); void hole; void hr; };
Fc.dutar = (ctx, G, { out }) => { const { bw, bl } = G;
  // plain lacquered soundboard: a pearl-and-dark border, a small pair of vent holes high up, a tiny inlaid diamond chain
  ctx.save(); ctx.translate(0, bl * 0.03); ctx.scale(0.92, 0.94); out(ctx, bw, bl); ctx.strokeStyle = 'rgba(40,20,6,0.8)'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
  ctx.fillStyle = '#120a04'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * bw * 0.16, bl * 0.2, bw * 0.03, bw * 0.05, sx * 0.4, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(240,215,160,0.7)'; ctx.lineWidth = 1.8; ctx.stroke(); }
  ctx.strokeStyle = 'rgba(245,230,190,0.85)'; ctx.lineWidth = 2.4; ctx.save(); ctx.translate(0, bl * 0.045); ctx.scale(0.86, 0.9); out(ctx, bw, bl); ctx.stroke(); ctx.restore();
  for (const sy of [0.58, 0.72]) for (const sx of [-1, 1]) { ctx.fillStyle = 'rgba(240,200,110,0.85)'; star(ctx, sx * bw * 0.22, bl * sy, bw * 0.05, 6, 0.5); ctx.fill(); }
  ctx.fillStyle = 'rgba(245,235,205,0.85)'; for (let k = 0; k < 9; k++) { const u = bl * (0.34 + k * 0.06); ctx.beginPath(); ctx.moveTo(0, u - 5); ctx.lineTo(5, u); ctx.lineTo(0, u + 5); ctx.lineTo(-5, u); ctx.closePath(); ctx.fill(); } };

Fc.hasapi = (ctx, G, { out }) => { const { bw, bl } = G;   // Batak carving: red, black and white scrolls along a keel, an oval sound hole
  ctx.save(); out(ctx, bw, bl); ctx.clip();
  ctx.fillStyle = '#120a06'; ctx.beginPath(); ctx.ellipse(0, bl * 0.34, bw * 0.07, bl * 0.12, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#f2ead6'; ctx.lineWidth = 3; ctx.stroke();
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { const cu = bl * (0.5 + k * 0.1), cx = s * bw * 0.27; ctx.strokeStyle = k % 2 ? '#b3301c' : '#120a06'; ctx.lineWidth = 3.4; ctx.beginPath(); for (let t = 0; t < 24; t++) { const a = t * 0.36, rr = bw * 0.06 * (1 - t / 32); ctx.lineTo(cx + Math.cos(a * s) * rr, cu + Math.sin(a) * rr); } ctx.stroke(); }
  ctx.strokeStyle = '#f2ead6'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(0, bl * 0.5); ctx.lineTo(0, bl * 0.97); ctx.stroke();
  ctx.restore(); };
Fc.phin = (ctx, G, { out }) => { const { bw, bl } = G;   // an S-shaped sound hole, a gilt flower and a darker rim
  ctx.save(); out(ctx, bw, bl); ctx.clip(); ctx.strokeStyle = 'rgba(30,12,4,0.5)'; ctx.lineWidth = 10; out(ctx, bw, bl); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = '#120a06'; ctx.lineWidth = bw * 0.05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-bw * 0.14, bl * 0.22); ctx.bezierCurveTo(bw * 0.2, bl * 0.2, bw * 0.2, bl * 0.3, -bw * 0.04, bl * 0.32); ctx.bezierCurveTo(-bw * 0.2, bl * 0.34, -bw * 0.2, bl * 0.44, bw * 0.12, bl * 0.42); ctx.stroke(); ctx.lineCap = 'butt';
  ctx.fillStyle = 'rgba(232,195,90,0.9)'; star(ctx, 0, bl * 0.64, bw * 0.11, 10, 0.55); ctx.fill(); ctx.fillStyle = 'rgba(120,30,10,0.9)'; circ(ctx, 0, bl * 0.64, bw * 0.035); ctx.fill(); };
Fc.gambus = (ctx, G, { hole, hr }) => { const { bw, bl } = G;   // an ornate top: a carved grille over three holes and a gilt border
  ctx.strokeStyle = 'rgba(232,195,90,0.85)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(0, bl * 0.5, bw * 0.44, bl * 0.44, 0, 0, TAU); ctx.stroke();
  hole(0, bl * 0.34, hr * 0.8); hole(-bw * 0.2, bl * 0.44, hr * 0.42, true); hole(bw * 0.2, bl * 0.44, hr * 0.42, true);
  ctx.strokeStyle = 'rgba(245,225,170,0.8)'; ctx.lineWidth = 2; for (let k = 0; k < 14; k++) { const a = (k / 14) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * hr * 1.6, bl * 0.34 + Math.sin(a) * hr * 1.6); ctx.lineTo(Math.cos(a) * hr * 2.1, bl * 0.34 + Math.sin(a) * hr * 2.1); ctx.stroke(); }
  ctx.fillStyle = 'rgba(232,195,90,0.8)'; for (let k = 0; k < 7; k++) { star(ctx, -bw * 0.3 + k * bw * 0.1, bl * 0.8, 6, 4, 0.4); ctx.fill(); } };
Fc.tinh = (ctx, G, { out, hole, hr }) => { const { bw, bl } = G;   // gourd skin spotted like a ripe bottle gourd, and a round wooden cover disc with one hole
  ctx.save(); out(ctx, bw, bl); ctx.clip(); for (let k = 0; k < 40; k++) { ctx.fillStyle = `rgba(90,80,20,${0.1 + 0.16 * hash(k)})`; circ(ctx, (hash(k + 4) - 0.5) * bw, bl * hash(k + 9), 3 + 6 * hash(k + 2)); ctx.fill(); } ctx.restore();
  const cy = bl * 0.66, R = bw * 0.3; ctx.fillStyle = hgrad(ctx, -R, R, [[0, '#8a5a2a'], [0.4, '#d7a65e'], [1, '#6a421c']]); circ(ctx, 0, cy, R); ctx.fill(); ctx.strokeStyle = 'rgba(40,20,6,0.7)'; ctx.lineWidth = 3; ctx.stroke();
  hole(0, cy - R * 0.25, hr * 0.5, true); void hr; };

// ---- extras ---------------------------------------------------------------------------------------------------------------------
const Ex = EXT.extras;
const swing = (rt, f) => Math.sin(rt.anim * 38) * (1 - f) * 0.16;
Ex.biwa = { over: (ctx, G, rt, X, e) => { const a = activeString(G, e), f = e[a]; if (f < 0.04) return; const pu = (G.holeU + G.bridgeU) / 2 + 6;
  bachi(ctx, G.vAt(a, pu) + 6, pu, -0.15 + swing(rt, f) + (1 - f) * 0.25, 92, 150, '#7a4a22', '#e3b86a'); } };
Ex.shamisen = {
  under: (ctx, G) => { // the ivory comb bridge and the silk cord under the body
    const u = G.bridgeU, w = G.brW + 40; ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.moveTo(-w / 2 + 4, u + 10); ctx.lineTo(w / 2 + 4, u + 10); ctx.lineTo(w * 0.34 + 4, u - 16); ctx.lineTo(-w * 0.34 + 4, u - 16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = vgrad(ctx, u - 18, u + 10, [[0, '#fff8e4'], [1, '#c8b88c']]); ctx.beginPath(); ctx.moveTo(-w / 2, u + 8); ctx.lineTo(w / 2, u + 8); ctx.lineTo(w * 0.34, u - 16); ctx.lineTo(-w * 0.34, u - 16); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(90,70,40,0.6)'; ctx.lineWidth = 1.6; ctx.stroke(); },
  over: (ctx, G, rt, X, e) => { const a = activeString(G, e), f = e[a]; if (f < 0.04) return; const pu = G.bridgeU + G.bl * 0.16;
    bachi(ctx, G.vAt(a, pu) + 4, pu, -0.3 + swing(rt, f) + (1 - f) * 0.3, 96, 120, '#f2ead6', '#fffaf0'); },
};
Ex.sanshin = { under: (ctx, G) => { const u = G.bridgeU, w = G.brW + 30; ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, -w / 2 + 3, u - 4, w, 20, 5); ctx.fill(); ctx.fillStyle = vgrad(ctx, u - 6, u + 16, [[0, '#f4eed8'], [1, '#bda97a']]); rrect(ctx, -w / 2, u - 8, w, 20, 5); ctx.fill(); ctx.strokeStyle = 'rgba(70,50,20,0.55)'; ctx.lineWidth = 1.4; ctx.stroke(); } };
Ex.moon = { under: (ctx, G) => { // a tall carved bridge and a string-end plate on the rim
    const u = G.bridgeU, w = G.brW + 36; ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, -w / 2 + 3, u - 6, w, 20, 8); ctx.fill(); ctx.fillStyle = vgrad(ctx, u - 8, u + 12, [[0, '#6a3a1c'], [1, '#2a1408']]); rrect(ctx, -w / 2, u - 9, w, 20, 8); ctx.fill(); ctx.strokeStyle = 'rgba(240,215,150,0.7)'; ctx.lineWidth = 1.6; ctx.stroke(); } };

// ---- the rows -------------------------------------------------------------------------------------------------------------------
const row = (id, match, p) => registerStringStage({ id, match, tables: { PROF: { [id]: { type: 'lute', per: 1, hole: 'round', tag: 'finger', ...p } } } });

row('biwa', /\bbiwa\b|satsuma.?biwa|chikuzen/, { tilt: 0.04, zoom: 0.96, n: 4, fr: 4, fcap: 4, body: 'biwa', head: 'biwa', pegs: 4, hole: 'biwa', wood: '#c0813a', edge: '#3a1e0a', fb: '#26150a', headF: 0.12, neckF: 0.27, bwr: 0.7, nutW: 0.3, brW: 0.4, frets: 'raised', tag: 'none', vk: 'lute-biwa', bridgeF: 0.8, fbEndF: 0.32, extra: 'biwa', spread: [64, 72], gap: 60 });
row('shamisen', /shamisen|samisen|sangen/, { tilt: 0.02, zoom: 0.96, n: 3, fr: 0, body: 'shamisen', head: 'shamisen', pegs: 3, hole: 'shamisen', wood: '#4a2216', edge: '#1c0a06', fb: '#1c0e08', headF: 0.13, neckF: 0.34, bwr: 1.0, nutW: 0.1, brW: 0.14, skin: true, tag: 'none', vk: 'lute-shamisen', bridgeF: 0.52, fbEndF: 0.05, extra: 'shamisen', spread: [44, 50] });
row('sanshin', /sanshin|jamisen|sanshiin/, { tilt: 0.0, zoom: 0.96, n: 3, fr: 0, body: 'sanshin', head: 'sanshin', pegs: 3, hole: 'sanshin', wood: '#3a1d12', edge: '#150805', fb: '#160a05', headF: 0.14, neckF: 0.4, bwr: 0.86, nutW: 0.1, brW: 0.14, skin: true, tag: 'mizrab', vk: 'lute-sanshin', bridgeF: 0.52, fbEndF: 0.04, extra: 'sanshin', spread: [52, 60] });
row('moon', /nguy[eệ]t|yueqin|moon.?lute|moon.?guitar/, { tilt: 0.0, zoom: 0.96, n: 2, per: 2, fr: 9, fcap: 10, body: 'moon', head: 'moon', pegs: 4, hole: 'moon', wood: '#8a3426', edge: '#2a0e08', fb: '#2a1108', headF: 0.13, neckF: 0.34, bwr: 1.0, nutW: 0.12, brW: 0.16, frets: 'raised', vk: 'lute-moon', bridgeF: 0.72, fbEndF: 0.22, extra: 'moon', spread: [72, 82], gap: 58 });
row('dutar', /dutar|dotar|dutor/, { tilt: 0.03, zoom: 0.94, n: 2, fr: 14, body: 'dutar', head: 'dutar', pegs: 2, hole: 'dutar', wood: '#b56a2c', edge: '#4a2208', fb: '#26140a', headF: 0.1, neckF: 0.48, bwr: 0.74, nutW: 0.1, brW: 0.18, frets: 'moving', tag: 'finger', gut: true, vk: 'lute-dutar', bridgeF: 0.82, fbEndF: 0.18, spread: [78, 90], gap: 60 });
row('hasapi', /hasapi|kucapi|batak.?lute/, { tilt: 0.0, zoom: 0.94, n: 2, fr: 9, fcap: 10, body: 'hasapi', head: 'hasapi', pegs: 2, hole: 'hasapi', wood: '#d9b068', edge: '#4a2a0e', fb: '#3a2010', headF: 0.14, neckF: 0.4, bwr: 0.56, nutW: 0.1, brW: 0.14, frets: 'raised', tag: 'mizrab', vk: 'lute-hasapi', bridgeF: 0.78, fbEndF: 0.2, spread: [84, 96], gap: 56 });
row('phin', /\bphin\b|\bpin\b.*isan|isan.?lute/, { tilt: 0.04, zoom: 0.94, n: 3, per: 2, fr: 10, fcap: 11, body: 'phin', head: 'phin', pegs: 3, hole: 'phin', wood: '#c7782e', edge: '#4a2208', fb: '#2a1408', headF: 0.14, neckF: 0.36, bwr: 0.76, nutW: 0.18, brW: 0.28, frets: 'raised', tag: 'mizrab', vk: 'lute-phin', bridgeF: 0.8, fbEndF: 0.2, spread: [66, 76], gap: 56 });
row('gambus', /gambus|qanbus|kabus/, { tilt: 0.02, zoom: 0.94, n: 4, per: 2, fr: 0, body: 'gambus', head: 'gambus', pegs: 6, hole: 'gambus', wood: '#9a5a2a', edge: '#30180a', fb: '#1e1008', headF: 0.14, neckF: 0.3, bwr: 0.84, nutW: 0.16, brW: 0.24, tag: 'mizrab', vk: 'lute-gambus', bridgeF: 0.8, fbEndF: 0.08, spread: [66, 74], gap: 52 });
row('tinh', /tinh|tính|gourd.?lute/, { tilt: 0.03, zoom: 0.94, n: 2, fr: 0, body: 'tinh', head: 'tinh', pegs: 2, hole: 'tinh', wood: '#c9c070', edge: '#4a4a14', fb: '#3a2c10', headF: 0.12, neckF: 0.3, bwr: 0.9, nutW: 0.1, brW: 0.14, tag: 'finger', gut: true, vk: 'lute-tinh', bridgeF: 0.8, fbEndF: 0.06, spread: [84, 96], gap: 56 });

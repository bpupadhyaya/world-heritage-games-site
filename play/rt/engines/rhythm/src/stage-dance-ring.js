// Ring dance stages (1.11.0), seen from above: dancers stand in a circle, no faces.
//   stick-circle (Tharu stick dance, Nepal): eight dancers with a pair of sticks each; neighbours strike sticks at the points between them.
//       Every lane is one such meeting place on the ring. Struck, the two sticks clack, jump apart and a spark leaves the contact.
//   attan (Pashtun round dance, Afghanistan and Pakistan): eight dancers in wide shirts spin round their own axes as the circle turns about the
//       dhol drum in the middle. Lanes are the claps, steps, spins and hops between the dancers, and the drum (a lane called Dhol or Drum).
import { registerDanceStage } from './registry.js';
import { createSceneStage, eSpot, rot2, dancerTop, dancePose, smoothAngle, headwear, rod, dust, groundShadow, beatPhase, maxFlash } from './dance-kit.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU } from './dance-kit.js';
import { tubeShade, barrelPath, skinHead, hoop } from './drum-kit.js';

const D = 8;
const ang = (j) => j * TAU / D - Math.PI / 2;            // dancer j
const mid = (j) => (j + 0.5) * TAU / D - Math.PI / 2;     // the meeting place between dancer j and j+1

// lanes -> places on the ring: lanes named Dhol / Drum take the centre; the others spread over the D meeting places in pitch order
function placeLanes(K, centre) {
  const slot = new Array(K.N).fill(-1), ringLanes = [];
  K.order.forEach((i) => { if (centre && /dhol|drum|madal|beat/.test(K.nm(i))) slot[i] = 'c'; else ringLanes.push(i); });
  ringLanes.forEach((i, r) => { slot[i] = Math.round(r * D / ringLanes.length) % D; });
  return slot;
}

function drumTop(ctx, cx, cy, R, f, kind) {
  // a barrel drum lying on the ground, seen from above: lit shell with lacing and a sash; two thin edge ellipses for the heads
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.5);
  const L = R * 1.9, rr = R * 0.62, body = barrelPath(-L / 2, L / 2, (t) => rr * (0.9 + 0.2 * Math.sin(Math.PI * t)), 30);
  ctx.save(); ctx.translate(10, 16); body(ctx); ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fill(); ctx.restore();
  tubeShade(ctx, body, rr * 1.2, kind === 'dhol' ? '#7a3a1c' : '#9a5a2c', { hl: 0.3, dark: 0.36, spec: 0.3 });
  ctx.save(); body(ctx); ctx.clip(); grain(ctx, -L / 2, -rr, L, 2 * rr, '#2a1204', 0.4, 5, false, 14);
  ctx.strokeStyle = '#e8dcc0'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath(); for (let k = 0; k <= 10; k++) { const x = -L / 2 + L * (k / 10), y = (k % 2 ? 1 : -1) * rr * 0.7; if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
  for (const [c, x] of [['#c8452f', -0.08], ['#e0a82e', 0.0], ['#2a58b8', 0.08]]) { ctx.fillStyle = c; ctx.fillRect(L * x - 5, -rr * 1.2, 10, rr * 2.4); }
  ctx.restore();
  for (const sg of [-1, 1]) { ctx.save(); ctx.translate(sg * L / 2, 0); ctx.fillStyle = hgrad(ctx, -8, 8, [[0, '#cdb88a'], [1, '#8a7240']]); ell(ctx, 0, 0, 9, rr * 0.92); ctx.fill(); ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); }
  if (f > 0.05) { ctx.strokeStyle = `rgba(255,236,190,${0.6 * f})`; ctx.lineWidth = 3; for (let k = 0; k < 2; k++) { const p = clamp((1 - f) * 1.2 - k * 0.2, 0, 1); circ(ctx, 0, 0, R * (0.5 + p * 0.7)); ctx.stroke(); } }
  ctx.restore();
}

// a painted floor ring: a dotted mandala border round the dancers' circle and little clay lamps (a lit floor, not a bare patch of earth)
function floorMandala(ctx, cx, cy, R, anim) {
  ctx.save(); ctx.translate(cx, cy);
  for (const [r, lw, col] of [[R + 62, 2, 'rgba(255,240,200,0.22)'], [R - 62, 2, 'rgba(255,240,200,0.2)']]) { ctx.strokeStyle = col; ctx.lineWidth = lw; circ(ctx, 0, 0, r); ctx.stroke(); }
  for (let k = 0; k < 64; k++) { const a = k / 64 * TAU, r = R + 62; ctx.fillStyle = k % 2 ? 'rgba(255,244,214,0.28)' : 'rgba(180,60,40,0.4)'; circ(ctx, Math.cos(a) * r, Math.sin(a) * r, k % 2 ? 3 : 4.4); ctx.fill(); }
  for (let k = 0; k < 16; k++) { const a = k / 16 * TAU + 0.1; ctx.save(); ctx.rotate(a); ctx.fillStyle = k % 2 ? 'rgba(232,184,74,0.2)' : 'rgba(192,57,43,0.22)'; ctx.beginPath(); ctx.moveTo(R - 62, 0); ctx.quadraticCurveTo(R - 40, 22, R - 14, 0); ctx.quadraticCurveTo(R - 40, -22, R - 62, 0); ctx.fill(); ctx.restore(); }
  for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + Math.PI / 8, r = R + 62, x = Math.cos(a) * r, y = Math.sin(a) * r, fl = 0.8 + 0.2 * Math.sin(anim * 9 + k * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; circ(ctx, x + 2, y + 4, 12); ctx.fill(); ctx.fillStyle = rgrad(ctx, x - 3, y - 3, 1, 13, [[0, '#d99a62'], [1, '#6a3418']]); circ(ctx, x, y, 11); ctx.fill();
    ctx.fillStyle = rgrad(ctx, x, y, 0, 26 * fl, [[0, 'rgba(255,214,120,0.85)'], [1, 'rgba(255,170,60,0)']]); circ(ctx, x, y, 26 * fl); ctx.fill(); ctx.fillStyle = '#fff3c0'; circ(ctx, x, y - 1, 3.4 * fl); ctx.fill(); }
  ctx.restore();
}
const SKINS = ['#c98e63', '#b57a50', '#d9a37a', '#a86a45', '#c4885c', '#b07048', '#d49a6c', '#9c6440'];
const HAIRS = ['#1a1210', '#241812', '#14100c', '#2a1a12'];
const OUTFITS = [
  { shirt: '#c0392b', bottom: '#f2efe6', trim: '#f0d060', hat: 'scarf', hatCol: '#e8b84a' }, { shirt: '#2a58b8', bottom: '#f2efe6', trim: '#f0d060', hat: 'scarf', hatCol: '#c0392b' },
  { shirt: '#e8b84a', bottom: '#2a2a3a', trim: '#c0392b', hat: 'scarf', hatCol: '#2a7a4a' }, { shirt: '#2a7a4a', bottom: '#f2efe6', trim: '#f0d060', hat: 'scarf', hatCol: '#c0392b' },
];

// ---- Tharu stick dance ---------------------------------------------------------------------------------------------------------------------
registerDanceStage({
  id: 'stick-circle', match: /tharu|stick.?dance|lathi|stick.?circle|kathi|dandiya|raas/,
  build: (S, lanes, P) => { const slotOf = []; return createSceneStage('stick-circle', S, lanes, P, {
    dress: () => ({ kind: 'earth', base: '#9a7646', light: '#fff0c8' }),
    voiceOf: (i) => `dance-sticks-${/cross/i.test(lanes[i].name) ? 'cross' : /low|heavy/i.test(lanes[i].name) ? 'low' : /turn|stamp|step/i.test(lanes[i].name) ? 'turn' : /strike|clack|hit/i.test(lanes[i].name) ? 'strike' : ['strike', 'cross', 'low', 'turn'][i % 4]}`,
    build: (K) => {
      const ref = { w: 900, h: 900 }, cx = 0, cy = 450, Rr = 340, s = 150;
      const slot = placeLanes(K, false); for (let i = 0; i < K.N; i++) slotOf[i] = slot[i];
      const spots = new Array(K.N).fill(null);
      for (let i = 0; i < K.N; i++) { const j = slot[i]; spots[i] = eSpot(cx + Math.cos(mid(j)) * Rr, cy + Math.sin(mid(j)) * Rr, 58, 58, 0, { apk: 1 }); }
      return { ref, spots,
        draw(ctx, rt) {
          // the swept ring of the dance and the lamp-lit middle
          ctx.strokeStyle = 'rgba(255,244,214,0.22)'; ctx.lineWidth = 5; ctx.setLineDash([16, 14]); circ(ctx, cx, cy, Rr); ctx.stroke(); ctx.setLineDash([]);
          floorMandala(ctx, cx, cy, Rr, rt.anim);
          drumTop(ctx, cx, cy, 96, 0, 'madal');
          const mf = (j) => { let m = 0; for (let i = 0; i < K.N; i++) if (slot[i] === j) m = Math.max(m, rt.flash[i]); return m; };
          const t = rt.anim, bob = 0.5 + 0.5 * Math.sin(t * 6);
          const pos = []; for (let j = 0; j < D; j++) pos.push([cx + Math.cos(ang(j)) * Rr, cy + Math.sin(ang(j)) * Rr]);
          for (let j = 0; j < D; j++) groundShadow(ctx, pos[j][0] + 6, pos[j][1] + 12, s * 0.7, s * 0.5, 0.25);
          // hands: each dancer holds one stick towards each neighbour (left hand towards the next dancer clockwise, right hand towards the previous)
          const tc = (j) => [-Math.sin(ang(j)), Math.cos(ang(j))], HL = [], HR = [];
          for (let j = 0; j < D; j++) { const q = tc(j), rd = [Math.cos(ang(j)), Math.sin(ang(j))]; HL.push([pos[j][0] + q[0] * s * 0.56 - rd[0] * s * 0.1, pos[j][1] + q[1] * s * 0.56 - rd[1] * s * 0.1]); HR.push([pos[j][0] - q[0] * s * 0.56 - rd[0] * s * 0.1, pos[j][1] - q[1] * s * 0.56 - rd[1] * s * 0.1]); }
          // sticks: dancer j's left stick and dancer j+1's right stick meet at the place between them
          for (let j = 0; j < D; j++) {
            const j2 = (j + 1) % D, f = mf(j), M = [cx + Math.cos(mid(j)) * Rr, cy + Math.sin(mid(j)) * Rr], tang = [-Math.sin(mid(j)), Math.cos(mid(j))], rad = [Math.cos(mid(j)), Math.sin(mid(j))];
            const spread = f * 20, cross = 26 - f * 40;
            const tipA = [M[0] + tang[0] * cross + rad[0] * spread, M[1] + tang[1] * cross + rad[1] * spread], tipB = [M[0] - tang[0] * cross - rad[0] * spread, M[1] - tang[1] * cross - rad[1] * spread];
            rod(ctx, HL[j][0], HL[j][1], tipA[0], tipA[1], 13, j % 2 ? '#7a4a22' : '#8a5a2c', f); rod(ctx, HR[j2][0], HR[j2][1], tipB[0], tipB[1], 13, j % 2 ? '#8a5a2c' : '#7a4a22', f);
            if (f > 0.1) { ctx.save(); ctx.translate(M[0], M[1]); ctx.strokeStyle = `rgba(255,244,200,${f})`; ctx.lineWidth = 2.4; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + 0.3, r0 = 8 + (1 - f) * 10, r1 = r0 + 12 * f; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.stroke(); } ctx.restore(); }
          }
          for (let j = 0; j < D; j++) {
            const o = OUTFITS[j % 4], f = Math.max(mf(j), mf((j + D - 1) % D));
            const woman = j % 2 === 1;
            dancerTop(ctx, pos[j][0], pos[j][1], s, { face: ang(j) + Math.PI, shirt: o.shirt, bottom: woman ? darker(o.shirt, 0.15) : o.bottom, skirt: woman, skirtR: 0.56, skin: SKINS[j % 8], hair: HAIRS[j % 4], hairStyle: woman ? 'braid' : 'short', trim: o.trim, hat: woman ? 'hair' : o.hat, hatCol: o.hatCol, step: Math.sin(t * 6 + (j % 2) * Math.PI), bob: bob * 0.6 + f * 0.6, handL: HL[j], handR: HR[j] });
          }
          for (let j = 0; j < D; j++) dust(ctx, pos[j][0], pos[j][1] + 20, mf(j) * 0.0, '#d8c49a', 30);
          void rot2; void mix; void hash; void vgrad; void rrect; void lighter; void darker; void rgrad; void skinHead; void hoop; void maxFlash; void beatPhase; void headwear; void clamp;
        } };
    },
  }); },
});

// ---- Attan ------------------------------------------------------------------------------------------------------------------------------------
// 1.13.0: the play rings stand on an inner circle of the rug between the dhol and the dancers (not on the bodies); the two dancers either side of a ring
// answer its cue with a visible pose: Clap (hands meet in front, facing the drum), Step (one foot out, shoulders turn), Spin (arms wide, turning fast)
// and Hop (both feet up, arms thrown out, bigger shadow). Between cues the circle sways and turns as before.
const ATT_KIND = (nm, i) => (/clap/i.test(nm) ? 'clap' : /spin|turn/i.test(nm) ? 'spin' : /hop|jump/i.test(nm) ? 'hop' : /step|walk/i.test(nm) ? 'step' : ['clap', 'step', 'spin', 'hop'][i % 4]);
registerDanceStage({
  id: 'attan', match: /attan|khattak|pashtun.?dance|round.?dance/,
  build: (S, lanes, P) => { const slotOf = []; return createSceneStage('attan', S, lanes, P, {
    dress: () => ({ kind: 'earth', base: '#a98458', rugKind: 'stripes', rugBase: '#7a1f1c', rugA: '#e0b050', rugB: '#1f3a5a', light: '#fff0c8', rugPad: -0.05 }),
    voiceOf: (i) => (slotOf[i] === 'c' ? 'dance-attan-dhol' : `dance-attan-${ATT_KIND(lanes[i].name, i)}`),
    build: (K) => {
      const ref = { w: 900, h: 900 }, cx = 0, cy = 450, Rr = 345, Ri = 196, s = 142;
      const slot = placeLanes(K, true); for (let i = 0; i < K.N; i++) slotOf[i] = slot[i];
      const spots = new Array(K.N).fill(null);
      for (let i = 0; i < K.N; i++) { const j = slot[i]; spots[i] = j === 'c' ? eSpot(cx, cy, 80, 60, -0.5, { apk: 1 }) : eSpot(cx + Math.cos(mid(j)) * Ri, cy + Math.sin(mid(j)) * Ri, 52, 52, 0, { apk: 1 }); }
      const sm = []; for (let j = 0; j < D; j++) sm.push({});
      return { ref, spots,
        draw(ctx, rt) {
          // strongest recent cue at the place between dancer j and j+1: [strength, kind]
          const cue = (j) => { let m = 0, kd = null; for (let i = 0; i < K.N; i++) if (slot[i] === j && rt.flash[i] > m) { m = rt.flash[i]; kd = ATT_KIND(lanes[i].name, i); } return [m, kd]; };
          const mf = (j) => cue(j)[0] * (j === 'c' ? 1 : 1);
          const drumF = (() => { let m = 0; for (let i = 0; i < K.N; i++) if (slot[i] === 'c') m = Math.max(m, rt.flash[i]); return m; })();
          const t = rt.anim;
          ctx.strokeStyle = 'rgba(255,244,214,0.18)'; ctx.lineWidth = 5; ctx.setLineDash([16, 14]); circ(ctx, cx, cy, Rr); ctx.stroke(); ctx.setLineDash([]);
          // an inner lane of the rug where the rings stand, so cues never sit on a dancer
          ctx.strokeStyle = 'rgba(255,236,190,0.16)'; ctx.lineWidth = 3; ctx.setLineDash([8, 12]); circ(ctx, cx, cy, Ri); ctx.stroke(); ctx.setLineDash([]);
          drumTop(ctx, cx, cy, 98, drumF, 'dhol');
          const pos = []; for (let j = 0; j < D; j++) { const a = ang(j); pos.push([cx + Math.cos(a) * Rr, cy + Math.sin(a) * Rr]); }
          // trailing scarves behind each spinning dancer
          for (let j = 0; j < D; j++) { const a = ang(j); ctx.strokeStyle = rgba(['#c0392b', '#e8b84a', '#2a7a4a', '#f2efe6'][j % 4], 0.4); ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy, Rr, a - 0.55, a - 0.12); ctx.stroke(); }
          // each dancer: the stronger of the two cues beside them decides the pose
          const dn = [];
          for (let j = 0; j < D; j++) {
            const c1 = cue(j), c0 = cue((j + D - 1) % D), pick = c1[0] >= c0[0] ? c1 : c0, f = pick[0] > 0.04 ? pick[0] : 0, kd = f ? pick[1] : 'idle';
            const sg = (j % 2 ? -1 : 1), inward = ang(j) + Math.PI, tang = ang(j) + Math.PI / 2;
            const idleFace = tang + Math.sin(t * 1.3 + j) * 0.5;
            const target = kd === 'clap' || kd === 'hop' ? inward : kd === 'spin' ? t * 5 + j : kd === 'step' ? tang : idleFace;
            const face = smoothAngle(sm[j], t, target, kd === 'spin' ? 30 : 9);
            const pose = dancePose(kd, f, { x: pos[j][0], y: pos[j][1], s, face, sg, ph: t * 1.15 + j * 0.37 });
            dn.push({ j, f, kd, face, pose });
            const lift = kd === 'hop' ? f : 0;
            groundShadow(ctx, pos[j][0] + 6 + lift * 10, pos[j][1] + 12 + lift * 14, s * (0.8 - 0.1 * lift), s * (0.55 - 0.06 * lift), 0.25 * (1 - lift * 0.4));
          }
          // light links from a struck ring to the two dancers who answer it
          for (let j = 0; j < D; j++) { const f = cue(j)[0]; if (f < 0.06) continue; const m = [cx + Math.cos(mid(j)) * Ri, cy + Math.sin(mid(j)) * Ri]; ctx.strokeStyle = `rgba(255,236,170,${0.5 * f})`; ctx.lineWidth = 3; for (const q of [j, (j + 1) % D]) { ctx.beginPath(); ctx.moveTo(m[0], m[1]); ctx.lineTo(pos[q][0] * 0.82 + cx * 0.18, pos[q][1] * 0.82 + cy * 0.18); ctx.stroke(); } }
          for (const d of dn) {
            const j = d.j, o = OUTFITS[(j + 1) % 4], hopL = d.kd === 'hop' ? d.f : 0, sc = 1 + 0.16 * hopL + (d.kd === 'clap' ? 0.03 * d.f : 0);
            dancerTop(ctx, pos[j][0], pos[j][1], s * sc, { face: d.face, shirt: o.shirt, bottom: '#f2efe6', skirt: true, skirtR: 0.52, skin: SKINS[(j * 3) % 8], trim: '#e8b84a', hat: 'hair', hair: '#1a1210', step: 0, bob: 0.25 + d.f * 0.9, bareArms: false, handL: d.pose.handL, handR: d.pose.handR, feet: d.pose.feet, twist: d.pose.twist });
            headwear(ctx, j % 2 ? 'turban' : 'cap', pos[j][0], pos[j][1], s * sc, j % 2 ? '#f2efe6' : '#2a2a3a', o.hatCol ?? '#c0392b', 0.25 + d.f * 0.9);
            if (d.kd === 'clap' && d.f > 0.3) { const hx = (d.pose.handL[0] + d.pose.handR[0]) / 2, hy = (d.pose.handL[1] + d.pose.handR[1]) / 2; ctx.strokeStyle = `rgba(255,244,200,${d.f})`; ctx.lineWidth = 3; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, r0 = 12, r1 = 12 + 16 * d.f; ctx.beginPath(); ctx.moveTo(hx + Math.cos(a) * r0, hy + Math.sin(a) * r0); ctx.lineTo(hx + Math.cos(a) * r1, hy + Math.sin(a) * r1); ctx.stroke(); } }
            if (d.kd === 'spin' && d.f > 0.1) { ctx.strokeStyle = `rgba(255,244,200,${0.7 * d.f})`; ctx.lineWidth = 4; ctx.lineCap = 'round'; for (let q = 0; q < 3; q++) { const a0 = d.face + q * 2.1; ctx.beginPath(); ctx.arc(pos[j][0], pos[j][1], s * (0.66 + 0.05 * q), a0, a0 + 0.9); ctx.stroke(); } }
            if (d.kd === 'step' && d.f > 0.15) { const fa = d.pose.feet, fxp = (fa.l[1] < fa.r[1] ? fa.l : fa.r); const cs = Math.cos(d.face + Math.PI / 2), sn = Math.sin(d.face + Math.PI / 2); dust(ctx, pos[j][0] + (fxp[0] * cs - fxp[1] * sn) * s, pos[j][1] + (fxp[0] * sn + fxp[1] * cs) * s, d.f * 0.7, '#d8c49a', 22); }
            if (d.kd === 'hop' && d.f > 0.2) dust(ctx, pos[j][0], pos[j][1] + 26, d.f * 0.9, '#d8c49a', 34);
          }
          void mf; void rot2; void mix; void hash; void vgrad; void rrect; void lighter; void darker; void rgrad; void rod; void skinHead; void hoop; void beatPhase; void clamp; void hgrad; void grain; void tubeShade;
        } };
    },
  }); },
});

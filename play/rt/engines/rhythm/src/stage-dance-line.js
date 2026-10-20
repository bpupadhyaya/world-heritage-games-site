// Line and formation dance stages (1.11.0), seen from above, no faces. Authored in a portrait frame and turned a quarter round on a wide screen.
//   poles (tinikling, Philippines): two long bamboo poles are beaten on the blocks and clapped together by two kneeling players while the dancer hops
//       between them. The poles open and close with the 3-beat cycle. Lanes: Tap (a pole on its block), Clap (the poles together), In and Out
//       (a foot between the poles, a foot outside them).
//   morris (Morris dance figures, England): two lines of three dancers face each other on the green with hankies; they advance, retire and cross.
//       Lanes in the aisle: Step, Hanky (a wave of the cloths), Clash (the sticks meet) and Caper (the jump).
//   indlamu (Zulu stomp-and-clap dance, South Africa): five dancers in a wedge with cowhide shields and sticks stamp bare-foot in unison. Lanes: Stomp,
//       Kick (the high kick), Shield (a strike on the shield) and Clap.
import { registerDanceStage } from './registry.js';
import { createSceneStage, eSpot, rectSpot, assignZones, dancerTop, dancePose, headwear, groundShadow, follow, nextLane, untilNext, beatPhase, maxFlash, bellStrap, rod, dust, orient } from './dance-kit.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU } from './dance-kit.js';
import { kerchief } from './art.js';
import { bamboo } from './instr-art.js';

const lerp = (a, b, t) => a + (b - a) * t;
const ss = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const SKINS = ['#e8b894', '#c98e63', '#d9a37a', '#a86a45', '#f0c8a4', '#b07048'];
const HAIRS = ['#2a1a12', '#6a4a2a', '#1a1210', '#8a6a3a', '#c8a45a', '#3a281c'];
const meterOf = (P, d = 3) => P.songs?.[P.song ?? 0]?.meter ?? d;

// ---- tinikling ---------------------------------------------------------------------------------------------------------------------------------
const POLE_ZONES = [['tap', /tap|block|beat/], ['clap', /clap|close|together/], ['in', /\bin\b|inside|between|hop in/], ['out', /\bout\b|outside|side|hop out/]];
registerDanceStage({
  id: 'poles', match: /tinikling|bamboo.?pole|pole.?hop|pole.?clap|bamboo.?dance/,
  build: (S, lanes, P) => { const zoneOf = []; return createSceneStage('poles', S, lanes, P, {
    dress: () => ({ kind: 'planks', base: '#6a4a2a', rugKind: 'zigzag', rugBase: '#2a1c14', rugA: '#c9a040', rugB: '#b8302a', light: '#ffe6b0', rugPad: -0.02 }),
    voiceOf: (i) => `dance-poles-${zoneOf[i] ?? 'tap'}`,
    build: (K) => {
      const W = 760, H = 1000, o = orient(K.tall, W, H), keyOf = assignZones(K, POLE_ZONES.map(([key, re]) => ({ key, re }))); for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      // 1.13.0: the rings stand in a lane beside the poles (Tap, Clap, In on the right, Out on the left) so no cue sits on a dancer; faint guides tie each ring to its place
      const by = { tap: [300, 300], clap: [300, 470], in: [300, 630], out: [-300, 630] }, at = { tap: [0, 300], clap: [0, 470], in: [0, 630], out: [-175, 630] }, spots = new Array(K.N).fill(null);
      for (let i = 0; i < K.N; i++) { const p = by[keyOf[i]]; if (p) { const [x, y] = o.pt(p[0], p[1]); spots[i] = eSpot(x, y, 66, 66, 0, { apk: 1 }); } }
      const meter = meterOf(P, 3), dancer = {};
      return { ref: o.ref, spots,
        draw(ctx, rt) {
          const fl = (k) => { let m = 0; for (let i = 0; i < K.N; i++) if (keyOf[i] === k) m = Math.max(m, rt.flash[i]); return m; };
          ctx.save(); o.apply(ctx);
          const ph = ((beatPhase(rt) % meter) + meter) % meter, openT = ph < meter - 1 ? 1 : ph < meter - 0.3 ? 1 - ss((ph - (meter - 1)) / 0.7) : ss((ph - (meter - 0.3)) / 0.3);
          const g = lerp(10, 80, openT) + fl('clap') * -6, clapF = Math.max(fl('clap'), 1 - openT > 0.9 ? 0.6 : 0), tapF = fl('tap');
          // two cross blocks of bamboo under the poles
          for (const y of [300, 720]) { const f = y === 300 ? tapF : tapF * 0.7; ctx.fillStyle = 'rgba(0,0,0,0.38)'; rrect(ctx, -250 + 8, y - 22 + 12, 500, 44, 18); ctx.fill(); bamboo(ctx, -250, y - 22, 250, y + 22, { base: '#b88a3c', nodes: [], seed: 5 + y }); void f; }
          // the holders: kneeling at each end, hands on the pole ends
          const holder = (y, face, n) => { groundShadow(ctx, 10, y + 16, 120, 76, 0.28); dancerTop(ctx, 0, y, 170, { face, shirt: n ? '#e8b84a' : '#2a58b8', bottom: '#2a2a3a', trim: '#f0f0e8', hat: 'hair', hair: n ? '#2a1a12' : '#1a1210', hairStyle: n ? 'bun' : 'short', skin: n ? '#c98e63' : '#b57a50', step: 0, bob: Math.max(tapF, clapF) * 0.6, handL: [-g, y + (face > 0 ? 70 : -70)], handR: [g, y + (face > 0 ? 70 : -70)] }); headwear(ctx, n ? 'flowers' : 'band', 0, y, 170, n ? '#c0392b' : '#f2efe6', '#e8b84a', Math.max(tapF, clapF) * 0.6, { face: face }); };
          holder(88, Math.PI / 2, 0); holder(912, -Math.PI / 2, 1);
          // the two poles
          for (const sg of [-1, 1]) { const x = sg * g; ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, x - 13 + 8, 170 + 14, 26, 680, 13); ctx.fill(); bamboo(ctx, x - 13, 170, x + 13, 850, { base: '#d6a84a', nodes: [330, 500, 670], seed: 11 + sg }); }
          if (clapF > 0.05) { ctx.fillStyle = `rgba(255,248,210,${0.7 * clapF})`; for (const y of [330, 500, 670]) { ell(ctx, 0, y, 22 + 30 * clapF, 8); ctx.fill(); } }
          // the dancer: hops between the poles; goes to the next lane's side (In: between, Out: beside, otherwise holds between)
          const nl = nextLane(rt), cl = (() => { let b = -1, bf = 0.05; for (let i = 0; i < K.N; i++) if (rt.flash[i] > bf) { bf = rt.flash[i]; b = i; } return b; })();
          const tl = untilNext(rt) < 0.45 && nl >= 0 ? nl : cl >= 0 ? cl : nl, tk = tl >= 0 ? keyOf[tl] : 'in', tp = (tk === 'in' || tk === 'out') ? at[tk] : [0, 630];
          follow(dancer, rt.anim, tp[0], tp[1], 10); const f = Math.max(fl('in'), fl('out'));
          // the poles close three times a cycle: the dancer is in the air then (feet up, shadow small); out beside the poles one foot steps over
          const air = ss((1 - openT) * 1.25), outside = dancer.x < -95, kind = outside ? 'step' : 'hop', pf = clamp(Math.max(f * 1.2, air), 0, 1);
          groundShadow(ctx, dancer.x + 8, dancer.y + 24, 100 * (1 - 0.15 * air), 70 * (1 - 0.15 * air), 0.28 * (1 - Math.max(f, air) * 0.4));
          const hop = (kind === 'hop' ? pf : 0), dy = dancer.y - hop * 14;
          const pose = dancePose(outside ? 'step' : 'hop', outside ? Math.max(0.55, f) : pf, { x: dancer.x, y: dy, s: 150, face: -Math.PI / 2, sg: 1 });
          dancerTop(ctx, dancer.x, dy, 150, { face: -Math.PI / 2, shirt: '#b8302a', bottom: '#f2efe6', skirt: true, skirtR: 0.4, trim: '#e8b84a', hat: 'hair', hair: '#1a1210', step: 0, bob: hop * 0.9 + (outside ? f * 0.5 : 0), handL: [pose.handL[0] - (outside ? 10 : 0), pose.handL[1]], handR: pose.handR, feet: pose.feet, twist: pose.twist, shoe: '#f2efe6' });
          headwear(ctx, 'flowers', dancer.x, dy, 150, '#1a1210', '#e8b84a', hop * 0.9 + (outside ? f * 0.5 : 0));
          // guides from each ring to its place on the poles
          for (let i = 0; i < K.N; i++) { const k = keyOf[i], a = by[k], b = at[k]; if (!a || !b) continue; ctx.strokeStyle = `rgba(255,236,190,${0.18 + 0.5 * rt.flash[i]})`; ctx.lineWidth = 2.5; ctx.setLineDash([7, 9]); ctx.beginPath(); ctx.moveTo(a[0] + (a[0] > 0 ? -66 : 66), a[1]); ctx.lineTo(b[0] + (b[0] > 0 ? 22 : 0), b[1]); ctx.stroke(); ctx.setLineDash([]); }
          ctx.restore();
          void rectSpot; void maxFlash; void bellStrap; void rod; void dust; void mix; void rgba; void lighter; void darker; void hgrad; void vgrad; void rgrad; void grain; void circ; void hash; void TAU; void kerchief;
        } };
    },
  }); },
});

// ---- Morris figures -----------------------------------------------------------------------------------------------------------------------------
const MOR_ZONES = [['step', /step|walk|foot|hop/], ['hanky', /hank|kerch|wave|cloth/], ['clash', /clash|stick|clack|hit/], ['caper', /caper|jump|leap|spring/]];
registerDanceStage({
  id: 'morris', match: /morris|cotswold|hey.?figure|hankie.?dance/,
  build: (S, lanes, P) => { const zoneOf = []; return createSceneStage('morris', S, lanes, P, {
    dress: () => ({ kind: 'meadow', base: '#3f6a34', light: '#fff4c8' }),
    voiceOf: (i) => `dance-morris-${zoneOf[i] ?? 'step'}`,
    build: (K) => {
      const W = 860, H = 1000, o = orient(K.tall, W, H), keyOf = assignZones(K, MOR_ZONES.map(([key, re]) => ({ key, re }))); for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const ys = { step: 340, hanky: 450, clash: 560, caper: 670 }, spots = new Array(K.N).fill(null);
      for (let i = 0; i < K.N; i++) { const [x, y] = o.pt(0, ys[keyOf[i]] ?? 500); spots[i] = eSpot(x, y, 52, 52, 0, { apk: 1 }); }
      return { ref: o.ref, spots,
        draw(ctx, rt) {
          const fl = (k) => { let m = 0; for (let i = 0; i < K.N; i++) if (keyOf[i] === k) m = Math.max(m, rt.flash[i]); return m; };
          const t = rt.anim, ph = beatPhase(rt), adv = 70 * (0.5 - 0.5 * Math.cos(TAU * ph / 8)), cap = fl('caper'), wav = Math.max(fl('hanky'), fl('step') * 0.4), clash = fl('clash'), any = maxFlash(rt, lanes.map((_, i) => i));
          ctx.save(); o.apply(ctx);
          // a ring of trodden grass and the chalk of the figure: a long oval path the lines will follow
          ctx.strokeStyle = 'rgba(255,255,240,0.14)'; ctx.lineWidth = 6; ctx.setLineDash([14, 14]); ell(ctx, 0, 500, 330, 330); ctx.stroke(); ctx.setLineDash([]);
          const cols = ['#c0392b', '#2a58b8', '#e8b84a', '#2a7a4a'];
          for (const side of [-1, 1]) for (let r = 0; r < 3; r++) {
            const x = side * (268 - adv), y = 290 + r * 210, o2 = { bob: 0.35 + cap * 0.8, step: Math.sin(t * 6 + r + side) };
            groundShadow(ctx, x + 10, y + 22, 108, 72, 0.26);
            // the dancer, then the baldric across the chest, the shin bells on both legs, a flowered boater and the hankies
            const dir = side < 0 ? 1 : -1, sc = 190, vi = r * 2 + (side > 0 ? 1 : 0);
            dancerTop(ctx, x, y, sc, { face: side < 0 ? 0 : Math.PI, shirt: '#f4f0e4', bottom: '#f4f0e4', trim: cols[r], vest: null, hat: 'hair', hair: HAIRS[vi % 6], skin: SKINS[vi % 6], hairStyle: vi % 3 === 0 ? 'short' : 'short', ...o2, handL: [x + side * 74, y - 80 - wav * 16], handR: [x + side * 74, y + 80 + wav * 16] });
            ctx.save(); ctx.strokeStyle = cols[(r + (side > 0 ? 2 : 0)) % 4]; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - dir * 0.12 * sc, y - 0.46 * sc); ctx.lineTo(x + dir * 0.12 * sc, y + 0.46 * sc); ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - dir * 0.12 * sc - 4, y - 0.46 * sc); ctx.lineTo(x + dir * 0.12 * sc - 4, y + 0.46 * sc); ctx.stroke(); ctx.restore();
            for (const sg of [-1, 1]) { const fy = y + sg * 0.17 * sc, fx0 = x + dir * 0.26 * sc; bellStrap(ctx, fx0, fy - 0.1 * sc, fx0, fy + 0.1 * sc, 5, any, t, 4.6); }
            headwear(ctx, 'flowers', x, y, sc, '#f2efe6', cols[(r + 1 + vi) % 4], o2.bob);
            kerchief(ctx, x + side * 74, y - 80 - wav * 16, 52 + 12 * wav, '#fbfaf2', t * (1 + wav * 1.5), side < 0 ? -0.5 : Math.PI + 0.5);
            kerchief(ctx, x + side * 74, y + 80 + wav * 16, 52 + 12 * wav, '#fbfaf2', t * (1 + wav * 1.5) + 1, side < 0 ? 0.5 : Math.PI - 0.5);
          }
          // the musician at the head of the set, seen from above: a melodeon between his hands, the bellows opening and closing with the tune
          { const mx = 0, my = 120, pump = 0.5 + 0.5 * Math.sin(t * 5), bw = 70 + pump * 36;
            groundShadow(ctx, mx + 10, my + 26, 130, 80, 0.28);
            dancerTop(ctx, mx, my, 170, { face: Math.PI / 2, shirt: '#8a2a2a', bottom: '#2a2a3a', trim: '#e8d890', hat: 'hair', hair: '#6a4a2a', skin: '#d9a37a', step: 0, bob: any * 0.5, handL: [mx - bw - 18, my + 78], handR: [mx + bw + 18, my + 78] });
            ctx.save(); ctx.translate(mx, my + 78);
            ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, -bw + 8, -28 + 12, 2 * bw, 56, 10); ctx.fill();
            for (const sg of [-1, 1]) { ctx.fillStyle = vgrad(ctx, -34, 34, [[0, '#6a2a14'], [0.5, '#a8643a'], [1, '#4a1c0c']]); rrect(ctx, sg > 0 ? bw - 24 : -bw, -34, 24, 68, 6); ctx.fill(); ctx.strokeStyle = 'rgba(255,224,170,0.5)'; ctx.lineWidth = 1.6; ctx.stroke(); for (let k = -2; k <= 2; k++) { ctx.fillStyle = '#e8d890'; circ(ctx, sg * (bw - 12), k * 12, 3.2); ctx.fill(); } }
            ctx.fillStyle = '#2a0e08'; ctx.fillRect(-bw + 24, -28, 2 * bw - 48, 56);
            ctx.strokeStyle = '#e8d8b0'; ctx.lineWidth = 3; for (let k = 0; k <= 8; k++) { const x = -bw + 24 + k * (2 * bw - 48) / 8; ctx.beginPath(); ctx.moveTo(x, -28); ctx.lineTo(x, 28); ctx.stroke(); }
            ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(-bw + 24, -28, 2 * bw - 48, 12);
            ctx.restore(); }
          // meadow flowers: daisies and buttercups scattered over the green
          for (let q = 0; q < 46; q++) { const fx = (hash(q * 3.1) - 0.5) * 760, fy = 40 + hash(q * 7.7) * 940; if (Math.abs(fx) < 250 && fy > 230 && fy < 770) continue; ctx.fillStyle = q % 3 === 0 ? '#ffe27a' : '#f8f4ea'; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; circ(ctx, fx + Math.cos(a) * 4.5, fy + Math.sin(a) * 4.5, 2.6); ctx.fill(); } ctx.fillStyle = '#d89a2a'; circ(ctx, fx, fy, 2); ctx.fill(); }
          // the sticks at the middle of the aisle, crossing and clashing
          for (const sg of [-1, 1]) rod(ctx, -78, 560 - sg * 30 + clash * sg * 18, 78, 560 + sg * 30 - clash * sg * 18, 13, '#b8854a', clash);
          if (clash > 0.1) { ctx.strokeStyle = `rgba(255,248,210,${clash})`; ctx.lineWidth = 3; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, r0 = 14 + (1 - clash) * 8, r1 = r0 + 16 * clash; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, 560 + Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, 560 + Math.sin(a) * r1); ctx.stroke(); } }
          ctx.restore();
          void rectSpot; void follow; void nextLane; void untilNext; void mix; void rgba; void lighter; void darker; void hgrad; void rgrad; void grain; void lerp; void dust;
        } };
    },
  }); },
});

// ---- indlamu --------------------------------------------------------------------------------------------------------------------------------
const IND_ZONES = [['stomp', /stomp|stamp|foot|thump/], ['kick', /kick|high|leg/], ['shield', /shield|isihlangu|strike|beat/], ['clap', /clap|hands/]];
function shield(ctx, x, y, s, f, seed) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.18 - f * 0.1);
  ctx.fillStyle = 'rgba(0,0,0,0.33)'; ell(ctx, 8, 12, s * 0.2, s * 0.37); ctx.fill();
  ctx.fillStyle = rgrad(ctx, -s * 0.05, -s * 0.12, 2, s * 0.4, [[0, '#f8f2e6'], [1, '#c9bfa8']]); ell(ctx, 0, 0, s * 0.2, s * 0.37); ctx.fill();
  ctx.save(); ell(ctx, 0, 0, s * 0.2, s * 0.37); ctx.clip();
  for (let k = 0; k < 6; k++) { ctx.fillStyle = hash(seed + k) > 0.5 ? '#1c1410' : '#7a4a2a'; ell(ctx, (hash(seed + k * 3) - 0.5) * s * 0.3, (hash(seed + k * 5) - 0.5) * s * 0.55, s * (0.04 + 0.05 * hash(k + seed)), s * (0.06 + 0.08 * hash(k * 2 + seed))); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ell(ctx, -s * 0.07, -s * 0.16, s * 0.07, s * 0.14); ctx.fill(); ctx.restore();
  ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 3; ell(ctx, 0, 0, s * 0.2, s * 0.37); ctx.stroke();
  ctx.strokeStyle = '#f4f0e0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -s * 0.42); ctx.lineTo(0, s * 0.42); ctx.stroke();   // the spine stick
  if (f > 0.1) { ctx.strokeStyle = `rgba(255,236,190,${f})`; ctx.lineWidth = 3; ell(ctx, 0, 0, s * (0.24 + 0.14 * (1 - f)), s * (0.41 + 0.14 * (1 - f))); ctx.stroke(); }
  ctx.restore();
}
registerDanceStage({
  id: 'indlamu', match: /indlamu|zulu.?dance|stomp.?and.?clap|isicathamiya|stomp.?dance/,
  build: (S, lanes, P) => { const zoneOf = []; return createSceneStage('indlamu', S, lanes, P, {
    dress: () => ({ kind: 'earth', base: '#a2763e', light: '#ffe6b0' }),
    voiceOf: (i) => `dance-indlamu-${zoneOf[i] ?? 'stomp'}`,
    build: (K) => {
      const W = 860, H = 980, o = orient(K.tall, W, H), keyOf = assignZones(K, IND_ZONES.map(([key, re]) => ({ key, re }))); for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const by = { stomp: [0, 850], kick: [210, 770], shield: [-210, 770], clap: [0, 400] }, spots = new Array(K.N).fill(null);
      for (let i = 0; i < K.N; i++) { const p = by[keyOf[i]]; const [x, y] = o.pt(p[0], p[1]); spots[i] = eSpot(x, y, 68, 68, 0, { apk: 1 }); }
      const pos = [[0, 660], [-190, 520], [190, 520], [-330, 390], [330, 390]];
      return { ref: o.ref, spots,
        draw(ctx, rt) {
          const fl = (k) => { let m = 0; for (let i = 0; i < K.N; i++) if (keyOf[i] === k) m = Math.max(m, rt.flash[i]); return m; };
          const t = rt.anim, st = fl('stomp'), kk = fl('kick'), sh = fl('shield'), cl = fl('clap'), any = Math.max(st, kk, sh, cl);
          ctx.save(); o.apply(ctx);
          // dust over the packed earth where the feet land
          dust(ctx, 0, 850, st, '#d8b878', 60); dust(ctx, 210, 770, kk, '#d8b878', 40);
          pos.forEach(([x, y], k) => {
            const lead = k === 0, s = lead ? 175 : 140, dy = -any * 6 - (lead ? kk * 10 : 0);
            groundShadow(ctx, x + 10, y + 26, s * 0.6, s * 0.42, 0.3);
            dancerTop(ctx, x, y + dy, s, { face: Math.PI / 2, shirt: '#8a5a3c', bottom: '#6a4a2a', trim: '#f4eedc', skirt: true, fur: true, skirtR: 0.58, skin: ['#8a5a3c', '#7a4a2c', '#9a6a44', '#6a4026', '#8a5a3c'][k], hat: 'hair', hair: '#32221a', bareArms: true, sleeve: '#8a5a3c', step: Math.sin(t * 8 + k) * Math.min(1, any * 2), bob: any * 0.8,
              handL: [x + s * 0.55, y + s * 0.26 + dy], handR: [x - s * 0.5, y + s * 0.36 + dy - cl * 0.15 * s] });
            headwear(ctx, 'band', x, y + dy, s, '#f4eedc', '#c0392b', any * 0.8, { face: Math.PI / 2, plume: true });
            shield(ctx, x + s * 0.7, y + s * 0.2 + dy, s * 1.05, lead ? sh : sh * 0.6, k * 7 + 3);
            rod(ctx, x - s * 0.5, y + s * 0.36 + dy, x - s * 0.68, y + s * 0.82 + dy, 8, '#7a4a22', 0);
          });
          if (cl > 0.1) { ctx.strokeStyle = `rgba(255,248,214,${cl})`; ctx.lineWidth = 3; for (let q = 0; q < 8; q++) { const a = q / 8 * TAU, r0 = 30 + (1 - cl) * 20, r1 = r0 + 18 * cl; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, 400 + Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, 400 + Math.sin(a) * r1); ctx.stroke(); } }
          ctx.restore();
          void rectSpot; void follow; void nextLane; void untilNext; void bellStrap; void mix; void rgba; void lighter; void darker; void hgrad; void vgrad; void grain; void circ; void lerp; void bamboo; void kerchief;
        } };
    },
  }); },
});

// Solo and pair dance stages (1.11.0), seen from above, no faces.
//   sword (Highland sword dance, Scotland): two swords laid crossed on a polished stage; the dancer, in a kilt, steps in the four spaces
//       between the blades and at the cross. A lane is a place on the floor; the dancer moves to the next place before the step falls due.
//   shoulder (eskista, Ethiopia): a dancer in a white shawl seen from above: shoulders, chest, back and neck each have a place. A struck
//       place jerks that part of the body.
//   palmas (flamenco): rhythmic hand-clapping. A wheel of the 12-beat compas turns beneath hand pads: sorda (cupped, hollow), clara (flat,
//       sharp), pitos (finger snaps) and golpe (a slap on the thigh). The accented beats of the compas are marked.
//   kathak (Indian classical dance footwork, tatkar): bare feet with ankle bells on a marble floor with a rangoli: right foot, left foot,
//       heels and a jump on both feet.
import { registerDanceStage } from './registry.js';
import { areaInDesign, createSceneStage, eSpot, rectSpot, assignZones, dancerTop, headwear, groundShadow, follow, nextLane, untilNext, beatPhase, maxFlash, bellStrap, tartan, dust } from './dance-kit.js';
import { clamp, mix, rgba, lighter, darker, hgrad, vgrad, rgrad, rrect, grain, circ, ell, hash, TAU, rot2 } from './dance-kit.js';
import { footprint, stepIcon, text } from './art.js';
import { hand } from './dancers.js';
import { eskistaFigure } from './figures-front.js';

const lerp = (a, b, t) => a + (b - a) * t;

// ---- Highland sword dance ----------------------------------------------------------------------------------------------------------------------
const SWORD_ZONES = [['top', /top|front|up|forward/], ['bottom', /bottom|back|down|behind/], ['left', /left/], ['right', /right/], ['center', /centre|center|cross|spring|high/]];
function sword(ctx, ang, len, hiltAtStart, f) {
  ctx.save(); ctx.rotate(ang);
  const w = 15, x0 = -len / 2, x1 = len / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.moveTo(x0 + 70, -w / 2 + 9); ctx.lineTo(x1, 9); ctx.lineTo(x0 + 70, w / 2 + 9); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x0 + 70, -w / 2); ctx.lineTo(x1 - 40, -w * 0.4); ctx.lineTo(x1, 0); ctx.lineTo(x1 - 40, w * 0.4); ctx.lineTo(x0 + 70, w / 2); ctx.closePath();
  ctx.fillStyle = vgrad(ctx, -w / 2, w / 2, [[0, '#f4f6fa'], [0.25, '#c8cdd6'], [0.5, '#8a909c'], [0.75, '#d6dbe3'], [1, '#6a707c']]); ctx.fill();
  ctx.strokeStyle = 'rgba(30,34,44,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x0 + 80, 0); ctx.lineTo(x1 - 50, 0); ctx.stroke();   // the fuller
  // basket hilt: a cage of bars, a grip, and a pommel
  ctx.save(); ctx.translate(x0, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, 36 + 6, 10, 38, 28); ctx.fill();
  ctx.fillStyle = vgrad(ctx, -30, 30, [[0, '#6a4a14'], [0.5, '#c9a040'], [1, '#5a3a0c']]); ell(ctx, 36, 0, 36, 28); ctx.fill();
  ctx.fillStyle = rgrad(ctx, 36, 0, 4, 30, [[0, '#0c0a08'], [1, '#2a2218']]); ell(ctx, 36, 0, 28, 21); ctx.fill();
  ctx.strokeStyle = '#d8b350'; ctx.lineWidth = 3.4; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(8, k * 6); ctx.quadraticCurveTo(36, k * 9, 64, k * 6); ctx.stroke(); }
  ctx.fillStyle = '#4a2a14'; rrect(ctx, -34, -5, 44, 10, 5); ctx.fill(); ctx.fillStyle = '#d8b350'; circ(ctx, -38, 0, 9); ctx.fill();
  ctx.restore();
  if (f > 0.05) { ctx.strokeStyle = `rgba(255,255,230,${0.8 * f})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-len * 0.25, 0); ctx.lineTo(len * 0.35, 0); ctx.stroke(); }
  ctx.restore(); void hiltAtStart;
}

// a ghillie brogue and its stocking, seen from above (toe up the screen): diced cream hose with a red garter flash, a black leather shoe with a pointed toe,
// a tongue, and the long laces that cross up the ankle. lift 0..1 raises the foot over the blade (bigger, with its shadow thrown further away).
function ghillie(ctx, x, y, s, lift, bx, by0) {
  const sc = 1 + 0.22 * lift;
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${0.3 - 0.1 * lift})`; ell(ctx, x + 5 + lift * 16, y + 8 + lift * 18, s * 0.19 * sc, s * 0.34 * sc); ctx.fill();
  // stocking from the hem down to the ankle
  const ax = x * 0.5 + bx * 0.5, ay = (y + by0) / 2 + s * 0.1;
  ctx.lineCap = 'round';
  for (const [w, c] of [[s * 0.2, '#b9b09a'], [s * 0.16, '#f0e9d6']]) { ctx.strokeStyle = c; ctx.lineWidth = w * sc; ctx.beginPath(); ctx.moveTo(bx + (x - bx) * 0.15, by0 - s * 0.2); ctx.lineTo(x, y + s * 0.16); ctx.stroke(); }
  ctx.save(); ctx.strokeStyle = 'rgba(160,30,30,0.7)'; ctx.lineWidth = 3; for (let k = 0; k < 5; k++) { const t = 0.2 + k * 0.15, px = bx + (x - bx) * t, py = by0 - s * 0.2 + (y + s * 0.16 - by0 + s * 0.2) * t; ctx.beginPath(); ctx.moveTo(px - s * 0.07, py - 4); ctx.lineTo(px + s * 0.07, py + 4); ctx.stroke(); } ctx.restore();
  ctx.fillStyle = '#b8201c'; ctx.beginPath(); ctx.ellipse(ax, ay, s * 0.1, s * 0.03, Math.atan2(y - by0, x - bx) + Math.PI / 2, 0, TAU); ctx.fill();   // garter flash
  // the shoe
  ctx.translate(x, y); ctx.scale(sc, sc);
  const w = s * 0.17, hh = s * 0.4;
  ctx.beginPath(); ctx.moveTo(0, -hh); ctx.bezierCurveTo(w * 0.9, -hh * 0.6, w * 1.1, hh * 0.1, w * 0.8, hh * 0.45); ctx.quadraticCurveTo(0, hh * 0.6, -w * 0.8, hh * 0.45); ctx.bezierCurveTo(-w * 1.1, hh * 0.1, -w * 0.9, -hh * 0.6, 0, -hh); ctx.closePath();
  ctx.fillStyle = rgrad(ctx, -w * 0.4, -hh * 0.4, 1, hh, [[0, '#6a5a52'], [0.35, '#241a16'], [1, '#0a0605']]); ctx.fill(); ctx.strokeStyle = 'rgba(255,240,220,0.35)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#12090a'; ctx.beginPath(); ctx.ellipse(0, hh * 0.05, w * 0.55, hh * 0.3, 0, 0, TAU); ctx.fill();   // the opening and the tongue
  ctx.strokeStyle = '#f4ecd8'; ctx.lineWidth = 2.4; for (let k = 0; k < 5; k++) { const yy = -hh * 0.1 + k * hh * 0.17; ctx.beginPath(); ctx.moveTo(-w * 0.55, yy); ctx.lineTo(w * 0.55, yy + hh * 0.1); ctx.moveTo(w * 0.55, yy); ctx.lineTo(-w * 0.55, yy + hh * 0.1); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,0.28)'; ell(ctx, -w * 0.35, -hh * 0.5, w * 0.18, hh * 0.22); ctx.fill();
  ctx.restore();
}

registerDanceStage({
  id: 'sword', match: /sword.?dance|gillie|highland|claymore|sabre.?dance|ghillie/,
  build: (S, lanes, P) => { const zoneOf = []; return createSceneStage('sword', S, lanes, P, {
    dress: () => ({ kind: 'planks', base: '#4a3020', rugKind: 'diamond', rugBase: '#16301f', rugA: '#c9a040', rugB: '#7a1c1c', light: '#fff0d0' }),
    voiceOf: (i) => `dance-sword-${zoneOf[i] ?? 'top'}`,
    build: (K) => {
      // 1.13.0: the whole dancer walks the floor: her FEET land in the ring (a foot lifts over the blade at each cue) and the body stands behind it, so
      // the rings are never under a torso. Wide screens get a wide floor (tartan border, a gold dance circle) instead of empty planks.
      const sc = K.tall ? 1 : 0.76, ref = K.tall ? { w: 840, h: 880 } : { w: 1180, h: 660 }, cx = 0, cy = ref.h / 2;
      const keyOf = assignZones(K, SWORD_ZONES.map(([key, re]) => ({ key, re }))); for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const by = { top: [0, -170], bottom: [0, 150], left: [-250, 0], right: [250, 0], center: [0, 0] };
      const spots = new Array(K.N).fill(null);
      for (let i = 0; i < K.N; i++) { const p = by[keyOf[i]]; if (p) spots[i] = eSpot(cx + p[0] * sc, cy + p[1] * sc, (keyOf[i] === 'center' ? 56 : 70) * sc, (keyOf[i] === 'center' ? 56 : 70) * sc, 0, { apk: 1, extra: { noFill: true } }); }
      const dancer = {}, S0 = 210 * sc, OFF = 128 * sc;
      return { ref, spots,
        draw(ctx, rt) {
          const fl = (k) => { let m = 0; for (let i = 0; i < K.N; i++) if (keyOf[i] === k) m = Math.max(m, rt.flash[i]); return m; };
          const t = rt.anim;
          // the floor: a tartan border, a gold dance circle and a star of inlay round the crossed swords
          ctx.save(); ctx.beginPath(); ctx.rect(-ref.w / 2, 0, ref.w, ref.h); ctx.clip();
          ctx.globalAlpha = 0.5; ctx.save(); ctx.beginPath(); ctx.rect(-ref.w / 2 + 14, 14, ref.w - 28, ref.h - 28); ctx.rect(-ref.w / 2 + 52, 52, ref.w - 104, ref.h - 104); ctx.clip('evenodd'); tartan(ctx, -ref.w / 2, 0, ref.w / 2, ref.h, '#1f4a2a', '#8a1c1c', '#e8d890', 26); ctx.restore(); ctx.globalAlpha = 1;
          ctx.strokeStyle = 'rgba(232,196,96,0.55)'; ctx.lineWidth = 3; ctx.strokeRect(-ref.w / 2 + 14, 14, ref.w - 28, ref.h - 28); ctx.strokeRect(-ref.w / 2 + 52, 52, ref.w - 104, ref.h - 104);
          ctx.strokeStyle = 'rgba(232,196,96,0.34)'; ctx.lineWidth = 4; circ(ctx, cx, cy, 330 * sc); ctx.stroke(); ctx.lineWidth = 2; circ(ctx, cx, cy, 306 * sc); ctx.stroke();
          for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; ctx.fillStyle = k % 2 ? 'rgba(232,196,96,0.5)' : 'rgba(200,60,50,0.5)'; circ(ctx, cx + Math.cos(a) * 318 * sc, cy + Math.sin(a) * 318 * sc, 4.5 * sc); ctx.fill(); }
          // polished boards catch the lamp: a soft reflection under the dancer's area
          ctx.fillStyle = rgrad(ctx, cx - 60 * sc, cy - 120 * sc, 0, 360 * sc, [[0, 'rgba(255,240,200,0.16)'], [1, 'rgba(255,240,200,0)']]); ctx.fillRect(-ref.w / 2, 0, ref.w, ref.h);
          ctx.restore();
          // the swords, crossed on the boards
          ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); sword(ctx, 0.5, 640, true, fl('center')); sword(ctx, -0.5 + Math.PI, 640, true, fl('center')); ctx.restore();
          // where the dancer will be: the next lane's place (or where she is)
          const nl = nextLane(rt), cur = (() => { let b = -1, bf = 0.05; for (let i = 0; i < K.N; i++) if (rt.flash[i] > bf) { bf = rt.flash[i]; b = i; } return b; })();
          const tgtLane = untilNext(rt) < 0.5 && nl >= 0 ? nl : cur >= 0 ? cur : nl;
          const tp = tgtLane >= 0 && spots[tgtLane] ? [spots[tgtLane].v, spots[tgtLane].u] : [cx, cy + 120 * sc];
          follow(dancer, rt.anim, tp[0], tp[1], 7);
          const flash = Math.max(...lanes.map((_, i) => rt.flash[i])), fx0 = dancer.x, fy0 = dancer.y;   // (fx0, fy0) = where the feet land
          const bx = fx0, by0 = fy0 + OFF, side = Math.floor(rt.clock / Math.max(0.2, rt.spb)) % 2 ? 1 : -1;
          groundShadow(ctx, bx + 12 * sc, by0 + 26 * sc, 140 * sc, 100 * sc, 0.32);
          // feet: the working foot rises over the blade (bigger, pointed toe, its shadow thrown away) while the other bears the weight; arms curve overhead (the high position)
          const lf = flash, wk = side > 0 ? 1 : -1;
          for (const d of [-1, 1]) ghillie(ctx, fx0 + d * 0.16 * S0 + (d === wk ? d * 0.04 * S0 * lf : 0), fy0 - (d === wk ? 0.1 * S0 * lf : 0), S0, d === wk ? lf : 0, bx, by0);
          dancerTop(ctx, bx, by0, S0, { face: -Math.PI / 2, shirt: '#1f2a4a', bottom: '#1f5a30', trim: '#d9b04a', skirt: true, skirtR: 0.43, noShoes: true, hat: 'hair', hair: '#3a2418', skin: '#e8b894', step: 0, bob: flash * 0.5,
            handL: [bx - 0.62 * S0, by0 - 0.58 * S0 - flash * 14 * sc], handR: [bx + 0.62 * S0, by0 - 0.58 * S0 - flash * 14 * sc] });
          // the tartan of the kilt over the pleats (the part of the skirt behind and beside the torso)
          const sk = S0 * 0.43;
          ctx.save(); ctx.beginPath(); ctx.rect(bx - S0, by0 - 0.08 * S0, 2 * S0, S0); ctx.clip();
          ctx.beginPath(); ctx.arc(bx, by0 + 0.03 * S0, sk, 0, TAU); ctx.rect(bx - 0.49 * S0, by0 - 0.26 * S0, 0.98 * S0, 0.52 * S0); ctx.clip('evenodd'); ctx.globalAlpha = 0.65; tartan(ctx, bx - S0, by0 - S0, bx + S0, by0 + S0, '#1f4a2a', '#8a1c1c', '#e8d890', 20 * sc); ctx.restore();
          headwear(ctx, 'bonnet', bx, by0, S0, '#1c2a58', '#c0392b', flash * 0.5);
          dust(ctx, fx0, fy0 + 10 * sc, flash, '#e8d8b8', 40 * sc);
          void rectSpot; void beatPhase; void maxFlash; void bellStrap; void mix; void lighter; void darker; void hgrad; void grain; void hash; void rot2; void lerp; void clamp; void rgba;
        } };
    },
  }); },
});

// ---- eskista (shoulder dance) -------------------------------------------------------------------------------------------------------------------
const SH_ZONES = [['bk', /back|behind|bottom/], ['ls', /left/], ['rs', /right/], ['ch', /chest|front|pop|breast/], ['nk', /neck|head|roll/]];
registerDanceStage({
  id: 'shoulder', match: /eskista|shoulder.?dance|ethiopian|tigrigna|amhara/,
  build: (S, lanes, P) => { const zoneOf = []; return createSceneStage('shoulder', S, lanes, P, {
    dress: () => ({ kind: 'planks', base: '#3a2418', rugKind: 'diamond', rugBase: '#5a2a1e', rugA: '#d9b04a', rugB: '#1f5a3a', light: '#ffe6b8', rugPad: -0.03 }),
    voiceOf: (i) => `dance-shoulder-${zoneOf[i] ?? 'ls'}`,
    build: (K) => {
      // 1.13.0: a three-quarter figure (front view, turned a little) so the isolations read: a struck shoulder rises and rolls, the chest swells, both shoulders pull back
      // on a Back strike, the head slides sideways on a Neck strike. The rings stand in columns beside her, never on the body.
      const tall = K.tall, ref = tall ? { w: 760, h: 940 } : { w: 1180, h: 640 }, k = tall ? 1 : 0.72, fy = tall ? 118 : 56;
      const keyOf = assignZones(K, SH_ZONES.map(([key, re]) => ({ key, re }))); for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const RR = tall ? 58 : 52;
      const by = tall ? { nk: [0, 58], ls: [-286, 322], rs: [286, 322], ch: [-286, 500], bk: [286, 500] } : { nk: [-430, 120], ls: [-430, 270], ch: [-430, 420], rs: [430, 270], bk: [430, 420] };
      const spots = new Array(K.N).fill(null);
      for (let i = 0; i < K.N; i++) { const p = by[keyOf[i]]; if (p) spots[i] = eSpot(p[0], p[1], RR, RR, 0, { apk: 1 }); }
      let dir = 1, lastN = 0;
      return { ref, spots,
        draw(ctx, rt) {
          const fl = (key) => { let m = 0; for (let i = 0; i < K.N; i++) if (keyOf[i] === key) m = Math.max(m, rt.flash[i]); return m; };
          let L = fl('ls'), Rr = fl('rs'), C = fl('ch'), B = fl('bk'), N = fl('nk');
          if (N > lastN + 0.2) dir = -dir; lastN = N;
          // between cues she keeps the soft alternating shake that eskista never stops
          const t = rt.anim, shake = Math.sin(t * 9), idle = 0.16;
          L = Math.max(L, idle * Math.max(0, shake)); Rr = Math.max(Rr, idle * Math.max(0, -shake));
          ctx.save(); ctx.translate(0, fy); ctx.scale(k, k);
          // a pool of lamp light behind her, so the white dress separates from the boards
          ctx.fillStyle = rgrad(ctx, 0, 330, 20, 420, [[0, 'rgba(255,226,170,0.28)'], [1, 'rgba(255,226,170,0)']]); ctx.fillRect(-460, -100, 920, 900);
          eskistaFigure(ctx, { L, R: Rr, C, B, N, t, dir });
          ctx.restore();
          // guides from each ring to the part it moves
          const tgt = { ls: [-120, 200], rs: [120, 200], ch: [0, 300], bk: [0, 262], nk: [0, 100] };
          for (let i = 0; i < K.N; i++) { const key = keyOf[i], a = by[key], b = tgt[key]; if (!a || !b) continue; const bx = b[0] * k, bY = fy + b[1] * k; const f = rt.flash[i]; ctx.strokeStyle = `rgba(255,236,190,${0.16 + 0.55 * f})`; ctx.lineWidth = 2.5; ctx.setLineDash([7, 9]); ctx.beginPath(); ctx.moveTo(a[0] + (bx > a[0] ? RR : -RR) * (key === 'nk' ? 0 : 1), a[1] + (key === 'nk' ? RR : 0)); ctx.lineTo(bx, bY); ctx.stroke(); ctx.setLineDash([]); }
          void clamp; void mix; void rgba; void lighter; void darker; void vgrad; void grain; void hash; void lerp; void rot2; void stepIcon; void text; void footprint; void hand;
        } };
    },
  }); },
});

// ---- flamenco palmas -------------------------------------------------------------------------------------------------------------------------
const PAL_ZONES = [['golpe', /golpe|thigh|knee|slap/], ['sorda', /sorda|hollow|cup|low/], ['clara', /clara|sharp|flat|high/], ['pitos', /pito|snap|finger|click/]];

// real hands for the palmas pads (seen from above, lit from the upper left): two cupped hands (sorda: hollow), two flat hands (clara: sharp), one hand with a
// snapping thumb and finger (pitos) and a hand slapping the thigh (golpe). f = 0..1 how recently the pad was struck: the hands travel together as f falls.
function palmasHands(ctx, k, x, y, f, t) {
  const g = 1 - f, SK = '#e2b48a', SK2 = '#c98e63';
  ctx.save(); ctx.translate(x, y);
  if (k === 'golpe') {
    // a thigh in dark trousers: the cloth over the knee with a seam and soft folds, the open hand coming down from above
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, -70, -34 + 10, 150, 82, 30); ctx.fill();
    ctx.fillStyle = vgrad(ctx, -40, 50, [[0, '#4a4a58'], [0.5, '#2e2e3a'], [1, '#1a1a22']]); rrect(ctx, -76, -40, 152, 86, 30); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; for (let q = -2; q <= 2; q++) { ctx.beginPath(); ctx.moveTo(-60, q * 14); ctx.quadraticCurveTo(0, q * 14 + 8, 62, q * 14 - 2); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-70, 38); ctx.lineTo(70, 38); ctx.stroke();
    ctx.fillStyle = rgrad(ctx, -20, -20, 0, 60, [[0, 'rgba(255,255,255,0.14)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-76, -40, 152, 86);
    hand(ctx, -50 + 10 * f, -64 + 48 * f - g * 14, 0.35, 150, { skin: SK, open: 0.35 - 0.2 * f, side: 1, curl: 0.0 });
    if (f > 0.1) { ctx.fillStyle = `rgba(255,255,255,${0.35 * f})`; ell(ctx, 4, 6, 70 * f + 20, 24 * f + 10); ctx.fill(); }
  } else if (k === 'pitos') {
    // the left hand held up, the right snapping: thumb and middle finger meet, a bright snap mark on the release
    hand(ctx, -46, 40, -1.35, 140, { skin: SK, open: 0.3, side: 1, curl: 0.18 });
    hand(ctx, 34, 30 + g * 8, -1.75, 150, { skin: SK2, open: 0.18 + 0.4 * f, side: -1, curl: 0.62 - 0.5 * f });
    if (f > 0.08) { ctx.strokeStyle = `rgba(255,244,190,${0.9 * f})`; ctx.lineWidth = 3; ctx.lineCap = 'round'; for (let q = 0; q < 5; q++) { const a = -Math.PI / 2 + (q - 2) * 0.42, r0 = 52 + (1 - f) * 12, r1 = r0 + 18 * f; ctx.beginPath(); ctx.moveTo(18 + Math.cos(a) * r0, -30 + Math.sin(a) * r0 * 0.7); ctx.lineTo(18 + Math.cos(a) * r1, -30 + Math.sin(a) * r1 * 0.7); ctx.stroke(); } }
  } else {
    const cupped = k === 'sorda', gap = 74 * g * g + (cupped ? 16 : 6) * g, cur = cupped ? 0.72 : 0.0, op = cupped ? 0.0 : 0.18;
    // two hands meeting along the middle: the cupped ones crossed a little (hollow between), the flat ones almost aligned
    hand(ctx, -gap - 22, cupped ? 10 : 6, cupped ? -0.12 : -0.04, 128, { skin: SK, open: op, side: 1, curl: cur });
    hand(ctx, gap + 22, cupped ? -8 : -4, Math.PI + (cupped ? -0.1 : 0.03), 128, { skin: SK2, open: op, side: -1, curl: cur });
    if (f > 0.06) { ctx.fillStyle = `rgba(255,248,214,${0.55 * f})`; ell(ctx, 0, 0, 14 + 24 * f, 38 + 10 * f); ctx.fill(); }
  }
  ctx.restore();
}

registerDanceStage({
  id: 'palmas', match: /palmas|flamenco|clapping|hand.?clap|compas|jaleo/,
  build: (S, lanes, P) => { const zoneOf = []; return createSceneStage('palmas', S, lanes, P, {
    dress: () => ({ kind: 'planks', base: '#2e1c14', light: '#ffd8a0', vig: 0.65 }),
    voiceOf: (i) => `dance-palmas-${zoneOf[i] ?? 'clara'}`,
    build: (K) => {
      const tall = K.tall, ref = tall ? { w: 760, h: 1000 } : { w: 1180, h: 600 };
      const keyOf = assignZones(K, PAL_ZONES.map(([key, re]) => ({ key, re }))); for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      // 1.13.0: bigger pads that fill the free area (a 2 x 2 grid), every ring inside the frame in both orientations
      const wc = tall ? [0, 236] : [-335, 300], WR = tall ? 180 : 205, PR = tall ? 122 : 136;
      const pad = (k) => { const r = ['sorda', 'clara', 'pitos', 'golpe'].indexOf(k); return tall ? [(r % 2 ? 1 : -1) * 172, 590 + Math.floor(r / 2) * 250] : [125 + (r % 2) * 290, 158 + Math.floor(r / 2) * 284]; };
      const spots = new Array(K.N).fill(null);
      for (let i = 0; i < K.N; i++) { const p = pad(keyOf[i]); spots[i] = eSpot(p[0], p[1], PR * 0.82, PR * 0.82, 0, { oy: PR * 0.72, ap: { cx: p[0], cy: p[1], rx: PR * 0.58, ry: PR * 0.58, rot: 0 }, extra: { noFill: true } }); }
      const songLen = Math.max(2, P.songs?.[P.song ?? 0]?.length ?? 12);
      return { ref, spots,
        draw(ctx, rt) {
          const t = rt.anim, ph = ((beatPhase(rt) % songLen) + songLen) % songLen, [wx, wy] = wc, n = songLen > 14 ? 12 : songLen;
          // the tablao: an embroidered shawl laid under the pads (silk, roses, a fringe), a cone of stage light and the sheen of polished boards
          { const pxs = ['sorda', 'clara', 'pitos', 'golpe'].map(pad), x0 = Math.min(...pxs.map((q) => q[0])) - PR - 26, x1 = Math.max(...pxs.map((q) => q[0])) + PR + 26, y0 = Math.min(...pxs.map((q) => q[1])) - PR - 26, y1 = Math.max(...pxs.map((q) => q[1])) + PR + 26;
            ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(ctx, x0 + 10, y0 + 14, x1 - x0, y1 - y0, 26); ctx.fill();
            ctx.save(); rrect(ctx, x0, y0, x1 - x0, y1 - y0, 26); ctx.clip();
            ctx.fillStyle = rgrad(ctx, (x0 + x1) / 2 - 80, y0 + 60, 20, Math.max(x1 - x0, y1 - y0), [[0, '#9a2a2c'], [0.6, '#6a1618'], [1, '#3e0a0e']]); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
            for (let k = 0; k < 34; k++) { const rx0 = x0 + hash(k * 1.3 + 4) * (x1 - x0), ry0 = y0 + hash(k * 2.1 + 9) * (y1 - y0), rr = 12 + hash(k + 2) * 16; for (let q = 0; q < 6; q++) { const a = q / 6 * TAU; ctx.fillStyle = rgba(k % 3 ? '#e8b84a' : '#d8786a', 0.22); circ(ctx, rx0 + Math.cos(a) * rr * 0.55, ry0 + Math.sin(a) * rr * 0.55, rr * 0.4); ctx.fill(); } ctx.fillStyle = rgba('#f4d890', 0.3); circ(ctx, rx0, ry0, rr * 0.2); ctx.fill(); }
            ctx.strokeStyle = 'rgba(232,184,74,0.55)'; ctx.lineWidth = 4; rrect(ctx, x0 + 12, y0 + 12, x1 - x0 - 24, y1 - y0 - 24, 18); ctx.stroke();
            ctx.restore();
            ctx.strokeStyle = 'rgba(232,200,120,0.7)'; ctx.lineWidth = 2; for (let q = x0 + 10; q < x1 - 6; q += 11) { ctx.beginPath(); ctx.moveTo(q, y1); ctx.lineTo(q + 2, y1 + 15); ctx.stroke(); ctx.beginPath(); ctx.moveTo(q, y0); ctx.lineTo(q + 2, y0 - 15); ctx.stroke(); } }
          ctx.fillStyle = rgrad(ctx, 0, 40, 10, 700, [[0, 'rgba(255,226,170,0.18)'], [1, 'rgba(255,226,170,0)']]); ctx.fillRect(-ref.w / 2, 0, ref.w, ref.h);
          // the wheel of the compas: n beats round a gilded ring, accented beats (3 6 8 10 12 of twelve) as bigger gold studs
          ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, wx + 10, wy + 16, WR + 24); ctx.fill();
          ctx.fillStyle = rgrad(ctx, wx - WR * 0.3, wy - WR * 0.3, WR * 0.2, WR + 26, [[0, '#6a3a22'], [0.7, '#3e2214'], [1, '#2a160c']]); circ(ctx, wx, wy, WR + 22); ctx.fill();
          ctx.strokeStyle = 'rgba(255,214,150,0.5)'; ctx.lineWidth = 3; circ(ctx, wx, wy, WR + 20); ctx.stroke(); circ(ctx, wx, wy, WR * 0.62); ctx.stroke();
          const accents = n === 12 ? [3, 6, 8, 10, 12] : [];
          for (let b = 1; b <= n; b++) {
            const a = -Math.PI / 2 + (b - 1) / n * TAU, acc = accents.includes(b), x = wx + Math.cos(a) * WR * 0.82, y = wy + Math.sin(a) * WR * 0.82, r = acc ? 20 : 12;
            const dist = ((ph - (b - 1)) % n + n) % n, lit = Math.max(0, 1 - dist * 2.2);
            ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, x + 2, y + 3, r); ctx.fill();
            ctx.fillStyle = rgrad(ctx, x - r * 0.3, y - r * 0.3, 0, r * 1.2, [[0, lit > 0.05 ? '#fff6d0' : acc ? '#fff0b0' : '#d8c8a8'], [0.6, acc ? '#d9a63a' : '#a8946a'], [1, acc ? '#6a4a14' : '#4a3a24']]); circ(ctx, x, y, r); ctx.fill();
            if (lit > 0.05) { ctx.fillStyle = `rgba(255,236,170,${0.6 * lit})`; circ(ctx, x, y, r * (1.4 + lit)); ctx.fill(); }
            text(ctx, String(b), wx + Math.cos(a) * WR * 0.5, wy + Math.sin(a) * WR * 0.5, acc ? 24 : 17, acc ? '#f0c860' : 'rgba(255,240,210,0.6)', { weight: acc ? '900' : '700' });
          }
          // the sweeping marker
          const ma = -Math.PI / 2 + (ph / n) * TAU; ctx.strokeStyle = 'rgba(255,214,120,0.8)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(wx + Math.cos(ma) * WR * 0.66, wy + Math.sin(ma) * WR * 0.66); ctx.lineTo(wx + Math.cos(ma) * WR * 0.94, wy + Math.sin(ma) * WR * 0.94); ctx.stroke();
          // the hand pads
          ['sorda', 'clara', 'pitos', 'golpe'].forEach((k) => {
            if (!keyOf.includes(k)) return; const [x, y] = pad(k); let f = 0; for (let i = 0; i < K.N; i++) if (keyOf[i] === k) f = Math.max(f, rt.flash[i]);
            ctx.fillStyle = 'rgba(0,0,0,0.38)'; circ(ctx, x + 6, y + 10, PR + 2); ctx.fill();
            ctx.fillStyle = rgrad(ctx, x - 30, y - 30, 10, PR + 12, [[0, '#7a4a2e'], [1, '#2a140a']]); circ(ctx, x, y, PR); ctx.fill();
            ctx.strokeStyle = 'rgba(255,214,150,0.45)'; ctx.lineWidth = 3; circ(ctx, x, y, PR - 2); ctx.stroke();
            ctx.save(); ctx.translate(x, y); ctx.scale(PR / 126, PR / 126); ctx.translate(-x, -y); palmasHands(ctx, k, x, y, f, t); ctx.restore();
            if (f > 0.05) { ctx.strokeStyle = `rgba(255,236,170,${0.8 * f})`; ctx.lineWidth = 3; for (let q = 0; q < 8; q++) { const a = q / 8 * TAU, r0 = PR * 0.66 + (1 - f) * 12, r1 = r0 + 16 * f; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); ctx.stroke(); } }
          });
          void t; void clamp; void mix; void lighter; void darker; void vgrad; void hgrad; void grain; void lerp; void rot2; void ell; void footprint; void rectSpot;
        } };
    },
  }); },
});

// ---- kathak footwork ---------------------------------------------------------------------------------------------------------------------------
const KA_ZONES = [['both', /dha|both|jump|chakkar|spring/], ['heel', /tat|heel|that\b/], ['left', /thei|left|tit|thun/], ['right', /ta\b|right|tha\b|tei/]];
registerDanceStage({
  id: 'kathak', match: /kathak|tatkar|ghungroo|ghungru|ankle.?bell|footwork/,
  build: (S, lanes, P) => { const zoneOf = []; return createSceneStage('kathak', S, lanes, P, {
    dress: () => ({ kind: 'tiles', base: '#3a262c', accent: '#8a6a4a', size: 120, light: '#ffe2b8' }),
    voiceOf: (i) => `dance-kathak-${zoneOf[i] ?? 'right'}`,
    build: (K) => {
      const ref = { w: 760, h: 900 }, cx = 0, cy = 450;
      const keyOf = assignZones(K, KA_ZONES.map(([key, re]) => ({ key, re }))); for (let i = 0; i < K.N; i++) zoneOf[i] = keyOf[i];
      const by = { left: [-135, 400], right: [135, 385], heel: [0, 720], both: [0, 170] };
      const spots = new Array(K.N).fill(null);
      for (let i = 0; i < K.N; i++) { const p = by[keyOf[i]]; if (p) spots[i] = eSpot(cx + p[0], p[1], keyOf[i] === 'both' ? 130 : keyOf[i] === 'heel' ? 120 : 88, keyOf[i] === 'both' ? 56 : keyOf[i] === 'heel' ? 48 : 140, 0, { apk: 1 }); }
      return { ref, spots,
        draw(ctx, rt, G) {
          const fl = (k) => { let m = 0; for (let i = 0; i < K.N; i++) if (keyOf[i] === k) m = Math.max(m, rt.flash[i]); return m; };
          const FL = Math.max(fl('left'), fl('both') * 0.9), FR = Math.max(fl('right'), fl('both') * 0.9), FH = fl('heel'), t = rt.anim;
          // marble floor: big slabs with bevelled joints, long soft veins and a lamp reflection (the plain tile of the dress shows only outside the stage)
          const AR = areaInDesign(ctx, G?.F, { w: 780, h: 900 }), mx0 = Math.min(-390, AR.x0), mx1 = Math.max(390, AR.x1), my0 = Math.min(0, AR.y0), my1 = Math.max(900, AR.y1);
          ctx.save(); ctx.beginPath(); ctx.rect(mx0, my0, mx1 - mx0, my1 - my0); ctx.clip();
          ctx.fillStyle = vgrad(ctx, my0, my1, [[0, '#a9998e'], [0.5, '#bcada0'], [1, '#9c8c82']]); ctx.fillRect(mx0, my0, mx1 - mx0, my1 - my0);
          const c0 = Math.floor((mx0 + 95) / 190) - 1, c1 = Math.ceil((mx1 + 95) / 190) + 1;
          for (let r = -1; r < 6; r++) for (let c = c0; c < c1; c++) { const x = c * 190 - 95 + (r % 2) * 95, y = r * 190 - 20, tone = hash(r * 7 + c * 3 + 2); ctx.fillStyle = `rgba(${tone > 0.5 ? '255,244,230' : '70,50,44'},${0.06 + 0.1 * Math.abs(tone - 0.5)})`; ctx.fillRect(x, y, 190, 190); }
          ctx.strokeStyle = 'rgba(96,74,66,0.34)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
          for (let k = 0; k < 40; k++) { const x0 = mx0 + hash(k * 1.7) * (mx1 - mx0), y0 = my0 + hash(k * 2.9 + 1) * (my1 - my0), ln = 90 + hash(k + 5) * 190, an = 0.6 + hash(k + 9) * 0.5; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + Math.cos(an) * ln * 0.5 + 14 * (hash(k + 3) - 0.5) * 3, y0 + Math.sin(an) * ln * 0.5, x0 + Math.cos(an) * ln, y0 + Math.sin(an) * ln); ctx.stroke(); }
          ctx.strokeStyle = 'rgba(120,96,88,0.14)'; ctx.lineWidth = 5; for (let k = 0; k < 12; k++) { const x0 = mx0 + hash(k * 3.3) * (mx1 - mx0), y0 = my0 + hash(k * 4.1) * (my1 - my0); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + 70, y0 + 90, x0 + 20, y0 + 220); ctx.stroke(); }
          ctx.strokeStyle = 'rgba(52,38,36,0.55)'; ctx.lineWidth = 2.4; for (let r = -1; r <= 6; r++) { ctx.beginPath(); ctx.moveTo(mx0, r * 190 - 20); ctx.lineTo(mx1, r * 190 - 20); ctx.stroke(); }
          for (let r = -1; r < 6; r++) for (let c = c0; c < c1; c++) { const x = c * 190 + (r % 2) * 95; ctx.beginPath(); ctx.moveTo(x, r * 190 - 20); ctx.lineTo(x, r * 190 + 170); ctx.stroke(); }
          ctx.strokeStyle = 'rgba(255,248,236,0.3)'; ctx.lineWidth = 1.4; for (let r = -1; r <= 6; r++) { ctx.beginPath(); ctx.moveTo(mx0, r * 190 - 18); ctx.lineTo(mx1, r * 190 - 18); ctx.stroke(); }
          ctx.fillStyle = rgrad(ctx, 0, 330, 10, 560, [[0, 'rgba(255,236,196,0.34)'], [0.6, 'rgba(255,236,196,0.08)'], [1, 'rgba(255,236,196,0)']]); ctx.fillRect(mx0, my0, mx1 - mx0, my1 - my0);
          ctx.fillStyle = rgrad(ctx, 0, 450, 300, Math.max(mx1 - mx0, my1 - my0) * 0.7, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(20,10,10,0.38)']]); ctx.fillRect(mx0, my0, mx1 - mx0, my1 - my0);
          ctx.restore();
          // a calm rangoli of coloured powder: three even rings of petals round a lotus, thin gold circles between them
          ctx.save(); ctx.translate(cx, 450); ctx.globalAlpha = 0.3;
          const cols = ['#c9602b', '#d9a63a', '#a8322a', '#f4eee0'];
          for (const [Rr2, n, pw, pl] of [[300, 16, 11, 26], [226, 12, 11, 24], [152, 8, 12, 24]]) { for (let k = 0; k < n; k++) { const a = k / n * TAU - Math.PI / 2; ctx.fillStyle = cols[k % 4]; ctx.beginPath(); ctx.ellipse(Math.cos(a) * Rr2, Math.sin(a) * Rr2, pw, pl, a + Math.PI / 2, 0, TAU); ctx.fill(); } }
          ctx.globalAlpha = 0.34; ctx.strokeStyle = '#b8902c'; ctx.lineWidth = 2.4; for (const r of [338, 263, 189, 112]) { circ(ctx, 0, 0, r); ctx.stroke(); }
          ctx.globalAlpha = 0.34; ctx.fillStyle = '#a8322a'; circ(ctx, 0, 0, 40); ctx.fill(); ctx.fillStyle = '#d9a63a'; circ(ctx, 0, 0, 22); ctx.fill();
          ctx.globalAlpha = 1; ctx.restore();
          // feet: skin with a red border of alta, ankle straps of bells (life-size relative to the floor)
          const SC = 126;
          const foot = (x, y, left, f, rot) => {
            ctx.save(); ctx.translate(x, y + f * 6); ctx.rotate(rot);
            groundShadow(ctx, 16, 30, SC * 0.78, SC * 1.2, 0.3 * (1 - f * 0.5));
            footprint(ctx, 0, 0, SC * 1.06 * (1 - f * 0.03), left, '#a8261c', null, 1);
            footprint(ctx, 0, 0, SC * (1 - f * 0.03), left, '#c58a5c', null, 1);
            ctx.fillStyle = 'rgba(255,230,190,0.22)'; ell(ctx, left ? -14 : 14, -SC * 0.33, SC * 0.26, SC * 0.58); ctx.fill();
            // the ankle with two straps of bells
            ctx.fillStyle = rgrad(ctx, 0, SC * 1.3, 4, SC * 0.5, [[0, '#d09a68'], [1, '#9a6640']]); rrect(ctx, -SC * 0.38, SC * 1.0, SC * 0.76, SC * 0.9, SC * 0.32); ctx.fill();
            bellStrap(ctx, -SC * 0.42, SC * 1.28, SC * 0.42, SC * 1.28, 10, f, t, 6.4); bellStrap(ctx, -SC * 0.4, SC * 1.5, SC * 0.4, SC * 1.5, 10, f * 0.9, t + 0.4, 6);
            ctx.restore();
          };
          // the dancer's legs in fitted silk trousers with ruched ankles, and the gold-bordered hem of a flaring red skirt below
          for (const [sx, fy] of [[-1, 410], [1, 392]]) { const lx = cx + sx * 135, y0 = fy + 118; ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, lx - 40 + 12, y0 + 14, 84, 300, 36); ctx.fill();
            ctx.fillStyle = hgrad(ctx, lx - 44, lx + 44, [[0, '#8a7a5a'], [0.3, '#f0e2bc'], [0.7, '#d8c898'], [1, '#6a5a3a']]); rrect(ctx, lx - 42, y0, 84, 300, 38); ctx.fill();
            ctx.strokeStyle = 'rgba(90,70,40,0.4)'; ctx.lineWidth = 2.4; for (let q = 0; q < 8; q++) { ctx.beginPath(); ctx.ellipse(lx, y0 + 12 + q * 11, 40 - q * 0.6, 7, 0, 0.1, Math.PI - 0.1); ctx.stroke(); }
            ctx.strokeStyle = 'rgba(255,248,224,0.4)'; ctx.lineWidth = 1.4; for (let q = 0; q < 8; q++) { ctx.beginPath(); ctx.ellipse(lx - 2, y0 + 9 + q * 11, 36, 6, 0, Math.PI * 1.1, Math.PI * 1.8); ctx.stroke(); }
            ctx.restore(); }
          { ctx.save(); const top = (x) => 770 + 70 * Math.min(1, Math.pow(Math.abs(x) / 390, 2));
            ctx.beginPath(); ctx.moveTo(mx0, top(mx0)); for (let q = Math.floor(mx0 / 30) * 30; q <= mx1; q += 30) ctx.lineTo(cx + q, top(q)); ctx.lineTo(mx1, 886); ctx.lineTo(mx0, 886); ctx.closePath();
            ctx.fillStyle = vgrad(ctx, 760, 890, [[0, '#c0392b'], [0.5, '#8a1c18'], [1, '#5a0e0e']]); ctx.fill(); ctx.clip();
            ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 2; for (let q = Math.floor(mx0 / 36); q <= mx1 / 36; q++) { ctx.beginPath(); ctx.moveTo(cx + q * 36, 760); ctx.quadraticCurveTo(cx + q * 42, 830, cx + q * 52, 890); ctx.stroke(); }
            ctx.strokeStyle = 'rgba(255,200,160,0.2)'; ctx.lineWidth = 3; for (let q = Math.floor(mx0 / 36); q <= mx1 / 36; q++) { ctx.beginPath(); ctx.moveTo(cx + q * 36 + 5, 760); ctx.quadraticCurveTo(cx + q * 42 + 5, 830, cx + q * 52 + 5, 890); ctx.stroke(); }
            ctx.strokeStyle = '#e8b84a'; ctx.lineWidth = 8; ctx.beginPath(); for (let q = Math.floor(mx0 / 30) * 30, f0 = true; q <= mx1; q += 30) { const y = top(q) + 4; if (f0) { ctx.moveTo(cx + q, y); f0 = false; } else ctx.lineTo(cx + q, y); } ctx.stroke();
            ctx.strokeStyle = '#fff0b0'; ctx.lineWidth = 2.4; ctx.beginPath(); for (let q = Math.floor(mx0 / 30) * 30, f0 = true; q <= mx1; q += 30) { const y = top(q) + 14; if (f0) { ctx.moveTo(cx + q, y); f0 = false; } else ctx.lineTo(cx + q, y); } ctx.stroke();
            for (let q = Math.floor(mx0 / 38); q <= mx1 / 38; q++) { const x = cx + q * 38, y = top(q * 38) + 40; ctx.fillStyle = '#e8b84a'; ctx.beginPath(); ctx.moveTo(x, y - 11); ctx.lineTo(x + 8, y); ctx.lineTo(x, y + 11); ctx.lineTo(x - 8, y); ctx.closePath(); ctx.fill(); }
            ctx.fillStyle = '#e8b84a'; ctx.fillRect(mx0, 876, mx1 - mx0, 10); ctx.fillStyle = '#fff0b0'; ctx.fillRect(mx0, 878, mx1 - mx0, 2.4);
            ctx.restore(); }
          ctx.save(); ctx.strokeStyle = 'rgba(232,184,74,0.95)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; for (let q = Math.floor(mx0 / 9) * 9; q <= mx1; q += 9) { ctx.beginPath(); ctx.moveTo(cx + q, 886); ctx.lineTo(cx + q + 1.5, 899); ctx.stroke(); } ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(mx0, 899, mx1 - mx0, 5); ctx.restore();
          foot(cx - 135, 410, true, FL, -0.05); foot(cx + 135, 392, false, FR, 0.06);
          if (FH > 0.05) { ctx.strokeStyle = `rgba(255,236,190,${0.5 * FH})`; ctx.lineWidth = 3; ell(ctx, cx, 725, 70 + (1 - FH) * 40, 36 + (1 - FH) * 20); ctx.stroke(); }
          void clamp; void mix; void rgba; void lighter; void darker; void vgrad; void hgrad; void grain; void hash; void lerp; void rot2; void rectSpot; void stepIcon; void text;
        } };
    },
  }); },
});

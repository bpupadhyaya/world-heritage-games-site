// Paired-strike stick dances (1.27.0, second pass 1.29.0): the stage draws the CLASH, not the dancers. Tapered forearms in cloth sleeves (folds, a gathered cuff, bangles) and real gripping hands come in
// from the edges of the picture holding big painted sticks; on each beat the sticks sweep in from the ready position and meet at the lane's place in ONE flash of light, then fall back.
// There is no body and no face anywhere. Four lanes, in order, are four kinds of clash (what each means depends on the composition). Five compositions, so the games do not share a template:
//   face  : partners left and right, two pairs of arms at two heights, the clash in the middle           (kolattam)
//   stack : a column of four pairs of arms one above the other (turned across on a wide screen)         (paloteo, ball de bastons)
//   row   : a colonnade in perspective, a pair of arms at each of four depths behind pillars            (pauliteiros)
//   ring  : seen from above, four arms from the four sides over a painted floor                         (dandiya, kolkali)
//   fan   : seen from below, four arms rising from the bottom edge, sticks fanning into a bouquet        (gauda, dhoklan)
// A tradition is a LOOK (composition, backdrop, stick, sleeve, palette), reached by `instrument: "stick clash <look>"`.
import { registerDanceStage } from './registry.js';
import { createSceneStage, eSpot, areaInDesign } from './dance-kit.js';
import { circ, rgba, lighter, darker, rrect } from './dance-kit.js';
import { envOf } from './hero-common.js';
import { ease } from './figure-hero.js';
import { drawStick, arm, fingers, clashFx, lerpN } from './stick-kit.js';
import { sceneFor, postFor } from './stick-scenes.js';

// ---- looks -------------------------------------------------------------------------------------------------------------------------
// comp: face | stack | row | ring | fan ; scene: backdrop id ; post: pillar id (row) ; stick: STICK_STYLES id ; len/w: stick length and girth on a tall screen (lenW/wW on a wide one) ;
// skin ; cloth/trim: sleeve ; sleeve: share of the arm covered by cloth ; loose: flared sleeve (1) or fitted (0) ; bangles ; spark/chip: colours of the strike
export const LOOKS = {
  kolattam: { comp: 'face', scene: 'pandal', stick: 'kolattam', len: 470, w: 44, lenW: 400, wW: 38, skin: '#a8663a', cloth: '#1f7a4a', trim: '#e8c04a', sleeve: 0.56, loose: 0, bangles: ['#e6b84a', '#d4a43a', '#f2d070', '#e6b84a'], spark: '#fff0b8', chip: '#d8b078' },
  paloteo: { comp: 'stack', scene: 'castile', stick: 'ribbon', len: 400, w: 40, lenW: 330, wW: 32, skin: '#c98e63', cloth: '#f6f0e4', trim: '#c0261f', sleeve: 0.7, loose: 1, bangles: [], spark: '#fff6d0', chip: '#e0c08a' },
  bastons: { comp: 'stack', scene: 'cloister', stick: 'ash', len: 400, w: 40, lenW: 330, wW: 32, skin: '#c98e63', cloth: '#f6f2ea', trim: '#c0261f', sleeve: 0.66, loose: 1, bangles: [], spark: '#fff2c8', chip: '#d8b078', chev: true },
  pauliteiros: { comp: 'row', scene: 'granite', post: 'granite', stick: 'chestnut', len: 430, w: 40, lenW: 380, wW: 36, skin: '#c4875a', cloth: '#f4efe4', trim: '#1a1a22', sleeve: 0.72, loose: 1, bangles: [], spark: '#ffe8c0', chip: '#8a5a30' },
  dandiya: { comp: 'ring', phi: 0.2, scene: 'garba', stick: 'dandiya', len: 420, w: 40, lenW: 380, wW: 36, skin: '#b9784a', cloth: '#d8368a', trim: '#f4c430', sleeve: 0.5, loose: 1, bangles: ['#e6b84a', '#d4a43a', '#f2d070', '#e6b84a', '#f2d070'], spark: '#fff0b8', chip: '#e8b078' },
  kolkali: { comp: 'ring', phi: Math.PI / 4, scene: 'kerala', stick: 'rosewood', len: 420, w: 40, lenW: 380, wW: 36, skin: '#8e5a36', cloth: '#f2ead0', trim: '#c8a23a', sleeve: 0.4, loose: 0, bangles: [], spark: '#ffe8b0', chip: '#b07a48' },
  gauda: { comp: 'fan', scene: 'dusk', stick: 'cane', len: 470, w: 42, lenW: 400, wW: 36, skin: '#9a6a44', cloth: '#f4f0e6', trim: '#2a7a4a', sleeve: 0.64, loose: 1, bangles: ['#c8c8d0', '#e0e0e8'], spark: '#fff4c8', chip: '#d8c070' },
  sindh: { comp: 'fan', scene: 'canopy', stick: 'desert', len: 470, w: 44, lenW: 400, wW: 38, skin: '#8e5a36', cloth: '#f0e8d4', trim: '#b8321f', sleeve: 0.6, loose: 1, bangles: ['#b8b8c0'], spark: '#ffe0a8', chip: '#c89a58' },
};
const DEFAULT_LOOK = 'kolattam';
const lookOf = (key) => { const m = /stick clash[: ]+([a-z-]+)/.exec(String(key || '')); return LOOKS[m?.[1]] ? m[1] : DEFAULT_LOOK; };

const mirror = (p) => ({ h: [-p.h[0], p.h[1]], a: Math.PI - p.a });
const via = (C, th, g) => ({ h: [C[0] - Math.cos(th) * g, C[1] - Math.sin(th) * g], a: th });
const shiftY = (p, dy) => ({ h: [p.h[0], p.h[1] + dy], a: p.a });

// ---- the compositions. Each returns { arms: [{ id, rest, tg[4], sh(A, pose) -> shoulder, side, bend, st }], contact: [[points] per lane], I: scene info } --------------------------------------
function faceComp(look, tall) {
  const L = tall ? look.len : look.lenW, g = L * 0.5;
  const P = tall ? { across: [0, 520], high: [0, 330], low: [0, 960], own: [-170, 760], restT: { h: [-290, 610], a: -1.25 }, restB: { h: [-290, 1010], a: -0.7 }, hz: 700 }
    : { across: [0, 200], high: [0, 85], low: [0, 430], own: [-150, 300], restT: { h: [-300, 170], a: -1.2 }, restB: { h: [-320, 470], a: -0.7 }, hz: 330 };
  const mid = via(P.across, -0.5, g), high = via(P.high, -0.9, g), low = via(P.low, -0.5, g), ownT = via(P.own, 1.0, g), ownB = via(P.own, -1.0, g);
  const sh = (d) => (A, p) => [d < 0 ? A.x0 - 150 : A.x1 + 150, p.h[1] + (tall ? 260 : 140)];
  const arms = [
    { id: 'LB', side: -1, rest: P.restB, tg: [null, null, low, ownB], sh: sh(-1) }, { id: 'RB', side: 1, rest: mirror(P.restB), tg: [null, null, mirror(low), mirror(ownB)], sh: sh(1) },
    { id: 'LT', side: -1, rest: P.restT, tg: [mid, high, null, ownT], sh: sh(-1) }, { id: 'RT', side: 1, rest: mirror(P.restT), tg: [mirror(mid), mirror(high), null, mirror(ownT)], sh: sh(1) },
  ];
  return { arms, contact: [[P.across], [P.high], [P.low], [P.own, [-P.own[0], P.own[1]]]], I: { hz: P.hz } };
}
// the column is built in a tall frame (x across the pair, y along the stack); on a wide screen it is turned a quarter round so the arms come from the top and the bottom
function stackComp(look, tall) {
  const L = tall ? look.len : look.lenW, g = L * 0.5, chev = !!look.chev, arms = [], contact = [];
  const place = (p) => (tall ? p : { h: [-p.h[1], p.h[0] + 300], a: p.a + Math.PI / 2 });
  for (let i = 0; i < 4; i++) {
    const yc = tall ? [310, 600, 890, 1180][i] : (1.5 - i) * 230, tilt = chev ? -0.55 : (i % 2 ? 0.28 : -0.28), C = [0, yc];
    const tgL = via(C, tilt, g), restL = chev ? { h: [-g * 1.2, yc + g * 0.3], a: -0.95 } : { h: [-g * 1.2, yc + (i % 2 ? -1 : 1) * g * 0.3], a: i % 2 ? 0.75 : -0.75 };
    for (const sd of [-1, 1]) {
      const tg = [null, null, null, null]; tg[i] = place(sd < 0 ? tgL : mirror(tgL));
      arms.push({ id: `${sd < 0 ? 'L' : 'R'}${i}`, side: sd, st: i, rest: place(sd < 0 ? restL : mirror(restL)), tg,
        sh: tall ? (A, p) => [sd < 0 ? A.x0 - 150 : A.x1 + 150, p.h[1] + 110] : (A, p) => [p.h[0], sd < 0 ? A.y0 - 150 : A.y1 + 150], bend: tall ? [0, 140] : [110 * sd, 0] });
    }
    contact.push([tall ? C : [-yc, 300]]);
  }
  return { arms, contact, I: { hz: tall ? 1080 : 440 } };
}
// the row: station i has its contact point at ROW_Y[i], seen at scale ROW_S[i]; a pair of arms comes from behind a pillar on each side
const ROW_S = [1, 0.74, 0.56, 0.43];
function rowComp(look, tall) {
  const L = tall ? look.len : look.lenW, g = L * 0.5, arms = [];
  const ROW_Y = tall ? [1090, 850, 670, 530] : [505, 410, 346, 304], k = tall ? 1 : 0.84;
  for (let i = 0; i < 4; i++) {
    const c = via([0, 0], -0.8, g), restL = { h: [-0.95 * g, 0.72 * g], a: -1.2 };
    for (const sd of [-1, 1]) arms.push({ id: `${sd < 0 ? 'L' : 'R'}${i}`, side: sd, st: i, rest: sd < 0 ? restL : mirror(restL), tg: [0, 1, 2, 3].map((q) => (q === i ? (sd < 0 ? c : mirror(c)) : null)) });
  }
  return { arms, contact: [0, 1, 2, 3].map(() => [[0, 0]]), ROW_Y, k, I: { vy: tall ? 380 : 285, hz2: tall ? 520 : 403 }, popAt: (i) => [0, ROW_Y[i]] };
}
function ringComp(look, tall) {
  const L = tall ? look.len : look.lenW, C = [0, tall ? 740 : 300], hr = 0.75 * L, rr = hr + 150, phi = look.phi || 0, cs = Math.cos(phi), sn = Math.sin(phi);
  const rot = (v) => [v[0] * cs - v[1] * sn, v[0] * sn + v[1] * cs];
  const dirs = { N: rot([0, -1]), E: rot([1, 0]), S: rot([0, 1]), W: rot([-1, 0]) };
  const at = (d, rad, ang) => ({ h: [C[0] + dirs[d][0] * rad, C[1] + dirs[d][1] * rad], a: ang });
  const ang = { N: Math.PI / 2 + phi, E: Math.PI + phi, S: -Math.PI / 2 + phi, W: phi };
  const cd = L * 0.17;
  const corner = (d, to) => { const rad = rr * 0.9, h = [C[0] + dirs[d][0] * rad, C[1] + dirs[d][1] * rad], tv = rot(to), P = [C[0] + tv[0] * cd, C[1] + tv[1] * cd]; return { h, a: Math.atan2(P[1] - h[1], P[0] - h[0]) }; };
  const arms = ['N', 'E', 'S', 'W'].map((d) => ({ id: d, dir: dirs[d], rest: at(d, rr, ang[d]), bend: [-dirs[d][1] * 170, dirs[d][0] * 170], tg: [
    d === 'N' || d === 'S' ? at(d, hr, ang[d]) : null,
    d === 'E' || d === 'W' ? at(d, hr, ang[d]) : null,
    d === 'N' ? corner('N', [1, -1]) : d === 'E' ? corner('E', [1, -1]) : d === 'S' ? corner('S', [-1, 1]) : corner('W', [-1, 1]),
    at(d, hr * 0.94, ang[d]),
  ] }));
  const c1 = rot([cd, -cd]), c2 = rot([-cd, cd]);
  return { arms, contact: [[C], [C], [[C[0] + c1[0], C[1] + c1[1]], [C[0] + c2[0], C[1] + c2[1]]], [C]], I: { cy: C[1], R: hr }, C };
}
function fanComp(look, tall) {
  const L = tall ? look.len : look.lenW, g = L * 0.5;
  const Y = tall ? { c01: [-190, 620], c12: [0, 520], c3: [0, 400], rest: [[-300, 1010], [-100, 1060], [100, 1060], [300, 1010]] }
    : { c01: [-150, 215], c12: [0, 125], c3: [0, 60], rest: [[-250, 480], [-85, 510], [85, 510], [250, 480]] };
  const restA = [-1.78, -1.66, -1.48, -1.36], c01 = Y.c01, c12 = Y.c12, c23 = [-c01[0], c01[1]], c3 = Y.c3;
  // lane 0: arms 0 and 1; lane 1: arms 1 and 2; lane 2: arms 2 and 3; lane 3: all four converge
  const tgs = [[via(c01, -1.15, g), null, null, via(c3, -1.0, g)], [via(c01, -1.99, g), via(c12, -1.2, g), null, via(c3, -1.3, g)], [null, via(c12, -1.94, g), via(c23, -1.15, g), via(c3, -1.84, g)], [null, null, via(c23, -1.99, g), via(c3, -2.14, g)]];
  const arms = [0, 1, 2, 3].map((i) => ({ id: `F${i}`, rest: { h: Y.rest[i], a: restA[i] }, tg: tgs[i], sh: (A, p) => [p.h[0] * 1.25, A.y1 + 130], bend: [i < 2 ? -120 : 120, 0] }));
  return { arms, contact: [[c01], [c12], [c23], [c3]], I: { hz: tall ? 1010 : 470 } };
}
const COMPS = { face: faceComp, stack: stackComp, row: rowComp, ring: ringComp, fan: fanComp };

function stickPad(ctx, l, sp, f) {
  const c = l.color, s = sp.r * (1 + 0.1 * f);
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, sp.v + 4, sp.u + 8, s); ctx.fill();
  const rg = ctx.createRadialGradient(sp.v - s * 0.3, sp.u - s * 0.35, s * 0.1, sp.v, sp.u, s * 1.05); rg.addColorStop(0, darker(c, 0.5 - 0.3 * f)); rg.addColorStop(0.7, darker(c, 0.72 - 0.3 * f)); rg.addColorStop(1, '#0a0806');
  ctx.fillStyle = rg; circ(ctx, sp.v, sp.u, s); ctx.fill();
  ctx.strokeStyle = rgba(lighter(c, 0.35 + 0.4 * f), 0.98); ctx.lineWidth = 5; circ(ctx, sp.v, sp.u, s - 2); ctx.stroke();
  ctx.strokeStyle = rgba(c, 0.35); ctx.lineWidth = 2; circ(ctx, sp.v, sp.u, s * 0.82); ctx.stroke();
  for (const sg of [-1, 1]) { ctx.save(); ctx.translate(sp.v, sp.u); ctx.rotate(sg * 0.62 + (sg < 0 ? 0.04 : -0.04) * f); ctx.fillStyle = 'rgba(0,0,0,0.45)'; rrect(ctx, -s * 0.5 + 2, -s * 0.07 + 3, s, s * 0.14, s * 0.07); ctx.fill(); ctx.fillStyle = lighter(c, 0.6); rrect(ctx, -s * 0.5, -s * 0.07, s, s * 0.14, s * 0.07); ctx.fill(); ctx.restore(); }
}

registerDanceStage({
  id: 'sticks', match: /stick clash/,
  build: (S, lanes, P, { key }) => {
    const lookId = lookOf(key), look = LOOKS[lookId];
    return createSceneStage('sticks', S, lanes, P, {
      tallRatio: 0.85,
      voiceOf: (i) => `stk-${look.stick}-${Math.min(i, 3)}`,
      dress: () => ({ kind: 'stone', base: '#3a2a22', accent: '#2a1c16', size: 120, light: '#ffe0b0' }),
      build: (K) => {
        const tall = K.tall, ref = tall ? { w: 780, h: 1480 } : { w: 1180, h: 600 };
        const comp = COMPS[look.comp](look, tall), spots = new Array(K.N).fill(null);
        const L = tall ? look.len : look.lenW, SW = tall ? look.w : look.wW, AW = tall ? 86 : 72, PR = tall ? 60 : 62;
        const by = tall ? [[-285, 1390], [-95, 1390], [95, 1390], [285, 1390]] : [[-488, 150], [-488, 420], [488, 150], [488, 420]];
        for (let i = 0; i < K.N; i++) { const p = by[Math.min(i, 3)]; spots[i] = eSpot(p[0], p[1], PR, PR, 0, { apk: 1, extra: { noFill: true } }); }
        const idx = Array.from({ length: K.N }, (_, i) => i), nl = Math.min(K.N, 4);
        // where the burst and the judgement text appear: on the clash, never on the pad labels
        const pop = [0, 1, 2, 3].map((i) => (comp.popAt ? comp.popAt(i) : comp.contact[i][0]));
        return { ref, spots, pop,
          draw(ctx, rt, g) {
            const t = rt.anim, env = envOf(rt, K, idx), A = areaInDesign(ctx, g.F, ref);
            sceneFor(look.scene)(ctx, A, t, comp.I.hz, { ...comp.I, tall, comp, k: 1, fy: 0 });
            // pose of each arm: its rest pose moved towards the target of the strongest lane that uses it
            const poses = comp.arms.map((a, ai) => {
              const ph = ai * 1.37;
              let h = [a.rest.h[0], a.rest.h[1] + Math.sin(t * 3.1 + ph) * 6], ang = a.rest.a + Math.sin(t * 2.6 + ph * 1.3) * 0.04, best = 0, hit = 0, tr = null;
              for (let ln = 0; ln < nl; ln++) {
                const tp = a.tg[ln]; if (!tp) continue;
                const v = ease(env[ln] ?? 0); hit = Math.max(hit, rt.flash[ln] ?? 0);
                if (v > best) { best = v; h = [lerpN(a.rest.h[0], tp.h[0], v), lerpN(a.rest.h[1], tp.h[1], v)]; ang = lerpN(a.rest.a, tp.a, v); tr = { tp, v: Math.max(0, v - 0.22) }; }
              }
              const trail = tr && best > 0.12 && best < 0.97 ? { h: [lerpN(a.rest.h[0], tr.tp.h[0], tr.v), lerpN(a.rest.h[1], tr.tp.h[1], tr.v)], ang: lerpN(a.rest.a, tr.tp.a, tr.v), al: 0.3 * Math.min(1, best * 2.2) * (1 - best * 0.4) } : null;
              return { h, ang, hit, a, trail };
            });
            const fx = (ln, pts) => { const f = rt.flash[ln] ?? 0; if (f > 0.04) for (const c of pts) clashFx(ctx, c[0], c[1], f, { col: look.spark, chip: look.chip, s: tall ? 1 : 0.85 }); };
            // one arm: forearm and sleeve with the back of the hand; then (in sticks) its stick and the fingers over the stick
            const arm1 = (p, shoulder, W, bend) => ({ p, ga: arm(ctx, shoulder, p.h, { skin: look.skin, cloth: look.cloth, trim: look.trim, sleeve: look.sleeve, loose: look.loose, bangles: look.bangles, w: W, side: p.a.side ?? 1, bend: bend ?? p.a.bend }) });
            const sticks = (parts) => {
              for (const { p, ga } of parts) {
                const gx = ga.grip[0], gy = ga.grip[1];
                if (p.trail) { ctx.save(); ctx.globalAlpha = p.trail.al; drawStick(ctx, gx + (p.trail.h[0] - p.h[0]) - Math.cos(p.trail.ang) * L * 0.2, gy + (p.trail.h[1] - p.h[1]) - Math.sin(p.trail.ang) * L * 0.2, p.trail.ang, L, SW, look.stick, { t }); ctx.restore(); }
                drawStick(ctx, gx - Math.cos(p.ang) * L * 0.2, gy - Math.sin(p.ang) * L * 0.2, p.ang, L, SW, look.stick, { t, hit: p.hit });
                fingers(ctx, ga, look.skin, p.a.side ?? 1);
              }
            };
            if (look.comp === 'row') {
              for (let i = 3; i >= 0; i--) {
                ctx.save(); ctx.translate(0, comp.ROW_Y[i]); ctx.scale(ROW_S[i] * comp.k, ROW_S[i] * comp.k);
                const parts = poses.filter((p) => p.a.st === i).map((p) => arm1(p, [p.a.side * 560, p.h[1] + 130], AW, [0, 150]));
                sticks(parts);
                fx(i, [[0, 0]]);
                ctx.restore();
                for (const sd of [-1, 1]) postFor(look.post)(ctx, sd * 440 * ROW_S[i] * comp.k, comp.ROW_Y[i] + 60 * ROW_S[i], ROW_S[i] * comp.k, sd, t);
              }
            } else {
              const parts = poses.map((p) => {
                if (look.comp !== 'ring') return arm1(p, p.a.sh(A, p), AW);
                const C = comp.C, v = p.a.dir, tx = v[0] > 0.01 ? (A.x1 - C[0]) / v[0] : v[0] < -0.01 ? (A.x0 - C[0]) / v[0] : 1e9, ty = v[1] > 0.01 ? (A.y1 - C[1]) / v[1] : v[1] < -0.01 ? (A.y0 - C[1]) / v[1] : 1e9, far = Math.min(tx, ty) + 170;
                return arm1(p, [C[0] + v[0] * far, C[1] + v[1] * far], AW);
              });
              sticks(parts);
              for (let ln = 0; ln < nl; ln++) fx(ln, comp.contact[ln]);
            }
            lanes.forEach((l, i) => { if (spots[i]) stickPad(ctx, l, spots[i], rt.flash[i]); });
          } };
      },
    });
  },
});

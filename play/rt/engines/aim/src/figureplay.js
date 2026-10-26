// Sprite programs for the 3D figures (1.8.0): which clips and times to bake for an action, how the pull and the strike of the
// game map onto those frames, and how sprites are drawn into the 2D scene. DOM-free (the bank in figures3d.js owns WebGL).

const TAU = Math.PI * 2;
export const FIG_UNIT = 1.75;   // metres: the athlete's height

// Actions of the lane-view thrower. Each part is a list of clip times (seconds); `contact` is the index in `strike` where the tool or foot meets the ball.
export const ACTIONS = {
  swing: { // two-handed club or mallet (golf-swing clip, right-handed)
    clip: 'swing2h', marker: 'prop', prop: { kind: 'mallet' },
    idle: [0.2], pull: [0.2, 0.6, 0.9, 1.15, 1.4], strike: [1.4, 1.55, 1.7, 1.8, 1.9, 2.0, 2.1, 2.3, 2.5], contact: 4,
  },
  bat: { // bat or stick (authored cricket-style drive)
    marker: 'prop', prop: { kind: 'bat' },
    parts: { idle: { clip: 'bat_stance', t: [0.5] }, pull: { clip: 'bat_backlift', t: [0, 0.12, 0.24, 0.36, 0.45] }, strike: { clip: 'bat_drive', t: [0, 0.05, 0.1, 0.14, 0.167, 0.2, 0.26, 0.35, 0.5, 0.8] } }, contact: 4,
  },
  kick: { // instep kick with the right foot
    clip: 'kick', marker: 'rfoot', prop: null,
    idle: [0.0], pull: [0.0, 0.25, 0.5, 0.75, 0.95], strike: [0.95, 1.05, 1.133, 1.25, 1.4, 1.55, 1.75, 1.9], contact: 2,
  },
  shoot: { // face view: a one-handed overarm shot with the ball in the hand until the release (hand marker at the release frame)
    marker: 'rhand', prop: { kind: 'ball' }, propUntil: 0.3,
    parts: { idle: { clip: 'ready_stance', t: [0.5] }, pull: { clip: 'throw_overarm', t: [0, 0.06, 0.12, 0.2, 0.28] }, strike: { clip: 'throw_overarm', t: [0.3, 0.36, 0.45, 0.58, 0.72, 0.97] } }, contact: 0, fixedContact: true,
  },
  throw: { // overarm arm swing
    marker: null, prop: null,
    parts: { idle: { clip: 'ready_stance', t: [0.3] }, pull: { clip: 'throw_overarm', t: [0, 0.08, 0.16, 0.24, 0.3] }, strike: { clip: 'throw_overarm', t: [0.3, 0.36, 0.45, 0.58, 0.72, 0.97] } }, contact: 1,
  },
  toss: { // underarm strike or toss
    marker: null, prop: null,
    parts: { idle: { clip: 'ready_stance', t: [0.3] }, pull: { clip: 'toss_underarm', t: [0, 0.07, 0.14, 0.22, 0.3] }, strike: { clip: 'toss_underarm', t: [0.3, 0.36, 0.45, 0.58, 0.8] } }, contact: 1,
  },
};

const partsOf = (a) => a.parts ?? { idle: { clip: a.clip, t: a.idle }, pull: { clip: a.clip, t: a.pull }, strike: { clip: a.clip, t: a.strike } };

const PERSON_POSES = { ready: 'ready_stance', idle: 'idle', cheer: 'cheer', clap: 'clap', celebrate: 'celebrate_2', crouch: 'crouch_idle', field: 'field_ready' };

const kitOf = (shirt, pants, socks) => ({ top: shirt ?? '#c8322b', bottoms: pants ?? '#2b3140', socks: socks ?? '#f4f0e2' });

export function personKey(b, az) { return `${b.female ? 'f' : 'm'}|${b.shirt ?? ''}|${b.pants ?? ''}|${b.skin ?? ''}|${b.hair ?? ''}|${b.cap ?? ''}|${b.pose ?? (b.armUp ? 'cheer' : b.ready ? 'field' : b.front ? 'ready' : 'idle')}|${az}`; }
export function personSpec(b, az, lighting) {
  const pose = PERSON_POSES[b.pose ?? (b.armUp ? 'cheer' : b.ready ? 'field' : b.front ? 'ready' : 'idle')] ?? 'ready_stance';
  const dur = { ready_stance: 2.73, idle: 2.73, cheer: 2.7, clap: 2.8, celebrate_2: 2.5, crouch_idle: 4, field_ready: 1 }[pose] ?? 2.7;
  const n = 5;
  return { char: b.female ? 'athlete_f' : 'athlete_m', kit: kitOf(b.shirt, b.pants), skin: b.skin, hair: b.hair, cap: b.cap, az, clip: pose, times: Array.from({ length: n }, (_, i) => (dur * i) / n), lighting, loopDur: dur };
}

/** Bake everything a spec's look asks for. Returns { actors: Map(az -> parts), people: Map(key -> set), ppm } or null. */
export async function prepareFigures(bank, look, opts = {}) {
  if (!bank || look.figures !== 'view3d') return null;
  const lighting = look.figureLighting ?? 'day';
  const yaws = [...new Set([look.yaw ?? 0, look.yawWide ?? look.yaw ?? 0].map((y) => Math.round(y)))];
  const out = { actors: new Map(), people: new Map(), ppm: bank.ppm };
  const jobs = [];
  if (look.actor) {
    const A = look.actor, act = ACTIONS[A.action ?? 'swing'], parts = partsOf(act);
    for (const yaw of yaws) jobs.push((async () => {
      const base = { char: A.char ?? (A.female ? 'athlete_f' : 'athlete_m'), kit: kitOf(A.shirt ?? A.kit?.top, A.pants ?? A.kit?.bottoms, A.kit?.socks), skin: A.skin, hair: A.hair, cap: A.cap, az: yaw + (A.az ?? 0), hand: A.hand, prop: A.prop ?? act.prop, grip: (A.prop ?? act.prop)?.kind === 'ball' ? 'ball' : undefined, marker: act.marker, lighting };
      const res = {};
      for (const k of ['idle', 'pull', 'strike']) res[k] = await bank.bake({ ...base, clip: parts[k].clip, times: parts[k].t, marker: k === 'strike' ? act.marker : (act.marker ?? null), ...(k === 'strike' && act.propUntil !== undefined ? { propUntil: act.propUntil } : {}) });
      if (!res.idle || !res.pull || !res.strike) return;
      res.contact = act.contact; res.hasMarker = !!act.marker;
      if (act.marker && !act.fixedContact) { let best = -1e9; res.strike.frames.forEach((f, i) => { if (f.my !== undefined && f.my - f.ay > best) { best = f.my - f.ay; res.contact = i; } }); }   // the lowest marker frame is the strike
      out.actors.set(yaw, res);
    })());
  }
  for (const b of look.bystanders ?? []) {
    if (b.sit) continue;
    for (const yaw of yaws) {
      const front = !!b.front, az = front ? 180 + yaw : yaw;
      const key = personKey(b, az);
      if (out.people.has(key)) continue;
      out.people.set(key, null);
      jobs.push((async () => { out.people.set(key, await bank.bake(personSpec(b, az, lighting))); })());
    }
  }
  await Promise.all(jobs);
  // memory budget: pixels of all baked frames (4 bytes each); a spec that exceeds it drops to the vector figures
  let px = 0; const add = (set) => { for (const f of set?.frames ?? []) px += f.w * f.h; };
  for (const a of out.actors.values()) { add(a.idle); add(a.pull); add(a.strike); }
  for (const set of out.people.values()) add(set);
  out.bytes = px * 4;
  if (out.bytes > (opts.maxBytes ?? 160e6)) { console.warn('aim: 3D figures over budget', out.bytes); return null; }
  return out;
}

const at = (arr, i) => arr[Math.max(0, Math.min(arr.length - 1, i))];

/** Choose the frame of an actor for the game's pose. pose = { mode: 'idle' | 'pull' | 'strike', pw, e, from } */
export function actorFrame(res, pose, clock = 0) {
  if (pose.mode === 'pull') { const f = res.pull.frames; return at(f, Math.round((pose.pw ?? 0) * (f.length - 1))); }
  if (pose.mode === 'strike') {
    const S = res.strike.frames, c = Math.min(res.contact, S.length - 1), e = pose.e ?? 0;
    if (e < 0.1) return at(S, Math.round((e / 0.1) * c));
    return at(S, Math.round(c + ((e - 0.1) / 0.4) * (S.length - 1 - c)));
  }
  const f = res.idle.frames; return f[Math.floor(clock * 1.5) % f.length];
}

/** Draw one sprite. (fx, fy) = feet on screen, k = scale from sprite pixels to screen pixels. */
export function drawSprite(ctx, fr, fx, fy, k, flip = false, alpha = 1) {
  if (!fr) return;
  ctx.save();
  if (alpha < 1) ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if (flip) { ctx.translate(fx, fy); ctx.scale(-1, 1); ctx.drawImage(fr.c, -fr.ax * k, -fr.ay * k, fr.w * k, fr.h * k); }
  else ctx.drawImage(fr.c, fx - fr.ax * k, fy - fr.ay * k, fr.w * k, fr.h * k);
  ctx.restore();
}

export function groundShadow(ctx, x, y, rx, ry, a = 0.32) {
  ctx.save(); ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.beginPath(); ctx.ellipse(x, y + ry * 0.2, Math.max(1, rx), Math.max(1, ry), 0, 0, TAU); ctx.fill(); ctx.restore();
}

/** Draw a baked bystander. (x, y) = feet, u = pixels per metre-ish unit (the vector figure is 1.55 u tall). Returns false when no sprite exists. */
export function drawPerson(ctx, figs, b, az, x, y, u, t, hashFn) {
  const set = figs?.people.get(personKey(b, az));
  if (!set || !set.frames.length) return false;
  const n = set.frames.length, ph = hashFn((b.x ?? 0) * 7.3 + (b.y ?? 0) * 3.1) * set.dur, idx = Math.floor((((t + ph) % set.dur) / set.dur) * n) % n;
  const hpx = 1.55 * u * (b.scale ?? 1) * 1.1, k = hpx / (FIG_UNIT * figs.ppm);
  groundShadow(ctx, x + hpx * 0.03, y, hpx * 0.2, hpx * 0.045);
  drawSprite(ctx, set.frames[idx], x, y, k);
  return true;
}

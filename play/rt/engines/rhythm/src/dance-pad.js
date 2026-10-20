// Lacquered floor pad with a step icon (shared by the v2 dance stages; same drawing as stage-dance-folk.js).
import { mix, rgba, lighter, rgrad, circ, ell } from './art.js';
import { glow, stepIcon } from './art.js';

// a lacquered floor pad with its step icon (the lane's own colour), a ring when struck
export function pad(ctx, l, sp, f, ic) {
  const c = l.color, s = sp.r * (1 + 0.1 * f);
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; circ(ctx, sp.v + 4, sp.u + 8, s); ctx.fill();
  ctx.fillStyle = rgrad(ctx, sp.v, sp.u, s * 0.1, s * 1.05, [[0, mix('#2a2018', c, 0.25 + 0.4 * f)], [0.7, mix('#14100a', c, 0.18 + 0.35 * f)], [1, mix('#0a0806', c, 0.4)]], sp.v - s * 0.3, sp.u - s * 0.35); circ(ctx, sp.v, sp.u, s); ctx.fill();
  ctx.strokeStyle = rgba(lighter(c, 0.35 + 0.4 * f), 0.98); ctx.lineWidth = 5; circ(ctx, sp.v, sp.u, s - 2); ctx.stroke();
  ctx.strokeStyle = rgba(c, 0.35); ctx.lineWidth = 2; circ(ctx, sp.v, sp.u, s * 0.82); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.14)'; ell(ctx, sp.v - s * 0.2, sp.u - s * 0.45, s * 0.55, s * 0.2); ctx.fill();
  if (f > 0.03) glow(ctx, sp.v, sp.u, s * 2.1, c, 0.5 * f);
  stepIcon(ctx, ic ?? 'stomp', sp.v + 2, sp.u + 3, s * 0.5, 'rgba(0,0,0,0.5)', 0);
  stepIcon(ctx, ic ?? 'stomp', sp.v, sp.u - 2, s * 0.5, lighter(c, 0.8), f);
}
export const laneIcon = (l) => l.icon || (/left|izq|\bl\b/i.test(l.name) ? 'foot-l' : /right|der|\br\b/i.test(l.name) ? 'foot-r' : /clap|palm/i.test(l.name) ? 'clap' : /thigh|knee|slap|boot|escob/i.test(l.name) ? 'slap' : 'stomp');


// Registry of the per-tradition theatres. Each module default-exports { id, look, stage(g, S0, v), puppet(T), skin }.
// stage paints the whole scene rectangle (it places the figures itself with kit.place); puppet draws one figure in the
// tradition's own design (see figures.js PUPPETS); skin restyles dialogue card, plaques, meters, transition and sound.
import { PUPPETS } from './figures.js';

export const THEATRES = {};
export function register(T) {
  THEATRES[T.id] = T;
  if (T.puppet) PUPPETS[T.id] = T.puppet;
}

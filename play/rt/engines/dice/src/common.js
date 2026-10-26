// Shared helpers for the dice rule modules: a local LCG for AI sampling, dice counting, small formatting helpers.
export const lcg = (s) => () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
export const counts = (dice) => { const c = [0, 0, 0, 0, 0, 0, 0]; for (const v of dice) c[v]++; return c; };
export const sum = (dice) => dice.reduce((a, b) => a + b, 0);
export const words = ['', 'ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
export const word1 = ['', 'one', 'two', 'three', 'four', 'five', 'six'];
// stars from the margin of a head-to-head result
export const starsFor = (mine, theirs, big = 40) => (mine > theirs ? (mine - theirs >= big ? 3 : 2) : mine === theirs ? 1 : theirs - mine <= big / 3 ? 1 : 0);

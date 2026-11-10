// One shared palette for sprites, backgrounds and UI. Ramps go dark → light.
export const PALETTE: Record<string, string> = {
  // night neutrals
  '1': '#140f1f',
  '2': '#241c36',
  '3': '#3a2f52',
  '4': '#5a4c78',
  '5': '#8577a6',
  '6': '#bcb0d6',
  '7': '#f6f1ff',
  // astral cyan
  k: '#123a5c',
  l: '#1f6f99',
  m: '#38a8c9',
  n: '#7fe0e6',
  o: '#d6fbf5',
  // gold
  Z: '#a8642a',
  z: '#eab24a',
  f: '#ffe9a3',
  // infernal
  a: '#3a1020',
  b: '#6e1b2a',
  c: '#a8302b',
  d: '#e05a26',
  e: '#f9a03c',
  E: '#fff0b0',
  // swarm green
  g: '#14301f',
  h: '#24572c',
  i: '#4f8f2f',
  j: '#9ccf45',
  J: '#e2f58a',
  // necro violet
  p: '#24123a',
  q: '#46236b',
  r: '#7a3ea6',
  s: '#b67ee0',
  S: '#e9c8ff',
  // bone
  Y: '#7d6f58',
  y: '#b9ab8a',
  x: '#efe6cc',
  // iron
  t: '#262a3d',
  u: '#454b68',
  v: '#7880a4',
  w: '#b6bfdc',
  W: '#eef1ff',
  // brass / rust
  B: '#5e3b1e',
  C: '#9a6430',
  D: '#d39a4a',
  // deep sea
  K: '#0c2433',
  L: '#15495e',
  M: '#23808f',
  N: '#4cc2b8',
  O: '#a6f0d4',
  // mythic rose
  U: '#6e1a4c',
  P: '#d2447f',
  Q: '#ff9fcb',
  // accents
  R: '#ff4a5a',
  G: '#3ce07a',
};

export const OUTLINE = '#140f1f';

export function hex(c: string): number {
  return parseInt(c.replace('#', ''), 16);
}

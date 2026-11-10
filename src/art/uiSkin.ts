import { PALETTE } from './palette';
import { bayer, seeded } from './pixel';

interface FrameColors {
  outline: string;
  fill: string;
  light: string;
  dark: string;
  /** Second shadow row at the bottom, gives buttons a pressable lip. */
  lip?: string;
  /** Optional corner studs (gold rivets on panels). */
  stud?: string;
}

/**
 * 12×12 pixel frame as SVG, meant for `border-image-slice: 4 fill`.
 * Vector rects with crispEdges stay sharp at any integer border width.
 */
function frameSvg(c: FrameColors): string {
  const r = (x: number, y: number, w: number, h: number, color: string) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`;
  const parts = [
    r(1, 0, 10, 1, c.outline),
    r(1, 11, 10, 1, c.outline),
    r(0, 1, 1, 10, c.outline),
    r(11, 1, 1, 10, c.outline),
    r(1, 1, 10, 10, c.fill),
    r(1, 1, 9, 1, c.light),
    r(1, 2, 1, 8, c.light),
    r(10, 1, 1, 10, c.dark),
    r(1, 10, 10, 1, c.dark),
  ];
  if (c.lip) parts.push(r(1, 9, 10, 1, c.lip), r(1, 10, 10, 1, c.dark));
  if (c.stud) parts.push(r(2, 2, 1, 1, c.stud), r(9, 2, 1, 1, c.stud), r(2, 9, 1, 1, c.stud), r(9, 9, 1, 1, c.stud));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" shape-rendering="crispEdges">${parts.join('')}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const p = PALETTE;

const FRAMES: Record<string, FrameColors> = {
  panel: { outline: p['1'], fill: p['2'], light: p['3'], dark: '#1a1428', stud: p.Z },
  inset: { outline: p['1'], fill: '#1a1428', light: p['1'], dark: p['3'] },
  plain: { outline: p['1'], fill: p['2'], light: p['3'], dark: '#1a1428' },
  gold: { outline: p['1'], fill: p.z, light: p.f, dark: p.Z, lip: '#c98a35' },
  violet: { outline: p['1'], fill: p['4'], light: p['5'], dark: p['3'], lip: '#4a3e66' },
  teal: { outline: p['1'], fill: p.M, light: p.N, dark: p.L, lip: '#1c6a78' },
  red: { outline: p['1'], fill: p.c, light: p.d, dark: p.b, lip: '#8a2629' },
  ghost: { outline: p['1'], fill: p['2'], light: p['3'], dark: '#1a1428', lip: '#201930' },
  N: { outline: p['1'], fill: p['2'], light: p['5'], dark: p['3'] },
  R: { outline: p['1'], fill: p['2'], light: p.m, dark: p.l },
  SR: { outline: p['1'], fill: p['2'], light: p.s, dark: p.q },
  SSR: { outline: p['1'], fill: p['2'], light: p.f, dark: p.Z, stud: p.z },
  UR: { outline: p['1'], fill: p['2'], light: p.Q, dark: p.U, stud: p.P },
  LR: { outline: p['1'], fill: p['2'], light: p.o, dark: p.z, stud: p.Q },
};

function ditherTile(a: string, b: string, density: number): string {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 4;
  const ctx = c.getContext('2d')!;
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++) {
      ctx.fillStyle = density > bayer(x, y) ? b : a;
      ctx.fillRect(x, y, 1, 1);
    }
  return `url("${c.toDataURL()}")`;
}

function starfieldTile(): string {
  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 96;
  const ctx = c.getContext('2d')!;
  const rnd = seeded(7);
  ctx.fillStyle = '#100c19';
  ctx.fillRect(0, 0, 96, 96);
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = rnd() < 0.25 ? p['5'] : p['3'];
    ctx.fillRect(Math.floor(rnd() * 96), Math.floor(rnd() * 96), 1, 1);
  }
  return `url("${c.toDataURL()}")`;
}

/** Publishes the pixel skin as CSS custom properties on :root. */
export function installUiSkin(): void {
  const root = document.documentElement.style;
  for (const [name, colors] of Object.entries(FRAMES)) root.setProperty(`--frame-${name}`, frameSvg(colors));
  root.setProperty('--dither-dark', ditherTile('#1a1428', p['2'], 0.5));
  root.setProperty('--dither-shade', ditherTile('rgba(0,0,0,0)', 'rgba(20,15,31,0.55)', 0.5));
  root.setProperty('--starfield', starfieldTile());
}

import { PALETTE } from './palette';
import { bayer, ditherGradient, seeded } from './pixel';

export const WORLD_W = 480;
export const WORLD_H = 200;
export const GROUND_Y = 158;

export interface Ambient {
  /** Palette key for the particle color. */
  color: string;
  count: number;
  vx: number;
  vy: number;
  wobble: number;
}

interface Theme {
  sky: string[];
  stars: boolean;
  orb?: { x: number; y: number; r: number; color: string; glow: string };
  far: string;
  farEdge: string;
  mid: string;
  midEdge: string;
  ground: string[];
  groundTop: string;
  ambient: Ambient;
  seed: number;
  decorate: (ctx: CanvasRenderingContext2D, rnd: () => number) => void;
}

const P = (k: string) => PALETTE[k];

function px(ctx: CanvasRenderingContext2D, x: number, y: number, c: string, w = 1, h = 1) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function ridge(
  ctx: CanvasRenderingContext2D,
  rnd: () => number,
  base: number,
  amp: number,
  rough: number,
  fill: string,
  edge: string,
) {
  const phase = rnd() * 100;
  const phase2 = rnd() * 100;
  for (let x = 0; x < 480; x++) {
    const n =
      Math.sin(x * 0.013 + phase) * 0.6 +
      Math.sin(x * 0.041 + phase2) * 0.3 +
      Math.sin(x * 0.11 + phase) * 0.1 * rough;
    const top = Math.round(base - amp * (0.5 + n * 0.5));
    px(ctx, x, top + 1, fill, 1, GROUND_Y - top);
    px(ctx, x, top, edge);
  }
}

function disc(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, glow: string) {
  for (let y = -r * 2; y <= r * 2; y++) {
    for (let x = -r * 2; x <= r * 2; x++) {
      const d = Math.sqrt(x * x + y * y);
      if (d <= r) px(ctx, cx + x, cy + y, color);
      else if (d <= r * 2 && (1 - (d - r) / r) * 0.6 > bayer(cx + x, cy + y)) px(ctx, cx + x, cy + y, glow);
    }
  }
}

const THEMES: Record<string, Theme> = {
  dimension_corrupta: {
    seed: 11,
    sky: [P('1'), P('p'), P('q'), P('r')],
    stars: true,
    far: P('p'),
    farEdge: P('q'),
    mid: P('2'),
    midEdge: P('3'),
    ground: [P('3'), P('2'), P('1')],
    groundTop: P('r'),
    ambient: { color: 's', count: 26, vx: 2, vy: -6, wobble: 6 },
    decorate(ctx, rnd) {
      // The rift: a jagged crack bleeding light across the sky.
      let x = 300;
      for (let y = 8; y < 90; y++) {
        x += Math.round((rnd() - 0.5) * 3);
        px(ctx, x - 1, y, P('s'));
        px(ctx, x, y, P('S'));
        px(ctx, x + 1, y, P('s'));
        if (rnd() < 0.15) px(ctx, x + (rnd() < 0.5 ? -3 : 3), y, P('r'));
      }
      // Floating rock shards torn out of the ground.
      for (let i = 0; i < 6; i++) {
        const cx = 40 + rnd() * 400;
        const cy = 40 + rnd() * 60;
        const w = 4 + Math.floor(rnd() * 8);
        for (let r = 0; r < w; r++) {
          const half = Math.max(1, Math.round((w - r) * 0.6));
          px(ctx, cx - half, cy + r, P('2'), half * 2, 1);
          px(ctx, cx - half, cy + r, P('3'));
        }
        px(ctx, cx - 1, cy - 1, P('s'), 3, 1);
      }
    },
  },
  volcan: {
    seed: 23,
    sky: [P('a'), P('b'), P('c'), P('d')],
    stars: false,
    orb: { x: 380, y: 46, r: 14, color: P('E'), glow: P('e') },
    far: P('a'),
    farEdge: P('b'),
    mid: P('1'),
    midEdge: P('a'),
    ground: [P('b'), P('a'), P('1')],
    groundTop: P('c'),
    ambient: { color: 'e', count: 34, vx: 4, vy: -14, wobble: 4 },
    decorate(ctx, rnd) {
      // Lava falls down the far peaks.
      for (let i = 0; i < 4; i++) {
        const x = 30 + Math.floor(rnd() * 420);
        const top = 90 + Math.floor(rnd() * 20);
        for (let y = top; y < GROUND_Y; y++) {
          const wob = Math.round(Math.sin(y * 0.3 + i) * 1);
          px(ctx, x + wob, y, P('d'));
          if (y % 3 === 0) px(ctx, x + wob + 1, y, P('e'));
        }
      }
      // Ash smoke bands.
      for (let y = 20; y < 70; y++) {
        for (let x = 0; x < 480; x++) {
          const v = Math.sin(x * 0.02 + y * 0.15) * 0.5 + 0.5;
          if (v * 0.35 > bayer(x, y) && y % 2 === 0) px(ctx, x, y, P('b'));
        }
      }
    },
  },
  bio_forest: {
    seed: 37,
    sky: [P('g'), P('h'), P('h'), P('i')],
    stars: false,
    orb: { x: 90, y: 40, r: 9, color: P('J'), glow: P('j') },
    far: P('g'),
    farEdge: P('h'),
    mid: P('1'),
    midEdge: P('g'),
    ground: [P('h'), P('g'), P('1')],
    groundTop: P('i'),
    ambient: { color: 'J', count: 30, vx: 5, vy: -3, wobble: 10 },
    decorate(ctx, rnd) {
      // Giant fungal stalks with glowing caps.
      for (let i = 0; i < 7; i++) {
        const x = 20 + Math.floor(rnd() * 440);
        const h = 40 + Math.floor(rnd() * 50);
        const top = GROUND_Y - h;
        px(ctx, x, top, P('g'), 3, h);
        px(ctx, x, top, P('h'), 1, h);
        const cap = 8 + Math.floor(rnd() * 8);
        for (let r = 0; r < 5; r++) {
          const half = cap - Math.abs(2 - r) * 2;
          px(ctx, x + 1 - half, top - 4 + r, P('h'), half * 2, 1);
        }
        for (let s = -cap + 2; s < cap - 1; s += 3) px(ctx, x + 1 + s, top + 1, P('j'));
      }
      // Hanging vines from the canopy.
      for (let i = 0; i < 40; i++) {
        const x = Math.floor(rnd() * 480);
        const len = 6 + Math.floor(rnd() * 26);
        for (let y = 0; y < len; y++) px(ctx, x + Math.round(Math.sin(y * 0.4)), y, P('g'));
        px(ctx, x, len, P('j'));
      }
    },
  },
  ocean_shore: {
    seed: 51,
    sky: [P('K'), P('k'), P('L'), P('M')],
    stars: true,
    orb: { x: 120, y: 34, r: 10, color: P('o'), glow: P('n') },
    far: P('K'),
    farEdge: P('L'),
    mid: P('L'),
    midEdge: P('M'),
    ground: [P('y'), P('Y'), P('t')],
    groundTop: P('x'),
    ambient: { color: 'O', count: 24, vx: -3, vy: -8, wobble: 8 },
    decorate(ctx) {
      // The sea: horizontal swell lines with dithered foam.
      for (let y = 118; y < GROUND_Y; y++) {
        for (let x = 0; x < 480; x++) {
          const t = (y - 118) / 40;
          px(ctx, x, y, t > bayer(x, y) ? P('M') : P('L'));
          if ((x + y * 7) % 23 === 0 && y % 4 === 0) px(ctx, x, y, P('N'), 3, 1);
        }
      }
      // A broken sea arch.
      const ax = 330;
      px(ctx, ax, 80, P('K'), 10, 40);
      px(ctx, ax + 34, 92, P('K'), 9, 28);
      px(ctx, ax, 72, P('K'), 44, 10);
      px(ctx, ax, 72, P('L'), 44, 1);
      px(ctx, ax, 80, P('L'), 1, 40);
    },
  },
  void_citadel: {
    seed: 67,
    sky: [P('1'), P('1'), P('p'), P('q')],
    stars: true,
    far: P('1'),
    farEdge: P('p'),
    mid: P('2'),
    midEdge: P('q'),
    ground: [P('2'), P('1'), P('1')],
    groundTop: P('s'),
    ambient: { color: 'S', count: 30, vx: -2, vy: -5, wobble: 5 },
    decorate(ctx, rnd) {
      // The Veil Citadel looming on the horizon.
      const cx = 360;
      px(ctx, cx - 30, 70, P('1'), 60, 60);
      for (let i = 0; i < 5; i++) {
        const tx = cx - 28 + i * 13;
        const th = 20 + Math.floor(rnd() * 26);
        px(ctx, tx, 70 - th, P('1'), 6, th);
        px(ctx, tx + 2, 70 - th - 6, P('1'), 2, 6);
        px(ctx, tx + 2, 70 - th + 6, P('s'));
      }
      for (let i = 0; i < 18; i++) px(ctx, cx - 26 + Math.floor(rnd() * 52), 76 + Math.floor(rnd() * 40), P('r'));
    },
  },
};

export function themeFor(environment: string): Theme {
  return THEMES[environment] ?? THEMES.dimension_corrupta;
}

export function ambientFor(environment: string): Ambient {
  return themeFor(environment).ambient;
}

/** Paints a full battlefield backdrop (sky, horizon, props, ground) at native resolution. */
export function paintBattlefield(environment: string): HTMLCanvasElement {
  const t = themeFor(environment);
  const rnd = seeded(t.seed);
  const canvas = document.createElement('canvas');
  canvas.width = WORLD_W;
  canvas.height = WORLD_H;
  const ctx = canvas.getContext('2d')!;

  ditherGradient(ctx, 0, 0, WORLD_W, GROUND_Y, t.sky);

  if (t.stars) {
    for (let i = 0; i < 90; i++) {
      const x = Math.floor(rnd() * WORLD_W);
      const y = Math.floor(rnd() * 100);
      px(ctx, x, y, rnd() < 0.2 ? P('7') : P('5'));
      if (rnd() < 0.05) {
        px(ctx, x - 1, y, P('5'));
        px(ctx, x + 1, y, P('5'));
        px(ctx, x, y - 1, P('5'));
        px(ctx, x, y + 1, P('5'));
      }
    }
  }
  if (t.orb) disc(ctx, t.orb.x, t.orb.y, t.orb.r, t.orb.color, t.orb.glow);

  ridge(ctx, rnd, 110, 50, 1, t.far, t.farEdge);
  t.decorate(ctx, rnd);
  ridge(ctx, rnd, 140, 26, 2, t.mid, t.midEdge);

  // Ground: lit lip, dithered body, pebbles and cracks.
  const gh = WORLD_H - GROUND_Y;
  ditherGradient(ctx, 0, GROUND_Y, WORLD_W, gh, t.ground);
  px(ctx, 0, GROUND_Y, t.groundTop, WORLD_W, 1);
  for (let x = 0; x < WORLD_W; x++) {
    if (rnd() < 0.35) px(ctx, x, GROUND_Y + 1, t.groundTop);
    if (rnd() < 0.08) px(ctx, x, GROUND_Y - 1, t.groundTop);
  }
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(rnd() * WORLD_W);
    const y = GROUND_Y + 4 + Math.floor(rnd() * (gh - 6));
    px(ctx, x, y, t.ground[0], 2, 1);
    px(ctx, x, y + 1, P('1'), 2, 1);
  }
  return canvas;
}

/** Shadow blob drawn under every unit so they sit on the ground. */
export function shadowCanvas(w: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = 3;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = 'rgba(10,6,18,0.55)';
  ctx.fillRect(2, 0, w - 4, 1);
  ctx.fillRect(0, 1, w, 1);
  ctx.fillRect(2, 2, w - 4, 1);
  return c;
}

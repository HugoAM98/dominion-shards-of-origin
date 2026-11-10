import { OUTLINE, PALETTE } from './palette';

export type Grid = string[];

/** Row overrides applied on top of a base grid to build extra animation frames. */
export type FrameDiff = Record<number, string>;

export function applyDiff(base: Grid, diff?: FrameDiff): Grid {
  if (!diff) return base;
  return base.map((row, i) => diff[i] ?? row);
}

export interface RenderOptions {
  outline?: string | null;
  /** Remaps palette keys, used for faction palette swaps. */
  swap?: Record<string, string>;
}

const cache = new Map<string, HTMLCanvasElement>();

/**
 * Rasterizes a palette grid into a canvas at 1px per cell, adding a 1px outline
 * around the silhouette so art only needs to describe the fill.
 */
export function renderGrid(grid: Grid, opts: RenderOptions = {}): HTMLCanvasElement {
  const outline = opts.outline === undefined ? OUTLINE : opts.outline;
  const pad = outline ? 1 : 0;
  const h = grid.length;
  const w = Math.max(...grid.map((r) => r.length));
  const canvas = document.createElement('canvas');
  canvas.width = w + pad * 2;
  canvas.height = h + pad * 2;
  const ctx = canvas.getContext('2d')!;

  const solid = (x: number, y: number) => {
    if (y < 0 || y >= h || x < 0) return false;
    const ch = grid[y][x];
    return ch !== undefined && ch !== '.' && ch !== ' ';
  };

  if (outline) {
    ctx.fillStyle = outline;
    for (let y = -1; y <= h; y++) {
      for (let x = -1; x <= w; x++) {
        if (solid(x, y)) continue;
        if (solid(x + 1, y) || solid(x - 1, y) || solid(x, y + 1) || solid(x, y - 1)) {
          ctx.fillRect(x + pad, y + pad, 1, 1);
        }
      }
    }
  }

  for (let y = 0; y < h; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      let ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      if (opts.swap?.[ch]) ch = opts.swap[ch];
      const color = PALETTE[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + pad, y + pad, 1, 1);
    }
  }
  return canvas;
}

export function cachedRender(key: string, grid: Grid, opts?: RenderOptions): HTMLCanvasElement {
  let c = cache.get(key);
  if (!c) {
    c = renderGrid(grid, opts);
    cache.set(key, c);
  }
  return c;
}

const urlCache = new Map<string, string>();

export function canvasUrl(key: string, canvas: HTMLCanvasElement): string {
  let url = urlCache.get(key);
  if (!url) {
    url = canvas.toDataURL('image/png');
    urlCache.set(key, url);
  }
  return url;
}

/** <img> that keeps hard pixel edges at an integer scale. */
export function pixelImg(url: string, w: number, h: number, scale: number, className = 'px'): HTMLImageElement {
  const img = document.createElement('img');
  img.src = url;
  img.width = w * scale;
  img.height = h * scale;
  img.className = className;
  img.alt = '';
  img.draggable = false;
  return img;
}

/** Deterministic RNG so painted scenes look identical between visits. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** Ordered-dither threshold in [0,1) for pixel (x,y). */
export function bayer(x: number, y: number): number {
  return (BAYER4[y & 3][x & 3] + 0.5) / 16;
}

/** Vertical gradient across palette colors using ordered dithering. */
export function ditherGradient(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  w: number,
  h: number,
  colors: string[],
): void {
  const bands = colors.length - 1;
  for (let y = 0; y < h; y++) {
    const t = (y / Math.max(1, h - 1)) * bands;
    const i = Math.min(bands - 1, Math.floor(t));
    const f = t - i;
    for (let x = 0; x < w; x++) {
      ctx.fillStyle = f > bayer(x0 + x, y0 + y) ? colors[i + 1] : colors[i];
      ctx.fillRect(x0 + x, y0 + y, 1, 1);
    }
  }
}

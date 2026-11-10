import type { Rarity } from '../data/types';
import { PALETTE } from './palette';
import { bayer } from './pixel';

const W = 160;
const H = 120;
const P = PALETTE;

export const RARITY_RAMPS: Record<Rarity, string[]> = {
  N: [P['3'], P['5'], P['6'], P['7']],
  R: [P.l, P.m, P.n, P.o],
  SR: [P.q, P.r, P.s, P.S],
  SSR: [P.Z, P.z, P.f, P.E],
  UR: [P.U, P.P, P.Q, P['7']],
  LR: [P.r, P.n, P.z, P['7']],
};

const IDLE_RAMP = [P.q, P.r, P.m, P.n];

export interface PortalController {
  /** Spins up, shifts toward the rarity color, then flashes. Resolves on the flash. */
  charge(rarity: Rarity, ms: number): Promise<void>;
}

export function mountPortal(canvas: HTMLCanvasElement): PortalController {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const particles = Array.from({ length: 140 }, (_, i) => ({
    a: (i / 140) * Math.PI * 2,
    r: 0.82 + Math.random() * 0.3,
    k: Math.floor(Math.random() * 4),
  }));
  let speed = 0.5;
  let ramp = IDLE_RAMP;
  let squeeze = 1;
  let flash = 0;
  let lr = false;
  let last = performance.now();
  let angle = 0;

  const put = (x: number, y: number, c: string, w = 1, h = 1) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };

  const frame = (now: number) => {
    if (!canvas.isConnected) return;
    requestAnimationFrame(frame);
    if (now - last < 33) return;
    const dt = (now - last) / 1000;
    last = now;
    angle += speed * dt;
    const t = now / 1000;
    const cx = W / 2;
    const cy = H / 2;
    const rx = 34 * squeeze;
    const ry = 46 * squeeze;
    if (lr) ramp = [RARITY_RAMPS.SR, RARITY_RAMPS.R, RARITY_RAMPS.SSR, RARITY_RAMPS.UR][Math.floor(t * 8) % 4];

    ctx.fillStyle = P['1'];
    ctx.fillRect(0, 0, W, H);
    // vortex: dithered concentric bands
    for (let y = -ry; y <= ry; y++)
      for (let x = -rx; x <= rx; x++) {
        const d = Math.sqrt((x * x) / (rx * rx) + (y * y) / (ry * ry));
        if (d > 1) continue;
        const swirl = (d * 5 - angle * 1.5 + Math.atan2(y, x) * 0.5) % 1;
        const band = swirl < 0 ? swirl + 1 : swirl;
        const c = band * (1 - d) * 1.3 > bayer(cx + x, cy + y) ? ramp[1] : d < 0.35 ? ramp[0] : P['2'];
        put(cx + x, cy + y, c);
      }
    // core
    const core = 4 + Math.round(Math.sin(t * 4) * 1);
    put(cx - core / 2, cy - core, ramp[3], core, core * 2);
    // ring particles
    for (const pt of particles) {
      const a = pt.a + angle * (1 + pt.k * 0.15);
      const x = cx + Math.cos(a) * rx * pt.r;
      const y = cy + Math.sin(a) * ry * pt.r;
      put(x, y, ramp[Math.min(3, pt.k + (Math.sin(a * 3 + t) > 0.6 ? 1 : 0))]);
    }
    if (flash > 0) {
      ctx.globalAlpha = Math.min(1, flash);
      ctx.fillStyle = P['7'];
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      flash -= dt * 2.5;
    }
  };
  requestAnimationFrame(frame);

  return {
    charge(rarity, ms) {
      return new Promise((resolve) => {
        const t0 = performance.now();
        const target = RARITY_RAMPS[rarity];
        const step = () => {
          const k = Math.min(1, (performance.now() - t0) / ms);
          speed = 0.5 + k * k * 9;
          squeeze = 1 - k * 0.35;
          lr = rarity === 'LR' && k > 0.6;
          if (!lr) ramp = k < 0.45 ? IDLE_RAMP : target;
          if (k < 1) requestAnimationFrame(step);
          else {
            flash = 1.2;
            speed = 0.8;
            squeeze = 1;
            lr = rarity === 'LR';
            resolve();
          }
        };
        requestAnimationFrame(step);
      });
    },
  };
}

import { PALETTE } from './palette';
import { bayer, ditherGradient, seeded } from './pixel';

const W = 240;
const H = 135;
const P = PALETTE;

function put(ctx: CanvasRenderingContext2D, x: number, y: number, c: string, w = 1, h = 1) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function paintStatic(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const rnd = seeded(404);
  ditherGradient(ctx, 0, 0, W, H, [P['1'], P['1'], P.p, P.q, P.r]);

  // Far range.
  for (let x = 0; x < W; x++) {
    const top = Math.round(104 - 14 * (0.5 + 0.5 * Math.sin(x * 0.045 + 1.3)) - 6 * Math.sin(x * 0.13));
    put(ctx, x, top, P.q);
    put(ctx, x, top + 1, P.p, 1, H - top);
  }
  // Low valley floor, then a cliff on the right where the commander watches the crystal.
  for (let x = 0; x < W; x++) {
    const m = W - 1 - x;
    const cliff = m < 64 ? Math.round(110 + Math.max(0, m - 40) * 0.7 + Math.sin(m * 0.3) * 1.5) : 999;
    const valley = Math.round(126 + Math.sin(x * 0.08) * 2);
    const top = Math.min(cliff, valley);
    put(ctx, x, top, top === cliff ? P['3'] : P['2']);
    put(ctx, x, top + 1, P['1'], 1, H - top);
    for (let y = top + 1; y < top + 12; y++) if ((1 - (y - top) / 12) * 0.7 > bayer(x, y)) put(ctx, x, y, P['2']);
  }
  const cx = W - 30;
  const cy = 109;
  // commander faces left: cloak, head, staff with a glowing tip
  put(ctx, cx - 2, cy - 9, P['1'], 3, 9);
  put(ctx, cx - 3, cy - 6, P['1'], 5, 6);
  put(ctx, cx - 2, cy - 11, P['1'], 2, 2);
  put(ctx, cx - 5, cy - 14, P['1'], 1, 14);
  put(ctx, cx - 5, cy - 15, P.n);
  // banner behind him, flag pointing away from the crystal
  put(ctx, cx + 9, cy - 22, P['1'], 1, 22);
  put(ctx, cx + 4, cy - 22, P.z, 5, 7);
  put(ctx, cx + 4, cy - 15, P.z, 2, 2);
  put(ctx, cx + 7, cy - 15, P.z, 2, 2);
  put(ctx, cx + 5, cy - 20, P.o, 2, 3);

  for (let i = 0; i < 40; i++) put(ctx, rnd() * W, 100 + rnd() * 30, rnd() < 0.5 ? P.q : P['2']);
  return c;
}

/** Shattered Origin crystal, drawn as a shaded rhombus with a crack and a missing chip. */
function drawCrystal(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
  const hw = 15;
  const hh = 24;
  for (let y = -hh; y <= hh; y++) {
    const span = Math.round(hw * (1 - Math.abs(y) / hh));
    for (let x = -span; x <= span; x++) {
      if (x > 4 && y < -6 && x + -y > 18) continue; // chipped corner
      let c = x < -span / 3 ? P.o : x < span / 3 ? P.n : P.m;
      if (y > hh / 2) c = x < 0 ? P.m : P.l;
      if (x === -span) c = P.l;
      put(ctx, cx + x, cy + y, c);
    }
  }
  // crack zigzag
  let x = -2;
  for (let y = -hh + 6; y < hh - 4; y++) {
    x += y % 4 === 0 ? 1 : y % 4 === 2 ? -1 : 0;
    put(ctx, cx + x, cy + y, P.k);
  }
  // inner pulse
  const pulse = 0.5 + 0.5 * Math.sin(t * 2);
  put(ctx, cx - 3, cy - 2, pulse > 0.5 ? P['7'] : P.o, 2, 3);
}

export function mountMenuScene(canvas: HTMLCanvasElement): void {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const bg = paintStatic();
  const rnd = seeded(77);
  const stars = Array.from({ length: 70 }, () => ({ x: Math.floor(rnd() * W), y: Math.floor(rnd() * 90), s: rnd() * 6 }));
  const shards = Array.from({ length: 9 }, (_, i) => ({ a: (i / 9) * Math.PI * 2, r: 36 + rnd() * 16, size: 1 + Math.floor(rnd() * 3), sp: 0.25 + rnd() * 0.2 }));
  const motes = Array.from({ length: 24 }, () => ({ x: rnd() * W, y: rnd() * H, s: rnd() * 6 }));
  const start = performance.now();
  let last = start;

  const frame = (now: number) => {
    if (!canvas.isConnected) return;
    requestAnimationFrame(frame);
    if (now - last < 33) return;
    const dt = (now - last) / 1000;
    last = now;
    const t = (now - start) / 1000;

    ctx.drawImage(bg, 0, 0);
    for (const s of stars) {
      const tw = Math.sin(t * 1.7 + s.s);
      if (tw > -0.3) put(ctx, s.x, s.y, tw > 0.8 ? P['7'] : P['5']);
    }

    const cx = 150;
    const cy = 50 + Math.round(Math.sin(t * 0.9) * 2);
    // glow halo with ordered dithering
    for (let y = -36; y <= 36; y++)
      for (let x = -36; x <= 36; x++) {
        const d = Math.sqrt(x * x + y * y * 0.7) / 36;
        if (d < 1 && (1 - d) * 0.45 > bayer(cx + x, cy + y)) put(ctx, cx + x, cy + y, P.l);
      }
    const behind = shards.filter((s) => Math.sin(s.a + t * s.sp) < 0);
    const front = shards.filter((s) => Math.sin(s.a + t * s.sp) >= 0);
    const drawShard = (s: (typeof shards)[number]) => {
      const a = s.a + t * s.sp;
      const sx = cx + Math.cos(a) * s.r;
      const sy = cy + Math.sin(a) * s.r * 0.28 + Math.sin(t + s.a) * 2;
      put(ctx, sx, sy - s.size, P.o, 1, s.size * 2 + 1);
      put(ctx, sx - 1, sy, P.n, 3, 1);
      if (s.size > 1) put(ctx, sx + 1, sy - 1, P.m, 1, 2);
    };
    behind.forEach(drawShard);
    drawCrystal(ctx, cx, cy, t);
    front.forEach(drawShard);

    for (const m of motes) {
      m.y -= dt * 6;
      m.x += Math.sin(t + m.s) * dt * 4;
      if (m.y < 0) {
        m.y = H;
        m.x = Math.random() * W;
      }
      if (Math.sin(t * 3 + m.s) > -0.2) put(ctx, m.x, m.y, m.s > 3 ? P.s : P.n);
    }
  };
  requestAnimationFrame(frame);
}

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  return ctx;
}

export function playTone(freq: number, duration = 0.08, volume = 0.04): void {
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration);
}

export function sfxDeploy(): void {
  playTone(420, 0.06, 0.05);
}

export function sfxHit(): void {
  playTone(180, 0.04, 0.03);
}

export function sfxVictory(): void {
  playTone(660, 0.12, 0.05);
  setTimeout(() => playTone(880, 0.15, 0.05), 100);
}

export function sfxSummon(): void {
  playTone(320, 0.1, 0.06);
  setTimeout(() => playTone(540, 0.12, 0.05), 80);
}

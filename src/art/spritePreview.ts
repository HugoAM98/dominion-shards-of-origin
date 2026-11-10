import { ALL_CREATURE_IDS } from '../data/creatures';
import { creatureFrames } from './atlas';
import { renderGrid } from './pixel';
import { ENEMY_CITADEL, FACTION_SWAP, FX, ICONS, PLAYER_CRYSTAL, PLAYER_TOWER } from './worldSprites';

/** Dev-only sheet (open with ?sprites) to review every sprite enlarged. */
export function mountSpritePreview(root: HTMLElement): void {
  root.innerHTML = '';
  root.style.cssText =
    'background:#2b2540;padding:8px;display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;max-width:none';
  const k = Number(new URLSearchParams(location.search).get('k') ?? '3') / 6;
  const add = (label: string, canvas: HTMLCanvasElement, s = 6) => {
    const scale = Math.max(1, Math.round(s * k));
    const box = document.createElement('figure');
    box.style.cssText = 'margin:0;color:#bcb0d6;font:12px monospace;text-align:center';
    const big = document.createElement('canvas');
    big.width = canvas.width * scale;
    big.height = canvas.height * scale;
    const ctx = big.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, 0, 0, big.width, big.height);
    box.append(big, Object.assign(document.createElement('figcaption'), { textContent: label }));
    root.appendChild(box);
  };
  for (const id of ALL_CREATURE_IDS) {
    const f = creatureFrames(id);
    add(`${id} A`, f.idle[0]);
    add('idle B', f.idle[1]);
    add('walk B', f.walk[1]);
    add('attack', f.attack);
  }
  add('tower', renderGrid(PLAYER_TOWER), 4);
  add('crystal', renderGrid(PLAYER_CRYSTAL), 4);
  for (const f of Object.keys(FACTION_SWAP)) {
    add(`citadel ${f}`, renderGrid(ENEMY_CITADEL, { swap: FACTION_SWAP[f as keyof typeof FACTION_SWAP] }), 4);
  }
  for (const [k, frames] of Object.entries(FX)) frames.forEach((g, i) => add(`${k}${i}`, renderGrid(g, { outline: null }), 6));
  for (const [k, g] of Object.entries(ICONS)) add(k, renderGrid(g), 6);
}

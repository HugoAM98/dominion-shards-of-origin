import { CREATURE_SPRITES, type CreatureSprite } from './creatureSprites';
import { applyDiff, cachedRender, canvasUrl, pixelImg, type Grid } from './pixel';
import type { FactionId } from '../data/types';
import { ENEMY_CITADEL, FACTION_SWAP, ICONS } from './worldSprites';

export interface CreatureFrames {
  idle: HTMLCanvasElement[];
  walk: HTMLCanvasElement[];
  attack: HTMLCanvasElement;
  sprite: CreatureSprite;
}

const FALLBACK: CreatureSprite = { base: ['77', '77'], attack: {} };

export function creatureSprite(id: string): CreatureSprite {
  return CREATURE_SPRITES[id] ?? FALLBACK;
}

export function creatureFrames(id: string): CreatureFrames {
  const s = creatureSprite(id);
  const base = cachedRender(`${id}:base`, s.base);
  const idleB = s.idle ? cachedRender(`${id}:idle`, applyDiff(s.base, s.idle)) : base;
  const walkB = s.walk ? cachedRender(`${id}:walk`, applyDiff(s.base, s.walk)) : idleB;
  const attack = cachedRender(`${id}:attack`, applyDiff(s.base, s.attack));
  return { idle: [base, idleB], walk: [base, walkB], attack, sprite: s };
}

export function creaturePortraitUrl(id: string): { url: string; w: number; h: number } {
  const c = creatureFrames(id).idle[0];
  return { url: canvasUrl(`${id}:base`, c), w: c.width, h: c.height };
}

/** Picks the largest integer scale that fits the box, so pixels stay square. */
export function creatureImg(id: string, maxW: number, maxH: number, className = 'px'): HTMLImageElement {
  const { url, w, h } = creaturePortraitUrl(id);
  const scale = Math.max(1, Math.floor(Math.min(maxW / w, maxH / h)));
  return pixelImg(url, w, h, scale, className);
}

export function iconImg(name: keyof typeof ICONS | string, scale = 2, className = 'px icon'): HTMLImageElement {
  const grid: Grid = ICONS[name] ?? ICONS.star;
  const c = cachedRender(`icon:${name}`, grid);
  return pixelImg(canvasUrl(`icon:${name}`, c), c.width, c.height, scale, className);
}

export function citadelImg(faction: FactionId, scale: number, className = 'px'): HTMLImageElement {
  const key = `citadel:${faction}`;
  const c = cachedRender(key, ENEMY_CITADEL, { swap: FACTION_SWAP[faction] });
  return pixelImg(canvasUrl(key, c), c.width, c.height, scale, className);
}

export function iconHtml(name: string, scale = 2): string {
  return iconImg(name, scale).outerHTML;
}

import { creatureFrames, creatureImg, iconImg } from '../art/atlas';
import { canvasUrl } from '../art/pixel';
import { CREATURES } from '../data/creatures';
import { FACTIONS } from '../data/factions';
import type { CombatRole, CreatureDefinition, Rarity } from '../data/types';

export const ROLE_LABEL: Record<CombatRole, string> = {
  tank: 'Tanque',
  warrior: 'Guerrero',
  assassin: 'Asesino',
  ranged: 'Tirador',
  support: 'Soporte',
  healer: 'Sanador',
  controller: 'Control',
  artillery: 'Artillería',
  swarm: 'Enjambre',
};

export const RARITY_LABEL: Record<Rarity, string> = {
  N: 'Común',
  R: 'Raro',
  SR: 'Épico',
  SSR: 'Legendario',
  UR: 'Mítico',
  LR: 'Primordial',
};

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  children?: (Node | string)[],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (children) {
    for (const child of children) node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

export type BtnVariant = 'gold' | 'violet' | 'teal' | 'red' | 'ghost';

export function btn(
  label: string,
  variant: BtnVariant = 'gold',
  onClick?: () => void,
  icon?: string,
  extra = '',
): HTMLButtonElement {
  const b = el('button', `pxbtn pxbtn-${variant} ${extra}`.trim());
  b.type = 'button';
  if (icon) b.append(iconImg(icon, 2));
  b.append(el('span', '', [label]));
  if (onClick) b.addEventListener('click', onClick);
  return b;
}

export function backBtn(onClick: () => void, label = 'Volver'): HTMLButtonElement {
  return btn(`◂ ${label}`, 'ghost', onClick, undefined, 'pxbtn-sm');
}

export function topBar(title: string, onBack: () => void, right?: Node): HTMLElement {
  const bar = el('header', 'top-bar', [backBtn(onBack), el('h1', 'screen-title', [title])]);
  if (right) bar.append(right);
  return bar;
}

export function rarityBadge(rarity: Rarity): HTMLSpanElement {
  const b = el('span', `rarity rarity-${rarity}`, [rarity]);
  b.title = RARITY_LABEL[rarity];
  return b;
}

export function currencyStrip(dust: number, fragments: number): HTMLElement {
  const strip = el('div', 'currency-strip');
  const chip = (icon: string, value: number, label: string) => {
    const c = el('span', 'currency', [iconImg(icon, 2), el('b', '', [String(value)]), el('small', '', [label])]);
    return c;
  };
  strip.append(chip('fragment', fragments, 'Fragmentos'), chip('dust', dust, 'Polvo'));
  return strip;
}

function statLine(icon: string, value: string | number, title: string): HTMLElement {
  const s = el('span', 'stat', [iconImg(icon, 1), el('span', '', [String(value)])]);
  s.title = title;
  return s;
}

export interface CardOptions {
  meta?: string;
  locked?: boolean;
  level?: number;
  onClick?: () => void;
}

export function creatureCard(def: CreatureDefinition, opts: CardOptions = {}): HTMLElement {
  const faction = FACTIONS[def.faction];
  const card = el('article', `card card-${def.rarity}${opts.locked ? ' is-locked' : ''}`);
  const art = el('div', 'card-art');
  art.style.setProperty('--faction', faction?.color ?? '#241c36');
  art.style.setProperty('--accent', faction?.accent ?? '#7fe0e6');
  art.append(creatureImg(def.id, 92, 64, 'px card-sprite'));
  art.append(rarityBadge(def.rarity));
  if (opts.level) art.append(el('span', 'card-level', [`Nv ${opts.level}`]));

  const body = el('div', 'card-body', [
    el('h3', 'card-name', [opts.locked ? '???' : def.name]),
    el('p', 'card-sub', [`${faction?.name ?? def.faction} · ${ROLE_LABEL[def.role]}`]),
    el('div', 'card-stats', [
      statLine('heart', def.stats.hp, 'Vida'),
      statLine('sword', def.stats.attack, 'Ataque'),
      statLine('energy', def.stats.deployCost, 'Coste'),
    ]),
  ]);
  if (opts.meta) body.append(el('p', 'card-meta', [opts.meta]));
  card.append(art, body);
  if (opts.onClick) {
    card.tabIndex = 0;
    card.classList.add('is-clickable');
    card.addEventListener('click', opts.onClick);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') opts.onClick?.();
    });
  }
  return card;
}

export function deployChip(creatureId: string, onDeploy: () => void): HTMLButtonElement {
  const def = CREATURES[creatureId];
  const chip = el('button', `deploy-chip chip-${def.rarity}`);
  chip.type = 'button';
  chip.dataset.creatureId = creatureId;
  chip.title = `${def.name} — ${def.stats.deployCost} energía`;
  chip.append(
    el('span', 'chip-art', [creatureImg(creatureId, 64, 40, 'px chip-sprite')]),
    el('span', 'chip-cost', [iconImg('energy', 1), el('b', '', [String(def.stats.deployCost)])]),
    el('span', 'chip-cd'),
  );
  chip.addEventListener('click', onDeploy);
  return chip;
}

/** Modal with an animated sprite, stats and lore. */
export function openCreatureDetail(id: string, extra?: Node): void {
  const def = CREATURES[id];
  if (!def) return;
  const faction = FACTIONS[def.faction];
  const frames = creatureFrames(id);
  const urls = [
    canvasUrl(`${id}:base`, frames.idle[0]),
    canvasUrl(`${id}:idleB`, frames.idle[1]),
    canvasUrl(`${id}:walkB`, frames.walk[1]),
    canvasUrl(`${id}:atk`, frames.attack),
  ];
  const sprite = creatureImg(id, 220, 150, 'px detail-sprite');
  let tick = 0;
  const timer = window.setInterval(() => {
    if (!sprite.isConnected) return window.clearInterval(timer);
    tick++;
    const k = tick % 12;
    sprite.src = k === 11 ? urls[3] : frames.sprite.floats ? urls[Math.floor(tick / 2) % 2] : urls[[0, 2][tick % 2]];
  }, 220);

  const backdrop = el('div', 'modal-backdrop');
  const close = () => backdrop.remove();
  backdrop.addEventListener('click', (e) => e.target === backdrop && close());

  const stage = el('div', 'detail-stage', [sprite, el('div', 'detail-ground')]);
  stage.style.setProperty('--faction', faction?.color ?? '#241c36');
  stage.style.setProperty('--accent', faction?.accent ?? '#7fe0e6');

  const rows: [string, string, string][] = [
    ['heart', 'Vida', String(def.stats.hp)],
    ['sword', 'Ataque', String(def.stats.attack)],
    ['star', 'Vel. ataque', `${def.stats.attackSpeed}/s`],
    ['map', 'Movimiento', String(def.stats.moveSpeed)],
    ['tower', 'Alcance', String(def.stats.range)],
    ['energy', 'Coste', String(def.stats.deployCost)],
  ];
  const stats = el('div', 'detail-stats');
  for (const [icon, label, value] of rows) stats.append(el('div', 'detail-stat', [iconImg(icon, 2), el('span', '', [label]), el('b', '', [value])]));

  const panel = el('div', 'modal px-panel detail', [
    el('div', 'detail-head', [
      rarityBadge(def.rarity),
      el('div', '', [el('h2', '', [def.name]), el('p', 'card-sub', [`${faction?.name} · ${ROLE_LABEL[def.role]} · ${RARITY_LABEL[def.rarity]}`])]),
    ]),
    stage,
    stats,
    el('p', 'detail-lore', [def.lore]),
  ]);
  if (def.passive) panel.append(el('p', 'detail-skill', [el('b', '', ['Pasiva  ']), def.passive]));
  if (def.active) panel.append(el('p', 'detail-skill', [el('b', '', ['Técnica  ']), def.active]));
  if (extra) panel.append(extra);
  panel.append(btn('Cerrar', 'ghost', close));
  backdrop.append(panel);
  document.body.append(backdrop);
}

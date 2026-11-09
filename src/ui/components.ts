import { CREATURES } from '../data/creatures';
import { FACTIONS } from '../data/factions';
import type { CreatureDefinition } from '../data/types';

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  children?: (Node | string)[],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (children) {
    for (const child of children) {
      if (typeof child === 'string') node.appendChild(document.createTextNode(child));
      else node.appendChild(child);
    }
  }
  return node;
}

export function btn(label: string, className = 'btn btn-primary', onClick?: () => void): HTMLButtonElement {
  const button = el('button', className, [label]);
  button.type = 'button';
  if (onClick) button.addEventListener('click', onClick);
  return button;
}

export function rarityBadge(rarity: string): HTMLSpanElement {
  return el('span', `rarity rarity-${rarity}`, [rarity]);
}

export function creatureCard(def: CreatureDefinition, meta?: string): HTMLElement {
  const faction = FACTIONS[def.faction];
  const card = el('article', 'creature-card');
  const portrait = el('div', 'creature-portrait');
  portrait.style.setProperty('--accent', def.accent);
  portrait.dataset.shape = def.shape;
  const body = el('div', 'creature-card-body', [
    el('h3', '', [def.name]),
    el('p', 'creature-meta', [`${faction?.name ?? def.faction} · ${def.role}`]),
    rarityBadge(def.rarity),
  ]);
  if (meta) body.appendChild(el('p', 'creature-extra', [meta]));
  card.append(portrait, body);
  return card;
}

export function creatureChip(creatureId: string, cost?: number, disabled = false, onDeploy?: () => void): HTMLButtonElement {
  const def = CREATURES[creatureId];
  const chip = el('button', `deploy-chip${disabled ? ' is-disabled' : ''}`) as HTMLButtonElement;
  chip.type = 'button';
  chip.disabled = disabled;
  chip.innerHTML = `
    <span class="chip-shape" style="--accent:${def.accent}"></span>
    <span class="chip-info">
      <strong>${def.name}</strong>
      <small>${cost ?? def.stats.deployCost} energía</small>
    </span>
  `;
  if (onDeploy) chip.addEventListener('click', onDeploy);
  return chip;
}

export function topBar(title: string, onBack?: () => void): HTMLElement {
  const bar = el('header', 'top-bar');
  if (onBack) bar.appendChild(btn('← Volver', 'btn btn-ghost btn-back', onBack));
  bar.appendChild(el('h1', 'screen-title', [title]));
  return bar;
}

export function currencyStrip(dust: number, fragments: number): HTMLElement {
  const strip = el('div', 'currency-strip');
  strip.innerHTML = `
    <span class="currency"><i class="cur-icon dust"></i> ${dust} Polvo</span>
    <span class="currency"><i class="cur-icon fragment"></i> ${fragments} Fragmentos</span>
  `;
  return strip;
}

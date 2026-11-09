import { ALL_CREATURE_IDS, CREATURES } from '../../data/creatures';
import { RARITY_ORDER } from '../../data/gacha';
import { savePlayer } from '../../systems/playerState';
import { registerScreen } from '../router';
import { btn, creatureCard, el } from '../components';

registerScreen('collection', (ctx) => {
  const shell = el('section', 'screen screen-collection');
  shell.appendChild(
    el('header', 'top-bar', [
      btn('← Menú', 'btn btn-ghost btn-back', () => ctx.navigate('menu')),
      el('h1', 'screen-title', ['Colección de criaturas']),
    ]),
  );

  const loadoutBar = el('div', 'loadout-bar');
  const loadoutLabel = el('p', 'loadout-label', ['Formación de batalla (5 unidades):']);
  const loadoutChips = el('div', 'loadout-chips');

  const refreshLoadout = () => {
    loadoutChips.innerHTML = '';
    for (const id of ctx.player.loadout) {
      const def = CREATURES[id];
      const chip = el('span', 'loadout-chip', [def?.name ?? id]);
      chip.style.setProperty('--accent', def?.accent ?? '#fff');
      loadoutChips.appendChild(chip);
    }
  };
  refreshLoadout();
  loadoutBar.append(loadoutLabel, loadoutChips);

  const grid = el('div', 'collection-grid');
  const rank = (id: string) => RARITY_ORDER.indexOf(CREATURES[id]?.rarity ?? 'N');
  const sorted = [...ALL_CREATURE_IDS].sort((a, b) => {
    const ownedDiff = Number(Boolean(ctx.player.owned[b])) - Number(Boolean(ctx.player.owned[a]));
    return ownedDiff || rank(b) - rank(a);
  });
  const ownedCount = sorted.filter((id) => ctx.player.owned[id]).length;
  loadoutBar.appendChild(el('p', 'settings-note', [`Descubiertas: ${ownedCount} / ${sorted.length}`]));

  for (const id of sorted) {
    const def = CREATURES[id];
    if (!def) continue;
    const owned = ctx.player.owned[id];
    const card = creatureCard(def, owned ? `×${owned.count} · Nv.${owned.level}` : 'Sin descubrir — búscala en el Portal');
    if (!owned) card.classList.add('is-undiscovered');
    const inLoadout = ctx.player.loadout.includes(id);
    const toggle = btn(inLoadout ? 'En formación' : 'Añadir a formación', `btn btn-sm ${inLoadout ? 'btn-ghost' : 'btn-accent'}`, () => {
      let loadout = [...ctx.player.loadout];
      if (inLoadout) {
        if (loadout.length <= 1) return;
        loadout = loadout.filter((x) => x !== id);
      } else {
        if (loadout.length >= 5) loadout.shift();
        loadout.push(id);
      }
      const next = { ...ctx.player, loadout };
      ctx.setPlayer(next);
      savePlayer(next);
      ctx.navigate('collection');
    });
    toggle.disabled = !owned;
    card.appendChild(toggle);
    grid.appendChild(card);
  }

  shell.append(loadoutBar, grid);
  return shell;
});

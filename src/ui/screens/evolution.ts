import { CREATURES } from '../../data/creatures';
import { upgradeCost, upgradeCreature } from '../../systems/progression';
import { registerScreen } from '../router';
import { btn, creatureCard, currencyStrip, el } from '../components';

registerScreen('evolution', (ctx) => {
  const shell = el('section', 'screen screen-evolution');
  shell.appendChild(
    el('header', 'top-bar', [
      btn('← Menú', 'btn btn-ghost btn-back', () => ctx.navigate('menu')),
      el('h1', 'screen-title', ['Laboratorio de evolución']),
    ]),
  );

  const currencies = currencyStrip(ctx.player.shardDust, ctx.player.originFragments);
  const grid = el('div', 'collection-grid');

  const ownedIds = Object.keys(ctx.player.owned).sort();

  for (const id of ownedIds) {
    const def = CREATURES[id];
    const owned = ctx.player.owned[id];
    if (!def || !owned) continue;
    const cost = upgradeCost(id, owned.level);
    const atMax = owned.level >= 20;
    const card = creatureCard(
      def,
      atMax ? 'Nivel máximo' : `Siguiente mejora: ${cost} polvo (+8% stats por nivel)`,
    );
    const action = btn(
      atMax ? 'Máximo' : `Evolucionar (Nv.${owned.level} → ${owned.level + 1})`,
      `btn btn-sm ${ctx.player.shardDust >= cost ? 'btn-primary' : 'btn-ghost'}`,
      () => {
        const next = upgradeCreature(ctx.player, id);
        if (next) {
          ctx.setPlayer(next);
          ctx.navigate('evolution');
        }
      },
    );
    action.disabled = atMax || ctx.player.shardDust < cost;
    card.appendChild(action);
    grid.appendChild(card);
  }

  shell.append(currencies, el('p', 'evolution-note', ['Mejora criaturas con polvo obtenido de duplicados y misiones.']), grid);
  return shell;
});

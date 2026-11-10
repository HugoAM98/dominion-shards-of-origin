import { creatureImg, iconImg } from '../../art/atlas';
import { CREATURES } from '../../data/creatures';
import { RARITY_ORDER } from '../../data/gacha';
import { playTone } from '../../systems/audio';
import { upgradeCost, upgradeCreature } from '../../systems/progression';
import { registerScreen } from '../router';
import { ROLE_LABEL, btn, currencyStrip, el, rarityBadge, topBar } from '../components';

const MAX_LEVEL = 20;
const scaled = (base: number, level: number) => Math.round(base * (1 + 0.08 * (level - 1)));

registerScreen('evolution', (ctx) => {
  const shell = el('section', 'screen screen-evolution');
  let currencies = currencyStrip(ctx.player.shardDust, ctx.player.originFragments);
  shell.append(topBar('Forja de evolución', () => ctx.navigate('menu'), currencies));

  const ids = Object.keys(ctx.player.owned)
    .filter((id) => CREATURES[id])
    .sort((a, b) => RARITY_ORDER.indexOf(CREATURES[b].rarity) - RARITY_ORDER.indexOf(CREATURES[a].rarity));
  let selected = ids[0];

  const list = el('div', 'evo-list');
  const detail = el('div', 'evo-detail px-panel');

  const renderList = () => {
    list.innerHTML = '';
    for (const id of ids) {
      const lv = ctx.player.owned[id].level;
      const canAfford = lv < MAX_LEVEL && ctx.player.shardDust >= upgradeCost(id, lv);
      const item = el('button', `evo-item chip-${CREATURES[id].rarity}${id === selected ? ' is-selected' : ''}`, [
        creatureImg(id, 64, 40, 'px'),
        el('span', 'evo-lv', [lv >= MAX_LEVEL ? 'MAX' : `Nv ${lv}`]),
      ]);
      if (canAfford) item.append(el('i', 'evo-ready'));
      item.type = 'button';
      item.title = CREATURES[id].name;
      item.addEventListener('click', () => {
        selected = id;
        renderList();
        renderDetail();
      });
      list.append(item);
    }
  };

  const renderDetail = (justEvolved = false) => {
    detail.innerHTML = '';
    if (!selected) {
      detail.append(el('p', '', ['Aún no tienes criaturas.']));
      return;
    }
    const def = CREATURES[selected];
    const lv = ctx.player.owned[selected].level;
    const atMax = lv >= MAX_LEVEL;
    const cost = upgradeCost(selected, lv);
    const stage = el('div', `evo-stage${justEvolved ? ' is-evolving' : ''}`, [creatureImg(selected, 200, 130, 'px evo-sprite'), el('div', 'detail-ground')]);
    const pips = el('div', 'evo-pips');
    for (let i = 1; i <= MAX_LEVEL; i++) pips.append(el('i', i <= lv ? 'is-on' : ''));

    const row = (icon: string, label: string, base: number) =>
      el('div', 'evo-row', [
        iconImg(icon, 2),
        el('span', '', [label]),
        el('b', '', [String(scaled(base, lv))]),
        atMax ? el('em', '', ['']) : el('em', '', [`▸ ${scaled(base, lv + 1)}`]),
      ]);

    const action = btn(atMax ? 'Nivel máximo' : `Evolucionar a Nv ${lv + 1}`, 'gold', () => {
      const next = upgradeCreature(ctx.player, selected);
      if (!next) return;
      ctx.setPlayer(next);
      ctx.player = next;
      [523, 659, 784].forEach((f, i) => setTimeout(() => playTone(f, 0.1, 0.04), i * 70));
      const fresh = currencyStrip(next.shardDust, next.originFragments);
      currencies.replaceWith(fresh);
      currencies = fresh;
      renderList();
      renderDetail(true);
    }, 'evolve');
    if (!atMax) action.append(el('span', 'btn-cost', [iconImg('dust', 1), String(cost)]));
    action.disabled = atMax || ctx.player.shardDust < cost;

    detail.append(
      el('div', 'detail-head', [rarityBadge(def.rarity), el('div', '', [el('h2', '', [def.name]), el('p', 'card-sub', [ROLE_LABEL[def.role]])])]),
      stage,
      pips,
      el('div', 'evo-rows', [row('heart', 'Vida', def.stats.hp), row('sword', 'Ataque', def.stats.attack)]),
      action,
      el('p', 'evo-note', ['Cada nivel otorga +8% de vida y ataque. El polvo se obtiene de misiones y de invocaciones repetidas.']),
    );
  };

  renderList();
  renderDetail();
  shell.append(el('div', 'evo-layout', [el('div', 'evo-list-wrap px-inset', [list]), detail]));
  return shell;
});

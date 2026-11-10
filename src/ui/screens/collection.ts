import { creatureImg } from '../../art/atlas';
import { ALL_CREATURE_IDS, CREATURES } from '../../data/creatures';
import { FACTION_LIST } from '../../data/factions';
import { RARITY_ORDER } from '../../data/gacha';
import { registerScreen } from '../router';
import { btn, creatureCard, el, openCreatureDetail, topBar } from '../components';

const SQUAD_SIZE = 5;

registerScreen('collection', (ctx) => {
  const shell = el('section', 'screen screen-collection');
  const ownedCount = ALL_CREATURE_IDS.filter((id) => ctx.player.owned[id]).length;
  shell.append(topBar('Bestiario', () => ctx.navigate('menu'), el('span', 'top-count px-inset', [`${ownedCount}/${ALL_CREATURE_IDS.length}`])));

  const setLoadout = (loadout: string[]) => {
    ctx.setPlayer({ ...ctx.player, loadout });
    ctx.navigate('collection');
  };
  const toggle = (id: string) => {
    const inSquad = ctx.player.loadout.includes(id);
    if (inSquad) {
      if (ctx.player.loadout.length > 1) setLoadout(ctx.player.loadout.filter((x) => x !== id));
    } else {
      const next = [...ctx.player.loadout];
      if (next.length >= SQUAD_SIZE) next.shift();
      next.push(id);
      setLoadout(next);
    }
  };

  const slots = el('div', 'squad-slots');
  for (let i = 0; i < SQUAD_SIZE; i++) {
    const id = ctx.player.loadout[i];
    const slot = el('button', `squad-slot${id ? ` chip-${CREATURES[id].rarity}` : ' is-empty'}`);
    slot.type = 'button';
    if (id) {
      slot.append(creatureImg(id, 76, 46, 'px'), el('small', '', [CREATURES[id].name]));
      slot.title = 'Quitar de la escuadra';
      slot.addEventListener('click', () => toggle(id));
    } else slot.append(el('small', '', ['Vacío']));
    slots.append(slot);
  }
  shell.append(el('div', 'squad px-panel', [el('h2', 'squad-title', ['Escuadra de batalla']), slots]));

  let filter = 'all';
  const tabs = el('div', 'faction-tabs');
  const grid = el('div', 'card-grid');
  const renderGrid = () => {
    grid.innerHTML = '';
    const ids = ALL_CREATURE_IDS.filter((id) => filter === 'all' || CREATURES[id].faction === filter).sort((a, b) => {
      const own = Number(Boolean(ctx.player.owned[b])) - Number(Boolean(ctx.player.owned[a]));
      return own || RARITY_ORDER.indexOf(CREATURES[b].rarity) - RARITY_ORDER.indexOf(CREATURES[a].rarity);
    });
    for (const id of ids) {
      const def = CREATURES[id];
      const owned = ctx.player.owned[id];
      const inSquad = ctx.player.loadout.includes(id);
      const card = creatureCard(def, {
        locked: !owned,
        level: owned?.level,
        meta: owned ? (inSquad ? '★ En escuadra' : `Copias ×${owned.count}`) : 'Búscala en el Portal',
        onClick: () => {
          if (!owned) return;
          const action = btn(inSquad ? 'Quitar de la escuadra' : 'Añadir a la escuadra', inSquad ? 'red' : 'teal', () => {
            document.querySelector('.modal-backdrop')?.remove();
            toggle(id);
          });
          action.disabled = inSquad && ctx.player.loadout.length <= 1;
          openCreatureDetail(id, action);
        },
      });
      if (inSquad) card.classList.add('is-squad');
      grid.append(card);
    }
  };
  const addTab = (id: string, label: string) => {
    const t = el('button', `tab${filter === id ? ' is-active' : ''}`, [label]);
    t.type = 'button';
    t.addEventListener('click', () => {
      filter = id;
      tabs.querySelectorAll('.tab').forEach((x) => x.classList.toggle('is-active', x === t));
      renderGrid();
    });
    tabs.append(t);
  };
  addTab('all', 'Todas');
  for (const f of FACTION_LIST) if (ALL_CREATURE_IDS.some((id) => CREATURES[id].faction === f.id)) addTab(f.id, f.name);
  renderGrid();

  shell.append(tabs, grid);
  return shell;
});

import { CAMPAIGN_MISSIONS } from '../../data/campaign';
import { FACTIONS } from '../../data/factions';
import { isMissionUnlocked } from '../../systems/playerState';
import { registerScreen } from '../router';
import { btn, el } from '../components';

registerScreen('worldmap', (ctx) => {
  const shell = el('section', 'screen screen-worldmap');
  shell.appendChild(
    el('header', 'top-bar', [
      btn('← Menú', 'btn btn-ghost btn-back', () => ctx.navigate('menu')),
      el('h1', 'screen-title', ['Mapa dimensional']),
    ]),
  );

  const map = el('div', 'dimension-map');
  const nodes = el('div', 'map-nodes');

  CAMPAIGN_MISSIONS.forEach((mission, i) => {
    const unlocked = isMissionUnlocked(ctx.player, mission.id);
    const done = ctx.player.completedMissions.includes(mission.id);
    const faction = FACTIONS[mission.enemyFaction];
    const node = el('button', `map-node${unlocked ? '' : ' is-locked'}${done ? ' is-done' : ''}`);
    node.type = 'button';
    node.disabled = !unlocked;
    node.style.setProperty('--node-color', faction?.accent ?? '#6366f1');
    node.innerHTML = `
      <span class="node-index">${i + 1}</span>
      <strong>${mission.title}</strong>
      <small>${faction?.name ?? ''}</small>
    `;
    node.addEventListener('click', () => {
      ctx.navigate('battle', { mission, mode: 'campaign', returnScreen: 'worldmap' });
    });
    nodes.appendChild(node);
  });

  map.appendChild(nodes);
  map.appendChild(
    el('p', 'map-legend', [
      'Conquista cada dimensión para abrir la siguiente. Las recompensas alimentan el Portal del Origen.',
    ]),
  );
  shell.appendChild(map);
  return shell;
});

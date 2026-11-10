import { citadelImg, creatureImg, iconImg } from '../../art/atlas';
import { CAMPAIGN_MISSIONS } from '../../data/campaign';
import { CREATURES } from '../../data/creatures';
import { FACTIONS } from '../../data/factions';
import type { CampaignMission } from '../../data/types';
import { isMissionUnlocked } from '../../systems/playerState';
import { registerScreen } from '../router';
import { btn, el, topBar } from '../components';

const ENV_LABEL: Record<string, string> = {
  dimension_corrupta: 'Dimensión corrupta',
  volcan: 'Caldera volcánica',
  bio_forest: 'Bosque biomórfico',
  ocean_shore: 'Costa abisal',
  void_citadel: 'Ciudadela del Vacío',
};

registerScreen('worldmap', (ctx) => {
  const shell = el('section', 'screen screen-worldmap');
  shell.append(topBar('Mapa dimensional', () => ctx.navigate('menu')));

  const brief = el('aside', 'map-brief px-panel');
  const track = el('div', 'map-track');

  const showBrief = (mission: CampaignMission, index: number) => {
    const faction = FACTIONS[mission.enemyFaction];
    const done = ctx.player.completedMissions.includes(mission.id);
    const unlock = mission.unlockCreatureId ? CREATURES[mission.unlockCreatureId] : undefined;
    const rewardScale = done ? 'Recompensa reducida (ya conquistada)' : 'Primera conquista';
    brief.innerHTML = '';
    brief.append(
      el('p', 'brief-index', [`Dimensión ${index + 1} · ${ENV_LABEL[mission.environment] ?? ''}`]),
      el('h2', '', [mission.title]),
      el('p', 'brief-faction', [`Defensores: ${faction?.name ?? ''} — ${faction?.tagline ?? ''}`]),
      el('p', 'brief-text', [mission.briefing]),
      el('div', 'brief-stats', [
        el('span', 'px-inset', [iconImg('skull', 2), `Ciudadela ${mission.enemyBaseHp}`]),
        el('span', 'px-inset', [iconImg('heart', 2), `Tu torre ${mission.playerBaseHp}`]),
      ]),
      el('p', 'brief-label', [rewardScale]),
      el('div', 'brief-stats', [
        el('span', 'px-inset', [iconImg('fragment', 2), `${mission.rewardFragments}`]),
        el('span', 'px-inset', [iconImg('dust', 2), `${mission.rewardDust}`]),
      ]),
    );
    if (unlock && !ctx.player.owned[unlock.id]) {
      brief.append(el('div', 'brief-unlock px-inset', [creatureImg(unlock.id, 64, 40, 'px is-silhouette'), el('span', '', ['Criatura por liberar'])]));
    }
    brief.append(btn('¡A la batalla!', 'gold', () => ctx.navigate('battle', { mission, mode: 'campaign', returnScreen: 'worldmap' }), 'sword'));
    track.querySelectorAll('.map-node').forEach((n, i) => n.classList.toggle('is-selected', i === index));
  };

  let firstOpen = -1;
  CAMPAIGN_MISSIONS.forEach((mission, i) => {
    const unlocked = isMissionUnlocked(ctx.player, mission.id);
    const done = ctx.player.completedMissions.includes(mission.id);
    if (unlocked && !done && firstOpen < 0) firstOpen = i;
    const faction = FACTIONS[mission.enemyFaction];
    const node = el('button', `map-node${unlocked ? '' : ' is-locked'}${done ? ' is-done' : ''}`);
    node.type = 'button';
    node.disabled = !unlocked;
    node.style.setProperty('--accent', faction?.accent ?? '#7fe0e6');
    node.style.setProperty('--row', String(i % 2));
    const stamp = done ? iconImg('star', 2, 'px node-stamp') : !unlocked ? iconImg('lock', 2, 'px node-stamp') : el('span', 'node-stamp node-new', ['!']);
    node.append(
      el('span', 'node-art', [citadelImg(mission.enemyFaction, 2, 'px node-citadel'), stamp]),
      el('span', 'node-num', [String(i + 1)]),
      el('span', 'node-title', [mission.title]),
    );
    node.addEventListener('click', () => showBrief(mission, i));
    track.append(node);
  });

  const lastOpen = firstOpen >= 0 ? firstOpen : CAMPAIGN_MISSIONS.length - 1;
  shell.append(el('div', 'map-layout', [el('div', 'map-board px-inset', [track]), brief]));
  showBrief(CAMPAIGN_MISSIONS[lastOpen], lastOpen);
  return shell;
});

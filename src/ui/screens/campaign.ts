import { CAMPAIGN_MISSIONS } from '../../data/campaign';
import { FACTIONS } from '../../data/factions';
import { isMissionUnlocked } from '../../systems/playerState';
import { registerScreen } from '../router';
import { btn, el } from '../components';

registerScreen('campaign', (ctx) => {
  const shell = el('section', 'screen screen-campaign');
  shell.appendChild(
    el('header', 'top-bar', [
      btn('← Menú', 'btn btn-ghost btn-back', () => ctx.navigate('menu')),
      el('h1', 'screen-title', ['Campaña dimensional']),
    ]),
  );

  const list = el('div', 'mission-list');
  for (const mission of CAMPAIGN_MISSIONS) {
    const unlocked = isMissionUnlocked(ctx.player, mission.id);
    const done = ctx.player.completedMissions.includes(mission.id);
    const faction = FACTIONS[mission.enemyFaction];
    const card = el('article', `mission-card${unlocked ? '' : ' is-locked'}${done ? ' is-done' : ''}`);
    card.innerHTML = `
      <div class="mission-badges">
        <span class="mission-chapter">${mission.subtitle}</span>
        ${done ? '<span class="badge-done">Completada</span>' : ''}
      </div>
      <h2>${mission.title}</h2>
      <p class="mission-enemy" style="color:${faction?.accent ?? '#94a3b8'}">Enemigo: ${faction?.name ?? mission.enemyFaction}</p>
      <p class="mission-brief">${mission.briefing}</p>
      <p class="mission-reward">Recompensa: ${mission.rewardDust} polvo · ${mission.rewardFragments} fragmentos</p>
    `;
    const action = btn(
      unlocked ? 'Iniciar batalla' : 'Bloqueada',
      `btn ${unlocked ? 'btn-primary' : 'btn-ghost'}`,
      () => {
        if (unlocked) ctx.navigate('battle', { mission });
      },
    );
    action.disabled = !unlocked;
    card.appendChild(action);
    list.appendChild(card);
  }
  shell.appendChild(list);
  return shell;
});

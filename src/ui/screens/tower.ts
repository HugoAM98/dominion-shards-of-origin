import { buildTowerMission } from '../../data/tower';
import { registerScreen } from '../router';
import { btn, currencyStrip, el } from '../components';

registerScreen('tower', (ctx) => {
  const shell = el('section', 'screen screen-tower');
  shell.appendChild(
    el('header', 'top-bar', [
      btn('← Menú', 'btn btn-ghost btn-back', () => ctx.navigate('menu')),
      el('h1', 'screen-title', ['Torre del Infinito']),
    ]),
  );

  const nextFloor = Math.max(1, ctx.player.towerBestFloor + 1);
  const panel = el('div', 'tower-panel');
  panel.innerHTML = `
    <div class="tower-visual" aria-hidden="true"></div>
    <p class="tower-record">Récord: piso <strong>${ctx.player.towerBestFloor}</strong></p>
    <p class="tower-desc">Batallas escalables sin fin. Cada piso aumenta la vida del nexo enemigo y las recompensas.</p>
  `;

  const actions = el('div', 'tower-actions', [
    btn(`Comenzar piso ${nextFloor}`, 'btn btn-primary btn-lg', () => {
      const mission = buildTowerMission(nextFloor);
      ctx.navigate('battle', {
        mission,
        mode: 'tower',
        towerFloor: nextFloor,
        returnScreen: 'tower',
      });
    }),
    btn('Entrenamiento (piso 1)', 'btn btn-ghost', () => {
      ctx.navigate('battle', {
        mission: buildTowerMission(1),
        mode: 'tower',
        towerFloor: 1,
        returnScreen: 'tower',
      });
    }),
  ]);

  shell.append(currencyStrip(ctx.player.shardDust, ctx.player.originFragments), panel, actions);
  return shell;
});

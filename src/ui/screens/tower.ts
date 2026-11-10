import { citadelImg, iconImg } from '../../art/atlas';
import { buildTowerMission } from '../../data/tower';
import { registerScreen } from '../router';
import { btn, currencyStrip, el, topBar } from '../components';

const VISIBLE = 7;

registerScreen('tower', (ctx) => {
  const shell = el('section', 'screen screen-tower');
  shell.append(topBar('Torre del Infinito', () => ctx.navigate('menu'), currencyStrip(ctx.player.shardDust, ctx.player.originFragments)));

  const best = ctx.player.towerBestFloor;
  const next = Math.min(50, best + 1);
  const go = (floor: number) =>
    ctx.navigate('battle', { mission: buildTowerMission(floor), mode: 'tower', towerFloor: floor, returnScreen: 'tower' });

  const spire = el('div', 'tower-spire');
  const top = Math.min(50, Math.max(VISIBLE, next + 3));
  for (let f = top; f > top - VISIBLE; f--) {
    const state = f <= best ? 'is-done' : f === next ? 'is-next' : 'is-locked';
    const m = buildTowerMission(f);
    const floor = el('div', `tower-floor ${state}`, [
      el('span', 'floor-num', [String(f)]),
      el('span', 'floor-info', [
        f === next ? citadelImg(m.enemyFaction, 1, 'px') : iconImg(f <= best ? 'star' : 'lock', 2),
        el('small', '', [f === next ? `Ciudadela ${m.enemyBaseHp}` : f <= best ? 'Superado' : '—']),
      ]),
    ]);
    spire.append(floor);
  }

  const m = buildTowerMission(next);
  const panel = el('div', 'tower-panel px-panel', [
    el('p', 'brief-index', ['Desafío sin fin']),
    el('h2', '', [`Piso ${next}`]),
    el('p', 'brief-text', ['Cada piso refuerza la ciudadela enemiga y mejora el botín. ¿Hasta dónde llegará tu escuadra?']),
    el('div', 'brief-stats', [
      el('span', 'px-inset', [iconImg('star', 2), `Récord ${best}`]),
      el('span', 'px-inset', [iconImg('fragment', 2), `${m.rewardFragments}`]),
      el('span', 'px-inset', [iconImg('dust', 2), `${m.rewardDust}`]),
    ]),
    btn(`Subir al piso ${next}`, 'teal', () => go(next), 'tower'),
    btn('Entrenar en el piso 1', 'ghost', () => go(1), undefined, 'pxbtn-sm'),
  ]);

  shell.append(el('div', 'tower-layout', [el('div', 'tower-wrap px-inset', [spire]), panel]));
  return shell;
});

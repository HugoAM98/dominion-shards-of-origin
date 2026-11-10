import { iconImg } from '../../art/atlas';
import { mountMenuScene } from '../../art/menuScene';
import { CAMPAIGN_MISSIONS } from '../../data/campaign';
import { markTutorialComplete } from '../../systems/playerState';
import { registerScreen } from '../router';
import { btn, currencyStrip, el } from '../components';

registerScreen('menu', (ctx) => {
  const shell = el('section', 'screen screen-menu');

  const scene = el('canvas', 'menu-scene px');
  mountMenuScene(scene);

  const settings = btn('', 'ghost', () => ctx.navigate('settings'), 'gear', 'pxbtn-sm pxbtn-square');
  settings.title = 'Ajustes';
  settings.setAttribute('aria-label', 'Ajustes');
  const top = el('div', 'menu-top', [
    el('div', 'commander-tag px-inset', [iconImg('star', 2), el('span', '', [ctx.player.commanderName])]),
    el('div', 'menu-top-right', [currencyStrip(ctx.player.shardDust, ctx.player.originFragments), settings]),
  ]);

  const logo = el('div', 'logo', [
    el('span', 'logo-kicker', ['— Fragmentos del Origen —']),
    el('h1', 'logo-title', ['DOMINION']),
    el('span', 'logo-sub', ['SHARDS OF ORIGIN']),
  ]);

  const tile = (label: string, hint: string, icon: string, variant: string, go: () => void) => {
    const b = el('button', `menu-tile pxbtn pxbtn-${variant}`, [
      iconImg(icon, 3),
      el('span', 'tile-text', [el('b', '', [label]), el('small', '', [hint])]),
    ]);
    b.type = 'button';
    b.addEventListener('click', go);
    return b;
  };

  const cleared = ctx.player.completedMissions.length;
  const nav = el('nav', 'menu-nav', [
    tile('Campaña', `${cleared}/${CAMPAIGN_MISSIONS.length} dimensiones`, 'map', 'gold', () => ctx.navigate('worldmap')),
    tile('Portal', 'Invoca criaturas', 'portal', 'violet', () => ctx.navigate('summon')),
    tile('Torre', `Récord: piso ${ctx.player.towerBestFloor}`, 'tower', 'teal', () => ctx.navigate('tower')),
    tile('Colección', 'Escuadra y bestiario', 'book', 'ghost', () => ctx.navigate('collection')),
    tile('Evolución', 'Mejora tus criaturas', 'evolve', 'ghost', () => ctx.navigate('evolution')),
    tile('Práctica', 'Combate sin riesgo', 'sword', 'ghost', () =>
      ctx.navigate('battle', { mission: CAMPAIGN_MISSIONS[0], mode: 'practice', returnScreen: 'menu' }),
    ),
  ]);
  shell.append(scene, top, logo, nav, el('p', 'menu-version', ['v1.1']));

  if (!ctx.player.tutorialComplete) {
    const ok = btn('¡Al combate!', 'gold');
    const tut = el('div', 'modal-backdrop', [
      el('div', 'modal px-panel tutorial', [
        el('h2', '', ['Bienvenido, Comandante']),
        el('ol', 'tutorial-list', [
          el('li', '', [iconImg('energy', 2), el('span', '', ['La ', el('b', '', ['energía']), ' se recarga sola: gástala en desplegar criaturas.'])]),
          el('li', '', [iconImg('skull', 2), el('span', '', ['Derriba la ', el('b', '', ['ciudadela enemiga']), ' antes de que caiga tu torre.'])]),
          el('li', '', [iconImg('portal', 2), el('span', '', ['Invoca en el ', el('b', '', ['Portal']), ' y mejora en ', el('b', '', ['Evolución']), '.'])]),
          el('li', '', [iconImg('star', 2), el('span', '', ['Tu ', el('b', '', ['habilidad de comandante']), ' cambia el rumbo de una batalla.'])]),
        ]),
        ok,
      ]),
    ]);
    ok.addEventListener('click', () => {
      ctx.setPlayer(markTutorialComplete(ctx.player));
      tut.remove();
    });
    shell.append(tut);
  }

  return shell;
});

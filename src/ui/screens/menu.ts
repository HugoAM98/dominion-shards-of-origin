import { CAMPAIGN_MISSIONS } from '../../data/campaign';
import { markTutorialComplete } from '../../systems/playerState';
import { registerScreen } from '../router';
import { btn, currencyStrip, el } from '../components';

registerScreen('menu', (ctx) => {
  const shell = el('section', 'screen screen-menu');
  const hero = el('div', 'menu-hero', [
    el('p', 'eyebrow', ['Fragmentos del Origen']),
    el('h1', 'game-title', ['Dominion']),
    el('h2', 'game-subtitle', ['Shards of Origin']),
    el('p', 'menu-tagline', [
      'Comanda criaturas de dimensiones colisionadas. Conquista nexos, invoca en el Portal y forja tu dominio.',
    ]),
  ]);

  const commander = el('p', 'commander-name', [ctx.player.commanderName]);
  const currencies = currencyStrip(ctx.player.shardDust, ctx.player.originFragments);

  const nav = el('nav', 'main-nav', [
    btn('Mapa dimensional', 'btn btn-primary btn-lg', () => ctx.navigate('worldmap')),
    btn('Torre del Infinito', 'btn btn-secondary btn-lg', () => ctx.navigate('tower')),
    btn('Portal del Origen', 'btn btn-secondary btn-lg', () => ctx.navigate('summon')),
    btn('Colección', 'btn btn-secondary btn-lg', () => ctx.navigate('collection')),
    btn('Evolución', 'btn btn-secondary btn-lg', () => ctx.navigate('evolution')),
    btn('Práctica rápida', 'btn btn-accent btn-lg', () =>
      ctx.navigate('battle', { mission: CAMPAIGN_MISSIONS[0], mode: 'practice', returnScreen: 'menu' }),
    ),
    btn('Ajustes', 'btn btn-ghost', () => ctx.navigate('settings')),
  ]);

  shell.append(hero, commander, currencies, nav);

  if (!ctx.player.tutorialComplete) {
    const tut = el('div', 'tutorial-overlay');
    tut.innerHTML = `
      <div class="overlay-card tutorial-card">
        <h2>Bienvenido, Comandante</h2>
        <ol class="tutorial-list">
          <li>Generas <strong>energía</strong> con el tiempo para desplegar criaturas.</li>
          <li>Destruye el <strong>nexo enemigo</strong> antes de perder el tuyo.</li>
          <li>Invoca en el <strong>Portal</strong>, mejora en <strong>Evolución</strong> y forma tu equipo de 5.</li>
          <li>Usa tu <strong>habilidad de comandante</strong> en batalla (configúrala en Ajustes).</li>
        </ol>
        <button type="button" class="btn btn-primary" id="tut-ok">¡Al combate!</button>
      </div>
    `;
    shell.appendChild(tut);
    tut.querySelector('#tut-ok')?.addEventListener('click', () => {
      ctx.setPlayer(markTutorialComplete(ctx.player));
      tut.remove();
    });
  }

  return shell;
});

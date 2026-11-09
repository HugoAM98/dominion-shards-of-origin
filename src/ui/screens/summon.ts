import { CREATURES } from '../../data/creatures';
import { SUMMON_COST_FRAGMENTS, SUMMON_MULTI_COUNT } from '../../data/gacha';
import { sfxSummon } from '../../systems/audio';
import { summonMulti, summonOnce } from '../../systems/gachaSystem';
import { registerScreen } from '../router';
import { btn, creatureCard, currencyStrip, el, rarityBadge } from '../components';

registerScreen('summon', (ctx) => {
  const shell = el('section', 'screen screen-summon');
  shell.appendChild(
    el('header', 'top-bar', [
      btn('← Menú', 'btn btn-ghost btn-back', () => ctx.navigate('menu')),
      el('h1', 'screen-title', ['Portal del Origen']),
    ]),
  );

  const currencies = currencyStrip(ctx.player.shardDust, ctx.player.originFragments);
  const stage = el('div', 'summon-stage');
  stage.innerHTML = `
    <div class="portal-ring"></div>
    <p class="summon-hint">Los ecos del Origen revelan criaturas perdidas entre dimensiones.</p>
    <p class="pity-line">Piedad SR+: ${ctx.player.pityCounter} / 30</p>
  `;
  const results = el('div', 'summon-results');

  const actions = el('div', 'summon-actions', [
    btn(`Invocar ×1 (${SUMMON_COST_FRAGMENTS})`, 'btn btn-primary', () => runSummon(1)),
    btn(`Invocar ×${SUMMON_MULTI_COUNT} (${SUMMON_COST_FRAGMENTS * SUMMON_MULTI_COUNT})`, 'btn btn-secondary', () =>
      runSummon(SUMMON_MULTI_COUNT),
    ),
  ]);

  function runSummon(count: number) {
    const outcome = count === 1 ? summonOnce(ctx.player) : summonMulti(ctx.player, count);
    if (!outcome.state) {
      results.innerHTML = '<p class="warn">No tienes suficientes fragmentos.</p>';
      return;
    }
    ctx.setPlayer(outcome.state);
    sfxSummon();
    currencies.innerHTML = currencyStrip(outcome.state.shardDust, outcome.state.originFragments).innerHTML;
    results.innerHTML = '';
    for (const r of outcome.results) {
      const def = CREATURES[r.creatureId];
      const card = creatureCard(
        def,
        r.duplicate ? `Duplicado → +${r.dustGained} polvo` : '¡Nueva criatura!',
      );
      card.prepend(rarityBadge(r.rarity));
      results.appendChild(card);
    }
    const pity = shell.querySelector('.pity-line');
    if (pity) pity.textContent = `Piedad SR+: ${outcome.state.pityCounter} / 30`;
    stage.classList.add('summon-flash');
    setTimeout(() => stage.classList.remove('summon-flash'), 600);
  }

  shell.append(currencies, stage, actions, results);
  return shell;
});

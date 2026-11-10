import { creatureImg, iconImg } from '../../art/atlas';
import { mountPortal } from '../../art/portalScene';
import { ALL_CREATURE_IDS, CREATURES } from '../../data/creatures';
import { DEFAULT_DROP_RATES, PITY_SR_THRESHOLD, RARITY_ORDER, SUMMON_COST_FRAGMENTS, SUMMON_MULTI_COUNT } from '../../data/gacha';
import type { Rarity } from '../../data/types';
import { playTone, sfxSummon } from '../../systems/audio';
import { summonMulti, summonOnce, type SummonResult } from '../../systems/gachaSystem';
import { registerScreen } from '../router';
import { RARITY_LABEL, btn, creatureCard, currencyStrip, el, openCreatureDetail, topBar } from '../components';

const rank = (r: Rarity) => RARITY_ORDER.indexOf(r);

registerScreen('summon', (ctx) => {
  const shell = el('section', 'screen screen-summon');
  let currencies = currencyStrip(ctx.player.shardDust, ctx.player.originFragments);
  shell.append(topBar('Portal del Origen', () => ctx.navigate('menu'), currencies));

  const featured = [...ALL_CREATURE_IDS].sort((a, b) => rank(CREATURES[b].rarity) - rank(CREATURES[a].rarity)).slice(0, 3);
  const banner = el('div', 'summon-banner px-panel', [
    el('div', 'banner-sprites', featured.map((id) => creatureImg(id, 80, 56, 'px banner-sprite'))),
    el('div', 'banner-text', [
      el('h2', '', ['Ecos del Origen']),
      el('p', '', ['Criaturas perdidas entre dimensiones responden a tu llamada.']),
      el('p', 'banner-rates', [
        RARITY_ORDER.map((r) => `${r} ${(DEFAULT_DROP_RATES[r] * 100).toFixed(1).replace('.0', '')}%`).join(' · '),
      ]),
    ]),
  ]);

  const portalCanvas = el('canvas', 'portal-canvas px');
  const portal = mountPortal(portalCanvas);
  const pityFill = el('i', 'pity-fill');
  const pityText = el('span', 'pity-text');
  const setPity = (n: number) => {
    pityFill.style.width = `${(n / PITY_SR_THRESHOLD) * 100}%`;
    pityText.textContent = `Garantía Épico+: ${n}/${PITY_SR_THRESHOLD}`;
  };
  setPity(ctx.player.pityCounter);
  const pity = el('div', 'pity-bar px-inset', [pityFill, pityText]);

  const single = btn(`Invocar ×1`, 'violet', () => void run(1), 'portal');
  single.append(el('span', 'btn-cost', [iconImg('fragment', 1), String(SUMMON_COST_FRAGMENTS)]));
  const multi = btn(`Invocar ×${SUMMON_MULTI_COUNT}`, 'gold', () => void run(SUMMON_MULTI_COUNT), 'portal');
  multi.append(el('span', 'btn-cost', [iconImg('fragment', 1), String(SUMMON_COST_FRAGMENTS * SUMMON_MULTI_COUNT)]));
  const warn = el('p', 'summon-warn');

  const history = el('div', 'summon-history px-inset');
  const renderHistory = (ids: string[]) => {
    history.innerHTML = '';
    history.append(el('span', 'history-label', ['Últimas']));
    if (!ids.length) history.append(el('small', '', ['Aún no has invocado.']));
    for (const id of ids.slice(0, 10)) {
      const s = el('button', `history-item chip-${CREATURES[id]?.rarity ?? 'N'}`, [creatureImg(id, 30, 22, 'px')]);
      s.type = 'button';
      s.title = CREATURES[id]?.name ?? id;
      s.addEventListener('click', () => openCreatureDetail(id));
      history.append(s);
    }
  };
  renderHistory(ctx.player.summonHistory);

  const altar = el('div', 'summon-altar', [portalCanvas, pity, el('div', 'summon-actions', [single, multi]), warn]);
  shell.append(el('div', 'summon-layout', [banner, altar]), history);

  async function run(count: number) {
    const outcome = count === 1 ? summonOnce(ctx.player, SUMMON_COST_FRAGMENTS) : summonMulti(ctx.player, count, SUMMON_COST_FRAGMENTS);
    if (!outcome.state) {
      warn.textContent = 'Fragmentos insuficientes. Conquista dimensiones o sube la Torre para conseguir más.';
      warn.classList.remove('is-shake');
      void warn.offsetWidth;
      warn.classList.add('is-shake');
      return;
    }
    warn.textContent = '';
    ctx.setPlayer(outcome.state);
    single.disabled = multi.disabled = true;
    const best = outcome.results.reduce<Rarity>((b, r) => (rank(CREATURES[r.creatureId].rarity) > rank(b) ? CREATURES[r.creatureId].rarity : b), 'N');
    sfxSummon();
    await portal.charge(best, 1200 + rank(best) * 250);
    reveal(outcome.results);
    const next = outcome.state;
    const fresh = currencyStrip(next.shardDust, next.originFragments);
    currencies.replaceWith(fresh);
    currencies = fresh;
    setPity(next.pityCounter);
    renderHistory(next.summonHistory);
    single.disabled = multi.disabled = false;
  }

  function reveal(results: SummonResult[]) {
    const grid = el('div', `reveal-grid${results.length === 1 ? ' is-single' : ''}`);
    const timers: number[] = [];
    const flips: (() => void)[] = [];
    results.forEach((r, i) => {
      const def = CREATURES[r.creatureId];
      const face = creatureCard(def, { meta: !r.duplicate ? '¡NUEVA!' : r.dustGained > 0 ? `Repetida · +${r.dustGained} polvo` : 'Repetida' });
      const slot = el('div', `reveal-slot slot-${def.rarity}`, [
        el('div', 'reveal-inner', [el('div', 'reveal-back', [iconImg('portal', 3)]), el('div', 'reveal-face', [face])]),
      ]);
      let shown = false;
      const flip = () => {
        if (shown) return;
        shown = true;
        slot.classList.add('is-flipped');
        playTone(320 + rank(def.rarity) * 120, 0.09, 0.035);
      };
      flips.push(flip);
      slot.addEventListener('click', () => (shown ? openCreatureDetail(def.id) : flip()));
      grid.append(slot);
      timers.push(window.setTimeout(flip, 350 + i * 230));
    });
    const backdrop = el('div', 'modal-backdrop reveal-backdrop');
    const skip = btn('Revelar todo', 'ghost', () => {
      timers.forEach((t) => clearTimeout(t));
      flips.forEach((f) => f());
    }, undefined, 'pxbtn-sm');
    const close = btn('Continuar', 'gold', () => backdrop.remove());
    const best = results.reduce((b, r) => Math.max(b, rank(CREATURES[r.creatureId].rarity)), 0);
    backdrop.append(
      el('div', 'reveal-wrap', [
        el('h2', `reveal-title rarity-text-${RARITY_ORDER[best]}`, [best >= 2 ? `¡${RARITY_LABEL[RARITY_ORDER[best]]}!` : 'Invocación completa']),
        grid,
        el('div', 'result-actions', [skip, close]),
      ]),
    );
    document.body.append(backdrop);
  }

  return shell;
});

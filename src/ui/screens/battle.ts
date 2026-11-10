import { creatureImg, iconImg } from '../../art/atlas';
import { deployCooldown } from '../../battle/simulator';
import { CAMPAIGN_MISSIONS } from '../../data/campaign';
import { COMMANDER_ABILITIES } from '../../data/commander';
import { CREATURES } from '../../data/creatures';
import { FACTIONS } from '../../data/factions';
import { buildTowerMission } from '../../data/tower';
import { sfxVictory } from '../../systems/audio';
import { completeMission, completeTowerFloor, type PlayerState } from '../../systems/playerState';
import { registerScreen } from '../router';
import { btn, deployChip, el } from '../components';

registerScreen('battle', async (ctx, params) => {
  const { BattleSession } = await import('../../battle/BattleSession');

  const mission = params?.mission ?? CAMPAIGN_MISSIONS[0];
  const mode = params?.mode ?? 'campaign';
  const towerFloor = params?.towerFloor ?? 1;
  const returnScreen = params?.returnScreen ?? (mode === 'tower' ? 'tower' : 'worldmap');
  const ability = COMMANDER_ABILITIES[ctx.player.commanderAbility];
  const enemy = FACTIONS[mission.enemyFaction];

  let session: InstanceType<typeof BattleSession> | null = null;
  let ended = false;
  const leave = (screen = returnScreen) => {
    session?.destroy();
    session = null;
    ctx.navigate(screen);
  };

  const shell = el('section', 'screen screen-battle');

  const energyCells = el('div', 'energy-cells');
  const energyValue = el('b', 'energy-value', ['0']);
  const header = el('header', 'battle-header', [
    btn('◂', 'ghost', () => leave(), undefined, 'pxbtn-sm pxbtn-square'),
    el('div', 'battle-brief', [
      el('h1', '', [mission.title]),
      el('p', '', [mode === 'tower' ? `Torre · Piso ${towerFloor}` : `${mission.subtitle} · ${enemy?.name ?? ''}`]),
    ]),
    el('div', 'energy-meter px-inset', [iconImg('energy', 2), energyCells, energyValue]),
  ]);

  const stage = el('div', 'battle-stage');
  const rotateHint = el('div', 'rotate-hint', [el('span', '', ['↻ Gira el móvil para ver mejor el campo'])]);

  const commanderFill = el('span', 'cmd-fill');
  const commanderLabel = el('span', 'cmd-label', [ability.name]);
  const commanderBtn = el('button', 'cmd-btn', [commanderFill, iconImg('star', 2), commanderLabel]);
  commanderBtn.type = 'button';
  commanderBtn.title = ability.description;
  commanderBtn.disabled = true;
  commanderBtn.addEventListener('click', () => !ended && session?.commander());

  const deployBar = el('div', 'deploy-bar');
  const chips: HTMLButtonElement[] = [];
  for (const id of ctx.player.loadout) {
    if (!CREATURES[id]) continue;
    const chip = deployChip(id, () => {
      if (!session || ended || chip.disabled) return;
      session.deploy(id);
      chip.classList.remove('is-pop');
      void chip.offsetWidth;
      chip.classList.add('is-pop');
    });
    chips.push(chip);
    deployBar.append(chip);
  }

  let cellCount = 0;
  const syncCells = (max: number) => {
    if (cellCount === max) return;
    cellCount = max;
    energyCells.innerHTML = '';
    for (let i = 0; i < max; i++) energyCells.append(el('i', 'cell'));
  };

  const overlay = el('div', 'battle-overlay hidden');

  const showResult = (phase: 'victory' | 'defeat', before: PlayerState, after: PlayerState) => {
    const win = phase === 'victory';
    const panel = el('div', `result px-panel ${win ? 'is-win' : 'is-lose'}`);
    panel.append(el('div', 'result-banner', [el('span', '', [win ? 'VICTORIA' : 'DERROTA'])]));
    panel.append(
      el('p', 'result-msg', [
        win
          ? mode === 'tower'
            ? `Piso ${towerFloor} conquistado.`
            : 'La ciudadela enemiga se ha derrumbado.'
          : 'Tu nexo ha caído. Ajusta tu escuadra e inténtalo de nuevo.',
      ]),
    );
    if (win) {
      const gainedDust = after.shardDust - before.shardDust;
      const gainedFrag = after.originFragments - before.originFragments;
      const rewards = el('div', 'result-rewards');
      const reward = (icon: string, n: number, label: string, delay: number) => {
        const r = el('div', 'reward px-inset', [iconImg(icon, 3), el('b', '', [`+${n}`]), el('small', '', [label])]);
        r.style.animationDelay = `${delay}ms`;
        return r;
      };
      if (gainedFrag > 0) rewards.append(reward('fragment', gainedFrag, 'Fragmentos', 250));
      if (gainedDust > 0) rewards.append(reward('dust', gainedDust, 'Polvo', 400));
      panel.append(rewards);
      const unlocked = mission.unlockCreatureId;
      if (unlocked && !before.owned[unlocked] && after.owned[unlocked]) {
        const def = CREATURES[unlocked];
        panel.append(
          el('div', 'result-unlock', [
            el('div', 'unlock-glow', [creatureImg(unlocked, 120, 80, 'px')]),
            el('p', '', ['Nueva criatura: ', el('b', '', [def.name])]),
          ]),
        );
      }
    }
    const actions = el('div', 'result-actions');
    if (win && mode === 'tower' && towerFloor < 50) {
      actions.append(
        btn('Siguiente piso', 'gold', () => {
          session?.destroy();
          ctx.navigate('battle', {
            mission: buildTowerMission(towerFloor + 1),
            mode: 'tower',
            towerFloor: towerFloor + 1,
            returnScreen: 'tower',
          });
        }),
      );
    }
    if (!win) {
      actions.append(
        btn('Reintentar', 'gold', () => {
          session?.destroy();
          ctx.navigate('battle', params);
        }),
      );
    }
    actions.append(btn(win && mode !== 'tower' ? 'Continuar' : 'Volver', win ? 'teal' : 'ghost', () => leave()));
    panel.append(actions);
    overlay.innerHTML = '';
    overlay.append(panel);
    overlay.classList.remove('hidden');
  };

  session = new BattleSession(stage, mission, ctx.player, {
    onTick: (t) => {
      syncCells(t.maxEnergy);
      const cells = energyCells.children;
      for (let i = 0; i < cells.length; i++) {
        const fill = Math.max(0, Math.min(1, t.energy - i));
        const c = cells[i] as HTMLElement;
        c.className = fill >= 1 ? 'cell is-full' : fill > 0 ? 'cell is-charging' : 'cell';
        c.style.setProperty('--charge', String(fill));
      }
      energyValue.textContent = String(Math.floor(t.energy));

      for (const chip of chips) {
        const id = chip.dataset.creatureId ?? '';
        const def = CREATURES[id];
        const cd = t.cooldowns[id] ?? 0;
        const afford = t.energy >= def.stats.deployCost;
        chip.disabled = ended || !afford || cd > 0;
        chip.classList.toggle('is-poor', !afford);
        chip.style.setProperty('--cd', String(cd > 0 ? cd / deployCooldown(def) : 0));
      }

      const ready = t.commanderRemaining <= 0;
      commanderBtn.disabled = ended || !ready;
      commanderBtn.classList.toggle('is-ready', ready && !ended);
      commanderFill.style.setProperty('--fill', String(1 - t.commanderRemaining / t.commanderTotal));
      commanderLabel.textContent = ready ? ability.name : `${Math.ceil(t.commanderRemaining)}s`;
    },
    onPhaseChange: (phase) => {
      if (ended) return;
      ended = true;
      for (const chip of chips) chip.disabled = true;
      commanderBtn.disabled = true;
      const before = ctx.player;
      let after = before;
      if (phase === 'victory') {
        sfxVictory();
        if (mode === 'tower') after = completeTowerFloor(before, towerFloor, mission.rewardDust, mission.rewardFragments);
        else if (mode === 'campaign')
          after = completeMission(before, mission.id, mission.rewardDust, mission.rewardFragments, mission.unlockCreatureId);
        if (after !== before) ctx.setPlayer(after);
      }
      showResult(phase, before, after);
    },
  });

  shell.append(header, rotateHint, stage, el('div', 'battle-controls', [commanderBtn, deployBar]), overlay);
  requestAnimationFrame(() => session?.start());
  return shell;
});

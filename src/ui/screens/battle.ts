import { CAMPAIGN_MISSIONS } from '../../data/campaign';
import { COMMANDER_ABILITIES } from '../../data/commander';
import { CREATURES } from '../../data/creatures';
import { buildTowerMission } from '../../data/tower';
import { completeMission, completeTowerFloor } from '../../systems/playerState';
import { sfxDeploy, sfxVictory } from '../../systems/audio';
import { registerScreen } from '../router';
import { btn, creatureChip, el } from '../components';

registerScreen('battle', async (ctx, params) => {
  const { BattleSession } = await import('../../battle/BattleSession');

  const mission = params?.mission ?? CAMPAIGN_MISSIONS[0];
  const mode = params?.mode ?? 'campaign';
  const towerFloor = params?.towerFloor ?? 1;
  const returnScreen = params?.returnScreen ?? (mode === 'tower' ? 'tower' : 'worldmap');

  const shell = el('section', 'screen screen-battle');
  const ability = COMMANDER_ABILITIES[ctx.player.commanderAbility];

  const header = el('header', 'battle-header', [
    btn('← Salir', 'btn btn-ghost btn-back', () => {
      session?.destroy();
      ctx.navigate(returnScreen);
    }),
    el('section', 'battle-brief', [
      el('h1', '', [mission.title]),
      el('p', '', [mission.subtitle]),
    ]),
    el('div', 'energy-meter', [el('span', 'energy-label', ['Energía']), el('span', 'energy-value', ['0 / 10'])]),
  ]);

  const canvasWrap = el('div', 'battle-stage');
  const commanderBtn = btn(`${ability.name} (CD)`, 'btn btn-accent commander-btn', () => {
    session?.commander();
  });
  commanderBtn.disabled = true;

  const deployBar = el('div', 'deploy-bar');
  const energyValue = header.querySelector('.energy-value')!;

  let session: InstanceType<typeof BattleSession> | null = null;
  let ended = false;
  let currentEnergy = 0;

  const chips: HTMLButtonElement[] = [];
  for (const id of ctx.player.loadout) {
    const def = CREATURES[id];
    if (!def) continue;
    const chip = creatureChip(id, def.stats.deployCost, true, () => {
      if (!session || ended) return;
      session.deploy(chip.dataset.creatureId ?? id);
      sfxDeploy();
    });
    chip.dataset.creatureId = id;
    chips.push(chip);
    deployBar.appendChild(chip);
  }

  const overlay = el('div', 'battle-overlay hidden');
  overlay.innerHTML = `
    <div class="overlay-card">
      <h2 id="overlay-title"></h2>
      <p id="overlay-msg"></p>
      <button type="button" class="btn btn-primary" id="overlay-btn">Continuar</button>
    </div>
  `;

  const refreshChips = () => {
    for (const chip of chips) {
      const id = chip.dataset.creatureId ?? '';
      const def = CREATURES[id];
      if (!def) continue;
      const afford = currentEnergy >= def.stats.deployCost;
      chip.disabled = !afford || ended;
      chip.classList.toggle('is-disabled', chip.disabled);
    }
  };

  session = new BattleSession(canvasWrap, mission, ctx.player, {
    onEnergyChange: (cur, maxVal) => {
      currentEnergy = cur;
      energyValue.textContent = `${Math.floor(cur)} / ${maxVal}`;
      refreshChips();
    },
    onCommanderCooldown: (remaining, total) => {
      commanderBtn.disabled = remaining > 0.5 || ended;
      if (remaining > 0.5) {
        commanderBtn.textContent = `${ability.name} (${Math.ceil(remaining)}s)`;
      } else {
        commanderBtn.textContent = ability.name;
      }
      commanderBtn.title = ability.description + ` · CD ${total}s`;
    },
    onPhaseChange: (phase) => {
      if (ended) return;
      ended = true;
      refreshChips();
      commanderBtn.disabled = true;
      const title = overlay.querySelector('#overlay-title')!;
      const msg = overlay.querySelector('#overlay-msg')!;
      const overlayBtn = overlay.querySelector('#overlay-btn') as HTMLButtonElement;
      if (phase === 'victory') {
        title.textContent = '¡Victoria!';
        sfxVictory();
        if (mode === 'tower') {
          msg.textContent = `Piso ${towerFloor} superado. ¿Subir al siguiente?`;
          const next = completeTowerFloor(
            ctx.player,
            towerFloor,
            mission.rewardDust,
            mission.rewardFragments,
          );
          ctx.setPlayer(next);
          overlayBtn.textContent = towerFloor < 50 ? 'Siguiente piso' : 'Volver a la torre';
          overlayBtn.onclick = () => {
            session?.destroy();
            if (towerFloor < 50) {
              ctx.navigate('battle', {
                mission: buildTowerMission(towerFloor + 1),
                mode: 'tower',
                towerFloor: towerFloor + 1,
                returnScreen: 'tower',
              });
            } else {
              ctx.navigate('tower');
            }
          };
        } else if (mode === 'campaign' && mission.id.startsWith('m')) {
          msg.textContent = 'El nexo enemigo ha caído. Recompensas reclamadas.';
          const next = completeMission(
            ctx.player,
            mission.id,
            mission.rewardDust,
            mission.rewardFragments,
            mission.unlockCreatureId,
          );
          ctx.setPlayer(next);
          overlayBtn.onclick = () => {
            session?.destroy();
            ctx.navigate(returnScreen);
          };
        } else {
          msg.textContent = 'Combate de práctica completado.';
          overlayBtn.onclick = () => {
            session?.destroy();
            ctx.navigate('menu');
          };
        }
      } else {
        title.textContent = 'Derrota';
        msg.textContent = 'Tu nexo ha sido destruido. Reagrupa criaturas e inténtalo de nuevo.';
        overlayBtn.onclick = () => {
          session?.destroy();
          ctx.navigate(returnScreen);
        };
      }
      overlay.classList.remove('hidden');
    },
  });

  const controls = el('div', 'battle-controls', [commanderBtn, deployBar]);
  shell.append(header, canvasWrap, controls, overlay);
  requestAnimationFrame(() => session?.start());
  return shell;
});

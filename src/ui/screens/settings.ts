import { iconImg } from '../../art/atlas';
import { COMMANDER_ABILITIES, type CommanderAbilityId } from '../../data/commander';
import { resetPlayer } from '../../systems/playerState';
import { registerScreen } from '../router';
import { btn, el, topBar } from '../components';

const ABILITY_ICON: Record<CommanderAbilityId, string> = { meteor: 'skull', heal_wave: 'heart', slow_field: 'star' };

registerScreen('settings', (ctx) => {
  const shell = el('section', 'screen screen-settings');
  shell.append(topBar('Ajustes', () => ctx.navigate('menu')));

  const nameInput = el('input', 'px-input');
  nameInput.value = ctx.player.commanderName;
  nameInput.placeholder = 'Nombre del comandante';
  nameInput.maxLength = 24;

  let ability = ctx.player.commanderAbility;
  const abilities = el('div', 'ability-list');
  for (const ab of Object.values(COMMANDER_ABILITIES)) {
    const opt = el('button', `ability-opt px-inset${ab.id === ability ? ' is-active' : ''}`, [
      iconImg(ABILITY_ICON[ab.id], 3),
      el('span', '', [el('b', '', [ab.name]), el('small', '', [`${ab.description} · Recarga ${ab.cooldown}s`])]),
    ]);
    opt.type = 'button';
    opt.addEventListener('click', () => {
      ability = ab.id;
      abilities.querySelectorAll('.ability-opt').forEach((o) => o.classList.toggle('is-active', o === opt));
    });
    abilities.append(opt);
  }

  const saved = el('span', 'saved-note');
  const save = btn('Guardar', 'gold', () => {
    ctx.setPlayer({ ...ctx.player, commanderName: nameInput.value.trim() || 'Comandante del Origen', commanderAbility: ability });
    saved.textContent = '✓ Guardado';
    saved.classList.remove('is-pop');
    void saved.offsetWidth;
    saved.classList.add('is-pop');
  });

  const reset = btn('Borrar progreso', 'red', () => {
    if (confirm('¿Borrar todo el progreso guardado en este navegador?')) {
      ctx.setPlayer(resetPlayer());
      ctx.navigate('menu');
    }
  }, undefined, 'pxbtn-sm');

  shell.append(
    el('div', 'settings-wrap', [
      el('section', 'px-panel settings-block', [
        el('h2', '', ['Comandante']),
        el('label', 'field-label', ['Nombre']),
        nameInput,
        el('label', 'field-label', ['Habilidad de comandante']),
        abilities,
        el('div', 'result-actions', [save, saved]),
      ]),
      el('section', 'px-panel settings-block', [
        el('h2', '', ['Datos']),
        el('p', 'evo-note', ['Tu progreso se guarda automáticamente en este navegador. Sin pagos reales: todas las monedas se ganan jugando.']),
        reset,
      ]),
    ]),
  );
  return shell;
});

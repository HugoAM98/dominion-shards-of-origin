import { COMMANDER_ABILITIES, type CommanderAbilityId } from '../../data/commander';
import { resetPlayer, savePlayer } from '../../systems/playerState';
import { registerScreen } from '../router';
import { btn, el } from '../components';

registerScreen('settings', (ctx) => {
  const shell = el('section', 'screen screen-settings');
  shell.appendChild(
    el('header', 'top-bar', [
      btn('← Menú', 'btn btn-ghost btn-back', () => ctx.navigate('menu')),
      el('h1', 'screen-title', ['Ajustes']),
    ]),
  );

  const nameInput = el('input', 'input-text') as HTMLInputElement;
  nameInput.value = ctx.player.commanderName;
  nameInput.placeholder = 'Nombre del comandante';
  nameInput.maxLength = 32;

  const abilitySelect = el('select', 'input-text') as HTMLSelectElement;
  for (const ab of Object.values(COMMANDER_ABILITIES)) {
    const opt = el('option', '', [ab.name]) as HTMLOptionElement;
    opt.value = ab.id;
    opt.textContent = `${ab.name} — ${ab.description}`;
    if (ctx.player.commanderAbility === ab.id) opt.selected = true;
    abilitySelect.appendChild(opt);
  }

  const saveProfile = btn('Guardar perfil', 'btn btn-primary', () => {
    const next = {
      ...ctx.player,
      commanderName: nameInput.value.trim() || 'Comandante del Origen',
      commanderAbility: abilitySelect.value as CommanderAbilityId,
    };
    ctx.setPlayer(next);
    savePlayer(next);
  });

  const reset = btn('Reiniciar progreso', 'btn btn-danger', () => {
    if (confirm('¿Borrar todo el progreso local?')) {
      const fresh = resetPlayer();
      ctx.setPlayer(fresh);
      ctx.navigate('menu');
    }
  });

  const block = el('section', 'settings-block', [
    el('h2', '', ['Perfil']),
    el('label', 'field-label', ['Nombre del comandante']),
    nameInput,
    el('label', 'field-label', ['Habilidad de comandante']),
    abilitySelect,
    saveProfile,
    el('hr', ''),
    el('p', 'settings-note', ['Los datos se guardan en este navegador (localStorage).']),
    reset,
  ]);

  shell.appendChild(block);
  return shell;
});

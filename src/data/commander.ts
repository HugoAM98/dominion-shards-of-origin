export type CommanderAbilityId = 'meteor' | 'heal_wave' | 'slow_field';

export interface CommanderAbilityDef {
  id: CommanderAbilityId;
  name: string;
  description: string;
  cooldown: number;
}

export const COMMANDER_ABILITIES: Record<CommanderAbilityId, CommanderAbilityDef> = {
  meteor: {
    id: 'meteor',
    name: 'Meteorito de origen',
    description: 'Daño masivo al nexo enemigo y a todas las unidades rivales.',
    cooldown: 45,
  },
  heal_wave: {
    id: 'heal_wave',
    name: 'Onda sanadora',
    description: 'Restaura PV del nexo aliado y de tus criaturas.',
    cooldown: 35,
  },
  slow_field: {
    id: 'slow_field',
    name: 'Campo temporal',
    description: 'Ralentiza a todos los enemigos durante 6 segundos.',
    cooldown: 30,
  },
};

import type { FactionDefinition } from './types';

export const FACTIONS: Record<string, FactionDefinition> = {
  astralis: {
    id: 'astralis',
    name: 'Astralis',
    tagline: 'Hijos de la Luz',
    color: '#1a2840',
    accent: '#7dd3fc',
    combatIdentity: 'Escudos, sanación y manipulación de energía.',
  },
  infernia: {
    id: 'infernia',
    name: 'Infernia',
    tagline: 'Hijos del Abismo',
    color: '#2a1010',
    accent: '#f97316',
    combatIdentity: 'Daño explosivo, sacrificio y furia.',
  },
  xenthar: {
    id: 'xenthar',
    name: "Xen'thar",
    tagline: 'El Enjambre Evolutivo',
    color: '#142818',
    accent: '#84cc16',
    combatIdentity: 'Mases, invocación rápida y adaptación.',
  },
  mekanor: {
    id: 'mekanor',
    name: 'Mekanor',
    tagline: 'Imperio Artificial',
    color: '#1c1c22',
    accent: '#a78bfa',
    combatIdentity: 'Tanques, reparación y fortificación.',
  },
  necrovan: {
    id: 'necrovan',
    name: 'Nécrovan',
    tagline: 'Reino de los Olvidados',
    color: '#121018',
    accent: '#c084fc',
    combatIdentity: 'Resurrección, maldiciones y desgaste.',
  },
  thalassia: {
    id: 'thalassia',
    name: 'Thalassia',
    tagline: 'Señores del Océano',
    color: '#0c1a24',
    accent: '#22d3ee',
    combatIdentity: 'Control de masas, empuje y ralentización.',
  },
};

export const FACTION_LIST = Object.values(FACTIONS);

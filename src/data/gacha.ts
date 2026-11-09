import type { GachaPoolEntry, Rarity } from './types';

export const RARITY_ORDER: Rarity[] = ['N', 'R', 'SR', 'SSR', 'UR', 'LR'];

export const DEFAULT_DROP_RATES: Record<Rarity, number> = {
  N: 0.5,
  R: 0.3,
  SR: 0.14,
  SSR: 0.05,
  UR: 0.009,
  LR: 0.001,
};

export const UNIVERSAL_POOL: GachaPoolEntry[] = [
  { creatureId: 'brood_mite', weight: 50 },
  { creatureId: 'lumen_wisp', weight: 50 },
  { creatureId: 'grave_herald', weight: 30 },
  { creatureId: 'cinder_fang', weight: 25 },
  { creatureId: 'drowned_lash', weight: 25 },
  { creatureId: 'aegis_golem', weight: 14 },
  { creatureId: 'void_mantid', weight: 14 },
  { creatureId: 'ash_hatchling', weight: 10 },
  { creatureId: 'tidebreaker', weight: 8 },
  { creatureId: 'veil_reaper', weight: 5 },
  { creatureId: 'solar_sentinel', weight: 3 },
  { creatureId: 'rust_titan', weight: 0.9 },
];

export const SUMMON_COST_FRAGMENTS = 160;
export const SUMMON_MULTI_COUNT = 10;
export const PITY_SR_THRESHOLD = 30;
export const DUPLICATE_DUST: Record<Rarity, number> = {
  N: 5,
  R: 15,
  SR: 40,
  SSR: 120,
  UR: 300,
  LR: 800,
};

import { CREATURES } from '../data/creatures';
import type { Rarity } from '../data/types';
import type { OwnedCreature, PlayerState } from './playerState';
import { savePlayer } from './playerState';

const RARITY_COST: Record<Rarity, number> = {
  N: 40,
  R: 70,
  SR: 120,
  SSR: 200,
  UR: 350,
  LR: 600,
};

export function upgradeCost(creatureId: string, currentLevel: number): number {
  const def = CREATURES[creatureId];
  if (!def) return 9999;
  const base = RARITY_COST[def.rarity];
  return Math.round(base * (1 + (currentLevel - 1) * 0.35));
}

export function upgradeCreature(state: PlayerState, creatureId: string): PlayerState | null {
  const owned = state.owned[creatureId];
  if (!owned || owned.level >= 20) return null;
  const cost = upgradeCost(creatureId, owned.level);
  if (state.shardDust < cost) return null;

  const next: PlayerState = {
    ...state,
    shardDust: state.shardDust - cost,
    owned: {
      ...state.owned,
      [creatureId]: { ...owned, level: owned.level + 1 },
    },
  };
  savePlayer(next);
  return next;
}

export function formatOwnedPower(owned: OwnedCreature): string {
  return `Nv.${owned.level}`;
}

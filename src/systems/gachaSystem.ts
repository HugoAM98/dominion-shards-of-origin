import { CREATURES } from '../data/creatures';
import {
  DEFAULT_DROP_RATES,
  DUPLICATE_DUST,
  PITY_SR_THRESHOLD,
  RARITY_ORDER,
  UNIVERSAL_POOL,
} from '../data/gacha';
import type { Rarity } from '../data/types';
import { addCreature, type PlayerState, savePlayer } from './playerState';

export interface SummonResult {
  creatureId: string;
  rarity: Rarity;
  duplicate: boolean;
  dustGained: number;
}

function pickWeighted(pool: { creatureId: string; weight: number }[]): string {
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * total;
  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) return entry.creatureId;
  }
  return pool[pool.length - 1].creatureId;
}

function rollRarity(pityBoost: boolean): Rarity {
  const rates = { ...DEFAULT_DROP_RATES };
  if (pityBoost) {
    rates.SR += 0.25;
    rates.N -= 0.2;
    rates.R -= 0.05;
  }
  const roll = Math.random();
  let cumulative = 0;
  for (const rarity of RARITY_ORDER) {
    cumulative += rates[rarity];
    if (roll <= cumulative) return rarity;
  }
  return 'N';
}

function creatureByRarity(rarity: Rarity): string {
  const pool = UNIVERSAL_POOL.filter((e) => CREATURES[e.creatureId]?.rarity === rarity);
  if (pool.length === 0) return pickWeighted(UNIVERSAL_POOL);
  return pickWeighted(pool);
}

function performOneSummon(state: PlayerState): { result: SummonResult; state: PlayerState } {
  let pity = state.pityCounter + 1;
  const forcePity = pity >= PITY_SR_THRESHOLD;
  const rarity = rollRarity(forcePity);
  const creatureId = creatureByRarity(rarity);
  const owned = state.owned[creatureId];
  const duplicate = Boolean(owned);
  const dustGained = duplicate ? DUPLICATE_DUST[rarity] : 0;

  let next: PlayerState = {
    ...state,
    pityCounter: rarity === 'SR' || rarity === 'SSR' || rarity === 'UR' || rarity === 'LR' ? 0 : pity,
    shardDust: state.shardDust + dustGained,
    summonHistory: [creatureId, ...state.summonHistory].slice(0, 50),
  };
  next = addCreature(next, creatureId);
  savePlayer(next);

  return {
    result: { creatureId, rarity, duplicate, dustGained },
    state: next,
  };
}

export function summonOnce(state: PlayerState, cost = 160): { results: SummonResult[]; state: PlayerState | null } {
  if (state.originFragments < cost) return { results: [], state: null };
  let current = { ...state, originFragments: state.originFragments - cost };
  const { result, state: after } = performOneSummon(current);
  return { results: [result], state: after };
}

export function summonMulti(
  state: PlayerState,
  count = 10,
  costPer = 160,
): { results: SummonResult[]; state: PlayerState | null } {
  const totalCost = costPer * count;
  if (state.originFragments < totalCost) return { results: [], state: null };
  let current = { ...state, originFragments: state.originFragments - totalCost };
  const results: SummonResult[] = [];
  for (let i = 0; i < count; i++) {
    const { result, state: after } = performOneSummon(current);
    results.push(result);
    current = after;
  }
  return { results, state: current };
}

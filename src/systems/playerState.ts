import { CAMPAIGN_MISSIONS } from '../data/campaign';
import type { CommanderAbilityId } from '../data/commander';
import { STARTER_CREATURE_IDS } from '../data/creatures';

const STORAGE_KEY = 'dominion_player_v2';

export interface OwnedCreature {
  count: number;
  level: number;
}

export interface PlayerState {
  shardDust: number;
  originFragments: number;
  owned: Record<string, OwnedCreature>;
  completedMissions: string[];
  pityCounter: number;
  loadout: string[];
  summonHistory: string[];
  commanderName: string;
  commanderAbility: CommanderAbilityId;
  tutorialComplete: boolean;
  towerBestFloor: number;
}

function defaultOwned(): Record<string, OwnedCreature> {
  const owned: Record<string, OwnedCreature> = {};
  for (const id of STARTER_CREATURE_IDS) {
    owned[id] = { count: 1, level: 1 };
  }
  return owned;
}

export function createDefaultPlayer(): PlayerState {
  return {
    shardDust: 250,
    originFragments: 500,
    owned: defaultOwned(),
    completedMissions: [],
    pityCounter: 0,
    loadout: [...STARTER_CREATURE_IDS],
    summonHistory: [],
    commanderName: 'Comandante del Origen',
    commanderAbility: 'meteor',
    tutorialComplete: false,
    towerBestFloor: 0,
  };
}

export function loadPlayer(): PlayerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('dominion_player_v1');
    if (!raw) return createDefaultPlayer();
    const parsed = JSON.parse(raw) as Partial<PlayerState>;
    const merged = { ...createDefaultPlayer(), ...parsed, owned: { ...defaultOwned(), ...parsed.owned } };
    if (!merged.loadout?.length) merged.loadout = [...STARTER_CREATURE_IDS];
    savePlayer(merged);
    return merged;
  } catch {
    return createDefaultPlayer();
  }
}

export function savePlayer(state: PlayerState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function addCreature(state: PlayerState, creatureId: string): PlayerState {
  const next = { ...state, owned: { ...state.owned } };
  const existing = next.owned[creatureId];
  if (existing) {
    next.owned[creatureId] = { ...existing, count: existing.count + 1 };
  } else {
    next.owned[creatureId] = { count: 1, level: 1 };
  }
  return next;
}

export function isMissionUnlocked(state: PlayerState, missionId: string): boolean {
  const index = CAMPAIGN_MISSIONS.findIndex((m) => m.id === missionId);
  if (index <= 0) return true;
  const prev = CAMPAIGN_MISSIONS[index - 1];
  return state.completedMissions.includes(prev.id);
}

export function completeMission(
  state: PlayerState,
  missionId: string,
  dust: number,
  fragments: number,
  unlockCreatureId?: string,
): PlayerState {
  const firstClear = !state.completedMissions.includes(missionId);
  let next = { ...state };
  if (firstClear) {
    next.completedMissions = [...next.completedMissions, missionId];
    next.shardDust += dust;
    next.originFragments += fragments;
    if (unlockCreatureId) {
      next = addCreature(next, unlockCreatureId);
    }
  } else {
    next.shardDust += Math.round(dust * 0.35);
    next.originFragments += Math.round(fragments * 0.25);
  }
  savePlayer(next);
  return next;
}

export function completeTowerFloor(state: PlayerState, floor: number, dust: number, fragments: number): PlayerState {
  const next = {
    ...state,
    shardDust: state.shardDust + dust,
    originFragments: state.originFragments + fragments,
    towerBestFloor: Math.max(state.towerBestFloor, floor),
  };
  savePlayer(next);
  return next;
}

export function markTutorialComplete(state: PlayerState): PlayerState {
  const next = { ...state, tutorialComplete: true };
  savePlayer(next);
  return next;
}

export function resetPlayer(): PlayerState {
  const fresh = createDefaultPlayer();
  savePlayer(fresh);
  return fresh;
}

import type { CreatureDefinition } from '../data/types';

export type BattleSide = 'player' | 'enemy';

export interface BattleUnit {
  id: number;
  creatureId: string;
  side: BattleSide;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attack: number;
  attackSpeed: number;
  moveSpeed: number;
  range: number;
  attackTimer: number;
  slowFactor: number;
  damageReduction: number;
  dead: boolean;
  definition: CreatureDefinition;
}

export interface BattleConfig {
  playerBaseHp: number;
  enemyBaseHp: number;
  maxEnergy: number;
  energyRegen: number;
  environment: string;
  enemyFaction: string;
}

export type BattlePhase = 'fighting' | 'victory' | 'defeat';

export interface BattleSnapshot {
  playerBaseHp: number;
  enemyBaseHp: number;
  playerEnergy: number;
  maxEnergy: number;
  units: BattleUnit[];
  phase: BattlePhase;
  elapsed: number;
}

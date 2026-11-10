import type { CreatureDefinition } from '../data/types';

export type BattleSide = 'player' | 'enemy';

export interface BattleUnit {
  id: number;
  creatureId: string;
  side: BattleSide;
  x: number;
  /** Lane offset in world pixels, used for depth and staggering. */
  lane: number;
  hp: number;
  maxHp: number;
  attack: number;
  attackSpeed: number;
  moveSpeed: number;
  range: number;
  attackTimer: number;
  slowFactor: number;
  damageReduction: number;
  /** Seconds left stunned after a knockback. */
  stun: number;
  knockbacksLeft: number;
  enraged: boolean;
  firstStrike: boolean;
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

export type BattleEvent =
  | { type: 'spawn'; unitId: number; side: BattleSide; creatureId: string; x: number }
  | {
      type: 'attack';
      attackerId: number;
      side: BattleSide;
      fromX: number;
      /** Undefined when the target is a nexus. */
      targetId?: number;
      targetX: number;
      damage: number;
      crit: boolean;
      ranged: boolean;
    }
  | { type: 'death'; unitId: number }
  | { type: 'knockback'; unitId: number }
  | { type: 'commander'; ability: string; targets: number[] }
  | { type: 'enrage'; unitId: number };

export interface BattleSnapshot {
  playerBaseHp: number;
  enemyBaseHp: number;
  playerEnergy: number;
  maxEnergy: number;
  units: BattleUnit[];
  phase: BattlePhase;
  elapsed: number;
}

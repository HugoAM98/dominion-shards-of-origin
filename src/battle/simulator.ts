import { COMMANDER_ABILITIES, type CommanderAbilityId } from '../data/commander';
import { CREATURES } from '../data/creatures';
import type { CreatureDefinition } from '../data/types';
import type { BattleConfig, BattleEvent, BattlePhase, BattleSide, BattleSnapshot, BattleUnit } from './types';

/** Simulation space: nexus fronts sit at these x coordinates. */
export const PLAYER_FRONT = 120;
export const ENEMY_FRONT = 1080;
export const SIM_WIDTH = 1200;
const RANGED_THRESHOLD = 100;

function scaledStats(def: CreatureDefinition, level = 1) {
  const scale = 1 + (level - 1) * 0.08;
  return {
    hp: Math.round(def.stats.hp * scale),
    attack: Math.round(def.stats.attack * scale),
    attackSpeed: def.stats.attackSpeed,
    moveSpeed: def.stats.moveSpeed,
    range: def.stats.range,
  };
}

export function deployCooldown(def: CreatureDefinition): number {
  return 1.5 + def.stats.deployCost * 0.55;
}

export class BattleSimulator {
  playerBaseHp: number;
  enemyBaseHp: number;
  playerBaseMax: number;
  enemyBaseMax: number;
  playerEnergy = 0;
  enemyEnergy = 0;
  maxEnergy: number;
  energyRegen: number;
  enemyEnergyRegen: number;
  units: BattleUnit[] = [];
  phase: BattlePhase = 'fighting';
  elapsed = 0;
  environment: string;
  commanderCooldown = 0;
  commanderAbility: CommanderAbilityId = 'meteor';
  enemySlowUntil = 0;
  /** Seconds until each player creature can be deployed again. */
  cooldowns: Record<string, number> = {};
  events: BattleEvent[] = [];
  private nextId = 1;

  constructor(config: BattleConfig) {
    this.playerBaseHp = config.playerBaseHp;
    this.enemyBaseHp = config.enemyBaseHp;
    this.playerBaseMax = config.playerBaseHp;
    this.enemyBaseMax = config.enemyBaseHp;
    this.maxEnergy = config.maxEnergy;
    this.energyRegen = config.energyRegen;
    this.enemyEnergyRegen = config.energyRegen * 0.88;
    this.environment = config.environment;
    this.playerEnergy = 3;
  }

  snapshot(): BattleSnapshot {
    return {
      playerBaseHp: this.playerBaseHp,
      enemyBaseHp: this.enemyBaseHp,
      playerEnergy: this.playerEnergy,
      maxEnergy: this.maxEnergy,
      units: this.units,
      phase: this.phase,
      elapsed: this.elapsed,
    };
  }

  drainEvents(): BattleEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  canDeploy(creatureId: string): boolean {
    const def = CREATURES[creatureId];
    if (!def || this.phase !== 'fighting') return false;
    return this.playerEnergy >= def.stats.deployCost && (this.cooldowns[creatureId] ?? 0) <= 0;
  }

  deploy(side: BattleSide, creatureId: string, level = 1): boolean {
    if (this.phase !== 'fighting') return false;
    const def = CREATURES[creatureId];
    if (!def) return false;

    if (side === 'player') {
      if (!this.canDeploy(creatureId)) return false;
      this.playerEnergy -= def.stats.deployCost;
      this.cooldowns[creatureId] = deployCooldown(def);
    } else {
      if (this.enemyEnergy < def.stats.deployCost) return false;
      this.enemyEnergy -= def.stats.deployCost;
    }

    const stats = scaledStats(def, level);
    let attack = stats.attack;
    let moveSpeed = stats.moveSpeed;
    if (this.environment === 'volcan' && def.faction === 'infernia') attack = Math.round(attack * 1.15);
    if (this.environment === 'ocean_shore' && def.faction === 'thalassia') moveSpeed *= 1.1;

    const unit: BattleUnit = {
      id: this.nextId++,
      creatureId,
      side,
      x: side === 'player' ? PLAYER_FRONT + 10 : ENEMY_FRONT - 10,
      lane: Math.floor(Math.random() * 7),
      hp: stats.hp,
      maxHp: stats.hp,
      attack,
      attackSpeed: stats.attackSpeed,
      moveSpeed,
      range: stats.range,
      attackTimer: 0.25,
      slowFactor: 1,
      damageReduction: def.passive?.includes('Reduce daño') ? 0.2 : 0,
      stun: 0,
      knockbacksLeft: def.role === 'tank' ? 0 : 1,
      enraged: false,
      firstStrike: true,
      dead: false,
      definition: def,
    };
    this.units.push(unit);
    this.events.push({ type: 'spawn', unitId: unit.id, side, creatureId, x: unit.x });
    return true;
  }

  private nearestOpponent(unit: BattleUnit): BattleUnit | null {
    let best: BattleUnit | null = null;
    let bestDist = Infinity;
    for (const e of this.units) {
      if (e.dead || e.side === unit.side) continue;
      const ahead = unit.side === 'player' ? e.x - unit.x : unit.x - e.x;
      if (ahead < -20) continue;
      if (ahead < bestDist) {
        bestDist = ahead;
        best = e;
      }
    }
    return best;
  }

  private damageFor(attacker: BattleUnit, target?: BattleUnit): { damage: number; crit: boolean } {
    let dmg = attacker.attack;
    let crit = false;
    const passive = attacker.definition.passive ?? '';
    if (target && passive.includes('enemigos con menos de 25%') && target.hp / target.maxHp < 0.25) {
      dmg *= 1.8;
      crit = true;
    }
    if (attacker.firstStrike && passive.includes('Primer ataque')) {
      dmg *= 1.15;
      crit = true;
    }
    if (target && target.damageReduction > 0) dmg *= 1 - target.damageReduction;
    return { damage: Math.max(1, Math.round(dmg)), crit };
  }

  private hurt(target: BattleUnit, amount: number): void {
    const before = target.hp / target.maxHp;
    target.hp -= amount;
    const after = target.hp / target.maxHp;
    if (target.hp <= 0) {
      target.hp = 0;
      target.dead = true;
      this.events.push({ type: 'death', unitId: target.id });
      return;
    }
    if (target.knockbacksLeft > 0 && before > 0.5 && after <= 0.5) {
      target.knockbacksLeft--;
      target.x += target.side === 'player' ? -30 : 30;
      target.x = Math.max(PLAYER_FRONT, Math.min(ENEMY_FRONT, target.x));
      target.stun = 0.45;
      target.attackTimer = Math.max(target.attackTimer, 0.45);
      this.events.push({ type: 'knockback', unitId: target.id });
    }
    if (!target.enraged && target.definition.passive?.includes('Bajo 40%') && after < 0.4) {
      target.enraged = true;
      target.attack = Math.round(target.attack * 1.25);
      this.events.push({ type: 'enrage', unitId: target.id });
    }
  }

  triggerCommander(): boolean {
    if (this.phase !== 'fighting' || this.commanderCooldown > 0) return false;
    const ability = COMMANDER_ABILITIES[this.commanderAbility];
    this.commanderCooldown = ability.cooldown;
    const targets: number[] = [];
    if (this.commanderAbility === 'meteor') {
      this.enemyBaseHp -= 1500;
      for (const u of this.units) {
        if (u.side === 'enemy' && !u.dead) {
          targets.push(u.id);
          this.hurt(u, 350);
        }
      }
    } else if (this.commanderAbility === 'heal_wave') {
      this.playerBaseHp = Math.min(this.playerBaseMax, this.playerBaseHp + 2000);
      for (const u of this.units) {
        if (u.side === 'player' && !u.dead) {
          targets.push(u.id);
          u.hp = Math.min(u.maxHp, u.hp + Math.round(u.maxHp * 0.25));
        }
      }
    } else if (this.commanderAbility === 'slow_field') {
      this.enemySlowUntil = this.elapsed + 6;
      for (const u of this.units) if (u.side === 'enemy' && !u.dead) targets.push(u.id);
    }
    this.events.push({ type: 'commander', ability: this.commanderAbility, targets });
    this.units = this.units.filter((u) => !u.dead);
    this.checkEnd();
    return true;
  }

  private healPulse(unit: BattleUnit): void {
    for (const ally of this.units) {
      if (ally.side !== unit.side || ally.dead || Math.abs(ally.x - unit.x) > unit.range) continue;
      ally.hp = Math.min(ally.maxHp, ally.hp + Math.round(unit.attack * 1.2));
    }
  }

  update(dt: number): void {
    if (this.phase !== 'fighting') return;
    this.elapsed += dt;
    this.commanderCooldown = Math.max(0, this.commanderCooldown - dt);
    for (const id in this.cooldowns) this.cooldowns[id] = Math.max(0, this.cooldowns[id] - dt);
    this.playerEnergy = Math.min(this.maxEnergy, this.playerEnergy + this.energyRegen * dt);
    this.enemyEnergy = Math.min(this.maxEnergy, this.enemyEnergy + this.enemyEnergyRegen * dt);

    for (const unit of this.units) {
      if (unit.dead) continue;
      if (unit.stun > 0) {
        unit.stun -= dt;
        continue;
      }
      const dir = unit.side === 'player' ? 1 : -1;
      const target = this.nearestOpponent(unit);
      const baseFront = unit.side === 'player' ? ENEMY_FRONT : PLAYER_FRONT;
      const distToBase = Math.abs(baseFront - unit.x);
      const targetInRange = target && Math.abs(target.x - unit.x) <= unit.range;
      const baseInRange = !targetInRange && distToBase <= unit.range;

      if (targetInRange || baseInRange) {
        unit.attackTimer -= dt;
        if (unit.attackTimer > 0) continue;
        unit.attackTimer = 1 / unit.attackSpeed;
        const ranged = unit.range >= RANGED_THRESHOLD;

        if (unit.definition.active?.includes('sanación')) this.healPulse(unit);

        if (targetInRange && target) {
          const { damage, crit } = this.damageFor(unit, target);
          this.events.push({
            type: 'attack',
            attackerId: unit.id,
            side: unit.side,
            fromX: unit.x,
            targetId: target.id,
            targetX: target.x,
            damage,
            crit,
            ranged,
          });
          this.hurt(target, damage);
          if (!target.dead && unit.definition.active?.includes('empuja') && Math.random() < 0.35) {
            target.x += dir * 35;
            target.stun = Math.max(target.stun, 0.25);
          }
          if (!target.dead && unit.definition.role === 'controller') target.slowFactor = 0.7;
        } else {
          const { damage, crit } = this.damageFor(unit);
          this.events.push({
            type: 'attack',
            attackerId: unit.id,
            side: unit.side,
            fromX: unit.x,
            targetX: baseFront,
            damage,
            crit,
            ranged,
          });
          if (unit.side === 'player') this.enemyBaseHp -= damage;
          else this.playerBaseHp -= damage;
        }
        unit.firstStrike = false;
      } else {
        let slow = unit.slowFactor;
        if (unit.side === 'enemy' && this.elapsed < this.enemySlowUntil) slow *= 0.55;
        unit.x += dir * unit.moveSpeed * slow * dt;
        unit.x = Math.max(PLAYER_FRONT, Math.min(ENEMY_FRONT, unit.x));
      }
    }

    this.units = this.units.filter((u) => !u.dead);
    this.checkEnd();
  }

  private checkEnd(): void {
    if (this.enemyBaseHp <= 0) {
      this.enemyBaseHp = 0;
      this.phase = 'victory';
    } else if (this.playerBaseHp <= 0) {
      this.playerBaseHp = 0;
      this.phase = 'defeat';
    }
  }
}

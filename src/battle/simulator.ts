import { COMMANDER_ABILITIES, type CommanderAbilityId } from '../data/commander';
import { CREATURES } from '../data/creatures';
import type { CreatureDefinition } from '../data/types';
import type { BattleConfig, BattlePhase, BattleSide, BattleSnapshot, BattleUnit } from './types';

let unitIdCounter = 1;

function scaledStats(def: CreatureDefinition, level = 1): {
  hp: number;
  attack: number;
  attackSpeed: number;
  moveSpeed: number;
  range: number;
} {
  const scale = 1 + (level - 1) * 0.08;
  return {
    hp: Math.round(def.stats.hp * scale),
    attack: Math.round(def.stats.attack * scale),
    attackSpeed: def.stats.attackSpeed,
    moveSpeed: def.stats.moveSpeed,
    range: def.stats.range,
  };
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

  constructor(config: BattleConfig) {
    this.playerBaseHp = config.playerBaseHp;
    this.enemyBaseHp = config.enemyBaseHp;
    this.playerBaseMax = config.playerBaseHp;
    this.enemyBaseMax = config.enemyBaseHp;
    this.maxEnergy = config.maxEnergy;
    this.energyRegen = config.energyRegen;
    this.enemyEnergyRegen = config.energyRegen * 0.88;
    this.environment = config.environment;
    unitIdCounter = 1;
  }

  snapshot(): BattleSnapshot {
    return {
      playerBaseHp: this.playerBaseHp,
      enemyBaseHp: this.enemyBaseHp,
      playerEnergy: this.playerEnergy,
      maxEnergy: this.maxEnergy,
      units: this.units.filter((u) => !u.dead),
      phase: this.phase,
      elapsed: this.elapsed,
    };
  }

  deploy(side: BattleSide, creatureId: string, level = 1): boolean {
    if (this.phase !== 'fighting') return false;
    const def = CREATURES[creatureId];
    if (!def) return false;

    if (side === 'player') {
      if (this.playerEnergy < def.stats.deployCost) return false;
      this.playerEnergy -= def.stats.deployCost;
    } else {
      if (this.enemyEnergy < def.stats.deployCost) return false;
      this.enemyEnergy -= def.stats.deployCost;
    }

    const stats = scaledStats(def, level);
    const x = side === 'player' ? 140 : 1060;
    const y = 340 + (Math.random() - 0.5) * 40;

    let attack = stats.attack;
    let damageReduction = 0;
    if (def.passive?.includes('Reduce daño')) damageReduction = 0.2;
    if (this.environment === 'volcan' && def.faction === 'infernia') attack = Math.round(attack * 1.15);
    if (this.environment === 'ocean_shore' && def.faction === 'thalassia') stats.moveSpeed *= 1.1;

    const unit: BattleUnit = {
      id: unitIdCounter++,
      creatureId,
      side,
      x,
      y,
      hp: stats.hp,
      maxHp: stats.hp,
      attack,
      attackSpeed: stats.attackSpeed,
      moveSpeed: stats.moveSpeed,
      range: stats.range,
      attackTimer: 0,
      slowFactor: 1,
      damageReduction,
      dead: false,
      definition: def,
    };
    this.units.push(unit);
    return true;
  }

  spendEnemyEnergy(cost: number, current: number): number {
    return Math.max(0, current - cost);
  }

  private nearestOpponent(unit: BattleUnit): BattleUnit | null {
    const enemies = this.units.filter((u) => !u.dead && u.side !== unit.side);
    let best: BattleUnit | null = null;
    let bestDist = Infinity;
    for (const e of enemies) {
      const dist = Math.abs(e.x - unit.x);
      if (unit.side === 'player' && e.x < unit.x) continue;
      if (unit.side === 'enemy' && e.x > unit.x) continue;
      if (dist < bestDist) {
        bestDist = dist;
        best = e;
      }
    }
    return best;
  }

  private applyDamage(target: BattleUnit, rawDamage: number, attacker?: BattleUnit): void {
    let dmg = rawDamage;
    if (attacker?.definition.passive?.includes('ejecuta') && target.hp / target.maxHp < 0.25) {
      dmg = Math.round(dmg * 1.8);
    }
    if (attacker?.definition.passive?.includes('Primer ataque') && attacker.attackTimer === 0) {
      dmg = Math.round(dmg * 1.15);
    }
    if (target.damageReduction > 0) dmg = Math.round(dmg * (1 - target.damageReduction));
    target.hp -= dmg;
    if (target.hp <= 0) {
      target.hp = 0;
      target.dead = true;
    }
    if (attacker?.definition.passive?.includes('arde más fuerte') && attacker.hp / attacker.maxHp < 0.4) {
      attacker.attack = Math.round(attacker.attack * 1.25);
    }
  }

  triggerCommander(): boolean {
    if (this.phase !== 'fighting' || this.commanderCooldown > 0) return false;
    const ability = COMMANDER_ABILITIES[this.commanderAbility];
    this.commanderCooldown = ability.cooldown;
    if (this.commanderAbility === 'meteor') {
      this.enemyBaseHp -= 1500;
      for (const u of this.units) {
        if (u.side === 'enemy' && !u.dead) u.hp -= 350;
      }
    } else if (this.commanderAbility === 'heal_wave') {
      this.playerBaseHp = Math.min(this.playerBaseMax, this.playerBaseHp + 2000);
      for (const u of this.units) {
        if (u.side === 'player' && !u.dead) {
          u.hp = Math.min(u.maxHp, u.hp + Math.round(u.maxHp * 0.25));
        }
      }
    } else if (this.commanderAbility === 'slow_field') {
      this.enemySlowUntil = this.elapsed + 6;
    }
    this.units = this.units.filter((u) => !u.dead);
    return true;
  }

  update(dt: number): void {
    if (this.phase !== 'fighting') return;
    this.elapsed += dt;
    this.commanderCooldown = Math.max(0, this.commanderCooldown - dt);
    this.playerEnergy = Math.min(this.maxEnergy, this.playerEnergy + this.energyRegen * dt);
    this.enemyEnergy = Math.min(this.maxEnergy, this.enemyEnergy + this.enemyEnergyRegen * dt);

    for (const unit of this.units) {
      if (unit.dead) continue;
      const target = this.nearestOpponent(unit);
      const advance = unit.side === 'player' ? 1 : -1;
      let slow = unit.slowFactor;
      if (unit.side === 'enemy' && this.elapsed < this.enemySlowUntil) slow *= 0.55;
      const moveSpeed = unit.moveSpeed * slow;

      if (target && Math.abs(target.x - unit.x) <= unit.range) {
        unit.attackTimer -= dt;
        if (unit.attackTimer <= 0) {
          unit.attackTimer = 1 / unit.attackSpeed;
          this.applyDamage(target, unit.attack, unit);
          if (unit.definition.active?.includes('empuja') && Math.random() < 0.35) {
            target.x += unit.side === 'player' ? 35 : -35;
          }
          if (unit.definition.shape === 'tentacle' && unit.side === 'player') {
            target.slowFactor = 0.75;
          }
        }
      } else {
        unit.x += advance * moveSpeed * dt;
        if (unit.side === 'player' && unit.x >= 1080) {
          this.enemyBaseHp -= unit.attack * dt * 0.5;
        }
        if (unit.side === 'enemy' && unit.x <= 120) {
          this.playerBaseHp -= unit.attack * dt * 0.5;
        }
      }
    }

    this.units = this.units.filter((u) => !u.dead);

    if (this.enemyBaseHp <= 0) {
      this.enemyBaseHp = 0;
      this.phase = 'victory';
    }
    if (this.playerBaseHp <= 0) {
      this.playerBaseHp = 0;
      this.phase = 'defeat';
    }
  }
}

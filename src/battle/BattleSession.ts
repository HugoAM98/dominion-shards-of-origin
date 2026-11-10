import Phaser from 'phaser';
import { creatureFrames } from '../art/atlas';
import { ambientFor, GROUND_Y, paintBattlefield, shadowCanvas, WORLD_H, WORLD_W } from '../art/backgrounds';
import { PALETTE, hex } from '../art/palette';
import { renderGrid } from '../art/pixel';
import {
  DIGITS,
  ENEMY_CITADEL,
  FACTION_SWAP,
  FX,
  PLAYER_CRYSTAL,
  PLAYER_TOWER,
  PROJECTILES,
} from '../art/worldSprites';
import { COMMANDER_ABILITIES, type CommanderAbilityId } from '../data/commander';
import { ALL_CREATURE_IDS } from '../data/creatures';
import type { CampaignMission, FactionId } from '../data/types';
import type { PlayerState } from '../systems/playerState';
import { sfxDeploy, sfxHit } from '../systems/audio';
import { EnemyAIController } from './enemyAI';
import { BattleSimulator, SIM_WIDTH } from './simulator';
import type { BattleEvent, BattleUnit } from './types';

const ZOOM = 3;
const SX = WORLD_W / SIM_WIDTH;
const FOOT_Y = GROUND_Y + 5;
const PLAYER_BASE_X = 26;
const ENEMY_BASE_X = 454;

const wx = (simX: number) => simX * SX;

export interface BattleTick {
  energy: number;
  maxEnergy: number;
  cooldowns: Record<string, number>;
  commanderRemaining: number;
  commanderTotal: number;
  playerBasePct: number;
  enemyBasePct: number;
  elapsed: number;
}

export interface BattleSessionCallbacks {
  onPhaseChange: (phase: 'victory' | 'defeat') => void;
  onTick: (tick: BattleTick) => void;
}

interface UnitView {
  img: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Image;
  bar: Phaser.GameObjects.Graphics;
  idle: string[];
  walk: string[];
  attack: string;
  h: number;
  floats: boolean;
  heavy: boolean;
  projectile?: string;
  dir: number;
  lastX: number;
  attackAt: number;
  flashUntil: number;
  knockAt: number;
  spawnAt: number;
  phase: number;
  enraged: boolean;
  dying: boolean;
}

interface Mote {
  r: Phaser.GameObjects.Rectangle;
  x: number;
  y: number;
  seed: number;
}

class BattleScene extends Phaser.Scene {
  sim!: BattleSimulator;
  ai!: EnemyAIController;
  callbacks!: BattleSessionCallbacks;
  mission!: CampaignMission;
  levels!: Record<string, number>;
  commanderAbility!: CommanderAbilityId;

  private views = new Map<number, UnitView>();
  private motes: Mote[] = [];
  private t = 0;
  private tickAcc = 0;
  private finale = false;
  private playerTower!: Phaser.GameObjects.Image;
  private playerCrystal!: Phaser.GameObjects.Image;
  private enemyBase!: Phaser.GameObjects.Image;
  private baseBars!: Phaser.GameObjects.Graphics;
  private baseHitAt = { player: -1, enemy: -1 };
  private smokeAcc = 0;
  private slowOverlay!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: {
    mission: CampaignMission;
    levels: Record<string, number>;
    commanderAbility: CommanderAbilityId;
    callbacks: BattleSessionCallbacks;
  }): void {
    this.mission = data.mission;
    this.levels = data.levels;
    this.commanderAbility = data.commanderAbility;
    this.callbacks = data.callbacks;
  }

  private tex(key: string, canvas: HTMLCanvasElement): string {
    if (!this.textures.exists(key)) this.textures.addCanvas(key, canvas);
    return key;
  }

  private registerTextures(): void {
    for (const id of ALL_CREATURE_IDS) {
      const f = creatureFrames(id);
      f.idle.forEach((c, i) => this.tex(`${id}:idle${i}`, c));
      f.walk.forEach((c, i) => this.tex(`${id}:walk${i}`, c));
      this.tex(`${id}:attack`, f.attack);
    }
    const enemySwap = { m: 'r', n: 's', o: 'S' };
    for (const [name, frames] of Object.entries(FX)) {
      frames.forEach((g, i) => {
        this.tex(`fx:${name}${i}`, renderGrid(g, { outline: null }));
        if (name === 'portal') this.tex(`fx:portalE${i}`, renderGrid(g, { outline: null, swap: enemySwap }));
      });
    }
    for (const [k, g] of Object.entries(PROJECTILES)) this.tex(`proj:${k}`, renderGrid(g, { outline: null }));
    for (const [k, g] of Object.entries(DIGITS)) this.tex(`digit:${k}`, renderGrid(g));
    this.tex('shadow:s', shadowCanvas(10));
    this.tex('shadow:m', shadowCanvas(16));
    this.tex('shadow:l', shadowCanvas(26));
    this.tex('base:tower', renderGrid(PLAYER_TOWER));
    this.tex('base:crystal', renderGrid(PLAYER_CRYSTAL));
    const faction = this.mission.enemyFaction as FactionId;
    this.tex('base:enemy', renderGrid(ENEMY_CITADEL, { swap: FACTION_SWAP[faction] ?? {} }));
    this.tex('bg', paintBattlefield(this.mission.environment));
  }

  create(): void {
    this.sim = new BattleSimulator({
      playerBaseHp: this.mission.playerBaseHp,
      enemyBaseHp: this.mission.enemyBaseHp,
      maxEnergy: 10,
      energyRegen: this.mission.energyRegen,
      environment: this.mission.environment,
      enemyFaction: this.mission.enemyFaction,
    });
    this.sim.commanderAbility = this.commanderAbility;
    this.ai = new EnemyAIController(this.mission);

    this.registerTextures();
    const cam = this.cameras.main;
    cam.setZoom(ZOOM);
    cam.centerOn(WORLD_W / 2, WORLD_H / 2);
    cam.setRoundPixels(true);

    this.add.image(0, 0, 'bg').setOrigin(0, 0).setDepth(0);

    this.playerTower = this.add.image(PLAYER_BASE_X, FOOT_Y + 1, 'base:tower').setOrigin(0.5, 1).setDepth(FOOT_Y - 2);
    this.playerCrystal = this.add.image(PLAYER_BASE_X, 0, 'base:crystal').setOrigin(0.5, 1).setDepth(FOOT_Y - 1);
    this.enemyBase = this.add.image(ENEMY_BASE_X, FOOT_Y + 1, 'base:enemy').setOrigin(0.5, 1).setDepth(FOOT_Y - 2);
    this.baseBars = this.add.graphics().setDepth(500);
    this.slowOverlay = this.add.rectangle(0, 0, WORLD_W, WORLD_H, hex(PALETTE.l), 0).setOrigin(0, 0).setDepth(400);

    const amb = ambientFor(this.mission.environment);
    for (let i = 0; i < amb.count; i++) {
      const r = this.add.rectangle(0, 0, 1, 1, hex(PALETTE[amb.color])).setOrigin(0, 0).setDepth(300);
      this.motes.push({ r, x: Math.random() * WORLD_W, y: Math.random() * GROUND_Y, seed: Math.random() * 10 });
    }

    this.events.on('deploy', (creatureId: string) => {
      if (this.sim.deploy('player', creatureId, this.levels[creatureId] ?? 1)) sfxDeploy();
    });
    this.events.on('commander', () => this.sim.triggerCommander());
  }

  // ---------- event → visuals ----------

  private handle(ev: BattleEvent): void {
    switch (ev.type) {
      case 'spawn':
        this.spawnView(ev.unitId, ev.creatureId, ev.side === 'player' ? 1 : -1, ev.x);
        break;
      case 'attack':
        this.onAttack(ev);
        break;
      case 'death':
        this.onDeath(ev.unitId);
        break;
      case 'knockback': {
        const v = this.views.get(ev.unitId);
        if (v) {
          v.knockAt = this.t;
          this.playFx('dust', v.img.x, FOOT_Y, 70);
        }
        break;
      }
      case 'enrage': {
        const v = this.views.get(ev.unitId);
        if (v) {
          v.enraged = true;
          this.playFx('boom', v.img.x, v.img.y - v.h / 2, 50, 0.5);
        }
        break;
      }
      case 'commander':
        this.onCommander(ev.ability, ev.targets);
        break;
    }
  }

  private spawnView(id: number, creatureId: string, dir: number, simX: number): void {
    const f = creatureFrames(creatureId);
    const h = f.idle[0].height;
    const w = f.idle[0].width;
    const x = Math.round(wx(simX));
    const portal = dir > 0 ? 'portal' : 'portalE';
    this.playFx(portal, x, FOOT_Y - 5, 70, 1, true);
    const img = this.add.image(x, FOOT_Y, `${creatureId}:idle0`).setOrigin(0.5, 1).setFlipX(dir < 0).setAlpha(0);
    const size = w > 26 ? 'l' : w > 15 ? 'm' : 's';
    const shadow = this.add.image(x, FOOT_Y + 1, `shadow:${size}`).setOrigin(0.5, 0.5).setAlpha(0);
    const bar = this.add.graphics();
    this.views.set(id, {
      img,
      shadow,
      bar,
      idle: [`${creatureId}:idle0`, `${creatureId}:idle1`],
      walk: [`${creatureId}:walk0`, `${creatureId}:walk1`],
      attack: `${creatureId}:attack`,
      h,
      floats: Boolean(f.sprite.floats),
      heavy: Boolean(f.sprite.heavy),
      projectile: f.sprite.projectile,
      dir,
      lastX: x,
      attackAt: -1,
      flashUntil: 0,
      knockAt: -1,
      spawnAt: this.t,
      phase: Math.random() * 6,
      enraged: false,
      dying: false,
    });
  }

  private onAttack(ev: Extract<BattleEvent, { type: 'attack' }>): void {
    const v = this.views.get(ev.attackerId);
    if (v) v.attackAt = this.t;
    const target = ev.targetId !== undefined ? this.views.get(ev.targetId) : undefined;
    const toBase = ev.targetId === undefined;
    const tx = toBase ? (ev.side === 'player' ? ENEMY_BASE_X - 8 : PLAYER_BASE_X + 8) : Math.round(wx(ev.targetX));
    const ty = toBase ? FOOT_Y - 18 : target ? target.img.y - Math.round(target.h * 0.5) : FOOT_Y - 8;
    const land = () => this.impact(ev, tx, ty, target, toBase, v?.heavy ?? false);

    if (ev.ranged && v) {
      const kind = v.projectile ?? 'soul';
      const sx = v.img.x + v.dir * 4;
      const sy = v.img.y - Math.round(v.h * 0.6);
      const proj = this.add.image(sx, sy, `proj:${kind}`).setDepth(450).setFlipX(v.dir < 0);
      const dist = Math.abs(tx - sx);
      const arc = kind === 'ember' ? Math.min(30, dist * 0.35) : 0;
      const state = { k: 0 };
      this.tweens.add({
        targets: state,
        k: 1,
        duration: Math.max(120, dist * 4.5),
        onUpdate: () => {
          proj.x = Math.round(sx + (tx - sx) * state.k);
          proj.y = Math.round(sy + (ty - sy) * state.k - Math.sin(state.k * Math.PI) * arc);
        },
        onComplete: () => {
          proj.destroy();
          land();
        },
      });
    } else {
      this.time.delayedCall(70, land);
    }
  }

  private impact(
    ev: Extract<BattleEvent, { type: 'attack' }>,
    x: number,
    y: number,
    target: UnitView | undefined,
    toBase: boolean,
    heavy: boolean,
  ): void {
    this.playFx('spark', x + Phaser.Math.Between(-2, 2), y + Phaser.Math.Between(-2, 2), 45);
    if (target && !target.dying) target.flashUntil = this.t + 0.07;
    if (toBase) {
      this.baseHitAt[ev.side === 'player' ? 'enemy' : 'player'] = this.t;
    }
    const color = ev.crit ? 0xffe9a3 : ev.side === 'enemy' ? 0xff9aa6 : 0xffffff;
    this.damageNumber(ev.damage, x, y - 6, color);
    if (heavy || ev.damage >= 200) this.cameras.main.shake(70, 0.0035);
    if (Math.random() < 0.5) sfxHit();
  }

  private onDeath(id: number): void {
    const v = this.views.get(id);
    if (!v || v.dying) return;
    v.dying = true;
    v.flashUntil = this.t + 0.09;
    v.bar.clear();
    this.time.delayedCall(90, () => {
      this.playFx('puff', v.img.x, v.img.y - Math.round(v.h / 2), 80);
      this.tweens.add({
        targets: [v.img, v.shadow],
        alpha: 0,
        duration: 260,
        onComplete: () => {
          v.img.destroy();
          v.shadow.destroy();
          v.bar.destroy();
          this.views.delete(id);
        },
      });
    });
  }

  private onCommander(ability: string, targets: number[]): void {
    if (ability === 'meteor') {
      const points = targets
        .map((id) => this.views.get(id))
        .filter((v): v is UnitView => Boolean(v))
        .map((v) => ({ x: v.img.x, y: FOOT_Y - 4 }));
      points.push({ x: ENEMY_BASE_X - 4, y: FOOT_Y - 20 });
      points.forEach((p, i) => this.time.delayedCall(i * 110, () => this.meteor(p.x, p.y)));
    } else if (ability === 'heal_wave') {
      this.flashScreen(hex(PALETTE.G), 0.25);
      const spots = targets
        .map((id) => this.views.get(id))
        .filter((v): v is UnitView => Boolean(v))
        .map((v) => ({ x: v.img.x, y: v.img.y - v.h }));
      spots.push({ x: PLAYER_BASE_X, y: FOOT_Y - 30 });
      for (const s of spots) {
        for (let i = 0; i < 3; i++) {
          const p = this.add.image(s.x + Phaser.Math.Between(-5, 5), s.y, 'fx:heal0').setDepth(460);
          this.tweens.add({ targets: p, y: s.y - 14, alpha: 0, delay: i * 120, duration: 650, onComplete: () => p.destroy() });
        }
      }
    } else if (ability === 'slow_field') {
      this.flashScreen(hex(PALETTE.n), 0.3);
    }
  }

  private meteor(x: number, y: number): void {
    const m = this.add.image(x - 60, y - 120, 'fx:meteor0').setDepth(470);
    this.tweens.add({
      targets: m,
      x,
      y,
      duration: 260,
      ease: 'Quad.easeIn',
      onComplete: () => {
        m.destroy();
        this.playFx('boom', x, y, 70);
        this.playFx('dust', x, FOOT_Y, 80);
        this.cameras.main.shake(140, 0.006);
        sfxHit();
      },
    });
  }

  private flashScreen(color: number, alpha: number): void {
    const r = this.add.rectangle(0, 0, WORLD_W, WORLD_H, color, alpha).setOrigin(0, 0).setDepth(480);
    this.tweens.add({ targets: r, alpha: 0, duration: 380, onComplete: () => r.destroy() });
  }

  private playFx(name: string, x: number, y: number, frameMs: number, scale = 1, pingPong = false): void {
    const frames = FX[name === 'portalE' ? 'portal' : name]?.length ?? 1;
    const seq = Array.from({ length: frames }, (_, i) => `fx:${name}${i}`);
    if (pingPong) seq.push(...[...seq].reverse().slice(1));
    const img = this.add.image(Math.round(x), Math.round(y), seq[0]).setDepth(455).setScale(scale);
    seq.forEach((key, i) => this.time.delayedCall(i * frameMs, () => img.active && img.setTexture(key)));
    this.time.delayedCall(seq.length * frameMs, () => img.destroy());
  }

  private damageNumber(n: number, x: number, y: number, tint: number): void {
    const s = String(n);
    const c = this.add.container(Math.round(x - (s.length * 4) / 2), Math.round(y)).setDepth(490);
    [...s].forEach((ch, i) => c.add(this.add.image(i * 4, 0, `digit:${ch}`).setOrigin(0, 0).setTint(tint)));
    this.tweens.add({ targets: c, y: c.y - 9, duration: 520, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: c, alpha: 0, delay: 380, duration: 200, onComplete: () => c.destroy() });
  }

  // ---------- per-frame ----------

  private syncUnit(unit: BattleUnit | undefined, v: UnitView): void {
    if (!unit || v.dying) {
      if (v.dying && this.t < v.flashUntil) v.img.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      return;
    }
    const t = this.t;
    const x = wx(unit.x);
    const moving = Math.abs(x - v.lastX) > 0.002;
    v.lastX = x;

    let key: string;
    const sinceAttack = t - v.attackAt;
    if (sinceAttack >= 0 && sinceAttack < 0.16) key = v.attack;
    else if (moving && !v.floats) key = v.walk[Math.floor(t / 0.16 + v.phase) % 2];
    else key = v.idle[Math.floor(t / 0.45 + v.phase) % 2];
    if (v.img.texture.key !== key) v.img.setTexture(key);

    let dx = 0;
    let dy = 0;
    if (sinceAttack >= 0 && sinceAttack < 0.09 && unit.range < 100) dx = v.dir * 2;
    if (v.floats) dy -= 3 + Math.round(Math.sin(t * 3 + v.phase) * 1.5);
    const sinceKnock = t - v.knockAt;
    if (v.knockAt >= 0 && sinceKnock < 0.45) dy -= Math.round(Math.sin((sinceKnock / 0.45) * Math.PI) * 7);
    const sinceSpawn = t - v.spawnAt;
    const appear = Math.min(1, Math.max(0, (sinceSpawn - 0.12) / 0.18));
    dy -= Math.round((1 - appear) * 8);

    const footY = FOOT_Y + unit.lane;
    v.img.setPosition(Math.round(x + dx), footY + dy).setAlpha(appear).setDepth(footY + 10);
    v.shadow.setPosition(Math.round(x), footY + 1).setAlpha(appear).setDepth(footY + 9);

    if (t < v.flashUntil) v.img.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else if (unit.side === 'enemy' && this.sim.elapsed < this.sim.enemySlowUntil)
      v.img.setTint(0x9fb8ff).setTintMode(Phaser.TintModes.MULTIPLY);
    else if (v.enraged && Math.floor(t * 6) % 2 === 0) v.img.setTint(0xffb39a).setTintMode(Phaser.TintModes.MULTIPLY);
    else v.img.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);

    v.bar.clear();
    if (unit.hp < unit.maxHp) {
      const w = 12;
      const bx = Math.round(x) - w / 2;
      const by = footY + dy - v.h - 3;
      const fill = Math.max(1, Math.round((unit.hp / unit.maxHp) * w));
      v.bar.fillStyle(hex(PALETTE['1']), 1).fillRect(bx - 1, by - 1, w + 2, 3);
      v.bar.fillStyle(unit.side === 'player' ? hex(PALETTE.j) : hex(PALETTE.R), 1).fillRect(bx, by, fill, 1);
      v.bar.setDepth(footY + 11);
    }
  }

  private drawBaseBars(): void {
    const g = this.baseBars;
    g.clear();
    const bar = (cx: number, pct: number, color: number) => {
      const w = 26;
      const x = cx - w / 2;
      const y = 108;
      g.fillStyle(hex(PALETTE['1']), 1).fillRect(x - 1, y - 1, w + 2, 5);
      g.fillStyle(hex(PALETTE['3']), 1).fillRect(x, y, w, 3);
      g.fillStyle(color, 1).fillRect(x, y, Math.max(0, Math.round(w * pct)), 3);
      g.fillStyle(0xffffff, 0.35).fillRect(x, y, Math.max(0, Math.round(w * pct)), 1);
    };
    bar(PLAYER_BASE_X, this.sim.playerBaseHp / this.sim.playerBaseMax, hex(PALETTE.n));
    bar(ENEMY_BASE_X, this.sim.enemyBaseHp / this.sim.enemyBaseMax, hex(PALETTE.R));
  }

  private animateBases(dt: number): void {
    const shake = (since: number) => (since >= 0 && since < 0.14 ? (Math.floor(since * 60) % 2 ? 1 : -1) : 0);
    const pShake = shake(this.t - this.baseHitAt.player);
    const eShake = shake(this.t - this.baseHitAt.enemy);
    if (!this.finale || this.sim.phase !== 'defeat') {
      this.playerTower.x = PLAYER_BASE_X + pShake;
      this.playerCrystal.setPosition(PLAYER_BASE_X + pShake, FOOT_Y - 26 + Math.round(Math.sin(this.t * 2) * 1.5));
    }
    if (!this.finale || this.sim.phase !== 'victory') this.enemyBase.x = ENEMY_BASE_X + eShake;
    this.enemyBase.setTint(eShake ? 0xffd0d0 : 0xffffff);

    this.smokeAcc += dt;
    if (this.smokeAcc > 0.5) {
      this.smokeAcc = 0;
      if (this.sim.enemyBaseHp / this.sim.enemyBaseMax < 0.35)
        this.playFx('puff', ENEMY_BASE_X + Phaser.Math.Between(-8, 8), FOOT_Y - 30, 140);
      if (this.sim.playerBaseHp / this.sim.playerBaseMax < 0.35)
        this.playFx('puff', PLAYER_BASE_X + Phaser.Math.Between(-8, 8), FOOT_Y - 30, 140);
    }
  }

  private animateMotes(dt: number): void {
    const amb = ambientFor(this.mission.environment);
    for (const m of this.motes) {
      m.x += amb.vx * dt + Math.sin(this.t * 1.3 + m.seed) * amb.wobble * dt;
      m.y += amb.vy * dt;
      if (m.y < 0) m.y = GROUND_Y;
      if (m.y > GROUND_Y) m.y = 0;
      if (m.x < 0) m.x = WORLD_W;
      if (m.x > WORLD_W) m.x = 0;
      m.r.setPosition(Math.round(m.x), Math.round(m.y));
      m.r.setAlpha(0.45 + 0.55 * Math.abs(Math.sin(this.t * 2 + m.seed)));
    }
  }

  private playFinale(phase: 'victory' | 'defeat'): void {
    this.finale = true;
    const base = phase === 'victory' ? this.enemyBase : this.playerTower;
    const cx = phase === 'victory' ? ENEMY_BASE_X : PLAYER_BASE_X;
    for (let i = 0; i < 7; i++) {
      this.time.delayedCall(i * 140, () => {
        this.playFx('boom', cx + Phaser.Math.Between(-10, 10), FOOT_Y - Phaser.Math.Between(6, 40), 70);
        this.cameras.main.shake(120, 0.005);
        sfxHit();
      });
    }
    const sinking = phase === 'defeat' ? [base, this.playerCrystal] : [base];
    this.tweens.add({ targets: sinking, y: '+=14', alpha: 0.25, delay: 500, duration: 700, ease: 'Quad.easeIn' });
    this.time.delayedCall(1300, () => this.callbacks.onPhaseChange(phase));
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000);
    this.t += dt;
    this.sim.update(dt);
    this.ai.update(this.sim, dt);
    for (const ev of this.sim.drainEvents()) this.handle(ev);

    const byId = new Map(this.sim.units.map((u) => [u.id, u]));
    for (const [id, v] of this.views) this.syncUnit(byId.get(id), v);

    this.animateBases(dt);
    this.drawBaseBars();
    this.animateMotes(dt);
    const slowed = this.sim.elapsed < this.sim.enemySlowUntil;
    this.slowOverlay.setAlpha(slowed ? 0.08 + Math.sin(this.t * 4) * 0.03 : 0);

    this.tickAcc += dt;
    if (this.tickAcc >= 0.1) {
      this.tickAcc = 0;
      this.callbacks.onTick({
        energy: this.sim.playerEnergy,
        maxEnergy: this.sim.maxEnergy,
        cooldowns: { ...this.sim.cooldowns },
        commanderRemaining: this.sim.commanderCooldown,
        commanderTotal: COMMANDER_ABILITIES[this.sim.commanderAbility].cooldown,
        playerBasePct: this.sim.playerBaseHp / this.sim.playerBaseMax,
        enemyBasePct: this.sim.enemyBaseHp / this.sim.enemyBaseMax,
        elapsed: this.sim.elapsed,
      });
    }

    if (!this.finale && (this.sim.phase === 'victory' || this.sim.phase === 'defeat')) {
      this.playFinale(this.sim.phase);
    }
  }
}

export class BattleSession {
  private game: Phaser.Game | null = null;
  private parent: HTMLElement;
  private mission: CampaignMission;
  private player: PlayerState;
  private callbacks: BattleSessionCallbacks;

  constructor(parent: HTMLElement, mission: CampaignMission, player: PlayerState, callbacks: BattleSessionCallbacks) {
    this.parent = parent;
    this.mission = mission;
    this.player = player;
    this.callbacks = callbacks;
  }

  start(): void {
    this.parent.innerHTML = '';
    const host = document.createElement('div');
    host.className = 'battle-canvas-host';
    this.parent.appendChild(host);

    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width: WORLD_W * ZOOM,
      height: WORLD_H * ZOOM,
      backgroundColor: PALETTE['1'],
      pixelArt: true,
      roundPixels: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      audio: { noAudio: true },
      banner: false,
    });

    const levels: Record<string, number> = {};
    for (const id of this.player.loadout) levels[id] = this.player.owned[id]?.level ?? 1;

    this.game.scene.add('BattleScene', BattleScene, true, {
      mission: this.mission,
      levels,
      commanderAbility: this.player.commanderAbility,
      callbacks: this.callbacks,
    });
  }

  private scene(): BattleScene | null {
    return (this.game?.scene.getScene('BattleScene') as BattleScene | undefined) ?? null;
  }

  deploy(creatureId: string): void {
    this.scene()?.events.emit('deploy', creatureId);
  }

  commander(): void {
    this.scene()?.events.emit('commander');
  }

  destroy(): void {
    this.game?.destroy(true);
    this.game = null;
    this.parent.innerHTML = '';
  }
}

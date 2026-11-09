import Phaser from 'phaser';
import { COMMANDER_ABILITIES, type CommanderAbilityId } from '../data/commander';
import type { CampaignMission } from '../data/types';
import { CREATURES } from '../data/creatures';
import { FACTIONS } from '../data/factions';
import type { PlayerState } from '../systems/playerState';
import { EnemyAIController } from './enemyAI';
import { BattleSimulator } from './simulator';
import type { BattleUnit } from './types';

const W = 1200;
const H = 500;

export interface BattleSessionCallbacks {
  onPhaseChange: (phase: 'victory' | 'defeat') => void;
  onEnergyChange: (current: number, max: number) => void;
  onCommanderCooldown?: (remaining: number, total: number) => void;
}

class BattleScene extends Phaser.Scene {
  sim!: BattleSimulator;
  ai!: EnemyAIController;
  unitSprites = new Map<number, Phaser.GameObjects.Container>();
  callbacks!: BattleSessionCallbacks;
  mission!: CampaignMission;
  loadout!: string[];
  levels!: Record<string, number>;
  commanderAbility!: CommanderAbilityId;
  hudText!: Phaser.GameObjects.Text;
  envGfx!: Phaser.GameObjects.Graphics;
  private battleEnded = false;

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: {
    mission: CampaignMission;
    loadout: string[];
    levels: Record<string, number>;
    commanderAbility: CommanderAbilityId;
    callbacks: BattleSessionCallbacks;
  }): void {
    this.mission = data.mission;
    this.loadout = data.loadout;
    this.levels = data.levels;
    this.commanderAbility = data.commanderAbility;
    this.callbacks = data.callbacks;
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
    this.ai = new EnemyAIController(this.mission);
    this.sim.commanderAbility = this.commanderAbility;
    this.drawEnvironment();
    this.drawBases();
    this.hudText = this.add.text(16, 12, '', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      color: '#e2e8f0',
    });
    this.events.on('deploy', (creatureId: string, level: number) => {
      this.sim.deploy('player', creatureId, level);
    });
    this.events.on('commander', () => {
      if (this.sim.triggerCommander()) {
        const flash = this.add.graphics();
        flash.fillStyle(0xfbbf24, 0.25);
        flash.fillRect(0, 0, W, H);
        this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });
      }
    });
  }

  private drawEnvironment(): void {
    const g = this.add.graphics();
    this.envGfx = g;
    const env = this.mission.environment;
    const sky =
      env === 'volcan'
        ? 0x2a1520
        : env === 'ocean_shore'
          ? 0x0f2433
          : env === 'bio_forest'
            ? 0x142818
            : 0x12182a;
    g.fillStyle(sky, 1);
    g.fillRect(0, 0, W, H);
    g.fillStyle(0x1a2438, 1);
    g.fillRect(0, H - 120, W, 120);
    g.fillStyle(0x2d3f5c, 0.5);
    for (let i = 0; i < 8; i++) {
      g.fillEllipse(80 + i * 140, H - 100, 120, 35);
    }
    if (env === 'volcan') {
      g.fillStyle(0xf97316, 0.15);
      g.fillCircle(900, 80, 60);
    }
  }

  private drawBases(): void {
    const playerFaction = FACTIONS.astralis;
    const enemyFaction = FACTIONS[this.mission.enemyFaction] ?? FACTIONS.necrovan;
    this.makeBase(70, H - 200, playerFaction.accent, true);
    this.makeBase(W - 70, H - 200, enemyFaction.accent, false);
  }

  private makeBase(x: number, y: number, color: string, player: boolean): void {
    const c = this.add.container(x, y);
    const body = this.add.graphics();
    const hex = parseInt(color.replace('#', ''), 16);
    body.fillStyle(hex, 0.9);
    body.fillRoundedRect(-42, -70, 84, 140, 12);
    body.lineStyle(3, 0xffffff, 0.35);
    body.strokeRoundedRect(-42, -70, 84, 140, 12);
    const crystal = this.add.graphics();
    crystal.fillStyle(0xffffff, 0.5);
    crystal.fillTriangle(0, -95, -20, -60, 20, -60);
    const label = this.add.text(0, 85, player ? 'TU NEXO' : 'NEXO ENEMIGO', {
      fontFamily: 'Cinzel, serif',
      fontSize: '11px',
      color: '#cbd5e1',
    });
    label.setOrigin(0.5);
    c.add([body, crystal, label]);
  }

  private drawUnit(unit: BattleUnit): Phaser.GameObjects.Container {
    const container = this.add.container(unit.x, unit.y);
    const g = this.add.graphics();
    const accent = parseInt(unit.definition.accent.replace('#', ''), 16);
    const w = unit.definition.shape === 'bulk' ? 48 : unit.definition.shape === 'swarm' ? 22 : 32;
    const h = unit.definition.shape === 'light' ? 44 : 28;
    g.fillStyle(accent, 1);
    if (unit.definition.shape === 'light') {
      g.fillCircle(0, 0, w * 0.55);
      g.fillStyle(0xffffff, 0.45);
      g.fillCircle(-4, -4, w * 0.2);
    } else if (unit.definition.shape === 'fang') {
      g.fillTriangle(-w / 2, h / 2, w / 2, h / 2, 0, -h / 2);
    } else if (unit.definition.shape === 'tentacle') {
      g.fillEllipse(0, 0, w, h);
      g.lineStyle(4, accent, 0.8);
      g.lineBetween(0, 0, 20, -25);
    } else if (unit.definition.shape === 'bone') {
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
      g.fillStyle(0x1e1b4b, 1);
      g.fillCircle(-6, -4, 4);
      g.fillCircle(6, -4, 4);
    } else if (unit.definition.shape === 'mech' || unit.definition.shape === 'bulk') {
      g.fillRect(-w / 2, -h / 2, w, h);
      g.lineStyle(2, 0xffffff, 0.4);
      g.strokeRect(-w / 2, -h / 2, w, h);
    } else {
      g.fillEllipse(0, 0, w, h);
    }
  const bar = this.add.graphics();
    container.add([g, bar]);
    (container as Phaser.GameObjects.Container & { hpBar: Phaser.GameObjects.Graphics }).hpBar = bar;
    container.setDepth(unit.side === 'player' ? 2 : 3);
    if (unit.side === 'enemy') container.setScale(-1, 1);
    return container;
  }

  private syncUnits(units: BattleUnit[]): void {
    const live = new Set<number>();
    for (const unit of units) {
      live.add(unit.id);
      let sprite = this.unitSprites.get(unit.id);
      if (!sprite) {
        sprite = this.drawUnit(unit);
        this.unitSprites.set(unit.id, sprite);
      }
      sprite.setPosition(unit.x, unit.y);
      const hpBar = (sprite as Phaser.GameObjects.Container & { hpBar: Phaser.GameObjects.Graphics }).hpBar;
      hpBar.clear();
      const ratio = unit.hp / unit.maxHp;
      hpBar.fillStyle(0x0f172a, 0.8);
      hpBar.fillRect(-22, -28, 44, 5);
      hpBar.fillStyle(ratio > 0.4 ? 0x22c55e : 0xef4444, 1);
      hpBar.fillRect(-22, -28, 44 * ratio, 5);
    }
    for (const [id, sprite] of this.unitSprites) {
      if (!live.has(id)) {
        sprite.destroy();
        this.unitSprites.delete(id);
      }
    }
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    this.sim.update(dt);
    this.ai.update(this.sim, dt);
    const snap = this.sim.snapshot();
    this.syncUnits(snap.units);
    this.callbacks.onEnergyChange(snap.playerEnergy, snap.maxEnergy);
    if (this.callbacks.onCommanderCooldown) {
      const total = COMMANDER_ABILITIES[this.sim.commanderAbility].cooldown;
      this.callbacks.onCommanderCooldown(this.sim.commanderCooldown, total);
    }
    const pPct = Math.round((snap.playerBaseHp / this.sim.playerBaseMax) * 100);
    const ePct = Math.round((snap.enemyBaseHp / this.sim.enemyBaseMax) * 100);
    this.hudText.setText(
      `Nexo aliado: ${pPct}%  |  Nexo enemigo: ${ePct}%  |  Tiempo: ${Math.floor(snap.elapsed)}s`,
    );
    if (!this.battleEnded && (snap.phase === 'victory' || snap.phase === 'defeat')) {
      this.battleEnded = true;
      this.callbacks.onPhaseChange(snap.phase);
      this.scene.pause();
    }
  }
}

export class BattleSession {
  private game: Phaser.Game | null = null;
  private parent: HTMLElement;
  private mission: CampaignMission;
  private player: PlayerState;
  private callbacks: BattleSessionCallbacks;

  constructor(
    parent: HTMLElement,
    mission: CampaignMission,
    player: PlayerState,
    callbacks: BattleSessionCallbacks,
  ) {
    this.parent = parent;
    this.mission = mission;
    this.player = player;
    this.callbacks = callbacks;
  }

  start(): void {
    this.parent.innerHTML = '';
    const host = document.createElement('div');
    host.className = 'battle-canvas-host';
    host.id = 'battle-canvas-host';
    this.parent.appendChild(host);

    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width: W,
      height: H,
      backgroundColor: '#0b0f1a',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: W,
        height: H,
      },
      scene: BattleScene,
      audio: { noAudio: true },
    });

    const levels: Record<string, number> = {};
    for (const id of this.player.loadout) {
      levels[id] = this.player.owned[id]?.level ?? 1;
    }

    this.game.scene.start('BattleScene', {
      mission: this.mission,
      loadout: this.player.loadout,
      levels,
      commanderAbility: this.player.commanderAbility,
      callbacks: this.callbacks,
    });
  }

  deploy(creatureId: string): void {
    if (!this.game) return;
    const scene = this.game.scene.getScene('BattleScene') as BattleScene;
    const level = this.player.owned[creatureId]?.level ?? 1;
    scene.events.emit('deploy', creatureId, level);
  }

  commander(): void {
    if (!this.game) return;
    const scene = this.game.scene.getScene('BattleScene') as BattleScene;
    scene.events.emit('commander');
  }

  destroy(): void {
    this.game?.destroy(true);
    this.game = null;
    this.parent.innerHTML = '';
  }
}

export function creatureInLoadout(loadout: string[], id: string): boolean {
  return loadout.includes(id);
}

export function getLoadoutDefinitions(loadout: string[]) {
  return loadout.map((id) => CREATURES[id]).filter(Boolean);
}

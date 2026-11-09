import type { CampaignMission } from '../data/types';
import type { BattleSimulator } from './simulator';
import { CREATURES } from '../data/creatures';

const ENEMY_DECK: Record<string, string[]> = {
  necrovan: ['grave_herald', 'grave_herald', 'veil_reaper', 'cinder_fang'],
  infernia: ['cinder_fang', 'ash_hatchling', 'brood_mite', 'cinder_fang'],
  xenthar: ['brood_mite', 'brood_mite', 'void_mantid', 'brood_mite'],
  thalassia: ['drowned_lash', 'tidebreaker', 'drowned_lash', 'brood_mite'],
  astralis: ['lumen_wisp', 'solar_sentinel', 'lumen_wisp'],
  mekanor: ['aegis_golem', 'rust_titan', 'lumen_wisp'],
};

export class EnemyAIController {
  private timer = 0;
  private deck: string[];
  private deckIndex = 0;

  constructor(mission: CampaignMission) {
    this.deck = ENEMY_DECK[mission.enemyFaction] ?? ENEMY_DECK.necrovan;
  }

  update(sim: BattleSimulator, dt: number): void {
    if (sim.phase !== 'fighting') return;
    this.timer -= dt;
    if (this.timer > 0) return;

    const creatureId = this.deck[this.deckIndex % this.deck.length];
    this.deckIndex++;
    const cost = CREATURES[creatureId]?.stats.deployCost ?? 99;
    if (sim.enemyEnergy < cost) {
      this.timer = 0.25;
      return;
    }
    const deployed = sim.deploy('enemy', creatureId, 1);
    this.timer = deployed ? 1.8 + Math.random() * 1.2 : 0.35;
  }
}

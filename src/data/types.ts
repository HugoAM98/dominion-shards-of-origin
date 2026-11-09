export type FactionId =
  | 'astralis'
  | 'infernia'
  | 'xenthar'
  | 'mekanor'
  | 'necrovan'
  | 'thalassia';

export type Rarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR' | 'LR';

export type CombatRole =
  | 'tank'
  | 'warrior'
  | 'assassin'
  | 'ranged'
  | 'support'
  | 'healer'
  | 'controller'
  | 'artillery'
  | 'swarm';

export interface CreatureStats {
  hp: number;
  attack: number;
  attackSpeed: number;
  moveSpeed: number;
  range: number;
  deployCost: number;
}

export interface CreatureDefinition {
  id: string;
  name: string;
  faction: FactionId;
  rarity: Rarity;
  role: CombatRole;
  stats: CreatureStats;
  lore: string;
  accent: string;
  shape: 'light' | 'fang' | 'swarm' | 'bulk' | 'tentacle' | 'bone' | 'mech';
  passive?: string;
  active?: string;
}

export interface FactionDefinition {
  id: FactionId;
  name: string;
  tagline: string;
  color: string;
  accent: string;
  combatIdentity: string;
}

export interface CampaignMission {
  id: string;
  title: string;
  subtitle: string;
  enemyFaction: FactionId;
  environment: string;
  enemyBaseHp: number;
  playerBaseHp: number;
  energyRegen: number;
  rewardDust: number;
  rewardFragments: number;
  unlockCreatureId?: string;
  briefing: string;
}

export interface GachaPoolEntry {
  creatureId: string;
  weight: number;
}

export type ScreenId =
  | 'menu'
  | 'worldmap'
  | 'campaign'
  | 'battle'
  | 'summon'
  | 'collection'
  | 'evolution'
  | 'tower'
  | 'settings';

export type BattleMode = 'campaign' | 'tower' | 'practice';

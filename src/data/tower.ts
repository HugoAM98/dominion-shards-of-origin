import type { CampaignMission, FactionId } from './types';

const FACTION_ROTATION: FactionId[] = ['necrovan', 'infernia', 'xenthar', 'thalassia', 'mekanor', 'astralis'];

export function buildTowerMission(floor: number): CampaignMission {
  const faction = FACTION_ROTATION[(floor - 1) % FACTION_ROTATION.length];
  const scale = 1 + (floor - 1) * 0.12;
  return {
    id: `tower_${floor}`,
    title: `Torre del Infinito — Piso ${floor}`,
    subtitle: `Modificador ${floor % 3 === 0 ? '· Oleada intensa' : floor % 2 === 0 ? '· Energía acelerada' : '· Estándar'}`,
    enemyFaction: faction,
    environment: floor % 4 === 0 ? 'volcan' : floor % 3 === 0 ? 'ocean_shore' : 'dimension_corrupta',
    enemyBaseHp: Math.round(9000 * scale),
    playerBaseHp: Math.round(10000 * Math.max(0.75, 1 - floor * 0.02)),
    energyRegen: 1.55 + Math.min(floor * 0.03, 0.8),
    rewardDust: 40 + floor * 15,
    rewardFragments: 8 + floor * 4,
    briefing: `Supera el piso ${floor}. Cada nivel aumenta la presión enemiga.`,
  };
}

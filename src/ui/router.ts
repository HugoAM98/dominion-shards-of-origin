import type { BattleMode, CampaignMission, ScreenId } from '../data/types';
import type { PlayerState } from '../systems/playerState';

export interface AppContext {
  root: HTMLElement;
  player: PlayerState;
  setPlayer: (state: PlayerState) => void;
  navigate: (screen: ScreenId, params?: AppRouteParams) => void;
}

export interface AppRouteParams {
  mission?: CampaignMission;
  mode?: BattleMode;
  towerFloor?: number;
  returnScreen?: ScreenId;
}

export type ScreenFactory = (ctx: AppContext, params?: AppRouteParams) => HTMLElement | Promise<HTMLElement>;

const registry = new Map<ScreenId, ScreenFactory>();

export function registerScreen(id: ScreenId, factory: ScreenFactory): void {
  registry.set(id, factory);
}

export async function renderScreen(
  ctx: AppContext,
  screen: ScreenId,
  params?: AppRouteParams,
): Promise<void> {
  const factory = registry.get(screen);
  if (!factory) {
    ctx.root.innerHTML = '<p class="error">Pantalla no encontrada.</p>';
    return;
  }
  const el = await factory(ctx, params);
  ctx.root.innerHTML = '';
  ctx.root.appendChild(el);
  ctx.root.dataset.screen = screen;
}

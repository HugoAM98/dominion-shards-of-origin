import type { ScreenId } from './data/types';
import { loadPlayer, savePlayer, type PlayerState } from './systems/playerState';
import type { AppRouteParams } from './ui/router';
import { renderScreen } from './ui/router';
import './ui/screens/menu';
import './ui/screens/worldmap';
import './ui/screens/battle';
import './ui/screens/summon';
import './ui/screens/collection';
import './ui/screens/evolution';
import './ui/screens/tower';
import './ui/screens/settings';

export function bootstrapApp(root: HTMLElement): void {
  let player = loadPlayer();

  const navigate = (screen: ScreenId, params?: AppRouteParams) => {
    void renderScreen(
      {
        root,
        player,
        setPlayer: (state: PlayerState) => {
          player = state;
          savePlayer(state);
        },
        navigate,
      },
      screen,
      params,
    );
  };

  navigate('menu');
}

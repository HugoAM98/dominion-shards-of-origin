import { bootstrapApp } from './app';
import { installUiSkin } from './art/uiSkin';
import './styles/global.css';

installUiSkin();

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) {
  throw new Error('No se encontró el contenedor #app');
}

if (import.meta.env.DEV && new URLSearchParams(location.search).has('sprites')) {
  void import('./art/spritePreview').then((m) => m.mountSpritePreview(root));
} else {
  bootstrapApp(root);
}

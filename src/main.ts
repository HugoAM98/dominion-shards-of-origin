import { bootstrapApp } from './app';
import './styles/global.css';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) {
  throw new Error('No se encontró el contenedor #app');
}

bootstrapApp(root);

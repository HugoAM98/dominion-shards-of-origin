# Dominion: Shards of Origin

Juego de estrategia fantasy en **tiempo real** para navegador (PC y móvil). Colección de criaturas, campaña dimensional, torre infinita, invocaciones y evolución.

## Jugar en local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Contenido (v1.0)

| Modo | Descripción |
|------|-------------|
| **Mapa dimensional** | 5 misiones de campaña con desbloqueo progresivo |
| **Torre del Infinito** | Pisos escalables (hasta 50+) |
| **Batalla** | Energía, 5 criaturas, IA, habilidad de comandante |
| **Portal del Origen** | Gacha con pity y duplicados → polvo |
| **Colección / Evolución** | Formación de 5 y mejoras con polvo |
| **Tutorial** | Primera visita al menú |

Progreso en `localStorage` del navegador.

## Jugar online

**https://hugoam98.github.io/dominion-shards-of-origin/**

Para publicar una nueva versión:

```bash
npm run deploy
```

Compila con la ruta base de GitHub Pages y sube `dist/` a la rama `gh-pages`. Si cambia el nombre del repo, actualiza `pagesBase` en `vite.config.ts`.

## Documentación de diseño

Ver [`docs/`](docs/).

## Stack

TypeScript · Vite · Phaser 3 · CSS responsivo

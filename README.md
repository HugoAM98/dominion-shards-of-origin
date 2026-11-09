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

## Demo en GitHub Pages

Tras el primer push a `main`, activa **GitHub Pages** en el repo (origen: *GitHub Actions*). La URL será:

`https://HugoAM98.github.io/dominion-shards-of-origin/`

(Ajusta `base` en `vite.config.ts` si el nombre del repo cambia.)

## Documentación de diseño

Ver [`docs/`](docs/).

## Stack

TypeScript · Vite · Phaser 3 · CSS responsivo

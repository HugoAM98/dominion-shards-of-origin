# Arquitectura técnica

## Stack (prototipo web)
| Capa | Tecnología |
|------|------------|
| Build | Vite 8 |
| Lenguaje | TypeScript |
| Batalla (render) | Phaser 3 |
| UI | DOM + CSS (responsive) |
| Persistencia | localStorage |

## Estructura `src/`
- `data/` — criaturas, facciones, campaña, gacha (datos puros).
- `battle/` — simulador, IA, sesión Phaser.
- `systems/` — jugador, gacha.
- `ui/` — pantallas y navegación.

## Extensión de criaturas
Añadir entrada en `data/creatures.ts` + opcionalmente pool en `data/gacha.ts`. No requiere cambiar el motor de combate.

## Futuro
- React opcional para menús complejos.
- API Node + PostgreSQL para cuenta cloud y PvP asíncrono.
- Export Capacitor / TWA para móvil.

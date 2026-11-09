# Registro de desarrollo — Dominion: Shards of Origin

## v1.0 — 2026-11-09

### Implementado
- Mapa dimensional con 5 misiones de campaña y desbloqueo progresivo.
- Torre del Infinito (pisos escalables, récord guardado).
- Batalla en tiempo real (Phaser, cargado bajo demanda): energía, 5 criaturas, IA enemiga, entornos (volcán, océano, bosque, vacío).
- Habilidades de comandante: meteorito, onda sanadora, campo temporal (se eligen en Ajustes).
- Portal del Origen: invocación ×1 / ×10, pity SR+ a 30, duplicados → polvo.
- Colección: 12 criaturas, no descubiertas en silueta, formación de 5.
- Evolución: subir nivel (hasta 20) con polvo, +8% stats por nivel aplicado en batalla.
- Tutorial en la primera visita.
- Repetir misiones da recompensa reducida (35% polvo / 25% fragmentos).
- Sonidos procedurales (Web Audio).
- Guardado en localStorage (`dominion_player_v2`, migra desde v1).

### Verificado (en navegador, vista móvil)
- `npm run build` sin errores.
- Misión 1 completada con victoria; misión 2 desbloqueada; recompensas guardadas.
- Invocación descuenta 160 fragmentos y añade criatura.
- Torre, Evolución, Colección y misión 2 (volcán) cargan correctamente.
- Versión publicada en GitHub Pages carga y la batalla funciona.

### Publicación
- Repo: https://github.com/HugoAM98/dominion-shards-of-origin
- Demo: https://hugoam98.github.io/dominion-shards-of-origin/
- Despliegue: `npm run deploy` (rama `gh-pages`). Se descartó GitHub Actions porque el token de `gh` no tiene el scope `workflow`; para usarlo: `gh auth refresh -s workflow`.

### Pendiente / siguiente prioridad
1. Arte de criaturas (sprites) y animaciones de ataque/impacto.
2. Jefes con fases en la misión 5.
3. Evolución visual por etapas, mutaciones e híbridos.
4. Tests unitarios del simulador y del gacha.

# Registro de desarrollo — Dominion: Shards of Origin

## v1.0 — 2026-11-09

### Implementado
- Mapa dimensional con 5 misiones de campaña y desbloqueo progresivo.
- Torre del Infinito (pisos escalables, récord guardado).
- Batalla en tiempo real (Phaser, cargado bajo demanda): energía, 5 criaturas, IA enemiga, entornos (volcán, océano, bosque, vacío).
- Habilidades de comandante: meteorito, onda sanadora, campo temporal (se eligen en Ajustes).
- Portal del Origen: invocación ×1 / ×10, pity SR+ a 30, duplicados ? polvo.
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

---

## Sesi?n: pixel art e interfaz (v1.1)

### Implementado
- Pipeline de pixel art propio (`src/art/`): paleta ?nica de 64 tonos, sprites como cuadr?culas de texto con contorno autom?tico, fotogramas por diferencias (reposo / paso / ataque) y cach? a canvas.
- 12 criaturas dibujadas a mano, torre del jugador, ciudadela enemiga recoloreada por facci?n, efectos (chispa, humo, polvo, portal, explosi?n, meteorito, curaci?n), proyectiles e iconos.
- Fondos de batalla por entorno con tramado Bayer, siluetas y part?culas ambientales.
- Batalla renovada: animaci?n por fotogramas, embestida, flotaci?n, retroceso, destellos de impacto, n?meros de da?o en p?xel, temblor de c?mara, invocaci?n con portal, muertes, habilidades de comandante visuales y derrumbe final de la base.
- Mec?nicas nuevas: retroceso al 50% de vida, recarga por criatura, furia, pulso de sanaci?n.
- Interfaz completa en p?xel: marcos SVG 9-slice generados en tiempo de ejecuci?n, fuentes Pixelify Sans / Jersey 10, animaciones a pasos (`steps()`).
- Men? con escena animada (cristal del Origen fracturado, esquirlas en ?rbita, comandante en el acantilado).
- Portal con v?rtice animado que se carga con el color de la mejor rareza y revelado de cartas que se voltean.
- Ficha de criatura con sprite animado; mapa con ciudadelas; torre por pisos; forja de evoluci?n con vista previa de stats.
- Panel de victoria/derrota con recompensas y criatura desbloqueada; bot?n Reintentar.

### Verificado
- `npm run build` sin errores.
- Escritorio 1280?720: men?, mapa, batalla completa (victoria en ~48 s, recompensas y desbloqueo), portal ?1 con revelado, bestiario + ficha, evoluci?n.
- M?vil vertical 390?760 y horizontal 760?360: men? y disposici?n de la batalla medidos.

### Pendiente
1. Jefes con fases en la misi?n 5.
2. Evoluci?n visual por etapas, mutaciones e h?bridos.
3. Tests unitarios del simulador y del gacha.
4. M?sica ambiental.

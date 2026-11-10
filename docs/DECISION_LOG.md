# Decision log

| Fecha | DecisiÃ³n | Motivo |
|-------|----------|--------|
| 2026-11-09 | UI sin React en MVP | Menor bundle, mejor tiempo de carga mÃ³vil |
| 2026-11-09 | Simulador TS + Phaser render | Pruebas futuras y separaciÃ³n lÃ³gica/visual |
| 2026-11-09 | EspaÃ±ol en UI | Pedido del jugador / mercado inicial |
| 2026-11-09 | Sin pagos reales | Prototipo disfrutable sin monetizaciÃ³n |
| 2026-11-09 | Pixel art generado desde cuadrículas de texto en código | Sin dependencias de assets externos, recoloreado por facción trivial, diff de fotogramas legible |
| 2026-11-09 | Marcos de UI como SVG 9-slice en tiempo de ejecución | Bordes nítidos a escala entera (2×/3×) sin imágenes; la paleta de la UI es la misma que la de los sprites |
| 2026-11-09 | Animaciones CSS con `steps()` | Movimiento a saltos coherente con el pixel art, evita interpolaciones suaves que delatan la web |

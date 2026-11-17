# Películas Edwin frente a Xuper TV — 16 de noviembre de 2026

## Referencia competitiva

Varias páginas usan el nombre Xuper TV y no está demostrado que describan el mismo producto. La página que declara el paquete `com.xuper.tvapp` presenta exploración, fichas, películas, series y búsqueda: <https://xupertv.hk/>. Otra página promociona canales, deportes, guía, favoritos y HD/4K: <https://www.xupertv.stream/>. Esas son declaraciones de sus sitios, no mediciones comparativas de rendimiento o calidad.

TeleLibre ya ofrece búsqueda, fichas, canales, guía, favoritos y Continuar Viendo. La ventaja que conviene consolidar es la experiencia con el control remoto y la continuidad de la película cuando cambia o vence un servidor, especialmente con audio español.

## Mejora entregada hoy

- Cuando se agotan los intentos de reproducción de una película de Poseidon, el reproductor realiza **una sola** recuperación en vivo. Obtiene nuevos `player.php`, renueva la caché de VidHide/Vidara/StreamWish y vuelve a intentar sin cerrar la pantalla.
- Conserva el segundo actual al pasar entre URLs y al iniciar el nuevo HLS. La recuperación se cancela si el usuario cierra la película o abre otra.
- El respaldo de un video latino prioriza otro enlace español; no agrega inglés como siguiente URL mientras el latino funciona.
- Se añadió una prueba en la que VidHide conserva el mismo código pero entrega un token HLS nuevo; protege contra reutilizar un token caducado.

## Validación y siguientes prioridades

`npm test`: **42/42**. `npm run build`: correcto; 8,79 s de Vite y 16,73 s de proceso completo en esta ejecución. `node scripts/check-es5.mjs`: **0 errores** en los tres archivos JS generados. `git diff --check`: correcto.

La siguiente prioridad de producto es probar con el control real una película con audio alternativo y otra cuyo servidor falle a mitad, para medir tiempo de recuperación, memoria y precisión del salto. Después conviene mostrar claramente audio, calidad y estado del servidor en la ficha y en el reproductor. No se instaló ni se abrió la app en la TV durante este trabajo.

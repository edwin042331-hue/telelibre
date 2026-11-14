# Cambios

## 1.5.0 (2026-11-14): Poseidon 2.0 Senior — Catálogo Masivo 2026, Series, Multi-Idioma y Cascada de Servidores

- **Catálogo Masivo (395 títulos)**:
  - **249 estrenos del 2026**: incluye títulos modernos como *El corazón de la bestia*, *Ebenezer: Los fantasmas de Navidad*, *Ser Heumann*, *Insecta*, y cientos más.
  - **Sagas y Superhéroes**: catálogo completo de *Spider-Man* (16 películas icónicas: Tobey Maguire, Andrew Garfield, Tom Holland, Spider-Verso animado), *Avengers*, *Batman* y *Deadpool*.
  - **Series Poseidon completas**: soporte para series con temporadas y episodios organizados (*VisionQuest*, *El Señor de los Anillos: Los Anillos de Poder*, *12 12 12*, *Tierra de Mafia*, *El cuerpo*, *The Good Daughter*).
- **Selector de Idioma de Audio (Latino, Castellano, Inglés / Subtitulado)**:
  - Botón interactivo de audio en la ficha de detalle (`🌐 Audio: Latino / Castellano / Inglés`) que conmuta entre los tracks disponibles con el control remoto.
  - Memoria del idioma preferido para que se aplique automáticamente en futuras reproducciones.
- **Cascada Multi-Servidor Automática (Fallback de alta resiliencia)**:
  - Si el servidor principal de video está ocupado, lento o no responde, el motor prueba transparentemente en cascada los servidores secundarios (Vidara HLS -> StreamWish MP4 -> Doodstream -> VOE) en menos de 4 segundos sin congelar la app.
  - Eliminación de cabeceras prohibidas W3C (`Referer`, `Origin`) en llamadas XMLHttpRequest para prevenir bloqueos de CORS o excepciones silenciosas en WebViews estrictos.
- **Soporte Completo de HLS con MPEG-TS (`hls.js`)**:
  - Actualización del motor HLS a `hls.js` completo con demuxer nativo de MPEG-TS, resolviendo definitivamente el cuelgue en películas con segmentos camuflados (`.woff`).
  - Priorización inteligente de MSE en Android TV para arranques de reproducción instantáneos.
- **Nuevas Filas Temáticas**:
  - *📅 Estrenos 2026 (249 títulos)*
  - *📺 Series Poseidon*
  - *🕷️ Sagas y Superhéroes*
  - *💎 Disponibles en HD 1080p* y *🎟️ Directo del Cine (CAM)*

## 1.4.2 (2026-11-13): Catálogo ampliado Poseidon, filtrado por Año y badges HD / CAM

- **Catálogo masivo sincronizado (65 películas)**: integrado catálogo real extraído de PoseidonHD2 con títulos, sinopsis, año y portadas de TMDb en alta resolución.
- **Insignias de calidad visibles (HD / CAM)**: cada póster y ficha muestra claramente si la película está disponible en **HD** (1080p Web-DL) o **CAM** (grabación directa de cine) para que el usuario decida libremente cuál ver.
- **Navegación por AÑO y por GÉNERO**: filas dedicadas en Poseidon para *Estrenos 2026*, *Lo Mejor de 2025*, *Estrenos 2024*, *Disponibles en HD 1080p*, *Directo del Cine (CAM)*, *Acción*, *Terror*, *Ciencia Ficción*, *Comedia*, *Animación* y *Drama*.
- **Herramienta de sincronización continua (`scripts/sync-poseidon.mjs`)**: script automatizado para actualizar el catálogo de Poseidon periódicamente.

## 1.4.1 (2026-11-13): Hotfix de arranque y metadatos Poseidon

- **Corrección de bloqueo al iniciar ("19/19")**: asignadas propiedades `regions: []`, `subs: false` y metadatos completos a todas las películas de Poseidon para evitar excepción en el agrupador de filas de películas en español.
- **Robustez en agregador de películas (`src/vod.js`)**: accesos protegidos a `(m.regions || [])` y `(m.genres || [])` para tolerar cualquier fuente externa con objetos incompletos.
- **Ficha de detalle para estrenos (`src/ui/detail-screen.js`)**: visualización inmediata de la sinopsis predeterminada y backdrop en alta definición sin realizar peticiones innecesarias a Internet Archive.
- **Catálogo público publicado (`public/poseidon.json`)**: servido directamente desde GitHub Pages para permitir actualizaciones en segundo plano sin recompilar la app.

## 1.4.0 (2026-11-13): Poseidon (Estrenos de Cine HD)

- **Nueva sección dedicada «Poseidon» en el menú lateral**: pantalla independiente con los últimos estrenos de cine organizados por filas temáticas (Estrenos 2026, Acción y Aventura, Ciencia Ficción, Terror y Suspenso, Comedia y Familiar).
- **Motor de resolución de streams en tiempo real (`src/resolvers.js`)**:
  - Soporte para **Vidara** (HLS master `.m3u8` multi-calidad adaptativo con token firmado para la IP del cliente).
  - Soporte para **StreamWish** (MP4 directo a 720p).
  - Soporte para **Doodstream** (MP4 directo en alta velocidad con algoritmo de 10 dígitos aleatorios y expiry).
- **Caché en memoria con TTL**: las resoluciones se almacenan en memoria para reproducir al instante sin reconsultar el servidor si se pausa o se reanuda.
- **Control total en Ajustes**: interruptor para activar o desactivar la sección Poseidon en cualquier momento.
- **Integración con favoritos y progreso**: las películas de Poseidon se pueden agregar a Mi lista, reanudar en Continuar viendo y buscar desde la búsqueda global.

## 1.3.0 (2026-10-27): ronda 5

- **Actualizar desde la misma TV** (Android): al salir una versión nueva aparece "Actualizar ahora / Después", y también está en Ajustes. La app descarga la APK y comprueba que tenga la misma firma que la instalada (SHA-256 de los certificados; si no coincide, la descarta). Después se la pasa al instalador de Android (`PackageInstaller`), que conserva los datos. La primera vez Android pide el permiso *Permitir de esta fuente*.
- **"Ahora:" en los canales de Pluto TV**: unos 190 canales muestran el programa en curso y el siguiente en las tarjetas, en la lista de canales y en el reproductor. En los canales de una sola serie se ve la temporada y el episodio (por ejemplo, "T2:E15 · Objetivo en movimiento") en vez de repetir el nombre. Viene de la guía de Pluto y se renueva cada hora.
- README al día con las rondas 3 y 4. Incluye una nota sobre Watch Next: Google TV no lo muestra, porque su fila "Seguir mirando" usa el Engage SDK, que solo admite apps de Google Play integradas.

## 1.2.2 (2026-10-26)

- La búsqueda por voz va directo al reconocedor de Google TV (antes Android preguntaba cuál usar si había dos).

## 1.2.1 (2026-10-26)

- Probada en la TCL: el enlace directo reanuda el episodio donde quedó y la pantalla solo se fuerza encendida durante la reproducción.
- Corrección: el botón "Buscar por voz" no aparecía porque Buscar se creaba antes de consultar si hay micrófono.
- Nota: Google TV arma su fila "Seguir mirando" con el Engage SDK (solo apps de Google Play integradas); la publicación en Watch Next queda para TVs con Android TV clásico.

## 1.2.0 (2026-10-26): ronda 4

- **Búsqueda por voz** en Android TV: botón en Buscar, "Buscar por voz" en el menú y tecla de búsqueda del control.
- **"Seguir viendo" en la pantalla de inicio de Google TV**: las películas y episodios a medias del perfil activo aparecen junto a los de otras apps; al elegir uno se abre TeleLibre y arranca donde quedó.
- **Temporizador para dormir** (15 a 120 min), con aviso un minuto antes para seguir viendo.
- **La pantalla solo se mantiene encendida mientras se reproduce**: en los menús vuelve el protector de pantalla.

## 1.1.1 (2026-10-26)

- Probada en la TCL: menú de opciones, lista de canales con ◀ (cambio desde la lista), canal anterior y migración de datos al perfil principal.
- Los iconos del menú quedan centrados con el texto.

## 1.1.0 (2026-10-26): ronda 3, perfiles y control de cable

- **Mantén OK = menú de opciones** (Mi lista, ver, guía, Sorpréndeme; en el reproductor: lista de canales, canal anterior, subtítulos). Así todo funciona con controles sin botones de colores, como el de la TCL. También abre con la tecla Menú.
- **Lista de canales dentro del reproductor** (◀ en vivo), con número, logo y "Ahora:"; **marcar el número de canal** con los números del control y **canal anterior**.
- **Perfiles**: "¿Quién está viendo?" al abrir (si hay más de uno). Cada perfil tiene su Mi lista, su progreso, sus vistos, sus recientes y sus gustos. Hay perfil infantil: para salir de él se pide el PIN. Lo guardado antes pasa solo al perfil principal.
- Los recordatorios son un diálogo con "Ver ahora / Ahora no" (ya no dependen del botón verde).
- Android TV: también entiende Menú, Guía, Info y Canal anterior del control.

## 1.0.1 (2026-10-26): ajustes vistos en la TCL real

- Probada en la TCL Smart TV Pro (Android 12, WebView 155, 1080p sobre panel 4K): apartado RD con guía, en vivo, CH+, Atrás y series por episodios.
- El panel superior muestra la fila donde está el foco al volver a una pantalla (antes mostraba siempre la primera).
- En Series, "Series Latinas" y las novelas van antes que "Cine Latino" (películas sueltas). La caché de series se reconstruye sola.

## 1.0.0 (2026-10-26): versión estable para instalar en las TVs

- **Compatibilidad real con TVs viejas**: el JavaScript publicado ahora es ES5 en todos sus archivos (webOS 3 / Tizen 3, Chromium 38). Antes, el empaquetador de Vite 8 dejaba sintaxis moderna en sus propios helpers. El CI verifica cada build con `scripts/check-es5.mjs`.
- **Mi lista y el progreso ya no se pueden perder por falta de espacio**: si localStorage se llena, se liberan cachés (de la más grande a la más chica) antes que datos del usuario.
- **Memoria local de 6.3 a 4.4 MB**: caché compacta de canales y de series, y las listas en inglés ya no se guardan. Las cachés viejas se limpian solas.
- **Ajustes → Diagnóstico**: versión, plataforma, resolución, memoria, fuentes con problemas y últimos errores (también de promesas).
- Corrección: la imagen de fondo de las series tenía dos `?` en la URL.
- Guía de instalación actualizada: el proyecto vive en `C:\Users\Edwin Villa\repos\telelibre` y hay una sección "Si algo falla".

## 0.5.0: series por episodios y Estrenos

- Series de Pluto TV (~1,500) con temporadas, episodios, ✓ de vistos, "Continuar T1:E5" y siguiente episodio automático.
- ~2,800 películas de Pluto con fecha de estreno y fila "Estrenos: lo más nuevo".

## 0.4.0: guía tipo cable, Sorpréndeme, modo infantil

- Guía de programación en cuadrícula para RD, con recordatorios (● Verde para ir al canal).
- Sorpréndeme (● Amarillo), modo infantil con PIN, revisión nocturna de canales (`verified.json`) y aviso de versión nueva.

## 0.3.0: apartado RD, inteligencia local, portada

- Apartado República Dominicana con "Ahora / Después", gustos aprendidos, Inicio según la hora, salud de canales, tema día/noche, portada animada, arranque progresivo, 15,000+ canales.

## 0.2.0: Android TV, inglés, subtituladas y anime

- APK para Android TV / Google TV, contenido en inglés, ~300 películas subtituladas al español y sección Anime.

## 0.1.0: primera versión

- App web para Samsung (Tizen) y LG (webOS): canales en vivo, películas de Pluto e Internet Archive, Continuar viendo y Mi lista.

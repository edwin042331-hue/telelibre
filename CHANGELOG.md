# Cambios

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

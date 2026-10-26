# Cambios

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

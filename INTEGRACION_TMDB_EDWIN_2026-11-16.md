# Catálogo TMDB para Películas Edwin

Fecha: 16 de noviembre de 2026.

## Hallazgo de ingeniería inversa

La APK de BlueStacks `com.mozrelmov.xuper.xupertv` es una app Flutter de descubrimiento. Su binario contiene rutas de la API v3 de TMDB (`/discover/movie`, `/discover/tv`, búsquedas y TV en emisión) y la pantalla observada ofrece un tráiler. Esto explica el catálogo enorme: las fichas se solicitan por páginas a un servicio remoto. No demuestra acceso a películas completas ni una cadencia exacta de 12 horas. El detalle y las capturas están en `ANALISIS_REA_XUPER_BLUESTACKS_2026-11-16.md`.

La credencial de esa APK pertenece a la app ajena. TeleLibre necesita una credencial propia de TMDB: [solicitud desde la cuenta](https://developer.themoviedb.org/docs/getting-started) y [autenticación por token de lectura](https://developer.themoviedb.org/docs/authentication-application). En el repositorio y en los nombres de secretos de GitHub solo se encontraron los secretos de firma de Android; no había `TMDB_READ_TOKEN`.

## Implementación preparada

- `scripts/sync-tmdb.mjs` consulta la API oficial con un token **solo dentro de GitHub Actions**. Publica páginas JSON de hasta 20 fichas en una ruta de versión nueva y escribe el manifiesto únicamente cuando todas las páginas terminaron. Reintenta respuestas 429 y 5xx; una falla conserva el manifiesto anterior sin mezclar páginas de dos versiones.
- Secciones: cine y series populares; cine y series en tendencia; anime de cine y en series filtrado por animación e idioma original japonés. Por defecto se consultan hasta 100 páginas populares por tipo, 25 páginas por sección de anime y 5 de tendencias. `TMDB_CATALOG_PAGES` permite ampliar las secciones populares hasta 500 páginas, máximo de la API. No equivale a **todo** TMDB; los resultados son los más populares de las páginas disponibles.
- El flujo de publicación ejecuta la sincronización en GitHub Pages a las 00:00 y 12:00 UTC y en los demás despliegues. El JSON **no entra en el APK**: el televisor descarga solo la página elegida, y el token nunca llega al bundle ni a la TV. La planificación de GitHub Actions puede demorarse respecto a la hora exacta.
- `src/tmdb.js` acepta solo secciones conocidas y páginas válidas. El módulo Edwin agrega las opciones de TMDB cuando el manifiesto público exista. Las fichas se marcan como **informativas**; el botón busca por ID exacto la disponibilidad en el catálogo reproducible de Edwin. Sin coincidencia no ofrece “Ver ahora”.
- En Ajustes → Acerca de se añadió el logo oficial de TMDB y su aviso de atribución. Se debe conservar conforme a [los requisitos oficiales](https://developer.themoviedb.org/docs/faq). TMDB indica que la API de desarrollador gratuita corresponde a usos no comerciales; para un producto cuyo fin principal es generar ingresos se necesita gestionar la licencia adecuada.

## Estado de activación (17 de noviembre)

Edwin creó la credencial propia de TMDB y la entregó para configurar la integración. `TMDB_READ_TOKEN` quedó guardado como secreto de Actions en `edwin042331-hue/telelibre`; el valor no se escribe en el repositorio, en el APK ni en este informe. La API oficial respondió HTTP 200. Una sincronización local limitada a dos páginas por sección completó las seis secciones; la primera página de películas contiene 20 fichas normalizadas y el JSON generado no contiene marcadores de credenciales.

El primer despliegue del flujo [`CI` 44005573955](https://github.com/edwin042331-hue/telelibre/actions/runs/44005573955) terminó correctamente. El [manifiesto público](https://edwin042331-hue.github.io/telelibre/tmdb/manifest.json) respondió con las seis secciones: 100 páginas de películas, 100 de series, 25 de anime de cine, 25 de anime en series y 5 de cada sección de tendencias. La primera página pública de películas respondió con 20 fichas. Si se desea más profundidad, crear la variable de repositorio `TMDB_CATALOG_PAGES` con un entero de 1 a 500. La clave fue pegada en el chat antes de guardarse en GitHub; conviene regenerarla en TMDB y actualizar el secreto tras la puesta en marcha.

Las opciones TMDB se habilitan cuando la app puede leer el manifiesto público. Edwin conserva la exploración en vivo de PoseidonHD si ese servicio falla. No se instaló nada en la TV.

## Validación local

- `npm test`: 46/46 pruebas aprobadas, incluidas normalización de fichas, escritura de páginas y carga pública sin token.
- `npm run build`: correcto. Vite tardó 6,59 s en la última ejecución; sigue por encima del objetivo de 6 s del traspaso.
- `node scripts/check-es5.mjs`: los tres JavaScript de producción pasaron el análisis ES5.
- Workflow `ci.yml`: sintaxis YAML analizada correctamente.
- El bundle producido no contiene el nombre del secreto ni un token de prueba.
- `node scripts/sync-tmdb.mjs site/tmdb` sin secreto: sale sin publicar un catálogo incompleto. Antes del primer despliegue el manifiesto público devolvía HTTP 404; después respondió correctamente con las seis secciones.

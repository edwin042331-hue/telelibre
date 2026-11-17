# Xuper instalado en BlueStacks: análisis y mejoras aplicadas a Edwin

Fecha: 16 de noviembre de 2026.

## Identidad y método

- ADB de BlueStacks: `C:\Program Files\BlueStacks_nxt\HD-Adb.exe`, dispositivo `emulator-5554`.
- Única app de terceros listada: `com.mozrelmov.xuper.xupertv`, versión 1.0, instalada desde Google Play. La actividad visible era `MainActivity` de ese mismo paquete.
- REA extrajo de forma de solo lectura el APK base y tres splits (es, hdpi y x86_64) a `C:\Users\edwin\tools\rea-cli\xuper-installed\com.mozrelmov.xuper.xupertv\`.
- SHA-256 del `base.apk`: `6964c67a14df837f62c936b2687b13c2670b5f0f58a434f93a3ae6b1be4c2d45`. La evidencia estructurada de JADX está en `C:\Users\edwin\tools\rea-cli\xuper-real-package-evidence.json`.
- El APK `XuperPlayPro.apk` descargado antes era otro producto (`com.iboplayer.pro`); el informe `ANALISIS_REA_XUPERPLAYPRO_2026-11-16.md` lo identifica como candidato incorrecto.

## Qué hace la app observada

La portada muestra la marca **FILME**, una película destacada, pestañas Discover (Trending, Top rated, Now playing, Coming soon), filas de pósteres y navegación Films/Series/Qureka/Quiz/Play. La ficha abierta de *Hope* mostraba nota, año, duración, género, presupuesto, recaudación, sinopsis y botón **Watch Trailer**. Las capturas están en `C:\Users\edwin\tools\rea-cli\xuper-screen-restarted\screen.png` y `C:\Users\edwin\tools\rea-cli\xuper-screen-current\screen.png`.

El split x86_64 contiene `libapp.so` de Flutter. Su inventario de cadenas incluye rutas `api.themoviedb.org/3/discover/movie`, `/discover/tv`, `/search/movie`, `/search/tv`, `/tv/on_the_air`, `image.tmdb.org/t/p/w500` y `w1280`, y un enlace de tráiler YouTube. Esto permite inferir con alta confianza que su catálogo de fichas se alimenta de TMDb. La observación de la UI no demuestra que la app reproduzca películas completas ni que renueve los datos exactamente cada 12 horas. Tampoco se encontró un catálogo de miles de películas empaquetado en sus APKs.

La documentación oficial de TMDb confirma que su API de descubrimiento de [películas](https://developer.themoviedb.org/reference/discover-movie) y [series](https://developer.themoviedb.org/reference/discover-tv) admite páginas y filtros. TMDb requiere una clave propia obtenida desde la cuenta del desarrollador y aceptar sus [condiciones](https://developer.themoviedb.org/docs/getting-started). No se extrajo ni reutilizó la credencial embebida de la app ajena. Las fichas de TMDb son metadatos; no constituyen servidores de video.

Una captura de `dumpsys meminfo` en la portada de esta app Flutter en BlueStacks registró aproximadamente **179 MB PSS** incluyendo WebViews y publicidad. Es una medición puntual del emulador, no una comparación de consumo en Smart TV.

## Mejoras implementadas en TeleLibre

- Edwin expone **Películas en tendencia** y **Series en tendencia** mediante las rutas en vivo que ya usa su proveedor. Ambas respondieron con 24 fichas por página (6 páginas de películas y 5 de series en esta comprobación). La navegación conserva solo la página actual.
- Las fichas remotas aprovechan la puntuación `rate.average` validada dentro de 0 a 10 y convierten la duración de minutos a segundos. Las tarjetas, la portada y el detalle muestran la nota cuando existe; el cero o un valor inválido no se presentan como valoración.
- Se mantienen los pósteres reducidos `w342`, fondos `w780`, secciones permitidas explícitamente y consulta de servidores al abrir el título. No se copió el diseño ni los activos de Xuper.
- No se creó una colección falsa de miles de títulos reproducibles. La disponibilidad de un stream y su idioma se determina con el resolutor de Edwin.
- Se corrigió una inconsistencia de presentación: las filas de series reservaban el alto de tarjetas de canales en vivo aunque mostraban pósteres. Ahora reservan el alto correcto y la tarjeta **Ver todos** conserva el formato de póster, evitando saltos al desplazarse con el control remoto.

## Verificación y límites

- `npm test`: 43 de 43 pruebas aprobadas.
- `npm run build`: correcto. La última compilación, tras corregir la altura de las filas, informó **6,53 s** en Vite (la meta documentada de menos de 6 s **no se cumple**); el comando completo tardó ~13 s. Una ejecución anterior informó 8,70 s en Vite.
- `node scripts/check-es5.mjs`: 3 archivos JS de producción válidos como ES5, cero errores.
- `git diff --check`: sin errores de espacios.
- No se instaló nada en la TV ni se reinició. No hubo prueba de reproducción ni medición de RAM en la TV ocupada.

La fuente en vivo de Edwin es externa y puede cambiar sus rutas, disponibilidad y enlaces de video. Las cifras de páginas son una fotografía del momento, no una promesa de catálogo permanente. La integración directa con TMDb, si se desea en el futuro para metadatos adicionales, necesita una clave propia y distinguir claramente títulos solo informativos de títulos con video disponible.

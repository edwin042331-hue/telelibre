# Análisis estático del APK XuperPlayPro

Fecha: 16 de noviembre de 2026. Herramienta: REA 6.9.0 con JADX headless MCP 0.7.1. No se ejecutó el APK ni se tocó la TV.

## Identidad del archivo

- Archivo analizado: `C:\Users\edwin\Downloads\XuperPlayPro.apk` (27.823.651 bytes).
- SHA-256: `437d76a12e1324fd0534a49013b3a5fca71b20b19d71bf80669b1a271ce39148`.
- `XuperPlayPro (1).apk` tiene el mismo hash: es una copia idéntica.
- Paquete declarado: `com.iboplayer.pro`; versión 4.3; SDK mínimo 21. El código incluye `com.flextv.livestore` y una actividad de arranque `com.andyhax.MainActivity`.
- La firma v1/v2/v3 es internamente consistente. El certificado declara `CN=Android`; esto no prueba que el archivo provenga del desarrollador de la app que el usuario tiene en mente.

## Cómo obtiene y presenta el catálogo

1. `MainActivity.loadingData` selecciona una URL de playlist. Si contiene parámetros de usuario entra en el flujo de portal; si reconoce XUI, usa ese flujo; de lo contrario carga M3U.
2. `APIService` declara respuestas de tipo `List<MovieModel>` para películas y `List<SeriesModel>` para series. El DEX contiene rutas `player_api.php?action=get_vod_streams`, `get_series`, categorías e indicadores de Xtream Codes. El cliente construye Retrofit con la URL del servidor de la playlist. El catálogo depende del servidor y de la playlist, no de una colección completa preinstalada en el APK.
3. El APK contiene 1.713 entradas ZIP y solo un JSON de metadatos de Kotlin; no se observó un archivo de catálogo, una base Realm preincluida ni una lista M3U embebida.
4. `BaseActivity.getVodStreams` y `getSeriesStreams` consultan una base Realm local antes de pedir las listas completas al servidor. `RealmController.getMovieModelsByCategory` devuelve `RealmResults<MovieModel>` filtrados y ordenados: la vista puede consultar por categoría sin crear todas las tarjetas a la vez.
5. Existe una ruta M3U (`BaseActivity.getMovieModels`) que copia todos los resultados Realm de películas a un `ArrayList`, con posible pico de memoria. Las respuestas de portal también se modelan como listas completas. Esto es una inferencia arquitectónica; no se midió la RAM en ejecución.
6. La renovación compara la fecha guardada con `updatePeriod × 72000` segundos. `PreferenceHelper.getSharedPreferenceUpdatePeriod` usa 1 como valor predeterminado, equivalente a **20 horas**. Puede cambiar por configuración; el análisis estático no demuestra que esta instalación actualice cada 12 horas.

## Relación con TeleLibre

Películas Edwin ya permite recorrer páginas remotas de 24 fichas y carga los servidores o episodios al abrir un título. Anime consulta tendencias cuando se visita y renueva sus filas a las 12 horas. Esta arquitectura mantiene acotada la memoria de exploración; la prueba de RAM real en el televisor sigue pendiente. El catálogo del APK analizado no es un archivo transferible a TeleLibre: se forma desde una playlist y su servidor.

## Límites de la conclusión

El nombre del archivo y los textos de marca no certifican que sea la misma aplicación Xuper que el usuario ve. Se analizó estáticamente este hash exacto; no se observó una sesión en BlueStacks, respuesta de red, cuenta, catálogo real ni reproducción. Tampoco se extrajeron credenciales ni se consultaron los servidores del APK.

BlueStacks quedó accesible como `emulator-5554`, pero su configuración actual indica `bst.enable_adb_access="0"`; por eso las consultas ADB dentro de Android devolvieron `error: closed`. No se cambió esa configuración ni se reinició el emulador durante su uso. La observación dinámica queda pendiente hasta poder habilitar ADB y confirmar el paquete instalado.

REA quedó instalado fuera del repositorio, bajo `C:\Users\edwin\tools\rea-cli`, con Node compatible separado bajo `C:\Users\edwin\tools\rea-runtime`. Codex recibió su registro MCP y la guía local. `rea doctor` declaró la integración y JADX listos. El servidor MCP requiere una sesión nueva para aparecer como herramienta en Codex; la CLI ya funciona y se probó también sobre `dist-apk\TeleLibre.apk` sin ejecutarlo.

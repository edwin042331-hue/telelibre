# Películas Edwin: catálogo grande sin cargarlo completo en la TV

Fecha: 16 de noviembre de 2026.

## Hallazgo

El catálogo incluido en la aplicación tiene 441 títulos. La búsqueda en vivo ya permitía encontrar otros títulos, pero no había forma de recorrer el catálogo completo por páginas. La sección Anime mostraba canales y películas de las fuentes habituales, sin una fila de series animadas en tendencia. El sincronizador local limita su recolección y sobrescribe el JSON; no se ejecutó para preservar los títulos y enlaces existentes.

La ficha de Google Play encontrada para Xuper TV describe una aplicación de descubrimiento de películas y tráilers; no ofrece un catálogo exportable y no permite verificar que sea exactamente la aplicación indicada. Por ello no se incorporó ningún dato de Xuper. La ampliación usa el proveedor en vivo que TeleLibre ya consultaba, PoseidonHD.

## Cambios

- Películas Edwin ofrece **Todas las películas**, **Todas las series** y **Anime y animación** desde la barra superior.
- Cada página remota devuelve como máximo 24 fichas. Al pasar a la siguiente se descartan las fichas de la página anterior. La TV no conserva el catálogo remoto entero ni carga temporadas o servidores hasta abrir un título.
- Las fichas usan póster reducido (`w342`) y fondo reducido (`w780`). Los enlaces de imágenes se restringen al servidor de imágenes de TMDb; las rutas del catálogo se validan y las secciones permitidas son explícitas.
- Anime muestra series de animación de las tendencias semanales y películas recientes de animación. La fila de películas incluye **Explorar todo** para recorrer las páginas restantes.
- Las dos filas de Anime se actualizan al entrar a la sección y, si permanece abierta, se revisan cada 30 minutos para renovar los datos cuando cumplen 12 horas. Un fallo de red conserva lo último cargado y permite reintentar luego.
- La búsqueda en vivo reutiliza la ficha liviana y ya no atribuye calidad HD sin haberla comprobado. La pantalla de detalle tampoco promete alta definición cuando la ficha carece de datos de reproducción.
- El paginador muestra estado de carga, página actual y total, navegación anterior/siguiente y reintento en caso de error inicial.

## Comprobaciones

- La fuente en vivo respondió con 24 fichas por página y anunció 801 páginas de películas, 195 de series y 68 de películas de animación. Son cantidades de páginas observadas, sujetas a cambios y a posibles fichas sin video reproducible.
- Las cinco páginas de tendencias semanales tenían 24 series marcadas como animación, entre ellas *One Piece*, *Black Clover* y *Los diarios de la boticaria*. La etiqueta dice **anime y animación** porque también incluye animación occidental.
- La primera película de la página consultada abrió una ficha con ruta válida y se encontraron cinco servidores en inglés. No se hizo una prueba de reproducción en la TV.
- `npm test`: 43/43 pruebas aprobadas.
- `npm run build`: compilación correcta; Vite informó **6,51 s**, por encima de la meta de **menos de 6 s**. El comando completo tardó aproximadamente 13 s por el procesamiento posterior para compatibilidad de TV.
- `node scripts/check-es5.mjs`: los tres archivos JavaScript de producción pasaron ES5, cero errores.
- `git diff --check`: sin errores de espacios.

## Límites y despliegue

El catálogo remoto depende de la disponibilidad y el formato del proveedor. Listar un título no garantiza que tenga servidor compatible ni el audio deseado. La versión web de PC puede tener restricciones CORS; la integración en TV usa las capacidades de las aplicaciones empaquetadas descritas en el proyecto. No se midió RAM real ni reproducción en el televisor ocupado. No se instaló, publicó ni reinició la aplicación de la TV. Estos cambios están en el código local y aún requieren empaquetado e instalación cuando se decida probarlos en el aparato.

No se eliminó ningún archivo ni entrada del catálogo local. El directorio preexistente `dist-apk/` no se tocó.

## Actualización tras identificar la app instalada

Más tarde se habilitó ADB en BlueStacks y se confirmó el paquete instalado `com.mozrelmov.xuper.xupertv`. El análisis de ese paquete, distinto del APK descargado previamente, está en `ANALISIS_REA_XUPER_BLUESTACKS_2026-11-16.md`. Se añadieron accesos a tendencias semanales de películas y series, puntuación y duración verificadas en las fichas remotas. La fuente de reproducción de Edwin sigue siendo la que ya usaba TeleLibre.

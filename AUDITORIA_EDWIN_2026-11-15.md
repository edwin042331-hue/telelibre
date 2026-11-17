# Auditoría de Películas Edwin — 15 de noviembre de 2026

Actualización posterior: las mejoras de recuperación durante la reproducción están documentadas en [MEJORAS_EDWIN_2026-11-16.md](MEJORAS_EDWIN_2026-11-16.md).

## Alcance y criterio

Revisión de los cambios `5575463..3c9cce6`, con prioridad en Películas Edwin: catálogo, búsqueda, ficha, resolución de servidores, audio, progreso, carga en Smart TV y compatibilidad ES5. No se abrió, reinició ni actualizó la app instalada en la TV. El directorio previo `dist-apk/` se dejó intacto.

## Correcciones aplicadas

1. **Películas halladas en vivo:** una ficha con `slug` y sin servidores precargados ahora permite pulsar Ver; el resolutor consulta el detalle al iniciar. La misma condición se usa en la ficha y en `app.playMovie`.
2. **Recuperación y cascada:** `fetchLiveServers` normaliza rutas de películas y episodios, elige los cinco lockers por prioridad antes de consultar `player.php`, y limita esas consultas al host esperado. La prioridad de `scripts/sync-poseidon.mjs` quedó igual que la del resolutor: VidHide, Vidara, StreamWish, VOE, Dood. El respaldo de reproducción intenta primero otro servidor del mismo idioma. Se evita consultar dos veces el detalle cuando la primera consulta en vivo ya falló.
3. **Desempaquetado:** `unpackDeanEdwards` sigue sin ejecutar el script remoto y ahora rechaza tamaños, bases y contadores anómalos para limitar bloqueos por entradas hostiles.
4. **Actualización del catálogo:** un cambio de enlaces se aplica aunque el catálogo siga teniendo el mismo número de títulos. La comparación usa una huella del contenido canónico; no retiene una segunda copia del JSON en memoria ni repinta la TV si solo cambió el formato del archivo.
5. **Búsqueda y continuación:** la búsqueda local ignora acentos, limpia resultados remotos anteriores antes del repintado y también lanza la búsqueda en vivo desde `setQuery`. La fila Continuar Viendo de Edwin muestra solo contenido Poseidon. Un episodio retomado puede recuperar su serie Poseidon aun antes de que termine de cargar la sección general de Series.
6. **Audio y memoria:** una selección de audio fallida ya no modifica anticipadamente el idioma marcado como actual. El reproductor reintenta posicionarse al recibir `canplay`; mantiene la pantalla abierta. Hls.js conserva hasta 60 s de búfer objetivo, con límite de 32 MB y 15 s de retrobúfer en vez de 60 MB y 30 s.
7. **Paquete de TV:** `vite.config.js` compacta únicamente la copia de `poseidon.json` generada en `dist/`. El JSON fuente conserva todos sus datos. Se actualizó el dominio descriptivo del VidHide latino de *La Odisea* al espejo usado por el resolutor.

## Evidencia de validación

| Comprobación | Resultado |
| --- | --- |
| `npm test` | 41/41 pruebas aprobadas; 35 originales y 6 regresiones nuevas. |
| `npm run build` | Correcto; Vite informó 6,16 s y el proceso completo tardó 12,74 s. **No cumple** la meta de menos de 6 s. |
| `node scripts/check-es5.mjs` | 3/3 archivos JavaScript generados aceptados por Acorn en ES5. |
| Catálogo de TV | 1.446.063 → 1.010.796 bytes (30,1 % menos); igualdad exacta de datos tras `JSON.parse`/`JSON.stringify`. |
| JS generado + catálogo | 2.053.953 bytes sin comprimir. La afirmación del traspaso de “menos de 600 KB” no describe este paquete. Hls.js se carga bajo demanda. |
| Prueba en vivo sin TV | *La Odisea* devolvió cinco lockers latinos, HLS VidHide latino y un respaldo Vidara latino. La carga en vivo de *Dexter* devolvió 8 temporadas y 96 episodios únicos. |
| Datos de Dexter | 8/96, 1/10, 1/10, 2/13 y 2/93 temporadas/episodios para las cinco series especificadas. |
| `git diff --check` | Sin errores. |

## Límites y riesgos pendientes

- El episodio 44 de la segunda temporada de *El laboratorio de Dexter* está en el catálogo con `slug`, pero sin servidor. La consulta en vivo tampoco devolvió un enlace. Se conservó el episodio para que pueda recuperarse cuando el proveedor lo publique.
- La recuperación en caliente actúa cuando falla la **resolución** de un locker. Si un HLS se resuelve pero después falla durante la reproducción, el reproductor prueba las URLs de respaldo obtenidas; no vuelve a consultar automáticamente PoseidonHD desde el reproductor. VOE y Dood pueden figurar en la lista, pero sus páginas embed protegidas no equivalen a un stream directo y no se certificó su reproducción.
- La marca de “~200 ms para cualquier serie” no puede certificarse: depende de red y proveedor. La prueba en vivo de *Dexter* tardó aproximadamente 0,5 s en este equipo.
- La prueba ES5 certifica **sintaxis del bundle**, no todas las API del navegador, códecs ni CORS en webOS/Tizen. El reproductor y el cambio de audio se revisaron en código y pruebas de resolutor; falta validación en la TV cuando esté disponible.
- El Android WebView habilita acceso universal desde `file://` para las peticiones entre dominios que utiliza el módulo. Es una superficie de seguridad amplia. Reducirla exige diseñar un intermediario de red compatible con la reproducción antes de cambiar esa configuración.
- El bucle de copia y transformación ES5, junto al paquete completo de Hls.js, explica buena parte del tiempo de compilación. El paquete ligero de Hls.js omite audio alternativo y ciertos códecs; sustituirlo sin pruebas en TV podría reducir compatibilidad.

## Fortalezas comprobadas

- El reproductor nativo tiene prioridad en TV y Hls.js se importa solo cuando se necesita.
- El catálogo local permite inicio sin esperar una consulta externa; la actualización remota corre en segundo plano.
- Las filas materializan hasta 30 tarjetas por fila y cargan imágenes visibles, lo que limita nodos e imágenes en pantalla.
- El resolutor desempaqueta Dean Edwards en memoria sin `eval()` y ahora limita las entradas remotas.

# TeleLibre — Documento Maestro de Traspaso (Handoff de Ingeniería)

Este documento contiene la arquitectura completa, estándares, secretos de ingeniería inversa, infraestructura de streaming y lecciones operativas de **TeleLibre (Películas Edwin)**. Si eres un nuevo agente o ingeniero continuando este proyecto, **lee esto con atención antes de tocar una sola línea de código.**

---

## 1. Visión y Principios del Proyecto

1. **Plataforma:** Aplicación de Smart TV (Android TV / Google TV, webOS y Tizen).
2. **Dispositivo de prueba real:** TCL Google TV conectada en red local vía ADB (`192.168.100.91:5555`, paquete `com.telelibre.tv`).
3. **Restricción de hardware crítica:** Un televisor tiene entre 1.5 y 2.0 GB de RAM.
   - **NUNCA** utilices Puppeteer, Playwright o navegadores headless en la TV ni para resolver streams en tiempo real.
   - **NUNCA** cargues librerías pesadas en el bundle cliente. La app completa pesa **< 600 KB**.
   - Toda la interfaz es JavaScript puro compatible con ES5 (verificado con Acorn mediante `scripts/check-es5.mjs`).

---

## 2. Arquitectura de Streaming y Resolutores (`src/resolvers.js`)

PoseidonHD no aloja los videos en su propio servidor; utiliza servicios de almacenamiento en la nube (*cyberlockers*). TeleLibre implementa un **resolutor en cascada (*Cascade Resolver*)** que extrae el video limpio directamente al reproductor nativo (HLS.js / ExoPlayer) eliminando anuncios, popups y ventanas maliciosas.

### 🏆 1. VidHide (`vidhidepro.com`, `vidhidepre.com`, `callistanise.com`, `filelions.online`)
* **Prioridad:** **1 (Máxima)**. Es el servidor principal del sistema.
* **Calidad:** 1080p Full HD adaptativo (`master.m3u8`).
* **Duración del token:** **36 horas completas** (`e=129600`).
* **Cómo se resuelve:**
  1. Se solicita el endpoint `https://vidhidepre.com/v/{code}` vía HTTP GET liviano.
  2. El HTML contiene un script empaquetado con *Dean Edwards packer* (`eval(function(p,a,c,k,e,d)...)`).
  3. TeleLibre ejecuta la función nativa `unpackDeanEdwards()` en memoria en **0.15 segundos** sin ejecutar código arbitrario.
  4. Extrae la propiedad `hls2` o la URL directa que apunta a `*.acek-cdn.com` o `*.dramiyos-cdn.com`.
  5. Se almacena en caché en memoria por 2 horas.

### 🥈 2. Vidara (`vidara.to`, `97bf1.com`)
* **Prioridad:** 2 (Respaldo).
* **Calidad:** 1080p Full HD adaptativo.
* **Duración del token:** 8 horas.
* **Cómo se resuelve:** POST directo a `https://vidara.to/api/stream` con `{ filecode, device: "web", codecs: [] }` que retorna el objeto `{ streaming_url }`.
* **⚠️ Advertencia / Trampa conocida:** Los servidores de Vidara (`97bf1.com`) sufren congestión nocturna y a veces devuelven fragmentos truncados de 1024 bytes. Por eso `src/resolvers.js` siempre debe priorizar VidHide si ambos están presentes.

### 🥉 3. VOE (`voe.sx`, `cloudwindow-route.com`)
* **Prioridad:** 3 (Respaldo secundario).
* **Calidad:** 720p HD.
* **Duración del token:** **4 horas únicamente** (`e=14400`).
* **Mecanismo de protección:** Protegido por CAPTCHA Altcha PoW.
* **Cómo se decodifica el payload inline:** Mediante `decodeVoePayload(encoded)`:
  `rot13 -> replace @[email protected]~@%?*~!!#& -> atob -> charCode - 3 -> reverse -> atob -> JSON.parse`.

### 4. StreamWish (`streamwish.to`)
* Resuelve mediante llamada GET con redirección a `https://vsembed.com/api/download/get?s={code}&t=720p`.

---

## 3. Buffer y Reproducción sin Cortes (`src/ui/player.js`)

Para evitar que el video se congele con conexión doméstica Wi-Fi, Hls.js está calibrado con búfer anticipado de alta capacidad:

```javascript
hls = new Hls({
  enableWorker: true,
  manifestLoadingTimeOut: 15000,
  fragLoadingTimeOut: 25000,
  backBufferLength: 30,
  maxBufferLength: 60,            // 60 segundos de colchón mínimo
  maxMaxBufferLength: 120,        // Hasta 120 segundos de video precargado
  maxBufferSize: 60 * 1000 * 1000, // 60 MB de RAM de video
  lowLatencyMode: false
});
```

---

## 4. Control Remoto y Búsqueda por Voz

En `platforms/android/app/src/main/java/com/telelibre/tv/MainActivity.java`:
* `KEYCODE_VOICE_ASSIST` (231) y `KEYCODE_ASSIST` (219) capturan el botón del micrófono del control de Google TV.
* Invocan `RecognizerIntent.ACTION_RECOGNIZE_SPEECH` con fallback a `com.google.android.katniss`.
* El texto dictado se inyecta directamente al campo de búsqueda de TeleLibre.

---

## 5. El Catálogo: 2 Capas Complementarias

1. **Capa 1: Precargado Estelar (`public/poseidon.json`):**
   - **419 películas de estreno** (100% verificadas con servidores activos).
   - **18 series completas (162 episodios)** (100% verificadas con reproducción limpia).
   - Carga instantánea a 60 fps en la TV sin esperas de red.
2. **Capa 2: Búsqueda en Vivo (`src/poseidon.js:searchPoseidonLive`):**
   - Si el usuario busca cualquier película o serie que no esté en las precargadas, el motor consulta en vivo `https://www.poseidonhd2.co/search?q={query}`.
   - Al seleccionar un resultado, `fetchLiveServers(slug)` extrae los servidores al vuelo y arranca la reproducción.

---

## 6. Flujo de Compilación y Despliegue

1. **Pruebas unitarias:** `npm test` (deben pasar los 35 tests).
2. **Verificación ES5:** `npm run build && node scripts/check-es5.mjs`.
3. **CI / CD:** Push a `main` dispara `.github/workflows/ci.yml`.
4. **Instalación en la TV:**
   ```powershell
   gh run download <RUN_ID> --name android --dir apk_out
   adb install -r apk_out\TeleLibre.apk
   ```

---

## 7. Regla de Oro para Futuros Agentes / Ingenieros

> [!CAUTION]
> **NUNCA asignes códigos de servidores a ciegas ni copies IDs de otras películas.**
> Cuando actualices o agregues una película, consulta siempre la URL en vivo en `https://www.poseidonhd2.co/pelicula/{slug}`, resuelve el redireccionador `player.php?h=...` y descarga una muestra del segmento de video real (`.ts`) para certificar que el CDN entrega paquetes H.264 válidos a velocidad completa antes de commitear.

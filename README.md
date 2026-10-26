# TeleLibre

App estilo streaming para **Samsung (Tizen)** y **LG (webOS)**. Junta TV en vivo y películas **gratis y legales** que publica la comunidad en GitHub, en una interfaz pensada para el control remoto.

- **~3,500 canales en vivo**: dominicanos, noticias, deportes, novelas, series y cine 24/7, infantiles. Fuentes: [iptv-org](https://github.com/iptv-org/iptv), [Free-TV](https://github.com/Free-TV/IPTV), y Pluto TV y Plex vía [BuddyChewChew/app-m3u-generator](https://github.com/BuddyChewChew/app-m3u-generator).
- **~1,200 películas bajo demanda**: Pluto TV en español vía [OwnerPlugins/pluto-tv-m3u](https://github.com/OwnerPlugins/pluto-tv-m3u), y cine en español y clásicos de dominio público de [Internet Archive](https://archive.org/details/feature_films).
- **Continuar viendo**: guarda dónde quedó cada película cada 5 s, al pausar, al salir y al apagar la TV.
- **Mi lista**, recientes, búsqueda (incluye todo Internet Archive), filas por género y por país, y listas M3U propias.

La app no aloja ningún video. Solo lee listas públicas, igual que un navegador.

## Cómo está armado (y por qué)

| Decisión | Motivo |
|---|---|
| **Una sola base de código web** (HTML/JS, sin framework) | Samsung y LG corren apps web. Una APK **no** se instala en Samsung ni en LG, porque no son Android. Sin framework, la app pesa 71 KB y fluye en TVs de 2016-2018. |
| **El código va dentro de la app instalada** (.wgt / .ipk) y las listas se bajan al abrir | Desde `file://` se reproducen los canales `http://` (18 %), que una web `https` bloquea por contenido mixto. Las listas de canales siempre están frescas sin reinstalar. |
| **Build ES5 con polyfills** (`@vitejs/plugin-legacy`) | Funciona desde webOS 3 / Tizen 3 (Chromium 38-47). |
| **Reproductor nativo primero y hls.js de respaldo** | En la TV el nativo usa aceleración por hardware. Si un canal falla, prueba el otro motor y luego las URLs alternativas del mismo canal. |
| **Caché local de listas (6 h) con copia de emergencia** | Si GitHub o el internet fallan, la app abre con la última copia buena. |
| **Netlify como canal secundario** | Sirve para la PC, el celular o el navegador de la TV, sin instalar nada. Oculta los canales `http`. |

```
src/
  m3u.js, catalog.js   parser M3U y catálogo (puros, con tests)
  sources.js           fuentes de TV en vivo
  vod.js               películas (Internet Archive + Pluto TV)
  store.js             favoritos, recientes, progreso (localStorage)
  platform.js          teclas de Samsung/LG/PC, salida de la app
  ui/                  pantallas, motor de foco del control, reproductor
platforms/             appinfo.json (LG) y config.xml (Samsung)
scripts/               empaquetadores, iconos, smoke test
```

## Desarrollo en la PC

Requisitos: Node 20 o superior (en esta PC: Node 24 vía nvm).

```powershell
cd "D:\iptv para mi tv"
npm install
npm run dev          # abre http://localhost:5173
npm test             # tests del núcleo
node scripts/smoke.mjs   # baja TODAS las fuentes reales y muestra cuántos canales y películas hay
```

Teclas en la PC: flechas, `Enter` (OK), `Esc` o `Backspace` (Atrás), `F` (botón rojo: Mi lista), `G` (verde: subtítulos), `RePág`/`AvPág` (cambiar canal). El ratón también funciona, igual que el puntero del Magic Remote de LG.

En el navegador de la PC algunos canales fallan por CORS (el servidor no deja que una web los lea). En la TV eso no aplica.

## Instalar en LG (webOS)

1. **En la TV:** abre LG Content Store, busca e instala **Developer Mode**. Inicia sesión con una cuenta gratuita de [LG Developer](https://webostv.developer.lge.com) y activa *Dev Mode Status* (la TV se reinicia). Luego activa *Key Server* y anota la **IP** y la **passphrase** que muestra.
2. **En la PC** (una sola vez):
   ```powershell
   cd "D:\iptv para mi tv"
   npx ares-setup-device -a tv -i "host=IP_DE_LA_TV" -i "port=9922" -i "username=prisoner"
   npx ares-novacom --device tv --getkey      # pide la passphrase de la TV
   ```
3. **Empaquetar e instalar:**
   ```powershell
   npm run package:webos
   npx ares-install --device tv release\com.telelibre.tv_0.1.0_all.ipk
   npx ares-launch --device tv com.telelibre.tv
   ```

**Importante:** el Modo Desarrollador de LG tiene un contador. Cuando vence, la TV **borra las apps instaladas así**. Abre la app *Developer Mode* de vez en cuando y presiona **Extend** antes de que llegue a cero. Si se borra, se reinstala con el paso 3 en un minuto. Alternativa gráfica: [webOS Dev Manager](https://github.com/webosbrew/dev-manager-desktop), que tiene un botón *Renew session*.

## Instalar en Samsung (Tizen)

1. **En la TV:** ve a *Apps*, marca **1 2 3 4 5** con el control, activa **Developer mode** y en *Host PC IP* pon la IP de tu PC (`ipconfig`). Reinicia la TV.
2. **En la PC:**
   ```powershell
   npm run package:tizen      # genera release\TeleLibre-0.1.0-unsigned.wgt
   ```
3. Abre [Apps2Samsung](https://github.com/Apps2Samsung/Apps2Samsung/releases) y elige tu TV, luego **Custom WGT** y selecciona el `.wgt`. La primera vez te pide entrar con tu cuenta Samsung en el navegador para crear el certificado. Después firma e instala solo.

**Ruta oficial (alternativa):** instala la extensión *Tizen TV* de Samsung en VS Code y crea un perfil de certificado llamado `TeleLibre`. Luego:
```powershell
$env:TIZEN_CLI = "C:\tizen-studio\tools\ide\bin\tizen.bat"   # ruta de tu instalación
npm run package:tizen      # ahora sale firmado: release\TeleLibre-0.1.0.wgt
sdb connect IP_DE_LA_TV
tizen install -n release\TeleLibre-0.1.0.wgt -t NOMBRE_DEL_DISPOSITIVO
```

En esta PC está activado **Control inteligente de aplicaciones**. Si bloquea algún `.exe` sin firma (Apps2Samsung o `sdb`), **no lo desactives**: no se puede volver a activar sin reinstalar Windows. Usa la otra ruta o instala desde otra computadora.

## Versión web (Netlify)

```powershell
npm run build
npx netlify deploy --prod --dir dist
```

Ábrela en el navegador de la TV, del celular o de la PC. Ahí se ocultan los canales `http` que el navegador bloquea. Las películas de Internet Archive y los canales de Plex funcionan igual. Pluto TV, en cambio, solo permite que su propio sitio lea sus streams, así que en Chrome de PC sus canales y películas suelen fallar. En la app instalada en la TV sí funcionan, porque usa el reproductor nativo.

## Botones del control

| Dónde | Botón | Acción |
|---|---|---|
| Filas | ◀ ▶ ▲ ▼ / OK | Moverse / abrir |
| Filas | ◀ en la primera tarjeta, o Atrás | Abrir el menú |
| Cualquier tarjeta | **● Rojo** | Agregar o quitar de Mi lista |
| En vivo | ▲ ▼ o CH+ CH- | Cambiar de canal |
| Película | OK / ⏯ | Pausa |
| Película | ◀ ▶ (pulsaciones seguidas aceleran: 10 s, 30 s, 60 s) · ⏪ ⏩ | Retroceder / adelantar |
| Película | **● Verde** | Subtítulos (si la película los tiene) |
| Inicio | Atrás dos veces | Salir |

## Agregar más contenido

- **Ajustes → Agregar lista M3U propia**: cualquier lista pública, por ejemplo `https://iptv-org.github.io/iptv/countries/co.m3u` para Colombia.
- **Ajustes**: activa fuentes que vienen apagadas, como Plex España, Pluto USA (en inglés), Pluto Películas México o Samsung TV Plus España (esta solo funciona desde España).
- En código: `BUILTIN_SOURCES` en `src/sources.js` y `VOD_SOURCES` en `src/vod.js`.

## Aviso legal

TeleLibre solo reproduce listas públicas de canales gratuitos que mantiene la comunidad, y películas de dominio público o de servicios gratuitos con anuncios. Si agregas listas propias, que sean de contenido que tienes derecho a ver.

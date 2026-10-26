# TeleLibre

App estilo streaming para **Android TV / Google TV** (TCL, Sony, Philips, Chromecast), **Samsung (Tizen)** y **LG (webOS)**, más una versión web. Junta TV en vivo y películas **gratis y legales** que publica la comunidad en GitHub, en una interfaz pensada para el control remoto.

**Descargas directas** (siempre la última versión):

| TV | Archivo |
|---|---|
| Android TV / Google TV | [TeleLibre.apk](https://edwin042331-hue.github.io/telelibre/TeleLibre.apk) |
| Samsung | [TeleLibre-Samsung.wgt](https://edwin042331-hue.github.io/telelibre/TeleLibre-Samsung.wgt) |
| LG | [TeleLibre-LG.ipk](https://edwin042331-hue.github.io/telelibre/TeleLibre-LG.ipk) |
| Navegador | [edwin042331-hue.github.io/telelibre](https://edwin042331-hue.github.io/telelibre/) |

Contenido:

- **Más de 15,000 canales en vivo**: en español primero, con su propia sección en inglés y otra "Del mundo" por país. Incluye dominicanos, noticias, deportes, novelas, series y cine 24/7, e infantiles. Fuentes: [iptv-org](https://github.com/iptv-org/iptv) (lista en español, en inglés y mundial), [Free-TV](https://github.com/Free-TV/IPTV), [TDTChannels](https://github.com/LaQuay/TDTChannels) (TV abierta de España), y Pluto TV, Samsung TV Plus, Roku y Plex vía [BuddyChewChew/app-m3u-generator](https://github.com/BuddyChewChew/app-m3u-generator).
- **Apartado República Dominicana**: los grandes en orden del dial (Teleantillas, Telemicro, Antena 7, Color Visión, Telesistema…), noticias, deportes, música, cristianos, regionales y todos de la A a la Z. Muestra **qué programa pasa ahora y cuál sigue**, con la guía de [iptv-epg.org](https://iptv-epg.org/guides).
- **Series por episodios** (Pluto TV, ~1,500 series en español): temporadas, episodios con sinopsis, ✓ en los vistos, "Continuar T1:E5" y **siguiente episodio automático** con cuenta regresiva. Arriba van latinas y novelas, luego drama, comedia, anime (Naruto y One Piece por arcos), Nickelodeon, reality y más.
- **Estrenos**: el catálogo de Pluto suma ~2,800 películas con fecha de estreno. La fila "Estrenos: lo más nuevo" las ordena por fecha (en octubre de 2026, la primera es *Amor en el paraíso*, de enero de 2026).
- **Guía de TV tipo cable** (República Dominicana): una cuadrícula de 5 horas con lo que pasa ahora. Con OK se ve el programa, y sobre uno que viene se pone un **recordatorio**: cuando empieza aparece un aviso y con ● Verde se va directo al canal.
- **Sorpréndeme** (menú o ● Amarillo): elige algo según la hora y tus gustos, y solo propone canales que funcionan.
- **Modo infantil con PIN**: solo canales y películas para niños, sin el historial del adulto y con los ajustes bloqueados.
- **Revisión nocturna**: GitHub Actions prueba cada noche unos 3,500 canales en español y la app pone primero los que respondieron. En la TV aparece un aviso cuando hay una versión nueva.
- **Inteligente sin servidores**: todo se calcula en la TV.
  - Aprende tus gustos por el tiempo que ves cada género y te arma filas "Para ti".
  - Reordena Inicio según la hora: noticias en la mañana, novelas en la tarde, películas de noche, deportes el fin de semana.
  - Esconde solos los canales que nunca cargan en tu TV y los salta al cambiar de canal.
  - Cambia a tema claro de día y oscuro de noche.
- **~2,000 películas bajo demanda**: Pluto TV en español y en inglés vía [OwnerPlugins/pluto-tv-m3u](https://github.com/OwnerPlugins/pluto-tv-m3u), **~300 subtituladas al español** (Hitchcock, Fritz Lang, cine negro…), cine argentino y mexicano, y clásicos de dominio público de [Internet Archive](https://archive.org/details/feature_films).
- **Sección Anime**: Naruto, One Piece, Dragon Ball, Los Caballeros del Zodiaco, Death Note, Hunter x Hunter, Pokémon, Yu-Gi-Oh, Crunchyroll, HIDIVE, RetroCrush, Sailor Moon… Son canales 24/7 oficiales y gratuitos que se actualizan a diario, más películas de anime en español y en inglés.
- **Continuar viendo**: guarda dónde quedó cada película cada 5 s, al pausar, al salir y al apagar la TV.
- **Mi lista**, recientes, búsqueda (incluye todo Internet Archive), filas por género y por país, y listas M3U propias. En Ajustes, un solo interruptor quita todo el contenido en inglés; las subtituladas al español se quedan.

La app no aloja ningún video. Solo lee listas públicas, igual que un navegador.

## Cómo está armado (y por qué)

| Decisión | Motivo |
|---|---|
| **Una sola base de código web** (HTML/JS, sin framework) | Samsung y LG corren apps web, y Android TV la abre en un WebView. Sin framework, la app pesa ~75 KB y fluye en TVs de 2016-2018. |
| **Android TV con un proyecto mínimo propio** (`platforms/android`: una Activity, sin dependencias) | El control remoto completo (Atrás, CH+/CH-, multimedia, colores) llega a la app. Abre desde `file://` con acceso universal, así no depende de CORS y se reproducen los canales http. Siempre se firma con la misma llave, para que las actualizaciones se instalen encima. |
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
cd "C:\Users\Edwin Villa\repos\telelibre"
npm install
npm run dev          # abre http://localhost:5173
npm test             # tests del núcleo
node scripts/smoke.mjs   # baja TODAS las fuentes reales y muestra cuántos canales y películas hay
```

Teclas en la PC: flechas, `Enter` (OK), `Esc` o `Backspace` (Atrás), `F` (botón rojo: Mi lista), `G` (verde: subtítulos), `RePág`/`AvPág` (cambiar canal). El ratón también funciona, igual que el puntero del Magic Remote de LG.

En el navegador de la PC algunos canales fallan por CORS (el servidor no deja que una web los lea). En la TV eso no aplica.

> **¿Vas a instalar en las TVs (persona o agente)?** Sigue [docs/INSTALAR-EN-TV.md](docs/INSTALAR-EN-TV.md): identificar cada TV, reglas de la firma e instalación automática por ADB con verificación del certificado.

## Instalar en Android TV / Google TV (TCL y similares)

1. **En la TV:** ve a *Ajustes → Sistema → Información* y presiona 7 veces *Compilación del SO* para activar las opciones de desarrollador.
2. Instala la app **Downloader** (de AFTVnews) desde Google Play en la TV. En *Ajustes → Apps → Seguridad → Fuentes desconocidas*, permite que Downloader instale apps.
3. Abre Downloader, escribe `edwin042331-hue.github.io/telelibre/TeleLibre.apk` y luego presiona *Instalar*.
4. Para actualizar, repite el paso 3: se instala encima y conserva Mi lista y el progreso.

La APK se compila en GitHub Actions (`.github/workflows/ci.yml`). La llave de firma está en la carpeta `.telelibre` de tu usuario de Windows (fuera del repo) y en los *secrets* del repositorio. **No la borres**: sin ella, las versiones nuevas no se pueden instalar encima de la anterior.

## Instalar en LG (webOS)

1. **En la TV:** abre LG Content Store, busca e instala **Developer Mode**. Inicia sesión con una cuenta gratuita de [LG Developer](https://webostv.developer.lge.com) y activa *Dev Mode Status* (la TV se reinicia). Luego activa *Key Server* y anota la **IP** y la **passphrase** que muestra.
2. **En la PC** (una sola vez):
   ```powershell
   cd "C:\Users\Edwin Villa\repos\telelibre"
   npx ares-setup-device -a tv -i "host=IP_DE_LA_TV" -i "port=9922" -i "username=prisoner"
   npx ares-novacom --device tv --getkey      # pide la passphrase de la TV
   ```
3. **Empaquetar e instalar:**
   ```powershell
   npm run package:webos
   npx ares-install --device tv release\com.telelibre.tv_1.0.0_all.ipk
   npx ares-launch --device tv com.telelibre.tv
   ```

**Importante:** el Modo Desarrollador de LG tiene un contador. Cuando vence, la TV **borra las apps instaladas así**. Abre la app *Developer Mode* de vez en cuando y presiona **Extend** antes de que llegue a cero. Si se borra, se reinstala con el paso 3 en un minuto. Alternativa gráfica: [webOS Dev Manager](https://github.com/webosbrew/dev-manager-desktop), que tiene un botón *Renew session*.

## Instalar en Samsung (Tizen)

1. **En la TV:** ve a *Apps*, marca **1 2 3 4 5** con el control, activa **Developer mode** y en *Host PC IP* pon la IP de tu PC (`ipconfig`). Reinicia la TV.
2. **En la PC:**
   ```powershell
   npm run package:tizen      # genera release\TeleLibre-1.0.0-unsigned.wgt
   ```
3. Abre [Apps2Samsung](https://github.com/Apps2Samsung/Apps2Samsung/releases) y elige tu TV, luego **Custom WGT** y selecciona el `.wgt`. La primera vez te pide entrar con tu cuenta Samsung en el navegador para crear el certificado. Después firma e instala solo.

**Ruta oficial (alternativa):** instala la extensión *Tizen TV* de Samsung en VS Code y crea un perfil de certificado llamado `TeleLibre`. Luego:
```powershell
$env:TIZEN_CLI = "C:\tizen-studio\tools\ide\bin\tizen.bat"   # ruta de tu instalación
npm run package:tizen      # ahora sale firmado: release\TeleLibre-1.0.0.wgt
sdb connect IP_DE_LA_TV
tizen install -n release\TeleLibre-1.0.0.wgt -t NOMBRE_DEL_DISPOSITIVO
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

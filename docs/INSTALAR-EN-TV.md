# Instalar TeleLibre en las TVs (guía para quien hace la instalación)

Esta guía es para la persona o el agente que instala TeleLibre en las dos TVs de 55" de Edwin. Síguela en orden y no improvises con la firma.

## Reglas de la firma (Android)

1. **No necesitas la llave de firma.** GitHub Actions compila y firma la APK con los *secrets* del repositorio. Tú solo descargas la APK ya firmada:
   - Última versión: `https://edwin042331-hue.github.io/telelibre/TeleLibre.apk`
   - Versión fija: `https://github.com/edwin042331-hue/telelibre/releases` (archivo `TeleLibre-AndroidTV.apk`)
2. **Verifica la firma antes de instalar.** La huella SHA-256 del certificado tiene que ser exactamente esta:
   `58:28:D1:8F:41:25:EE:B1:D9:84:81:88:E7:EA:15:16:FF:CF:D1:B8:5B:AD:A6:51:A0:4F:06:DA:BF:8D:64:7E`
   El script `scripts/instalar-android-tv.ps1` la comprueba solo y aborta si no coincide.
3. **No compiles la APK localmente ni la firmes con otra llave.** Una APK con otra firma no se instala encima. Habría que desinstalar, y eso borra Mi lista, los gustos y el progreso.
4. **No abras, copies, muevas ni muestres** la carpeta `%USERPROFILE%\.telelibre\`, que contiene `release.keystore` y su contraseña. Es la única copia local de la llave, además de los *secrets* de GitHub. No se sube a ningún lado.

## Paso 0: identificar cada TV

| Lo que ves en la TV | Sistema | Sección |
|---|---|---|
| Google TV o Android TV (TCL 2025, Sony, Philips, Hisense con Google TV) | Android | A |
| Samsung, menú Tizen, *Smart Hub* | Tizen | B |
| LG, menú webOS, *LG Content Store* | webOS | C |
| Roku TV (TCL de EE. UU.) | Roku | No compatible. Usa la versión web en el navegador o un Chromecast con Google TV. |

En la TV: *Ajustes → Sistema → Información* muestra el sistema y la versión. Anota también la **IP de la TV**, que está en *Ajustes → Red*.

## A. Android TV / Google TV (la TCL de 2025)

**En la TV:**
1. Ve a *Ajustes → Sistema → Información* y presiona 7 veces *Compilación del SO* (sale "Ahora eres desarrollador").
2. En *Ajustes → Sistema → Opciones de desarrollador*, activa **Depuración por USB** y, si existe, **Depuración por red** o **Depuración inalámbrica**.

**En la PC** (PowerShell, dentro de `D:\iptv para mi tv`):

```powershell
powershell -ExecutionPolicy Bypass -File scripts\instalar-android-tv.ps1 -TvIp IP_DE_LA_TV
```

La primera vez, la TV muestra "¿Permitir depuración?". Marca *Permitir siempre* y acepta con el control.

El script descarga adb (oficial de Google), descarga la APK, verifica la firma, instala con `-r` (conserva los datos) y abre la app. Termina con `TeleLibre instalada y abierta`.

- **Si la conexión falla:** en algunas Google TV la depuración inalámbrica usa un puerto distinto y un código de emparejamiento. Ese caso se resuelve con `adb pair IP:PUERTO_DE_EMPAREJAMIENTO` usando el código que muestra la TV, y luego se pasa `-Port` con el puerto de conexión.
- **Si no se puede usar ADB:** instala *Downloader* (AFTVnews) desde Google Play. En la TV permítele instalar apps desconocidas y abre `edwin042331-hue.github.io/telelibre/TeleLibre.apk`.

## B. Samsung (Tizen)

1. En la TV: *Apps*, marca **1 2 3 4 5** con el control, activa *Developer mode* y en *Host PC IP* pon la IP de la PC (`ipconfig`). Reinicia la TV.
2. Descarga `https://edwin042331-hue.github.io/telelibre/TeleLibre-Samsung.wgt`.
3. Abre [Apps2Samsung](https://github.com/Apps2Samsung/Apps2Samsung/releases), elige la TV, luego **Custom WGT** y selecciona el `.wgt`. La primera vez pide entrar con la cuenta Samsung de Edwin en el navegador (eso lo hace Edwin) para crear el certificado.

En esta PC está activado **Control inteligente de aplicaciones**. Si bloquea `Apps2Samsung.exe`, **no lo desactives**: no se puede volver a activar sin reinstalar Windows. Avísale a Edwin.

## C. LG (webOS)

1. En la TV: instala *Developer Mode* desde LG Content Store. Inicia sesión con una cuenta LG Developer y activa *Dev Mode Status* y *Key Server*.
2. En la PC, dentro de `D:\iptv para mi tv`:
   ```powershell
   npx ares-setup-device -a tv -i "host=IP_DE_LA_TV" -i "port=9922" -i "username=prisoner"
   npx ares-novacom --device tv --getkey
   curl.exe -L -o TeleLibre-LG.ipk https://edwin042331-hue.github.io/telelibre/TeleLibre-LG.ipk
   npx ares-install --device tv TeleLibre-LG.ipk
   npx ares-launch --device tv com.telelibre.tv
   ```
3. Avísale a Edwin que el Modo Desarrollador de LG caduca: hay que darle *Extend* en la app *Developer Mode* antes de que llegue a cero.

## Comprobar que quedó bien

En cada TV:

1. Abre TeleLibre. Debe salir la portada animada y luego Inicio, en menos de 10 segundos.
2. En el menú abre **República Dominicana** y elige Telemicro o Color Visión. Debe reproducirse y la barra debe decir "Ahora: …".
3. Presiona **Atrás**: vuelve a la lista. Presiona **CH+**: cambia de canal.
4. En **Películas**, abre una de Pluto TV y reprodúcela 1 minuto. Sal y vuelve: debe ofrecer "Reanudar".

Reporta a Edwin, por cada TV: marca, modelo, sistema, cómo se instaló y el resultado de estas 4 comprobaciones.

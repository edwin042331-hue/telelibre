<#
.SYNOPSIS
  Instala (o actualiza) TeleLibre en una TV Android / Google TV por la red, con ADB.

.DESCRIPTION
  1. Descarga las platform-tools oficiales de Google (adb.exe, firmado por Google) si no están.
  2. Descarga la APK firmada desde GitHub Pages (o usa -Apk con una ruta local).
  3. Verifica que la APK esté firmada con la llave de TeleLibre (huella SHA-256 del certificado).
     Si no coincide, NO instala: una APK con otra firma no se puede instalar encima de la anterior.
  4. Conecta a la TV, instala con -r (conserva Mi lista y el progreso) y abre la app.

  No necesita la llave de firma ni su contraseña: la APK ya viene firmada desde GitHub Actions.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\instalar-android-tv.ps1 -TvIp 192.168.1.50
#>
param(
  [Parameter(Mandatory = $true)][string]$TvIp,
  [string]$Apk = '',
  [int]$Port = 5555
)

$ErrorActionPreference = 'Stop'
$ApkUrl = 'https://edwin042331-hue.github.io/telelibre/TeleLibre.apk'
$Package = 'com.telelibre.tv'
# Huella pública del certificado de TeleLibre (no es secreta; sirve para comprobar la firma).
$ExpectedSha256 = '58:28:D1:8F:41:25:EE:B1:D9:84:81:88:E7:EA:15:16:FF:CF:D1:B8:5B:AD:A6:51:A0:4F:06:DA:BF:8D:64:7E'

$work = Join-Path $env:LOCALAPPDATA 'telelibre'
New-Item -ItemType Directory -Force -Path $work | Out-Null

# 1. ADB
$adb = Join-Path $work 'platform-tools\adb.exe'
if (-not (Test-Path $adb)) {
  Write-Host 'Descargando platform-tools de Google...'
  $zip = Join-Path $work 'platform-tools.zip'
  Invoke-WebRequest 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip' -OutFile $zip -UseBasicParsing
  Expand-Archive $zip -DestinationPath $work -Force
  Remove-Item $zip
}

# 2. APK
if (-not $Apk) {
  $Apk = Join-Path $work 'TeleLibre.apk'
  Write-Host "Descargando $ApkUrl ..."
  Invoke-WebRequest $ApkUrl -OutFile $Apk -UseBasicParsing
}
if (-not (Test-Path $Apk)) { throw "No existe la APK: $Apk" }

# 3. Firma
$keytool = (Get-Command keytool -ErrorAction SilentlyContinue).Source
if (-not $keytool -and $env:JAVA_HOME) { $keytool = Join-Path $env:JAVA_HOME 'bin\keytool.exe' }
if ($keytool -and (Test-Path $keytool)) {
  $cert = & $keytool -printcert -jarfile $Apk 2>&1 | Out-String
  if ($cert -notmatch [regex]::Escape($ExpectedSha256)) {
    throw "La APK NO está firmada con la llave de TeleLibre. No se instala. Salida de keytool:`n$cert"
  }
  Write-Host 'Firma verificada: certificado de TeleLibre.' -ForegroundColor Green
} else {
  Write-Warning 'No encontré keytool (Java): no se pudo verificar la firma. Instálalo o define JAVA_HOME para verificarla.'
}

# 4. Instalar
$target = "${TvIp}:$Port"
Write-Host "Conectando a $target (acepta el aviso 'Permitir depuración' en la TV si aparece)..."
& $adb connect $target | Write-Host
& $adb -s $target wait-for-device
$out = & $adb -s $target install -r $Apk 2>&1 | Out-String
Write-Host $out
if ($out -match 'INSTALL_FAILED_UPDATE_INCOMPATIBLE') {
  throw 'La TV tiene una TeleLibre firmada con otra llave. Desinstálala primero (se pierde Mi lista): adb -s ' + $target + ' uninstall ' + $Package
}
if ($out -notmatch 'Success') { throw 'La instalación falló (ver salida arriba).' }

& $adb -s $target shell monkey -p $Package -c android.intent.category.LEANBACK_LAUNCHER 1 | Out-Null
$ver = (& $adb -s $target shell dumpsys package $Package | Select-String 'versionName=' | Select-Object -First 1).ToString().Trim()
Write-Host "TeleLibre instalada y abierta en $target ($ver)." -ForegroundColor Green

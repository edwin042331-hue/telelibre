// Diferencias entre Samsung (Tizen), LG (webOS) y navegador de PC: detección, teclas del control y salida.

function detect() {
  // La app Android (platforms/android) expone este puente nativo.
  if (window.TeleLibreNative) return 'android';
  if (window.tizen) return 'tizen';
  if (window.webOS || window.PalmSystem || /Web0S|webOS/i.test(navigator.userAgent)) return 'webos';
  return 'web';
}

export const platform = detect();
export const isTV = platform !== 'web';

// keyCode -> acción. Tizen y webOS comparten casi todo salvo Atrás y los canales.
const KEYMAP = {
  37: 'left', 38: 'up', 39: 'right', 40: 'down', 13: 'enter',
  10009: 'back', 461: 'back', 27: 'back', 8: 'back',
  427: 'chup', 33: 'chup', 428: 'chdown', 34: 'chdown',
  403: 'red', 70: 'red', 404: 'green', 71: 'green', 405: 'yellow', 406: 'blue',
  10252: 'playpause', 415: 'playpause', 19: 'playpause', 413: 'stop', 417: 'ff', 412: 'rw',
  // Menú / Info / Guía / lista de canales / canal anterior (Samsung y LG; en PC: tecla de menú contextual e I).
  93: 'menu', 18: 'menu', 457: 'info', 73: 'info', 458: 'guide', 10073: 'chlist', 10190: 'recall'
};

// Números del control (0-9 del teclado y del teclado numérico).
for (let d = 0; d <= 9; d++) { KEYMAP[48 + d] = 'd' + d; KEYMAP[96 + d] = 'd' + d; }

export function keyAction(e) {
  return KEYMAP[e.keyCode] || null;
}

// En Tizen las teclas multimedia y de colores no llegan a la app si no se registran.
export function registerKeys() {
  if (platform !== 'tizen') return;
  const names = ['MediaPlayPause', 'MediaPlay', 'MediaPause', 'MediaStop', 'MediaFastForward', 'MediaRewind', 'ChannelUp', 'ChannelDown',
    'ColorF0Red', 'ColorF1Green', 'ColorF2Yellow', 'ColorF3Blue',
    'Info', 'Guide', 'ChannelList', 'PreviousChannel', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  names.forEach(n => {
    try { window.tizen.tvinputdevice.registerKey(n); } catch (e) { /* tecla no disponible en este modelo */ }
  });
}

// Devuelve false si la plataforma no deja cerrar la app (navegador).
export function exitApp() {
  try {
    if (platform === 'tizen') { window.tizen.application.getCurrentApplication().exit(); return true; }
    if (platform === 'webos') { window.close(); return true; }
    if (platform === 'android') { window.TeleLibreNative.exit(); return true; }
  } catch (e) { /* cae al false */ }
  return false;
}

export const platformLabel = { tizen: 'Samsung Tizen', webos: 'LG webOS', android: 'Android TV', web: 'Navegador' }[platform];

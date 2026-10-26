// Datos que publica el propio proyecto en GitHub Pages (CORS abierto):
// - verified.json: canales que respondieron en la revisión nocturna.
// - version.json: última versión publicada, para avisar en la TV que hay actualización.
import { getText } from './net.js';
import { load, save } from './store.js';
import { setVerified } from './smart.js';

const PAGES = 'https://edwin042331-hue.github.io/telelibre/';
const VERIFIED_TTL = 12 * 60 * 60 * 1000;

// En la versión web es el mismo sitio; en las apps de TV (file://) se usa la dirección completa.
function base() {
  const l = window.location;
  return l.protocol === 'https:' && l.hostname.indexOf('github.io') >= 0 ? l.href.replace(/[^/]*$/, '') : PAGES;
}

export function loadVerified() {
  const cached = load('verified', null);
  if (cached) setVerified(cached.keys);
  if (cached && Date.now() - cached.at < VERIFIED_TTL) return Promise.resolve(true);
  return getText(base() + 'verified.json', 20000).then(text => {
    const data = JSON.parse(text);
    setVerified(data.keys);
    save('verified', { at: Date.now(), t: data.t, keys: data.keys });
    return true;
  }, () => !!cached);
}

// "0.10.0" > "0.9.3"
export function isNewer(remote, local) {
  const a = String(remote).split('.').map(n => parseInt(n, 10) || 0);
  const b = String(local).split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0);
  }
  return false;
}

// Devuelve la versión nueva o null.
export function checkUpdate(current) {
  return getText(base() + 'version.json?t=' + Date.now(), 15000).then(text => {
    const v = JSON.parse(text).version;
    return isNewer(v, current) ? v : null;
  }, () => null);
}

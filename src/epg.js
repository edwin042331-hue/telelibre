// Guía de programación (EPG) de los canales dominicanos: "Ahora" y "Después".
// Fuente: iptv-epg.org (XMLTV de ~3 MB, se actualiza cada hora). Del archivo solo se guardan las próximas
// 12 horas, ya resumidas, para que la TV no tenga que volver a procesarlo en cada arranque.
// En la versión web el servidor no permite CORS y la guía simplemente no aparece.
import { getText } from './net.js';
import { load, save } from './store.js';
import { normalizeText } from './catalog.js';

const EPG_URL = 'https://iptv-epg.org/files/epg-do.xml';
const TTL = 3 * 60 * 60 * 1000;
const WINDOW = 12 * 60 * 60 * 1000;

// nombreCompacto -> [[inicioMs, finMs, título], ...] ordenado por inicio
let guide = {};
let names = [];
const matchCache = {};

function compact(s) {
  return normalizeText(s).replace(/^dr\s*-\s*/, '').replace(/[^a-z0-9]/g, '');
}

function decode(s) {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

// "20261025160800 +0000" -> milisegundos UTC
export function parseXmltvTime(stamp, tz) {
  const t = Date.UTC(+stamp.slice(0, 4), +stamp.slice(4, 6) - 1, +stamp.slice(6, 8), +stamp.slice(8, 10), +stamp.slice(10, 12), +stamp.slice(12, 14));
  if (!tz) return t;
  const sign = tz.charAt(0) === '-' ? -1 : 1;
  return t - sign * (+tz.slice(1, 3) * 60 + +tz.slice(3, 5)) * 60000;
}

// Regex en vez de DOMParser: con 3 MB de XML es varias veces más rápido y usa menos memoria en TVs viejas.
export function parseXmltv(xml, now) {
  const idName = {};
  const chRe = /<channel id="([^"]+)"[^>]*>\s*<display-name[^>]*>([^<]+)<\/display-name>/g;
  let m;
  while ((m = chRe.exec(xml))) idName[m[1]] = compact(decode(m[2]));
  const out = {};
  const prRe = /<programme start="(\d{14})(?: ([+-]\d{4}))?" stop="(\d{14})(?: ([+-]\d{4}))?" channel="([^"]+)"[^>]*>([\s\S]*?)<\/programme>/g;
  while ((m = prRe.exec(xml))) {
    const name = idName[m[5]];
    if (!name) continue;
    const start = parseXmltvTime(m[1], m[2]);
    const stop = parseXmltvTime(m[3], m[4]);
    if (stop <= now || start > now + WINDOW) continue;
    const title = /<title[^>]*>([^<]*)<\/title>/.exec(m[6]);
    if (!title) continue;
    (out[name] = out[name] || []).push([start, stop, decode(title[1]).trim()]);
  }
  Object.keys(out).forEach(k => out[k].sort((a, b) => a[0] - b[0]));
  return out;
}

function setGuide(g) {
  guide = g;
  // Los nombres más largos primero: "telemicrointernacional" antes que "telemicro".
  names = Object.keys(g).sort((a, b) => b.length - a.length);
  for (const k in matchCache) delete matchCache[k];
}

export function loadEpg(force) {
  const cached = load('epg:do', null);
  if (cached && !force && Date.now() - cached.t < TTL) { setGuide(cached.guide); return Promise.resolve(true); }
  return getText(EPG_URL, 40000).then(xml => {
    const g = parseXmltv(xml, Date.now());
    setGuide(g);
    save('epg:do', { t: Date.now(), guide: g });
    return true;
  }, () => {
    if (cached) setGuide(cached.guide);
    return false;
  });
}

// En la guía algunos canales usan otro nombre.
const ALIASES = { antena7: 'canal7', antena7hd: 'canal7' };

// Coincidencia exacta, o prefijo de al menos 6 letras que no siga con un número
// ("telemicro" sirve para "Telemicro Canal 5"; "canal7" NO sirve para "Canal 70").
function matches(c, n) {
  if (c === n) return true;
  return n.length >= 6 && c.indexOf(n) === 0 && !/^[0-9]/.test(c.slice(n.length));
}

function guideFor(channel) {
  if (channel.country !== 'do') return null;
  if (matchCache[channel.key] !== undefined) return matchCache[channel.key];
  const raw = compact(channel.name);
  const c = ALIASES[raw] || raw;
  let found = null;
  for (let i = 0; i < names.length; i++) {
    if (matches(c, names[i])) { found = guide[names[i]]; break; }
  }
  matchCache[channel.key] = found;
  return found;
}

// { now: {title, start, stop}, next: {...} } o null si el canal no tiene guía.
export function nowNext(channel, at) {
  const list = guideFor(channel);
  if (!list) return null;
  const t = at || Date.now();
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    if (p[0] <= t && t < p[1]) {
      const n = list[i + 1];
      return { now: { title: p[2], start: p[0], stop: p[1] }, next: n ? { title: n[2], start: n[0], stop: n[1] } : null };
    }
  }
  return null;
}

// Programas de un canal que se cruzan con [from, to), para la guía en cuadrícula.
export function programsFor(channel, from, to) {
  const list = guideFor(channel);
  if (!list) return [];
  return list.filter(p => p[1] > from && p[0] < to).map(p => ({ title: p[2], start: p[0], stop: p[1] }));
}

// Nombre de la guía que le tocó a un canal (para no repetir "Antena 7" y "Antena 7 HD").
export function guideId(channel) {
  const list = guideFor(channel);
  if (!list) return null;
  for (let i = 0; i < names.length; i++) if (guide[names[i]] === list) return names[i];
  return null;
}

// Carga una guía ya procesada (tests y herramientas como scripts/smoke.mjs).
export function useGuide(g) {
  setGuide(g);
}

export function hasGuide() {
  return names.length > 0;
}

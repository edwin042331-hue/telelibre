// Fuentes de canales. Todas son listas públicas mantenidas por la comunidad en GitHub;
// la app no aloja ningún stream, solo lee esas listas.
import { parseM3U } from './m3u.js';
import { toChannel, mergeChannels } from './catalog.js';
import { getText } from './net.js';
import { load, save } from './store.js';

const IPTV_ORG = 'https://iptv-org.github.io/iptv/';
// Listas de servicios gratuitos con anuncios (Pluto TV, Plex, Samsung TV Plus), regeneradas a diario por la comunidad.
const FAST = 'https://raw.githubusercontent.com/BuddyChewChew/app-m3u-generator/main/playlists/';
const CACHE_TTL = 6 * 60 * 60 * 1000;

export const BUILTIN_SOURCES = [
  {
    id: 'iptv-es',
    name: 'iptv-org · Canales en español',
    url: IPTV_ORG + 'languages/spa.m3u',
    home: 'github.com/iptv-org/iptv'
  },
  {
    id: 'iptv-do',
    name: 'iptv-org · República Dominicana',
    url: IPTV_ORG + 'countries/do.m3u',
    home: 'github.com/iptv-org/iptv',
    country: 'do'
  },
  {
    id: 'iptv-movies',
    name: 'iptv-org · Cine 24/7 (varios idiomas)',
    url: IPTV_ORG + 'categories/movies.m3u',
    home: 'github.com/iptv-org/iptv',
    category: 'movies'
  },
  {
    id: 'freetv',
    name: 'Free-TV · Señal abierta hispana',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8',
    home: 'github.com/Free-TV/IPTV',
    groupMode: 'freetv',
    groupFilter: ['Argentina', 'Chile', 'Costa Rica', 'Dominican Republic', 'Mexico', 'Paraguay', 'Peru', 'Spain', 'Venezuela', 'News (ES)']
  },
  { id: 'pluto-mx', name: 'Pluto TV · Latinoamérica', url: FAST + 'plutotv_mx.m3u', home: 'github.com/BuddyChewChew/app-m3u-generator', country: 'mx' },
  { id: 'pluto-es', name: 'Pluto TV · España', url: FAST + 'plutotv_es.m3u', home: 'github.com/BuddyChewChew/app-m3u-generator', country: 'es' },
  { id: 'plex-mx', name: 'Plex · canales gratis (México)', url: FAST + 'plex_mx.m3u', home: 'github.com/BuddyChewChew/app-m3u-generator', country: 'mx', groupMode: 'none', category: 'plex' },
  { id: 'plex-es', name: 'Plex · canales gratis (España)', url: FAST + 'plex_es.m3u', home: 'github.com/BuddyChewChew/app-m3u-generator', country: 'es', groupMode: 'none', category: 'plex', defaultOff: true },
  { id: 'samsung-es', name: 'Samsung TV Plus · España (solo desde España)', url: FAST + 'samsungtvplus_es.m3u', home: 'github.com/BuddyChewChew/app-m3u-generator', country: 'es', defaultOff: true },
  { id: 'pluto-us', name: 'Pluto TV · Estados Unidos (inglés)', url: FAST + 'plutotv_us.m3u', home: 'github.com/BuddyChewChew/app-m3u-generator', country: 'us', defaultOff: true }
];

// Sin preferencia guardada, cada fuente usa su valor por defecto.
export function isSourceOn(source, settings) {
  const v = settings.sources[source.id];
  return v == null ? !source.defaultOff : v;
}

export function activeSources(settings) {
  const builtins = BUILTIN_SOURCES.map(s => Object.assign({}, s, { enabled: isSourceOn(s, settings) }));
  const custom = settings.custom.map(c => Object.assign({ custom: true }, c));
  return builtins.concat(custom);
}

function readCache(id) {
  return load('cache:' + id, null);
}

function loadSource(source, force) {
  const cached = readCache(source.id);
  if (!force && cached && Date.now() - cached.t < CACHE_TTL) {
    return Promise.resolve({ source, channels: cached.channels, fromCache: true });
  }
  return getText(source.url, 30000).then(text => {
    const channels = parseM3U(text).map(e => toChannel(e, source)).filter(Boolean);
    // Si no cabe en localStorage (cuota de ~5 MB) simplemente no se cachea.
    save('cache:' + source.id, { t: Date.now(), channels });
    return { source, channels, fromCache: false };
  }, err => {
    // Sin internet o GitHub caído: se usa la última copia buena aunque esté vieja.
    if (cached) return { source, channels: cached.channels, fromCache: true, stale: true, error: err.message };
    return { source, channels: [], error: err.message };
  });
}

// onProgress(resultadoDeUnaFuente) se llama a medida que cada fuente termina.
export function loadSources(sources, opts) {
  const enabled = sources.filter(s => s.enabled);
  const tasks = enabled.map(s => loadSource(s, opts && opts.force).then(r => {
    if (opts && opts.onProgress) opts.onProgress(r);
    return r;
  }));
  return Promise.all(tasks).then(results => ({
    results,
    channels: mergeChannels(results.map(r => r.channels))
  }));
}

// Fichas informativas de TMDB publicadas por TeleLibre. La TV nunca recibe la clave API.
import { getText } from './net.js';

const ROOT = 'https://edwin042331-hue.github.io/telelibre/tmdb/';

export const TMDB_SECTIONS = [
  { id: 'tendencias-peliculas', title: '🎬 Cine en tendencia · TMDB' },
  { id: 'tendencias-series', title: '📈 Series en tendencia · TMDB' },
  { id: 'peliculas', title: '🌍 Cine popular · TMDB' },
  { id: 'series', title: '🌍 Series populares · TMDB' },
  { id: 'anime-peliculas', title: '🎌 Anime de cine · TMDB' },
  { id: 'anime-series', title: '🎌 Anime en series · TMDB' }
];

let manifestPromise = null;
let manifestFetchedAt = 0;

export function loadTmdbManifest() {
  if (manifestPromise && Date.now() - manifestFetchedAt < 15 * 60 * 1000) return manifestPromise;
  manifestFetchedAt = Date.now();
  manifestPromise = getText(ROOT + 'manifest.json?t=' + Math.floor(manifestFetchedAt / (15 * 60 * 1000)), 5000).then(text => {
    const data = JSON.parse(text);
    if (!data || data.version !== 1 || !data.sections || !/^[a-z0-9]+$/.test(data.snapshot || '')) throw new Error('Manifiesto TMDB inválido');
    return data;
  }).catch(() => {
    return null;
  });
  return manifestPromise;
}

export function loadTmdbBrowsePage(section, page) {
  if (!TMDB_SECTIONS.some(entry => entry.id === section)) return Promise.reject(new Error('Sección TMDB no admitida'));
  const n = Number(page || 1);
  if (Math.floor(n) !== n || n < 1 || n > 500) return Promise.reject(new Error('Página TMDB no válida'));
  return loadTmdbManifest().then(manifest => {
    const info = manifest && manifest.sections[section];
    if (!info || Math.floor(info.pages) !== info.pages || n > info.pages) throw new Error('Catálogo TMDB no disponible');
    return getText(ROOT + manifest.snapshot + '/' + section + '/' + n + '.json', 7000).then(text => {
      const data = JSON.parse(text);
      if (!data || data.page !== n || !Array.isArray(data.items)) throw new Error('Página TMDB inválida');
      const items = data.items.filter(item => item && item.src === 'tmdb' &&
        (item.type === 'movie' || item.type === 'series') && Math.floor(item.tmdbId) === item.tmdbId && item.tmdbId > 0);
      return { page: n, totalPages: info.pages, items: items.slice(0, 20) };
    });
  });
}

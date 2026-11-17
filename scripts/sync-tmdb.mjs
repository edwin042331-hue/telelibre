// Instantáneas paginadas de TMDB para GitHub Pages. La credencial solo vive en Actions.
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const SECTIONS = [
  { id: 'peliculas', title: 'Cine popular · TMDB', path: '/discover/movie', type: 'movie', limit: 500 },
  { id: 'series', title: 'Series populares · TMDB', path: '/discover/tv', type: 'series', limit: 500 },
  { id: 'anime-peliculas', title: 'Anime de cine · TMDB', path: '/discover/movie', type: 'movie', limit: 25, anime: true },
  { id: 'anime-series', title: 'Anime en series · TMDB', path: '/discover/tv', type: 'series', limit: 25, anime: true },
  { id: 'tendencias-peliculas', title: 'Cine en tendencia · TMDB', path: '/trending/movie/week', type: 'movie', limit: 5 },
  { id: 'tendencias-series', title: 'Series en tendencia · TMDB', path: '/trending/tv/week', type: 'series', limit: 5 }
];

function image(path, size) {
  return typeof path === 'string' && /^\/[A-Za-z0-9._-]+$/.test(path)
    ? 'https://image.tmdb.org/t/p/' + size + path : '';
}

export function normalizeTmdbItem(raw, type) {
  const id = Number(raw && raw.id);
  const name = String(raw && (type === 'series' ? raw.name : raw.title) || '').trim();
  if (!Number.isSafeInteger(id) || id < 1 || !name || raw.adult === true) return null;
  const rating = Number(raw.vote_average);
  const year = Number(String(type === 'series' ? raw.first_air_date || '' : raw.release_date || '').slice(0, 4));
  return {
    key: 'tmdb:' + (type === 'series' ? 'serie:' : '') + id,
    tmdbId: id,
    type,
    src: 'tmdb',
    name: name.slice(0, 120),
    originalName: String(type === 'series' ? raw.original_name || '' : raw.original_title || '').slice(0, 120),
    year: Number.isInteger(year) && year >= 1870 && year <= 2100 ? year : 0,
    rating: Number.isFinite(rating) && rating > 0 && rating <= 10 ? Math.round(rating * 10) / 10 : 0,
    poster: image(raw.poster_path, 'w342'),
    art: image(raw.backdrop_path, 'w780'),
    overview: String(raw.overview || '').slice(0, 600)
  };
}

function query(section, page) {
  const url = new URL('https://api.themoviedb.org/3' + section.path);
  url.searchParams.set('page', String(page));
  url.searchParams.set('language', 'es-MX');
  if (section.path.indexOf('/discover/') === 0) {
    url.searchParams.set('sort_by', 'popularity.desc');
    url.searchParams.set('include_adult', 'false');
  }
  if (section.anime) {
    url.searchParams.set('with_genres', '16');
    url.searchParams.set('with_original_language', 'ja');
  }
  return url;
}

async function requestPage(section, page, token, fetchImpl) {
  const url = query(section, page);
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetchImpl(url, {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
      signal: AbortSignal.timeout(12000)
    });
    if (res.status === 429 || res.status >= 500) {
      if (attempt === 2) throw new Error('TMDB respondió HTTP ' + res.status + ' en ' + section.id + '/' + page);
      const seconds = Number(res.headers && res.headers.get('retry-after'));
      await new Promise(resolve => setTimeout(resolve, Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, 10) * 1000 : (attempt + 1) * 1200));
      continue;
    }
    if (!res.ok) throw new Error('TMDB respondió HTTP ' + res.status + ' en ' + section.id + '/' + page);
    const body = await res.json();
    if (!body || !Array.isArray(body.results) || !Number.isInteger(body.total_pages)) {
      throw new Error('Respuesta TMDB inválida en ' + section.id + '/' + page);
    }
    return body;
  }
}

export async function syncTmdb({ token, outDir, fetchImpl = fetch, sections = SECTIONS, maxPages = 100 }) {
  if (!token || !outDir) throw new Error('Faltan TMDB_READ_TOKEN o directorio de salida');
  const sectionsDone = {};
  const snapshot = Date.now().toString(36);
  for (const section of sections) {
    const first = await requestPage(section, 1, token, fetchImpl);
    const pages = Math.min(first.total_pages, section.limit, Math.floor(maxPages), 500);
    if (pages < 1) continue;
    const dir = join(outDir, snapshot, section.id);
    await mkdir(dir, { recursive: true });
    async function save(page, body) {
      const items = body.results.map(item => normalizeTmdbItem(item, section.type)).filter(Boolean).slice(0, 20);
      await writeFile(join(dir, page + '.json'), JSON.stringify({ page, totalPages: pages, items }));
    }
    await save(1, first);
    // Lotes pequeños para respetar los límites del servicio y no cargar la TV.
    for (let start = 2; start <= pages; start += 6) {
      const batch = [];
      for (let page = start; page < Math.min(start + 6, pages + 1); page++) {
        batch.push(requestPage(section, page, token, fetchImpl).then(body => save(page, body)));
      }
      await Promise.all(batch);
      if (start + 6 <= pages) await new Promise(resolve => setTimeout(resolve, 350));
    }
    sectionsDone[section.id] = { title: section.title, pages };
    console.log(section.id + ': ' + pages + ' páginas');
  }
  const manifest = { version: 1, updatedAt: new Date().toISOString(), snapshot, sections: sectionsDone };
  await mkdir(outDir, { recursive: true });
  // El manifiesto se escribe al final: nunca anuncia páginas incompletas.
  await writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifest));
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const token = process.env.TMDB_READ_TOKEN;
  if (!token) {
    console.log('TMDB_READ_TOKEN no configurado: catálogo TMDB opcional sin publicar.');
  } else {
    const outDir = process.argv[2] || 'site/tmdb';
    const maxPages = Math.max(1, Math.min(500, Math.floor(Number(process.env.TMDB_CATALOG_PAGES) || 100)));
    syncTmdb({ token, outDir, maxPages }).catch(error => { console.error(error.message); process.exitCode = 1; });
  }
}

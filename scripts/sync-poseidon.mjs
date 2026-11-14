// Sincronizador masivo de catálogo PoseidonHD hacia public/poseidon.json
// Extrae:
// 1. TODOS los estrenos 2026 de las primeras 15 páginas.
// 2. Sagas icónicas (Spider-Man, Marvel, Batman).
// 3. Series de PoseidonHD con temporadas y episodios.
// 4. Soporte multi-idioma (Latino, Castellano, Inglés / Sub) y multi-servidor (Vidara, StreamWish, Dood, Voe).

import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://www.poseidonhd2.co';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

const GENRE_MAP = {
  'acción': 'accion', 'accion': 'accion', 'action': 'accion',
  'comedia': 'comedia', 'comedy': 'comedia',
  'terror': 'terror', 'horror': 'terror',
  'ciencia ficción': 'scifi', 'ciencia ficcion': 'scifi', 'sci-fi': 'scifi',
  'aventura': 'aventura', 'adventure': 'aventura',
  'drama': 'drama',
  'animación': 'animacion', 'animacion': 'animacion', 'animation': 'animacion',
  'familia': 'familia', 'family': 'familia',
  'crimen': 'crimen', 'crime': 'crimen',
  'misterio': 'suspenso', 'suspenso': 'suspenso', 'thriller': 'suspenso',
  'fantasía': 'scifi', 'fantasia': 'scifi', 'fantasy': 'scifi',
  'romance': 'romance',
  'bélica': 'guerra', 'belica': 'guerra', 'war': 'guerra',
  'historia': 'historia', 'history': 'historia',
  'música': 'musical', 'musica': 'musical', 'music': 'musical'
};

async function fetchJson(url) {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('No __NEXT_DATA__');
  return JSON.parse(match[1]);
}

const embedCache = new Map();

async function extractEmbed(playerUrl) {
  if (!playerUrl) return null;
  if (embedCache.has(playerUrl)) return embedCache.get(playerUrl);
  try {
    const res = await fetch(playerUrl, { headers: HEADERS, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/var\s+url\s*=\s*['"]([^'"]+)['"]/);
    const result = match ? match[1] : null;
    embedCache.set(playerUrl, result);
    return result;
  } catch (e) {
    return null;
  }
}

function parseStreamTarget(embedUrl) {
  if (!embedUrl) return null;
  if (embedUrl.includes('vidara.to/e/')) {
    return { type: 'vidara', code: embedUrl.split('/e/')[1], url: embedUrl };
  }
  if (embedUrl.includes('streamwish')) {
    const parts = embedUrl.split('/e/');
    return { type: 'streamwish', code: parts[1] || embedUrl, url: embedUrl };
  }
  if (embedUrl.includes('dood')) {
    return { type: 'dood', url: embedUrl };
  }
  if (embedUrl.includes('voe.sx')) {
    return { type: 'voe', url: embedUrl };
  }
  return { type: 'direct', url: embedUrl };
}

async function pMap(items, fn, concurrency = 8) {
  const results = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      try {
        results[i] = await fn(items[i], i);
      } catch (e) {
        results[i] = null;
      }
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function processMovie(m) {
  if (!m || !m.url || !m.url.slug) return null;
  const slug = m.url.slug.replace(/^movies\//, '');
  const detUrl = `${BASE}/pelicula/${slug}`;

  try {
    const detData = await fetchJson(detUrl);
    const tm = detData.props?.pageProps?.thisMovie || {};
    const vids = tm.videos || {};

    const languages = [];
    const servers = {};

    // Mapear idiomas: latino, spanish (castellano), english, subtitulado
    const langKeys = ['latino', 'spanish', 'subtitulado', 'english'];
    const CYBER_PRIORITY = { vidara: 1, streamwish: 2, doodstream: 3, voesx: 4, vidhide: 5 };

    for (const lk of langKeys) {
      const streamList = (vids[lk] || []).slice();
      if (!streamList.length) continue;

      // Ordenar por calidad y estabilidad: Vidara (HLS) > StreamWish (MP4) > Doodstream > VOE
      streamList.sort((a, b) => (CYBER_PRIORITY[a.cyberlocker] || 99) - (CYBER_PRIORITY[b.cyberlocker] || 99));

      const serverList = [];
      for (const s of streamList.slice(0, 4)) { // Mejores 4 servidores por idioma
        const embed = await extractEmbed(s.result);
        const parsed = parseStreamTarget(embed);
        if (parsed) {
          serverList.push({
            type: parsed.type,
            code: parsed.code || '',
            url: parsed.url || '',
            cyberlocker: s.cyberlocker,
            quality: s.quality || 'HD'
          });
        }
      }

      if (serverList.length) {
        const normLang = lk === 'spanish' ? 'castellano' : lk;
        if (!languages.includes(normLang)) languages.push(normLang);
        servers[normLang] = serverList;
      }
    }

    // Si no tiene servidores activos
    if (!languages.length) return null;

    // Detectar calidad general: si alguno es HD -> HD, sino CAM
    const allParsedServers = Object.values(servers).flat();
    const hasHd = allParsedServers.some(s => (s.quality || '').toUpperCase() === 'HD');
    const quality = hasHd ? 'HD' : 'CAM';

    // Stream primario por defecto: preferir Vidara en latino, o el primer servidor disponible
    const primaryCandidate = (servers['latino'] || allParsedServers).find(s => s.type === 'vidara') ||
                             (servers['latino'] || allParsedServers)[0];

    let streamTarget = '';
    if (primaryCandidate.type === 'vidara') streamTarget = 'vidara:' + primaryCandidate.code;
    else if (primaryCandidate.type === 'streamwish') streamTarget = 'streamwish:' + primaryCandidate.code;
    else if (primaryCandidate.type === 'dood') streamTarget = 'dood:' + primaryCandidate.url;
    else streamTarget = primaryCandidate.url;

    const year = parseInt((m.releaseDate || tm.releaseDate || '').slice(0, 4), 10) || 2024;
    const rawGenres = tm.genres || m.genres || [];
    const genres = [];
    rawGenres.forEach(g => {
      const name = (g.name || g.slug || '').toLowerCase();
      const mapped = GENRE_MAP[name];
      if (mapped && !genres.includes(mapped)) genres.push(mapped);
    });
    if (!genres.length) genres.push('accion');

    const poster = (tm.images && tm.images.poster) || (m.images && m.images.poster) || '';
    const art = (tm.images && tm.images.backdrop) || (m.images && m.images.backdrop) || poster;
    const runtime = (tm.runtime || m.runtime || 105) * 60;
    const overview = tm.overview || m.overview || '';

    return {
      key: `poseidon:${m.TMDbId}`,
      type: 'movie',
      name: tm.titles?.name || m.titles?.name || 'Película',
      year,
      quality,
      runtime,
      duration: runtime,
      genres,
      regions: [],
      subs: languages.includes('subtitulado') || languages.includes('english'),
      languages,
      servers,
      poster,
      art,
      img: poster,
      overview,
      summary: overview,
      src: 'poseidon',
      stream: streamTarget,
      url: streamTarget,
      lang: 'es'
    };
  } catch (e) {
    return null;
  }
}

async function processSerie(s) {
  if (!s || !s.url || !s.url.slug) return null;
  const slug = s.url.slug.replace(/^series\//, '');
  const detUrl = `${BASE}/serie/${slug}`;

  try {
    const detData = await fetchJson(detUrl);
    const ts = detData.props?.pageProps?.thisSerie || {};
    const seasonsRaw = ts.seasons || [];
    if (!seasonsRaw.length) return null;

    const seasons = [];
    for (const sz of seasonsRaw.slice(0, 3)) { // Primeras 3 temporadas
      const episodes = [];
      const epList = sz.episodes || [];
      for (const ep of epList.slice(0, 15)) { // Primeros 15 episodios por temporada
        const epSlug = ep.url?.slug || '';
        // Cargar servidores del episodio
        let epServers = {};
        let epLangs = ['latino'];
        let epStream = '';

        if (epSlug) {
          try {
            const epUrl = `${BASE}/${epSlug.replace(/^series\//, 'serie/')}`;
            const epData = await fetchJson(epUrl);
            const epObj = epData.props?.pageProps?.episode || {};
            const vids = epObj.videos || {};
            const CYBER_PRIORITY = { vidara: 1, streamwish: 2, doodstream: 3, voesx: 4, vidhide: 5 };
            for (const lk of ['latino', 'spanish', 'english']) {
              const list = (vids[lk] || []).slice();
              if (list.length) {
                list.sort((a, b) => (CYBER_PRIORITY[a.cyberlocker] || 99) - (CYBER_PRIORITY[b.cyberlocker] || 99));
                const sList = [];
                for (const sv of list.slice(0, 3)) {
                  const embed = await extractEmbed(sv.result);
                  const parsed = parseStreamTarget(embed);
                  if (parsed) sList.push(parsed);
                }
                if (sList.length) {
                  const nLang = lk === 'spanish' ? 'castellano' : lk;
                  epServers[nLang] = sList;
                  if (!epLangs.includes(nLang)) epLangs.push(nLang);
                }
              }
            }
            const prim = (epServers['latino'] || Object.values(epServers)[0] || [])[0];
            if (prim) {
              epStream = prim.type === 'vidara' ? 'vidara:' + prim.code : (prim.url || '');
            }
          } catch (e) { /* fallback */ }
        }

        episodes.push({
          type: 'episode',
          key: `poseidon:ep:${ep.TMDbId || ep.number}`,
          seriesKey: `poseidon:serie:${s.TMDbId}`,
          seriesName: ts.titles?.name || s.titles?.name,
          season: sz.number || 1,
          number: ep.number || 1,
          title: ep.title || `Episodio ${ep.number}`,
          name: `${ts.titles?.name || s.titles?.name} · T${sz.number || 1}:E${ep.number || 1}`,
          description: ep.description || '',
          runtime: (ep.runtime || 45) * 60,
          poster: ep.image || s.images?.poster || '',
          art: s.images?.backdrop || ep.image || '',
          src: 'poseidon',
          languages: epLangs,
          servers: epServers,
          stream: epStream,
          url: epStream
        });
      }

      if (episodes.length) {
        seasons.push({
          number: sz.number || 1,
          episodes
        });
      }
    }

    if (!seasons.length) return null;

    const poster = (ts.images && ts.images.poster) || (s.images && s.images.poster) || '';
    const art = (ts.images && ts.images.backdrop) || (s.images && s.images.backdrop) || poster;
    const year = parseInt((s.releaseDate || ts.releaseDate || '').slice(0, 4), 10) || 2025;

    return {
      key: `poseidon:serie:${s.TMDbId}`,
      type: 'series',
      src: 'poseidon',
      name: ts.titles?.name || s.titles?.name,
      year,
      poster,
      art,
      img: poster,
      genre: 'Series',
      genres: ['series'],
      summary: ts.overview || s.overview || '',
      overview: ts.overview || s.overview || '',
      seasonsCount: seasons.length,
      seasons
    };
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('=== SINCRONIZADOR MASIVO POSEIDON (EDWIN TELELIBRE) ===');
  const seenKeys = new Set();
  const rawMovies = [];

  // 1. Recolectar estrenos de las páginas 1 a 15 de /peliculas
  console.log('Fase 1: Recolectando catálogo de películas (Páginas 1 a 15)...');
  for (let page = 1; page <= 15; page++) {
    const url = page === 1 ? `${BASE}/peliculas` : `${BASE}/peliculas/page/${page}`;
    try {
      const data = await fetchJson(url);
      const pp = data.props?.pageProps || {};
      const list = (pp.movies || []).concat(pp.topMoviesDay || []).concat(pp.topMoviesWeek || []);
      let added = 0;
      for (const m of list) {
        if (!m || !m.TMDbId || seenKeys.has('m:' + m.TMDbId)) continue;
        seenKeys.add('m:' + m.TMDbId);
        rawMovies.push(m);
        added++;
      }
      process.stdout.write(`  Página ${page}: +${added} películas (Total acumulado: ${rawMovies.length})\n`);
    } catch (e) {
      console.warn(`  Error en página ${page}: ${e.message}`);
    }
  }

  // 2. Recolectar sagas clave (Spider-Man, Avengers, Batman)
  console.log('\nFase 2: Buscando sagas y superhéroes clave...');
  const searchQueries = ['spider', 'avengers', 'batman', 'deadpool'];
  for (const q of searchQueries) {
    try {
      const data = await fetchJson(`${BASE}/search?q=${encodeURIComponent(q)}`);
      const list = data.props?.pageProps?.movies || [];
      let count = 0;
      for (const m of list) {
        if (!m || !m.TMDbId || seenKeys.has('m:' + m.TMDbId)) continue;
        seenKeys.add('m:' + m.TMDbId);
        rawMovies.push(m);
        count++;
      }
      console.log(`  Búsqueda "${q}": +${count} títulos agregados.`);
    } catch (e) {
      console.warn(`  Error en búsqueda "${q}": ${e.message}`);
    }
  }

  // Priorizar películas: todas las de 2026 primero, luego sagas y mejores de 2025/2024
  rawMovies.sort((a, b) => {
    const ya = parseInt((a.releaseDate || '').slice(0, 4), 10) || 0;
    const yb = parseInt((b.releaseDate || '').slice(0, 4), 10) || 0;
    return yb - ya;
  });

  const count2026 = rawMovies.filter(m => (m.releaseDate || '').startsWith('2026')).length;
  console.log(`\nPelículas en cola: ${rawMovies.length} títulos (${count2026} de 2026).`);
  console.log('Fase 3: Procesando servidores multi-idioma con 8 trabajadores concurrentes...');

  let doneCount = 0;
  const processedMovies = [];
  await pMap(rawMovies, async (m) => {
    const pm = await processMovie(m);
    doneCount++;
    if (pm) {
      processedMovies.push(pm);
      if (doneCount % 10 === 0 || doneCount === rawMovies.length) {
        process.stdout.write(`  [${doneCount}/${rawMovies.length}] Procesadas: ${processedMovies.length} OK\n`);
      }
    }
  }, 8);

  console.log(`\nPelículas procesadas con éxito: ${processedMovies.length}`);
  const final2026 = processedMovies.filter(m => m.year === 2026).length;
  const finalHD = processedMovies.filter(m => m.quality === 'HD').length;
  const finalCAM = processedMovies.filter(m => m.quality === 'CAM').length;
  console.log(`Estadísticas películas: ${final2026} de 2026 · ${finalHD} en HD 1080p · ${finalCAM} en CAM`);

  // 3. Recolectar series populares
  console.log('\nFase 4: Recolectando series populares de PoseidonHD...');
  const rawSeries = [];
  try {
    const seriesHome = await fetchJson(`${BASE}/series`);
    const pp = seriesHome.props?.pageProps || {};
    const slist = (pp.series || []).concat(pp.topSeriesWeek || []).concat(pp.topSeriesDay || []);
    for (const s of slist) {
      if (!s || !s.TMDbId || seenKeys.has('s:' + s.TMDbId)) continue;
      seenKeys.add('s:' + s.TMDbId);
      rawSeries.push(s);
    }
  } catch (e) {
    console.warn(`Error al cargar lista de series: ${e.message}`);
  }

  console.log(`Series en cola: ${rawSeries.length}. Procesando temporadas y episodios...`);
  const processedSeries = [];
  for (const s of rawSeries.slice(0, 8)) {
    const ps = await processSerie(s);
    if (ps) {
      processedSeries.push(ps);
      console.log(`  Serie: ${ps.name} (${ps.seasonsCount} temporadas, ${ps.seasons.reduce((a, x) => a + x.episodes.length, 0)} episodios) OK`);
    }
  }

  // 4. Guardar catálogo combinado (Películas + Series)
  const fullCatalog = [...processedMovies, ...processedSeries];
  const outPath = path.resolve('public/poseidon.json');
  fs.writeFileSync(outPath, JSON.stringify(fullCatalog, null, 2), 'utf8');
  console.log(`\n✓ Catálogo completo guardado en: ${outPath} (${fullCatalog.length} elementos)`);
}

main().catch(console.error);

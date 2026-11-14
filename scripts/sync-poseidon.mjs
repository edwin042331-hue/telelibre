// Sincronizador de catálogo de PoseidonHD hacia public/poseidon.json
// Extrae títulos, sinopsis, año, calidad (HD/CAM), géneros y servidores de reproducción.

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
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('No __NEXT_DATA__');
  return JSON.parse(match[1]);
}

async function extractEmbed(playerUrl) {
  try {
    const res = await fetch(playerUrl, { headers: HEADERS });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/var\s+url\s*=\s*['"]([^'"]+)['"]/);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('--- Iniciando sincronización de catálogo PoseidonHD ---');
  const seenKeys = new Set();
  const rawCatalog = [];

  // Recolectar de las primeras 4 páginas del catálogo de películas
  for (let page = 1; page <= 4; page++) {
    const url = page === 1 ? `${BASE}/peliculas` : `${BASE}/peliculas/page/${page}`;
    try {
      console.log(`Descargando página ${page}...`);
      const data = await fetchJson(url);
      const pp = data.props.pageProps || {};
      const list = (pp.movies || []).concat(pp.topMoviesDay || []).concat(pp.topMoviesWeek || []);
      for (const m of list) {
        if (!m || !m.TMDbId || seenKeys.has(m.TMDbId)) continue;
        seenKeys.add(m.TMDbId);
        rawCatalog.push(m);
      }
    } catch (e) {
      console.warn(`Error en página ${page}: ${e.message}`);
    }
  }

  console.log(`Recolectadas ${rawCatalog.length} películas únicas. Procesando detalles y servidores...`);

  const processedMovies = [];
  let count = 0;

  for (const m of rawCatalog) {
    count++;
    if (!m.url || !m.url.slug) continue;
    const slug = m.url.slug.replace(/^movies\//, '');
    const detUrl = `${BASE}/pelicula/${slug}`;

    try {
      const detData = await fetchJson(detUrl);
      const tm = detData.props.pageProps.thisMovie || {};
      const vids = tm.videos || {};
      const allStreams = (vids.latino || [])
        .concat(vids.spanish || [])
        .concat(vids.subtitulado || [])
        .concat(vids.english || []);

      if (!allStreams.length) {
        // Si no tiene servidores registrados, continuar
        continue;
      }

      // Evaluar calidad real disponible
      const hasHd = allStreams.some(s => (s.quality || '').toUpperCase() === 'HD');
      const quality = hasHd ? 'HD' : 'CAM';

      // Priorizar servidor: Vidara (HLS adaptive sin ads) > StreamWish > Doodstream > otros
      const vidara = allStreams.find(s => s.cyberlocker === 'vidara');
      const streamwish = allStreams.find(s => s.cyberlocker === 'streamwish');
      const dood = allStreams.find(s => s.cyberlocker === 'doodstream');
      const selectedServer = vidara || streamwish || dood || allStreams[0];

      let streamTarget = null;
      if (selectedServer && selectedServer.result) {
        const embed = await extractEmbed(selectedServer.result);
        if (embed) {
          if (embed.includes('vidara.to/e/')) {
            streamTarget = 'vidara:' + embed.split('/e/')[1];
          } else if (embed.includes('streamwish')) {
            streamTarget = 'streamwish:' + embed.split('/e/')[1];
          } else if (embed.includes('dood')) {
            streamTarget = 'dood:' + embed;
          } else {
            streamTarget = embed;
          }
        } else {
          streamTarget = selectedServer.result;
        }
      }

      if (!streamTarget) continue;

      const year = parseInt((m.releaseDate || tm.releaseDate || '').slice(0, 4), 10) || 2024;
      const rawGenres = tm.genres || m.genres || [];
      const genres = [];
      rawGenres.forEach(g => {
        const name = (g.name || g.slug || '').toLowerCase();
        const mapped = GENRE_MAP[name];
        if (mapped && genres.indexOf(mapped) < 0) genres.push(mapped);
      });
      if (!genres.length) genres.push('accion');

      const poster = (tm.images && tm.images.poster) || (m.images && m.images.poster) || '';
      const art = (tm.images && tm.images.backdrop) || (m.images && m.images.backdrop) || poster;
      const runtime = (tm.runtime || m.runtime || 105) * 60;
      const overview = tm.overview || m.overview || '';

      processedMovies.push({
        key: `poseidon:${m.TMDbId}`,
        type: 'movie',
        name: tm.titles?.name || m.titles?.name || 'Película',
        year,
        quality,
        runtime,
        duration: runtime,
        genres,
        regions: [],
        subs: false,
        poster,
        art,
        img: poster,
        overview,
        summary: overview,
        src: 'poseidon',
        stream: streamTarget,
        url: streamTarget,
        lang: 'es'
      });

      process.stdout.write(`[${count}/${rawCatalog.length}] ${m.titles.name} (${year} · ${quality}) -> OK\n`);
      if (processedMovies.length >= 65) break; // Limitar a las mejores 65 películas para mantener APK y carga liviana
    } catch (e) {
      // Ignorar errores individuales para no cortar el lote
    }
  }

  console.log(`\nCompletado: ${processedMovies.length} películas listas.`);
  const hdCount = processedMovies.filter(m => m.quality === 'HD').length;
  const camCount = processedMovies.filter(m => m.quality === 'CAM').length;
  console.log(`Desglose: ${hdCount} en HD · ${camCount} en CAM`);

  const outPath = path.resolve('public/poseidon.json');
  fs.writeFileSync(outPath, JSON.stringify(processedMovies, null, 2), 'utf8');
  console.log(`Archivo guardado exitosamente en: ${outPath}`);
}

main().catch(console.error);

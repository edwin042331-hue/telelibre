// Sincronizador de Series de PoseidonHD con episodios y streams reales verificados
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://www.poseidonhd2.co';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://www.poseidonhd2.co/'
};

async function fetchJson(url, timeoutMs = 8000) {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(timeoutMs) });
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
    const res = await fetch(playerUrl, { headers: HEADERS, signal: AbortSignal.timeout(4000) });
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
  if (embedUrl.includes('vidhide') || embedUrl.includes('callistanise')) {
    const parts = embedUrl.split('/v/');
    return { type: 'vidhide', code: parts[1] || embedUrl, url: embedUrl };
  }
  if (embedUrl.includes('streamwish')) {
    const parts = embedUrl.split('/e/');
    return { type: 'streamwish', code: parts[1] || embedUrl, url: embedUrl };
  }
  if (embedUrl.includes('dood')) {
    return { type: 'dood', url: embedUrl };
  }
  if (embedUrl.includes('voe.sx/e/')) {
    return { type: 'voe', url: embedUrl };
  }
  return null;
}

async function processEpisode(ep, sz, ts, s) {
  const epSlug = ep.url?.slug || '';
  let epServers = {};
  let epLangs = ['latino'];
  let epStream = '';

  if (epSlug) {
    try {
      const cleanEpPath = epSlug.replace(/^series\//, 'serie/').replace(/\/seasons\//, '/temporada/').replace(/\/episodes\//, '/episodio/');
      const epUrl = `${BASE}/${cleanEpPath}`;
      const epData = await fetchJson(epUrl);
      const epObj = epData.props?.pageProps?.thisEpisode || epData.props?.pageProps?.episode || {};
      const vids = epObj.videos || {};
      const CYBER_PRIORITY = { vidara: 1, vidhide: 2, streamwish: 3, voesx: 4, doodstream: 5 };

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

      const allParsed = [].concat(...Object.values(epServers));
      const prim = (epServers['latino'] || allParsed).find(x => x.type === 'vidara') ||
                   (epServers['latino'] || allParsed).find(x => x.type === 'vidhide') ||
                   (epServers['latino'] || allParsed).find(x => x.type === 'streamwish') ||
                   allParsed[0];
      if (prim) {
        if (prim.type === 'vidara') epStream = 'vidara:' + prim.code;
        else if (prim.type === 'vidhide') epStream = 'vidhide:' + prim.code;
        else if (prim.type === 'streamwish') epStream = 'streamwish:' + prim.code;
        else if (prim.type === 'dood') epStream = 'dood:' + prim.url;
        else if (prim.type === 'voe') epStream = prim.url;
        else epStream = prim.url;
      }
    } catch (e) {
      // fallback sin stream
    }
  }

  return {
    type: 'episode',
    key: `poseidon:ep:${ep.TMDbId || (s.TMDbId + '-' + sz.number + '-' + ep.number)}`,
    seriesKey: `poseidon:serie:${s.TMDbId}`,
    seriesName: ts.titles?.name || s.titles?.name || s.name,
    season: sz.number || 1,
    number: ep.number || 1,
    title: ep.title || ep.name || `Episodio ${ep.number}`,
    name: `${ts.titles?.name || s.titles?.name || s.name} · T${sz.number || 1}:E${ep.number || 1}`,
    description: ep.description || ep.overview || '',
    runtime: (ep.runtime || 45) * 60,
    poster: ep.image || s.images?.poster || '',
    art: s.images?.backdrop || ep.image || '',
    src: 'poseidon',
    languages: epLangs,
    servers: epServers,
    stream: epStream,
    url: epStream
  };
}

async function processSerie(s) {
  if (!s || !s.url || !s.url.slug) return null;
  const slug = s.url.slug.replace(/^series\//, '').replace(/^serie\//, '');
  const detUrl = `${BASE}/serie/${slug}`;

  try {
    const detData = await fetchJson(detUrl);
    const ts = detData.props?.pageProps?.thisSerie || {};
    const seasonsRaw = (ts.seasons || []).filter(sz => sz.episodes && sz.episodes.length > 0);
    if (!seasonsRaw.length) return null;

    const seasons = [];
    for (const sz of seasonsRaw.slice(0, 2)) { // Primeras 2 temporadas
      const epList = (sz.episodes || []).slice(0, 10);
      const episodes = await Promise.all(epList.map(ep => processEpisode(ep, sz, ts, s)));
      if (episodes.length > 0) {
        seasons.push({
          number: sz.number || 1,
          episodes
        });
      }
    }

    if (!seasons.length) return null;

    const poster = ts.images?.poster || s.images?.poster || '';
    const art = ts.images?.backdrop || s.images?.backdrop || poster;
    const overview = ts.overview || s.overview || '';
    const year = parseInt((ts.releaseDate || s.releaseDate || '').slice(0, 4), 10) || 2024;

    return {
      key: `poseidon:serie:${s.TMDbId}`,
      type: 'series',
      src: 'poseidon',
      name: ts.titles?.name || s.titles?.name || s.name,
      year,
      poster,
      art,
      img: poster,
      genre: 'Series',
      genres: ['series'],
      summary: overview,
      overview,
      seasonsCount: seasons.length,
      seasons
    };
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('Recolectando series de PoseidonHD...');
  const rawList = [];
  const seen = new Set();

  for (const page of [1, 2]) {
    try {
      const url = page === 1 ? `${BASE}/series` : `${BASE}/series/page/${page}`;
      const data = await fetchJson(url);
      const pp = data.props?.pageProps || {};
      const items = (pp.movies || []).concat(pp.topSeriesWeek || [], pp.topSeriesDay || []);
      for (const it of items) {
        if (!it || !it.TMDbId || seen.has(it.TMDbId)) continue;
        seen.add(it.TMDbId);
        rawList.push(it);
      }
    } catch (e) {
      console.warn(`Error en pagina ${page}: ${e.message}`);
    }
  }

  console.log(`Encontradas ${rawList.length} series en catálogo. Procesando las mejores 20 con episodios reales en paralelo...`);
  const seriesProcessed = [];
  for (const s of rawList.slice(0, 20)) {
    process.stdout.write(`- ${s.titles?.name || s.name}... `);
    const res = await processSerie(s);
    if (res && res.seasons.length > 0) {
      const totalEps = res.seasons.reduce((a, x) => a + x.episodes.length, 0);
      const withStream = res.seasons.reduce((a, x) => a + x.episodes.filter(e => e.stream).length, 0);
      seriesProcessed.push(res);
      console.log(`✓ (${res.seasons.length} temporadas, ${totalEps} eps, ${withStream} con stream)`);
    } else {
      console.log('✗ (sin temporadas)');
    }
  }

  console.log(`\nProcesadas ${seriesProcessed.length} series exitosamente.`);
  const catalogPath = path.resolve(import.meta.dirname, '../public/poseidon.json');
  const existing = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const moviesOnly = existing.filter(x => x.type !== 'series');
  const merged = [...moviesOnly, ...seriesProcessed];
  fs.writeFileSync(catalogPath, JSON.stringify(merged, null, 2), 'utf8');
  console.log(`✓ Guardado poseidon.json con ${moviesOnly.length} películas + ${seriesProcessed.length} series.`);
}

main().catch(console.error);

import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://www.poseidonhd2.co';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://www.poseidonhd2.co/'
};

async function fetchJson(url, timeoutMs = 9000) {
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
    const res = await fetch(playerUrl, { headers: HEADERS, signal: AbortSignal.timeout(4500) });
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
  if (embedUrl.includes('vidhide') || embedUrl.includes('callistanise')) {
    const parts = embedUrl.split('/v/');
    return { type: 'vidhide', code: parts[1] || embedUrl, url: embedUrl, cyberlocker: 'vidhide' };
  }
  if (embedUrl.includes('vidara.to/e/')) {
    return { type: 'vidara', code: embedUrl.split('/e/')[1], url: embedUrl, cyberlocker: 'vidara' };
  }
  if (embedUrl.includes('streamwish')) {
    const parts = embedUrl.split('/e/');
    return { type: 'streamwish', code: parts[1] || embedUrl, url: embedUrl, cyberlocker: 'streamwish' };
  }
  if (embedUrl.includes('voe.sx/e/')) {
    return { type: 'voe', url: embedUrl, cyberlocker: 'voesx' };
  }
  if (embedUrl.includes('dood')) {
    return { type: 'dood', url: embedUrl, cyberlocker: 'doodstream' };
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
      const CYBER_PRIORITY = { vidhide: 1, vidara: 2, streamwish: 3, voesx: 4, doodstream: 5 };

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
      const prim = (epServers['latino'] || allParsed).find(x => x.type === 'vidhide') ||
                   (epServers['latino'] || allParsed).find(x => x.type === 'vidara') ||
                   (epServers['latino'] || allParsed).find(x => x.type === 'streamwish') ||
                   allParsed[0];
      if (prim) {
        if (prim.type === 'vidhide') epStream = 'vidhide:' + prim.code;
        else if (prim.type === 'vidara') epStream = 'vidara:' + prim.code;
        else if (prim.type === 'streamwish') epStream = 'streamwish:' + prim.code;
        else if (prim.type === 'dood') epStream = 'dood:' + prim.url;
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
    runtime: (ep.runtime || 50) * 60,
    poster: ep.image || s.images?.poster || '',
    art: s.images?.backdrop || ep.image || '',
    src: 'poseidon',
    slug: epSlug,
    languages: epLangs,
    servers: epServers,
    stream: epStream,
    url: epStream
  };
}

async function processFullSerie(s) {
  const slug = s.slug.replace(/^series\//, '').replace(/^serie\//, '');
  const detUrl = `${BASE}/serie/${slug}`;
  console.log(`\nProcesando serie: ${s.name} (${detUrl})...`);

  const detData = await fetchJson(detUrl);
  const ts = detData.props?.pageProps?.thisSerie || {};
  const seasonsRaw = (ts.seasons || []).filter(sz => sz.number > 0 && sz.episodes && sz.episodes.length > 0);
  console.log(`Encontradas ${seasonsRaw.length} temporadas.`);

  const seasons = [];
  for (const sz of seasonsRaw) {
    console.log(`- Temporada ${sz.number}: procesando ${sz.episodes.length} episodios...`);
    const episodes = [];
    for (const ep of sz.episodes) {
      const epResult = await processEpisode(ep, sz, ts, { TMDbId: s.TMDbId, name: s.name, images: ts.images });
      episodes.push(epResult);
      process.stdout.write(epResult.stream ? '.' : 'x');
    }
    console.log(` (${episodes.filter(e => e.stream).length}/${episodes.length} con stream)`);
    seasons.push({
      number: sz.number,
      episodes
    });
  }

  const poster = ts.images?.poster || '';
  const art = ts.images?.backdrop || poster;
  const overview = ts.overview || '';
  const year = parseInt((ts.releaseDate || '').slice(0, 4), 10) || 2024;

  return {
    key: `poseidon:serie:${s.TMDbId}`,
    type: 'series',
    src: 'poseidon',
    name: ts.titles?.name || s.name,
    slug: `serie/${slug}`,
    year,
    poster,
    art,
    img: poster,
    genre: 'Series',
    genres: ['series', 'suspenso', 'crimen'],
    summary: overview,
    overview,
    seasonsCount: seasons.length,
    seasons
  };
}

async function run() {
  const dexterSeries = [
    { name: 'Dexter', slug: '1405/dexter', TMDbId: '1405' },
    { name: 'Dexter: New Blood', slug: '131927/dexter-new-blood', TMDbId: '131927' },
    { name: 'Dexter: Pecado Original', slug: '219937/dexter-pecado-original', TMDbId: '219937' },
    { name: 'El laboratorio de Dexter', slug: '4229/el-laboratorio-de-dexter', TMDbId: '4229' }
  ];

  const processed = [];
  for (const s of dexterSeries) {
    try {
      const p = await processFullSerie(s);
      if (p && p.seasons.length > 0) processed.push(p);
    } catch (e) {
      console.error(`Error procesando ${s.name}:`, e.message);
    }
  }

  const catalogPath = path.resolve(process.cwd(), 'public/poseidon.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  // Actualizar o insertar las series de Dexter
  for (const p of processed) {
    const idx = catalog.findIndex(x => x.key === p.key);
    if (idx >= 0) {
      catalog[idx] = p;
      console.log(`Actualizada serie en catálogo: ${p.name}`);
    } else {
      catalog.push(p);
      console.log(`Insertada nueva serie en catálogo: ${p.name}`);
    }
  }

  // Corregir La Odisea Latino HD en el catálogo
  const odisea = catalog.find(x => x.key === 'poseidon:1368337');
  if (odisea) {
    odisea.slug = 'movies/1368337/la-odisea';
    if (!odisea.servers) odisea.servers = {};
    odisea.servers.latino = [
      {
        type: 'vidhide',
        code: 'rqkzgx2yzq23',
        url: 'https://vidhidepre.com/v/rqkzgx2yzq23',
        cyberlocker: 'vidhide',
        quality: 'HD'
      }
    ];
    console.log('✓ Corregido servidor Latino HD para La Odisea (rqkzgx2yzq23)');
  }

  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`\nCatálogo poseidon.json actualizado con éxito. Total elementos: ${catalog.length}`);
}

run();

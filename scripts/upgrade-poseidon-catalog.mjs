// Sincronizador y actualizador masivo de servidores para TeleLibre
// Extrae VidHide y Vidara para todo el catálogo de PoseidonHD (incluyendo estrenos 2026)

import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://www.poseidonhd2.co';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

const embedCache = new Map();

async function fetchJson(url, timeoutMs = 8000) {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('No __NEXT_DATA__');
  return JSON.parse(match[1]);
}

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
  return null;
}

async function pMap(items, fn, concurrency = 6) {
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

async function fetchMovieServers(slug) {
  if (!slug) return null;
  const cleanSlug = slug.replace(/^movies\//, '').replace(/^series\//, '');
  const url = `${BASE}/pelicula/${cleanSlug}`;
  try {
    const data = await fetchJson(url, 6000);
    const tm = data.props?.pageProps?.thisMovie;
    if (!tm) return null;
    const vids = tm.videos || {};
    const servers = {};
    const languages = [];
    const langKeys = ['latino', 'spanish', 'english', 'subtitulado'];

    for (const lk of langKeys) {
      const list = vids[lk] || [];
      if (!list.length) continue;
      const sorted = list.slice().sort((a, b) => {
        const p = { vidara: 1, vidhide: 2, streamwish: 3, doodstream: 4 };
        return (p[a.cyberlocker] || 99) - (p[b.cyberlocker] || 99);
      });

      const sList = [];
      for (const item of sorted) {
        if (item.cyberlocker === 'vidhide' || item.cyberlocker === 'vidara') {
          const embed = await extractEmbed(item.result);
          const parsed = parseStreamTarget(embed);
          if (parsed) {
            sList.push({
              type: parsed.type,
              code: parsed.code || '',
              url: parsed.url || '',
              cyberlocker: item.cyberlocker,
              quality: item.quality || 'HD'
            });
          }
        }
      }
      if (sList.length) {
        const norm = lk === 'spanish' ? 'castellano' : lk;
        servers[norm] = sList;
        if (!languages.includes(norm)) languages.push(norm);
      }
    }

    const allS = Object.values(servers).flat();
    const hasHd = allS.some(s => (s.quality || '').toUpperCase() === 'HD');
    return {
      servers,
      languages,
      quality: hasHd ? 'HD' : (allS.length ? 'CAM' : 'HD'),
      tm
    };
  } catch (e) {
    return null;
  }
}

async function findSlugByName(name, tmdbId) {
  try {
    const searchUrl = `${BASE}/search?q=${encodeURIComponent(name.trim())}`;
    const data = await fetchJson(searchUrl, 5000);
    const list = data.props?.pageProps?.movies || [];
    const match = list.find(m => String(m.TMDbId) === String(tmdbId) || String(m.id) === String(tmdbId)) ||
                  list.find(m => (m.titles?.name || m.title || '').toLowerCase() === name.toLowerCase()) ||
                  list[0];
    return match ? match.url?.slug : null;
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('=== ACTUALIZADOR MASIVO POSEIDON (EDWIN TELELIBRE) ===');
  const catalogPath = path.resolve('public/poseidon.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  console.log(`Catálogo actual: ${catalog.length} títulos.`);

  // 1. Obtener estrenos de la página de inicio (Tendencias / Top Movies)
  console.log('Fase 1: Recolectando Tendencias de la portada de PoseidonHD...');
  try {
    const homeData = await fetchJson(`${BASE}/`);
    const hpp = homeData.props?.pageProps || {};
    const homeList = (hpp.tabTopMovies || []).concat(hpp.tabLastMovies || [], hpp.tabLastReleasedMovies || []);
    let newTitles = 0;
    for (const m of homeList) {
      if (!m || !m.TMDbId) continue;
      const key = `poseidon:${m.TMDbId}`;
      if (!catalog.some(c => c.key === key)) {
        catalog.unshift({
          key,
          type: 'movie',
          name: m.titles?.name || m.title || 'Película',
          year: parseInt((m.releaseDate || '').slice(0, 4), 10) || 2026,
          quality: 'HD',
          runtime: 6300,
          duration: 6300,
          genres: ['accion'],
          regions: [],
          subs: false,
          languages: [],
          servers: {},
          poster: (m.images && m.images.poster) || '',
          art: (m.images && m.images.backdrop) || (m.images && m.images.poster) || '',
          img: (m.images && m.images.poster) || '',
          overview: m.overview || '',
          summary: m.overview || '',
          src: 'poseidon',
          slug: m.url?.slug || '',
          stream: '',
          url: '',
          lang: 'es'
        });
        newTitles++;
      }
    }
    console.log(`Tendencias añadidas: +${newTitles} nuevos títulos.`);
  } catch (e) {
    console.warn('No se pudo leer la portada:', e.message);
  }

  // 2. Filtrar películas que necesitan actualización
  const needsUpdate = catalog.filter(m => {
    if (m.type === 'series') return false;
    const s = m.servers || {};
    let hasWorking = false;
    Object.values(s).forEach(arr => {
      arr.forEach(srv => {
        if (srv.type === 'vidhide' || srv.type === 'vidara') hasWorking = true;
      });
    });
    return !hasWorking;
  });

  console.log(`\nFase 2: Títulos pendientes de servidores VidHide/Vidara: ${needsUpdate.length}`);

  let updatedCount = 0;
  let noServersCount = 0;

  await pMap(needsUpdate, async (m, idx) => {
    const id = m.key.replace('poseidon:', '');
    let slug = m.slug;
    if (!slug) {
      slug = await findSlugByName(m.name, id);
      if (slug) m.slug = slug;
    }

    if (slug) {
      const res = await fetchMovieServers(slug);
      if (res && Object.keys(res.servers).length > 0) {
        m.servers = res.servers;
        m.languages = res.languages;
        m.quality = res.quality;
        const allServers = Object.values(m.servers).flat();
        const prim = (m.servers['latino'] || allServers).find(s => s.type === 'vidara') ||
                     (m.servers['latino'] || allServers).find(s => s.type === 'vidhide') ||
                     allServers[0];
        if (prim) {
          m.stream = prim.type + ':' + prim.code;
          m.url = m.stream;
          updatedCount++;
        }
      } else {
        noServersCount++;
      }
    } else {
      noServersCount++;
    }

    if ((idx + 1) % 20 === 0 || idx + 1 === needsUpdate.length) {
      process.stdout.write(`  [${idx + 1}/${needsUpdate.length}] Actualizados con VidHide/Vidara: ${updatedCount} · Sin servidores aún: ${noServersCount}\n`);
    }
  }, 6);

  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`\n✓ Catálogo guardado en ${catalogPath} (${catalog.length} títulos totales, ${updatedCount} actualizados exitosamente a VidHide/Vidara).`);
}

main().catch(console.error);

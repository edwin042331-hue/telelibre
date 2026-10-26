// Descarga todas las fuentes reales y arma el catálogo como lo haría la TV.
// Uso: node scripts/smoke.mjs
import { parseM3U } from '../src/m3u.js';
import { toChannel, mergeChannels, applyFilters, buildRows } from '../src/catalog.js';
import { BUILTIN_SOURCES, isSourceOn } from '../src/sources.js';
import { VOD_SOURCES, isVodSourceOn, toMovie, plutoMovie, buildMovieRows } from '../src/vod.js';

const settings = { sources: {}, custom: [] };
const text = url => fetch(url).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); });

let failures = 0;
const lists = [];
for (const s of BUILTIN_SOURCES.filter(x => isSourceOn(x, settings))) {
  try {
    const ch = parseM3U(await text(s.url)).map(e => toChannel(e, s)).filter(Boolean);
    console.log('✓', s.name.padEnd(48), ch.length, 'canales');
    lists.push(ch);
  } catch (e) { failures++; console.log('✕', s.name, e.message); }
}
const merged = mergeChannels(lists);
const visible = applyFilters(merged, { hideGeo: true });
console.log('\nCanales únicos:', merged.length, '| visibles (sin geo-bloqueados):', visible.length,
  '| solo https (web):', applyFilters(visible, { httpsOnly: true }).length);
buildRows(visible).forEach(r => console.log('  fila', r.title.padEnd(32), r.items.length));

const movies = [];
for (const s of VOD_SOURCES.filter(x => isVodSourceOn(x, settings))) {
  try {
    let found;
    if (s.kind === 'pluto') found = parseM3U(await text(s.url)).map(e => plutoMovie(e, s)).filter(Boolean);
    else {
      const url = 'https://archive.org/advancedsearch.php?q=' + encodeURIComponent(s.query) + '&rows=' + s.rows +
        '&page=1&output=json&sort[]=downloads+desc&fl[]=identifier&fl[]=title&fl[]=year&fl[]=subject&fl[]=runtime';
      found = JSON.parse(await text(url)).response.docs.map(d => toMovie(d, s)).filter(Boolean);
    }
    console.log('✓', s.name.padEnd(48), found.length, 'películas');
    movies.push(...found);
  } catch (e) { failures++; console.log('✕', s.name, e.message); }
}
console.log('\nPelículas:', movies.length);
buildMovieRows(movies).forEach(r => console.log('  fila', r.title.padEnd(32), r.items.length));

if (failures) {
  console.error('\n' + failures + ' fuente(s) fallaron');
  process.exit(1);
}

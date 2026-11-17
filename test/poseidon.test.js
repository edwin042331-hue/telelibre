import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { INITIAL_POSEIDON_MOVIES, buildPoseidonRows, formatPoseidonMovie, hasPoseidonSource, loadPoseidonBrowsePage } from '../src/poseidon.js';
import { resolveDood, resolvePoseidon, resolvePoseidonUrls, resolveVidHide, refreshPoseidonUrls, unpackDeanEdwards, fetchLiveServers } from '../src/resolvers.js';
import { buildMovieRows } from '../src/vod.js';
import { state } from '../src/store.js';

test('Poseidon: catálogo inicial contiene estrenos válidos y metadatos correctos', () => {
  assert.ok(INITIAL_POSEIDON_MOVIES.length >= 8, 'Debe tener al menos 8 estrenos iniciales');
  INITIAL_POSEIDON_MOVIES.forEach(m => {
    assert.ok(m.key.startsWith('poseidon:'), `Key inválida: ${m.key}`);
    assert.equal(m.type, 'movie');
    assert.equal(m.src, 'poseidon');
    assert.ok(m.name && m.name.length > 2, `Nombre inválido en ${m.key}`);
    assert.ok(m.poster && m.poster.startsWith('https://'), `Poster inválido en ${m.key}`);
    assert.ok(m.art && m.art.startsWith('https://'), `Art inválido en ${m.key}`);
    assert.ok(Array.isArray(m.regions), `Regions debe ser un arreglo en ${m.key}`);
    assert.equal(typeof m.subs, 'boolean', `Subs debe ser booleano en ${m.key}`);
    assert.ok(m.year >= 1900 && m.year <= 2030, `Año inválido en ${m.key}`);
    assert.ok(Array.isArray(m.genres) && m.genres.length > 0, `Géneros vacíos en ${m.key}`);
    assert.ok(
      m.stream.startsWith('vidara:') || m.stream.startsWith('vidhide:') || m.stream.startsWith('streamwish:') || m.stream.startsWith('dood:') || m.stream.startsWith('http'),
      `Stream inválido en ${m.key}: ${m.stream}`
    );
  });
});

test('Poseidon: buildMovieRows integra películas de Poseidon sin lanzar excepciones por regions', () => {
  assert.doesNotThrow(() => {
    const rows = buildMovieRows(INITIAL_POSEIDON_MOVIES);
    assert.ok(Array.isArray(rows));
  }, 'buildMovieRows no debe fallar al recibir películas de Poseidon');
});

test('Poseidon: formatPoseidonMovie asigna valores por defecto seguros ante objetos incompletos', () => {
  const incomplete = { key: 'poseidon:test', name: 'Test Movie' };
  const formatted = formatPoseidonMovie(incomplete);
  assert.equal(formatted.type, 'movie');
  assert.equal(formatted.src, 'poseidon');
  assert.equal(formatted.lang, 'es');
  assert.ok(Array.isArray(formatted.regions));
  assert.ok(Array.isArray(formatted.genres));
  assert.equal(formatted.subs, false);
});

test('Edwin: exploración pagina sin cargar temporadas ni inventar calidad', async () => {
  const originalFetch = globalThis.fetch;
  const requested = [];
  globalThis.fetch = async url => {
    requested.push(url);
    const series = url.includes('/series/');
    const item = {
      TMDbId: series ? '42' : '17',
      titles: { name: series ? 'Serie animada' : 'Película animada' },
      url: { slug: series ? 'series/42/serie-animada' : 'movies/17/pelicula-animada' },
      images: { poster: 'https://image.tmdb.org/t/p/original/poster.jpg' },
      rate: { average: 8.34 },
      runtime: 112,
      genres: [{ name: 'Animación' }],
      seasons: [{ number: 1, episodes: [{ number: 1 }] }]
    };
    const html = '<script id="__NEXT_DATA__" type="application/json">' + JSON.stringify({ props: { pageProps: { pages: 3, movies: [item] } } }) + '</script>';
    return { ok: true, text: async () => html };
  };
  try {
    const movies = await loadPoseidonBrowsePage('genero/animacion', 2);
    const shows = await loadPoseidonBrowsePage('series/tendencias/semana', 1);
    const trendingMovies = await loadPoseidonBrowsePage('peliculas/tendencias/semana', 1);
    assert.equal(requested[0], 'https://www.poseidonhd2.co/genero/animacion/page/2');
    assert.equal(movies.totalPages, 3);
    assert.equal(movies.items[0].type, 'movie');
    assert.equal(shows.items[0].type, 'series');
    assert.equal(shows.items[0].poster, 'https://image.tmdb.org/t/p/w342/poster.jpg');
    assert.equal(shows.items[0].quality, undefined);
    assert.equal(shows.items[0].seasons, undefined);
    assert.equal(movies.items[0].rating, 8.3);
    assert.equal(movies.items[0].runtime, 6720, 'La duración remota en minutos se convierte a segundos');
    assert.equal(trendingMovies.items[0].type, 'movie');
    await assert.rejects(loadPoseidonBrowsePage('../admin', 1));
    await assert.rejects(loadPoseidonBrowsePage('series', -1));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Poseidon: buildPoseidonRows agrupa por estrenos y géneros sin romper', () => {
  const rows = buildPoseidonRows(INITIAL_POSEIDON_MOVIES);
  assert.ok(rows.length >= 3, 'Debe generar al menos 3 filas temáticas');
  assert.equal(rows[0].id, 'ps:tendencias');
  assert.ok(rows.some(r => r.id === 'ps:estrenos'), 'Debe incluir fila de todos los estrenos');

  // Filas deben tener IDs únicos
  const ids = new Set(rows.map(r => r.id));
  assert.equal(ids.size, rows.length, 'Los IDs de filas deben ser únicos');
});

test('Poseidon: interruptor en Ajustes desactiva las filas si está en false', () => {
  state.settings.sources.poseidon = false;
  const rowsDisabled = buildPoseidonRows(INITIAL_POSEIDON_MOVIES);
  assert.equal(rowsDisabled.length, 0, 'No debe devolver filas si está desactivado');

  state.settings.sources.poseidon = true;
  const rowsEnabled = buildPoseidonRows(INITIAL_POSEIDON_MOVIES);
  assert.ok(rowsEnabled.length > 0, 'Debe devolver filas cuando está activado');
});

test('Poseidon: resolveDood genera URL con 10 dígitos aleatorios y timestamp', async () => {
  const cdnBase = 'https://dp602xo.cloudatacdn.com/u5kj7aot/cjqqf1vjsv~?token=234sb3ryt10m';
  const resolved = await resolveDood(cdnBase);

  assert.ok(resolved.startsWith('https://dp602xo.cloudatacdn.com/u5kj7aot/cjqqf1vjsv~'));
  assert.ok(resolved.includes('token=234sb3ryt10m'));
  assert.ok(resolved.includes('&expiry='));

  // Verificar que los 10 dígitos se hayan intercalado
  const regex = /cjqqf1vjsv~(\d{10})\?token=/;
  assert.ok(regex.test(resolved), 'Debe contener exactamente 10 dígitos antes del query token');
});

test('Poseidon: resolvePoseidon enruta URLs directas HTTP de inmediato', async () => {
  const direct = 'https://cdn.example.com/hls/master.m3u8';
  const res = await resolvePoseidon({ stream: direct });
  assert.equal(res, direct);
});

test('Poseidon: resolvePoseidon soporta multi-idioma y cascada de servidores', async () => {
  const movieMulti = {
    key: 'poseidon:test_multi',
    servers: {
      latino: [
        { type: 'invalido', url: '' }, // Debe fallar y pasar al siguiente
        { type: 'direct', url: 'https://cdn.example.com/latino.mp4' }
      ],
      castellano: [
        { type: 'direct', url: 'https://cdn.example.com/castellano.mp4' }
      ],
      english: [
        { type: 'direct', url: 'https://cdn.example.com/english.mp4' }
      ]
    }
  };

  const resLatino = await resolvePoseidon(movieMulti, 'latino');
  assert.equal(resLatino, 'https://cdn.example.com/latino.mp4');

  const resCastellano = await resolvePoseidon(movieMulti, 'castellano');
  assert.equal(resCastellano, 'https://cdn.example.com/castellano.mp4');

  const resEnglish = await resolvePoseidon(movieMulti, 'english');
  assert.equal(resEnglish, 'https://cdn.example.com/english.mp4');
});

test('Poseidon: buildPoseidonRows crea filas dedicadas para 2026, Series y Sagas', () => {
  const sampleData = [
    { key: 'poseidon:1', name: 'El sorprendente Hombre Araña', year: 2026, quality: 'HD', type: 'movie', genres: ['accion'] },
    { key: 'poseidon:2', name: 'Spider-Man Sin Camino a Casa', year: 2021, quality: 'HD', type: 'movie', genres: ['accion'] },
    { key: 'poseidon:3', name: 'Estreno Futurista', year: 2026, quality: 'CAM', type: 'movie', genres: ['scifi'] },
    { key: 'poseidon:4', name: 'VisionQuest', year: 2026, quality: 'HD', type: 'series', genres: ['series'], seasons: [] }
  ];

  const rows = buildPoseidonRows(sampleData);
  const rowIds = rows.map(r => r.id);

  assert.ok(rowIds.includes('ps:estrenos'), 'Debe incluir fila de todos los estrenos');
  assert.ok(rowIds.includes('ps:y2026'), 'Debe incluir fila de 2026');
  assert.ok(rowIds.includes('ps:series'), 'Debe incluir fila de series');
  assert.ok(rowIds.includes('ps:sagas'), 'Debe incluir fila de sagas y superhéroes');
});

test('Poseidon: unpackDeanEdwards desempaqueta correctamente scripts empaquetados', () => {
  const packed = "eval(function(p,a,c,k,e,d){while(c--)if(k[c])p=p.replace(new RegExp('\\\\b'+e(c)+'\\\\b','g'),k[c]);return p;}('1 0=\"2\";',3,3,'stream|var|https'.split('|'),0,{}))";
  const unpacked = unpackDeanEdwards(packed);
  assert.equal(unpacked, 'var stream="https";');
  assert.equal(unpackDeanEdwards("}('x',1,1,'x'.split('|')"), null, 'Una base inválida no debe colgar la TV');
});

test('Películas Edwin: el respaldo de reproducción conserva primero el mismo idioma', async () => {
  const urls = await resolvePoseidonUrls({ servers: {
    latino: ['https://cdn.example/latino-1.mp4', 'https://cdn.example/latino-2.mp4'],
    english: ['https://cdn.example/english.mp4']
  } }, 'latino');
  assert.deepEqual(urls, ['https://cdn.example/latino-1.mp4', 'https://cdn.example/latino-2.mp4']);
  const soloLatino = await resolvePoseidonUrls({ servers: {
    latino: ['https://cdn.example/latino.mp4'],
    english: ['https://cdn.example/english.mp4']
  } }, 'latino');
  assert.deepEqual(soloLatino, ['https://cdn.example/latino.mp4'], 'No debe cambiar a inglés al fallar el video latino');
});

test('Películas Edwin: filtrado por género y búsqueda de texto dentro del módulo', () => {
  const sampleData = [
    { key: 'poseidon:1', name: 'El sorprendente Hombre Araña', year: 2026, quality: 'HD', type: 'movie', genres: ['accion'] },
    { key: 'poseidon:2', name: 'Spider-Man Sin Camino a Casa', year: 2021, quality: 'HD', type: 'movie', genres: ['accion'] },
    { key: 'poseidon:3', name: 'Estreno Futurista', year: 2026, quality: 'CAM', type: 'movie', genres: ['scifi'] },
    { key: 'poseidon:4', name: 'Terror en la Noche', year: 2026, quality: 'HD', type: 'movie', genres: ['terror'] }
  ];

  // Filtro por acción
  const rowsAccion = buildPoseidonRows(sampleData, 'accion');
  assert.ok(rowsAccion.length > 0, 'Debe devolver filas para acción');
  assert.ok(rowsAccion.some(r => r.id === 'ps:acc_all'), 'Debe incluir fila completa de acción');

  // Filtro por año 2026
  const rows2026 = buildPoseidonRows(sampleData, '2026');
  assert.ok(rows2026.some(r => r.id === 'ps:y2026_all'), 'Debe incluir fila completa de 2026');

  // Búsqueda dentro del módulo
  const rowsSearch = buildPoseidonRows(sampleData, 'all', 'Futurista');
  assert.equal(rowsSearch[0].id, 'ps:search');
  assert.equal(rowsSearch[0].items.length, 1);
  assert.equal(rowsSearch[0].items[0].name, 'Estreno Futurista');
});

test('Películas Edwin: una película hallada en vivo se puede abrir y buscar sin acentos', () => {
  const live = { key: 'poseidon:live', name: 'La última odisea', type: 'movie', slug: 'movies/7/la-ultima-odisea', servers: {} };
  assert.equal(hasPoseidonSource(live), true);
  assert.equal(hasPoseidonSource({ key: 'poseidon:empty', servers: {} }), false);
  assert.deepEqual(buildPoseidonRows([live], 'all', 'ultima')[0].items, [live]);
});

test('Películas Edwin: recuperación en vivo acepta películas y episodios y conserva los cinco lockers', async () => {
  const oldFetch = globalThis.fetch;
  const requested = [];
  const types = ['voesx', 'doodstream', 'streamwish', 'vidhide', 'vidara'];
  const embeds = ['https://voe.sx/e/abc', 'https://doodstream.com/e/abc', 'https://streamwish.to/e/abc', 'https://vidhidepro.com/v/abc', 'https://vidara.to/e/abc'];
  const videos = { latino: [{ cyberlocker: 'desconocido', result: 'https://invalid.example/player.php?h=x' }].concat(
    types.map((cyberlocker, i) => ({ cyberlocker, result: 'https://player.poseidonhd2.co/player.php?h=x' + i, quality: 'HD' }))
  ) };
  globalThis.fetch = async url => {
    requested.push(String(url));
    if (String(url).indexOf('player.php') >= 0) {
      const i = Number(String(url).split('h=x')[1]);
      return { ok: true, text: async () => 'var url = "' + embeds[i] + '";' };
    }
    const pageProps = String(url).indexOf('/episodio/') >= 0 ? { thisEpisode: { videos } } : { thisMovie: { videos } };
    return { ok: true, text: async () => '<script id="__NEXT_DATA__">' + JSON.stringify({ props: { pageProps } }) + '</script>' };
  };
  try {
    const movie = await fetchLiveServers('/pelicula/7/prueba');
    const episode = await fetchLiveServers('series/7/prueba/seasons/1/episodes/2');
    assert.equal(movie.latino.length, 5);
    assert.equal(episode.latino.length, 5);
    assert.ok(movie.latino.some(s => s.type === 'vidara'));
    assert.ok(requested.includes('https://www.poseidonhd2.co/pelicula/7/prueba'));
    assert.ok(requested.includes('https://www.poseidonhd2.co/serie/7/prueba/temporada/1/episodio/2'));
    assert.ok(!requested.some(url => url.indexOf('invalid.example') >= 0));
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test('Películas Edwin: un VidHide vencido se reemplaza por un HLS latino obtenido en vivo', async () => {
  const oldFetch = globalThis.fetch;
  const requested = [];
  const playerUrl = 'https://player.poseidonhd2.co/player.php?h=fresh';
  const freshUrl = 'https://cdn.example/fresh.m3u8';
  const packed = "eval(function(p,a,c,k,e,d){return p;}('\"0\":\"1\";',3,2,'hls2|" + freshUrl + "'.split('|')))";
  globalThis.fetch = async url => {
    requested.push(String(url));
    if (String(url).indexOf('/v/dead') >= 0) return { ok: true, text: async () => 'File is no longer available' };
    if (String(url).indexOf('/v/fresh') >= 0) return { ok: true, text: async () => packed };
    if (String(url) === playerUrl) return { ok: true, text: async () => 'var url = "https://vidhidepro.com/v/fresh";' };
    const pageProps = { thisMovie: { videos: { latino: [{ cyberlocker: 'vidhide', result: playerUrl, quality: 'HD' }] } } };
    return { ok: true, text: async () => '<script id="__NEXT_DATA__">' + JSON.stringify({ props: { pageProps } }) + '</script>' };
  };
  try {
    const movie = { slug: 'movies/7/prueba', servers: { latino: [{ type: 'vidhide', code: 'dead' }] } };
    assert.deepEqual(await resolvePoseidonUrls(movie, 'latino'), [freshUrl]);
    assert.equal(movie.servers.latino[0].code, 'fresh');
    assert.equal(requested.filter(url => url.indexOf('/pelicula/7/prueba') >= 0).length, 1);
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test('Películas Edwin: un fallo durante la reproducción renueva el HLS aunque el código VidHide no cambie', async () => {
  const oldFetch = globalThis.fetch;
  const code = 'samecode123';
  const playerUrl = 'https://player.poseidonhd2.co/player.php?h=renew';
  let stream = 'https://cdn.example/expired.m3u8';
  globalThis.fetch = async url => {
    if (String(url).indexOf('/v/' + code) >= 0) {
      const packed = "eval(function(p,a,c,k,e,d){return p;}('\"0\":\"1\";',3,2,'hls2|" + stream + "'.split('|')))";
      return { ok: true, text: async () => packed };
    }
    if (String(url) === playerUrl) return { ok: true, text: async () => 'var url = "https://vidhidepro.com/v/' + code + '";' };
    const pageProps = { thisMovie: { videos: { latino: [{ cyberlocker: 'vidhide', result: playerUrl, quality: 'HD' }] } } };
    return { ok: true, text: async () => '<script id="__NEXT_DATA__">' + JSON.stringify({ props: { pageProps } }) + '</script>' };
  };
  try {
    assert.equal(await resolveVidHide(code), stream);
    stream = 'https://cdn.example/renewed.m3u8';
    const item = { slug: 'movies/7/prueba', servers: { latino: [{ type: 'vidhide', code }] } };
    assert.deepEqual(await refreshPoseidonUrls(item, 'latino'), [stream]);
    assert.equal(item.servers.latino[0].code, code);
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test('Películas Edwin: una actualización de enlaces se aplica aunque no cambie el número de títulos', async () => {
  const oldFetch = globalThis.fetch;
  const catalog = [{ key: 'poseidon:1', name: 'Uno', type: 'movie' }, { key: 'poseidon:2', name: 'Dos', type: 'movie' }];
  let remote = JSON.stringify(catalog);
  globalThis.fetch = async url => ({ ok: true, text: async () => String(url).indexOf('poseidon.json') === 2 ? JSON.stringify(catalog, null, 2) : remote });
  try {
    const mod = await import('../src/poseidon.js?catalog-refresh-regression');
    await mod.loadPoseidonCatalog();
    let updates = 0;
    await mod.refreshPoseidonRemote(() => { updates++; });
    assert.equal(updates, 0, 'La misma información con otro formato no debe repintar la TV');
    remote = JSON.stringify([{ key: 'poseidon:1', name: 'Uno actualizado', type: 'movie' }, catalog[1]]);
    await mod.refreshPoseidonRemote(() => { updates++; });
    assert.equal(updates, 1);
    assert.equal(mod.getPoseidonMoviesSync()[0].name, 'Uno actualizado');
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test('Películas Edwin: el catálogo conserva las cinco series de Dexter y La Odisea latina', () => {
  const catalog = JSON.parse(readFileSync(new URL('../public/poseidon.json', import.meta.url), 'utf8'));
  const expected = new Map([
    ['Dexter', [8, 96]], ['Dexter: New Blood', [1, 10]],
    ['Dexter: Pecado Original', [1, 10]], ['Dexter: Resurrección', [2, 13]],
    ['El laboratorio de Dexter', [2, 93]]
  ]);
  for (const [name, [seasonCount, episodeCount]] of expected) {
    const series = catalog.find(item => item.name === name && item.type === 'series');
    assert.ok(series, name + ' debe estar en el catálogo');
    assert.equal(series.seasons.length, seasonCount, name + ': temporadas');
    assert.equal(series.seasons.reduce((n, s) => n + s.episodes.length, 0), episodeCount, name + ': episodios');
  }
  const odyssey = catalog.find(item => item.key === 'poseidon:1368337');
  assert.equal(odyssey.servers.latino[0].code, 'rqkzgx2yzq23');
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_POSEIDON_MOVIES, buildPoseidonRows, formatPoseidonMovie } from '../src/poseidon.js';
import { resolveDood, resolvePoseidon, unpackDeanEdwards } from '../src/resolvers.js';
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
});

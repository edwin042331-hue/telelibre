import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { normalizeTmdbItem, syncTmdb } from '../scripts/sync-tmdb.mjs';
import { loadTmdbBrowsePage, loadTmdbManifest } from '../src/tmdb.js';

test('TMDB: normaliza metadatos sin fabricar video ni aceptar imágenes externas', () => {
  const item = normalizeTmdbItem({ id: 42, title: 'Ejemplo', release_date: '2026-10-01',
    vote_average: 8.76, poster_path: '/poster.jpg', backdrop_path: 'https://evil.example/a.jpg', overview: 'Sinopsis' }, 'movie');
  assert.equal(item.key, 'tmdb:42');
  assert.equal(item.src, 'tmdb');
  assert.equal(item.rating, 8.8);
  assert.equal(item.poster, 'https://image.tmdb.org/t/p/w342/poster.jpg');
  assert.equal(item.art, '');
  assert.equal(item.stream, undefined);
  assert.equal(normalizeTmdbItem({ id: 1, title: 'Adulto', adult: true }, 'movie'), null);
});

test('TMDB: sincronización guarda páginas y publica el manifiesto al terminar', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'telelibre-tmdb-'));
  const calls = [];
  const fakeFetch = async (url, options) => {
    calls.push({ url: String(url), bearer: options.headers.Authorization });
    const page = Number(url.searchParams.get('page'));
    return { ok: true, status: 200, json: async () => ({ total_pages: 3, results: [{
      id: page, title: 'Película ' + page, release_date: '2026-01-01', poster_path: '/p.jpg', vote_average: 7.5
    }] }) };
  };
  const sections = [{ id: 'peliculas', title: 'Cine', path: '/discover/movie', type: 'movie', limit: 2 }];
  const manifest = await syncTmdb({ token: 'token-de-prueba', outDir: dir, fetchImpl: fakeFetch, sections, maxPages: 2 });
  assert.equal(manifest.sections.peliculas.pages, 2);
  assert.equal(calls.length, 2);
  assert.ok(calls.every(call => call.bearer === 'Bearer token-de-prueba'));
  assert.ok(calls.every(call => call.url.includes('include_adult=false')));
  const page = JSON.parse(await readFile(join(dir, manifest.snapshot, 'peliculas', '2.json'), 'utf8'));
  assert.equal(page.items[0].name, 'Película 2');
  assert.equal(page.items[0].src, 'tmdb');
  assert.deepEqual(JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8')).sections, manifest.sections);
});

test('TMDB: la TV lee páginas públicas sin enviar ni recibir el token', async () => {
  const oldFetch = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async url => {
    urls.push(String(url));
    const body = String(url).includes('manifest.json?t=')
      ? { version: 1, snapshot: 'ejemplo123', sections: { peliculas: { pages: 2 } } }
      : { page: 2, items: [{ key: 'tmdb:42', tmdbId: 42, src: 'tmdb', type: 'movie', name: 'Ejemplo' }] };
    return { ok: true, text: async () => JSON.stringify(body) };
  };
  try {
    assert.equal((await loadTmdbManifest()).sections.peliculas.pages, 2);
    const result = await loadTmdbBrowsePage('peliculas', 2);
    assert.equal(result.items[0].key, 'tmdb:42');
    assert.equal(result.totalPages, 2);
    assert.equal(urls.length, 2);
    assert.ok(urls.every(url => url.startsWith('https://edwin042331-hue.github.io/telelibre/tmdb/')));
    await assert.rejects(loadTmdbBrowsePage('../secreto', 1));
  } finally {
    globalThis.fetch = oldFetch;
  }
});

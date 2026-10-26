import test from 'node:test';
import assert from 'node:assert/strict';
import { parseM3U, cleanName } from '../src/m3u.js';
import { toChannel, mergeChannels, applyFilters, buildRows, searchChannels, isPlayableUrl } from '../src/catalog.js';
import { toMovie, parseRuntime, cleanTitle, buildMovieRows } from '../src/vod.js';

const IPTV_ORG = `#EXTM3U
#EXTINF:-1 tvg-id="AcentoTV.do@SD" tvg-logo="https://i.imgur.com/jhiZfHf.png" http-referrer="https://acento.example/player.html" group-title="News",Acento TV
#EXTVLCOPT:http-referrer=https://acento.example/player.html
https://acento.example/hls/live.m3u8
#EXTINF:-1 tvg-id="CDN.do@SD" tvg-logo="" group-title="News;General",CDN, Canal 37 (720p) [Geo-blocked]
http://cdn.example/index.m3u8
#EXTINF:-1 tvg-id="CDN.do@SD" tvg-logo="https://logo/cdn.png" group-title="News",CDN (1080p)
https://cdn.example/hd.m3u8
#EXTINF:-1 tvg-id="" tvg-logo="" group-title="XXX",Adultos
https://xxx.example/a.m3u8
#EXTINF:-1 tvg-id="Kids.mx@SD" tvg-logo="" group-title="Animation",Kids MX [Not 24/7]
https://kids.example/a.m3u8
`;

const SRC = { id: 'iptv-test' };

test('parseM3U lee atributos, nombre con comas y opciones VLC', () => {
  const list = parseM3U(IPTV_ORG);
  assert.equal(list.length, 5);
  assert.equal(list[0].name, 'Acento TV');
  assert.equal(list[0].referrer, 'https://acento.example/player.html');
  assert.equal(list[1].name, 'CDN, Canal 37');
  assert.equal(list[1].quality, '720p');
  assert.equal(list[1].geo, true);
  assert.deepEqual(list[1].groups, ['News', 'General']);
  assert.equal(list[4].not247, true);
});

test('cleanName quita marcas de Free-TV', () => {
  const r = cleanName('Canal 13 Ⓖ Ⓢ');
  assert.equal(r.name, 'Canal 13');
  assert.equal(r.geo, true);
});

test('toChannel descarta adultos y YouTube, y deduce el país del tvg-id', () => {
  const entries = parseM3U(IPTV_ORG);
  const chans = entries.map(e => toChannel(e, SRC)).filter(Boolean);
  assert.equal(chans.length, 4);
  assert.equal(chans[0].country, 'do');
  assert.deepEqual(chans[3].cats, ['kids']);
  assert.equal(isPlayableUrl('https://www.youtube.com/@x/live'), false);
});

test('mergeChannels junta el mismo tvg-id como URLs alternativas', () => {
  const chans = parseM3U(IPTV_ORG).map(e => toChannel(e, SRC)).filter(Boolean);
  const merged = mergeChannels([chans, chans]);
  assert.equal(merged.length, 3);
  const cdn = merged.find(c => c.key === 'id:cdn.do@sd');
  assert.equal(cdn.urls.length, 2);
  assert.equal(cdn.logo, 'https://logo/cdn.png');
});

test('applyFilters: geo y solo-https', () => {
  const merged = mergeChannels([parseM3U(IPTV_ORG).map(e => toChannel(e, SRC)).filter(Boolean)]);
  // CDN tiene una URL geo-bloqueada y otra libre: se queda.
  assert.equal(applyFilters(merged, { hideGeo: true }).length, 3);
  const https = applyFilters(merged, { httpsOnly: true });
  const cdn = https.find(c => c.key === 'id:cdn.do@sd');
  assert.deepEqual(cdn.urls, ['https://cdn.example/hd.m3u8']);
});

test('buildRows pone RD primero y búsqueda ignora acentos', () => {
  const merged = mergeChannels([parseM3U(IPTV_ORG).map(e => toChannel(e, SRC)).filter(Boolean)]);
  const rows = buildRows(merged);
  assert.equal(rows[0].id, 'country:do');
  assert.equal(searchChannels(merged, 'acento')[0].name, 'Acento TV');
  assert.equal(searchChannels(merged, 'notícias').length, 2);
});

test('películas: duración, títulos y filtro de contenido sin género', () => {
  assert.equal(parseRuntime('1:27:04'), 5224);
  assert.equal(parseRuntime('83 min.'), 4980);
  assert.equal(parseRuntime('1:07'), 4020);
  assert.equal(parseRuntime('67:16'), 4036);
  assert.deepEqual(cleanTitle('Horror Express (with spanish subtitles)'), { title: 'Horror Express', subs: true, year: '' });
  assert.deepEqual(cleanTitle('1959 - Anatomy of a Murder - Anatomía de un asesinato - VOSE'), { title: 'Anatomy of a Murder - Anatomía de un asesinato', subs: true, year: '1959' });
  assert.equal(cleanTitle('The Night of The Hunter (La noche del cazador) w/Spanish Subtitles').subs, true);
  assert.equal(cleanTitle('El Tahur ( 1979)').title, 'El Tahur');

  const src = { id: 'ia-es' };
  const good = toMovie({ identifier: 'el-tahur', title: 'El Tahur ( 1979)', year: '1979', subject: ['Vicente Fernandez', 'Ranchera', 'Drama'] }, src);
  assert.deepEqual(good.genres, ['musical', 'drama']);
  assert.deepEqual(good.regions, ['mexicano']);
  assert.equal(toMovie({ identifier: 'x', title: 'Young Casanova', subject: ['Valerie Boisgel'] }, src), null);
  assert.equal(toMovie({ identifier: 'y', title: 'Erotic Tunnel', subject: ['Comedia'] }, src), null);

  const rows = buildMovieRows([good, Object.assign({}, good, { key: 'b' }), Object.assign({}, good, { key: 'c' }), Object.assign({}, good, { key: 'd' })]);
  assert.deepEqual(rows.map(r => r.id), ['mv:top', 'mv:r:mexicano', 'mv:g:drama', 'mv:g:musical']);
});

test('Pluto VOD: id del episodio, género y póster liviano', async () => {
  const { plutoMovie } = await import('../src/vod.js');
  const [entry] = parseM3U(`#EXTM3U
#EXTINF:-1 group-title="Cine Acción" tvg-name="Avalancha",Avalancha
https://cfd.prd.pluto.tv/v2/stitch/hls/episode/63d414b6200a670013670138/master.m3u8?jwt=abc`);
  const m = plutoMovie(entry, { id: 'pluto-vod-do' });
  assert.equal(m.key, 'pluto:63d414b6200a670013670138');
  assert.deepEqual(m.genres, ['accion']);
  assert.equal(m.direct, true);
  assert.match(m.poster, /poster\.jpg\?w=300$/);
});

test('idioma y anime: listas multilingües por país, variantes regionales y gaming fuera', () => {
  const multi = { id: 'iptv-anime', lang: 'multi' };
  const en = { id: 'pluto-us', lang: 'en' };
  const mx = { id: 'pluto-mx' };
  const ch = (name, tvgId, groups, src) => toChannel({ name, tvgId, groups, url: 'https://x/' + name + '.m3u8', logo: '', country: '' }, src);
  assert.equal(ch('One Piece LatAm', 'OnePieceLatAm.mx', ['Animation'], multi).lang, 'es');
  assert.equal(ch('Naruto Brazil', 'NarutoBrazil.us', ['Animation'], multi).lang, 'other');
  assert.equal(ch('Pokémon en español', 'abc', ['Kids'], en).lang, 'es');
  assert.equal(ch('Crunchyroll', 'cr', ['Anime'], en).lang, 'en');
  const naruto = ch('Naruto Shippuden', 'n1', ['Anime & Gaming'], mx);
  assert.equal(naruto.cats[0], 'anime');
  const esports = ch('Pluto TV E-Sports', 'e1', ['Anime & Gaming'], mx);
  assert.deepEqual(esports.cats, ['entertainment']);
  assert.equal(ch('Ghost Hunters', 'g1', ['Reality'], en).cats.indexOf('anime'), -1);
});

test('caché compacta de canales: ida y vuelta sin perder datos', async () => {
  const { packChannels, unpackChannels } = await import('../src/sources.js');
  const chans = mergeChannels([parseM3U(IPTV_ORG).map(e => toChannel(e, SRC)).filter(Boolean)]);
  const back = unpackChannels(JSON.parse(JSON.stringify(packChannels(chans))), SRC.id);
  assert.deepEqual(back, chans);
});

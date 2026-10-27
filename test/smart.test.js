import test from 'node:test';
import assert from 'node:assert/strict';

// localStorage mínimo para los módulos que guardan estado.
const mem = {};
globalThis.localStorage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };

const { parseXmltv, parseXmltvTime } = await import('../src/epg.js');
const { orderForTime, rankByHealth, recordPlayback, isDead, resolveTheme, greeting } = await import('../src/smart.js');
const { buildDominicanRows } = await import('../src/dominican.js');

const XML = `<tv>
  <channel id="Telemicro.dr"><display-name>DR - Telemicro</display-name></channel>
  <channel id="ColorVision.dr"><display-name>DR - Color Visión</display-name></channel>
  <programme start="20261026120000 +0000" stop="20261026130000 +0000" channel="Telemicro.dr"><title lang="es">Noticias Telemicro</title></programme>
  <programme start="20261026130000 +0000" stop="20261026140000 +0000" channel="Telemicro.dr"><title>El Show del Mediodía</title></programme>
  <programme start="20261025000000 +0000" stop="20261025010000 +0000" channel="Telemicro.dr"><title>Viejo</title></programme>
  <programme start="20261026123000 -0400" stop="20261026133000 -0400" channel="ColorVision.dr"><title>Esta Noche Mariasela &amp; amigos</title></programme>
</tv>`;

test('EPG: horas con zona horaria y solo programas vigentes', () => {
  assert.equal(parseXmltvTime('20261026123000', '-0400'), Date.UTC(2026, 9, 26, 16, 30));
  const g = parseXmltv(XML, Date.UTC(2026, 9, 26, 12, 30));
  assert.deepEqual(Object.keys(g).sort(), ['colorvision', 'telemicro']);
  assert.equal(g.telemicro.length, 2);
  assert.equal(g.colorvision[0][2], 'Esta Noche Mariasela & amigos');
});

test('Inicio según la hora: noticias en la mañana, películas de noche, deportes el fin de semana', () => {
  const rows = ['cat:music', 'mv:pluto', 'cat:news', 'cat:sports', 'country:do'].map(id => ({ id }));
  const morning = orderForTime(rows, new Date(2026, 9, 26, 8, 0)).map(r => r.id);
  assert.deepEqual(morning.slice(0, 2), ['country:do', 'cat:news']);
  const night = orderForTime(rows, new Date(2026, 9, 26, 21, 0)).map(r => r.id);
  assert.equal(night[0], 'mv:pluto');
  const saturday = orderForTime(rows, new Date(2026, 9, 31, 9, 0)).map(r => r.id);
  assert.equal(saturday[1], 'cat:sports');
  assert.equal(greeting(new Date(2026, 9, 26, 20, 0)), 'Buenas noches');
});

test('aprende qué canales funcionan', () => {
  const items = [{ key: 'a' }, { key: 'b' }, { key: 'c' }];
  recordPlayback('c', true);
  ['b', 'b', 'b'].forEach(k => recordPlayback(k, false));
  assert.equal(isDead('b'), true);
  assert.equal(isDead('c'), false);
  assert.deepEqual(rankByHealth(items).map(i => i.key), ['c', 'a', 'b']);
  recordPlayback('b', true);
  assert.equal(isDead('b'), false);
});

test('tema automático: claro de día, oscuro de noche', () => {
  assert.equal(resolveTheme('auto', new Date(2026, 9, 26, 10, 0)), 'light');
  assert.equal(resolveTheme('auto', new Date(2026, 9, 26, 22, 0)), 'dark');
  assert.equal(resolveTheme('dark', new Date(2026, 9, 26, 10, 0)), 'dark');
});

test('apartado RD: los grandes en orden del dial y todos A-Z', () => {
  const ch = (name, cats) => ({ key: name, name, country: 'do', cats: cats || ['general'], quality: '', logo: '' });
  const rows = buildDominicanRows([ch('Color Visión'), ch('Telemicro'), ch('Teleantillas'), ch('Zona Visión'), ch('CDN', ['news'])]);
  assert.equal(rows[0].id, 'rd:big');
  assert.deepEqual(rows[0].items.map(c => c.name), ['Teleantillas', 'Telemicro', 'Color Visión', 'CDN']);
  assert.equal(rows[rows.length - 1].items[0].name, 'CDN');
});

test('EPG: coincidencias de nombre sin falsos positivos', async () => {
  const { useGuide, nowNext } = await import('../src/epg.js');
  const now = Date.now();
  const slot = t => [[now - 60000, now + 600000, t]];
  useGuide({ telemicro: slot('Alondra'), canal7: slot('Comisario Rex'), universaltv: slot('Chicago Fire'), htv: slot('HTV') });
  const ch = name => ({ key: name, name, country: 'do' });
  assert.equal(nowNext(ch('Telemicro Canal 5')).now.title, 'Alondra');
  assert.equal(nowNext(ch('Antena 7')).now.title, 'Comisario Rex');
  assert.equal(nowNext(ch('Canal 70')), null);
  assert.equal(nowNext(ch('Imagen Universal TV')), null);
  assert.equal(nowNext(ch('HTV Live')), null);
  assert.equal(nowNext({ key: 'x', name: 'Telemicro', country: 'mx' }), null);
});

test('EPG de Pluto: por id del canal, con "Después"', async () => {
  const { usePlutoGuide, nowNext, plutoIdOf } = await import('../src/epg.js');
  const now = Date.now();
  const id = '646ccd3681844c000974d6f4';
  usePlutoGuide({ [id]: [[now - 60000, now + 600000, 'Noticias ADN'], [now + 600000, now + 1200000, 'Deportes']] });
  const ch = { key: 'id:' + id, name: 'ADN Noticias', country: 'mx' };
  assert.equal(plutoIdOf(ch), id);
  assert.equal(plutoIdOf({ key: 'id:telemicro.do' }), null);
  const np = nowNext(ch);
  assert.equal(np.now.title, 'Noticias ADN');
  assert.equal(np.next.title, 'Deportes');
  assert.equal(nowNext({ key: 'id:aaaaaaaaaaaaaaaaaaaaaaaa', name: 'Otro', country: 'us' }), null);
  // Canal de una sola serie: en vez de repetir el nombre, el episodio.
  const bb = 'bbbbbbbbbbbbbbbbbbbbbbbb';
  usePlutoGuide({ [bb]: [[now - 60000, now + 600000, 'Blue Bloods', 'T3:E5 · Mentiras']] });
  assert.equal(nowNext({ key: 'id:' + bb, name: 'Blue Bloods', country: 'us' }).now.title, 'T3:E5 · Mentiras');
});

test('versiones, recordatorios, verificados y Sorpréndeme', async () => {
  const { isNewer } = await import('../src/remote.js');
  assert.equal(isNewer('0.10.0', '0.9.3'), true);
  assert.equal(isNewer('0.4.0', '0.4.0'), false);
  assert.equal(isNewer('0.3.9', '0.4.0'), false);

  const { toggleReminder, hasReminder, dueReminders } = await import('../src/reminders.js');
  const now = Date.now();
  const ch = { key: 'tm', name: 'Telemicro' };
  assert.equal(toggleReminder(ch, { title: 'Telenoticias', start: now + 30000 }), true);
  assert.equal(hasReminder('tm', now + 30000), true);
  assert.equal(toggleReminder(ch, { title: 'Más tarde', start: now + 3600000 }), true);
  const due = dueReminders(now);
  assert.deepEqual(due.map(r => r.title), ['Telenoticias']);
  assert.equal(hasReminder('tm', now + 30000), false);
  assert.equal(hasReminder('tm', now + 3600000), true);

  const { setVerified, isVerified, rankByHealth, surprise } = await import('../src/smart.js');
  const { shortKey } = await import('../src/catalog.js');
  setVerified([shortKey('ok')]);
  assert.equal(isVerified('ok'), true);
  assert.deepEqual(rankByHealth([{ key: 'nuevo' }, { key: 'ok' }]).map(i => i.key), ['ok', 'nuevo']);
  const chans = [{ key: 'ok', name: 'Noticias', lang: 'es', cats: ['news'] }, { key: 'x', name: 'Otro', lang: 'es', cats: ['news'] }];
  for (let i = 0; i < 20; i++) assert.equal(surprise(chans, [], new Date(2026, 9, 26, 9, 0)).key, 'ok');
});

test('series de Pluto: tarjeta resumida y "Continuar viendo" con un episodio por serie', async () => {
  const { toSeries } = await import('../src/pluto.js');
  const s = toSeries({
    _id: 'abc', name: 'El Capo', genre: 'Telenovela', summary: 'Narco…', seasonsNumbers: [1, 2, 3],
    covers: [{ aspectRatio: '347:500', url: 'https://images.pluto.tv/series/abc/poster.jpg?fill=blur&h=1000&q=75&w=694' }],
    featuredImage: { path: 'https://images.pluto.tv/series/abc/featured.jpg' }
  }, 'Series Latinas');
  assert.equal(s.key, 'pls:abc');
  assert.equal(s.seasons, 3);
  assert.match(s.poster, /w=300/);
  assert.match(s.poster, /h=432/);
  assert.equal(s.kids, false);
  assert.equal(toSeries({ _id: 'k', name: 'Paw', covers: [] }, 'Nick Jr.').kids, true);

  const store = await import('../src/store.js');
  const ep = (n, at) => ({ type: 'episode', key: 'ple:' + n, seriesKey: 'pls:abc', seriesName: 'El Capo', season: 1, number: n, title: 'Ep ' + n });
  store.saveProgress(ep(1), 600, 3000);
  store.saveProgress(ep(2), 120, 3000);
  store.saveProgress({ type: 'movie', key: 'm1', name: 'Peli' }, 300, 5000);
  const cw = store.continueWatching();
  assert.equal(cw.filter(i => i.type === 'episode').length, 1);
  assert.equal(store.lastEpisodeOf('pls:abc').item.key, 'ple:2');
  store.saveProgress(ep(2), 2950, 3000);
  assert.equal(store.isWatched('ple:2'), true);
  assert.equal(store.lastEpisodeOf('pls:abc').item.key, 'ple:1');
});

test('películas de la API de Pluto: año, género y fila "Estrenos" primero', async () => {
  const { toPlutoMovie } = await import('../src/pluto.js');
  const { buildMovieRows } = await import('../src/vod.js');
  const mk = (id, date, genre) => toPlutoMovie({ _id: id, name: 'P' + id, genre, duration: 5400000, clip: { originalReleaseDate: date },
    stitched: { path: '/stitch/hls/episode/' + id + '/master.m3u8' }, covers: [] });
  const a = mk('a', '2026-01-20T00:00:00Z', 'Romance');
  assert.equal(a.year, '2026');
  assert.deepEqual(a.genres, ['romance']);
  assert.equal(a.key, 'pluto:a');
  assert.equal(a.runtime, 5400);
  const list = [mk('b', '2019-05-01T00:00:00Z', 'Drama'), a, mk('c', '2025-12-19T00:00:00Z', 'Romance'), mk('d', '2021-01-01T00:00:00Z', 'Comedy')];
  const rows = buildMovieRows(list);
  assert.equal(rows[0].id, 'mv:new');
  assert.deepEqual(rows[0].items.map(m => m.name), ['Pa', 'Pc', 'Pd', 'Pb']);
});

test('caché de series v3: compacta y sin perder lo que se muestra', async () => {
  const { toSeries, toPlutoMovie } = await import('../src/pluto.js');
  const s = toSeries({ _id: 's1', name: 'El Capo', genre: 'Telenovela', summary: 'x'.repeat(500), seasonsNumbers: [1, 2],
    covers: [{ aspectRatio: '347:500', url: 'https://images.pluto.tv/series/s1/poster_1.jpg?fill=blur&h=1000&w=694' }],
    featuredImage: { path: 'https://images.pluto.tv/series/s1/featuredImage_1.jpg?fill=blur&w=1600&h=900' } }, 'Series Latinas');
  // La imagen de fondo ya no lleva dos "?" en la URL.
  assert.equal((s.art.match(/\?/g) || []).length, 1);
  assert.match(s.poster, /^https:\/\/images\.pluto\.tv\/series\/s1\/poster_1\.jpg\?/);
  const m = toPlutoMovie({ _id: 'm1', name: 'Amor', genre: 'Romance', duration: 6000000, clip: { originalReleaseDate: '2026-01-20T00:00:00Z' },
    stitched: { path: '/stitch/hls/episode/m1/master.m3u8' }, covers: [{ aspectRatio: '347:500', url: 'https://images.pluto.tv/episodes/m1/poster.jpg?w=694&h=1000' }] });
  assert.equal((m.poster.match(/\?/g) || []).length, 1);
  assert.equal(m.year, '2026');
});

test('orden de filas de series: Series Latinas y novelas antes que "Cine Latino"', async () => {
  const { rowOrder } = await import('../src/pluto.js');
  const names = ['Cine Latino', 'Series Drama', 'Series Latinas', 'Anime Shōnen', 'Telenovelas', 'Cine Terror', 'Documentales'];
  const sorted = names.map((n, i) => [n, rowOrder(n, i)]).sort((a, b) => a[1] - b[1]).map(x => x[0]);
  assert.deepEqual(sorted, ['Series Latinas', 'Telenovelas', 'Series Drama', 'Anime Shōnen', 'Documentales', 'Cine Latino', 'Cine Terror']);
});

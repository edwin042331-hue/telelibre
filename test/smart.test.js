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

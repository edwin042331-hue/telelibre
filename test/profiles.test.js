import test from 'node:test';
import assert from 'node:assert/strict';

// localStorage con datos "de antes" de los perfiles (como la TCL de Edwin con v1.0.1).
const mem = new Map([
  ['telelibre:favorites', JSON.stringify([{ key: 'id:telemicro.do', name: 'Telemicro' }])],
  ['telelibre:progress', JSON.stringify({ 'ple:1': { item: { type: 'episode', key: 'ple:1', seriesKey: 'pls:capo' }, t: 307, d: 2715, at: 1 } })]
]);
globalThis.localStorage = {
  get length() { return mem.size; },
  key: i => [...mem.keys()][i],
  getItem: k => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => { mem.set(k, String(v)); },
  removeItem: k => { mem.delete(k); }
};

const store = await import('../src/store.js');

test('perfiles: lo de antes pasa al perfil principal y cada perfil queda aislado', () => {
  // Migración: los datos sin prefijo pasaron a u:p1 y se borraron las claves viejas.
  assert.equal(store.state.favorites[0].name, 'Telemicro');
  assert.equal(store.getProgress('ple:1').t, 307);
  assert.equal(mem.has('telelibre:favorites'), false);
  assert.ok(mem.has('telelibre:u:p1:favorites'));

  const kid = store.addProfile('sofía', true);
  store.useProfile(kid.id);
  assert.equal(store.state.favorites.length, 0);
  assert.equal(store.getProgress('ple:1'), null);
  store.toggleFavorite({ key: 'id:discoverykids', name: 'Discovery Kids' });
  assert.equal(store.activeProfile().kids, true);

  store.useProfile('p1');
  assert.deepEqual(store.state.favorites.map(f => f.name), ['Telemicro']);

  // Quitar el perfil borra solo lo suyo.
  assert.equal(store.removeProfile(kid.id), true);
  assert.equal(mem.has('telelibre:u:' + kid.id + ':favorites'), false);
  assert.ok(mem.has('telelibre:u:p1:favorites'));
  assert.equal(store.removeProfile('p1'), false, 'el último perfil no se puede quitar');
});

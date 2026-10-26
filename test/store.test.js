import test from 'node:test';
import assert from 'node:assert/strict';

// localStorage con cuota, como en una TV (aquí 2,000 caracteres).
const QUOTA = 2000;
const mem = new Map();
const used = () => [...mem].reduce((n, [k, v]) => n + k.length + v.length, 0);
globalThis.localStorage = {
  get length() { return mem.size; },
  key: i => [...mem.keys()][i],
  getItem: k => (mem.has(k) ? mem.get(k) : null),
  setItem(k, v) {
    const prev = mem.has(k) ? k.length + mem.get(k).length : 0;
    if (used() - prev + k.length + v.length > QUOTA) { const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e; }
    mem.set(k, String(v));
  },
  removeItem: k => { mem.delete(k); }
};

const { save, load, storageUsage } = await import('../src/store.js');

test('con la memoria llena, Mi lista y el progreso desplazan a las cachés (nunca al revés)', () => {
  assert.equal(save('cache:grande', 'x'.repeat(1200)), true);
  assert.equal(save('cache:chica', 'y'.repeat(500)), true);
  // Una caché nueva que no cabe simplemente no se guarda: no borra nada.
  assert.equal(save('cache:otra', 'z'.repeat(900)), false);
  assert.equal(load('cache:grande', null).length, 1200);
  // Un dato del usuario sí libera espacio, empezando por la caché más grande.
  assert.equal(save('favorites', [{ key: 'a', name: 'x'.repeat(700) }]), true);
  assert.equal(load('cache:grande', null), null);
  assert.equal(load('cache:chica', null).length, 500);
  assert.equal(load('favorites', [])[0].key, 'a');
  assert.ok(storageUsage().total > 0);
});

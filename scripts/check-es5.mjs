// Puerta de calidad: todo el JS de dist/ tiene que ser ES5 (TVs con Chromium 38, como webOS 3).
// Uso: node scripts/check-es5.mjs   (falla con código 1 si algún archivo no es ES5)
import { readdirSync, readFileSync } from 'node:fs';
import { parse } from 'acorn';

const dir = new URL('../dist/assets/', import.meta.url);
let failed = 0;
for (const name of readdirSync(dir).filter(f => f.endsWith('.js'))) {
  try {
    parse(readFileSync(new URL(name, dir), 'utf8'), { ecmaVersion: 5, sourceType: 'script' });
    console.log('ES5 ok   ', name);
  } catch (e) {
    failed++;
    console.log('NO ES5   ', name, '→', e.message);
  }
}
if (failed) process.exit(1);

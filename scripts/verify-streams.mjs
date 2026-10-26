// Revisión nocturna (GitHub Actions): prueba cada canal en español y publica cuáles respondieron.
// La app pone primero los verificados. Solo es una señal positiva: si un canal falla desde los servidores
// de GitHub (en EE. UU.) puede funcionar igual en RD, así que nunca se esconde por esto.
// Uso: node scripts/verify-streams.mjs dist/verified.json
import { writeFileSync } from 'node:fs';
import { parseM3U } from '../src/m3u.js';
import { toChannel, shortKey } from '../src/catalog.js';
import { BUILTIN_SOURCES } from '../src/sources.js';

const OUT = process.argv[2] || 'verified.json';
const SOURCES = ['iptv-do', 'iptv-es', 'freetv', 'tdt-es', 'pluto-mx', 'pluto-es', 'plex-mx', 'iptv-anime'];
const CONCURRENCY = 40;
const TIMEOUT = 10000;

async function check(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (SMART-TV) TeleLibre-verify' } });
    if (!res.ok) return false;
    const type = res.headers.get('content-type') || '';
    if (/video|mp2t|octet-stream/i.test(type)) return true;
    const head = (await res.text()).slice(0, 2000);
    return head.indexOf('#EXTM3U') >= 0;
  } catch (e) {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

const channels = [];
for (const s of BUILTIN_SOURCES.filter(x => SOURCES.indexOf(x.id) >= 0)) {
  const text = await (await fetch(s.url)).text();
  parseM3U(text).map(e => toChannel(e, s)).filter(Boolean).forEach(c => channels.push(c));
}
const byKey = {};
channels.forEach(c => { byKey[c.key] = byKey[c.key] || c; });
const list = Object.keys(byKey).map(k => byKey[k]);
console.log('Canales a revisar:', list.length);

const ok = [];
let next = 0;
let done = 0;
async function worker() {
  while (next < list.length) {
    const ch = list[next++];
    if (await check(ch.urls[0])) ok.push(shortKey(ch.key));
    if (++done % 250 === 0) console.log('  revisados', done, '· funcionan', ok.length);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

writeFileSync(OUT, JSON.stringify({ t: new Date().toISOString(), checked: list.length, keys: ok.sort() }));
console.log('Verificados:', ok.length, 'de', list.length, '→', OUT);

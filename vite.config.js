import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { transformSync } from '@babel/core';
import { minify } from 'terser';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const TARGET = 'chrome >= 38';

// Ajustes finales sobre los archivos ya escritos en dist/ (el plugin legacy inyecta sus <script> al final):
// 1. Quita "crossorigin" de index.html: las apps de TV lo abren desde file:// y ahí puede bloquearse por CORS.
// 2. Pasa todo el JS a ES5 real. El empaquetador de Vite 8 deja comillas invertidas y funciones flecha en su
//    propio código (helpers, polyfills) aunque el plugin legacy transpile la app; webOS 3 (Chromium 38) no las entiende.
function tvCompat() {
  let outDir = null;
  return {
    name: 'tv-compat',
    enforce: 'post',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const html = join(outDir, 'index.html');
      if (existsSync(html)) writeFileSync(html, readFileSync(html, 'utf8').replace(/\s+crossorigin(="[^"]*")?/g, ''));
      const assets = join(outDir, 'assets');
      if (!existsSync(assets)) return;
      for (const name of readdirSync(assets).filter(f => f.endsWith('.js'))) {
        const file = join(assets, name);
        const es5 = transformSync(readFileSync(file, 'utf8'), {
          babelrc: false,
          configFile: false,
          sourceType: 'script',
          compact: true,
          comments: false,
          presets: [['@babel/preset-env', { targets: TARGET, modules: false, bugfixes: true }]]
        });
        const min = await minify(es5.code, { ecma: 5, compress: { passes: 2 }, mangle: true, format: { ecma: 5, comments: false } });
        writeFileSync(file, min.code);
      }
    }
  };
}

export default defineConfig({
  // Rutas relativas: la app empaquetada se abre desde file:// en la TV.
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    // Solo build "legacy" (polyfills + SystemJS, sin <script type=module>): webOS 3 / Tizen 3 usan Chromium 38-47.
    legacy({ targets: [TARGET], renderModernChunks: false }),
    tvCompat()
  ],
  build: { outDir: 'dist', assetsInlineLimit: 0, chunkSizeWarningLimit: 1200 },
  server: { port: 5173 }
});

import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// Las apps de TV abren index.html desde file://; ahí un <script crossorigin> puede bloquearse por CORS.
function stripCrossorigin() {
  let outFile = null;
  return {
    name: 'strip-crossorigin',
    enforce: 'post',
    configResolved(config) {
      outFile = resolve(config.root, config.build.outDir, 'index.html');
    },
    // El plugin legacy inyecta sus <script> al final, así que se limpia el archivo ya escrito.
    closeBundle() {
      if (!existsSync(outFile)) return;
      writeFileSync(outFile, readFileSync(outFile, 'utf8').replace(/\s+crossorigin(="[^"]*")?/g, ''));
    }
  };
}

export default defineConfig({
  // Rutas relativas: la app empaquetada se abre desde file:// en la TV.
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    // Solo build "legacy" (ES5 + polyfills, sin <script type=module>): webOS 3 / Tizen 3 usan Chromium 38-47.
    legacy({ targets: ['chrome >= 38'], renderModernChunks: false }),
    stripCrossorigin()
  ],
  build: { outDir: 'dist', assetsInlineLimit: 0, chunkSizeWarningLimit: 1200 },
  server: { port: 5173 }
});

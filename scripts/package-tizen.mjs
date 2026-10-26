// Empaqueta para Samsung Tizen: build/tizen -> release/*.wgt.
// - Si hay CLI de Tizen (variable TIZEN_CLI o "tizen" en el PATH) y un perfil de certificado, sale firmado.
// - Si no, sale un .wgt sin firmar que Apps2Samsung firma e instala con tu certificado.
import { readFileSync, writeFileSync, readdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import { ROOT, pkg, stage, zipDir } from './pack-utils.mjs';

const dir = stage('tizen');
const config = readFileSync(join(ROOT, 'platforms/tizen/config.xml'), 'utf8')
  .replace(/(<widget[^>]*\sversion=")[^"]*"/, '$1' + pkg.version + '"');
writeFileSync(join(dir, 'config.xml'), config);

const cli = process.env.TIZEN_CLI || 'tizen';
const profile = process.env.TIZEN_PROFILE || 'TeleLibre';
const hasCli = spawnSync('"' + cli + '" version', { shell: true, stdio: 'ignore' }).status === 0;
const unsigned = join(ROOT, 'release', 'TeleLibre-' + pkg.version + '-unsigned.wgt');

if (hasCli) {
  execSync('"' + cli + '" package -t wgt -s "' + profile + '" -- "' + dir + '"', { stdio: 'inherit' });
  const wgt = readdirSync(dir).find(f => f.endsWith('.wgt'));
  const out = join(ROOT, 'release', 'TeleLibre-' + pkg.version + '.wgt');
  renameSync(join(dir, wgt), out);
  console.log('\nListo (firmado con el perfil "' + profile + '"): ' + out);
} else {
  zipDir(dir, unsigned);
  console.log('\nNo encontré la CLI de Tizen; generé un .wgt SIN firmar: ' + unsigned);
  console.log('Instálalo con Apps2Samsung (opción "Custom WGT"), que lo firma con tu cuenta Samsung.');
}

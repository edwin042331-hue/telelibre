// Empaqueta para LG webOS: build/webos -> release/*.ipk (con la CLI oficial @webos-tools/cli).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, pkg, stage } from './pack-utils.mjs';

const dir = stage('webos');
const info = JSON.parse(readFileSync(join(ROOT, 'platforms/webos/appinfo.json'), 'utf8'));
info.version = pkg.version;
writeFileSync(join(dir, 'appinfo.json'), JSON.stringify(info, null, 2));

const cli = join(ROOT, 'node_modules/@webos-tools/cli/bin/ares-package.js');
execFileSync(process.execPath, [cli, dir, '-o', join(ROOT, 'release'), '--no-minify'], { stdio: 'inherit' });
console.log('\nListo: release/' + info.id + '_' + info.version + '_all.ipk');

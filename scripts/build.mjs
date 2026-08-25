import { build } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await build({ entryPoints: [resolve(root, 'src/server/index.js')], bundle: true, format: 'iife', target: 'es2020', outfile: resolve(dist, 'Bundle.js'), minify: false, legalComments: 'none' });
await cp(resolve(root, 'gas/Code.gs'), resolve(dist, 'Code.gs'));
await cp(resolve(root, 'web/Index.html'), resolve(dist, 'Index.html'));
const manifest = JSON.parse(await readFile(resolve(root, 'appsscript.json'), 'utf8'));
await writeFile(resolve(dist, 'appsscript.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Built Apps Script project in dist/');

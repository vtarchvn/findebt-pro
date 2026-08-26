import { transformAsync } from '@babel/core';
import presetEnv from '@babel/preset-env';
import { build } from 'esbuild';
import { parse } from 'espree';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await build({ entryPoints: [resolve(root, 'src/server/index.js')], bundle: true, format: 'iife', target: 'es2020', outfile: resolve(dist, 'Bundle.js'), minify: false, legalComments: 'none' });
await cp(resolve(root, 'gas/Code.gs'), resolve(dist, 'Code.gs'));
const indexTemplate = await readFile(resolve(root, 'web/Index.html'), 'utf8');
const appLogo = await readFile(resolve(root, 'web/assets/vtarch-symbol-256.png'));
const mainScriptStart = indexTemplate.lastIndexOf('<script>');
const mainScriptEnd = indexTemplate.indexOf('</script>', mainScriptStart);
if (mainScriptStart < 0 || mainScriptEnd < 0) throw new Error('Không tìm thấy script giao diện chính.');
const mainScript = indexTemplate.slice(mainScriptStart + '<script>'.length, mainScriptEnd);
const transpiled = await transformAsync(mainScript, {
  babelrc: false,
  configFile: false,
  comments: false,
  compact: false,
  sourceType: 'script',
  presets: [[presetEnv, { targets: { ie: '11' }, modules: false }]]
});
if (!transpiled?.code) throw new Error('Không thể chuyển mã giao diện sang ES5.');
parse(transpiled.code, { ecmaVersion: 5, sourceType: 'script' });
const compatibleTemplate = `${indexTemplate.slice(0, mainScriptStart)}<?!= include('Client'); ?>${indexTemplate.slice(mainScriptEnd + '</script>'.length)}`;
const indexHtml = compatibleTemplate.replaceAll('assets/vtarch-symbol-256.png', `data:image/png;base64,${appLogo.toString('base64')}`);
await writeFile(resolve(dist, 'Index.html'), indexHtml);
await writeFile(resolve(dist, 'Client.html'), `<script>\n(function(){var status=document.getElementById('startup-status');if(status)status.textContent='Client ES5 đã được chèn. Đang chạy ứng dụng…';})();\n</script>\n<script>\n${transpiled.code}</script>\n`);
const manifest = JSON.parse(await readFile(resolve(root, 'appsscript.json'), 'utf8'));
await writeFile(resolve(dist, 'appsscript.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Built Apps Script project in dist/');

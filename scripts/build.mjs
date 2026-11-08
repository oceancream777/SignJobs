import {build} from 'esbuild';
import {mkdir,copyFile,readdir,readFile,writeFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');process.chdir(root);
await rm('dist',{recursive:true,force:true});await mkdir('dist/wasm',{recursive:true});
for(const name of ['content','background','options','popup','offscreen','model-worker'])await build({entryPoints:[`src/${name}.ts`],outfile:`dist/${name}.js`,bundle:true,format:name==='content'?'iife':'esm',platform:'browser',target:'chrome120',minify:true,legalComments:'eof',sourcemap:false,conditions:['browser']});
for(const file of ['manifest.json','options.html','popup.html','offscreen.html','pages.css'])await copyFile(file,'dist/'+file);
for(const name of await readdir('node_modules/onnxruntime-web/dist'))if(/^ort-wasm.*\.(?:wasm|mjs)$/.test(name))await copyFile('node_modules/onnxruntime-web/dist/'+name,'dist/wasm/'+name);
await copyFile('src/model-manifest.json','dist/model-manifest.json');
const licenses=[];for(const pkg of ['@huggingface/transformers','onnxruntime-web','webextension-polyfill','@noble/hashes']){const p=JSON.parse(await readFile(`node_modules/${pkg}/package.json`));licenses.push(`${pkg} ${p.version} — ${p.license}`);for(const f of ['LICENSE','LICENSE.txt','LICENSE.md'])try{licenses.push(await readFile(`node_modules/${pkg}/${f}`,'utf8'));break;}catch{}}
await writeFile('dist/THIRD_PARTY_LICENSES.txt',licenses.join('\n\n'));
console.log('Built Brave MV3 extension: '+resolve('dist'));

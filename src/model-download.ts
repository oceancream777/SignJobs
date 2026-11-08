import {sha256} from '@noble/hashes/sha256';
import model from './model-manifest.json';
export const CACHE='signal-model-'+model.revision;
export const modelUrl=(path:string)=>`https://huggingface.co/${model.id}/resolve/${model.revision}/${path}`;
export const origins=['https://huggingface.co/*','https://cdn-lfs.huggingface.co/*','https://cdn-lfs-us-1.huggingface.co/*','https://cas-bridge.xethub.hf.co/*','https://us.aws.cdn.hf.co/*'];
const allowedHosts=new Set(origins.map(s=>new URL(s).hostname));
export async function download(progress:(done:number,total:number)=>void){
 const cache=await caches.open(CACHE);const total=model.files.reduce((n,f)=>n+f.size,0);let done=0;
 for(const file of model.files){const url=modelUrl(file.path);if(await cache.match(url)){done+=file.size;progress(done,total);continue;}
 const response=await fetch(url,{credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(240000)});
 if(!response.ok||!allowedHosts.has(new URL(response.url).hostname))throw Error('Model download failed or redirected to an unapproved host');
 const digest=sha256.create();let size=0;let last=0;
 const verified=response.body!.pipeThrough(new TransformStream<Uint8Array,Uint8Array>({transform(chunk,controller){size+=chunk.byteLength;if(size>file.size)throw Error('Model size exceeded pinned file size');digest.update(chunk);controller.enqueue(chunk);if(Date.now()-last>500){last=Date.now();progress(done+size,total);}},flush(){const actual=Array.from(digest.digest()).map(b=>b.toString(16).padStart(2,'0')).join('');if(size!==file.size||actual!==file.sha256)throw Error('Model hash verification failed');}}));
 // CacheStorage only commits a complete response; a failed stream cannot become a usable model file.
 await cache.put(url,new Response(verified,{headers:{'Content-Type':file.path.endsWith('.json')?'application/json':'application/octet-stream','Content-Length':String(file.size)}}));done+=file.size;progress(done,total);
 }
}
export async function removeModel(){for(const name of await caches.keys())if(name.startsWith('signal-model-'))await caches.delete(name);}

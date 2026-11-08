import {ROLE_PROMPT} from './role-reasoning';
import {pipeline,env} from '@huggingface/transformers';
import model from './model-manifest.json';
// This worker has no download capability. Every model response must already be in our verified cache.
env.allowRemoteModels=false;env.allowLocalModels=true;env.useBrowserCache=false;env.useCustomCache=true;env.useFSCache=false;
env.customCache={match:async(request:any)=>{const raw=typeof request==='string'?request:request.url;const prefix=`https://huggingface.co/${model.id}/resolve/${model.revision}/`;const path=raw.startsWith(prefix)?raw.slice(prefix.length):raw.includes(model.id+'/')?raw.split(model.id+'/').at(-1):'';if(!model.files.some(f=>f.path===path))return new Response(null,{status:404});return (await (await caches.open('signal-model-'+model.revision)).match(prefix+path))||new Response(null,{status:404});},put:async()=>{}} as any;
env.backends.onnx.wasm!.wasmPaths=new URL('./wasm/',self.location.href).href;env.backends.onnx.wasm!.numThreads=1;env.backends.onnx.wasm!.proxy=false;
let pipe:any=null;
self.onmessage=async(event:MessageEvent)=>{const {id,text}=event.data;try{
 if(!pipe){
  const gpu=(self.navigator as any).gpu,adapter=await gpu?.requestAdapter();
  if(!adapter?.features.has('shader-f16'))throw Error('This model requires WebGPU with shader-f16; local fallback retained.');
  pipe=await pipeline('text-generation',model.id,{revision:model.revision,dtype:'q4f16',device:'webgpu',local_files_only:true});
 }
 // Explicit template switch: passing chat messages to this pipeline would enable thinking by default.
 const prompt=pipe.tokenizer.apply_chat_template([{role:'system',content:ROLE_PROMPT},{role:'user',content:JSON.stringify({post:String(text).slice(0,4200)})}],{tokenize:false,add_generation_prompt:true,enable_thinking:false});
 const output=await pipe(prompt,{max_new_tokens:220,do_sample:true,temperature:0.7,top_p:0.8,top_k:20,return_full_text:false,add_special_tokens:false});

 const generated=output[0].generated_text;const textOut=typeof generated==='string'?generated:generated.at(-1).content;const match=textOut.match(/\{[\s\S]*\}/);if(!match)throw Error('Model did not return JSON');self.postMessage({id,result:JSON.parse(match[0])});
 }catch(e){self.postMessage({id,error:String(e).slice(0,160)});}};

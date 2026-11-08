let worker:Worker|null=null,busy=false,idle:ReturnType<typeof setTimeout>|null=null;
function resetIdle(){if(idle)clearTimeout(idle);idle=setTimeout(()=>{worker?.terminate();worker=null;void chrome.runtime.sendMessage({type:'close-model'}).catch(()=>{});},60*1000);}
chrome.runtime.onMessage.addListener((message,_sender,reply)=>{
 if(message.target!=='offscreen')return false;
 if(message.type==='unload'){worker?.terminate();worker=null;busy=false;resetIdle();reply({ok:true});return false;}
 if(message.type!=='generate')return false;
 if(busy){reply({error:'Another summary is running. Rules retained.'});return false;}busy=true;if(idle)clearTimeout(idle);
 worker ||= new Worker(chrome.runtime.getURL('model-worker.js'),{type:'module'});const active=worker;const id=crypto.randomUUID();
 const finish=(result:any)=>{clearTimeout(timeout);active.removeEventListener('message',listen);active.removeEventListener('error',fail);busy=false;resetIdle();reply(result);};
 const listen=(e:MessageEvent)=>{if(e.data.id===id)finish(e.data);};const fail=()=>{active.terminate();worker=null;finish({error:'On-device runtime failed; rules retained'});};
 const timeout=setTimeout(()=>{active.terminate();worker=null;finish({error:'90-second model limit reached; memory released'});},90000);
 active.addEventListener('message',listen);active.addEventListener('error',fail);active.postMessage({id,text:message.text});return true;
});resetIdle();

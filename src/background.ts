import {reasoningText} from './role-reasoning';
import api from './extension';
import {defaults,validateSettings,savedItem} from './settings';
import {summarize,applyModel} from './rules';
import {download,removeModel,origins} from './model-download';
import model from './model-manifest.json';
import type {Input,Settings,Saved} from './types';
let creating:Promise<void>|null=null,downloading=false;let storageChain=Promise.resolve();
async function settings():Promise<Settings>{const stored=((await api.storage.local.get('settings')).settings as Partial<Settings>)||{};return {...defaults,...stored,modelReady:stored.modelReady===true&&stored.modelRevision===model.revision};}
async function offscreen(){const url=api.runtime.getURL('offscreen.html');const exists=await chrome.runtime.getContexts({contextTypes:[chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],documentUrls:[url]});if(exists.length)return;if(!creating)creating=chrome.offscreen.createDocument({url:'offscreen.html',reasons:[chrome.offscreen.Reason.WORKERS],justification:'Run the user-approved on-device summary model in a worker, without any LinkedIn requests.'}).finally(()=>{creating=null;});await creating;}
const extensionSender=(sender:any)=>typeof sender.url==='string'&&sender.url.startsWith(api.runtime.getURL(''));
function validateInput(input:any):asserts input is Input {if(!input||typeof input.text!=='string'||input.text.length>100000||typeof input.postId!=='string'||input.postId.length>200||!Array.isArray(input.anchors)||input.anchors.length>500||!Array.isArray(input.comments)||input.comments.length>500)throw Error('Invalid or oversized post data');if(input.inspectionText!==undefined&&(typeof input.inspectionText!=='string'||input.inspectionText.length>100000))throw Error('Invalid inspection text');if(input.linkCandidates!==undefined&&(!Array.isArray(input.linkCandidates)||input.linkCandidates.length>500||input.linkCandidates.some((c:any)=>!c||typeof c.href!=='string'||c.href.length>4000||typeof c.text!=='string'||c.text.length>300||typeof c.context!=='string'||c.context.length>400||!['body','anchor','comment'].includes(c.source)||typeof c.evidence!=='string'||typeof c.afterCutoff!=='boolean')))throw Error('Invalid inspected links');}
async function handle(m:any,sender:any){
 if(m.target==='offscreen')return undefined;
 if(m.type==='settings')return {ok:true,settings:await settings()};
 if(m.type==='options'){await api.runtime.openOptionsPage();return {ok:true};}
 if(m.type==='rules'){validateInput(m.input);return {ok:true,result:summarize(m.input,await settings())};}
 if(m.type==='enrich'){validateInput(m.input);const s=await settings();if(s.mode!=='auto'||!s.modelReady)throw Error('On-device model is not enabled/downloaded');await offscreen();const result:any=await chrome.runtime.sendMessage({target:'offscreen',type:'generate',text:reasoningText(m.input)});if(result.error)throw Error(result.error);return {ok:true,result:applyModel(summarize(m.input,s),result.result,reasoningText(m.input),model.revision)};}
 if(m.type==='save'){const item=savedItem(m.item);storageChain=storageChain.catch(()=>{}).then(async()=>{const saved:Saved[]=((await api.storage.local.get('saved')).saved as Saved[])||[];await api.storage.local.set({saved:[item,...saved.filter(s=>s.postId!==item.postId)].slice(0,2000)});});await storageChain;return {ok:true};}
 if(!extensionSender(sender))throw Error('Settings and model actions require an extension page');
 if(m.type==='close-model'){await chrome.offscreen.closeDocument();return {ok:true};}
 if(m.type==='set-settings'){const current=await settings();const next=validateSettings({...m.settings,modelReady:current.modelReady,modelRevision:current.modelRevision});await api.storage.local.set({settings:next});return {ok:true};}
 if(m.type==='download'){if(downloading)throw Error('A download is already running');if(!await api.permissions.contains({origins}))throw Error('Model download permission was not granted');downloading=true;try{await download((done,total)=>{void api.storage.local.set({downloadProgress:{done,total,state:'downloading'}});});const current=await settings();await api.storage.local.set({settings:{...current,mode:'auto',modelReady:true,modelRevision:model.revision},downloadProgress:{state:'complete'}});return {ok:true};}catch(e){await api.storage.local.set({downloadProgress:{state:'failed',error:String(e)}});throw e;}finally{downloading=false;}}
 if(m.type==='delete-model'){if(downloading)throw Error('Wait for the current download to finish');try{await chrome.offscreen.closeDocument();}catch{}await removeModel();await api.storage.local.set({settings:{...await settings(),modelReady:false,mode:'rules'},downloadProgress:{state:'deleted'}});return {ok:true};}
 if(m.type==='delete-saved'){storageChain=storageChain.catch(()=>{}).then(async()=>{const saved=((await api.storage.local.get('saved')).saved as Saved[])||[];await api.storage.local.set({saved:saved.filter((s:Saved)=>s.postId!==m.postId)});});await storageChain;return {ok:true};}
 if(m.type==='import'){if(!m.data||m.data.version!==1||!Array.isArray(m.data.saved)||m.data.saved.length>2000)throw Error('Invalid export format');const saved=m.data.saved.map(savedItem);const next=validateSettings({...m.data.settings,modelReady:(await settings()).modelReady,modelRevision:(await settings()).modelRevision});await api.storage.local.set({settings:next,saved});return {ok:true};}
 throw Error('Unknown request');
}
api.runtime.onMessage.addListener((m:any,sender:any)=>{if(m.target==='offscreen')return undefined;return handle(m,sender).catch(e=>({ok:false,error:String(e).slice(0,200)}));});

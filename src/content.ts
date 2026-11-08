import api from './extension';
import {defaults} from './settings';
import {discover,read,inScope,hash,isSponsored} from './adapter';
import {withOutcome} from './rules';
import {el,shadowHost} from './ui';
import type {Summary,Settings} from './types';
type Card={host:HTMLElement;root:ShadowRoot;summary:Summary|null;signature:string;chip:HTMLButtonElement;preview:number|null;failed:boolean;reasoned?:string;reasoning?:boolean};
let settings:Settings=defaults,active=false,disabled=false,observer:MutationObserver|null=null,timer:ReturnType<typeof setTimeout>|null=null,scanBusy=false,needsScan=false,generation=0;
const resizeObserver=new ResizeObserver(()=>{layoutNotes();placePanel();});
const cards=new Map<HTMLElement,Card>();let frame=0;
let popup:{host:HTMLElement;root:ShadowRoot;card:HTMLElement;state:Card;dialog:HTMLElement;token:number}|null=null,popupToken=0;
const send=(m:any)=>api.runtime.sendMessage(m) as Promise<any>;
const stateSignature=(input:any)=>hash(JSON.stringify(input));
function schedule(){if(!active||disabled)return;if(scanBusy){needsScan=true;return;}if(timer)return;timer=setTimeout(()=>{timer=null;void scan();},120);}
function close(){if(!popup)return;const old=popup;popup=null;old.host.remove();old.state.chip.setAttribute('aria-expanded','false');if(old.state.chip.isConnected)old.state.chip.focus({preventScroll:true});}
// Absolute document coordinates preserve the post/summary offset through scrolling.
function layoutNotes(){
 const entries=[...cards].sort((a,b)=>a[0].getBoundingClientRect().top-b[0].getBoundingClientRect().top);
 const headerBottom=Math.max(0,...[...document.querySelectorAll<HTMLElement>('header,nav,[role="navigation"]')].filter(n=>['fixed','sticky'].includes(getComputedStyle(n).position)).map(n=>{const r=n.getBoundingClientRect();return r.top<=1&&r.height<240?r.bottom:0;}));
 for(let i=0;i<entries.length;i++){const [card,state]=entries[i],r=card.getBoundingClientRect(),next=entries[i+1]?.[0].getBoundingClientRect();
 const left=r.right+18,width=Math.min(440,innerWidth-left-16),height=Math.max(0,Math.min(r.height-16,next?next.top-r.top-16:r.height-16));
 const room=width>=200&&height>=50;
 const top=r.top+8,clipTop=Math.max(0,headerBottom-top),clipBottom=0;
 state.host.style.cssText=`position:absolute!important;left:${left+scrollX}px!important;top:${top+scrollY}px!important;width:${Math.max(0,width)}px!important;max-height:${height}px!important;overflow:auto!important;overflow-x:hidden!important;z-index:2147483000!important;display:${room?'block':'none'}!important;clip-path:inset(${clipTop}px 0 ${clipBottom}px 0)!important`;
 state.host.style.clipPath=`inset(${clipTop}px 0 ${Math.max(0,top+state.host.getBoundingClientRect().height-innerHeight)}px 0)`;
 }
}
function queueLayout(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;layoutNotes();placePanel();});}
function restore(){generation++;observer?.disconnect();observer=null;if(timer)clearTimeout(timer);timer=null;if(frame)cancelAnimationFrame(frame);frame=0;close();for(const s of cards.values())s.host.remove();cards.clear();resizeObserver.disconnect();}

function explanation(summary:Summary){const box=el('div',undefined,'role-explanation'),r=summary.roleExplanation;if(!r)return box;
 box.setAttribute('role','note');box.setAttribute('aria-label',r.basis==='inferred'?'Role-based interpretation':'Role overview');box.title=r.basis==='inferred'?'Tasks inferred from the role and post context.':'Overview of tasks described in the post.';for(const line of [r.work,r.context]){const p=el('p',line,'role-line');box.append(p);}return box;}
let reasoningBusy=false;
async function reasonVisible(){if(reasoningBusy||!active||disabled||settings.mode!=='auto'||!settings.modelReady)return;reasoningBusy=true;
 try{for(const [card,state]of cards){const r=card.getBoundingClientRect();if(!card.isConnected||r.bottom<=0||r.top>=innerHeight||!state.summary||state.summary.applicationStatus==='closed'||state.reasoned===state.signature)continue;
 const signature=state.signature;state.reasoned=signature;state.reasoning=true;row(card,state);queueLayout();
 try{const reply=await send({type:'enrich',input:read(card,state.preview)});if(reply.ok&&cards.get(card)===state&&state.signature===signature){state.summary=reply.result;if(popup?.state===state)panelContent(state.summary!,'Local role interpretation · inferred');}}catch{}finally{state.reasoning=false;if(cards.get(card)===state){row(card,state);queueLayout();if(popup?.state===state)panelContent(state.summary!,state.summary?.source==='on-device'?'Local role interpretation · inferred':'Local fallback · model interpretation unavailable');}}
 if(!active||disabled||settings.mode!=='auto')break;
 }}finally{reasoningBusy=false;}}
function emailActions(summary:Summary){const box=el('div',undefined,'email-actions');if(summary.applicationStatus==='closed'||summary.links.some(l=>l.isApplication))return box;
 for(const contact of summary.emails||[]){const item=el('div',undefined,'email-item'),address=el('span',contact.address,'email-address'),copy=el('button','Copy email','copy-email');copy.setAttribute('aria-label','Copy email '+contact.address);copy.title=contact.source==='comment'?'Found in loaded comments':contact.address;copy.onclick=async()=>{try{await navigator.clipboard.writeText(contact.address);copy.textContent='Copied';}catch{copy.textContent='Select and copy';const range=document.createRange();range.selectNodeContents(address);const selection=address.getRootNode() instanceof ShadowRoot?(address.getRootNode() as any).getSelection?.()||window.getSelection():window.getSelection();selection?.removeAllRanges();selection?.addRange(range);}};item.append(address,copy);box.append(item);}return box;
}
function row(card:HTMLElement,state:Card){
 const s=state.summary,box=el('section',undefined,'note');box.setAttribute('aria-label','Hiring summary');box.setAttribute('aria-busy',String(!s&&!state.failed));
 const chip=el('button',s?.company||s?.roleTitle|| (state.failed?'Retry summary':'Reading post…'),'note-title');chip.setAttribute('aria-haspopup','dialog');chip.setAttribute('aria-expanded','false');state.chip=chip;if(s){chip.setAttribute('aria-label',s.roleTitle);if(s.company)chip.setAttribute('aria-description','Company: '+s.company);}
 chip.onclick=()=>{if(state.failed){state.signature='';schedule();}else void openPanel(card,state);};box.append(chip);
 if(!s&&!state.failed){const loading=el('div','Processing this post…','loading');loading.setAttribute('role','status');box.append(loading);}
 if(s){
 if(s.company&&s.roleTitle!==s.company)box.append(el('p',s.roleTitle,'note-role'));
 if(s.author&&s.author!=='Author not detected')box.append(el('p',s.author,'note-author'));
 // Avoid a duplicated title and long missing-data boilerplate in the compact view.
 box.append(explanation(s));if(state.reasoning){const loading=el('span','Interpreting role…','loading');loading.setAttribute('role','status');box.append(loading);}
 const actions=el('div',undefined,'note-actions');
 if(s.applicationStatus==='closed')actions.append(el('strong','Applications closed','closed-label'));
 for(const [i,link] of (s.applicationStatus==='closed'?[]:s.links).entries()){const a=el('a',link.isApplication!==false?(i===0?'Apply ↗':'Apply '+(i+1)+' ↗'):'Open link ↗','apply');a.href=link.url;a.target='_blank';a.rel='noopener noreferrer';a.title=link.display+(link.source==='comment'?' · Found in loaded comments':'');actions.append(a);}
 if(s.applicationStatus!=='closed'&&s.linkInComments&&!s.links.some(l=>l.source!=='comment'))actions.append(el('span','Link in comments','note-outcome'));
 if(s.applicationStatus!=='closed'&&s.needsDM)actions.append(el('span','Need to DM','note-outcome'));
 if(s.applicationStatus!=='closed'&&!s.links.length&&!s.emails?.length&&!s.linkInComments&&!s.needsDM)actions.append(el('span',s.linkState==='incomplete'?'Inspection limited · expand post':s.textTruncated?'Link not loaded · expand post':'No application link found','note-outcome'));
 box.append(actions,emailActions(s));
 }
 const surface=el('div',undefined,'note-surface');surface.append(...Array.from(box.childNodes));box.append(surface);state.root.querySelector('.note')?.remove();state.root.append(box);
}

async function scan(){if(scanBusy||!active||disabled)return;scanBusy=true;const epoch=generation;
 try{const found=discover(document,cards.keys());for(const [c,s] of cards)if(!c.isConnected||!found.includes(c)||!s.host.isConnected||isSponsored(c)){if(popup?.card===c)close();s.host.remove();c.removeAttribute('data-signal-collapsed');c.removeAttribute('data-signal-filtered');resizeObserver.unobserve(c);cards.delete(c);}
 const ordered=found.sort((a,b)=>{const priority=(n:HTMLElement)=>{const r=n.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight?Math.max(0,r.top):10000+Math.abs(r.top);};return priority(a)-priority(b);});let processed=0;
 // Mount every pending indicator before awaiting the first classifier response.
 for(const card of ordered)if(!cards.has(card)){const {host,root}=shadowHost();host.setAttribute('data-signal-note','');const state:Card={host,root,summary:null,signature:'',chip:el('button'),preview:null,failed:false};cards.set(card,state);resizeObserver.observe(card);document.documentElement.append(host);row(card,state);}
 layoutNotes();await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
 for(const card of ordered){if(epoch!==generation||disabled||!active)break;let state=cards.get(card);
 try{const input=read(card,state?.preview);const signature=stateSignature(input);if(state?.signature===signature)continue;if(popup?.card===card)close();
 if(!state){const {host,root}=shadowHost();state={host,root,summary:null,signature:'',chip:el('button'),preview:input.previewLength,failed:false};cards.set(card,state);resizeObserver.observe(card);host.setAttribute('data-signal-note','');document.documentElement.append(host);row(card,state);}
 const reply=await send({type:'rules',input});if(epoch!==generation||!card.isConnected)break;if(!reply.ok)throw Error(reply.error);state.summary=reply.result;state.signature=signature;state.preview=input.previewLength;state.failed=false;row(card,state);queueLayout();
 }catch{if(state){state.failed=true;state.summary=null;row(card,state);queueLayout();}}
 if(++processed%8===0)await new Promise<void>(resolve=>{if('requestIdleCallback'in window)requestIdleCallback(()=>resolve(),{timeout:100});else setTimeout(resolve,0);});}
 layoutNotes();void reasonVisible();
 }catch(error){console.warn('Signal: post processing interrupted',error);}finally{scanBusy=false;if(needsScan){needsScan=false;schedule();}}
}
function placePanel(){if(!popup)return;const anchor=popup.state.host.getBoundingClientRect(),post=popup.card.getBoundingClientRect(),box=popup.dialog;
 box.style.left=anchor.left+'px';box.style.width=anchor.width+'px';box.style.top=Math.max(0,post.top+8)+'px';box.style.maxHeight=Math.max(0,Math.min(post.bottom,innerHeight-12)-Math.max(0,post.top+8))+'px';if(!popup.card.isConnected||post.bottom<0||post.top>innerHeight)close();}

function panelContent(summary:Summary,status:string){if(!popup)return;const {dialog,state}=popup;dialog.replaceChildren();dialog.setAttribute('aria-label',summary.roleTitle);const x=el('button','×','close');x.setAttribute('aria-label','Close role summary');x.onclick=close;dialog.append(x,el('h3',summary.category+(summary.badges.length?' · '+summary.badges.join(' · '):'')),el('h2',summary.roleTitle),el('p',[summary.company||'Company not stated',summary.location||'Location not stated',summary.employmentType,summary.experience].filter(Boolean).join(' · '),'meta'),explanation(summary));
 const outcomes=[];if(summary.linkInComments&&!summary.links.some(l=>l.source!=='comment'))outcomes.push('Link in comments');if(summary.needsDM)outcomes.push('Need to DM');if(outcomes.length)dialog.append(el('p',outcomes.join(' · '),'outcome'));
 if(summary.applicationStatus==='closed')dialog.append(el('p','Applications closed','closed-label'));
 if(summary.applicationStatus!=='closed'&&!summary.links.length&&!summary.emails?.length){dialog.append(el('p',summary.baitMarker==='continues'?'Post continues. The link is not in the available text.':summary.linkInComments?'The author says the link is in the comments. Open the post to find it.':summary.needsDM?'The author asks you to contact them directly.':'No application link found in the available post text.','hint'));}
 (summary.applicationStatus==='closed'?[]:summary.links).forEach((l,i)=>{const a=el('a',`${i===0&&l.kind!=='External link'?'Open application link':'Open link'} ↗ · ${l.kind}`,'link'+(i?' secondary':''));a.href=l.url;a.target='_blank';a.rel='noopener noreferrer';a.title=l.display;dialog.append(a,el('p',`${l.display}\n${l.source==='comment'?'Found in comments already loaded by you; verify the commenter.':l.afterCutoff?'Recovered from hidden post DOM.':'Found in this post’s DOM.'}`,'hint'));});
 dialog.append(emailActions(summary));
 const actions=el('div',undefined,'actions');if(summary.postUrl){const open=el('a','Open post ↗');open.href=summary.postUrl;open.target='_blank';open.rel='noopener noreferrer';actions.append(open);}
 for(const mode of ['saved','applied'] as const){const b=el('button',mode==='saved'?'Save':'Applied');b.onclick=async()=>{const reply=await send({type:'save',item:{postId:summary.postId,postUrl:summary.postUrl,roleTitle:summary.roleTitle,company:summary.company,applyUrl:summary.links[0]?.url||null,status:mode,timestamp:new Date().toISOString()}});b.textContent=reply.ok?'Saved locally':'Could not save';};actions.append(b);}
 dialog.append(actions,el('p',status,'status'));state.chip.setAttribute('aria-expanded','true');placePanel();
}
async function openPanel(card:HTMLElement,state:Card){if(!state.summary)return;close();const token=++popupToken;const {host,root}=shadowHost();const dialog=el('section',undefined,'dialog');dialog.setAttribute('role','dialog');dialog.tabIndex=-1;root.append(dialog);document.body.append(host);popup={host,root,card,state,dialog,token};panelContent(state.summary,state.summary.source==='on-device'?'Local role interpretation · inferred':state.reasoning?'Interpreting on your device…':'Local role fallback');dialog.focus({preventScroll:true});
 if(settings.mode!=='auto'||!settings.modelReady||state.reasoned===state.signature)return;
 try{state.reasoned=state.signature;const input=read(card,state.preview);const reply=await send({type:'enrich',input});if(!popup||popup.token!==token||!state.summary)return;if(reply.ok){state.summary={...state.summary,...reply.result};state.summary!.summary=withOutcome(state.summary!);row(card,state);queueLayout();panelContent(state.summary!,'Generated on your device · '+reply.result.modelRevision.slice(0,8));}else panelContent(state.summary,'Model summary unavailable · '+reply.error);}catch{if(popup?.token===token&&state.summary)panelContent(state.summary,'Model summary unavailable · rules retained');}
}
function activate(){if(!inScope()||disabled)return;active=true;observer=new MutationObserver(records=>{if(records.some(r=>!(r.target instanceof Element&&r.target.closest('[data-signal-host]'))&&[...r.addedNodes,...r.removedNodes].some(n=>!(n instanceof Element&&n.hasAttribute('data-signal-host')))||r.type==='characterData'||r.type==='attributes'&&r.target instanceof Element&&!r.target.closest('[data-signal-host]')))schedule();});observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['href','data-href','data-url','data-target-url','data-redirect-url','data-navigation-url','formaction','title','aria-label','hidden','aria-expanded']});schedule();}
function route(){const next=inScope();if(next&&!active&&!disabled&&settings.enabled)activate();else if(!next&&active){active=false;restore();}}
api.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.settings){settings={...defaults,...(changes.settings.newValue as Partial<Settings>)};disabled=!settings.enabled;active=false;restore();route();}});
document.addEventListener('pointerdown',e=>{if(popup&&!e.composedPath().includes(popup.host)&&!e.composedPath().includes(popup.state.host))close();},true);
document.addEventListener('keydown',e=>{if(!active||disabled)return;const focused=e.composedPath()[0] as HTMLElement;if(focused?.matches?.('input,textarea,select,[contenteditable="true"]')||e.ctrlKey||e.metaKey||e.altKey)return;if(e.key==='Escape'&&popup){e.preventDefault();close();return;}if(popup){if(e.key==='Tab'){const items=[...popup.dialog.querySelectorAll<HTMLElement>('button,a[href]')];const idx=items.indexOf(popup.root.activeElement as HTMLElement);if(e.shiftKey&&idx<=0){e.preventDefault();items.at(-1)?.focus();}else if(!e.shiftKey&&idx===items.length-1){e.preventDefault();items[0]?.focus();}}return;}
 const visible=[...cards.entries()].filter(([c,s])=>{const r=c.getBoundingClientRect();return s.host.style.display!=='none'&&r.bottom>0&&r.top<innerHeight;});const idx=visible.findIndex(([,s])=>s.root.activeElement===focused||s.chip===focused);if((e.key==='j'||e.key==='k')&&visible.length){e.preventDefault();visible[Math.min(visible.length-1,Math.max(0,idx+(e.key==='j'?1:-1)))][1].chip.focus({preventScroll:true});}
 if(e.key==='o'&&idx>=0){const s=visible[idx][1];if(s.summary?.applicationStatus!=='closed'&&s.summary?.links[0]){e.preventDefault();window.open(s.summary.links[0].url,'_blank','noopener,noreferrer');}}
},true);
window.addEventListener('scroll',()=>{queueLayout();void reasonVisible();},{passive:true,capture:true});window.addEventListener('resize',()=>{queueLayout();schedule();});window.addEventListener('popstate',route);setInterval(route,750);
void send({type:'settings'}).then(r=>{settings=r.settings||defaults;route();}).catch(()=>{settings=defaults;route();});

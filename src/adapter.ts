import {inspectPostLinks} from './inspect-links';
import {hasDiscoveryCue} from './vocabulary';
import type {Input} from './types';
export const SELECTOR_VERSION='2026-11-07.1';
const selectors={card:'[data-urn^="urn:li:activity:"], [data-id^="urn:li:activity:"], [data-view-name="feed-full-update"], [data-view-name="feed-update"], .feed-shared-update-v2, .occludable-update, article',body:'[data-test-id="main-feed-activity-card__commentary"], [data-test-id="post-text"], [data-view-name="feed-update-text"], [data-view-name="post-text"], [class*="update-components-text"], [class*="feed-shared-update-v2__description"], [class*="update-components-update-v2__commentary"], [class*="feed-shared-inline-show-more-text"]',author:'[data-test-id="author-name"], [data-view-name="feed-update-author"], .update-components-actor__title .visually-hidden, .update-components-actor__title, .feed-shared-actor__name',comments:'.comments-comment-item, [data-test-id="comment"]',more:'[data-test-id="see-more"], [aria-label*="more" i], [aria-expanded="false"], .feed-shared-inline-show-more-text__see-more-less-toggle, .inline-show-more-text__button'};
export function inScope(url=location.href){try{const u=new URL(url);return u.origin==='https://www.linkedin.com'&&/^\/search\/results\/content\/?$/.test(u.pathname);}catch{return false;}}

const textOf=(el:Element)=>el.textContent?.replace(/[’‘]/g,"'").trim()||'';
const bodies=new WeakMap<HTMLElement,HTMLElement>();
export let discoveryStatus='Waiting for rendered text';
/** Text seeds identify posts; geometry chooses the observed feed column. */
export function discover(root:ParentNode=document,known:Iterable<HTMLElement>=[]):HTMLElement[]{
 const retained=[...known].filter(el=>el.isConnected&&bodies.has(el)&&!isSponsored(el));
 const seeds=new Set<HTMLElement>();const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n:Node|null;
 while((n=walker.nextNode())){
  const el=n.parentElement;if(!el||el.closest('[data-signal-host],nav,header,footer,aside,button,input,textarea,script,style,[role="navigation"],[role="complementary"],[contenteditable="true"]'))continue;
  if(!hasDiscoveryCue(n.textContent||''))continue;
  const r=el.getBoundingClientRect(),style=getComputedStyle(el);if(r.width<30||r.height<8||style.visibility==='hidden'||style.display==='none'||r.right<0||r.left>window.innerWidth*.8)continue;
  let body=el;while(body.parentElement&&['inline','contents'].includes(getComputedStyle(body).display))body=body.parentElement;
  if(textOf(body).length>=8&&textOf(body).length<20000)seeds.add(body);
 }
 const initial=[...seeds];
 const candidates=initial.map(seed=>{
  const locked=retained.find(region=>region.contains(seed));if(locked)return locked;
  // Recover the visible rounded post surface from its text, independent of class names.
  for(let node:HTMLElement|null=seed,depth=0;node&&depth<10;node=node.parentElement,depth++){
   if(node===document.body||node.matches('main,aside,header,footer,nav,[role="main"]'))break;
   const r=node.getBoundingClientRect(),cs=getComputedStyle(node);
   if(r.width>Math.min(window.innerWidth*.75,1150))break;
   if(r.width>=Math.min(300,window.innerWidth*.3)&&r.height>=100&&parseFloat(cs.borderRadius)>=6&&(parseFloat(cs.borderTopWidth)>0||cs.backgroundColor!==getComputedStyle(node.parentElement||node).backgroundColor))return node;
  }
  let node=seed;const base=seed.getBoundingClientRect();
  for(let depth=0;depth<8&&node.parentElement;depth++){
   const parent=node.parentElement;if(parent===document.body||parent.matches('main,[role="main"],nav,aside,header,footer'))break;
   const r=parent.getBoundingClientRect();if(r.width>Math.min(window.innerWidth*.72,1100)||r.width<base.width*.8||textOf(parent).length>24000)break;
   const others=initial.filter(x=>x!==seed&&!seed.contains(x)&&!x.contains(seed)&&parent.contains(x)&&!node.contains(x));
   if(others.some(x=>{const a=x.getBoundingClientRect();return Math.abs(a.left-base.left)>60||Math.abs(a.top-base.top)>300;}))break;
   // A vertical gap between sibling regions is a post boundary; never climb into the feed column.
   const children=[...parent.children].filter(x=>!x.hasAttribute('data-signal-host'));
   if(children.some(x=>x!==node&&x.matches('div,section,article')&&x.getBoundingClientRect().height>=120&&x.getBoundingClientRect().width>=base.width*.8&&hasDiscoveryCue(textOf(x))&&Math.abs(x.getBoundingClientRect().top-node.getBoundingClientRect().top)>40))break;
   if(parent.querySelectorAll('time').length>1)break;
   node=parent;
  }return node;
 });
 const unique=[...new Set(candidates)].filter(x=>!candidates.some(y=>y!==x&&y.contains(x)));
 const bins=new Map<number,number>();for(const node of unique){const k=Math.round(node.getBoundingClientRect().left/48);bins.set(k,(bins.get(k)||0)+Math.min(textOf(node).length,800));}
 const best=[...bins].sort((a,b)=>b[1]-a[1])[0]?.[0];const found=unique.filter(node=>(best===undefined||Math.abs(node.getBoundingClientRect().left-best*48)<100)&&!isSponsored(node));
 for(const node of found)bodies.set(node,node.querySelector<HTMLElement>(selectors.body)||node);
 discoveryStatus=`Text scan: ${seeds.size} matching blocks · ${found.length} regions${best===undefined?'':` · column near x=${best*48}px`}`;
 return [...new Set([...retained,...found])];
}
export function hash(s:string){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
export function bodyOf(card:HTMLElement){return bodies.get(card)||card.querySelector<HTMLElement>(selectors.body)||(hasDiscoveryCue(textOf(card))?card:null);}
export function authorOf(card:HTMLElement){
 const clean=(s:string)=>s.replace(/\s+/g,' ').replace(/\s*[·•]\s*(?:\d(?:st|nd|rd|th)\+?|Following).*$/i,'').replace(/\s+(?:View|Verified).*$/i,'').trim().slice(0,100);
 const known=card.querySelector(selectors.author);if(known){const name=clean(known.textContent||'');if(name)return name;}
 // Profile links above the commentary are stronger evidence than arbitrary text.
 const body=bodyOf(card),bodyTop=body?.getBoundingClientRect().top??Infinity;
 for(const a of card.querySelectorAll<HTMLAnchorElement>('a[href]')){
  let path='';try{path=new URL(a.href).pathname;}catch{continue;}
  if(!/^\/(?:in|company)\//.test(path)||a.closest(selectors.comments)||a.getBoundingClientRect().top>bodyTop+4&&body!==card)continue;
  const visible=a.querySelector('[aria-hidden="true"]')?.textContent||a.textContent||'';
  const name=clean(visible);if(name&&name.length<=100&&!/^(?:follow|view profile|visit|message)$/i.test(name))return name;
  const label=a.getAttribute('aria-label')||a.querySelector('img')?.getAttribute('alt')||'';
  const fallback=clean(label.replace(/^(?:view|visit)\s+/i,'').replace(/(?:[’']s)?\s+(?:profile|photo).*$/i,''));if(fallback)return fallback;
 }
 return '';
}

export function postId(card:HTMLElement,text:string){const urn=[card.getAttribute('data-urn'),card.getAttribute('data-id'),card.querySelector('[data-urn^="urn:li:activity:"]')?.getAttribute('data-urn')].find(s=>/^urn:li:activity:\d+$/.test(s||''));return urn||'post:'+hash(authorOf(card)+'|'+text.slice(0,200));}
function cleanText(el:HTMLElement,excludeComments=false){const copy=el.cloneNode(true) as HTMLElement;if(excludeComments)copy.querySelectorAll(selectors.comments).forEach(e=>e.remove());copy.querySelectorAll('p,div,li').forEach(e=>e.append(document.createTextNode('\n')));copy.querySelectorAll('br').forEach(e=>e.replaceWith(document.createTextNode('\n')));copy.querySelectorAll('button,script,style,[aria-hidden="true"], [data-signal-host]').forEach(e=>e.remove());return copy.textContent?.trim()||'';}
// Determine the CSS clamp boundary without changing visibility or pressing the native 'more' button.
export function clampOffset(body:HTMLElement,text:string):number|null {
 const rect=body.getBoundingClientRect();if(rect.height<1)return null;
 const cs=getComputedStyle(body);const clamp=Number(cs.getPropertyValue('-webkit-line-clamp'));const clips=body.scrollHeight>body.clientHeight+2||(clamp>0&&clamp<100);
 if(!clips)return null;
 const walker=document.createTreeWalker(body,NodeFilter.SHOW_TEXT);let offset=0,node:Node|null;
 while((node=walker.nextNode())){const len=node.textContent?.length||0;if(!len)continue;const range=document.createRange();let lo=0,hi=len;
 while(lo<hi){const mid=Math.floor((lo+hi)/2);range.setStart(node,mid);range.setEnd(node,Math.min(mid+1,len));const r=range.getBoundingClientRect();if(r.bottom<=rect.bottom+1&&r.height>0)lo=mid+1;else hi=mid;}
 if(lo<len)return Math.min(text.length,offset+lo);offset+=len;
 }return null;
}
export function read(card:HTMLElement,previousPreview?:number|null):Input {
 const body=bodyOf(card);if(!body)throw Error('Post text container not found');
 const text=cleanText(body,true);if(!text)throw Error('Post has no readable text');
 const postID=postId(card,text),author=authorOf(card),previewLength=card.hasAttribute('data-signal-collapsed')?previousPreview??null:clampOffset(body,text);
 const nativeMore=[...card.querySelectorAll(selectors.more+',button,[role="button"]')].some(el=>!el.closest(selectors.comments)&&[el.textContent,el.getAttribute('aria-label')].some(value=>/^(?:…|\.\.\.)?\s*(?:(?:see|show|read)\s+)?more(?:\s+of\s+(?:this|the)\s+post(?:\s+text)?)?\s*$/i.test(value?.trim()||'')));const rect=body.getBoundingClientRect();
 const anchors=[...body.querySelectorAll<HTMLAnchorElement>('a[href]')].filter(a=>!a.closest(selectors.comments)).map(a=>({href:a.href,text:a.textContent||'',afterCutoff:previewLength!==null&&text.indexOf(a.textContent||a.href)>=previewLength||!card.hasAttribute('data-signal-collapsed')&&rect.height>0&&a.getBoundingClientRect().bottom>rect.bottom+1}));
 const comments=[...card.querySelectorAll<HTMLElement>(selectors.comments)].filter(c=>!c.closest('[hidden]')).map(c=>({text:cleanText(c),anchors:[...c.querySelectorAll<HTMLAnchorElement>('a[href]')].map(a=>({href:a.href,text:a.textContent||'',afterCutoff:false}))}));
 const inspection=inspectPostLinks(card,body,selectors.comments);
 const nativeLink=[...card.querySelectorAll<HTMLAnchorElement>('a[href]')].find(a=>/linkedin\.com\/(?:feed\/update\/urn:li:activity:\d+|posts\/)/.test(a.href));
 const postUrl=nativeLink?.href||(/^urn:li:activity:\d+$/.test(postID)?'https://www.linkedin.com/feed/update/'+postID+'/':null);
 return {postId:postID,author,postUrl,text,previewLength,textTruncated:nativeMore||previewLength!==null,inspectionText:inspection.inspectionText,linkCandidates:inspection.candidates,linkInspection:{examined:inspection.examined,limited:inspection.limited},anchors,comments};
}

/** Ad labels only: never suppress a role merely for mentioning visa sponsorship. */
export function isSponsored(region:HTMLElement){
 if(region.matches('[data-ad-id],[data-sponsored="true"],[data-is-sponsored="true"]')||region.querySelector('[data-ad-id],[data-sponsored="true"],[data-is-sponsored="true"]'))return true;
 const labels=[region,...region.querySelectorAll('span,div,p,a,small')];
 return labels.some(node=>{const aria=node.getAttribute('aria-label')?.trim()||'';if(/^(?:sponsored|promoted|advertisement)(?: content| post)?$/i.test(aria))return true;
 const text=node.textContent?.trim()||'';return text.length<=45&&/^(?:sponsored|promoted|advertisement|ad)(?:\s*[·•]\s*.*)?$/i.test(text);});
}

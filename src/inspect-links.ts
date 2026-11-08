import {extractEmails} from './contact';
import type {LinkCandidate} from './types';
/** Inspect only this post's DOM, including CSS/attribute-hidden descendants. Never click or fetch. */
const attributes=['href','data-href','data-url','data-target-url','data-redirect-url','data-navigation-url','formaction'] as const;
export function urlsInText(text:string){return [...text.matchAll(/https?:\/\/[^\s<>"\u201c\u201d]+/gi)].map(m=>({url:m[0],index:m.index!}));}

export function inspectPostLinks(card:HTMLElement,body:HTMLElement,commentSelector:string){
 const candidates:LinkCandidate[]=[],seen=new Set<string>();let examined=0,limited=false,signalSize=0;const signalText:string[]=[];
 const bodyRect=body.getBoundingClientRect();
 const afterCutoff=(node:Element,forced:boolean)=>{if(forced)return true;for(let p:Element|null=node;p&&card.contains(p);p=p.parentElement){const s=getComputedStyle(p);if(p.hasAttribute('hidden')||p.getAttribute('aria-hidden')==='true'||s.display==='none'||s.visibility==='hidden')return true;
  if(/hidden|clip/.test(s.overflow+s.overflowY)){const a=node.getBoundingClientRect(),r=p.getBoundingClientRect();if(a.bottom>r.bottom+1)return true;}}
 return body.contains(node)&&bodyRect.height>0&&node.getBoundingClientRect().bottom>bodyRect.bottom+1;
 };
 const add=(raw:string,node:Element,source:LinkCandidate['source'],evidence:string,hidden:boolean,label:string)=>{
  let href=raw.trim();if(href.startsWith('/')&&!href.startsWith('//'))href=new URL(href,document.baseURI).href;
  // Never infer destinations from arbitrary attributes, JS handlers, React state, or tracking payloads.
  if(!/^(?:https?:\/\/|mailto:)/i.test(href)||href.length>4000)return;
  const key=source+'|'+href+'|'+evidence;if(seen.has(key))return;seen.add(key);
  if(candidates.length>=500){limited=true;return;}
  const context=(node.parentElement?.textContent||node.textContent||'').replace(/\s+/g,' ').slice(0,400);
  candidates.push({href,text:label.slice(0,300),context,source,evidence,afterCutoff:afterCutoff(node,hidden)});
 };
 const visit=(root:ParentNode,source:LinkCandidate['source']='anchor',hidden=false)=>{
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);let item:Node|null;
  while((item=walker.nextNode())){
   if(++examined>6000){limited=true;break;}
   const node=item.nodeType===1?item as Element:item.parentElement;if(!node||node.closest('[data-signal-host],script,style,noscript,nav,footer'))continue;
   const comment=node.closest(commentSelector);const origin=comment?'comment':source;
   if(item.nodeType===3){if(origin!=='comment'&&signalSize<100000){const text=(item.textContent||'').slice(0,100000-signalSize);signalText.push(text);signalSize+=text.length+1;}for(const email of extractEmails(item.textContent||''))add('mailto:'+email,node,origin==='comment'?'comment':'body','text',hidden,item.textContent||'');for(const {url} of urlsInText(item.textContent||''))add(url,node,origin==='comment'?'comment':'body','text',hidden,item.textContent||'');continue;}
   const label=node.getAttribute('aria-label')||node.textContent||'';
   for(const attr of attributes){const raw=node.getAttribute(attr);if(raw)add(raw,node,origin,attr,hidden,label);}
   for(const attr of ['title','aria-label'])for(const {url} of urlsInText(node.getAttribute(attr)||''))add(url,node,origin,attr,hidden,label);
   // Read already-existing open DOM only, including a post's own inert full-text template.
   if(node.shadowRoot)visit(node.shadowRoot,origin,hidden);
   if(node.tagName==='TEMPLATE'&&body.contains(node))visit((node as HTMLTemplateElement).content,origin,true);
  }
 };
 visit(card);return {candidates,examined,limited,inspectionText:signalText.join('\n').slice(0,100000)};
}

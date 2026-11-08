import type {Input} from './types';
export type EmailContact={address:string;source:'body'|'anchor'|'comment'};
/** Common internet mailbox syntax, including plus tags, subdomains and IDN domains. No DNS/mailbox validation. */
export function extractEmails(text:string):string[]{
 const result:string[]=[];
 const plain=text.replace(/https?:\/\/[^\s<>]+/gi,'');
 const pattern=/(?:"[^"\r\n]+"|[\p{L}\p{N}\p{M}.!#$%&'*+\/=?^_`{|}~-]+)@[\p{L}\p{N}\p{M}-]+(?:\.[\p{L}\p{N}\p{M}-]+)+/gu;
 for(const match of plain.matchAll(pattern)){const address=match[0],at=address.lastIndexOf('@'),local=address.slice(0,at),domain=address.slice(at+1);
  if(address.length>254||local.length>64||(!local.startsWith('"')&&(local.startsWith('.')||local.endsWith('.')||local.includes('..'))))continue;
  if(match.index!>0&&/[\p{L}\p{N}@]/u.test(plain[match.index!-1]))continue;
  let ascii='';try{ascii=new URL('https://'+domain).hostname;}catch{continue;}
  const labels=ascii.split('.');if(labels.some(s=>s.length>63||!s||s.startsWith('-')||s.endsWith('-'))||!/[a-z]/i.test(labels.at(-1)!)||labels.at(-1)!.length<2)continue;
  if(!result.some(s=>s.toLowerCase()===address.toLowerCase()))result.push(address);
 }return result;
}
function mailIntent(text:string){
 // Require an affirmative instruction in the address's sentence/clause.
 const clauses=text.split(/(?<=[.!?;])\s+|;/);
 return clauses.some(clause=>{
  if(/\b(?:do not|don't|dont|never|avoid)\b.{0,65}\b(?:e-?mail|mail|send|share|submit|forward)\b|\b(?:e-?mails?|mail)\s+(?:is|are)\s+not\s+(?:accepted|allowed|required)\b/i.test(clause))return false;
  return /\b(?:e-?mail|mail)\b.{0,90}\b(?:cv|resume|résumé|application|apply|profile|me|us|at|to)\b|\b(?:send|share|submit|forward|drop)\b.{0,60}\b(?:cv|resume|résumé|application|profile)\b|\bapply\b.{0,35}\b(?:by|via|through|at|to)\b|\b(?:e-?mail|mail|apply|applications?)\s*(?::|-|here)?\s*[^\s@]+@|\b(?:reach out to|contact at)\s+[^\s@]+@/i.test(clause);
 });
}

export function emailContacts(input:Input):EmailContact[]{
 const found:EmailContact[]=[];
 const add=(text:string,context:string,source:EmailContact['source'])=>{if(!mailIntent(context))return;for(const address of extractEmails(text)){if(!found.some(c=>c.address.toLowerCase()===address.toLowerCase()))found.push({address,source});}};
 const post=input.inspectionText||input.text;
 // Scope intent to nearby text rather than a distant, unrelated contact address.
 for(const match of post.matchAll(/[^\n]+/g)){const line=match[0];const addresses=extractEmails(line);for(const address of addresses){const i=line.indexOf(address);add(address,line.slice(Math.max(0,i-180),i+address.length+100),'body');}}
 // Also support a line break between "email your CV to" and its address.
 for(const address of extractEmails(post)){const i=post.indexOf(address);add(address,post.slice(Math.max(0,i-120),i+address.length+60),'body');}
 for(const c of input.linkCandidates||[]){let value=c.href;if(/^mailto:/i.test(value)){try{value=decodeURIComponent(value.slice(7).split('?')[0]).replace(/[,;]/g,' ');}catch{continue;}}
  add(value,c.text+' '+value+' '+c.context,c.source);
 }
 for(const a of input.anchors){if(/^mailto:/i.test(a.href)){try{add(decodeURIComponent(a.href.slice(7).split('?')[0]),a.text+' '+decodeURIComponent(a.href.slice(7).split('?')[0])+' '+input.text,'anchor');}catch{}}}
 return found.slice(0,5);
}
export function applicationsClosed(text:string){
 const pattern=/\b(?:(?:applications?|registrations?|hiring|recruitment)\s*(?:(?:is|are|has|have)\s+)?(?:now\s+)?(?:been\s+)?(?:closed|paused|ended|halted)|(?:no longer|not)\s+accepting\s+(?:new\s+)?applications?|(?:role|position|vacancy|opening)\s+(?:(?:has|have|is|was|been|now)\s+)*(?:filled|closed)|(?:hiring|recruitment)\s+freeze)\b/gi;
 for(const m of text.matchAll(pattern)){
  const before=text.slice(Math.max(0,m.index!-55),m.index!),after=text.slice(m.index!+m[0].length,m.index!+m[0].length+35);
  if(/\b(?:if|when|once|until|unless|before|after|whether)\b[^.!?\n]*$/i.test(before)||/\b(?:not|never)\s+(?:yet\s+)?$/i.test(before))continue;
  if(/^\s+(?:tomorrow|next\b|on\b|by\b|soon\b)/i.test(after))continue;
  // A more recent explicit reopening supersedes an earlier closure in the same post.
  if(/\b(?:applications?|hiring|recruitment)\s+(?:(?:are|is)\s+)?(?:now\s+)?(?:reopened|open again)\b/i.test(text.slice(m.index!+m[0].length)))continue;
  return true;
 }return false;
}

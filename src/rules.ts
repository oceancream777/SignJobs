import {jobContext,metadataLine} from './job-context';
import {roleFallback,validateRoleExplanation,uninformativeWork} from './role-reasoning';
import {applicationsClosed,emailContacts} from './contact';
import {hasHiringInvitation} from './vocabulary';
import {defaults,safeUrl} from './settings';
import type {Input,Link,Summary,Settings} from './types';
export const normal=(s:string)=>s.toLowerCase().replace(/[’‘]/g,"'").replace(/#/g,'').replace(/\s+/g,' ').trim();
const escape=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function phrase(s:string){return new RegExp('\\b'+escape(normal(s)).replace(/ /g,'\\s*')+'\\b','i');}
export function affirmative(text:string,cues:string[],kind:'dm'|'comments') {
 const normalized=normal(text);
 // Scope negation to the sentence/clause containing the cue; quoted third-party advice is not an author instruction.
 for(const sentence of normalized.split(/[.!?;\n]+/)){
  if(!cues.some(c=>phrase(c).test(sentence)))continue;
  if(kind==='dm'&&/\b(?:don't|do not|dont|never|no|stop|avoid|not)\b.{0,45}\b(?:dm\w*|messag\w*|inbox|ping|reach out)\b|\b(?:dms?|messages?)\b.{0,22}\b(?:not|never)\s+(?:needed|required|accepted|necessary)\b|\b(?:dm|message)\b.{0,20}\b(?:is|means|stands for)\b/.test(sentence))continue;
  if(kind==='comments'&&/\b(?:don't|do not|no|not|never)\b.{0,35}\b(?:link|comments?|details)\b|\b(?:link|details)\b.{0,20}\b(?:isn't|is not|not|aren't)\b/.test(sentence))continue;
  if(/\b(?:people|recruiters|they|others)\s+(?:say|write|ask)\b/.test(sentence))continue;
  return true;
 }
 // Support common explicit grammar not restricted to exact configured phrases.
 if(kind==='comments')return /\b(?:apply\s+|application\s+)?(?:link|details)\s+(?:is |are |has been |can be found )?(?:shared |posted |provided )?(?:in|in the|in my|in the first)\s+comments?\b/i.test(normalized)&&!/(?:no|not|isn't|aren't)\s+(?:a |the )?(?:link|in)/i.test(normalized);
 return false;
}
export function decodeLink(raw:string){raw=raw.replace(/[.,;!?]+$/,'');for(const [open,close] of [['(',')'],['[',']'],['{','}']])while(raw.endsWith(close)&&raw.split(close).length>raw.split(open).length)raw=raw.slice(0,-1);if(!/^https?:\/\//i.test(raw))return null;const clean=safeUrl(raw);if(!clean)return null;let u=new URL(clean);let target=u;
 if(/(^|\.)linkedin\.com$/.test(u.hostname)&&u.pathname==='/safety/go'){const decoded=u.searchParams.get('url');const safe=safeUrl(decoded);if(!safe||!/^https?:\/\//i.test(safe))return null;target=new URL(safe);}
 const host=target.hostname.toLowerCase();const linkedinJob=/(^|\.)linkedin\.com$/.test(host)&&/^\/jobs\/view\//.test(target.pathname);
 if(((/(^|\.)linkedin\.com$/.test(host)&&!linkedinJob)||/^(?:www\.)?(?:twitter\.com|x\.com|instagram\.com|facebook\.com|youtube\.com)$/.test(host)))return null;
 const label=new URL(target.href);for(const k of [...label.searchParams.keys()])if(/^utm_|^(?:ref|source|trackingId)$/i.test(k))label.searchParams.delete(k);
 const kind=linkedinJob?'LinkedIn job':(host==='forms.gle'||host==='docs.google.com'&&/^\/forms\//.test(target.pathname))?'Google Forms':/(^|\.)lever\.co$/.test(host)?'Lever':/(^|\.)greenhouse\.io$/.test(host)?'Greenhouse':/(^|\.)ashbyhq\.com$/.test(host)?'Ashby':/(^|\.)myworkdayjobs\.com$/.test(host)?'Workday':host==='lnkd.in'?'LinkedIn short link':/career|\/jobs?\/|\/apply\b/i.test(target.href)?'Employer application':'External link';
 return {url:clean,display:label.href,kind,priority:kind==='External link'?1:kind==='LinkedIn short link'?3:5};
}
export function extractLinks(input:Input):Link[]{const result:Link[]=[];
 const add=(raw:string,source:Link['source'],afterCutoff=false,anchorText='',context='',evidence='text')=>{const link=decodeLink(raw);if(!link)return;
 const explicit=/\b(?:apply|application|submit (?:your )?(?:cv|resume)|send (?:your )?(?:cv|resume)|register|view job)\b/i.test(anchorText);
 const promotional=/\b(?:blog|newsletter|subscribe|read more|portfolio|privacy|terms|share|follow)\b/i.test(anchorText);
 const applicationKind=['Google Forms','Lever','Greenhouse','Ashby','Workday','Employer application','LinkedIn job'].includes(link.kind);
 const short=link.kind==='LinkedIn short link';
 const isApplication=!promotional&&(applicationKind||explicit||short);
 const priority=link.priority+(applicationKind?12:0)+(explicit?14:0)+(short?5:0)-(promotional?30:0)+(source==='comment'?-4:0);
 const candidate:Link={...link,source,afterCutoff,priority,isApplication,evidence};
 const existing=result.findIndex(l=>l.display===link.display);
 if(existing<0)result.push(candidate);else {const old=result[existing];const hidden=old.afterCutoff||afterCutoff;if(candidate.priority>old.priority)result[existing]=candidate;result[existing].afterCutoff=hidden;}
 };
 if(input.linkCandidates){for(const c of input.linkCandidates)add(c.href,c.source,c.afterCutoff,c.text,c.context,c.evidence);}
 // Keep compatible inputs and body-only text discovery; never let a preview URL replace a real href.
 for(const m of input.text.matchAll(/https?:\/\/[^\s<>"\u201c\u201d]+|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi))add(m[0].includes('@')&&!m[0].startsWith('http')?'mailto:'+m[0]:m[0],'body',input.previewLength!==null&&m.index!>=input.previewLength,'',input.text.slice(Math.max(0,m.index!-100),m.index!+m[0].length+60));
 for(const a of input.anchors)add(a.href,'anchor',a.afterCutoff,a.text,'','href');
 for(const c of input.comments){for(const a of c.anchors)add(a.href,'comment',false,a.text,'','href');for(const m of c.text.matchAll(/https?:\/\/[^\s<>"\u201c\u201d]+/g))add(m[0],'comment',false,'',c.text);}
 return result.sort((a,b)=>Number(b.isApplication)-Number(a.isApplication)||b.priority-a.priority||Number(a.source==='comment')-Number(b.source==='comment')).slice(0,3);
}

export function summarize(input:Input,settings:Settings=defaults):Summary {
 const text=input.text+'\n'+(input.inspectionText||''),facts=jobContext(input.text,input.inspectionText),n=normal(text),links=extractLinks(input),emails=emailContacts(input),applicationStatus=applicationsClosed(input.inspectionText||text)?'closed' as const:'unknown' as const;
 const seeking=/\b(?:i am|i'm|actively|currently)\s+(?:looking for|seeking)\s+(?:a |an )?(?:job|role|opportunit|internship)/i.test(n);
 const fresher=/\b(?:freshers?|recent graduates?|new graduates?|fresh graduates?|graduate trainee|graduate program(?:me)?)\b/.test(n)&&!/\b(?:no freshers|freshers (?:are )?not (?:eligible|accepted|allowed))\b/.test(n);
 const batch2026=/\b2026\s*(?:batch|graduates?|graduat(?:ing|ion)|pass[ -]?outs?)\b|\b(?:batch|class)\s*(?:of|:|-)?\s*2026\b|\b(?:graduated|graduating|passed out)\s*(?:in|:)?\s*2026\b|\b(?:graduation|pass[ -]?out)\s*(?:year)?\s*[:–-]?\s*2026\b/.test(n);
 const graduate=fresher||batch2026;
 const hiring=hasHiringInvitation(text)&&!seeking&&!/\b(?:not hiring|hiring freeze|no openings)\b/.test(n);
 const categories=settings.taxonomy.filter(t=>t.name!=='Intern').map(t=>{let best=-1;for(const term of t.terms){const m=phrase(term).exec(n);if(!m)continue;if(['pm','ba'].includes(normal(term))){const before=n.slice(Math.max(0,m.index-40),m.index),after=n.slice(m.index+term.length,m.index+term.length+25);if(/\d\s*$/.test(before)||/^(?:\s+me|\s+us|\s+degree|\s+in\s)/.test(after)||!hiring||!(/(?:role|position|hiring|looking for|opening)(?:\s+(?:for|an?|the|junior|associate))?\s*[:–-]?\s*$/.test(before)||/^\s+(?:intern|role|position|opening)\b/.test(after)))continue;}const score=1000-m.index+term.length;if(score>best)best=score;}return {name:t.name,score:best};}).filter(x=>x.score>=0).sort((a,b)=>b.score-a.score);
 const intern=/\b(?:intern(?:ship)?s?|trainee|apprentice(?:ship)?|summer analyst)\b/.test(n);
 const category=!hiring?'Not hiring':categories[0]?.name||(intern?'Intern':graduate?'Graduate / Fresher':'Other');
 const roleTitle=facts.roleTitle|| (category==='Not hiring'?'Hiring opportunity':category);
 const field=(label:string)=>new RegExp('(?:^|\\n|[|•])\\s*'+label+'\\s*[:–-]\\s*([^\\n|•]{2,90})','i').exec(text)?.[1]?.trim()||null;
 const company=facts.company,location=facts.location;
 const experience=field('experience')||/\b(?:\d+\s*[-–]\s*\d+\s*(?:years?|months?)|\d+\+?\s*(?:years?|months?)\s*(?:of )?experience|freshers?|no (?:prior |previous )?experience|entry[ -]level|senior|junior)\b/i.exec(text)?.[0]||null;
 const employmentType=intern?'Intern / apprentice':/\bfull[ -]time\b/i.test(text)?'Full-time':/\bpart[ -]time\b/i.test(text)?'Part-time':/\bcontract\b/i.test(text)?'Contract':null;
 const bodyLink=links.find(l=>l.source!=='comment'),commentLink=links.find(l=>l.source==='comment');
 const linkInComments=!bodyLink&&affirmative(text,settings.commentCues,'comments');
 const needsDM=affirmative(text,settings.dmCues,'dm');
 const baitMarker=bodyLink?(bodyLink.afterCutoff?'after-cutoff':'visible'):commentLink?'in-comments':linkInComments?'in-comments':needsDM?'dm':input.textTruncated?'continues':'none';
 const sentences=text.split(/\n|(?<=[.!?])\s+/).filter(l=>!/^https?:/i.test(l.trim())&&!/ignore previous|system prompt/i.test(l));
 const duty=sentences.find(l=>/you(?:'ll| will)|responsibil|work on|your role/i.test(l))||sentences.find(l=>/\b(?:build|research|analy[sz]e|manage|design|support|develop)\b/i.test(l)&&!/\bhiring\b/i.test(l));
 const summaryBase=(duty?.trim().slice(0,230)||(hiring?`${roleTitle}${company?' at '+company:''}${location?' · '+location:''}. Primary responsibilities are not stated in the available text.`:'No clear hiring invitation detected in the available text.'));
 const result:Summary={postId:input.postId,postUrl:input.postUrl,author:input.author,category,badges:[...(intern?['Intern']:[]),...(fresher?['Fresher / Graduate']:[]),...(batch2026?['2026 Batch']:[]),...(/\bremote\b/i.test(text)?['Remote']:[])],roleTitle,company,location,employmentType,experience,links,emails,applicationStatus,linkInComments,needsDM,baitMarker,linkState:links.length?'found':input.linkInspection?.limited?'incomplete':input.textTruncated?'not-loaded':'not-found',summaryBase,roleExplanation:roleFallback(roleTitle,text,duty,metadataLine(facts)),summary:'',textTruncated:input.textTruncated,confidence:hiring?(categories.length?.8:.55):.6,source:'rules',modelRevision:null};
 result.summary=withOutcome(result);return result;
}
export function withOutcome(s:Summary){const notes=[];if(s.applicationStatus==='closed')notes.push('Applications closed');if(s.linkInComments&&!s.links.some(l=>l.source!=='comment'))notes.push('Link in comments');if(s.needsDM)notes.push('Need to DM');if(!s.links.length&&!notes.length&&s.textTruncated)notes.push('Post continues, link not in the available text');return [s.summaryBase,...notes].join(' · ');}
export function applyModel(base:Summary,output:any,text:string,revision:string):Summary {
 const roleExplanation=validateRoleExplanation(output,text);
 if(base.roleExplanation&&!uninformativeWork(base.roleExplanation.work)&&uninformativeWork(roleExplanation.work))throw Error('Model withheld tasks despite a useful role interpretation');
 const facts=jobContext(text);const details=metadataLine(facts);if(details)roleExplanation.context=details;
 const next:Summary={...base,roleExplanation,summaryBase:roleExplanation.work+'\n'+roleExplanation.context,source:'on-device',modelRevision:revision};
 next.summary=withOutcome(next);return next;
}

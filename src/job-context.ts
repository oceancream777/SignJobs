/** Resolve job entities from complete post text, not the first token following "hiring". */
export function cleanPost(text:string){return text.replace(/[’‘]/g,"'").replace(/\p{Extended_Pictographic}|\uFE0F|\u200D/gu,'').replace(/\r/g,'').replace(/[ \t]+/g,' ');}
const cleanValue=(s:string)=>s.replace(/^[\s*•:|–—-]+/,'').replace(/\s*(?:\.{3}|…)\s*(?:more)?\s*$/i,'').replace(/\s*[.!|]+\s*$/,'').trim();
export function postField(text:string,label:string){return cleanValue(new RegExp('(?:^|\\n|[|•])\\s*[*_]*\\s*(?:'+label+')\\s*[*_]*\\s*[:–-]\\s*[*_]*\\s*([^\\n|•]{2,100})','i').exec(cleanPost(text))?.[1]||'')||null;}
const roleSource=String.raw`\b(?:(?:associate|junior|senior|graduate|assistant)\s+)?(?:product\s+(?:management|manager|ops|operations|marketer|marketing|design(?:er)?|development|builder|support|owner|analyst|intern(?:ship)?s?)|business\s+(?:analyst|analytics)|(?:consumer|market|user|UX)\s+research(?:er)?|research\s+(?:analyst|intern|assistant)|(?:AI|artificial intelligence)\s+(?:product|builder|agent|automation|intern)|(?:full.stack|front.end|back.end|software|web)\s+(?:engineer(?:ing)?|developer|intern)|(?:founder's?\s+office|chief of staff)|(?:data|financial|risk)\s+analyst|(?:project|program|programme)\s+(?:manager|management|coordinator)|(?:operations|merchandise|merchandising|strategy|consulting|creative|graphic design)(?:\s+(?:analyst|manager))?|fruit(?:s)?\s+sorter)(?:\s+(?:intern(?:ship)?s?|trainee|associate|apprentice))?\b`;
const roleMatches=(text:string)=>[...text.matchAll(new RegExp(roleSource,'gi'))].map(m=>cleanValue(m[0]));
const generic=/^(?:ALERT|hiring|again|interns?:?|Other|Not hiring|Graduate \/ Fresher|at\b.*)$/i;
export function jobContext(primary:string,extra=''){
 const text=cleanPost(primary),full=cleanPost(primary+'\n'+extra),lines=text.split(/\n+/).map(s=>s.trim()).filter(Boolean);
 let company=postField(full,'company|employer|organisation|organization');
 if(!company){const at=/\b(?:hiring\s+(?:again\s+)?at|join us at|team at)\s+([^\n.!|]{2,70})/i.exec(full);if(at)company=cleanValue(at[1]);}
 if(!company){for(const line of full.split(/[|\n]/)){const m=/^\s*(?:we(?:'re| are)\s+)?([\p{L}\p{N}][\p{L}\p{N} .&'-]{1,65}?)\s+(?:is|are)\s+(?:now\s+)?hiring\b/iu.exec(line);if(m&&!/\b(?:we|alert|hiring)\b/i.test(m[1])){company=cleanValue(m[1]);break;}}}
 const explicit=postField(full,'role|position|job title');let roleTitle=explicit&&roleMatches(explicit).length?explicit:null;
 const invitations=lines.filter(l=>/\bhiring\b|\blooking (?:for|to onboard)\b/i.test(l));
 if(!roleTitle){for(const line of invitations){const cue=/\bhiring\b|\blooking (?:for|to onboard)\b/i.exec(line)!;const roles=roleMatches(line.slice(cue.index));if(roles.length){roleTitle=[...new Set(roles)].join(' & ');break;}}}
 if(!roleTitle){const found=roleMatches(text);if(found.length)roleTitle=found[0];}
 if(!roleTitle){const found=roleMatches(cleanPost(extra));if(found.length)roleTitle=found[0];}
 // Preserve unfamiliar, meaningful titles instead of restricting inference to this role vocabulary.
 if(!roleTitle){for(const m of text.matchAll(/(?:\bhiring\s*[|:!–-]?\s*(?:for\s+)?(?:an?\s+)?|\blooking for\s+(?:an?\s+)?)([^\n.!|]{3,100})/gi)){const value=cleanValue(m[1].replace(/\s+(?:at|with|to join|for our|in our)\s+.*$/i,'').replace(/\b(?:DM|link in|apply (?:at|here))\b.*$/i,''));if(value&&!generic.test(value)&&!/^at\s|^(?:a |an )?job or internship\b/i.test(value)){roleTitle=value;break;}}}
 if(!company){const m=/\b(?:hiring|looking for)\b[^\n.!|]{0,120}?\s+at\s+([^\n.!|]{2,65})/i.exec(full);if(m)company=cleanValue(m[1]);}
 const location=postField(full,'location|work location')||(/\bremote\b/i.test(text)?'Remote':null);
 const stipend=postField(full,'stipend|salary|compensation')||full.match(/(?:₹|INR|Rs\.?|USD|GBP|EUR|\$|£|€)\s*[\d,]+(?:\s*[kK])?(?:\s*[-–]\s*(?:(?:₹|INR|Rs\.?)\s*)?[\d,]+(?:\s*[kK])?)?(?:\s*(?:\/|per\s+)(?:month|mo|year|annum|hour))?/i)?.[0]||null;
 const mode=postField(full,'work mode|mode')||(/\bhybrid\b/i.test(full)?'Hybrid':/\b(?:work from office|on.site)\b/i.test(full)?'On-site':null);
 return {company:company&&!generic.test(company)?company:null,roleTitle,location,stipend,mode,roles:roleTitle?roleTitle.split(' & '):[],text:full};
}
export function metadataLine(facts:ReturnType<typeof jobContext>){return [...new Set([facts.location,facts.mode,facts.stipend].filter(Boolean))].join(' · ');}

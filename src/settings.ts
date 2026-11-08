import type {Settings,Saved} from './types';
export const defaults:Settings={enabled:true,collapsed:false,mode:'rules',modelReady:false,taxonomy:[
 {name:'Product Management',terms:['product manager','product management','associate product manager','product owner','APM','PM']},
 {name:'Business Analyst',terms:['business analyst','business analysis','systems analyst','BA']},
 {name:'AI Builder',terms:['AI builder','AI product','AI automation','no-code','AI agent']},
 {name:'Consulting & Research',terms:['consultant','consulting','market research','consumer research','research analyst']},
 {name:'Intern',terms:['intern','internship','apprentice','apprenticeship','trainee','summer analyst']}
],commentCues:['link in comments','link in the comments','apply link in comments','details in the comments','check the comments','link in the first comment'],dmCues:['DM me','DM us','DM','send a DM','drop a DM','message me','inbox me','ping me','reach out to me on LinkedIn']};
export function validateSettings(raw:any):Settings {
 const out={...defaults};if(typeof raw?.enabled==='boolean')out.enabled=raw.enabled;if(typeof raw?.collapsed==='boolean')out.collapsed=raw.collapsed;if(['rules','auto'].includes(raw?.mode))out.mode=raw.mode;
 if(raw?.taxonomy!==undefined){if(!Array.isArray(raw.taxonomy)||raw.taxonomy.length<1||raw.taxonomy.length>20)throw Error('Use 1–20 categories');out.taxonomy=raw.taxonomy.map((t:any)=>{if(typeof t.name!=='string'||!t.name.trim()||t.name.length>50||['Other','Not hiring','Untagged'].includes(t.name)||!Array.isArray(t.terms)||!t.terms.length||t.terms.length>30||t.terms.some((s:any)=>typeof s!=='string'||!s.trim()||s.length>80))throw Error('Invalid category or synonym list');return {name:t.name.trim(),terms:t.terms.map((s:string)=>s.trim())};});}
 for(const key of ['commentCues','dmCues'] as const){if(raw?.[key]!==undefined){if(!Array.isArray(raw[key])||raw[key].length>40||raw[key].some((s:any)=>typeof s!=='string'||!s.trim()||s.length>100))throw Error('Invalid cue list');out[key]=raw[key];}}
 // Download state comes only from the model manager, never from an import.
 out.modelReady=raw?.modelReady===true;if(typeof raw?.modelRevision==='string')out.modelRevision=raw.modelRevision;return out;
}
export function safeUrl(value:unknown):string|null{if(typeof value!=='string'||value.length>4000)return null;try{const u=new URL(value);if(!['https:','http:','mailto:'].includes(u.protocol)||u.username||u.password)return null;return u.href;}catch{return null;}}
export function savedItem(raw:any):Saved{if(typeof raw?.postId!=='string'||raw.postId.length>200||typeof raw.roleTitle!=='string'||raw.roleTitle.length>180||!['saved','applied'].includes(raw.status))throw Error('Invalid saved item');return {postId:raw.postId,postUrl:safeUrl(raw.postUrl),roleTitle:raw.roleTitle,company:typeof raw.company==='string'?raw.company.slice(0,150):null,applyUrl:safeUrl(raw.applyUrl),status:raw.status,timestamp:new Date(Number.isFinite(Date.parse(raw.timestamp))?raw.timestamp:Date.now()).toISOString()};}

import test from 'node:test';import assert from 'node:assert/strict';import {jobContext} from '../src/job-context';import {summarize,applyModel} from '../src/rules';import type {Input} from '../src/types';
const post=(text:string,inspectionText?:string):Input=>({postId:'context',text,inspectionText,author:'Poster',postUrl:null,previewLength:null,textTruncated:false,anchors:[],comments:[]});
const reelo=`🚀 We're Hiring at Reelo! 🎉 | Product Ops Intern & Product Marketer
We're growing our team and have two roles.
1. Product Ops Intern
You'll get hands-on exposure to:
- APIs, debugging and troubleshooting.
- Root-cause analysis and integrations.
Location: Ahmedabad | Work from Office
2. Product Marketer
Build our product marketing function from the ground up.
Drive product adoption and retention.
Interested? DM me.`;
const puma=`🚨 HIRING ALERT | PUMA IS HIRING A PRODUCT INTERN! 👟
🏢 Company: PUMA
💼 Position: Product Intern
📍 Location: Bengaluru, Karnataka
⏳ Duration: 3 Months
Stipend: ₹25,000/month
Apply https://forms.gle/puma`;
test('Reelo headline separates employer from the two actual roles',()=>{const s=summarize(post(reelo));assert.equal(s.company,'Reelo');assert.equal(s.roleTitle,'Product Ops Intern & Product Marketer');assert.match(s.roleExplanation!.work,/integrations/);assert.match(s.roleExplanation!.context,/Ahmedabad/);assert.doesNotMatch(s.roleExplanation!.work,/^Likely|ambiguous/);assert.ok(!reelo.includes(s.roleExplanation!.work));});
test('PUMA hiring alert resolves company, role and useful concrete details',()=>{const s=summarize(post(puma));assert.equal(s.company,'PUMA');assert.equal(s.roleTitle,'Product Intern');assert.match(s.roleExplanation!.work,/product delivery/);assert.match(s.roleExplanation!.context,/Bengaluru/);assert.match(s.roleExplanation!.context,/₹25,000/);assert.doesNotMatch(s.roleTitle,/ALERT/);});
test('Banner alone in preview does not prevent using complete inspected DOM context',()=>{const s=summarize(post('HIRING ALERT',puma));assert.equal(s.company,'PUMA');assert.equal(s.roleTitle,'Product Intern');assert.match(s.roleExplanation!.context,/Bengaluru/);});
test('Inline company announcement is resolved without a Company label',()=>{const c=jobContext('HIRING ALERT | PUMA IS HIRING A PRODUCT INTERN!');assert.equal(c.company,'PUMA');assert.equal(c.roleTitle?.toLowerCase(),'product intern');});
test('Explicit role field beats biography and banner tokens',()=>{const s=summarize(post('Author: Senior Product Manager\nHIRING ALERT\nPosition: Business Analyst Intern\nCompany: Example\nLocation: Noida'));assert.equal(s.roleTitle,'Business Analyst Intern');assert.equal(s.company,'Example');});
test('Task headings are not mistaken for the work itself; task text is paraphrased',()=>{const s=summarize(post("Hiring a Product Intern\nYou'll work on:\n- Product research and competitor analysis\n- Defining product features\nLocation: Mumbai"));assert.match(s.roleExplanation!.work,/Compare markets|deliver product/);assert.doesNotMatch(s.roleExplanation!.work,/work on:|^Responsibilities$/);assert.match(s.roleExplanation!.context,/Mumbai/);});
test('Missing pay and location are never invented',()=>{const s=summarize(post('We are hiring a Product Intern at Example'));assert.equal(s.location,null);assert.doesNotMatch(s.roleExplanation!.context,/₹|Bengaluru|stipend/);});
test('Paragraph-style invitation gets a role and company from full text',()=>{const c=jobContext('Exciting opportunities! We are hiring a Product Intern at Example.');assert.equal(c.roleTitle,'Product Intern');assert.equal(c.company,'Example');});

test('Vague model output and source-copying cannot replace a useful interpretation',()=>{const text='Hiring a Product Intern. You will interview users and write product requirements.';const base=summarize(post(text));for(const work of ['Role is ambiguous and specific tasks are unclear.','You will interview users and write product requirements.','Likely: You will interview users and write product requirements.'])assert.throws(()=>applyModel(base,{work,context:'Other details depend on the role.',evidence:['Product Intern']},text,'b'.repeat(40)));});
